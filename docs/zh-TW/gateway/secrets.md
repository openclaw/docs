---
read_when:
    - 設定供應商認證資訊與 `auth-profiles.json` 參照的 SecretRefs
    - 在正式環境中安全地重新載入、稽核、設定及套用密鑰
    - 瞭解啟動時快速失敗、非作用中介面篩選，以及最後已知良好狀態的行為
sidebarTitle: Secrets management
summary: 祕密管理：SecretRef 合約、執行階段快照行為，以及安全的單向清除作業
title: 機密管理
x-i18n:
    generated_at: "2026-07-16T11:37:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9fbcac081a7b9bd8bc298b9fb2b7437f3bea4dad85338eed7db4cb4db051cfc7
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支援可附加的 SecretRef，因此受支援的認證資訊不必以純文字形式存在於設定中。

<Note>
仍可使用純文字。SecretRef 可針對每項認證資訊選擇性啟用。
</Note>

<Warning>
如果純文字認證資訊位於代理程式可檢查的檔案中，代理程式仍可讀取，包括 `openclaw.json`、`auth-profiles.json`、`.env` 或產生的 `agents/*/agent/models.json` 檔案。只有在所有受支援的認證資訊均已遷移，且 `openclaw secrets audit --check` 回報沒有純文字殘留後，SecretRef 才能縮小此本機影響範圍。
</Warning>

## 執行階段模型

- 密鑰會在啟用期間即時解析為記憶體內的執行階段快照，而不是在請求路徑上延遲解析。
- 若實際作用中的 SecretRef 無法解析，啟動會立即失敗。
- 重新載入採用不可分割的交換：要麼完全成功，要麼保留最後一個已知良好的快照。
- 政策違規（例如將 OAuth 模式的驗證設定檔與 SecretRef 輸入搭配使用）會在交換執行階段快照前導致啟用失敗。
- 執行階段請求只會讀取作用中的記憶體內快照。模型供應商的 SecretRef 認證資訊會以程序本機哨兵值的形式，經過驗證儲存空間及串流選項，直到傳出為止。對外傳送路徑（Discord 回覆／討論串傳送、Telegram 動作傳送）也會讀取該快照，不會在每次傳送時重新解析參照。

如此可避免密鑰供應商中斷影響高頻請求路徑。

## 傳出時注入（哨兵值）

對於由 SecretRef 支援的模型供應商認證資訊，OpenClaw 會在解析模型驗證時產生不透明的程序本機哨兵值。因此，驗證儲存空間、串流選項、SDK 設定、日誌、錯誤物件及大多數執行階段自我檢查只會看到如 `oc-sent-v1-...` 的值，而非供應商認證資訊。受防護的模型擷取作業和受管理的本機供應商健康狀態探測，會在每個請求離開程序前，立即取代 URL 和標頭值中的已知哨兵值。

形似哨兵值的未知值會在任何網路活動發生前以封閉方式失敗。OpenClaw 會拒絕傳送請求，而不會將未解析的哨兵值轉送給供應商。解析後的密鑰值也會登錄，以依精確值遮蔽日誌，作為縱深防禦措施。

供應商轉接器會使用其 SDK 所支援的最晚注入點：

- 具有自訂 fetch 選項的 SDK 會接收 OpenClaw 的受防護 fetch，因此 SDK 會保留哨兵值。
- 不具自訂 fetch 選項的 SDK 會在建立用戶端前立即解開哨兵值。由外掛擁有的供應商串流和代理程式框架會在核心擁有的最終交接點解開，因為這些傳輸不共用 OpenClaw 的受防護 fetch。

哨兵值可減少模型呼叫鏈中的純文字暴露，但並不提供程序隔離。真實值仍存在於同一程序的記憶體中，並會出現在最終轉接器邊界。未透過 SecretRef 設定的純文字環境認證資訊仍為純文字，不受此機制保護。

