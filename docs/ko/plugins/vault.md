---
read_when:
    - OpenClaw이 HashiCorp Vault에서 API 키를 읽도록 하려는 경우
    - 로컬 컴퓨터 또는 서버에서 SecretRefs를 설정하고 있습니다
    - Vault 기반 모델 제공자 자격 증명을 구성해야 합니다
summary: 번들로 제공되는 Vault Plugin을 사용하여 HashiCorp Vault의 SecretRef를 확인합니다
title: 볼트 SecretRef
x-i18n:
    generated_at: "2026-07-12T15:37:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# Vault SecretRef

번들로 제공되는 Vault 플러그인을 사용하면 OpenClaw가 Gateway 시작 및 다시 로드 시
HashiCorp Vault에서 `exec` SecretRef를 확인할 수 있습니다. OpenClaw는 Vault
참조를 구성에 저장하고, 확인된 값을 메모리 내 시크릿 스냅샷에 유지하며,
확인된 API 키를 `openclaw.json`에 다시 기록하지 않습니다.

이미 Vault를 실행하고 있거나 모델 제공자 키를 OpenClaw 구성 파일 외부에
보관하려는 경우 이 기능을 사용하십시오. SecretRef 런타임 모델에 대해서는
[시크릿 관리](/ko/gateway/secrets)를 참조하십시오.

## 시작하기 전에

다음이 필요합니다.

- 번들 `vault` 플러그인을 사용할 수 있는 OpenClaw
- 연결 가능한 Vault 서버
- OpenClaw가 확인해야 하는 시크릿 경로에 대한 읽기 권한이 있는 클라이언트 토큰을
  생성할 수 있는 Vault 인증
- Gateway를 시작하는 환경에 `VAULT_ADDR`와 다음 중 하나가 포함되어야 합니다.
  `VAULT_TOKEN`, `VAULT_TOKEN_FILE`과 함께 사용하는
  `OPENCLAW_VAULT_AUTH_METHOD=token_file`, 또는 구성된 JWT/Kubernetes 로그인

리졸버는 Node에서 HTTP를 통해 Vault와 통신합니다. Gateway에서 SecretRef를
확인하기 위해 Vault CLI가 필요하지 않습니다.

`openclaw vault` 명령을 실행하기 전에 번들 플러그인을 활성화하십시오.

```bash
openclaw plugins enable vault
```

## Vault에 제공자 키 저장

OpenClaw는 Vault 개발 서버 예시와 일치하도록 `secret`에 마운트된 KV v2를
기본값으로 사용합니다. 프로덕션 Vault에서는 SecretRef ID를 생성하기 전에
`OPENCLAW_VAULT_KV_MOUNT`를 실제 KV 마운트 경로로 설정하십시오. OpenClaw
기본값을 사용하면 다음 SecretRef ID는

```text
providers/openrouter/apiKey
```

다음 Vault 필드를 읽습니다.

```text
secret/data/providers/openrouter -> apiKey
```

Vault CLI를 사용해 생성하는 한 가지 방법은 다음과 같습니다.

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

OpenClaw에는 루트 토큰이 아닌 범위가 제한된 클라이언트 토큰을 사용하십시오.
기본 KV v2 레이아웃에서 모델 제공자 키에 대한 최소 정책은 다음과 같습니다.

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## Gateway에서 Vault를 사용할 수 있도록 설정

컨테이너화되지 않은 로컬 Gateway의 경우 OpenClaw를 시작하는 동일한 셸에서
Vault 설정을 내보내십시오. 기본 인증 방식은 `VAULT_TOKEN`에서 Vault 클라이언트
토큰을 읽습니다.

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

Vault Agent가 토큰 싱크 파일을 기록하는 경우 토큰 파일 인증을 사용하십시오.

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

비공개 CA가 서명한 Vault 서버의 경우 해당 CA를 호스트 신뢰 저장소에 설치하고
Node 시스템 신뢰를 활성화하십시오.

```bash
export NODE_USE_SYSTEM_CA=1
```

또는 PEM 번들을 직접 제공하십시오.

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

OpenClaw가 시작될 때 이러한 변수가 있어야 합니다. Vault 플러그인은 해당 변수를
리졸버 프로세스에 전달합니다.

비대화형 JWT 인증의 경우 워크로드 JWT 파일과 `jwt` 유형의 Vault 역할을
사용하십시오.

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

JWT 파일은 Vault 역할에서 허용하는 대상이 지정된 Kubernetes 서비스 계정
토큰과 같은 프로젝션된 워크로드 토큰이어야 합니다.
대화형 OIDC 브라우저 로그인은 사람에게 유용하지만 Gateway 런타임에는
비대화형 JWT 로그인 또는 토큰 파일이 필요합니다.

Vault의 Kubernetes 인증 방식에는 `kubernetes`를 사용하십시오. 이는 Pod로
실행되는 Gateway를 위한 방식입니다. 기본 마운트는 `kubernetes`이며, 기본 JWT
파일은 표준 서비스 계정 토큰 경로입니다.

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

Vault가 Kubernetes 인증을 `auth/kubernetes`가 아닌 다른 위치에 마운트한
경우에만 `OPENCLAW_VAULT_AUTH_MOUNT`를 설정하십시오. 서비스 계정 토큰이 사용자
지정 경로에 프로젝션된 경우에만 `OPENCLAW_VAULT_JWT_FILE`을 설정하십시오.

선택적 설정:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

현재 셸에서 확인할 수 있는 항목을 검사하십시오.

```bash
openclaw vault status
```

