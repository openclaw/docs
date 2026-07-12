---
read_when:
    - Yuanbao 봇에 연결하려고 합니다
    - Yuanbao 채널을 구성하고 있습니다.
summary: Yuanbao 봇 개요, 기능 및 구성
title: 위안바오
x-i18n:
    generated_at: "2026-07-12T15:03:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao는 Tencent의 AI 어시스턴트 플랫폼입니다. 커뮤니티에서 유지 관리하는 `openclaw-plugin-yuanbao` plugin은 다이렉트 메시지와 그룹 채팅을 위해 WebSocket을 통해 Yuanbao 봇을 OpenClaw에 연결합니다.

**상태:** 봇 DM 및 그룹 채팅에 프로덕션용으로 사용할 수 있습니다. WebSocket이 유일하게 지원되는 연결 모드입니다. 이 plugin은 OpenClaw 코어가 아니라 Tencent Yuanbao 팀에서 외부 카탈로그 항목으로 유지 관리합니다. 아래의 구성/동작 세부 정보(설치 및 일반 CLI 기능 제외)는 plugin 자체 문서에서 가져왔으며 OpenClaw 코어 소스를 기준으로 검증되지 않았습니다.

## 빠른 시작

OpenClaw 2026.4.10 이상이 필요합니다. `openclaw --version`으로 확인하고 `openclaw update`로 업그레이드하십시오.

<Steps>
  <Step title="자격 증명으로 Yuanbao 채널 추가">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token`은 콜론으로 구분된 `appKey:appSecret`을 사용합니다. 애플리케이션 설정에서 봇을 생성하여 Yuanbao 앱에서 이 값을 가져오십시오.
  </Step>

  <Step title="변경 사항을 적용하도록 Gateway 다시 시작">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 대화형 설정(대안)

```bash
openclaw channels login --channel yuanbao
```

프롬프트에 따라 App ID와 App Secret을 입력하십시오.

## 접근 제어

### 다이렉트 메시지

`channels.yuanbao.dm.policy`:

| 값               | 동작                                                  |
| ---------------- | ----------------------------------------------------- |
| `open` (기본값)  | 모든 사용자 허용                                     |
| `pairing`        | 알 수 없는 사용자에게 페어링 코드 제공, CLI에서 승인 |
| `allowlist`      | `allowFrom`에 있는 사용자만 채팅 가능                 |
| `disabled`       | 모든 DM 비활성화                                     |

페어링 요청을 승인합니다.

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 그룹 채팅

`channels.yuanbao.requireMention`(기본값 `true`): 봇이 그룹에서 응답하기 전에 @멘션이 필요합니다. 봇 자체 메시지에 답장하면 암시적 멘션으로 처리됩니다.

## 구성 예시

기본 설정, 개방형 DM 정책:

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

특정 사용자로 DM을 제한합니다.

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

그룹에서 @멘션 요구 사항을 비활성화합니다.

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

아웃바운드 전송 조정:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // 이 문자 수에 도달할 때까지 버퍼링
      maxChars: 3000, // 이 제한을 초과하면 강제로 분할
      idleMs: 5000, // 유휴 시간 제한 후 자동 플러시(ms)
    },
  },
}
```

각 청크를 버퍼링 없이 전송하려면 `outboundQueueStrategy: "immediate"`로 설정하십시오.

## 일반 명령어

| 명령어     | 설명                    |
| ---------- | ----------------------- |
| `/help`    | 사용 가능한 명령어 표시 |
| `/status`  | 봇 상태 표시            |
| `/new`     | 새 세션 시작            |
| `/stop`    | 현재 실행 중지          |
| `/restart` | OpenClaw 다시 시작      |
| `/compact` | 세션 컨텍스트 압축      |

Yuanbao는 네이티브 슬래시 명령어 메뉴를 지원합니다. Gateway가 시작되면 명령어가 플랫폼에 자동으로 동기화됩니다.

## 문제 해결

**그룹 채팅에서 봇이 응답하지 않는 경우:**

1. 봇이 그룹에 추가되었는지 확인합니다
2. 봇을 @멘션했는지 확인합니다(기본적으로 필수)
3. 로그를 확인합니다: `openclaw logs --follow`

**봇이 메시지를 수신하지 못하는 경우:**

1. Yuanbao 앱에서 봇이 생성되고 승인되었는지 확인합니다
2. `appKey`와 `appSecret`이 올바르게 구성되었는지 확인합니다
3. Gateway가 실행 중인지 확인합니다: `openclaw gateway status`
4. 로그를 확인합니다: `openclaw logs --follow`

**봇이 빈 답변이나 대체 답변을 보내는 경우:**

1. AI 모델이 유효한 콘텐츠를 반환하는지 확인합니다
2. 기본 대체 답변: "暂时无法解答，你可以换个问题问问我哦"
3. `channels.yuanbao.fallbackReply`로 사용자 지정합니다

**App Secret이 유출된 경우:**

1. Yuanbao 앱에서 App Secret을 재설정합니다
2. 구성의 값을 업데이트합니다
3. Gateway를 다시 시작합니다: `openclaw gateway restart`

