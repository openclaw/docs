---
read_when:
    - Feishu/Lark 봇을 연결하려고 합니다
    - Feishu 채널을 구성하고 있습니다
summary: Feishu 봇 개요, 기능 및 구성
title: Feishu
x-i18n:
    generated_at: "2026-07-16T12:16:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw는 공식 `@openclaw/feishu` Plugin을 통해 Feishu/Lark(올인원 협업 플랫폼)에 연결됩니다. 봇 DM, 그룹 채팅, 스트리밍 카드 응답, Feishu 문서/위키/드라이브/Bitable 도구를 지원합니다.

**상태:** 봇 DM 및 그룹 채팅에 프로덕션 환경에서 사용할 수 있습니다. WebSocket이 기본 이벤트 전송 방식이며(공개 URL 불필요), Webhook 모드는 선택 사항입니다.

## 빠른 시작

<Note>
OpenClaw 2026.5.29 이상이 필요합니다. `openclaw --version`을 실행하여 확인하십시오. `openclaw update`으로 업그레이드하십시오.
</Note>

<Steps>
  <Step title="채널 설정 마법사 실행">
  ```bash
  openclaw channels login --channel feishu
  ```
  `@openclaw/feishu` Plugin이 없으면 설치한 후 설정 과정을 안내합니다.

- **수동 설정**: Feishu Open Platform(`https://open.feishu.cn`) 또는 Lark Developer(`https://open.larksuite.com`)에서 App ID와 App Secret을 붙여 넣습니다.
- **QR 설정**: Feishu 앱에서 QR 코드를 스캔하여 봇을 자동으로 생성합니다. 이 흐름에서는 DM이 본인의 계정으로 제한됩니다(본인의 `open_id`을 사용한 `dmPolicy: "allowlist"`).

마법사에서 API 도메인(Feishu 또는 Lark)과 그룹 정책도 묻습니다. 중국 내수용 Feishu 모바일 앱이 QR 코드에 반응하지 않으면 설정을 다시 실행하고 수동 설정을 선택하십시오.
</Step>

  <Step title="설정이 완료되면 변경 사항을 적용하기 위해 Gateway 다시 시작">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## 액세스 제어

### 다이렉트 메시지

봇에게 DM을 보낼 수 있는 사용자를 제어하려면 `channels.feishu.dmPolicy`(기본값: `pairing`)을 구성하십시오.

| 값         | 동작                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | 알 수 없는 사용자에게 페어링 코드가 전송되며 CLI를 통해 승인합니다                                                         |
| `"allowlist"` | `allowFrom`에 나열된 사용자만 채팅할 수 있습니다                                                                     |
| `"open"`      | 공개 DM입니다. 구성 검증을 통과하려면 `allowFrom`에 `"*"`이 포함되어야 합니다. 와일드카드가 아닌 항목은 여전히 액세스 범위를 제한합니다 |

**페어링 요청 승인:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 그룹 채팅

**그룹 정책**(`channels.feishu.groupPolicy`, 기본값: `allowlist`):

| 값         | 동작                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | 그룹의 모든 메시지에 응답합니다                                                            |
| `"allowlist"` | `groupAllowFrom`에 포함되거나 `groups.<chat_id>` 아래에 명시적으로 구성된 그룹에만 응답합니다 |
| `"disabled"`  | 모든 그룹 메시지를 비활성화합니다. 명시적인 `groups.<chat_id>` 항목도 이를 재정의하지 않습니다         |

**멘션 요구 사항**(`channels.feishu.requireMention`):

- 기본적으로 @멘션이 필요합니다. 단, 유효한 그룹 정책이 `"open"`인 경우에는 기본값이 `false`이므로 멘션을 포함할 수 없는 메시지(예: 이미지)도 에이전트에 전달됩니다.
- 재정의하려면 `true` 또는 `false`을 명시적으로 설정하십시오. 그룹별 재정의: `channels.feishu.groups.<chat_id>.requireMention`.
- 브로드캐스트 전용 `@all` 및 `@_all`은 봇 멘션으로 처리되지 않습니다. `@all`과 봇을 직접 함께 멘션한 메시지는 여전히 봇 멘션으로 간주됩니다.

