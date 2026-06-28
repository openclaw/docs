---
read_when:
    - 登录 ClawHub
    - 使用 ClawHub CLI
    - 调试 401 错误
summary: ClawHub 登录、API 令牌、CLI 登录、令牌存储和撤销。
x-i18n:
    generated_at: "2026-06-28T07:41:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4f39be61235d71ff7a563c11a16cfd3b90562b664314c9cffd184dddd2199dbc
    source_path: clawhub/auth.md
    workflow: 16
---

# 认证

ClawHub 使用 GitHub 进行 Web 登录。CLI 使用通过该已登录账户创建的 ClawHub API 令牌。

## Web 登录

使用 GitHub 在 [clawhub.ai](https://clawhub.ai) 登录。

已删除、被封禁或被停用的账户无法完成正常的 ClawHub 登录。如果登录后又回到已登出状态，你的账户状态可能不正常。如果你的账户被封禁或停用，并且你认为这是错误，请使用 [ClawHub 申诉表](https://appeals.openclaw.ai/)。

## CLI 登录

默认 CLI 登录流程会打开你的浏览器：

```bash
clawhub login
clawhub whoami
```

会发生以下流程：

1. CLI 在 `127.0.0.1` 上启动一个临时回调服务器。
2. 你的浏览器打开 ClawHub 登录页面。
3. GitHub 登录后，ClawHub 会创建一个 API 令牌。
4. 浏览器重定向回本地回调。
5. CLI 将令牌存储在你的 ClawHub 配置文件中。

如果你的浏览器由于防火墙、VPN 或代理规则而无法访问本地回调，请使用无头令牌流程。

## 无头登录

在 ClawHub Web UI 中创建令牌，然后将其传给 CLI：

```bash
clawhub login --token clh_...
```

此流程适用于服务器、CI 作业或仅终端环境。

对于可以在其他位置打开浏览器的远程 shell，请运行：

```bash
clawhub login --device
```

CLI 会打印一次性代码，并在你通过 `https://clawhub.ai/cli/device` 授权时等待。

## 令牌存储

默认配置路径：

- macOS：`~/Library/Application Support/clawhub/config.json`
- Linux/XDG：`$XDG_CONFIG_HOME/clawhub/config.json` 或 `~/.config/clawhub/config.json`
- Windows：`%APPDATA%\\clawhub\\config.json`

使用以下方式覆盖路径：

```bash
export CLAWHUB_CONFIG_PATH=/path/to/config.json
```

使用以下命令打印已存储的令牌以进行 CI 设置：

```bash
clawhub token
```

## 撤销

你可以在 ClawHub Web UI 中撤销 API 令牌。

已撤销、无效或缺失的令牌会返回 `401 Unauthorized`。使用 `clawhub login` 重新登录，或使用 `clawhub login --token` 提供新的令牌。

已删除、被封禁或被停用的账户无法继续使用现有 API 令牌。如果你的账户被封禁或停用，并且你认为这是错误，请使用 [ClawHub 申诉表](https://appeals.openclaw.ai/)。
