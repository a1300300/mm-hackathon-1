<template>
  <section class="container">
    <Hero title="MM 共學會" subtitle="MP3音檔產生字幕" />

    <div class="uploader">
      <form @submit.prevent="onSubmit">
        <!-- 字幕語言 -->
        <h3>輸出字幕語言</h3>
        <label class="lang-select">
          字幕語言：
          <select v-model="subtitleLang">
            <option value="zh-TW">繁體中文</option>
            <option value="zh-CN">簡體中文</option>
            <option value="en">英文</option>
          </select>
        </label>

        <!-- 錯字字典編輯區 -->
        <h3>錯字字典（JSON 格式）</h3>
        <p class="hint">
          key = 誤辨識文字，value = 要被替換成的正確文字。<br />
          例如：{ "深層式AI": "生成式AI" }
        </p>
        <textarea
            v-model="correctionsText"
            rows="8"
            class="dict-editor"
        ></textarea>

        <h3>上傳MP3音檔 (繁體中文)</h3>
        <input type="file" accept="audio/*" @change="onFile" />

        <button :disabled="!file || loading">
          {{ loading ? 'Processing…' : 'Transcribe & Download SRT' }}
        </button>
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

// 新增：字幕語言，預設繁體中文
const subtitleLang = ref<'zh-TW' | 'zh-CN' | 'en'>('zh-TW')

// 新增：錯字字典（前端可編輯）。這邊只放幾筆示範，你可以把整份後端字典貼進來。
const correctionsText = ref<string>(
    JSON.stringify(
        {
          "深層式AI": "生成式AI",
          "生存式AI": "生成式AI",
          "Sentence AI": "生成式AI",
          "關稅發跡者": "關稅發起者",
          "臺股": "台股",
          "平臺": "平台",
          "幹擾": "干擾",
          "非同": "非農",
          "零週": "零軸",
          "圖圖": "圖組",
          "隻有": "只有",
          "深入淺述": "深入淺出",
          "通證": "統整",
          "不顯程度": "曝險程度",
          "頭等債": "投等債",
          "一言再言": "一延再延",
          "各息項": "各細項",
          "決策省": "決策層",
          "隻是": "只是",
          "反華": "訪華",
          "能源刺激關稅": "能源次級關稅",
          "二無": "俄烏",
          "評界": "憑藉",
          "YTT": "YTD",
          "鹿港股": "陸港股",
          "入港股": "陸港股",
          "二五衝突": "俄烏衝突",
          "二五戰火": "俄烏戰火",
          "直通訊": "資通訊",
          "資通信": "資通訊",
          "中立經濟": "總體經濟",
          "係向": "細項",
          "前臺": "前台",
          "平價面": "評價面",
          "臺灣價權指數": "台灣加權指數",
          "臺灣": "台灣",
          "臺積電": "台積電",
          "研究人": "研究員",
          "研究人員": "研究員",
          "換季潮": "換機潮",
          "急升急變": "急升急貶",
          "收回零單": "收回銀彈",
          "房地美": "房利美",
          "成都市場": "成熟市場",
          "迴流": "回流",
          "失智產出": "實質產出",
          "幹預": "干預",
          "年準會": "聯準會",
          "Phenom": "非農",
          "咪咪": "明明",
          "通司": "同事",
          "獎益": "講義",
          "矽香": "細項",
          "生產續航": "生產力循環",
          "Chad GPT": "ChatGPT",
          "確實GPT": "ChatGPT",
          "Dotcom": "Dot-com",
          "Aibubble": "AI bubble",
          "人知識": "冷知識",
          "MCP Universe": "MCP-Universe",
          "top down": "Top-Down",
          "Top down": "Top-Down",
          "韓5G": "寒武紀",
          "深層系列": "昇騰系列",
          "生騰系列": "昇騰系列",
          "升騰910C": "昇騰910C",
          "ASCEND 910C": "Ascend 910C",
          "HG-100": "H100",
          "GB-200": "GB200",
          "新職生產力": "新質生產力",
          "新值生產力": "新質生產力",
          "官場潮": "關廠潮",
          "廢辦指數": "費半指數",
          "勇動機": "永動機",
          "CoreWeb": "coreWeave",
          "頂音": "領英",
          "既梗": "季更",
          "大阿梅法案": "大而美法案",
          "拉昇": "拉升",
          "總經知識學": "總經知識節",
          "總經濟成績單": "總經成績單",
          "總經理成績單": "總經成績單",
          "總經理投資入門攻略": "總經投資入門攻略",
          "超盤的V看": "操盤人必看",
          "產業決策平臺": "產業決策平台",
          "MNAI": "MM AI",
          "財經平方": "財經M平方",
          "財經一平方": "財經M平方",
          "財經MP房": "財經M平方",
          "財經平凡": "財經M平方",
          "財經平台": "財經M平方",
          "M明方": "M平方",
          "MP方": "M平方",
          "M平房": "M平方",
          "MP房": "M平方",
          "安平邦": "M平方",
          "MN會員": "MM會員",
          "Agent AI": "Agentic AI",
          "MN": "MM",
          "MMX": "MM Max",
          "Race": "Ralice",
          "RAZE": "Ralice",
          "Ray's": "Ralice",
          "Rais": "Ralice",
          "瑞麗斯": "Ralice",
          "RAISE": "Ralice",
          "RACE": "Ralice",
          "Raise": "Ralice",
          "Viviana": "Vivianna",
          "Daniel": "Danny",
          "Jet": "Jat",
          "Jed": "Jat",
          "JET": "Jat",
          "Bohman": "Bowman",
          "包威爾": "鮑威爾",
          "庫克": "Cook",
          "St.Ultraman": "Sam Altman",
          "股市英哲": "股市隱者",
          "明迪": "敏迪",
          "曲柏": "曲博",
          "範淇斐": "范琪斐",
          "戊外": "物外",
          "金金漲": "驚驚漲",
          "MHPT.com": "Ｍ平方",
          "Rallis": "Ralice",
          "Jatt": "Jat",
          "費城年輸主席": "費城聯儲主席",
          "Ray子": "Ralice",
          "Ralys": "Ralice",
          "ShareGP": "ChatGPT",
          "ChairGPT": "ChatGPT",
          "Check GPD": "ChatGPT",
          "有動機": "永動機",
          "深圳市AI": "生成式AI",
          "以賽亞": "Isaiah",
          "魏哲嘉": "魏哲家",
          "曝刮機": "曝光機",
          "Ethereum": "Isaiah"
        },
        null,
        2
    )
)

