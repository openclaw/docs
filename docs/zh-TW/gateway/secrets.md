---
read_when:
    - 設定用於提供者憑證和 `auth-profiles.json` 參照的 SecretRefs
    - 在生產環境中安全地重新載入、稽核、設定與套用機密資料
    - 了解啟動時的失敗即停、非作用中介面過濾，以及最後已知良好行為
sidebarTitle: Secrets management
summary: 機密管理：SecretRef 合約、執行階段快照行為，以及安全的單向清理
title: 機密管理
x-i18n:
    generated_at: "2026-04-30T03:09:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96fddc346e21cab17d978843dc2a482c6faf8f810b3698a97aa88463133eaca5
    source_path: gateway/secrets.md
    workflow: 16
---

OpenClaw 支援加成式 SecretRefs，因此支援的憑證不需要以純文字儲存在設定中。

<Note>
純文字仍然可用。SecretRefs 可依每個憑證選擇啟用。
</Note>

## 目標與執行階段模型

秘密會被解析到記憶體內的執行階段快照中。

- 解析會在啟用期間即時執行，而不是在請求路徑上延遲執行。
- 當實際啟用的 SecretRef 無法解析時，啟動會快速失敗。
- 重新載入使用原子交換：完全成功，或保留最後已知良好的快照。
- SecretRef 政策違規（例如 OAuth 模式驗證設定檔結合 SecretRef 輸入）會在執行階段交換前讓啟用失敗。
- 執行階段請求只會從作用中的記憶體內快照讀取。
- 第一次成功設定啟用/載入後，執行階段程式碼路徑會持續讀取該作用中的記憶體內快照，直到成功重新載入並交換為止。
- 對外傳遞路徑也會從該作用中快照讀取（例如 Discord 回覆/討論串傳遞與 Telegram 動作傳送）；它們不會在每次傳送時重新解析 SecretRefs。

這可讓秘密提供者中斷不影響高頻請求路徑。

## 作用中表面篩選

SecretRefs 只會在實際作用中的表面上驗證。

- 已啟用的表面：未解析的 refs 會阻止啟動/重新載入。
- 非作用中表面：未解析的 refs 不會阻止啟動/重新載入。
- 非作用中 refs 會發出非致命診斷，代碼為 `SECRETS_REF_IGNORED_INACTIVE_SURFACE`。

<AccordionGroup>
  <Accordion title="非作用中表面範例">
    - 已停用的頻道/帳號項目。
    - 沒有任何已啟用帳號繼承的頂層頻道憑證。
    - 已停用的工具/功能表面。
    - 未被 `tools.web.search.provider` 選取的網路搜尋提供者專用金鑰。在自動模式（未設定提供者）中，金鑰會依優先順序供提供者自動偵測使用，直到有一個解析成功。選取後，未選取的提供者金鑰會被視為非作用中，直到被選取為止。
    - Sandbox SSH 驗證資料（`agents.defaults.sandbox.ssh.identityData`、`certificateData`、`knownHostsData`，加上個別 agent 覆寫）只有在預設 agent 或已啟用 agent 的有效 sandbox 後端為 `ssh` 時才是作用中。
    - `gateway.remote.token` / `gateway.remote.password` SecretRefs 在以下任一條件成立時為作用中：
      - `gateway.mode=remote`
      - 已設定 `gateway.remote.url`
      - `gateway.tailscale.mode` 為 `serve` 或 `funnel`
      - 在沒有這些遠端表面的本機模式中：
        - 當權杖驗證可勝出且未設定 env/auth 權杖時，`gateway.remote.token` 為作用中。
        - 只有在密碼驗證可勝出且未設定 env/auth 密碼時，`gateway.remote.password` 才為作用中。
    - 當設定 `OPENCLAW_GATEWAY_TOKEN` 時，`gateway.auth.token` SecretRef 在啟動驗證解析中為非作用中，因為 env 權杖輸入會在該執行階段勝出。

  </Accordion>
</AccordionGroup>

## Gateway 驗證表面診斷

當 SecretRef 設定在 `gateway.auth.token`、`gateway.auth.password`、`gateway.remote.token` 或 `gateway.remote.password` 上時，Gateway 啟動/重新載入會明確記錄表面狀態：

- `active`：SecretRef 是有效驗證表面的一部分，且必須解析。
- `inactive`：SecretRef 在此執行階段被忽略，因為另一個驗證表面勝出，或因為遠端驗證已停用/非作用中。

