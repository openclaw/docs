---
read_when:
    - 음성 웨이크 워드 동작 또는 기본값 변경
    - 웨이크 워드 동기화가 필요한 새 Node 플랫폼 추가
summary: 전역 음성 웨이크 워드(Gateway 소유)와 노드 간 동기화 방식
title: 음성 웨이크
x-i18n:
    generated_at: "2026-04-26T11:34:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: ac638cdf89f09404cdf293b416417f6cb3e31865b09f04ef87b9604e436dcbbe
    source_path: nodes/voicewake.md
    workflow: 15
---

OpenClaw는 **웨이크 워드**를 **Gateway**가 소유하는 **단일 전역 목록**으로 취급합니다.

- **Node별 사용자 지정 웨이크 워드는 없습니다.**
- **어떤 Node/앱 UI에서도** 목록을 편집할 수 있으며, 변경 사항은 Gateway가 저장하고 모두에게 브로드캐스트합니다.
- macOS와 iOS는 로컬 **Voice Wake 활성화/비활성화** 토글을 유지합니다(로컬 UX와 권한이 다름).
- Android는 현재 Voice Wake를 끄고 Voice 탭에서 수동 마이크 흐름을 사용합니다.

## 저장 위치(Gateway 호스트)

웨이크 워드는 Gateway 머신의 다음 위치에 저장됩니다.

- `~/.openclaw/settings/voicewake.json`

형식:

```json
{ "triggers": ["openclaw", "claude", "computer"], "updatedAtMs": 1730000000000 }
```

## 프로토콜

### 메서드

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set` with params `{ triggers: string[] }` → `{ triggers: string[] }`

참고:

- 트리거는 정규화됩니다(공백 제거, 빈 값 삭제). 빈 목록은 기본값으로 대체됩니다.
- 안전을 위해 제한(개수/길이 상한)이 적용됩니다.

### 라우팅 메서드(트리거 → 대상)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set` with params `{ config: VoiceWakeRoutingConfig }` → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` 형식:

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
- 연결된 모든 Node(iOS/Android), 그리고 Node 연결 시 초기 “현재 상태” 푸시도 함께 전송됨

## 클라이언트 동작

### macOS 앱

- 전역 목록을 사용해 `VoiceWakeRuntime` 트리거를 제어합니다.
- Voice Wake 설정의 “Trigger words”를 편집하면 `voicewake.set`을 호출하고, 이후 브로드캐스트를 통해 다른 클라이언트와의 동기화를 유지합니다.

### iOS Node

- 전역 목록을 사용해 `VoiceWakeManager` 트리거 감지를 수행합니다.
- Settings에서 Wake Words를 편집하면 `voicewake.set`(Gateway WS를 통해)을 호출하고, 동시에 로컬 웨이크 워드 감지도 반응성을 유지합니다.

### Android Node

- Android 런타임/Settings에서는 현재 Voice Wake가 비활성화되어 있습니다.
- Android 음성은 웨이크 워드 트리거 대신 Voice 탭의 수동 마이크 캡처를 사용합니다.

## 관련 항목

- [Talk 모드](/ko/nodes/talk)
- [오디오 및 음성 메모](/ko/nodes/audio)
- [미디어 이해](/ko/nodes/media-understanding)
