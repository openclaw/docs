---
read_when:
    - 更新 OpenClaw
    - 更新後某些功能故障
summary: 安全更新 OpenClaw（全域安裝或原始碼），以及回復策略
title: 更新
x-i18n:
    generated_at: "2026-06-27T19:28:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a96c5b9b12040fe9bb8b1623c88a9c305d58dc6fcee7003f500e897ded9e7b4a
    source_path: install/updating.md
    workflow: 16
---

讓 OpenClaw 保持最新狀態。

## 建議：`openclaw update`

最快的更新方式。它會偵測你的安裝類型（npm 或 git）、擷取最新版本、執行 `openclaw doctor`，並重新啟動閘道。

```bash
openclaw update
```

若要切換通道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --dry-run   # 預覽但不套用
```

`openclaw update` 不接受 `--verbose`。若要進行更新診斷，請使用
`--dry-run` 預覽計畫執行的動作、使用 `--json` 取得結構化結果，或使用
`openclaw update status --json` 檢查通道與可用狀態。安裝程式有自己的 `--verbose` 旗標，但該旗標不屬於
`openclaw update`。

`--channel beta` 會偏好 beta，但當 beta 標籤不存在或比最新穩定版更舊時，執行階段會退回 stable/latest。若你想針對單次套件更新使用原始 npm beta dist-tag，請使用 `--tag beta`。

使用 `--channel dev` 可取得持續移動的 GitHub `main` 簽出。對於套件更新，`--tag main` 會在單次執行中對應到 `github:openclaw/openclaw#main`，而 GitHub/git 來源規格會先封裝成暫存 tarball，再進行分段
npm 安裝。

對受管理外掛而言，beta 通道退回是一項警告：核心更新仍可成功，而外掛會使用其記錄的預設/最新版本，因為沒有可用的外掛 beta。

通道語意請參閱[開發通道](/zh-TW/install/development-channels)。

## 在 npm 與 git 安裝之間切換

當你想變更安裝類型時，請使用通道。更新器會保留你在 `~/.openclaw` 中的
狀態、設定、認證資料與工作區；它只會變更
命令列介面與閘道所使用的 OpenClaw 程式碼安裝。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

先使用 `--dry-run` 執行，以預覽確切的安裝模式切換：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 通道會確保使用 git 簽出、建置它，並從該簽出安裝全域命令列介面。
`stable` 與 `beta` 通道使用套件安裝。如果閘道已安裝，`openclaw update` 會重新整理服務中繼資料並重新啟動它，除非你傳入 `--no-restart`。

對於使用受管理閘道服務的套件安裝，`openclaw update` 會鎖定該服務使用的套件根目錄。如果 shell 的 `openclaw` 命令來自不同安裝，更新器會印出兩個根目錄與受管理服務的節點路徑。套件更新會使用擁有服務根目錄的套件管理器，並在替換套件前，依目標版本引擎檢查受管理服務節點。

## 替代方案：重新執行安裝程式

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

