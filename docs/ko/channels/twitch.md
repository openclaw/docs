---
read_when:
    - OpenClaw용 Twitch 채팅 연동 설정
sidebarTitle: Twitch
summary: 'Twitch 채팅 봇: 설치, 자격 증명, 접근 제어, 토큰 갱신'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T00:37:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Twurple 클라이언트를 통해 Twitch의 채팅(IRC) 인터페이스를 사용하는 Twitch 채팅 지원입니다. OpenClaw는 Twitch 봇 계정으로 로그인하고, 구성된 계정마다 하나의 채널에 참여하여 해당 채널에서 답변합니다.

## 설치

Twitch는 공식 Plugin으로 제공되며, 핵심 설치에는 포함되지 않습니다.

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

`plugins install`은 Plugin을 등록하고 활성화합니다. `openclaw onboard` 또는 `openclaw channels add` 중에 Twitch를 선택하면 필요할 때 설치됩니다. 현재 릴리스를 따르려면 버전 없는 패키지 이름을 사용하고, 재현 가능한 설치가 필요한 경우에만 정확한 버전을 고정하세요. OpenClaw 2026.4.10 이상이 필요합니다.

자세한 내용: [Plugin](/ko/tools/plugin)

## 빠른 설정

<Steps>
  <Step title="Plugin 설치">
    위의 [설치](#install)를 참조하세요.
  </Step>
  <Step title="Twitch 봇 계정 만들기">
    봇 전용 Twitch 계정을 만들거나 기존 계정을 사용하세요.
  </Step>
  <Step title="자격 증명 생성">
    [Twitch Token Generator](https://twitchtokengenerator.com/)를 사용하세요.

    - **Bot Token**을 선택합니다
    - `chat:read` 및 `chat:write` 범위가 선택되어 있는지 확인합니다
    - **Client ID**와 **Access Token**을 복사합니다

  </Step>
  <Step title="Twitch 사용자 ID 찾기">
    [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)를 사용하여 사용자 이름을 Twitch 사용자 ID로 변환하세요.
  </Step>
  <Step title="토큰 구성">
    - 환경 변수: `OPENCLAW_TWITCH_ACCESS_TOKEN=...`(기본 계정에만 적용)
    - 또는 구성: `channels.twitch.accessToken`

    둘 다 설정된 경우 구성이 우선합니다. 환경 변수는 기본 계정의 대체 값으로만 사용됩니다.

  </Step>
  <Step title="Gateway 시작">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
권한 없는 사용자가 봇을 실행하지 못하도록 접근 제어(`allowFrom` 또는 `allowedRoles`)를 추가하세요. `requireMention`의 기본값은 `true`입니다.
</Warning>

최소 구성:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // 봇의 Twitch 계정(인증에 사용)
      accessToken: "oauth:abc123...", // OAuth 액세스 토큰(또는 OPENCLAW_TWITCH_ACCESS_TOKEN 환경 변수 사용)
      clientId: "xyz789...", // Token Generator에서 받은 클라이언트 ID
      channel: "yourchannel", // 참여할 Twitch 채널의 채팅(필수)
      allowFrom: ["123456789"], // (권장) 자신의 Twitch 사용자 ID만 허용
    },
  },
}
```

## 개요

- Gateway가 소유하는 Twitch 채널입니다.
- 결정적 라우팅: 답변은 항상 메시지가 들어온 Twitch 채널로 돌아갑니다.
- 참여한 각 채널은 격리된 그룹 세션 키 `agent:<agentId>:twitch:group:<channel>`에 매핑됩니다.
- `username`은 인증하는 봇 계정이고, `channel`은 참여할 채팅방입니다. 계정 항목 하나는 정확히 하나의 채널에 참여합니다.
- 토큰은 `oauth:` 접두사가 있거나 없어도 작동하며, OpenClaw가 두 형식을 모두 정규화합니다. 설정 마법사는 `oauth:` 형식을 요구합니다.

## 토큰 갱신(선택 사항)

[Twitch Token Generator](https://twitchtokengenerator.com/)에서 받은 토큰은 OpenClaw가 갱신할 수 없습니다. 만료되면 다시 생성하세요. 이 토큰은 몇 시간 동안 유효하며 앱 등록은 필요하지 않습니다.

자동 갱신을 사용하려면 [Twitch Developer Console](https://dev.twitch.tv/console)에서 직접 앱을 만들고 다음을 추가하세요.

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

둘 다 설정하면 Plugin은 만료 전에 토큰을 갱신하고 각 갱신을 기록하는 갱신 가능 인증 공급자를 사용합니다. `refreshToken`이 없으면 `token refresh disabled (no refresh token)`을 기록하고, `clientSecret`이 없으면 정적 토큰(갱신되지 않는 토큰)으로 대체합니다.

## 다중 계정 지원

계정별 자격 증명과 함께 `channels.twitch.accounts`를 사용하세요. 공통 패턴은 [구성](/ko/gateway/configuration)을 참조하세요.

예시(두 채널에서 봇 계정 하나 사용):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "yourchannel",
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
모든 계정 항목에는 자체 `accessToken`이 필요합니다. 환경 변수는 기본 계정에만 적용됩니다. 계정 하나는 정확히 하나의 채널에 참여하므로 두 채널에 참여하려면 계정 항목이 두 개 필요합니다. `channels.twitch.defaultAccount`는 기본 계정으로 사용할 계정을 선택합니다.
</Note>

## 접근 제어

`allowFrom`은 Twitch 사용자 ID의 엄격한 허용 목록입니다. 이를 설정하면 `allowedRoles`는 무시됩니다. 역할 기반 접근을 사용하려면 `allowFrom`을 설정하지 마세요.

**사용 가능한 역할:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

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
  </Tab>
  <Tab title="@멘션 요구 사항 비활성화">
    기본적으로 `requireMention`은 `true`입니다. 허용된 모든 메시지에 응답하려면 다음과 같이 설정하세요.

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

<Note>
**사용자 ID를 사용하는 이유는 무엇인가요?** 사용자 이름은 변경할 수 있어 사칭이 가능합니다. 사용자 ID는 영구적입니다.

[사용자 이름-ID 변환기](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)를 사용하여 자신의 ID를 찾으세요.
</Note>

## 문제 해결

먼저 진단 명령을 실행하세요.

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="봇이 메시지에 응답하지 않음">
    - **접근 제어 확인:** 자신의 사용자 ID가 `allowFrom`에 있는지 확인하거나, 테스트를 위해 일시적으로 `allowFrom`을 제거하고 `allowedRoles: ["all"]`을 설정하세요.
    - **멘션 게이트 확인:** `requireMention: true`(기본값)인 경우 메시지에서 봇 사용자 이름을 @멘션해야 합니다.
    - **봇이 채널에 있는지 확인:** 봇은 `channel`에 지정된 채널에만 참여합니다.

  </Accordion>
  <Accordion title="토큰 문제">
    "연결 실패" 또는 인증 오류가 발생하는 경우:

    - `accessToken`이 OAuth 액세스 토큰 값인지 확인하세요. `oauth:` 접두사는 선택 사항입니다.
    - 토큰에 `chat:read` 및 `chat:write` 범위가 있는지 확인하세요.
    - 토큰 갱신을 사용하는 경우 `clientSecret`과 `refreshToken`이 설정되어 있는지 확인하세요.

  </Accordion>
  <Accordion title="토큰 갱신이 작동하지 않음">
    로그에서 갱신 이벤트를 확인하세요.

    ```text
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    `token refresh disabled (no refresh token)`이 표시되는 경우:

    - `clientSecret`이 제공되었는지 확인하세요.
    - `refreshToken`이 제공되었는지 확인하세요.

  </Accordion>
