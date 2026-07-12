---
read_when:
    - 你正從 Hermes 遷移而來，並希望保留模型設定、提示詞、記憶與 Skills
    - 您想知道 OpenClaw 會自動匯入哪些內容，以及哪些內容只會保留在封存中
    - 你需要一套乾淨、可透過指令碼執行的遷移流程（CI、全新筆記型電腦、自動化）
summary: 透過可預覽且可還原的匯入，從 Hermes 遷移至 OpenClaw
title: 從 Hermes 遷移
x-i18n:
    generated_at: "2026-07-11T21:26:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd9012efb084c00dfe55bb841fea3cc6908c08b528492f1552bf226f125961e6
    source_path: install/migrating-hermes.md
    workflow: 16
---

內建的 Hermes 遷移提供者會偵測 `~/.hermes` 中的狀態、在套用前預覽每項變更、遮蔽計畫與報告中的機密，並在接觸任何內容前寫入經驗證的 OpenClaw 備份。

<Note>
匯入需要全新的 OpenClaw 設定。如果本機已有 OpenClaw 狀態，請先重設設定、憑證、工作階段與工作區；或者在檢閱計畫後，直接使用帶有 `--overwrite` 的 `openclaw migrate apply hermes`。
</Note>

## 兩種匯入方式

<Tabs>
  <Tab title="初始設定精靈">
    偵測 `~/.hermes` 中的 Hermes，並在套用前顯示預覽。

    ```bash
    openclaw onboard --flow import
    ```

    或指定特定來源：

    ```bash
    openclaw onboard --import-from hermes --import-source ~/.hermes
    ```

  </Tab>
  <Tab title="命令列介面">
    使用 `openclaw migrate` 執行指令碼化或可重複的作業。完整參考請參閱 [`openclaw migrate`](/zh-TW/cli/migrate)。

    ```bash
    openclaw migrate hermes --dry-run    # 僅預覽
    openclaw migrate apply hermes --yes  # 略過確認並套用
    ```

    當 Hermes 位於 `~/.hermes` 以外的位置時，請加上 `--from <path>`。

  </Tab>
</Tabs>

## 匯入的內容

