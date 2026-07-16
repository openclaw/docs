---
read_when:
    - Node 플랫폼에서 카메라 캡처 추가 또는 수정하기
    - 에이전트가 액세스할 수 있는 MEDIA 임시 파일 워크플로 확장하기
summary: 사진 및 짧은 동영상 클립을 위한 iOS, Android, macOS, Linux Node의 카메라 캡처
title: 카메라 캡처
x-i18n:
    generated_at: "2026-07-16T12:47:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8fff8302863b63209222d87b350238dd2f01e18d06ce1783036b3cefaca14020
    source_path: nodes/camera.md
    workflow: 16
---

OpenClaw은 페어링된 **iOS**, **Android**, **macOS**, **Linux** Node의 에이전트 워크플로에서 카메라 캡처를 지원합니다. Gateway `node.invoke`을 통해 사진(`jpg`) 또는 짧은 동영상 클립(`mp4`, 오디오 선택 가능)을 캡처할 수 있습니다.

모든 카메라 접근은 플랫폼별로 사용자가 제어하는 설정에 의해 제한됩니다.

## iOS Node

### iOS 사용자 설정

- iOS Settings 탭 → **Camera** → **Allow Camera** (`camera.enabled`).
  - 기본값: **켜짐**(키가 없으면 활성화된 것으로 간주합니다).
  - 꺼진 경우: `camera.*` 명령은 `CAMERA_DISABLED`을 반환합니다.

### iOS 명령(Gateway `node.invoke`을 통해 실행)

- `camera.list`
  - 응답 페이로드: `devices` — `{ id, name, position, deviceType }`의 배열입니다.

- `camera.snap`
  - 매개변수:
    - `facing`: `front|back` (기본값: `front`)
    - `maxWidth`: 숫자(선택 사항, 기본값 `1600`)
    - `quality`: `0..1` (선택 사항, 기본값 `0.9`, `[0.05, 1.0]`로 제한)
    - `format`: 현재 `jpg`
    - `delayMs`: 숫자(선택 사항, 기본값 `0`, 내부적으로 `10000`로 제한)
    - `deviceId`: 문자열(선택 사항, `camera.list`에서 가져옴)
  - 응답 페이로드: `format: "jpg"`, `base64`, `width`, `height`.
  - 페이로드 보호: base64로 인코딩된 페이로드를 5MB 미만으로 유지하도록 사진을 재압축합니다.

- `camera.clip`
  - 매개변수:
    - `facing`: `front|back` (기본값: `front`)
    - `durationMs`: 숫자(기본값 `3000`, `[250, 60000]`로 제한)
    - `includeAudio`: 불리언(기본값 `true`)
    - `format`: 현재 `mp4`
    - `deviceId`: 문자열(선택 사항, `camera.list`에서 가져옴)
  - 응답 페이로드: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.

### iOS 포그라운드 요구 사항

`canvas.*`와 마찬가지로 iOS Node는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE`을 반환합니다.

### CLI 도우미

미디어 파일을 가져오는 가장 쉬운 방법은 디코딩된 미디어를 임시 파일에 쓰고 저장된 경로를 출력하는 CLI 도우미를 사용하는 것입니다.

```bash
openclaw nodes camera snap --node <id>                 # 기본값: 전면 + 후면 모두(2개의 MEDIA 줄)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

`nodes camera snap`의 기본값은 `--facing both`이며, 에이전트에 두 시야를 모두 제공하기 위해 전면과 후면을 모두 캡처합니다. 단일 방향을 명시하여 `--device-id`을 전달하십시오(`--device-id`이 설정된 경우 `both`은 거부됩니다). 자체 래퍼를 만들지 않는 한 출력 파일은 OS 임시 디렉터리에 임시로 저장됩니다.

## Android Node

### Android 사용자 설정

- Android Settings 시트 → **Camera** → **Allow Camera** (`camera.enabled`).
  - **새로 설치할 때의 기본값은 꺼짐입니다.** 이 설정이 도입되기 전에 설치된 기존 환경은 업그레이드 시 이전에 작동하던 카메라 접근 권한을 예고 없이 잃지 않도록 **켜짐**으로 마이그레이션됩니다.
  - 꺼진 경우: `camera.*` 명령은 `CAMERA_DISABLED: enable Camera in Settings`을 반환합니다.

### 권한

- `camera.snap`과 `camera.clip` 모두에 `CAMERA`이 필요하며, 권한이 없거나 거부되면 `CAMERA_PERMISSION_REQUIRED`을 반환합니다.
- `includeAudio`이 `true`일 때 `camera.clip`에는 `RECORD_AUDIO`이 필요하며, 권한이 없거나 거부되면 `MIC_PERMISSION_REQUIRED`을 반환합니다.

가능한 경우 앱에서 런타임 권한을 요청합니다.

### Android 포그라운드 요구 사항

`canvas.*`와 마찬가지로 Android Node는 **포그라운드**에서만 `camera.*` 명령을 허용합니다. 백그라운드 호출은 `NODE_BACKGROUND_UNAVAILABLE: command requires foreground`을 반환합니다.

### Android 명령(Gateway `node.invoke`을 통해 실행)

