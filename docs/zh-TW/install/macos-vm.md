---
read_when:
    - 您希望 OpenClaw 與您的主要 macOS 環境隔離
    - 你想要在沙箱中使用 iMessage 整合（BlueBubbles）
    - 你想要一個可重設且可複製的 macOS 環境
    - 你想比較本機與託管式 macOS VM 選項
summary: 需要隔離環境或 iMessage 時，在沙盒化的 macOS 虛擬機器（本機或代管）中執行 OpenClaw
title: macOS 虛擬機器
x-i18n:
    generated_at: "2026-04-30T03:15:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# 在 macOS VM 上執行 OpenClaw（沙盒化）

## 建議的預設方式（多數使用者）

- **小型 Linux VPS**，用於永遠在線的 Gateway 並降低成本。請參閱 [VPS 託管](/zh-TW/vps)。
- 如果你想要完全控制，並需要用於瀏覽器自動化的**住宅 IP**，請使用**專用硬體**（Mac mini 或 Linux 主機）。許多網站會封鎖資料中心 IP，因此本機瀏覽通常效果更好。
- **混合式：**將 Gateway 放在便宜的 VPS 上，並在需要瀏覽器/UI 自動化時把你的 Mac 連接為 **Node**。請參閱 [Nodes](/zh-TW/nodes) 和 [Gateway 遠端](/zh-TW/gateway/remote)。

當你明確需要僅限 macOS 的功能（iMessage/BlueBubbles），或想要與日常使用的 Mac 嚴格隔離時，請使用 macOS VM。

## macOS VM 選項

### 在你的 Apple Silicon Mac 上執行本機 VM（Lume）

使用 [Lume](https://cua.ai/docs/lume)，在你現有的 Apple Silicon Mac 上於沙盒化 macOS VM 中執行 OpenClaw。

這會提供：

- 隔離的完整 macOS 環境（主機保持乾淨）
- 透過 BlueBubbles 支援 iMessage（Linux/Windows 上無法做到）
- 透過複製 VM 立即重設
- 不需要額外硬體或雲端成本

### 託管 Mac 供應商（雲端）

如果你想在雲端使用 macOS，託管 Mac 供應商也可行：

- [MacStadium](https://www.macstadium.com/)（託管 Mac）
- 其他託管 Mac 廠商也可使用；請遵循它們的 VM + SSH 文件

取得 macOS VM 的 SSH 存取權後，繼續下方第 6 步。

---

## 快速路徑（Lume，適合有經驗的使用者）

1. 安裝 Lume
2. `lume create openclaw --os macos --ipsw latest`
3. 完成設定輔助程式，啟用遠端登入（SSH）
4. `lume run openclaw --no-display`
5. 透過 SSH 連線，安裝 OpenClaw，設定通道
6. 完成

---

## 你需要準備的項目（Lume）

- Apple Silicon Mac（M1/M2/M3/M4）
- 主機需執行 macOS Sequoia 或更新版本
- 每個 VM 約 60 GB 可用磁碟空間
- 約 20 分鐘

---

## 1) 安裝 Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

如果 `~/.local/bin` 不在你的 PATH 中：

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

驗證：

```bash
lume --version
```

文件：[Lume 安裝](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) 建立 macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

這會下載 macOS 並建立 VM。VNC 視窗會自動開啟。

<Note>
下載時間可能會依你的連線速度而有所不同。
</Note>

---

## 3) 完成設定輔助程式

在 VNC 視窗中：

1. 選擇語言和地區
2. 略過 Apple ID（如果稍後想使用 iMessage，也可以登入）
3. 建立使用者帳號（記住使用者名稱和密碼）
4. 略過所有選用功能

設定完成後，啟用 SSH：

1. 開啟「系統設定」→「一般」→「共享」
2. 啟用「遠端登入」

---

## 4) 取得 VM IP 位址

```bash
lume get openclaw
```

尋找 IP 位址（通常是 `192.168.64.x`）。

---

## 5) 透過 SSH 連入 VM

```bash
ssh youruser@192.168.64.X
```

將 `youruser` 替換為你建立的帳號，並將 IP 替換為你的 VM IP。

---

## 6) 安裝 OpenClaw

在 VM 內：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

依照導引提示設定你的模型供應商（Anthropic、OpenAI 等）。

---

## 7) 設定通道

編輯設定檔：

```bash
nano ~/.openclaw/openclaw.json
```

加入你的通道：

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

然後登入 WhatsApp（掃描 QR）：

```bash
openclaw channels login
```

---

## 8) 以無頭模式執行 VM

停止 VM，並在無顯示器模式下重新啟動：

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM 會在背景執行。OpenClaw 的 daemon 會讓 gateway 持續執行。

檢查狀態：

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 額外：iMessage 整合

這是在 macOS 上執行的關鍵功能。使用 [BlueBubbles](https://bluebubbles.app) 將 iMessage 加入 OpenClaw。

在 VM 內：

1. 從 bluebubbles.app 下載 BlueBubbles
2. 使用你的 Apple ID 登入
3. 啟用 Web API 並設定密碼
4. 將 BlueBubbles Webhook 指向你的 gateway（範例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）

加入你的 OpenClaw 設定：

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

重新啟動 gateway。現在你的代理可以傳送和接收 iMessage。

完整設定細節：[BlueBubbles 通道](/zh-TW/channels/bluebubbles)

---

## 儲存黃金映像

在進一步自訂前，先快照乾淨狀態：

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

隨時重設：

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 執行

讓 VM 持續執行的方式：

- 讓你的 Mac 保持接上電源
- 在「系統設定」→「節能」中停用睡眠
- 視需要使用 `caffeinate`

若需要真正永遠在線，請考慮專用 Mac mini 或小型 VPS。請參閱 [VPS 託管](/zh-TW/vps)。

---

## 疑難排解

| 問題                     | 解決方案                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------- |
| 無法透過 SSH 連入 VM     | 檢查 VM 的「系統設定」中是否已啟用「遠端登入」                                    |
| VM IP 未顯示             | 等待 VM 完全啟動，然後再次執行 `lume get openclaw`                                |
| 找不到 Lume 命令         | 將 `~/.local/bin` 加入你的 PATH                                                    |
| WhatsApp QR 無法掃描     | 執行 `openclaw channels login` 時，請確認你已登入 VM（不是主機）                   |

---

## 相關文件

- [VPS 託管](/zh-TW/vps)
- [Nodes](/zh-TW/nodes)
- [Gateway 遠端](/zh-TW/gateway/remote)
- [BlueBubbles 通道](/zh-TW/channels/bluebubbles)
- [Lume 快速開始](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 參考](https://cua.ai/docs/lume/reference/cli-reference)
- [無人值守 VM 設定](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（進階）
- [Docker 沙盒化](/zh-TW/install/docker)（替代隔離方式）
