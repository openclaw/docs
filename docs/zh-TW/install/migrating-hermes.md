---
read_when:
    - 你是從 Hermes 遷移而來，並想保留你的模型設定、提示詞、記憶和 Skills
    - 你想了解 OpenClaw 會自動匯入哪些內容，以及哪些內容僅保留在封存中
    - 你需要一個乾淨、可腳本化的遷移路徑（CI、新筆電、自動化）
summary: 從 Hermes 遷移到 OpenClaw，並使用可預覽、可復原的匯入
title: 從 Hermes 遷移
x-i18n:
    generated_at: "2026-07-05T11:24:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

隨附的 Hermes 遷移提供者會偵測 `~/.hermes` 的狀態，在套用前預覽每項變更，在計畫與報告中遮蔽祕密，並在觸碰任何內容前寫入已驗證的 OpenClaw 備份。

<Note>
匯入需要全新的 OpenClaw 設定。如果你已經有本機 OpenClaw 狀態，請先重設設定、憑證、工作階段與工作區，或在檢視計畫後，直接使用 `openclaw migrate apply hermes` 搭配 `--overwrite`。
</Note>

## 兩種匯入方式

<Tabs>
  <Tab title="入門精靈">
    偵測 `~/.hermes` 的 Hermes，並在套用前顯示預覽。

    ```bash
    openclaw onboard --flow import
    ```

    或指向特定來源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="命令列介面">
    使用 `openclaw migrate` 進行指令碼化或可重複執行的操作。完整參考請參閱 [`openclaw migrate`](/zh-TW/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # 僅預覽
    openclaw migrate apply hermes --yes  # 略過確認並套用
    ```

    當 Hermes 位於 `~/.hermes` 之外時，加入 `--from <path>`。

  </Tab>
</Tabs>

## 匯入內容

<AccordionGroup>
  <Accordion title="模型設定">
    - 來自 Hermes `config.yaml` 的預設模型選擇。
    - 來自 `providers` 與 `custom_providers` 的已設定模型提供者與自訂 OpenAI 相容端點。

  </Accordion>
  <Accordion title="MCP 伺服器">
    來自 `mcp_servers` 或 `mcp.servers` 的 MCP 伺服器定義。
  </Accordion>
  <Accordion title="工作區檔案">
    - `SOUL.md` 與 `AGENTS.md` 會複製到 OpenClaw 代理工作區。
    - `memories/MEMORY.md` 與 `memories/USER.md` 會**附加**到對應的 OpenClaw 記憶檔案，而不是覆寫它們。

  </Accordion>
  <Accordion title="記憶設定">
    OpenClaw 檔案記憶的記憶設定預設值。Honcho 等外部記憶提供者會記錄為封存或手動檢視項目，讓你能有意識地移轉它們。
  </Accordion>
  <Accordion title="Skills">
    位於 `skills/<name>/` 底下且具有 `SKILL.md` 檔案的 Skills 會被複製，連同來自 `skills.config` 的各 Skill 設定值。
  </Accordion>
  <Accordion title="驗證憑證">
    互動式 `openclaw migrate` 會在匯入驗證憑證前詢問，並預設選取是。接受後會匯入 OpenCode 的 `auth.json` 中的 OpenCode OpenAI OAuth 與 GitHub Copilot 項目，以及[支援的 Hermes `.env` 鍵](/zh-TW/cli/migrate#supported-env-keys)。Hermes 自己的 `auth.json` OAuth 項目是舊版狀態：它們會顯示為手動重新驗證/doctor 項目，而不是匯入到即時驗證中。使用 `--include-secrets` 在非互動式執行中匯入憑證，使用 `--no-auth-credentials` 完全略過憑證匯入，或使用入門精靈的 `--import-secrets` 旗標。
  </Accordion>
</AccordionGroup>

## 僅保留為封存的內容

提供者會將這些內容複製到遷移報告目錄以供手動檢視，但**不會**將它們載入即時 OpenClaw 設定或憑證：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

OpenClaw 會拒絕自動執行或信任此狀態，因為格式與信任假設可能會在系統之間偏移。檢視封存後，手動移動你需要的內容。

## 建議流程

<Steps>
  <Step title="預覽計畫">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    計畫會列出所有將變更的內容，包括衝突、略過的項目與敏感項目。輸出中看似祕密的巢狀鍵會被遮蔽。

  </Step>
  <Step title="套用並備份">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 會在套用前建立並驗證備份。這個非互動式範例只會匯入非祕密狀態。不使用 `--yes` 執行以互動方式回答憑證提示，或加入 `--include-secrets`，在無人值守執行中包含支援的憑證。

  </Step>
  <Step title="執行 doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/zh-TW/gateway/doctor) 會重新套用任何待處理的設定遷移，並檢查匯入期間引入的問題。

  </Step>
  <Step title="重新啟動並驗證">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    確認閘道健康，且已載入你匯入的模型、記憶與 Skills。

  </Step>
</Steps>

## 衝突處理

當計畫回報衝突（檔案或設定值已存在於目標位置）時，套用會拒絕繼續。

<Warning>
只有在確定要取代現有目標時，才使用 `--overwrite` 重新執行。提供者仍可能在遷移報告目錄中為被覆寫的檔案寫入項目層級備份。
</Warning>

在全新安裝上，衝突並不常見。它們通常會在你對已經有使用者編輯的設定重新執行匯入時出現。

如果衝突在套用中途浮現（例如設定檔發生非預期競爭），Hermes 會將剩餘相依設定項目標記為 `skipped`，原因為 `blocked by earlier apply conflict`，而不是部分寫入。遷移報告會記錄每個被封鎖的項目，讓你可以解決原始衝突並重新執行匯入。

## 祕密

互動式 `openclaw migrate` 會詢問是否匯入偵測到的驗證憑證，並預設選取是。

- 接受後會匯入 OpenCode 的 `auth.json` 中的 OpenCode OpenAI OAuth 與 GitHub Copilot 項目，以及[支援的 `.env` 鍵](/zh-TW/cli/migrate#supported-env-keys)。Hermes 自己的 `auth.json` OAuth 項目則會回報為需要手動 OpenAI 重新驗證或 doctor 修復。
- 使用 `--no-auth-credentials`，或在提示中回答否，只匯入非祕密狀態。
- 使用 `--include-secrets` 在無人值守的 `--yes` 執行中匯入憑證。
- 使用入門精靈的 `--import-secrets` 旗標，從精靈匯入憑證。

## 自動化的 JSON 輸出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 且沒有 `--yes` 時，套用會列印計畫且不變更狀態，這是 CI 與共用指令碼最安全的模式。

## 疑難排解

<AccordionGroup>
  <Accordion title="套用因衝突而拒絕">
    檢查計畫輸出。每個衝突都會識別來源路徑與現有目標。逐項決定是否略過、編輯目標，或使用 `--overwrite` 重新執行。
  </Accordion>
  <Accordion title="Hermes 位於 ~/.hermes 之外">
    傳遞 `--from /actual/path`（命令列介面）或 `--import-source /actual/path`（入門）。
  </Accordion>
  <Accordion title="入門在現有設定上拒絕匯入">
    入門匯入需要全新的設定。請重設狀態並重新入門，或直接使用 `openclaw migrate apply hermes`，其支援 `--overwrite` 與明確的備份控制。
  </Accordion>
  <Accordion title="API 金鑰未匯入">
    互動式 `openclaw migrate` 只有在你接受憑證提示時才會匯入 API 金鑰。非互動式 `--yes` 執行需要 `--include-secrets`；入門匯入需要 `--import-secrets`。只會辨識[支援的 `.env` 鍵](/zh-TW/cli/migrate#supported-env-keys)，其他 `.env` 變數會被忽略。
  </Accordion>
</AccordionGroup>

## 相關

- [`openclaw migrate`](/zh-TW/cli/migrate)：完整命令列介面參考、外掛合約與 JSON 形狀。
- [入門](/zh-TW/cli/onboard)：精靈流程與非互動式旗標。
- [遷移](/zh-TW/install/migrating)：在機器之間移動 OpenClaw 安裝。
- [Doctor](/zh-TW/gateway/doctor)：遷移後健康檢查。
- [代理工作區](/zh-TW/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 與記憶檔案所在位置。
