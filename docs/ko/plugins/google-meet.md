---
read_when:
    - OpenClaw 에이전트가 Google Meet 통화에 참여하도록 하려는 경우
    - OpenClaw 에이전트가 새 Google Meet 통화를 생성하도록 하려는 경우
    - Chrome, Chrome node 또는 Twilio를 Google Meet 전송 수단으로 구성하고 있습니다
summary: 'Google Meet Plugin: 실시간 음성 기본값으로 Chrome 또는 Twilio를 통해 명시적인 Meet URL에 참여'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-02T20:58:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

OpenClaw의 Google Meet 참가자 지원은 의도적으로 명시적으로 설계되었습니다.

- 명시적인 `https://meet.google.com/...` URL에만 참가합니다.
- Google Meet API를 통해 새 Meet 공간을 만든 다음 반환된 URL에 참가할 수 있습니다.
- `realtime` 음성이 기본 모드입니다.
- 실시간 음성은 더 깊은 추론이나 도구가 필요할 때 전체 OpenClaw 에이전트를 다시 호출할 수 있습니다.
- 에이전트는 `mode`로 참가 동작을 선택합니다. 실시간 듣기/응답에는 `realtime`을 사용하고, 실시간 음성 브리지 없이 브라우저에 참가/제어하려면 `transcribe`를 사용합니다.
- 인증은 개인 Google OAuth 또는 이미 로그인된 Chrome 프로필로 시작합니다.
- 자동 동의 안내는 없습니다.
- 기본 Chrome 오디오 백엔드는 `BlackHole 2ch`입니다.
- Chrome은 로컬에서 실행하거나 페어링된 Node 호스트에서 실행할 수 있습니다.
- Twilio는 전화 접속 번호와 선택적 PIN 또는 DTMF 시퀀스를 받습니다. Meet URL로 직접 전화를 걸 수는 없습니다.
- CLI 명령은 `googlemeet`입니다. `meet`는 더 넓은 에이전트 원격 회의 워크플로용으로 예약되어 있습니다.

## 빠른 시작

로컬 오디오 종속성을 설치하고 백엔드 실시간 음성 제공자를 구성합니다. OpenAI가 기본값입니다. Google Gemini Live도 `realtime.provider: "google"`로 작동합니다.

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch`는 `BlackHole 2ch` 가상 오디오 장치를 설치합니다. Homebrew의 설치 프로그램은 macOS가 장치를 노출하기 전에 재부팅이 필요합니다.

```bash
sudo reboot
```

재부팅 후 두 요소를 모두 확인합니다.

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

설정 출력은 에이전트가 읽을 수 있고 모드를 인식하도록 설계되었습니다. Chrome 프로필, Node 고정, 그리고 실시간 Chrome 참가의 경우 BlackHole/SoX 오디오 브리지와 지연된 실시간 인트로 검사를 보고합니다. 관찰 전용 참가의 경우 `--mode transcribe`로 동일한 전송을 확인합니다. 해당 모드는 브리지를 통해 듣거나 말하지 않으므로 실시간 오디오 필수 조건을 건너뜁니다.

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio 위임이 구성된 경우 설정은 `voice-call` Plugin, Twilio 자격 증명, 공개 Webhook 노출 준비 여부도 보고합니다. 에이전트에게 참가를 요청하기 전에 `ok: false` 검사는 해당 전송과 모드의 차단 요소로 취급합니다. 스크립트나 기계 판독 가능한 출력에는 `openclaw googlemeet setup --json`을 사용합니다. 에이전트가 시도하기 전에 특정 전송을 사전 점검하려면 `--transport chrome`, `--transport chrome-node`, 또는 `--transport twilio`를 사용합니다.

Twilio의 경우 기본 전송이 Chrome일 때 항상 전송을 명시적으로 사전 점검합니다.

```bash
openclaw googlemeet setup --transport twilio
```

이렇게 하면 에이전트가 회의에 전화하기 전에 누락된 `voice-call` 연결, Twilio 자격 증명, 또는 도달할 수 없는 Webhook 노출을 잡아낼 수 있습니다.

회의에 참가합니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트가 `google_meet` 도구를 통해 참가하게 합니다.

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

에이전트용 `google_meet` 도구는 macOS가 아닌 호스트에서도 아티팩트, 캘린더, 설정, 전사, Twilio, `chrome-node` 흐름에 계속 사용할 수 있습니다. 로컬 Chrome 실시간 작업은 현재 번들된 실시간 Chrome 오디오 경로가 macOS `BlackHole 2ch`에 의존하므로 해당 호스트에서는 차단됩니다. Linux에서는 `mode: "transcribe"`, Twilio 전화 접속, 또는 실시간 Chrome 참가를 위한 macOS `chrome-node` 호스트를 사용합니다.

새 회의를 만들고 참가합니다.

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

API로 만든 회의실에서 Google 계정 기본값을 상속하는 대신 회의실의 노크 없는 정책을 명시하려면 Google Meet `SpaceConfig.accessType`을 사용합니다.

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN`은 Meet URL이 있는 누구나 노크 없이 참가할 수 있게 합니다. `TRUSTED`는 호스트 조직의 신뢰할 수 있는 사용자, 초대된 외부 사용자, 전화 접속 사용자가 노크 없이 참가할 수 있게 합니다. `RESTRICTED`는 초대받은 사람에게만 노크 없는 입장을 제한합니다. 이러한 설정은 공식 Google Meet API 생성 경로에만 적용되므로 OAuth 자격 증명이 구성되어 있어야 합니다.

이 옵션이 제공되기 전에 Google Meet 인증을 완료했다면 Google OAuth 동의 화면에 `meetings.space.settings` 범위를 추가한 후 `openclaw googlemeet auth login --json`을 다시 실행합니다.

참가하지 않고 URL만 만듭니다.

```bash
openclaw googlemeet create --no-join
```

`googlemeet create`에는 두 경로가 있습니다.

- API 생성: Google Meet OAuth 자격 증명이 구성된 경우 사용됩니다. 가장 결정적인 경로이며 브라우저 UI 상태에 의존하지 않습니다.
- 브라우저 대체 경로: OAuth 자격 증명이 없을 때 사용됩니다. OpenClaw는 고정된 Chrome Node를 사용하고, `https://meet.google.com/new`를 열고, Google이 실제 회의 코드 URL로 리디렉션할 때까지 기다린 다음 해당 URL을 반환합니다. 이 경로는 Node의 OpenClaw Chrome 프로필이 Google에 이미 로그인되어 있어야 합니다. 브라우저 자동화는 Meet 자체의 첫 실행 마이크 프롬프트를 처리합니다. 해당 프롬프트는 Google 로그인 실패로 취급되지 않습니다.
  참가 및 생성 흐름은 새 탭을 열기 전에 기존 Meet 탭도 재사용하려고 시도합니다. 매칭은 `authuser` 같은 무해한 URL 쿼리 문자열을 무시하므로 에이전트 재시도는 두 번째 Chrome 탭을 만드는 대신 이미 열려 있는 회의에 포커스를 맞춰야 합니다.

명령/도구 출력에는 에이전트가 어떤 경로가 사용되었는지 설명할 수 있도록 `source` 필드(`api` 또는 `browser`)가 포함됩니다. `create`는 기본적으로 새 회의에 참가하고 `joined: true`와 참가 세션을 반환합니다. URL만 발급하려면 CLI에서 `create --no-join`을 사용하거나 도구에 `"join": false`를 전달합니다.

