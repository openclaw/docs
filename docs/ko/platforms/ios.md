---
read_when:
    - iOS 노드 페어링 또는 다시 연결하기
    - 소스에서 iOS 앱 실행하기
    - Gateway 탐색 또는 캔버스 명령 디버깅
summary: 'iOS 노드 앱: Gateway 연결, 페어링, 캔버스 및 문제 해결'
title: iOS 앱
x-i18n:
    generated_at: "2026-05-06T06:32:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Availability: 내부 프리뷰입니다. iOS 앱은 아직 공개 배포되지 않았습니다.

## 기능

- WebSocket(LAN 또는 tailnet)을 통해 Gateway에 연결합니다.
- Node 기능을 노출합니다: Canvas, Screen snapshot, Camera capture, Location, Talk mode, Voice wake.
- `node.invoke` 명령을 수신하고 Node 상태 이벤트를 보고합니다.

## 요구 사항

- 다른 기기(macOS, Linux 또는 WSL2를 통한 Windows)에서 실행 중인 Gateway.
- 네트워크 경로:
  - Bonjour를 통한 동일 LAN, **또는**
  - 유니캐스트 DNS-SD를 통한 tailnet(예시 도메인: `openclaw.internal.`), **또는**
  - 수동 호스트/포트(대체 경로).

## 빠른 시작(페어링 + 연결)

1. Gateway를 시작합니다.

```bash
openclaw gateway --port 18789
```

2. iOS 앱에서 Settings를 열고 발견된 gateway를 선택합니다(또는 Manual Host를 활성화하고 호스트/포트를 입력합니다).

3. gateway 호스트에서 페어링 요청을 승인합니다.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

앱이 변경된 인증 세부 정보(역할/스코프/공개 키)로 페어링을 다시 시도하면,
이전 보류 요청은 대체되고 새 `requestId`가 생성됩니다.
승인하기 전에 `openclaw devices list`를 다시 실행하세요.

선택 사항: iOS Node가 항상 엄격하게 제어되는 서브넷에서 연결하는 경우,
명시적인 CIDR 또는 정확한 IP로 최초 Node 자동 승인을 선택적으로 활성화할 수 있습니다.

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

이는 기본적으로 비활성화되어 있습니다. 요청된 스코프가 없는 새로운 `role: node`
페어링에만 적용됩니다. 운영자/브라우저 페어링과 역할, 스코프, 메타데이터 또는
공개 키 변경은 여전히 수동 승인이 필요합니다.

4. 연결을 확인합니다.

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 공식 빌드용 릴레이 기반 푸시

공식 배포 iOS 빌드는 원시 APNs 토큰을 gateway에 게시하는 대신 외부 푸시 릴레이를 사용합니다.

Gateway 측 요구 사항:

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

흐름 작동 방식:

- iOS 앱은 App Attest와 StoreKit 앱 트랜잭션 JWS를 사용해 릴레이에 등록합니다.
- 릴레이는 불투명한 릴레이 핸들과 등록 범위의 전송 권한을 반환합니다.
- iOS 앱은 페어링된 gateway ID를 가져와 릴레이 등록에 포함하므로, 릴레이 기반 등록이 해당 특정 gateway에 위임됩니다.
- 앱은 그 릴레이 기반 등록을 `push.apns.register`로 페어링된 gateway에 전달합니다.
- Gateway는 저장된 릴레이 핸들을 `push.test`, 백그라운드 깨우기, 깨우기 넛지에 사용합니다.
- Gateway 릴레이 기본 URL은 공식/TestFlight iOS 빌드에 내장된 릴레이 URL과 일치해야 합니다.
- 앱이 나중에 다른 gateway 또는 다른 릴레이 기본 URL이 있는 빌드에 연결하면, 이전 바인딩을 재사용하지 않고 릴레이 등록을 갱신합니다.

이 경로에서 gateway에 필요하지 **않은** 것:

- 배포 전체 릴레이 토큰이 필요 없습니다.
- 공식/TestFlight 릴레이 기반 전송에는 직접 APNs 키가 필요 없습니다.

예상 운영자 흐름:

1. 공식/TestFlight iOS 빌드를 설치합니다.
2. gateway에서 `gateway.push.apns.relay.baseUrl`을 설정합니다.
3. 앱을 gateway에 페어링하고 연결이 완료되도록 둡니다.
4. 앱은 APNs 토큰을 보유하고, 운영자 세션이 연결되었으며, 릴레이 등록이 성공하면 `push.apns.register`를 자동으로 게시합니다.
5. 그 후에는 `push.test`, 재연결 깨우기, 깨우기 넛지가 저장된 릴레이 기반 등록을 사용할 수 있습니다.