## 그룹 구성 예시

### 모든 그룹 허용, @멘션 불필요

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // "open"에서는 requireMention의 기본값이 false입니다
    },
  },
}
```

### 모든 그룹 허용, @멘션은 계속 필요

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
      // 그룹 ID의 형식: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` 모드에서는 명시적인 `groups.<chat_id>` 항목을 추가하여 그룹을 허용할 수도 있습니다. 명시적 항목은 `groupPolicy: "disabled"`을 재정의하지 않습니다. `groups.*` 아래의 와일드카드 기본값은 일치하는 그룹을 구성하지만, 그 자체로 그룹을 허용하지는 않습니다.

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
          // 사용자 open_id의 형식: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom`은 모든 그룹에 동일한 발신자 허용 목록을 설정하며, 그룹별 `allowFrom`이 우선 적용됩니다.

<a id="get-groupuser-ids"></a>

## 그룹/사용자 ID 가져오기

### 그룹 ID(`chat_id`, 형식: `oc_xxx`)

Feishu/Lark에서 그룹을 열고 오른쪽 상단의 메뉴 아이콘을 클릭한 다음 **Settings**로 이동하십시오. 그룹 ID(`chat_id`)는 설정 페이지에 표시됩니다.

![그룹 ID 가져오기](/images/feishu-get-group-id.png)

### 사용자 ID(`open_id`, 형식: `ou_xxx`)

Gateway를 시작하고 봇에게 DM을 보낸 다음 로그를 확인하십시오.

```bash
openclaw logs --follow
```

로그 출력에서 `open_id`을 찾으십시오. 대기 중인 페어링 요청을 확인할 수도 있습니다.

```bash
openclaw pairing list feishu
```

## 일반 명령어

| 명령어   | 설명                 |
| --------- | --------------------------- |
| `/status` | 봇 상태 표시             |
| `/reset`  | 현재 세션 재설정   |
| `/model`  | AI 모델 표시 또는 전환 |

<Note>
Feishu/Lark는 네이티브 슬래시 명령어 메뉴를 지원하지 않으므로 이러한 명령어를 일반 텍스트 메시지로 보내십시오.
</Note>

## 문제 해결

### 봇이 그룹 채팅에서 응답하지 않음

1. 봇이 그룹에 추가되어 있는지 확인하십시오
2. 봇을 @멘션했는지 확인하십시오(기본적으로 필수)
3. `groupPolicy`이 `"disabled"`이 아닌지 확인하십시오
4. 로그를 확인하십시오: `openclaw logs --follow`

### 봇이 메시지를 수신하지 않음

1. 봇이 Feishu Open Platform / Lark Developer에서 게시 및 승인되었는지 확인하십시오
2. 이벤트 구독에 `im.message.receive_v1`이 포함되어 있는지 확인하십시오
3. **persistent connection**(WebSocket)이 선택되어 있는지 확인하십시오
4. 필요한 모든 권한 범위가 부여되어 있는지 확인하십시오
5. Gateway가 실행 중인지 확인하십시오: `openclaw gateway status`
6. 로그를 확인하십시오: `openclaw logs --follow`

### Feishu 모바일 앱이 QR 설정에 반응하지 않음

1. 설정을 다시 실행하십시오: `openclaw channels login --channel feishu`
2. 수동 설정을 선택하십시오
3. Feishu Open Platform에서 자체 구축 앱을 생성하고 App ID와 App Secret을 복사하십시오
4. 해당 자격 증명을 설정 마법사에 붙여 넣으십시오

### App Secret 유출

