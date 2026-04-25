---
read_when:
    - '`OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED` 경고가 표시됩니다'
    - '`OPENCLAW_EXTENSION_API_DEPRECATED` 경고가 표시됩니다'
    - OpenClaw 2026.4.25 이전에 `api.registerEmbeddedExtensionFactory`를 사용했습니다
    - Plugin을 최신 Plugin 아키텍처로 업데이트하고 있습니다
    - 외부 OpenClaw Plugin을 유지 관리하고 있습니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 Plugin SDK로 마이그레이션하기
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-04-25T18:20:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: c7ab0369fc6e43961a41cff882b0c05653a6a1e3f919ef8a3620c868c16c02ce
    source_path: plugins/sdk-migration.md
    workflow: 15
---

OpenClaw는 광범위한 하위 호환성 계층에서 집중적이고 문서화된 import를 사용하는 최신 Plugin
아키텍처로 이동했습니다. Plugin이 새 아키텍처 이전에 만들어졌다면,
이 가이드는 마이그레이션에 도움이 됩니다.

## 무엇이 변경되고 있나요

기존 Plugin 시스템은 Plugin이 단일 진입점에서 필요한 거의 모든 것을 import할 수 있게 해 주는
두 개의 매우 넓은 표면을 제공했습니다:

- **`openclaw/plugin-sdk/compat`** — 수십 개의
  helper를 다시 export하는 단일 import입니다. 새 Plugin 아키텍처가 구축되는 동안
  오래된 hook 기반 Plugin이 계속 작동하도록 하기 위해 도입되었습니다.
- **`openclaw/extension-api`** — 임베디드 에이전트 실행기 같은
  호스트 측 helper에 Plugin이 직접 접근할 수 있게 해 주는 브리지입니다.
- **`api.registerEmbeddedExtensionFactory(...)`** — `tool_result` 같은
  임베디드 실행기 이벤트를 관찰할 수 있었던 제거된 Pi 전용 번들
  extension hook입니다.

이러한 광범위한 import 표면은 이제 **deprecated** 상태입니다. 런타임에서는 여전히 작동하지만,
새 Plugin은 이를 사용하면 안 되며, 기존 Plugin도 다음 major release에서 제거되기 전에
마이그레이션해야 합니다. Pi 전용 임베디드 extension factory
등록 API는 제거되었으며, 대신 tool-result middleware를 사용해야 합니다.

OpenClaw는 대체 수단을 도입하는 동일한 변경에서 문서화된 Plugin 동작을 제거하거나 재해석하지 않습니다.
호환성이 깨지는 계약 변경은 먼저 호환성 adapter, diagnostics, docs,
그리고 deprecation 기간을 거쳐야 합니다.
이는 SDK import, manifest 필드, setup API, hook, 런타임
등록 동작에 모두 적용됩니다.

<Warning>
  하위 호환성 계층은 향후 major release에서 제거될 예정입니다.
  여전히 이 표면에서 import하는 Plugin은 그 시점에 깨지게 됩니다.
  Pi 전용 임베디드 extension factory 등록은 이미 더 이상 로드되지 않습니다.
</Warning>

## 왜 변경되었나요

기존 접근 방식은 다음과 같은 문제를 일으켰습니다:

- **느린 시작 속도** — 하나의 helper를 import하면 관련 없는 수십 개의 모듈이 로드되었습니다
- **순환 의존성** — 광범위한 재export 때문에 import cycle이 쉽게 생겼습니다
- **불명확한 API 표면** — 어떤 export가 안정적인지, 어떤 것이 내부용인지 구분할 수 없었습니다

최신 Plugin SDK는 이를 해결합니다: 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는
명확한 목적과 문서화된 계약을 가진 작고 독립적인 모듈입니다.

