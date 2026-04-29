---
read_when:
    - 你想以非交互方式读取或编辑配置
sidebarTitle: Config
summary: 用于 `openclaw config` 的 CLI 参考（get/set/patch/unset/file/schema/validate）
title: 配置
x-i18n:
    generated_at: "2026-04-29T21:05:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: f1f55c4b932d469cb9112d9f55b66f0ff88dbe066250651df7a0a753060a223d
    source_path: cli/config.md
    workflow: 16
---

配置辅助工具用于在 `openclaw.json` 中进行非交互式编辑：按路径 get/set/patch/unset/file/schema/validate 值，并打印当前活动的配置文件。不带子命令运行会打开配置向导（等同于 `openclaw configure`）。

## 根选项

<ParamField path="--section <section>" type="string">
  当你不带子命令运行 `openclaw config` 时，可重复使用的引导式设置分区过滤器。
</ParamField>

支持的引导式分区：`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

## 示例

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

将为 `openclaw.json` 生成的 JSON schema 以 JSON 形式打印到 stdout。

<AccordionGroup>
  <Accordion title="What it includes">
    - 当前根配置 schema，加上用于编辑器工具的根 `$schema` 字符串字段。
    - Control UI 使用的字段 `title` 和 `description` 文档元数据。
    - 当存在匹配的字段文档时，嵌套对象、通配符（`*`）和数组项（`[]`）节点会继承相同的 `title` / `description` 元数据。
    - 当存在匹配的字段文档时，`anyOf` / `oneOf` / `allOf` 分支也会继承相同的文档元数据。
    - 当可以加载运行时 manifest 时，尽力提供实时插件 + 渠道 schema 元数据。
    - 即使当前配置无效，也会提供干净的回退 schema。

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` 返回一个规范化配置路径，包含一个浅层 schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界）、匹配的 UI 提示元数据，以及直接子项摘要。可在 Control UI 或自定义客户端中用于按路径深入查看。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

当你想用其他工具检查或验证它时，可以通过管道写入文件：

```bash
openclaw config schema > openclaw.schema.json
```

### 路径

路径使用点号或括号表示法：

```bash
openclaw config get agents.defaults.workspace
openclaw config get agents.list[0].id
```

使用智能体列表索引来定位特定智能体：

```bash
openclaw config get agents.list
openclaw config set agents.list[1].tools.exec.node "node-id-or-name"
```

## 值

值会尽可能按 JSON5 解析；否则会被视为字符串。使用 `--strict-json` 要求必须按 JSON5 解析。`--json` 仍作为旧版别名受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 会将原始值以 JSON 打印，而不是打印终端格式化文本。

<Note>
默认情况下，对象赋值会替换目标路径。常用于保存用户新增条目的受保护 map/list 路径，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，会拒绝可能移除现有条目的替换，除非你传入 `--replace`。
</Note>

向这些映射添加条目时使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

只有当你明确希望提供的值成为完整目标值时，才使用 `--replace`。

## `config set` 模式

`openclaw config set` 支持四种赋值方式：

<Tabs>
  <Tab title="Value mode">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef builder mode">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider builder mode">
    提供商构建器模式仅面向 `secrets.providers.<alias>` 路径：

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="Batch mode">
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
SecretRef 赋值会在不支持运行时可变的表面上被拒绝（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook 令牌，以及 WhatsApp 凭证 JSON）。参见 [SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)。
</Warning>

批量解析始终使用批量载荷（`--batch-json`/`--batch-file`）作为事实来源。`--strict-json` / `--json` 不会改变批量解析行为。

## `config patch`

当你想粘贴或通过管道传入一个配置形状的补丁，而不是运行许多基于路径的 `config set` 命令时，使用 `config patch`。输入是一个 JSON5 对象。对象会递归合并，数组和标量值会替换目标值，`null` 会删除目标路径。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

你也可以通过 stdin 传入补丁，这对远程设置脚本很有用：

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

示例补丁：

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

当某个对象或数组必须精确变为提供的值，而不是被递归补丁处理时，使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 会在不写入的情况下运行 schema 和 SecretRef 可解析性检查。默认情况下，dry-run 期间会跳过基于 exec 的 SecretRefs；当你明确希望 dry-run 执行提供商命令时，添加 `--allow-exec`。

JSON 路径/值模式仍然同时支持 SecretRefs 和提供商：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## 提供商构建器标志

提供商构建器目标必须使用 `secrets.providers.<alias>` 作为路径。

<AccordionGroup>
  <Accordion title="Common flags">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>`（可重复）

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>`（必需）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>`（必需）
    - `--provider-arg <arg>`（可重复）
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>`（可重复）
    - `--provider-pass-env <ENV_VAR>`（可重复）
    - `--provider-trusted-dir <path>`（可重复）
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

加固的 exec 提供商示例：

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

