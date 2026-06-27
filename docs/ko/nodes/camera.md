---
read_when:
    - iOS/Android 노드 또는 macOS에서 카메라 캡처 추가 또는 수정
    - 에이전트가 접근 가능한 MEDIA 임시 파일 워크플로 확장
summary: '에이전트 사용을 위한 카메라 캡처(iOS/Android 노드 + macOS 앱): 사진(jpg) 및 짧은 비디오 클립(mp4)'
title: 카메라 캡처
x-i18n:
    generated_at: "2026-06-27T17:38:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cb02b1e0e5d68e537dc699bcabacfb48b7beaf07459bf47800810a721191795
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw는 에이전트 워크플로를 위한 **카메라 캡처**를 지원합니다:

- **iOS 노드**(Gateway를 통해 페어링됨): `node.invoke`를 통해 **사진**(`jpg`) 또는 **짧은 비디오 클립**(`mp4`, 선택적 오디오 포함)을 캡처합니다.
- **Android 노드**(Gateway를 통해 페어링됨): `node.invoke`를 통해 **사진**(`jpg`) 또는 **짧은 비디오 클립**(`mp4`, 선택적 오디오 포함)을 캡처합니다.
- **macOS 앱**(Gateway를 통한 노드): `node.invoke`를 통해 **사진**(`jpg`) 또는 **짧은 비디오 클립**(`mp4`, 선택적 오디오 포함)을 캡처합니다.

모든 카메라 접근은 **사용자가 제어하는 설정** 뒤에서 제한됩니다.

## iOS 노드

### 사용자 설정(기본값 켜짐)

- iOS 설정 탭 → **카메라** → **카메라 허용**(`camera.enabled`)
  - 기본값: **켜짐**(키가 없으면 활성화된 것으로 처리됨).
  - 꺼져 있을 때: `camera.*` 명령은 `CAMERA_DISABLED`를 반환합니다.

### 명령(Gateway `node.invoke`를 통해)

- `camera.list`
  - 응답 페이로드:
    - `devices`: `{ id, name, position, deviceType }` 배열

- `camera.snap`
  - 매개변수:
    - `facing`: `front|back`(기본값: `front`)
    - `maxWidth`: 숫자(선택 사항, iOS 노드의 기본값 `1600`)
    - `quality`: `0..1`(선택 사항, 기본값 `0.9`)
    - `format`: 현재 `jpg`
    - `delayMs`: 숫자(선택 사항, 기본값 `0`)
    - `deviceId`: 문자열(선택 사항, `camera.list`에서 가져옴)
  - 응답 페이로드:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - 페이로드 보호: 사진은 base64 페이로드가 5MB 미만으로 유지되도록 재압축됩니다.

- `camera.clip`
  - 매개변수:
    - `facing`: `front|back`(기본값: `front`)
    - `durationMs`: 숫자(기본값 `3000`, 최대 `60000`으로 제한)
    - `includeAudio`: 불리언(기본값 `true`)
    - `format`: 현재 `mp4`
    - `deviceId`: 문자열(선택 사항, `camera.list`에서 가져옴)
  - 응답 페이로드:
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 포그라운드 요구 사항

`canvas.*`와 마찬가지로, iOS 노드는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### CLI 헬퍼

미디어 파일을 가져오는 가장 쉬운 방법은 CLI 헬퍼를 사용하는 것입니다. 이 헬퍼는 디코딩된 미디어를 임시 파일에 쓰고 저장된 경로를 출력합니다.

예:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

참고:

- `nodes camera snap`은 에이전트에 두 시야를 모두 제공하기 위해 기본적으로 **양쪽** 방향을 사용합니다.
- 자체 래퍼를 만들지 않는 한 출력 파일은 임시 파일입니다(OS 임시 디렉터리 안).

## Android 노드

### Android 사용자 설정(기본값 켜짐)

- Android 설정 시트 → **카메라** → **카메라 허용**(`camera.enabled`)
  - 기본값: **켜짐**(키가 없으면 활성화된 것으로 처리됨).
  - 꺼져 있을 때: `camera.*` 명령은 `CAMERA_DISABLED`를 반환합니다.

### 권한

- Android에는 런타임 권한이 필요합니다:
  - `camera.snap`과 `camera.clip` 모두에 `CAMERA`가 필요합니다.
  - `includeAudio=true`일 때 `camera.clip`에 `RECORD_AUDIO`가 필요합니다.

권한이 없으면 앱은 가능한 경우 프롬프트를 표시합니다. 거부되면 `camera.*` 요청은
`*_PERMISSION_REQUIRED` 오류와 함께 실패합니다.

### Android 포그라운드 요구 사항

`canvas.*`와 마찬가지로, Android 노드는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### Android 명령(Gateway `node.invoke`를 통해)

- `camera.list`
  - 응답 페이로드:
    - `devices`: `{ id, name, position, deviceType }` 배열

### 페이로드 보호

사진은 base64 페이로드가 5MB 미만으로 유지되도록 재압축됩니다.

## macOS 앱

### 사용자 설정(기본값 꺼짐)

macOS 컴패니언 앱은 체크박스를 제공합니다:

- **설정 → 일반 → 카메라 허용**(`openclaw.cameraEnabled`)
  - 기본값: **꺼짐**
  - 꺼져 있을 때: 카메라 요청은 "사용자가 카메라를 비활성화했습니다"를 반환합니다.

### CLI 헬퍼(노드 호출)

macOS 노드에서 카메라 명령을 호출하려면 기본 `openclaw` CLI를 사용하세요.

예:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints saved path
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints saved path
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints saved path (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

참고:

- `openclaw nodes camera snap`은 재정의하지 않는 한 기본값으로 `maxWidth=1600`을 사용합니다.
- macOS에서 `camera.snap`은 준비/노출 안정화 후 캡처하기 전에 `delayMs`(기본값 2000ms)만큼 기다립니다.
- 사진 페이로드는 base64가 5MB 미만으로 유지되도록 재압축됩니다.

## 안전 + 실제 제한

- 카메라와 마이크 접근은 일반적인 OS 권한 프롬프트를 트리거합니다(그리고 Info.plist의 사용 설명 문자열이 필요합니다).
- 비디오 클립은 지나치게 큰 노드 페이로드(base64 오버헤드 + 메시지 제한)를 피하기 위해 제한됩니다(현재 `<= 60s`).

## macOS 화면 비디오(OS 수준)

_화면_ 비디오(카메라가 아님)의 경우 macOS 컴패니언을 사용하세요:

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints saved path
```

참고:

- macOS **화면 기록** 권한(TCC)이 필요합니다.

## 관련 항목

- [이미지 및 미디어 지원](/ko/nodes/images)
- [미디어 이해](/ko/nodes/media-understanding)
- [위치 명령](/ko/nodes/location-command)
