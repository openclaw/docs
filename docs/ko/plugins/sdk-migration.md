---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 경고가 표시됩니다
    - OPENCLAW_EXTENSION_API_DEPRECATED 경고가 표시됩니다
    - OpenClaw 2026.4.25 이전에는 api.registerEmbeddedExtensionFactory를 사용했습니다.
    - Plugin을 최신 Plugin 아키텍처로 업데이트하고 있습니다
    - 외부 OpenClaw 플러그인을 유지 관리합니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 Plugin SDK로 마이그레이션합니다
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-07-12T15:31:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 805fa6b1492cec8bb0e4967a6b6606c91016a43ec5a3eb7d048e83aa7721704e
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw는 광범위한 이전 버전 호환성 계층을 작고 목적이 명확한 import로 구성된 현대적인 Plugin 아키텍처로 교체했습니다. Plugin이 이 변경 전에 만들어졌다면 이 가이드를 따라 현재 계약으로 마이그레이션할 수 있습니다.

## 변경 사항

이전에는 제한이 거의 없는 두 import 표면을 통해 Plugin이 단일 진입점에서 거의 모든 항목에 접근할 수 있었습니다.

- **`openclaw/plugin-sdk/compat`** - 새로운 아키텍처를 구축하는 동안 기존 훅 기반 Plugin이 계속 작동하도록 수십 개의 헬퍼를 다시 export했습니다.
- **`openclaw/plugin-sdk/infra-runtime`** - 시스템 이벤트, Heartbeat 상태, 전송 큐, fetch/프록시 헬퍼, 파일 헬퍼, 승인 타입 및 서로 관련 없는 유틸리티를 혼합한 광범위한 배럴입니다.
- **`openclaw/plugin-sdk/config-runtime`** - 마이그레이션 기간에 폐기 예정인 직접 로드/쓰기 헬퍼를 계속 포함했던 광범위한 구성 배럴입니다.
- **`openclaw/extension-api`** - 내장 에이전트 실행기 같은 호스트 측 헬퍼에 Plugin이 직접 접근할 수 있게 한 브리지입니다.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` 같은 내장 실행기 이벤트를 관찰하던, 이제 제거된 내장 실행기 전용 훅입니다. 대신 에이전트 도구 결과 미들웨어를 사용하십시오([내장 도구 결과 확장을 미들웨어로 마이그레이션](#how-to-migrate) 참조).

이러한 표면은 **폐기 예정**입니다. 아직 작동하지만 새 Plugin은 이를 사용해서는 안 되며, 기존 Plugin은 다음 메이저 릴리스에서 제거되기 전에 마이그레이션해야 합니다. `registerEmbeddedExtensionFactory`는 이미 제거되었으며 레거시 등록은 더 이상 로드되지 않습니다.

<Warning>
  이전 버전 호환성 계층은 향후 메이저 릴리스에서 제거됩니다.
  이러한 표면에서 계속 import하는 Plugin은 제거 후 작동하지 않습니다.
</Warning>

OpenClaw는 대체 기능을 도입하는 동일한 변경에서 문서화된 Plugin 동작을 제거하거나 다르게 해석하지 않습니다. 계약을 깨는 변경에는 먼저 호환성 어댑터, 진단, 문서 및 폐기 유예 기간을 적용합니다. 이는 SDK import, 매니페스트 필드, 설정 API, 훅 및 런타임 등록 동작에 적용됩니다.

### 이유

- **느린 시작** - 헬퍼 하나를 import하면 관련 없는 수십 개의 모듈까지 로드되었습니다.
- **순환 종속성** - 광범위한 재export로 인해 import 순환이 쉽게 발생했습니다.
- **불명확한 API 표면** - 안정적인 export와 내부 export를 구분할 방법이 없었습니다.

이제 각 `openclaw/plugin-sdk/<subpath>`는 문서화된 계약을 제공하는 작고 독립적인 모듈입니다.

번들 채널용 레거시 공급자 편의 연결부도 제거되었습니다. 채널 브랜드별 헬퍼 단축 기능은 비공개 모노리포 편의 기능이었으며 안정적인 Plugin 계약이 아니었습니다. 대신 범위가 좁은 범용 SDK 하위 경로를 사용하십시오. 번들 Plugin 워크스페이스 내에서는 공급자가 소유하는 헬퍼를 해당 Plugin의 `api.ts` 또는 `runtime-api.ts`에 유지하십시오.

- Anthropic은 Claude 전용 스트림 헬퍼를 자체 `api.ts` / `contract-api.ts` 연결부에 유지합니다.
- OpenAI는 공급자 빌더, 기본 모델 헬퍼 및 실시간 공급자 빌더를 자체 `api.ts`에 유지합니다.
- OpenRouter는 공급자 빌더와 온보딩/구성 헬퍼를 자체 `api.ts`에 유지합니다.

## 호환성 정책

외부 Plugin의 호환성 작업은 다음 순서를 따릅니다.

1. 새 계약을 추가합니다.
2. 호환성 어댑터를 통해 기존 동작이 계속 연결되도록 유지합니다.
3. 기존 경로와 대체 경로를 명시하는 진단 또는 경고를 표시합니다.
4. 테스트에서 두 경로를 모두 다룹니다.
5. 폐기 예정 사항과 마이그레이션 경로를 문서화합니다.
6. 공지된 마이그레이션 기간이 지난 후에만 제거하며, 일반적으로 메이저 릴리스에서 제거합니다.

매니페스트 필드가 여전히 허용된다면 문서와 진단에서 달리 안내할 때까지 계속 사용하십시오. 새 코드는 문서화된 대체 기능을 우선해야 하며, 기존 Plugin은 일반적인 마이너 릴리스 중에 중단되어서는 안 됩니다.

`pnpm plugins:boundary-report`로 현재 마이그레이션 대기열을 감사하십시오.

| 플래그                                                    | 효과                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `--summary` (또는 `pnpm plugins:boundary-report:summary`) | 전체 세부 정보 대신 간결한 개수를 표시합니다.                                         |
| `--json`                                                | 머신이 읽을 수 있는 보고서입니다.                                                       |
| `--owner <id>`                                          | 하나의 Plugin 또는 호환성 소유자로 필터링합니다.                                   |
| `--fail-on-cross-owner`                                 | 소유자 경계를 넘는 예약 SDK import가 있으면 0이 아닌 코드로 종료합니다.                             |
| `--fail-on-eligible-compat`                             | 폐기 예정 호환성 레코드의 `removeAfter` 날짜가 지났으면 0이 아닌 코드로 종료합니다. |
| `--fail-on-unclassified-unused-reserved`                | 사용되지 않는 미분류 예약 SDK 심이 있으면 0이 아닌 코드로 종료합니다.                                    |

`pnpm plugins:boundary-report:ci`는 세 가지 실패 플래그를 모두 사용해 실행됩니다. 각 호환성 레코드에는 모호한 "다음 메이저 릴리스"가 아닌 명시적인 `removeAfter` 날짜가 있습니다. 보고서는 해당 날짜별로 폐기 예정 레코드를 그룹화하고, 로컬 코드/문서 참조 수를 집계하며, 소유자 경계를 넘는 예약 SDK import를 표시하고, 비공개 메모리 호스트 SDK 브리지를 요약합니다. 예약 SDK 하위 경로에는 추적되는 소유자 사용 내역이 있어야 하며, 사용되지 않는 예약 export는 공개 SDK에서 제거해야 합니다.

## 마이그레이션 방법

<Steps>
  <Step title="런타임 구성 로드/쓰기 헬퍼 마이그레이션">
    번들 Plugin은 `api.runtime.config.loadConfig()` 및
    `api.runtime.config.writeConfigFile(...)`을 직접 호출하지 않아야 합니다.
    활성 호출 경로에 이미 전달된 구성을 우선 사용하십시오. 현재 프로세스
    스냅샷이 필요한 장기 실행 핸들러는 `api.runtime.config.current()`를 사용할 수 있습니다.
    장기 실행 에이전트 도구는 `execute` 내부에서 `ctx.getRuntimeConfig()`를 읽어야
    구성 쓰기 전에 생성된 도구도 새로 고친 구성을 볼 수 있습니다.

    구성 쓰기는 명시적인 쓰기 후 정책을 지정하여 트랜잭션 헬퍼를 통해 수행합니다.

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    변경에 완전한 Gateway 재시작이 필요하면 `afterWrite: { mode: "restart", reason: "..." }`를 사용하고, 호출자가 후속 작업을 소유하며 의도적으로 다시 로드 플래너를 억제할 때만 `afterWrite: { mode: "none", reason: "..." }`를 사용하십시오. 변형 결과에는 테스트 및 로깅을 위한 타입 지정 `followUp` 요약이 포함됩니다. 재시작을 적용하거나 예약하는 책임은 계속 Gateway에 있습니다.

    `loadConfig`와 `writeConfigFile`은 외부 Plugin을 위한 폐기 예정 호환성
    헬퍼로 유지되며 `runtime-config-load-write` 호환성 코드와 함께 한 번 경고합니다.
    번들 Plugin과 저장소 런타임 코드는 `pnpm check:deprecated-api-usage` 및
    `pnpm check:no-runtime-action-load-config`로 보호됩니다. 새로운 프로덕션 Plugin 사용은
    즉시 실패하고, 직접 구성 쓰기도 실패하며, Gateway 서버 메서드는 요청 런타임 스냅샷을
    사용해야 하고, 런타임 채널 전송/작업/클라이언트 헬퍼는 해당 경계에서 구성을 전달받아야
    하며, 장기 실행 런타임 모듈에서는 주변 `loadConfig()` 호출을 하나도 허용하지 않습니다.

    새 Plugin 코드는 광범위한 `openclaw/plugin-sdk/config-runtime`
    배럴을 피해야 합니다. 작업에 맞는 범위가 좁은 하위 경로를 사용하십시오.

    | 필요 사항 | Import |
    | --- | --- |
    | `OpenClawConfig` 같은 구성 타입 | `openclaw/plugin-sdk/config-contracts` |
    | 이미 로드된 구성 어설션 및 Plugin 진입점 구성 조회 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 현재 런타임 스냅샷 읽기 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 구성 쓰기 | `openclaw/plugin-sdk/config-mutation` |
    | 세션 저장소 헬퍼 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 테이블 구성 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 그룹 정책 런타임 헬퍼 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 비밀 입력 확인 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 모델/세션 재정의 | `openclaw/plugin-sdk/model-session-runtime` |

    번들 Plugin과 해당 테스트는 스캐너를 통해 광범위한 배럴 사용이 차단되므로
    import와 모의 객체가 필요한 동작에만 국한됩니다. 이 배럴은 외부 호환성을 위해
    계속 존재하지만 새 코드는 이에 의존해서는 안 됩니다.

  </Step>

  <Step title="내장 도구 결과 확장을 미들웨어로 마이그레이션">
    번들 Plugin은 내장 실행기 전용
    `api.registerEmbeddedExtensionFactory(...)` 도구 결과 핸들러를
    런타임 중립적인 미들웨어로 교체해야 합니다.

    ```typescript
    // OpenClaw 및 Codex 런타임 동적 도구
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    동시에 Plugin 매니페스트를 업데이트하십시오.

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    설치된 Plugin도 명시적으로 활성화되고 대상 런타임이 모두
    `contracts.agentToolResultMiddleware`에 선언된 경우 도구 결과 미들웨어를
    등록할 수 있습니다. 선언되지 않은 설치형 미들웨어 등록은 거부됩니다.

  </Step>

  <Step title="승인 네이티브 핸들러를 기능 정보로 마이그레이션">
    승인 기능을 지원하는 채널 Plugin은 `approvalCapability.nativeRuntime`과
    공유 런타임 컨텍스트 레지스트리를 통해 네이티브 승인 동작을 노출합니다.

    - `approvalCapability.handler.loadRuntime(...)`을
      `approvalCapability.nativeRuntime`으로 교체합니다.
    - 승인 전용 인증/전송을 레거시 `plugin.auth` /
      `plugin.approvals` 연결에서 `approvalCapability`로 이동합니다.
    - `ChannelPlugin.approvals`는 공개 채널 Plugin 계약에서 제거되었습니다.
      전송/네이티브/렌더링 필드를 `approvalCapability`로 이동합니다.
    - `plugin.auth`는 채널 로그인/로그아웃 흐름에만 유지됩니다. 코어는 더
      이상 여기서 승인 인증 훅을 읽지 않습니다.
    - 채널이 소유하는 런타임 객체(클라이언트, 토큰, Bolt 앱)는
      `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록합니다.
    - 네이티브 승인 핸들러에서 Plugin 소유의 재라우팅 알림을 보내지 마십시오.
      실제 전송 결과에 따른 다른 위치로의 라우팅 알림은 코어가 소유합니다.
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때는 실제
      `createPluginRuntime().channel` 표면을 제공하십시오. 부분 스텁은
      거부됩니다.

    현재 승인 기능 구조는 [채널 Plugin](/ko/plugins/sdk-channel-plugins)을
    참조하십시오.

  </Step>

  <Step title="Windows 래퍼 대체 동작 감사">
    Plugin에서 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우, 확인되지 않은 Windows
    `.cmd`/`.bat` 래퍼는 `allowShellFallback: true`를 명시적으로 전달하지 않으면
    이제 실패 시 닫힙니다.

    ```typescript
    // 이전
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 이후
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 셸을 통한 대체 동작을 의도적으로 허용하는 신뢰할 수 있는 호환성
      // 호출자에만 설정하십시오.
      allowShellFallback: true,
    });
    ```

    호출자가 셸 대체 동작에 의도적으로 의존하지 않는다면
    `allowShellFallback`을 설정하지 말고 대신 발생한 오류를 처리하십시오.

  </Step>

  <Step title="폐기 예정 import 찾기">
    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```
  </Step>

  <Step title="목적별 import로 교체">
    기존 표면의 각 export는 특정 현대식 import 경로에 매핑됩니다.

    ```typescript
    // 이전(사용 중단된 하위 호환성 계층)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 이후(현대적인 세분화된 가져오기)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    호스트 측 헬퍼의 경우 직접 가져오는 대신 주입된 Plugin 런타임을
    사용하십시오.

    ```typescript
    // 이전(사용 중단된 extension-api 브리지)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // 이후(주입된 런타임)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    다른 레거시 브리지 헬퍼에도 동일한 패턴을 적용합니다.

    | 이전 가져오기 | 현대적인 대응 항목 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 세션 저장소 헬퍼 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="광범위한 infra-runtime 가져오기 교체">
    외부 호환성을 위해 `openclaw/plugin-sdk/infra-runtime`은 여전히
    존재하지만, 새 코드에서는 실제로 필요한 세분화된 표면을 가져와야
    합니다.

    | 필요 항목 | 가져오기 |
    | --- | --- |
    | 시스템 이벤트 대기열 헬퍼 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 깨우기, 이벤트 및 가시성 헬퍼 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 보류 중인 전송 대기열 비우기 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 채널 활동 원격 측정 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 메모리 내 및 영구 저장소 기반 중복 제거 캐시 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 안전한 로컬 파일/미디어 경로 헬퍼 | `openclaw/plugin-sdk/file-access-runtime` |
    | 디스패처 인식 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 프록시 및 보호된 fetch 헬퍼 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 디스패처 정책 유형 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 승인 요청/처리 유형 | `openclaw/plugin-sdk/approval-runtime` |
    | 승인 응답 페이로드 및 명령 헬퍼 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 오류 형식 지정 헬퍼 | `openclaw/plugin-sdk/error-runtime` |
    | 전송 준비 상태 대기 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 보안 토큰 헬퍼 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 제한된 비동기 작업 동시성 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 증명 가능한 불변 조건에 대한 필수 값 단언 | `openclaw/plugin-sdk/expect-runtime` |
    | 숫자 강제 변환 | `openclaw/plugin-sdk/number-runtime` |
    | 프로세스 로컬 비동기 잠금 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 파일 잠금 | `openclaw/plugin-sdk/file-lock` |

    번들 Plugin은 스캐너를 통해 `infra-runtime` 사용이 방지되므로 저장소 코드가
    광범위한 배럴로 회귀할 수 없습니다.

  </Step>

  <Step title="채널 경로 헬퍼 마이그레이션">
    새 채널 경로 코드는 `openclaw/plugin-sdk/channel-route`를 사용합니다. 이전
    경로 키 및 비교 가능한 대상 이름은 호환성 별칭으로 유지됩니다.

    | 이전 헬퍼 | 현대적인 헬퍼 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    현대적인 경로 헬퍼는 네이티브 승인, 응답 억제, 인바운드 중복 제거,
    Cron 전송 및 세션 라우팅 전반에서 `{ channel, to, accountId, threadId }`를
    일관되게 정규화합니다.

    `ChannelMessagingAdapter.parseExplicitTarget`, 파서 기반의 로드된 경로
    헬퍼(`parseExplicitTargetForLoadedChannel`,
    `resolveRouteTargetForLoadedChannel`) 또는
    `plugin-sdk/channel-route`의 `resolveChannelRouteTargetWithParser(...)`를 새로
    사용하지 마십시오. 이러한 항목은 사용 중단되었으며 이전 Plugin만을 위해
    유지됩니다. 새 채널 Plugin은 대상 ID 정규화 및 디렉터리 조회 실패 시
    대체 처리를 위해 `messaging.targetResolver.resolveTarget(...)`을 사용하고,
    코어에서 피어 종류를 조기에 확인해야 할 때
    `messaging.inferTargetChatType(...)`을 사용하며, 제공자 네이티브 세션 및
    스레드 ID에는 `messaging.resolveOutboundSessionRoute(...)`를 사용해야 합니다.

  </Step>

  <Step title="빌드 및 테스트">
    ```bash
    pnpm build
    pnpm test my-plugin/
    ```
  </Step>
