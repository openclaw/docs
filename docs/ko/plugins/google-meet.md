---
read_when:
    - OpenClaw 에이전트가 Google Meet 회의에 참여하도록 하고 싶습니다
    - OpenClaw 에이전트가 새 Google Meet 통화를 만들도록 하고 싶습니다
    - Google Meet 전송 수단으로 Chrome, Chrome 노드 또는 Twilio를 구성하고 있습니다
summary: 'Google Meet Plugin: 명시적 Meet URL에 Chrome 또는 Twilio를 통해 참여하고 에이전트 응답 기본값 사용'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-04T06:24:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 459802231a807001d96d43950993f612234a5394fbe8c57a9992e97e8851dda2
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw의 Google Meet 참가자 지원은 설계상 명시적으로 동작합니다.

- 명시적인 `https://meet.google.com/...` URL에만 참여합니다.
- Google Meet API를 통해 새 Meet 공간을 만든 다음 반환된 URL에 참여할 수 있습니다.
- `agent`는 기본 말하기 응답 모드입니다. 실시간 전사가 듣고, 구성된 OpenClaw 에이전트가 응답하며, 일반 OpenClaw TTS가 Meet에서 음성을 출력합니다.
- `bidi`는 대체용 직접 실시간 음성 모델 모드로 계속 사용할 수 있습니다.
- 에이전트는 `mode`로 참여 동작을 선택합니다. 실시간 듣기/말하기 응답에는 `agent`, 직접 실시간 음성 대체에는 `bidi`, 말하기 응답 브리지 없이 브라우저에 참여하고 제어하려면 `transcribe`를 사용합니다.
- 인증은 개인 Google OAuth 또는 이미 로그인된 Chrome 프로필로 시작합니다.
- 자동 동의 안내 방송은 없습니다.
- 기본 Chrome 오디오 백엔드는 `BlackHole 2ch`입니다.
- Chrome은 로컬 또는 페어링된 노드 호스트에서 실행할 수 있습니다.
- Twilio는 전화 접속 번호와 선택적 PIN 또는 DTMF 시퀀스를 받습니다. Meet URL로 직접 전화를 걸 수는 없습니다.
- CLI 명령은 `googlemeet`입니다. `meet`는 더 넓은 에이전트 원격 회의 워크플로용으로 예약되어 있습니다.

## 빠른 시작

로컬 오디오 의존성을 설치하고 실시간 전사 제공자와 일반 OpenClaw TTS를 구성합니다. OpenAI가 기본 전사 제공자입니다. Google Gemini Live도 `realtime.voiceProvider: "google"`이 설정된 별도의 `bidi` 음성 대체로 사용할 수 있습니다.

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch`는 `BlackHole 2ch` 가상 오디오 장치를 설치합니다. Homebrew의 설치 프로그램은 macOS가 장치를 노출하기 전에 재부팅을 요구합니다.

```bash
sudo reboot
```

재부팅 후 두 항목을 모두 확인합니다.

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Plugin을 활성화합니다.

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

설정을 확인합니다.

```bash
openclaw googlemeet setup
```

설정 출력은 에이전트가 읽을 수 있고 모드를 인식하도록 설계되었습니다. Chrome 프로필, 노드 고정, 그리고 실시간 Chrome 참여의 경우 BlackHole/SoX 오디오 브리지와 지연된 실시간 인트로 검사를 보고합니다. 관찰 전용 참여의 경우 `--mode transcribe`로 동일한 전송을 확인합니다. 이 모드는 브리지를 통해 듣거나 말하지 않기 때문에 실시간 오디오 전제 조건을 건너뜁니다.

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio 위임이 구성된 경우 설정은 `voice-call` Plugin, Twilio 자격 증명, 공개 Webhook 노출이 준비되었는지도 보고합니다. 에이전트에게 참여를 요청하기 전에 `ok: false` 검사는 해당 전송 및 모드의 차단 요소로 취급합니다. 스크립트 또는 기계 판독 가능한 출력에는 `openclaw googlemeet setup --json`을 사용합니다. 에이전트가 시도하기 전에 특정 전송을 사전 점검하려면 `--transport chrome`, `--transport chrome-node`, 또는 `--transport twilio`를 사용합니다.

Twilio의 경우 기본 전송이 Chrome이면 항상 전송을 명시적으로 사전 점검합니다.

```bash
openclaw googlemeet setup --transport twilio
```

이렇게 하면 에이전트가 회의에 전화를 걸기 전에 누락된 `voice-call` 연결, Twilio 자격 증명 또는 도달할 수 없는 Webhook 노출을 잡아냅니다.

회의에 참여합니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트가 `google_meet` 도구를 통해 참여하게 합니다.

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

에이전트용 `google_meet` 도구는 macOS가 아닌 호스트에서도 아티팩트, 캘린더, 설정, 전사, Twilio, `chrome-node` 흐름에 계속 사용할 수 있습니다. 로컬 Chrome 말하기 응답 작업은 번들 Chrome 오디오 경로가 현재 macOS `BlackHole 2ch`에 의존하기 때문에 해당 호스트에서 차단됩니다. Linux에서는 Chrome 말하기 응답 참가에 `mode: "transcribe"`, Twilio 전화 접속, 또는 macOS `chrome-node` 호스트를 사용합니다.

새 회의를 만들고 참여합니다.

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

API로 만든 방의 경우, 방의 노크 없는 참여 정책을 Google 계정 기본값에서 상속하지 않고 명시하려면 Google Meet `SpaceConfig.accessType`을 사용합니다.

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN`은 Meet URL이 있는 누구나 노크 없이 참여할 수 있게 합니다. `TRUSTED`는 호스트 조직의 신뢰된 사용자, 초대된 외부 사용자, 전화 접속 사용자가 노크 없이 참여할 수 있게 합니다. `RESTRICTED`는 노크 없는 입장을 초대받은 사람으로 제한합니다. 이러한 설정은 공식 Google Meet API 생성 경로에만 적용되므로 OAuth 자격 증명이 구성되어 있어야 합니다.

이 옵션을 사용할 수 있기 전에 Google Meet 인증을 완료했다면 Google OAuth 동의 화면에 `meetings.space.settings` 범위를 추가한 후 `openclaw googlemeet auth login --json`을 다시 실행합니다.

참여하지 않고 URL만 만듭니다.

```bash
openclaw googlemeet create --no-join
```

`googlemeet create`에는 두 가지 경로가 있습니다.

- API 생성: Google Meet OAuth 자격 증명이 구성된 경우 사용됩니다. 가장 결정적인 경로이며 브라우저 UI 상태에 의존하지 않습니다.
- 브라우저 대체: OAuth 자격 증명이 없을 때 사용됩니다. OpenClaw는 고정된 Chrome 노드를 사용해 `https://meet.google.com/new`를 열고, Google이 실제 회의 코드 URL로 리디렉션할 때까지 기다린 다음 해당 URL을 반환합니다. 이 경로에서는 노드의 OpenClaw Chrome 프로필이 이미 Google에 로그인되어 있어야 합니다. 브라우저 자동화는 Meet 자체의 최초 실행 마이크 프롬프트를 처리합니다. 해당 프롬프트는 Google 로그인 실패로 취급되지 않습니다.
  참여 및 생성 흐름은 새 탭을 열기 전에 기존 Meet 탭도 재사용하려고 합니다. 매칭은 `authuser` 같은 무해한 URL 쿼리 문자열을 무시하므로, 에이전트가 재시도하면 두 번째 Chrome 탭을 만들지 않고 이미 열린 회의에 포커스해야 합니다.

명령/도구 출력에는 에이전트가 어떤 경로가 사용되었는지 설명할 수 있도록 `source` 필드(`api` 또는 `browser`)가 포함됩니다. `create`는 기본적으로 새 회의에 참여하고 `joined: true`와 참여 세션을 반환합니다. URL만 만들려면 CLI에서 `create --no-join`을 사용하거나 도구에 `"join": false`를 전달합니다.

또는 에이전트에게 "Google Meet을 만들고, 에이전트 말하기 응답 모드로 참여한 다음, 링크를 보내줘."라고 말합니다. 에이전트는 `action: "create"`로 `google_meet`를 호출한 다음 반환된 `meetingUri`를 공유해야 합니다.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

