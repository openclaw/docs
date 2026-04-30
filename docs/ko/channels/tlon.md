---
read_when:
    - Tlon/Urbit 채널 기능 작업 중
summary: Tlon/Urbit 지원 상태, 기능 및 구성
title: 틀론
x-i18n:
    generated_at: "2026-04-30T06:19:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon은 Urbit 기반의 탈중앙화 메신저입니다. OpenClaw는 사용자의 Urbit ship에 연결하여
DM과 그룹 채팅 메시지에 응답할 수 있습니다. 그룹 답장은 기본적으로 @ 멘션이 필요하며,
허용 목록을 통해 추가로 제한할 수 있습니다.

상태: 번들 Plugin. DM, 그룹 멘션, 스레드 답장, 리치 텍스트 서식, 그리고
이미지 업로드가 지원됩니다. 반응과 투표는 아직 지원되지 않습니다.

## 번들 Plugin

Tlon은 현재 OpenClaw 릴리스에 번들 Plugin으로 제공되므로, 일반 패키지
빌드에서는 별도 설치가 필요하지 않습니다.

이전 빌드나 Tlon을 제외한 사용자 지정 설치를 사용하는 경우, 게시된
최신 npm 패키지가 있으면 설치하세요.

CLI로 설치(npm registry에 최신 패키지가 있는 경우):

```bash
openclaw plugins install @openclaw/tlon
```

npm에서 OpenClaw 소유 패키지가 deprecated로 표시되면, 더 최신 npm 패키지가
게시될 때까지 현재 패키지 OpenClaw 빌드 또는 로컬 체크아웃 경로를 사용하세요.

로컬 체크아웃(git repo에서 실행하는 경우):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

자세히: [Plugins](/ko/tools/plugin)

## 설정

1. Tlon Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
2. ship URL과 로그인 코드를 준비합니다.
3. `channels.tlon`을 구성합니다.
4. Gateway를 다시 시작합니다.
5. 봇에게 DM을 보내거나 그룹 채널에서 멘션합니다.

최소 구성(단일 계정):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## 비공개/LAN ship

기본적으로 OpenClaw는 SSRF 보호를 위해 비공개/내부 호스트명과 IP 범위를 차단합니다.
ship이 비공개 네트워크(localhost, LAN IP 또는 내부 호스트명)에서 실행 중이라면,
명시적으로 옵트인해야 합니다.

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

이는 다음과 같은 URL에 적용됩니다.

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ 로컬 네트워크를 신뢰하는 경우에만 이 옵션을 활성화하세요. 이 설정은 ship URL로 보내는
요청에 대한 SSRF 보호를 비활성화합니다.

## 그룹 채널

자동 검색은 기본적으로 활성화되어 있습니다. 채널을 수동으로 고정할 수도 있습니다.

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

자동 검색 비활성화:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## 접근 제어

DM 허용 목록(비어 있음 = DM 허용 안 함, 승인 흐름에는 `ownerShip` 사용):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

그룹 권한 부여(기본적으로 제한됨):

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## 소유자 및 승인 시스템

권한이 없는 사용자가 상호작용을 시도할 때 승인 요청을 받을 소유자 ship을 설정합니다.

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

소유자 ship은 **모든 곳에서 자동으로 권한이 부여됩니다**. DM 초대는 자동 수락되고
채널 메시지는 항상 허용됩니다. 소유자를 `dmAllowlist` 또는
`defaultAuthorizedShips`에 추가할 필요가 없습니다.

설정하면 소유자는 다음에 대한 DM 알림을 받습니다.

- 허용 목록에 없는 ship의 DM 요청
- 권한이 없는 채널의 멘션
- 그룹 초대 요청

## 자동 수락 설정

DM 초대 자동 수락(dmAllowlist의 ship 대상):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

그룹 초대 자동 수락:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 전달 대상(CLI/cron)

`openclaw message send` 또는 cron 전달과 함께 사용하세요.

- DM: `~sampel-palnet` 또는 `dm/~sampel-palnet`
- 그룹: `chat/~host-ship/channel` 또는 `group:~host-ship/channel`

