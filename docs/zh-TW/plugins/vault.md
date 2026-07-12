---
read_when:
    - 您想讓 OpenClaw 從 HashiCorp Vault 讀取 API 金鑰
    - 你正在本機或伺服器上設定 SecretRefs
    - 你需要設定由 Vault 支援的模型供應商憑證
summary: 使用內建的 Vault 外掛，從 HashiCorp Vault 解析 SecretRefs
title: 保險庫 SecretRefs
x-i18n:
    generated_at: "2026-07-11T21:40:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# Vault SecretRefs

內建的 Vault 外掛可讓 OpenClaw 在閘道啟動及重新載入時，從 HashiCorp Vault 解析 `exec` SecretRefs。OpenClaw 會在設定中儲存 Vault 參照，將解析後的值保留於記憶體內的密鑰快照中，且不會把解析後的 API 金鑰寫回 `openclaw.json`。

若你已在使用 Vault，或希望模型供應商金鑰存放於 OpenClaw 設定檔之外，請使用此功能。如需了解 SecretRef 執行階段模型，請參閱[密鑰管理](/zh-TW/gateway/secrets)。

## 開始之前

你需要：

- 提供內建 `vault` 外掛的 OpenClaw
- 可連線的 Vault 伺服器
- 能產生用戶端權杖的 Vault 驗證，且該權杖具有 OpenClaw 所需解析密鑰路徑的讀取權限
- 啟動閘道的環境必須包含 `VAULT_ADDR`，以及下列任一項：`VAULT_TOKEN`、搭配 `VAULT_TOKEN_FILE` 的 `OPENCLAW_VAULT_AUTH_METHOD=token_file`，或已設定的 JWT/Kubernetes 登入方式

解析器會透過 HTTP 從節點與 Vault 通訊。閘道不需要 Vault 命令列介面即可解析 SecretRefs。

執行 `openclaw vault` 命令前，請先啟用內建外掛：

```bash
openclaw plugins enable vault
```

## 在 Vault 中儲存供應商金鑰

OpenClaw 預設使用掛載於 `secret` 的 KV v2，與 Vault 開發伺服器範例一致。若使用正式環境的 Vault，請在建立 SecretRef 識別碼前，將 `OPENCLAW_VAULT_KV_MOUNT` 設為實際的 KV 掛載路徑。使用 OpenClaw 預設值時，此 SecretRef 識別碼：

```text
providers/openrouter/apiKey
```

會讀取此 Vault 欄位：

```text
secret/data/providers/openrouter -> apiKey
```

使用 Vault 命令列介面建立此項目的一種方式是：

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

請為 OpenClaw 使用有限範圍的用戶端權杖，而非根權杖。對於預設的 KV v2 配置，模型供應商金鑰的最小權限原則如下：

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## 讓閘道能存取 Vault

對於未容器化的本機閘道，請在啟動 OpenClaw 的同一個殼層中匯出 Vault 設定。預設驗證方式會從 `VAULT_TOKEN` 讀取 Vault 用戶端權杖：

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

若 Vault Agent 會寫入權杖接收檔案，請使用權杖檔案驗證：

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

若 Vault 伺服器使用私有 CA 簽署，請將該 CA 安裝至主機信任儲存區，並啟用節點系統信任：

```bash
export NODE_USE_SYSTEM_CA=1
```

或直接提供 PEM 憑證套件：

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

OpenClaw 啟動時必須存在這些變數。Vault 外掛會將它們轉送至其解析器程序。

若要使用非互動式 JWT 驗證，請使用工作負載 JWT 檔案及 `jwt` 類型的 Vault 角色：

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

JWT 檔案應為投射的工作負載權杖，例如其受眾由 Vault 角色接受的 Kubernetes 服務帳戶權杖。
互動式 OIDC 瀏覽器登入適合供人員使用，但閘道執行階段需要非互動式 JWT 登入或權杖檔案。

若使用 Vault 的 Kubernetes 驗證方式，請使用 `kubernetes`。這適用於以 Pod 執行的閘道；預設掛載點為 `kubernetes`，預設 JWT 檔案則是標準服務帳戶權杖路徑：

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

只有在 Vault 將 Kubernetes 驗證掛載於 `auth/kubernetes` 以外的位置時，才需設定 `OPENCLAW_VAULT_AUTH_MOUNT`。只有在服務帳戶權杖投射至自訂路徑時，才需設定 `OPENCLAW_VAULT_JWT_FILE`。

選用設定：

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

檢查目前殼層可存取的內容：

```bash
openclaw vault status
```

