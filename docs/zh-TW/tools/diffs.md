---
read_when:
    - 你希望代理程式以差異格式顯示程式碼或 Markdown 編輯
    - 你需要可供畫布使用的檢視器 URL，或已呈現的差異檔案
    - 你需要受控、暫時且具備安全預設值的差異產物
sidebarTitle: Diffs
summary: 供代理使用的唯讀差異檢視器與檔案渲染器（選用 Plugin 工具）
title: 差異
x-i18n:
    generated_at: "2026-05-02T03:01:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` 是選用的 Plugin 工具，具備簡短的內建系統指引，以及一個配套 Skill，可將變更內容轉換為供代理使用的唯讀 diff 成品。

它接受以下任一輸入：

- `before` 和 `after` 文字
- 統一格式的 `patch`

它可以回傳：

- 用於畫布呈現的 Gateway 檢視器 URL
- 用於訊息傳遞的已算繪檔案路徑（PNG 或 PDF）
- 在一次呼叫中回傳兩種輸出

啟用後，此 Plugin 會將精簡的使用指引前置加入系統提示空間，並另外公開詳細的 Skill，以供代理需要更完整指示時使用。

## 快速開始

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        畫布優先流程：代理以 `mode: "view"` 呼叫 `diffs`，並使用 `canvas present` 開啟 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天檔案傳遞：代理以 `mode: "file"` 呼叫 `diffs`，並使用 `message` 搭配 `path` 或 `filePath` 傳送 `details.filePath`。
      </Tab>
      <Tab title="both">
        組合模式：代理以 `mode: "both"` 呼叫 `diffs`，在一次呼叫中取得兩種成品。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 停用內建系統指引

如果你想保留啟用 `diffs` 工具，但停用其內建系統提示指引，請將 `plugins.entries.diffs.hooks.allowPromptInjection` 設為 `false`：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

這會封鎖 diffs Plugin 的 `before_prompt_build` hook，同時保留 Plugin、工具與配套 Skill 可用。

如果你想同時停用指引與工具，請改為停用 Plugin。

## 典型代理工作流程

<Steps>
  <Step title="Call diffs">
    代理使用輸入呼叫 `diffs` 工具。
  </Step>
  <Step title="Read details">
    代理從回應讀取 `details` 欄位。
  </Step>
  <Step title="Present">
    代理可以使用 `canvas present` 開啟 `details.viewerUrl`，使用 `message` 搭配 `path` 或 `filePath` 傳送 `details.filePath`，或兩者都做。
  </Step>
</Steps>

## 輸入範例

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## 工具輸入參考

除非另有註明，所有欄位皆為選用。

<ParamField path="before" type="string">
  原始文字。省略 `patch` 時，必須與 `after` 一起提供。
</ParamField>
<ParamField path="after" type="string">
  更新後文字。省略 `patch` 時，必須與 `before` 一起提供。
</ParamField>
<ParamField path="patch" type="string">
  統一 diff 文字。與 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  before and after 模式的顯示檔名。
</ParamField>
<ParamField path="lang" type="string">
  before and after 模式的語言覆寫提示。未知值會退回純文字。
</ParamField>
<ParamField path="title" type="string">
  檢視器標題覆寫。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  輸出模式。預設為 Plugin 預設值 `defaults.mode`。已棄用別名：`"image"` 的行為與 `"file"` 相同，為了向後相容仍會接受。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  檢視器主題。預設為 Plugin 預設值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff 版面配置。預設為 Plugin 預設值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  當完整上下文可用時，展開未變更區段。僅限單次呼叫選項（不是 Plugin 預設鍵）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  已算繪檔案格式。預設為 Plugin 預設值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG 或 PDF 算繪的品質預設。
</ParamField>
<ParamField path="fileScale" type="number">
  裝置縮放覆寫（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  最大算繪寬度，以 CSS 像素為單位（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  檢視器與獨立檔案輸出的成品 TTL，以秒為單位。最大值 21600。
