---
read_when:
    - 你想要將 OpenClaw 與主要的 macOS 環境隔離。
    - 您想在沙箱中整合 iMessage
    - 你想要一個可複製並能重設的 macOS 環境
    - 您想比較本機與託管式 macOS 虛擬機器選項
summary: 當你需要隔離環境或使用 iMessage 時，請在沙箱化的 macOS 虛擬機器（本機或託管）中執行 OpenClaw
title: macOS 虛擬機器
x-i18n:
    generated_at: "2026-07-11T21:29:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## 建議的預設方案（適合大多數使用者）

- 使用**小型 Linux VPS**，以低成本維持閘道持續運作。請參閱 [VPS 託管](/zh-TW/vps)。
- 如果你希望擁有完整控制權，並需要用於瀏覽器自動化的**住宅 IP**，請使用**專用硬體**（Mac mini 或 Linux 主機）。許多網站會封鎖資料中心 IP，因此在本機瀏覽通常效果更好。
- **混合式方案**：將閘道部署在便宜的 VPS 上，需要進行瀏覽器／使用者介面自動化時，再將你的 Mac 作為**節點**連線。請參閱[節點](/zh-TW/nodes)與[遠端閘道](/zh-TW/gateway/remote)。

只有在你明確需要 iMessage 等 macOS 專屬功能，或希望與日常使用的 Mac 嚴格隔離時，才使用 macOS 虛擬機器。

## macOS 虛擬機器選項

### 在 Apple Silicon Mac 上執行本機虛擬機器（Lume）

使用 [Lume](https://cua.ai/docs/lume)，在現有的 Apple Silicon Mac 上，透過沙箱化的 macOS 虛擬機器執行 OpenClaw。這可提供：

- 完全隔離的 macOS 環境（主機可保持乾淨）
- 透過 `imsg` 支援 iMessage；預設的本機路徑在 Linux／Windows 上無法使用
- 藉由複製虛擬機器立即重設
- 不需要額外硬體或雲端費用

### 託管式 Mac 供應商（雲端）

如果你想在雲端使用 macOS，也可以使用託管式 Mac 供應商：

- [MacStadium](https://www.macstadium.com/)（託管式 Mac）
- 其他託管式 Mac 供應商也可以使用；請依照其虛擬機器與 SSH 文件操作

取得 macOS 虛擬機器的 SSH 存取權後，請繼續進行下方的[安裝 OpenClaw](#6-install-openclaw)。

## 快速流程（Lume，適合有經驗的使用者）

1. 安裝 Lume。
2. `lume create openclaw --os macos --ipsw latest`
3. 完成「Setup Assistant」，並啟用「Remote Login」（SSH）。
4. `lume run openclaw --no-display`
5. 透過 SSH 登入、安裝 OpenClaw，並設定頻道。
6. 完成。

## 所需條件（Lume）

- Apple Silicon Mac（M1／M2／M3／M4）
- 主機需執行 macOS Sequoia 或更新版本
- 每部虛擬機器約需 60 GB 可用磁碟空間
- 約 20 分鐘

## 1）安裝 Lume

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

文件：[Lume 安裝指南](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2）建立 macOS 虛擬機器

```bash
lume create openclaw --os macos --ipsw latest
```

此指令會下載 macOS 並建立虛擬機器。VNC 視窗會自動開啟。

<Note>
下載所需時間可能因你的連線速度而異。
</Note>

## 3）完成「Setup Assistant」

在 VNC 視窗中：

1. 選擇語言和地區。
2. 略過「Apple ID」（如果之後要使用 iMessage，也可以登入）。
3. 建立使用者帳號（請記住使用者名稱和密碼）。
4. 略過所有選用功能。

設定完成後：

1. 啟用 SSH：開啟「System Settings -> General -> Sharing」，並啟用 "Remote Login"。
2. 若要以無頭模式使用虛擬機器，請啟用自動登入：開啟「System Settings -> Users & Groups」，選取 "Automatically log in as:"，然後選擇虛擬機器使用者。

## 4）取得虛擬機器的 IP 位址

```bash
lume get openclaw
```

找出 IP 位址（通常為 `192.168.64.x`）。

## 5）透過 SSH 登入虛擬機器

```bash
ssh youruser@192.168.64.X
```

將 `youruser` 替換為你建立的帳號，並將 IP 替換為虛擬機器的 IP。

## 6）安裝 OpenClaw

在虛擬機器內：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

依照初始設定提示，設定你的模型供應商（Anthropic、OpenAI 等）。

## 7）設定頻道

編輯設定檔：

```bash
nano ~/.openclaw/openclaw.json
```

加入你的頻道：

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

接著登入 WhatsApp（掃描 QR Code）：

```bash
openclaw channels login
```

## 8）以無頭模式執行虛擬機器

停止虛擬機器，並在不顯示畫面的情況下重新啟動：

```bash
lume stop openclaw
lume run openclaw --no-display
```

虛擬機器會在背景執行；OpenClaw 的常駐程式會讓閘道持續運作。若要檢查狀態：

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## 額外功能：iMessage 整合

這是在 macOS 上執行時最具吸引力的功能。搭配 `imsg` 使用 [iMessage](/zh-TW/channels/imessage)，即可將「Messages」加入 OpenClaw。

在虛擬機器內：

1. 登入「Messages」。
2. 安裝 `imsg`。
3. 為執行 OpenClaw／`imsg` 的程序授予「Full Disk Access」與「Automation」權限。
4. 使用 `imsg rpc --help` 驗證 RPC 支援。

加入你的 OpenClaw 設定：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

重新啟動閘道。你的代理程式現在可以傳送和接收 iMessage。完整設定詳情請參閱：[iMessage 頻道](/zh-TW/channels/imessage)。

## 儲存黃金映像

進一步自訂之前，先為乾淨狀態建立快照：

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

## 全天候執行

可透過以下方式讓虛擬機器持續執行：

- 讓 Mac 保持接上電源
- 在「System Settings -> Energy Saver」中停用睡眠
- 視需要使用 `caffeinate`

若要真正保持持續運作，請考慮使用專用的 Mac mini 或小型 VPS。請參閱 [VPS 託管](/zh-TW/vps)。

## 疑難排解

| 問題                       | 解決方案                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| 無法透過 SSH 登入虛擬機器 | 檢查虛擬機器的「System Settings」中是否已啟用 "Remote Login"                                  |
| 未顯示虛擬機器 IP          | 等待虛擬機器完全啟動，然後再次執行 `lume get openclaw`                                        |
| 找不到 Lume 指令           | 將 `~/.local/bin` 加入你的 PATH                                                               |
| 無法掃描 WhatsApp QR Code  | 執行 `openclaw channels login` 時，請確認你登入的是虛擬機器，而不是主機                       |

## 相關文件

- [VPS 託管](/zh-TW/vps)
- [節點](/zh-TW/nodes)
- [遠端閘道](/zh-TW/gateway/remote)
- [iMessage 頻道](/zh-TW/channels/imessage)
- [Lume 快速入門](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume 命令列介面參考](https://cua.ai/docs/lume/reference/cli-reference)
- [無人值守虛擬機器設定](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（進階）
- [Docker 沙箱化](/zh-TW/install/docker)（替代隔離方式）
