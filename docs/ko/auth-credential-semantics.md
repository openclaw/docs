---
read_when:
    - 인증 프로필 확인 또는 자격 증명 라우팅 작업 중
    - 모델 인증 실패 또는 프로필 순서 디버깅
summary: 인증 프로필의 표준 자격 증명 적격성 및 확인 의미 체계
title: 인증 자격 증명 의미 체계
x-i18n:
    generated_at: "2026-07-12T00:32:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

이러한 의미 체계는 선택 시점과 런타임 인증 동작을 일치시킵니다. 다음에서 공유됩니다.

- `resolveAuthProfileOrder`(프로필 순서 지정)
- `resolveApiKeyForProfile`(런타임 자격 증명 확인)
- `openclaw models status --probe`
- `openclaw doctor` 인증 검사(`doctor-auth`)

## 안정적인 프로브 사유 코드

프로브 결과에는 `status` 범주(`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`)가 포함되며, 프로브가 모델 호출에 도달하지 못한 경우 안정적인 `reasonCode`도 포함됩니다.

| `reasonCode`             | 의미                                                                             |
| ------------------------ | -------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | 해당 제공자의 명시적 인증 순서에서 프로필이 제외되었습니다.                      |
| `missing_credential`     | 인라인 자격 증명 또는 SecretRef가 구성되지 않았습니다.                            |
| `expired`                | 토큰의 `expires`가 과거 시점입니다.                                               |
| `invalid_expires`        | `expires`가 유효한 양의 Unix 밀리초 타임스탬프가 아닙니다.                        |
| `unresolved_ref`         | 구성된 SecretRef를 확인할 수 없습니다.                                            |
| `ineligible_profile`     | 프로필이 제공자 구성과 호환되지 않습니다(잘못된 키 입력 포함).                    |
| `no_model`               | 자격 증명은 있지만 프로브할 수 있는 모델 후보를 확인하지 못했습니다.              |

적격성 검사에서는 사용할 수 있는 자격 증명의 사유 코드로 `ok`를 보고합니다.

## 토큰 자격 증명

토큰 자격 증명(`type: "token"`)은 인라인 `token` 및/또는 `tokenRef`를 지원합니다.

### 적격성 규칙

1. `token`과 `tokenRef`가 모두 없으면 토큰 프로필은 부적격입니다(`missing_credential`).
2. `expires`는 선택 사항입니다. 지정하는 경우 `0`보다 크고 JavaScript `Date` 타임스탬프의 최댓값(8640000000000000) 이하인 유한한 Unix epoch 밀리초 숫자여야 합니다.
3. `expires`가 유효하지 않으면(잘못된 유형, `NaN`, `0`, 음수, 유한하지 않은 값 또는 해당 최댓값 초과) 프로필은 `invalid_expires`로 부적격 처리됩니다.
4. `expires`가 과거 시점이면 프로필은 `expired`로 부적격 처리됩니다.
5. `tokenRef`를 사용해도 `expires` 유효성 검사를 우회하지 않습니다.

### 확인 규칙

1. 확인자의 `expires` 의미 체계는 적격성 의미 체계와 일치합니다.
2. 적격 프로필의 토큰 자료는 인라인 값 또는 `tokenRef`에서 확인할 수 있습니다.
3. 확인할 수 없는 참조는 `models status --probe` 출력에 `unresolved_ref`로 표시됩니다.

## 에이전트 복사 이식성

에이전트 인증 상속은 읽기 위임 방식입니다. 에이전트에 로컬 프로필이 없으면 런타임에 기본/주 에이전트 저장소에서 프로필을 확인하며, 비밀 자료를 자체 자격 증명 저장소(`agents/<agentId>/agent/openclaw-agent.sqlite`)로 복사하지 않습니다.

`openclaw agents add`와 같은 명시적 복사 흐름에는 다음 이식성 정책이 적용됩니다.

- `copyToAgents: false`가 아니면 `api_key` 및 `token` 프로필은 이식할 수 있습니다.
- 새로 고침 토큰은 일회용이거나 순환에 민감할 수 있으므로 `oauth` 프로필은 기본적으로 이식할 수 없습니다.
- 에이전트 간에 새로 고침 자료를 복사해도 안전한 것으로 알려진 경우에만 제공자가 소유한 OAuth 흐름에서 `copyToAgents: true`로 동의할 수 있습니다. 이 동의는 프로필에 인라인 액세스/새로 고침 자료가 포함된 경우에만 적용됩니다.

대상 에이전트가 별도로 로그인하여 자체 로컬 프로필을 만들지 않는 한, 이식할 수 없는 프로필도 읽기 위임 상속을 통해 계속 사용할 수 있습니다.

