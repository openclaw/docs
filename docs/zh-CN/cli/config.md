---
read_when:
    - 你想以非交互方式读取或编辑配置。
summary: '`openclaw config` 的 CLI 参考（get/set/unset/file/schema/validate）'
title: 配置
x-i18n:
    generated_at: "2026-04-25T05:53:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60567d39174d7214461f995d32f3064777d7437ff82226961eab404cd7fec5c4
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

用于在 `openclaw.json` 中进行非交互式编辑的配置辅助命令：按路径获取/设置/取消设置/file/schema/validate 值，并打印当前生效的配置文件。不带子命令运行时，将打开配置向导（与 `openclaw configure` 相同）。

根选项：

- `--section <section>`：当你在不带子命令的情况下运行 `openclaw config` 时，可重复使用的引导式设置分区过滤器

支持的引导式分区：

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

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
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

将 `openclaw.json` 的生成式 JSON schema 以 JSON 形式输出到 stdout。

它包含的内容：

- 当前的根配置 schema，以及一个用于编辑器工具的根 `$schema` 字符串字段
- Control UI 使用的字段 `title` 和 `description` 文档元数据
- 当存在匹配的字段文档时，嵌套对象、通配符（`*`）和数组项（`[]`）节点会继承相同的 `title` / `description` 元数据
- 当存在匹配的字段文档时，`anyOf` / `oneOf` / `allOf` 分支也会继承相同的文档元数据
- 当能够加载运行时清单时，尽力提供实时的插件 + 渠道 schema 元数据
- 即使当前配置无效，也会提供一个干净的回退 schema

相关的运行时 RPC：

- `config.schema.lookup` 返回一个标准化的配置路径，以及一个浅层 schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界）、匹配的 UI 提示元数据和直接子节点摘要。可将其用于 Control UI 或自定义客户端中的按路径逐层深入查看。

```bash
openclaw config schema
```

如果你想用其他工具检查或验证它，可以将其输出到文件：

```bash
openclaw config schema > openclaw.schema.json
```

### 路径

路径支持点表示法或方括号表示法：

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

值会尽可能按 JSON5 解析；否则会被视为字符串。使用 `--strict-json` 可强制要求 JSON5 解析。`--json` 仍作为旧版别名受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 会将原始值作为 JSON 输出，而不是终端格式化文本。

对象赋值默认会替换目标路径。对于通常保存用户新增条目的受保护映射/列表路径，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，如果替换会移除现有条目，则会拒绝，除非你传入 `--replace`。

向这些映射中添加条目时，请使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

仅当你明确希望提供的值成为完整目标值时，才使用 `--replace`。

## `config set` 模式

`openclaw config set` 支持四种赋值方式：

1. 值模式：`openclaw config set <path> <value>`
2. SecretRef 构建器模式：

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN
```

3. 提供商构建器模式（仅限 `secrets.providers.<alias>` 路径）：

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-timeout-ms 5000
```

4. 批处理模式（`--batch-json` 或 `--batch-file`）：

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

策略说明：

- 对不支持运行时可变更的目标面进行 SecretRef 赋值会被拒绝（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook token，以及 WhatsApp 凭证 JSON）。参见 [SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface)。

批处理解析始终将批处理载荷（`--batch-json`/`--batch-file`）作为唯一真实来源。
`--strict-json` / `--json` 不会改变批处理解析行为。

JSON 路径/值模式对 SecretRef 和提供商同样受支持：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## 提供商构建器标志

提供商构建器目标路径必须使用 `secrets.providers.<alias>`。

通用标志：

- `--provider-source <env|file|exec>`
- `--provider-timeout-ms <ms>`（`file`、`exec`）

Env 提供商（`--provider-source env`）：

- `--provider-allowlist <ENV_VAR>`（可重复）

文件提供商（`--provider-source file`）：

- `--provider-path <path>`（必需）
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec 提供商（`--provider-source exec`）：

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

使用 `--dry-run` 可在不写入 `openclaw.json` 的情况下验证更改。

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

dry-run 行为：

