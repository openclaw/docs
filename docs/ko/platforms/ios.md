---
read_when:
    - iOS Node 페어링 또는 재연결
    - 직접 Apple Watch Node 활성화 또는 문제 해결
    - 소스에서 iOS 앱 실행하기
    - Gateway 검색 또는 canvas 명령 디버깅
summary: 'iOS Node 앱: Gateway 연결, 페어링, 캔버스 및 문제 해결'
title: iOS 앱
x-i18n:
    generated_at: "2026-07-16T12:45:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

제공 여부: 릴리스에서 활성화된 경우 iPhone 앱 빌드는 Apple 채널을 통해 배포됩니다. 로컬 개발 빌드는 소스에서 실행할 수도 있습니다.

## 기능

- WebSocket을 통해 Gateway에 연결합니다(LAN 또는 tailnet).
- 노드 기능인 Canvas, 화면 스냅샷, 카메라 캡처, 위치, 대화 모드, 음성 호출 및 선택적 건강 요약을 제공합니다.
- `node.invoke` 명령을 수신하고 노드 상태 이벤트를 보고합니다.
- Agents 화면(Files)에서 선택한 에이전트의 워크스페이스를 읽기 전용으로 탐색합니다. 디렉터리 드릴다운, 구문 강조 텍스트 미리보기, 이미지 미리보기 및 공유 시트를 통한 내보내기를 지원합니다. 쓰기 작업은 지원하지 않으며 미리보기 크기는 Gateway에서 제한합니다.
- 페어링된 Gateway별로 최근 채팅 세션과 대화 기록의 소규모 읽기 전용 오프라인 캐시를 유지합니다. 콜드 오픈 시 마지막으로 알려진 대화 기록을 즉시 표시하고 Gateway가 응답하면 새로 고치며, 연결이 끊긴 동안에도 최근 채팅을 탐색할 수 있고, 재설정/삭제 시 보호된 로컬 캐시를 제거합니다.
- 연결이 끊긴 동안 보낸 문자 메시지를 Gateway별 영구 보낼 편지함에 대기시킵니다(최대 50개). 대기 중인 말풍선은 대화 기록에 표시되고, 재연결 시 멱등성이 보장되는 재시도와 함께 순서대로 전송되며, 정식 기록에서 전송을 확인할 때까지 유지됩니다. 재시도/삭제 작업을 표시하기 전에 백오프를 적용해 재시도하며, 오프라인 상태가 48시간을 넘으면 전송하지 않고 만료됩니다. 재설정/삭제 시 캐시와 함께 대기열을 지웁니다.
- 요청 시 어시스턴트 메시지를 읽어 줍니다. Chat에서 메시지를 길게 누르고 **Listen**을 선택하십시오. 앱은 구성된 TTS 제공자를 통해 지원되는 Gateway `tts.speak` 클립을 재생하고, Gateway 오디오를 사용할 수 없거나 재생할 수 없으면 기기 내 음성으로 대체합니다. 세션을 전환하거나 앱이 백그라운드로 이동하면 재생이 중지됩니다.

## 요구 사항

- 다른 기기에서 실행 중인 Gateway(macOS, Linux 또는 WSL2를 통한 Windows).
- 네트워크 경로:
  - Bonjour를 통한 동일한 LAN, **또는**
  - 유니캐스트 DNS-SD를 통한 tailnet(도메인 예: `openclaw.internal.`), **또는**
  - 수동 호스트/포트(대체 경로).

## 빠른 시작(페어링 + 연결)

앱을 처음 실행하면 간단한 페어링 안내와
권한 페이지(알림, 카메라, 마이크, 사진, 연락처,
캘린더, 미리 알림, 위치)가 표시됩니다. 모든 권한 부여는 선택 사항이며
나중에 **Settings** -> **Permissions** 또는 iOS 설정 앱에서 변경할 수 있습니다.

1. 휴대폰에서 접근할 수 있는 경로를 사용하여 인증된 Gateway를 시작하십시오. 원격 경로로는 Tailscale
   Serve를 권장합니다.

