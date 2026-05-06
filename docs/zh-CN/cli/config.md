---
read_when:
    - 你想以非交互方式读取或编辑配置
sidebarTitle: Config
summary: '`openclaw config` 的 CLI 参考（get/set/patch/unset/file/schema/validate）'
title: 配置
x-i18n:
    generated_at: "2026-05-06T12:48:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: e4e0d580347e162278277ddb33eed0e42105c5e85bac4325c07fa2cd700b831d
    source_path: cli/config.md
    workflow: 16
---

用于在 `openclaw.json` 中进行非交互式编辑的配置辅助命令：按路径获取/设置/修补/取消设置/输出文件/输出 schema/验证值，并打印活动配置文件。不带子命令运行会打开配置向导（等同于 `openclaw configure`）。

<Note>
当 `OPENCLAW_NIX_MODE=1` 时，OpenClaw 会将 `openclaw.json` 视为不可变文件。`config get`、`config file`、`config schema` 和 `config validate` 等只读命令仍然可用，但配置写入命令会拒绝执行。智能体应改为编辑该安装的 Nix 源；对于第一方 nix-openclaw 发行版，请使用 [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start)，并在 `programs.openclaw.config` 或 `instances.<name>.config` 下设置值。
</Note>

## 根选项

<ParamField path="--section <section>" type="string">
  当你不带子命令运行 `openclaw config` 时，可重复使用的引导式设置分区过滤器。
</ParamField>

