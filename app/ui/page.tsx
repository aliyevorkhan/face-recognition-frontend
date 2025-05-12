"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, Info, Save, Trash2, Edit2 } from "lucide-react"
import Image from "next/image"

// Define types for API responses
type VerificationResponse = {
  message: string
  verified: boolean
  similarity_score: number
}

type ErrorResponse = {
  error: string
  details?: any
  status?: number
}

// Local storage key
const API_KEY_STORAGE_KEY = "face-verification-api-key"

export default function FaceVerification() {
  const [apiKey, setApiKey] = useState("")
  const [isApiKeySaved, setIsApiKeySaved] = useState(false)
  const [isEditingApiKey, setIsEditingApiKey] = useState(false)
  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [image1Preview, setImage1Preview] = useState<string | null>(null)
  const [image2Preview, setImage2Preview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<VerificationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  const fileInput1Ref = useRef<HTMLInputElement>(null)
  const fileInput2Ref = useRef<HTMLInputElement>(null)
  const apiKeyInputRef = useRef<HTMLInputElement>(null)

  // Load API key from local storage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY)
    if (savedApiKey) {
      setApiKey(savedApiKey)
      setIsApiKeySaved(true)
    } else {
      setIsEditingApiKey(true)
    }
  }, [])

  // Save API key to local storage
  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey)
      setIsApiKeySaved(true)
      setIsEditingApiKey(false)
    }
  }

  // Remove API key from local storage
  const removeApiKey = () => {
    localStorage.removeItem(API_KEY_STORAGE_KEY)
    setApiKey("")
    setIsApiKeySaved(false)
    setIsEditingApiKey(true)
    // Focus the input after a short delay to allow the UI to update
    setTimeout(() => {
      apiKeyInputRef.current?.focus()
    }, 100)
  }

  // Toggle editing mode for API key
  const toggleEditApiKey = () => {
    setIsEditingApiKey(!isEditingApiKey)
    // Focus the input after a short delay to allow the UI to update
    if (!isEditingApiKey) {
      setTimeout(() => {
        apiKeyInputRef.current?.focus()
      }, 100)
    }
  }

  const handleImage1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage1(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage1Preview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImage2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImage2(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage2Preview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!image1 || !image2 || !apiKey) {
      setError("All fields are required")
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDetails(null)
    setResponse(null)

    try {
      const formData = new FormData()
      formData.append("img1", image1)
      formData.append("img2", image2)

      console.log("Submitting verification request...")
      console.log("Image 1:", image1.name, `(${image1.size} bytes)`, image1.type)
      console.log("Image 2:", image2.name, `(${image2.size} bytes)`, image2.type)

      // Use our own API route instead of calling the external API directly
      const FACE_API_URL = process.env.FACE_API_URL || "https://face.simic.app/api/verify/"
      const res = await fetch(FACE_API_URL, {
        method: "POST",
        body: formData,
        headers: {
          "X-API-KEY": apiKey,
          "X-Service-Code": "face",
        },
      })

      const data = await res.json()
      console.log("API response:", data)

      if (!res.ok) {
        // Extract the error message and details from the response
        const errorMessage = typeof data.error === "string" ? data.error : "Failed to verify faces"
        setErrorDetails(data.details || data)
        throw new Error(errorMessage)
      }

      setResponse(data as VerificationResponse)
    } catch (err) {
      console.error("Verification error:", err)

      // Ensure we're getting a string error message
      let errorMessage = "An unknown error occurred"
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (err && typeof err === "object") {
        try {
          errorMessage = JSON.stringify(err)
        } catch {
          errorMessage = String(err)
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setImage1(null)
    setImage2(null)
    setImage1Preview(null)
    setImage2Preview(null)
    setResponse(null)
    setError(null)
    setErrorDetails(null)
    if (fileInput1Ref.current) fileInput1Ref.current.value = ""
    if (fileInput2Ref.current) fileInput2Ref.current.value = ""
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Face Verification</CardTitle>
          <CardDescription>Upload two face images to verify if they match the same person</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="apiKey" className="text-base">
                    X-API-KEY
                  </Label>
                  {isApiKeySaved && !isEditingApiKey && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-green-600 flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Saved
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={toggleEditApiKey} className="h-7 px-2">
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Input
                    id="apiKey"
                    ref={apiKeyInputRef}
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    required
                    className="flex-1"
                    disabled={isApiKeySaved && !isEditingApiKey}
                  />

                  {isEditingApiKey && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={saveApiKey}
                      disabled={!apiKey.trim()}
                      className="whitespace-nowrap"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save Key
                    </Button>
                  )}

                  {isApiKeySaved && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={removeApiKey}
                      className="whitespace-nowrap text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="image1" className="text-base">
                    First Image (Required)
                  </Label>
                  <div className="border rounded-md p-2 h-64 flex flex-col items-center justify-center bg-muted/30">
                    {image1Preview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={image1Preview || "/placeholder.svg"}
                          alt="First face"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Upload first face image</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="image1"
                    ref={fileInput1Ref}
                    type="file"
                    accept="image/*"
                    onChange={handleImage1Change}
                    required
                    className="mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image2" className="text-base">
                    Second Image (Required)
                  </Label>
                  <div className="border rounded-md p-2 h-64 flex flex-col items-center justify-center bg-muted/30">
                    {image2Preview ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={image2Preview || "/placeholder.svg"}
                          alt="Second face"
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">Upload second face image</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="image2"
                    ref={fileInput2Ref}
                    type="file"
                    accept="image/*"
                    onChange={handleImage2Change}
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle className="flex items-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  Error
                </AlertTitle>
                <AlertDescription>
                  <p>{error}</p>
                  {errorDetails && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDebug(!showDebug)}
                        className="text-xs flex items-center"
                      >
                        <Info className="h-3 w-3 mr-1" />
                        {showDebug ? "Hide" : "Show"} Debug Info
                      </Button>

                      {showDebug && (
                        <pre className="mt-2 text-xs p-2 bg-background rounded overflow-auto max-h-40">
                          {JSON.stringify(errorDetails, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-2">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Faces"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={isLoading}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>

        {response && (
          <CardFooter className="flex flex-col items-start">
            <div className="w-full">
              <Alert variant={response.verified ? "default" : "destructive"} className="mb-2">
                <div className="flex items-center">
                  {response.verified ? (
                    <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2" />
                  )}
                  <AlertTitle>{response.verified ? "Match Found" : "No Match"}</AlertTitle>
                </div>
                <AlertDescription className="mt-2">
                  <p>{response.message}</p>
                  <p className="mt-1 font-medium">Similarity Score: {(response.similarity_score * 100).toFixed(2)}%</p>
                </AlertDescription>
              </Alert>

              <div className="mt-4 bg-muted p-4 rounded-md">
                <p className="font-medium mb-2">API Response:</p>
                <pre className="text-xs overflow-auto p-2 bg-background rounded">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
