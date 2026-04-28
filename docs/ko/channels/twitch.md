---
read_when:
    - OpenClaw용 Twitch 채팅 통합 설정하기
sidebarTitle: Twitch
summary: Twitch 채팅 봇 구성 및 설정
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

IRC 연결을 통한 Twitch 채팅 지원입니다. OpenClaw는 Twitch 사용자(봇 계정)로 연결되어 채널에서 메시지를 수신하고 전송합니다.

## 번들 Plugin

<Note>
현재 OpenClaw 릴리스에서는 Twitch가 번들 Plugin으로 제공되므로, 일반적인 패키지 빌드에서는 별도 설치가 필요하지 않습니다.
</Note>

구버전 빌드나 Twitch가 제외된 커스텀 설치를 사용 중이라면 수동으로 설치하세요.

<Tabs>
  <Tab title="npm 레지스트리">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="로컬 체크아웃">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

자세한 내용: [Plugins](/ko/tools/plugin)

## 빠른 설정(초보자용)

<Steps>
  <Step title="Plugin 사용 가능 여부 확인">
    현재 패키지된 OpenClaw 릴리스에는 이미 번들되어 있습니다. 구버전/커스텀 설치는 위 명령으로 수동 추가할 수 있습니다.
  </Step>
  <Step title="Twitch 봇 계정 만들기">
    봇 전용 Twitch 계정을 만들거나(또는 기존 계정을 사용하세요).
  </Step>
  <Step title="자격 증명 생성">
    [Twitch Token Generator](https://twitchtokengenerator.com/)를 사용하세요.

    - **Bot Token** 선택
    - `chat:read` 및 `chat:write` 범위가 선택되었는지 확인
    - **Client ID**와 **Access Token** 복사

  </Step>
  <Step title="Twitch 사용자 ID 찾기">
    [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)를 사용해 사용자 이름을 Twitch 사용자 ID로 변환하세요.
  </Step>
  <Step title="토큰 구성">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (기본 계정만)
    - 또는 config: `channels.twitch.accessToken`

    둘 다 설정된 경우 config가 우선합니다(env 대체는 기본 계정에만 적용됨).

  </Step>
  <Step title="Gateway 시작">
    구성된 채널로 Gateway를 시작하세요.
  </Step>
</Steps>

<Warning>
승인되지 않은 사용자가 봇을 트리거하지 못하도록 접근 제어(`allowFrom` 또는 `allowedRoles`)를 추가하세요. `requireMention`의 기본값은 `true`입니다.
</Warning>

최소 구성:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // 봇의 Twitch 계정
      accessToken: "oauth:abc123...", // OAuth Access Token(또는 OPENCLAW_TWITCH_ACCESS_TOKEN env var 사용)
      clientId: "xyz789...", // Token Generator의 Client ID
      channel: "vevisk", // 참여할 Twitch 채널의 채팅(필수)
      allowFrom: ["123456789"], // (권장) 본인의 Twitch 사용자 ID만 - https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ 에서 확인
    },
  },
}
```

## 개요

- Gateway가 소유하는 Twitch 채널입니다.
- 결정적 라우팅: 응답은 항상 Twitch로 돌아갑니다.
- 각 계정은 격리된 세션 키 `agent:<agentId>:twitch:<accountName>`에 매핑됩니다.
- `username`은 봇의 계정(인증 주체)이고, `channel`은 참여할 채팅방입니다.

## 설정(상세)

### 자격 증명 생성

[Twitch Token Generator](https://twitchtokengenerator.com/)를 사용하세요.

- **Bot Token** 선택
- `chat:read` 및 `chat:write` 범위가 선택되었는지 확인
- **Client ID**와 **Access Token** 복사

<Note>
수동 앱 등록은 필요하지 않습니다. 토큰은 몇 시간 후 만료됩니다.
</Note>

### 봇 구성

<Tabs>
  <Tab title="Env var(기본 계정만)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

env와 config가 모두 설정된 경우 config가 우선합니다.

### 접근 제어(권장)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (권장) 본인의 Twitch 사용자 ID만
    },
  },
}
```

강력한 허용 목록에는 `allowFrom`을 사용하는 것이 좋습니다. 역할 기반 접근을 원한다면 대신 `allowedRoles`를 사용하세요.

**사용 가능한 역할:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**왜 사용자 ID를 사용하나요?** 사용자 이름은 변경될 수 있어 사칭을 허용할 수 있습니다. 사용자 ID는 영구적입니다.

Twitch 사용자 ID 찾기: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Twitch 사용자 이름을 ID로 변환)
</Note>

## 토큰 갱신(선택 사항)