設定 `OPENCLAW_SECRET_SENTINELS=off`（也接受 `0` 或 `false`，不區分大小寫），即可在事件應變或相容性疑難排解期間停用哨兵值產生。此緊急停用開關不會停用精確值遮蔽登錄。

## 代理程式存取邊界

SecretRef 可防止認證資訊永久儲存在設定和產生的模型檔案中，但不構成程序隔離邊界。若純文字認證資訊仍留在代理程式可讀取的磁碟路徑中，依然可透過檔案或 Shell 工具讀取，繞過 API 層級的遮蔽。

對於將代理程式可存取檔案納入考量的正式環境部署，只有在符合以下所有條件時，才應將遷移視為完成：

- 受支援的認證資訊使用 SecretRef，而非純文字值。
- 已清除 `openclaw.json`、`auth-profiles.json`、`.env` 及產生的 `models.json` 檔案中的舊版純文字殘留。
- 遷移後的 `openclaw secrets audit --check` 沒有問題。
- 任何其餘不受支援或會輪替的認證資訊，皆受到作業系統隔離、容器隔離或外部認證資訊 Proxy 的保護。

因此，稽核／設定／套用工作流程是安全遷移關卡，而不只是便利的輔助工具。

<Warning>
SecretRef 無法讓任意可讀檔案變得安全。備份、複製的設定、舊有產生的模型目錄及不受支援的認證資訊類別，在刪除、移出代理程式信任邊界或另行隔離前，仍屬正式環境密鑰。
</Warning>

## 作用中介面篩選

SecretRef 只會在實際作用中的介面上驗證：

- **已啟用的介面**：未解析的參照會阻止啟動／重新載入。
- **非作用中的介面**：未解析的參照不會阻止啟動／重新載入；它們會發出非致命的 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 診斷。

<Accordion title="非作用中介面的範例">
- 已停用的頻道／帳號項目。
- 沒有任何已啟用帳號繼承的頂層頻道認證資訊。
- 已停用的工具／功能介面。
- 未由 `tools.web.search.provider` 選取的網頁搜尋供應商專用金鑰。在自動模式下（未設定供應商），會依優先順序查詢金鑰以進行自動偵測，直到其中一個成功解析；選取後，未選取的供應商金鑰即為非作用中。
- 沙箱 SSH 驗證資料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，以及各代理程式的覆寫值）只有在預設代理程式或已啟用代理程式的有效沙箱後端為 `ssh`，且沙箱模式不是 `off` 時才會作用。
- 若符合下列任一條件，`gateway.remote.token`／`gateway.remote.password` SecretRef 即為作用中：
  - `gateway.mode=remote`
  - 已設定 `gateway.remote.url`
  - `gateway.tailscale.mode` 為 `serve` 或 `funnel`
  - 在沒有這些遠端介面的本機模式中：若權杖驗證可能勝出，且未設定環境／驗證權杖，`gateway.remote.token` 即為作用中；只有在密碼驗證可能勝出，且未設定環境／驗證密碼時，`gateway.remote.password` 才會作用。
- 設定 `OPENCLAW_GATEWAY_TOKEN` 時，`gateway.auth.token` SecretRef 不會作用於啟動驗證解析，因為該執行階段會優先採用環境權杖輸入。

</Accordion>

## 閘道驗證介面診斷

在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上設定 SecretRef 時，閘道啟動／重新載入會以代碼 `SECRETS_GATEWAY_AUTH_SURFACE` 記錄介面狀態：

- `active`：SecretRef 是有效驗證介面的一部分，必須成功解析。
- `inactive`：另一個驗證介面優先，或遠端驗證已停用／未作用。

日誌項目會包含作用中介面政策所採用的原因。

## 初始設定參照預檢

在互動式初始設定中，選擇 SecretRef 儲存方式會在儲存前執行預檢驗證：

