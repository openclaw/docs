---
read_when:
    - 設定供應商認證資訊與 `auth-profiles.json` 參照的 SecretRefs
    - 在正式環境中安全地重新載入、稽核、設定及套用機密資訊
    - 了解啟動時快速失敗、非作用中介面篩選，以及最後已知良好狀態的行為
sidebarTitle: Secrets management
summary: 密鑰管理：SecretRef 合約、執行階段快照行為，以及安全的單向清除機制
title: 密鑰管理
x-i18n:
    generated_at: "2026-07-20T00:50:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: bbc7d006384ab6518daadc9f9283e15954a76f95307a09b73b053017a53b112c
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支援增量式 SecretRef，因此支援的認證資訊不需要以明文形式存在於設定中。

<Note>
明文仍然可用。每項認證資訊可自行選擇是否使用 SecretRef。
</Note>

<Warning>
如果明文認證資訊位於代理程式可檢查的檔案中，代理程式仍可讀取，包括 `openclaw.json`、`auth-profiles.json`、`.env` 或產生的 `agents/*/agent/models.json` 檔案。只有在所有支援的認證資訊都完成遷移，且 `openclaw secrets audit --check` 回報沒有任何明文殘留後，SecretRef 才能縮小本機的潛在影響範圍。
</Warning>

## 執行階段模型

- 祕密會在啟用期間預先解析至記憶體內的執行階段快照，而不是在請求路徑上延遲解析。
- 冷啟動閘道時，若已知的非閘道擁有者支援隔離，則可重試的 SecretRef 失敗會隔離至該擁有者。已對應的擁有者類別包括模型供應商與 Skills、媒體／TTS／排程供應商、符合資格的驗證設定檔、各代理程式的記憶、沙箱 SSH、頻道帳號，以及資訊清單宣告的外掛路由。閘道會啟動、將該擁有者記錄為已設定但不可用，並發出經遮蔽的降級警告。閘道輸入驗證、結構無效的參照或解析值、失敗時關閉的擁有者，以及執行階段擁有者未對應的參照，仍會導致啟動失敗。
- 重新載入會個別驗證每個已對應的擁有者，然後以不可分割的方式發布單一快照。健康的擁有者會重新整理。只有在參照識別資訊、供應商定義，以及完整的非祕密擁有者合約皆未變更時，符合資格但失敗的擁有者才會保留其最後已知良好值，並進入過時狀態；已變更或新增但失敗的擁有者會進入冷狀態。嚴格失敗會拒絕重新載入，並保留作用中的快照。
- 政策違規（例如 OAuth 模式的驗證設定檔與 SecretRef 輸入同時使用）會在交換執行階段快照前導致啟用失敗。
- 執行階段請求只會讀取作用中的記憶體內快照。模型供應商的 SecretRef 認證資訊會以程序本機的哨兵值，經由驗證儲存空間與串流選項傳遞，直到送出為止。向外傳送路徑（Discord 回覆／討論串傳送、Telegram 動作傳送）也會讀取該快照，而不會在每次傳送時重新解析參照。

這可避免祕密供應商中斷影響高頻請求路徑。

閘道輸入保護、結構無效的設定或解析值、政策違規，以及擁有權未知，仍會採取失敗時關閉。遭隔離的擁有者絕不會改用優先順序較低的認證資訊來源。

## 送出時注入（哨兵值）

對於由 SecretRef 支援的模型供應商認證資訊，OpenClaw 會在解析模型驗證時建立不透明的程序本機哨兵值。因此，驗證儲存空間、串流選項、SDK 設定、日誌、錯誤物件，以及大多數執行階段內省，看到的會是 `oc-sent-v1-...` 之類的值，而不是供應商認證資訊。受防護的模型 fetch 與受管理的本機供應商健康狀態探查，會在每個請求即將離開程序前，立即替換 URL 與標頭值中的已知哨兵值。

形狀類似哨兵值的未知值會在任何網路活動前採取失敗時關閉。OpenClaw 會拒絕傳送請求，而不是將未解析的哨兵值轉送給供應商。解析出的祕密值也會登錄以進行完全相符值的日誌遮蔽，作為縱深防禦措施。

供應商介接器會使用其 SDK 支援的最後一個注入點：

