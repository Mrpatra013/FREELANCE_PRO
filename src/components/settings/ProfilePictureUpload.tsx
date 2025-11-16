'use client'

import { useEffect, useRef, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

type ProfilePictureUploadProps = {
  value?: string
  onChange: (url: string | undefined) => void
}

export function ProfilePictureUpload({ value, onChange }: ProfilePictureUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(value)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setPreview(value)
  }, [value])

  const handleSelect = () => {
    inputRef.current?.click()
  }

  const validateFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, or GIF allowed')
      return false
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max file size is 5MB')
      return false
    }
    return true
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!validateFile(file)) return

    const reader = new FileReader()
    reader.onload = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    const form = new FormData()
    form.append('file', file)

    setUploading(true)
    setProgress(0)

    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload/profile-picture')
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            const pct = Math.round((ev.loaded / ev.total) * 100)
            setProgress(pct)
          }
        }
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const resp = JSON.parse(xhr.responseText)
                onChange(resp.url)
                resolve()
              } catch {
                reject(new Error('Invalid server response'))
              }
            } else {
              reject(new Error('Upload failed'))
            }
          }
        }
        xhr.onerror = () => reject(new Error('Upload error'))
        xhr.send(form)
      })
      toast.success('Photo uploaded')
    } catch (e) {
      toast.error('Failed to upload photo')
      setPreview(value)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = () => {
    setPreview(undefined)
    onChange(undefined)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          {preview && <AvatarImage src={preview} alt="Profile" />}
          <AvatarFallback className="text-xl">U</AvatarFallback>
        </Avatar>
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleSelect} disabled={uploading}>
            Upload Photo
          </Button>
          {preview && (
            <Button type="button" variant="outline" onClick={removePhoto} disabled={uploading}>
              Remove
            </Button>
          )}
        </div>
        {uploading && <Progress value={progress} />}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </div>
  )
}