---
read_when:
    - OpenClaw를 IRC 채널 또는 DM에 연결하려고 합니다
    - IRC 허용 목록, 그룹 정책 또는 멘션 게이팅을 구성하고 있습니다
summary: IRC Plugin 설정, 액세스 제어 및 문제 해결
title: IRC
x-i18n:
    generated_at: "2026-07-12T14:58:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

클래식 채널(`#room`)과 다이렉트 메시지에서 OpenClaw를 사용하려면 IRC를 사용하십시오.
공식 IRC Plugin을 설치한 다음 `channels.irc`에서 구성하십시오.

## 빠른 시작

1. Plugin을 설치합니다.

```bash
openclaw plugins install @openclaw/irc
```

2. `~/.openclaw/openclaw.json`에서 최소한 호스트, 닉네임, 참여할 채널을 설정합니다.

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. Gateway를 시작하거나 재시작합니다.

```bash
openclaw gateway run
```

봇 조정에는 비공개 IRC 서버를 사용하는 것이 좋습니다. 의도적으로 공개 IRC 네트워크를 사용하는 경우 일반적인 선택지로 Libera.Chat, OFTC, Snoonet이 있습니다. 봇 또는 스웜의 백채널 트래픽에 예측 가능한 공개 채널을 사용하지 마십시오.

## 연결 설정

| 키                            | 기본값                        | 참고                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------- |
| `host`                        | 없음(필수)                    | IRC 서버 호스트 이름                                        |
| `port`                        | TLS 사용 시 `6697`, 평문 `6667` | 1-65535                                                     |
| `tls`                         | `true`                        | 의도적으로 평문을 사용할 때만 `false`로 설정                |
| `nick`                        | 없음(필수)                    | 봇 닉네임                                                   |
| `username`                    | 닉네임, 없으면 `openclaw`     | IRC 사용자 이름                                             |
| `realname`                    | `OpenClaw`                    | Realname/GECOS 필드                                         |
| `password` / `passwordFile`   | 없음                          | 서버 비밀번호. 파일은 일반 파일이어야 함                    |
| `channels`                    | 없음                          | 참여할 채널(`["#openclaw"]`)                                |
| `accounts` / `defaultAccount` | 없음                          | 다중 계정 설정. 환경 변수는 기본 계정에만 적용됨            |

## 보안 기본값

- IRC는 OpenClaw 운영자가 관리하는 포워드 프록시 라우팅 외부의 원시 TCP/TLS 소켓을 사용합니다. 모든 외부 트래픽이 해당 포워드 프록시를 통과해야 하는 배포 환경에서는 직접 IRC 외부 연결이 명시적으로 승인되지 않는 한 `channels.irc.enabled=false`로 설정하십시오.
- `channels.irc.dmPolicy`의 기본값은 `"pairing"`입니다. 알 수 없는 DM 발신자는 페어링 코드를 받으며, `openclaw pairing approve irc <code>`로 이를 승인합니다.
- `channels.irc.groupPolicy`의 기본값은 `"allowlist"`입니다.
- `groupPolicy="allowlist"`를 사용하는 경우 허용할 채널을 정의하도록 `channels.irc.groups`를 설정하십시오.
- 의도적으로 평문 전송을 허용하는 경우가 아니라면 TLS(`channels.irc.tls=true`)를 사용하십시오.

## 접근 제어

IRC 채널에는 서로 분리된 두 가지 "게이트"가 있습니다.

1. **채널 접근**(`groupPolicy` + `groups`): 봇이 해당 채널의 메시지를 수락할지 여부입니다.
2. **발신자 접근**(`groupAllowFrom` / 채널별 `groups["#channel"].allowFrom`): 해당 채널 내에서 봇을 트리거할 수 있는 사람을 결정합니다.

구성 키:

- DM 허용 목록(DM 발신자 접근): `channels.irc.allowFrom`
- 그룹 발신자 허용 목록(채널 발신자 접근): `channels.irc.groupAllowFrom`
- 채널별 제어(채널 + 발신자 + 멘션 규칙): `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills`, `systemPrompt`가 포함된 `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"`은 구성되지 않은 채널을 허용합니다(**기본적으로 여전히 멘션이 필요함**).

허용 목록 항목에는 안정적인 발신자 식별자(`nick!user@host`)를 사용해야 합니다.
닉네임만 사용하는 일치는 변경 가능하며 `channels.irc.dangerouslyAllowNameMatching: true`인 경우에만 활성화됩니다.