## 구성 전용 인증 경로

`mode: "aws-sdk"`가 지정된 `auth.profiles` 항목은 저장된 자격 증명이 아니라 라우팅 메타데이터입니다. 대상 제공자가 `models.providers.<id>.auth: "aws-sdk"`를 사용하는 경우 유효하며, 이는 Plugin이 소유한 Amazon Bedrock 설정이 기록하는 경로입니다. 자격 증명 저장소에 일치하는 항목이 없더라도 이러한 프로필 ID는 `auth.order` 및 세션 재정의에 표시될 수 있습니다.

자격 증명 저장소에 `type: "aws-sdk"`를 기록하지 마십시오. 저장되는 자격 증명은 `api_key`, `token` 또는 `oauth`뿐입니다. 레거시 `auth-profiles.json`에 이러한 표식이 있으면 `openclaw doctor --fix`가 이를 `auth.profiles`로 이동하고 저장소에서 표식을 제거합니다.

## 명시적 인증 순서 필터링

- 제공자에 대해 `auth.order.<provider>` 또는 인증 저장소의 순서 재정의가 설정되면 `models status --probe`는 해당 제공자에 대해 확인된 인증 순서에 남아 있는 프로필 ID만 프로브합니다. 저장된 재정의가 `auth.order` 구성보다 우선합니다.
- 명시적 순서에서 제외된 해당 제공자의 저장된 프로필은 나중에 자동으로 시도되지 않습니다. 프로브 출력에는 `reasonCode: excluded_by_auth_order`와 세부 정보 `이 제공자의 auth.order에 의해 제외되었습니다.`가 표시됩니다.

## 프로브 대상 확인

- 프로브 대상은 인증 프로필, 환경 자격 증명 또는 `models.json`에서 가져올 수 있습니다(결과 `source`: `profile`, `env`, `models.json`).
- 제공자에 자격 증명이 있지만 OpenClaw가 프로브할 수 있는 모델 후보를 확인할 수 없는 경우 `models status --probe`는 `reasonCode: no_model`과 함께 `status: no_model`을 보고합니다.

## 외부 CLI 자격 증명 검색

- 외부 CLI가 소유한 런타임 전용 자격 증명(`claude-cli`용 Claude CLI, `openai`용 Codex CLI, `minimax-portal`용 MiniMax CLI)은 제공자, 런타임 또는 인증 프로필이 현재 작업의 범위에 포함되거나 해당 외부 소스의 저장된 로컬 프로필이 이미 있는 경우에만 검색됩니다.
- 인증 저장소 호출자는 명시적인 외부 CLI 검색 모드를 선택합니다. 영구 저장된 인증/Plugin 인증만 사용하려면 `none`, 이미 저장된 외부 CLI 프로필을 새로 고치려면 `existing`, 구체적인 제공자/프로필 집합에는 `scoped`를 사용합니다.
- 읽기 전용/상태 경로에서는 `allowKeychainPrompt: false`를 전달합니다. 파일 기반 외부 CLI 자격 증명만 사용하며 macOS Keychain 결과를 읽거나 재사용하지 않습니다.

## OAuth SecretRef 정책 보호 장치

SecretRef 입력은 정적 자격 증명에만 사용됩니다. OAuth 자격 증명은 런타임에 변경될 수 있으므로(새로 고침 흐름에서 순환된 토큰을 영구 저장함), SecretRef 기반 OAuth 자료를 사용하면 변경 가능한 상태가 여러 저장소로 분할됩니다.

- 프로필 자격 증명이 `type: "oauth"`이면 해당 프로필의 모든 자격 증명 자료 필드에서 SecretRef 객체가 거부됩니다.
- `auth.profiles.<id>.mode`가 `"oauth"`이면 해당 프로필에 대한 SecretRef 기반 `keyRef`/`tokenRef` 입력이 거부됩니다.
- 위반 시 시작/다시 불러오기 비밀 준비 및 프로필 확인 경로에서 치명적 실패(오류 발생)로 처리됩니다.

## 레거시 호환 메시지

스크립트 호환성을 위해 프로브 오류의 첫 번째 줄은 다음과 같이 변경되지 않습니다.

`Auth profile credentials are missing or expired.`

이후 줄에는 사람이 이해하기 쉬운 세부 정보와 안정적인 사유 코드가 `↳ Auth reason [code]: ...` 형식으로 표시됩니다.

## 관련 문서

- [비밀 관리](/ko/gateway/secrets)
- [인증 저장소](/ko/concepts/oauth)
