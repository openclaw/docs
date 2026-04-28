---
read_when:
    - 你想以非交互方式读取或编辑配置
sidebarTitle: Config
summary: 用于 `openclaw config` 的 CLI 参考（get/set/unset/file/schema/validate）
title: 配置
x-i18n:
    generated_at: "2026-04-28T11:47:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e90f979a102a6c54f8458f8a2c7f36bec5b1e82ea4bdd30e9c3a4b1d903cf11
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json` 中用于非交互式编辑的配置助手：按路径获取/设置/取消设置/输出文件/输出 schema/验证值，并打印当前生效的配置文件。不带子命令运行时会打开配置向导（等同于 `openclaw configure`）。

## 根选项

<ParamField path="--section <section>" type="string">
  不带子命令运行 `openclaw config` 时，可重复使用的引导式设置分区过滤器。
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
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

将为 `openclaw.json` 生成的 JSON schema 以 JSON 形式打印到 stdout。

<AccordionGroup>
  <Accordion title="包含内容">
    - 当前根配置 schema，以及用于编辑器工具的根 `$schema` 字符串字段。
    - Control UI 使用的字段 `title` 和 `description` 文档元数据。
    - 嵌套对象、通配符（`*`）和数组项（`[]`）节点在存在匹配字段文档时，会继承相同的 `title` / `description` 元数据。
    - `anyOf` / `oneOf` / `allOf` 分支在存在匹配字段文档时，也会继承相同的文档元数据。
    - 运行时清单可加载时，尽力提供实时插件 + 渠道 schema 元数据。
    - 即使当前配置无效，也会提供干净的回退 schema。

  </Accordion>
  <Accordion title="相关运行时 RPC">
    `config.schema.lookup` 会返回一个规范化的配置路径，包含浅层 schema 节点（`title`、`description`、`type`、`enum`、`const`、常见边界）、匹配的 UI 提示元数据，以及直接子项摘要。可用于 Control UI 或自定义客户端中的路径级下钻。
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

如果要用其他工具检查或验证它，可以将其通过管道写入文件：

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

值会在可能时按 JSON5 解析；否则按字符串处理。使用 `--strict-json` 要求必须按 JSON5 解析。`--json` 仍作为旧版别名受支持。

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json` 会以 JSON 打印原始值，而不是终端格式化文本。

<Note>
对象赋值默认会替换目标路径。受保护的 map/list 路径通常保存用户添加的条目，例如 `agents.defaults.models`、`models.providers`、`models.providers.<id>.models`、`plugins.entries` 和 `auth.profiles`，除非传入 `--replace`，否则会拒绝移除现有条目的替换操作。
</Note>

向这些 map 添加条目时使用 `--merge`：

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

仅当你确实希望提供的值成为完整目标值时，才使用 `--replace`。

## `config set` 模式

`openclaw config set` 支持四种赋值样式：

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
SecretRef 赋值会在不受支持的运行时可变 surface 上被拒绝（例如 `hooks.token`、`commands.ownerDisplaySecret`、Discord 线程绑定 webhook 令牌，以及 WhatsApp 凭证 JSON）。参阅 [SecretRef 凭证 Surface](/zh-CN/reference/secretref-credential-surface)。
</Warning>

批处理解析始终使用批处理负载（`--batch-json`/`--batch-file`）作为事实来源。`--strict-json` / `--json` 不会改变批处理解析行为。