번들 채널용 레거시 제공업체 편의 seam도 제거되었습니다. `openclaw/plugin-sdk/slack`, `openclaw/plugin-sdk/discord`,
`openclaw/plugin-sdk/signal`, `openclaw/plugin-sdk/whatsapp`,
채널 브랜드 helper seam, 그리고
`openclaw/plugin-sdk/telegram-core` 같은 import는 안정적인 Plugin 계약이 아니라
비공개 mono-repo 바로가기였습니다. 대신 범위가 좁은 일반 SDK subpath를 사용하세요. 번들 Plugin 워크스페이스 내부에서는
제공업체 소유 helper를 해당 Plugin 자체의
`api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 제공업체 예시:

- Anthropic은 Claude 전용 stream helper를 자체 `api.ts` /
  `contract-api.ts` seam에 유지합니다
- OpenAI는 provider builder, 기본 모델 helper, realtime provider
  builder를 자체 `api.ts`에 유지합니다
- OpenRouter는 provider builder와 onboarding/config helper를 자체
  `api.ts`에 유지합니다

## 호환성 정책

외부 Plugin의 경우, 호환성 작업은 다음 순서를 따릅니다:

1. 새 계약 추가
2. 호환성 adapter를 통해 기존 동작을 계속 연결
3. 이전 경로와 대체 경로를 명시하는 diagnostic 또는 warning 출력
4. 테스트에서 두 경로 모두 다루기
5. deprecation 및 마이그레이션 경로 문서화
6. 공지된 마이그레이션 기간 이후, 보통 major release에서만 제거

manifest 필드가 여전히 허용된다면, Plugin 작성자는 docs와 diagnostics가 달리 말하기 전까지
계속 사용할 수 있습니다. 새 코드는 문서화된 대체 수단을 우선해야 하지만,
기존 Plugin은 일반적인 minor release 중에 깨지면 안 됩니다.

## 마이그레이션 방법

<Steps>
  <Step title="Pi tool-result extension을 middleware로 마이그레이션">
    번들 Plugin은 Pi 전용
    `api.registerEmbeddedExtensionFactory(...)` tool-result handler를
    런타임 중립 middleware로 교체해야 합니다.

    ```typescript
    // Pi 및 Codex 런타임 동적 도구
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    동시에 Plugin manifest도 업데이트하세요:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    외부 Plugin은 tool-result middleware를 등록할 수 없습니다.
    모델이 보기 전에 고신뢰 도구 출력을 다시 쓸 수 있기 때문입니다.

  </Step>

  <Step title="approval-native handler를 capability fact로 마이그레이션">
    승인 기능이 있는 채널 Plugin은 이제
    `approvalCapability.nativeRuntime`과 공유 런타임 컨텍스트 registry를 통해
    네이티브 승인 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`를
      `approvalCapability.nativeRuntime`으로 교체
    - 승인 전용 auth/delivery를 레거시 `plugin.auth` /
      `plugin.approvals` 연결에서 분리해 `approvalCapability`로 이동
    - `ChannelPlugin.approvals`는 공개 channel-plugin
      계약에서 제거되었으므로, delivery/native/render 필드를 `approvalCapability`로 이동
    - `plugin.auth`는 채널 login/logout 흐름에만 남아 있으며, 그곳의 승인 auth
      hook는 더 이상 core에서 읽지 않음
    - client, token, Bolt
      app 같은 채널 소유 런타임 객체는 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록
    - 네이티브 승인 handler에서 Plugin 소유 reroute notice를 보내지 마세요.
      core가 이제 실제 전달 결과에서 routed-elsewhere notice를 담당합니다
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때는
      실제 `createPluginRuntime().channel` 표면을 제공해야 합니다. 부분 stub는 거부됩니다.

    현재 approval capability
    레이아웃은 `/plugins/sdk-channel-plugins`를 참고하세요.

  </Step>

  <Step title="Windows wrapper fallback 동작 점검">
    Plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우,
    해결되지 않은 Windows `.cmd`/`.bat` wrapper는 이제
    `allowShellFallback: true`를 명시적으로 전달하지 않으면 fail-closed됩니다.

    ```typescript
    // 이전
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 이후
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // shell 매개 fallback을 의도적으로 허용하는 신뢰된 호환성 호출자에만
      // 이 값을 설정하세요.
      allowShellFallback: true,
    });
    ```

    호출자가 shell fallback에 의도적으로 의존하지 않는다면,
    `allowShellFallback`을 설정하지 말고 대신 발생한 오류를 처리하세요.

  </Step>

  <Step title="deprecated import 찾기">
    Plugin에서 deprecated된 두 표면 중 하나로부터의 import를 검색하세요:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="집중된 import로 교체">
    기존 표면의 각 export는 특정한 최신 import 경로에 대응됩니다:

    ```typescript
    // 이전 (deprecated 하위 호환성 계층)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 이후 (최신 집중형 import)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    호스트 측 helper의 경우, 직접 import하는 대신
    주입된 Plugin 런타임을 사용하세요:

    ```typescript
    // 이전 (deprecated extension-api 브리지)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // 이후 (주입된 런타임)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    같은 패턴이 다른 레거시 브리지 helper에도 적용됩니다:

    | 이전 import | 최신 대응 항목 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store helper | `api.runtime.agent.session.*` |

  </Step>

  <Step title="빌드 및 테스트">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## import 경로 참조

  <Accordion title="일반적인 import 경로 표">
  | Import path | 용도 | 주요 export |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 정식 Plugin 진입 helper | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 진입 정의/builders를 위한 레거시 umbrella 재export | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 config 스키마 export | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 제공업체 진입 helper | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 범위가 좁은 채널 진입 정의 및 builder | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공통 setup wizard helper | 허용 목록 프롬프트, setup status builder |
  | `plugin-sdk/setup-runtime` | setup 시점 런타임 helper | import-safe setup patch adapter, lookup-note helper, `promptResolvedAllowFrom`, `splitSetupEntries`, delegated setup proxy |
  | `plugin-sdk/setup-adapter-runtime` | setup adapter helper | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | setup tooling helper | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 helper | 계정 목록/config/action-gate helper |
  | `plugin-sdk/account-id` | account-id helper | `DEFAULT_ACCOUNT_ID`, account-id 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 helper | 계정 조회 + 기본값 폴백 helper |
  | `plugin-sdk/account-helpers` | 범위가 좁은 계정 helper | 계정 목록/account-action helper |
  | `plugin-sdk/channel-setup` | setup wizard adapter | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 페어링 기본 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 답장 접두사 + typing 연결 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | config adapter factory | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | config 스키마 builder | 공통 채널 config 스키마 기본 요소; 번들 채널 이름 기반 스키마 export는 레거시 호환성 전용 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 config helper | 명령 이름 정규화, 설명 잘라내기, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 계정 상태 및 초안 스트림 수명 주기 helper | `createAccountStatusSink`, 초안 미리보기 마무리 helper |
  | `plugin-sdk/inbound-envelope` | 인바운드 envelope helper | 공통 route + envelope builder helper |
  | `plugin-sdk/inbound-reply-dispatch` | 인바운드 답장 helper | 공통 record-and-dispatch helper |
  | `plugin-sdk/messaging-targets` | 메시징 대상 파싱 | 대상 파싱/매칭 helper |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 helper | 공통 아웃바운드 미디어 로딩 |
  | `plugin-sdk/outbound-runtime` | 아웃바운드 런타임 helper | 아웃바운드 전달, identity/send delegate, 세션, 포맷팅, 페이로드 계획 helper |
  | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 helper | 스레드 바인딩 수명 주기 및 adapter helper |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 페이로드 helper | 레거시 필드 레이아웃용 에이전트 미디어 페이로드 builder |
  | `plugin-sdk/channel-runtime` | deprecated 호환성 shim | 레거시 채널 런타임 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 답장 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 Plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 런타임 helper | 런타임/logging/backup/plugin-install helper |
  | `plugin-sdk/runtime-env` | 범위가 좁은 런타임 env helper | logger/runtime env, timeout, retry, backoff helper |
  | `plugin-sdk/plugin-runtime` | 공통 Plugin 런타임 helper | Plugin 명령/hook/http/interactive helper |
  | `plugin-sdk/hook-runtime` | hook 파이프라인 helper | 공통 Webhook/내부 hook 파이프라인 helper |
  | `plugin-sdk/lazy-runtime` | 지연 런타임 helper | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 helper | 공통 exec helper |
  | `plugin-sdk/cli-runtime` | CLI 런타임 helper | 명령 포맷팅, 대기, 버전 helper |
  | `plugin-sdk/gateway-runtime` | Gateway helper | Gateway 클라이언트 및 channel-status patch helper |
  | `plugin-sdk/config-runtime` | config helper | config 로드/쓰기 helper |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 helper | 번들 Telegram 계약 표면을 사용할 수 없을 때 사용하는 폴백 안정형 Telegram 명령 검증 helper |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 helper | exec/plugin 승인 페이로드, approval capability/profile helper, 네이티브 승인 라우팅/런타임 helper, 구조화된 승인 표시 경로 포맷팅 |
  | `plugin-sdk/approval-auth-runtime` | 승인 auth helper | approver 해석, 동일 채팅 action auth |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 helper | 네이티브 exec 승인 profile/filter helper |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 helper | 네이티브 approval capability/delivery adapter |
  | `plugin-sdk/approval-gateway-runtime` | 승인 Gateway helper | 공통 승인 Gateway 해석 helper |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 adapter helper | 핫 채널 진입점용 경량 네이티브 승인 adapter 로딩 helper |
  | `plugin-sdk/approval-handler-runtime` | 승인 handler helper | 더 광범위한 승인 handler 런타임 helper; 더 좁은 adapter/Gateway seam으로 충분하다면 그것을 우선 사용 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 helper | 네이티브 승인 대상/account binding helper |
  | `plugin-sdk/approval-reply-runtime` | 승인 답장 helper | exec/plugin 승인 답장 페이로드 helper |
  | `plugin-sdk/channel-runtime-context` | 채널 런타임 컨텍스트 helper | 일반 채널 런타임 컨텍스트 register/get/watch helper |
  | `plugin-sdk/security-runtime` | 보안 helper | 공통 trust, DM gating, external-content, secret-collection helper |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 helper | 호스트 허용 목록 및 private-network 정책 helper |
  | `plugin-sdk/ssrf-runtime` | SSRF 런타임 helper | pinned-dispatcher, guarded fetch, SSRF 정책 helper |
  | `plugin-sdk/collection-runtime` | 범위 제한 캐시 helper | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | diagnostic 게이팅 helper | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 포맷팅 helper | `formatUncaughtError`, `isApprovalNotFoundError`, 오류 그래프 helper |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/프록시 helper | `resolveFetch`, 프록시 helper |
  | `plugin-sdk/host-runtime` | 호스트 정규화 helper | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 재시도 helper | `RetryConfig`, `retryAsync`, 정책 실행기 |
  | `plugin-sdk/allow-from` | 허용 목록 포맷팅 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 허용 목록 입력 매핑 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅 및 명령 표면 helper | `resolveControlCommandGate`, 발신자 권한 부여 helper, 동적 인수 메뉴 포맷팅을 포함한 명령 registry helper |
  | `plugin-sdk/command-status` | 명령 상태/help 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | secret 입력 파싱 | secret 입력 helper |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 helper | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 guard helper | 요청 본문 읽기/제한 helper |
  | `plugin-sdk/reply-runtime` | 공통 답장 런타임 | 인바운드 dispatch, Heartbeat, 답장 planner, chunking |
  | `plugin-sdk/reply-dispatch-runtime` | 범위가 좁은 답장 dispatch helper | finalize, provider dispatch, conversation-label helper |
  | `plugin-sdk/reply-history` | 답장 기록 helper | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 답장 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 답장 chunk helper | 텍스트/markdown chunking helper |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 helper | 저장소 경로 + updated-at helper |
  | `plugin-sdk/state-paths` | 상태 경로 helper | 상태 및 OAuth 디렉터리 helper |
  | `plugin-sdk/routing` | 라우팅/세션 키 helper | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 helper |
  | `plugin-sdk/status-helpers` | 채널 상태 helper | 채널/계정 상태 요약 builder, 런타임 상태 기본값, 이슈 메타데이터 helper |
  | `plugin-sdk/target-resolver-runtime` | 대상 해석 helper | 공통 대상 해석 helper |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 helper | slug/문자열 정규화 helper |
  | `plugin-sdk/request-url` | 요청 URL helper | request 유사 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 helper | 정규화된 stdout/stderr를 포함한 시간 제한 명령 실행기 |
  | `plugin-sdk/param-readers` | 매개변수 reader | 공통 도구/CLI 매개변수 reader |
  | `plugin-sdk/tool-payload` | 도구 페이로드 추출 | 도구 결과 객체에서 정규화된 페이로드 추출 |
  | `plugin-sdk/tool-send` | 도구 전송 추출 | 도구 인수에서 정식 전송 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 helper | 공통 임시 다운로드 경로 helper |
  | `plugin-sdk/logging-core` | logging helper | 서브시스템 logger 및 redaction helper |
  | `plugin-sdk/markdown-table-runtime` | Markdown 표 helper | Markdown 표 모드 helper |
  | `plugin-sdk/reply-payload` | 메시지 답장 타입 | 답장 페이로드 타입 |
  | `plugin-sdk/provider-setup` | 큐레이션된 로컬/셀프 호스팅 제공업체 setup helper | 셀프 호스팅 제공업체 검색/config helper |
  | `plugin-sdk/self-hosted-provider-setup` | 범위가 좁은 OpenAI 호환 셀프 호스팅 제공업체 setup helper | 동일한 셀프 호스팅 제공업체 검색/config helper |
  | `plugin-sdk/provider-auth-runtime` | 제공업체 런타임 auth helper | 런타임 API 키 해석 helper |
  | `plugin-sdk/provider-auth-api-key` | 제공업체 API 키 setup helper | API 키 온보딩/profile-write helper |
  | `plugin-sdk/provider-auth-result` | 제공업체 auth-result helper | 표준 OAuth auth-result builder |
  | `plugin-sdk/provider-auth-login` | 제공업체 interactive login helper | 공통 interactive login helper |
  | `plugin-sdk/provider-selection-runtime` | 제공업체 선택 helper | configured-or-auto 제공업체 선택 및 원시 제공업체 config 병합 |
  | `plugin-sdk/provider-env-vars` | 제공업체 env-var helper | 제공업체 auth env-var 조회 helper |
  | `plugin-sdk/provider-model-shared` | 공통 제공업체 모델/replay helper | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공통 replay-policy builder, 제공업체 엔드포인트 helper, 모델 id 정규화 helper |
  | `plugin-sdk/provider-catalog-shared` | 공통 제공업체 카탈로그 helper | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 제공업체 온보딩 patch | 온보딩 config helper |
  | `plugin-sdk/provider-http` | 제공업체 HTTP helper | 오디오 전사 multipart form helper를 포함한 일반 제공업체 HTTP/엔드포인트 capability helper |
  | `plugin-sdk/provider-web-fetch` | 제공업체 web-fetch helper | web-fetch 제공업체 등록/캐시 helper |
  | `plugin-sdk/provider-web-search-config-contract` | 제공업체 웹 검색 config helper | Plugin 활성화 연결이 필요 없는 제공업체를 위한 범위가 좁은 웹 검색 config/credential helper |
  | `plugin-sdk/provider-web-search-contract` | 제공업체 웹 검색 계약 helper | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig`, 범위 지정 credential setter/getter 같은 범위가 좁은 웹 검색 config/credential 계약 helper |
  | `plugin-sdk/provider-web-search` | 제공업체 웹 검색 helper | 웹 검색 제공업체 등록/캐시/런타임 helper |
  | `plugin-sdk/provider-tools` | 제공업체 도구/스키마 호환 helper | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + diagnostics, `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환 helper |
  | `plugin-sdk/provider-usage` | 제공업체 사용량 helper | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage`, 기타 제공업체 사용량 helper |
  | `plugin-sdk/provider-stream` | 제공업체 스트림 래퍼 helper | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입, 공통 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 helper |
  | `plugin-sdk/provider-transport-runtime` | 제공업체 전송 helper | guarded fetch, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림 같은 네이티브 제공업체 전송 helper |
  | `plugin-sdk/keyed-async-queue` | 순서 보장 비동기 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공통 미디어 helper | 미디어 fetch/transform/store helper 및 미디어 페이로드 builder |
  | `plugin-sdk/media-generation-runtime` | 공통 미디어 생성 helper | 이미지/비디오/음악 생성을 위한 공통 failover helper, 후보 선택, 누락된 모델 메시지 |
  | `plugin-sdk/media-understanding` | 미디어 이해 helper | 미디어 이해 제공업체 타입 및 제공업체 대상 이미지/오디오 helper export |
  | `plugin-sdk/text-runtime` | 공통 텍스트 helper | 어시스턴트 표시용 텍스트 제거, markdown 렌더/chunking/표 helper, redaction helper, directive-tag helper, 안전한 텍스트 유틸리티, 관련 텍스트/logging helper |
  | `plugin-sdk/text-chunking` | 텍스트 chunking helper | 아웃바운드 텍스트 chunking helper |
  | `plugin-sdk/speech` | 음성 helper | 음성 제공업체 타입 및 제공업체 대상 directive, registry, 검증 helper |
  | `plugin-sdk/speech-core` | 공통 음성 코어 | 음성 제공업체 타입, registry, directive, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 helper | 제공업체 타입, registry helper, 공통 WebSocket 세션 helper |
  | `plugin-sdk/realtime-voice` | 실시간 음성 helper | 제공업체 타입, registry/해석 helper, 브리지 세션 helper |
  | `plugin-sdk/image-generation-core` | 공통 이미지 생성 코어 | 이미지 생성 타입, failover, auth, registry helper |
  | `plugin-sdk/music-generation` | 음악 생성 helper | 음악 생성 제공업체/요청/결과 타입 |
  | `plugin-sdk/music-generation-core` | 공통 음악 생성 코어 | 음악 생성 타입, failover helper, 제공업체 조회, 모델 ref 파싱 |
  | `plugin-sdk/video-generation` | 비디오 생성 helper | 비디오 생성 제공업체/요청/결과 타입 |
  | `plugin-sdk/video-generation-core` | 공통 비디오 생성 코어 | 비디오 생성 타입, failover helper, 제공업체 조회, 모델 ref 파싱 |
  | `plugin-sdk/interactive-runtime` | 대화형 답장 helper | 대화형 답장 페이로드 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | 채널 config 기본 요소 | 범위가 좁은 채널 config-schema 기본 요소 |
  | `plugin-sdk/channel-config-writes` | 채널 config 쓰기 helper | 채널 config 쓰기 권한 부여 helper |
  | `plugin-sdk/channel-plugin-common` | 공통 채널 prelude | 공통 채널 Plugin prelude export |
  | `plugin-sdk/channel-status` | 채널 상태 helper | 공통 채널 상태 스냅샷/요약 helper |
  | `plugin-sdk/allowlist-config-edit` | 허용 목록 config helper | 허용 목록 config 편집/읽기 helper |
  | `plugin-sdk/group-access` | 그룹 액세스 helper | 공통 그룹 액세스 결정 helper |
  | `plugin-sdk/direct-dm` | Direct-DM helper | 공통 direct-DM auth/guard helper |
  | `plugin-sdk/extension-shared` | 공통 extension helper | passive-channel/status 및 ambient proxy helper 기본 요소 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 helper | Webhook 대상 registry 및 route-install helper |
  | `plugin-sdk/webhook-path` | Webhook 경로 helper | Webhook 경로 정규화 helper |
  | `plugin-sdk/web-media` | 공통 웹 미디어 helper | 원격/로컬 미디어 로딩 helper |
  | `plugin-sdk/zod` | Zod 재export | Plugin SDK 사용자를 위한 `zod` 재export |
  | `plugin-sdk/memory-core` | 번들 memory-core helper | 메모리 관리자/config/file/CLI helper 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 런타임 파사드 | 메모리 인덱스/검색 런타임 파사드 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 기반 엔진 | 메모리 호스트 기반 엔진 export |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, registry 접근, 로컬 제공업체, 일반 batch/원격 helper; 구체적인 원격 제공업체는 해당 Plugin에 존재 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 export |
  | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 저장소 엔진 | 메모리 호스트 저장소 엔진 export |
  | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 helper | 메모리 호스트 멀티모달 helper |
  | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 helper | 메모리 호스트 쿼리 helper |
  | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 secret helper | 메모리 호스트 secret helper |
  | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 helper | 메모리 호스트 이벤트 저널 helper |
  | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 helper | 메모리 호스트 상태 helper |
  | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 | 메모리 호스트 CLI 런타임 helper |
  | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 | 메모리 호스트 코어 런타임 helper |
  | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 helper | 메모리 호스트 파일/런타임 helper |
  | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 별칭 | 메모리 호스트 코어 런타임 helper를 위한 벤더 중립 별칭 |
  | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 메모리 호스트 이벤트 저널 helper를 위한 벤더 중립 별칭 |
  | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 별칭 | 메모리 호스트 파일/런타임 helper를 위한 벤더 중립 별칭 |
  | `plugin-sdk/memory-host-markdown` | 관리형 markdown helper | 메모리 인접 Plugin을 위한 공통 관리형 markdown helper |
  | `plugin-sdk/memory-host-search` | Active Memory 검색 파사드 | 지연 Active Memory search-manager 런타임 파사드 |
  | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 별칭 | 메모리 호스트 상태 helper를 위한 벤더 중립 별칭 |
  | `plugin-sdk/memory-lancedb` | 번들 memory-lancedb helper | memory-lancedb helper 표면 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 테스트 helper 및 mock |
