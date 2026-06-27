---
read_when:
    - 음성 호출어 동작 또는 기본값 변경
    - 웨이크 워드 동기화가 필요한 새 Node 플랫폼 추가
summary: 전역 음성 웨이크 워드(Gateway 소유)와 Node 간 동기화 방식
title: 음성 깨우기
x-i18n:
    generated_at: "2026-06-27T17:39:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c57955e8061eca2f9fec83500e829f183cd3ef9f794bf385823a28f9c89b0a4
    source_path: nodes/voicewake.md
    workflow: 16
---

OpenClaw는 **깨우기 단어를 Gateway가 소유하는 단일 전역 목록**으로 취급합니다.

- **노드별 사용자 지정 깨우기 단어는 없습니다**.
- **모든 노드/앱 UI가** 목록을 편집할 수 있으며, 변경 사항은 Gateway에 의해 영구 저장되고 모두에게 브로드캐스트됩니다.
- macOS와 iOS는 로컬 **음성 깨우기 활성화/비활성화** 토글을 유지합니다(로컬 UX와 권한이 다릅니다).
- Android는 현재 음성 깨우기를 꺼 둔 상태이며 Voice 탭에서 수동 마이크 흐름을 사용합니다.

## 저장소(Gateway 호스트)

깨우기 단어와 라우팅 규칙은 Gateway 상태 데이터베이스에 저장됩니다.

- `~/.openclaw/state/openclaw.sqlite`

활성 테이블은 다음과 같습니다.

- `voicewake_triggers`
- `voicewake_routing_config`
- `voicewake_routing_routes`

레거시 `settings/voicewake.json` 및 `settings/voicewake-routing.json` 파일은
doctor 마이그레이션 입력으로만 사용됩니다. 런타임은 SQLite 테이블을 읽고 씁니다.

## 프로토콜

### 메서드

- `voicewake.get` → `{ triggers: string[] }`
- `voicewake.set`에 params `{ triggers: string[] }` 사용 → `{ triggers: string[] }`

참고:

- 트리거는 정규화됩니다(앞뒤 공백 제거, 빈 항목 제거). 빈 목록은 기본값으로 대체됩니다.
- 안전을 위해 제한이 적용됩니다(개수/길이 상한).

### 라우팅 메서드(트리거 → 대상)

- `voicewake.routing.get` → `{ config: VoiceWakeRoutingConfig }`
- `voicewake.routing.set`에 params `{ config: VoiceWakeRoutingConfig }` 사용 → `{ config: VoiceWakeRoutingConfig }`

`VoiceWakeRoutingConfig` 형태:

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

라우트 대상은 다음 중 정확히 하나를 지원합니다.

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

### 이벤트

- `voicewake.changed` 페이로드 `{ triggers: string[] }`
- `voicewake.routing.changed` 페이로드 `{ config: VoiceWakeRoutingConfig }`

수신 대상:

- 모든 WebSocket 클라이언트(macOS 앱, WebChat 등)
- 연결된 모든 노드(iOS/Android), 그리고 노드 연결 시 초기 "현재 상태" 푸시로도 전송됩니다.

## 클라이언트 동작

### macOS 앱

- 전역 목록을 사용해 `VoiceWakeRuntime` 트리거를 제어합니다.
- 음성 깨우기 설정에서 "트리거 단어"를 편집하면 `voicewake.set`을 호출한 뒤 브로드캐스트에 의존해 다른 클라이언트와 동기화 상태를 유지합니다.

### iOS 노드

- 전역 목록을 `VoiceWakeManager` 트리거 감지에 사용합니다.
- 설정에서 깨우기 단어를 편집하면 `voicewake.set`(Gateway WS를 통해)을 호출하고 로컬 깨우기 단어 감지도 계속 반응성 있게 유지합니다.

### Android 노드

- 음성 깨우기는 현재 Android 런타임/설정에서 비활성화되어 있습니다.
- Android 음성은 깨우기 단어 트리거 대신 Voice 탭에서 수동 마이크 캡처를 사용합니다.

## 관련 항목

- [대화 모드](/ko/nodes/talk)
- [오디오 및 음성 메모](/ko/nodes/audio)
- [미디어 이해](/ko/nodes/media-understanding)