設定多個由 Vault 支援的密鑰供應商時，請依別名選取其中一個：

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status` 絕不會顯示 `VAULT_TOKEN`；它只會回報權杖、權杖檔案和 JWT 檔案是否已設定。

<Warning>
若閘道以服務、LaunchAgent、systemd 單元、排程工作或容器執行，該執行階段環境必須取得相同的 Vault 變數。在互動式殼層中設定變數只能證明該殼層的狀態，不能證明已在執行的閘道也具有這些變數。
</Warning>

## 產生並套用 SecretRef 計畫

建立將 OpenRouter 模型供應商 API 金鑰對應至 Vault 的計畫：

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

套用並驗證計畫：

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

請使用 `--allow-exec`，因為 Vault 外掛會透過由 OpenClaw 管理的 exec SecretRef 供應商進行解析。

若閘道尚未執行，請在套用計畫後正常啟動閘道，而不要執行 `openclaw secrets reload`。

## 設定更多供應商金鑰

內建捷徑：

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

在單一計畫中設定多個供應商金鑰：

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

沒有捷徑的內建供應商，或已設定的 OpenAI 相容及自訂模型供應商，請使用 `--provider-key`：

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

每個 `--provider-key <provider=id>` 都會將 SecretRef 寫入 `models.providers.<provider>.apiKey`。對於自訂供應商，它不會建立供應商的 `baseUrl`、`api` 或 `models` 設定；請先設定這些項目。

對任何已知的 SecretRef 目標路徑，請使用 `--target <path=id>`：

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

不含前綴的目標路徑會套用至 `openclaw.json`。對現有的 `auth-profiles.json` 目標，請使用 `auth-profiles:<agentId>:<path>`。
目標路徑必須是已註冊的 OpenClaw SecretRef 目標。設定命令不會在 OpenClaw 中建立任意具名密鑰；Vault 仍是密鑰儲存區，而 OpenClaw 只會在支援的設定欄位中儲存 SecretRefs。

## SecretRef 識別碼格式

Vault SecretRef 識別碼採用以下慣例：

```text
<vault-secret-path>/<field>
```

範例：

| SecretRef 識別碼             | 預設 KV v2 Vault 讀取路徑          | 傳回欄位     |
| ----------------------------- | ---------------------------------- | -------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`       |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`       |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`   |

Vault 傳回的欄位必須是字串。

若使用 KV v1，請設定：

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

接著，`providers/openrouter/apiKey` 會讀取：

```text
secret/providers/openrouter -> apiKey
```

## OpenClaw 儲存的內容

套用 Vault 設定計畫後，會儲存由外掛管理的供應商：

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

憑證欄位會指向該供應商：

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

解析後的值只會存在於作用中的執行階段密鑰快照。

## 容器與受管理部署

容器化閘道仍使用相同的外掛與 SecretRef 設定。容器必須取得：

- `VAULT_ADDR`
- 一種驗證來源：
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` 加上 `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` 加上 `OPENCLAW_VAULT_AUTH_MOUNT`、`OPENCLAW_VAULT_AUTH_ROLE` 和 `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` 加上 `OPENCLAW_VAULT_AUTH_ROLE`；可選擇覆寫 `OPENCLAW_VAULT_AUTH_MOUNT` 或 `OPENCLAW_VAULT_JWT_FILE`
- 選用的 `VAULT_NAMESPACE`、`OPENCLAW_VAULT_KV_MOUNT` 和 `OPENCLAW_VAULT_KV_VERSION`

使用 Kubernetes 時，若 Vault 已為叢集設定 Kubernetes 驗證，建議使用 `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`。只有在 Vault 已設定為將叢集視為一般 JWT/OIDC 簽發者時，才使用 `OPENCLAW_VAULT_AUTH_METHOD=jwt`。兩者都優於將長期有效的 Vault 權杖存放於 Kubernetes Secret 中。使用 Vault Agent Sidecar 或注入器的部署則可改用 `token_file`。

對於多租戶 Vault 設定，請將租戶路由保留於 Vault 原則與部署設定中。OpenClaw 不要求固定的掛載點、角色或路徑：每個閘道環境都可以設定自己的 `OPENCLAW_VAULT_KV_MOUNT`、`OPENCLAW_VAULT_AUTH_ROLE` 和 SecretRef 識別碼。若單一共用閘道必須同時為不同 Vault 使用者解析密鑰，請使用手動設定的 exec 供應商來封裝不同的驗證環境，或將租戶分散至具有不同 Vault 環境變數的閘道環境。

## 相關內容

- [密鑰管理](/zh-TW/gateway/secrets)
- [`openclaw secrets`](/zh-TW/cli/secrets)
- [外掛清單](/zh-TW/plugins/plugin-inventory)
