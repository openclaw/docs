---
read_when:
    - provider 런타임 hook, 채널 수명 주기, 또는 패키지 pack 구현하기
    - Plugin 로드 순서 또는 레지스트리 상태 디버깅하기
    - 새 Plugin capability 또는 context engine Plugin 추가하기
summary: 'Plugin 아키텍처 내부 동작: 로드 파이프라인, 레지스트리, 런타임 hook, HTTP 경로, 참조 표'
title: Plugin 아키텍처 내부 동작
x-i18n:
    generated_at: "2026-04-26T11:34:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a435e118dc6acbacd44008f0b1c47b51da32dc3f17c24fe4c99f75c8cbd9311
    source_path: plugins/architecture-internals.md
    workflow: 15
---

공개 capability 모델, Plugin shape, 소유권/실행 계약은 [Plugin architecture](/ko/plugins/architecture)를 참조하세요. 이 페이지는 내부 메커니즘에 대한 참조입니다: 로드 파이프라인, 레지스트리, 런타임 hook, Gateway HTTP 경로, import 경로, 스키마 표.

## 로드 파이프라인

시작 시 OpenClaw는 대략 다음과 같이 동작합니다.

1. 후보 Plugin 루트 탐색
2. 네이티브 또는 호환 번들 manifest와 패키지 메타데이터 읽기
3. 안전하지 않은 후보 거부
4. Plugin config 정규화(`plugins.enabled`, `allow`, `deny`, `entries`,
   `slots`, `load.paths`)
5. 각 후보의 활성화 여부 결정
6. 활성화된 네이티브 모듈 로드: 빌드된 번들 모듈은 네이티브 로더를 사용하고,
   빌드되지 않은 네이티브 Plugins는 jiti를 사용
7. 네이티브 `register(api)` hook 호출 및 등록 내용을 Plugin 레지스트리에 수집
8. 명령/런타임 표면에 레지스트리 노출

<Note>
`activate`는 `register`의 레거시 별칭입니다. 로더는 존재하는 항목(`def.register ?? def.activate`)을 확인해 같은 지점에서 호출합니다. 모든 번들 Plugins는 `register`를 사용합니다. 새 Plugins에는 `register`를 사용하세요.
</Note>

안전 게이트는 런타임 실행 **전에** 적용됩니다. 항목이 Plugin 루트를 벗어나거나, 경로가 world-writable이거나, 비번들 Plugins에 대해 경로 소유권이 의심스러워 보이면 후보가 차단됩니다.

### Manifest 우선 동작

manifest는 control plane의 source of truth입니다. OpenClaw는 이를 사용해 다음을 수행합니다.

- Plugin 식별
- 선언된 채널/Skills/config 스키마 또는 번들 capability 탐색
- `plugins.entries.<id>.config` 검증
- Control UI 라벨/placeholder 보강
- 설치/카탈로그 메타데이터 표시
- Plugin 런타임을 로드하지 않고 저비용 activation 및 설정 descriptor 유지

네이티브 Plugins의 경우 런타임 모듈은 data plane 부분입니다. 실제 동작(예: hook, 도구, 명령, provider 흐름)을 등록합니다.

선택적 manifest `activation` 및 `setup` 블록은 control plane에 머뭅니다. 이것들은 activation 계획 및 setup 탐색을 위한 메타데이터 전용 descriptor이며, 런타임 등록, `register(...)`, 또는 `setupEntry`를 대체하지 않습니다.
최초의 실제 activation 소비자는 이제 더 넓은 레지스트리 구체화 전에 manifest 명령, 채널, provider 힌트를 사용해 Plugin 로딩 범위를 좁힙니다.

- CLI 로딩은 요청된 기본 명령을 소유한 Plugins로 범위를 좁힙니다
- 채널 setup/Plugin 확인은 요청된 채널 ID를 소유한 Plugins로 범위를 좁힙니다
- 명시적 provider setup/런타임 확인은 요청된 provider ID를 소유한 Plugins로 범위를 좁힙니다

activation planner는 기존 호출자를 위한 ID 전용 API와 새 diagnostics를 위한 plan API를 모두 노출합니다. plan 항목은 Plugin이 선택된 이유를 보고하며, 명시적 `activation.*` planner 힌트와 `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools`, hook 같은 manifest 소유권 fallback을 구분합니다. 이 이유 구분이 호환성 경계입니다. 기존 Plugin 메타데이터는 계속 동작하고, 새 코드는 런타임 로딩 의미를 바꾸지 않고도 넓은 힌트나 fallback 동작을 감지할 수 있습니다.

이제 setup 탐색은 setup 시점 런타임 hook이 여전히 필요한 Plugins에 대해 `setup-api`로 fallback하기 전에 `setup.providers` 및 `setup.cliBackends` 같은 descriptor 소유 ID를 우선 사용해 후보 Plugin 범위를 좁힙니다. provider setup 목록은 provider 런타임을 로드하지 않고 manifest `providerAuthChoices`, descriptor 기반 setup 선택지, 설치 카탈로그 메타데이터를 사용합니다. 명시적인 `setup.requiresRuntime: false`는 descriptor 전용 cutoff이며, `requiresRuntime`을 생략하면 호환성을 위해 레거시 `setup-api` fallback이 유지됩니다. 탐색된 Plugin이 동일한 정규화된 setup provider 또는 CLI backend ID를 둘 이상 주장하면, setup 조회는 탐색 순서에 의존하지 않고 모호한 소유자를 거부합니다. setup 런타임이 실제 실행될 때도 레지스트리 diagnostics는 레거시 Plugins를 차단하지 않고 `setup.providers` / `setup.cliBackends`와 setup-api가 등록한 provider 또는 CLI backend 사이의 드리프트를 보고합니다.

### 로더가 캐시하는 항목

OpenClaw는 프로세스 내 단기 캐시를 다음에 대해 유지합니다.

- 탐색 결과
- manifest 레지스트리 데이터
- 로드된 Plugin 레지스트리

이 캐시들은 급격한 시작 부하와 반복 명령 오버헤드를 줄입니다. 이것들은 영속 저장이 아니라 수명이 짧은 성능 캐시로 생각하는 것이 안전합니다.

성능 참고:

- 이 캐시들을 비활성화하려면 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 또는
  `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1`을 설정하세요.
- 캐시 기간은 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 및
  `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS`로 조정하세요.

## 레지스트리 모델

로드된 Plugins는 임의의 코어 전역 상태를 직접 변경하지 않습니다. 중앙 Plugin 레지스트리에 등록합니다.

레지스트리는 다음을 추적합니다.

- Plugin 레코드(식별 정보, 소스, origin, 상태, diagnostics)
- 도구
- 레거시 hook 및 타입 지정 hook
- 채널
- providers
- Gateway RPC 핸들러
- HTTP 경로
- CLI registrar
- 백그라운드 서비스
- Plugin 소유 명령

