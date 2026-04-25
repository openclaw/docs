---
read_when:
    - OpenClaw 에이전트가 Google Meet 통화에 참여하게 하려고 합니다.
    - OpenClaw 에이전트가 새 Google Meet 통화를 만들게 하려고 합니다.
    - Google Meet 전송 방식으로 Chrome, Chrome Node 또는 Twilio를 구성하고 있습니다.
summary: 'Google Meet Plugin: Chrome 또는 Twilio를 통해 명시적인 Meet URL에 참여하며 realtime 음성을 기본값으로 사용'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-25T06:06:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: c96496a06d00e719ecd0af4b8edf1423cbbc37f7773672e2456baaf06c7ca0ec
    source_path: plugins/google-meet.md
    workflow: 15
---

OpenClaw용 Google Meet 참가자 지원 — 이 Plugin은 의도적으로 명시적입니다.

- 명시적인 `https://meet.google.com/...` URL에만 참여합니다.
- Google Meet API를 통해 새 Meet 공간을 만든 뒤, 반환된 URL에 참여할 수 있습니다.
- `realtime` 음성이 기본 모드입니다.
- realtime 음성은 더 깊은 추론이나 도구가 필요할 때 전체 OpenClaw 에이전트를 다시 호출할 수 있습니다.
- 에이전트는 `mode`로 참여 동작을 선택합니다. 실시간 듣기/응답에는 `realtime`을, realtime 음성 브리지가 없이 브라우저에 참여/제어만 하려면 `transcribe`를 사용합니다.
- 인증은 개인 Google OAuth 또는 이미 로그인된 Chrome profile에서 시작합니다.
- 자동 동의 안내는 없습니다.
- 기본 Chrome 오디오 백엔드는 `BlackHole 2ch`입니다.
- Chrome은 로컬 또는 페어링된 node 호스트에서 실행할 수 있습니다.
- Twilio는 전화 접속 번호와 선택적 PIN 또는 DTMF 시퀀스를 받습니다.
- CLI 명령은 `googlemeet`입니다. `meet`는 더 넓은 에이전트 텔레컨퍼런스 워크플로를 위해 예약되어 있습니다.

## 빠른 시작

로컬 오디오 의존성을 설치하고 백엔드 realtime 음성
provider를 구성하세요. 기본값은 OpenAI이며, `realtime.provider: "google"`로
Google Gemini Live도 사용할 수 있습니다.

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 또는
export GEMINI_API_KEY=...
```

`blackhole-2ch`는 `BlackHole 2ch` 가상 오디오 장치를 설치합니다. Homebrew의
설치 프로그램은 macOS가 장치를 노출하기 전에 재부팅을 요구합니다.

```bash
sudo reboot
```

재부팅 후 두 가지를 모두 확인하세요.

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
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

setup 출력은 에이전트가 읽을 수 있도록 설계되었습니다. Chrome profile,
오디오 브리지, node 고정, 지연된 realtime intro를 보고하며, Twilio 위임이
구성된 경우 `voice-call` Plugin과 Twilio 자격 증명이 준비되었는지도 보고합니다.
`ok: false`인 검사는 에이전트에게 참여를 요청하기 전에 모두 차단 요인으로 취급하세요.
스크립트 또는 기계 판독 가능한 출력에는 `openclaw googlemeet setup --json`을 사용하세요.

회의에 참여하기:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 `google_meet` 도구를 통해 에이전트가 참여하도록 합니다.

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

새 회의를 만들고 참여하기:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

참여하지 않고 URL만 만들기:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create`에는 두 가지 경로가 있습니다.

- API create: Google Meet OAuth 자격 증명이 구성된 경우 사용됩니다. 이 경로가
  가장 결정적이며 브라우저 UI 상태에 의존하지 않습니다.
- 브라우저 fallback: OAuth 자격 증명이 없을 때 사용됩니다. OpenClaw는
  고정된 Chrome node를 사용해 `https://meet.google.com/new`를 열고, Google이 실제
  회의 코드 URL로 리디렉션할 때까지 기다린 뒤, 해당 URL을 반환합니다. 이 경로는
  node의 OpenClaw Chrome profile이 이미 Google에 로그인되어 있어야 합니다.
  브라우저 자동화는 Meet 자체의 첫 실행 마이크 프롬프트를 처리하며, 이 프롬프트는
  Google 로그인 실패로 취급되지 않습니다.
  참여 및 생성 흐름은 새 탭을 열기 전에 기존 Meet 탭을 재사용하려고도 합니다. 매칭은
  `authuser` 같은 무해한 URL 쿼리 문자열을 무시하므로, 에이전트 재시도는
  두 번째 Chrome 탭을 만드는 대신 이미 열려 있는 회의를 포커스해야 합니다.

