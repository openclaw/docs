---
read_when:
    - 음성 깨우기 단어의 동작 또는 기본값 변경하기
    - 웨이크 워드 동기화가 필요한 새 Node 플랫폼 추가하기
summary: 전역 음성 깨우기 단어(Gateway에서 관리) 및 Node 간 동기화 방식
title: 음성 호출
x-i18n:
    generated_at: "2026-07-16T12:47:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aef2a5bba664ce10fb6ab457bb6d202639dcc6c0a9df61567e7cb402c290bbec
    source_path: nodes/voicewake.md
    workflow: 16
---

웨이크 워드는 **Gateway가 소유하는 하나의 전역 목록**입니다. 노드별 사용자 지정 목록은 없습니다. 모든 Node 또는 앱 UI에서 목록을 편집할 수 있으며, Gateway는 변경 사항을 유지하고 연결된 모든 클라이언트에 브로드캐스트합니다.

- **macOS**: 로컬 음성 깨우기 활성화/비활성화 토글입니다. macOS 26 이상이 필요합니다. 런타임/PTT 세부 정보는 [음성 깨우기(macOS)](/ko/platforms/mac/voicewake)를 참조하십시오.
- **iOS**: Settings의 로컬 음성 깨우기 활성화/비활성화 토글입니다.
- **Android**: Settings → Voice의 로컬 음성 깨우기 활성화/비활성화 토글 및 웨이크 워드 편집기입니다. Android 기기 내 음성 인식이 필요합니다.

## 저장소

웨이크 워드와 라우팅 규칙은 Gateway 상태 데이터베이스에 저장되며, 기본값은 `~/.openclaw/state/openclaw.sqlite`입니다(`OPENCLAW_STATE_DIR`로 재정의). 테이블은 `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`입니다. 레거시 `settings/voicewake.json` 및 `settings/voicewake-routing.json`은 `openclaw doctor --fix` 마이그레이션 입력으로만 사용되며, 런타임에서는 절대 읽지 않습니다.

## 프로토콜

### 트리거 목록

| 메서드          | 매개변수                   | 결과                   |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | 없음                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set`은 입력을 정규화합니다. 공백을 제거하고, 빈 항목을 삭제하며, 트리거를 최대 32개까지 유지하고, 서로게이트 쌍을 분리하지 않으면서 각각을 64 UTF-16 코드 단위로 자릅니다. 결과가 비어 있으면 기본 내장값(`openclaw`, `claude`, `computer`)으로 대체됩니다.

### 라우팅(트리거에서 대상으로)

| 메서드                  | 매개변수                               | 결과                               |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | 없음                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "로봇 깨우기", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

각 라우트 `target`는 다음 중 정확히 하나를 지원합니다.

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

제한: 라우트는 최대 32개이며, 트리거 텍스트는 최대 64자입니다. 일치 및 중복 감지를 위해 라우트 트리거를 소문자로 변환하고, 각 단어의 앞뒤 문장 부호를 제거하고, 공백을 축약하여 정규화합니다(`"Hey, Bot!!"`과 `"hey bot"`은 일치하며 중복으로 계산됨). 이는 위의 전역 트리거 목록에 사용되는 단순 공백 제거보다 더 엄격한 정규화입니다.

### 이벤트

| 이벤트                       | 페이로드                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

두 이벤트 모두 읽기 범위를 가진 모든 WebSocket 클라이언트(macOS 앱, WebChat 등)와 연결된 모든 Node에 브로드캐스트됩니다. 또한 Node는 연결 직후 두 이벤트를 초기 스냅샷 푸시로 받습니다.

## 클라이언트 동작

- **macOS**: `voicewake.set`/`voicewake.get`을 호출하고 다른 클라이언트와 동기화된 상태를 유지하기 위해 `voicewake.changed`을 수신합니다.
- **iOS**: `voicewake.set`/`voicewake.get`을 호출하고 로컬 웨이크 워드 감지가 즉시 반응하도록 `voicewake.changed`을 수신합니다.
- **Android**: `voicewake.set`/`voicewake.get`을 호출하고, `voicewake.changed`을 수신하며, 활성화된 동안 `voiceWake`을 알립니다. 인식은 기기 내에서 포그라운드 상태일 때만 수행됩니다. Talk, 수동 받아쓰기, 음성 메모 캡처 또는 메시지 음성 기능이 오디오를 사용 중일 때는 일시 중지됩니다.

## 관련 항목

- [Talk 모드](/ko/nodes/talk)
- [오디오 및 음성 메모](/ko/nodes/audio)
- [미디어 이해](/ko/nodes/media-understanding)