1. Feishu Open Platform / Lark Developer에서 App Secret을 재설정하십시오
2. 구성의 값을 업데이트하십시오
3. Gateway를 다시 시작하십시오: `openclaw gateway restart`

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
          name: "기본 봇",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "백업 봇",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`은 아웃바운드 API에서 `accountId`을 지정하지 않을 때 사용할 계정을 제어합니다. 계정 항목은 최상위 설정을 상속하며, 대부분의 최상위 키는 계정별로 재정의할 수 있습니다.
`accounts.<id>.tts`은 `messages.tts`과 동일한 구조를 사용하고 전역 TTS 구성 위에 심층 병합됩니다. 따라서 여러 봇을 사용하는 Feishu 설정에서는 공유 공급자 자격 증명을 전역으로 유지하면서 음성, 모델, 페르소나 또는 자동 모드만 계정별로 재정의할 수 있습니다.

### 메시지 제한

- `textChunkLimit` - 아웃바운드 텍스트 청크 크기(기본값: `4000`자)
- `streaming.chunkMode` - `"length"`(기본값)은 제한 지점에서 분할하며, `"newline"`은 줄바꿈 경계를 우선합니다
- `mediaMaxMb` - 미디어 업로드/다운로드 제한(기본값: `30`MB)

### 스트리밍

Feishu/Lark는 대화형 카드(Card Kit 스트리밍 API)를 통한 스트리밍 응답을 지원합니다. 활성화하면 봇이 텍스트를 생성하는 동안 카드를 실시간으로 업데이트합니다.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // 스트리밍 카드 출력(기본값: "partial")
        block: { enabled: true }, // 완료된 블록 스트리밍 사용
      },
    },
  },
}
```

전체 응답을 하나의 메시지로 보내려면 `streaming.mode: "off"`을 설정하십시오. `renderMode: "raw"`(카드 대신 일반 텍스트)도 스트리밍 카드를 비활성화합니다. `streaming.block.enabled`은 기본적으로 꺼져 있습니다. 최종 응답 전에 완료된 어시스턴트 블록을 내보내려는 경우에만 활성화하십시오. 레거시 불리언 `streaming`과 평면 `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` 키는 `openclaw doctor --fix`을 통해 이 중첩 구조로 마이그레이션됩니다.

### 할당량 최적화

다음 두 가지 선택적 플래그를 사용하여 Feishu/Lark API 호출 횟수를 줄이십시오.

- `typingIndicator`(기본값 `true`): 입력 중 반응 호출을 건너뛰려면 `false`로 설정하십시오
- `resolveSenderNames`(기본값 `true`): 발신자 프로필 조회를 건너뛰려면 `false`으로 설정하십시오

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

### 그룹 세션 범위 및 주제 스레드

`channels.feishu.groupSessionScope`(최상위, 계정별 또는 그룹별)은 그룹 메시지가 에이전트 세션에 매핑되는 방식을 제어합니다.

| 값                  | 세션                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"`(기본값)    | 그룹 채팅당 하나의 세션                                       |
| `"group_sender"`       | (그룹 + 발신자)당 하나의 세션                                 |
| `"group_topic"`        | 주제 스레드당 하나의 세션이며, 사용할 수 없으면 그룹 세션으로 대체됩니다    |
| `"group_topic_sender"` | (주제 + 발신자)당 하나의 세션이며, 사용할 수 없으면 (그룹 + 발신자)로 대체됩니다 |

주제 범위에서 네이티브 Feishu/Lark 주제 그룹은 이벤트 `thread_id`(`omt_*`)을 표준 주제 세션 키로 사용합니다. 네이티브 주제 시작 이벤트에 `thread_id`이 없으면 OpenClaw가 턴을 라우팅하기 전에 Feishu에서 이를 가져와 보완합니다. OpenClaw가 스레드로 변환하는 일반 그룹 답글은 계속해서 답글 루트 메시지 ID(`om_*`)를 사용하므로 첫 번째 턴과 후속 턴이 동일한 세션에 유지됩니다.

봇 응답이 인라인 답글 대신 Feishu 주제 스레드를 생성하거나 이어가도록 하려면 `replyInThread: "enabled"`(최상위 또는 그룹별)을 설정하십시오. `topicSessionMode`은 `groupSessionScope`의 더 이상 권장되지 않는 이전 설정입니다. `groupSessionScope`을 사용하는 것이 좋습니다.

### Feishu 작업 공간 도구

Plugin은 Feishu 문서, 채팅, 지식 베이스, 클라우드 스토리지, 권한 및 Bitable용 에이전트 도구와 이에 대응하는 Skills(`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`)를 제공합니다. 도구 계열은 `channels.feishu.tools`에 의해 제한됩니다.

