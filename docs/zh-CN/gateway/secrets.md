---
read_when:
    - 为提供商凭据和 `auth-profiles.json` 引用配置 SecretRefs
    - 在生产环境中安全地执行机密信息重载、审计、配置和应用操作
    - 理解启动快速失败、非活跃表面过滤和最后已知良好状态行为
sidebarTitle: Secrets management
summary: 密钥管理：SecretRef 契约、运行时快照行为和安全的单向清除
title: 密钥管理
x-i18n:
    generated_at: "2026-07-12T14:29:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63cc331bc015d29e2b2cee170e09a1db9212338e97e21c07a9bfc73477cbd64a
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支持以增量方式使用 SecretRef，因此受支持的凭据无需以明文形式存放在配置中。

<Note>
明文仍然可用。SecretRef 由每项凭据自行选择启用。
</Note>

<Warning>
如果明文凭据位于智能体可以检查的文件中，包括 `openclaw.json`、`auth-profiles.json`、`.env` 或生成的 `agents/*/agent/models.json` 文件，智能体仍然可以读取这些凭据。只有在迁移所有受支持的凭据，并且 `openclaw secrets audit --check` 报告不存在明文残留后，SecretRef 才能缩小这种本地影响范围。
</Warning>

## 运行时模型

- Secret 会在激活期间预先解析到内存中的运行时快照中，而不是在请求路径上延迟解析。
- 当实际处于活动状态的 SecretRef 无法解析时，启动会快速失败。
- 重载采用原子交换：要么完全成功，要么保留最后一个已知良好的快照。
- 策略违规（例如，将 OAuth 模式的身份验证配置文件与 SecretRef 输入组合使用）会在运行时交换之前导致激活失败。
- 运行时请求仅从活动的内存快照中读取。模型提供商的 SecretRef 凭据会以进程本地哨兵值的形式穿过身份验证存储和流式选项，直至出站。出站交付路径（Discord 回复/话题串交付、Telegram 操作发送）也会读取该快照，不会在每次发送时重新解析引用。

这样可以避免 Secret 提供商故障影响高频请求路径。

## 出站时注入（哨兵值）

对于由 SecretRef 支持的模型提供商凭据，OpenClaw 会在解析模型身份验证时生成一个不透明的进程本地哨兵值。因此，身份验证存储、流式选项、SDK 配置、日志、错误对象和大多数运行时自省看到的是类似 `oc-sent-v1-...` 的值，而不是提供商凭据。受保护的模型 fetch 和托管的本地提供商健康探测会在每个请求离开进程前，立即替换 URL 和标头值中已知的哨兵值。

形似哨兵值的未知值会在发生网络活动前以失败关闭方式处理。OpenClaw 会拒绝发送请求，而不是将未解析的哨兵值转发给提供商。作为纵深防御措施，已解析的 Secret 值还会注册用于精确值日志脱敏。

提供商适配器使用其 SDK 所支持的最晚注入点：

- 支持自定义 fetch 选项的 SDK 会接收 OpenClaw 的受保护 fetch，因此 SDK 会保留哨兵值。
- 不支持自定义 fetch 选项的 SDK 会在构造客户端之前立即解包哨兵值。由插件所有的提供商流和 Agent harness 会在最终的核心所有交接点解包，因为这些传输不共享 OpenClaw 的受保护 fetch。

哨兵值可以减少模型调用链中的明文暴露，但并不能提供进程隔离。真实值仍然存在于同一进程的内存中，并会出现在最终适配器边界。未通过 SecretRef 配置的明文环境凭据仍为明文，不受此机制保护。

设置 `OPENCLAW_SECRET_SENTINELS=off`（也接受 `0` 或 `false`，不区分大小写）可在事件响应或兼容性故障排除期间禁用哨兵值生成。此终止开关不会禁用精确值脱敏注册。

## 智能体访问边界

SecretRef 可防止凭据持久化到配置和生成的模型文件中，但它并不是进程隔离边界。遗留在磁盘上且位于智能体可读取路径中的明文凭据，仍可通过文件或 shell 工具读取，从而绕过 API 级别的脱敏。

对于将智能体可访问文件纳入范围的生产部署，只有满足以下所有条件时，才能视为迁移完成：

- 受支持的凭据使用 SecretRef，而不是明文值。
- 已从 `openclaw.json`、`auth-profiles.json`、`.env` 和生成的 `models.json` 文件中清除旧版明文残留。
- 迁移后，`openclaw secrets audit --check` 检查无异常。
- 任何剩余的不受支持或轮换中的凭据均受到操作系统隔离、容器隔离或外部凭据代理的保护。

