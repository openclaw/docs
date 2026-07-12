---
read_when:
    - OpenClaw 에이전트가 Google Meet 통화에 참여하도록 하려고 합니다
    - OpenClaw 에이전트가 새 Google Meet 통화를 생성하도록 하려는 경우
    - Google Meet 전송 수단으로 Chrome, Chrome Node 또는 Twilio를 구성하고 있습니다.
summary: 'Google Meet Plugin: Chrome 또는 Twilio를 통해 명시적 Meet URL에 참여하고 에이전트 응답 기본값 사용'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-07-12T15:28:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

`google-meet` Plugin은 OpenClaw 에이전트를 대신하여 명시적인 Meet URL에 참여합니다. 의도적으로 범위가 제한되어 있습니다.

- `https://meet.google.com/...` URL에만 참여하며, 자체적으로 발견한 전화번호로 회의에 전화 접속하지 않습니다.
- `googlemeet create`는 Google Meet API(또는 브라우저 대체 경로)를 통해 새 Meet URL을 생성하고 기본적으로 해당 회의에 참여할 수 있습니다.
- Chrome 참여는 로그인된 Chrome 프로필을 사용하며, 선택적으로 페어링된 Node에서 실행할 수 있습니다. Twilio 참여는 [음성 통화 Plugin](/ko/plugins/voice-call)을 통해 전화번호와 PIN/DTMF를 다이얼하며, Meet URL로 직접 전화를 걸 수 없습니다.
- `mode: "agent"`(기본값)는 실시간 제공자로 참가자의 음성을 전사하고, 구성된 OpenClaw 에이전트로 전달한 뒤, 일반 OpenClaw TTS로 답변을 말합니다. `mode: "bidi"`에서는 실시간 음성 모델이 직접 답변합니다. `mode: "transcribe"`는 응답 없이 관찰 전용으로 참여합니다.
- Plugin이 통화에 참여할 때 자동으로 동의 안내를 방송하지 않습니다.
- CLI 명령은 `googlemeet`이며, `meet`는 더 광범위한 에이전트 원격 회의 워크플로용으로 예약되어 있습니다.

## 빠른 시작

로컬 오디오 종속성을 설치한 다음 실시간 제공자 키를 설정합니다. OpenAI는 `agent` 모드의 기본 전사 제공자이며, Google Gemini Live는 `bidi` 모드의 음성 제공자로 사용할 수 있습니다.

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# bidi 모드에서 realtime.voiceProvider가 "google"인 경우에만 필요
export GEMINI_API_KEY=...
```

`blackhole-2ch`는 Chrome이 오디오를 라우팅하는 `BlackHole 2ch` 가상 오디오 장치를 설치합니다. Homebrew 설치 프로그램으로 설치한 후 macOS에 장치가 표시되려면 재부팅해야 합니다.

```bash
sudo reboot
```

재부팅한 후 두 구성 요소를 모두 확인합니다.

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

설정을 확인한 다음 참여합니다.

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

`setup` 출력은 에이전트가 읽을 수 있고 모드 및 전송 방식에 따라 달라집니다. Chrome 프로필, Node 고정 여부를 보고하며, 실시간 Chrome 참여의 경우 BlackHole/SoX 오디오 브리지와 지연된 소개 확인도 보고합니다. 관찰 전용 참여는 실시간 필수 조건을 건너뜁니다.

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Twilio 위임이 구성된 경우 `setup`은 `voice-call`, Twilio 자격 증명, 공개 Webhook 노출의 준비 여부도 보고합니다. 에이전트가 참여하기 전에 해당 전송 방식/모드에서 `ok: false`인 모든 검사를 차단 요인으로 취급하십시오. 머신 판독 가능 출력에는 `--json`을 사용하고, 특정 전송 방식을 미리 점검하려면 `--transport chrome|chrome-node|twilio`를 사용하십시오.

```bash
openclaw googlemeet setup --transport twilio
```

또는 에이전트가 `google_meet` 도구를 통해 참여하도록 합니다.

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

macOS가 아닌 Gateway 호스트에서도 `google_meet`는 아티팩트, 캘린더, 설정, 전사, Twilio 및 `chrome-node` 작업에 계속 표시되지만, 로컬 Chrome 양방향 음성 응답(`mode: "agent"` 또는 `"bidi"`와 함께 사용하는 `transport: "chrome"`)은 오디오 브리지에 도달하기 전에 차단됩니다. 이 경로는 현재 macOS의 `BlackHole 2ch`에 의존하기 때문입니다. 대신 `mode: "transcribe"`, Twilio 전화 접속 또는 macOS `chrome-node` 호스트를 사용하십시오.

### 회의 만들기

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create`에는 두 가지 경로가 있으며, 결과의 `source` 필드에 표시됩니다.

- **`api`**: Google Meet OAuth 자격 증명이 구성된 경우 사용됩니다. 결정적이며 브라우저 UI 상태에 의존하지 않습니다.
- **`browser`**: OAuth 자격 증명이 없는 경우 사용됩니다. OpenClaw는 고정된 Chrome Node에서 `https://meet.google.com/new`를 열고 Google이 실제 회의 코드 URL로 리디렉션할 때까지 기다립니다. 해당 Node의 OpenClaw Chrome 프로필은 이미 Google에 로그인되어 있어야 합니다. 참여와 생성 모두 새 탭을 열기 전에 기존 Meet 탭(또는 진행 중인 `.../new` / Google 계정 프롬프트 탭)을 재사용합니다. 탭 일치 시 `authuser` 같은 무해한 쿼리 문자열은 무시합니다.

`create`는 기본적으로 참여하며 `joined: true`와 참여 세션을 반환합니다. URL만 생성하려면 `--no-join`(CLI) 또는 `"join": false`(도구)를 전달합니다.

API로 생성한 회의실의 경우 Google 계정 기본값을 상속하지 말고 명시적인 액세스 정책을 설정하십시오.

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | 승인 요청 없이 참여할 수 있는 사용자                              |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Meet URL을 가진 모든 사용자                                         |
| `TRUSTED`       | 호스트 조직의 신뢰할 수 있는 사용자, 초대된 외부 사용자 및 전화 접속 사용자 |
| `RESTRICTED`    | 초대받은 사용자만                                                   |

이는 API로 생성한 회의실에만 적용되므로 OAuth가 구성되어 있어야 합니다. 이 옵션이 생기기 전에 인증했다면 OAuth 동의 화면에 `meetings.space.settings` 범위를 추가한 후 `openclaw googlemeet auth login --json`을 다시 실행하십시오.

브라우저 대체 경로가 Google 로그인 또는 Meet 권한 차단 요인을 만나면 도구는 `manualActionReason`, `manualActionMessage`, `browser.nodeId`/`browser.targetId`/`browserUrl`과 함께 `manualActionRequired: true`를 반환합니다. 운영자가 브라우저 단계를 완료할 때까지 해당 메시지를 보고하고 새 Meet 탭 열기를 중단하십시오.

### 관찰 전용 참여

양방향 실시간 브리지를 건너뛰려면 `"mode": "transcribe"`를 설정하십시오(BlackHole/SoX 불필요, 음성 응답 없음). 전사 모드의 Chrome 참여는 OpenClaw의 마이크/카메라 권한 부여와 Meet **Use microphone** 경로도 건너뜁니다. Meet에 오디오 선택 중간 화면이 표시되면 자동화는 먼저 **Continue without microphone**을 시도합니다. 이 모드의 관리형 Chrome 전송 방식은 최선형 Meet 자막 관찰자를 설치합니다. `googlemeet status --json`과 `googlemeet doctor`는 `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` 및 `recentTranscript` 꼬리 부분을 보고합니다.

제한된 세션 전사본을 읽으려면 정확히 추적 중인 Meet 탭을 읽습니다.

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

