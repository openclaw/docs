---
read_when:
    - OpenClaw 에이전트를 Google Meet 통화에 참여시키려고 합니다
    - OpenClaw 에이전트가 새 Google Meet 통화를 만들게 하려고 합니다
    - Google Meet 전송 수단으로 Chrome, Chrome node 또는 Twilio를 구성하고 있습니다
summary: 'Google Meet Plugin: Chrome 또는 Twilio를 통해 명시적인 Meet URL에 참여하고 실시간 음성 기본값 사용하기'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1bd53db711e4729a9a7b18f7aaa3eedffd71a1e19349fc858537652b5d17cfcb
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw용 Google Meet 참가자 지원 — 이 Plugin은 의도적으로 명시적입니다:

- 명시적인 `https://meet.google.com/...` URL에만 참여합니다.
- Google Meet API를 통해 새 Meet 공간을 만든 뒤 반환된 URL에 참여할 수 있습니다.
- 기본 모드는 `realtime` 음성입니다.
- 더 깊은 추론이나 도구가 필요할 때 realtime 음성은 전체 OpenClaw 에이전트를 다시 호출할 수 있습니다.
- 에이전트는 `mode`로 참여 동작을 선택합니다. 실시간 듣기/말하기에는 `realtime`을, realtime 음성 브리지 없이 브라우저만 참여/제어하려면 `transcribe`를 사용하세요.
- 인증은 개인 Google OAuth 또는 이미 로그인된 Chrome 프로필로 시작합니다.
- 자동 동의 안내는 없습니다.
- 기본 Chrome 오디오 백엔드는 `BlackHole 2ch`입니다.
- Chrome은 로컬 또는 페어링된 Node 호스트에서 실행할 수 있습니다.
- Twilio는 다이얼인 번호와 선택적 PIN 또는 DTMF 시퀀스를 받습니다.
- CLI 명령은 `googlemeet`입니다. `meet`는 더 넓은 에이전트 원격 회의 워크플로를 위해 예약되어 있습니다.

## 빠른 시작

로컬 오디오 의존성을 설치하고 백엔드 realtime 음성 provider를 구성하세요.
기본값은 OpenAI이며, `realtime.provider: "google"`로
Google Gemini Live도 동작합니다:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 또는
export GEMINI_API_KEY=...
```

`blackhole-2ch`는 `BlackHole 2ch` 가상 오디오 디바이스를 설치합니다. Homebrew 설치 프로그램은 macOS가 해당 디바이스를 노출하기 전에 재부팅을 요구합니다:

```bash
sudo reboot
```

재부팅 후 두 가지를 모두 확인하세요:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Plugin을 활성화하세요:

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

설정을 확인하세요:

```bash
openclaw googlemeet setup
```

setup 출력은 에이전트가 읽을 수 있도록 설계되었습니다. Chrome 프로필,
오디오 브리지, Node 고정, 지연된 realtime 소개, 그리고 Twilio 위임이 구성된 경우
`voice-call` Plugin과 Twilio 자격 증명이 준비되었는지를 보고합니다.
에이전트에게 참여를 요청하기 전에 `ok: false`인 모든 검사는 차단 요인으로 간주하세요.
스크립트 또는 기계가 읽을 수 있는 출력을 원하면 `openclaw googlemeet setup --json`을 사용하세요.
에이전트가 시도하기 전에 특정 전송 수단을 사전 점검하려면
`--transport chrome`, `--transport chrome-node`, 또는 `--transport twilio`
를 사용하세요.

미팅에 참여하기:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트가 `google_meet` 도구를 통해 참여하게 하기:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

새 미팅을 만들고 참여하기:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

참여하지 않고 URL만 만들기:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create`에는 두 가지 경로가 있습니다:

- API 생성: Google Meet OAuth 자격 증명이 구성되어 있을 때 사용됩니다. 이것이 가장 결정적인 경로이며 브라우저 UI 상태에 의존하지 않습니다.
- 브라우저 폴백: OAuth 자격 증명이 없을 때 사용됩니다. OpenClaw는 고정된 Chrome Node를 사용해 `https://meet.google.com/new`를 열고, Google이 실제 미팅 코드 URL로 리디렉션할 때까지 기다린 뒤 해당 URL을 반환합니다. 이 경로를 사용하려면 Node의 OpenClaw Chrome 프로필이 이미 Google에 로그인되어 있어야 합니다.
  브라우저 자동화는 Meet 자체의 첫 실행 마이크 프롬프트를 처리합니다. 이 프롬프트는 Google 로그인 실패로 취급되지 않습니다.
  참여 및 생성 흐름은 새 탭을 열기 전에 기존 Meet 탭을 재사용하려고도 시도합니다. 일치는 `authuser` 같은 무해한 URL 쿼리 문자열을 무시하므로, 에이전트가 재시도할 때 두 번째 Chrome 탭을 만드는 대신 이미 열려 있는 미팅에 초점을 맞춰야 합니다.

명령/도구 출력에는 `source` 필드(`api` 또는 `browser`)가 포함되므로 에이전트가 어떤 경로가 사용되었는지 설명할 수 있습니다. `create`는 기본적으로 새 미팅에 참여하며 `joined: true`와 함께 참여 세션을 반환합니다. URL만 만들려면 CLI에서는 `create --no-join`을 사용하거나 도구에 `"join": false`를 전달하세요.

또는 에이전트에게 이렇게 말하세요: "Google Meet를 만들고, realtime 음성으로 참여한 다음 링크를 보내줘." 에이전트는 `action: "create"`로 `google_meet`를 호출한 뒤 반환된 `meetingUri`를 공유해야 합니다.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

관찰 전용/브라우저 제어 참여의 경우 `"mode": "transcribe"`를 설정하세요. 이 경우 양방향 realtime 모델 브리지가 시작되지 않으므로 미팅에 다시 말하지 않습니다.

