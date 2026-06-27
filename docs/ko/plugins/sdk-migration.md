---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 경고가 표시됩니다
    - OPENCLAW_EXTENSION_API_DEPRECATED 경고가 표시됩니다
    - OpenClaw 2026.4.25 이전에 api.registerEmbeddedExtensionFactory를 사용했습니다
    - Plugin을 최신 Plugin 아키텍처로 업데이트하고 있습니다
    - 외부 OpenClaw Plugin을 유지 관리합니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 plugin SDK로 마이그레이션
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-06-27T17:56:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9061b31567cbd24196458ecb9af1cb1b0351f789a136ea26951c8fb7e576cf08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw는 광범위한 하위 호환성 계층에서 벗어나, 집중적이고 문서화된 import를 갖춘 현대적인 Plugin
아키텍처로 이동했습니다. 새 아키텍처 이전에 Plugin을 만들었다면
이 가이드가 마이그레이션을 도와줍니다.

## 변경 사항

이전 Plugin 시스템은 Plugin이 단일 진입점에서 필요한 모든 것을 import할 수 있게 하는
두 개의 매우 개방적인 표면을 제공했습니다.

- **`openclaw/plugin-sdk/compat`** - 수십 개의 헬퍼를 다시 export하는 단일 import입니다.
  새 Plugin 아키텍처가 만들어지는 동안 이전의 hook 기반 Plugin이 계속 작동하도록
  도입되었습니다.
- **`openclaw/plugin-sdk/infra-runtime`** - 시스템 이벤트, Heartbeat 상태, 전달 큐,
  fetch/proxy 헬퍼, 파일 헬퍼, 승인 타입, 관련 없는 유틸리티를 섞어 둔
  광범위한 런타임 헬퍼 배럴입니다.
- **`openclaw/plugin-sdk/config-runtime`** - 마이그레이션 기간 동안 더 이상 권장되지 않는
  직접 load/write 헬퍼를 여전히 포함하는 광범위한 config 호환성 배럴입니다.
- **`openclaw/extension-api`** - 내장 에이전트 러너 같은 host 측 헬퍼에 Plugin이 직접 접근할 수 있게 해 준
  브리지입니다.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` 같은 embedded-runner 이벤트를
  관찰할 수 있었던, 제거된 embedded-runner 전용 번들 extension hook입니다.

광범위한 import 표면은 이제 **더 이상 권장되지 않습니다**. 런타임에서는 아직 작동하지만,
새 Plugin은 이를 사용하면 안 되며, 기존 Plugin은 다음 메이저 릴리스에서 제거되기 전에
마이그레이션해야 합니다. embedded-runner 전용 extension factory 등록 API는 제거되었습니다.
대신 tool-result middleware를 사용하세요.

OpenClaw는 대체 수단을 도입하는 동일한 변경에서 문서화된 Plugin 동작을 제거하거나
다르게 해석하지 않습니다. 계약을 깨는 변경은 먼저 호환성 어댑터, 진단, 문서,
지원 중단 기간을 거쳐야 합니다. 이는 SDK import, manifest 필드, setup API, hook,
런타임 등록 동작에 적용됩니다.

<Warning>
  하위 호환성 계층은 향후 메이저 릴리스에서 제거됩니다.
  이러한 표면에서 계속 import하는 Plugin은 그때 작동하지 않게 됩니다.
  레거시 embedded extension factory 등록은 이미 더 이상 로드되지 않습니다.
</Warning>

## 변경 이유

이전 접근 방식은 문제를 일으켰습니다.

- **느린 시작** - 하나의 헬퍼를 import하면 관련 없는 수십 개의 모듈이 로드됨
- **순환 의존성** - 광범위한 re-export로 인해 import cycle을 만들기 쉬움
- **불명확한 API 표면** - 어떤 export가 안정적인지 내부용인지 구분할 방법이 없음

현대적인 Plugin SDK는 이를 해결합니다. 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는
명확한 목적과 문서화된 계약을 가진 작고 독립적인 모듈입니다.

번들 채널을 위한 레거시 provider 편의 seam도 제거되었습니다.
채널 브랜드 헬퍼 seam은 안정적인 Plugin 계약이 아니라 비공개 mono-repo 단축 경로였습니다.
대신 좁은 범위의 일반 SDK subpath를 사용하세요. 번들 Plugin workspace 내부에서는
provider 소유 헬퍼를 해당 Plugin의 `api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 provider 예시는 다음과 같습니다.

- Anthropic은 Claude 전용 stream 헬퍼를 자체 `api.ts` /
  `contract-api.ts` seam에 유지합니다.
- OpenAI는 provider builder, 기본 모델 헬퍼, realtime provider
  builder를 자체 `api.ts`에 유지합니다.
- OpenRouter는 provider builder와 onboarding/config 헬퍼를 자체
  `api.ts`에 유지합니다.

## Talk 및 realtime voice 마이그레이션 계획

Realtime voice, telephony, meeting, browser Talk 코드는
표면별 turn bookkeeping에서 `openclaw/plugin-sdk/realtime-voice`가 export하는
공유 Talk session controller로 이동하고 있습니다. 새 controller는 공통 Talk
event envelope, active turn state, capture state, output-audio state, 최근
event history, stale-turn rejection을 소유합니다. Provider Plugin은 vendor별
realtime session을 계속 소유해야 하며, surface Plugin은 capture,
playback, telephony, meeting quirks를 계속 소유해야 합니다.

이 Talk 마이그레이션은 의도적으로 호환성을 끊고 깔끔하게 진행됩니다.

1. 공유 controller/runtime primitive를
   `plugin-sdk/realtime-voice`에 유지합니다.
2. 번들 surface를 공유 controller로 이동합니다: browser relay,
   managed-room handoff, voice-call realtime, voice-call streaming STT, Google
   Meet realtime, native push-to-talk.
3. 이전 Talk RPC family를 최종 `talk.session.*` 및
   `talk.client.*` API로 교체합니다.
4. Gateway `hello-ok.features.events`에 하나의 live Talk event channel을
   알립니다: `talk.event`.
5. 이전 realtime HTTP endpoint와 request-time instruction
   override 경로를 삭제합니다.

새 코드는 low-level adapter 또는 test fixture를 구현하는 경우가 아니라면
`createTalkEventSequencer(...)`를 직접 호출하면 안 됩니다. turn id 없이
turn 범위 event가 emit되지 않고, 오래된 `turnEnd` /
`turnCancel` 호출이 더 새로운 active turn을 지우지 않으며, output-audio lifecycle
event가 telephony, meeting, browser relay, managed-room
handoff, native Talk client 전반에서 일관되게 유지되도록 공유 controller를 선호하세요.

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

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Browser 소유 WebRTC/provider-websocket session은 `talk.client.create`를 사용합니다.
browser가 provider negotiation과 media transport를 소유하고, Gateway가 credentials,
instructions, tool policy를 소유하기 때문입니다. `talk.session.*`는
gateway-relay realtime, gateway-relay transcription, managed-room native STT/TTS
session을 위한 공통 Gateway 관리 surface입니다.