</Accordion>

이 표는 전체 SDK 표면이 아니라 의도적으로 일반적인 마이그레이션 하위 집합만 다룹니다. 전체 200개 이상의 진입점 목록은
`scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

그 목록에는 여전히
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup`, `plugin-sdk/matrix*` 같은 일부 번들 Plugin helper seam이 포함되어 있습니다.
이들은 번들 Plugin 유지 관리와 호환성을 위해 계속 export되지만,
의도적으로 일반 마이그레이션 표에서는 제외되며 새 Plugin 코드에 권장되는 대상은 아닙니다.

같은 규칙이 다른 번들 helper 계열에도 적용됩니다:

- 브라우저 지원 helper: `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
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
  `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` 같은
  번들 helper/Plugin 표면

`plugin-sdk/github-copilot-token`은 현재 범위가 좁은 토큰 helper 표면인
`DEFAULT_COPILOT_API_BASE_URL`,
`deriveCopilotApiBaseUrlFromToken`, `resolveCopilotApiToken`을 노출합니다.

작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면
`src/plugin-sdk/`의 소스를 확인하거나 Discord에서 문의하세요.

## 현재 deprecated 상태인 항목

Plugin SDK, 제공업체 계약,
런타임 표면, manifest 전반에 적용되는 더 좁은 deprecated 항목들입니다. 각각은 현재는 여전히 작동하지만
향후 major release에서 제거될 예정입니다. 각 항목 아래의 내용은 기존 API를
정식 대체 수단에 매핑합니다.

<AccordionGroup>
  <Accordion title="command-auth help builder → command-status">
    **기존 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **새 항목 (`openclaw/plugin-sdk/command-status`)**: 동일한 시그니처, 동일한
    export — 단지 더 좁은 subpath에서 import합니다. `command-auth`는
    이를 호환성 stub으로 재export합니다.

    ```typescript
    // 이전
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 이후
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="mention 게이팅 helper → resolveInboundMentionDecision">
    **기존**: `resolveInboundMentionRequirement({ facts, policy })` 및
    `shouldDropInboundForMention(...)`
    (`openclaw/plugin-sdk/channel-inbound` 또는
    `openclaw/plugin-sdk/channel-mention-gating`에서 제공).

    **새 항목**: `resolveInboundMentionDecision({ facts, policy })` — 두 번 나뉜 호출 대신
    단일 decision 객체를 반환합니다.

    하위 채널 Plugin(Slack, Discord, Matrix, Microsoft Teams)은 이미
    전환을 완료했습니다.

  </Accordion>

  <Accordion title="채널 런타임 shim 및 channel actions helper">
    `openclaw/plugin-sdk/channel-runtime`은 이전
    채널 Plugin을 위한 호환성 shim입니다. 새 코드에서는 import하지 말고,
    런타임 객체 등록에는
    `openclaw/plugin-sdk/channel-runtime-context`를 사용하세요.

    `openclaw/plugin-sdk/channel-actions`의 `channelActions*` helper는
    raw "actions" 채널 export와 함께 deprecated 상태입니다. 대신 의미 기반의
    `presentation` 표면을 통해 capability를 노출하세요 — 채널 Plugin은
    어떤 raw action 이름을 허용하는지가 아니라
    무엇을 렌더링하는지(cards, buttons, selects)를 선언합니다.

  </Accordion>

  <Accordion title="웹 검색 제공업체 tool() helper → Plugin의 createTool()">
    **기존**: `openclaw/plugin-sdk/provider-web-search`의 `tool()` factory.

    **새 항목**: 제공업체 Plugin에서 `createTool(...)`을 직접 구현하세요.
    OpenClaw는 더 이상 도구 래퍼 등록에 SDK helper가 필요하지 않습니다.

  </Accordion>

  <Accordion title="일반 텍스트 채널 envelope → BodyForAgent">
    **기존**: `formatInboundEnvelope(...)` (및
    `ChannelMessageForAgent.channelEnvelope`)를 사용해
    인바운드 채널 메시지로부터 평면 일반 텍스트 프롬프트
    envelope를 빌드했습니다.

    **새 항목**: `BodyForAgent`와 구조화된 사용자 컨텍스트 블록입니다.
    채널 Plugin은 라우팅 메타데이터(thread, topic, reply-to, reactions)를
    프롬프트 문자열에 이어붙이는 대신 타입이 지정된 필드로 첨부합니다.
    `formatAgentEnvelope(...)` helper는 여전히 합성된
    어시스턴트 표시용 envelope에 지원되지만, 인바운드 일반 텍스트 envelope는
    점차 사라지고 있습니다.

    영향 받는 영역: `inbound_claim`, `message_received`, 그리고
    `channelEnvelope` 텍스트를 후처리하던 모든 사용자 지정
    채널 Plugin.

  </Accordion>

  <Accordion title="제공업체 검색 타입 → 제공업체 카탈로그 타입">
    이제 네 개의 검색 타입 별칭은
    카탈로그 시대 타입을 감싼 얇은 래퍼입니다:

    | 기존 별칭                 | 새 타입                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    그리고 레거시 `ProviderCapabilities` 정적 bag도 있습니다 — 제공업체 Plugin은
    정적 객체가 아니라 제공업체 런타임 계약을 통해 capability fact를
    첨부해야 합니다.

  </Accordion>

  <Accordion title="thinking 정책 hook → resolveThinkingProfile">
    **기존** (`ProviderThinkingPolicy`의 세 개 분리된 hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, 그리고
    `resolveDefaultThinkingLevel(ctx)`.

    **새 항목**: 정식 `id`, 선택적 `label`, 정렬된
    level 목록을 가진 `ProviderThinkingProfile`을 반환하는 단일
    `resolveThinkingProfile(ctx)`입니다. OpenClaw는 오래된 저장 값을
    profile 순위에 따라 자동으로 다운그레이드합니다.

    세 개 대신 하나의 hook를 구현하세요. 레거시 hook도 deprecation 기간 동안
    계속 작동하지만 profile 결과와 함께 조합되지는 않습니다.

  </Accordion>

  <Accordion title="외부 OAuth 제공업체 폴백 → contracts.externalAuthProviders">
    **기존**: Plugin manifest에 제공업체를 선언하지 않고
    `resolveExternalOAuthProfiles(...)`를 구현하는 방식.

    **새 항목**: Plugin manifest에 `contracts.externalAuthProviders`를 선언하고
    **동시에** `resolveExternalAuthProfiles(...)`를 구현하세요. 기존 "auth
    fallback" 경로는 런타임에 warning을 출력하며 이후 제거될 예정입니다.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="제공업체 env-var 조회 → setup.providers[].envVars">
    **기존** manifest 필드: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **새 항목**: 동일한 env-var 조회를 manifest의 `setup.providers[].envVars`에
    반영하세요. 이렇게 하면 setup/status env 메타데이터가 한곳에
    통합되고 env-var 조회에 답하기 위해 Plugin 런타임을 부팅하지 않아도 됩니다.

    `providerAuthEnvVars`는 deprecation 기간이 끝날 때까지
    호환성 adapter를 통해 계속 지원됩니다.

  </Accordion>

  <Accordion title="메모리 Plugin 등록 → registerMemoryCapability">
    **기존**: 세 개의 분리된 호출 —
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **새 항목**: memory-state API에서의 단일 호출 —
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    같은 슬롯, 단일 등록 호출입니다. 추가형 메모리 helper
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`)는 영향을 받지 않습니다.

  </Accordion>

  <Accordion title="subagent 세션 메시지 타입 이름 변경">
    두 개의 레거시 타입 별칭은 여전히 `src/plugins/runtime/types.ts`에서 export됩니다:

    | 기존                           | 새 항목                          |
    | ----------------------------- | -------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    런타임 메서드 `readSession`은
    `getSessionMessages`를 위해 deprecated 상태입니다. 시그니처는 동일하며, 기존 메서드는
    새 메서드를 호출합니다.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.flows">
    **기존**: `runtime.tasks.flow` (단수)는 라이브 task-flow accessor를 반환했습니다.

    **새 항목**: `runtime.tasks.flows` (복수)는 import-safe하고 전체 task 런타임을
    로드할 필요가 없는 DTO 기반 TaskFlow 액세스를 반환합니다.

    ```typescript
    // 이전
    const flow = api.runtime.tasks.flow(ctx);
    // 이후
    const flows = api.runtime.tasks.flows(ctx);
    ```

  </Accordion>

  <Accordion title="임베디드 extension factory → 에이전트 tool-result middleware">
    위의 "마이그레이션 방법 → Pi tool-result extension을
    middleware로 마이그레이션"에서 다뤘습니다. 완전성을 위해 여기에 다시 포함합니다:
    제거된 Pi 전용
    `api.registerEmbeddedExtensionFactory(...)` 경로는
    `contracts.agentToolResultMiddleware`의 명시적 런타임
    목록을 사용하는 `api.registerAgentToolResultMiddleware(...)`로 대체됩니다.
  </Accordion>

  <Accordion title="OpenClawSchemaType 별칭 → OpenClawConfig">
    `openclaw/plugin-sdk`에서 재export되는 `OpenClawSchemaType`은 이제
    `OpenClawConfig`에 대한 한 줄짜리 별칭입니다. 정식 이름을 우선 사용하세요.

    ```typescript
    // 이전
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 이후
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
번들 채널/제공업체 Plugin(`extensions/` 아래) 내부의 extension 수준 deprecated 항목은
각자의 `api.ts` 및 `runtime-api.ts`
barrel에서 추적됩니다. 이들은 서드파티 Plugin 계약에는 영향을 주지 않으며 여기에 나열되지
않습니다. 번들 Plugin의 로컬 barrel을 직접 사용한다면, 업그레이드 전에
해당 barrel의 deprecation 주석을 읽으세요.
</Note>

## 제거 일정

| 시점                   | 발생 내용                                                               |
| ---------------------- | ----------------------------------------------------------------------- |
| **지금**               | deprecated 표면이 런타임 warning을 출력함                               |
| **다음 major release** | deprecated 표면이 제거되며, 여전히 이를 사용하는 Plugin은 실패함        |

모든 core Plugin은 이미 마이그레이션되었습니다. 외부 Plugin은
다음 major release 전에 마이그레이션해야 합니다.

## 경고를 일시적으로 숨기기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이것은 영구적인 해결책이 아니라 일시적인 탈출구입니다.

## 관련

- [Getting Started](/ko/plugins/building-plugins) — 첫 Plugin 빌드하기
- [SDK Overview](/ko/plugins/sdk-overview) — 전체 subpath import 참조
- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 채널 Plugin 빌드하기
- [Provider Plugins](/ko/plugins/sdk-provider-plugins) — 제공업체 Plugin 빌드하기
- [Plugin Internals](/ko/plugins/architecture) — 아키텍처 심층 분석
- [Plugin Manifest](/ko/plugins/manifest) — manifest 스키마 참조
