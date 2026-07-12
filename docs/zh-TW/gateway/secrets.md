---
read_when:
    - 設定供應商認證資訊與 `auth-profiles.json` 參照的 SecretRefs
    - 在正式環境中安全地重新載入、稽核、設定及套用祕密資訊
    - 了解啟動時快速失敗、非作用中介面篩選，以及最後已知正常狀態的行為
sidebarTitle: Secrets management
summary: 密鑰管理：SecretRef 合約、執行階段快照行為與安全的單向清除
title: 密鑰管理
x-i18n:
    generated_at: "2026-07-12T14:30:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63cc331bc015d29e2b2cee170e09a1db9212338e97e21c07a9bfc73477cbd64a
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支援可附加的 SecretRef，因此受支援的認證資訊不必以純文字形式存放在設定中。

<Note>
純文字仍然可用。SecretRef 可針對每項認證資訊選擇啟用。
</Note>

<Warning>
如果純文字認證資訊位於代理程式可檢查的檔案中，代理程式仍可讀取，包括 `openclaw.json`、`auth-profiles.json`、`.env` 或產生的 `agents/*/agent/models.json` 檔案。只有在遷移所有受支援的認證資訊，且 `openclaw secrets audit --check` 回報沒有純文字殘留後，SecretRef 才能縮小此本機影響範圍。
</Warning>

## 執行階段模型

- 密鑰會在啟用期間立即解析至記憶體內的執行階段快照，而不是在請求路徑上延遲解析。
- 如果實際啟用的 SecretRef 無法解析，啟動會立即失敗。
- 重新載入採用不可分割的交換：全部成功，否則保留最後一個已知正常的快照。
- 違反原則（例如將 OAuth 模式的驗證設定檔與 SecretRef 輸入結合）時，啟用會在交換執行階段快照之前失敗。
- 執行階段請求只會讀取作用中的記憶體內快照。模型供應商的 SecretRef 認證資訊會以程序本機哨兵值的形式，經過驗證儲存空間與串流選項，直到送出程序為止。對外傳送路徑（Discord 回覆／討論串傳送、Telegram 動作傳送）也會讀取該快照，不會在每次傳送時重新解析參照。

如此可避免密鑰供應商中斷影響高頻請求路徑。

## 送出時注入（哨兵值）

對於由 SecretRef 支援的模型供應商認證資訊，OpenClaw 會在解析模型驗證時產生不透明的程序本機哨兵值。因此，驗證儲存空間、串流選項、SDK 設定、日誌、錯誤物件和大多數執行階段自省功能看到的會是類似 `oc-sent-v1-...` 的值，而非供應商認證資訊。受保護的模型 fetch 與受管理的本機供應商健康探測，會在每個請求離開程序之前，立即替換 URL 和標頭值中的已知哨兵值。

未知的哨兵值形式內容會在任何網路活動之前以封閉方式失敗。OpenClaw 會拒絕傳送請求，而不會將未解析的哨兵值轉送給供應商。已解析的密鑰值也會登錄為依精確值遮蔽日誌，作為縱深防禦措施。

供應商轉接器會使用其 SDK 支援的最末端注入點：

- 具有自訂 fetch 選項的 SDK 會接收 OpenClaw 的受保護 fetch，因此 SDK 會保留哨兵值。
- 不具自訂 fetch 選項的 SDK 會在建立用戶端之前立即解開哨兵值。由外掛擁有的供應商串流和代理程式測試框架，會在最終由核心擁有的交接點解開，因為這些傳輸不共用 OpenClaw 的受保護 fetch。

哨兵值可減少模型呼叫鏈中的純文字暴露，但不提供程序隔離。實際值仍存在於同一程序的記憶體中，並會出現在最終轉接器邊界。未透過 SecretRef 設定的一般環境認證資訊仍是純文字，不受此機制保護。