또는 에이전트에게 “Google Meet을 만들고, 실시간 음성으로 참가한 다음, 링크를 보내 줘.”라고 말합니다. 에이전트는 `action: "create"`로 `google_meet`을 호출한 다음 반환된 `meetingUri`를 공유해야 합니다.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

관찰 전용/브라우저 제어 참가의 경우 `"mode": "transcribe"`를 설정합니다. 이렇게 하면 양방향 실시간 모델 브리지가 시작되지 않고, BlackHole이나 SoX가 필요하지 않으며, 회의에 음성으로 응답하지 않습니다. 이 모드의 Chrome 참가는 OpenClaw의 마이크/카메라 권한 부여와 Meet **마이크 사용** 경로도 피합니다. Meet에서 오디오 선택 중간 화면을 표시하면 자동화는 마이크 없는 경로를 시도하고, 그렇지 않으면 로컬 마이크를 여는 대신 수동 작업을 보고합니다. 전사 모드에서 관리형 Chrome 전송은 최선의 Meet 캡션 관찰자도 설치합니다. `googlemeet status --json`과 `googlemeet doctor`는 운영자가 브라우저가 통화에 참가했는지와 Meet 캡션이 텍스트를 생성하는지 알 수 있도록 `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`, 그리고 짧은 `recentTranscript` 꼬리를 표시합니다.
예/아니요 프로브가 필요할 때는 `openclaw googlemeet test-listen <meet-url> --transport chrome-node`를 사용합니다. 이 명령은 전사 모드로 참가하고, 새 캡션 또는 전사 움직임을 기다린 다음, `listenVerified`, `listenTimedOut`, 수동 작업 필드, 최신 캡션 상태를 반환합니다.

실시간 세션 중 `google_meet` 상태에는 `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, 마지막 입력/출력 타임스탬프, 바이트 카운터, 브리지 종료 상태 같은 브라우저 및 오디오 브리지 상태가 포함됩니다. 안전한 Meet 페이지 프롬프트가 나타나면 브라우저 자동화가 가능한 경우 이를 처리합니다. 로그인, 호스트 입장 승인, 브라우저/OS 권한 프롬프트는 에이전트가 전달할 이유와 메시지가 포함된 수동 작업으로 보고됩니다. 관리형 Chrome 세션은 브라우저 상태가 `inCall: true`를 보고한 뒤에만 인트로나 테스트 문구를 내보냅니다. 그렇지 않으면 상태는 `speechReady: false`를 보고하고, 에이전트가 회의에서 말한 것처럼 가장하는 대신 발화 시도를 차단합니다.

로컬 Chrome 참가는 로그인된 OpenClaw 브라우저 프로필을 통해 이루어집니다. 실시간 모드는 OpenClaw가 사용하는 마이크/스피커 경로에 `BlackHole 2ch`가 필요합니다. 깨끗한 양방향 오디오를 위해 별도의 가상 장치나 Loopback 스타일 그래프를 사용합니다. 단일 BlackHole 장치만으로도 첫 스모크 테스트에는 충분하지만 에코가 발생할 수 있습니다.

### 로컬 Gateway + Parallels Chrome

VM이 Chrome을 소유하게 하려는 것만으로 macOS VM 내부에 전체 OpenClaw Gateway나 모델 API 키가 필요하지는 않습니다. Gateway와 에이전트를 로컬에서 실행한 다음 VM에서 Node 호스트를 실행합니다. VM에서 번들 Plugin을 한 번 활성화하여 Node가 Chrome 명령을 알리게 합니다.

실행 위치:

- Gateway 호스트: OpenClaw Gateway, 에이전트 작업 공간, 모델/API 키, 실시간 제공자, Google Meet Plugin 구성.
- Parallels macOS VM: OpenClaw CLI/Node 호스트, Google Chrome, SoX, BlackHole 2ch, Google에 로그인된 Chrome 프로필.
- VM에 필요하지 않은 것: Gateway 서비스, 에이전트 구성, OpenAI/GPT 키, 또는 모델 제공자 설정.

VM 종속성을 설치합니다.

```bash
brew install blackhole-2ch sox
```

BlackHole 설치 후 macOS가 `BlackHole 2ch`를 노출하도록 VM을 재부팅합니다.

```bash
sudo reboot
```

재부팅 후 VM이 오디오 장치와 SoX 명령을 볼 수 있는지 확인합니다.

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM에 OpenClaw를 설치하거나 업데이트한 다음, 그곳에서 번들 Plugin을 활성화합니다.

```bash
openclaw plugins enable google-meet
```

VM에서 Node 호스트를 시작합니다.

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`가 LAN IP이고 TLS를 사용하지 않는 경우, 해당 신뢰할 수 있는 사설 네트워크에 옵트인하지 않으면 Node가 평문 WebSocket을 거부합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node를 LaunchAgent로 설치할 때도 동일한 환경 변수를 사용합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`은 `openclaw.json` 설정이 아니라 프로세스 환경입니다. `openclaw node install`은 설치 명령에 이 변수가 있으면 LaunchAgent 환경에 저장합니다.

Gateway 호스트에서 Node를 승인합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway가 Node를 보고 있고, Node가 `googlemeet.chrome`과 브라우저 기능/`browser.proxy`를 모두 알리는지 확인합니다.

```bash
openclaw nodes status
```

Gateway 호스트에서 Meet을 해당 Node로 라우팅합니다.

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

이제 Gateway 호스트에서 정상적으로 참가합니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트에게 `transport: "chrome-node"`로 `google_meet` 도구를 사용하라고 요청합니다.

세션을 만들거나 재사용하고, 알려진 문구를 말하며, 세션 상태를 출력하는 단일 명령 스모크 테스트는 다음과 같습니다.

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

실시간 참가 중에는 OpenClaw 브라우저 자동화가 게스트 이름을 입력하고,
참가/참가 요청을 클릭하며, 해당 프롬프트가 나타나면 Meet의 최초 실행
"마이크 사용" 선택을 수락합니다. 관찰 전용 참가 또는 브라우저 전용 회의
생성 중에는 해당 선택지를 사용할 수 있을 때 마이크 없이 동일한 프롬프트를
지나갑니다. 브라우저 프로필이 로그인되어 있지 않거나, Meet이 호스트 입장을
기다리고 있거나, 실시간 참가에 Chrome 마이크/카메라 권한이 필요하거나,
Meet이 자동화로 해결할 수 없는 프롬프트에서 멈춘 경우 참가/test-speech 결과는
`manualActionReason` 및 `manualActionMessage`와 함께
`manualActionRequired: true`를 보고합니다. 에이전트는 참가 재시도를 중지하고,
해당 정확한 메시지와 현재 `browserUrl`/`browserTitle`을 보고한 뒤, 수동
브라우저 작업이 완료된 후에만 재시도해야 합니다.

`chromeNode.node`가 생략되면, 정확히 하나의 연결된 노드가 `googlemeet.chrome`과
브라우저 제어를 모두 알릴 때만 OpenClaw가 자동 선택합니다. 사용 가능한 노드가
여러 개 연결되어 있으면 `chromeNode.node`를 노드 ID, 표시 이름, 또는 원격 IP로
설정하세요.

일반적인 실패 확인:

- `Configured Google Meet node ... is not usable: offline`: 고정된 노드는
  Gateway에 알려져 있지만 사용할 수 없습니다. 에이전트는 그 노드를 사용 가능한
  Chrome 호스트가 아니라 진단 상태로 취급해야 하며, 사용자가 요청하지 않은 한
  다른 전송으로 대체하지 말고 설정 차단 요인을 보고해야 합니다.
- `No connected Google Meet-capable node`: VM에서 `openclaw node run`을
  시작하고, 페어링을 승인하며, VM에서 `openclaw plugins enable google-meet` 및
  `openclaw plugins enable browser`가 실행되었는지 확인하세요. 또한 Gateway
  호스트가 `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`로
  두 노드 명령을 모두 허용하는지도 확인하세요.
- `BlackHole 2ch audio device not found`: 확인 중인 호스트에 `blackhole-2ch`를
  설치하고 로컬 Chrome 오디오를 사용하기 전에 재부팅하세요.
- `BlackHole 2ch audio device not found on the node`: VM에 `blackhole-2ch`를
  설치하고 VM을 재부팅하세요.
- Chrome이 열리지만 참가할 수 없음: VM 안의 브라우저 프로필에 로그인하거나,
  게스트 참가를 위해 `chrome.guestName`을 설정해 두세요. 게스트 자동 참가는 노드
  브라우저 프록시를 통해 OpenClaw 브라우저 자동화를 사용합니다. 노드 브라우저
  구성이 원하는 프로필을 가리키는지 확인하세요. 예:
  `browser.defaultProfile: "user"` 또는 이름이 지정된 기존 세션 프로필.
- 중복 Meet 탭: `chrome.reuseExistingTab: true`를 활성화된 상태로 두세요.
  OpenClaw는 새 탭을 열기 전에 같은 Meet URL의 기존 탭을 활성화하며, 브라우저
  회의 생성은 새 탭을 또 열기 전에 진행 중인 `https://meet.google.com/new` 또는
  Google 계정 프롬프트 탭을 재사용합니다.
