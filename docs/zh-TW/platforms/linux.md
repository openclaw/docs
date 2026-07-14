---
read_when:
    - 尋找 Linux 伴隨應用程式狀態
    - 在 Linux 節點主機上啟用相機、位置資訊或通知
    - 規劃平台涵蓋範圍或貢獻
    - 偵錯 VPS 或容器上的 Linux OOM 終止或結束碼 137
summary: Linux 支援與配套應用程式狀態
title: Linux 應用程式
x-i18n:
    generated_at: "2026-07-14T13:54:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: a6759199ddb7f7fe0387e62c3b7ccdf7a33326b9539f531348ea938a7610b6b1
    source_path: platforms/linux.md
    workflow: 16
---

閘道在 Linux 上受到完整支援，且需要節點。Bun 仍可用作相依套件安裝程式或套件指令碼執行器，但無法執行 OpenClaw，因為它不提供 `node:sqlite`。

## 桌面輔助程式

OpenClaw Linux 輔助程式是供本機閘道使用的 Tauri 桌面應用程式。它會：

- 在缺少 OpenClaw 命令列介面和受管理的節點執行階段時進行安裝
- 在嘗試變更服務前連接至運作正常的閘道
- 將安裝、啟動、停止和重新啟動作業委派給命令列介面管理的 systemd 使用者服務
- 使用解析出的驗證 URL 開啟由閘道提供的控制介面
- 視窗關閉後仍可從系統匣使用

從 `main` 建置的穩定版本會在該標記的 [GitHub 發行版本](https://github.com/openclaw/openclaw/releases)中，將 `.deb` 和 AppImage 套件組合作為資產發布，名稱為 `OpenClaw-<version>-amd64.deb` 和 `OpenClaw-<version>-amd64.AppImage`，旁邊並附有 `SHA256SUMS.linux-app.txt` 總和檢查碼檔案。下載 `.deb` 並使用 `sudo apt install ./OpenClaw-<version>-amd64.deb` 安裝，或將 AppImage 標記為可執行並直接執行。AppImage 執行階段需要 FUSE 2（`sudo apt install libfuse2`，Ubuntu 24.04+ 則為 `libfuse2t64`）；若沒有，請使用 `APPIMAGE_EXTRACT_AND_RUN=1` 執行 AppImage。

你也可以從原始碼簽出建置相同的套件組合：

```bash
cd apps/linux/src-tauri
pnpm dlx @tauri-apps/cli@2.11.4 build --bundles deb,appimage
```

`Linux App` CI 工作流程會針對涉及此應用程式的提取要求和手動執行，將相同的套件組合上傳為 `openclaw-linux-companion` 成品。Linux 建置相依套件和開發命令請參閱儲存庫中的 `apps/linux/README.md`。

## 命令列介面與 SSH 替代方案

對於無頭伺服器、VPS 或遠端閘道，命令列介面仍是最簡單的選項：

1. 安裝節點 24.15+（建議）、節點 22.22.3+（LTS）或節點 25.9+。
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 從你的筆記型電腦：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 開啟 `http://127.0.0.1:18789/`，並使用設定的共用密鑰進行驗證（預設為權杖；若 `gateway.auth.mode` 為 `"password"`，則使用密碼）。

完整伺服器指南：[Linux 伺服器](/zh-TW/vps)。逐步 VPS 範例：[exe.dev](/zh-TW/install/exe-dev)。

## 節點功能

隨附的 Linux 節點外掛讓命令列介面無須桌面應用程式即可取得 `openclaw node` 服務裝置功能。只有在功能已啟用且所需的本機工具存在時，命令才會公告給閘道。

| 功能                                      | 預設 | 需求                                                                  |
| ----------------------------------------- | ---- | --------------------------------------------------------------------- |
| 桌面通知（`system.notify`）            | 開啟 | libnotify 的 `notify-send` 和桌面通知工作階段                    |
| 相機相片和短片（`camera.*`）      | 關閉 | FFmpeg、V4L2 相機存取權，以及供短片音訊使用的 PulseAudio 或 PipeWire |
| 位置（`location.get`）                | 關閉 | GeoClue2 及其 `where-am-i` 示範程式                             |

在 `openclaw.json` 中設定外掛：

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          notify: { enabled: true },
          camera: { enabled: true },
          location: { enabled: true },
        },
      },
    },
  },
}
```

變更這些設定後，請重新啟動節點服務。可用性會在每個程序中判定一次，並在重新啟動時重建節點公告。

閘道會將節點的命令與功能介面和裝置配對分開核准。第一次啟動或啟用更多功能後，請核准待處理的介面：

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

節點可以保持連線且已完成裝置配對，但其有效的 `caps` 和 `commands` 在此核准完成前仍可能為空。

相機裝置必須可由服務使用者讀取，通常透過 `video` 群組取得權限。當 `includeAudio` 為 true 時，相機短片會使用預設的 PulseAudio 或 PipeWire 來源；麥克風音訊只會作為該短片的音軌存在，不會成為獨立命令。位置功能要求節點服務使用者獲得主機 GeoClue 原則的許可。

`camera.snap` 和 `camera.clip` 也需要透過 `gateway.nodes.allowCommands` 由閘道明確啟用。承載內容、限制和錯誤請參閱[相機擷取](/zh-TW/nodes/camera)和[位置命令](/zh-TW/nodes/location-command)。

## 安裝

- [開始使用](/zh-TW/start/getting-started)
- [安裝與更新](/zh-TW/install/updating)
- 選用：[Bun 套件工作流程](/zh-TW/install/bun)、[Nix](/zh-TW/install/nix)、[Docker](/zh-TW/install/docker)

## 閘道服務（systemd）

使用下列其中一種方式安裝：

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # select "Gateway service" when prompted
```

