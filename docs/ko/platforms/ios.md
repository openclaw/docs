---
read_when:
    - iOS 노드 페어링 또는 재연결
    - 소스에서 iOS 앱 실행하기
    - Gateway 검색 또는 캔버스 명령 디버깅
summary: 'iOS Node 앱: Gateway 연결, 페어링, 캔버스 및 문제 해결'
title: iOS 앱
x-i18n:
    generated_at: "2026-07-04T17:53:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

가용성: iPhone 앱 빌드는 릴리스에서 활성화된 경우 Apple 채널을 통해 배포됩니다. 로컬 개발 빌드도 소스에서 실행할 수 있습니다.

## 수행 기능

- WebSocket(LAN 또는 tailnet)을 통해 Gateway에 연결합니다.
- 노드 기능을 노출합니다: Canvas, 화면 스냅샷, 카메라 캡처, 위치, 대화 모드, 음성 깨우기.
- `node.invoke` 명령을 수신하고 노드 상태 이벤트를 보고합니다.

## 요구 사항

- 다른 기기(macOS, Linux 또는 WSL2를 통한 Windows)에서 실행 중인 Gateway.
- 네트워크 경로:
  - Bonjour를 통한 동일 LAN, **또는**
  - 유니캐스트 DNS-SD를 통한 Tailnet(예시 도메인: `openclaw.internal.`), **또는**
  - 수동 호스트/포트(대체 경로).

## 빠른 시작(페어링 + 연결)

1. 휴대폰에서 도달할 수 있는 경로로 인증된 Gateway를 시작합니다. Tailscale
   Serve가 권장 원격 경로입니다.

```bash
openclaw gateway --port 18789 --tailscale serve
```

신뢰할 수 있는 동일 LAN 설정의 경우 대신 인증된 `gateway.bind: "lan"`을 사용하세요.
기본 loopback 바인딩은 휴대폰에서 도달할 수 없습니다. Gateway가 아직 구성되지 않았다면
먼저 `openclaw onboard`를 실행하여 설정 코드 생성에 토큰 또는 비밀번호 인증 경로가
있도록 하세요.

2. [제어 UI](/ko/web/control-ui)를 열고 **노드**를 선택한 다음 **기기** 카드에서
   **모바일 기기 페어링**을 클릭합니다.

3. iOS 앱에서 **설정** → **Gateway**를 열고 QR 코드를 스캔하거나 설정 코드를
   붙여넣은 다음 연결합니다.

4. 공식 앱은 자동으로 연결됩니다. **기기**에 보류 중인 요청이 표시되면
   승인하기 전에 해당 역할과 범위를 검토하세요.

제어 UI 버튼에는 `operator.admin`이 있는 이미 페어링된 세션이 필요합니다.
터미널 대체 경로로는 iOS 앱에서 발견된 Gateway를 선택하거나 수동 호스트를 활성화하고
호스트/포트를 입력한 다음, Gateway 호스트에서 요청을 승인하세요.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

앱이 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 다시 시도하면
이전 보류 요청은 대체되고 새 `requestId`가 생성됩니다.
승인하기 전에 `openclaw devices list`를 다시 실행하세요.

선택 사항: iOS 노드가 항상 엄격하게 제어되는 서브넷에서 연결되는 경우,
명시적 CIDR 또는 정확한 IP로 최초 노드 자동 승인을 옵트인할 수 있습니다.

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

이는 기본적으로 비활성화되어 있습니다. 요청된 범위가 없는 새로운 `role: node`
페어링에만 적용됩니다. 운영자/브라우저 페어링 및 역할, 범위, 메타데이터 또는
공개 키 변경은 여전히 수동 승인이 필요합니다.

5. 연결을 확인합니다.

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 공식 빌드용 릴레이 기반 푸시

공식 배포 iOS 빌드는 원시 APNs 토큰을 Gateway에 게시하는 대신 외부 푸시 릴레이를 사용합니다.

공개 릴리스 레인의 공식 App Store 빌드는 `https://ios-push-relay.openclaw.ai`의 호스팅 릴레이를 사용합니다.

