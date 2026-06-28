---
read_when:
    - 위치 Node 지원 또는 권한 UI 추가하기
    - Android 위치 권한 또는 포그라운드 동작 설계
summary: 노드용 위치 명령(`location.get`), 권한 모드 및 Android 포그라운드 동작
title: 위치 명령
x-i18n:
    generated_at: "2026-05-06T06:32:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 63ed754bfdda1cf379dcb7ac40817c0b93cc1efe4526512d70258072da4bc8a7
    source_path: nodes/location-command.md
    workflow: 16
    postprocess_version: locale-links-v1
---

## 요약

- `location.get`은 노드 명령입니다(`node.invoke`를 통해 실행).
- 기본값은 꺼짐입니다.
- Android 앱 설정은 선택기를 사용합니다: 끄기 / 사용 중.
- 별도 토글: 정확한 위치.

## 왜 단순한 스위치가 아니라 선택기인가

OS 권한은 여러 단계로 나뉩니다. 앱 안에서 선택기를 제공할 수 있지만, 실제 허용 여부는 여전히 OS가 결정합니다.

- iOS/macOS는 시스템 프롬프트/설정에서 **사용 중** 또는 **항상**을 노출할 수 있습니다.
- Android 앱은 현재 포그라운드 위치만 지원합니다.
- 정확한 위치는 별도 권한입니다(iOS 14+ "정확함", Android "fine" vs "coarse").

UI의 선택기는 요청할 모드를 제어하며, 실제 권한은 OS 설정에 있습니다.

## 설정 모델

노드 기기별:

- `location.enabledMode`: `off | whileUsing`
- `location.preciseEnabled`: bool

UI 동작:

- `whileUsing`을 선택하면 포그라운드 권한을 요청합니다.
- OS가 요청한 수준을 거부하면, 허용된 가장 높은 수준으로 되돌리고 상태를 표시합니다.

## 권한 매핑(node.permissions)

선택 사항입니다. macOS 노드는 권한 맵을 통해 `location`을 보고하며, iOS/Android는 이를 생략할 수 있습니다.

## 명령: `location.get`

`node.invoke`를 통해 호출합니다.

매개변수(권장):

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

응답 페이로드:

```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

오류(안정적인 코드):

- `LOCATION_DISABLED`: 선택기가 꺼져 있습니다.
- `LOCATION_PERMISSION_REQUIRED`: 요청한 모드에 필요한 권한이 없습니다.
- `LOCATION_BACKGROUND_UNAVAILABLE`: 앱이 백그라운드 상태이지만 사용 중일 때만 허용되어 있습니다.
- `LOCATION_TIMEOUT`: 시간 내에 위치를 확인하지 못했습니다.
- `LOCATION_UNAVAILABLE`: 시스템 실패 / 제공자 없음.

## 백그라운드 동작

- Android 앱은 백그라운드 상태에서 `location.get`을 거부합니다.
- Android에서 위치를 요청할 때는 OpenClaw를 열어 둡니다.
- 다른 노드 플랫폼은 다를 수 있습니다.

## 모델/도구 통합

- 도구 표면: `nodes` 도구에 `location_get` 작업을 추가합니다(노드 필요).
- CLI: `openclaw nodes location get --node <id>`.
- 에이전트 지침: 사용자가 위치를 활성화했고 범위를 이해한 경우에만 호출합니다.

## UX 문구(권장)

- 끄기: "위치 공유가 비활성화되어 있습니다."
- 사용 중: "OpenClaw가 열려 있을 때만."
- 정확한 위치: "정확한 GPS 위치를 사용합니다. 대략적인 위치를 공유하려면 토글을 끄세요."

## 관련 항목

- [채널 위치 파싱](/ko/channels/location)
- [카메라 캡처](/ko/nodes/camera)
- [대화 모드](/ko/nodes/talk)
