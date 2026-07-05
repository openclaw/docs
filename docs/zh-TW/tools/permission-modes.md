---
read_when:
    - 選擇 auto、ask、allowlist、full 或 deny 作為命令權限
    - 透過 tools.exec.mode 設定 Codex Guardian 已審核的核准
    - 比較 OpenClaw 執行核准與 ACPX 測試框架權限
summary: 主機 exec、Codex Guardian 核准與 ACPX 測試框架工作階段的權限模式
title: 權限模式
x-i18n:
    generated_at: "2026-07-05T11:51:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

權限模式會決定代理在執行主機命令、寫入檔案，或向後端測試框架要求額外存取權之前，擁有多少權限。

<Note>
  權限模式與 `tools.exec.host=auto` 是分開的。`tools.exec.host`
  會選擇命令在哪裡執行。`tools.exec.mode` 會選擇主機 exec
  如何核准。
</Note>

## 建議預設值

對於需要實用主機存取權、但不希望每次未命中都提示人工確認的編碼代理，請使用 `auto`：

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

接著驗證實際生效的政策：

```bash
openclaw exec-policy show
```

## OpenClaw 主機 exec 模式

`tools.exec.mode` 是主機 `exec` 的標準化政策介面。每個模式都會解析為底層的 `security`（允許清單嚴格度）與 `ask`（未命中時提示）配對：

| 模式        | security / ask          | 行為                                                                                      | 使用時機                                              |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `deny`      | `deny` / `off`          | 完全封鎖主機 exec。                                                                     | 不允許任何主機命令。                         |
| `allowlist` | `allowlist` / `off`     | 只執行允許清單中的命令；靜默拒絕未命中項目。                                          | 你有一組已知安全的命令。                    |
| `ask`       | `allowlist` / `on-miss` | 執行符合允許清單的命令；未命中時詢問人工。                                                 | 每個新命令都應由人工審查。              |
| `auto`      | `allowlist` / `on-miss` | 執行符合允許清單的命令；未命中項目會先經過自動審查，再回退到人工核准。 | 編碼工作階段需要實用且受保護的存取權。        |
| `full`      | `full` / `off`          | 執行主機 exec 而不提示。                                                                | 此受信任的主機/工作階段應跳過核准閘門。 |

`ask` 與 `auto` 共用相同的允許清單/詢問設定；`auto` 會額外啟用原生自動審查器，由它自行判斷未命中項目，只有在無法安全核准時，才會延後交給已設定的人工核准路徑。

完整的主機 exec 政策、本機核准檔案、允許清單結構描述、安全二進位檔，以及轉送行為，請參閱 [Exec approvals](/zh-TW/tools/exec-approvals)。

## Codex Guardian 對應

對於原生 Codex 應用程式伺服器工作階段，當本機 Codex 要求允許時，`tools.exec.mode: "auto"` 會引導 Codex 使用 Guardian 審查的核准。典型產生值如下：

| Codex 欄位         | 典型值     |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

`auto` 模式會強制使用此政策，覆寫任何已設定的 Codex 沙盒/核准覆寫，因此它不會保留舊版不安全組合，例如 `approvalPolicy: "never"` 搭配 `sandbox: "danger-full-access"`。`tools.exec.mode: "deny"` 與 `"allowlist"` 會完全封鎖 Codex 應用程式伺服器的本機執行。只有在你明確想要無核准姿態時，才使用 `tools.exec.mode: "full"`。

如需應用程式伺服器設定、驗證順序，以及原生 Codex 執行階段詳細資訊，請參閱 [Codex harness](/zh-TW/plugins/codex-harness)。

## ACPX 測試框架權限

ACPX 工作階段是非互動式的，因此無法點擊 TTY 權限提示。ACPX 會使用 `plugins.entries.acpx.config` 下方個別的測試框架層級設定：

| 設定                     | 值          | 意義                                     |
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

使用 `approve-all` 作為 ACPX 的破窗等效設定，代表無提示的測試框架工作階段。如需設定詳細資訊與失敗模式，請參閱 [ACP agents setup](/zh-TW/tools/acp-agents-setup#permission-configuration)。

## 選擇模式

| 目標                                          | 設定                                                   |
| --------------------------------------------- | ----------------------------------------------------------- |
| 完全封鎖主機命令                | `tools.exec.mode: "deny"`                                   |
| 只允許已知安全的命令執行              | `tools.exec.mode: "allowlist"`                              |
| 每個新命令形態都詢問人工       | `tools.exec.mode: "ask"`                                    |
| 在人工之前使用 Codex/OpenClaw 自動審查  | `tools.exec.mode: "auto"`                                   |
| 完全跳過主機 exec 核准             | `tools.exec.mode: "full"` 加上相符的主機核准檔案 |
| 讓非互動式 ACPX 工作階段可寫入/執行 | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

如果變更模式後，命令仍然提示或失敗，請檢查兩個層級：

```bash
openclaw approvals get
openclaw exec-policy show
```

主機 exec 會使用 OpenClaw 設定與主機本機核准檔案中較嚴格的結果。ACPX 測試框架權限不會放寬主機 exec 核准，而主機 exec 核准也不會放寬 ACPX 測試框架提示。

## 相關

- [Exec approvals](/zh-TW/tools/exec-approvals)
- [Exec approvals - advanced](/zh-TW/tools/exec-approvals-advanced)
- [Codex harness](/zh-TW/plugins/codex-harness)
- [ACP agents setup](/zh-TW/tools/acp-agents-setup#permission-configuration)