관찰 전용/브라우저 제어 참여의 경우 `"mode": "transcribe"`를 설정합니다. 이 모드는 양방향 실시간 음성 브리지를 시작하지 않고, BlackHole 또는 SoX가 필요 없으며, 회의에 말하기 응답을 하지 않습니다. 이 모드의 Chrome 참여는 OpenClaw의 마이크/카메라 권한 부여와 Meet **Use microphone** 경로도 피합니다. Meet이 오디오 선택 중간 화면을 표시하면 자동화는 마이크 없는 경로를 시도하고, 그렇지 않으면 로컬 마이크를 열지 않고 수동 작업을 보고합니다. 전사 모드에서 관리형 Chrome 전송은 최선 노력 방식의 Meet 캡션 관찰자도 설치합니다. `googlemeet status --json` 및 `googlemeet doctor`는 운영자가 브라우저가 통화에 참여했는지, Meet 캡션이 텍스트를 생성하는지 알 수 있도록 `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`, 짧은 `recentTranscript` 꼬리를 노출합니다.
예/아니요 프로브가 필요하면 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`를 사용합니다. 이 명령은 전사 모드로 참여하고, 새 캡션 또는 전사 움직임을 기다린 다음 `listenVerified`, `listenTimedOut`, 수동 작업 필드, 최신 캡션 상태를 반환합니다.

실시간 세션 중 `google_meet` 상태에는 `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, 마지막 입력/출력 타임스탬프, 바이트 카운터, 브리지 종료 상태 같은 브라우저 및 오디오 브리지 상태가 포함됩니다. 안전한 Meet 페이지 프롬프트가 나타나면 브라우저 자동화가 가능한 경우 이를 처리합니다. 로그인, 호스트 승인, 브라우저/OS 권한 프롬프트는 에이전트가 전달할 수 있도록 이유와 메시지를 포함한 수동 작업으로 보고됩니다. 관리형 Chrome 세션은 브라우저 상태가 `inCall: true`를 보고한 후에만 인트로 또는 테스트 문구를 내보냅니다. 그렇지 않으면 상태가 `speechReady: false`를 보고하고, 에이전트가 실제로 회의에서 말한 것처럼 가장하지 않고 말하기 시도를 차단합니다.

로컬 Chrome은 로그인된 OpenClaw 브라우저 프로필을 통해 참여합니다. 실시간 모드에는 OpenClaw가 사용하는 마이크/스피커 경로를 위해 `BlackHole 2ch`가 필요합니다. 깨끗한 양방향 오디오를 위해 별도의 가상 장치 또는 Loopback 스타일 그래프를 사용합니다. 단일 BlackHole 장치만으로도 첫 스모크 테스트에는 충분하지만 에코가 발생할 수 있습니다.

### 로컬 Gateway + Parallels Chrome

VM이 Chrome을 소유하게 만들기 위해 macOS VM 안에 전체 OpenClaw Gateway나 모델 API 키가 필요하지는 않습니다. Gateway와 에이전트를 로컬에서 실행한 다음 VM에서 노드 호스트를 실행합니다. 노드가 Chrome 명령을 광고하도록 VM에서 번들 Plugin을 한 번 활성화합니다.

각 위치에서 실행되는 항목:

- Gateway 호스트: OpenClaw Gateway, 에이전트 워크스페이스, 모델/API 키, 실시간 제공자, Google Meet Plugin 구성.
- Parallels macOS VM: OpenClaw CLI/노드 호스트, Google Chrome, SoX, BlackHole 2ch, Google에 로그인된 Chrome 프로필.
- VM에 필요 없는 항목: Gateway 서비스, 에이전트 구성, OpenAI/GPT 키, 모델 제공자 설정.

VM 의존성을 설치합니다.

```bash
brew install blackhole-2ch sox
```

BlackHole을 설치한 후 macOS가 `BlackHole 2ch`를 노출하도록 VM을 재부팅합니다.

```bash
sudo reboot
```

재부팅 후 VM이 오디오 장치와 SoX 명령을 볼 수 있는지 확인합니다.

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM에 OpenClaw를 설치하거나 업데이트한 다음, 거기에서 번들 Plugin을 활성화합니다.

```bash
openclaw plugins enable google-meet
```

VM에서 노드 호스트를 시작합니다.

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`가 LAN IP이고 TLS를 사용하지 않는 경우, 신뢰된 개인 네트워크에 명시적으로 동의하지 않으면 노드가 일반 텍스트 WebSocket을 거부합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

노드를 LaunchAgent로 설치할 때도 동일한 환경 변수를 사용합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`은 프로세스 환경이며 `openclaw.json` 설정이 아닙니다. `openclaw node install`은 설치 명령에 이 값이 있을 때 LaunchAgent 환경에 저장합니다.

Gateway 호스트에서 노드를 승인합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway가 노드를 보고 있고 노드가 `googlemeet.chrome` 및 브라우저 기능/`browser.proxy`를 모두 광고하는지 확인합니다.

```bash
openclaw nodes status
```

Gateway 호스트에서 해당 노드를 통해 Meet을 라우팅합니다.

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

이제 Gateway 호스트에서 일반적으로 참여합니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트에게 `transport: "chrome-node"`로 `google_meet` 도구를 사용하도록 요청합니다.

세션을 만들거나 재사용하고, 알려진 문구를 말한 뒤, 세션 상태를 출력하는 단일 명령 스모크 테스트:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

실시간 참여 중에는 OpenClaw 브라우저 자동화가 게스트 이름을 입력하고,
참여/참여 요청을 클릭하며, 해당 프롬프트가 표시되면 Meet의 첫 실행
"마이크 사용" 선택을 수락합니다. 관찰 전용 참여 또는 브라우저 전용 회의 생성
중에는 해당 선택을 사용할 수 있을 때 마이크 없이 동일한 프롬프트를 지나갑니다.
브라우저 프로필이 로그인되어 있지 않거나, Meet이 호스트 승인을 기다리고 있거나,
실시간 참여를 위해 Chrome에 마이크/카메라 권한이 필요하거나, Meet이 자동화로
해결할 수 없는 프롬프트에 멈춰 있는 경우, 참여/test-speech 결과는
`manualActionRequired: true`를 `manualActionReason` 및
`manualActionMessage`와 함께 보고합니다. 에이전트는 참여 재시도를 중지하고,
해당 정확한 메시지와 현재 `browserUrl`/`browserTitle`을 보고한 뒤, 수동
브라우저 작업이 완료된 후에만 다시 시도해야 합니다.

`chromeNode.node`가 생략되면, OpenClaw는 정확히 하나의 연결된 노드만
`googlemeet.chrome`과 브라우저 제어를 모두 알리는 경우에만 자동 선택합니다.
여러 사용 가능한 노드가 연결되어 있으면 `chromeNode.node`를 노드 ID,
표시 이름 또는 원격 IP로 설정하세요.

일반적인 실패 점검:

- `Configured Google Meet node ... is not usable: offline`: 고정된 노드는
  Gateway에 알려져 있지만 사용할 수 없습니다. 에이전트는 해당 노드를
  사용 가능한 Chrome 호스트가 아니라 진단 상태로 취급해야 하며, 사용자가
  요청하지 않은 한 다른 전송으로 대체하지 말고 설정 차단 요인을 보고해야
  합니다.
- `No connected Google Meet-capable node`: VM에서 `openclaw node run`을
  시작하고, 페어링을 승인하며, VM에서 `openclaw plugins enable google-meet`와
  `openclaw plugins enable browser`가 실행되었는지 확인하세요. 또한 Gateway
  호스트가 `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`로
  두 노드 명령을 모두 허용하는지도 확인하세요.
- `BlackHole 2ch audio device not found`: 점검 중인 호스트에
  `blackhole-2ch`를 설치하고 로컬 Chrome 오디오를 사용하기 전에 재부팅하세요.
- `BlackHole 2ch audio device not found on the node`: VM에 `blackhole-2ch`를
  설치하고 VM을 재부팅하세요.
- Chrome이 열리지만 참여할 수 없음: VM 내부의 브라우저 프로필에 로그인하거나,
  게스트 참여를 위해 `chrome.guestName`을 설정된 상태로 유지하세요. 게스트
  자동 참여는 노드 브라우저 프록시를 통해 OpenClaw 브라우저 자동화를
  사용합니다. 노드 브라우저 구성이 원하는 프로필을 가리키는지 확인하세요.
  예: `browser.defaultProfile: "user"` 또는 이름이 지정된 기존 세션 프로필.