이후 코어 기능은 Plugin 모듈과 직접 통신하는 대신 해당 레지스트리에서 읽습니다. 이렇게 하면 로딩이 한 방향으로 유지됩니다.

- Plugin 모듈 -> 레지스트리 등록
- 코어 런타임 -> 레지스트리 소비

이 분리는 유지보수성 측면에서 중요합니다. 대부분의 코어 표면이 "모든 Plugin 모듈을 특수 처리"가 아니라 "레지스트리를 읽기"라는 하나의 통합 지점만 필요하게 만들기 때문입니다.

## 대화 바인딩 콜백

대화를 바인딩하는 Plugins는 승인이 해결될 때 반응할 수 있습니다.

bind 요청이 승인되거나 거부된 뒤 콜백을 받으려면 `api.onConversationBindingResolved(...)`를 사용하세요.

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 이 Plugin + 대화에 대한 바인딩이 이제 존재합니다.
        console.log(event.binding?.conversationId);
        return;
      }

      // 요청이 거부되었습니다. 로컬 대기 상태를 정리하세요.
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

콜백 페이로드 필드:

- `status`: `"approved"` 또는 `"denied"`
- `decision`: `"allow-once"`, `"allow-always"`, 또는 `"deny"`
- `binding`: 승인된 요청에 대한 확인된 바인딩
- `request`: 원래 요청 요약, detach 힌트, 발신자 ID, 대화 메타데이터

이 콜백은 알림 전용입니다. 누가 대화를 바인딩할 수 있는지를 바꾸지 않으며, 코어 승인 처리가 끝난 뒤 실행됩니다.

## Provider 런타임 hook

provider Plugins에는 세 계층이 있습니다.

- **Manifest 메타데이터**: 런타임 전 저비용 조회용
  `setup.providers[].envVars`, deprecated 호환성 `providerAuthEnvVars`,
  `providerAuthAliases`, `providerAuthChoices`, `channelEnvVars`
- **Config 시점 hook**: `catalog`(레거시 `discovery`)와
  `applyConfigDefaults`
