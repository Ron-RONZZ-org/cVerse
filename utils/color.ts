/**
 * Desaturate a hex color by a given percentage.
 *
 * @param hex - 6-character hex color string (e.g. "#2563eb")
 * @param amount - Desaturation amount 0-100 (0 = no change, 100 = fully gray)
 * @returns Desaturated hex color string
 */
export function desaturateColor(hex: string, amount: number): string {
  // Clamp amount to 0-100
  const factor = Math.max(0, Math.min(100, amount)) / 100

  // Expand short hex (#xyz → #xxyyzz)
  let clean = hex.replace(/^#/, '')
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
  }

  // Parse RGB
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return hex // fallback on invalid input
  }

  // Convert RGB → HSL
  const [h, s, l] = rgbToHsl(r, g, b)

  // Reduce saturation
  const newS = s * (1 - factor)

  // Convert back HSL → RGB → hex
  return hslToHex(h, newS, l)
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    if (max === r) {
      h = ((g - b) / delta + (g < b ? 6 : 0)) / 6
    } else if (max === g) {
      h = ((b - r) / delta + 2) / 6
    } else {
      h = ((r - g) / delta + 4) / 6
    }
  }

  return [h, s, l]
}

function hslToHex(h: number, s: number, l: number): string {
  let r: number
  let g: number
  let b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      let tt = t
      if (tt < 0) tt += 1
      if (tt > 1) tt -= 1
      if (tt < 1 / 6) return p + (q - p) * 6 * tt
      if (tt < 1 / 2) return q
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (x: number): string => {
    const clamped = Math.round(Math.max(0, Math.min(255, x * 255)))
    return clamped.toString(16).padStart(2, '0')
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}
