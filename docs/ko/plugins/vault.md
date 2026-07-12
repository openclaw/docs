---
read_when:
    - OpenClaw이 HashiCorp Vault에서 API 키를 읽도록 설정하려는 경우
    - 로컬 머신 또는 서버에서 SecretRefs를 설정하고 있습니다
    - Vault 기반 모델 제공자 자격 증명을 구성해야 합니다
summary: 번들로 제공되는 Vault Plugin을 사용하여 HashiCorp Vault에서 SecretRef를 확인합니다.
title: Vault SecretRef들
x-i18n:
    generated_at: "2026-07-12T01:05:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# Vault SecretRef

번들로 제공되는 Vault Plugin을 사용하면 OpenClaw가 Gateway 시작 및 다시 로드 시 HashiCorp Vault에서 `exec` SecretRef를 해석할 수 있습니다. OpenClaw는 Vault 참조를 구성에 저장하고, 해석된 값은 메모리 내 시크릿 스냅샷에 유지하며, 해석된 API 키를 `openclaw.json`에 다시 기록하지 않습니다.

이미 Vault를 실행 중이거나 모델 공급자 키를 OpenClaw 구성 파일 외부에 보관하려는 경우 이 기능을 사용하세요. SecretRef 런타임 모델은 [시크릿 관리](/ko/gateway/secrets)를 참조하세요.

## 시작하기 전에

다음이 필요합니다.

- 번들 `vault` Plugin을 사용할 수 있는 OpenClaw
- 연결 가능한 Vault 서버
- OpenClaw가 해석해야 하는 시크릿 경로에 대한 읽기 권한이 있는 클라이언트 토큰을 생성할 수 있는 Vault 인증
- Gateway를 시작하는 환경에 `VAULT_ADDR`과 함께 `VAULT_TOKEN`, 또는 `VAULT_TOKEN_FILE`을 사용하는 `OPENCLAW_VAULT_AUTH_METHOD=token_file`, 또는 구성된 JWT/Kubernetes 로그인이 포함되어야 함

해석기는 Node에서 HTTP를 통해 Vault와 통신합니다. Gateway에서 SecretRef를 해석하는 데 Vault CLI는 필요하지 않습니다.

`openclaw vault` 명령을 실행하기 전에 번들 Plugin을 활성화하세요.

```bash
openclaw plugins enable vault
```

## Vault에 공급자 키 저장

OpenClaw의 기본값은 `secret`에 마운트된 KV v2이며, Vault 개발 서버 예제와 일치합니다. 프로덕션 Vault에서는 SecretRef ID를 생성하기 전에 `OPENCLAW_VAULT_KV_MOUNT`를 실제 KV 마운트 경로로 설정하세요. OpenClaw 기본값을 사용할 경우 다음 SecretRef ID는

```text
providers/openrouter/apiKey
```

다음 Vault 필드를 읽습니다.

```text
secret/data/providers/openrouter -> apiKey
```

Vault CLI로 이를 생성하는 방법 중 하나는 다음과 같습니다.

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

OpenClaw에는 루트 토큰이 아닌 범위가 제한된 클라이언트 토큰을 사용하세요. 기본 KV v2 레이아웃에서 모델 공급자 키를 위한 최소 정책은 다음과 같습니다.

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## Gateway에서 Vault 사용 가능하게 설정

컨테이너화되지 않은 로컬 Gateway의 경우 OpenClaw를 시작하는 동일한 셸에서 Vault 설정을 내보내세요. 기본 인증 방식은 `VAULT_TOKEN`에서 Vault 클라이언트 토큰을 읽습니다.

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

Vault Agent가 토큰 싱크 파일을 기록하는 경우 토큰 파일 인증을 사용하세요.

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

사설 CA가 서명한 Vault 서버의 경우 해당 CA를 호스트 신뢰 저장소에 설치하고 Node 시스템 신뢰를 활성화하세요.

```bash
export NODE_USE_SYSTEM_CA=1
```

또는 PEM 번들을 직접 제공하세요.

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

이러한 변수는 OpenClaw가 시작될 때 존재해야 합니다. Vault Plugin은 해당 변수를 해석기 프로세스에 전달합니다.

비대화형 JWT 인증을 사용하려면 워크로드 JWT 파일과 `jwt` 유형의 Vault 역할을 사용하세요.

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

JWT 파일은 Vault 역할이 허용하는 대상이 지정된 Kubernetes 서비스 계정 토큰과 같은 프로젝션된 워크로드 토큰이어야 합니다.
대화형 OIDC 브라우저 로그인은 사용자에게 유용하지만, Gateway 런타임에는 비대화형 JWT 로그인 또는 토큰 파일이 필요합니다.

Vault의 Kubernetes 인증 방식에는 `kubernetes`를 사용하세요. 이는 Pod로 실행되는 Gateway를 위한 방식입니다. 기본 마운트는 `kubernetes`이고 기본 JWT 파일은 표준 서비스 계정 토큰 경로입니다.

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

Vault가 Kubernetes 인증을 `auth/kubernetes`가 아닌 다른 위치에 마운트한 경우에만 `OPENCLAW_VAULT_AUTH_MOUNT`를 설정하세요. 서비스 계정 토큰이 사용자 지정 경로에 프로젝션된 경우에만 `OPENCLAW_VAULT_JWT_FILE`을 설정하세요.

선택적 설정:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

현재 셸에서 확인할 수 있는 항목을 점검하세요.

```bash
openclaw vault status
```

