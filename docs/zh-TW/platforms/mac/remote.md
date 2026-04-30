---
read_when:
    - 設定或偵錯遠端 Mac 控制
summary: 透過 SSH 控制遠端 OpenClaw Gateway 的 macOS app 流程
title: 遠端控制
x-i18n:
    generated_at: "2026-04-30T03:20:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 16
---

# 遠端 OpenClaw (macOS ⇄ 遠端主機)

此流程讓 macOS 應用程式可作為完整遠端控制器，控制在另一台主機（桌機/伺服器）上執行的 OpenClaw Gateway。這是應用程式的 **Remote over SSH**（遠端執行）功能。所有功能，包括健康檢查、Voice Wake 轉送和 Web Chat，都會重用來自 _Settings → General_ 的相同遠端 SSH 設定。

## 模式

- **本機（這台 Mac）**：所有內容都在筆電上執行。不涉及 SSH。
- **Remote over SSH（預設）**：OpenClaw 命令會在遠端主機上執行。Mac 應用程式會使用 `-o BatchMode` 加上你選擇的身分/金鑰和本機連接埠轉送來開啟 SSH 連線。
- **遠端直接連線 (ws/wss)**：沒有 SSH 通道。Mac 應用程式會直接連線到 Gateway URL（例如透過 Tailscale Serve 或公開 HTTPS 反向 Proxy）。

## 遠端傳輸

遠端模式支援兩種傳輸：

- **SSH 通道**（預設）：使用 `ssh -N -L ...` 將 Gateway 連接埠轉送到 localhost。Gateway 會將 Node 的 IP 視為 `127.0.0.1`，因為通道是回送。
- **直接連線 (ws/wss)**：直接連線到 Gateway URL。Gateway 會看到實際的用戶端 IP。

在 SSH 通道模式中，探索到的 LAN/tailnet 主機名稱會儲存為
`gateway.remote.sshTarget`。應用程式會將 `gateway.remote.url` 保持在本機
通道端點，例如 `ws://127.0.0.1:18789`，因此 CLI、Web Chat 和
本機 Node 主機服務都會使用相同的安全回送傳輸。

遠端模式中的瀏覽器自動化由 CLI Node 主機擁有，而不是由
原生 macOS 應用程式 Node 擁有。應用程式會在可能時啟動已安裝的 Node 主機服務；
如果你需要從那台 Mac 控制瀏覽器，請使用 `openclaw node install ...` 和
`openclaw node start` 安裝/啟動它（或在前景執行
`openclaw node run ...`），然後指定那個具備瀏覽器能力的
Node。

## 遠端主機上的先決條件

1. 安裝 Node + pnpm，並建置/安裝 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 確保 `openclaw` 位於非互動式 Shell 的 PATH 中（必要時符號連結到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 使用金鑰驗證開啟 SSH。我們建議使用 **Tailscale** IP，以便在 LAN 外保持穩定連線能力。

## macOS 應用程式設定

1. 開啟 _Settings → General_。
2. 在 **OpenClaw runs** 下，選擇 **Remote over SSH** 並設定：
   - **傳輸**：**SSH 通道** 或 **直接連線 (ws/wss)**。
   - **SSH 目標**：`user@host`（可選 `:port`）。
     - 如果 Gateway 位於相同 LAN 並公告 Bonjour，請從探索清單中選取，以自動填入此欄位。
   - **Gateway URL**（僅限直接連線）：`wss://gateway.example.ts.net`（或本機/LAN 使用 `ws://...`）。
   - **身分檔案**（進階）：你的金鑰路徑。
   - **專案根目錄**（進階）：用於命令的遠端 checkout 路徑。
   - **CLI 路徑**（進階）：可選的可執行 `openclaw` 進入點/二進位檔路徑（公告時會自動填入）。
3. 按下 **測試遠端**。成功表示遠端 `openclaw status --json` 可正確執行。失敗通常表示 PATH/CLI 問題；結束碼 127 表示遠端找不到 CLI。
4. 健康檢查和 Web Chat 現在會自動透過此 SSH 通道執行。

## Web Chat

- **SSH 通道**：Web Chat 會透過轉送的 WebSocket 控制連接埠（預設 18789）連線到 Gateway。
- **直接連線 (ws/wss)**：Web Chat 會直接連線到已設定的 Gateway URL。
- 不再有獨立的 WebChat HTTP 伺服器。

## 權限

- 遠端主機需要與本機相同的 TCC 核准（自動化、輔助使用、螢幕錄製、麥克風、語音辨識、通知）。在該機器上執行上線流程，以一次授予這些權限。
- Node 會透過 `node.list` / `node.describe` 公告其權限狀態，讓代理知道哪些能力可用。

## 安全性注意事項

- 建議在遠端主機上使用回送繫結，並透過 SSH 或 Tailscale 連線。
- SSH 通道會使用嚴格的主機金鑰檢查；請先信任主機金鑰，讓它存在於 `~/.ssh/known_hosts`。
- 如果你將 Gateway 繫結到非回送介面，請要求有效的 Gateway 驗證：權杖、密碼，或搭配 `gateway.auth.mode: "trusted-proxy"` 的身分感知反向 Proxy。
- 請參閱 [安全性](/zh-TW/gateway/security) 和 [Tailscale](/zh-TW/gateway/tailscale)。

## WhatsApp 登入流程（遠端）

- **在遠端主機上**執行 `openclaw channels login --verbose`。使用你手機上的 WhatsApp 掃描 QR。
- 如果驗證過期，請在該主機上重新執行登入。健康檢查會顯示連結問題。

## 疑難排解

- **結束碼 127 / 找不到**：`openclaw` 不在非登入 Shell 的 PATH 中。將它新增到 `/etc/paths`、你的 Shell rc，或符號連結到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **健康探測失敗**：檢查 SSH 可連線性、PATH，以及 Baileys 是否已登入（`openclaw status --json`）。
- **Web Chat 卡住**：確認 Gateway 正在遠端主機上執行，且轉送連接埠符合 Gateway WS 連接埠；UI 需要健康的 WS 連線。
- **Node IP 顯示 127.0.0.1**：使用 SSH 通道時這是預期行為。如果你希望 Gateway 看到實際用戶端 IP，請將 **傳輸** 切換為 **直接連線 (ws/wss)**。
- **Voice Wake**：在遠端模式中，觸發短語會自動轉送；不需要獨立轉送器。

## 通知音效

使用含 `openclaw` 和 `node.invoke` 的指令碼，為每則通知選擇音效，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

應用程式中不再有全域「預設音效」切換；呼叫端會為每次請求選擇音效（或不選）。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [遠端存取](/zh-TW/gateway/remote)
