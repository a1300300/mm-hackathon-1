<template>
    <section class="container">
        <Hero title="Welcome to Nuxt 3" subtitle="Let's build something great." />
        <div class="content">
            <p>This is your new Nuxt 3 app. Edit <code>pages/index.vue</code> to get started.</p>
            <p>
                Learn more in the
                <a href="https://nuxt.com/docs" target="_blank" rel="noreferrer">Nuxt docs</a>.
            </p>
        </div>

        <div class="uploader">
            <h3>Upload MP3 to transcribe (繁體中文)</h3>
            <form @submit.prevent="onSubmit">
                <input type="file" accept="audio/mpeg,audio/mp3" @change="onFile" />
                <button :disabled="!file || loading">{{ loading ? 'Transcribing…' : 'Transcribe & Download SRT' }}</button>
            </form>
            <p v-if="error" class="error">{{ error }}</p>
            <div v-if="result" class="result">
                <h4>Transcript (preview)</h4>
                <textarea readonly rows="10">{{ result }}</textarea>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
useHead({ title: 'MM Hackathon 1' })

import { ref } from 'vue'

const file = ref<File | null>(null)
const loading = ref(false)
const error = ref('')
const result = ref('')

function onFile(e: Event) {
    const input = e.target as HTMLInputElement
    file.value = input.files && input.files[0] ? input.files[0] : null
}

async function onSubmit() {
    error.value = ''
    result.value = ''
    if (!file.value) {
        error.value = 'Please select an MP3 file.'
        return
    }
    try {
        loading.value = true
        const body = new FormData()
        body.append('file', file.value)
        const res = await fetch('/api/transcribe', {
            method: 'POST',
            body
        })
        if (!res.ok) {
            const msg = await res.text().catch(() => '')
            throw new Error(msg || `HTTP ${res.status} ${res.statusText}`)
        }

        // 下載 SRT（後端回傳附件/純文字）
        const cd = res.headers.get('Content-Disposition') || ''
        const match = /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(cd)
        const fileName = match ? decodeURIComponent(match[1]) : (file.value.name.replace(/\.(mp3|mpeg|wav|m4a)$/i, '') || 'transcription') + '.srt'

        const blob = await res.blob()
        // 預覽內容（可選）
        try {
            result.value = await blob.text()
        } catch {
            result.value = ''
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    } catch (e: any) {
        error.value = e?.message || 'Transcription failed'
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.container {
    max-width: 960px;
    margin: 40px auto;
    padding: 0 16px;
}
.content {
    margin-top: 24px;
    color: #333;
}
.uploader { margin-top: 32px; }
.uploader form { display: flex; gap: 12px; align-items: center; }
.uploader .error { color: #c00; margin-top: 8px; }
.uploader .result { margin-top: 16px; }
.uploader textarea { width: 100%; padding: 8px; }
a { color: #00DC82; text-decoration: none; }
code { background: #f3f3f3; padding: 2px 6px; border-radius: 4px; }
</style>