---
read_when:
    - Feishu/Lark 봇을 연결하려고 합니다
    - Feishu 채널을 구성하고 있습니다
summary: Feishu 봇 개요, 기능 및 구성
title: Feishu
x-i18n:
    generated_at: "2026-04-30T06:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark는 팀이 채팅하고, 문서를 공유하고, 캘린더를 관리하고, 함께 업무를 처리하는 올인원 협업 플랫폼입니다.

**상태:** 봇 DM 및 그룹 채팅에 프로덕션 준비 완료. WebSocket이 기본 모드이며, webhook 모드는 선택 사항입니다.

---

## 빠른 시작

<Note>
OpenClaw 2026.4.25 이상이 필요합니다. 확인하려면 `openclaw --version`을 실행하세요. `openclaw update`로 업그레이드하세요.
</Note>

<Steps>
  <Step title="채널 설정 마법사 실행">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu/Lark 모바일 앱으로 QR 코드를 스캔하여 Feishu/Lark 봇을 자동으로 생성하세요.
  </Step>
  
  <Step title="설정이 완료되면 변경 사항을 적용하기 위해 Gateway를 다시 시작합니다">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## 접근 제어

### 다이렉트 메시지

봇에 DM을 보낼 수 있는 사용자를 제어하려면 `dmPolicy`를 구성하세요.

- `"pairing"` — 알 수 없는 사용자는 페어링 코드를 받으며, CLI를 통해 승인합니다
- `"allowlist"` — `allowFrom`에 나열된 사용자만 채팅할 수 있습니다(기본값: 봇 소유자만)
- `"open"` — `allowFrom`에 `"*"`가 포함된 경우에만 공개 DM을 허용합니다. 제한적인 항목이 있으면 일치하는 사용자만 채팅할 수 있습니다
- `"disabled"` — 모든 DM을 비활성화합니다

**페어링 요청 승인:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 그룹 채팅

**그룹 정책**(`channels.feishu.groupPolicy`):

| 값            | 동작                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | 그룹의 모든 메시지에 응답합니다                                                              |
| `"allowlist"` | `groupAllowFrom`에 있거나 `groups.<chat_id>` 아래에 명시적으로 구성된 그룹에만 응답합니다 |
| `"disabled"`  | 모든 그룹 메시지를 비활성화합니다. 명시적인 `groups.<chat_id>` 항목도 이를 재정의하지 않습니다 |

기본값: `allowlist`

**멘션 요구 사항**(`channels.feishu.requireMention`):