加入 `--no-onboard` 可略過入門設定。若要透過安裝程式強制指定特定安裝類型，請傳入 `--install-method git --no-onboard` 或
`--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 套件安裝階段後失敗，請重新執行
安裝程式。安裝程式不會呼叫舊更新器；它會直接執行全域
套件安裝，並可復原部分更新的 npm 安裝。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

若要將復原固定到特定版本或 dist-tag，請加入 `--version`：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方案：手動使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

對於受監督安裝，建議使用 `openclaw update`，因為它可以與正在執行的閘道服務協調套件替換。如果你在受監督安裝上手動更新，請在套件管理器開始前停止受管理閘道。套件管理器會就地替換檔案，否則正在執行的閘道可能會在套件樹暫時半替換時嘗試載入核心或外掛檔案。套件管理器完成後重新啟動閘道，讓服務載入新的安裝。

對於 root 擁有的 Linux 系統全域安裝，如果 `openclaw update` 因
`EACCES` 失敗，而你使用系統 npm 復原，請在手動套件替換期間保持閘道停止。請使用你通常用於該閘道的相同 `openclaw` 設定檔旗標或環境。將 `/usr/bin/npm` 替換為你主機上擁有 root 擁有全域前置路徑的系統 npm：

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

接著驗證服務：

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

當 `openclaw update` 管理全域 npm 安裝時，它會先將目標安裝到
暫存 npm 前置路徑，驗證封裝的 `dist` 清單，然後將乾淨的套件樹交換到真正的全域前置路徑。這可避免 npm 將新套件覆蓋到舊套件留下的陳舊檔案上。如果安裝命令失敗，OpenClaw 會使用 `--omit=optional` 重試一次。該重試有助於原生選用相依項無法編譯的主機，同時在退回也失敗時保留原始失敗可見。

OpenClaw 管理的 npm 更新與外掛更新命令也會為子 npm 程序清除 npm
`min-release-age` 隔離。npm 可能會將該政策回報為衍生的 `before` 截止值；兩者都適用於一般供應鏈隔離政策，但明確的 OpenClaw 更新表示「立即安裝選取的
OpenClaw 版本」。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 進階 npm 安裝主題

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw 會在執行階段將封裝的全域安裝視為唯讀，即使目前使用者可寫入全域套件目錄也是如此。外掛套件安裝位於使用者設定目錄下由 OpenClaw 擁有的 npm/git 根目錄中，而閘道啟動不會修改 OpenClaw 套件樹。

    某些 Linux npm 設定會將全域套件安裝在 root 擁有的目錄下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支援該配置，因為外掛安裝/更新命令會寫入該全域套件目錄之外的位置。

  </Accordion>
  <Accordion title="Hardened systemd units">
    授予 OpenClaw 對其設定/狀態根目錄的寫入權限，讓明確的外掛安裝、外掛更新與 doctor 清理可以持久化其變更：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    在套件更新與明確的外掛安裝之前，OpenClaw 會嘗試對目標磁碟區進行盡力而為的磁碟空間檢查。空間不足會產生包含已檢查路徑的警告，但不會阻擋更新，因為檔案系統配額、快照與網路磁碟區可能在檢查後改變。實際的套件管理器安裝與安裝後驗證仍是權威依據。
  </Accordion>
</AccordionGroup>

## 自動更新器

自動更新器預設關閉。請在 `~/.openclaw/openclaw.json` 中啟用：

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

| 通道     | 行為                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | 等待 `stableDelayHours`，然後在 `stableJitterHours` 內以確定性抖動套用（分散推出）。 |
| `beta`   | 每隔 `betaCheckIntervalHours` 檢查一次（預設：每小時）並立即套用。                              |
| `dev`    | 不會自動套用。請手動使用 `openclaw update`。                                                           |

閘道也會在啟動時記錄更新提示（可使用 `update.checkOnStart: false` 停用）。
若要降級或進行事件復原，請在閘道環境中設定 `OPENCLAW_NO_AUTO_UPDATE=1`，即使已設定 `update.auto.enabled` 也會阻擋自動套用。除非也停用 `update.checkOnStart`，否則啟動更新提示仍可執行。

透過即時閘道控制平面處理常式要求的套件管理器更新，不會替換正在執行的閘道程序內的套件樹。在受管理服務安裝中，閘道會啟動分離的交接、結束，並讓一般的 `openclaw update --yes --json` 命令列介面路徑停止服務、替換套件、重新整理服務中繼資料、重新啟動、驗證閘道版本與可達性，並在可能時復原已安裝但未載入的 macOS LaunchAgent。如果閘道無法安全進行該交接，`update.run` 會回報安全的 shell 命令，而不是在程序內執行套件管理器。

## 更新後

<Steps>

### 執行 doctor

```bash
openclaw doctor
```

遷移設定、稽核 DM 政策，並檢查閘道健康狀態。詳細資訊：[Doctor](/zh-TW/gateway/doctor)

### 重新啟動閘道

```bash
openclaw gateway restart
```

### 驗證

```bash
openclaw health
```

</Steps>

## 回復

### 固定版本（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` 會顯示目前已發布版本。
</Tip>

### 固定提交（來源）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

若要回到最新版本：`git checkout main && git pull`。

## 如果你卡住了

- 再次執行 `openclaw doctor`，並仔細閱讀輸出。
- 對來源簽出的 `openclaw update --channel dev`，更新器會在需要時自動啟動 `pnpm`。如果你看到 pnpm/corepack 啟動錯誤，請手動安裝 `pnpm`（或重新啟用 `corepack`）並重新執行更新。
- 檢查：[疑難排解](/zh-TW/gateway/troubleshooting)
- 在 Discord 詢問：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相關

- [安裝概觀](/zh-TW/install)：所有安裝方法。
- [Doctor](/zh-TW/gateway/doctor)：更新後的健康檢查。
- [遷移](/zh-TW/install/migrating)：主要版本遷移指南。