관찰자는 Meet 페이지에 완료된 자막 행을 최대 2,000개까지 유지합니다. 표시 중인 점진적 텍스트는 자막 행이 완료될 때까지 상태 상태 점검 꼬리 부분에 남아 있으므로 `nextIndex`를 저장해도 이후의 텍스트 확장을 건너뛰지 않습니다. 나가면 스냅샷 전에 표시 중인 행을 완료 처리합니다. 한도를 초과하면 앞부분에서 손실된 행을 `droppedLines`가 보고합니다. 가장 최근에 종료된 세션 전사본 4개는 Gateway가 다시 시작될 때까지 읽을 수 있습니다. 그보다 오래전에 종료된 전사본은 `evicted: true`를 반환합니다. 이는 의도적으로 런타임 메모리이며 영구 회의 기록 저장소가 아닙니다. Gateway를 다시 시작하거나, 스냅샷 전에 탭을 닫거나, 문서화된 한도를 초과하면 자막이 손실될 수 있습니다.

예/아니요 듣기 검사를 수행하려면 다음을 실행합니다.

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

전사 모드로 참여하여 새로운 자막/전사 움직임을 기다린 뒤 `listenVerified`, `listenTimedOut`, 수동 작업 필드 및 현재 자막 상태를 반환합니다.

### 실시간 세션 상태

양방향 음성 응답 세션 중 `google_meet` 상태는 Chrome/오디오 브리지 상태를 보고합니다. 여기에는 `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, 마지막 입력/출력 타임스탬프, 바이트 카운터 및 브리지 종료 상태가 포함됩니다. 관리형 Chrome 세션은 상태 보고에서 `inCall: true`가 확인된 후에만 소개/테스트 문구를 말합니다. 그렇지 않으면 `speechReady: false`가 되며, 음성 시도는 아무 동작 없이 조용히 무시되지 않고 차단됩니다.

로컬 Chrome은 로그인된 OpenClaw 브라우저 프로필을 통해 참여하며 마이크/스피커 경로에 `BlackHole 2ch`가 필요합니다. 첫 스모크 테스트에는 BlackHole 장치 하나로 충분하지만 에코가 발생할 수 있습니다. 깨끗한 양방향 오디오를 위해 별도의 가상 장치 또는 Loopback 스타일 그래프를 사용하십시오.

## 로컬 Gateway + Parallels Chrome

macOS VM에서 Chrome만 제공하려는 경우 전체 Gateway 또는 모델 API 키가 필요하지 않습니다. Gateway와 에이전트는 로컬에서 실행하고, VM에서는 Node 호스트를 실행하십시오.

| 실행 위치            | 구성 요소                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Gateway 호스트       | OpenClaw Gateway, 에이전트 작업 공간, 모델/API 키, 실시간 제공자, Google Meet Plugin 구성       |
| Parallels macOS VM   | OpenClaw CLI/Node 호스트, Chrome, SoX, BlackHole 2ch, Google에 로그인된 Chrome 프로필           |
| VM에 필요하지 않음   | Gateway 서비스, 에이전트 구성, 모델 제공자 설정                                                  |

VM 종속성을 설치하고 재부팅한 후 확인합니다.

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

VM에서 Plugin을 활성화하고 Node 호스트를 시작합니다.

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

`<gateway-host>`가 TLS를 사용하지 않는 LAN IP인 경우 해당 신뢰할 수 있는 사설 네트워크 사용에 동의합니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

LaunchAgent로 설치할 때도 동일한 플래그를 사용하십시오. 이는 프로세스 환경이며, 설치 명령에 포함된 경우 LaunchAgent 환경에 저장됩니다. `openclaw.json` 설정이 아닙니다.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Gateway 호스트에서 Node를 승인한 다음, `googlemeet.chrome`과 브라우저 기능/`browser.proxy`를 모두 알리는지 확인합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

해당 Node를 통해 Meet을 라우팅합니다.

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

이제 Gateway 호스트에서 평소와 같이 참여합니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

세션을 생성하거나 재사용하고, 알려진 문구를 말한 뒤, 세션 상태를 출력하는 단일 명령 스모크 테스트를 실행하려면 다음을 사용합니다.

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

실시간 참여 중 브라우저 자동화는 게스트 이름을 입력하고 Join/Ask to join을 클릭하며, Meet의 최초 실행 "Use microphone" 프롬프트가 표시되면 수락합니다(관찰 전용 참여 및 브라우저 전용 회의 생성 시에는 "Continue without microphone"). 프로필이 로그아웃되어 있거나, Meet이 호스트 승인을 기다리고 있거나, Chrome에 마이크/카메라 권한이 필요하거나, Meet이 해결되지 않은 프롬프트에서 멈춘 경우 결과는 `manualActionReason` 및 `manualActionMessage`와 함께 `manualActionRequired: true`를 보고합니다. 재시도를 중단하고 해당 메시지와 `browserUrl`/`browserTitle`을 보고한 뒤, 수동 작업이 완료된 후에만 다시 시도하십시오.

`chromeNode.node`를 생략하면 OpenClaw는 연결된 Node 중 정확히 하나만 `googlemeet.chrome`과 브라우저 제어를 모두 알릴 때만 자동 선택합니다. 기능을 갖춘 Node가 여러 개 연결되어 있으면 `chromeNode.node`를 고정하십시오(Node ID, 표시 이름 또는 원격 IP).

### 일반적인 실패 확인 사항

| 증상                                                     | 해결 방법                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | 고정된 Node가 알려져 있지만 사용할 수 없습니다. 설정 차단 요인을 보고하고, 요청받지 않는 한 다른 전송 방식으로 자동 대체하지 마십시오.                                                                                                                                     |
| `No connected Google Meet-capable node`                  | VM에서 `openclaw node run`을 실행하고 페어링을 승인한 다음, 그곳에서 `openclaw plugins enable google-meet` 및 `openclaw plugins enable browser`를 실행하십시오. `gateway.nodes.allowCommands`에 `googlemeet.chrome` 및 `browser.proxy`가 포함되어 있는지 확인하십시오.          |
| `BlackHole 2ch audio device not found`                   | 확인 중인 호스트에 `blackhole-2ch`를 설치하고 재부팅하십시오.                                                                                                                                                                                                               |
| `BlackHole 2ch audio device not found on the node`       | VM에 `blackhole-2ch`를 설치하고 VM을 재부팅하십시오.                                                                                                                                                                                                                        |
| Chrome이 열리지만 참여할 수 없음                         | VM의 브라우저 프로필에 로그인하거나 `chrome.guestName`을 계속 설정해 두십시오. 게스트 자동 참여는 Node 브라우저 프록시를 통한 OpenClaw 브라우저 자동화를 사용합니다. Node의 `browser.defaultProfile` 또는 명명된 기존 세션 프로필이 원하는 프로필을 가리키도록 설정하십시오. |
| 중복된 Meet 탭                                           | `chrome.reuseExistingTab: true`를 유지하십시오. OpenClaw는 같은 URL의 기존 탭을 활성화하며, 다른 탭을 열기 전에 생성 중인 `.../new` 탭 또는 Google 계정 안내 탭을 재사용합니다.                                                                                                |
| 오디오 없음                                              | OpenClaw에서 사용하는 가상 오디오 경로를 통해 Meet 마이크/스피커를 라우팅하십시오. 깔끔한 전이중 오디오를 위해 별도의 가상 장치 또는 Loopback 방식의 라우팅을 사용하십시오.                                                                                                  |

## 설치 참고 사항

Chrome 토크백 기본 설정은 OpenClaw가 번들로 제공하거나 재배포하지 않는 외부 도구 두 개를 사용합니다. Homebrew를 통해 호스트 종속성으로 설치하십시오.

- `sox`: 명령줄 오디오 유틸리티입니다. Plugin은 기본 24 kHz PCM16 오디오 브리지에 대해 명시적인 CoreAudio 장치 명령을 실행합니다.
- `blackhole-2ch`: Chrome/Meet가 라우팅에 사용하는 `BlackHole 2ch` 장치를 제공하는 macOS 가상 오디오 드라이버입니다.

SoX의 라이선스는 `LGPL-2.0-only AND GPL-2.0-only`이며, BlackHole은 GPL-3.0입니다. BlackHole을 OpenClaw와 함께 번들로 제공하는 설치 프로그램이나 어플라이언스를 빌드하는 경우 BlackHole의 업스트림 라이선스를 검토하거나 Existential Audio에서 별도 라이선스를 취득하십시오.

## 전송 방식

| 전송 방식     | 사용 시점                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/오디오가 Gateway 호스트에서 실행되는 경우                                              |
| `chrome-node` | Chrome/오디오가 페어링된 Node(예: Parallels macOS VM)에서 실행되는 경우                        |
| `twilio`      | Chrome 참여를 사용할 수 없을 때 Voice Call Plugin을 통한 전화 접속 대체 수단으로 사용하는 경우 |

### Chrome

OpenClaw 브라우저 제어를 통해 Meet URL을 열고 로그인된 OpenClaw 브라우저 프로필로 참여합니다. macOS에서는 Plugin이 실행 전에 `BlackHole 2ch`를 확인하고, 구성된 경우 Chrome을 열기 전에 오디오 브리지 상태 확인/시작 명령을 실행합니다. 로컬 Chrome의 경우 `browser.defaultProfile`로 프로필을 선택하십시오. 대신 `chrome.browserProfile`은 `chrome-node` 호스트에 전달됩니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Chrome 마이크/스피커 오디오는 로컬 OpenClaw 오디오 브리지를 통해 라우팅됩니다. `BlackHole 2ch`가 설치되어 있지 않으면 오디오 경로 없이 참여하는 대신 설정 오류와 함께 참여에 실패합니다.

### Twilio

[Voice Call Plugin](/ko/plugins/voice-call)에 위임되는 엄격한 다이얼 플랜입니다. Meet 페이지에서 전화번호를 파싱하지 않습니다. Google Meet에서 해당 회의의 전화 접속 번호와 PIN을 제공해야 합니다.

Chrome Node가 아닌 Gateway 호스트에서 Voice Call을 활성화하십시오.

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // 또는 Twilio를 기본값으로 사용하려면 "twilio"로 설정합니다
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
            instructions: "OpenClaw 에이전트로 이 Google Meet에 참여합니다. 간결하게 응답합니다.",
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

`openclaw.json`에 비밀 정보를 넣지 않도록 환경을 통해 Twilio 자격 증명을 제공하십시오.

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

OpenAI가 실시간 음성 제공자인 경우 대신 `OPENAI_API_KEY`와 함께 `realtime.provider: "openai"`를 사용하십시오.

`voice-call`을 활성화한 후 Gateway를 다시 시작하거나 다시 로드하십시오. Plugin 구성 변경 사항은 다시 로드할 때까지 적용되지 않습니다. 다음을 확인하십시오.

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Twilio 위임이 연결되면 `googlemeet setup`에 `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, `twilio-voice-call-webhook` 검사가 포함됩니다.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

