---
read_when:
    - 从零开始进行首次设置
    - 你想要以最快路径开始可用聊天
summary: 安装 OpenClaw，并在几分钟内运行你的第一次聊天。
title: 入门指南
x-i18n:
    generated_at: "2026-04-05T10:09:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c43eee6f0d3f593e3cf0767bfacb3e0ae38f51a2615d594303786ae1d4a6d2c3
    source_path: start/getting-started.md
    workflow: 15
---

# 入门指南

安装 OpenClaw，运行新手引导，并与你的 AI 助手聊天——全部过程大约只需 5 分钟。完成后，你将拥有一个正在运行的 Gateway 网关、已配置的鉴权，以及一个可用的聊天会话。

## 你需要准备的内容

- **Node.js** — 推荐 Node 24（也支持 Node 22.14+）
- **来自模型提供商的 API 密钥**（Anthropic、OpenAI、Google 等）— 新手引导会提示你输入

<Tip>
使用 `node --version` 检查你的 Node 版本。
**Windows 用户：** 原生 Windows 和 WSL2 都受支持。WSL2 更稳定，推荐用于完整体验。请参阅 [Windows](/zh-CN/platforms/windows)。
需要安装 Node？请参阅 [Node 设置](/zh-CN/install/node)。
</Tip>

## 快速设置

<Steps>
  <Step title="安装 OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows（PowerShell）">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    其他安装方式（Docker、Nix、npm）：[安装](/zh-CN/install)。
    </Note>

  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导会引导你选择模型提供商、设置 API 密钥并配置 Gateway 网关。大约需要 2 分钟。

    完整参考请参阅 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Step>
  <Step title="验证 Gateway 网关是否正在运行">
    ```bash
    openclaw gateway status
    ```

    你应当能看到 Gateway 网关正在监听端口 18789。

  </Step>
  <Step title="打开控制面板">
    ```bash
    openclaw dashboard
    ```

    这会在你的浏览器中打开控制 UI。如果它能加载，就说明一切正常。

  </Step>
  <Step title="发送你的第一条消息">
    在控制 UI 聊天中输入一条消息，你应该会收到 AI 回复。

    想改用手机聊天？最快可设置的渠道是
    [Telegram](/zh-CN/channels/telegram)（只需要一个 bot token）。请参阅 [渠道](/zh-CN/channels)
    查看全部选项。

  </Step>
</Steps>

<Accordion title="高级：挂载自定义控制 UI 构建">
  如果你维护了本地化或自定义的控制面板构建，请将
  `gateway.controlUi.root` 指向一个包含已构建静态资源和 `index.html` 的目录。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# Copy your built static files into that directory.
```

然后设置：

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

重启 gateway 并重新打开控制面板：

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 接下来做什么

<Columns>
  <Card title="连接一个渠道" href="/zh-CN/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等等。
  </Card>
  <Card title="配对和安全" href="/zh-CN/channels/pairing" icon="shield">
    控制谁可以向你的智能体发送消息。
  </Card>
  <Card title="配置 Gateway 网关" href="/zh-CN/gateway/configuration" icon="settings">
    模型、工具、沙箱和高级设置。
  </Card>
  <Card title="浏览工具" href="/zh-CN/tools" icon="wrench">
    浏览器、exec、Web 搜索、skills 和插件。
  </Card>
</Columns>

<Accordion title="高级：环境变量">
  如果你将 OpenClaw 作为服务账号运行，或想要自定义路径：

- `OPENCLAW_HOME` — 用于内部路径解析的主目录
- `OPENCLAW_STATE_DIR` — 覆盖状态目录
- `OPENCLAW_CONFIG_PATH` — 覆盖配置文件路径

完整参考： [环境变量](/zh-CN/help/environment)。
</Accordion>
