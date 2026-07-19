---
read_when:
    - 你希望代理程式以差異格式顯示程式碼或 Markdown 編輯內容
    - 你需要一個可直接用於 Canvas 的檢視器 URL 或已算繪的差異檔案
    - 你需要具備安全預設值、可控且暫時性的差異成品
sidebarTitle: Diffs
summary: 供代理程式使用的唯讀差異檢視器與檔案轉譯器（選用外掛工具）
title: 差異
x-i18n:
    generated_at: "2026-07-19T14:04:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: baeb5dd1277120e57178f092e3ae1616edd3389a54721c929d8711301535d302
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` 是選用的內建外掛工具，可將前後文字或統一格式修補轉換為唯讀差異成品。它也會在系統提示詞前加入簡短的代理程式指引，並隨附一個提供更完整說明的配套 skill。

輸入：`before` + `after` 文字，或統一格式的 `patch`（互斥）。

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
        畫布優先流程：代理程式以 `mode: "view"` 呼叫 `diffs`，並使用 `canvas present` 開啟 `details.viewerUrl`。
      </Tab>
      <Tab title="file">
        聊天檔案傳送：代理程式以 `mode: "file"` 呼叫 `diffs`，並使用 `path` 或 `filePath`，以 `message` 傳送 `details.filePath`。
      </Tab>
      <Tab title="both">
        組合模式（預設）：代理程式以 `mode: "both"` 呼叫 `diffs`，在單次呼叫中取得兩種成品。
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 停用內建系統指引

若要保留工具但移除前置加入的系統提示詞指引，請將 `plugins.entries.diffs.hooks.allowPromptInjection` 設為 `false`：

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

這會封鎖外掛的 `before_prompt_build` 鉤子，同時讓工具與 skill 保持可用。若要同時停用指引與工具，請改為停用外掛。

## 工具輸入參考

除非另有註明，否則所有欄位皆為選填。

<ParamField path="before" type="string">
  原始文字。省略 `patch` 時，必須與 `after` 一同提供。
</ParamField>
<ParamField path="after" type="string">
  更新後的文字。省略 `patch` 時，必須與 `before` 一同提供。
</ParamField>
<ParamField path="patch" type="string">
  統一格式差異文字。與 `before` 和 `after` 互斥。
</ParamField>
<ParamField path="path" type="string">
  前後比較模式中顯示的檔名。
</ParamField>
<ParamField path="lang" type="string">
  前後比較模式的語言覆寫提示。除非已安裝 Diff Viewer Language Pack 外掛，否則未知值及預設檢視器集合以外的語言會回退為純文字。
</ParamField>
<ParamField path="title" type="string">
  檢視器標題覆寫值。
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  輸出模式。預設使用外掛預設值 `defaults.mode`（`both`）。已棄用的別名：`"image"` 的行為與 `"file"` 完全相同。
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  檢視器主題。預設使用外掛預設值 `defaults.theme`。
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  差異版面配置。預設使用外掛預設值 `defaults.layout`。
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  當完整上下文可用時，展開未變更的區段。僅限單次呼叫的選項（不是外掛預設鍵）。
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  算繪檔案格式。預設使用外掛預設值 `defaults.fileFormat`。
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF 算繪的品質預設。
</ParamField>
<ParamField path="fileScale" type="number">
  裝置縮放覆寫值（`1`-`4`）。
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  以 CSS 像素為單位的最大算繪寬度（`640`-`2400`）。
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  檢視器和獨立檔案輸出的成品存留時間，以秒為單位。最大值為 `21600`。
</ParamField>
<ParamField path="baseUrl" type="string">
  檢視器 URL 來源覆寫值。覆寫外掛的 `viewerBaseUrl`。必須是 `http` 或 `https`，不得包含查詢字串或雜湊。
</ParamField>

<AccordionGroup>
  <Accordion title="驗證與限制">
    - `before`/`after`：各自最大 512 KiB。
    - `patch`：最大 2 MiB。
    - `path`：最大 2048 位元組。
    - `lang`：最大 128 位元組。
    - `title`：最大 1024 位元組。
    - 修補複雜度上限：最多 128 個檔案，總行數最多 120000 行。
    - 同時提供 `patch` 與 `before`/`after` 會遭到拒絕。
    - 算繪檔案安全限制（PNG 和 PDF）：
      - `fileQuality: "standard"`：最大 8 MP（8,000,000 個算繪像素）。
      - `fileQuality: "hq"`：最大 14 MP。
      - `fileQuality: "print"`：最大 24 MP。
      - PDF 另有 50 頁的上限。

  </Accordion>
</AccordionGroup>

## 語法醒目提示

內建語言：

`javascript`、`typescript`、`tsx`、`jsx`、`json`、`markdown`、`yaml`、`css`、`html`、`sh`、`python`、`go`、`rust`、`java`、`c`、`cpp`、`csharp`、`php`、`sql`、`docker`、`ruby`、`swift`、`kotlin`、`r`、`dart`、`lua`、`powershell`、`xml`，以及 `toml`。

常見別名（`js`、`ts`、`bash`、`md`、`yml`、`c++`、`dockerfile`、`rb`、`kt`、`ps1` 等）會正規化為這些語言。

安裝 Diff Viewer Language Pack 外掛以支援更多語言（Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI、diff 等）：

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

未安裝語言套件時，不支援的語言仍會算繪為可讀的純文字。如需上游目錄，請參閱 [Diffs Language Pack 外掛](/zh-TW/plugins/reference/diffs-language-pack) 和 [Shiki 語言](https://shiki.style/languages)。

## 輸出詳細資料合約

所有成功結果皆包含 `changed`：前後輸入完全相同時會傳回 `false`，且不建立成品；已算繪的結果會傳回 `true`。

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
    - `context`（可用時為 `agentId`、`sessionId`、`messageChannel`、`agentAccountId`）

  </Accordion>
  <Accordion title="檔案欄位（file 和 both 模式）">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`（與 `filePath` 的值相同，用於相容訊息工具）
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| 模式     | 傳回內容                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | 僅限檢視器欄位。                                                                             |
| `"file"` | 僅限檔案欄位，不含檢視器成品。                                                           |
| `"both"` | 檢視器欄位加上檔案欄位。若檔案算繪失敗，檢視器仍會連同 `fileError` 傳回。 |

