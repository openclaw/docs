---
read_when:
    - 你想要以非互動方式讀取或編輯設定
sidebarTitle: Config
summary: '`openclaw config` 的命令列介面參考（get/set/patch/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-07-05T11:07:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e338747649c0780d422ddcea3b86bed78fddd1d73d0dff73e5c2e8d60982ed0
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` 的非互動式輔助工具：依路徑取得/設定/修補/取消設定值、列印 schema、驗證，或列印作用中的檔案路徑。不帶子命令執行 `openclaw config`，會開啟與 `openclaw configure` 相同的引導式精靈。

<Note>
當 `OPENCLAW_NIX_MODE=1` 時，OpenClaw 會將 `openclaw.json` 視為不可變。唯讀命令（`config get`、`config file`、`config schema`、`config validate`）仍可運作；設定寫入命令會拒絕執行。請改為編輯安裝的 Nix 來源；若使用第一方 nix-openclaw 發行版，請使用 [nix-openclaw 快速開始](https://github.com/openclaw/nix-openclaw#quick-start)，並在 `programs.openclaw.config` 或 `instances.<name>.config` 底下設定值。
</Note>

## 根選項

<ParamField path="--section <section>" type="string">
  當你不帶子命令執行 `openclaw config` 時，可重複使用的引導式設定區段篩選器。
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

點號或括號表示法。在 shell 範例中請為括號路徑加上引號，避免 zsh 將 `[0]` 展開為 glob：

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

從已遮蔽的設定快照讀取值（絕不列印 secrets）。`--json` 會將原始值列印為 JSON；否則字串/數字/布林值會直接列印，物件/陣列會列印為格式化 JSON。

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

列印作用中的設定檔路徑，該路徑會從 `OPENCLAW_CONFIG_PATH` 或預設位置解析。此路徑指向一般檔案，而不是符號連結；請參閱[寫入安全性](#write-safety)。

### `config schema`

將為 `openclaw.json` 產生的 JSON schema 列印到 stdout。

<AccordionGroup>
  <Accordion title="包含內容">
    - 目前的根設定 schema，加上一個供編輯器工具使用的根 `$schema` 字串欄位。
    - Control UI 使用的欄位 `title` / `description` 文件中繼資料。
    - 當有相符的欄位文件時，巢狀物件、萬用字元（`*`）與陣列項目（`[]`）節點會繼承相同的 `title` / `description` 中繼資料。
    - `anyOf` / `oneOf` / `allOf` 分支也會繼承相同的文件中繼資料。
    - 當可載入 runtime manifests 時，提供盡力而為的即時外掛 + channel schema 中繼資料。
    - 即使目前設定無效，也會提供乾淨的備援 schema。

  </Accordion>
  <Accordion title="相關的 runtime RPC">
    `config.schema.lookup` 會傳回一個正規化設定路徑，其中包含淺層 schema 節點（`title`、`description`、`type`、`enum`、`const`、常見界限）、相符的使用者介面提示中繼資料，以及直接子項摘要。可在 Control UI 或自訂用戶端中用於依路徑範圍的深入檢視。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

在不啟動閘道的情況下，使用作用中的 schema 驗證目前設定。

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
如果驗證已經失敗，請從 `openclaw configure` 或 `openclaw doctor --fix` 開始。`openclaw chat` 不會略過無效設定防護。
</Note>

## 值

值會在可行時解析為 JSON5；否則會視為原始字串。使用 `--strict-json` 可要求標準 JSON，且不進行字串備援（因此會拒絕僅 JSON5 支援的語法，例如註解、尾隨逗號或未加引號的鍵）。`--json` 是 `config set` 上 `--strict-json` 的舊版別名。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 會將原始值列印為 JSON，而不是終端機格式化文字。

<Note>
物件指派預設會取代目標路徑。通常保存使用者新增項目的受保護路徑，會拒絕移除現有項目的替換，除非你傳入 `--replace`：`agents.defaults.models`、`agents.list`、`models.providers`、`models.providers.<id>`、`models.providers.<id>.models`、`plugins.entries` 與 `auth.profiles`。
</Note>

新增項目到這些 map 時，請使用 `--merge`：

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
  <Tab title="Provider 建構器模式">
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
SecretRef 指派會在不支援 runtime 可變的表面上被拒絕（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord thread-binding 網路鉤子 token，以及 WhatsApp creds JSON）。請參閱 [SecretRef 憑證表面](/zh-TW/reference/secretref-credential-surface)。
</Warning>

批次解析一律使用批次 payload（`--batch-json`/`--batch-file`）作為事實來源；`--strict-json` / `--json` 不會改變批次解析行為。

JSON 路徑/值模式也可直接用於 SecretRefs 和 providers：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Provider 建構器旗標

Provider 建構器目標必須使用 `secrets.providers.<alias>` 作為路徑。

<AccordionGroup>
  <Accordion title="常用旗標">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>`（可重複）

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>`（必填）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
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

強化的 exec provider 範例：

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

貼上或透過管線傳入設定形狀的 JSON5 patch，而不是執行許多依路徑設定的 `config set` 命令。物件會遞迴合併；陣列和純量值會取代目標；`null` 會刪除目標路徑。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

透過 stdin 將 patch 管線傳入遠端設定腳本：

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

Patch 範例：

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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

當某個物件或陣列必須精確成為提供的值，而不是被遞迴 patch 時，請使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 會在不寫入的情況下執行 schema 和 SecretRef 可解析性檢查。Dry-run 期間，預設會略過 exec-backed SecretRefs；當你刻意希望 dry-run 執行 provider 命令時，請加入 `--allow-exec`。

## Dry run

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
  <Accordion title="Dry-run 行為">
    - Builder 模式：針對已變更的 refs/providers 執行 SecretRef 可解析性檢查。
    - JSON 模式（`--strict-json`、`--json` 或批次模式）：執行結構描述驗證加上 SecretRef 可解析性檢查。
    - 政策驗證會針對變更後的完整設定執行，因此父物件寫入（例如將 `hooks` 設為物件）無法繞過不支援介面的驗證。
    - 預設會略過 Exec SecretRef 檢查，以避免命令副作用；傳入 `--allow-exec` 以選擇啟用（這可能會執行 provider 命令）。`--allow-exec` 僅適用於 dry-run，且沒有 `--dry-run` 時會報錯。

  </Accordion>
  <Accordion title="--dry-run --json 欄位">
    - `ok`：dry-run 是否通過
    - `operations`：已評估的指派數量
    - `checks`：是否執行結構描述/可解析性檢查
    - `checks.resolvabilityComplete`：可解析性檢查是否執行完成（略過 exec refs 時為 false）
    - `refsChecked`：dry-run 期間實際解析的 refs 數量
    - `skippedExecRefs`：因未設定 `--allow-exec` 而略過的 exec refs 數量
    - `errors`：當 `ok=false` 時的結構化缺失路徑、結構描述或可解析性失敗

  </Accordion>
</AccordionGroup>

### JSON 輸出形狀

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
  <Accordion title="如果 dry-run 失敗">
    - `config schema validation failed`：你的變更後設定形狀無效；修正路徑/值或 provider/ref 物件形狀。
    - `Config policy validation failed: unsupported SecretRef usage`：將該憑證移回純文字/字串輸入；SecretRefs 僅保留在支援的介面上。
    - `SecretRef assignment(s) could not be resolved`：參照的 provider/ref 目前無法解析（缺少環境變數、檔案指標無效、exec provider 失敗，或 provider/source 不符）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：如果你需要 exec 可解析性驗證，請使用 `--allow-exec` 重新執行。
    - 對於批次模式，請先修正失敗項目並重新執行 `--dry-run`，再寫入。

  </Accordion>
</AccordionGroup>

## 套用變更

每次 `config set` / `config patch` / `config unset` 成功後，命令列介面都會列印三種提示之一，讓你知道閘道是否需要重新啟動：

| 提示                                                | 含義                                   |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | 變更的路徑需要完整重新啟動。           |
| `Change will apply without restarting the gateway.` | 熱重新載入會自動套用。                 |
| `No gateway restart needed.`                        | 沒有與執行階段相關的變更。             |

寫入 `plugins.entries`（或任何子路徑）一律需要重新啟動，因為命令列介面無法證明每個外掛的重新載入中繼資料都已載入。

## 寫入安全性

`openclaw config set` 和其他 OpenClaw 擁有的設定寫入器，會在提交到磁碟前驗證完整的變更後設定。如果新的 payload 未通過結構描述驗證，或看起來像破壞性的覆寫，作用中的設定會保持不變，而被拒絕的 payload 會另存於旁邊，檔名為 `openclaw.json.rejected.*`。

<Warning>
作用中的設定路徑必須是一般檔案。不支援透過符號連結的 `openclaw.json` 版面進行寫入；請改用 `OPENCLAW_CONFIG_PATH` 直接指向真正的檔案。
</Warning>

小幅編輯建議使用命令列介面寫入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果寫入遭拒，請檢查已儲存的 payload 並修正完整設定形狀：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍允許直接用編輯器寫入，但執行中的閘道會在它們通過驗證前將其視為不受信任。無效的直接編輯會導致啟動失敗，或被熱重新載入略過；閘道不會重寫 `openclaw.json`。執行 `openclaw doctor --fix` 以修復帶有前綴/遭覆寫的設定，或還原最後已知良好的副本。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)。

整個檔案復原僅保留給 doctor 修復。外掛結構描述變更或 `minHostVersion` 偏差會明確報錯，而不是回復模型、providers、auth profiles、channels、閘道暴露、tools、記憶體、browser 或 cron config 等不相關的使用者設定。

## 修復迴圈

`openclaw config validate` 通過後，使用本機終端介面，讓內嵌 agent 對照文件比較作用中的設定，同時你從同一個終端驗證每項變更：

```bash
openclaw chat
```

在終端介面中，開頭的 `!` 會執行字面本機 shell 命令（在每個工作階段一次性確認提示之後）：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="與文件比較">
    要求 agent 將你目前的設定與相關文件頁面比較，並建議最小修正。
  </Step>
  <Step title="套用目標式編輯">
    使用 `openclaw config set` 或 `openclaw configure` 套用目標式編輯。
  </Step>
  <Step title="重新驗證">
    每次變更後重新執行 `openclaw config validate`。
  </Step>
  <Step title="針對執行階段問題使用 Doctor">
    如果驗證通過但執行階段仍不健康，請執行 `openclaw doctor` 或 `openclaw doctor --fix` 以取得遷移與修復協助。
  </Step>
</Steps>

## 相關

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
