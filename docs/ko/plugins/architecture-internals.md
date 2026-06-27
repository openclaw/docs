---
read_when:
    - 공급자 런타임 훅, 채널 수명 주기 또는 패키지 팩 구현
    - Plugin 로드 순서 또는 레지스트리 상태 디버깅
    - 새 Plugin 기능 또는 컨텍스트 엔진 Plugin 추가하기
summary: 'Plugin 아키텍처 내부: 로드 파이프라인, 레지스트리, 런타임 훅, HTTP 라우트 및 참조 테이블'
title: Plugin 아키텍처 내부
x-i18n:
    generated_at: "2026-06-27T17:41:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29abbd75d696a26cf33702a78abfcc987aaf5358eca2dc1ebe43f039f4ff6edf
    source_path: plugins/architecture-internals.md
    workflow: 16
---

공개 기능 모델, Plugin 형태, 소유권/실행 계약은 [Plugin 아키텍처](/ko/plugins/architecture)를 참조하세요. 이 페이지는 로드 파이프라인, 레지스트리, 런타임 훅, Gateway HTTP 라우트, 임포트 경로, 스키마 표 같은 내부 메커니즘의 참조 문서입니다.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다.

1. 후보 Plugin 루트를 발견합니다
2. 네이티브 또는 호환 번들 매니페스트와 패키지 메타데이터를 읽습니다
3. 안전하지 않은 후보를 거부합니다
4. Plugin 설정(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)을 정규화합니다
5. 각 후보의 활성화 여부를 결정합니다
6. 활성화된 네이티브 모듈을 로드합니다. 빌드된 번들 모듈은 네이티브 로더를 사용하고,
   서드파티 로컬 소스 TypeScript는 비상용 Jiti 폴백을 사용합니다
7. 네이티브 `register(api)` 훅을 호출하고 등록 항목을 Plugin 레지스트리에 수집합니다
8. 레지스트리를 명령/런타임 표면에 노출합니다

<Note>
`activate`는 `register`의 레거시 별칭입니다. 로더는 존재하는 쪽(`def.register ?? def.activate`)을 해석하고 같은 지점에서 호출합니다. 모든 번들 Plugin은 `register`를 사용합니다. 새 Plugin에는 `register`를 선호하세요.
</Note>

안전 게이트는 런타임 실행 **전에** 적용됩니다. 엔트리가 Plugin 루트를 벗어나거나, 경로가 모든 사용자가 쓸 수 있거나, 번들되지 않은 Plugin에서 경로 소유권이 의심스러워 보이면 후보가 차단됩니다.

차단된 후보는 진단을 위해 해당 Plugin id와 계속 연결됩니다. 설정이 여전히 그 id를 참조하면, 검증은 Plugin을 존재하지만 차단된 것으로 보고하고 설정 항목을 오래된 것으로 처리하는 대신 경로 안전 경고를 다시 가리킵니다.

### 매니페스트 우선 동작

매니페스트는 컨트롤 플레인의 신뢰 원천입니다. OpenClaw는 이를 사용해 다음을 수행합니다.

- Plugin을 식별합니다
- 선언된 채널/Skills/설정 스키마 또는 번들 기능을 발견합니다
- `plugins.entries.<id>.config`를 검증합니다
- Control UI 레이블/플레이스홀더를 보강합니다
- 설치/카탈로그 메타데이터를 표시합니다
- Plugin 런타임을 로드하지 않고 저렴한 활성화 및 설정 설명자를 보존합니다

네이티브 Plugin의 경우 런타임 모듈은 데이터 플레인 부분입니다. 훅, 도구, 명령, 제공자 플로 같은 실제 동작을 등록합니다.

선택적 매니페스트 `activation` 및 `setup` 블록은 컨트롤 플레인에 유지됩니다. 이들은 활성화 계획과 설정 발견을 위한 메타데이터 전용 설명자이며, 런타임 등록, `register(...)`, 또는 `setupEntry`를 대체하지 않습니다.
첫 번째 라이브 활성화 소비자는 이제 더 넓은 레지스트리 구체화 전에 매니페스트 명령, 채널, 제공자 힌트를 사용해 Plugin 로딩 범위를 좁힙니다.

- CLI 로딩은 요청된 기본 명령을 소유한 Plugin으로 범위를 좁힙니다
- 채널 설정/Plugin 해석은 요청된 채널 id를 소유한 Plugin으로 범위를 좁힙니다
- 명시적 제공자 설정/런타임 해석은 요청된 제공자 id를 소유한 Plugin으로 범위를 좁힙니다
- Gateway 시작 계획은 명시적 시작 임포트와 시작 제외에 `activation.onStartup`을 사용합니다. 시작 메타데이터가 없는 Plugin은 더 좁은 활성화 트리거를 통해서만 로드됩니다

넓은 `all` 범위를 요청하는 요청 시점 런타임 프리로드도 설정, 시작 계획, 구성된 채널, 슬롯, 자동 활성화 규칙에서 명시적 유효 Plugin id 집합을 도출합니다. 도출된 집합이 비어 있으면 OpenClaw는 발견 가능한 모든 Plugin으로 넓히는 대신 빈 런타임 레지스트리를 로드합니다.