- `camera.list`
  - 응답 페이로드: `devices` — `{ id, name, position, deviceType }`의 배열입니다.

- `camera.snap`
  - 매개변수: `facing` (`front|back`, 기본값 `front`), `quality` (기본값 `0.95`, `[0.1, 1.0]`로 제한), `maxWidth` (기본값 `1600`), `deviceId` (선택 사항, 알 수 없는 ID는 `INVALID_REQUEST` 오류로 실패).
  - 응답 페이로드: `format: "jpg"`, `base64`, `width`, `height`.
  - 페이로드 보호: base64를 5MB 미만으로 유지하도록 재압축합니다(iOS와 동일한 한도).

- `camera.clip`
  - 매개변수: `facing` (기본값 `front`), `durationMs` (기본값 `3000`, `[200, 60000]`로 제한), `includeAudio` (기본값 `true`), `deviceId` (선택 사항).
  - 응답 페이로드: `format: "mp4"`, `base64`, `durationMs`, `hasAudio`.
  - 페이로드 보호: base64 인코딩 전 원본 MP4는 18MB로 제한됩니다. 이 크기를 초과하는 클립은 `PAYLOAD_TOO_LARGE` 오류로 실패합니다(`durationMs`을 줄인 후 다시 시도하십시오).

## macOS 앱

### macOS 사용자 설정

macOS 컴패니언 앱에는 다음 체크박스가 있습니다.

- **Settings → General → Allow Camera** (`openclaw.cameraEnabled`).
  - 기본값: **꺼짐**.
  - 꺼진 경우: 카메라 요청은 `CAMERA_DISABLED: enable Camera in Settings`을 반환합니다.

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

- 재정의하지 않으면 `openclaw nodes camera snap`의 기본값은 `maxWidth=1600`입니다.
- `camera.snap`은 워밍업/노출 안정화 후 캡처하기 전에 `delayMs`(기본값 2000ms, `[0, 10000]`로 제한) 동안 대기합니다.
- 사진 페이로드는 base64를 5MB 미만으로 유지하도록 재압축됩니다.

## Linux Node 호스트

번들 Linux Node Plugin은 CLI `openclaw node` 서비스에 카메라 캡처를 추가합니다. 헤드리스 호스트에서 작동하며 Linux 데스크톱 앱이 필요하지 않습니다.

카메라 접근의 기본값은 꺼짐입니다. Plugin 항목에서 활성화한 다음, Gateway 알림이 다시 구성되도록 Node 서비스를 재시작하십시오.

```json5
{
  plugins: {
    entries: {
      "linux-node": {
        config: {
          camera: { enabled: true },
        },
      },
    },
  },
}
```

요구 사항:

- V4L2 입력, `libx264`, AAC를 지원하는 FFmpeg
- Node 서비스 사용자가 읽을 수 있는 `/dev/video*` 장치. 일반적인 배포판에서는 해당 사용자를 `video` 그룹에 추가하십시오.
- 기본 `includeAudio: true`을 사용하는 클립의 경우, 기본 소스가 있는 정상 작동하는 PulseAudio 서버 또는 PipeWire PulseAudio 호환성 계층

Linux는 `camera.list`에서 캡처 가능하고 읽을 수 있는 V4L2 장치 경로를 반환합니다. FFmpeg는 각 `/dev/video*` 후보를 검사하고 메타데이터 또는 출력 전용 Node는 제외합니다. 장치 `position`은 `unknown`이므로, `deviceId` 없이 방향을 요청하면 전면 또는 후면 카메라라고 표시하는 대신 `unknown` 위치의 사진이나 클립 하나가 생성됩니다. 호스트에 카메라가 여러 개 있으면 `deviceId`을 사용하십시오. `camera.snap`은 `delayMs`에 FFmpeg 입력 워밍업을 사용하고 너비를 제한하면서 가로세로 비율을 유지합니다. `camera.clip`은 마이크 오디오를 MP4 오디오 트랙으로 녹음합니다. OpenClaw은 의도적으로 독립형 마이크 명령을 제공하지 않습니다.

Plugin은 MP4 동영상에 `libx264`을 사용하며 코덱을 자동으로 변경하지 않습니다. 필수 입력 또는 인코더가 없는 FFmpeg 빌드는 `CAMERA_UNAVAILABLE`을 반환합니다. 25MB의 base64 페이로드 한도를 초과할 사진과 클립은 `PAYLOAD_TOO_LARGE` 오류로 실패합니다.

`camera.snap`과 `camera.clip`은 여전히 위험한 명령입니다. 캡처를 허용하려는 경우에만 `gateway.nodes.allowCommands`에 추가하십시오. Plugin을 활성화하는 것만으로는 Gateway 정책을 우회하지 않습니다.

## 안전 및 실제 제한 사항

- 카메라 및 마이크 접근 시 일반적인 OS 권한 요청이 표시되며, `Info.plist`에 사용 목적 문자열이 필요합니다.
- Node 페이로드가 지나치게 커지는 것을 방지하기 위해 동영상 클립은 60s로 제한됩니다(base64 오버헤드 및 메시지 제한 포함).

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
