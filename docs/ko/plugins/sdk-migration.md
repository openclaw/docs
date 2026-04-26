---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 경고가 표시됩니다
    - OPENCLAW_EXTENSION_API_DEPRECATED 경고가 표시됩니다
    - OpenClaw 2026.4.25 이전에 `api.registerEmbeddedExtensionFactory`를 사용했습니다.
    - 최신 Plugin 아키텍처에 맞게 플러그인을 업데이트하고 있습니다.
    - 외부 OpenClaw Plugin을 유지 관리하고 있습니다.
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 Plugin SDK로 마이그레이션하기
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-04-26T11:35:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: ecff17f6be8bcbc310eac24bf53348ec0f7dfc06cc94de5e3a38967031737ccb
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw는 광범위한 이전 버전 호환성 레이어에서, 범위가 명확하고 문서화된 import를 사용하는 최신 Plugin 아키텍처로 전환했습니다. 플러그인이 새 아키텍처 이전에 만들어졌다면, 이 가이드가 마이그레이션에 도움이 됩니다.

## 무엇이 변경되고 있나요

기존 Plugin 시스템은 플러그인이 단일 진입점에서 필요한 거의 모든 것을 import할 수 있도록 하는 두 가지 개방형 표면을 제공했습니다.

- **`openclaw/plugin-sdk/compat`** — 수십 개의 헬퍼를 다시 export하는 단일 import입니다. 새로운 Plugin 아키텍처가 구축되는 동안 이전 hook 기반 플러그인이 계속 작동하도록 도입되었습니다.
- **`openclaw/extension-api`** — 플러그인에 임베디드 에이전트 러너와 같은 호스트 측 헬퍼에 대한 직접 접근을 제공하는 브리지입니다.
- **`api.registerEmbeddedExtensionFactory(...)`** — `tool_result` 같은 embedded-runner 이벤트를 관찰할 수 있었던, 제거된 Pi 전용 번들 extension hook입니다.

이러한 광범위한 import 표면은 이제 **deprecated** 상태입니다. 런타임에서는 여전히 작동하지만, 새 플러그인은 이를 사용하면 안 되며, 기존 플러그인도 다음 메이저 릴리스에서 제거되기 전에 마이그레이션해야 합니다. Pi 전용 embedded extension factory registration API는 제거되었으며, 대신 tool-result middleware를 사용해야 합니다.

OpenClaw는 대체 수단을 도입하는 동일한 변경에서 문서화된 Plugin 동작을 제거하거나 재해석하지 않습니다. 계약을 깨는 변경은 먼저 호환성 어댑터, 진단, 문서, 그리고 deprecation 기간을 거쳐야 합니다. 이는 SDK import, manifest 필드, setup API, hook, 런타임 등록 동작에 모두 적용됩니다.

<Warning>
  이전 버전 호환성 레이어는 향후 메이저 릴리스에서 제거될 예정입니다.
  여전히 이러한 표면에서 import하는 플러그인은 그 시점에 동작하지 않게 됩니다.
  Pi 전용 embedded extension factory registration은 이미 더 이상 로드되지 않습니다.
</Warning>

## 왜 변경되었나요

기존 접근 방식은 문제를 일으켰습니다.

- **느린 시작 속도** — 헬퍼 하나를 import하면 관련 없는 수십 개의 모듈이 로드됨
- **순환 의존성** — 광범위한 재-export 때문에 import cycle이 쉽게 생김
- **불명확한 API 표면** — 어떤 export가 안정적인지, 어떤 것이 내부용인지 구분할 방법이 없음

최신 Plugin SDK는 이를 해결합니다. 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는 목적이 명확하고 계약이 문서화된, 작고 독립적인 모듈입니다.

번들 채널을 위한 레거시 provider 편의 seam도 제거되었습니다. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`, `openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`, 채널 브랜드 헬퍼 seam, `openclaw/plugin-sdk/telegram-core` 같은 import는 안정적인 Plugin 계약이 아니라 내부 mono-repo 바로가기였습니다. 대신 범위가 좁은 일반 SDK subpath를 사용하세요. 번들 Plugin 워크스페이스 내부에서는 provider 소유 헬퍼를 해당 Plugin의 자체 `api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 provider 예시는 다음과 같습니다.

- Anthropic은 Claude 전용 스트림 헬퍼를 자체 `api.ts` / `contract-api.ts` seam에 유지합니다
- OpenAI는 provider builder, default-model 헬퍼, realtime provider builder를 자체 `api.ts`에 유지합니다
- OpenRouter는 provider builder와 onboarding/config 헬퍼를 자체 `api.ts`에 유지합니다