사용자 지정 릴레이 배포에는 릴레이 URL이 Gateway 릴레이 URL과 일치하는 의도적으로 분리된 iOS 빌드/배포 경로가 필요합니다. 공개 App Store 릴리스 레인은 사용자 지정 릴레이 URL 재정의를 허용하지 않습니다. 사용자 지정 릴레이 빌드를 사용하는 경우 일치하는 Gateway 릴레이 URL을 설정하세요.

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

흐름의 작동 방식:

- iOS 앱은 App Attest와 StoreKit 앱 트랜잭션 JWS를 사용하여 릴레이에 등록합니다.
- 릴레이는 불투명한 릴레이 핸들과 등록 범위 전송 권한을 반환합니다.
- iOS 앱은 페어링된 Gateway ID를 가져와 릴레이 등록에 포함하므로, 릴레이 기반 등록은 해당 특정 Gateway에 위임됩니다.
- 앱은 해당 릴레이 기반 등록을 `push.apns.register`로 페어링된 Gateway에 전달합니다.
- Gateway는 저장된 릴레이 핸들을 `push.test`, 백그라운드 깨우기, 깨우기 nudges에 사용합니다.
- 사용자 지정 Gateway 릴레이 URL은 iOS 빌드에 내장된 릴레이 URL과 일치해야 합니다.
- 앱이 나중에 다른 Gateway 또는 다른 릴레이 기본 URL을 가진 빌드에 연결되면, 이전 바인딩을 재사용하는 대신 릴레이 등록을 새로 고칩니다.

이 경로에서 Gateway에 **필요하지 않은** 것:

- 배포 전체 릴레이 토큰 없음.
- 공식 App Store 릴레이 기반 전송을 위한 직접 APNs 키 없음.

예상 운영자 흐름:

1. 공식 iOS 앱을 설치합니다.
2. 선택 사항: 의도적으로 분리된 사용자 지정 릴레이 빌드를 사용할 때만 Gateway에서 `gateway.push.apns.relay.baseUrl`을 설정합니다.
3. 앱을 Gateway에 페어링하고 연결이 완료되도록 둡니다.
4. 앱은 APNs 토큰이 있고, 운영자 세션이 연결되어 있으며, 릴레이 등록이 성공한 후 자동으로 `push.apns.register`를 게시합니다.
5. 그 후 `push.test`, 재연결 깨우기, 깨우기 nudges는 저장된 릴레이 기반 등록을 사용할 수 있습니다.

## 백그라운드 활성 비컨

iOS가 무음 푸시, 백그라운드 새로 고침 또는 중요한 위치 이벤트로 앱을 깨우면, 앱은
짧은 노드 재연결을 시도한 다음 `event: "node.presence.alive"`와 함께 `node.event`를 호출합니다.
Gateway는 인증된 노드 기기 ID가 알려진 후에만 이를 페어링된 노드/기기 메타데이터의
`lastSeenAtMs`/`lastSeenReason`으로 기록합니다.

앱은 Gateway 응답에 `handled: true`가 포함된 경우에만 백그라운드 깨우기가 성공적으로 기록된 것으로 처리합니다.
이전 Gateway는 `{ "ok": true }`로 `node.event`를 승인할 수 있습니다. 해당 응답은
호환되지만 내구성 있는 마지막 확인 업데이트로 계산되지 않습니다.

호환성 참고:

- `OPENCLAW_APNS_RELAY_BASE_URL`은 Gateway의 임시 환경 변수 재정의로 계속 작동합니다.
- 공개 App Store 릴리스 레인은 iOS 빌드에서 `OPENCLAW_PUSH_RELAY_BASE_URL`을 거부합니다.

## 인증 및 신뢰 흐름

릴레이는 공식 iOS 빌드에서 Gateway 직접 APNs 방식이 제공할 수 없는 두 가지 제약을 강제하기 위해 존재합니다.

- Apple을 통해 배포된 진짜 OpenClaw iOS 빌드만 호스팅 릴레이를 사용할 수 있습니다.
- Gateway는 해당 특정 Gateway와 페어링된 iOS 기기에 대해서만 릴레이 기반 푸시를 보낼 수 있습니다.

단계별 흐름:

1. `iOS app -> gateway`
   - 앱은 먼저 일반 Gateway 인증 흐름을 통해 Gateway와 페어링됩니다.
   - 이를 통해 앱은 인증된 노드 세션과 인증된 운영자 세션을 얻습니다.
   - 운영자 세션은 `gateway.identity.get`을 호출하는 데 사용됩니다.

2. `iOS app -> relay`
   - 앱은 HTTPS를 통해 릴레이 등록 엔드포인트를 호출합니다.
   - 등록에는 App Attest 증명과 StoreKit 앱 트랜잭션 JWS가 포함됩니다.
   - 릴레이는 번들 ID, App Attest 증명, Apple 배포 증명을 검증하고
     공식/프로덕션 배포 경로를 요구합니다.
   - 이것이 로컬 Xcode/개발 빌드가 호스팅 릴레이를 사용하지 못하게 막는 요소입니다. 로컬 빌드가
     서명되어 있을 수는 있지만, 릴레이가 기대하는 공식 Apple 배포 증명을 충족하지 않습니다.

3. `gateway identity delegation`
   - 릴레이 등록 전에 앱은 페어링된 Gateway ID를
     `gateway.identity.get`에서 가져옵니다.
   - 앱은 해당 Gateway ID를 릴레이 등록 페이로드에 포함합니다.
   - 릴레이는 해당 Gateway ID에 위임된 릴레이 핸들과 등록 범위 전송 권한을 반환합니다.

4. `gateway -> relay`
   - Gateway는 `push.apns.register`에서 받은 릴레이 핸들과 전송 권한을 저장합니다.
   - `push.test`, 재연결 깨우기, 깨우기 nudges에서 Gateway는 자체 기기 ID로
     전송 요청에 서명합니다.
   - 릴레이는 저장된 전송 권한과 Gateway 서명을 등록에서 위임된
     Gateway ID와 대조해 모두 검증합니다.
   - 다른 Gateway는 어떻게든 핸들을 얻더라도 해당 저장된 등록을 재사용할 수 없습니다.

5. `relay -> APNs`
   - 릴레이는 공식 빌드의 프로덕션 APNs 자격 증명과 원시 APNs 토큰을 소유합니다.
   - Gateway는 릴레이 기반 공식 빌드에 대해 원시 APNs 토큰을 저장하지 않습니다.
   - 릴레이는 페어링된 Gateway를 대신하여 최종 푸시를 APNs로 보냅니다.

이 설계가 만들어진 이유:

- 프로덕션 APNs 자격 증명을 사용자 Gateway 밖에 두기 위해.
- 공식 빌드의 원시 APNs 토큰을 Gateway에 저장하지 않기 위해.
- 공식 OpenClaw iOS 빌드에 대해서만 호스팅 릴레이 사용을 허용하기 위해.
- 한 Gateway가 다른 Gateway가 소유한 iOS 기기에 깨우기 푸시를 보내지 못하게 하기 위해.

로컬/수동 빌드는 직접 APNs를 계속 사용합니다. 릴레이 없이 이러한 빌드를 테스트하는 경우
Gateway에는 여전히 직접 APNs 자격 증명이 필요합니다.

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

이들은 Gateway 호스트 런타임 환경 변수이며 Fastlane 설정이 아닙니다. `apps/ios/fastlane/.env`는
`APP_STORE_CONNECT_KEY_ID` 및 `APP_STORE_CONNECT_ISSUER_ID` 같은
App Store Connect 인증만 저장하며, 로컬 iOS 빌드의 직접 APNs 전달을 구성하지 않습니다.

