---
read_when:
    - 음성 깨우기 단어의 동작 또는 기본값 변경
    - 깨우기 단어 동기화가 필요한 새 Node 플랫폼 추가하기
summary: 전역 음성 깨우기 단어(Gateway에서 관리) 및 Node 간 동기화 방식
title: 음성 깨우기
x-i18n:
    generated_at: "2026-07-12T15:25:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8a8c7a8bb2ee5bbc57d9141cd8f2176246cc61952b0ed42257f83af2c777427
    source_path: nodes/voicewake.md
    workflow: 16
---

호출어는 **Gateway가 소유하는 하나의 전역 목록**입니다. 노드별 사용자 지정 목록은 없습니다. 모든 Node 또는 앱 UI에서 목록을 편집할 수 있으며, Gateway는 변경 사항을 영구 저장하고 연결된 모든 클라이언트에 브로드캐스트합니다.

- **macOS**: 로컬 Voice Wake 활성화/비활성화 토글입니다. macOS 26+가 필요합니다. 런타임/PTT에 관한 자세한 내용은 [음성 호출(macOS)](/ko/platforms/mac/voicewake)을 참조하십시오.
- **iOS**: Settings에 로컬 Voice Wake 활성화/비활성화 토글이 있습니다.
- **Android**: Voice Wake를 구현하지 않습니다. Voice 탭에서는 호출어 트리거 대신 수동 마이크 캡처를 사용합니다.

## 저장소

호출어와 라우팅 규칙은 Gateway 상태 데이터베이스에 저장되며, 기본 경로는 `~/.openclaw/state/openclaw.sqlite`입니다(`OPENCLAW_STATE_DIR`로 재정의). 테이블은 `voicewake_triggers`, `voicewake_routing_config`, `voicewake_routing_routes`입니다. 레거시 `settings/voicewake.json`과 `settings/voicewake-routing.json`은 `openclaw doctor --fix` 마이그레이션 입력으로만 사용되며, 런타임에서는 이를 절대 읽지 않습니다.

## 프로토콜

### 트리거 목록

| 메서드          | 매개변수                   | 결과                   |
| --------------- | ------------------------ | ------------------------ |
| `voicewake.get` | 없음                     | `{ triggers: string[] }` |
| `voicewake.set` | `{ triggers: string[] }` | `{ triggers: string[] }` |

`voicewake.set`은 입력을 정규화합니다. 공백을 제거하고 빈 항목을 삭제하며 최대 32개의 트리거를 유지하고, 서로게이트 쌍을 분리하지 않으면서 각 트리거를 64개의 UTF-16 코드 단위로 자릅니다. 결과가 비어 있으면 기본 제공 값(`openclaw`, `claude`, `computer`)으로 대체됩니다.

### 라우팅(트리거에서 대상으로)

| 메서드                  | 매개변수                               | 결과                               |
| ----------------------- | ------------------------------------ | ------------------------------------ |
| `voicewake.routing.get` | 없음                                 | `{ config: VoiceWakeRoutingConfig }` |
| `voicewake.routing.set` | `{ config: VoiceWakeRoutingConfig }` | `{ config: VoiceWakeRoutingConfig }` |

```json
{
  "version": 1,
  "defaultTarget": { "mode": "current" },
  "routes": [{ "trigger": "robot wake", "target": { "sessionKey": "agent:main:main" } }],
  "updatedAtMs": 1730000000000
}
```

각 경로의 `target`은 다음 중 정확히 하나를 지원합니다.

- `{ "mode": "current" }`
- `{ "agentId": "main" }`
- `{ "sessionKey": "agent:main:main" }`

제한: 경로는 최대 32개이며 트리거 텍스트는 최대 64자입니다. 일치 여부 및 중복 감지를 위해 경로 트리거를 소문자로 변환하고, 각 단어의 앞뒤 문장 부호를 제거하고, 공백을 하나로 합쳐 정규화합니다(`"Hey, Bot!!"`과 `"hey bot"`은 일치하며 중복으로 간주됩니다). 이는 위의 전역 트리거 목록에 사용되는 단순한 앞뒤 공백 제거보다 엄격한 정규화 방식입니다.

### 이벤트

| 이벤트                       | 페이로드                              |
| --------------------------- | ------------------------------------ |
| `voicewake.changed`         | `{ triggers: string[] }`             |
| `voicewake.routing.changed` | `{ config: VoiceWakeRoutingConfig }` |

두 이벤트 모두 읽기 범위가 있는 모든 WebSocket 클라이언트(macOS 앱, WebChat 등)와 연결된 모든 Node에 브로드캐스트됩니다. 또한 Node는 연결 직후 두 이벤트를 모두 초기 스냅샷 푸시로 받습니다.

## 클라이언트 동작

- **macOS**: `voicewake.set`/`voicewake.get`을 호출하고 `voicewake.changed`를 수신하여 다른 클라이언트와 동기화 상태를 유지합니다.
- **iOS**: `voicewake.set`/`voicewake.get`을 호출하고 `voicewake.changed`를 수신하여 로컬 호출어 감지가 즉시 반응하도록 유지합니다.
- **Android**: `voiceWake` 기능을 알리거나 호출어 업데이트를 사용하지 않습니다.

## 관련 항목

- [대화 모드](/ko/nodes/talk)
- [오디오 및 음성 메모](/ko/nodes/audio)
- [미디어 이해](/ko/nodes/media-understanding)