활성화 플래너는 기존 호출자를 위한 ids 전용 API와 새 진단을 위한 계획 API를 모두 노출합니다. 계획 항목은 Plugin이 선택된 이유를 보고하며, 명시적 `activation.*` 플래너 힌트를 `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, 훅 같은 매니페스트 소유권 폴백과 분리합니다. 이 이유 분리가 호환성 경계입니다. 기존 Plugin 메타데이터는 계속 작동하고, 새 코드는 런타임 로딩 의미를 변경하지 않고 넓은 힌트나 폴백 동작을 감지할 수 있습니다.

설정 발견은 이제 여전히 설정 시점 런타임 훅이 필요한 Plugin에 대해 `setup-api`로 폴백하기 전에, 후보 Plugin 범위를 좁히기 위해 `setup.providers` 및 `setup.cliBackends` 같은 설명자 소유 id를 선호합니다. 제공자 설정 목록은 제공자 런타임을 로드하지 않고 매니페스트 `providerAuthChoices`, 설명자에서 파생된 설정 선택지, 설치 카탈로그 메타데이터를 사용합니다. 명시적 `setup.requiresRuntime: false`는 설명자 전용 차단점입니다. 생략된 `requiresRuntime`은 호환성을 위해 레거시 setup-api 폴백을 유지합니다. 발견된 Plugin이 둘 이상 동일한 정규화된 설정 제공자 또는 CLI 백엔드 id를 주장하면, 설정 조회는 발견 순서에 의존하는 대신 모호한 소유자를 거부합니다. 설정 런타임이 실행될 때 레지스트리 진단은 레거시 Plugin을 차단하지 않고 `setup.providers` / `setup.cliBackends`와 setup-api가 등록한 제공자 또는 CLI 백엔드 사이의 드리프트를 보고합니다.

### Plugin 캐시 경계

OpenClaw는 Plugin 발견 결과나 직접 매니페스트 레지스트리 데이터를 시간 기반 창 뒤에 캐시하지 않습니다. 설치, 매니페스트 편집, 로드 경로 변경은 다음 명시적 메타데이터 읽기 또는 스냅샷 재빌드에서 보여야 합니다.
매니페스트 파일 파서는 열린 매니페스트 경로, inode, 크기, 타임스탬프를 키로 하는 제한된 파일 서명 캐시를 유지할 수 있습니다. 해당 캐시는 변경되지 않은 바이트의 재파싱만 피하며 발견, 레지스트리, 소유자, 정책 답변을 캐시해서는 안 됩니다.

안전한 메타데이터 빠른 경로는 숨겨진 캐시가 아니라 명시적 객체 소유권입니다.
Gateway 시작 핫 경로는 현재 `PluginMetadataSnapshot`, 파생된 `PluginLookUpTable`, 또는 명시적 매니페스트 레지스트리를 호출 체인으로 전달해야 합니다. 설정 검증, 시작 시 자동 활성화, Plugin 부트스트랩, 제공자 선택은 해당 객체가 현재 설정과 Plugin 인벤토리를 나타내는 동안 이를 재사용할 수 있습니다. 설정 조회는 특정 설정 경로가 명시적 매니페스트 레지스트리를 받지 않는 한 여전히 필요할 때 매니페스트 메타데이터를 재구성합니다. 이를 숨겨진 조회 캐시를 추가하는 대신 콜드 경로 폴백으로 유지하세요. 입력이 변경되면 스냅샷을 변경하거나 과거 복사본을 유지하는 대신 다시 빌드하고 교체하세요.
활성 Plugin 레지스트리의 뷰와 번들 채널 부트스트랩 헬퍼는 현재 레지스트리/루트에서 다시 계산해야 합니다. 하나의 호출 안에서 작업을 중복 제거하거나 재진입을 방지하기 위한 단기 맵은 괜찮지만, 프로세스 메타데이터 캐시가 되어서는 안 됩니다.

Plugin 로딩에서 지속 캐시 계층은 런타임 로딩입니다. 코드나 설치된 아티팩트가 실제로 로드될 때 로더 상태를 재사용할 수 있습니다. 예를 들면 다음과 같습니다.

- `PluginLoaderCacheState` 및 호환 활성 런타임 레지스트리
- 동일한 런타임 표면을 반복해서 임포트하지 않기 위해 사용하는 jiti/모듈 캐시와 공개 표면 로더 캐시
- 설치된 Plugin 아티팩트를 위한 파일 시스템 캐시
- 경로 정규화 또는 중복 해석을 위한 호출별 단기 맵

이러한 캐시는 데이터 플레인 구현 세부 사항입니다. 호출자가 의도적으로 런타임 로딩을 요청한 경우가 아니라면, "어떤 Plugin이 이 제공자를 소유하는가?" 같은 컨트롤 플레인 질문에 답해서는 안 됩니다.

다음에 대한 지속 캐시나 시간 기반 캐시를 추가하지 마세요:

- 검색 결과
- 직접 manifest 레지스트리
- 설치된 Plugin 인덱스에서 재구성된 manifest 레지스트리
- 제공자 소유자 조회, 모델 억제, 제공자 정책 또는 공개 아티팩트
  메타데이터
- 변경된 manifest, 설치된 인덱스 또는 로드 경로가 다음 메타데이터 읽기에서 보여야 하는 기타 모든 manifest 파생 답변

영속화된 설치 Plugin 인덱스에서 manifest 메타데이터를 다시 빌드하는 호출자는 해당 레지스트리를 필요할 때 재구성합니다. 설치된 인덱스는 내구성 있는 소스 플레인 상태이며, 숨겨진 인프로세스 메타데이터 캐시가 아닙니다.

## 레지스트리 모델

로드된 Plugin은 임의의 코어 전역 값을 직접 변경하지 않습니다. 이들은 중앙 Plugin 레지스트리에 등록됩니다.

레지스트리는 다음을 추적합니다.

- Plugin 레코드(식별 정보, 소스, 출처, 상태, 진단)
- 도구
- 레거시 훅 및 형식화된 훅
- 채널
- 제공자
- Gateway RPC 핸들러
- HTTP 라우트
- CLI 등록자
- 백그라운드 서비스
- Plugin 소유 명령

그런 다음 코어 기능은 Plugin 모듈과 직접 통신하는 대신 해당 레지스트리에서 읽습니다. 이렇게 하면 로딩이 단방향으로 유지됩니다.

- Plugin 모듈 -> 레지스트리 등록
- 코어 런타임 -> 레지스트리 소비

이 분리는 유지 관리성에 중요합니다. 즉, 대부분의 코어 표면에는 "모든 Plugin 모듈을 특별 처리"하는 것이 아니라 "레지스트리 읽기"라는 하나의 통합 지점만 필요합니다.

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
- `decision`: `"allow-once"`, `"allow-always"` 또는 `"deny"`
- `binding`: 승인된 요청에 대해 해결된 바인딩
- `request`: 원래 요청 요약, 분리 힌트, 발신자 ID 및
  대화 메타데이터

이 콜백은 알림 전용입니다. 대화를 바인딩할 수 있는 사람을 변경하지 않으며, 코어 승인 처리가 끝난 후 실행됩니다.

## 제공자 런타임 훅

제공자 Plugin에는 세 계층이 있습니다.

- 저렴한 사전 런타임 조회를 위한 **manifest 메타데이터**:
  `setup.providers[].envVars`, 지원 중단된 호환성 `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, `channelEnvVars`.
- **설정 시점 훅**: `catalog`(레거시 `discovery`) 및
  `applyConfigDefaults`.
