---
read_when:
    - Android Node 페어링 또는 재연결하기
    - Android Gateway 검색 또는 인증 디버깅
    - 클라이언트 간 채팅 기록 일치성 검증
summary: 'Android 앱 (node): 연결 런북 + Connect/Chat/Voice/Canvas 명령 인터페이스'
title: Android 앱
x-i18n:
    generated_at: "2026-05-06T06:32:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
Android 앱은 아직 공개 출시되지 않았습니다. 소스 코드는 [OpenClaw 저장소](https://github.com/openclaw/openclaw)의 `apps/android` 아래에서 확인할 수 있습니다. Java 17과 Android SDK(`./gradlew :app:assemblePlayDebug`)를 사용해 직접 빌드할 수 있습니다. 빌드 지침은 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)를 참고하세요.
</Note>

## 지원 현황

- 역할: 동반 node 앱(Android는 Gateway를 호스팅하지 않음).
- Gateway 필요: 예(WSL2를 통해 macOS, Linux 또는 Windows에서 실행).
- 설치: [시작하기](/ko/start/getting-started) + [페어링](/ko/channels/pairing).
- Gateway: [Runbook](/ko/gateway) + [구성](/ko/gateway/configuration).
  - 프로토콜: [Gateway 프로토콜](/ko/gateway/protocol)(nodes + 제어 플레인).

## 시스템 제어

시스템 제어(launchd/systemd)는 Gateway 호스트에 있습니다. [Gateway](/ko/gateway)를 참고하세요.

## 연결 Runbook

Android node 앱 ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android는 Gateway WebSocket에 직접 연결하고 기기 페어링(`role: node`)을 사용합니다.

Tailscale 또는 공개 호스트의 경우 Android에는 보안 엔드포인트가 필요합니다.

- 권장: `https://<magicdns>` / `wss://<magicdns>`를 사용하는 Tailscale Serve / Funnel
- 또한 지원: 실제 TLS 엔드포인트가 있는 다른 모든 `wss://` Gateway URL
- 평문 `ws://`는 사설 LAN 주소 / `.local` 호스트와 `localhost`, `127.0.0.1`, Android 에뮬레이터 브리지(`10.0.2.2`)에서 계속 지원됩니다.

### 전제 조건

- "master" 머신에서 Gateway를 실행할 수 있습니다.
- Android 기기/에뮬레이터가 gateway WebSocket에 도달할 수 있습니다.
  - mDNS/NSD를 사용하는 동일 LAN, **또는**
  - Wide-Area Bonjour / 유니캐스트 DNS-SD를 사용하는 동일 Tailscale tailnet(아래 참고), **또는**
  - 수동 gateway 호스트/포트(대체)
- Tailnet/공개 모바일 페어링은 원시 tailnet IP `ws://` 엔드포인트를 사용하지 **않습니다**. 대신 Tailscale Serve 또는 다른 `wss://` URL을 사용하세요.
- gateway 머신에서 CLI(`openclaw`)를 실행할 수 있습니다(또는 SSH를 통해 실행).

### 1) Gateway 시작

```bash
openclaw gateway --port 18789 --verbose
```

로그에서 다음과 같은 내용이 보이는지 확인하세요.

- `listening on ws://0.0.0.0:18789`

Tailscale을 통한 원격 Android 액세스에는 원시 tailnet 바인딩 대신 Serve/Funnel을 권장합니다.

```bash
openclaw gateway --tailscale serve
```

그러면 Android에 보안 `wss://` / `https://` 엔드포인트가 제공됩니다. 별도로 TLS를 종료하지 않는 한, 단순한 `gateway.bind: "tailnet"` 설정만으로는 최초 원격 Android 페어링에 충분하지 않습니다.

### 2) 검색 확인(선택 사항)

gateway 머신에서:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

추가 디버깅 참고 사항: [Bonjour](/ko/gateway/bonjour).

Wide-area 검색 도메인도 구성한 경우 다음과 비교하세요.

```bash
openclaw gateway discover --json
```

이 명령은 `local.`과 구성된 wide-area 도메인을 한 번에 표시하며, TXT 전용 힌트 대신 확인된
서비스 엔드포인트를 사용합니다.

#### 유니캐스트 DNS-SD를 통한 Tailnet(Vienna ⇄ London) 검색

Android NSD/mDNS 검색은 네트워크를 넘어가지 않습니다. Android node와 gateway가 서로 다른 네트워크에 있지만 Tailscale로 연결되어 있다면 Wide-Area Bonjour / 유니캐스트 DNS-SD를 사용하세요.

검색만으로는 tailnet/공개 Android 페어링에 충분하지 않습니다. 검색된 경로에는 여전히 보안 엔드포인트(`wss://` 또는 Tailscale Serve)가 필요합니다.

1. gateway 호스트에 DNS-SD 영역(예: `openclaw.internal.`)을 설정하고 `_openclaw-gw._tcp` 레코드를 게시합니다.
2. 선택한 도메인이 해당 DNS 서버를 가리키도록 Tailscale split DNS를 구성합니다.

자세한 내용과 CoreDNS 구성 예시는 [Bonjour](/ko/gateway/bonjour)를 참고하세요.

### 3) Android에서 연결

Android 앱에서:

- 앱은 **포그라운드 서비스**(지속 알림)를 통해 gateway 연결을 유지합니다.
- **Connect** 탭을 엽니다.
- **Setup Code** 또는 **Manual** 모드를 사용합니다.
- 검색이 차단된 경우 **Advanced controls**에서 수동 호스트/포트를 사용합니다. 사설 LAN 호스트의 경우 `ws://`가 계속 동작합니다. Tailscale/공개 호스트의 경우 TLS를 켜고 `wss://` / Tailscale Serve 엔드포인트를 사용하세요.

첫 페어링에 성공한 후 Android는 시작 시 자동으로 다시 연결합니다.

- 수동 엔드포인트(활성화된 경우), 그렇지 않으면
- 마지막으로 검색된 gateway(최선형).

### Presence alive 비콘

인증된 node 세션이 연결된 후, 그리고 포그라운드 서비스가 계속 연결된 상태에서 앱이 백그라운드로 이동하면 Android는
`event: "node.presence.alive"`와 함께 `node.event`를 호출합니다. gateway는 인증된 node 기기 ID가 알려진 후에만
페어링된 node/기기 메타데이터에 이를 `lastSeenAtMs`/`lastSeenReason`으로 기록합니다.

앱은 gateway 응답에 `handled: true`가 포함된 경우에만 비콘이 성공적으로 기록된 것으로 간주합니다. 이전 gateway는 `{ "ok": true }`로 `node.event`를 승인할 수 있습니다. 이 응답은
호환되지만 지속적인 마지막 확인 업데이트로는 계산되지 않습니다.

### 4) 페어링 승인(CLI)

gateway 머신에서:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

페어링 세부 정보: [페어링](/ko/channels/pairing).

선택 사항: Android node가 항상 엄격하게 제어되는 서브넷에서 연결되는 경우,
명시적 CIDR 또는 정확한 IP로 최초 node 자동 승인을 옵트인할 수 있습니다.

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

기본적으로 비활성화되어 있습니다. 요청된 스코프가 없는 새 `role: node` 페어링에만
적용됩니다. 운영자/브라우저 페어링 및 모든 역할, 스코프, 메타데이터 또는
공개 키 변경은 여전히 수동 승인이 필요합니다.

### 5) node 연결 확인

- nodes 상태를 통해:

  ```bash
  openclaw nodes status
  ```

- Gateway를 통해:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 채팅 + 기록

Android Chat 탭은 세션 선택(기본값 `main`, 기타 기존 세션)을 지원합니다.

- 기록: `chat.history`(표시 정규화됨. 인라인 지시문 태그는
  보이는 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및
  잘린 도구 호출 블록 포함)와 유출된 ASCII/전각 모델 제어 토큰은
  제거되며, 정확히 `NO_REPLY` / `no_reply` 같은 순수 무음 토큰 assistant 행은 생략되고, 과도하게 큰 행은 플레이스홀더로 대체될 수 있음)
