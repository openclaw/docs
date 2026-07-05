---
read_when:
    - 設定供提供者憑證和 `auth-profiles.json` 參照使用的 SecretRefs
    - 在生產環境中安全地操作密鑰重新載入、稽核、設定與套用
    - 了解啟動快速失敗、非作用中介面篩選，以及最後已知良好行為
sidebarTitle: Secrets management
summary: 密鑰管理：SecretRef 合約、執行階段快照行為，以及安全的單向清理
title: 機密資訊管理
x-i18n:
    generated_at: "2026-07-05T11:22:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe9349dd27755288ca7fd389c17e640fd55ff98587cbed783683be35b43eba7d
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支援加成式 SecretRefs，因此受支援的認證資訊不需要以明文形式存放在設定中。

<Note>
明文仍然可用。SecretRefs 是依每個認證資訊選擇啟用。
</Note>

<Warning>
如果明文認證資訊位於代理程式可檢查的檔案中，代理程式仍可讀取，包括 `openclaw.json`、`auth-profiles.json`、`.env` 或產生的 `agents/*/agent/models.json` 檔案。SecretRefs 只有在每個受支援的認證資訊都已遷移，且 `openclaw secrets audit --check` 回報沒有明文殘留後，才會降低這個本機爆炸半徑。
</Warning>

## 執行階段模型

- 秘密會解析到記憶體中的執行階段快照，在啟用期間即積極解析，而不是在請求路徑上延遲解析。
- 當實際有效的 SecretRef 無法解析時，啟動會快速失敗。
- 重新載入是原子交換：完整成功，或保留最後已知良好的快照。
- 政策違規（例如 OAuth 模式的驗證設定檔搭配 SecretRef 輸入）會在執行階段交換前讓啟用失敗。
- 執行階段請求只讀取作用中的記憶體內快照。對外傳遞路徑（Discord 回覆/討論串傳遞、Telegram 動作傳送）也會讀取該快照，且不會每次傳送都重新解析參照。

這會讓秘密提供者中斷不影響熱請求路徑。

## 代理程式存取邊界

SecretRefs 會阻止認證資訊持久化到設定和產生的模型檔案中，但它們不是程序隔離邊界。留在磁碟上、位於代理程式可讀路徑中的明文認證資訊，仍可透過檔案或 shell 工具讀取，繞過 API 層級的遮蔽。

對於代理程式可存取檔案屬於範圍內的正式部署，只有在以下全部成立時，才應將遷移視為完成：

- 受支援的認證資訊使用 SecretRefs，而不是明文值。
- 舊版明文殘留已從 `openclaw.json`、`auth-profiles.json`、`.env` 和產生的 `models.json` 檔案中清除。
- 遷移後 `openclaw secrets audit --check` 結果乾淨。
- 任何剩餘的不受支援或輪替中認證資訊，受到 OS 隔離、容器隔離或外部認證資訊代理保護。

這就是為什麼 audit/configure/apply 工作流程是安全性遷移閘門，而不只是便利輔助工具。

<Warning>
SecretRefs 不會讓任意可讀檔案變得安全。備份、複製的設定、舊的已產生模型目錄，以及不受支援的認證資訊類別，在被刪除、移到代理程式信任邊界之外，或另行隔離之前，仍是正式環境秘密。
</Warning>

## 作用中作用面篩選

SecretRefs 只會在實際有效的作用面上驗證：

- **已啟用的作用面**：未解析的參照會阻止啟動/重新載入。
- **非作用中作用面**：未解析的參照不會阻止啟動/重新載入；它們會發出非致命的 `SECRETS_REF_IGNORED_INACTIVE_SURFACE` 診斷。

