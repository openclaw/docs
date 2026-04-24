---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 경고가 표시됩니다'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 경고가 표시됩니다'
    - Plugin을 최신 Plugin 아키텍처로 업데이트하고 있습니다
    - 외부 OpenClaw Plugin을 유지 관리하고 있습니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 Plugin SDK로 마이그레이션하세요
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-04-24T09:00:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1461ae8a7de0a802c9deb59f843e7d93d9d73bea22c27d837ca2db8ae9d14b7
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw는 광범위한 하위 호환성 계층에서, 범위가 명확하고 문서화된 import를 사용하는 최신 Plugin
아키텍처로 이동했습니다. Plugin이 새 아키텍처 이전에 만들어졌다면,
이 가이드가 마이그레이션에 도움이 됩니다.

## 변경되는 사항

기존 Plugin 시스템은 Plugin이 단일 진입점에서 필요한 모든 것을
가져올 수 있도록 두 개의 광범위한 표면을 제공했습니다:

- **`openclaw/plugin-sdk/compat`** — 수십 개의
  헬퍼를 재내보내는 단일 import입니다. 새 Plugin 아키텍처가 구축되는 동안
  오래된 hook 기반 Plugins가 계속 작동하도록 도입되었습니다.
- **`openclaw/extension-api`** — 임베디드 에이전트 실행기 같은
  호스트 측 헬퍼에 Plugin이 직접 접근할 수 있도록 해주는 브리지입니다.

이 두 표면은 이제 모두 **deprecated** 상태입니다. 런타임에서는 여전히 동작하지만, 새
Plugins는 이를 사용하면 안 되며, 기존 Plugins는 다음 주요 릴리스에서 제거되기 전에
마이그레이션해야 합니다.

OpenClaw는 대체 수단을 도입하는 동일한 변경에서 문서화된 Plugin 동작을
제거하거나 재해석하지 않습니다. 계약을 깨는 변경은 먼저
호환성 어댑터, 진단, 문서, deprecated 기간을 거쳐야 합니다.
이는 SDK import, manifest 필드, setup API, hooks, 런타임
등록 동작에 적용됩니다.

<Warning>
  하위 호환성 계층은 향후 주요 릴리스에서 제거될 예정입니다.
  여전히 이 표면에서 import하는 Plugins는 그 시점에 중단됩니다.
</Warning>

## 변경된 이유

기존 접근 방식은 다음과 같은 문제를 일으켰습니다:

- **느린 시작** — 하나의 헬퍼를 import하면 관련 없는 수십 개의 모듈이 로드됨
- **순환 의존성** — 광범위한 재내보내기로 인해 import cycle이 쉽게 생성됨
- **불명확한 API 표면** — 어떤 export가 안정적이고 어떤 것이 내부용인지 구분할 방법이 없음

최신 Plugin SDK는 이를 해결합니다. 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는
명확한 목적과 문서화된 계약을 가진 작고 독립적인 모듈입니다.

