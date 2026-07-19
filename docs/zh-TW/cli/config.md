---
read_when:
    - 你想要以非互動方式讀取或編輯設定。
sidebarTitle: Config
summary: '`openclaw config` 的命令列介面參考（get/set/patch/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-07-19T13:41:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b6339649c229aaf121b753111bd3a7e3bd6837ed133bc38b77e4ff975cc64be0
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` 的非互動式輔助工具：依路徑取得／設定／修補／取消設定值、列印結構描述、驗證，或列印使用中的檔案路徑。不帶子命令執行 `openclaw config`，即可開啟與 `openclaw configure` 相同的引導式精靈。

<Note>
當 `OPENCLAW_NIX_MODE=1` 時，OpenClaw 會將 `openclaw.json` 視為不可變更。唯讀命令（`config get`、`config file`、`config schema`、`config validate`）仍可運作；設定寫入命令則會拒絕執行。請改為編輯該安裝的 Nix 原始碼；若使用第一方 nix-openclaw 發行版，請參閱 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，並在 `programs.openclaw.config` 或 `instances.<name>.config` 下設定值。
</Note>

## 根層級選項

<ParamField path="--section <section>" type="string">
  不帶子命令執行 `openclaw config` 時，可重複指定的引導式設定區段篩選器。
</ParamField>

引導式區段：`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

## 範例

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### 路徑

使用點號或括號標記法。在 shell 範例中，請以引號括住括號路徑，避免 zsh 對 `[0]` 進行 glob 展開：

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

從已遮蔽敏感資訊的設定快照讀取值（絕不列印機密）。`--json` 會以 JSON 列印原始值；否則字串／數字／布林值會直接列印，而物件／陣列則以格式化的 JSON 列印。

找不到路徑時，`--json` 會將 `{ "error": "Config path not found: <path>" }` 寫入 stdout，並以狀態碼 1 結束。未使用 `--json` 時，診斷訊息仍會輸出至 stderr。

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