realtime 세션 중 `google_meet` 상태에는 `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, 마지막 입력/출력 타임스탬프, 바이트 카운터, 브리지 종료 상태 같은 브라우저 및 오디오 브리지 상태가 포함됩니다. 안전한 Meet 페이지 프롬프트가 나타나면 브라우저 자동화가 가능한 경우 이를 처리합니다. 로그인, 호스트 승인, 브라우저/OS 권한 프롬프트는 에이전트가 전달할 수 있도록 이유와 메시지를 가진 수동 작업으로 보고됩니다.

Chrome은 로그인된 Chrome 프로필로 참여합니다. Meet에서는 OpenClaw가 사용하는 마이크/스피커 경로로 `BlackHole 2ch`를 선택하세요. 깔끔한 양방향 오디오를 위해서는 별도의 가상 디바이스나 Loopback 스타일 그래프를 사용하세요. 단일 BlackHole 디바이스만으로도 첫 스모크 테스트에는 충분하지만 에코가 생길 수 있습니다.

### 로컬 Gateway + Parallels Chrome

VM이 Chrome을 소유하도록 하기 위해 macOS VM 내부에 전체 OpenClaw Gateway나 모델 API 키가 **필요하지 않습니다**. Gateway와 에이전트는 로컬에서 실행하고, VM에서는 Node 호스트를 실행하세요. 번들된 Plugin을 VM에서 한 번 활성화하면 Node가 Chrome 명령을 광고합니다:

무엇이 어디서 실행되는가:

- Gateway 호스트: OpenClaw Gateway, 에이전트 워크스페이스, 모델/API 키, realtime
  provider, Google Meet Plugin config.
- Parallels macOS VM: OpenClaw CLI/Node 호스트, Google Chrome, SoX, BlackHole 2ch,
  Google에 로그인된 Chrome 프로필.
- VM에 필요하지 않은 것: Gateway 서비스, 에이전트 config, OpenAI/GPT 키, 또는 model
  provider 설정.

VM 의존성 설치:

```bash
brew install blackhole-2ch sox
```

macOS가 `BlackHole 2ch`를 노출하도록 BlackHole 설치 후 VM을 재부팅하세요:

```bash
sudo reboot
```

재부팅 후 VM이 오디오 디바이스와 SoX 명령을 볼 수 있는지 확인하세요:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM에 OpenClaw를 설치하거나 업데이트한 다음, সেখানে 번들된 Plugin을 활성화하세요:

```bash
openclaw plugins enable google-meet
```

VM에서 Node 호스트 시작:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`가 LAN IP이고 TLS를 사용하지 않는다면, 신뢰된 사설 네트워크에 대해 명시적으로 opt-in하지 않는 한 Node는 해당 평문 WebSocket을 거부합니다:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Node를 LaunchAgent로 설치할 때도 같은 환경 변수를 사용하세요:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`은
`openclaw.json` 설정이 아니라 프로세스 환경입니다. `openclaw node install`은
설치 명령에 해당 환경 변수가 있으면 이를 LaunchAgent 환경에 저장합니다.

Gateway 호스트에서 Node 승인:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway가 Node를 보고 있으며 `googlemeet.chrome`
와 브라우저 capability/`browser.proxy`를 둘 다 광고하는지 확인하세요:

```bash
openclaw nodes status
```

Gateway 호스트에서 Meet를 해당 Node로 라우팅하세요:

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

이제 Gateway 호스트에서 평소처럼 참여하세요:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트에게 `transport: "chrome-node"`와 함께 `google_meet` 도구를 사용하라고 하세요.

세션을 생성하거나 재사용하고, 알려진 문구를 말하고, 세션 상태를 출력하는
원클릭 스모크 테스트:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

참여 중 OpenClaw 브라우저 자동화는 게스트 이름을 입력하고, Join/Ask
to join을 클릭하고, 해당 프롬프트가 나타나면 Meet의 첫 실행 "Use microphone" 선택을 수락합니다.
브라우저 전용 미팅 생성 중에는 Meet가 use-microphone 버튼을 노출하지 않는 경우
마이크 없이도 동일한 프롬프트를 넘어갈 수 있습니다.
브라우저 프로필이 로그인되어 있지 않거나, Meet가 호스트
승인을 기다리고 있거나, Chrome에 마이크/카메라 권한이 필요하거나, Meet가
자동화가 해결할 수 없는 프롬프트에 멈춰 있는 경우, 참여/test-speech 결과는
`manualActionRequired: true`와 함께 `manualActionReason` 및
`manualActionMessage`를 보고합니다. 에이전트는 참여 재시도를 중단하고,
정확한 메시지와 현재 `browserUrl`/`browserTitle`을 보고한 뒤,
수동 브라우저 작업이 완료된 후에만 다시 시도해야 합니다.

`chromeNode.node`가 생략되면 OpenClaw는 연결된 Node 중 정확히 하나만
`googlemeet.chrome`와 브라우저 제어를 모두 광고할 때만 자동 선택합니다. 가능한 Node가 여러 개 연결되어 있으면 `chromeNode.node`를 Node id,
표시 이름 또는 원격 IP로 설정하세요.

일반적인 실패 점검:

- `Configured Google Meet node ... is not usable: offline`: 고정된 Node는
  Gateway에 알려져 있지만 사용할 수 없습니다. 에이전트는 해당 Node를
  사용 가능한 Chrome 호스트가 아니라 진단 상태로 취급하고, 사용자가 그렇게 요청하지 않은 한 다른 전송 수단으로 폴백하는 대신 설정 차단 요인을 보고해야 합니다.
- `No connected Google Meet-capable node`: VM에서 `openclaw node run`을 시작하고,
  pairing을 승인하고, VM에서 `openclaw plugins enable google-meet` 및
  `openclaw plugins enable browser`를 실행했는지 확인하세요. 또한
  Gateway 호스트가 다음과 같이 두 Node 명령을 모두 허용하는지 확인하세요:
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: 검사 중인 호스트에 `blackhole-2ch`를
  설치하고 재부팅한 뒤 로컬 Chrome 오디오를 사용하세요.
- `BlackHole 2ch audio device not found on the node`: VM에 `blackhole-2ch`를
  설치하고 VM을 재부팅하세요.
- Chrome은 열리지만 참여할 수 없음: VM 내부 브라우저 프로필에 로그인하거나,
  게스트 참여를 위해 `chrome.guestName`을 설정된 상태로 유지하세요. 게스트 자동 참여는 Node 브라우저 프록시를 통한 OpenClaw 브라우저 자동화를 사용합니다.
  Node 브라우저 config가 원하는 프로필을 가리키는지 확인하세요. 예:
  `browser.defaultProfile: "user"` 또는 이름이 지정된 existing-session 프로필.
- 중복된 Meet 탭: `chrome.reuseExistingTab: true`를 활성화된 상태로 두세요. OpenClaw는 새 탭을 열기 전에 동일한 Meet URL에 대한 기존 탭을 활성화하며,
  브라우저 미팅 생성은 다른 탭을 열기 전에 진행 중인 `https://meet.google.com/new`
  또는 Google 계정 프롬프트 탭을 재사용합니다.