这就是为什么审计/配置/应用工作流是安全迁移关卡，而不仅仅是一个便利辅助工具。

<Warning>
SecretRef 不会让任意可读文件变得安全。备份、复制的配置、旧的生成模型目录以及不受支持的凭据类别，在被删除、移出智能体信任边界或单独隔离之前，仍然属于生产 Secret。
</Warning>

## 活动表面筛选

仅在实际处于活动状态的表面上验证 SecretRef：

- **已启用表面**：未解析的引用会阻止启动/重载。
- **非活动表面**：未解析的引用不会阻止启动/重载；它们会发出非致命的 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 诊断。

<Accordion title="非活动表面示例">
- 已禁用的渠道/账户条目。
- 没有任何已启用账户继承的顶层渠道凭据。
- 已禁用的工具/功能表面。
- 未被 `tools.web.search.provider` 选中的 Web 搜索提供商专用密钥。在自动模式（未设置提供商）下，会按优先级依次查询密钥以进行自动检测，直至其中一个成功解析；选择后，未选中的提供商密钥将处于非活动状态。
- 沙箱 SSH 身份验证材料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，以及每个智能体的覆盖配置）仅在默认智能体或已启用智能体的有效沙箱后端为 `ssh`，且沙箱模式不是 `off` 时处于活动状态。
- 如果满足以下任一条件，`gateway.remote.token` / `gateway.remote.password` SecretRef 将处于活动状态：
  - `gateway.mode=remote`
  - 已配置 `gateway.remote.url`
  - `gateway.tailscale.mode` 为 `serve` 或 `funnel`
  - 在没有这些远程表面的本地模式下：当令牌身份验证可能胜出且未配置环境变量/身份验证令牌时，`gateway.remote.token` 处于活动状态；仅当密码身份验证可能胜出且未配置环境变量/身份验证密码时，`gateway.remote.password` 才处于活动状态。
- 设置 `OPENCLAW_GATEWAY_TOKEN` 时，`gateway.auth.token` SecretRef 对启动身份验证解析处于非活动状态，因为该运行时会优先采用环境变量令牌输入。

</Accordion>

## Gateway 网关身份验证表面诊断

在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上设置 SecretRef 时，Gateway 网关启动/重载会使用代码 `SECRETS_GATEWAY_AUTH_SURFACE` 记录表面状态：

- `active`：SecretRef 是有效身份验证表面的一部分，必须成功解析。
- `inactive`：另一个身份验证表面胜出，或者远程身份验证已禁用/未处于活动状态。

日志条目包含活动表面策略采用该状态的原因。

## 新手引导引用预检

在交互式新手引导中，选择 SecretRef 存储会在保存前运行预检验证：

- 环境变量引用：验证环境变量名称，并确认设置期间可以看到非空值。
- 提供商引用（`file` 或 `exec`）：验证提供商选择、解析 `id`，并检查解析后的值类型。
- 快速开始流程：当 `gateway.auth.token` 已经是 SecretRef 时，新手引导会使用相同的快速失败关卡，在探测/仪表板引导启动前解析该值（适用于 `env`、`file` 和 `exec` 引用）。

验证失败时会显示错误，并允许你重试。

## SecretRef 契约

所有位置都使用同一种对象结构：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    SecretInput 字段也接受简写字符串：

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须匹配 `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须是绝对 JSON 指针（`/...`），或者对于 `singleValue` 提供商，必须是字面值 `value`
    - 分段中的 RFC 6901 转义：`~` 变为 `~0`，`/` 变为 `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支持 `secret#json_key` 等选择器）
    - `id` 不得包含以斜杠分隔的 `.` 或 `..` 路径段（例如，`a/../b` 会被拒绝）

  </Tab>
</Tabs>

## 提供商配置

在 `secrets.providers` 下定义提供商：

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // 或 "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<Accordion title="环境变量提供商">
- 可通过 `allowlist` 设置可选的精确名称允许列表。
- 环境变量值缺失或为空会导致解析失败。

</Accordion>

<Accordion title="文件提供商">
- 读取 `path` 处的本地文件。
- `mode: "json"`（默认）要求 JSON 对象载荷，并将 `id` 作为 JSON 指针解析。
- `mode: "singleValue"` 要求引用 ID 为 `"value"`，并返回原始文件内容（去除末尾换行符）。
- 路径必须通过所有权/权限检查；`timeoutMs`（默认 5000）和 `maxBytes`（默认 1 MiB）会限制读取操作。
- Windows 失败关闭：如果无法验证该路径的 ACL，解析将失败。仅对于受信任路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过检查。