</AccordionGroup>

## 구성

### 계정 구성

<ParamField path="username" type="string" required>
  봇 사용자 이름(인증하는 계정).
</ParamField>
<ParamField path="accessToken" type="string" required>
  `chat:read` 및 `chat:write` 권한이 있는 OAuth 액세스 토큰(기본 계정의 경우 구성 또는 환경 변수).
</ParamField>
<ParamField path="clientId" type="string" required>
  Twitch 클라이언트 ID(Token Generator 또는 자체 앱에서 발급). 스키마에서는 선택 사항이지만 연결하려면 필수입니다.
</ParamField>
<ParamField path="channel" type="string" required>
  참여할 채널.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  이 계정을 활성화합니다.
</ParamField>
<ParamField path="clientSecret" type="string">
  선택 사항: 자동 토큰 갱신에 사용합니다.
</ParamField>
<ParamField path="refreshToken" type="string">
  선택 사항: 자동 토큰 갱신에 사용합니다.
</ParamField>
<ParamField path="expiresIn" type="number">
  토큰 만료 시간(초 단위, 갱신 추적용).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  토큰을 얻은 시점의 타임스탬프(갱신 추적용).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  사용자 ID 허용 목록. 설정하면 역할은 무시됩니다.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  역할 기반 접근 제어.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  봇을 실행하려면 @멘션을 요구합니다.
</ParamField>
<ParamField path="responsePrefix" type="string">
  이 계정의 발신 응답 접두사를 재정의합니다.
</ParamField>

### 공급자 옵션

- `channels.twitch.enabled` - 채널 시작 활성화/비활성화
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - 간소화된 단일 계정 구성(암시적 `default` 계정이며 `accounts.default`보다 우선함)
- `channels.twitch.accounts.<accountName>` - 다중 계정 구성(위의 모든 계정 필드)
- `channels.twitch.defaultAccount` - 기본값으로 사용할 계정 이름
- `channels.twitch.markdown.tables` - Markdown 표 렌더링 모드(`off` | `bullets` | `code` | `block`)

전체 예시:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## 도구 작업

에이전트는 메시지 도구의 `send` 작업을 통해 Twitch 메시지를 보낼 수 있습니다.

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Hello Twitch!",
}
```

`to`는 선택 사항이며 기본값은 계정에 구성된 `channel`입니다.

## 보안 및 운영

- **토큰을 비밀번호처럼 취급하세요** - 토큰을 절대로 git에 커밋하지 마세요.
- 장시간 실행되는 봇에는 **자동 토큰 갱신을 사용하세요**.
- 접근 제어에는 사용자 이름 대신 **사용자 ID 허용 목록을 사용하세요**.
- 토큰 갱신 이벤트와 연결 상태를 확인하려면 **로그를 모니터링하세요**.
- **토큰 범위를 최소화하세요** - `chat:read` 및 `chat:write`만 요청하세요.
- **문제가 해결되지 않는 경우**: 다른 프로세스가 세션을 소유하지 않는지 확인한 후 Gateway를 다시 시작하세요.

## 제한 사항

- 메시지당 **500자**이며, 더 긴 답변은 단어 경계에서 분할됩니다.
- 전송 전에 Markdown이 제거됩니다. Twitch 채팅은 일반 텍스트이며 줄바꿈은 공백으로 바뀝니다.
- OpenClaw는 자체적인 속도 제한을 추가하지 않습니다. Twurple 채팅 클라이언트가 Twitch 속도 제한을 처리합니다.

## 관련 문서

- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [보안](/ko/gateway/security) — 접근 모델 및 보안 강화
