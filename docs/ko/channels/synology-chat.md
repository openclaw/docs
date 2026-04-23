---
read_when:
    - OpenClaw에서 Synology Chat 설정하기
    - Synology Chat Webhook 라우팅 디버깅
summary: Synology Chat Webhook 설정 및 OpenClaw 구성
title: Synology Chat
x-i18n:
    generated_at: "2026-04-23T13:58:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: a9cafbf543b8ce255e634bc4d54012652d3887ac23b31b97899dc7cec9d0688f
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

상태: Synology Chat Webhook을 사용하는 번들 Plugin 다이렉트 메시지 채널입니다.
이 Plugin은 Synology Chat 아웃고잉 Webhook에서 인바운드 메시지를 수신하고
Synology Chat 인커밍 Webhook을 통해 응답을 보냅니다.

## 번들 Plugin

Synology Chat는 현재 OpenClaw 릴리스에 번들 Plugin으로 포함되어 있으므로, 일반적인
패키지 빌드에서는 별도 설치가 필요하지 않습니다.

구버전 빌드 또는 Synology Chat가 제외된 커스텀 설치를 사용하는 경우,
수동으로 설치하세요:

로컬 체크아웃에서 설치:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

자세한 내용: [Plugins](/ko/tools/plugin)

## 빠른 설정

1. Synology Chat Plugin을 사용할 수 있는지 확인합니다.
   - 현재 패키지형 OpenClaw 릴리스에는 이미 번들로 포함되어 있습니다.
   - 구버전/커스텀 설치에서는 위 명령으로 소스 체크아웃에서 수동으로 추가할 수 있습니다.
   - 이제 `openclaw onboard`는 `openclaw channels add`와 동일한 채널 설정 목록에 Synology Chat를 표시합니다.
   - 비대화형 설정: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat 통합에서:
   - 인커밍 Webhook을 생성하고 URL을 복사합니다.
   - 비밀 토큰으로 아웃고잉 Webhook을 생성합니다.
3. 아웃고잉 Webhook URL을 OpenClaw Gateway로 지정합니다:
   - 기본값: `https://gateway-host/webhook/synology`
   - 또는 사용자 지정 `channels.synology-chat.webhookPath`
4. OpenClaw에서 설정을 완료합니다.
   - 안내형: `openclaw onboard`
   - 직접: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway를 재시작하고 Synology Chat 봇에 DM을 보냅니다.

Webhook 인증 세부 사항:

- OpenClaw는 아웃고잉 Webhook 토큰을 먼저 `body.token`에서, 다음으로
  `?token=...`, 그다음 헤더에서 수락합니다.
- 허용되는 헤더 형식:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 비어 있거나 누락된 토큰은 fail-closed로 처리됩니다.

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

