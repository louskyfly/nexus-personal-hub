import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'public', 'favicon.svg')
const outDir = join(root, 'public', 'icons')
await mkdir(outDir, { recursive: true })

await sharp(source).resize(192, 192).png().toFile(join(outDir, 'icon-192.png'))
await sharp(source).resize(512, 512).png().toFile(join(outDir, 'icon-512.png'))
await sharp(source).resize(180, 180).png().toFile(join(outDir, 'apple-touch-icon.png'))

// Maskable icons need a safe zone: render the mark smaller on a full-bleed plate.
const inner = await sharp(source).resize(360, 360).png().toBuffer()
await sharp({
  create: { width: 512, height: 512, channels: 4, background: '#070a12' },
})
  .composite([{ input: inner, left: 76, top: 76 }])
  .png()
  .toFile(join(outDir, 'maskable-512.png'))

console.log('NEXUS icons generated.')
