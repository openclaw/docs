---
read_when:
    - 다이렉트 메시지 접근 제어 설정하기
    - 새 iOS/Android Node 페어링
    - OpenClaw 보안 태세 검토
summary: '페어링 개요: 나에게 DM을 보낼 수 있는 사람 + 참여할 수 있는 노드 승인'
title: 페어링
x-i18n:
    generated_at: "2026-05-07T01:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing"은 OpenClaw의 명시적 액세스 승인 단계입니다.
두 곳에서 사용됩니다.

1. **DM Pairing**(봇과 대화할 수 있는 사람)
2. **Node Pairing**(Gateway 네트워크에 참여할 수 있는 기기/노드)

보안 맥락: [보안](/ko/gateway/security)

## 1) DM Pairing(인바운드 채팅 액세스)

채널이 DM 정책 `pairing`으로 구성되면 알 수 없는 발신자는 짧은 코드를 받고, 승인하기 전까지 해당 메시지는 **처리되지 않습니다**.

기본 DM 정책은 다음 문서에 설명되어 있습니다: [보안](/ko/gateway/security)

`dmPolicy: "open"`은 유효한 DM 허용 목록에 `"*"`가 포함된 경우에만 공개 상태입니다.
설정과 검증은 공개-오픈 구성에 이 와일드카드를 요구합니다. 기존
상태에 구체적인 `allowFrom` 항목과 함께 `open`이 포함되어 있으면, 런타임은 여전히
해당 발신자만 허용하며 Pairing 저장소 승인은 `open` 액세스를 확장하지 않습니다.

Pairing 코드:

- 8자, 대문자, 혼동하기 쉬운 문자 없음(`0O1I`).
- **1시간 후 만료됩니다**. 봇은 새 요청이 생성될 때만 Pairing 메시지를 보냅니다(발신자당 대략 시간당 한 번).
- 대기 중인 DM Pairing 요청은 기본적으로 **채널당 3개**로 제한됩니다. 추가 요청은 하나가 만료되거나 승인될 때까지 무시됩니다.

### 발신자 승인

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

명령 소유자가 아직 구성되어 있지 않으면, DM Pairing 코드를 승인할 때
`commands.ownerAllowFrom`도 승인된 발신자(예: `telegram:123456789`)로 부트스트랩됩니다.
이렇게 하면 최초 설정에서 권한 있는 명령과 exec 승인 프롬프트를 위한 명시적 소유자가 제공됩니다.
소유자가 생긴 뒤에는 이후 Pairing 승인이 DM 액세스만 부여하며,
소유자를 더 추가하지 않습니다.

지원되는 채널: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 재사용 가능한 발신자 그룹

동일한 신뢰할 수 있는 발신자 집합을 여러 메시지 채널에 적용하거나
DM과 그룹 허용 목록 모두에 적용해야 할 때 최상위 `accessGroups`를 사용합니다.

정적 그룹은 `type: "message.senders"`를 사용하며, 채널 허용 목록에서
`accessGroup:<name>`으로 참조됩니다.

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

액세스 그룹은 여기에서 자세히 설명되어 있습니다: [액세스 그룹](/ko/channels/access-groups)

### 상태가 저장되는 위치

`~/.openclaw/credentials/` 아래에 저장됩니다.

- 대기 중인 요청: `<channel>-pairing.json`
- 승인된 허용 목록 저장소:
  - 기본 계정: `<channel>-allowFrom.json`
  - 기본 계정이 아닌 계정: `<channel>-<accountId>-allowFrom.json`

계정 범위 지정 동작:

- 기본 계정이 아닌 계정은 범위가 지정된 자신의 허용 목록 파일만 읽고 씁니다.
- 기본 계정은 채널 범위의 비범위 허용 목록 파일을 사용합니다.

이를 민감한 정보로 취급하세요(어시스턴트 액세스를 제어합니다).

<Note>
Pairing 허용 목록 저장소는 DM 액세스용입니다. 그룹 권한 부여는 별개입니다.
DM Pairing 코드를 승인해도 해당 발신자가 그룹에서 그룹
명령을 실행하거나 봇을 제어할 수 있도록 자동으로 허용되지는 않습니다. 최초 소유자 부트스트랩은
`commands.ownerAllowFrom`의 별도 구성 상태이며, 그룹 채팅 전달은 여전히
채널의 그룹 허용 목록(예: 채널에 따라 `groupAllowFrom`, `groups`, 또는 그룹별
혹은 주제별 재정의)을 따릅니다.
</Note>

## 2) Node 기기 Pairing(iOS/Android/macOS/headless 노드)

노드는 `role: node`를 가진 **기기**로 Gateway에 연결됩니다. Gateway는
승인되어야 하는 기기 Pairing 요청을 생성합니다.

### Telegram으로 Pairing(iOS에 권장)

`device-pair` Plugin을 사용하면 최초 기기 Pairing을 Telegram에서 완전히 진행할 수 있습니다.

1. Telegram에서 봇에게 메시지를 보냅니다: `/pair`
2. 봇은 두 개의 메시지로 답장합니다. 하나는 안내 메시지이고, 다른 하나는 별도의 **설정 코드** 메시지입니다(Telegram에서 복사/붙여넣기 쉬움).
3. 휴대폰에서 OpenClaw iOS 앱 → 설정 → Gateway를 엽니다.
4. QR 코드를 스캔하거나 설정 코드를 붙여넣고 연결합니다.
5. Telegram으로 돌아가 `/pair pending`을 실행한 뒤(요청 ID, 역할, 범위 검토) 승인합니다.