這些項目會以 `SECRETS_GATEWAY_AUTH_SURFACE` 記錄，並包含作用中表面政策使用的原因，因此你可以看到為什麼某個憑證被視為作用中或非作用中。

## Onboarding 參照預檢

當 onboarding 以互動模式執行且你選擇 SecretRef 儲存時，OpenClaw 會在儲存前執行預檢驗證：

- Env refs：驗證環境變數名稱，並確認設定期間可看見非空值。
- 提供者 refs（`file` 或 `exec`）：驗證提供者選取、解析 `id`，並檢查解析值型別。
- Quickstart 重用路徑：當 `gateway.auth.token` 已經是 SecretRef 時，onboarding 會在探測/dashboard 啟動前，使用相同的快速失敗閘門解析它（適用於 `env`、`file` 和 `exec` refs）。

如果驗證失敗，onboarding 會顯示錯誤並讓你重試。

## SecretRef 合約

在所有地方使用同一種物件形狀：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

<Tabs>
  <Tab title="env">
    ```json5
    { source: "env", provider: "default", id: "OPENAI_API_KEY" }
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
    - 區段中的 RFC6901 逸出：`~` => `~0`，`/` => `~1`

  </Tab>
  <Tab title="exec">
    ```json5
    { source: "exec", provider: "vault", id: "providers/openai/apiKey" }
    ```

    驗證：

    - `provider` 必須符合 `^[a-z][a-z0-9_-]{0,63}$`
    - `id` 必須符合 `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
    - `id` 不得包含作為斜線分隔路徑區段的 `.` 或 `..`（例如 `a/../b` 會被拒絕）

  </Tab>
</Tabs>

## 提供者設定

在 `secrets.providers` 底下定義提供者：

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
    - 缺少/空白 env 值會讓解析失敗。

  </Accordion>
  <Accordion title="File 提供者">
    - 從 `path` 讀取本機檔案。
    - `mode: "json"` 預期 JSON 物件 payload，並將 `id` 解析為 pointer。
    - `mode: "singleValue"` 預期 ref id `"value"`，並回傳檔案內容。
    - 路徑必須通過擁有權/權限檢查。
    - Windows fail-closed 注意事項：如果某個路徑無法進行 ACL 驗證，解析會失敗。僅對受信任路徑，可在該提供者上設定 `allowInsecurePath: true` 以略過路徑安全檢查。

  </Accordion>
  <Accordion title="Exec 提供者">
    - 執行已設定的絕對二進位檔路徑，不使用 shell。
    - 預設情況下，`command` 必須指向一般檔案（不是 symlink）。
    - 設定 `allowSymlinkCommand: true` 以允許 symlink 命令路徑（例如 Homebrew shims）。OpenClaw 會驗證解析後的目標路徑。
    - 將 `allowSymlinkCommand` 與 `trustedDirs` 搭配用於套件管理器路徑（例如 `["/opt/homebrew"]`）。
    - 支援 timeout、no-output timeout、輸出位元組限制、env 允許清單，以及受信任目錄。
    - Windows fail-closed 注意事項：如果命令路徑無法進行 ACL 驗證，解析會失敗。僅對受信任路徑，可在該提供者上設定 `allowInsecurePath: true` 以略過路徑安全檢查。

    請求 payload（stdin）：

    ```json
    { "protocolVersion": 1, "provider": "vault", "ids": ["providers/openai/apiKey"] }
    ```

    回應 payload（stdout）：

    ```jsonc
    { "protocolVersion": 1, "values": { "providers/openai/apiKey": "<openai-api-key>" } } // pragma: allowlist secret
    ```

    可選的逐 id 錯誤：

    ```json
    {
      "protocolVersion": 1,
      "values": {},
      "errors": { "providers/openai/apiKey": { "message": "not found" } }
    }
    ```

  </Accordion>
</AccordionGroup>

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

透過 `plugins.entries.acpx.config.mcpServers` 設定的 MCP 伺服器 env vars 支援 SecretInput。這可讓 API 金鑰與權杖不出現在純文字設定中：

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

純文字字串值仍然可用。像 `${MCP_SERVER_API_KEY}` 這類 Env-template refs 與 SecretRef 物件會在 MCP 伺服器程序產生前，於 Gateway 啟用期間解析。與其他 SecretRef 表面一樣，未解析的 refs 只有在 `acpx` Plugin 實際作用中時才會阻止啟用。

## Sandbox SSH 驗證資料

