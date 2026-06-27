---
read_when:
    - 你想要從命令列介面編輯 exec 核准
    - 你需要在閘道或節點主機上管理允許清單
summary: '`openclaw approvals` 和 `openclaw exec-policy` 的命令列介面參考'
title: 核准
x-i18n:
    generated_at: "2026-06-27T19:03:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

管理**本機主機**、**閘道主機**或**節點主機**的 exec 核准。
預設情況下，命令會以磁碟上的本機核准檔案為目標。使用 `--gateway` 以閘道為目標，或使用 `--node` 以特定節點為目標。

別名：`openclaw exec-approvals`

相關：

- Exec 核准：[Exec 核准](/zh-TW/tools/exec-approvals)
- 節點：[節點](/zh-TW/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是本機便利命令，可用來一步保持要求的
`tools.exec.*` 設定與本機主機核准檔案一致。

在你想要以下操作時使用它：

- 檢查本機要求的原則、主機核准檔案，以及有效合併結果
- 套用本機預設集，例如 YOLO 或 deny-all
- 同步本機 `tools.exec.*` 與本機主機核准檔案

範例：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

輸出模式：

- 無 `--json`：列印人類可讀的表格檢視
- `--json`：列印機器可讀的結構化輸出

目前範圍：

- `exec-policy` **僅限本機**
- 它會同時更新本機設定檔與本機核准檔案
- 它**不會**將原則推送到閘道主機或節點主機
- `--host node` 在此命令中會被拒絕，因為節點 exec 核准是在執行階段從節點擷取，必須改透過以節點為目標的核准命令管理
- `openclaw exec-policy show` 會將 `host=node` 範圍標示為執行階段由節點管理，而不是從本機核准檔案推導有效原則

如果你需要直接編輯遠端主機核准，請繼續使用 `openclaw approvals set --gateway`
或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`openclaw approvals get` 現在會顯示本機、閘道與節點目標的有效 exec 原則：

- 要求的 `tools.exec` 原則
- 主機核准檔案原則
- 套用優先順序規則後的有效結果

優先順序是刻意設計的：

- 主機核准檔案是可強制執行的真實來源
- 要求的 `tools.exec` 原則可以縮小或放寬意圖，但有效結果仍由主機規則推導
- `--node` 會結合節點主機核准檔案與閘道 `tools.exec` 原則，因為兩者在執行階段仍然適用
- 如果無法取得閘道設定，命令列介面會退回使用節點核准快照，並註明無法計算最終執行階段原則

## 從檔案取代核准

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，不只接受嚴格 JSON。請使用 `--file` 或 `--stdin` 其中之一，不要同時使用。

##「永不提示」/ YOLO 範例

對於不應因 exec 核准而停止的主機，請將主機核准預設值設為 `full` + `off`：

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

節點變體：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

這只會變更**主機核准檔案**。若要讓要求的 OpenClaw 原則保持一致，還要設定：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

此範例中為何使用 `tools.exec.host=gateway`：

- `host=auto` 仍表示「可用時使用沙盒，否則使用閘道」。
- YOLO 是關於核准，而不是路由。
- 如果你希望即使已設定沙盒仍使用主機 exec，請用 `gateway` 或 `/exec host=gateway` 明確指定主機選擇。

省略的 `askFallback` 預設為 `deny`。升級應保持永不提示行為的無 UI 主機時，請明確設定 `askFallback: "full"`。

本機捷徑：

```bash
openclaw exec-policy preset yolo
```

該本機捷徑會同時更新要求的本機 `tools.exec.*` 設定與
本機核准預設值。其意圖等同於上述手動兩步驟設定，但僅適用於本機。

## 允許清單輔助工具

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 常用選項

`get`、`set` 與 `allowlist add|remove` 都支援：

- `--node <id|name|ip>`
- `--gateway`
- 共用節點 RPC 選項：`--url`、`--token`、`--timeout`、`--json`

目標指定注意事項：

- 沒有目標旗標表示使用磁碟上的本機核准檔案
- `--gateway` 以閘道主機核准檔案為目標
- `--node` 會在解析 id、名稱、IP 或 id 前綴後，以一個節點主機為目標

`allowlist add|remove` 也支援：

- `--agent <id>`（預設為 `*`）

## 注意事項

- `--node` 使用與 `openclaw nodes` 相同的解析器（id、名稱、ip 或 id 前綴）。
- `--agent` 預設為 `"*"`，套用於所有代理。
- 節點主機必須公告 `system.execApprovals.get/set`（macOS app 或無頭節點主機）。
- 核准檔案會依主機儲存在 OpenClaw 狀態目錄中
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`，或
  變數未設定時的 `~/.openclaw/exec-approvals.json`)。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Exec 核准](/zh-TW/tools/exec-approvals)
