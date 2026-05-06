---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 경고가 표시됩니다
    - OPENCLAW_EXTENSION_API_DEPRECATED 경고가 표시됩니다
    - OpenClaw 2026.4.25 이전에 api.registerEmbeddedExtensionFactory를 사용했습니다
    - 최신 Plugin 아키텍처로 Plugin을 업데이트하고 있습니다
    - 외부 OpenClaw Plugin을 유지 관리합니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 레이어에서 최신 Plugin SDK로 마이그레이션
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-05-06T06:36:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw는 광범위한 하위 호환성 계층에서 초점이 분명하고 문서화된 import를 사용하는 최신 Plugin
아키텍처로 이동했습니다. 새 아키텍처 이전에 Plugin을 만들었다면
이 가이드가 마이그레이션에 도움이 됩니다.

## 변경 사항

기존 Plugin 시스템은 Plugin이 단일 진입점에서 필요한 모든 것을 import할 수 있게 하는
두 개의 매우 개방적인 표면을 제공했습니다.

- **`openclaw/plugin-sdk/compat`** - 수십 개의 헬퍼를 다시 내보내는 단일 import입니다.
  새 Plugin 아키텍처가 만들어지는 동안 더 오래된 hook 기반 Plugin이 계속 작동하도록 하기 위해
  도입되었습니다.
- **`openclaw/plugin-sdk/infra-runtime`** - 시스템 이벤트, Heartbeat 상태, 전달 큐, fetch/proxy 헬퍼,
  파일 헬퍼, 승인 타입, 관련 없는 유틸리티를 섞어 둔 광범위한 런타임 헬퍼 barrel입니다.
- **`openclaw/plugin-sdk/config-runtime`** - 마이그레이션 기간 동안 더 이상 권장되지 않는 직접 load/write 헬퍼를
  여전히 포함하는 광범위한 config 호환성 barrel입니다.
- **`openclaw/extension-api`** - 내장 agent runner 같은 host 측 헬퍼에 Plugin이 직접 접근할 수 있게 해 주던
  브리지입니다.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` 같은 embedded-runner 이벤트를 관찰할 수 있었던
  제거된 Pi 전용 bundled extension hook입니다.

광범위한 import 표면은 이제 **사용 중단 예정**입니다. 런타임에서는 아직 작동하지만,
새 Plugin은 이를 사용하면 안 되며, 기존 Plugin은 다음 major release에서 제거되기 전에
마이그레이션해야 합니다. Pi 전용 embedded extension factory 등록 API는 제거되었습니다.
대신 tool-result middleware를 사용하세요.

OpenClaw는 대체 항목을 도입하는 동일한 변경에서 문서화된 Plugin 동작을 제거하거나 재해석하지 않습니다.
계약을 깨는 변경은 먼저 호환성 adapter, diagnostics, docs, deprecation window를 거쳐야 합니다.
이는 SDK import, manifest field, setup API, hook, 런타임 등록 동작에 적용됩니다.

<Warning>
  하위 호환성 계층은 향후 major release에서 제거됩니다.
  이러한 표면에서 계속 import하는 Plugin은 그때 동작하지 않게 됩니다.
  Pi 전용 embedded extension factory 등록은 이미 더 이상 load되지 않습니다.
</Warning>

## 변경 이유

기존 접근 방식은 문제를 일으켰습니다.

- **느린 시작** - 하나의 헬퍼를 import하면 관련 없는 수십 개의 module이 load되었습니다.
- **순환 의존성** - 광범위한 re-export로 import cycle을 만들기 쉬웠습니다.
- **불명확한 API 표면** - 어떤 export가 안정적인지 내부용인지 구분할 방법이 없었습니다.

최신 Plugin SDK는 이를 해결합니다. 각 import path(`openclaw/plugin-sdk/\<subpath\>`)는
명확한 목적과 문서화된 계약을 가진 작고 독립적인 module입니다.

bundled channel을 위한 legacy provider 편의 seam도 제거되었습니다.
Channel 브랜드가 붙은 헬퍼 seam은 안정적인 Plugin 계약이 아니라 private mono-repo shortcut이었습니다.
대신 좁은 generic SDK subpath를 사용하세요. bundled Plugin workspace 안에서는 provider 소유 헬퍼를
해당 Plugin 자체의 `api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 bundled provider 예시:

- Anthropic은 Claude 전용 stream 헬퍼를 자체 `api.ts` /
  `contract-api.ts` seam에 유지합니다.
- OpenAI는 provider builder, default-model 헬퍼, realtime provider
  builder를 자체 `api.ts`에 유지합니다.
- OpenRouter는 provider builder와 onboarding/config 헬퍼를 자체
  `api.ts`에 유지합니다.

## Talk 및 realtime voice 마이그레이션 계획

Realtime voice, telephony, meeting, browser Talk 코드는 surface별 turn bookkeeping에서
`openclaw/plugin-sdk/realtime-voice`가 export하는 공유 Talk session controller로 이동하고 있습니다.
새 controller는 공통 Talk event envelope, active turn 상태, capture 상태, output-audio 상태, 최근 event history,
stale-turn 거부를 소유합니다. Provider Plugin은 vendor별 realtime session을 계속 소유해야 하며,
surface Plugin은 capture, playback, telephony, meeting 관련 특수 처리를 계속 소유해야 합니다.

이 Talk 마이그레이션은 의도적으로 깔끔한 breaking 변경입니다.

1. 공유 controller/runtime primitive를
   `plugin-sdk/realtime-voice`에 유지합니다.
2. bundled surface를 공유 controller로 이동합니다: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime, native push-to-talk.
3. 기존 Talk RPC family를 최종 `talk.session.*` 및
   `talk.client.*` API로 교체합니다.
4. Gateway
   `hello-ok.features.events`에서 하나의 live Talk event channel을 알립니다: `talk.event`.
5. 기존 realtime HTTP endpoint와 request-time instruction
   override path를 삭제합니다.

