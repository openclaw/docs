---
read_when:
    - 你想要以非互動方式讀取或編輯設定
sidebarTitle: Config
summary: CLI 參考：`openclaw config`（get/set/patch/unset/file/schema/validate）
title: 設定
x-i18n:
    generated_at: "2026-05-03T21:28:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7be6a2ff8474fe78deb1d32dd822a4cf8a2b420dfb45306be5d7c5a1d54f0b4d
    source_path: cli/config.md
    workflow: 16
---

非互動式編輯 `openclaw.json` 的設定輔助工具：依路徑 get/set/patch/unset/file/schema/validate 值，並列印作用中的設定檔。未帶子命令執行時，會開啟設定精靈（等同於 `openclaw configure`）。

## 根選項

<ParamField path="--section <section>" type="string">
  不帶子命令執行 `openclaw config` 時，可重複使用的引導式設定區段篩選器。
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

將產生的 `openclaw.json` JSON schema 以 JSON 列印到 stdout。

<AccordionGroup>
  <Accordion title="包含內容">
    - 目前的根設定 schema，以及供編輯器工具使用的根 `$schema` 字串欄位。
    - Control UI 使用的欄位 `title` 和 `description` 文件中繼資料。
    - 巢狀物件、萬用字元（`*`）和陣列項目（`[]`）節點在有相符欄位文件時，會繼承相同的 `title` / `description` 中繼資料。
    - `anyOf` / `oneOf` / `allOf` 分支在有相符欄位文件時，也會繼承相同的文件中繼資料。
    - 當可載入執行階段資訊清單時，會盡力提供即時 Plugin + channel schema 中繼資料。
    - 即使目前設定無效，也會提供乾淨的後援 schema。

  </Accordion>
  <Accordion title="相關執行階段 RPC">
    `config.schema.lookup` 會回傳一個正規化設定路徑，包含淺層 schema 節點（`title`、`description`、`type`、`enum`、`const`、常見邊界）、相符的 UI 提示中繼資料，以及直接子項摘要。可在 Control UI 或自訂用戶端中用於路徑範圍的深入查看。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

想用其他工具檢查或驗證時，將它管線輸出到檔案：

```bash
openclaw config schema > openclaw.schema.json
```

### 路徑

路徑使用點號或括號表示法：

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

使用代理清單索引來指定特定代理：

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 值

值會在可行時解析為 JSON5；否則會視為字串。使用 `--strict-json` 要求 JSON5 解析。`--json` 仍支援作為舊版別名。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 會將原始值列印為 JSON，而不是終端格式化文字。

<Note>
物件指派預設會取代目標路徑。常用來保存使用者新增項目的受保護 map/list 路徑，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，會拒絕移除既有項目的替換，除非你傳入 `--replace`。
</Note>

新增項目到這些 map 時使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

只有在你刻意希望提供的值成為完整目標值時，才使用 `--replace`。

## `config set` 模式

`openclaw config set` 支援四種指派樣式：

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
    Provider 建構器模式只以 `secrets.providers.<alias>` 路徑為目標：

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
SecretRef 指派會在不支援執行階段可變更的表面上被拒絕（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord thread-binding Webhook 權杖，以及 WhatsApp 憑證 JSON）。請參閱 [SecretRef 憑證表面](/zh-TW/reference/secretref-credential-surface)。
</Warning>

批次解析一律以批次有效負載（`--batch-json`/`--batch-file`）作為事實來源。`--strict-json` / `--json` 不會改變批次解析行為。

## `config patch`

當你想貼上或管線傳入設定形狀的修補，而不是執行許多依路徑的 `config set` 命令時，使用 `config patch`。輸入是 JSON5 物件。物件會遞迴合併，陣列和純量值會取代目標值，而 `null` 會刪除目標路徑。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

你也可以透過 stdin 管線傳入修補，這對遠端設定腳本很有用：

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

當某個物件或陣列必須完全成為提供的值，而不是被遞迴修補時，使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 會執行 schema 和 SecretRef 可解析性檢查而不寫入。試跑期間，預設會略過 exec 支援的 SecretRefs；當你刻意希望試跑執行 Provider 命令時，加入 `--allow-exec`。

JSON 路徑/值模式仍支援 SecretRefs 和 providers：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider 建構器旗標

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

強化的 exec Provider 範例：

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

## 試跑