- 중복 Meet 탭: `chrome.reuseExistingTab: true`를 활성화된 상태로 두세요.
  OpenClaw는 새 탭을 열기 전에 동일한 Meet URL의 기존 탭을 활성화하고,
  브라우저 회의 생성은 다른 탭을 열기 전에 진행 중인
  `https://meet.google.com/new` 또는 Google 계정 프롬프트 탭을 재사용합니다.
- 오디오 없음: Meet에서 마이크/스피커를 OpenClaw가 사용하는 가상 오디오
  장치 경로로 라우팅하세요. 깨끗한 양방향 오디오를 위해 별도의 가상 장치나
  Loopback 스타일 라우팅을 사용하세요.

## 설치 참고 사항

Chrome 토크백 기본값은 두 가지 외부 도구를 사용합니다.

- `sox`: 명령줄 오디오 유틸리티입니다. Plugin은 기본 24 kHz PCM16 오디오
  브리지에 명시적 CoreAudio 장치 명령을 사용합니다.
- `blackhole-2ch`: macOS 가상 오디오 드라이버입니다. Chrome/Meet이 라우팅할
  수 있는 `BlackHole 2ch` 오디오 장치를 만듭니다.

OpenClaw는 두 패키지 중 어느 것도 번들로 제공하거나 재배포하지 않습니다.
문서는 사용자에게 Homebrew를 통해 호스트 의존성으로 설치하도록 안내합니다.
SoX는 `LGPL-2.0-only AND GPL-2.0-only`로 라이선스가 부여되며, BlackHole은
GPL-3.0입니다. BlackHole을 OpenClaw와 함께 번들로 제공하는 설치 프로그램이나
어플라이언스를 빌드하는 경우, BlackHole의 업스트림 라이선스 조건을 검토하거나
Existential Audio에서 별도 라이선스를 받으세요.

## 전송

### Chrome

Chrome 전송은 OpenClaw 브라우저 제어를 통해 Meet URL을 열고 로그인된
OpenClaw 브라우저 프로필로 참여합니다. macOS에서는 Plugin이 실행 전에
`BlackHole 2ch`를 확인합니다. 구성된 경우 Chrome을 열기 전에 오디오 브리지
상태 명령과 시작 명령도 실행합니다. Chrome/오디오가 Gateway 호스트에 있으면
`chrome`을 사용하고, Chrome/오디오가 Parallels macOS VM과 같은 페어링된
노드에 있으면 `chrome-node`를 사용하세요. 로컬 Chrome의 경우
`browser.defaultProfile`로 프로필을 선택하세요. `chrome.browserProfile`은
`chrome-node` 호스트에 전달됩니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome 마이크와 스피커 오디오를 로컬 OpenClaw 오디오 브리지를 통해
라우팅하세요. `BlackHole 2ch`가 설치되어 있지 않으면 오디오 경로 없이
조용히 참여하는 대신 설정 오류로 참여가 실패합니다.

### Twilio

Twilio 전송은 Voice Call Plugin에 위임되는 엄격한 다이얼 플랜입니다.
Meet 페이지에서 전화번호를 파싱하지 않습니다.

Chrome 참여를 사용할 수 없거나 전화 다이얼인 대체 경로가 필요할 때
사용하세요. Google Meet은 회의에 대한 전화 다이얼인 번호와 PIN을 노출해야
합니다. OpenClaw는 Meet 페이지에서 이를 검색하지 않습니다.

Chrome 노드가 아니라 Gateway 호스트에서 Voice Call Plugin을 활성화하세요.

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

환경 또는 구성을 통해 Twilio 자격 증명을 제공하세요. 환경은 비밀 값을
`openclaw.json` 밖에 유지합니다.

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

실시간 음성 제공자가 OpenAI인 경우 대신 OpenAI provider Plugin과
`OPENAI_API_KEY`로 `realtime.provider: "openai"`를 사용하세요.

`voice-call`을 활성화한 후 Gateway를 다시 시작하거나 다시 로드하세요.
Plugin 구성 변경 사항은 다시 로드되기 전까지 이미 실행 중인 Gateway
프로세스에 나타나지 않습니다.

그런 다음 확인하세요.

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 위임이 연결되면 `googlemeet setup`에 성공한
`twilio-voice-call-plugin`, `twilio-voice-call-credentials`,
`twilio-voice-call-webhook` 점검이 포함됩니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

회의에 사용자 지정 시퀀스가 필요하면 `--dtmf-sequence`를 사용하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 및 사전 점검

`googlemeet create`가 브라우저 자동화로 대체할 수 있으므로 Meet 링크 생성에
OAuth는 선택 사항입니다. 공식 API 생성, 공간 확인 또는 Meet Media API 사전
점검이 필요할 때 OAuth를 구성하세요.

Google Meet API 접근은 사용자 OAuth를 사용합니다. Google Cloud OAuth
클라이언트를 만들고, 필요한 범위를 요청하고, Google 계정을 승인한 다음,
결과 refresh token을 Google Meet Plugin 구성에 저장하거나
`OPENCLAW_GOOGLE_MEET_*` 환경 변수를 제공하세요.

OAuth는 Chrome 참여 경로를 대체하지 않습니다. Chrome 및 Chrome-node 전송은
브라우저 참여를 사용할 때도 로그인된 Chrome 프로필, BlackHole/SoX, 연결된
노드를 통해 참여합니다. OAuth는 공식 Google Meet API 경로에만 사용됩니다.
회의 공간 생성, 공간 확인, Meet Media API 사전 점검 실행입니다.

### Google 자격 증명 만들기

Google Cloud Console에서:

1. Google Cloud 프로젝트를 만들거나 선택합니다.
2. 해당 프로젝트에 대해 **Google Meet REST API**를 활성화합니다.
3. OAuth 동의 화면을 구성합니다.
   - Google Workspace 조직의 경우 **Internal**이 가장 간단합니다.
   - 개인/테스트 설정에는 **External**이 작동합니다. 앱이 Testing 상태인 동안,
     앱을 승인할 각 Google 계정을 테스트 사용자로 추가하세요.
4. OpenClaw가 요청하는 범위를 추가합니다.
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. OAuth 클라이언트 ID를 만듭니다.
   - 애플리케이션 유형: **Web application**.
   - 승인된 리디렉션 URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 클라이언트 ID와 클라이언트 보안 비밀을 복사합니다.

`meetings.space.created`는 Google Meet `spaces.create`에 필요합니다.
`meetings.space.readonly`는 OpenClaw가 Meet URL/코드를 공간으로 확인할 수
있게 합니다.
`meetings.space.settings`는 OpenClaw가 API 룸 생성 중 `accessType` 같은
`SpaceConfig` 설정을 전달할 수 있게 합니다.
`meetings.conference.media.readonly`는 Meet Media API 사전 점검 및 미디어
작업을 위한 것입니다. 실제 Media API 사용에는 Google이 Developer Preview
등록을 요구할 수 있습니다. 브라우저 기반 Chrome 참여만 필요하다면 OAuth를
완전히 건너뛰세요.

### refresh token 발급

`oauth.clientId`와 선택적으로 `oauth.clientSecret`을 구성하거나 환경 변수로
전달한 다음 실행하세요.

```bash
openclaw googlemeet auth login --json
```

이 명령은 refresh token이 포함된 `oauth` 구성 블록을 출력합니다. PKCE,
`http://localhost:8085/oauth2callback`의 localhost 콜백, 그리고 `--manual`을
사용한 수동 복사/붙여넣기 흐름을 사용합니다.

예:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

브라우저가 로컬 콜백에 도달할 수 없을 때는 수동 모드를 사용하세요.

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 출력에는 다음이 포함됩니다.

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

`oauth` 객체를 Google Meet Plugin 구성 아래에 저장하세요.

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

refresh token을 구성에 넣고 싶지 않을 때는 환경 변수를 선호하세요.
구성과 환경 값이 모두 있으면 Plugin은 먼저 구성을 확인한 다음 환경으로
대체합니다.

OAuth 동의에는 Meet 공간 생성, Meet 공간 읽기 접근, Meet 회의 미디어 읽기
접근이 포함됩니다. 회의 생성 지원이 생기기 전에 인증했다면 refresh token에
`meetings.space.created` 범위가 있도록 `openclaw googlemeet auth login --json`을
다시 실행하세요.

### doctor로 OAuth 확인

빠른 비밀 값 없는 상태 점검이 필요할 때 OAuth doctor를 실행하세요.

