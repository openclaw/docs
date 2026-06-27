---
read_when:
    - 为提供商凭证和 `auth-profiles.json` 引用配置 SecretRefs
    - 在生产环境中安全地重新加载、审计、配置并应用密钥
    - 理解启动快速失败、非活动表面过滤以及最后已知良好行为
sidebarTitle: Secrets management
summary: 密钥管理：SecretRef 契约、运行时快照行为和安全的单向清理
title: 机密管理
x-i18n:
    generated_at: "2026-06-27T02:07:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支持增量 SecretRefs，因此受支持的凭据不需要以明文形式存储在配置中。

<Note>
明文仍然可用。SecretRefs 按凭据选择启用。
</Note>

<Warning>
如果明文凭据存储在智能体可检查的文件中，包括 `openclaw.json`、`auth-profiles.json`、`.env` 或生成的 `agents/*/agent/models.json` 文件，智能体仍可读取它们。只有在每个受支持的凭据都已迁移，并且 `openclaw secrets audit --check` 报告没有明文密钥残留后，SecretRefs 才能降低这种本地影响范围。
</Warning>

## 目标和运行时模型

密钥会被解析到内存中的运行时快照。

- 解析在激活期间急切执行，而不是在请求路径上惰性执行。
- 当实际活跃的 SecretRef 无法解析时，启动会快速失败。
- 重新加载使用原子交换：要么完全成功，要么保留最后一个已知良好的快照。
- SecretRef 策略违规（例如 OAuth 模式凭证配置文件与 SecretRef 输入组合使用）会在运行时交换前导致激活失败。
- 运行时请求只从活跃的内存快照读取。
- 首次成功配置激活/加载后，运行时代码路径会继续读取该活跃的内存快照，直到成功重新加载将其替换。
- 出站投递路径也从该活跃快照读取（例如 Discord 回复/线程投递和 Telegram 操作发送）；它们不会在每次发送时重新解析 SecretRefs。

这会让密钥提供商故障远离热请求路径。

## 智能体访问边界

SecretRefs 保护凭据，避免其持久化到受支持的配置和生成的模型表面中，但它们不是进程隔离边界。如果明文凭据仍位于智能体可读取路径的磁盘上，智能体可以使用文件或 shell 工具检查该文件，从而绕过 API 级别的脱敏。

对于智能体可访问文件属于范围内的生产部署，只有在以下全部为真时，才应将 SecretRef 迁移视为完成：

- 受支持的凭据使用 SecretRefs，而不是明文值
- 已从 `openclaw.json`、`auth-profiles.json`、`.env` 和生成的 `models.json` 文件中清除旧明文残留
- 迁移后 `openclaw secrets audit --check` 是干净的
- 所有剩余的不受支持或轮换凭据都由操作系统隔离、容器隔离或外部凭据代理保护

这就是为什么 audit/configure/apply 工作流是安全迁移门禁，而不只是便利助手。

<Warning>
SecretRefs 不会让任意可读文件变得安全。备份、复制的配置、旧的生成模型目录，以及不受支持的凭据类别，都必须作为生产密钥处理，直到它们被删除、移出智能体信任边界，或受到独立隔离层保护。
</Warning>

## 活跃表面过滤

SecretRefs 只在实际活跃的表面上验证。

- 已启用表面：未解析的 ref 会阻止启动/重新加载。
- 非活跃表面：未解析的 ref 不会阻止启动/重新加载。
- 非活跃 ref 会发出代码为 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 的非致命诊断。

<AccordionGroup>
  <Accordion title="非活跃表面示例">
    - 已禁用的渠道/账户条目。
    - 没有任何已启用账户继承的顶层渠道凭据。
    - 已禁用的工具/功能表面。
    - 未被 `tools.web.search.provider` 选中的 Web 搜索提供商专用键。在自动模式（未设置提供商）下，键会按优先级用于提供商自动检测，直到某个键解析成功。选择完成后，未选中的提供商键会被视为非活跃，直到被选中。
    - 沙箱 SSH 凭证材料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，以及每个智能体的覆盖项）只有在默认智能体或已启用智能体的有效沙箱后端为 `ssh` 时才是活跃的。
    - 如果以下任一条件为真，`gateway.remote.token` / `gateway.remote.password` SecretRefs 是活跃的：
      - `gateway.mode=remote`
      - 已配置 `gateway.remote.url`
      - `gateway.tailscale.mode` 是 `serve` 或 `funnel`
      - 在没有这些远程表面的本地模式下：
        - 当令牌认证可以胜出且未配置环境变量/认证令牌时，`gateway.remote.token` 是活跃的。
        - 只有当密码认证可以胜出且未配置环境变量/认证密码时，`gateway.remote.password` 才是活跃的。
    - 当设置了 `OPENCLAW_GATEWAY_TOKEN` 时，`gateway.auth.token` SecretRef 对启动认证解析是非活跃的，因为环境变量令牌输入会在该运行时胜出。

  </Accordion>
