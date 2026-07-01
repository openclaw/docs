---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 경고가 표시됩니다
    - OPENCLAW_EXTENSION_API_DEPRECATED 경고가 표시됩니다
    - OpenClaw 2026.4.25 이전에 api.registerEmbeddedExtensionFactory를 사용했습니다
    - Plugin을 최신 Plugin 아키텍처로 업데이트하고 있습니다
    - 외부 OpenClaw Plugin을 유지 관리합니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 Plugin SDK로 마이그레이션
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-07-01T07:56:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw는 광범위한 하위 호환성 계층에서, 범위가 명확하고 문서화된 import를 사용하는 현대적인 Plugin 아키텍처로 이동했습니다. 새 아키텍처 이전에 Plugin을 만들었다면, 이 가이드가 마이그레이션을 도와줍니다.

## 변경 사항

기존 Plugin 시스템은 Plugin이 단일 진입점에서 필요한 모든 것을 import할 수 있도록 두 가지 매우 개방적인 표면을 제공했습니다.

- **`openclaw/plugin-sdk/compat`** - 수십 개의 헬퍼를 다시 export하던 단일 import입니다. 새 Plugin 아키텍처를 구축하는 동안 기존 hook 기반 Plugin이 계속 동작하도록 도입되었습니다.
- **`openclaw/plugin-sdk/infra-runtime`** - 시스템 이벤트, Heartbeat 상태, 전달 큐, fetch/proxy 헬퍼, 파일 헬퍼, 승인 타입, 관련 없는 유틸리티를 섞어 둔 광범위한 런타임 헬퍼 배럴입니다.
- **`openclaw/plugin-sdk/config-runtime`** - 마이그레이션 기간 동안 더 이상 권장되지 않는 직접 load/write 헬퍼를 여전히 포함하는 광범위한 구성 호환성 배럴입니다.
- **`openclaw/extension-api`** - 내장 에이전트 실행기 같은 호스트 측 헬퍼에 Plugin이 직접 접근할 수 있게 해 주던 브리지입니다.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` 같은 내장 실행기 이벤트를 관찰할 수 있었던, 제거된 내장 실행기 전용 번들 확장 hook입니다.

광범위한 import 표면은 이제 **더 이상 권장되지 않습니다**. 런타임에서는 여전히 동작하지만, 새 Plugin은 이를 사용하면 안 되며, 기존 Plugin은 다음 메이저 릴리스에서 제거되기 전에 마이그레이션해야 합니다. 내장 실행기 전용 확장 팩터리 등록 API는 제거되었습니다. 대신 도구 결과 미들웨어를 사용하세요.

OpenClaw는 대체 기능을 도입하는 동일한 변경에서 문서화된 Plugin 동작을 제거하거나 재해석하지 않습니다. 호환성을 깨는 계약 변경은 먼저 호환성 어댑터, 진단, 문서, 사용 중단 기간을 거쳐야 합니다. 이는 SDK import, manifest 필드, 설정 API, hook, 런타임 등록 동작에 적용됩니다.

<Warning>
  하위 호환성 계층은 향후 메이저 릴리스에서 제거됩니다.
  이 표면에서 계속 import하는 Plugin은 그때 동작하지 않습니다.
  기존 내장 확장 팩터리 등록은 이미 더 이상 로드되지 않습니다.
</Warning>

## 변경 이유

기존 접근 방식에는 문제가 있었습니다.

- **느린 시작** - 하나의 헬퍼를 import하면 관련 없는 모듈 수십 개가 로드됨
- **순환 의존성** - 광범위한 re-export 때문에 import cycle이 쉽게 생김
- **불명확한 API 표면** - 어떤 export가 안정적인지 내부용인지 알 방법이 없음

현대적인 Plugin SDK는 이를 해결합니다. 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는 명확한 목적과 문서화된 계약을 가진 작고 독립적인 모듈입니다.

번들 채널을 위한 기존 공급자 편의 연결부도 제거되었습니다. 채널 브랜드가 붙은 헬퍼 연결부는 비공개 모노레포 단축 경로였고, 안정적인 Plugin 계약이 아니었습니다. 대신 좁고 범용적인 SDK 하위 경로를 사용하세요. 번들 Plugin 작업 공간 안에서는 공급자가 소유한 헬퍼를 해당 Plugin의 자체 `api.ts` 또는 `runtime-api.ts`에 유지하세요.

현재 번들 공급자 예시는 다음과 같습니다.

- Anthropic은 Claude 전용 스트림 헬퍼를 자체 `api.ts` / `contract-api.ts` 연결부에 유지합니다.
- OpenAI는 공급자 빌더, 기본 모델 헬퍼, 실시간 공급자 빌더를 자체 `api.ts`에 유지합니다.
- OpenRouter는 공급자 빌더와 온보딩/구성 헬퍼를 자체 `api.ts`에 유지합니다.

## Talk 및 실시간 음성 마이그레이션 계획

실시간 음성, 전화, 회의, 브라우저 Talk 코드는 표면별 턴 기록 관리에서 `openclaw/plugin-sdk/realtime-voice`가 export하는 공유 Talk 세션 컨트롤러로 이동하고 있습니다. 새 컨트롤러는 공통 Talk 이벤트 엔벨로프, 활성 턴 상태, 캡처 상태, 출력 오디오 상태, 최근 이벤트 기록, 오래된 턴 거부를 소유합니다. 공급자 Plugin은 벤더별 실시간 세션을 계속 소유해야 하며, 표면 Plugin은 캡처, 재생, 전화, 회의의 특이 사항을 계속 소유해야 합니다.

이 Talk 마이그레이션은 의도적으로 깔끔하게 깨지는 방식입니다.

1. 공유 컨트롤러/런타임 프리미티브를 `plugin-sdk/realtime-voice`에 유지합니다.
2. 번들 표면을 공유 컨트롤러로 이동합니다: 브라우저 릴레이, 관리형 룸 핸드오프, 음성 통화 실시간, 음성 통화 스트리밍 STT, Google Meet 실시간, 네이티브 푸시 투 토크.
3. 기존 Talk RPC 계열을 최종 `talk.session.*` 및 `talk.client.*` API로 교체합니다.
4. Gateway `hello-ok.features.events`에 하나의 라이브 Talk 이벤트 채널을 광고합니다: `talk.event`.
5. 기존 실시간 HTTP 엔드포인트와 요청 시점 instruction override 경로를 모두 삭제합니다.

저수준 어댑터나 테스트 fixture를 구현하는 경우가 아니라면 새 코드는 `createTalkEventSequencer(...)`를 직접 호출하지 않아야 합니다. 공유 컨트롤러를 선호하세요. 그러면 턴 id 없이 턴 범위 이벤트가 emit될 수 없고, 오래된 `turnEnd` / `turnCancel` 호출이 더 새로운 활성 턴을 지울 수 없으며, 출력 오디오 수명주기 이벤트가 전화, 회의, 브라우저 릴레이, 관리형 룸 핸드오프, 네이티브 Talk 클라이언트 전반에서 일관되게 유지됩니다.

목표 공개 API 형태는 다음과 같습니다.

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

브라우저가 소유하는 WebRTC/공급자 WebSocket 세션은 `talk.client.create`를 사용합니다. 브라우저가 공급자 협상과 미디어 전송을 소유하고, Gateway가 자격 증명, instruction, 도구 정책을 소유하기 때문입니다. `talk.session.*`는 gateway-relay 실시간, gateway-relay transcription, 관리형 룸 네이티브 STT/TTS 세션을 위한 공통 Gateway 관리 표면입니다.

실시간 선택기를 `talk.provider` / `talk.providers` 옆에 배치한 기존 구성은 `openclaw doctor --fix`로 복구해야 합니다. 런타임 Talk는 speech/TTS 공급자 구성을 실시간 공급자 구성으로 재해석하지 않습니다.

지원되는 `talk.session.create` 조합은 의도적으로 작습니다.

| 모드            | 전송 방식       | 브레인          | 소유자             | 참고                                                                                                               |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | 전이중 공급자 오디오가 Gateway를 통해 브리지됩니다. 도구 호출은 agent-consult 도구를 통해 라우팅됩니다.           |
| `transcription` | `gateway-relay` | `none`          | Gateway            | 스트리밍 STT 전용입니다. 호출자는 입력 오디오를 보내고 transcript 이벤트를 받습니다.                               |
| `stt-tts`       | `managed-room`  | `agent-consult` | 네이티브/클라이언트 룸 | 클라이언트가 캡처/재생을 소유하고 Gateway가 턴 상태를 소유하는 푸시 투 토크 및 워키토키 스타일 룸입니다.           |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 네이티브/클라이언트 룸 | 신뢰할 수 있는 자사 표면이 Gateway 도구 작업을 직접 실행하는 관리자 전용 룸 모드입니다.                            |

제거된 메서드 매핑:

| 기존                             | 새 항목                                                  |
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

통합된 제어 어휘도 의도적으로 좁습니다:

  | 메서드                          | 적용 대상                                              | 계약                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 동일한 Gateway 연결이 소유한 provider 세션에 base64 PCM 오디오 청크를 추가합니다.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | managed-room 사용자 턴을 시작합니다.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | stale-turn 검증 후 활성 턴을 종료합니다.                                                                                                                                         |
  | `talk.session.cancelTurn`       | 모든 Gateway 소유 세션                              | 턴에 대한 활성 capture/provider/agent/TTS 작업을 취소합니다.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 사용자 턴을 반드시 종료하지 않고 assistant 오디오 출력을 중지합니다.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | relay가 내보낸 provider 도구 호출을 완료합니다. 중간 출력에는 `options.willContinue`를 전달하고, 다른 assistant 응답 없이 호출을 충족하려면 `options.suppressResponse`를 전달합니다. |
  | `talk.session.steer`            | agent 기반 Talk 세션                              | Talk 세션에서 해석된 활성 embedded run에 음성 `status`, `steer`, `cancel` 또는 `followup` 제어를 보냅니다.                                                                |
  | `talk.session.close`            | 모든 통합 세션                                    | relay 세션을 중지하거나 managed-room 상태를 회수한 다음, 통합 세션 ID를 잊습니다.                                                                                                    |

  이 작업을 위해 core에 provider 또는 플랫폼 특수 사례를 도입하지 마세요.
  core는 Talk 세션 의미 체계를 소유합니다. Provider Plugin은 vendor 세션 설정을 소유합니다.
  음성 통화와 Google Meet은 telephony/meeting adapter를 소유합니다. 브라우저와 네이티브
  앱은 device capture/playback UX를 소유합니다.

  ## 호환성 정책

  외부 Plugin의 경우 호환성 작업은 다음 순서를 따릅니다.

  1. 새 계약 추가
  2. compatibility adapter를 통해 기존 동작 유지
  3. 기존 경로와 대체 항목을 명명하는 진단 또는 경고 출력
  4. 테스트에서 두 경로 모두 커버
  5. 사용 중단 및 마이그레이션 경로 문서화
  6. 공지된 마이그레이션 기간 이후에만 제거, 보통 메이저 릴리스에서 제거

  Maintainer는 현재 마이그레이션 큐를
  `pnpm plugins:boundary-report`로 감사할 수 있습니다. 간결한 수에는
  `pnpm plugins:boundary-report:summary`를 사용하고, 하나의 Plugin 또는 호환성 owner에는
  `--owner <id>`를 사용하며, CI gate가 기한이 된 호환성 record, cross-owner reserved SDK import,
  또는 사용되지 않는 reserved SDK subpath에서 실패해야 할 때는
  `pnpm plugins:boundary-report:ci`를 사용하세요. 이 보고서는 deprecated
  호환성 record를 제거 날짜별로 그룹화하고, 로컬 코드/문서 참조 수를 세며,
  cross-owner reserved SDK import를 드러내고, private memory-host SDK bridge를 요약하여
  호환성 정리가 임시 검색에 의존하지 않고 명시적으로 유지되게 합니다.
  Reserved SDK subpath에는 추적된 owner 사용이 있어야 하며,
  사용되지 않는 reserved helper export는 public SDK에서 제거해야 합니다.

  manifest field가 여전히 허용된다면, Plugin 작성자는 문서와 진단에서 달리 말할 때까지
  계속 사용할 수 있습니다. 새 코드는 문서화된 대체 항목을 선호해야 하지만,
  기존 Plugin은 일반적인 minor 릴리스 중에 깨지면 안 됩니다.

  ## 마이그레이션 방법

  <Steps>
  <Step title="Migrate runtime config load/write helpers">
    bundled Plugin은
    `api.runtime.config.loadConfig()`와
    `api.runtime.config.writeConfigFile(...)`를 직접 호출하지 않아야 합니다. 이미
    활성 호출 경로에 전달된 config를 선호하세요. 현재 process snapshot이 필요한
    장기 실행 handler는 `api.runtime.config.current()`를 사용할 수 있습니다. 장기 실행
    agent 도구는 `execute` 내부에서 도구 context의 `ctx.getRuntimeConfig()`를 사용해야
    config write 전에 생성된 도구도 갱신된 runtime config를 볼 수 있습니다.

    Config write는 transactional helper를 통해 수행하고
    after-write 정책을 선택해야 합니다.

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    caller가 변경에 clean gateway restart가 필요하다는 것을 알고 있을 때는
    `afterWrite: { mode: "restart", reason: "..." }`를 사용하고,
    caller가 follow-up을 소유하며 reload planner를 의도적으로 억제하려는 경우에만
    `afterWrite: { mode: "none", reason: "..." }`를 사용하세요.
    Mutation result에는 테스트와 로깅을 위한 typed `followUp` 요약이 포함됩니다.
    gateway는 restart를 적용하거나 예약할 책임을 계속 가집니다.
    `loadConfig`와 `writeConfigFile`은 마이그레이션 기간 동안 외부 Plugin을 위한
    deprecated 호환성 helper로 남아 있으며
    `runtime-config-load-write` 호환성 코드로 한 번 경고합니다. Bundled Plugin과 repo
    runtime 코드는 `pnpm check:deprecated-api-usage`와
    `pnpm check:no-runtime-action-load-config`의 scanner guardrail로 보호됩니다. 새 production Plugin 사용은
    즉시 실패하고, direct config write는 실패하며, gateway server method는 request runtime snapshot을 사용해야 하고,
    runtime channel send/action/client helper는 boundary에서 config를 받아야 하며,
    장기 실행 runtime module에는 허용된 ambient `loadConfig()` 호출이 0개입니다.

    새 Plugin 코드도 broad
    `openclaw/plugin-sdk/config-runtime` 호환성 barrel import를 피해야 합니다. 작업에 맞는 narrow
    SDK subpath를 사용하세요.

    | 필요 | Import |
    | --- | --- |
    | `OpenClawConfig` 같은 Config type | `openclaw/plugin-sdk/config-contracts` |
    | 이미 로드된 config assertion 및 plugin-entry config lookup | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 현재 runtime snapshot read | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Config write | `openclaw/plugin-sdk/config-mutation` |
    | Session store helper | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown table config | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Group policy runtime helper | `openclaw/plugin-sdk/runtime-group-policy` |
    | Secret input resolution | `openclaw/plugin-sdk/secret-input-runtime` |
    | Model/session override | `openclaw/plugin-sdk/model-session-runtime` |

    Bundled Plugin과 해당 테스트는 broad barrel에 대해 scanner로 보호되어
    import와 mock이 필요한 동작에 로컬로 유지됩니다. broad barrel은 외부 호환성을 위해
    여전히 존재하지만, 새 코드는 이에 의존하지 않아야 합니다.

  </Step>

  <Step title="Migrate embedded tool-result extensions to middleware">
    Bundled Plugin은 embedded-runner 전용
    `api.registerEmbeddedExtensionFactory(...)` tool-result handler를
    runtime-neutral middleware로 교체해야 합니다.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    동시에 Plugin manifest를 업데이트하세요.

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    설치된 Plugin도 명시적으로 활성화되어 있고
    `contracts.agentToolResultMiddleware`에 대상 runtime을 모두 선언한 경우
    tool-result middleware를 등록할 수 있습니다. 선언되지 않은 설치된 middleware
    등록은 거부됩니다.

  </Step>

  <Step title="Migrate approval-native handlers to capability facts">
    Approval-capable channel Plugin은 이제
    `approvalCapability.nativeRuntime`과 shared runtime-context registry를 통해 native approval 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`를
      `approvalCapability.nativeRuntime`로 교체
    - approval-specific auth/delivery를 legacy `plugin.auth` /
      `plugin.approvals` wiring에서 `approvalCapability`로 이동
    - `ChannelPlugin.approvals`는 public channel-plugin 계약에서 제거되었습니다.
      delivery/native/render field를 `approvalCapability`로 이동하세요
    - `plugin.auth`는 channel login/logout flow용으로만 남습니다. 여기에 있는 approval auth
      hook은 더 이상 core에서 읽지 않습니다
    - client, token 또는 Bolt app 같은 channel-owned runtime object를
      `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록
    - native approval handler에서 plugin-owned reroute notice를 보내지 마세요.
      core는 이제 실제 delivery result에서 routed-elsewhere notice를 소유합니다
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때는
      실제 `createPluginRuntime().channel` surface를 제공하세요. Partial stub은 거부됩니다.

    현재 approval capability
    layout은 `/plugins/sdk-channel-plugins`를 참조하세요.

  </Step>

  <Step title="Audit Windows wrapper fallback behavior">
    Plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우, 확인되지 않은 Windows
    `.cmd`/`.bat` wrapper는 이제 명시적으로
    `allowShellFallback: true`를 전달하지 않는 한 fail closed됩니다.

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

    caller가 shell fallback에 의도적으로 의존하지 않는다면
    `allowShellFallback`을 설정하지 말고 대신 throw된 error를 처리하세요.

  </Step>

  <Step title="Find deprecated imports">
    Plugin에서 deprecated surface 중 하나로부터의 import를 검색하세요.

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Replace with focused imports">
    기존 surface의 각 export는 특정 modern import path에 매핑됩니다.

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

    host-side helper의 경우 직접 import하는 대신 주입된 Plugin runtime을 사용하세요:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    동일한 패턴이 다른 레거시 브리지 헬퍼에도 적용됩니다.

    | 이전 import | 최신 대응 항목 |
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
    `openclaw/plugin-sdk/infra-runtime`는 외부 호환성을 위해 여전히 존재하지만,
    새 코드는 실제로 필요한 범위가 좁은 헬퍼 표면을 import해야 합니다.

    | 필요 항목 | Import |
    | --- | --- |
    | 시스템 이벤트 큐 헬퍼 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 깨우기, 이벤트, 가시성 헬퍼 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 대기 중인 전달 큐 비우기 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 채널 활동 텔레메트리 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 메모리 내 중복 제거 캐시 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 안전한 로컬 파일/미디어 경로 헬퍼 | `openclaw/plugin-sdk/file-access-runtime` |
    | 디스패처 인식 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 프록시 및 보호된 fetch 헬퍼 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 디스패처 정책 타입 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 승인 요청/해결 타입 | `openclaw/plugin-sdk/approval-runtime` |
    | 승인 응답 페이로드 및 명령 헬퍼 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 오류 형식 지정 헬퍼 | `openclaw/plugin-sdk/error-runtime` |
    | 전송 준비 대기 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 보안 토큰 헬퍼 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 제한된 비동기 작업 동시성 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 숫자 강제 변환 | `openclaw/plugin-sdk/number-runtime` |
    | 프로세스 로컬 비동기 잠금 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 파일 잠금 | `openclaw/plugin-sdk/file-lock` |

    번들 Plugin은 `infra-runtime`에 대해 스캐너로 보호되므로, 저장소 코드는
    넓은 배럴로 회귀할 수 없습니다.

  </Step>

  <Step title="Migrate channel route helpers">
    새 채널 라우트 코드는 `openclaw/plugin-sdk/channel-route`를 사용해야 합니다.
    이전 route-key 및 comparable-target 이름은 마이그레이션 기간 동안 호환성
    별칭으로 남아 있지만, 새 Plugin은 동작을 직접 설명하는 라우트 이름을
    사용해야 합니다.

    | 이전 헬퍼 | 최신 헬퍼 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    최신 라우트 헬퍼는 네이티브 승인, 응답 억제, 인바운드 중복 제거,
    Cron 전달, 세션 라우팅 전반에서 `{ channel, to, accountId, threadId }`를
    일관되게 정규화합니다.

    `ChannelMessagingAdapter.parseExplicitTarget` 또는 파서 기반 loaded-route
    헬퍼(`parseExplicitTargetForLoadedChannel` 또는
    `resolveRouteTargetForLoadedChannel`)나 `plugin-sdk/channel-route`의
    `resolveChannelRouteTargetWithParser(...)`를 새로 사용하지 마세요.
    이러한 훅은 사용 중단되었으며 마이그레이션 기간 동안 이전 Plugin을
    위해서만 남아 있습니다. 새 채널 Plugin은 대상 id 정규화와 디렉터리 누락
    대체에 `messaging.targetResolver.resolveTarget(...)`을, 코어에 이른
    피어 종류가 필요할 때 `messaging.inferTargetChatType(...)`을, 제공자
    네이티브 세션 및 스레드 ID에는
    `messaging.resolveOutboundSessionRoute(...)`를 사용해야 합니다.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Import 경로 참조

  <Accordion title="Common import path table">
  | 가져오기 경로 | 목적 | 주요 내보내기 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 표준 Plugin 진입 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 진입 정의/빌더용 레거시 통합 재내보내기 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 구성 스키마 내보내기 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 제공자 진입 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 집중된 채널 진입 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공유 설정 마법사 헬퍼 | 설정 번역기, 허용 목록 프롬프트, 설정 상태 빌더 |
  | `plugin-sdk/setup-runtime` | 설정 시점 런타임 헬퍼 | `createSetupTranslator`, 가져오기 안전 설정 패치 어댑터, 조회 참고 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정 프록시 |
  | `plugin-sdk/setup-adapter-runtime` | 사용 중단된 설정 어댑터 별칭 | `plugin-sdk/setup-runtime` 사용 |
  | `plugin-sdk/setup-tools` | 설정 도구 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 목록/구성/작업 게이트 헬퍼 |
  | `plugin-sdk/account-id` | 계정 ID 헬퍼 | `DEFAULT_ACCOUNT_ID`, 계정 ID 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 + 기본 대체 헬퍼 |
  | `plugin-sdk/account-helpers` | 좁은 범위의 계정 헬퍼 | 계정 목록/계정 작업 헬퍼 |
  | `plugin-sdk/channel-setup` | 설정 마법사 어댑터 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 및 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 페어링 기본 요소 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 답장 접두사, 입력 표시, 소스 전달 연결 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 구성 어댑터 팩터리 및 DM 접근 헬퍼 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 구성 스키마 빌더 | 공유 채널 구성 스키마 기본 요소 및 일반 빌더만 |
  | `plugin-sdk/bundled-channel-config-schema` | 번들 구성 스키마 | OpenClaw가 유지 관리하는 번들 Plugin 전용; 새 Plugin은 Plugin 로컬 스키마를 정의해야 함 |
  | `plugin-sdk/channel-config-schema-legacy` | 사용 중단된 번들 구성 스키마 | 호환성 별칭만; 유지 관리되는 번들 Plugin에는 `plugin-sdk/bundled-channel-config-schema` 사용 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 구성 헬퍼 | 명령 이름 정규화, 설명 다듬기, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 해석 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/inbound-envelope` | 인바운드 봉투 헬퍼 | 공유 라우트 + 봉투 빌더 헬퍼 |
  | `plugin-sdk/channel-inbound` | 인바운드 수신 헬퍼 | 컨텍스트 빌드, 서식 지정, 루트, 실행기, 준비된 답장 디스패치, 디스패치 조건자 |
  | `plugin-sdk/messaging-targets` | 사용 중단된 대상 구문 분석 가져오기 경로 | 일반 대상 구문 분석 헬퍼에는 `plugin-sdk/channel-targets`, 라우트 비교에는 `plugin-sdk/channel-route`, 제공자별 대상 해석에는 Plugin 소유 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` 사용 |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 헬퍼 | 공유 아웃바운드 미디어 로딩 |
  | `plugin-sdk/outbound-send-deps` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/channel-outbound` | 아웃바운드 메시지 수명 주기 헬퍼 | 메시지 어댑터, 수신 확인, 내구성 있는 전송 헬퍼, 라이브 미리보기/스트리밍 헬퍼, 답장 옵션, 수명 주기 헬퍼, 아웃바운드 ID, 페이로드 계획 |
  | `plugin-sdk/channel-streaming` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/outbound-runtime` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 헬퍼 | 스레드 바인딩 수명 주기 및 어댑터 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 페이로드 헬퍼 | 레거시 필드 레이아웃용 에이전트 미디어 페이로드 빌더 |
  | `plugin-sdk/channel-runtime` | 사용 중단된 호환성 계층 | 레거시 채널 런타임 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 답장 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 Plugin 스토리지 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 넓은 범위의 런타임 헬퍼 | 런타임/로깅/백업/Plugin 설치 헬퍼 |
  | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 환경 헬퍼 | 로거/런타임 환경, 타임아웃, 재시도, 백오프 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공유 Plugin 런타임 헬퍼 | Plugin 명령/훅/http/인터랙티브 헬퍼 |
  | `plugin-sdk/hook-runtime` | 훅 파이프라인 헬퍼 | 공유 Webhook/내부 훅 파이프라인 헬퍼 |
  | `plugin-sdk/lazy-runtime` | 지연 런타임 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공유 실행 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI 런타임 헬퍼 | 명령 서식 지정, 대기, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway 클라이언트, 이벤트 루프 준비 시작 헬퍼, 채널 상태 패치 헬퍼 |
  | `plugin-sdk/config-runtime` | 사용 중단된 구성 호환성 계층 | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` 선호 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때 대체 동작에서도 안정적인 Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 헬퍼 | 실행/Plugin 승인 페이로드, 승인 기능/프로필 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼, 구조화된 승인 표시 경로 서식 지정 |
  | `plugin-sdk/approval-auth-runtime` | 승인 인증 헬퍼 | 승인자 해석, 동일 채팅 작업 인증 |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 헬퍼 | 네이티브 실행 승인 프로필/필터 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 헬퍼 | 네이티브 승인 기능/전달 어댑터 |
  | `plugin-sdk/approval-gateway-runtime` | 승인 Gateway 헬퍼 | 공유 승인 Gateway 해석 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 어댑터 헬퍼 | 핫 채널 진입점용 경량 네이티브 승인 어댑터 로딩 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | 승인 핸들러 헬퍼 | 더 넓은 범위의 승인 핸들러 런타임 헬퍼; 충분한 경우 더 좁은 어댑터/Gateway 경계 선호 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 헬퍼 | 네이티브 승인 대상/계정 바인딩 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | 승인 답장 헬퍼 | 실행/Plugin 승인 답장 페이로드 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 런타임 컨텍스트 헬퍼 | 일반 채널 런타임 컨텍스트 등록/가져오기/감시 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공유 신뢰, DM 게이팅, 루트 경계 파일/경로 헬퍼, 외부 콘텐츠, 비밀 수집 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 허용 목록 및 사설 네트워크 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF 런타임 헬퍼 | 고정 디스패처, 보호된 fetch, SSRF 정책 헬퍼 |
  | `plugin-sdk/system-event-runtime` | 시스템 이벤트 헬퍼 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 헬퍼 | Heartbeat 깨우기, 이벤트, 가시성 헬퍼 |
  | `plugin-sdk/delivery-queue-runtime` | 전달 큐 헬퍼 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 채널 활동 헬퍼 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 중복 제거 헬퍼 | 인메모리 중복 제거 캐시 |
  | `plugin-sdk/file-access-runtime` | 파일 접근 헬퍼 | 안전한 로컬 파일/미디어 경로 헬퍼 |
  | `plugin-sdk/transport-ready-runtime` | 전송 준비 상태 헬퍼 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | 실행 승인 정책 헬퍼 | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 경계 있는 캐시 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 게이팅 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 서식 지정 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, 오류 그래프 헬퍼 |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/프록시 헬퍼 | `resolveFetch`, 프록시 헬퍼, EnvHttpProxyAgent 옵션 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 재시도 헬퍼 | `RetryConfig`, `retryAsync`, 정책 실행기 |
  | `plugin-sdk/allow-from` | 허용 목록 서식 지정 및 입력 매핑 | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅 및 명령 표면 헬퍼 | `resolveControlCommandGate`, 발신자 승인 헬퍼, 동적 인수 메뉴 서식 지정을 포함한 명령 레지스트리 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/도움말 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 비밀 입력 구문 분석 | 비밀 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 보호 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공유 답장 런타임 | 인바운드 디스패치, Heartbeat, 답장 플래너, 청크 분할 |
  | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 답장 디스패치 헬퍼 | 마무리, 제공자 디스패치, 대화 레이블 헬퍼 |
  | `plugin-sdk/reply-history` | 답장 기록 헬퍼 | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 사용 중단된 맵 헬퍼 호환성 내보내기 |
  | `plugin-sdk/reply-reference` | 답장 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 답장 청크 헬퍼 | 텍스트/마크다운 청크 분할 헬퍼 |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 헬퍼 | 저장소 경로 + 업데이트 시각 헬퍼 |
  | `plugin-sdk/state-paths` | 상태 경로 헬퍼 | 상태 및 OAuth 디렉터리 헬퍼 |
  | `plugin-sdk/routing` | 라우팅/세션 키 헬퍼 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 헬퍼 |
  | `plugin-sdk/status-helpers` | 채널 상태 헬퍼 | 채널/계정 상태 요약 빌더, 런타임 상태 기본값, 이슈 메타데이터 헬퍼 |
  | `plugin-sdk/target-resolver-runtime` | 대상 해석기 헬퍼 | 공유 대상 해석기 헬퍼 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 헬퍼 | 슬러그/문자열 정규화 헬퍼 |
  | `plugin-sdk/request-url` | 요청 URL 헬퍼 | 요청과 유사한 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 헬퍼 | 정규화된 stdout/stderr를 제공하는 시간 제한 명령 실행기 |
  | `plugin-sdk/param-readers` | 매개변수 리더 | 공통 도구/CLI 매개변수 리더 |
  | `plugin-sdk/tool-payload` | 도구 페이로드 추출 | 도구 결과 객체에서 정규화된 페이로드 추출 |
  | `plugin-sdk/tool-send` | 도구 전송 추출 | 도구 인수에서 정식 전송 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 헬퍼 | 공유 임시 다운로드 경로 헬퍼 |
  | `plugin-sdk/logging-core` | 로깅 헬퍼 | 하위 시스템 로거 및 삭제 헬퍼 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 표 헬퍼 | Markdown 표 모드 헬퍼 |
  | `plugin-sdk/reply-payload` | 메시지 답장 유형 | 답장 페이로드 유형 |
  | `plugin-sdk/provider-setup` | 엄선된 로컬/셀프 호스팅 제공자 설정 헬퍼 | 셀프 호스팅 제공자 검색/구성 헬퍼 |
  | `plugin-sdk/self-hosted-provider-setup` | 집중형 OpenAI 호환 셀프 호스팅 제공자 설정 헬퍼 | 동일한 셀프 호스팅 제공자 검색/구성 헬퍼 |
  | `plugin-sdk/provider-auth-runtime` | 제공자 런타임 인증 헬퍼 | 런타임 API 키 해석 헬퍼 |
  | `plugin-sdk/provider-auth-api-key` | 제공자 API 키 설정 헬퍼 | API 키 온보딩/프로필 쓰기 헬퍼 |
  | `plugin-sdk/provider-auth-result` | 제공자 인증 결과 헬퍼 | 표준 OAuth 인증 결과 빌더 |
  | `plugin-sdk/provider-selection-runtime` | 제공자 선택 헬퍼 | 구성된 제공자 또는 자동 제공자 선택 및 원시 제공자 구성 병합 |
  | `plugin-sdk/provider-env-vars` | 제공자 환경 변수 헬퍼 | 제공자 인증 환경 변수 조회 헬퍼 |
  | `plugin-sdk/provider-model-shared` | 공유 제공자 모델/재생 헬퍼 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 재생 정책 빌더, 제공자 엔드포인트 헬퍼, 모델 ID 정규화 헬퍼 |
  | `plugin-sdk/provider-catalog-shared` | 공유 제공자 카탈로그 헬퍼 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 제공자 온보딩 패치 | 온보딩 구성 헬퍼 |
  | `plugin-sdk/provider-http` | 제공자 HTTP 헬퍼 | 오디오 전사 멀티파트 폼 헬퍼를 포함한 범용 제공자 HTTP/엔드포인트 기능 헬퍼 |
  | `plugin-sdk/provider-web-fetch` | 제공자 웹 가져오기 헬퍼 | 웹 가져오기 제공자 등록/캐시 헬퍼 |
  | `plugin-sdk/provider-web-search-config-contract` | 제공자 웹 검색 구성 헬퍼 | Plugin 활성화 연결이 필요 없는 제공자를 위한 좁은 웹 검색 구성/자격 증명 헬퍼 |
  | `plugin-sdk/provider-web-search-contract` | 제공자 웹 검색 계약 헬퍼 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` 및 범위 지정 자격 증명 setter/getter 같은 좁은 웹 검색 구성/자격 증명 계약 헬퍼 |
  | `plugin-sdk/provider-web-search` | 제공자 웹 검색 헬퍼 | 웹 검색 제공자 등록/캐시/런타임 헬퍼 |
  | `plugin-sdk/provider-tools` | 제공자 도구/스키마 호환성 헬퍼 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, DeepSeek/Gemini/OpenAI 스키마 정리 및 진단 |
  | `plugin-sdk/provider-usage` | 제공자 사용량 헬퍼 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 및 기타 제공자 사용량 헬퍼 |
  | `plugin-sdk/provider-stream` | 제공자 스트림 래퍼 헬퍼 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 유형, 공유 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 헬퍼 |
  | `plugin-sdk/provider-transport-runtime` | 제공자 전송 헬퍼 | 보호된 fetch, 도구 결과 텍스트 추출, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림 같은 네이티브 제공자 전송 헬퍼 |
  | `plugin-sdk/keyed-async-queue` | 순서가 보장된 비동기 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공유 미디어 헬퍼 | 미디어 가져오기/변환/저장 헬퍼, ffprobe 기반 비디오 크기 탐지, 미디어 페이로드 빌더 |
  | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 헬퍼 | 이미지/비디오/음악 생성을 위한 공유 장애 조치 헬퍼, 후보 선택, 누락된 모델 메시지 |
  | `plugin-sdk/media-understanding` | 미디어 이해 헬퍼 | 미디어 이해 제공자 유형과 제공자 대상 이미지/오디오 헬퍼 내보내기 |
  | `plugin-sdk/text-runtime` | 사용 중단된 광범위한 텍스트 호환성 내보내기 | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, `logging-core` 사용 |
  | `plugin-sdk/text-chunking` | 텍스트 청킹 헬퍼 | 아웃바운드 텍스트 청킹 헬퍼 |
  | `plugin-sdk/speech` | 음성 헬퍼 | 음성 제공자 유형과 제공자 대상 지시문, 레지스트리, 검증 헬퍼 및 OpenAI 호환 TTS 빌더 |
  | `plugin-sdk/speech-core` | 공유 음성 코어 | 음성 제공자 유형, 레지스트리, 지시문, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 헬퍼 | 제공자 유형, 레지스트리 헬퍼, 공유 WebSocket 세션 헬퍼 |
  | `plugin-sdk/realtime-voice` | 실시간 음성 헬퍼 | 제공자 유형, 레지스트리/해석 헬퍼, 브리지 세션 헬퍼, 공유 에이전트 응답 큐, 활성 실행 음성 제어, 전사/이벤트 상태, 에코 억제, 상담 질문 매칭, 강제 상담 조정, 턴 컨텍스트 추적, 출력 활동 추적, 빠른 컨텍스트 상담 헬퍼 |
  | `plugin-sdk/image-generation` | 이미지 생성 헬퍼 | 이미지 생성 제공자 유형과 이미지 자산/데이터 URL 헬퍼 및 OpenAI 호환 이미지 제공자 빌더 |
  | `plugin-sdk/image-generation-core` | 공유 이미지 생성 코어 | 이미지 생성 유형, 장애 조치, 인증, 레지스트리 헬퍼 |
  | `plugin-sdk/music-generation` | 음악 생성 헬퍼 | 음악 생성 제공자/요청/결과 유형 |
  | `plugin-sdk/music-generation-core` | 공유 음악 생성 코어 | 음악 생성 유형, 장애 조치 헬퍼, 제공자 조회, 모델 참조 파싱 |
  | `plugin-sdk/video-generation` | 비디오 생성 헬퍼 | 비디오 생성 제공자/요청/결과 유형 |
  | `plugin-sdk/video-generation-core` | 공유 비디오 생성 코어 | 비디오 생성 유형, 장애 조치 헬퍼, 제공자 조회, 모델 참조 파싱 |
  | `plugin-sdk/interactive-runtime` | 대화형 답장 헬퍼 | 대화형 답장 페이로드 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | 채널 구성 프리미티브 | 좁은 채널 구성 스키마 프리미티브 |
  | `plugin-sdk/channel-config-writes` | 채널 구성 쓰기 헬퍼 | 채널 구성 쓰기 권한 부여 헬퍼 |
  | `plugin-sdk/channel-plugin-common` | 공유 채널 프렐류드 | 공유 채널 Plugin 프렐류드 내보내기 |
  | `plugin-sdk/channel-status` | 채널 상태 헬퍼 | 공유 채널 상태 스냅샷/요약 헬퍼 |
  | `plugin-sdk/allowlist-config-edit` | 허용 목록 구성 헬퍼 | 허용 목록 구성 편집/읽기 헬퍼 |
  | `plugin-sdk/group-access` | 그룹 액세스 헬퍼 | 공유 그룹 액세스 결정 헬퍼 |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-inbound` 사용 |
  | `plugin-sdk/direct-dm-guard-policy` | 직접 DM 보호 헬퍼 | 좁은 사전 암호화 보호 정책 헬퍼 |
  | `plugin-sdk/extension-shared` | 공유 확장 헬퍼 | 수동 채널/상태 및 앰비언트 프록시 헬퍼 프리미티브 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 헬퍼 | Webhook 대상 레지스트리 및 경로 설치 헬퍼 |
  | `plugin-sdk/webhook-path` | 사용 중단된 Webhook 경로 별칭 | `plugin-sdk/webhook-ingress` 사용 |
  | `plugin-sdk/web-media` | 공유 웹 미디어 헬퍼 | 원격/로컬 미디어 로딩 헬퍼 |
  | `plugin-sdk/zod` | 사용 중단된 Zod 호환성 재내보내기 | `zod`에서 `zod` 직접 가져오기 |
  | `plugin-sdk/memory-core` | 번들 메모리 코어 헬퍼 | 메모리 관리자/구성/파일/CLI 헬퍼 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 런타임 파사드 | 메모리 인덱스/검색 런타임 파사드 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 메모리 임베딩 레지스트리 | 경량 메모리 임베딩 제공자 레지스트리 헬퍼 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 기반 엔진 | 메모리 호스트 기반 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, 레지스트리 액세스, 로컬 제공자, 범용 배치/원격 헬퍼. 구체적인 원격 제공자는 소유 Plugin에 있음 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 스토리지 엔진 | 메모리 호스트 스토리지 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 | 메모리 호스트 멀티모달 헬퍼 |
  | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 | 메모리 호스트 쿼리 헬퍼 |
  | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 비밀 헬퍼 | 메모리 호스트 비밀 헬퍼 |
  | `plugin-sdk/memory-core-host-events` | 사용 중단된 메모리 이벤트 별칭 | `plugin-sdk/memory-host-events` 사용 |
  | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 | 메모리 호스트 상태 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 | 메모리 호스트 CLI 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 | 메모리 호스트 코어 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 | 메모리 호스트 파일/런타임 헬퍼 |
  | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 별칭 | 메모리 호스트 코어 런타임 헬퍼의 벤더 중립 별칭 |
  | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 메모리 호스트 이벤트 저널 헬퍼의 벤더 중립 별칭 |
  | `plugin-sdk/memory-host-files` | 사용 중단된 메모리 파일/런타임 별칭 | `plugin-sdk/memory-core-host-runtime-files` 사용 |
  | `plugin-sdk/memory-host-markdown` | 관리형 Markdown 헬퍼 | 메모리 인접 Plugin용 공유 관리형 Markdown 헬퍼 |
  | `plugin-sdk/memory-host-search` | Active Memory 검색 파사드 | 지연 로드 Active Memory 검색 관리자 런타임 파사드 |
  | `plugin-sdk/memory-host-status` | 사용 중단된 메모리 호스트 상태 별칭 | `plugin-sdk/memory-core-host-status` 사용 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 저장소 로컬의 사용 중단된 호환성 배럴. `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures` 같은 집중형 저장소 로컬 테스트 하위 경로 사용 |
