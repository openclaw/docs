---
read_when:
    - Feishu/Lark 봇을 연결하려고 합니다
    - Feishu 채널을 구성하고 있습니다
summary: Feishu 봇 개요, 기능 및 구성
title: Feishu
x-i18n:
    generated_at: "2026-04-26T11:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95a50a7cd7b290afe0a0db3a1b39c7305f6a0e7d0702597fb9a50b5a45afa855
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark는 팀이 채팅하고, 문서를 공유하고, 캘린더를 관리하며, 함께 업무를 수행할 수 있는 올인원 협업 플랫폼입니다.

**상태:** 봇 DM 및 그룹 채팅에 대해 프로덕션 준비 완료. 기본 모드는 WebSocket이며, Webhook 모드는 선택 사항입니다.

---

## 빠른 시작

> **OpenClaw 2026.4.25 이상이 필요합니다.** 확인하려면 `openclaw --version`을 실행하세요. 업그레이드하려면 `openclaw update`를 실행하세요.

<Steps>
  <Step title="채널 설정 마법사 실행">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu/Lark 모바일 앱으로 QR 코드를 스캔하면 Feishu/Lark 봇이 자동으로 생성됩니다.
  </Step>
  
  <Step title="설정이 완료된 후 변경 사항을 적용하려면 Gateway를 다시 시작하세요">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## 액세스 제어

### 다이렉트 메시지

`dmPolicy`를 구성하여 누가 봇에 DM을 보낼 수 있는지 제어합니다.

- `"pairing"` — 알 수 없는 사용자는 페어링 코드를 받으며, CLI를 통해 승인할 수 있습니다
- `"allowlist"` — `allowFrom`에 나열된 사용자만 채팅할 수 있습니다(기본값: 봇 소유자만)
- `"open"` — 모든 사용자 허용
- `"disabled"` — 모든 DM 비활성화

**페어링 요청 승인:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 그룹 채팅

**그룹 정책** (`channels.feishu.groupPolicy`):

| 값            | 동작                                      |
| ------------- | ----------------------------------------- |
| `"open"`      | 그룹의 모든 메시지에 응답                 |
| `"allowlist"` | `groupAllowFrom`에 있는 그룹에만 응답     |
| `"disabled"`  | 모든 그룹 메시지 비활성화                 |

기본값: `allowlist`

**멘션 요구 사항** (`channels.feishu.requireMention`):

- `true` — @멘션 필요(기본값)
- `false` — @멘션 없이 응답
- 그룹별 재정의: `channels.feishu.groups.<chat_id>.requireMention`

---

## 그룹 구성 예시

### 모든 그룹 허용, @멘션 필요 없음

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### 모든 그룹 허용, 여전히 @멘션 필요

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### 특정 그룹만 허용

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // 그룹 ID 예시: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### 그룹 내 발신자 제한

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // 사용자 open_id 예시: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## 그룹/사용자 ID 가져오기

### 그룹 ID (`chat_id`, 형식: `oc_xxx`)

Feishu/Lark에서 그룹을 열고, 오른쪽 상단의 메뉴 아이콘을 클릭한 다음 **Settings**로 이동하세요. 그룹 ID(`chat_id`)는 설정 페이지에 표시됩니다.

![그룹 ID 가져오기](/images/feishu-get-group-id.png)

### 사용자 ID (`open_id`, 형식: `ou_xxx`)

Gateway를 시작하고 봇에 DM을 보낸 다음 로그를 확인하세요.

```bash
openclaw logs --follow
```

로그 출력에서 `open_id`를 찾으세요. 보류 중인 페어링 요청도 확인할 수 있습니다.

```bash
openclaw pairing list feishu
```

---

## 일반 명령어

| 명령어    | 설명                         |
| --------- | ---------------------------- |
| `/status` | 봇 상태 표시                 |
| `/reset`  | 현재 세션 재설정             |
| `/model`  | AI 모델 표시 또는 전환       |

> Feishu/Lark는 기본 슬래시 명령 메뉴를 지원하지 않으므로, 이를 일반 텍스트 메시지로 보내세요.

---

## 문제 해결

### 그룹 채팅에서 봇이 응답하지 않음