Vault 기반 시크릿 제공자가 두 개 이상 구성된 경우 별칭으로 하나를 선택하십시오.

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status`는 `VAULT_TOKEN`을 출력하지 않습니다. 토큰, 토큰 파일,
JWT 파일이 설정되어 있는지만 보고합니다.

<Warning>
Gateway가 서비스, LaunchAgent, systemd 유닛, 예약된 작업 또는 컨테이너로
실행되는 경우 해당 런타임 환경에도 동일한 Vault 변수가 전달되어야 합니다.
대화형 셸에 변수를 설정하는 것은 해당 셸에서만 유효함을 입증할 뿐, 이미 실행
중인 Gateway에는 적용되지 않습니다.
</Warning>

## SecretRef 계획 생성 및 적용

OpenRouter의 모델 제공자 API 키를 Vault에 매핑하는 계획을 생성하십시오.

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

계획을 적용하고 검증하십시오.

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

Vault 플러그인은 OpenClaw가 관리하는 exec SecretRef 제공자를 통해 확인하므로
`--allow-exec`를 사용하십시오.

Gateway가 아직 실행 중이 아닌 경우 계획을 적용한 후
`openclaw secrets reload`를 실행하는 대신 정상적으로 시작하십시오.

## 더 많은 제공자 키 구성

기본 제공 단축 옵션:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

하나의 계획에 여러 제공자 키 지정:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

단축 옵션이 없는 번들 제공자 또는 이미 구성된 OpenAI 호환 및 사용자 지정 모델
제공자에는 `--provider-key`를 사용하십시오.

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

각 `--provider-key <provider=id>`는 `models.providers.<provider>.apiKey`에
SecretRef를 기록합니다. 사용자 지정 제공자의 경우 제공자의 `baseUrl`, `api`
또는 `models` 설정은 생성하지 않으므로 먼저 해당 설정을 구성하십시오.

알려진 SecretRef 대상 경로에는 `--target <path=id>`를 사용하십시오.

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

접두사가 없는 대상 경로는 `openclaw.json`에 적용됩니다. 기존
`auth-profiles.json` 대상에는 `auth-profiles:<agentId>:<path>`를 사용하십시오.
대상 경로는 등록된 OpenClaw SecretRef 대상이어야 합니다. setup 명령은 OpenClaw에
임의의 명명된 시크릿을 생성하지 않습니다. Vault가 시크릿 저장소로 유지되며,
OpenClaw는 지원되는 구성 필드에만 SecretRef를 저장합니다.

## SecretRef ID 형식

Vault SecretRef ID는 다음 규칙을 사용합니다.

```text
<vault-secret-path>/<field>
```

예시:

| SecretRef ID                  | 기본 KV v2 Vault 읽기              | 반환 필드      |
| ----------------------------- | ---------------------------------- | -------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`       |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`       |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`   |

반환되는 Vault 필드는 문자열이어야 합니다.

KV v1의 경우 다음을 설정하십시오.

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

그러면 `providers/openrouter/apiKey`는 다음을 읽습니다.

```text
secret/providers/openrouter -> apiKey
```

## OpenClaw가 저장하는 항목

Vault 설정 계획을 적용하면 플러그인이 관리하는 제공자가 저장됩니다.

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

자격 증명 필드는 해당 제공자를 가리킵니다.

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

확인된 값은 활성 런타임 시크릿 스냅샷에만 존재합니다.

## 컨테이너 및 관리형 배포

컨테이너화된 Gateway도 동일한 플러그인과 SecretRef 구성을 사용합니다.
컨테이너에는 다음이 전달되어야 합니다.

- `VAULT_ADDR`
- 다음 중 하나의 인증 소스:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file`과 `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt`와 `OPENCLAW_VAULT_AUTH_MOUNT`,
    `OPENCLAW_VAULT_AUTH_ROLE`, `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`와 `OPENCLAW_VAULT_AUTH_ROLE`,
    필요에 따라 `OPENCLAW_VAULT_AUTH_MOUNT` 또는 `OPENCLAW_VAULT_JWT_FILE` 재정의
- 선택 사항인 `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT`,
  `OPENCLAW_VAULT_KV_VERSION`

Kubernetes를 사용할 때 Vault에 클러스터용 Kubernetes 인증이 구성되어 있다면
`OPENCLAW_VAULT_AUTH_METHOD=kubernetes`를 권장합니다. Vault가 클러스터를
일반 JWT/OIDC 발급자로 취급하도록 구성된 경우에만
`OPENCLAW_VAULT_AUTH_METHOD=jwt`를 사용하십시오. 두 옵션 모두 Kubernetes
Secret에 장기 Vault 토큰을 저장하는 것보다 낫습니다. Vault Agent 사이드카 또는
인젝터 배포에서는 대신 `token_file`을 사용할 수 있습니다.

다중 테넌트 Vault 설정에서는 테넌트 라우팅을 Vault 정책과 배포 구성에
유지하십시오. OpenClaw에는 고정된 마운트, 역할 또는 경로가 필요하지 않습니다.
각 Gateway 환경에서 자체 `OPENCLAW_VAULT_KV_MOUNT`,
`OPENCLAW_VAULT_AUTH_ROLE` 및 SecretRef ID를 설정할 수 있습니다. 하나의 공유
Gateway가 여러 Vault 사용자를 동시에 확인해야 하는 경우 서로 다른 인증 환경을
래핑하는 수동 구성 exec 제공자를 사용하거나, 별도의 Vault 환경 변수를 사용하는
Gateway 환경으로 테넌트를 분리하십시오.

## 관련 문서

- [시크릿 관리](/ko/gateway/secrets)
- [`openclaw secrets`](/ko/cli/secrets)
- [플러그인 인벤토리](/ko/plugins/plugin-inventory)
