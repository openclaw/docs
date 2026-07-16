---
read_when:
    - Android Node 페어링 또는 재연결
    - Android Gateway 검색 또는 인증 디버깅
    - 원격 Mac에서 Android 기기를 미러링하거나 제어하기
    - 클라이언트 간 채팅 기록 일치 여부 확인
summary: 'Android 앱(Node): 연결 런북 + Connect/Chat/Voice/Canvas 명령 표면'
title: Android 앱
x-i18n:
    generated_at: "2026-07-16T12:42:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
공식 Android 앱은 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 및 지원되는 [GitHub 릴리스](https://github.com/openclaw/openclaw/releases)의 서명된 독립 실행형 APK로 제공됩니다. 이 앱은 동반 Node이며, 실행 중인 OpenClaw Gateway가 필요합니다. 소스: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android)([빌드 지침](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## 지원 현황

- 역할: 동반 Node 앱(Android에서는 Gateway를 호스팅하지 않습니다).
- Gateway 필요 여부: 예(macOS, Linux 또는 WSL2를 통한 Windows에서 실행하십시오).
- 설치: 지원되는 [GitHub 릴리스](https://github.com/openclaw/openclaw/releases)의 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 또는 `OpenClaw-Android.apk`, Gateway용 [시작하기](/ko/start/getting-started), 이후 [페어링](/ko/channels/pairing)을 참조하십시오.
- Gateway: [운영 가이드](/ko/gateway) + [구성](/ko/gateway/configuration).
  - 프로토콜: [Gateway 프로토콜](/ko/gateway/protocol)(Node + 제어 영역).

시스템 제어(launchd/systemd)는 Gateway 호스트에서 수행됩니다. [Gateway](/ko/gateway)를 참조하십시오.

## Google Play 외부에서 설치

일반 최종 및 수정 GitHub 릴리스에는 범용 `OpenClaw-Android.apk` 및 `OpenClaw-Android-SHA256SUMS.txt`이 포함됩니다. APK는 릴리스 태그에서 빌드되고 OpenClaw Android 릴리스 키로 서명되며 GitHub Actions 출처 증명을 포함합니다.

두 자산이 모두 나열된 [릴리스](https://github.com/openclaw/openclaw/releases)를 선택한 다음, 사이드로딩하기 전에 해당 태그를 정확히 다운로드하고 검증하십시오.

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Google Play과 독립 실행형 APK 설치는 서로 다른 업데이트 채널을 사용하며 서명 ID도 다를 수 있습니다. 채널을 전환하기 전에 Android에서 기존 앱을 제거해야 할 수 있으며, 이 경우 로컬 앱 데이터가 삭제됩니다. 일반적인 업데이트에는 하나의 채널만 계속 사용하십시오.
</Warning>

## 원격 Mac에서 Android 미러링 및 제어

[scrcpy](https://github.com/Genymobile/scrcpy)는 Android 화면을 macOS 창에 미러링하고
Android Debug Bridge(ADB)를 통해 키보드 및 포인터 입력을 전달합니다. 이는 OpenClaw Node 연결과 별개인
운영자 측 워크플로입니다. Android 기기와
Mac이 서로 다른 위치에 있지만 사설 Tailscale 네트워크를 공유하는 경우 유용합니다.

### 시작하기 전에

- Android 기기와 Mac에 Tailscale을 설치하고 둘 다 동일한 tailnet에 연결하십시오.
- Android에서 **Developer options**와 **USB debugging**을 활성화하십시오. Android 16에서는 **Wireless
  debugging**이 **Settings > System > Developer options** 아래에 있습니다. [Android 개발자
  옵션](https://developer.android.com/studio/debug/dev-options)을 참조하십시오.
- Mac에 scrcpy와 ADB를 설치하십시오.

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- 첫 연결을 위해 Android 기기를 사용할 수 있는 상태로 유지하십시오. Mac에서 기기를 제어하려면 Android가 각 Mac의 ADB
  키를 승인해야 합니다.

### TCP를 통한 ADB 활성화

초기 설정에서는 Android 기기를 USB로 신뢰할 수 있는 컴퓨터에 연결하고 해당 컴퓨터의
디버깅 메시지를 승인하십시오. 그런 다음 다음을 실행하십시오.

```bash
adb devices
adb tcpip 5555
```

이제 USB 연결을 해제할 수 있습니다. 기기 재부팅이나 디버깅 초기화 후 포트 5555가 수신을 중지하면
이 로컬 설정 단계를 반복하십시오. Android 11 이상에서는
**Wireless debugging > Pair device with pairing code** 및 `adb pair`을 사용하여 최초 신뢰 관계를 설정할 수도 있습니다.

### 제어하는 Mac만 허용

제한적인 권한 부여 규칙을 사용하는 tailnet에서는 제어하는 Mac이 Android 기기의 TCP 포트 5555에 접근할 수 있도록
명시적으로 허용해야 합니다. 예시 주소를 두 기기의 안정적인 Tailscale IP로 바꾸어
tailnet 정책에 범위가 좁은 규칙을 추가하십시오.

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

호스트 별칭 및 기타 선택기는 [Tailscale 권한 부여](https://tailscale.com/docs/reference/syntax/grants)를 참조하십시오.
승인된 ADB 클라이언트는 기기를 광범위하게 제어할 수 있으므로 이 포트를 공용 인터넷에 허용하거나 Funnel로 노출하지 마십시오.

### 연결 및 미러링 시작

원격 Mac에서 다음을 실행하십시오.

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

이 Mac에서 처음 `adb connect`하면 Android에 승인 대화 상자가 표시됩니다. 기기의 잠금을 해제하고,
키 지문을 확인한 후 Mac을 신뢰하는 경우에만 **Always allow from this computer**를 선택하십시오.
성공한 `adb devices` 항목은 `device`로 끝납니다. `unauthorized`은 기기의 메시지가
승인되지 않았음을 의미합니다.

scrcpy 창이 열리면 직접 사용하거나 [Peekaboo](https://peekaboo.sh/) 같은 macOS 화면 자동화 도구로
대상으로 지정하십시오. scrcpy는 화면과 입력을 전달하며, Tailscale은 사설 네트워크 경로만 제공합니다.

### 문제 해결

- `Connection timed out`: TCP 5555에 대한 tailnet 권한 부여 규칙을 확인하십시오. `tailscale ping`이 성공하면
  피어에 연결할 수 있다는 사실만 입증할 뿐, 정책에서 이 TCP 포트를 허용한다는 의미는 아닙니다. Mac에서
  `nc -vz <android-tailnet-ip> 5555`을 사용해 테스트하십시오.
- `unauthorized`: Android의 잠금을 해제하고 원격 Mac의 ADB 키를 승인하거나, **Wireless debugging > Paired devices**에서 오래된 워크스테이션을
  제거한 후 다시 페어링하십시오.
- `Connection refused`: 로컬에서 다시 연결하고 `adb tcpip 5555`을 다시 실행하십시오.
- 둘 이상의 기기가 나열됨: 명시적인 `--serial <android-tailnet-ip>:5555` 인수를 계속 사용하십시오.

완료되면 scrcpy를 닫고 ADB 연결을 해제하십시오.

```bash
adb disconnect <android-tailnet-ip>:5555
```

## 연결 운영 가이드

Android Node 앱 ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android는 Gateway WebSocket에 직접 연결하고 기기 페어링(`role: node`)을 사용합니다.

Tailscale 또는 공용 호스트의 경우 Android에 보안 엔드포인트가 필요합니다.

- 권장: `https://<magicdns>` / `wss://<magicdns>`을 사용하는 Tailscale Serve / Funnel
- 그 밖의 실제 TLS 엔드포인트를 사용하는 `wss://` Gateway URL도 지원됩니다.
- 평문 `ws://`은 사설 LAN 주소 / `.local` 호스트와 `localhost`, `127.0.0.1` 및 Android 에뮬레이터 브리지(`10.0.2.2`)에서 계속 지원됩니다. 비루프백 설정은 제한된 운영자 접근을 자동으로 사용합니다.

### 사전 요구 사항

- 다른 머신에서 Gateway가 실행 중이어야 합니다(또는 SSH를 통해 접근할 수 있어야 합니다).
- Android 기기/에뮬레이터에서 Gateway WebSocket에 접근할 수 있어야 합니다.
  - mDNS/NSD를 사용하는 동일한 LAN, **또는**
  - 광역 Bonjour / 유니캐스트 DNS-SD를 사용하는 동일한 Tailscale tailnet(아래 참조), **또는**
  - 수동 Gateway 호스트/포트(대체 방법)
- Tailnet/공용 모바일 페어링에서는 원시 tailnet IP `ws://` 엔드포인트를 사용하지 **않습니다**. 대신 Tailscale Serve 또는 다른 `wss://` URL을 사용하십시오.
- 페어링 요청을 승인하려면 Gateway 머신에서(또는 SSH를 통해) `openclaw` CLI를 사용할 수 있어야 합니다.

### 1. Gateway 시작

```bash
openclaw gateway --port 18789 --verbose
```

로그에 다음과 유사한 내용이 표시되는지 확인하십시오.

- `listening on ws://0.0.0.0:18789`

Tailscale을 통해 Android에서 원격으로 접근하려면 원시 tailnet 바인딩 대신 Serve/Funnel을 사용하는 것이 좋습니다.

```bash
openclaw gateway --tailscale serve
```

이렇게 하면 Android에 보안 `wss://` / `https://` 엔드포인트가 제공됩니다. 별도로 TLS도 종료하지 않는 한 평범한 `gateway.bind: "tailnet"` 설정만으로는 최초 원격 Android 페어링에 충분하지 않습니다.

### 2. 검색 확인(선택 사항)

Gateway 머신에서 다음을 실행하십시오.

```bash
dns-sd -B _openclaw-gw._tcp local.
```

추가 디버깅 참고 사항: [Bonjour](/ko/gateway/bonjour).

광역 검색 도메인도 구성한 경우 다음과 비교하십시오.

```bash
openclaw gateway discover --json
```

이 명령은 TXT 전용 힌트 대신 확인된 서비스 엔드포인트를 사용하여 `local.` 및 구성된 광역 도메인을 한 번에 표시합니다.

#### 유니캐스트 DNS-SD를 통한 네트워크 간 검색

Android NSD/mDNS 검색은 네트워크 간에 작동하지 않습니다. Android Node와 Gateway가 서로 다른 네트워크에 있지만 Tailscale을 통해 연결되어 있다면 광역 Bonjour / 유니캐스트 DNS-SD를 대신 사용하십시오. Tailnet/공용 Android 페어링에는 검색만으로 충분하지 않으며, 검색된 경로에는 여전히 보안 엔드포인트(`wss://` 또는 Tailscale Serve)가 필요합니다.

1. Gateway 호스트에 DNS-SD 영역(예: `openclaw.internal.`)을 설정하고 `_openclaw-gw._tcp` 레코드를 게시하십시오.
2. 선택한 도메인이 해당 DNS 서버를 가리키도록 Tailscale 분할 DNS를 구성하십시오.

세부 정보 및 CoreDNS 구성 예시는 [Bonjour](/ko/gateway/bonjour)를 참조하십시오.

### 3. Android에서 연결

Android 앱에서 다음을 수행하십시오.

- 앱은 **포그라운드 서비스**(지속 알림)를 통해 Gateway 연결을 유지합니다.
- **Connect** 탭을 여십시오.
- **Setup Code** 또는 **Manual** 모드를 사용하십시오.
- 검색이 차단된 경우 **Advanced controls**에서 수동 호스트/포트를 사용하십시오. 사설 LAN 호스트에서는 `ws://`이 계속 작동합니다. Tailscale/공용 호스트에서는 TLS를 켜고 `wss://` / Tailscale Serve 엔드포인트를 사용하십시오.

첫 번째 페어링에 성공하면 Android는 앱 실행 시 활성 페어링된 Gateway에 자동으로 다시 연결합니다(검색된 Gateway의 경우 최선형으로 동작하며, 네트워크에 표시되어야 합니다).

공식 설정 코드는 Android를 Node로 연결하고 기본적으로 `wss://`을 통해 전체 Gateway 운영자
접근 권한을 부여합니다. 평문 비루프백 `ws://` 설정은
베어러 토큰의 안전을 위해 제한된 접근을 자동으로 사용합니다. **Settings → Gateway**에는
**Full** 또는 **Limited** 접근이 표시됩니다. 제한된 연결의 경우
`wss://` 또는 Tailscale Serve를 구성하고, Control UI나
`openclaw qr`을 사용하여 새 전체 접근 코드를 생성한 다음 해당 페이지에서 스캔하거나 붙여 넣고 다시 연결하십시오. 축소된
프로필을 원하는 운영자는 Control UI에서 **Limited access**를 선택하거나
`openclaw qr --limited`을 실행할 수 있습니다.

### 여러 Gateway

앱은 페어링한 모든 Gateway의 레지스트리를 유지하므로 다시 페어링하지 않고 전환할 수 있습니다.

- **Settings -> Gateways**에는 페어링된 Gateway가 나열되며 활성 Gateway가 표시됩니다. 전환하려면 항목을 탭하십시오. 앱은 현재 세션을 종료하고 선택한 Gateway에 다시 연결합니다.
- 둘 이상의 Gateway가 페어링된 경우 **Connect** 탭에 빠른 전환기가 표시됩니다.
- 자격 증명, 기기 토큰, TLS 신뢰, 채팅 기록 및 대기 중인 오프라인 메시지는 Gateway별로 저장됩니다. 전환해도 Gateway 간에 상태가 섞이지 않으며, 오프라인 상태에서 대기열에 추가된 메시지는 해당 메시지가 작성된 Gateway로만 전달됩니다.
- **Forget**은 자격 증명, 기기 토큰, TLS 핀 및 캐시된 채팅과 함께 Gateway의 레지스트리 항목을 제거합니다.

### 프레즌스 활성 비콘

인증된 Node 세션이 연결된 후와 포그라운드 서비스가 계속 연결된 상태에서 앱이 백그라운드로 전환될 때 Android는 `event: "node.presence.alive"`을 사용하여 `node.event`을 호출합니다. Gateway는 인증된 Node 기기 ID가 확인된 후에만 페어링된 Node/기기 메타데이터에 이를 `lastSeenAtMs`/`lastSeenReason`으로 기록합니다.

앱은 Gateway 응답에 `handled: true`이 포함된 경우에만 비콘이 성공적으로 기록된 것으로 간주합니다. 이전 Gateway는 `{ "ok": true }`을 사용하여 `node.event`을 확인할 수 있습니다. 이 응답은 호환되지만 지속적인 마지막 확인 업데이트로 간주되지 않습니다.

### 4. 페어링 승인(CLI)

Gateway 머신에서 다음을 실행하십시오.

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

페어링 세부 정보: [페어링](/ko/channels/pairing).

선택 사항: Android Node가 항상 엄격하게 통제되는 서브넷에서 연결되는 경우, 명시적 CIDR 또는 정확한 IP를 사용하여 최초 Node 자동 승인을 사용하도록 설정할 수 있습니다.

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

기본적으로 비활성화되어 있습니다. 요청된 범위가 없는 새로운 `role: node` 페어링에만 적용됩니다. 운영자/브라우저 페어링과 역할, 범위, 메타데이터 또는 공개 키의 모든 변경에는 여전히 수동 승인이 필요합니다.

### 5. Node 연결 확인

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. 채팅 + 기록

Android 채팅 탭은 세션 선택을 지원합니다(기본값 `main` 및 기존의 다른 세션).

- 기록: `chat.history`(표시용으로 정규화됨 — 인라인 지시문 태그, 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` 및 잘린 변형), 유출된 ASCII/전각 모델 제어 토큰이 제거되며, 정확히 `NO_REPLY` / `no_reply`인 것과 같은 무음 토큰 어시스턴트 행은 생략되고, 지나치게 큰 행은 자리표시자로 대체될 수 있음)
- 전송: `chat.send`
- 내구성 있는 전송: 모든 전송(텍스트, 선택한 이미지 및 음성 메모)은 네트워크 시도 전에 Gateway별 기기 내 보낼 편지함에 기록되므로 앱이 종료되어도 제출된 입력이 손실되지 않습니다. 오프라인 상태에서 대기열에 추가된 전송은 다시 연결될 때 안정적인 멱등성 키를 사용하여 순서대로 전달되며, 해당 턴이 정식 `chat.history`에 표시된 후에만 전송이 완료 처리됩니다. 승인 응답만으로는 전달 증명으로 간주하지 않습니다. 모호한 결과(승인 응답 손실, 전송 도중 앱 종료, 트랜스크립트 기록 전 Gateway 재시작)는 자동 재전송되지 않고 명시적 **재시도**/**삭제**가 있는 표시 행으로 나타납니다. 슬래시 명령은 재연결 후 자동으로 다시 실행되지 않으며, 명시적으로 재시도할 수 있도록 보류됩니다. 대기열은 Gateway당 메시지 50개 및 첨부 파일 바이트 48 MB로 제한되며, 전송되지 않은 행은 48시간 후 만료됩니다. 제출되지 않은 작성기 초안은 프로세스 종료 후 유지되지 않습니다.
- 푸시 업데이트(최선형): `chat.subscribe` -> `event:"chat"`
- 듣기: 어시스턴트 메시지를 길게 누르고 **듣기**를 선택하면 내용을 들을 수 있습니다. 오디오는 구성된 TTS 제공자 체인을 통해 Gateway `tts.speak`에서 렌더링되며, Gateway가 오디오를 렌더링할 수 없으면 기기 내 시스템 TTS가 사용됩니다. 세션 전환, 새 채팅, 앱의 백그라운드 전환 또는 채팅 종료 시 재생이 중지됩니다.

### 7. Canvas + 카메라

#### Gateway Canvas 호스트(웹 콘텐츠에 권장)

에이전트가 디스크에서 편집할 수 있는 실제 HTML/CSS/JS를 Node에 표시하려면 Node가 Gateway Canvas 호스트를 가리키도록 설정하십시오.

<Note>
Node는 Gateway HTTP 서버(`gateway.port`과 동일한 포트, 기본값 `18789`)에서 Canvas를 로드합니다.
</Note>

1. Gateway 호스트에 `~/.openclaw/workspace/canvas/index.html`을 생성하십시오.
2. Node에서 해당 위치로 이동하십시오(LAN).

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet(선택 사항): 두 기기가 모두 Tailscale에 연결되어 있으면 `.local` 대신 MagicDNS 이름 또는 tailnet IP를 사용하십시오(예: `http://<gateway-magicdns>:18789/__openclaw__/canvas/`).

이 서버는 HTML에 실시간 새로고침 클라이언트를 삽입하고 파일이 변경되면 다시 로드합니다. Gateway는 `/__openclaw__/a2ui/`도 제공하지만 Android 앱은 원격 A2UI 페이지를 렌더링 전용으로 처리합니다. 동작을 수행할 수 있는 A2UI 명령은 앱에 번들로 포함되어 앱이 소유하는 A2UI 페이지를 사용합니다.

Canvas 명령(포그라운드에서만):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate`(기본 스캐폴드로 돌아가려면 `{"url":""}` 또는 `{"url":"/"}`을 사용하십시오). `canvas.snapshot`은 `{ format, base64 }`(기본값 `format="jpeg"`)을 반환합니다.
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset`(`canvas.a2ui.pushJSONL` 레거시 별칭). 동작을 수행할 수 있는 렌더링에는 앱에 번들로 포함되어 앱이 소유하는 A2UI 페이지를 사용합니다.

카메라 명령(포그라운드에서만, 권한 필요): `camera.snap`(jpg), `camera.clip`(mp4). 매개변수와 CLI 도우미는 [카메라 Node](/ko/nodes/camera)를 참조하십시오.

### 8. 음성 + 확장된 Android 명령 표면

- 음성 탭: Android에는 두 가지 명시적 캡처 모드가 있습니다. **마이크**는 각 일시 중지를 채팅 턴으로 전송하는 수동 음성 탭 세션이며, 앱이 포그라운드를 벗어나거나 사용자가 음성 탭을 나가면 중지됩니다. **대화**는 연속 대화 모드이며, 사용자가 끄거나 Node 연결이 끊길 때까지 계속 수신합니다.
- 대화 모드는 캡처가 시작되기 전에 기존 포그라운드 서비스를 `connectedDevice`에서 `connectedDevice|microphone`으로 승격하고, 대화 모드가 중지되면 다시 강등합니다. Node 서비스는 `CHANGE_NETWORK_STATE`을 사용하여 `FOREGROUND_SERVICE_CONNECTED_DEVICE`을 선언합니다. Android 14 이상에서는 `FOREGROUND_SERVICE_MICROPHONE` 선언, `RECORD_AUDIO` 런타임 권한 부여 및 런타임의 마이크 서비스 유형도 필요합니다.
- 기본적으로 Android 대화는 네이티브 음성 인식, Gateway 채팅 및 구성된 Gateway 대화 제공자를 통한 `talk.speak`을 사용합니다. 로컬 시스템 TTS는 `talk.speak`을 사용할 수 없는 경우에만 사용됩니다.
- Android 대화는 `talk.realtime.mode`이 `realtime`이고 `talk.realtime.transport`이 `gateway-relay`인 경우에만 실시간 Gateway 릴레이를 사용합니다.
- Android는 `voiceWake` 기능을 알리지 않습니다. 음성 입력에는 **마이크** 또는 **대화**를 사용하십시오.
- 추가 Android 명령 계열(사용 가능 여부는 기기, 권한 및 사용자 설정에 따라 다름):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - **Settings > Phone Capabilities > Installed Apps**가 활성화된 경우에만 `device.apps`을 사용할 수 있습니다. 기본적으로 런처에 표시되는 앱을 나열합니다(전체 목록을 보려면 `includeNonLaunchable`을 전달하십시오).
  - `notifications.list`, `notifications.actions`(아래의 [알림 전달](#notification-forwarding) 참조)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. 작업 공간 파일(읽기 전용)

홈 개요에는 읽기 전용 `agents.workspace.list` / `agents.workspace.get` Gateway RPC를 통해 활성 에이전트의 작업 공간을 탐색하는 **파일** 카드가 포함됩니다. 디렉터리 탐색, 텍스트 및 이미지 미리보기, Android 공유 시트를 통한 내보내기를 지원합니다. 쓰기 작업은 없으며, 미리보기 크기는 Gateway에서 제한합니다.

## 명령 승인 검토

`operator.admin`을 사용하는 운영자 연결 또는 Gateway가 명시적으로 대상으로 지정한 페어링된
`operator.approvals` 연결은 **Settings -> Approvals**에서 대기 중인 실행 요청을 검토할 수 있습니다. 앱은 버튼을 활성화하기 전에
Gateway의 정제된 승인 레코드를 로드하고, 보안 경고와 해당 요청에서 제공하는 정확한 결정을 표시하며,
승인 ID와 소유자 종류를 Gateway로 다시 제출합니다.

승인 상태는 Control UI 및 지원되는 채팅 표면과 공유됩니다.
먼저 확정된 응답이 적용되며, 다른 표면에서 먼저 응답한 경우에도 Android에는 해당 정식 결과가 표시됩니다.
해결 응답이 손실되거나 Gateway 연결이 끊어지면 앱은 작업을 잠긴 상태로 유지하고
다른 결정을 제공하기 전에 승인을 다시 읽습니다.

통합 승인 메서드보다 오래된 Gateway는 배포된
실행 전용 메서드로 대체됩니다. 대기 중인 검토는 계속 작동하지만, 유지되는 터미널 상태와
더 풍부한 교차 표면 결과를 사용하려면 Gateway를 업데이트해야 합니다.

## 어시스턴트 진입점

Android에서는 시스템 어시스턴트 트리거(Google Assistant)를 통해 OpenClaw를 실행할 수 있습니다. 홈 버튼을 길게 누르거나 다른 `ACTION_ASSIST` 트리거를 사용하면 앱이 열립니다. "Hey Google, ask OpenClaw `<prompt>`"라고 말하면 앱에 선언된 App Actions 쿼리 패턴과 일치하며, 프롬프트가 자동 전송되지 않은 채 채팅 작성기로 전달됩니다.

이는 앱 매니페스트에 선언된 Android **App Actions**(`shortcuts.xml` 기능)를 사용합니다. Gateway 측 구성은 필요하지 않습니다. 어시스턴트 인텐트는 Android 앱에서 전적으로 처리됩니다.

<Note>
App Actions의 사용 가능 여부는 기기, Google Play Services 버전 및 사용자가 OpenClaw를 기본 어시스턴트 앱으로 설정했는지 여부에 따라 달라집니다.
</Note>

## 알림 전달

Android는 기기 알림을 `node.event` 항목으로 Gateway에 전달할 수 있습니다. 이는 Gateway/`openclaw.json` 구성이 아니라 앱의 Settings 시트에서 **기기에서** 구성합니다.

| 설정                        | 설명                                                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | 마스터 토글입니다. 기본적으로 꺼져 있으며, 먼저 Notification Listener Access를 부여해야 합니다.                                                                                                     |
| Package Filter              | **Allowlist**(목록에 있는 패키지 ID만 전달) 또는 **Blocklist**(기본값: 목록에 있는 ID를 제외한 모든 패키지)입니다. 전달 루프를 방지하기 위해 Blocklist 모드에서는 OpenClaw 자체 패키지가 항상 제외됩니다. |
| Quiet Hours                 | 전달을 억제하는 현지 HH:mm 시작/종료 시간 범위입니다. 기본적으로 비활성화되어 있으며, 활성화하면 기본값은 `22:00`-`07:00`입니다.                                                 |
| Max Events / Minute         | 전달되는 알림에 대한 기기별 속도 제한입니다. 기본값은 20입니다.                                                                                                                                      |
| Route Session Key           | 선택 사항입니다. 전달된 알림 이벤트를 기기의 기본 알림 경로 대신 특정 세션에 고정합니다.                                                                                                             |

<Note>
알림 전달에는 Android Notification Listener 권한이 필요합니다. 앱은 설정 중 이 권한을 요청합니다.
</Note>

WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord 및 Signal 알림은 항상 제외됩니다. 이러한 메시지는 이미 네이티브 OpenClaw 채널 세션에서 관리합니다. Android 알림을 별도의 Node 이벤트로 전달하면 응답이 잘못된 대화로 라우팅될 수 있습니다.

## 관련 항목

- [iOS 앱](/ko/platforms/ios)
- [Node](/ko/nodes)
- [Android Node 문제 해결](/ko/nodes/troubleshooting)