- 오디오 없음: Meet에서 마이크/스피커를 OpenClaw가 사용하는 가상 오디오 장치
  경로로 라우팅하세요. 깔끔한 양방향 오디오를 위해 별도의 가상 장치 또는
  Loopback 스타일 라우팅을 사용하세요.

## 설치 참고 사항

Chrome 실시간 기본값은 두 외부 도구를 사용합니다.

- `sox`: 명령줄 오디오 유틸리티. Plugin은 기본 24 kHz PCM16 오디오 브리지에
  명시적 CoreAudio 장치 명령을 사용합니다.
- `blackhole-2ch`: macOS 가상 오디오 드라이버. Chrome/Meet이 라우팅할 수 있는
  `BlackHole 2ch` 오디오 장치를 생성합니다.

OpenClaw는 두 패키지를 번들하거나 재배포하지 않습니다. 문서는 사용자에게
Homebrew를 통해 호스트 의존성으로 설치하도록 안내합니다. SoX 라이선스는
`LGPL-2.0-only AND GPL-2.0-only`이며, BlackHole은 GPL-3.0입니다. BlackHole을
OpenClaw와 함께 번들하는 설치 프로그램이나 어플라이언스를 빌드한다면,
BlackHole의 업스트림 라이선스 조건을 검토하거나 Existential Audio에서 별도
라이선스를 받으세요.

## 전송

### Chrome

Chrome 전송은 OpenClaw 브라우저 제어를 통해 Meet URL을 열고, 로그인된 OpenClaw
브라우저 프로필로 참가합니다. macOS에서는 Plugin이 실행 전에 `BlackHole 2ch`를
확인합니다. 구성된 경우 Chrome을 열기 전에 오디오 브리지 상태 명령과 시작 명령도
실행합니다. Chrome/오디오가 Gateway 호스트에 있으면 `chrome`을 사용하고,
Chrome/오디오가 Parallels macOS VM 같은 페어링된 노드에 있으면 `chrome-node`를
사용하세요. 로컬 Chrome의 경우 `browser.defaultProfile`로 프로필을 선택하세요.
`chrome.browserProfile`은 `chrome-node` 호스트에 전달됩니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome 마이크와 스피커 오디오를 로컬 OpenClaw 오디오 브리지로 라우팅하세요.
`BlackHole 2ch`가 설치되어 있지 않으면, 오디오 경로 없이 조용히 참가하는 대신
참가가 설정 오류와 함께 실패합니다.

### Twilio

Twilio 전송은 Voice Call Plugin에 위임되는 엄격한 다이얼 플랜입니다. Meet
페이지에서 전화번호를 파싱하지 않습니다.

Chrome 참여를 사용할 수 없거나 전화 다이얼인 대체 경로가 필요할 때 사용하세요.
Google Meet은 회의에 대한 전화 다이얼인 번호와 PIN을 노출해야 합니다. OpenClaw는
Meet 페이지에서 이를 검색하지 않습니다.

Voice Call Plugin은 Chrome 노드가 아니라 Gateway 호스트에서 활성화하세요.

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // 또는 Twilio를 기본값으로 해야 하면 "twilio"를 설정
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Twilio 자격 증명은 환경 또는 구성으로 제공하세요. 환경은 비밀을 `openclaw.json`
밖에 유지합니다.

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call`을 활성화한 뒤 Gateway를 재시작하거나 다시 로드하세요. Plugin 구성
변경은 이미 실행 중인 Gateway 프로세스가 다시 로드되기 전까지 나타나지 않습니다.

그런 다음 확인하세요.

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 위임이 연결되면 `googlemeet setup`에 성공한
`twilio-voice-call-plugin`, `twilio-voice-call-credentials`, 및
`twilio-voice-call-webhook` 확인이 포함됩니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

회의에 사용자 지정 시퀀스가 필요할 때는 `--dtmf-sequence`를 사용하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 및 사전 점검

`googlemeet create`가 브라우저 자동화로 대체할 수 있으므로 Meet 링크 생성에는
OAuth가 선택 사항입니다. 공식 API 생성, 공간 확인, 또는 Meet Media API 사전
점검이 필요할 때 OAuth를 구성하세요.

Google Meet API 접근은 사용자 OAuth를 사용합니다. Google Cloud OAuth 클라이언트를
생성하고, 필요한 범위를 요청하며, Google 계정을 승인한 다음, 결과 refresh token을
Google Meet Plugin 구성에 저장하거나 `OPENCLAW_GOOGLE_MEET_*` 환경 변수를
제공하세요.

OAuth는 Chrome 참가 경로를 대체하지 않습니다. Chrome 및 Chrome-node 전송은
브라우저 참여를 사용할 때 여전히 로그인된 Chrome 프로필, BlackHole/SoX, 그리고
연결된 노드를 통해 참가합니다. OAuth는 공식 Google Meet API 경로, 즉 회의 공간
생성, 공간 확인, Meet Media API 사전 점검 실행에만 사용됩니다.

### Google 자격 증명 생성

Google Cloud Console에서:

1. Google Cloud 프로젝트를 생성하거나 선택합니다.
2. 해당 프로젝트에 **Google Meet REST API**를 활성화합니다.
3. OAuth 동의 화면을 구성합니다.
   - Google Workspace 조직에는 **Internal**이 가장 간단합니다.
   - 개인/테스트 설정에는 **External**이 작동합니다. 앱이 Testing 상태인 동안,
     앱을 승인할 각 Google 계정을 테스트 사용자로 추가하세요.
4. OpenClaw가 요청하는 범위를 추가합니다.
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. OAuth 클라이언트 ID를 생성합니다.
   - 애플리케이션 유형: **Web application**.
   - 승인된 리디렉션 URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. 클라이언트 ID와 클라이언트 보안 비밀을 복사합니다.

`meetings.space.created`는 Google Meet `spaces.create`에 필요합니다.
`meetings.space.readonly`는 OpenClaw가 Meet URL/코드를 공간으로 확인할 수 있게
합니다. `meetings.space.settings`는 API 방 생성 중 OpenClaw가 `accessType` 같은
`SpaceConfig` 설정을 전달할 수 있게 합니다.
`meetings.conference.media.readonly`는 Meet Media API 사전 점검 및 미디어 작업용입니다.
Google은 실제 Media API 사용에 Developer Preview 등록을 요구할 수 있습니다.
브라우저 기반 Chrome 참가만 필요하다면 OAuth를 완전히 건너뛰세요.

### refresh token 발급

`oauth.clientId` 및 선택적으로 `oauth.clientSecret`을 구성하거나, 환경 변수로
전달한 다음 실행하세요.

```bash
openclaw googlemeet auth login --json
```

이 명령은 refresh token이 포함된 `oauth` 구성 블록을 출력합니다. PKCE,
`http://localhost:8085/oauth2callback`의 localhost 콜백, 그리고 `--manual`을
사용한 수동 복사/붙여넣기 흐름을 사용합니다.

