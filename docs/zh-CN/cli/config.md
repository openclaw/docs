---
read_when:
    - 你想以非交互方式读取或编辑配置
summary: '`openclaw config` 的 CLI 参考（get/set/unset/file/schema/validate）'
title: 配置
x-i18n:
    generated_at: "2026-04-25T03:24:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b8d5466d875967b6c9d5bf451f6affbe969d0ba5a48b98ee282612be67128db
    source_path: cli/config.md
    workflow: 15
---

# `openclaw config`

用于在 `openclaw.json` 中进行非交互式编辑的配置辅助命令：按路径获取/设置/取消设置/输出文件/输出 schema/校验值，并打印当前生效的配置文件。不带子命令运行时，会打开配置向导（与 `openclaw configure` 相同）。

根选项：

- `--section <section>`：当你运行不带子命令的 `openclaw config` 时，可重复使用的引导式设置分区过滤器

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
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

将 `openclaw.json` 的生成式 JSON schema 以 JSON 形式打印到 stdout。

包含内容：

- 当前的根配置 schema，以及一个用于编辑器工具的根级 `$schema` 字符串字段
- Control UI 使用的字段 `title` 和 `description` 文档元数据
- 当存在匹配字段文档时，嵌套对象、通配符（`*`）和数组项（`[]`）节点会继承相同的 `title` / `description` 元数据
- 当存在匹配字段文档时，`anyOf` / `oneOf` / `allOf` 分支也会继承相同的文档元数据
- 当能够加载运行时清单时，尽力提供实时的插件 + 渠道 schema 元数据
- 即使当前配置无效，也会提供一个干净的后备 schema

相关运行时 RPC：

- `config.schema.lookup` 会返回一个规范化的配置路径，以及一个浅层 schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界）、匹配的 UI 提示元数据和直接子项摘要。可将其用于 Control UI 或自定义客户端中的路径范围下钻。

```bash
openclaw config schema
```

当你想用其他工具检查或校验它时，可将其输出到文件：

```bash
openclaw config schema > openclaw.schema.json
```

### 路径

路径使用点表示法或方括号表示法：

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

值会尽可能按 JSON5 解析；否则会被视为字符串。使用 `--strict-json` 可强制要求进行 JSON5 解析。`--json` 仍然支持作为旧版别名。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 会将原始值以 JSON 形式打印，而不是终端格式化文本。

对象赋值默认会替换目标路径。对于通常存放用户新增条目的受保护映射/列表路径，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，如果替换会移除现有条目，则会拒绝，除非你传入 `--replace`。

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

- 在不支持运行时可变的目标面上，SecretRef 赋值会被拒绝（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook token，以及 WhatsApp creds JSON）。参见 [SecretRef 凭证目标面](/zh-CN/reference/secretref-credential-surface)。

批量解析始终将批量负载（`--batch-json`/`--batch-file`）作为事实来源。
`--strict-json` / `--json` 不会改变批量解析行为。

JSON 路径/值模式同样支持 SecretRef 和提供商：

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

环境提供商（`--provider-source env`）：

- `--provider-allowlist <ENV_VAR>`（可重复）

文件提供商（`--provider-source file`）：

- `--provider-path <path>`（必填）
- `--provider-mode <singleValue|json>`
- `--provider-max-bytes <bytes>`
- `--provider-allow-insecure-path`

Exec 提供商（`--provider-source exec`）：

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

强化型 Exec 提供商示例：

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

使用 `--dry-run` 可在不写入 `openclaw.json` 的情况下校验变更。

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

Dry-run 行为：

- 构建器模式：会对变更后的 ref/提供商运行 SecretRef 可解析性检查。
- JSON 模式（`--strict-json`、`--json` 或批量模式）：会运行 schema 校验以及 SecretRef 可解析性检查。
- 对于已知不支持的 SecretRef 目标面，也会运行策略校验。
- 策略检查会评估变更后的完整配置，因此父对象写入（例如将 `hooks` 设为对象）无法绕过不支持目标面的校验。
- 为避免命令副作用，dry-run 期间默认会跳过 Exec SecretRef 检查。
- 使用 `--allow-exec` 配合 `--dry-run` 可选择启用 Exec SecretRef 检查（这可能会执行提供商命令）。
- `--allow-exec` 仅用于 dry-run；如果不带 `--dry-run` 使用会报错。

