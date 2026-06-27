---
read_when:
    - 設定用於提供者憑證和 `auth-profiles.json` 參照的 SecretRefs
    - 在正式環境中安全地操作機密重新載入、稽核、設定與套用
    - 了解啟動快速失敗、非啟用表面篩選，以及最後已知良好行為
sidebarTitle: Secrets management
summary: 機密管理：SecretRef 合約、執行階段快照行為，以及安全的單向清除
title: 密鑰管理
x-i18n:
    generated_at: "2026-06-27T19:22:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d90346b1e4abc39cf1ab314c242f0b976aa83ee06f6dfeb787aafb19fa90de9
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支援加成式 SecretRefs，因此受支援的憑證不需要以純文字儲存在設定中。

<Note>
純文字仍可使用。SecretRefs 依每個憑證選擇啟用。
</Note>

<Warning>
如果純文字憑證儲存在代理程式可檢查的檔案中，包括 `openclaw.json`、`auth-profiles.json`、`.env`，或產生的 `agents/*/agent/models.json` 檔案，代理程式仍可讀取這些憑證。只有在每個受支援的憑證都已遷移，且 `openclaw secrets audit --check` 回報沒有純文字祕密殘留後，SecretRefs 才能降低該本機影響範圍。
</Warning>

## 目標與執行階段模型

祕密會解析成記憶體內的執行階段快照。

- 解析會在啟用期間急切執行，而不是在請求路徑上延遲執行。
- 當實際啟用的 SecretRef 無法解析時，啟動會快速失敗。
- 重新載入使用原子交換：完全成功，或保留上一個已知良好的快照。
- SecretRef 政策違規（例如 OAuth 模式的驗證設定檔結合 SecretRef 輸入）會在執行階段交換前讓啟用失敗。
- 執行階段請求只會從作用中的記憶體內快照讀取。
- 第一次成功啟用/載入設定後，執行階段程式碼路徑會持續讀取該作用中的記憶體內快照，直到成功重新載入將其交換。
- 對外傳遞路徑也會從該作用中快照讀取（例如 Discord 回覆/討論串傳遞和 Telegram 動作傳送）；它們不會在每次傳送時重新解析 SecretRefs。

這能讓祕密提供者中斷不影響熱門請求路徑。

## 代理程式存取邊界

SecretRefs 可保護憑證不被持久化到受支援的設定和產生的模型表面，但它們不是程序隔離邊界。如果純文字憑證仍留在磁碟上且位於代理程式可讀取的路徑中，代理程式可以使用檔案或 shell 工具檢查該檔案，繞過 API 層級的遮蔽。

對於代理程式可存取檔案屬於範圍內的生產部署，只有在以下全部為真時，才可將 SecretRef 遷移視為完成：

- 受支援的憑證使用 SecretRefs，而不是純文字值
- 舊版純文字殘留已從 `openclaw.json`、`auth-profiles.json`、`.env` 和產生的 `models.json` 檔案中清除
- 遷移後 `openclaw secrets audit --check` 為乾淨狀態
- 任何剩餘不受支援或會輪替的憑證，都受到作業系統隔離、容器隔離或外部憑證代理保護

這就是為什麼 audit/configure/apply 工作流程是安全遷移閘門，而不只是便利輔助工具。

<Warning>
SecretRefs 不會讓任意可讀檔案變得安全。備份、複製的設定、舊的產生模型目錄，以及不受支援的憑證類別，都必須視為生產祕密，直到它們被刪除、移出代理程式信任邊界，或受到獨立隔離層保護。
</Warning>

## 作用中表面篩選

SecretRefs 只會在實際作用中的表面上驗證。

- 已啟用的表面：未解析的 refs 會阻止啟動/重新載入。
- 非作用中表面：未解析的 refs 不會阻止啟動/重新載入。
- 非作用中 refs 會發出非致命診斷，代碼為 `SECRETS_REF_IGNORED_INACTIVE_SURFACE`。

