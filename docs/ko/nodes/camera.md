---
read_when:
    - iOS/Android Node 또는 macOS에서 카메라 캡처 추가 또는 수정
    - 에이전트가 액세스할 수 있는 MEDIA 임시 파일 워크플로 확장
summary: '에이전트용 카메라 캡처(iOS/Android Node + macOS 앱): 사진(jpg) 및 짧은 동영상 클립(mp4)'
title: 카메라 촬영
x-i18n:
    generated_at: "2026-07-12T15:24:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 38555c98886f6cd74ddacabc049da353cdb023e7f99aba81a272021cd8a0e33d
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw은 페어링된 **iOS**, **Android**, **macOS** Node의 에이전트 워크플로에서 카메라 캡처를 지원합니다. Gateway `node.invoke`를 통해 사진(`jpg`)이나 짧은 동영상 클립(`mp4`, 선택적 오디오 포함)을 캡처할 수 있습니다.

모든 카메라 접근은 플랫폼별로 사용자가 제어하는 설정에 의해 제한됩니다.

## iOS Node

### iOS 사용자 설정

- iOS Settings 탭 → **Camera** → **Allow Camera** (`camera.enabled`).
  - 기본값: **켜짐**(키가 없으면 활성화된 것으로 간주합니다).
  - 꺼져 있을 때: `camera.*` 명령은 `CAMERA_DISABLED`를 반환합니다.

### iOS 명령(Gateway `node.invoke`를 통해 실행)

- `camera.list`
  - 응답 페이로드: `devices` — `{ id, name, position, deviceType }`의 배열입니다.

- `camera.snap`
  - 매개변수:
    - `facing`: `front|back`(기본값: `front`)
    - `maxWidth`: 숫자(선택 사항, 기본값 `1600`)
    - `quality`: `0..1`(선택 사항, 기본값 `0.9`, `[0.05, 1.0]` 범위로 제한)
    - `format`: 현재 `jpg`
    - `delayMs`: 숫자(선택 사항, 기본값 `0`, 내부적으로 최대 `10000`으로 제한)
    - `deviceId`: 문자열(선택 사항, `camera.list`에서 가져옴)
  - 응답 페이로드: `format: "jpg"`, `base64`, `width`, `height`.
  - 페이로드 제한: base64로 인코딩된 페이로드를 5MB 미만으로 유지하도록 사진을 다시 압축합니다.

- `camera.clip`
  - 매개변수:
    - `facing`: `front|back`(기본값: `front`)
    - `durationMs`: 숫자(기본값 `3000`, `[250, 60000]` 범위로 제한)
    - `includeAudio`: 불리언(기본값 `true`)
    - `format`: 현재 `mp4`
    - `deviceId`: 문자열(선택 사항, `camera.list`에서 가져옴)
  - 응답 페이로드: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### iOS 포그라운드 요구 사항

`canvas.*`와 마찬가지로 iOS Node는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### CLI 도우미

미디어 파일을 가져오는 가장 쉬운 방법은 CLI 도우미를 사용하는 것입니다. CLI 도우미는 디코딩한 미디어를 임시 파일에 쓰고 저장된 경로를 출력합니다.

```bash
openclaw nodes camera snap --node <id>                 # 기본값: 전면 + 후면 모두(MEDIA 줄 2개)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap`의 기본값은 `--facing both`이며, 에이전트에 두 시야를 모두 제공하기 위해 전면과 후면을 모두 캡처합니다. 명시적인 단일 방향과 함께 `--device-id`를 전달하십시오(`--device-id`가 설정된 경우 `both`는 거부됩니다). 자체 래퍼를 만들지 않는 한 출력 파일은 임시 파일입니다(OS 임시 디렉터리에 저장됨).

## Android Node

### Android 사용자 설정

- Android Settings 시트 → **Camera** → **Allow Camera** (`camera.enabled`).
  - **새로 설치한 경우 기본값은 꺼짐입니다.** 이 설정이 도입되기 전에 설치된 기존 환경은 업그레이드 시 이전에 정상 작동하던 카메라 접근 권한이 별도 안내 없이 사라지지 않도록 **켜짐**으로 마이그레이션됩니다.
  - 꺼져 있을 때: `camera.*` 명령은 `CAMERA_DISABLED: enable Camera in Settings`를 반환합니다.

