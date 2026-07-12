---
read_when:
    - 제공자 런타임 훅, 채널 수명 주기 또는 패키지 팩 구현하기
    - Plugin 로드 순서 또는 레지스트리 상태 디버깅
    - 새 Plugin 기능 또는 컨텍스트 엔진 Plugin 추가하기
summary: 'Plugin 아키텍처 내부 구조: 로드 파이프라인, 레지스트리, 런타임 훅, HTTP 라우트 및 참조 표'
title: Plugin 아키텍처 내부 구조
x-i18n:
    generated_at: "2026-07-12T15:27:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fe5b7f34c638da40b43c24da9425ecdeb9ce7381e233b3ebdd5cc95276ba04f
    source_path: plugins/architecture-internals.md
    workflow: 16
---

공개 기능 모델, Plugin 형태, 소유권/실행 계약에 대해서는 [Plugin 아키텍처](/ko/plugins/architecture)를 참조하십시오. 이 페이지에서는 로드 파이프라인, 레지스트리, 런타임 훅, Gateway HTTP 경로, 가져오기 경로, 스키마 테이블 등의 내부 메커니즘을 다룹니다.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음 작업을 수행합니다.

1. Plugin 루트 후보를 검색합니다.
2. 네이티브 또는 호환 번들 매니페스트와 패키지 메타데이터를 읽습니다.
3. 안전하지 않은 후보를 거부합니다.
4. Plugin 구성(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)을 정규화합니다.
5. 각 후보의 활성화 여부를 결정합니다.
6. 활성화된 네이티브 모듈을 로드합니다. 빌드된 번들 모듈에는 네이티브 로더를 사용하고,
   서드 파티 로컬 소스 TypeScript에는 비상용 Jiti 폴백을 사용합니다.
7. 네이티브 `register(api)` 훅을 호출하고 등록 내용을 Plugin 레지스트리에 수집합니다.
8. 명령 및 런타임 표면에 레지스트리를 노출합니다.

<Note>
`activate`는 `register`의 레거시 별칭입니다. 로더는 둘 중 존재하는 항목(`def.register ?? def.activate`)을 확인하여 같은 지점에서 호출합니다. 모든 번들 Plugin은 `register`를 사용하므로 새 Plugin에는 `register`를 사용하십시오.
</Note>

안전 게이트는 런타임 실행 **전**에 작동합니다. 다음과 같은 경우 검색 과정에서 후보를 차단합니다.

- 확인된 진입점이 Plugin 루트를 벗어나는 경우
- 해당 경로 또는 루트 디렉터리에 모든 사용자의 쓰기 권한이 있는 경우
- 번들에 포함되지 않은 Plugin의 경로 소유권이 현재 uid 또는 root와 일치하지 않는 경우

모든 사용자의 쓰기 권한이 있는 번들 디렉터리는 게이트에서 다시 확인하기 전에
먼저 제자리에서 `chmod` 복구를 시도합니다(npm/전역 설치 시 패키지 디렉터리가
`0777`로 제공될 수 있습니다). 번들 출처에는 소유권 검사를 전혀 적용하지 않습니다.

차단된 후보도 Plugin ID를 알 수 있는 경우 방출되는 진단에 해당 ID를 포함합니다.
여기에는 그 외의 이유로 거부된 디렉터리 내부 매니페스트에서 확인된 ID도 포함됩니다.
따라서 해당 ID를 참조하는 구성에는 무관한 "알 수 없는 Plugin" 오류 대신
경로 안전 경고와 연결된 차단된 Plugin이 표시됩니다.

### 매니페스트 우선 동작

매니페스트는 컨트롤 플레인의 단일 진실 공급원입니다. OpenClaw는 매니페스트를 사용하여 다음을 수행합니다.

- Plugin을 식별합니다.
- 선언된 채널, Skills, 구성 스키마 또는 번들 기능을 검색합니다.
- `plugins.entries.<id>.config`를 검증합니다.
- Control UI 레이블 및 자리 표시자를 보강합니다.
- 설치 및 카탈로그 메타데이터를 표시합니다.
- Plugin 런타임을 로드하지 않고 가벼운 활성화 및 설정 설명자를 유지합니다.

네이티브 Plugin의 경우 런타임 모듈은 데이터 플레인 부분입니다. 이 모듈은
훅, 도구, 명령 또는 제공자 흐름과 같은 실제 동작을 등록합니다.

선택적인 매니페스트 `activation` 및 `setup` 블록은 컨트롤 플레인에 유지됩니다.
이들은 활성화 계획 및 설정 검색을 위한 메타데이터 전용 설명자이며,
런타임 등록, `register(...)` 또는 `setupEntry`를 대체하지 않습니다.
실시간 활성화 소비자는 매니페스트의 명령, 채널 및 제공자 힌트를 사용하여
더 광범위한 레지스트리를 구체화하기 전에 Plugin 로딩 범위를 좁힙니다.

- CLI 로딩은 요청된 기본 명령을 소유한 Plugin으로 범위를 좁힙니다.
- 채널 설정 및 Plugin 확인은 요청된 채널 ID를 소유한 Plugin으로 범위를
  좁힙니다.
- 명시적 제공자 설정 및 런타임 확인은 요청된 제공자 ID를 소유한 Plugin으로
  범위를 좁힙니다.
- Gateway 시작 계획은 명시적 시작 가져오기에 `activation.onStartup`을
  사용합니다. 시작 메타데이터가 없는 Plugin은 더 좁은 활성화 트리거를
  통해서만 로드됩니다.

활성화 플래너는 기존 호출자를 위한 ID 전용 API와 진단을 위한 계획 API를
모두 제공합니다. 계획 항목은 Plugin이 선택된 이유를 보고하며,
명시적 `activation.*` 힌트와 매니페스트 소유권 폴백을 구분합니다.

| 이유(`activation.*` 힌트에서 제공) | 이유(매니페스트 소유권에서 제공)                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `activation-agent-harness-hint`      | —                                                                                            |
| `activation-capability-hint`         | —                                                                                            |
| `activation-channel-hint`            | `manifest-channel-owner` (`channels`)                                                        |
| `activation-command-hint`            | `manifest-command-alias` (`commandAliases`)                                                  |
| `activation-provider-hint`           | `manifest-provider-owner` (`providers`), `manifest-setup-provider-owner` (`setup.providers`) |
| `activation-route-hint`              | —                                                                                            |
| —(훅 트리거에는 힌트 변형이 없음)    | `manifest-hook-owner` (`hooks`), `manifest-tool-contract` (`contracts.tools`)                |

이러한 이유 구분이 호환성 경계입니다. 기존 Plugin 메타데이터는 계속 작동하며,
새 코드는 런타임 로딩 의미 체계를 변경하지 않고 광범위한 힌트 또는 폴백 동작을
감지할 수 있습니다.

광범위한 `all` 범위를 요청하는 요청 시점 런타임 사전 로드도 구성, 시작 계획,
구성된 채널, 슬롯 및 자동 활성화 규칙으로부터 명시적인 유효 Plugin ID 집합을
계속 도출합니다(`src/plugins/effective-plugin-ids.ts`의
`resolveEffectivePluginIds`). 도출된 집합이 비어 있으면 OpenClaw는 검색 가능한
모든 Plugin으로 범위를 넓히지 않고 빈 범위를 유지합니다.

설정 검색은 `setup-api`로 폴백하기 전에 `setup.providers` 및
`setup.cliBackends`와 같이 설명자가 소유한 ID를 우선 사용하여 후보 Plugin의
범위를 좁힙니다. 이 폴백은 설정 시점 런타임 훅이 여전히 필요한 Plugin에
사용됩니다. 제공자 설정 목록은 제공자 런타임을 로드하지 않고 매니페스트
`providerAuthChoices`, 설명자에서 도출한 설정 선택 사항 및 설치 카탈로그
메타데이터를 사용합니다. 명시적인 `setup.requiresRuntime: false`는 설명자
전용 중단점입니다. `requiresRuntime`을 생략하면 호환성을 위해 레거시
setup-api 폴백을 유지합니다. 검색된 Plugin이 둘 이상 동일한 정규화된 설정
제공자 또는 CLI 백엔드 ID의 소유권을 주장하면 설정 조회는 검색 순서에
의존하지 않고 모호한 소유자를 거부합니다. 설정 런타임이 실행되는 경우
레지스트리 진단은 레거시 Plugin을 차단하지 않으면서 `setup.providers` /
`setup.cliBackends`와 setup-api에서 실제로 등록한 제공자 또는 CLI 백엔드
간의 불일치를 보고합니다.