예시:

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

refresh token을 구성에 넣고 싶지 않을 때는 환경 변수를 선호하세요. 구성과 환경
값이 모두 있으면 Plugin은 먼저 구성을 해석한 뒤 환경 대체값을 사용합니다.

OAuth 동의에는 Meet 공간 생성, Meet 공간 읽기 접근, Meet 회의 미디어 읽기 접근이
포함됩니다. 회의 생성 지원이 생기기 전에 인증했다면, refresh token에
`meetings.space.created` 범위가 있도록 `openclaw googlemeet auth login --json`을
다시 실행하세요.

### doctor로 OAuth 확인

빠르고 비밀이 포함되지 않는 상태 확인이 필요할 때 OAuth doctor를 실행하세요.

```bash
openclaw googlemeet doctor --oauth --json
```

이는 Chrome 런타임을 로드하지 않으며 연결된 Chrome 노드를 요구하지 않습니다.
OAuth 구성이 존재하는지와 refresh token이 access token을 발급할 수 있는지
확인합니다. JSON 보고서에는 `ok`, `configured`, `tokenSource`, `expiresAt`, 확인
메시지 같은 상태 필드만 포함됩니다. access token, refresh token, 또는 클라이언트
보안 비밀은 출력하지 않습니다.

일반적인 결과:

| 확인                 | 의미                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId`와 `oauth.refreshToken`, 또는 캐시된 access token이 있습니다.          |
| `oauth-token`        | 캐시된 access token이 아직 유효하거나, refresh token이 새 access token을 발급했습니다. |
| `meet-spaces-get`    | 선택적 `--meeting` 확인이 기존 Meet 공간을 확인했습니다.                               |
| `meet-spaces-create` | 선택적 `--create-space` 확인이 새 Meet 공간을 생성했습니다.                            |

Google Meet API 활성화와 `spaces.create` 범위까지 증명하려면 부작용이 있는 생성
확인을 실행하세요.

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space`는 일회용 Meet URL을 만듭니다. Google Cloud 프로젝트에 Meet API가 사용 설정되어 있고 승인된 계정에 `meetings.space.created` 범위가 있는지 확인해야 할 때 사용하세요.

기존 회의 공간에 대한 읽기 액세스를 증명하려면:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting`과 `resolve-space`는 승인된 Google 계정이 액세스할 수 있는 기존 공간에 대한 읽기 액세스를 증명합니다. 이러한 검사에서 `403`이 발생하면 일반적으로 Google Meet REST API가 비활성화되어 있거나, 동의된 갱신 토큰에 필요한 범위가 없거나, Google 계정이 해당 Meet 공간에 액세스할 수 없다는 뜻입니다. 갱신 토큰 오류는 `openclaw googlemeet auth login --json`을 다시 실행하고 새 `oauth` 블록을 저장해야 한다는 뜻입니다.

브라우저 대체 모드에는 OAuth 자격 증명이 필요하지 않습니다. 이 모드에서 Google 인증은 OpenClaw 설정이 아니라 선택한 Node의 로그인된 Chrome 프로필에서 가져옵니다.

다음 환경 변수는 대체값으로 허용됩니다.

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 또는 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 또는 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 또는
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 또는 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 또는 `GOOGLE_MEET_PREVIEW_ACK`

`spaces.get`을 통해 Meet URL, 코드 또는 `spaces/{id}`를 확인합니다.

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

미디어 작업 전에 사전 검사를 실행합니다.

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet에서 회의 기록을 생성한 뒤 회의 아티팩트와 출석을 나열합니다.

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting`을 사용하면 `artifacts`와 `attendance`는 기본적으로 최신 회의 기록을 사용합니다. 해당 회의에 보존된 모든 기록이 필요하면 `--all-conference-records`를 전달하세요.

Calendar 조회는 Meet 아티팩트를 읽기 전에 Google Calendar에서 회의 URL을 확인할 수 있습니다.

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`는 오늘의 `primary` 캘린더에서 Google Meet 링크가 있는 Calendar 이벤트를 검색합니다. 일치하는 이벤트 텍스트를 검색하려면 `--event <query>`를 사용하고, 기본 캘린더가 아닌 캘린더에는 `--calendar <id>`를 사용하세요. Calendar 조회에는 Calendar events readonly 범위가 포함된 새 OAuth 로그인이 필요합니다. `calendar-events`는 일치하는 Meet 이벤트를 미리 보여 주고 `latest`, `artifacts`, `attendance` 또는 `export`가 선택할 이벤트를 표시합니다.

회의 기록 ID를 이미 알고 있다면 직접 지정하세요.

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

통화 후 방을 닫고 싶을 때 API로 생성된 공간의 활성 회의를 종료합니다.

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

이 명령은 Google Meet `spaces.endActiveConference`를 호출하며, 승인된 계정이 관리할 수 있는 공간에 대해 `meetings.space.created` 범위가 있는 OAuth가 필요합니다. OpenClaw는 Meet URL, 회의 코드 또는 `spaces/{id}` 입력을 허용하고 활성 회의를 종료하기 전에 이를 API 공간 리소스로 확인합니다. 이는 `googlemeet leave`와 별개입니다. `leave`는 OpenClaw의 로컬/세션 참여를 중지하지만, `end-active-conference`는 Google Meet에 해당 공간의 활성 회의를 종료하도록 요청합니다.

읽기 쉬운 보고서를 작성합니다.

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

`artifacts`는 Google이 해당 회의에 대해 노출하는 경우 회의 기록 메타데이터와 함께 참가자, 녹화, transcript, 구조화된 transcript-entry, smart-note 리소스 메타데이터를 반환합니다. 대규모 회의에서 항목 조회를 건너뛰려면 `--no-transcript-entries`를 사용하세요. `attendance`는 참가자를 participant-session 행으로 확장하며, 여기에는 최초/마지막 확인 시간, 총 세션 기간, 지각/조기 퇴장 플래그, 로그인 사용자 또는 표시 이름으로 병합된 중복 참가자 리소스가 포함됩니다. 원시 참가자 리소스를 별도로 유지하려면 `--no-merge-duplicates`를 전달하고, 지각 감지를 조정하려면 `--late-after-minutes`, 조기 퇴장 감지를 조정하려면 `--early-before-minutes`를 전달하세요.

`export`는 `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json`, `manifest.json`이 포함된 폴더를 작성합니다. `manifest.json`은 선택된 입력, 내보내기 옵션, 회의 기록, 출력 파일, 개수, 토큰 소스, 사용된 경우 Calendar 이벤트, 부분 검색 경고를 기록합니다. 폴더 옆에 휴대 가능한 아카이브도 작성하려면 `--zip`을 전달하세요. 연결된 transcript와 smart-note Google Docs 텍스트를 Google Drive `files.export`를 통해 내보내려면 `--include-doc-bodies`를 전달하세요. 이 작업에는 Drive Meet readonly 범위가 포함된 새 OAuth 로그인이 필요합니다. `--include-doc-bodies`가 없으면 내보내기에는 Meet 메타데이터와 구조화된 transcript 항목만 포함됩니다. Google이 smart-note 목록, transcript-entry 또는 Drive 문서 본문 오류와 같은 부분 아티팩트 실패를 반환하면, 전체 내보내기를 실패시키는 대신 summary와 manifest에 경고가 유지됩니다. 폴더나 ZIP을 만들지 않고 동일한 아티팩트/출석 데이터를 가져와 manifest JSON을 출력하려면 `--dry-run`을 사용하세요. 이는 대규모 내보내기를 작성하기 전이나 에이전트가 개수, 선택된 기록, 경고만 필요로 할 때 유용합니다.

에이전트는 `google_meet` 도구를 통해 동일한 번들을 만들 수도 있습니다.

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

파일 쓰기를 건너뛰고 내보내기 manifest만 반환하려면 `"dryRun": true`를 설정하세요.

에이전트는 명시적 액세스 정책이 있는 API 기반 방도 만들 수 있습니다.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
  "accessType": "OPEN"
}
```