### 권한

- `camera.snap`과 `camera.clip` 모두에 `CAMERA`가 필요합니다. 권한이 없거나 거부된 경우 `CAMERA_PERMISSION_REQUIRED`를 반환합니다.
- `includeAudio`가 `true`일 때 `camera.clip`에는 `RECORD_AUDIO`가 필요합니다. 권한이 없거나 거부된 경우 `MIC_PERMISSION_REQUIRED`를 반환합니다.

가능한 경우 앱에서 런타임 권한을 요청합니다.

### Android 포그라운드 요구 사항

`canvas.*`와 마찬가지로 Android Node는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`를 반환합니다.

### Android 명령(Gateway `node.invoke`를 통해 실행)

- `camera.list`
  - 응답 페이로드: `devices` — `{ id, name, position, deviceType }`의 배열입니다.

- `camera.snap`
  - 매개변수: `facing`(`front|back`, 기본값 `front`), `quality`(기본값 `0.95`, `[0.1, 1.0]` 범위로 제한), `maxWidth`(기본값 `1600`), `deviceId`(선택 사항, 알 수 없는 ID를 지정하면 `INVALID_REQUEST`와 함께 실패).
  - 응답 페이로드: `format: "jpg"`, `base64`, `width`, `height`.
  - 페이로드 제한: base64를 5MB 미만으로 유지하도록 다시 압축합니다(iOS와 동일한 한도).

- `camera.clip`
  - 매개변수: `facing`(기본값 `front`), `durationMs`(기본값 `3000`, `[200, 60000]` 범위로 제한), `includeAudio`(기본값 `true`), `deviceId`(선택 사항).
  - 응답 페이로드: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - 페이로드 제한: base64 인코딩 전에 원본 MP4를 최대 18MB로 제한합니다. 한도를 초과하는 클립은 `PAYLOAD_TOO_LARGE`와 함께 실패합니다(`durationMs`를 줄이고 다시 시도하십시오).

## macOS 앱

### macOS 사용자 설정

macOS 컴패니언 앱은 다음 체크박스를 제공합니다.

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - 기본값: **꺼짐**.
  - 꺼져 있을 때: 카메라 요청은 `CAMERA_DISABLED: enable Camera in Settings`를 반환합니다.

### CLI 도우미(Node 호출)

기본 `openclaw` CLI를 사용하여 macOS Node에서 카메라 명령을 호출하십시오.

```bash
openclaw nodes camera list --node <id>                     # 카메라 ID 목록 표시
openclaw nodes camera snap --node <id>                     # 저장된 경로 출력
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s       # 저장된 경로 출력
openclaw nodes camera clip --node <id> --duration-ms 3000   # 저장된 경로 출력(레거시 플래그)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

- 별도로 지정하지 않으면 `openclaw nodes camera snap`의 기본값은 `maxWidth=1600`입니다.
- `camera.snap`은 캡처하기 전에 준비 및 노출 안정화 후 `delayMs`(기본값 2000ms, `[0, 10000]` 범위로 제한) 동안 대기합니다.
- base64를 5MB 미만으로 유지하도록 사진 페이로드를 다시 압축합니다.

## 안전 및 실질적인 제한 사항

- 카메라 및 마이크 접근 시 일반적인 OS 권한 요청이 표시되며, `Info.plist`에 사용 목적 문자열이 필요합니다.
- 지나치게 큰 Node 페이로드(base64 오버헤드 및 메시지 제한)를 방지하기 위해 동영상 클립은 60s로 제한됩니다.

## macOS 화면 동영상(OS 수준)

카메라가 아닌 _화면_ 동영상에는 macOS 컴패니언을 사용하십시오.

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # 저장된 경로 출력
```

macOS **Screen Recording** 권한(TCC)이 필요합니다.

## 관련 항목

- [이미지 및 미디어 지원](/ko/nodes/images)
- [미디어 이해](/ko/nodes/media-understanding)
- [위치 명령](/ko/nodes/location-command)