使用 `--dry-run` 來驗證變更，而不寫入 `openclaw.json`。

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
  <Accordion title="試跑行為">
    - 建構器模式：對變更的 refs/providers 執行 SecretRef 可解析性檢查。
    - JSON 模式（`--strict-json`、`--json` 或批次模式）：執行 schema 驗證以及 SecretRef 可解析性檢查。
    - 對已知不支援的 SecretRef 目標表面也會執行政策驗證。
    - 政策檢查會評估完整的變更後設定，因此父物件寫入（例如將 `hooks` 設為物件）無法繞過不支援表面驗證。
    - 試跑期間預設會略過 Exec SecretRef 檢查，以避免命令副作用。
    - 搭配 `--dry-run` 使用 `--allow-exec`，可選擇啟用 exec SecretRef 檢查（這可能會執行 Provider 命令）。
    - `--allow-exec` 僅限試跑，若未搭配 `--dry-run` 使用會報錯。

  </Accordion>
  <Accordion title="--dry-run --json 欄位">
    `--dry-run --json` 會列印機器可讀的報告：

    - `ok`：試跑是否通過
    - `operations`：評估的指派數量
    - `checks`：是否執行 schema/可解析性檢查
    - `checks.resolvabilityComplete`：可解析性檢查是否完整執行（略過 exec refs 時為 false）
    - `refsChecked`：試跑期間實際解析的 refs 數量
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
    - `config schema validation failed`：變更後的設定結構無效；請修正 path/value 或 provider/ref 物件結構。
    - `Config policy validation failed: unsupported SecretRef usage`：將該憑證移回純文字/字串輸入，並只在支援的介面上使用 SecretRefs。
    - `SecretRef assignment(s) could not be resolved`：目前無法解析參照的 provider/ref（缺少環境變數、檔案指標無效、exec provider 失敗，或 provider/source 不相符）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：試執行已略過 exec refs；如果你需要 exec 可解析性驗證，請使用 `--allow-exec` 重新執行。
    - 對於批次模式，請修正失敗的項目，並在寫入前重新執行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 寫入安全性

`openclaw config set` 和其他 OpenClaw 擁有的設定寫入器，會先驗證完整的變更後設定，再提交到磁碟。如果新的酬載未通過綱要驗證，或看起來像破壞性的覆寫，作用中的設定會保持不變，而遭拒的酬載會在旁邊儲存為 `openclaw.json.rejected.*`。

<Warning>
作用中設定路徑必須是一般檔案。不支援對符號連結的 `openclaw.json` 配置進行寫入；請改用 `OPENCLAW_CONFIG_PATH` 直接指向真實檔案。
</Warning>

小幅編輯時，優先使用 CLI 寫入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果寫入遭拒，請檢查已儲存的酬載，並修正完整的設定結構：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允許直接使用編輯器寫入，但正在執行的 Gateway 會將它們視為不受信任，直到驗證通過為止。無效的直接編輯會導致啟動失敗，或在熱重新載入時被略過；Gateway 不會重寫 `openclaw.json`。執行 `openclaw doctor --fix` 以修復加上前綴/遭覆寫的設定，或還原最後已知良好的副本。請參閱 [Gateway 疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)。

整個檔案的復原保留給 doctor 修復使用。Plugin 綱要變更或 `minHostVersion` 偏差會保持明確報錯，而不是回復與其無關的使用者設定，例如模型、providers、auth profiles、channels、gateway exposure、tools、memory、browser 或 Cron 設定。

## 子命令

- `config file`：列印作用中設定檔路徑（從 `OPENCLAW_CONFIG_PATH` 或預設位置解析）。該路徑應指向一般檔案，而不是符號連結。

編輯後請重新啟動 Gateway。

## 驗證

在不啟動 Gateway 的情況下，根據作用中綱要驗證目前設定。

```bash
openclaw config validate
openclaw config validate --json
```

在 `openclaw config validate` 通過後，你可以使用本機 TUI，讓嵌入式 agent 針對文件比對作用中設定，同時在同一個終端機驗證每項變更：

<Note>
如果驗證已經失敗，請從 `openclaw configure` 或 `openclaw doctor --fix` 開始。`openclaw chat` 不會繞過無效設定保護。
</Note>

```bash
openclaw chat
```

接著在 TUI 內：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型修復流程：

<Steps>
  <Step title="與文件比較">
    請 agent 將你目前的設定與相關文件頁面比較，並建議最小修正。
  </Step>
  <Step title="套用目標式編輯">
    使用 `openclaw config set` 或 `openclaw configure` 套用目標式編輯。
  </Step>
  <Step title="重新驗證">
    每次變更後重新執行 `openclaw config validate`。
  </Step>
  <Step title="針對執行階段問題執行 doctor">
    如果驗證通過但執行階段仍不健康，請執行 `openclaw doctor` 或 `openclaw doctor --fix` 以取得遷移與修復協助。
  </Step>
</Steps>

## 相關

- [CLI 參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