- 具有自訂 fetch 選項的 SDK 會接收 OpenClaw 的受防護 fetch，因此 SDK 會保留哨兵值。
- 沒有自訂 fetch 選項的 SDK 會在建立用戶端前立即解除哨兵值。由外掛擁有的供應商串流與代理程式測試框架，會在核心擁有的最終交接點解除哨兵值，因為這些傳輸不共用 OpenClaw 的受防護 fetch。

哨兵值可減少模型呼叫鏈中的明文暴露，但並不提供程序隔離。實際值仍存在於同一程序的記憶體中，並會出現在最終介接器邊界。未透過 SecretRef 設定的明文環境認證資訊仍是明文，不在此機制的涵蓋範圍內。

設定 `OPENCLAW_SECRET_SENTINELS=off`（亦接受 `0` 或 `false`，不區分大小寫），即可在事件回應或相容性疑難排解期間停用哨兵值建立。緊急停用開關不會停用完全相符值的遮蔽登錄。

## 代理程式存取邊界

SecretRef 可防止認證資訊持久儲存在設定與產生的模型檔案中，但它並不是程序隔離邊界。若明文認證資訊仍留在代理程式可讀取的磁碟路徑上，代理程式仍可透過檔案或 shell 工具讀取，繞過 API 層級的遮蔽。

對於將代理程式可存取檔案納入考量的正式環境部署，只有在以下條件全部成立時，才應將遷移視為完成：

- 支援的認證資訊使用 SecretRef，而非明文值。
- 已從 `openclaw.json`、`auth-profiles.json`、`.env`，以及產生的 `models.json` 檔案中清除舊有明文殘留。
- 遷移後，`openclaw secrets audit --check` 的檢查結果為乾淨。
- 任何剩餘的不支援或輪替中認證資訊，皆受作業系統隔離、容器隔離或外部認證資訊代理保護。

因此，稽核／設定／套用工作流程是安全遷移閘門，而不只是便利的輔助工具。

<Warning>
SecretRef 無法讓任意可讀取的檔案變得安全。備份、複製的設定、舊有產生的模型目錄，以及不支援的認證資訊類別，在刪除、移至代理程式信任邊界之外或另行隔離之前，仍屬於正式環境祕密。
</Warning>

## 作用中介面篩選

只會在實際作用中的介面上驗證 SecretRef：

- **已啟用介面**：已對應且可隔離的擁有者若發生可重試失敗，會進入冷狀態或過時降級。嚴格、失敗時關閉、閘道必要或未對應的失敗會阻止啟動／重新載入。
- **非作用中介面**：未解析的參照不會阻止啟動／重新載入；它們會發出非致命的 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 診斷。

<Accordion title="非作用中介面的範例">
- 已停用的頻道／帳號項目。
- 沒有任何已啟用帳號繼承的頂層頻道認證資訊。
- 已停用的工具／功能介面。
- 未由 `tools.web.search.provider` 選取的網路搜尋供應商專用金鑰。在自動模式（未設定供應商）下，系統會依優先順序查詢金鑰以進行自動偵測，直到其中一個成功解析；選定後，未選取供應商的金鑰即為非作用中。
- 沙箱 SSH 驗證資料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，以及各代理程式的覆寫值）僅在預設代理程式或已啟用代理程式的有效沙箱後端為 `ssh`，且沙箱模式不是 `off` 時作用。
- 若符合下列任一條件，`gateway.remote.token`／`gateway.remote.password` SecretRef 即為作用中：
  - `gateway.mode=remote`
  - 已設定 `gateway.remote.url`
  - `gateway.tailscale.mode` 為 `serve` 或 `funnel`
  - 在沒有這些遠端介面的本機模式下：當權杖驗證可能勝出且未設定環境／驗證權杖時，`gateway.remote.token` 為作用中；只有在密碼驗證可能勝出且未設定環境／驗證密碼時，`gateway.remote.password` 才為作用中。
- 設定 `OPENCLAW_GATEWAY_TOKEN` 時，`gateway.auth.token` SecretRef 對啟動驗證解析而言為非作用中，因為該執行階段會優先採用環境權杖輸入。

</Accordion>

## 閘道驗證介面診斷

在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上設定 SecretRef 時，閘道啟動／重新載入會以代碼 `SECRETS_GATEWAY_AUTH_SURFACE` 記錄介面狀態：

- `active`：SecretRef 是有效驗證介面的一部分，且必須成功解析。
- `inactive`：另一個驗證介面勝出，或遠端驗證已停用／未作用。

日誌項目包含作用中介面政策所採用的原因。

## 初始設定參照預先檢查

