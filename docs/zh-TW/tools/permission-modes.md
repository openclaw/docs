---
read_when:
    - 為命令權限選擇 auto、ask、allowlist、full 或 deny
    - 透過 tools.exec.mode 設定 Codex Guardian 審查的核准
    - 比較 OpenClaw exec 核准與 ACPX 測試框架權限
summary: 主機執行、Codex Guardian 核准與 ACPX harness 工作階段的權限模式
title: 權限模式
x-i18n:
    generated_at: "2026-06-27T20:09:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6ce89cadb45b3b96ce9ab62b35c06610d02f0ff02f15ef7d2128c59fbebb325a
    source_path: tools/permission-modes.md
    workflow: 16
---

權限模式決定代理在執行主機命令、寫入檔案，或向後端 harness 要求額外存取權之前，擁有多少權限。當你希望 OpenClaw 先使用允許清單，再針對未命中項目走 Codex 原生自動審查或人工核准路徑時，請從 `tools.exec.mode: "auto"` 開始。

<Note>
  權限模式不同於 `tools.exec.host=auto`。`tools.exec.host`
  選擇命令在哪裡執行。`tools.exec.mode` 選擇主機 exec 如何
  獲得核准。
</Note>

## 建議預設值

對於需要實用主機存取權、但不想讓每個未命中項目都變成人工提示的 coding agents，請使用 `auto`：

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

接著驗證實際生效的政策：

```bash
openclaw exec-policy show
```

在 `auto` 模式中，OpenClaw 會直接執行符合確定性允許清單的項目。核准未命中項目會先經過 OpenClaw 的原生自動審查器，必要時再回退到已設定的人工核准路徑。

## OpenClaw 主機 exec 模式

`tools.exec.mode` 是主機 `exec` 的正規化政策介面。

| 模式        | 行為                                     | 使用時機                                              |
| ----------- | -------------------------------------------- | ----------------------------------------------------- |
| `deny`      | 封鎖主機 exec。                             | 不允許任何主機命令。                         |
| `allowlist` | 只執行允許清單中的命令。               | 你有一組已知安全的命令集。                    |
| `ask`       | 執行允許清單命中項目，並對未命中項目詢問。     | 人工應審查新的命令形態。                   |
| `auto`      | 執行允許清單命中項目，然後使用自動審查。 | 編碼工作階段需要實用且受防護的存取權。        |
| `full`      | 不經提示執行主機 exec。               | 此受信任的主機/工作階段應略過核准門檻。 |

完整的主機 exec 政策、本機核准檔、允許清單 schema、安全 bins，以及轉送行為，請參閱 [Exec 核准](/zh-TW/tools/exec-approvals)。

## Codex Guardian 對應

對於原生 Codex app-server 工作階段，當本機 Codex 需求允許時，`tools.exec.mode: "auto"` 會對應到由 Codex Guardian 審查的核准。OpenClaw 通常會傳送：

| Codex 欄位         | 典型值     |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

在 `auto` 模式中，OpenClaw 不會保留舊版不安全的 Codex 覆寫，例如 `approvalPolicy: "never"` 或 `sandbox: "danger-full-access"`。只有在你刻意想要無需核准的姿態時，才使用 `tools.exec.mode: "full"`。

如需 app-server 設定、驗證順序與原生 Codex runtime 詳細資訊，請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

## ACPX harness 權限

ACPX 工作階段是非互動式的，因此無法點擊 TTY 權限提示。ACPX 使用位於 `plugins.entries.acpx.config` 底下獨立的 harness 層級設定：

| 設定                     | 常見值    | 意義                                     |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | 僅自動核准讀取。                    |
| `permissionMode`            | `approve-all`   | 自動核准寫入與 shell 命令。     |
| `permissionMode`            | `deny-all`      | 拒絕所有權限提示。                |
| `nonInteractivePermissions` | `fail`          | 需要提示時中止。      |
| `nonInteractivePermissions` | `deny`          | 拒絕提示，並在可能時繼續。 |

請將 ACPX 權限與 OpenClaw exec 核准分開設定：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

將 `approve-all` 作為 ACPX 對等於無提示 harness 工作階段的 break-glass 選項。如需設定詳細資訊與失敗模式，請參閱 [ACP 代理設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。

## 選擇模式

| 目標                                          | 設定                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| 完全封鎖主機命令                | `tools.exec.mode: "deny"`                                   |
| 僅讓已知安全的命令執行              | `tools.exec.mode: "allowlist"`                              |
| 對每種新的命令形態詢問人工       | `tools.exec.mode: "ask"`                                    |
| 在人工之前使用 Codex/OpenClaw 自動審查  | `tools.exec.mode: "auto"`                                   |
| 完全略過主機 exec 核准             | `tools.exec.mode: "full"` 加上相符的主機核准檔 |
| 讓非互動式 ACPX 工作階段寫入/執行 | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

如果變更模式後命令仍然提示或失敗，請檢查兩個層級：

```bash
openclaw approvals get
openclaw exec-policy show
```

主機 exec 會使用 OpenClaw 設定與主機本機核准檔中較嚴格的結果。ACPX harness 權限不會放寬主機 exec 核准，而主機 exec 核准也不會放寬 ACPX harness 提示。

## 相關

- [Exec 核准](/zh-TW/tools/exec-approvals)
- [Exec 核准 - 進階](/zh-TW/tools/exec-approvals-advanced)
- [Codex harness](/zh-TW/plugins/codex-harness)
- [ACP 代理設定](/zh-TW/tools/acp-agents-setup#permission-configuration)
