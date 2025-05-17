import { type NextRequest, NextResponse } from "next/server"

// Use environment variable with fallback
const FACE_API_URL = process.env.FACE_API_URL || "https://face.simic.app/api/verify/"

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
    console.log("Received request with API key:", apiKey ? `${apiKey.substring(0, 4)}...` : "missing")
    console.log(
      "FormData contains:",
      Array.from(formData.entries()).map(([key]) => key),
    )

    // Validate required fields
    if (!apiKey) {
      return NextResponse.json({ error: "X-API-KEY is required" }, { status: 400 })
    }

    const img1 = formData.get("img1") as File | null
    const img2 = formData.get("img2") as File | null

    if (!img1 || !img2) {
      return NextResponse.json({ error: "Both images are required" }, { status: 400 })
    }

    // Convert images to base64
    const img1Base64 = await fileToBase64(img1)
    const img2Base64 = await fileToBase64(img2)

    console.log("Forwarding request to external API...")

    // Forward the request to the actual API with explicit timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      // Send base64 encoded images in the request body
      const response = await fetch(FACE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Service-Code": "face",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({
          img1: img1Base64,
          img2: img2Base64,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Log the response status and headers for debugging
      console.log("External API response status:", response.status)
      console.log("External API response headers:", Object.fromEntries(response.headers.entries()))

      // Get response as text first for debugging
      const responseText = await response.text()
      console.log(
        "External API response body:",
        responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""),
      )

      // Try to parse as JSON
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        return NextResponse.json(
          {
            error: "Failed to parse API response as JSON",
            details: responseText.substring(0, 500),
          },
          { status: 500 },
        )
      }

      if (!response.ok) {
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
      throw fetchError // Re-throw to be caught by outer try/catch
    }
  } catch (error) {
    console.error("Verification proxy error:", error)

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