사용자 지정 시퀀스에는 `--dtmf-sequence`를 사용하고, PIN 전에 일시 중지하려면 앞에 `w` 또는 쉼표를 넣으십시오.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth 및 사전 점검

`googlemeet create`가 브라우저 자동화로 대체할 수 있으므로 Meet 링크를 만들 때 OAuth는 선택 사항입니다. 공식 API 생성, 스페이스 확인 또는 Meet Media API 사전 점검에는 OAuth를 구성하십시오. Chrome/Chrome-node 참여는 OAuth에 의존하지 않습니다. 어떤 경우든 로그인된 Chrome 프로필, BlackHole/SoX, 그리고 `chrome-node`의 경우 연결된 Node를 사용합니다.

### Google 자격 증명 만들기

Google Cloud Console에서 다음을 수행하십시오.

<Steps>
<Step title="프로젝트 만들기 또는 선택">
</Step>
<Step title="Google Meet REST API 활성화">
</Step>
<Step title="OAuth 동의 화면 구성">
Google Workspace 조직에서는 Internal이 가장 간단합니다. 개인/테스트 설정에서는 External을 사용할 수 있습니다. 앱이 Testing 상태인 동안 앱을 승인할 각 Google 계정을 테스트 사용자로 추가하십시오.
</Step>
<Step title="요청된 범위 추가">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (Calendar 조회)
- `https://www.googleapis.com/auth/drive.meet.readonly` (스크립트/스마트 노트 문서 본문 내보내기)

</Step>
<Step title="OAuth 클라이언트 ID 만들기">
애플리케이션 유형은 **Web application**입니다. 승인된 리디렉션 URI:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="클라이언트 ID 및 클라이언트 보안 비밀 복사">
</Step>
</Steps>

`meetings.space.created`는 `spaces.create`에 필요합니다. `meetings.space.readonly`는 Meet URL/코드를 스페이스로 확인합니다. `meetings.space.settings`를 사용하면 OpenClaw가 API 회의실 생성 중 `accessType`과 같은 `SpaceConfig` 설정을 전달할 수 있습니다. `meetings.conference.media.readonly`는 Meet Media API 사전 점검 및 미디어 작업에 사용됩니다. 실제 Media API 사용에는 Google에서 Developer Preview 등록을 요구할 수 있습니다. `calendar.events.readonly`는 `--today`/`--event` Calendar 조회에만 필요합니다. `drive.meet.readonly`는 `--include-doc-bodies` 내보내기에만 필요합니다. 브라우저 기반 Chrome 참여만 필요한 경우 OAuth를 완전히 건너뛰십시오.

### 새로 고침 토큰 발급

`oauth.clientId`와 선택적으로 `oauth.clientSecret`을 구성하거나 환경 변수로 전달한 후 다음을 실행하십시오.

```bash
openclaw googlemeet auth login --json
```

이 명령은 `http://localhost:8085/oauth2callback`의 localhost 콜백을 사용하는 PKCE 흐름을 실행하고 새로 고침 토큰이 포함된 `oauth` 구성 블록을 출력합니다. 브라우저가 로컬 콜백에 접근할 수 없는 경우 복사/붙여넣기 흐름을 사용하려면 `--manual`을 추가하십시오.

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON 출력:

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

Plugin 구성 아래에 `oauth` 객체를 저장하십시오.

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

새로 고침 토큰을 구성에 넣고 싶지 않다면 환경 변수를 사용하는 것이 좋습니다. 먼저 구성을 확인한 후 환경을 대체 수단으로 사용합니다. 회의 생성, Calendar 조회 또는 문서 본문 내보내기 지원이 존재하기 전에 인증했다면 새로 고침 토큰이 현재 범위 집합을 포함하도록 `openclaw googlemeet auth login --json`을 다시 실행하십시오.

### doctor로 OAuth 확인

```bash
openclaw googlemeet doctor --oauth --json
```

이 명령은 Chrome 런타임을 로드하거나 연결된 Node를 요구하지 않고 OAuth 구성이 존재하며 새로 고침 토큰으로 액세스 토큰을 발급할 수 있는지 확인합니다. 보고서에는 상태 필드(`ok`, `configured`, `tokenSource`, `expiresAt`, 검사 메시지)만 포함되며 액세스 토큰, 새로 고침 토큰 또는 클라이언트 보안 비밀은 절대 출력하지 않습니다.

| 검사                 | 의미                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId`와 `oauth.refreshToken`, 또는 캐시된 액세스 토큰이 존재함                    |
| `oauth-token`        | 캐시된 액세스 토큰이 아직 유효하거나 새로 고침 토큰으로 새 토큰을 발급함                    |
| `meet-spaces-get`    | 선택적 `--meeting` 검사가 기존 Meet 스페이스를 확인함                                        |
| `meet-spaces-create` | 선택적 `--create-space` 검사가 새 Meet 스페이스를 생성함                                     |

부수 효과가 발생하는 생성 검사를 사용해 Meet API 활성화와 `spaces.create` 범위를 검증합니다.

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

기존 스페이스에 대한 읽기 액세스를 검증합니다.

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

이러한 검사에서 `403`이 반환되면 일반적으로 Meet REST API가 비활성화되어 있거나, 새로 고침 토큰에 필요한 범위가 없거나, Google 계정에서 해당 스페이스에 액세스할 수 없음을 의미합니다. 새로 고침 토큰 오류가 발생하면 `openclaw googlemeet auth login --json`을 다시 실행하고 새 `oauth` 블록을 저장합니다.

브라우저 폴백에는 OAuth가 필요하지 않습니다. 이 경우 Google 인증은 OpenClaw 구성이 아니라 선택한 Node에서 로그인된 Chrome 프로필을 통해 이루어집니다.

다음 환경 변수를 폴백으로 사용할 수 있습니다.

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` 또는 `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` 또는 `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` 또는 `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` 또는 `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` 또는 `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` 또는 `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` 또는 `GOOGLE_MEET_PREVIEW_ACK`

