---
read_when:
    - 你希望代理以 diff 形式顯示程式碼或 Markdown 編輯
    - 您需要可供畫布使用的檢視器 URL 或已算繪的差異檔案
    - 你需要具備安全預設值、受控且暫時性的差異成品
sidebarTitle: Diffs
summary: 供代理程式使用的唯讀差異檢視器與檔案渲染器（選用外掛工具）
title: 差異
x-i18n:
    generated_at: "2026-07-06T21:54:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9c70e665bdc13e0534060700c4fb7cfcf2d57fba69b884c4e782201236f13cb
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` 是選用的內建外掛工具，可將前後文字或 unified patch 轉成唯讀差異 artifact。它也會在系統提示前加上簡短的代理指引，並隨附 companion skill 以提供更完整的說明。

輸入：`before` + `after` 文字，或 unified `patch`（互斥）。

輸出：用於畫布呈現的閘道檢視器 URL、用於訊息傳遞的已渲染 PNG/PDF 檔案路徑，或兩者。

## 快速開始

<Steps>
  <Step title="安裝外掛">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="啟用外掛">
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
  <Step title="選擇模式">
    <Tabs>
      <Tab title="view">
        以畫布優先的流程：代理使用 `mode: "view"` 呼叫 `diffs`，並用 `canvas present` 開啟 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天檔案傳遞：代理使用 `mode: "file"` 呼叫 `diffs`，並透過 `message` 使用 `path` 或 `filePath` 傳送 `details.filePath`。
      </Tab>
      <Tab title="both">
        組合（預設）：代理使用 `mode: "both"` 呼叫 `diffs`，在一次呼叫中取得兩種 artifact。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 停用內建系統指引

若要保留工具但移除前置的系統提示指引，請將 `plugins.entries.diffs.hooks.allowPromptInjection` 設為 `false`：

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

這會阻擋外掛的 `before_prompt_build` hook，同時保留工具與 skill 可用。若要同時停用指引與工具，請改為停用此外掛。

## 工具輸入參考

除非另有註明，所有欄位皆為選用。

<ParamField path="before" type="string">
  原始文字。省略 `patch` 時，需與 `after` 一起提供。
</ParamField>
<ParamField path="after" type="string">
  更新後文字。省略 `patch` 時，需與 `before` 一起提供。
</ParamField>
<ParamField path="patch" type="string">
  Unified diff 文字。與 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  before/after 模式的顯示檔名。
</ParamField>
<ParamField path="lang" type="string">
  before/after 模式的語言覆寫提示。未知值以及預設檢視器集合以外的語言會回退為純文字，除非已安裝 Diff Viewer Language Pack 外掛。
</ParamField>
<ParamField path="title" type="string">
  檢視器標題覆寫。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  輸出模式。預設為外掛預設值 `defaults.mode`（`both`）。已棄用別名：`"image"` 的行為與 `"file"` 完全相同。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  檢視器主題。預設為外掛預設值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  差異版面配置。預設為外掛預設值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  在完整上下文可用時展開未變更區段。僅限單次呼叫選項（不是外掛預設鍵）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  已渲染檔案格式。預設為外掛預設值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF 渲染的品質預設。
</ParamField>
<ParamField path="fileScale" type="number">
  裝置縮放覆寫（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS 像素中的最大渲染寬度（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  檢視器與獨立檔案輸出的 artifact TTL（秒）。最大值 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  檢視器 URL origin 覆寫。會覆寫外掛 `viewerBaseUrl`。必須是 `http` 或 `https`，且不得有 query/hash。
</ParamField>

<AccordionGroup>
  <Accordion title="舊版輸入別名">
    為了向後相容，仍會接受：

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="驗證與限制">
    - `before`/`after`：各自最大 512 KiB。
    - `patch`：最大 2 MiB。
    - `path`：最大 2048 位元組。
    - `lang`：最大 128 位元組。
    - `title`：最大 1024 位元組。
    - Patch 複雜度上限：最多 128 個檔案與 120000 總行數。
    - `patch` 與 `before`/`after` 同時提供會被拒絕。
    - 已渲染檔案安全限制（PNG 與 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（8,000,000 個已渲染像素）。
      - `fileQuality: "hq"`：最大 14 MP。
      - `fileQuality: "print"`：最大 24 MP。
      - PDF 也限制最多 50 頁。

  </Accordion>
</AccordionGroup>

## 語法醒目提示

內建語言：

`javascript`、`typescript`、`tsx`、`jsx`、`json`、`markdown`、`yaml`、`css`、`html`、`sh`、`python`、`go`、`rust`、`java`、`c`、`cpp`、`csharp`、`php`、`sql`、`docker`、`ruby`、`swift`、`kotlin`、`r`、`dart`、`lua`、`powershell`、`xml` 和 `toml`。

常見別名（`js`、`ts`、`bash`、`md`、`yml`、`c++`、`dockerfile`、`rb`、`kt`、`ps1` 等）會正規化為這些語言。

安裝 Diff Viewer Language Pack 外掛以支援更多語言（Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI、diff 等）：

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

沒有該套件時，不支援的語言仍會以可讀的純文字渲染。請參閱 [Diffs Language Pack 外掛](/zh-TW/plugins/reference/diffs-language-pack) 與 [Shiki 語言](https://shiki.style/languages) 取得上游目錄。

## 輸出詳細資訊契約

所有成功結果都包含 `changed`：相同的 before/after 輸入會傳回 `false`，且不建立 artifact；已渲染結果會傳回 `true`。

<AccordionGroup>
  <Accordion title="檢視器欄位（view 和 both 模式）">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context`（`agentId`、`sessionId`、`messageChannel`、`agentAccountId` 可用時）

  </Accordion>
  <Accordion title="檔案欄位（file 和 both 模式）">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（與 `filePath` 相同值，用於 message 工具相容性）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="相容性別名（永遠會傳回）">
    - `format` (= `fileFormat`)
    - `imagePath` (= `filePath`)
    - `imageBytes` (= `fileBytes`)
    - `imageQuality` (= `fileQuality`)
    - `imageScale` (= `fileScale`)
    - `imageMaxWidth` (= `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

| 模式     | 傳回內容                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| `"view"` | 僅檢視器欄位。                                                                                          |
| `"file"` | 僅檔案欄位，沒有檢視器成品。                                                                        |
| `"both"` | 檢視器欄位加上檔案欄位。如果檔案轉譯失敗，檢視器仍會連同 `fileError`/`imageError` 傳回。 |

### 摺疊未變更區段

檢視器會顯示像 `N unmodified lines` 的列。只有在轉譯後的差異有可展開的上下文資料時，才會出現展開控制項（before/after 輸入常見）。許多 unified patches 會在其 hunk 中省略上下文主體，因此列可能會在沒有展開控制項的情況下出現，這是預期行為，不是錯誤。`expandUnchanged` 只會在存在可展開上下文時套用。

### 多檔案導覽

觸及多個檔案的修補會以已變更檔案摘要卡開始：總 `+N` / `-N` 計數、每檔案計數、新增/刪除/重新命名徽章，以及跳至各檔案的錨點連結。轉譯後的 PNG/PDF 檔案會保留每檔案標頭計數，但會移除互動式檢視切換，因為它們在靜態檔案中是無效控制項。

## 外掛預設值

在 `~/.openclaw/openclaw.json` 中設定整個外掛的預設值：

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

支援的 `defaults` 鍵：`fontFamily`、`fontSize`、`lineSpacing`、`layout`、`showLineNumbers`、`diffIndicators`、`wordWrap`、`background`、`theme`、`fileFormat`、`fileQuality`、`fileScale`、`fileMaxWidth`、`mode`、`ttlSeconds`。明確的工具呼叫參數會覆寫這些值。

### 持久檢視器 URL 設定

<ParamField path="viewerBaseUrl" type="string">
  當工具呼叫未傳入 `baseUrl` 時，由外掛擁有、用於傳回檢視器連結的後援值。必須是 `http` 或 `https`，且不得有查詢/雜湊。
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
  `false`：對檢視器路由的非回送請求會被拒絕。`true`：如果權杖化路徑有效，則允許遠端檢視器。
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

- 成品位於 `$TMPDIR/openclaw-diffs` 下。
- 檢視器中繼資料會儲存一個隨機 20 位十六進位字元成品 ID、一個隨機 48 位十六進位字元權杖、`createdAt`/`expiresAt`，以及已儲存的 `viewer.html` 路徑。
- 預設成品 TTL：30 分鐘。可接受的最大 TTL：6 小時。
- 每次成品建立呼叫後，清理會伺機執行；過期成品會被刪除。
- 當缺少中繼資料時，後援掃描會移除超過 24 小時的過期資料夾。

## 檢視器 URL 與網路行為

檢視器路由：`/plugins/diffs/view/{artifactId}/{token}`

檢視器資產：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（僅在差異使用語言套件語言時）

檢視器文件會相對於檢視器 URL 解析這些資產，因此選用的 `baseUrl` 路徑前綴也會套用到資產請求。

URL 解析順序：工具呼叫 `baseUrl`（經嚴格驗證後）-> 外掛 `viewerBaseUrl` -> 預設回送 `127.0.0.1`。如果閘道繫結模式是 `custom` 且已設定 `gateway.customBindHost`，則會使用該主機而非回送。

`baseUrl` 規則：必須是 `http://` 或 `https://`；查詢和雜湊會被拒絕；允許來源加上選用的基底路徑。

## 安全性模型

<AccordionGroup>
  <Accordion title="檢視器強化">
    - 預設僅限 loopback。
    - 使用令牌化的檢視器路徑，並嚴格驗證 ID 與令牌模式。
    - 檢視器回應 CSP：`default-src 'none'`；指令碼/資產僅來自 self；沒有對外的 `connect-src`。
    - 啟用遠端存取時的遠端未命中節流：每 60 秒 40 次失敗會觸發 60 秒鎖定（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="檔案算繪強化">
    - 截圖瀏覽器請求路由預設拒絕。
    - 只允許來自 `http://127.0.0.1/plugins/diffs/assets/*` 的本機檢視器資產。
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
  <Step title="平台後援">
    Chrome、Chromium、Edge 與 Brave 的常見安裝路徑和 `PATH` 查找。
  </Step>
</Steps>

常見失敗文字：`Diff PNG/PDF rendering requires a Chromium-compatible browser...`。透過安裝 Chrome、Chromium、Edge 或 Brave，或設定上述其中一個可執行檔路徑選項來修正。

## 疑難排解

<AccordionGroup>
  <Accordion title="輸入驗證錯誤">
    - `Provide patch or both before and after text.` -- 同時包含 `before` 與 `after`，或提供 `patch`。
    - `Provide either patch or before/after input, not both.` -- 不要混用輸入模式。
    - `Invalid baseUrl: ...` -- 使用具有選用路徑的 `http(s)` 來源，不含查詢/雜湊。
    - `{field} exceeds maximum size (...)` -- 縮小酬載大小。
    - 大型 patch 拒絕 -- 減少 patch 檔案數量或總行數。

  </Accordion>
  <Accordion title="檢視器可存取性">
    - 檢視器 URL 預設解析為 `127.0.0.1`。
    - 若要遠端存取，請設定外掛 `viewerBaseUrl`、每次呼叫傳入 `baseUrl`，或搭配 `gateway.customBindHost` 使用 `gateway.bind=custom`。
    - 如果 `gateway.trustedProxies` 包含同主機代理的 loopback（例如 Tailscale Serve），未帶轉發 client-IP 標頭的原始 loopback 檢視器請求會依設計故障關閉。
    - 對於該代理拓撲，建議對附件使用 `mode: "file"`/`"both"`，或刻意啟用 `security.allowRemoteViewer` 加上外掛 `viewerBaseUrl`/代理 `baseUrl`，以產生可分享的檢視器連結。
    - 只有在預期外部檢視器存取時，才啟用 `security.allowRemoteViewer`。

  </Accordion>
  <Accordion title="未修改行列沒有展開按鈕">
    對缺少可展開內容的 patch 輸入而言屬於預期情況；不是檢視器故障。
  </Accordion>
  <Accordion title="找不到成品">
    - 成品因 TTL 到期。
    - 令牌或路徑已變更。
    - 清理移除了過期資料。

  </Accordion>
</AccordionGroup>

## 操作指引

- 對於 canvas 中的本機互動式審查，建議使用 `mode: "view"`。
- 對於需要附件的對外聊天頻道，建議使用 `mode: "file"`。
- 除非你的部署需要遠端檢視器 URL，否則請保持停用 `allowRemoteViewer`。
- 對敏感 diff 設定明確且短的 `ttlSeconds`。
- 不需要時，避免在 diff 輸入中傳送秘密。
- 如果你的頻道會大幅壓縮圖片（例如 Telegram 或 WhatsApp），建議使用 PDF 輸出（`fileFormat: "pdf"`）。

<Note>
Diff 算繪引擎由 [Diffs](https://diffs.com) 提供。
</Note>

## 相關

- [瀏覽器](/zh-TW/tools/browser)
- [外掛](/zh-TW/tools/plugin)
- [工具概觀](/zh-TW/tools)