JSON 路径/值模式仍同时支持 SecretRefs 和提供商：

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
  <Accordion title="通用标志">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>`（`file`、`exec`）

  </Accordion>
  <Accordion title="Env 提供商（--provider-source env）">
    - `--provider-allowlist <ENV_VAR>`（可重复）

  </Accordion>
  <Accordion title="File 提供商（--provider-source file）">
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

## 空运行

使用 `--dry-run` 验证变更而不写入 `openclaw.json`。

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
  <Accordion title="空运行行为">
    - 构建器模式：对已变更的 refs/提供商运行 SecretRef 可解析性检查。
    - JSON 模式（`--strict-json`、`--json` 或批处理模式）：运行 schema 验证和 SecretRef 可解析性检查。
    - 对已知不受支持的 SecretRef 目标 surface，也会运行策略验证。
    - 策略检查会评估完整的变更后配置，因此父对象写入（例如将 `hooks` 设置为对象）无法绕过不受支持 surface 的验证。
    - 为避免命令副作用，空运行期间默认跳过 Exec SecretRef 检查。
    - 将 `--allow-exec` 与 `--dry-run` 一起使用，可选择启用 exec SecretRef 检查（这可能会执行提供商命令）。
    - `--allow-exec` 仅用于空运行；如果不带 `--dry-run` 使用则会报错。

  </Accordion>
  <Accordion title="--dry-run --json 字段">
    `--dry-run --json` 会打印机器可读报告：

    - `ok`：空运行是否通过
    - `operations`：已评估的赋值数量
    - `checks`：是否运行了 schema/可解析性检查
    - `checks.resolvabilityComplete`：可解析性检查是否运行完成（跳过 exec refs 时为 false）
    - `refsChecked`：空运行期间实际解析的 refs 数量
    - `skippedExecRefs`：因未设置 `--allow-exec` 而跳过的 exec refs 数量
    - `errors`：`ok=false` 时的结构化 schema/可解析性失败

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
    - `config schema validation failed`：你的变更后配置形状无效；修复路径/值或提供商/ref 对象形状。
    - `Config policy validation failed: unsupported SecretRef usage`：将该凭据移回明文/字符串输入，并仅在支持的表面上保留 SecretRefs。
    - `SecretRef assignment(s) could not be resolved`：当前无法解析引用的提供商/ref（缺少环境变量、文件指针无效、exec 提供商失败，或提供商/源不匹配）。
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`：dry-run 跳过了 exec refs；如果你需要 exec 可解析性验证，请使用 `--allow-exec` 重新运行。
    - 对于批处理模式，请修复失败条目，并在写入前重新运行 `--dry-run`。

  </Accordion>
</AccordionGroup>

## 写入安全

`openclaw config set` 和其他 OpenClaw 拥有的配置写入器会在提交到磁盘前验证完整的变更后配置。如果新的载荷未通过 schema 验证，或看起来像破坏性覆盖，活动配置会保持不变，被拒绝的载荷会作为 `openclaw.json.rejected.*` 保存到旁边。

<Warning>
活动配置路径必须是常规文件。不支持通过符号链接布局的 `openclaw.json` 进行写入；请改用 `OPENCLAW_CONFIG_PATH` 直接指向真实文件。
</Warning>

小改动优先使用 CLI 写入：

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

如果写入被拒绝，请检查保存的载荷并修复完整的配置形状：

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

仍然允许直接用编辑器写入，但运行中的 Gateway 网关会在它们通过验证前将其视为不受信任。无效的直接编辑可以在启动或热重载期间从上次已知良好备份恢复。参见 [Gateway 网关故障排除](/zh-CN/gateway/troubleshooting#gateway-restored-last-known-good-config)。

整文件恢复仅用于全局损坏的配置，例如解析错误、根级 schema 失败、旧版迁移失败，或插件与根配置混合失败。如果验证只在 `plugins.entries.<id>...` 下失败，OpenClaw 会保留当前的 `openclaw.json`，并报告插件本地问题，而不是恢复 `.last-good`。这可以防止插件 schema 变更或 `minHostVersion` 偏差回滚无关的用户设置，例如模型、提供商、auth profiles、渠道、Gateway 网关暴露、工具、memory、browser 或 cron 配置。

## 子命令

- `config file`：打印活动配置文件路径（由 `OPENCLAW_CONFIG_PATH` 或默认位置解析）。该路径应指向常规文件，而不是符号链接。

编辑后重启 Gateway 网关。

## 验证

在不启动 Gateway 网关的情况下，根据活动 schema 验证当前配置。

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate` 通过后，你可以使用本地 TUI，让嵌入式智能体在你从同一终端验证每项变更时，将活动配置与文档进行比较：

<Note>
如果验证已经失败，请从 `openclaw configure` 或 `openclaw doctor --fix` 开始。`openclaw chat` 不会绕过无效配置保护。
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
    要求智能体将你的当前配置与相关文档页面比较，并建议最小修复。
  </Step>
  <Step title="应用定向编辑">
    使用 `openclaw config set` 或 `openclaw configure` 应用定向编辑。
  </Step>
  <Step title="重新验证">
    每次变更后重新运行 `openclaw config validate`。
  </Step>
  <Step title="针对运行时问题运行 Doctor">
    如果验证通过但运行时仍然不健康，请运行 `openclaw doctor` 或 `openclaw doctor --fix` 来获取迁移和修复帮助。
  </Step>
</Steps>

## 相关内容

- [CLI 参考](/zh-CN/cli)
- [配置](/zh-CN/gateway/configuration)