그리고 알려진 방의 활성 회의를 종료할 수도 있습니다.

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

듣기 우선 검증의 경우, 에이전트는 회의가 유용하다고 주장하기 전에 `test_listen`을 사용해야 합니다.

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

실제 보존된 회의를 대상으로 보호된 라이브 스모크를 실행합니다.

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

누군가가 말하고 Meet 캡션을 사용할 수 있는 회의를 대상으로 라이브 듣기 우선 브라우저 프로브를 실행합니다.

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
  갱신 토큰을 제공합니다.
- 선택 사항: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, 및
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`는 `OPENCLAW_` 접두사 없는 동일한 대체 이름을 사용합니다.

기본 아티팩트/출석 라이브 스모크에는 `https://www.googleapis.com/auth/meetings.space.readonly` 및 `https://www.googleapis.com/auth/meetings.conference.media.readonly`가 필요합니다. Calendar 조회에는 `https://www.googleapis.com/auth/calendar.events.readonly`가 필요합니다. Drive 문서 본문 내보내기에는 `https://www.googleapis.com/auth/drive.meet.readonly`가 필요합니다.

새 Meet 공간을 만듭니다.

```bash
openclaw googlemeet create
```

이 명령은 새 `meeting uri`, 소스, 참여 세션을 출력합니다. OAuth 자격 증명이 있으면 공식 Google Meet API를 사용합니다. OAuth 자격 증명이 없으면 고정된 Chrome Node의 로그인된 브라우저 프로필을 대체 수단으로 사용합니다. 에이전트는 `action: "create"`와 함께 `google_meet` 도구를 사용하여 한 단계로 생성하고 참여할 수 있습니다. URL만 생성하려면 `"join": false`를 전달하세요.

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

브라우저 대체 모드가 URL을 만들기 전에 Google 로그인 또는 Meet 권한 차단에 걸리면, Gateway 메서드는 실패한 응답을 반환하고 `google_meet` 도구는 일반 문자열 대신 구조화된 세부 정보를 반환합니다.

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

에이전트가 `manualActionRequired: true`를 보면, `manualActionMessage`와 브라우저 Node/탭 컨텍스트를 보고하고 운영자가 브라우저 단계를 완료할 때까지 새 Meet 탭을 열지 않아야 합니다.

API 생성의 예시 JSON 출력:

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

Meet 생성은 기본적으로 참여까지 수행합니다. Chrome 또는 Chrome-node 전송은 브라우저를 통해 참여하려면 여전히 로그인된 Google Chrome 프로필이 필요합니다. 프로필이 로그아웃되어 있으면 OpenClaw는 `manualActionRequired: true` 또는 브라우저 대체 오류를 보고하고 재시도 전에 운영자에게 Google 로그인을 완료하라고 요청합니다.

Cloud 프로젝트, OAuth 주체, 회의 참가자가 Meet 미디어 API용 Google Workspace Developer Preview Program에 등록되어 있음을 확인한 뒤에만 `preview.enrollmentAcknowledged: true`를 설정하세요.

## 설정

공통 Chrome 실시간 경로에는 Plugin 활성화, BlackHole, SoX, 백엔드 실시간 음성 제공자 키만 필요합니다. OpenAI가 기본값입니다. Google Gemini Live를 사용하려면 `realtime.provider: "google"`을 설정하세요.

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Plugin 구성을 `plugins.entries.google-meet.config` 아래에 설정합니다:

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
- `defaultMode: "realtime"`
- `chromeNode.node`: `chrome-node`에 사용할 선택적 노드 id/이름/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: 로그아웃된 Meet 게스트 화면에서 사용되는 이름
- `chrome.autoJoin: true`: `chrome-node`에서 OpenClaw 브라우저 자동화를 통해 최선의 노력으로 게스트 이름을 채우고 Join Now를 클릭
- `chrome.reuseExistingTab: true`: 중복 탭을 여는 대신 기존 Meet 탭 활성화
- `chrome.waitForInCallMs: 20000`: realtime 소개가 트리거되기 전에 Meet 탭이 통화 중이라고 보고할 때까지 대기
- `chrome.audioFormat: "pcm16-24khz"`: 명령 쌍 오디오 형식. 여전히 전화 통신 오디오를 내보내는 레거시/사용자 지정 명령 쌍에만 `"g711-ulaw-8khz"`를 사용하세요.
- `chrome.audioInputCommand`: CoreAudio `BlackHole 2ch`에서 읽고 `chrome.audioFormat`으로 오디오를 쓰는 SoX 명령
- `chrome.audioOutputCommand`: `chrome.audioFormat`의 오디오를 읽고 CoreAudio `BlackHole 2ch`에 쓰는 SoX 명령
- `chrome.bargeInInputCommand`: 어시스턴트 재생이 활성화되어 있는 동안 사람이 끼어들었는지 감지하기 위해 signed 16-bit little-endian mono PCM을 쓰는 선택적 로컬 마이크 명령입니다. 현재 이는 Gateway에서 호스팅되는 `chrome` 명령 쌍 브리지에 적용됩니다.
- `chrome.bargeInRmsThreshold: 650`: `chrome.bargeInInputCommand`에서 사람의 인터럽트로 간주되는 RMS 레벨
- `chrome.bargeInPeakThreshold: 2500`: `chrome.bargeInInputCommand`에서 사람의 인터럽트로 간주되는 피크 레벨
- `chrome.bargeInCooldownMs: 900`: 반복되는 사람 인터럽트 해제 사이의 최소 지연 시간
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 더 깊은 답변에는 `openclaw_agent_consult`를 사용하는 짧은 음성 응답
- `realtime.introMessage`: realtime 브리지가 연결될 때의 짧은 음성 준비 확인; 조용히 참가하려면 `""`로 설정하세요
- `realtime.agentId`: `openclaw_agent_consult`에 사용할 선택적 OpenClaw 에이전트 id; 기본값은 `main`

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
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

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

