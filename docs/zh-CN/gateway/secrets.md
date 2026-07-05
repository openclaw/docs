---
read_when:
    - 为提供商凭证和 `auth-profiles.json` 引用配置 SecretRefs
    - 在生产环境中安全地重新加载、审计、配置和应用操作密钥
    - 理解启动快速失败、非活动表面过滤和最后已知可用行为
sidebarTitle: Secrets management
summary: 密钥管理：SecretRef 合约、运行时快照行为和安全的单向清理
title: 密钥管理
x-i18n:
    generated_at: "2026-07-05T11:20:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe9349dd27755288ca7fd389c17e640fd55ff98587cbed783683be35b43eba7d
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支持增量式 SecretRef，因此受支持的凭证无需以明文形式存放在配置中。

<Note>
明文仍然可用。SecretRef 按每个凭证选择启用。
</Note>

<Warning>
如果明文凭证位于 agent 可检查的文件中，包括 `openclaw.json`、`auth-profiles.json`、`.env` 或生成的 `agents/*/agent/models.json` 文件，它们仍然可被 agent 读取。只有在每个受支持的凭证都迁移完成，并且 `openclaw secrets audit --check` 报告没有明文残留后，SecretRef 才会降低这个本地影响范围。
</Warning>

## 运行时模型

- 密钥会在激活期间提前解析到内存中的运行时快照，而不是在请求路径上惰性解析。
- 当实际处于活动状态的 SecretRef 无法解析时，启动会快速失败。
- 重新加载是原子替换：要么完全成功，要么保留最后一个已知良好的快照。
- 策略违规（例如 OAuth 模式的凭证配置与 SecretRef 输入组合使用）会在运行时替换前导致激活失败。
- 运行时请求只读取活动的内存快照。出站投递路径（Discord 回复/线程投递、Telegram 操作发送）也读取该快照，并且不会在每次发送时重新解析引用。

这会让密钥提供商故障远离高频请求路径。

## Agent 访问边界

SecretRef 会阻止凭证持久化到配置和生成的模型文件中，但它不是进程隔离边界。留在磁盘上且位于 agent 可读取路径中的明文凭证，仍然可以通过文件或 shell 工具读取，从而绕过 API 级别的脱敏。

对于 agent 可访问文件在范围内的生产部署，只有在满足以下所有条件时，才应将迁移视为完成：

- 受支持的凭证使用 SecretRef，而不是明文值。
- 旧版明文残留已从 `openclaw.json`、`auth-profiles.json`、`.env` 和生成的 `models.json` 文件中清除。
- 迁移后 `openclaw secrets audit --check` 结果干净。
- 任何剩余的不受支持或会轮换的凭证，都由 OS 隔离、容器隔离或外部凭证代理保护。

这就是为什么 audit/configure/apply 工作流是安全迁移门禁，而不只是便利辅助工具。

<Warning>
SecretRef 不会让任意可读文件变得安全。备份、复制的配置、旧生成的模型目录，以及不受支持的凭证类别，在被删除、移出 agent 信任边界或单独隔离之前，仍然是生产密钥。
</Warning>

## 活动表面过滤

SecretRef 只会在实际处于活动状态的表面上验证：

- **启用的表面**：未解析的引用会阻止启动/重新加载。
- **非活动表面**：未解析的引用不会阻止启动/重新加载；它们会发出非致命的 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 诊断。

<Accordion title="非活动表面示例">
- 已禁用的渠道/账号条目。
- 没有任何已启用账号继承的顶层渠道凭证。
- 已禁用的工具/功能表面。
- 未被 `tools.web.search.provider` 选中的 Web 搜索提供商专用键。在自动模式（未设置提供商）下，会按优先级查阅键以进行自动检测，直到有一个解析成功；选择后，未选中的提供商键为非活动状态。
- 沙箱 SSH 凭证材料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，以及每个 agent 的覆盖项）仅在有效沙箱后端为 `ssh` 且沙箱模式不是 `off` 时，对默认 agent 或已启用的 agent 处于活动状态。
- 如果满足以下任一条件，`gateway.remote.token` / `gateway.remote.password` SecretRef 处于活动状态：
  - `gateway.mode=remote`
  - 已配置 `gateway.remote.url`
  - `gateway.tailscale.mode` 为 `serve` 或 `funnel`
  - 在没有这些远程表面的本地模式中：当令牌认证可以胜出且未配置环境/认证令牌时，`gateway.remote.token` 处于活动状态；只有当密码认证可以胜出且未配置环境/认证密码时，`gateway.remote.password` 才处于活动状态。
- 当设置了 `OPENCLAW_GATEWAY_TOKEN` 时，`gateway.auth.token` SecretRef 对启动认证解析为非活动状态，因为环境令牌输入会在该运行时胜出。

</Accordion>

