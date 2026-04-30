---
read_when:
    - Yuanbao 봇을 연결하려고 합니다
    - Yuanbao 채널을 구성하고 있습니다
summary: Yuanbao 봇 개요, 기능 및 설정
title: Yuanbao
x-i18n:
    generated_at: "2026-04-30T06:20:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao는 Tencent의 AI 어시스턴트 플랫폼입니다. OpenClaw 채널 Plugin은
Yuanbao 봇을 WebSocket을 통해 OpenClaw에 연결하여 사용자가
다이렉트 메시지와 그룹 채팅으로 상호작용할 수 있게 합니다.

**상태:** 봇 DM 및 그룹 채팅에 프로덕션 사용 가능. WebSocket이 유일하게 지원되는 연결 모드입니다.

---

## 빠른 시작

> **OpenClaw 2026.4.10 이상이 필요합니다.** 확인하려면 `openclaw --version`을 실행하세요. `openclaw update`로 업그레이드하세요.

<Steps>
  <Step title="자격 증명으로 Yuanbao 채널 추가">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` 값은 콜론으로 구분된 `appKey:appSecret` 형식을 사용합니다. Yuanbao 앱의 애플리케이션 설정에서 로봇을 생성하여 이 값을 얻을 수 있습니다.
  </Step>

  <Step title="설정이 완료되면 Gateway를 다시 시작하여 변경 사항 적용">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 대화형 설정(대안)

대화형 마법사를 사용할 수도 있습니다.

```bash
openclaw channels login --channel yuanbao
```

프롬프트에 따라 App ID와 App Secret을 입력하세요.

---

## 접근 제어

### 다이렉트 메시지

봇에게 DM을 보낼 수 있는 사용자를 제어하려면 `dmPolicy`를 구성하세요.

- `"pairing"` — 알 수 없는 사용자는 페어링 코드를 받으며, CLI로 승인합니다.
- `"allowlist"` — `allowFrom`에 나열된 사용자만 채팅할 수 있습니다.
- `"open"` — 모든 사용자를 허용합니다(기본값).
- `"disabled"` — 모든 DM을 비활성화합니다.

**페어링 요청 승인:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 그룹 채팅

**멘션 요구 사항**(`channels.yuanbao.requireMention`):

- `true` — @멘션이 필요합니다(기본값).
- `false` — @멘션 없이 응답합니다.

그룹 채팅에서 봇의 메시지에 답장하는 것은 암시적 멘션으로 처리됩니다.

---

## 구성 예시

### 공개 DM 정책을 사용하는 기본 설정

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

### 특정 사용자로 DM 제한

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

### 그룹에서 @멘션 요구 사항 비활성화

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### 발신 메시지 전달 최적화

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### 텍스트 병합 전략 조정

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## 일반 명령

| 명령       | 설명                   |
| ---------- | ---------------------- |
| `/help`    | 사용 가능한 명령 표시  |
| `/status`  | 봇 상태 표시           |
| `/new`     | 새 세션 시작           |
| `/stop`    | 현재 실행 중지         |
| `/restart` | OpenClaw 다시 시작     |
| `/compact` | 세션 컨텍스트 압축     |

> Yuanbao는 네이티브 슬래시 명령 메뉴를 지원합니다. 명령은 Gateway가 시작될 때 플랫폼에 자동으로 동기화됩니다.

---

## 문제 해결

### 봇이 그룹 채팅에서 응답하지 않음

1. 봇이 그룹에 추가되었는지 확인하세요.
2. 봇을 @멘션했는지 확인하세요(기본적으로 필요).
3. 로그를 확인하세요: `openclaw logs --follow`

### 봇이 메시지를 받지 못함

1. 봇이 Yuanbao 앱에서 생성되고 승인되었는지 확인하세요.
2. `appKey`와 `appSecret`이 올바르게 구성되었는지 확인하세요.
3. Gateway가 실행 중인지 확인하세요: `openclaw gateway status`
4. 로그를 확인하세요: `openclaw logs --follow`

### 봇이 빈 답변 또는 대체 답변을 보냄

1. AI 모델이 유효한 콘텐츠를 반환하는지 확인하세요.
2. 기본 대체 답변은 다음과 같습니다: "暂时无法解答，你可以换个问题问问我哦"
3. `channels.yuanbao.fallbackReply`를 통해 사용자 지정하세요.

### App Secret 유출

1. Yuanbao 앱에서 App Secret을 재설정하세요.
2. 구성의 값을 업데이트하세요.
3. Gateway를 다시 시작하세요: `openclaw gateway restart`

---

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

`defaultAccount`는 발신 API가 `accountId`를 지정하지 않을 때 사용할 계정을 제어합니다.

### 메시지 제한

- `maxChars` — 단일 메시지 최대 문자 수(기본값: `3000`자)
- `mediaMaxMb` — 미디어 업로드/다운로드 제한(기본값: `20`MB)
- `overflowPolicy` — 메시지가 제한을 초과할 때의 동작: `"split"`(기본값) 또는 `"stop"`

### 스트리밍

Yuanbao는 블록 수준 스트리밍 출력을 지원합니다. 활성화하면 봇은 생성하는 동안 텍스트를 청크로 보냅니다.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

완성된 답변을 하나의 메시지로 보내려면 `disableBlockStreaming: true`를 설정하세요.

### 그룹 채팅 기록 컨텍스트

그룹 채팅의 AI 컨텍스트에 포함할 기록 메시지 수를 제어합니다.

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### 답장 대상 모드

그룹 채팅에서 답장할 때 봇이 메시지를 인용하는 방식을 제어합니다.

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| 값        | 동작                                         |
| --------- | -------------------------------------------- |
| `"off"`   | 인용 답장을 하지 않음                        |
| `"first"` | 수신 메시지당 첫 번째 답장만 인용(기본값)    |
| `"all"`   | 모든 답장 인용                               |

### Markdown 힌트 주입

기본적으로 봇은 AI 모델이 전체 답변을 markdown 코드 블록으로 감싸지 않도록 시스템 프롬프트에 지침을 주입합니다.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### 디버그 모드

특정 봇 ID에 대해 정리되지 않은 로그 출력을 활성화합니다.

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### 다중 에이전트 라우팅

Yuanbao DM 또는 그룹을 다른 에이전트로 라우팅하려면 `bindings`를 사용하세요.

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

라우팅 필드:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"`(DM) 또는 `"group"`(그룹 채팅)
- `match.peer.id`: 사용자 ID 또는 그룹 코드