</AccordionGroup>

## Gateway 网关认证表面诊断

当在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上配置 SecretRef 时，Gateway 网关启动/重新加载会明确记录表面状态：

- `active`：SecretRef 是有效认证表面的一部分，必须解析。
- `inactive`：由于另一个认证表面胜出，或由于远程认证已禁用/未活跃，该 SecretRef 在此运行时中被忽略。

这些条目会以 `SECRETS_GATEWAY_AUTH_SURFACE` 记录，并包含活跃表面策略使用的原因，因此你可以看到某个凭据为什么被视为活跃或非活跃。

## 新手引导引用预检

当新手引导在交互模式下运行并且你选择 SecretRef 存储时，OpenClaw 会在保存前运行预检验证：

- Env refs：验证环境变量名称，并确认设置期间可见的值非空。
- 提供商 refs（`file` 或 `exec`）：验证提供商选择、解析 `id`，并检查解析后的值类型。
- Quickstart 复用路径：当 `gateway.auth.token` 已经是 SecretRef 时，新手引导会在探测/dashboard 启动前解析它（对于 `env`、`file` 和 `exec` refs），使用同一个快速失败门禁。

如果验证失败，新手引导会显示错误并允许你重试。

## SecretRef 契约

在所有位置使用同一种对象形状：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    受支持的 SecretInput 字段也接受精确字符串简写：

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
    - `id` 必须是绝对 JSON 指针（`/...`）
    - 段中的 RFC6901 转义：`~` => `~0`，`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    验证：

    - `provider` 必须匹配 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必须匹配 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支持 `secret#json_key` 等选择器）
    - `id` 不得包含以斜杠分隔的 `.` 或 `..` 路径段（例如 `a/../b` 会被拒绝）

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

<AccordionGroup>
  <Accordion title="Env 提供商">
    - 可通过 `allowlist` 设置可选允许列表。
    - 缺失/空环境变量值会导致解析失败。

  </Accordion>
  <Accordion title="File 提供商">
    - 从 `path` 读取本地文件。
    - `mode: "json"` 期望 JSON 对象载荷，并将 `id` 作为指针解析。
    - `mode: "singleValue"` 期望 ref id 为 `"value"`，并返回文件内容。
    - 路径必须通过所有权/权限检查。
    - Windows 故障时关闭说明：如果某个路径无法进行 ACL 验证，解析会失败。仅对于受信任路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过路径安全检查。

  </Accordion>
  <Accordion title="Exec 提供商">
    - 运行配置的绝对二进制路径，不使用 shell。
    - 默认情况下，`command` 必须指向常规文件（不能是符号链接）。
    - 设置 `allowSymlinkCommand: true` 可允许符号链接命令路径（例如 Homebrew shim）。OpenClaw 会验证解析后的目标路径。
    - 将 `allowSymlinkCommand` 与 `trustedDirs` 搭配用于包管理器路径（例如 `["/opt/homebrew"]`）。
    - 支持超时、无输出超时、输出字节限制、环境变量允许列表和受信任目录。
    - Windows 故障时关闭说明：如果命令路径无法进行 ACL 验证，解析会失败。仅对于受信任路径，可在该提供商上设置 `allowInsecurePath: true` 以绕过路径安全检查。
    - 插件管理的 exec 提供商可以使用 `pluginIntegration`，而不是复制的 `command`/`args`。OpenClaw 会在启动/重新加载期间从已安装插件清单中解析当前命令详情。如果插件被禁用、移除、不受信任，或不再声明该集成，使用该提供商的活跃 SecretRefs 会故障时关闭。

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
</AccordionGroup>

## 文件支持的 API key

不要把 `file:...` 字符串放入配置 `env` 块。`env` 块是字面量且不覆盖，因此 `file:...` 不会被解析。

请在受支持的凭据字段上使用 file SecretRef：

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