[Twitch Token Generator](https://twitchtokengenerator.com/)에서 발급한 토큰은 자동으로 갱신할 수 없습니다. 만료되면 다시 생성하세요.

자동 토큰 갱신을 원한다면 [Twitch Developer Console](https://dev.twitch.tv/console)에서 직접 Twitch 애플리케이션을 만들고 config에 다음을 추가하세요.

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

봇은 만료 전에 토큰을 자동 갱신하고 갱신 이벤트를 로그에 기록합니다.

## 다중 계정 지원

계정별 토큰을 사용하려면 `channels.twitch.accounts`를 사용하세요. 공통 패턴은 [Configuration](/ko/gateway/configuration)을 참조하세요.

예시(한 봇 계정이 두 채널에 참여):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
각 계정에는 자체 토큰이 필요합니다(채널당 토큰 하나).
</Note>

## 접근 제어

<Tabs>
  <Tab title="사용자 ID 허용 목록(가장 안전)">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="역할 기반">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom`은 강제 허용 목록입니다. 설정되면 해당 사용자 ID만 허용됩니다. 역할 기반 접근을 원한다면 `allowFrom`을 설정하지 말고 대신 `allowedRoles`를 구성하세요.

  </Tab>
  <Tab title="@mention 요구 사항 비활성화">
    기본적으로 `requireMention`은 `true`입니다. 이를 비활성화하고 모든 메시지에 응답하려면 다음과 같이 설정하세요.

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## 문제 해결

먼저 진단 명령을 실행하세요.

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="봇이 메시지에 응답하지 않음">
    - **접근 제어 확인:** 본인 사용자 ID가 `allowFrom`에 있는지 확인하거나, 테스트를 위해 `allowFrom`을 임시로 제거하고 `allowedRoles: ["all"]`로 설정하세요.
    - **봇이 채널에 있는지 확인:** 봇은 `channel`에 지정된 채널에 참여해야 합니다.

  </Accordion>
  <Accordion title="토큰 문제">
    “Failed to connect” 또는 인증 오류가 발생하는 경우:

    - `accessToken`이 OAuth access token 값인지 확인하세요(일반적으로 `oauth:` 접두사로 시작)
    - 토큰에 `chat:read` 및 `chat:write` 범위가 있는지 확인하세요
    - 토큰 갱신을 사용하는 경우 `clientSecret`과 `refreshToken`이 설정되어 있는지 확인하세요

  </Accordion>
  <Accordion title="토큰 갱신이 작동하지 않음">
    갱신 이벤트 로그를 확인하세요.

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    “token refresh disabled (no refresh token)”가 보이면:

    - `clientSecret`이 제공되었는지 확인하세요
    - `refreshToken`이 제공되었는지 확인하세요

  </Accordion>
</AccordionGroup>

## 구성

### 계정 구성

<ParamField path="username" type="string">
  봇 사용자 이름.
</ParamField>
<ParamField path="accessToken" type="string">
  `chat:read` 및 `chat:write` 권한이 있는 OAuth access token.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID(Token Generator 또는 직접 만든 앱에서 발급).
</ParamField>
<ParamField path="channel" type="string" required>
  참여할 채널.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  이 계정을 활성화합니다.
</ParamField>
<ParamField path="clientSecret" type="string">
  선택 사항: 자동 토큰 갱신용.
</ParamField>
<ParamField path="refreshToken" type="string">
  선택 사항: 자동 토큰 갱신용.
</ParamField>
<ParamField path="expiresIn" type="number">
  토큰 만료 시간(초).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  토큰 획득 타임스탬프.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  사용자 ID 허용 목록.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  역할 기반 접근 제어.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @mention을 요구합니다.
</ParamField>

### Provider 옵션

- `channels.twitch.enabled` - 채널 시작 활성화/비활성화
- `channels.twitch.username` - 봇 사용자 이름(단순화된 단일 계정 구성)
- `channels.twitch.accessToken` - OAuth access token(단순화된 단일 계정 구성)
- `channels.twitch.clientId` - Twitch Client ID(단순화된 단일 계정 구성)
- `channels.twitch.channel` - 참여할 채널(단순화된 단일 계정 구성)
- `channels.twitch.accounts.<accountName>` - 다중 계정 구성(위의 모든 계정 필드)

전체 예시:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## 도구 작업

에이전트는 다음 action으로 `twitch`를 호출할 수 있습니다.

- `send` - 채널에 메시지 전송

예시:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## 안전 및 운영

- **토큰은 비밀번호처럼 취급하세요** — 토큰을 git에 절대 커밋하지 마세요.
- 장기간 실행되는 봇에는 **자동 토큰 갱신**을 사용하세요.
- 접근 제어에는 사용자 이름 대신 **사용자 ID 허용 목록**을 사용하세요.
- 토큰 갱신 이벤트와 연결 상태를 **로그로 모니터링**하세요.
- 토큰 범위는 **최소한으로 유지**하세요 — `chat:read`와 `chat:write`만 요청하세요.
- **문제가 해결되지 않으면**: 다른 프로세스가 세션을 소유하지 않는지 확인한 뒤 Gateway를 재시작하세요.

## 제한 사항

- 메시지당 **500자**(단어 경계에서 자동 분할).
- 청킹 전에 Markdown이 제거됩니다.
- 속도 제한 없음(Twitch의 내장 속도 제한 사용).

## 관련 항목

- [Channel Routing](/ko/channels/channel-routing) — 메시지용 세션 라우팅
- [Channels Overview](/ko/channels) — 지원되는 모든 채널
- [Groups](/ko/channels/groups) — 그룹 채팅 동작과 멘션 게이팅
- [Pairing](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [Security](/ko/gateway/security) — 접근 모델 및 보안 강화
