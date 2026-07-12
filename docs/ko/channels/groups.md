---
read_when:
    - 그룹 채팅 동작 또는 멘션 제한 변경
    - mentionPatterns의 범위를 특정 그룹 대화로 한정하기
sidebarTitle: Groups
summary: 여러 환경에서의 그룹 채팅 동작(Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: 그룹
x-i18n:
    generated_at: "2026-07-12T00:34:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw은 Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo를 비롯하여 그룹을 지원하는 모든 채널에 동일한 그룹 규칙을 적용합니다.

에이전트가 명시적으로 표시되는 메시지를 보내지 않는 한 조용히 컨텍스트만 제공해야 하는 상시 활성 방은 [주변 방 이벤트](/ko/channels/ambient-room-events)를 참조하세요.

## 초보자용 소개(2분)

OpenClaw은 사용자의 메시징 계정에서 "작동"합니다. 별도의 WhatsApp 봇 사용자는 없습니다. **사용자**가 그룹에 참여해 있으면 OpenClaw이 해당 그룹을 보고 그곳에서 응답할 수 있습니다.

기본 동작:

- 그룹은 제한됩니다(`groupPolicy: "allowlist"`). 허용 목록에 추가될 때까지 그룹 발신자는 차단됩니다.
- 그룹의 멘션 제한을 비활성화하지 않는 한 응답하려면 멘션이 필요합니다.
- 최종 응답 텍스트는 방에 자동으로 게시됩니다(`visibleReplies: "automatic"`).

즉, 허용 목록에 있는 발신자는 OpenClaw을 멘션하여 작동시킬 수 있습니다.

<Note>
**요약**

- **DM 접근**은 `*.allowFrom`으로 제어합니다.
- **그룹 접근**은 `*.groupPolicy`와 허용 목록(`*.groups`, `*.groupAllowFrom`)으로 제어합니다.
- **응답 트리거**는 멘션 제한(`requireMention`, `/activation`)으로 제어합니다.

</Note>

빠른 흐름(그룹 메시지의 처리 과정):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 표시되는 응답

일반적인 그룹/채널 요청에서 OpenClaw의 기본값은 `messages.groupChat.visibleReplies: "automatic"`입니다. 최종 어시스턴트 텍스트가 표시되는 응답으로 방에 게시됩니다.

공유 방에서 에이전트가 `message(action=send)`를 호출하여 언제 말할지 결정하도록 하려면 `messages.groupChat.visibleReplies: "message_tool"`을 사용하세요. 이 설정은 도구를 안정적으로 사용하는 모델(예: GPT-5.6 Sol)에서 가장 잘 작동합니다. 모델이 도구 호출을 누락하고 실질적인 최종 텍스트를 반환하면 OpenClaw은 해당 텍스트를 방에 게시하지 않고 비공개로 유지합니다.

도구 전용 전달을 안정적으로 따르지 못하는 모델이나 런타임에는 `"automatic"`을 사용하세요. 일반적인 최종 텍스트는 방에 직접 게시되며, 최종 텍스트와 함께 전달할 수 없는 파일, 이미지 또는 기타 첨부 파일에는 에이전트가 여전히 `message(action=send)`를 호출할 수 있습니다.

활성 도구 정책에서 메시지 도구를 사용할 수 없으면 OpenClaw은 응답을 조용히 숨기지 않고 표시되는 자동 응답으로 대체합니다. `openclaw doctor`는 이러한 불일치를 경고합니다.

직접 채팅과 기타 모든 소스 이벤트에서는 `messages.visibleReplies: "message_tool"`이 동일한 도구 전용 동작을 전역으로 적용하며, `messages.groupChat.visibleReplies`는 그룹/채널 방에 대한 더 구체적인 재정의로 유지됩니다. 내부 WebChat의 직접 턴은 기본적으로 최종 응답을 자동으로 전달하므로 Pi와 Codex에 동일한 표시 응답 계약이 적용됩니다.

도구 전용 모드는 대부분의 관망 모드 턴에서 모델이 `NO_REPLY`로 응답하도록 강제하던 기존 패턴을 대체합니다. 도구 전용 모드에서는 프롬프트에 `NO_REPLY` 계약이 정의되지 않습니다. 표시되는 작업을 하지 않는다는 것은 단순히 메시지 도구를 호출하지 않는다는 의미입니다.

Plugin이 소유한 대화 바인딩은 예외입니다. Plugin이 스레드를 바인딩하고 수신 턴을 인계하면 Plugin이 반환한 응답이 표시되는 바인딩 응답이 되며, `message(action=send)`가 필요하지 않습니다. 이 응답은 비공개 모델 최종 텍스트가 아니라 Plugin 런타임 출력입니다.

직접적인 그룹 요청에는 입력 중 표시기가 계속 전송됩니다. 활성화된 주변 상시 방 이벤트는 에이전트가 메시지 도구를 호출하지 않는 한 엄격하게 조용한 상태를 유지합니다.

세션은 기본적으로 자세한 도구/진행 상황 요약을 숨깁니다. 디버깅하는 동안 현재 세션에 표시하려면 `/verbose on`(또는 `/verbose full`)을 사용하고, 최종 응답만 표시하는 동작으로 돌아가려면 `/verbose off`를 사용하세요. 상세 표시 상태는 세션별로 적용되며 직접 채팅, 그룹, 채널 및 포럼 주제에서 동일하게 작동합니다.

멘션되지 않은 상시 그룹 대화를 사용자 요청 대신 조용한 방 컨텍스트로 제출하려면 [주변 방 이벤트](/ko/channels/ambient-room-events)를 사용하세요.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

기본값은 `unmentionedInbound: "user_request"`입니다. 멘션된 메시지, 명령, 중단 요청 및 DM은 사용자 요청으로 유지됩니다.

그룹/채널 요청의 표시 출력을 메시지 도구를 통해서만 보내도록 요구하려면 다음과 같이 설정하세요.

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

모든 소스 채팅에 적용하려면 다음과 같이 설정하세요.

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

파일을 저장하면 Gateway가 다시 시작하지 않고 `messages` 구성 변경 사항을 반영합니다. 구성 다시 불러오기가 비활성화된 경우(`gateway.reload.mode: "off"`)에만 다시 시작하세요.

명령 턴은 `visibleReplies: "message_tool"`을 우회하고 항상 표시되는 응답을 보냅니다. 네이티브 슬래시 명령(Discord, Telegram 및 네이티브 명령을 지원하는 기타 환경)과 승인된 텍스트 `/...` 명령 모두 소스 채팅에 응답을 게시합니다. 그룹에서 승인되지 않은 텍스트 `/...` 턴은 메시지 도구 전용으로 유지되며, 일반 채팅 턴은 구성된 기본값을 따릅니다.

## 컨텍스트 표시 범위와 허용 목록

그룹 안전에는 서로 다른 두 가지 제어가 관여합니다.

- **트리거 권한 부여**: 에이전트를 작동시킬 수 있는 사용자(`groupPolicy`, `groups`, `groupAllowFrom`, 채널별 허용 목록)
- **컨텍스트 표시 범위**: 모델에 주입되는 보조 컨텍스트(응답/인용 텍스트, 스레드 기록, 전달된 메타데이터)

기본적으로 OpenClaw은 수신한 컨텍스트를 그대로 유지합니다. 허용 목록은 누가 작업을 트리거할 수 있는지를 결정하며, 모델이 어떤 인용 또는 과거 기록 조각을 볼 수 있는지는 결정하지 않습니다. 보조 컨텍스트도 필터링하려면 `contextVisibility`를 설정하세요.

| 모드                 | 동작                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------ |
| `"all"`(기본값)      | 수신한 보조 컨텍스트를 그대로 유지합니다.                                                  |
| `"allowlist"`       | 허용 목록에 있는 발신자의 기록/스레드/인용/전달 컨텍스트만 주입합니다.                         |
| `"allowlist_quote"` | `allowlist`와 동일하되, 모든 발신자가 명시적으로 인용하거나 응답 대상으로 지정한 메시지는 유지합니다. |

채널별(`channels.<channel>.contextVisibility`), 계정별(`channels.<channel>.accounts.<accountId>.contextVisibility`) 또는 전역(`channels.defaults.contextVisibility`)으로 설정하세요. 보조 컨텍스트를 가져오는 채널(Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp)은 수신 컨텍스트를 구성할 때 이 정책을 적용합니다. 알 수 없는 정책 조합은 안전을 위해 차단되며 컨텍스트를 생략합니다.

![그룹 메시지 흐름](/images/groups-flow.svg)

원하는 동작별 설정:

| 목표                                           | 설정할 값                                                  |
| --------------------------------------------- | ---------------------------------------------------------- |
| 모든 그룹을 허용하되 @멘션에만 응답               | `groups: { "*": { requireMention: true } }`                |
| 모든 그룹 응답 비활성화                          | `groupPolicy: "disabled"`                                  |
| 특정 그룹만 허용                                | `groups: { "<group-id>": { ... } }` (`"*"` 키 없음)         |
| 그룹에서는 나만 트리거 가능                       | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| 여러 채널에서 하나의 신뢰할 수 있는 발신자 집합 재사용 | `groupAllowFrom: ["accessGroup:operators"]`                |

재사용 가능한 발신자 허용 목록은 [접근 그룹](/ko/channels/access-groups)을 참조하세요.

## 세션 키

- 그룹 세션은 `agent:<agentId>:<channel>:group:<id>` 세션 키를 사용합니다(방/채널은 `agent:<agentId>:<channel>:channel:<id>` 사용).
- Telegram 포럼 주제는 각 주제가 자체 세션을 갖도록 그룹 ID에 `:topic:<threadId>`를 추가합니다.
- 직접 채팅은 기본 세션을 사용합니다(`session.dmScope`가 구성된 경우에는 발신자별 세션 사용).
- Heartbeat는 구성된 Heartbeat 세션(기본값: 에이전트 기본 세션)에서 실행되며, 그룹 세션은 자체 Heartbeat를 실행하지 않습니다.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 패턴: 개인 DM + 공개 그룹(단일 에이전트)

네. "개인" 트래픽이 **DM**이고 "공개" 트래픽이 **그룹**인 경우 잘 작동합니다.

이유: 단일 에이전트 모드에서 DM은 일반적으로 **기본** 세션 키(`agent:main:main`)로 들어가는 반면, 그룹은 항상 **기본이 아닌** 세션 키(`agent:main:<channel>:group:<id>`)를 사용합니다. `mode: "non-main"`으로 샌드박스를 활성화하면 그룹 세션은 구성된 샌드박스 백엔드에서 실행되고 기본 DM 세션은 호스트에 유지됩니다. 백엔드를 선택하지 않으면 Docker가 기본값입니다.

따라서 하나의 에이전트 "두뇌"(공유 작업 공간 및 메모리)를 사용하면서 두 가지 실행 방식을 적용할 수 있습니다.

- **DM**: 모든 도구 사용 가능(호스트)
- **그룹**: 샌드박스 + 제한된 도구

<Note>
완전히 분리된 작업 공간/페르소나("개인"과 "공개"가 절대 섞이면 안 됨)가 필요하면 두 번째 에이전트와 바인딩을 사용하세요. [다중 에이전트 라우팅](/ko/concepts/multi-agent)을 참조하세요.
</Note>

<Tabs>
  <Tab title="호스트의 DM, 샌드박스의 그룹">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="그룹에서 허용 목록의 폴더만 표시">
    "호스트 접근 없음" 대신 "그룹에서 X 폴더만 볼 수 있음"을 원하나요? `workspaceAccess: "none"`을 유지하고 허용 목록에 있는 경로만 샌드박스에 마운트하세요.

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

관련 항목:

- 구성 키 및 기본값: [Gateway 구성](/ko/gateway/config-agents#agentsdefaultssandbox)
- 도구가 차단되는 이유 디버깅: [샌드박스와 도구 정책 및 권한 상승 비교](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)
- 바인드 마운트 세부 정보: [샌드박스](/ko/gateway/sandboxing#custom-bind-mounts)

## 표시 레이블

- UI 레이블은 사용 가능한 경우 `displayName`을 사용하며 `<channel>:<token>` 형식으로 표시됩니다.
- `#room`은 방/채널용으로 예약되어 있습니다. 그룹 채팅은 `g-<slug>`를 사용합니다(소문자, 공백 -> `-`, `#@+._-` 유지). 매우 긴 불투명 ID는 전체 경로 ID가 UI에 노출되지 않도록 안정적인 토큰으로 축약됩니다.

## 그룹 정책

채널별로 그룹/방 메시지 처리 방식을 제어합니다.

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 숫자형 Telegram 사용자 ID(설정 과정에서 @username을 확인함)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| 정책          | 동작                                                         |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 그룹은 허용 목록을 우회하지만, 멘션 제한은 계속 적용됩니다. |
| `"disabled"`  | 모든 그룹 메시지를 완전히 차단합니다.                       |
| `"allowlist"` | 구성된 허용 목록과 일치하는 그룹/방만 허용합니다.            |

<AccordionGroup>
  <Accordion title="채널별 참고 사항">
    - `groupPolicy`는 멘션 제한(@멘션 필요 여부)과 별개입니다.
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom`을 사용합니다(대체 설정: 명시적 `allowFrom`).
    - Signal: `groupAllowFrom`은 수신 Signal 그룹 ID 또는 발신자의 전화번호/UUID와 일치할 수 있습니다.
    - DM 페어링 승인(`*-allowFrom` 저장소 항목)은 DM 접근에만 적용되며, 그룹 발신자 권한 부여는 그룹 허용 목록에 명시적으로 유지됩니다.
    - Discord: 허용 목록은 `channels.discord.guilds.<id>.channels`를 사용합니다.
    - Slack: 허용 목록은 `channels.slack.channels`를 사용합니다.
    - Matrix: 허용 목록은 `channels.matrix.groups`를 사용합니다. 방 ID(`!room:server`) 또는 별칭(`#alias:server`)을 사용하세요. 방 이름 키는 `channels.matrix.dangerouslyAllowNameMatching: true`일 때만 일치하며, 확인되지 않은 항목은 런타임에 무시됩니다. 발신자를 제한하려면 `channels.matrix.groupAllowFrom`을 사용하세요. 방별 `users` 허용 목록도 지원됩니다.
    - 그룹 DM은 별도로 제어됩니다(`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: 발신자 허용 목록에는 숫자형 사용자 ID만 사용할 수 있습니다(`"123456789"`; `telegram:`/`tg:` 접두사는 대소문자를 구분하지 않고 제거됨). `@username` 항목은 런타임에 일치하지 않으며 경고가 기록됩니다. 설정 과정에서는 `@username`을 ID로 확인합니다. 음수 채팅 ID는 발신자 허용 목록이 아니라 `channels.telegram.groups` 아래에 있어야 합니다.
    - 기본값은 `groupPolicy: "allowlist"`입니다. 그룹 허용 목록이 비어 있으면 그룹 메시지가 차단됩니다.
    - 런타임 안전성: 제공자 블록이 완전히 누락된 경우(`channels.<provider>` 없음), 그룹 정책은 `channels.defaults.groupPolicy`를 상속하지 않고 안전하게 `allowlist`로 차단되며, Gateway는 계정별로 한 번씩 대체 동작을 기록합니다.

  </Accordion>
</AccordionGroup>

빠른 개념 모델(그룹 메시지 평가 순서):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`(open/disabled/allowlist).
  </Step>
  <Step title="그룹 허용 목록">
    그룹 허용 목록(`*.groups`, `*.groupAllowFrom`, 채널별 허용 목록).
  </Step>
  <Step title="멘션 제한">
    멘션 제한(`requireMention`, `/activation`).
  </Step>
</Steps>

## 멘션 제한(기본값)

그룹 메시지는 그룹별로 재정의하지 않는 한 멘션이 필요합니다. 기본값은 각 하위 시스템의 `*.groups."*"` 아래에 있습니다.

채널이 답장 메타데이터를 제공하는 경우 봇 메시지에 답장하면 암시적 멘션으로 간주됩니다. 인용 메타데이터를 제공하는 채널에서는 봇 메시지 인용도 멘션으로 간주될 수 있습니다. 현재 기본 제공 사례는 Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp 및 Zalo 개인용입니다.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## 구성된 멘션 패턴의 범위 지정

구성된 `mentionPatterns`는 정규식 기반 대체 트리거입니다. 플랫폼이 네이티브 봇 멘션을 제공하지 않거나 `openclaw:` 같은 일반 텍스트도 멘션으로 간주해야 할 때 사용하세요. 네이티브 플랫폼 멘션은 별개입니다. Discord, Slack, Telegram, Matrix 또는 다른 채널에서 메시지가 봇을 명시적으로 멘션했다는 사실을 확인할 수 있으면, 구성된 정규식 패턴이 거부된 곳에서도 해당 네이티브 멘션은 계속 트리거됩니다.

기본적으로 구성된 멘션 패턴은 채널이 제공자 및 대화 정보를 멘션 감지에 전달하는 모든 곳에 적용됩니다. 광범위한 패턴이 모든 그룹에서 에이전트를 깨우지 않도록 하려면 `channels.<channel>.mentionPatterns`를 사용하여 채널별로 범위를 지정하세요.

정규식 멘션 패턴을 특정 채널에서 기본적으로 끄고 특정 방에서만 사용하려면 `mode: "deny"`를 사용하고 `allowIn`으로 해당 방을 명시하세요.

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

정규식 멘션 패턴을 광범위하게 적용하고 시끄러운 방에서만 끄려면 기본값인 `mode: "allow"`를 사용하거나 `mode`를 생략한 후 `denyIn`으로 해당 방을 지정하세요.

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

정책 결정:

| 필드            | 효과                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 대화 ID가 `denyIn`에 없으면 정규식 멘션 패턴이 활성화됩니다. 이것이 기본값입니다.                                             |
| `mode: "deny"`  | 대화 ID가 `allowIn`에 있어야 정규식 멘션 패턴이 활성화됩니다.                                                                 |
| `allowIn`       | 거부 모드에서 정규식 멘션 패턴이 활성화되는 대화 ID입니다.                                                                    |
| `denyIn`        | 정규식 멘션 패턴이 비활성화되는 대화 ID입니다. 같은 ID가 둘 다에 있으면 `denyIn`이 `allowIn`보다 우선합니다.                   |

현재 지원되는 범위 지정 정규식 정책:

| 채널     | `allowIn` / `denyIn`에 사용되는 ID                            |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord 채널 ID.                                             |
| Matrix   | Matrix 방 ID.                                                |
| Slack    | Slack 채널 ID.                                               |
| Telegram | 그룹 채팅 ID 또는 포럼 주제의 `chatId:topic:threadId`.       |
| WhatsApp | `123@g.us` 같은 WhatsApp 대화 ID.                            |

채널이 여러 계정을 지원하는 경우 계정 수준 채널 구성에서 `channels.<channel>.accounts.<accountId>.mentionPatterns` 아래에 동일한 정책을 설정할 수 있습니다. 해당 계정에서는 계정 정책이 최상위 채널 정책보다 우선합니다.

<AccordionGroup>
  <Accordion title="멘션 제한 참고 사항">
    - `mentionPatterns`는 대소문자를 구분하지 않는 안전한 정규식 패턴입니다. 잘못된 패턴과 안전하지 않은 중첩 반복 형식은 경고와 함께 무시됩니다.
    - 패턴 우선순위: `agents.list[].groupChat.mentionPatterns`(여러 에이전트가 그룹을 공유할 때 유용함)가 `messages.groupChat.mentionPatterns`보다 우선합니다. 둘 다 설정되지 않으면 에이전트의 신원 이름/이모지에서 패턴을 파생합니다.
    - 멘션 제한은 멘션 감지가 가능한 경우(네이티브 멘션 또는 구성된 `mentionPatterns`)에만 적용됩니다.
    - 그룹이나 발신자를 허용 목록에 추가해도 멘션 제한은 비활성화되지 않습니다. 모든 메시지가 트리거되어야 하면 해당 그룹의 `requireMention`을 `false`로 설정하세요.
    - 자동 그룹 채팅 프롬프트 컨텍스트는 확인된 무응답 지침을 매 턴 포함합니다. 작업 공간 파일에서 `NO_REPLY` 동작을 중복 정의하면 안 됩니다.
    - 자동 무응답이 허용된 그룹에서는 내용이 없는 정상적인 모델 턴이나 추론만 포함된 모델 턴을 `NO_REPLY`와 동일한 무응답으로 처리합니다. 직접 채팅에는 `NO_REPLY` 지침이 제공되지 않으며, 메시지 도구만 사용하는 그룹 응답은 `message(action=send)`를 호출하지 않아 조용히 유지됩니다.
    - 상시 활성화된 주변 그룹 대화는 기본적으로 사용자 요청 의미론을 사용합니다. 대신 조용한 컨텍스트로 제출하려면 `messages.groupChat.unmentionedInbound: "room_event"`를 설정하세요. 설정 예시는 [주변 방 이벤트](/ko/channels/ambient-room-events)를 참조하세요.
    - 방 이벤트는 가짜 사용자 요청으로 저장되지 않으며, 메시지 도구를 사용하지 않는 방 이벤트에서 생성된 비공개 어시스턴트 텍스트는 채팅 기록으로 다시 재생되지 않습니다.
    - Discord 기본값은 `channels.discord.guilds."*"`에 있습니다(길드/채널별로 재정의 가능).
    - 그룹 기록 컨텍스트는 모든 채널에서 동일한 방식으로 래핑됩니다. 멘션 제한 그룹은 보류 중인 건너뛴 메시지를 유지합니다. 채널이 지원하는 경우 상시 활성화 그룹도 최근 처리된 방 메시지를 유지할 수 있습니다. 전역 기본값에는 `messages.groupChat.historyLimit`을 사용하고, 재정의에는 `channels.<channel>.historyLimit`(또는 `channels.<channel>.accounts.*.historyLimit`)을 사용하세요. 비활성화하려면 `0`으로 설정하세요.

  </Accordion>
</AccordionGroup>

## 그룹/채널 도구 제한(선택 사항)

일부 채널 구성에서는 **특정 그룹/방/채널 내부**에서 사용할 수 있는 도구를 제한할 수 있습니다.

- `tools`: 전체 그룹에 대한 도구 허용/거부(`allow`, `alsoAllow`, `deny`; 거부가 우선함).
- `toolsBySender`: 그룹 내 발신자별 재정의. 명시적 키 접두사를 사용하세요: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` 및 `"*"` 와일드카드. 채널 ID는 정규 OpenClaw 채널 ID를 사용하며, `teams` 같은 별칭은 `msteams`로 정규화됩니다. 접두사가 없는 레거시 키도 계속 허용되지만 `id:`로만 일치하며 지원 중단 경고가 기록됩니다.

결정 순서(가장 구체적인 항목이 우선):

<Steps>
  <Step title="그룹 toolsBySender">
    그룹/채널 `toolsBySender` 일치 항목.
  </Step>
  <Step title="그룹 tools">
    그룹/채널 `tools`.
  </Step>
  <Step title="기본 toolsBySender">
    기본값(`"*"`)의 `toolsBySender` 일치 항목.
  </Step>
  <Step title="기본 도구">
    기본값(`"*"`)의 `tools`.
  </Step>
</Steps>

예시(Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
그룹/채널 도구 제한은 전역/에이전트 도구 정책에 추가로 적용됩니다(거부가 계속 우선함). 일부 채널은 방/채널에 다른 중첩 구조를 사용합니다(예: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## 그룹 허용 목록

`channels.whatsapp.groups`, `channels.telegram.groups` 또는 `channels.imessage.groups`가 구성되면 해당 키가 그룹 허용 목록 역할을 합니다. 기본 멘션 동작을 계속 설정하면서 모든 그룹을 허용하려면 `"*"`를 사용하세요.

<Warning>
흔히 혼동하는 점: DM 페어링 승인은 그룹 권한 부여와 같지 않습니다. DM 페어링을 지원하는 채널에서 페어링 저장소는 DM만 허용합니다. 그룹 명령에는 여전히 `groupAllowFrom` 같은 구성 허용 목록이나 해당 채널에 문서화된 구성 대체 설정을 통한 명시적인 그룹 발신자 권한 부여가 필요합니다.
</Warning>

일반적인 설정 목적(복사/붙여넣기):

<Tabs>
  <Tab title="모든 그룹 답장 비활성화">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="특정 그룹만 허용(WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="모든 그룹을 허용하되 멘션 요구">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="소유자 전용 트리거(WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## 활성화(소유자 전용)

그룹 소유자는 다음과 같은 독립 메시지로 그룹별 활성화 방식을 전환할 수 있습니다.

- `/activation mention`
- `/activation always`

`/activation`은 소유자 권한으로 제한되는 핵심 명령이며 그룹 채팅에서만 적용됩니다. 소유자란 발신자가 채널의 `allowFrom` / `commands.ownerAllowFrom`과 일치하는 경우를 의미합니다(허용 목록이 구성되지 않은 경우 계정 자체 ID가 소유자로 간주됨). 저장된 모드는 이를 참조하는 채널(Google Chat, QQBot, Telegram, WhatsApp)에서 해당 그룹의 `requireMention`을 재정의하며, 그룹 시스템 프롬프트 도입부에는 모든 채널에서 활성 모드가 반영됩니다.

## 컨텍스트 필드

그룹 인바운드 페이로드에는 다음 값이 설정됩니다.

- `ChatType=group`
- `GroupSubject`(알려진 경우)
- `GroupMembers`(알려진 경우)
- `WasMentioned`(멘션 제한 결과)
- Telegram 포럼 주제에는 `MessageThreadId`와 `IsForum`도 포함됩니다.

에이전트 시스템 프롬프트에는 새 그룹 세션의 첫 번째 턴과 `/activation` 변경 후에 그룹 도입부가 포함됩니다. 이는 모델이 사람처럼 응답하고, 빈 줄을 최소화하며 일반적인 채팅 줄 간격을 따르고, 리터럴 `\n` 시퀀스를 입력하지 않도록 안내합니다. Telegram 이외의 그룹에서는 Markdown 표 사용도 자제하도록 안내하며, Telegram 리치 텍스트 지침은 Telegram 채널 프롬프트에서 제공됩니다. 채널에서 가져온 그룹 이름과 참여자 레이블은 인라인 시스템 지침이 아니라 펜스로 구분된 신뢰할 수 없는 메타데이터로 렌더링됩니다.

## iMessage 세부 사항

- 라우팅하거나 허용 목록에 추가할 때는 `chat_id:<id>`를 사용하는 것이 좋습니다.
- 채팅 목록 조회: `imsg chats --limit 20`.
- 그룹 답장은 항상 동일한 `chat_id`로 전송됩니다.

## WhatsApp 시스템 프롬프트

그룹 및 다이렉트 프롬프트 결정, 와일드카드 동작, 계정 재정의 의미를 포함한 표준 WhatsApp 시스템 프롬프트 규칙은 [WhatsApp](/ko/channels/whatsapp#system-prompts)을 참조하세요.

## WhatsApp 세부 사항

WhatsApp 전용 동작(기록 삽입, 멘션 처리 세부 사항)은 [그룹 메시지](/ko/channels/group-messages)를 참조하세요.

## 관련 문서

- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
- [채널 라우팅](/ko/channels/channel-routing)
- [그룹 메시지](/ko/channels/group-messages)
- [페어링](/ko/channels/pairing)
