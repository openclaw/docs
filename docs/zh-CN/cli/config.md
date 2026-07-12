---
read_when:
    - 你想以非交互方式读取或编辑配置
sidebarTitle: Config
summary: '`openclaw config` 的 CLI 参考（get/set/patch/unset/file/schema/validate）'
title: 配置
x-i18n:
    generated_at: "2026-07-12T14:21:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` 的非交互式辅助命令：按路径获取、设置、修补或取消设置值，打印 schema、进行验证，或打印当前生效的文件路径。不带子命令运行 `openclaw config`，即可打开与 `openclaw configure` 相同的引导式向导。

<Note>
当 `OPENCLAW_NIX_MODE=1` 时，OpenClaw 会将 `openclaw.json` 视为不可变文件。只读命令（`config get`、`config file`、`config schema`、`config validate`）仍然可用；配置写入命令会拒绝执行。请改为编辑该安装的 Nix 源；对于第一方 nix-openclaw 发行版，请参阅 [nix-openclaw 快速开始](https://github.com/openclaw/nix-openclaw#quick-start)，并在 `programs.openclaw.config` 或 `instances.<name>.config` 下设置值。
</Note>

## 根选项

<ParamField path="--section <section>" type="string">
  不带子命令运行 `openclaw config` 时，可重复指定的引导式设置分区筛选器。
</ParamField>

引导式分区：`workspace`、`model`、`web`、`gateway`、`daemon`、`channels`、`plugins`、`skills`、`health`。

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

### 路径

使用点号或方括号表示法。在 shell 示例中，请用引号括起方括号路径，以免 zsh 对 `[0]` 进行 glob 展开：

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

从已脱敏的配置快照中读取值（绝不会打印机密信息）。`--json` 会将原始值打印为 JSON；否则，字符串、数字和布尔值会直接打印，对象和数组则会打印为格式化的 JSON。

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

打印当前生效的配置文件路径，该路径通过 `OPENCLAW_CONFIG_PATH` 或默认位置解析得出。该路径指向普通文件，而不是符号链接；请参阅[写入安全](#write-safety)。

### `config schema`

将为 `openclaw.json` 生成的 JSON schema 打印到标准输出。

<AccordionGroup>
  <Accordion title="包含的内容">
    - 当前根配置 schema，以及供编辑器工具使用的根级 `$schema` 字符串字段。
    - Control UI 使用的字段 `title` / `description` 文档元数据。
    - 当存在匹配的字段文档时，嵌套对象、通配符（`*`）和数组项（`[]`）节点会继承相同的 `title` / `description` 元数据。
    - `anyOf` / `oneOf` / `allOf` 分支也会继承相同的文档元数据。
    - 当能够加载运行时清单时，尽力提供实时插件和渠道 schema 元数据。
    - 即使当前配置无效，也会提供干净的后备 schema。

  </Accordion>
  <Accordion title="相关运行时 RPC">
    `config.schema.lookup` 返回一个规范化配置路径，其中包含浅层 schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界）、匹配的 UI 提示元数据以及直接子项摘要。可将其用于 Control UI 或自定义客户端中的路径范围逐层查看。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

在不启动 Gateway 网关的情况下，依据当前生效的 schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
如果验证已经失败，请先运行 `openclaw configure` 或 `openclaw doctor --fix`。`openclaw chat` 不会绕过无效配置保护。
</Note>

## 值

如果可能，值会按 JSON5 解析；否则会被视为原始字符串。使用 `--strict-json` 可要求采用标准 JSON，且不允许回退到字符串（此时会拒绝注释、尾随逗号或未加引号的键等仅 JSON5 支持的语法）。在 `config set` 中，`--json` 是 `--strict-json` 的旧版别名。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 会将原始值打印为 JSON，而不是终端格式化文本。

<Note>
默认情况下，对象赋值会替换目标路径。对于通常包含用户添加条目的受保护路径，如果替换操作会移除现有条目，则必须传入 `--replace`，否则命令会拒绝执行：`agents.defaults.models`、`agents.list`、`models.providers`、`models.providers.<id>`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`。
</Note>

向这些映射添加条目时，请使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

仅当所提供的值应有意成为完整的目标值时，才使用 `--replace`。

## `config set` 模式

<Tabs>
  <Tab title="值模式">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef 构建器模式">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="提供商构建器模式">
    仅以 `secrets.providers.<alias>` 路径为目标：

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="批处理模式">
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
不支持运行时修改的表面会拒绝 SecretRef 赋值（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 Webhook 令牌和 WhatsApp 凭据 JSON）。请参阅 [SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)。
</Warning>

批处理解析始终以批处理负载（`--batch-json`/`--batch-file`）为事实来源；`--strict-json` / `--json` 不会改变批处理解析行为。

JSON 路径/值模式也支持直接设置 SecretRef 和提供商：

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### 提供商构建器标志

提供商构建器的目标路径必须使用 `secrets.providers.<alias>`。

<AccordionGroup>
  <Accordion title="通用标志">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="环境变量提供商（--provider-source env）">
    - `--provider-allowlist <ENV_VAR>`（可重复）

  </Accordion>
  <Accordion title="文件提供商（--provider-source file）">
    - `--provider-path <path>`（必需）
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec 提供商（--provider-source exec）">
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

强化的 Exec 提供商示例：

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

粘贴或通过管道传入配置形状的 JSON5 补丁，而无需运行多个基于路径的 `config set` 命令。对象会递归合并；数组和标量值会替换目标；`null` 会删除目标路径。

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

在远程设置脚本中，通过标准输入传入补丁：

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

补丁示例：

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

当某个对象或数组必须完全变为所提供的值，而不是进行递归修补时，请使用 `--replace-path <path>`：

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run` 会执行 schema 和 SecretRef 可解析性检查，但不会写入。试运行期间默认跳过由 Exec 支持的 SecretRef；当你确实希望试运行执行提供商命令时，请添加 `--allow-exec`。

## 试运行

`--dry-run` 会验证更改，但不会写入 `openclaw.json`。适用于 `config set`、`config patch` 和 `config unset`。

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
  <Accordion title="试运行行为">
    - 构建器模式：对已更改的引用/提供商运行 SecretRef 可解析性检查。
    - JSON 模式（`--strict-json`、`--json` 或批处理模式）：运行架构验证和 SecretRef 可解析性检查。
    - 策略验证针对更改后的完整配置运行，因此父对象写入（例如将 `hooks` 设置为对象）无法绕过不受支持表面的验证。
    - 默认跳过 Exec SecretRef 检查以避免命令副作用；传入 `--allow-exec` 可选择启用（这可能会执行提供商命令）。`--allow-exec` 仅用于试运行，未同时指定 `--dry-run` 时会报错。

  </Accordion>
  <Accordion title="--dry-run --json 字段">
    - `ok`：试运行是否通过
    - `operations`：已评估的赋值数量
    - `checks`：是否运行了架构/可解析性检查
    - `checks.resolvabilityComplete`：可解析性检查是否运行至完成（跳过 exec 引用时为 false）
    - `refsChecked`：试运行期间实际解析的引用数量
    - `skippedExecRefs`：因未设置 `--allow-exec` 而跳过的 exec 引用数量
    - `errors`：当 `ok=false` 时，结构化的路径缺失、架构或可解析性失败信息

  </Accordion>
</AccordionGroup>

### JSON 输出结构

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
      ref?: string, // 可解析性错误时存在
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
          "message": "错误：未设置环境变量 \"MISSING_TEST_SECRET\"。",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="如果试运行失败">
    - `config schema validation failed`：更改后的配置结构无效；请修复路径/值或提供商/引用对象结构。
    - `Config policy validation failed: unsupported SecretRef usage`：将该凭据改回明文/字符串输入；仅在受支持的表面上使用 SecretRef。
    - `SecretRef assignment(s) could not be resolved`：引用的提供商/引用当前无法解析（环境变量缺失、文件指针无效、exec 提供商失败或提供商/来源不匹配）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：如果需要验证 exec 可解析性，请使用 `--allow-exec` 重新运行。
    - 对于批处理模式，请修复失败的条目，并在写入前重新运行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 应用更改

每次成功执行 `config set` / `config patch` / `config unset` 后，CLI 都会输出以下三种提示之一，让你知道 Gateway 网关是否需要重启：

| 提示                                                | 含义                                |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | 更改的路径需要完全重启。 |
| `Change will apply without restarting the gateway.` | 热重载会自动应用该更改。  |
| `No gateway restart needed.`                        | 未更改任何与运行时相关的内容。      |

对 `plugins.entries`（或其任何子路径）的写入始终需要重启，因为 CLI 无法证明每个插件的重载元数据均已加载。

## 写入安全

`openclaw config set` 和其他由 OpenClaw 管理的配置写入工具会在提交到磁盘前验证更改后的完整配置。如果新负载未通过架构验证或看起来会造成破坏性覆盖，活动配置将保持不变，被拒绝的负载则会以 `openclaw.json.rejected.*` 保存到其旁边。

<Warning>
活动配置路径必须是常规文件。不支持写入采用符号链接的 `openclaw.json` 布局；请改用 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。
</Warning>

对于小幅编辑，优先使用 CLI 写入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果写入被拒绝，请检查保存的负载并修复完整配置结构：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允许直接通过编辑器写入，但在验证通过之前，运行中的 Gateway 网关会将其视为不受信任。无效的直接编辑会导致启动失败或被热重载跳过；Gateway 网关不会重写 `openclaw.json`。运行 `openclaw doctor --fix` 可修复带前缀/被覆盖的配置，或恢复最后一个已知良好的副本。请参阅 [Gateway 网关故障排查](/zh-CN/gateway/troubleshooting#gateway-rejected-invalid-config)。

整文件恢复仅用于 Doctor 修复。插件架构更改或 `minHostVersion` 偏差会继续明确报错，而不会回滚模型、提供商、身份验证配置文件、渠道、Gateway 网关暴露、工具、记忆、浏览器或 cron 配置等不相关的用户设置。

## 修复循环

`openclaw config validate` 通过后，使用本地 TUI，让嵌入式智能体将活动配置与文档进行比较，同时你在同一终端中验证每项更改：

```bash
openclaw chat
```

在 TUI 中，行首的 `!` 会运行字面意义上的本地 shell 命令（每个会话首次执行时会显示一次确认提示）：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="与文档比较">
    要求智能体将你当前的配置与相关文档页面进行比较，并建议最小修改方案。
  </Step>
  <Step title="应用针对性编辑">
    使用 `openclaw config set` 或 `openclaw configure` 应用针对性编辑。
  </Step>
  <Step title="重新验证">
    每次更改后重新运行 `openclaw config validate`。
  </Step>
  <Step title="使用 Doctor 处理运行时问题">
    如果验证通过但运行时仍不健康，请运行 `openclaw doctor` 或 `openclaw doctor --fix` 以获取迁移和修复帮助。
  </Step>
</Steps>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