번들 채널용 레거시 provider 편의 seam도 제거되었습니다. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
채널 브랜드 헬퍼 seam, 그리고
`openclaw/plugin-sdk/telegram-core` 같은 import는 안정적인 Plugin 계약이 아니라
비공개 mono-repo 단축 경로였습니다. 대신 범위가 좁은 일반 SDK 하위 경로를 사용하세요. 번들 Plugin workspace 내부에서는, provider 소유 헬퍼를 해당 Plugin의 자체
`api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 provider 예시:

- Anthropic은 Claude 전용 stream 헬퍼를 자체 `api.ts` /
  `contract-api.ts` seam에 유지합니다
- OpenAI는 provider builder, 기본 model 헬퍼, realtime provider
  builder를 자체 `api.ts`에 유지합니다
- OpenRouter는 provider builder와 onboarding/config 헬퍼를 자체
  `api.ts`에 유지합니다

## 호환성 정책

외부 Plugins의 경우 호환성 작업은 다음 순서를 따릅니다:

1. 새 계약 추가
2. 기존 동작을 호환성 어댑터를 통해 계속 연결
3. 기존 경로와 대체 경로를 명시하는 진단 또는 경고 출력
4. 테스트에서 두 경로 모두 다룸
5. deprecated 및 마이그레이션 경로 문서화
6. 공지된 마이그레이션 기간이 지난 후에만 제거하며, 보통 주요 릴리스에서 수행

manifest 필드가 여전히 허용된다면, Plugin 작성자는 문서와 진단에서 달리 안내하기 전까지
계속 사용할 수 있습니다. 새 코드는 문서화된 대체 수단을 우선해야 하지만,
기존 Plugins는 일반적인 부 릴리스 동안 중단되어서는 안 됩니다.

## 마이그레이션 방법

<Steps>
  <Step title="승인 네이티브 핸들러를 capability fact로 마이그레이션">
    승인 기능이 있는 채널 Plugins는 이제
    `approvalCapability.nativeRuntime`과 공유 runtime-context 레지스트리를 통해
    네이티브 승인 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`를
      `approvalCapability.nativeRuntime`으로 교체
    - 승인 전용 auth/delivery를 레거시 `plugin.auth` /
      `plugin.approvals` 연결에서 분리해 `approvalCapability`로 이동
    - `ChannelPlugin.approvals`는 공개 채널 Plugin
      계약에서 제거되었으므로, delivery/native/render 필드를 `approvalCapability`로 이동
    - `plugin.auth`는 채널 login/logout 흐름에만 남아 있으며, 그 안의 승인 auth
      hook은 더 이상 코어에서 읽지 않음
    - 클라이언트, token, Bolt
      앱 같은 채널 소유 런타임 객체는 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록
    - Plugin 소유 reroute 알림을 네이티브 승인 핸들러에서 보내지 마세요.
      이제 코어가 실제 delivery 결과에서 routed-elsewhere 알림을 소유합니다
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때는
      실제 `createPluginRuntime().channel` 표면을 제공하세요. 부분 stub은 거부됩니다.

    현재 approval capability
    레이아웃은 `/plugins/sdk-channel-plugins`를 참조하세요.

  </Step>

  <Step title="Windows wrapper 폴백 동작 점검">
    Plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우,
    해석되지 않은 Windows `.cmd`/`.bat` wrapper는 이제 명시적으로
    `allowShellFallback: true`를 전달하지 않으면 닫힌 상태로 실패합니다.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 의도적으로
      // shell 매개 폴백을 허용하는 신뢰된 호환성 호출자에만 설정하세요.
      allowShellFallback: true,
    });
    ```

    호출자가 shell 폴백에 의도적으로 의존하지 않는다면,
    `allowShellFallback`을 설정하지 말고 대신 발생한 오류를 처리하세요.

  </Step>

  <Step title="deprecated import 찾기">
    Plugin에서 deprecated 표면 두 곳의 import를 검색하세요:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="범위가 좁은 import로 교체">
    기존 표면의 각 export는 특정 최신 import 경로에 매핑됩니다:

    ```typescript
    // Before (deprecated 하위 호환성 계층)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (최신 범위 집중 import)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    호스트 측 헬퍼는 직접 import하는 대신
    주입된 Plugin 런타임을 사용하세요:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (주입된 런타임)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    동일한 패턴이 다른 레거시 브리지 헬퍼에도 적용됩니다:

    | Old import | Modern equivalent |
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

