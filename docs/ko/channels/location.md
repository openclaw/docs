---
read_when:
    - 채널 위치 구문 분석 추가 또는 수정
    - 에이전트 프롬프트 또는 도구에서 위치 컨텍스트 필드 사용하기
summary: 채널 위치 파싱 및 이식 가능한 아웃바운드 위치 페이로드
title: 채널 위치 파싱
x-i18n:
    generated_at: "2026-07-12T14:57:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c7e5647d02643ad6d95024b362228377690d7fdff66441fae367f0f5307217fb
    source_path: channels/location.md
    workflow: 16
---

OpenClaw은 채팅 채널의 공유 위치를 다음과 같이 정규화합니다.

- 수신 본문에 추가되는 간결한 좌표 텍스트
- 자동 응답 컨텍스트 페이로드의 구조화된 필드. 채널에서 제공한 레이블, 주소, 캡션/댓글은 사용자 본문에 인라인으로 삽입되지 않고, 공유된 신뢰할 수 없는 메타데이터 JSON 블록을 통해 프롬프트에 렌더링됩니다.

현재 지원되는 항목:

- **LINE**(제목/주소가 포함된 위치 메시지)
- **Matrix**(`geo_uri`가 포함된 `m.location`)
- **Telegram**(위치 핀 + 장소 + 실시간 위치)
- **WhatsApp**(`locationMessage` + `liveLocationMessage`)

## 텍스트 형식

위치는 대괄호 없이 읽기 쉬운 줄로 렌더링됩니다. 좌표는 소수점 이하 여섯 자리를 사용하며, 정확도는 미터 단위 정수로 반올림됩니다.

- 핀:
  - `📍 48.858844, 2.294351 ±12m`
- 이름이 지정된 장소(동일한 줄이며, 이름/주소는 메타데이터 블록에만 포함됨):
  - `📍 48.858844, 2.294351 ±12m`
- 실시간 공유:
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

채널에 레이블, 주소 또는 캡션/댓글이 포함된 경우 컨텍스트 페이로드에 보존되며, 프롬프트에는 펜스로 둘러싸인 신뢰할 수 없는 JSON으로 표시됩니다(필드가 없으면 생략됨).

````text
위치(신뢰할 수 없는 메타데이터):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "accuracy_m": 12,
  "source": "place",
  "name": "에펠탑",
  "address": "파리 마르스 광장",
  "caption": "여기서 만나요"
}
```
````

## 컨텍스트 필드

위치 정보가 있으면 다음 필드가 `ctx`에 추가됩니다.

- `LocationLat` (숫자)
- `LocationLon` (숫자)
- `LocationAccuracy` (숫자, 미터; 선택 사항)
- `LocationName` (문자열; 선택 사항)
- `LocationAddress` (문자열; 선택 사항)
- `LocationSource` (`pin | place | live`)
- `LocationIsLive` (불리언)
- `LocationCaption` (문자열; 선택 사항)

채널에서 소스를 명시적으로 설정하지 않으면 OpenClaw가 이를 추론합니다. 실시간 공유는 `live`, 이름이나 주소가 있는 위치는 `place`, 그 외에는 모두 `pin`이 됩니다.

프롬프트 렌더러는 `LocationName`, `LocationAddress`, `LocationCaption`을 신뢰할 수 없는 메타데이터로 취급하며, 다른 채널 컨텍스트에 사용하는 것과 동일한 크기 제한 JSON 경로를 통해 직렬화합니다.

## 아웃바운드 페이로드

메시지 도구와 Plugin SDK는 이식 가능한 아웃바운드 위치에 동일한 `NormalizedLocation` 형식을 사용합니다. 좌표만 포함된 페이로드는 핀을 나타냅니다. 네이티브 장소 기능을 지원하는 채널은 `name`과 `address`를 장소 카드로 매핑할 수 있습니다.

현재 Telegram에서는 `message(action="send")`를 통해 이 기능을 제공합니다. 최초 구현은 의도적으로 독립형으로 설계되었습니다. 위치 페이로드는 텍스트 또는 미디어와 함께 사용할 수 없으며, 장소 쌍이 불완전하면 이름이나 주소를 조용히 삭제하는 대신 실패합니다. 지원하지 않는 채널은 위치 매개변수를 제공한다고 표시하지 않습니다.

## 채널 참고 사항

- **LINE**: 위치 메시지의 `title`/`address`는 `LocationName`/`LocationAddress`에 매핑되며, 실시간 위치는 지원하지 않습니다.
- **Matrix**: `geo_uri`는 핀 위치로 파싱됩니다. `u`(불확실성) 매개변수는 `LocationAccuracy`에 매핑되고, 이벤트 본문은 `LocationCaption`을 채우며, 고도는 무시되고, `LocationIsLive`는 항상 false입니다.
- **Telegram**: 장소는 `LocationName`/`LocationAddress`에 매핑되며, 실시간 위치는 `live_period`를 통해 감지됩니다.
- **WhatsApp**: `locationMessage.comment`와 `liveLocationMessage.caption`은 `LocationCaption`을 채웁니다.

## 관련 항목

- [위치 명령(Node)](/ko/nodes/location-command)
- [카메라 캡처](/ko/nodes/camera)
- [미디어 이해](/ko/nodes/media-understanding)