명령/도구 출력에는 어떤 경로가 사용되었는지 설명할 수 있도록 `source` 필드(`api` 또는 `browser`)가 포함됩니다.
`create`는 기본적으로 새 회의에 참여하며 `joined: true`와 참여 세션을 반환합니다.
URL만 만들려면 CLI에서는 `create --no-join`을 사용하거나, 도구에 `"join": false`를 전달하세요.

또는 에이전트에게 이렇게 지시할 수 있습니다. "Google Meet를 하나 만들고, realtime 음성으로 참여한 다음
링크를 나에게 보내." 에이전트는 `action: "create"`로 `google_meet`를 호출한 뒤
반환된 `meetingUri`를 공유해야 합니다.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

관찰 전용/브라우저 제어 참여를 하려면 `"mode": "transcribe"`를 설정하세요. 그러면
duplex realtime 모델 브리지가 시작되지 않으므로 회의에 다시 말하지 않습니다.

realtime 세션 중 `google_meet` 상태에는 `inCall`, `manualActionRequired`,
`providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, 마지막 입력/출력
타임스탬프, 바이트 카운터, 브리지 닫힘 상태 같은 브라우저 및 오디오 브리지
상태가 포함됩니다. 안전한 Meet 페이지 프롬프트가 나타나면 브라우저 자동화가 가능한 경우 이를 처리합니다. 로그인,
호스트 승인, 브라우저/OS 권한 프롬프트는 수동 조치가 필요한 이유와 메시지와 함께
수동 조치로 보고되며, 이는 에이전트가 사용자에게 전달해야 합니다.

Chrome은 로그인된 Chrome profile로 참여합니다. Meet에서 OpenClaw가 사용하는
마이크/스피커 경로로 `BlackHole 2ch`를 선택하세요. 깔끔한 duplex 오디오를 위해서는
별도의 가상 장치나 Loopback 스타일 그래프를 사용하세요. 단일 BlackHole 장치도
첫 smoke test에는 충분하지만 에코가 생길 수 있습니다.

### 로컬 gateway + Parallels Chrome

macOS VM이 Chrome을 소유하게 하기 위해 VM 내부에 전체 OpenClaw Gateway나 모델 API key가
필요한 것은 **아닙니다**. Gateway와 에이전트는 로컬에서 실행하고, VM에서 node 호스트를 실행하세요.
VM에서 번들된 Plugin을 한 번 활성화하면 node가 Chrome 명령을 광고합니다.

어디에서 무엇이 실행되는지:

- Gateway 호스트: OpenClaw Gateway, 에이전트 워크스페이스, 모델/API key, realtime
  provider, Google Meet Plugin config.
- Parallels macOS VM: OpenClaw CLI/node 호스트, Google Chrome, SoX, BlackHole 2ch,
  Google에 로그인된 Chrome profile.
- VM에서 필요하지 않은 것: Gateway 서비스, 에이전트 config, OpenAI/GPT key, 모델
  provider 설정.

VM 의존성 설치:

```bash
brew install blackhole-2ch sox
```

BlackHole 설치 후 macOS가 `BlackHole 2ch`를 노출하도록 VM을 재부팅하세요.

```bash
sudo reboot
```

재부팅 후 VM이 오디오 장치와 SoX 명령을 볼 수 있는지 확인하세요.

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM에서 OpenClaw를 설치 또는 업데이트한 뒤, 그곳에서 번들된 Plugin을 활성화합니다.

```bash
openclaw plugins enable google-meet
```

VM에서 node 호스트를 시작합니다.

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`가 LAN IP이고 TLS를 사용하지 않는다면, 신뢰된 사설 네트워크에 대해
명시적으로 허용하지 않으면 node는 평문 WebSocket을 거부합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

