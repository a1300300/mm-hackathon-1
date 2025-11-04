<template>
  <section class="container">
    <Hero title="MM 共學會" subtitle="MP3音檔產生字幕" />
<!--    <div class="content">-->
<!--      <p>This is your new Nuxt 3 app. Edit <code>pages/index.vue</code> to get started.</p>-->
<!--      <p>-->
<!--        Learn more in the-->
<!--        <a href="https://nuxt.com/docs" target="_blank" rel="noreferrer">Nuxt docs</a>.-->
<!--      </p>-->
<!--    </div>-->

    <div class="uploader">
      <h3>上傳MP3音檔 (繁體中文)</h3>
      <form @submit.prevent="onSubmit">
        <input type="file" accept="audio/*" @change="onFile" />
        <button :disabled="!file || loading">{{ loading ? 'Processing…' : 'Transcribe & Download SRT' }}</button>
      </form>

      <!-- Progress Bar and Status -->
      <div v-if="loading" class="progress-container">
        <progress :value="uploadProgress" max="100"></progress>
        <span>{{ progressText }}</span>
      </div>

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

import { ref, computed } from 'vue'

const file = ref<File | null>(null)
const loading = ref(false)
const error = ref('')
const result = ref('')
const uploadProgress = ref(0)
const isUploading = ref(false)

const progressText = computed(() => {
  if (isUploading.value) {
    return `Uploading: ${uploadProgress.value.toFixed(0)}%`
  }
  return 'AI is processing, please wait...'
})


function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files && input.files[0] ? input.files[0] : null
}

// Warn user before leaving page during processing
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  e.preventDefault()
  e.returnValue = '' // Required for Chrome and other browsers
}

async function onSubmit() {
  error.value = ''
  result.value = ''
  if (!file.value) {
    error.value = 'Please select an audio file.'
    return
  }

  loading.value = true
  isUploading.value = true
  uploadProgress.value = 0

  // Prevent user from accidentally leaving the page
  window.addEventListener('beforeunload', handleBeforeUnload)

  const body = new FormData()
  body.append('file', file.value)

  const xhr = new XMLHttpRequest()
  xhr.open('POST', '/api/transcribe', true)

  // Track upload progress
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      uploadProgress.value = (event.loaded / event.total) * 100
    }
  }

  // When upload finishes, update status text
  xhr.upload.onload = () => {
    isUploading.value = false
  }

  xhr.responseType = 'blob'

  xhr.onload = () => {
    // Clean up event listener once request is complete
    window.removeEventListener('beforeunload', handleBeforeUnload)
    loading.value = false

    if (xhr.status >= 200 && xhr.status < 300) {
      const cd = xhr.getResponseHeader('Content-Disposition') || ''
      const match = /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(cd)
      const fileName = match ? decodeURIComponent(match[1]) : (file.value!.name.replace(/\.[^/.]+$/, '') || 'transcription') + '.srt'

      const blob = xhr.response

      // Preview content
      blob.text().then((text: string) => {
        result.value = text
      }).catch(() => {
        result.value = ''
      })

      // Trigger download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } else {
      // Handle error
      xhr.response.text().then((text: string) => {
        error.value = text || `HTTP ${xhr.status} ${xhr.statusText}`
      }).catch(() => {
        error.value = `HTTP ${xhr.status} ${xhr.statusText}`
      })
    }
  }

  xhr.onerror = () => {
    // Clean up for network errors
    window.removeEventListener('beforeunload', handleBeforeUnload)
    loading.value = false
    error.value = 'Upload failed due to a network error. Please try again.'
  }

  xhr.send(body)
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

.progress-container {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.progress-container progress {
  width: 100%;
  height: 12px;
}
.progress-container span {
  font-size: 0.9em;
  color: #555;
}

a { color: #00DC82; text-decoration: none; }
code { background: #f3f3f3; padding: 2px 6px; border-radius: 4px; }
</style>