---
read_when:
    - Android node 페어링 또는 다시 연결하기
    - Android gateway 검색 또는 인증 디버깅하기
    - 클라이언트 간 채팅 기록 일치 여부 확인하기
summary: 'Android 앱(node): 연결 런북 + Connect/Chat/Voice/Canvas 명령 표면'
title: Android 앱
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:34:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **참고:** Android 앱은 아직 공개적으로 출시되지 않았습니다. 소스 코드는 [OpenClaw repository](https://github.com/openclaw/openclaw)의 `apps/android` 아래에서 확인할 수 있습니다. Java 17과 Android SDK를 사용해 직접 빌드할 수 있습니다(`./gradlew :app:assemblePlayDebug`). 빌드 지침은 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)를 참조하세요.

## 지원 스냅샷

- 역할: companion node 앱(Android는 Gateway를 호스팅하지 않음)
- Gateway 필요 여부: 예(macOS, Linux 또는 Windows via WSL2에서 실행)
- 설치: [Getting Started](/ko/start/getting-started) + [Pairing](/ko/channels/pairing)
- Gateway: [Runbook](/ko/gateway) + [Configuration](/ko/gateway/configuration)
  - 프로토콜: [Gateway protocol](/ko/gateway/protocol) (node + control plane)

## 시스템 제어

시스템 제어(launchd/systemd)는 Gateway 호스트에 있습니다. [Gateway](/ko/gateway)를 참조하세요.

## 연결 런북

Android node 앱 ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android는 Gateway WebSocket에 직접 연결하고 device pairing(`role: node`)을 사용합니다.

Tailscale 또는 공개 호스트의 경우 Android에는 보안 엔드포인트가 필요합니다:

- 권장: `https://<magicdns>` / `wss://<magicdns>`를 사용하는 Tailscale Serve / Funnel
- 지원됨: 실제 TLS 엔드포인트가 있는 다른 모든 `wss://` Gateway URL
- 평문 `ws://`는 사설 LAN 주소 / `.local` 호스트, 그리고 `localhost`, `127.0.0.1`, Android 에뮬레이터 브리지(`10.0.2.2`)에서 계속 지원됩니다

### 사전 준비

- “마스터” 머신에서 Gateway를 실행할 수 있어야 합니다.
- Android 디바이스/에뮬레이터가 gateway WebSocket에 도달할 수 있어야 합니다:
  - mDNS/NSD가 있는 동일 LAN, **또는**
  - Wide-Area Bonjour / unicast DNS-SD를 사용하는 동일 Tailscale tailnet(아래 참조), **또는**
  - 수동 gateway host/port(폴백)
- tailnet/공개 모바일 pairing은 raw tailnet IP `ws://` 엔드포인트를 사용하지 **않습니다**. 대신 Tailscale Serve 또는 다른 `wss://` URL을 사용하세요.
- gateway 머신에서 CLI(`openclaw`)를 실행할 수 있어야 합니다(또는 SSH를 통해).

### 1) Gateway 시작

```bash
openclaw gateway --port 18789 --verbose
```

로그에서 다음과 같은 항목이 보이는지 확인하세요:

- `listening on ws://0.0.0.0:18789`

Tailscale을 통한 원격 Android 액세스에는 raw tailnet 바인드 대신 Serve/Funnel을 권장합니다:

```bash
openclaw gateway --tailscale serve
```

이렇게 하면 Android에 안전한 `wss://` / `https://` 엔드포인트가 제공됩니다. 단순한 `gateway.bind: "tailnet"` 설정만으로는 TLS를 별도로 종료하지 않는 한 첫 원격 Android pairing에 충분하지 않습니다.

### 2) 검색 확인(선택 사항)

gateway 머신에서:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

추가 디버깅 참고 사항: [Bonjour](/ko/gateway/bonjour).

광역 검색 도메인도 구성했다면 다음과 비교하세요:

```bash
openclaw gateway discover --json
```

이 명령은 한 번에 `local.`과 구성된 광역 도메인을 모두 표시하고 TXT 전용 힌트 대신 확인된 서비스 엔드포인트를 사용합니다.

#### unicast DNS-SD를 통한 tailnet(Vienna ⇄ London) 검색

Android NSD/mDNS 검색은 네트워크를 넘지 못합니다. Android node와 gateway가 서로 다른 네트워크에 있지만 Tailscale을 통해 연결되어 있다면 Wide-Area Bonjour / unicast DNS-SD를 대신 사용하세요.

검색만으로는 tailnet/공개 Android pairing에 충분하지 않습니다. 검색된 경로도 여전히 안전한 엔드포인트(`wss://` 또는 Tailscale Serve)가 필요합니다:

1. gateway 호스트에 DNS-SD 영역(예: `openclaw.internal.`)을 설정하고 `_openclaw-gw._tcp` 레코드를 게시합니다.
2. 해당 DNS 서버를 가리키도록 선택한 도메인에 대한 Tailscale split DNS를 구성합니다.

자세한 내용과 CoreDNS 예시 config: [Bonjour](/ko/gateway/bonjour).

### 3) Android에서 연결

Android 앱에서:

- 앱은 **포그라운드 서비스**(지속 알림)를 통해 gateway 연결을 유지합니다.
- **Connect** 탭을 엽니다.
- **Setup Code** 또는 **Manual** 모드를 사용합니다.
- 검색이 막혀 있으면 **Advanced controls**에서 수동 host/port를 사용하세요. 사설 LAN 호스트의 경우 `ws://`가 여전히 동작합니다. Tailscale/공개 호스트의 경우 TLS를 켜고 `wss://` / Tailscale Serve 엔드포인트를 사용하세요.

첫 pairing이 성공하면 Android는 시작 시 자동으로 다시 연결합니다:

- 수동 엔드포인트(활성화된 경우), 그렇지 않으면
- 마지막으로 검색된 gateway(best-effort)

### 4) pairing 승인(CLI)

gateway 머신에서:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

pairing 세부 정보: [Pairing](/ko/channels/pairing).

선택 사항: Android node가 항상 엄격하게 제어된 서브넷에서 연결된다면,
명시적인 CIDR 또는 정확한 IP로 최초 node 자동 승인을 opt-in할 수 있습니다:

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

이는 기본적으로 비활성화되어 있습니다. 요청된 scope가 없는 새 `role: node` pairing에만 적용됩니다. 운영자/브라우저 pairing과 모든 role, scope, metadata, 공개 키 변경에는 여전히 수동 승인이 필요합니다.

### 5) node 연결 확인

- node 상태를 통해:

  ```bash
  openclaw nodes status
  ```

- Gateway를 통해:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 채팅 + 기록

Android Chat 탭은 세션 선택을 지원합니다(기본 `main` 및 다른 기존 세션 포함):

- 기록: `chat.history` (표시용으로 정규화됨. 인라인 directive 태그는 표시 텍스트에서 제거되고, 일반 텍스트 tool-call XML payload(``<tool_call>...</tool_call>``, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 tool-call 블록 포함) 및 유출된 ASCII/전각 model 제어 토큰은 제거되며, 정확한 `NO_REPLY` /
  `no_reply` 같은 순수 silent-token assistant 행은 생략되고, 과도하게 큰 행은 placeholder로 대체될 수 있음)
- 전송: `chat.send`
- 푸시 업데이트(best-effort): `chat.subscribe` → `event:"chat"`

### 7) Canvas + 카메라

#### Gateway Canvas Host(웹 콘텐츠용 권장)

node가 에이전트가 디스크에서 편집할 수 있는 실제 HTML/CSS/JS를 표시하게 하려면, node를 Gateway canvas host에 연결하세요.

참고: node는 Gateway HTTP 서버에서 canvas를 로드합니다(포트는 `gateway.port`와 같으며 기본값은 `18789`).

1. gateway 호스트에 `~/.openclaw/workspace/canvas/index.html`을 만듭니다.

2. node를 해당 위치로 이동시킵니다(LAN):
__OC_I18N_900008__
tailnet(선택 사항): 두 디바이스가 모두 Tailscale에 있다면 `.local` 대신 MagicDNS 이름 또는 tailnet IP를 사용하세요. 예: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

이 서버는 HTML에 live-reload 클라이언트를 주입하고 파일이 바뀌면 다시 로드합니다.
A2UI 호스트는 `http://<gateway-host>:18789/__openclaw__/a2ui/`에 있습니다.

Canvas 명령(포그라운드 전용):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (`{"url":""}` 또는 `{"url":"/"}`를 사용하면 기본 scaffold로 돌아감). `canvas.snapshot`은 `{ format, base64 }`를 반환합니다(기본 `format="jpeg"`).

- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL`은 레거시 별칭)

카메라 명령(포그라운드 전용, 권한 게이트 적용):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

매개변수와 CLI 도우미는 [Camera node](/nodes/camera)를 참조하세요.

### 8) Voice + 확장된 Android 명령 표면

- Voice 탭: Android에는 두 가지 명시적인 캡처 모드가 있습니다. **Mic**은 수동 Voice 탭 세션으로, 각 멈춤 구간을 채팅 턴으로 전송하며 앱이 포그라운드를 벗어나거나 사용자가 Voice 탭을 떠나면 중지됩니다. **Talk**는 연속 Talk Mode이며 토글을 끄거나 node 연결이 끊길 때까지 계속 듣습니다.
- Talk Mode는 캡처를 시작하기 전에 기존 포그라운드 서비스를 `dataSync`에서 `dataSync|microphone`으로 승격하고, Talk Mode가 중지되면 다시 낮춥니다. Android 14+는 `FOREGROUND_SERVICE_MICROPHONE` 선언, `RECORD_AUDIO` 런타임 권한, 런타임 시 마이크 서비스 유형이 필요합니다.
- 음성 응답은 구성된 gateway Talk provider를 통해 `talk.speak`를 사용합니다. `talk.speak`를 사용할 수 없을 때만 로컬 시스템 TTS를 사용합니다.
- 음성 깨우기는 Android UX/런타임에서는 계속 비활성화되어 있습니다.
- 추가 Android 명령 계열(사용 가능 여부는 디바이스 + 권한에 따라 다름):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (아래 [알림 포워딩](#notification-forwarding) 참조)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant 진입점

Android는 시스템 assistant 트리거(Google
Assistant)로 OpenClaw를 실행하는 것을 지원합니다. 구성되면 홈 버튼을 길게 누르거나 "Hey Google, ask
OpenClaw..."라고 말했을 때 앱이 열리고 프롬프트가 채팅 작성기에 전달됩니다.

이 기능은 앱 manifest에 선언된 Android **App Actions** 메타데이터를 사용합니다. gateway 측에서 추가 구성은 필요 없습니다. assistant intent는 전적으로 Android 앱에서 처리되어 일반 채팅 메시지로 전달됩니다.

<Note>
App Actions 사용 가능 여부는 디바이스, Google Play Services 버전, 사용자가 OpenClaw를 기본 assistant 앱으로 설정했는지에 따라 달라집니다.
</Note>

## 알림 포워딩

Android는 디바이스 알림을 이벤트로 gateway에 포워딩할 수 있습니다. 여러 제어 항목을 통해 어떤 알림을 언제 포워딩할지 범위를 지정할 수 있습니다.

| 키 | 타입 | 설명 |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 이 패키지 이름의 알림만 포워딩합니다. 설정되면 다른 모든 패키지는 무시됩니다. |
| `notifications.denyPackages`     | string[]       | 이 패키지 이름의 알림은 절대 포워딩하지 않습니다. `allowPackages` 이후 적용됩니다. |
| `notifications.quietHours.start` | string (HH:mm) | quiet hours 창의 시작입니다(로컬 디바이스 시간). 이 창 동안 알림은 억제됩니다. |
| `notifications.quietHours.end`   | string (HH:mm) | quiet hours 창의 종료입니다. |
| `notifications.rateLimit`        | number         | 패키지당 분당 최대 포워딩 알림 수입니다. 초과 알림은 폐기됩니다. |

알림 선택기도 포워딩된 알림 이벤트에 대해 더 안전한 동작을 사용하여 민감한 시스템 알림이 실수로 포워딩되는 것을 방지합니다.

예시 config:

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
알림 포워딩에는 Android Notification Listener 권한이 필요합니다. 앱은 설정 중 이에 대해 프롬프트를 표시합니다.
</Note>

## 관련

- [iOS 앱](/ko/platforms/ios)
- [Nodes](/ko/nodes)
- [Android node 문제 해결](/ko/nodes/troubleshooting)