修復或遷移現有安裝：

```bash
openclaw doctor
```

`openclaw gateway install` 預設會產生 systemd **使用者**單元。完整的服務指南（包括適用於共用或持續運作主機的**系統**層級單元變體）請參閱[閘道操作手冊](/zh-TW/gateway#supervision-and-service-lifecycle)。

只有自訂設定才應手動撰寫單元。最小使用者單元範例（`~/.config/systemd/user/openclaw-gateway[-<profile>].service`）：

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

啟用它：

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 記憶體壓力與 OOM 終止

在 Linux 上，當主機、VM 或容器 cgroup 的記憶體耗盡時，核心會選擇一個 OOM 犧牲程序。閘道不適合作為犧牲程序，因為它擁有長期工作階段和頻道連線，因此 OpenClaw 會盡可能讓暫時性的子程序優先被終止。

對於符合條件的 Linux 子程序生成，OpenClaw 會在命令外包覆一個簡短的 `/bin/sh` 墊片，將子程序本身的 `oom_score_adj` 提高至 `1000`，然後對實際命令執行 `exec`。這不需要特殊權限：程序永遠可以提高自己的 OOM 分數。

涵蓋的子程序介面：

- 由監督程式管理的命令子程序
- PTY shell 子程序
- MCP stdio 伺服器子程序
- 由 OpenClaw 啟動的瀏覽器/Chrome 程序（透過外掛 SDK 程序執行階段）

此包裝程式僅適用於 Linux；若 `/bin/sh` 無法使用，或子程序環境將 `OPENCLAW_CHILD_OOM_SCORE_ADJ` 設為 `0`、`false`、`no` 或 `off`，則會略過。

驗證子程序：

```bash
cat /proc/<child-pid>/oom_score_adj
```

涵蓋的子程序預期值為 `1000`；閘道程序本身會保留其正常分數（通常為 `0`）。

systemd 單元的 `OOMPolicy=continue` 會在 OOM 終止程式選中暫時性子程序時，讓閘道服務保持運作，而不是將整個單元標記為失敗並重新啟動所有頻道；失敗的子程序/工作階段會回報自己的錯誤。

這無法取代正常的記憶體調校。若 VPS 或容器反覆終止子程序，請提高記憶體限制、降低並行程度，或加入更強的資源控制（systemd `MemoryMax=`、容器記憶體限制）。

## 相關內容

- [安裝概觀](/zh-TW/install)
- [Linux 伺服器](/zh-TW/vps)
- [Raspberry Pi](/zh-TW/install/raspberry-pi)
- [閘道操作手冊](/zh-TW/gateway)
- [閘道設定](/zh-TW/gateway/configuration)
