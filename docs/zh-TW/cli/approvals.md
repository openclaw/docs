---
read_when:
    - 你想從命令列介面編輯執行核准設定
    - 你需要在閘道或節點主機上管理允許清單
summary: '`openclaw approvals` 與 `openclaw exec-policy` 的命令列介面參考資料'
title: 核准
x-i18n:
    generated_at: "2026-07-12T14:21:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

管理**本機主機**、**閘道主機**或**節點主機**的執行核准。未指定目標旗標時，命令會讀取／寫入磁碟上的本機核准檔案。使用 `--gateway` 指定閘道，或使用 `--node <id|name|ip>` 指定特定節點。

別名：`openclaw exec-approvals`

相關內容：[執行核准](/zh-TW/tools/exec-approvals)、[節點](/zh-TW/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是**僅限本機**的便利命令，可透過單一步驟讓所要求的 `tools.exec.*` 設定與本機主機核准檔案保持同步：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

預設集（`yolo`、`cautious`、`deny-all`）會一併套用 `host`、`security`、`ask` 和 `askFallback`。`set` 只會套用你傳入的旗標；每個接受的值都會經過驗證（`--host auto|sandbox|gateway|node`、`--security deny|allowlist|full`、`--ask off|on-miss|always`、`--ask-fallback deny|allowlist|full`）。

範圍：

- 同時更新本機設定檔和本機核准檔案；不會將原則推送至閘道或節點主機。
- `--host node` 會遭到拒絕：節點執行核准會在執行階段從節點擷取，因此本機 `exec-policy` 無法將其同步。請改用 `openclaw approvals set --node <id|name|ip>`。
- `exec-policy show` 會將 `host=node` 範圍標示為由節點在執行階段管理，而不是從本機核准檔案推導有效原則。

若要管理遠端主機核准，請直接使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get` 會顯示目標的有效執行原則：所要求的 `tools.exec` 原則、主機核准檔案原則，以及合併後的有效結果。具有主機原生原則的節點（例如 Windows 配套應用程式）會直接顯示該原則，而不會套用 OpenClaw 核准檔案的原則運算。

對於以檔案為基礎的節點，合併檢視需要由主機解析的原則快照。較舊的節點會將有效原則顯示為無法取得，而不會假設閘道所要求的原則也適用於主機。

<Note>
不包含每個工作階段的 `/exec` 覆寫。請在相關工作階段中執行 `/exec`，以檢查其目前的預設值。
</Note>

優先順序：

- 主機核准檔案是可強制執行的唯一事實來源。
- 所要求的 `tools.exec` 原則可以縮小或擴大意圖範圍，但有效結果是根據主機規則推導而來。
- `--node` 會結合節點主機核准檔案與閘道的 `tools.exec` 原則（兩者皆會在執行階段套用）。
- 如果無法取得閘道設定，命令列介面會改用節點核准快照，並註明無法計算最終的執行階段原則。

## 從檔案取代核准設定

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，而不僅限於嚴格的 JSON。請使用 `--file` 或 `--stdin`，不可同時使用兩者。

採用主機原生機制的 Windows 節點使用其自有的原則結構：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

命令列介面會先讀取節點目前的雜湊值，並在更新時一併傳送，因此同時進行的本機編輯會遭拒絕，而不會被覆寫。此操作會取代節點的完整規則清單，因此必須提供 `rules`；`defaultAction` 則為選填。若節點回報其原生原則已停用，就無法從遠端設定；請先在該主機上啟用或設定此原則。主機原生原則不支援 `allowlist add|remove` 輔助指令。

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

對於公開 OpenClaw 核准檔案的節點，請搭配 `openclaw approvals set --node <id|name|ip> --stdin` 使用相同內容。主機原生節點則需要使用上方所示的擁有者專屬格式。

這只會變更**主機核准檔案**。若要讓所要求的 OpenClaw 原則保持一致，也請設定：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

此處明確設定 `tools.exec.host=gateway`，因為 `host=auto` 仍表示「有可用的沙箱時使用沙箱，否則使用閘道」：YOLO 針對的是核准，而非路由。當你即使已設定沙箱，仍想在主機上執行時，請使用 `gateway`（或 `/exec host=gateway`）。

若省略 `askFallback`，其預設值為 `deny`。升級沒有使用者介面、且應維持永不提示行為的主機時，請明確設定 `askFallback: "full"`。

僅在本機上達成相同目的的本機捷徑：

```bash
openclaw exec-policy preset yolo
```

## 允許清單輔助指令

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 常用選項

`get`、`set` 和 `allowlist add|remove` 均支援：

- `--node <id|name|ip>`（可解析 ID、名稱、IP 或 ID 前綴；使用與 `openclaw nodes` 相同的解析器）
- `--gateway`
- 共用節點 RPC 選項：`--url`、`--token`、`--timeout`、`--json`

未指定目標旗標時，會使用磁碟上的本機核准檔案。

`allowlist add|remove` 也支援 `--agent <id>`（預設為 `"*"`，套用至所有代理程式）。

## 注意事項

- 節點主機必須公開 `system.execApprovals.get/set`（macOS 應用程式、無頭節點主機或 Windows 配套應用程式）。
- 核准檔案會按主機分別儲存在 OpenClaw 狀態目錄中：`$OPENCLAW_STATE_DIR/exec-approvals.json`；若未設定該變數，則為 `~/.openclaw/exec-approvals.json`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [執行核准](/zh-TW/tools/exec-approvals)
