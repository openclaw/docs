---
read_when:
    - 그룹 채팅 동작 또는 멘션 게이팅 변경
sidebarTitle: Groups
summary: 서피스 전반의 그룹 채팅 동작 (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: 그룹
x-i18n:
    generated_at: "2026-05-11T20:20:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw은 그룹 채팅을 여러 표면에서 일관되게 처리합니다: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## 초보자 소개(2분)

OpenClaw은 사용자의 자체 메시징 계정에 "상주"합니다. 별도의 WhatsApp 봇 사용자는 없습니다. **사용자**가 그룹에 있으면 OpenClaw은 해당 그룹을 볼 수 있고 그곳에서 응답할 수 있습니다.

기본 동작:

- 그룹은 제한됩니다(`groupPolicy: "allowlist"`).
- 멘션 게이팅을 명시적으로 비활성화하지 않는 한, 응답에는 멘션이 필요합니다.
- 그룹/채널의 일반 최종 응답은 기본적으로 비공개입니다. 표시되는 방 출력은 `message` 도구를 사용합니다.

해석: 허용 목록에 있는 발신자는 OpenClaw을 멘션하여 트리거할 수 있습니다.

<Note>
**요약**

- **DM 액세스**는 `*.allowFrom`으로 제어됩니다.
- **그룹 액세스**는 `*.groupPolicy` + 허용 목록(`*.groups`, `*.groupAllowFrom`)으로 제어됩니다.
- **응답 트리거**는 멘션 게이팅(`requireMention`, `/activation`)으로 제어됩니다.

</Note>

빠른 흐름(그룹 메시지에 발생하는 일):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 표시되는 응답

그룹/채널 방의 경우 OpenClaw은 기본적으로 `messages.groupChat.visibleReplies: "message_tool"`을 사용합니다.
`openclaw doctor --fix`는 이를 생략한 구성된 채널 설정에 이 기본값을 씁니다.
즉, 에이전트는 여전히 턴을 처리하고 메모리/세션 상태를 업데이트할 수 있지만, 일반 최종 답변은 방에 자동으로 다시 게시되지 않습니다. 표시되게 말하려면 에이전트가 `message(action=send)`를 사용합니다.

이 기본값은 도구를 안정적으로 호출하는 모델/런타임에 의존합니다. 로그에
어시스턴트 텍스트가 표시되지만 `didSendViaMessagingTool: false`이면, 모델이
메시지 도구를 호출하는 대신 비공개로 응답한 것입니다. 이는
Discord/Slack/Telegram 전송 실패가 아닙니다. 그룹/채널 세션에는
도구 호출이 안정적인 모델을 사용하거나, 레거시의 표시되는
최종 응답을 복원하려면
`messages.groupChat.visibleReplies: "automatic"`을 설정하세요.

활성 도구 정책에서 메시지 도구를 사용할 수 없는 경우, OpenClaw은 응답을 조용히 억제하지 않고
자동 표시 응답으로 폴백합니다.
`openclaw doctor`는 이 불일치에 대해 경고합니다.

직접 채팅 및 기타 모든 소스 턴에는 동일한 도구 전용 표시 응답 동작을 전역으로 적용하려면 `messages.visibleReplies: "message_tool"`을 사용하세요. 하네스도 이를 설정되지 않은 기본값으로 선택할 수 있습니다. Codex 하네스는 Codex 모드 직접 채팅에 대해 이렇게 합니다. `messages.groupChat.visibleReplies`는 그룹/채널 방에 대한 더 구체적인 재정의로 유지됩니다.

이는 대부분의 대기 모드 턴에서 모델이 `NO_REPLY`로 답하도록 강제하던 이전 패턴을 대체합니다. 도구 전용 모드에서 표시되는 동작을 하지 않는다는 것은 단순히 메시지 도구를 호출하지 않는다는 뜻입니다.

에이전트가 도구 전용 모드에서 작업하는 동안에도 입력 표시기는 계속 전송됩니다. 이러한 턴에서는 에이전트가 메시지 도구를 호출할지 결정하기 전에 일반 어시스턴트 메시지 텍스트가 전혀 없을 수 있으므로 기본 그룹 입력 모드는 "message"에서 "instant"로 업그레이드됩니다. 명시적인 입력 모드 설정은 여전히 우선합니다.

그룹/채널 방에 대해 레거시 자동 최종 응답을 복원하려면:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

파일이 저장되면 Gateway가 `messages` 설정을 핫 리로드합니다. 배포에서 파일 감시 또는 설정 리로드가 비활성화된 경우에만
다시 시작하세요.

모든 소스 채팅에서 표시되는 출력을 메시지 도구를 통해서만 내보내도록 요구하려면:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

네이티브 슬래시 명령(Discord, Telegram 및 네이티브 명령 지원이 있는 기타 표면)은 `visibleReplies: "message_tool"`을 우회하며, 채널 네이티브 명령 UI가 기대하는 응답을 받을 수 있도록 항상 표시되게 답합니다. 이는 검증된 네이티브 명령 턴에만 적용됩니다. 텍스트로 입력된 `/...` 명령과 일반 채팅 턴은 여전히 구성된 그룹 기본값을 따릅니다.

## 컨텍스트 가시성 및 허용 목록

그룹 안전에는 두 가지 서로 다른 제어가 관련됩니다.

- **트리거 권한 부여**: 누가 에이전트를 트리거할 수 있는지(`groupPolicy`, `groups`, `groupAllowFrom`, 채널별 허용 목록).
- **컨텍스트 가시성**: 어떤 보조 컨텍스트가 모델에 주입되는지(답장 텍스트, 인용, 스레드 기록, 전달된 메타데이터).

기본적으로 OpenClaw은 일반 채팅 동작을 우선시하고 컨텍스트를 대부분 받은 그대로 유지합니다. 즉, 허용 목록은 주로 누가 작업을 트리거할 수 있는지를 결정하며, 인용되거나 기록된 모든 스니펫에 대한 보편적인 수정 경계가 아닙니다.

<AccordionGroup>
  <Accordion title="현재 동작은 채널별로 다릅니다">
    - 일부 채널은 이미 특정 경로에서 보조 컨텍스트에 대해 발신자 기반 필터링을 적용합니다(예: Slack 스레드 시딩, Matrix 답장/스레드 조회).
    - 다른 채널은 여전히 인용/답장/전달 컨텍스트를 받은 그대로 전달합니다.

  </Accordion>
  <Accordion title="강화 방향(계획됨)">
    - `contextVisibility: "all"`(기본값)은 현재의 받은 그대로 동작을 유지합니다.
    - `contextVisibility: "allowlist"`는 보조 컨텍스트를 허용 목록에 있는 발신자로 필터링합니다.
    - `contextVisibility: "allowlist_quote"`는 `allowlist`에 명시적인 인용/답장 예외 하나를 더한 것입니다.

    이 강화 모델이 채널 전반에 일관되게 구현될 때까지는 표면별 차이를 예상하세요.

  </Accordion>
</AccordionGroup>

![그룹 메시지 흐름](/images/groups-flow.svg)

원하는 작업...

| 목표                                         | 설정할 항목                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 모든 그룹을 허용하되 @멘션에만 응답 | `groups: { "*": { requireMention: true } }`                |
| 모든 그룹 응답 비활성화                    | `groupPolicy: "disabled"`                                  |
| 특정 그룹만                         | `groups: { "<group-id>": { ... } }` (`"*"` 키 없음)         |
| 그룹에서 사용자만 트리거 가능               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| 채널 간에 신뢰할 수 있는 발신자 집합 하나 재사용 | `groupAllowFrom: ["accessGroup:operators"]`                |

재사용 가능한 발신자 허용 목록은 [액세스 그룹](/ko/channels/access-groups)을 참조하세요.

## 세션 키

- 그룹 세션은 `agent:<agentId>:<channel>:group:<id>` 세션 키를 사용합니다(방/채널은 `agent:<agentId>:<channel>:channel:<id>` 사용).
- Telegram 포럼 주제는 각 주제에 자체 세션이 있도록 그룹 ID에 `:topic:<threadId>`를 추가합니다.
- 직접 채팅은 기본 세션(또는 구성된 경우 발신자별 세션)을 사용합니다.
- 그룹 세션에서는 Heartbeat를 건너뜁니다.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 패턴: 개인 DM + 공개 그룹(단일 에이전트)

예. "개인" 트래픽이 **DM**이고 "공개" 트래픽이 **그룹**이라면 잘 작동합니다.

이유: 단일 에이전트 모드에서 DM은 일반적으로 **기본** 세션 키(`agent:main:main`)에 도착하는 반면, 그룹은 항상 **비기본** 세션 키(`agent:main:<channel>:group:<id>`)를 사용합니다. `mode: "non-main"`으로 샌드박싱을 활성화하면, 해당 그룹 세션은 구성된 샌드박스 백엔드에서 실행되고 기본 DM 세션은 호스트에 유지됩니다. 백엔드를 선택하지 않으면 Docker가 기본 백엔드입니다.

이를 통해 하나의 에이전트 "두뇌"(공유 워크스페이스 + 메모리)를 사용하면서 두 가지 실행 태세를 가질 수 있습니다.

- **DM**: 전체 도구(호스트)
- **그룹**: 샌드박스 + 제한된 도구

<Note>
진정으로 분리된 워크스페이스/페르소나("개인"과 "공개"가 절대 섞이면 안 됨)가 필요하다면 두 번째 에이전트 + 바인딩을 사용하세요. [Multi-Agent Routing](/ko/concepts/multi-agent)을 참조하세요.
</Note>

<Tabs>
  <Tab title="호스트의 DM, 샌드박스된 그룹">
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
  <Tab title="그룹은 허용 목록에 있는 폴더만 봅니다">
    "호스트 액세스 없음" 대신 "그룹은 X 폴더만 볼 수 있음"을 원하나요? `workspaceAccess: "none"`을 유지하고 허용 목록에 있는 경로만 샌드박스에 마운트하세요.

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

- 설정 키와 기본값: [Gateway 설정](/ko/gateway/config-agents#agentsdefaultssandbox)
- 도구가 차단된 이유 디버깅: [샌드박스 vs 도구 정책 vs 상승 권한](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)
- 바인드 마운트 세부 정보: [샌드박싱](/ko/gateway/sandboxing#custom-bind-mounts)

## 표시 레이블

- UI 레이블은 사용 가능한 경우 `displayName`을 사용하며, `<channel>:<token>` 형식입니다.
- `#room`은 방/채널용으로 예약되어 있습니다. 그룹 채팅은 `g-<slug>`를 사용합니다(소문자, 공백 -> `-`, `#@+._-` 유지).

## 그룹 정책

채널별로 그룹/방 메시지가 처리되는 방식을 제어합니다.

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
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

| 정책        | 동작                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 그룹이 허용 목록을 우회합니다. 멘션 게이팅은 계속 적용됩니다.      |
| `"disabled"`  | 모든 그룹 메시지를 완전히 차단합니다.                           |
| `"allowlist"` | 구성된 허용 목록과 일치하는 그룹/방만 허용합니다. |

<AccordionGroup>
  <Accordion title="채널별 참고 사항">
    - `groupPolicy`는 멘션 게이팅(@mentions 필요)과 별개입니다.
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom`을 사용하세요(대체: 명시적 `allowFrom`).
    - Signal: `groupAllowFrom`은 수신 Signal 그룹 ID 또는 발신자 전화번호/UUID와 일치할 수 있습니다.
    - DM 페어링 승인(`*-allowFrom` 저장소 항목)은 DM 접근에만 적용됩니다. 그룹 발신자 권한 부여는 그룹 허용 목록에 명시적으로 유지됩니다.
    - Discord: 허용 목록은 `channels.discord.guilds.<id>.channels`를 사용합니다.
    - Slack: 허용 목록은 `channels.slack.channels`를 사용합니다.
    - Matrix: 허용 목록은 `channels.matrix.groups`를 사용합니다. 방 ID 또는 별칭을 권장합니다. 참여한 방 이름 조회는 최선 노력 방식이며, 확인되지 않은 이름은 런타임에 무시됩니다. 발신자를 제한하려면 `channels.matrix.groupAllowFrom`을 사용하세요. 방별 `users` 허용 목록도 지원됩니다.
    - 그룹 DM은 별도로 제어됩니다(`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram 허용 목록은 사용자 ID(`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) 또는 사용자 이름(`"@alice"` 또는 `"alice"`)과 일치할 수 있습니다. 접두사는 대소문자를 구분하지 않습니다.
    - 기본값은 `groupPolicy: "allowlist"`입니다. 그룹 허용 목록이 비어 있으면 그룹 메시지가 차단됩니다.
    - 런타임 안전성: 제공자 블록이 완전히 누락된 경우(`channels.<provider>` 없음), 그룹 정책은 `channels.defaults.groupPolicy`를 상속하는 대신 실패 시 닫힘 모드(일반적으로 `allowlist`)로 대체됩니다.

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
  <Step title="멘션 게이팅">
    멘션 게이팅(`requireMention`, `/activation`).
  </Step>
</Steps>

## 멘션 게이팅(기본값)

그룹 메시지는 그룹별로 재정의하지 않는 한 멘션이 필요합니다. 기본값은 `*.groups."*"` 아래의 각 하위 시스템별로 있습니다.

채널이 답장 메타데이터를 지원하는 경우 봇 메시지에 답장하면 암시적 멘션으로 간주됩니다. 인용 메타데이터를 노출하는 채널에서는 봇 메시지를 인용하는 것도 암시적 멘션으로 간주될 수 있습니다. 현재 기본 제공 사례에는 Telegram, WhatsApp, Slack, Discord, Microsoft Teams, ZaloUser가 포함됩니다.

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

<AccordionGroup>
  <Accordion title="멘션 게이팅 참고 사항">
    - `mentionPatterns`는 대소문자를 구분하지 않는 안전한 정규식 패턴입니다. 잘못된 패턴과 안전하지 않은 중첩 반복 형태는 무시됩니다.
    - 명시적 멘션을 제공하는 표면은 계속 통과합니다. 패턴은 대체 수단입니다.
    - 에이전트별 재정의: `agents.list[].groupChat.mentionPatterns`(여러 에이전트가 그룹을 공유할 때 유용).
    - 멘션 게이팅은 멘션 감지가 가능한 경우에만 적용됩니다(네이티브 멘션 또는 `mentionPatterns`가 구성된 경우).
    - 그룹이나 발신자를 허용 목록에 추가해도 멘션 게이팅이 비활성화되지 않습니다. 모든 메시지가 트리거되어야 하는 경우 해당 그룹의 `requireMention`을 `false`로 설정하세요.
    - 그룹 채팅 프롬프트 컨텍스트는 매 턴마다 해석된 무음 답장 지침을 전달합니다. 작업 영역 파일은 `NO_REPLY` 메커니즘을 중복해서는 안 됩니다.
    - 무음 답장이 허용된 그룹은 깨끗한 빈 모델 턴이나 추론만 있는 모델 턴을 `NO_REPLY`와 동등한 무음으로 처리합니다. 직접 채팅은 직접 무음 답장이 명시적으로 허용된 경우에만 동일하게 동작합니다. 그렇지 않으면 빈 답장은 실패한 에이전트 턴으로 남습니다.
    - Discord 기본값은 `channels.discord.guilds."*"`에 있습니다(길드/채널별 재정의 가능).
    - 그룹 기록 컨텍스트는 채널 전반에서 일관되게 래핑됩니다. 멘션 게이팅된 그룹은 보류 중인 건너뛴 메시지를 유지합니다. 항상 켜진 그룹도 채널이 지원하는 경우 최근 처리된 방 메시지를 유지할 수 있습니다. 전역 기본값에는 `messages.groupChat.historyLimit`를 사용하고, 재정의에는 `channels.<channel>.historyLimit`(또는 `channels.<channel>.accounts.*.historyLimit`)를 사용하세요. 비활성화하려면 `0`으로 설정하세요.

  </Accordion>
</AccordionGroup>

## 그룹/채널 도구 제한(선택 사항)

일부 채널 구성은 **특정 그룹/방/채널 내부**에서 사용할 수 있는 도구를 제한하는 기능을 지원합니다.

- `tools`: 전체 그룹에 대한 도구를 허용/거부합니다.
- `toolsBySender`: 그룹 내 발신자별 재정의입니다. 명시적 키 접두사를 사용하세요: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, 그리고 `"*"` 와일드카드. 채널 ID는 표준 OpenClaw 채널 ID를 사용합니다. `teams` 같은 별칭은 `msteams`로 정규화됩니다. 레거시 무접두사 키는 여전히 허용되며 `id:`로만 일치합니다.

해석 순서(가장 구체적인 항목이 우선):

<Steps>
  <Step title="그룹 toolsBySender">
    그룹/채널 `toolsBySender` 일치.
  </Step>
  <Step title="그룹 tools">
    그룹/채널 `tools`.
  </Step>
  <Step title="기본 toolsBySender">
    기본(`"*"`) `toolsBySender` 일치.
  </Step>
  <Step title="기본 tools">
    기본(`"*"`) `tools`.
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
그룹/채널 도구 제한은 전역/에이전트 도구 정책에 추가로 적용됩니다(거부가 여전히 우선). 일부 채널은 방/채널에 다른 중첩 구조를 사용합니다(예: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## 그룹 허용 목록

`channels.whatsapp.groups`, `channels.telegram.groups` 또는 `channels.imessage.groups`가 구성된 경우, 키는 그룹 허용 목록으로 동작합니다. 기본 멘션 동작을 설정하면서 모든 그룹을 허용하려면 `"*"`를 사용하세요.

<Warning>
흔한 혼동: DM 페어링 승인은 그룹 권한 부여와 같지 않습니다. DM 페어링을 지원하는 채널의 경우, 페어링 저장소는 DM만 잠금 해제합니다. 그룹 명령에는 여전히 `groupAllowFrom` 같은 구성 허용 목록 또는 해당 채널의 문서화된 구성 대체값에서 명시적 그룹 발신자 권한 부여가 필요합니다.
</Warning>

일반적인 의도(복사/붙여넣기):

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

그룹 소유자는 그룹별 활성화를 전환할 수 있습니다.

- `/activation mention`
- `/activation always`

소유자는 `channels.whatsapp.allowFrom`으로 결정됩니다(설정되지 않은 경우 봇의 자체 E.164). 명령을 독립된 메시지로 보내세요. 다른 표면은 현재 `/activation`을 무시합니다.

## 컨텍스트 필드

그룹 수신 페이로드는 다음을 설정합니다.

- `ChatType=group`
- `GroupSubject`(알려진 경우)
- `GroupMembers`(알려진 경우)
- `WasMentioned`(멘션 게이팅 결과)
- Telegram 포럼 주제에는 `MessageThreadId`와 `IsForum`도 포함됩니다.

에이전트 시스템 프롬프트는 새 그룹 세션의 첫 턴에 그룹 소개를 포함합니다. 이는 모델이 사람처럼 응답하고, Markdown 표를 피하며, 빈 줄을 최소화하고 일반적인 채팅 간격을 따르며, 리터럴 `\n` 시퀀스를 입력하지 않도록 상기시킵니다. 채널에서 가져온 그룹 이름과 참가자 레이블은 인라인 시스템 지침이 아니라 신뢰할 수 없는 펜스 처리된 메타데이터로 렌더링됩니다.

## iMessage 세부 사항

- 라우팅하거나 허용 목록에 추가할 때 `chat_id:<id>`를 권장합니다.
- 채팅 목록 보기: `imsg chats --limit 20`.
- 그룹 답장은 항상 같은 `chat_id`로 돌아갑니다.

## WhatsApp 시스템 프롬프트

그룹 및 직접 프롬프트 해석, 와일드카드 동작, 계정 재정의 의미를 포함한 표준 WhatsApp 시스템 프롬프트 규칙은 [WhatsApp](/ko/channels/whatsapp#system-prompts)을 참조하세요.

## WhatsApp 세부 사항

WhatsApp 전용 동작(기록 주입, 멘션 처리 세부 사항)은 [그룹 메시지](/ko/channels/group-messages)를 참조하세요.

## 관련

- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
- [채널 라우팅](/ko/channels/channel-routing)
- [그룹 메시지](/ko/channels/group-messages)
- [페어링](/ko/channels/pairing)
