---
read_when:
    - 你想要從命令列介面編輯執行核准設定
    - 你需要在閘道或節點主機上管理允許清單
    - 你需要在沒有聊天介面的情況下列出或處理待核准項目
summary: '`openclaw approvals` 和 `openclaw exec-policy` 的命令列介面參考資料'
title: 核准
x-i18n:
    generated_at: "2026-07-19T13:38:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 739d9521dc625571affe1590d5bb2511560029ac6f007b2a422f0606bdb90059
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

管理**本機主機**、**閘道主機**或**節點主機**的 exec 核准。若未指定目標旗標，命令會讀取或寫入磁碟上的本機核准檔案。使用 `--gateway` 指定閘道，或使用 `--node <id|name|ip>` 指定特定節點。

別名：`openclaw exec-approvals`

相關內容：[Exec 核准](/zh-TW/tools/exec-approvals)、[節點](/zh-TW/nodes)

## `openclaw exec-policy`

`openclaw exec-policy` 是**僅限本機**的便利命令，可一次讓要求的 `tools.exec.*` 設定與本機主機核准檔案保持同步：

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

預設集（`yolo`、`cautious`、`deny-all`）會一併套用 `host`、`security`、`ask` 和 `askFallback`。`set` 僅套用你傳入的旗標；每個接受的值都會經過驗證（`--host auto|sandbox|gateway|node`、`--security deny|allowlist|full`、`--ask off|on-miss|always`、`--ask-fallback deny|allowlist|full`）。

範圍：

- 同時更新本機設定檔和本機核准檔案；不會將原則推送至閘道或節點主機。
- `--host node` 會遭拒絕：節點 exec 核准是在執行階段從節點擷取，因此本機 `exec-policy` 無法同步這些核准。請改用 `openclaw approvals set --node <id|name|ip>`。
- `exec-policy show` 會在執行階段將 `host=node` 範圍標記為由節點管理，而不是從本機核准檔案推導有效原則。

若要管理遠端主機核准，請直接使用 `openclaw approvals set --gateway` 或 `openclaw approvals set --node <id|name|ip>`。

## 常用命令

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
openclaw approvals pending
openclaw approvals resolve <id> <allow-once|allow-always|deny>
```

`get` 會顯示目標的有效 exec 原則：要求的 `tools.exec` 原則、主機核准檔案原則，以及合併後的有效結果。具有主機原生原則的節點（例如 Windows companion）會直接顯示該原則，而不會套用 OpenClaw 核准檔案的原則運算。

對於以檔案為後端的節點，合併檢視需要由主機解析的原則快照。較舊的節點會將有效原則顯示為無法取得，而不會假設閘道要求的原則也適用於主機。

<Note>
不包含每個工作階段的 `/exec` 覆寫。請在相關工作階段中執行 `/exec`，以檢查其目前的預設值。
</Note>

優先順序：

- 主機核准檔案是可強制執行的真實來源。
- 要求的 `tools.exec` 原則可以縮小或擴大意圖，但有效結果是從主機規則推導而來。
- `--node` 會結合節點主機核准檔案與閘道 `tools.exec` 原則（兩者都會在執行階段套用）。
- 如果無法取得閘道設定，命令列介面會退回使用節點核准快照，並註明無法計算最終的執行階段原則。

## 待處理核准

列出閘道中待處理的 exec、外掛和 OpenClaw 系統代理程式核准：

```bash
openclaw approvals pending
openclaw approvals pending --json
```

完整列舉及相符的全操作員 `resolve` 流程會使用 `operator.admin`，因為否則核准記錄會保留要求者／審查者篩選。解析作業也會要求專用的 `operator.approvals` 範圍。標準命令列介面操作員授權包含這兩個範圍；受限的第三方用戶端不應只為了模擬此命令而要求管理員權限。

人類可讀輸出會顯示核准種類、代理程式／工作階段歸屬、要求經過時間、距離到期的時間、縮短的命令或摘要，以及不受殼層影響的 `id64_<base64url>` ID 權杖。精簡表格之後一律會有 `Full request text` 區塊，其中包含每個完整權杖及經無損逸出的要求，因此終端寬度造成的縮短不會隱藏後綴，或隱藏解析所需的權杖。請將完整權杖複製到 `resolve`。其他欄位中的不安全終端字元會顯示為可見的 Unicode 逸出序列。JSON 輸出會在 `approvals` 下傳回正規化項目，並為指令碼保留原始的 `id`、`summary`、`createdAtMs` 和 `expiresAtMs`；除非原始 ID 使用保留的 `id64_` 顯示權杖前綴，否則 `resolve` 仍會接受原始 ID。

如果提供的 `id64_` 值同時符合一筆核准的字面原始 ID，以及另一筆核准解碼後的顯示權杖，命令列介面會以有歧義為由拒絕該值，而不會冒險解析錯誤的要求。

依完整 ID 解析一筆核准：

```bash
openclaw approvals resolve <id> allow-once
openclaw approvals resolve <id> allow-always
openclaw approvals resolve <id> deny --reason "Not expected during maintenance"
```

命令列介面會讀取統一核准記錄以選取其種類、依記錄允許的決策檢查要求的決策，然後呼叫統一解析器。第一次成功決策會以 `0` 結束。重複記錄中的決策也會以 `0` 結束，並回報 `already resolved (same decision)`。衝突的決策、缺少的核准、已到期的核准，或該核准種類無法使用的決策，都會列印清楚的錯誤並以非零狀態結束。

`--reason` 會在命令列介面確認訊息中新增本機備註。目前的閘道核准記錄沒有自由文字的解析原因欄位，因此不會保存此備註，也不會將其傳送至其他核准介面。

## 從檔案取代核准

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set` 接受 JSON5，不僅限於嚴格 JSON。請使用 `--file` 或 `--stdin` 其中之一，不要同時使用兩者。