## 번들 스킬

Tlon Plugin에는 Tlon 작업에 대한 CLI 접근을 제공하는 번들 스킬([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))이
포함되어 있습니다.

- **연락처**: 프로필 가져오기/업데이트, 연락처 목록 보기
- **채널**: 목록 보기, 생성, 메시지 게시, 기록 가져오기
- **그룹**: 목록 보기, 생성, 구성원 관리
- **DM**: 메시지 보내기, 메시지에 반응하기
- **반응**: 게시물과 DM에 이모지 반응 추가/제거
- **설정**: 슬래시 명령으로 Plugin 권한 관리

스킬은 Plugin이 설치되면 자동으로 사용할 수 있습니다.

## 기능

| 기능            | 상태                                    |
| --------------- | --------------------------------------- |
| 직접 메시지     | ✅ 지원됨                               |
| 그룹/채널       | ✅ 지원됨(기본적으로 멘션 필요)         |
| 스레드          | ✅ 지원됨(스레드 안에서 자동 답장)      |
| 리치 텍스트     | ✅ Markdown이 Tlon 형식으로 변환됨      |
| 이미지          | ✅ Tlon 스토리지에 업로드됨             |
| 반응            | ✅ [번들 스킬](#bundled-skill)을 통해 지원 |
| 투표            | ❌ 아직 지원되지 않음                   |
| 네이티브 명령   | ✅ 지원됨(기본적으로 소유자 전용)       |

## 문제 해결

먼저 이 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

일반적인 실패:

- **DM이 무시됨**: 발신자가 `dmAllowlist`에 없고 승인 흐름을 위한 `ownerShip`도 구성되지 않았습니다.
- **그룹 메시지가 무시됨**: 채널이 검색되지 않았거나 발신자에게 권한이 없습니다.
- **연결 오류**: ship URL에 접근 가능한지 확인하세요. 로컬 ship에는 `allowPrivateNetwork`를 활성화하세요.
- **인증 오류**: 로그인 코드가 최신인지 확인하세요(코드는 순환 변경됨).

## 구성 참조

전체 구성: [Configuration](/ko/gateway/configuration)

제공자 옵션:

- `channels.tlon.enabled`: 채널 시작을 활성화/비활성화합니다.
- `channels.tlon.ship`: 봇의 Urbit ship 이름(예: `~sampel-palnet`).
- `channels.tlon.url`: ship URL(예: `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: ship 로그인 코드.
- `channels.tlon.allowPrivateNetwork`: localhost/LAN URL 허용(SSRF 우회).
- `channels.tlon.ownerShip`: 승인 시스템용 소유자 ship(항상 권한 부여됨).
- `channels.tlon.dmAllowlist`: DM이 허용된 ship(비어 있음 = 없음).
- `channels.tlon.autoAcceptDmInvites`: 허용 목록의 ship에서 온 DM을 자동 수락합니다.
- `channels.tlon.autoAcceptGroupInvites`: 모든 그룹 초대를 자동 수락합니다.
- `channels.tlon.autoDiscoverChannels`: 그룹 채널을 자동 검색합니다(기본값: true).
- `channels.tlon.groupChannels`: 수동으로 고정된 채널 nest.
- `channels.tlon.defaultAuthorizedShips`: 모든 채널에 권한이 부여된 ship.
- `channels.tlon.authorization.channelRules`: 채널별 인증 규칙.
- `channels.tlon.showModelSignature`: 메시지에 모델 이름을 추가합니다.

## 참고

- 그룹 답장은 응답하려면 멘션(예: `~your-bot-ship`)이 필요합니다.
- 스레드 답장: 수신 메시지가 스레드 안에 있으면 OpenClaw는 스레드 안에서 답장합니다.
- 리치 텍스트: Markdown 서식(굵게, 기울임, 코드, 헤더, 목록)이 Tlon의 네이티브 형식으로 변환됩니다.
- 이미지: URL은 Tlon 스토리지에 업로드되고 이미지 블록으로 임베드됩니다.

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
