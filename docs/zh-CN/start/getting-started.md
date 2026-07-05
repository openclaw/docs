---
read_when:
    - 首次从零开始设置
    - 你想要最快完成可用聊天的路径
summary: 几分钟内安装 OpenClaw 并完成你的第一次聊天。
title: 入门指南
x-i18n:
    generated_at: "2026-07-05T11:41:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 308ca58b8a11832b5a4c0d4634d1c88ef44681ef755a18d675bcff60b5aba929
    source_path: start/getting-started.md
    workflow: 16
---

安装 OpenClaw，运行新手引导，并在大约 5 分钟内与你的 AI 助手聊天。完成后，你将拥有一个正在运行的 Gateway 网关、已配置的凭证，以及一个可用的聊天会话。

## 你需要准备

- **Node.js 22.19+、23.11+ 或 24+**（24 是推荐默认版本）
- **一个 API key**，来自模型提供商（Anthropic、OpenAI、Google 等）——新手引导会提示你输入

<Tip>
使用 `node --version` 检查你的 Node 版本。
**Windows 用户：**原生 Windows Hub 应用是最简单的桌面路径。也支持 PowerShell 安装器和 WSL2 Gateway 网关路径。参见 [Windows](/zh-CN/platforms/windows)。
需要安装 Node？参见 [Node 设置](/zh-CN/install/node)。
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
  alt="安装脚本流程"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    其他安装方法（Docker、Nix、npm）：[安装](/zh-CN/install)。
    </Note>

  </Step>
  <Step title="运行新手引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导会引导你选择模型提供商、设置 API key，并配置 Gateway 网关。QuickStart 通常只需几分钟，但提供商登录、渠道配对、守护进程安装、网络下载、Skills 或可选插件可能会让完整新手引导耗时更久。跳过可选步骤，之后可使用 `openclaw configure` 返回继续配置。

    完整参考见 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Step>
  <Step title="验证 Gateway 网关正在运行">
    ```bash
    openclaw gateway status
    ```

    你应该会看到 Gateway 网关正在监听端口 18789。

  </Step>
  <Step title="打开仪表盘">
    ```bash
    openclaw dashboard
    ```

    这会在浏览器中打开 Control UI。如果页面加载成功，则一切正常。

  </Step>
  <Step title="发送你的第一条消息">
    在 Control UI 聊天中输入一条消息，你应该会收到 AI 回复。

    想改用手机聊天？最快能完成设置的渠道是
    [Telegram](/zh-CN/channels/telegram)（只需要一个 Bot token）。查看 [渠道](/zh-CN/channels)
    了解所有选项。

  </Step>
</Steps>

<Accordion title="高级：挂载自定义 Control UI 构建">
  如果你维护本地化或自定义的仪表盘构建，请将
  `gateway.controlUi.root` 指向一个包含已构建静态
  资源和 `index.html` 的目录。

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

重启 Gateway 网关并重新打开仪表盘：

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 接下来做什么

<Columns>
  <Card title="连接渠道" href="/zh-CN/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等。
  </Card>
  <Card title="配对与安全" href="/zh-CN/channels/pairing" icon="shield">
    控制谁可以给你的智能体发消息。
  </Card>
  <Card title="配置 Gateway 网关" href="/zh-CN/gateway/configuration" icon="settings">
    Models、工具、沙箱和高级设置。
  </Card>
  <Card title="浏览工具" href="/zh-CN/tools" icon="wrench">
    浏览器、exec、Web 搜索、技能和插件。
  </Card>
</Columns>

<Accordion title="高级：环境变量">
  如果你以服务账号运行 OpenClaw，或想使用自定义路径：

- `OPENCLAW_HOME` — 用于内部路径解析的主目录
- `OPENCLAW_STATE_DIR` — 覆盖状态目录
- `OPENCLAW_CONFIG_PATH` — 覆盖配置文件路径

完整参考：[环境变量](/zh-CN/help/environment)。
</Accordion>

## 相关内容

- [安装概览](/zh-CN/install)
- [渠道概览](/zh-CN/channels)
- [设置](/zh-CN/start/setup)