設定 `OPENCLAW_SECRET_SENTINELS=off`（也接受 `0` 或 `false`，不區分大小寫），可在事件應變或相容性疑難排解期間停用哨兵值產生。此終止開關不會停用依精確值登錄遮蔽的功能。

## 代理程式存取邊界

SecretRef 可防止認證資訊持久化至設定和產生的模型檔案，但不構成程序隔離邊界。如果純文字認證資訊仍留在磁碟上代理程式可讀取的路徑中，仍可透過檔案或 shell 工具讀取，繞過 API 層級的遮蔽。

對於將代理程式可存取檔案納入考量的正式環境部署，只有在符合下列所有條件時，才應將遷移視為完成：

- 受支援的認證資訊使用 SecretRef，而非純文字值。
- 已從 `openclaw.json`、`auth-profiles.json`、`.env` 和產生的 `models.json` 檔案中清除舊版純文字殘留。
- 遷移後，`openclaw secrets audit --check` 檢查結果無異常。
- 所有仍不受支援或會輪替的認證資訊，皆由作業系統隔離、容器隔離或外部認證資訊 Proxy 保護。

這正是稽核／設定／套用工作流程屬於安全遷移關卡，而不只是便利輔助工具的原因。

<Warning>
SecretRef 不會讓任意可讀取的檔案變得安全。備份、複製的設定、舊的已產生模型目錄，以及不受支援的認證資訊類別，在遭到刪除、移出代理程式信任邊界或另行隔離之前，仍是正式環境密鑰。
</Warning>

## 作用中介面篩選

只會在實際作用中的介面驗證 SecretRef：

- **已啟用的介面**：未解析的參照會阻止啟動／重新載入。
- **非作用中介面**：未解析的參照不會阻止啟動／重新載入；它們會發出非致命的 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 診斷。

<Accordion title="非作用中介面的範例">
- 已停用的頻道／帳號項目。
- 沒有任何已啟用帳號繼承的頂層頻道認證資訊。
- 已停用的工具／功能介面。
- 未由 `tools.web.search.provider` 選取的網頁搜尋供應商專用金鑰。在自動模式（未設定供應商）下，會依優先順序查詢金鑰以進行自動偵測，直到其中一個成功解析；選取後，未選取供應商的金鑰即為非作用中。
- 沙箱 SSH 驗證資料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，以及各代理程式的覆寫）只會在有效沙箱後端為 `ssh` 且沙箱模式不是 `off` 時，對預設代理程式或已啟用的代理程式生效。
- 如果符合下列任一條件，`gateway.remote.token`／`gateway.remote.password` SecretRef 即為作用中：
  - `gateway.mode=remote`
  - 已設定 `gateway.remote.url`
  - `gateway.tailscale.mode` 為 `serve` 或 `funnel`
  - 在不具上述遠端介面的本機模式下：當權杖驗證可能勝出且未設定環境／驗證權杖時，`gateway.remote.token` 為作用中；只有當密碼驗證可能勝出且未設定環境／驗證密碼時，`gateway.remote.password` 才是作用中。
- 設定 `OPENCLAW_GATEWAY_TOKEN` 時，`gateway.auth.token` SecretRef 在啟動驗證解析中為非作用中，因為該執行階段會優先採用環境權杖輸入。

</Accordion>

## 閘道驗證介面診斷

在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上設定 SecretRef 時，閘道啟動／重新載入會以代碼 `SECRETS_GATEWAY_AUTH_SURFACE` 記錄介面狀態：

- `active`：SecretRef 是有效驗證介面的一部分，且必須成功解析。
- `inactive`：另一個驗證介面優先，或遠端驗證已停用／未作用。

日誌項目會包含作用中介面原則採用該狀態的原因。

## 初始設定參照預檢

在互動式初始設定中，選擇 SecretRef 儲存方式會在儲存前執行預檢驗證：