새 코드는 low-level adapter 또는 test fixture를 구현하는 경우가 아니라면
`createTalkEventSequencer(...)`를 직접 호출하지 않아야 합니다. 공유 controller를 선호하세요.
그러면 turn id 없이 turn 범위 event가 emit될 수 없고, 오래된 `turnEnd` /
`turnCancel` 호출이 더 새로운 active turn을 지울 수 없으며, output-audio lifecycle event가
telephony, meeting, browser relay, managed-room handoff, native Talk client 전반에서 일관되게 유지됩니다.

목표 public API 형태는 다음과 같습니다.

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
```

Browser 소유 WebRTC/provider-websocket session은 `talk.client.create`를 사용합니다.
browser가 provider negotiation과 media transport를 소유하고,
Gateway가 credentials, instructions, tool policy를 소유하기 때문입니다. `talk.session.*`는
gateway-relay realtime, gateway-relay transcription, managed-room native STT/TTS session을 위한
공통 Gateway 관리 surface입니다.

`tallk.provider` /
`talk.providers` 옆에 realtime selector를 배치한 legacy config는 `openclaw doctor --fix`로 복구해야 합니다.
런타임 Talk는 speech/TTS provider config를 realtime provider config로 재해석하지 않습니다.

지원되는 `talk.session.create` 조합은 의도적으로 작습니다.

| 모드            | Transport       | Brain           | 소유자             | 참고                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway를 통해 bridged되는 full-duplex provider audio입니다. tool call은 agent-consult tool을 통해 라우팅됩니다.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Streaming STT 전용입니다. 호출자는 input audio를 보내고 transcript event를 받습니다.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | client가 capture/playback을 소유하고 Gateway가 turn 상태를 소유하는 push-to-talk 및 walkie-talkie 스타일 room입니다. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | Gateway tool action을 직접 실행하는 신뢰된 first-party surface를 위한 admin-only room mode입니다.                  |

제거된 method map:

| 기존                             | 신규                                                     |
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

통합 control vocabulary도 의도적으로 좁습니다.

| Method                          | 적용 대상                                               | 계약                                                                                          |
| ------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 동일한 Gateway connection이 소유한 provider session에 base64 PCM audio chunk를 append합니다. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room user turn을 시작합니다.                                                               |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn validation 후 active turn을 종료합니다.                                              |
| `talk.session.cancelTurn`       | 모든 Gateway 소유 session                               | turn의 active capture/provider/agent/TTS 작업을 취소합니다.                                     |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 반드시 user turn을 끝내지 않고도 assistant audio output을 중지합니다.                         |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | relay가 emit한 provider tool call을 완료합니다.                                           |
| `talk.session.close`            | 모든 unified session                                    | relay session을 중지하거나 managed-room 상태를 revoke한 다음 unified session id를 잊습니다.         |

이를 동작하게 하려고 core에 provider 또는 platform 특수 사례를 도입하지 마세요.
Core는 Talk session semantics를 소유합니다. Provider Plugin은 vendor session setup을 소유합니다.
Voice-call과 Google Meet은 telephony/meeting adapter를 소유합니다. Browser와 native
app은 device capture/playback UX를 소유합니다.

## 호환성 정책

외부 Plugin의 경우, 호환성 작업은 다음 순서를 따릅니다.

1. 새 계약을 추가합니다.
2. 기존 동작을 compatibility adapter를 통해 계속 연결합니다.
3. 기존 path와 replacement를 이름으로 알려 주는 diagnostic 또는 warning을 emit합니다.
4. 두 path를 모두 test에서 다룹니다.
5. deprecation 및 migration path를 문서화합니다.
6. 공지된 migration window 이후에만 제거합니다. 일반적으로 major release에서 제거합니다.

  관리자는 `pnpm plugins:boundary-report`로 현재 마이그레이션 대기열을 감사할 수 있습니다. 간결한 집계에는 `pnpm plugins:boundary-report:summary`를 사용하고, 하나의 Plugin 또는 호환성 소유자에는 `--owner <id>`를 사용하며, 만료된 호환성 레코드, 소유자 간 예약 SDK 가져오기, 또는 사용되지 않는 예약 SDK 하위 경로에서 CI 게이트가 실패해야 할 때는 `pnpm plugins:boundary-report:ci`를 사용하세요. 이 보고서는 지원 중단된 호환성 레코드를 제거 날짜별로 그룹화하고, 로컬 코드/문서 참조 수를 집계하며, 소유자 간 예약 SDK 가져오기를 드러내고, 비공개 memory-host SDK 브리지를 요약해 호환성 정리가 임시 검색에 의존하지 않고 명시적으로 유지되도록 합니다. 예약 SDK 하위 경로에는 추적되는 소유자 사용이 있어야 하며, 사용되지 않는 예약 헬퍼 내보내기는 공개 SDK에서 제거해야 합니다.

  매니페스트 필드가 아직 허용되는 경우, 문서와 진단이 달리 말하기 전까지 Plugin 작성자는 계속 사용할 수 있습니다. 새 코드는 문서화된 대체 항목을 선호해야 하지만, 기존 Plugin은 일반적인 마이너 릴리스 중에 깨지면 안 됩니다.

  ## 마이그레이션 방법

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    번들 Plugin은 `api.runtime.config.loadConfig()`와 `api.runtime.config.writeConfigFile(...)`을 직접 호출하지 않아야 합니다. 이미 활성 호출 경로로 전달된 설정을 선호하세요. 현재 프로세스 스냅샷이 필요한 장기 실행 핸들러는 `api.runtime.config.current()`를 사용할 수 있습니다. 장기 실행 에이전트 도구는 `execute` 안에서 도구 컨텍스트의 `ctx.getRuntimeConfig()`를 사용해야 합니다. 그래야 설정 쓰기 전에 만들어진 도구도 새로 고친 런타임 설정을 볼 수 있습니다.

    설정 쓰기는 트랜잭션 헬퍼를 거쳐야 하며, 쓰기 후 정책을 선택해야 합니다.

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    호출자가 변경 사항에 깨끗한 Gateway 재시작이 필요하다는 것을 알고 있을 때는 `afterWrite: { mode: "restart", reason: "..." }`를 사용하고, 호출자가 후속 처리를 소유하며 다시 로드 플래너를 의도적으로 억제하려는 경우에만 `afterWrite: { mode: "none", reason: "..." }`를 사용하세요. 변경 결과에는 테스트와 로깅을 위한 타입 지정된 `followUp` 요약이 포함됩니다. Gateway는 재시작을 적용하거나 예약하는 책임을 계속 가집니다. `loadConfig`와 `writeConfigFile`은 마이그레이션 기간 동안 외부 Plugin을 위한 지원 중단된 호환성 헬퍼로 남아 있으며, `runtime-config-load-write` 호환성 코드로 한 번 경고합니다. 번들 Plugin과 저장소 런타임 코드는 `pnpm check:deprecated-internal-config-api` 및 `pnpm check:no-runtime-action-load-config`의 스캐너 가드레일로 보호됩니다. 새 프로덕션 Plugin 사용은 즉시 실패하고, 직접 설정 쓰기도 실패하며, Gateway 서버 메서드는 요청 런타임 스냅샷을 사용해야 하고, 런타임 채널 send/action/client 헬퍼는 경계에서 설정을 받아야 하며, 장기 실행 런타임 모듈에는 허용된 주변 `loadConfig()` 호출이 하나도 없습니다.

    새 Plugin 코드도 넓은 `openclaw/plugin-sdk/config-runtime` 호환성 배럴 가져오기를 피해야 합니다. 작업에 맞는 좁은 SDK 하위 경로를 사용하세요.

    | 필요 | 가져오기 |
    | --- | --- |
    | `OpenClawConfig` 같은 설정 타입 | `openclaw/plugin-sdk/config-types` |
    | 이미 로드된 설정 어서션 및 Plugin 엔트리 설정 조회 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 현재 런타임 스냅샷 읽기 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 설정 쓰기 | `openclaw/plugin-sdk/config-mutation` |
    | 세션 저장소 헬퍼 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 표 설정 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 그룹 정책 런타임 헬퍼 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 비밀 입력 확인 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 모델/세션 재정의 | `openclaw/plugin-sdk/model-session-runtime` |

    번들 Plugin과 그 테스트는 넓은 배럴에 대해 스캐너로 보호되므로, 가져오기와 목은 필요한 동작에 로컬로 유지됩니다. 넓은 배럴은 외부 호환성을 위해 여전히 존재하지만, 새 코드는 여기에 의존해서는 안 됩니다.

  </Step>

  <Step title="Migrate Pi tool-result extensions to middleware">
    번들 Plugin은 Pi 전용 `api.registerEmbeddedExtensionFactory(...)` 도구 결과 핸들러를 런타임 중립 미들웨어로 교체해야 합니다.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    동시에 Plugin 매니페스트를 업데이트하세요.

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    외부 Plugin은 도구 결과 미들웨어를 등록할 수 없습니다. 모델이 보기 전에 높은 신뢰도의 도구 출력을 다시 쓸 수 있기 때문입니다.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    이제 승인 가능 채널 Plugin은 `approvalCapability.nativeRuntime`과 공유 런타임 컨텍스트 레지스트리를 통해 네이티브 승인 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`을 `approvalCapability.nativeRuntime`으로 교체
    - 승인 전용 인증/전달을 레거시 `plugin.auth` / `plugin.approvals` 배선에서 `approvalCapability`로 이동
    - `ChannelPlugin.approvals`는 공개 채널 Plugin 계약에서 제거되었습니다. 전달/네이티브/렌더 필드를 `approvalCapability`로 이동하세요
    - `plugin.auth`는 채널 로그인/로그아웃 흐름에만 남습니다. 그 안의 승인 인증 훅은 더 이상 코어에서 읽지 않습니다
    - 클라이언트, 토큰 또는 Bolt 앱 같은 채널 소유 런타임 객체는 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록하세요
    - 네이티브 승인 핸들러에서 Plugin 소유 재라우팅 알림을 보내지 마세요. 이제 코어가 실제 전달 결과에서 라우팅됨-다른-곳 알림을 소유합니다
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때는 실제 `createPluginRuntime().channel` 표면을 제공하세요. 부분 스텁은 거부됩니다.

    현재 승인 기능 레이아웃은 `/plugins/sdk-channel-plugins`를 참조하세요.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우, 이제 확인되지 않은 Windows `.cmd`/`.bat` 래퍼는 명시적으로 `allowShellFallback: true`를 전달하지 않는 한 닫힌 상태로 실패합니다.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    호출자가 셸 폴백에 의도적으로 의존하지 않는다면 `allowShellFallback`을 설정하지 말고, 대신 발생한 오류를 처리하세요.

  </Step>

  <Step title="Find deprecated imports">
    Plugin에서 지원 중단된 표면 중 하나에서 가져오는 항목을 검색하세요.

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    이전 표면의 각 내보내기는 특정한 최신 가져오기 경로에 매핑됩니다.

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

    호스트 측 헬퍼의 경우 직접 가져오는 대신 주입된 Plugin 런타임을 사용하세요.

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    같은 패턴이 다른 레거시 브리지 헬퍼에도 적용됩니다.

    | 이전 가져오기 | 최신 대응 항목 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 세션 저장소 헬퍼 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime`은 외부 호환성을 위해 여전히 존재하지만, 새 코드는 실제로 필요한 집중된 헬퍼 표면을 가져와야 합니다.

    | 필요 | 가져오기 |
    | --- | --- |
    | 시스템 이벤트 대기열 헬퍼 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 이벤트 및 가시성 헬퍼 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 보류 중인 전달 대기열 비우기 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 채널 활동 텔레메트리 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 인메모리 중복 제거 캐시 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 안전한 로컬 파일/미디어 경로 헬퍼 | `openclaw/plugin-sdk/file-access-runtime` |
    | 디스패처 인식 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 프록시 및 보호된 fetch 헬퍼 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 디스패처 정책 타입 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 승인 요청/해결 타입 | `openclaw/plugin-sdk/approval-runtime` |
    | 승인 답장 페이로드 및 명령 헬퍼 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 오류 형식 지정 헬퍼 | `openclaw/plugin-sdk/error-runtime` |
    | 전송 준비 대기 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 보안 토큰 헬퍼 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 제한된 비동기 작업 동시성 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 숫자 강제 변환 | `openclaw/plugin-sdk/number-runtime` |
    | 프로세스 로컬 비동기 잠금 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 파일 잠금 | `openclaw/plugin-sdk/file-lock` |

    번들 Plugin은 `infra-runtime`에 대해 스캐너로 보호되므로, 저장소 코드는 넓은 배럴로 회귀할 수 없습니다.

  </Step>

  <Step title="Migrate channel route helpers">
    새 채널 라우트 코드는 `openclaw/plugin-sdk/channel-route`를 사용해야 합니다. 이전 route-key 및 comparable-target 이름은 마이그레이션 기간 동안 호환성 별칭으로 남아 있지만, 새 Plugin은 동작을 직접 설명하는 라우트 이름을 사용해야 합니다.

    | 이전 헬퍼 | 최신 헬퍼 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    최신 라우트 헬퍼는 네이티브 승인, 답장 억제, 인바운드 중복 제거,
    Cron 전달, 세션 라우팅 전반에서 `{ channel, to, accountId, threadId }`를
    일관되게 정규화합니다. Plugin에서 사용자 지정 대상 문법을 소유하는 경우
    `resolveChannelRouteTargetWithParser(...)`를 사용하여 해당 파서를 동일한
    라우트 대상 계약에 맞게 조정하세요.

  </Step>

  <Step title="빌드 및 테스트">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 가져오기 경로 참조

  <Accordion title="일반 가져오기 경로 표">
  | 가져오기 경로 | 목적 | 주요 내보내기 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 표준 Plugin 엔트리 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 엔트리 정의/빌더를 위한 레거시 통합 재내보내기 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 설정 스키마 내보내기 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 제공자 엔트리 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 집중화된 채널 엔트리 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공유 설정 마법사 헬퍼 | 허용 목록 프롬프트, 설정 상태 빌더 |
  | `plugin-sdk/setup-runtime` | 설정 시점 런타임 헬퍼 | 가져오기 안전 설정 패치 어댑터, 조회 노트 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정 프록시 |
  | `plugin-sdk/setup-adapter-runtime` | 설정 어댑터 헬퍼 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 설정 도구 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 목록/설정/액션 게이트 헬퍼 |
  | `plugin-sdk/account-id` | 계정 ID 헬퍼 | `DEFAULT_ACCOUNT_ID`, 계정 ID 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 + 기본 폴백 헬퍼 |
  | `plugin-sdk/account-helpers` | 범위가 좁은 계정 헬퍼 | 계정 목록/계정 액션 헬퍼 |
  | `plugin-sdk/channel-setup` | 설정 마법사 어댑터 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 페어링 기본 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 답장 접두사, 입력 표시, 소스 전달 연결 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 설정 어댑터 팩토리 및 DM 접근 헬퍼 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 설정 스키마 빌더 | 공유 채널 설정 스키마 기본 요소와 일반 빌더만 |
  | `plugin-sdk/bundled-channel-config-schema` | 번들 설정 스키마 | OpenClaw가 관리하는 번들 Plugin 전용; 새 Plugin은 Plugin 로컬 스키마를 정의해야 함 |
  | `plugin-sdk/channel-config-schema-legacy` | 사용 중단된 번들 설정 스키마 | 호환성 별칭 전용; 관리되는 번들 Plugin에는 `plugin-sdk/bundled-channel-config-schema` 사용 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 설정 헬퍼 | 명령 이름 정규화, 설명 다듬기, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 계정 상태 및 초안 스트림 수명 주기 헬퍼 | `createAccountStatusSink`, 초안 미리보기 최종화 헬퍼 |
  | `plugin-sdk/inbound-envelope` | 인바운드 엔벌로프 헬퍼 | 공유 라우트 + 엔벌로프 빌더 헬퍼 |
  | `plugin-sdk/inbound-reply-dispatch` | 인바운드 답장 헬퍼 | 공유 기록 및 디스패치 헬퍼 |
  | `plugin-sdk/messaging-targets` | 메시징 대상 파싱 | 대상 파싱/매칭 헬퍼 |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 헬퍼 | 공유 아웃바운드 미디어 로딩 |
  | `plugin-sdk/outbound-send-deps` | 아웃바운드 전송 의존성 헬퍼 | 전체 아웃바운드 런타임을 가져오지 않는 경량 `resolveOutboundSendDep` 조회 |
  | `plugin-sdk/outbound-runtime` | 아웃바운드 런타임 헬퍼 | 아웃바운드 전달, ID/전송 위임, 세션, 형식 지정, 페이로드 계획 헬퍼 |
  | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 헬퍼 | 스레드 바인딩 수명 주기 및 어댑터 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 페이로드 헬퍼 | 레거시 필드 레이아웃용 에이전트 미디어 페이로드 빌더 |
  | `plugin-sdk/channel-runtime` | 사용 중단된 호환성 심 | 레거시 채널 런타임 유틸리티만 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 답장 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 Plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 런타임 헬퍼 | 런타임/로깅/백업/Plugin 설치 헬퍼 |
  | `plugin-sdk/runtime-env` | 범위가 좁은 런타임 환경 헬퍼 | 로거/런타임 환경, 타임아웃, 재시도, 백오프 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공유 Plugin 런타임 헬퍼 | Plugin 명령/훅/http/대화형 헬퍼 |
  | `plugin-sdk/hook-runtime` | 훅 파이프라인 헬퍼 | 공유 Webhook/내부 훅 파이프라인 헬퍼 |
  | `plugin-sdk/lazy-runtime` | 지연 런타임 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공유 실행 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI 런타임 헬퍼 | 명령 형식 지정, 대기, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway 클라이언트, 이벤트 루프 준비 시작 헬퍼, 채널 상태 패치 헬퍼 |
  | `plugin-sdk/config-runtime` | 사용 중단된 설정 호환성 심 | `config-types`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` 권장 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때 폴백 안정적인 Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 헬퍼 | 실행/Plugin 승인 페이로드, 승인 기능/프로필 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼, 구조화된 승인 표시 경로 형식 지정 |
  | `plugin-sdk/approval-auth-runtime` | 승인 인증 헬퍼 | 승인자 해석, 같은 채팅 액션 인증 |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 헬퍼 | 네이티브 실행 승인 프로필/필터 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 헬퍼 | 네이티브 승인 기능/전달 어댑터 |
  | `plugin-sdk/approval-gateway-runtime` | 승인 Gateway 헬퍼 | 공유 승인 Gateway 해석 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 어댑터 헬퍼 | 핫 채널 엔트리포인트용 경량 네이티브 승인 어댑터 로딩 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | 승인 핸들러 헬퍼 | 더 넓은 승인 핸들러 런타임 헬퍼; 충분하다면 더 좁은 어댑터/Gateway 경계를 권장 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 헬퍼 | 네이티브 승인 대상/계정 바인딩 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | 승인 답장 헬퍼 | 실행/Plugin 승인 답장 페이로드 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 런타임 컨텍스트 헬퍼 | 일반 채널 런타임 컨텍스트 등록/가져오기/감시 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공유 신뢰, DM 게이팅, 루트 범위 파일/경로 헬퍼, 외부 콘텐츠, 비밀 수집 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 허용 목록 및 사설 네트워크 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF 런타임 헬퍼 | 고정 디스패처, 보호된 fetch, SSRF 정책 헬퍼 |
  | `plugin-sdk/system-event-runtime` | 시스템 이벤트 헬퍼 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 헬퍼 | Heartbeat 이벤트 및 가시성 헬퍼 |
  | `plugin-sdk/delivery-queue-runtime` | 전달 큐 헬퍼 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 채널 활동 헬퍼 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 중복 제거 헬퍼 | 메모리 내 중복 제거 캐시 |
  | `plugin-sdk/file-access-runtime` | 파일 접근 헬퍼 | 안전한 로컬 파일/미디어 경로 헬퍼 |
  | `plugin-sdk/transport-ready-runtime` | 전송 준비 상태 헬퍼 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 제한된 캐시 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 게이팅 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 형식 지정 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, 오류 그래프 헬퍼 |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/프록시 헬퍼 | `resolveFetch`, 프록시 헬퍼, EnvHttpProxyAgent 옵션 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 재시도 헬퍼 | `RetryConfig`, `retryAsync`, 정책 실행기 |
  | `plugin-sdk/allow-from` | 허용 목록 형식 지정 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 허용 목록 입력 매핑 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅 및 명령 표면 헬퍼 | `resolveControlCommandGate`, 발신자 인증 헬퍼, 동적 인수 메뉴 형식 지정을 포함한 명령 레지스트리 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/도움말 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 비밀 입력 파싱 | 비밀 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 가드 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공유 답장 런타임 | 인바운드 디스패치, Heartbeat, 답장 플래너, 청킹 |
  | `plugin-sdk/reply-dispatch-runtime` | 범위가 좁은 답장 디스패치 헬퍼 | 최종화, 제공자 디스패치, 대화 레이블 헬퍼 |
  | `plugin-sdk/reply-history` | 답장 기록 헬퍼 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 답장 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 답장 청크 헬퍼 | 텍스트/마크다운 청킹 헬퍼 |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 헬퍼 | 저장소 경로 + 업데이트 시간 헬퍼 |
  | `plugin-sdk/state-paths` | 상태 경로 헬퍼 | 상태 및 OAuth 디렉터리 헬퍼 |
  | `plugin-sdk/routing` | 라우팅/세션 키 헬퍼 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 헬퍼 |
  | `plugin-sdk/status-helpers` | 채널 상태 헬퍼 | 채널/계정 상태 요약 빌더, 런타임 상태 기본값, 이슈 메타데이터 헬퍼 |
  | `plugin-sdk/target-resolver-runtime` | 대상 해석기 헬퍼 | 공유 대상 해석기 헬퍼 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 헬퍼 | 슬러그/문자열 정규화 헬퍼 |
  | `plugin-sdk/request-url` | 요청 URL 헬퍼 | 요청 유사 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 헬퍼 | 정규화된 stdout/stderr가 있는 시간 제한 명령 실행기 |
  | `plugin-sdk/param-readers` | 매개변수 리더 | 공통 도구/CLI 매개변수 리더 |
  | `plugin-sdk/tool-payload` | 도구 페이로드 추출 | 도구 결과 객체에서 정규화된 페이로드 추출 |
  | `plugin-sdk/tool-send` | 도구 전송 추출 | 도구 인수에서 표준 전송 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 헬퍼 | 공유 임시 다운로드 경로 헬퍼 |
  | `plugin-sdk/logging-core` | 로깅 헬퍼 | 하위 시스템 로거 및 수정 헬퍼 |
  | `plugin-sdk/markdown-table-runtime` | 마크다운 테이블 헬퍼 | 마크다운 테이블 모드 헬퍼 |
  | `plugin-sdk/reply-payload` | 메시지 답장 타입 | 답장 페이로드 타입 |
  | `plugin-sdk/provider-setup` | 엄선된 로컬/자체 호스팅 제공자 설정 헬퍼 | 자체 호스팅 제공자 발견/구성 헬퍼 |
  | `plugin-sdk/self-hosted-provider-setup` | 집중형 OpenAI 호환 자체 호스팅 제공자 설정 헬퍼 | 동일한 자체 호스팅 제공자 발견/구성 헬퍼 |
  | `plugin-sdk/provider-auth-runtime` | 제공자 런타임 인증 헬퍼 | 런타임 API 키 확인 헬퍼 |
  | `plugin-sdk/provider-auth-api-key` | 제공자 API 키 설정 헬퍼 | API 키 온보딩/프로필 쓰기 헬퍼 |
  | `plugin-sdk/provider-auth-result` | 제공자 인증 결과 헬퍼 | 표준 OAuth 인증 결과 빌더 |
  | `plugin-sdk/provider-auth-login` | 제공자 대화형 로그인 헬퍼 | 공유 대화형 로그인 헬퍼 |
  | `plugin-sdk/provider-selection-runtime` | 제공자 선택 헬퍼 | 구성된 제공자 또는 자동 제공자 선택 및 원시 제공자 구성 병합 |
  | `plugin-sdk/provider-env-vars` | 제공자 환경 변수 헬퍼 | 제공자 인증 환경 변수 조회 헬퍼 |
  | `plugin-sdk/provider-model-shared` | 공유 제공자 모델/재실행 헬퍼 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 재실행 정책 빌더, 제공자 엔드포인트 헬퍼 및 모델 ID 정규화 헬퍼 |
  | `plugin-sdk/provider-catalog-shared` | 공유 제공자 카탈로그 헬퍼 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 제공자 온보딩 패치 | 온보딩 구성 헬퍼 |
  | `plugin-sdk/provider-http` | 제공자 HTTP 헬퍼 | 오디오 전사 멀티파트 양식 헬퍼를 포함한 범용 제공자 HTTP/엔드포인트 기능 헬퍼 |
  | `plugin-sdk/provider-web-fetch` | 제공자 웹 가져오기 헬퍼 | 웹 가져오기 제공자 등록/캐시 헬퍼 |
  | `plugin-sdk/provider-web-search-config-contract` | 제공자 웹 검색 구성 헬퍼 | Plugin 활성화 연결이 필요 없는 제공자를 위한 좁은 범위의 웹 검색 구성/자격 증명 헬퍼 |
  | `plugin-sdk/provider-web-search-contract` | 제공자 웹 검색 계약 헬퍼 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` 및 범위 지정 자격 증명 설정자/가져오기자 같은 좁은 범위의 웹 검색 구성/자격 증명 계약 헬퍼 |
  | `plugin-sdk/provider-web-search` | 제공자 웹 검색 헬퍼 | 웹 검색 제공자 등록/캐시/런타임 헬퍼 |
  | `plugin-sdk/provider-tools` | 제공자 도구/스키마 호환성 헬퍼 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 스키마 정리 + 진단 및 `resolveXaiModelCompatPatch` / `applyXaiModelCompat` 같은 xAI 호환성 헬퍼 |
  | `plugin-sdk/provider-usage` | 제공자 사용량 헬퍼 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 및 기타 제공자 사용량 헬퍼 |
  | `plugin-sdk/provider-stream` | 제공자 스트림 래퍼 헬퍼 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입 및 공유 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 헬퍼 |
  | `plugin-sdk/provider-transport-runtime` | 제공자 전송 헬퍼 | 보호된 fetch, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림 같은 네이티브 제공자 전송 헬퍼 |
  | `plugin-sdk/keyed-async-queue` | 순서 보장 비동기 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공유 미디어 헬퍼 | 미디어 가져오기/변환/저장 헬퍼, ffprobe 기반 비디오 크기 감지 및 미디어 페이로드 빌더 |
  | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 헬퍼 | 이미지/비디오/음악 생성을 위한 공유 장애 조치 헬퍼, 후보 선택 및 누락 모델 메시지 |
  | `plugin-sdk/media-understanding` | 미디어 이해 헬퍼 | 미디어 이해 제공자 타입 및 제공자 대상 이미지/오디오 헬퍼 내보내기 |
  | `plugin-sdk/text-runtime` | 공유 텍스트 헬퍼 | 어시스턴트 표시 텍스트 제거, 마크다운 렌더링/청킹/테이블 헬퍼, 수정 헬퍼, 지시문 태그 헬퍼, 안전 텍스트 유틸리티 및 관련 텍스트/로깅 헬퍼 |
  | `plugin-sdk/text-chunking` | 텍스트 청킹 헬퍼 | 발신 텍스트 청킹 헬퍼 |
  | `plugin-sdk/speech` | 음성 헬퍼 | 음성 제공자 타입 및 제공자 대상 지시문, 레지스트리, 유효성 검사 헬퍼, OpenAI 호환 TTS 빌더 |
  | `plugin-sdk/speech-core` | 공유 음성 코어 | 음성 제공자 타입, 레지스트리, 지시문, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 헬퍼 | 제공자 타입, 레지스트리 헬퍼 및 공유 WebSocket 세션 헬퍼 |
  | `plugin-sdk/realtime-voice` | 실시간 음성 헬퍼 | 제공자 타입, 레지스트리/확인 헬퍼, 브리지 세션 헬퍼, 공유 에이전트 말대답 큐, 전사/이벤트 상태, 에코 억제 및 빠른 컨텍스트 조회 헬퍼 |
  | `plugin-sdk/image-generation` | 이미지 생성 헬퍼 | 이미지 생성 제공자 타입 및 이미지 자산/데이터 URL 헬퍼, OpenAI 호환 이미지 제공자 빌더 |
  | `plugin-sdk/image-generation-core` | 공유 이미지 생성 코어 | 이미지 생성 타입, 장애 조치, 인증 및 레지스트리 헬퍼 |
  | `plugin-sdk/music-generation` | 음악 생성 헬퍼 | 음악 생성 제공자/요청/결과 타입 |
  | `plugin-sdk/music-generation-core` | 공유 음악 생성 코어 | 음악 생성 타입, 장애 조치 헬퍼, 제공자 조회 및 모델 참조 파싱 |
  | `plugin-sdk/video-generation` | 비디오 생성 헬퍼 | 비디오 생성 제공자/요청/결과 타입 |
  | `plugin-sdk/video-generation-core` | 공유 비디오 생성 코어 | 비디오 생성 타입, 장애 조치 헬퍼, 제공자 조회 및 모델 참조 파싱 |
  | `plugin-sdk/interactive-runtime` | 대화형 답장 헬퍼 | 대화형 답장 페이로드 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | 채널 구성 프리미티브 | 좁은 범위의 채널 구성 스키마 프리미티브 |
  | `plugin-sdk/channel-config-writes` | 채널 구성 쓰기 헬퍼 | 채널 구성 쓰기 권한 부여 헬퍼 |
  | `plugin-sdk/channel-plugin-common` | 공유 채널 프렐류드 | 공유 채널 Plugin 프렐류드 내보내기 |
  | `plugin-sdk/channel-status` | 채널 상태 헬퍼 | 공유 채널 상태 스냅샷/요약 헬퍼 |
  | `plugin-sdk/allowlist-config-edit` | 허용 목록 구성 헬퍼 | 허용 목록 구성 편집/읽기 헬퍼 |
  | `plugin-sdk/group-access` | 그룹 액세스 헬퍼 | 공유 그룹 액세스 결정 헬퍼 |
  | `plugin-sdk/direct-dm` | 직접 DM 헬퍼 | 공유 직접 DM 인증/가드 헬퍼 |
  | `plugin-sdk/extension-shared` | 공유 확장 헬퍼 | 수동 채널/상태 및 앰비언트 프록시 헬퍼 프리미티브 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 헬퍼 | Webhook 대상 레지스트리 및 경로 설치 헬퍼 |
  | `plugin-sdk/webhook-path` | Webhook 경로 헬퍼 | Webhook 경로 정규화 헬퍼 |
  | `plugin-sdk/web-media` | 공유 웹 미디어 헬퍼 | 원격/로컬 미디어 로딩 헬퍼 |
  | `plugin-sdk/zod` | Zod 재내보내기 | Plugin SDK 소비자를 위해 재내보낸 `zod` |
  | `plugin-sdk/memory-core` | 번들된 메모리 코어 헬퍼 | 메모리 관리자/구성/파일/CLI 헬퍼 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 런타임 퍼사드 | 메모리 인덱스/검색 런타임 퍼사드 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 기반 엔진 | 메모리 호스트 기반 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, 레지스트리 액세스, 로컬 제공자 및 범용 배치/원격 헬퍼. 구체적인 원격 제공자는 해당 소유 Plugin에 위치 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 스토리지 엔진 | 메모리 호스트 스토리지 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 | 메모리 호스트 멀티모달 헬퍼 |
  | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 | 메모리 호스트 쿼리 헬퍼 |
  | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 시크릿 헬퍼 | 메모리 호스트 시크릿 헬퍼 |
  | `plugin-sdk/memory-core-host-events` | 메모리 호스트 이벤트 저널 헬퍼 | 메모리 호스트 이벤트 저널 헬퍼 |
  | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 | 메모리 호스트 상태 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 | 메모리 호스트 CLI 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 | 메모리 호스트 코어 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 | 메모리 호스트 파일/런타임 헬퍼 |
  | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 별칭 | 벤더 중립적인 메모리 호스트 코어 런타임 헬퍼 별칭 |
  | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 벤더 중립적인 메모리 호스트 이벤트 저널 헬퍼 별칭 |
  | `plugin-sdk/memory-host-files` | 메모리 호스트 파일/런타임 별칭 | 벤더 중립적인 메모리 호스트 파일/런타임 헬퍼 별칭 |
  | `plugin-sdk/memory-host-markdown` | 관리형 마크다운 헬퍼 | 메모리 인접 Plugin을 위한 공유 관리형 마크다운 헬퍼 |
  | `plugin-sdk/memory-host-search` | 액티브 메모리 검색 퍼사드 | 지연 로드되는 액티브 메모리 검색 관리자 런타임 퍼사드 |
  | `plugin-sdk/memory-host-status` | 메모리 호스트 상태 별칭 | 벤더 중립적인 메모리 호스트 상태 헬퍼 별칭 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 레거시 광범위 호환성 배럴. `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures` 같은 집중형 테스트 하위 경로를 선호하세요 |
</Accordion>

이 표는 의도적으로 전체 SDK 표면이 아니라 공통 마이그레이션 하위 집합만 다룹니다. 200개 이상의 진입점 전체 목록은
`scripts/lib/plugin-sdk-entrypoints.json`에 있습니다.

예약된 번들 Plugin 헬퍼 이음매는 명시적으로 문서화된 호환성 파사드(예: 게시된 `@openclaw/discord@2026.3.13` 패키지를 위해 유지되는 사용 중단된 `plugin-sdk/discord` shim)를 제외하고 public SDK
export map에서 제거되었습니다. 소유자별 헬퍼는 소유 Plugin 패키지 내부에 있으며, 공유 호스트 동작은 `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, `plugin-sdk/plugin-config-runtime` 같은 일반 SDK
계약을 통해 이동해야 합니다.