```bash
openclaw gateway --port 18789 --tailscale serve
```

신뢰할 수 있는 동일 LAN 설정에서는 인증된 `gateway.bind: "lan"`을(를)
대신 사용하십시오. 기본 루프백 바인딩에는 휴대폰에서 접근할 수 없습니다. Gateway가
아직 구성되지 않았다면 먼저 `openclaw onboard`을(를) 실행하여 설정 코드
생성에 토큰 또는 비밀번호 인증 경로가 제공되도록 하십시오.

2. [Control UI](/ko/web/control-ui)를 열고 **Nodes**를 선택한 다음
   **Devices** 페이지에서 **Pair mobile device**를 클릭하십시오. 전체 액세스를 권장하며
   기본적으로 선택되어 있습니다. 관리용 Gateway 제어 기능을 제외하려는 경우에만 Limited access를
   선택한 다음 **Create setup code**를 클릭하십시오.

3. iOS 앱에서 **Settings** -> **Gateway**를 열고 QR 코드를 스캔하거나 설정
   코드를 붙여 넣은 다음 연결하십시오.

   설정 코드에 LAN 경로와 Tailscale Serve 경로가 모두 포함되어 있으면 앱이
   해당 경로를 순서대로 탐색하여 처음 접근 가능한 엔드포인트를 저장합니다.

4. 공식 앱은 자동으로 연결됩니다. **Pending approval**에 요청이
   표시되면 승인하기 전에 역할과 범위를 검토하십시오.

   **Settings → Gateway**에는 저장된 운영자 연결의 액세스 수준이
   **Full**인지 **Limited**인지 표시됩니다. 평문 LAN `ws://` 설정은 전달자 토큰의 안전을 위해 자동으로
   제한됩니다. 제한된 경우 `wss://` 또는
   Tailscale Serve를 구성하고 Control UI 또는 `openclaw qr`에서 새 전체 액세스 코드를 스캔한
   다음 다시 연결하여 설정과 업그레이드를 활성화하십시오.

Control UI 버튼을 사용하려면 `operator.admin`을(를) 사용하는 이미 페어링된 세션이 필요합니다.
터미널 대체 방법으로 iOS 앱에서 검색된 Gateway를 선택하거나
Manual Host를 활성화하고 호스트/포트를 입력한 다음 Gateway 호스트에서 요청을 승인하십시오.

```bash
openclaw devices list
openclaw devices approve <requestId>
```

앱이 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 재시도하면 이전 보류 중인 요청은 대체되고 새로운 `requestId`이(가) 생성됩니다. 승인 전에 `openclaw devices list`을(를) 다시 실행하십시오.

선택 사항: iOS 노드가 항상 엄격하게 통제되는 서브넷에서 연결되는 경우 명시적인 CIDR 또는 정확한 IP를 사용하여 최초 노드 자동 승인을 선택할 수 있습니다.

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

이 기능은 기본적으로 비활성화되어 있습니다. 요청된 범위가 없는 새로운 `role: node` 페어링에만 적용됩니다. 운영자/브라우저 페어링과 모든 역할, 범위, 메타데이터 또는 공개 키 변경에는 여전히 수동 승인이 필요합니다.

5. 연결을 확인하십시오.

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 건강 요약

iOS 노드는 현재
달력 날짜에 대한 선택적 읽기 전용 HealthKit 집계 정보를 반환할 수 있습니다. iPhone 동의와 명시적인 Gateway 명령 권한 부여는
서로 독립적인 관문입니다. 설정, 호출, 페이로드 필드, 개인정보 보호 동작 및 문제 해결 방법은
[HealthKit 요약](/platforms/ios-healthkit)을 참조하십시오.

기본적으로 Apple Watch 컴패니언은 기존 iPhone 릴레이를 계속 사용하며
별도의 Gateway 페어링이 필요하지 않습니다. Apple의 Watch 앱에서 Watch를 iPhone과 페어링하고
**Watch app -> My Watch -> Available
Apps**에서 OpenClaw를 설치한 다음 두 기기에서 OpenClaw를 한 번씩 여십시오.