## 백그라운드 활성 비컨

iOS가 무음 푸시, 백그라운드 새로 고침 또는 중요한 위치 이벤트로 앱을 깨우면, 앱은
짧은 Node 재연결을 시도한 다음 `event: "node.presence.alive"`로 `node.event`를 호출합니다.
Gateway는 인증된 Node 기기 ID를 알게 된 뒤에만 이를 페어링된 Node/기기 메타데이터의
`lastSeenAtMs`/`lastSeenReason`으로 기록합니다.

앱은 Gateway 응답에 `handled: true`가 포함된 경우에만 백그라운드 깨우기가 성공적으로 기록되었다고 간주합니다.
이전 Gateway는 `{ "ok": true }`로 `node.event`를 확인할 수 있습니다. 이 응답은
호환되지만 지속적인 마지막 확인 업데이트로는 계산되지 않습니다.

호환성 참고:

- `OPENCLAW_APNS_RELAY_BASE_URL`은 여전히 Gateway의 임시 환경 변수 오버라이드로 작동합니다.

## 인증 및 신뢰 흐름

릴레이는 공식 iOS 빌드에서 gateway의 직접 APNs 방식이 제공할 수 없는 두 가지 제약을 강제하기 위해 존재합니다.

- Apple을 통해 배포된 정품 OpenClaw iOS 빌드만 호스팅 릴레이를 사용할 수 있습니다.
- Gateway는 해당 특정 gateway와 페어링된 iOS 기기에 대해서만 릴레이 기반 푸시를 보낼 수 있습니다.

홉별 흐름:

1. `iOS app -> gateway`
   - 앱은 먼저 일반 Gateway 인증 흐름을 통해 gateway와 페어링합니다.
   - 이를 통해 앱은 인증된 Node 세션과 인증된 운영자 세션을 얻습니다.
   - 운영자 세션은 `gateway.identity.get`을 호출하는 데 사용됩니다.

2. `iOS app -> relay`
   - 앱은 HTTPS를 통해 릴레이 등록 엔드포인트를 호출합니다.
   - 등록에는 App Attest 증명과 StoreKit 앱 트랜잭션 JWS가 포함됩니다.
   - 릴레이는 번들 ID, App Attest 증명, Apple 배포 증명을 검증하고
     공식/프로덕션 배포 경로를 요구합니다.
   - 이것이 로컬 Xcode/dev 빌드가 호스팅 릴레이를 사용하지 못하게 막는 요소입니다. 로컬 빌드는
     서명되어 있을 수 있지만 릴레이가 기대하는 공식 Apple 배포 증명을 충족하지 않습니다.

3. `gateway identity delegation`
   - 릴레이 등록 전에 앱은 `gateway.identity.get`에서 페어링된 gateway ID를 가져옵니다.
   - 앱은 해당 gateway ID를 릴레이 등록 페이로드에 포함합니다.
   - 릴레이는 해당 gateway ID에 위임된 릴레이 핸들과 등록 범위의 전송 권한을 반환합니다.

4. `gateway -> relay`
   - Gateway는 `push.apns.register`의 릴레이 핸들과 전송 권한을 저장합니다.
   - `push.test`, 재연결 깨우기, 깨우기 넛지 시 Gateway는 자체 기기 ID로 전송 요청에 서명합니다.
   - 릴레이는 저장된 전송 권한과 Gateway 서명을 모두 등록 시 위임된 gateway ID와 대조해 검증합니다.
   - 다른 gateway는 어떤 방식으로든 핸들을 획득하더라도 저장된 등록을 재사용할 수 없습니다.

5. `relay -> APNs`
   - 릴레이는 공식 빌드용 프로덕션 APNs 자격 증명과 원시 APNs 토큰을 소유합니다.
   - Gateway는 릴레이 기반 공식 빌드의 원시 APNs 토큰을 저장하지 않습니다.
   - 릴레이는 페어링된 Gateway를 대신해 최종 푸시를 APNs로 보냅니다.

이 설계가 만들어진 이유:

- 프로덕션 APNs 자격 증명을 사용자 Gateway 밖에 유지하기 위해.
- 공식 빌드의 원시 APNs 토큰을 Gateway에 저장하지 않기 위해.
- 공식/TestFlight OpenClaw 빌드에 대해서만 호스팅 릴레이 사용을 허용하기 위해.
- 한 Gateway가 다른 Gateway 소유의 iOS 기기에 깨우기 푸시를 보내지 못하게 하기 위해.