- `true` — @멘션 필요(기본값)
- `false` — @멘션 없이 응답
- 그룹별 재정의: `channels.feishu.groups.<chat_id>.requireMention`
- 브로드캐스트 전용 `@all` 및 `@_all`은 봇 멘션으로 처리되지 않습니다. `@all`과 봇을 직접 모두 멘션하는 메시지는 여전히 봇 멘션으로 간주됩니다.

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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` 모드에서는 명시적인 `groups.<chat_id>` 항목을 추가하여 그룹을 허용할 수도 있습니다. 명시적인 항목은 `groupPolicy: "disabled"`를 재정의하지 않습니다. `groups.*` 아래의 와일드카드 기본값은 일치하는 그룹을 구성하지만, 그 자체로 그룹을 허용하지는 않습니다.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
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
          // User open_ids look like: ou_xxx
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

### 그룹 ID(`chat_id`, 형식: `oc_xxx`)

Feishu/Lark에서 그룹을 열고, 오른쪽 위 모서리의 메뉴 아이콘을 클릭한 다음 **설정**으로 이동하세요. 그룹 ID(`chat_id`)가 설정 페이지에 표시됩니다.

![그룹 ID 가져오기](/images/feishu-get-group-id.png)

### 사용자 ID(`open_id`, 형식: `ou_xxx`)

Gateway를 시작하고 봇에 DM을 보낸 다음 로그를 확인하세요.

```bash
openclaw logs --follow
```

로그 출력에서 `open_id`를 찾으세요. 대기 중인 페어링 요청도 확인할 수 있습니다.

```bash
openclaw pairing list feishu
```

---

## 일반 명령

| 명령      | 설명                     |
| --------- | ------------------------ |
| `/status` | 봇 상태 표시             |
| `/reset`  | 현재 세션 재설정         |
| `/model`  | AI 모델 표시 또는 전환   |

<Note>
Feishu/Lark는 네이티브 슬래시 명령 메뉴를 지원하지 않으므로, 이를 일반 텍스트 메시지로 보내세요.
</Note>

---

## 문제 해결

### 봇이 그룹 채팅에서 응답하지 않음

1. 봇이 그룹에 추가되었는지 확인하세요
2. 봇을 @멘션했는지 확인하세요(기본적으로 필요)
3. `groupPolicy`가 `"disabled"`가 아닌지 확인하세요
4. 로그를 확인하세요: `openclaw logs --follow`

### 봇이 메시지를 받지 못함

1. 봇이 Feishu Open Platform / Lark Developer에서 게시 및 승인되었는지 확인하세요
2. 이벤트 구독에 `im.message.receive_v1`이 포함되어 있는지 확인하세요
3. **영구 연결**(WebSocket)이 선택되어 있는지 확인하세요
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

`defaultAccount`는 아웃바운드 API가 `accountId`를 지정하지 않을 때 사용할 계정을 제어합니다.
`accounts.<id>.tts`는 `messages.tts`와 동일한 형태를 사용하며 전역 TTS 구성 위에 딥 머지되므로, 멀티 봇 Feishu 설정은 공유 provider 자격 증명을 전역으로 유지하면서 계정별로 음성, 모델, persona 또는 자동 모드만 재정의할 수 있습니다.

### 메시지 제한

- `textChunkLimit` — 아웃바운드 텍스트 청크 크기(기본값: `2000`자)
- `mediaMaxMb` — 미디어 업로드/다운로드 제한(기본값: `30`MB)

### 스트리밍

Feishu/Lark는 인터랙티브 카드를 통한 스트리밍 응답을 지원합니다. 활성화하면 봇이 텍스트를 생성하는 동안 카드를 실시간으로 업데이트합니다.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

완성된 답변을 하나의 메시지로 보내려면 `streaming: false`를 설정하세요.

### 할당량 최적화

두 가지 선택적 플래그로 Feishu/Lark API 호출 수를 줄이세요.

- `typingIndicator`(기본값 `true`): 입력 중 반응 호출을 건너뛰려면 `false`로 설정
- `resolveSenderNames`(기본값 `true`): 발신자 프로필 조회를 건너뛰려면 `false`로 설정

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

Feishu/Lark는 DM 및 그룹 스레드 메시지에 대해 ACP를 지원합니다. Feishu/Lark ACP는 텍스트 명령 기반입니다. 네이티브 슬래시 명령 메뉴가 없으므로 대화에서 `/acp ...` 메시지를 직접 사용하세요.

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

`--thread here`는 DM 및 Feishu/Lark 스레드 메시지에서 작동합니다. 바인딩된 대화의 후속 메시지는 해당 ACP 세션으로 직접 라우팅됩니다.

### 멀티 에이전트 라우팅

Feishu/Lark DM 또는 그룹을 서로 다른 에이전트로 라우팅하려면 `bindings`를 사용하세요.

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
- `match.peer.kind`: `"direct"`(DM) 또는 `"group"`(그룹 채팅)
- `match.peer.id`: 사용자 Open ID(`ou_xxx`) 또는 그룹 ID(`oc_xxx`)

조회 팁은 [그룹/사용자 ID 가져오기](#get-groupuser-ids)를 참조하세요.

---

## 구성 참조

전체 구성: [Gateway 구성](/ko/gateway/configuration)

| 설정                                              | 설명                                                                             | 기본값           |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | 채널 활성화/비활성화                                                            | `true`           |
| `channels.feishu.domain`                          | API 도메인(`feishu` 또는 `lark`)                                                 | `feishu`         |
| `channels.feishu.connectionMode`                  | 이벤트 전송 방식(`websocket` 또는 `webhook`)                                     | `websocket`      |
| `channels.feishu.defaultAccount`                  | 아웃바운드 라우팅용 기본 계정                                                    | `default`        |
| `channels.feishu.verificationToken`               | Webhook 모드에 필요                                                              | —                |
| `channels.feishu.encryptKey`                      | Webhook 모드에 필요                                                              | —                |
| `channels.feishu.webhookPath`                     | Webhook 라우트 경로                                                              | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook 바인드 호스트                                                            | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook 바인드 포트                                                              | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | 앱 ID                                                                            | —                |
| `channels.feishu.accounts.<id>.appSecret`         | 앱 Secret                                                                        | —                |
| `channels.feishu.accounts.<id>.domain`            | 계정별 도메인 재정의                                                            | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | 계정별 TTS 재정의                                                               | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DM 정책                                                                         | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM 허용 목록(open_id 목록)                                                       | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | 그룹 정책                                                                        | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | 그룹 허용 목록                                                                   | —                |
| `channels.feishu.requireMention`                  | 그룹에서 @멘션 필요                                                             | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | 그룹별 @멘션 재정의. 명시적 ID도 허용 목록 모드에서 그룹을 허용함               | 상속됨           |
| `channels.feishu.groups.<chat_id>.enabled`        | 특정 그룹 활성화/비활성화                                                       | `true`           |
| `channels.feishu.textChunkLimit`                  | 메시지 청크 크기                                                                 | `2000`           |
| `channels.feishu.mediaMaxMb`                      | 미디어 크기 제한                                                                 | `30`             |
| `channels.feishu.streaming`                       | 스트리밍 카드 출력                                                              | `true`           |
| `channels.feishu.blockStreaming`                  | 블록 수준 스트리밍                                                               | `true`           |
| `channels.feishu.typingIndicator`                 | 입력 중 반응 보내기                                                             | `true`           |
| `channels.feishu.resolveSenderNames`              | 보낸 사람 표시 이름 확인                                                        | `true`           |

---

## 지원되는 메시지 유형

### 수신

- ✅ 텍스트
- ✅ 리치 텍스트(게시물)
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ✅ 비디오/미디어
- ✅ 스티커

수신 Feishu/Lark 오디오 메시지는 원시 `file_key` JSON 대신 미디어 플레이스홀더로 정규화됩니다. `tools.media.audio`가 구성되어 있으면 OpenClaw는 음성 메모 리소스를 다운로드하고 에이전트 턴 전에 공유 오디오 전사를 실행하므로, 에이전트는 음성 전사문을 받습니다. Feishu가 오디오 페이로드에 전사 텍스트를 직접 포함하면, 추가 ASR 호출 없이 해당 텍스트를 사용합니다. 오디오 전사 제공자가 없더라도 에이전트는 원시 Feishu 리소스 페이로드가 아니라 저장된 첨부 파일과 함께 `<media:audio>` 플레이스홀더를 받습니다.

### 전송

- ✅ 텍스트
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ✅ 비디오/미디어
- ✅ 인터랙티브 카드(스트리밍 업데이트 포함)
- ⚠️ 리치 텍스트(게시물 스타일 서식. 전체 Feishu/Lark 작성 기능은 지원하지 않음)

네이티브 Feishu/Lark 오디오 말풍선은 Feishu `audio` 메시지 유형을 사용하며 Ogg/Opus 업로드 미디어(`file_type: "opus"`)가 필요합니다. 기존 `.opus` 및 `.ogg` 미디어는 네이티브 오디오로 직접 전송됩니다. MP3/WAV/M4A 및 기타 오디오로 보이는 형식은 응답이 음성 전달을 요청할 때(`audioAsVoice` / 메시지 도구 `asVoice`, TTS 음성 메모 응답 포함)에만 `ffmpeg`를 사용해 48kHz Ogg/Opus로 트랜스코딩됩니다. 일반 MP3 첨부 파일은 일반 파일로 유지됩니다. `ffmpeg`가 없거나 변환에 실패하면 OpenClaw는 파일 첨부로 폴백하고 이유를 기록합니다.

### 스레드와 답글

- ✅ 인라인 답글
- ✅ 스레드 답글
- ✅ 스레드 메시지에 답글을 달 때 미디어 답글은 스레드 인식을 유지함

`groupSessionScope: "group_topic"` 및 `"group_topic_sender"`의 경우, 네이티브 Feishu/Lark 주제 그룹은 이벤트 `thread_id`(`omt_*`)를 표준 주제 세션 키로 사용합니다. OpenClaw가 스레드로 변환하는 일반 그룹 답글은 답글 루트 메시지 ID(`om_*`)를 계속 사용하므로 첫 번째 턴과 후속 턴이 같은 세션에 유지됩니다.

---

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