### Plugin 캐시 경계

OpenClaw는 Plugin 검색 결과나 직접적인 매니페스트 레지스트리 데이터를
실제 시간 기준 기간을 적용하여 캐시하지 않습니다. 설치, 매니페스트 편집 및
로드 경로 변경 사항은 다음 명시적 메타데이터 읽기 또는 스냅샷 재구축 시
표시되어야 합니다. 매니페스트 파일 파서는 열린 매니페스트 경로와 장치/inode,
크기 및 mtime/ctime을 키로 사용하는 제한된 파일 서명 캐시를 유지합니다.
이 캐시는 변경되지 않은 바이트의 재구문 분석만 방지하며 검색, 레지스트리,
소유자 또는 정책 응답을 캐시해서는 안 됩니다.

안전한 메타데이터 고속 경로는 숨겨진 캐시가 아니라 명시적 객체 소유권입니다.
Gateway 시작 핫패스는 현재 `PluginMetadataSnapshot`, 도출된
`PluginLookUpTable` 또는 명시적 매니페스트 레지스트리를 호출 체인을 통해
전달해야 합니다. 구성 검증, 시작 시 자동 활성화, Plugin 부트스트랩 및 제공자
선택은 해당 객체가 현재 구성과 Plugin 인벤토리를 나타내는 동안 이를 재사용할
수 있습니다. 특정 설정 경로에 명시적 매니페스트 레지스트리가 전달되지 않는 한
설정 조회는 요청 시 매니페스트 메타데이터를 계속 재구성합니다. 숨겨진 조회
캐시를 추가하는 대신 이를 콜드패스 폴백으로 유지하십시오. 입력이 변경되면
스냅샷을 변경하거나 이전 사본을 유지하지 말고 재구축하여 교체하십시오.
활성 Plugin 레지스트리에 대한 뷰와 번들 채널 부트스트랩 도우미는 현재
레지스트리/루트에서 다시 계산해야 합니다. 한 번의 호출 내에서 작업 중복을
제거하거나 재진입을 방지하기 위한 수명이 짧은 맵은 사용할 수 있지만,
프로세스 메타데이터 캐시가 되어서는 안 됩니다.

Plugin 로딩의 영구 캐시 계층은 런타임 로딩입니다. 코드 또는 설치된 아티팩트가
실제로 로드되는 경우 다음과 같은 로더 상태를 재사용할 수 있습니다.

- `PluginLoaderCacheState` 및 호환되는 활성 런타임 레지스트리
- 동일한 런타임 표면을 반복해서 가져오지 않기 위해 사용하는 jiti/모듈 캐시 및
  공개 표면 로더 캐시
- 설치된 Plugin 아티팩트용 파일 시스템 캐시
- 경로 정규화 또는 중복 확인을 위한 호출별 수명이 짧은 맵

이러한 캐시는 데이터 플레인의 구현 세부 사항입니다. 호출자가 의도적으로 런타임
로딩을 요청한 경우가 아니라면 "어떤 Plugin이 이 제공자를 소유하는가?"와 같은
컨트롤 플레인 질문에 답해서는 안 됩니다.

다음 항목에는 영구 캐시 또는 실제 시간 기준 캐시를 추가하지 마십시오.

- 검색 결과
- 직접적인 매니페스트 레지스트리
- 설치된 Plugin 인덱스에서 재구성한 매니페스트 레지스트리
- 제공자 소유자 조회, 모델 억제, 제공자 정책 또는 공개 아티팩트 메타데이터
- 매니페스트, 설치된 인덱스 또는 로드 경로 변경 사항이 다음 메타데이터 읽기 시
  표시되어야 하는 기타 모든 매니페스트 파생 응답

저장된 설치 Plugin 인덱스에서 매니페스트 메타데이터를 재구축하는 호출자는
요청 시 해당 레지스트리를 재구성합니다. 설치된 인덱스는 영구적인 소스 플레인
상태이며 숨겨진 프로세스 내 메타데이터 캐시가 아닙니다.

## 레지스트리 모델

로드된 Plugin은 임의의 코어 전역 상태를 직접 변경하지 않습니다. 대신 중앙
Plugin 레지스트리(`src/plugins/registry-types.ts`의 `PluginRegistry`)에
등록합니다. 이 레지스트리는 Plugin 레코드(신원, 소스, 출처, 상태, 진단)와
모든 기능에 대한 배열을 추적합니다. 여기에는 도구, 레거시 훅과 형식화된 훅,
채널, 제공자, Gateway RPC 처리기, HTTP 경로, CLI 등록자, 백그라운드 서비스,
Plugin 소유 명령 및 수십 가지 형식화된 제공자 계열(음성, 임베딩, 이미지/비디오/
음악 생성, 웹 가져오기/검색, 에이전트 하네스, 세션 작업 등)이 포함됩니다.

그런 다음 코어 기능은 Plugin 모듈과 직접 통신하는 대신 해당 레지스트리에서
정보를 읽습니다. 이로써 로딩이 단방향으로 유지됩니다.

- Plugin 모듈 -> 레지스트리 등록
- 코어 런타임 -> 레지스트리 사용

이러한 분리는 유지 관리에 중요합니다. 대부분의 코어 표면에는 "모든 Plugin
모듈을 특별 처리"하는 것이 아니라 "레지스트리 읽기"라는 하나의 통합 지점만
필요하기 때문입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 Plugin은 승인이 처리될 때 반응할 수 있습니다.

바인딩 요청이 승인되거나 거부된 후 콜백을 받으려면
`api.onConversationBindingResolved(...)`를 사용하십시오.

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 이제 이 Plugin과 대화에 대한 바인딩이 존재합니다.
        console.log(event.binding?.conversationId);
        return;
      }

      // 요청이 거부되었습니다. 로컬의 모든 보류 상태를 지웁니다.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드는 다음과 같습니다.

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"` 또는 `"deny"`
- `binding`: 승인된 요청에 대해 확인된 바인딩
- `request`: 원래 요청 요약, 분리 힌트, 발신자 ID 및 대화 메타데이터

이 콜백은 알림 전용입니다. 대화를 바인딩할 수 있는 주체를 변경하지 않으며,
코어 승인 처리가 완료된 후 실행됩니다.

## 제공자 런타임 훅

제공자 Plugin에는 다음 세 계층이 있습니다.