- 環境參照：驗證環境變數名稱，並確認設定期間可看見非空值。
- 供應商參照（`file` 或 `exec`）：驗證供應商選項、解析 `id`，並檢查解析後的值類型。
- 快速入門流程：當 `gateway.auth.token` 已是 SecretRef 時，初始設定會在探測／儀表板啟動前，使用相同的快速失敗關卡解析它（適用於 `env`、`file` 和 `exec` 參照）。

驗證失敗時會顯示錯誤，並允許你重試。

## SecretRef 合約

各處統一使用一種物件結構：

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
    - `id` 必須是絕對 JSON 指標（`/...`），若為 `singleValue` 供應商，則可使用常值 `value`
    - 區段中的 RFC 6901 跳脫：`~` 會變為 `~0`，`/` 會變為 `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    驗證：

    - `provider` 必須符合 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必須符合 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支援如 `secret#json_key` 的選取器）
    - `id` 不得包含 `.` 或 `..` 作為以斜線分隔的路徑區段（例如 `a/../b` 會遭拒絕）

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
        mode: "json", // 或 "singleValue"
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
- `mode: "json"`（預設）預期取得 JSON 物件承載資料，並將 `id` 解析為 JSON 指標。
- `mode: "singleValue"` 預期參照 ID 為 `"value"`，並傳回原始檔案內容（移除結尾換行字元）。
- 路徑必須通過擁有權／權限檢查；`timeoutMs`（預設 5000）和 `maxBytes`（預設 1 MiB）會限制讀取作業。
- Windows 採用封閉式失敗：若無法驗證該路徑的 ACL，解析即會失敗。僅對受信任的路徑，才可在該供應商上設定 `allowInsecurePath: true` 以略過檢查。

</Accordion>

<Accordion title="Exec 提供者">
- 直接執行已設定的絕對二進位檔路徑，不使用殼層。
- 依預設，`command` 必須是一般檔案，而非符號連結。設定 `allowSymlinkCommand: true` 可允許符號連結命令路徑（例如 Homebrew shim），並搭配 `trustedDirs`（例如 `["/opt/homebrew"]`），如此只有套件管理員路徑符合條件。
- 支援 `timeoutMs`（預設為 5000）、`noOutputTimeoutMs`（預設等於 `timeoutMs`）、`maxOutputBytes`（預設為 1 MiB）、`env`/`passEnv` 允許清單，以及 `trustedDirs`。
- `jsonOnly` 預設為 `true`。使用 `jsonOnly: false` 且只要求一個 id 時，會接受純文字非 JSON 的 stdout 作為該 id 的值。
- Windows 採失敗關閉：如果無法驗證命令路徑的 ACL，解析就會失敗。僅限受信任的路徑，可在該提供者上設定 `allowInsecurePath: true` 以略過檢查。
- 由外掛管理的 Exec 提供者可以使用 `pluginIntegration`，而不必複製 `command`/`args`。OpenClaw 會在啟動／重新載入期間，從已安裝的外掛資訊清單解析目前的命令詳細資料；若外掛已停用、移除、不受信任，或不再宣告該整合，此提供者上作用中的 SecretRef 會採失敗關閉。

要求承載內容（stdin）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

回應承載內容（stdout）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

