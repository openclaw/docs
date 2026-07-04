---
read_when:
    - OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 경고가 표시됩니다
    - OPENCLAW_EXTENSION_API_DEPRECATED 경고가 표시됩니다
    - OpenClaw 2026.4.25 이전에는 api.registerEmbeddedExtensionFactory를 사용했습니다
    - Plugin을 최신 Plugin 아키텍처로 업데이트하고 있습니다
    - 외부 OpenClaw Plugin을 유지 관리합니다
sidebarTitle: Migrate to SDK
summary: 레거시 하위 호환성 계층에서 최신 plugin SDK로 마이그레이션
title: Plugin SDK 마이그레이션
x-i18n:
    generated_at: "2026-07-04T10:34:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7873de40aea56f456781ecf8ac9a4705c958030f7c68f8a112ad3f0fce62f078
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw는 광범위한 하위 호환성 계층에서, 초점이 명확하고 문서화된 import를 사용하는 현대적인 Plugin
아키텍처로 이동했습니다. Plugin이 새 아키텍처 이전에 만들어졌다면
이 가이드가 마이그레이션에 도움을 줍니다.

## 변경되는 사항

이전 Plugin 시스템은 Plugin이 단일 진입점에서 필요한
모든 것을 가져올 수 있게 하는 두 개의 매우 개방적인 표면을 제공했습니다.

- **`openclaw/plugin-sdk/compat`** - 수십 개의 헬퍼를 다시 내보내는 단일 import입니다.
  새 Plugin 아키텍처가 구축되는 동안 이전 훅 기반 Plugin이 계속 동작하도록
  도입되었습니다.
- **`openclaw/plugin-sdk/infra-runtime`** - 시스템 이벤트, Heartbeat 상태, 전달 큐, fetch/proxy 헬퍼,
  파일 헬퍼, 승인 타입, 관련 없는 유틸리티를 섞어 둔 광범위한 런타임 헬퍼 배럴입니다.
- **`openclaw/plugin-sdk/config-runtime`** - 마이그레이션 기간 동안 더 이상 권장되지 않는 직접 load/write 헬퍼를
  계속 포함하는 광범위한 구성 호환성 배럴입니다.
- **`openclaw/extension-api`** - 내장 에이전트 러너 같은 호스트 측 헬퍼에 Plugin이 직접 접근할 수 있게 한
  브리지입니다.
- **`api.registerEmbeddedExtensionFactory(...)`** - `tool_result` 같은
  embedded-runner 이벤트를 관찰할 수 있었던, 제거된 embedded-runner 전용 번들
  확장 훅입니다.

광범위한 import 표면은 이제 **지원 중단**되었습니다. 런타임에서는 여전히 동작하지만,
새 Plugin은 이를 사용하면 안 되며, 기존 Plugin은 다음 메이저 릴리스에서 제거되기 전에
마이그레이션해야 합니다. embedded-runner 전용 확장 팩터리 등록 API는 제거되었습니다.
대신 도구 결과 미들웨어를 사용하세요.

OpenClaw는 대체 기능을 도입하는 동일한 변경에서 문서화된 Plugin 동작을 제거하거나
다르게 해석하지 않습니다. 계약을 깨는 변경은 먼저 호환성 어댑터, 진단, 문서,
지원 중단 기간을 거쳐야 합니다. 이는 SDK import, 매니페스트 필드, 설정 API, 훅,
런타임 등록 동작에 적용됩니다.

<Warning>
  하위 호환성 계층은 향후 메이저 릴리스에서 제거됩니다.
  이러한 표면에서 계속 import하는 Plugin은 그 시점에 중단됩니다.
  레거시 내장 확장 팩터리 등록은 이미 더 이상 로드되지 않습니다.
</Warning>

## 변경 이유

이전 접근 방식은 문제를 일으켰습니다.

- **느린 시작** - 하나의 헬퍼를 import하면 관련 없는 수십 개의 모듈이 로드되었습니다.
- **순환 의존성** - 광범위한 재내보내기가 import 사이클을 만들기 쉽게 했습니다.
- **불명확한 API 표면** - 어떤 export가 안정적인지 내부용인지 구분할 방법이 없었습니다.

현대적인 Plugin SDK는 이를 해결합니다. 각 import 경로(`openclaw/plugin-sdk/\<subpath\>`)는
명확한 목적과 문서화된 계약을 가진 작고 독립적인 모듈입니다.

번들 채널을 위한 레거시 제공자 편의 경계도 제거되었습니다.
채널 브랜드가 붙은 헬퍼 경계는 비공개 모노레포 단축 경로였으며 안정적인
Plugin 계약이 아니었습니다. 대신 좁고 일반적인 SDK 하위 경로를 사용하세요. 번들
Plugin 워크스페이스 내부에서는 제공자 소유 헬퍼를 해당 Plugin의 자체 `api.ts` 또는
`runtime-api.ts`에 유지하세요.

현재 번들 제공자 예시:

- Anthropic은 Claude 전용 스트림 헬퍼를 자체 `api.ts` /
  `contract-api.ts` 경계에 유지합니다.
- OpenAI는 제공자 빌더, 기본 모델 헬퍼, realtime 제공자
  빌더를 자체 `api.ts`에 유지합니다.
- OpenRouter는 제공자 빌더와 온보딩/구성 헬퍼를 자체
  `api.ts`에 유지합니다.

## Talk 및 realtime 음성 마이그레이션 계획

Realtime 음성, 전화, 회의, 브라우저 Talk 코드는
표면별 턴 기록 관리에서 `openclaw/plugin-sdk/realtime-voice`가 export하는 공유 Talk 세션 컨트롤러로
이동하고 있습니다. 새 컨트롤러는 공통 Talk
이벤트 엔벌로프, 활성 턴 상태, 캡처 상태, 출력 오디오 상태, 최근
이벤트 기록, 오래된 턴 거부를 소유합니다. 제공자 Plugin은
벤더별 realtime 세션을 계속 소유해야 하며, 표면 Plugin은 캡처,
재생, 전화, 회의 특수성을 계속 소유해야 합니다.

이 Talk 마이그레이션은 의도적으로 깔끔한 breaking 변경입니다.

1. 공유 컨트롤러/런타임 프리미티브를
   `plugin-sdk/realtime-voice`에 유지합니다.
2. 번들 표면을 공유 컨트롤러로 이동합니다: 브라우저 릴레이,
   managed-room handoff, 음성 통화 realtime, 음성 통화 스트리밍 STT, Google
   Meet realtime, 네이티브 push-to-talk.
3. 이전 Talk RPC 패밀리를 최종 `talk.session.*` 및
   `talk.client.*` API로 교체합니다.
4. Gateway `hello-ok.features.events`에 하나의 라이브 Talk 이벤트 채널을
   광고합니다: `talk.event`.
5. 이전 realtime HTTP 엔드포인트와 요청 시점 명령
   override 경로를 삭제합니다.

저수준 어댑터나 테스트 픽스처를 구현하는 경우가 아니라면 새 코드는
`createTalkEventSequencer(...)`를 직접 호출하면 안 됩니다. 턴 범위 이벤트가 턴 id 없이
방출될 수 없고, 오래된 `turnEnd` /
`turnCancel` 호출이 더 새로운 활성 턴을 지울 수 없으며, 출력 오디오 수명 주기
이벤트가 전화, 회의, 브라우저 릴레이, managed-room
handoff, 네이티브 Talk 클라이언트 전반에서 일관되게 유지되도록 공유 컨트롤러를 선호하세요.

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