로컬/수동 빌드는 직접 APNs를 계속 사용합니다. 릴레이 없이 해당 빌드를 테스트하는 경우
Gateway에는 여전히 직접 APNs 자격 증명이 필요합니다.

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

이는 gateway 호스트 런타임 환경 변수이며 Fastlane 설정이 아닙니다. `apps/ios/fastlane/.env`는
`ASC_KEY_ID` 및 `ASC_ISSUER_ID` 같은 App Store Connect / TestFlight 인증만 저장합니다.
로컬 iOS 빌드의 직접 APNs 전달은 구성하지 않습니다.

권장 gateway 호스트 저장소:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` 파일을 커밋하거나 repo 체크아웃 아래에 두지 마세요.

## 검색 경로

### Bonjour (LAN)

iOS 앱은 `local.`의 `_openclaw-gw._tcp`를 탐색하고, 구성된 경우 동일한
광역 DNS-SD 검색 도메인도 탐색합니다. 동일 LAN Gateway는 `local.`에서 자동으로 표시됩니다.
교차 네트워크 검색은 비컨 유형을 변경하지 않고 구성된 광역 도메인을 사용할 수 있습니다.

### Tailnet (교차 네트워크)

mDNS가 차단된 경우 유니캐스트 DNS-SD 영역을 사용하고(도메인을 선택하세요. 예:
`openclaw.internal.`) Tailscale 분할 DNS를 사용합니다.
CoreDNS 예시는 [Bonjour](/ko/gateway/bonjour)를 참조하세요.

### 수동 호스트/포트

Settings에서 **Manual Host**를 활성화하고 gateway 호스트 + 포트(기본값 `18789`)를 입력합니다.

## Canvas + A2UI

iOS Node는 WKWebView Canvas를 렌더링합니다. `node.invoke`를 사용해 이를 제어합니다.

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

참고:

- Gateway Canvas 호스트는 `/__openclaw__/canvas/` 및 `/__openclaw__/a2ui/`를 제공합니다.
- Gateway HTTP 서버에서 제공됩니다(`gateway.port`와 동일한 포트, 기본값 `18789`).
- iOS Node는 Canvas 호스트 URL이 광고되면 연결 시 A2UI로 자동 이동합니다.
- `canvas.navigate`와 `{"url":""}`를 사용해 내장 스캐폴드로 돌아갑니다.

## Computer Use 관계

iOS 앱은 모바일 Node 표면이며, Codex Computer Use 백엔드가 아닙니다. Codex
Computer Use와 `cua-driver mcp`는 MCP 도구를 통해 로컬 macOS 데스크톱을 제어합니다.
iOS 앱은 `canvas.*`, `camera.*`, `screen.*`, `location.*`, `talk.*` 같은
OpenClaw Node 명령을 통해 iPhone 기능을 노출합니다.

Agent는 Node 명령을 호출해 OpenClaw를 통해 iOS 앱을 계속 조작할 수 있지만,
이러한 호출은 Gateway Node 프로토콜을 거치며 iOS 포그라운드/백그라운드 제한을 따릅니다.
로컬 데스크톱 제어에는 [Codex Computer Use](/ko/plugins/codex-computer-use)를 사용하고,
iOS Node 기능에는 이 페이지를 사용하세요.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + talk mode

- Voice wake와 talk mode는 Settings에서 사용할 수 있습니다.
- Talk 지원 iOS Node는 `talk` 기능을 광고하고
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`를 선언할 수 있습니다.
  Gateway는 신뢰할 수 있는 Talk 지원 Node에 대해 이러한 push-to-talk 명령을 기본적으로 허용합니다.
- iOS는 백그라운드 오디오를 일시 중단할 수 있습니다. 앱이 활성 상태가 아닐 때는 음성 기능을 최선 노력 방식으로 간주하세요.

## 일반적인 오류

- `NODE_BACKGROUND_UNAVAILABLE`: iOS 앱을 포그라운드로 가져오세요(Canvas/camera/screen 명령에는 필요함).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway가 Canvas 호스트 URL을 광고하지 않았습니다. [Gateway configuration](/ko/gateway/configuration)의 `canvasHost`를 확인하세요.
- 페어링 프롬프트가 나타나지 않음: `openclaw devices list`를 실행하고 수동으로 승인하세요.
- 재설치 후 재연결 실패: Keychain 페어링 토큰이 지워졌습니다. Node를 다시 페어링하세요.

## 관련 문서

- [Pairing](/ko/channels/pairing)
- [Discovery](/ko/gateway/discovery)
- [Bonjour](/ko/gateway/bonjour)