- 오디오가 없음: Meet에서 마이크/스피커를 OpenClaw가 사용하는 가상 오디오 디바이스 경로로 라우팅하세요. 깔끔한 양방향 오디오를 위해 별도의 가상 디바이스 또는 Loopback 스타일 라우팅을 사용하세요.

## 설치 참고 사항

Chrome realtime 기본값은 두 개의 외부 도구를 사용합니다:

- `sox`: 명령줄 오디오 유틸리티. Plugin은 기본 8 kHz G.711 mu-law 오디오 브리지를 위해 `rec` 및 `play`
  명령을 사용합니다.
- `blackhole-2ch`: macOS 가상 오디오 드라이버. Chrome/Meet가 라우팅할 수 있는 `BlackHole 2ch`
  오디오 디바이스를 만듭니다.

OpenClaw는 두 패키지 모두를 번들로 제공하거나 재배포하지 않습니다. 문서에서는
사용자가 Homebrew를 통해 이들을 호스트 의존성으로 설치하도록 안내합니다. SoX 라이선스는
`LGPL-2.0-only AND GPL-2.0-only`이며, BlackHole은 GPL-3.0입니다. OpenClaw와 함께 BlackHole을 번들한 설치 프로그램이나 어플라이언스를 빌드한다면 BlackHole의 업스트림 라이선스 조건을 검토하거나 Existential Audio로부터 별도 라이선스를 받으세요.

## 전송 수단

### Chrome

Chrome 전송 수단은 Google Chrome에서 Meet URL을 열고 로그인된 Chrome 프로필로 참여합니다. macOS에서는 Plugin이 시작 전에 `BlackHole 2ch`를 확인합니다. 구성되어 있으면 Chrome을 열기 전에 오디오 브리지 상태 명령과 시작 명령도 실행합니다. Chrome/오디오가 Gateway 호스트에 있을 때는 `chrome`을 사용하세요. Chrome/오디오가 Parallels macOS VM 같은 페어링된 Node에 있을 때는 `chrome-node`를 사용하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome 마이크 및 스피커 오디오를 로컬 OpenClaw 오디오 브리지를 통해 라우팅하세요. `BlackHole 2ch`가 설치되지 않은 경우, 오디오 경로 없이 조용히 참여하는 대신 설정 오류와 함께 참여가 실패합니다.

### Twilio

Twilio 전송 수단은 Voice Call Plugin에 위임되는 엄격한 다이얼 플랜입니다. Meet 페이지에서 전화번호를 파싱하지 않습니다.

Chrome 참가를 사용할 수 없거나 전화 다이얼인 폴백을 원할 때 사용하세요. Google Meet는 해당 미팅에 대해 전화 다이얼인 번호와 PIN을 노출해야 하며, OpenClaw는 Meet 페이지에서 이를 찾아내지 않습니다.

Voice Call Plugin은 Chrome Node가 아니라 Gateway 호스트에서 활성화하세요:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // 또는 Twilio를 기본값으로 하려면 "twilio"로 설정
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

