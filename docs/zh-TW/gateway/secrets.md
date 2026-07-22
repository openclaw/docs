---
read_when:
    - 設定供應商認證資訊與 `auth-profiles.json` 參照的 SecretRefs
    - 在正式環境中安全地重新載入、稽核、設定及套用機密資訊
    - 了解啟動時快速失敗、非啟用介面篩選，以及最後已知良好狀態的行為
sidebarTitle: Secrets management
summary: 機密管理：SecretRef 合約、執行階段快照行為與安全的單向清除作業
title: 密鑰管理
x-i18n:
    generated_at: "2026-07-22T10:35:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d10989ebbce367c68d28768244d4e3649028af5ab63c9523974352c270a3c55e
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支援可增量採用的 SecretRefs，因此受支援的認證資訊不需要以純文字形式存放於設定中。

<Note>
純文字仍然可用。SecretRefs 可針對每項認證資訊選擇性啟用。
</Note>

<Warning>
如果純文字認證資訊位於代理程式可檢查的檔案中，代理程式仍可讀取，包括 `openclaw.json`、`auth-profiles.json`、`.env` 或產生的 `agents/*/agent/models.json` 檔案。只有在所有受支援的認證資訊都完成遷移，且 `openclaw secrets audit --check` 回報沒有純文字殘留後，SecretRefs 才能降低這類本機影響範圍。
</Warning>

## 執行階段模型

- 密鑰會在啟用期間立即解析至記憶體內的執行階段快照，而不是在請求路徑上延遲解析。
- 冷啟動閘道時，如果已知的非閘道擁有者支援隔離，則可重試的 SecretRef 失敗會被隔離至該擁有者。已對應的擁有者類別包括模型供應商與 Skills、媒體／TTS／排程供應商、符合條件的驗證設定檔、各代理程式的記憶體、沙箱 SSH、頻道帳號，以及資訊清單所宣告的外掛路由。閘道會啟動、將該擁有者記錄為已設定但無法使用，並發出經遮蔽的降級警告。閘道輸入驗證、結構無效的參照或解析值、故障時關閉的擁有者，以及執行階段擁有者未對應的參照，仍會導致啟動失敗。
- 重新載入會獨立驗證每個已對應的擁有者，然後發布單一原子快照。健康的擁有者會重新整理。只有當符合條件但失敗的擁有者，其參照身分、供應商定義及完整的非密鑰擁有者合約皆未變更時，才會保留最後已知的有效值並進入過期狀態；已變更或新增但失敗的擁有者會進入冷狀態。嚴格失敗會拒絕重新載入，並保留目前使用中的快照。
- 政策違規（例如將 OAuth 模式的驗證設定檔與 SecretRef 輸入搭配使用）會在切換執行階段之前導致啟用失敗。
- 執行階段請求只會讀取目前使用中的記憶體內快照。模型供應商的 SecretRef 認證資訊會以程序本機哨兵值的形式，經由驗證儲存空間和串流選項傳遞，直到輸出為止。對外傳送路徑（Discord 回覆／討論串傳送、Telegram 動作傳送）也會讀取該快照，不會在每次傳送時重新解析參照。

這可避免密鑰供應商中斷影響高頻請求路徑。

閘道輸入保護、結構無效的設定或解析值、政策違規，以及未知的擁有權，仍會在失敗時關閉。遭隔離的擁有者絕不會改用優先順序較低的認證資訊來源。

## 輸出時注入（哨兵值）

對於由 SecretRefs 支援的模型供應商認證資訊，OpenClaw 會在解析模型驗證時建立不透明的程序本機哨兵值。因此，驗證儲存空間、串流選項、SDK 設定、日誌、錯誤物件，以及大多數執行階段內省功能看到的會是 `oc-sent-v1-...` 之類的值，而非供應商認證資訊。受保護的模型擷取與受管理的本機供應商健康狀態探測，會在每個請求即將離開程序之前，取代 URL 和標頭值中的已知哨兵值。

