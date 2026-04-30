---
read_when:
    - 您想要以非互動方式讀取或編輯設定
sidebarTitle: Config
summary: '`openclaw config` 的 CLI 參考 (get/set/patch/unset/file/schema/validate)'
title: 設定
x-i18n:
    generated_at: "2026-04-30T02:52:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

設定輔助工具可用於在 `openclaw.json` 中進行非互動式編輯：依路徑 get/set/patch/unset/file/schema/validate 值，並印出作用中的設定檔。未帶子命令執行時，會開啟設定精靈（等同於 `openclaw configure`）。

## 根選項

<ParamField path="--section <section>" type="string">
  當你未帶子命令執行 `openclaw config` 時，可重複使用的引導式設定區段篩選器。
</ParamField>

支援的引導區段：`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

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
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

將為 `openclaw.json` 產生的 JSON schema 以 JSON 格式列印到 stdout。

<AccordionGroup>
  <Accordion title="包含內容">
    - 目前的根設定 schema，外加供編輯器工具使用的根 `$schema` 字串欄位。
    - Control UI 使用的欄位 `title` 與 `description` 文件中繼資料。
    - 巢狀物件、萬用字元（`*`）與陣列項目（`[]`）節點在存在相符欄位文件時，會繼承相同的 `title` / `description` 中繼資料。
    - `anyOf` / `oneOf` / `allOf` 分支在存在相符欄位文件時，也會繼承相同的文件中繼資料。
    - 當 runtime manifests 可載入時，會盡力提供即時 Plugin + 頻道 schema 中繼資料。
    - 即使目前設定無效，也會提供乾淨的備用 schema。

  </Accordion>
  <Accordion title="相關 runtime RPC">
    `config.schema.lookup` 會回傳一個正規化設定路徑，並附上淺層 schema 節點（`title`、`description`、`type`、`enum`、`const`、常見邊界）、相符的 UI 提示中繼資料，以及直接子項摘要。可用於 Control UI 或自訂用戶端中的路徑範圍下鑽。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

當你想用其他工具檢查或驗證它時，可將它管線輸出到檔案：

```bash
openclaw config schema > openclaw.schema.json
```

### 路徑

路徑使用點號或方括號表示法：

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

使用 agent 清單索引來指定特定 agent：

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 值

值會在可能時解析為 JSON5；否則會視為字串。使用 `--strict-json` 要求 JSON5 解析。`--json` 仍支援作為舊版別名。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 會將原始值以 JSON 印出，而不是終端機格式化文字。

<Note>
物件指定預設會取代目標路徑。常用來保存使用者新增項目的受保護 map/list 路徑，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 與 `auth.profiles`，若取代會移除既有項目，除非你傳入 `--replace`，否則會拒絕。
</Note>

新增項目到這些 map 時使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

只有當你刻意想讓提供的值成為完整目標值時，才使用 `--replace`。

## `config set` 模式

`openclaw config set` 支援四種指定樣式：

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
    提供者建構器模式只以 `secrets.providers.<alias>` 路徑為目標：

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
SecretRef 指定在不支援的 runtime 可變更介面上會被拒絕（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord thread-binding webhook token，以及 WhatsApp creds JSON）。請參閱 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
</Warning>

批次解析一律使用批次 payload（`--batch-json`/`--batch-file`）作為真實來源。`--strict-json` / `--json` 不會改變批次解析行為。

## `config patch`

當你想貼上或管線輸入設定形狀的 patch，而不是執行許多依路徑的 `config set` 命令時，請使用 `config patch`。輸入是 JSON5 物件。物件會遞迴合併，陣列與純量值會取代目標值，而 `null` 會刪除目標路徑。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

你也可以透過 stdin 管線輸入 patch，這對遠端設定指令碼很有用：

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

patch 範例：

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

當某個物件或陣列必須完全成為所提供的值，而不是被遞迴 patch 時，請使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 會執行 schema 與 SecretRef 可解析性檢查，但不寫入。Dry-run 期間預設會略過 exec-backed SecretRef；當你刻意想讓 dry-run 執行提供者命令時，請加入 `--allow-exec`。

SecretRef 與提供者仍都支援 JSON 路徑/值模式：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## 提供者建構器旗標

提供者建構器目標必須使用 `secrets.providers.<alias>` 作為路徑。

<AccordionGroup>
  <Accordion title="通用旗標">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="Env 提供者（--provider-source env）">
    - `--provider-allowlist <ENV_VAR>`（可重複）

  </Accordion>
  <Accordion title="File 提供者（--provider-source file）">
    - `--provider-path <path>`（必要）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec 提供者（--provider-source exec）">
    - `--provider-command <path>`（必要）
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

強化的 exec 提供者範例：

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

## Dry run

使用 `--dry-run` 驗證變更而不寫入 `openclaw.json`。

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

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
    - 建構器模式：對變更的 ref/provider 執行 SecretRef 可解析性檢查。
    - JSON 模式（`--strict-json`、`--json` 或批次模式）：執行 schema 驗證與 SecretRef 可解析性檢查。
    - 政策驗證也會針對已知不支援的 SecretRef 目標介面執行。
    - 政策檢查會評估完整的變更後設定，因此父物件寫入（例如將 `hooks` 設為物件）無法繞過不支援介面驗證。
    - Dry-run 期間預設會略過 Exec SecretRef 檢查，以避免命令副作用。
    - 搭配 `--dry-run` 使用 `--allow-exec`，即可選擇加入 exec SecretRef 檢查（這可能會執行提供者命令）。
    - `--allow-exec` 僅適用於 dry-run，若未搭配 `--dry-run` 使用會報錯。

  </Accordion>
  <Accordion title="--dry-run --json 欄位">
    `--dry-run --json` 會印出機器可讀報告：

    - `ok`：dry-run 是否通過
    - `operations`：已評估的指定數量
    - `checks`：schema/可解析性檢查是否執行
    - `checks.resolvabilityComplete`：可解析性檢查是否執行完成（略過 exec refs 時為 false）
    - `refsChecked`：dry-run 期間實際解析的 refs 數量
    - `skippedExecRefs`：因未設定 `--allow-exec` 而略過的 exec refs 數量
    - `errors`：`ok=false` 時的結構化 schema/可解析性失敗

  </Accordion>
</AccordionGroup>

### JSON 輸出形狀

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "schema" | "resolvability",
      message: string,
      ref?: string, // present for resolvability errors
    },
  ],
}
```