| 키              | 도구                                          | 기본값              |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | `feishu_doc` 문서 작업                     | `true`              |
| `tools.chat`    | `feishu_chat` 채팅 정보 + 멤버 조회          | `true`              |
| `tools.wiki`    | `feishu_wiki` 지식 베이스(`doc` 필요) | `true`              |
| `tools.drive`   | `feishu_drive` 클라우드 저장소                 | `true`              |
| `tools.perm`    | `feishu_perm` 권한 관리                      | `false` (민감) |
| `tools.scopes`  | `feishu_app_scopes` 앱 범위 진단             | `true`              |
| `tools.bitable` | `feishu_bitable_*` Bitable/Base 작업        | `true`              |

`tools.base`은 `tools.bitable`의 별칭이며, 둘 다 설정된 경우 명시적인 `bitable` 값이 우선합니다. 계정별 게이트는 `accounts.<id>.tools` 아래에 있습니다.

앱에 전체 `drive:drive` 범위가 이미 있지 않은 한, 루트
디렉터리 외부에서 직접 `feishu_drive info` 조회를 수행하려면 `drive:drive.metadata:readonly`을 부여하십시오. 두 범위가 모두 없으면 `info`이
`drive:drive:readonly`을 통해 기존 루트 디렉터리 조회를 계속 사용할 수 있게 합니다.

### ACP 세션

Feishu/Lark는 DM 및 그룹 스레드 메시지에 ACP를 지원합니다. Feishu/Lark ACP는 텍스트 명령으로 구동되며 네이티브 슬래시 명령 메뉴가 없으므로, 대화에서 `/acp ...` 메시지를 직접 사용하십시오.

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

Feishu/Lark DM 또는 스레드에서 다음을 실행하십시오.

```text
/acp spawn codex --thread here
```

`--thread here`은 DM 및 Feishu/Lark 스레드 메시지에서 작동합니다. 바인딩된 대화의 후속 메시지는 해당 ACP 세션으로 직접 라우팅됩니다.

### 다중 에이전트 라우팅

Feishu/Lark DM 또는 그룹을 서로 다른 에이전트로 라우팅하려면 `bindings`을 사용하십시오.

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