</Accordion>

<Accordion title="Exec 提供商">
- 直接运行配置的绝对二进制文件路径，不使用 shell。
- 默认情况下，`command` 必须是常规文件，不能是符号链接。设置 `allowSymlinkCommand: true` 可允许符号链接命令路径（例如 Homebrew shim），并将其与 `trustedDirs`（例如 `["/opt/homebrew"]`）配合使用，以确保只有包管理器路径符合条件。
- 支持 `timeoutMs`（默认 5000）、`noOutputTimeoutMs`（默认等于 `timeoutMs`）、`maxOutputBytes`（默认 1 MiB）、`env`/`passEnv` 允许列表和 `trustedDirs`。
- `jsonOnly` 默认为 `true`。当设置 `jsonOnly: false` 且只请求一个 ID 时，普通的非 JSON 标准输出会被接受为该 ID 的值。
- Windows 失败关闭：如果无法验证命令路径的 ACL，解析将失败。仅对于受信任路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过检查。
- 由插件管理的 Exec 提供商可以使用 `pluginIntegration`，而不是复制的 `command`/`args`。OpenClaw 会在启动/重载期间从已安装插件的清单中解析当前命令详情；如果插件已禁用、被移除、不受信任或不再声明该集成，则该提供商上的活动 SecretRef 会以失败关闭方式处理。

请求载荷（stdin）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

响应载荷（stdout）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

