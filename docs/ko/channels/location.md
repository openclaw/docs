---
read_when:
    - 채널 위치 파싱 추가 또는 수정
    - 에이전트 프롬프트나 도구에서 위치 컨텍스트 필드 사용
summary: 인바운드 채널 위치 파싱(Telegram/WhatsApp/Matrix) 및 컨텍스트 필드
title: 채널 위치 파싱
x-i18n:
    generated_at: "2026-04-24T06:03:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 19c10a55e30c70a7af5d041f9a25c0a2783e3191403e7c0cedfbe7dd8f1a77c1
    source_path: channels/location.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenClaw는 채팅 채널에서 공유된 위치를 다음과 같이 정규화합니다.

- 인바운드 본문에 추가되는 간결한 좌표 텍스트
- 자동 응답 컨텍스트 페이로드의 구조화된 필드. 채널이 제공한 레이블, 주소, 캡션/댓글은 사용자 본문에 인라인으로 들어가지 않고, 공유되는 신뢰할 수 없는 메타데이터 JSON 블록을 통해 프롬프트에 렌더링됩니다.

현재 지원 대상:

- **Telegram** (위치 핀 + 장소 + 실시간 위치)
- **WhatsApp** (`locationMessage` + `liveLocationMessage`)
- **Matrix** (`geo_uri`가 있는 `m.location`)

## 텍스트 서식

위치는 대괄호 없이 읽기 쉬운 줄로 렌더링됩니다.

- 핀:
  - `📍 48.858844, 2.294351 ±12m`
- 이름 있는 장소:
  - `📍 48.858844, 2.294351 ±12m`
- 실시간 공유:
  - `🛰 실시간 위치: 48.858844, 2.294351 ±12m`

채널에 레이블, 주소 또는 캡션/댓글이 포함되어 있으면 이는 컨텍스트 페이로드에 보존되며, 프롬프트에는 펜스로 감싼 신뢰할 수 없는 JSON으로 표시됩니다.

````text
위치(신뢰할 수 없는 메타데이터):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## 컨텍스트 필드

위치가 있으면 다음 필드가 `ctx`에 추가됩니다.

- `LocationLat` (숫자)
- `LocationLon` (숫자)
- `LocationAccuracy` (숫자, 미터; 선택 사항)
- `LocationName` (문자열; 선택 사항)
- `LocationAddress` (문자열; 선택 사항)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (불리언)
- `LocationCaption` (문자열; 선택 사항)

프롬프트 렌더러는 `LocationName`, `LocationAddress`, `LocationCaption`을 신뢰할 수 없는 메타데이터로 취급하고, 다른 채널 컨텍스트에 사용되는 것과 동일한 제한된 JSON 경로를 통해 직렬화합니다.

## 채널 참고 사항

- **Telegram**: 장소는 `LocationName`/`LocationAddress`로 매핑되며, 실시간 위치는 `live_period`를 사용합니다.
- **WhatsApp**: `locationMessage.comment` 및 `liveLocationMessage.caption`이 `LocationCaption`을 채웁니다.
- **Matrix**: `geo_uri`는 핀 위치로 파싱되며, 고도는 무시되고 `LocationIsLive`는 항상 false입니다.

## 관련

- [위치 명령(노드)](/ko/nodes/location-command)
- [카메라 캡처](/ko/nodes/camera)
- [미디어 이해](/ko/nodes/media-understanding)