브라우저 소유 WebRTC/제공자 websocket 세션은 `talk.client.create`를 사용합니다.
브라우저가 제공자 협상과 미디어 전송을 소유하고, Gateway가
자격 증명, 명령, 도구 정책을 소유하기 때문입니다. `talk.session.*`는
gateway-relay realtime, gateway-relay
transcription, managed-room 네이티브 STT/TTS 세션을 위한 공통 Gateway 관리 표면입니다.

`talk.provider` /
`talk.providers` 옆에 realtime 선택자를 배치한 레거시 구성은 `openclaw doctor --fix`로 복구해야 합니다. 런타임 Talk는
speech/TTS 제공자 구성을 realtime 제공자 구성으로 다시 해석하지 않습니다.

지원되는 `talk.session.create` 조합은 의도적으로 작습니다.

| 모드            | 전송       | Brain           | 소유자              | 참고                                                                                                              |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | 전이중 제공자 오디오가 Gateway를 통해 브리지되며, 도구 호출은 agent-consult 도구를 통해 라우팅됩니다.      |
| `transcription` | `gateway-relay` | `none`          | Gateway            | 스트리밍 STT 전용입니다. 호출자는 입력 오디오를 보내고 transcript 이벤트를 받습니다.                                        |
| `stt-tts`       | `managed-room`  | `agent-consult` | 네이티브/클라이언트 룸 | 클라이언트가 캡처/재생을 소유하고 Gateway가 턴 상태를 소유하는 push-to-talk 및 무전기 스타일 룸입니다. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 네이티브/클라이언트 룸 | Gateway 도구 작업을 직접 실행하는 신뢰할 수 있는 일급 표면을 위한 관리자 전용 룸 모드입니다.                  |

제거된 메서드 매핑:

| 이전                              | 새 항목                                                      |
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