使用 `--dry-run` 在不写入 `openclaw.json` 的情况下验证更改。

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
  <Accordion title="Dry-run behavior">
    - 构建器模式：对已更改的 refs/providers 运行 SecretRef 可解析性检查。
    - JSON 模式（`--strict-json`、`--json` 或批量模式）：运行 schema 验证以及 SecretRef 可解析性检查。
    - 策略验证也会针对已知不支持的 SecretRef 目标表面运行。
    - 策略检查会评估完整的更改后配置，因此父对象写入（例如将 `hooks` 设置为对象）无法绕过不支持表面的验证。
    - dry-run 期间默认跳过 exec SecretRef 检查，以避免命令副作用。
    - 将 `--allow-exec` 与 `--dry-run` 一起使用可选择启用 exec SecretRef 检查（这可能会执行提供商命令）。
    - `--allow-exec` 仅用于 dry-run；如果不与 `--dry-run` 一起使用会报错。

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` 会打印机器可读报告：

    - `ok`：dry-run 是否通过
    - `operations`：已评估的赋值数量
    - `checks`：是否运行了 schema/可解析性检查
    - `checks.resolvabilityComplete`：可解析性检查是否运行完成（跳过 exec refs 时为 false）
    - `refsChecked`：dry-run 期间实际解析的 refs 数量
    - `skippedExecRefs`：由于未设置 `--allow-exec` 而跳过的 exec refs 数量
    - `errors`：当 `ok=false` 时的结构化 schema/可解析性失败信息

  </Accordion>
</AccordionGroup>

### JSON 输出形状

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
  <Tab title="成功示例">
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
  <Tab title="失败示例">
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
  <Accordion title="如果 dry-run 失败">
    - `config schema validation failed`：变更后的配置结构无效；修正路径/值或提供商/ref 对象结构。
    - `Config policy validation failed: unsupported SecretRef usage`：将该凭证移回明文/字符串输入，并仅在受支持的表面使用 SecretRefs。
    - `SecretRef assignment(s) could not be resolved`：当前无法解析引用的提供商/ref（缺少环境变量、文件指针无效、exec 提供商失败，或提供商/来源不匹配）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry-run 跳过了 exec 引用；如果你需要 exec 可解析性验证，请使用 `--allow-exec` 重新运行。
    - 对于批处理模式，请修复失败条目，并在写入前重新运行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 写入安全

`openclaw config set` 和其他 OpenClaw 拥有的配置写入器会在提交到磁盘前验证完整的变更后配置。如果新载荷未通过 schema 验证，或看起来像破坏性覆盖，活动配置会保持不变，被拒绝的载荷会作为 `openclaw.json.rejected.*` 保存在旁边。

<Warning>
活动配置路径必须是普通文件。写入不支持符号链接的 `openclaw.json` 布局；请改用 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。
</Warning>

小幅编辑优先使用 CLI 写入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果写入被拒绝，请检查保存的载荷并修复完整配置结构：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允许直接用编辑器写入，但运行中的 Gateway 网关会在它们通过验证前将其视为不可信。无效的直接编辑可能会在启动或热重载期间从最后已知良好的备份恢复。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

整文件恢复仅用于全局损坏的配置，例如解析错误、根级 schema 失败、旧版迁移失败，或插件与根配置同时失败。如果验证仅在 `plugins.entries.<id>...` 下失败，OpenClaw 会保留活动的 `openclaw.json`，并报告插件本地问题，而不是恢复 `.last-good`。这可以防止插件 schema 变更或 `minHostVersion` 偏差回滚无关的用户设置，例如模型、提供商、认证配置文件、渠道、Gateway 网关暴露、工具、内存、浏览器或 cron 配置。

## 子命令

- `config file`：打印活动配置文件路径（从 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。该路径应指向普通文件，而不是符号链接。

编辑后重启 Gateway 网关。

## 验证

在不启动 Gateway 网关的情况下，根据活动 schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` 通过后，你可以使用本地 TUI，让嵌入式智能体在同一个终端中验证每项变更时，对照文档比较活动配置：

<Note>
如果验证已经失败，请从 `openclaw configure` 或 `openclaw doctor --fix` 开始。`openclaw chat` 不会绕过无效配置保护。
</Note>

```bash
openclaw chat
```

然后在 TUI 中：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型修复循环：

<Steps>
  <Step title="与文档比较">
    要求智能体将你的当前配置与相关文档页面比较，并建议最小修复。
  </Step>
  <Step title="应用定向编辑">
    使用 `openclaw config set` 或 `openclaw configure` 应用定向编辑。
  </Step>
  <Step title="重新验证">
    每次变更后重新运行 `openclaw config validate`。
  </Step>
  <Step title="针对运行时问题运行 Doctor">
    如果验证通过但运行时仍不健康，请运行 `openclaw doctor` 或 `openclaw doctor --fix` 获取迁移与修复帮助。
  </Step>
</Steps>

## 相关

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
