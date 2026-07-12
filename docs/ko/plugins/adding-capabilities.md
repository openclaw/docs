---
read_when:
    - 새로운 핵심 기능 및 Plugin 등록 인터페이스 추가
    - 코드가 코어, 공급업체 Plugin 또는 기능 Plugin 중 어디에 속하는지 결정하기
    - 채널 또는 도구용 새 런타임 헬퍼 연결하기
sidebarTitle: Adding capabilities
summary: OpenClaw Plugin 시스템에 새로운 공유 기능을 추가하기 위한 기여자 가이드
title: 기능 추가(기여자 가이드)
x-i18n:
    generated_at: "2026-07-12T15:26:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3534b7521ab8183d91399cded8a3b397be46bf9bd18f2fdb88a8947bad67ffaa
    source_path: plugins/adding-capabilities.md
    workflow: 16
---

<Info>
  이 문서는 OpenClaw 코어 개발자를 위한 **기여자 가이드**입니다. 외부 Plugin을
  개발하는 경우에는 대신 [Plugin 빌드하기](/ko/plugins/building-plugins)를 참조하십시오.
  심층 아키텍처 참조 문서(기능 모델, 소유권, 로드 파이프라인, 런타임 헬퍼)는
  [Plugin 내부 구조](/ko/plugins/architecture)를 참조하십시오.
</Info>

OpenClaw에 임베딩, 이미지 생성, 동영상 생성 또는 향후 벤더가 지원하는 기능 영역과 같은 새로운 공유 도메인이 필요할 때 이 문서를 사용하십시오.

규칙은 다음과 같습니다.

- **Plugin** = 소유권 경계
- **기능** = 공유 코어 계약

벤더를 채널이나 도구에 직접 연결하지 마십시오. 먼저 기능을 정의하십시오.

## 기능을 생성해야 하는 경우

다음 조건을 **모두** 충족하는 경우에만 새 기능을 생성하십시오.

1. 둘 이상의 벤더가 해당 기능을 구현할 가능성이 있어야 합니다.
2. 채널, 도구 또는 기능 Plugin이 벤더를 신경 쓰지 않고 해당 기능을 사용할 수 있어야 합니다.
3. 코어가 폴백, 정책, 구성 또는 전달 동작을 소유해야 합니다.

작업이 특정 벤더에만 해당하고 공유 계약이 아직 없다면 먼저 계약을 정의하십시오.

## 표준 순서

1. 타입이 지정된 코어 계약을 정의합니다.
2. 해당 계약에 대한 Plugin 등록을 추가합니다.
3. 공유 런타임 헬퍼를 추가합니다.
4. 실제 벤더 Plugin 하나를 증명 사례로 연결합니다.
5. 기능/채널 소비자가 런타임 헬퍼를 사용하도록 이전합니다.
6. 계약 테스트를 추가합니다.
7. 운영자용 구성과 소유권 모델을 문서화합니다.

## 각 요소의 위치

| 계층                       | 소유 범위                                                                                                                                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **코어**                   | 요청/응답 타입, 제공자 레지스트리 및 결정, 폴백 동작, 중첩 객체·와일드카드·배열 항목·컴포지션 노드에 전파되는 `title`/`description` 문서 메타데이터를 포함한 구성 스키마, 런타임 헬퍼 표면. |
| **벤더 Plugin**            | 벤더 API 호출, 벤더 인증 처리, 벤더별 요청 정규화 및 기능 구현 등록.                                                                                                     |
| **기능/채널 Plugin**       | `api.runtime.*` 또는 이에 대응하는 `plugin-sdk/*-runtime` 헬퍼를 호출합니다. 벤더 구현을 직접 호출해서는 안 됩니다.                                                                                                                    |

## 제공자 및 하네스 연결부

동작이 일반 에이전트 루프가 아니라 모델 제공자 계약에 속하는 경우 **제공자 훅**을 사용하십시오. 예를 들면 전송 방식 선택 후 적용되는 제공자별 요청 매개변수, 인증 프로필 기본 설정, 프롬프트 오버레이, 모델/프로필 장애 조치 후의 후속 폴백 라우팅 등이 있습니다.

