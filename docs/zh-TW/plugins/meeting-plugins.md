---
read_when:
    - 你想讓 OpenClaw 代理程式加入視訊會議
    - 你正在 Google Meet、Microsoft Teams 會議和 Zoom 會議外掛之間進行選擇
    - 你需要共用 Chrome、BlackHole、SoX 或會議模式設定
summary: 選擇並設定參與 Google Meet、Microsoft Teams 或 Zoom 會議的方式
title: 會議外掛
x-i18n:
    generated_at: "2026-07-19T13:57:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6ac4357a2ff938f519d4b1112279fe7a7e45d9ae6d679c9eb6d7948fca976b8b
    source_path: plugins/meeting-plugins.md
    workflow: 16
---

OpenClaw 為 Google Meet、Microsoft Teams 會議和 Zoom 分別提供外掛。這三者都能透過 Chrome 加入會議、使用相同的參與模式，並可在閘道主機或已配對的節點上執行 Chrome。它們的平台 URL、安裝模式和額外功能各有不同。

這些外掛用於參與會議。它們與 [Microsoft Teams 頻道](/zh-TW/channels/msteams)等訊息頻道及[語音通話外掛](/zh-TW/plugins/voice-call)彼此獨立。

## 選擇外掛

| 平台        | 外掛                                      | 接受的會議連結                                                                                      | 安裝方式                             | 參與途徑                                      | 平台特定功能                                                                                |
| --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Google Meet     | [`google-meet`](/zh-TW/plugins/google-meet)       | `meet.google.com/...`                                                                                       | 從 npm 或 ClawHub 安裝，然後啟用 | 本機 Chrome、已配對節點上的 Chrome，或 Twilio 撥入 | 可透過 Meet API 或已登入的瀏覽器建立會議；可使用 OAuth 讀取支援的 Meet 成果資料 |
| Microsoft Teams | [`teams-meetings`](/zh-TW/plugins/teams-meetings) | `teams.microsoft.com/l/meetup-join/...` 下的工作連結及 `teams.live.com/meet/...` 下的消費者連結 | 已內建；啟用即可                      | 本機 Chrome 或已配對節點上的 Chrome                  | 以訪客身分加入工作與消費者會議                                                                     |
| Zoom            | [`zoom-meetings`](/plugins/zoom-meetings)   | `zoom.us/j/...` 及 `example.zoom.us/j/...` 等帳戶子網域                                      | 已內建；啟用即可                      | 本機 Chrome 或已配對節點上的 Chrome                  | 透過 Zoom Web App 以訪客身分加入                                                                           |

需要建立會議、Google API 成果資料或 Twilio 電話途徑時，請選擇 Google Meet。若要在對應平台上直接以瀏覽器訪客身分參與，請選擇 Teams 或 Zoom。Teams 和 Zoom 外掛不會建立會議、撥入、呼叫供應商 API 或錄製會議。

## 選擇模式

這三個外掛共用相同的模式：

| 模式         | 行為                                                                                              | 音訊需求                                      |
| ------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `agent`      | 即時轉錄會傳送至已設定的 OpenClaw 代理程式；一般 OpenClaw TTS 會朗讀回覆。  | Chrome 語音回傳需要 BlackHole 和 SoX 橋接。 |
| `bidi`       | 即時語音模型會直接聆聽並回覆。                                                  | Chrome 語音回傳需要 BlackHole 和 SoX 橋接。 |
| `transcribe` | 以僅觀察方式加入，並在平台提供字幕時公開有界限的即時字幕逐字稿。 | 不需要 BlackHole 或 SoX 語音回傳橋接。                   |

當代理程式只需要會議文字時，請使用 `transcribe`。若要使用一般的 OpenClaw 推理和工具，請使用 `agent`。當低延遲直接語音比透過一般代理程式路由每一輪對話更重要時，請使用 `bidi`。

字幕逐字稿是工作階段範圍的執行階段資料，不是永久保存的會議錄製內容。字幕能否使用仍取決於會議平台、帳戶、語言和主持人政策。請參閱平台指南，瞭解其逐字稿限制和狀態欄位。

## 準備 Chrome 和音訊

