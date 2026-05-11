---
read_when:
    - 공급자 런타임 훅, 채널 수명 주기 또는 패키지 팩 구현
    - Plugin 로드 순서 또는 레지스트리 상태 디버깅
    - 새 Plugin 기능 또는 컨텍스트 엔진 Plugin 추가
summary: 'Plugin 아키텍처 내부: 로드 파이프라인, 레지스트리, 런타임 훅, HTTP 라우트, 참조 표'
title: Plugin 아키텍처 내부 구조
x-i18n:
    generated_at: "2026-05-11T20:32:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: a74c068fce039ef3b85b2634caea0854e8ffb246a5ff59ebd8feadb8d93601d6
    source_path: plugins/architecture-internals.md
    workflow: 16
---

공개 기능 모델, Plugin 형태, 소유권/실행 계약은 [Plugin 아키텍처](/ko/plugins/architecture)를 참조하세요. 이 페이지는 로드 파이프라인, 레지스트리, 런타임 훅, Gateway HTTP 라우트, import 경로, 스키마 표 같은 내부 메커니즘에 대한 참조 문서입니다.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다.

1. 후보 Plugin 루트 발견
2. 네이티브 또는 호환 번들 매니페스트와 패키지 메타데이터 읽기
3. 안전하지 않은 후보 거부
4. Plugin 구성 정규화(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 각 후보의 활성화 여부 결정
6. 활성화된 네이티브 모듈 로드: 빌드된 번들 모듈은 네이티브 로더를 사용하고,
   서드파티 로컬 소스 TypeScript는 비상용 Jiti 폴백을 사용
7. 네이티브 `register(api)` 훅 호출 및 등록 정보를 Plugin 레지스트리에 수집
8. 명령/런타임 표면에 레지스트리 노출

<Note>
`activate`는 `register`의 레거시 별칭입니다. 로더는 존재하는 쪽(`def.register ?? def.activate`)을 확인해 같은 지점에서 호출합니다. 모든 번들 Plugin은 `register`를 사용합니다. 새 Plugin에는 `register`를 선호하세요.
</Note>

안전 게이트는 런타임 실행 **전에** 발생합니다. 엔트리가 Plugin 루트를 벗어나거나, 경로가 전역 쓰기 가능하거나, 번들되지 않은 Plugin의 경로 소유권이 의심스러워 보이면 후보가 차단됩니다.

차단된 후보는 진단을 위해 해당 Plugin id와 계속 연결됩니다. 구성이 여전히 그 id를 참조하는 경우, 검증은 해당 Plugin을 존재하지만 차단된 것으로 보고하며, 구성 엔트리를 오래된 것으로 처리하는 대신 경로 안전 경고를 다시 가리킵니다.

### 매니페스트 우선 동작

매니페스트는 제어 플레인의 단일 진실 공급원입니다. OpenClaw는 이를 사용해 다음을 수행합니다.

- Plugin 식별
- 선언된 채널/Skills/구성 스키마 또는 번들 기능 발견
- `plugins.entries.<id>.config` 검증
- Control UI 레이블/플레이스홀더 보강
- 설치/카탈로그 메타데이터 표시
- Plugin 런타임을 로드하지 않고 저비용 활성화 및 설정 설명자 보존

네이티브 Plugin의 경우 런타임 모듈은 데이터 플레인 부분입니다. 이 모듈은 훅, 도구, 명령, 공급자 흐름 같은 실제 동작을 등록합니다.

선택적 매니페스트 `activation` 및 `setup` 블록은 제어 플레인에 남습니다. 이들은 활성화 계획 및 설정 발견을 위한 메타데이터 전용 설명자입니다. 런타임 등록, `register(...)`, 또는 `setupEntry`를 대체하지 않습니다.
첫 번째 라이브 활성화 소비자는 이제 더 넓은 레지스트리 구체화 전에 Plugin 로드를 좁히기 위해 매니페스트 명령, 채널, 공급자 힌트를 사용합니다.

- CLI 로드는 요청된 기본 명령을 소유한 Plugin으로 좁혀집니다
- 채널 설정/Plugin 확인은 요청된 채널 id를 소유한 Plugin으로 좁혀집니다
- 명시적 공급자 설정/런타임 확인은 요청된 공급자 id를 소유한 Plugin으로 좁혀집니다
- Gateway 시작 계획은 명시적 시작 import와 시작 옵트아웃에 `activation.onStartup`을 사용합니다. 시작 메타데이터가 없는 Plugin은 더 좁은 활성화 트리거를 통해서만 로드됩니다

넓은 `all` 범위를 요청하는 요청 시점 런타임 사전 로드는 여전히 구성, 시작 계획, 구성된 채널, 슬롯, 자동 활성화 규칙에서 명시적 유효 Plugin id 집합을 도출합니다. 도출된 집합이 비어 있으면 OpenClaw는 검색 가능한 모든 Plugin으로 확장하는 대신 빈 런타임 레지스트리를 로드합니다.

활성화 플래너는 기존 호출자를 위한 id 전용 API와 새 진단을 위한 계획 API를 모두 노출합니다. 계획 엔트리는 Plugin이 선택된 이유를 보고하며, 명시적 `activation.*` 플래너 힌트를 `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, 훅 같은 매니페스트 소유권 폴백과 분리합니다. 이 이유 분리가 호환성 경계입니다. 기존 Plugin 메타데이터는 계속 동작하고, 새 코드는 런타임 로드 의미를 변경하지 않고도 넓은 힌트나 폴백 동작을 감지할 수 있습니다.

설정 발견은 이제 `setup-api`로 폴백하기 전에 `setup.providers`와 `setup.cliBackends` 같은 설명자 소유 id를 선호해 후보 Plugin을 좁힙니다. `setup-api`는 여전히 설정 시점 런타임 훅이 필요한 Plugin을 위한 폴백입니다. 공급자 설정 목록은 공급자 런타임을 로드하지 않고 매니페스트 `providerAuthChoices`, 설명자에서 도출된 설정 선택지, 설치 카탈로그 메타데이터를 사용합니다. 명시적 `setup.requiresRuntime: false`는 설명자 전용 차단점입니다. 생략된 `requiresRuntime`은 호환성을 위해 레거시 setup-api 폴백을 유지합니다. 발견된 Plugin이 둘 이상 같은 정규화된 설정 공급자 또는 CLI 백엔드 id를 주장하면, 설정 조회는 발견 순서에 의존하지 않고 모호한 소유자를 거부합니다. 설정 런타임이 실행될 때 레지스트리 진단은 레거시 Plugin을 차단하지 않고 `setup.providers` / `setup.cliBackends`와 setup-api가 등록한 공급자 또는 CLI 백엔드 사이의 드리프트를 보고합니다.

### Plugin 캐시 경계

OpenClaw는 Plugin 발견 결과나 직접 매니페스트 레지스트리 데이터를 벽시계 시간 창 뒤에 캐시하지 않습니다. 설치, 매니페스트 편집, 로드 경로 변경은 다음 명시적 메타데이터 읽기 또는 스냅샷 재구성에서 표시되어야 합니다.
매니페스트 파일 파서는 열린 매니페스트 경로, inode, 크기, 타임스탬프로 키가 지정된 제한된 파일 시그니처 캐시를 유지할 수 있습니다. 그 캐시는 변경되지 않은 바이트의 재파싱만 피하며, 발견, 레지스트리, 소유자, 정책 답변을 캐시해서는 안 됩니다.

안전한 메타데이터 빠른 경로는 숨겨진 캐시가 아니라 명시적 객체 소유권입니다. Gateway 시작 핫 경로는 현재 `PluginMetadataSnapshot`, 도출된 `PluginLookUpTable`, 또는 명시적 매니페스트 레지스트리를 호출 체인으로 전달해야 합니다. 구성 검증, 시작 자동 활성화, Plugin 부트스트랩, 공급자 선택은 해당 객체들이 현재 구성과 Plugin 인벤토리를 나타내는 동안 재사용할 수 있습니다. 설정 조회는 특정 설정 경로가 명시적 매니페스트 레지스트리를 받지 않는 한 여전히 필요 시 매니페스트 메타데이터를 재구성합니다. 숨겨진 조회 캐시를 추가하지 말고 이를 콜드 경로 폴백으로 유지하세요. 입력이 변경되면 스냅샷을 변경하거나 과거 사본을 유지하는 대신 다시 빌드하고 교체하세요.
활성 Plugin 레지스트리에 대한 뷰와 번들 채널 부트스트랩 헬퍼는 현재 레지스트리/루트에서 다시 계산해야 합니다. 작업 중복 제거 또는 재진입 방지를 위해 한 번의 호출 내부에서 짧게 유지되는 맵은 괜찮지만, 프로세스 메타데이터 캐시가 되어서는 안 됩니다.

Plugin 로딩에서 영구 캐시 계층은 런타임 로딩입니다. 코드나 설치된 아티팩트가 실제로 로드될 때 다음과 같은 로더 상태를 재사용할 수 있습니다.

- `PluginLoaderCacheState` 및 호환 활성 런타임 레지스트리
- 같은 런타임 표면을 반복해서 import하지 않기 위해 사용되는 jiti/모듈 캐시와 공개 표면 로더 캐시
- 설치된 Plugin 아티팩트를 위한 파일 시스템 캐시
- 경로 정규화 또는 중복 해결을 위한 호출별 단기 맵

이러한 캐시는 데이터 플레인 구현 세부 사항입니다. 호출자가 의도적으로 런타임 로딩을 요청한 경우가 아니라면 "이 공급자를 소유한 Plugin은 무엇인가?" 같은 제어 플레인 질문에 답해서는 안 됩니다.

다음에 대해 영구 캐시나 벽시계 기반 캐시를 추가하지 마세요.

- 발견 결과
- 직접 매니페스트 레지스트리
- 설치된 Plugin 인덱스에서 재구성된 매니페스트 레지스트리
- 공급자 소유자 조회, 모델 억제, 공급자 정책, 또는 공개 아티팩트 메타데이터
- 변경된 매니페스트, 설치된 인덱스, 또는 로드 경로가 다음 메타데이터 읽기에서 표시되어야 하는 기타 매니페스트 파생 답변

영구 저장된 설치 Plugin 인덱스에서 매니페스트 메타데이터를 다시 빌드하는 호출자는 필요 시 해당 레지스트리를 재구성합니다. 설치된 인덱스는 durable 소스 플레인 상태입니다. 숨겨진 인프로세스 메타데이터 캐시가 아닙니다.

## 레지스트리 모델

로드된 Plugin은 임의의 코어 전역을 직접 변경하지 않습니다. 중앙 Plugin 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다.

- Plugin 레코드(식별자, 소스, 원본, 상태, 진단)
- 도구
- 레거시 훅과 타입이 지정된 훅
- 채널
- 공급자
- Gateway RPC 핸들러
- HTTP 라우트
- CLI 등록자
- 백그라운드 서비스
- Plugin 소유 명령

그런 다음 코어 기능은 Plugin 모듈과 직접 통신하는 대신 해당 레지스트리에서 읽습니다. 이렇게 하면 로딩이 단방향으로 유지됩니다.

- Plugin 모듈 -> 레지스트리 등록
- 코어 런타임 -> 레지스트리 소비

이 분리는 유지보수성에 중요합니다. 이는 대부분의 코어 표면이 "모든 Plugin 모듈을 특수 처리"하는 대신 "레지스트리 읽기"라는 하나의 통합 지점만 필요로 한다는 뜻입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 Plugin은 승인이 해결될 때 반응할 수 있습니다.

바인딩 요청이 승인되거나 거부된 후 콜백을 받으려면 `api.onConversationBindingResolved(...)`를 사용하세요.

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // A binding now exists for this plugin + conversation.
        console.log(event.binding?.conversationId);
        return;
      }

      // The request was denied; clear any local pending state.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, 또는 `"deny"`
- `binding`: 승인된 요청에 대해 해결된 바인딩
- `request`: 원래 요청 요약, 분리 힌트, 발신자 id, 대화 메타데이터

이 콜백은 알림 전용입니다. 대화를 바인딩할 수 있는 대상을 변경하지 않으며, 코어 승인 처리가 끝난 후 실행됩니다.

## 공급자 런타임 훅

공급자 Plugin에는 세 계층이 있습니다.

- 저비용 사전 런타임 조회를 위한 **매니페스트 메타데이터**:
  `setup.providers[].envVars`, 사용 중단된 호환성 `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, `channelEnvVars`.
- **구성 시점 훅**: `catalog`(레거시 `discovery`) 및
  `applyConfigDefaults`.
- **런타임 훅**: 인증, 모델 확인,
  스트림 래핑, 사고 수준, 리플레이 정책, 사용량 엔드포인트를 포괄하는 40개 이상의 선택적 훅. 전체 목록은 [훅 순서와 사용법](#hook-order-and-usage)을 참조하세요.

OpenClaw는 여전히 일반 에이전트 루프, 장애 조치, transcript 처리, 도구 정책을 소유합니다. 이러한 훅은 완전히 커스텀 추론 전송을 만들 필요 없이 공급자별 동작을 위한 확장 표면입니다.

공급자에 env 기반 자격 증명이 있고, 일반 인증/상태/모델 선택기 경로가 Plugin 런타임을 로드하지 않고 이를 확인해야 하는 경우 매니페스트 `setup.providers[].envVars`를 사용하세요. 사용 중단된 `providerAuthEnvVars`는 사용 중단 기간 동안 호환성 어댑터가 여전히 읽으며, 이를 사용하는 번들되지 않은 Plugin은 매니페스트 진단을 받습니다. 하나의 공급자 id가 다른 공급자 id의 env var, 인증 프로필, 구성 기반 인증, API 키 온보딩 선택지를 재사용해야 하는 경우 매니페스트 `providerAuthAliases`를 사용하세요. 온보딩/인증 선택 CLI 표면이 공급자의 선택 id, 그룹 레이블, 단순한 단일 플래그 인증 연결을 공급자 런타임 로드 없이 알아야 하는 경우 매니페스트 `providerAuthChoices`를 사용하세요. 온보딩 레이블이나 OAuth client-id/client-secret 설정 변수 같은 운영자 대상 힌트에는 공급자 런타임 `envVars`를 유지하세요.

채널에 일반 shell-env 폴백, 구성/상태 검사, 또는 설정 프롬프트가 채널 런타임을 로드하지 않고 확인해야 하는 env 기반 인증 또는 설정이 있는 경우 매니페스트 `channelEnvVars`를 사용하세요.

### 훅 순서와 사용법

모델/공급자 Plugin의 경우 OpenClaw는 대략 다음 순서로 훅을 호출합니다.
"When to use" 열은 빠른 결정 가이드입니다.
`ProviderPlugin.capabilities` 및 `suppressBuiltInModel`처럼 OpenClaw가 더 이상 호출하지 않는 호환성 전용 공급자 필드는 의도적으로 여기에 나열하지 않습니다.

| #   | 훅                              | 기능                                                                                                   | 사용 시점                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중에 공급자 구성을 `models.providers`에 게시                                | 공급자가 카탈로그 또는 기본 URL 기본값을 소유하는 경우                                                                                                  |
| 2   | `applyConfigDefaults`             | 구성 구체화 중에 공급자 소유 전역 구성 기본값을 적용                                      | 기본값이 인증 모드, 환경 또는 공급자 모델 계열 의미 체계에 따라 달라지는 경우                                                                         |
| --  | _(내장 모델 조회)_         | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도                                                          | _(Plugin 훅이 아님)_                                                                                                                         |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 미리 보기 모델 ID 별칭을 정규화                                                     | 공급자가 정식 모델 확인 전에 별칭 정리를 소유하는 경우                                                                                 |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 공급자 계열 `api` / `baseUrl`을 정규화                                      | 공급자가 같은 전송 계열의 사용자 지정 공급자 ID에 대한 전송 정리를 소유하는 경우                                                          |
| 5   | `normalizeConfig`                 | 런타임/공급자 확인 전에 `models.providers.<id>`를 정규화                                           | 공급자가 Plugin과 함께 있어야 하는 구성 정리가 필요한 경우. 번들 Google 계열 헬퍼도 지원되는 Google 구성 항목을 보완함   |
| 6   | `applyNativeStreamingUsageCompat` | 구성 공급자에 네이티브 스트리밍 사용량 호환 재작성을 적용                                               | 공급자가 엔드포인트 기반 네이티브 스트리밍 사용량 메타데이터 수정이 필요한 경우                                                                          |
| 7   | `resolveConfigApiKey`             | 런타임 인증 로드 전에 구성 공급자의 env-marker 인증을 확인                                       | 공급자 소유 env-marker API 키 확인이 있는 경우. `amazon-bedrock`에도 여기에 내장 AWS env-marker 확인기가 있음                  |
| 8   | `resolveSyntheticAuth`            | 평문을 유지하지 않고 로컬/자체 호스팅 또는 구성 기반 인증을 노출                                   | 공급자가 합성/로컬 자격 증명 마커로 동작할 수 있는 경우                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 공급자 소유 외부 인증 프로필을 오버레이. CLI/앱 소유 자격 증명에 대한 기본 `persistence`는 `runtime-only` | 공급자가 복사된 새로 고침 토큰을 유지하지 않고 외부 인증 자격 증명을 재사용하는 경우. 매니페스트에서 `contracts.externalAuthProviders` 선언 |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 합성 프로필 자리 표시자를 env/config 기반 인증 뒤로 낮춤                                      | 공급자가 우선순위를 차지해서는 안 되는 합성 자리 표시자 프로필을 저장하는 경우                                                                 |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 공급자 소유 모델 ID에 대한 동기식 폴백                                       | 공급자가 임의의 업스트림 모델 ID를 허용하는 경우                                                                                                 |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel`이 다시 실행됨                                                           | 공급자가 알 수 없는 ID를 확인하기 전에 네트워크 메타데이터가 필요한 경우                                                                                  |
| 13  | `normalizeResolvedModel`          | 임베디드 러너가 확인된 모델을 사용하기 전 최종 재작성                                               | 공급자에 전송 재작성이 필요하지만 여전히 코어 전송을 사용하는 경우                                                                             |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 전송 뒤의 공급업체 모델에 대한 호환 플래그 제공                                  | 공급자가 공급자를 인수하지 않고 프록시 전송에서 자체 모델을 인식하는 경우                                                       |
| 15  | `normalizeToolSchemas`            | 임베디드 러너가 보기 전에 도구 스키마를 정규화                                                    | 공급자가 전송 계열 스키마 정리가 필요한 경우                                                                                                |
| 16  | `inspectToolSchemas`              | 정규화 후 공급자 소유 스키마 진단을 노출                                                  | 공급자가 코어에 공급자별 규칙을 가르치지 않고 키워드 경고를 제공하려는 경우                                                                 |
| 17  | `resolveReasoningOutputMode`      | 네이티브와 태그 지정 추론 출력 계약 중 선택                                                              | 공급자가 네이티브 필드 대신 태그 지정 추론/최종 출력이 필요한 경우                                                                         |
| 18  | `prepareExtraParams`              | 일반 스트림 옵션 래퍼 전에 요청 매개변수 정규화                                              | 공급자가 기본 요청 매개변수 또는 공급자별 매개변수 정리가 필요한 경우                                                                           |
| 19  | `createStreamFn`                  | 일반 스트림 경로를 사용자 지정 전송으로 완전히 대체                                                   | 공급자가 단순 래퍼가 아니라 사용자 지정 와이어 프로토콜이 필요한 경우                                                                                     |
| 20  | `wrapStreamFn`                    | 일반 래퍼가 적용된 후의 스트림 래퍼                                                              | 공급자가 사용자 지정 전송 없이 요청 헤더/본문/모델 호환 래퍼가 필요한 경우                                                          |
| 21  | `resolveTransportTurnState`       | 네이티브 턴별 전송 헤더 또는 메타데이터를 첨부                                                           | 공급자가 일반 전송에서 공급자 네이티브 턴 ID를 보내려는 경우                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 쿨다운 정책을 첨부                                                    | 공급자가 일반 WS 전송의 세션 헤더 또는 폴백 정책을 조정하려는 경우                                                               |
| 23  | `formatApiKey`                    | 인증 프로필 포매터: 저장된 프로필이 런타임 `apiKey` 문자열이 됨                                     | 공급자가 추가 인증 메타데이터를 저장하고 사용자 지정 런타임 토큰 형태가 필요한 경우                                                                    |
| 24  | `refreshOAuth`                    | 사용자 지정 새로 고침 엔드포인트 또는 새로 고침 실패 정책을 위한 OAuth 새로 고침 재정의                                  | 공급자가 공유 `pi-ai` 새로 고침기에 맞지 않는 경우                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth 새로 고침 실패 시 추가되는 복구 힌트                                                                  | 공급자가 새로 고침 실패 후 공급자 소유 인증 복구 안내가 필요한 경우                                                                      |
| 26  | `matchesContextOverflowError`     | 공급자 소유 컨텍스트 창 오버플로 일치기                                                                 | 공급자에 일반 휴리스틱이 놓칠 원시 오버플로 오류가 있는 경우                                                                                |
| 27  | `classifyFailoverReason`          | 공급자 소유 장애 조치 이유 분류                                                                  | 공급자가 원시 API/전송 오류를 속도 제한/과부하 등으로 매핑할 수 있는 경우                                                                          |
| 28  | `isCacheTtlEligible`              | 프록시/백홀 공급자를 위한 프롬프트 캐시 정책                                                               | 공급자가 프록시별 캐시 TTL 게이팅이 필요한 경우                                                                                                |
| 29  | `buildMissingAuthMessage`         | 일반 누락 인증 복구 메시지의 대체                                                      | 공급자가 공급자별 누락 인증 복구 힌트가 필요한 경우                                                                                 |
| 30  | `augmentModelCatalog`             | 검색 후 추가되는 합성/최종 카탈로그 행                                                          | 공급자가 `models list` 및 선택기에 합성 순방향 호환 행이 필요한 경우                                                                     |
| 31  | `resolveThinkingProfile`          | 모델별 `/think` 수준 집합, 표시 레이블 및 기본값                                                 | 공급자가 선택한 모델에 대해 사용자 지정 thinking 단계 또는 이진 레이블을 노출하는 경우                                                                 |
| 32  | `isBinaryThinking`                | 켜기/끄기 추론 토글 호환성 훅                                                                     | 공급자가 이진 thinking 켜기/끄기만 노출하는 경우                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 추론 지원 호환성 훅                                                                   | 공급자가 일부 모델에만 `xhigh`를 사용하려는 경우                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | 기본 `/think` 수준 호환성 훅                                                                      | 공급자가 모델 계열의 기본 `/think` 정책을 소유하는 경우                                                                                      |
| 35  | `isModernModelRef`                | 라이브 프로필 필터 및 스모크 선택을 위한 최신 모델 일치기                                              | 공급자가 라이브/스모크 선호 모델 일치를 소유하는 경우                                                                                             |
| 36  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                       | 공급자가 토큰 교환 또는 단기 요청 자격 증명이 필요한 경우                                                                             |
| 37  | `resolveUsageAuth`                | `/usage` 및 관련 상태 화면의 사용량/청구 자격 증명 확인                                     | 공급자에 사용자 지정 사용량/할당량 토큰 파싱 또는 다른 사용량 자격 증명이 필요함                                                               |
| 38  | `fetchUsageSnapshot`              | 인증이 확인된 후 공급자별 사용량/할당량 스냅샷을 가져와 정규화                             | 공급자에 공급자별 사용량 엔드포인트 또는 페이로드 파서가 필요함                                                                           |
| 39  | `createEmbeddingProvider`         | 메모리/검색용 공급자 소유 임베딩 어댑터 빌드                                                     | 메모리 임베딩 동작은 공급자 Plugin에 속함                                                                                    |
| 40  | `buildReplayPolicy`               | 공급자의 트랜스크립트 처리를 제어하는 재생 정책 반환                                        | 공급자에 사용자 지정 트랜스크립트 정책(예: 사고 블록 제거)이 필요함                                                               |
| 41  | `sanitizeReplayHistory`           | 일반 트랜스크립트 정리 후 재생 기록 재작성                                                        | 공급자에 공유 Compaction 헬퍼를 넘어서는 공급자별 재생 재작성이 필요함                                                             |
| 42  | `validateReplayTurns`             | 임베디드 러너 전에 최종 재생 턴 검증 또는 재구성 수행                                           | 공급자 전송에는 일반 정리 후 더 엄격한 턴 검증이 필요함                                                                    |
| 43  | `onModelSelected`                 | 공급자 소유의 선택 후 부수 효과 실행                                                                 | 모델이 활성화될 때 공급자에 텔레메트리 또는 공급자 소유 상태가 필요함                                                                  |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저 일치하는
프로바이더 Plugin을 확인한 다음, 다른 훅 지원 프로바이더 Plugin으로
순차적으로 넘어가며 실제로 모델 ID 또는 전송/구성을 변경하는 대상을 찾습니다. 이를 통해
호출자가 어떤 번들 Plugin이 재작성을 소유하는지 알 필요 없이
별칭/호환 프로바이더 shim이 계속 작동합니다. 지원되는
Google 계열 구성 항목을 재작성하는 프로바이더 훅이 없으면, 번들 Google 구성 정규화기가
여전히 해당 호환성 정리를 적용합니다.

프로바이더에 완전히 사용자 지정 wire protocol 또는 사용자 지정 request executor가 필요하다면,
그것은 다른 종류의 확장입니다. 이 훅들은 여전히 OpenClaw의 일반 추론 루프에서 실행되는
프로바이더 동작을 위한 것입니다.

### 프로바이더 예시

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 내장 예시

번들 프로바이더 Plugin은 위의 훅들을 조합하여 각 벤더의 catalog,
auth, thinking, replay, usage 요구사항에 맞춥니다. 권위 있는 훅 집합은
`extensions/` 아래의 각 Plugin에 있으며, 이 페이지는 목록을 그대로
반영하기보다는 형태를 설명합니다.

<AccordionGroup>
  <Accordion title="패스스루 catalog 프로바이더">
    OpenRouter, Kilocode, Z.AI, xAI는 `catalog`와
    `resolveDynamicModel` / `prepareDynamicModel`을 등록하여 OpenClaw의 정적 catalog보다 먼저
    upstream 모델 ID를 노출할 수 있습니다.
  </Accordion>
  <Accordion title="OAuth 및 usage endpoint 프로바이더">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai는
    `prepareRuntimeAuth` 또는 `formatApiKey`를 `resolveUsageAuth` +
    `fetchUsageSnapshot`과 함께 사용하여 토큰 교환 및 `/usage` 통합을 소유합니다.
  </Accordion>
  <Accordion title="Replay 및 transcript 정리 계열">
    공유 명명 계열(`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`)을 통해 프로바이더는 각 Plugin이
    정리를 다시 구현하는 대신 `buildReplayPolicy`를 통해
    transcript 정책을 선택할 수 있습니다.
  </Accordion>
  <Accordion title="Catalog 전용 프로바이더">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`,
    `volcengine`은 `catalog`만 등록하고 공유 추론 루프를 사용합니다.
  </Accordion>
  <Accordion title="Anthropic 전용 stream helper">
    Beta headers, `/fast` / `serviceTier`, `context1m`은
    일반 SDK가 아니라 Anthropic Plugin의 공개 `api.ts` / `contract-api.ts` seam
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) 안에 있습니다.
  </Accordion>
</AccordionGroup>

## Runtime helper

Plugin은 `api.runtime`을 통해 선택된 core helper에 접근할 수 있습니다. TTS의 경우:

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

참고:

- `textToSpeech`는 파일/voice-note 표면을 위한 일반 core TTS 출력 payload를 반환합니다.
- core `messages.tts` 구성 및 프로바이더 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플 레이트를 반환합니다. Plugin은 프로바이더에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 프로바이더별로 선택 사항입니다. 벤더 소유 voice picker 또는 설정 flow에 사용하세요.
- 음성 목록에는 locale, gender, personality tag 같은 더 풍부한 metadata가 포함될 수 있어, 프로바이더 인식 picker에 사용할 수 있습니다.
- OpenAI와 ElevenLabs는 현재 telephony를 지원합니다. Microsoft는 지원하지 않습니다.

Plugin은 `api.registerSpeechProvider(...)`를 통해 speech provider도 등록할 수 있습니다.

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

참고:

- TTS 정책, fallback, reply delivery는 core에 두세요.
- 벤더 소유 synthesis 동작에는 speech provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` 프로바이더 ID로 정규화됩니다.
- 선호되는 소유권 모델은 회사 중심입니다. OpenClaw가 이러한
  capability contract를 추가함에 따라 하나의 벤더 Plugin이 text, speech, image, 향후 media provider를
  소유할 수 있습니다.

이미지/오디오/비디오 이해를 위해 Plugin은 일반 key/value bag 대신 하나의 타입 지정된
media-understanding provider를 등록합니다.

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

참고:

- orchestration, fallback, config, channel wiring은 core에 두세요.
- 벤더 동작은 프로바이더 Plugin에 두세요.
- 추가 확장은 타입이 지정된 상태를 유지해야 합니다. 새 optional method, 새 optional
  result field, 새 optional capability를 사용하세요.
- 비디오 생성도 이미 같은 패턴을 따릅니다.
  - core가 capability contract와 runtime helper를 소유합니다
  - 벤더 Plugin이 `api.registerVideoGenerationProvider(...)`를 등록합니다
  - 기능/channel Plugin이 `api.runtime.videoGeneration.*`를 사용합니다

media-understanding runtime helper의 경우 Plugin은 다음을 호출할 수 있습니다.

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "Use the printed fields as the source of truth." },
  ],
  instructions: "Return entities and searchable tags.",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
  cfg: api.config,
});
```

오디오 transcription의 경우 Plugin은 media-understanding runtime 또는 더 오래된 STT alias 중 하나를 사용할 수 있습니다.

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`는 이미지/오디오/비디오 이해를 위한 선호 공유 표면입니다.
- `extractStructuredWithModel(...)`은 범위가 제한된 프로바이더 소유 image-first extraction을 위한 Plugin-facing seam입니다.
  최소 하나의 이미지 입력을 포함하세요.
  텍스트 입력은 보조 context입니다.
  product Plugin은 자체 route와 schema를 소유하고 OpenClaw는
  provider/runtime boundary를 소유합니다.
- core media-understanding 오디오 구성(`tools.media.audio`)과 프로바이더 fallback 순서를 사용합니다.
- transcription 출력이 생성되지 않으면(예: 건너뛴/지원되지 않는 입력) `{ text: undefined }`를 반환합니다.
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 alias로 유지됩니다.

Plugin은 `api.runtime.subagent`를 통해 background subagent run도 시작할 수 있습니다.

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

참고:

- `provider`와 `model`은 persistent session change가 아니라 per-run override(선택 사항)입니다.
- OpenClaw는 trusted caller에 대해서만 이러한 override field를 적용합니다.
- Plugin 소유 fallback run의 경우 operator는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 opt in해야 합니다.
- trusted Plugin을 특정 canonical `provider/model` target으로 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하고, 명시적으로 모든 target을 허용하려면 `"*"`를 사용하세요.
- Untrusted Plugin subagent run은 계속 작동하지만, override request는 조용히 fallback되는 대신 거부됩니다.
- Plugin이 생성한 subagent session에는 생성한 Plugin ID가 tag로 지정됩니다. Fallback `api.runtime.subagent.deleteSession(...)`은 이러한 소유 session만 삭제할 수 있으며, 임의 session deletion에는 여전히 admin-scoped Gateway request가 필요합니다.

웹 검색의 경우 Plugin은 agent tool wiring에 직접 접근하는 대신 공유 runtime helper를 사용할 수 있습니다.

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin은 `api.registerWebSearchProvider(...)`를 통해 web-search provider도 등록할 수 있습니다.

참고:

- 프로바이더 선택, credential resolution, 공유 request semantics는 core에 두세요.
- 벤더별 search transport에는 web-search provider를 사용하세요.
- `api.runtime.webSearch.*`는 agent tool wrapper에 의존하지 않고 search behavior가 필요한 feature/channel Plugin을 위한 선호 공유 표면입니다.

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`: 구성된 image-generation provider chain을 사용해 이미지를 생성합니다.
- `listProviders(...)`: 사용 가능한 image-generation provider와 그 capability를 나열합니다.

## Gateway HTTP route

Plugin은 `api.registerHttpRoute(...)`로 HTTP endpoint를 노출할 수 있습니다.

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

Route field:

- `path`: gateway HTTP server 아래의 route path입니다.
- `auth`: 필수입니다. 일반 gateway auth를 요구하려면 `"gateway"`를 사용하고, Plugin-managed auth/webhook verification에는 `"plugin"`을 사용하세요.
- `match`: 선택 사항입니다. `"exact"`(기본값) 또는 `"prefix"`입니다.
- `replaceExisting`: 선택 사항입니다. 같은 Plugin이 자체 기존 route registration을 대체할 수 있게 합니다.
- `handler`: route가 request를 처리했으면 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 Plugin 로드 오류를 일으킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- Plugin 라우트는 `auth`를 명시적으로 선언해야 합니다.
- 정확한 `path + match` 충돌은 `replaceExisting: true`가 아니면 거부되며, 한 Plugin은 다른 Plugin의 라우트를 대체할 수 없습니다.
- 서로 다른 `auth` 수준의 중첩 라우트는 거부됩니다. `exact`/`prefix` 폴스루 체인은 동일한 auth 수준에서만 유지하세요.
- `auth: "plugin"` 라우트는 운영자 런타임 범위를 자동으로 받지 **않습니다**. 이는 권한 있는 Gateway 헬퍼 호출이 아니라 Plugin이 관리하는 Webhook/서명 검증을 위한 것입니다.
- `auth: "gateway"` 라우트는 Gateway 요청 런타임 범위 안에서 실행되지만, 해당 범위는 의도적으로 보수적입니다.
  - 공유 비밀 bearer auth(`gateway.auth.mode = "token"` / `"password"`)는 호출자가 `x-openclaw-scopes`를 보내더라도 Plugin 라우트 런타임 범위를 `operator.write`에 고정합니다.
  - 신뢰할 수 있는 ID를 포함하는 HTTP 모드(예: private ingress의 `trusted-proxy` 또는 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 있을 때만 `x-openclaw-scopes`를 적용합니다.
  - 이러한 ID 포함 Plugin 라우트 요청에서 `x-openclaw-scopes`가 없으면 런타임 범위는 `operator.write`로 폴백합니다.
- 실무 규칙: gateway-auth Plugin 라우트를 암시적 관리자 표면이라고 가정하지 마세요. 라우트에 관리자 전용 동작이 필요하다면 ID 포함 auth 모드를 요구하고 명시적 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK 가져오기 경로

새 Plugin을 작성할 때는 모놀리식 `openclaw/plugin-sdk` 루트 barrel 대신 좁은 SDK 하위 경로를 사용하세요. 핵심 하위 경로:

| 하위 경로                            | 목적                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 등록 기본 요소                              |
| `openclaw/plugin-sdk/channel-core`  | 채널 엔트리/빌드 헬퍼                              |
| `openclaw/plugin-sdk/core`          | 범용 공유 헬퍼 및 포괄 계약                        |
| `openclaw/plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마(`OpenClawSchema`) |

채널 Plugin은 `channel-setup`, `setup-runtime`, `setup-tools`, `channel-pairing`, `channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`, `channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`, `channel-targets`, `channel-actions` 같은 좁은 경계 계열 중에서 선택합니다. 승인 동작은 관련 없는 Plugin 필드를 섞기보다 하나의 `approvalCapability` 계약으로 통합해야 합니다. [채널 Plugin](/ko/plugins/sdk-channel-plugins)을 참조하세요.

런타임 및 설정 헬퍼는 일치하는 집중형 `*-runtime` 하위 경로(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`, `channel-activity-runtime` 등) 아래에 있습니다. 넓은 `config-runtime` 호환성 barrel 대신 `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`을 선호하세요.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`, `openclaw/plugin-sdk/infra-runtime`은 오래된 Plugin을 위한 더 이상 권장되지 않는 호환성 shim입니다. 새 코드는 대신 더 좁은 범용 기본 요소를 가져와야 합니다.
</Info>

저장소 내부 엔트리 지점(번들 Plugin 패키지 루트별):

- `index.js` — 번들 Plugin 엔트리
- `api.js` — 헬퍼/타입 barrel
- `runtime-api.js` — 런타임 전용 barrel
- `setup-entry.js` — 설정 Plugin 엔트리

외부 Plugin은 `openclaw/plugin-sdk/*` 하위 경로만 가져와야 합니다. core나 다른 Plugin에서 다른 Plugin 패키지의 `src/*`를 가져오지 마세요. facade로 로드되는 엔트리 지점은 활성 런타임 설정 스냅샷이 있으면 이를 선호하고, 없으면 디스크에서 해석된 설정 파일로 폴백합니다.

`image-generation`, `media-understanding`, `speech` 같은 기능별 하위 경로는 번들 Plugin이 현재 사용하기 때문에 존재합니다. 이들은 자동으로 장기 고정 외부 계약이 되는 것은 아닙니다. 이에 의존할 때는 관련 SDK 참조 페이지를 확인하세요.

## 메시지 도구 스키마

Plugin은 반응, 읽음, 투표 같은 비메시지 기본 요소에 대한 채널별 `describeMessageTool(...)` 스키마 기여를 소유해야 합니다. 공유 전송 프레젠테이션은 공급자 네이티브 버튼, 컴포넌트, 블록, 카드 필드 대신 범용 `MessagePresentation` 계약을 사용해야 합니다. 계약, 폴백 규칙, 공급자 매핑, Plugin 작성자 체크리스트는 [메시지 프레젠테이션](/ko/plugins/message-presentation)을 참조하세요.

전송 가능한 Plugin은 메시지 기능을 통해 렌더링할 수 있는 것을 선언합니다.

- `presentation`: 의미론적 프레젠테이션 블록(`text`, `context`, `divider`, `buttons`, `select`)
- `delivery-pin`: 고정 전달 요청

core는 프레젠테이션을 네이티브로 렌더링할지 텍스트로 강등할지 결정합니다. 범용 메시지 도구에서 공급자 네이티브 UI 우회로를 노출하지 마세요. 레거시 네이티브 스키마용으로 더 이상 권장되지 않는 SDK 헬퍼는 기존 타사 Plugin을 위해 계속 내보내지만, 새 Plugin은 사용하지 않아야 합니다.

## 채널 대상 해석

채널 Plugin은 채널별 대상 의미론을 소유해야 합니다. 공유 outbound 호스트는 범용으로 유지하고 공급자 규칙에는 메시징 어댑터 표면을 사용하세요.

- `messaging.inferTargetChatType({ to })`는 정규화된 대상을 디렉터리 조회 전에 `direct`, `group`, `channel` 중 무엇으로 처리할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 입력이 디렉터리 검색 대신 ID처럼 보이는 해석으로 바로 건너뛰어야 하는지 core에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`은 정규화 후 또는 디렉터리 미스 후 core에 최종 공급자 소유 해석이 필요할 때의 Plugin 폴백입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 해석된 뒤 공급자별 세션 라우트 구성을 소유합니다.

권장 분리:

- peers/groups 검색 전에 발생해야 하는 범주 결정에는 `inferTargetChatType`을 사용하세요.
- “이를 명시적/네이티브 대상 ID로 처리”하는 검사에는 `looksLikeId`를 사용하세요.
- 광범위한 디렉터리 검색이 아니라 공급자별 정규화 폴백에는 `resolveTarget`을 사용하세요.
- chat id, thread id, JID, handle, room id 같은 공급자 네이티브 ID는 범용 SDK 필드가 아니라 `target` 값 또는 공급자별 params 안에 유지하세요.

## 설정 기반 디렉터리

설정에서 디렉터리 항목을 파생하는 Plugin은 해당 로직을 Plugin 안에 유지하고 `openclaw/plugin-sdk/directory-runtime`의 공유 헬퍼를 재사용해야 합니다.

채널에 다음과 같은 설정 기반 peers/groups가 필요할 때 사용하세요.

- allowlist 기반 DM peers
- 설정된 channel/group 맵
- 계정 범위 정적 디렉터리 폴백

`directory-runtime`의 공유 헬퍼는 범용 작업만 처리합니다.

- 쿼리 필터링
- 제한 적용
- 중복 제거/정규화 헬퍼
- `ChannelDirectoryEntry[]` 빌드

채널별 계정 검사와 ID 정규화는 Plugin 구현에 남아 있어야 합니다.

## 공급자 카탈로그

공급자 Plugin은 `registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가 `models.providers`에 쓰는 것과 같은 형태를 반환합니다.

- `{ provider }`: 하나의 공급자 항목
- `{ providers }`: 여러 공급자 항목

Plugin이 공급자별 모델 ID, 기본 base URL, auth로 보호되는 모델 메타데이터를 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 Plugin의 카탈로그가 OpenClaw의 내장 암시적 공급자와 병합되는 시점을 제어합니다.

- `simple`: 단순 API 키 또는 env 기반 공급자
- `profile`: auth profile이 있을 때 나타나는 공급자
- `paired`: 여러 관련 공급자 항목을 합성하는 공급자
- `late`: 다른 암시적 공급자 이후의 마지막 패스

키 충돌에서는 나중 공급자가 우선하므로, Plugin은 같은 공급자 ID를 가진 내장 공급자 항목을 의도적으로 재정의할 수 있습니다.

Plugin은 `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog })`를 통해 읽기 전용 모델 행도 게시할 수 있습니다. 이는 list/help/picker 표면을 위한 앞으로의 경로이며 `text`, `image_generation`, `video_generation`, `music_generation` 행을 지원합니다. 공급자 Plugin은 여전히 라이브 엔드포인트 호출, 토큰 교환, 벤더 응답 매핑을 소유합니다. core는 공통 행 형태, 소스 레이블, 미디어 도구 도움말 서식을 소유합니다. 미디어 생성 공급자 등록은 `defaultModel`, `models`, `capabilities`에서 정적 카탈로그 행을 자동으로 합성합니다.

호환성:

- `discovery`는 레거시 별칭으로 계속 작동하지만 지원 중단 경고를 내보냅니다.
- `catalog`와 `discovery`가 모두 등록되면 OpenClaw는 `catalog`를 사용합니다.
- `augmentModelCatalog`는 더 이상 권장되지 않습니다. 번들 공급자는 `registerModelCatalogProvider`를 통해 보조 행을 게시해야 합니다.

## 읽기 전용 채널 검사

Plugin이 채널을 등록한다면 `resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)` 구현을 선호하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이 완전히 구체화되어 있다고 가정할 수 있으며, 필요한 비밀이 없으면 빠르게 실패할 수 있습니다.
- `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, doctor/config repair 흐름 같은 읽기 전용 명령 경로는 설정을 설명하기 위해 런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명적인 계정 상태만 반환하세요.
- `enabled`와 `configured`를 보존하세요.
- 관련된 경우 다음과 같은 자격 증명 소스/상태 필드를 포함하세요.
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다. 상태 스타일 명령에는 `tokenStatus: "available"`(및 일치하는 소스 필드)을 반환하는 것으로 충분합니다.
- 자격 증명이 SecretRef로 설정되어 있지만 현재 명령 경로에서 사용할 수 없는 경우 `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령은 충돌하거나 계정이 설정되지 않았다고 잘못 보고하는 대신 “이 명령 경로에서는 설정되었지만 사용할 수 없음”을 보고할 수 있습니다.

## 패키지 팩

Plugin 디렉터리는 `openclaw.extensions`가 있는 `package.json`을 포함할 수 있습니다.

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 항목은 Plugin이 됩니다. 팩이 여러 extensions를 나열하면 Plugin ID는 `name/<fileBase>`가 됩니다.

Plugin이 npm deps를 가져오면 해당 디렉터리에 설치하여 `node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 symlink 해석 후에도 Plugin 디렉터리 안에 있어야 합니다. 패키지 디렉터리를 벗어나는 항목은 거부됩니다.

보안 참고: `openclaw plugins install`은 프로젝트 local `npm install --omit=dev --ignore-scripts`로 Plugin 의존성을 설치합니다(라이프사이클 스크립트 없음, 런타임에 dev dependencies 없음). 상속된 전역 npm 설치 설정은 무시됩니다. Plugin 의존성 트리는 “순수 JS/TS”로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 설정 전용 모듈을 가리킬 수 있습니다. OpenClaw가 비활성화된 채널 Plugin의 설정 표면이 필요하거나 채널 Plugin이 활성화되었지만 아직 설정되지 않은 경우, 전체 Plugin 엔트리 대신 `setupEntry`를 로드합니다. 이렇게 하면 주 Plugin 엔트리가 도구, 훅 또는 기타 런타임 전용 코드도 연결하는 경우 시작 및 설정이 더 가벼워집니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은 채널이 이미 설정되어 있더라도 Gateway의 listen 전 시작 단계에서 채널 Plugin이 동일한 `setupEntry` 경로를 사용하도록 선택할 수 있게 합니다.

Gateway가 수신을 시작하기 전에 반드시 존재해야 하는 시작 표면을 `setupEntry`가 완전히
포괄할 때만 이것을 사용하세요. 실제로는 setup entry가 시작 시 의존하는 모든
채널 소유 capability를 등록해야 한다는 뜻입니다. 예:

- 채널 등록 자체
- Gateway가 수신을 시작하기 전에 사용할 수 있어야 하는 모든 HTTP route
- 같은 시간 창 동안 존재해야 하는 모든 Gateway method, tool 또는 service

전체 entry가 필요한 시작 capability를 하나라도 계속 소유한다면 이 flag를 활성화하지
마세요. Plugin을 기본 동작에 두고 OpenClaw가 시작 중에 전체 entry를 로드하게 하세요.

번들 채널은 전체 채널 runtime이 로드되기 전에 core가 참조할 수 있는 setup 전용
contract-surface helper도 게시할 수 있습니다. 현재 setup promotion 표면은 다음과
같습니다.

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

Core는 전체 Plugin entry를 로드하지 않고 legacy single-account 채널 config를
`channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다. Matrix가 현재
번들 예시입니다. named account가 이미 존재하면 auth/bootstrap key만 이름이 지정된
승격 account로 이동하고, 항상 `accounts.default`를 생성하는 대신 구성된 비표준
default-account key를 보존할 수 있습니다.

이러한 setup patch adapter는 번들 contract-surface discovery를 lazy하게 유지합니다.
Import 시점은 가볍게 유지되고, promotion 표면은 module import 시 번들 채널 시작에
다시 진입하는 대신 최초 사용 시에만 로드됩니다.

이러한 시작 표면에 Gateway RPC method가 포함될 때는 Plugin별 prefix에 유지하세요.
Core admin namespace(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는
계속 예약되어 있으며, Plugin이 더 좁은 scope를 요청하더라도 항상
`operator.admin`으로 resolve됩니다.

예:

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### 채널 catalog metadata

채널 Plugin은 `openclaw.channel`을 통해 setup/discovery metadata를, `openclaw.install`을
통해 install hint를 알릴 수 있습니다. 이렇게 하면 core catalog가 data-free로
유지됩니다.

예:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

최소 예시 외에 유용한 `openclaw.channel` field:

- `detailLabel`: 더 풍부한 catalog/status 표면을 위한 보조 label
- `docsLabel`: docs link의 link text override
- `preferOver`: 이 catalog entry가 우선해야 하는 낮은 우선순위의 Plugin/channel id
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: selection-surface copy control
- `markdownCapable`: outbound formatting 결정을 위해 채널을 markdown-capable로 표시
- `exposure.configured`: `false`로 설정하면 configured-channel listing 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 interactive setup/configure picker에서 채널 숨김
- `exposure.docs`: docs navigation 표면에서 채널을 internal/private로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 legacy alias; `exposure` 권장
- `quickstartAllowFrom`: 채널을 표준 quickstart `allowFrom` flow에 opt in
- `forceAccountBinding`: account가 하나만 있어도 명시적 account binding 요구
- `preferSessionLookupForAnnounceTarget`: announce target을 resolve할 때 session lookup 선호

OpenClaw는 **external channel catalog**도 병합할 수 있습니다(예: MPM registry export).
다음 위치 중 하나에 JSON file을 두세요.

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)가 하나 이상의
JSON file을 가리키게 하세요(comma/semicolon/`PATH`로 구분). 각 file은
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`를
포함해야 합니다. Parser는 `"entries"` key의 legacy alias로 `"packages"` 또는 `"plugins"`도
허용합니다.

생성된 채널 catalog entry와 provider install catalog entry는 raw `openclaw.install`
block 옆에 normalized install-source fact를 노출합니다. Normalized fact는 npm spec이
정확한 version인지 floating selector인지, 예상 integrity metadata가 있는지, local
source path도 사용할 수 있는지를 식별합니다. Catalog/package identity가 알려져 있으면
normalized fact는 파싱된 npm package name이 해당 identity에서 벗어날 때 경고합니다.
또한 `defaultChoice`가 유효하지 않거나 사용할 수 없는 source를 가리킬 때, 그리고
유효한 npm source 없이 npm integrity metadata가 있을 때도 경고합니다. Consumer는
hand-built entry와 catalog shim이 이를 합성하지 않아도 되도록 `installSource`를
additive optional field로 취급해야 합니다.
이를 통해 onboarding과 diagnostic은 Plugin runtime을 import하지 않고도 source-plane
state를 설명할 수 있습니다.

공식 external npm entry는 정확한 `npmSpec`와 `expectedIntegrity`를 선호해야 합니다.
Bare package name과 dist-tag도 호환성을 위해 계속 동작하지만 source-plane warning을
표시하므로, catalog는 기존 Plugin을 깨뜨리지 않고 pinned, integrity-checked install로
이동할 수 있습니다. Onboarding이 local catalog path에서 install할 때는 가능한 경우
`source: "path"`와 workspace-relative `sourcePath`가 있는 managed Plugin Plugin index
entry를 기록합니다. 절대 operational load path는 `plugins.load.paths`에 유지되고,
install record는 local workstation path를 장기 config에 중복하지 않습니다. 이렇게 하면
local development install이 source-plane diagnostic에 표시되면서 두 번째 raw
filesystem-path disclosure 표면을 추가하지 않습니다. Persisted `plugins/installs.json`
Plugin index는 install source of truth이며 Plugin runtime module을 로드하지 않고도
refresh할 수 있습니다. 해당 `installRecords` map은 Plugin manifest가 없거나 유효하지
않아도 durable하고, `plugins` array는 재빌드 가능한 manifest view입니다.

## 컨텍스트 엔진 Plugin

컨텍스트 엔진 Plugin은 ingest, assembly, Compaction을 위한 session context orchestration을
소유합니다. Plugin에서 `api.registerContextEngine(id, factory)`로 등록한 다음
`plugins.slots.contextEngine`으로 활성 engine을 선택하세요.

Plugin이 memory search나 hook을 추가하는 수준을 넘어 기본 context pipeline을 교체하거나
확장해야 할 때 이것을 사용하세요.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

Factory `ctx`는 construction-time initialization을 위한 optional `config`, `agentDir`,
`workspaceDir` 값을 노출합니다.

Engine이 Compaction algorithm을 소유하지 **않는다면**, `compact()`를 구현한 상태로
유지하고 명시적으로 delegate하세요.

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 새 capability 추가

Plugin에 현재 API에 맞지 않는 동작이 필요하다면 private reach-in으로 Plugin system을
우회하지 마세요. 누락된 capability를 추가하세요.

권장 순서:

1. core contract 정의
   Core가 소유해야 하는 공유 동작을 결정하세요: policy, fallback, config merge,
   lifecycle, channel-facing semantic, runtime helper shape.
2. typed Plugin registration/runtime 표면 추가
   가장 작고 유용한 typed capability 표면으로 `OpenClawPluginApi` 및/또는 `api.runtime`을
   확장하세요.
3. core + channel/feature consumer 연결
   채널과 feature Plugin은 vendor implementation을 직접 import하지 말고 core를 통해
   새 capability를 소비해야 합니다.
4. vendor implementation 등록
   그런 다음 vendor Plugin이 해당 capability에 backend를 등록합니다.
5. contract coverage 추가
   시간이 지나도 ownership과 registration shape가 명시적으로 유지되도록 test를 추가하세요.

이것이 OpenClaw가 한 provider의 worldview에 hardcode되지 않으면서도 opinionated하게
유지되는 방식입니다. 구체적인 file checklist와 worked example은
[Capability Cookbook](/ko/plugins/adding-capabilities)을 참조하세요.

### Capability checklist

새 capability를 추가할 때 implementation은 일반적으로 다음 표면을 함께 다뤄야 합니다.

- `src/<capability>/types.ts`의 core contract type
- `src/<capability>/runtime.ts`의 core runner/runtime helper
- `src/plugins/types.ts`의 Plugin API registration 표면
- `src/plugins/registry.ts`의 Plugin registry wiring
- feature/channel Plugin이 이를 소비해야 할 때 `src/plugins/runtime/*`의 Plugin runtime exposure
- `src/test-utils/plugin-registration.ts`의 capture/test helper
- `src/plugins/contracts/registry.ts`의 ownership/contract assertion
- `docs/`의 operator/Plugin docs

이 표면 중 하나가 없다면 대개 capability가 아직 완전히 통합되지 않았다는 신호입니다.

### Capability template

최소 pattern:

```ts
// core contract
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// shared runtime helper for feature/channel plugins
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

Contract test pattern:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

이렇게 하면 규칙이 단순하게 유지됩니다.

- core가 capability contract + orchestration을 소유
- vendor Plugin이 vendor implementation을 소유
- feature/channel Plugin이 runtime helper를 소비
- contract test가 ownership을 명시적으로 유지

## 관련 항목

- [Plugin architecture](/ko/plugins/architecture) — public capability model과 shape
- [Plugin SDK subpaths](/ko/plugins/sdk-subpaths)
- [Plugin SDK setup](/ko/plugins/sdk-setup)
- [Building plugins](/ko/plugins/building-plugins)