권장 Gateway 호스트 저장 위치:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` 파일을 커밋하거나 저장소 체크아웃 아래에 두지 마세요.

## 발견 경로

### Bonjour(LAN)

iOS 앱은 `local.`의 `_openclaw-gw._tcp`와, 구성된 경우 동일한
광역 DNS-SD 발견 도메인을 탐색합니다. 동일 LAN Gateway는 `local.`에서 자동으로 표시됩니다.
교차 네트워크 발견은 비컨 유형을 변경하지 않고 구성된 광역 도메인을 사용할 수 있습니다.

### Tailnet(교차 네트워크)

mDNS가 차단된 경우 유니캐스트 DNS-SD 영역을 사용하고(도메인을 선택하세요. 예:
`openclaw.internal.`) Tailscale 분할 DNS를 사용하세요.
CoreDNS 예시는 [Bonjour](/ko/gateway/bonjour)를 참조하세요.

### 수동 호스트/포트

설정에서 **수동 호스트**를 활성화하고 Gateway 호스트 + 포트(기본값 `18789`)를 입력합니다.

## Canvas + A2UI

iOS 노드는 WKWebView Canvas를 렌더링합니다. `node.invoke`로 이를 구동하세요.

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

참고:

- Gateway Canvas 호스트는 `/__openclaw__/canvas/` 및 `/__openclaw__/a2ui/`를 제공합니다.
- 이는 Gateway HTTP 서버에서 제공됩니다(`gateway.port`와 동일한 포트, 기본값 `18789`).
- iOS 노드는 내장 스캐폴드를 연결된 기본 보기로 유지합니다. `canvas.a2ui.push` 및 `canvas.a2ui.reset`은 번들 앱 소유 A2UI 페이지를 사용합니다.
- 원격 Gateway A2UI 페이지는 iOS에서 렌더링 전용입니다. 네이티브 A2UI 버튼 동작은 번들 앱 소유 페이지에서만 허용됩니다.
- `canvas.navigate`와 `{"url":""}`로 내장 스캐폴드로 돌아갑니다.

## Computer Use와의 관계

iOS 앱은 모바일 노드 표면이며 Codex Computer Use 백엔드가 아닙니다. Codex
Computer Use 및 `cua-driver mcp`는 MCP 도구를 통해 로컬 macOS 데스크톱을 제어합니다.
iOS 앱은 `canvas.*`, `camera.*`, `screen.*`, `location.*`, `talk.*` 같은
OpenClaw 노드 명령을 통해 iPhone 기능을 노출합니다.

에이전트는 여전히 노드 명령을 호출하여 OpenClaw를 통해 iOS 앱을 조작할 수 있지만,
이러한 호출은 Gateway 노드 프로토콜을 거치며 iOS 포그라운드/백그라운드 제한을 따릅니다.
로컬 데스크톱 제어에는 [Codex Computer Use](/ko/plugins/codex-computer-use)를 사용하고,
iOS 노드 기능에는 이 페이지를 사용하세요.

### Canvas 평가 / 스냅샷

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 음성 깨우기 + 대화 모드

- 음성 깨우기와 대화 모드는 설정에서 사용할 수 있습니다.
- OpenAI realtime 대화는 `talk.realtime.transport`가 `webrtc`일 때 클라이언트 소유 WebRTC를 사용합니다. 명시적인 `gateway-relay` 구성은 계속 Gateway 소유입니다. [대화 모드](/ko/nodes/talk)를 참조하세요.
- 대화 지원 iOS 노드는 `talk` 기능을 알리고
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`를 선언할 수 있습니다.
  Gateway는 신뢰할 수 있는 대화 지원 노드에 대해 이러한 푸시 투 토크 명령을 기본적으로 허용합니다.
- iOS는 백그라운드 오디오를 일시 중단할 수 있습니다. 앱이 활성 상태가 아닐 때는 음성 기능을 최선 노력 방식으로 간주하세요.

## 일반적인 오류

- `NODE_BACKGROUND_UNAVAILABLE`: iOS 앱을 포그라운드로 가져오세요(캔버스/카메라/화면 명령에는 필요합니다).
- `A2UI_HOST_UNAVAILABLE`: 번들된 A2UI 페이지에 앱 WebView에서 접근할 수 없었습니다. 앱을 Screen 탭에서 포그라운드로 유지한 뒤 다시 시도하세요.
- 페어링 프롬프트가 나타나지 않음: `openclaw devices list`를 실행하고 수동으로 승인하세요.
- 재설치 후 다시 연결 실패: Keychain 페어링 토큰이 지워졌습니다. 노드를 다시 페어링하세요.

## 관련 문서

- [페어링](/ko/channels/pairing)
- [검색](/ko/gateway/discovery)
- [Bonjour](/ko/gateway/bonjour)