### 收合未變更的區段

檢視器會顯示如 `N unmodified lines` 的資料列。只有已算繪的差異包含可展開的上下文資料時，才會顯示展開控制項（前後輸入通常符合此情況）。許多統一格式修補會在其區塊中省略上下文內容，因此資料列可能會出現但沒有展開控制項——這是預期行為，並非錯誤。`expandUnchanged` 僅在存在可展開的上下文時適用。

### 多檔案導覽

涉及多個檔案的修補會以已變更檔案摘要卡片開頭：`+N` / `-N` 總數、各檔案計數、新增／刪除／重新命名徽章，以及可跳至各檔案的錨點連結。已算繪的 PNG/PDF 檔案會保留各檔案標頭中的計數，但會移除互動式檢視切換控制項，因為這些控制項在靜態檔案中無法運作。

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

### 持續性檢視器 URL 設定

<ParamField path="viewerBaseUrl" type="string">
  當工具呼叫未傳入 `baseUrl` 時，外掛所擁有、用於傳回檢視器連結的回退值。必須是 `http` 或 `https`，不得包含查詢字串或雜湊。
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
  `false`：拒絕對檢視器路由的非回送位址要求。`true`：若權杖化路徑有效，則允許遠端檢視器。
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

- 檢視器 HTML 與中繼資料位於共用的 `state/openclaw.sqlite` 資料庫中，使用 Diffs 外掛的 blob 命名空間。HTML 會以 gzip 壓縮；SQLite 僅儲存隨機 URL 權杖的 SHA-256 雜湊，而非權杖本身。
- 算繪後的 PNG/PDF 檔案仍是 `$TMPDIR/openclaw-diffs` 下的暫時具體化檔案，因為頻道傳送需要檔案路徑。SQLite 負責管理其到期中繼資料；不會寫入 JSON 附屬檔案。
- 預設成品 TTL：30 分鐘。可接受的最長 TTL：6 小時。
- 每次建立成品呼叫後，都會伺機執行清理。系統會先刪除已到期的 SQLite 資料列，接著刪除任何對應的 PNG/PDF 目錄。
- 備援掃描會移除超過 24 小時且沒有對應資料列的暫存資料夾。不會匯入或讀取舊版 `meta.json`、`file-meta.json` 與 `viewer.html` 快取。

## 檢視器 URL 與網路行為

檢視器路由：`/plugins/diffs/view/{artifactId}/{token}`