<Accordion title="Examples of inactive surfaces">
- 已停用的頻道/帳戶項目。
- 沒有被任何已啟用帳戶繼承的頂層頻道認證資訊。
- 已停用的工具/功能作用面。
- 未由 `tools.web.search.provider` 選取的網頁搜尋提供者特定金鑰。在自動模式（未設定提供者）中，金鑰會依優先順序供自動偵測查詢，直到其中一個解析成功；選取後，未選取提供者的金鑰即為非作用中。
- 沙箱 SSH 驗證素材（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，加上每代理程式覆寫）只有在有效沙箱後端為 `ssh` 且沙箱模式不是 `off`，並且針對預設代理程式或已啟用代理程式時才是作用中。
- 如果符合以下任一條件，`gateway.remote.token` / `gateway.remote.password` SecretRefs 會是作用中：
  - `gateway.mode=remote`
  - 已設定 `gateway.remote.url`
  - `gateway.tailscale.mode` 是 `serve` 或 `funnel`
  - 在沒有這些遠端作用面的本機模式中：當權杖驗證可勝出且未設定 env/auth 權杖時，`gateway.remote.token` 是作用中；只有在密碼驗證可勝出且未設定 env/auth 密碼時，`gateway.remote.password` 才是作用中。
- 當設定 `OPENCLAW_GATEWAY_TOKEN` 時，`gateway.auth.token` SecretRef 對啟動驗證解析而言是非作用中，因為該執行階段會由 env 權杖輸入勝出。

</Accordion>

## 閘道驗證作用面診斷

當在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上設定 SecretRef 時，閘道啟動/重新載入會以 `SECRETS_GATEWAY_AUTH_SURFACE` 代碼記錄作用面狀態：

- `active`：SecretRef 是有效驗證作用面的一部分，且必須解析。
- `inactive`：另一個驗證作用面勝出，或遠端驗證已停用/非作用中。

記錄項目包含作用中作用面政策使用的原因。

## Onboarding 參照預檢

在互動式 onboarding 中，選擇 SecretRef 儲存會在儲存前執行預檢驗證：

- Env 參照：驗證 env var 名稱，並確認在設定期間可見非空值。
- 提供者參照（`file` 或 `exec`）：驗證提供者選擇、解析 `id`，並檢查解析值型別。
- 快速入門流程：當 `gateway.auth.token` 已是 SecretRef 時，onboarding 會在 probe/dashboard bootstrap 前解析它（適用於 `env`、`file` 和 `exec` 參照），並使用相同的快速失敗閘門。

驗證失敗會顯示錯誤，並讓你重試。

## SecretRef 合約

到處都使用同一種物件形狀：

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
    - `id` 必須是絕對 JSON 指標（`/...`），或 `singleValue` 提供者的字面值 `value`
    - 片段中的 RFC 6901 跳脫：`~` 變成 `~0`，`/` 變成 `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    驗證：

    - `provider` 必須符合 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必須符合 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支援像 `secret#json_key` 這樣的選擇器）
    - `id` 不得包含 `.` 或 `..` 作為以斜線分隔的路徑片段（例如 `a/../b` 會被拒絕）

  </Tab>
</Tabs>

## 提供者設定

在 `secrets.providers` 下定義提供者：

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

<Accordion title="Env provider">
- 可選擇透過 `allowlist` 使用精確名稱允許清單。
- 缺少或空的 env 值會讓解析失敗。

</Accordion>

<Accordion title="File provider">
- 讀取 `path` 的本機檔案。
- `mode: "json"`（預設）預期 JSON 物件承載資料，並將 `id` 解析為 JSON 指標。
- `mode: "singleValue"` 預期 ref id 為 `"value"`，並回傳原始檔案內容（移除尾端換行）。
- 路徑必須通過擁有權/權限檢查；`timeoutMs`（預設 5000）和 `maxBytes`（預設 1 MiB）會限制讀取。
- Windows 失敗關閉：如果該路徑無法使用 ACL 驗證，解析會失敗。僅對受信任路徑，可在該提供者上設定 `allowInsecurePath: true` 以略過檢查。

</Accordion>

<Accordion title="Exec provider">
- 直接執行設定的絕對二進位檔路徑，不使用 shell。
- 預設情況下，`command` 必須是一般檔案，而不是符號連結。設定 `allowSymlinkCommand: true` 可允許符號連結命令路徑（例如 Homebrew shim），並搭配 `trustedDirs`（例如 `["/opt/homebrew"]`），讓只有套件管理器路徑符合資格。
- 支援 `timeoutMs`（預設 5000）、`noOutputTimeoutMs`（預設等於 `timeoutMs`）、`maxOutputBytes`（預設 1 MiB）、`env`/`passEnv` 允許清單，以及 `trustedDirs`。
- `jsonOnly` 預設為 `true`。使用 `jsonOnly: false` 且只請求單一 id 時，純非 JSON stdout 會被接受為該 id 的值。
- Windows 失敗關閉：如果命令路徑無法使用 ACL 驗證，解析會失敗。僅對受信任路徑，可在該提供者上設定 `allowInsecurePath: true` 以略過檢查。
- 外掛管理的 exec 提供者可以使用 `pluginIntegration`，而不是複製的 `command`/`args`。OpenClaw 會在啟動/重新載入期間，從已安裝的外掛 manifest 解析目前命令詳細資料；如果外掛已停用、移除、不受信任，或不再宣告該整合，該提供者上的作用中 SecretRefs 會失敗關閉。