Vault 기반 시크릿 공급자가 둘 이상 구성된 경우 별칭으로 하나를 선택하세요.

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status`는 `VAULT_TOKEN`을 출력하지 않습니다. 토큰, 토큰 파일, JWT 파일의 설정 여부만 보고합니다.

<Warning>
Gateway가 서비스, LaunchAgent, systemd 유닛, 예약 작업 또는 컨테이너로 실행되는 경우 해당 런타임 환경에도 동일한 Vault 변수를 전달해야 합니다. 대화형 셸에서 변수를 설정해도 해당 셸에 대해서만 입증될 뿐, 이미 실행 중인 Gateway에는 적용되지 않습니다.
</Warning>

## SecretRef 계획 생성 및 적용

OpenRouter의 모델 공급자 API 키를 Vault에 매핑하는 계획을 생성하세요.

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

계획을 적용하고 검증하세요.

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

Vault Plugin은 OpenClaw가 관리하는 exec SecretRef 공급자를 통해 해석하므로 `--allow-exec`를 사용하세요.

Gateway가 아직 실행 중이 아니라면 계획을 적용한 후 `openclaw secrets reload`를 실행하는 대신 정상적으로 시작하세요.

## 추가 공급자 키 구성

기본 제공 단축 옵션:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

하나의 계획에 여러 공급자 키 포함:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

단축 옵션이 없는 번들 공급자 또는 이미 구성된 OpenAI 호환 및 사용자 지정 모델 공급자에는 `--provider-key`를 사용하세요.

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

각 `--provider-key <provider=id>`는 `models.providers.<provider>.apiKey`에 SecretRef를 기록합니다. 사용자 지정 공급자의 경우 공급자의 `baseUrl`, `api` 또는 `models` 설정은 생성하지 않으므로 먼저 해당 설정을 구성하세요.

알려진 SecretRef 대상 경로에는 `--target <path=id>`를 사용하세요.

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

접두사가 없는 대상 경로는 `openclaw.json`에 적용됩니다. 기존 `auth-profiles.json` 대상에는 `auth-profiles:<agentId>:<path>`를 사용하세요.
대상 경로는 등록된 OpenClaw SecretRef 대상이어야 합니다. 설정 명령은 OpenClaw에 임의의 명명된 시크릿을 생성하지 않습니다. Vault가 계속 시크릿 저장소 역할을 하며, OpenClaw는 지원되는 구성 필드에만 SecretRef를 저장합니다.

## SecretRef ID 형식

Vault SecretRef ID는 다음 규칙을 사용합니다.

```text
<vault-secret-path>/<field>
```

예:

| SecretRef ID                  | 기본 KV v2 Vault 읽기              | 반환 필드      |
| ----------------------------- | ---------------------------------- | -------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`       |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`       |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`   |

반환되는 Vault 필드는 문자열이어야 합니다.

KV v1의 경우 다음을 설정하세요.

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

그러면 `providers/openrouter/apiKey`는 다음을 읽습니다.

```text
secret/providers/openrouter -> apiKey
```

## OpenClaw가 저장하는 내용

Vault 설정 계획을 적용하면 Plugin이 관리하는 공급자가 저장됩니다.

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

자격 증명 필드는 해당 공급자를 가리킵니다.

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

해석된 값은 활성 런타임 시크릿 스냅샷에만 존재합니다.

## 컨테이너 및 관리형 배포

컨테이너화된 Gateway도 동일한 Plugin 및 SecretRef 구성을 사용합니다. 컨테이너에는 다음 항목을 전달해야 합니다.

- `VAULT_ADDR`
- 다음 인증 소스 중 하나:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` 및 `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` 및 `OPENCLAW_VAULT_AUTH_MOUNT`, `OPENCLAW_VAULT_AUTH_ROLE`, `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` 및 `OPENCLAW_VAULT_AUTH_ROLE`; 필요에 따라 `OPENCLAW_VAULT_AUTH_MOUNT` 또는 `OPENCLAW_VAULT_JWT_FILE` 재정의
- 선택적 `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT`, `OPENCLAW_VAULT_KV_VERSION`

Kubernetes를 사용할 때 클러스터에 Vault Kubernetes 인증이 구성되어 있다면 `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`를 권장합니다. Vault가 클러스터를 일반 JWT/OIDC 발급자로 취급하도록 구성된 경우에만 `OPENCLAW_VAULT_AUTH_METHOD=jwt`를 사용하세요. 두 옵션 모두 Kubernetes Secret에 장기 Vault 토큰을 저장하는 것보다 낫습니다. Vault Agent 사이드카 또는 인젝터 배포에서는 대신 `token_file`을 사용할 수 있습니다.

멀티테넌트 Vault 설정에서는 테넌트 라우팅을 Vault 정책과 배포 구성에 유지하세요. OpenClaw에는 고정된 마운트, 역할 또는 경로가 필요하지 않습니다. 각 Gateway 환경에서 자체 `OPENCLAW_VAULT_KV_MOUNT`, `OPENCLAW_VAULT_AUTH_ROLE`, SecretRef ID를 설정할 수 있습니다. 하나의 공유 Gateway에서 서로 다른 Vault 사용자의 시크릿을 동시에 해석해야 하는 경우 서로 다른 인증 환경을 래핑하는 수동 구성 exec 공급자를 사용하거나, 별도의 Vault 환경 변수를 사용하는 Gateway 환경으로 테넌트를 분리하세요.

## 관련 문서

- [시크릿 관리](/ko/gateway/secrets)
- [`openclaw secrets`](/ko/cli/secrets)
- [Plugin 목록](/ko/plugins/plugin-inventory)