</Accordion>

이 표는 의도적으로 전체 SDK 표면이 아니라 공통 마이그레이션 하위 집합만 다룹니다. 컴파일러 엔트리포인트 인벤터리는 `scripts/lib/plugin-sdk-entrypoints.json`에 있으며, package exports는 공개 하위 집합에서 생성됩니다.

예약된 번들 Plugin 헬퍼 이음부는 더 이상 공개 SDK export map에 포함되지 않습니다. 단, 게시된 `@openclaw/discord@2026.3.13` 패키지를 위해 유지되는 더 이상 사용되지 않는 `plugin-sdk/discord` shim 같은 명시적으로 문서화된 호환성 파사드는 예외입니다. 소유자별 헬퍼는 해당 소유 Plugin 패키지 안에 있습니다. 공유 호스트 동작은 `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`, `plugin-sdk/plugin-config-runtime` 같은 일반 SDK 계약을 통해 이동해야 합니다.

작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면 `src/plugin-sdk/`의 소스를 확인하거나 어떤 일반 계약이 이를 소유해야 하는지 메인테이너에게 문의하세요.

## 활성 지원 중단

Plugin SDK, 공급자 계약, 런타임 표면, 매니페스트 전반에 적용되는 더 좁은 지원 중단 항목입니다. 각 항목은 현재도 동작하지만 향후 메이저 릴리스에서 제거됩니다. 각 항목 아래의 항목은 이전 API를 표준 대체 항목에 매핑합니다.