통합 제어 어휘도 의도적으로 좁습니다.

  | 메서드                          | 적용 대상                                              | 계약                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | 동일한 Gateway 연결이 소유한 제공자 세션에 base64 PCM 오디오 청크를 추가합니다.                                                                                            |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 관리형 룸 사용자 턴을 시작합니다.                                                                                                                                                          |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 오래된 턴 검증 후 활성 턴을 종료합니다.                                                                                                                                         |
  | `talk.session.cancelTurn`       | 모든 Gateway 소유 세션                              | 턴에 대한 활성 캡처/제공자/에이전트/TTS 작업을 취소합니다.                                                                                                                                |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 사용자 턴을 반드시 종료하지 않고도 어시스턴트 오디오 출력을 중지합니다.                                                                                                                    |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 릴레이가 내보낸 제공자 도구 호출을 완료합니다. 중간 출력에는 `options.willContinue`를 전달하고, 추가 어시스턴트 응답 없이 호출을 충족하려면 `options.suppressResponse`를 전달합니다. |
  | `talk.session.steer`            | 에이전트 기반 Talk 세션                              | Talk 세션에서 확인된 활성 임베디드 실행에 음성 `status`, `steer`, `cancel` 또는 `followup` 제어를 보냅니다.                                                                |
  | `talk.session.close`            | 모든 통합 세션                                    | 릴레이 세션을 중지하거나 관리형 룸 상태를 취소한 다음 통합 세션 ID를 잊습니다.                                                                                                    |

  이를 작동시키기 위해 코어에 제공자 또는 플랫폼 특수 사례를 도입하지 마세요.
  코어는 Talk 세션 의미 체계를 소유합니다. 제공자 Plugin은 벤더 세션 설정을 소유합니다.
  음성 통화와 Google Meet는 전화/회의 어댑터를 소유합니다. 브라우저와 네이티브
  앱은 기기 캡처/재생 UX를 소유합니다.

  ## 호환성 정책

  외부 Plugin의 경우 호환성 작업은 다음 순서를 따릅니다.

  1. 새 계약 추가
  2. 호환성 어댑터를 통해 이전 동작 유지
  3. 이전 경로와 대체 경로를 명명하는 진단 또는 경고 출력
  4. 테스트에서 두 경로 모두 커버
  5. 지원 중단 및 마이그레이션 경로 문서화
  6. 공지된 마이그레이션 기간 이후에만 제거, 일반적으로 메이저 릴리스에서 제거

  유지관리자는 현재 마이그레이션 대기열을
  `pnpm plugins:boundary-report`로 감사할 수 있습니다. 간결한 수치에는 `pnpm plugins:boundary-report:summary`를 사용하고,
  하나의 Plugin 또는 호환성 소유자에는 `--owner <id>`를 사용하며,
  만료된 호환성 레코드, 소유자 간 예약 SDK 가져오기, 또는 사용되지 않는 예약 SDK
  하위 경로에서 CI 게이트가 실패해야 할 때는
  `pnpm plugins:boundary-report:ci`를 사용하세요. 이 보고서는 지원 중단된
  호환성 레코드를 제거 날짜별로 그룹화하고, 로컬 코드/문서 참조 수를 세며,
  소유자 간 예약 SDK 가져오기를 표시하고, 비공개
  memory-host SDK 브리지를 요약하여 호환성 정리가 임시 검색에 의존하지 않고
  명시적으로 유지되도록 합니다. 예약 SDK 하위 경로에는 추적된 소유자 사용이 있어야 합니다.
  사용되지 않는 예약 헬퍼 내보내기는 공개 SDK에서 제거해야 합니다.

  매니페스트 필드가 아직 허용되는 경우, Plugin 작성자는
  문서와 진단이 달리 말할 때까지 계속 사용할 수 있습니다. 새 코드는 문서화된
  대체 항목을 선호해야 하지만, 기존 Plugin은 일반적인 마이너
  릴리스 중에 깨지면 안 됩니다.

  ## 마이그레이션 방법

  <Steps>
  <Step title="런타임 구성 로드/쓰기 헬퍼 마이그레이션">
    번들 Plugin은
    `api.runtime.config.loadConfig()`와
    `api.runtime.config.writeConfigFile(...)`를 직접 호출하지 않아야 합니다. 활성 호출 경로에
    이미 전달된 구성을 선호하세요. 현재 프로세스 스냅샷이 필요한 장기 실행 핸들러는
    `api.runtime.config.current()`를 사용할 수 있습니다. 장기 실행
    에이전트 도구는 구성 쓰기 전에 생성된 도구도 갱신된
    런타임 구성을 볼 수 있도록 `execute` 내부에서 도구 컨텍스트의
    `ctx.getRuntimeConfig()`를 사용해야 합니다.

    구성 쓰기는 트랜잭션 헬퍼를 통해 수행되어야 하며
    쓰기 후 정책을 선택해야 합니다.

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    호출자가 변경에 깨끗한 Gateway 재시작이 필요하다는 것을 알고 있으면
    `afterWrite: { mode: "restart", reason: "..." }`를 사용하고,
    호출자가 후속 조치를 소유하며 의도적으로 재로드 플래너를 억제하려는 경우에만
    `afterWrite: { mode: "none", reason: "..." }`를 사용하세요.
    변이 결과에는 테스트와 로깅을 위한 타입 지정 `followUp` 요약이 포함됩니다.
    Gateway는 재시작을 적용하거나 예약할 책임을 계속 가집니다.
    `loadConfig`와 `writeConfigFile`은 마이그레이션 기간 동안 외부 Plugin을 위한
    지원 중단된 호환성 헬퍼로 남아 있으며,
    `runtime-config-load-write` 호환성 코드로 한 번 경고합니다. 번들 Plugin과 저장소
    런타임 코드는
    `pnpm check:deprecated-api-usage` 및
    `pnpm check:no-runtime-action-load-config`의 스캐너 가드레일로 보호됩니다. 새 프로덕션 Plugin 사용은
    즉시 실패하고, 직접 구성 쓰기도 실패하며, Gateway 서버 메서드는 요청 런타임 스냅샷을 사용해야 하고,
    런타임 채널 전송/액션/클라이언트 헬퍼는 해당 경계에서 구성을 받아야 하며,
    장기 실행 런타임 모듈은 허용된 주변 `loadConfig()` 호출이
    0개여야 합니다.

    새 Plugin 코드는 넓은
    `openclaw/plugin-sdk/config-runtime` 호환성 배럴 가져오기도 피해야 합니다. 작업에 맞는 좁은
    SDK 하위 경로를 사용하세요.

    | 필요 | 가져오기 |
    | --- | --- |
    | `OpenClawConfig` 같은 구성 타입 | `openclaw/plugin-sdk/config-contracts` |
    | 이미 로드된 구성 어설션 및 Plugin 진입 구성 조회 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 현재 런타임 스냅샷 읽기 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 구성 쓰기 | `openclaw/plugin-sdk/config-mutation` |
    | 세션 저장소 헬퍼 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 표 구성 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 그룹 정책 런타임 헬퍼 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 비밀 입력 확인 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 모델/세션 오버라이드 | `openclaw/plugin-sdk/model-session-runtime` |

    번들 Plugin과 해당 테스트는 넓은
    배럴에 대해 스캐너로 보호되어 가져오기와 목이 필요한 동작에 로컬로 유지됩니다. 넓은
    배럴은 외부 호환성을 위해 여전히 존재하지만, 새 코드는 여기에
    의존해서는 안 됩니다.

  </Step>

  <Step title="임베디드 도구 결과 확장을 미들웨어로 마이그레이션">
    번들 Plugin은 임베디드 러너 전용
    `api.registerEmbeddedExtensionFactory(...)` 도구 결과 핸들러를
    런타임 중립 미들웨어로 교체해야 합니다.

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
    `contracts.agentToolResultMiddleware`에 대상 런타임을 모두 선언한 경우
    도구 결과 미들웨어를 등록할 수 있습니다. 선언되지 않은 설치 미들웨어
    등록은 거부됩니다.

  </Step>

  <Step title="승인 네이티브 핸들러를 capability facts로 마이그레이션">
    승인 가능한 채널 Plugin은 이제
    `approvalCapability.nativeRuntime`와 공유 런타임 컨텍스트 레지스트리를 통해
    네이티브 승인 동작을 노출합니다.

    주요 변경 사항:

    - `approvalCapability.handler.loadRuntime(...)`를
      `approvalCapability.nativeRuntime`로 교체
    - 승인별 인증/전달을 레거시 `plugin.auth` /
      `plugin.approvals` 배선에서 `approvalCapability`로 이동
    - `ChannelPlugin.approvals`는 공개 채널 Plugin
      계약에서 제거되었습니다. 전달/네이티브/렌더 필드를 `approvalCapability`로 이동하세요.
    - `plugin.auth`는 채널 로그인/로그아웃 흐름에만 남아 있습니다. 코어는 더 이상 그곳의 승인 인증
      훅을 읽지 않습니다.
    - 클라이언트, 토큰, Bolt
      앱 같은 채널 소유 런타임 객체를 `openclaw/plugin-sdk/channel-runtime-context`를 통해 등록
    - 네이티브 승인 핸들러에서 Plugin 소유 재라우팅 알림을 보내지 마세요.
      이제 코어가 실제 전달 결과에서 다른 곳으로 라우팅된 알림을 소유합니다.
    - `channelRuntime`을 `createChannelManager(...)`에 전달할 때
      실제 `createPluginRuntime().channel` 표면을 제공하세요. 부분 스텁은 거부됩니다.

    현재 승인 capability
    레이아웃은 `/plugins/sdk-channel-plugins`를 참조하세요.

  </Step>

  <Step title="Windows 래퍼 폴백 동작 감사">
    Plugin이 `openclaw/plugin-sdk/windows-spawn`을 사용하는 경우, 확인되지 않은 Windows
    `.cmd`/`.bat` 래퍼는 명시적으로
    `allowShellFallback: true`를 전달하지 않는 한 이제 실패 폐쇄됩니다.

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

  <Step title="지원 중단된 가져오기 찾기">
    Plugin에서 지원 중단된 두 표면 중 하나에서 가져오기를 검색하세요.

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="집중된 가져오기로 교체">
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

    같은 패턴이 다른 레거시 브리지 헬퍼에도 적용됩니다.

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

  <Step title="광범위한 infra-runtime import 교체">
    `openclaw/plugin-sdk/infra-runtime`는 외부 호환성을 위해 여전히
    존재하지만, 새 코드는 실제로 필요한 집중된 헬퍼 표면을 import해야
    합니다.

    | 필요 항목 | Import |
    | --- | --- |
    | 시스템 이벤트 큐 헬퍼 | `openclaw/plugin-sdk/system-event-runtime` |
    | Heartbeat 깨우기, 이벤트, 가시성 헬퍼 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 보류 중인 전달 큐 드레인 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | 채널 활동 텔레메트리 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 인메모리 및 영구 저장소 기반 중복 제거 캐시 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 안전한 로컬 파일/미디어 경로 헬퍼 | `openclaw/plugin-sdk/file-access-runtime` |
    | 디스패처 인식 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 프록시 및 보호된 fetch 헬퍼 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 디스패처 정책 타입 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 승인 요청/해결 타입 | `openclaw/plugin-sdk/approval-runtime` |
    | 승인 응답 페이로드 및 명령 헬퍼 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 오류 포매팅 헬퍼 | `openclaw/plugin-sdk/error-runtime` |
    | 전송 준비 대기 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 보안 토큰 헬퍼 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 제한된 비동기 작업 동시성 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 숫자 강제 변환 | `openclaw/plugin-sdk/number-runtime` |
    | 프로세스 로컬 비동기 잠금 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 파일 잠금 | `openclaw/plugin-sdk/file-lock` |

    번들 Plugin은 `infra-runtime`에 대해 스캐너로 보호되므로, 저장소 코드가
    광범위한 배럴로 회귀할 수 없습니다.

  </Step>

  <Step title="채널 라우트 헬퍼 마이그레이션">
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
    cron 전달, 세션 라우팅 전반에서 `{ channel, to, accountId, threadId }`를
    일관되게 정규화합니다.

    `ChannelMessagingAdapter.parseExplicitTarget` 또는
    파서 기반 loaded-route 헬퍼(`parseExplicitTargetForLoadedChannel`
    또는 `resolveRouteTargetForLoadedChannel`)나
    `plugin-sdk/channel-route`의 `resolveChannelRouteTargetWithParser(...)`를
    새로 사용하지 마세요.
    이러한 훅은 더 이상 사용되지 않으며 마이그레이션 기간 동안 이전 Plugin만을 위해
    남아 있습니다. 새 채널 Plugin은 대상 ID 정규화와 디렉터리 누락 폴백에는
    `messaging.targetResolver.resolveTarget(...)`를, 코어가 초기 피어 종류를
    필요로 할 때는 `messaging.inferTargetChatType(...)`를, 제공자 네이티브 세션
    및 스레드 ID에는 `messaging.resolveOutboundSessionRoute(...)`를 사용해야 합니다.

  </Step>

  <Step title="빌드 및 테스트">
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
  | `plugin-sdk/plugin-entry` | 표준 플러그인 엔트리 헬퍼 | `definePluginEntry` |
  | `plugin-sdk/core` | 채널 엔트리 정의/빌더용 레거시 포괄 재내보내기 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 루트 설정 스키마 내보내기 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 단일 제공자 엔트리 헬퍼 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 집중된 채널 엔트리 정의 및 빌더 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 공유 설정 마법사 헬퍼 | 설정 번역기, 허용 목록 프롬프트, 설정 상태 빌더 |
  | `plugin-sdk/setup-runtime` | 설정 시점 런타임 헬퍼 | `createSetupTranslator`, 가져오기 안전 설정 패치 어댑터, 조회 노트 헬퍼, `promptResolvedAllowFrom`, `splitSetupEntries`, 위임된 설정 프록시 |
  | `plugin-sdk/setup-adapter-runtime` | 사용 중단된 설정 어댑터 별칭 | `plugin-sdk/setup-runtime` 사용 |
  | `plugin-sdk/setup-tools` | 설정 도구 헬퍼 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 다중 계정 헬퍼 | 계정 목록/설정/작업 게이트 헬퍼 |
  | `plugin-sdk/account-id` | 계정 ID 헬퍼 | `DEFAULT_ACCOUNT_ID`, 계정 ID 정규화 |
  | `plugin-sdk/account-resolution` | 계정 조회 헬퍼 | 계정 조회 및 기본값 폴백 헬퍼 |
  | `plugin-sdk/account-helpers` | 좁은 범위의 계정 헬퍼 | 계정 목록/계정 작업 헬퍼 |
  | `plugin-sdk/channel-setup` | 설정 마법사 어댑터 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 그리고 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 페어링 프리미티브 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 답장 접두사, 입력 중 표시, 소스 전달 연결 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 설정 어댑터 팩터리 및 DM 접근 헬퍼 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 설정 스키마 빌더 | 공유 채널 설정 스키마 프리미티브 및 범용 빌더만 |
  | `plugin-sdk/bundled-channel-config-schema` | 번들 설정 스키마 | OpenClaw가 유지 관리하는 번들 플러그인 전용. 새 플러그인은 플러그인 로컬 스키마를 정의해야 함 |
  | `plugin-sdk/channel-config-schema-legacy` | 사용 중단된 번들 설정 스키마 | 호환성 별칭 전용. 유지 관리되는 번들 플러그인에는 `plugin-sdk/bundled-channel-config-schema` 사용 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 설정 헬퍼 | 명령 이름 정규화, 설명 트리밍, 중복/충돌 검증 |
  | `plugin-sdk/channel-policy` | 그룹/DM 정책 확인 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/inbound-envelope` | 인바운드 엔벌로프 헬퍼 | 공유 라우트 및 엔벌로프 빌더 헬퍼 |
  | `plugin-sdk/channel-inbound` | 인바운드 수신 헬퍼 | 컨텍스트 빌드, 포맷팅, 루트, 러너, 준비된 답장 디스패치, 디스패치 조건자 |
  | `plugin-sdk/messaging-targets` | 사용 중단된 대상 파싱 가져오기 경로 | 범용 대상 파싱 헬퍼에는 `plugin-sdk/channel-targets`, 라우트 비교에는 `plugin-sdk/channel-route`, 제공자별 대상 확인에는 플러그인이 소유한 `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` 사용 |
  | `plugin-sdk/outbound-media` | 아웃바운드 미디어 헬퍼 | 공유 아웃바운드 미디어 로딩 |
  | `plugin-sdk/outbound-send-deps` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/channel-outbound` | 아웃바운드 메시지 수명 주기 헬퍼 | 메시지 어댑터, 수신 확인, 내구성 있는 전송 헬퍼, 라이브 미리보기/스트리밍 헬퍼, 답장 옵션, 수명 주기 헬퍼, 아웃바운드 ID, 페이로드 계획 |
  | `plugin-sdk/channel-streaming` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/outbound-runtime` | 사용 중단된 호환성 파사드 | `plugin-sdk/channel-outbound` 사용 |
  | `plugin-sdk/thread-bindings-runtime` | 스레드 바인딩 헬퍼 | 스레드 바인딩 수명 주기 및 어댑터 헬퍼 |
  | `plugin-sdk/agent-media-payload` | 레거시 미디어 페이로드 헬퍼 | 레거시 필드 레이아웃용 에이전트 미디어 페이로드 빌더 |
  | `plugin-sdk/channel-runtime` | 사용 중단된 호환성 심 | 레거시 채널 런타임 유틸리티 전용 |
  | `plugin-sdk/channel-send-result` | 전송 결과 타입 | 답장 결과 타입 |
  | `plugin-sdk/runtime-store` | 영구 플러그인 저장소 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 광범위한 런타임 헬퍼 | 런타임/로깅/백업/플러그인 설치 헬퍼 |
  | `plugin-sdk/runtime-env` | 좁은 범위의 런타임 환경 헬퍼 | 로거/런타임 환경, 타임아웃, 재시도, 백오프 헬퍼 |
  | `plugin-sdk/plugin-runtime` | 공유 플러그인 런타임 헬퍼 | 플러그인 명령/훅/http/인터랙티브 헬퍼 |
  | `plugin-sdk/hook-runtime` | 훅 파이프라인 헬퍼 | 공유 Webhook/내부 훅 파이프라인 헬퍼 |
  | `plugin-sdk/lazy-runtime` | 지연 런타임 헬퍼 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 프로세스 헬퍼 | 공유 exec 헬퍼 |
  | `plugin-sdk/cli-runtime` | CLI 런타임 헬퍼 | 명령 포맷팅, 대기, 버전 헬퍼 |
  | `plugin-sdk/gateway-runtime` | Gateway 헬퍼 | Gateway 클라이언트, 이벤트 루프 준비 시작 헬퍼, 공개된 LAN 호스트 확인, 채널 상태 패치 헬퍼 |
  | `plugin-sdk/config-runtime` | 사용 중단된 설정 호환성 심 | `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot`, `config-mutation` 권장 |
  | `plugin-sdk/telegram-command-config` | Telegram 명령 헬퍼 | 번들 Telegram 계약 표면을 사용할 수 없을 때 폴백 안정성이 있는 Telegram 명령 검증 헬퍼 |
  | `plugin-sdk/approval-runtime` | 승인 프롬프트 헬퍼 | Exec/플러그인 승인 페이로드, 승인 기능/프로필 헬퍼, 네이티브 승인 라우팅/런타임 헬퍼, 구조화된 승인 표시 경로 포맷팅 |
  | `plugin-sdk/approval-auth-runtime` | 승인 인증 헬퍼 | 승인자 확인, 같은 채팅 작업 인증 |
  | `plugin-sdk/approval-client-runtime` | 승인 클라이언트 헬퍼 | 네이티브 exec 승인 프로필/필터 헬퍼 |
  | `plugin-sdk/approval-delivery-runtime` | 승인 전달 헬퍼 | 네이티브 승인 기능/전달 어댑터 |
  | `plugin-sdk/approval-gateway-runtime` | 승인 Gateway 헬퍼 | 공유 승인 Gateway 확인 헬퍼 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 승인 어댑터 헬퍼 | 핫 채널 엔트리포인트용 경량 네이티브 승인 어댑터 로딩 헬퍼 |
  | `plugin-sdk/approval-handler-runtime` | 승인 핸들러 헬퍼 | 더 넓은 승인 핸들러 런타임 헬퍼. 충분한 경우 더 좁은 어댑터/Gateway 경계를 권장 |
  | `plugin-sdk/approval-native-runtime` | 승인 대상 헬퍼 | 네이티브 승인 대상/계정 바인딩 헬퍼 |
  | `plugin-sdk/approval-reply-runtime` | 승인 답장 헬퍼 | Exec/플러그인 승인 답장 페이로드 헬퍼 |
  | `plugin-sdk/channel-runtime-context` | 채널 런타임 컨텍스트 헬퍼 | 범용 채널 런타임 컨텍스트 등록/가져오기/감시 헬퍼 |
  | `plugin-sdk/security-runtime` | 보안 헬퍼 | 공유 신뢰, DM 게이팅, 루트 범위 제한 파일/경로 헬퍼, 외부 콘텐츠, 비밀 수집 헬퍼 |
  | `plugin-sdk/ssrf-policy` | SSRF 정책 헬퍼 | 호스트 허용 목록 및 사설 네트워크 정책 헬퍼 |
  | `plugin-sdk/ssrf-runtime` | SSRF 런타임 헬퍼 | 고정 디스패처, 보호된 fetch, SSRF 정책 헬퍼 |
  | `plugin-sdk/system-event-runtime` | 시스템 이벤트 헬퍼 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Heartbeat 헬퍼 | Heartbeat 깨우기, 이벤트, 가시성 헬퍼 |
  | `plugin-sdk/delivery-queue-runtime` | 전달 큐 헬퍼 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | 채널 활동 헬퍼 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 중복 제거 헬퍼 | 인메모리 및 영구 저장소 기반 중복 제거 캐시 |
  | `plugin-sdk/file-access-runtime` | 파일 접근 헬퍼 | 안전한 로컬 파일/미디어 경로 헬퍼 |
  | `plugin-sdk/transport-ready-runtime` | 전송 준비 상태 헬퍼 | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Exec 승인 정책 헬퍼 | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | 경계 있는 캐시 헬퍼 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 진단 게이팅 헬퍼 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 오류 포맷팅 헬퍼 | `formatUncaughtError`, `isApprovalNotFoundError`, 오류 그래프 헬퍼 |
  | `plugin-sdk/fetch-runtime` | 래핑된 fetch/프록시 헬퍼 | `resolveFetch`, 프록시 헬퍼, EnvHttpProxyAgent 옵션 헬퍼 |
  | `plugin-sdk/host-runtime` | 호스트 정규화 헬퍼 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 재시도 헬퍼 | `RetryConfig`, `retryAsync`, 정책 러너 |
  | `plugin-sdk/allow-from` | 허용 목록 포맷팅 및 입력 매핑 | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 명령 게이팅 및 명령 표면 헬퍼 | `resolveControlCommandGate`, 발신자 권한 부여 헬퍼, 동적 인수 메뉴 포맷팅을 포함한 명령 레지스트리 헬퍼 |
  | `plugin-sdk/command-status` | 명령 상태/도움말 렌더러 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 비밀 입력 파싱 | 비밀 입력 헬퍼 |
  | `plugin-sdk/webhook-ingress` | Webhook 요청 헬퍼 | Webhook 대상 유틸리티 |
  | `plugin-sdk/webhook-request-guards` | Webhook 본문 가드 헬퍼 | 요청 본문 읽기/제한 헬퍼 |
  | `plugin-sdk/reply-runtime` | 공유 답장 런타임 | 인바운드 디스패치, heartbeat, 답장 플래너, 청킹 |
  | `plugin-sdk/reply-dispatch-runtime` | 좁은 범위의 답장 디스패치 헬퍼 | 완료 처리, 제공자 디스패치, 대화 레이블 헬퍼 |
  | `plugin-sdk/reply-history` | 답장 기록 헬퍼 | `createChannelHistoryWindow`; `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` 같은 사용 중단된 맵 헬퍼 호환성 내보내기 |
  | `plugin-sdk/reply-reference` | 답장 참조 계획 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 답장 청크 헬퍼 | 텍스트/마크다운 청킹 헬퍼 |
  | `plugin-sdk/session-store-runtime` | 세션 저장소 헬퍼 | 저장소 경로 및 updated-at 헬퍼 |
  | `plugin-sdk/state-paths` | 상태 경로 헬퍼 | 상태 및 OAuth 디렉터리 헬퍼 |
  | `plugin-sdk/routing` | 라우팅/세션 키 헬퍼 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, 세션 키 정규화 헬퍼 |
  | `plugin-sdk/status-helpers` | 채널 상태 헬퍼 | 채널/계정 상태 요약 빌더, 런타임 상태 기본값, 이슈 메타데이터 헬퍼 |
  | `plugin-sdk/target-resolver-runtime` | 대상 리졸버 헬퍼 | 공유 대상 리졸버 헬퍼 |
  | `plugin-sdk/string-normalization-runtime` | 문자열 정규화 헬퍼 | 슬러그/문자열 정규화 헬퍼 |
  | `plugin-sdk/request-url` | 요청 URL 헬퍼 | 요청과 유사한 입력에서 문자열 URL 추출 |
  | `plugin-sdk/run-command` | 시간 제한 명령 헬퍼 | 정규화된 stdout/stderr를 제공하는 시간 제한 명령 실행기 |
  | `plugin-sdk/param-readers` | 매개변수 리더 | 공통 도구/CLI 매개변수 리더 |
  | `plugin-sdk/tool-payload` | 도구 페이로드 추출 | 도구 결과 객체에서 정규화된 페이로드 추출 |
  | `plugin-sdk/tool-send` | 도구 전송 추출 | 도구 인수에서 표준 전송 대상 필드 추출 |
  | `plugin-sdk/temp-path` | 임시 경로 헬퍼 | 공유 임시 다운로드 경로 헬퍼 |
  | `plugin-sdk/logging-core` | 로깅 헬퍼 | 하위 시스템 로거 및 수정 헬퍼 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 표 헬퍼 | Markdown 표 모드 헬퍼 |
  | `plugin-sdk/reply-payload` | 메시지 답장 타입 | 답장 페이로드 타입 |
  | `plugin-sdk/provider-setup` | 선별된 로컬/셀프 호스팅 제공자 설정 헬퍼 | 셀프 호스팅 제공자 검색/구성 헬퍼 |
  | `plugin-sdk/self-hosted-provider-setup` | OpenAI 호환 셀프 호스팅 제공자 설정 전용 헬퍼 | 동일한 셀프 호스팅 제공자 검색/구성 헬퍼 |
  | `plugin-sdk/provider-auth-runtime` | 제공자 런타임 인증 헬퍼 | 런타임 API 키 확인 헬퍼 |
  | `plugin-sdk/provider-auth-api-key` | 제공자 API 키 설정 헬퍼 | API 키 온보딩/프로필 쓰기 헬퍼 |
  | `plugin-sdk/provider-auth-result` | 제공자 인증 결과 헬퍼 | 표준 OAuth 인증 결과 빌더 |
  | `plugin-sdk/provider-selection-runtime` | 제공자 선택 헬퍼 | 구성된 또는 자동 제공자 선택 및 원시 제공자 구성 병합 |
  | `plugin-sdk/provider-env-vars` | 제공자 환경 변수 헬퍼 | 제공자 인증 환경 변수 조회 헬퍼 |
  | `plugin-sdk/provider-model-shared` | 공유 제공자 모델/재생 헬퍼 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 공유 재생 정책 빌더, 제공자 엔드포인트 헬퍼, 모델 ID 정규화 헬퍼 |
  | `plugin-sdk/provider-catalog-shared` | 공유 제공자 카탈로그 헬퍼 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | 제공자 온보딩 패치 | 온보딩 구성 헬퍼 |
  | `plugin-sdk/provider-http` | 제공자 HTTP 헬퍼 | 오디오 전사 multipart 양식 헬퍼를 포함한 범용 제공자 HTTP/엔드포인트 기능 헬퍼 |
  | `plugin-sdk/provider-web-fetch` | 제공자 web-fetch 헬퍼 | web-fetch 제공자 등록/캐시 헬퍼 |
  | `plugin-sdk/provider-web-search-config-contract` | 제공자 웹 검색 구성 헬퍼 | Plugin 활성화 배선이 필요 없는 제공자를 위한 좁은 웹 검색 구성/자격 증명 헬퍼 |
  | `plugin-sdk/provider-web-search-contract` | 제공자 웹 검색 계약 헬퍼 | `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` 및 범위 지정 자격 증명 setter/getter와 같은 좁은 웹 검색 구성/자격 증명 계약 헬퍼 |
  | `plugin-sdk/provider-web-search` | 제공자 웹 검색 헬퍼 | 웹 검색 제공자 등록/캐시/런타임 헬퍼 |
  | `plugin-sdk/provider-tools` | 제공자 도구/스키마 호환 헬퍼 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` 및 DeepSeek/Gemini/OpenAI 스키마 정리 + 진단 |
  | `plugin-sdk/provider-usage` | 제공자 사용량 헬퍼 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 및 기타 제공자 사용량 헬퍼 |
  | `plugin-sdk/provider-stream` | 제공자 스트림 래퍼 헬퍼 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 스트림 래퍼 타입, 공유 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 래퍼 헬퍼 |
  | `plugin-sdk/provider-transport-runtime` | 제공자 전송 헬퍼 | 보호된 fetch, 도구 결과 텍스트 추출, 전송 메시지 변환, 쓰기 가능한 전송 이벤트 스트림과 같은 네이티브 제공자 전송 헬퍼 |
  | `plugin-sdk/keyed-async-queue` | 순서가 보장되는 비동기 큐 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 공유 미디어 헬퍼 | 미디어 가져오기/변환/저장 헬퍼, ffprobe 기반 비디오 크기 탐색, 미디어 페이로드 빌더 |
  | `plugin-sdk/media-generation-runtime` | 공유 미디어 생성 헬퍼 | 이미지/비디오/음악 생성을 위한 공유 장애 조치 헬퍼, 후보 선택, 누락된 모델 메시징 |
  | `plugin-sdk/media-understanding` | 미디어 이해 헬퍼 | 미디어 이해 제공자 타입 및 제공자용 이미지/오디오 헬퍼 내보내기 |
  | `plugin-sdk/text-runtime` | 더 이상 사용되지 않는 광범위한 텍스트 호환성 내보내기 | `string-coerce-runtime`, `text-chunking`, `text-utility-runtime`, `logging-core` 사용 |
  | `plugin-sdk/text-chunking` | 텍스트 청킹 헬퍼 | 아웃바운드 텍스트 청킹 헬퍼 |
  | `plugin-sdk/speech` | 음성 헬퍼 | 음성 제공자 타입 및 제공자용 지시문, 레지스트리, 검증 헬퍼, OpenAI 호환 TTS 빌더 |
  | `plugin-sdk/speech-core` | 공유 음성 코어 | 음성 제공자 타입, 레지스트리, 지시문, 정규화 |
  | `plugin-sdk/realtime-transcription` | 실시간 전사 헬퍼 | 제공자 타입, 레지스트리 헬퍼, 공유 WebSocket 세션 헬퍼 |
  | `plugin-sdk/realtime-voice` | 실시간 음성 헬퍼 | 제공자 타입, 레지스트리/확인 헬퍼, 브리지 세션 헬퍼, 공유 에이전트 talk-back 큐, 활성 실행 음성 제어, 전사/이벤트 상태, 에코 억제, 상담 질문 매칭, 강제 상담 조정, 턴 컨텍스트 추적, 출력 활동 추적, 빠른 컨텍스트 상담 헬퍼 |
  | `plugin-sdk/image-generation` | 이미지 생성 헬퍼 | 이미지 생성 제공자 타입 및 이미지 에셋/데이터 URL 헬퍼, OpenAI 호환 이미지 제공자 빌더 |
  | `plugin-sdk/image-generation-core` | 공유 이미지 생성 코어 | 이미지 생성 타입, 장애 조치, 인증, 레지스트리 헬퍼 |
  | `plugin-sdk/music-generation` | 음악 생성 헬퍼 | 음악 생성 제공자/요청/결과 타입 |
  | `plugin-sdk/music-generation-core` | 공유 음악 생성 코어 | 음악 생성 타입, 장애 조치 헬퍼, 제공자 조회, 모델 참조 파싱 |
  | `plugin-sdk/video-generation` | 비디오 생성 헬퍼 | 비디오 생성 제공자/요청/결과 타입 |
  | `plugin-sdk/video-generation-core` | 공유 비디오 생성 코어 | 비디오 생성 타입, 장애 조치 헬퍼, 제공자 조회, 모델 참조 파싱 |
  | `plugin-sdk/interactive-runtime` | 대화형 답장 헬퍼 | 대화형 답장 페이로드 정규화/축소 |
  | `plugin-sdk/channel-config-primitives` | 채널 구성 기본 요소 | 좁은 채널 구성 스키마 기본 요소 |
  | `plugin-sdk/channel-config-writes` | 채널 구성 쓰기 헬퍼 | 채널 구성 쓰기 권한 부여 헬퍼 |
  | `plugin-sdk/channel-plugin-common` | 공유 채널 프렐류드 | 공유 채널 Plugin 프렐류드 내보내기 |
  | `plugin-sdk/channel-status` | 채널 상태 헬퍼 | 공유 채널 상태 스냅샷/요약 헬퍼 |
  | `plugin-sdk/allowlist-config-edit` | allowlist 구성 헬퍼 | allowlist 구성 편집/읽기 헬퍼 |
  | `plugin-sdk/group-access` | 그룹 접근 헬퍼 | 공유 그룹 접근 결정 헬퍼 |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | 더 이상 사용되지 않는 호환성 파사드 | `plugin-sdk/channel-inbound` 사용 |
  | `plugin-sdk/direct-dm-guard-policy` | Direct-DM 가드 헬퍼 | 좁은 사전 암호화 가드 정책 헬퍼 |
  | `plugin-sdk/extension-shared` | 공유 확장 헬퍼 | 패시브 채널/상태 및 ambient 프록시 헬퍼 기본 요소 |
  | `plugin-sdk/webhook-targets` | Webhook 대상 헬퍼 | Webhook 대상 레지스트리 및 라우트 설치 헬퍼 |
  | `plugin-sdk/webhook-path` | 더 이상 사용되지 않는 Webhook 경로 별칭 | `plugin-sdk/webhook-ingress` 사용 |
  | `plugin-sdk/web-media` | 공유 웹 미디어 헬퍼 | 원격/로컬 미디어 로딩 헬퍼 |
  | `plugin-sdk/zod` | 더 이상 사용되지 않는 Zod 호환성 다시 내보내기 | `zod`에서 `zod`를 직접 가져오기 |
  | `plugin-sdk/memory-core` | 번들 memory-core 헬퍼 | 메모리 관리자/구성/파일/CLI 헬퍼 표면 |
  | `plugin-sdk/memory-core-engine-runtime` | 메모리 엔진 런타임 파사드 | 메모리 색인/검색 런타임 파사드 |
  | `plugin-sdk/memory-core-host-embedding-registry` | 메모리 임베딩 레지스트리 | 경량 메모리 임베딩 제공자 레지스트리 헬퍼 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 메모리 호스트 foundation 엔진 | 메모리 호스트 foundation 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 메모리 호스트 임베딩 엔진 | 메모리 임베딩 계약, 레지스트리 접근, 로컬 제공자, 범용 배치/원격 헬퍼; 구체적인 원격 제공자는 해당 소유 Plugin에 위치 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 메모리 호스트 QMD 엔진 | 메모리 호스트 QMD 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-engine-storage` | 메모리 호스트 스토리지 엔진 | 메모리 호스트 스토리지 엔진 내보내기 |
  | `plugin-sdk/memory-core-host-multimodal` | 메모리 호스트 멀티모달 헬퍼 | 메모리 호스트 멀티모달 헬퍼 |
  | `plugin-sdk/memory-core-host-query` | 메모리 호스트 쿼리 헬퍼 | 메모리 호스트 쿼리 헬퍼 |
  | `plugin-sdk/memory-core-host-secret` | 메모리 호스트 비밀 헬퍼 | 메모리 호스트 비밀 헬퍼 |
  | `plugin-sdk/memory-core-host-events` | 더 이상 사용되지 않는 메모리 이벤트 별칭 | `plugin-sdk/memory-host-events` 사용 |
  | `plugin-sdk/memory-core-host-status` | 메모리 호스트 상태 헬퍼 | 메모리 호스트 상태 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 메모리 호스트 CLI 런타임 | 메모리 호스트 CLI 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-core` | 메모리 호스트 코어 런타임 | 메모리 호스트 코어 런타임 헬퍼 |
  | `plugin-sdk/memory-core-host-runtime-files` | 메모리 호스트 파일/런타임 헬퍼 | 메모리 호스트 파일/런타임 헬퍼 |
  | `plugin-sdk/memory-host-core` | 메모리 호스트 코어 런타임 별칭 | 벤더 중립 메모리 호스트 코어 런타임 헬퍼 별칭 |
  | `plugin-sdk/memory-host-events` | 메모리 호스트 이벤트 저널 별칭 | 벤더 중립 메모리 호스트 이벤트 저널 헬퍼 별칭 |
  | `plugin-sdk/memory-host-files` | 더 이상 사용되지 않는 메모리 파일/런타임 별칭 | `plugin-sdk/memory-core-host-runtime-files` 사용 |
  | `plugin-sdk/memory-host-markdown` | 관리형 Markdown 헬퍼 | 메모리 인접 Plugin을 위한 공유 관리형 Markdown 헬퍼 |
  | `plugin-sdk/memory-host-search` | Active memory 검색 파사드 | 지연 로드 active-memory 검색 관리자 런타임 파사드 |
  | `plugin-sdk/memory-host-status` | 더 이상 사용되지 않는 메모리 호스트 상태 별칭 | `plugin-sdk/memory-core-host-status` 사용 |
  | `plugin-sdk/testing` | 테스트 유틸리티 | 저장소 로컬의 더 이상 사용되지 않는 호환성 배럴; `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env`, `plugin-sdk/test-fixtures`와 같은 집중된 저장소 로컬 테스트 하위 경로를 사용 |