Twilio 자격 증명은 환경 변수 또는 config로 제공하세요. 환경 변수를 사용하면 시크릿을 `openclaw.json` 밖에 둘 수 있습니다:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call`을 활성화한 뒤 Gateway를 재시작하거나 다시 로드하세요. Plugin config 변경은 이미 실행 중인 Gateway 프로세스에는 다시 로드되기 전까지 나타나지 않습니다.

그런 다음 확인하세요:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 위임이 제대로 연결되면 `googlemeet setup`에는
성공적인 `twilio-voice-call-plugin` 및 `twilio-voice-call-credentials`
검사가 포함됩니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

미팅에 사용자 지정 시퀀스가 필요한 경우 `--dtmf-sequence`를 사용하세요:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 및 사전 점검

OAuth는 `googlemeet create`가 브라우저 자동화로 폴백할 수 있기 때문에 Meet 링크 생성에는 선택 사항입니다. 공식 API 생성,
공간 확인, 또는 Meet Media API 사전 점검을 원할 때 OAuth를 구성하세요.

Google Meet API 액세스는 사용자 OAuth를 사용합니다. Google Cloud OAuth 클라이언트를 만들고,
필요한 scope를 요청하고, Google 계정을 인증한 뒤, 생성된
refresh token을 Google Meet Plugin config에 저장하거나
`OPENCLAW_GOOGLE_MEET_*` 환경 변수를 제공하세요.

OAuth는 Chrome 참여 경로를 대체하지 않습니다. Chrome 및 Chrome-node 전송 수단은 브라우저 참가를 사용할 때 여전히 로그인된 Chrome 프로필, BlackHole/SoX, 연결된 Node를 통해 참여합니다. OAuth는 공식 Google
Meet API 경로에만 사용됩니다: 미팅 공간 생성, 공간 확인, Meet Media API 사전 점검 실행.

### Google 자격 증명 만들기

Google Cloud Console에서:

1. Google Cloud 프로젝트를 만들거나 선택합니다.
2. 해당 프로젝트에 대해 **Google Meet REST API**를 활성화합니다.
3. OAuth 동의 화면을 구성합니다.
   - Google Workspace 조직에서는 **Internal**이 가장 간단합니다.
   - 개인/테스트 설정에는 **External**이 동작합니다. 앱이 Testing 상태인 동안에는 앱을 인증할 각 Google 계정을 테스트 사용자로 추가하세요.
4. OpenClaw가 요청하는 scope를 추가합니다:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. OAuth client ID를 생성합니다.
   - 애플리케이션 유형: **Web application**
   - 승인된 리디렉션 URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. client ID와 client secret을 복사합니다.

`meetings.space.created`는 Google Meet `spaces.create`에 필요합니다.
`meetings.space.readonly`는 OpenClaw가 Meet URL/코드를 공간으로 확인할 수 있게 합니다.
`meetings.conference.media.readonly`는 Meet Media API 사전 점검 및 미디어 작업용이며,
실제 Media API 사용에는 Google이 Developer Preview 등록을 요구할 수 있습니다.
브라우저 기반 Chrome 참여만 필요하다면 OAuth는 완전히 건너뛰어도 됩니다.

### refresh token 발급

`oauth.clientId`와 선택적으로 `oauth.clientSecret`을 구성하거나
환경 변수로 전달한 뒤 다음을 실행하세요:

```bash
openclaw googlemeet auth login --json
```

이 명령은 refresh token이 포함된 `oauth` config 블록을 출력합니다. PKCE,
`http://localhost:8085/oauth2callback`의 localhost callback, 그리고
`--manual`을 사용하는 수동 복사/붙여넣기 흐름을 사용합니다.

예시:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

브라우저가 로컬 callback에 도달할 수 없을 때는 수동 모드를 사용하세요:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 출력에는 다음이 포함됩니다:

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

`oauth` 객체를 Google Meet Plugin config 아래에 저장하세요:

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

config에 refresh token을 두고 싶지 않다면 환경 변수를 사용하는 편이 좋습니다.
config와 환경 변수 값이 모두 있으면 Plugin은 먼저 config를 확인하고 그다음 환경 변수 폴백을 사용합니다.

OAuth 동의에는 Meet 공간 생성, Meet 공간 읽기 액세스, Meet
conference media 읽기 액세스가 포함됩니다. 미팅 생성 지원이 생기기 전에 인증했다면
refresh token에 `meetings.space.created` scope가 있도록 `openclaw googlemeet auth login --json`을 다시 실행하세요.

### doctor로 OAuth 확인

빠르고 시크릿이 노출되지 않는 상태 점검이 필요하면 OAuth doctor를 실행하세요:

```bash
openclaw googlemeet doctor --oauth --json
```

이 명령은 Chrome 런타임을 로드하지 않으며 연결된 Chrome Node도 필요하지 않습니다.
OAuth config가 존재하는지, refresh token으로 access token을 발급할 수 있는지 검사합니다. JSON 보고서에는 `ok`, `configured`,
`tokenSource`, `expiresAt`, 검사 메시지 같은 상태 필드만 포함되며 access
token, refresh token, client secret은 출력하지 않습니다.

일반적인 결과:

| 검사 | 의미 |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId`와 `oauth.refreshToken`, 또는 캐시된 access token이 존재합니다. |
| `oauth-token`        | 캐시된 access token이 여전히 유효하거나, refresh token으로 새 access token을 발급했습니다. |
| `meet-spaces-get`    | 선택적인 `--meeting` 검사가 기존 Meet 공간을 확인했습니다. |
| `meet-spaces-create` | 선택적인 `--create-space` 검사가 새 Meet 공간을 만들었습니다. |

Google Meet API 활성화와 `spaces.create` scope까지 함께 증명하려면
부작용이 있는 create 검사를 실행하세요:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space`는 일회성 Meet URL을 만듭니다. Google Cloud 프로젝트에 Meet API가 활성화되어 있고, 인증된 계정에 `meetings.space.created` scope가 있는지 확인해야 할 때 사용하세요.

기존 미팅 공간에 대한 읽기 액세스를 증명하려면:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting`과 `resolve-space`는 인증된 Google 계정이 접근할 수 있는 기존 공간에 대한 읽기 액세스를 증명합니다. 이 검사에서 `403`이 나온다면 보통 Google Meet REST API가 비활성화되어 있거나, 동의된 refresh token에 필요한 scope가 없거나, Google 계정이 해당 Meet 공간에 접근할 수 없다는 의미입니다. refresh-token 오류라면 `openclaw googlemeet auth login
--json`을 다시 실행하고 새 `oauth` 블록을 저장하세요.

브라우저 폴백에는 OAuth 자격 증명이 필요하지 않습니다. 이 모드에서 Google
인증은 OpenClaw config가 아니라 선택된 Node의 로그인된 Chrome 프로필에서 가져옵니다.

다음 환경 변수는 폴백으로 허용됩니다:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 또는 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 또는 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 또는
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 또는 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 또는 `GOOGLE_MEET_PREVIEW_ACK`

`spaces.get`을 통해 Meet URL, 코드, 또는 `spaces/{id}`를 확인:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

미디어 작업 전에 사전 점검 실행:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet가 conference record를 만든 뒤 미팅 산출물과 참석 현황을 나열합니다:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting`과 함께 사용할 때 `artifacts`와 `attendance`는 기본적으로 가장 최근 conference record를 사용합니다. 해당 미팅에 대해 보관된 모든 record를 원하면 `--all-conference-records`를 전달하세요.