```bash
openclaw googlemeet doctor --oauth --json
```

이 명령은 Chrome 런타임을 로드하지 않으며 연결된 Chrome 노드가 필요하지
않습니다. OAuth 구성이 존재하는지와 refresh token이 access token을 발급할 수
있는지 확인합니다. JSON 보고서에는 `ok`, `configured`, `tokenSource`,
`expiresAt`, 점검 메시지 같은 상태 필드만 포함됩니다. access token,
refresh token 또는 클라이언트 보안 비밀은 출력하지 않습니다.

일반적인 결과:

| 검사                 | 의미                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId`와 `oauth.refreshToken`, 또는 캐시된 액세스 토큰이 있습니다.       |
| `oauth-token`        | 캐시된 액세스 토큰이 아직 유효하거나, 새로고침 토큰이 새 액세스 토큰을 발급했습니다. |
| `meet-spaces-get`    | 선택적 `--meeting` 검사가 기존 Meet 공간을 확인했습니다.                             |
| `meet-spaces-create` | 선택적 `--create-space` 검사가 새 Meet 공간을 만들었습니다.                               |

Google Meet API 활성화와 `spaces.create` 범위도 증명하려면 부수 효과가 있는 만들기 검사를 실행하세요.

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space`는 일회용 Meet URL을 만듭니다. Google Cloud 프로젝트에 Meet API가 활성화되어 있고 승인된 계정에 `meetings.space.created` 범위가 있는지 확인해야 할 때 사용하세요.

기존 회의 공간에 대한 읽기 액세스를 증명하려면 다음을 실행하세요.

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` 및 `resolve-space`는 승인된 Google 계정이 액세스할 수 있는 기존 공간에 대한 읽기 액세스를 증명합니다. 이러한 검사에서 `403`이 반환되면 일반적으로 Google Meet REST API가 비활성화되어 있거나, 동의한 새로고침 토큰에 필요한 범위가 없거나, Google 계정이 해당 Meet 공간에 액세스할 수 없다는 의미입니다. 새로고침 토큰 오류는 `openclaw googlemeet auth login
--json`을 다시 실행하고 새 `oauth` 블록을 저장해야 함을 의미합니다.

브라우저 대체 모드에는 OAuth 자격 증명이 필요하지 않습니다. 이 모드에서 Google 인증은 OpenClaw 구성에서가 아니라 선택한 Node의 로그인된 Chrome 프로필에서 가져옵니다.

다음 환경 변수를 대체값으로 사용할 수 있습니다.

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 또는 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 또는 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 또는
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 또는 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 또는 `GOOGLE_MEET_PREVIEW_ACK`

Meet URL, 코드 또는 `spaces/{id}`를 `spaces.get`을 통해 확인하세요.

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

미디어 작업 전에 사전 점검을 실행하세요.

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet에서 회의 기록을 만든 후 회의 아티팩트와 참석 정보를 나열하세요.

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting`을 사용하면 `artifacts` 및 `attendance`는 기본적으로 최신 회의 기록을 사용합니다. 해당 회의의 보존된 모든 기록을 원할 때는 `--all-conference-records`를 전달하세요.

캘린더 조회는 Meet 아티팩트를 읽기 전에 Google Calendar에서 회의 URL을 확인할 수 있습니다.

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`는 오늘의 `primary` 캘린더에서 Google Meet 링크가 있는 Calendar 이벤트를 검색합니다. 일치하는 이벤트 텍스트를 검색하려면 `--event <query>`를 사용하고, 기본 캘린더가 아닌 캘린더에는 `--calendar <id>`를 사용하세요. 캘린더 조회에는 Calendar 이벤트 읽기 전용 범위를 포함하는 새로운 OAuth 로그인이 필요합니다.
`calendar-events`는 일치하는 Meet 이벤트를 미리 보여 주고 `latest`, `artifacts`, `attendance` 또는 `export`가 선택할 이벤트를 표시합니다.

이미 회의 기록 ID를 알고 있다면 직접 지정하세요.

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

통화 후 방을 닫고 싶을 때 API로 만든 공간의 활성 회의를 종료하세요.

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

이는 Google Meet `spaces.endActiveConference`를 호출하며 승인된 계정이 관리할 수 있는 공간에 대해 `meetings.space.created` 범위가 포함된 OAuth가 필요합니다.
OpenClaw는 Meet URL, 회의 코드 또는 `spaces/{id}` 입력을 받아 활성 회의를 종료하기 전에 API 공간 리소스로 확인합니다.
이는 `googlemeet leave`와 별개입니다. `leave`는 OpenClaw의 로컬/세션 참여를 중지하는 반면, `end-active-conference`는 Google Meet에 해당 공간의 활성 회의를 종료하도록 요청합니다.

읽기 쉬운 보고서를 작성하세요.

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

Google이 회의에 대해 노출하는 경우 `artifacts`는 회의 기록 메타데이터와 참가자, 녹화, 스크립트, 구조화된 스크립트 항목, 스마트 노트 리소스 메타데이터를 반환합니다. 큰 회의에서 항목 조회를 건너뛰려면 `--no-transcript-entries`를 사용하세요. `attendance`는 참가자를 첫/마지막 확인 시간, 총 세션 지속 시간, 지각/조기 퇴장 플래그, 로그인한 사용자 또는 표시 이름으로 병합된 중복 참가자 리소스가 포함된 참가자 세션 행으로 확장합니다. 원시 참가자 리소스를 분리된 상태로 유지하려면 `--no-merge-duplicates`를, 지각 감지를 조정하려면 `--late-after-minutes`를, 조기 퇴장 감지를 조정하려면 `--early-before-minutes`를 전달하세요.

`export`는 `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json`, `manifest.json`이 들어 있는 폴더를 작성합니다.
`manifest.json`은 선택한 입력, 내보내기 옵션, 회의 기록, 출력 파일, 개수, 토큰 소스, 사용된 경우 Calendar 이벤트, 부분 검색 경고를 기록합니다. 폴더 옆에 이식 가능한 아카이브도 작성하려면 `--zip`을 전달하세요. 연결된 스크립트 및 스마트 노트 Google Docs 텍스트를 Google Drive `files.export`를 통해 내보내려면 `--include-doc-bodies`를 전달하세요. 여기에는 Drive Meet 읽기 전용 범위를 포함하는 새로운 OAuth 로그인이 필요합니다. `--include-doc-bodies`가 없으면 내보내기에는 Meet 메타데이터와 구조화된 스크립트 항목만 포함됩니다. Google이 스마트 노트 목록, 스크립트 항목 또는 Drive 문서 본문 오류와 같은 부분 아티팩트 실패를 반환하면, 전체 내보내기를 실패시키지 않고 요약과 매니페스트에 경고를 유지합니다.
폴더나 ZIP을 만들지 않고 동일한 아티팩트/참석 데이터를 가져와 매니페스트 JSON을 출력하려면 `--dry-run`을 사용하세요. 큰 내보내기를 작성하기 전이나 에이전트에 개수, 선택된 기록, 경고만 필요할 때 유용합니다.

에이전트는 `google_meet` 도구를 통해 동일한 번들도 만들 수 있습니다.

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

파일 쓰기를 건너뛰고 내보내기 매니페스트만 반환하려면 `"dryRun": true`를 설정하세요.

에이전트는 명시적 액세스 정책으로 API 기반 방도 만들 수 있습니다.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

또한 알려진 방의 활성 회의를 종료할 수도 있습니다.

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

먼저 듣기 검증을 위해 에이전트는 회의가 유용하다고 주장하기 전에 `test_listen`을 사용해야 합니다.

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

실제 보존된 회의에 대해 보호된 라이브 스모크를 실행하세요.

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

누군가 말하고 Meet 자막을 사용할 수 있는 회의에 대해 라이브 먼저 듣기 브라우저 프로브를 실행하세요.

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

라이브 스모크 환경:

- `OPENCLAW_LIVE_TEST=1`은 보호된 라이브 테스트를 활성화합니다.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`은 보존된 Meet URL, 코드 또는
  `spaces/{id}`를 가리킵니다.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`는 OAuth
  클라이언트 ID를 제공합니다.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`은
  새로고침 토큰을 제공합니다.
