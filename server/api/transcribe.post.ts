import { readMultipartFormData, createError, defineEventHandler, getQuery } from 'h3'
import { useRuntimeConfig } from '#imports'
import OpenAI from 'openai'
import { promises as fsp } from 'fs'
import { createReadStream } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.openaiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Missing OPENAI_API_KEY' })
  }

  const form = await readMultipartFormData(event)
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: 'Expecting multipart/form-data' })
  }

  const audio = form.find((p) => p.name === 'file')
  if (!audio || !audio.data || !audio.filename) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const tmpPath = join(tmpdir(), `${Date.now()}-${audio.filename}`)
  await fsp.writeFile(tmpPath, audio.data)

  const client = new OpenAI({ apiKey: config.openaiApiKey as string })

  try {
    const transcription = await client.audio.transcriptions.create({
      file: createReadStream(tmpPath) as any,
      model: 'whisper-1',
      language: 'zh'
    })

    let text = (transcription as any).text as string

    const { traditional } = getQuery(event)
    const shouldTraditional = traditional !== 'false'
    if (shouldTraditional && text) {
      const converted = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a converter that outputs Traditional Chinese only, preserving meaning and formatting. Do not add commentary.'
          },
          { role: 'user', content: `請將以下文字轉換為繁體中文：\n\n${text}` }
        ],
        temperature: 0
      })
      text = converted.choices[0]?.message?.content?.trim() || text
    }

    return { text }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Transcription failed' })
  } finally {
    try { await fsp.unlink(tmpPath) } catch {}
  }
})