Calendar 조회는 Meet 산출물을 읽기 전에 Google Calendar에서 미팅 URL을 확인할 수 있습니다:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`는 오늘의 `primary` 캘린더에서
Google Meet 링크가 있는 Calendar 이벤트를 검색합니다. 일치하는 이벤트 텍스트를 검색하려면 `--event <query>`를, 기본이 아닌 캘린더에는 `--calendar <id>`를 사용하세요. Calendar 조회에는 Calendar events readonly scope를 포함한 최신 OAuth 로그인이 필요합니다.
`calendar-events`는 일치하는 Meet 이벤트를 미리 보여주고 `latest`, `artifacts`, `attendance`, `export`가 선택할 이벤트를 표시합니다.

이미 conference record id를 알고 있다면 직접 지정할 수 있습니다:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

읽기 쉬운 보고서 작성:

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

`artifacts`는 Google이 해당 미팅에 대해 노출하는 경우 conference record 메타데이터와 participant,
recording, transcript, 구조화된 transcript-entry, smart-note 리소스 메타데이터를 반환합니다. 대규모 미팅에서 entry 조회를 건너뛰려면 `--no-transcript-entries`를 사용하세요. `attendance`는 participant를 participant-session 행으로 확장하며, 첫/마지막 확인 시각, 총 세션 길이, 지각/조기 퇴장 플래그를 포함하고 로그인된 사용자 또는 표시 이름 기준으로 중복 participant 리소스를 병합합니다. 원시 participant 리소스를 분리된 상태로 유지하려면 `--no-merge-duplicates`를, 지각 판정 조정을 위해 `--late-after-minutes`를, 조기 퇴장 판정 조정을 위해 `--early-before-minutes`를 사용하세요.

`export`는 `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json`, `manifest.json`이 포함된 폴더를 기록합니다.
`manifest.json`은 선택된 입력, 내보내기 옵션, conference record,
출력 파일, 개수, token source, 사용된 Calendar 이벤트, 부분 조회 경고를 기록합니다. 폴더 옆에 휴대용 아카이브도 함께 쓰려면 `--zip`을 전달하세요. 연결된 transcript 및 smart-note Google Docs 텍스트를 Google Drive `files.export`를 통해 내보내려면 `--include-doc-bodies`를 전달하세요. 이를 위해서는 Drive Meet readonly scope를 포함한 최신 OAuth 로그인이 필요합니다. `--include-doc-bodies`가 없으면 내보내기에는 Meet 메타데이터와 구조화된 transcript 항목만 포함됩니다. Google이 smart-note
listing, transcript-entry, Drive document-body 오류 같은 부분 artifact 실패를 반환하면, 요약과 manifest는 전체 내보내기를 실패시키는 대신 경고를 유지합니다.
폴더나 ZIP을 만들지 않고 같은 artifact/attendance 데이터를 가져오고
manifest JSON만 출력하려면 `--dry-run`을 사용하세요. 이는 큰 내보내기를 기록하기 전이나 에이전트가 개수, 선택된 record, 경고만 필요할 때 유용합니다.

에이전트도 `google_meet` 도구를 통해 같은 번들을 만들 수 있습니다:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

내보내기 manifest만 반환하고 파일 쓰기를 건너뛰려면 `"dryRun": true`를 설정하세요.

실제 보존된 미팅에 대해 보호된 라이브 스모크를 실행하세요:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

라이브 스모크 환경:

- `OPENCLAW_LIVE_TEST=1`은 보호된 라이브 테스트를 활성화합니다.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`은 보존된 Meet URL, 코드 또는
  `spaces/{id}`를 가리킵니다.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`는 OAuth
  client id를 제공합니다.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`은
  refresh token을 제공합니다.
- 선택 사항: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`도 `OPENCLAW_` 접두사 없는
  동일한 폴백 이름을 사용합니다.

기본 artifact/attendance 라이브 스모크에는
`https://www.googleapis.com/auth/meetings.space.readonly`와
`https://www.googleapis.com/auth/meetings.conference.media.readonly`가 필요합니다. Calendar
조회에는 `https://www.googleapis.com/auth/calendar.events.readonly`가 필요합니다. Drive
document-body 내보내기에는
`https://www.googleapis.com/auth/drive.meet.readonly`가 필요합니다.

새 Meet 공간 만들기:

```bash
openclaw googlemeet create
```

이 명령은 새 `meeting uri`, source, join session을 출력합니다. OAuth
자격 증명이 있으면 공식 Google Meet API를 사용합니다. OAuth 자격 증명이 없으면
고정된 Chrome Node의 로그인된 브라우저 프로필을 폴백으로 사용합니다. 에이전트는
`action: "create"`로 `google_meet` 도구를 사용해 한 단계로 생성과 참여를 동시에 할 수 있습니다. URL만 생성하려면 `"join": false`를 전달하세요.

브라우저 폴백의 JSON 출력 예시:

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

브라우저 폴백이 URL을 만들기 전에 Google 로그인이나 Meet 권한 차단에 걸리면,
Gateway 메서드는 실패 응답을 반환하고
`google_meet` 도구는 일반 문자열 대신 구조화된 세부 정보를 반환합니다:

```json
{
  "source": "browser",
  "error": "google-login-required: OpenClaw 브라우저 프로필에서 Google에 로그인한 뒤 미팅 생성을 다시 시도하세요.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "OpenClaw 브라우저 프로필에서 Google에 로그인한 뒤 미팅 생성을 다시 시도하세요.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

에이전트가 `manualActionRequired: true`를 보면
`manualActionMessage`와 브라우저 Node/탭 컨텍스트를 함께 보고하고,
운영자가 브라우저 단계를 완료할 때까지 새 Meet 탭을 열지 말아야 합니다.

API create의 JSON 출력 예시:

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

Meet 생성은 기본적으로 참여까지 수행합니다. Chrome 또는 Chrome-node 전송 수단은
브라우저를 통해 참여하기 위해 여전히 로그인된 Google Chrome 프로필이 필요합니다. 프로필이 로그아웃된 상태이면 OpenClaw는 `manualActionRequired: true` 또는 브라우저 폴백 오류를 보고하고, 재시도 전에 운영자가 Google 로그인을 완료하라고 요청합니다.

Cloud 프로젝트, OAuth principal, 미팅 참가자가 Meet media APIs용
Google Workspace Developer Preview Program에 등록되어 있음을 확인한 후에만
`preview.enrollmentAcknowledged: true`를 설정하세요.

## Config

일반적인 Chrome realtime 경로에는 Plugin 활성화, BlackHole, SoX,
그리고 백엔드 realtime 음성 provider 키만 필요합니다. 기본값은 OpenAI이며,
Google Gemini Live를 사용하려면 `realtime.provider: "google"`을 설정하세요:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 또는
export GEMINI_API_KEY=...
```

