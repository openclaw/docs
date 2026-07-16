---
read_when:
    - DM 접근 제어 설정하기
    - 새 iOS/Android Node 페어링하기
    - OpenClaw 보안 태세 검토하기
summary: '페어링 개요: 나에게 DM을 보낼 수 있는 사용자와 참여할 수 있는 Node 승인하기'
title: 페어링
x-i18n:
    generated_at: "2026-07-16T12:22:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

"페어링"은 OpenClaw의 명시적 접근 승인 단계입니다.
다음 두 곳에서 사용됩니다:

1. **DM 페어링**(봇과 대화할 수 있는 사용자)
2. **Node 페어링**(Gateway 네트워크에 참여할 수 있는 기기/Node)

보안 관련 정보: [보안](/ko/gateway/security)

## 1) DM 페어링(수신 채팅 접근)

채널이 DM 정책 `pairing`으로 구성된 경우, 알 수 없는 발신자에게 짧은 코드가 전송되며 승인할 때까지 해당 메시지는 **처리되지 않습니다**.

기본 DM 정책은 다음 문서에서 설명합니다: [보안](/ko/gateway/security)

`dmPolicy: "open"`은 유효한 DM 허용 목록에 `"*"`이 포함된 경우에만 공개됩니다.
공개형 구성의 설정 및 검증에는 해당 와일드카드가 필요합니다. 기존
상태의 `open`에 구체적인 `allowFrom` 항목이 포함되어 있으면 런타임은 계속해서
해당 발신자만 허용하며, 페어링 저장소의 승인은 `open` 접근 범위를 확장하지 않습니다.

페어링 코드:

- 8자, 대문자이며 혼동하기 쉬운 문자(`0O1I`)는 포함하지 않습니다.
- **1시간 후 만료됩니다**. 봇은 새 요청이 생성될 때만 페어링 메시지를 전송합니다(발신자별로 대략 한 시간에 한 번).
- 대기 중인 DM 페어링 요청은 **채널 계정당 3개**로 제한되며, 하나가 만료되거나 승인될 때까지 추가 요청은 무시됩니다.

### 발신자 승인

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

동일한 채널에서 요청자에게 알리려면 승인 명령에 `--notify`을 추가하십시오. 다중 계정 채널에는 `--account <id>`을 사용합니다.

아직 명령 소유자가 구성되지 않은 경우 DM 페어링 코드를 승인하면
`commands.ownerAllowFrom`도 승인된 발신자(예: `telegram:123456789`)로 초기 설정됩니다.
이를 통해 최초 설정 시 권한이 필요한 명령 및 실행 승인 프롬프트를 위한 명시적 소유자가 지정됩니다.
소유자가 생긴 이후의 페어링 승인은 DM 접근 권한만 부여하며
소유자를 추가하지 않습니다.

지원되는 채널(페어링을 선언하는 설치된 모든 채널 Plugin이며, `openclaw-weixin` 같은 외부 Plugin으로 추가 가능): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 재사용 가능한 발신자 그룹

동일한 신뢰할 수 있는 발신자 집합을 여러 메시지 채널 또는 DM과 그룹
허용 목록 모두에 적용하려면 최상위 `accessGroups`을 사용하십시오.

정적 그룹은 `type: "message.senders"`을 사용하며 채널 허용 목록에서
`accessGroup:<name>`으로 참조합니다:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

접근 그룹은 다음 문서에서 자세히 설명합니다: [접근 그룹](/ko/channels/access-groups)

### 상태 저장 위치

공유 SQLite 상태 데이터베이스의
`~/.openclaw/state/openclaw.sqlite`에 저장됩니다:

- `channel_pairing_requests`의 대기 중인 요청
- `channel_pairing_allow_entries`의 승인된 발신자

계정 범위 지정 동작:

- 각 요청과 승인된 발신자는 채널 및 계정별로 키가 지정됩니다
- 런타임은 정규 SQLite 행만 읽으며 레거시 파일을 병합하지 않습니다

이전 Gateway는 `~/.openclaw/credentials/` 아래의 `<channel>-pairing.json` 및
`<channel>-<accountId>-allowFrom.json`에 기록했습니다.
시작 마이그레이션과 `openclaw doctor --fix`은 해당 파일을 SQLite로 가져오고
가져오기에 성공한 각 원본을 제거합니다. 이 행들은 어시스턴트 접근을 제어하므로
SQLite 데이터베이스를 민감한 정보로 취급하십시오.

<Note>
페어링 허용 목록 저장소는 DM 접근용입니다. 그룹 권한 부여는 별개입니다.
DM 페어링 코드를 승인해도 해당 발신자가 그룹 명령을 실행하거나
그룹에서 봇을 제어할 수 있도록 자동으로 허용되지는 않습니다. 최초 소유자 초기 설정은
`commands.ownerAllowFrom`의 별도 구성 상태이며, 그룹 채팅 전송에는 계속해서
채널의 그룹 허용 목록(예: `groupAllowFrom`, `groups` 또는 채널에 따른 그룹별
또는 주제별 재정의)이 적용됩니다.
</Note>

