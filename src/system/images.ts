export async function prepareImage(file: File, edge = 1450, limit = 450000) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, WebP, GIF, AVIF or BMP image.')
  }
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose an image smaller than 15 MB.')
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('This image could not be opened.') })
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Image conversion is unavailable.')
    let longest = Math.min(edge, Math.max(bitmap.width, bitmap.height))
    for (let attempt = 0; attempt < 5; attempt++) {
      const scale = longest / Math.max(bitmap.width, bitmap.height)
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const data = canvas.toDataURL('image/webp', .82 - .08 * attempt)
      if (data.length <= limit) return data
      longest *= .75
    }
    throw new Error('This image is too large to store.')
  } finally { bitmap.close() }
}