</ParamField>
<ParamField path="baseUrl" type="string">
  檢視器 URL 來源覆寫。會覆寫 Plugin 的 `viewerBaseUrl`。必須是 `http` 或 `https`，不得有查詢/雜湊。
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    為了向後相容仍會接受：

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` 和 `after` 各自最大 512 KiB。
    - `patch` 最大 2 MiB。
    - `path` 最大 2048 位元組。
    - `lang` 最大 128 位元組。
    - `title` 最大 1024 位元組。
    - Patch 複雜度上限：最多 128 個檔案和 120000 總行數。
    - `patch` 與 `before` 或 `after` 同時出現會被拒絕。
    - 已算繪檔案安全限制（套用於 PNG 和 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（8,000,000 個算繪像素）。
      - `fileQuality: "hq"`：最大 14 MP（14,000,000 個算繪像素）。
      - `fileQuality: "print"`：最大 24 MP（24,000,000 個算繪像素）。
      - PDF 另有最多 50 頁的限制。

  </Accordion>
</AccordionGroup>

## 輸出 details 合約

此工具會在 `details` 底下回傳結構化中繼資料。

<AccordionGroup>
  <Accordion title="Viewer fields">
    建立檢視器的模式所共用的欄位：

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context`（可用時包含 `agentId`、`sessionId`、`messageChannel`、`agentAccountId`）

  </Accordion>
  <Accordion title="File fields">
    算繪 PNG 或 PDF 時的檔案欄位：

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（與 `filePath` 相同的值，用於 message 工具相容性）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    也會為現有呼叫端回傳：

    - `format`（與 `fileFormat` 相同的值）
    - `imagePath`（與 `filePath` 相同的值）
    - `imageBytes`（與 `fileBytes` 相同的值）
    - `imageQuality`（與 `fileQuality` 相同的值）
    - `imageScale`（與 `fileScale` 相同的值）
    - `imageMaxWidth`（與 `fileMaxWidth` 相同的值）

  </Accordion>
</AccordionGroup>

模式行為摘要：

| 模式     | 回傳內容                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | 僅檢視器欄位。                                                                                                    |
| `"file"` | 僅檔案欄位，沒有檢視器成品。                                                                                  |
| `"both"` | 檢視器欄位加上檔案欄位。如果檔案算繪失敗，檢視器仍會連同 `fileError` 和 `imageError` 別名一起回傳。 |

## 收合的未變更區段

- 檢視器可以顯示像 `N unmodified lines` 這樣的列。
- 這些列上的展開控制項是條件式的，並非保證每種輸入類型都有。
- 當已算繪 diff 具有可展開的上下文資料時，會出現展開控制項，這通常適用於 before and after 輸入。
- 對於許多統一 patch 輸入，已省略的上下文本文不會存在於已解析的 patch hunk 中，因此該列可能在沒有展開控制項的情況下出現。這是預期行為。
- `expandUnchanged` 僅在存在可展開上下文時適用。

## Plugin 預設值

在 `~/.openclaw/openclaw.json` 中設定整個 Plugin 的預設值：

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

支援的預設值：

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

明確的工具參數會覆寫這些預設值。

### 持久性檢視器 URL 設定

<ParamField path="viewerBaseUrl" type="string">
  工具呼叫未傳入 `baseUrl` 時，由 Plugin 擁有、用於回傳檢視器連結的後備值。必須是 `http` 或 `https`，不得有查詢/雜湊。
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## 安全性設定

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`：拒絕對檢視器路由的非 loopback 請求。`true`：如果權杖化路徑有效，則允許遠端檢視器。
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## 成品生命週期與儲存

- 成品會儲存在 temp 子資料夾底下：`$TMPDIR/openclaw-diffs`。
- 檢視器成品中繼資料包含：
  - 隨機成品 ID（20 個十六進位字元）
  - 隨機權杖（48 個十六進位字元）
  - `createdAt` 和 `expiresAt`
  - 已儲存的 `viewer.html` 路徑
- 未指定時，預設成品 TTL 為 30 分鐘。
- 可接受的檢視器 TTL 最大值為 6 小時。
- 清理會在成品建立後機會性執行。
- 已過期的成品會被刪除。
- 當缺少中繼資料時，後備清理會移除超過 24 小時的陳舊資料夾。

## 檢視器 URL 與網路行為

檢視器路由：

- `/plugins/diffs/view/{artifactId}/{token}`

檢視器資產：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

檢視器文件會以相對於檢視器 URL 的方式解析這些資產，因此選用的 `baseUrl` 路徑前綴也會同樣保留給兩個資產請求。

URL 建構行為：

- 如果提供工具呼叫的 `baseUrl`，會在嚴格驗證後使用它。
- 否則如果已設定 Plugin 的 `viewerBaseUrl`，會使用它。
- 如果沒有任一覆寫，檢視器 URL 預設為 loopback `127.0.0.1`。
- 如果 Gateway 繫結模式為 `custom` 且已設定 `gateway.customBindHost`，會使用該主機。

`baseUrl` 規則：

- 必須是 `http://` 或 `https://`。
- 查詢與雜湊會被拒絕。
- 允許來源加上選用的基礎路徑。