node를 LaunchAgent로 설치할 때도 같은 환경 변수를 사용하세요.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`은
`openclaw.json` 설정이 아니라 프로세스 환경 변수입니다. `openclaw node install`은
설치 명령에 이 값이 있으면 이를 LaunchAgent 환경에 저장합니다.

Gateway 호스트에서 node를 승인합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway가 node를 보고 있으며 `googlemeet.chrome`와 브라우저 capability/`browser.proxy`
둘 다 광고하는지 확인합니다.

```bash
openclaw nodes status
```

Gateway 호스트에서 해당 node를 통해 Meet를 라우팅합니다.

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

이제 Gateway 호스트에서 평소처럼 참여할 수 있습니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트에게 `transport: "chrome-node"`로 `google_meet` 도구를 사용하도록 요청하세요.

세션을 만들거나 재사용하고, 알려진 문구를 말하고, 세션 상태를 출력하는
원클릭 smoke test:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

참여 중 OpenClaw 브라우저 자동화는 guest 이름을 입력하고, Join/Ask
to join을 클릭하며, 프롬프트가 나타나면 Meet의 첫 실행 "Use microphone"
선택도 수락합니다. 브라우저 전용 회의 생성 중에는 Meet가 use-microphone 버튼을 노출하지 않을 경우
마이크 없이도 같은 프롬프트를 넘길 수 있습니다.
브라우저 profile이 로그인되어 있지 않거나, Meet가 호스트 승인을 기다리고 있거나,
Chrome에 마이크/카메라 권한이 필요하거나, Meet가 자동화가 해결할 수 없는 프롬프트에
멈춰 있으면, join/test-speech 결과는
`manualActionRequired: true`와 함께 `manualActionReason` 및
`manualActionMessage`를 보고합니다. 에이전트는 참여 재시도를 중단하고,
현재 `browserUrl`/`browserTitle`과 함께 정확히 그 메시지를 보고해야 하며,
수동 브라우저 작업이 완료된 뒤에만 다시 시도해야 합니다.

`chromeNode.node`를 생략하면, OpenClaw는 연결된 node가 정확히 하나이고
그 node가 `googlemeet.chrome`와 브라우저 제어 둘 다 광고할 때만 자동 선택합니다.
여러 개의 적합한 node가 연결되어 있으면, `chromeNode.node`를 node id,
표시 이름 또는 원격 IP로 설정하세요.

일반적인 실패 점검:

- `No connected Google Meet-capable node`: VM에서 `openclaw node run`을 시작하고,
  페어링을 승인한 뒤 `openclaw plugins enable google-meet`와
  `openclaw plugins enable browser`가 VM에서 실행되었는지 확인하세요. 또한
  Gateway 호스트가 두 node 명령을 모두 허용하는지 확인하세요:
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found on the node`: VM에 `blackhole-2ch`를
  설치하고 VM을 재부팅하세요.
- Chrome은 열리지만 참여할 수 없음: VM 내부의 브라우저 profile에 로그인하거나,
  guest 참여용으로 `chrome.guestName`을 계속 설정하세요. guest auto-join은 node 브라우저 proxy를 통한
  OpenClaw 브라우저 자동화를 사용하므로, node browser config가 원하는 profile을 가리키는지 확인하세요. 예:
  `browser.defaultProfile: "user"` 또는 이름이 있는 existing-session profile.
- 중복된 Meet 탭: `chrome.reuseExistingTab: true`를 켜 둔 상태로 유지하세요. OpenClaw는 새 탭을 열기 전에
  같은 Meet URL의 기존 탭을 활성화하며, 브라우저 회의 생성도 또 다른 탭을 열기 전에
  진행 중인 `https://meet.google.com/new` 또는 Google 계정 프롬프트 탭을 재사용합니다.
- 오디오 없음: Meet에서 OpenClaw가 사용하는 가상 오디오 장치 경로로
  마이크/스피커를 라우팅하세요. 깔끔한 duplex 라우팅을 위해서는 별도 가상 장치나 Loopback 스타일 라우팅을 사용하세요.

## 설치 참고

Chrome realtime 기본값은 두 개의 외부 도구를 사용합니다.

- `sox`: 명령줄 오디오 유틸리티. Plugin은 기본 8 kHz G.711 mu-law 오디오 브리지에
  `rec`와 `play` 명령을 사용합니다.
- `blackhole-2ch`: macOS 가상 오디오 드라이버. Chrome/Meet가 라우팅할 수 있는
  `BlackHole 2ch` 오디오 장치를 생성합니다.

OpenClaw는 이 두 패키지를 번들하거나 재배포하지 않습니다. 문서에서는 사용자에게
Homebrew를 통해 호스트 의존성으로 설치하도록 안내합니다. SoX 라이선스는
`LGPL-2.0-only AND GPL-2.0-only`이며, BlackHole은 GPL-3.0입니다. OpenClaw와 함께
BlackHole을 번들하는 설치 프로그램 또는 appliance를 빌드한다면, BlackHole의
upstream 라이선스 조건을 검토하거나 Existential Audio에서 별도 라이선스를 받으세요.

## 전송 방식

### Chrome