## 2) Node 기기 페어링(iOS/Android/macOS/헤드리스 Node)

Node는 `role: node`을 사용하는 **기기**로 Gateway에 연결됩니다. Gateway는
승인이 필요한 기기 페어링 요청을 생성합니다.

### Control UI에서 페어링(권장)

`operator.admin` 접근 권한이 있는 이미 연결된 Control UI 세션을 사용하십시오:

1. Control UI를 열고 **Settings → Devices**로 이동하십시오.
2. **Devices** 페이지에서 **Pair mobile device**를 클릭하십시오.
3. **Full access (recommended)**를 유지하거나, 관리용 Gateway 제어 기능을 제외하려면
   **Limited access**를 선택하십시오.
4. **Create setup code**를 클릭하십시오.
5. 휴대전화에서 OpenClaw 앱 → **Settings** → **Gateway**를 여십시오.
6. QR 코드를 스캔하거나 설정 코드를 붙여 넣은 다음 연결하십시오.

공식 OpenClaw iOS 및 Android 앱은 설정 코드 메타데이터가 일치하면
자동으로 승인됩니다. **Pending approval**에 요청이 표시되는 경우(예:
비공식 클라이언트 또는 일치하지 않는 메타데이터) 승인하기 전에 역할과
범위를 검토하십시오.

현재 Control UI 세션에 관리자 접근 권한이 없으면 버튼이 비활성화됩니다.
이 경우 Gateway 호스트에서 아래의 CLI 승인 절차를 사용하십시오.

### Telegram을 통한 페어링

`device-pair` Plugin을 사용하는 경우 최초 기기 페어링을 Telegram에서 완전히 수행할 수 있습니다:

1. Telegram에서 봇에 다음 메시지를 보내십시오: `/pair`
2. 봇은 안내 메시지와 별도의 **설정 코드** 메시지(Telegram에서 쉽게 복사하여 붙여 넣을 수 있음), 총 두 개의 메시지로 응답합니다.
3. 휴대전화에서 OpenClaw iOS 앱 → Settings → Gateway를 여십시오.
4. QR 코드(`/pair qr`)를 스캔하거나 설정 코드를 붙여 넣고 연결하십시오.
5. 공식 모바일 앱은 자동으로 연결됩니다. `/pair pending`에 요청이 표시되면
   승인하기 전에 역할과 범위를 검토하십시오.

설정 코드는 다음을 포함하는 base64 인코딩 JSON 페이로드입니다:

- `url`: Gateway WebSocket URL(`ws://...` 또는 `wss://...`)
- `urls`: 사용 가능한 경우 모바일 앱이 시도할 수 있는 순서가 지정된 LAN/Tailnet 경로
- `bootstrapToken`: 초기 페어링 핸드셰이크를 위한 일회용 부트스트랩 토큰이며, Gateway에서 10분 후 만료됩니다

페어링이 완료되면 `/pair cleanup`을 실행하여 사용하지 않은 설정 코드를 무효화하십시오.

해당 부트스트랩 토큰에는 내장 페어링 부트스트랩 프로필이 포함됩니다:

- 보안 `wss://` 설정(또는 동일 호스트 루프백)은 기본적으로 `node` 및 전체
  네이티브 모바일 `operator` 접근 권한을 사용합니다
- 전달된 `node` 토큰은 계속 `scopes: []`으로 유지됩니다
- 기본적으로 전달된 `operator` 토큰에는 `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` 및
  `operator.write`이 포함됩니다
- Control UI **Limited access** 및 `openclaw qr --limited`은
  다른 운영자 범위는 유지하면서 `operator.admin`을 제외합니다
- 평문 LAN `ws://` 설정은 자동으로 동일한 제한 프로필을 사용합니다.
  전체 접근 권한을 얻으려면 `wss://` 또는 Tailscale Serve를 구성하고 새 코드를 생성하십시오
- 이후의 토큰 교체/해지는 기기의 승인된
  역할 계약과 호출자 세션의 운영자 범위 모두에 의해 계속 제한됩니다

설정 코드가 유효한 동안에는 비밀번호처럼 취급하십시오.

iOS 및 Android의 **Settings → Gateway** 페이지에는 **Full** 또는 **Limited**
접근 권한이 표시됩니다. 제한된 휴대전화를 업그레이드하려면 먼저 보안 `wss://` 또는
Tailscale Serve 경로를 구성한 다음 새로운 전체 접근 설정 코드를 생성하고 해당 설정 페이지에서
스캔하거나 붙여 넣은 후 다시 연결하십시오.