기본 계정의 경우 env var를 사용할 수 있습니다:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`(쉼표로 구분)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

구성 값이 env var보다 우선합니다.

`SYNOLOGY_CHAT_INCOMING_URL`은 워크스페이스 `.env`에서 설정할 수 없습니다. [Workspace `.env` files](/ko/gateway/security)을 참조하세요.

## DM 정책 및 액세스 제어

- `dmPolicy: "allowlist"`가 권장 기본값입니다.
- `allowedUserIds`는 Synology 사용자 ID 목록(또는 쉼표로 구분된 문자열)을 받습니다.
- `allowlist` 모드에서 비어 있는 `allowedUserIds` 목록은 잘못된 구성으로 처리되며 Webhook 경로가 시작되지 않습니다(모두 허용하려면 `dmPolicy: "open"` 사용).
- `dmPolicy: "open"`은 모든 발신자를 허용합니다.
- `dmPolicy: "disabled"`는 DM을 차단합니다.
- 응답 수신자 바인딩은 기본적으로 안정적인 숫자 `user_id`를 유지합니다. `channels.synology-chat.dangerouslyAllowNameMatching: true`는 응답 전달을 위해 변경 가능한 사용자 이름/닉네임 조회를 다시 활성화하는 비상 호환 모드입니다.
- 페어링 승인은 다음으로 수행할 수 있습니다:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 아웃바운드 전송

대상으로 숫자형 Synology Chat 사용자 ID를 사용하세요.

예시:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

미디어 전송은 URL 기반 파일 전송으로 지원됩니다.
아웃바운드 파일 URL은 `http` 또는 `https`를 사용해야 하며, 비공개 또는 기타 차단된 네트워크 대상은 OpenClaw가 해당 URL을 NAS Webhook으로 전달하기 전에 거부됩니다.

## 다중 계정

여러 Synology Chat 계정은 `channels.synology-chat.accounts` 아래에서 지원됩니다.
각 계정은 토큰, 인커밍 URL, Webhook 경로, DM 정책 및 제한을 재정의할 수 있습니다.
다이렉트 메시지 세션은 계정과 사용자별로 격리되므로, 서로 다른 두 Synology 계정에서 동일한 숫자 `user_id`를 사용하더라도 대화 기록 상태를 공유하지 않습니다.
활성화된 각 계정에는 고유한 `webhookPath`를 지정하세요. 이제 OpenClaw는 중복되는 정확한 경로를 거부하며
다중 계정 설정에서 공유된 Webhook 경로만 상속하는 명명된 계정의 시작을 거부합니다.
의도적으로 명명된 계정에 레거시 상속이 필요한 경우,
해당 계정 또는 `channels.synology-chat`에 `dangerouslyAllowInheritedWebhookPath: true`를 설정할 수 있지만,
중복되는 정확한 경로는 여전히 fail-closed로 거부됩니다. 명시적인 계정별 경로를 권장합니다.

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

- `token`은 비밀로 유지하고 유출된 경우 교체하세요.
- 자체 서명된 로컬 NAS 인증서를 명시적으로 신뢰하는 경우가 아니라면 `allowInsecureSsl: false`를 유지하세요.
- 인바운드 Webhook 요청은 토큰 검증이 수행되며 발신자별로 속도 제한이 적용됩니다.
- 잘못된 토큰 검사는 상수 시간 비밀 비교를 사용하며 fail-closed로 처리됩니다.
- 프로덕션에서는 `dmPolicy: "allowlist"` 사용을 권장합니다.
- 레거시 사용자 이름 기반 응답 전달이 명시적으로 필요한 경우가 아니라면 `dangerouslyAllowNameMatching`을 꺼진 상태로 유지하세요.
- 다중 계정 설정에서 공유 경로 라우팅 위험을 명시적으로 수용하는 경우가 아니라면 `dangerouslyAllowInheritedWebhookPath`를 꺼진 상태로 유지하세요.

## 문제 해결

- `Missing required fields (token, user_id, text)`:
  - 아웃고잉 Webhook 페이로드에 필수 필드 중 하나가 누락되었습니다
  - Synology가 헤더로 토큰을 보내는 경우 Gateway/프록시가 해당 헤더를 유지하는지 확인하세요
- `Invalid token`:
  - 아웃고잉 Webhook 비밀 값이 `channels.synology-chat.token`과 일치하지 않습니다
  - 요청이 잘못된 계정/Webhook 경로로 전달되고 있습니다
  - 역방향 프록시가 요청이 OpenClaw에 도달하기 전에 토큰 헤더를 제거했습니다
- `Rate limit exceeded`:
  - 동일한 소스에서 너무 많은 잘못된 토큰 시도로 인해 해당 소스가 일시적으로 차단될 수 있습니다
  - 인증된 발신자에게도 별도의 사용자별 메시지 속도 제한이 적용됩니다
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"`가 활성화되어 있지만 구성된 사용자가 없습니다
- `User not authorized`:
  - 발신자의 숫자형 `user_id`가 `allowedUserIds`에 없습니다

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 강화 방법