列印使用中的設定檔路徑，此路徑由 `OPENCLAW_CONFIG_PATH` 或預設位置解析而得。該路徑指向一般檔案，而非符號連結；請參閱[寫入安全性](#write-safety)。

### `config schema`

將為 `openclaw.json` 產生的 JSON 結構描述列印至 stdout。

<AccordionGroup>
  <Accordion title="包含的內容">
    - 目前的根層級設定結構描述，以及供編輯器工具使用的根層級 `$schema` 字串欄位。
    - Control UI 使用的欄位 `title`／`description` 文件中繼資料。
    - 若有相符的欄位文件，巢狀物件、萬用字元（`*`）和陣列項目（`[]`）節點會繼承相同的 `title`／`description` 中繼資料。
    - `anyOf`／`oneOf`／`allOf` 分支也會繼承相同的文件中繼資料。
    - 當可載入執行階段資訊清單時，會盡力提供即時外掛與頻道結構描述中繼資料。
    - 即使目前設定無效，也會提供乾淨的後援結構描述。

  </Accordion>
  <Accordion title="相關的執行階段 RPC">
    `config.schema.lookup` 會傳回一個正規化設定路徑，其中包含淺層結構描述節點（`title`、`description`、`type`、`enum`、`const`、通用界限）、相符的 UI 提示中繼資料，以及直接子項摘要。請將其用於 Control UI 或自訂用戶端中限定路徑範圍的逐層深入檢視。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

不啟動閘道，直接依使用中的結構描述驗證目前設定。

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
若驗證已經失敗，請先從 `openclaw configure` 或 `openclaw doctor --fix` 著手。`openclaw chat` 不會略過無效設定防護。
</Note>

## 值

系統會盡可能將值解析為 JSON5；否則視為原始字串。使用 `--strict-json` 可要求使用標準 JSON，且不允許退回字串（此時會拒絕註解、尾端逗號或未加引號的鍵等僅限 JSON5 的語法）。在 `config set` 上，`--json` 是 `--strict-json` 的舊版別名。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 會以 JSON 列印原始值，而非終端機格式化文字。

<Note>
根據預設，指派物件會取代目標路徑。通常會包含使用者新增項目的受保護路徑，若替換會移除現有項目，除非傳入 `--replace`，否則將拒絕執行：`agents.defaults.models`、`agents.list`、`models.providers`、`models.providers.<id>`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`。
</Note>

將項目新增至這些映射時，請使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

僅當所提供的值應刻意成為完整目標值時，才使用 `--replace`。

## `config set` 模式

<Tabs>
  <Tab title="值模式">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef 建構器模式">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="提供者建構器模式">
    僅限以 `secrets.providers.<alias>` 路徑為目標：

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="批次模式">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

    批次檔案上限為 8 MiB。

  </Tab>
</Tabs>

<Warning>
不支援執行階段變更的介面會拒絕 SecretRef 指派（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 討論串繫結網路鉤子權杖，以及 WhatsApp 認證資訊 JSON）。請參閱 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。
</Warning>

批次解析一律以批次承載資料（`--batch-json`／`--batch-file`）為準；`--strict-json`／`--json` 不會變更批次解析行為。

JSON 路徑／值模式也可直接用於 SecretRef 和提供者：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### 提供者建構器旗標

提供者建構器的目標必須使用 `secrets.providers.<alias>` 作為路徑。

<AccordionGroup>
  <Accordion title="通用旗標">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="環境變數提供者（--provider-source env）">
    - `--provider-allowlist <ENV_VAR>`（可重複指定）

  </Accordion>
  <Accordion title="檔案提供者（--provider-source file）">
    - `--provider-path <path>`（必填）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="執行命令提供者（--provider-source exec）">
    - `--provider-command <path>`（必填）
    - `--provider-arg <arg>`（可重複指定）
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>`（可重複指定）
    - `--provider-pass-env <ENV_VAR>`（可重複指定）
    - `--provider-trusted-dir <path>`（可重複指定）
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

強化的執行命令提供者範例：

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## `config patch`

貼上或以管線傳入符合設定形狀的 JSON5 修補，而不必執行多個依路徑操作的 `config set` 命令。物件會遞迴合併；陣列和純量值會取代目標；`null` 會刪除目標路徑。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

修補檔案上限為 8 MiB。透過管線傳入的 `--stdin` 修補上限為 1 MiB。

針對遠端設定指令碼，可透過 stdin 以管線傳入修補：

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

修補範例：

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

當某個物件或陣列必須完全成為所提供的值，而非進行遞迴修補時，請使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 會執行結構描述與 SecretRef 可解析性檢查，但不會寫入。根據預設，試執行期間會略過由執行命令支援的 SecretRef；若你刻意要讓試執行執行提供者命令，請加入 `--allow-exec`。

## 試執行

`--dry-run` 會驗證變更，但不會寫入 `openclaw.json`。可用於 `config set`、`config patch` 和 `config unset`。

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="試執行行為">
    - 建構器模式：針對已變更的參照／提供者執行 SecretRef 可解析性檢查。
    - JSON 模式（`--strict-json`、`--json` 或批次模式）：執行結構描述驗證及 SecretRef 可解析性檢查。
    - 政策驗證會針對變更後的完整設定執行，因此寫入父物件（例如將 `hooks` 設為物件）無法略過不支援介面的驗證。
    - 預設會略過 exec SecretRef 檢查，以避免命令產生副作用；傳入 `--allow-exec` 可選擇啟用（這可能會執行提供者命令）。`--allow-exec` 僅適用於試執行，未搭配 `--dry-run` 時會發生錯誤。

  </Accordion>
  <Accordion title="--dry-run --json 欄位">
    - `ok`：試執行是否通過
    - `operations`：已評估的指派數量
    - `checks`：是否已執行結構描述／可解析性檢查
    - `checks.resolvabilityComplete`：可解析性檢查是否執行完畢（略過 exec 參照時為 false）
    - `refsChecked`：試執行期間實際解析的參照數量
    - `skippedExecRefs`：因未設定 `--allow-exec` 而略過的 exec 參照數量
    - `errors`：`ok=false` 時，結構化的路徑缺失、結構描述或可解析性失敗資訊

  </Accordion>
</AccordionGroup>

### JSON 輸出結構

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // 可解析性錯誤時存在
    },
  ],
}
```

<Tabs>
  <Tab title="成功範例">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="失敗範例">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "錯誤：未設定環境變數 \"MISSING_TEST_SECRET\"。",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="如果試執行失敗">
    - `config schema validation failed`：變更後的設定結構無效；請修正路徑／值或提供者／參照物件的結構。
    - `Config policy validation failed: unsupported SecretRef usage`：將該認證資訊改回純文字／字串輸入；SecretRef 僅能用於支援的介面。
    - `SecretRef assignment(s) could not be resolved`：目前無法解析所參照的提供者／參照（環境變數缺失、檔案指標無效、exec 提供者失敗，或提供者／來源不相符）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：如需驗證 exec 可解析性，請搭配 `--allow-exec` 重新執行。
    - 在批次模式下，請修正失敗的項目，並在寫入前重新執行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 套用變更

每次成功執行 `config set`／`config patch`／`config unset` 後，命令列介面會列印以下三種提示之一，讓你知道閘道是否需要重新啟動：

| 提示                                                | 意義                                |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | 已變更的路徑需要完整重新啟動。 |
| `Change will apply without restarting the gateway.` | 熱重新載入會自動套用變更。  |
| `No gateway restart needed.`                        | 未變更任何與執行階段相關的內容。      |

寫入 `plugins.entries`（或其任何子路徑）一律需要重新啟動，因為命令列介面無法確認每個外掛的重新載入中繼資料都已載入。

## 寫入安全性

`openclaw config set` 和其他由 OpenClaw 擁有的設定寫入器，會在將變更寫入磁碟前驗證變更後的完整設定。如果新的承載資料未通過結構描述驗證，或看起來會造成破壞性覆寫，系統會保留目前的設定不變，並將遭拒的承載資料以 `openclaw.json.rejected.*` 儲存在其旁。

OpenClaw 擁有的寫入操作會將 JSON5 重新序列化為標準 JSON。當來源包含註解時，寫入器會在移除註解前立即發出警告；若需要保留註解，請使用編輯器直接編輯。

<Warning>
使用中的設定路徑必須是一般檔案。不支援寫入使用符號連結的 `openclaw.json` 配置；請改用 `OPENCLAW_CONFIG_PATH` 直接指向實際檔案。
</Warning>

小幅編輯時，建議使用命令列介面寫入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果寫入遭拒，請檢查已儲存的承載資料，並修正完整的設定結構：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍可使用編輯器直接寫入，但執行中的閘道會將其視為不受信任，直到通過驗證為止。無效的直接編輯會導致啟動失敗，或被熱重新載入略過；閘道不會重寫 `openclaw.json`。請執行 `openclaw doctor --fix`，以修復加上前置內容／遭覆寫的設定，或還原最後一份已知良好的副本。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)。

完整檔案復原僅供 doctor 修復使用。外掛結構描述變更或 `minHostVersion` 偏差會明確回報錯誤，而不會回復模型、提供者、驗證設定檔、頻道、閘道公開範圍、工具、記憶、瀏覽器或排程設定等不相關的使用者設定。

## 修復迴圈

`openclaw config validate` 通過後，請使用本機終端介面，讓內嵌代理程式對照文件比較目前使用中的設定，同時在同一個終端機中驗證每項變更：

```bash
openclaw chat
```

在終端介面中，開頭的 `!` 會執行字面上的本機 shell 命令（每個工作階段首次執行時會顯示一次確認提示）：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="與文件比較">
    要求代理程式將目前的設定與相關文件頁面進行比較，並建議最小幅度的修正。
  </Step>
  <Step title="套用針對性編輯">
    使用 `openclaw config set` 或 `openclaw configure` 套用針對性編輯。
  </Step>
  <Step title="重新驗證">
    每次變更後，重新執行 `openclaw config validate`。
  </Step>
  <Step title="使用 Doctor 處理執行階段問題">
    如果驗證通過，但執行階段仍不正常，請執行 `openclaw doctor` 或 `openclaw doctor --fix`，以取得移轉和修復協助。
  </Step>
</Steps>

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