## 고급 구성

### 여러 계정

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`는 아웃바운드 API가 `accountId`를 지정하지 않을 때 사용할 계정을 제어합니다.

### 메시지 제한

- `maxChars`: 단일 메시지의 최대 문자 수(기본값 `3000`)
- `mediaMaxMb`: 미디어 업로드/다운로드 제한(기본값 `20` MB)
- `overflowPolicy`: 메시지가 제한을 초과할 때의 동작으로, `"split"`(기본값) 또는 `"stop"`

### 스트리밍

Yuanbao는 블록 수준 스트리밍 출력을 지원합니다. 봇은 텍스트를 생성하면서 청크 단위로 전송합니다.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // 블록 스트리밍 활성화(기본값)
    },
  },
}
```

전체 답변을 하나의 메시지로 보내려면 `disableBlockStreaming: true`로 설정하십시오.

### 그룹 채팅 기록 컨텍스트

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // 기본값: 100, 비활성화하려면 0으로 설정
    },
  },
}
```

그룹 채팅의 AI 컨텍스트에 포함할 이전 메시지 수를 제어합니다.

### 답장 대상 모드

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (기본값: "first")
    },
  },
}
```

| 값      | 동작                                                    |
| ------- | ------------------------------------------------------- |
| `off`   | 인용 답장 없음                                          |
| `first` | 각 수신 메시지에 대한 첫 번째 답변만 인용(기본값)       |
| `all`   | 모든 답변 인용                                          |

### Markdown 힌트 삽입

기본적으로 봇은 모델이 전체 답변을 Markdown 코드 블록으로 감싸지 않도록 시스템 프롬프트 지침을 삽입합니다.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // 기본값: true
    },
  },
}
```

### 디버그 모드

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

나열된 봇 ID에 대해 정제되지 않은 로그 출력을 활성화합니다.

### 멀티 에이전트 라우팅

`bindings`를 사용하여 Yuanbao DM 또는 그룹을 서로 다른 에이전트로 라우팅합니다.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"`(DM) 또는 `"group"`(그룹 채팅)
- `match.peer.id`: 사용자 ID 또는 그룹 코드

## 구성 참조

전체 구성: [Gateway 구성](/ko/gateway/configuration)

| 설정                                       | 설명                                               | 기본값                                 |
| ------------------------------------------ | -------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | 채널 활성화/비활성화                               | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 아웃바운드 라우팅의 기본 계정                      | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key(서명 + 티켓 생성)                          | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret(서명)                                   | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | 사전 서명된 토큰(자동 티켓 서명 생략)              | -                                      |
| `channels.yuanbao.accounts.<id>.name`      | 계정 표시 이름                                     | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 특정 계정 활성화/비활성화                          | `true`                                 |
| `channels.yuanbao.dm.policy`               | DM 정책                                            | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | DM 허용 목록(사용자 ID 목록)                       | -                                      |
| `channels.yuanbao.requireMention`          | 그룹에서 @멘션 요구                                | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 긴 메시지 처리(`split` 또는 `stop`)                | `split`                                |
| `channels.yuanbao.replyToMode`             | 그룹 답장 대상 전략(`off`, `first`, `all`)         | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 아웃바운드 전략(`merge-text` 또는 `immediate`)     | `merge-text`                           |
| `channels.yuanbao.minChars`                | 텍스트 병합: 전송을 트리거할 최소 문자 수          | `2800`                                 |
| `channels.yuanbao.maxChars`                | 텍스트 병합: 메시지당 최대 문자 수                 | `3000`                                 |
| `channels.yuanbao.idleMs`                  | 텍스트 병합: 자동 플러시 전 유휴 시간 제한(ms)     | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | 미디어 크기 제한(MB)                               | `20`                                   |
| `channels.yuanbao.historyLimit`            | 그룹 채팅 기록 컨텍스트 항목 수                    | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | 블록 수준 스트리밍 출력 비활성화                   | `false`                                |
| `channels.yuanbao.fallbackReply`           | 모델이 콘텐츠를 반환하지 않을 때의 대체 답변       | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Markdown 전체 감싸기 방지 지침 삽입                | `true`                                 |
| `channels.yuanbao.debugBotIds`             | 디버그 허용 목록 봇 ID(정제되지 않은 로그)         | `[]`                                   |

## 지원되는 메시지 유형

**수신:** 텍스트, 이미지, 파일, 오디오/음성, 동영상, 스티커/사용자 지정 이모지, 사용자 지정 요소(링크 카드).

**전송:** 텍스트(Markdown), 이미지, 파일, 오디오, 동영상, 스티커.

**스레드 및 답장:** 인용 답장(`replyToMode`로 구성 가능), 스레드 답장은 플랫폼에서 지원하지 않습니다.

## 관련 문서

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 제한
- [채널 라우팅](/ko/channels/channel-routing) - 메시지의 세션 라우팅
- [보안](/ko/gateway/security) - 접근 모델 및 강화