### 확인, 사전 점검 및 아티팩트 읽기

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Meet에서 회의 레코드를 생성한 후 다음을 실행합니다.

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

`--meeting`을 사용하면 `artifacts`와 `attendance`는 기본적으로 최신 회의 레코드를 사용합니다. 보존된 모든 레코드를 사용하려면 `--all-conference-records`를 전달합니다.

Calendar 조회는 아티팩트를 읽기 전에 Google Calendar에서 회의 URL을 확인합니다(Calendar 이벤트 읽기 전용 범위가 포함된 새로 고침 토큰 필요).

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today`는 오늘의 `primary` Calendar에서 Meet 링크가 있는 이벤트를 검색하고, `--event <query>`는 일치하는 이벤트 텍스트를 검색하며, `--calendar <id>`는 기본 Calendar가 아닌 다른 Calendar를 대상으로 합니다. `calendar-events`는 일치하는 이벤트를 미리 보여 주고 `latest`/`artifacts`/`attendance`/`export`가 선택할 이벤트를 표시합니다.

회의 레코드 ID를 이미 알고 있다면 직접 지정합니다.

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

API로 생성한 스페이스의 회의실을 닫습니다.

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

`spaces.endActiveConference`를 호출하며, 승인된 계정에서 관리할 수 있는 스페이스에 대한 `meetings.space.created` 범위의 OAuth가 필요합니다. Meet URL, 회의 코드 또는 `spaces/{id}`를 허용하며, 먼저 API 스페이스 리소스로 확인합니다. 이는 `googlemeet leave`와 별개입니다. `leave`는 OpenClaw의 로컬/세션 참여를 중지하고, `end-active-conference`는 Google Meet에 해당 스페이스의 활성 회의를 종료하도록 요청합니다.

읽기 쉬운 보고서를 작성합니다.

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

Google에서 제공하는 경우 `artifacts`는 회의 레코드 메타데이터와 함께 참가자, 녹화, 스크립트, 구조화된 스크립트 항목 및 스마트 노트 리소스 메타데이터를 반환합니다. `--no-transcript-entries`는 대규모 회의에서 항목 조회를 건너뜁니다. `attendance`는 참가자를 첫 번째/마지막 확인 시각, 전체 세션 시간, 지각/조기 퇴장 플래그가 포함된 참가자 세션 행으로 확장하고, 로그인 사용자 또는 표시 이름을 기준으로 중복 참가자 리소스를 병합합니다. `--no-merge-duplicates`는 원시 리소스를 분리된 상태로 유지하고, `--late-after-minutes`/`--early-before-minutes`는 임계값을 조정합니다.

`export`는 `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json`, `manifest.json`이 포함된 폴더를 작성합니다. `manifest.json`에는 선택된 입력, 내보내기 옵션, 회의 레코드, 출력 파일, 개수, 토큰 소스, 사용된 Calendar 이벤트 및 부분 검색 경고가 기록됩니다. `--zip`은 폴더 옆에 이식 가능한 아카이브도 작성합니다. `--include-doc-bodies`는 Drive `files.export`를 통해 연결된 스크립트/스마트 노트 Google Docs 텍스트를 내보냅니다(Drive Meet 읽기 전용 범위 필요). 이를 사용하지 않으면 내보내기에 Meet 메타데이터와 구조화된 스크립트 항목만 포함됩니다. 일부 아티팩트 오류(스마트 노트 목록 조회, 스크립트 항목 또는 문서 본문 오류)가 발생하면 전체 내보내기에 실패하는 대신 요약/매니페스트에 경고를 유지합니다. `--dry-run`은 동일한 데이터를 가져와 폴더나 ZIP을 생성하지 않고 매니페스트 JSON을 출력합니다.

에이전트는 `google_meet` 도구를 통해 동일한 작업(`export`, `accessType`을 사용하는 `create`, `end_active_conference`, `test_listen`)을 사용합니다. [도구](#tool)를 참조하십시오.

### 라이브 스모크 테스트

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| 변수                                                                                                                      | 용도                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | 보호된 라이브 테스트를 활성화합니다                                    |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | 보존된 Meet URL, 코드 또는 `spaces/{id}`                               |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | OAuth 클라이언트 ID                                                    |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | 새로 고침 토큰                                                         |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | 선택 사항이며, `OPENCLAW_` 접두사가 없는 동일한 폴백 이름도 작동합니다 |

기본 아티팩트/참석자 스모크 테스트에는 `meetings.space.readonly`와 `meetings.conference.media.readonly`가 필요합니다. Calendar 조회에는 `calendar.events.readonly`가 필요합니다. Drive 문서 본문 내보내기에는 `drive.meet.readonly`가 필요합니다.

### 생성 예시

```bash
openclaw googlemeet create
```

새 회의 URI, 소스 및 참여 세션을 출력합니다. OAuth를 사용하면 Meet API를 사용하고, 그렇지 않으면 고정된 Chrome Node의 로그인된 프로필을 사용합니다. 브라우저 폴백 JSON은 다음과 같습니다.

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

브라우저 폴백에서 먼저 Google 로그인 또는 Meet 권한 차단 문제가 발생하면 `google_meet`는 일반 문자열 대신 구조화된 세부 정보를 반환합니다.

```json
{
  "source": "browser",
  "error": "google-login-required: OpenClaw 브라우저 프로필에서 Google에 로그인한 후 회의 생성을 다시 시도하십시오.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "OpenClaw 브라우저 프로필에서 Google에 로그인한 후 회의 생성을 다시 시도하십시오.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

API 생성 JSON은 다음과 같습니다.

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

생성 시 기본적으로 참여하지만, Chrome/Chrome Node에서 브라우저를 통해 참여하려면 로그인된 Google 프로필이 여전히 필요합니다. 로그아웃된 경우 OpenClaw는 `manualActionRequired: true` 또는 브라우저 폴백 오류를 보고하고, 운영자에게 다시 시도하기 전에 Google 로그인을 완료하도록 요청합니다.

Cloud 프로젝트, OAuth 주체 및 회의 참가자가 Meet 미디어 API용 Google Workspace Developer Preview Program에 등록되어 있음을 확인한 후에만 `preview.enrollmentAcknowledged: true`를 설정하십시오.

## 구성

일반적인 Chrome 에이전트 경로에는 Plugin 활성화, BlackHole, SoX, 실시간 제공자 키 및 구성된 OpenClaw TTS 제공자만 필요합니다.

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

### 기본값

| 키                                | 기본값                                   | 참고                                                                                                                                                                                                              |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"`은 `"agent"`의 레거시 별칭으로 허용되지만, 새 호출자는 `"agent"`를 사용해야 합니다                                                                                                                    |
| `chromeNode.node`                 | 설정되지 않음                            | `chrome-node`의 Node ID/이름/IP입니다. 기능을 지원하는 Node가 둘 이상 연결될 수 있는 경우 필수입니다                                                                                                              |
| `chrome.launch`                   | `true`                                   | 참여할 때 Chrome을 실행합니다. 이미 열려 있는 세션을 재사용하는 경우에만 `false`로 설정하십시오                                                                                                                   |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | 로그아웃 상태의 Meet 게스트 화면에 표시됩니다                                                                                                                                                                     |
| `chrome.autoJoin`                 | `true`                                   | `chrome-node`에서 게스트 이름 입력과 Join Now 클릭을 최선의 방식으로 시도합니다                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | 중복 탭을 여는 대신 기존 Meet 탭을 활성화합니다                                                                                                                                                                   |
| `chrome.waitForInCallMs`          | `20000`                                  | 대화 시작 안내가 실행되기 전에 Meet 탭이 통화 중 상태를 보고할 때까지 기다립니다                                                                                                                                 |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | 명령 쌍 오디오 형식입니다. `"g711-ulaw-8khz"`는 전화 통신 오디오를 출력하는 레거시/사용자 지정 명령 쌍에만 사용합니다                                                                                              |
| `chrome.audioBufferBytes`         | `4096`                                   | 생성된 명령 쌍 오디오 명령의 SoX 처리 버퍼입니다(SoX 기본 8192바이트 버퍼의 절반으로, 파이프 지연 시간을 줄임). 값은 최소 17바이트로 제한됩니다                                                                    |
| `chrome.audioInputCommand`        | 생성된 SoX 명령                          | CoreAudio `BlackHole 2ch`에서 읽고 `chrome.audioFormat` 형식으로 오디오를 기록합니다                                                                                                                              |
| `chrome.audioOutputCommand`       | 생성된 SoX 명령                          | `chrome.audioFormat` 형식의 오디오를 읽고 CoreAudio `BlackHole 2ch`에 기록합니다                                                                                                                                  |
| `chrome.bargeInInputCommand`      | 설정되지 않음                            | 어시스턴트 재생 중 사람의 끼어들기를 감지하기 위해 부호 있는 16비트 리틀 엔디언 모노 PCM을 기록하는 선택적 로컬 마이크 명령입니다. Gateway에서 호스팅하는 명령 쌍 브리지에 적용됩니다                              |
| `chrome.bargeInRmsThreshold`      | `650`                                    | 사람의 끼어들기로 간주하는 RMS 수준입니다                                                                                                                                                                        |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | 사람의 끼어들기로 간주하는 피크 수준입니다                                                                                                                                                                       |
| `chrome.bargeInCooldownMs`        | `900`                                    | 반복되는 끼어들기 해제 사이의 최소 지연 시간입니다                                                                                                                                                               |
| `mode` (요청별)                   | `"agent"`                                | 대화 응답 모드입니다. [Agent 및 bidi 모드](#agent-and-bidi-modes) 표를 참조하십시오                                                                                                                              |
| `realtime.provider`               | `"openai"`                               | 아래의 범위 지정 필드가 설정되지 않았을 때 사용하는 호환성 폴백입니다                                                                                                                                            |
| `realtime.transcriptionProvider`  | `"openai"`                               | `agent` 모드에서 실시간 음성 전사에 사용하는 제공자 ID입니다                                                                                                                                                     |
| `realtime.voiceProvider`          | 설정되지 않음                            | `bidi` 모드에서 직접 실시간 음성에 사용하는 제공자 ID입니다. Agent 모드의 음성 전사는 OpenAI로 유지하면서 Gemini Live를 사용하려면 `"google"`로 설정하십시오. 특정 Gemini Live 모델을 선택하려면 `realtime.model`과 함께 사용하십시오. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | [Agent 및 bidi 모드](#agent-and-bidi-modes)를 참조하십시오                                                                                                                                                        |
| `realtime.instructions`           | 간결한 음성 응답 지침                    | 모델에 간결하게 말하고 더 자세한 답변에는 `openclaw_agent_consult`를 사용하도록 지시합니다                                                                                                                       |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | 실시간 브리지가 연결될 때 한 번 음성으로 출력됩니다. 조용히 참여하려면 `""`로 설정하십시오                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | `openclaw_agent_consult`에 사용하는 OpenClaw 에이전트 ID입니다                                                                                                                                                    |
| `voiceCall.enabled`               | `true`                                   | Twilio PSTN 통화, DTMF 및 시작 인사말을 Voice Call Plugin에 위임합니다                                                                                                                                            |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Twilio를 통해 PIN에서 파생된 DTMF 시퀀스를 재생하기 전의 초기 대기 시간입니다                                                                                                                                    |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Voice Call이 Twilio 구간을 시작한 후 실시간 시작 인사말을 요청하기 전의 지연 시간입니다                                                                                                                          |

`chrome.audioBridgeCommand`와 `chrome.audioBridgeHealthCommand`를 사용하면 외부 브리지가 `chrome.audioInputCommand`/`chrome.audioOutputCommand` 대신 전체 로컬 오디오 경로를 소유할 수 있습니다. 이를 사용할 수 있는 모드의 제약 조건은 [참고](#notes)를 참조하십시오.

레거시 `realtime.provider: "google"` 형태를 위한 `openclaw doctor --fix` 마이그레이션이 있습니다. 해당 필드가 아직 설정되지 않은 경우 그 의도를 `realtime.voiceProvider: "google"` 및 `realtime.transcriptionProvider: "openai"`로 이전합니다.

### 선택적 재정의

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
    model: "gemini-3.1-flash-live-preview",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        speakerVoice: "Kore",
      },
    },
  },
}
```

Agent 모드의 듣기와 말하기 모두에 ElevenLabs 사용:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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

지속적으로 사용하는 Meet 음성은 `messages.tts.providers.elevenlabs.speakerVoiceId`에서 가져옵니다. TTS 모델 재정의가 활성화된 경우 에이전트 응답에서 응답별 `[[tts:speakerVoiceId=... model=eleven_v3]]` 지시문도 사용할 수 있지만, 회의에서는 구성이 결정론적 기본값입니다. 참여 시 로그에 `transcriptionProvider=elevenlabs`가 표시되며, 각 음성 응답에는 `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`가 기록됩니다.

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

`voiceCall.enabled: true`(기본값)와 Twilio 전송 방식을 사용하면 Voice Call은 실시간 미디어 스트림을 열기 전에 DTMF 시퀀스를 전송한 다음 저장된 시작 문구를 초기 실시간 인사말로 사용합니다. `voice-call`이 활성화되지 않은 경우에도 Google Meet는 다이얼 플랜을 검증하고 기록할 수 있지만 Twilio 통화를 걸 수는 없습니다.

로컬의 신뢰할 수 있는 Gateway 런타임을 사용하려면 `voiceCall.gatewayUrl`을 설정하지 마십시오. 이렇게 하면 전체 통화 동안 호출한 에이전트가 유지됩니다. 구성된 Gateway URL은 명시적인 WebSocket 대상으로 유지되며 Plugin 출처를 인증할 수 없습니다. 기본값이 아닌 에이전트의 참여는 다른 에이전트를 조용히 사용하는 대신 안전하게 실패합니다. 에이전트별 라우팅이 필요하면 Google Meet와 Voice Call을 동일한 Gateway 프로세스에서 실행하십시오.

## 도구

에이전트는 `google_meet` 도구를 사용합니다.

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | 용도                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | 명시적인 Meet URL에 참여합니다                                                                    |
| `create`                | 공간을 생성하고 기본적으로 참여합니다. `accessType`/`entryPointAccess`를 지원합니다                |
| `status`                | 활성 세션을 나열하거나 `sessionId`로 하나를 검사합니다                                             |
| `setup_status`          | `googlemeet setup`과 동일한 검사를 실행합니다                                                      |
| `resolve_space`         | `spaces.get`을 통해 URL/코드/`spaces/{id}`를 확인합니다                                            |
| `preflight`             | OAuth 및 회의 확인 필수 조건을 검증합니다                                                          |
| `latest`                | 회의의 최신 회의 기록을 찾습니다                                                                   |
| `calendar_events`       | Meet 링크가 있는 Calendar 이벤트를 미리 봅니다                                                     |
| `artifacts`             | 회의 기록과 참가자/녹화/트랜스크립트/스마트 노트 메타데이터를 나열합니다                           |
| `attendance`            | 참가자와 참가자 세션을 나열합니다                                                                  |
| `export`                | 아티팩트/출석/트랜스크립트/매니페스트 번들을 작성합니다. 매니페스트만 생성하려면 `"dryRun": true`를 설정합니다 |
| `recover_current_tab`   | 새 탭을 열지 않고 기존 Meet 탭에 포커스를 맞추고 검사합니다                                        |
| `transcript`            | 범위가 제한된 자막 트랜스크립트를 읽습니다. `sinceIndex`는 이전 `nextIndex`부터 재개합니다          |
| `leave`                 | 세션을 종료합니다. Chrome은 나가기를 클릭하고 자신이 연 탭만 닫으며, Twilio는 전화를 끊습니다       |
| `end_active_conference` | API로 관리되는 공간의 활성 Google Meet 회의를 종료합니다                                           |
| `speak`                 | `sessionId`와 `message`를 지정하여 실시간 에이전트가 즉시 말하게 합니다                            |
| `test_speech`           | 세션을 생성하거나 재사용하고 알려진 문구를 실행한 후 Chrome 상태를 반환합니다                      |
| `test_listen`           | 관찰 전용 세션을 생성하거나 재사용하고 자막/트랜스크립트의 변화를 기다립니다                       |

`test_speech`는 항상 `mode: "agent"` 또는 `"bidi"`를 강제하며, `mode: "transcribe"`로 실행하도록 요청하면 실패합니다. 관찰 전용 세션은 음성을 출력할 수 없기 때문입니다. `speechOutputVerified` 결과는 해당 호출 중 실시간 오디오 출력 바이트가 증가했는지를 기준으로 하므로, 이전 오디오가 있는 재사용 세션은 새로운 검사로 인정되지 않습니다.

Chrome 전송 방식에서 `leave`는 Meet의 통화 나가기 버튼을 클릭한 후 재사용된 사용자 소유 탭을 열린 상태로 유지합니다. OpenClaw가 연 탭은 나간 후 닫힙니다.

Chrome이 Gateway 호스트에서 실행될 때는 `transport: "chrome"`을 사용하고, 페어링된 노드에서 실행될 때는 `transport: "chrome-node"`를 사용하십시오. 두 경우 모두 모델 제공자와 `openclaw_agent_consult`는 Gateway 호스트에서 실행되므로 모델 자격 증명은 해당 호스트에 유지됩니다. 에이전트 모드 로그에는 브리지 시작 시 확인된 트랜스크립션 제공자/모델이 포함되며, 합성된 각 응답 후에는 TTS 제공자/모델/음성/출력 형식/샘플 레이트가 포함됩니다. 원시 `mode: "realtime"`은 여전히 `mode: "agent"`의 레거시 호환성 별칭으로 허용되지만, 더 이상 도구의 `mode` 열거형에는 표시되지 않습니다.

API 기반 방과 명시적인 액세스 정책을 사용하는 `create`:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

알려진 방의 활성 회의 종료:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

회의를 사용할 수 있다고 판단하기 전에 수행하는 듣기 우선 검증:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

요청 시 말하기:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "정확히 다음과 같이 말하세요: 저는 여기 있고 듣고 있습니다."
}
```