Chrome 전송은 Google Chrome에서 Meet URL을 열고 로그인된
Chrome profile로 참여합니다. macOS에서는 Plugin이 시작 전에 `BlackHole 2ch`를 확인합니다.
구성되어 있으면 Chrome을 열기 전에 오디오 브리지 상태 명령과 시작 명령도 실행합니다.
Chrome/오디오가 Gateway 호스트에 있을 때는 `chrome`을 사용하고,
Parallels macOS VM 같은 페어링된 node에 있을 때는 `chrome-node`를 사용하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome 마이크와 스피커 오디오를 로컬 OpenClaw 오디오
브리지를 통해 라우팅하세요. `BlackHole 2ch`가 설치되지 않은 경우, 오디오 경로 없이 조용히 참여하는 대신
설정 오류와 함께 참여가 실패합니다.

### Twilio

Twilio 전송 방식은 Voice Call Plugin에 위임되는 엄격한 다이얼 플랜입니다. Meet 페이지에서 전화번호를 파싱하지 않습니다.

Chrome 참여를 사용할 수 없거나 전화 접속 fallback을 원할 때 사용하세요. Google Meet는
해당 회의에 대해 전화 접속 번호와 PIN을 노출해야 하며, OpenClaw는 이를 Meet 페이지에서
발견하지 않습니다.

Voice Call Plugin은 Chrome node가 아니라 Gateway 호스트에서 활성화하세요.

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // 또는 Twilio를 기본값으로 하려면 "twilio" 설정
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

Twilio 자격 증명은 환경 변수 또는 config로 제공하세요. 환경 변수를 사용하면
비밀이 `openclaw.json` 밖에 유지됩니다.

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call`을 활성화한 뒤 Gateway를 재시작하거나 다시 로드하세요. Plugin config 변경은
이미 실행 중인 Gateway 프로세스가 다시 로드되기 전까지는 반영되지 않습니다.

그런 다음 확인합니다.

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 위임이 올바르게 연결되면 `googlemeet setup`에는 성공한
`twilio-voice-call-plugin` 및 `twilio-voice-call-credentials` 검사가 포함됩니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

회의에 커스텀 시퀀스가 필요하면 `--dtmf-sequence`를 사용하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 및 preflight

OAuth는 `googlemeet create`가 브라우저 자동화로 fallback할 수 있으므로 Meet 링크 생성에 필수는 아닙니다.
공식 API 생성,
space 해석 또는 Meet Media API preflight 검사를 원할 때 OAuth를 구성하세요.

Google Meet API 접근은 먼저 개인 OAuth 클라이언트를 사용합니다.
`oauth.clientId`와 선택적으로 `oauth.clientSecret`을 구성한 뒤 다음을 실행하세요.

```bash
openclaw googlemeet auth login --json
```

이 명령은 refresh token이 포함된 `oauth` config 블록을 출력합니다. PKCE,
`http://localhost:8085/oauth2callback`의 localhost callback, 그리고
`--manual`을 사용한 수동 복사/붙여넣기 흐름을 사용합니다.

OAuth 동의에는 Meet space 생성, Meet space 읽기 접근, Meet
conference media 읽기 접근이 포함됩니다. 회의 생성 지원이 생기기 전에 인증했다면,
refresh token에 `meetings.space.created` scope가 포함되도록 `openclaw googlemeet auth login --json`을 다시 실행하세요.

브라우저 fallback에는 OAuth 자격 증명이 필요하지 않습니다. 이 모드에서 Google
인증은 OpenClaw config가 아니라 선택된 node의 로그인된 Chrome profile에서 옵니다.

다음 환경 변수를 fallback으로 사용할 수 있습니다.

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 또는 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 또는 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 또는
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 또는 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 또는 `GOOGLE_MEET_PREVIEW_ACK`

Meet URL, 코드 또는 `spaces/{id}`를 `spaces.get`을 통해 해석합니다.

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

미디어 작업 전 preflight를 실행합니다.

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

새 Meet space 만들기:

```bash
openclaw googlemeet create
```

이 명령은 새 `meeting uri`, source, 참여 세션을 출력합니다. OAuth
자격 증명이 있으면 공식 Google Meet API를 사용합니다. OAuth 자격 증명이 없으면
고정된 Chrome node의 로그인된 브라우저 profile을 fallback으로 사용합니다. 에이전트는
`action: "create"`로 `google_meet` 도구를 사용해 한 번에 생성하고 참여할 수 있습니다.
URL만 생성하려면 `"join": false`를 전달하세요.

브라우저 fallback의 JSON 출력 예시:

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