## 명령 승인 검토

`operator.admin`을(를) 사용하는 운영자 연결 또는 Gateway가 명시적으로 대상으로 지정한 페어링된
`operator.approvals` 연결은 iPhone에서
보류 중인 실행 요청을 검토할 수 있습니다. 승인 카드에는 Gateway의
정리된 명령 미리보기, 경고, 호스트 컨텍스트, 만료 시간 및 해당 요청에서 제공하는
결정만 표시됩니다. 페어링된 Apple Watch는 기존 iPhone 릴레이를 통해 동일한
검토자용 안전 프롬프트를 수신하며, 간소화된
한 번 허용/거부 결정만 제공합니다. 직접 Watch Gateway 모드에서는
승인 프롬프트를 전달하지 않습니다.

승인 상태는 Control UI 및 지원되는 채팅 화면과 공유됩니다.
먼저 확정된 답변이 적용됩니다. 다른 화면에서 요청을 해결한 후, 원격
해결 알림 후, 그리고 해결 확인 응답이
손실되었을 가능성이 있을 때마다 iPhone과 Watch는 Gateway의 정식
종료 레코드를 가져옵니다. 이 읽기 결과에서 요청이
아직 보류 중인지 확인될 때까지 작업은 사용할 수 없는 상태로 유지됩니다.

승인 소유권은 선택한 Gateway에 귀속됩니다. Gateway를 전환해도
이전 프롬프트를 대체 연결에 적용할 수 없습니다. 통합 승인 메서드보다 오래된
Gateway는 배포된 실행 전용 메서드로 대체됩니다.
유지되는 종료 상태와 더 풍부한 화면 간 결과를 사용하려면 업데이트된
Gateway가 필요합니다.

## 선택적 직접 Apple Watch 노드

직접 모드에서는 Watch가 자체 서명된 노드 ID와 Gateway 연결을 갖습니다.
OpenClaw가 활성 상태이면 페어링된 iPhone을 사용할 수 없는 경우에도
Watch Wi-Fi 또는 셀룰러를 통해 지원되는 노드 명령이 계속 작동합니다.

요구 사항:

- iPhone이 `operator.admin` 범위로 Gateway에 연결되어 있어야 합니다.
- 설정 코드가 watchOS에서 신뢰하는 인증서를 사용하는 `wss://` Gateway 엔드포인트를 제공해야 하며,
  Watch는 해당 `https://` 오리진을 폴링합니다. 일반 HTTP 및
  자체 서명 또는 지문만을 기반으로 한 신뢰는 지원되지 않습니다. 엔드포인트 구성은 [Gateway 소유
  페어링](/ko/gateway/pairing)을 참조하십시오. 루프백, iPhone 전용
  및 tailnet 전용 경로에는 Watch에서 독립적으로 접근할 수 없습니다.
- 셀룰러를 사용하려면 셀룰러를 지원하고 서비스가 활성화된 Apple Watch가 필요합니다.
- Watch에서 OpenClaw가 활성 상태여야 합니다. Apple은 일반적인 watchOS 앱이
  범용 WebSocket/TCP 연결을 유지하는 것을 허용하지 않으므로 직접 노드는 짧은 HTTPS
  폴링을 사용하며 앱이 포그라운드로 돌아오면 다시 연결합니다. Apple의
  [watchOS 저수준 네트워킹 지침](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS)을 참조하십시오.

설정:

1. iPhone에서 **Settings -> Apple Watch**를 여십시오.
2. __Enable Direct Gateway Connection**을 탭하십시오.
3. 유효 시간이 짧은 설정 코드가 만료되기 전에 Watch에서 OpenClaw를 여십시오.
4. `openclaw nodes status`을(를) 사용하여 별도의 Apple Watch 행을 확인하십시오.