`voiceCall.enabled`의 기본값은 `true`입니다. Twilio 전송을 사용하면 실제 PSTN 통화, DTMF, 소개 인사를 Voice Call Plugin에 위임합니다. Voice Call은 realtime 미디어 스트림을 열기 전에 DTMF 시퀀스를 재생한 다음 저장된 소개 텍스트를 초기 realtime 인사로 사용합니다. `voice-call`이 활성화되어 있지 않으면 Google Meet은 여전히 다이얼 플랜을 검증하고 기록할 수 있지만 Twilio 통화를 걸 수는 없습니다.

## 도구

에이전트는 `google_meet` 도구를 사용할 수 있습니다:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Chrome이 Gateway 호스트에서 실행될 때는 `transport: "chrome"`을 사용하세요. Chrome이 Parallels VM 같은 페어링된 노드에서 실행될 때는 `transport: "chrome-node"`를 사용하세요. 두 경우 모두 realtime 모델과 `openclaw_agent_consult`는 Gateway 호스트에서 실행되므로 모델 자격 증명은 그곳에 유지됩니다.

활성 세션을 나열하거나 세션 ID를 검사하려면 `action: "status"`를 사용하세요. realtime 에이전트가 즉시 말하게 하려면 `sessionId` 및 `message`와 함께 `action: "speak"`를 사용하세요. 세션을 생성하거나 재사용하고, 알려진 문구를 트리거하며, Chrome 호스트가 보고할 수 있을 때 `inCall` 상태를 반환하려면 `action: "test_speech"`를 사용하세요. `test_speech`는 항상 `mode: "realtime"`을 강제하며, 관찰 전용 세션은 의도적으로 음성을 내보낼 수 없기 때문에 `mode: "transcribe"`에서 실행하도록 요청하면 실패합니다. `speechOutputVerified` 결과는 이 테스트 호출 중 realtime 오디오 출력 바이트가 증가했는지를 기준으로 하므로, 이전 오디오가 있는 재사용 세션은 새로운 성공적인 음성 확인으로 간주되지 않습니다. 세션을 종료된 것으로 표시하려면 `action: "leave"`를 사용하세요.

`status`는 사용 가능한 경우 Chrome 상태를 포함합니다:

- `inCall`: Chrome이 Meet 통화 안에 있는 것으로 보임
- `micMuted`: 최선의 노력으로 감지한 Meet 마이크 상태
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 음성이 작동하기 전에 브라우저 프로필에 수동 로그인, Meet 호스트 승인, 권한, 또는 브라우저 제어 복구가 필요함
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: 관리되는 Chrome 음성이 현재 허용되는지 여부. `speechReady: false`는 OpenClaw가 소개/테스트 문구를 오디오 브리지로 보내지 않았음을 의미합니다.
- `providerConnected` / `realtimeReady`: realtime 음성 브리지 상태
- `lastInputAt` / `lastOutputAt`: 브리지에서 마지막으로 수신했거나 브리지로 전송한 오디오
- `lastSuppressedInputAt` / `suppressedInputBytes`: 어시스턴트 재생이 활성화된 동안 무시된 loopback 입력

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime 에이전트 상담

Chrome realtime 모드는 실시간 음성 루프에 최적화되어 있습니다. realtime 음성 공급자는 회의 오디오를 듣고 구성된 오디오 브리지를 통해 말합니다. realtime 모델에 더 깊은 추론, 최신 정보, 또는 일반 OpenClaw 도구가 필요하면 `openclaw_agent_consult`를 호출할 수 있습니다.

상담 도구는 최근 회의 전사 컨텍스트와 함께 일반 OpenClaw 에이전트를 백그라운드에서 실행하고, realtime 음성 세션에 간결한 음성 답변을 반환합니다. 그러면 음성 모델이 해당 답변을 회의에 다시 말할 수 있습니다. 이는 Voice Call과 동일한 공유 realtime 상담 도구를 사용합니다.

기본적으로 상담은 `main` 에이전트에 대해 실행됩니다. Meet 경로가 전용 OpenClaw 에이전트 워크스페이스, 모델 기본값, 도구 정책, 메모리, 세션 기록에 상담해야 할 때는 `realtime.agentId`를 설정하세요.

`realtime.toolPolicy`는 상담 실행을 제어합니다:

- `safe-read-only`: 상담 도구를 노출하고 일반 에이전트를 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`으로 제한합니다.
- `owner`: 상담 도구를 노출하고 일반 에이전트가 일반 에이전트 도구 정책을 사용하도록 합니다.
- `none`: 상담 도구를 realtime 음성 모델에 노출하지 않습니다.

상담 세션 키는 Meet 세션별로 범위가 지정되므로, 후속 상담 호출은 같은 회의 중 이전 상담 컨텍스트를 재사용할 수 있습니다.

Chrome이 통화에 완전히 참가한 후 음성 준비 확인을 강제하려면:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

전체 참가 및 음성 스모크의 경우:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## 라이브 테스트 체크리스트

회의를 무인 에이전트에 넘기기 전에 이 순서를 사용하세요:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

예상 Chrome-node 상태:

- `googlemeet setup`이 모두 녹색입니다.
- Chrome-node가 기본 전송이거나 노드가 고정된 경우 `googlemeet setup`에 `chrome-node-connected`가 포함됩니다.
- `nodes status`에 선택한 노드가 연결된 것으로 표시됩니다.
- 선택한 노드가 `googlemeet.chrome`와 `browser.proxy`를 모두 알립니다.
- Meet 탭이 통화에 참가하고 `test-speech`가 `inCall: true`와 함께 Chrome 상태를 반환합니다.

Parallels macOS VM 같은 원격 Chrome 호스트의 경우, Gateway 또는 VM을 업데이트한 후 가장 짧고 안전한 확인은 다음과 같습니다:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

이는 에이전트가 실제 회의 탭을 열기 전에 Gateway Plugin이 로드되어 있고, VM 노드가 현재 토큰으로 연결되어 있으며, Meet 오디오 브리지를 사용할 수 있음을 증명합니다.

Twilio 스모크의 경우 전화 다이얼인 세부 정보를 노출하는 회의를 사용하세요:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

예상 Twilio 상태:

- `googlemeet setup`에 녹색 `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, `twilio-voice-call-webhook` 검사가 포함됩니다.
- Gateway reload 후 CLI에서 `voicecall`을 사용할 수 있습니다.
- 반환된 세션에 `transport: "twilio"`와 `twilio.voiceCallId`가 있습니다.
- `openclaw logs --follow`에 realtime TwiML 전에 DTMF TwiML이 제공된 뒤, 초기 인사가 대기열에 들어간 realtime 브리지가 표시됩니다.
- `googlemeet leave <sessionId>`가 위임된 음성 통화를 종료합니다.

## 문제 해결

### 에이전트가 Google Meet 도구를 볼 수 없음

Gateway 구성에서 Plugin이 활성화되어 있는지 확인하고 Gateway를 reload하세요:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

방금 `plugins.entries.google-meet`를 편집했다면 Gateway를 restart하거나 reload하세요. 실행 중인 에이전트는 현재 Gateway 프로세스가 등록한 Plugin 도구만 볼 수 있습니다.

