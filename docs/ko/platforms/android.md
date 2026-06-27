---
read_when:
    - Android 노드 페어링 또는 재연결
    - Android Gateway 검색 또는 인증 디버깅
    - 클라이언트 간 채팅 기록 동등성 검증
summary: 'Android 앱(노드): 연결 런북 + 연결/채팅/음성/캔버스 명령 인터페이스'
title: Android 앱
x-i18n:
    generated_at: "2026-06-27T17:39:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
공식 Android 앱은 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)에서 사용할 수 있습니다. 이 앱은 동반 노드이며 실행 중인 OpenClaw Gateway가 필요합니다. 소스 코드도 [OpenClaw 저장소](https://github.com/openclaw/openclaw)의 `apps/android` 아래에서 제공됩니다. 빌드 지침은 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)를 참조하세요.
</Note>

## 지원 요약

- 역할: 동반 노드 앱(Android는 Gateway를 호스트하지 않음).
- Gateway 필요: 예(macOS, Linux 또는 WSL2를 통한 Windows에서 실행).
- 설치: 앱은 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN), Gateway는 [시작하기](/ko/start/getting-started), 그다음 [페어링](/ko/channels/pairing)을 사용합니다.
- Gateway: [런북](/ko/gateway) + [구성](/ko/gateway/configuration).
  - 프로토콜: [Gateway 프로토콜](/ko/gateway/protocol)(노드 + 제어 플레인).

## 시스템 제어

시스템 제어(launchd/systemd)는 Gateway 호스트에 있습니다. [Gateway](/ko/gateway)를 참조하세요.

## 연결 런북

Android 노드 앱 ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android는 Gateway WebSocket에 직접 연결하고 기기 페어링(`role: node`)을 사용합니다.

Tailscale 또는 공개 호스트의 경우 Android에는 보안 엔드포인트가 필요합니다.

- 권장: `https://<magicdns>` / `wss://<magicdns>`를 사용하는 Tailscale Serve / Funnel
- 또한 지원됨: 실제 TLS 엔드포인트가 있는 다른 모든 `wss://` Gateway URL
- 일반 텍스트 `ws://`는 비공개 LAN 주소 / `.local` 호스트와 `localhost`, `127.0.0.1`, Android 에뮬레이터 브리지(`10.0.2.2`)에서 계속 지원됩니다.

### 전제 조건

- "마스터" 머신에서 Gateway를 실행할 수 있습니다.
- Android 기기/에뮬레이터가 Gateway WebSocket에 연결할 수 있습니다.
  - mDNS/NSD가 있는 동일 LAN, **또는**
  - Wide-Area Bonjour / 유니캐스트 DNS-SD를 사용하는 동일 Tailscale tailnet(아래 참조), **또는**
  - 수동 Gateway 호스트/포트(대체)
- Tailnet/공개 모바일 페어링은 원시 tailnet IP `ws://` 엔드포인트를 사용하지 않습니다. 대신 Tailscale Serve 또는 다른 `wss://` URL을 사용하세요.
- Gateway 머신에서 CLI(`openclaw`)를 실행할 수 있습니다(또는 SSH를 통해 실행).

### 1) Gateway 시작

```bash
openclaw gateway --port 18789 --verbose
```

로그에서 다음과 같은 내용이 보이는지 확인합니다.

- `listening on ws://0.0.0.0:18789`

Tailscale을 통한 원격 Android 액세스에는 원시 tailnet 바인드 대신 Serve/Funnel을 권장합니다.

```bash
openclaw gateway --tailscale serve
```

이렇게 하면 Android에 보안 `wss://` / `https://` 엔드포인트가 제공됩니다. 별도로 TLS를 종료하지 않는 한, 일반 `gateway.bind: "tailnet"` 설정만으로는 최초 원격 Android 페어링에 충분하지 않습니다.

### 2) 검색 확인(선택 사항)

Gateway 머신에서:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

더 많은 디버깅 참고 사항: [Bonjour](/ko/gateway/bonjour).

Wide-area 검색 도메인도 구성했다면 다음과 비교하세요.

```bash
openclaw gateway discover --json
```

이 명령은 `local.`과 구성된 Wide-area 도메인을 한 번에 표시하며, TXT 전용 힌트 대신 해석된 서비스 엔드포인트를 사용합니다.

#### 유니캐스트 DNS-SD를 통한 Tailnet(Vienna ⇄ London) 검색

Android NSD/mDNS 검색은 네트워크를 넘지 않습니다. Android 노드와 Gateway가 서로 다른 네트워크에 있지만 Tailscale로 연결되어 있다면 Wide-Area Bonjour / 유니캐스트 DNS-SD를 대신 사용하세요.

검색만으로는 tailnet/공개 Android 페어링에 충분하지 않습니다. 검색된 경로에도 보안 엔드포인트(`wss://` 또는 Tailscale Serve)가 필요합니다.