작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면 `src/plugin-sdk/`의 소스를 확인하거나 어떤 일반 계약이 이를 소유해야 하는지 유지관리자에게 문의하세요.

## 활성 사용 중단

Plugin SDK, provider 계약, runtime 표면, manifest 전반에 적용되는 더 좁은 범위의 사용 중단입니다. 각각은 현재도 동작하지만 향후 major release에서 제거됩니다. 각 항목 아래의 항목은 이전 API를 정식 대체 항목에 매핑합니다.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **이전 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **신규 (`openclaw/plugin-sdk/command-status`)**: 동일한 시그니처, 동일한
    export이며 더 좁은 subpath에서 import하기만 하면 됩니다. `command-auth`는
    호환성 stub으로 이를 다시 export합니다.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **이전**: `openclaw/plugin-sdk/channel-inbound` 또는
    `openclaw/plugin-sdk/channel-mention-gating`의
    `resolveInboundMentionRequirement({ facts, policy })` 및
    `shouldDropInboundForMention(...)`.

    **신규**: `resolveInboundMentionDecision({ facts, policy })` - 두 개의 분리된 호출 대신
    단일 decision 객체를 반환합니다.

    downstream channel Plugin(Slack, Discord, Matrix, MS Teams)은 이미
    전환되었습니다.

  </Accordion>

  <Accordion title="Channel runtime shim 및 channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime`은 이전 channel Plugin을 위한 호환성 shim입니다.
    새 코드에서는 import하지 마세요. runtime 객체 등록에는
    `openclaw/plugin-sdk/channel-runtime-context`를 사용하세요.

    `openclaw/plugin-sdk/channel-actions`의 `channelActions*` 헬퍼는 원시 "actions" channel export와 함께
    사용 중단됩니다. 대신 의미 기반 `presentation` 표면을 통해 기능을 노출하세요. 즉, channel Plugin은
    수락하는 원시 action 이름이 아니라 자신이 렌더링하는 항목(cards, buttons, selects)을 선언합니다.

  </Accordion>

  <Accordion title="Web search provider tool() helper → Plugin의 createTool()">
    **이전**: `openclaw/plugin-sdk/provider-web-search`의 `tool()` factory.

    **신규**: provider Plugin에 `createTool(...)`을 직접 구현하세요.
    OpenClaw는 더 이상 tool wrapper를 등록하기 위해 SDK 헬퍼가 필요하지 않습니다.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **이전**: inbound channel 메시지에서 평면 plaintext prompt envelope를 만들기 위한
    `formatInboundEnvelope(...)`(및
    `ChannelMessageForAgent.channelEnvelope`).

    **신규**: `BodyForAgent`와 구조화된 user-context 블록. Channel
    Plugin은 routing metadata(thread, topic, reply-to, reactions)를 prompt 문자열에 연결하는 대신
    typed field로 첨부합니다. 합성된 assistant-facing envelope에는
    `formatAgentEnvelope(...)` 헬퍼가 여전히 지원되지만, inbound plaintext envelope는
    사라지는 중입니다.

    영향을 받는 영역: `inbound_claim`, `message_received`, 그리고 `channelEnvelope` 텍스트를 후처리한 모든 custom
    channel Plugin.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    네 가지 discovery type alias는 이제
    catalog 시대 type을 감싼 얇은 wrapper입니다.

    | 이전 alias               | 신규 type                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    또한 legacy `ProviderCapabilities` static bag도 해당됩니다. provider Plugin은
    static object 대신 `buildReplayPolicy`,
    `normalizeToolSchemas`, `wrapStreamFn` 같은 명시적 provider hook을 사용해야 합니다.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **이전**(`ProviderThinkingPolicy`의 세 가지 개별 hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, 및
    `resolveDefaultThinkingLevel(ctx)`.

    **신규**: 정식 `id`, 선택적 `label`, 순위가 매겨진 level 목록이 포함된
    `ProviderThinkingProfile`을 반환하는 단일 `resolveThinkingProfile(ctx)`.
    OpenClaw는 profile 순위에 따라 오래된 저장 값을 자동으로 downgrade합니다.

    세 개 대신 하나의 hook을 구현하세요. legacy hook은 사용 중단 기간 동안 계속 동작하지만
    profile 결과와 합성되지는 않습니다.

  </Accordion>

  <Accordion title="External OAuth provider fallback → contracts.externalAuthProviders">
    **이전**: Plugin manifest에 provider를 선언하지 않고
    `resolveExternalOAuthProfiles(...)`를 구현.

    **신규**: Plugin manifest에 `contracts.externalAuthProviders`를 선언하고
    **또한** `resolveExternalAuthProfiles(...)`를 구현하세요. 이전 "auth
    fallback" 경로는 runtime에서 경고를 내보내며 제거될 예정입니다.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **이전** manifest field: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **신규**: 동일한 env-var lookup을 manifest의 `setup.providers[].envVars`에
    미러링하세요. 이렇게 하면 setup/status env metadata가 한 곳으로 통합되고,
    env-var lookup에 답하기 위해 Plugin runtime을 boot하지 않아도 됩니다.

    `providerAuthEnvVars`는 사용 중단 기간이 종료될 때까지 호환성 adapter를 통해
    계속 지원됩니다.

  </Accordion>

  <Accordion title="Memory Plugin registration → registerMemoryCapability">
    **이전**: 세 개의 개별 호출 -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **신규**: memory-state API의 단일 호출 -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    동일한 slot, 단일 registration 호출입니다. 추가형 memory 헬퍼
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`)는 영향을 받지 않습니다.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    `src/plugins/runtime/types.ts`에서 여전히 export되는 두 가지 legacy type alias:

    | 이전                          | 신규                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    runtime method `readSession`은 `getSessionMessages`를 선호하도록 사용 중단되었습니다.
    동일한 시그니처이며, 이전 method는 새 method를 호출합니다.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **이전**: `runtime.tasks.flow`(단수)는 live task-flow accessor를 반환했습니다.

    **신규**: `runtime.tasks.managedFlows`는 flow에서 child task를 생성, 업데이트, 취소 또는 실행하는
    Plugin을 위해 관리형 TaskFlow mutation runtime을 유지합니다.
    Plugin이 DTO 기반 읽기만 필요로 할 때는 `runtime.tasks.flows`를 사용하세요.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    위의 "마이그레이션 방법 → Pi tool-result extension을
    middleware로 마이그레이션"에서 다룹니다. 완전성을 위해 여기에 포함합니다. 제거된 Pi 전용
    `api.registerEmbeddedExtensionFactory(...)` 경로는 `contracts.agentToolResultMiddleware`의 명시적 runtime
    목록과 함께 `api.registerAgentToolResultMiddleware(...)`로 대체됩니다.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk`에서 다시 export되는 `OpenClawSchemaType`은 이제
    `OpenClawConfig`의 한 줄짜리 alias입니다. 정식 이름을 선호하세요.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 아래 번들 channel/provider Plugin 내부의 extension-level 사용 중단은
각각의 `api.ts` 및 `runtime-api.ts` barrel 내부에서 추적됩니다.
이는 third-party Plugin 계약에 영향을 주지 않으므로 여기에 나열되지 않습니다.
번들 Plugin의 local barrel을 직접 consume한다면 upgrade하기 전에 해당 barrel의
사용 중단 주석을 읽으세요.
</Note>

## 제거 일정

| 시점                   | 발생하는 일                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **현재**               | 사용 중단된 표면은 runtime warning을 내보냅니다                         |
| **다음 major release** | 사용 중단된 표면은 제거되며, 이를 계속 사용하는 Plugin은 실패합니다     |

모든 core Plugin은 이미 마이그레이션되었습니다. 외부 Plugin은
다음 major release 전에 마이그레이션해야 합니다.

## 경고 일시적으로 억제하기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요.

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이는 임시 escape hatch이지 영구적인 해결책이 아닙니다.

## 관련 항목

- [시작하기](/ko/plugins/building-plugins) - 첫 Plugin 빌드하기
- [SDK 개요](/ko/plugins/sdk-overview) - 전체 subpath import reference
- [Channel Plugin](/ko/plugins/sdk-channel-plugins) - channel Plugin 빌드하기
- [Provider Plugin](/ko/plugins/sdk-provider-plugins) - provider Plugin 빌드하기
- [Plugin 내부 구조](/ko/plugins/architecture) - architecture 심층 분석
- [Plugin Manifest](/ko/plugins/manifest) - manifest schema reference