Plugin config는 `plugins.entries.google-meet.config` 아래에 설정합니다:

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
- `chromeNode.node`: `chrome-node`용 선택적 node id/name/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: 로그아웃된 Meet 게스트
  화면에서 사용하는 이름
- `chrome.autoJoin: true`: `chrome-node`에서
  OpenClaw 브라우저 자동화를 통한 best-effort 게스트 이름 입력 및 Join Now 클릭
- `chrome.reuseExistingTab: true`: 중복 탭을 여는 대신 기존 Meet 탭을 활성화
- `chrome.waitForInCallMs: 20000`: realtime 소개가 트리거되기 전에
  Meet 탭이 통화 중 상태를 보고할 때까지 대기
- `chrome.audioInputCommand`: stdout에 8 kHz G.711 mu-law
  오디오를 기록하는 SoX `rec` 명령
- `chrome.audioOutputCommand`: stdin에서 8 kHz G.711 mu-law
  오디오를 읽는 SoX `play` 명령
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 더 깊은 답변에는
  `openclaw_agent_consult`를 사용하는 짧은 음성 응답
- `realtime.introMessage`: realtime 브리지가
  연결될 때의 짧은 음성 준비 확인. 조용히 참여하려면 `""`로 설정

선택적 재정의:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    toolPolicy: "owner",
    introMessage: "정확히 이렇게 말해: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Twilio 전용 config:

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

`voiceCall.enabled`의 기본값은 `true`이며, Twilio 전송 수단에서는 실제 PSTN
통화와 DTMF를 Voice Call Plugin에 위임합니다. `voice-call`이 활성화되지 않은 경우
Google Meet는 여전히 다이얼 플랜을 검증하고 기록할 수 있지만,
Twilio 통화는 걸 수 없습니다.

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

Chrome이 Gateway 호스트에서 실행될 때는 `transport: "chrome"`을 사용하세요.
Chrome이 Parallels
VM 같은 페어링된 Node에서 실행될 때는 `transport: "chrome-node"`를 사용하세요. 두 경우 모두 realtime model과 `openclaw_agent_consult`는
Gateway 호스트에서 실행되므로 model 자격 증명은 সেখানে 유지됩니다.

활성 세션을 나열하거나 세션 ID를 검사하려면 `action: "status"`를 사용하세요.
realtime 에이전트가 즉시 말하게 하려면 `sessionId`와 `message`를 포함한 `action: "speak"`를 사용하세요. 세션을 만들거나 재사용하고,
알려진 문구를 트리거하고, Chrome 호스트가 보고할 수 있을 때 `inCall` 상태를 반환하려면 `action: "test_speech"`를 사용하세요. 세션 종료를 표시하려면 `action: "leave"`를 사용하세요.

`status`에는 가능한 경우 Chrome 상태가 포함됩니다:

- `inCall`: Chrome이 Meet 통화 안에 있는 것으로 보임
- `micMuted`: best-effort Meet 마이크 상태
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 브라우저 프로필에 수동 로그인, Meet 호스트 승인, 권한, 또는 음성이 동작하기 전 브라우저 제어 복구가 필요함
- `providerConnected` / `realtimeReady`: realtime 음성 브리지 상태
- `lastInputAt` / `lastOutputAt`: 브리지에서 마지막으로 본 또는 보낸 오디오 시각

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "정확히 이렇게 말해: I'm here and listening."
}
```

## realtime 에이전트 consult

Chrome realtime 모드는 라이브 음성 루프에 최적화되어 있습니다. realtime 음성
provider는 미팅 오디오를 듣고 구성된 오디오 브리지를 통해 말합니다.
realtime model에 더 깊은 추론, 현재 정보, 또는 일반 OpenClaw 도구가 필요할 때는 `openclaw_agent_consult`를 호출할 수 있습니다.

consult 도구는 최근 미팅 transcript 컨텍스트와 함께 내부적으로 일반 OpenClaw 에이전트를 실행하고, 간결한 음성 응답을 realtime
voice 세션에 반환합니다. 그러면 voice model이 그 답변을 다시 미팅에 말할 수 있습니다.
Voice Call과 동일한 공유 realtime consult 도구를 사용합니다.

`realtime.toolPolicy`는 consult 실행을 제어합니다:

- `safe-read-only`: consult 도구를 노출하고 일반 에이전트를
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`
  로 제한합니다.
- `owner`: consult 도구를 노출하고 일반 에이전트가 정상 에이전트 도구 정책을 사용하게 합니다.
- `none`: realtime 음성 model에 consult 도구를 노출하지 않습니다.

consult 세션 키는 Meet 세션별로 범위가 지정되므로, 후속 consult 호출은 같은 미팅 중 이전 consult 컨텍스트를 재사용할 수 있습니다.

Chrome이 통화에 완전히 참여한 뒤 강제로 음성 준비 확인을 하려면:

```bash
openclaw googlemeet speak meet_... "정확히 이렇게 말해: I'm here and listening."
```

전체 join-and-speak 스모크의 경우:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "정확히 이렇게 말해: I'm here and listening."
```

## 라이브 테스트 체크리스트

미팅을 무인 에이전트에 넘기기 전에 다음 순서를 사용하세요:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "정확히 이렇게 말해: Google Meet speech test complete."
```