## 호환성 정책

외부 플러그인의 경우, 호환성 작업은 다음 순서를 따릅니다.

1. 새 계약 추가
2. 이전 동작이 호환성 어댑터를 통해 계속 연결되도록 유지
3. 이전 경로와 대체 수단을 명시하는 진단 또는 경고 출력
4. 테스트에서 두 경로 모두 다루기
5. deprecation 및 마이그레이션 경로 문서화
6. 공지된 마이그레이션 기간 이후에만 제거, 일반적으로 메이저 릴리스에서 제거

manifest 필드가 여전히 허용된다면, Plugin 작성자는 문서와 진단에서 달리 안내하기 전까지 계속 사용할 수 있습니다. 새 코드는 문서화된 대체 수단을 우선해야 하지만, 기존 플러그인은 일반적인 마이너 릴리스 동안 깨지면 안 됩니다.

## 마이그레이션 방법

<Steps>
  <Step title="Pi tool-result extension을 middleware로 마이그레이션">
    번들 플러그인은 Pi 전용
    `api.registerEmbeddedExtensionFactory(...)` tool-result handler를
    런타임 중립적인 middleware로 교체해야 합니다.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    동시에 Plugin manifest도 업데이트하세요.

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    외부 플러그인은 tool-result middleware를 등록할 수 없습니다.
    모델이 보기 전에 높은 신뢰도의 tool 출력을 다시 쓸 수 있기 때문입니다.

  </Step>

  <Step title="approval-native handler를 capability fact로 마이그레이션">
    approval 기능이 있는 채널 플러그인은 이제
    `approvalCapability.nativeRuntime`와 공유 runtime-context registry를 통해
    네이티브 approval 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`를
      `approvalCapability.nativeRuntime`으로 교체
    - approval 전용 auth/delivery를 레거시 `plugin.auth` /
      `plugin.approvals` 연결에서 분리해 `approvalCapability`로 이동
    - `ChannelPlugin.approvals`는 공개 channel-plugin
      계약에서 제거되었으며, delivery/native/render 필드는 `approvalCapability`로 이동해야 함
    - `plugin.auth`는 채널 login/logout 흐름에만 계속 사용됨. 그 안의 approval auth
      hook은 더 이상 core에서 읽지 않음
    - 클라이언트, 토큰, Bolt
      앱 같은 채널 소유 런타임 객체는 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록
    - 네이티브 approval handler에서 Plugin 소유 reroute 알림을 보내지 마세요.
      이제 core가 실제 delivery 결과를 바탕으로 routed-elsewhere 알림을 담당합니다
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때는
      실제 `createPluginRuntime().channel` 표면을 제공하세요. 부분 stub은 거부됩니다.

    현재 approval capability 레이아웃은 `/plugins/sdk-channel-plugins`를
    참조하세요.

  </Step>

  <Step title="Windows wrapper fallback 동작 점검">
    플러그인이 `openclaw/plugin-sdk/windows-spawn`를 사용하는 경우,
    이제 해결되지 않은 Windows `.cmd`/`.bat` wrapper는
    `allowShellFallback: true`를 명시적으로 전달하지 않으면 실패 종료됩니다.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 신뢰할 수 있는 호환성 호출자 중에서 의도적으로
      // shell 매개 fallback을 허용하는 경우에만 설정하세요.
      allowShellFallback: true,
    });
    ```

    호출자가 shell fallback에 의도적으로 의존하지 않는다면,
    `allowShellFallback`을 설정하지 말고 대신 발생한 오류를 처리하세요.

  </Step>

  <Step title="deprecated import 찾기">
    플러그인에서 deprecated 표면 중 하나에서 import하는 코드를 검색하세요.

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="범위가 좁은 import로 교체">
    이전 표면의 각 export는 특정 최신 import 경로에 대응됩니다.

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    호스트 측 헬퍼의 경우, 직접 import하는 대신 주입된 Plugin runtime을 사용하세요.

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    같은 패턴이 다른 레거시 bridge 헬퍼에도 적용됩니다.

    | Old import | 최신 대응 항목 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helpers | `api.runtime.agent.session.*` |

  </Step>

  <Step title="빌드 및 테스트">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## import 경로 참조

  <Accordion title="Common import path table">
  | Import path | 용도 | 주요 export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 표준 Plugin 진입 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 진입 정의/빌더용 레거시 umbrella 재-export | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 config 스키마 export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 provider 진입 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 범위가 명확한 채널 진입 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공용 setup wizard 헬퍼 | 허용 목록 프롬프트, setup 상태 빌더 |
  | `plugin-sdk/setup-runtime` | setup 시점 runtime 헬퍼 | import-safe setup patch adapter, lookup-note 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter 헬퍼 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup 도구 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 목록/config/action-gate 헬퍼 |
  | `plugin-sdk/account-id` | account-id 헬퍼 | `DEFAULT_ACCOUNT_ID`, account-id 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 + 기본 fallback 헬퍼 |
  | `plugin-sdk/account-helpers` | 범위가 좁은 계정 헬퍼 | 계정 목록/account-action 헬퍼 |
  | `plugin-sdk/channel-setup` | setup wizard adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM pairing 기본 구성 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 답장 접두사 + 입력 중 표시 연결 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter 팩터리 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config 스키마 빌더 | 공용 채널 config 스키마 기본 구성 요소; 번들 채널 이름 기반 스키마 export는 레거시 호환성용만 해당 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 config 헬퍼 | 명령 이름 정규화, 설명 다듬기, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 계정 상태 및 초안 스트림 수명 주기 헬퍼 | `createAccountStatusSink`, 초안 미리보기 완료 헬퍼 |
  | `plugin-sdk/inbound-envelope` | 인바운드 envelope 헬퍼 | 공용 route + envelope 빌더 헬퍼 |
  | `plugin-sdk/inbound-reply-dispatch` | 인바운드 답장 헬퍼 | 공용 record-and-dispatch 헬퍼 |
  | `plugin-sdk/messaging-targets` | 메시징 대상 파싱 | 대상 파싱/매칭 헬퍼 |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 헬퍼 | 공용 아웃바운드 미디어 로딩 |
  | `plugin-sdk/outbound-send-deps` | 아웃바운드 전송 의존성 헬퍼 | 전체 아웃바운드 runtime을 import하지 않고 사용하는 경량 `resolveOutboundSendDep` 조회 |
  | `plugin-sdk/outbound-runtime` | 아웃바운드 runtime 헬퍼 | 아웃바운드 전달, identity/send delegate, session, formatting, payload 계획 헬퍼 |
  | `plugin-sdk/thread-bindings-runtime` | thread-binding 헬퍼 | thread-binding 수명 주기 및 adapter 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 media payload 헬퍼 | 레거시 필드 레이아웃용 agent media payload 빌더 |
  | `plugin-sdk/channel-runtime` | deprecated 호환성 shim | 레거시 채널 runtime 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 답장 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 Plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 runtime 헬퍼 | runtime/logging/backup/plugin-install 헬퍼 |
  | `plugin-sdk/runtime-env` | 범위가 좁은 runtime env 헬퍼 | logger/runtime env, timeout, retry, backoff 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공용 Plugin runtime 헬퍼 | Plugin commands/hooks/http/interactive 헬퍼 |
  | `plugin-sdk/hook-runtime` | hook pipeline 헬퍼 | 공용 Webhook/internal hook pipeline 헬퍼 |
  | `plugin-sdk/lazy-runtime` | lazy runtime 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공용 exec 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI runtime 헬퍼 | 명령 formatting, 대기, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway 클라이언트 및 channel-status patch 헬퍼 |
  | `plugin-sdk/config-runtime` | config 헬퍼 | config 로드/쓰기 헬퍼 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때를 위한 fallback-stable Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | approval 프롬프트 헬퍼 | exec/plugin approval payload, approval capability/profile 헬퍼, 네이티브 approval routing/runtime 헬퍼, 구조화된 approval 표시 경로 formatting |
  | `plugin-sdk/approval-auth-runtime` | approval auth 헬퍼 | approver 해석, 동일 채팅 action auth |
  | `plugin-sdk/approval-client-runtime` | approval 클라이언트 헬퍼 | 네이티브 exec approval profile/filter 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | approval 전달 헬퍼 | 네이티브 approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | approval Gateway 헬퍼 | 공용 approval gateway-resolution 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | approval adapter 헬퍼 | hot channel entrypoint를 위한 경량 네이티브 approval adapter 로딩 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | approval handler 헬퍼 | 더 광범위한 approval handler runtime 헬퍼; adapter/gateway seam만으로 충분하다면 더 좁은 쪽을 우선 사용 |
  | `plugin-sdk/approval-native-runtime` | approval 대상 헬퍼 | 네이티브 approval target/account binding 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | approval 답장 헬퍼 | exec/plugin approval reply payload 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 runtime-context 헬퍼 | 일반적인 채널 runtime-context register/get/watch 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공용 trust, DM gating, external-content, secret-collection 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 allowlist 및 private-network 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF runtime 헬퍼 | pinned-dispatcher, guarded fetch, SSRF 정책 헬퍼 |
  | `plugin-sdk/collection-runtime` | 경계가 있는 캐시 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 gating 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 formatting 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, 오류 그래프 헬퍼 |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/proxy 헬퍼 | `resolveFetch`, proxy 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry 헬퍼 | `RetryConfig`, `retryAsync`, 정책 실행기 |
  | `plugin-sdk/allow-from` | allowlist formatting | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | allowlist 입력 매핑 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 gating 및 command-surface 헬퍼 | `resolveControlCommandGate`, sender-authorization 헬퍼, 동적 인수 메뉴 formatting을 포함한 command registry 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/도움말 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret 입력 파싱 | secret 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 guard 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공용 답장 runtime | 인바운드 dispatch, heartbeat, 답장 planner, 청킹 |
  | `plugin-sdk/reply-dispatch-runtime` | 범위가 좁은 답장 dispatch 헬퍼 | 완료, provider dispatch, 대화 라벨 헬퍼 |
  | `plugin-sdk/reply-history` | reply-history 헬퍼 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 답장 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 답장 청크 헬퍼 | 텍스트/markdown 청킹 헬퍼 |
  | `plugin-sdk/session-store-runtime` | session store 헬퍼 | 저장소 경로 + updated-at 헬퍼 |
  | `plugin-sdk/state-paths` | 상태 경로 헬퍼 | 상태 및 OAuth 디렉터리 헬퍼 |
  | `plugin-sdk/routing` | routing/session-key 헬퍼 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key 정규화 헬퍼 |
  | `plugin-sdk/status-helpers` | 채널 상태 헬퍼 | 채널/계정 상태 요약 빌더, runtime-state 기본값, issue 메타데이터 헬퍼 |
  | `plugin-sdk/target-resolver-runtime` | 대상 해석 헬퍼 | 공용 target resolver 헬퍼 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 헬퍼 | slug/string 정규화 헬퍼 |
  | `plugin-sdk/request-url` | 요청 URL 헬퍼 | request 유사 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 헬퍼 | stdout/stderr가 정규화된 시간 제한 명령 실행기 |
  | `plugin-sdk/param-readers` | 파라미터 리더 | 공용 tool/CLI 파라미터 리더 |
  | `plugin-sdk/tool-payload` | tool payload 추출 | tool 결과 객체에서 정규화된 payload 추출 |
  | `plugin-sdk/tool-send` | tool send 추출 | tool 인수에서 표준 send target 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 헬퍼 | 공용 temp-download 경로 헬퍼 |
  | `plugin-sdk/logging-core` | 로깅 헬퍼 | 서브시스템 logger 및 redaction 헬퍼 |
  | `plugin-sdk/markdown-table-runtime` | markdown-table 헬퍼 | markdown 표 모드 헬퍼 |
  | `plugin-sdk/reply-payload` | 메시지 답장 타입 | 답장 payload 타입 |
  | `plugin-sdk/provider-setup` | 엄선된 로컬/self-hosted provider setup 헬퍼 | self-hosted provider 검색/config 헬퍼 |
  | `plugin-sdk/self-hosted-provider-setup` | 범위가 명확한 OpenAI 호환 self-hosted provider setup 헬퍼 | 동일한 self-hosted provider 검색/config 헬퍼 |
  | `plugin-sdk/provider-auth-runtime` | provider runtime auth 헬퍼 | runtime API-key 해석 헬퍼 |
  | `plugin-sdk/provider-auth-api-key` | provider API-key setup 헬퍼 | API-key onboarding/profile-write 헬퍼 |
  | `plugin-sdk/provider-auth-result` | provider auth-result 헬퍼 | 표준 OAuth auth-result 빌더 |
  | `plugin-sdk/provider-auth-login` | provider 대화형 login 헬퍼 | 공용 대화형 login 헬퍼 |
  | `plugin-sdk/provider-selection-runtime` | provider 선택 헬퍼 | configured-or-auto provider 선택 및 raw provider config 병합 |
  | `plugin-sdk/provider-env-vars` | Provider env-var 헬퍼 | Provider auth env-var 조회 헬퍼 |
  | `plugin-sdk/provider-model-shared` | 공용 provider model/replay 헬퍼 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공용 replay-policy 빌더, provider-endpoint 헬퍼, model-id 정규화 헬퍼 |
  | `plugin-sdk/provider-catalog-shared` | 공용 provider catalog 헬퍼 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider 온보딩 패치 | 온보딩 config 헬퍼 |
  | `plugin-sdk/provider-http` | Provider HTTP 헬퍼 | 오디오 transcription multipart form 헬퍼를 포함한 일반 provider HTTP/endpoint capability 헬퍼 |
  | `plugin-sdk/provider-web-fetch` | Provider web-fetch 헬퍼 | web-fetch provider 등록/캐시 헬퍼 |
  | `plugin-sdk/provider-web-search-config-contract` | Provider web-search config 헬퍼 | Plugin 활성화 연결이 필요 없는 provider를 위한 범위가 좁은 web-search config/credential 헬퍼 |
  | `plugin-sdk/provider-web-search-contract` | Provider web-search 계약 헬퍼 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위가 지정된 credential setter/getter 같은 범위가 좁은 web-search config/credential 계약 헬퍼 |
  | `plugin-sdk/provider-web-search` | Provider web-search 헬퍼 | web-search provider 등록/캐시/runtime 헬퍼 |
  | `plugin-sdk/provider-tools` | Provider tool/schema compat 헬퍼 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + diagnostics, `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI compat 헬퍼 |
  | `plugin-sdk/provider-usage` | Provider usage 헬퍼 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, 기타 provider usage 헬퍼 |
  | `plugin-sdk/provider-stream` | Provider stream wrapper 헬퍼 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper 타입, 공용 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper 헬퍼 |
  | `plugin-sdk/provider-transport-runtime` | Provider transport 헬퍼 | guarded fetch, transport message transform, 쓰기 가능한 transport event stream 같은 네이티브 provider transport 헬퍼 |
  | `plugin-sdk/keyed-async-queue` | 순서가 있는 async queue | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공용 media 헬퍼 | media fetch/transform/store 헬퍼와 media payload 빌더 |
  | `plugin-sdk/media-generation-runtime` | 공용 media-generation 헬퍼 | 이미지/비디오/음악 생성을 위한 공용 failover 헬퍼, candidate 선택, missing-model 메시징 |
  | `plugin-sdk/media-understanding` | media-understanding 헬퍼 | media understanding provider 타입과 provider 측 image/audio 헬퍼 export |
  | `plugin-sdk/text-runtime` | 공용 텍스트 헬퍼 | assistant-visible-text 제거, markdown 렌더링/청킹/표 헬퍼, redaction 헬퍼, directive-tag 헬퍼, safe-text 유틸리티, 관련 텍스트/로깅 헬퍼 |
  | `plugin-sdk/text-chunking` | 텍스트 청킹 헬퍼 | 아웃바운드 텍스트 청킹 헬퍼 |
  | `plugin-sdk/speech` | 음성 헬퍼 | 음성 provider 타입과 provider 측 directive, registry, 검증 헬퍼 |
  | `plugin-sdk/speech-core` | 공용 음성 코어 | 음성 provider 타입, registry, directive, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 transcription 헬퍼 | provider 타입, registry 헬퍼, 공용 WebSocket session 헬퍼 |
  | `plugin-sdk/realtime-voice` | 실시간 음성 헬퍼 | provider 타입, registry/resolution 헬퍼, bridge session 헬퍼 |
  | `plugin-sdk/image-generation-core` | 공용 image-generation 코어 | image-generation 타입, failover, auth, registry 헬퍼 |
  | `plugin-sdk/music-generation` | music-generation 헬퍼 | music-generation provider/request/result 타입 |
  | `plugin-sdk/music-generation-core` | 공용 music-generation 코어 | music-generation 타입, failover 헬퍼, provider 조회, model-ref 파싱 |
  | `plugin-sdk/video-generation` | video-generation 헬퍼 | video-generation provider/request/result 타입 |
  | `plugin-sdk/video-generation-core` | 공용 video-generation 코어 | video-generation 타입, failover 헬퍼, provider 조회, model-ref 파싱 |
  | `plugin-sdk/interactive-runtime` | 대화형 답장 헬퍼 | 대화형 답장 payload 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | 채널 config 기본 구성 요소 | 범위가 좁은 채널 config-schema 기본 구성 요소 |
  | `plugin-sdk/channel-config-writes` | 채널 config-write 헬퍼 | 채널 config-write 인증 헬퍼 |
  | `plugin-sdk/channel-plugin-common` | 공용 채널 prelude | 공용 채널 Plugin prelude export |
  | `plugin-sdk/channel-status` | 채널 상태 헬퍼 | 공용 채널 상태 스냅샷/요약 헬퍼 |
  | `plugin-sdk/allowlist-config-edit` | allowlist config 헬퍼 | allowlist config 편집/읽기 헬퍼 |
  | `plugin-sdk/group-access` | 그룹 액세스 헬퍼 | 공용 group-access 결정 헬퍼 |
  | `plugin-sdk/direct-dm` | direct-DM 헬퍼 | 공용 direct-DM auth/guard 헬퍼 |
  | `plugin-sdk/extension-shared` | 공용 extension 헬퍼 | passive-channel/status 및 ambient proxy 헬퍼 기본 구성 요소 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 헬퍼 | Webhook 대상 registry 및 route-install 헬퍼 |
  | `plugin-sdk/webhook-path` | Webhook 경로 헬퍼 | Webhook 경로 정규화 헬퍼 |
  | `plugin-sdk/web-media` | 공용 웹 media 헬퍼 | 원격/로컬 media 로딩 헬퍼 |
  | `plugin-sdk/zod` | Zod 재-export | Plugin SDK 소비자를 위한 `zod` 재-export |
  | `plugin-sdk/memory-core` | 번들 memory-core 헬퍼 | Memory manager/config/file/CLI 헬퍼 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | Memory 엔진 runtime 파사드 | Memory index/search runtime 파사드 |
  | `plugin-sdk/memory-core-host-engine-foundation` | Memory 호스트 foundation 엔진 | Memory 호스트 foundation 엔진 export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Memory 호스트 임베딩 엔진 | Memory 임베딩 계약, registry 접근, 로컬 provider, 일반 batch/remote 헬퍼; 구체적인 remote provider는 해당 소유 Plugin에 위치 |
  | `plugin-sdk/memory-core-host-engine-qmd` | Memory 호스트 QMD 엔진 | Memory 호스트 QMD 엔진 export |
  | `plugin-sdk/memory-core-host-engine-storage` | Memory 호스트 저장소 엔진 | Memory 호스트 저장소 엔진 export |
  | `plugin-sdk/memory-core-host-multimodal` | Memory 호스트 멀티모달 헬퍼 | Memory 호스트 멀티모달 헬퍼 |
  | `plugin-sdk/memory-core-host-query` | Memory 호스트 query 헬퍼 | Memory 호스트 query 헬퍼 |
  | `plugin-sdk/memory-core-host-secret` | Memory 호스트 secret 헬퍼 | Memory 호스트 secret 헬퍼 |
  | `plugin-sdk/memory-core-host-events` | Memory 호스트 event journal 헬퍼 | Memory 호스트 event journal 헬퍼 |
  | `plugin-sdk/memory-core-host-status` | Memory 호스트 상태 헬퍼 | Memory 호스트 상태 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-cli` | Memory 호스트 CLI runtime | Memory 호스트 CLI runtime 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-core` | Memory 호스트 코어 runtime | Memory 호스트 코어 runtime 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-files` | Memory 호스트 파일/runtime 헬퍼 | Memory 호스트 파일/runtime 헬퍼 |
  | `plugin-sdk/memory-host-core` | Memory 호스트 코어 runtime 별칭 | Memory 호스트 코어 runtime 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-events` | Memory 호스트 event journal 별칭 | Memory 호스트 event journal 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-files` | Memory 호스트 파일/runtime 별칭 | Memory 호스트 파일/runtime 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-markdown` | 관리형 markdown 헬퍼 | memory 인접 플러그인을 위한 공용 managed-markdown 헬퍼 |
  | `plugin-sdk/memory-host-search` | Active Memory 검색 파사드 | lazy active-memory search-manager runtime 파사드 |
  | `plugin-sdk/memory-host-status` | Memory 호스트 상태 별칭 | Memory 호스트 상태 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb 헬퍼 | Memory-lancedb 헬퍼 표면 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 테스트 헬퍼 및 mock |
</Accordion>

이 표는 전체 SDK 표면이 아니라, 의도적으로 일반적인 마이그레이션 하위 집합만 다룹니다. 200개가 넘는 전체 entrypoint 목록은 `scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