未知的哨兵值格式會在網路活動開始前於失敗時關閉。OpenClaw 會拒絕傳送請求，而不會將尚未解析的哨兵值轉送給供應商。解析後的密鑰值也會登錄至精確值日誌遮蔽機制，作為縱深防禦措施。

供應商配接器會使用其 SDK 支援的最末端注入點：

- 具有自訂 fetch 選項的 SDK 會接收 OpenClaw 的受保護 fetch，因此 SDK 會保留哨兵值。
- 沒有自訂 fetch 選項的 SDK 會在建構用戶端之前立即解開哨兵值。外掛擁有的供應商串流和代理程式控管器會在最後一個由核心擁有的交接點解開哨兵值，因為這些傳輸不共用 OpenClaw 的受保護 fetch。

哨兵值可減少模型呼叫鏈中的純文字暴露，但不提供程序隔離。真實值仍存在於同一程序的記憶體中，並會出現在最終的配接器邊界。未透過 SecretRefs 設定的純文字環境認證資訊仍為純文字，不屬於此機制的範圍。

將 `OPENCLAW_SECRET_SENTINELS=off` 設為 `0` 或 `false`（不區分大小寫），即可在事件回應或相容性疑難排解期間停用哨兵值建立。此緊急停止開關不會停用精確值遮蔽登錄。

## 代理程式存取邊界

SecretRefs 可防止認證資訊持久儲存於設定和產生的模型檔案中，但並不是程序隔離邊界。如果純文字認證資訊仍留在磁碟上代理程式可讀取的路徑中，仍可透過檔案或殼層工具讀取，繞過 API 層級的遮蔽。

對於將代理程式可存取檔案納入考量的正式環境部署，只有在以下條件全數成立時，才應將遷移視為完成：

- 受支援的認證資訊使用 SecretRefs，而不是純文字值。
- 已清除 `openclaw.json`、`auth-profiles.json`、`.env` 和產生的 `models.json` 檔案中的舊版純文字殘留。
- 遷移後的 `openclaw secrets audit --check` 為乾淨狀態。
- 任何剩餘的不受支援或輪替中認證資訊，均受到作業系統隔離、容器隔離或外部認證資訊 Proxy 的保護。

這正是稽核／設定／套用工作流程屬於安全性遷移閘門，而不只是便利輔助工具的原因。

<Warning>
SecretRefs 無法讓任意可讀取的檔案變得安全。備份、複製的設定、舊的產生模型目錄，以及不受支援的認證資訊類別，在遭到刪除、移出代理程式信任邊界或另行隔離之前，仍屬於正式環境密鑰。
</Warning>

## 使用中介面篩選

SecretRefs 只會在實際使用中的介面上進行驗證：

- **已啟用的介面**：對已對應且可隔離的擁有者發生可重試失敗時，會進入冷或過期降級狀態。嚴格、故障時關閉、閘道必要或未對應的失敗，會阻止啟動／重新載入。
- **未使用的介面**：尚未解析的參照不會阻止啟動／重新載入；它們會發出非致命的 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 診斷。

<Accordion title="未使用介面的範例">
- 已停用的頻道／帳號項目。
- 沒有任何已啟用帳號繼承的頂層頻道認證資訊。
- 已停用的工具／功能介面。
- 未由 `tools.web.search.provider` 選取的網頁搜尋供應商專用金鑰。在自動模式（未設定供應商）中，系統會依優先順序查詢金鑰以進行自動偵測，直到其中一個解析成功；選取後，未選取供應商的金鑰會成為未使用狀態。
- 沙箱 SSH 驗證資料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，以及各代理程式的覆寫值）只有在預設代理程式或已啟用代理程式的實際沙箱後端為 `ssh`，且沙箱模式不是 `off` 時，才會處於使用中狀態。
- `gateway.remote.token`／`gateway.remote.password` SecretRefs 在符合以下任一條件時處於使用中狀態：
  - `gateway.mode=remote`
  - 已設定 `gateway.remote.url`
  - `gateway.tailscale.mode` 為 `serve` 或 `funnel`
  - 在沒有這些遠端介面的本機模式中：當權杖驗證可能獲勝，且未設定環境／驗證權杖時，`gateway.remote.token` 處於使用中狀態；只有當密碼驗證可能獲勝，且未設定環境／驗證密碼時，`gateway.remote.password` 才處於使用中狀態。
