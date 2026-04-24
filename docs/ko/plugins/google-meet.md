---
read_when:
    - OpenClaw 에이전트가 Google Meet 통화에 참여하도록 하려는 경우
    - Google Meet 전송으로 Chrome, Chrome Node 또는 Twilio를 구성하고 있습니다
summary: 'Google Meet Plugin: Chrome 또는 Twilio를 통해 명시적인 Meet URL에 참여하며 실시간 음성 기본값 사용'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-24T08:59:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d430a1f2d6ee7fc1d997ef388a2e0d2915a6475480343e7060edac799dfc027
    source_path: plugins/google-meet.md
    workflow: 15
---

# Google Meet (Plugin)

OpenClaw용 Google Meet 참가자 지원입니다.

이 Plugin은 설계상 명시적입니다:

- 명시적인 `https://meet.google.com/...` URL에만 참여합니다.
- `realtime` 음성이 기본 모드입니다.
- 실시간 음성은 더 깊은
  추론이나 도구가 필요할 때 전체 OpenClaw 에이전트를 다시 호출할 수 있습니다.
- 인증은 개인 Google OAuth 또는 이미 로그인된 Chrome 프로필로 시작합니다.
- 자동 동의 안내는 없습니다.
- 기본 Chrome 오디오 백엔드는 `BlackHole 2ch`입니다.
- Chrome은 로컬 또는 페어링된 Node 호스트에서 실행할 수 있습니다.
- Twilio는 전화 접속 번호와 선택적 PIN 또는 DTMF 시퀀스를 받습니다.
- CLI 명령은 `googlemeet`입니다. `meet`는 더 넓은 범위의 에이전트
  전화 회의 워크플로에 예약되어 있습니다.

## 빠른 시작

로컬 오디오 의존성을 설치하고 realtime provider가 OpenAI를 사용할 수
있는지 확인하세요:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

`blackhole-2ch`는 `BlackHole 2ch` 가상 오디오 장치를 설치합니다. Homebrew의
설치 프로그램은 macOS가 장치를 노출하기 전에 재부팅을 요구합니다:

```bash
sudo reboot
```

재부팅 후 두 항목을 모두 확인하세요:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

Plugin을 활성화합니다:

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

설정을 확인합니다:

```bash
openclaw googlemeet setup
```

회의에 참여합니다:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트가 `google_meet` 도구를 통해 참여하도록 합니다:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij"
}
```

Chrome은 로그인된 Chrome 프로필로 참여합니다. Meet에서 OpenClaw가 사용하는
마이크/스피커 경로로 `BlackHole 2ch`를 선택하세요. 깨끗한 양방향 오디오를 위해서는
별도의 가상 장치 또는 Loopback 스타일 그래프를 사용하세요. 단일 BlackHole 장치만으로도
초기 스모크 테스트는 충분하지만 에코가 발생할 수 있습니다.

### 로컬 Gateway + Parallels Chrome

macOS VM에서 Chrome을 소유하게 하려고 할 때 VM 내부에 전체 OpenClaw Gateway나 모델 API 키가
필요한 것은 **아닙니다**. Gateway와 에이전트는 로컬에서 실행하고,
VM에서는 Node 호스트를 실행하세요. 번들된 Plugin을 VM에서 한 번 활성화하면
Node가 Chrome 명령을 광고합니다:

각 위치에서 실행되는 항목:

- Gateway 호스트: OpenClaw Gateway, 에이전트 워크스페이스, 모델/API 키, realtime
  provider, 그리고 Google Meet Plugin 구성.
- Parallels macOS VM: OpenClaw CLI/Node 호스트, Google Chrome, SoX, BlackHole 2ch,
  그리고 Google에 로그인된 Chrome 프로필.
- VM에서 필요하지 않은 항목: Gateway 서비스, 에이전트 구성, OpenAI/GPT 키 또는 모델
  provider 설정.

VM 의존성을 설치합니다:

```bash
brew install blackhole-2ch sox
```

macOS가 `BlackHole 2ch`를 노출하도록 BlackHole 설치 후 VM을 재부팅하세요:

```bash
sudo reboot
```

재부팅 후 VM이 오디오 장치와 SoX 명령을 볼 수 있는지 확인합니다:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v rec play
```

VM에서 OpenClaw를 설치 또는 업데이트한 다음, 번들된 Plugin을 활성화합니다:

```bash
openclaw plugins enable google-meet
```

VM에서 Node 호스트를 시작합니다:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`가 LAN IP이고 TLS를 사용하지 않는 경우, 신뢰된 사설 네트워크에 대해
명시적으로 허용하지 않으면 Node는 plaintext WebSocket을 거부합니다:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`은 `openclaw.json` 설정이 아니라
프로세스 환경 변수입니다. `openclaw node install`은 설치 명령에 해당 변수가 존재하면
LaunchAgent 환경에 이를 저장합니다.

Gateway 호스트에서 Node를 승인합니다:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Gateway가 Node를 보고 있으며 `googlemeet.chrome`를 광고하는지 확인합니다:

```bash
openclaw nodes status
```

Gateway 호스트에서 Meet를 해당 Node를 통해 라우팅합니다:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

이제 Gateway 호스트에서 평소처럼 참여합니다:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

또는 에이전트에게 `google_meet` 도구를 `transport: "chrome-node"`와 함께 사용하도록 요청하세요.

`chromeNode.node`를 생략하면, 정확히 하나의 연결된 Node만 `googlemeet.chrome`를 광고할 때에만
OpenClaw가 자동 선택합니다. 여러 개의 사용 가능한 Node가 연결되어 있다면,
`chromeNode.node`를 Node ID, 표시 이름 또는 원격 IP로 설정하세요.

일반적인 실패 점검 항목:

- `No connected Google Meet-capable node`: VM에서 `openclaw node run`을 시작하고,
  페어링을 승인하고, VM에서 `openclaw plugins enable google-meet`를 실행했는지 확인하세요.
  또한 Gateway 호스트가
  `gateway.nodes.allowCommands: ["googlemeet.chrome"]`로 Node 명령을 허용하는지 확인하세요.
- `BlackHole 2ch audio device not found on the node`: VM에 `blackhole-2ch`를
  설치하고 VM을 재부팅하세요.
- Chrome은 열리지만 참여할 수 없음: VM 내부의 Chrome에 로그인하고 해당
  프로필로 Meet URL에 수동으로 참여할 수 있는지 확인하세요.
- 오디오 없음: Meet에서 마이크/스피커를 OpenClaw가 사용하는 가상 오디오 장치
  경로로 라우팅하세요. 깨끗한 양방향 오디오를 위해서는 별도 가상 장치 또는 Loopback 스타일 라우팅을
  사용하세요.

## 설치 참고 사항

Chrome realtime 기본 경로는 두 가지 외부 도구를 사용합니다:

- `sox`: 명령줄 오디오 유틸리티입니다. Plugin은 기본 8 kHz G.711 mu-law 오디오 브리지를 위해
  `rec` 및 `play`
  명령을 사용합니다.
- `blackhole-2ch`: macOS 가상 오디오 드라이버입니다. Chrome/Meet가 라우팅할 수 있는
  `BlackHole 2ch`
  오디오 장치를 생성합니다.

OpenClaw는 어느 패키지도 번들하거나 재배포하지 않습니다. 문서에서는 사용자가
Homebrew를 통해 이를 호스트 의존성으로 설치하도록 안내합니다. SoX의 라이선스는
`LGPL-2.0-only AND GPL-2.0-only`이고, BlackHole은 GPL-3.0입니다. BlackHole을 OpenClaw와 함께 번들한
설치 프로그램이나 어플라이언스를 빌드하는 경우, BlackHole의
업스트림 라이선스 조건을 검토하거나 Existential Audio에서 별도 라이선스를 받으세요.

## 전송

### Chrome

Chrome 전송은 Google Chrome에서 Meet URL을 열고 로그인된
Chrome 프로필로 참여합니다. macOS에서 Plugin은 실행 전에 `BlackHole 2ch`를 확인합니다.
구성된 경우, Chrome을 열기 전에 오디오 브리지 상태 점검 명령과 시작 명령도 실행합니다.
Chrome/오디오가 Gateway 호스트에 있으면 `chrome`을 사용하고,
Chrome/오디오가 Parallels macOS VM 같은 페어링된 Node에 있으면 `chrome-node`를 사용하세요.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome의 마이크 및 스피커 오디오를 로컬 OpenClaw 오디오
브리지를 통해 라우팅하세요. `BlackHole 2ch`가 설치되지 않은 경우, 오디오 경로 없이
조용히 참여하는 대신 설정 오류와 함께 참여가 실패합니다.

### Twilio

Twilio 전송은 Voice Call Plugin에 위임되는 엄격한 다이얼 플랜입니다. 이 방식은
Meet 페이지에서 전화번호를 파싱하지 않습니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

회의에 사용자 지정 시퀀스가 필요하면 `--dtmf-sequence`를 사용하세요:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 및 preflight

Google Meet Media API 액세스는 먼저 개인 OAuth 클라이언트를 사용합니다.
`oauth.clientId`와 선택적으로 `oauth.clientSecret`을 구성한 다음, 다음을 실행하세요:

```bash
openclaw googlemeet auth login --json
```

이 명령은 refresh token이 포함된 `oauth` 구성 블록을 출력합니다. PKCE,
`http://localhost:8085/oauth2callback`의 localhost 콜백, 그리고 `--manual`과 함께 사용하는
수동 복사/붙여넣기 흐름을 사용합니다.

다음 환경 변수를 폴백으로 사용할 수 있습니다:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 또는 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 또는 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 또는
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 또는 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 또는 `GOOGLE_MEET_PREVIEW_ACK`

Meet URL, 코드 또는 `spaces/{id}`를 `spaces.get`을 통해 해석합니다:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