그 목록에는 여전히 `plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`, `plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은 일부 번들 Plugin 헬퍼 seam도 포함되어 있습니다. 이들은 번들 Plugin 유지보수와 호환성을 위해 계속 export되지만, 일반적인 마이그레이션 표에서는 의도적으로 제외되며 새 Plugin 코드의 권장 대상은 아닙니다.

같은 규칙은 다음과 같은 다른 번들 헬퍼 계열에도 적용됩니다.

- 브라우저 지원 헬퍼: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`, `plugin-sdk/mattermost*`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diagnostics-prometheus`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` 같은 번들 헬퍼/Plugin 표면

`plugin-sdk/github-copilot-token`은 현재 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`으로 이루어진 범위가 좁은 토큰 헬퍼 표면을 노출합니다.

작업에 맞는 가장 범위가 좁은 import를 사용하세요. export를 찾을 수 없다면 `src/plugin-sdk/`의 소스를 확인하거나 Discord에서 문의하세요.

## 현재 deprecated 상태인 항목

Plugin SDK, provider 계약, runtime 표면, manifest 전반에 적용되는 더 좁은 범위의 deprecated 항목입니다. 각각은 현재도 작동하지만, 향후 메이저 릴리스에서 제거될 예정입니다. 각 항목 아래의 항목은 이전 API를 표준 대체 수단에 매핑합니다.

<AccordionGroup>
  <Accordion title="command-auth help builder → command-status">
    **이전 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **새 방식 (`openclaw/plugin-sdk/command-status`)**: 동일한 시그니처, 동일한
    export이지만 더 범위가 좁은 subpath에서 import합니다. `command-auth`는
    호환성 stub으로 이를 재-export합니다.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helper → resolveInboundMentionDecision">
    **이전**: `resolveInboundMentionRequirement({ facts, policy })`와
    `shouldDropInboundForMention(...)`를
    `openclaw/plugin-sdk/channel-inbound` 또는
    `openclaw/plugin-sdk/channel-mention-gating`에서 사용.

    **새 방식**: `resolveInboundMentionDecision({ facts, policy })` — 두 개로 나뉜 호출 대신
    단일 결정 객체를 반환합니다.

    다운스트림 채널 플러그인(Slack, Discord, Matrix, MS Teams)은 이미
    전환을 마쳤습니다.

  </Accordion>

  <Accordion title="Channel runtime shim 및 channel actions helper">
    `openclaw/plugin-sdk/channel-runtime`은 이전 채널 플러그인을 위한
    호환성 shim입니다. 새 코드에서는 import하지 말고, runtime 객체 등록에는
    `openclaw/plugin-sdk/channel-runtime-context`를 사용하세요.

    `openclaw/plugin-sdk/channel-actions`의 `channelActions*` 헬퍼는
    원시 "actions" 채널 export와 함께 deprecated 상태입니다. 대신 의미론적인
    `presentation` 표면을 통해 capability를 노출하세요. 즉, 채널 플러그인은
    어떤 원시 action 이름을 허용하는지가 아니라 무엇을 렌더링하는지
    (카드, 버튼, 선택 항목)를 선언해야 합니다.

  </Accordion>

  <Accordion title="Web search provider tool() helper → Plugin의 createTool()">
    **이전**: `openclaw/plugin-sdk/provider-web-search`의 `tool()` 팩터리.

    **새 방식**: provider Plugin에서 직접 `createTool(...)`을 구현합니다.
    OpenClaw는 더 이상 tool wrapper 등록에 SDK 헬퍼를 필요로 하지 않습니다.

  </Accordion>

  <Accordion title="Plaintext channel envelope → BodyForAgent">
    **이전**: `formatInboundEnvelope(...)`(및
    `ChannelMessageForAgent.channelEnvelope`)를 사용해 인바운드 채널 메시지로부터
    평면 plaintext 프롬프트 envelope를 구성했습니다.

    **새 방식**: `BodyForAgent`와 구조화된 user-context 블록을 사용합니다. 채널
    플러그인은 route 메타데이터(thread, topic, reply-to, reactions)를
    프롬프트 문자열에 이어 붙이는 대신 타입이 있는 필드로 첨부합니다.
    `formatAgentEnvelope(...)` 헬퍼는 합성된 assistant 대상 envelope에는 여전히
    지원되지만, 인바운드 plaintext envelope는 점차 사라질 예정입니다.

    영향 범위: `inbound_claim`, `message_received`, 그리고 `channelEnvelope`
    텍스트를 후처리하던 모든 커스텀 채널 Plugin.

  </Accordion>

  <Accordion title="Provider discovery type → provider catalog type">
    이제 네 가지 discovery 타입 별칭은
    catalog 시대 타입의 얇은 래퍼입니다.

    | 이전 별칭 | 새 타입 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    추가로 레거시 `ProviderCapabilities` 정적 bag도 deprecated 상태입니다.
    provider 플러그인은 정적 객체가 아니라 provider runtime 계약을 통해
    capability fact를 연결해야 합니다.

  </Accordion>

  <Accordion title="Thinking policy hook → resolveThinkingProfile">
    **이전** (`ProviderThinkingPolicy`의 분리된 세 개의 hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, 그리고
    `resolveDefaultThinkingLevel(ctx)`.

    **새 방식**: 표준 `id`, 선택적 `label`, 정렬된 수준 목록을 반환하는
    단일 `resolveThinkingProfile(ctx)`입니다.

    OpenClaw는 오래된 저장 값을 profile 순위에 따라 자동으로 하향 조정합니다.

    세 개 대신 하나의 hook만 구현하면 됩니다. 레거시 hook은 deprecated 기간 동안
    계속 작동하지만 profile 결과와 함께 조합되지는 않습니다.

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **이전**: Plugin manifest에 provider를 선언하지 않고
    `resolveExternalOAuthProfiles(...)`를 구현.

    **새 방식**: Plugin manifest에 `contracts.externalAuthProviders`를 선언하고
    **동시에** `resolveExternalAuthProfiles(...)`도 구현해야 합니다. 이전 "auth
    fallback" 경로는 런타임 경고를 발생시키며 제거될 예정입니다.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **이전** manifest 필드: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **새 방식**: 동일한 env-var 조회를 manifest의 `setup.providers[].envVars`에도
    반영하세요. 이렇게 하면 setup/status env 메타데이터를 한 곳으로 통합할 수 있고,
    env-var 조회에 응답하기 위해 Plugin runtime을 부팅할 필요가 없어집니다.

    `providerAuthEnvVars`는 deprecated 기간이 끝날 때까지 호환성 어댑터를 통해
    계속 지원됩니다.

  </Accordion>

  <Accordion title="Memory Plugin 등록 → registerMemoryCapability">
    **이전**: 세 개의 분리된 호출 —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **새 방식**: memory-state API에서 하나의 호출 —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    동일한 슬롯이지만 등록 호출은 하나입니다. 추가형 memory 헬퍼
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`)는 영향을 받지 않습니다.

  </Accordion>

  <Accordion title="Subagent session message 타입 이름 변경">
    두 개의 레거시 타입 별칭이 여전히 `src/plugins/runtime/types.ts`에서 export됩니다.

    | 이전 | 새 이름 |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    runtime 메서드 `readSession`은 이제 `getSessionMessages`를 사용하는 것이 권장됩니다.
    시그니처는 동일하며, 이전 메서드는 새 메서드를 호출합니다.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **이전**: `runtime.tasks.flow`(단수)는 live task-flow accessor를 반환했습니다.

    **새 방식**: `runtime.tasks.flows`(복수)는 DTO 기반 TaskFlow 접근을 반환하며,
    import-safe하고 전체 task runtime을 로드할 필요가 없습니다.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow(ctx);
    // After
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factory → agent tool-result middleware">
    위의 "마이그레이션 방법 → Pi tool-result extension을
    middleware로 마이그레이션"에서 다뤘습니다. 완전성을 위해 여기에 다시 적으면,
    제거된 Pi 전용 `api.registerEmbeddedExtensionFactory(...)` 경로는
    `contracts.agentToolResultMiddleware`의 명시적 runtime 목록과 함께
    `api.registerAgentToolResultMiddleware(...)`로 대체되었습니다.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk`에서 재-export되는 `OpenClawSchemaType`은 이제
    `OpenClawConfig`에 대한 한 줄짜리 별칭입니다. 표준 이름을 사용하세요.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 아래의 번들 채널/provider 플러그인 내부에 있는 extension 수준 deprecated 항목은
해당 플러그인의 자체 `api.ts` 및 `runtime-api.ts` barrel 안에서 추적됩니다.
이들은 서드파티 Plugin 계약에는 영향을 주지 않으며 여기에 나열되지 않습니다.
번들 Plugin의 로컬 barrel을 직접 사용하고 있다면 업그레이드 전에 해당 barrel의
deprecated 주석을 읽어보세요.
</Note>

## 제거 일정

| 시점 | 발생하는 일 |
| ---------------------- | ----------------------------------------------------------------------- |
| **현재** | deprecated 표면이 런타임 경고를 출력함 |
| **다음 메이저 릴리스** | deprecated 표면이 제거되며, 여전히 이를 사용하는 플러그인은 동작하지 않게 됨 |

모든 core 플러그인은 이미 마이그레이션되었습니다. 외부 플러그인은 다음 메이저 릴리스 전에 마이그레이션해야 합니다.

## 경고를 일시적으로 숨기기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요.

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이것은 영구적인 해결책이 아니라 임시 우회 수단입니다.

## 관련 문서

- [시작하기](/ko/plugins/building-plugins) — 첫 번째 Plugin 만들기
- [SDK 개요](/ko/plugins/sdk-overview) — 전체 subpath import 참조
- [채널 플러그인](/ko/plugins/sdk-channel-plugins) — 채널 플러그인 만들기
- [Provider 플러그인](/ko/plugins/sdk-provider-plugins) — provider 플러그인 만들기
- [Plugin 내부 구조](/ko/plugins/architecture) — 아키텍처 심화 설명
- [Plugin Manifest](/ko/plugins/manifest) — manifest 스키마 참조
