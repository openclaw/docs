---
read_when:
    - OpenClaw를 IRC 채널 또는 DM에 연결하려는 경우
    - IRC 허용 목록, 그룹 정책 또는 멘션 게이팅을 구성하고 있습니다
summary: IRC Plugin 설정, 접근 제어 및 문제 해결
title: IRC
x-i18n:
    generated_at: "2026-05-04T02:21:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43c3098fe49a5e7405443df73e1bf752a579460dc0b2070c3d07f43b512bb555
    source_path: channels/irc.md
    workflow: 16
---

클래식 채널(`#room`)과 다이렉트 메시지에서 OpenClaw를 사용하려면 IRC를 사용하세요.
IRC는 번들 Plugin으로 제공되지만, 기본 구성의 `channels.irc` 아래에서 설정됩니다.

## 빠른 시작

1. `~/.openclaw/openclaw.json`에서 IRC 구성을 활성화합니다.
2. 최소한 다음을 설정합니다.

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

봇 조정을 위해서는 비공개 IRC 서버를 선호하세요. 의도적으로 공개 IRC 네트워크를 사용하는 경우 일반적인 선택지는 Libera.Chat, OFTC, Snoonet입니다. 봇 또는 스웜 백채널 트래픽에는 예측 가능한 공개 채널을 피하세요.

3. gateway를 시작/재시작합니다.

```bash
openclaw gateway run
```

## 보안 기본값

- IRC는 OpenClaw 운영자 관리형 전달 프록시 라우팅 외부에서 원시 TCP/TLS 소켓을 사용합니다. 모든 송신 트래픽이 해당 전달 프록시를 거쳐야 하는 배포에서는 직접 IRC 송신이 명시적으로 승인되지 않는 한 `channels.irc.enabled=false`를 설정하세요.
- `channels.irc.dmPolicy`의 기본값은 `"pairing"`입니다.
- `channels.irc.groupPolicy`의 기본값은 `"allowlist"`입니다.
- `groupPolicy="allowlist"`를 사용할 때는 `channels.irc.groups`를 설정해 허용된 채널을 정의하세요.
- 의도적으로 평문 전송을 허용하는 경우가 아니라면 TLS(`channels.irc.tls=true`)를 사용하세요.

## 접근 제어

IRC 채널에는 두 개의 별도 “게이트”가 있습니다.

1. **채널 접근**(`groupPolicy` + `groups`): 봇이 해당 채널의 메시지를 아예 허용할지 여부입니다.
2. **발신자 접근**(`groupAllowFrom` / 채널별 `groups["#channel"].allowFrom`): 해당 채널 안에서 봇을 트리거할 수 있는 사람입니다.

구성 키:

- DM 허용 목록(DM 발신자 접근): `channels.irc.allowFrom`
- 그룹 발신자 허용 목록(채널 발신자 접근): `channels.irc.groupAllowFrom`
- 채널별 제어(채널 + 발신자 + 멘션 규칙): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"`은 구성되지 않은 채널을 허용합니다(**그래도 기본적으로 멘션 게이트가 적용됨**)

허용 목록 항목은 안정적인 발신자 ID(`nick!user@host`)를 사용해야 합니다.
단순 닉네임 매칭은 변경 가능하며 `channels.irc.dangerouslyAllowNameMatching: true`일 때만 활성화됩니다.

### 흔한 함정: `allowFrom`은 DM용이며 채널용이 아닙니다

다음과 같은 로그가 보이면:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…이는 발신자가 **그룹/채널** 메시지에 대해 허용되지 않았다는 뜻입니다. 다음 중 하나로 수정하세요.

- `channels.irc.groupAllowFrom` 설정(모든 채널에 전역 적용), 또는
- 채널별 발신자 허용 목록 설정: `channels.irc.groups["#channel"].allowFrom`

예시(`#tuirc-dev`의 누구나 봇에게 말할 수 있게 허용):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 응답 트리거(멘션)

채널이 허용되어 있고(`groupPolicy` + `groups` 사용) 발신자도 허용되어 있더라도 OpenClaw는 그룹 컨텍스트에서 기본적으로 **멘션 게이트**를 적용합니다.

즉, 메시지에 봇과 일치하는 멘션 패턴이 포함되어 있지 않으면 `drop channel … (missing-mention)` 같은 로그가 보일 수 있습니다.

IRC 채널에서 **멘션 없이도** 봇이 응답하게 하려면 해당 채널의 멘션 게이트를 비활성화하세요.

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

또는 **모든** IRC 채널을 허용하고(채널별 허용 목록 없음) 멘션 없이도 응답하게 하려면:

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

공개 채널에서 `allowFrom: ["*"]`를 허용하면 누구나 봇에 프롬프트를 보낼 수 있습니다.
위험을 줄이려면 해당 채널의 도구를 제한하세요.

### 채널의 모든 사람에게 동일한 도구 적용

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
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

### 발신자별 다른 도구 적용(소유자는 더 많은 권한 획득)

`toolsBySender`를 사용해 `"*"`에는 더 엄격한 정책을, 내 닉네임에는 더 느슨한 정책을 적용하세요.

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
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

- `toolsBySender` 키는 IRC 발신자 ID 값에 `id:`를 사용해야 합니다.
  더 강한 매칭을 위해 `id:eigen` 또는 `id:eigen!~eigen@174.127.248.171`을 사용합니다.
- 레거시 접두사 없는 키도 여전히 허용되며 `id:`로만 매칭됩니다.
- 처음 일치하는 발신자 정책이 적용되며, `"*"`는 와일드카드 폴백입니다.

그룹 접근과 멘션 게이트의 차이(및 상호 작용)에 대한 자세한 내용은 다음을 참고하세요: [/channels/groups](/ko/channels/groups).

## NickServ

연결 후 NickServ로 식별하려면:

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

연결 시 선택적 일회성 등록:

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

닉네임이 등록된 후에는 반복적인 REGISTER 시도를 피하기 위해 `register`를 비활성화하세요.

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

`IRC_HOST`는 워크스페이스 `.env`에서 설정할 수 없습니다. [워크스페이스 `.env` 파일](/ko/gateway/security)을 참고하세요.

## 문제 해결

- 봇이 연결되지만 채널에서 전혀 응답하지 않는다면 `channels.irc.groups` **및** 멘션 게이트가 메시지를 삭제하고 있는지(`missing-mention`) 확인하세요. 핑 없이 응답하게 하려면 해당 채널에 `requireMention:false`를 설정하세요.
- 로그인이 실패하면 닉네임 사용 가능 여부와 서버 비밀번호를 확인하세요.
- 사용자 지정 네트워크에서 TLS가 실패하면 호스트/포트와 인증서 설정을 확인하세요.

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [채널 라우팅](/ko/channels/channel-routing) — 메시지에 대한 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