</Accordion>

이 표는 전체 SDK 표면이 아니라 의도적으로 공통 마이그레이션 하위 집합만 다룹니다. 컴파일러 엔트리포인트 인벤토리는
`scripts/lib/plugin-sdk-entrypoints.json`에 있으며, 패키지 exports는 공개 하위 집합에서 생성됩니다.

예약된 번들 Plugin 헬퍼 이음새는 폐기된 `plugin-sdk/discord` shim처럼 게시된
`@openclaw/discord@2026.3.13` 패키지를 위해 유지되는 명시적으로 문서화된 호환성 facade를 제외하고 공개 SDK
export map에서 은퇴되었습니다. 소유자별 헬퍼는 해당 소유 Plugin 패키지 안에 있습니다. 공유 호스트 동작은
`plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`,
`plugin-sdk/plugin-config-runtime` 같은 일반 SDK 계약을 통해 이동해야 합니다.

작업에 맞는 가장 좁은 import를 사용하세요. export를 찾을 수 없다면
`src/plugin-sdk/`의 소스를 확인하거나 어떤 일반 계약이 그것을 소유해야 하는지 메인테이너에게 문의하세요.

## 활성 지원 중단 항목

Plugin SDK, 공급자 계약, 런타임 표면, 매니페스트 전반에 적용되는 더 좁은 지원 중단 항목입니다. 각 항목은 오늘도 여전히 동작하지만 향후 메이저 릴리스에서 제거됩니다. 각 항목 아래의 엔트리는 이전 API를 표준 대체 항목에 매핑합니다.

