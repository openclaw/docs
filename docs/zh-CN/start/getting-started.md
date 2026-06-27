---
read_when:
    - 从零开始的首次设置
    - 你想用最快路径完成可用的聊天功能
summary: 几分钟内安装 OpenClaw 并运行你的第一次聊天。
title: 入门指南
x-i18n:
    generated_at: "2026-06-27T03:21:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 769682cfa35a361cc4adc49f010fed18cf897ce66e1404d07b631e4dede64de8
    source_path: start/getting-started.md
    workflow: 16
---

安装 OpenClaw，运行新手引导，并与你的 AI 助手聊天——全部大约
5 分钟完成。完成后，你将拥有一个正在运行的 Gateway 网关、配置好的凭证，
以及一个可用的聊天会话。

## 你需要准备

- **Node.js** — 推荐 Node 24（也支持 Node 22.19+）
- 来自模型提供商（Anthropic、OpenAI、Google 等）的 **API key** — 新手引导会提示你填写

<Tip>
使用 `node --version` 检查你的 Node 版本。
**Windows 用户：** 原生 Windows Hub 应用是最简单的桌面路径。
PowerShell 安装器和 WSL2 Gateway 网关路径也受支持。参见 [Windows](/zh-CN/platforms/windows)。
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

    向导会引导你选择模型提供商、设置 API key，
    并配置 Gateway 网关。大约需要 2 分钟。

    完整参考见 [新手引导（CLI）](/zh-CN/start/wizard)。

  </Step>
  <Step title="验证 Gateway 网关正在运行">
    ```bash
    openclaw gateway status
    ```

    你应该会看到 Gateway 网关正在监听 18789 端口。

  </Step>
  <Step title="打开仪表盘">
    ```bash
    openclaw dashboard
    ```

    这会在浏览器中打开 Control UI。如果能加载，说明一切正常。

  </Step>
  <Step title="发送第一条消息">
    在 Control UI 聊天中输入一条消息，你应该会收到 AI 回复。

    想改用手机聊天？最快设置的渠道是
    [Telegram](/zh-CN/channels/telegram)（只需要一个 Bot token）。所有选项见 [渠道](/zh-CN/channels)。

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
  <Card title="连接一个渠道" href="/zh-CN/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等。
  </Card>
  <Card title="配对和安全" href="/zh-CN/channels/pairing" icon="shield">
    控制谁可以向你的智能体发送消息。
  </Card>
  <Card title="配置 Gateway 网关" href="/zh-CN/gateway/configuration" icon="settings">
    模型、工具、沙箱和高级设置。
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

## 相关

- [安装概览](/zh-CN/install)
- [频道概览](/zh-CN/channels)
- [设置](/zh-CN/start/setup)