미디어 작업 전에 preflight를 실행하세요:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Cloud 프로젝트, OAuth principal 및 회의 참가자가 Meet media API용 Google
Workspace Developer Preview Program에 등록되어 있음을 확인한 후에만
`preview.enrollmentAcknowledged: true`를 설정하세요.

## 구성

일반적인 Chrome realtime 경로는 Plugin 활성화, BlackHole, SoX,
그리고 OpenAI 키만 필요합니다:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
```

Plugin 구성은 `plugins.entries.google-meet.config` 아래에 설정합니다:

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
- `chromeNode.node`: `chrome-node`용 선택적 Node ID/이름/IP
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.audioInputCommand`: stdout에 8 kHz G.711 mu-law
  오디오를 쓰는 SoX `rec` 명령
- `chrome.audioOutputCommand`: stdin에서 8 kHz G.711 mu-law
  오디오를 읽는 SoX `play` 명령
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: 더 깊은 답변을 위한
  `openclaw_agent_consult`와 함께 짧은 음성 응답
- `realtime.introMessage`: realtime 브리지가
  연결될 때의 짧은 음성 준비 확인 메시지. 조용히 참여하려면 `""`로 설정하세요

선택적 재정의:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  chrome: {
    browserProfile: "Default",
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
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

Chrome이 Gateway 호스트에서 실행되면 `transport: "chrome"`을 사용하세요.
Chrome이 Parallels
VM 같은 페어링된 Node에서 실행되면 `transport: "chrome-node"`를 사용하세요.
두 경우 모두 realtime 모델과 `openclaw_agent_consult`는
Gateway 호스트에서 실행되므로 모델 자격 증명도 그곳에 유지됩니다.

활성 세션 목록을 보거나 세션 ID를 검사하려면 `action: "status"`를 사용하세요.
`sessionId`와 `message`로 `action: "speak"`를 사용하면 realtime 에이전트가
즉시 말하게 할 수 있습니다. `action: "leave"`를 사용하면 세션을 종료된 것으로 표시합니다.

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime 에이전트 consult

Chrome realtime 모드는 실시간 음성 루프에 최적화되어 있습니다. realtime 음성
provider는 회의 오디오를 듣고 구성된 오디오 브리지를 통해 말합니다.
realtime 모델에 더 깊은 추론, 최신 정보 또는 일반적인
OpenClaw 도구가 필요하면 `openclaw_agent_consult`를 호출할 수 있습니다.

consult 도구는 최근
회의 전사 컨텍스트를 포함해 일반 OpenClaw 에이전트를 내부적으로 실행하고, realtime
음성 세션에 간결한 음성 응답을 반환합니다. 그러면 음성 모델이 그 응답을 다시 회의에 말할 수 있습니다.

`realtime.toolPolicy`는 consult 실행을 제어합니다:

- `safe-read-only`: consult 도구를 노출하고 일반 에이전트를
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`,
  `memory_get`으로 제한합니다.
- `owner`: consult 도구를 노출하고 일반 에이전트가 정상적인
  에이전트 도구 정책을 사용하도록 합니다.
- `none`: realtime 음성 모델에 consult 도구를 노출하지 않습니다.

consult 세션 키는 Meet 세션별 범위로 지정되므로, 후속 consult 호출은
같은 회의 중 이전 consult 컨텍스트를 재사용할 수 있습니다.

Chrome이 통화에 완전히 참여한 후 음성 준비 확인을 강제로 실행하려면:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

## 참고 사항

Google Meet의 공식 media API는 수신 중심이므로, Meet
통화에 실제로 말하기 위해서는 여전히 참가자 경로가 필요합니다. 이 Plugin은 그 경계를 명확히 유지합니다:
Chrome은 브라우저 참여와 로컬 오디오 라우팅을 처리하고, Twilio는
전화 접속 참여를 처리합니다.

Chrome realtime 모드에는 다음 중 하나가 필요합니다:

- `chrome.audioInputCommand`와 `chrome.audioOutputCommand`: OpenClaw가
  realtime 모델 브리지를 소유하고, 해당 명령과 선택한 realtime 음성 provider 사이에서
  8 kHz G.711 mu-law 오디오를 파이프로 전달합니다.
- `chrome.audioBridgeCommand`: 외부 브리지 명령이 전체 로컬
  오디오 경로를 소유하며, 데몬을 시작하거나 검증한 후 종료해야 합니다.

깨끗한 양방향 오디오를 위해 Meet 출력과 Meet 마이크를 별도의
가상 장치 또는 Loopback 스타일 가상 장치 그래프로 라우팅하세요.
공유된 단일 BlackHole 장치는 다른 참가자의 오디오를 통화에 다시 에코할 수 있습니다.

`googlemeet speak`는 Chrome
세션에 대한 활성 realtime 오디오 브리지를 트리거합니다. `googlemeet leave`는 해당 브리지를 중지합니다.
Voice Call Plugin을 통해 위임된 Twilio 세션의 경우, `leave`는 기본 음성 통화도 끊습니다.

## 관련 항목

- [Voice call Plugin](/ko/plugins/voice-call)
- [Talk 모드](/ko/nodes/talk)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