설정 코드에는 유효 시간이 짧은 노드 전용 부트스트랩 자격 증명이 포함됩니다. 만료될 때까지
비밀번호처럼 취급하십시오. iPhone에 저장된 Gateway
비밀번호나 토큰은 절대 포함되지 않습니다. 페어링 후 Watch는 자체 기기 토큰을 저장하고
부트스트랩 자격 증명을 삭제합니다. 직접 모드는 아래 명령만 지원합니다.
Chat, Talk, 승인 및 기존 `watch.*` 알림 흐름은 계속
iPhone 릴레이 기능으로 유지되며 페어링된 iPhone이 필요합니다.

직접 watchOS 노드 명령:

| 화면          | 명령                           | 참고                                                    |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| 기기          | `device.info`, `device.status` | Watch ID, 배터리, 온도, 저장 공간 및 네트워크입니다. |
| 알림          | `system.notify`                | 앱이 활성 상태일 때 사용할 수 있으며 Watch 권한이 필요합니다. |

watchOS는 타사 앱에 WebKit을 제공하지 않으므로 직접 Watch 노드는
Canvas 명령을 제공하지 않습니다.

## 공식 빌드용 릴레이 기반 푸시

공식적으로 배포되는 iOS 빌드는 원시 APNs 토큰을 Gateway에 게시하는 대신 외부 푸시 릴레이를 사용합니다. 공개 릴리스 경로의 공식 App Store 빌드는 `https://ios-push-relay.openclaw.ai`의 호스팅된 릴레이를 사용합니다. 이 기본 URL은 App Store 배포용으로 하드코딩되어 있으며 재정의 값을 읽지 않습니다.

사용자 지정 릴레이 배포에는 릴레이 URL이 Gateway 릴레이 URL과 일치하도록 의도적으로 분리된 iOS 빌드/배포 경로가 필요합니다. App Store 릴리스 경로에서는 사용자 지정 릴레이 URL을 절대 허용하지 않습니다. 사용자 지정 릴레이 빌드를 사용하는 경우 일치하는 Gateway 릴레이 URL을 설정하십시오.

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

- iOS 앱은 App Attest와 StoreKit 앱 거래 JWS를 사용하여 릴레이에 등록합니다.
- 릴레이는 불투명한 릴레이 핸들과 등록 범위의 전송 권한을 반환합니다.
- iOS 앱은 페어링된 Gateway ID(`gateway.identity.get`)를 가져와 릴레이 등록에 포함하므로 릴레이 기반 등록이 해당 특정 Gateway에 위임됩니다.
- 앱은 `push.apns.register`을(를) 사용하여 해당 릴레이 기반 등록을 페어링된 Gateway에 전달합니다.
- Gateway는 저장된 릴레이 핸들을 `push.test`, 백그라운드 깨우기 및 깨우기 신호에 사용합니다.
- 앱이 나중에 다른 Gateway 또는 다른 릴레이 기본 URL을 사용하는 빌드에 연결되면 이전 바인딩을 재사용하지 않고 릴레이 등록을 새로 고칩니다.

이 경로를 위해 Gateway에 **필요하지 않은** 항목: 배포 전체에 적용되는 릴레이 토큰과 공식 App Store 릴레이 기반 전송을 위한 직접 APNs 키가 필요하지 않습니다.

예상 운영자 흐름:

1. 공식 iOS 앱을 설치하십시오.
2. 선택 사항: 의도적으로 분리된 사용자 지정 릴레이 빌드를 사용하는 경우에만 Gateway에서 `gateway.push.apns.relay.baseUrl`을(를) 설정하십시오.
3. 앱을 Gateway와 페어링하고 연결이 완료될 때까지 기다리십시오.
4. APNs 토큰이 있고 운영자 세션이 연결되었으며 릴레이 등록에 성공하면 앱이 `push.apns.register`을(를) 게시합니다.
5. 그 후에는 `push.test`, 재연결 깨우기 및 깨우기 신호에서 저장된 릴레이 기반 등록을 사용할 수 있습니다.

## 백그라운드 활성 상태 비콘