Chrome 可在閘道主機或已配對的節點上執行。遠端 Chrome 節點必須允許 `browser.proxy` 及平台命令：

| 外掛          | 節點命令           |
| --------------- | ---------------------- |
| Google Meet     | `googlemeet.chrome`    |
| Microsoft Teams | `teamsmeetings.chrome` |
| Zoom            | `zoommeetings.chrome`  |

若要透過 Chrome 使用 `agent` 或 `bidi` 模式，請在 macOS 上執行 Chrome，並在同一主機上安裝共用音訊相依套件：

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

當 Chrome 在已配對的節點上執行時，閘道主機仍持有 OpenClaw 代理程式和模型認證資訊。請為 `agent` 模式設定即時轉錄供應商和 OpenClaw TTS，或為 `bidi` 模式設定即時語音供應商。各平台指南包含供應商和音訊命令選項。

## 啟用外掛

啟用 Google Meet 前，請先安裝。Teams 會議和 Zoom 已隨 OpenClaw 內建，只需啟用：

```bash
# 僅適用於 Google Meet
openclaw plugins install npm:@openclaw/google-meet

# 僅啟用你使用的會議外掛
openclaw plugins enable google-meet
openclaw plugins enable teams-meetings
openclaw plugins enable zoom-meetings
```

如果你的外掛管理途徑不會自動重新啟動閘道，請重新啟動閘道。接著，在加入會議前執行平台設定檢查。

## 驗證並加入

| 平台        | 設定檢查                    | 加入命令                                                                  |
| --------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| Google Meet     | `openclaw googlemeet setup`    | `openclaw googlemeet join 'https://meet.google.com/abc-defg-hij'`             |
| Microsoft Teams | `openclaw teamsmeetings setup` | `openclaw teamsmeetings join 'https://teams.microsoft.com/l/meetup-join/...'` |
| Zoom            | `openclaw zoommeetings setup`  | `openclaw zoommeetings join 'https://zoom.us/j/1234567890'`                   |

任何失敗的設定檢查，都應視為該傳輸方式和模式的阻斷因素。若要進行僅觀察冒煙測試，請選擇 `transcribe` 模式，並在預期出現字幕文字前，確認狀態回報會議通話中的工作階段。

## 處理平台政策提示

瀏覽器自動化會處理一般的訪客名稱、加入前的攝影機和麥克風、加入、通話中及離開控制項。它不會繞過平台或會議組織者的政策。

- Google Meet 可能要求登入 Google、由主持人允許加入，或進行瀏覽器權限確認。
- Microsoft Teams 可能要求登入租用戶、驗證電子郵件，或由會議組織者允許加入。
- Zoom 可能要求進行驗證、驗證電子郵件、輸入密碼、完成 CAPTCHA，或由主持人允許加入；帳戶也可能停用透過瀏覽器加入的功能。

當加入或狀態結果回報 `manualActionRequired` 時，請先在相同的 OpenClaw Chrome 設定檔中完成回報的步驟，再重試。重複開啟新分頁無法解除帳戶、租用戶、大廳或 CAPTCHA 限制。

僅加入操作者已獲授權可新增代理程式的會議。若當地政策或同意規則要求揭露自動參與、轉錄或合成語音，請告知參與者。

## Discord 語音聊天

[Discord 語音頻道](/zh-TW/channels/discord#voice-channels)無須瀏覽器會議自動化，即可提供原生的純音訊即時對話。OpenClaw 可加入語音頻道、聆聽，將各輪對話路由至 OpenClaw 代理程式或即時語音模型，並朗讀回覆。即使有人在同一個 Discord 頻道中使用視訊，它也不會傳送或接收攝影機影像或螢幕分享，因此 Discord 語音是相關的即時對話介面，而不是第四個瀏覽器會議外掛。

## 平台指南

- [Google Meet 外掛](/zh-TW/plugins/google-meet)
- [Microsoft Teams 會議外掛](/zh-TW/plugins/teams-meetings)
- [Zoom 會議外掛](/plugins/zoom-meetings)
- [管理外掛](/zh-TW/plugins/manage-plugins)
- [瀏覽器控制](/zh-TW/tools/browser)