- 設定 `OPENCLAW_GATEWAY_TOKEN` 時，`gateway.auth.token` SecretRef 對啟動驗證解析而言處於未使用狀態，因為該執行階段會優先採用環境權杖輸入。

</Accordion>

## 閘道驗證介面診斷

在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上設定 SecretRef 時，閘道啟動／重新載入會以代碼 `SECRETS_GATEWAY_AUTH_SURFACE` 記錄介面狀態：

- `active`：SecretRef 是實際驗證介面的一部分，且必須成功解析。
- `inactive`：另一個驗證介面優先，或遠端驗證已停用／未處於使用中狀態。

日誌項目包含使用中介面政策採用該判定的原因。

## 初始設定參照預檢

在互動式初始設定中，選擇 SecretRef 儲存方式會在儲存前執行預檢驗證：

- 環境參照：驗證環境變數名稱，並確認設定期間可存取非空值。
- 供應商參照（`file` 或 `exec`）：驗證供應商選擇、解析 `id`，並檢查解析值的型別。
- 快速入門流程：當 `gateway.auth.token` 已是 SecretRef 時，初始設定會使用相同的快速失敗閘門，在探測／儀表板啟動之前解析該值（適用於 `env`、`file` 和 `exec` 參照）。

驗證失敗時會顯示錯誤，並讓你重試。

## SecretRef 合約

所有位置都使用同一種物件形狀：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    SecretInput 欄位也接受簡寫字串：

    ```json5
    "${OPENAI_API_KEY}"
    "$OPENAI_API_KEY"
    ```

    驗證：

    - `provider` 必須符合 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必須符合 `^[A-Z][A-Z0-9_]{0,127}$`

  </Tab>
  <Tab title="file">
    ```json5
    { source: "file", provider: "filemain", id: "/providers/openai/apiKey" }
    ```

    驗證：

    - `provider` 必須符合 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必須是絕對 JSON 指標（`/...`），或對 `singleValue` 供應商使用常值 `value`
    - 區段中的 RFC 6901 跳脫：`~` 會變成 `~0`，`/` 會變成 `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    驗證：

    - `provider` 必須符合 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必須符合 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支援 `secret#json_key` 等選取器）
    - `id` 不得包含 `.` 或 `..` 作為以斜線分隔的路徑區段（例如 `a/../b` 會遭到拒絕）

  </Tab>
</Tabs>

## 供應商設定

在 `secrets.providers` 下定義供應商：