有关接受 SecretRefs 的配置字段，请参见 [SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface)。

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
    当你希望 SecretRef id 映射到 Bitwarden Secrets Manager 条目键时，请使用解析器包装器。仓库包含 `scripts/secrets/openclaw-bws-resolver.mjs`；请将它安装或复制到运行 Gateway 网关的主机上的绝对受信路径。

    要求：

    - Gateway 网关主机上已安装 Bitwarden Secrets Manager CLI（`bws`）。
    - Gateway 网关服务可使用 `BWS_ACCESS_TOKEN`。
    - 将 `PATH` 传递给解析器，或将 `BWS_BIN` 设置为绝对 `bws` 二进制路径。
    - 使用自托管 Bitwarden 实例时，必须在环境中设置 `BWS_SERVER_URL`。

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

    解析器会批处理请求的 id，运行 `bws secret list`，并返回匹配密钥 `key` 字段的值。请使用满足 exec SecretRef id 契约的键，例如 `openclaw/providers/openai/apiKey`；带下划线的环境变量风格键会在解析器运行前被拒绝。如果多个可见的 Bitwarden 密钥具有相同的请求键，解析器会将该 id 判定为有歧义并失败，而不是选择其中一个。更新配置后，验证解析器路径：

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
  <Accordion title="password-store (`pass`)">
    当你希望 SecretRef id 直接映射到 `pass` 条目时，请使用一个小型解析器包装器。将它保存为绝对路径中的可执行文件，并确保该路径通过你的 exec 提供商路径检查，例如 `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` shebang 会从解析器进程的 `PATH` 解析 `node`，因此请在 `passEnv` 中包含 `PATH`。如果 `pass` 不在该 `PATH` 上，请在父环境中设置 `PASS_BIN`，并同样将它包含在 `passEnv` 中：

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

    将密钥保留在 `pass` 条目的第一行；如果你希望改为返回完整的 `pass show` 输出，可以自定义该包装器。更新配置后，同时验证静态审计和 exec 解析器路径：

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

通过 `plugins.entries.acpx.config.mcpServers` 配置的 MCP 服务器环境变量支持 SecretInput。这可以让 API key 和 token 不出现在明文配置中：

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

明文字符串值仍然可用。像 `${MCP_SERVER_API_KEY}` 这样的环境模板引用和 SecretRef 对象，会在生成 MCP 服务器进程之前，在 gateway 激活期间解析。与其他 SecretRef 表面一样，未解析的引用只有在 `acpx` 插件实际处于活跃状态时才会阻止激活。

## 沙箱 SSH 认证材料

核心 `ssh` 沙箱后端也支持用于 SSH 认证材料的 SecretRef：

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

- OpenClaw 会在沙箱激活期间解析这些引用，而不是在每次 SSH 调用期间惰性解析。
- 解析后的值会写入具有限制性权限的临时文件，并用于生成的 SSH 配置。
- 如果实际沙箱后端不是 `ssh`，这些引用会保持非活跃状态，并且不会阻止启动。

## 支持的凭证表面

规范的受支持和不受支持凭证列在：

- [SecretRef 凭证表面](/zh-CN/reference/secretref-credential-surface)

<Note>
运行时铸造或轮换的凭证以及 OAuth 刷新材料，会有意排除在只读 SecretRef 解析之外。
</Note>

## 必需行为和优先级

- 没有引用的字段：保持不变。
- 带引用的字段：在激活期间，对活跃表面是必需的。
- 如果明文和引用同时存在，在受支持的优先级路径上，引用优先。
- 脱敏哨兵值 `__OPENCLAW_REDACTED__` 保留用于内部配置脱敏/恢复，并会作为字面提交配置数据被拒绝。

警告和审计信号：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（运行时警告）
- `REF_SHADOWED`（当 `auth-profiles.json` 凭证优先于 `openclaw.json` 引用时的审计发现）

Google Chat 兼容行为：

- `serviceAccountRef` 优先于明文 `serviceAccount`。
- 设置了同级引用时，会忽略明文值。

## 激活触发器

Secret 激活会在以下情况下运行：

- 启动（预检加最终激活）
- 配置重载热应用路径
- 配置重载重启检查路径
- 通过 `secrets.reload` 手动重载
- Gateway 网关配置写入 RPC 预检（`config.set` / `config.apply` / `config.patch`），用于在持久化编辑前，在提交的配置负载内检查活跃表面 SecretRef 的可解析性

激活契约：

- 成功会原子性替换快照。
- 启动失败会中止 Gateway 网关启动。
- 运行时重载失败会保留最后一个已知良好的快照。
- 写入 RPC 预检失败会拒绝提交的配置，并保持磁盘配置和活跃运行时快照都不变。
- 向出站 helper/tool 调用提供显式的每次调用渠道 token 不会触发 SecretRef 激活；激活点仍然是启动、重载和显式 `secrets.reload`。

## 降级和恢复信号

当重载时激活在健康状态之后失败，OpenClaw 会进入密钥降级状态。

一次性系统事件和日志代码：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行为：

- 降级：运行时保留最后一个已知良好的快照。
- 恢复：在下一次成功激活后发出一次。
- 在已经降级时重复失败会记录警告，但不会刷屏事件。
- 启动快速失败不会发出降级事件，因为运行时从未变为活跃状态。

## 命令路径解析

命令路径可以通过 gateway 快照 RPC 选择加入受支持的 SecretRef 解析。

有两类主要行为：

