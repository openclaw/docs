---
read_when:
    - 새로운 코어 기능과 Plugin 등록 표면 추가하기
    - 코드를 코어, vendor Plugin 또는 feature Plugin 중 어디에 둘지 결정하기
    - 채널 또는 도구를 위한 새 런타임 도우미 연결하기
sidebarTitle: Adding Capabilities
summary: OpenClaw Plugin 시스템에 새로운 공용 기능을 추가하기 위한 기여자 가이드
title: 기능 추가하기(기여자 가이드)
x-i18n:
    generated_at: "2026-04-24T09:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 864506dd3f61aa64e7c997c9d9e05ce0ad70c80a26a734d4f83b2e80331be4ab
    source_path: tools/capability-cookbook.md
    workflow: 15
---

<Info>
  이는 OpenClaw 코어 개발자를 위한 **기여자 가이드**입니다. 외부 Plugin을
  만들고 있다면 대신 [Building Plugins](/ko/plugins/building-plugins)를 참고하세요.
</Info>

이미지 생성, 비디오 생성 또는 향후 vendor 기반 기능 영역 같은 새로운 도메인이
OpenClaw에 필요할 때 이 가이드를 사용하세요.

원칙은 다음과 같습니다.

- plugin = 소유권 경계
- capability = 공용 코어 계약

즉, vendor를 채널이나 도구에 직접 연결하는 것부터 시작하면 안 됩니다.
먼저 capability를 정의하세요.

## capability를 만들어야 하는 경우

다음이 모두 참일 때 새로운 capability를 만드세요.

1. 둘 이상의 vendor가 충분히 구현할 수 있음
2. 채널, 도구 또는 feature Plugin이 vendor를 신경 쓰지 않고 이를 소비해야 함
3. 코어가 fallback, 정책, config 또는 전달 동작을 소유해야 함

작업이 vendor 전용이고 아직 공용 계약이 없다면, 먼저 계약을 정의하고 나서 진행하세요.

## 표준 순서

1. 타입이 지정된 코어 계약을 정의합니다.
2. 해당 계약에 대한 Plugin 등록을 추가합니다.
3. 공용 런타임 도우미를 추가합니다.
4. 실제 vendor Plugin 하나를 증명용으로 연결합니다.
5. feature/channel 소비자를 런타임 도우미로 이동합니다.
6. Contract 테스트를 추가합니다.
7. 운영자용 config와 소유권 모델을 문서화합니다.

## 무엇을 어디에 둘지

코어:

- 요청/응답 타입
- provider 레지스트리 + 해석
- fallback 동작
- config 스키마와 중첩 객체, 와일드카드, 배열 항목, composition 노드에 전파되는 `title` / `description` 문서 메타데이터
- 런타임 도우미 표면

Vendor Plugin:

- vendor API 호출
- vendor 인증 처리
- vendor 전용 요청 정규화
- capability 구현 등록

Feature/channel Plugin:

- `api.runtime.*` 또는 일치하는 `plugin-sdk/*-runtime` 도우미 호출
- vendor 구현을 직접 호출하지 않음

## Provider 및 Harness Seam

동작이 일반적인 에이전트 루프가 아니라 모델 provider 계약에 속한다면 provider hooks를 사용하세요. 예를 들면 transport 선택 이후의 provider 전용 요청 매개변수, auth-profile 선호도, 프롬프트 오버레이, 모델/profile failover 이후의 후속 fallback 라우팅 등이 있습니다.

동작이 턴을 실행하는 런타임에 속한다면 agent harness hooks를 사용하세요. Harness는 비어 있는 응답, reasoning 전용 응답, planning 전용 응답처럼 성공했지만 사용할 수 없는 시도 결과를 분류할 수 있으므로, 외부 모델 fallback 정책이 재시도 여부를 결정할 수 있습니다.

두 seam 모두 좁게 유지하세요.

- 코어는 재시도/fallback 정책을 소유함
- provider Plugin은 provider 전용 요청/인증/라우팅 힌트를 소유함
- harness Plugin은 런타임 전용 시도 분류를 소유함
- 서드파티 Plugin은 코어 상태를 직접 변경하는 대신 힌트를 반환함

## 파일 체크리스트

새 capability의 경우 다음 영역을 수정하게 될 가능성이 큽니다.

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

이미지 생성은 표준 구조를 따릅니다.

1. 코어가 `ImageGenerationProvider`를 정의함
2. 코어가 `registerImageGenerationProvider(...)`를 노출함
3. 코어가 `runtime.imageGeneration.generate(...)`를 노출함
4. `openai`, `google`, `fal`, `minimax` Plugin이 vendor 기반 구현을 등록함
5. 향후 vendor도 채널/도구를 변경하지 않고 동일한 계약을 등록할 수 있음

config 키는 vision-analysis 라우팅과 별개입니다.

- `agents.defaults.imageModel` = 이미지 분석
- `agents.defaults.imageGenerationModel` = 이미지 생성

fallback과 정책이 명시적으로 유지되도록 둘을 분리하세요.

## 검토 체크리스트

새 capability를 배포하기 전에 다음을 확인하세요.

- 어떤 채널/도구도 vendor 코드를 직접 import하지 않음
- 런타임 도우미가 공용 경로임
- 적어도 하나의 Contract 테스트가 번들 소유권을 검증함
- config 문서가 새 모델/config 키를 명시함
- Plugin 문서가 소유권 경계를 설명함

PR이 capability 계층을 건너뛰고 vendor 동작을 채널/도구에 하드코딩했다면,
반려하고 먼저 계약을 정의하세요.

## 관련 항목

- [Plugin](/ko/tools/plugin)
- [Creating skills](/ko/tools/creating-skills)
- [도구와 plugins](/ko/tools)