核心 `ssh` sandbox 後端也支援用於 SSH 驗證資料的 SecretRefs：

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

- OpenClaw 會在沙箱啟用期間解析這些 refs，而不是在每次 SSH 呼叫時才延遲解析。
- 已解析的值會寫入具有限制性權限的暫存檔，並用於產生的 SSH 設定。
- 如果有效的沙箱後端不是 `ssh`，這些 refs 會保持非作用中，且不會阻止啟動。

## 支援的憑證範圍

標準支援與不支援的憑證列於：

- [SecretRef 憑證範圍](/zh-TW/reference/secretref-credential-surface)

<Note>
執行階段鑄造或輪替的憑證，以及 OAuth 重新整理資料，會刻意排除於唯讀 SecretRef 解析之外。
</Note>

## 必要行為與優先順序

- 沒有 ref 的欄位：不變。
- 有 ref 的欄位：在啟用期間，作用中的範圍必須可用。
- 如果明文和 ref 同時存在，在支援的優先順序路徑上，ref 優先。
- 遮罩哨兵值 `__OPENCLAW_REDACTED__` 保留供內部設定遮罩/還原使用，會拒絕作為提交設定資料中的字面值。

警告與稽核訊號：

- `SECRETS_REF_OVERRIDES_PLAINTEXT`（執行階段警告）
- `REF_SHADOWED`（當 `auth-profiles.json` 憑證優先於 `openclaw.json` refs 時的稽核發現）

Google Chat 相容性行為：

- `serviceAccountRef` 優先於明文 `serviceAccount`。
- 設定同層 ref 時，會忽略明文值。

## 啟用觸發條件

Secret 啟用會在以下情況執行：

- 啟動（預檢加上最終啟用）
- 設定重新載入熱套用路徑
- 設定重新載入重新啟動檢查路徑
- 透過 `secrets.reload` 手動重新載入
- Gateway 設定寫入 RPC 預檢（`config.set` / `config.apply` / `config.patch`），用於在保存編輯前，確認已提交設定承載中作用中範圍的 SecretRef 可解析性

啟用合約：

- 成功會以原子方式替換快照。
- 啟動失敗會中止 Gateway 啟動。
- 執行階段重新載入失敗會保留最後已知良好的快照。
- 寫入 RPC 預檢失敗會拒絕已提交設定，並保持磁碟設定與作用中的執行階段快照不變。
- 向傳出 helper/tool 呼叫提供明確的逐次呼叫 channel token，不會觸發 SecretRef 啟用；啟用點仍然是啟動、重新載入，以及明確的 `secrets.reload`。

## 降級與復原訊號

當重新載入期間的啟用在健康狀態後失敗時，OpenClaw 會進入 degraded secrets 狀態。

一次性系統事件與日誌代碼：

- `SECRETS_RELOADER_DEGRADED`
- `SECRETS_RELOADER_RECOVERED`

行為：

- 降級：執行階段保留最後已知良好的快照。
- 已復原：在下一次成功啟用後發出一次。
- 已經降級時的重複失敗會記錄警告，但不會大量發送事件。
- 啟動快速失敗不會發出降級事件，因為執行階段從未變成作用中。

## 命令路徑解析

命令路徑可以透過 Gateway 快照 RPC 選擇加入支援的 SecretRef 解析。

有兩種廣義行為：

