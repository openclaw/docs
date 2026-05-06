---
read_when:
    - 음성 웨이크 워드 동작 또는 기본값 변경
    - 웨이크 워드 동기화가 필요한 새 Node 플랫폼 추가
summary: 전역 음성 호출어(Gateway 소유)와 노드 간 동기화 방식
title: 음성 깨우기
x-i18n:
    generated_at: "2026-05-06T06:32:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a284cbe3e12784a8d7a3eab6ba8ae230123557bca7593c956111199b94b91b73
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw는 **웨이크 워드를 Gateway가 소유하는 단일 전역 목록**으로 취급합니다.

- **노드별 사용자 지정 웨이크 워드는 없습니다**.
- **모든 노드/앱 UI가 목록을 수정할 수 있습니다**. 변경 사항은 Gateway에 의해 저장되고 모두에게 브로드캐스트됩니다.
- macOS와 iOS는 로컬 **Voice Wake 활성화/비활성화** 토글을 유지합니다(로컬 UX와 권한이 다릅니다).
- Android는 현재 Voice Wake를 꺼 둔 상태이며 Voice 탭에서 수동 마이크 흐름을 사용합니다.

## 저장소(Gateway 호스트)

웨이크 워드는 Gateway 머신의 다음 위치에 저장됩니다.

- `~/.openclaw/settings/voicewake.json`

형태:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 프로토콜

### 메서드

- `voicewake.get` → `{ triggers: string[] }`
- 매개변수 `{ triggers: string[] }`가 있는 `voicewake.set` → `{ triggers: string[] }`

참고:

- 트리거는 정규화됩니다(앞뒤 공백 제거, 빈 값 제거). 빈 목록은 기본값으로 되돌아갑니다.
- 안전을 위해 제한이 적용됩니다(개수/길이 상한).

### 라우팅 메서드(트리거 → 대상)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- 매개변수 `{ config: VoiceWakeRoutingConfig }`가 있는 `voicewake.routing.set` → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` 형태:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

라우트 대상은 정확히 다음 중 하나를 지원합니다.

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### 이벤트

- `voicewake.changed` 페이로드 `{ triggers: string[] }`
- `voicewake.routing.changed` 페이로드 `{ config: VoiceWakeRoutingConfig }`

수신 대상:

- 모든 WebSocket 클라이언트(macOS 앱, WebChat 등)
- 연결된 모든 노드(iOS/Android). 또한 노드 연결 시 초기 "현재 상태" 푸시로도 전송됩니다.

## 클라이언트 동작

### macOS 앱

- 전역 목록을 사용해 `VoiceWakeRuntime` 트리거를 제한합니다.
- Voice Wake 설정에서 "Trigger words"를 수정하면 `voicewake.set`을 호출한 뒤, 브로드캐스트를 통해 다른 클라이언트와 동기화를 유지합니다.

### iOS 노드

- `VoiceWakeManager` 트리거 감지에 전역 목록을 사용합니다.
- 설정에서 Wake Words를 수정하면(Gateway WS를 통해) `voicewake.set`을 호출하며, 로컬 웨이크 워드 감지도 계속 반응성 있게 유지합니다.

### Android 노드

- Android 런타임/설정에서는 현재 Voice Wake가 비활성화되어 있습니다.
- Android 음성은 웨이크 워드 트리거 대신 Voice 탭에서 수동 마이크 캡처를 사용합니다.

## 관련 항목

- [대화 모드](/ko/nodes/talk)
- [오디오 및 음성 노트](/ko/nodes/audio)
- [미디어 이해](/ko/nodes/media-understanding)