- 環境參照：驗證環境變數名稱，並確認設定期間可看到非空值。
- 供應商參照（`file` 或 `exec`）：驗證供應商選擇、解析 `id`，並檢查解析值的型別。
- 快速入門流程：當 `gateway.auth.token` 已是 SecretRef 時，初始設定會使用相同的立即失敗關卡，在探測／儀表板啟動之前解析它（適用於 `env`、`file` 和 `exec` 參照）。

驗證失敗時會顯示錯誤，並讓你重試。

## SecretRef 合約

所有位置都使用同一種物件形式：

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
    - `id` 不得包含以斜線分隔的 `.` 或 `..` 路徑區段（例如 `a/../b` 會遭拒絕）

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
    resolution: {
      maxProviderConcurrency: 4,
      maxRefsPerProvider: 512,
      maxBatchBytes: 262144,
    },
  },
}
```

<Accordion title="環境供應商">
- 可透過 `allowlist` 設定選用的精確名稱允許清單。
- 環境值缺少或為空時，解析會失敗。

</Accordion>

<Accordion title="檔案供應商">
- 讀取位於 `path` 的本機檔案。
- `mode: "json"`（預設）要求 JSON 物件承載內容，並將 `id` 解析為 JSON 指標。
- `mode: "singleValue"` 要求參照 ID 為 `"value"`，並傳回原始檔案內容（移除結尾換行）。
- 路徑必須通過擁有權／權限檢查；`timeoutMs`（預設 5000）和 `maxBytes`（預設 1 MiB）會限制讀取。
- Windows 採封閉式失敗：如果無法驗證路徑的 ACL，解析即告失敗。僅限信任的路徑，可在該供應商上設定 `allowInsecurePath: true` 以略過檢查。

</Accordion>

<Accordion title="Exec 供應商">
- 直接執行設定的絕對二進位檔路徑，不使用 shell。
- 預設情況下，`command` 必須是一般檔案，而非符號連結。設定 `allowSymlinkCommand: true` 可允許符號連結命令路徑（例如 Homebrew 墊片），並搭配 `trustedDirs`（例如 `["/opt/homebrew"]`），使其僅接受套件管理器路徑。
- 支援 `timeoutMs`（預設 5000）、`noOutputTimeoutMs`（預設等於 `timeoutMs`）、`maxOutputBytes`（預設 1 MiB）、`env`／`passEnv` 允許清單，以及 `trustedDirs`。
- `jsonOnly` 預設為 `true`。使用 `jsonOnly: false` 且只請求單一 ID 時，會接受一般非 JSON 標準輸出作為該 ID 的值。
- Windows 採封閉式失敗：如果無法驗證命令路徑的 ACL，解析即告失敗。僅限信任的路徑，可在該供應商上設定 `allowInsecurePath: true` 以略過檢查。
- 由外掛管理的 exec 供應商可以使用 `pluginIntegration`，而不必複製 `command`／`args`。OpenClaw 會在啟動／重新載入期間，從已安裝的外掛資訊清單解析目前的命令詳細資訊；如果該外掛已停用、遭移除、不受信任，或不再宣告該整合，該供應商上作用中的 SecretRef 會以封閉方式失敗。

請求承載內容（標準輸入）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

回應承載內容（標準輸出）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

選用的各 ID 錯誤：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` 是選用的機器可讀診斷。OpenClaw 會顯示可識別的
代碼 `NOT_FOUND` 和 `AMBIGUOUS_DUPLICATE_KEY`，以及供應商和參照 ID。為了與 protocol-v1 相容，也接受其他
代碼和 `message` 等自由形式欄位，
但不會顯示，因為解析器輸出可能包含認證資訊材料。

</Accordion>

## 檔案支援的 API 金鑰

請勿在設定的 `env` 區塊中放置 `file:...` 字串。該區塊使用字面值且不會覆寫，因此絕不會在其中解析 `file:...`。

請改為在支援的認證資訊欄位上使用檔案 SecretRef：

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

對於 `mode: "singleValue"`，SecretRef `id` 為 `"value"`。對於 `mode: "json"`，請使用絕對 JSON 指標，例如 `"/providers/xai/apiKey"`。