- 저비용 사전 런타임 조회를 위한 **매니페스트 메타데이터**:
  `setup.providers[].envVars`, 사용 중단된 호환성 항목 `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, `channelEnvVars`.
- **구성 시점 훅**: `catalog`(레거시 `discovery`) 및
  `applyConfigDefaults`.
- **런타임 훅**: 인증, 모델 확인, 스트림 래핑, 사고 수준, 재생 정책 및 사용량
  엔드포인트를 포괄하는 40개 이상의 선택적 훅입니다. [훅 순서 및 사용법](#hook-order-and-usage)을
  참조하십시오.

OpenClaw는 일반 에이전트 루프, 장애 조치, 트랜스크립트 처리 및 도구 정책을
계속 소유합니다. 이러한 훅은 완전한 사용자 지정 추론 전송 계층 없이
제공자별 동작을 구현하기 위한 확장 표면입니다.

일반 인증/상태/모델 선택기 경로에서 Plugin 런타임을 로드하지 않고도 확인해야 하는 환경 변수 기반 자격 증명이 제공자에 있는 경우 매니페스트 `setup.providers[].envVars`를 사용하십시오. 지원 중단 기간에는 호환성 어댑터가 지원 중단된 `providerAuthEnvVars`를 계속 읽으며, 이를 사용하는 번들 외부 Plugin에는 매니페스트 진단이 표시됩니다. 한 제공자 ID가 다른 제공자 ID의 환경 변수, 인증 프로필, 구성 기반 인증 및 API 키 온보딩 선택 항목을 재사용해야 하는 경우 매니페스트 `providerAuthAliases`를 사용하십시오. 온보딩/인증 선택 CLI 화면에서 제공자 런타임을 로드하지 않고도 제공자의 선택 항목 ID, 그룹 레이블 및 단일 플래그 기반의 간단한 인증 연결을 알아야 하는 경우 매니페스트 `providerAuthChoices`를 사용하십시오. 온보딩 레이블이나 OAuth 클라이언트 ID/클라이언트 보안 비밀 설정 변수처럼 운영자에게 표시되는 힌트에는 제공자 런타임 `envVars`를 계속 사용하십시오.

일반 셸 환경 변수 폴백, 구성/상태 검사 또는 설정 프롬프트에서 채널 런타임을 로드하지 않고도 확인해야 하는 환경 변수 기반 인증이나 설정이 채널에 있는 경우 매니페스트 `channelEnvVars`를 사용하십시오.

### 훅 순서 및 사용법

모델/제공자 Plugin의 경우 OpenClaw는 대략 다음 순서로 훅을 호출합니다.
"When to use" 열은 빠른 판단을 위한 안내입니다.
`ProviderPlugin.capabilities` 및 `suppressBuiltInModel`처럼 OpenClaw에서 더 이상 호출하지 않고 호환성 용도로만 유지되는 제공자 필드는 의도적으로 여기에 나열하지 않았습니다.

| Hook                              | 수행하는 작업                                                                                                   | 사용 시점                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `catalog`                         | `models.json` 생성 중에 제공자 구성을 `models.providers`에 게시합니다                                | 제공자가 카탈로그 또는 기본 URL 기본값을 소유하는 경우                                                                                                  |
| `applyConfigDefaults`             | 구성 구체화 중에 제공자 소유의 전역 구성 기본값을 적용합니다                                      | 기본값이 인증 모드, 환경 변수 또는 제공자 모델 계열 의미 체계에 따라 달라지는 경우                                                                         |
| _(기본 제공 모델 조회)_         | OpenClaw는 먼저 일반 레지스트리/카탈로그 경로를 시도합니다                                                          | _(Plugin 훅이 아님)_                                                                                                                         |
| `normalizeModelId`                | 조회 전에 레거시 또는 미리 보기 모델 ID 별칭을 정규화합니다                                                     | 제공자가 정식 모델 결정 전에 별칭 정리를 소유하는 경우                                                                                 |
| `normalizeTransport`              | 일반 모델 조립 전에 제공자 계열의 `api` / `baseUrl`을 정규화합니다                                      | 제공자가 동일한 전송 계열에 있는 사용자 지정 제공자 ID의 전송 정리를 소유하는 경우                                                          |
| `normalizeConfig`                 | 런타임/제공자 결정 전에 `models.providers.<id>`를 정규화합니다                                           | 제공자에게 Plugin에 포함되어야 하는 구성 정리가 필요한 경우. 번들 Google 계열 도우미도 지원되는 Google 구성 항목을 보완합니다   |
| `applyNativeStreamingUsageCompat` | 구성 제공자에 네이티브 스트리밍 사용량 호환성 재작성을 적용합니다                                               | 제공자에게 엔드포인트 기반 네이티브 스트리밍 사용량 메타데이터 수정이 필요한 경우                                                                          |
| `resolveConfigApiKey`             | 런타임 인증을 로드하기 전에 구성 제공자의 환경 변수 마커 인증을 결정합니다                                       | 제공자가 자체 환경 변수 마커 API 키 결정 훅을 노출하는 경우                                                                                |
| `resolveSyntheticAuth`            | 평문을 저장하지 않고 로컬/자체 호스팅 또는 구성 기반 인증을 노출합니다                                   | 제공자가 합성/로컬 자격 증명 마커로 작동할 수 있는 경우                                                                                 |
| `resolveExternalAuthProfiles`     | 제공자 소유의 외부 인증 프로필을 오버레이합니다. CLI/앱 소유 자격 증명에 대한 기본 `persistence`는 `runtime-only`입니다 | 제공자가 복사된 갱신 토큰을 저장하지 않고 외부 인증 자격 증명을 재사용하는 경우. 매니페스트에 `contracts.externalAuthProviders`를 선언하십시오 |
| `shouldDeferSyntheticProfileAuth` | 저장된 합성 프로필 자리표시자의 우선순위를 환경 변수/구성 기반 인증보다 낮춥니다                                      | 제공자가 우선순위를 차지해서는 안 되는 합성 자리표시자 프로필을 저장하는 경우                                                                 |
| `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 제공자 소유 모델 ID를 위한 동기식 폴백입니다                                       | 제공자가 임의의 업스트림 모델 ID를 허용하는 경우                                                                                                 |
| `prepareDynamicModel`             | 비동기 준비 작업 후 `resolveDynamicModel`이 다시 실행됩니다                                                           | 제공자가 알 수 없는 ID를 결정하기 전에 네트워크 메타데이터가 필요한 경우                                                                                  |
| `normalizeResolvedModel`          | 내장 러너가 결정된 모델을 사용하기 전 최종 재작성입니다                                               | 제공자에게 전송 재작성이 필요하지만 여전히 코어 전송을 사용하는 경우                                                                             |
| `normalizeToolSchemas`            | 내장 러너가 도구 스키마를 확인하기 전에 정규화합니다                                                    | 제공자에게 전송 계열의 스키마 정리가 필요한 경우                                                                                                |
| `inspectToolSchemas`              | 정규화 후 제공자 소유의 스키마 진단을 노출합니다                                                  | 코어에 제공자별 규칙을 추가하지 않고 제공자가 키워드 경고를 제공하려는 경우                                                                 |
| `resolveReasoningOutputMode`      | 네이티브 또는 태그 기반 추론 출력 계약을 선택합니다                                                              | 제공자에게 네이티브 필드 대신 태그 기반 추론/최종 출력이 필요한 경우                                                                         |
| `prepareExtraParams`              | 일반 스트림 옵션 래퍼 적용 전 요청 매개변수를 정규화합니다                                              | 제공자에게 기본 요청 매개변수 또는 제공자별 매개변수 정리가 필요한 경우                                                                           |
| `createStreamFn`                  | 일반 스트림 경로를 사용자 지정 전송으로 완전히 대체합니다                                                   | 제공자에게 단순한 래퍼가 아닌 사용자 지정 유선 프로토콜이 필요한 경우                                                                                     |
| `wrapStreamFn`                    | 일반 래퍼가 적용된 후의 스트림 래퍼입니다                                                              | 사용자 지정 전송 없이 제공자에게 요청 헤더/본문/모델 호환성 래퍼가 필요한 경우                                                          |
| `resolveTransportTurnState`       | 턴별 네이티브 전송 헤더 또는 메타데이터를 연결합니다                                                           | 제공자가 일반 전송에서 제공자 네이티브 턴 ID를 전송하려는 경우                                                                       |
| `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 재사용 대기 정책을 연결합니다                                                    | 제공자가 일반 WS 전송에서 세션 헤더 또는 폴백 정책을 조정하려는 경우                                                               |
| `formatApiKey`                    | 인증 프로필 포매터: 저장된 프로필을 런타임 `apiKey` 문자열로 변환합니다                                     | 제공자가 추가 인증 메타데이터를 저장하며 사용자 지정 런타임 토큰 형식이 필요한 경우                                                                    |
| `refreshOAuth`                    | 사용자 지정 갱신 엔드포인트 또는 갱신 실패 정책을 위한 OAuth 갱신 재정의입니다                                  | 제공자가 공유 OpenClaw 갱신기에 맞지 않는 경우                                                                                          |
| `buildAuthDoctorHint`             | OAuth 갱신 실패 시 추가되는 복구 힌트입니다                                                                  | 제공자에게 갱신 실패 후 제공자 소유의 인증 복구 지침이 필요한 경우                                                                      |
| `matchesContextOverflowError`     | 제공자 소유의 컨텍스트 창 오버플로 일치 검사기입니다                                                                 | 일반 휴리스틱으로 감지하지 못하는 원시 오버플로 오류가 제공자에 있는 경우                                                                                |
| `classifyFailoverReason`          | 제공자 소유의 장애 조치 사유 분류입니다                                                                  | 제공자가 원시 API/전송 오류를 속도 제한/과부하 등으로 매핑할 수 있는 경우                                                                          |
| `isCacheTtlEligible`              | 프록시/백홀 제공자를 위한 프롬프트 캐시 정책입니다                                                               | 제공자에게 프록시별 캐시 TTL 제한이 필요한 경우                                                                                                |
| `buildMissingAuthMessage`         | 일반적인 인증 누락 복구 메시지를 대체합니다                                                      | 제공자에게 제공자별 인증 누락 복구 힌트가 필요한 경우                                                                                 |
| `augmentModelCatalog`             | 검색 후 추가되는 합성/최종 카탈로그 행입니다(지원 중단됨, 아래 참조)                                  | 제공자에게 `models list`와 선택기의 합성 순방향 호환성 행이 필요한 경우                                                                     |
| `resolveThinkingProfile`          | 모델별 `/think` 수준 집합, 표시 레이블 및 기본값입니다                                                 | 제공자가 선택된 모델에 대해 사용자 지정 사고 단계 또는 이진 레이블을 노출하는 경우                                                                 |
| `isBinaryThinking`                | 추론 켜기/끄기 토글 호환성 훅입니다                                                                     | 제공자가 이진 사고 켜기/끄기만 노출하는 경우                                                                                                  |
| `supportsXHighThinking`           | `xhigh` 추론 지원 호환성 훅입니다                                                                   | 제공자가 일부 모델에서만 `xhigh`를 제공하려는 경우                                                                                             |
| `resolveDefaultThinkingLevel`     | 기본 `/think` 수준 호환성 훅입니다                                                                      | 제공자가 모델 계열의 기본 `/think` 정책을 소유하는 경우                                                                                      |
| `isModernModelRef`                | 라이브 프로필 필터 및 스모크 선택을 위한 최신 모델 일치 검사기입니다                                              | 제공자가 라이브/스모크 선호 모델 일치를 소유하는 경우                                                                                             |
| `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환합니다                       | 제공자에게 토큰 교환 또는 수명이 짧은 요청 자격 증명이 필요한 경우                                                                             |
| `resolveUsageAuth`                | `/usage` 및 관련 상태 화면의 사용량/결제 자격 증명을 결정합니다                                     | 제공자에게 사용자 지정 사용량/할당량 토큰 구문 분석 또는 별도의 사용량 자격 증명이 필요한 경우                                                               |
| `fetchUsageSnapshot`              | 인증이 결정된 후 제공자별 사용량/할당량 스냅샷을 가져와 정규화합니다                             | 제공자에게 제공자별 사용량 엔드포인트 또는 페이로드 파서가 필요한 경우                                                                           |
| `createEmbeddingProvider`         | 메모리/검색을 위한 제공자 소유 임베딩 어댑터를 구성합니다                                                     | 메모리 임베딩 동작은 제공자 Plugin에서 관리합니다                                                                                    |
| `buildReplayPolicy`               | 제공자의 트랜스크립트 처리를 제어하는 재생 정책을 반환합니다                                        | 제공자에 사용자 지정 트랜스크립트 정책(예: 사고 블록 제거)이 필요합니다                                                               |
| `sanitizeReplayHistory`           | 일반적인 트랜스크립트 정리 후 재생 기록을 다시 작성합니다                                                        | 제공자에 공유 Compaction 헬퍼를 넘어서는 제공자별 재생 재작성 기능이 필요합니다                                                             |
| `validateReplayTurns`             | 내장 러너 실행 전 재생 턴을 최종 검증하거나 재구성합니다                                           | 제공자 전송 계층에 일반적인 정리 후 더 엄격한 턴 검증이 필요합니다                                                                    |
| `onModelSelected`                 | 제공자 소유의 선택 후 부수 효과를 실행합니다                                                                 | 모델이 활성화될 때 제공자에 텔레메트리 또는 제공자 소유 상태가 필요합니다                                                                  |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저 일치하는 공급자 Plugin을 확인한 다음, 실제로 모델 ID 또는 전송/구성을 변경하는 Plugin을 찾을 때까지 훅을 지원하는 다른 공급자 Plugin으로 진행합니다. 따라서 호출자가 어느 번들 Plugin이 재작성을 담당하는지 알 필요 없이 별칭/호환성 공급자 심이 계속 작동합니다. 지원되는 Google 계열 구성 항목을 재작성하는 공급자 훅이 없으면 번들 Google 구성 정규화 도구가 해당 호환성 정리를 계속 적용합니다.

