---
read_when:
    - 위치 Node 지원 또는 권한 UI 추가
    - Android 위치 권한 또는 포그라운드 동작 설계
summary: 노드의 위치 명령(`location.get`), 권한 모드 및 Android 포그라운드 동작
title: 위치 명령어
x-i18n:
    generated_at: "2026-07-12T00:56:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fae9f7707620f3f743d40c07618a431a6baa7a357dda6d74021bc986cd4974b1
    source_path: nodes/location-command.md
    workflow: 16
---

## 요약

- `location.get`은 `node.invoke` 또는 `openclaw nodes location get`을 통해 호출하는 Node 명령입니다.
- 기본적으로 꺼져 있습니다.
- Android 서드파티 빌드에서는 선택기(끔 / 사용 중 / 항상)를 사용합니다. Play 빌드에서는 끔 / 사용 중만 제공됩니다.
- 정확한 위치는 별도의 토글입니다.

## 단순 스위치가 아닌 선택기를 사용하는 이유

OS 위치 권한은 여러 단계로 구성됩니다. 정확한 위치 역시 별도의 OS 권한입니다(iOS 14+의 "Precise", Android의 "fine" 및 "coarse"). 앱 내 선택기는 요청할 모드를 결정하지만, 실제로 부여되는 권한은 여전히 OS가 결정합니다.

## 설정 모델

각 Node 기기별 설정:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

UI 동작:

- `whileUsing`을 선택하면 포그라운드 권한을 요청합니다.
- Android 서드파티 빌드에서 `always`를 선택하면 먼저 포그라운드 권한을 요청하고 백그라운드 접근에 관해 설명한 다음, 별도의 **Allow all the time** 권한을 부여할 수 있도록 Android 앱 설정을 엽니다.
- Android Play 빌드는 백그라운드 위치 권한을 선언하지 않으며 `always`를 표시하지 않습니다.
- OS가 요청한 권한 수준을 거부하면 앱은 부여된 가장 높은 수준으로 되돌리고 상태를 표시합니다.

## 권한 매핑(node.permissions)

선택 사항입니다. macOS Node는 `node.list`/`node.describe`의 `permissions` 맵을 통해 `location`을 보고하지만, iOS/Android에서는 생략할 수 있습니다.

## 명령: `location.get`

`node.invoke` 또는 다음 CLI 도우미를 통해 호출합니다.

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

매개변수:

```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

CLI 플래그는 직접 매핑됩니다. `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: 앱이 백그라운드 상태이지만 사용 중 권한만 부여되었습니다.
- `LOCATION_TIMEOUT`: 제한 시간 내에 위치를 확인하지 못했습니다.
- `LOCATION_UNAVAILABLE`: 시스템 오류가 발생했거나 사용 가능한 제공자가 없습니다.

## 백그라운드 동작

- Android 서드파티 빌드는 사용자가 `Always`를 선택하고 Android가 백그라운드 위치 권한을 부여한 경우에만 백그라운드 `location.get`을 허용합니다. 기존 상시 실행 Node 서비스는 `location` 서비스 유형을 추가하고 활성 상태인 동안 `Location: Always`를 명시합니다.
- Android Play 빌드와 `While Using` 모드에서는 백그라운드 상태일 때 `location.get`을 거부합니다.
- 다른 Node 플랫폼에서는 동작이 다를 수 있습니다.

## 모델/도구 통합

- 에이전트 도구: `nodes` 도구의 `location_get` 작업(Node 필수).
- CLI: `openclaw nodes location get --node <id>`.
- 에이전트 지침: 사용자가 위치 기능을 활성화하고 적용 범위를 이해한 경우에만 호출합니다.

## UX 문구(제안)

- 끔: "위치 공유가 비활성화되어 있습니다."
- 사용 중: "OpenClaw가 열려 있을 때만 허용합니다."
- 항상: "OpenClaw가 백그라운드에 있는 동안 요청된 위치 확인을 허용합니다."
- 정확한 위치: "정확한 GPS 위치를 사용합니다. 대략적인 위치를 공유하려면 토글을 끄세요."

## 관련 문서

- [Node 개요](/ko/nodes)
- [채널 위치 파싱](/ko/channels/location)
- [카메라 캡처](/ko/nodes/camera)
- [대화 모드](/ko/nodes/talk)