1. Gateway 호스트에 DNS-SD 영역(예: `openclaw.internal.`)을 설정하고 `_openclaw-gw._tcp` 레코드를 게시합니다.
2. 선택한 도메인이 해당 DNS 서버를 가리키도록 Tailscale 분할 DNS를 구성합니다.

세부 정보와 CoreDNS 구성 예시는 [Bonjour](/ko/gateway/bonjour)를 참조하세요.

### 3) Android에서 연결

Android 앱에서:

- 앱은 **포그라운드 서비스**(지속 알림)를 통해 Gateway 연결을 유지합니다.
- **Connect** 탭을 엽니다.
- **Setup Code** 또는 **Manual** 모드를 사용합니다.
- 검색이 차단된 경우 **Advanced controls**에서 수동 호스트/포트를 사용합니다. 비공개 LAN 호스트의 경우 `ws://`가 계속 작동합니다. Tailscale/공개 호스트의 경우 TLS를 켜고 `wss://` / Tailscale Serve 엔드포인트를 사용하세요.

처음 페어링이 성공한 후 Android는 실행 시 자동으로 다시 연결합니다.

- 수동 엔드포인트(활성화된 경우), 그렇지 않으면
- 마지막으로 검색된 Gateway(최선 노력).

### Presence alive 비컨

인증된 노드 세션이 연결된 후, 그리고 포그라운드 서비스가 아직 연결된 상태에서 앱이 백그라운드로 이동하면 Android는 `event: "node.presence.alive"`와 함께 `node.event`를 호출합니다. Gateway는 인증된 노드 기기 ID를 알게 된 후에만 이를 페어링된 노드/기기 메타데이터의 `lastSeenAtMs`/`lastSeenReason`으로 기록합니다.

앱은 Gateway 응답에 `handled: true`가 포함된 경우에만 비컨이 성공적으로 기록된 것으로 계산합니다. 이전 Gateway는 `{ "ok": true }`로 `node.event`를 확인할 수 있습니다. 이 응답은 호환되지만 지속적인 마지막 확인 업데이트로 계산되지는 않습니다.

### 4) 페어링 승인(CLI)

Gateway 머신에서:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

페어링 세부 정보: [페어링](/ko/channels/pairing).

선택 사항: Android 노드가 항상 엄격히 제어되는 서브넷에서 연결되는 경우, 명시적 CIDR 또는 정확한 IP를 사용해 최초 노드 자동 승인을 선택적으로 활성화할 수 있습니다.

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

기본적으로 비활성화되어 있습니다. 요청된 범위가 없는 새 `role: node` 페어링에만 적용됩니다. 운영자/브라우저 페어링과 역할, 범위, 메타데이터 또는 공개 키 변경은 여전히 수동 승인이 필요합니다.

### 5) 노드가 연결되었는지 확인

- 노드 상태를 통해:

  ```bash
  openclaw nodes status
  ```

- Gateway를 통해:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 채팅 + 기록

Android Chat 탭은 세션 선택을 지원합니다(기본값 `main` 및 기타 기존 세션).

- 기록: `chat.history`(표시 정규화됨. 인라인 지시문 태그는 보이는 텍스트에서 제거되고, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함)와 유출된 ASCII/전각 모델 제어 토큰은 제거되며, 정확히 `NO_REPLY` / `no_reply`와 같은 순수 무음 토큰 assistant 행은 생략되고, 너무 큰 행은 자리 표시자로 대체될 수 있음)
- 보내기: `chat.send`
- 푸시 업데이트(최선 노력): `chat.subscribe` → `event:"chat"`

### 7) Canvas + 카메라

#### Gateway Canvas 호스트(웹 콘텐츠에 권장)

노드가 에이전트가 디스크에서 편집할 수 있는 실제 HTML/CSS/JS를 표시하도록 하려면 노드가 Gateway Canvas 호스트를 가리키게 합니다.

<Note>
노드는 Gateway HTTP 서버(`gateway.port`와 동일한 포트, 기본값 `18789`)에서 Canvas를 로드합니다.
</Note>

1. Gateway 호스트에 `~/.openclaw/workspace/canvas/index.html`을 만듭니다.

2. 노드를 해당 위치로 이동합니다(LAN).

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet(선택 사항): 두 기기가 모두 Tailscale에 있다면 `.local` 대신 MagicDNS 이름 또는 tailnet IP를 사용합니다. 예: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

이 서버는 HTML에 라이브 리로드 클라이언트를 주입하고 파일 변경 시 다시 로드합니다. Gateway는 `/__openclaw__/a2ui/`도 제공하지만, Android 앱은 원격 A2UI 페이지를 렌더링 전용으로 취급합니다. 작업 가능한 A2UI 명령은 메시지를 적용하기 전에 앱에 번들된 앱 소유 A2UI 페이지를 사용합니다.