1. 봇이 그룹에 추가되어 있는지 확인하세요
2. 봇을 @멘션했는지 확인하세요(기본적으로 필수)
3. `groupPolicy`가 `"disabled"`가 아닌지 확인하세요
4. 로그를 확인하세요: `openclaw logs --follow`

### 봇이 메시지를 수신하지 않음

1. Feishu Open Platform / Lark Developer에서 봇이 게시되고 승인되었는지 확인하세요
2. 이벤트 구독에 `im.message.receive_v1`이 포함되어 있는지 확인하세요
3. **persistent connection**(WebSocket)이 선택되어 있는지 확인하세요
4. 필요한 모든 권한 범위가 부여되었는지 확인하세요
5. Gateway가 실행 중인지 확인하세요: `openclaw gateway status`
6. 로그를 확인하세요: `openclaw logs --follow`

### App Secret 유출

1. Feishu Open Platform / Lark Developer에서 App Secret을 재설정하세요
2. 구성에서 값을 업데이트하세요
3. Gateway를 다시 시작하세요: `openclaw gateway restart`

---

## 고급 구성

### 여러 계정

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`는 아웃바운드 API가 `accountId`를 지정하지 않을 때 어떤 계정을 사용할지 제어합니다.
`accounts.<id>.tts`는 `messages.tts`와 동일한 형태를 사용하며 전역 TTS 구성 위에 딥 머지되므로,
여러 봇을 사용하는 Feishu 구성에서는 공유 공급자 자격 증명을 전역으로 유지하면서 계정별로 음성, 모델, 페르소나 또는 자동 모드만 재정의할 수 있습니다.

### 메시지 제한

- `textChunkLimit` — 아웃바운드 텍스트 청크 크기(기본값: `2000`자)
- `mediaMaxMb` — 미디어 업로드/다운로드 제한(기본값: `30` MB)

### 스트리밍

Feishu/Lark는 대화형 카드를 통해 스트리밍 응답을 지원합니다. 활성화하면 봇이 텍스트를 생성하는 동안 카드를 실시간으로 업데이트합니다.

```json5
{
  channels: {
    feishu: {
      streaming: true, // 스트리밍 카드 출력 활성화(기본값: true)
      blockStreaming: true, // 블록 수준 스트리밍 활성화(기본값: true)
    },
  },
}
```

`streaming: false`로 설정하면 완전한 응답을 하나의 메시지로 보냅니다.

### 할당량 최적화

두 개의 선택적 플래그를 사용해 Feishu/Lark API 호출 수를 줄일 수 있습니다.

- `typingIndicator` (기본값 `true`): 입력 중 반응 호출을 건너뛰려면 `false`로 설정
- `resolveSenderNames` (기본값 `true`): 발신자 프로필 조회를 건너뛰려면 `false`로 설정

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### ACP 세션

Feishu/Lark는 DM 및 그룹 스레드 메시지에 대해 ACP를 지원합니다. Feishu/Lark ACP는 텍스트 명령 기반으로 작동하며 기본 슬래시 명령 메뉴가 없으므로, 대화에서 `/acp ...` 메시지를 직접 사용하세요.

#### 영구 ACP 바인딩

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### 채팅에서 ACP 생성

Feishu/Lark DM 또는 스레드에서:

```text
/acp spawn codex --thread here
```

`--thread here`는 DM과 Feishu/Lark 스레드 메시지에서 작동합니다. 이후 바인딩된 대화의 후속 메시지는 해당 ACP 세션으로 직접 라우팅됩니다.

### 멀티 에이전트 라우팅

`bindings`를 사용해 Feishu/Lark DM 또는 그룹을 서로 다른 에이전트로 라우팅합니다.

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
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

라우팅 필드:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) 또는 `"group"` (그룹 채팅)
- `match.peer.id`: 사용자 Open ID (`ou_xxx`) 또는 그룹 ID (`oc_xxx`)

조회 팁은 [그룹/사용자 ID 가져오기](#get-groupuser-ids)를 참조하세요.

---

## 구성 참조

전체 구성: [Gateway configuration](/ko/gateway/configuration)

| 설정                                              | 설명                                       | 기본값           |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | 채널 활성화/비활성화                       | `true`           |
| `channels.feishu.domain`                          | API 도메인 (`feishu` 또는 `lark`)          | `feishu`         |
| `channels.feishu.connectionMode`                  | 이벤트 전송 방식 (`websocket` 또는 `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | 아웃바운드 라우팅용 기본 계정              | `default`        |
| `channels.feishu.verificationToken`               | Webhook 모드에 필요                        | —                |
| `channels.feishu.encryptKey`                      | Webhook 모드에 필요                        | —                |
| `channels.feishu.webhookPath`                     | Webhook 라우트 경로                        | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook 바인드 호스트                      | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook 바인드 포트                        | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | 계정별 도메인 재정의                       | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | 계정별 TTS 재정의                          | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DM 정책                                    | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM 허용 목록(open_id 목록)                 | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | 그룹 정책                                  | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | 그룹 허용 목록                             | —                |
| `channels.feishu.requireMention`                  | 그룹에서 @멘션 필요                        | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | 그룹별 @멘션 재정의                        | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | 특정 그룹 활성화/비활성화                  | `true`           |
| `channels.feishu.textChunkLimit`                  | 메시지 청크 크기                           | `2000`           |
| `channels.feishu.mediaMaxMb`                      | 미디어 크기 제한                           | `30`             |
| `channels.feishu.streaming`                       | 스트리밍 카드 출력                         | `true`           |
| `channels.feishu.blockStreaming`                  | 블록 수준 스트리밍                         | `true`           |
| `channels.feishu.typingIndicator`                 | 입력 중 반응 전송                          | `true`           |
| `channels.feishu.resolveSenderNames`              | 발신자 표시 이름 확인                      | `true`           |