<AccordionGroup>
  <Accordion title="非作用中表面的範例">
    - 已停用的通道/帳戶項目。
    - 沒有任何已啟用帳戶繼承的頂層通道憑證。
    - 已停用的工具/功能表面。
    - 未由 `tools.web.search.provider` 選取的網頁搜尋提供者特定金鑰。在自動模式（未設定提供者）中，系統會依優先順序查詢金鑰以進行提供者自動偵測，直到其中一個解析成功。選取後，未選取的提供者金鑰會視為非作用中，直到被選取。
    - Sandbox SSH 驗證材料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，加上每個代理程式的覆寫）只有在預設代理程式或已啟用代理程式的有效 sandbox 後端為 `ssh` 時才會作用中。
    - 如果以下任一條件為真，`gateway.remote.token` / `gateway.remote.password` SecretRefs 會作用中：
      - `gateway.mode=remote`
      - 已設定 `gateway.remote.url`
      - `gateway.tailscale.mode` 為 `serve` 或 `funnel`
      - 在沒有這些遠端表面的本機模式中：
        - 當 token 驗證可以勝出且未設定 env/auth token 時，`gateway.remote.token` 會作用中。
        - 只有在 password 驗證可以勝出且未設定 env/auth password 時，`gateway.remote.password` 才會作用中。
    - 當設定 `OPENCLAW_GATEWAY_TOKEN` 時，`gateway.auth.token` SecretRef 對啟動驗證解析而言是非作用中，因為 env token 輸入會在該執行階段勝出。

  </Accordion>
</AccordionGroup>

## 閘道驗證表面診斷

當 SecretRef 設定在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上時，閘道啟動/重新載入會明確記錄表面狀態：

- `active`：SecretRef 是有效驗證表面的一部分，且必須解析。
- `inactive`：此執行階段會忽略 SecretRef，因為另一個驗證表面勝出，或因為遠端驗證已停用/未作用中。

這些項目會以 `SECRETS_GATEWAY_AUTH_SURFACE` 記錄，並包含作用中表面政策使用的原因，因此你可以看到為什麼某個憑證被視為作用中或非作用中。

## 入門設定參照預檢

當入門設定以互動模式執行且你選擇 SecretRef 儲存時，OpenClaw 會在儲存前執行預檢驗證：

- Env refs：驗證 env var 名稱，並確認設定期間可看到非空值。
- Provider refs（`file` 或 `exec`）：驗證提供者選取、解析 `id`，並檢查解析值型別。
- Quickstart 重用路徑：當 `gateway.auth.token` 已是 SecretRef 時，入門設定會在探測/dashboard bootstrap 前解析它（針對 `env`、`file` 和 `exec` refs），並使用相同的快速失敗閘門。

如果驗證失敗，入門設定會顯示錯誤並讓你重試。

## SecretRef 契約