`status`에는 사용 가능한 경우 Chrome 상태가 포함됩니다.

| 필드                                                                  | 의미                                                                                                                   |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome이 Meet 통화에 참여 중인 것으로 보입니다                                                                         |
| `micMuted`                                                            | 최선 추정 방식으로 확인한 Meet 마이크 상태입니다                                                                       |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | 음성이 작동하려면 브라우저 프로필에서 수동 로그인, Meet 호스트의 입장 승인, 권한 설정 또는 브라우저 제어 복구가 필요합니다 |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | 관리형 Chrome 음성이 현재 허용되는지 나타냅니다. `speechReady: false`는 OpenClaw가 소개/테스트 문구를 보내지 않았음을 의미합니다 |
| `providerConnected` / `realtimeReady`                                 | 실시간 음성 브리지 상태입니다                                                                                          |
| `lastInputAt` / `lastOutputAt`                                        | 브리지에서 마지막으로 수신하거나 브리지로 전송한 오디오 시각입니다                                                     |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Meet 탭의 미디어 출력이 브리지의 BlackHole 장치로 능동적으로 라우팅되었는지 나타냅니다                                 |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | 어시스턴트 재생이 활성화된 동안 무시된 루프백 입력입니다                                                               |

## 에이전트 및 bidi 모드