---

## 지원되는 메시지 유형

### 수신

- ✅ 텍스트
- ✅ 리치 텍스트(post)
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ✅ 비디오/미디어
- ✅ 스티커

수신되는 Feishu/Lark 오디오 메시지는 원시 `file_key` JSON이 아니라 미디어 플레이스홀더로 정규화됩니다. `tools.media.audio`가 구성되어 있으면 OpenClaw는 음성 메모 리소스를 다운로드하고 에이전트 턴 전에 공용 오디오 전사를 실행하므로, 에이전트는 음성 전사문을 받습니다. Feishu가 오디오 페이로드에 전사 텍스트를 직접 포함하는 경우에는 추가 ASR 호출 없이 해당 텍스트가 사용됩니다. 오디오 전사 공급자가 없는 경우에도 에이전트는 원시 Feishu 리소스 페이로드가 아니라 저장된 첨부 파일과 함께 `<media:audio>` 플레이스홀더를 받습니다.

### 전송

- ✅ 텍스트
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ✅ 비디오/미디어
- ✅ 대화형 카드(스트리밍 업데이트 포함)
- ⚠️ 리치 텍스트(post 스타일 서식, 전체 Feishu/Lark 작성 기능은 지원하지 않음)

기본 Feishu/Lark 오디오 버블은 Feishu `audio` 메시지 유형을 사용하며 Ogg/Opus 업로드 미디어(`file_type: "opus"`)가 필요합니다. 기존 `.opus` 및 `.ogg` 미디어는 기본 오디오로 직접 전송됩니다. MP3/WAV/M4A 및 기타 일반적인 오디오 형식은 응답이 음성 전달을 요청하는 경우에만(`audioAsVoice` / 메시지 도구 `asVoice`, TTS 음성 메모 응답 포함) `ffmpeg`를 사용해 48kHz Ogg/Opus로 트랜스코딩됩니다. 일반 MP3 첨부 파일은 일반 파일로 유지됩니다. `ffmpeg`가 없거나 변환에 실패하면 OpenClaw는 파일 첨부로 대체하고 그 이유를 로그에 남깁니다.

### 스레드 및 답글

- ✅ 인라인 답글
- ✅ 스레드 답글
- ✅ 스레드 메시지에 답글할 때 미디어 답글도 스레드 인식을 유지함

`groupSessionScope: "group_topic"` 및 `"group_topic_sender"`의 경우, 기본 Feishu/Lark 토픽 그룹은 이벤트 `thread_id`(`omt_*`)를 표준 토픽 세션 키로 사용합니다. OpenClaw가 스레드로 전환하는 일반 그룹 답글은 계속해서 답글 루트 메시지 ID(`om_*`)를 사용하므로, 첫 번째 턴과 후속 턴이 동일한 세션에 유지됩니다.

---

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 보안 강화