공급자에 완전한 사용자 지정 와이어 프로토콜이나 사용자 지정 요청 실행기가 필요하다면 이는 다른 종류의 확장입니다. 이러한 훅은 OpenClaw의 일반 추론 루프에서 계속 실행되는 공급자 동작을 위한 것입니다.

`resolveUsageAuth`는 OpenClaw가 `fetchUsageSnapshot`을 호출할지, 사용량/상태 화면을 위한 일반 자격 증명 확인으로 대체할지를 결정합니다. 공급자에 사용량 자격 증명이 있으면 `{ token, accountId?, subscriptionType?, rateLimitTier? }`를 반환합니다(선택적 요금제 메타데이터는 `fetchUsageSnapshot`으로 전달됩니다). 공급자가 소유한 사용량 인증에서 요청을 처리했으며 일반 API 키/OAuth 대체를 억제해야 하면 `{ handled: true }`를 반환합니다. 공급자가 사용량 인증을 처리하지 않았으면 `null` 또는 `undefined`를 반환합니다.

조직 또는 청구 자격 증명은 매니페스트의 `providerUsageAuthEnvVars`에 선언하십시오. 이를 통해 일반 검색 및 비밀 정보 삭제 화면에서 해당 자격 증명을 추론 인증 후보로 만들지 않고도 인식할 수 있습니다.

### 공급자 예시

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

번들 공급자 Plugin은 각 공급업체의 카탈로그, 인증, 사고, 재생, 사용량 요구 사항에 맞게 위의 훅을 조합합니다. 권위 있는 훅 집합은 `extensions/` 아래의 각 Plugin에 있으며, 이 페이지에서는 목록을 그대로 복제하는 대신 구조를 설명합니다.