檢視器資產：

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`（僅限差異使用語言套件所支援的語言時）

檢視器文件會以檢視器 URL 為基準解析這些資產，因此選用的 `baseUrl` 路徑前綴也會套用至資產要求。

URL 解析順序：工具呼叫的 `baseUrl`（經嚴格驗證後）-> 外掛的 `viewerBaseUrl` -> 預設回送位址 `127.0.0.1`。如果閘道繫結模式為 `custom`，且已設定 `gateway.customBindHost`，則會使用該主機而非回送位址。

`baseUrl` 規則：必須是 `http://` 或 `https://`；不接受查詢與雜湊；允許來源加上選用的基礎路徑。

## 安全性模型

<AccordionGroup>
  <Accordion title="檢視器強化">
    - 預設僅限回送位址。
    - 檢視器路徑使用權杖，並嚴格驗證 ID 與權杖格式。
    - 檢視器回應 CSP：`default-src 'none'`；指令碼與資產僅限自身來源；不得向外部 `connect-src`。
    - 啟用遠端存取時會限制遠端失敗嘗試：60 秒內失敗 40 次會觸發 60 秒鎖定（`429 Too Many Requests`）。

  </Accordion>
  <Accordion title="檔案算繪強化">
    - 螢幕截圖瀏覽器的要求路由預設全部拒絕。
    - 僅允許來自 `http://127.0.0.1/plugins/diffs/assets/*` 的本機檢視器資產。
    - 外部網路要求會遭封鎖。

  </Accordion>
</AccordionGroup>

## 檔案模式的瀏覽器需求

`mode: "file"` 與 `mode: "both"` 需要與 Chromium 相容的瀏覽器。

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
    Chrome、Chromium、Edge 與 Brave 的常見安裝路徑及 `PATH` 查找。
  </Step>
</Steps>

常見失敗文字：`Diff PNG/PDF rendering requires a Chromium-compatible browser...`。請安裝 Chrome、Chromium、Edge 或 Brave，或設定上述任一可執行檔路徑選項來修正。

## 疑難排解

<AccordionGroup>
  <Accordion title="輸入驗證錯誤">
    - `Provide patch or both before and after text.` -- 同時包含 `before` 與 `after`，或提供 `patch`。
    - `Provide either patch or before/after input, not both.` -- 請勿混用輸入模式。
    - `Invalid baseUrl: ...` -- 使用 `http(s)` 來源並可選擇附加路徑，不得包含查詢或雜湊。
    - `{field} exceeds maximum size (...)` -- 縮減承載資料大小。
    - 大型修補檔遭拒絕 -- 減少修補檔案數或總行數。

  </Accordion>
  <Accordion title="檢視器可存取性">
    - 檢視器 URL 預設解析為 `127.0.0.1`。
    - 若要遠端存取，請設定外掛的 `viewerBaseUrl`、在每次呼叫中傳入 `baseUrl`，或搭配 `gateway.customBindHost` 使用 `gateway.bind=custom`。
    - 如果 `gateway.trustedProxies` 包含供同一主機代理使用的回送位址（例如 Tailscale Serve），依設計，未附轉送用戶端 IP 標頭的原始回送檢視器要求會以失敗關閉。
    - 對於此代理拓撲，若要使用附件，建議選用 `mode: "file"`/`"both"`；若要建立可分享的檢視器連結，則應明確啟用 `security.allowRemoteViewer`，並搭配外掛的 `viewerBaseUrl` 或代理的 `baseUrl`。
    - 僅在預期允許外部存取檢視器時，才啟用 `security.allowRemoteViewer`。

  </Accordion>
  <Accordion title="未修改行的資料列沒有展開按鈕">
    如果修補檔輸入缺少可展開的上下文，這是預期行為，並非檢視器故障。
  </Accordion>
  <Accordion title="找不到成品">
    - 成品因 TTL 到期。
    - 權杖或路徑已變更。
    - 清理程序已移除過時資料。

  </Accordion>
</AccordionGroup>

## 操作指引

- 在畫布中進行本機互動式審查時，建議使用 `mode: "view"`。
- 對於需要附件的外送聊天頻道，建議使用 `mode: "file"`。
- 除非你的部署需要遠端檢視器 URL，否則請保持停用 `allowRemoteViewer`。
- 對於敏感差異，請明確設定較短的 `ttlSeconds`。
- 非必要時，請避免在差異輸入中傳送祕密。
- 如果你的頻道會大幅壓縮圖片（例如 Telegram 或 WhatsApp），建議使用 PDF 輸出（`fileFormat: "pdf"`）。

<Note>
差異算繪引擎由 [Diffs](https://diffs.com) 提供技術支援。
</Note>

## 相關內容

- [瀏覽器](/zh-TW/tools/browser)
- [外掛](/zh-TW/tools/plugin)
- [工具概覽](/zh-TW/tools)
