---
read_when:
    - 更新 OpenClaw
    - 更新後發生問題
summary: 安全更新 OpenClaw（全域安裝或原始碼），以及回復策略
title: 更新中
x-i18n:
    generated_at: "2026-07-12T14:37:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

讓 OpenClaw 保持最新狀態。

若要更換 Docker、Podman 和 Kubernetes 映像，請參閱
[升級容器映像](/zh-TW/install/docker#upgrading-container-images)。閘道會在就緒前執行不影響啟動安全性的升級作業；如果掛載的狀態需要手動修復，則會結束。

## 建議使用：`openclaw update`

偵測你的安裝類型（npm 或 git）、取得最新版本、執行 `openclaw doctor`，並重新啟動閘道。

```bash
openclaw update
```

切換頻道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 預覽但不套用
```

`openclaw update` 沒有 `--verbose` 旗標（安裝程式有）。若要進行診斷，請使用
`--dry-run` 預覽預定動作、使用 `--json` 取得結構化結果，或使用
`openclaw update status --json` 檢查頻道與可用性狀態。

`--channel beta` 會優先使用 beta npm dist-tag，但如果 beta 標籤不存在，或其版本比最新的穩定版更舊，
則會退回 stable/latest。若只想執行一次套件更新並固定使用原始 npm
beta dist-tag，請改用 `--tag beta`。

`--channel extended-stable` 僅適用於套件，且安裝只能在前景執行。
OpenClaw 會讀取公開 npm `extended-stable` 選擇器、驗證所選的確切套件，
並安裝該確切版本。登錄資料缺漏或不一致時會採取封閉式失敗；絕不會退回 `latest`。
如果所選版本比已安裝版本更舊，仍會套用一般的降級確認。核心更新成功後，命令列介面會保留該頻道；
直接執行 `npm install -g openclaw@extended-stable` 不會更新 `update.channel`。
核心切換完成後，使用裸值／預設值或 `latest` 意圖的合格官方 npm 外掛，
會收斂至該確切核心版本。確切固定版本、明確的非 `latest` 標籤、第三方外掛及非 npm 來源都不會變更。
由目前 OpenClaw 版本建立的目錄安裝會保留該預設意圖。僅包含確切版本的舊記錄會繼續固定，
因為 OpenClaw 無法安全區分舊的自動固定與使用者固定；請在 extended-stable 頻道上執行一次
`openclaw plugins update @openclaw/name`，讓該外掛重新採用確切核心版本追蹤。

`--channel dev` 會提供持續移動的 GitHub `main` 簽出。若要執行一次性套件更新，
`--tag main` 會對應至 `github:openclaw/openclaw#main` 套件規格，並透過目標套件管理員（npm/pnpm/bun）直接安裝。

對於受管理的外掛，缺少 beta 版本只會產生警告，而非失敗：核心更新仍可成功，
而外掛會退回其記錄的預設／latest 版本。

頻道語意請參閱[發行頻道](/zh-TW/install/development-channels)。

## 在 npm 與 git 安裝之間切換

使用頻道變更安裝類型。更新程式會保留 `~/.openclaw` 中的狀態、設定、
認證資訊與工作區；它只會變更命令列介面與閘道使用的 OpenClaw 程式碼安裝。

```bash
# npm 套件安裝 -> 可編輯的 git 簽出
openclaw update --channel dev

# git 簽出 -> npm 套件安裝
openclaw update --channel stable
```

先預覽安裝模式切換：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 會確保存在 git 簽出、建置該簽出，並從該簽出安裝全域命令列介面。
`stable`、`extended-stable` 和 `beta` 頻道使用套件安裝。
若目前是 git 簽出，extended-stable 會遭拒絕，且不會修改或轉換該簽出。
如果閘道已安裝，除非你傳入 `--no-restart`，否則 `openclaw update` 會重新整理服務中繼資料並重新啟動服務。

對於具有受管理閘道服務的套件安裝，`openclaw update` 會以該服務使用的套件根目錄為目標。
如果 shell 的 `openclaw` 命令來自不同安裝，更新程式會印出兩個根目錄以及受管理服務的節點路徑，
並在替換套件前，依目標版本的 `engines.node` 要求檢查該節點版本。

## 替代方式：重新執行安裝程式

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

加入 `--no-onboard` 可略過初始設定。若要強制使用特定安裝類型，請傳入
`--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 套件安裝階段後失敗，請改為重新執行安裝程式。
它不會呼叫更新程式；而是直接執行全域套件安裝，並可復原部分更新的 npm 安裝。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

使用 `--version` 將復原固定至特定版本或 dist-tag：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方式：手動使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

對於受監管的安裝，建議使用 `openclaw update`：它可以協調套件切換與執行中的閘道服務。
如果你在受監管的安裝上手動更新，請先停止受管理的閘道。套件管理員會原地替換檔案，
否則執行中的閘道可能會在切換過程中嘗試載入核心或外掛檔案。套件管理員完成後，請重新啟動閘道，
使其載入新的安裝。

對於由 root 擁有的 Linux 系統全域安裝，如果 `openclaw update` 因 `EACCES` 失敗，
請使用系統 npm 復原，並在手動替換期間保持閘道停止。請使用你平常為該閘道使用的相同設定檔旗標／環境。
將 `/usr/bin/npm` 替換為主機上擁有 root 全域前綴的系統 npm：

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

然後驗證：

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

當 `openclaw update` 管理全域 npm 安裝時，會先將目標安裝到暫時的 npm 前綴，
驗證封裝的 `dist` 清單，然後將乾淨的套件樹切換至實際的全域前綴，以避免 npm
將新套件覆疊到舊套件的陳舊檔案上。如果安裝命令失敗，OpenClaw 會使用 `--omit=optional` 重試一次，
這有助於原生選用相依套件無法編譯的主機。

由 OpenClaw 管理的 npm 更新與外掛更新命令，也會為子 npm 程序清除 npm 的
`min-release-age` 供應鏈隔離設定（或較舊的 `before` 設定鍵）。
該政策用於一般性保護，但明確的 OpenClaw 更新表示「立即安裝所選版本」。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 進階 npm 安裝主題

<AccordionGroup>
  <Accordion title="唯讀套件樹">
    OpenClaw 在執行階段會將封裝的全域安裝視為唯讀，即使目前使用者可寫入全域套件目錄也一樣。外掛套件安裝位於使用者設定目錄下由 OpenClaw 擁有的 npm/git 根目錄中，而閘道啟動不會修改 OpenClaw 套件樹。

    某些 Linux npm 設定會將全域套件安裝在由 root 擁有的目錄下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支援這種配置，因為外掛安裝／更新命令會寫入該全域套件目錄之外的位置。

  </Accordion>
  <Accordion title="強化的 systemd 單元">
    授予 OpenClaw 對其設定／狀態根目錄的寫入權限，使明確的外掛安裝、外掛更新與 doctor 清理作業能保留其變更：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="磁碟空間預檢">
    在套件更新與明確的外掛安裝前，OpenClaw 會盡力檢查目標磁碟區的磁碟空間。空間不足時會產生包含受檢路徑的警告，但不會阻止更新，因為檔案系統配額、快照與網路磁碟區可能在檢查後發生變化。實際的套件管理員安裝與安裝後驗證仍是最終依據。
  </Accordion>
</AccordionGroup>

## 自動更新程式

預設為關閉。請在 `~/.openclaw/openclaw.json` 中啟用：

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| 頻道              | 行為                                                                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | 等待 `stableDelayHours`（預設：6），然後在 `stableJitterHours`（預設：12）的範圍內套用確定性的隨機延遲，以分散推出。 |
| `extended-stable` | 啟用 `checkOnStart` 時，會在啟動時及每 24 小時檢查唯讀更新提示。絕不會自動套用。                                    |
| `beta`            | 每隔 `betaCheckIntervalHours`（預設：1）檢查一次並立即套用。                                                           |
| `dev`             | 不會自動套用。請手動使用 `openclaw update`。                                                                          |

閘道也會在啟動時記錄更新提示（可使用 `update.checkOnStart: false` 停用）。
已儲存的 extended-stable 選擇會使用此唯讀提示路徑與現有的 24 小時提示間隔，
但絕不會叫用自動安裝、移交、重新啟動、stable 延遲／隨機延遲或 beta 輪詢。
若要降級或從事件中復原，請在閘道環境中設定 `OPENCLAW_NO_AUTO_UPDATE=1`，
即使已設定 `update.auto.enabled`，也會阻止自動套用。除非也停用 `update.checkOnStart`，
否則啟動時的更新提示仍可執行。

透過即時閘道控制平面（`update.run`）要求的套件管理員更新，
不會在執行中的閘道程序內替換套件樹。在受管理的服務安裝中，閘道會啟動分離的移交程序後結束，
並讓一般的 `openclaw update --yes --json` 命令列介面路徑停止服務、替換套件、
重新整理服務中繼資料、重新啟動、驗證閘道版本與連線能力，並在可能的情況下復原已安裝但未載入的 macOS
LaunchAgent。如果閘道無法安全地進行該移交，`update.run` 會回報安全的 shell 命令，
而不會在程序內執行套件管理員。

控制介面側邊欄的更新卡片會啟動相同的 `update.run` 流程。在已簽署的 macOS 應用程式中，
該卡片會先透過 Sparkle 更新應用程式；重新啟動後，應用程式會將其受管理的本機閘道更新至相符版本。

## 更新後

<Steps>

### 執行 doctor

```bash
openclaw doctor
```

移轉設定、稽核私訊政策，並檢查閘道健康狀態。詳細資訊：[Doctor](/zh-TW/gateway/doctor)

### 重新啟動閘道

```bash
openclaw gateway restart
```

### 驗證

```bash
openclaw health
```

</Steps>

## 復原

### 固定版本（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` 會顯示目前已發布的版本。
</Tip>

### 固定提交（原始碼）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

若要返回最新版本：`git checkout main && git pull`。

## 如果你遇到困難

- 再次執行 `openclaw doctor`，並仔細閱讀輸出。
- 在原始碼簽出上執行 `openclaw update --channel dev` 時，更新程式會在需要時自動啟動 `pnpm`。如果你看到 pnpm/corepack 啟動錯誤，請手動安裝 `pnpm`（或重新啟用 `corepack`），然後重新執行更新。
- 查看：[疑難排解](/zh-TW/gateway/troubleshooting)
- 在 Discord 提問：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相關內容

- [安裝總覽](/zh-TW/install)：所有安裝方式。
- [診斷工具](/zh-TW/gateway/doctor)：更新後的健康狀態檢查。
- [遷移](/zh-TW/install/migrating)：主要版本遷移指南。