조회 팁은 [그룹/사용자 ID 가져오기](#get-groupuser-ids)를 참조하십시오.

## 사용자별 에이전트 격리(동적 에이전트 생성)

각 DM 사용자에 대해 **격리된 에이전트 인스턴스**를 자동으로 생성하려면 `dynamicAgentCreation`을 활성화하십시오. 각 사용자에게 다음 항목이 개별적으로 제공됩니다.

- 독립적인 워크스페이스 디렉터리
- 별도의 `USER.md` / `SOUL.md` / `MEMORY.md`
- 비공개 대화 기록
- 격리된 스킬 및 상태

각 사용자에게 자신만의 비공개 AI 어시스턴트 환경을 제공하려는 공개 봇에는 이 기능이 필수적입니다.

<Note>
동적 바인딩에는 정규화된 Feishu `accountId`이 포함되므로, 기본 계정과 명명된 계정은 각 발신자를 올바른 동적 에이전트로 라우팅합니다.

이전 릴리스에서 명명된 계정이 범위가 지정되지 않은 동적 에이전트를 생성했다면, 해당 기존 에이전트도 여전히 `maxAgents`에 포함됩니다. 제거하기 전에 기본 계정에서 사용하지 않는지 확인하거나 `maxAgents`을 일시적으로 늘리십시오. OpenClaw는 모호한 기존 상태를 어느 계정이 소유하는지 안전하게 추론할 수 없습니다.
</Note>

### 빠른 설정

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // 중요: 각 사용자의 DM을 해당 사용자의 "기본 세션"으로 만듭니다
    // USER.md / SOUL.md / MEMORY.md를 자동으로 로드합니다
    // 더 강력한 격리를 위해 "per-channel-peer"를 대신 사용하십시오
    dmScope: "main",
  },
}
```

### 작동 방식

새 사용자가 첫 DM을 보내면 다음과 같이 작동합니다.

1. 채널이 고유한 `agentId`을 생성합니다. 기본 계정에는 `feishu-{user_open_id}`을 사용하고, 명명된 계정에는 길이가 제한된 계정 접두사 기반 ID 다이제스트를 사용합니다.
2. `workspaceTemplate` 경로에 새 워크스페이스를 생성합니다.
3. 에이전트를 등록하고 이 사용자에 대한 바인딩을 생성합니다.
4. 워크스페이스 도우미가 최초 접근 시 부트스트랩 파일(`AGENTS.md`, `SOUL.md`, `USER.md` 등)이 존재하도록 보장합니다.
5. 이 사용자의 이후 모든 메시지를 전용 에이전트로 라우팅합니다.

### 구성 옵션

| 설정                                                     | 설명                                       | 기본값                               |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | 사용자별 에이전트 자동 생성을 활성화합니다       | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 동적 에이전트 워크스페이스의 경로 템플릿         | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 에이전트 디렉터리 이름 템플릿                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 생성할 수 있는 동적 에이전트의 최대 수            | 무제한                               |

템플릿 변수:

- `{agentId}` - 생성된 에이전트 ID(예: `feishu-ou_xxxxxx` 또는 `feishu-support-<identity_digest>`)
- `{userId}` - 발신자의 Feishu open_id(예: `ou_xxxxxx`)

### 세션 범위

`session.dmScope`은 다이렉트 메시지가 에이전트 세션에 매핑되는 방식을 제어합니다. 이는 모든 채널에 영향을 주는 **전역 설정**입니다.

| 값                           | 동작                                                                  | 적합한 용도                                                        |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | 각 사용자의 DM을 해당 에이전트의 기본 세션에 매핑합니다                | `USER.md` / `SOUL.md`의 자동 로드를 원하는 단일 사용자 봇 |
| `"per-peer"`                 | 각 피어가 채널에 관계없이 별도의 세션을 사용합니다                       | 발신자 ID만을 기준으로 한 격리                                     |
| `"per-channel-peer"`         | 각 (채널 + 사용자) 조합이 별도의 세션을 사용합니다                        | 더 강력한 격리가 필요한 공개 다중 사용자 봇                        |
| `"per-account-channel-peer"` | 각 (계정 + 채널 + 사용자) 조합이 별도의 세션을 사용합니다                 | 계정 수준의 세션 격리가 필요한 다중 계정 봇                        |

**절충점**: `"main"`을 사용하면 부트스트랩 파일(`USER.md`, `SOUL.md`, `MEMORY.md`)이 자동으로 로드되지만, 모든 채널의 모든 DM이 동일한 세션 키 패턴을 공유하게 됩니다. 부트스트랩 자동 로드보다 격리가 더 중요한 공개 다중 사용자 봇의 경우 `"per-channel-peer"`을 고려하고 부트스트랩 파일을 수동으로 관리하십시오.

<Note>
명명된 Feishu 계정에서 동일한 발신자에 대해 별도의 세션을 유지해야 하는 경우 `"per-account-channel-peer"`을 사용하십시오. 동적 바인딩은 계정 범위를 유지합니다.
</Note>

### 일반적인 다중 사용자 배포

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // 필요한 격리 수준에 따라 dmScope를 선택하십시오.
    // 부트스트랩 자동 로드에는 "main", 더 강력한 격리에는 "per-channel-peer"
    dmScope: "main",
  },
  bindings: [], // 비워 두십시오. 동적 에이전트가 자동으로 바인딩됩니다
}
```

### 확인

동적 생성이 작동하는지 확인하려면 Gateway 로그를 확인하십시오.

