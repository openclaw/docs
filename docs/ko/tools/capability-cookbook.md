---
read_when:
    - 새 core capability 및 Plugin 등록 표면 추가하기
    - 코드가 core, vendor Plugin, feature Plugin 중 어디에 속해야 하는지 결정하기
    - 채널 또는 도구용 새 런타임 helper 연결하기
sidebarTitle: Adding Capabilities
summary: OpenClaw Plugin 시스템에 새 공유 capability를 추가하기 위한 기여자 가이드
title: capability 추가하기(기여자 가이드)
x-i18n:
    generated_at: "2026-04-25T06:11:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: a2879b8a4a215dcc44086181e49c510edae93caff01e52c2f5e6b79e6cb02d7b
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  이것은 OpenClaw core 개발자를 위한 **기여자 가이드**입니다. 외부 Plugin을
  빌드하는 경우에는 대신 [Building Plugins](/ko/plugins/building-plugins)를 참조하세요.
</Info>

OpenClaw에 이미지 생성, 비디오
생성, 또는 향후 vendor 기반 기능 영역 같은 새 도메인이 필요할 때 이를 사용하세요.

규칙은 다음과 같습니다:

- plugin = 소유권 경계
- capability = 공유 core 계약

즉, vendor를 채널이나
도구에 직접 연결하는 것부터 시작하면 안 됩니다. capability를 정의하는 것부터 시작하세요.

## capability를 만들어야 하는 경우

다음 조건이 모두 참일 때 새 capability를 만드세요:

1. 둘 이상의 vendor가 그 기능을 구현할 가능성이 있다
2. 채널, 도구 또는 feature Plugin이
   vendor를 신경 쓰지 않고 이를 소비해야 한다
3. fallback, 정책, config, 또는 전송 동작을 core가 소유해야 한다

작업이 vendor 전용이고 아직 공유 계약이 없다면, 멈추고 먼저
계약을 정의하세요.

## 표준 순서

1. 타입이 지정된 core 계약을 정의합니다.
2. 해당 계약에 대한 Plugin 등록을 추가합니다.
3. 공유 런타임 helper를 추가합니다.
4. 하나의 실제 vendor Plugin을 증거로 연결합니다.
5. feature/channel 소비자를 런타임 helper로 이동합니다.
6. 계약 테스트를 추가합니다.
7. 운영자 대상 config와 소유권 모델을 문서화합니다.

## 무엇이 어디에 속하는가

Core:

- 요청/응답 타입
- provider registry + 확인
- fallback 동작
- config 스키마 및 중첩 객체, 와일드카드, 배열 항목, 조합 노드에 전파되는 `title` / `description` 문서 메타데이터
- 런타임 helper 표면

Vendor Plugin:

- vendor API 호출
- vendor 인증 처리
- vendor별 요청 정규화
- capability 구현 등록

Feature/channel Plugin:

- `api.runtime.*` 또는 일치하는 `plugin-sdk/*-runtime` helper를 호출
- vendor 구현을 직접 호출하지 않음

## Provider 및 harness 시임

동작이 일반 에이전트 루프가 아니라
모델 provider 계약에 속할 때는 provider Hook을 사용하세요. 예로는
전송 선택 후 provider별 요청 매개변수, auth-profile 선호도,
프롬프트 오버레이, 모델/profile 장애 조치 후 후속 fallback 라우팅이 있습니다.

동작이 턴을
실행하는 런타임에 속할 때는 agent harness Hook을 사용하세요. Harness는
성공했지만 사용할 수 없는 시도 결과(예: 빈 응답, reasoning 전용, planning 전용 응답)를 분류하여,
외부 모델 fallback 정책이 재시도 여부를 결정하게 할 수 있습니다.

두 시임 모두 좁게 유지하세요:

- 재시도/fallback 정책은 core가 소유
- provider 플러그인은 provider별 요청/auth/라우팅 힌트를 소유
- harness 플러그인은 런타임별 시도 분류를 소유
- 서드파티 Plugin은 core 상태를 직접 변경하는 것이 아니라 힌트만 반환

## 파일 체크리스트

새 capability의 경우 다음 영역을 건드리게 될 가능성이 높습니다:

- `src/<capability>/types.ts`
- `src/<capability>/...registry/runtime.ts`
- `src/plugins/types.ts`
- `src/plugins/registry.ts`
- `src/plugins/captured-registration.ts`
- `src/plugins/contracts/registry.ts`
- `src/plugins/runtime/types-core.ts`
- `src/plugins/runtime/index.ts`
- `src/plugin-sdk/<capability>.ts`
- `src/plugin-sdk/<capability>-runtime.ts`
- 하나 이상의 번들 Plugin 패키지
- config/docs/tests

## 예시: 이미지 생성

이미지 생성은 표준 형태를 따릅니다:

1. core가 `ImageGenerationProvider`를 정의
2. core가 `registerImageGenerationProvider(...)`를 노출
3. core가 `runtime.imageGeneration.generate(...)`를 노출
4. `openai`, `google`, `fal`, `minimax` Plugin이 vendor 기반 구현을 등록
5. 향후 vendor도 채널/도구 변경 없이 동일한 계약을 등록 가능

config 키는 비전 분석 라우팅과 분리됩니다:

- `agents.defaults.imageModel` = 이미지 분석
- `agents.defaults.imageGenerationModel` = 이미지 생성

fallback과 정책이 명시적으로 유지되도록 둘을 분리하세요.

## 검토 체크리스트

새 capability를 배포하기 전에 다음을 확인하세요:

- 어떤 채널/도구도 vendor 코드를 직접 import하지 않음
- 런타임 helper가 공유 경로임
- 적어도 하나의 계약 테스트가 번들 소유권을 단언함
- config 문서에 새 모델/config 키 이름이 나와 있음
- Plugin 문서가 소유권 경계를 설명함

PR이 capability 계층을 건너뛰고 vendor 동작을
채널/도구에 하드코딩한다면, 반려하고 먼저 계약을 정의하세요.

## 관련 항목

- [Plugin](/ko/tools/plugin)
- [Creating skills](/ko/tools/creating-skills)
- [Tools and plugins](/ko/tools)