Tailscale, 공개 또는 기타 원격 모바일 페어링에는 Tailscale Serve/Funnel
또는 다른 `wss://` Gateway URL을 사용하십시오. 평문 `ws://` 설정 코드는
루프백, 비공개 LAN 주소, `.local` Bonjour 호스트 및 Android
에뮬레이터 호스트에만 허용됩니다. 루프백이 아닌 평문 경로에는 제한된 접근 권한이 부여됩니다. Tailnet
CGNAT 주소, `.ts.net` 이름 및 공개 호스트는 QR/설정 코드가 발급되기 전에
여전히 실패 시 차단됩니다.

`gateway.bind=lan` 설정 URL의 경우 OpenClaw는 활성 Gateway의 루프백 포트를
프록시하는 영구 Tailscale Serve HTTPS 루트를 감지하여 LAN 경로와 함께 표시합니다.
설정 명령은 `lan`에만 이 대체 경로를 추가하며,
`custom` 및 `tailnet`은 명시적으로 표시된 경로를 유지합니다.
iOS 앱은 표시된 경로를 순서대로 탐색하고 처음 연결 가능한
엔드포인트를 저장합니다.

### Node 기기 승인

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

승인을 수행하는 페어링된 기기 세션이 페어링 전용 범위로 열려 있어
명시적 승인이 거부된 경우 CLI는 `operator.admin`을 사용하여 동일한 요청을
재시도합니다. 이를 통해 기존의 관리자 기능이 있는 페어링된 기기는 페어링 저장소를
직접 편집하지 않고도 새로운 Control UI/브라우저 페어링을 복구할 수 있습니다.
Gateway는 재시도된 연결을 계속 검증하며, `operator.admin`으로 인증할 수 없는
토큰은 계속 차단됩니다.

동일한 기기가 다른 인증 세부 정보(예: 다른 역할/범위/공개 키)로 재시도하면
이전의 대기 중인 요청은 대체되고 새 `requestId`이 생성됩니다.

<Note>
이미 페어링된 기기의 접근 권한이 묵시적으로 확대되지는 않습니다. 더 많은 범위나 더 광범위한 역할을 요청하며 다시 연결하면 OpenClaw는 기존 승인을 그대로 유지하고 새로운 대기 중인 업그레이드 요청을 생성합니다. 승인하기 전에 `openclaw devices list`을 사용하여 현재 승인된 접근 권한과 새로 요청된 접근 권한을 비교하십시오.
</Note>

### 선택적 신뢰 CIDR Node 자동 승인

기기 페어링은 기본적으로 수동입니다. 엄격하게 통제되는 Node 네트워크에서는
명시적 CIDR 또는 정확한 IP를 사용하여 최초 Node 자동 승인을 활성화할 수 있습니다:

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

이는 요청된 범위가 없는 새로운 `role: node` 페어링 요청에만 적용됩니다.
운영자, 브라우저, Control UI 및 WebChat 클라이언트는 계속 수동
승인이 필요합니다. 역할, 범위, 메타데이터 및 공개 키 변경에도 계속 수동
승인이 필요합니다.

### Node 페어링 상태 저장소

공유 SQLite 상태 데이터베이스의 `~/.openclaw/state/openclaw.sqlite`에 저장됩니다:

- 대기 중인 기기 페어링 요청(단기 유지, 5분 후 만료)
- 페어링된 기기 + 토큰

이전 Gateway는 이 상태를 `~/.openclaw/devices/*.json`에 보관했으며, 해당 파일은
Gateway 시작 시 SQLite로 가져온 후 `.migrated` 접미사를 붙여 보관됩니다.

### 참고

- `node.pair.*` API(CLI: `openclaw nodes pending|approve|reject|remove|rename`)는
  동일한 페어링된 기기 레코드에 저장된 Node 기능 승인을 관리합니다. WS Node에는
  여전히 기기 페어링이 필요합니다. [Node 페어링](/ko/gateway/pairing)을 참조하십시오.
- 페어링 레코드는 승인된 역할에 대한 영구적인 신뢰 기준입니다. 활성
  기기 토큰은 승인된 해당 역할 집합으로 계속 제한되며, 승인된 역할 외부의
  임의 토큰 항목이 새로운 접근 권한을 생성하지는 않습니다.

## 관련 문서

- 보안 모델 + 프롬프트 인젝션: [보안](/ko/gateway/security)
- 안전하게 업데이트하기(doctor 실행): [업데이트](/ko/install/updating)
- 채널 구성:
  - Telegram: [Telegram](/ko/channels/telegram)
  - WhatsApp: [WhatsApp](/ko/channels/whatsapp)
  - Signal: [Signal](/ko/channels/signal)
  - iMessage: [iMessage](/ko/channels/imessage)
  - Discord: [Discord](/ko/channels/discord)
  - Slack: [Slack](/ko/channels/slack)