## 安全性模型

<AccordionGroup>
  <Accordion title="檢視器強化">
    - 預設僅限 loopback。
    - 權杖化的檢視器路徑，具備嚴格的 ID 與權杖驗證。
    - 檢視器回應 CSP：
      - `default-src 'none'`
      - 指令碼與資產僅能來自自身來源
      - 無對外 `connect-src`
    - 啟用遠端存取時，會節流遠端未命中：
      - 每 60 秒 40 次失敗
      - 60 秒鎖定（`429 Too Many Requests`）

  </Accordion>
  <Accordion title="檔案算繪強化">
    - 螢幕截圖瀏覽器請求路由預設拒絕。
    - 僅允許來自 `http://127.0.0.1/plugins/diffs/assets/*` 的本機檢視器資產。
    - 外部網路請求會被封鎖。

  </Accordion>
</AccordionGroup>

## 檔案模式的瀏覽器需求

`mode: "file"` 與 `mode: "both"` 需要 Chromium 相容瀏覽器。

解析順序：

<Steps>
  <Step title="設定">
    OpenClaw 設定中的 `browser.executablePath`。
  </Step>
  <Step title="環境變數">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="平台備援">
    平台命令/路徑探索備援。
  </Step>
</Steps>

常見失敗文字：

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

修正方式是安裝 Chrome、Chromium、Edge 或 Brave，或設定上述其中一個可執行檔路徑選項。

## 疑難排解

<AccordionGroup>
  <Accordion title="輸入驗證錯誤">
    - `Provide patch or both before and after text.` — 同時包含 `before` 與 `after`，或提供 `patch`。
    - `Provide either patch or before/after input, not both.` — 不要混用輸入模式。
    - `Invalid baseUrl: ...` — 使用含可選路徑的 `http(s)` 來源，不要有查詢/雜湊。
    - `{field} exceeds maximum size (...)` — 減少有效負載大小。
    - 大型修補檔遭拒 — 減少修補檔案數量或總行數。

  </Accordion>
  <Accordion title="檢視器可存取性">
    - 檢視器 URL 預設解析為 `127.0.0.1`。
    - 對於遠端存取情境，請擇一：
      - 設定 Plugin `viewerBaseUrl`，或
      - 在每次工具呼叫傳入 `baseUrl`，或
      - 使用 `gateway.bind=custom` 與 `gateway.customBindHost`
    - 如果 `gateway.trustedProxies` 對同主機代理包含 loopback（例如 Tailscale Serve），沒有轉送用戶端 IP 標頭的原始 loopback 檢視器請求會依設計失敗關閉。
    - 對於該代理拓撲：
      - 當你只需要附件時，偏好使用 `mode: "file"` 或 `mode: "both"`，或
      - 當你需要可分享的檢視器 URL 時，有意啟用 `security.allowRemoteViewer`，並設定 Plugin `viewerBaseUrl` 或傳入代理/公開 `baseUrl`
    - 只有在你有意提供外部檢視器存取時，才啟用 `security.allowRemoteViewer`。

  </Accordion>
  <Accordion title="未修改行列沒有展開按鈕">
    當修補檔輸入未帶有可展開的上下文時，可能會發生這種情況。這是預期行為，不表示檢視器失敗。
  </Accordion>
  <Accordion title="找不到成品">
    - 成品因 TTL 過期。
    - 權杖或路徑已變更。
    - 清理移除了陳舊資料。

  </Accordion>
</AccordionGroup>

## 操作指引

- 在 canvas 中進行本機互動式審閱時，偏好使用 `mode: "view"`。
- 需要附件的對外聊天頻道，偏好使用 `mode: "file"`。
- 除非你的部署需要遠端檢視器 URL，否則保持停用 `allowRemoteViewer`。
- 針對敏感差異設定明確且較短的 `ttlSeconds`。
- 非必要時，避免在差異輸入中傳送秘密。
- 如果你的頻道會大幅壓縮影像（例如 Telegram 或 WhatsApp），偏好使用 PDF 輸出（`fileFormat: "pdf"`）。

<Note>
差異算繪引擎由 [Diffs](https://diffs.com) 提供。
</Note>

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [Plugin](/zh-TW/tools/plugin)
- [工具概覽](/zh-TW/tools)
