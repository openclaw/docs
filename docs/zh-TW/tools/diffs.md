---
read_when:
    - 你想要代理程式以 diff 形式顯示程式碼或 Markdown 編輯
    - 你需要可供畫布使用的檢視器 URL 或已算繪的差異檔案
    - 你需要具備安全預設值、可控且暫時性的差異產物
sidebarTitle: Diffs
summary: 供代理程式使用的唯讀差異檢視器與檔案渲染器（選用外掛工具）
title: 差異
x-i18n:
    generated_at: "2026-06-27T20:05:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` 是一個選用外掛工具，內建簡短的系統指引，並搭配一個 companion skill，可將變更內容轉換成供代理程式使用的唯讀 diff 成品。

它接受以下任一種輸入：

- `before` 和 `after` 文字
- 統一格式的 `patch`

它可以回傳：

- 用於畫布呈現的閘道檢視器 URL
- 用於訊息傳遞的已算繪檔案路徑（PNG 或 PDF）
- 在一次呼叫中同時回傳兩種輸出

啟用後，此外掛會將精簡的使用指引前置加入系統提示詞空間，也會公開一個詳細的 skill，供代理程式需要更完整指示時使用。

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
        畫布優先流程：代理程式使用 `mode: "view"` 呼叫 `diffs`，並用 `canvas present` 開啟 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天檔案傳遞：代理程式使用 `mode: "file"` 呼叫 `diffs`，並透過 `message` 使用 `path` 或 `filePath` 傳送 `details.filePath`。
      </Tab>
      <Tab title="both">
        組合模式：代理程式使用 `mode: "both"` 呼叫 `diffs`，在一次呼叫中取得兩種成品。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 停用內建系統指引

如果你想保持啟用 `diffs` 工具，但停用其內建系統提示詞指引，請將 `plugins.entries.diffs.hooks.allowPromptInjection` 設為 `false`：

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

這會封鎖 diffs 外掛的 `before_prompt_build` hook，同時保留外掛、工具與 companion skill 可用。

如果你想同時停用指引和工具，請改為停用此外掛。

## 典型代理程式工作流程

<Steps>
  <Step title="Call diffs">
    代理程式使用輸入呼叫 `diffs` 工具。
  </Step>
  <Step title="Read details">
    代理程式從回應讀取 `details` 欄位。
  </Step>
  <Step title="Present">
    代理程式可使用 `canvas present` 開啟 `details.viewerUrl`，透過 `message` 使用 `path` 或 `filePath` 傳送 `details.filePath`，或兩者都做。
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

除非另有說明，所有欄位皆為選填。

<ParamField path="before" type="string">
  原始文字。省略 `patch` 時，必須與 `after` 一起提供。
</ParamField>
<ParamField path="after" type="string">
  更新後的文字。省略 `patch` 時，必須與 `before` 一起提供。
</ParamField>
<ParamField path="patch" type="string">
  統一 diff 文字。與 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  before 和 after 模式的顯示檔名。
</ParamField>
<ParamField path="lang" type="string">
  before 和 after 模式的語言覆寫提示。未知值與預設檢視器集合以外的語言會退回純文字，除非已安裝
  Diff Viewer Language Pack 外掛。
</ParamField>

<ParamField path="title" type="string">
  檢視器標題覆寫。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  輸出模式。預設為外掛預設值 `defaults.mode`。已棄用別名：`"image"` 的行為類似 `"file"`，且仍為了向後相容而接受。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  檢視器主題。預設為外掛預設值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff 版面配置。預設為外掛預設值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  在完整脈絡可用時展開未變更區段。僅限單次呼叫選項（不是外掛預設鍵）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  已算繪檔案格式。預設為外掛預設值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG 或 PDF 算繪的品質預設。
</ParamField>
<ParamField path="fileScale" type="number">
  裝置縮放覆寫（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS 像素中的最大算繪寬度（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  檢視器與獨立檔案輸出的成品 TTL，以秒為單位。最大值 21600。
</ParamField>
<ParamField path="baseUrl" type="string">
  檢視器 URL origin 覆寫。覆寫外掛 `viewerBaseUrl`。必須是 `http` 或 `https`，不可包含 query/hash。
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    為了向後相容，仍接受以下項目：

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
    - Patch 複雜度上限：最多 128 個檔案與總計 120000 行。
    - `patch` 與 `before` 或 `after` 一起提供時會被拒絕。
    - 已算繪檔案安全限制（適用於 PNG 和 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（8,000,000 個已算繪像素）。
      - `fileQuality: "hq"`：最大 14 MP（14,000,000 個已算繪像素）。
      - `fileQuality: "print"`：最大 24 MP（24,000,000 個已算繪像素）。
      - PDF 另有最多 50 頁的限制。

  </Accordion>