const progressText = computed(() => {
  if (isUploading.value) {
    return `Uploading: ${uploadProgress.value.toFixed(0)}%`
  }
  return 'AI is processing, please wait...'
})

// ... existing code ...
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
  // 新增：把字幕語言一起傳給後端
  body.append('lang', subtitleLang.value)
  // 新增：把錯字字典（JSON 字串）一起傳給後端
  body.append('corrections', correctionsText.value || '')

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
      const fileName =
          match
              ? decodeURIComponent(match[1])
              : (file.value!.name.replace(/\.[^/.]+$/, '') || 'transcription') + '.srt'

      const blob = xhr.response

      // Preview content
      blob.text()
          .then((text: string) => {
            result.value = text
          })
          .catch(() => {
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
      xhr.response
          .text()
          .then((text: string) => {
            error.value = text || `HTTP ${xhr.status} ${xhr.statusText}`
          })
          .catch(() => {
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
/* 表單改為上下排列，讓選單在上、input 在下，不同一排 */
.uploader form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}
.uploader .error {
  color: #c00;
  margin-top: 8px;
}
.uploader .result {
  margin-top: 16px;
}
.uploader textarea {
  width: 100%;
  padding: 8px;
}
.dict-editor {
  width: 100%;
  font-family: monospace;
  font-size: 12px;
}
.hint {
  font-size: 0.85rem;
  color: #666;
  margin: 2px;
}
/* 語言選單獨立一行，增加與下方 input 的距離 */
.lang-select {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

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

a {
  color: #00DC82;
  text-decoration: none;
}
code {
  background: #f3f3f3;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>