請求承載資料（stdin）：

```json
{ "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
```

回應承載資料（stdout）：

```jsonc
{ "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
```

可選的每 id 錯誤：

```json
{
  "protocolVersion": 1,
  "values": {},
  "errors": { "providers/openai/apiKey": { "message": "not found" } }
}
```

</Accordion>

## 檔案支援的 API 金鑰

不要把 `file:...` 字串放在設定的 `env` 區塊中。該區塊是字面值且不會覆寫，因此 `file:...` 永遠不會在那裡解析。

請改在受支援的認證資訊欄位上使用檔案 SecretRef：

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

對於 `mode: "singleValue"`，SecretRef `id` 是 `"value"`。對於 `mode: "json"`，請使用像 `"/providers/xai/apiKey"` 這樣的絕對 JSON 指標。

請參閱 [SecretRef 認證資訊作用面](/zh-TW/reference/secretref-credential-surface)，了解接受 SecretRefs 的欄位。

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
    使用解析器包裝程式，將 SecretRef id 對應到 Bitwarden Secrets Manager 項目金鑰。儲存庫包含 `scripts/secrets/openclaw-bws-resolver.mjs`；請將它安裝或複製到執行閘道之主機上的絕對受信任路徑。

    需求：

    - 已在閘道主機安裝 Bitwarden Secrets Manager 命令列介面 (`bws`)。
    - `BWS_ACCESS_TOKEN` 可供閘道服務使用。
    - `PATH` 已傳給解析器，或 `BWS_BIN` 已設為絕對 `bws` 二進位檔路徑。
    - 使用自架 Bitwarden 執行個體時，環境中已設定 `BWS_SERVER_URL`。

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

    解析器會批次處理請求的 ID、執行 `bws secret list`，並傳回符合密鑰 `key` 欄位的值。請使用符合 exec SecretRef ID 合約的鍵，例如 `openclaw/providers/openai/apiKey`；帶底線的環境變數風格鍵會在解析器執行前被拒絕。如果多個可見的 Bitwarden 密鑰共用同一個請求鍵，解析器會將該 ID 判定為模稜兩可並失敗，而不是猜測。更新設定後，請驗證解析器路徑：

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
    使用小型解析器包裝器，將 SecretRef ID 直接對應到 `pass` 項目。將其儲存為位於可通過你的 exec-provider 路徑檢查之絕對路徑的可執行檔，例如 `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` shebang 會從解析器程序的 `PATH` 解析 `node`，因此請在 `passEnv` 中包含 `PATH`。如果 `pass` 不在該 `PATH` 上，也請在父環境中設定 `PASS_BIN`，並將其包含在 `passEnv` 中：

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
        process.stderr.write(`Failed to parse request: ${err.message}\n`);
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
          errors[id] = { message: (result.stderr || `pass exited ${result.status}`).trim() };
        }
      }

      process.stdout.write(JSON.stringify({ protocolVersion: 1, values, errors }));
    });
    ```

    接著設定 exec provider，並將 `apiKey` 指向 `pass` 項目路徑：

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

    將密鑰保留在 `pass` 項目的第一行，或改自訂包裝器以傳回完整的 `pass show` 輸出。更新設定後，請同時驗證靜態稽核與 exec 解析器路徑：

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

透過 `plugins.entries.acpx.config.mcpServers` 設定的 MCP 伺服器環境變數接受 SecretInput，讓 API keys 與 tokens 不會進入純文字設定：

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

純文字字串值仍可使用。像 `${MCP_SERVER_API_KEY}` 這類 env-template ref 與 SecretRef 物件會在閘道啟用期間、MCP 伺服器程序生成之前解析。與其他 SecretRef 介面一樣，未解析的 ref 只有在 `acpx` 外掛實際啟用時才會阻止啟用。

## 沙箱 SSH 驗證材料

核心 `ssh` 沙箱後端也支援用於 SSH 驗證材料的 SecretRef：

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

- OpenClaw 會在沙箱啟用期間解析這些 ref，而不是在每次 SSH 呼叫時惰性解析。
- 解析後的值會寫入具有嚴格檔案權限 (`0o600`) 的暫存目錄，並用於產生的 SSH 設定。
- 如果有效沙箱後端不是 `ssh`（或沙箱模式為 `off`），這些 ref 會保持非作用中，且不會阻止啟動。

## 支援的憑證介面

標準支援與不支援的憑證列於 [SecretRef 憑證介面](/zh-TW/reference/secretref-credential-surface)。

<Note>
執行階段鑄造或輪替的憑證與 OAuth 重新整理材料，刻意排除在唯讀 SecretRef 解析之外。
</Note>

## 必要行為與優先順序

- 沒有 ref 的欄位：保持不變。
- 有 ref 的欄位：在啟用期間，作用中介面必須提供。
- 如果同時存在純文字與 ref，在支援的優先順序路徑上以 ref 為優先。
- 遮蔽哨兵 `__OPENCLAW_REDACTED__` 保留供內部設定遮蔽/還原使用，作為字面提交設定資料時會被拒絕。

警告與稽核訊號：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（執行階段警告）
- `REF_SHADOWED`（當 `auth-profiles.json` 憑證優先於 `openclaw.json` ref 時的稽核發現）

Google Chat 相容性：`serviceAccountRef` 優先於純文字 `serviceAccount`；一旦設定了同層 ref，純文字值會被忽略。

## 啟用觸發條件

Secret 啟用會在以下情況執行：

- 啟動（預檢加最終啟用）
- 設定重新載入熱套用路徑
- 設定重新載入重新啟動檢查路徑
- 透過 `secrets.reload` 手動重新載入
- 閘道設定寫入 RPC 預檢（`config.set` / `config.apply` / `config.patch`），在持久化編輯前，檢查提交的設定承載中作用中介面 SecretRef 是否可解析

啟用合約：

- 成功會以原子方式交換快照。
- 啟動失敗會中止閘道啟動。
- 執行階段重新載入失敗會保留最後已知良好的快照。
- Write-RPC 預檢失敗會拒絕提交的設定；磁碟設定與作用中執行階段快照都保持不變。
- 對外呼叫輔助工具/工具呼叫時提供明確的逐次呼叫 channel token，不會觸發 SecretRef 啟用；啟用點仍是啟動、重新載入與明確的 `secrets.reload`。

## 降級與復原訊號

在健康狀態後，如果重新載入期間的啟用失敗，OpenClaw 會進入密鑰降級狀態，發出一次性系統事件與日誌代碼：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行為：

- 降級：執行階段保留最後已知良好的快照。
- 復原：在下一次成功啟用後發出一次。
- 已處於降級狀態時，重複失敗會記錄警告，但不會重新發出事件。
- 啟動快速失敗永遠不會發出降級事件，因為執行階段從未變為作用中。

## 命令路徑解析

命令路徑可透過閘道快照 RPC 選擇加入支援的 SecretRef 解析。適用兩類廣泛行為：

<Tabs>
  <Tab title="嚴格命令路徑">
    例如 `openclaw memory` 遠端記憶路徑，以及需要遠端 shared-secret ref 時的 `openclaw qr --remote`。它們會從作用中快照讀取，並在必要 SecretRef 無法使用時快速失敗。
  </Tab>
  <Tab title="唯讀命令路徑">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及唯讀 doctor/config repair 流程。它們也偏好作用中快照，但當目標 SecretRef 無法使用時會降級而不是中止。

    唯讀行為：

    - 閘道執行時，這些命令會先從作用中快照讀取。
    - 如果閘道解析不完整或閘道無法使用，它們會嘗試針對該命令介面的本機備援。
    - 如果目標 SecretRef 仍無法使用，命令會以降級的唯讀輸出繼續，並明確診斷該 ref 已設定，但在此命令路徑中無法使用。
    - 此降級行為僅限命令本機；不會削弱執行階段啟動、重新載入或傳送/驗證路徑。

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
  <Step title="設定並套用 SecretRefs">
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

在重新稽核乾淨通過之前，請勿將遷移視為完成。如果稽核仍回報靜態儲存中有明文值，即使執行階段 API 回傳已遮蔽的值，代理存取風險仍然存在。

如果你在 `configure` 期間儲存計畫而不是直接套用，請在重新稽核前使用 `openclaw secrets apply --from <plan-path>` 套用該已儲存的計畫。

<AccordionGroup>
  <Accordion title="機密稽核">
    發現項目包括：

    - 靜態儲存中的明文值（`openclaw.json`、`auth-profiles.json`、`.env`，以及產生的 `agents/*/agent/models.json`）。
    - 產生的 `models.json` 項目中殘留的明文敏感提供者標頭。
    - 未解析的 refs。
    - 優先順序遮蔽（`auth-profiles.json` 優先於 `openclaw.json` refs）。
    - 舊版殘留（`auth.json`、OAuth 提醒）。

    Exec 注意事項：根據預設，稽核會略過 exec SecretRef 可解析性檢查，以避免命令副作用。使用 `openclaw secrets audit --allow-exec` 可在稽核期間執行 exec 提供者。

    標頭殘留注意事項：敏感提供者標頭偵測是以名稱啟發式為基礎（常見的驗證/憑證標頭名稱與片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

  </Accordion>
  <Accordion title="機密設定">
    互動式輔助工具會：

    - 先設定 `secrets.providers`（`env`/`file`/`exec`，新增/編輯/移除）。
    - 讓你為一個代理範圍選取 `openclaw.json` 加上 `auth-profiles.json` 中支援的含機密欄位。
    - 可直接在目標選擇器中建立新的 `auth-profiles.json` 對應。
    - 擷取 SecretRef 詳細資料（`source`、`provider`、`id`）。
    - 執行預檢解析，並可立即套用。

    Exec 注意事項：除非設定 `--allow-exec`，否則預檢會略過 exec SecretRef 檢查。如果你直接從 `configure --apply` 套用，且計畫包含 exec refs/提供者，套用步驟也請保持設定 `--allow-exec`。

    實用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 套用預設值：

    - 從目標提供者的 `auth-profiles.json` 中清除相符的靜態憑證。
    - 從 `auth.json` 中清除舊版靜態 `api_key` 項目。
    - 從 `<config-dir>/.env` 中清除相符的已知機密行。

  </Accordion>
  <Accordion title="套用機密">
    套用已儲存的計畫：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 注意事項：除非設定 `--allow-exec`，否則 dry-run 會略過 exec 檢查；寫入模式會拒絕包含 exec SecretRefs/提供者的計畫，除非設定 `--allow-exec`。

    如需嚴格的目標/路徑合約詳細資料與精確的拒絕規則，請參閱 [Secrets 套用計畫合約](/zh-TW/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 單向安全政策

<Warning>
OpenClaw 刻意不寫入包含歷史明文機密值的復原備份。
</Warning>

安全模型：

- 寫入模式前，預檢必須成功。
- 提交前會驗證執行階段啟用。
- 套用時會使用原子檔案替換來更新檔案，並在失敗時盡力還原。

## 舊版驗證相容性注意事項

對於靜態憑證，執行階段不再依賴明文舊版驗證儲存。

- 執行階段憑證來源是已解析的記憶體內快照。
- 發現舊版靜態 `api_key` 項目時會清除。
- OAuth 相關相容性行為維持獨立。

## Web UI 注意事項

部分 SecretInput unions 在原始編輯器模式中比在表單模式中更容易設定。

## 相關

- [驗證](/zh-TW/gateway/authentication) - 驗證設定
- [命令列介面：機密](/zh-TW/cli/secrets) - 命令列介面命令
- [環境變數](/zh-TW/help/environment) - 環境優先順序
- [SecretRef 憑證表面](/zh-TW/reference/secretref-credential-surface) - 憑證表面
- [Secrets 套用計畫合約](/zh-TW/gateway/secrets-plan-contract) - 計畫合約詳細資料
- [安全性](/zh-TW/gateway/security) - 安全態勢
