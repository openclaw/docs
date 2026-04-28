---
read_when:
    - iOS Node 페어링 또는 다시 연결하기
    - 소스에서 iOS 앱 실행하기
    - gateway discovery 또는 canvas 명령 디버깅하기
summary: 'iOS Node 앱: Gateway 연결, 페어링, canvas, 그리고 문제 해결'
title: iOS 앱
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-25T06:04:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

사용 가능 상태: 내부 프리뷰. iOS 앱은 아직 공개 배포되지 않았습니다.

## 기능

- WebSocket을 통해 Gateway에 연결합니다(LAN 또는 tailnet).
- Node capability를 노출합니다: Canvas, 화면 스냅샷, 카메라 캡처, 위치, Talk mode, Voice wake.
- `node.invoke` 명령을 수신하고 node 상태 이벤트를 보고합니다.

## 요구 사항

- 다른 기기에서 실행 중인 Gateway(macOS, Linux, 또는 WSL2를 통한 Windows).
- 네트워크 경로:
  - 같은 LAN의 Bonjour, **또는**
  - 유니캐스트 DNS-SD를 통한 tailnet(예시 도메인: `openclaw.internal.`), **또는**
  - 수동 host/port(폴백).

## 빠른 시작(페어링 + 연결)

1. Gateway를 시작합니다:

```bash
openclaw gateway --port 18789
```

2. iOS 앱에서 Settings를 열고 발견된 gateway를 선택합니다(또는 Manual Host를 활성화하고 host/port를 입력합니다).

3. gateway 호스트에서 페어링 요청을 승인합니다:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

앱이 변경된 인증 세부정보(role/scopes/public key)로 페어링을 다시 시도하면,
이전 대기 요청은 대체되고 새 `requestId`가 생성됩니다.
승인 전에 `openclaw devices list`를 다시 실행하세요.

선택 사항: iOS Node가 항상 엄격하게 통제된 서브넷에서 연결된다면,
명시적 CIDR 또는 정확한 IP로 최초 node 자동 승인을 opt in할 수 있습니다:

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

이 기능은 기본적으로 비활성화되어 있습니다. 요청된 scopes가 없는 새로운 `role: node` 페어링에만 적용됩니다. Operator/브라우저 페어링 및 모든 role, scope, metadata, public-key 변경은 여전히 수동 승인이 필요합니다.

4. 연결을 확인합니다:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 공식 빌드용 relay 기반 푸시

공식 배포 iOS 빌드는 원시 APNs 토큰을 gateway에 게시하는 대신 외부 푸시 relay를 사용합니다.

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

흐름은 다음과 같습니다:

- iOS 앱은 App Attest와 앱 영수증을 사용해 relay에 등록합니다.
- relay는 불투명한 relay handle과 등록 범위 send grant를 반환합니다.
- iOS 앱은 페어링된 gateway identity를 가져와 relay 등록에 포함하므로, relay 기반 등록은 그 특정 gateway에 위임됩니다.
- 앱은 `push.apns.register`로 해당 relay 기반 등록을 페어링된 gateway에 전달합니다.
- gateway는 `push.test`, 백그라운드 wake, wake nudges에 저장된 relay handle을 사용합니다.
- gateway relay base URL은 공식/TestFlight iOS 빌드에 내장된 relay URL과 일치해야 합니다.
- 앱이 나중에 다른 gateway 또는 다른 relay base URL을 가진 빌드에 연결되면, 이전 바인딩을 재사용하는 대신 relay 등록을 새로 고칩니다.

이 경로에서 gateway에 **필요하지 않은 것**:

- 배포 전체에 공통인 relay 토큰 없음
- 공식/TestFlight relay 기반 전송용 직접 APNs 키 없음

예상 운영자 흐름:

1. 공식/TestFlight iOS 빌드를 설치합니다.
2. gateway에서 `gateway.push.apns.relay.baseUrl`을 설정합니다.
3. 앱을 gateway에 페어링하고 연결이 완료되도록 둡니다.
4. 앱은 APNs 토큰이 있고, operator 세션이 연결되어 있으며, relay 등록이 성공하면 자동으로 `push.apns.register`를 게시합니다.
5. 그 후 `push.test`, reconnect wake, wake nudges는 저장된 relay 기반 등록을 사용할 수 있습니다.

호환성 참고:

- `OPENCLAW_APNS_RELAY_BASE_URL`은 여전히 gateway용 임시 env override로 동작합니다.

## 인증 및 신뢰 흐름

relay는 공식 iOS 빌드에 대해 직접 APNs-on-gateway가 제공할 수 없는 두 가지 제약을 강제하기 위해 존재합니다:

- Apple을 통해 배포된 진짜 OpenClaw iOS 빌드만 호스팅 relay를 사용할 수 있어야 함
- gateway는 그 특정 gateway와 페어링된 iOS 기기에 대해서만 relay 기반 푸시를 보낼 수 있어야 함

홉별 흐름:

1. `iOS app -> gateway`
   - 앱은 먼저 일반 Gateway auth 흐름을 통해 gateway와 페어링합니다.
   - 이로써 앱은 인증된 node 세션과 인증된 operator 세션을 얻게 됩니다.
   - operator 세션은 `gateway.identity.get` 호출에 사용됩니다.