<AccordionGroup>
  <Accordion title="command-auth 도움말 빌더 → command-status">
    **이전 (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **새 방식 (`openclaw/plugin-sdk/command-status`)**: 같은 시그니처, 같은
    exports - 더 좁은 하위 경로에서 import하기만 하면 됩니다. `command-auth`는
    호환성 stub으로 이들을 다시 export합니다.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="멘션 게이팅 헬퍼 → resolveInboundMentionDecision">
    **이전**: `openclaw/plugin-sdk/channel-inbound` 또는
    `openclaw/plugin-sdk/channel-mention-gating`의
    `resolveInboundMentionRequirement({ facts, policy })` 및
    `shouldDropInboundForMention(...)`.

    **새 방식**: `resolveInboundMentionDecision({ facts, policy })` - 두 개의
    분리된 호출 대신 단일 결정 객체를 반환합니다.

    하위 채널 Plugin(Slack, Discord, Matrix, MS Teams)은 이미 전환되었습니다.

  </Accordion>

  <Accordion title="채널 런타임 shim 및 채널 액션 헬퍼">
    `openclaw/plugin-sdk/channel-runtime`은 이전 채널 Plugin을 위한 호환성 shim입니다.
    새 코드에서 import하지 마세요. 런타임 객체 등록에는
    `openclaw/plugin-sdk/channel-runtime-context`를 사용하세요.

    `openclaw/plugin-sdk/channel-actions`의 `channelActions*` 헬퍼는 원시
    "actions" 채널 exports와 함께 지원 중단되었습니다. 대신 의미론적
    `presentation` 표면을 통해 기능을 노출하세요 - 채널 Plugin은 수락하는 원시 액션 이름이 아니라
    렌더링하는 대상(카드, 버튼, 선택)을 선언합니다.

  </Accordion>

  <Accordion title="웹 검색 공급자 tool() 헬퍼 → Plugin의 createTool()">
    **이전**: `openclaw/plugin-sdk/provider-web-search`의 `tool()` 팩터리.

    **새 방식**: 공급자 Plugin에 `createTool(...)`을 직접 구현하세요.
    OpenClaw는 더 이상 도구 래퍼를 등록하기 위해 SDK 헬퍼가 필요하지 않습니다.

  </Accordion>

  <Accordion title="평문 채널 envelope → BodyForAgent">
    **이전**: 인바운드 채널 메시지에서 평평한 평문 프롬프트 envelope를 만들기 위한
    `formatInboundEnvelope(...)` 및 `ChannelMessageForAgent.channelEnvelope`.

    **새 방식**: `BodyForAgent`와 구조화된 사용자 컨텍스트 블록입니다. 채널
    Plugin은 라우팅 메타데이터(thread, topic, reply-to, reactions)를 프롬프트 문자열에 이어 붙이는 대신
    타입이 지정된 필드로 첨부합니다. 합성된 어시스턴트 대상 envelope에는
    `formatAgentEnvelope(...)` 헬퍼가 여전히 지원되지만, 인바운드 평문 envelope는
    제거될 예정입니다.

    영향 영역: `inbound_claim`, `message_received`, 그리고 `channelEnvelope` 텍스트를 후처리한 모든 커스텀
    채널 Plugin.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **이전**: `api.on("deactivate", handler)`.

    **새 방식**: `api.on("gateway_stop", handler)`. 이벤트와 컨텍스트는 같은
    종료 정리 계약이며, hook 이름만 변경됩니다.

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

    `deactivate`는 2026-08-16 이후까지 지원 중단된 호환성 alias로 계속 연결되어 있습니다.

  </Accordion>

  <Accordion title="subagent_spawning hook → 코어 thread 바인딩">
    **이전**: `threadBindingReady` 또는 `deliveryOrigin`을 반환하는
    `api.on("subagent_spawning", handler)`.

    **새 방식**: 코어가 채널 세션 바인딩 어댑터를 통해 `thread: true` 하위 에이전트 바인딩을 준비하게 하세요.
    출시 후 관찰에만 `api.on("subagent_spawned", handler)`를 사용하세요.

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
    지원 중단된 호환성 표면으로만 남습니다.

  </Accordion>

  <Accordion title="공급자 발견 타입 → 공급자 카탈로그 타입">
    네 가지 발견 타입 alias는 이제 카탈로그 시대 타입 위의 얇은 래퍼입니다.

    | 이전 alias                 | 새 타입                  |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    여기에 레거시 `ProviderCapabilities` 정적 묶음도 포함됩니다 - 공급자 Plugin은 정적 객체 대신
    `buildReplayPolicy`, `normalizeToolSchemas`, `wrapStreamFn` 같은 명시적 공급자 hook을 사용해야 합니다.

  </Accordion>

  <Accordion title="Thinking 정책 hook → resolveThinkingProfile">
    **이전** (`ProviderThinkingPolicy`의 세 가지 별도 hook):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)`, 그리고
    `resolveDefaultThinkingLevel(ctx)`.

    **새 방식**: 표준 `id`, 선택적 `label`, 순위가 매겨진 level 목록을 포함한
    `ProviderThinkingProfile`을 반환하는 단일 `resolveThinkingProfile(ctx)`입니다. OpenClaw는 저장된 오래된 값을
    프로필 순위에 따라 자동으로 다운그레이드합니다.

    컨텍스트에는 `provider`, `modelId`, 선택적으로 병합된 `reasoning`,
    그리고 선택적으로 병합된 모델 `compat` facts가 포함됩니다. 공급자 Plugin은 구성된 요청 계약이 지원할 때만
    이러한 카탈로그 facts를 사용해 모델별 프로필을 노출할 수 있습니다.

    세 개 대신 하나의 hook을 구현하세요. 레거시 hook은 지원 중단 기간 동안 계속 동작하지만
    프로필 결과와 합성되지는 않습니다.

  </Accordion>

  <Accordion title="외부 인증 공급자 → contracts.externalAuthProviders">
    **이전**: Plugin 매니페스트에 공급자를 선언하지 않고 외부 인증 hook을 구현함.

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

  <Accordion title="공급자 env-var 조회 → setup.providers[].envVars">
    **이전** 매니페스트 필드: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **새 방식**: 같은 env-var 조회를 매니페스트의 `setup.providers[].envVars`에 미러링하세요.
    이렇게 하면 setup/status env 메타데이터가 한곳으로 통합되고, env-var 조회에 답하기 위해
    Plugin 런타임을 부팅하지 않아도 됩니다.

    `providerAuthEnvVars`는 지원 중단 기간이 끝날 때까지 호환성 어댑터를 통해 계속 지원됩니다.

  </Accordion>

  <Accordion title="Memory Plugin 등록 → registerMemoryCapability">
    **이전**: 세 개의 별도 호출 -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **새 방식**: memory-state API에서 한 번 호출 -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    같은 슬롯, 단일 등록 호출입니다. 추가형 프롬프트 및 코퍼스 헬퍼
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`)는 영향을 받지 않습니다.

  </Accordion>

  <Accordion title="Memory 임베딩 공급자 API">
    **이전**: `api.registerMemoryEmbeddingProvider(...)`와
    `contracts.memoryEmbeddingProviders`.

    **새 방식**: `api.registerEmbeddingProvider(...)`와
    `contracts.embeddingProviders`.

    일반 임베딩 공급자 계약은 Memory 외부에서도 재사용 가능하며 새 공급자에 지원되는 경로입니다.
    Memory 전용 등록 API는 기존 공급자가 마이그레이션하는 동안 지원 중단된 호환성으로 계속 연결되어 있습니다.
    Plugin 검사 보고서는 번들되지 않은 사용을 호환성 부채로 보고합니다.

  </Accordion>

  <Accordion title="하위 에이전트 세션 메시지 타입 이름 변경">
    `src/plugins/runtime/types.ts`에서 아직 export되는 두 개의 레거시 타입 alias:

    | 이전                           | 새 이름                             |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    런타임 메서드 `readSession`은 `getSessionMessages`를 위해 지원 중단되었습니다.
    같은 시그니처이며, 이전 메서드는 새 메서드로 호출을 넘깁니다.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **이전**: `runtime.tasks.flow`(단수)는 라이브 task-flow 접근자를 반환했습니다.

    **새 방식**: `runtime.tasks.managedFlows`는 flow에서 자식 task를 생성, 업데이트, 취소 또는 실행하는
    Plugin을 위해 관리형 TaskFlow 변경 런타임을 유지합니다. Plugin이 DTO 기반 읽기만 필요로 할 때는
    `runtime.tasks.flows`를 사용하세요.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="내장 extension 팩터리 → 에이전트 도구 결과 미들웨어">
    위의 "마이그레이션 방법 → 내장 도구 결과 extension을 미들웨어로 마이그레이션"에서 다룹니다.
    완전성을 위해 여기에도 포함합니다. 제거된 embedded-runner 전용
    `api.registerEmbeddedExtensionFactory(...)` 경로는
    `contracts.agentToolResultMiddleware`의 명시적 런타임 목록과 함께
    `api.registerAgentToolResultMiddleware(...)`로 대체됩니다.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `openclaw/plugin-sdk`에서 다시 export되는 `OpenClawSchemaType`은 이제
    `OpenClawConfig`의 한 줄 alias입니다. 표준 이름을 선호하세요.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