iOS가 무음 푸시, 백그라운드 새로 고침 또는 주요 위치 변경 이벤트를 위해 앱을 깨우면, 앱은 짧은 Node 재연결을 시도한 다음 `event: "node.presence.alive"`을 사용하여 `node.event`을 호출합니다. Gateway는 인증된 Node 기기 ID가 확인된 후에만 페어링된 Node/기기 메타데이터에 이를 `lastSeenAtMs`/`lastSeenReason`로 기록합니다.

앱은 Gateway 응답에 `handled: true`이 포함된 경우에만 백그라운드 깨우기가 성공적으로 기록된 것으로 처리합니다. 이전 Gateway는 `{ "ok": true }`로 `node.event`을 확인 응답할 수 있습니다. 이 응답은 호환되지만 영구적인 마지막 확인 업데이트로 간주되지 않습니다.

호환성 참고:

- `OPENCLAW_APNS_RELAY_BASE_URL`은 여전히 Gateway의 임시 환경 변수 재정의로 작동합니다(`gateway.push.apns.relay.baseUrl`이 구성 우선 경로입니다).
- App Store 릴리스 빌드의 푸시 모드는 호스팅 릴레이 호스트를 하드코딩하며 릴레이 URL 재정의를 읽지 않습니다. `OPENCLAW_PUSH_RELAY_BASE_URL` 빌드 시간 환경 변수는 로컬/샌드박스 iOS 빌드 모드에만 영향을 줍니다.

## 인증 및 신뢰 흐름

릴레이는 공식 iOS 빌드에서 Gateway가 APNs에 직접 연결하는 방식으로는 제공할 수 없는 두 가지 제약 조건을 적용하기 위해 존재합니다.

- Apple을 통해 배포된 정품 OpenClaw iOS 빌드만 호스팅 릴레이를 사용할 수 있습니다.
- Gateway는 해당 Gateway와 페어링된 iOS 기기에만 릴레이 기반 푸시를 보낼 수 있습니다.

단계별 흐름:

1. `iOS app -> gateway`: 앱은 일반적인 Gateway 인증 흐름을 통해 Gateway와 페어링하여 인증된 Node 세션과 인증된 운영자 세션을 얻습니다. 운영자 세션은 `gateway.identity.get`을 호출합니다.
2. `iOS app -> relay`: 앱은 App Attest 증명과 StoreKit 앱 트랜잭션 JWS를 사용하여 HTTPS를 통해 릴레이 등록 엔드포인트를 호출합니다. 릴레이는 번들 ID, App Attest 증명, Apple 배포 증명을 검증하고 공식/프로덕션 배포 경로를 요구합니다. 로컬 빌드는 공식 Apple 배포 증명을 충족할 수 없으므로 로컬 Xcode/개발 빌드가 호스팅 릴레이를 사용하지 못하도록 차단하는 것이 바로 이 조건입니다.
3. `gateway identity delegation`: 릴레이에 등록하기 전에 앱은 `gateway.identity.get`에서 페어링된 Gateway ID를 가져와 릴레이 등록 페이로드에 포함합니다. 릴레이는 릴레이 핸들과 해당 Gateway ID에 위임된 등록 범위 전송 권한을 반환합니다.
4. `gateway -> relay`: Gateway는 `push.apns.register`에서 받은 릴레이 핸들과 전송 권한을 저장합니다. `push.test`, 재연결 깨우기 및 깨우기 신호 시 Gateway는 자체 기기 ID로 전송 요청에 서명합니다. 릴레이는 저장된 전송 권한과 Gateway 서명을 모두 등록 시 위임된 Gateway ID와 대조하여 검증합니다. 다른 Gateway는 어떤 방식으로든 핸들을 확보하더라도 저장된 등록을 재사용할 수 없습니다.
5. `relay -> APNs`: 릴레이는 공식 빌드의 프로덕션 APNs 자격 증명과 원시 APNs 토큰을 보유합니다. Gateway는 릴레이 기반 공식 빌드의 원시 APNs 토큰을 저장하지 않습니다. 릴레이가 페어링된 Gateway를 대신하여 최종 푸시를 APNs로 전송합니다.