브라우저 fallback이 URL을 만들기 전에 Google 로그인이나 Meet 권한 차단에 걸리면,
Gateway 메서드는 실패한 응답을 반환하고
`google_meet` 도구는 일반 문자열 대신 구조화된 세부 정보를 반환합니다.

```json
{
  "source": "browser",
  "error": "google-login-required: OpenClaw 브라우저 profile에서 Google에 로그인한 뒤 회의 생성을 다시 시도하세요.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "OpenClaw 브라우저 profile에서 Google에 로그인한 뒤 회의 생성을 다시 시도하세요.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

에이전트가 `manualActionRequired: true`를 보면,
`manualActionMessage`와 브라우저 node/tab 컨텍스트를 보고하고,
운영자가 브라우저 단계를 완료할 때까지 새
Meet 탭 열기를 중단해야 합니다.

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

Meet 생성은 기본적으로 참여까지 수행합니다. Chrome 또는 Chrome-node 전송은 여전히
브라우저를 통해 참여하려면 로그인된 Google Chrome profile이 필요합니다. profile이
로그아웃된 상태면 OpenClaw는 `manualActionRequired: true` 또는
브라우저 fallback 오류를 보고하고, 재시도 전에 운영자가 Google 로그인을 완료하라고 요청합니다.

Cloud 프로젝트, OAuth principal, 회의 참가자가 Meet media API용 Google
Workspace Developer Preview Program에 등록되어 있음을 확인한 뒤에만
`preview.enrollmentAcknowledged: true`를 설정하세요.

## 구성

일반적인 Chrome realtime 경로에는 Plugin 활성화, BlackHole, SoX,
그리고 백엔드 realtime 음성 provider key만 필요합니다. 기본값은 OpenAI이며,
Google Gemini Live를 사용하려면 `realtime.provider: "google"`을 설정하세요.

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# 또는
export GEMINI_API_KEY=...
```

Plugin config는 `plugins.entries.google-meet.config` 아래에 설정하세요.

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
- `chromeNode.node`: `chrome-node`용 선택적 node id/이름/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: 로그아웃된 Meet guest
  화면에서 사용하는 이름
- `chrome.autoJoin: true`: `chrome-node`에서 OpenClaw 브라우저 자동화를 통한
  guest 이름 입력 및 지금 참여 클릭 best-effort
- `chrome.reuseExistingTab: true`: 중복 탭을 여는 대신 기존 Meet 탭 활성화
- `chrome.waitForInCallMs: 20000`: realtime intro가 트리거되기 전에
  Meet 탭이 통화 중 상태를 보고할 때까지 대기
- `chrome.audioInputCommand`: stdout으로 8 kHz G.711 mu-law
  오디오를 쓰는 SoX `rec` 명령
- `chrome.audioOutputCommand`: stdin에서 8 kHz G.711 mu-law
  오디오를 읽는 SoX `play` 명령
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 더 깊은 답변에는
  `openclaw_agent_consult`를 사용하는 짧은 음성 응답
- `realtime.introMessage`: realtime 브리지가
  연결되었을 때의 짧은 음성 준비 확인; 조용히 참여하려면 `""`로 설정

선택적 override:

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

`voiceCall.enabled`의 기본값은 `true`입니다. Twilio 전송에서는 실제 PSTN 통화와 DTMF를
Voice Call Plugin에 위임합니다. `voice-call`이 활성화되지 않은 경우에도
Google Meet는 다이얼 플랜을 검증하고 기록할 수는 있지만,
Twilio 통화를 걸 수는 없습니다.

## 도구

에이전트는 `google_meet` 도구를 사용할 수 있습니다.

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Chrome이 Gateway 호스트에서 실행되면 `transport: "chrome"`을 사용하세요.
Chrome이 Parallels
VM 같은 페어링된 node에서 실행되면 `transport: "chrome-node"`를 사용하세요. 두 경우 모두 realtime 모델과 `openclaw_agent_consult`는
Gateway 호스트에서 실행되므로 모델 자격 증명은 그곳에 유지됩니다.

활성 세션을 나열하거나 세션 ID를 검사하려면 `action: "status"`를 사용하세요.
`action: "speak"`에 `sessionId`와 `message`를 사용하면 realtime 에이전트가
즉시 말하게 할 수 있습니다. `action: "test_speech"`는 세션을 만들거나 재사용하고,
알려진 문구를 트리거하며, Chrome 호스트가 보고할 수 있을 때 `inCall` 상태를 반환합니다.
세션 종료 표시에는 `action: "leave"`를 사용하세요.

`status`에는 가능한 경우 Chrome 상태가 포함됩니다.

