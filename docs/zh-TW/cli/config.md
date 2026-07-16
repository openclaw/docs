---
read_when:
    - 你想要以非互動方式讀取或編輯設定
sidebarTitle: Config
summary: '`openclaw config` 的命令列介面參考（get/set/patch/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-07-16T11:28:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` 的非互動式輔助功能：依路徑取得／設定／修補／取消設定值、列印結構描述、驗證，或列印目前使用中的檔案路徑。不含子命令執行 `openclaw config`，即可開啟與 `openclaw configure` 相同的引導式精靈。

<Note>
當 `OPENCLAW_NIX_MODE=1` 時，OpenClaw 會將 `openclaw.json` 視為不可變。唯讀命令（`config get`、`config file`、`config schema`、`config validate`）仍可運作；設定寫入命令則會拒絕執行。請改為編輯該安裝項目的 Nix 來源；若使用第一方 nix-openclaw 發行版，請參閱 [nix-openclaw 快速入門](https://github.com/openclaw/nix-openclaw#quick-start)，並在 `programs.openclaw.config` 或 `instances.<name>.config` 下設定值。
</Note>

## 根選項

<ParamField path="--section <section>" type="string">
  不含子命令執行 `openclaw config` 時，可重複使用的引導式設定區段篩選器。
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

使用點號或方括號標記法。在 shell 範例中請將方括號路徑加上引號，以免 zsh 將 `[0]` 展開為 glob：

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

從經過遮蔽處理的設定快照讀取值（絕不列印祕密）。`--json` 會將原始值列印為 JSON；否則，字串／數字／布林值會直接列印，而物件／陣列則會列印為格式化的 JSON。

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

列印從 `OPENCLAW_CONFIG_PATH` 或預設位置解析出的目前使用中設定檔路徑。此路徑指向一般檔案，而非符號連結；請參閱[寫入安全性](#write-safety)。

### `config schema`

將為 `openclaw.json` 產生的 JSON 結構描述列印至標準輸出。

<AccordionGroup>
  <Accordion title="包含的內容">
    - 目前的根設定結構描述，另加一個供編輯器工具使用的根 `$schema` 字串欄位。
    - 控制介面所使用的欄位 `title`／`description` 文件中繼資料。
    - 若有相符的欄位文件，巢狀物件、萬用字元（`*`）和陣列項目（`[]`）節點會繼承相同的 `title`／`description` 中繼資料。
    - `anyOf`／`oneOf`／`allOf` 分支也會繼承相同的文件中繼資料。
    - 當可載入執行階段資訊清單時，盡可能提供即時外掛與頻道的結構描述中繼資料。
    - 即使目前設定無效，也會提供乾淨的備援結構描述。

  </Accordion>
  <Accordion title="相關的執行階段 RPC">
    `config.schema.lookup` 會傳回一個正規化的設定路徑，其中包含淺層結構描述節點（`title`、`description`、`type`、`enum`、`const`、常見界限）、相符的介面提示中繼資料，以及直接子項摘要。可用於控制介面或自訂用戶端中的路徑範圍深入檢視。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

在不啟動閘道的情況下，依目前使用中的結構描述驗證目前設定。

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
如果驗證已經失敗，請先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不會略過無效設定防護。
</Note>

## 值

系統會盡可能將值剖析為 JSON5；否則將其視為原始字串。使用 `--strict-json` 可要求標準 JSON，且不允許退回字串（此時會拒絕註解、尾隨逗號或未加引號的鍵等僅限 JSON5 的語法）。在 `config set` 上，`--json` 是 `--strict-json` 的舊版別名。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 會將原始值列印為 JSON，而非終端機格式化文字。

<Note>
物件指派預設會取代目標路徑。對於通常含有使用者新增項目的受保護路徑，若替換會移除現有項目，除非傳入 `--replace`，否則系統會拒絕：`agents.defaults.models`、`agents.list`、`models.providers`、`models.providers.<id>`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`。
</Note>

將項目新增至這些對應表時，請使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

只有在所提供的值應刻意成為完整目標值時，才使用 `--replace`。

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
    僅以 `secrets.providers.<alias>` 路徑為目標：

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
不支援在可於執行階段變更的介面上指派 SecretRef（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 討論串繫結網路鉤子權杖，以及 WhatsApp 認證資訊 JSON），此類指派會遭拒絕。請參閱 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。
</Warning>

批次剖析一律以批次承載內容（`--batch-json`/`--batch-file`）為事實來源；`--strict-json`／`--json` 不會變更批次剖析行為。

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
    - `--provider-allowlist <ENV_VAR>`（可重複）

  </Accordion>
  <Accordion title="檔案提供者（--provider-source file）">
    - `--provider-path <path>`（必填）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="執行提供者（--provider-source exec）">
    - `--provider-command <path>`（必填）
    - `--provider-arg <arg>`（可重複）
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>`（可重複）
    - `--provider-pass-env <ENV_VAR>`（可重複）
    - `--provider-trusted-dir <path>`（可重複）
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

強化的執行提供者範例：

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

貼上或透過管線傳入符合設定形狀的 JSON5 修補內容，而不必執行多個以路徑為基礎的 `config set` 命令。物件會遞迴合併；陣列和純量值會取代目標；`null` 會刪除目標路徑。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

若是遠端設定指令碼，可透過標準輸入以管線傳入修補內容：

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

當某個物件或陣列必須精確成為所提供的值，而非以遞迴方式修補時，請使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 會執行結構描述和 SecretRef 可解析性檢查，但不寫入。在試執行期間，預設會略過由執行提供者支援的 SecretRef；只有在確實希望試執行執行提供者命令時，才加入 `--allow-exec`。

## 試執行

`--dry-run` 會驗證變更，但不寫入 `openclaw.json`。可用於 `config set`、`config patch` 和 `config unset`。

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
    - 原則驗證會針對變更後的完整設定執行，因此寫入父物件（例如將 `hooks` 設為物件）無法略過不支援介面的驗證。
    - 預設會略過 Exec SecretRef 檢查，以避免命令產生副作用；傳入 `--allow-exec` 即可選擇啟用（這可能會執行提供者命令）。`--allow-exec` 僅限試執行，未搭配 `--dry-run` 時會發生錯誤。

  </Accordion>
  <Accordion title="--dry-run --json 欄位">
    - `ok`：試執行是否通過
    - `operations`：已評估的指派數量
    - `checks`：是否已執行結構描述／可解析性檢查
    - `checks.resolvabilityComplete`：可解析性檢查是否執行完畢（略過 Exec 參照時為 false）
    - `refsChecked`：試執行期間實際解析的參照數量
    - `skippedExecRefs`：因未設定 `--allow-exec` 而略過的 Exec 參照數量
    - `errors`：當 `ok=false` 時，結構化的路徑缺失、結構描述或可解析性失敗資訊

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
      ref?: string, // 可解析性錯誤時會出現
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
    - `SecretRef assignment(s) could not be resolved`：目前無法解析所參照的提供者／參照（缺少環境變數、檔案指標無效、Exec 提供者失敗，或提供者／來源不符）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：如需驗證 Exec 可解析性，請加上 `--allow-exec` 重新執行。
    - 在批次模式中，請修正失敗的項目，並在寫入前重新執行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 套用變更

每次成功執行 `config set`／`config patch`／`config unset` 後，命令列介面會輸出下列三種提示之一，讓你知道閘道是否需要重新啟動：

| 提示                                                | 意義                                |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | 變更的路徑需要完整重新啟動。 |
| `Change will apply without restarting the gateway.` | 熱重新載入會自動套用變更。  |
| `No gateway restart needed.`                        | 沒有與執行階段相關的變更。      |

寫入 `plugins.entries`（或任何子路徑）一律需要重新啟動，因為命令列介面無法確認每個外掛的重新載入中繼資料均已載入。

## 寫入安全性

`openclaw config set` 和其他由 OpenClaw 管理的設定寫入工具，會在將變更提交至磁碟前驗證變更後的完整設定。如果新內容無法通過結構描述驗證，或看起來會造成破壞性覆寫，作用中的設定會維持不變，遭拒絕的內容則會以 `openclaw.json.rejected.*` 儲存在其旁。

由 OpenClaw 管理的寫入操作會將 JSON5 重新序列化為標準 JSON。當來源含有註解時，寫入工具會在移除註解前立即發出警告；若需要保留註解，請直接使用編輯器。

<Warning>
作用中的設定路徑必須是一般檔案。不支援寫入使用符號連結的 `openclaw.json` 配置；請改用 `OPENCLAW_CONFIG_PATH` 直接指向實際檔案。
</Warning>

小幅編輯建議使用命令列介面寫入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果寫入遭拒絕，請檢查已儲存的內容並修正完整設定結構：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍可直接使用編輯器寫入，但執行中的閘道會在其通過驗證前將其視為不受信任。無效的直接編輯會導致啟動失敗，或被熱重新載入略過；閘道不會重寫 `openclaw.json`。執行 `openclaw doctor --fix` 以修復帶有前綴／遭覆寫的設定，或還原最近一次已知正常的副本。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)。

完整檔案復原僅供 doctor 修復使用。外掛結構描述變更或 `minHostVersion` 不一致時會明確報錯，而不會回復模型、提供者、驗證設定檔、頻道、閘道公開範圍、工具、記憶體、瀏覽器或排程設定等不相關的使用者設定。

## 修復迴圈

在 `openclaw config validate` 通過後，使用本機終端介面，讓內嵌代理程式將作用中的設定與文件進行比較，同時在同一個終端機中驗證每項變更：

```bash
openclaw chat
```

在終端介面中，行首的 `!` 會執行原樣的本機 Shell 命令（每個工作階段首次執行時會顯示確認提示）：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="與文件比較">
    要求代理程式將目前設定與相關文件頁面進行比較，並建議最小幅度的修正。
  </Step>
  <Step title="套用針對性編輯">
    使用 `openclaw config set` 或 `openclaw configure` 套用針對性編輯。
  </Step>
  <Step title="重新驗證">
    每次變更後重新執行 `openclaw config validate`。
  </Step>
  <Step title="使用 doctor 處理執行階段問題">
    如果驗證通過，但執行階段仍未正常運作，請執行 `openclaw doctor` 或 `openclaw doctor --fix`，以取得移轉與修復協助。
  </Step>
</Steps>

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