Canvas 명령(포그라운드 전용):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate`(기본 스캐폴드로 돌아가려면 `{"url":""}` 또는 `{"url":"/"}` 사용). `canvas.snapshot`은 `{ format, base64 }`를 반환합니다(기본값 `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset`(`canvas.a2ui.pushJSONL` 레거시 별칭). 이러한 명령은 작업 가능한 렌더링을 위해 앱에 번들된 앱 소유 A2UI 페이지를 사용합니다.

카메라 명령(포그라운드 전용, 권한 필요):

- `camera.snap`(jpg)
- `camera.clip`(mp4)

매개변수와 CLI 도우미는 [카메라 노드](/ko/nodes/camera)를 참조하세요.

### 8) 음성 + 확장된 Android 명령 표면

- Voice 탭: Android에는 두 가지 명시적 캡처 모드가 있습니다. **Mic**은 각 일시 중지를 채팅 턴으로 보내고 앱이 포그라운드를 벗어나거나 사용자가 Voice 탭을 떠나면 중지되는 수동 Voice 탭 세션입니다. **Talk**는 지속적인 Talk Mode이며 토글을 끄거나 노드 연결이 끊어질 때까지 계속 수신합니다.
- Talk Mode는 캡처가 시작되기 전에 기존 포그라운드 서비스를 `connectedDevice`에서 `connectedDevice|microphone`으로 승격한 다음, Talk Mode가 중지되면 다시 강등합니다. 노드 서비스는 `CHANGE_NETWORK_STATE`와 함께 `FOREGROUND_SERVICE_CONNECTED_DEVICE`를 선언합니다. Android 14 이상에서는 `FOREGROUND_SERVICE_MICROPHONE` 선언, `RECORD_AUDIO` 런타임 권한 부여, 런타임의 마이크 서비스 유형도 필요합니다.
- 기본적으로 Android Talk는 네이티브 음성 인식, Gateway 채팅, 구성된 Gateway Talk provider를 통한 `talk.speak`를 사용합니다. 로컬 시스템 TTS는 `talk.speak`를 사용할 수 없을 때만 사용됩니다.
- Android Talk는 `talk.realtime.mode`가 `realtime`이고 `talk.realtime.transport`가 `gateway-relay`일 때만 실시간 Gateway 릴레이를 사용합니다.
- Voice wake는 Android UX/런타임에서 계속 비활성화되어 있습니다.
- 추가 Android 명령 계열(사용 가능 여부는 기기, 권한, 사용자 설정에 따라 다름):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - **Settings > Phone Capabilities > Installed Apps**가 활성화된 경우에만 `device.apps`; 기본적으로 런처에 표시되는 앱을 나열합니다.
  - `notifications.list`, `notifications.actions`(아래 [알림 전달](#notification-forwarding) 참조)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Assistant 진입점

Android는 시스템 assistant 트리거(Google Assistant)에서 OpenClaw 실행을 지원합니다. 구성되면 홈 버튼을 길게 누르거나 "Hey Google, ask OpenClaw..."라고 말하면 앱이 열리고 프롬프트가 채팅 작성기로 전달됩니다.

이는 앱 매니페스트에 선언된 Android **App Actions** 메타데이터를 사용합니다. Gateway 쪽에는 추가 구성이 필요하지 않습니다. assistant intent는 Android 앱에서 전적으로 처리되고 일반 채팅 메시지로 전달됩니다.

<Note>
App Actions 사용 가능 여부는 기기, Google Play Services 버전, 사용자가 OpenClaw를 기본 assistant 앱으로 설정했는지에 따라 달라집니다.
</Note>

## 알림 전달

Android는 기기 알림을 이벤트로 Gateway에 전달할 수 있습니다. 여러 제어 옵션을 통해 어떤 알림을 언제 전달할지 범위를 지정할 수 있습니다.

| 키                               | 유형           | 설명                                                                                              |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 이러한 패키지 이름의 알림만 전달합니다. 설정하면 다른 모든 패키지는 무시됩니다.                  |
| `notifications.denyPackages`     | string[]       | 이러한 패키지 이름의 알림은 절대 전달하지 않습니다. `allowPackages` 이후에 적용됩니다.           |
| `notifications.quietHours.start` | string (HH:mm) | 방해 금지 시간 창의 시작(로컬 기기 시간). 이 창 동안 알림이 억제됩니다.                          |
| `notifications.quietHours.end`   | string (HH:mm) | 방해 금지 시간 창의 종료.                                                                        |
| `notifications.rateLimit`        | number         | 패키지당 분당 전달되는 최대 알림 수입니다. 초과 알림은 삭제됩니다.                               |

알림 선택기도 전달된 알림 이벤트에 대해 더 안전한 동작을 사용하여 민감한 시스템 알림이 실수로 전달되는 것을 방지합니다.

예시 구성:

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
알림 전달에는 Android Notification Listener 권한이 필요합니다. 앱은 설정 중에 이 권한을 요청합니다.
</Note>

## 관련 항목

- [iOS 앱](/ko/platforms/ios)
- [Node](/ko/nodes)
- [Android Node 문제 해결](/ko/nodes/troubleshooting)
