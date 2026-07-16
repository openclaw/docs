---
read_when:
    - 위치 Node 지원 또는 권한 UI 추가
    - Android 위치 권한 또는 포그라운드 동작 설계하기
summary: Node의 위치 명령, 플랫폼 권한 모드 및 Linux GeoClue 설정
title: 위치 명령어
x-i18n:
    generated_at: "2026-07-16T12:46:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 644229c1eafc8fc7b59bc23ba01d4ba95687ea66c4f9bd4a4cda98a87f2b6085
    source_path: nodes/location-command.md
    workflow: 16
---

## 요약

- `location.get`은 `node.invoke` 또는 `openclaw nodes location get`을 통해 호출되는 Node 명령입니다.
- 기본적으로 꺼져 있습니다.
- Android 서드 파티 빌드는 끄기 / 사용 중 / 항상 선택기를 사용합니다. Play 빌드는 끄기 / 사용 중만 제공합니다.
- 정확한 위치는 별도의 토글입니다.

## 단순한 스위치가 아닌 선택기를 사용하는 이유

OS 위치 권한은 여러 수준으로 나뉩니다. 정확한 위치도 별도의 OS 권한입니다(iOS 14+의 "Precise", Android의 "fine"과 "coarse"). 앱 내 선택기는 요청할 모드를 결정하지만, 실제로 부여할 권한은 여전히 OS가 결정합니다.

## 설정 모델

Node 기기별 설정:

- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: bool

UI 동작:

- `whileUsing`을 선택하면 포그라운드 권한을 요청합니다.
- Android 서드 파티 빌드에서 `always`을 선택하면 먼저 포그라운드 권한을 요청하고 백그라운드 접근을 설명한 다음, 별도의 **Allow all the time** 권한을 부여할 수 있도록 Android 앱 설정을 엽니다.
- Android Play 빌드는 백그라운드 위치 권한을 선언하거나 `always`을 표시하지 않습니다.
- OS가 요청한 수준을 거부하면 앱은 부여된 권한 중 가장 높은 수준으로 되돌리고 상태를 표시합니다.

## 권한 매핑(node.permissions)

선택 사항입니다. macOS Node는 `node.list`/`node.describe`의 `permissions` 맵을 통해 `location`을 보고합니다. iOS/Android에서는 생략할 수 있습니다.

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

CLI 플래그는 다음과 같이 직접 매핑됩니다. `--location-timeout` -> `timeoutMs`, `--max-age` -> `maxAgeMs`, `--accuracy` -> `desiredAccuracy`.

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
- `LOCATION_BACKGROUND_UNAVAILABLE`: 앱이 백그라운드에 있지만 사용 중 권한만 부여되어 있습니다.
- `LOCATION_TIMEOUT`: 제한 시간 내에 위치를 확인하지 못했습니다.
- `LOCATION_UNAVAILABLE`: 시스템 오류가 발생했거나 제공자가 없습니다.

## 백그라운드 동작

- Android 서드 파티 빌드는 사용자가 `Always`을 선택하고 Android가 백그라운드 위치 권한을 부여한 경우에만 백그라운드 `location.get`을 허용합니다. 기존 영구 Node 서비스는 `location` 서비스 유형을 추가하며, 활성 상태일 때 `Location: Always`을 알립니다.
- Android Play 빌드와 `While Using` 모드는 백그라운드 상태에서 `location.get`을 거부합니다.
- 다른 Node 플랫폼에서는 동작이 다를 수 있습니다.

## Linux Node 호스트

번들 Linux Node Plugin은 Linux 데스크톱 앱이 없는 헤드리스 호스트를 포함하여 CLI `openclaw node` 서비스에 `location.get`을 추가합니다. 위치 기능은 기본적으로 꺼져 있습니다. Plugin 항목에서 활성화한 다음 Node 서비스를 다시 시작하십시오.

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          location: { enabled: true },
        },
      },
    },
  },
}
```

GeoClue2와 해당 `where-am-i` 데모(Debian 및 Ubuntu의 `geoclue-2-demo`)를 설치하십시오. 호스트의 GeoClue 정책 및 권한 부여 에이전트에서 Node 서비스 사용자를 허용해야 합니다.

Plugin은 일련의 `busctl` 호출 대신 `where-am-i`을 사용합니다. GeoClue는 클라이언트 생성, 속성, 시작, 업데이트 및 중지를 하나의 D-Bus 클라이언트 연결에 결합합니다. 데모는 이 수명 주기를 함께 유지하지만 별도의 `busctl` 하위 프로세스는 그렇지 않습니다. npm 의존성은 추가되지 않습니다.

Linux는 `coarse`, `balanced`, `precise`을 각각 GeoClue 정확도 수준 `4`, `6`, `8`에 매핑합니다. 반환된 타임스탬프를 기준으로 `maxAgeMs`을 검증합니다. GeoClue 데모는 선택된 제공자를 노출하지 않으므로 `source`은 `unknown`입니다. 보고된 정확도가 100미터 이하인 경우에만 `isPrecise`이 true입니다.

Linux는 동일한 안정적인 오류인 `LOCATION_DISABLED`, `LOCATION_TIMEOUT`, `LOCATION_UNAVAILABLE`을 사용합니다.

## 모델/도구 통합

- 에이전트 도구: `nodes` 도구의 `location_get` 작업(Node 필요).
- CLI: `openclaw nodes location get --node <id>`.
- 에이전트 지침: 사용자가 위치 기능을 활성화했고 그 범위를 이해하는 경우에만 호출하십시오.

## UX 문구(제안)

- 끄기: "위치 공유가 비활성화되어 있습니다."
- 사용 중: "OpenClaw가 열려 있을 때만 허용합니다."
- 항상: "OpenClaw가 백그라운드에 있는 동안 요청된 위치 확인을 허용합니다."
- 정확한 위치: "정확한 GPS 위치를 사용합니다. 대략적인 위치를 공유하려면 토글을 끄십시오."

## 관련 문서

- [Node 개요](/ko/nodes)
- [채널 위치 파싱](/ko/channels/location)
- [카메라 캡처](/ko/nodes/camera)
- [대화 모드](/ko/nodes/talk)