| 모드    | 답변을 결정하는 주체         | 음성 출력 경로                         | 사용 시점                                             |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | 구성된 OpenClaw 에이전트      | 일반 OpenClaw TTS 런타임               | "내 에이전트가 회의에 참여함" 동작을 원할 때          |
| `bidi`  | 실시간 음성 모델              | 실시간 음성 제공자의 오디오 응답       | 지연 시간이 가장 짧은 대화형 음성 루프를 원할 때      |

`agent` 모드: 실시간 트랜스크립션 제공자가 회의 오디오를 듣고, 참가자의 최종 트랜스크립트는 구성된 OpenClaw 에이전트를 통해 라우팅되며, 답변은 일반 OpenClaw TTS를 통해 음성으로 출력됩니다. 한 번의 발화가 오래된 부분 답변 여러 개를 생성하지 않도록 인접한 최종 트랜스크립트 조각은 상담 전에 병합됩니다. 대기 중인 어시스턴트 오디오가 계속 재생되는 동안에는 실시간 입력이 억제되며, BlackHole 루프백으로 인해 에이전트가 자신의 음성에 답하지 않도록 최근의 어시스턴트 유사 트랜스크립트 에코는 상담 전에 무시됩니다.

`bidi` 모드: 실시간 음성 모델이 직접 답변하며, 더 깊은 추론, 최신 정보 또는 일반 OpenClaw 도구를 위해 `openclaw_agent_consult`를 호출할 수 있습니다. 상담 도구는 최근 회의 트랜스크립트 컨텍스트와 함께 일반 OpenClaw 에이전트를 백그라운드에서 실행하고 간결한 음성용 답변을 반환합니다. `agent` 모드에서는 OpenClaw가 해당 답변을 TTS로 직접 보내고, `bidi` 모드에서는 실시간 음성 모델이 이를 다시 말할 수 있습니다. Voice Call과 동일한 공유 상담 메커니즘을 사용합니다.

기본적으로 상담은 `main` 에이전트를 대상으로 실행됩니다. Meet 레인을 전용 에이전트 워크스페이스, 모델 기본값, 도구 정책, 메모리 및 세션 기록으로 연결하려면 `realtime.agentId`를 설정하십시오. 에이전트 모드 상담은 회의별 `agent:<id>:subagent:google-meet:<session>` 세션 키를 사용하므로 후속 질문은 일반 에이전트 정책을 상속하면서 회의 컨텍스트를 유지합니다. 에이전트가 에이전트 모드에서 `google_meet`를 호출하면 상담 세션은 참가자의 발언에 답하기 전에 호출자의 현재 트랜스크립트를 포크합니다. Meet 세션은 별도로 유지되므로 회의 후속 대화가 호출자 트랜스크립트를 직접 변경하지 않습니다.

`realtime.toolPolicy`는 상담 실행을 제어합니다.

| 정책             | 동작                                                                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 상담 도구를 노출하고 일반 에이전트의 사용 도구를 `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get`으로 제한합니다 |
| `owner`          | 상담 도구를 노출하고 일반 에이전트가 자신의 일반 도구 정책을 사용하도록 허용합니다                                                  |
| `none`           | 실시간 음성 모델에 상담 도구를 노출하지 않습니다                                                                                    |

상담 세션 키는 Meet 세션별로 범위가 지정되므로 동일한 회의 중 후속 상담 호출은 이전 상담 컨텍스트를 재사용합니다.

Chrome이 완전히 참여한 후 음성 준비 상태 검사를 강제로 수행합니다.

```bash
openclaw googlemeet speak meet_... "정확히 다음과 같이 말하세요: 저는 여기 있고 듣고 있습니다."
```

전체 참여 및 말하기 스모크 테스트:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "정확히 다음과 같이 말하세요: 저는 여기 있고 듣고 있습니다."
```

## 라이브 테스트 체크리스트

무인 에이전트에게 회의를 맡기기 전에 다음을 실행하십시오.

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "정확히 다음과 같이 말하세요: Google Meet 음성 테스트가 완료되었습니다."
```

예상되는 Chrome-node 상태:

- `googlemeet setup`의 모든 항목이 정상이며, Chrome-node가 기본 전송 방식이거나 노드가 고정된 경우 `chrome-node-connected`가 포함됩니다.
- `nodes status`에는 선택한 노드가 연결된 것으로 표시되고 `googlemeet.chrome`과 `browser.proxy`가 모두 공시됩니다.
- Meet 탭이 회의에 참여하고 `test-speech`가 `inCall: true`를 포함한 Chrome 상태를 반환합니다.

