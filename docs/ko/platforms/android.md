---
read_when:
    - Android Node 페어링 또는 재연결하기
    - Android gateway 검색 또는 인증 디버깅하기
    - 클라이언트 간 채팅 기록 일치 여부 확인하기
summary: 'Android 앱(node): 연결 런북 + Connect/Chat/Voice/Canvas 명령 표면'
title: Android 앱
x-i18n:
    generated_at: "2026-04-25T06:04:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 789de91275a11e63878ba670b9f316538d6b4731c22ec491b2c802f1cd14dcec
    source_path: platforms/android.md
    workflow: 15
---

> **참고:** Android 앱은 아직 공개 릴리스되지 않았습니다. 소스 코드는 [OpenClaw repository](https://github.com/openclaw/openclaw)의 `apps/android` 아래에서 확인할 수 있습니다. Java 17과 Android SDK를 사용해 직접 빌드할 수 있습니다(`./gradlew :app:assemblePlayDebug`). 빌드 지침은 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)를 참고하세요.

## 지원 현황 요약

- 역할: companion Node 앱(Android는 Gateway를 호스팅하지 않음)
- Gateway 필요 여부: 예(macOS, Linux 또는 WSL2를 통한 Windows에서 실행)
- 설치: [Getting Started](/ko/start/getting-started) + [Pairing](/ko/channels/pairing)
- Gateway: [Runbook](/ko/gateway) + [Configuration](/ko/gateway/configuration)
  - 프로토콜: [Gateway protocol](/ko/gateway/protocol) (Node + control plane)

## 시스템 제어

시스템 제어(`launchd`/`systemd`)는 Gateway 호스트에 있습니다. 자세한 내용은 [Gateway](/ko/gateway)를 참고하세요.

## 연결 런북

Android Node 앱 ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android는 Gateway WebSocket에 직접 연결하며 device pairing(`role: node`)을 사용합니다.

Tailscale 또는 공용 호스트의 경우 Android는 보안 엔드포인트가 필요합니다.

- 권장: `https://<magicdns>` / `wss://<magicdns>`를 사용하는 Tailscale Serve / Funnel
- 지원됨: 실제 TLS 엔드포인트가 있는 기타 모든 `wss://` Gateway URL
- 평문 `ws://`는 비공개 LAN 주소 / `.local` 호스트, 그리고 `localhost`, `127.0.0.1`, Android 에뮬레이터 브리지(`10.0.2.2`)에서 계속 지원됨

### 사전 준비

- “master” 머신에서 Gateway를 실행할 수 있어야 합니다.
- Android device/에뮬레이터가 gateway WebSocket에 연결할 수 있어야 합니다:
  - mDNS/NSD가 가능한 같은 LAN, **또는**
  - Wide-Area Bonjour / unicast DNS-SD를 사용하는 같은 Tailscale tailnet(아래 참고), **또는**
  - 수동 gateway host/port(대체 수단)
- tailnet/공용 모바일 페어링은 원시 tailnet IP `ws://` 엔드포인트를 사용하지 않습니다. 대신 Tailscale Serve 또는 다른 `wss://` URL을 사용하세요.
- gateway 머신에서 CLI(`openclaw`)를 실행할 수 있어야 합니다(또는 SSH를 통해).

### 1) Gateway 시작

```bash
openclaw gateway --port 18789 --verbose
```

로그에서 다음과 같은 내용을 확인하세요.

- `listening on ws://0.0.0.0:18789`

Tailscale을 통한 원격 Android 접근에는 원시 tailnet 바인드 대신 Serve/Funnel을 권장합니다.

```bash
openclaw gateway --tailscale serve
```

이렇게 하면 Android에 보안 `wss://` / `https://` 엔드포인트가 제공됩니다. 일반적인 `gateway.bind: "tailnet"` 설정만으로는 TLS를 별도로 종료하지 않는 한 최초 원격 Android 페어링에 충분하지 않습니다.

### 2) 검색 확인(선택 사항)

gateway 머신에서:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

추가 디버깅 참고: [Bonjour](/ko/gateway/bonjour)

wide-area 검색 도메인도 구성한 경우 다음과 비교하세요.

```bash
openclaw gateway discover --json
```

이 명령은 `local.`과 구성된 wide-area 도메인을 한 번에 표시하며, TXT 전용 힌트 대신 확인된
서비스 엔드포인트를 사용합니다.

#### tailnet(Vienna ⇄ London) 검색 via unicast DNS-SD

Android NSD/mDNS 검색은 네트워크를 넘지 못합니다. Android Node와 gateway가 서로 다른 네트워크에 있지만 Tailscale로 연결되어 있다면 Wide-Area Bonjour / unicast DNS-SD를 대신 사용하세요.

검색만으로는 tailnet/공용 Android 페어링에 충분하지 않습니다. 검색된 경로도 여전히 보안 엔드포인트(`wss://` 또는 Tailscale Serve)가 필요합니다.

1. gateway 호스트에 DNS-SD zone(예: `openclaw.internal.`)을 설정하고 `_openclaw-gw._tcp` 레코드를 게시합니다.
2. 선택한 도메인에 대해 해당 DNS 서버를 가리키는 Tailscale split DNS를 구성합니다.

세부 사항과 CoreDNS 예시는 [Bonjour](/ko/gateway/bonjour)를 참고하세요.

### 3) Android에서 연결

Android 앱에서:

- 앱은 **foreground service**(지속 알림)를 통해 gateway 연결을 유지합니다.
- **Connect** 탭을 엽니다.
- **Setup Code** 또는 **Manual** 모드를 사용합니다.
- 검색이 차단된 경우 **Advanced controls**에서 수동 host/port를 사용합니다. 비공개 LAN 호스트의 경우 `ws://`를 계속 사용할 수 있습니다. Tailscale/공용 호스트의 경우 TLS를 켜고 `wss://` / Tailscale Serve 엔드포인트를 사용하세요.

처음 pairing이 성공하면 Android는 실행 시 자동으로 다시 연결합니다.

- 수동 엔드포인트(활성화된 경우), 그렇지 않으면
- 마지막으로 검색된 gateway(best-effort)

### 4) pairing 승인(CLI)

gateway 머신에서:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

pairing 세부 사항: [Pairing](/ko/channels/pairing)

선택 사항: Android Node가 항상 엄격히 제어된 서브넷에서 연결된다면,
명시적 CIDR 또는 정확한 IP를 사용해 최초 Node 자동 승인을 opt-in할 수 있습니다.

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

이 기능은 기본적으로 비활성화되어 있습니다. 이는 요청된 범위가 없는
새 `role: node` pairing에만 적용됩니다. 운영자/browser pairing 및 모든 역할, 범위, 메타데이터 또는
공개 키 변경은 여전히 수동 승인이 필요합니다.

### 5) Node가 연결되었는지 확인

- Node 상태를 통해:

  ```bash
  openclaw nodes status
  ```

- Gateway를 통해:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 채팅 + 기록

Android Chat 탭은 세션 선택(기본 `main`, 그리고 다른 기존 세션들)을 지원합니다.

- 기록: `chat.history`(표시용으로 정규화됨; 인라인 directive 태그는
  보이는 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML payload(예:
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 그리고
  잘린 도구 호출 블록)와 유출된 ASCII/전각 모델 제어 token은 제거되며,
  정확히 `NO_REPLY` / `no_reply`인 순수 silent-token assistant 행은 생략되고, 과도하게 큰 행은 placeholder로 대체될 수 있음)
- 전송: `chat.send`
- push 업데이트(best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + 카메라

#### Gateway Canvas Host(웹 콘텐츠에 권장)

Node가 에이전트가 디스크에서 편집할 수 있는 실제 HTML/CSS/JS를 표시하게 하려면 Node가 Gateway canvas host를 가리키도록 설정하세요.

참고: Node는 Gateway HTTP 서버(`gateway.port`와 같은 포트, 기본값 `18789`)에서 canvas를 로드합니다.

1. gateway 호스트에 `~/.openclaw/workspace/canvas/index.html`을 만듭니다.

2. Node를 해당 위치로 이동시킵니다(LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

tailnet(선택 사항): 두 device가 모두 Tailscale에 있다면 `.local` 대신 MagicDNS 이름 또는 tailnet IP를 사용하세요. 예: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

이 서버는 HTML에 live-reload 클라이언트를 주입하고 파일 변경 시 다시 로드합니다.
A2UI 호스트는 `http://<gateway-host>:18789/__openclaw__/a2ui/`에 있습니다.

Canvas 명령(포그라운드 전용):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate`(기본 scaffold로 돌아가려면 `{"url":""}` 또는 `{"url":"/"}` 사용). `canvas.snapshot`은 `{ format, base64 }`를 반환합니다(기본 `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset`(`canvas.a2ui.pushJSONL`은 레거시 alias)

카메라 명령(포그라운드 전용, 권한 필요):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

파라미터 및 CLI helper는 [Camera node](/ko/nodes/camera)를 참고하세요.

### 8) Voice + 확장된 Android 명령 표면

- Voice: Android는 Voice 탭에서 단일 마이크 on/off 흐름을 사용하며 transcript 캡처와 `talk.speak` 재생을 지원합니다. `talk.speak`를 사용할 수 없을 때만 로컬 시스템 TTS가 사용됩니다. 앱이 포그라운드를 벗어나면 Voice는 중지됩니다.
- Voice wake/talk-mode 토글은 현재 Android UX/런타임에서 제거되었습니다.
- 추가 Android 명령 계열(사용 가능 여부는 device + 권한에 따라 다름):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`(아래 [Notification forwarding](#notification-forwarding) 참고)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant 진입점

Android는 시스템 assistant 트리거(Google
Assistant)를 통해 OpenClaw 실행을 지원합니다. 구성되면 홈 버튼을 길게 누르거나 "Hey Google, ask
OpenClaw..."라고 말했을 때 앱이 열리고 프롬프트가 채팅 입력기로 전달됩니다.

이는 앱 manifest에 선언된 Android **App Actions** 메타데이터를 사용합니다. gateway 측에는
추가 구성이 필요하지 않습니다. assistant intent는 전적으로 Android 앱에서 처리된 뒤 일반 채팅 메시지로 전달됩니다.

<Note>
App Actions 사용 가능 여부는 device, Google Play Services 버전,
그리고 사용자가 OpenClaw를 기본 assistant 앱으로 설정했는지에 따라 달라집니다.
</Note>

## 알림 전달

Android는 device 알림을 event로 gateway에 전달할 수 있습니다. 어떤 알림을 언제 전달할지 범위를 정할 수 있도록 여러 제어 항목이 제공됩니다.

| 키                               | 유형           | 설명                                                                                             |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `notifications.allowPackages`    | string[]       | 이 패키지 이름의 알림만 전달합니다. 설정되면 다른 모든 패키지는 무시됩니다.                      |
| `notifications.denyPackages`     | string[]       | 이 패키지 이름의 알림은 절대 전달하지 않습니다. `allowPackages` 적용 후 적용됩니다.              |
| `notifications.quietHours.start` | string (HH:mm) | quiet hours 창의 시작 시각(로컬 device 시간). 이 시간대에는 알림 전달이 억제됩니다.             |
| `notifications.quietHours.end`   | string (HH:mm) | quiet hours 창의 종료 시각.                                                                      |
| `notifications.rateLimit`        | number         | 패키지별 분당 최대 전달 알림 수입니다. 초과 알림은 삭제됩니다.                                   |

알림 선택기는 전달된 알림 event에 대해 더 안전한 동작도 사용하여 민감한 시스템 알림이 실수로 전달되는 것을 방지합니다.

구성 예시:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
알림 전달에는 Android Notification Listener 권한이 필요합니다. 앱은 설정 중 이 권한을 요청합니다.
</Note>

## 관련

- [iOS app](/ko/platforms/ios)
- [Nodes](/ko/nodes)
- [Android node troubleshooting](/ko/nodes/troubleshooting)
