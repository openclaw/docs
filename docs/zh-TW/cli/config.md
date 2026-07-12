---
read_when:
    - 你想要以非互動方式讀取或編輯設定
sidebarTitle: Config
summary: '`openclaw config` 的命令列介面參考（get/set/patch/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-07-11T21:10:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` 的非互動式輔助工具：依路徑取得／設定／修補／取消設定值、輸出結構描述、驗證，或輸出使用中的檔案路徑。不加子命令執行 `openclaw config`，即可開啟與 `openclaw configure` 相同的引導式精靈。

<Note>
當 `OPENCLAW_NIX_MODE=1` 時，OpenClaw 會將 `openclaw.json` 視為不可變。唯讀命令（`config get`、`config file`、`config schema`、`config validate`）仍可使用；設定寫入命令則會拒絕執行。請改為編輯安裝所使用的 Nix 來源；若使用官方 nix-openclaw 發行版，請參閱 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，並在 `programs.openclaw.config` 或 `instances.<name>.config` 下設定值。
</Note>

## 根層選項

<ParamField path="--section <section>" type="string">
  不加子命令執行 `openclaw config` 時，可重複指定的引導式設定區段篩選器。
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

可使用點號或方括號表示法。請在 shell 範例中為方括號路徑加上引號，以免 zsh 對 `[0]` 進行萬用字元展開：

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

從已遮蔽敏感資訊的設定快照讀取值（絕不輸出機密）。`--json` 會將原始值輸出為 JSON；否則字串／數字／布林值會直接輸出，而物件／陣列則會輸出為格式化的 JSON。

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