在互動式初始設定中，選擇 SecretRef 儲存方式會在儲存前執行預先檢查驗證：

- 環境參照：驗證環境變數名稱，並確認設定期間可取得非空值。
- 供應商參照（`file` 或 `exec`）：驗證供應商選擇、解析 `id`，並檢查解析值的型別。
- 快速入門流程：當 `gateway.auth.token` 已是 SecretRef 時，初始設定會使用相同的快速失敗閘門，在探查／儀表板啟動前解析它（適用於 `env`、`file` 和 `exec` 參照）。

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
    - `id` 必須是絕對 JSON 指標（`/...`），若為 `singleValue` 供應商，則可使用字面值 `value`
    - 區段中的 RFC 6901 跳脫：`~` 會變成 `~0`，`/` 會變成 `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    驗證：

    - `provider` 必須符合 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必須符合 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支援 `secret#json_key` 之類的選取器）
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
  },
}
```

<Accordion title="環境供應商">
- 可選擇透過 `allowlist` 設定完全相符名稱的允許清單。
- 環境值缺少或為空時，解析會失敗。

</Accordion>

<Accordion title="檔案供應商">
- 讀取 `path` 的本機檔案。
- `mode: "json"`（預設值）預期 JSON 物件承載資料，並將 `id` 解析為 JSON 指標。
- `mode: "singleValue"` 預期參照 ID 為 `"value"`，並傳回原始檔案內容（移除結尾換行字元）。
- 路徑必須通過擁有權／權限檢查；`timeoutMs`（預設 5000）與 `maxBytes`（預設 1 MiB）會限制讀取。
- Windows 採取失敗時關閉：若無法驗證該路徑的 ACL，解析就會失敗。僅針對受信任的路徑，可在該供應商上設定 `allowInsecurePath: true` 以略過檢查。

</Accordion>

<Accordion title="Exec 提供者">
- 直接執行已設定的絕對二進位檔路徑，不使用殼層。
- 依預設，`command` 必須是一般檔案，而非符號連結。設定 `allowSymlinkCommand: true` 可允許符號連結命令路徑（例如 Homebrew shim），並搭配 `trustedDirs`（例如 `["/opt/homebrew"]`），使其僅接受套件管理工具路徑。
- 支援 `timeoutMs`（預設為 5000）、`noOutputTimeoutMs`（預設等於 `timeoutMs`）、`maxOutputBytes`（預設為 1 MiB）、`env`/`passEnv` 允許清單，以及 `trustedDirs`。
- `jsonOnly` 預設為 `true`。使用 `jsonOnly: false` 且僅要求單一 id 時，純文字、非 JSON 的 stdout 會被接受為該 id 的值。
- Windows 採失敗即關閉：若無法驗證命令路徑的 ACL，解析便會失敗。僅針對受信任的路徑，可在該提供者上設定 `allowInsecurePath: true` 以略過此檢查。
- 由外掛管理的 exec 提供者可以使用 `pluginIntegration`，而不必使用複製的 `command`/`args`。OpenClaw 會在啟動／重新載入期間，從已安裝的外掛資訊清單解析目前的命令詳細資料；如果外掛已停用、移除、不受信任，或不再宣告該整合，該提供者上的有效 SecretRef 將以失敗即關閉方式處理。

要求承載資料（stdin）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

回應承載資料（stdout）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

選用的個別 id 錯誤：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "code": "NOT_FOUND" } }
}
```

`code` 是選用的機器可讀診斷資訊。OpenClaw 會顯示可識別的
代碼 `NOT_FOUND` 和 `AMBIGUOUS_DUPLICATE_KEY`，以及提供者與 ref id。其他
代碼和 `message` 之類的自由格式欄位會基於 protocol-v1 相容性而被接受，
但不會顯示，因為解析器輸出可能包含認證資訊。

</Accordion>

## 以檔案為基礎的 API 金鑰

請勿將 `file:...` 字串放入設定的 `env` 區塊。該區塊為常值且不可覆寫，因此永遠不會在其中解析 `file:...`。

請改在支援的認證資訊欄位使用檔案 SecretRef：

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

對於 `mode: "singleValue"`，SecretRef `id` 為 `"value"`。對於 `mode: "json"`，請使用 `"/providers/xai/apiKey"` 之類的絕對 JSON 指標。

如需瞭解接受 SecretRef 的欄位，請參閱 [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface)。

## Exec 整合範例

