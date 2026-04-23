---
read_when:
    - Feishu/Lark 봇을 연결하려고 합니다
    - Feishu 채널을 구성하고 있습니다
summary: Feishu 봇 개요, 기능 및 구성
title: Feishu
x-i18n:
    generated_at: "2026-04-23T13:58:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11bf136cecb26dc939c5e78e020c0e6aa3312d9f143af0cab7568743c728cf13
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark는 팀이 채팅하고, 문서를 공유하고, 캘린더를 관리하며, 함께 업무를 처리할 수 있는 올인원 협업 플랫폼입니다.

**상태:** 봇 DM + 그룹 채팅에 대해 프로덕션 준비 완료. WebSocket이 기본 모드이며, webhook 모드는 선택 사항입니다.

---

## 빠른 시작

> **OpenClaw 2026.4.10 이상이 필요합니다.** 확인하려면 `openclaw --version`을 실행하세요. 업그레이드하려면 `openclaw update`를 실행하세요.

<Steps>
  <Step title="채널 설정 마법사 실행">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu/Lark 모바일 앱으로 QR 코드를 스캔하면 Feishu/Lark 봇이 자동으로 생성됩니다.
  </Step>
  
  <Step title="설정이 완료되면 변경 사항을 적용하기 위해 Gateway를 재시작">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## 액세스 제어

### 다이렉트 메시지

`dmPolicy`를 구성하여 누가 봇에 DM을 보낼 수 있는지 제어합니다:

- `"pairing"` — 알 수 없는 사용자는 페어링 코드를 받으며, CLI를 통해 승인합니다
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

| Value         | 동작                                       |
| ------------- | ------------------------------------------ |
| `"open"`      | 그룹의 모든 메시지에 응답                  |
| `"allowlist"` | `groupAllowFrom`에 있는 그룹에만 응답      |
| `"disabled"`  | 모든 그룹 메시지 비활성화                  |

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
      // Group IDs look like: oc_xxx
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

### 그룹 ID (`chat_id`, 형식: `oc_xxx`)

Feishu/Lark에서 그룹을 열고 오른쪽 상단의 메뉴 아이콘을 클릭한 다음 **Settings**로 이동하세요. 설정 페이지에 그룹 ID(`chat_id`)가 표시됩니다.

![Get Group ID](/images/feishu-get-group-id.png)

### 사용자 ID (`open_id`, 형식: `ou_xxx`)

Gateway를 시작하고 봇에 DM을 보낸 다음 로그를 확인하세요:

```bash
openclaw logs --follow
```

로그 출력에서 `open_id`를 찾으세요. 대기 중인 페어링 요청을 확인할 수도 있습니다:

```bash
openclaw pairing list feishu
```

---

## 일반 명령어

| Command   | 설명                        |
| --------- | --------------------------- |
| `/status` | 봇 상태 표시                |
| `/reset`  | 현재 세션 재설정            |
| `/model`  | AI 모델 표시 또는 전환      |

> Feishu/Lark는 기본 슬래시 명령 메뉴를 지원하지 않으므로, 이것들을 일반 텍스트 메시지로 보내세요.

---

## 문제 해결

### 봇이 그룹 채팅에서 응답하지 않음

1. 봇이 그룹에 추가되어 있는지 확인합니다
2. 봇을 @멘션했는지 확인합니다(기본적으로 필요)
3. `groupPolicy`가 `"disabled"`가 아닌지 확인합니다
4. 로그를 확인합니다: `openclaw logs --follow`

### 봇이 메시지를 받지 못함

1. Feishu Open Platform / Lark Developer에서 봇이 게시 및 승인되었는지 확인합니다
2. 이벤트 구독에 `im.message.receive_v1`이 포함되어 있는지 확인합니다
3. **persistent connection**(WebSocket)이 선택되어 있는지 확인합니다
4. 필요한 모든 권한 범위가 부여되었는지 확인합니다
5. Gateway가 실행 중인지 확인합니다: `openclaw gateway status`
6. 로그를 확인합니다: `openclaw logs --follow`

### App Secret 유출