realtime selector를 `talk.provider` /
`talk.providers` 옆에 둔 레거시 config는 `openclaw doctor --fix`로 복구해야 합니다.
런타임 Talk는 speech/TTS provider config를 realtime provider config로 다시 해석하지 않습니다.

지원되는 `talk.session.create` 조합은 의도적으로 작습니다.

| 모드            | 전송            | 브레인          | 소유자             | 참고                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Gateway를 통해 브리지되는 full-duplex provider audio이며, tool call은 agent-consult tool을 통해 라우팅됩니다.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Streaming STT 전용입니다. caller는 input audio를 보내고 transcript event를 받습니다.                               |
| `stt-tts`       | `managed-room`  | `agent-consult` | Native/client room | client가 capture/playback을 소유하고 Gateway가 turn state를 소유하는 push-to-talk 및 walkie-talkie 스타일 room입니다. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Native/client room | 신뢰할 수 있는 first-party surface가 Gateway tool action을 직접 실행하는 admin 전용 room mode입니다.               |

제거된 method map:

| 이전                             | 신규                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` or `talk.session.cancelTurn` |
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

  | 메서드                          | 적용 대상                                              | 계약                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 동일한 Gateway 연결이 소유한 제공자 세션에 base64 PCM 오디오 청크를 추가합니다.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 관리형 룸 사용자 턴을 시작합니다.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 오래된 턴 검증 후 활성 턴을 종료합니다.                                                                                                                                         |
  | `talk.session.cancelTurn`       | 모든 Gateway 소유 세션                              | 턴의 활성 캡처/제공자/에이전트/TTS 작업을 취소합니다.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 반드시 사용자 턴을 종료하지 않고도 어시스턴트 오디오 출력을 중지합니다.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 릴레이가 내보낸 제공자 도구 호출을 완료합니다. 중간 출력에는 `options.willContinue`를 전달하거나, 다른 어시스턴트 응답 없이 호출을 충족하려면 `options.suppressResponse`를 전달합니다. |
  | `talk.session.steer`            | 에이전트 기반 Talk 세션                              | Talk 세션에서 해석된 활성 임베디드 실행에 음성 `status`, `steer`, `cancel` 또는 `followup` 제어를 보냅니다.                                                                |
  | `talk.session.close`            | 모든 통합 세션                                    | 릴레이 세션을 중지하거나 관리형 룸 상태를 철회한 다음 통합 세션 ID를 잊습니다.                                                                                                    |

  이 작업을 위해 코어에 제공자 또는 플랫폼 특수 사례를 도입하지 마세요.
  코어는 Talk 세션 의미 체계를 소유합니다. 제공자 Plugin은 벤더 세션 설정을 소유합니다.
  음성 통화와 Google Meet은 전화/회의 어댑터를 소유합니다. 브라우저와 네이티브
  앱은 디바이스 캡처/재생 UX를 소유합니다.

  ## 호환성 정책

  외부 Plugin의 경우 호환성 작업은 다음 순서를 따릅니다.

  1. 새 계약 추가
  2. 호환성 어댑터를 통해 기존 동작 유지
  3. 기존 경로와 대체 항목을 명시하는 진단 또는 경고 출력
  4. 테스트에서 두 경로 모두 다루기
  5. 지원 중단 및 마이그레이션 경로 문서화
  6. 공지된 마이그레이션 기간 후에만 제거하며, 보통 메이저 릴리스에서 제거

  관리자는 `pnpm plugins:boundary-report`로 현재 마이그레이션 대기열을 감사할 수 있습니다. 간결한 개수에는 `pnpm plugins:boundary-report:summary`를, 하나의 Plugin 또는 호환성 소유자에는 `--owner <id>`를, 기한이 된 호환성 기록, 소유자 간 예약 SDK 가져오기 또는 사용되지 않는 예약 SDK 하위 경로에서 CI 게이트가 실패해야 할 때는 `pnpm plugins:boundary-report:ci`를 사용하세요. 이 보고서는 지원 중단된 호환성 기록을 제거 날짜별로 그룹화하고, 로컬 코드/문서 참조 수를 세며, 소유자 간 예약 SDK 가져오기를 드러내고, 비공개 memory-host SDK 브리지를 요약하여 호환성 정리가 임시 검색에 의존하지 않고 명시적으로 유지되도록 합니다. 예약 SDK 하위 경로에는 추적되는 소유자 사용이 있어야 합니다. 사용되지 않는 예약 헬퍼 내보내기는 공개 SDK에서 제거해야 합니다.

  매니페스트 필드가 아직 허용되는 경우, Plugin 작성자는 문서와 진단에서 달리 말할 때까지 계속 사용할 수 있습니다. 새 코드는 문서화된 대체 항목을 선호해야 하지만, 기존 Plugin은 일반적인 마이너 릴리스 중에 깨지면 안 됩니다.

  ## 마이그레이션 방법

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    번들 Plugin은
    `api.runtime.config.loadConfig()`와
    `api.runtime.config.writeConfigFile(...)`를 직접 호출하지 않아야 합니다. 활성 호출 경로에 이미 전달된 구성을 선호하세요. 현재 프로세스 스냅샷이 필요한 장기 실행 핸들러는 `api.runtime.config.current()`를 사용할 수 있습니다. 장기 실행 에이전트 도구는 `execute` 내부에서 도구 컨텍스트의 `ctx.getRuntimeConfig()`를 사용해야 합니다. 그래야 구성 쓰기 전에 생성된 도구도 새로 고쳐진 런타임 구성을 볼 수 있습니다.

    구성 쓰기는 트랜잭션 헬퍼를 통해 수행해야 하며, 쓰기 후 정책을 선택해야 합니다.

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    호출자가 변경에 깨끗한 gateway 재시작이 필요하다는 것을 알고 있으면 `afterWrite: { mode: "restart", reason: "..." }`를 사용하고, 호출자가 후속 조치를 소유하며 reload planner를 의도적으로 억제하려는 경우에만 `afterWrite: { mode: "none", reason: "..." }`를 사용하세요.
    변이 결과에는 테스트와 로깅을 위한 타입 지정된 `followUp` 요약이 포함됩니다.
    gateway는 재시작을 적용하거나 예약할 책임을 계속 가집니다.
    `loadConfig`와 `writeConfigFile`은 마이그레이션 기간 동안 외부 Plugin을 위한 지원 중단된 호환성 헬퍼로 남아 있으며, `runtime-config-load-write` 호환성 코드로 한 번 경고합니다. 번들 Plugin과 저장소 런타임 코드는
    `pnpm check:deprecated-api-usage` 및
    `pnpm check:no-runtime-action-load-config`의 스캐너 가드레일로 보호됩니다. 새 프로덕션 Plugin 사용은 즉시 실패하고, 직접 구성 쓰기는 실패하며, gateway 서버 메서드는 요청 런타임 스냅샷을 사용해야 하고, 런타임 채널 전송/작업/클라이언트 헬퍼는 경계에서 구성을 받아야 하며, 장기 실행 런타임 모듈에는 허용되는 주변 `loadConfig()` 호출이 없어야 합니다.

    새 Plugin 코드도 광범위한
    `openclaw/plugin-sdk/config-runtime` 호환성 배럴 가져오기를 피해야 합니다. 작업에 맞는 좁은 SDK 하위 경로를 사용하세요.

    | 필요 | 가져오기 |
    | --- | --- |
    | `OpenClawConfig` 같은 구성 타입 | `openclaw/plugin-sdk/config-contracts` |
    | 이미 로드된 구성 어설션 및 Plugin 엔트리 구성 조회 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 현재 런타임 스냅샷 읽기 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 구성 쓰기 | `openclaw/plugin-sdk/config-mutation` |
    | 세션 저장소 헬퍼 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 테이블 구성 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 그룹 정책 런타임 헬퍼 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 비밀 입력 해석 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 모델/세션 재정의 | `openclaw/plugin-sdk/model-session-runtime` |

    번들 Plugin과 해당 테스트는 광범위한 배럴에 대해 스캐너로 보호되므로 가져오기와 모의 객체가 필요한 동작에 로컬로 유지됩니다. 광범위한 배럴은 외부 호환성을 위해 여전히 존재하지만, 새 코드는 이에 의존해서는 안 됩니다.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    번들 Plugin은 임베디드 러너 전용
    `api.registerEmbeddedExtensionFactory(...)` 도구 결과 핸들러를 런타임 중립 미들웨어로 대체해야 합니다.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    동시에 Plugin 매니페스트를 업데이트하세요.

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    설치된 Plugin도 명시적으로 활성화되어 있고
    `contracts.agentToolResultMiddleware`에 대상 런타임을 모두 선언한 경우 도구 결과 미들웨어를 등록할 수 있습니다. 선언되지 않은 설치 Plugin 미들웨어 등록은 거부됩니다.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    승인 가능 채널 Plugin은 이제
    `approvalCapability.nativeRuntime`과 공유 런타임 컨텍스트 레지스트리를 통해 네이티브 승인 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`을
      `approvalCapability.nativeRuntime`으로 대체
    - 승인 전용 인증/전달을 레거시 `plugin.auth` /
      `plugin.approvals` 연결에서 `approvalCapability`로 이동
    - `ChannelPlugin.approvals`는 공개 채널 Plugin 계약에서 제거되었습니다. 전달/네이티브/렌더 필드를 `approvalCapability`로 이동하세요
    - `plugin.auth`는 채널 로그인/로그아웃 흐름에만 남습니다. 코어는 더 이상 그곳의 승인 인증 훅을 읽지 않습니다
    - 클라이언트, 토큰 또는 Bolt 앱 같은 채널 소유 런타임 객체를 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록
    - 네이티브 승인 핸들러에서 Plugin 소유 재라우팅 알림을 보내지 마세요. 코어는 이제 실제 전달 결과에서 나온 다른 위치로 라우팅됨 알림을 소유합니다
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때 실제 `createPluginRuntime().channel` 표면을 제공하세요. 부분 스텁은 거부됩니다.

    현재 승인 기능 레이아웃은 `/plugins/sdk-channel-plugins`를 참조하세요.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우, 해석되지 않은 Windows
    `.cmd`/`.bat` 래퍼는 명시적으로
    `allowShellFallback: true`를 전달하지 않는 한 이제 실패로 닫힙니다.

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

    호출자가 셸 폴백에 의도적으로 의존하지 않는다면
    `allowShellFallback`을 설정하지 말고 대신 발생한 오류를 처리하세요.

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
    이전 표면의 각 내보내기는 특정 최신 가져오기 경로에 매핑됩니다.

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

    호스트 측 헬퍼의 경우 직접 가져오는 대신 주입된 Plugin 런타임을 사용하세요:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    동일한 패턴이 다른 기존 브리지 헬퍼에도 적용됩니다.

    | 이전 import | 최신 동등 항목 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | 세션 저장소 헬퍼 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="광범위한 infra-runtime import 교체">
    `openclaw/plugin-sdk/infra-runtime`은 외부 호환성을 위해 여전히
    존재하지만, 새 코드는 실제로 필요한 집중된 헬퍼 표면을 import해야
    합니다.

    | 필요 항목 | import |
    | --- | --- |
    | 시스템 이벤트 큐 헬퍼 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 깨우기, 이벤트 및 가시성 헬퍼 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 보류 중인 전달 큐 드레인 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 채널 활동 원격 측정 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 메모리 내 중복 제거 캐시 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 안전한 로컬 파일/미디어 경로 헬퍼 | `openclaw/plugin-sdk/file-access-runtime` |
    | 디스패처 인식 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 프록시 및 보호된 fetch 헬퍼 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 디스패처 정책 타입 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 승인 요청/해결 타입 | `openclaw/plugin-sdk/approval-runtime` |
    | 승인 답장 페이로드 및 명령 헬퍼 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 오류 형식 지정 헬퍼 | `openclaw/plugin-sdk/error-runtime` |
    | 전송 준비 상태 대기 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 보안 토큰 헬퍼 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 제한된 비동기 작업 동시성 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 숫자 강제 변환 | `openclaw/plugin-sdk/number-runtime` |
    | 프로세스 로컬 비동기 잠금 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 파일 잠금 | `openclaw/plugin-sdk/file-lock` |

    번들 Plugin은 스캐너로 `infra-runtime` 사용이 차단되므로, 저장소 코드는
    광범위한 배럴로 되돌아갈 수 없습니다.

  </Step>

  <Step title="채널 라우트 헬퍼 마이그레이션">
    새 채널 라우트 코드는 `openclaw/plugin-sdk/channel-route`를 사용해야
    합니다. 이전 route-key 및 comparable-target 이름은 마이그레이션 기간
    동안 호환성 별칭으로 유지되지만, 새 Plugin은 동작을 직접 설명하는
    라우트 이름을 사용해야 합니다.

    | 이전 헬퍼 | 최신 헬퍼 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    최신 라우트 헬퍼는 네이티브 승인, 답장 억제, 인바운드 중복 제거,
    Cron 전달 및 세션 라우팅 전반에서 `{ channel, to, accountId, threadId }`를
    일관되게 정규화합니다.

    `ChannelMessagingAdapter.parseExplicitTarget` 또는
    파서 기반 로드된 라우트 헬퍼(`parseExplicitTargetForLoadedChannel`
    또는 `resolveRouteTargetForLoadedChannel`)나
    `plugin-sdk/channel-route`의 `resolveChannelRouteTargetWithParser(...)`를
    새로 사용하지 마세요. 이러한 훅은 더 이상 권장되지 않으며, 마이그레이션
    기간 동안 이전 Plugin을 위해서만 유지됩니다. 새 채널 Plugin은 대상 ID
    정규화 및 디렉터리 누락 fallback에는
    `messaging.targetResolver.resolveTarget(...)`를, 코어에 이른 피어 종류가
    필요할 때는 `messaging.inferTargetChatType(...)`를, 제공자 네이티브 세션
    및 스레드 ID에는 `messaging.resolveOutboundSessionRoute(...)`를 사용해야
    합니다.

  </Step>

  <Step title="빌드 및 테스트">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## import 경로 참조

  <Accordion title="일반 가져오기 경로 표">
  | 가져오기 경로 | 목적 | 주요 내보내기 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 표준 Plugin 진입점 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 진입점 정의/빌더를 위한 레거시 통합 재내보내기 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 설정 스키마 내보내기 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 공급자 진입점 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 채널 진입점 정의와 빌더에 집중한 모듈 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공유 설정 마법사 헬퍼 | 설정 번역기, 허용 목록 프롬프트, 설정 상태 빌더 |
  | `plugin-sdk/setup-runtime` | 설정 시점 런타임 헬퍼 | `createSetupTranslator`, 가져오기 안전 설정 패치 어댑터, 조회 노트 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정 프록시 |
  | `plugin-sdk/setup-adapter-runtime` | 더 이상 권장되지 않는 설정 어댑터 별칭 | `plugin-sdk/setup-runtime` 사용 |
  | `plugin-sdk/setup-tools` | 설정 도구 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 목록/설정/작업 게이트 헬퍼 |
  | `plugin-sdk/account-id` | 계정 ID 헬퍼 | `DEFAULT_ACCOUNT_ID`, 계정 ID 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 + 기본 폴백 헬퍼 |
  | `plugin-sdk/account-helpers` | 좁은 범위의 계정 헬퍼 | 계정 목록/계정 작업 헬퍼 |
  | `plugin-sdk/channel-setup` | 설정 마법사 어댑터 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 페어링 기본 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 답장 접두사, 입력 상태, 소스 전달 배선 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 설정 어댑터 팩터리와 DM 접근 헬퍼 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 설정 스키마 빌더 | 공유 채널 설정 스키마 기본 요소와 일반 빌더만 |
  | `plugin-sdk/bundled-channel-config-schema` | 번들 설정 스키마 | OpenClaw가 유지 관리하는 번들 Plugin 전용; 새 Plugin은 Plugin 로컬 스키마를 정의해야 함 |
  | `plugin-sdk/channel-config-schema-legacy` | 더 이상 권장되지 않는 번들 설정 스키마 | 호환성 별칭 전용; 유지 관리되는 번들 Plugin에는 `plugin-sdk/bundled-channel-config-schema` 사용 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 설정 헬퍼 | 명령 이름 정규화, 설명 다듬기, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 더 이상 권장되지 않는 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/inbound-envelope` | 인바운드 봉투 헬퍼 | 공유 라우트 + 봉투 빌더 헬퍼 |
  | `plugin-sdk/channel-inbound` | 인바운드 수신 헬퍼 | 컨텍스트 구성, 서식 지정, 루트, 실행기, 준비된 답장 발송, 발송 조건자 |
  | `plugin-sdk/messaging-targets` | 더 이상 권장되지 않는 대상 파싱 가져오기 경로 | 일반 대상 파싱 헬퍼에는 `plugin-sdk/channel-targets`, 라우트 비교에는 `plugin-sdk/channel-route`, 공급자별 대상 해석에는 Plugin 소유 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` 사용 |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 헬퍼 | 공유 아웃바운드 미디어 로딩 |
  | `plugin-sdk/outbound-send-deps` | 더 이상 권장되지 않는 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/channel-outbound` | 아웃바운드 메시지 수명 주기 헬퍼 | 메시지 어댑터, 수신 확인, 내구성 있는 전송 헬퍼, 실시간 미리보기/스트리밍 헬퍼, 답장 옵션, 수명 주기 헬퍼, 아웃바운드 ID, 페이로드 계획 |
  | `plugin-sdk/channel-streaming` | 더 이상 권장되지 않는 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/outbound-runtime` | 더 이상 권장되지 않는 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 헬퍼 | 스레드 바인딩 수명 주기와 어댑터 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 페이로드 헬퍼 | 레거시 필드 레이아웃용 에이전트 미디어 페이로드 빌더 |
  | `plugin-sdk/channel-runtime` | 더 이상 권장되지 않는 호환성 shim | 레거시 채널 런타임 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 답장 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 Plugin 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 넓은 범위의 런타임 헬퍼 | 런타임/로깅/백업/Plugin 설치 헬퍼 |
  | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 env 헬퍼 | 로거/런타임 env, 타임아웃, 재시도, 백오프 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공유 Plugin 런타임 헬퍼 | Plugin 명령/훅/http/인터랙티브 헬퍼 |
  | `plugin-sdk/hook-runtime` | 훅 파이프라인 헬퍼 | 공유 Webhook/내부 훅 파이프라인 헬퍼 |
  | `plugin-sdk/lazy-runtime` | 지연 런타임 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공유 실행 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI 런타임 헬퍼 | 명령 서식 지정, 대기, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway 클라이언트, 이벤트 루프 준비 시작 헬퍼, 채널 상태 패치 헬퍼 |
  | `plugin-sdk/config-runtime` | 더 이상 권장되지 않는 설정 호환성 shim | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` 권장 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때 폴백이 안정적인 Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 헬퍼 | 실행/Plugin 승인 페이로드, 승인 기능/프로필 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼, 구조화된 승인 표시 경로 서식 지정 |
  | `plugin-sdk/approval-auth-runtime` | 승인 인증 헬퍼 | 승인자 해석, 동일 채팅 작업 인증 |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 헬퍼 | 네이티브 실행 승인 프로필/필터 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 헬퍼 | 네이티브 승인 기능/전달 어댑터 |
  | `plugin-sdk/approval-gateway-runtime` | 승인 Gateway 헬퍼 | 공유 승인 Gateway 해석 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 어댑터 헬퍼 | 핫 채널 진입점을 위한 경량 네이티브 승인 어댑터 로딩 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | 승인 핸들러 헬퍼 | 더 넓은 승인 핸들러 런타임 헬퍼; 더 좁은 어댑터/Gateway 이음부로 충분하면 이를 권장 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 헬퍼 | 네이티브 승인 대상/계정 바인딩 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | 승인 답장 헬퍼 | 실행/Plugin 승인 답장 페이로드 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 런타임 컨텍스트 헬퍼 | 일반 채널 런타임 컨텍스트 등록/가져오기/감시 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공유 신뢰, DM 게이팅, 루트 제한 파일/경로 헬퍼, 외부 콘텐츠, 비밀 수집 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 허용 목록과 사설 네트워크 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF 런타임 헬퍼 | 고정 디스패처, 보호된 fetch, SSRF 정책 헬퍼 |
  | `plugin-sdk/system-event-runtime` | 시스템 이벤트 헬퍼 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 헬퍼 | Heartbeat 깨우기, 이벤트, 가시성 헬퍼 |
  | `plugin-sdk/delivery-queue-runtime` | 전달 큐 헬퍼 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 채널 활동 헬퍼 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 중복 제거 헬퍼 | 메모리 내 중복 제거 캐시 |
  | `plugin-sdk/file-access-runtime` | 파일 접근 헬퍼 | 안전한 로컬 파일/미디어 경로 헬퍼 |
  | `plugin-sdk/transport-ready-runtime` | 전송 준비 상태 헬퍼 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | 실행 승인 정책 헬퍼 | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 제한된 캐시 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 게이팅 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 서식 지정 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, 오류 그래프 헬퍼 |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/프록시 헬퍼 | `resolveFetch`, 프록시 헬퍼, EnvHttpProxyAgent 옵션 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 재시도 헬퍼 | `RetryConfig`, `retryAsync`, 정책 실행기 |
  | `plugin-sdk/allow-from` | 허용 목록 서식 지정과 입력 매핑 | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅과 명령 표면 헬퍼 | `resolveControlCommandGate`, 보낸 사람 권한 부여 헬퍼, 동적 인수 메뉴 서식 지정을 포함한 명령 레지스트리 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/도움말 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 비밀 입력 파싱 | 비밀 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 가드 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공유 답장 런타임 | 인바운드 발송, Heartbeat, 답장 플래너, 청킹 |
  | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 답장 발송 헬퍼 | 마무리, 공급자 발송, 대화 라벨 헬퍼 |
  | `plugin-sdk/reply-history` | 답장 기록 헬퍼 | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 더 이상 권장되지 않는 맵 헬퍼 호환성 내보내기 |
  | `plugin-sdk/reply-reference` | 답장 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 답장 청크 헬퍼 | 텍스트/Markdown 청킹 헬퍼 |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 헬퍼 | 저장소 경로 + 업데이트 시간 헬퍼 |
  | `plugin-sdk/state-paths` | 상태 경로 헬퍼 | 상태 및 OAuth 디렉터리 헬퍼 |
  | `plugin-sdk/routing` | 라우팅/세션 키 도우미 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 도우미 |
  | `plugin-sdk/status-helpers` | 채널 상태 도우미 | 채널/계정 상태 요약 빌더, 런타임 상태 기본값, 이슈 메타데이터 도우미 |
  | `plugin-sdk/target-resolver-runtime` | 대상 해석기 도우미 | 공유 대상 해석기 도우미 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 도우미 | 슬러그/문자열 정규화 도우미 |
  | `plugin-sdk/request-url` | 요청 URL 도우미 | 요청과 유사한 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 도우미 | 정규화된 stdout/stderr를 제공하는 시간 제한 명령 실행기 |
  | `plugin-sdk/param-readers` | 매개변수 리더 | 공통 도구/CLI 매개변수 리더 |
  | `plugin-sdk/tool-payload` | 도구 페이로드 추출 | 도구 결과 객체에서 정규화된 페이로드 추출 |
  | `plugin-sdk/tool-send` | 도구 전송 추출 | 도구 인수에서 표준 전송 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 도우미 | 공유 임시 다운로드 경로 도우미 |
  | `plugin-sdk/logging-core` | 로깅 도우미 | 하위 시스템 로거 및 비식별화 도우미 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 표 도우미 | Markdown 표 모드 도우미 |
  | `plugin-sdk/reply-payload` | 메시지 답장 타입 | 답장 페이로드 타입 |
  | `plugin-sdk/provider-setup` | 선별된 로컬/자체 호스팅 공급자 설정 도우미 | 자체 호스팅 공급자 검색/구성 도우미 |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 자체 호스팅 공급자 설정 전용 도우미 | 동일한 자체 호스팅 공급자 검색/구성 도우미 |
  | `plugin-sdk/provider-auth-runtime` | 공급자 런타임 인증 도우미 | 런타임 API 키 해석 도우미 |
  | `plugin-sdk/provider-auth-api-key` | 공급자 API 키 설정 도우미 | API 키 온보딩/프로필 쓰기 도우미 |
  | `plugin-sdk/provider-auth-result` | 공급자 인증 결과 도우미 | 표준 OAuth 인증 결과 빌더 |
  | `plugin-sdk/provider-selection-runtime` | 공급자 선택 도우미 | 구성된 또는 자동 공급자 선택 및 원시 공급자 구성 병합 |
  | `plugin-sdk/provider-env-vars` | 공급자 환경 변수 도우미 | 공급자 인증 환경 변수 조회 도우미 |
  | `plugin-sdk/provider-model-shared` | 공유 공급자 모델/리플레이 도우미 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 리플레이 정책 빌더, 공급자 엔드포인트 도우미, 모델 ID 정규화 도우미 |
  | `plugin-sdk/provider-catalog-shared` | 공유 공급자 카탈로그 도우미 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 공급자 온보딩 패치 | 온보딩 구성 도우미 |
  | `plugin-sdk/provider-http` | 공급자 HTTP 도우미 | 오디오 전사 멀티파트 양식 도우미를 포함한 일반 공급자 HTTP/엔드포인트 기능 도우미 |
  | `plugin-sdk/provider-web-fetch` | 공급자 웹 가져오기 도우미 | 웹 가져오기 공급자 등록/캐시 도우미 |
  | `plugin-sdk/provider-web-search-config-contract` | 공급자 웹 검색 구성 도우미 | Plugin 활성화 배선이 필요 없는 공급자를 위한 좁은 웹 검색 구성/자격 증명 도우미 |
  | `plugin-sdk/provider-web-search-contract` | 공급자 웹 검색 계약 도우미 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` 및 범위 지정 자격 증명 설정기/가져오기 같은 좁은 웹 검색 구성/자격 증명 계약 도우미 |
  | `plugin-sdk/provider-web-search` | 공급자 웹 검색 도우미 | 웹 검색 공급자 등록/캐시/런타임 도우미 |
  | `plugin-sdk/provider-tools` | 공급자 도구/스키마 호환성 도우미 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` 및 DeepSeek/Gemini/OpenAI 스키마 정리 + 진단 |
  | `plugin-sdk/provider-usage` | 공급자 사용량 도우미 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 및 기타 공급자 사용량 도우미 |
  | `plugin-sdk/provider-stream` | 공급자 스트림 래퍼 도우미 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입 및 공유 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 도우미 |
  | `plugin-sdk/provider-transport-runtime` | 공급자 전송 도우미 | 보호된 fetch, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림 같은 네이티브 공급자 전송 도우미 |
  | `plugin-sdk/keyed-async-queue` | 순서 있는 비동기 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공유 미디어 도우미 | 미디어 가져오기/변환/저장 도우미, ffprobe 기반 비디오 크기 탐색, 미디어 페이로드 빌더 |
  | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 도우미 | 이미지/비디오/음악 생성을 위한 공유 장애 조치 도우미, 후보 선택, 누락 모델 메시지 |
  | `plugin-sdk/media-understanding` | 미디어 이해 도우미 | 미디어 이해 공급자 타입과 공급자 대상 이미지/오디오 도우미 내보내기 |
  | `plugin-sdk/text-runtime` | 사용 중단된 광범위 텍스트 호환성 내보내기 | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, `logging-core` 사용 |
  | `plugin-sdk/text-chunking` | 텍스트 청크 처리 도우미 | 아웃바운드 텍스트 청크 처리 도우미 |
  | `plugin-sdk/speech` | 음성 도우미 | 음성 공급자 타입과 공급자 대상 지시문, 레지스트리, 검증 도우미, OpenAI 호환 TTS 빌더 |
  | `plugin-sdk/speech-core` | 공유 음성 코어 | 음성 공급자 타입, 레지스트리, 지시문, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 도우미 | 공급자 타입, 레지스트리 도우미, 공유 WebSocket 세션 도우미 |
  | `plugin-sdk/realtime-voice` | 실시간 음성 도우미 | 공급자 타입, 레지스트리/해석 도우미, 브리지 세션 도우미, 공유 에이전트 응답 큐, 활성 실행 음성 제어, 대본/이벤트 상태, 에코 억제, 상담 질문 매칭, 강제 상담 조율, 턴 컨텍스트 추적, 출력 활동 추적, 빠른 컨텍스트 상담 도우미 |
  | `plugin-sdk/image-generation` | 이미지 생성 도우미 | 이미지 생성 공급자 타입과 이미지 에셋/데이터 URL 도우미 및 OpenAI 호환 이미지 공급자 빌더 |
  | `plugin-sdk/image-generation-core` | 공유 이미지 생성 코어 | 이미지 생성 타입, 장애 조치, 인증, 레지스트리 도우미 |
  | `plugin-sdk/music-generation` | 음악 생성 도우미 | 음악 생성 공급자/요청/결과 타입 |
  | `plugin-sdk/music-generation-core` | 공유 음악 생성 코어 | 음악 생성 타입, 장애 조치 도우미, 공급자 조회, 모델 참조 파싱 |
  | `plugin-sdk/video-generation` | 비디오 생성 도우미 | 비디오 생성 공급자/요청/결과 타입 |
  | `plugin-sdk/video-generation-core` | 공유 비디오 생성 코어 | 비디오 생성 타입, 장애 조치 도우미, 공급자 조회, 모델 참조 파싱 |
  | `plugin-sdk/interactive-runtime` | 대화형 답장 도우미 | 대화형 답장 페이로드 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | 채널 구성 기본 요소 | 좁은 채널 구성 스키마 기본 요소 |
  | `plugin-sdk/channel-config-writes` | 채널 구성 쓰기 도우미 | 채널 구성 쓰기 권한 부여 도우미 |
  | `plugin-sdk/channel-plugin-common` | 공유 채널 프렐류드 | 공유 채널 Plugin 프렐류드 내보내기 |
  | `plugin-sdk/channel-status` | 채널 상태 도우미 | 공유 채널 상태 스냅샷/요약 도우미 |
  | `plugin-sdk/allowlist-config-edit` | 허용 목록 구성 도우미 | 허용 목록 구성 편집/읽기 도우미 |
  | `plugin-sdk/group-access` | 그룹 접근 도우미 | 공유 그룹 접근 결정 도우미 |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-inbound` 사용 |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM 보호 도우미 | 좁은 사전 암호화 보호 정책 도우미 |
  | `plugin-sdk/extension-shared` | 공유 확장 도우미 | 수동 채널/상태 및 주변 프록시 도우미 기본 요소 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 도우미 | Webhook 대상 레지스트리 및 라우트 설치 도우미 |
  | `plugin-sdk/webhook-path` | 사용 중단된 Webhook 경로 별칭 | `plugin-sdk/webhook-ingress` 사용 |
  | `plugin-sdk/web-media` | 공유 웹 미디어 도우미 | 원격/로컬 미디어 로딩 도우미 |
  | `plugin-sdk/zod` | 사용 중단된 Zod 호환성 재내보내기 | `zod`에서 `zod`를 직접 가져오기 |
  | `plugin-sdk/memory-core` | 번들 메모리 코어 도우미 | 메모리 관리자/구성/파일/CLI 도우미 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 런타임 파사드 | 메모리 인덱스/검색 런타임 파사드 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 메모리 임베딩 레지스트리 | 경량 메모리 임베딩 공급자 레지스트리 도우미 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 기반 엔진 | 메모리 호스트 기반 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, 레지스트리 접근, 로컬 공급자, 일반 배치/원격 도우미. 구체적인 원격 공급자는 해당 소유 Plugin에 있음 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 스토리지 엔진 | 메모리 호스트 스토리지 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 도우미 | 메모리 호스트 멀티모달 도우미 |
  | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 도우미 | 메모리 호스트 쿼리 도우미 |
  | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 시크릿 도우미 | 메모리 호스트 시크릿 도우미 |
  | `plugin-sdk/memory-core-host-events` | 사용 중단된 메모리 이벤트 별칭 | `plugin-sdk/memory-host-events` 사용 |
  | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 도우미 | 메모리 호스트 상태 도우미 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 | 메모리 호스트 CLI 런타임 도우미 |
  | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 | 메모리 호스트 코어 런타임 도우미 |
  | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 도우미 | 메모리 호스트 파일/런타임 도우미 |
  | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 별칭 | 공급업체 중립적인 메모리 호스트 코어 런타임 도우미 별칭 |
  | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 공급업체 중립적인 메모리 호스트 이벤트 저널 도우미 별칭 |
  | `plugin-sdk/memory-host-files` | 사용 중단된 메모리 파일/런타임 별칭 | `plugin-sdk/memory-core-host-runtime-files` 사용 |
  | `plugin-sdk/memory-host-markdown` | 관리형 Markdown 도우미 | 메모리 인접 Plugin을 위한 공유 관리형 Markdown 도우미 |
  | `plugin-sdk/memory-host-search` | Active Memory 검색 파사드 | 지연 로드 Active Memory 검색 관리자 런타임 파사드 |
  | `plugin-sdk/memory-host-status` | 사용 중단된 메모리 호스트 상태 별칭 | `plugin-sdk/memory-core-host-status` 사용 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 저장소 로컬의 사용 중단된 호환성 배럴. `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures` 같은 집중된 저장소 로컬 테스트 하위 경로 사용 |
