---
read_when:
    - 設定或偵錯遠端 Mac 控制
summary: 用於控制遠端 OpenClaw 閘道的 macOS 應用程式流程
title: 遠端控制
x-i18n:
    generated_at: "2026-07-11T21:31:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

此流程可讓 macOS App 充當完整的遠端控制器，控制執行於其他主機（桌上型電腦／伺服器）上的 OpenClaw 閘道。App 可直接連線至受信任的 LAN／Tailnet 閘道 URL；若遠端閘道僅限 local loopback，則由 App 管理 SSH 通道。健康狀態檢查、語音喚醒轉送和網頁聊天都會重複使用 _Settings -> General_ 中相同的遠端設定。

## 模式

- **本機（這台 Mac）**：所有元件都在筆記型電腦上執行；不涉及 SSH。
- **透過 SSH 遠端連線（預設）**：OpenClaw 命令在遠端主機上執行。App 會使用 `-o BatchMode`、你選擇的身分／金鑰及本機連接埠轉送來建立 SSH 連線。
- **直接遠端連線（ws/wss）**：不使用 SSH 通道；App 直接連線至閘道 URL（LAN、Tailscale、Tailscale Serve 或公開的 HTTPS 反向代理）。

## 遠端傳輸方式

- **SSH 通道**（預設）：使用 `ssh -N -L ...` 將閘道連接埠轉送至 localhost。由於通道使用 local loopback，閘道會將節點的 IP 視為 `127.0.0.1`。
- **直接連線（ws/wss）**：直接連線至閘道 URL。閘道會看到真實的用戶端 IP。

App 會停用其自身 SSH 程序的 SSH 連線多工，以及驗證後的背景執行，讓它即使在所選別名啟用了 `ControlMaster` 或 `ForkAfterAuthentication` 時，也能監控並重新啟動確切的程序。

由於閘道憑證會透過此通道傳輸，因此預設會嚴格執行 SSH 主機金鑰驗證。若要選擇採用受管理 SSH 別名本身的信任行為，請透過 `openclaw-mac configure-remote` 設定 `--ssh-host-key-policy openssh`，或直接將 `gateway.remote.sshHostKeyPolicy` 設為 `"openssh"`。選擇採用前，請檢查該別名及任何相符的 `Host *` 或系統設定。變更 SSH 目標（在 App 中或透過 `configure-remote`）會將原則重設為 `strict`，除非你明確再次為新目標選擇採用。

在 SSH 通道模式下，探索到的 LAN／Tailnet 主機名稱會儲存為 `gateway.remote.sshTarget`。App 會將 `gateway.remote.url` 保持為本機通道端點（例如 `ws://127.0.0.1:18789`），讓命令列介面、網頁聊天及本機節點主機服務都使用相同的 local loopback 傳輸。當探索結果同時傳回原始 Tailnet IP 與穩定的主機名稱時，App 會優先使用 Tailscale MagicDNS 或 LAN 名稱，讓連線更能因應位址變更。若本機通道連接埠與遠端閘道連接埠不同，請將 `gateway.remote.remotePort` 設為遠端主機上的連接埠。

遠端模式中的瀏覽器自動化由命令列介面節點主機負責，而非原生 macOS App 節點。App 會盡可能啟動已安裝的節點主機服務；若要從該 Mac 啟用瀏覽器控制，請使用 `openclaw node install ...` 和 `openclaw node start` 安裝並啟動服務（或在前景執行 `openclaw node run ...`），再將目標設為具備瀏覽器功能的節點。

## 遠端主機的先決條件

1. 安裝節點 + pnpm，並建置／安裝 OpenClaw 命令列介面（`pnpm install && pnpm build && pnpm link --global`）。
2. 確保非互動式 shell 的 PATH 中包含 `openclaw`（如有需要，建立指向 `/usr/local/bin` 或 `/opt/homebrew/bin` 的符號連結）。
3. 使用 SSH 傳輸時：設定以金鑰為基礎的 SSH 驗證。建議使用 Tailscale IP，以便離開 LAN 後仍可穩定連線。

## macOS App 設定

若要透過 SSH 預先設定 App，而不使用歡迎流程：

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

或者，若閘道已可透過受信任的 LAN 或 Tailnet 存取，則可完全略過 SSH：

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

兩種形式都會寫入 `~/.openclaw/openclaw.json`、將初始設定標記為完成，並讓 App 在下次啟動時接管所選的傳輸方式。`--local-port`／`--remote-port` 預設為 `18789`。其他旗標：`--password`、`--identity <path>`、`--ssh-host-key-policy <strict|openssh>`、`--project-root <path>`、`--cli-path <path>`、`--json`。執行 `openclaw-mac configure-remote --help` 以查看完整參考資料。

若要改從使用者介面進行設定：

