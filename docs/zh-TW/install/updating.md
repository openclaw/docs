---
read_when:
    - 更新 OpenClaw
    - 更新後發生問題
summary: 安全更新 OpenClaw（全域安裝或原始碼），以及回復策略
title: 更新
x-i18n:
    generated_at: "2026-05-02T02:53:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 84bf4462a4ee041b0d22e433d1e9f44cfd799a5c327ba94f9df96595d92bdb3c
    source_path: install/updating.md
    workflow: 16
---

讓 OpenClaw 保持最新狀態。

## 建議：`openclaw update`

最快的更新方式。它會偵測你的安裝類型（npm 或 git）、擷取最新版本、執行 `openclaw doctor`，並重新啟動 Gateway。

```bash
openclaw update
```

若要切換通道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`--channel beta` 會優先使用 beta，但當 beta 標籤缺少或比最新穩定版更舊時，
執行階段會退回到 stable/latest。若你想針對一次性的套件更新使用原始 npm beta
dist-tag，請使用 `--tag beta`。

請參閱[開發通道](/zh-TW/install/development-channels)了解通道語意。

## 在 npm 與 git 安裝之間切換

當你想變更安裝類型時，請使用通道。更新程式會保留你在 `~/.openclaw` 中的
狀態、設定、憑證與工作區；它只會變更 CLI 與 Gateway 使用的 OpenClaw 程式碼安裝來源。

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

先用 `--dry-run` 執行，以預覽確切的安裝模式切換：

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

`dev` 通道會確保使用 git checkout、建置它，並從該 checkout 安裝全域 CLI。
`stable` 與 `beta` 通道使用套件安裝。如果 Gateway 已經安裝，
`openclaw update` 會重新整理服務中繼資料並重新啟動它，除非你傳入 `--no-restart`。

## 替代方式：重新執行安裝程式

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

加入 `--no-onboard` 可略過 onboarding。若要透過安裝程式強制使用特定安裝類型，
請傳入 `--install-method git --no-onboard` 或
`--install-method npm --no-onboard`。

如果 `openclaw update` 在 npm 套件安裝階段後失敗，請重新執行安裝程式。
安裝程式不會呼叫舊的更新程式；它會直接執行全域套件安裝，並且可以復原部分更新的 npm 安裝。

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

若要將復原固定到特定版本或 dist-tag，請加入 `--version`：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## 替代方式：手動使用 npm、pnpm 或 bun

```bash
npm i -g openclaw@latest
```

當 `openclaw update` 管理全域 npm 安裝時，它會先將目標安裝到暫時的 npm prefix，
驗證已封裝的 `dist` 清單，然後將乾淨的套件樹替換到真正的全域 prefix。
這可避免 npm 將新套件覆蓋到舊套件遺留的過期檔案上。如果安裝命令失敗，
OpenClaw 會使用 `--omit=optional` 重試一次。該重試有助於原生選用相依性無法編譯的主機，
同時在備援也失敗時仍保留原始失敗可見。

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### 進階 npm 安裝主題

<AccordionGroup>
  <Accordion title="Read-only package tree">
    OpenClaw 會在執行階段將已封裝的全域安裝視為唯讀，即使目前使用者可以寫入全域套件目錄也是如此。Plugin 套件安裝位於使用者設定目錄下由 OpenClaw 擁有的 npm/git root，而 Gateway 啟動不會修改 OpenClaw 套件樹。

    某些 Linux npm 設定會將全域套件安裝在 root 擁有的目錄下，例如 `/usr/lib/node_modules/openclaw`。OpenClaw 支援該配置，因為 Plugin 安裝/更新命令會寫入該全域套件目錄之外的位置。

  </Accordion>
  <Accordion title="Hardened systemd units">
    授予 OpenClaw 對其設定/狀態 root 的寫入權限，讓明確的 Plugin 安裝、Plugin 更新與 doctor 清理能夠持久保存其變更：

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Disk-space preflight">
    在套件更新與明確的 Plugin 安裝之前，OpenClaw 會嘗試對目標磁碟區進行最佳努力的磁碟空間檢查。空間不足會產生包含已檢查路徑的警告，但不會阻擋更新，因為檔案系統配額、快照與網路磁碟區可能會在檢查後變更。實際的套件管理器安裝與安裝後驗證仍是權威依據。
  </Accordion>
</AccordionGroup>

## 自動更新程式

自動更新程式預設關閉。請在 `~/.openclaw/openclaw.json` 中啟用：

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

| 通道     | 行為                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `stable` | 等待 `stableDelayHours`，然後在 `stableJitterHours` 範圍內套用確定性 jitter（分散推出）。                 |
| `beta`   | 每隔 `betaCheckIntervalHours` 檢查一次（預設：每小時），並立即套用。                                      |
| `dev`    | 不會自動套用。請手動使用 `openclaw update`。                                                             |

Gateway 也會在啟動時記錄更新提示（可用 `update.checkOnStart: false` 停用）。
若要降級或進行事件復原，請在 Gateway 環境中設定 `OPENCLAW_NO_AUTO_UPDATE=1`，
即使已設定 `update.auto.enabled` 也會封鎖自動套用。除非也停用 `update.checkOnStart`，
否則啟動更新提示仍可執行。

透過即時 Gateway 控制平面 handler 請求的套件管理器更新，
會在套件替換後強制執行非延遲、無冷卻時間的更新重新啟動。
這可避免舊的記憶體內程序停留太久，進而從已被替換的套件樹中 lazy-load chunk。
對於受監督的安裝，shell `openclaw update` 仍是偏好的路徑，因為它可以在更新前後停止並重新啟動服務。

## 更新後

<Steps>

### 執行 doctor

```bash
openclaw doctor
```

遷移設定、稽核 DM 政策，並檢查 Gateway 健全狀態。詳細資訊：[Doctor](/zh-TW/gateway/doctor)

### 重新啟動 Gateway

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
`npm view openclaw version` 會顯示目前已發布的版本。
</Tip>

### 固定 commit（原始碼）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

若要回到最新版本：`git checkout main && git pull`。

## 如果你卡住了

- 再次執行 `openclaw doctor`，並仔細閱讀輸出。
- 對於來源 checkout 上的 `openclaw update --channel dev`，更新程式會在需要時自動 bootstrap `pnpm`。如果你看到 pnpm/corepack bootstrap 錯誤，請手動安裝 `pnpm`（或重新啟用 `corepack`），然後重新執行更新。
- 查看：[疑難排解](/zh-TW/gateway/troubleshooting)
- 到 Discord 詢問：[https://discord.gg/clawd](https://discord.gg/clawd)

## 相關

- [安裝概覽](/zh-TW/install)：所有安裝方法。
- [Doctor](/zh-TW/gateway/doctor)：更新後的健全狀態檢查。
- [遷移](/zh-TW/install/migrating)：主要版本遷移指南。