이 설계를 만든 이유는 프로덕션 APNs 자격 증명을 사용자 Gateway에 두지 않고, 공식 빌드의 원시 APNs 토큰을 Gateway에 저장하지 않으며, 공식 OpenClaw iOS 빌드만 호스팅 릴레이를 사용하도록 허용하고, 한 Gateway가 다른 Gateway 소유의 iOS 기기에 깨우기 푸시를 보내지 못하도록 방지하기 위해서입니다.

로컬/수동 빌드는 계속 직접 APNs를 사용합니다. 릴레이 없이 이러한 빌드를 테스트하는 경우에도 Gateway에는 직접 APNs 자격 증명이 필요합니다.

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

이는 Fastlane 설정이 아니라 Gateway 호스트 런타임 환경 변수입니다. `apps/ios/fastlane/.env`은 `APP_STORE_CONNECT_KEY_ID` 및 `APP_STORE_CONNECT_ISSUER_ID` 같은 App Store Connect 인증 정보만 저장하며, 로컬 iOS 빌드의 직접 APNs 전송은 구성하지 않습니다.

`~/.openclaw/credentials/` 아래의 다른 제공자 자격 증명과 일관된 권장 Gateway 호스트 저장 방식:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

`.p8` 파일을 커밋하거나 저장소 체크아웃 아래에 두지 마십시오.

## 검색 경로

### Bonjour(LAN)

iOS 앱은 `local.`에서 `_openclaw-gw._tcp`을 검색하며, 구성된 경우 동일한 광역 DNS-SD 검색 도메인도 검색합니다. 동일 LAN의 Gateway는 `local.`을 통해 자동으로 표시됩니다. 네트워크 간 검색에는 비콘 유형을 변경하지 않고 구성된 광역 도메인을 사용할 수 있습니다.

### Tailnet(네트워크 간)

mDNS가 차단된 경우 유니캐스트 DNS-SD 영역을 사용하고(도메인 선택, 예: `openclaw.internal.`) Tailscale 분할 DNS를 사용하십시오. CoreDNS 예시는 [Bonjour](/ko/gateway/bonjour)를 참조하십시오.

### 수동 호스트/포트

Settings에서 **Manual Host**를 활성화하고 Gateway 호스트와 포트(기본값 `18789`)를 입력하십시오.

## 여러 Gateway

앱은 페어링된 모든 Gateway의 레지스트리를 유지하므로 다시 페어링하지 않고도 전환할 수 있습니다.

- **Settings -> Gateway**에는 활성 Gateway가 표시된 **Paired Gateways** 목록이 나타납니다. 항목을 탭하여 전환하면 앱이 현재 세션을 종료하고 선택한 Gateway에 다시 연결합니다. 둘 이상의 Gateway가 페어링되면 연결 행 옆에 빠른 전환 메뉴가 나타납니다.
- 자격 증명, TLS 신뢰 결정, Gateway별 기본 설정 및 캐시된 채팅 기록은 Gateway별로 저장됩니다. 전환 시 Gateway 간 상태가 섞이지 않으며 푸시 등록은 활성 Gateway를 따릅니다.
- 페어링된 Gateway를 스와이프하거나 컨텍스트 메뉴를 사용하여 **Forget**하면 해당 자격 증명, 기기 토큰, TLS 핀 및 캐시된 채팅이 제거됩니다.
- 검색된 Gateway로 전환하려면 네트워크에서 해당 Gateway가 보여야 합니다. 수동 Gateway는 저장된 호스트와 포트를 사용하여 다시 연결합니다.

## Canvas + A2UI

iOS Node는 WKWebView Canvas를 렌더링합니다. `node.invoke`을 사용하여 제어하십시오.

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

참고:

- Gateway Canvas 호스트는 Gateway HTTP 서버(`gateway.port`과 동일한 포트, 기본값 `18789`)에서 `/__openclaw__/canvas/` 및 `/__openclaw__/a2ui/`을 제공합니다.
- iOS Node는 내장 스캐폴드를 연결된 기본 보기로 유지합니다. `canvas.a2ui.push` 및 `canvas.a2ui.reset`은 앱에 번들로 포함되고 앱이 소유하는 A2UI 페이지를 사용합니다.
- 원격 Gateway A2UI 페이지는 iOS에서 렌더링 전용입니다. 네이티브 A2UI 버튼 동작은 앱에 번들로 포함되고 앱이 소유하는 페이지에서만 허용됩니다.
- `canvas.navigate` 및 `{"url":""}`을 사용하여 내장 스캐폴드로 돌아가십시오.

## Computer Use와의 관계

iOS 앱은 모바일 Node 표면이며 Codex Computer Use 백엔드가 아닙니다. Codex Computer Use와 `cua-driver mcp`은 MCP 도구를 통해 로컬 macOS 데스크톱을 제어합니다. iOS 앱은 `canvas.*`, `camera.*`, `screen.*`, `location.*`, `talk.*` 같은 OpenClaw Node 명령을 통해 iPhone 기능을 노출합니다.

에이전트는 Node 명령을 호출하여 OpenClaw를 통해 iOS 앱을 계속 조작할 수 있지만, 이러한 호출은 Gateway Node 프로토콜을 통과하며 iOS의 포그라운드/백그라운드 제한을 따릅니다. 로컬 데스크톱 제어에는 [Codex Computer Use](/ko/plugins/codex-computer-use)를 사용하고, iOS Node 기능에는 이 페이지를 사용하십시오.

### Canvas 평가/스냅샷

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 음성 깨우기 + 대화 모드

- 음성 깨우기와 대화 모드는 Settings에서 사용할 수 있습니다.
- `talk.realtime.transport`이 `webrtc`인 경우 OpenAI 실시간 대화는 클라이언트 소유 WebRTC를 사용합니다. 명시적인 `gateway-relay` 구성은 계속 Gateway가 소유합니다. [대화 모드](/ko/nodes/talk)를 참조하십시오.
- 대화 기능을 지원하는 iOS Node는 `talk` 기능을 알리고 `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel`, `talk.ptt.once`을 선언할 수 있습니다. Gateway는 신뢰할 수 있고 대화 기능을 지원하는 Node에 대해 이러한 눌러서 말하기 명령을 기본적으로 허용합니다.
- iOS는 백그라운드 오디오를 일시 중단할 수 있습니다. 앱이 활성 상태가 아닐 때는 음성 기능을 최선형 기능으로 간주하십시오.

## 일반적인 오류

- `NODE_BACKGROUND_UNAVAILABLE`: iOS 앱을 포그라운드로 전환하십시오(Canvas/카메라/화면 명령에 필요).
- `A2UI_HOST_UNAVAILABLE`: 앱 WebView에서 번들 A2UI 페이지에 접근할 수 없습니다. 앱을 Screen 탭의 포그라운드에 유지하고 다시 시도하십시오.
- 페어링 프롬프트가 나타나지 않음: `openclaw devices list`을 실행하고 수동으로 승인하십시오.
- Watch에 iPhone 상태가 표시되지 않음: iPhone이 `watch.status`에서 `watchPaired: true`
  및 `watchAppInstalled: true`을 보고하는지 확인하십시오. 페어링이 false이면 Apple의 Watch 앱에서
  Watch를 페어링하십시오. 설치가 false이면 **My Watch -> Available Apps**에서 컴패니언을
  설치하십시오. 어느 쪽이든 변경한 후 Watch에서 OpenClaw를 한 번 여십시오. 즉시 연결하려면
  여전히 두 앱이 모두 실행 중이어야 하지만, 대기열에 저장된 업데이트는 나중에 백그라운드에서 도착할 수 있습니다.
- 재설치 후 재연결 실패: Keychain 페어링 토큰이 삭제되었습니다. Node를 다시 페어링하십시오.

## 관련 문서

- [페어링](/ko/channels/pairing)
- [검색](/ko/gateway/discovery)
- [Bonjour](/ko/gateway/bonjour)