1. Feishu Open Platform / Lark Developer에서 App Secret을 재설정합니다
2. 구성에서 값을 업데이트합니다
3. Gateway를 재시작합니다: `openclaw gateway restart`

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

`defaultAccount`는 아웃바운드 API에서 `accountId`를 지정하지 않았을 때 어떤 계정을 사용할지 제어합니다.

### 메시지 제한

- `textChunkLimit` — 아웃바운드 텍스트 청크 크기(기본값: `2000`자)
- `mediaMaxMb` — 미디어 업로드/다운로드 제한(기본값: `30`MB)

### 스트리밍

Feishu/Lark는 인터랙티브 카드를 통한 스트리밍 응답을 지원합니다. 활성화하면 봇이 텍스트를 생성하는 동안 카드를 실시간으로 업데이트합니다.

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

완전한 응답을 하나의 메시지로 보내려면 `streaming: false`로 설정합니다.

### 할당량 최적화

두 가지 선택적 플래그로 Feishu/Lark API 호출 수를 줄일 수 있습니다:

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

Feishu/Lark는 DM과 그룹 스레드 메시지에 대해 ACP를 지원합니다. Feishu/Lark ACP는 텍스트 명령 기반으로 동작합니다. 기본 슬래시 명령 메뉴는 없으므로 대화에서 `/acp ...` 메시지를 직접 사용하세요.

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

`--thread here`는 DM과 Feishu/Lark 스레드 메시지에서 모두 작동합니다. 바인딩된 대화의 후속 메시지는 해당 ACP 세션으로 직접 라우팅됩니다.

### 멀티 에이전트 라우팅

`bindings`를 사용하여 Feishu/Lark DM 또는 그룹을 서로 다른 에이전트로 라우팅합니다.

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

| Setting                                           | 설명                                         | 기본값           |
| ------------------------------------------------- | -------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | 채널 활성화/비활성화                         | `true`           |
| `channels.feishu.domain`                          | API 도메인(`feishu` 또는 `lark`)             | `feishu`         |
| `channels.feishu.connectionMode`                  | 이벤트 전송 방식(`websocket` 또는 `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | 아웃바운드 라우팅용 기본 계정                | `default`        |
| `channels.feishu.verificationToken`               | webhook 모드에 필요                          | —                |
| `channels.feishu.encryptKey`                      | webhook 모드에 필요                          | —                |
| `channels.feishu.webhookPath`                     | Webhook 경로 경로                            | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook 바인드 호스트                        | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook 바인드 포트                          | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                       | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                   | —                |
| `channels.feishu.accounts.<id>.domain`            | 계정별 도메인 재정의                         | `feishu`         |
| `channels.feishu.dmPolicy`                        | DM 정책                                      | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM 허용 목록(`open_id` 목록)                 | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | 그룹 정책                                    | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | 그룹 허용 목록                               | —                |
| `channels.feishu.requireMention`                  | 그룹에서 @멘션 필요                          | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | 그룹별 @멘션 재정의                          | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | 특정 그룹 활성화/비활성화                    | `true`           |
| `channels.feishu.textChunkLimit`                  | 메시지 청크 크기                             | `2000`           |
| `channels.feishu.mediaMaxMb`                      | 미디어 크기 제한                             | `30`             |
| `channels.feishu.streaming`                       | 스트리밍 카드 출력                           | `true`           |
| `channels.feishu.blockStreaming`                  | 블록 수준 스트리밍                           | `true`           |
| `channels.feishu.typingIndicator`                 | 입력 중 반응 전송                            | `true`           |
| `channels.feishu.resolveSenderNames`              | 발신자 표시 이름 확인                        | `true`           |

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

### 전송

- ✅ 텍스트
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ✅ 비디오/미디어
- ✅ 인터랙티브 카드(스트리밍 업데이트 포함)
- ⚠️ 리치 텍스트(post 스타일 서식, 전체 Feishu/Lark 작성 기능은 지원하지 않음)

### 스레드 및 답글

- ✅ 인라인 답글
- ✅ 스레드 답글
- ✅ 스레드 메시지에 답글할 때 미디어 답글도 스레드 인식을 유지

---

## 관련 문서

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 액세스 모델 및 강화 방법
