---
read_when:
    - 인증 프로필 해석 또는 자격 증명 라우팅 작업
    - 모델 인증 실패 또는 프로필 순서 디버깅
summary: 인증 프로필에 대한 표준 자격 증명 적격성 및 확인 의미 체계
title: 인증 자격 증명의 의미
x-i18n:
    generated_at: "2026-04-30T06:16:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

이 문서는 다음 전반에서 사용되는 표준 자격 증명 적격성 및 확인 의미 체계를 정의합니다.

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

목표는 선택 시점과 런타임 동작을 일치하게 유지하는 것입니다.

## 안정적인 프로브 이유 코드

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

1. 토큰 프로필은 `token`과 `tokenRef`가 모두 없을 때 부적격합니다.
2. `expires`는 선택 사항입니다.
3. `expires`가 있으면 `0`보다 큰 유한한 숫자여야 합니다.
4. `expires`가 유효하지 않으면(`NaN`, `0`, 음수, 비유한 값 또는 잘못된 타입) 프로필은 `invalid_expires`로 부적격합니다.
5. `expires`가 과거이면 프로필은 `expired`로 부적격합니다.
6. `tokenRef`는 `expires` 검증을 우회하지 않습니다.

### 확인 규칙

1. 리졸버 의미 체계는 `expires`에 대한 적격성 의미 체계와 일치합니다.
2. 적격한 프로필의 경우 토큰 자료는 인라인 값 또는 `tokenRef`에서 확인될 수 있습니다.
3. 확인할 수 없는 참조는 `models status --probe` 출력에 `unresolved_ref`를 생성합니다.

## 에이전트 복사 이식성

에이전트 인증 상속은 읽기-통과 방식입니다. 에이전트에 로컬 프로필이 없으면 런타임에 비밀 자료를 자체 `auth-profiles.json`으로 복사하지 않고도 기본/메인 에이전트 저장소에서 프로필을 확인할 수 있습니다.

`openclaw agents add`와 같은 명시적 복사 플로는 이 이식성 정책을 사용합니다.

- `api_key` 프로필은 `copyToAgents: false`가 아니면 이식 가능합니다.
- `token` 프로필은 `copyToAgents: false`가 아니면 이식 가능합니다.
- `oauth` 프로필은 새로 고침 토큰이 단일 사용이거나 로테이션에 민감할 수 있으므로 기본적으로 이식 가능하지 않습니다.
- 제공자가 소유한 OAuth 플로는 에이전트 간 새로 고침 자료 복사가 안전하다고 알려진 경우에만 `copyToAgents: true`로 옵트인할 수 있습니다.

이식 불가능한 프로필은 대상 에이전트가 별도로 로그인하여 자체 로컬 프로필을 만들지 않는 한 읽기-통과 상속을 통해 계속 사용할 수 있습니다.

## 명시적 인증 순서 필터링

- 제공자에 대해 `auth.order.<provider>` 또는 인증 저장소 순서 재정의가 설정된 경우, `models status --probe`는 해당 제공자의 확인된 인증 순서에 남아 있는 프로필 ID만 프로브합니다.
- 명시적 순서에서 생략된 해당 제공자의 저장된 프로필은 나중에 자동으로 다시 시도되지 않습니다. 프로브 출력은 이를 `reasonCode: excluded_by_auth_order` 및 세부 정보 `Excluded by auth.order for this provider.`와 함께 보고합니다.

## 프로브 대상 확인

- 프로브 대상은 인증 프로필, 환경 자격 증명 또는 `models.json`에서 올 수 있습니다.
- 제공자에 자격 증명이 있지만 OpenClaw가 해당 제공자에 대해 프로브 가능한 모델 후보를 확인할 수 없는 경우, `models status --probe`는 `reasonCode: no_model`과 함께 `status: no_model`을 보고합니다.

## 외부 CLI 자격 증명 검색

- 외부 CLI가 소유한 런타임 전용 자격 증명은 제공자, 런타임 또는 인증 프로필이 현재 작업의 범위에 있거나 해당 외부 소스에 대해 저장된 로컬 프로필이 이미 존재하는 경우에만 검색됩니다.
- 읽기 전용/상태 경로는 `allowKeychainPrompt: false`를 전달합니다. 이 경로는 파일 기반 외부 CLI 자격 증명만 사용하며 macOS Keychain 결과를 읽거나 재사용하지 않습니다.

## OAuth SecretRef 정책 가드

- SecretRef 입력은 정적 자격 증명 전용입니다.
- 프로필 자격 증명이 `type: "oauth"`이면 해당 프로필 자격 증명 자료에는 SecretRef 객체가 지원되지 않습니다.
- `auth.profiles.<id>.mode`가 `"oauth"`이면 해당 프로필의 SecretRef 기반 `keyRef`/`tokenRef` 입력이 거부됩니다.
- 위반은 시작/다시 로드 인증 확인 경로에서 하드 실패입니다.

## 레거시 호환 메시징

스크립트 호환성을 위해 프로브 오류는 이 첫 줄을 변경하지 않고 유지합니다.

`Auth profile credentials are missing or expired.`

사람이 읽기 쉬운 세부 정보와 안정적인 이유 코드는 후속 줄에 추가될 수 있습니다.

## 관련 항목

- [비밀 관리](/ko/gateway/secrets)
- [인증 저장소](/ko/concepts/oauth)
