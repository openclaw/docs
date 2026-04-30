---
read_when:
    - 인증 프로필 확인 또는 자격 증명 라우팅 작업
    - 모델 인증 실패 또는 프로필 순서 디버깅
summary: 인증 프로필의 정식 자격 증명 적격성 및 해결 의미 체계
title: 인증 자격 증명의 의미 체계
x-i18n:
    generated_at: "2026-04-30T21:02:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

이 문서는 다음 전반에서 사용되는 표준 자격 증명 적격성 및 해석 의미 체계를 정의합니다.

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

목표는 선택 시점과 런타임 동작을 일치시키는 것입니다.

## 안정적인 probe 이유 코드

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## 토큰 자격 증명

토큰 자격 증명(`type: "token"`)은 인라인 `token` 및/또는 `tokenRef`를 지원합니다.

### 적격성 규칙

1. 토큰 프로필은 `token`과 `tokenRef`가 모두 없을 때 부적격입니다.
2. `expires`는 선택 사항입니다.
3. `expires`가 있으면 `0`보다 큰 유한한 숫자여야 합니다.
4. `expires`가 유효하지 않으면(`NaN`, `0`, 음수, 비유한 값 또는 잘못된 타입) 프로필은 `invalid_expires`로 부적격입니다.
5. `expires`가 과거이면 프로필은 `expired`로 부적격입니다.
6. `tokenRef`는 `expires` 검증을 우회하지 않습니다.

### 해석 규칙

1. 리졸버 의미 체계는 `expires`에 대한 적격성 의미 체계와 일치합니다.
2. 적격 프로필의 경우 토큰 자료는 인라인 값 또는 `tokenRef`에서 해석될 수 있습니다.
3. 해석할 수 없는 ref는 `models status --probe` 출력에서 `unresolved_ref`를 생성합니다.

## 에이전트 복사 이식성

에이전트 인증 상속은 read-through입니다. 에이전트에 로컬 프로필이 없으면 런타임에 기본/메인 에이전트 저장소에서 프로필을 해석할 수 있으며, 비밀 자료를 자체 `auth-profiles.json`에 복사하지 않아도 됩니다.

`openclaw agents add` 같은 명시적 복사 흐름은 이 이식성 정책을 사용합니다.

- `api_key` 프로필은 `copyToAgents: false`가 아닌 한 이식 가능합니다.
- `token` 프로필은 `copyToAgents: false`가 아닌 한 이식 가능합니다.
- `oauth` 프로필은 refresh token이 단일 사용이거나 회전에 민감할 수 있으므로 기본적으로 이식 가능하지 않습니다.
- provider 소유 OAuth 흐름은 에이전트 간 refresh 자료 복사가 안전하다고 알려진 경우에만 `copyToAgents: true`로 옵트인할 수 있습니다.

이식 불가능한 프로필은 대상 에이전트가 별도로 로그인하여 자체 로컬 프로필을 만들지 않는 한 read-through 상속을 통해 계속 사용할 수 있습니다.

## 명시적 인증 순서 필터링

- provider에 대해 `auth.order.<provider>` 또는 auth-store 순서 override가 설정되면, `models status --probe`는 해당 provider의 해석된 인증 순서에 남아 있는 프로필 ID만 probe합니다.
- 명시적 순서에서 누락된 해당 provider의 저장된 프로필은 나중에 조용히 시도되지 않습니다. Probe 출력은 이를 `reasonCode: excluded_by_auth_order` 및 상세 정보 `Excluded by auth.order for this provider.`로 보고합니다.

## Probe 대상 해석

- Probe 대상은 인증 프로필, 환경 자격 증명 또는 `models.json`에서 올 수 있습니다.
- provider에 자격 증명이 있지만 OpenClaw가 해당 provider에 대해 probe 가능한 모델 후보를 해석할 수 없으면, `models status --probe`는 `reasonCode: no_model`과 함께 `status: no_model`을 보고합니다.

## 외부 CLI 자격 증명 검색

- 외부 CLI가 소유한 런타임 전용 자격 증명은 provider, 런타임 또는 인증 프로필이 현재 작업 범위에 있거나, 해당 외부 소스에 대한 저장된 로컬 프로필이 이미 존재할 때만 검색됩니다.
- Auth-store 호출자는 명시적인 외부 CLI 검색 모드를 선택해야 합니다. 지속된/Plugin 인증만을 위한 `none`, 이미 저장된 외부 CLI 프로필을 새로 고치기 위한 `existing`, 또는 구체적인 provider/프로필 집합을 위한 `scoped`입니다.
- 읽기 전용/상태 경로는 `allowKeychainPrompt: false`를 전달합니다. 파일 기반 외부 CLI 자격 증명만 사용하며 macOS Keychain 결과를 읽거나 재사용하지 않습니다.

## OAuth SecretRef 정책 가드

- SecretRef 입력은 정적 자격 증명 전용입니다.
- 프로필 자격 증명이 `type: "oauth"`이면 해당 프로필 자격 증명 자료에 SecretRef 객체가 지원되지 않습니다.
- `auth.profiles.<id>.mode`가 `"oauth"`이면 해당 프로필에 대한 SecretRef 기반 `keyRef`/`tokenRef` 입력은 거부됩니다.
- 위반은 startup/reload 인증 해석 경로에서 하드 실패입니다.

## 레거시 호환 메시징

스크립트 호환성을 위해 probe 오류는 이 첫 줄을 변경하지 않고 유지합니다.

`Auth profile credentials are missing or expired.`

사람이 이해하기 쉬운 상세 정보와 안정적인 이유 코드는 이후 줄에 추가될 수 있습니다.

## 관련 항목

- [비밀 관리](/ko/gateway/secrets)
- [인증 저장소](/ko/concepts/oauth)
