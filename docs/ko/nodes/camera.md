---
read_when:
    - iOS/Android 노드 또는 macOS에서 카메라 캡처 추가 또는 수정
    - 에이전트가 접근할 수 있는 MEDIA 임시 파일 워크플로 확장
summary: '에이전트 사용을 위한 카메라 캡처(iOS/Android Node + macOS 앱): 사진(jpg) 및 짧은 동영상 클립(mp4)'
title: 카메라 캡처
x-i18n:
    generated_at: "2026-05-06T09:02:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 226b9f44e8d56b9b366d679c6c2f974c714afc4cb962afddba89d17dcdfc09eb
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw는 에이전트 워크플로를 위한 **카메라 캡처**를 지원합니다.

- **iOS Node**(Gateway를 통해 페어링됨): `node.invoke`를 통해 **사진**(`jpg`) 또는 **짧은 비디오 클립**(`mp4`, 선택적 오디오 포함)을 캡처합니다.
- **Android Node**(Gateway를 통해 페어링됨): `node.invoke`를 통해 **사진**(`jpg`) 또는 **짧은 비디오 클립**(`mp4`, 선택적 오디오 포함)을 캡처합니다.
- **macOS 앱**(Gateway를 통한 Node): `node.invoke`를 통해 **사진**(`jpg`) 또는 **짧은 비디오 클립**(`mp4`, 선택적 오디오 포함)을 캡처합니다.

모든 카메라 접근은 **사용자가 제어하는 설정**으로 제한됩니다.

## iOS Node

### 사용자 설정(기본값 켜짐)

- iOS Settings 탭 → **Camera** → **Allow Camera** (`camera.enabled`)
  - 기본값: **켜짐**(키가 없으면 활성화된 것으로 처리됩니다).
  - 꺼져 있을 때: `camera.*` 명령은 `CAMERA_DISABLED`를 반환합니다.

### 명령(Gateway `node.invoke`를 통해)

- `camera.list`
  - 응답 페이로드:
    - `devices`: `{ id, name, position, deviceType }` 배열

- `camera.snap`
  - 매개변수:
    - `facing`: `front|back`(기본값: `front`)
    - `maxWidth`: 숫자(선택 사항, iOS Node의 기본값 `1600`)
    - `quality`: `0..1`(선택 사항, 기본값 `0.9`)
    - `format`: 현재 `jpg`
    - `delayMs`: 숫자(선택 사항, 기본값 `0`)
    - `deviceId`: 문자열(선택 사항, `camera.list`에서 가져옴)
  - 응답 페이로드:
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`, `height`
  - 페이로드 보호: 사진은 base64 페이로드가 5 MB 미만으로 유지되도록 다시 압축됩니다.

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

`canvas.*`와 마찬가지로 iOS Node는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### CLI 도우미(임시 파일 + MEDIA)

첨부 파일을 가져오는 가장 쉬운 방법은 디코딩된 미디어를 임시 파일에 쓰고 `MEDIA:<path>`를 출력하는 CLI 도우미를 사용하는 것입니다.

예시:

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

참고:

- `nodes camera snap`은 에이전트에 두 가지 시야를 모두 제공하기 위해 기본적으로 **양쪽** 방향을 사용합니다.
- 자체 래퍼를 만들지 않는 한 출력 파일은 임시 파일입니다(OS 임시 디렉터리 안).

## Android Node

### Android 사용자 설정(기본값 켜짐)

- Android Settings 시트 → **Camera** → **Allow Camera** (`camera.enabled`)
  - 기본값: **켜짐**(키가 없으면 활성화된 것으로 처리됩니다).
  - 꺼져 있을 때: `camera.*` 명령은 `CAMERA_DISABLED`를 반환합니다.

### 권한

- Android에는 런타임 권한이 필요합니다.
  - `camera.snap`과 `camera.clip` 모두에 `CAMERA`가 필요합니다.
  - `includeAudio=true`일 때 `camera.clip`에는 `RECORD_AUDIO`가 필요합니다.

권한이 없으면 앱은 가능한 경우 프롬프트를 표시합니다. 거부되면 `camera.*` 요청은
`*_PERMISSION_REQUIRED` 오류로 실패합니다.

### Android 포그라운드 요구 사항

`canvas.*`와 마찬가지로 Android Node는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### Android 명령(Gateway `node.invoke`를 통해)

- `camera.list`
  - 응답 페이로드:
    - `devices`: `{ id, name, position, deviceType }` 배열

### 페이로드 보호

사진은 base64 페이로드가 5 MB 미만으로 유지되도록 다시 압축됩니다.

## macOS 앱

### 사용자 설정(기본값 꺼짐)

macOS 컴패니언 앱은 체크박스를 제공합니다.

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`)
  - 기본값: **꺼짐**
  - 꺼져 있을 때: 카메라 요청은 "Camera disabled by user"를 반환합니다.

### CLI 도우미(Node 호출)

기본 `openclaw` CLI를 사용해 macOS Node에서 카메라 명령을 호출합니다.

예시:

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

참고:

- `openclaw nodes camera snap`은 재정의하지 않는 한 기본값으로 `maxWidth=1600`을 사용합니다.
- macOS에서 `camera.snap`은 준비/노출 안정화 후 캡처하기 전에 `delayMs`(기본값 2000ms) 동안 기다립니다.
- 사진 페이로드는 base64가 5 MB 미만으로 유지되도록 다시 압축됩니다.

## 안전 + 실용적 제한

- 카메라와 마이크 접근은 일반적인 OS 권한 프롬프트를 표시합니다(그리고 Info.plist에 사용 설명 문자열이 필요합니다).
- 비디오 클립은 지나치게 큰 Node 페이로드(base64 오버헤드 + 메시지 제한)를 피하기 위해 제한됩니다(현재 `<= 60s`).

## macOS 화면 비디오(OS 수준)

_화면_ 비디오(카메라가 아님)의 경우 macOS 컴패니언을 사용합니다.

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

참고:

- macOS **Screen Recording** 권한(TCC)이 필요합니다.

## 관련 항목

- [이미지 및 미디어 지원](/ko/nodes/images)
- [미디어 이해](/ko/nodes/media-understanding)
- [위치 명령](/ko/nodes/location-command)