</Steps>

## 가져오기 경로 참조

  <Accordion title="Common import path table">
  | 가져오기 경로 | 용도 | 주요 내보내기 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 표준 Plugin 진입점 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 진입점 정의/빌더를 위한 레거시 통합 재내보내기 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 구성 스키마 내보내기 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 제공자 진입점 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 채널 진입점에 특화된 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공유 설정 마법사 헬퍼 | 설정 번역기, 허용 목록 프롬프트, 설정 상태 빌더 |
  | `plugin-sdk/setup-runtime` | 설정 시점 런타임 헬퍼 | `createSetupTranslator`, 가져오기에 안전한 설정 패치 어댑터, 조회 참고 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정 프록시 |
  | `plugin-sdk/setup-adapter-runtime` | 사용 중단된 설정 어댑터 별칭 | `plugin-sdk/setup-runtime` 사용 |
  | `plugin-sdk/setup-tools` | 설정 도구 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 목록/구성/작업 게이트 헬퍼 |
  | `plugin-sdk/account-id` | 계정 ID 헬퍼 | `DEFAULT_ACCOUNT_ID`, 계정 ID 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 및 기본 대체 헬퍼 |
  | `plugin-sdk/account-helpers` | 범위가 좁은 계정 헬퍼 | 계정 목록/계정 작업 헬퍼 |
  | `plugin-sdk/channel-setup` | 설정 마법사 어댑터 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 페어링 기본 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 답장 접두사, 입력 중 표시 및 원본 전달 연결 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 구성 어댑터 팩터리 및 DM 접근 헬퍼 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 구성 스키마 빌더 | 공유 채널 구성 스키마 기본 요소 및 일반 빌더만 포함 |
  | `plugin-sdk/bundled-channel-config-schema` | 번들 구성 스키마 | OpenClaw에서 유지 관리하는 번들 Plugin 전용이며, 새 Plugin은 Plugin 로컬 스키마를 정의해야 합니다 |
  | `plugin-sdk/channel-config-schema-legacy` | 사용 중단된 번들 구성 스키마 | 호환성 별칭으로만 사용하며, 유지 관리되는 번들 Plugin에는 `plugin-sdk/bundled-channel-config-schema` 사용 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 구성 헬퍼 | 명령 이름 정규화, 설명 잘라내기, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 확인 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 사용 중단된 호환성 퍼사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/inbound-envelope` | 인바운드 봉투 헬퍼 | 공유 라우트 및 봉투 빌더 헬퍼 |
  | `plugin-sdk/channel-inbound` | 인바운드 수신 헬퍼 | 컨텍스트 구성, 형식 지정, 루트, 실행기, 준비된 답장 디스패치 및 디스패치 조건자 |
  | `plugin-sdk/messaging-targets` | 사용 중단된 대상 구문 분석 가져오기 경로 | 일반 대상 구문 분석 헬퍼에는 `plugin-sdk/channel-targets`, 라우트 비교에는 `plugin-sdk/channel-route`, 제공자별 대상 확인에는 Plugin 소유의 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` 사용 |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 헬퍼 | 공유 아웃바운드 미디어 로드 |
  | `plugin-sdk/outbound-send-deps` | 사용 중단된 호환성 퍼사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/channel-outbound` | 아웃바운드 메시지 수명 주기 헬퍼 | 메시지 어댑터, 수신 확인, 내구성 있는 전송 헬퍼, 실시간 미리 보기/스트리밍 헬퍼, 답장 옵션, 수명 주기 헬퍼, 아웃바운드 ID 및 페이로드 계획 |
  | `plugin-sdk/channel-streaming` | 사용 중단된 호환성 퍼사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/outbound-runtime` | 사용 중단된 호환성 퍼사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 헬퍼 | 스레드 바인딩 수명 주기 및 어댑터 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 페이로드 헬퍼 | 레거시 필드 레이아웃용 에이전트 미디어 페이로드 빌더 |
  | `plugin-sdk/channel-runtime` | 사용 중단된 호환성 심 | 레거시 채널 런타임 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 유형 | 답장 결과 유형 |
  | `plugin-sdk/runtime-store` | 영구 Plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 런타임 헬퍼 | 런타임/로깅/백업/Plugin 설치 헬퍼 |
  | `plugin-sdk/runtime-env` | 범위가 좁은 런타임 환경 헬퍼 | 로거/런타임 환경, 시간 제한, 재시도 및 백오프 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공유 Plugin 런타임 헬퍼 | Plugin 명령/훅/HTTP/대화형 헬퍼 |
  | `plugin-sdk/hook-runtime` | 훅 파이프라인 헬퍼 | 공유 Webhook/내부 훅 파이프라인 헬퍼 |
  | `plugin-sdk/lazy-runtime` | 지연 로드 런타임 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공유 실행 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI 런타임 헬퍼 | 명령 형식 지정, 대기, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway 클라이언트, 이벤트 루프 준비 완료 시작 헬퍼, 공지된 LAN 호스트 확인 및 채널 상태 패치 헬퍼 |
  | `plugin-sdk/config-runtime` | 사용 중단된 구성 호환성 심 | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` 권장 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때 대체 동작이 안정적인 Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 헬퍼 | 실행/Plugin 승인 페이로드, 승인 기능/프로필 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼 및 구조화된 승인 표시 경로 형식 지정 |
  | `plugin-sdk/approval-auth-runtime` | 승인 인증 헬퍼 | 승인자 확인, 동일 채팅 작업 인증 |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 헬퍼 | 네이티브 실행 승인 프로필/필터 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 헬퍼 | 네이티브 승인 기능/전달 어댑터 |
  | `plugin-sdk/approval-gateway-runtime` | 승인 Gateway 헬퍼 | 공유 승인 Gateway 확인자 |
  | `plugin-sdk/approval-reference-runtime` | 승인 전송 참조 | 전송 제약이 있는 콜백을 위한 결정론적 영구 로케이터 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 어댑터 헬퍼 | 빈번히 호출되는 채널 진입점용 경량 네이티브 승인 어댑터 로드 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | 승인 처리기 헬퍼 | 더 광범위한 승인 처리기 런타임 헬퍼이며, 범위가 좁은 어댑터/Gateway 접점만으로 충분하면 이를 권장합니다 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 헬퍼 | 네이티브 승인 대상/계정 바인딩 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | 승인 답장 헬퍼 | 실행/Plugin 승인 답장 페이로드 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 런타임 컨텍스트 헬퍼 | 일반 채널 런타임 컨텍스트 등록/가져오기/감시 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공유 신뢰, DM 게이팅, 루트 범위 제한 파일/경로, 외부 콘텐츠 및 비밀 정보 수집 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 허용 목록 및 사설 네트워크 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF 런타임 헬퍼 | 고정 디스패처, 보호된 가져오기, SSRF 정책 헬퍼 |
  | `plugin-sdk/system-event-runtime` | 시스템 이벤트 헬퍼 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 헬퍼 | Heartbeat 깨우기, 이벤트 및 가시성 헬퍼 |
  | `plugin-sdk/delivery-queue-runtime` | 전달 큐 헬퍼 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 채널 활동 헬퍼 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 중복 제거 헬퍼 | 메모리 내 및 영구 저장소 기반 중복 제거 캐시 |
  | `plugin-sdk/file-access-runtime` | 파일 접근 헬퍼 | 안전한 로컬 파일/미디어 경로 헬퍼 |
  | `plugin-sdk/transport-ready-runtime` | 전송 준비 상태 헬퍼 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | 실행 승인 정책 헬퍼 | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 크기 제한 캐시 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 게이팅 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, 오류 그래프 헬퍼, `PlatformMessageNotDispatchedError` |
  | `plugin-sdk/fetch-runtime` | 래핑된 가져오기/프록시 헬퍼 | `resolveFetch`, 프록시 헬퍼, EnvHttpProxyAgent 옵션 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 재시도 헬퍼 | `RetryConfig`, `retryAsync`, 정책 실행기 |
  | `plugin-sdk/allow-from` | 허용 목록 형식 지정 및 입력 매핑 | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅 및 명령 표면 헬퍼 | `resolveControlCommandGate`, 발신자 권한 부여 헬퍼, 동적 인수 메뉴 형식 지정을 포함한 명령 레지스트리 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/도움말 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 비밀 정보 입력 구문 분석 | 비밀 정보 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 보호 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공유 답장 런타임 | 인바운드 디스패치, Heartbeat, 답장 플래너, 청크 분할 |
  | `plugin-sdk/reply-dispatch-runtime` | 범위가 좁은 답장 디스패치 헬퍼 | 마무리, 제공자 디스패치 및 대화 레이블 헬퍼 |
  | `plugin-sdk/reply-history` | 답장 기록 헬퍼 | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 등의 사용 중단된 맵 헬퍼 호환성 내보내기 |
  | `plugin-sdk/reply-reference` | 답장 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 답장 청크 헬퍼 | 텍스트/마크다운 청크 분할 헬퍼 |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 헬퍼 | 범위가 지정된 세션 행 헬퍼, 저장소 경로 헬퍼 및 업데이트 시각 읽기 |
  | `plugin-sdk/state-paths` | 상태 경로 도우미 | 상태 및 OAuth 디렉터리 도우미 |
  | `plugin-sdk/routing` | 라우팅/세션 키 도우미 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 도우미 |
  | `plugin-sdk/status-helpers` | 채널 상태 도우미 | 채널/계정 상태 요약 빌더, 런타임 상태 기본값, 문제 메타데이터 도우미 |
  | `plugin-sdk/target-resolver-runtime` | 대상 확인 도우미 | 공유 대상 확인 도우미 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 도우미 | 슬러그/문자열 정규화 도우미 |
  | `plugin-sdk/request-url` | 요청 URL 도우미 | 요청 유사 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 도우미 | 정규화된 stdout/stderr를 제공하는 시간 제한 명령 실행기 |
  | `plugin-sdk/param-readers` | 매개변수 리더 | 공통 도구/CLI 매개변수 리더 |
  | `plugin-sdk/tool-payload` | 도구 페이로드 추출 | 도구 결과 객체에서 정규화된 페이로드 추출 |
  | `plugin-sdk/tool-send` | 도구 전송 정보 추출 | 도구 인수에서 정규 전송 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 도우미 | 공유 임시 다운로드 경로 도우미 |
  | `plugin-sdk/logging-core` | 로깅 도우미 | 하위 시스템 로거 및 민감 정보 제거 도우미 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 표 도우미 | Markdown 표 모드 도우미 |
  | `plugin-sdk/reply-payload` | 메시지 회신 타입 | 회신 페이로드 타입 |
  | `plugin-sdk/provider-setup` | 선별된 로컬/자체 호스팅 제공자 설정 도우미 | 자체 호스팅 제공자 검색/구성 도우미 |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 자체 호스팅 제공자 전용 설정 도우미 | 동일한 자체 호스팅 제공자 검색/구성 도우미 |
  | `plugin-sdk/provider-auth-runtime` | 제공자 런타임 인증 도우미 | 런타임 API 키 확인 도우미 |
  | `plugin-sdk/provider-auth-api-key` | 제공자 API 키 설정 도우미 | API 키 온보딩/프로필 작성 도우미 |
  | `plugin-sdk/provider-auth-result` | 제공자 인증 결과 도우미 | 표준 OAuth 인증 결과 빌더 |
  | `plugin-sdk/provider-selection-runtime` | 제공자 선택 도우미 | 구성 또는 자동 제공자 선택 및 원시 제공자 구성 병합 |
  | `plugin-sdk/provider-env-vars` | 제공자 환경 변수 도우미 | 제공자 인증 환경 변수 조회 도우미 |
  | `plugin-sdk/provider-model-shared` | 공유 제공자 모델/재실행 도우미 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 재실행 정책 빌더, 제공자 엔드포인트 도우미 및 모델 ID 정규화 도우미 |
  | `plugin-sdk/provider-catalog-shared` | 공유 제공자 카탈로그 도우미 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 제공자 온보딩 패치 | 온보딩 구성 도우미 |
  | `plugin-sdk/provider-http` | 제공자 HTTP 도우미 | 오디오 전사 멀티파트 양식 도우미를 포함한 범용 제공자 HTTP/엔드포인트 기능 도우미 |
  | `plugin-sdk/provider-web-fetch` | 제공자 웹 가져오기 도우미 | 웹 가져오기 제공자 등록/캐시 도우미 |
  | `plugin-sdk/provider-web-search-config-contract` | 제공자 웹 검색 구성 도우미 | Plugin 활성화 연결이 필요 없는 제공자를 위한 제한된 웹 검색 구성/자격 증명 도우미 |
  | `plugin-sdk/provider-web-search-contract` | 제공자 웹 검색 계약 도우미 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` 및 범위 지정 자격 증명 설정자/조회자와 같은 제한된 웹 검색 구성/자격 증명 계약 도우미 |
  | `plugin-sdk/provider-web-search` | 제공자 웹 검색 도우미 | 웹 검색 제공자 등록/캐시/런타임 도우미 |
  | `plugin-sdk/provider-tools` | 제공자 도구/스키마 호환성 도우미 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` 및 DeepSeek/Gemini/OpenAI 스키마 정리 및 진단 |
  | `plugin-sdk/provider-usage` | 제공자 사용량 도우미 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 및 기타 제공자 사용량 도우미 |
  | `plugin-sdk/provider-stream` | 제공자 스트림 래퍼 도우미 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입 및 공유 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 도우미 |
  | `plugin-sdk/provider-transport-runtime` | 제공자 전송 도우미 | 보호된 가져오기, 도구 결과 텍스트 추출, 전송 메시지 변환 및 쓰기 가능한 전송 이벤트 스트림과 같은 네이티브 제공자 전송 도우미 |
  | `plugin-sdk/keyed-async-queue` | 순서 보장 비동기 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공유 미디어 도우미 | 미디어 가져오기/변환/저장 도우미, ffprobe 기반 동영상 크기 탐색 및 미디어 페이로드 빌더 |
  | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 도우미 | 이미지/동영상/음악 생성을 위한 공유 장애 조치 도우미, 후보 선택 및 누락된 모델 메시지 |
  | `plugin-sdk/media-understanding` | 미디어 이해 도우미 | 미디어 이해 제공자 타입 및 제공자용 이미지/오디오 도우미 내보내기 |
  | `plugin-sdk/text-runtime` | 지원 중단된 광범위한 텍스트 호환성 내보내기 | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` 및 `logging-core`를 사용하십시오 |
  | `plugin-sdk/text-chunking` | 텍스트 분할 도우미 | 발신 텍스트 분할 도우미 |
  | `plugin-sdk/speech` | 음성 도우미 | 음성 제공자 타입, 제공자용 지시문, 레지스트리, 검증 도우미 및 OpenAI 호환 TTS 빌더 |
  | `plugin-sdk/speech-core` | 공유 음성 코어 | 음성 제공자 타입, 레지스트리, 지시문, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 도우미 | 제공자 타입, 레지스트리 도우미 및 공유 WebSocket 세션 도우미 |
  | `plugin-sdk/realtime-voice` | 실시간 음성 도우미 | 제공자 타입, 레지스트리/확인 도우미, 브리지 세션 도우미, 공유 에이전트 응답 큐, 활성 실행 음성 제어, 전사/이벤트 상태, 에코 억제, 상담 질문 일치, 강제 상담 조정, 턴 컨텍스트 추적, 출력 활동 추적 및 빠른 컨텍스트 상담 도우미 |
  | `plugin-sdk/image-generation` | 이미지 생성 도우미 | 이미지 생성 제공자 타입, 이미지 자산/데이터 URL 도우미 및 OpenAI 호환 이미지 제공자 빌더 |
  | `plugin-sdk/image-generation-core` | 공유 이미지 생성 코어 | 이미지 생성 타입, 장애 조치, 인증 및 레지스트리 도우미 |
  | `plugin-sdk/music-generation` | 음악 생성 도우미 | 음악 생성 제공자/요청/결과 타입 |
  | `plugin-sdk/music-generation-core` | 공유 음악 생성 코어 | 음악 생성 타입, 장애 조치 도우미, 제공자 조회 및 모델 참조 구문 분석 |
  | `plugin-sdk/video-generation` | 동영상 생성 도우미 | 동영상 생성 제공자/요청/결과 타입 |
  | `plugin-sdk/video-generation-core` | 공유 동영상 생성 코어 | 동영상 생성 타입, 장애 조치 도우미, 제공자 조회 및 모델 참조 구문 분석 |
  | `plugin-sdk/interactive-runtime` | 대화형 회신 도우미 | 대화형 회신 페이로드 정규화/축약 |
  | `plugin-sdk/channel-config-primitives` | 채널 구성 기본 요소 | 제한된 채널 구성 스키마 기본 요소 |
  | `plugin-sdk/channel-config-writes` | 채널 구성 작성 도우미 | 채널 구성 작성 권한 부여 도우미 |
  | `plugin-sdk/channel-plugin-common` | 공유 채널 서두 | 공유 채널 Plugin 서두 내보내기 |
  | `plugin-sdk/channel-status` | 채널 상태 도우미 | 공유 채널 상태 스냅샷/요약 도우미 |
  | `plugin-sdk/allowlist-config-edit` | 허용 목록 구성 도우미 | 허용 목록 구성 편집/읽기 도우미 |
  | `plugin-sdk/group-access` | 그룹 접근 도우미 | 공유 그룹 접근 결정 도우미 |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 지원 중단된 호환성 퍼사드 | `plugin-sdk/channel-inbound`를 사용하십시오 |
  | `plugin-sdk/direct-dm-guard-policy` | 직접 DM 보호 도우미 | 암호화 이전 단계의 제한된 보호 정책 도우미 |
  | `plugin-sdk/extension-shared` | 공유 확장 도우미 | 수동 채널/상태 및 환경 프록시 도우미 기본 요소 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 도우미 | Webhook 대상 레지스트리 및 경로 설치 도우미 |
  | `plugin-sdk/webhook-path` | 지원 중단된 Webhook 경로 별칭 | `plugin-sdk/webhook-ingress`를 사용하십시오 |
  | `plugin-sdk/web-media` | 공유 웹 미디어 도우미 | 원격/로컬 미디어 로딩 도우미 |
  | `plugin-sdk/zod` | 지원 중단된 Zod 호환성 재내보내기 | `zod`에서 `zod`를 직접 가져오십시오 |
  | `plugin-sdk/memory-core` | 번들 메모리 코어 도우미 | 메모리 관리자/구성/파일/CLI 도우미 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 런타임 퍼사드 | 메모리 인덱스/검색 런타임 퍼사드 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 메모리 임베딩 레지스트리 | 경량 메모리 임베딩 제공자 레지스트리 도우미 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 기반 엔진 | 메모리 호스트 기반 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, 레지스트리 접근, 로컬 제공자 및 범용 배치/원격 도우미. 구체적인 원격 제공자는 해당 소유 Plugin에 있습니다 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 | 메모리 호스트 저장소 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 도우미 | 메모리 호스트 멀티모달 도우미 |
  | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 도우미 | 메모리 호스트 쿼리 도우미 |
  | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 비밀 정보 도우미 | 메모리 호스트 비밀 정보 도우미 |
  | `plugin-sdk/memory-core-host-events` | 지원 중단된 메모리 이벤트 별칭 | `plugin-sdk/memory-host-events`를 사용하십시오 |
  | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 도우미 | 메모리 호스트 상태 도우미 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 | 메모리 호스트 CLI 런타임 도우미 |
  | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 | 메모리 호스트 코어 런타임 도우미 |
  | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 도우미 | 메모리 호스트 파일/런타임 도우미 |
  | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 별칭 | 메모리 호스트 코어 런타임 도우미의 공급업체 중립적 별칭 |
  | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 메모리 호스트 이벤트 저널 도우미의 공급업체 중립적 별칭 |
  | `plugin-sdk/memory-host-files` | 지원 중단된 메모리 파일/런타임 별칭 | `plugin-sdk/memory-core-host-runtime-files`를 사용하십시오 |
  | `plugin-sdk/memory-host-markdown` | 관리형 Markdown 도우미 | 메모리 인접 Plugin을 위한 공유 관리형 Markdown 도우미 |
  | `plugin-sdk/memory-host-search` | 활성 메모리 검색 퍼사드 | 지연 로딩 활성 메모리 검색 관리자 런타임 퍼사드 |
  | `plugin-sdk/memory-host-status` | 지원 중단된 메모리 호스트 상태 별칭 | `plugin-sdk/memory-core-host-status`를 사용하십시오 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 저장소 로컬의 지원 중단된 호환성 배럴입니다. `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures`와 같은 용도별 저장소 로컬 테스트 하위 경로를 사용하십시오 |