- 선택 사항: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, 및
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`은 `OPENCLAW_` 접두사가 없는 동일한 대체 이름을 사용합니다.

기본 아티팩트/참석 라이브 스모크에는
`https://www.googleapis.com/auth/meetings.space.readonly` 및
`https://www.googleapis.com/auth/meetings.conference.media.readonly`가 필요합니다. 캘린더 조회에는 `https://www.googleapis.com/auth/calendar.events.readonly`가 필요합니다. Drive 문서 본문 내보내기에는
`https://www.googleapis.com/auth/drive.meet.readonly`가 필요합니다.

새 Meet 공간을 만드세요.

```bash
openclaw googlemeet create
```

이 명령은 새 `meeting uri`, 소스, 참여 세션을 출력합니다. OAuth 자격 증명이 있으면 공식 Google Meet API를 사용합니다. OAuth 자격 증명이 없으면 고정된 Chrome Node의 로그인된 브라우저 프로필을 대체 수단으로 사용합니다. 에이전트는 `action: "create"`와 함께 `google_meet` 도구를 사용하여 한 단계로 만들고 참여할 수 있습니다. URL만 만들려면 `"join": false`를 전달하세요.

브라우저 대체 모드의 예시 JSON 출력:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

브라우저 대체 모드가 URL을 만들기 전에 Google 로그인 또는 Meet 권한 차단에 걸리면 Gateway 메서드는 실패한 응답을 반환하고 `google_meet` 도구는 일반 문자열 대신 구조화된 세부 정보를 반환합니다.

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

에이전트가 `manualActionRequired: true`를 보면 `manualActionMessage`와 브라우저 Node/탭 컨텍스트를 보고하고, 운영자가 브라우저 단계를 완료할 때까지 새 Meet 탭을 열지 않아야 합니다.

API 만들기의 예시 JSON 출력:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Meet를 만들면 기본적으로 참여합니다. Chrome 또는 Chrome-node 전송 방식은
브라우저를 통해 참여하기 위해 로그인된 Google Chrome 프로필이 여전히
필요합니다. 프로필이 로그아웃되어 있으면 OpenClaw는
`manualActionRequired: true` 또는 브라우저 폴백 오류를 보고하고, 재시도하기
전에 운영자가 Google 로그인을 완료하도록 요청합니다.

Cloud 프로젝트, OAuth 주체, 회의 참가자가 Meet 미디어 API용 Google
Workspace Developer Preview Program에 등록되어 있음을 확인한 후에만
`preview.enrollmentAcknowledged: true`를 설정하세요.

## 구성

공통 Chrome 에이전트 경로에는 Plugin 활성화, BlackHole, SoX, 실시간 전사
제공자 키, 구성된 OpenClaw TTS 제공자만 필요합니다. OpenAI가 기본 전사
제공자입니다. 기본 에이전트 모드 전사 제공자를 변경하지 않고 `bidi`
모드에서 Google Gemini Live를 사용하려면 `realtime.voiceProvider`를
`"google"`로, `realtime.model`을 설정하세요.

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Plugin 구성을 `plugins.entries.google-meet.config` 아래에 설정하세요.

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

기본값:

- `defaultTransport: "chrome"`
- `defaultMode: "agent"`(`"realtime"`은 `"agent"`의 레거시 호환 별칭으로만
  허용됩니다. 새 도구 호출에서는 `"agent"`를 사용해야 합니다.)
- `chromeNode.node`: `chrome-node`의 선택적 노드 ID/이름/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: 로그아웃된 Meet 게스트 화면에서
  사용하는 이름
- `chrome.autoJoin: true`: `chrome-node`의 OpenClaw 브라우저 자동화를 통해
  최선 노력 방식으로 게스트 이름을 입력하고 지금 참여를 클릭합니다.
- `chrome.reuseExistingTab: true`: 중복 탭을 여는 대신 기존 Meet 탭을
  활성화합니다.
- `chrome.waitForInCallMs: 20000`: 응답 소개가 트리거되기 전에 Meet 탭이
  통화 중임을 보고할 때까지 기다립니다.
- `chrome.audioFormat: "pcm16-24khz"`: 명령 쌍 오디오 형식입니다. 아직 전화
  오디오를 내보내는 레거시/사용자 지정 명령 쌍에만 `"g711-ulaw-8khz"`를
  사용하세요.
- `chrome.audioBufferBytes: 4096`: 생성된 Chrome 명령 쌍 오디오 명령의 SoX
  처리 버퍼입니다. 이는 SoX 기본 8192바이트 버퍼의 절반으로, 기본 파이프
  지연 시간을 줄이면서 바쁜 호스트에서 값을 높일 여지를 남깁니다. SoX
  최솟값보다 낮은 값은 17바이트로 제한됩니다.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch`에서 읽고
  `chrome.audioFormat`으로 오디오를 쓰는 SoX 명령
- `chrome.audioOutputCommand`: `chrome.audioFormat`의 오디오를 읽고 CoreAudio
  `BlackHole 2ch`에 쓰는 SoX 명령
- `chrome.bargeInInputCommand`: 어시스턴트 재생이 활성 상태일 때 사람의
  끼어들기 감지를 위해 부호 있는 16비트 리틀 엔디언 모노 PCM을 쓰는
  선택적 로컬 마이크 명령입니다. 현재 이는 Gateway 호스팅 `chrome` 명령
  쌍 브리지에 적용됩니다.
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand`에서 사람의
  끼어들기로 간주되는 RMS 수준
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand`에서
  사람의 끼어들기로 간주되는 피크 수준
- `chrome.bargeInCooldownMs: 900`: 반복되는 사람 끼어들기 해제 사이의 최소
  지연 시간
- `mode: "agent"`: 기본 응답 모드입니다. 참가자 음성은 구성된 실시간 전사
  제공자가 전사하고, 회의별 하위 에이전트 세션의 구성된 OpenClaw
  에이전트로 전송되며, 일반 OpenClaw TTS 런타임을 통해 음성으로
  출력됩니다.
- `mode: "bidi"`: 폴백 직접 양방향 실시간 모델 모드입니다. 실시간 음성
  제공자가 참가자 음성에 직접 응답하며, 더 깊거나 도구 기반인 답변을 위해
  `openclaw_agent_consult`를 호출할 수 있습니다.
- `mode: "transcribe"`: 응답 브리지 없는 관찰 전용 모드입니다.
- `realtime.provider: "openai"`: 아래의 범위 지정 제공자 필드가 설정되지
  않았을 때 사용되는 호환성 폴백입니다.
- `realtime.transcriptionProvider: "openai"`: `agent` 모드가 실시간 전사에
  사용하는 제공자 ID입니다.
- `realtime.voiceProvider`: `bidi` 모드가 직접 실시간 음성에 사용하는 제공자
  ID입니다. 에이전트 모드 전사는 OpenAI로 유지하면서 Gemini Live를
  사용하려면 이를 `"google"`로 설정하세요.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 더 깊은 답변에는 `openclaw_agent_consult`를
  사용하는 짧은 음성 응답
- `realtime.introMessage`: 실시간 브리지가 연결될 때의 짧은 음성 준비 확인
  메시지입니다. 조용히 참여하려면 `""`로 설정하세요.
- `realtime.agentId`: `openclaw_agent_consult`용 선택적 OpenClaw 에이전트
  ID입니다. 기본값은 `main`입니다.

선택적 재정의:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
  },
  chromeNode: {
    node: "parallels-macos",
  },
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
      },
    },
  },
}
```

에이전트 모드 듣기와 말하기 모두에 ElevenLabs 사용:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

지속되는 Meet 음성은 `messages.tts.providers.elevenlabs.voiceId`에서 옵니다.
TTS 모델 재정의가 활성화된 경우 에이전트 응답은 응답별
`[[tts:voiceId=... model=eleven_v3]]` 지시문도 사용할 수 있지만, 회의의
결정적 기본값은 구성입니다. 참여 시 로그에는
`transcriptionProvider=elevenlabs`가 표시되어야 하며, 각 음성 응답은
`provider=elevenlabs model=eleven_v3 voice=<voiceId>`를 기록해야 합니다.