<Tabs>
  <Tab title="Success example">
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
  <Tab title="Failure example">
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
  <Accordion title="If dry-run fails">
    - `config schema validation failed`：變更後的設定形狀無效；請修正路徑/值或提供者/ref 物件形狀。
    - `Config policy validation failed: unsupported SecretRef usage`：將該認證移回純文字/字串輸入，並只在支援的表面使用 SecretRefs。
    - `SecretRef assignment(s) could not be resolved`：目前無法解析參照的提供者/ref（缺少環境變數、檔案指標無效、exec 提供者失敗，或提供者/來源不相符）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry-run 已略過 exec refs；如果需要 exec 可解析性驗證，請搭配 `--allow-exec` 重新執行。
    - 對於批次模式，請修正失敗項目，並在寫入前重新執行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 寫入安全性

`openclaw config set` 和其他 OpenClaw 擁有的設定寫入器，會先驗證完整的變更後設定，才將其提交到磁碟。如果新的 payload 未通過 schema 驗證，或看起來像是破壞性的覆寫，作用中的設定會保持不變，而被拒絕的 payload 會儲存在旁邊，檔名為 `openclaw.json.rejected.*`。

<Warning>
作用中的設定路徑必須是一般檔案。不支援對符號連結的 `openclaw.json` 配置進行寫入；請改用 `OPENCLAW_CONFIG_PATH` 直接指向真實檔案。
</Warning>

小幅編輯建議使用 CLI 寫入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果寫入被拒絕，請檢查已儲存的 payload，並修正完整的設定形狀：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允許直接用編輯器寫入，但執行中的 Gateway 會在驗證通過前將其視為不受信任。無效的直接編輯可在啟動或熱重新載入期間，從最後已知良好的備份還原。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#gateway-restored-last-known-good-config)。

整檔還原僅保留給全域損壞的設定，例如解析錯誤、根層級 schema 失敗、舊版遷移失敗，或同時發生 Plugin 與根層級失敗。如果驗證只在 `plugins.entries.<id>...` 底下失敗，OpenClaw 會保留作用中的 `openclaw.json`，並回報 Plugin 本地問題，而不是還原 `.last-good`。這可防止 Plugin schema 變更或 `minHostVersion` 偏差回滾不相關的使用者設定，例如模型、提供者、驗證設定檔、頻道、Gateway 暴露、工具、記憶體、瀏覽器或 cron 設定。

## 子命令

- `config file`：列印作用中的設定檔路徑（從 `OPENCLAW_CONFIG_PATH` 或預設位置解析）。該路徑應指向一般檔案，而不是符號連結。

編輯後重新啟動 gateway。

## 驗證

在不啟動 gateway 的情況下，依作用中 schema 驗證目前設定。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` 通過後，你可以使用本機 TUI，讓嵌入式 agent 在你從同一個終端機驗證每項變更時，比對作用中設定與文件：

<Note>
如果驗證已經失敗，請從 `openclaw configure` 或 `openclaw doctor --fix` 開始。`openclaw chat` 不會繞過無效設定防護。
</Note>

```bash
openclaw chat
```

然後在 TUI 內：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型修復迴圈：

<Steps>
  <Step title="Compare with docs">
    請 agent 將你的目前設定與相關文件頁面比對，並建議最小修正。
  </Step>
  <Step title="Apply targeted edits">
    使用 `openclaw config set` 或 `openclaw configure` 套用目標明確的編輯。
  </Step>
  <Step title="Re-validate">
    每次變更後，重新執行 `openclaw config validate`。
  </Step>
  <Step title="Doctor for runtime issues">
    如果驗證通過但執行階段仍不健康，請執行 `openclaw doctor` 或 `openclaw doctor --fix` 取得遷移與修復協助。
  </Step>
</Steps>

## 相關

- [CLI 參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