설정 코드는 다음을 포함하는 base64 인코딩 JSON 페이로드입니다.

- `url`: Gateway WebSocket URL(`ws://...` 또는 `wss://...`)
- `bootstrapToken`: 초기 Pairing 핸드셰이크에 사용되는 짧은 수명의 단일 기기 부트스트랩 토큰

해당 부트스트랩 토큰은 내장 Pairing 부트스트랩 프로필을 전달합니다.

- 기본적으로 넘겨받은 `node` 토큰은 `scopes: []`로 유지됩니다.
- 넘겨받은 모든 `operator` 토큰은 부트스트랩 허용 목록으로 제한됩니다:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- 부트스트랩 범위 검사는 하나의 평면 범위 풀이 아니라 역할 접두사가 붙습니다:
  operator 범위 항목은 operator 요청만 충족하며, operator가 아닌 역할은
  여전히 자신의 역할 접두사 아래에서 범위를 요청해야 합니다.
- 이후 토큰 회전/철회는 기기의 승인된 역할 계약과
  호출자 세션의 operator 범위 모두에 의해 계속 제한됩니다.

설정 코드가 유효한 동안에는 비밀번호처럼 취급하세요.

Tailscale, 공개 또는 기타 원격 모바일 Pairing의 경우 Tailscale Serve/Funnel
또는 다른 `wss://` Gateway URL을 사용하세요. 평문 `ws://` 설정 코드는
루프백, 사설 LAN 주소, `.local` Bonjour 호스트, Android
에뮬레이터 호스트에 대해서만 허용됩니다. Tailnet CGNAT 주소, `.ts.net` 이름, 공개 호스트는 여전히
QR/설정 코드 발급 전에 실패로 닫힙니다.

### Node 기기 승인

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

승인을 수행하는 Pairing된 기기 세션이 Pairing 전용 범위로 열려 있어
명시적 승인이 거부되면, CLI는 동일한 요청을
`operator.admin`으로 다시 시도합니다. 이를 통해 기존의 관리자 권한이 가능한 Pairing된 기기가
`devices/paired.json`을 직접 편집하지 않고도 새 Control UI/브라우저 Pairing을 복구할 수 있습니다.
Gateway는 다시 시도된 연결을 여전히 검증하며, `operator.admin`으로 인증할 수 없는 토큰은
계속 차단됩니다.

동일한 기기가 다른 인증 세부 정보(예: 다른
역할/범위/공개 키)로 다시 시도하면 이전 대기 요청은 대체되고 새
`requestId`가 생성됩니다.

<Note>
이미 Pairing된 기기는 더 넓은 액세스를 조용히 얻지 않습니다. 더 많은 범위나 더 넓은 역할을 요청하며 다시 연결하면 OpenClaw는 기존 승인을 그대로 유지하고 새로운 대기 중 업그레이드 요청을 생성합니다. 승인하기 전에 `openclaw devices list`를 사용해 현재 승인된 액세스와 새로 요청된 액세스를 비교하세요.
</Note>

### 선택 사항: 신뢰할 수 있는 CIDR Node 자동 승인

기기 Pairing은 기본적으로 수동으로 유지됩니다. 엄격히 제어되는 Node 네트워크의 경우,
명시적 CIDR 또는 정확한 IP를 사용해 최초 Node 자동 승인을 선택적으로 활성화할 수 있습니다.

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

이는 요청된 범위가 없는 새로운 `role: node` Pairing 요청에만 적용됩니다.
Operator, 브라우저, Control UI, WebChat 클라이언트는 여전히 수동
승인이 필요합니다. 역할, 범위, 메타데이터, 공개 키 변경도 여전히 수동
승인이 필요합니다.

### Node Pairing 상태 저장소

`~/.openclaw/devices/` 아래에 저장됩니다.

- `pending.json`(짧은 수명, 대기 중인 요청은 만료됨)
- `paired.json`(Pairing된 기기 + 토큰)

### 참고

- 레거시 `node.pair.*` API(CLI: `openclaw nodes pending|approve|reject|remove|rename`)는
  별도의 Gateway 소유 Pairing 저장소입니다. WS 노드는 여전히 기기 Pairing이 필요합니다.
- Pairing 레코드는 승인된 역할에 대한 지속적인 단일 진실 공급원입니다. 활성
  기기 토큰은 해당 승인된 역할 집합으로 계속 제한됩니다. 승인된 역할 외부의 잘못된 토큰 항목은
  새 액세스를 만들지 않습니다.

## 관련 문서

- 보안 모델 + 프롬프트 인젝션: [보안](/ko/gateway/security)
- 안전한 업데이트(doctor 실행): [업데이트](/ko/install/updating)
- 채널 구성:
  - Telegram: [Telegram](/ko/channels/telegram)
  - WhatsApp: [WhatsApp](/ko/channels/whatsapp)
  - Signal: [Signal](/ko/channels/signal)
  - iMessage: [iMessage](/ko/channels/imessage)
  - BlueBubbles(레거시 iMessage 브리지): [BlueBubbles](/ko/channels/bluebubbles)
  - Discord: [Discord](/ko/channels/discord)
  - Slack: [Slack](/ko/channels/slack)