選用的各 id 錯誤：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` 是選用的機器可讀診斷資訊。OpenClaw 會顯示可辨識的
代碼 `NOT_FOUND` 與 `AMBIGUOUS_DUPLICATE_KEY`，並附上提供者及參照 id。其他
代碼和 `message` 等自由格式欄位會基於 protocol-v1 相容性而被接受，
但不會顯示，因為解析器輸出可能包含認證資訊素材。

</Accordion>

## 檔案型 API 金鑰

請勿將 `file:...` 字串放入設定的 `env` 區塊。該區塊是常值且不會覆寫，因此絕不會在其中解析 `file:...`。

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

對於 `mode: "singleValue"`，SecretRef `id` 是 `"value"`。對於 `mode: "json"`，請使用 `"/providers/xai/apiKey"` 等絕對 JSON 指標。

如需瞭解接受 SecretRef 的欄位，請參閱 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。

## Exec 整合範例

如需涵蓋服務帳號、內建代理程式 Skill 與疑難排解的專用 1Password 指南，請參閱 [1Password](/zh-TW/gateway/1password)。

<AccordionGroup>
  <Accordion title="1Password CLI">
    ```json5
    {
      secrets: {
        providers: {
          onepassword_openai: {
            source: "exec",
            command: "/opt/homebrew/bin/op",
            allowSymlinkCommand: true, // Homebrew 符號連結二進位檔的必要設定
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
    使用解析器包裝程式，將 SecretRef id 對應至 Bitwarden Secrets Manager 項目金鑰。儲存庫內含 `scripts/secrets/openclaw-bws-resolver.mjs`；請將它安裝或複製到執行閘道的主機上某個絕對且受信任的路徑。

    需求：

    - 閘道主機上已安裝 Bitwarden Secrets Manager 命令列介面（`bws`）。
    - 閘道服務可使用 `BWS_ACCESS_TOKEN`。
    - 將 `PATH` 傳給解析器，或將 `BWS_BIN` 設為 `bws` 二進位檔的絕對路徑。
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

    解析器會批次處理要求的 id、執行 `bws secret list`，並傳回相符祕密 `key` 欄位的值。請使用符合 Exec SecretRef id 合約的金鑰，例如 `openclaw/providers/openai/apiKey`；使用底線的環境變數格式金鑰會在解析器執行前遭到拒絕。如果有多個可見的 Bitwarden 祕密共用要求的金鑰，解析器會將該 id 判定為有歧義並失敗，而不會猜測。更新設定後，請驗證解析器路徑：

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
            allowSymlinkCommand: true, // Homebrew 符號連結二進位檔的必要設定
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
    使用小型解析器包裝程式，將 SecretRef id 直接對應至 `pass` 項目。將此程式儲存為可執行檔，置於通過 Exec 提供者路徑檢查的絕對路徑，例如 `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` shebang 會從解析器處理程序的 `PATH` 解析 `node`，因此請在 `passEnv` 中包含 `PATH`。如果 `pass` 不在該 `PATH` 上，請在父環境中設定 `PASS_BIN`，並同樣將其納入 `passEnv`：

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
            allowSymlinkCommand: true, // Homebrew 符號連結二進位檔的必要設定
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

透過 `plugins.entries.acpx.config.mcpServers` 設定的 MCP 伺服器環境變數接受 SecretInput，讓 API 金鑰與權杖不會出現在純文字設定中：

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

純文字字串值仍然有效。`${MCP_SERVER_API_KEY}` 等環境變數範本參照與 SecretRef 物件會在閘道啟用期間、MCP 伺服器處理程序產生之前解析。與其他 SecretRef 介面相同，只有當 `acpx` 外掛實際啟用時，未解析的參照才會阻擋啟用。

## 沙箱 SSH 驗證素材

核心 `ssh` 沙箱後端也支援將 SecretRef 用於 SSH 驗證素材：

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
- 解析後的值會以嚴格的檔案權限（`0o600`）寫入暫存目錄，並用於產生的 SSH 設定。
- 如果實際生效的沙箱後端不是 `ssh`（或沙箱模式為 `off`），這些參照會維持非啟用狀態，且不會阻止啟動。

## 支援的認證資訊範圍

標準支援與不支援的認證資訊列於 [SecretRef 認證資訊範圍](/zh-TW/reference/secretref-credential-surface)。

<Note>
執行階段產生或輪替的認證資訊，以及 OAuth 重新整理資料，刻意排除於唯讀 SecretRef 解析之外。
</Note>

## 必要行為與優先順序

- 沒有參照的欄位：維持不變。
- 具有參照的欄位：啟用期間在作用中介面上為必要項目。
- 如果純文字與參照同時存在，在支援優先順序的路徑上，參照優先。
- 遮蔽哨兵值 `__OPENCLAW_REDACTED__` 保留供內部設定遮蔽／還原使用，若作為實際提交的設定資料，將遭拒絕。

警告與稽核訊號：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（執行階段警告）
- `REF_SHADOWED`（當 `auth-profiles.json` 認證資訊的優先順序高於 `openclaw.json` 參照時的稽核發現）

Google Chat 相容性：`serviceAccountRef` 的優先順序高於純文字 `serviceAccount`；設定同層參照後，純文字值會被忽略。

## 啟用觸發條件

祕密啟用會在下列情況執行：

- 啟動（預檢加上最終啟用）
- 設定重新載入的熱套用路徑
- 設定重新載入的重新啟動檢查路徑
- 透過 `secrets.reload` 手動重新載入
- 閘道設定寫入 RPC 預檢（`config.set` / `config.apply` / `config.patch`），在保存編輯內容前，檢查提交的設定承載資料中作用中介面的 SecretRef 是否可解析

啟用合約：

- 成功時會以不可分割方式置換快照。
- 啟動失敗會中止閘道啟動。
- 執行階段重新載入失敗時，會保留最後已知正常的快照。
- 寫入 RPC 預檢失敗時，會拒絕提交的設定；磁碟設定與作用中的執行階段快照都維持不變。
- 向外送輔助程式／工具呼叫明確提供每次呼叫專用的頻道權杖，不會觸發 SecretRef 啟用；啟用點仍為啟動、重新載入及明確的 `secrets.reload`。

## 降級與復原訊號

在正常狀態後，若重新載入期間的啟用失敗，OpenClaw 會進入祕密降級狀態，並發出單次系統事件與記錄代碼：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行為：

- 降級：執行階段保留最後已知正常的快照。
- 已復原：下一次成功啟用後發出一次。
- 在已降級時重複失敗會記錄警告，但不會再次發出事件。
- 啟動時快速失敗絕不會發出降級事件，因為執行階段從未進入作用中狀態。

## 命令路徑解析

命令路徑可透過閘道快照 RPC 選擇使用支援的 SecretRef 解析。適用兩種廣泛行為：

<Tabs>
  <Tab title="嚴格命令路徑">
    例如 `openclaw memory` 遠端記憶路徑，以及需要遠端共用祕密參照時的 `openclaw qr --remote`。它們會從作用中的快照讀取資料，並在必要的 SecretRef 無法使用時快速失敗。
  </Tab>
  <Tab title="唯讀命令路徑">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及唯讀的診斷／設定修復流程。它們也會優先使用作用中的快照，但當目標 SecretRef 無法使用時，會降級而非中止。

    唯讀行為：

    - 閘道執行中時，這些命令會先從作用中的快照讀取。
    - 如果閘道解析不完整或閘道無法使用，它們會嘗試針對該命令介面進行目標式本機備援。
    - 如果目標 SecretRef 仍無法使用，命令會繼續提供降級的唯讀輸出，並明確診斷該參照已設定，但在此命令路徑中無法使用。
    - 此降級行為僅限於個別命令；不會削弱執行階段啟動、重新載入或傳送／驗證路徑。

  </Tab>
</Tabs>

其他注意事項：

- 後端祕密輪替後的快照重新整理由 `openclaw secrets reload` 處理。
- 這些命令路徑使用的閘道 RPC 方法：`secrets.resolve`。

## 稽核與設定工作流程

預設操作人員流程：

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

重新稽核結果未完全無誤前，請勿將移轉視為完成。如果稽核仍回報靜態儲存的純文字值，即使執行階段 API 傳回遮蔽值，代理程式存取風險仍然存在。

如果在 `configure` 期間選擇儲存計畫而非套用，請在重新稽核前使用 `openclaw secrets apply --from <plan-path>` 套用該已儲存計畫。

<AccordionGroup>
  <Accordion title="secrets audit">
    發現項目包括：

    - 靜態儲存的純文字值（`openclaw.json`、`auth-profiles.json`、`.env`，以及產生的 `agents/*/agent/models.json`）。
    - 產生的 `models.json` 項目中殘留的純文字敏感提供者標頭。
    - 未解析的參照。
    - 優先順序遮蔽（`auth-profiles.json` 的優先順序高於 `openclaw.json` 參照）。
    - 舊版殘留項目（`auth.json`、OAuth 提醒）。

    執行注意事項：為避免命令副作用，稽核預設會略過 exec SecretRef 可解析性檢查。使用 `openclaw secrets audit --allow-exec` 可在稽核期間執行 exec 提供者。

    標頭殘留注意事項：敏感提供者標頭偵測以名稱啟發法為基礎（常見的驗證／認證資訊標頭名稱，以及 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential` 等片段）。

  </Accordion>
  <Accordion title="secrets configure">
    互動式輔助程式會：

    - 先設定 `secrets.providers`（`env`/`file`/`exec`，新增／編輯／移除）。
    - 讓你在 `openclaw.json` 加上 `auth-profiles.json` 中，針對單一代理程式範圍選取支援的祕密承載欄位。
    - 可直接在目標選取器中建立新的 `auth-profiles.json` 對應。
    - 擷取 SecretRef 詳細資料（`source`、`provider`、`id`）。
    - 執行預檢解析，並可立即套用。

    執行注意事項：除非設定了 `--allow-exec`，否則預檢會略過 exec SecretRef 檢查。如果你直接從 `configure --apply` 套用，且計畫包含 exec 參照／提供者，請在套用步驟也保持設定 `--allow-exec`。

    實用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 套用預設值：

    - 從 `auth-profiles.json` 清除目標提供者相符的靜態認證資訊。
    - 從 `auth.json` 清除舊版靜態 `api_key` 項目。
    - 從 `<config-dir>/.env` 清除相符的已知祕密行。

  </Accordion>
  <Accordion title="secrets apply">
    套用已儲存的計畫：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    執行注意事項：除非設定了 `--allow-exec`，否則試執行會略過 exec 檢查；除非設定了 `--allow-exec`，否則寫入模式會拒絕包含 exec SecretRef／提供者的計畫。

    如需嚴格的目標／路徑合約詳細資料及確切拒絕規則，請參閱[祕密套用計畫合約](/zh-TW/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 單向安全政策

<Warning>
OpenClaw 刻意不會寫入包含歷史純文字祕密值的回復備份。
</Warning>

安全模型：

- 進入寫入模式前，預檢必須成功。
- 提交前會驗證執行階段啟用。
- 套用作業會使用不可分割的檔案置換來更新檔案，並在失敗時盡力還原。

## 舊版驗證相容性注意事項

對於靜態認證資訊，執行階段不再依賴純文字舊版驗證儲存空間。

- 執行階段認證資訊來源是已解析的記憶體內快照。
- 發現舊版靜態 `api_key` 項目時，會將其清除。
- OAuth 相關的相容性行為維持獨立。

## Web UI 注意事項

有些 SecretInput 聯集類型在原始編輯器模式中比表單模式更容易設定。

## 相關內容

- [驗證](/zh-TW/gateway/authentication) - 驗證設定
- [命令列介面：祕密](/zh-TW/cli/secrets) - 命令列介面命令
- [Vault SecretRef](/zh-TW/plugins/vault) - HashiCorp Vault 提供者設定
- [環境變數](/zh-TW/help/environment) - 環境優先順序
- [SecretRef 認證資訊範圍](/zh-TW/reference/secretref-credential-surface) - 認證資訊範圍
- [祕密套用計畫合約](/zh-TW/gateway/secrets-plan-contract) - 計畫合約詳細資料
- [安全性](/zh-TW/gateway/security) - 安全態勢
