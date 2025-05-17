"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle2, XCircle, Info, Save, Trash2, Edit2, Smile, Calendar, User } from "lucide-react"
import Image from "next/image"

// Define types for API responses
type VerificationResponse = {
  message: string
  verified: boolean
  similarity_score: number
}

type EmotionResponse = {
  emotion: string
  confidence: number
}

type AgeResponse = {
  age: number
  confidence: number
}

type GenderResponse = {
  gender: string
  confidence: number
}

type ErrorResponse = {
  error: string
  details?: any
  status?: number
}

// Local storage key
const API_KEY_STORAGE_KEY = "face-verification-api-key"

// Maximum image size in bytes (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
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

export default function FaceVerification() {
  const [activeTab, setActiveTab] = useState("verification")
  const [apiKey, setApiKey] = useState("")
  const [isApiKeySaved, setIsApiKeySaved] = useState(false)
  const [isEditingApiKey, setIsEditingApiKey] = useState(false)

  // Face verification state
  const [image1, setImage1] = useState<File | null>(null)
  const [image2, setImage2] = useState<File | null>(null)
  const [image1Preview, setImage1Preview] = useState<string | null>(null)
  const [image2Preview, setImage2Preview] = useState<string | null>(null)
  const [verificationResponse, setVerificationResponse] = useState<VerificationResponse | null>(null)

  // Emotion detection state
  const [emotionImage, setEmotionImage] = useState<File | null>(null)
  const [emotionImagePreview, setEmotionImagePreview] = useState<string | null>(null)
  const [emotionResponse, setEmotionResponse] = useState<EmotionResponse | null>(null)

  // Age detection state
  const [ageImage, setAgeImage] = useState<File | null>(null)
  const [ageImagePreview, setAgeImagePreview] = useState<string | null>(null)
  const [ageResponse, setAgeResponse] = useState<AgeResponse | null>(null)

  // Gender detection state
  const [genderImage, setGenderImage] = useState<File | null>(null)
  const [genderImagePreview, setGenderImagePreview] = useState<string | null>(null)
  const [genderResponse, setGenderResponse] = useState<GenderResponse | null>(null)

  // Shared state
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Refs
  const fileInput1Ref = useRef<HTMLInputElement>(null)
  const fileInput2Ref = useRef<HTMLInputElement>(null)
  const emotionFileInputRef = useRef<HTMLInputElement>(null)
  const ageFileInputRef = useRef<HTMLInputElement>(null)
  const genderFileInputRef = useRef<HTMLInputElement>(null)
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

  // Validate image size
  const validateImageSize = (file: File): boolean => {
    if (file.size > MAX_IMAGE_SIZE) {
      setError(`Image size exceeds the maximum limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`)
      return false
    }
    return true
  }

  // Image change handlers
  const handleImage1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!validateImageSize(file)) return

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
      if (!validateImageSize(file)) return

      setImage2(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage2Preview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEmotionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!validateImageSize(file)) return

      setEmotionImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setEmotionImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAgeImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!validateImageSize(file)) return

      setAgeImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAgeImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (!validateImageSize(file)) return

      setGenderImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setGenderImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Form submission handlers
  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey) {
      setError("API key is required")
      return
    }

    if (!image1 || !image2) {
      setError("Both images are required")
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDetails(null)
    setVerificationResponse(null)

    try {
      // Convert images to base64
      const img1Base64 = await fileToBase64(image1)
      const img2Base64 = await fileToBase64(image2)

      console.log("Submitting verification request directly to external API...")
      console.log("Image 1:", image1.name, `(${image1.size} bytes)`, image1.type)
      console.log("Image 2:", image2.name, `(${image2.size} bytes)`, image2.type)

      // Call the external API directly
      const FACE_API_URL = process.env.FACE_API_URL || "https://face.simic.app/api/verify/"
      const res = await fetch(FACE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
          "X-Service-Code": "face",
        },
        body: JSON.stringify({
          img1: img1Base64,
          img2: img2Base64,
        }),
      })

      const data = await res.json()
      console.log("API response:", data)

      if (!res.ok) {
        // Extract the error message and details from the response
        const errorMessage = typeof data.error === "string" ? data.error : "Failed to verify faces"
        setErrorDetails(data.details || data)
        throw new Error(errorMessage)
      }

      setVerificationResponse(data as VerificationResponse)
    } catch (err) {
      console.error("Verification error:", err)
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey) {
      setError("API key is required")
      return
    }

    if (!emotionImage) {
      setError("Image is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDetails(null)
    setEmotionResponse(null)

    try {
      // Convert image to base64
      const imageBase64 = await fileToBase64(emotionImage)

      console.log("Submitting emotion detection request directly to external API...")
      console.log("Image:", emotionImage.name, `(${emotionImage.size} bytes)`, emotionImage.type)

      // Call the external API directly
      const EMOTION_API_URL = process.env.EMOTION_API_URL || "https://face.simic.app/api/emotion/"
      const res = await fetch(EMOTION_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
          "X-Service-Code": "face",
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      })

      const data = await res.json()
      console.log("API response:", data)

      if (!res.ok) {
        const errorMessage = typeof data.error === "string" ? data.error : "Failed to detect emotion"
        setErrorDetails(data.details || data)
        throw new Error(errorMessage)
      }

      setEmotionResponse(data as EmotionResponse)
    } catch (err) {
      console.error("Emotion detection error:", err)
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey) {
      setError("API key is required")
      return
    }

    if (!ageImage) {
      setError("Image is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDetails(null)
    setAgeResponse(null)

    try {
      // Convert image to base64
      const imageBase64 = await fileToBase64(ageImage)

      console.log("Submitting age detection request directly to external API...")
      console.log("Image:", ageImage.name, `(${ageImage.size} bytes)`, ageImage.type)

      // Call the external API directly
      const AGE_API_URL = process.env.AGE_API_URL || "https://face.simic.app/api/age/"
      const res = await fetch(AGE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
          "X-Service-Code": "face",
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      })

      const data = await res.json()
      console.log("API response:", data)

      if (!res.ok) {
        const errorMessage = typeof data.error === "string" ? data.error : "Failed to detect age"
        setErrorDetails(data.details || data)
        throw new Error(errorMessage)
      }

      setAgeResponse(data as AgeResponse)
    } catch (err) {
      console.error("Age detection error:", err)
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!apiKey) {
      setError("API key is required")
      return
    }

    if (!genderImage) {
      setError("Image is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDetails(null)
    setGenderResponse(null)

    try {
      // Convert image to base64
      const imageBase64 = await fileToBase64(genderImage)

      console.log("Submitting gender detection request directly to external API...")
      console.log("Image:", genderImage.name, `(${genderImage.size} bytes)`, genderImage.type)

      // Call the external API directly
      const GENDER_API_URL = process.env.GENDER_API_URL || "https://face.simic.app/api/gender/"
      const res = await fetch(GENDER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
          "X-Service-Code": "face",
        },
        body: JSON.stringify({
          image: imageBase64,
        }),
      })

      const data = await res.json()
      console.log("API response:", data)

      if (!res.ok) {
        const errorMessage = typeof data.error === "string" ? data.error : "Failed to detect gender"
        setErrorDetails(data.details || data)
        throw new Error(errorMessage)
      }

      setGenderResponse(data as GenderResponse)
    } catch (err) {
      console.error("Gender detection error:", err)
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Common error handler
  const handleApiError = (err: any) => {
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
  }

  // Reset form handlers
  const resetVerificationForm = () => {
    setImage1(null)
    setImage2(null)
    setImage1Preview(null)
    setImage2Preview(null)
    setVerificationResponse(null)
    setError(null)
    setErrorDetails(null)
    if (fileInput1Ref.current) fileInput1Ref.current.value = ""
    if (fileInput2Ref.current) fileInput2Ref.current.value = ""
  }

  const resetEmotionForm = () => {
    setEmotionImage(null)
    setEmotionImagePreview(null)
    setEmotionResponse(null)
    setError(null)
    setErrorDetails(null)
    if (emotionFileInputRef.current) emotionFileInputRef.current.value = ""
  }

  const resetAgeForm = () => {
    setAgeImage(null)
    setAgeImagePreview(null)
    setAgeResponse(null)
    setError(null)
    setErrorDetails(null)
    if (ageFileInputRef.current) ageFileInputRef.current.value = ""
  }

  const resetGenderForm = () => {
    setGenderImage(null)
    setGenderImagePreview(null)
    setGenderResponse(null)
    setError(null)
    setErrorDetails(null)
    if (genderFileInputRef.current) genderFileInputRef.current.value = ""
  }

  // API Key input component (shared across tabs)
  const ApiKeyInput = () => (
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
  )

  // Error display component (shared across tabs)
  const ErrorDisplay = () =>
    error ? (
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
    ) : null

  // Form action buttons component (shared across tabs)
  const FormActions = ({ onReset }: { onReset: () => void }) => (
    <div className="flex space-x-2">
      <Button type="submit" disabled={isLoading} className="flex-1">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Submit"
        )}
      </Button>
      <Button type="button" variant="outline" onClick={onReset} disabled={isLoading}>
        Reset
      </Button>
    </div>
  )

  // Single image upload component (for emotion, age, gender)
  const SingleImageUpload = ({
    id,
    label,
    preview,
    onChange,
    inputRef,
  }: {
    id: string
    label: string
    preview: string | null
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    inputRef: React.RefObject<HTMLInputElement>
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      <div className="border rounded-md p-2 h-64 flex flex-col items-center justify-center bg-muted/30">
        {preview ? (
          <div className="relative w-full h-full">
            <Image src={preview || "/placeholder.svg"} alt="Face image" fill className="object-contain" />
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Upload face image</p>
          </div>
        )}
      </div>
      <Input id={id} ref={inputRef} type="file" accept="image/*" onChange={onChange} className="mt-1" />
    </div>
  )

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Face Analysis</CardTitle>
          <CardDescription>Analyze face images for verification, emotion, age, and gender</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="verification" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Verification
              </TabsTrigger>
              <TabsTrigger value="emotion" className="flex items-center gap-2">
                <Smile className="h-4 w-4" />
                Emotion
              </TabsTrigger>
              <TabsTrigger value="age" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Age
              </TabsTrigger>
              <TabsTrigger value="gender" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Gender
              </TabsTrigger>
            </TabsList>

            {/* Face Verification Tab */}
            <TabsContent value="verification">
              <form onSubmit={handleVerificationSubmit} className="space-y-6">
                <div className="space-y-4">
                  <ApiKeyInput />

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
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <ErrorDisplay />
                <FormActions onReset={resetVerificationForm} />
              </form>

              {verificationResponse && (
                <div className="mt-6">

                  <div className="mt-4 bg-muted p-4 rounded-md">
                    <p className="font-medium mb-2">API Response:</p>
                    <pre className="text-xs overflow-auto p-2 bg-background rounded">
                      {JSON.stringify(verificationResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Emotion Detection Tab */}
            <TabsContent value="emotion">
              <form onSubmit={handleEmotionSubmit} className="space-y-6">
                <div className="space-y-4">
                  <ApiKeyInput />
                  <SingleImageUpload
                    id="emotionImage"
                    label="Face Image (Required)"
                    preview={emotionImagePreview}
                    onChange={handleEmotionImageChange}
                    inputRef={emotionFileInputRef}
                  />
                </div>

                <ErrorDisplay />
                <FormActions onReset={resetEmotionForm} />
              </form>

              {emotionResponse && (
                <div className="mt-6">
                  <div className="mt-4 bg-muted p-4 rounded-md">
                    <p className="font-medium mb-2">API Response:</p>
                    <pre className="text-xs overflow-auto p-2 bg-background rounded">
                      {JSON.stringify(emotionResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Age Detection Tab */}
            <TabsContent value="age">
              <form onSubmit={handleAgeSubmit} className="space-y-6">
                <div className="space-y-4">
                  <ApiKeyInput />
                  <SingleImageUpload
                    id="ageImage"
                    label="Face Image (Required)"
                    preview={ageImagePreview}
                    onChange={handleAgeImageChange}
                    inputRef={ageFileInputRef}
                  />
                </div>

                <ErrorDisplay />
                <FormActions onReset={resetAgeForm} />
              </form>

              {ageResponse && (
                <div className="mt-6">
                  <div className="mt-4 bg-muted p-4 rounded-md">
                    <p className="font-medium mb-2">API Response:</p>
                    <pre className="text-xs overflow-auto p-2 bg-background rounded">
                      {JSON.stringify(ageResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Gender Detection Tab */}
            <TabsContent value="gender">
              <form onSubmit={handleGenderSubmit} className="space-y-6">
                <div className="space-y-4">
                  <ApiKeyInput />
                  <SingleImageUpload
                    id="genderImage"
                    label="Face Image (Required)"
                    preview={genderImagePreview}
                    onChange={handleGenderImageChange}
                    inputRef={genderFileInputRef}
                  />
                </div>

                <ErrorDisplay />
                <FormActions onReset={resetGenderForm} />
              </form>

              {genderResponse && (
                <div className="mt-6">
                  <div className="mt-4 bg-muted p-4 rounded-md">
                    <p className="font-medium mb-2">API Response:</p>
                    <pre className="text-xs overflow-auto p-2 bg-background rounded">
                      {JSON.stringify(genderResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