## Import 경로 참조

  <Accordion title="일반적인 import 경로 표">
  | Import path | Purpose | Key exports |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 정식 Plugin 진입 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 진입 정의/빌더용 레거시 umbrella 재내보내기 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 config schema export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 provider 진입 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 범위가 좁은 채널 진입 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공유 setup 마법사 헬퍼 | Allowlist 프롬프트, setup status 빌더 |
  | `plugin-sdk/setup-runtime` | setup 시점 런타임 헬퍼 | import 안전 setup patch 어댑터, lookup-note 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임 setup 프록시 |
  | `plugin-sdk/setup-adapter-runtime` | setup 어댑터 헬퍼 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup 도구 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 목록/config/action-gate 헬퍼 |
  | `plugin-sdk/account-id` | account-id 헬퍼 | `DEFAULT_ACCOUNT_ID`, account-id 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 + 기본값 폴백 헬퍼 |
  | `plugin-sdk/account-helpers` | 범위가 좁은 계정 헬퍼 | 계정 목록/account-action 헬퍼 |
  | `plugin-sdk/channel-setup` | setup 마법사 어댑터 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 페어링 기본 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 답장 접두사 + 입력 중 wiring | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config 어댑터 팩터리 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config schema 빌더 | 채널 config schema 타입 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 config 헬퍼 | 명령 이름 정규화, 설명 잘라내기, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 계정 상태 및 draft stream 수명 주기 헬퍼 | `createAccountStatusSink`, draft 미리보기 finalize 헬퍼 |
  | `plugin-sdk/inbound-envelope` | 수신 envelope 헬퍼 | 공유 route + envelope 빌더 헬퍼 |
  | `plugin-sdk/inbound-reply-dispatch` | 수신 reply 헬퍼 | 공유 record-and-dispatch 헬퍼 |
  | `plugin-sdk/messaging-targets` | 메시징 대상 구문 분석 | 대상 구문 분석/매칭 헬퍼 |
  | `plugin-sdk/outbound-media` | 발신 미디어 헬퍼 | 공유 발신 미디어 로드 |
  | `plugin-sdk/outbound-runtime` | 발신 런타임 헬퍼 | 발신 identity/send delegate 및 payload 계획 헬퍼 |
  | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 헬퍼 | 스레드 바인딩 수명 주기 및 어댑터 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 payload 헬퍼 | 레거시 필드 레이아웃용 에이전트 미디어 payload 빌더 |
  | `plugin-sdk/channel-runtime` | deprecated 호환성 shim | 레거시 채널 런타임 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 답장 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 Plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 런타임 헬퍼 | 런타임/로깅/백업/Plugin 설치 헬퍼 |
  | `plugin-sdk/runtime-env` | 범위가 좁은 런타임 env 헬퍼 | 로거/런타임 env, timeout, retry, backoff 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공유 Plugin 런타임 헬퍼 | Plugin 명령/hooks/http/interactive 헬퍼 |
  | `plugin-sdk/hook-runtime` | hook 파이프라인 헬퍼 | 공유 Webhook/내부 hook 파이프라인 헬퍼 |
  | `plugin-sdk/lazy-runtime` | 지연 런타임 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공유 exec 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI 런타임 헬퍼 | 명령 서식 지정, 대기, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway 클라이언트 및 channel-status patch 헬퍼 |
  | `plugin-sdk/config-runtime` | config 헬퍼 | config 로드/쓰기 헬퍼 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때의 안정적인 폴백 Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 헬퍼 | exec/Plugin 승인 payload, approval capability/profile 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼 |
  | `plugin-sdk/approval-auth-runtime` | 승인 auth 헬퍼 | approver 해석, 동일 채팅 action auth |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 헬퍼 | 네이티브 exec approval profile/filter 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 헬퍼 | 네이티브 approval capability/delivery 어댑터 |
  | `plugin-sdk/approval-gateway-runtime` | 승인 Gateway 헬퍼 | 공유 approval gateway-resolution 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 어댑터 헬퍼 | hot channel entrypoint용 경량 네이티브 approval 어댑터 로드 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | 승인 핸들러 헬퍼 | 더 광범위한 approval handler 런타임 헬퍼이며, 더 좁은 adapter/gateway seam으로 충분하다면 그것을 우선하세요 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 헬퍼 | 네이티브 approval 대상/account binding 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | 승인 reply 헬퍼 | exec/Plugin approval reply payload 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 runtime-context 헬퍼 | 일반 채널 runtime-context register/get/watch 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공유 trust, DM gating, 외부 콘텐츠, secret 수집 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 allowlist 및 사설 네트워크 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF 런타임 헬퍼 | pinned-dispatcher, guarded fetch, SSRF 정책 헬퍼 |
  | `plugin-sdk/collection-runtime` | 범위 제한 캐시 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 게이팅 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 서식 지정 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, error graph 헬퍼 |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/프록시 헬퍼 | `resolveFetch`, 프록시 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | retry 헬퍼 | `RetryConfig`, `retryAsync`, 정책 실행기 |
  | `plugin-sdk/allow-from` | 허용 목록 서식 지정 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 허용 목록 입력 매핑 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅 및 명령 표면 헬퍼 | `resolveControlCommandGate`, 발신자 권한 부여 헬퍼, 명령 레지스트리 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/도움말 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret 입력 구문 분석 | secret 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 가드 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공유 reply 런타임 | 수신 dispatch, Heartbeat, reply planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 범위가 좁은 reply dispatch 헬퍼 | finalize, provider dispatch, conversation-label 헬퍼 |
  | `plugin-sdk/reply-history` | reply-history 헬퍼 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | reply 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | reply chunk 헬퍼 | 텍스트/markdown chunking 헬퍼 |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 헬퍼 | 저장소 경로 + updated-at 헬퍼 |
  | `plugin-sdk/state-paths` | 상태 경로 헬퍼 | 상태 및 OAuth 디렉터리 헬퍼 |
  | `plugin-sdk/routing` | 라우팅/session-key 헬퍼 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, session-key 정규화 헬퍼 |
  | `plugin-sdk/status-helpers` | 채널 상태 헬퍼 | 채널/계정 상태 요약 빌더, runtime-state 기본값, issue 메타데이터 헬퍼 |
  | `plugin-sdk/target-resolver-runtime` | 대상 해석기 헬퍼 | 공유 대상 해석기 헬퍼 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 헬퍼 | slug/문자열 정규화 헬퍼 |
  | `plugin-sdk/request-url` | 요청 URL 헬퍼 | request 유사 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 헬퍼 | 정규화된 stdout/stderr를 사용하는 시간 제한 명령 실행기 |
  | `plugin-sdk/param-readers` | param 리더 | 공통 도구/CLI param 리더 |
  | `plugin-sdk/tool-payload` | 도구 payload 추출 | 도구 결과 객체에서 정규화된 payload 추출 |
  | `plugin-sdk/tool-send` | 도구 send 추출 | 도구 args에서 정식 send 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 헬퍼 | 공유 임시 다운로드 경로 헬퍼 |
  | `plugin-sdk/logging-core` | 로깅 헬퍼 | 하위 시스템 로거 및 리다이렉션 헬퍼 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 표 헬퍼 | Markdown 표 모드 헬퍼 |
  | `plugin-sdk/reply-payload` | 메시지 reply 타입 | reply payload 타입 |
  | `plugin-sdk/provider-setup` | 선별된 로컬/셀프 호스팅 provider setup 헬퍼 | 셀프 호스팅 provider 검색/config 헬퍼 |
  | `plugin-sdk/self-hosted-provider-setup` | 범위가 좁은 OpenAI 호환 셀프 호스팅 provider setup 헬퍼 | 동일한 셀프 호스팅 provider 검색/config 헬퍼 |
  | `plugin-sdk/provider-auth-runtime` | provider 런타임 auth 헬퍼 | 런타임 API 키 해석 헬퍼 |
  | `plugin-sdk/provider-auth-api-key` | provider API 키 setup 헬퍼 | API 키 온보딩/profile-write 헬퍼 |
  | `plugin-sdk/provider-auth-result` | provider auth-result 헬퍼 | 표준 OAuth auth-result 빌더 |
  | `plugin-sdk/provider-auth-login` | provider interactive login 헬퍼 | 공유 interactive login 헬퍼 |
  | `plugin-sdk/provider-selection-runtime` | provider 선택 헬퍼 | configured-or-auto provider 선택 및 원시 provider config 병합 |
  | `plugin-sdk/provider-env-vars` | provider env-var 헬퍼 | provider auth env-var 조회 헬퍼 |
  | `plugin-sdk/provider-model-shared` | 공유 provider model/replay 헬퍼 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 replay-policy 빌더, provider-endpoint 헬퍼, model-id 정규화 헬퍼 |
  | `plugin-sdk/provider-catalog-shared` | 공유 provider 카탈로그 헬퍼 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | provider 온보딩 패치 | 온보딩 config 헬퍼 |
  | `plugin-sdk/provider-http` | provider HTTP 헬퍼 | 오디오 전사 multipart form 헬퍼를 포함한 일반 provider HTTP/엔드포인트 capability 헬퍼 |
  | `plugin-sdk/provider-web-fetch` | provider 웹 가져오기 헬퍼 | 웹 가져오기 provider 등록/캐시 헬퍼 |
  | `plugin-sdk/provider-web-search-config-contract` | provider 웹 검색 config 헬퍼 | Plugin 활성화 wiring이 필요 없는 provider용 범위가 좁은 웹 검색 config/자격 증명 헬퍼 |
  | `plugin-sdk/provider-web-search-contract` | provider 웹 검색 계약 헬퍼 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 자격 증명 setter/getter 같은 범위가 좁은 웹 검색 config/자격 증명 계약 헬퍼 |
  | `plugin-sdk/provider-web-search` | provider 웹 검색 헬퍼 | 웹 검색 provider 등록/캐시/런타임 헬퍼 |
  | `plugin-sdk/provider-tools` | provider 도구/schema compat 헬퍼 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini schema 정리 + diagnostics, `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI compat 헬퍼 |
  | `plugin-sdk/provider-usage` | provider 사용량 헬퍼 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 및 기타 provider 사용량 헬퍼 |
  | `plugin-sdk/provider-stream` | provider stream 래퍼 헬퍼 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, stream wrapper 타입, 공유 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot wrapper 헬퍼 |
  | `plugin-sdk/provider-transport-runtime` | provider transport 헬퍼 | guarded fetch, transport 메시지 변환, writable transport event stream 같은 네이티브 provider transport 헬퍼 |
  | `plugin-sdk/keyed-async-queue` | 순서 보장 비동기 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공유 미디어 헬퍼 | 미디어 fetch/transform/store 헬퍼와 미디어 payload 빌더 |
  | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 헬퍼 | 이미지/비디오/음악 생성용 공유 failover 헬퍼, 후보 선택, 모델 누락 메시지 |
  | `plugin-sdk/media-understanding` | 미디어 이해 헬퍼 | 미디어 이해 provider 타입과 provider 지향 image/audio 헬퍼 export |
  | `plugin-sdk/text-runtime` | 공유 텍스트 헬퍼 | assistant 표시 텍스트 제거, markdown 렌더/chunking/표 헬퍼, 리다이렉션 헬퍼, directive-tag 헬퍼, safe-text 유틸리티 및 관련 텍스트/로깅 헬퍼 |
  | `plugin-sdk/text-chunking` | 텍스트 chunking 헬퍼 | 발신 텍스트 chunking 헬퍼 |
  | `plugin-sdk/speech` | 음성 헬퍼 | 음성 provider 타입과 provider 지향 directive, registry, 검증 헬퍼 |
  | `plugin-sdk/speech-core` | 공유 음성 코어 | 음성 provider 타입, registry, directive, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 헬퍼 | provider 타입, registry 헬퍼, 공유 WebSocket 세션 헬퍼 |
  | `plugin-sdk/realtime-voice` | 실시간 음성 헬퍼 | provider 타입, registry/해석 헬퍼, bridge 세션 헬퍼 |
  | `plugin-sdk/image-generation-core` | 공유 이미지 생성 코어 | 이미지 생성 타입, failover, auth, registry 헬퍼 |
  | `plugin-sdk/music-generation` | 음악 생성 헬퍼 | 음악 생성 provider/request/result 타입 |
  | `plugin-sdk/music-generation-core` | 공유 음악 생성 코어 | 음악 생성 타입, failover 헬퍼, provider 조회, model-ref 구문 분석 |
  | `plugin-sdk/video-generation` | 비디오 생성 헬퍼 | 비디오 생성 provider/request/result 타입 |
  | `plugin-sdk/video-generation-core` | 공유 비디오 생성 코어 | 비디오 생성 타입, failover 헬퍼, provider 조회, model-ref 구문 분석 |
  | `plugin-sdk/interactive-runtime` | 인터랙티브 reply 헬퍼 | 인터랙티브 reply payload 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | 채널 config 기본 요소 | 범위가 좁은 채널 config-schema 기본 요소 |
  | `plugin-sdk/channel-config-writes` | 채널 config-write 헬퍼 | 채널 config-write 권한 부여 헬퍼 |
  | `plugin-sdk/channel-plugin-common` | 공유 채널 prelude | 공유 채널 Plugin prelude export |
  | `plugin-sdk/channel-status` | 채널 상태 헬퍼 | 공유 채널 상태 스냅샷/요약 헬퍼 |
  | `plugin-sdk/allowlist-config-edit` | 허용 목록 config 헬퍼 | 허용 목록 config 편집/읽기 헬퍼 |
  | `plugin-sdk/group-access` | 그룹 액세스 헬퍼 | 공유 그룹 액세스 결정 헬퍼 |
  | `plugin-sdk/direct-dm` | 직접 DM 헬퍼 | 공유 직접 DM auth/guard 헬퍼 |
  | `plugin-sdk/extension-shared` | 공유 extension 헬퍼 | passive-channel/status 및 ambient proxy 헬퍼 기본 요소 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 헬퍼 | Webhook 대상 레지스트리 및 route-install 헬퍼 |
  | `plugin-sdk/webhook-path` | Webhook 경로 헬퍼 | Webhook 경로 정규화 헬퍼 |
  | `plugin-sdk/web-media` | 공유 웹 미디어 헬퍼 | 원격/로컬 미디어 로드 헬퍼 |
  | `plugin-sdk/zod` | Zod 재내보내기 | Plugin SDK 사용자를 위한 `zod` 재내보내기 |
  | `plugin-sdk/memory-core` | 번들 memory-core 헬퍼 | 메모리 관리자/config/file/CLI 헬퍼 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 런타임 파사드 | 메모리 인덱스/검색 런타임 파사드 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 foundation 엔진 | 메모리 호스트 foundation 엔진 export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, 레지스트리 접근, 로컬 provider, 일반 batch/원격 헬퍼. 구체적인 원격 provider는 해당 소유 Plugin에 위치 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 export |
  | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 | 메모리 호스트 저장소 엔진 export |
  | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 | 메모리 호스트 멀티모달 헬퍼 |
  | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 | 메모리 호스트 쿼리 헬퍼 |
  | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 secret 헬퍼 | 메모리 호스트 secret 헬퍼 |
  | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 헬퍼 | 메모리 호스트 이벤트 저널 헬퍼 |
  | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 | 메모리 호스트 상태 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 | 메모리 호스트 CLI 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 | 메모리 호스트 코어 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 | 메모리 호스트 파일/런타임 헬퍼 |
  | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 별칭 | 메모리 호스트 코어 런타임 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 메모리 호스트 이벤트 저널 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 별칭 | 메모리 호스트 파일/런타임 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-host-markdown` | 관리형 markdown 헬퍼 | 메모리 인접 Plugin용 공유 managed-markdown 헬퍼 |
  | `plugin-sdk/memory-host-search` | Active Memory 검색 파사드 | 지연 active-memory search-manager 런타임 파사드 |
  | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 별칭 | 메모리 호스트 상태 헬퍼를 위한 vendor-neutral 별칭 |
  | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb 헬퍼 | Memory-lancedb 헬퍼 표면 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 테스트 헬퍼 및 mock |