</Accordion>

  이 표는 전체 SDK 표면이 아니라 공통 마이그레이션 하위 집합입니다.
  컴파일러 진입점 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있으며,
  패키지 내보내기는 공개 하위 집합에서 생성됩니다.

  명시적으로 문서화된 호환성 퍼사드를 제외하고, 번들 Plugin용으로 예약된 헬퍼 연결 지점은 공개 SDK
  내보내기 맵에서 제거되었습니다. 예를 들어 게시된 `@openclaw/discord` 패키지를 여전히
  직접 가져오는 외부 Plugin을 위해 유지되는, 더 이상 사용되지 않는 `plugin-sdk/discord`
  심이 있습니다. 소유자별 헬퍼는 해당 소유 Plugin 패키지 내부에 있으며, 공유 호스트 동작은
  `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
  `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 계약을 통해 이동합니다.

  작업에 맞는 가장 좁은 가져오기를 사용하십시오. 내보내기를 찾을 수 없다면
  `src/plugin-sdk/`의 소스를 확인하거나 어떤 일반 계약이 이를 소유해야 하는지
  유지관리자에게 문의하십시오.

  ## 현재 사용 중단 예정 항목

  Plugin SDK, 제공자 계약, 런타임 표면, 매니페스트 전반에 걸친 더 세분화된 사용 중단 예정 항목입니다.
  각 항목은 현재도 작동하지만 향후 메이저 릴리스에서 제거됩니다. 모든 항목은 기존 API를
  정식 대체 항목에 매핑합니다.

  <AccordionGroup>
  <Accordion title="command-auth 도움말 빌더 -> command-status">
    **기존 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **신규 (`openclaw/plugin-sdk/command-status`)**: 동일한 시그니처와 동일한
    내보내기이며, 더 세분화된 하위 경로에서 가져오기만 하면 됩니다. `command-auth`는
    이를 호환성 스텁으로 다시 내보냅니다.

    ```typescript
    // 이전
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 이후
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="멘션 게이팅 헬퍼 -> resolveInboundMentionDecision">
    **기존**: `openclaw/plugin-sdk/channel-inbound` 또는
    `openclaw/plugin-sdk/channel-mention-gating`의
    `resolveMentionGating(params)` 및
    `resolveMentionGatingWithBypass(params)`.

    **신규**: `resolveInboundMentionDecision({ facts, policy })` - 분리된 두 가지
    호출 형태 대신 하나의 결정 객체를 사용합니다.

    Discord, iMessage, Matrix, MS Teams, QQBot, Signal,
    Telegram, WhatsApp, Zalo 전반에 적용되었습니다. Slack의 자체 `app_mention`
    이벤트 모델은 이 헬퍼를 사용하지 않습니다.

  </Accordion>

  <Accordion title="채널 런타임 심 및 채널 작업 헬퍼">
    `openclaw/plugin-sdk/channel-runtime`은 이전 채널 Plugin을 위한 호환성 심입니다.
    새 코드에서는 이를 가져오지 말고, 런타임 객체 등록에
    `openclaw/plugin-sdk/channel-runtime-context`를 사용하십시오.

    `openclaw/plugin-sdk/channel-actions`의 `channelActions*` 헬퍼는 원시
    "actions" 채널 내보내기와 함께 사용 중단 예정입니다. 대신 의미론적 `presentation`
    표면을 통해 기능을 노출하십시오. 채널 Plugin은 허용하는 원시 작업 이름이 아니라
    렌더링하는 항목(카드, 버튼, 선택 항목)을 선언합니다.

  </Accordion>

  <Accordion title="웹 검색 제공자 tool() 헬퍼 -> Plugin의 createTool()">
    **기존**: `openclaw/plugin-sdk/provider-web-search`의 `tool()` 팩토리.

    **신규**: 제공자 Plugin에 `createTool(...)`을 직접 구현하십시오.
    OpenClaw는 도구 래퍼 등록에 더 이상 SDK 헬퍼가 필요하지 않습니다.

  </Accordion>

  <Accordion title="일반 텍스트 채널 엔벌로프 -> BodyForAgent">
    **기존**: 인바운드 채널 메시지에서 평면 일반 텍스트 프롬프트 엔벌로프를 만들기 위한
    `api.runtime.channel.reply.formatInboundEnvelope(...)` 및 인바운드 메시지 객체의
    `channelEnvelope` 필드.

    **신규**: `BodyForAgent`와 구조화된 사용자 컨텍스트 블록을 사용합니다. 채널
    Plugin은 라우팅 메타데이터(스레드, 주제, 회신 대상, 반응)를 프롬프트 문자열에
    연결하는 대신 형식화된 필드로 첨부합니다. 합성된 어시스턴트 대상 엔벌로프에는
    `formatAgentEnvelope(...)` 헬퍼가 계속 지원되지만, 인바운드 일반 텍스트
    엔벌로프는 단계적으로 제거되고 있습니다.

    영향받는 영역: `inbound_claim`, `message_received`, 그리고 기존 엔벌로프 텍스트를
    후처리한 모든 사용자 지정 채널 Plugin.

  </Accordion>

  <Accordion title="deactivate 훅 -> gateway_stop">
    **기존**: `api.on("deactivate", handler)`.

    **신규**: `api.on("gateway_stop", handler)`. 종료 정리 계약은 동일하며
    훅 이름만 변경됩니다.

    ```typescript
    // 이전
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // 이후
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate`는 2026-08-16 이후 제거될 때까지 사용 중단된 호환성 별칭으로
    계속 연결됩니다.

  </Accordion>

  <Accordion title="subagent_spawning 훅 -> 코어 스레드 바인딩">
    **기존**: `threadBindingReady` 또는 `deliveryOrigin`을 반환하는
    `api.on("subagent_spawning", handler)`.

    **신규**: 코어가 채널 세션 바인딩 어댑터를 통해 `thread: true` 하위 에이전트
    바인딩을 준비하도록 하십시오. 실행 후 관찰에만
    `api.on("subagent_spawned", handler)`를 사용하십시오.

    ```typescript
    // 이전
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // 이후
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` 및
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)`은 외부 플러그인이
    마이그레이션하는 동안 사용 중단된 호환성 표면으로만 유지되며,
    2026-08-30 이후 제거됩니다.

  </Accordion>

  <Accordion title="Provider 검색 타입 -> Provider 카탈로그 타입">
    이제 네 가지 검색 타입 별칭은 카탈로그 시대 타입을 감싸는 얇은
    래퍼입니다.

    | 이전 별칭                 | 새 타입                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    또한 레거시 `ProviderCapabilities` 정적 모음이 있습니다. Provider 플러그인은
    정적 객체 대신 `buildReplayPolicy`, `normalizeToolSchemas`,
    `wrapStreamFn`과 같은 명시적 Provider 훅을 사용해야 합니다.

  </Accordion>

  <Accordion title="사고 정책 훅 -> resolveThinkingProfile">
    **이전** (`ProviderThinkingPolicy`의 세 가지 개별 훅):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` 및
    `resolveDefaultThinkingLevel(ctx)`.

    **신규**: 표준 `id`, 선택적 `label`, 순위가 지정된 수준 목록을 포함하는
    `ProviderThinkingProfile`을 반환하는 단일 `resolveThinkingProfile(ctx)`입니다.
    OpenClaw는 저장된 오래된 값을 프로필 순위에 따라 자동으로 하향 조정합니다.

    컨텍스트에는 `provider`, `modelId`, 선택적으로 병합된 `reasoning`,
    선택적으로 병합된 모델 `compat` 정보가 포함됩니다. Provider 플러그인은
    구성된 요청 계약이 지원하는 경우에만 이러한 카탈로그 정보를 사용하여
    모델별 프로필을 노출할 수 있습니다.

    세 개 대신 하나의 훅을 구현하십시오. 레거시 훅은 사용 중단 기간에도
    계속 작동하지만 프로필 결과와 결합되지는 않습니다.

  </Accordion>

  <Accordion title="외부 인증 Provider -> contracts.externalAuthProviders">
    **이전**: 플러그인 매니페스트에 Provider를 선언하지 않고 외부 인증 훅을
    구현했습니다.

    **신규**: 플러그인 매니페스트에 `contracts.externalAuthProviders`를 선언하고
    **동시에** `resolveExternalAuthProfiles(...)`를 구현하십시오.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider 환경 변수 조회 -> setup.providers[].envVars">
    **이전** 매니페스트 필드: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **신규**: 동일한 환경 변수 조회를 매니페스트의
    `setup.providers[].envVars`에도 반영하십시오. 이렇게 하면 설정/상태 환경
    메타데이터가 한곳으로 통합되고, 환경 변수 조회에 응답하기 위해 플러그인
    런타임을 부팅할 필요가 없어집니다.

    `providerAuthEnvVars`는 사용 중단 기간이 끝날 때까지 호환성 어댑터를
    통해 계속 지원됩니다.

  </Accordion>

  <Accordion title="메모리 플러그인 등록 -> registerMemoryCapability">
    **이전**: 세 번의 개별 호출 - `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`.

    **신규**: 메모리 상태 API에서 한 번 호출 -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    동일한 슬롯을 한 번의 등록 호출로 처리합니다. 추가 프롬프트 및 코퍼스
    도우미(`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)는
    영향을 받지 않습니다.

  </Accordion>

  <Accordion title="메모리 임베딩 Provider API">
    **이전**: `api.registerMemoryEmbeddingProvider(...)` 및
    `contracts.memoryEmbeddingProviders`.

    **신규**: `api.registerEmbeddingProvider(...)` 및
    `contracts.embeddingProviders`.

    일반 임베딩 Provider 계약은 메모리 외부에서도 재사용할 수 있으며
    새로운 Provider에서 지원되는 경로입니다. 기존 Provider가
    마이그레이션하는 동안 메모리 전용 등록 API는 사용 중단된 호환성을 위해
    계속 연결된 상태로 유지됩니다. 플러그인 검사는 번들되지 않은 사용을
    호환성 부채로 보고합니다.

  </Accordion>

  <Accordion title="하위 에이전트 세션 메시지 타입 이름 변경">
    `src/plugins/runtime/types.ts`에서 여전히 내보내는 두 가지 레거시 타입 별칭:

    | 이전                           | 신규                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    런타임 메서드 `readSession`은 `getSessionMessages`를 위해 사용 중단되었습니다.
    시그니처는 동일하며 이전 메서드는 새 메서드를 호출합니다.

  </Accordion>

  <Accordion title="제거된 세션 및 트랜스크립트 파일 API">
    SQLite 세션/트랜스크립트 전환으로 인해 활성 `sessions.json` 저장소,
    JSONL 트랜스크립트 경로 또는 세션 파일 목록을 노출하던 플러그인 대상
    API가 제거되거나 사용 중단됩니다. 런타임 플러그인은 활성 파일을
    확인하거나 변경하는 대신 세션 ID와 SDK 런타임 도우미를 사용해야 합니다.

    | 마이그레이션 대상 표면 | 대체 항목 |
    | ----------------- | ----------- |
    | 더 이상 사용되지 않는 `loadSessionStore(...)`, `updateSessionStore(...)`, `resolveSessionStoreEntry(...)` | `getSessionEntry(...)`, `listSessionEntries(...)` 및 행 수준 세션 변경 작업. |
    | 더 이상 사용되지 않는 `resolveSessionFilePath(...)` | 세션 ID 정보(`sessionKey`, `sessionId` 및 SDK 런타임 대상 헬퍼)와 현재 세션에서 작동하는 Gateway 메서드. |
    | 제거된 `saveSessionStore(...)` | Gateway 소유 세션 런타임 API입니다. Plugin 코드는 활성 저장소 파일을 작성하는 대신 문서화된 런타임/컨텍스트 헬퍼를 통해 세션 상태를 요청하거나 변경해야 합니다. |
    | 제거된 `resolveSessionTranscriptPathInDir(...)` 및 `resolveAndPersistSessionFile(...)` | 세션 ID 정보와 현재 세션에서 작동하는 Gateway 메서드. |
    | `readLatestAssistantTextFromSessionTranscript(...)` | 현재 런타임 컨텍스트가 노출하는 ID 정보 기반 트랜스크립트 리더 또는 Plugin이 트랜스크립트 소유자 경로 외부에 있을 때 사용하는 Gateway 기록/세션 메서드. |
    | `SessionTranscriptUpdate.sessionFile` | `agentId`, `sessionKey`, `sessionId`가 포함된 `SessionTranscriptUpdate.target`. |
    | `sessionFiles`와 같은 메모리 동기화 입력 | 호스트에서 제공하는 ID 정보 기반 트랜스크립트/세션 소스입니다. 라이브 세션의 활성 JSONL 파일을 순회하지 마십시오. |
    | 활성 세션에서 `transcriptPath` 또는 `sessionFile`이라는 이름의 런타임 옵션 | 저장소에 종속되지 않는 세션 ID 정보를 전달하는 `sessionTarget`/런타임 대상 객체. |

    레거시 JSONL 트랜스크립트 파일은 가져오기, 보관, 내보내기 및
    지원 아티팩트로 계속 유효합니다. 하지만 더 이상 활성 세션의
    정상 상태 런타임 계약이 아닙니다.

    `v2026.7.1-beta.5`와 함께 출시된 공식 Plugin은 위의 더 이상 사용되지 않는
    헬퍼 4개를 가져왔습니다. `openclaw/plugin-sdk/session-store-runtime`은
    2026-10-12까지 해당 브리지를 그대로 유지합니다. 새 Plugin은 대체 항목을 사용해야 합니다.
    `resolveStorePath(...)`는 계속 지원되는 SDK 헬퍼이며 이 사용 중단에
    포함되지 않습니다.

    `openclaw plugins inspect --all --runtime`은 로드 오류 또는 진단에서
    제거된 파일 API를 여전히 참조하는 번들 외부 Plugin을 보고합니다.
    외부 패키지 검사에서도 전체 저장소 세션 헬퍼,
    세션 파일 경로 헬퍼, 레거시 트랜스크립트 파일 대상 및 저수준
    트랜스크립트 헬퍼를 출시 전에 표시하도록 `@openclaw/plugin-inspector`
    권고 검사는 버전 `0.3.17` 이상을 사용해야 합니다.

  </Accordion>

  <Accordion title="runtime.tasks.flow -> runtime.tasks.managedFlows">
    **이전**: `runtime.tasks.flow`(단수)는 라이브 작업 흐름
    접근자를 반환했습니다.

    **신규**: `runtime.tasks.managedFlows`는 흐름에서 하위 작업을
    생성, 업데이트, 취소 또는 실행하는 Plugin을 위해 관리형 TaskFlow 변경
    런타임을 유지합니다. Plugin에 DTO 기반 읽기만 필요한 경우
    `runtime.tasks.flows`를 사용하십시오.

    ```typescript
    // 이전
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 이후
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

    2026-07-26 이후 제거되었습니다.

  </Accordion>

  <Accordion title="내장 확장 팩토리 -> 에이전트 도구 결과 미들웨어">
    위의 [마이그레이션 방법](#how-to-migrate)에서 다룹니다. 완전성을 위해
    여기에 포함합니다. 제거된 내장 실행기 전용
    `api.registerEmbeddedExtensionFactory(...)` 경로는
    `contracts.agentToolResultMiddleware`의 명시적 런타임 목록과 함께
    `api.registerAgentToolResultMiddleware(...)`로 대체됩니다.
  </Accordion>

  <Accordion title="OpenClawSchemaType 별칭 -> OpenClawConfig">
    `openclaw/plugin-sdk`에서 다시 내보낸 `OpenClawSchemaType`은 이제
    `OpenClawConfig`의 한 줄짜리 별칭입니다. 정식 이름을 우선 사용하십시오.

    ```typescript
    // 이전
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 이후
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
확장 수준의 사용 중단 항목(`extensions/` 아래의 번들 채널/공급자 Plugin 내부)은
각각의 `api.ts` 및 `runtime-api.ts` 배럴에서 추적됩니다.
이 항목들은 서드 파티 Plugin 계약에 영향을 주지 않으며 여기에 나열되지
않습니다. 번들 Plugin의 로컬 배럴을 직접 사용하는 경우 업그레이드하기 전에
해당 배럴의 사용 중단 주석을 읽으십시오.
</Note>