---

## 구성 참조

전체 구성: [Gateway 구성](/ko/gateway/configuration)

| 설정                                       | 설명                                              | 기본값                                 |
| ------------------------------------------ | ------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | 채널 활성화/비활성화                              | `true`                                 |
| `channels.yuanbao.defaultAccount`          | 발신 라우팅의 기본 계정                           | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key(서명 및 티켓 생성에 사용)                 | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret(서명에 사용)                           | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | 사전 서명된 토큰(자동 티켓 서명 건너뜀)           | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | 계정 표시 이름                                    | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | 특정 계정 활성화/비활성화                         | `true`                                 |
| `channels.yuanbao.dm.policy`               | DM 정책                                           | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | DM 허용 목록(사용자 ID 목록)                      | —                                      |
| `channels.yuanbao.requireMention`          | 그룹에서 @멘션 필요                               | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | 긴 메시지 처리(`split` 또는 `stop`)               | `split`                                |
| `channels.yuanbao.replyToMode`             | 그룹 답장 대상 전략(`off`, `first`, `all`)        | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | 발신 전략(`merge-text` 또는 `immediate`)          | `merge-text`                           |
| `channels.yuanbao.minChars`                | 텍스트 병합: 전송을 트리거할 최소 문자 수         | `2800`                                 |
| `channels.yuanbao.maxChars`                | 텍스트 병합: 메시지당 최대 문자 수                | `3000`                                 |
| `channels.yuanbao.idleMs`                  | 텍스트 병합: 자동 플러시 전 유휴 시간 제한(ms)    | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | 미디어 크기 제한(MB)                              | `20`                                   |
| `channels.yuanbao.historyLimit`            | 그룹 채팅 기록 컨텍스트 항목                      | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | 블록 수준 스트리밍 출력 비활성화                  | `false`                                |
| `channels.yuanbao.fallbackReply`           | AI가 콘텐츠를 반환하지 않을 때의 대체 답변        | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | markdown 래핑 방지 지침 주입                      | `true`                                 |
| `channels.yuanbao.debugBotIds`             | 디버그 허용 목록 봇 ID(정리되지 않은 로그)        | `[]`                                   |

---

## 지원되는 메시지 유형

### 수신

- ✅ 텍스트
- ✅ 이미지
- ✅ 파일
- ✅ 오디오 / 음성
- ✅ 동영상
- ✅ 스티커 / 사용자 지정 이모지
- ✅ 사용자 지정 요소(링크 카드 등)

### 전송

- ✅ 텍스트(markdown 지원 포함)
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ✅ 동영상
- ✅ 스티커

### 스레드와 답장

- ✅ 인용 답장(`replyToMode`를 통해 구성 가능)
- ❌ 스레드 답장(플랫폼에서 지원되지 않음)

---

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