- `inCall`: Chrome이 Meet 통화 안에 있는 것으로 보임
- `micMuted`: best-effort Meet 마이크 상태
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: 음성이 동작하기 전에
  브라우저 profile에 수동 로그인, Meet 호스트 승인, 권한 또는
  브라우저 제어 복구가 필요함
- `providerConnected` / `realtimeReady`: realtime 음성 브리지 상태
- `lastInputAt` / `lastOutputAt`: 브리지에서 마지막으로 보거나 보낸 오디오 시각

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "정확히 이렇게 말해: I'm here and listening."
}
```

## Realtime agent consult

Chrome realtime 모드는 실시간 음성 루프에 최적화되어 있습니다. realtime 음성
provider는 회의 오디오를 듣고 구성된 오디오 브리지를 통해 말합니다.
realtime 모델에 더 깊은 추론, 현재 정보 또는 일반 OpenClaw 도구가 필요하면
`openclaw_agent_consult`를 호출할 수 있습니다.

consult 도구는 배후에서 일반 OpenClaw 에이전트를 실행하고 최근
회의 transcript 컨텍스트와 함께 간결한 음성 응답을 realtime
음성 세션에 반환합니다. 그러면 음성 모델이 그 응답을 회의에 다시 말할 수 있습니다.
Voice Call과 동일한 공유 realtime consult 도구를 사용합니다.

`realtime.toolPolicy`는 consult 실행을 제어합니다.

- `safe-read-only`: consult 도구를 노출하고 일반 에이전트를
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`,
  `memory_get`으로 제한합니다.
- `owner`: consult 도구를 노출하고 일반 에이전트가 정상 에이전트 도구 정책을 사용하게 합니다.
- `none`: realtime 음성 모델에 consult 도구를 노출하지 않습니다.

consult 세션 키는 Meet 세션별로 범위가 지정되므로, 후속 consult 호출은
같은 회의 중 이전 consult 컨텍스트를 재사용할 수 있습니다.

Chrome이 통화에 완전히 참여한 뒤 강제로 음성 준비 확인을 하려면:

```bash
openclaw googlemeet speak meet_... "정확히 이렇게 말해: I'm here and listening."
```

전체 참여 후 말하기 smoke 테스트:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "정확히 이렇게 말해: I'm here and listening."
```

## 라이브 테스트 체크리스트

무인 에이전트에게 회의를 맡기기 전에 다음 순서를 사용하세요.

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "정확히 이렇게 말해: Google Meet speech test complete."
```

예상되는 Chrome-node 상태:

- `googlemeet setup`이 모두 녹색입니다.
- Chrome-node가 기본
  전송이거나 node가 고정되어 있으면 `googlemeet setup`에 `chrome-node-connected`가 포함됩니다.
- `nodes status`에 선택된 node가 연결된 것으로 표시됩니다.
- 선택된 node는 `googlemeet.chrome`와 `browser.proxy` 둘 다 광고합니다.
- Meet 탭이 통화에 참여하고 `test-speech`는
  `inCall: true`와 함께 Chrome 상태를 반환합니다.

Parallels macOS VM 같은 원격 Chrome 호스트의 경우, Gateway 또는 VM 업데이트 후
가장 짧고 안전한 확인 절차는 다음과 같습니다.

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

이렇게 하면 Gateway Plugin이 로드되었고, VM node가
현재 토큰으로 연결되어 있으며, 에이전트가 실제 회의 탭을 열기 전에
Meet 오디오 브리지를 사용할 수 있음을 증명합니다.

Twilio smoke의 경우, 전화 접속 세부 정보를 노출하는 회의를 사용하세요.

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

예상되는 Twilio 상태:

- `googlemeet setup`에 녹색 `twilio-voice-call-plugin` 및
  `twilio-voice-call-credentials` 검사가 포함됩니다.
- Gateway 재로드 후 CLI에서 `voicecall`을 사용할 수 있습니다.
- 반환된 세션에는 `transport: "twilio"`와 `twilio.voiceCallId`가 있습니다.
- `googlemeet leave <sessionId>`는 위임된 음성 통화를 종료합니다.

## 문제 해결

### 에이전트가 Google Meet 도구를 볼 수 없음

Gateway config에서 Plugin이 활성화되어 있는지 확인하고 Gateway를 다시 로드하세요.

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

방금 `plugins.entries.google-meet`를 편집했다면, Gateway를 재시작하거나 다시 로드하세요.
실행 중인 에이전트는 현재 Gateway
프로세스가 등록한 Plugin 도구만 볼 수 있습니다.

### 연결된 Google Meet 지원 node가 없음

