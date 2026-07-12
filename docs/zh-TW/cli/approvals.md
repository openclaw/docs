---
read_when:
    - 你想從命令列介面編輯執行核准設定
    - 您需要在閘道或節點主機上管理允許清單
summary: '`openclaw approvals` 與 `openclaw exec-policy` 的命令列介面參考文件'
title: 核准
x-i18n:
    generated_at: "2026-07-11T21:10:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

管理**本機主機**、**閘道主機**或**節點主機**的執行核准。未指定目標旗標時，命令會讀寫磁碟上的本機核准檔案。使用 `--gateway` 指定閘道，或使用 `--node <id|name|ip>` 指定特定節點。

別名：`openclaw exec-approvals`

相關：[執行核准](/zh-TW/tools/exec-approvals)、[節點](/zh-TW/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是**僅限本機**的便利命令，可在單一步驟中讓要求的 `tools.exec.*` 設定與本機主機核准檔案保持同步：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

預設組合（`yolo`、`cautious`、`deny-all`）會一併套用 `host`、`security`、`ask` 與 `askFallback`。`set` 只會套用你傳入的旗標；每個接受的值都會經過驗證（`--host auto|sandbox|gateway|node`、`--security deny|allowlist|full`、`--ask off|on-miss|always`、`--ask-fallback deny|allowlist|full`）。

範圍：

- 同時更新本機設定檔與本機核准檔案；不會將政策推送至閘道或節點主機。
- `--host node` 會遭拒絕：節點執行核准是在執行階段從節點擷取，因此本機 `exec-policy` 無法同步這些核准。請改用 `openclaw approvals set --node <id|name|ip>`。
- `exec-policy show` 會將 `host=node` 範圍標示為在執行階段由節點管理，而不會根據本機核准檔案推導有效政策。

若要管理遠端主機核准，請直接使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` 會顯示目標的有效執行政策：要求的 `tools.exec` 政策、主機核准檔案政策，以及合併後的有效結果。具有主機原生政策的節點（例如 Windows 伴隨程式）會直接顯示該政策，而不會套用 OpenClaw 核准檔案的政策合併運算。

對於以檔案為基礎的節點，合併檢視需要由主機解析的政策快照。較舊的節點會將有效政策顯示為無法取得，而不會假設閘道要求的政策也適用於主機。

<Note>
不包含每個工作階段的 `/exec` 覆寫。請在相關工作階段中執行 `/exec`，以檢查其目前的預設值。
</Note>

優先順序：

- 主機核准檔案是可強制執行的唯一真實來源。
- 要求的 `tools.exec` 政策可以縮小或擴大意圖範圍，但有效結果是根據主機規則推導而得。
- `--node` 會結合節點主機核准檔案與閘道 `tools.exec` 政策（兩者都會在執行階段套用）。
- 如果無法取得閘道設定，命令列介面會改用節點核准快照，並註明無法計算最終的執行階段政策。

## 從檔案取代核准設定

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，而不僅限於嚴格 JSON。請使用 `--file` 或 `--stdin` 其中之一，不可同時使用。

使用主機原生政策的 Windows 節點採用其自有的政策格式：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

命令列介面會先讀取節點目前的雜湊值，並隨更新一併傳送，因此同時進行的本機編輯會遭拒絕，而不會被覆寫。由於此操作會取代節點的完整規則清單，因此 `rules` 為必填；`defaultAction` 為選填。若節點回報其原生政策已停用，便無法從遠端設定；請先在該主機上啟用或設定政策。主機原生政策不支援 `allowlist add|remove` 輔助命令。

## 「永不提示」／YOLO 範例

對於不應因執行核准而停止的主機，將主機核准預設值設為 `full` + `off`：

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

對於公開 OpenClaw 核准檔案的節點，請將相同內容搭配 `openclaw approvals set --node <id|name|ip> --stdin` 使用。主機原生節點需要使用上方所示、由其擁有者定義的格式。

這只會變更**主機核准檔案**。若要讓要求的 OpenClaw 政策保持一致，另請設定：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

此處明確設定 `tools.exec.host=gateway`，因為 `host=auto` 仍表示「有沙箱時使用沙箱，否則使用閘道」：YOLO 著重於核准，而非路由。若即使已設定沙箱仍希望在主機上執行，請使用 `gateway`（或 `/exec host=gateway`）。

省略 `askFallback` 時，預設為 `deny`。升級沒有使用者介面的主機，且該主機應維持永不提示的行為時，請明確設定 `askFallback: "full"`。

僅限本機電腦、具有相同意圖的本機捷徑：

```bash
openclaw exec-policy preset yolo
```

## 允許清單輔助命令

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 常用選項

`get`、`set` 與 `allowlist add|remove` 均支援：

- `--node <id|name|ip>`（可解析 ID、名稱、IP 或 ID 前綴；使用與 `openclaw nodes` 相同的解析器）
- `--gateway`
- 共用節點 RPC 選項：`--url`、`--token`、`--timeout`、`--json`

未指定目標旗標時，使用磁碟上的本機核准檔案。

`allowlist add|remove` 也支援 `--agent <id>`（預設為 `"*"`，套用至所有代理程式）。

## 注意事項

- 節點主機必須宣告支援 `system.execApprovals.get/set`（macOS 應用程式、無介面節點主機或 Windows 伴隨程式）。
- 核准檔案會依主機分別儲存在 OpenClaw 狀態目錄中：`$OPENCLAW_STATE_DIR/exec-approvals.json`；若未設定該變數，則為 `~/.openclaw/exec-approvals.json`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [執行核准](/zh-TW/tools/exec-approvals)