Twilio 전용 구성:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled`의 기본값은 `true`입니다. Twilio 전송 방식을 사용하면
실제 PSTN 통화, DTMF, 소개 인사말을 Voice Call Plugin에 위임합니다. Voice
Call은 실시간 미디어 스트림을 열기 전에 DTMF 시퀀스를 재생한 다음, 저장된
소개 텍스트를 초기 실시간 인사말로 사용합니다. `voice-call`이 활성화되어
있지 않으면 Google Meet은 여전히 다이얼 플랜을 검증하고 기록할 수 있지만
Twilio 통화를 걸 수는 없습니다.

## 도구

에이전트는 `google_meet` 도구를 사용할 수 있습니다.

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Chrome이 Gateway 호스트에서 실행될 때는 `transport: "chrome"`을
사용하세요. Chrome이 Parallels VM 같은 페어링된 노드에서 실행될 때는
`transport: "chrome-node"`를 사용하세요. 두 경우 모두 모델 제공자와
`openclaw_agent_consult`는 Gateway 호스트에서 실행되므로 모델 자격 증명은
그곳에 유지됩니다. 기본 `mode: "agent"`에서는 실시간 전사 제공자가 듣기를
처리하고, 구성된 OpenClaw 에이전트가 답변을 생성하며, 일반 OpenClaw TTS가
이를 Meet에 말합니다. 실시간 음성 모델이 직접 답변하도록 하려면
`mode: "bidi"`를 사용하세요. 원시 `mode: "realtime"`은 `mode: "agent"`의
레거시 호환 별칭으로 계속 허용되지만, 더 이상 에이전트 도구 스키마에
노출되지 않습니다. 에이전트 모드 로그에는 브리지 시작 시 확인된 전사
제공자/모델과, 각 합성 응답 후 TTS 제공자, 모델, 음성, 출력 형식, 샘플
레이트가 포함됩니다.

활성 세션을 나열하거나 세션 ID를 검사하려면 `action: "status"`를
사용하세요. 실시간 에이전트가 즉시 말하도록 하려면 `sessionId` 및
`message`와 함께 `action: "speak"`를 사용하세요. 세션을 생성하거나
재사용하고, 알려진 문구를 트리거하며, Chrome 호스트가 보고할 수 있을 때
`inCall` 상태를 반환하려면 `action: "test_speech"`를 사용하세요.
`test_speech`는 항상 `mode: "agent"`를 강제하며, 관찰 전용 세션은 의도적으로
음성을 내보낼 수 없으므로 `mode: "transcribe"`로 실행하라고 요청하면
실패합니다. `speechOutputVerified` 결과는 이 테스트 호출 중 실시간 오디오
출력 바이트가 증가했는지를 기준으로 하므로, 이전 오디오가 있는 재사용된
세션은 새로운 성공적 음성 확인으로 간주되지 않습니다. 세션을 종료됨으로
표시하려면 `action: "leave"`를 사용하세요.

`status`에는 사용 가능한 경우 Chrome 상태가 포함됩니다.

- `inCall`: Chrome이 Meet 통화 안에 있는 것으로 보입니다.
- `micMuted`: 최선 노력 방식의 Meet 마이크 상태
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`:
  음성이 작동하기 전에 브라우저 프로필에 수동 로그인, Meet 호스트 승인,
  권한 또는 브라우저 제어 복구가 필요합니다.
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: 관리형
  Chrome 음성이 지금 허용되는지 여부입니다. `speechReady: false`는
  OpenClaw가 소개/테스트 문구를 오디오 브리지로 보내지 않았음을 의미합니다.
- `providerConnected` / `realtimeReady`: 실시간 음성 브리지 상태
- `lastInputAt` / `lastOutputAt`: 브리지에서 마지막으로 확인되었거나
  브리지로 전송된 오디오
- `audioOutputRouted` / `audioOutputDeviceLabel`: Meet 탭의 미디어 출력이
  브리지에서 사용하는 BlackHole 장치로 능동적으로 라우팅되었는지 여부
- `lastSuppressedInputAt` / `suppressedInputBytes`: 어시스턴트 재생이 활성
  상태일 때 무시된 루프백 입력

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## 에이전트 및 Bidi 모드

Chrome `agent` 모드는 "내 에이전트가 회의에 있음" 동작에 최적화되어
있습니다. 실시간 전사 제공자가 회의 오디오를 듣고, 최종 참가자 전사는
구성된 OpenClaw 에이전트로 라우팅되며, 답변은 일반 OpenClaw TTS 런타임을
통해 음성으로 출력됩니다. 실시간 음성 모델이 직접 답변하도록 하려면
`mode: "bidi"`를 설정하세요. 가까운 최종 전사 조각은 consult 전에 병합되어
하나의 발화 차례가 여러 개의 오래된 부분 답변을 만들지 않도록 합니다. 또한
대기 중인 어시스턴트 오디오가 아직 재생되는 동안에는 실시간 입력이
억제되며, 최근 어시스턴트와 유사한 전사 에코는 에이전트 consult 전에
무시되어 BlackHole 루프백으로 인해 에이전트가 자신의 말에 답변하지 않도록
합니다.

| 모드    | 답변을 결정하는 주체        | 음성 출력 경로                     | 사용할 때                                              |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 구성된 OpenClaw 에이전트 | 일반 OpenClaw TTS 런타임            | "내 에이전트가 회의에 있음" 동작을 원할 때        |
| `bidi`  | 실시간 음성 모델      | 실시간 음성 제공자 오디오 응답 | 가장 낮은 지연 시간의 대화형 음성 루프를 원할 때 |

`bidi` 모드에서 실시간 모델에 더 깊은 추론, 최신 정보 또는 일반 OpenClaw
도구가 필요하면 `openclaw_agent_consult`를 호출할 수 있습니다.

consult 도구는 백그라운드에서 최근 회의 대화록 컨텍스트와 함께 일반 OpenClaw 에이전트를 실행하고 간결한 음성 답변을 반환합니다. `agent` 모드에서는 OpenClaw가 그 답변을 TTS 런타임으로 직접 보내며, `bidi` 모드에서는 실시간 음성 모델이 consult 결과를 회의에 다시 말할 수 있습니다. 이는 Voice Call과 동일한 공유 consult 메커니즘을 사용합니다.

기본적으로 consult는 `main` 에이전트에서 실행됩니다. Meet 레인이 전용 OpenClaw 에이전트 워크스페이스, 모델 기본값, 도구 정책, 메모리, 세션 기록을 consult해야 하는 경우 `realtime.agentId`를 설정하세요.

에이전트 모드 consult는 회의별 `agent:<id>:subagent:google-meet:<session>` 세션 키를 사용하므로 후속 질문은 구성된 에이전트의 일반 에이전트 정책을 상속하면서 회의 컨텍스트를 유지합니다.

`realtime.toolPolicy`는 consult 실행을 제어합니다.

- `safe-read-only`: consult 도구를 노출하고 일반 에이전트를 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`으로 제한합니다.
- `owner`: consult 도구를 노출하고 일반 에이전트가 일반 에이전트 도구 정책을 사용하도록 허용합니다.
- `none`: 실시간 음성 모델에 consult 도구를 노출하지 않습니다.

consult 세션 키는 Meet 세션별로 범위가 지정되므로 후속 consult 호출은 같은 회의 중 이전 consult 컨텍스트를 재사용할 수 있습니다.

Chrome이 통화에 완전히 참가한 후 음성 준비 상태 확인을 강제하려면:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

전체 참가 및 말하기 스모크 테스트는 다음과 같습니다.

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 라이브 테스트 체크리스트

무인 에이전트에 회의를 넘기기 전에 이 순서를 사용하세요.

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

예상 Chrome-node 상태:

- `googlemeet setup`이 모두 초록색입니다.
- Chrome-node가 기본 전송 방식이거나 노드가 고정된 경우 `googlemeet setup`에 `chrome-node-connected`가 포함됩니다.
- `nodes status`에 선택한 노드가 연결된 것으로 표시됩니다.
- 선택한 노드가 `googlemeet.chrome`과 `browser.proxy`를 모두 알립니다.
- Meet 탭이 통화에 참가하고 `test-speech`가 `inCall: true`와 함께 Chrome 상태를 반환합니다.

Parallels macOS VM 같은 원격 Chrome 호스트의 경우, Gateway 또는 VM을 업데이트한 뒤 다음이 가장 짧은 안전 확인입니다.

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

이는 에이전트가 실제 회의 탭을 열기 전에 Gateway Plugin이 로드되었고, VM 노드가 현재 토큰으로 연결되었으며, Meet 오디오 브리지를 사용할 수 있음을 증명합니다.

Twilio 스모크 테스트에는 전화 다이얼인 세부 정보를 노출하는 회의를 사용하세요.

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

예상 Twilio 상태:

- `googlemeet setup`에 초록색 `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, `twilio-voice-call-webhook` 확인이 포함됩니다.
- Gateway 다시 로드 후 CLI에서 `voicecall`을 사용할 수 있습니다.
- 반환된 세션에 `transport: "twilio"`와 `twilio.voiceCallId`가 있습니다.
- `openclaw logs --follow`에 실시간 TwiML 전에 DTMF TwiML이 제공된 뒤, 초기 인사말이 대기열에 들어간 실시간 브리지가 표시됩니다.
- `googlemeet leave <sessionId>`가 위임된 음성 통화를 끊습니다.