<AccordionGroup>
  <Accordion title="통과형 카탈로그 공급자">
    OpenRouter, Kilocode, Z.AI, xAI는 `catalog`와
    `resolveDynamicModel` / `prepareDynamicModel`을 등록하여 OpenClaw의
    정적 카탈로그보다 먼저 업스트림 모델 ID를 표시할 수 있습니다.
  </Accordion>
  <Accordion title="OAuth 및 사용량 엔드포인트 공급자">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai는
    `prepareRuntimeAuth` 또는 `formatApiKey`를 `resolveUsageAuth` +
    `fetchUsageSnapshot`과 함께 사용하여 토큰 교환과 `/usage` 통합을 담당합니다.
  </Accordion>
  <Accordion title="재생 및 트랜스크립트 정리 계열">
    공유 명명 계열(`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`)을 통해 각 Plugin이
    정리 기능을 다시 구현하는 대신 공급자가 `buildReplayPolicy`를 통해
    트랜스크립트 정책을 선택할 수 있습니다.
  </Accordion>
  <Accordion title="카탈로그 전용 공급자">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`,
    `volcengine`은 `catalog`만 등록하고 공유 추론 루프를 사용합니다.
  </Accordion>
  <Accordion title="Anthropic 전용 스트림 도우미">
    베타 헤더, `/fast` / `serviceTier`, `context1m`은 일반 SDK가 아니라
    Anthropic Plugin의 공개 `api.ts` / `contract-api.ts` 경계
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) 내부에 있습니다.
  </Accordion>
</AccordionGroup>

## 런타임 도우미

Plugin은 `api.runtime`을 통해 선택된 핵심 도우미에 접근할 수 있습니다. TTS의 경우:

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

- `textToSpeech`는 파일/음성 메모 화면을 위한 일반 핵심 TTS 출력 페이로드를 반환합니다.
- 핵심 `messages.tts` 구성과 공급자 선택을 사용합니다.
- PCM 오디오 버퍼와 샘플 레이트를 반환합니다. Plugin은 공급자에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 공급자별 선택 사항입니다. 공급업체 소유의 음성 선택기 또는 설정 흐름에 사용하십시오.
- 핵심은 확인된 요청 기한을 공급자 `listVoices` 훅에 전달하며, 공급자별 제한 시간 설정이 이를 재정의할 수 있습니다.
- 음성 목록에는 공급자를 인식하는 선택기를 위해 로캘, 성별, 성격 태그와 같은 더 풍부한 메타데이터가 포함될 수 있습니다.
- 현재 OpenAI와 ElevenLabs는 전화 통화를 지원합니다. Microsoft는 지원하지 않습니다.

Plugin은 `api.registerSpeechProvider(...)`를 통해 음성 공급자를 등록할 수도 있습니다.

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

- TTS 정책, 대체, 답장 전달은 핵심에 유지하십시오.
- 공급업체가 소유한 합성 동작에는 음성 공급자를 사용하십시오.
- 레거시 Microsoft `edge` 입력은 `microsoft` 공급자 ID로 정규화됩니다.
- 선호하는 소유권 모델은 회사 중심입니다. OpenClaw가 이러한 기능 계약을 추가함에 따라 하나의 공급업체 Plugin이 텍스트, 음성, 이미지 및 향후 미디어 공급자를 소유할 수 있습니다.

이미지/오디오/비디오 이해를 위해 Plugin은 일반 키/값 모음 대신 형식이 지정된 하나의 미디어 이해 공급자를 등록합니다.

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

- 오케스트레이션, 대체, 구성, 채널 연결은 핵심에 유지하십시오.
- 공급업체 동작은 공급자 Plugin에 유지하십시오.
- 추가적 확장은 형식을 유지해야 합니다. 새로운 선택적 메서드, 새로운 선택적 결과 필드, 새로운 선택적 기능을 사용하십시오.
- 비디오 생성은 이미 동일한 패턴을 따릅니다.
  - 핵심이 기능 계약과 런타임 도우미를 소유합니다.
  - 공급업체 Plugin이 `api.registerVideoGenerationProvider(...)`를 등록합니다.
  - 기능/채널 Plugin이 `api.runtime.videoGeneration.*`을 사용합니다.

미디어 이해 런타임 도우미의 경우 Plugin은 다음을 호출할 수 있습니다.

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
  model: "gpt-5.6-sol",
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

오디오 트랜스크립션의 경우 Plugin은 미디어 이해 런타임 또는 이전 STT 별칭 중 하나를 사용할 수 있습니다.

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // Optional when MIME cannot be inferred reliably:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`은 이미지/오디오/비디오 이해를 위한 선호 공유 화면입니다.
- `extractStructuredWithModel(...)`은 제한된 공급자 소유의 이미지 우선 추출을 위한 Plugin 대상 경계입니다. 이미지 입력을 하나 이상 포함하십시오. 텍스트 입력은 보충 컨텍스트입니다. 제품 Plugin은 자체 경로와 스키마를 소유하고 OpenClaw는 공급자/런타임 경계를 소유합니다.
- 핵심 미디어 이해 오디오 구성(`tools.media.audio`)과 공급자 대체 순서를 사용합니다.
- 트랜스크립션 출력이 생성되지 않으면(예: 건너뛴 입력/지원되지 않는 입력) `{ text: undefined }`를 반환합니다.
- `api.runtime.stt.transcribeAudioFile(...)`은 호환성 별칭으로 유지됩니다.

Plugin은 `api.runtime.subagent`를 통해 백그라운드 하위 에이전트 실행을 시작할 수도 있습니다.

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

- `provider`와 `model`은 실행별 선택적 재정의이며 영구적인 세션 변경이 아닙니다.
- OpenClaw는 신뢰할 수 있는 호출자에 대해서만 해당 재정의 필드를 적용합니다.
- Plugin 소유 대체 실행을 사용하려면 운영자가 `plugins.entries.<id>.subagent.allowModelOverride: true`로 명시적으로 활성화해야 합니다.
- `plugins.entries.<id>.subagent.allowedModels`를 사용하여 신뢰할 수 있는 Plugin을 특정 정규 `provider/model` 대상으로 제한하거나, 모든 대상을 명시적으로 허용하려면 `"*"`를 사용하십시오.
- 신뢰할 수 없는 Plugin 하위 에이전트 실행도 계속 작동하지만, 재정의 요청은 묵시적으로 대체되는 대신 거부됩니다.
- Plugin이 생성한 하위 에이전트 세션에는 생성한 Plugin ID가 태그로 지정됩니다. 대체 `api.runtime.subagent.deleteSession(...)`은 이렇게 소유된 세션만 삭제할 수 있으며, 임의 세션 삭제에는 여전히 관리자 범위의 Gateway 요청이 필요합니다.

웹 검색의 경우 Plugin은 에이전트 도구 연결에 직접 접근하지 않고 공유 런타임 도우미를 사용할 수 있습니다.

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

Plugin은 `api.registerWebSearchProvider(...)`를 통해 웹 검색 공급자를 등록할 수도 있습니다.

참고:

- 공급자 선택, 자격 증명 확인, 공유 요청 의미 체계는 핵심에 유지하십시오.
- 공급업체별 검색 전송에는 웹 검색 공급자를 사용하십시오.
- `api.runtime.webSearch.*`은 에이전트 도구 래퍼에 의존하지 않고 검색 동작이 필요한 기능/채널 Plugin을 위한 선호 공유 화면입니다.

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

- `generate(...)`: 구성된 이미지 생성 공급자 체인을 사용하여 이미지를 생성합니다.
- `listProviders(...)`: 사용 가능한 이미지 생성 공급자와 해당 기능을 나열합니다.

## Gateway HTTP 경로

Plugin은 `api.registerHttpRoute(...)`를 사용하여 HTTP 엔드포인트를 노출할 수 있습니다.

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
- `auth`: 필수이며, `"gateway"` 또는 `"plugin"`입니다. 일반 Gateway 인증을 요구하려면 `"gateway"`를 사용하고, Plugin에서 관리하는 인증/Webhook 검증에는 `"plugin"`을 사용합니다.
- `match`: 선택 사항입니다. `"exact"`(기본값) 또는 `"prefix"`입니다.
- `handleUpgrade`: 동일한 라우트에서 WebSocket 업그레이드 요청을 처리하는 선택적 핸들러입니다.
- `replaceExisting`: 선택 사항입니다. 동일한 Plugin이 자체 기존 라우트 등록을 교체할 수 있도록 합니다.
- `handler`: 라우트가 요청을 처리했으면 `true`를 반환합니다.

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 Plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하십시오.
- Plugin 라우트는 `auth`를 명시적으로 선언해야 합니다.
- `replaceExisting: true`가 아니면 동일한 `path + match` 충돌은 거부되며, 한 Plugin이 다른 Plugin의 라우트를 교체할 수 없습니다.
- `auth` 수준이 다른 중첩 라우트는 거부됩니다. `exact`/`prefix` 폴스루 체인은 동일한 인증 수준에서만 유지하십시오.
- `auth: "plugin"` 라우트에는 운영자 런타임 스코프가 자동으로 제공되지 **않습니다**. 이 라우트는 권한 있는 Gateway 헬퍼 호출이 아니라 Plugin에서 관리하는 Webhook/서명 검증을 위한 것입니다.
- `auth: "gateway"` 라우트는 Gateway 요청 런타임 스코프 내에서 실행됩니다. 기본 표면(`gatewayRuntimeScopeSurface: "write-default"`)은 의도적으로 보수적입니다.
  - 공유 비밀 전달자 인증(`gateway.auth.mode = "token"` / `"password"`)과 신뢰할 수 있는 프록시가 아닌 모든 인증 방식에는 호출자가 `x-openclaw-scopes`를 보내더라도 단일 `operator.write` 스코프가 부여됩니다.
  - 명시적인 `x-openclaw-scopes` 헤더가 없는 `trusted-proxy` 호출자도 기존의 `operator.write` 전용 표면을 유지합니다.
  - `x-openclaw-scopes`를 보내는 `trusted-proxy` 호출자에게는 대신 선언된 스코프가 부여됩니다.
  - 라우트는 `gatewayRuntimeScopeSurface: "trusted-operator"`를 선택하여 신원 정보를 포함하는 인증 모드에서 항상 `x-openclaw-scopes`를 따르도록 할 수 있습니다(헤더가 없으면 전체 CLI 기본 스코프 집합으로 대체됨).
