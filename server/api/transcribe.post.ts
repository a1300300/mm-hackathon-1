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

    // 讀取字幕語言，預設 zh-TW
    const langPart = form.find((p) => p.name === 'lang')
    const lang = (langPart && langPart.data ? langPart.data.toString() : 'zh-TW') as 'zh-TW' | 'zh-CN' | 'en'

    // 新增：讀取前端傳來的 corrections JSON 字串
    const correctionsPart = form.find((p) => p.name === 'corrections')
    const correctionsJson = correctionsPart && correctionsPart.data ? correctionsPart.data.toString() : ''


    const tmpPath = join(tmpdir(), `${Date.now()}-${audio.filename}`)
    await fsp.writeFile(tmpPath, audio.data)

    const client = new OpenAI({ apiKey: config.openaiApiKey as string })

    try {
        let prompt: string
        prompt =
            '音訊內容主要為台灣口音的中文。\n' +
            '請直接輸出 SRT 內容，不要包含任何額外的說明文字或代碼塊標記。\n' +
            '公司名稱是財經M平方，請判斷是否產生對的公司名稱。\n' +
            '音檔是關於總體經濟的話題，因此會提到很多經濟、財經等名詞\n' +
            '除此之外希望可以移除贅字如還有、然後、嗯嗯等等的'

        const transcription = await client.audio.transcriptions.create({
            prompt,
            file: createReadStream(tmpPath) as any,
            model: 'whisper-1',
            response_format: 'srt',
        })

        // dict（只對中文字幕做校正）
        const defaultCorrections: Record<string, string> = {
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
        };

        // 決定本次要使用的字典：
        // 若前端有傳 corrections 且 JSON 合法，就用那份；否則用 defaultCorrections。
        let corrections: Record<string, string> = defaultCorrections
        if (correctionsJson.trim()) {
            try {
                const parsed = JSON.parse(correctionsJson)
                if (parsed && typeof parsed === 'object') {
                    // 你可以選擇「完全覆蓋」或「合併」：
                    // 覆蓋： corrections = parsed as Record<string, string>
                    // 合併： corrections = { ...defaultCorrections, ...parsed }
                    corrections = { ...defaultCorrections, ...parsed }
                }
            } catch (e) {
                // JSON 解析失敗就忽略，沿用 defaultCorrections
            }
        }

        // 取出 SRT 純文字
        let srt = (transcription as any).text ?? (transcription as any)

        const entries = String(srt).split(/\r?\n/)

        // 套用錯誤字典（只處理字幕文字行，不動時間軸與編號）
        const keys = Object.keys(corrections)
        if (keys.length > 0) {
            const escaped = keys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            const pattern = new RegExp(`(${escaped.join('|')})`, 'g')

            // 解析 SRT：偵測時間碼行 (--> 存在) 之後的行才替換，直到遇到空行
            let inTextBlock = false
            for (let i = 0; i < entries.length; i++) {
                const line = entries[i]
                if (!inTextBlock) {
                    if (line.includes('-->')) {
                        inTextBlock = true
                    }
                    continue
                }

                if (line.trim() === '') {
                    inTextBlock = false
                    continue
                }

                entries[i] = line.replace(pattern, (m) => corrections[m] ?? m)
            }
        }

        srt = entries.join('\n')

        // 如果指定字幕語言為簡體中文：再呼叫一次 OpenAI，將「字幕文字」翻成簡體中文，保持 SRT 結構與時間軸不變
        if (lang === 'zh-CN') {
            const translation = await client.responses.create({
                model: 'gpt-4.1-mini',
                input: [
                    {
                        role: 'system',
                        content:
                            'You are a subtitle translation assistant. ' +
                            'Translate Traditional Chinese subtitles to Simplified Chinese, ' +
                            'but keep the SRT structure, numbering, and timestamps completely unchanged.'
                    },
                    {
                        role: 'user',
                        content:
                            '請將以下 SRT 格式的「繁體中文字幕」翻譯成「簡體中文字幕」。\n' +
                            '重要規則：\n' +
                            '1. 所有編號行與時間碼行（包含 --> 與時間）必須完全照抄，不可以增加、刪除或修改。\n' +
                            '2. 只翻譯字幕文字行（時間碼下方的那幾行）。\n' +
                            '3. 保持行數與分段結構一致。\n' +
                            '4. 不要在輸出中加入任何說明文字或程式碼標記，只輸出純 SRT 內容。\n\n' +
                            '以下是要翻譯的 SRT：\n\n' +
                            String(srt)
                    }
                ]
            })

            try {
                const output = (translation as any).output?.[0]?.content?.[0]?.text
                if (output && typeof output === 'string') {
                    srt = output.trim()
                }
            } catch {
                // 如果解析失敗，就 fallback 用原本的繁體中文 SRT
            }
        }
        else if (lang === 'en') {
            const translation = await client.responses.create({
                model: 'gpt-4.1-mini',
                input: [
                    {
                        role: 'system',
                        content:
                            'You are a subtitle translation assistant. ' +
                            'Translate Traditional Chinese subtitles to natural, fluent English, ' +
                            'but keep the SRT structure, numbering, and timestamps completely unchanged.'
                    },
                    {
                        role: 'user',
                        content:
                            '請將以下 SRT 格式的「繁體中文字幕」翻譯成「英文字幕」。\n' +
                            '重要規則：\n' +
                            '1. 所有編號行與時間碼行（包含 --> 與時間）必須完全照抄，不可以增加、刪除或修改。\n' +
                            '2. 只翻譯字幕文字行（時間碼下方的那幾行）。\n' +
                            '3. 保持行數與分段結構一致。\n' +
                            '4. 不要在輸出中加入任何說明文字或程式碼標記，只輸出純 SRT 內容。\n\n' +
                            '以下是要翻譯的 SRT：\n\n' +
                            String(srt)
                    }
                ]
            })

            try {
                const output = (translation as any).output?.[0]?.content?.[0]?.text
                if (output && typeof output === 'string') {
                    srt = output.trim()
                }
            } catch {
                // 如果解析失敗，就 fallback 用原本的中文 SRT
            }
        }

        // 設定回應為可下載的 SRT 檔案
        const safeBase = basename(audio.filename, '.mp3').replace(/\.srt$/i, '')
        let suffix = '.srt' // 預設為繁體中文 .srt
        if (lang === 'en') {
            suffix = '.en.srt'
        } else if (lang === 'zh-CN') {
            suffix = '.zh-CN.srt'
        }
        const downloadName = `${safeBase}${suffix}`

        setResponseHeader(event, 'Content-Type', 'application/x-subrip; charset=utf-8')
        setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`)

        return srt
    } catch (err: any) {
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Transcription failed' })
    } finally {
        try { await fsp.unlink(tmpPath) } catch {}
    }
})