1. 開啟 _Settings -> General_。
2. 在 **OpenClaw runs** 下選擇 **Remote**，並設定：
   - **Transport**：**SSH tunnel** 或 **Direct (ws/wss)**。
   - **SSH target**：`user@host`（可選用 `:port`）。若閘道位於相同 LAN 並透過 Bonjour 發出公告，請從探索到的清單中選取，以自動填入此欄位。
   - **Gateway URL**（僅限 Direct）：`wss://gateway.example.ts.net`（本機／LAN 則使用 `ws://...`）。
   - **Identity file**（進階）：金鑰的路徑。
   - **Project root**（進階）：用於執行命令的遠端簽出路徑。
   - **CLI path**（進階）：可選的可執行 `openclaw` 進入點／二進位檔路徑（公告中提供時會自動填入）。
3. 按下 **Test remote**。成功表示遠端的 `openclaw status --json` 已正確執行。失敗通常表示 PATH／命令列介面有問題；結束碼 127 表示在遠端找不到命令列介面。
4. 健康狀態檢查和網頁聊天現在會自動透過所選傳輸方式執行。

## 網頁聊天

- **SSH 通道**：透過轉送的 WebSocket 控制連接埠（預設為 18789）連線至閘道。
- **直接連線（ws/wss）**：直接連線至已設定的閘道 URL。
- 沒有獨立的網頁聊天 HTTP 伺服器。

## 權限

- 遠端主機需要與本機相同的 TCC 核准項目（自動化、輔助使用、螢幕錄製、麥克風、語音辨識、通知）。請在該機器上執行一次初始設定以授予這些權限。
- 節點會透過 `node.list`／`node.describe` 公告其權限狀態，讓代理程式知道有哪些功能可用。

## 安全性注意事項

- 遠端主機應優先繫結至 local loopback，並透過 SSH、Tailscale Serve 或受信任的 Tailnet／LAN 直接 URL 連線。
- SSH 通道預設要求已受信任的主機金鑰。請先信任主機金鑰（將其新增至已設定的 known-hosts 檔案），或針對你接受其 OpenSSH 信任原則的受管理別名，明確設定 `gateway.remote.sshHostKeyPolicy: "openssh"`。
- 若將閘道繫結至非 local loopback 介面，必須要求有效的閘道驗證：權杖、密碼，或設定了 `gateway.auth.mode: "trusted-proxy"` 且可感知身分的反向代理。
- 請參閱[安全性](/zh-TW/gateway/security)和 [Tailscale](/zh-TW/gateway/tailscale)。

## WhatsApp 登入流程（遠端）

- **在遠端主機上**執行 `openclaw channels login --channel whatsapp --verbose`。使用手機上的 WhatsApp 掃描 QR Code。
- 若驗證過期，請在該主機上重新執行登入。健康狀態檢查會顯示連結問題。

## 疑難排解

| 症狀                                             | 原因／修正方式                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127`／找不到                               | 非登入殼層的 PATH 中沒有 `openclaw`。請將其加入 `/etc/paths`、殼層 rc 檔案，或建立符號連結至 `/usr/local/bin`／`/opt/homebrew/bin`。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 健康狀態探測失敗                                 | 檢查 SSH 是否可連線、PATH 是否正確，以及 Baileys（WhatsApp）是否已登入（`openclaw status --json`）。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 網頁聊天卡住                                     | 確認閘道正在遠端主機上執行，且轉送的連接埠與閘道的 WS 連接埠相符；使用者介面需要正常的 WS 連線。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 節點 IP 顯示 `127.0.0.1`                         | 使用 SSH 通道時，這是預期行為。若要讓閘道看到真實的用戶端 IP，請將**傳輸方式**切換為**直接連線（ws/wss）**。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 儀表板可用，但 Mac 功能離線                      | 操作員／控制連線正常，但配套節點連線尚未連線，或缺少其命令介面。開啟選單列的裝置區段，確認 Mac 是否顯示 `paired · disconnected`。對於 `wss://*.ts.net` Tailscale Serve 端點，應用程式會在憑證輪替後偵測過時的舊版 TLS 葉憑證指紋；當 macOS 信任新憑證後，應用程式會清除一次過時指紋並自動重試。若憑證不受系統信任，或主機不是 Tailscale Serve 名稱，請將 `gateway.remote.tlsFingerprint` 設為預期的憑證指紋、檢查憑證，或切換至**透過 SSH 遠端連線**。 |
| 語音喚醒                                         | 在遠端模式中，觸發詞會自動轉送，不需要另設轉送器。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

## 通知音效

使用 `openclaw nodes notify` 從指令稿中為每則通知選擇音效，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

應用程式中沒有全域預設音效開關；呼叫端會為每個要求選擇音效（或不使用音效）。

## 相關內容

- [macOS 應用程式](/zh-TW/platforms/macos)
- [遠端存取](/zh-TW/gateway/remote)