<AccordionGroup>
  <Accordion title="模型設定">
    - 從 Hermes `config.yaml` 匯入預設模型選擇。
    - 從 `providers` 與 `custom_providers` 匯入已設定的模型提供者及自訂 OpenAI 相容端點。

  </Accordion>
  <Accordion title="MCP 伺服器">
    從 `mcp_servers` 或 `mcp.servers` 匯入 MCP 伺服器定義。
  </Accordion>
  <Accordion title="工作區檔案">
    - `SOUL.md` 與 `AGENTS.md` 會複製到 OpenClaw 代理程式工作區。
    - `memories/MEMORY.md` 與 `memories/USER.md` 會**附加**至對應的 OpenClaw 記憶檔案，而非覆寫它們。

  </Accordion>
  <Accordion title="記憶設定">
    OpenClaw 檔案記憶的預設記憶設定。Honcho 等外部記憶提供者會記錄為封存或需手動檢閱的項目，讓你能審慎地移轉它們。
  </Accordion>
  <Accordion title="Skills">
    位於 `skills/<name>/` 下且包含 `SKILL.md` 檔案的 Skills 會連同 `skills.config` 中各 Skill 的設定值一起複製。
  </Accordion>
  <Accordion title="驗證憑證">
    互動式 `openclaw migrate` 會在匯入驗證憑證前詢問，且預設選取「是」。接受後會從 OpenCode 的 `auth.json` 匯入 OpenCode OpenAI OAuth 與 GitHub Copilot 項目，以及[支援的 Hermes `.env` 鍵](/zh-TW/cli/migrate#supported-env-keys)。Hermes 自身 `auth.json` 中的 OAuth 項目屬於舊版狀態：它們會顯示為需要手動重新驗證或由 Doctor 處理的項目，而不會匯入即時驗證設定。非互動式執行時可使用 `--include-secrets` 匯入憑證、使用 `--no-auth-credentials` 完全略過憑證匯入，或使用初始設定精靈的 `--import-secrets` 旗標。
  </Accordion>
</AccordionGroup>

## 僅保留於封存的內容

提供者會將下列項目複製到遷移報告目錄供手動檢閱，但**不會**將它們載入即時 OpenClaw 設定或憑證：

- `plugins/`
- `sessions/`
- `logs/`
- `cron/`
- `mcp-tokens/`
- `state.db`

由於不同系統間的格式與信任假設可能產生差異，OpenClaw 拒絕自動執行或信任這些狀態。檢閱封存內容後，請手動移轉所需項目。

## 建議流程

<Steps>
  <Step title="預覽計畫">
    ```bash
    openclaw migrate hermes --dry-run
    ```

    計畫會列出所有即將變更的內容，包括衝突、略過的項目與敏感項目。輸出中看似機密的巢狀鍵會被遮蔽。

  </Step>
  <Step title="建立備份並套用">
    ```bash
    openclaw migrate apply hermes --yes
    ```

    OpenClaw 會在套用前建立並驗證備份。此非互動式範例只匯入非機密狀態。若要以互動方式回答憑證提示，請執行時省略 `--yes`；若要在無人值守的執行中包含支援的憑證，請加上 `--include-secrets`。

  </Step>
  <Step title="執行 Doctor">
    ```bash
    openclaw doctor
    ```

    [Doctor](/zh-TW/gateway/doctor) 會重新套用任何待處理的設定遷移，並檢查匯入期間產生的問題。

  </Step>
  <Step title="重新啟動並驗證">
    ```bash
    openclaw gateway restart
    openclaw status
    ```

    確認閘道運作正常，且匯入的模型、記憶與 Skills 均已載入。

  </Step>
</Steps>

## 衝突處理

當計畫回報衝突（目標位置已存在檔案或設定值）時，套用作業會拒絕繼續。

<Warning>
只有在確定要取代現有目標時，才使用 `--overwrite` 重新執行。提供者仍可能在遷移報告目錄中，為遭覆寫的檔案寫入項目層級的備份。
</Warning>

全新安裝通常不會發生衝突。當你對已有使用者編輯內容的設定重新執行匯入時，通常才會出現衝突。

如果套用過程中出現衝突（例如設定檔發生非預期的競爭條件），Hermes 會將其餘相依設定項目標記為 `skipped`，原因為 `blocked by earlier apply conflict`，而不會只寫入部分內容。遷移報告會記錄每個受阻項目，讓你能解決原始衝突後重新執行匯入。

## 機密

互動式 `openclaw migrate` 會詢問是否匯入偵測到的驗證憑證，且預設選取「是」。

- 接受後會從 OpenCode 的 `auth.json` 匯入 OpenCode OpenAI OAuth 與 GitHub Copilot 項目，以及[支援的 `.env` 鍵](/zh-TW/cli/migrate#supported-env-keys)。Hermes 自身 `auth.json` 中的 OAuth 項目則會列入報告，供手動重新進行 OpenAI 驗證或由 Doctor 修復。
- 使用 `--no-auth-credentials`，或在提示中回答「否」，即可只匯入非機密狀態。
- 在無人值守的 `--yes` 執行中，使用 `--include-secrets` 匯入憑證。
- 使用初始設定精靈的 `--import-secrets` 旗標，從精靈匯入憑證。

## 自動化所用的 JSON 輸出

```bash
openclaw migrate hermes --dry-run --json
openclaw migrate apply hermes --json --yes
```

使用 `--json` 但未使用 `--yes` 時，套用作業會輸出計畫而不變更狀態，這是命令列介面與共用指令碼最安全的模式。

## 疑難排解

<AccordionGroup>
  <Accordion title="套用因衝突而遭拒">
    檢查計畫輸出。每項衝突都會指出來源路徑與現有目標。請逐項決定要略過、編輯目標，或使用 `--overwrite` 重新執行。
  </Accordion>
  <Accordion title="Hermes 位於 ~/.hermes 以外的位置">
    傳入 `--from /actual/path`（命令列介面）或 `--import-source /actual/path`（初始設定）。
  </Accordion>
  <Accordion title="初始設定拒絕匯入現有設定">
    初始設定匯入需要全新的設定。請重設狀態並重新執行初始設定，或直接使用 `openclaw migrate apply hermes`；後者支援 `--overwrite` 與明確的備份控制。
  </Accordion>
  <Accordion title="API 金鑰未匯入">
    互動式 `openclaw migrate` 只有在你接受憑證提示時才會匯入 API 金鑰。非互動式 `--yes` 執行需要加上 `--include-secrets`；初始設定匯入則需要 `--import-secrets`。只有[支援的 `.env` 鍵](/zh-TW/cli/migrate#supported-env-keys)會被辨識，其他 `.env` 變數會被忽略。
  </Accordion>
</AccordionGroup>

## 相關內容

- [`openclaw migrate`](/zh-TW/cli/migrate)：完整的命令列介面參考、外掛合約與 JSON 結構。
- [初始設定](/zh-TW/cli/onboard)：精靈流程與非互動式旗標。
- [遷移](/zh-TW/install/migrating)：在不同機器間移轉 OpenClaw 安裝。
- [Doctor](/zh-TW/gateway/doctor)：遷移後的健康狀態檢查。
- [代理程式工作區](/zh-TW/concepts/agent-workspace)：`SOUL.md`、`AGENTS.md` 與記憶檔案的所在位置。
