---
read_when:
    - 프로바이더 런타임 훅, 채널 수명 주기 또는 패키지 팩 구현하기
    - Plugin 로드 순서 또는 레지스트리 상태 디버깅
    - 새 Plugin 기능 또는 컨텍스트 엔진 Plugin 추가
summary: 'Plugin 아키텍처 내부: 로드 파이프라인, 레지스트리, 런타임 훅, HTTP 라우트 및 참조 표'
title: Plugin 아키텍처 내부 구조
x-i18n:
    generated_at: "2026-05-03T21:35:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898cbe2f97d666fc8bb2c2197cb786efb6d13a8842d8eb931fa3ce535bfd21fb
    source_path: plugins/architecture-internals.md
    workflow: 16
---

공개 기능 모델, Plugin 형태, 소유권/실행 계약은 [Plugin 아키텍처](/ko/plugins/architecture)를 참조하세요. 이 페이지는 내부 동작 방식의 참조 문서입니다: 로드 파이프라인, 레지스트리, 런타임 훅, Gateway HTTP 라우트, 가져오기 경로, 스키마 표.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음을 수행합니다:

1. 후보 Plugin 루트 검색
2. 네이티브 또는 호환 번들 매니페스트와 패키지 메타데이터 읽기
3. 안전하지 않은 후보 거부
4. Plugin 구성 정규화(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 각 후보의 활성화 여부 결정
6. 활성화된 네이티브 모듈 로드: 빌드된 번들 모듈은 네이티브 로더를 사용하고,
   서드파티 로컬 소스 TypeScript는 긴급 Jiti 대체 경로를 사용
7. 네이티브 `register(api)` 훅을 호출하고 등록 항목을 Plugin 레지스트리에 수집
8. 레지스트리를 명령/런타임 표면에 노출

<Note>
`activate`는 `register`의 레거시 별칭입니다. 로더는 존재하는 항목(`def.register ?? def.activate`)을 확인해 같은 지점에서 호출합니다. 모든 번들 Plugin은 `register`를 사용합니다. 새 Plugin에는 `register`를 권장합니다.
</Note>

안전성 게이트는 런타임 실행 **전에** 발생합니다. 엔트리가 Plugin 루트를 벗어나거나, 경로가 전역 쓰기 가능하거나, 번들되지 않은 Plugin에서 경로 소유권이 의심스러워 보이면 후보가 차단됩니다.

차단된 후보는 진단을 위해 해당 Plugin id와 계속 연결됩니다. 구성이 여전히 그 id를 참조하면 검증은 해당 Plugin을 존재하지만 차단된 것으로 보고하며, 구성 항목을 오래된 것으로 처리하는 대신 경로 안전성 경고를 다시 가리킵니다.

### 매니페스트 우선 동작

매니페스트는 제어 평면의 신뢰 원천입니다. OpenClaw는 이를 사용해 다음을 수행합니다:

- Plugin 식별
- 선언된 채널/Skills/구성 스키마 또는 번들 기능 검색
- `plugins.entries.<id>.config` 검증
- Control UI 레이블/플레이스홀더 보강
- 설치/카탈로그 메타데이터 표시
- Plugin 런타임을 로드하지 않고 저비용 활성화 및 설정 설명자 보존

네이티브 Plugin에서 런타임 모듈은 데이터 평면 부분입니다. 훅, 도구, 명령, 제공자 플로 같은 실제 동작을 등록합니다.

선택적 매니페스트 `activation` 및 `setup` 블록은 제어 평면에 남습니다. 이는 활성화 계획과 설정 검색을 위한 메타데이터 전용 설명자입니다. 런타임 등록, `register(...)`, 또는 `setupEntry`를 대체하지 않습니다.
첫 번째 라이브 활성화 소비자는 이제 매니페스트 명령, 채널, 제공자 힌트를 사용해 더 넓은 레지스트리 구체화 전에 Plugin 로딩을 좁힙니다:

- CLI 로딩은 요청된 기본 명령을 소유한 Plugin으로 좁힘
- 채널 설정/Plugin 해석은 요청된 채널 id를 소유한 Plugin으로 좁힘
- 명시적 제공자 설정/런타임 해석은 요청된 제공자 id를 소유한 Plugin으로 좁힘
- Gateway 시작 계획은 명시적 시작 가져오기와 시작 제외에 `activation.onStartup`을 사용합니다. 시작 메타데이터가 없는 Plugin은 더 좁은 활성화 트리거를 통해서만 로드됩니다.

넓은 `all` 범위를 요청하는 요청 시점 런타임 사전 로드는 여전히 구성, 시작 계획, 구성된 채널, 슬롯, 자동 활성화 규칙에서 명시적인 유효 Plugin id 집합을 도출합니다. 도출된 집합이 비어 있으면 OpenClaw는 검색 가능한 모든 Plugin으로 확장하는 대신 빈 런타임 레지스트리를 로드합니다.

활성화 플래너는 기존 호출자를 위한 id 전용 API와 새 진단을 위한 계획 API를 모두 노출합니다. 계획 항목은 Plugin이 선택된 이유를 보고하며, 명시적 `activation.*` 플래너 힌트를 `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, 훅 같은 매니페스트 소유권 대체 경로와 분리합니다. 이 이유 분리가 호환성 경계입니다. 기존 Plugin 메타데이터는 계속 동작하고, 새 코드는 런타임 로딩 의미를 바꾸지 않고도 넓은 힌트나 대체 동작을 감지할 수 있습니다.

설정 검색은 이제 `setup-api`로 대체하기 전에 `setup.providers` 및 `setup.cliBackends` 같은 설명자 소유 id를 우선 사용해 후보 Plugin을 좁힙니다. 이는 여전히 설정 시점 런타임 훅이 필요한 Plugin을 위한 것입니다. 제공자 설정 목록은 제공자 런타임을 로드하지 않고 매니페스트 `providerAuthChoices`, 설명자에서 도출된 설정 선택지, 설치 카탈로그 메타데이터를 사용합니다. 명시적 `setup.requiresRuntime: false`는 설명자 전용 차단선입니다. 생략된 `requiresRuntime`은 호환성을 위해 레거시 setup-api 대체 경로를 유지합니다. 검색된 Plugin이 둘 이상 같은 정규화된 설정 제공자 또는 CLI 백엔드 id를 주장하면, 설정 조회는 검색 순서에 의존하는 대신 모호한 소유자를 거부합니다. 설정 런타임이 실행될 때 레지스트리 진단은 레거시 Plugin을 차단하지 않고 `setup.providers` / `setup.cliBackends`와 setup-api가 등록한 제공자 또는 CLI 백엔드 간의 드리프트를 보고합니다.

### Plugin 캐시 경계

OpenClaw는 Plugin 검색 결과나 직접 매니페스트 레지스트리 데이터를 벽시계 시간 창 뒤에 캐시하지 않습니다. 설치, 매니페스트 편집, 로드 경로 변경은 다음 명시적 메타데이터 읽기 또는 스냅샷 재구성에서 보여야 합니다.
매니페스트 파일 파서는 열린 매니페스트 경로, inode, 크기, 타임스탬프로 키가 지정된 제한된 파일 서명 캐시를 유지할 수 있습니다. 해당 캐시는 변경되지 않은 바이트의 재파싱만 피하며, 검색, 레지스트리, 소유자, 정책 답변을 캐시해서는 안 됩니다.

안전한 메타데이터 빠른 경로는 숨겨진 캐시가 아니라 명시적 객체 소유권입니다. Gateway 시작 핫 경로는 현재 `PluginMetadataSnapshot`, 도출된 `PluginLookUpTable`, 또는 명시적 매니페스트 레지스트리를 호출 체인으로 전달해야 합니다. 구성 검증, 시작 자동 활성화, Plugin 부트스트랩, 제공자 선택은 해당 객체가 현재 구성과 Plugin 인벤토리를 나타내는 동안 재사용할 수 있습니다. 설정 조회는 특정 설정 경로가 명시적 매니페스트 레지스트리를 받지 않는 한 여전히 필요 시 매니페스트 메타데이터를 재구성합니다. 숨겨진 조회 캐시를 추가하지 말고 이를 콜드 경로 대체 수단으로 유지하세요. 입력이 바뀌면 스냅샷을 변경하거나 과거 복사본을 유지하지 말고 재구성해 교체하세요.
활성 Plugin 레지스트리 위의 뷰와 번들 채널 부트스트랩 도우미는 현재 레지스트리/루트에서 다시 계산해야 합니다. 작업 중복 제거 또는 재진입 방지를 위해 한 번의 호출 안에서 단명 맵을 사용하는 것은 괜찮습니다. 하지만 프로세스 메타데이터 캐시가 되어서는 안 됩니다.

Plugin 로딩에서 지속 캐시 계층은 런타임 로딩입니다. 코드 또는 설치된 아티팩트가 실제로 로드될 때 다음과 같은 로더 상태를 재사용할 수 있습니다:

- `PluginLoaderCacheState` 및 호환 활성 런타임 레지스트리
- 같은 런타임 표면을 반복해서 가져오지 않기 위해 사용하는 jiti/모듈 캐시 및 공개 표면 로더 캐시
- 설치된 Plugin 아티팩트용 파일 시스템 캐시
- 경로 정규화 또는 중복 해석을 위한 단명 호출별 맵

이러한 캐시는 데이터 평면 구현 세부 사항입니다. 호출자가 의도적으로 런타임 로딩을 요청하지 않은 한, "이 제공자를 소유한 Plugin은 무엇인가?" 같은 제어 평면 질문에 답해서는 안 됩니다.

다음에 대해 지속 캐시나 벽시계 시간 캐시를 추가하지 마세요:

- 검색 결과
- 직접 매니페스트 레지스트리
- 설치된 Plugin 인덱스에서 재구성된 매니페스트 레지스트리
- 제공자 소유자 조회, 모델 억제, 제공자 정책, 또는 공개 아티팩트 메타데이터
- 변경된 매니페스트, 설치된 인덱스, 또는 로드 경로가 다음 메타데이터 읽기에서 보여야 하는 기타 매니페스트 유래 답변

지속된 설치 Plugin 인덱스에서 매니페스트 메타데이터를 재구성하는 호출자는 필요 시 해당 레지스트리를 재구성합니다. 설치된 인덱스는 지속 소스 평면 상태이며, 숨겨진 프로세스 내 메타데이터 캐시가 아닙니다.

## 레지스트리 모델

로드된 Plugin은 임의의 코어 전역 상태를 직접 변경하지 않습니다. 중앙 Plugin 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다:

- Plugin 레코드(식별자, 소스, 출처, 상태, 진단)
- 도구
- 레거시 훅 및 타입이 지정된 훅
- 채널
- 제공자
- Gateway RPC 핸들러
- HTTP 라우트
- CLI 등록자
- 백그라운드 서비스
- Plugin 소유 명령

그런 다음 코어 기능은 Plugin 모듈과 직접 대화하는 대신 해당 레지스트리에서 읽습니다. 이렇게 하면 로딩이 단방향으로 유지됩니다:

- Plugin 모듈 -> 레지스트리 등록
- 코어 런타임 -> 레지스트리 소비

이 분리는 유지보수성에 중요합니다. 대부분의 코어 표면은 "모든 Plugin 모듈을 특수 처리"하는 것이 아니라 "레지스트리 읽기"라는 하나의 통합 지점만 필요하다는 뜻입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 Plugin은 승인이 해소될 때 반응할 수 있습니다.

바인딩 요청이 승인되거나 거부된 뒤 콜백을 받으려면 `api.onConversationBindingResolved(...)`를 사용하세요:

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
- `binding`: 승인된 요청에 대한 해소된 바인딩
- `request`: 원래 요청 요약, 분리 힌트, 보낸 사람 id, 대화 메타데이터

이 콜백은 알림 전용입니다. 누가 대화를 바인딩할 수 있는지 변경하지 않으며, 코어 승인 처리가 끝난 뒤 실행됩니다.

## 제공자 런타임 훅

제공자 Plugin에는 세 계층이 있습니다:

- 저비용 런타임 전 조회를 위한 **매니페스트 메타데이터**:
  `setup.providers[].envVars`, 사용 중단된 호환성 `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, `channelEnvVars`.
- **구성 시점 훅**: `catalog`(레거시 `discovery`) 및
  `applyConfigDefaults`.
- **런타임 훅**: 인증, 모델 해석, 스트림 래핑, 사고 수준, 재생 정책, 사용량 엔드포인트를 포괄하는 40개 이상의 선택적 훅. 전체 목록은 [훅 순서와 사용법](#hook-order-and-usage)을 참조하세요.

OpenClaw는 여전히 일반 에이전트 루프, 장애 조치, transcript 처리, 도구 정책을 소유합니다. 이러한 훅은 완전한 사용자 지정 추론 전송 없이 제공자별 동작을 구현하기 위한 확장 표면입니다.

제공자에 런타임 Plugin을 로드하지 않고도 일반 인증/상태/모델 선택기 경로가 봐야 하는 env 기반 자격 증명이 있으면 매니페스트 `setup.providers[].envVars`를 사용하세요. 사용 중단된 `providerAuthEnvVars`는 사용 중단 기간 동안 호환성 어댑터가 계속 읽으며, 이를 사용하는 번들되지 않은 Plugin은 매니페스트 진단을 받습니다. 한 제공자 id가 다른 제공자 id의 env vars, 인증 프로필, 구성 기반 인증, API 키 온보딩 선택을 재사용해야 하면 매니페스트 `providerAuthAliases`를 사용하세요. 온보딩/인증 선택 CLI 표면이 제공자의 선택 id, 그룹 레이블, 단순한 단일 플래그 인증 연결을 제공자 런타임 로드 없이 알아야 하면 매니페스트 `providerAuthChoices`를 사용하세요. 온보딩 레이블이나 OAuth 클라이언트 id/클라이언트 시크릿 설정 변수 같은 운영자 대상 힌트에는 제공자 런타임 `envVars`를 유지하세요.

채널에 런타임 채널을 로드하지 않고도 일반 shell-env 대체 경로, 구성/상태 검사, 설정 프롬프트가 봐야 하는 env 기반 인증 또는 설정이 있으면 매니페스트 `channelEnvVars`를 사용하세요.

### 훅 순서와 사용법

모델/제공자 Plugin의 경우 OpenClaw는 대략 다음 순서로 훅을 호출합니다.
"When to use" 열은 빠른 의사결정 가이드입니다.
`ProviderPlugin.capabilities` 및 `suppressBuiltInModel`처럼 OpenClaw가 더 이상 호출하지 않는 호환성 전용 제공자 필드는 의도적으로 여기에 나열하지 않습니다.

| #   | 후크                              | 수행 작업                                                                                                   | 사용 시점                                                                                                                                   |
| --- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 제공자 구성을 `models.providers`에 게시                                | 제공자가 카탈로그 또는 base URL 기본값을 소유함                                                                                                  |
| 2   | `applyConfigDefaults`             | 구성 구체화 중 제공자 소유 전역 구성 기본값 적용                                      | 기본값이 인증 모드, env 또는 제공자 모델 계열 의미론에 따라 달라짐                                                                         |
| --  | _(내장 모델 조회)_         | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도함                                                          | _(Plugin 후크 아님)_                                                                                                                         |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 미리 보기 모델 ID 별칭 정규화                                                     | 제공자가 표준 모델 해석 전에 별칭 정리를 소유함                                                                                 |
| 4   | `normalizeTransport`              | 범용 모델 조립 전에 제공자 계열 `api` / `baseUrl` 정규화                                      | 제공자가 동일한 전송 계열의 사용자 지정 제공자 ID에 대한 전송 정리를 소유함                                                          |
| 5   | `normalizeConfig`                 | 런타임/제공자 해석 전에 `models.providers.<id>` 정규화                                           | 제공자에 Plugin과 함께 있어야 하는 구성 정리가 필요함; 번들된 Google 계열 헬퍼도 지원되는 Google 구성 항목을 보강함   |
| 6   | `applyNativeStreamingUsageCompat` | 네이티브 스트리밍 사용량 호환성 재작성을 구성 제공자에 적용                                               | 제공자에 엔드포인트 기반 네이티브 스트리밍 사용량 메타데이터 수정이 필요함                                                                          |
| 7   | `resolveConfigApiKey`             | 런타임 인증 로드 전에 구성 제공자의 env-marker 인증 해석                                       | 제공자에 제공자 소유 env-marker API 키 해석이 있음; `amazon-bedrock`에도 여기에 내장 AWS env-marker 해석기가 있음                  |
| 8   | `resolveSyntheticAuth`            | 평문을 유지하지 않고 로컬/자체 호스팅 또는 구성 기반 인증 노출                                   | 제공자가 합성/로컬 자격 증명 마커로 작동할 수 있음                                                                                 |
| 9   | `resolveExternalAuthProfiles`     | 제공자 소유 외부 인증 프로필 오버레이; CLI/앱 소유 자격 증명의 기본 `persistence`는 `runtime-only` | 제공자가 복사된 refresh token을 유지하지 않고 외부 인증 자격 증명을 재사용함; 매니페스트에 `contracts.externalAuthProviders` 선언 |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 합성 프로필 플레이스홀더를 env/구성 기반 인증보다 낮은 우선순위로 내림                                      | 제공자가 우선순위를 가져서는 안 되는 합성 플레이스홀더 프로필을 저장함                                                                 |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 제공자 소유 모델 ID에 대한 동기식 폴백                                       | 제공자가 임의의 업스트림 모델 ID를 허용함                                                                                                 |
| 12  | `prepareDynamicModel`             | 비동기 준비 후 `resolveDynamicModel`이 다시 실행됨                                                           | 제공자가 알 수 없는 ID를 해석하기 전에 네트워크 메타데이터가 필요함                                                                                  |
| 13  | `normalizeResolvedModel`          | 임베디드 러너가 해석된 모델을 사용하기 전 최종 재작성                                               | 제공자에 전송 재작성이 필요하지만 여전히 코어 전송을 사용함                                                                             |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 전송 뒤의 벤더 모델에 대한 호환성 플래그 제공                                  | 제공자가 제공자를 인수하지 않고 프록시 전송에서 자체 모델을 인식함                                                       |
| 15  | `normalizeToolSchemas`            | 임베디드 러너가 보기 전에 도구 스키마 정규화                                                    | 제공자에 전송 계열 스키마 정리가 필요함                                                                                                |
| 16  | `inspectToolSchemas`              | 정규화 후 제공자 소유 스키마 진단 노출                                                  | 제공자가 코어에 제공자별 규칙을 가르치지 않고 키워드 경고를 원함                                                                 |
| 17  | `resolveReasoningOutputMode`      | 네이티브 또는 태그형 추론 출력 계약 선택                                                              | 제공자가 네이티브 필드 대신 태그형 추론/최종 출력을 필요로 함                                                                         |
| 18  | `prepareExtraParams`              | 범용 스트림 옵션 래퍼 전에 요청 매개변수 정규화                                              | 제공자가 기본 요청 매개변수 또는 제공자별 매개변수 정리가 필요함                                                                           |
| 19  | `createStreamFn`                  | 일반 스트림 경로를 사용자 지정 전송으로 완전히 대체                                                   | 제공자가 단순 래퍼가 아닌 사용자 지정 wire 프로토콜이 필요함                                                                                     |
| 20  | `wrapStreamFn`                    | 범용 래퍼가 적용된 후의 스트림 래퍼                                                              | 제공자가 사용자 지정 전송 없이 요청 헤더/본문/모델 호환성 래퍼가 필요함                                                          |
| 21  | `resolveTransportTurnState`       | 네이티브 턴별 전송 헤더 또는 메타데이터 첨부                                                           | 제공자가 범용 전송이 제공자 네이티브 턴 식별자를 보내기를 원함                                                                       |
| 22  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 대기 시간 정책 첨부                                                    | 제공자가 범용 WS 전송에서 세션 헤더 또는 폴백 정책을 조정하기를 원함                                                               |
| 23  | `formatApiKey`                    | 인증 프로필 포매터: 저장된 프로필이 런타임 `apiKey` 문자열이 됨                                     | 제공자가 추가 인증 메타데이터를 저장하고 사용자 지정 런타임 토큰 형태가 필요함                                                                    |
| 24  | `refreshOAuth`                    | 사용자 지정 refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh 재정의                                  | 제공자가 공유 `pi-ai` refresher에 맞지 않음                                                                                           |
| 25  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트                                                                  | 제공자에 refresh 실패 후 제공자 소유 인증 복구 안내가 필요함                                                                      |
| 26  | `matchesContextOverflowError`     | 제공자 소유 컨텍스트 창 오버플로 매처                                                                 | 제공자에 범용 휴리스틱이 놓칠 원시 오버플로 오류가 있음                                                                                |
| 27  | `classifyFailoverReason`          | 제공자 소유 장애 조치 사유 분류                                                                  | 제공자가 원시 API/전송 오류를 rate-limit/overload 등으로 매핑할 수 있음                                                                          |
| 28  | `isCacheTtlEligible`              | 프록시/백홀 제공자를 위한 프롬프트 캐시 정책                                                               | 제공자에 프록시별 캐시 TTL 게이팅이 필요함                                                                                                |
| 29  | `buildMissingAuthMessage`         | 범용 인증 누락 복구 메시지 대체                                                      | 제공자에 제공자별 인증 누락 복구 힌트가 필요함                                                                                 |
| 30  | `augmentModelCatalog`             | 검색 후 추가되는 합성/최종 카탈로그 행                                                          | 제공자에 `models list` 및 선택기에 합성 순방향 호환 행이 필요함                                                                     |
| 31  | `resolveThinkingProfile`          | 모델별 `/think` 수준 집합, 표시 레이블, 기본값                                                 | 제공자가 선택된 모델에 대해 사용자 지정 thinking 단계 또는 이진 레이블을 노출함                                                                 |
| 32  | `isBinaryThinking`                | 켜기/끄기 추론 토글 호환성 후크                                                                     | 제공자가 이진 thinking 켜기/끄기만 노출함                                                                                                  |
| 33  | `supportsXHighThinking`           | `xhigh` 추론 지원 호환성 후크                                                                   | 제공자가 일부 모델에만 `xhigh`를 원함                                                                                             |
| 34  | `resolveDefaultThinkingLevel`     | 기본 `/think` 수준 호환성 후크                                                                      | 제공자가 모델 계열의 기본 `/think` 정책을 소유함                                                                                      |
| 35  | `isModernModelRef`                | 라이브 프로필 필터 및 스모크 선택을 위한 최신 모델 매처                                              | 제공자가 라이브/스모크 선호 모델 매칭을 소유함                                                                                             |
| 36  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                       | 제공자가 토큰 교환 또는 단기 요청 자격 증명이 필요함                                                                             |
| 37  | `resolveUsageAuth`                | `/usage` 및 관련 상태 화면에 사용할 사용량/청구 자격 증명 확인                                     | Provider에 사용자 지정 사용량/할당량 토큰 파싱 또는 다른 사용량 자격 증명이 필요함                                                               |
| 38  | `fetchUsageSnapshot`              | 인증이 확인된 후 Provider별 사용량/할당량 스냅샷을 가져오고 정규화                             | Provider에 Provider별 사용량 엔드포인트 또는 페이로드 파서가 필요함                                                                           |
| 39  | `createEmbeddingProvider`         | 메모리/검색을 위한 Provider 소유 임베딩 어댑터 빌드                                                     | 메모리 임베딩 동작은 Provider Plugin에 속함                                                                                    |
| 40  | `buildReplayPolicy`               | Provider의 트랜스크립트 처리를 제어하는 리플레이 정책 반환                                        | Provider에 사용자 지정 트랜스크립트 정책이 필요함(예: 사고 블록 제거)                                                               |
| 41  | `sanitizeReplayHistory`           | 일반 트랜스크립트 정리 후 리플레이 기록 다시 작성                                                        | Provider에 공유 Compaction 헬퍼를 넘어서는 Provider별 리플레이 재작성이 필요함                                                             |
| 42  | `validateReplayTurns`             | 임베디드 러너 전에 최종 리플레이 턴 검증 또는 재구성                                           | Provider 전송 계층에는 일반적인 정리 후 더 엄격한 턴 검증이 필요함                                                                    |
| 43  | `onModelSelected`                 | Provider 소유의 선택 후 부수 효과 실행                                                                 | 모델이 활성화될 때 Provider에 텔레메트리 또는 Provider 소유 상태가 필요함                                                                  |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저 일치한 제공자 Plugin을 확인한 다음, 실제로 모델 ID 또는 전송/구성을 변경하는 항목이 나올 때까지 다른 훅 지원 제공자 Plugin으로 넘어갑니다. 이렇게 하면 호출자가 어떤 번들 Plugin이 재작성을 소유하는지 알 필요 없이 별칭/호환성 제공자 shim이 계속 작동합니다. 지원되는 Google 계열 구성 항목을 재작성하는 제공자 훅이 없으면, 번들 Google 구성 정규화기가 여전히 해당 호환성 정리를 적용합니다.

제공자에 완전히 커스텀 wire protocol 또는 커스텀 요청 실행기가 필요하다면, 이는 다른 종류의 확장입니다. 이 훅은 OpenClaw의 일반 추론 루프에서 계속 실행되는 제공자 동작을 위한 것입니다.

### 제공자 예시

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

### 기본 제공 예시

번들 제공자 Plugin은 위 훅을 조합하여 각 벤더의 카탈로그, 인증, 사고, 재생, 사용량 요구 사항에 맞춥니다. 권위 있는 훅 집합은 `extensions/` 아래 각 Plugin에 있습니다. 이 페이지는 목록을 그대로 복제하기보다 형태를 설명합니다.

<AccordionGroup>
  <Accordion title="패스스루 카탈로그 제공자">
    OpenRouter, Kilocode, Z.AI, xAI는 `catalog`와
    `resolveDynamicModel` / `prepareDynamicModel`을 등록하여 OpenClaw의 정적 카탈로그보다 먼저 업스트림
    모델 ID를 노출할 수 있습니다.
  </Accordion>
  <Accordion title="OAuth 및 사용량 엔드포인트 제공자">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai는
    `prepareRuntimeAuth` 또는 `formatApiKey`를 `resolveUsageAuth` +
    `fetchUsageSnapshot`와 함께 사용하여 토큰 교환과 `/usage` 통합을 소유합니다.
  </Accordion>
  <Accordion title="재생 및 트랜스크립트 정리 계열">
    공유된 이름 있는 계열(`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`)을 통해 제공자는 각 Plugin이
    정리를 다시 구현하는 대신 `buildReplayPolicy`로 트랜스크립트 정책에 참여할 수 있습니다.
  </Accordion>
  <Accordion title="카탈로그 전용 제공자">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`,
    `volcengine`은 `catalog`만 등록하고 공유 추론 루프를 사용합니다.
  </Accordion>
  <Accordion title="Anthropic 전용 스트림 헬퍼">
    베타 헤더, `/fast` / `serviceTier`, `context1m`은 일반 SDK가 아니라
    Anthropic Plugin의 공개 `api.ts` / `contract-api.ts` 경계
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) 안에 있습니다.
  </Accordion>
</AccordionGroup>

## 런타임 헬퍼

Plugin은 `api.runtime`을 통해 선택된 코어 헬퍼에 접근할 수 있습니다. TTS의 경우:

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

- `textToSpeech`는 파일/음성 메모 화면을 위한 일반 코어 TTS 출력 페이로드를 반환합니다.
- 코어 `messages.tts` 구성과 제공자 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플 레이트를 반환합니다. Plugin은 제공자에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 제공자별 선택 사항입니다. 벤더 소유 음성 선택기 또는 설정 흐름에 사용하세요.
- 음성 목록에는 제공자 인식 선택기를 위한 로케일, 성별, 성격 태그 같은 더 풍부한 메타데이터가 포함될 수 있습니다.
- 현재 OpenAI와 ElevenLabs는 전화 통신을 지원합니다. Microsoft는 지원하지 않습니다.

Plugin은 `api.registerSpeechProvider(...)`를 통해 음성 제공자도 등록할 수 있습니다.

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

- TTS 정책, 폴백, 답장 전달은 코어에 유지하세요.
- 벤더 소유 합성 동작에는 음성 제공자를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` 제공자 ID로 정규화됩니다.
- 선호되는 소유권 모델은 회사 중심입니다. OpenClaw가 이러한 기능 계약을 추가함에 따라 하나의 벤더 Plugin이 텍스트, 음성, 이미지, 향후 미디어 제공자를 소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우, Plugin은 일반 키/값 bag 대신 하나의 타입 지정된 미디어 이해 제공자를 등록합니다.

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

- 오케스트레이션, 폴백, 구성, 채널 연결은 코어에 유지하세요.
- 벤더 동작은 제공자 Plugin에 유지하세요.
- 추가 확장은 타입이 지정된 상태로 유지해야 합니다: 새 선택적 메서드, 새 선택적 결과 필드, 새 선택적 기능.
- 비디오 생성도 이미 같은 패턴을 따릅니다:
  - 코어가 기능 계약과 런타임 헬퍼를 소유합니다
  - 벤더 Plugin이 `api.registerVideoGenerationProvider(...)`를 등록합니다
  - 기능/채널 Plugin이 `api.runtime.videoGeneration.*`를 사용합니다

미디어 이해 런타임 헬퍼의 경우, Plugin은 다음을 호출할 수 있습니다.

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
```

오디오 전사의 경우, Plugin은 미디어 이해 런타임 또는 이전 STT 별칭 중 하나를 사용할 수 있습니다.

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
- 코어 미디어 이해 오디오 구성(`tools.media.audio`)과 제공자 폴백 순서를 사용합니다.
- 전사 출력이 생성되지 않으면(예: 건너뛴 입력/지원되지 않는 입력) `{ text: undefined }`를 반환합니다.
- `api.runtime.stt.transcribeAudioFile(...)`은 호환성 별칭으로 남아 있습니다.

Plugin은 `api.runtime.subagent`를 통해 백그라운드 subagent 실행도 시작할 수 있습니다.

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

- `provider`와 `model`은 실행별 선택적 재정의이며, 영구 세션 변경이 아닙니다.
- OpenClaw는 신뢰할 수 있는 호출자에 대해서만 해당 재정의 필드를 존중합니다.
- Plugin 소유 폴백 실행의 경우, 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 옵트인해야 합니다.
- `plugins.entries.<id>.subagent.allowedModels`를 사용하여 신뢰할 수 있는 Plugin을 특정 정식 `provider/model` 대상으로 제한하거나, 임의의 대상을 명시적으로 허용하려면 `"*"`를 사용하세요.
- 신뢰할 수 없는 Plugin subagent 실행도 계속 작동하지만, 재정의 요청은 조용히 폴백되는 대신 거부됩니다.
- Plugin이 만든 subagent 세션에는 생성한 Plugin ID가 태그로 지정됩니다. 폴백 `api.runtime.subagent.deleteSession(...)`은 해당 소유 세션만 삭제할 수 있으며, 임의 세션 삭제에는 여전히 관리자 범위 Gateway 요청이 필요합니다.

웹 검색의 경우, Plugin은 에이전트 도구 연결에 접근하는 대신 공유 런타임 헬퍼를 사용할 수 있습니다.

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

Plugin은 `api.registerWebSearchProvider(...)`를 통해 웹 검색 제공자도 등록할 수 있습니다.

참고:

- 제공자 선택, 자격 증명 확인, 공유 요청 의미 체계는 코어에 유지하세요.
- 벤더별 검색 전송에는 웹 검색 제공자를 사용하세요.
- `api.runtime.webSearch.*`는 에이전트 도구 래퍼에 의존하지 않고 검색 동작이 필요한 기능/채널 Plugin을 위한 선호 공유 표면입니다.

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

- `generate(...)`: 구성된 이미지 생성 제공자 체인을 사용하여 이미지를 생성합니다.
- `listProviders(...)`: 사용 가능한 이미지 생성 제공자와 해당 기능을 나열합니다.

## Gateway HTTP 라우트

Plugin은 `api.registerHttpRoute(...)`로 HTTP 엔드포인트를 노출할 수 있습니다.

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

라우트 필드:

- `path`: Gateway HTTP 서버 아래의 라우트 경로입니다.
- `auth`: 필수입니다. 일반 Gateway 인증을 요구하려면 `"gateway"`를 사용하고, Plugin 관리 인증/Webhook 검증에는 `"plugin"`을 사용하세요.
- `match`: 선택 사항입니다. `"exact"`(기본값) 또는 `"prefix"`입니다.
- `replaceExisting`: 선택 사항입니다. 같은 Plugin이 자체 기존 라우트 등록을 교체할 수 있게 합니다.
- `handler`: 라우트가 요청을 처리했을 때 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 Plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- Plugin 라우트는 `auth`를 명시적으로 선언해야 합니다.
- 정확한 `path + match` 충돌은 `replaceExisting: true`가 아닌 한 거부되며, 하나의 Plugin이 다른 Plugin의 라우트를 대체할 수 없습니다.
- 서로 다른 `auth` 수준을 가진 중첩 라우트는 거부됩니다. `exact`/`prefix` 폴스루 체인은 동일한 auth 수준에서만 유지하세요.
- `auth: "plugin"` 라우트는 운영자 런타임 스코프를 자동으로 받지 **않습니다**. 이는 권한 있는 Gateway 헬퍼 호출이 아니라 Plugin 관리 Webhook/서명 검증을 위한 것입니다.
- `auth: "gateway"` 라우트는 Gateway 요청 런타임 스코프 안에서 실행되지만, 해당 스코프는 의도적으로 보수적입니다.
  - 공유 비밀 bearer auth(`gateway.auth.mode = "token"` / `"password"`)는 호출자가 `x-openclaw-scopes`를 보내더라도 Plugin 라우트 런타임 스코프를 `operator.write`로 고정합니다.
  - 신뢰할 수 있는 ID 포함 HTTP 모드(예: 사설 인그레스의 `trusted-proxy` 또는 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 있을 때만 `x-openclaw-scopes`를 존중합니다.
  - 이러한 ID 포함 Plugin 라우트 요청에 `x-openclaw-scopes`가 없으면 런타임 스코프는 `operator.write`로 폴백합니다.
- 실무 규칙: gateway-auth Plugin 라우트가 암묵적인 관리자 표면이라고 가정하지 마세요. 라우트에 관리자 전용 동작이 필요하다면 ID 포함 auth 모드를 요구하고 명시적인 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK 가져오기 경로

새 Plugin을 작성할 때 단일형 `openclaw/plugin-sdk` 루트 배럴 대신 좁은 SDK 하위 경로를 사용하세요. 핵심 하위 경로:

| 하위 경로                            | 목적                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 등록 기본 요소                             |
| `openclaw/plugin-sdk/channel-core`  | 채널 엔트리/빌드 헬퍼                             |
| `openclaw/plugin-sdk/core`          | 일반 공유 헬퍼와 포괄 계약                        |
| `openclaw/plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마(`OpenClawSchema`) |

채널 Plugin은 `channel-setup`, `setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`, `channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`, `channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`, `channel-targets`, `channel-actions` 같은 좁은 심 계열에서 선택합니다. 승인 동작은 관련 없는 Plugin 필드를 섞기보다 하나의 `approvalCapability` 계약으로 통합해야 합니다. [채널 Plugin](/ko/plugins/sdk-channel-plugins)을 참조하세요.

런타임 및 설정 헬퍼는 일치하는 집중형 `*-runtime` 하위 경로(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`, `channel-activity-runtime` 등) 아래에 있습니다. 넓은 `config-runtime` 호환성 배럴 대신 `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`을 선호하세요.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/config-runtime`, `openclaw/plugin-sdk/infra-runtime`은 오래된 Plugin을 위한 더 이상 사용되지 않는 호환성 심입니다. 새 코드는 더 좁은 일반 기본 요소를 가져와야 합니다.
</Info>

저장소 내부 엔트리 포인트(번들 Plugin 패키지 루트별):

- `index.js` — 번들 Plugin 엔트리
- `api.js` — 헬퍼/타입 배럴
- `runtime-api.js` — 런타임 전용 배럴
- `setup-entry.js` — 설정 Plugin 엔트리

외부 Plugin은 `openclaw/plugin-sdk/*` 하위 경로만 가져와야 합니다. 코어 또는 다른 Plugin에서 다른 Plugin 패키지의 `src/*`를 가져오지 마세요. Facade로 로드되는 엔트리 포인트는 활성 런타임 설정 스냅샷이 있으면 이를 우선 사용하고, 없으면 디스크의 확인된 설정 파일로 폴백합니다.

`image-generation`, `media-understanding`, `speech` 같은 기능별 하위 경로는 번들 Plugin이 현재 사용하기 때문에 존재합니다. 이들은 자동으로 장기 고정 외부 계약이 되는 것은 아닙니다. 의존할 때는 관련 SDK 참조 페이지를 확인하세요.

## 메시지 도구 스키마

Plugin은 반응, 읽음, 설문 같은 비메시지 기본 요소에 대한 채널별 `describeMessageTool(...)` 스키마 기여를 소유해야 합니다. 공유 전송 표현은 provider 네이티브 버튼, 컴포넌트, 블록 또는 카드 필드 대신 일반 `MessagePresentation` 계약을 사용해야 합니다. 계약, 폴백 규칙, provider 매핑, Plugin 작성자 체크리스트는 [메시지 표현](/ko/plugins/message-presentation)을 참조하세요.

전송 가능한 Plugin은 메시지 기능을 통해 렌더링할 수 있는 항목을 선언합니다.

- 시맨틱 표현 블록(`text`, `context`, `divider`, `buttons`, `select`)에는 `presentation`
- 고정 전달 요청에는 `delivery-pin`

코어는 표현을 네이티브로 렌더링할지 텍스트로 저하시킬지 결정합니다. 일반 메시지 도구에서 provider 네이티브 UI 우회 경로를 노출하지 마세요. 레거시 네이티브 스키마용으로 더 이상 사용되지 않는 SDK 헬퍼는 기존 서드파티 Plugin을 위해 계속 내보내지만, 새 Plugin은 사용해서는 안 됩니다.

## 채널 대상 해석

채널 Plugin은 채널별 대상 의미 체계를 소유해야 합니다. 공유 아웃바운드 호스트는 일반적으로 유지하고 provider 규칙에는 메시징 어댑터 표면을 사용하세요.

- `messaging.inferTargetChatType({ to })`는 디렉터리 조회 전에 정규화된 대상을 `direct`, `group`, `channel` 중 무엇으로 취급할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 입력이 디렉터리 검색 대신 id와 유사한 해석으로 바로 건너뛰어야 하는지 코어에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`는 정규화 후 또는 디렉터리 미스 후 코어에 최종 provider 소유 해석이 필요할 때 사용하는 Plugin 폴백입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 해석된 뒤 provider별 세션 라우트 구성을 소유합니다.

권장 분리:

- 피어/그룹 검색 전에 일어나야 하는 범주 결정에는 `inferTargetChatType`을 사용하세요.
- "이를 명시적/네이티브 대상 id로 취급" 검사에는 `looksLikeId`를 사용하세요.
- 광범위한 디렉터리 검색이 아니라 provider별 정규화 폴백에는 `resolveTarget`을 사용하세요.
- 채팅 id, 스레드 id, JID, 핸들, 룸 id 같은 provider 네이티브 id는 일반 SDK 필드가 아니라 `target` 값 또는 provider별 매개변수 안에 유지하세요.

## 설정 기반 디렉터리

설정에서 디렉터리 항목을 파생하는 Plugin은 해당 로직을 Plugin 안에 유지하고 `openclaw/plugin-sdk/directory-runtime`의 공유 헬퍼를 재사용해야 합니다.

채널에 다음과 같은 설정 기반 피어/그룹이 필요할 때 사용하세요.

- allowlist 기반 DM 피어
- 설정된 채널/그룹 맵
- 계정 범위 정적 디렉터리 폴백

`directory-runtime`의 공유 헬퍼는 일반 작업만 처리합니다.

- 쿼리 필터링
- 제한 적용
- 중복 제거/정규화 헬퍼
- `ChannelDirectoryEntry[]` 빌드

채널별 계정 검사와 id 정규화는 Plugin 구현 안에 있어야 합니다.

## Provider 카탈로그

Provider Plugin은 `registerProvider({ catalog: { run(...) { ... } } })`로 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가 `models.providers`에 쓰는 것과 동일한 형태를 반환합니다.

- provider 항목 하나에는 `{ provider }`
- 여러 provider 항목에는 `{ providers }`

Plugin이 provider별 모델 id, 기본 URL 기본값 또는 auth로 보호되는 모델 메타데이터를 소유할 때 `catalog`를 사용하세요.

`catalog.order`는 Plugin의 카탈로그가 OpenClaw의 내장 암묵적 provider에 대해 언제 병합되는지 제어합니다.

- `simple`: 일반 API 키 또는 env 기반 provider
- `profile`: auth 프로필이 있을 때 나타나는 provider
- `paired`: 여러 관련 provider 항목을 합성하는 provider
- `late`: 마지막 패스, 다른 암묵적 provider 이후

나중 provider가 키 충돌에서 우선하므로, Plugin은 동일한 provider id를 가진 내장 provider 항목을 의도적으로 재정의할 수 있습니다.

호환성:

- `discovery`는 레거시 별칭으로 여전히 작동합니다.
- `catalog`와 `discovery`가 모두 등록된 경우 OpenClaw는 `catalog`를 사용합니다.

## 읽기 전용 채널 검사

Plugin이 채널을 등록한다면 `resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)`를 구현하는 것을 선호하세요.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이 완전히 구체화되었다고 가정할 수 있으며 필요한 비밀이 없을 때 빠르게 실패할 수 있습니다.
- `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, doctor/config 복구 흐름 같은 읽기 전용 명령 경로는 설정을 설명하기 위해 런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명용 계정 상태만 반환합니다.
- `enabled`와 `configured`를 보존합니다.
- 관련된 경우 다음과 같은 자격 증명 소스/상태 필드를 포함합니다.
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다. 상태 스타일 명령에는 `tokenStatus: "available"`(및 일치하는 소스 필드)을 반환하는 것으로 충분합니다.
- 자격 증명이 SecretRef를 통해 설정되었지만 현재 명령 경로에서 사용할 수 없는 경우 `configured_unavailable`을 사용하세요.

이를 통해 읽기 전용 명령은 충돌하거나 계정이 설정되지 않은 것으로 잘못 보고하는 대신 "설정되었지만 이 명령 경로에서 사용할 수 없음"을 보고할 수 있습니다.

## 패키지 팩

Plugin 디렉터리는 `openclaw.extensions`가 포함된 `package.json`을 포함할 수 있습니다.

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 엔트리는 Plugin이 됩니다. 팩이 여러 extension을 나열하면 Plugin id는 `name/<fileBase>`가 됩니다.

Plugin이 npm deps를 가져오는 경우 해당 디렉터리에 설치하여 `node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 엔트리는 symlink 해석 후에도 Plugin 디렉터리 안에 있어야 합니다. 패키지 디렉터리를 벗어나는 엔트리는 거부됩니다.

보안 참고: `openclaw plugins install`은 프로젝트 로컬 `npm install --omit=dev --ignore-scripts`로 Plugin 의존성을 설치합니다(라이프사이클 스크립트 없음, 런타임에 dev 의존성 없음). 상속된 전역 npm 설치 설정은 무시합니다. Plugin 의존성 트리는 "순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 설정 전용 모듈을 가리킬 수 있습니다. OpenClaw가 비활성화된 채널 Plugin의 설정 표면을 필요로 하거나, 채널 Plugin이 활성화되었지만 아직 설정되지 않은 경우 전체 Plugin 엔트리 대신 `setupEntry`를 로드합니다. 이렇게 하면 주 Plugin 엔트리가 도구, 훅 또는 기타 런타임 전용 코드도 연결하는 경우 시작과 설정이 더 가벼워집니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은 채널이 이미 설정되어 있더라도 Gateway의 pre-listen 시작 단계 동안 채널 Plugin을 동일한 `setupEntry` 경로로 선택하게 할 수 있습니다.

`setupEntry`가 Gateway가 리스닝을 시작하기 전에 반드시 존재해야 하는 시작 표면을 완전히 포괄할 때만 이것을 사용하세요. 실제로 이는 설정 엔트리가 시작이 의존하는 모든 채널 소유 기능을 등록해야 함을 의미합니다. 예:

- 채널 등록 자체
- Gateway가 리스닝을 시작하기 전에 사용할 수 있어야 하는 모든 HTTP 라우트
- 동일한 기간 동안 존재해야 하는 모든 Gateway 메서드, 도구 또는 서비스

전체 엔트리가 여전히 필요한 시작 기능을 소유한다면 이 플래그를 활성화하지 마세요. Plugin을 기본 동작으로 유지하고 OpenClaw가 시작 중 전체 엔트리를 로드하게 하세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 코어가 참조할 수 있는 설정 전용 계약 표면 헬퍼도 게시할 수 있습니다. 현재 설정 승격 표면은 다음과 같습니다.

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

코어는 전체 Plugin 항목을 로드하지 않고 레거시 단일 계정 채널
구성을 `channels.<id>.accounts.*`로 승격해야 할 때 해당 표면을 사용합니다.
Matrix는 현재 번들 예시입니다. 이름 있는 계정이 이미 존재할 때 인증/부트스트랩 키만
이름 있는 승격 계정으로 옮기며, 항상 `accounts.default`를 만드는 대신
구성된 비표준 기본 계정 키를 보존할 수 있습니다.

이러한 설정 패치 어댑터는 번들 계약 표면 탐색을 지연 상태로 유지합니다. 가져오기
시간은 가볍게 유지되며, 승격 표면은 모듈 가져오기 시 번들 채널 시작에
다시 진입하는 대신 처음 사용할 때만 로드됩니다.

이러한 시작 표면에 Gateway RPC 메서드가 포함되는 경우, 해당 메서드는
Plugin별 접두사에 유지하세요. 코어 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며 Plugin이 더 좁은
범위를 요청하더라도 항상 `operator.admin`으로 확인됩니다.

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

채널 Plugin은 `openclaw.channel`을 통해 설정/탐색 메타데이터를, `openclaw.install`을
통해 설치 힌트를 알릴 수 있습니다. 이렇게 하면 코어 카탈로그에 데이터가 들어가지 않습니다.

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

최소 예시 외에 유용한 `openclaw.channel` 필드:

- `detailLabel`: 더 풍부한 카탈로그/상태 표면을 위한 보조 레이블
- `docsLabel`: 문서 링크의 링크 텍스트 재정의
- `preferOver`: 이 카탈로그 항목이 우선해야 하는 더 낮은 우선순위의 Plugin/채널 ID
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 문구 제어
- `markdownCapable`: 아웃바운드 서식 결정에서 채널을 markdown 지원으로 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 설정/구성 선택기에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭이며, `exposure`를 선호하세요
- `quickstartAllowFrom`: 채널을 표준 빠른 시작 `allowFrom` 흐름에 참여시킴
- `forceAccountBinding`: 계정이 하나만 있어도 명시적 계정 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: 공지 대상을 확인할 때 세션 조회 선호

OpenClaw는 **외부 채널 카탈로그**(예: MPM 레지스트리 내보내기)도 병합할 수 있습니다.
다음 중 하나에 JSON 파일을 두세요.

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)가
하나 이상의 JSON 파일을 가리키도록 하세요(쉼표/세미콜론/`PATH` 구분).
각 파일은 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`를
포함해야 합니다. 파서는 `"entries"` 키의 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

생성된 채널 카탈로그 항목과 공급자 설치 카탈로그 항목은 원시 `openclaw.install`
블록 옆에 정규화된 설치 소스 사실을 노출합니다. 정규화된 사실은 npm 사양이 정확한
버전인지 부동 선택자인지, 예상 무결성 메타데이터가 있는지, 로컬 소스 경로도 사용
가능한지를 식별합니다. 카탈로그/패키지 ID를 알고 있으면, 정규화된 사실은 파싱된
npm 패키지 이름이 해당 ID와 달라질 때 경고합니다. 또한 `defaultChoice`가 유효하지
않거나 사용할 수 없는 소스를 가리킬 때, 그리고 유효한 npm 소스 없이 npm 무결성
메타데이터가 있을 때도 경고합니다. 소비자는 `installSource`를 추가적인 선택 필드로
취급해야 하므로 수작업 항목과 카탈로그 shim이 이를 합성할 필요는 없습니다.
이를 통해 온보딩과 진단은 Plugin 런타임을 가져오지 않고도 소스 플레인 상태를
설명할 수 있습니다.

공식 외부 npm 항목은 정확한 `npmSpec`과 `expectedIntegrity`를 선호해야 합니다.
Bare 패키지 이름과 dist-tag도 호환성을 위해 계속 동작하지만, 소스 플레인 경고를
표시하므로 카탈로그는 기존 Plugin을 깨뜨리지 않고 고정되고 무결성 검증된 설치로
이동할 수 있습니다. 온보딩이 로컬 카탈로그 경로에서 설치할 때는 가능한 경우
`source: "path"`와 워크스페이스 상대 `sourcePath`를 포함하는 관리형 Plugin
Plugin 인덱스 항목을 기록합니다. 절대 운영 로드 경로는 `plugins.load.paths`에
유지되며, 설치 기록은 로컬 워크스테이션 경로가 장기 구성에 중복되는 것을 피합니다.
이렇게 하면 로컬 개발 설치가 소스 플레인 진단에 표시되면서도 두 번째 원시 파일시스템
경로 공개 표면을 추가하지 않습니다. 지속 저장되는 `plugins/installs.json` Plugin
인덱스는 설치 소스의 진실 원천이며, Plugin 런타임 모듈을 로드하지 않고도 새로 고칠
수 있습니다. 해당 `installRecords` 맵은 Plugin 매니페스트가 없거나 유효하지 않은
경우에도 지속되며, `plugins` 배열은 다시 빌드할 수 있는 매니페스트 뷰입니다.

## 컨텍스트 엔진 Plugin

컨텍스트 엔진 Plugin은 수집, 조립, Compaction을 위한 세션 컨텍스트 오케스트레이션을
소유합니다. Plugin에서 `api.registerContextEngine(id, factory)`로 등록한 다음
`plugins.slots.contextEngine`으로 활성 엔진을 선택하세요.

Plugin이 메모리 검색이나 hook을 추가하는 수준을 넘어 기본 컨텍스트 파이프라인을
대체하거나 확장해야 할 때 사용하세요.

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

팩터리 `ctx`는 구성 시점 초기화를 위한 선택적 `config`, `agentDir`, `workspaceDir`
값을 노출합니다.

엔진이 Compaction 알고리즘을 소유하지 **않는** 경우, `compact()`를 구현한 상태로 두고
명시적으로 위임하세요.

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

Plugin이 현재 API에 맞지 않는 동작이 필요할 때, 비공개 내부 접근으로 Plugin 시스템을
우회하지 마세요. 누락된 기능을 추가하세요.

권장 순서:

1. 코어 계약 정의
   코어가 소유해야 하는 공유 동작을 결정합니다: 정책, fallback, 구성 병합,
   생명주기, 채널 대상 의미 체계, 런타임 헬퍼 형태.
2. 타입이 지정된 Plugin 등록/런타임 표면 추가
   `OpenClawPluginApi` 및/또는 `api.runtime`을 가장 작지만 유용한 타입 지정 기능
   표면으로 확장합니다.
3. 코어와 채널/기능 소비자 연결
   채널과 기능 Plugin은 공급업체 구현을 직접 가져오지 말고, 코어를 통해 새 기능을
   소비해야 합니다.
4. 공급업체 구현 등록
   그런 다음 공급업체 Plugin이 해당 기능에 대해 백엔드를 등록합니다.
5. 계약 범위 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이것이 OpenClaw가 하나의 공급자 세계관에 하드코딩되지 않으면서도 의견 있는 구조를
유지하는 방식입니다. 구체적인 파일 체크리스트와 실제 예시는
[기능 Cookbook](/ko/plugins/architecture)을 참조하세요.

### 기능 체크리스트

새 기능을 추가할 때 구현은 보통 다음 표면을 함께 다뤄야 합니다.

- `src/<capability>/types.ts`의 코어 계약 타입
- `src/<capability>/runtime.ts`의 코어 runner/런타임 헬퍼
- `src/plugins/types.ts`의 Plugin API 등록 표면
- `src/plugins/registry.ts`의 Plugin 레지스트리 배선
- 기능/채널 Plugin이 이를 소비해야 할 때 `src/plugins/runtime/*`의 Plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 헬퍼
- `src/plugins/contracts/registry.ts`의 소유권/계약 assertion
- `docs/`의 운영자/Plugin 문서

이러한 표면 중 하나가 없다면, 보통 해당 기능이 아직 완전히 통합되지 않았다는 신호입니다.

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

- 코어는 기능 계약과 오케스트레이션을 소유합니다
- 공급업체 Plugin은 공급업체 구현을 소유합니다
- 기능/채널 Plugin은 런타임 헬퍼를 소비합니다
- 계약 테스트는 소유권을 명시적으로 유지합니다

## 관련 항목

- [Plugin 아키텍처](/ko/plugins/architecture) — 공개 기능 모델과 형태
- [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