</AccordionGroup>

## 語法醒目提示

OpenClaw 包含常見原始碼、設定與文件語言的語法醒目提示：

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, and `toml`.

常見別名，例如 `js`、`ts`、`bash`、`md`、`yml`、`c++`、`dockerfile`、`rb`、`kt` 和 `ps1`，會正規化為這些預設語言。

安裝 Diff Viewer Language Pack 外掛以醒目顯示其他語言：

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

有了語言包後，OpenClaw 可以醒目顯示更多語言。如果未安裝此語言包，預設清單以外的檔案仍會以可讀的純文字呈現。範例包括 Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI，以及 diff 檔案。

詳情請參閱 [Diffs Language Pack 外掛](/zh-TW/plugins/reference/diffs-language-pack)，並參閱 [Shiki 語言](https://shiki.style/languages) 了解 Shiki 的上游語言與別名目錄。

## 輸出詳細資料契約

此工具會在 `details` 下傳回結構化中繼資料。

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
    轉譯 PNG 或 PDF 時的檔案欄位：

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（與 `filePath` 相同值，用於訊息工具相容性）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    也會傳回給現有呼叫端：

    - `format`（與 `fileFormat` 相同值）
    - `imagePath`（與 `filePath` 相同值）
    - `imageBytes`（與 `fileBytes` 相同值）
    - `imageQuality`（與 `fileQuality` 相同值）
    - `imageScale`（與 `fileScale` 相同值）
    - `imageMaxWidth`（與 `fileMaxWidth` 相同值）

  </Accordion>
</AccordionGroup>

模式行為摘要：

| 模式     | 傳回內容                                                                                                               |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | 僅檢視器欄位。                                                                                                         |
| `"file"` | 僅檔案欄位，沒有檢視器成品。                                                                                           |
| `"both"` | 檢視器欄位加上檔案欄位。如果檔案轉譯失敗，檢視器仍會傳回，並附帶 `fileError` 與 `imageError` 別名。                   |

## 摺疊未變更區段

- 檢視器可以顯示類似 `N unmodified lines` 的列。
- 這些列上的展開控制項是條件式的，並不保證每種輸入類型都會有。
- 當轉譯後的 diff 具有可展開的脈絡資料時，會出現展開控制項；這通常適用於之前與之後的輸入。
- 對於許多 unified patch 輸入，省略的脈絡內容不會出現在已剖析的 patch hunk 中，因此該列可能會在沒有展開控制項的情況下出現。這是預期行為。
- `expandUnchanged` 僅在存在可展開脈絡時適用。

## 外掛預設值

在 `~/.openclaw/openclaw.json` 中設定外掛範圍的預設值：

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
            ttlSeconds: 21600,
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
- `ttlSeconds`

明確的工具參數會覆寫這些預設值。

### 持久性檢視器 URL 設定

<ParamField path="viewerBaseUrl" type="string">
  當工具呼叫未傳遞 `baseUrl` 時，由外掛擁有的後援傳回檢視器連結。必須是 `http` 或 `https`，且不可包含查詢/hash。
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
  `false`：拒絕對檢視器路由的非 loopback 請求。`true`：如果 tokenized path 有效，則允許遠端檢視器。
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

- 成品會儲存在暫存子資料夾下：`$TMPDIR/openclaw-diffs`。
- 檢視器成品中繼資料包含：
  - 隨機成品 ID（20 個十六進位字元）
  - 隨機權杖（48 個十六進位字元）
  - `createdAt` 和 `expiresAt`
  - 已儲存的 `viewer.html` 路徑
- 未指定時，預設成品 TTL 為 30 分鐘。
- 可接受的檢視器 TTL 上限為 6 小時。
- 成品建立後會伺機執行清理。
- 過期成品會被刪除。
- 中繼資料遺失時，後備清理會移除超過 24 小時的過時資料夾。

## 檢視器 URL 與網路行為

檢視器路由：

- `/plugins/diffs/view/{artifactId}/{token}`

檢視器資產：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- 差異使用 Diff Viewer Language Pack 中的語言時，使用 `/plugins/diffs-language-pack/assets/viewer.js`

檢視器文件會相對於檢視器 URL 解析這些資產，因此選用的 `baseUrl` 路徑前綴也會在兩個資產請求中保留。

URL 建構行為：

- 如果提供了工具呼叫 `baseUrl`，會在嚴格驗證後使用。
- 否則，如果已設定外掛 `viewerBaseUrl`，則會使用它。
- 若兩者都未覆寫，檢視器 URL 預設為 loopback `127.0.0.1`。
- 如果閘道繫結模式為 `custom` 且已設定 `gateway.customBindHost`，會使用該主機。

`baseUrl` 規則：

- 必須是 `http://` 或 `https://`。
- 查詢與雜湊會被拒絕。
- 允許來源加上選用的基底路徑。

## 安全模型

<AccordionGroup>
  <Accordion title="檢視器強化">
    - 預設僅限 loopback。
    - 權杖化的檢視器路徑，並進行嚴格的 ID 與權杖驗證。
    - 檢視器回應 CSP：
      - `default-src 'none'`
      - 指令碼與資產僅允許來自 self
      - 沒有對外的 `connect-src`
    - 啟用遠端存取時，會對遠端未命中進行節流：
      - 每 60 秒 40 次失敗
      - 60 秒鎖定（`429 Too Many Requests`）

  </Accordion>
  <Accordion title="檔案算繪強化">
    - 截圖瀏覽器請求路由預設拒絕。
    - 僅允許來自 `http://127.0.0.1/plugins/diffs/assets/*` 的本機檢視器資產。
    - 外部網路請求會被封鎖。

  </Accordion>
</AccordionGroup>

## 檔案模式的瀏覽器需求

`mode: "file"` 和 `mode: "both"` 需要 Chromium 相容瀏覽器。

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
  <Step title="平台後備">
    平台命令/路徑探索後備。
  </Step>
</Steps>

常見失敗文字：

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

修正方式是安裝 Chrome、Chromium、Edge 或 Brave，或設定上述其中一個可執行檔路徑選項。

## 疑難排解

<AccordionGroup>
  <Accordion title="輸入驗證錯誤">
    - `Provide patch or both before and after text.` — 同時包含 `before` 和 `after`，或提供 `patch`。
    - `Provide either patch or before/after input, not both.` — 不要混用輸入模式。
    - `Invalid baseUrl: ...` — 使用 `http(s)` 來源並可選擇性加上路徑，不要有查詢/雜湊。
    - `{field} exceeds maximum size (...)` — 減少承載大小。
    - 大型修補拒絕 — 減少修補檔案數量或總行數。

  </Accordion>
  <Accordion title="檢視器可存取性">
    - 檢視器 URL 預設解析為 `127.0.0.1`。
    - 對於遠端存取情境，請擇一：
      - 設定外掛 `viewerBaseUrl`，或
      - 每次工具呼叫傳入 `baseUrl`，或
      - 使用 `gateway.bind=custom` 和 `gateway.customBindHost`
    - 如果 `gateway.trustedProxies` 針對同主機代理包含 loopback（例如 Tailscale Serve），沒有轉送用戶端 IP 標頭的原始 loopback 檢視器請求會按設計失敗關閉。
    - 對於該代理拓撲：
      - 當你只需要附件時，偏好使用 `mode: "file"` 或 `mode: "both"`，或
      - 當你需要可分享的檢視器 URL 時，刻意啟用 `security.allowRemoteViewer` 並設定外掛 `viewerBaseUrl`，或傳入代理/公開 `baseUrl`
    - 只有在你打算讓外部存取檢視器時，才啟用 `security.allowRemoteViewer`。

  </Accordion>
  <Accordion title="未修改行列沒有展開按鈕">
    當修補輸入未攜帶可展開內容時，可能會發生這種情況。這是預期行為，並不表示檢視器失敗。
  </Accordion>
  <Accordion title="找不到成品">
    - 成品因 TTL 而過期。
    - 權杖或路徑已變更。
    - 清理移除了過時資料。

  </Accordion>
</AccordionGroup>

## 操作指南

- 在畫布中進行本機互動式審查時，偏好使用 `mode: "view"`。
- 對於需要附件的對外聊天頻道，偏好使用 `mode: "file"`。
- 除非你的部署需要遠端檢視器 URL，否則請保持停用 `allowRemoteViewer`。
- 對敏感差異設定明確且較短的 `ttlSeconds`。
- 不需要時，避免在差異輸入中傳送祕密。
- 如果你的頻道會大幅壓縮圖片（例如 Telegram 或 WhatsApp），請偏好使用 PDF 輸出（`fileFormat: "pdf"`）。

<Note>
差異算繪引擎由 [Diffs](https://diffs.com) 提供支援。
</Note>

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [外掛](/zh-TW/tools/plugin)
- [工具概覽](/zh-TW/tools)