如需瞭解接受 SecretRef 的欄位，請參閱 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。

## Exec 整合範例

<AccordionGroup>
  <Accordion title="1Password CLI">
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
    使用解析器包裝程式，將 SecretRef ID 對應至 Bitwarden Secrets Manager 項目金鑰。儲存庫包含 `scripts/secrets/openclaw-bws-resolver.mjs`；請將其安裝或複製到執行閘道之主機上的絕對受信任路徑。

    需求：

    - 閘道主機上已安裝 Bitwarden Secrets Manager 命令列介面 (`bws`)。
    - 閘道服務可使用 `BWS_ACCESS_TOKEN`。
    - 將 `PATH` 傳遞給解析器，或將 `BWS_BIN` 設為 `bws` 二進位檔的絕對路徑。
    - 使用自行託管的 Bitwarden 執行個體時，需在環境中設定 `BWS_SERVER_URL`。

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

    解析器會批次處理要求的 ID、執行 `bws secret list`，並傳回相符祕密 `key` 欄位的值。請使用符合 exec SecretRef ID 合約的金鑰，例如 `openclaw/providers/openai/apiKey`；使用底線的環境變數樣式金鑰會在解析器執行前遭到拒絕。如果有多個可見的 Bitwarden 祕密共用要求的金鑰，解析器會因該 ID 語意不明而失敗，而不會猜測。更新設定後，請驗證解析器路徑：

    ```bash
    openclaw secrets audit --allow-exec
    ```

  </Accordion>
  <Accordion title="HashiCorp Vault CLI">
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
    使用小型解析器包裝程式，將 SecretRef ID 直接對應至 `pass` 項目。將此程式儲存為可執行檔，置於能通過 exec 提供者路徑檢查的絕對路徑，例如 `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` shebang 會從解析器程序的 `PATH` 解析 `node`，因此請在 `passEnv` 中加入 `PATH`。如果 `pass` 不在該 `PATH` 上，請在父環境中設定 `PASS_BIN`，並將其一併加入 `passEnv`：

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
        process.stderr.write(`無法剖析要求：${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass 結束，狀態為 ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    接著設定 exec 提供者，並將 `apiKey` 指向 `pass` 項目路徑：

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

    將祕密保留在 `pass` 項目的第一行，或自訂包裝程式，改為傳回完整的 `pass show` 輸出。更新設定後，請同時驗證靜態稽核與 exec 解析器路徑：

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

透過 `plugins.entries.acpx.config.mcpServers` 設定的 MCP 伺服器環境變數接受 SecretInput，使 API 金鑰和權杖不會出現在純文字設定中：

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

純文字字串值仍可使用。`${MCP_SERVER_API_KEY}` 等環境範本參照與 SecretRef 物件會在閘道啟用期間、MCP 伺服器程序產生之前解析。與其他 SecretRef 介面相同，只有在 `acpx` 外掛實際啟用時，未解析的參照才會阻止啟用。

## 沙箱 SSH 驗證資料

核心 `ssh` 沙箱後端也支援 SSH 驗證資料的 SecretRef：

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

- OpenClaw 會在沙箱啟用期間解析這些參照，而不是在每次 SSH 呼叫時才延遲解析。
- 解析後的值會寫入具有嚴格檔案權限 (`0o600`) 的暫存目錄，並用於產生的 SSH 設定。
- 如果實際使用的沙箱後端不是 `ssh`（或沙箱模式為 `off`），這些參照會保持非作用中狀態，且不會阻止啟動。

## 支援的認證資訊介面

[SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)列出標準支援與不支援的認證資訊。

<Note>
執行階段產生或輪替的認證資訊，以及 OAuth 重新整理資料，會刻意排除在唯讀 SecretRef 解析之外。
</Note>

## 必要行為與優先順序

- 沒有參照的欄位：維持不變。
- 有參照的欄位：啟用期間在作用中介面上為必要項目。
- 如果同時存在純文字和參照，則在支援的優先順序路徑上以參照為優先。
- 遮蔽哨兵值 `__OPENCLAW_REDACTED__` 保留供內部設定遮蔽／還原使用，若作為字面提交的設定資料，將遭到拒絕。

警告與稽核訊號：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（執行階段警告）
- `REF_SHADOWED`（當 `auth-profiles.json` 認證資訊優先於 `openclaw.json` 參照時的稽核發現）

Google Chat 相容性：`serviceAccountRef` 優先於純文字 `serviceAccount`；設定同層級的參照後，純文字值會被忽略。

## 啟用觸發條件

祕密啟用會在下列情況執行：

- 啟動（預先檢查加上最終啟用）
- 設定重新載入的熱套用路徑
- 設定重新載入的重新啟動檢查路徑
- 透過 `secrets.reload` 手動重新載入
- 閘道設定寫入 RPC 預先檢查（`config.set` / `config.apply` / `config.patch`），在保存編輯之前，檢查提交的設定承載資料內作用中介面的 SecretRef 是否可解析

啟用合約：

- 成功時會以不可分割的方式交換快照。
- 啟動失敗會中止閘道啟動。
- 執行階段重新載入失敗會保留最後已知正常的快照。
- 寫入 RPC 預先檢查失敗會拒絕提交的設定；磁碟設定與作用中的執行階段快照都會維持不變。
- 向輸出輔助函式／工具呼叫提供明確的單次頻道權杖，不會觸發 SecretRef 啟用；啟用點仍為啟動、重新載入，以及明確的 `secrets.reload`。

## 降級與復原訊號

在正常狀態之後，若重新載入時的啟用失敗，OpenClaw 會進入祕密降級狀態，並發出一次性系統事件與記錄程式碼：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行為：

- 降級：執行階段保留最近一次已知良好的快照。
- 復原：在下一次成功啟用後發出一次。
- 已處於降級狀態時若持續失敗，會記錄警告，但不會再次發出事件。
- 啟動時的快速失敗絕不會發出降級事件，因為執行階段從未進入啟用狀態。

## 命令路徑解析

命令路徑可透過閘道快照 RPC，選擇使用支援的 SecretRef 解析。大致分為兩種行為：

<Tabs>
  <Tab title="嚴格命令路徑">
    例如 `openclaw memory` 的遠端記憶體路徑，以及需要遠端共享祕密參照時的 `openclaw qr --remote`。這些路徑會從作用中的快照讀取，且當必要的 SecretRef 無法使用時快速失敗。
  </Tab>
  <Tab title="唯讀命令路徑">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及唯讀的 doctor／設定修復流程。這些路徑也會優先使用作用中的快照，但當目標 SecretRef 無法使用時會降級，而不是中止。

    唯讀行為：

    - 閘道執行中時，這些命令會先從作用中的快照讀取。
    - 如果閘道解析不完整或閘道無法使用，命令會針對該命令介面嘗試目標式本機後援。
    - 如果目標 SecretRef 仍無法使用，命令會以降級的唯讀輸出繼續執行，並提供明確診斷，指出該參照已設定，但在此命令路徑中無法使用。
    - 此降級行為僅限於個別命令；不會放寬執行階段啟動、重新載入或傳送／驗證路徑的要求。

  </Tab>
</Tabs>

其他注意事項：

- 後端祕密輪替後的快照重新整理由 `openclaw secrets reload` 處理。
- 這些命令路徑使用的閘道 RPC 方法：`secrets.resolve`。

## 稽核與設定工作流程

預設操作流程：

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

重新稽核結果完全乾淨之前，請勿將遷移視為完成。如果稽核仍回報靜態儲存中的純文字值，即使執行階段 API 傳回的是遮蔽值，代理程式存取風險仍然存在。

如果你在 `configure` 期間儲存方案而非直接套用，請在重新稽核前使用 `openclaw secrets apply --from <plan-path>` 套用該已儲存的方案。

<AccordionGroup>
  <Accordion title="secrets audit">
    檢查結果包括：

    - 靜態儲存中的純文字值（`openclaw.json`、`auth-profiles.json`、`.env`，以及產生的 `agents/*/agent/models.json`）。
    - 產生的 `models.json` 項目中，敏感供應商標頭的純文字殘留。
    - 未解析的參照。
    - 優先順序遮蔽（`auth-profiles.json` 的優先順序高於 `openclaw.json` 參照）。
    - 舊版殘留（`auth.json`、OAuth 提醒）。

    Exec 注意事項：為避免命令副作用，稽核預設會略過 exec SecretRef 的可解析性檢查。若要在稽核期間執行 exec 供應商，請使用 `openclaw secrets audit --allow-exec`。

    標頭殘留注意事項：敏感供應商標頭偵測以名稱啟發式規則為基礎（常見的驗證／認證資訊標頭名稱，以及如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential` 等片段）。

  </Accordion>
  <Accordion title="secrets configure">
    互動式輔助工具會：

    - 先設定 `secrets.providers`（`env`／`file`／`exec`，可新增／編輯／移除）。
    - 讓你在一個代理程式範圍內，選取 `openclaw.json` 與 `auth-profiles.json` 中支援且含有祕密的欄位。
    - 可直接在目標選擇器中建立新的 `auth-profiles.json` 對應。
    - 擷取 SecretRef 詳細資料（`source`、`provider`、`id`）。
    - 執行預檢解析，並可立即套用。

    Exec 注意事項：除非設定 `--allow-exec`，否則預檢會略過 exec SecretRef 檢查。如果你直接透過 `configure --apply` 套用，且方案包含 exec 參照／供應商，套用步驟也必須保留 `--allow-exec`。

    實用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 的預設套用行為：

    - 從 `auth-profiles.json` 移除目標供應商相符的靜態認證資訊。
    - 從 `auth.json` 移除舊版靜態 `api_key` 項目。
    - 從 `<config-dir>/.env` 移除相符的已知祕密行。

  </Accordion>
  <Accordion title="secrets apply">
    套用已儲存的方案：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 注意事項：除非設定 `--allow-exec`，否則試執行會略過 exec 檢查；除非設定 `--allow-exec`，否則寫入模式會拒絕包含 exec SecretRef／供應商的方案。

    如需嚴格的目標／路徑合約詳細資料與確切拒絕規則，請參閱[祕密套用方案合約](/zh-TW/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 單向安全政策

<Warning>
OpenClaw 刻意不寫入含有歷史純文字祕密值的復原備份。
</Warning>

安全模型：

- 進入寫入模式前，預檢必須成功。
- 提交前會驗證執行階段啟用狀態。
- 套用作業會使用不可分割的檔案取代來更新檔案，並在失敗時盡力還原。

## 舊版驗證相容性注意事項

對於靜態認證資訊，執行階段不再依賴純文字的舊版驗證儲存空間。

- 執行階段認證資訊來源是已解析的記憶體內快照。
- 發現舊版靜態 `api_key` 項目時會將其移除。
- OAuth 相關的相容性行為會分開處理。

## Web UI 注意事項

部分 SecretInput 聯集型別使用原始編輯器模式會比表單模式更容易設定。

## 相關內容

- [驗證](/zh-TW/gateway/authentication) - 驗證設定
- [命令列介面：祕密](/zh-TW/cli/secrets) - 命令列介面命令
- [Vault SecretRef](/plugins/vault) - HashiCorp Vault 供應商設定
- [環境變數](/zh-TW/help/environment) - 環境變數優先順序
- [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface) - 認證資訊介面
- [祕密套用方案合約](/zh-TW/gateway/secrets-plan-contract) - 方案合約詳細資料
- [安全性](/zh-TW/gateway/security) - 安全態勢