## Gateway 网关认证表面诊断

当在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上设置 SecretRef 时，Gateway 网关启动/重新加载会在代码 `SECRETS_GATEWAY_AUTH_SURFACE` 下记录表面状态：

- `active`：SecretRef 是有效认证表面的一部分，必须解析。
- `inactive`：另一个认证表面胜出，或远程认证被禁用/未处于活动状态。

日志条目包含活动表面策略使用的原因。

## 新手引导引用预检

在交互式新手引导中，选择 SecretRef 存储会在保存前运行预检验证：

- 环境引用：验证环境变量名称，并确认设置期间可见一个非空值。
- 提供商引用（`file` 或 `exec`）：验证提供商选择，解析 `id`，并检查解析后的值类型。
- 快速开始流程：当 `gateway.auth.token` 已经是 SecretRef 时，新手引导会在探测/dashboard 引导启动前解析它（适用于 `env`、`file` 和 `exec` 引用），并使用相同的快速失败门禁。

验证失败会显示错误并允许你重试。

## SecretRef 合约

所有地方都使用一种对象形状：

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
    - `id` 必须是绝对 JSON 指针（`/...`），或对于 `singleValue` 提供商为字面量 `value`
    - 段中的 RFC 6901 转义：`~` 变为 `~0`，`/` 变为 `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支持 `secret#json_key` 等选择器）
    - `id` 不得包含作为斜杠分隔路径段的 `.` 或 `..`（例如 `a/../b` 会被拒绝）

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
        mode: "json", // or "singleValue"
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

<Accordion title="环境提供商">
- 可通过 `allowlist` 配置可选的精确名称允许列表。
- 缺失或为空的环境值会导致解析失败。

</Accordion>

<Accordion title="文件提供商">
- 读取 `path` 处的本地文件。
- `mode: "json"`（默认）期望 JSON 对象载荷，并将 `id` 解析为 JSON 指针。
- `mode: "singleValue"` 期望引用 id 为 `"value"`，并返回原始文件内容（会去除尾随换行符）。
- 路径必须通过所有权/权限检查；`timeoutMs`（默认 5000）和 `maxBytes`（默认 1 MiB）会限制读取。
- Windows 失败关闭：如果该路径的 ACL 验证不可用，解析会失败。仅对可信路径，可在该提供商上设置 `allowInsecurePath: true` 来绕过检查。

</Accordion>

<Accordion title="Exec 提供商">
- 直接运行配置的绝对二进制路径，不使用 shell。
- 默认情况下，`command` 必须是普通文件，而不是符号链接。设置 `allowSymlinkCommand: true` 可允许符号链接命令路径（例如 Homebrew 垫片），并将其与 `trustedDirs`（例如 `["/opt/homebrew"]`）配对，使只有包管理器路径符合条件。
- 支持 `timeoutMs`（默认 5000）、`noOutputTimeoutMs`（默认等于 `timeoutMs`）、`maxOutputBytes`（默认 1 MiB）、`env`/`passEnv` 允许列表和 `trustedDirs`。
- `jsonOnly` 默认为 `true`。当 `jsonOnly: false` 且只请求一个 id 时，普通非 JSON stdout 会被接受为该 id 的值。
- Windows 失败关闭：如果命令路径的 ACL 验证不可用，解析会失败。仅对可信路径，可在该提供商上设置 `allowInsecurePath: true` 来绕过检查。
- 插件管理的 exec 提供商可以使用 `pluginIntegration`，而不是复制的 `command`/`args`。OpenClaw 会在启动/重新加载期间，从已安装插件清单中解析当前命令详情；如果插件被禁用、移除、不受信任，或不再声明该集成，该提供商上的活动 SecretRef 会失败关闭。

请求载荷（stdin）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

响应载荷（stdout）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

可选的按 id 错误：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

</Accordion>

## 文件支持的 API 密钥

不要把 `file:...` 字符串放在配置的 `env` 块中。该块是字面量且不会覆盖，因此 `file:...` 永远不会在那里解析。

请改为在受支持的凭证字段上使用文件 SecretRef：

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

对于 `mode: "singleValue"`，SecretRef `id` 是 `"value"`。对于 `mode: "json"`，请使用绝对 JSON 指针，例如 `"/providers/xai/apiKey"`。