如需涵蓋服務帳號、隨附代理程式 Skill 與疑難排解的專門 1Password 指南，請參閱 [1Password](/zh-TW/gateway/1password)。

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
  <Accordion title="Bitwarden Secrets Manager（`bws`）">
    使用解析器包裝函式，將 SecretRef id 對應至 Bitwarden Secrets Manager 項目金鑰。儲存庫包含 `scripts/secrets/openclaw-bws-resolver.mjs`；請將其安裝或複製到執行閘道的主機上某個受信任的絕對路徑。

    需求：

    - 閘道主機上已安裝 Bitwarden Secrets Manager 命令列介面（`bws`）。
    - 閘道服務可使用 `BWS_ACCESS_TOKEN`。
    - 將 `PATH` 傳遞給解析器，或將 `BWS_BIN` 設為 `bws` 二進位檔的絕對路徑。
    - 使用自行託管的 Bitwarden 執行個體時，在環境中設定 `BWS_SERVER_URL`。

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

    解析器會批次處理要求的 id、執行 `bws secret list`，並傳回相符機密 `key` 欄位的值。請使用符合 exec SecretRef id 合約的金鑰，例如 `openclaw/providers/openai/apiKey`；具有底線的環境變數樣式金鑰會在解析器執行前遭到拒絕。如果有多個可見的 Bitwarden 機密共用要求的金鑰，解析器會將該 id 判定為模稜兩可而失敗，而不是進行猜測。更新設定後，請驗證解析器路徑：

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
  <Accordion title="password-store（`pass`）">
    使用小型解析器包裝函式，將 SecretRef id 直接對應至 `pass` 項目。將其另存為絕對路徑下的可執行檔，且該路徑須通過 exec 提供者路徑檢查，例如 `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` shebang 會從解析器程序的 `PATH` 解析 `node`，因此請在 `passEnv` 中包含 `PATH`。如果 `pass` 不在該 `PATH` 上，請在父環境中設定 `PASS_BIN`，並同樣將其包含在 `passEnv` 中：

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

    將機密保留在 `pass` 項目的第一行，或自訂包裝函式以改為傳回完整的 `pass show` 輸出。更新設定後，請同時驗證靜態稽核和 exec 解析器路徑：

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

純文字字串值仍可正常運作。`${MCP_SERVER_API_KEY}` 之類的環境範本參照和 SecretRef 物件，會在閘道啟用期間、MCP 伺服器程序產生之前解析。與其他 SecretRef 介面相同，只有在 `acpx` 外掛實際啟用時，未解析的參照才會阻止啟用。

## 沙箱 SSH 驗證資料

核心 `ssh` 沙箱後端也支援將 SecretRef 用於 SSH 驗證資料：

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

- OpenClaw 會在啟用沙箱期間解析這些參照，而不是在每次 SSH 呼叫時才延遲解析。
- 解析後的值會以嚴格的檔案權限（`0o600`）寫入暫存目錄，並用於產生的 SSH 設定。
- 如果實際使用的沙箱後端不是 `ssh`（或沙箱模式為 `off`），這些參照會維持停用狀態，且不會阻止啟動。

## 支援的認證資訊範圍

標準支援與不支援的認證資訊列於 [SecretRef 認證資訊範圍](/zh-TW/reference/secretref-credential-surface)。

<Note>
執行階段產生或輪替的認證資訊，以及 OAuth 重新整理資料，刻意排除於唯讀 SecretRef 解析之外。
</Note>

## 必要行為與優先順序

- 沒有參照的欄位：維持不變。
- 具有參照的欄位：啟用期間在作用中表面上為必要項目。
- 如果純文字和參照同時存在，在支援優先順序的路徑上，參照具有優先權。
- 遮蔽哨兵值 `__OPENCLAW_REDACTED__` 保留供內部設定遮蔽／還原使用；若將其作為字面設定資料提交，系統會拒絕。

警告與稽核訊號：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（執行階段警告）
- `REF_SHADOWED`（當 `auth-profiles.json` 認證資訊的優先順序高於 `openclaw.json` 參照時的稽核發現）

Google Chat 相容性：`serviceAccountRef` 的優先順序高於純文字 `serviceAccount`；一旦設定同層參照，系統便會忽略純文字值。

## 啟用觸發條件

密鑰啟用會在以下時機執行：