예상되는 Chrome-node 상태:

- `googlemeet setup`이 모두 정상(초록색)입니다.
- Chrome-node가 기본 전송 수단이거나 Node가 고정되어 있을 때 `googlemeet setup`에 `chrome-node-connected`가 포함됩니다.
- `nodes status`에 선택된 Node가 연결된 것으로 표시됩니다.
- 선택된 Node가 `googlemeet.chrome`와 `browser.proxy`를 모두 광고합니다.
- Meet 탭이 통화에 참여하고 `test-speech`가 `inCall: true`와 함께 Chrome 상태를 반환합니다.

Parallels macOS VM 같은 원격 Chrome 호스트의 경우, Gateway 또는 VM을 업데이트한 뒤 가장 짧고 안전한 점검은 다음과 같습니다:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

이렇게 하면 Gateway Plugin이 로드되어 있고, VM Node가 현재 token으로 연결되어 있으며, 에이전트가 실제 미팅 탭을 열기 전에 Meet 오디오 브리지를 사용할 수 있음을 증명합니다.

Twilio 스모크의 경우, 전화 다이얼인 세부 정보를 노출하는 미팅을 사용하세요:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

예상되는 Twilio 상태:

- `googlemeet setup`에 초록색 `twilio-voice-call-plugin` 및
  `twilio-voice-call-credentials` 검사가 포함됩니다.
- Gateway를 다시 로드한 뒤 CLI에서 `voicecall`을 사용할 수 있습니다.
- 반환된 세션에 `transport: "twilio"`와 `twilio.voiceCallId`가 있습니다.
- `googlemeet leave <sessionId>`가 위임된 음성 통화를 종료합니다.

## 문제 해결

### 에이전트가 Google Meet 도구를 볼 수 없음

Gateway config에서 Plugin이 활성화되어 있는지 확인하고 Gateway를 다시 로드하세요:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

방금 `plugins.entries.google-meet`를 편집했다면 Gateway를 재시작하거나 다시 로드하세요.
실행 중인 에이전트는 현재 Gateway
프로세스에 등록된 Plugin 도구만 볼 수 있습니다.

### 연결된 Google Meet 지원 Node가 없음

Node 호스트에서 다음을 실행하세요:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway 호스트에서 Node를 승인하고 명령을 확인하세요:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node는 연결되어 있어야 하며 `googlemeet.chrome`와 `browser.proxy`를 나열해야 합니다.
Gateway config는 해당 Node 명령을 허용해야 합니다:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`이 `chrome-node-connected`에서 실패하거나 Gateway 로그에
`gateway token mismatch`가 보고되면, 현재 Gateway
token으로 Node를 다시 설치하거나 재시작하세요. LAN Gateway의 경우 보통 다음을 의미합니다:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

그런 다음 Node 서비스를 다시 로드하고 다음을 다시 실행하세요:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 브라우저는 열리지만 에이전트가 참여할 수 없음

`googlemeet test-speech`를 실행하고 반환된 Chrome 상태를 검사하세요. `manualActionRequired: true`를 보고하면 `manualActionMessage`를 운영자에게 보여주고 브라우저 작업이 완료될 때까지 재시도를 중단하세요.

일반적인 수동 작업:

- Chrome 프로필에 로그인
- Meet 호스트 계정에서 게스트 승인
- Chrome 고유 권한 프롬프트가 나타날 때 Chrome 마이크/카메라 권한 부여
- 멈춰 있는 Meet 권한 대화상자 닫기 또는 복구

Meet에 "Do you want people to
hear you in the meeting?"가 표시된다고 해서 "로그인되지 않음"으로 보고하지 마세요. 이는 Meet의 오디오 선택 중간 화면입니다. OpenClaw는 가능할 때 브라우저 자동화를 통해 **Use microphone**을 클릭하고 실제 미팅 상태를 계속 기다립니다. create-only 브라우저 폴백의 경우, URL 생성에는 realtime 오디오 경로가 필요하지 않기 때문에 OpenClaw가 **Continue without microphone**을 클릭할 수 있습니다.

### 미팅 생성 실패

`googlemeet create`는 OAuth 자격 증명이 구성되어 있으면 먼저 Google Meet API `spaces.create` 엔드포인트를 사용합니다. OAuth 자격 증명이 없으면 고정된 Chrome Node 브라우저로 폴백합니다. 다음을 확인하세요:

- API 생성의 경우: `oauth.clientId`와 `oauth.refreshToken`이 구성되어 있거나,
  일치하는 `OPENCLAW_GOOGLE_MEET_*` 환경 변수가 존재해야 합니다.
- API 생성의 경우: refresh token이 create 지원 추가 이후에 발급되었어야 합니다.
  오래된 token에는 `meetings.space.created` scope가 없을 수 있으므로
  `openclaw googlemeet auth login --json`을 다시 실행하고 Plugin config를 업데이트하세요.
- 브라우저 폴백의 경우: `defaultTransport: "chrome-node"`와
  `chromeNode.node`가 `browser.proxy`와
  `googlemeet.chrome`를 가진 연결된 Node를 가리켜야 합니다.
- 브라우저 폴백의 경우: 해당 Node의 OpenClaw Chrome 프로필이 Google에 로그인되어 있고 `https://meet.google.com/new`를 열 수 있어야 합니다.
- 브라우저 폴백의 경우: 재시도 시 새 탭을 열기 전에 기존 `https://meet.google.com/new`
  또는 Google 계정 프롬프트 탭을 재사용합니다. 에이전트가 타임아웃되면 수동으로 다른 Meet 탭을 열지 말고 도구 호출을 다시 시도하세요.
- 브라우저 폴백의 경우: 도구가 `manualActionRequired: true`를 반환하면
  반환된 `browser.nodeId`, `browser.targetId`, `browserUrl`,
  `manualActionMessage`를 사용해 운영자를 안내하세요. 해당 작업이 완료될 때까지 루프 재시도를 하지 마세요.