- **런타임 hook**: 인증, 모델 확인,
  스트림 래핑, thinking 수준, replay 정책, 사용량 엔드포인트를 다루는 40개 이상의 선택적 hook. 전체 목록은 [Hook order and usage](#hook-order-and-usage)를 참조하세요.

OpenClaw는 여전히 일반 에이전트 루프, failover, transcript 처리, 도구 정책을 소유합니다. 이 hook들은 전체 커스텀 추론 전송 없이 provider별 동작을 확장하는 표면입니다.

provider에 env 기반 자격 증명이 있어 generic auth/status/model-picker 경로가 provider 런타임을 로드하지 않고도 이를 볼 수 있어야 한다면 manifest `setup.providers[].envVars`를 사용하세요. 더 이상 권장되지 않는 `providerAuthEnvVars`는 deprecation 기간 동안 호환성 어댑터가 여전히 읽으며, 이를 사용하는 비번들 Plugins는 manifest diagnostic을 받습니다. 한 provider ID가 다른 provider ID의 env vars, auth profiles, config 기반 auth, API 키 온보딩 선택을 재사용해야 한다면 manifest `providerAuthAliases`를 사용하세요. 온보딩/auth-choice CLI 표면이 provider 런타임을 로드하지 않고도 provider의 choice ID, 그룹 라벨, 간단한 단일 플래그 auth 연결 방식을 알아야 한다면 manifest `providerAuthChoices`를 사용하세요. provider 런타임 `envVars`는 온보딩 라벨 또는 OAuth client-id/client-secret setup var 같은 operator 대상 힌트용으로 유지하세요.

채널에 env 기반 auth 또는 setup이 있어 generic shell-env fallback, config/status 검사, 또는 setup 프롬프트가 채널 런타임을 로드하지 않고도 이를 볼 수 있어야 한다면 manifest `channelEnvVars`를 사용하세요.

### Hook 순서 및 사용법

모델/provider Plugins의 경우 OpenClaw는 대략 다음 순서로 hook을 호출합니다.
"언제 사용할지" 열은 빠른 판단 가이드입니다.

| #   | Hook                              | 수행하는 작업                                                                                                  | 사용 시점                                                                                                                                      |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | `models.json` 생성 중 `models.providers`에 provider config 게시                                               | provider가 카탈로그 또는 base URL 기본값을 소유하는 경우                                                                                      |
| 2   | `applyConfigDefaults`             | config 구체화 중 provider 소유 전역 config 기본값 적용                                                        | 기본값이 인증 모드, env, 또는 provider 모델 패밀리 의미론에 따라 달라지는 경우                                                                |
| --  | _(내장 모델 조회)_                | OpenClaw가 먼저 일반 레지스트리/카탈로그 경로를 시도함                                                        | _(Plugin hook 아님)_                                                                                                                           |
| 3   | `normalizeModelId`                | 조회 전에 레거시 또는 preview 모델 ID 별칭 정규화                                                             | 정규 모델 확인 전에 provider가 별칭 정리를 소유하는 경우                                                                                       |
| 4   | `normalizeTransport`              | 일반 모델 조립 전에 provider 패밀리 `api` / `baseUrl` 정규화                                                  | 동일한 전송 패밀리의 커스텀 provider ID에 대해 provider가 전송 정리를 소유하는 경우                                                           |
| 5   | `normalizeConfig`                 | 런타임/provider 확인 전에 `models.providers.<id>` 정규화                                                      | 정규화가 Plugin과 함께 있어야 하는 config 정리가 필요한 경우. 번들 Google 패밀리 helper도 지원되는 Google config 항목의 백스톱 역할을 함   |
| 6   | `applyNativeStreamingUsageCompat` | config providers에 네이티브 streaming-usage 호환성 재작성 적용                                               | provider가 엔드포인트 기반 네이티브 streaming usage 메타데이터 수정이 필요한 경우                                                             |
| 7   | `resolveConfigApiKey`             | 런타임 인증 로드 전에 config provider용 env-marker auth 해결                                                 | provider 소유 env-marker API 키 해결이 필요한 경우. `amazon-bedrock`도 여기에 내장 AWS env-marker resolver를 가짐                           |
| 8   | `resolveSyntheticAuth`            | 평문을 영속 저장하지 않고 로컬/자체 호스팅 또는 config 기반 auth를 노출                                      | provider가 synthetic/local 자격 증명 마커로 동작할 수 있는 경우                                                                                |
| 9   | `resolveExternalAuthProfiles`     | provider 소유 외부 auth profile을 오버레이. CLI/app 소유 자격 증명의 기본 `persistence`는 `runtime-only`    | 복사된 refresh token을 영속 저장하지 않고 외부 auth 자격 증명을 재사용하는 경우. manifest에 `contracts.externalAuthProviders`를 선언        |
| 10  | `shouldDeferSyntheticProfileAuth` | 저장된 synthetic profile placeholder의 우선순위를 env/config 기반 auth 뒤로 낮춤                              | 우선순위를 갖지 않아야 하는 synthetic placeholder profile을 provider가 저장하는 경우                                                           |
| 11  | `resolveDynamicModel`             | 아직 로컬 레지스트리에 없는 provider 소유 모델 ID에 대한 동기 fallback                                       | provider가 임의의 업스트림 모델 ID를 허용하는 경우                                                                                             |
| 12  | `prepareDynamicModel`             | 비동기 워밍업 후 `resolveDynamicModel` 재실행                                                                 | 알 수 없는 ID를 확인하기 전에 provider가 네트워크 메타데이터를 필요로 하는 경우                                                                |
| 13  | `normalizeResolvedModel`          | 임베디드 러너가 확인된 모델을 사용하기 전 최종 재작성                                                        | provider가 전송 재작성을 필요로 하지만 여전히 코어 전송을 사용하는 경우                                                                       |
| 14  | `contributeResolvedModelCompat`   | 다른 호환 전송 뒤에 있는 vendor 모델에 대한 compat 플래그 제공                                               | provider를 인계받지 않으면서 프록시 전송에서 자기 모델을 인식해야 하는 경우                                                                    |
| 15  | `capabilities`                    | 공유 코어 로직에서 사용하는 provider 소유 transcript/tooling 메타데이터                                      | provider에 transcript/provider 패밀리별 특성이 필요한 경우                                                                                     |
| 16  | `normalizeToolSchemas`            | 임베디드 러너가 보기 전에 도구 스키마 정규화                                                                  | provider에 전송 패밀리별 스키마 정리가 필요한 경우                                                                                             |
| 17  | `inspectToolSchemas`              | 정규화 후 provider 소유 스키마 diagnostics 노출                                                              | 코어에 provider별 규칙을 추가하지 않고 keyword 경고를 제공하려는 경우                                                                          |
| 18  | `resolveReasoningOutputMode`      | 네이티브 vs 태그 기반 reasoning-output 계약 선택                                                             | 네이티브 필드 대신 tagged reasoning/final output이 필요한 경우                                                                                 |
| 19  | `prepareExtraParams`              | 일반 스트림 옵션 래퍼 전에 요청 파라미터 정규화                                                              | provider에 기본 요청 파라미터 또는 provider별 파라미터 정리가 필요한 경우                                                                      |
| 20  | `createStreamFn`                  | 일반 스트림 경로를 완전히 커스텀 전송으로 교체                                                               | provider에 래퍼만이 아니라 커스텀 wire protocol이 필요한 경우                                                                                  |
| 21  | `wrapStreamFn`                    | 일반 래퍼 적용 후 스트림 래퍼                                                                                 | 커스텀 전송 없이 요청 헤더/본문/모델 호환성 래퍼가 필요한 경우                                                                                 |
| 22  | `resolveTransportTurnState`       | 네이티브 턴별 전송 헤더 또는 메타데이터 첨부                                                                 | 일반 전송이 provider 네이티브 턴 ID를 보내도록 하려는 경우                                                                                     |
| 23  | `resolveWebSocketSessionPolicy`   | 네이티브 WebSocket 헤더 또는 세션 쿨다운 정책 첨부                                                           | 일반 WS 전송에서 세션 헤더나 fallback 정책을 조정하려는 경우                                                                                   |
| 24  | `formatApiKey`                    | auth-profile formatter: 저장된 profile을 런타임 `apiKey` 문자열로 변환                                        | provider가 추가 auth 메타데이터를 저장하고 커스텀 런타임 토큰 형태가 필요한 경우                                                               |
| 25  | `refreshOAuth`                    | 커스텀 refresh 엔드포인트 또는 refresh 실패 정책을 위한 OAuth refresh override                               | provider가 공유 `pi-ai` refresher에 맞지 않는 경우                                                                                             |
| 26  | `buildAuthDoctorHint`             | OAuth refresh 실패 시 추가되는 복구 힌트                                                                     | refresh 실패 후 provider 소유 인증 복구 가이드가 필요한 경우                                                                                   |
| 27  | `matchesContextOverflowError`     | provider 소유 컨텍스트 창 초과 매처                                                                          | 일반 heuristic이 놓치는 원시 overflow 오류가 있는 경우                                                                                         |
| 28  | `classifyFailoverReason`          | provider 소유 failover 사유 분류                                                                             | 원시 API/전송 오류를 rate-limit/overload 등으로 매핑할 수 있는 경우                                                                            |
| 29  | `isCacheTtlEligible`              | 프록시/백홀 provider용 프롬프트 캐시 정책                                                                    | 프록시별 캐시 TTL 게이팅이 필요한 경우                                                                                                         |
| 30  | `buildMissingAuthMessage`         | 일반 missing-auth 복구 메시지 대체                                                                           | provider별 missing-auth 복구 힌트가 필요한 경우                                                                                                |
| 31  | `suppressBuiltInModel`            | 오래된 업스트림 모델 억제 + 선택적 사용자 대상 오류 힌트                                                     | 오래된 업스트림 행을 숨기거나 vendor 힌트로 대체해야 하는 경우                                                                                 |
| 32  | `augmentModelCatalog`             | 탐색 후 synthetic/final 카탈로그 행 추가                                                                     | `models list`와 선택기에 synthetic forward-compat 행이 필요한 경우                                                                             |
| 33  | `resolveThinkingProfile`          | 모델별 `/think` 수준 집합, 표시 라벨, 기본값 확인                                                            | 선택된 모델에 대해 커스텀 thinking 사다리 또는 이진 라벨을 노출하는 경우                                                                       |
| 34  | `isBinaryThinking`                | 켜짐/꺼짐 reasoning 토글 호환성 hook                                                                         | provider가 이진 thinking on/off만 제공하는 경우                                                                                                |
| 35  | `supportsXHighThinking`           | `xhigh` reasoning 지원 호환성 hook                                                                           | 일부 모델에서만 `xhigh`를 허용하려는 경우                                                                                                      |
| 36  | `resolveDefaultThinkingLevel`     | 기본 `/think` 수준 호환성 hook                                                                               | 모델 패밀리에 대한 기본 `/think` 정책을 provider가 소유하는 경우
| 37  | `isModernModelRef`                | 라이브 profile 필터와 smoke 선택용 현대식 모델 매처                                                           | provider가 라이브/smoke 선호 모델 매칭을 소유하는 경우                                                                                        |
| 38  | `prepareRuntimeAuth`              | 추론 직전에 구성된 자격 증명을 실제 런타임 토큰/키로 교환                                                    | provider에 토큰 교환 또는 짧은 수명의 요청 자격 증명이 필요한 경우                                                                            |
| 39  | `resolveUsageAuth`                | `/usage` 및 관련 상태 표면용 사용량/청구 자격 증명 확인                                                       | provider에 커스텀 사용량/할당량 토큰 파싱 또는 다른 사용량 자격 증명이 필요한 경우                                                           |
| 40  | `fetchUsageSnapshot`              | auth가 확인된 후 provider별 사용량/할당량 스냅샷 가져오기 및 정규화                                           | provider별 사용량 엔드포인트 또는 페이로드 파서가 필요한 경우                                                                                 |
| 41  | `createEmbeddingProvider`         | memory/search용 provider 소유 임베딩 어댑터 빌드                                                             | memory 임베딩 동작이 provider Plugin에 속해야 하는 경우                                                                                       |
| 42  | `buildReplayPolicy`               | provider의 transcript 처리를 제어하는 replay 정책 반환                                                       | provider에 커스텀 transcript 정책(예: thinking 블록 제거)이 필요한 경우                                                                      |
| 43  | `sanitizeReplayHistory`           | 일반 transcript cleanup 후 replay 기록 재작성                                                                | 공유 Compaction helper를 넘는 provider별 replay 재작성 기능이 필요한 경우                                                                     |
| 44  | `validateReplayTurns`             | 임베디드 러너 전에 최종 replay 턴 검증 또는 재구성                                                           | provider 전송에 일반 정리 이후 더 엄격한 턴 검증이 필요한 경우                                                                                |
| 45  | `onModelSelected`                 | provider 소유 post-selection 부수 효과 실행                                                                  | 모델이 활성화될 때 provider에 telemetry 또는 provider 소유 상태가 필요한 경우                                                                 |

`normalizeModelId`, `normalizeTransport`, `normalizeConfig`는 먼저 일치한 provider Plugin을 확인한 뒤, 실제로 모델 ID나 transport/config를 변경하는 항목이 나올 때까지 다른 hook 가능 provider Plugins로 전달됩니다. 이렇게 하면 호출자가 어느 번들 Plugin이 재작성을 소유하는지 알 필요 없이 alias/compat provider shim이 계속 동작할 수 있습니다. 어떤 provider hook도 지원되는 Google 패밀리 config 항목을 재작성하지 않으면, 번들된 Google config normalizer가 여전히 해당 호환성 정리를 적용합니다.

provider에 완전한 커스텀 wire protocol 또는 커스텀 요청 실행기가 필요하다면, 그것은 다른 종류의 확장입니다. 이 hook들은 OpenClaw의 일반 추론 루프 위에서 계속 실행되는 provider 동작을 위한 것입니다.

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

번들 provider Plugins는 위 hook들을 조합해 각 vendor의 catalog, auth, thinking, replay, usage 요구에 맞춥니다. 권위 있는 hook 집합은 각 Plugin의 `extensions/` 아래에 있으며, 이 페이지는 목록을 그대로 복제하기보다 형태를 보여주는 데 목적이 있습니다.

<AccordionGroup>
  <Accordion title="통과형 카탈로그 provider">
    OpenRouter, Kilocode, Z.AI, xAI는 `catalog`와
    `resolveDynamicModel` / `prepareDynamicModel`을 등록하여 OpenClaw의 정적 카탈로그보다 먼저 업스트림 모델 ID를 노출할 수 있습니다.
  </Accordion>
  <Accordion title="OAuth 및 사용량 엔드포인트 provider">
    GitHub Copilot, Gemini CLI, ChatGPT Codex, MiniMax, Xiaomi, z.ai는
    `prepareRuntimeAuth` 또는 `formatApiKey`를 `resolveUsageAuth` +
    `fetchUsageSnapshot`과 함께 사용해 토큰 교환과 `/usage` 통합을 소유합니다.
  </Accordion>
  <Accordion title="Replay 및 transcript 정리 패밀리">
    공유된 이름 있는 패밀리(`google-gemini`, `passthrough-gemini`,
    `anthropic-by-model`, `hybrid-anthropic-openai`)를 사용하면 각 Plugin이 정리 로직을 다시 구현하는 대신 `buildReplayPolicy`를 통해 transcript 정책에 opt-in할 수 있습니다.
  </Accordion>
  <Accordion title="카탈로그 전용 provider">
    `byteplus`, `cloudflare-ai-gateway`, `huggingface`, `kimi-coding`, `nvidia`,
    `qianfan`, `synthetic`, `together`, `venice`, `vercel-ai-gateway`, `volcengine`은 `catalog`만 등록하고 공유 추론 루프를 사용합니다.
  </Accordion>
  <Accordion title="Anthropic 전용 스트림 helper">
    beta 헤더, `/fast` / `serviceTier`, `context1m`은
    일반 SDK가 아니라 Anthropic Plugin의 공개 `api.ts` / `contract-api.ts` seam
    (`wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`) 내부에 있습니다.
  </Accordion>
</AccordionGroup>

## 런타임 helper

Plugins는 `api.runtime`를 통해 선택된 코어 helper에 접근할 수 있습니다. TTS의 경우:

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

- `textToSpeech`는 파일/음성 메모 표면에 대한 일반 코어 TTS 출력 페이로드를 반환합니다.
- 코어 `messages.tts` config와 provider 선택을 사용합니다.
- PCM 오디오 버퍼 + 샘플 속도를 반환합니다. Plugins는 provider에 맞게 리샘플링/인코딩해야 합니다.
- `listVoices`는 provider별 선택 사항입니다. vendor 소유 음성 선택기 또는 setup 흐름에 사용하세요.
- 음성 목록에는 provider 인식 선택기를 위해 로캘, 성별, 성격 태그 같은 더 풍부한 메타데이터가 포함될 수 있습니다.
- 현재 telephony는 OpenAI와 ElevenLabs를 지원합니다. Microsoft는 지원하지 않습니다.

Plugins는 `api.registerSpeechProvider(...)`를 통해 음성 provider도 등록할 수 있습니다.

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

- TTS 정책, fallback, 응답 전달은 코어에 두세요.
- vendor 소유 합성 동작에는 음성 provider를 사용하세요.
- 레거시 Microsoft `edge` 입력은 `microsoft` provider ID로 정규화됩니다.
- 권장되는 소유 모델은 회사 중심입니다. OpenClaw가 이러한 capability 계약을 추가함에 따라 하나의 vendor Plugin이 텍스트, 음성, 이미지, 향후 미디어 provider를 모두 소유할 수 있습니다.

이미지/오디오/비디오 이해의 경우, Plugins는 일반 key/value bag 대신 하나의 타입 지정
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

- 오케스트레이션, fallback, config, 채널 연결은 코어에 두세요.
- vendor 동작은 provider Plugin에 두세요.
- 확장은 타입 지정된 상태를 유지해야 합니다: 새로운 선택적 메서드, 새로운 선택적 결과 필드, 새로운 선택적 capability.
- 비디오 생성도 이미 같은 패턴을 따릅니다.
  - 코어가 capability 계약과 런타임 helper를 소유
  - vendor Plugins는 `api.registerVideoGenerationProvider(...)`를 등록
  - 기능/채널 Plugins는 `api.runtime.videoGeneration.*`를 소비

media-understanding 런타임 helper의 경우 Plugins는 다음을 호출할 수 있습니다.

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

오디오 전사의 경우 Plugins는 media-understanding 런타임 또는 이전 STT 별칭을 사용할 수 있습니다.

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // MIME을 안정적으로 추론할 수 없을 때 선택 사항:
  mime: "audio/ogg",
});
```

참고:

- `api.runtime.mediaUnderstanding.*`는 이미지/오디오/비디오 이해를 위한 권장 공유 표면입니다.
- 코어 media-understanding 오디오 config(`tools.media.audio`)와 provider fallback 순서를 사용합니다.
- 전사 출력이 생성되지 않으면(예: 건너뜀/지원되지 않는 입력) `{ text: undefined }`를 반환합니다.
- `api.runtime.stt.transcribeAudioFile(...)`는 호환성 별칭으로 계속 유지됩니다.

Plugins는 `api.runtime.subagent`를 통해 백그라운드 하위 에이전트 실행도 시작할 수 있습니다.

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

- `provider`와 `model`은 선택적인 실행별 override이며, 영속적인 세션 변경이 아닙니다.
- OpenClaw는 신뢰된 호출자에 대해서만 이러한 override 필드를 적용합니다.
- Plugin 소유 fallback 실행의 경우 운영자는 `plugins.entries.<id>.subagent.allowModelOverride: true`로 opt-in해야 합니다.
- 신뢰된 Plugins를 특정 정규 `provider/model` 대상 또는 모든 대상을 명시적으로 허용하는 `"*"`로 제한하려면 `plugins.entries.<id>.subagent.allowedModels`를 사용하세요.
- 신뢰되지 않은 Plugin 하위 에이전트 실행도 동작하지만, override 요청은 조용히 fallback되는 대신 거부됩니다.

웹 검색의 경우 Plugins는 에이전트 도구 연결 내부로 들어가는 대신 공유 런타임 helper를 사용할 수 있습니다.

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

Plugins는 `api.registerWebSearchProvider(...)`를 통해 웹 검색 provider도 등록할 수 있습니다.

참고:

- provider 선택, 자격 증명 해결, 공유 요청 의미는 코어에 두세요.
- vendor별 검색 전송에는 웹 검색 provider를 사용하세요.
- `api.runtime.webSearch.*`는 에이전트 도구 래퍼에 의존하지 않고 검색 동작이 필요한 기능/채널 Plugins를 위한 권장 공유 표면입니다.

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

- `generate(...)`: 구성된 이미지 생성 provider 체인을 사용해 이미지를 생성합니다.
- `listProviders(...)`: 사용 가능한 이미지 생성 provider와 해당 capability를 나열합니다.

## Gateway HTTP 경로

Plugins는 `api.registerHttpRoute(...)`로 HTTP 엔드포인트를 노출할 수 있습니다.

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

경로 필드:

- `path`: Gateway HTTP 서버 아래의 경로
- `auth`: 필수. 일반 Gateway 인증이 필요하면 `"gateway"`, Plugin 관리 인증/Webhook 검증이면 `"plugin"` 사용
- `match`: 선택 사항. `"exact"`(기본값) 또는 `"prefix"`
- `replaceExisting`: 선택 사항. 같은 Plugin이 자신의 기존 경로 등록을 교체할 수 있게 함
- `handler`: 경로가 요청을 처리했으면 `true` 반환

참고:

- `api.registerHttpHandler(...)`는 제거되었으며 Plugin 로드 오류를 발생시킵니다. 대신 `api.registerHttpRoute(...)`를 사용하세요.
- Plugin 경로는 `auth`를 명시적으로 선언해야 합니다.
- 정확한 `path + match` 충돌은 `replaceExisting: true`가 없는 한 거부되며, 한 Plugin이 다른 Plugin의 경로를 교체할 수는 없습니다.
- 서로 다른 `auth` 수준의 겹치는 경로는 거부됩니다. `exact`/`prefix` fallthrough 체인은 같은 auth 수준에서만 유지하세요.
- `auth: "plugin"` 경로는 operator 런타임 범위를 자동으로 받지 않습니다. 특권 있는 Gateway helper 호출이 아니라 Plugin 관리 Webhook/서명 검증용입니다.
- `auth: "gateway"` 경로는 Gateway 요청 런타임 범위 안에서 실행되지만, 이 범위는 의도적으로 보수적입니다.
  - 공유 시크릿 bearer 인증(`gateway.auth.mode = "token"` / `"password"`)은 호출자가 `x-openclaw-scopes`를 보내더라도 Plugin 경로 런타임 범위를 `operator.write`에 고정합니다
  - 신뢰된 ID 포함 HTTP 모드(예: `trusted-proxy` 또는 private ingress에서의 `gateway.auth.mode = "none"`)는 헤더가 명시적으로 존재할 때만 `x-openclaw-scopes`를 따릅니다
  - 이러한 ID 포함 Plugin 경로 요청에서 `x-openclaw-scopes`가 없으면 런타임 범위는 `operator.write`로 대체됩니다
- 실용적인 규칙: Gateway 인증 Plugin 경로가 암묵적인 관리자 표면이라고 가정하지 마세요. 경로에 관리자 전용 동작이 필요하면 ID 포함 인증 모드를 요구하고 명시적인 `x-openclaw-scopes` 헤더 계약을 문서화하세요.

## Plugin SDK import 경로

새 Plugins를 작성할 때는 단일 덩어리인 `openclaw/plugin-sdk` 루트 배럴 대신 좁은 SDK 하위 경로를 사용하세요. 핵심 하위 경로:

| 하위 경로                            | 목적                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 등록 기본 요소                              |
| `openclaw/plugin-sdk/channel-core`  | 채널 entry/build helper                            |
| `openclaw/plugin-sdk/core`          | 일반 공유 helper 및 umbrella 계약                  |
| `openclaw/plugin-sdk/config-schema` | 루트 `openclaw.json` Zod 스키마 (`OpenClawSchema`) |

채널 Plugins는 좁은 seam 패밀리에서 선택합니다 — `channel-setup`,
`setup-runtime`, `setup-adapter-runtime`, `setup-tools`, `channel-pairing`,
`channel-contract`, `channel-feedback`, `channel-inbound`, `channel-lifecycle`,
`channel-reply-pipeline`, `command-auth`, `secret-input`, `webhook-ingress`,
`channel-targets`, `channel-actions`.
승인 동작은 관련 없는 Plugin 필드들에 걸쳐 섞는 대신 하나의 `approvalCapability` 계약으로 통합해야 합니다. [Channel plugins](/ko/plugins/sdk-channel-plugins)를 참조하세요.

런타임 및 config helper는 일치하는 `*-runtime` 하위 경로 아래에 있습니다
(`approval-runtime`, `config-runtime`, `infra-runtime`, `agent-runtime`,
`lazy-runtime`, `directory-runtime`, `text-runtime`, `runtime-store` 등).

<Info>
`openclaw/plugin-sdk/channel-runtime`은 더 이상 권장되지 않습니다. 이는 오래된 Plugins를 위한 호환성 shim입니다. 새 코드는 더 좁은 일반 기본 요소를 import해야 합니다.
</Info>

리포지토리 내부 entry point(번들 Plugin 패키지 루트별):

- `index.js` — 번들 Plugin entry
- `api.js` — helper/types 배럴
- `runtime-api.js` — 런타임 전용 배럴
- `setup-entry.js` — setup Plugin entry

외부 Plugins는 `openclaw/plugin-sdk/*` 하위 경로만 import해야 합니다. 코어나 다른 Plugin에서 다른 Plugin 패키지의 `src/*`를 절대 import하지 마세요.
Facade로 로드된 entry point는 활성 런타임 config 스냅샷이 있으면 그것을 우선 사용하고, 없으면 디스크의 해결된 config 파일로 대체됩니다.

`image-generation`, `media-understanding`, `speech` 같은 capability별 하위 경로는 번들 Plugins가 현재 사용하고 있기 때문에 존재합니다. 이들이 자동으로 장기적으로 고정된 외부 계약이 되는 것은 아닙니다. 이를 사용할 때는 관련 SDK 참조 페이지를 확인하세요.

## 메시지 도구 스키마

Plugins는 반응, 읽음, 투표 같은 메시지가 아닌 기본 요소에 대해 채널별 `describeMessageTool(...)` 스키마 기여를 소유해야 합니다.
공유 전송 프레젠테이션은 provider 네이티브 button, component, block, card 필드 대신 일반 `MessagePresentation` 계약을 사용해야 합니다.
계약, fallback 규칙, provider 매핑, Plugin 작성자 체크리스트는 [Message Presentation](/ko/plugins/message-presentation)을 참조하세요.

전송 가능한 Plugins는 메시지 capability를 통해 자신이 렌더링할 수 있는 항목을 선언합니다.

- 의미 기반 프레젠테이션 블록(`text`, `context`, `divider`, `buttons`, `select`)용 `presentation`
- 고정 전달 요청용 `delivery-pin`

코어는 프레젠테이션을 네이티브로 렌더링할지 텍스트로 저하할지 결정합니다.
일반 메시지 도구에서 provider 네이티브 UI 탈출구를 노출하지 마세요.
레거시 네이티브 스키마용 deprecated SDK helper는 기존 서드파티 Plugins를 위해 계속 내보내지만, 새 Plugins는 이를 사용하지 않아야 합니다.

## 채널 대상 확인

채널 Plugins는 채널별 대상 의미를 소유해야 합니다. 공유 outbound 호스트는 일반적으로 유지하고 provider 규칙에는 messaging adapter 표면을 사용하세요.

- `messaging.inferTargetChatType({ to })`는 디렉터리 조회 전에 정규화된 대상을 `direct`, `group`, `channel` 중 무엇으로 취급할지 결정합니다.
- `messaging.targetResolver.looksLikeId(raw, normalized)`는 입력이 디렉터리 검색 대신 바로 ID 유사 확인으로 넘어가야 하는지 코어에 알려줍니다.
- `messaging.targetResolver.resolveTarget(...)`은 정규화 후 또는 디렉터리 누락 후 코어가 최종 provider 소유 확인이 필요할 때 사용하는 Plugin fallback입니다.
- `messaging.resolveOutboundSessionRoute(...)`는 대상이 확인된 뒤 provider별 세션 경로 구성을 소유합니다.

권장 분리 방식:

- peer/group 검색 전에 일어나야 하는 범주 결정에는 `inferTargetChatType` 사용
- "이 값을 명시적/네이티브 대상 ID로 취급" 검사에는 `looksLikeId` 사용
- 광범위한 디렉터리 검색이 아니라 provider별 정규화 fallback에는 `resolveTarget` 사용
- 채팅 ID, 스레드 ID, JID, handle, room ID 같은 provider 네이티브 ID는 일반 SDK 필드가 아니라 `target` 값 또는 provider별 params 내부에 유지

## Config 기반 디렉터리

config에서 디렉터리 항목을 파생하는 Plugins는 해당 로직을 Plugin 내부에 두고
`openclaw/plugin-sdk/directory-runtime`의 공유 helper를 재사용해야 합니다.

다음처럼 config 기반 peer/group이 필요한 채널에 사용하세요.

- 허용 목록 기반 DM peer
- 구성된 채널/그룹 맵
- 계정 범위 정적 디렉터리 fallback

`directory-runtime`의 공유 helper는 일반 작업만 처리합니다.

- 쿼리 필터링
- 제한 적용
- deduping/정규화 helper
- `ChannelDirectoryEntry[]` 빌드

채널별 계정 검사와 ID 정규화는 Plugin 구현에 남겨 두어야 합니다.

## Provider 카탈로그

provider Plugins는 `registerProvider({ catalog: { run(...) { ... } } })`로
추론용 모델 카탈로그를 정의할 수 있습니다.

`catalog.run(...)`은 OpenClaw가 `models.providers`에 기록하는 것과 같은 형태를 반환합니다.

- 하나의 provider 항목일 때 `{ provider }`
- 여러 provider 항목일 때 `{ providers }`

provider별 모델 ID, base URL 기본값, auth 게이트 모델 메타데이터를 Plugin이 소유하는 경우 `catalog`를 사용하세요.

`catalog.order`는 Plugin 카탈로그가 OpenClaw의 내장 암시적 provider에 비해 언제 병합되는지 제어합니다.

- `simple`: 단순 API 키 또는 env 기반 provider
- `profile`: auth profile이 있을 때 나타나는 provider
- `paired`: 여러 관련 provider 항목을 합성하는 provider
- `late`: 마지막 패스, 다른 암시적 provider 이후

나중 provider가 키 충돌에서 승리하므로, Plugins는 같은 provider ID를 가진 내장 provider 항목을 의도적으로 override할 수 있습니다.

호환성:

- `discovery`는 여전히 레거시 별칭으로 동작
- `catalog`와 `discovery`가 모두 등록되면 OpenClaw는 `catalog`를 사용

## 읽기 전용 채널 검사

Plugin이 채널을 등록하는 경우, `resolveAccount(...)`와 함께
`plugin.config.inspectAccount(cfg, accountId)`를 구현하는 것이 좋습니다.

이유:

- `resolveAccount(...)`는 런타임 경로입니다. 자격 증명이 완전히 구체화되었다고 가정할 수 있으며, 필요한 시크릿이 없으면 빠르게 실패해도 됩니다.
- `openclaw status`, `openclaw status --all`, `openclaw channels status`, `openclaw channels resolve`, doctor/config 복구 흐름 같은 읽기 전용 명령 경로는 구성을 설명하기 위해 런타임 자격 증명을 구체화할 필요가 없어야 합니다.

권장 `inspectAccount(...)` 동작:

- 설명적인 계정 상태만 반환
- `enabled`와 `configured` 유지
- 관련이 있다면 자격 증명 source/status 필드 포함, 예:
  - `tokenSource`, `tokenStatus`
  - `botTokenSource`, `botTokenStatus`
  - `appTokenSource`, `appTokenStatus`
  - `signingSecretSource`, `signingSecretStatus`
- 읽기 전용 사용 가능성을 보고하기 위해 원시 토큰 값을 반환할 필요는 없습니다.
  상태 스타일 명령에는 `tokenStatus: "available"`(및 일치하는 source 필드)이면 충분합니다.
- 자격 증명이 SecretRef를 통해 구성되었지만 현재 명령 경로에서 사용할 수 없으면 `configured_unavailable`을 사용하세요.

이렇게 하면 읽기 전용 명령이 계정을 구성되지 않은 것으로 잘못 보고하거나 충돌하는 대신 "이 명령 경로에서는 구성되었지만 사용할 수 없음"을 보고할 수 있습니다.

## 패키지 pack

Plugin 디렉터리에는 `openclaw.extensions`가 들어 있는 `package.json`이 포함될 수 있습니다.

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

각 항목은 하나의 Plugin이 됩니다. pack이 여러 extension을 나열하면 Plugin ID는
`name/<fileBase>`가 됩니다.

Plugin이 npm 종속성을 import한다면 해당 디렉터리에서 설치해
`node_modules`를 사용할 수 있게 하세요(`npm install` / `pnpm install`).

보안 가드레일: 모든 `openclaw.extensions` 항목은 심볼릭 링크 해결 후에도 Plugin
디렉터리 내부에 머물러야 합니다. 패키지 디렉터리를 벗어나는 항목은 거부됩니다.

보안 참고: `openclaw plugins install`은 Plugin 종속성을
프로젝트 로컬 `npm install --omit=dev --ignore-scripts`로 설치합니다(수명 주기 스크립트 없음,
런타임에 dev 종속성 없음). 전역 npm 설치 설정 상속은 무시됩니다.
Plugin 종속성 트리는 "순수 JS/TS"로 유지하고 `postinstall` 빌드가 필요한 패키지는 피하세요.

선택 사항: `openclaw.setupEntry`는 가벼운 setup 전용 모듈을 가리킬 수 있습니다.
OpenClaw가 비활성화된 채널 Plugin의 setup 표면이 필요할 때, 또는 채널 Plugin이 활성화되었지만 아직 구성되지 않았을 때는 전체 Plugin entry 대신 `setupEntry`를 로드합니다. 이렇게 하면 메인 Plugin entry가 도구, hook, 기타 런타임 전용 코드를 함께 연결할 때 시작과 setup이 더 가벼워집니다.

선택 사항: `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`은 채널 Plugin이 이미 구성된 경우에도 Gateway의 pre-listen 시작 단계에서 동일한 `setupEntry` 경로를 선택하게 할 수 있습니다.

이 옵션은 `setupEntry`가 Gateway가 리슨을 시작하기 전에 반드시 존재해야 하는 시작 표면을 완전히 다룰 때만 사용하세요. 실제로는 setup entry가 시작에 의존하는 모든 채널 소유 capability를 등록해야 함을 의미합니다. 예:

- 채널 등록 자체
- Gateway가 리슨을 시작하기 전에 사용 가능해야 하는 모든 HTTP 경로
- 같은 시간 창에서 존재해야 하는 모든 Gateway 메서드, 도구, 서비스

필수 시작 capability를 여전히 전체 entry가 소유하고 있다면 이 플래그를 활성화하지 마세요. 기본 동작을 유지하고 시작 중 OpenClaw가 전체 entry를 로드하도록 두세요.

번들 채널은 전체 채널 런타임이 로드되기 전에 코어가 조회할 수 있는 setup 전용 계약 표면 helper도 게시할 수 있습니다. 현재 setup 승격 표면은 다음과 같습니다.

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

코어는 레거시 단일 계정 채널 config를 전체 Plugin entry를 로드하지 않고 `channels.<id>.accounts.*`로 승격해야 할 때 이 표면을 사용합니다.
Matrix가 현재 번들 예시입니다. 이름 있는 계정이 이미 존재할 때 인증/bootstrap 키만 이름 있는 승격 계정으로 이동하며, 항상 `accounts.default`를 만드는 대신 구성된 비정규 default-account 키를 유지할 수 있습니다.

이 setup 패치 어댑터는 번들 계약 표면 탐색을 지연 상태로 유지합니다. import 시점은 가볍게 유지되고, 승격 표면은 모듈 import 시 번들 채널 시작을 다시 진입하는 대신 최초 사용 시에만 로드됩니다.

이러한 시작 표면에 Gateway RPC 메서드가 포함된다면, Plugin별 접두사 아래에 두세요.
코어 관리자 네임스페이스(`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`)는 예약되어 있으며, Plugin이 더 좁은 범위를 요청하더라도 항상 `operator.admin`으로 확인됩니다.

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

채널 Plugins는 `openclaw.channel`을 통해 setup/discovery 메타데이터를,
`openclaw.install`을 통해 설치 힌트를 광고할 수 있습니다. 이렇게 하면 코어 카탈로그를 데이터 없는 상태로 유지할 수 있습니다.

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
      "blurb": "Nextcloud Talk Webhook 봇을 통한 자체 호스팅 채팅.",
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

- `detailLabel`: 더 풍부한 카탈로그/상태 표면용 보조 라벨
- `docsLabel`: 문서 링크의 링크 텍스트 override
- `preferOver`: 이 카탈로그 항목이 우선해야 하는 더 낮은 우선순위 Plugin/채널 ID
- `selectionDocsPrefix`, `selectionDocsOmitLabel`, `selectionExtras`: 선택 표면 복사용 제어
- `markdownCapable`: outbound 포맷 결정 시 채널을 markdown 가능으로 표시
- `exposure.configured`: `false`로 설정하면 구성된 채널 목록 표면에서 채널 숨김
- `exposure.setup`: `false`로 설정하면 대화형 setup/configure 선택기에서 채널 숨김
- `exposure.docs`: 문서 탐색 표면에서 채널을 내부/비공개로 표시
- `showConfigured` / `showInSetup`: 호환성을 위해 여전히 허용되는 레거시 별칭. `exposure`를 사용하는 것이 좋음
- `quickstartAllowFrom`: 표준 빠른 시작 `allowFrom` 흐름에 채널을 opt-in
- `forceAccountBinding`: 계정이 하나만 있어도 명시적 계정 바인딩 요구
- `preferSessionLookupForAnnounceTarget`: announce 대상 확인 시 세션 조회를 우선

OpenClaw는 **외부 채널 카탈로그**(예: MPM
레지스트리 내보내기)도 병합할 수 있습니다. 다음 위치 중 하나에 JSON 파일을 두세요.

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

또는 `OPENCLAW_PLUGIN_CATALOG_PATHS`(또는 `OPENCLAW_MPM_CATALOG_PATHS`)를 하나 이상의 JSON 파일로 지정하세요(쉼표/세미콜론/`PATH` 구분). 각 파일은
`{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`를 포함해야 합니다. 파서는 `"entries"` 키에 대한 레거시 별칭으로 `"packages"` 또는 `"plugins"`도 허용합니다.

생성된 채널 카탈로그 항목과 provider 설치 카탈로그 항목은 원시 `openclaw.install` 블록 옆에 정규화된 설치 소스 정보를 노출합니다. 정규화된 정보는 npm spec이 정확한 버전인지 부동 선택자인지, 예상 무결성 메타데이터가 있는지, 로컬 소스 경로도 사용 가능한지를 식별합니다. 카탈로그/패키지 ID를 알 수 있을 때, 정규화된 정보는 파싱된 npm 패키지 이름이 그 ID에서 벗어나는 경우 경고합니다. 또한 `defaultChoice`가 잘못되었거나 사용할 수 없는 소스를 가리킬 때, 그리고 유효한 npm 소스 없이 npm 무결성 메타데이터가 존재할 때도 경고합니다. 소비자는 `installSource`를 추가적인 선택 필드로 취급해야 하므로, 수동으로 만든 항목과 카탈로그 shim이 이를 합성할 필요는 없습니다.
이렇게 하면 온보딩과 diagnostics가 Plugin 런타임을 import하지 않고도 소스 plane 상태를 설명할 수 있습니다.

공식 외부 npm 항목은 정확한 `npmSpec`과 `expectedIntegrity`를 사용하는 것이 좋습니다. 이름만 있는 패키지와 dist-tag도 호환성을 위해 여전히 동작하지만, 소스 plane 경고를 노출하므로 카탈로그는 기존 Plugins를 깨뜨리지 않고도 고정되고 무결성이 확인된 설치로 이동할 수 있습니다.
온보딩이 로컬 카탈로그 경로에서 설치할 때는, 가능하면 `source: "path"`와 workspace 상대
`sourcePath`를 가진 관리 Plugin 인덱스 항목을 기록합니다. 절대 운영 로드 경로는
`plugins.load.paths`에 남고, 설치 기록은 로컬 워크스테이션 경로를 장기 config에 중복 저장하지 않습니다. 이렇게 하면 로컬 개발 설치가 두 번째 원시 파일 시스템 경로 노출 표면을 추가하지 않고도 소스 plane diagnostics에 계속 표시됩니다. 영속된 `plugins/installs.json` Plugin 인덱스는 설치 소스에 대한 source of truth이며, Plugin 런타임 모듈을 로드하지 않고도 새로 고칠 수 있습니다. `installRecords` 맵은 Plugin manifest가 없거나 유효하지 않을 때도 영속적이며, `plugins` 배열은 다시 빌드 가능한 manifest/cache 보기입니다.

## Context engine Plugins

context engine Plugins는 수집, 조립, Compaction을 위한 세션 컨텍스트 오케스트레이션을 소유합니다. Plugin에서
`api.registerContextEngine(id, factory)`로 등록한 뒤, `plugins.slots.contextEngine`으로 활성 엔진을 선택하세요.

기본 컨텍스트 파이프라인을 단순히 memory 검색이나 hook으로 확장하는 것이 아니라 대체하거나 확장해야 할 때 사용하세요.

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
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

엔진이 Compaction 알고리즘을 **소유하지 않는다면**, `compact()`를
구현한 상태로 유지하고 명시적으로 위임하세요.

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
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

## 새 capability 추가하기

Plugin이 현재 API에 맞지 않는 동작을 필요로 한다면, 비공개 reach-in으로
Plugin 시스템을 우회하지 마세요. 누락된 capability를 추가하세요.

권장 순서:

1. 코어 계약 정의
   코어가 소유해야 할 공유 동작이 무엇인지 결정합니다: 정책, fallback, config 병합,
   수명 주기, 채널 대상 의미, 런타임 helper 형태.
2. 타입 지정 Plugin 등록/런타임 표면 추가
   `OpenClawPluginApi` 및/또는 `api.runtime`을 가장 작지만 유용한
   타입 지정 capability 표면으로 확장합니다.
3. 코어 + 채널/기능 소비자 연결
   채널과 기능 Plugins는 vendor 구현을 직접 import하지 말고 코어를 통해 새 capability를 소비해야 합니다.
4. vendor 구현 등록
   그다음 vendor Plugins가 capability에 대해 자신의 백엔드를 등록합니다.
5. 계약 범위 추가
   시간이 지나도 소유권과 등록 형태가 명시적으로 유지되도록 테스트를 추가합니다.

이것이 OpenClaw가 특정 provider의 세계관에 하드코딩되지 않으면서도 분명한 방향성을 유지하는 방식입니다. 구체적인 파일 체크리스트와 예시는 [Capability Cookbook](/ko/plugins/architecture)를 참조하세요.

### Capability 체크리스트

새 capability를 추가할 때 구현은 보통 다음 표면을 함께 건드려야 합니다.

- `src/<capability>/types.ts`의 코어 계약 타입
- `src/<capability>/runtime.ts`의 코어 러너/런타임 helper
- `src/plugins/types.ts`의 Plugin API 등록 표면
- `src/plugins/registry.ts`의 Plugin 레지스트리 연결
- 기능/채널 Plugins가 이를 소비해야 하는 경우 `src/plugins/runtime/*`의 Plugin 런타임 노출
- `src/test-utils/plugin-registration.ts`의 캡처/테스트 helper
- `src/plugins/contracts/registry.ts`의 소유권/계약 assertion
- `docs/`의 운영자/Plugin 문서

이 중 하나가 빠져 있다면, 대개 capability가 아직 완전히 통합되지 않았다는 신호입니다.

### Capability 템플릿

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

// feature/channel plugins용 공유 런타임 helper
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

계약 테스트 패턴:

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

이렇게 하면 규칙이 단순해집니다.

- 코어는 capability 계약 + 오케스트레이션 소유
- vendor Plugins는 vendor 구현 소유
- 기능/채널 Plugins는 런타임 helper 소비
- 계약 테스트는 소유권을 명시적으로 유지

## 관련 항목

- [Plugin architecture](/ko/plugins/architecture) — 공개 capability 모델과 shape
- [Plugin SDK subpaths](/ko/plugins/sdk-subpaths)
- [Plugin SDK setup](/ko/plugins/sdk-setup)
- [Building plugins](/ko/plugins/building-plugins)