支持的引导分区：`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

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
    - 当前根配置 schema，以及供编辑器工具使用的根 `$schema` 字符串字段。
    - Control UI 使用的字段 `title` 和 `description` 文档元数据。
    - 当存在匹配字段文档时，嵌套对象、通配符（`*`）和数组项（`[]`）节点会继承相同的 `title` / `description` 元数据。
    - 当存在匹配字段文档时，`anyOf` / `oneOf` / `allOf` 分支也会继承相同的文档元数据。
    - 当可加载运行时清单时，尽力提供实时插件 + 渠道 schema 元数据。
    - 即使当前配置无效，也会提供干净的回退 schema。

  </Accordion>
  <Accordion title="Related runtime RPC">
    `config.schema.lookup` 会返回一个规范化配置路径，并附带浅层 schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界）、匹配的 UI 提示元数据以及直接子项摘要。可在 Control UI 或自定义客户端中用于按路径下钻。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

如果想用其他工具检查或验证它，可以将其管道输出到文件：

```bash
openclaw config schema > openclaw.schema.json
```

### 路径

路径使用点号或方括号表示法：

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

值会在可能时按 JSON5 解析；否则会被视为字符串。使用 `--strict-json` 要求必须进行 JSON5 解析。`--json` 仍作为旧版别名受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 会将原始值以 JSON 形式打印，而不是终端格式化文本。

<Note>
对象赋值默认会替换目标路径。常用于保存用户添加条目的受保护映射/列表路径，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，会拒绝可能移除现有条目的替换，除非你传入 `--replace`。
</Note>

向这些映射添加条目时，请使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

只有在你明确希望提供的值成为完整目标值时，才使用 `--replace`。

## `config set` 模式

`openclaw config set` 支持四种赋值样式：

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
    提供商构建器模式仅针对 `secrets.providers.<alias>` 路径：

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
SecretRef 赋值会在不支持运行时可变的表面上被拒绝（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook token，以及 WhatsApp 凭据 JSON）。请参阅 [SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)。
</Warning>

批量解析始终使用批量载荷（`--batch-json`/`--batch-file`）作为真实来源。`--strict-json` / `--json` 不会改变批量解析行为。

## `config patch`

当你想粘贴或管道传入配置形状的补丁，而不是运行许多基于路径的 `config set` 命令时，请使用 `config patch`。输入是 JSON5 对象。对象会递归合并，数组和标量值会替换目标值，`null` 会删除目标路径。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

你也可以通过 stdin 管道传入补丁，这对远程设置脚本很有用：

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

当某个对象或数组必须精确变成提供的值，而不是递归修补时，请使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 会运行 schema 和 SecretRef 可解析性检查，但不会写入。dry-run 期间默认跳过由 exec 支持的 SecretRef；当你明确希望 dry-run 执行提供商命令时，请添加 `--allow-exec`。

JSON 路径/值模式仍支持 SecretRef 和提供商：

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

强化的 exec 提供商示例：

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

使用 `--dry-run` 验证更改，而不写入 `openclaw.json`。

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
    - 构建器模式：对已更改的引用/提供商运行 SecretRef 可解析性检查。
    - JSON 模式（`--strict-json`、`--json` 或批量模式）：运行 schema 验证以及 SecretRef 可解析性检查。
    - 策略验证也会针对已知不受支持的 SecretRef 目标表面运行。
    - 策略检查会评估完整的更改后配置，因此父对象写入（例如将 `hooks` 设置为对象）无法绕过不受支持表面的验证。
    - dry-run 期间默认跳过 exec SecretRef 检查，以避免命令副作用。
    - 将 `--allow-exec` 与 `--dry-run` 一起使用可选择启用 exec SecretRef 检查（这可能会执行提供商命令）。
    - `--allow-exec` 仅适用于 dry-run；如果不与 `--dry-run` 一起使用，会报错。

  </Accordion>
  <Accordion title="--dry-run --json fields">
    `--dry-run --json` 会打印机器可读报告：

    - `ok`：dry-run 是否通过
    - `operations`：已评估的赋值数量
    - `checks`：是否运行了 schema/可解析性检查
    - `checks.resolvabilityComplete`：可解析性检查是否运行完成（跳过 exec 引用时为 false）
    - `refsChecked`：dry-run 期间实际解析的引用数量
    - `skippedExecRefs`：由于未设置 `--allow-exec` 而跳过的 exec 引用数量
    - `errors`：`ok=false` 时的结构化 schema/可解析性失败

  </Accordion>
</AccordionGroup>

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
    - `config schema validation failed`：变更后的配置结构无效；修正路径/值或 提供商/ref 对象结构。
    - `Config policy validation failed: unsupported SecretRef usage`：将该凭证移回明文/字符串输入，并仅在受支持的表面上保留 SecretRefs。
    - `SecretRef assignment(s) could not be resolved`：引用的 提供商/ref 当前无法解析（缺少环境变量、文件指针无效、exec 提供商失败，或 提供商/source 不匹配）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry-run 跳过了 exec 引用；如果需要 exec 可解析性验证，请使用 `--allow-exec` 重新运行。
    - 对于批处理模式，请修正失败条目，并在写入前重新运行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 写入安全

`openclaw config set` 和其他由 OpenClaw 拥有的配置写入器会在提交到磁盘前验证完整的变更后配置。如果新载荷未通过 schema 验证，或看起来像破坏性覆盖，活动配置会保持不变，被拒绝的载荷会以 `openclaw.json.rejected.*` 保存到旁边。

<Warning>
活动配置路径必须是常规文件。不支持对符号链接的 `openclaw.json` 布局执行写入；请改用 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。
</Warning>

小改动优先使用 CLI 写入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果写入被拒绝，请检查保存的载荷并修正完整配置结构：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允许直接用编辑器写入，但运行中的 Gateway 网关会在其通过验证前将其视为不可信。无效的直接编辑会导致启动失败，或被热重载跳过；Gateway 网关不会重写 `openclaw.json`。运行 `openclaw doctor --fix` 可修复带前缀/被覆盖的配置，或恢复最后一个已知良好的副本。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-rejected-invalid-config)。

整文件恢复保留给 Doctor 修复。插件 schema 变更或 `minHostVersion` 偏差会明确报错，而不是回滚无关的用户设置，例如 模型、提供商、凭证配置文件、渠道、Gateway 网关暴露、工具、memory、browser 或 cron 配置。

## 子命令

- `config file`：打印活动配置文件路径（从 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。该路径应指向常规文件，而不是符号链接。

编辑后重启 Gateway 网关。

## 验证

在不启动 Gateway 网关的情况下，根据活动 schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` 通过后，你可以使用本地 TUI，让嵌入式智能体在你从同一个终端验证每项更改时，将活动配置与文档进行比较：

<Note>
如果验证已经失败，请先运行 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置保护。
</Note>

```bash
openclaw chat
```

然后在 TUI 内：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

典型修复循环：

<Steps>
  <Step title="与文档比较">
    让智能体将你的当前配置与相关文档页面进行比较，并建议最小修复。
  </Step>
  <Step title="应用定向编辑">
    使用 `openclaw config set` 或 `openclaw configure` 应用定向编辑。
  </Step>
  <Step title="重新验证">
    每次更改后重新运行 `openclaw config validate`。
  </Step>
  <Step title="使用 Doctor 处理运行时问题">
    如果验证通过但运行时仍不健康，请运行 `openclaw doctor` 或 `openclaw doctor --fix` 获取迁移和修复帮助。
  </Step>
</Steps>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
