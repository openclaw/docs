---
read_when:
    - 你希望代理程式以差異檔顯示程式碼或 Markdown 編輯內容
    - 你需要可供 Canvas 使用的檢視器 URL 或已算繪的差異檔案
    - 你需要採用安全預設值、可控且暫時的差異比較產出物
sidebarTitle: Diffs
summary: 供代理使用的唯讀差異檢視器與檔案轉譯器（選用外掛工具）
title: 差異
x-i18n:
    generated_at: "2026-07-12T14:49:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` 是選用的內建外掛工具，可將變更前／後文字或統一格式修補轉換成唯讀差異成品。它也會在系統提示詞前加入簡短的代理指引，並隨附一項配套 Skill，以提供更完整的操作說明。

輸入：`before` + `after` 文字，或統一格式的 `patch`（兩者互斥）。

輸出：用於畫布呈現的閘道檢視器 URL、用於訊息傳送的已算繪 PNG/PDF 檔案路徑，或兩者皆有。

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
        畫布優先流程：代理以 `mode: "view"` 呼叫 `diffs`，並使用 `canvas present` 開啟 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天檔案傳送：代理以 `mode: "file"` 呼叫 `diffs`，並使用 `message`，透過 `path` 或 `filePath` 傳送 `details.filePath`。
      </Tab>
      <Tab title="both">
        合併模式（預設）：代理以 `mode: "both"` 呼叫 `diffs`，即可在一次呼叫中取得兩種成品。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 停用內建系統指引

若要保留此工具，但移除前置加入的系統提示詞指引，請將 `plugins.entries.diffs.hooks.allowPromptInjection` 設為 `false`：

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

這會封鎖外掛的 `before_prompt_build` 鉤子，同時保留工具與 Skill 可供使用。若要同時停用指引與工具，請改為停用此外掛。

## 工具輸入參考

除非另有註明，否則所有欄位皆為選填。

<ParamField path="before" type="string">
  原始文字。省略 `patch` 時，必須與 `after` 一併提供。
</ParamField>
<ParamField path="after" type="string">
  更新後的文字。省略 `patch` 時，必須與 `before` 一併提供。
</ParamField>
<ParamField path="patch" type="string">
  統一格式差異文字。與 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  變更前／後模式使用的顯示檔名。
</ParamField>
<ParamField path="lang" type="string">
  變更前／後模式使用的語言覆寫提示。除非已安裝 Diff Viewer Language Pack 外掛，否則未知值及預設檢視器集合以外的語言會回退為純文字。
</ParamField>
<ParamField path="title" type="string">
  檢視器標題覆寫值。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  輸出模式。預設使用外掛預設值 `defaults.mode`（`both`）。已棄用的別名：`"image"` 的行為與 `"file"` 完全相同。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  檢視器佈景主題。預設使用外掛預設值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  差異版面配置。預設使用外掛預設值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  當完整內容可用時，展開未變更的區段。僅限單次呼叫使用的選項（不是外掛預設鍵）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  算繪檔案格式。預設使用外掛預設值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF 算繪的品質預設設定。
</ParamField>
<ParamField path="fileScale" type="number">
  裝置縮放覆寫值（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  以 CSS 像素為單位的最大算繪寬度（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  檢視器與獨立檔案輸出的成品存留時間（秒）。最大值為 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  檢視器 URL 來源覆寫值。覆寫外掛的 `viewerBaseUrl`。必須為 `http` 或 `https`，且不得包含查詢字串或雜湊。
</ParamField>

<AccordionGroup>
  <Accordion title="驗證與限制">
    - `before`/`after`：各自最大 512 KiB。
    - `patch`：最大 2 MiB。
    - `path`：最大 2048 位元組。
    - `lang`：最大 128 位元組。
    - `title`：最大 1024 位元組。
    - 修補複雜度上限：最多 128 個檔案及總計 120000 行。
    - 同時提供 `patch` 與 `before`/`after` 會遭到拒絕。
    - 算繪檔案的安全限制（PNG 與 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（8,000,000 個算繪像素）。
      - `fileQuality: "hq"`：最大 14 MP。
      - `fileQuality: "print"`：最大 24 MP。
      - PDF 另有最多 50 頁的限制。

  </Accordion>
</AccordionGroup>

## 語法醒目提示

內建語言：