请参阅 [SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)，了解接受 SecretRef 的字段。

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
    使用解析器包装器将 SecretRef id 映射到 Bitwarden Secrets Manager 条目键。仓库包含 `scripts/secrets/openclaw-bws-resolver.mjs`；请将其安装或复制到运行 Gateway 网关的主机上的绝对可信路径。

    要求：

    - Gateway 网关主机上已安装 Bitwarden Secrets Manager CLI（`bws`）。
    - `BWS_ACCESS_TOKEN` 可供 Gateway 网关服务使用。
    - `PATH` 传递给解析器，或将 `BWS_BIN` 设置为绝对 `bws` 二进制路径。
    - 使用自托管 Bitwarden 实例时，在环境中设置 `BWS_SERVER_URL`。

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

    解析器会批量处理请求的 ID，运行 `bws secret list`，并返回匹配密钥 `key` 字段的值。使用满足 exec SecretRef ID 合约的键，例如 `openclaw/providers/openai/apiKey`；带下划线的环境变量风格键会在解析器运行前被拒绝。如果多个可见的 Bitwarden 密钥共享请求的键，解析器会将该 ID 判定为歧义并失败，而不是猜测。更新配置后，验证解析器路径：

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
  <Accordion title="password-store（`pass`）">
    使用一个小型解析器包装器，将 SecretRef ID 直接映射到 `pass` 条目。将其保存为可执行文件，放在能通过你的 exec provider 路径检查的绝对路径下，例如 `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` shebang 会从解析器进程的 `PATH` 解析 `node`，因此请在 `passEnv` 中包含 `PATH`。如果 `pass` 不在该 `PATH` 上，请在父环境中设置 `PASS_BIN`，并同样将其包含在 `passEnv` 中：

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

    然后配置 exec provider，并将 `apiKey` 指向 `pass` 条目路径：

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

    将密钥保留在 `pass` 条目的第一行，或自定义包装器以返回完整的 `pass show` 输出。更新配置后，验证静态审计和 exec 解析器路径：

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

通过 `plugins.entries.acpx.config.mcpServers` 配置的 MCP 服务器环境变量接受 SecretInput，从而让 API key 和令牌不出现在明文配置中：

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

明文字符串值仍然可用。像 `${MCP_SERVER_API_KEY}` 这样的环境变量模板引用和 SecretRef 对象会在 Gateway 网关激活期间解析，先于 MCP 服务器进程启动。与其他 SecretRef 表面一样，未解析的引用只有在 `acpx` 插件实际处于活动状态时才会阻止激活。

## 沙箱 SSH 凭证材料

核心 `ssh` 沙箱后端也支持将 SecretRef 用于 SSH 凭证材料：

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

- OpenClaw 在沙箱激活期间解析这些引用，而不是在每次 SSH 调用时惰性解析。
- 解析后的值会写入带有限制性文件权限（`0o600`）的临时目录，并用于生成的 SSH 配置。
- 如果有效沙箱后端不是 `ssh`（或沙箱模式为 `off`），这些引用会保持非活动状态，并且不会阻止启动。

## 支持的凭证表面

规范支持和不支持的凭证列在 [SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface) 中。

<Note>
运行时签发或轮换的凭证以及 OAuth 刷新材料被有意排除在只读 SecretRef 解析之外。
</Note>

## 必需行为和优先级

- 没有引用的字段：保持不变。
- 带有引用的字段：在激活期间对活动表面是必需的。
- 如果明文和引用同时存在，在支持的优先级路径上引用优先。
- 遮盖哨兵值 `__OPENCLAW_REDACTED__` 保留给内部配置遮盖/还原使用，作为字面提交的配置数据会被拒绝。

警告和审计信号：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（运行时警告）
- `REF_SHADOWED`（当 `auth-profiles.json` 凭证优先于 `openclaw.json` 引用时的审计发现）

Google Chat 兼容性：`serviceAccountRef` 优先于明文 `serviceAccount`；一旦设置了同级引用，明文值就会被忽略。

## 激活触发器

密钥激活会在以下情况下运行：

- 启动（预检加最终激活）
- 配置重载热应用路径
- 配置重载重启检查路径
- 通过 `secrets.reload` 手动重载
- Gateway 网关配置写入 RPC 预检（`config.set` / `config.apply` / `config.patch`），在持久化编辑之前检查提交的配置载荷中活动表面的 SecretRef 可解析性

激活合约：

- 成功会以原子方式交换快照。
- 启动失败会中止 Gateway 网关启动。
- 运行时重载失败会保留最后一个已知可用快照。
- 写入 RPC 预检失败会拒绝提交的配置；磁盘配置和活动运行时快照都保持不变。
- 向出站 helper/工具调用提供显式的按调用频道令牌不会触发 SecretRef 激活；激活点仍然是启动、重载和显式 `secrets.reload`。

## 降级和恢复信号

当重载时激活在健康状态之后失败，OpenClaw 会进入降级密钥状态，并发出一次性系统事件和日志代码：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为：

- 降级：运行时保留最后一个已知可用快照。
- 恢复：在下一次成功激活后发出一次。
- 已经处于降级状态时反复失败会记录警告，但不会重新发出事件。
- 启动快速失败永远不会发出降级事件，因为运行时从未变为活动状态。

## 命令路径解析

命令路径可以通过 Gateway 网关快照 RPC 选择加入受支持的 SecretRef 解析。适用两类大致行为：