Parallels macOS VM과 같은 원격 Chrome 호스트에서는 Gateway 또는 VM을 업데이트한 후 다음과 같이 가장 짧고 안전하게 검사할 수 있습니다.

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

이는 에이전트가 실제 회의 탭을 열기 전에 Gateway Plugin이 로드되었고, VM 노드가 현재 토큰으로 연결되었으며, Meet 오디오 브리지를 사용할 수 있음을 입증합니다.

Twilio 스모크 테스트에는 전화 접속 정보를 제공하는 회의를 사용하십시오.

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

예상되는 Twilio 상태:

- `googlemeet setup`에는 녹색 `twilio-voice-call-plugin`, `twilio-voice-call-credentials`, `twilio-voice-call-webhook` 검사가 포함됩니다.
- Gateway를 다시 로드하면 CLI에서 `voicecall`을 사용할 수 있습니다.
- 반환된 세션에는 `transport: "twilio"`와 `twilio.voiceCallId`가 있습니다.
- `openclaw logs --follow`에는 실시간 TwiML보다 먼저 DTMF TwiML이 제공되고, 이어서 초기 인사말이 대기열에 추가된 실시간 브리지가 표시됩니다.
- `googlemeet leave <sessionId>`는 위임된 음성 통화를 종료합니다.

## 문제 해결

### 에이전트에서 Google Meet 도구가 보이지 않음

Plugin이 활성화되어 있는지 확인하고 Gateway를 다시 로드하십시오. 실행 중인 에이전트에는 현재 Gateway 프로세스에서 등록한 Plugin 도구만 표시됩니다.

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

macOS가 아닌 Gateway 호스트에서도 `google_meet`는 계속 표시되지만, 로컬 Chrome 되말하기 작업은 오디오 브리지에 도달하기 전에 차단됩니다. 기본 로컬 Chrome 에이전트 경로 대신 `mode: "transcribe"`, Twilio 전화 접속 또는 macOS `chrome-node` 호스트를 사용하십시오.

### 연결된 Google Meet 지원 Node가 없음

Node 호스트에서 다음을 실행하십시오.

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gateway 호스트에서 다음을 실행하십시오.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Node가 연결되어 있고 `googlemeet.chrome` 및 `browser.proxy`가 나열되어야 하며, Gateway 구성에서 둘 다 허용해야 합니다.

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

`googlemeet setup`의 `chrome-node-connected` 검사가 실패하거나 Gateway 로그에 `gateway token mismatch`가 보고되면 현재 Gateway 토큰으로 Node를 다시 설치하거나 재시작하십시오.

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

그런 다음 Node 서비스를 다시 로드하고 다음을 다시 실행하십시오.

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### 브라우저는 열리지만 에이전트가 참여할 수 없음

관찰 전용 참여에는 `googlemeet test-listen`을, 실시간 참여에는 `googlemeet test-speech`를 실행한 다음 반환된 Chrome 상태를 확인하십시오. 둘 중 하나에서 `manualActionRequired: true`가 보고되면 운영자에게 `manualActionMessage`를 표시하고 브라우저 작업이 완료될 때까지 재시도를 중단하십시오.

일반적인 수동 작업은 다음과 같습니다. Chrome 프로필에 로그인하고, Meet 호스트 계정에서 게스트를 입장시키고, 네이티브 프롬프트가 표시되면 Chrome 마이크/카메라 권한을 부여하고, 멈춘 Meet 권한 대화 상자를 닫거나 복구하십시오.

Meet에서 "Do you want people to hear you in the meeting?"라고 묻는다는 이유만으로 "로그인되지 않음"이라고 보고하지 마십시오. 이는 Meet의 오디오 선택 중간 화면입니다. 가능한 경우 OpenClaw는 브라우저 자동화를 통해 **Use microphone**을 클릭하고 실제 회의 상태를 계속 기다립니다. URL 생성에는 실시간 오디오 경로가 필요하지 않으므로 생성 전용 브라우저 대체 경로에서는 대신 **Continue without microphone**을 클릭할 수 있습니다.

### 회의 생성 실패

OAuth가 구성된 경우 `googlemeet create`는 Meet API의 `spaces.create`를 사용하며, 그렇지 않으면 고정된 Chrome Node 브라우저를 사용합니다. 다음을 확인하십시오.

- **API 생성**: `oauth.clientId`와 `oauth.refreshToken` 또는 일치하는 `OPENCLAW_GOOGLE_MEET_*` 환경 변수가 있어야 하며, 생성 지원이 추가된 후에 새로 발급된 갱신 토큰이어야 합니다. 이전 토큰에는 `meetings.space.created`가 없을 수 있으므로 `openclaw googlemeet auth login --json`을 다시 실행하십시오.
- **브라우저 대체 경로**: `defaultTransport: "chrome-node"`와 `chromeNode.node`가 `browser.proxy` 및 `googlemeet.chrome`를 갖춘 연결된 Node를 가리켜야 합니다. 해당 Node의 OpenClaw Chrome 프로필이 로그인되어 있고 `https://meet.google.com/new`을 열 수 있어야 합니다.
- **브라우저 대체 경로 재시도**: 새 탭을 열기 전에 기존 `.../new` 탭 또는 Google 계정 프롬프트 탭을 재사용하십시오. 다른 탭을 수동으로 여는 대신 도구 호출을 재시도하십시오.
- **수동 작업**: 도구가 `manualActionRequired: true`를 반환하면 `browser.nodeId`, `browser.targetId`, `browserUrl`, `manualActionMessage`를 사용해 운영자를 안내하십시오. 반복해서 재시도하지 마십시오.
- **오디오 선택 중간 화면**: Meet에 "Do you want people to hear you in the meeting?"가 표시되면 탭을 열어 두십시오. OpenClaw는 **Use microphone** 또는 생성 전용인 경우 **Continue without microphone**을 클릭하고 생성된 URL을 계속 기다려야 합니다. 그렇게 할 수 없다면 오류에 `google-login-required`가 아니라 `meet-audio-choice-required`가 언급되어야 합니다.

### 에이전트가 참여하지만 말하지 않음

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

STT -> OpenClaw 에이전트 -> TTS 경로에는 `mode: "agent"`를 사용하고, 직접 실시간 음성 대체 경로에는 `mode: "bidi"`를 사용하십시오. `mode: "transcribe"`는 의도적으로 되말하기 브리지를 시작하지 않습니다. 관찰 전용 디버깅의 경우 참가자가 말한 후 `openclaw googlemeet status --json <session-id>`를 실행하고 `captioning`, `transcriptLines`, `lastCaptionText`를 확인하십시오. `inCall`이 true이지만 `transcriptLines`가 계속 `0`이면 Meet 자막이 비활성화되었거나, 관찰자가 설치된 이후 아무도 말하지 않았거나, Meet UI가 변경되었거나, 회의 언어/계정에서 실시간 자막을 사용할 수 없는 것일 수 있습니다.

`googlemeet test-speech`는 항상 실시간 경로를 검사하고 해당 호출에서 브리지 출력 바이트가 관찰되었는지 보고합니다. `speechOutputVerified`가 false이고 `speechOutputTimedOut`이 true이면 실시간 제공자가 발화를 수락했을 수 있지만 OpenClaw에서는 새 출력 바이트가 Chrome 오디오 브리지에 도달하는 것을 확인하지 못한 것입니다.

또한 다음을 확인하십시오. 실시간 제공자 키(`OPENAI_API_KEY` 또는 `GEMINI_API_KEY`)를 Gateway 호스트에서 사용할 수 있어야 하고, Chrome 호스트에 `BlackHole 2ch`가 표시되어야 하며, 그곳에 `sox`가 있어야 합니다. Meet 마이크/스피커는 가상 오디오 경로를 통해 라우팅되어야 합니다. 로컬 Chrome 실시간 참여의 경우 `doctor`에 `meet output routed: yes`가 표시되어야 합니다.

`googlemeet doctor [session-id]`는 세션, Node, 통화 중 상태, 수동 작업 사유, 실시간 제공자 연결, `realtimeReady`, 오디오 입력/출력 활동, 마지막 오디오 타임스탬프, 바이트 카운터, 브라우저 URL을 출력합니다. 원시 JSON에는 `googlemeet status [session-id] --json`을 사용하고, 토큰을 노출하지 않고 OAuth 갱신을 확인하려면 `googlemeet doctor --oauth`를 사용하십시오. 회의를 확인하려면 `--meeting` 또는 `--create-space`를 추가하십시오.