可选的逐 ID 错误：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` 是可选的机器可读诊断。OpenClaw 会显示可识别的
代码 `NOT_FOUND` 和 `AMBIGUOUS_DUPLICATE_KEY`，以及提供商和引用 ID。其他
代码和 `message` 等自由格式字段会为兼容 protocol-v1 而被接受，
但不会显示，因为解析器输出可能包含凭据材料。

</Accordion>

## 基于文件的 API 密钥

不要在配置的 `env` 块中放置 `file:...` 字符串。该块按字面值处理且不会覆盖已有值，因此其中的 `file:...` 永远不会被解析。

请改为在受支持的凭据字段中使用文件 SecretRef：

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

对于 `mode: "singleValue"`，SecretRef 的 `id` 为 `"value"`。对于 `mode: "json"`，请使用绝对 JSON 指针，例如 `"/providers/xai/apiKey"`。

有关接受 SecretRef 的字段，请参阅 [SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)。

## Exec 集成示例

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // Homebrew 符号链接二进制文件需要此项
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    使用解析器包装器将 SecretRef ID 映射到 Bitwarden Secrets Manager 项目键。仓库中包含 `scripts/secrets/openclaw-bws-resolver.mjs`；请将其安装或复制到运行 Gateway 网关的主机上的绝对可信路径。

    要求：

    - Gateway 网关主机上已安装 Bitwarden Secrets Manager CLI（`bws`）。
    - Gateway 网关服务可以访问 `BWS_ACCESS_TOKEN`。
    - 将 `PATH` 传递给解析器，或将 `BWS_BIN` 设置为 `bws` 二进制文件的绝对路径。
    - 使用自托管 Bitwarden 实例时，需在环境中设置 `BWS_SERVER_URL`。

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    解析器会批量处理请求的 ID，运行 `bws secret list`，并返回与密钥 `key` 字段匹配的值。请使用满足 exec SecretRef ID 契约的键，例如 `openclaw/providers/openai/apiKey`；使用下划线的环境变量式键会在解析器运行前被拒绝。如果多个可见的 Bitwarden 密钥使用相同的请求键，解析器会将该 ID 报告为存在歧义并失败，而不会进行猜测。更新配置后，请验证解析器路径：

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // Homebrew 符号链接二进制文件需要此项
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store (`pass`)">
    使用一个小型解析器包装器，将 SecretRef ID 直接映射到 `pass` 条目。将其保存为绝对路径下的可执行文件，并确保该路径通过你的 exec 提供商路径检查，例如 `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` shebang 会从解析器进程的 `PATH` 中解析 `node`，因此请在 `passEnv` 中包含 `PATH`。如果该 `PATH` 中没有 `pass`，请在父进程环境中设置 `PASS_BIN`，并将其也包含在 `passEnv` 中：

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    然后配置 exec 提供商，并将 `apiKey` 指向 `pass` 条目路径：

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    将密钥保存在 `pass` 条目的第一行，或者自定义包装器，使其改为返回完整的 `pass show` 输出。更新配置后，请同时验证静态审计和 exec 解析器路径：

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // Homebrew 符号链接二进制文件需要此项
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## MCP 服务器环境变量

通过 `plugins.entries.acpx.config.mcpServers` 配置的 MCP 服务器环境变量接受 SecretInput，从而避免将 API 密钥和令牌存入明文配置：

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

明文字符串值仍然有效。`${MCP_SERVER_API_KEY}` 等环境模板引用和 SecretRef 对象会在 Gateway 网关激活期间、MCP 服务器进程启动之前解析。与其他 SecretRef 表面一样，只有当 `acpx` 插件实际处于活动状态时，未解析的引用才会阻止激活。

## 沙箱 SSH 身份验证材料

核心 `ssh` 沙箱后端也支持将 SecretRef 用于 SSH 身份验证材料：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

运行时行为：

- OpenClaw 在沙箱激活期间解析这些引用，而不是在每次 SSH 调用时延迟解析。
- 解析后的值会以严格的文件权限（`0o600`）写入临时目录，并用于生成的 SSH 配置。
- 如果实际生效的沙箱后端不是 `ssh`（或沙箱模式为 `off`），这些引用会保持非活动状态，并且不会阻止启动。

## 支持的凭据表面

[SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)中列出了规范的受支持和不受支持凭据。

<Note>
运行时生成或轮换的凭据以及 OAuth 刷新材料被有意排除在只读 SecretRef 解析之外。
</Note>

## 必需行为和优先级

- 不带引用的字段：保持不变。
- 带引用的字段：在激活期间，活动表面上的此类字段为必需项。
- 如果明文值和引用同时存在，在受支持的优先级路径中，引用优先。
- 脱敏哨兵值 `__OPENCLAW_REDACTED__` 保留用于内部配置脱敏/恢复；如果将其作为字面配置数据提交，则会被拒绝。

警告和审计信号：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（运行时警告）
- `REF_SHADOWED`（当 `auth-profiles.json` 凭据的优先级高于 `openclaw.json` 引用时产生的审计发现）

Google Chat 兼容性：`serviceAccountRef` 的优先级高于明文 `serviceAccount`；设置同级引用后，明文值会被忽略。

## 激活触发条件

Secret 激活会在以下情况下运行：

- 启动（预检加最终激活）
- 配置重新加载的热应用路径
- 配置重新加载的重启检查路径
- 通过 `secrets.reload` 手动重新加载
- Gateway 网关配置写入 RPC 预检（`config.set` / `config.apply` / `config.patch`），在持久化编辑前，检查所提交配置载荷中的活动表面 SecretRef 是否可解析

激活契约：

- 成功时以原子方式替换快照。
- 启动失败会中止 Gateway 网关启动。
- 运行时重新加载失败会保留最后一个已知正常的快照。
- 写入 RPC 预检失败会拒绝提交的配置；磁盘配置和活动运行时快照均保持不变。
- 为出站辅助函数/工具调用提供显式的单次渠道令牌不会触发 SecretRef 激活；激活点仍为启动、重新加载和显式的 `secrets.reload`。

## 降级和恢复信号

当系统处于正常状态后，重新加载时的激活失败，OpenClaw 会进入密钥降级状态，并发出一次性系统事件和日志代码：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为：

- 降级：运行时保留最后一个已知正常的快照。
- 恢复：在下一次成功激活后发送一次。
- 已处于降级状态时，重复失败会记录警告，但不会再次发送该事件。
- 启动快速失败绝不会发送降级事件，因为运行时从未进入活动状态。

## 命令路径解析

命令路径可以通过 Gateway 网关快照 RPC 选择启用受支持的 SecretRef 解析。主要有两类行为：

<Tabs>
  <Tab title="严格命令路径">
    例如，`openclaw memory` 的远程记忆路径，以及需要远程共享密钥引用时的 `openclaw qr --remote`。它们从活动快照中读取，并在所需 SecretRef 不可用时快速失败。
  </Tab>
  <Tab title="只读命令路径">
    例如，`openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及只读 Doctor/配置修复流程。它们也优先使用活动快照，但当目标 SecretRef 不可用时会降级，而不是中止。

    只读行为：

    - Gateway 网关运行时，这些命令首先从活动快照中读取。
    - 如果 Gateway 网关解析不完整或 Gateway 网关不可用，它们会尝试针对该命令功能面的本地回退。
    - 如果目标 SecretRef 仍不可用，命令会继续输出降级的只读结果，并提供明确的诊断信息，指出该引用已配置，但在此命令路径中不可用。
    - 此降级行为仅限当前命令；它不会削弱运行时启动、重新加载或发送/身份验证路径。

  </Tab>
