export async function overlayQR(imageFile, url) {
  const img = await loadImage(imageFile)

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const maxW = 1200
  const scale = img.width > maxW ? maxW / img.width : 1
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const { default: QRCode } = await import('qrcode')
  const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
  const moduleCount = qr.modules.size

  const qrSize = Math.min(100, canvas.width * 0.14)
  const moduleSize = qrSize / moduleCount

  const padding = 8
  const margin = 12
  const totalSize = qrSize + padding * 2
  const qrX = Math.round(canvas.width - totalSize - margin)
  const qrY = Math.round(canvas.height - totalSize - margin)

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  roundRect(ctx, qrX, qrY, totalSize, totalSize, 10)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.modules.get(row, col)) {
        const x = qrX + padding + col * moduleSize
        const y = qrY + padding + row * moduleSize
        const s = Math.ceil(moduleSize)
        ctx.fillRect(Math.round(x), Math.round(y), s, s)
      }
    }
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92)
  })
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
