---
read_when:
    - 새 핵심 기능과 Plugin 등록 인터페이스 추가
    - 코드가 코어, 벤더 Plugin 또는 기능 Plugin 중 어디에 속하는지 결정하기
    - 채널 또는 도구용 새 런타임 헬퍼 연결하기
sidebarTitle: Adding capabilities
summary: OpenClaw Plugin 시스템에 새로운 공유 기능을 추가하기 위한 기여자 가이드
title: 기능 추가(기여자 가이드)
x-i18n:
    generated_at: "2026-05-06T06:34:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e289c95d9dc5924b5cc7b67428386660b83052b6cf6f14fc4f838fc88b7a25c
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  이는 OpenClaw 코어 개발자를 위한 **기여자 가이드**입니다. 외부 Plugin을
  빌드하는 경우 대신 [Plugin 빌드하기](/ko/plugins/building-plugins)를 참조하세요.
  심층 아키텍처 참조(기능 모델, 소유권, 로드 파이프라인, 런타임 헬퍼)는
  [Plugin 내부 구조](/ko/plugins/architecture)를 참조하세요.
</Info>

OpenClaw에 이미지 생성, 비디오 생성 또는 향후 벤더 기반 기능 영역 같은 새 공유 도메인이 필요할 때 이 문서를 사용하세요.

규칙:

- **Plugin** = 소유권 경계
- **기능** = 공유 코어 계약

벤더를 채널이나 도구에 직접 연결하는 것부터 시작하지 마세요. 기능을 정의하는 것부터 시작하세요.

## 기능을 생성해야 하는 경우

다음 조건이 **모두** 참일 때 새 기능을 생성하세요.

1. 둘 이상의 벤더가 그 기능을 구현할 가능성이 있습니다.
2. 채널, 도구 또는 기능 Plugin이 벤더를 신경 쓰지 않고 이를 사용할 수 있어야 합니다.
3. 코어가 폴백, 정책, 설정 또는 전달 동작을 소유해야 합니다.

작업이 벤더 전용이고 아직 공유 계약이 없다면 중단하고 먼저 계약을 정의하세요.

## 표준 순서

1. 타입이 지정된 코어 계약을 정의합니다.
2. 해당 계약에 대한 Plugin 등록을 추가합니다.
3. 공유 런타임 헬퍼를 추가합니다.
4. 증명으로 실제 벤더 Plugin 하나를 연결합니다.
5. 기능/채널 소비자를 런타임 헬퍼로 이동합니다.
6. 계약 테스트를 추가합니다.
7. 운영자 대상 설정과 소유권 모델을 문서화합니다.

## 위치별 책임

**코어:**

- 요청/응답 타입.
- 제공자 레지스트리 + 해석.
- 폴백 동작.
- 중첩 객체, 와일드카드, 배열 항목, 컴포지션 노드에 전파된 `title` / `description` 문서 메타데이터가 포함된 설정 스키마.
- 런타임 헬퍼 표면.

**벤더 Plugin:**

- 벤더 API 호출.
- 벤더 인증 처리.
- 벤더별 요청 정규화.
- 기능 구현 등록.

**기능/채널 Plugin:**

- `api.runtime.*` 또는 일치하는 `plugin-sdk/*-runtime` 헬퍼를 호출합니다.
- 벤더 구현을 직접 호출하지 않습니다.

## 제공자 및 하네스 경계

동작이 일반 에이전트 루프가 아니라 모델 제공자 계약에 속할 때 **제공자 훅**을 사용하세요. 예로는 전송 선택 후 제공자별 요청 매개변수, 인증 프로필 선호도, 프롬프트 오버레이, 모델/프로필 장애 조치 후 후속 폴백 라우팅이 있습니다.

동작이 턴을 실행하는 런타임에 속할 때 **에이전트 하네스 훅**을 사용하세요. 하네스는 비어 있음, 추론만 있음 또는 계획만 있음 같은 성공했지만 사용할 수 없는 시도 결과를 분류하여 외부 모델 폴백 정책이 재시도 결정을 내릴 수 있게 합니다.

두 경계 모두 좁게 유지하세요.

- 코어는 재시도/폴백 정책을 소유합니다.
- 제공자 Plugin은 제공자별 요청/인증/라우팅 힌트를 소유합니다.
- 하네스 Plugin은 런타임별 시도 분류를 소유합니다.
- 서드파티 Plugin은 코어 상태를 직접 변경하지 않고 힌트를 반환합니다.

## 파일 체크리스트

새 기능의 경우 다음 영역을 수정할 가능성이 큽니다.

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
- 하나 이상의 번들 Plugin 패키지.
- 설정, 문서, 테스트.

## 작업 예시: 이미지 생성

이미지 생성은 표준 형태를 따릅니다.

1. 코어가 `ImageGenerationProvider`를 정의합니다.
2. 코어가 `registerImageGenerationProvider(...)`를 노출합니다.
3. 코어가 `runtime.imageGeneration.generate(...)`를 노출합니다.
4. `openai`, `google`, `fal`, `minimax` Plugin이 벤더 기반 구현을 등록합니다.
5. 향후 벤더는 채널/도구를 변경하지 않고 동일한 계약을 등록합니다.

설정 키는 의도적으로 비전 분석 라우팅과 분리되어 있습니다.

- `agents.defaults.imageModel`은 이미지를 분석합니다.
- `agents.defaults.imageGenerationModel`은 이미지를 생성합니다.

폴백과 정책이 명시적으로 유지되도록 이 둘을 분리해 두세요.

## 리뷰 체크리스트

새 기능을 출시하기 전에 다음을 확인하세요.

- 채널/도구가 벤더 코드를 직접 가져오지 않습니다.
- 런타임 헬퍼가 공유 경로입니다.
- 하나 이상의 계약 테스트가 번들 소유권을 검증합니다.
- 설정 문서가 새 모델/설정 키를 명시합니다.
- Plugin 문서가 소유권 경계를 설명합니다.

PR이 기능 계층을 건너뛰고 벤더 동작을 채널/도구에 하드코딩한다면 되돌려 보내고 먼저 계약을 정의하세요.

## 관련

- [Plugin 내부 구조](/ko/plugins/architecture) — 기능 모델, 소유권, 로드 파이프라인, 런타임 헬퍼.
- [Plugin 빌드하기](/ko/plugins/building-plugins) — 첫 Plugin 튜토리얼.
- [SDK 개요](/ko/plugins/sdk-overview) — 가져오기 맵 및 등록 API 참조.
- [Skills 만들기](/ko/tools/creating-skills) — 함께 사용하는 기여자 표면.
