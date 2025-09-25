import { readMultipartFormData, createError, defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { useRuntimeConfig } from '#imports'
import OpenAI from 'openai'
import { promises as fsp } from 'fs'
import { createReadStream } from 'fs'
import { tmpdir } from 'os'
import { join, basename } from 'path'

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
    let prompt = '音訊內容主要為台灣口音的中文。\n' +
        '請直接輸出 SRT 內容，不要包含任何額外的說明文字或代碼塊標記。\n' +
        '公司名稱是財經M平方，請判斷是否產生對的公司名稱。\n' +
        '音檔是關於總體經濟的話題，因此會提到很多經濟、財經等名詞\n' +
        '除此之外希望可以移除贅字如還有、然後、嗯嗯等等的';

    const transcription = await client.audio.transcriptions.create({
      prompt: prompt,
      file: createReadStream(tmpPath) as any,
      model: 'whisper-1',
      // language: 'zh', // 讓模型自動偵測語言，避免空結果
      response_format: 'srt',
    })
      
    // dict
    const corrections: Record<string, string> = {
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
          "M明方": "M平方",
          "MP方": "M平方",
          "M平房 ": "M平方",
          "MP房": "M平方",
          "安平邦": "M平方",
          "MN會員": "MM會員",
          "Agent AI": "Agentic AI",
          "MN": "MM",
          "Race": "Ralice",
          "Ray's": "Ralice",
          "瑞麗斯": "Ralice",
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
      };  

    // 取出 SRT 純文字
    let srt = (transcription as any).text ?? (transcription as any)

    // 依 corrections 逐一替換字幕文本（不動到序號與時間碼）
    // 僅在「字幕內容行」做替換：SRT 格式每個區塊第三行起為內容
    const entries = String(srt).split(/\r?\n/)

    const keys = Object.keys(corrections)
    // 若沒有校正鍵，直接回傳
    if (keys.length > 0) {
      // 預先建立單一 RegExp，用 | 合併，避免重複掃描多次
      // 逐一跳脫特殊字元
      const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      const pattern = new RegExp(`(${escaped.join('|')})`, 'g')

      // 解析 SRT：偵測時間碼行 (--> 存在) 之後的行才替換，直到遇到空行
      let inTextBlock = false
      for (let i = 0; i < entries.length; i++) {
        const line = entries[i]
        if (!inTextBlock) {
          // 進入字幕內容的判斷：遇到時間碼行
          if (line.includes('-->')) {
            inTextBlock = true
          }
          continue
        }

        // 空行代表塊結束
        if (line.trim() === '') {
          inTextBlock = false
          continue
        }

        // 內容行：做字典替換
        entries[i] = line.replace(pattern, (m) => corrections[m] ?? m)
      }
    }

    srt = entries.join('\n')

    // 設定回應為可下載的 SRT 檔案
    const safeBase = basename(audio.filename, '.srt')
    const downloadName = `${safeBase}.srt`
    setResponseHeader(event, 'Content-Type', 'application/x-subrip; charset=utf-8')
    setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`)

    return srt
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Transcription failed' })
  } finally {
    try { await fsp.unlink(tmpPath) } catch {}
  }
})
