---
read_when:
    - 為命令權限選擇 auto、ask、allowlist、full 或 deny
    - 透過 tools.exec.mode 設定由 Codex Guardian 審核的核准流程
    - 比較 OpenClaw 執行核准與 ACPX 測試框架權限
summary: 主機執行的權限模式、Codex Guardian 核准機制與 ACPX 測試框架工作階段
title: 權限模式
x-i18n:
    generated_at: "2026-07-11T21:51:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f580e66508c1f69e868ed26a62d88a675f86a4d1ca738650dc5af82e967f3ac3
    source_path: tools/permission-modes.md
    workflow: 16
---

權限模式決定代理程式在執行主機命令、寫入檔案，或向後端執行框架要求額外存取權之前，擁有多大的權限。

<Note>
  權限模式與 `tools.exec.host=auto` 是分開的。`tools.exec.host`
  選擇命令的執行位置。`tools.exec.mode` 選擇如何核准主機執行。
</Note>

## 建議的預設值

對於需要實用主機存取權，但不希望每次未命中都要求人工確認的程式設計代理程式，請使用 `auto`：

```bash
openclaw config set tools.exec.mode auto
openclaw approvals get
openclaw gateway restart
```

然後驗證實際生效的原則：

```bash
openclaw exec-policy show
```

## OpenClaw 主機執行模式

`tools.exec.mode` 是主機 `exec` 的標準化原則介面。每種模式都會解析為底層的 `security`（允許清單嚴格程度）與 `ask`（未命中時提示）組合：

| 模式        | security / ask          | 行為                                                                                          | 適用情況                                              |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `deny`      | `deny` / `off`          | 完全封鎖主機執行。                                                                            | 不允許任何主機命令。                                  |
| `allowlist` | `allowlist` / `off`     | 僅執行允許清單中的命令；未命中時直接拒絕，不顯示提示。                                        | 你有一組已知安全的命令。                              |
| `ask`       | `allowlist` / `on-miss` | 執行符合允許清單的命令；未命中時詢問人工。                                                    | 每個新命令都應由人工審查。                            |
| `auto`      | `allowlist` / `on-miss` | 執行符合允許清單的命令；未命中時先送交自動審查，再回退至人工核准。                            | 程式設計工作階段需要實用且受保護的存取權。            |
| `full`      | `full` / `off`          | 執行主機命令時不顯示提示。                                                                    | 此受信任的主機／工作階段應略過核准關卡。              |

`ask` 與 `auto` 使用相同的允許清單／詢問設定；`auto` 會另外啟用原生自動審查器，由其自行判斷未命中項目，只有在無法安全核准時，才轉交至已設定的人工核准管道。

如需完整的主機執行原則、本機核准檔案、允許清單結構描述、安全執行檔及轉送行為，請參閱[執行核准](/zh-TW/tools/exec-approvals)。

## Codex Guardian 對應關係

對於原生 Codex 應用程式伺服器工作階段，當本機 Codex 需求允許時，`tools.exec.mode: "auto"` 會讓 Codex 採用由 Guardian 審查的核准流程。通常產生的值如下：

| Codex 欄位          | 通常的值          |
| ------------------- | ----------------- |
| `approvalPolicy`    | `on-request`      |
| `approvalsReviewer` | `auto_review`     |
| `sandbox`           | `workspace-write` |

`auto` 模式會強制採用此原則，覆寫任何已設定的 Codex 沙箱／核准覆寫值，因此不會保留舊有的不安全組合，例如 `approvalPolicy: "never"` 搭配 `sandbox: "danger-full-access"`。`tools.exec.mode: "deny"` 與 `"allowlist"` 會完全封鎖 Codex 應用程式伺服器的本機執行。只有在你刻意希望採用無須核准的運作方式時，才使用 `tools.exec.mode: "full"`。

如需應用程式伺服器設定、驗證順序及原生 Codex 執行階段的詳細資訊，請參閱 [Codex 執行框架](/zh-TW/plugins/codex-harness)。

## ACPX 執行框架權限

ACPX 工作階段為非互動式，因此無法在終端介面權限提示上進行點選。ACPX 使用 `plugins.entries.acpx.config` 下獨立的執行框架層級設定：

| 設定                        | 值              | 含義                                        |
| --------------------------- | --------------- | ------------------------------------------- |
| `permissionMode`            | `approve-reads` | 僅自動核准讀取操作。                        |
| `permissionMode`            | `approve-all`   | 自動核准寫入操作與殼層命令。                |
| `permissionMode`            | `deny-all`      | 拒絕所有權限提示。                          |
| `nonInteractivePermissions` | `fail`          | 需要提示時中止。                            |
| `nonInteractivePermissions` | `deny`          | 拒絕提示，並在可能的情況下繼續執行。        |

請將 ACPX 權限與 OpenClaw 執行核准分開設定：

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
openclaw gateway restart
```

將 `approve-all` 作為 ACPX 在緊急情況下使用的無提示執行框架工作階段等效模式。如需設定詳細資訊與失敗模式，請參閱 [ACP 代理程式設定](/zh-TW/tools/acp-agents-setup#permission-configuration)。

## 選擇模式

| 目標                                          | 設定                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| 完全封鎖主機命令                              | `tools.exec.mode: "deny"`                                   |
| 僅允許已知安全的命令執行                      | `tools.exec.mode: "allowlist"`                              |
| 每種新命令形式都詢問人工                      | `tools.exec.mode: "ask"`                                    |
| 在詢問人工前使用 Codex/OpenClaw 自動審查      | `tools.exec.mode: "auto"`                                   |
| 完全略過主機執行核准                          | `tools.exec.mode: "full"` 加上相符的主機核准檔案            |
| 允許非互動式 ACPX 工作階段寫入／執行          | `plugins.entries.acpx.config.permissionMode: "approve-all"` |

如果變更模式後，命令仍然顯示提示或執行失敗，請檢查兩個層級：

```bash
openclaw approvals get
openclaw exec-policy show
```

主機執行會採用 OpenClaw 設定與主機本機核准檔案兩者之中較嚴格的結果。ACPX 執行框架權限不會放寬主機執行核准，而主機執行核准也不會放寬 ACPX 執行框架提示。

## 相關內容

- [執行核准](/zh-TW/tools/exec-approvals)
- [執行核准－進階](/zh-TW/tools/exec-approvals-advanced)
- [Codex 執行框架](/zh-TW/plugins/codex-harness)
- [ACP 代理程式設定](/zh-TW/tools/acp-agents-setup#permission-configuration)
