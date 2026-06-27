---
read_when:
    - 你想要以非互動方式讀取或編輯設定
sidebarTitle: Config
summary: '`openclaw config` 的命令列介面參考（get/set/patch/unset/file/schema/validate）'
title: 設定
x-i18n:
    generated_at: "2026-06-27T19:04:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

用於在 `openclaw.json` 中進行非互動式編輯的設定輔助工具：依路徑 get/set/patch/unset/file/schema/validate 值，並列印作用中的設定檔。不帶子命令執行可開啟設定精靈（等同於 `openclaw configure`）。

<Note>
當 `OPENCLAW_NIX_MODE=1` 時，OpenClaw 會將 `openclaw.json` 視為不可變。唯讀命令如 `config get`、`config file`、`config schema` 和 `config validate` 仍可運作，但設定寫入命令會拒絕執行。Agents 應改為編輯安裝來源的 Nix；若使用第一方 nix-openclaw 發行版，請使用 [nix-openclaw 快速開始](https://github.com/openclaw/nix-openclaw#quick-start)，並在 `programs.openclaw.config` 或 `instances.<name>.config` 下設定值。
</Note>

## 根選項

<ParamField path="--section <section>" type="string">
  當你在沒有子命令的情況下執行 `openclaw config` 時，可重複使用的引導式設定區段篩選器。
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

將為 `openclaw.json` 產生的 JSON schema 以 JSON 形式列印到 stdout。

<AccordionGroup>
  <Accordion title="包含內容">
    - 目前的根設定 schema，加上一個供編輯器工具使用的根 `$schema` 字串欄位。
    - Control UI 使用的欄位 `title` 與 `description` 文件中繼資料。
    - 當存在相符的欄位文件時，巢狀物件、萬用字元（`*`）和陣列項目（`[]`）節點會繼承相同的 `title` / `description` 中繼資料。
    - 當存在相符的欄位文件時，`anyOf` / `oneOf` / `allOf` 分支也會繼承相同的文件中繼資料。
    - 在可載入執行階段 manifest 時，提供盡力而為的即時外掛與頻道 schema 中繼資料。
    - 即使目前設定無效，也會提供乾淨的後援 schema。

  </Accordion>
  <Accordion title="相關執行階段 RPC">
    `config.schema.lookup` 會回傳一個正規化設定路徑，包含淺層 schema 節點（`title`、`description`、`type`、`enum`、`const`、常見邊界）、相符的 UI 提示中繼資料，以及直接子項摘要。可在 Control UI 或自訂用戶端中用於依路徑範圍深入檢視。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

當你想用其他工具檢查或驗證它時，可將其管線輸出到檔案：

```bash
openclaw config schema > openclaw.schema.json
```

### 路徑

路徑使用點記法或括號記法。在 shell 範例中請引用括號記法路徑，讓 zsh 等 shell 不會在 OpenClaw 收到路徑前將 `[0]` 展開為 glob：

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

使用 agent 清單索引來指定特定 agent：

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## 值

值會盡可能解析為 JSON5；否則會被視為字串。使用 `--strict-json` 可要求 JSON5 解析。`--json` 仍作為舊版別名支援。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 會將原始值列印為 JSON，而不是終端格式化文字。

<Note>
物件指派預設會取代目標路徑。通常保存使用者新增項目的受保護 map/list 路徑，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，會拒絕移除現有項目的替換，除非你傳入 `--replace`。
</Note>

在這些 map 中新增項目時，請使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

只有在你有意讓提供的值成為完整目標值時，才使用 `--replace`。

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
SecretRef 指派會在不支援執行階段可變的介面上被拒絕（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord thread-binding webhook 權杖，以及 WhatsApp creds JSON）。請參閱 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。
</Warning>

批次解析一律使用批次 payload（`--batch-json`/`--batch-file`）作為事實來源。`--strict-json` / `--json` 不會改變批次解析行為。

## `config patch`

當你想貼上或管線輸入設定形狀的修補，而不是執行許多依路徑的 `config set` 命令時，請使用 `config patch`。輸入是 JSON5 物件。物件會遞迴合併，陣列和純量值會取代目標值，而 `null` 會刪除目標路徑。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

你也可以透過 stdin 管線輸入修補，這對遠端設定指令碼很有用：

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

當某個物件或陣列必須精確成為提供的值，而不是被遞迴修補時，請使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 會在不寫入的情況下執行 schema 和 SecretRef 可解析性檢查。dry-run 期間，exec 後端的 SecretRefs 預設會被略過；當你有意讓 dry-run 執行提供者命令時，請加入 `--allow-exec`。

SecretRefs 和 providers 皆仍支援 JSON 路徑/值模式：

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
  <Accordion title="Env 提供者 (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>`（可重複）

  </Accordion>
  <Accordion title="File 提供者 (--provider-source file)">
    - `--provider-path <path>`（必填）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec 提供者 (--provider-source exec)">
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

使用 `--dry-run` 可在不寫入 `openclaw.json` 的情況下驗證變更。

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
    - 建構器模式：對已變更的 refs/providers 執行 SecretRef 可解析性檢查。
    - JSON 模式（`--strict-json`、`--json` 或批次模式）：執行 schema 驗證加上 SecretRef 可解析性檢查。
    - 原則驗證也會針對已知不支援的 SecretRef 目標介面執行。
    - 原則檢查會評估完整的變更後設定，因此父物件寫入（例如將 `hooks` 設為物件）無法繞過不支援介面的驗證。
    - Exec SecretRef 檢查預設會在 dry-run 期間略過，以避免命令副作用。
    - 搭配 `--dry-run` 使用 `--allow-exec` 可選擇加入 exec SecretRef 檢查（這可能會執行提供者命令）。
    - `--allow-exec` 僅限 dry-run，若未搭配 `--dry-run` 使用會出錯。

  </Accordion>
  <Accordion title="--dry-run --json 欄位">
    `--dry-run --json` 會列印機器可讀的報告：

    - `ok`：dry-run 是否通過
    - `operations`：已評估的指定項目數量
    - `checks`：schema／可解析性檢查是否已執行
    - `checks.resolvabilityComplete`：可解析性檢查是否執行完成（跳過 exec refs 時為 false）
    - `refsChecked`：dry-run 期間實際解析的 refs 數量
    - `skippedExecRefs`：因未設定 `--allow-exec` 而跳過的 exec refs 數量
    - `errors`：當 `ok=false` 時的結構化缺少路徑、schema 或可解析性失敗

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
    - `config schema validation failed`：變更後的 config 形狀無效；請修正路徑／值或 provider/ref 物件形狀。
    - `Config policy validation failed: unsupported SecretRef usage`：將該憑證移回純文字／字串輸入，並只在支援的表面上保留 SecretRefs。
    - `SecretRef assignment(s) could not be resolved`：參照的 provider/ref 目前無法解析（缺少 env var、無效的檔案指標、exec provider 失敗，或 provider/source 不相符）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry-run 已跳過 exec refs；如果需要 exec 可解析性驗證，請使用 `--allow-exec` 重新執行。
    - 對於批次模式，請修正失敗的項目，並在寫入前重新執行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 寫入安全

`openclaw config set` 和其他 OpenClaw 擁有的 config 寫入工具，會在提交到磁碟前驗證完整的變更後 config。若新的 payload 未通過 schema 驗證，或看起來像破壞性覆寫，作用中的 config 會保持不變，而被拒絕的 payload 會以 `openclaw.json.rejected.*` 儲存在旁邊。

<Warning>
作用中的 config 路徑必須是一般檔案。不支援以 symlink 連結的 `openclaw.json` 配置用於寫入；請改用 `OPENCLAW_CONFIG_PATH` 直接指向真正的檔案。
</Warning>

小幅編輯建議使用命令列介面寫入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果寫入被拒絕，請檢查已儲存的 payload，並修正完整的 config 形狀：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允許直接用編輯器寫入，但執行中的閘道會在驗證通過前將其視為不受信任。無效的直接編輯會導致啟動失敗，或在熱重新載入時被略過；閘道不會重寫 `openclaw.json`。執行 `openclaw doctor --fix` 以修復帶前綴／遭覆寫的 config，或還原最後已知可用的副本。請參閱[閘道疑難排解](/zh-TW/gateway/troubleshooting#gateway-rejected-invalid-config)。

整檔復原僅保留給 doctor 修復。外掛 schema 變更或 `minHostVersion` 偏差會保持明確報錯，而不是回復不相關的使用者設定，例如 models、providers、auth profiles、channels、gateway exposure、tools、memory、browser 或 cron config。

## 子命令

- `config file`：列印作用中的 config 檔案路徑（由 `OPENCLAW_CONFIG_PATH` 或預設位置解析）。該路徑應指向一般檔案，而不是 symlink。

編輯後請重新啟動閘道。

## 驗證

在不啟動閘道的情況下，依作用中的 schema 驗證目前的 config。

```bash
openclaw config validate
openclaw config validate --json
```

當 `openclaw config validate` 通過後，你可以使用本機終端介面，讓嵌入式代理程式在同一個終端中協助你一邊驗證每項變更，一邊將作用中的 config 與文件比對：

<Note>
如果驗證已經失敗，請先從 `openclaw configure` 或 `openclaw doctor --fix` 開始。`openclaw chat` 不會繞過無效 config 保護。
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
  <Step title="Compare with docs">
    請代理程式將你目前的 config 與相關文件頁面比對，並建議最小修正。
  </Step>
  <Step title="Apply targeted edits">
    使用 `openclaw config set` 或 `openclaw configure` 套用目標式編輯。
  </Step>
  <Step title="Re-validate">
    每次變更後重新執行 `openclaw config validate`。
  </Step>
  <Step title="Doctor for runtime issues">
    如果驗證通過但執行階段仍不健康，請執行 `openclaw doctor` 或 `openclaw doctor --fix` 以取得遷移與修復協助。
  </Step>
</Steps>

## 相關

- [命令列介面參考](/zh-TW/cli)
- [設定](/zh-TW/gateway/configuration)
