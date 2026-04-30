---
read_when:
    - DM 접근 제어 설정
    - 새 iOS/Android Node 페어링
    - OpenClaw 보안 태세 검토
summary: '페어링 개요: 나에게 DM을 보낼 수 있는 사람과 참여할 수 있는 Node 승인하기'
title: 페어링
x-i18n:
    generated_at: "2026-04-30T06:19:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
    source_path: channels/pairing.md
    workflow: 16
---

“페어링”은 OpenClaw의 명시적인 접근 승인 단계입니다.
두 곳에서 사용됩니다.

1. **DM 페어링**(봇과 대화할 수 있는 사람)
2. **Node 페어링**(Gateway 네트워크에 참여할 수 있는 기기/Node)

보안 컨텍스트: [보안](/ko/gateway/security)

## 1) DM 페어링(인바운드 채팅 접근)

채널이 DM 정책 `pairing`으로 구성된 경우, 알 수 없는 발신자는 짧은 코드를 받으며 승인하기 전까지 해당 메시지는 **처리되지 않습니다**.

기본 DM 정책은 다음 문서에 설명되어 있습니다: [보안](/ko/gateway/security)

`dmPolicy: "open"`은 유효한 DM 허용 목록에 `"*"`가 포함된 경우에만 공개 상태입니다.
공개 개방형 구성을 설정하고 검증하려면 이 와일드카드가 필요합니다. 기존
상태에 구체적인 `allowFrom` 항목과 함께 `open`이 포함되어 있으면, 런타임은 여전히
해당 발신자만 허용하며, 페어링 저장소 승인은 `open` 접근 범위를 넓히지 않습니다.

페어링 코드:

- 8자, 대문자, 혼동하기 쉬운 문자 없음(`0O1I`).
- **1시간 후 만료**됩니다. 봇은 새 요청이 생성될 때만 페어링 메시지를 보냅니다(발신자당 대략 시간당 한 번).
- 대기 중인 DM 페어링 요청은 기본적으로 **채널당 3개**로 제한됩니다. 추가 요청은 하나가 만료되거나 승인될 때까지 무시됩니다.

### 발신자 승인

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

아직 명령 소유자가 구성되지 않은 경우, DM 페어링 코드를 승인하면
`commands.ownerAllowFrom`도 승인된 발신자(예: `telegram:123456789`)로 부트스트랩됩니다.
이를 통해 최초 설정 시 권한 있는 명령과 실행 승인 프롬프트에 대한 명시적 소유자가 생깁니다.
소유자가 존재한 뒤에는 이후 페어링 승인은 DM 접근만 허용하며
소유자를 추가하지 않습니다.

지원되는 채널: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### 상태가 저장되는 위치

`~/.openclaw/credentials/` 아래에 저장됩니다.

- 대기 중인 요청: `<channel>-pairing.json`
- 승인된 허용 목록 저장소:
  - 기본 계정: `<channel>-allowFrom.json`
  - 기본이 아닌 계정: `<channel>-<accountId>-allowFrom.json`

계정 범위 지정 동작:

- 기본이 아닌 계정은 해당 범위가 지정된 허용 목록 파일만 읽고 씁니다.
- 기본 계정은 채널 범위의 범위 미지정 허용 목록 파일을 사용합니다.

이 파일들은 민감한 정보로 취급하세요(어시스턴트 접근을 제어합니다).

<Note>
페어링 허용 목록 저장소는 DM 접근용입니다. 그룹 권한 부여는 별도입니다.
DM 페어링 코드를 승인해도 해당 발신자가 자동으로 그룹
명령을 실행하거나 그룹에서 봇을 제어할 수 있게 되지는 않습니다. 최초 소유자 부트스트랩은
`commands.ownerAllowFrom`의 별도 구성 상태이며, 그룹 채팅 전달은 여전히
채널의 그룹 허용 목록(예: `groupAllowFrom`, `groups`, 또는 채널에 따라 그룹별
또는 주제별 재정의)을 따릅니다.
</Note>

## 2) Node 기기 페어링(iOS/Android/macOS/헤드리스 Node)

Node는 `role: node`가 있는 **기기**로 Gateway에 연결됩니다. Gateway는
승인해야 하는 기기 페어링 요청을 생성합니다.

### Telegram을 통한 페어링(iOS에 권장)

`device-pair` Plugin을 사용하면 최초 기기 페어링을 Telegram에서 완전히 진행할 수 있습니다.