### 흔한 실수: `allowFrom`은 채널이 아닌 DM용입니다

다음과 같은 로그가 표시되는 경우:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...발신자가 **그룹/채널** 메시지에 대해 허용되지 않았다는 의미입니다. 다음 방법 중 하나로 해결하십시오.

- 모든 채널에 전역으로 적용되는 `channels.irc.groupAllowFrom`을 설정합니다.
- 채널별 발신자 허용 목록인 `channels.irc.groups["#channel"].allowFrom`을 설정합니다.

예시(`#openclaw`의 모든 사용자가 봇과 대화하도록 허용):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 응답 트리거(멘션)

채널이 `groupPolicy` + `groups`를 통해 허용되고 발신자도 허용되더라도, OpenClaw는 그룹 컨텍스트에서 기본적으로 **멘션 게이트**를 적용합니다. 메시지에 연결된 봇 닉네임이 포함되거나 구성한 멘션 패턴과 일치하면 봇이 멘션된 것으로 간주합니다.

즉, 메시지에 봇과 일치하는 멘션 패턴이 포함되지 않으면 `drop channel … (missing-mention)`과 같은 로그가 표시될 수 있습니다.

IRC 채널에서 **멘션 없이** 봇이 응답하도록 하려면 해당 채널의 멘션 게이트를 비활성화하십시오.

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

또는 채널별 허용 목록 없이 **모든** IRC 채널을 허용하면서 멘션 없이 응답하도록 하려면 다음과 같이 설정합니다.

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## 보안 참고 사항(공개 채널에 권장)

공개 채널에서 `allowFrom: ["*"]`을 허용하면 누구나 봇에 프롬프트를 보낼 수 있습니다.
위험을 줄이려면 해당 채널의 도구를 제한하십시오.

### 채널의 모든 사용자에게 동일한 도구 적용

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### 발신자별로 다른 도구 적용(소유자에게 더 많은 권한 부여)

`toolsBySender`를 사용하여 `"*"`에는 더 엄격한 정책을, 자신의 닉네임에는 더 완화된 정책을 적용하십시오.

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

참고:

- `toolsBySender` 키에는 명시적인 접두사(`channel:`, `id:`, `e164:`, `username:`, `name:`)를 사용해야 합니다. IRC에서는 발신자 식별자 값과 함께 `id:`를 사용하십시오. 더 강력한 일치를 위해 `id:alice` 또는 `id:alice!~alice@203.0.113.7`을 사용할 수 있습니다.
- 기존의 접두사 없는 키도 계속 허용되지만 `id:`로만 일치하며 지원 중단 경고가 표시됩니다.
- 처음 일치하는 발신자 정책이 적용되며, `"*"`는 와일드카드 대체 정책입니다.

그룹 접근과 멘션 게이트의 차이 및 상호작용에 대한 자세한 내용은 [/channels/groups](/ko/channels/groups)를 참조하십시오.

## NickServ

연결 후 NickServ로 식별하려면 다음과 같이 설정합니다.

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

비밀번호가 설정되어 있으면 기본적으로 항상 NickServ 식별이 실행됩니다. 비활성화하려는 경우에만 `enabled`를 `false`로 설정하면 됩니다. `service`의 기본값은 `NickServ`이며, 인라인 `password` 대신 `passwordFile`을 사용할 수 있습니다.

연결 시 선택적으로 한 번만 등록하려면 다음과 같이 설정합니다(`register: true`에는 `registerEmail`이 필요함).

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

닉네임 등록 후 반복적인 REGISTER 시도를 방지하려면 `register`를 비활성화하십시오.

## 환경 변수

기본 계정은 다음을 지원합니다.

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`(쉼표로 구분)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST`는 워크스페이스 `.env`에서 설정할 수 없습니다. [워크스페이스 `.env` 파일](/ko/gateway/security)을 참조하십시오.

## 문제 해결

- 봇이 연결되지만 채널에서 전혀 응답하지 않는 경우 `channels.irc.groups`와 멘션 게이트가 메시지를 삭제하고 있는지(`missing-mention`)를 **모두** 확인하십시오. 멘션 없이 응답하게 하려면 해당 채널에 `requireMention:false`를 설정하십시오.
- 로그인에 실패하면 닉네임 사용 가능 여부와 서버 비밀번호를 확인하십시오.
- 사용자 지정 네트워크에서 TLS가 실패하면 호스트/포트와 인증서 설정을 확인하십시오.

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [채널 라우팅](/ko/channels/channel-routing) — 메시지 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
