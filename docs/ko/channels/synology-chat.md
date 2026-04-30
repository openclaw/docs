---
read_when:
    - OpenClaw로 Synology Chat 설정하기
    - Synology Chat Webhook 라우팅 디버깅
summary: Synology Chat Webhook 설정 및 OpenClaw 구성
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T06:19:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

상태: Synology Chat Webhook을 사용하는 번들 Plugin 직접 메시지 채널입니다.
Plugin은 Synology Chat 발신 Webhook에서 인바운드 메시지를 수락하고 Synology Chat 수신 Webhook을 통해 답장을 보냅니다.

## 번들 Plugin

Synology Chat은 현재 OpenClaw 릴리스에서 번들 Plugin으로 제공되므로, 일반 패키지 빌드는 별도 설치가 필요하지 않습니다.

Synology Chat이 제외된 이전 빌드나 사용자 지정 설치를 사용 중인 경우 수동으로 설치하세요.

로컬 체크아웃에서 설치:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

자세한 내용: [Plugin](/ko/tools/plugin)

## 빠른 설정

1. Synology Chat Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지된 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 이전/사용자 지정 설치는 위 명령을 사용해 소스 체크아웃에서 수동으로 추가할 수 있습니다.
   - 이제 `openclaw onboard`는 `openclaw channels add`와 동일한 채널 설정 목록에 Synology Chat을 표시합니다.
   - 비대화형 설정: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat 통합에서:
   - 수신 Webhook을 만들고 해당 URL을 복사합니다.
   - 비밀 토큰으로 발신 Webhook을 만듭니다.
3. 발신 Webhook URL이 OpenClaw Gateway를 가리키도록 설정합니다.
   - 기본값은 `https://gateway-host/webhook/synology`입니다.
   - 또는 사용자 지정 `channels.synology-chat.webhookPath`를 사용합니다.
4. OpenClaw에서 설정을 완료합니다.
   - 안내식: `openclaw onboard`
   - 직접: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway를 다시 시작하고 Synology Chat 봇에 DM을 보냅니다.

Webhook 인증 세부 정보:

- OpenClaw는 `body.token`, 그다음 `?token=...`, 그다음 헤더에서 발신 Webhook 토큰을 수락합니다.
- 허용되는 헤더 형식:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 비어 있거나 누락된 토큰은 닫힌 상태로 실패합니다.

최소 구성:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 환경 변수

기본 계정에는 환경 변수를 사용할 수 있습니다.

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (쉼표로 구분)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

구성 값은 환경 변수를 재정의합니다.

`SYNOLOGY_CHAT_INCOMING_URL`은 워크스페이스 `.env`에서 설정할 수 없습니다. [워크스페이스 `.env` 파일](/ko/gateway/security)을 참고하세요.

## DM 정책 및 액세스 제어

- `dmPolicy: "allowlist"`가 권장 기본값입니다.
- `allowedUserIds`는 Synology 사용자 ID 목록(또는 쉼표로 구분된 문자열)을 허용합니다.
- `allowlist` 모드에서 빈 `allowedUserIds` 목록은 잘못된 구성으로 처리되며 Webhook 라우트가 시작되지 않습니다(전체 허용에는 `allowedUserIds: ["*"]`와 함께 `dmPolicy: "open"`을 사용하세요).
- `dmPolicy: "open"`은 `allowedUserIds`에 `"*"`가 포함된 경우에만 공개 DM을 허용합니다. 제한 항목이 있으면 일치하는 사용자만 채팅할 수 있습니다.
- `dmPolicy: "disabled"`는 DM을 차단합니다.
- 답장 수신자 바인딩은 기본적으로 안정적인 숫자형 `user_id`에 유지됩니다. `channels.synology-chat.dangerouslyAllowNameMatching: true`는 답장 전달을 위해 변경 가능한 사용자 이름/닉네임 조회를 다시 활성화하는 비상 호환 모드입니다.
- 페어링 승인은 다음과 함께 작동합니다.
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 아웃바운드 전달

대상에는 숫자형 Synology Chat 사용자 ID를 사용하세요.

예시:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

미디어 전송은 URL 기반 파일 전달로 지원됩니다.
아웃바운드 파일 URL은 `http` 또는 `https`를 사용해야 하며, 비공개 또는 그 밖의 차단된 네트워크 대상은 OpenClaw가 해당 URL을 NAS Webhook으로 전달하기 전에 거부됩니다.

## 다중 계정

여러 Synology Chat 계정은 `channels.synology-chat.accounts` 아래에서 지원됩니다.
각 계정은 토큰, 수신 URL, Webhook 경로, DM 정책, 제한을 재정의할 수 있습니다.
직접 메시지 세션은 계정 및 사용자별로 격리되므로, 서로 다른 두 Synology 계정의 동일한 숫자형 `user_id`는 대화 상태를 공유하지 않습니다.
활성화된 각 계정에 고유한 `webhookPath`를 지정하세요. 이제 OpenClaw는 중복된 정확한 경로를 거부하고, 다중 계정 설정에서 공유 Webhook 경로만 상속하는 명명된 계정의 시작을 거부합니다.
명명된 계정에 레거시 상속이 의도적으로 필요한 경우 해당 계정 또는 `channels.synology-chat`에 `dangerouslyAllowInheritedWebhookPath: true`를 설정하세요. 하지만 중복된 정확한 경로는 여전히 닫힌 상태로 실패하며 거부됩니다. 계정별 명시적 경로를 선호하세요.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## 보안 참고 사항

- `token`을 비밀로 유지하고 유출된 경우 순환하세요.
- 자체 서명된 로컬 NAS 인증서를 명시적으로 신뢰하지 않는 한 `allowInsecureSsl: false`를 유지하세요.
- 인바운드 Webhook 요청은 토큰으로 검증되며 발신자별로 속도 제한이 적용됩니다.
- 잘못된 토큰 검사는 상수 시간 비밀 비교를 사용하며 닫힌 상태로 실패합니다.
- 프로덕션에는 `dmPolicy: "allowlist"`를 선호하세요.
- 레거시 사용자 이름 기반 답장 전달이 명시적으로 필요하지 않는 한 `dangerouslyAllowNameMatching`을 꺼 두세요.
- 다중 계정 설정에서 공유 경로 라우팅 위험을 명시적으로 수락하지 않는 한 `dangerouslyAllowInheritedWebhookPath`를 꺼 두세요.

## 문제 해결

- `Missing required fields (token, user_id, text)`:
  - 발신 Webhook 페이로드에 필수 필드 중 하나가 누락되었습니다.
  - Synology가 헤더로 토큰을 보내는 경우 Gateway/프록시가 해당 헤더를 보존하는지 확인하세요.
- `Invalid token`:
  - 발신 Webhook 비밀이 `channels.synology-chat.token`과 일치하지 않습니다.
  - 요청이 잘못된 계정/Webhook 경로에 도달하고 있습니다.
  - 요청이 OpenClaw에 도달하기 전에 역방향 프록시가 토큰 헤더를 제거했습니다.
- `Rate limit exceeded`:
  - 동일한 출처에서 잘못된 토큰 시도가 너무 많으면 해당 출처가 일시적으로 차단될 수 있습니다.
  - 인증된 발신자도 별도의 사용자별 메시지 속도 제한을 갖습니다.
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"`가 활성화되었지만 구성된 사용자가 없습니다.
- `User not authorized`:
  - 발신자의 숫자형 `user_id`가 `allowedUserIds`에 없습니다.

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