```text
feishu: 사용자 ou_xxxxxx에 대해 동적 에이전트 "feishu-ou_xxxxxx"을 생성하는 중
  워크스페이스: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  에이전트 디렉터리: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

생성된 모든 워크스페이스를 나열합니다.

```bash
ls -la ~/.openclaw/workspace-*
```

### 참고 사항

- **워크스페이스 격리**: 각 사용자는 자신의 워크스페이스 디렉터리와 에이전트 인스턴스를 사용합니다. 일반적인 메시징 흐름에서 사용자는 서로의 대화 기록이나 파일을 볼 수 없습니다.
- **보안 경계**: 이는 메시징 컨텍스트 격리 메커니즘이며, 적대적인 공동 테넌트에 대한 보안 경계가 아닙니다. 에이전트 프로세스와 호스트 환경은 공유됩니다.
- **구성 쓰기가 활성화된 상태여야 합니다**: 동적 에이전트 생성은 에이전트와 바인딩을 구성에 기록하며, `channels.feishu.configWrites`이 `false`(기본값: 활성화)인 경우 건너뜁니다.
- **`bindings`은 비어 있어야 합니다**: 동적 에이전트는 자체 바인딩을 자동으로 등록합니다.
- **업그레이드 경로**: 기존 수동 바인딩은 동적 에이전트와 함께 계속 작동합니다.
- **`session.dmScope`은 전역 설정입니다**: 이는 Feishu뿐만 아니라 모든 채널에 영향을 줍니다.

## 구성 참조

전체 구성: [Gateway 구성](/ko/gateway/configuration)

| 설정                                                     | 설명                                                                                 | 기본값                               |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | 채널 활성화/비활성화                                                                | `true`                               |
| `channels.feishu.domain`                                 | API 도메인(`feishu`, `lark` 또는 `https://` 기본 URL)                             | `feishu`                             |
| `channels.feishu.connectionMode`                         | 이벤트 전송 방식(`websocket` 또는 `webhook`)                                           | `websocket`                          |
| `channels.feishu.defaultAccount`                         | 아웃바운드 라우팅의 기본 계정                                                        | `default`                            |
| `channels.feishu.verificationToken`                      | Webhook 모드에 필수                                                                 | -                                    |
| `channels.feishu.encryptKey`                             | Webhook 모드에 필수                                                                 | -                                    |
| `channels.feishu.webhookPath`                            | Webhook 경로                                                                         | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook 바인드 호스트                                                                | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook 바인드 포트                                                                  | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | 앱 ID                                                                                | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | 앱 시크릿                                                                            | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | 계정별 도메인 재정의                                                                 | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | 계정별 TTS 재정의                                                                    | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM 정책(`pairing`, `allowlist`, `open`)                                           | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM 허용 목록(open_id 목록)                                                           | -                                    |
| `channels.feishu.groupPolicy`                            | 그룹 정책(`open`, `allowlist`, `disabled`)                                       | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | 그룹 허용 목록                                                                       | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | 모든 그룹에 적용되는 발신자 허용 목록                                               | -                                    |
| `channels.feishu.requireMention`                         | 그룹에서 @멘션 요구                                                                  | `true` (정책이 `open`이면 `false`)  |
| `channels.feishu.groups.<chat_id>.requireMention`        | 그룹별 @멘션 재정의. 명시적 ID는 허용 목록 모드에서 해당 그룹도 허용합니다          | 상속됨                               |
| `channels.feishu.groups.<chat_id>.enabled`               | 특정 그룹 활성화/비활성화                                                           | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | 그룹별 발신자 허용 목록(`groupSenderAllowFrom` 재정의)                              | -                                    |
| `channels.feishu.groupSessionScope`                      | 그룹 세션 매핑(`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | 봇 응답으로 주제 스레드 생성/계속(`disabled`, `enabled`)                          | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | 인바운드 반응 이벤트(`off`, `own`, `all`)                                        | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | 사용자별 에이전트 자동 생성 활성화                                                  | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | 동적 에이전트 작업 공간의 경로 템플릿                                               | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | 에이전트 디렉터리 이름 템플릿                                                       | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | 생성할 동적 에이전트의 최대 수                                                      | 무제한                               |
| `channels.feishu.textChunkLimit`                         | 메시지 청크 크기                                                                     | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | 청크 분할(`length` 또는 `newline`)                                              | `length`                             |
| `channels.feishu.mediaMaxMb`                             | 미디어 크기 제한                                                                     | `30`                                 |
| `channels.feishu.renderMode`                             | 응답 렌더링(`auto`, `raw`, `card`)                                              | `auto`                               |
| `channels.feishu.streaming.mode`                         | 스트리밍 카드 출력(`partial` 또는 `off`)                                           | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | 완료된 블록 단위 응답 스트리밍                                                      | `false`                              |
| `channels.feishu.typingIndicator`                        | 입력 중 반응 전송                                                                    | `true`                               |
| `channels.feishu.resolveSenderNames`                     | 발신자 표시 이름 확인                                                               | `true`                               |
| `channels.feishu.configWrites`                           | 채널에서 시작하는 구성 쓰기 허용(동적 에이전트에 필요)                              | `true`                               |
| `channels.feishu.tools.doc`                              | 문서 도구 활성화                                                                     | `true`                               |
| `channels.feishu.tools.chat`                             | 채팅 정보 도구 활성화                                                               | `true`                               |
| `channels.feishu.tools.wiki`                             | 지식 베이스 도구 활성화(`doc` 필요)                                         | `true`                               |
| `channels.feishu.tools.drive`                            | 클라우드 스토리지 도구 활성화                                                       | `true`                               |
| `channels.feishu.tools.perm`                             | 권한 관리 도구 활성화                                                               | `false`                              |
| `channels.feishu.tools.scopes`                           | 앱 범위 진단 도구 활성화                                                            | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base 도구 활성화                                                            | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable`의 별칭. 둘 다 설정하면 명시적인 `bitable`이 우선합니다     | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | 계정별 Bitable/Base 도구 게이트                                                      | 상속됨                               |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable`의 계정별 별칭                                                | 상속됨                               |

## 지원되는 메시지 유형

### 수신

- ✅ 텍스트
- ✅ 서식 있는 텍스트(게시물)
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ✅ 동영상/미디어
- ✅ 스티커

인바운드 Feishu/Lark 오디오 메시지는 원시 `file_key` JSON 대신
미디어 자리표시자로 정규화됩니다. `tools.media.audio`이 구성되어 있으면 OpenClaw는
음성 메모 리소스를 다운로드하고 에이전트 턴 전에 공유 오디오 전사를 실행하므로
에이전트가 음성의 전사문을 수신합니다. Feishu가 오디오 페이로드에 전사 텍스트를
직접 포함하면 추가 ASR 호출 없이 해당 텍스트를 사용합니다. 오디오 전사 제공자가
없어도 에이전트는 원시 Feishu 리소스 페이로드가 아니라 저장된 첨부 파일과 함께
`<media:audio>` 자리표시자를 수신합니다.

### 전송

- ✅ 텍스트
- ✅ 이미지
- ✅ 파일
- ✅ 오디오
- ✅ 동영상/미디어
- ✅ 대화형 카드(스트리밍 업데이트 포함)
- ⚠️ 서식 있는 텍스트(게시물 스타일 서식. Feishu/Lark의 전체 작성 기능은 지원하지 않음)

네이티브 Feishu/Lark 오디오 말풍선은 Feishu `audio` 메시지 유형을 사용하며
Ogg/Opus 업로드 미디어(`file_type: "opus"`)가 필요합니다. 기존 `.opus` 및 `.ogg` 미디어는
네이티브 오디오로 직접 전송됩니다. MP3/WAV/M4A 및 오디오일 가능성이 높은 기타 형식은
응답에서 음성 전달을 요청하는 경우에만(`audioAsVoice` / 메시지 도구 `asVoice`, TTS 음성 메모
응답 포함) `ffmpeg`을 사용하여 48kHz Ogg/Opus로 트랜스코딩됩니다.
일반 MP3 첨부 파일은 일반 파일로 유지됩니다. `ffmpeg`이 없거나
변환에 실패하면 OpenClaw는 파일 첨부로 대체하고 그 이유를 로그에 기록합니다.

### 스레드 및 응답

- ✅ 인라인 응답
- ✅ 스레드 응답
- ✅ 스레드 메시지에 응답할 때 미디어 응답도 스레드 컨텍스트를 유지합니다

주제 그룹 세션 라우팅은
[그룹 세션 범위 및 주제 스레드](#group-session-scope-and-topic-threads)에서 다룹니다.

## 관련 항목

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 게이트
- [채널 라우팅](/ko/channels/channel-routing) - 메시지의 세션 라우팅
- [보안](/ko/gateway/security) - 액세스 모델 및 강화