- 실용적 규칙: Gateway 인증 Plugin 라우트가 암시적인 관리자 표면이라고 가정하지 마십시오. 라우트에 관리자 전용 동작이 필요하면 `trusted-operator` 스코프 표면을 선택하고, 신원 정보를 포함하는 인증 모드를 요구하며, 명시적인 `x-openclaw-scopes` 헤더 계약을 문서화하십시오.
- 라우트 일치 및 인증 후 일반 핸들러는 Gateway 루트 작업 승인에 참여합니다. 준비 중이거나 재시작 중인 Gateway는 핸들러를 호출하기 전에 `503`을 반환합니다. 좁은 예외는 매니페스트에서 권한을 부여받은 `auth: "gateway"` 라우트가 라우트별 `trusted-operator` 표면도 선택한 경우입니다. 이 라우트는 일시 중단 제어 디스패치가 고립되지 않도록 계속 접근할 수 있지만, 같은 Plugin의 일반 형제 라우트는 승인 경계 뒤에 그대로 유지됩니다. WebSocket `handleUpgrade` 소유권에도 동일한 원자적 승인 경계가 적용됩니다. 핸들러가 소켓을 수락하면 이후 소켓 수명 주기는 Plugin이 소유하며 이 경계에서 추적하지 않습니다.

## Plugin SDK 가져오기 경로

새 Plugin을 작성할 때는 단일 구조의 `openclaw/plugin-sdk` 루트 배럴 대신 세분화된 SDK 하위 경로를 사용하십시오. 코어 하위 경로:

