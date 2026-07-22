---
read_when:
    - 你想從命令列介面編輯 exec 核准設定
    - 你需要在閘道或節點主機上管理允許清單
    - 你需要在沒有聊天介面的情況下列出或處理待核准項目
summary: '`openclaw approvals` 和 `openclaw exec-policy` 的命令列介面參考資料'
title: 核准
x-i18n:
    generated_at: "2026-07-22T10:27:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f8b6f198af718d7b058498dbb960a1eb68ced601e1cd9205070b7199688552d2
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

管理**本機主機**、**閘道主機**或**節點主機**的執行核准。未指定目標旗標時，命令會讀取或寫入磁碟上的本機核准檔案。使用 `--gateway` 指定閘道，或使用 `--node <id|name|ip>` 指定特定節點。

別名：`openclaw exec-approvals`

相關內容：[執行核准](/zh-TW/tools/exec-approvals)、[節點](/zh-TW/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是**僅限本機**的便利命令，可透過單一步驟，讓要求的 `tools.exec.*` 設定與本機主機核准檔案保持同步：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

預設集（`yolo`、`cautious`、`deny-all`）會一併套用 `host`、`security`、`ask` 和 `askFallback`。`set` 只會套用你傳入的旗標；每個接受的值都會經過驗證（`--host auto|sandbox|gateway|node`、`--security deny|allowlist|full`、`--ask off|on-miss|always`、`--ask-fallback deny|allowlist|full`）。

範圍：

- 同時更新本機設定檔和本機核准檔案；不會將政策推送至閘道或節點主機。
- `--host node` 會遭拒絕：節點執行核准是在執行階段從節點取得，因此本機 `exec-policy` 無法將其同步。請改用 `openclaw approvals set --node <id|name|ip>`。
- `exec-policy show` 會在執行階段將 `host=node` 範圍標示為由節點管理，而不是從本機核准檔案推導有效政策。

若要處理遠端主機核准，請直接使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
openclaw approvals pending
openclaw approvals resolve <id> <allow-once|allow-always|deny>
```

`get` 會顯示目標的有效執行政策：要求的 `tools.exec` 政策、主機核准檔案政策，以及合併後的有效結果。具備主機原生政策的節點（例如 Windows 輔助程式）會直接顯示該政策，而不套用 OpenClaw 核准檔案的政策計算。

對於以檔案為基礎的節點，合併檢視需要由主機解析的政策快照。較舊的節點會將有效政策顯示為無法取得，而不會假設閘道要求的政策也適用於主機。

<Note>
不包含每個工作階段的 `/exec` 覆寫。請在相關工作階段中執行 `/exec`，以檢查其目前的預設值。
</Note>

優先順序：

- 主機核准檔案是可強制執行的唯一真實來源。
- 要求的 `tools.exec` 政策可以縮小或擴大意圖範圍，但有效結果是根據主機規則推導而來。
- `--node` 會將節點主機核准檔案與閘道 `tools.exec` 政策結合（兩者都會在執行階段套用）。
- 如果無法取得閘道設定，命令列介面會退回使用節點核准快照，並註明無法計算最終的執行階段政策。

## 待處理的核准

列出閘道中待處理的執行、外掛和 OpenClaw 系統代理程式核准：

```bash
openclaw approvals pending
openclaw approvals pending --json
```

完整列舉及相應的全操作員 `resolve` 流程會使用 `operator.admin`，因為核准記錄在其他情況下會保留要求者／審查者篩選。解析作業也會要求專用的 `operator.approvals` 範圍。標準命令列介面操作員授權包含這兩個範圍；受限的第三方用戶端不應僅為了模擬此命令而要求管理員權限。

人類可讀輸出會顯示核准種類、代理程式／工作階段歸屬、要求已存在的時間、距離到期的時間、縮短的命令或摘要，以及不受殼層影響的 `id64_<base64url>` ID 權杖。精簡表格後一律會接著顯示 `Full request text` 區塊，其中包含每個完整權杖及經無損逸出的要求，因此終端寬度造成的縮短不會隱藏尾碼或解析所需的權杖。請將完整權杖複製到 `resolve`。其他欄位中的不安全終端字元會顯示為可見的 Unicode 逸出序列。JSON 輸出會在 `approvals` 下傳回正規化項目，並為指令碼保留原始的 `id`、`summary`、`createdAtMs` 和 `expiresAtMs`；除非原始 ID 使用保留的 `id64_` 顯示權杖前置字串，否則 `resolve` 仍會接受原始 ID。

如果提供的 `id64_` 值同時符合某個字面原始 ID，以及另一項核准的已解碼顯示權杖，命令列介面會因其語意不明而拒絕，而不冒險解析錯誤的要求。

使用完整 ID 解析一項核准：

```bash
openclaw approvals resolve <id> allow-once
openclaw approvals resolve <id> allow-always
openclaw approvals resolve <id> deny --reason "Not expected during maintenance"
```

命令列介面會讀取統一核准記錄以選取其種類、根據記錄允許的決定檢查要求的決定，然後呼叫統一解析器。第一次成功作出決定時會以 `0` 結束。重複已記錄的決定也會以 `0` 結束，並回報 `already resolved (same decision)`。若決定衝突、核准不存在、核准已到期，或該核准種類無法使用此決定，則會顯示明確錯誤並以非零狀態結束。

`--reason` 會在命令列介面確認訊息中加入本機備註。目前的閘道核准記錄沒有自由文字格式的解析原因欄位，因此不會保存此備註，也不會將其傳送至其他核准介面。

## 從檔案取代核准

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，而不僅限於嚴格 JSON。請使用 `--file` 或 `--stdin` 其中一個，不要同時使用兩者。

主機原生的 Windows 節點使用其自有的政策格式：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

命令列介面會先讀取節點目前的雜湊值，並在更新時一併傳送，因此同時進行的本機編輯會遭拒絕，而不會被覆寫。`rules` 是必要欄位，因為此作業會取代節點的完整規則清單；`defaultAction` 為選填。如果節點回報其原生政策已停用，便無法從遠端設定；請先在該主機上啟用或設定政策。主機原生政策不支援 `allowlist add|remove` 輔助工具。

## 「永不提示」／YOLO 範例

對於不應因執行核准而停止的主機，請將主機核准預設值設為 `full` + `off`：

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

對於公開 OpenClaw 核准檔案的節點，請搭配 `openclaw approvals set --node <id|name|ip> --stdin` 使用相同內容。主機原生節點則需要使用上方所示的所屬元件專用格式。

這只會變更**主機核准檔案**。若要讓要求的 OpenClaw 政策保持一致，還需設定：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.mode full
```

此處明確指定 `tools.exec.host=gateway`，因為 `host=auto` 的含義仍是「有可用沙箱時使用沙箱，否則使用閘道」：YOLO 處理的是核准，而非路由。即使已設定沙箱，若仍想使用主機執行，請使用 `gateway`（或 `/exec host=gateway`）。

省略 `askFallback` 時，預設為 `deny`。升級沒有使用者介面的主機且應維持永不提示行為時，請明確設定 `askFallback: "full"`。

僅限本機電腦、具有相同意圖的本機捷徑：

```bash
openclaw exec-policy preset yolo
```

## 允許清單輔助工具

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

未指定目標旗標時，表示磁碟上的本機核准檔案。

`allowlist add|remove` 也支援 `--agent <id>`（預設為 `"*"`，套用至所有代理程式）。

`pending` 和 `resolve` 一律使用閘道，因為待處理要求是即時的閘道狀態。它們支援共用閘道連線選項 `--url`、`--token` 和 `--timeout`；`pending` 也支援 `--json`。

## 注意事項

- 節點主機必須公告 `system.execApprovals.get/set`（macOS 應用程式、無頭節點主機或 Windows 輔助程式）。
- 每部主機的核准檔案都儲存在 OpenClaw 狀態目錄中：`$OPENCLAW_STATE_DIR/exec-approvals.json`；若未設定該變數，則為 `~/.openclaw/exec-approvals.json`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [執行核准](/zh-TW/tools/exec-approvals)