2. `iOS app -> relay`
   - 앱은 HTTPS를 통해 relay 등록 엔드포인트를 호출합니다.
   - 등록에는 App Attest 증명과 앱 영수증이 포함됩니다.
   - relay는 bundle ID, App Attest 증명, Apple 영수증을 검증하고,
     공식/프로덕션 배포 경로를 요구합니다.
   - 이것이 로컬 Xcode/dev 빌드가 호스팅 relay를 사용할 수 없게 만드는 이유입니다. 로컬 빌드는 서명될 수는 있어도 relay가 기대하는 공식 Apple 배포 증명을 충족하지 못합니다.

3. `gateway identity delegation`
   - relay 등록 전에 앱은 `gateway.identity.get`에서 페어링된 gateway identity를 가져옵니다.
   - 앱은 해당 gateway identity를 relay 등록 페이로드에 포함합니다.
   - relay는 해당 gateway identity에 위임된 relay handle과 등록 범위 send grant를 반환합니다.

4. `gateway -> relay`
   - gateway는 `push.apns.register`에서 받은 relay handle과 send grant를 저장합니다.
   - `push.test`, reconnect wake, wake nudges 시 gateway는 자신의 디바이스 identity로 send 요청에 서명합니다.
   - relay는 저장된 send grant와 gateway 서명을 모두, 등록 시 위임된 gateway identity에 대해 검증합니다.
   - 다른 gateway는 handle을 어떻게든 얻더라도 저장된 등록을 재사용할 수 없습니다.

5. `relay -> APNs`
   - relay는 공식 빌드용 프로덕션 APNs 자격 증명과 원시 APNs 토큰을 소유합니다.
   - gateway는 relay 기반 공식 빌드에 대해 원시 APNs 토큰을 저장하지 않습니다.
   - relay는 페어링된 gateway를 대신하여 최종 푸시를 APNs로 보냅니다.

이 설계가 만들어진 이유:

- 프로덕션 APNs 자격 증명을 사용자 gateway 밖에 두기 위해
- 공식 빌드의 원시 APNs 토큰을 gateway에 저장하지 않기 위해
- 공식/TestFlight OpenClaw 빌드에 대해서만 호스팅 relay 사용을 허용하기 위해
- 한 gateway가 다른 gateway 소유의 iOS 기기에 wake 푸시를 보내지 못하게 하기 위해

로컬/수동 빌드는 여전히 직접 APNs를 사용합니다. relay 없이 해당 빌드를 테스트하려면,
gateway에는 여전히 직접 APNs 자격 증명이 필요합니다:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

이 값들은 Fastlane 설정이 아니라 gateway 호스트 런타임 env var입니다. `apps/ios/fastlane/.env`는 `ASC_KEY_ID`, `ASC_ISSUER_ID` 같은 App Store Connect / TestFlight auth만 저장하며, 로컬 iOS 빌드용 직접 APNs 전달을 구성하지는 않습니다.

권장 gateway 호스트 저장 방식:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` 파일을 커밋하거나 리포지토리 체크아웃 아래에 두지 마세요.

## Discovery 경로

### Bonjour (LAN)

iOS 앱은 `local.`에서 `_openclaw-gw._tcp`를 브라우징하며, 구성된 경우 같은
광역 DNS-SD discovery 도메인도 브라우징합니다. 같은 LAN의 gateway는 `local.`에서 자동으로 나타납니다.
네트워크 간 discovery는 비콘 유형을 바꾸지 않고도 구성된 광역 도메인을 사용할 수 있습니다.

### Tailnet (네트워크 간)

mDNS가 차단되면 유니캐스트 DNS-SD 영역(도메인을 선택하세요. 예:
`openclaw.internal.`)과 Tailscale split DNS를 사용하세요.
CoreDNS 예시는 [Bonjour](/ko/gateway/bonjour)를 참고하세요.

### 수동 host/port

Settings에서 **Manual Host**를 활성화하고 gateway host + port(기본값 `18789`)를 입력하세요.

## Canvas + A2UI

iOS Node는 WKWebView canvas를 렌더링합니다. 이를 구동하려면 `node.invoke`를 사용하세요:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

참고:

- Gateway canvas host는 `/__openclaw__/canvas/`와 `/__openclaw__/a2ui/`를 제공합니다.
- 이는 Gateway HTTP 서버(`gateway.port`와 동일한 포트, 기본값 `18789`)에서 제공됩니다.
- iOS Node는 canvas host URL이 광고되면 연결 시 자동으로 A2UI로 이동합니다.
- 내장 scaffold로 돌아가려면 `canvas.navigate`와 `{"url":""}`를 사용하세요.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk mode

- Voice wake와 Talk mode는 Settings에서 사용할 수 있습니다.
- iOS는 백그라운드 오디오를 중단시킬 수 있으므로, 앱이 활성 상태가 아닐 때 음성 기능은 best-effort로 취급하세요.

## 일반적인 오류

- `NODE_BACKGROUND_UNAVAILABLE`: iOS 앱을 포그라운드로 가져오세요(canvas/camera/screen 명령에는 이것이 필요합니다).
- `A2UI_HOST_NOT_CONFIGURED`: Gateway가 canvas host URL을 광고하지 않았습니다. [Gateway configuration](/ko/gateway/configuration)의 `canvasHost`를 확인하세요.
- 페어링 프롬프트가 절대 나타나지 않음: `openclaw devices list`를 실행하고 수동으로 승인하세요.
- 재설치 후 다시 연결 실패: Keychain 페어링 토큰이 지워졌습니다. Node를 다시 페어링하세요.

## 관련 문서

- [페어링](/ko/channels/pairing)
- [Discovery](/ko/gateway/discovery)
- [Bonjour](/ko/gateway/bonjour)