| 하위 경로                           | 용도                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 등록 기본 요소                              |
| `openclaw/plugin-sdk/channel-core`  | 채널 진입점/빌드 헬퍼                              |
| `openclaw/plugin-sdk/core`          | 일반 공유 헬퍼 및 포괄 계약                        |
| `openclaw/plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마(`OpenClawSchema`)  |

채널 Plugin은 `channel-setup`, `setup-runtime`, `setup-tools`, `channel-pairing`, `channel-contract`, `channel-feedback`, `channel-inbound`, `channel-outbound`, `command-auth`, `secret-input`, `webhook-ingress`, `channel-targets`, `channel-actions`와 같은 세분화된 심 계열에서 선택합니다. 승인 동작은 관련 없는 Plugin 필드에 분산해 혼합하지 말고 하나의 `approvalCapability` 계약으로 통합해야 합니다. [채널 Plugin](/ko/plugins/sdk-channel-plugins)을 참조하십시오.

런타임 및 구성 헬퍼는 해당하는 목적별 `*-runtime` 하위 경로(`approval-runtime`, `agent-runtime`, `lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store`, `system-event-runtime`, `heartbeat-runtime`, `channel-activity-runtime` 등)에 있습니다. 광범위한 `config-runtime` 호환성 배럴 대신 `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation`을 사용하는 것이 좋습니다.

<Info>
`openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/channel-lifecycle`, 소규모 채널 헬퍼 퍼사드, `openclaw/plugin-sdk/outbound-runtime`, `openclaw/plugin-sdk/outbound-send-deps`, `openclaw/plugin-sdk/config-runtime`, `openclaw/plugin-sdk/infra-runtime`은 이전 Plugin을 위한 사용 중단된 호환성 심입니다. 새 코드는 더 세분화된 일반 기본 요소를 가져와야 합니다.
</Info>

저장소 내부 진입점(번들 Plugin 패키지 루트별):

- `index.js` — 번들 Plugin 진입점
- `api.js` — 헬퍼/타입 배럴
- `runtime-api.js` — 런타임 전용 배럴
- `setup-entry.js` — 설정 Plugin 진입점

외부 Plugin은 `openclaw/plugin-sdk/*` 하위 경로만 가져와야 합니다. 코어나 다른 Plugin에서 다른 Plugin 패키지의 `src/*`를 가져오지 마십시오. 퍼사드로 로드되는 진입점은 활성 런타임 구성 스냅샷이 있으면 이를 우선 사용하고, 없으면 디스크에서 확인된 구성 파일로 대체합니다.

`image-generation`, `media-understanding`, `speech`와 같은 기능별 하위 경로는 현재 번들 Plugin에서 사용하므로 존재합니다. 이러한 경로가 자동으로 장기간 고정되는 외부 계약은 아닙니다. 경로에 의존할 때는 관련 SDK 참조 페이지를 확인하십시오.

## 메시지 도구 스키마

Plugin은 반응, 읽기, 투표와 같은 메시지가 아닌 기본 요소에 대해 채널별 `describeMessageTool(...)` 스키마 기여를 소유해야 합니다. 공유 전송 프레젠테이션에서는 제공자 네이티브 버튼, 컴포넌트, 블록 또는 카드 필드 대신 일반 `MessagePresentation` 계약을 사용해야 합니다. 계약, 대체 규칙, 제공자 매핑 및 Plugin 작성자 체크리스트는 [메시지 프레젠테이션](/ko/plugins/message-presentation)을 참조하십시오.

전송 기능이 있는 Plugin은 메시지 기능을 통해 렌더링할 수 있는 항목을 선언합니다.

- 의미론적 프레젠테이션 블록(`text`, `context`, `divider`, `chart`, `table`, `buttons`, `select`)에는 `presentation`
- 고정 전송 요청에는 `delivery-pin`

코어는 프레젠테이션을 네이티브로 렌더링할지 텍스트로 저하할지 결정합니다. 일반 메시지 도구에서 제공자 네이티브 UI 우회 수단을 노출하지 마십시오. 기존 타사 Plugin을 위해 레거시 네이티브 스키마용으로 사용 중단된 SDK 헬퍼가 계속 내보내지지만, 새 Plugin에서는 사용하지 않아야 합니다.

## 채널 대상 확인

채널 Plugin은 채널별 대상 의미론을 소유해야 합니다. 공유 아웃바운드 호스트는 일반적으로 유지하고 제공자 규칙에는 메시징 어댑터 표면을 사용하십시오.

- `messaging.inferTargetChatType({ to })`는 디렉터리를 조회하기 전에 정규화된 대상을 `direct`, `group`, `channel` 중 무엇으로 처리할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 입력이 디렉터리 검색 대신 ID와 유사한 확인 절차로 곧바로 이동해야 하는지를 코어에 알립니다.
- `messaging.targetResolver.reservedLiterals`는 해당 제공자의 채널/세션 참조인 단독 단어 목록입니다. 확인 과정에서는 예약 리터럴을 거부하기 전에 구성된 디렉터리 항목을 보존하고, 디렉터리에서 일치 항목을 찾지 못하면 닫힌 상태로 실패합니다.
- `messaging.targetResolver.resolveTarget(...)`은 정규화 후 또는 디렉터리에서 일치 항목을 찾지 못한 후 코어에 제공자 소유의 최종 확인이 필요할 때 사용하는 Plugin 대체 동작입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 확인된 후 제공자별 세션 라우트 구성을 소유합니다.

권장 분리 방식:

- 피어/그룹을 검색하기 전에 수행해야 하는 범주 결정에는 `inferTargetChatType`을 사용하십시오.
- "이를 명시적/네이티브 대상 ID로 처리"하는 검사에는 `looksLikeId`를 사용하십시오.
- `resolveTarget`은 광범위한 디렉터리 검색이 아니라 제공자별 정규화 대체 동작에 사용하십시오.
- 채팅 ID, 스레드 ID, JID, 핸들, 룸 ID와 같은 제공자 네이티브 ID는 일반 SDK 필드가 아니라 `target` 값 또는 제공자별 매개변수 안에 유지하십시오.

## 구성 기반 디렉터리

구성에서 디렉터리 항목을 파생하는 Plugin은 해당 로직을 Plugin 내부에 유지하고 `openclaw/plugin-sdk/directory-runtime`의 공유 헬퍼를 재사용해야 합니다.

채널에 다음과 같은 구성 기반 피어/그룹이 필요할 때 이를 사용하십시오.

- 허용 목록 기반 DM 피어
- 구성된 채널/그룹 맵
- 계정 범위의 정적 디렉터리 대체 동작

`directory-runtime`의 공유 헬퍼는 다음과 같은 일반 작업만 처리합니다.

- 쿼리 필터링
- 제한 적용
- 중복 제거/정규화 헬퍼
- `ChannelDirectoryEntry[]` 빌드

채널별 계정 검사와 ID 정규화는 Plugin 구현 내부에 유지해야 합니다.

## 제공자 카탈로그

제공자 Plugin은 `registerProvider({ catalog: { run(...) { ... } } })`를 사용하여 추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가 `models.providers`에 기록하는 것과 동일한 형태를 반환합니다.

- 하나의 제공자 항목에는 `{ provider }`
- 여러 제공자 항목에는 `{ providers }`

Plugin이 제공자별 모델 ID, 기본 URL 기본값 또는 인증이 필요한 모델 메타데이터를 소유할 때 `catalog`를 사용하십시오.

`catalog.order`는 Plugin의 카탈로그가 OpenClaw의 내장 암시적 제공자와 비교하여 병합되는 시점을 제어합니다.

- `simple`: 일반 API 키 또는 환경 기반 제공자
- `profile`: 인증 프로필이 있을 때 표시되는 제공자
- `paired`: 관련된 여러 제공자 항목을 합성하는 제공자
- `late`: 다른 암시적 제공자 다음의 마지막 단계

키 충돌 시 나중에 처리되는 제공자가 우선하므로, Plugin은 동일한 제공자 ID를 가진 내장 제공자 항목을 의도적으로 재정의할 수 있습니다.

Plugin은 `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog
})`를 통해 읽기 전용 모델 행을 게시할 수도 있습니다. 이는 목록/도움말/선택기 표면을 위한 향후 경로이며 `text`, `voice`, `image_generation`, `video_generation`, `music_generation` 행을 지원합니다. 제공자 Plugin은 계속해서 실시간 엔드포인트 호출, 토큰 교환, 공급업체 응답 매핑을 소유하며, 코어는 공통 행 형태, 소스 레이블, 미디어 도구 도움말 서식을 소유합니다. 미디어 생성 제공자 등록은 `defaultModel`, `models`, `capabilities`에서 정적 카탈로그 행을 자동으로 합성합니다.

호환성:

- `discovery`는 레거시 별칭으로 계속 작동하지만 사용 중단 경고를 표시합니다.
- `catalog`와 `discovery`가 모두 등록되면 OpenClaw는 `catalog`를 사용하고 경고를 표시합니다.
- `augmentModelCatalog`은 사용 중단되었습니다. 번들 제공자는 `registerModelCatalogProvider`를 통해 보충 행을 게시해야 합니다.

## 읽기 전용 채널 검사

Plugin이 채널을 등록하는 경우 `resolveAccount(...)`와 함께 `plugin.config.inspectAccount(cfg, accountId)`를 구현하는 것이 좋습니다.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이 완전히 구체화되었다고 가정할 수 있으며, 필수 비밀이 누락되면 즉시 실패할 수 있습니다.
- `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`와 같은 읽기 전용 명령 경로와 doctor/구성 복구 흐름은 구성을 설명하기 위해 런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명적인 계정 상태만 반환하십시오.
- `enabled`와 `configured`를 유지하십시오.
- 관련된 경우 다음과 같은 자격 증명 소스/상태 필드를 포함하십시오.
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 가용성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다. 상태 형식 명령에는 `tokenStatus: "available"`(및 이에 대응하는 소스 필드)을 반환하는 것으로 충분합니다.
- SecretRef를 통해 자격 증명이 구성되어 있지만 현재 명령 경로에서 사용할 수 없는 경우 `configured_unavailable`을 사용하십시오.

이를 통해 읽기 전용 명령은 충돌하거나 계정이 구성되지 않았다고 잘못 보고하는 대신 "구성되었지만 이 명령 경로에서는 사용할 수 없음"이라고 보고할 수 있습니다.

## 패키지 팩

Plugin 디렉터리에는 `openclaw.extensions`가 포함된 `package.json`이 있을 수 있습니다.

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 항목은 하나의 Plugin이 됩니다. 팩에 여러 확장이 나열된 경우 Plugin ID는 `<manifestOrPackageName>/<fileBase>`가 됩니다(매니페스트 ID가 있으면 우선하며, 그렇지 않으면 범위가 제거된 `package.json` 이름을 사용합니다).

Plugin이 npm 종속성을 가져오는 경우 `node_modules`를 사용할 수 있도록 해당 디렉터리에 설치하십시오(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 심볼릭 링크를 해석한 후에도 Plugin 디렉터리 내부에 있어야 합니다. 패키지 디렉터리를 벗어나는 항목은 거부됩니다.

보안 참고: `openclaw plugins install`은 상속된 전역 npm 설치 설정을 무시하고 프로젝트 로컬 `npm install --omit=dev --ignore-scripts`를 사용하여 Plugin 종속성을 설치합니다(수명 주기 스크립트 없음, 런타임 개발 종속성 없음). Plugin 종속성 트리는 "순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하십시오.

선택 사항: `openclaw.setupEntry`는 가벼운 설정 전용 모듈을 가리킬 수 있습니다. OpenClaw가 비활성화된 채널 Plugin의 설정 표면이 필요하거나 채널 Plugin이 활성화되었지만 아직 구성되지 않은 경우 전체 Plugin 진입점 대신 `setupEntry`를 로드합니다. 기본 Plugin 진입점에서 도구, 훅 또는 기타 런타임 전용 코드도 연결하는 경우 시작과 설정을 더 가볍게 유지할 수 있습니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`을 사용하면 채널이 이미 구성되어 있더라도 Gateway의 수신 대기 전 시작 단계에서 채널 Plugin이 동일한 `setupEntry` 경로를 사용하도록 선택할 수 있습니다.

Gateway가 수신 대기를 시작하기 전에 반드시 존재해야 하는 시작 표면을 `setupEntry`가 완전히 포괄하는 경우에만 이를 사용하십시오. 실제로는 설정 진입점이 다음과 같이 시작에 필요한 채널 소유 기능을 모두 등록해야 함을 의미합니다.

- 채널 등록 자체
- Gateway가 수신 대기를 시작하기 전에 사용할 수 있어야 하는 모든 HTTP 경로
- 동일한 시간대에 존재해야 하는 모든 Gateway 메서드, 도구 또는 서비스

전체 진입점이 필수 시작 기능을 하나라도 계속 소유하는 경우 이 플래그를 활성화하지 마십시오. Plugin을 기본 동작으로 유지하고 OpenClaw가 시작 중에 전체 진입점을 로드하도록 하십시오.

번들 채널은 전체 채널 런타임이 로드되기 전에 코어가 참조할 수 있는 설정 전용 계약 표면 도우미도 게시할 수 있습니다. 현재 설정 승격 표면은 다음과 같습니다.

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

코어는 전체 Plugin 진입점을 로드하지 않고 레거시 단일 계정 채널 구성을 `channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다. Matrix가 현재 번들 예시입니다. 명명된 계정이 이미 존재하는 경우 인증/부트스트랩 키만 명명된 승격 계정으로 이동하며, 항상 `accounts.default`를 생성하는 대신 구성된 비표준 기본 계정 키를 유지할 수 있습니다.

이러한 설정 패치 어댑터는 번들 계약 표면 검색을 지연 상태로 유지합니다. 가져오기 시간은 가볍게 유지되며, 모듈을 가져올 때 번들 채널 시작에 다시 진입하는 대신 처음 사용할 때만 승격 표면을 로드합니다.

이러한 시작 표면에 Gateway RPC 메서드가 포함되는 경우 Plugin별 접두사를 사용하십시오. 코어 관리 네임스페이스(`config.*`, `exec.approvals.*`, `wizard.*`, `update.*`)는 계속 예약되며 Plugin이 더 좁은 범위를 요청하더라도 항상 `operator.admin`으로 해석됩니다.

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

채널 Plugin은 `openclaw.channel`을 통해 설정/검색 메타데이터를, `openclaw.install`을 통해 설치 힌트를 알릴 수 있습니다. 이를 통해 코어 카탈로그에 데이터를 포함하지 않아도 됩니다.

예시:

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (자체 호스팅)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Nextcloud Talk Webhook 봇을 통한 자체 호스팅 채팅입니다.",
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

최소 예시 외에 유용한 `openclaw.channel` 필드는 다음과 같습니다.

- `detailLabel`: 더 풍부한 카탈로그/상태 표면을 위한 보조 레이블
- `docsLabel`: 문서 링크의 링크 텍스트 재정의
- `preferOver`: 이 카탈로그 항목이 우선해야 하는 우선순위가 낮은 Plugin/채널 ID
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 문구 제어
- `markdownCapable`: 발신 형식 지정 결정에서 채널이 Markdown을 지원함을 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 설정/구성 선택기에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭이며, `exposure` 사용을 권장합니다.
- `quickstartAllowFrom`: 채널이 표준 빠른 시작 `allowFrom` 흐름을 사용하도록 선택
- `forceAccountBinding`: 계정이 하나만 존재하더라도 명시적인 계정 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: 알림 대상을 해석할 때 세션 조회 우선

OpenClaw는 **외부 채널 카탈로그**(예: MPM 레지스트리 내보내기)도 병합할 수 있습니다. 다음 위치 중 하나에 JSON 파일을 배치하십시오.

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)가 하나 이상의 JSON 파일을 가리키도록 설정하십시오(쉼표/세미콜론/`PATH`로 구분). 각 파일에는 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`가 포함되어야 합니다. 파서는 `"entries"` 키의 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

생성된 채널 카탈로그 항목과 공급자 설치 카탈로그 항목은 원시 `openclaw.install` 블록과 함께 정규화된 설치 소스 정보를 노출합니다. 정규화된 정보는 npm 사양이 정확한 버전인지 부동 선택자인지, 예상 무결성 메타데이터가 있는지, 로컬 소스 경로도 사용할 수 있는지를 식별합니다. 카탈로그/패키지 ID를 알고 있는 경우 정규화된 정보는 파싱된 npm 패키지 이름이 해당 ID와 달라지면 경고합니다. 또한 `defaultChoice`가 유효하지 않거나 사용할 수 없는 소스를 가리키는 경우와 유효한 npm 소스 없이 npm 무결성 메타데이터가 있는 경우에도 경고합니다. 직접 만든 항목과 카탈로그 심이 이를 합성하지 않아도 되도록 소비자는 `installSource`를 추가적인 선택적 필드로 취급해야 합니다.
이를 통해 온보딩과 진단은 Plugin 런타임을 가져오지 않고도 소스 계층 상태를 설명할 수 있습니다.

공식 외부 npm 항목은 정확한 `npmSpec`과 `expectedIntegrity`를 사용하는 것이 좋습니다. 단순 패키지 이름과 dist-tag도 호환성을 위해 계속 작동하지만 소스 계층 경고가 표시되므로 기존 Plugin을 중단하지 않고 카탈로그를 고정되고 무결성이 확인된 설치 방식으로 전환할 수 있습니다. 온보딩에서 로컬 카탈로그 경로로부터 설치하면 가능한 경우 `source: "path"` 및 워크스페이스 상대 `sourcePath`가 포함된 관리형 Plugin Plugin 인덱스 항목을 기록합니다. 절대 운영 로드 경로는 `plugins.load.paths`에 유지되며, 설치 레코드는 로컬 워크스테이션 경로가 장기 구성에 중복 기록되는 것을 방지합니다. 이를 통해 두 번째 원시 파일 시스템 경로 공개 표면을 추가하지 않고도 로컬 개발 설치가 소스 계층 진단에 표시됩니다. 영구 저장되는 `installed_plugin_index` SQLite 테이블은 설치 정보의 원본이며 Plugin 런타임 모듈을 로드하지 않고도 새로 고칠 수 있습니다. 해당 `installRecords` 맵은 Plugin 매니페스트가 없거나 유효하지 않아도 영구적으로 유지되며, `plugins` 페이로드는 다시 빌드할 수 있는 매니페스트 보기입니다.

## 컨텍스트 엔진 Plugin

컨텍스트 엔진 Plugin은 수집, 조립 및 Compaction을 위한 세션 컨텍스트 오케스트레이션을 소유합니다. Plugin에서 `api.registerContextEngine(id, factory)`를 사용하여 등록한 다음 `plugins.slots.contextEngine`으로 활성 엔진을 선택하십시오.

Plugin에서 단순히 메모리 검색이나 훅을 추가하는 대신 기본 컨텍스트 파이프라인을 대체하거나 확장해야 할 때 사용하십시오.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

팩터리 `ctx`는 생성 시 초기화를 위한 선택적 `config`, `agentDir`, `workspaceDir` 값을 노출합니다.

활성 하니스에 영구 백엔드 스레드가 있는 경우 `assemble()`은 `contextProjection`을 반환할 수 있습니다. 레거시 턴별 프로젝션의 경우 이를 생략하십시오. 조립된 컨텍스트를 백엔드 스레드에 한 번 삽입하고 epoch가 변경될 때까지 재사용해야 하는 경우 `{ mode: "thread_bootstrap", epoch }`을 반환하십시오. 엔진이 소유한 Compaction 패스 이후처럼 엔진의 의미론적 컨텍스트가 변경된 후에는 epoch를 변경하십시오. 호스트는 스레드 부트스트랩 프로젝션에서 도구 호출 메타데이터, 입력 형태 및 가려진 도구 결과를 보존할 수 있으므로 새 백엔드 스레드가 원시 비밀 포함 페이로드를 복사하지 않고도 도구 연속성을 유지할 수 있습니다.

엔진이 Compaction 알고리즘을 소유하지 **않는** 경우에도 `compact()`을 구현된 상태로 유지하고 명시적으로 위임하십시오.

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";
import { resolveSessionAgentId } from "openclaw/plugin-sdk/memory-host-core";

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
    async assemble({ messages, sessionKey, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
          agentId: resolveSessionAgentId({ config: ctx.config, sessionKey }),
          agentSessionKey: sessionKey,
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

Plugin에 현재 API로는 구현할 수 없는 동작이 필요한 경우, 비공개로 내부에 접근하여 Plugin 시스템을 우회하지 마십시오. 누락된 기능을 추가하십시오.

권장 순서:

1. **코어 계약을 정의합니다.** 코어가 소유해야 하는 공유 동작을 결정합니다. 여기에는 정책, 폴백, 구성 병합, 수명 주기, 채널 관련 의미 체계 및 런타임 헬퍼 형태가 포함됩니다.
2. **형식화된 Plugin 등록/런타임 표면을 추가합니다.** 가장 작으면서도 유용한 형식화된 기능 표면으로 `OpenClawPluginApi` 및/또는 `api.runtime`을 확장합니다.
3. **코어와 채널/기능 소비자를 연결합니다.** 채널 및 기능 Plugin은 공급업체 구현을 직접 가져오지 않고 코어를 통해 새 기능을 사용해야 합니다.
4. **공급업체 구현을 등록합니다.** 그런 다음 공급업체 Plugin이 해당 기능에 백엔드를 등록합니다.
5. **계약 검증 범위를 추가합니다.** 시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이러한 방식으로 OpenClaw는 특정 공급자의 관점에 하드코딩되지 않으면서도 명확한 방향성을 유지합니다. 구체적인 파일 체크리스트와 완성된 예시는 [기능 설명서](/ko/plugins/adding-capabilities)를 참조하십시오.

### 기능 체크리스트

새 기능을 추가할 때는 일반적으로 다음 표면을 함께 변경해야 합니다.

- `src/<capability>/types.ts`의 코어 계약 타입
- `src/<capability>/runtime.ts`의 코어 실행기/런타임 헬퍼
- `src/plugins/types.ts`의 Plugin API 등록 표면
- `src/plugins/registry.ts`의 Plugin 레지스트리 연결
- 기능/채널 Plugin이 사용해야 하는 경우 `src/plugins/runtime/*`의 Plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 헬퍼
- `src/plugins/contracts/registry.ts`의 소유권/계약 어설션
- `docs/`의 운영자/Plugin 문서

이러한 표면 중 하나가 누락되었다면, 일반적으로 해당 기능이 아직 완전히 통합되지 않았다는 신호입니다.

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

계약 테스트 패턴(`src/plugins/contracts/registry.ts`는 `providerContractPluginIds` 같은 소유권 조회를 노출하며, 테스트에서는 Plugin의 `contracts.videoGenerationProviders` 목록이 실제 등록 내용과 일치하는지 검증합니다):

```ts
expect(pluginManifest.contracts?.videoGenerationProviders).toEqual(["openai"]);
```

이렇게 하면 규칙이 단순하게 유지됩니다.

- 코어는 기능 계약과 오케스트레이션을 소유합니다.
- 공급업체 Plugin은 공급업체 구현을 소유합니다.
- 기능/채널 Plugin은 런타임 헬퍼를 사용합니다.
- 계약 테스트는 소유권을 명시적으로 유지합니다.

## 관련 문서

- [Plugin 아키텍처](/ko/plugins/architecture) — 공개 기능 모델 및 형태
- [Plugin SDK 하위 경로](/ko/plugins/sdk-subpaths)
- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