에이전트의 시간이 초과되었고 Meet 탭이 이미 열려 있다면 다른 탭을 열지 않고 확인하십시오.

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

동등한 도구 작업은 `recover_current_tab`입니다. 선택한 전송 방식에 맞춰 기존 Meet 탭에 포커스를 맞추고 검사하며, `chrome`에는 로컬 브라우저 제어를, `chrome-node`에는 구성된 Node를 사용합니다. 새 탭이나 세션을 열지 않고 현재 차단 요인(로그인, 입장 승인, 권한, 오디오 선택 상태)을 보고합니다. CLI 명령은 실행 중이어야 하는 구성된 Gateway와 통신하며, `chrome-node`를 사용하려면 Node도 연결되어 있어야 합니다.

### Twilio 설정 검사 실패

`voice-call`이 허용되지 않았거나 활성화되지 않은 경우 `twilio-voice-call-plugin` 검사가 실패합니다. `plugins.allow`에 추가하고 `plugins.entries.voice-call`을 활성화한 다음 Gateway를 다시 로드하십시오.

Twilio 백엔드에 계정 SID, 인증 토큰 또는 발신자 번호가 없으면 `twilio-voice-call-credentials` 검사가 실패합니다.

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`voice-call`에 공개 Webhook 노출이 없거나 `publicUrl`이 루프백/사설 네트워크 공간을 가리키면 `twilio-voice-call-webhook` 검사가 실패합니다. 통신사 콜백은 해당 주소에 접근할 수 없으므로 `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8`을 `publicUrl`로 사용하지 마십시오. `plugins.entries.voice-call.config.publicUrl`을 공개 URL로 설정하거나 터널/Tailscale 노출을 구성하십시오.

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

로컬 개발에서는 사설 호스트 URL 대신 터널 또는 Tailscale 노출을 사용하십시오.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // 또는
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Gateway를 재시작하거나 다시 로드한 다음 다음을 실행하십시오.

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

기본적으로 `voicecall smoke`는 준비 상태만 확인합니다. 특정 번호에 대해 드라이런을 수행하십시오.

```bash
openclaw voicecall smoke --to "+15555550123"
```

실제 발신 통화를 의도적으로 걸 때만 `--yes`를 추가하십시오.

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio 통화가 시작되지만 회의에 입장하지 못함

Meet 이벤트에서 전화 접속 세부 정보를 제공하는지 확인하고 정확한 접속 번호와 PIN 또는 사용자 지정 DTMF 시퀀스를 전달하십시오.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

PIN 입력 전에 일시 중지하려면 `--dtmf-sequence`의 시작 부분에 `w` 또는 쉼표를 사용하십시오.

통화가 생성되었지만 Meet 참가자 명단에 전화 접속 참가자가 표시되지 않는 경우 다음을 확인하십시오.

- `openclaw googlemeet doctor <session-id>`: 위임된 Twilio 통화 ID, DTMF가 대기열에 추가되었는지, 도입 인사말이 요청되었는지 확인하십시오.
- `openclaw voicecall status --call-id <id>`: 통화가 아직 활성 상태인지 확인하십시오.
- `openclaw voicecall tail`: Twilio Webhook이 Gateway에 도착하는지 확인하십시오.
- `openclaw logs --follow`: Twilio Meet 시퀀스를 확인하십시오. Google Meet가 참여를 위임하고, Voice Call이 연결 전 DTMF TwiML을 저장하고 제공하며, Voice Call이 Twilio 통화에 실시간 TwiML을 제공한 다음 Google Meet가 `voicecall.speak`를 사용해 도입 음성을 요청합니다.
- `openclaw googlemeet setup --transport twilio`를 다시 실행하십시오. 녹색 설정 검사는 필수이지만 회의 PIN 시퀀스가 올바른지는 입증하지 않습니다.
- 전화 접속 번호가 PIN과 동일한 Meet 초대 및 지역에 속하는지 확인하십시오.
- Meet의 응답이 느리거나 연결 전 DTMF를 전송한 후에도 통화 기록에 PIN 프롬프트가 계속 표시되면 `voiceCall.dtmfDelayMs`를 기본값인 12초보다 늘리십시오.
- 참가자가 입장했지만 인사말이 들리지 않으면 `openclaw logs --follow`에서 DTMF 이후의 `voicecall.speak` 요청과 미디어 스트림 TTS 재생 또는 Twilio `<Say>` 대체 경로를 확인하십시오. 기록에 계속 "enter the meeting PIN"이 표시된다면 전화 연결 구간이 아직 Meet 회의실에 입장하지 않은 것이므로 참가자에게 음성이 들리지 않습니다.

Webhook이 도착하지 않으면 먼저 Voice Call Plugin을 디버깅하십시오. 제공자가 `plugins.entries.voice-call.config.publicUrl` 또는 구성된 터널에 접근할 수 있어야 합니다. [음성 통화 문제 해결](/ko/plugins/voice-call#troubleshooting)을 참조하십시오.

## 참고

Google Meet의 공식 미디어 API는 수신 중심이므로 통화에서 말하려면 여전히 참가자 경로가 필요합니다. 이 Plugin은 해당 경계를 명확히 유지합니다. Chrome은 브라우저 참여와 로컬 오디오 라우팅을 처리하고, Twilio는 전화 접속 참여를 처리합니다.

Chrome 되말하기 모드에는 `BlackHole 2ch`와 다음 중 하나가 필요합니다.

- `chrome.audioInputCommand`와 `chrome.audioOutputCommand`: OpenClaw가 브리지를 소유하고 선택한 제공자와 해당 명령 사이에서 `chrome.audioFormat` 형식으로 오디오를 파이프합니다. `agent` 모드는 실시간 음성 인식과 일반 TTS를 사용하고, `bidi` 모드는 실시간 음성 제공자를 사용합니다. 기본 경로는 `chrome.audioBufferBytes: 4096`을 사용하는 24 kHz PCM16이며, 레거시 명령 쌍에는 8 kHz G.711 mu-law도 계속 사용할 수 있습니다.
- `chrome.audioBridgeCommand`: 외부 브리지 명령이 전체 로컬 오디오 경로를 소유하며 데몬을 시작하거나 검증한 후 종료되어야 합니다. `agent` 모드에는 TTS를 위한 명령 쌍 직접 접근이 필요하므로 `bidi`에서만 유효합니다.

명령 쌍 Chrome 브리지를 사용하면 `chrome.bargeInInputCommand`가 별도의 로컬 마이크를 수신하고 사람이 말하기 시작할 때 어시스턴트 재생을 중지할 수 있으므로, 어시스턴트 재생 중 공유 BlackHole 루프백 입력이 일시적으로 억제되더라도 사람의 음성이 어시스턴트 출력보다 우선합니다. `chrome.audioInputCommand`/`chrome.audioOutputCommand`와 마찬가지로 운영자가 구성하는 로컬 명령입니다. 신뢰할 수 있는 명시적 명령 경로나 인수 목록을 사용하고, 신뢰할 수 없는 위치의 스크립트는 절대 사용하지 마십시오.

깨끗한 양방향 오디오를 위해 Meet 출력과 Meet 마이크를 별도의 가상 장치 또는 Loopback 방식의 가상 장치 그래프를 통해 라우팅하십시오. 하나의 공유 BlackHole 장치를 사용하면 다른 참가자의 음성이 통화로 다시 에코될 수 있습니다.

`googlemeet speak`는 Chrome 세션의 활성 응답 오디오 브리지를 시작하고, `googlemeet leave`는 이를 중지합니다(Voice Call을 통해 위임된 Twilio 세션의 경우 기본 통화도 종료합니다). API로 관리되는 공간의 활성 Google Meet 회의도 닫으려면 `googlemeet end-active-conference`를 사용하십시오.

## 관련 항목

- [음성 통화 Plugin](/ko/plugins/voice-call)
- [대화 모드](/ko/nodes/talk)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