`extensions/` 아래의 번들 채널/공급자 Plugin 내부에 있는 extension 수준 지원 중단 항목은
각자의 `api.ts` 및 `runtime-api.ts` barrel 안에서 추적됩니다. 이들은 서드파티 Plugin 계약에 영향을 주지 않으며
여기에는 나열되지 않습니다. 번들 Plugin의 로컬 barrel을 직접 소비한다면 업그레이드하기 전에
해당 barrel의 지원 중단 주석을 읽으세요.
</Note>

## 제거 일정

| 시점                   | 발생하는 일                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| **지금**               | 지원 중단된 인터페이스가 런타임 경고를 내보냅니다                      |
| **다음 메이저 릴리스** | 지원 중단된 인터페이스가 제거되며, 여전히 이를 사용하는 Plugin은 실패합니다 |

모든 핵심 Plugin은 이미 마이그레이션되었습니다. 외부 Plugin은 다음 메이저 릴리스 전에
마이그레이션해야 합니다.

## 경고를 일시적으로 숨기기

마이그레이션 작업 중에는 다음 환경 변수를 설정하세요.

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

이는 영구적인 해결책이 아니라 임시 우회 수단입니다.

## 관련 항목

- [시작하기](/ko/plugins/building-plugins) - 첫 Plugin 빌드하기
- [SDK 개요](/ko/plugins/sdk-overview) - 전체 하위 경로 가져오기 참조
- [채널 Plugin](/ko/plugins/sdk-channel-plugins) - 채널 Plugin 빌드하기
- [Provider Plugin](/ko/plugins/sdk-provider-plugins) - Provider Plugin 빌드하기
- [Plugin 내부](/ko/plugins/architecture) - 아키텍처 심층 분석
- [Plugin 매니페스트](/ko/plugins/manifest) - 매니페스트 스키마 참조