macOS가 아닌 Gateway 호스트에서는 에이전트용 `google_meet` 도구가 계속 표시되지만, 로컬 Chrome realtime 작업은 오디오 브리지에 도달하기 전에 차단됩니다. 로컬 Chrome realtime 오디오는 현재 macOS `BlackHole 2ch`에 의존하므로, Linux 에이전트는 기본 로컬 Chrome realtime 경로 대신 `mode: "transcribe"`, Twilio 다이얼인, 또는 macOS `chrome-node` 호스트를 사용해야 합니다.

### 연결된 Google Meet 지원 노드 없음

노드 호스트에서 다음을 실행하세요:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway 호스트에서 노드를 승인하고 명령을 확인하세요:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

노드는 연결되어 있어야 하며 `googlemeet.chrome`와 `browser.proxy`를 나열해야 합니다. Gateway 구성은 해당 노드 명령을 허용해야 합니다:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`이 `chrome-node-connected`에서 실패하거나 Gateway 로그가 `gateway token mismatch`를 보고하면, 현재 Gateway 토큰으로 노드를 다시 설치하거나 restart하세요. LAN Gateway의 경우 일반적으로 다음을 의미합니다:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

그런 다음 노드 서비스를 reload하고 다시 실행하세요:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 브라우저가 열리지만 에이전트가 참가할 수 없음

관찰 전용 참가에는 `googlemeet test-listen`을, realtime 참가에는 `googlemeet test-speech`를 실행한 다음 반환된 Chrome 상태를 확인하세요. 어느 프로브든 `manualActionRequired: true`를 보고하면 운영자에게 `manualActionMessage`를 보여주고 브라우저 작업이 완료될 때까지 재시도를 중지하세요.

일반적인 수동 작업:

- Chrome 프로필에 로그인합니다.
- Meet 호스트 계정에서 게스트를 승인합니다.
- Chrome의 기본 권한 프롬프트가 나타나면 Chrome 마이크/카메라 권한을 부여합니다.
- 멈춘 Meet 권한 대화상자를 닫거나 복구합니다.

Meet에 "회의에서 사람들이 내 목소리를 들을 수 있도록 하시겠습니까?"가 표시된다는 이유만으로 "로그인하지 않음"을 보고하지 마세요. 이는 Meet의 오디오 선택 중간 화면입니다. OpenClaw는 사용 가능한 경우 브라우저 자동화를 통해 **마이크 사용**을 클릭하고 실제 회의 상태를 계속 기다립니다. 생성 전용 브라우저 폴백의 경우, URL 생성에는 실시간 오디오 경로가 필요하지 않으므로 OpenClaw가 **마이크 없이 계속**을 클릭할 수 있습니다.

### 회의 생성 실패

`googlemeet create`는 OAuth 자격 증명이 구성된 경우 먼저 Google Meet API `spaces.create` 엔드포인트를 사용합니다. OAuth 자격 증명이 없으면 고정된 Chrome 노드 브라우저로 폴백합니다. 다음을 확인하세요.

- API 생성의 경우: `oauth.clientId`와 `oauth.refreshToken`이 구성되어 있거나, 일치하는 `OPENCLAW_GOOGLE_MEET_*` 환경 변수가 있어야 합니다.
- API 생성의 경우: 새로 고침 토큰은 생성 지원이 추가된 뒤 발급된 것이어야 합니다. 오래된 토큰에는 `meetings.space.created` 범위가 없을 수 있습니다. `openclaw googlemeet auth login --json`을 다시 실행하고 Plugin 구성을 업데이트하세요.
- 브라우저 폴백의 경우: `defaultTransport: "chrome-node"`와 `chromeNode.node`가 `browser.proxy` 및 `googlemeet.chrome`이 있는 연결된 노드를 가리켜야 합니다.
- 브라우저 폴백의 경우: 해당 노드의 OpenClaw Chrome 프로필이 Google에 로그인되어 있고 `https://meet.google.com/new`를 열 수 있어야 합니다.
- 브라우저 폴백의 경우: 재시도는 새 탭을 열기 전에 기존 `https://meet.google.com/new` 또는 Google 계정 프롬프트 탭을 재사용합니다. 에이전트가 시간 초과되면 다른 Meet 탭을 수동으로 열지 말고 도구 호출을 다시 시도하세요.
- 브라우저 폴백의 경우: 도구가 `manualActionRequired: true`를 반환하면 반환된 `browser.nodeId`, `browser.targetId`, `browserUrl`, `manualActionMessage`를 사용해 운영자를 안내하세요. 해당 조치가 완료될 때까지 루프로 재시도하지 마세요.
- 브라우저 폴백의 경우: Meet에 "회의에서 사람들이 내 목소리를 들을 수 있도록 하시겠습니까?"가 표시되면 탭을 열어 둡니다. OpenClaw는 브라우저 자동화를 통해 **마이크 사용** 또는 생성 전용 폴백의 경우 **마이크 없이 계속**을 클릭하고 생성된 Meet URL을 계속 기다려야 합니다. 그러지 못하는 경우 오류는 `google-login-required`가 아니라 `meet-audio-choice-required`를 언급해야 합니다.

### 에이전트가 참여하지만 말하지 않음

실시간 경로를 확인하세요.

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

듣기/응답 말하기에는 `mode: "realtime"`을 사용하세요. `mode: "transcribe"`는 의도적으로 양방향 실시간 음성 브리지를 시작하지 않습니다. 관찰 전용 디버깅의 경우, 참가자가 말한 뒤 `openclaw googlemeet status --json <session-id>`를 실행하고 `captioning`, `transcriptLines`, `lastCaptionText`를 확인하세요. `inCall`이 true인데 `transcriptLines`가 계속 `0`이면 Meet 자막이 비활성화되었거나, 관찰자가 설치된 뒤 아무도 말하지 않았거나, Meet UI가 변경되었거나, 해당 회의 언어/계정에서 실시간 자막을 사용할 수 없을 수 있습니다.

`googlemeet test-speech`는 항상 실시간 경로를 확인하고 해당 호출에서 브리지 출력 바이트가 관찰되었는지 보고합니다. `speechOutputVerified`가 false이고 `speechOutputTimedOut`이 true이면 실시간 제공자가 발화를 수락했을 수 있지만 OpenClaw가 Chrome 오디오 브리지에 도달하는 새 출력 바이트를 보지 못한 것입니다.

또한 다음을 확인하세요.

- Gateway 호스트에서 `OPENAI_API_KEY` 또는 `GEMINI_API_KEY` 같은 실시간 제공자 키를 사용할 수 있어야 합니다.
- Chrome 호스트에서 `BlackHole 2ch`가 보여야 합니다.
- Chrome 호스트에 `sox`가 있어야 합니다.
- Meet 마이크와 스피커가 OpenClaw가 사용하는 가상 오디오 경로를 통해 라우팅되어야 합니다.

`googlemeet doctor [session-id]`는 세션, 노드, 통화 중 상태, 수동 조치 이유, 실시간 제공자 연결, `realtimeReady`, 오디오 입력/출력 활동, 마지막 오디오 타임스탬프, 바이트 카운터, 브라우저 URL을 출력합니다. 원시 JSON이 필요하면 `googlemeet status [session-id] --json`을 사용하세요. 토큰을 노출하지 않고 Google Meet OAuth 새로 고침을 확인해야 하면 `googlemeet doctor --oauth`를 사용하세요. Google Meet API 증명도 필요하면 `--meeting` 또는 `--create-space`를 추가하세요.