- **런타임 훅**: 인증, 모델 해석,
  스트림 래핑, 사고 수준, 재생 정책, 사용량 엔드포인트를 다루는 40개 이상의 선택적 훅. 전체 목록은 [훅 순서와 사용법](#hook-order-and-usage)을 참조하세요.

OpenClaw는 여전히 일반 에이전트 루프, 장애 조치, transcript 처리 및 도구 정책을 소유합니다. 이러한 훅은 전체 사용자 지정 추론 전송이 필요하지 않도록 제공자별 동작을 위한 확장 표면입니다.

제공자에 환경 변수 기반 자격 증명이 있어 일반 인증/상태/모델 선택기 경로가 Plugin 런타임을 로드하지 않고 이를 확인해야 하는 경우 manifest `setup.providers[].envVars`를 사용하세요. 지원 중단된 `providerAuthEnvVars`는 지원 중단 기간 동안 호환성 어댑터에서 계속 읽으며, 이를 사용하는 번들되지 않은 Plugin은 manifest 진단을 받습니다. 한 제공자 ID가 다른 제공자 ID의 환경 변수, 인증 프로필, 구성 기반 인증 및 API 키 온보딩 선택을 재사용해야 하는 경우 manifest `providerAuthAliases`를 사용하세요. 온보딩/인증 선택 CLI 표면이 제공자의 선택 ID, 그룹 레이블 및 간단한 단일 플래그 인증 배선을 Plugin 런타임을 로드하지 않고 알아야 하는 경우 manifest `providerAuthChoices`를 사용하세요. 온보딩 레이블이나 OAuth 클라이언트 ID/클라이언트 시크릿 설정 변수와 같은 운영자용 힌트에는 제공자 런타임 `envVars`를 유지하세요.

채널에 일반 셸 환경 대체, 구성/상태 확인 또는 설정 프롬프트가 채널 런타임을 로드하지 않고 확인해야 하는 환경 변수 기반 인증이나 설정이 있는 경우 manifest `channelEnvVars`를 사용하세요.

### 훅 순서와 사용법

모델/제공자 Plugin의 경우 OpenClaw는 대략 다음 순서로 훅을 호출합니다.
"사용 시점" 열은 빠른 결정 가이드입니다.
`ProviderPlugin.capabilities` 및 `suppressBuiltInModel`처럼 OpenClaw가 더 이상 호출하지 않는 호환성 전용 제공자 필드는 의도적으로 여기에 나열하지 않았습니다.

| #   | Hook                              | 수행 내용                                                                                                   | 사용 시점                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 프로바이더 구성을 `models.providers`에 게시                                | 프로바이더가 카탈로그 또는 기본 URL 기본값을 소유하는 경우                                                                                                  |
| 2   | `applyConfigDefaults`             | 구성 구체화 중 프로바이더 소유 전역 구성 기본값 적용                                      | 기본값이 인증 모드, env, 또는 프로바이더 모델 계열 의미 체계에 따라 달라지는 경우                                                                         |
| --  | _(내장 모델 조회)_         | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도                                                          | _(Plugin hook 아님)_                                                                                                                         |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 미리 보기 모델 ID 별칭 정규화                                                     | 프로바이더가 표준 모델 해석 전에 별칭 정리를 소유하는 경우                                                                                 |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 프로바이더 계열 `api` / `baseUrl` 정규화                                      | 프로바이더가 동일한 전송 계열의 사용자 지정 프로바이더 ID에 대한 전송 정리를 소유하는 경우                                                          |
| 5   | `normalizeConfig`                 | 런타임/프로바이더 해석 전에 `models.providers.<id>` 정규화                                           | 프로바이더에 Plugin과 함께 있어야 하는 구성 정리가 필요한 경우. 번들된 Google 계열 헬퍼도 지원되는 Google 구성 항목을 보완함   |
| 6   | `applyNativeStreamingUsageCompat` | 구성 프로바이더에 네이티브 스트리밍 사용량 호환성 재작성 적용                                               | 프로바이더에 엔드포인트 기반 네이티브 스트리밍 사용량 메타데이터 수정이 필요한 경우                                                                          |
| 7   | `resolveConfigApiKey`             | 런타임 인증 로드 전에 구성 프로바이더의 env-marker 인증 해석                                       | 프로바이더가 자체 env-marker API 키 해석 hook을 노출하는 경우                                                                                |
| 8   | `resolveSyntheticAuth`            | 평문을 저장하지 않고 로컬/셀프 호스팅 또는 구성 기반 인증 노출                                   | 프로바이더가 합성/로컬 자격 증명 마커로 동작할 수 있는 경우                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 프로바이더 소유 외부 인증 프로필을 오버레이. CLI/앱 소유 자격 증명의 기본 `persistence`는 `runtime-only` | 프로바이더가 복사된 새로 고침 토큰을 저장하지 않고 외부 인증 자격 증명을 재사용하는 경우. 매니페스트에 `contracts.externalAuthProviders` 선언 |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 합성 프로필 자리표시자를 env/구성 기반 인증 뒤로 낮춤                                      | 프로바이더가 우선순위에서 이기면 안 되는 합성 자리표시자 프로필을 저장하는 경우                                                                 |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 프로바이더 소유 모델 ID에 대한 동기식 폴백                                       | 프로바이더가 임의의 업스트림 모델 ID를 허용하는 경우                                                                                                 |
| 12  | `prepareDynamicModel`             | 비동기 예열 후 `resolveDynamicModel`을 다시 실행                                                           | 프로바이더가 알 수 없는 ID를 해석하기 전에 네트워크 메타데이터가 필요한 경우                                                                                  |
| 13  | `normalizeResolvedModel`          | 임베디드 러너가 해석된 모델을 사용하기 전 최종 재작성                                               | 프로바이더에 전송 재작성이 필요하지만 여전히 코어 전송을 사용하는 경우                                                                             |
| 14  | `normalizeToolSchemas`            | 임베디드 러너가 보기 전에 도구 스키마 정규화                                                    | 프로바이더에 전송 계열 스키마 정리가 필요한 경우                                                                                                |
| 15  | `inspectToolSchemas`              | 정규화 후 프로바이더 소유 스키마 진단 노출                                                  | 프로바이더가 코어에 프로바이더별 규칙을 가르치지 않고 키워드 경고를 원하는 경우                                                                 |
| 16  | `resolveReasoningOutputMode`      | 네이티브 대 태그 지정 추론 출력 계약 선택                                                              | 프로바이더가 네이티브 필드 대신 태그 지정 추론/최종 출력을 필요로 하는 경우                                                                         |
| 17  | `prepareExtraParams`              | 일반 스트림 옵션 래퍼 전에 요청 매개변수 정규화                                              | 프로바이더에 기본 요청 매개변수 또는 프로바이더별 매개변수 정리가 필요한 경우                                                                           |
| 18  | `createStreamFn`                  | 일반 스트림 경로를 사용자 지정 전송으로 완전히 대체                                                   | 프로바이더에 단순 래퍼가 아닌 사용자 지정 와이어 프로토콜이 필요한 경우                                                                                     |
| 20  | `wrapStreamFn`                    | 일반 래퍼가 적용된 후의 스트림 래퍼                                                              | 프로바이더에 사용자 지정 전송 없이 요청 헤더/본문/모델 호환성 래퍼가 필요한 경우                                                          |
| 21  | `resolveTransportTurnState`       | 네이티브 턴별 전송 헤더 또는 메타데이터 연결                                                           | 프로바이더가 일반 전송이 프로바이더 네이티브 턴 ID를 보내도록 하려는 경우                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 쿨다운 정책 연결                                                    | 프로바이더가 일반 WS 전송의 세션 헤더 또는 폴백 정책을 조정하려는 경우                                                               |
| 23  | `formatApiKey`                    | 인증 프로필 포매터: 저장된 프로필이 런타임 `apiKey` 문자열이 됨                                     | 프로바이더가 추가 인증 메타데이터를 저장하고 사용자 지정 런타임 토큰 형태가 필요한 경우                                                                    |
| 24  | `refreshOAuth`                    | 사용자 지정 새로 고침 엔드포인트 또는 새로 고침 실패 정책을 위한 OAuth 새로 고침 재정의                                  | 프로바이더가 공유 OpenClaw 새로 고침 처리기에 맞지 않는 경우                                                                                          |
| 25  | `buildAuthDoctorHint`             | OAuth 새로 고침 실패 시 덧붙이는 복구 힌트                                                                  | 프로바이더가 새로 고침 실패 후 프로바이더 소유 인증 복구 안내가 필요한 경우                                                                      |
| 26  | `matchesContextOverflowError`     | 프로바이더 소유 컨텍스트 창 오버플로 일치기                                                                 | 프로바이더에 일반 휴리스틱이 놓칠 원시 오버플로 오류가 있는 경우                                                                                |
| 27  | `classifyFailoverReason`          | 프로바이더 소유 장애 조치 이유 분류                                                                  | 프로바이더가 원시 API/전송 오류를 속도 제한/과부하 등으로 매핑할 수 있는 경우                                                                          |
| 28  | `isCacheTtlEligible`              | 프록시/백홀 프로바이더를 위한 프롬프트 캐시 정책                                                               | 프로바이더에 프록시별 캐시 TTL 게이팅이 필요한 경우                                                                                                |
| 29  | `buildMissingAuthMessage`         | 일반 인증 누락 복구 메시지 대체                                                      | 프로바이더에 프로바이더별 인증 누락 복구 힌트가 필요한 경우                                                                                 |
| 30  | `augmentModelCatalog`             | 탐색 후 추가되는 합성/최종 카탈로그 행                                                          | 프로바이더가 `models list`와 선택기에 합성 전방 호환 행을 필요로 하는 경우                                                                     |
| 31  | `resolveThinkingProfile`          | 모델별 `/think` 레벨 집합, 표시 레이블, 기본값                                                 | 프로바이더가 선택된 모델에 대해 사용자 지정 사고 단계 또는 이진 레이블을 노출하는 경우                                                                 |
| 32  | `isBinaryThinking`                | 켜기/끄기 추론 토글 호환성 hook                                                                     | 프로바이더가 이진 사고 켜기/끄기만 노출하는 경우                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 추론 지원 호환성 hook                                                                   | 프로바이더가 일부 모델에만 `xhigh`를 원할 경우                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | 기본 `/think` 레벨 호환성 hook                                                                      | 프로바이더가 모델 계열의 기본 `/think` 정책을 소유하는 경우                                                                                      |
| 35  | `isModernModelRef`                | 라이브 프로필 필터와 스모크 선택을 위한 최신 모델 일치기                                              | 프로바이더가 라이브/스모크 선호 모델 일치를 소유하는 경우                                                                                             |
| 36  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                       | 프로바이더에 토큰 교환 또는 단기 요청 자격 증명이 필요한 경우                                                                             |
| 37  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면을 위한 사용량/결제 자격 증명 해석                                     | 프로바이더에 사용자 지정 사용량/할당량 토큰 파싱 또는 다른 사용량 자격 증명이 필요한 경우                                                               |
| 38  | `fetchUsageSnapshot`              | 인증이 해결된 후 제공자별 사용량/할당량 스냅샷을 가져오고 정규화합니다                             | 제공자에 제공자별 사용량 엔드포인트 또는 페이로드 파서가 필요합니다                                                                           |
| 39  | `createEmbeddingProvider`         | 메모리/검색을 위한 제공자 소유 임베딩 어댑터를 빌드합니다                                                     | 메모리 임베딩 동작은 제공자 Plugin에 속합니다                                                                                    |
| 40  | `buildReplayPolicy`               | 제공자의 transcript 처리를 제어하는 재생 정책을 반환합니다                                        | 제공자에 사용자 지정 transcript 정책이 필요합니다(예: thinking-block 제거)                                                               |
| 41  | `sanitizeReplayHistory`           | 일반 transcript 정리 후 재생 기록을 다시 작성합니다                                                        | 제공자에는 공유 Compaction 헬퍼를 넘어서는 제공자별 재생 재작성 작업이 필요합니다                                                             |
| 42  | `validateReplayTurns`             | 임베디드 러너 전에 최종 재생 턴 검증 또는 재구성을 수행합니다                                           | 제공자 전송에는 일반 정리 후 더 엄격한 턴 검증이 필요합니다                                                                    |
| 43  | `onModelSelected`                 | 제공자 소유의 선택 후 부수 효과를 실행합니다                                                                 | 모델이 활성화될 때 제공자에는 텔레메트리 또는 제공자 소유 상태가 필요합니다                                                                  |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저 일치한 provider Plugin을 확인한 다음, model id 또는 transport/config를 실제로 변경하는 항목이 나올 때까지 hook을 지원하는 다른 provider Plugin으로 넘어갑니다. 이렇게 하면 호출자가 어떤 bundled Plugin이 rewrite를 소유하는지 알 필요 없이 alias/compat provider shim이 계속 동작합니다. 지원되는 Google 계열 config 항목을 rewrite하는 provider hook이 없으면, bundled Google config normalizer가 여전히 해당 compatibility cleanup을 적용합니다.

provider에 완전한 custom wire protocol 또는 custom request executor가 필요하다면, 그것은 다른 종류의 확장입니다. 이 hook들은 OpenClaw의 일반 inference loop에서 계속 실행되는 provider 동작을 위한 것입니다.

`resolveUsageAuth`는 OpenClaw가 `fetchUsageSnapshot`을 호출해야 하는지, 아니면 usage/status surface에 대해 일반 credential resolution으로 fallback해야 하는지 결정합니다. provider에 usage credential이 있으면 `{ token, accountId? }`를 반환하고, provider 소유 usage auth가 요청을 처리했으며 일반 API-key/OAuth fallback을 억제해야 하면 `{ handled: true }`를 반환하고, provider가 usage auth를 처리하지 않았으면 `null` 또는 `undefined`를 반환합니다.

### Provider 예시

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

Bundled provider Plugin은 위의 hook들을 조합하여 각 vendor의 catalog, auth, thinking, replay, usage 요구사항에 맞춥니다. 권위 있는 hook set은 `extensions/` 아래의 각 Plugin에 있으며, 이 페이지는 목록을 그대로 반영하기보다 형태를 설명합니다.

<AccordionGroup>
  <Accordion title="Pass-through catalog provider">
    OpenRouter, Kilocode, Z.AI, xAI는 `catalog`와
    `resolveDynamicModel` / `prepareDynamicModel`을 등록하여 OpenClaw의 static catalog보다 먼저 upstream model id를 노출할 수 있습니다.
  </Accordion>
  <Accordion title="OAuth 및 usage endpoint provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai는
    `prepareRuntimeAuth` 또는 `formatApiKey`를 `resolveUsageAuth` +
    `fetchUsageSnapshot`과 함께 사용하여 token exchange 및 `/usage` integration을 소유합니다.
  </Accordion>
  <Accordion title="Replay 및 transcript cleanup 계열">
    Shared named family(`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`)를 통해 provider는 각 Plugin이 cleanup을 다시 구현하는 대신 `buildReplayPolicy`를 통해 transcript policy를 선택할 수 있습니다.
  </Accordion>
  <Accordion title="Catalog 전용 provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`,
    `volcengine`은 `catalog`만 등록하고 shared inference loop를 사용합니다.
  </Accordion>
  <Accordion title="Anthropic 전용 stream helper">
    Beta header, `/fast` / `serviceTier`, `context1m`은 generic SDK가 아니라 Anthropic Plugin의 public `api.ts` / `contract-api.ts` seam
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

- `textToSpeech`는 file/voice-note surface용 일반 core TTS output payload를 반환합니다.
- core `messages.tts` configuration 및 provider selection을 사용합니다.
- PCM audio buffer + sample rate를 반환합니다. Plugin은 provider에 맞게 resample/encode해야 합니다.
- `listVoices`는 provider별 optional입니다. vendor 소유 voice picker 또는 setup flow에 사용하세요.
- Voice listing에는 provider-aware picker를 위한 locale, gender, personality tag 같은 더 풍부한 metadata가 포함될 수 있습니다.
- 현재 OpenAI와 ElevenLabs는 telephony를 지원합니다. Microsoft는 지원하지 않습니다.

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

- TTS policy, fallback, reply delivery는 core에 유지하세요.
- vendor 소유 synthesis 동작에는 speech provider를 사용하세요.
- Legacy Microsoft `edge` input은 `microsoft` provider id로 정규화됩니다.
- 선호되는 ownership model은 company 중심입니다. 하나의 vendor Plugin이 OpenClaw가 해당 capability contract를 추가함에 따라 text, speech, image, future media provider를 소유할 수 있습니다.

image/audio/video understanding의 경우, Plugin은 generic key/value bag 대신 typed media-understanding provider 하나를 등록합니다.

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

- orchestration, fallback, config, channel wiring은 core에 유지하세요.
- vendor 동작은 provider Plugin에 유지하세요.
- Additive expansion은 typed 상태를 유지해야 합니다. 새 optional method, 새 optional result field, 새 optional capability를 사용하세요.
- Video generation도 이미 같은 pattern을 따릅니다.
  - core가 capability contract와 runtime helper를 소유합니다
  - vendor Plugin은 `api.registerVideoGenerationProvider(...)`를 등록합니다
  - feature/channel Plugin은 `api.runtime.videoGeneration.*`를 사용합니다

media-understanding runtime helper의 경우, Plugin은 다음을 호출할 수 있습니다.

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

audio transcription의 경우, Plugin은 media-understanding runtime 또는 이전 STT alias 중 하나를 사용할 수 있습니다.

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`는 image/audio/video understanding을 위한 선호 shared surface입니다.
- `extractStructuredWithModel(...)`은 범위가 제한된 provider 소유 image-first extraction을 위한 Plugin-facing seam입니다. 최소 하나의 image input을 포함하세요. text input은 supplemental context입니다.
  product Plugin은 route와 schema를 소유하고, OpenClaw는 provider/runtime boundary를 소유합니다.
- core media-understanding audio configuration(`tools.media.audio`) 및 provider fallback order를 사용합니다.
- transcription output이 생성되지 않으면(예: skipped/unsupported input) `{ text: undefined }`를 반환합니다.
- `api.runtime.stt.transcribeAudioFile(...)`은 compatibility alias로 남아 있습니다.

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

- `provider`와 `model`은 run별 optional override이며, persistent session change가 아닙니다.
- OpenClaw는 trusted caller에 대해서만 이러한 override field를 적용합니다.
- Plugin 소유 fallback run의 경우, operator는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 opt in해야 합니다.
- `plugins.entries.<id>.subagent.allowedModels`를 사용하여 trusted Plugin을 특정 canonical `provider/model` target으로 제한하거나, 명시적으로 모든 target을 허용하려면 `"*"`를 사용하세요.
- Untrusted Plugin subagent run은 계속 동작하지만, override request는 조용히 fallback하는 대신 거부됩니다.
- Plugin이 생성한 subagent session에는 생성한 Plugin id가 태그됩니다. Fallback `api.runtime.subagent.deleteSession(...)`은 해당 owned session만 삭제할 수 있습니다. 임의 session 삭제에는 여전히 admin-scoped Gateway request가 필요합니다.

web search의 경우, Plugin은 agent tool wiring에 접근하는 대신 shared runtime helper를 사용할 수 있습니다.

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

- provider selection, credential resolution, shared request semantics는 core에 유지하세요.
- vendor-specific search transport에는 web-search provider를 사용하세요.
- `api.runtime.webSearch.*`는 agent tool wrapper에 의존하지 않고 search behavior가 필요한 feature/channel Plugin을 위한 선호 shared surface입니다.

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

- `generate(...)`: configured image-generation provider chain을 사용하여 image를 생성합니다.
- `listProviders(...)`: 사용 가능한 image-generation provider와 해당 capability를 나열합니다.

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

- `path`: Gateway HTTP 서버 아래의 라우트 경로입니다.
- `auth`: 필수입니다. 일반 Gateway 인증을 요구하려면 `"gateway"`를 사용하고, Plugin 관리 인증/Webhook 검증에는 `"plugin"`을 사용합니다.
- `match`: 선택 사항입니다. `"exact"`(기본값) 또는 `"prefix"`입니다.
- `replaceExisting`: 선택 사항입니다. 같은 Plugin이 자신의 기존 라우트 등록을 대체할 수 있게 합니다.
- `handler`: 라우트가 요청을 처리했을 때 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 Plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- Plugin 라우트는 `auth`를 명시적으로 선언해야 합니다.
- 정확히 같은 `path + match` 충돌은 `replaceExisting: true`가 아닌 한 거부되며, 한 Plugin은 다른 Plugin의 라우트를 대체할 수 없습니다.
- 서로 다른 `auth` 수준의 중첩 라우트는 거부됩니다. `exact`/`prefix` 폴스루 체인은 같은 인증 수준에서만 유지하세요.
- `auth: "plugin"` 라우트는 운영자 런타임 스코프를 자동으로 받지 않습니다. 이는 권한 있는 Gateway 헬퍼 호출이 아니라 Plugin 관리 Webhook/서명 검증을 위한 것입니다.
- `auth: "gateway"` 라우트는 Gateway 요청 런타임 스코프 안에서 실행되지만, 해당 스코프는 의도적으로 보수적입니다.
  - 공유 비밀 bearer 인증(`gateway.auth.mode = "token"` / `"password"`)은 호출자가 `x-openclaw-scopes`를 보내더라도 Plugin 라우트 런타임 스코프를 `operator.write`로 고정합니다.
  - 신뢰할 수 있는 신원 포함 HTTP 모드(예: 비공개 ingress의 `trusted-proxy` 또는 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 있을 때만 `x-openclaw-scopes`를 존중합니다.
  - 이러한 신원 포함 Plugin 라우트 요청에서 `x-openclaw-scopes`가 없으면 런타임 스코프는 `operator.write`로 폴백합니다.
- 실무 규칙: Gateway 인증 Plugin 라우트가 암묵적인 관리자 표면이라고 가정하지 마세요. 라우트에 관리자 전용 동작이 필요하다면 신원 포함 인증 모드를 요구하고 명시적인 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK 가져오기 경로

새 Plugin을 작성할 때는 단일체 `openclaw/plugin-sdk` 루트 배럴 대신 좁은 SDK 하위 경로를 사용하세요. 핵심 하위 경로:

| 하위 경로                           | 목적                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 등록 프리미티브                            |
| `openclaw/plugin-sdk/channel-core`  | 채널 진입/빌드 헬퍼                               |
| `openclaw/plugin-sdk/core`          | 일반 공유 헬퍼 및 포괄 계약                       |
| `openclaw/plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마(`OpenClawSchema`) |

채널 Plugin은 좁은 seam 계열에서 선택합니다. 여기에는 `channel-setup`,
`setup-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`,
`command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`가 포함됩니다. 승인 동작은 서로 관련 없는
Plugin 필드를 섞기보다 하나의 `approvalCapability` 계약으로 통합해야 합니다.
계약은 [채널 Plugin](/ko/plugins/sdk-channel-plugins)을 참조하세요.

런타임 및 구성 헬퍼는 일치하는 집중형 `*-runtime` 하위 경로
(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`,
`text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`,
`channel-activity-runtime` 등) 아래에 있습니다. 넓은 `config-runtime` 호환성 배럴 대신
`config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`을 선호하세요.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`,
작은 채널 헬퍼 facade, `openclaw/plugin-sdk/outbound-runtime`,
`openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`,
`openclaw/plugin-sdk/infra-runtime`은 오래된 Plugin을 위한 사용 중단된 호환성 shim입니다.
새 코드는 대신 더 좁은 일반 프리미티브를 가져와야 합니다.
</Info>

저장소 내부 진입점(번들 Plugin 패키지 루트별):

- `index.js` — 번들 Plugin 진입점
- `api.js` — 헬퍼/타입 배럴
- `runtime-api.js` — 런타임 전용 배럴
- `setup-entry.js` — 설정 Plugin 진입점

외부 Plugin은 `openclaw/plugin-sdk/*` 하위 경로만 가져와야 합니다. core나 다른 Plugin에서
다른 Plugin 패키지의 `src/*`를 가져오지 마세요.
Facade로 로드되는 진입점은 활성 런타임 구성 스냅샷이 있으면 이를 선호하고,
그다음 디스크의 해석된 구성 파일로 폴백합니다.

`image-generation`, `media-understanding`, `speech` 같은 기능별 하위 경로는
번들 Plugin이 현재 사용하기 때문에 존재합니다. 이들은 자동으로 장기 고정 외부 계약이
되는 것은 아닙니다. 의존할 때는 관련 SDK 참조 페이지를 확인하세요.

## 메시지 도구 스키마

Plugin은 반응, 읽음, 설문 같은 비메시지 프리미티브에 대한 채널별
`describeMessageTool(...)` 스키마 기여를 소유해야 합니다.
공유 전송 presentation은 공급자 네이티브 버튼, 컴포넌트, 블록 또는 카드 필드 대신
일반 `MessagePresentation` 계약을 사용해야 합니다.
계약, 폴백 규칙, 공급자 매핑, Plugin 작성자 체크리스트는
[메시지 Presentation](/ko/plugins/message-presentation)을 참조하세요.

전송 가능한 Plugin은 메시지 capability를 통해 렌더링할 수 있는 항목을 선언합니다.

- 의미론적 presentation 블록(`text`, `context`, `divider`, `buttons`, `select`)에는 `presentation`
- 고정 전송 요청에는 `delivery-pin`

core는 presentation을 네이티브로 렌더링할지 텍스트로 degrade할지 결정합니다.
일반 메시지 도구에서 공급자 네이티브 UI escape hatch를 노출하지 마세요.
레거시 네이티브 스키마용으로 사용 중단된 SDK 헬퍼는 기존 타사 Plugin을 위해 계속 내보내지만,
새 Plugin은 사용하지 않아야 합니다.

## 채널 대상 해석

채널 Plugin은 채널별 대상 의미론을 소유해야 합니다. 공유 outbound host는 일반적으로 유지하고,
공급자 규칙에는 메시징 어댑터 표면을 사용하세요.

- `messaging.inferTargetChatType({ to })`는 디렉터리 조회 전에 정규화된 대상을
  `direct`, `group`, `channel` 중 무엇으로 처리할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 입력이 디렉터리 검색 대신
  id 형태 해석으로 바로 건너뛰어야 하는지 core에 알려줍니다.
- `messaging.targetResolver.reservedLiterals`는 해당 공급자의 채널/세션 참조인 단순 단어를 나열합니다.
  해석은 예약 리터럴을 거부하기 전에 구성된 디렉터리 항목을 보존하고, 그다음 디렉터리 미스에서 fail closed합니다.
- `messaging.targetResolver.resolveTarget(...)`는 정규화 후 또는 디렉터리 미스 후
  core에 최종 공급자 소유 해석이 필요할 때의 Plugin 폴백입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 해석된 뒤 공급자별 세션
  라우트 구성을 소유합니다.

권장 분리:

- peers/groups 검색 전에 일어나야 하는 범주 결정에는 `inferTargetChatType`을 사용하세요.
- "이를 명시적/네이티브 대상 id로 처리" 확인에는 `looksLikeId`를 사용하세요.
- 넓은 디렉터리 검색이 아니라 공급자별 정규화 폴백에는 `resolveTarget`을 사용하세요.
- chat id, thread id, JID, handle, room id 같은 공급자 네이티브 id는 일반 SDK
  필드가 아니라 `target` 값 또는 공급자별 매개변수 안에 유지하세요.

## 구성 기반 디렉터리

구성에서 디렉터리 항목을 파생하는 Plugin은 해당 로직을 Plugin 안에 유지하고
`openclaw/plugin-sdk/directory-runtime`의 공유 헬퍼를 재사용해야 합니다.

채널에 다음과 같은 구성 기반 peers/groups가 필요할 때 사용하세요.

- allowlist 기반 DM peers
- 구성된 채널/그룹 맵
- 계정 범위 정적 디렉터리 폴백

`directory-runtime`의 공유 헬퍼는 일반 작업만 처리합니다.

- 쿼리 필터링
- limit 적용
- 중복 제거/정규화 헬퍼
- `ChannelDirectoryEntry[]` 빌드

채널별 계정 검사 및 id 정규화는 Plugin 구현에 남아 있어야 합니다.

## 공급자 카탈로그

공급자 Plugin은 `registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가 `models.providers`에 쓰는 것과 같은 형태를 반환합니다.

- 하나의 공급자 항목에는 `{ provider }`
- 여러 공급자 항목에는 `{ providers }`

Plugin이 공급자별 모델 id, 기본 URL 기본값 또는 인증으로 제한된 모델 메타데이터를 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 Plugin의 카탈로그가 OpenClaw의 내장 암시적 공급자와 비교해 언제 병합되는지 제어합니다.

- `simple`: 일반 API 키 또는 env 기반 공급자
- `profile`: 인증 프로필이 있을 때 나타나는 공급자
- `paired`: 여러 관련 공급자 항목을 합성하는 공급자
- `late`: 다른 암시적 공급자 뒤의 마지막 패스

나중 공급자가 키 충돌에서 이기므로, Plugin은 같은 공급자 id를 가진 내장 공급자 항목을 의도적으로 override할 수 있습니다.

Plugin은 `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`를 통해 읽기 전용 모델 행도 게시할 수 있습니다. 이는 list/help/picker 표면을 위한 앞으로의 경로이며
`text`, `image_generation`, `video_generation`, `music_generation` 행을 지원합니다.
공급자 Plugin은 여전히 live endpoint 호출, 토큰 교환, 벤더 응답 매핑을 소유하며,
core는 공통 행 형태, source 레이블, 미디어 도구 도움말 formatting을 소유합니다.
미디어 생성 공급자 등록은 `defaultModel`, `models`, `capabilities`에서 정적
카탈로그 행을 자동으로 합성합니다.

호환성:

- `discovery`는 레거시 alias로 여전히 동작하지만 사용 중단 경고를 냅니다.
- `catalog`와 `discovery`가 모두 등록되면 OpenClaw는 `catalog`를 사용합니다.
- `augmentModelCatalog`는 사용 중단되었습니다. 번들 공급자는 `registerModelCatalogProvider`를 통해
  보충 행을 게시해야 합니다.

## 읽기 전용 채널 검사

Plugin이 채널을 등록한다면 `resolveAccount(...)`와 함께
`plugin.config.inspectAccount(cfg, accountId)`를 구현하는 것을 선호하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이 완전히 materialized되었다고 가정할 수 있으며,
  필요한 비밀이 없을 때 빠르게 실패할 수 있습니다.
- `openclaw status`, `openclaw status --all`,
  `openclaw channels status`, `openclaw channels resolve`, doctor/config
  repair 흐름 같은 읽기 전용 명령 경로는 구성을 설명하기 위해 런타임 자격 증명을 materialize할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명적인 계정 상태만 반환합니다.
- `enabled`와 `configured`를 보존합니다.
- 관련 있을 때 다음과 같은 자격 증명 source/status 필드를 포함합니다.
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다.
  `tokenStatus: "available"`(및 일치하는 source 필드)을 반환하는 것으로 status 스타일 명령에는 충분합니다.
- 자격 증명이 SecretRef를 통해 구성되었지만 현재 명령 경로에서 사용할 수 없을 때는 `configured_unavailable`을 사용하세요.

이를 통해 읽기 전용 명령은 충돌하거나 계정이 구성되지 않았다고 잘못 보고하는 대신
"이 명령 경로에서는 구성되었지만 사용할 수 없음"을 보고할 수 있습니다.

## 패키지 팩

Plugin 디렉터리에는 `openclaw.extensions`가 있는 `package.json`을 포함할 수 있습니다.

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 항목은 하나의 Plugin이 됩니다. 팩이 여러 extension을 나열하면 Plugin id는
`name/<fileBase>`가 됩니다.

Plugin이 npm deps를 가져온다면 해당 디렉터리에 설치하여
`node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 guardrail: 모든 `openclaw.extensions` 항목은 symlink 해석 후에도 Plugin
디렉터리 안에 있어야 합니다. 패키지 디렉터리를 벗어나는 항목은 거부됩니다.

보안 참고: `openclaw plugins install`은 프로젝트 로컬 `npm install --omit=dev --ignore-scripts`로 Plugin 종속성을 설치합니다(수명 주기 스크립트 없음, 런타임에 개발 종속성 없음). 상속된 전역 npm 설치 설정은 무시됩니다. Plugin 종속성 트리는 "pure JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 설정 전용 모듈을 가리킬 수 있습니다. OpenClaw가 비활성화된 채널 Plugin의 설정 표면이 필요하거나, 채널 Plugin이 활성화되었지만 아직 구성되지 않은 경우 전체 Plugin 엔트리 대신 `setupEntry`를 로드합니다. 이렇게 하면 기본 Plugin 엔트리가 도구, 훅 또는 기타 런타임 전용 코드도 연결하는 경우 시작과 설정이 더 가벼워집니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은 채널이 이미 구성되어 있더라도 Gateway의 수신 전 시작 단계 동안 채널 Plugin이 동일한 `setupEntry` 경로를 사용하도록 선택할 수 있게 합니다.

Gateway가 수신을 시작하기 전에 반드시 존재해야 하는 시작 표면을 `setupEntry`가 완전히 포함하는 경우에만 이것을 사용하세요. 실제로는 설정 엔트리가 시작에서 의존하는 모든 채널 소유 기능을 등록해야 한다는 뜻입니다. 예를 들면 다음과 같습니다.

- 채널 등록 자체
- Gateway가 수신을 시작하기 전에 사용할 수 있어야 하는 모든 HTTP 라우트
- 같은 기간 동안 존재해야 하는 모든 Gateway 메서드, 도구 또는 서비스

전체 엔트리가 여전히 필요한 시작 기능을 소유한다면 이 플래그를 활성화하지 마세요. Plugin을 기본 동작으로 유지하고 OpenClaw가 시작 중에 전체 엔트리를 로드하게 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 코어가 참조할 수 있는 설정 전용 계약 표면 헬퍼도 게시할 수 있습니다. 현재 설정 승격 표면은 다음과 같습니다.

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

코어는 전체 Plugin 엔트리를 로드하지 않고 레거시 단일 계정 채널 구성을 `channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다. Matrix가 현재 번들 예시입니다. 명명된 계정이 이미 존재할 때 인증/부트스트랩 키만 명명된 승격 계정으로 이동하며, 항상 `accounts.default`를 생성하는 대신 구성된 비정규 기본 계정 키를 보존할 수 있습니다.

이 설정 패치 어댑터는 번들 계약 표면 검색을 지연 상태로 유지합니다. 가져오기 시간은 가볍게 유지되며, 승격 표면은 모듈 가져오기 시 번들 채널 시작에 다시 진입하는 대신 처음 사용할 때만 로드됩니다.

이러한 시작 표면에 Gateway RPC 메서드가 포함되는 경우 Plugin별 접두사에 유지하세요. 코어 관리자 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 예약된 상태로 남아 있으며, Plugin이 더 좁은 범위를 요청하더라도 항상 `operator.admin`으로 해석됩니다.

예시:

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

### 채널 카탈로그 메타데이터

채널 Plugin은 `openclaw.channel`을 통해 설정/검색 메타데이터를, `openclaw.install`을 통해 설치 힌트를 알릴 수 있습니다. 이렇게 하면 코어 카탈로그에 데이터가 없어도 됩니다.

예시:

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
      "blurb": "Nextcloud Talk webhook 봇을 통한 자체 호스팅 채팅입니다.",
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

최소 예시 외에 유용한 `openclaw.channel` 필드:

- `detailLabel`: 더 풍부한 카탈로그/상태 표면을 위한 보조 레이블
- `docsLabel`: 문서 링크의 링크 텍스트 재정의
- `preferOver`: 이 카탈로그 항목이 우선해야 하는 낮은 우선순위의 Plugin/채널 ID
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 문구 제어
- `markdownCapable`: 아웃바운드 서식 결정에서 채널을 마크다운 가능으로 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 설정/구성 선택기에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭. `exposure` 사용을 권장
- `quickstartAllowFrom`: 채널을 표준 빠른 시작 `allowFrom` 플로에 참여시킴
- `forceAccountBinding`: 계정이 하나만 존재하더라도 명시적 계정 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: 공지 대상을 해석할 때 세션 조회 선호

OpenClaw는 **외부 채널 카탈로그**(예: MPM 레지스트리 내보내기)도 병합할 수 있습니다. 다음 중 하나에 JSON 파일을 두세요.

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)가 하나 이상의 JSON 파일을 가리키도록 하세요(쉼표/세미콜론/`PATH`로 구분). 각 파일에는 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`가 포함되어야 합니다. 파서는 `"entries"` 키의 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

생성된 채널 카탈로그 항목과 제공자 설치 카탈로그 항목은 원시 `openclaw.install` 블록 옆에 정규화된 설치 소스 사실을 노출합니다. 정규화된 사실은 npm 사양이 정확한 버전인지 부동 선택자인지, 예상 무결성 메타데이터가 있는지, 로컬 소스 경로도 사용할 수 있는지를 식별합니다. 카탈로그/패키지 ID를 알고 있는 경우, 정규화된 사실은 파싱된 npm 패키지 이름이 해당 ID에서 벗어나면 경고합니다. 또한 `defaultChoice`가 유효하지 않거나 사용할 수 없는 소스를 가리킬 때, 그리고 유효한 npm 소스 없이 npm 무결성 메타데이터가 있을 때도 경고합니다. 소비자는 수작업 항목과 카탈로그 심이 이를 합성할 필요가 없도록 `installSource`를 추가적인 선택 필드로 취급해야 합니다.
이를 통해 온보딩과 진단은 Plugin 런타임을 가져오지 않고도 소스 평면 상태를 설명할 수 있습니다.

공식 외부 npm 항목은 정확한 `npmSpec`과 `expectedIntegrity`를 선호해야 합니다. 기본 패키지 이름과 dist-tag도 호환성을 위해 계속 작동하지만, 카탈로그가 기존 Plugin을 깨뜨리지 않고 고정되고 무결성이 확인된 설치로 이동할 수 있도록 소스 평면 경고를 표시합니다. 온보딩이 로컬 카탈로그 경로에서 설치할 때는 가능하면 `source: "path"`와 워크스페이스 상대 `sourcePath`가 있는 관리형 Plugin Plugin 인덱스 항목을 기록합니다. 절대 운영 로드 경로는 `plugins.load.paths`에 남아 있으며, 설치 레코드는 로컬 워크스테이션 경로가 장기 구성에 중복되는 것을 피합니다. 이렇게 하면 두 번째 원시 파일 시스템 경로 공개 표면을 추가하지 않고도 로컬 개발 설치가 소스 평면 진단에 보입니다. 영속화된 `installed_plugin_index` SQLite 행은 설치 소스의 진실 공급원이며 Plugin 런타임 모듈을 로드하지 않고도 새로 고칠 수 있습니다. 해당 `installRecords` 맵은 Plugin 매니페스트가 없거나 유효하지 않더라도 지속되며, 해당 `plugins` 페이로드는 다시 빌드할 수 있는 매니페스트 뷰입니다.

## 컨텍스트 엔진 Plugin

컨텍스트 엔진 Plugin은 수집, 조립, Compaction을 위한 세션 컨텍스트 오케스트레이션을 소유합니다. Plugin에서 `api.registerContextEngine(id, factory)`로 등록한 다음, `plugins.slots.contextEngine`으로 활성 엔진을 선택하세요.

Plugin이 메모리 검색이나 훅을 추가하는 수준을 넘어 기본 컨텍스트 파이프라인을 대체하거나 확장해야 할 때 이것을 사용하세요.

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

팩토리 `ctx`는 생성 시 초기화를 위한 선택적 `config`, `agentDir`, `workspaceDir` 값을 노출합니다.

활성 하네스에 영속 백엔드 스레드가 있는 경우 `assemble()`은 `contextProjection`을 반환할 수 있습니다. 레거시 턴별 프로젝션에는 생략하세요. 조립된 컨텍스트를 백엔드 스레드에 한 번 주입하고 epoch가 변경될 때까지 재사용해야 하는 경우 `{ mode: "thread_bootstrap", epoch }`를 반환하세요. 엔진 소유 Compaction 패스 후처럼 엔진의 의미론적 컨텍스트가 변경된 후 epoch를 변경하세요. 호스트는 새 백엔드 스레드가 원시 비밀 포함 페이로드를 복사하지 않고도 도구 연속성을 유지하도록 스레드 부트스트랩 프로젝션에서 도구 호출 메타데이터, 입력 형태, 수정 처리된 도구 결과를 보존할 수 있습니다.

엔진이 Compaction 알고리즘을 소유하지 **않는** 경우 `compact()`를 구현된 상태로 유지하고 명시적으로 위임하세요.

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

## 새 기능 추가

Plugin에 현재 API에 맞지 않는 동작이 필요한 경우 비공개 접근으로 Plugin 시스템을 우회하지 마세요. 누락된 기능을 추가하세요.

권장 순서:

1. 코어 계약 정의
   코어가 소유해야 하는 공유 동작을 결정하세요: 정책, 폴백, 구성 병합, 수명 주기, 채널 대상 의미론, 런타임 헬퍼 형태.
2. 타입이 지정된 Plugin 등록/런타임 표면 추가
   가장 작고 유용한 타입 지정 기능 표면으로 `OpenClawPluginApi` 및/또는 `api.runtime`을 확장하세요.
3. 코어 + 채널/기능 소비자 연결
   채널과 기능 Plugin은 벤더 구현을 직접 가져오는 대신 코어를 통해 새 기능을 소비해야 합니다.
4. 벤더 구현 등록
   그런 다음 벤더 Plugin이 해당 기능에 백엔드를 등록합니다.
5. 계약 커버리지 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가하세요.

이것이 OpenClaw가 특정 제공자의 세계관에 하드코딩되지 않으면서도 의견을 유지하는 방식입니다. 구체적인 파일 체크리스트와 실제 예시는 [기능 쿡북](/ko/plugins/adding-capabilities)을 참조하세요.

### 기능 체크리스트

새 기능을 추가할 때 구현은 일반적으로 다음 표면을 함께 다루어야 합니다.

- `src/<capability>/types.ts`의 코어 계약 타입
- `src/<capability>/runtime.ts`의 코어 러너/런타임 헬퍼
- `src/plugins/types.ts`의 Plugin API 등록 표면
- `src/plugins/registry.ts`의 Plugin 레지스트리 연결
- 기능/채널 Plugin이 이를 소비해야 할 때 `src/plugins/runtime/*`의 Plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 헬퍼
- `src/plugins/contracts/registry.ts`의 소유권/계약 어설션
- `docs/`의 운영자/Plugin 문서

이 표면 중 하나가 누락되어 있다면 일반적으로 기능이 아직 완전히 통합되지 않았다는 신호입니다.

### 기능 템플릿

최소 패턴:

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

계약 테스트 패턴:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

그러면 규칙이 단순하게 유지됩니다.

- core는 기능 계약과 오케스트레이션을 소유합니다.
- 벤더 Plugin은 벤더 구현을 소유합니다.
- 기능/channel Plugin은 런타임 헬퍼를 사용합니다.
- 계약 테스트는 소유권을 명시적으로 유지합니다.

## 관련 항목

- [Plugin 아키텍처](/ko/plugins/architecture) — 공개 기능 모델과 형태
- [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