```json5
{
  secrets: {
    providers: {
      default: { source: "env" },
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json", // or "singleValue"
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        args: ["--profile", "prod"],
        passEnv: ["PATH", "VAULT_ADDR"],
        jsonOnly: true,
      },
      "team-secrets": {
        source: "exec",
        pluginIntegration: {
          pluginId: "acme-secrets",
          integrationId: "secret-store",
        },
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

<Accordion title="環境供應商">
- 可透過 `allowlist` 設定選用的名稱完全相符允許清單。
- 環境值缺少或為空時，解析會失敗。

</Accordion>

<Accordion title="檔案供應商">
- 讀取 `path` 的本機檔案。
- `mode: "json"`（預設）預期 JSON 物件承載內容，並將 `id` 解析為 JSON 指標。
- `mode: "singleValue"` 預期參照 ID 為 `"value"`，並傳回原始檔案內容（移除尾端換行符號）。
- 路徑必須通過擁有權／權限檢查；`timeoutMs`（預設為 5000）和 `maxBytes`（預設為 1 MiB）會限制讀取。
- Windows 會在失敗時關閉：如果無法驗證該路徑的 ACL，解析就會失敗。僅限受信任的路徑，可在該供應商上設定 `allowInsecurePath: true` 以略過檢查。

</Accordion>

<Accordion title="Exec 提供者">
- 直接執行已設定的絕對二進位檔路徑，不使用殼層。
- 依預設，`command` 必須是一般檔案，而非符號連結。設定 `allowSymlinkCommand: true` 可允許符號連結命令路徑（例如 Homebrew 墊片），並搭配 `trustedDirs`（例如 `["/opt/homebrew"]`），使其僅接受套件管理器路徑。
- 支援 `timeoutMs`（預設為 5000）、`noOutputTimeoutMs`（預設等於 `timeoutMs`）、`maxOutputBytes`（預設為 1 MiB）、`env`/`passEnv` 允許清單，以及 `trustedDirs`。
- `jsonOnly` 預設為 `true`。使用 `jsonOnly: false` 且僅請求單一 ID 時，會接受非 JSON 的純文字標準輸出作為該 ID 的值。
- Windows 採失敗時關閉：如果無法驗證命令路徑的 ACL，解析就會失敗。僅針對受信任的路徑，可在該提供者上設定 `allowInsecurePath: true` 以略過檢查。
- 由外掛管理的 Exec 提供者可以使用 `pluginIntegration`，無須複製 `command`/`args`。OpenClaw 會在啟動／重新載入期間，從已安裝的外掛資訊清單解析目前的命令詳細資料；如果外掛遭停用、移除、不受信任，或不再宣告該整合，該提供者上的作用中 SecretRef 會採失敗時關閉。

請求承載資料（標準輸入）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

回應承載資料（標準輸出）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

選用的逐 ID 錯誤：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` 是選用的機器可讀診斷資訊。OpenClaw 會顯示可辨識的
代碼 `NOT_FOUND` 和 `AMBIGUOUS_DUPLICATE_KEY`，以及提供者和參照 ID。基於 protocol-v1 相容性，也會接受其他
代碼和 `message` 等自由格式欄位，
但不會顯示，因為解析器輸出可能包含認證資訊材料。

</Accordion>

## 檔案型 API 金鑰

請勿將 `file:...` 字串放在設定的 `env` 區塊中。該區塊是常值且不可覆寫，因此絕不會在其中解析 `file:...`。

請改在支援的認證資訊欄位上使用檔案 SecretRef：

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

對於 `mode: "singleValue"`，SecretRef `id` 是 `"value"`。對於 `mode: "json"`，請使用絕對 JSON 指標，例如 `"/providers/xai/apiKey"`。

如需瞭解接受 SecretRef 的欄位，請參閱 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。

## Exec 整合範例

如需涵蓋服務帳戶、隨附的代理程式 skill 與疑難排解的專用 1Password 指南，請參閱 [1Password](/zh-TW/gateway/1password)。