동작이 턴을 실행하는 런타임에 속하는 경우 **에이전트 하네스 훅**을 사용하십시오. 하네스는 빈 출력, 표시되는 출력 없이 추론만 있는 경우 또는 최종 답변 없이 구조화된 계획만 있는 경우와 같은 명시적 프로토콜 결과를 분류하여 외부 모델 폴백 정책이 재시도 여부를 결정하도록 할 수 있습니다.

두 연결부 모두 범위를 좁게 유지하십시오.

- 코어는 재시도/폴백 정책을 소유합니다.
- 제공자 Plugin은 제공자별 요청/인증/라우팅 힌트를 소유합니다.
- 하네스 Plugin은 런타임별 시도 분류를 소유합니다.
- 서드 파티 Plugin은 코어 상태를 직접 변경하지 않고 힌트를 반환합니다.

## 파일 체크리스트

새 기능을 추가할 때는 다음 영역을 수정하게 됩니다.

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
- 구성, 문서, 테스트.

## 실제 예시: 이미지 생성

이미지 생성은 표준 구조를 따릅니다.

1. 코어에서 `ImageGenerationProvider`를 정의합니다.
2. 코어에서 `registerImageGenerationProvider(...)`를 노출합니다.
3. 코어에서 `api.runtime.imageGeneration.generate(...)` 및 `.listProviders(...)`를 노출합니다.
4. 벤더 Plugin(`comfy`, `deepinfra`, `fal`, `google`, `litellm`, `microsoft-foundry`, `minimax`, `openai`, `openrouter`, `vydra`, `xai`)이 벤더 지원 구현을 등록합니다.
5. 향후 벤더는 채널/도구를 변경하지 않고 동일한 계약을 등록합니다.

구성 키는 의도적으로 비전 분석 라우팅과 분리되어 있습니다.

- `agents.defaults.imageModel`은 이미지를 분석합니다.
- `agents.defaults.imageGenerationModel`은 이미지를 생성합니다.

폴백과 정책을 명시적으로 유지할 수 있도록 두 항목을 분리하십시오.

## 임베딩 제공자

재사용 가능한 벡터 임베딩 제공자에는 `registerEmbeddingProvider(...)` / 계약 `embeddingProviders`를 사용하십시오. 이 계약은 의도적으로 메모리보다 넓은 범위를 지원합니다. 도구, 검색, 검색 증강, 가져오기 도구 또는 향후 기능 Plugin이 메모리 엔진에 의존하지 않고 임베딩을 사용할 수 있습니다. 메모리 검색도 일반 `embeddingProviders`를 사용합니다.

이전의 메모리 전용 등록 API와 `memoryEmbeddingProviders` 계약은 더 이상 사용되지 않습니다. 모든 새 임베딩 제공자에는 `registerEmbeddingProvider`와 `embeddingProviders`를 사용하십시오.

## 검토 체크리스트

새 기능을 출시하기 전에 다음 사항을 확인하십시오.

- 어떤 채널/도구도 벤더 코드를 직접 가져오지 않습니다.
- 런타임 헬퍼가 공유 경로입니다.
- 하나 이상의 계약 테스트에서 번들 소유권을 검증합니다.
- 구성 문서에 새 모델/구성 키가 명시되어 있습니다.
- Plugin 문서에 소유권 경계가 설명되어 있습니다.

PR이 기능 계층을 건너뛰고 벤더 동작을 채널/도구에 하드코딩한다면 반려하고 먼저 계약을 정의하도록 하십시오.

## 관련 문서

- [Plugin 내부 구조](/ko/plugins/architecture) — 기능 모델, 소유권, 로드 파이프라인, 런타임 헬퍼.
- [Plugin 빌드하기](/ko/plugins/building-plugins) — 첫 Plugin 튜토리얼.
- [SDK 개요](/ko/plugins/sdk-overview) — 가져오기 맵 및 등록 API 참조.
- [Skills 생성하기](/ko/tools/creating-skills) — 연계 기여자 표면.