<Tabs>
  <Tab title="严格命令路径">
    例如 `openclaw memory` 远程记忆路径，以及需要远程共享密钥引用时的 `openclaw qr --remote`。它们从活动快照读取，并在必需 SecretRef 不可用时快速失败。
  </Tab>
  <Tab title="只读命令路径">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及只读 doctor/config 修复流程。它们也优先使用活动快照，但当目标 SecretRef 不可用时会降级，而不是中止。

    只读行为：

    - 当 Gateway 网关正在运行时，这些命令会先从活动快照读取。
    - 如果 Gateway 网关解析不完整或 Gateway 网关不可用，它们会为该命令表面尝试定向本地回退。
    - 如果目标 SecretRef 仍然不可用，该命令会继续输出降级的只读结果，并给出明确诊断，说明该引用已配置但在此命令路径中不可用。
    - 此降级行为仅限命令本地；它不会削弱运行时启动、重载或发送/认证路径。

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
  <Step title="配置并应用 SecretRefs">
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

在重新审计干净之前，不要将迁移视为完成。如果审计仍报告静态存储中存在明文值，即使运行时 API 返回的是已遮蔽值，智能体访问风险仍然存在。

如果你在 `configure` 期间保存了计划而不是直接应用，请在重新审计前使用 `openclaw secrets apply --from <plan-path>` 应用该已保存计划。

<AccordionGroup>
  <Accordion title="secrets audit">
    发现项包括：

    - 静态存储中的明文值（`openclaw.json`、`auth-profiles.json`、`.env` 以及生成的 `agents/*/agent/models.json`）。
    - 生成的 `models.json` 条目中残留的敏感提供商标头明文。
    - 未解析的引用。
    - 优先级遮蔽（`auth-profiles.json` 优先于 `openclaw.json` 引用）。
    - 旧版残留（`auth.json`、OAuth 提醒）。

    Exec 说明：默认情况下，audit 会跳过 exec SecretRef 可解析性检查，以避免命令副作用。使用 `openclaw secrets audit --allow-exec` 可在审计期间执行 exec 提供商。

    标头残留说明：敏感提供商标头检测基于名称启发式规则（常见的认证/凭据标头名称和片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

  </Accordion>
  <Accordion title="secrets configure">
    交互式辅助工具会：

    - 先配置 `secrets.providers`（`env`/`file`/`exec`，添加/编辑/移除）。
    - 允许你选择 `openclaw.json` 中受支持的承载机密字段，以及一个智能体范围的 `auth-profiles.json`。
    - 可以直接在目标选择器中创建新的 `auth-profiles.json` 映射。
    - 捕获 SecretRef 详情（`source`、`provider`、`id`）。
    - 运行预检解析，并可立即应用。

    Exec 说明：除非设置 `--allow-exec`，否则预检会跳过 exec SecretRef 检查。如果你直接从 `configure --apply` 应用，并且计划包含 exec 引用/提供商，也请在应用步骤保持设置 `--allow-exec`。

    有用的模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 应用默认值：

    - 从 `auth-profiles.json` 中清理目标提供商的匹配静态凭据。
    - 从 `auth.json` 中清理旧版静态 `api_key` 条目。
    - 从 `<config-dir>/.env` 中清理匹配的已知机密行。

  </Accordion>
  <Accordion title="secrets apply">
    应用已保存计划：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 说明：除非设置 `--allow-exec`，否则 dry-run 会跳过 exec 检查；写入模式会拒绝包含 exec SecretRefs/提供商的计划，除非设置了 `--allow-exec`。

    有关严格的目标/路径契约详情和精确拒绝规则，请参阅 [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 单向安全策略

<Warning>
OpenClaw 有意不写入包含历史明文机密值的回滚备份。
</Warning>

安全模型：

- 写入模式前预检必须成功。
- 提交前会验证运行时激活。
- Apply 使用原子文件替换来更新文件，并在失败时尽力恢复。

## 旧版认证兼容性说明

对于静态凭据，运行时不再依赖明文旧版认证存储。

- 运行时凭据来源是已解析的内存中快照。
- 发现旧版静态 `api_key` 条目时会清理。
- OAuth 相关兼容性行为保持独立。

## Web UI 说明

某些 SecretInput 联合类型在原始编辑器模式中比在表单模式中更容易配置。

## 相关

- [Authentication](/zh-CN/gateway/authentication) - 认证设置
- [CLI: secrets](/zh-CN/cli/secrets) - CLI 命令
- [Environment Variables](/zh-CN/help/environment) - 环境优先级
- [SecretRef Credential Surface](/zh-CN/reference/secretref-credential-surface) - 凭据表面
- [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract) - 计划契约详情
- [Security](/zh-CN/gateway/security) - 安全态势