<AccordionGroup>
  <Accordion title="1Password 命令列介面">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // Homebrew 符號連結二進位檔所需
            trustedDirs: ["/opt/homebrew"],
            args: ["read", "op://Personal/OpenClaw QA API Key/password"],
            passEnv: ["HOME"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "onepassword_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="Bitwarden Secrets Manager (`bws`)">
    使用解析器包裝程式，將 SecretRef ID 對應至 Bitwarden Secrets Manager 項目金鑰。儲存庫包含 `scripts/secrets/openclaw-bws-resolver.mjs`；請將它安裝或複製到執行閘道之主機上的絕對受信任路徑。

    需求：

    - 閘道主機上已安裝 Bitwarden Secrets Manager 命令列介面（`bws`）。
    - 閘道服務可使用 `BWS_ACCESS_TOKEN`。
    - 將 `PATH` 傳遞給解析器，或將 `BWS_BIN` 設為 `bws` 二進位檔的絕對路徑。
    - 使用自行託管的 Bitwarden 執行個體時，須在環境中設定 `BWS_SERVER_URL`。

    ```json5
    {
      secrets: {
        providers: {
          bws: {
            source: "exec",
            command: "/usr/local/bin/openclaw-bws-resolver.mjs",
            passEnv: ["BWS_ACCESS_TOKEN", "BWS_SERVER_URL", "PATH", "BWS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "bws",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    解析器會批次處理請求的 ID、執行 `bws secret list`，並傳回相符祕密之 `key` 欄位的值。請使用符合 Exec SecretRef ID 合約的金鑰，例如 `openclaw/providers/openai/apiKey`；含底線的環境變數樣式金鑰會在解析器執行前遭拒絕。如果有多個可見的 Bitwarden 祕密共用所請求的金鑰，解析器會因該 ID 語意不明而失敗，而不會猜測。更新設定後，請驗證解析器路徑：

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault 命令列介面">
    ```json5
    {
      secrets: {
        providers: {
          vault_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/vault",
            allowSymlinkCommand: true, // Homebrew 符號連結二進位檔所需
            trustedDirs: ["/opt/homebrew"],
            args: ["kv", "get", "-field=OPENAI_API_KEY", "secret/openclaw"],
            passEnv: ["VAULT_ADDR", "VAULT_TOKEN"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "vault_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
  <Accordion title="password-store (`pass`)">
    使用小型解析器包裝程式，將 SecretRef ID 直接對應至 `pass` 項目。請將它儲存為絕對路徑下的可執行檔，且該路徑須通過 Exec 提供者路徑檢查，例如 `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` shebang 會從解析器程序的 `PATH` 解析 `node`，因此請將 `PATH` 納入 `passEnv`。如果 `pass` 不在該 `PATH` 上，請在父環境中設定 `PASS_BIN`，並同樣將它納入 `passEnv`：

    ```js
    #!/usr/bin/env node
    const { spawnSync } = require("node:child_process");

    let stdin = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      stdin += chunk;
    });
    process.stdin.on("error", (err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
    process.stdin.on("end", () => {
      let request;
      try {
        request = JSON.parse(stdin || "{}");
      } catch (err) {
        process.stderr.write(`無法剖析請求：${err.message}\n`);
        process.exit(1);
      }

      const passBin = process.env.PASS_BIN || "pass";
      const values = {};
      const errors = {};

      for (const id of request.ids ?? []) {
        const result = spawnSync(passBin, ["show", id], { encoding: "utf8" });
        if (result.status === 0) {
          values[id] = result.stdout.split(/\r?\n/, 1)[0] ?? "";
        } else {
          errors[id] = { message: (result.stderr || `pass 已結束，狀態為 ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    接著設定 Exec 提供者，並將 `apiKey` 指向 `pass` 項目路徑：

    ```json5
    {
      secrets: {
        providers: {
          pass_store: {
            source: "exec",
            command: "/usr/local/bin/openclaw-pass-resolver",
            passEnv: ["PATH", "HOME", "GNUPGHOME", "GPG_TTY", "PASSWORD_STORE_DIR", "PASS_BIN"],
            jsonOnly: true,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: {
              source: "exec",
              provider: "pass_store",
              id: "openclaw/providers/openai/apiKey",
            },
          },
        },
      },
    }
    ```

    將祕密保留在 `pass` 項目的第一行，或自訂包裝程式以改為傳回完整的 `pass show` 輸出。更新設定後，請同時驗證靜態稽核與 Exec 解析器路徑：

    ```bash
    openclaw secrets audit --check
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="sops">
    ```json5
    {
      secrets: {
        providers: {
          sops_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/sops",
            allowSymlinkCommand: true, // Homebrew 符號連結二進位檔所需
            trustedDirs: ["/opt/homebrew"],
            args: ["-d", "--extract", '["providers"]["openai"]["apiKey"]', "/path/to/secrets.enc.json"],
            passEnv: ["SOPS_AGE_KEY_FILE"],
            jsonOnly: false,
          },
        },
      },
      models: {
        providers: {
          openai: {
            baseUrl: "https://api.openai.com/v1",
            models: [{ id: "gpt-5", name: "gpt-5" }],
            apiKey: { source: "exec", provider: "sops_openai", id: "value" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## MCP 伺服器環境變數

透過 `plugins.entries.acpx.config.mcpServers` 設定的 MCP 伺服器環境變數接受 SecretInput，讓 API 金鑰和權杖不會出現在純文字設定中：

```json5
{
  plugins: {
    entries: {
      acpx: {
        enabled: true,
        config: {
          mcpServers: {
            github: {
              command: "npx",
              args: ["-y", "@modelcontextprotocol/server-github"],
              env: {
                GITHUB_PERSONAL_ACCESS_TOKEN: {
                  source: "env",
                  provider: "default",
                  id: "MCP_GITHUB_PAT",
                },
              },
            },
          },
        },
      },
    },
  },
}
```

純文字字串值仍可使用。`${MCP_SERVER_API_KEY}` 等環境範本參照及 SecretRef 物件，會在閘道啟用期間、MCP 伺服器程序產生之前解析。與其他 SecretRef 介面相同，僅當 `acpx` 外掛實際處於作用中時，未解析的參照才會阻止啟用。

## 沙箱 SSH 驗證材料

核心 `ssh` 沙箱後端也支援將 SecretRef 用於 SSH 驗證材料：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        ssh: {
          target: "user@gateway-host:22",
          identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

執行階段行為：

- OpenClaw 會在沙箱啟用期間解析這些參照，而非在每次 SSH 呼叫時才延遲解析。
- 解析後的值會以嚴格的檔案權限（`0o600`）寫入暫存目錄，並用於產生的 SSH 設定。
- 如果有效的沙箱後端不是 `ssh`（或沙箱模式為 `off`），這些參照會保持未啟用，且不會阻止啟動。

## 支援的認證資訊範圍

標準支援與不支援的認證資訊列於 [SecretRef 認證資訊範圍](/zh-TW/reference/secretref-credential-surface)。

<Note>
執行階段產生或輪替的認證資訊，以及 OAuth 重新整理資料，刻意排除於唯讀 SecretRef 解析之外。
</Note>

## 必要行為與優先順序

- 沒有參照的欄位：維持不變。
- 具有參照的欄位：在啟用期間，作用中範圍必須能解析該參照。
- 如果純文字與參照同時存在，在支援優先順序的路徑中，參照優先。
- 遮蔽哨兵值 `__OPENCLAW_REDACTED__` 保留供內部設定遮蔽／還原使用，若作為提交設定中的常值資料，將遭到拒絕。

警告與稽核訊號：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（執行階段警告）
- `REF_SHADOWED`（當 `auth-profiles.json` 認證資訊的優先順序高於 `openclaw.json` 參照時的稽核發現）

Google Chat `serviceAccount` 接受行內 JSON 或 SecretRef。當此標準欄位尚未設定時，Doctor 會將已淘汰的同層 `serviceAccountRef` 移入此欄位。

## 啟用觸發條件

祕密啟用會在以下情況執行：

- 啟動（預檢加上最終啟用）
- 設定重新載入的熱套用路徑
- 設定重新載入的重新啟動檢查路徑
- 透過 `secrets.reload` 手動重新載入
- 閘道設定寫入 RPC 預檢（`config.set` / `config.apply` / `config.patch`），在持久化編輯內容前，先驗證提交設定承載資料中作用中範圍的 SecretRef

啟用契約：

- 成功時會以不可分割方式交換快照。
- 嚴格啟動失敗會中止閘道啟動。
- 在冷啟動期間，若已對應且可隔離的非閘道擁有者發生可重試的解析失敗，系統可以發布快照，並將該擁有者精確標示為已設定但不可用。對該擁有者的請求會以 `SECRET_SURFACE_UNAVAILABLE` 失敗；明確參照失敗後，模型供應商擁有者不會改用環境或認證設定檔中的認證資訊。
- 重新載入與重新啟動檢查會隔離符合資格的已對應擁有者。若參照識別、供應商定義，以及完整的非祕密擁有者契約皆未變更，便會保留其完全相同的最後已知良好值，並標示為過時；已變更或新設定但無法解析的參照，只會針對該擁有者發布冷狀態。嚴格重新載入失敗會保留先前作用中的快照。
- `config.set`、`config.apply` 與 `config.patch` 會接受可隔離擁有者語法有效但尚未解析的參照，並傳回已遮蔽的 `degradedSecretOwners` 報告。閘道輸入驗證、結構無效的設定或解析值、政策違規及未知擁有者，仍會在變更磁碟前遭到拒絕。
- 即使另一個擁有者處於冷狀態或過時狀態，健康的同層擁有者仍會正常解析及發布。
- 為傳出輔助程式／工具呼叫提供明確的單次呼叫頻道權杖，不會觸發 SecretRef 啟用；啟用點仍為啟動、重新載入，以及明確的 `secrets.reload`。

## 降級與復原訊號

在健康狀態後，如果重新載入期間的啟用失敗，OpenClaw 會進入祕密降級狀態，並發出一次性系統事件與記錄代碼：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行為：

- 降級：健康的擁有者會重新整理，過時的擁有者會保留最後已知良好值，而冷狀態擁有者則維持不可用。
- 已復原：在下一次成功啟用後發出一次。
- 已處於降級狀態時若反覆失敗，系統會記錄警告，但不會重新發出事件。
- 嚴格啟動失敗絕不會發出降級事件，因為執行階段從未進入作用中狀態。啟動成功但存在冷狀態擁有者時，系統會記錄擁有者降級情況，但不會發出重新載入器事件。
- 參照範圍的啟動與重新載入失敗，會為每個受影響的擁有者發出結構化的 `SECRETS_DEGRADED` 警告。供應商範圍的中斷會發出一則 `SECRETS_PROVIDER_DEGRADED` 警告，其中包含供應商及完整的受影響擁有者清單，而不是針對每個擁有者重複供應商失敗。警告包含已遮蔽的原因、`cold` 或 `stale` 擁有者狀態，以及 `openclaw secrets reload` 重試提示。警告絕不包含解析值或 SecretRef ID。
- `openclaw doctor` 會列出冷狀態與過時狀態擁有者、受影響的設定路徑、已遮蔽的原因，以及重試指引。

## 命令路徑解析

命令路徑可透過閘道快照 RPC 選擇使用支援的 SecretRef 解析。適用兩大類行為：

<Tabs>
  <Tab title="嚴格命令路徑">
    例如 `openclaw memory` 遠端記憶體路徑，以及需要遠端共用祕密參照時的 `openclaw qr --remote`。它們會從作用中快照讀取資料，並在必要的 SecretRef 不可用時立即失敗。
  </Tab>
  <Tab title="唯讀命令路徑">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及唯讀 Doctor／設定修復流程。它們同樣優先使用作用中快照，但在目標 SecretRef 不可用時會降級，而非中止。

    唯讀行為：

    - 閘道執行時，這些命令會先從作用中快照讀取。
    - 如果閘道解析不完整或閘道不可用，它們會針對該命令範圍嘗試目標式本機備援。
    - 如果目標 SecretRef 仍不可用，命令會以降級的唯讀輸出繼續執行，並提供明確診斷，指出該參照已設定，但在此命令路徑中不可用。
    - 此降級行為僅限於該命令；不會削弱執行階段的啟動、重新載入或傳送／驗證路徑。

  </Tab>
</Tabs>

其他注意事項：

- 後端祕密輪替後的快照重新整理由 `openclaw secrets reload` 處理。
- 這些命令路徑使用的閘道 RPC 方法：`secrets.resolve`。

## 稽核與設定工作流程

預設操作員流程：

<Steps>
  <Step title="稽核目前狀態">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="設定並套用 SecretRef">
    ```bash
    openclaw secrets configure --apply
    ```
  </Step>
  <Step title="重新稽核">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

重新稽核結果乾淨前，請勿將遷移視為完成。如果稽核仍報告靜態儲存的純文字值，即使執行階段 API 傳回已遮蔽的值，代理程式存取風險仍然存在。

如果你在 `configure` 期間儲存方案而非直接套用，請在重新稽核前使用 `openclaw secrets apply --from <plan-path>` 套用該已儲存方案。

<AccordionGroup>
  <Accordion title="祕密稽核">
    發現項目包括：

    - 靜態儲存的純文字值（`openclaw.json`、`auth-profiles.json`、`.env`，以及產生的 `agents/*/agent/models.json`）。
    - 產生的 `models.json` 項目中殘留的純文字敏感供應商標頭。
    - 未解析的參照。
    - 優先順序遮蔽（`auth-profiles.json` 的優先順序高於 `openclaw.json` 參照）。
    - 舊版殘留項目（`auth.json`、OAuth 提醒）。

    執行注意事項：稽核預設會略過 exec SecretRef 的可解析性檢查，以避免命令產生副作用。若要在稽核期間執行 exec 供應商，請使用 `openclaw secrets audit --allow-exec`。

    標頭殘留注意事項：敏感供應商標頭偵測採用名稱啟發法（常見的驗證／認證資訊標頭名稱，以及 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential` 等片段）。

  </Accordion>
  <Accordion title="祕密設定">
    互動式輔助程式會：

    - 先設定 `secrets.providers`（`env`/`file`/`exec`，新增／編輯／移除）。
    - 讓你為一個代理程式範圍選取 `openclaw.json` 及 `auth-profiles.json` 中支援的祕密承載欄位。
    - 可直接在目標選擇器中建立新的 `auth-profiles.json` 對應。
    - 擷取 SecretRef 詳細資料（`source`、`provider`、`id`）。
    - 執行預檢解析，並可立即套用。

    執行注意事項：除非設定 `--allow-exec`，否則預檢會略過 exec SecretRef 檢查。如果直接從 `configure --apply` 套用，且方案包含 exec 參照／供應商，請在套用步驟中也保持設定 `--allow-exec`。

    實用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 套用預設值：

    - 從 `auth-profiles.json` 清除目標供應商相符的靜態認證資訊。
    - 從 `auth.json` 清除舊版靜態 `api_key` 項目。
    - 從有效狀態與作用中設定的 `.env` 檔案中，清除相符的已知祕密行（當兩個路徑相符時會去除重複項目）。

  </Accordion>
  <Accordion title="套用祕密">
    套用已儲存的方案：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    執行注意事項：除非設定 `--allow-exec`，否則試執行會略過 exec 檢查；除非設定 `--allow-exec`，否則寫入模式會拒絕包含 exec SecretRef／供應商的方案。

    如需嚴格的目標／路徑契約詳細資料與確切拒絕規則，請參閱[祕密套用方案契約](/zh-TW/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 單向安全政策

<Warning>
OpenClaw 刻意不會寫入包含歷史純文字祕密值的復原備份。
</Warning>

安全模型：

- 進入寫入模式前，預檢必須成功。
- 提交前會驗證執行階段啟用。
- 套用程序會使用不可分割的檔案取代方式更新檔案，並在失敗時盡力還原。

## 舊版驗證相容性注意事項

對於靜態認證資訊，執行階段不再依賴純文字舊版驗證儲存空間。

- 執行階段認證資訊來源為已解析的記憶體內快照。
- 發現舊版靜態 `api_key` 項目時會將其清除。
- OAuth 相關的相容性行為仍會分開處理。

## Web UI 注意事項

某些 SecretInput 聯集型別使用原始編輯器模式會比表單模式更容易設定。

## 相關內容

- [驗證](/zh-TW/gateway/authentication) - 驗證設定
- [命令列介面：密鑰](/zh-TW/cli/secrets) - 命令列介面命令
- [Vault SecretRefs](/zh-TW/plugins/vault) - HashiCorp Vault 提供者設定
- [環境變數](/zh-TW/help/environment) - 環境變數優先順序
- [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface) - 認證資訊介面
- [密鑰套用計畫合約](/zh-TW/gateway/secrets-plan-contract) - 計畫合約詳細資訊
- [安全性](/zh-TW/gateway/security) - 安全態勢