輸出使用中的設定檔路徑，此路徑由 `OPENCLAW_CONFIG_PATH` 或預設位置解析而得。該路徑指向一般檔案，而非符號連結；請參閱[寫入安全性](#write-safety)。

### `config schema`

將為 `openclaw.json` 產生的 JSON 結構描述輸出至標準輸出。

<AccordionGroup>
  <Accordion title="包含內容">
    - 目前的根層設定結構描述，以及供編輯器工具使用的根層 `$schema` 字串欄位。
    - Control UI 使用的欄位 `title`／`description` 文件中繼資料。
    - 當有相符的欄位文件時，巢狀物件、萬用字元（`*`）及陣列項目（`[]`）節點會繼承相同的 `title`／`description` 中繼資料。
    - `anyOf`／`oneOf`／`allOf` 分支也會繼承相同的文件中繼資料。
    - 當可載入執行階段資訊清單時，盡力提供即時外掛與頻道結構描述中繼資料。
    - 即使目前設定無效，也會提供乾淨的後備結構描述。

  </Accordion>
  <Accordion title="相關的執行階段 RPC">
    `config.schema.lookup` 會傳回一個正規化設定路徑，其中包含淺層結構描述節點（`title`、`description`、`type`、`enum`、`const`、常見界限）、相符的 UI 提示中繼資料及直接子項摘要。可用於在 Control UI 或自訂用戶端中依路徑逐層深入查看。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

在不啟動閘道的情況下，根據使用中的結構描述驗證目前設定。

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
若驗證已失敗，請先執行 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不會略過無效設定防護。
</Note>

## 值

系統會盡可能將值解析為 JSON5；否則會將其視為原始字串。使用 `--strict-json` 可要求標準 JSON，且不允許後備為字串（如此便會拒絕註解、尾隨逗號或未加引號的鍵等僅限 JSON5 的語法）。在 `config set` 中，`--json` 是 `--strict-json` 的舊版別名。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 會將原始值輸出為 JSON，而非終端機格式化文字。

<Note>
物件指派預設會取代目標路徑。對於通常包含使用者新增項目的受保護路徑，若取代操作會移除既有項目，除非傳入 `--replace`，否則會遭拒絕：`agents.defaults.models`、`agents.list`、`models.providers`、`models.providers.<id>`、`models.providers.<id>.models`、`plugins.entries` 及 `auth.profiles`。
</Note>

新增項目至這些映射時，請使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

只有在提供的值應刻意成為完整目標值時，才使用 `--replace`。

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
    僅能以 `secrets.providers.<alias>` 路徑為目標：

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

  </Tab>
</Tabs>

<Warning>
不支援在執行階段變更的介面會拒絕 SecretRef 指派（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 討論串繫結網路鉤子權杖，以及 WhatsApp 憑證 JSON）。請參閱 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
</Warning>

批次解析一律以批次承載內容（`--batch-json`／`--batch-file`）為唯一依據；`--strict-json`／`--json` 不會改變批次解析行為。

JSON 路徑／值模式也可直接用於 SecretRef 與提供者：

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

貼上或透過管線傳入符合設定形狀的 JSON5 修補內容，無須執行多個依路徑操作的 `config set` 命令。物件會遞迴合併；陣列與純量值會取代目標；`null` 會刪除目標路徑。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

若用於遠端設定指令碼，可透過標準輸入傳入修補內容：

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

當某個物件或陣列必須完全成為提供的值，而非進行遞迴修補時，請使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 會在不寫入的情況下執行結構描述及 SecretRef 可解析性檢查。試執行期間預設會略過由執行命令支援的 SecretRef；若刻意要讓試執行執行提供者命令，請加入 `--allow-exec`。

## 試執行

`--dry-run` 會在不寫入 `openclaw.json` 的情況下驗證變更。可用於 `config set`、`config patch` 及 `config unset`。

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
    - 原則驗證會針對變更後的完整設定執行，因此寫入父物件（例如將 `hooks` 設為物件）無法繞過不支援介面的驗證。
    - 為避免命令產生副作用，預設會略過 exec SecretRef 檢查；傳入 `--allow-exec` 即可選擇啟用（這可能會執行提供者命令）。`--allow-exec` 僅適用於試執行，若未搭配 `--dry-run` 則會發生錯誤。

  </Accordion>
  <Accordion title="--dry-run --json 欄位">
    - `ok`：試執行是否通過
    - `operations`：已評估的指派數量
    - `checks`：是否已執行結構描述／可解析性檢查
    - `checks.resolvabilityComplete`：可解析性檢查是否執行完成（略過 exec 參照時為 false）
    - `refsChecked`：試執行期間實際解析的參照數量
    - `skippedExecRefs`：因未設定 `--allow-exec` 而略過的 exec 參照數量
    - `errors`：當 `ok=false` 時，結構化的路徑不存在、結構描述或可解析性失敗資訊

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
      ref?: string, // present for resolvability errors
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
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
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
    - `Config policy validation failed: unsupported SecretRef usage`：將該憑證改回純文字／字串輸入；SecretRef 僅能用於支援的介面。
    - `SecretRef assignment(s) could not be resolved`：目前無法解析所參照的提供者／參照（缺少環境變數、檔案指標無效、exec 提供者失敗，或提供者／來源不相符）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：若需要驗證 exec 可解析性，請搭配 `--allow-exec` 重新執行。
    - 使用批次模式時，請修正失敗的項目，並在寫入前重新執行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 套用變更

每次成功執行 `config set`／`config patch`／`config unset` 後，命令列介面都會顯示下列三種提示之一，讓你知道閘道是否需要重新啟動：

| 提示                                                | 含義                                |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | 已變更的路徑需要完整重新啟動。 |
| `Change will apply without restarting the gateway.` | 熱重新載入會自動套用變更。  |
| `No gateway restart needed.`                        | 沒有與執行階段相關的變更。      |

寫入 `plugins.entries`（或其任何子路徑）一律需要重新啟動，因為命令列介面無法確認每個外掛的重新載入中繼資料是否皆已載入。

## 寫入安全性

`openclaw config set` 和其他由 OpenClaw 管理的設定寫入器，會在將變更提交至磁碟前驗證變更後的完整設定。如果新的內容無法通過結構描述驗證，或看起來會造成破壞性覆寫，系統會保留現用設定不變，並將遭拒的內容以 `openclaw.json.rejected.*` 儲存在旁邊。

<Warning>
現用設定路徑必須是一般檔案。不支援寫入符號連結形式的 `openclaw.json`；請改用 `OPENCLAW_CONFIG_PATH` 直接指向實際檔案。
</Warning>

小幅編輯建議優先透過命令列介面寫入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果寫入遭拒，請檢查已儲存的內容並修正完整設定結構：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

你仍可直接使用編輯器寫入，但執行中的閘道會將這些變更視為不受信任，直到驗證通過為止。無效的直接編輯會導致啟動失敗，或被熱重新載入略過；閘道不會重寫 `openclaw.json`。請執行 `openclaw doctor --fix`，以修復帶前綴／遭覆寫的設定，或還原最後一份已知可用的副本。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)。

完整檔案復原僅供 doctor 修復使用。外掛結構描述變更或 `minHostVersion` 不一致時會明確報錯，而不會回復與其無關的使用者設定，例如模型、提供者、驗證設定檔、頻道、閘道公開範圍、工具、記憶體、瀏覽器或排程設定。

## 修復循環

`openclaw config validate` 通過後，請使用本機終端介面，讓內嵌代理程式將現用設定與文件比較，同時在同一個終端機中驗證每項變更：

```bash
openclaw chat
```

在終端介面中，開頭的 `!` 會執行字面上的本機 shell 命令（每個工作階段首次使用時會顯示一次確認提示）：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="與文件比較">
    要求代理程式將目前的設定與相關文件頁面比較，並建議最小幅度的修正。
  </Step>
  <Step title="套用針對性編輯">
    使用 `openclaw config set` 或 `openclaw configure` 套用針對性編輯。
  </Step>
  <Step title="重新驗證">
    每次變更後重新執行 `openclaw config validate`。
  </Step>
  <Step title="使用 doctor 處理執行階段問題">
    如果驗證已通過但執行階段仍不正常，請執行 `openclaw doctor` 或 `openclaw doctor --fix`，以取得遷移及修復協助。
  </Step>
</Steps>

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
