---
read_when:
    - 您希望 OpenClaw 與主要的 macOS 環境隔離
    - 你想在沙盒中整合 iMessage
    - 你需要一個可重設且可複製的 macOS 環境
    - 你想比較本機與託管的 macOS VM 選項
summary: 當你需要隔離或 iMessage 時，在沙盒化的 macOS 虛擬機（本機或託管）中執行 OpenClaw
title: macOS 虛擬機器
x-i18n:
    generated_at: "2026-06-27T19:27:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## 建議預設選項（大多數使用者）

- **小型 Linux VPS**，用於常時運作的閘道且成本低。請參閱 [VPS 託管](/zh-TW/vps)。
- 如果你想要完整控制權，以及用於瀏覽器自動化的**住宅 IP**，請使用**專用硬體**（Mac mini 或 Linux 主機）。許多網站會封鎖資料中心 IP，因此本機瀏覽通常效果更好。
- **混合式：** 將閘道保留在便宜的 VPS 上，並在需要瀏覽器/UI 自動化時將你的 Mac 連接為**節點**。請參閱 [節點](/zh-TW/nodes) 和 [遠端閘道](/zh-TW/gateway/remote)。

當你明確需要 macOS 專屬能力（例如 iMessage），或想與日常使用的 Mac 嚴格隔離時，請使用 macOS VM。

## macOS VM 選項

### Apple Silicon Mac 上的本機 VM（Lume）

使用 [Lume](https://cua.ai/docs/lume)，在你現有的 Apple Silicon Mac 上於沙盒化 macOS VM 中執行 OpenClaw。

這會提供：

- 隔離的完整 macOS 環境（你的主機保持乾淨）
- 透過 `imsg` 支援 iMessage（預設本機路徑在 Linux/Windows 上不可行）
- 透過複製 VM 即時重設
- 不需要額外硬體或雲端成本

### 託管 Mac 供應商（雲端）

如果你想在雲端使用 macOS，也可以使用託管 Mac 供應商：

- [MacStadium](https://www.macstadium.com/)（託管 Mac）
- 其他託管 Mac 廠商也可使用；請依照其 VM + SSH 文件操作

取得 macOS VM 的 SSH 存取權後，請繼續下面的步驟 6。

---

## 快速路徑（Lume，熟練使用者）

1. 安裝 Lume
2. `lume create openclaw --os macos --ipsw latest`
3. 完成設定輔助程式，啟用遠端登入（SSH）
4. `lume run openclaw --no-display`
5. 透過 SSH 連入，安裝 OpenClaw，設定通道
6. 完成

---

## 你需要準備的項目（Lume）

- Apple Silicon Mac（M1/M2/M3/M4）
- 主機上執行 macOS Sequoia 或更新版本
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
下載時間可能較長，取決於你的連線速度。
</Note>

---

## 3) 完成設定輔助程式

在 VNC 視窗中：

1. 選取語言和地區
2. 跳過 Apple ID（如果你稍後想使用 iMessage，也可以登入）
3. 建立使用者帳戶（記住使用者名稱和密碼）
4. 跳過所有選用功能

設定完成後：

1. 啟用 SSH：開啟系統設定 -> 一般 -> 共享，並啟用「遠端登入」。
2. 若要以無顯示模式使用 VM，請啟用自動登入：開啟系統設定 -> 使用者與群組，選取「自動登入為：」，然後選擇 VM 使用者。

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

將 `youruser` 替換成你建立的帳戶，並將 IP 替換成你的 VM IP。

---

## 6) 安裝 OpenClaw

在 VM 內：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

依照入門提示設定你的模型供應商（Anthropic、OpenAI 等）。

---

## 7) 設定通道

編輯設定檔：

```bash
nano ~/.openclaw/openclaw.json
```

新增你的通道：

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

## 8) 以無顯示模式執行 VM

停止 VM，並在沒有顯示器的情況下重新啟動：

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM 會在背景執行。OpenClaw 的常駐程式會保持閘道運作。

檢查狀態：

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 加值：iMessage 整合

這是在 macOS 上執行的關鍵功能。使用搭配 `imsg` 的 [iMessage](/zh-TW/channels/imessage)，將「訊息」加入 OpenClaw。

在 VM 內：

1. 登入「訊息」。
2. 安裝 `imsg`。
3. 授予執行 OpenClaw/`imsg` 的程序完整磁碟存取權與自動化權限。
4. 使用 `imsg rpc --help` 驗證 RPC 支援。

新增到你的 OpenClaw 設定：

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

重新啟動閘道。現在你的代理可以傳送和接收 iMessage。

完整設定詳細資訊：[iMessage 通道](/zh-TW/channels/imessage)

---

## 儲存黃金映像

在進一步自訂之前，先快照乾淨狀態：

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

## 全天候執行

透過以下方式保持 VM 執行：

- 讓你的 Mac 接上電源
- 在系統設定 → 節能中停用睡眠
- 必要時使用 `caffeinate`

若要真正常時運作，請考慮使用專用 Mac mini 或小型 VPS。請參閱 [VPS 託管](/zh-TW/vps)。

---

## 疑難排解

| 問題                     | 解決方案                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------- |
| 無法透過 SSH 連入 VM     | 檢查 VM 系統設定中是否已啟用「遠端登入」                                            |
| VM IP 未顯示             | 等待 VM 完全開機，然後再次執行 `lume get openclaw`                                  |
| 找不到 Lume 命令         | 將 `~/.local/bin` 加入你的 PATH                                                     |
| WhatsApp QR 無法掃描     | 執行 `openclaw channels login` 時，確認你已登入 VM（不是主機）                      |

---

## 相關文件

- [VPS 託管](/zh-TW/vps)
- [節點](/zh-TW/nodes)
- [遠端閘道](/zh-TW/gateway/remote)
- [iMessage 通道](/zh-TW/channels/imessage)
- [Lume 快速入門](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume 命令列介面參考](https://cua.ai/docs/lume/reference/cli-reference)
- [無人值守 VM 設定](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（進階）
- [Docker 沙盒化](/zh-TW/install/docker)（替代隔離方式）