에이전트가 시간 초과되었고 이미 열린 Meet 탭이 보이면 다른 탭을 열지 말고 그 탭을 검사하세요.

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

동등한 도구 작업은 `recover_current_tab`입니다. 선택한 전송에 대해 기존 Meet 탭에 포커스를 맞추고 검사합니다. `chrome`에서는 Gateway를 통한 로컬 브라우저 제어를 사용하고, `chrome-node`에서는 구성된 Chrome 노드를 사용합니다. 새 탭을 열거나 새 세션을 만들지 않습니다. 로그인, 입장, 권한, 오디오 선택 상태 같은 현재 차단 요인을 보고합니다. CLI 명령은 구성된 Gateway와 통신하므로 Gateway가 실행 중이어야 합니다. `chrome-node`는 Chrome 노드도 연결되어 있어야 합니다.

### Twilio 설정 검사 실패

`voice-call`이 허용되지 않았거나 활성화되지 않았으면 `twilio-voice-call-plugin`이 실패합니다. `plugins.allow`에 추가하고 `plugins.entries.voice-call`을 활성화한 다음 Gateway를 다시 로드하세요.

Twilio 백엔드에 계정 SID, 인증 토큰 또는 발신 번호가 없으면 `twilio-voice-call-credentials`가 실패합니다. Gateway 호스트에서 다음을 설정하세요.

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

로컬 개발의 경우 사설 호스트 URL 대신 터널 또는 Tailscale 노출을 사용하세요.

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

그런 다음 Gateway를 다시 시작하거나 다시 로드하고 실행하세요.

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`는 기본적으로 준비 상태만 확인합니다. 특정 번호로 드라이런하려면:

```bash
openclaw voicecall smoke --to "+15555550123"
```

실제 발신 알림 전화를 의도적으로 걸고 싶을 때만 `--yes`를 추가하세요.

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 통화가 시작되지만 회의에 들어가지 않음

Meet 이벤트가 전화 접속 세부 정보를 노출하는지 확인하세요. 정확한 전화 접속 번호와 PIN 또는 사용자 지정 DTMF 시퀀스를 전달하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

제공자가 PIN 입력 전에 일시 중지가 필요하면 `--dtmf-sequence`에 선행 `w` 또는 쉼표를 사용하세요.

전화 통화는 생성되었지만 Meet 명단에 전화 접속 참가자가 표시되지 않으면:

- `openclaw googlemeet doctor <session-id>`를 실행해 위임된 Twilio 통화 ID, DTMF가 대기열에 들어갔는지, 인사말 요청 여부를 확인하세요.
- `openclaw voicecall status --call-id <id>`를 실행하고 통화가 여전히 활성 상태인지 확인하세요.
- `openclaw voicecall tail`을 실행하고 Twilio Webhook이 Gateway에 도착하는지 확인하세요.
- `openclaw logs --follow`를 실행하고 Twilio Meet 시퀀스를 찾으세요. Google Meet이 참여를 위임하고, Voice Call이 전화 레그를 시작하고, Google Meet이 `voiceCall.dtmfDelayMs`만큼 기다린 뒤 `voicecall.dtmf`로 DTMF를 보내고, `voiceCall.postDtmfSpeechDelayMs`만큼 기다린 다음 `voicecall.speak`로 인사말 음성을 요청합니다.
- `openclaw googlemeet setup --transport twilio`를 다시 실행하세요. 초록색 설정 검사는 필수이지만 회의 PIN 시퀀스가 올바르다는 것을 증명하지는 않습니다.
- 전화 접속 번호가 PIN과 동일한 Meet 초대 및 지역에 속하는지 확인하세요.
- Meet이 느리게 응답하거나 DTMF가 전송된 뒤에도 통화 전사에 PIN을 요청하는 프롬프트가 계속 표시되면 `voiceCall.dtmfDelayMs`를 늘리세요.
- 참가자는 입장했지만 인사말이 들리지 않으면 `openclaw logs --follow`에서 DTMF 이후 `voicecall.speak` 요청과 미디어 스트림 TTS 재생 또는 Twilio `<Say>` 폴백을 확인하세요. 통화 전사에 여전히 "회의 PIN을 입력하세요"가 포함되어 있으면 전화 레그가 아직 Meet 방에 참여하지 않은 것이므로 회의 참가자는 음성을 들을 수 없습니다.

Webhook이 도착하지 않으면 먼저 Voice Call Plugin을 디버그하세요. 제공자가 `plugins.entries.voice-call.config.publicUrl` 또는 구성된 터널에 도달할 수 있어야 합니다. [음성 통화 문제 해결](/ko/plugins/voice-call#troubleshooting)을 참조하세요.

## 참고

Google Meet의 공식 미디어 API는 수신 지향이므로 Meet 통화에서 말하려면 여전히 참가자 경로가 필요합니다. 이 Plugin은 그 경계를 명확히 유지합니다. Chrome은 브라우저 참여와 로컬 오디오 라우팅을 처리하고, Twilio는 전화 접속 참여를 처리합니다.

Chrome 실시간 모드에는 `BlackHole 2ch`와 다음 중 하나가 필요합니다.

- `chrome.audioInputCommand`와 `chrome.audioOutputCommand`: OpenClaw가 실시간 모델 브리지를 소유하고 해당 명령과 선택한 실시간 음성 제공자 사이에서 `chrome.audioFormat`의 오디오를 파이프합니다. 기본 Chrome 경로는 24 kHz PCM16입니다. 8 kHz G.711 mu-law는 레거시 명령 쌍용으로 계속 사용할 수 있습니다.
- `chrome.audioBridgeCommand`: 외부 브리지 명령이 전체 로컬 오디오 경로를 소유하며 데몬을 시작하거나 검증한 뒤 종료해야 합니다.

깨끗한 양방향 오디오를 위해 Meet 출력과 Meet 마이크를 별도의 가상 장치 또는 Loopback 스타일의 가상 장치 그래프로 라우팅하세요. 단일 공유 BlackHole 장치는 다른 참가자의 오디오를 통화로 다시 에코할 수 있습니다.

명령 쌍 Chrome 브리지에서는 `chrome.bargeInInputCommand`가 별도의 로컬 마이크를 듣고 사람이 말하기 시작하면 어시스턴트 재생을 지울 수 있습니다. 이렇게 하면 공유 BlackHole loopback 입력이 어시스턴트 재생 중 일시적으로 억제되어도 사람 음성이 어시스턴트 출력보다 앞서 유지됩니다. `chrome.audioInputCommand` 및 `chrome.audioOutputCommand`와 마찬가지로 이는 운영자가 구성하는 로컬 명령입니다. 명시적으로 신뢰할 수 있는 명령 경로 또는 인수 목록을 사용하고, 신뢰할 수 없는 위치의 스크립트를 가리키지 마세요.

`googlemeet speak`는 Chrome 세션의 활성 실시간 오디오 브리지를 트리거합니다. `googlemeet leave`는 해당 브리지를 중지합니다. Voice Call Plugin을 통해 위임된 Twilio 세션의 경우 `leave`는 기반 음성 통화도 끊습니다. API 관리 공간의 활성 Google Meet 회의도 닫으려면 `googlemeet end-active-conference`를 사용하세요.

## 관련 항목

- [Voice call Plugin](/ko/plugins/voice-call)
- [말하기 모드](/ko/nodes/talk)
- [Plugin 빌드](/ko/plugins/building-plugins)