- 啟動（預檢加上最終啟用）
- 設定重新載入的熱套用路徑
- 設定重新載入的重新啟動檢查路徑
- 透過 `secrets.reload` 手動重新載入
- 閘道設定寫入 RPC 預檢（`config.set` / `config.apply` / `config.patch`），在保存編輯之前，驗證所提交設定承載資料內作用中表面的 SecretRef

啟用合約：

- 成功時會以不可分割方式置換快照。
- 嚴格啟動失敗會中止閘道啟動。
- 在冷啟動期間，若已對應、可隔離且非閘道擁有者發生可重試的解析失敗，系統可以發布快照，並將該特定擁有者設定為不可用。對該擁有者的請求會以 `SECRET_SURFACE_UNAVAILABLE` 失敗；明確參照失敗後，模型供應商擁有者不會改用環境或驗證設定檔中的認證資訊。
- 重新載入和重新啟動檢查會隔離符合資格的已對應擁有者。若參照身分、供應商定義和完整的非密鑰擁有者合約均未變更，便會將其確切的最後已知良好值保留為過時值；已變更或新設定但無法解析的參照只會讓該擁有者以冷狀態發布。嚴格重新載入失敗會保留先前作用中的快照。
- `config.set`、`config.apply` 和 `config.patch` 接受可隔離擁有者在語法上有效但尚未解析的參照，並傳回已遮蔽的 `degradedSecretOwners` 報告。閘道輸入驗證、結構無效的設定或解析值、政策違規和未知擁有者，仍會在變更磁碟前遭到拒絕。
- 即使另一個擁有者處於冷狀態或過時狀態，健康的同層擁有者仍會正常解析和發布。
- 向輸出輔助程式／工具呼叫提供明確的單次呼叫頻道權杖，不會觸發 SecretRef 啟用；啟用點仍為啟動、重新載入和明確執行 `secrets.reload`。

## 降級與復原訊號

在健康狀態之後，若重新載入期間的啟用失敗，OpenClaw 會進入密鑰降級狀態，並發出單次系統事件和記錄代碼：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行為：

- 降級：健康的擁有者會重新整理，過時的擁有者保留最後已知良好值，而冷狀態擁有者維持不可用。
- 已復原：下一次成功啟用後發出一次。
- 已處於降級狀態時若重複失敗，會記錄警告，但不會再次發出事件。
- 嚴格啟動失敗絕不會發出降級事件，因為執行階段從未成為作用中。若啟動成功但存在冷狀態擁有者，系統會記錄擁有者降級情況，但不會發出重新載入器事件。
- 參照範圍的啟動和重新載入失敗，會針對每個受影響的擁有者發出結構化 `SECRETS_DEGRADED` 警告。供應商範圍的服務中斷會發出一則 `SECRETS_PROVIDER_DEGRADED` 警告，其中包含供應商及完整的受影響擁有者清單，而不是針對每個擁有者重複供應商失敗。警告會包含已遮蔽的原因、`cold` 或 `stale` 擁有者狀態，以及 `openclaw secrets reload` 重試提示。警告絕不包含解析後的值或 SecretRef ID。
- `openclaw doctor` 會列出冷狀態和過時狀態的擁有者，以及其受影響的設定路徑、已遮蔽原因和重試指引。

## 命令路徑解析

命令路徑可以透過閘道快照 RPC，選擇使用支援的 SecretRef 解析。適用兩種廣泛行為：

<Tabs>
  <Tab title="嚴格命令路徑">
    例如 `openclaw memory` 遠端記憶體路徑，以及需要遠端共用密鑰參照時的 `openclaw qr --remote`。它們會從作用中快照讀取資料，並在必要的 SecretRef 無法使用時立即失敗。
  </Tab>
  <Tab title="唯讀命令路徑">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及唯讀 doctor／設定修復流程。它們也會優先使用作用中快照，但當目標 SecretRef 無法使用時，會降級而非中止。

    唯讀行為：

    - 閘道執行時，這些命令會先從作用中快照讀取。
    - 如果閘道解析不完整或閘道無法使用，它們會嘗試對該命令表面執行目標式本機後援。
    - 如果目標 SecretRef 仍無法使用，命令會繼續產生降級的唯讀輸出，並提供明確診斷，說明參照已設定，但在此命令路徑中無法使用。
    - 此降級行為僅限於命令本身；不會削弱執行階段啟動、重新載入或傳送／驗證路徑。

  </Tab>
</Tabs>

其他注意事項：

- 後端密鑰輪替後的快照重新整理由 `openclaw secrets reload` 處理。
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