1. Telegram에서 봇에 메시지를 보냅니다: `/pair`
2. 봇은 두 개의 메시지로 응답합니다. 안내 메시지와 별도의 **설정 코드** 메시지입니다(Telegram에서 복사/붙여넣기 쉬움).
3. 휴대폰에서 OpenClaw iOS 앱 → 설정 → Gateway를 엽니다.
4. 설정 코드를 붙여넣고 연결합니다.
5. Telegram으로 돌아가서: `/pair pending`(요청 ID, 역할, 범위 검토) 후 승인합니다.

설정 코드는 다음을 포함하는 base64 인코딩 JSON 페이로드입니다.

- `url`: Gateway WebSocket URL(`ws://...` 또는 `wss://...`)
- `bootstrapToken`: 초기 페어링 핸드셰이크에 사용되는 수명이 짧은 단일 기기 부트스트랩 토큰

해당 부트스트랩 토큰은 내장 페어링 부트스트랩 프로필을 전달합니다.

- 기본으로 인계된 `node` 토큰은 `scopes: []`로 유지됩니다.
- 인계된 모든 `operator` 토큰은 부트스트랩 허용 목록으로 제한됩니다:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- 부트스트랩 범위 검사는 하나의 평면 범위 풀이 아니라 역할 접두사가 붙습니다:
  operator 범위 항목은 operator 요청만 충족하며, operator가 아닌 역할은
  여전히 자신의 역할 접두사 아래에서 범위를 요청해야 합니다.
- 이후 토큰 교체/해지는 기기의 승인된
  역할 계약과 호출자 세션의 operator 범위 양쪽에 의해 계속 제한됩니다.

설정 코드는 유효한 동안 비밀번호처럼 취급하세요.

### Node 기기 승인

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

동일한 기기가 다른 인증 세부 정보(예: 다른
역할/범위/공개 키)로 다시 시도하면, 이전 대기 요청은 대체되고 새
`requestId`가 생성됩니다.

<Note>
이미 페어링된 기기는 조용히 더 넓은 접근 권한을 얻지 않습니다. 더 많은 범위나 더 넓은 역할을 요청하며 다시 연결하면, OpenClaw는 기존 승인을 그대로 유지하고 새로운 대기 중인 업그레이드 요청을 생성합니다. 승인하기 전에 `openclaw devices list`를 사용해 현재 승인된 접근 권한과 새로 요청된 접근 권한을 비교하세요.
</Note>

### 선택적 신뢰 CIDR Node 자동 승인

기기 페어링은 기본적으로 수동으로 유지됩니다. 엄격하게 제어되는 Node 네트워크의 경우,
명시적 CIDR 또는 정확한 IP로 최초 Node 자동 승인을 선택할 수 있습니다.

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
Operator, 브라우저, Control UI, WebChat 클라이언트는 여전히 수동
승인이 필요합니다. 역할, 범위, 메타데이터, 공개 키 변경도 여전히 수동
승인이 필요합니다.

### Node 페어링 상태 저장소

`~/.openclaw/devices/` 아래에 저장됩니다.

- `pending.json`(수명이 짧음, 대기 요청은 만료됨)
- `paired.json`(페어링된 기기 + 토큰)

### 참고

- 레거시 `node.pair.*` API(CLI: `openclaw nodes pending|approve|reject|remove|rename`)는
  별도의 Gateway 소유 페어링 저장소입니다. WS Node는 여전히 기기 페어링이 필요합니다.
- 페어링 기록은 승인된 역할에 대한 지속적인 신뢰 원본입니다. 활성
  기기 토큰은 해당 승인된 역할 집합으로 계속 제한됩니다. 승인된 역할
  외부의 잘못된 토큰 항목은 새 접근 권한을 생성하지 않습니다.

## 관련 문서

- 보안 모델 + 프롬프트 인젝션: [보안](/ko/gateway/security)
- 안전하게 업데이트하기(doctor 실행): [업데이트](/ko/install/updating)
- 채널 구성:
  - Telegram: [Telegram](/ko/channels/telegram)
  - WhatsApp: [WhatsApp](/ko/channels/whatsapp)
  - Signal: [Signal](/ko/channels/signal)
  - BlueBubbles(iMessage): [BlueBubbles](/ko/channels/bluebubbles)
  - iMessage(레거시): [iMessage](/ko/channels/imessage)
  - Discord: [Discord](/ko/channels/discord)
  - Slack: [Slack](/ko/channels/slack)