node 호스트에서 다음을 실행하세요.

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway 호스트에서 node를 승인하고 명령을 확인합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

node는 연결되어 있어야 하며 `googlemeet.chrome`와 `browser.proxy`를 나열해야 합니다.
Gateway config는 해당 node 명령을 허용해야 합니다.

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`에서 `chrome-node-connected`가 실패하거나 Gateway 로그에
`gateway token mismatch`가 보고되면, 현재 Gateway
토큰으로 node를 다시 설치하거나 재시작하세요. LAN Gateway의 경우 보통 다음을 의미합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

그런 다음 node 서비스를 다시 로드하고 다음을 다시 실행하세요.

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 브라우저는 열리지만 에이전트가 참여할 수 없음

`googlemeet test-speech`를 실행하고 반환된 Chrome 상태를 검사하세요. 여기에
`manualActionRequired: true`가 보고되면, 운영자에게 `manualActionMessage`를 보여주고
브라우저 작업이 완료될 때까지 재시도를 중단하세요.

일반적인 수동 작업:

- Chrome profile에 로그인.
- Meet 호스트 계정에서 guest 승인.
- Chrome의 네이티브 권한 프롬프트가 나타날 때 마이크/카메라 권한 부여.
- 멈춘 Meet 권한 대화상자 닫기 또는 복구.

Meet에 "Do you want people to
hear you in the meeting?"가 보인다고 해서 "로그인되지 않음"으로 보고하지 마세요. 이것은 Meet의 오디오 선택 인터스티셜이며, OpenClaw는
가능하면 브라우저 자동화를 통해 **Use microphone**을 클릭하고 실제 회의 상태를 계속 기다립니다. create 전용 브라우저 fallback의 경우에는 URL 생성에 realtime 오디오 경로가 필요 없으므로
OpenClaw가 **Continue without microphone**을 클릭할 수 있습니다.

### 회의 생성 실패

`googlemeet create`는 OAuth 자격 증명이 구성된 경우 먼저 Google Meet API `spaces.create` 엔드포인트를
사용합니다. OAuth 자격 증명이 없으면 고정된 Chrome node 브라우저로
fallback합니다. 다음을 확인하세요.

- API 생성의 경우: `oauth.clientId`와 `oauth.refreshToken`이 구성되어 있거나,
  일치하는 `OPENCLAW_GOOGLE_MEET_*` 환경 변수가 존재해야 합니다.
- API 생성의 경우: refresh token이 생성 지원이 추가된 이후에 발급되었어야 합니다.
  오래된 토큰에는 `meetings.space.created` scope가 없을 수 있습니다. `openclaw googlemeet auth login --json`을 다시 실행하고 Plugin config를 업데이트하세요.
- 브라우저 fallback의 경우: `defaultTransport: "chrome-node"`와
  `chromeNode.node`가 `browser.proxy`와
  `googlemeet.chrome`를 가진 연결된 node를 가리켜야 합니다.
- 브라우저 fallback의 경우: 해당 node의 OpenClaw Chrome profile이 Google에 로그인되어 있어야 하며
  `https://meet.google.com/new`를 열 수 있어야 합니다.
- 브라우저 fallback의 경우: 재시도는 새 탭을 열기 전에 기존
  `https://meet.google.com/new` 또는 Google 계정 프롬프트 탭을 재사용합니다. 에이전트가 시간 초과되면,
  다른 Meet 탭을 수동으로 여는 대신 도구 호출을 다시 시도하세요.
- 브라우저 fallback의 경우: 도구가 `manualActionRequired: true`를 반환하면,
  반환된 `browser.nodeId`, `browser.targetId`, `browserUrl`,
  `manualActionMessage`를 사용해 운영자를 안내하세요. 해당 작업이 완료될 때까지
  루프로 재시도하지 마세요.
- 브라우저 fallback의 경우: Meet에 "Do you want people to hear you in the
  meeting?"가 표시되면 탭을 열어 둔 채로 두세요. OpenClaw는 브라우저
  자동화를 통해 **Use microphone** 또는 create 전용 fallback의 경우 **Continue without microphone**을 클릭하고 생성된 Meet URL을 계속 기다려야 합니다. 이 작업을 할 수 없다면,
  오류는 `google-login-required`가 아니라 `meet-audio-choice-required`를 언급해야 합니다.

### 에이전트는 참여했지만 말하지 않음

realtime 경로를 확인하세요.

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

듣기/응답에는 `mode: "realtime"`을 사용하세요. `mode: "transcribe"`는 의도적으로
duplex realtime 음성 브리지를 시작하지 않습니다.