`--dry-run --json` 会打印机器可读报告：

- `ok`：dry-run 是否通过
- `operations`：已评估的赋值数量
- `checks`：是否运行了 schema/可解析性检查
- `checks.resolvabilityComplete`：可解析性检查是否完整运行结束（当跳过 exec ref 时为 false）
- `refsChecked`：dry-run 期间实际解析的 ref 数量
- `skippedExecRefs`：因未设置 `--allow-exec` 而跳过的 exec ref 数量
- `errors`：当 `ok=false` 时的结构化 schema/可解析性失败信息

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
      ref?: string, // 用于可解析性错误时会出现
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

- `config schema validation failed`：变更后的配置结构无效；请修正路径/值或提供商/ref 对象结构。
- `Config policy validation failed: unsupported SecretRef usage`：请将该凭证移回明文/字符串输入，并仅在受支持的目标面上使用 SecretRef。
- `SecretRef assignment(s) could not be resolved`：被引用的提供商/ref 当前无法解析（缺少环境变量、文件指针无效、Exec 提供商失败，或提供商/source 不匹配）。
- `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry-run 跳过了 exec ref；如果你需要验证 exec 可解析性，请使用 `--allow-exec` 重新运行。
- 对于批量模式，请修复失败的条目，并在写入前重新运行 `--dry-run`。

## 写入安全

`openclaw config set` 和其他由 OpenClaw 管理的配置写入器，会在提交到磁盘之前校验变更后的完整配置。如果新负载未通过 schema 校验，或看起来像是破坏性覆盖，当前生效配置将保持不变，被拒绝的负载会以 `openclaw.json.rejected.*` 的形式保存在其旁边。
当前生效的配置路径必须是普通文件。写入时不支持符号链接形式的 `openclaw.json` 布局；请改用 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。

对于小改动，优先使用 CLI 写入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果写入被拒绝，请检查保存下来的负载，并修复完整配置结构：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允许直接通过编辑器写入，但正在运行的 Gateway 网关会在通过校验前将这些更改视为不可信。无效的直接编辑可能会在启动或热重载期间，通过上一次已知有效的备份进行恢复。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

整文件恢复仅用于全局损坏的配置，例如解析错误、根级 schema 校验失败、旧版迁移失败，或插件与根配置混合失败。如果校验仅在 `plugins.entries.<id>...` 下失败，OpenClaw 会保留当前生效的 `openclaw.json`，并报告该插件的局部问题，而不是恢复 `.last-good`。这样可以防止插件 schema 变更或 `minHostVersion` 偏差回滚与你无关的用户设置，例如模型、提供商、auth 配置档、渠道、Gateway 网关暴露方式、工具、内存、浏览器或 cron 配置。

## 子命令

- `config file`：打印当前生效的配置文件路径（从 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。该路径应指向普通文件，而不是符号链接。

编辑后请重启 Gateway 网关。

## 校验

在不启动 Gateway 网关的情况下，使用当前生效的 schema 校验当前配置。

```bash
openclaw config validate
openclaw config validate --json
```

当 `openclaw config validate` 通过后，你可以使用本地 TUI，让内嵌智能体在同一个终端中，一边校验每项更改，一边将当前生效配置与文档进行比较：

如果当前校验已经失败，请先运行 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置保护。

```bash
openclaw chat
```

然后在 TUI 中执行：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型修复循环：

- 让智能体将你当前的配置与相关文档页面进行比较，并建议最小修复方案。
- 使用 `openclaw config set` 或 `openclaw configure` 应用有针对性的修改。
- 每次修改后重新运行 `openclaw config validate`。
- 如果校验通过但运行时状态仍不健康，请运行 `openclaw doctor` 或 `openclaw doctor --fix` 获取迁移和修复帮助。

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