## 문제 해결

### 에이전트가 Google Meet 도구를 볼 수 없음

Gateway 구성에서 Plugin이 활성화되었는지 확인하고 Gateway를 다시 로드하세요.

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

방금 `plugins.entries.google-meet`를 편집했다면 Gateway를 다시 시작하거나 다시 로드하세요. 실행 중인 에이전트는 현재 Gateway 프로세스가 등록한 Plugin 도구만 볼 수 있습니다.

macOS가 아닌 Gateway 호스트에서는 에이전트용 `google_meet` 도구가 계속 표시되지만, 로컬 Chrome talk-back 작업은 오디오 브리지에 도달하기 전에 차단됩니다. 로컬 Chrome talk-back 오디오는 현재 macOS `BlackHole 2ch`에 의존하므로 Linux 에이전트는 기본 로컬 Chrome 에이전트 경로 대신 `mode: "transcribe"`, Twilio 다이얼인 또는 macOS `chrome-node` 호스트를 사용해야 합니다.

### 연결된 Google Meet 지원 노드 없음

노드 호스트에서 실행하세요.

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway 호스트에서 노드를 승인하고 명령을 확인하세요.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

노드는 연결되어 있어야 하며 `googlemeet.chrome` 및 `browser.proxy`를 나열해야 합니다. Gateway 구성은 해당 노드 명령을 허용해야 합니다.

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`에서 `chrome-node-connected`가 실패하거나 Gateway 로그가 `gateway token mismatch`를 보고하면, 현재 Gateway 토큰으로 노드를 다시 설치하거나 다시 시작하세요. LAN Gateway의 경우 이는 보통 다음을 의미합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

그런 다음 노드 서비스를 다시 로드하고 다시 실행하세요.

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 브라우저는 열리지만 에이전트가 참가할 수 없음

관찰 전용 참가에는 `googlemeet test-listen`을, 실시간 참가에는 `googlemeet test-speech`를 실행한 다음 반환된 Chrome 상태를 검사하세요. 어느 프로브든 `manualActionRequired: true`를 보고하면 운영자에게 `manualActionMessage`를 보여주고 브라우저 작업이 완료될 때까지 재시도를 중지하세요.

일반적인 수동 작업:

- Chrome 프로필에 로그인합니다.
- Meet 호스트 계정에서 게스트를 승인합니다.
- Chrome의 네이티브 권한 프롬프트가 나타나면 Chrome 마이크/카메라 권한을 부여합니다.
- 멈춘 Meet 권한 대화 상자를 닫거나 복구합니다.

Meet에 "Do you want people to hear you in the meeting?"가 표시된다는 이유만으로 "not signed in"을 보고하지 마세요. 이는 Meet의 오디오 선택 중간 화면입니다. OpenClaw는 사용 가능한 경우 브라우저 자동화를 통해 **Use microphone**을 클릭하고 실제 회의 상태를 계속 기다립니다. 생성 전용 브라우저 fallback의 경우 URL 생성에는 실시간 오디오 경로가 필요하지 않으므로 OpenClaw가 **Continue without microphone**을 클릭할 수 있습니다.

### 회의 생성 실패

`googlemeet create`는 OAuth 자격 증명이 구성된 경우 먼저 Google Meet API `spaces.create` 엔드포인트를 사용합니다. OAuth 자격 증명이 없으면 고정된 Chrome 노드 브라우저로 fallback합니다. 다음을 확인하세요.

- API 생성: `oauth.clientId`와 `oauth.refreshToken`이 구성되어 있거나, 일치하는 `OPENCLAW_GOOGLE_MEET_*` 환경 변수가 있어야 합니다.
- API 생성: 생성 지원이 추가된 뒤 refresh token이 발급되었어야 합니다. 오래된 토큰에는 `meetings.space.created` scope가 없을 수 있습니다. `openclaw googlemeet auth login --json`을 다시 실행하고 Plugin 구성을 업데이트하세요.
- 브라우저 fallback: `defaultTransport: "chrome-node"` 및 `chromeNode.node`가 `browser.proxy`와 `googlemeet.chrome`을 가진 연결된 노드를 가리켜야 합니다.
- 브라우저 fallback: 해당 노드의 OpenClaw Chrome 프로필이 Google에 로그인되어 있고 `https://meet.google.com/new`를 열 수 있어야 합니다.
- 브라우저 fallback: 재시도는 새 탭을 열기 전에 기존 `https://meet.google.com/new` 또는 Google 계정 프롬프트 탭을 재사용합니다. 에이전트가 시간 초과되면 다른 Meet 탭을 수동으로 열지 말고 도구 호출을 재시도하세요.
- 브라우저 fallback: 도구가 `manualActionRequired: true`를 반환하면 반환된 `browser.nodeId`, `browser.targetId`, `browserUrl`, `manualActionMessage`를 사용해 운영자를 안내하세요. 해당 작업이 완료될 때까지 루프로 재시도하지 마세요.
- 브라우저 fallback: Meet에 "Do you want people to hear you in the meeting?"가 표시되면 탭을 열어 둡니다. OpenClaw는 브라우저 자동화를 통해 **Use microphone** 또는 생성 전용 fallback의 경우 **Continue without microphone**을 클릭하고 생성된 Meet URL을 계속 기다려야 합니다. 할 수 없는 경우 오류는 `google-login-required`가 아니라 `meet-audio-choice-required`를 언급해야 합니다.

### 에이전트가 참가하지만 말하지 않음

실시간 경로를 확인하세요.

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

일반 STT -> OpenClaw 에이전트 -> TTS talk-back 경로에는 `mode: "agent"`를 사용하고, 직접 실시간 음성 fallback에는 `mode: "bidi"`를 사용하세요. `mode: "transcribe"`는 의도적으로 talk-back 브리지를 시작하지 않습니다. 관찰 전용 디버깅의 경우 참가자가 말한 뒤 `openclaw googlemeet status --json <session-id>`를 실행하고 `captioning`, `transcriptLines`, `lastCaptionText`를 확인하세요. `inCall`이 true이지만 `transcriptLines`가 `0`에 머무르면 Meet 자막이 비활성화되었거나, 관찰자가 설치된 이후 아무도 말하지 않았거나, Meet UI가 변경되었거나, 회의 언어/계정에서 실시간 자막을 사용할 수 없을 수 있습니다.

`googlemeet test-speech`는 항상 실시간 경로를 확인하고 해당 호출에서 브리지 출력 바이트가 관찰되었는지 보고합니다. `speechOutputVerified`가 false이고 `speechOutputTimedOut`이 true이면 실시간 제공자가 발화를 수락했을 수 있지만, OpenClaw가 새 출력 바이트가 Chrome 오디오 브리지에 도달하는 것을 보지 못한 것입니다.

또한 다음을 확인하세요.

- Gateway 호스트에서 `OPENAI_API_KEY` 또는 `GEMINI_API_KEY` 같은 실시간 제공자 키를 사용할 수 있습니다.
- Chrome 호스트에서 `BlackHole 2ch`가 보입니다.
- Chrome 호스트에 `sox`가 있습니다.
- Meet 마이크와 스피커가 OpenClaw가 사용하는 가상 오디오 경로를 통해 라우팅됩니다. 로컬 Chrome 실시간 참가의 경우 `doctor`에 `meet output routed: yes`가 표시되어야 합니다.

`googlemeet doctor [session-id]`는 세션, 노드, 통화 중 상태, 수동 작업 이유, 실시간 제공자 연결, `realtimeReady`, 오디오 입력/출력 활동, 마지막 오디오 타임스탬프, 바이트 카운터, 브라우저 URL을 출력합니다. 원시 JSON이 필요하면 `googlemeet status [session-id] --json`을 사용하세요. 토큰을 노출하지 않고 Google Meet OAuth refresh를 확인해야 하면 `googlemeet doctor --oauth`를 사용하세요. Google Meet API 증명도 필요하면 `--meeting` 또는 `--create-space`를 추가하세요.

