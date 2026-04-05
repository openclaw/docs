---
read_when:
    - 你想以非交互方式读取或编辑配置
summary: '`openclaw config` 的 CLI 参考（get/set/unset/file/schema/validate）'
title: config
x-i18n:
    generated_at: "2026-04-05T08:19:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4de30f41e15297019151ad1a5b306cb331fd5c2beefd5ce5b98fcc51e95f0de
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

用于在 `openclaw.json` 中进行非交互式编辑的配置辅助工具：按路径获取/设置/取消设置/查看文件/schema/验证
值，并打印当前生效的配置文件。无子命令运行时会打开配置向导（与 `openclaw configure` 相同）。

根选项：

- `--section <section>`：当你在没有子命令的情况下运行 `openclaw config` 时，可重复的引导式设置分区过滤器

支持的引导分区：

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
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

将为 `openclaw.json` 生成的 JSON schema 作为 JSON 打印到 stdout。

其包含内容：

- 当前根配置 schema，以及一个用于编辑器工具的根 `$schema` 字符串字段
- Control UI 使用的字段 `title` 和 `description` 文档元数据
- 当存在匹配的字段文档时，嵌套对象、通配符（`*`）和数组项（`[]`）节点会继承相同的 `title` / `description` 元数据
- 当存在匹配的字段文档时，`anyOf` / `oneOf` / `allOf` 分支也会继承相同的文档元数据
- 在运行时清单可加载时，尽力提供实时插件 + 渠道 schema 元数据
- 即使当前配置无效，也会提供一个干净的回退 schema

相关运行时 RPC：

- `config.schema.lookup` 返回一个已标准化的配置路径及其浅层
  schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界），
  匹配的 UI 提示元数据，以及直接子节点摘要。可将其用于
  Control UI 或自定义客户端中的按路径逐层钻取。

```bash
openclaw config schema
```

如果你想检查它，或用其他工具验证它，可以将其重定向到文件中：

```bash
openclaw config schema > openclaw.schema.json
```

### 路径

路径使用点表示法或括号表示法：

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

值会尽可能按 JSON5 解析；否则会被视为字符串。
使用 `--strict-json` 可强制要求按 JSON5 解析。`--json` 仍然作为旧版别名受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 会将原始值以 JSON 形式输出，而不是终端格式化文本。

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

4. 批量模式（`--batch-json` 或 `--batch-file`）：

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

- 在不支持运行时可变更的表面上，SecretRef 赋值会被拒绝（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook token，以及 WhatsApp 凭证 JSON）。请参阅 [SecretRef Credential Surface](/reference/secretref-credential-surface)。

批量解析始终将批量负载（`--batch-json` / `--batch-file`）作为事实来源。
`--strict-json` / `--json` 不会改变批量解析行为。

JSON 路径/值模式对 SecretRef 和提供商也仍然受支持：

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

环境变量提供商（`--provider-source env`）：

- `--provider-allowlist <ENV_VAR>`（可重复）

文件提供商（`--provider-source file`）：

- `--provider-path <path>`（必填）
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`

exec 提供商（`--provider-source exec`）：

- `--provider-command <path>`（必填）
- `--provider-arg <arg>`（可重复）
- `--provider-no-output-timeout-ms <ms>`
- `--provider-max-output-bytes <bytes>`
- `--provider-json-only`
- `--provider-env <KEY=VALUE>`（可重复）
- `--provider-pass-env <ENV_VAR>`（可重复）
- `--provider-trusted-dir <path>`（可重复）
- `--provider-allow-insecure-path`
- `--provider-allow-symlink-command`

强化型 exec 提供商示例：

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

使用 `--dry-run` 在不写入 `openclaw.json` 的情况下验证变更。

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

Dry run 行为：

- 构建器模式：对已变更的 ref/提供商执行 SecretRef 可解析性检查。
- JSON 模式（`--strict-json`、`--json` 或批量模式）：执行 schema 验证以及 SecretRef 可解析性检查。
- 对已知不支持 SecretRef 的目标表面，也会执行策略验证。
- 策略检查会针对变更后的完整配置进行评估，因此写入父对象（例如将 `hooks` 设置为对象）无法绕过对不支持表面的验证。
- 为避免命令副作用，dry run 期间默认跳过 exec SecretRef 检查。
- 如需启用 exec SecretRef 检查，请将 `--allow-exec` 与 `--dry-run` 一起使用（这可能会执行提供商命令）。
- `--allow-exec` 仅用于 dry run；若未配合 `--dry-run` 使用则会报错。

`--dry-run --json` 会输出机器可读的报告：

- `ok`：dry run 是否通过
- `operations`：已评估的赋值数量
- `checks`：是否运行了 schema / 可解析性检查
- `checks.resolvabilityComplete`：可解析性检查是否完整运行（跳过 exec ref 时为 false）
- `refsChecked`：dry run 期间实际已解析的 ref 数量
- `skippedExecRefs`：因未设置 `--allow-exec` 而跳过的 exec ref 数量
- `errors`：当 `ok=false` 时的结构化 schema / 可解析性失败信息

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
      ref?: string, // 出现可解析性错误时存在
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

如果 dry run 失败：

- `config schema validation failed`：你的变更后配置结构无效；请修正路径/值或提供商/ref 对象结构。
- `Config policy validation failed: unsupported SecretRef usage`：请将该凭证移回纯文本/字符串输入，并仅在受支持的表面上使用 SecretRef。
- `SecretRef assignment(s) could not be resolved`：当前被引用的提供商/ref 无法解析（缺少环境变量、文件指针无效、exec 提供商失败，或提供商/来源不匹配）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry run 跳过了 exec ref；如果你需要验证 exec 可解析性，请使用 `--allow-exec` 重新运行。
- 对于批量模式，请修复失败的条目，然后在写入前重新运行 `--dry-run`。

## 子命令

- `config file`：打印当前生效的配置文件路径（从 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。

编辑后请重启 Gateway 网关。

## 验证

在不启动 Gateway 网关的情况下，使用当前生效的 schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```