<AccordionGroup>
  <Accordion title="command-auth 도움말 빌더 → command-status">
    **이전 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **새 (`openclaw/plugin-sdk/command-status`)**: 동일한 시그니처, 동일한
    export입니다. 더 좁은 하위 경로에서 import하기만 하면 됩니다. `command-auth`는
    이를 호환성 stub으로 re-export합니다.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention 게이팅 헬퍼 → resolveInboundMentionDecision">
    **이전**: `openclaw/plugin-sdk/channel-inbound` 또는
    `openclaw/plugin-sdk/channel-mention-gating`의
    `resolveInboundMentionRequirement({ facts, policy })` 및
    `shouldDropInboundForMention(...)`.

    **새**: `resolveInboundMentionDecision({ facts, policy })` - 두 개의 분리된 호출 대신
    하나의 결정 객체를 반환합니다.

    다운스트림 채널 Plugin(Slack, Discord, Matrix, MS Teams)은 이미 전환되었습니다.

  </Accordion>

  <Accordion title="채널 런타임 shim 및 채널 액션 헬퍼">
    `openclaw/plugin-sdk/channel-runtime`은 이전 채널 Plugin을 위한 호환성 shim입니다.
    새 코드에서 import하지 마세요. 런타임 객체 등록에는
    `openclaw/plugin-sdk/channel-runtime-context`를 사용하세요.

    `openclaw/plugin-sdk/channel-actions`의 `channelActions*` 헬퍼는 원시
    "actions" 채널 export와 함께 더 이상 사용되지 않습니다. 대신 의미론적
    `presentation` 표면을 통해 기능을 노출하세요. 채널 Plugin은 어떤 원시 액션 이름을
    수락하는지가 아니라 무엇을 렌더링하는지(카드, 버튼, 선택)를 선언합니다.

  </Accordion>

  <Accordion title="웹 검색 공급자 tool() 헬퍼 → Plugin의 createTool()">
    **이전**: `openclaw/plugin-sdk/provider-web-search`의 `tool()` 팩토리.

    **새**: 공급자 Plugin에 `createTool(...)`을 직접 구현하세요.
    OpenClaw는 더 이상 도구 래퍼 등록에 SDK 헬퍼가 필요하지 않습니다.

  </Accordion>

  <Accordion title="일반 텍스트 채널 envelope → BodyForAgent">
    **이전**: 인바운드 채널 메시지에서 평면 일반 텍스트 프롬프트 envelope를 만들기 위한
    `formatInboundEnvelope(...)` 및 `ChannelMessageForAgent.channelEnvelope`.

    **새**: `BodyForAgent`와 구조화된 사용자 컨텍스트 블록. 채널 Plugin은 라우팅
    메타데이터(스레드, 주제, reply-to, 반응)를 프롬프트 문자열로 이어 붙이는 대신
    타입이 지정된 필드로 첨부합니다. `formatAgentEnvelope(...)` 헬퍼는 합성된
    어시스턴트 대상 envelope에는 계속 지원되지만, 인바운드 일반 텍스트 envelope는
    제거되는 중입니다.

    영향받는 영역: `inbound_claim`, `message_received`, 그리고 `channelEnvelope` 텍스트를
    후처리한 모든 사용자 지정 채널 Plugin.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **이전**: `api.on("deactivate", handler)`.

    **새**: `api.on("gateway_stop", handler)`. 이벤트와 컨텍스트는 동일한 종료 정리
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

    `deactivate`는 2026-08-16 이후까지 더 이상 사용되지 않는 호환성 alias로 계속 연결됩니다.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **이전**: `threadBindingReady` 또는 `deliveryOrigin`을 반환하는
    `api.on("subagent_spawning", handler)`.

    **새**: core가 채널 세션 바인딩 어댑터를 통해 `thread: true` subagent 바인딩을
    준비하도록 두세요. 실행 후 관찰에만 `api.on("subagent_spawned", handler)`를 사용하세요.

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
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)`은 외부 Plugin이 마이그레이션하는 동안
    더 이상 사용되지 않는 호환성 표면으로만 남습니다.

  </Accordion>

  <Accordion title="공급자 발견 타입 → 공급자 카탈로그 타입">
    네 가지 발견 타입 alias는 이제 catalog 시대 타입 위의 얇은 래퍼입니다.

    | 이전 alias                | 새 타입                   |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    또한 레거시 `ProviderCapabilities` 정적 bag도 해당됩니다. 공급자 Plugin은 정적 객체 대신
    `buildReplayPolicy`, `normalizeToolSchemas`, `wrapStreamFn` 같은 명시적인 공급자 hook을
    사용해야 합니다.

  </Accordion>

  <Accordion title="Thinking 정책 hook → resolveThinkingProfile">
    **이전** (`ProviderThinkingPolicy`의 세 가지 개별 hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, 그리고
    `resolveDefaultThinkingLevel(ctx)`.

    **새**: 표준 `id`, 선택적 `label`, 순위가 지정된 레벨 목록이 포함된
    `ProviderThinkingProfile`을 반환하는 단일 `resolveThinkingProfile(ctx)`입니다.
    OpenClaw는 오래된 저장 값을 profile 순위에 따라 자동으로 다운그레이드합니다.

    컨텍스트에는 `provider`, `modelId`, 선택적으로 병합된 `reasoning`, 그리고 선택적으로
    병합된 모델 `compat` facts가 포함됩니다. 공급자 Plugin은 구성된 요청 계약이 이를
    지원할 때만 이 카탈로그 facts를 사용해 모델별 profile을 노출할 수 있습니다.

    세 개 대신 하나의 hook을 구현하세요. 레거시 hook은 지원 중단 기간 동안 계속 동작하지만
    profile 결과와 조합되지는 않습니다.

  </Accordion>

  <Accordion title="외부 인증 공급자 → contracts.externalAuthProviders">
    **이전**: Plugin 매니페스트에 공급자를 선언하지 않고 외부 인증 hook을 구현.

    **새**: Plugin 매니페스트에 `contracts.externalAuthProviders`를 선언하고
    **또한** `resolveExternalAuthProfiles(...)`를 구현하세요.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="공급자 env-var 조회 → setup.providers[].envVars">
    **이전** 매니페스트 필드: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **새**: 동일한 env-var 조회를 매니페스트의 `setup.providers[].envVars`에 미러링하세요.
    이렇게 하면 setup/status env 메타데이터가 한곳으로 통합되고, env-var 조회에 답하기 위해
    Plugin 런타임을 부팅하지 않아도 됩니다.

    `providerAuthEnvVars`는 지원 중단 기간이 끝날 때까지 호환성 어댑터를 통해 계속 지원됩니다.

  </Accordion>

  <Accordion title="Memory Plugin 등록 → registerMemoryCapability">
    **이전**: 세 개의 개별 호출 -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **새**: memory-state API에서 한 번 호출 -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    동일한 slot을 단일 등록 호출로 처리합니다. 추가형 프롬프트 및 corpus 헬퍼
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)는 영향을 받지 않습니다.

  </Accordion>

  <Accordion title="Memory embedding 공급자 API">
    **이전**: `api.registerMemoryEmbeddingProvider(...)` 및
    `contracts.memoryEmbeddingProviders`.

    **새**: `api.registerEmbeddingProvider(...)` 및
    `contracts.embeddingProviders`.

    일반 embedding 공급자 계약은 Memory 밖에서도 재사용할 수 있으며 새 공급자를 위한 지원 경로입니다.
    기존 공급자가 마이그레이션하는 동안 Memory 전용 등록 API는 더 이상 사용되지 않는 호환성으로
    계속 연결됩니다. Plugin 검사는 번들되지 않은 사용을 호환성 부채로 보고합니다.

  </Accordion>

  <Accordion title="Subagent 세션 메시지 타입 이름 변경">
    `src/plugins/runtime/types.ts`에서 여전히 export되는 두 레거시 타입 alias:

    | 이전                          | 새                              |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    런타임 메서드 `readSession`은 `getSessionMessages`를 favor하여 더 이상 사용되지 않습니다.
    시그니처는 동일하며, 이전 메서드는 새 메서드로 호출을 전달합니다.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **이전**: `runtime.tasks.flow`(단수)는 라이브 task-flow 접근자를 반환했습니다.

    **새**: `runtime.tasks.managedFlows`는 flow에서 하위 작업을 만들거나, 업데이트하거나,
    취소하거나, 실행하는 Plugin을 위해 관리형 TaskFlow 변경 런타임을 유지합니다.
    Plugin이 DTO 기반 읽기만 필요로 할 때는 `runtime.tasks.flows`를 사용하세요.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="내장 확장 팩토리 → agent tool-result middleware">
    위의 "마이그레이션 방법 → 내장 tool-result 확장을 middleware로 마이그레이션"에서 다룹니다.
    완전성을 위해 여기에 포함합니다. 제거된 embedded-runner 전용
    `api.registerEmbeddedExtensionFactory(...)` 경로는 `contracts.agentToolResultMiddleware`의
    명시적인 런타임 목록과 함께 `api.registerAgentToolResultMiddleware(...)`로 대체됩니다.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk`에서 re-export된 `OpenClawSchemaType`은 이제 `OpenClawConfig`의
    한 줄 alias입니다. 표준 이름을 선호하세요.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 아래 번들 채널/공급자 Plugin 내부의 extension 수준 지원 중단은 자체 `api.ts`와
`runtime-api.ts` barrel 안에서 추적됩니다. 이는 서드파티 Plugin 계약에 영향을 주지 않으며
여기에 나열되지 않습니다. 번들 Plugin의 로컬 barrel을 직접 사용한다면 업그레이드하기 전에
해당 barrel의 지원 중단 주석을 읽으세요.
</Note>

## 제거 일정

| 시점                   | 발생하는 일                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **지금**                | 지원 중단된 표면에서 런타임 경고가 발생합니다                               |
| **다음 메이저 릴리스** | 지원 중단된 표면이 제거됩니다. 이를 계속 사용하는 Plugin은 실패합니다 |

모든 핵심 Plugin은 이미 마이그레이션되었습니다. 외부 Plugin은 다음 메이저 릴리스 전에
마이그레이션해야 합니다.

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
- [Channel Plugin](/ko/plugins/sdk-channel-plugins) - Channel Plugin 빌드
- [Provider Plugin](/ko/plugins/sdk-provider-plugins) - Provider Plugin 빌드
- [Plugin 내부 구조](/ko/plugins/architecture) - 아키텍처 심층 분석
- [Plugin 매니페스트](/ko/plugins/manifest) - 매니페스트 스키마 참조
