---
read_when:
    - 更新 OpenClaw
    - 更新後發生問題
summary: 安全更新 OpenClaw（全域安裝或原始碼），以及復原策略
title: 更新中
x-i18n:
    generated_at: "2026-07-11T21:28:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06b475fcd715afa5f4b9fa3fc7d546ba8dc53805c6a29e12fd4706dceb04cb60
    source_path: install/updating.md
    workflow: 16
---

讓 OpenClaw 保持在最新版本。

如需更換 Docker、Podman 與 Kubernetes 映像，請參閱
[升級容器映像](/zh-TW/install/docker#upgrading-container-images)。閘道會在進入就緒狀態前執行可安全啟動的升級作業；若掛載的狀態需要手動修復，則會退出。

## 建議方式：`openclaw update`

偵測安裝類型（npm 或 git）、取得最新版本、執行 `openclaw doctor`，並重新啟動閘道。

```bash
openclaw update
```

切換頻道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # 預覽而不套用
```

`openclaw update` 沒有 `--verbose` 旗標（安裝程式有）。如需診斷，請使用
`--dry-run` 預覽規劃的動作、使用 `--json` 取得結構化結果，或使用
`openclaw update status --json` 檢查頻道與可用性狀態。

`--channel beta` 會優先使用 beta npm dist-tag，但若 beta 標籤不存在，或其版本比最新穩定版更舊，則會回退至 stable/latest。
如需一次性套件更新並固定使用原始 npm beta dist-tag，請改用 `--tag beta`。

`--channel extended-stable` 僅適用於套件安裝，且安裝仍只能在前景執行。
OpenClaw 會讀取公開 npm `extended-stable` 選擇器、驗證所選的確切套件，並安裝該確切版本。若登錄資料缺失或不一致，作業會以失敗關閉；絕不回退至 `latest`。
如果所選版本比已安裝版本更舊，仍會套用一般的降級確認。命令列介面會在核心更新成功後保存頻道；直接執行 `npm install -g openclaw@extended-stable` 不會更新 `update.channel`。
核心替換後，採用未指定／預設或 `latest` 意圖的合格官方 npm 外掛，會統一至該確切核心版本。明確固定的版本與明確指定的非 `latest` 標籤、第三方外掛及非 npm 來源都維持不變。
由目前 OpenClaw 版本建立的目錄安裝會保留該預設意圖。僅包含確切版本的舊記錄會維持固定，因為 OpenClaw 無法安全區分舊的自動固定與使用者固定；請在 extended-stable 頻道上執行一次 `openclaw plugins update @openclaw/name`，讓該外掛重新加入核心確切版本追蹤。

`--channel dev` 會提供持續跟隨變動的 GitHub `main` 簽出。如需一次性套件更新，`--tag main` 會對應至 `github:openclaw/openclaw#main` 套件規格，並透過目標套件管理器（npm/pnpm/bun）直接安裝。

對於受管理的外掛，缺少 beta 發行版只會產生警告，而不會導致失敗：核心更新仍可成功，外掛則會回退至其記錄的預設/latest 發行版。

如需瞭解頻道語意，請參閱[發行頻道](/zh-TW/install/development-channels)。

## 在 npm 與 git 安裝之間切換

使用頻道變更安裝類型。更新程式會保留 `~/.openclaw` 中的狀態、設定、憑證與工作區；它只會變更命令列介面和閘道所使用的 OpenClaw 程式碼安裝。

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

`dev` 會確保存在 git 簽出、建置該簽出，並從中安裝全域命令列介面。`stable`、`extended-stable` 與 `beta` 頻道使用套件安裝。
在 git 簽出上使用 extended-stable 會遭到拒絕，且不會修改或轉換該簽出。如果已安裝閘道，除非傳入 `--no-restart`，否則 `openclaw update` 會重新整理服務中繼資料並重新啟動服務。

對於具有受管理閘道服務的套件安裝，`openclaw update` 會以該服務所使用的套件根目錄為目標。如果殼層中的 `openclaw` 命令來自不同的安裝，更新程式會列印兩個根目錄及受管理服務的節點路徑，並在替換套件前，依照目標發行版的 `engines.node` 要求檢查該節點版本。

## 替代方式：重新執行安裝程式

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

加入 `--no-onboard` 可略過初始設定。若要強制指定安裝類型，請傳入 `--install-method git --no-onboard` 或 `--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 套件安裝階段後失敗，請改為重新執行安裝程式。它不會呼叫更新程式，而會直接執行全域套件安裝，因此可復原只完成部分更新的 npm 安裝。

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

對於受監管的安裝，建議使用 `openclaw update`：它可以協調套件替換與正在執行的閘道服務。如果要手動更新受監管的安裝，請先停止受管理的閘道。套件管理器會就地替換檔案，否則執行中的閘道可能會在替換途中嘗試載入核心或外掛檔案。套件管理器完成後，請重新啟動閘道，使其載入新的安裝。

對於由 root 擁有的 Linux 系統全域安裝，如果 `openclaw update` 因 `EACCES` 失敗，請在手動替換期間保持閘道停止，並使用系統 npm 復原。請使用平常為該閘道採用的相同設定檔旗標／環境。請將 `/usr/bin/npm` 替換為主機上擁有 root 全域前綴的系統 npm：

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

接著進行驗證：

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

當 `openclaw update` 管理全域 npm 安裝時，會先將目標安裝至暫存 npm 前綴、驗證已封裝的 `dist` 清單，再將乾淨的套件樹替換至實際的全域前綴，避免 npm 將新套件覆疊到舊套件留下的過時檔案上。如果安裝命令失敗，OpenClaw 會使用 `--omit=optional` 重試一次，這有助於無法編譯原生選用相依套件的主機。

由 OpenClaw 管理的 npm 更新與外掛更新命令，也會針對子 npm 程序清除 npm 的 `min-release-age` 供應鏈隔離設定（或較舊的 `before` 設定鍵）。該政策用於一般性保護，但明確執行 OpenClaw 更新表示「立即安裝所選發行版」。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 進階 npm 安裝主題

<AccordionGroup>
  <Accordion title="唯讀套件樹">
    OpenClaw 在執行階段會將已封裝的全域安裝視為唯讀，即使目前使用者可寫入全域套件目錄也是如此。外掛套件安裝位於使用者設定目錄下由 OpenClaw 擁有的 npm/git 根目錄，而閘道啟動不會修改 OpenClaw 套件樹。

    某些 Linux npm 設定會將全域套件安裝在由 root 擁有的目錄下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支援這種配置，因為外掛安裝／更新命令會寫入該全域套件目錄之外的位置。

  </Accordion>
  <Accordion title="強化的 systemd 單元">
    請授予 OpenClaw 對其設定／狀態根目錄的寫入權限，使明確執行的外掛安裝、外掛更新與 doctor 清理能夠保存變更：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="磁碟空間預先檢查">
    在套件更新與明確執行的外掛安裝之前，OpenClaw 會嘗試對目標磁碟區執行盡力而為的磁碟空間檢查。空間不足時會產生包含受檢查路徑的警告，但不會阻擋更新，因為檔案系統配額、快照與網路磁碟區可能在檢查後發生變化。實際的套件管理器安裝與安裝後驗證仍是最終依據。
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

| 頻道              | 行為                                                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`          | 等待 `stableDelayHours`（預設：6），接著在 `stableJitterHours`（預設：12）範圍內加入確定性抖動後套用，以分散推出時間。                                  |
| `extended-stable` | 啟用 `checkOnStart` 時，會在啟動時及每 24 小時檢查一次唯讀更新提示。絕不自動套用。                                                                    |
| `beta`            | 每隔 `betaCheckIntervalHours`（預設：1）檢查一次並立即套用。                                                                                          |
| `dev`             | 不會自動套用。請手動使用 `openclaw update`。                                                                                                         |

閘道也會在啟動時記錄更新提示（使用 `update.checkOnStart: false` 停用）。已儲存的 extended-stable 選擇會使用這條唯讀提示路徑及現有的 24 小時提示間隔，但絕不觸發自動安裝、移交、重新啟動、穩定版延遲／抖動或 beta 輪詢。
如需降級或事故復原，請在閘道環境中設定 `OPENCLAW_NO_AUTO_UPDATE=1`，即使已設定 `update.auto.enabled`，也能阻止自動套用。除非也停用 `update.checkOnStart`，否則啟動更新提示仍可執行。

透過即時閘道控制平面要求的套件管理器更新（`update.run`），不會在執行中的閘道程序內替換套件樹。對於受管理的服務安裝，閘道會啟動分離式移交程序後退出，並讓一般的 `openclaw update --yes --json` 命令列介面路徑停止服務、替換套件、重新整理服務中繼資料、重新啟動、驗證閘道版本與連線能力，並盡可能復原已安裝但尚未載入的 macOS LaunchAgent。如果閘道無法安全完成該移交，`update.run` 會回報安全的殼層命令，而不會在程序內執行套件管理器。

控制介面側邊欄的更新卡片會啟動相同的 `update.run` 流程。在已簽署的 macOS 應用程式中，該卡片會先透過 Sparkle 更新應用程式；重新啟動後，應用程式會將其管理的本機閘道更新至相符版本。

## 更新後

<Steps>

### 執行 doctor

```bash
openclaw doctor
```

遷移設定、稽核私訊政策，並檢查閘道健康狀態。詳細資訊：[Doctor](/zh-TW/gateway/doctor)

### 重新啟動閘道

```bash
openclaw gateway restart
```

### 驗證

```bash
openclaw health
```

</Steps>

## 回復版本

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

若要回到最新版本：`git checkout main && git pull`。

## 如果遇到困難

- 再次執行 `openclaw doctor`，並仔細閱讀輸出。
- 在原始碼簽出上執行 `openclaw update --channel dev` 時，更新程式會視需要自動引導安裝 `pnpm`。如果看到 pnpm/corepack 引導安裝錯誤，請手動安裝 `pnpm`（或重新啟用 `corepack`），然後再次執行更新。
- 查看：[疑難排解](/zh-TW/gateway/troubleshooting)
- 在 Discord 中提問：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相關內容

- [安裝概覽](/zh-TW/install)：所有安裝方式。
- [Doctor](/zh-TW/gateway/doctor)：更新後的健康檢查。
- [遷移](/zh-TW/install/migrating)：主要版本遷移指南。
