import { type NextRequest, NextResponse } from "next/server"

// Use environment variable with fallback
const AGE_API_URL = process.env.AGE_API_URL || "https://face.simic.app/api/age/"

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64String = reader.result as string
      const base64Content = base64String.split(",")[1]
      resolve(base64Content)
    }
    reader.onerror = (error) => reject(error)
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const apiKey = request.headers.get("X-API-KEY")

    // Debug: Log what we received (without exposing the full API key)
    console.log("Received age request with API key:", apiKey ? `${apiKey.substring(0, 4)}...` : "missing")

    // Validate required fields
    if (!apiKey) {
      return NextResponse.json({ error: "X-API-KEY is required" }, { status: 400 })
    }

    const image = formData.get("image") as File | null

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 })
    }

    // Convert image to base64
    const imageBase64 = await fileToBase64(image)

    console.log("Forwarding request to age API...")
    console.log("Image size:", image.size, "bytes")
    console.log("Image type:", image.type)

    // Forward the request to the actual API with explicit timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      // Send base64 encoded image in the request body
      const requestBody = JSON.stringify({ image: imageBase64 })
      console.log("Request body length:", requestBody.length)

      const response = await fetch(AGE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Service-Code": "face",
          "X-API-KEY": apiKey,
        },
        body: requestBody,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Log the response status
      console.log("Age API response status:", response.status)
      console.log("Age API response headers:", Object.fromEntries(response.headers.entries()))

      // Get response as text first for debugging
      const responseText = await response.text()
      console.log("Age API response body:", responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""))

      // Try to parse as JSON
      let responseData
      try {
        responseData = responseText ? JSON.parse(responseText) : { error: "Empty response from API" }
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
        return NextResponse.json(
          {
            error: "Failed to parse API response as JSON",
            details: responseText.substring(0, 500),
          },
          { status: 500 },
        )
      }

      if (!response.ok) {
        console.error("API returned error status:", response.status, responseData)
        return NextResponse.json(
          {
            error: responseData?.message || `API returned error status: ${response.status}`,
            details: responseData,
            status: response.status,
          },
          { status: response.status },
        )
      }

      return NextResponse.json(responseData)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error("Fetch error:", fetchError)
      throw fetchError // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    console.error("Age API proxy error:", error)

    // Provide more specific error messages based on error type
    let errorMessage = "Internal server error"
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timed out after 30 seconds"
      } else {
        errorMessage = `Error: ${error.message}`
      }
    }

    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : String(error) },
      { status: 500 },
    )
  }
}