## Talk 및 실시간 음성 마이그레이션

실시간 음성, 전화 통신, 회의 및 브라우저 Talk 코드는
`openclaw/plugin-sdk/realtime-voice`에서 내보내는 하나의 Talk
세션 컨트롤러를 공유합니다. 이 컨트롤러는 공통 Talk 이벤트 봉투, 활성 턴 상태, 캡처
상태, 출력 오디오 상태, 최근 이벤트 기록 및 오래된 턴 거부를 소유합니다.
공급자 Plugin은 공급업체별 실시간 세션을 소유하며, 표면 Plugin은
캡처, 재생, 전화 통신 및 회의 관련 특수 동작을 소유합니다.

모든 번들 표면은 공유 컨트롤러에서 실행됩니다. 브라우저 릴레이,
관리형 룸 핸드오프, 음성 통화 실시간 처리, 음성 통화 스트리밍 STT, Google
Meet 실시간 처리 및 네이티브 푸시투토크가 이에 포함됩니다. Gateway는 `hello-ok.features.events`에서
하나의 라이브 Talk 이벤트 채널인 `talk.event`를 알립니다.

저수준 어댑터 또는 테스트 픽스처를 구현하는 경우가 아니라면 새 코드에서
`createTalkEventSequencer(...)`를 직접 호출하지 마십시오. 공유 컨트롤러를 사용하면
턴 범위 이벤트가 턴 ID 없이 방출되지 않고, 오래된 `turnEnd` /
`turnCancel` 호출이 더 새로운 활성 턴을 지우지 않으며, 출력 오디오
수명 주기 이벤트가 전화 통신, 회의, 브라우저 릴레이,
관리형 룸 핸드오프 및 네이티브 Talk 클라이언트 전반에서 일관되게 유지됩니다.