<Tabs>
  <Tab title="严格命令路径">
    例如 `openclaw memory` 远程记忆路径，以及在需要远程共享密钥引用时的 `openclaw qr --remote`。它们从活动快照读取，并在所需的 SecretRef 不可用时快速失败。
  </Tab>
  <Tab title="只读命令路径">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及只读 Doctor/配置修复流程。它们也优先使用活动快照，但当目标 SecretRef 在该命令路径中不可用时会降级，而不是中止。

    只读行为：

    - 当 Gateway 网关正在运行时，这些命令会先从活动快照读取。
    - 如果 Gateway 网关解析不完整或 Gateway 网关不可用，它们会针对特定命令表面尝试目标本地回退。
    - 如果目标 SecretRef 仍然不可用，命令会继续输出降级的只读结果，并给出明确诊断，例如“已配置，但在此命令路径中不可用”。
    - 这种降级行为仅限当前命令。它不会削弱运行时启动、重新加载或发送/身份验证路径。

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

在重新审计干净之前，不要将迁移视为完成。如果审计仍然报告静态存储中存在明文值，即使运行时 API 返回的是已脱敏值，智能体访问风险仍然存在。

如果你在 `configure` 期间保存计划而不是应用，请在重新审计前使用 `openclaw secrets apply --from <plan-path>` 应用该已保存计划。

<AccordionGroup>
  <Accordion title="secrets audit">
    发现项包括：

    - 静态存储中的明文值（`openclaw.json`、`auth-profiles.json`、`.env`，以及生成的 `agents/*/agent/models.json`）
    - 生成的 `models.json` 条目中残留的明文敏感提供商标头
    - 未解析的引用
    - 优先级遮蔽（`auth-profiles.json` 优先于 `openclaw.json` 引用）
    - 旧版残留（`auth.json`、OAuth 提醒）

    Exec 说明：

    - 默认情况下，审计会跳过 Exec SecretRef 可解析性检查，以避免命令副作用。
    - 使用 `openclaw secrets audit --allow-exec` 可在审计期间执行 Exec 提供商。

    标头残留说明：

    - 敏感提供商标头检测基于名称启发式规则（常见身份验证/凭据标头名称和片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

  </Accordion>
  <Accordion title="secrets configure">
    交互式助手会：

    - 先配置 `secrets.providers`（`env`/`file`/`exec`，添加/编辑/移除）
    - 允许你为一个智能体作用域选择 `openclaw.json` 以及 `auth-profiles.json` 中受支持的含密字段
    - 可以直接在目标选择器中创建新的 `auth-profiles.json` 映射
    - 捕获 SecretRef 详情（`source`、`provider`、`id`）
    - 运行预检解析
    - 可以立即应用

    Exec 说明：

    - 除非设置了 `--allow-exec`，否则预检会跳过 Exec SecretRef 检查。
    - 如果你直接从 `configure --apply` 应用，且计划包含 Exec 引用/提供商，也请在应用步骤中保持设置 `--allow-exec`。

    有用的模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 应用默认行为：

    - 从 `auth-profiles.json` 中清除目标提供商匹配的静态凭据
    - 从 `auth.json` 中清除旧版静态 `api_key` 条目
    - 从 `<config-dir>/.env` 中清除匹配的已知密钥行

  </Accordion>
  <Accordion title="secrets apply">
    应用已保存计划：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 说明：

    - 除非设置了 `--allow-exec`，否则 dry-run 会跳过 Exec 检查。
    - 除非设置了 `--allow-exec`，否则写入模式会拒绝包含 Exec SecretRefs/提供商的计划。

    如需严格目标/路径契约详情和精确拒绝规则，请参阅 [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 单向安全策略

<Warning>
OpenClaw 有意不写入包含历史明文密钥值的回滚备份。
</Warning>

安全模型：

- 写入模式前预检必须成功
- 提交前会验证运行时激活
- 应用时使用原子文件替换来更新文件，并在失败时尽力恢复

## 旧版身份验证兼容性说明

对于静态凭据，运行时不再依赖明文旧版身份验证存储。

- 运行时凭据来源是已解析的内存中快照。
- 发现旧版静态 `api_key` 条目时会将其清除。
- OAuth 相关兼容行为保持独立。

## Web UI 说明

某些 SecretInput 联合类型在原始编辑器模式中比在表单模式中更容易配置。

## 相关

- [身份验证](/zh-CN/gateway/authentication) — 身份验证设置
- [CLI：secrets](/zh-CN/cli/secrets) — CLI 命令
- [环境变量](/zh-CN/help/environment) — 环境优先级
- [SecretRef 凭据表面](/zh-CN/reference/secretref-credential-surface) — 凭据表面
- [Secrets Apply Plan Contract](/zh-CN/gateway/secrets-plan-contract) — 计划契约详情
- [安全](/zh-CN/gateway/security) — 安全态势
