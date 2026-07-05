---
read_when:
    - 你想要從命令列介面編輯 exec 核准
    - 您需要在閘道或節點主機上管理允許清單
summary: '`openclaw approvals` 和 `openclaw exec-policy` 的命令列介面參考'
title: 核准
x-i18n:
    generated_at: "2026-07-05T11:09:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 30e1f55104d5f762d7eec95f2bba5e0cc52acb3005255aa9fd5c121fb959a0e7
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

管理**本機主機**、**閘道主機**或**節點主機**的 exec 核准。沒有目標旗標時，命令會讀寫磁碟上的本機核准檔案。使用 `--gateway` 以閘道為目標，或使用 `--node <id|name|ip>` 以特定節點為目標。

別名：`openclaw exec-approvals`

相關：[Exec 核准](/zh-TW/tools/exec-approvals)、[節點](/zh-TW/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是**僅限本機**的便利命令，可在一個步驟中讓要求的 `tools.exec.*` 設定與本機主機核准檔案保持同步：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

預設集（`yolo`、`cautious`、`deny-all`）會一併套用 `host`、`security`、`ask` 和 `askFallback`。`set` 只會套用你傳入的旗標；每個可接受值都會經過驗證（`--host auto|sandbox|gateway|node`、`--security deny|allowlist|full`、`--ask off|on-miss|always`、`--ask-fallback deny|allowlist|full`）。

範圍：

- 同時更新本機設定檔和本機核准檔；不會將政策推送到閘道或節點主機。
- `--host node` 會被拒絕：節點 exec 核准會在執行階段從節點擷取，因此本機 `exec-policy` 無法同步它們。請改用 `openclaw approvals set --node <id|name|ip>`。
- `exec-policy show` 會將 `host=node` 範圍標記為執行階段由節點管理，而不是從本機核准檔推導有效政策。

若要設定遠端主機核准，請直接使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` 會顯示目標的有效 exec 政策：要求的 `tools.exec` 政策、主機核准檔政策，以及合併後的有效結果。

優先順序：

- 主機核准檔是可強制執行的事實來源。
- 要求的 `tools.exec` 政策可以縮小或擴大意圖，但有效結果會從主機規則推導。
- `--node` 會將節點主機核准檔與閘道 `tools.exec` 政策結合（兩者都會在執行階段套用）。
- 如果閘道設定無法使用，命令列介面會退回使用節點核准快照，並註明無法計算最終執行階段政策。

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

將主機核准預設值設為 `full` + `off`，用於不應因 exec 核准而停止的主機：

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

節點變體：使用相同內容搭配 `openclaw approvals set --node <id|name|ip> --stdin`。

這只會變更**主機核准檔**。若要讓要求的 OpenClaw 政策保持一致，也請設定：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

這裡明確使用 `tools.exec.host=gateway`，因為 `host=auto` 仍表示「有沙盒時使用沙盒，否則使用閘道」：YOLO 是關於核准，而不是路由。當你即使已設定沙盒也想使用主機 exec 時，請使用 `gateway`（或 `/exec host=gateway`）。

省略的 `askFallback` 預設為 `deny`。升級不應提示的無 UI 主機時，請明確設定 `askFallback: "full"`，以保留永不提示行為。

相同意圖的本機捷徑，僅適用於本機：

```bash
openclaw exec-policy preset yolo
```

## allowlist 輔助工具

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 常用選項

`get`、`set` 和 `allowlist add|remove` 都支援：

- `--node <id|name|ip>`（解析 id、名稱、IP 或 id 前綴；與 `openclaw nodes` 使用相同解析器）
- `--gateway`
- 共用節點 RPC 選項：`--url`、`--token`、`--timeout`、`--json`

沒有目標旗標時，表示磁碟上的本機核准檔。

`allowlist add|remove` 也支援 `--agent <id>`（預設為 `"*"`，套用到所有代理程式）。

## 備註

- 節點主機必須公告 `system.execApprovals.get/set`（macOS app 或 headless 節點主機）。
- 核准檔會依主機儲存在 OpenClaw 狀態目錄中：`$OPENCLAW_STATE_DIR/exec-approvals.json`，或在未設定該變數時使用 `~/.openclaw/exec-approvals.json`。

## 相關

- [命令列介面參考](/zh-TW/cli)
- [Exec 核准](/zh-TW/tools/exec-approvals)
