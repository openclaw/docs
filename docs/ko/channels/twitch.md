---
read_when:
    - OpenClaw용 Twitch 채팅 통합 설정
sidebarTitle: Twitch
summary: Twitch 채팅 봇 구성 및 설정
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
    postprocess_version: locale-links-v1
---

IRC 연결을 통한 Twitch 채팅 지원. OpenClaw는 Twitch 사용자(봇 계정)로 연결하여 채널에서 메시지를 받고 보냅니다.

## 번들 Plugin

<Note>
Twitch는 현재 OpenClaw 릴리스에 번들 Plugin으로 제공되므로, 일반 패키징 빌드는 별도 설치가 필요하지 않습니다.
</Note>

이전 빌드를 사용 중이거나 Twitch가 제외된 사용자 지정 설치를 사용하는 경우, npm 패키지를 직접 설치하세요.

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

현재 공식 릴리스 태그를 따르려면 기본 패키지를 사용하세요. 재현 가능한 설치가 필요할 때만 정확한
버전을 고정하세요.

세부 정보: [Plugins](/ko/tools/plugin)

## 빠른 설정(초보자)

<Steps>
  <Step title="Plugin 사용 가능 여부 확인">
    현재 패키징된 OpenClaw 릴리스에는 이미 포함되어 있습니다. 이전/사용자 지정 설치에서는 위 명령으로 수동 추가할 수 있습니다.
  </Step>
  <Step title="Twitch 봇 계정 생성">
    봇 전용 Twitch 계정을 생성하세요(또는 기존 계정을 사용하세요).
  </Step>
  <Step title="자격 증명 생성">
    [Twitch Token Generator](https://twitchtokengenerator.com/)를 사용하세요.

    - **Bot Token**을 선택합니다
    - `chat:read` 및 `chat:write` 범위가 선택되어 있는지 확인합니다
    - **Client ID** 및 **Access Token**을 복사합니다

  </Step>
  <Step title="Twitch 사용자 ID 찾기">
    [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)를 사용하여 사용자 이름을 Twitch 사용자 ID로 변환하세요.
  </Step>
  <Step title="토큰 구성">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...`(기본 계정만)
    - 또는 구성: `channels.twitch.accessToken`

    둘 다 설정된 경우 구성 값이 우선합니다(env 대체는 기본 계정 전용).

  </Step>
  <Step title="Gateway 시작">
    구성된 채널로 Gateway를 시작하세요.
  </Step>
</Steps>

<Warning>
인증되지 않은 사용자가 봇을 트리거하지 못하도록 액세스 제어(`allowFrom` 또는 `allowedRoles`)를 추가하세요. `requireMention`의 기본값은 `true`입니다.
</Warning>

최소 구성:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## 개요

- Gateway가 소유한 Twitch 채널입니다.
- 결정적 라우팅: 응답은 항상 Twitch로 돌아갑니다.
- 각 계정은 격리된 세션 키 `agent:<agentId>:twitch:<accountName>`에 매핑됩니다.
- `username`은 봇 계정(인증 주체)이고, `channel`은 참여할 채팅방입니다.

## 설정(자세히)

### 자격 증명 생성

[Twitch Token Generator](https://twitchtokengenerator.com/)를 사용하세요.

- **Bot Token**을 선택합니다
- `chat:read` 및 `chat:write` 범위가 선택되어 있는지 확인합니다
- **Client ID** 및 **Access Token**을 복사합니다

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
  <Tab title="구성">
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

env와 구성이 둘 다 설정된 경우 구성이 우선합니다.

### 액세스 제어(권장)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

강력한 허용 목록에는 `allowFrom`을 선호하세요. 역할 기반 액세스를 원하면 대신 `allowedRoles`를 사용하세요.

**사용 가능한 역할:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**왜 사용자 ID인가요?** 사용자 이름은 변경될 수 있어 사칭을 허용할 수 있습니다. 사용자 ID는 영구적입니다.

Twitch 사용자 ID 찾기: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)(Twitch 사용자 이름을 ID로 변환)
</Note>

## 토큰 갱신(선택 사항)

[Twitch Token Generator](https://twitchtokengenerator.com/)의 토큰은 자동으로 갱신할 수 없습니다. 만료되면 다시 생성하세요.

자동 토큰 갱신을 사용하려면 [Twitch Developer Console](https://dev.twitch.tv/console)에서 직접 Twitch 애플리케이션을 만들고 구성에 추가하세요.

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

봇은 만료 전에 토큰을 자동으로 갱신하고 갱신 이벤트를 로그에 기록합니다.

## 다중 계정 지원

계정별 토큰과 함께 `channels.twitch.accounts`를 사용하세요. 공유 패턴은 [구성](/ko/gateway/configuration)을 참조하세요.

예시(두 채널의 봇 계정 하나):

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

## 액세스 제어

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

    `allowFrom`은 강력한 허용 목록입니다. 설정하면 해당 사용자 ID만 허용됩니다. 역할 기반 액세스를 원하면 `allowFrom`을 설정하지 말고 대신 `allowedRoles`를 구성하세요.

  </Tab>
  <Tab title="@mention 요구 사항 비활성화">
    기본적으로 `requireMention`은 `true`입니다. 비활성화하고 모든 메시지에 응답하려면:

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
    - **액세스 제어 확인:** 사용자 ID가 `allowFrom`에 있는지 확인하거나, 테스트를 위해 일시적으로 `allowFrom`을 제거하고 `allowedRoles: ["all"]`을 설정하세요.
    - **봇이 채널에 있는지 확인:** 봇은 `channel`에 지정된 채널에 참여해야 합니다.

  </Accordion>
  <Accordion title="토큰 문제">
    "연결 실패" 또는 인증 오류:

    - `accessToken`이 OAuth 액세스 토큰 값인지 확인하세요(일반적으로 `oauth:` 접두사로 시작)
    - 토큰에 `chat:read` 및 `chat:write` 범위가 있는지 확인하세요
    - 토큰 갱신을 사용하는 경우 `clientSecret` 및 `refreshToken`이 설정되어 있는지 확인하세요

  </Accordion>
  <Accordion title="토큰 갱신이 작동하지 않음">
    갱신 이벤트가 있는지 로그를 확인하세요.

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    "토큰 갱신 비활성화됨(갱신 토큰 없음)"이 표시되는 경우:

    - `clientSecret`이 제공되었는지 확인하세요
    - `refreshToken`이 제공되었는지 확인하세요

  </Accordion>
</AccordionGroup>

## 구성

### 계정 구성

<ParamField path="username" type="string">
  봇 사용자 이름입니다.
</ParamField>
<ParamField path="accessToken" type="string">
  `chat:read` 및 `chat:write`가 포함된 OAuth 액세스 토큰입니다.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID입니다(Token Generator 또는 앱에서 가져옴).
</ParamField>
<ParamField path="channel" type="string" required>
  참여할 채널입니다.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  이 계정을 활성화합니다.
</ParamField>
<ParamField path="clientSecret" type="string">
  선택 사항: 자동 토큰 갱신용입니다.
</ParamField>
<ParamField path="refreshToken" type="string">
  선택 사항: 자동 토큰 갱신용입니다.
</ParamField>
<ParamField path="expiresIn" type="number">
  토큰 만료 시간(초)입니다.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  토큰 획득 타임스탬프입니다.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  사용자 ID 허용 목록입니다.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  역할 기반 액세스 제어입니다.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  @mention을 요구합니다.
</ParamField>

### Provider 옵션

- `channels.twitch.enabled` - 채널 시작 활성화/비활성화
- `channels.twitch.username` - 봇 사용자 이름(간소화된 단일 계정 구성)
- `channels.twitch.accessToken` - OAuth 액세스 토큰(간소화된 단일 계정 구성)
- `channels.twitch.clientId` - Twitch Client ID(간소화된 단일 계정 구성)
- `channels.twitch.channel` - 참여할 채널(간소화된 단일 계정 구성)
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

에이전트는 다음 작업으로 `twitch`를 호출할 수 있습니다.

- `send` - 채널에 메시지 보내기

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

- **토큰을 비밀번호처럼 취급하세요** — 토큰을 git에 절대 커밋하지 마세요.
- 장기 실행 봇에는 **자동 토큰 갱신을 사용하세요**.
- 액세스 제어에는 사용자 이름 대신 **사용자 ID 허용 목록을 사용하세요**.
- 토큰 갱신 이벤트와 연결 상태를 위해 **로그를 모니터링하세요**.
- **토큰 범위를 최소화하세요** — `chat:read` 및 `chat:write`만 요청하세요.
- **막혔다면**: 다른 프로세스가 세션을 소유하지 않는지 확인한 후 Gateway를 다시 시작하세요.

## 제한

- 메시지당 **500자**(단어 경계에서 자동 분할).
- Markdown은 분할 전에 제거됩니다.
- 속도 제한 없음(Twitch의 내장 속도 제한 사용).

## 관련 항목

- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [보안](/ko/gateway/security) — 액세스 모델 및 강화