</Accordion>

  이 표는 의도적으로 전체 SDK 인터페이스 범위가 아니라 공통 마이그레이션 하위 집합입니다. 컴파일러 진입점 인벤토리는
  `scripts/lib/plugin-sdk-entrypoints.json`에 있으며, 패키지 export는 공개 하위 집합에서 생성됩니다.

  예약된 번들 Plugin 헬퍼 접점은, 게시된 `@openclaw/discord@2026.3.13` 패키지를 위해 유지되는 사용 중단된 `plugin-sdk/discord` shim처럼 명시적으로 문서화된 호환성 facade를 제외하고, 공개 SDK export map에서 제거되었습니다. 소유자별 헬퍼는 해당 소유 Plugin 패키지 내부에 있습니다. 공유 호스트 동작은 `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 계약을 통해 이동해야 합니다.

  작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면 `src/plugin-sdk/`의 소스를 확인하거나, 어떤 일반 계약이 이를 소유해야 하는지 maintainer에게 문의하세요.

  ## 활성 사용 중단

  Plugin SDK, provider 계약, runtime 인터페이스 범위, manifest 전반에 적용되는 더 좁은 사용 중단 항목입니다. 각 항목은 오늘도 계속 작동하지만 향후 major release에서 제거됩니다. 각 항목 아래의 항목은 이전 API를 표준 대체 항목에 매핑합니다.

  <AccordionGroup>
  <Accordion title="command-auth 도움말 빌더 → command-status">
    **이전 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **신규 (`openclaw/plugin-sdk/command-status`)**: 동일한 시그니처, 동일한
    export이며 더 좁은 하위 경로에서 import하기만 하면 됩니다. `command-auth`는
    호환성 stub으로 이를 다시 export합니다.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="멘션 gating 헬퍼 → resolveInboundMentionDecision">
    **이전**: `openclaw/plugin-sdk/channel-inbound` 또는
    `openclaw/plugin-sdk/channel-mention-gating`의
    `resolveInboundMentionRequirement({ facts, policy })` 및
    `shouldDropInboundForMention(...)`.

    **신규**: `resolveInboundMentionDecision({ facts, policy })` - 두 개로 나뉜 호출 대신
    단일 결정 객체를 반환합니다.

    downstream channel Plugin들(Slack, Discord, Matrix, MS Teams)은 이미
    전환되었습니다.

  </Accordion>

  <Accordion title="Channel runtime shim 및 channel actions 헬퍼">
    `openclaw/plugin-sdk/channel-runtime`은 이전 channel Plugin을 위한 호환성 shim입니다.
    새 코드에서는 import하지 마세요. runtime 객체 등록에는
    `openclaw/plugin-sdk/channel-runtime-context`를 사용하세요.

    `openclaw/plugin-sdk/channel-actions`의 `channelActions*` 헬퍼는
    원시 "actions" channel export와 함께 사용 중단되었습니다. 대신 의미 기반
    `presentation` 인터페이스 범위를 통해 기능을 노출하세요. channel Plugin은 허용하는
    원시 action 이름이 아니라 렌더링하는 대상(cards, buttons, selects)을 선언합니다.

  </Accordion>

  <Accordion title="웹 검색 provider tool() 헬퍼 → Plugin의 createTool()">
    **이전**: `openclaw/plugin-sdk/provider-web-search`의 `tool()` factory.

    **신규**: provider Plugin에 `createTool(...)`을 직접 구현하세요.
    OpenClaw는 더 이상 tool wrapper 등록에 SDK 헬퍼가 필요하지 않습니다.

  </Accordion>

  <Accordion title="Plaintext channel envelope → BodyForAgent">
    **이전**: inbound channel message에서 평면 plaintext prompt envelope를 빌드하기 위한
    `formatInboundEnvelope(...)` 및 `ChannelMessageForAgent.channelEnvelope`.

    **신규**: `BodyForAgent`와 구조화된 user-context block. Channel Plugin은
    routing metadata(thread, topic, reply-to, reactions)를 prompt 문자열로 이어 붙이는 대신
    typed field로 첨부합니다. `formatAgentEnvelope(...)` 헬퍼는 합성된 assistant-facing
    envelope에 대해 계속 지원되지만, inbound plaintext envelope는 단계적으로 제거되고 있습니다.

    영향 영역: `inbound_claim`, `message_received`, 그리고 `channelEnvelope` 텍스트를
    후처리한 모든 custom channel Plugin.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **이전**: `api.on("deactivate", handler)`.

    **신규**: `api.on("gateway_stop", handler)`. event와 context는 동일한 종료 cleanup
    계약이며, hook 이름만 변경됩니다.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate`는 2026-08-16 이후까지 사용 중단된 호환성 alias로 계속 연결됩니다.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **이전**: `threadBindingReady` 또는 `deliveryOrigin`을 반환하는
    `api.on("subagent_spawning", handler)`.

    **신규**: core가 channel session-binding adapter를 통해 `thread: true` subagent binding을
    준비하게 하세요. launch 이후 관찰에는 `api.on("subagent_spawned", handler)`만 사용하세요.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult`, 그리고
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)`은 external Plugin이
    마이그레이션하는 동안에만 사용 중단된 호환성 인터페이스 범위로 남습니다.

  </Accordion>

  <Accordion title="Provider discovery type → provider catalog type">
    네 가지 discovery type alias는 이제 catalog 시대 type 위의 얇은 wrapper입니다.

    | 이전 alias                | 신규 type                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    또한 legacy `ProviderCapabilities` static bag도 해당됩니다. provider Plugin은 static object 대신
    `buildReplayPolicy`, `normalizeToolSchemas`, `wrapStreamFn` 같은 명시적 provider hook을
    사용해야 합니다.

  </Accordion>

  <Accordion title="Thinking 정책 훅 → resolveThinkingProfile">
    **이전** (`ProviderThinkingPolicy`의 세 개별 훅):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` 및
    `resolveDefaultThinkingLevel(ctx)`.

    **새 방식**: 표준 `id`, 선택적 `label`, 순위가 지정된 레벨 목록을 포함하는
    `ProviderThinkingProfile`을 반환하는 단일 `resolveThinkingProfile(ctx)`.
    OpenClaw는 프로필 순위에 따라 오래된 저장 값을 자동으로 다운그레이드합니다.

    컨텍스트에는 `provider`, `modelId`, 선택적으로 병합된 `reasoning`,
    그리고 선택적으로 병합된 모델 `compat` 사실이 포함됩니다. Provider plugins는
    구성된 요청 계약이 이를 지원할 때만 이러한 카탈로그 사실을 사용해 모델별
    프로필을 노출할 수 있습니다.

    세 개 대신 하나의 훅을 구현하세요. 레거시 훅은 지원 중단 기간 동안 계속
    작동하지만 프로필 결과와 조합되지는 않습니다.

  </Accordion>

  <Accordion title="외부 인증 Provider → contracts.externalAuthProviders">
    **이전**: Plugin 매니페스트에 provider를 선언하지 않고 외부 인증 훅을 구현.

    **새 방식**: Plugin 매니페스트에 `contracts.externalAuthProviders`를 선언하고
    **또한** `resolveExternalAuthProfiles(...)`를 구현하세요.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider 환경 변수 조회 → setup.providers[].envVars">
    **이전** 매니페스트 필드: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **새 방식**: 동일한 환경 변수 조회를 매니페스트의 `setup.providers[].envVars`에
    미러링하세요. 이렇게 하면 설정/상태 환경 메타데이터가 한곳으로 통합되며
    환경 변수 조회에 답하기 위해 Plugin 런타임을 부팅하지 않아도 됩니다.

    `providerAuthEnvVars`는 지원 중단 기간이 끝날 때까지 호환성 어댑터를 통해
    계속 지원됩니다.

  </Accordion>

  <Accordion title="메모리 Plugin 등록 → registerMemoryCapability">
    **이전**: 세 개의 개별 호출 -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **새 방식**: 메모리 상태 API에서 한 번 호출 -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    동일한 슬롯, 단일 등록 호출입니다. 추가형 프롬프트 및 말뭉치 헬퍼
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)는
    영향을 받지 않습니다.

  </Accordion>

  <Accordion title="메모리 임베딩 Provider API">
    **이전**: `api.registerMemoryEmbeddingProvider(...)` 및
    `contracts.memoryEmbeddingProviders`.

    **새 방식**: `api.registerEmbeddingProvider(...)` 및
    `contracts.embeddingProviders`.

    일반 임베딩 provider 계약은 메모리 외부에서도 재사용할 수 있으며 새 provider에
    대해 지원되는 경로입니다. 메모리 전용 등록 API는 기존 provider가 마이그레이션하는
    동안 더 이상 권장되지 않는 호환성으로 계속 연결됩니다. Plugin 검사에서는
    번들에 포함되지 않은 사용을 호환성 부채로 보고합니다.

  </Accordion>

  <Accordion title="서브에이전트 세션 메시지 타입 이름 변경">
    `src/plugins/runtime/types.ts`에서 계속 내보내는 두 레거시 타입 별칭:

    | 이전                           | 새 방식                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    런타임 메서드 `readSession`은 `getSessionMessages`로 대체되어 더 이상 권장되지 않습니다.
    동일한 시그니처이며, 이전 메서드는 새 메서드를 호출합니다.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **이전**: `runtime.tasks.flow`(단수)는 라이브 task-flow 접근자를 반환했습니다.

    **새 방식**: `runtime.tasks.managedFlows`는 흐름에서 하위 작업을 생성, 업데이트,
    취소 또는 실행하는 Plugin을 위해 관리형 TaskFlow 변경 런타임을 유지합니다.
    Plugin에 DTO 기반 읽기만 필요한 경우 `runtime.tasks.flows`를 사용하세요.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="임베디드 확장 팩토리 → 에이전트 도구 결과 미들웨어">
    위의 "마이그레이션 방법 → 임베디드 도구 결과 확장을 미들웨어로 마이그레이션"에서
    다룹니다. 완전성을 위해 여기에 포함합니다. 제거된 임베디드 러너 전용
    `api.registerEmbeddedExtensionFactory(...)` 경로는
    `contracts.agentToolResultMiddleware`의 명시적 런타임 목록과 함께
    `api.registerAgentToolResultMiddleware(...)`로 대체됩니다.
  </Accordion>

  <Accordion title="OpenClawSchemaType 별칭 → OpenClawConfig">
    `openclaw/plugin-sdk`에서 다시 내보내는 `OpenClawSchemaType`은 이제
    `OpenClawConfig`에 대한 한 줄짜리 별칭입니다. 표준 이름을 선호하세요.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 아래의 번들 채널/provider plugins 내부 확장 수준 지원 중단 사항은
각자의 `api.ts` 및 `runtime-api.ts` 배럴 안에서 추적됩니다. 이는 타사 Plugin
계약에 영향을 주지 않으며 여기에 나열되지 않습니다. 번들 Plugin의 로컬 배럴을
직접 사용하는 경우, 업그레이드하기 전에 해당 배럴의 지원 중단 주석을 읽으세요.
</Note>

## 제거 일정

| 시점                   | 발생하는 일                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **지금**                | 지원 중단 예정인 표면에서 런타임 경고가 발생합니다                               |
| **다음 메이저 릴리스** | 지원 중단 예정인 표면이 제거됩니다. 아직 이를 사용하는 Plugin은 실패합니다 |

모든 핵심 Plugin은 이미 마이그레이션되었습니다. 외부 Plugin은
다음 메이저 릴리스 전에 마이그레이션해야 합니다.

## 경고를 일시적으로 억제하기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요.

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이는 임시 탈출구일 뿐, 영구적인 해결책이 아닙니다.

## 관련 항목

- [시작하기](/ko/plugins/building-plugins) - 첫 번째 Plugin 빌드
- [SDK 개요](/ko/plugins/sdk-overview) - 전체 하위 경로 가져오기 참조
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) - 채널 Plugin 빌드
- [Provider Plugin](/ko/plugins/sdk-provider-plugins) - Provider Plugin 빌드
- [Plugin 내부 구조](/ko/plugins/architecture) - 아키텍처 심층 분석
- [Plugin Manifest](/ko/plugins/manifest) - Manifest 스키마 참조
