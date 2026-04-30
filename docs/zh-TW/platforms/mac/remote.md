---
read_when:
    - 設定或偵錯遠端 Mac 控制
summary: 透過 SSH 控制遠端 OpenClaw Gateway 的 macOS 應用程式流程
title: 遠端控制
x-i18n:
    generated_at: "2026-04-30T16:28:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# 遠端 OpenClaw (macOS ⇄ 遠端主機)

此流程可讓 macOS 應用程式作為完整遙控器，控制在另一部主機（桌上型電腦／伺服器）上執行的 OpenClaw Gateway。這是應用程式的 **透過 SSH 遠端**（遠端執行）功能。所有功能，包括健康狀態檢查、語音喚醒轉送和網頁聊天，都會重用 _設定 → 一般_ 中相同的遠端 SSH 設定。

## 模式

- **本機（這台 Mac）**：所有項目都在筆電上執行。不涉及 SSH。
- **透過 SSH 遠端（預設）**：OpenClaw 指令會在遠端主機上執行。Mac 應用程式會使用 `-o BatchMode`、你選擇的身分／金鑰，以及本機連接埠轉送來開啟 SSH 連線。
- **遠端直接連線 (ws/wss)**：不使用 SSH 通道。Mac 應用程式會直接連線到 Gateway URL（例如透過 Tailscale Serve 或公開 HTTPS 反向代理）。

## 遠端傳輸

遠端模式支援兩種傳輸方式：

- **SSH 通道**（預設）：使用 `ssh -N -L ...` 將 Gateway 連接埠轉送到 localhost。Gateway 會看到節點的 IP 是 `127.0.0.1`，因為通道是 loopback。
- **直接連線 (ws/wss)**：直接連線到 Gateway URL。Gateway 會看到實際的用戶端 IP。

在 SSH 通道模式中，探索到的 LAN／tailnet 主機名稱會儲存為
`gateway.remote.sshTarget`。應用程式會將 `gateway.remote.url` 保持在本機
通道端點上，例如 `ws://127.0.0.1:18789`，因此 CLI、網頁聊天和
本機節點主機服務都會使用相同的安全 loopback 傳輸。

遠端模式中的瀏覽器自動化由 CLI 節點主機負責，而不是由
原生 macOS 應用程式節點負責。應用程式會盡可能啟動已安裝的節點主機服務；如果你需要從該 Mac 控制瀏覽器，請使用
`openclaw node install ...` 和 `openclaw node start` 安裝／啟動它（或在前景執行
`openclaw node run ...`），然後將目標指向具備瀏覽器能力的
節點。

## 遠端主機的先決條件

1. 安裝 Node + pnpm，並建置／安裝 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 確保 `openclaw` 位於非互動式 shell 的 PATH 中（如有需要，符號連結到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 使用金鑰驗證開啟 SSH。我們建議使用 **Tailscale** IP，以便在離開 LAN 後仍能穩定連線。

## macOS 應用程式設定

1. 開啟 _設定 → 一般_。
2. 在 **OpenClaw 執行位置** 下，選擇 **透過 SSH 遠端**，並設定：
   - **傳輸**：**SSH 通道** 或 **直接連線 (ws/wss)**。
   - **SSH 目標**：`user@host`（可選 `:port`）。
     - 如果 Gateway 位於相同 LAN 並公告 Bonjour，請從探索清單中選擇它，以自動填入此欄位。
   - **Gateway URL**（僅直接連線）：`wss://gateway.example.ts.net`（或用於本機／LAN 的 `ws://...`）。
   - **身分檔案**（進階）：你的金鑰路徑。
   - **專案根目錄**（進階）：用於指令的遠端 checkout 路徑。
   - **CLI 路徑**（進階）：可執行 `openclaw` 進入點／二進位檔的選用路徑（在公告時自動填入）。
3. 點選 **測試遠端**。成功代表遠端 `openclaw status --json` 正確執行。失敗通常表示 PATH／CLI 問題；結束碼 127 表示在遠端找不到 CLI。
4. 健康狀態檢查和網頁聊天現在會自動透過此 SSH 通道執行。

## 網頁聊天

- **SSH 通道**：網頁聊天會透過轉送的 WebSocket 控制連接埠（預設 18789）連線到 Gateway。
- **直接連線 (ws/wss)**：網頁聊天會直接連線到已設定的 Gateway URL。
- 不再有獨立的 WebChat HTTP 伺服器。

## 權限

- 遠端主機需要與本機相同的 TCC 核准（自動化、輔助使用、螢幕錄製、麥克風、語音辨識、通知）。在該機器上執行 onboarding，以一次授予這些權限。
- 節點會透過 `node.list` / `node.describe` 公告其權限狀態，讓代理知道有哪些可用項目。

## 安全性注意事項

- 優先在遠端主機上使用 loopback 綁定，並透過 SSH 或 Tailscale 連線。
- SSH 通道使用嚴格的主機金鑰檢查；請先信任主機金鑰，使其存在於 `~/.ssh/known_hosts`。
- 如果你將 Gateway 綁定到非 loopback 介面，請要求有效的 Gateway 驗證：token、密碼，或使用 `gateway.auth.mode: "trusted-proxy"` 的具身分感知能力反向代理。
- 請參閱[安全性](/zh-TW/gateway/security)和 [Tailscale](/zh-TW/gateway/tailscale)。

## WhatsApp 登入流程（遠端）

- **在遠端主機上**執行 `openclaw channels login --verbose`。使用手機上的 WhatsApp 掃描 QR。
- 如果驗證過期，請在該主機上重新執行登入。健康狀態檢查會顯示連結問題。

## 疑難排解

- **exit 127 / 找不到**：`openclaw` 不在非登入 shell 的 PATH 中。將它加入 `/etc/paths`、你的 shell rc，或符號連結到 `/usr/local/bin`／`/opt/homebrew/bin`。
- **健康狀態探測失敗**：檢查 SSH 可達性、PATH，以及 Baileys 是否已登入（`openclaw status --json`）。
- **網頁聊天卡住**：確認 Gateway 正在遠端主機上執行，且轉送連接埠與 Gateway WS 連接埠相符；UI 需要健康的 WS 連線。
- **節點 IP 顯示 127.0.0.1**：使用 SSH 通道時這是預期行為。如果你希望 Gateway 看到實際的用戶端 IP，請將 **傳輸** 切換為 **直接連線 (ws/wss)**。
- **儀表板可運作但 Mac 能力離線**：這表示應用程式的操作者／控制連線正常，但 companion 節點連線未連接，或缺少其指令介面。開啟選單列裝置區段，檢查 Mac 是否為 `paired · disconnected`。對於 `wss://*.ts.net` Tailscale Serve 端點，應用程式會在憑證輪替後偵測過期的舊版 TLS leaf pin，於 macOS 信任新憑證時清除過期 pin，並自動重試。如果憑證不是系統信任，或主機不是 Tailscale Serve 名稱，請檢查憑證或切換到 **透過 SSH 遠端**。
- **語音喚醒**：在遠端模式中，觸發片語會自動轉送；不需要獨立的轉送器。

## 通知音效

使用含 `openclaw` 和 `node.invoke` 的指令碼，為每個通知選擇音效，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

應用程式中不再有全域「預設音效」切換；呼叫端會針對每個請求選擇音效（或不選）。

## 相關

- [macOS 應用程式](/zh-TW/platforms/macos)
- [遠端存取](/zh-TW/gateway/remote)