</Tabs>

其他说明：

- 后端密钥轮换后的快照刷新由 `openclaw secrets reload` 处理。
- 这些命令路径使用的 Gateway 网关 RPC 方法：`secrets.resolve`。

## 审计和配置工作流

默认操作员流程：

<Steps>
  <Step title="审计当前状态">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="配置并应用 SecretRef">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="重新审计">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

在重新审计结果无问题之前，不要认为迁移已经完成。如果审计仍报告静态存储中存在明文值，那么即使运行时 API 返回的是已脱敏值，智能体访问风险仍然存在。

如果你在 `configure` 期间保存计划而不是直接应用，请在重新审计前使用 `openclaw secrets apply --from <plan-path>` 应用该已保存计划。

<AccordionGroup>
  <Accordion title="secrets audit">
    发现项包括：

    - 静态存储中的明文值（`openclaw.json`、`auth-profiles.json`、`.env` 和生成的 `agents/*/agent/models.json`）。
    - 生成的 `models.json` 条目中残留的明文敏感提供商标头。
    - 无法解析的引用。
    - 优先级遮蔽（`auth-profiles.json` 的优先级高于 `openclaw.json` 中的引用）。
    - 旧版残留（`auth.json`、OAuth 提醒）。

    Exec 说明：默认情况下，审计会跳过 Exec SecretRef 可解析性检查，以避免命令副作用。使用 `openclaw secrets audit --allow-exec` 可在审计期间执行 Exec 提供商。

    标头残留说明：敏感提供商标头检测基于名称启发式规则（常见的身份验证/凭据标头名称，以及 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential` 等片段）。

  </Accordion>
  <Accordion title="secrets configure">
    交互式辅助工具，可执行以下操作：

    - 首先配置 `secrets.providers`（`env`/`file`/`exec`，可添加/编辑/删除）。
    - 允许你选择 `openclaw.json` 中受支持的密钥字段，以及一个智能体作用域的 `auth-profiles.json`。
    - 可以直接在目标选择器中创建新的 `auth-profiles.json` 映射。
    - 获取 SecretRef 详细信息（`source`、`provider`、`id`）。
    - 运行预检解析，并可立即应用。

    Exec 说明：除非设置了 `--allow-exec`，否则预检会跳过 Exec SecretRef 检查。如果你直接通过 `configure --apply` 应用，并且计划中包含 Exec 引用/提供商，也请在应用步骤中保留 `--allow-exec`。

    实用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 的应用默认行为：

    - 从 `auth-profiles.json` 中清除目标提供商的匹配静态凭据。
    - 从 `auth.json` 中清除旧版静态 `api_key` 条目。
    - 从 `<config-dir>/.env` 中清除匹配的已知密钥行。

  </Accordion>
  <Accordion title="secrets apply">
    应用已保存的计划：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 说明：除非设置了 `--allow-exec`，否则试运行会跳过 Exec 检查；除非设置了 `--allow-exec`，否则写入模式会拒绝包含 Exec SecretRef/提供商的计划。

    有关严格的目标/路径契约详情和确切的拒绝规则，请参阅[密钥应用计划契约](/zh-CN/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 单向安全策略

<Warning>
OpenClaw 有意不写入包含历史明文密钥值的回滚备份。
</Warning>

安全模型：

- 预检必须成功后才能进入写入模式。
- 提交前会验证运行时激活。
- 应用过程使用原子文件替换来更新文件，并在失败时尽最大努力恢复。

## 旧版身份验证兼容性说明

对于静态凭据，运行时不再依赖旧版明文身份验证存储。

- 运行时凭据来源是已解析的内存快照。
- 发现旧版静态 `api_key` 条目时会将其清除。
- OAuth 相关兼容行为仍单独处理。

## Web UI 说明

某些 SecretInput 联合类型在原始编辑器模式中比在表单模式中更容易配置。

## 相关内容

- [身份验证](/zh-CN/gateway/authentication) - 身份验证设置
- [CLI：secrets](/zh-CN/cli/secrets) - CLI 命令
- [Vault SecretRef](/plugins/vault) - HashiCorp Vault 提供商设置
- [环境变量](/zh-CN/help/environment) - 环境变量优先级
- [SecretRef 凭据功能面](/zh-CN/reference/secretref-credential-surface) - 凭据功能面
- [密钥应用计划契约](/zh-CN/gateway/secrets-plan-contract) - 计划契约详情
- [安全性](/zh-CN/gateway/security) - 安全态势
