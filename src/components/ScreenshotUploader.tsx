'use client'
import { useState, useRef, useCallback } from 'react'

interface ScreenshotUploaderProps {
  screenshots: string[]
  onChange: (urls: string[]) => void
  cloudName?: string
  uploadPreset?: string
}

export default function ScreenshotUploader({
  screenshots, onChange,
  cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '',
}: ScreenshotUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!cloudName || !uploadPreset) {
      alert('Cloudinary not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your Vercel environment variables.')
      return null
    }
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', 'adextrades/trades')
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST', body: formData
      })
      const data = await res.json()
      return data.secure_url || null
    } catch (e) {
      console.error('Upload failed:', e)
      return null
    }
  }

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (!fileArr.length) return
    setUploading(true)
    const urls: string[] = []
    for (const file of fileArr) {
      const url = await uploadFile(file)
      if (url) urls.push(url)
    }
    onChange([...screenshots, ...urls])
    setUploading(false)
  }, [screenshots, onChange, cloudName, uploadPreset])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageFiles = items.filter(i => i.type.startsWith('image/')).map(i => i.getAsFile()).filter(Boolean) as File[]
    if (imageFiles.length) handleFiles(imageFiles)
  }, [handleFiles])

  const removeScreenshot = (index: number) => {
    onChange(screenshots.filter((_, i) => i !== index))
  }

  return (
    <div onPaste={handlePaste}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold-dim)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        📷 Screenshots
        <span style={{ color: 'var(--text-muted)', fontWeight: 400, letterSpacing: '0px', textTransform: 'none', fontSize: 11 }}>{screenshots.length} image{screenshots.length !== 1 ? 's' : ''}</span>
      </label>

      {/* Existing screenshots */}
      {screenshots.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {screenshots.map((url, i) => (
            <div key={i} style={{ position: 'relative', width: 80, height: 60 }}>
              <img src={url} alt={'screenshot ' + (i+1)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
              <button
                onClick={() => removeScreenshot(i)}
                style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--red)', border: 'none', color: 'white', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: '2px dashed', borderColor: dragOver ? 'var(--gold)' : 'var(--border)',
          borderRadius: 6, padding: '20px 16px', textAlign: 'center',
          cursor: 'pointer', background: dragOver ? 'var(--gold-glow)' : 'transparent',
          transition: 'all 0.15s',
        }}
      >
        {uploading ? (
          <div style={{ color: 'var(--gold)', fontSize: 12 }}>Uploading...</div>
        ) : (
          <>
            <div style={{ fontSize: 22, marginBottom: 6 }}>📁</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Drop images, paste from clipboard, or click to upload</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Supports PNG, JPG, GIF · Stored in cloud</div>
          </>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => e.target.files && handleFiles(e.target.files)} />
      </div>
    </div>
  )
}