<Tabs>
  <Tab title="嚴格命令路徑">
    例如當 `openclaw memory` 遠端記憶體路徑和 `openclaw qr --remote` 需要遠端共享密鑰 refs 時。它們會從作用中快照讀取，並在必要的 SecretRef 不可用時快速失敗。
  </Tab>
  <Tab title="唯讀命令路徑">
    例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve`、`openclaw security audit`，以及唯讀的 doctor/config 修復流程。它們也優先使用作用中快照，但當目標 SecretRef 在該命令路徑中不可用時，會降級而不是中止。

    唯讀行為：

    - Gateway 執行中時，這些命令會先從作用中快照讀取。
    - 如果 Gateway 解析不完整或 Gateway 不可用，它們會針對特定命令範圍嘗試目標本機後援。
    - 如果目標 SecretRef 仍然不可用，命令會繼續輸出降級的唯讀結果，並提供明確診斷，例如「已設定但在此命令路徑中不可用」。
    - 此降級行為僅限於命令本身。它不會削弱執行階段啟動、重新載入，或傳送/驗證路徑。

  </Tab>
</Tabs>

其他注意事項：

- 後端 secret 輪替後的快照重新整理由 `openclaw secrets reload` 處理。
- 這些命令路徑使用的 Gateway RPC 方法：`secrets.resolve`。

## 稽核與設定工作流程

預設操作員流程：

<Steps>
  <Step title="稽核目前狀態">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
  <Step title="設定 SecretRefs">
    ```bash
    openclaw secrets configure
    ```
  </Step>
  <Step title="重新稽核">
    ```bash
    openclaw secrets audit --check
    ```
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="secrets audit">
    發現項目包括：

    - 靜態儲存的明文值（`openclaw.json`、`auth-profiles.json`、`.env`，以及產生的 `agents/*/agent/models.json`）
    - 產生的 `models.json` 項目中，明文敏感 provider header 殘留
    - 未解析的 refs
    - 優先順序遮蔽（`auth-profiles.json` 優先於 `openclaw.json` refs）
    - 舊版殘留（`auth.json`、OAuth 提醒）

    Exec 注意事項：

    - 預設情況下，稽核會略過 exec SecretRef 可解析性檢查，以避免命令副作用。
    - 使用 `openclaw secrets audit --allow-exec` 可在稽核期間執行 exec providers。

    Header 殘留注意事項：

    - 敏感 provider header 偵測是以名稱啟發式為基礎（常見驗證/憑證 header 名稱與片段，例如 `authorization`、`x-api-key`、`token`、`secret`、`password` 和 `credential`）。

  </Accordion>
  <Accordion title="secrets configure">
    互動式 helper 會：

    - 先設定 `secrets.providers`（`env`/`file`/`exec`，新增/編輯/移除）
    - 讓你選取 `openclaw.json` 中支援的含 secret 欄位，加上一個 agent 範圍的 `auth-profiles.json`
    - 可以直接在目標選擇器中建立新的 `auth-profiles.json` 對應
    - 擷取 SecretRef 詳細資料（`source`、`provider`、`id`）
    - 執行預檢解析
    - 可以立即套用

    Exec 注意事項：

    - 除非設定 `--allow-exec`，否則預檢會略過 exec SecretRef 檢查。
    - 如果你直接從 `configure --apply` 套用，且計畫包含 exec refs/providers，套用步驟也要保持設定 `--allow-exec`。

    實用模式：

    - `openclaw secrets configure --providers-only`
    - `openclaw secrets configure --skip-provider-setup`
    - `openclaw secrets configure --agent <id>`

    `configure` 套用預設值：

    - 從 `auth-profiles.json` 清除目標 providers 的相符靜態憑證
    - 從 `auth.json` 清除舊版靜態 `api_key` 項目
    - 從 `<config-dir>/.env` 清除相符的已知 secret 行

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

    - 除非設定 `--allow-exec`，否則 dry-run 會略過 exec 檢查。
    - 除非設定 `--allow-exec`，否則寫入模式會拒絕包含 exec SecretRefs/providers 的計畫。

    如需嚴格目標/路徑合約詳細資訊和確切拒絕規則，請參閱 [Secrets 套用計畫合約](/zh-TW/gateway/secrets-plan-contract)。

  </Accordion>
</AccordionGroup>

## 單向安全政策

<Warning>
OpenClaw 刻意不寫入包含歷史明文 secret 值的復原備份。
</Warning>

安全模型：

- 進入寫入模式前，預檢必須成功
- 提交前會驗證執行階段啟用
- 套用會使用原子檔案替換來更新檔案，並在失敗時盡力還原

## 舊版驗證相容性注意事項

對於靜態憑證，執行階段不再依賴明文舊版驗證儲存。

- 執行階段憑證來源是已解析的記憶體內快照。
- 發現舊版靜態 `api_key` 項目時會清除。
- OAuth 相關相容性行為保持分離。

## Web UI 注意事項

部分 SecretInput unions 在原始編輯器模式中比表單模式更容易設定。

## 相關

- [驗證](/zh-TW/gateway/authentication) — 驗證設定
- [CLI：secrets](/zh-TW/cli/secrets) — CLI 命令
- [環境變數](/zh-TW/help/environment) — 環境優先順序
- [SecretRef 憑證範圍](/zh-TW/reference/secretref-credential-surface) — 憑證範圍
- [Secrets 套用計畫合約](/zh-TW/gateway/secrets-plan-contract) — 計畫合約詳細資訊
- [安全性](/zh-TW/gateway/security) — 安全態勢