</Accordion>

이 표는 전체 SDK 표면이 아니라, 의도적으로 일반적인 마이그레이션 하위 집합만 담고 있습니다. 전체 200개 이상의 entrypoint 목록은
`scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

그 목록에는 여전히
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은 일부 번들 Plugin 헬퍼 seam도 포함되어 있습니다. 이들은 번들 Plugin 유지보수와 호환성을 위해 계속 export되지만,
의도적으로 일반 마이그레이션 표에서는 제외되며,
새 Plugin 코드에 권장되는 대상도 아닙니다.

동일한 규칙은 다음과 같은 다른 번들 헬퍼 계열에도 적용됩니다:

- 브라우저 지원 헬퍼: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix: `plugin-sdk/matrix*`
- LINE: `plugin-sdk/line*`
- IRC: `plugin-sdk/irc*`
- `plugin-sdk/googlechat`,
  `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`,
  `plugin-sdk/mattermost*`, `plugin-sdk/msteams`,
  `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`,
  `plugin-sdk/twitch`,
  `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`,
  `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`,
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` 같은 번들 헬퍼/Plugin 표면

`plugin-sdk/github-copilot-token`은 현재
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`이라는 범위가 좁은 token-helper
표면을 노출합니다.

작업에 맞는 가장 범위가 좁은 import를 사용하세요. export를 찾을 수 없다면
`src/plugin-sdk/`의 소스를 확인하거나 Discord에서 문의하세요.

## 제거 일정

| When | What happens |
| ---------------------- | ----------------------------------------------------------------------- |
| **지금** | deprecated 표면이 런타임 경고를 출력함 |
| **다음 주요 릴리스** | deprecated 표면이 제거되며, 여전히 이를 사용하는 Plugins는 실패함 |

모든 코어 Plugins는 이미 마이그레이션되었습니다. 외부 Plugins는
다음 주요 릴리스 전에 마이그레이션해야 합니다.

## 경고를 일시적으로 숨기기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이는 임시 비상 탈출구일 뿐이며, 영구적인 해결책은 아닙니다.

## 관련

- [Getting Started](/ko/plugins/building-plugins) — 첫 번째 plugin 빌드하기
- [SDK Overview](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 채널 Plugins 빌드하기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — provider Plugins 빌드하기
- [Plugin Internals](/ko/plugins/architecture) — 아키텍처 심층 분석
- [Plugin Manifest](/ko/plugins/manifest) — manifest schema 참조