공개 API 형태는 다음과 같습니다.

```typescript
// Gateway 소유 Talk 세션 API입니다.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// 클라이언트 소유 공급자 세션 API입니다.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

브라우저 소유 WebRTC/공급자 WebSocket 세션은 `talk.client.create`를
사용합니다. 브라우저가 공급자 협상과 미디어 전송을 소유하고
Gateway가 자격 증명, 지침 및 도구 정책을 소유하기 때문입니다. `talk.session.*`는
Gateway 릴레이 실시간 처리, Gateway 릴레이
전사 및 관리형 룸 네이티브 STT/TTS 세션을 위한 공통 Gateway 관리 표면입니다.

`talk.provider` / `talk.providers` 옆에 실시간 선택기를 배치하는
레거시 구성은 `openclaw doctor --fix`로 복구해야 합니다. 런타임 Talk는
음성/TTS 공급자 구성을 실시간 공급자 구성으로 재해석하지 않습니다.

지원되는 `talk.session.create` 조합은 의도적으로 제한되어 있습니다.

| 모드            | 전송 방식       | 브레인           | 소유자              | 참고                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway를 통해 브리지되는 전이중 공급자 오디오입니다. 도구 호출은 에이전트 상담 도구를 통해 라우팅됩니다.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | 스트리밍 STT 전용입니다. 호출자는 입력 오디오를 전송하고 트랜스크립트 이벤트를 수신합니다.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 네이티브/클라이언트 룸 | 클라이언트가 캡처/재생을 소유하고 Gateway가 턴 상태를 소유하는 푸시투토크 및 워키토키 방식의 룸입니다. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 네이티브/클라이언트 룸 | Gateway 도구 작업을 직접 실행하는 신뢰할 수 있는 자사 표면을 위한 관리자 전용 룸 모드입니다.                  |

기존 `talk.realtime.*` / `talk.transcription.*` / `talk.handoff.*`
패밀리(모두 제거됨)에서 마이그레이션하는 사용자를 위한 메서드 매핑은 다음과 같습니다.

| 이전                              | 신규                                                      |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` 또는 `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

통합된 제어 어휘 역시 의도적으로 제한되어 있습니다.

| 메서드                          | 적용 대상                                               | 계약                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 동일한 Gateway 연결이 소유한 제공자 세션에 base64 PCM 오디오 청크를 추가합니다.                                                                                                                             |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 관리형 룸 사용자 턴을 시작합니다.                                                                                                                                                                                           |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 오래된 턴 검증 후 활성 턴을 종료합니다.                                                                                                                                                                          |
| `talk.session.cancelTurn`       | Gateway가 소유한 모든 세션                              | 턴에 대한 활성 캡처/제공자/에이전트/TTS 작업을 취소합니다.                                                                                                                                                                 |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 사용자 턴을 반드시 종료하지 않고 어시스턴트 오디오 출력을 중지합니다.                                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 브리지가 노출한 비동기 완료가 끝난 후 제공자 도구 호출을 완료합니다. 중간 출력을 위해 `options.willContinue`를 전달하거나, 지원되는 경우 추가 어시스턴트 응답을 방지하려면 `options.suppressResponse`를 전달합니다. |
| `talk.session.steer`            | 에이전트 기반 Talk 세션                                 | Talk 세션에서 확인된 활성 임베디드 실행에 음성 `status`, `steer`, `cancel` 또는 `followup` 제어를 전송합니다.                                                                                                 |
| `talk.session.close`            | 모든 통합 세션                                          | 릴레이 세션을 중지하거나 관리형 룸 상태를 해제한 다음 통합 세션 ID를 삭제합니다.                                                                                                                                     |

이 기능을 작동시키기 위해 코어에 제공자 또는 플랫폼별 특수 사례를 도입하지 마십시오.
코어는 Talk 세션 의미 체계를 소유합니다. 제공자 Plugin은 벤더 세션 설정을 소유합니다.
음성 통화와 Google Meet은 전화/회의 어댑터를 소유합니다. 브라우저와 네이티브
앱은 기기 캡처/재생 UX를 소유합니다.

## 제거 일정

| 시점                                        | 동작                                                                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **현재**                                     | 더 이상 권장되지 않는 표면에서 런타임 경고가 발생합니다.                                                                                             |
| **각 호환성 레코드의 `removeAfter` 날짜** | 해당 표면을 제거할 수 있게 되며, 날짜가 지나면 `pnpm plugins:boundary-report --fail-on-eligible-compat`로 인해 CI가 실패합니다. |
| **다음 메이저 릴리스**                      | 아직 마이그레이션되지 않은 모든 표면이 제거되며, 이를 계속 사용하는 Plugin은 실패합니다.                                                       |

모든 코어 Plugin은 이미 마이그레이션되었습니다. 외부 Plugin은 다음 메이저 릴리스
전에 마이그레이션해야 합니다. Plugin에서 사용하는 표면 중 호환성 레코드의 만료가
가장 임박한 항목을 확인하려면 `pnpm plugins:boundary-report`를 실행하십시오.

## 일시적으로 경고 억제하기

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이는 일시적인 우회 수단이며 영구적인 해결책이 아닙니다.

## 관련 문서

- [시작하기](/ko/plugins/building-plugins) - 첫 번째 Plugin 빌드
- [SDK 개요](/ko/plugins/sdk-overview) - 전체 하위 경로 가져오기 참조
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) - 채널 Plugin 빌드
- [제공자 Plugin](/ko/plugins/sdk-provider-plugins) - 제공자 Plugin 빌드
- [Plugin 내부 구조](/ko/plugins/architecture) - 아키텍처 심층 분석
- [Plugin 매니페스트](/ko/plugins/manifest) - 매니페스트 스키마 참조