- 构建器模式：对已更改的 ref/提供商运行 SecretRef 可解析性检查。
- JSON 模式（`--strict-json`、`--json` 或批处理模式）：运行 schema 验证以及 SecretRef 可解析性检查。
- 也会对已知不受支持的 SecretRef 目标面运行策略验证。
- 策略检查会基于变更后的完整配置进行评估，因此写入父对象（例如将 `hooks` 设置为对象）无法绕过对不受支持目标面的验证。
- 默认情况下，dry-run 会跳过 exec SecretRef 检查，以避免命令副作用。
- 如需启用 exec SecretRef 检查，请在 `--dry-run` 时配合使用 `--allow-exec`（这可能会执行提供商命令）。
- `--allow-exec` 仅用于 dry-run；如果在未使用 `--dry-run` 时传入，则会报错。

`--dry-run --json` 会输出机器可读报告：

- `ok`：dry-run 是否通过
- `operations`：已评估的赋值操作数量
- `checks`：是否运行了 schema/可解析性检查
- `checks.resolvabilityComplete`：可解析性检查是否完整执行（当跳过 exec ref 时为 false）
- `refsChecked`：dry-run 期间实际解析的 ref 数量
- `skippedExecRefs`：由于未设置 `--allow-exec` 而跳过的 exec ref 数量
- `errors`：当 `ok=false` 时，结构化的 schema/可解析性失败信息

### JSON 输出结构

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
      ref?: string, // 对于可解析性错误时会出现
    },
  ],
}
```

成功示例：

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

失败示例：

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

如果 dry-run 失败：

- `config schema validation failed`：你的变更后配置结构无效；请修正路径/值或提供商/ref 对象结构。
- `Config policy validation failed: unsupported SecretRef usage`：请将该凭证移回明文/字符串输入，并仅在受支持的目标面上使用 SecretRef。
- `SecretRef assignment(s) could not be resolved`：当前无法解析所引用的提供商/ref（缺少环境变量、文件指针无效、exec 提供商失败，或提供商/source 不匹配）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry-run 跳过了 exec ref；如果你需要验证 exec 可解析性，请使用 `--allow-exec` 重新运行。
- 对于批处理模式，请修复失败的条目，然后在写入前重新运行 `--dry-run`。

## 写入安全

`openclaw config set` 和其他由 OpenClaw 管理的配置写入器，会在提交到磁盘前验证变更后的完整配置。如果新载荷未通过 schema 验证，或看起来像是破坏性的覆盖，当前生效配置将保持不变，且被拒绝的载荷会保存在其旁边，命名为 `openclaw.json.rejected.*`。
当前生效的配置路径必须是常规文件。对于符号链接的 `openclaw.json`
布局，不支持写入；请改用 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。

对于小范围编辑，优先使用 CLI 写入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果写入被拒绝，请检查保存的载荷，并修正完整配置结构：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允许直接通过编辑器写入，但正在运行的 Gateway 网关 会在这些更改通过验证前将其视为不受信任。在启动或热重载期间，无效的直接编辑可能会从最后一次已知有效备份中恢复。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

整文件恢复仅保留给全局损坏的配置，例如解析错误、根级 schema 失败、旧版迁移失败，或插件与根级配置混合失败。如果验证仅在 `plugins.entries.<id>...` 下失败，OpenClaw 会保持当前生效的 `openclaw.json` 不变，并报告插件本地问题，而不是恢复 `.last-good`。这可防止插件 schema 变更或 `minHostVersion` 不匹配导致回滚与你无关的用户设置，例如模型、提供商、auth 配置文件、渠道、Gateway 网关暴露设置、工具、内存、浏览器或 cron 配置。

## 子命令

- `config file`：打印当前生效的配置文件路径（从 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。该路径应指向常规文件，而不是符号链接。

编辑后请重启网关。

## 验证

在不启动 Gateway 网关 的情况下，使用当前生效的 schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```

在 `openclaw config validate` 通过后，你可以使用本地 TUI，让内嵌智能体在你从同一个终端验证每项更改时，对照文档比较当前生效配置。

如果验证已经失败，请先使用 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置保护。

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

- 请智能体将你当前的配置与相关文档页面进行比较，并建议最小修复方案。
- 使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的编辑。
- 每次更改后重新运行 `openclaw config validate`。
- 如果验证通过但运行时仍不健康，请运行 `openclaw doctor` 或 `openclaw doctor --fix` 以获取迁移和修复帮助。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