에이전트가 시간 초과되었고 이미 열린 Meet 탭이 보인다면, 다른 탭을 열지 말고 해당 탭을 검사하세요.

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

동등한 도구 작업은 `recover_current_tab`입니다. 선택한 전송 방식의 기존 Meet 탭에 포커스를 맞추고 검사합니다. `chrome`에서는 Gateway를 통한 로컬 브라우저 제어를 사용하고, `chrome-node`에서는 구성된 Chrome 노드를 사용합니다. 새 탭을 열거나 새 세션을 생성하지 않습니다. 로그인, 승인, 권한 또는 오디오 선택 상태 같은 현재 차단 요인을 보고합니다. CLI 명령은 구성된 Gateway와 통신하므로 Gateway가 실행 중이어야 합니다. `chrome-node`에는 Chrome 노드도 연결되어 있어야 합니다.

### Twilio 설정 확인 실패

`voice-call`이 허용되지 않았거나 활성화되지 않은 경우 `twilio-voice-call-plugin`이 실패합니다. `plugins.allow`에 추가하고 `plugins.entries.voice-call`을 활성화한 뒤 Gateway를 다시 로드하세요.

Twilio 백엔드에 계정 SID, 인증 토큰 또는 발신자 번호가 없으면 `twilio-voice-call-credentials`가 실패합니다. Gateway 호스트에서 다음을 설정하세요.

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call`에 공개 Webhook 노출이 없거나 `publicUrl`이 loopback 또는 사설 네트워크 공간을 가리키면 `twilio-voice-call-webhook`이 실패합니다. `plugins.entries.voice-call.config.publicUrl`을 공개 제공자 URL로 설정하거나 `voice-call` 터널/Tailscale 노출을 구성하세요.

Loopback 및 사설 URL은 통신사 콜백에 유효하지 않습니다. `publicUrl`로 `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8`을 사용하지 마세요.

안정적인 공개 URL의 경우:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

로컬 개발에서는 비공개 호스트 URL 대신 터널이나 Tailscale 노출을 사용하세요.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

그런 다음 Gateway를 다시 시작하거나 다시 로드하고 다음을 실행하세요.

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`는 기본적으로 준비 상태만 확인합니다. 특정 번호로 드라이런하려면:

```bash
openclaw voicecall smoke --to "+15555550123"
```

실제 아웃바운드 알림 전화를 의도적으로 걸고 싶을 때만 `--yes`를 추가하세요.

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 통화가 시작되지만 회의에 들어가지 못함

Meet 이벤트가 전화 다이얼인 세부 정보를 노출하는지 확인하세요. 정확한 다이얼인 번호와 PIN 또는 사용자 지정 DTMF 시퀀스를 전달하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

제공자가 PIN 입력 전에 일시 중지가 필요하면 `--dtmf-sequence`에서 선행 `w` 또는 쉼표를 사용하세요.

전화 통화가 생성되었지만 Meet 명단에 다이얼인 참가자가 표시되지 않는 경우:

- `openclaw googlemeet doctor <session-id>`를 실행하여 위임된 Twilio 통화 ID, DTMF가 대기열에 들어갔는지 여부, 소개 인사말이 요청되었는지 여부를 확인하세요.
- `openclaw voicecall status --call-id <id>`를 실행하고 통화가 아직 활성 상태인지 확인하세요.
- `openclaw voicecall tail`을 실행하고 Twilio Webhook이 Gateway에 도착하는지 확인하세요.
- `openclaw logs --follow`를 실행하고 Twilio Meet 시퀀스를 찾으세요. Google Meet가 참여를 위임하고, Voice Call이 전화 구간을 시작하고, Google Meet가 `voiceCall.dtmfDelayMs`만큼 기다린 뒤 `voicecall.dtmf`로 DTMF를 보내고, `voiceCall.postDtmfSpeechDelayMs`만큼 기다린 다음 `voicecall.speak`로 소개 음성을 요청합니다.
- `openclaw googlemeet setup --transport twilio`를 다시 실행하세요. 녹색 설정 확인은 필수이지만 회의 PIN 시퀀스가 올바르다는 것을 증명하지는 않습니다.
- 다이얼인 번호가 PIN과 같은 Meet 초대 및 지역에 속하는지 확인하세요.
- Meet 응답이 느리거나 DTMF가 전송된 후에도 통화 기록에 PIN을 요청하는 프롬프트가 계속 표시되면 `voiceCall.dtmfDelayMs`를 늘리세요.
- 참가자가 참여했지만 인사말이 들리지 않으면 `openclaw logs --follow`에서 DTMF 이후 `voicecall.speak` 요청과 미디어 스트림 TTS 재생 또는 Twilio `<Say>` 대체 경로를 확인하세요. 통화 기록에 여전히 "enter the meeting PIN"이 포함되어 있으면 전화 구간이 아직 Meet 회의실에 참여하지 않은 것이므로 회의 참가자는 음성을 들을 수 없습니다.

Webhook이 도착하지 않으면 먼저 Voice Call Plugin을 디버그하세요. 제공자는 `plugins.entries.voice-call.config.publicUrl` 또는 구성된 터널에 도달할 수 있어야 합니다. [음성 통화 문제 해결](/ko/plugins/voice-call#troubleshooting)을 참조하세요.

## 참고

Google Meet의 공식 미디어 API는 수신 중심이므로 Meet 통화에서 말하려면 여전히 참가자 경로가 필요합니다. 이 Plugin은 그 경계를 명확히 유지합니다. Chrome은 브라우저 참여와 로컬 오디오 라우팅을 처리하고, Twilio는 전화 다이얼인 참여를 처리합니다.

Chrome 토크백 모드에는 `BlackHole 2ch`와 다음 중 하나가 필요합니다.

- `chrome.audioInputCommand`와 `chrome.audioOutputCommand`: OpenClaw가 브리지를 소유하고, 해당 명령과 선택된 제공자 사이에서 `chrome.audioFormat`의 오디오를 파이프합니다. 에이전트 모드는 실시간 전사와 일반 TTS를 사용하고, bidi 모드는 실시간 음성 제공자를 사용합니다. 기본 Chrome 경로는 `chrome.audioBufferBytes: 4096`을 사용하는 24 kHz PCM16입니다. 8 kHz G.711 mu-law는 레거시 명령 쌍을 위해 계속 사용할 수 있습니다.
- `chrome.audioBridgeCommand`: 외부 브리지 명령이 전체 로컬 오디오 경로를 소유하며 데몬을 시작하거나 검증한 뒤 종료해야 합니다. `agent` 모드는 TTS를 위해 직접 명령 쌍 액세스가 필요하므로 이는 `bidi`에만 유효합니다.

깔끔한 양방향 오디오를 위해 Meet 출력과 Meet 마이크를 별도의 가상 장치나 Loopback 스타일 가상 장치 그래프로 라우팅하세요. 하나의 공유 BlackHole 장치는 다른 참가자의 소리를 통화로 다시 에코할 수 있습니다.

명령 쌍 Chrome 브리지를 사용할 때 `chrome.bargeInInputCommand`는 별도의 로컬 마이크를 수신하고 사람이 말하기 시작하면 어시스턴트 재생을 지울 수 있습니다. 이렇게 하면 공유 BlackHole loopback 입력이 어시스턴트 재생 중에 일시적으로 억제되더라도 사람의 음성이 어시스턴트 출력보다 앞서 유지됩니다. `chrome.audioInputCommand` 및 `chrome.audioOutputCommand`와 마찬가지로 이는 운영자가 구성하는 로컬 명령입니다. 명시적으로 신뢰할 수 있는 명령 경로나 인수 목록을 사용하고, 신뢰할 수 없는 위치의 스크립트를 가리키지 마세요.

`googlemeet speak`는 Chrome 세션에 대해 활성 토크백 오디오 브리지를 트리거합니다. `googlemeet leave`는 해당 브리지를 중지합니다. Voice Call Plugin을 통해 위임된 Twilio 세션의 경우 `leave`는 기반 음성 통화도 끊습니다. API로 관리되는 공간의 활성 Google Meet 회의도 닫으려면 `googlemeet end-active-conference`를 사용하세요.

## 관련 항목

- [Voice Call Plugin](/ko/plugins/voice-call)
- [대화 모드](/ko/nodes/talk)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