`javascript`、`typescript`、`tsx`、`jsx`、`json`、`markdown`、`yaml`、`css`、`html`、`sh`、`python`、`go`、`rust`、`java`、`c`、`cpp`、`csharp`、`php`、`sql`、`docker`、`ruby`、`swift`、`kotlin`、`r`、`dart`、`lua`、`powershell`、`xml` 與 `toml`。

常用別名（`js`、`ts`、`bash`、`md`、`yml`、`c++`、`dockerfile`、`rb`、`kt`、`ps1` 等）會正規化為這些語言。

安裝 Diff Viewer Language Pack 外掛可支援更多語言（Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI、diff 等）：

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

未安裝語言套件時，不支援的語言仍會算繪為可讀的純文字。上游目錄請參閱 [Diffs Language Pack 外掛](/zh-TW/plugins/reference/diffs-language-pack) 與 [Shiki 語言](https://shiki.style/languages)。

## 輸出詳細資料契約

所有成功結果都包含 `changed`：變更前／後輸入相同時，會傳回 `false` 且不建立成品；已算繪的結果會傳回 `true`。

<AccordionGroup>
  <Accordion title="檢視器欄位（view 與 both 模式）">
    - `changed`
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
  <Accordion title="檔案欄位（file 與 both 模式）">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（與 `filePath` 值相同，用於訊息工具相容性）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| 模式     | 傳回內容                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | 僅檢視器欄位。                                                                             |
| `"file"` | 僅檔案欄位，不含檢視器成品。                                                           |
| `"both"` | 檢視器欄位加上檔案欄位。若檔案算繪失敗，檢視器仍會傳回，並包含 `fileError`。 |

### 摺疊的未變更區段

檢視器會顯示類似 `N unmodified lines` 的列。只有在算繪後的差異內容具有可展開的上下文資料時（常見於前後輸入），才會顯示展開控制項。許多統一格式修補程式的區塊不含上下文內容，因此可能顯示該列但沒有展開控制項——這是預期行為，不是錯誤。`expandUnchanged` 只會在有可展開的上下文時套用。

### 多檔案導覽

涉及多個檔案的修補程式會以變更檔案摘要卡片開頭：其中包含 `+N` / `-N` 總計數、各檔案計數、新增／刪除／重新命名徽章，以及可跳至各檔案的錨點連結。算繪後的 PNG/PDF 檔案會保留各檔案標頭中的計數，但移除互動式檢視切換控制項，因為這些控制項在靜態檔案中無法運作。

## 外掛預設值

在 `~/.openclaw/openclaw.json` 中設定外掛全域預設值：

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

支援的 `defaults` 鍵：`fontFamily`、`fontSize`、`lineSpacing`、`layout`、`showLineNumbers`、`diffIndicators`、`wordWrap`、`background`、`theme`、`fileFormat`、`fileQuality`、`fileScale`、`fileMaxWidth`、`mode`、`ttlSeconds`。明確指定的工具呼叫參數會覆寫這些值。

### 永久檢視器 URL 設定

<ParamField path="viewerBaseUrl" type="string">
  當工具呼叫未傳入 `baseUrl` 時，由外掛擁有並用於傳回檢視器連結的備援值。必須為 `http` 或 `https`，且不得含有查詢字串或雜湊。
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
  `false`：拒絕來自非迴路介面的檢視器路由要求。`true`：若權杖化路徑有效，則允許遠端檢視器。
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

## 成品生命週期與儲存空間

- 成品位於 `$TMPDIR/openclaw-diffs` 下。
- 檢視器中繼資料會儲存隨機的 20 位十六進位字元成品 ID、隨機的 48 位十六進位字元權杖、`createdAt`/`expiresAt`，以及所儲存的 `viewer.html` 路徑。
- 預設成品存留時間：30 分鐘。可接受的最長存留時間：6 小時。
- 每次建立成品的呼叫後，都會視情況執行清理；過期的成品會被刪除。
- 當中繼資料遺失時，備援清理會移除建立超過 24 小時的舊資料夾。

## 檢視器 URL 與網路行為

檢視器路由：`/plugins/diffs/view/{artifactId}/{token}`

檢視器資產：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（僅當差異內容使用語言套件中的語言時）

檢視器文件會相對於檢視器 URL 解析這些資產，因此選用的 `baseUrl` 路徑前綴也會套用至資產要求。

URL 解析順序：工具呼叫的 `baseUrl`（通過嚴格驗證後）-> 外掛的 `viewerBaseUrl` -> 預設迴路位址 `127.0.0.1`。若閘道繫結模式為 `custom`，且已設定 `gateway.customBindHost`，則會使用該主機而非迴路位址。

`baseUrl` 規則：必須為 `http://` 或 `https://`；拒絕查詢字串和雜湊；允許來源加上選用的基礎路徑。

## 安全性模型

<AccordionGroup>
  <Accordion title="檢視器強化">
    - 預設僅允許迴路介面。
    - 使用權杖化檢視器路徑，並嚴格驗證 ID 與權杖格式。
    - 檢視器回應 CSP：`default-src 'none'`；指令碼／資產僅能來自自身；不得向外連線至 `connect-src`。
    - 啟用遠端存取時的遠端失敗節流：每 60 秒內發生 40 次失敗會觸發 60 秒鎖定（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="檔案算繪強化">
    - 螢幕擷取畫面瀏覽器的要求路由預設為拒絕。
    - 僅允許來自 `http://127.0.0.1/plugins/diffs/assets/*` 的本機檢視器資產。
    - 封鎖外部網路要求。

  </Accordion>
</AccordionGroup>

## 檔案模式的瀏覽器需求

`mode: "file"` 和 `mode: "both"` 需要與 Chromium 相容的瀏覽器。

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
    Chrome、Chromium、Edge 與 Brave 的常見安裝路徑和 `PATH` 查找。
  </Step>
</Steps>

常見失敗訊息：`Diff PNG/PDF rendering requires a Chromium-compatible browser...`。請安裝 Chrome、Chromium、Edge 或 Brave，或設定上述其中一個可執行檔路徑選項來修正。

## 疑難排解

<AccordionGroup>
  <Accordion title="輸入驗證錯誤">
    - `Provide patch or both before and after text.` -- 同時提供 `before` 和 `after`，或提供 `patch`。
    - `Provide either patch or before/after input, not both.` -- 請勿混用輸入模式。
    - `Invalid baseUrl: ...` -- 使用可包含選用路徑但不含查詢字串或雜湊的 `http(s)` 來源。
    - `{field} exceeds maximum size (...)` -- 縮減承載資料大小。
    - 大型修補檔遭拒 -- 減少修補檔案數量或總行數。

  </Accordion>
  <Accordion title="檢視器存取">
    - 檢視器 URL 預設解析為 `127.0.0.1`。
    - 若要遠端存取，請設定外掛的 `viewerBaseUrl`、在每次呼叫時傳入 `baseUrl`，或搭配 `gateway.customBindHost` 使用 `gateway.bind=custom`。
    - 如果 `gateway.trustedProxies` 包含用於同一主機代理伺服器的回送位址（例如 Tailscale Serve），依設計，未攜帶轉送用戶端 IP 標頭的原始回送檢視器請求會採取失敗關閉。
    - 對於該代理拓撲，若需要附件，請優先使用 `mode: "file"`/`"both"`；若需要可分享的檢視器連結，則應有意啟用 `security.allowRemoteViewer`，並搭配外掛的 `viewerBaseUrl`/代理伺服器的 `baseUrl`。
    - 僅在預期需要外部檢視器存取時，才啟用 `security.allowRemoteViewer`。

  </Accordion>
  <Accordion title="未修改行的列沒有展開按鈕">
    對於缺少可展開上下文的修補輸入，此為預期行為，並非檢視器故障。
  </Accordion>
  <Accordion title="找不到成品">
    - 成品因 TTL 到期。
    - 權杖或路徑已變更。
    - 清理作業已移除過時資料。

  </Accordion>
</AccordionGroup>

## 操作指南

- 在畫布中進行本機互動式審查時，優先使用 `mode: "view"`。
- 對於需要附件的外寄聊天管道，優先使用 `mode: "file"`。
- 除非你的部署需要遠端檢視器 URL，否則請保持停用 `allowRemoteViewer`。
- 對於敏感差異，請明確設定較短的 `ttlSeconds`。
- 非必要時，避免在差異輸入中傳送密鑰。
- 如果你的管道會大量壓縮圖片（例如 Telegram 或 WhatsApp），請優先使用 PDF 輸出（`fileFormat: "pdf"`）。

<Note>
差異呈現引擎由 [Diffs](https://diffs.com) 提供支援。
</Note>

## 相關內容

- [瀏覽器](/zh-TW/tools/browser)
- [外掛](/zh-TW/tools/plugin)
- [工具概覽](/zh-TW/tools)