- 브라우저 폴백의 경우: Meet에 "Do you want people to hear you in the
  meeting?"가 표시되면 탭을 그대로 두세요. OpenClaw는 브라우저 자동화를 통해 **Use microphone** 또는 create-only 폴백의 경우 **Continue without microphone**을 클릭하고 생성된 Meet URL을 계속 기다려야 합니다. 불가능한 경우 오류에는 `google-login-required`가 아니라 `meet-audio-choice-required`가 언급되어야 합니다.

### 에이전트가 참여했지만 말하지 않음

realtime 경로를 확인하세요:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

듣기/말하기에는 `mode: "realtime"`를 사용하세요. `mode: "transcribe"`는
의도적으로 양방향 realtime 음성 브리지를 시작하지 않습니다.

또한 다음도 확인하세요:

- Gateway 호스트에 `OPENAI_API_KEY` 또는 `GEMINI_API_KEY` 같은 realtime provider 키가 있어야 합니다.
- Chrome 호스트에서 `BlackHole 2ch`를 볼 수 있어야 합니다.
- Chrome 호스트에 `rec`와 `play`가 존재해야 합니다.
- Meet 마이크와 스피커가 OpenClaw가 사용하는 가상 오디오 경로를 통해 라우팅되어야 합니다.

`googlemeet doctor [session-id]`는 세션, Node, in-call 상태,
수동 작업 이유, realtime provider 연결, `realtimeReady`, 오디오
입력/출력 활동, 마지막 오디오 타임스탬프, 바이트 카운터, 브라우저 URL을 출력합니다.
원시 JSON이 필요할 때는 `googlemeet status [session-id]`를 사용하세요.
token을 노출하지 않고 Google Meet OAuth 새로 고침을 확인하려면 `googlemeet doctor --oauth`를 사용하세요.
Google Meet API 증명도 필요하면 `--meeting` 또는 `--create-space`를 추가하세요.

에이전트가 타임아웃되었고 이미 Meet 탭이 열린 것이 보인다면, 다른 탭을 열지 말고 해당 탭을 검사하세요:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

동등한 도구 작업은 `recover_current_tab`입니다. 선택한 전송 수단에 대한 기존 Meet 탭에 초점을 맞추고 이를 검사합니다. `chrome`에서는 Gateway를 통한 로컬 브라우저 제어를 사용하고, `chrome-node`에서는 구성된 Chrome Node를 사용합니다. 새 탭을 열거나 새 세션을 만들지 않으며 로그인, 승인, 권한, 오디오 선택 상태 같은 현재 차단 요인을 보고합니다.
CLI 명령은 구성된 Gateway와 통신하므로 Gateway가 실행 중이어야 하며,
`chrome-node`에는 연결된 Chrome Node도 필요합니다.

### Twilio 설정 검사 실패

`voice-call`이 허용되지 않았거나 활성화되지 않았을 때 `twilio-voice-call-plugin`이 실패합니다.
이를 `plugins.allow`에 추가하고, `plugins.entries.voice-call`을 활성화한 뒤,
Gateway를 다시 로드하세요.

Twilio 백엔드에 account
SID, auth token, 또는 발신 번호가 없으면 `twilio-voice-call-credentials`가 실패합니다. Gateway 호스트에 다음을 설정하세요:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

그다음 Gateway를 재시작하거나 다시 로드하고 다음을 실행하세요:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

기본적으로 `voicecall smoke`는 준비 상태만 확인합니다. 특정 번호에 대해 드라이런하려면:

```bash
openclaw voicecall smoke --to "+15555550123"
```

실제 발신 notify
통화를 의도적으로 걸고 싶을 때만 `--yes`를 추가하세요:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 통화는 시작되지만 미팅에 들어가지 못함

Meet 이벤트가 전화 다이얼인 세부 정보를 노출하는지 확인하세요. 정확한 다이얼인
번호와 PIN 또는 사용자 지정 DTMF 시퀀스를 전달하세요:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

PIN 입력 전에 대기가 필요하면 `--dtmf-sequence`에서 앞에 `w` 또는 쉼표를 사용하세요.

## 참고

Google Meet의 공식 media API는 수신 중심이므로, Meet
통화에 말하기 위해서는 여전히 참가자 경로가 필요합니다. 이 Plugin은 그 경계를 명확하게 유지합니다:
Chrome은 브라우저 참가와 로컬 오디오 라우팅을 처리하고, Twilio는
전화 다이얼인 참가를 처리합니다.

Chrome realtime 모드에는 다음 중 하나가 필요합니다:

- `chrome.audioInputCommand`와 `chrome.audioOutputCommand`: OpenClaw가
  realtime model 브리지를 소유하고 해당 명령과 선택된 realtime voice provider 사이에 8 kHz G.711 mu-law 오디오를 파이프합니다.
- `chrome.audioBridgeCommand`: 외부 브리지 명령이 전체 로컬
  오디오 경로를 소유하며, 데몬을 시작하거나 검증한 뒤 종료해야 합니다.

깔끔한 양방향 오디오를 위해 Meet 출력과 Meet 마이크를 별도의
가상 디바이스 또는 Loopback 스타일 가상 디바이스 그래프를 통해 라우팅하세요. 단일 공유
BlackHole 디바이스는 다른 참가자의 오디오를 다시 통화로 에코할 수 있습니다.

`googlemeet speak`는 Chrome
세션에 대해 활성 realtime 오디오 브리지를 트리거합니다. `googlemeet leave`는 해당 브리지를 중지합니다. Voice Call Plugin을 통해 위임된 Twilio 세션의 경우 `leave`는
기본 음성 통화도 종료합니다.

## 관련

- [Voice Call Plugin](/ko/plugins/voice-call)
- [Talk mode](/ko/nodes/talk)
- [Plugins 빌드하기](/ko/plugins/building-plugins)