- 보내기: `chat.send`
- 푸시 업데이트(최선형): `chat.subscribe` → `event:"chat"`

### 7) Canvas + 카메라

#### Gateway Canvas Host(웹 콘텐츠에 권장)

node가 에이전트가 디스크에서 편집할 수 있는 실제 HTML/CSS/JS를 표시하도록 하려면 node가 Gateway canvas host를 가리키게 하세요.

<Note>
Nodes는 Gateway HTTP 서버(`gateway.port`와 같은 포트, 기본값 `18789`)에서 canvas를 로드합니다.
</Note>

1. gateway 호스트에 `~/.openclaw/workspace/canvas/index.html`을 생성합니다.

2. node를 해당 위치로 이동합니다(LAN).

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet(선택 사항): 두 기기가 모두 Tailscale에 있는 경우 `.local` 대신 MagicDNS 이름 또는 tailnet IP를 사용하세요. 예: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

이 서버는 HTML에 live-reload 클라이언트를 삽입하고 파일 변경 시 다시 로드합니다.
A2UI 호스트는 `http://<gateway-host>:18789/__openclaw__/a2ui/`에 있습니다.

Canvas 명령(포그라운드 전용):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate`(기본 스캐폴드로 돌아가려면 `{"url":""}` 또는 `{"url":"/"}` 사용). `canvas.snapshot`은 `{ format, base64 }`를 반환합니다(기본값 `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset`(`canvas.a2ui.pushJSONL` 레거시 별칭)

카메라 명령(포그라운드 전용, 권한 필요):

- `camera.snap`(jpg)
- `camera.clip`(mp4)

매개변수와 CLI 헬퍼는 [Camera node](/ko/nodes/camera)를 참고하세요.

### 8) 음성 + 확장된 Android 명령 표면

- Voice 탭: Android에는 두 가지 명시적 캡처 모드가 있습니다. **Mic**은 각 일시 중지를 채팅 턴으로 보내고 앱이 포그라운드를 벗어나거나 사용자가 Voice 탭을 떠나면 중지되는 수동 Voice 탭 세션입니다. **Talk**는 연속 Talk Mode이며 토글로 끄거나 node 연결이 끊길 때까지 계속 듣습니다.
- Talk Mode는 캡처가 시작되기 전에 기존 포그라운드 서비스를 `dataSync`에서 `dataSync|microphone`으로 승격한 다음, Talk Mode가 중지되면 다시 낮춥니다. Android 14+에는 `FOREGROUND_SERVICE_MICROPHONE` 선언, `RECORD_AUDIO` 런타임 허가, 런타임의 마이크 서비스 유형이 필요합니다.
- 음성 응답은 구성된 gateway Talk 제공자를 통해 `talk.speak`를 사용합니다. 로컬 시스템 TTS는 `talk.speak`를 사용할 수 없을 때만 사용됩니다.
- 음성 wake는 Android UX/런타임에서 계속 비활성화되어 있습니다.
- 추가 Android 명령 패밀리(가용성은 기기 + 권한에 따라 다름):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions`(아래 [알림 전달](#notification-forwarding) 참고)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant 진입점

Android는 시스템 assistant 트리거(Google
Assistant)에서 OpenClaw 실행을 지원합니다. 구성되면 홈 버튼을 길게 누르거나 "Hey Google, ask
OpenClaw..."라고 말하면 앱이 열리고 프롬프트가 채팅 작성기로 전달됩니다.

이 기능은 앱 매니페스트에 선언된 Android **App Actions** 메타데이터를 사용합니다. Gateway 쪽에서는
추가 구성이 필요하지 않습니다. assistant intent는
Android 앱에서 완전히 처리되고 일반 채팅 메시지로 전달됩니다.

<Note>
App Actions 가용성은 기기, Google Play Services 버전,
그리고 사용자가 OpenClaw를 기본 assistant 앱으로 설정했는지 여부에 따라 달라집니다.
</Note>

## 알림 전달

Android는 기기 알림을 이벤트로 gateway에 전달할 수 있습니다. 여러 제어 항목을 통해 어떤 알림을 언제 전달할지 범위를 지정할 수 있습니다.

| 키                              | 유형           | 설명                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 이 패키지 이름의 알림만 전달합니다. 설정하면 다른 모든 패키지는 무시됩니다.      |
| `notifications.denyPackages`     | string[]       | 이 패키지 이름의 알림은 절대 전달하지 않습니다. `allowPackages` 이후에 적용됩니다.              |
| `notifications.quietHours.start` | string (HH:mm) | 조용한 시간 창의 시작(로컬 기기 시간). 이 창 동안 알림은 억제됩니다. |
| `notifications.quietHours.end`   | string (HH:mm) | 조용한 시간 창의 끝.                                                                        |
| `notifications.rateLimit`        | number         | 패키지별 분당 최대 전달 알림 수. 초과 알림은 삭제됩니다.         |

알림 선택기는 전달된 알림 이벤트에 더 안전한 동작도 사용하여 민감한 시스템 알림이 실수로 전달되는 것을 방지합니다.

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

## 관련 항목

- [iOS 앱](/ko/platforms/ios)
- [Nodes](/ko/nodes)
- [Android node 문제 해결](/ko/nodes/troubleshooting)