主機原生 Windows 節點使用自己的原則格式：

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

命令列介面會先讀取節點目前的雜湊值，並隨更新一併傳送，因此同時進行的本機編輯會遭拒絕，而不會被覆寫。`rules` 是必要項目，因為此作業會取代節點的完整規則清單；`defaultAction` 則為選用項目。若節點回報其原生原則已停用，便無法從遠端進行設定；請先在該主機上啟用或設定原則。主機原生原則不支援 `allowlist add|remove` 輔助程式。

## 「永不提示」／YOLO 範例

若主機不應因 exec 核准而停止，請將其主機核准預設值設為 `full` + `off`：

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

對於公開 OpenClaw 核准檔案的節點，請搭配 `openclaw approvals set --node <id|name|ip> --stdin` 使用相同內容。主機原生節點需要使用上方所示的擁有者專屬格式。

這只會變更**主機核准檔案**。若要讓要求的 OpenClaw 原則保持一致，還需設定：

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

此處明確指定 `tools.exec.host=gateway`，因為 `host=auto` 仍表示「可用時使用沙箱，否則使用閘道」：YOLO 著重於核准，而非路由。若即使已設定沙箱仍要使用主機 exec，請使用 `gateway`（或 `/exec host=gateway`）。

省略 `askFallback` 時，預設為 `deny`。升級不具 UI 且應保持永不提示行為的主機時，請明確設定 `askFallback: "full"`。

僅在本機電腦上表達相同意圖的本機捷徑：

```bash
openclaw exec-policy preset yolo
```

## 允許清單輔助程式

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 常用選項

`get`、`set` 和 `allowlist add|remove` 均支援：

- `--node <id|name|ip>`（解析 ID、名稱、IP 或 ID 前綴；與 `openclaw nodes` 使用相同解析器）
- `--gateway`
- 共用節點 RPC 選項：`--url`、`--token`、`--timeout`、`--json`

未指定目標旗標時，會使用磁碟上的本機核准檔案。

`allowlist add|remove` 也支援 `--agent <id>`（預設為 `"*"`，套用至所有代理程式）。

`pending` 和 `resolve` 一律使用閘道，因為待處理要求是即時閘道狀態。兩者支援共用閘道連線選項 `--url`、`--token` 和 `--timeout`；`pending` 也支援 `--json`。

## 注意事項

- 節點主機必須公布 `system.execApprovals.get/set`（macOS 應用程式、無頭節點主機或 Windows companion）。
- 核准檔案會依主機儲存在 OpenClaw 狀態目錄中：`$OPENCLAW_STATE_DIR/exec-approvals.json`；若未設定該變數，則為 `~/.openclaw/exec-approvals.json`。

## 相關內容

- [命令列介面參考](/zh-TW/cli)
- [Exec 核准](/zh-TW/tools/exec-approvals)