在所有地方使用同一種物件形狀：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
    ```

    受支援的 SecretInput 欄位也接受精確字串簡寫：

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
    - `id` 必須是絕對 JSON pointer（`/...`）
    - 區段中的 RFC6901 escaping：`~` => `~0`、`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey#value" }
    ```

    驗證：

    - `provider` 必須符合 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必須符合 `^[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$`（支援像 `secret#json_key` 這類 selector）
    - `id` 不得包含 `.` 或 `..` 作為以 slash 分隔的路徑區段（例如 `a/../b` 會被拒絕）

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

<AccordionGroup>
  <Accordion title="Env 提供者">
    - 可選擇透過 `allowlist` 設定允許清單。
    - 缺少/空的 env 值會導致解析失敗。

  </Accordion>
  <Accordion title="File 提供者">
    - 從 `path` 讀取本機檔案。
    - `mode: "json"` 預期 JSON 物件 payload，並將 `id` 作為 pointer 解析。
    - `mode: "singleValue"` 預期 ref id `"value"`，並回傳檔案內容。
    - 路徑必須通過擁有權/權限檢查。
    - Windows fail-closed 注意事項：如果某路徑無法進行 ACL 驗證，解析會失敗。僅對受信任路徑，可在該提供者上設定 `allowInsecurePath: true` 以略過路徑安全檢查。

  </Accordion>
  <Accordion title="Exec 提供者">
    - 執行設定的絕對 binary 路徑，不使用 shell。
    - 預設情況下，`command` 必須指向一般檔案（不是 symlink）。
    - 設定 `allowSymlinkCommand: true` 可允許 symlink command 路徑（例如 Homebrew shims）。OpenClaw 會驗證解析後的目標路徑。
    - 將 `allowSymlinkCommand` 搭配 `trustedDirs` 用於 package-manager 路徑（例如 `["/opt/homebrew"]`）。
    - 支援 timeout、無輸出 timeout、輸出位元組限制、env 允許清單，以及 trusted dirs。
    - Windows fail-closed 注意事項：如果 command 路徑無法進行 ACL 驗證，解析會失敗。僅對受信任路徑，可在該提供者上設定 `allowInsecurePath: true` 以略過路徑安全檢查。
    - 外掛管理的 exec 提供者可以使用 `pluginIntegration`，而不是複製的 `command`/`args`。OpenClaw 會在啟動/重新載入期間，從已安裝的外掛 manifest 解析目前的 command 詳細資訊。如果外掛已停用、移除、不受信任，或不再宣告該整合，使用該提供者的作用中 SecretRefs 會以關閉方式失敗。

    請求 payload（stdin）：

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    回應 payload（stdout）：

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    可選的每個 id 錯誤：

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

## 檔案支援的 API 金鑰

不要將 `file:...` 字串放入設定的 `env` 區塊。`env` 區塊是 literal 且不會覆寫，因此 `file:...` 不會被解析。

請改在受支援的憑證欄位上使用 file SecretRef：

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

對於 `mode: "singleValue"`，SecretRef `id` 是 `"value"`。對於 `mode: "json"`，請使用絕對 JSON pointer，例如 `"/providers/xai/apiKey"`。

請參閱 [SecretRef 憑證表面](/zh-TW/reference/secretref-credential-surface)，了解接受 SecretRefs 的設定欄位。

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
    當你希望 SecretRef id 對應到 Bitwarden Secrets Manager 項目鍵時，請使用解析器包裝器。儲存庫包含
    `scripts/secrets/openclaw-bws-resolver.mjs`；請將它安裝或複製到執行閘道之主機上的絕對受信任路徑。

    需求：

    - 已在閘道主機上安裝 Bitwarden Secrets Manager 命令列介面 (`bws`)。
    - `BWS_ACCESS_TOKEN` 可供閘道服務使用。
    - 將 `PATH` 傳遞給解析器，或將 `BWS_BIN` 設為絕對 `bws`
      二進位檔路徑。
    - 使用自架
      Bitwarden 執行個體時，必須在環境中設定 `BWS_SERVER_URL`。

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

    解析器會批次處理請求的 id、執行 `bws secret list`，並回傳相符秘密 `key` 欄位的值。請使用符合 exec SecretRef id 合約的鍵，例如 `openclaw/providers/openai/apiKey`；帶底線的環境變數風格鍵會在解析器執行前被拒絕。如果有多個可見的 Bitwarden 秘密具有相同的請求鍵，解析器會因該 id 模稜兩可而失敗，而不是選擇其中一個。更新設定後，請驗證解析器路徑：

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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
    當你希望 SecretRef id 直接對應到 `pass` 項目時，請使用小型解析器包裝器。將此檔案儲存為絕對路徑中的可執行檔，且該路徑能通過你的 exec-provider 路徑檢查，例如
    `/usr/local/bin/openclaw-pass-resolver`。`#!/usr/bin/env node` shebang
    會從解析器程序的 `PATH` 解析 `node`，因此請在
    `passEnv` 中包含 `PATH`。如果 `pass` 不在該 `PATH` 上，請在父層環境中設定 `PASS_BIN`，並一併將它納入 `passEnv`：

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

    請將秘密保留在 `pass` 項目的第一行，若你想改為回傳完整的 `pass show` 輸出，則自訂包裝器。更新設定後，請同時驗證靜態稽核與 exec 解析器路徑：

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
            allowSymlinkCommand: true, // required for Homebrew symlinked binaries
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

透過 `plugins.entries.acpx.config.mcpServers` 設定的 MCP 伺服器 env vars 支援 SecretInput。這能讓 API 金鑰與權杖不出現在明文設定中：

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

明文字串值仍可使用。像 `${MCP_SERVER_API_KEY}` 這類環境範本 ref 與 SecretRef 物件，會在 MCP 伺服器程序產生前，於 gateway 啟用期間解析。與其他 SecretRef 表面一樣，未解析的 ref 只有在 `acpx` 外掛實際啟用時才會阻止啟用。

## 沙盒 SSH 驗證材料

核心 `ssh` 沙盒後端也支援 SSH 驗證材料的 SecretRefs：

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

- OpenClaw 會在沙盒啟用期間解析這些 ref，而不是在每次 SSH 呼叫期間延遲解析。
- 解析出的值會寫入具有限制性權限的暫存檔，並用於產生的 SSH 設定。
- 如果有效的沙盒後端不是 `ssh`，這些 ref 會保持非作用中，且不會阻止啟動。

## 支援的認證表面

標準支援與不支援的認證列於：

- [SecretRef 認證表面](/zh-TW/reference/secretref-credential-surface)

<Note>
執行階段鑄發或輪替的認證，以及 OAuth 重新整理材料，都刻意排除在唯讀 SecretRef 解析之外。
</Note>

## 必要行為與優先順序

- 沒有 ref 的欄位：不變。
- 有 ref 的欄位：在啟用期間，於作用中表面上為必要項目。
- 如果明文與 ref 同時存在，在支援的優先順序路徑上以 ref 優先。
- 遮罩哨兵 `__OPENCLAW_REDACTED__` 保留供內部設定遮罩/還原使用，且會被拒絕作為提交設定資料中的字面值。

警告與稽核訊號：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（執行階段警告）
- `REF_SHADOWED`（當 `auth-profiles.json` 認證優先於 `openclaw.json` refs 時的稽核發現）

Google Chat 相容性行為：

- `serviceAccountRef` 優先於明文 `serviceAccount`。
- 設定同層 ref 時，明文字值會被忽略。

## 啟用觸發條件

秘密啟用會在以下情況執行：

- 啟動（預檢加最終啟用）
- 設定重新載入熱套用路徑
- 設定重新載入重新啟動檢查路徑
- 透過 `secrets.reload` 手動重新載入
- 閘道設定寫入 RPC 預檢（`config.set` / `config.apply` / `config.patch`），用於在持久化編輯前，檢查提交設定酬載內作用中表面 SecretRef 的可解析性

啟用合約：

- 成功會以原子方式替換快照。
- 啟動失敗會中止 gateway 啟動。
- 執行階段重新載入失敗會保留最後已知良好的快照。
- 寫入 RPC 預檢失敗會拒絕提交的設定，並保持磁碟設定與作用中執行階段快照皆不變。
- 對 outbound helper/tool call 提供明確的每次呼叫 channel token 不會觸發 SecretRef 啟用；啟用點仍為啟動、重新載入，以及明確的 `secrets.reload`。

## 降級與復原訊號

當重新載入期間的啟用在健康狀態後失敗時，OpenClaw 會進入降級的秘密狀態。

一次性系統事件與記錄代碼：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行為：

- 降級：執行階段保留最後已知良好的快照。
- 復原：在下一次成功啟用後發出一次。
- 已經降級時的重複失敗會記錄警告，但不會濫發事件。
- 啟動快速失敗不會發出降級事件，因為執行階段從未變成作用中。

## 命令路徑解析

命令路徑可以透過 gateway 快照 RPC 選擇加入支援的 SecretRef 解析。

有兩種廣泛行為：

<Tabs>
  <Tab title="嚴格命令路徑">
    例如 `openclaw memory` 遠端記憶體路徑，以及需要遠端 shared-secret ref 時的 `openclaw qr --remote`。它們會從作用中的快照讀取，並在必要的 SecretRef 無法使用時快速失敗。
  </Tab>
  <Tab title="唯讀命令路徑">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及唯讀的 doctor/config 修復流程。它們也偏好作用中的快照，但在該命令路徑中目標 SecretRef 無法使用時，會降級而不是中止。

    唯讀行為：

    - 當閘道正在執行時，這些命令會先從作用中的快照讀取。
    - 如果閘道解析不完整，或閘道無法使用，它們會針對特定命令介面嘗試目標式本機備援。
    - 如果目標 SecretRef 仍無法使用，命令會繼續提供降級的唯讀輸出，並給出明確診斷，例如「已設定但在此命令路徑中無法使用」。
    - 這種降級行為僅限命令本身。它不會削弱執行階段啟動、重新載入，或 send/auth 路徑。

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

在重新稽核通過前，不要將遷移視為完成。如果稽核
仍回報靜態儲存中的明文值，即使執行階段 API 傳回遮蔽值，
agent-access 風險仍然存在。

如果你在 `configure` 期間儲存計畫而非套用，請在重新稽核前
使用 `openclaw secrets apply --from <plan-path>` 套用該已儲存的計畫。

<AccordionGroup>
  <Accordion title="secrets audit">
    發現項目包含：

    - 靜態儲存中的明文值（`openclaw.json`、`auth-profiles.json`、`.env`，以及產生的 `agents/*/agent/models.json`）
    - 產生的 `models.json` 項目中殘留的明文敏感提供者標頭
    - 未解析的 refs
    - 優先順序遮蔽（`auth-profiles.json` 優先於 `openclaw.json` refs）
    - 舊版殘留（`auth.json`、OAuth 提醒）

    Exec 注意事項：

    - 預設情況下，稽核會跳過 exec SecretRef 可解析性檢查，以避免命令副作用。
    - 使用 `openclaw secrets audit --allow-exec` 可在稽核期間執行 exec 提供者。

    標頭殘留注意事項：

    - 敏感提供者標頭偵測是以名稱啟發式為基礎（常見的 auth/credential 標頭名稱，以及 `authorization`、`x-api-key`、`token`、`secret`、`password`、`credential` 等片段）。

  </Accordion>
  <Accordion title="secrets configure">
    互動式輔助工具會：

    - 先設定 `secrets.providers`（`env`/`file`/`exec`，新增/編輯/移除）
    - 讓你為一個 agent 範圍，在 `openclaw.json` 加上 `auth-profiles.json` 中選取支援承載密鑰的欄位
    - 可直接在目標選擇器中建立新的 `auth-profiles.json` 對應
    - 擷取 SecretRef 詳細資料（`source`、`provider`、`id`）
    - 執行預檢解析
    - 可立即套用

    Exec 注意事項：

    - 除非設定 `--allow-exec`，否則預檢會跳過 exec SecretRef 檢查。
    - 如果你直接從 `configure --apply` 套用，且計畫包含 exec refs/providers，請在套用步驟中也保留 `--allow-exec`。

    實用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 套用預設值：

    - 從 `auth-profiles.json` 清除目標提供者的相符靜態憑證
    - 從 `auth.json` 清除舊版靜態 `api_key` 項目
    - 從 `<config-dir>/.env` 清除相符的已知密鑰行

  </Accordion>
  <Accordion title="secrets apply">
    套用已儲存的計畫：

    ```bash
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
    openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
    ```

    Exec 注意事項：

    - 除非設定 `--allow-exec`，否則 dry-run 會跳過 exec 檢查。
    - 除非設定 `--allow-exec`，否則寫入模式會拒絕包含 exec SecretRefs/providers 的計畫。

    如需嚴格的目標/路徑合約詳細資料與精確拒絕規則，請參閱 [Secrets Apply Plan Contract](/zh-TW/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 單向安全政策

<Warning>
OpenClaw 有意不寫入包含歷史明文密鑰值的回復備份。
</Warning>

安全模型：

- 寫入模式前必須通過預檢
- 提交前會驗證執行階段啟用
- apply 使用原子檔案取代來更新檔案，並在失敗時盡力還原

## 舊版驗證相容性注意事項

對於靜態憑證，執行階段不再依賴明文舊版 auth 儲存。

- 執行階段憑證來源是已解析的記憶體中快照。
- 舊版靜態 `api_key` 項目在被發現時會被清除。
- OAuth 相關的相容性行為仍保持分離。

## Web UI 注意事項

某些 SecretInput unions 在原始編輯器模式中比在表單模式中更容易設定。

## 相關

- [Authentication](/zh-TW/gateway/authentication) — auth 設定
- [命令列介面：secrets](/zh-TW/cli/secrets) — 命令列介面命令
- [Environment Variables](/zh-TW/help/environment) — 環境優先順序
- [SecretRef Credential Surface](/zh-TW/reference/secretref-credential-surface) — 憑證介面
- [Secrets Apply Plan Contract](/zh-TW/gateway/secrets-plan-contract) — 計畫合約詳細資料
- [Security](/zh-TW/gateway/security) — 安全態勢
