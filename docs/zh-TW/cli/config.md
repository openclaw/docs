---
read_when:
    - 你想要以非互動方式讀取或編輯設定
sidebarTitle: Config
summary: '`openclaw config` 的命令列介面參考（get/set/patch/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-06-28T22:33:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92878977e8fb6670f12c0a77937a7c41f9230da82e20ec7690731bbda1e910ca
    source_path: cli/config.md
    workflow: 16
---

用於在 `openclaw.json` 中進行非互動式編輯的設定輔助工具：依路徑 get/set/patch/unset/file/schema/validate 值，並列印作用中的設定檔。不帶子命令執行時會開啟設定精靈（等同於 `openclaw configure`）。

<Note>
當 `OPENCLAW_NIX_MODE=1` 時，OpenClaw 會將 `openclaw.json` 視為不可變。`config get`、`config file`、`config schema` 和 `config validate` 等唯讀命令仍可運作，但設定寫入器會拒絕執行。代理應改為編輯該安裝的 Nix 來源；對於第一方 nix-openclaw 發行版，請使用 [nix-openclaw 快速開始](https://github.com/openclaw/nix-openclaw#quick-start)，並在 `programs.openclaw.config` 或 `instances.<name>.config` 下設定值。
</Note>

## 根選項

<ParamField path="--section <section>" type="string">
  當你執行沒有子命令的 `openclaw config` 時，可重複使用的引導式設定區段篩選器。
</ParamField>

支援的引導式區段：`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

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

### `config schema`

將產生的 `openclaw.json` JSON schema 以 JSON 格式列印到 stdout。

<AccordionGroup>
  <Accordion title="包含內容">
    - 目前的根設定 schema，加上供編輯器工具使用的根 `$schema` 字串欄位。
    - Control UI 使用的欄位 `title` 與 `description` 文件中繼資料。
    - 當存在相符的欄位文件時，巢狀物件、萬用字元（`*`）和陣列項目（`[]`）節點會繼承相同的 `title` / `description` 中繼資料。
    - 當存在相符的欄位文件時，`anyOf` / `oneOf` / `allOf` 分支也會繼承相同的文件中繼資料。
    - 當可載入執行階段 manifest 時，會盡力提供即時外掛 + 通道 schema 中繼資料。
    - 即使目前設定無效，也會提供乾淨的備用 schema。

  </Accordion>
  <Accordion title="相關執行階段 RPC">
    `config.schema.lookup` 會傳回一個正規化設定路徑，包含淺層 schema 節點（`title`、`description`、`type`、`enum`、`const`、常見邊界）、相符的 UI 提示中繼資料，以及直接子項摘要。可用於 Control UI 或自訂用戶端中的路徑範圍鑽研。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

當你想用其他工具檢查或驗證它時，請將其管線輸出到檔案：

```bash
openclaw config schema > openclaw.schema.json
```

### 路徑

路徑使用點記法或括號記法。在 shell 範例中請為括號記法路徑加上引號，避免 zsh 等 shell 在 OpenClaw 收到路徑前將 `[0]` 展開為 glob：

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

使用代理清單索引來指定特定代理：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## 值

值會在可能時以 JSON5 解析；否則會視為字串。使用 `--strict-json` 可要求標準 JSON 解析，且不使用字串備援。`--json` 仍作為 `--strict-json` 的舊版別名受到支援。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

啟用 `--strict-json` 時，註解、尾隨逗號或未加引號的物件鍵等僅 JSON5 支援的語法會被拒絕。若要使用 JSON5 值解析並搭配原始字串備援，請省略 `--strict-json`。

`config get <path> --json` 會以 JSON 列印原始值，而不是終端格式化文字。

<Note>
物件指派預設會取代目標路徑。常用來保存使用者新增項目的受保護 map/list 路徑，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，會拒絕移除既有項目的取代操作，除非你傳入 `--replace`。
</Note>

新增項目到這些 map 時請使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

只有在你明確希望提供的值成為完整目標值時，才使用 `--replace`。

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
  <Tab title="提供者建構器模式">
    提供者建構器模式僅以 `secrets.providers.<alias>` 路徑為目標：

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
SecretRef 指派會在不支援執行階段可變更的介面上被拒絕（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 執行緒繫結網路鉤子 token，以及 WhatsApp creds JSON）。請參閱 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
</Warning>

批次解析一律以批次承載（`--batch-json`/`--batch-file`）作為事實來源。`--strict-json` / `--json` 不會改變批次解析行為。

## `config patch`

當你想貼上或管線輸入設定形狀的修補，而不是執行多個以路徑為基礎的 `config set` 命令時，請使用 `config patch`。輸入是 JSON5 物件。物件會遞迴合併，陣列與純量值會取代目標值，而 `null` 會刪除目標路徑。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

你也可以透過 stdin 管線輸入修補，這對遠端設定腳本很有用：

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

範例修補：

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

當某個物件或陣列必須完全成為提供的值，而不是被遞迴修補時，請使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 會執行 schema 和 SecretRef 可解析性檢查而不寫入。dry-run 期間，預設會跳過由 exec 支援的 SecretRef；當你明確希望 dry-run 執行提供者命令時，請加入 `--allow-exec`。

SecretRef 和提供者仍支援 JSON 路徑/值模式：

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
  <Accordion title="常用旗標">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="Env 提供者（--provider-source env）">
    - `--provider-allowlist <ENV_VAR>`（可重複）

  </Accordion>
  <Accordion title="檔案提供者（--provider-source file）">
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
  <Accordion title="試執行行為">
    - Builder 模式：對已變更的 refs/providers 執行 SecretRef 可解析性檢查。
    - JSON 模式（`--strict-json`、`--json` 或批次模式）：執行結構描述驗證與 SecretRef 可解析性檢查。
    - 政策驗證也會針對已知不支援的 SecretRef 目標介面執行。
    - 政策檢查會評估完整的變更後設定，因此父物件寫入（例如將 `hooks` 設為物件）無法繞過不支援介面的驗證。
    - 試執行期間預設會略過 Exec SecretRef 檢查，以避免命令副作用。
    - 搭配 `--dry-run` 使用 `--allow-exec`，即可選擇加入 exec SecretRef 檢查（這可能會執行提供者命令）。
    - `--allow-exec` 僅適用於試執行，若未搭配 `--dry-run` 使用會出錯。

  </Accordion>
  <Accordion title="--dry-run --json 欄位">
    `--dry-run --json` 會列印機器可讀的報告：

    - `ok`：試執行是否通過
    - `operations`：已評估的指派數量
    - `checks`：結構描述/可解析性檢查是否已執行
    - `checks.resolvabilityComplete`：可解析性檢查是否完整執行（略過 exec refs 時為 false）
    - `refsChecked`：試執行期間實際解析的 refs 數量
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
  <Accordion title="如果試執行失敗">
    - `config schema validation failed`：你的變更後設定形狀無效；請修正路徑/值或提供者/ref 物件形狀。
    - `Config policy validation failed: unsupported SecretRef usage`：將該認證移回純文字/字串輸入，並只在支援的介面上保留 SecretRefs。
    - `SecretRef assignment(s) could not be resolved`：參照的提供者/ref 目前無法解析（缺少環境變數、檔案指標無效、exec 提供者失敗，或提供者/來源不相符）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：試執行略過了 exec refs；如果需要 exec 可解析性驗證，請搭配 `--allow-exec` 重新執行。
    - 對於批次模式，請修正失敗項目，並在寫入前重新執行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 寫入安全性

`openclaw config set` 和其他 OpenClaw 擁有的設定寫入器，會在將完整的變更後設定提交到磁碟前先驗證它。如果新承載資料未通過結構描述驗證，或看起來像破壞性覆寫，作用中的設定會維持不變，而被拒絕的承載資料會以 `openclaw.json.rejected.*` 儲存在旁邊。

<Warning>
作用中設定路徑必須是一般檔案。不支援符號連結的 `openclaw.json` 版面進行寫入；請改用 `OPENCLAW_CONFIG_PATH` 直接指向實際檔案。
</Warning>

小幅編輯建議使用命令列介面寫入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果寫入遭拒，請檢查已儲存的承載資料並修正完整設定形狀：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍可直接用編輯器寫入，但執行中的閘道會在它們通過驗證前視為不受信任。無效的直接編輯會導致啟動失敗，或在熱重新載入時被略過；閘道不會重寫 `openclaw.json`。執行 `openclaw doctor --fix` 以修復加上前綴/遭覆寫的設定，或還原最後已知良好的副本。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)。

整檔復原僅保留給 doctor 修復使用。外掛結構描述變更或 `minHostVersion` 偏差會保持明確錯誤，而不是回復模型、提供者、驗證設定檔、頻道、閘道暴露、工具、記憶、瀏覽器或 cron 設定等不相關的使用者設定。

## 子命令

- `config file`：列印作用中的設定檔路徑（從 `OPENCLAW_CONFIG_PATH` 或預設位置解析）。路徑應指向一般檔案，而不是符號連結。

編輯後請重新啟動閘道。

## 驗證

在不啟動閘道的情況下，依據作用中的結構描述驗證目前設定。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` 通過後，你可以使用本機終端介面，讓嵌入式代理在你於同一個終端機驗證每項變更時，比對作用中設定與文件：

<Note>
如果驗證已經失敗，請從 `openclaw configure` 或 `openclaw doctor --fix` 開始。`openclaw chat` 不會繞過無效設定防護。
</Note>

```bash
openclaw chat
```

接著在終端介面內：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型修復流程：

<Steps>
  <Step title="與文件比較">
    要求代理將你的目前設定與相關文件頁面比較，並建議最小修正。
  </Step>
  <Step title="套用目標編輯">
    使用 `openclaw config set` 或 `openclaw configure` 套用目標編輯。
  </Step>
  <Step title="重新驗證">
    每次變更後重新執行 `openclaw config validate`。
  </Step>
  <Step title="針對執行階段問題使用 Doctor">
    如果驗證通過但執行階段仍不健康，請執行 `openclaw doctor` 或 `openclaw doctor --fix` 取得遷移與修復協助。
  </Step>
</Steps>

## 相關

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