在重新稽核沒有問題之前，請勿將遷移視為完成。如果稽核仍報告靜態儲存的純文字值，即使執行階段 API 傳回已遮蔽值，代理程式存取風險仍然存在。

如果你在 `configure` 期間儲存計畫而不是直接套用，請在重新稽核之前使用 `openclaw secrets apply --from <plan-path>` 套用該已儲存計畫。

<AccordionGroup>
  <Accordion title="secrets audit">
    稽核發現包括：

    - 靜態儲存的純文字值（`openclaw.json`、`auth-profiles.json`、`.env` 和產生的 `agents/*/agent/models.json`）。
    - 產生的 `models.json` 項目中殘留的純文字敏感供應商標頭。
    - 未解析的參照。
    - 優先順序遮蔽（`auth-profiles.json` 的優先順序高於 `openclaw.json` 參照）。
    - 舊版殘留項目（`auth.json`、OAuth 提醒）。

    執行注意事項：依預設，稽核會略過 exec SecretRef 可解析性檢查，以避免命令副作用。在稽核期間使用 `openclaw secrets audit --allow-exec` 執行 exec 供應商。

    標頭殘留注意事項：敏感供應商標頭偵測以名稱啟發法為基礎（常見的驗證／認證資訊標頭名稱及片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

  </Accordion>
  <Accordion title="secrets configure">
    互動式輔助程式會：

    - 先設定 `secrets.providers`（`env`/`file`/`exec`，新增／編輯／移除）。
    - 讓你在 `openclaw.json` 中選取支援的密鑰承載欄位，並為一個代理程式範圍選取 `auth-profiles.json`。
    - 可以直接在目標選擇器中建立新的 `auth-profiles.json` 對應。
    - 擷取 SecretRef 詳細資料（`source`、`provider`、`id`）。
    - 執行預檢解析，並可立即套用。

    執行注意事項：除非設定 `--allow-exec`，否則預檢會略過 exec SecretRef 檢查。如果你直接從 `configure --apply` 套用，且計畫包含 exec 參照／供應商，請在套用步驟中也維持設定 `--allow-exec`。

    實用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 套用預設值：

    - 從 `auth-profiles.json` 中清除目標供應商相符的靜態認證資訊。
    - 從 `auth.json` 中清除舊版靜態 `api_key` 項目。
    - 從實際狀態和作用中設定的 `.env` 檔案中清除相符的已知密鑰行（兩個路徑相符時會去除重複項目）。

  </Accordion>
  <Accordion title="secrets apply">
    套用已儲存的計畫：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    執行注意事項：除非設定 `--allow-exec`，否則試執行會略過 exec 檢查；除非設定 `--allow-exec`，否則寫入模式會拒絕包含 exec SecretRef／供應商的計畫。

    如需嚴格的目標／路徑合約詳細資料和確切拒絕規則，請參閱[密鑰套用計畫合約](/zh-TW/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 單向安全政策

<Warning>
OpenClaw 刻意不會寫入包含歷史純文字密鑰值的復原備份。
</Warning>

安全模型：

- 進入寫入模式之前，預檢必須成功。
- 提交之前會驗證執行階段啟用。
- 套用作業會使用不可分割的檔案取代方式更新檔案，並在失敗時盡力還原。

## 舊版驗證相容性注意事項

對於靜態認證資訊，執行階段不再依賴純文字舊版驗證儲存空間。

- 執行階段認證資訊來源是解析後的記憶體內快照。
- 發現舊版靜態 `api_key` 項目時，系統會將其清除。
- OAuth 相關相容性行為仍會分開處理。

## Web UI 注意事項

部分 SecretInput 聯集類型在原始編輯器模式中比在表單模式中更容易設定。

## 相關內容

- [驗證](/zh-TW/gateway/authentication) - 驗證設定
- [命令列介面：祕密](/zh-TW/cli/secrets) - 命令列介面指令
- [Vault SecretRefs](/zh-TW/plugins/vault) - HashiCorp Vault 提供者設定
- [環境變數](/zh-TW/help/environment) - 環境變數優先順序
- [SecretRef 認證資訊介面](/zh-TW/reference/secretref-credential-surface) - 認證資訊介面
- [祕密套用計畫合約](/zh-TW/gateway/secrets-plan-contract) - 計畫合約詳細資訊
- [安全性](/zh-TW/gateway/security) - 安全態勢