또한 다음을 확인하세요.

- `OPENAI_API_KEY` 또는 `GEMINI_API_KEY` 같은 realtime provider key가 Gateway 호스트에 있어야 합니다.
- `BlackHole 2ch`가 Chrome 호스트에서 보여야 합니다.
- `rec`와 `play`가 Chrome 호스트에 존재해야 합니다.
- Meet 마이크와 스피커가 OpenClaw가 사용하는 가상 오디오 경로를 통해 라우팅되어야 합니다.

`googlemeet doctor [session-id]`는 세션, node, 통화 중 상태,
수동 조치 이유, realtime provider 연결, `realtimeReady`, 오디오
입력/출력 활동, 마지막 오디오 타임스탬프, 바이트 카운터, 브라우저 URL을 출력합니다.
원시 JSON이 필요하면 `googlemeet status [session-id]`를 사용하세요.

에이전트가 시간 초과되었고 이미 열린 Meet 탭이 보인다면, 다른 탭을 열지 말고
해당 탭을 검사하세요.

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

동등한 도구 액션은 `recover_current_tab`입니다. 이 액션은 구성된 Chrome node의
기존 Meet 탭을 포커스하고 검사합니다. 새 탭을 열거나 새 세션을 만들지 않으며,
로그인, 승인, 권한 또는 오디오 선택 상태 같은 현재 차단 요인을 보고합니다.
CLI 명령은 구성된 Gateway와 통신하므로, Gateway가 실행 중이어야 하고
Chrome node가 연결되어 있어야 합니다.

### Twilio 설정 검사 실패

`voice-call`이 허용되지 않았거나 활성화되지 않으면 `twilio-voice-call-plugin`이 실패합니다.
`plugins.allow`에 추가하고 `plugins.entries.voice-call`을 활성화한 뒤 Gateway를 다시 로드하세요.

Twilio 백엔드에 account
SID, auth token 또는 발신 번호가 없으면 `twilio-voice-call-credentials`가 실패합니다. Gateway 호스트에 다음을 설정하세요.

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

그런 다음 Gateway를 재시작하거나 다시 로드하고 다음을 실행하세요.

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke`는 기본적으로 readiness 전용입니다. 특정 번호를 dry-run하려면:

```bash
openclaw voicecall smoke --to "+15555550123"
```

실제 아웃바운드 알림 통화를 의도적으로 걸고 싶은 경우에만 `--yes`를 추가하세요.

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 통화는 시작되지만 회의에 들어가지 못함

Meet 이벤트가 전화 접속 세부 정보를 노출하는지 확인하세요. 정확한 전화 접속
번호와 PIN 또는 커스텀 DTMF 시퀀스를 전달하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

provider가 PIN 입력 전에 잠시 멈춤이 필요하면 `--dtmf-sequence`에
선행 `w` 또는 쉼표를 사용하세요.

## 참고

Google Meet의 공식 미디어 API는 수신 중심이므로, Meet
통화에 말하려면 여전히 참가자 경로가 필요합니다. 이 Plugin은 이 경계를 명확하게 유지합니다.
Chrome은 브라우저 참여와 로컬 오디오 라우팅을 처리하고, Twilio는
전화 접속 참여를 처리합니다.

Chrome realtime 모드에는 다음 중 하나가 필요합니다.

- `chrome.audioInputCommand`와 `chrome.audioOutputCommand`: OpenClaw가
  realtime 모델 브리지를 소유하고, 해당 명령과 선택된 realtime 음성 provider 사이에
  8 kHz G.711 mu-law 오디오를 파이프합니다.
- `chrome.audioBridgeCommand`: 외부 브리지 명령이 전체 로컬
  오디오 경로를 소유하며, daemon을 시작하거나 검증한 뒤 종료해야 합니다.

깔끔한 duplex 오디오를 위해 Meet 출력과 Meet 마이크를 별도
가상 장치 또는 Loopback 스타일 가상 장치 그래프로 라우팅하세요. 단일 공유
BlackHole 장치는 다른 참가자의 오디오를 통화에 다시 에코할 수 있습니다.

`googlemeet speak`는 Chrome
세션의 활성 realtime 오디오 브리지를 트리거합니다. `googlemeet leave`는 해당 브리지를 중지합니다.
Voice Call Plugin을 통해 위임된 Twilio 세션의 경우, `leave`는
기저 음성 통화도 종료합니다.

## 관련 항목

- [Voice call plugin](/ko/plugins/voice-call)
- [Talk mode](/ko/nodes/talk)
- [Building plugins](/ko/plugins/building-plugins)
