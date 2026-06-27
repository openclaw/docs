---
read_when:
    - 그룹 채팅 동작 또는 멘션 게이트 변경
    - mentionPatterns 범위를 특정 그룹 대화로 제한
sidebarTitle: Groups
summary: 여러 표면 전반의 그룹 채팅 동작(Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: 그룹
x-i18n:
    generated_at: "2026-06-27T17:10:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw은 Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo 등 모든 표면에서 그룹 채팅을 일관되게 처리합니다.

에이전트가 명시적으로 보이는 메시지를 보내지 않는 한 조용한 컨텍스트를 제공해야 하는 상시 활성 방은 [Ambient room events](/ko/channels/ambient-room-events)를 참조하세요.

## 초보자 소개(2분)

OpenClaw은 사용자의 자체 메시징 계정에 "상주"합니다. 별도의 WhatsApp 봇 사용자는 없습니다. **사용자**가 그룹에 있으면 OpenClaw도 그 그룹을 볼 수 있고 그곳에서 응답할 수 있습니다.

기본 동작:

- 그룹은 제한됩니다(`groupPolicy: "allowlist"`).
- 멘션 게이팅을 명시적으로 비활성화하지 않는 한, 응답에는 멘션이 필요합니다.
- 그룹/채널의 보이는 응답은 기본적으로 `message` 도구를 사용합니다.

즉, 허용 목록에 있는 발신자는 OpenClaw을 멘션하여 트리거할 수 있습니다.

<Note>
**요약**

- **DM 액세스**는 `*.allowFrom`으로 제어됩니다.
- **그룹 액세스**는 `*.groupPolicy` + 허용 목록(`*.groups`, `*.groupAllowFrom`)으로 제어됩니다.
- **응답 트리거**는 멘션 게이팅(`requireMention`, `/activation`)으로 제어됩니다.

</Note>

빠른 흐름(그룹 메시지에 일어나는 일):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## 보이는 응답

일반 그룹/채널 요청의 경우 OpenClaw은 기본적으로 `messages.groupChat.visibleReplies: "automatic"`을 사용합니다. 방을 메시지 도구 전용 출력으로 선택하지 않는 한, 최종 어시스턴트 텍스트는 레거시 보이는 응답 경로를 통해 게시됩니다.

공유 방에서 에이전트가 `message(action=send)`를 호출하여 언제 말할지 결정하게 하려면 `messages.groupChat.visibleReplies: "message_tool"`을 사용하세요. 이는 GPT 5.5처럼 최신 세대의 도구 신뢰성이 높은 모델이 지원하는 그룹 방에 가장 적합합니다. 모델이 해당 도구를 놓치고 의미 있는 최종 텍스트를 반환하면, OpenClaw은 그 최종 텍스트를 방에 게시하는 대신 비공개로 유지합니다.

약한 모델이나 도구 전용 전달을 안정적으로 이해하지 못하는 런타임에는 `"automatic"`을 사용하세요. 자동 모드에서는 에이전트의 최종 어시스턴트 텍스트가 보이는 소스 응답 경로이므로, `message(action=send)`를 일관되게 호출할 수 없는 모델도 정상적으로 답변할 수 있습니다.

자동 모드에서는 일반 텍스트 최종 응답이 방에 직접 게시됩니다. 보이는 응답에 파일, 이미지 또는 기타 첨부 파일이 필요한 경우, 에이전트는 이를 최종 텍스트 응답으로 억지로 보내는 대신 해당 첨부 파일에 `message(action=send)`를 계속 사용할 수 있습니다.

활성 도구 정책에서 메시지 도구를 사용할 수 없는 경우, OpenClaw은 응답을 조용히 억제하는 대신 자동 보이는 응답으로 폴백합니다. `openclaw doctor`는 이 불일치에 대해 경고합니다.

직접 채팅 및 기타 모든 소스 이벤트에는 `messages.visibleReplies: "message_tool"`을 사용하여 동일한 도구 전용 보이는 응답 동작을 전역으로 적용하세요. 내부 WebChat 직접 턴은 Pi와 Codex가 동일한 보이는 응답 계약을 받도록 자동 최종 응답 전달이 기본값입니다. 보이는 출력에 의도적으로 `message(action=send)`를 요구하려면 `messages.visibleReplies: "message_tool"`을 설정하세요. `messages.groupChat.visibleReplies`는 그룹/채널 방에 대한 더 구체적인 오버라이드로 유지됩니다.

이는 대부분의 잠복 모드 턴에서 모델이 `NO_REPLY`로 답변하도록 강제하던 기존 패턴을 대체합니다. 도구 전용 모드에서는 프롬프트가 `NO_REPLY` 계약을 정의하지 않습니다. 보이는 동작을 하지 않는다는 것은 단순히 메시지 도구를 호출하지 않는다는 뜻입니다.

Plugin 소유 대화 바인딩은 예외입니다. Plugin이 스레드를 바인딩하고 인바운드 턴을 클레임하면, Plugin이 반환한 응답이 보이는 바인딩 응답입니다. 여기에는 `message(action=send)`가 필요하지 않습니다. 그 응답은 Plugin 런타임 출력이며, 비공개 모델 최종 텍스트가 아닙니다.

입력 표시기는 직접 그룹 요청에 대해서는 계속 전송됩니다. 활성화된 경우 Ambient 상시 활성 방 이벤트는 에이전트가 메시지 도구를 호출하지 않는 한 엄격하고 조용하게 유지됩니다.

세션은 기본적으로 자세한 도구/진행률 요약을 억제합니다. 디버깅 중 현재 세션에 해당 요약을 표시하려면 `/verbose on`을 사용하고, 최종 응답 전용 동작으로 돌아가려면 `/verbose off`를 사용하세요. 동일한 자세한 상태는 직접 채팅, 그룹, 채널, 포럼 주제 전반에 적용됩니다.

멘션되지 않은 상시 활성 그룹 대화를 사용자 요청 대신 조용한 방 컨텍스트로 제출하려면 [Ambient room events](/ko/channels/ambient-room-events)를 사용하세요.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

기본값은 `unmentionedInbound: "user_request"`입니다.

멘션된 메시지, 명령, 중단 요청, DM은 사용자 요청으로 유지됩니다.

그룹/채널 요청의 보이는 출력이 메시지 도구를 거치도록 요구하려면:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

파일을 저장하면 Gateway가 `messages` 구성을 핫 리로드합니다. 배포에서 파일 감시 또는 구성 리로드가 비활성화된 경우에만 다시 시작하세요.

모든 소스 채팅의 보이는 출력이 메시지 도구를 거치도록 요구하려면:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

네이티브 슬래시 명령(Discord, Telegram 및 네이티브 명령 지원이 있는 기타 표면)은 `visibleReplies: "message_tool"`을 우회하고 항상 보이는 방식으로 응답하여 채널 네이티브 명령 UI가 기대하는 응답을 받도록 합니다. 이는 검증된 네이티브 명령 턴에만 적용됩니다. 텍스트로 입력한 `/...` 명령과 일반 채팅 턴은 여전히 구성된 그룹 기본값을 따릅니다.

## 컨텍스트 가시성과 허용 목록

그룹 안전에는 서로 다른 두 가지 제어가 관여합니다.

- **트리거 권한 부여**: 누가 에이전트를 트리거할 수 있는지(`groupPolicy`, `groups`, `groupAllowFrom`, 채널별 허용 목록).
- **컨텍스트 가시성**: 모델에 주입되는 보조 컨텍스트(응답 텍스트, 인용, 스레드 기록, 전달된 메타데이터).

기본적으로 OpenClaw은 일반 채팅 동작을 우선하고 컨텍스트를 대부분 수신된 그대로 유지합니다. 이는 허용 목록이 주로 누가 작업을 트리거할 수 있는지를 결정하며, 모든 인용 또는 기록 스니펫에 대한 보편적인 수정 경계가 아니라는 뜻입니다.

<AccordionGroup>
  <Accordion title="현재 동작은 채널별로 다릅니다">
    - 일부 채널은 이미 특정 경로에서 보조 컨텍스트에 발신자 기반 필터링을 적용합니다(예: Slack 스레드 시딩, Matrix 응답/스레드 조회).
    - 다른 채널은 여전히 인용/응답/전달 컨텍스트를 수신된 그대로 전달합니다.

  </Accordion>
  <Accordion title="강화 방향(계획됨)">
    - `contextVisibility: "all"`(기본값)은 현재의 수신된 그대로 동작을 유지합니다.
    - `contextVisibility: "allowlist"`는 보조 컨텍스트를 허용 목록에 있는 발신자로 필터링합니다.
    - `contextVisibility: "allowlist_quote"`는 `allowlist`에 명시적인 인용/응답 예외 하나를 더한 것입니다.

    이 강화 모델이 채널 전반에 일관되게 구현될 때까지는 표면별 차이를 예상하세요.

  </Accordion>
</AccordionGroup>

![그룹 메시지 흐름](/images/groups-flow.svg)

원하는 것이...

| 목표                                         | 설정할 항목                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| 모든 그룹을 허용하되 @멘션에서만 응답 | `groups: { "*": { requireMention: true } }`                |
| 모든 그룹 응답 비활성화                    | `groupPolicy: "disabled"`                                  |
| 특정 그룹만                         | `groups: { "<group-id>": { ... } }` (`"*"` 키 없음)         |
| 그룹에서 사용자만 트리거 가능               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| 채널 전반에서 신뢰할 수 있는 발신자 집합 하나 재사용 | `groupAllowFrom: ["accessGroup:operators"]`                |

재사용 가능한 발신자 허용 목록은 [Access groups](/ko/channels/access-groups)를 참조하세요.

## 세션 키

- 그룹 세션은 `agent:<agentId>:<channel>:group:<id>` 세션 키를 사용합니다(방/채널은 `agent:<agentId>:<channel>:channel:<id>` 사용).
- Telegram 포럼 주제는 그룹 ID에 `:topic:<threadId>`를 추가하여 각 주제가 자체 세션을 갖도록 합니다.
- 직접 채팅은 기본 세션을 사용합니다(또는 구성된 경우 발신자별 세션).
- Heartbeat는 그룹 세션에서 건너뜁니다.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 패턴: 개인 DM + 공개 그룹(단일 에이전트)

예. "개인" 트래픽이 **DM**이고 "공개" 트래픽이 **그룹**이면 잘 작동합니다.

이유: 단일 에이전트 모드에서 DM은 일반적으로 **기본** 세션 키(`agent:main:main`)로 들어가지만, 그룹은 항상 **비기본** 세션 키(`agent:main:<channel>:group:<id>`)를 사용합니다. `mode: "non-main"`으로 샌드박싱을 활성화하면 해당 그룹 세션은 구성된 샌드박스 백엔드에서 실행되고, 기본 DM 세션은 호스트에 유지됩니다. 백엔드를 선택하지 않으면 Docker가 기본 백엔드입니다.

이를 통해 하나의 에이전트 "두뇌"(공유 워크스페이스 + 메모리)를 유지하면서 두 가지 실행 태세를 가질 수 있습니다.

- **DM**: 전체 도구(호스트)
- **그룹**: 샌드박스 + 제한된 도구

<Note>
진정으로 분리된 워크스페이스/페르소나가 필요하다면("개인"과 "공개"가 절대 섞이면 안 되는 경우), 두 번째 에이전트 + 바인딩을 사용하세요. [Multi-Agent Routing](/ko/concepts/multi-agent)을 참조하세요.
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
    "호스트 액세스 없음" 대신 "그룹은 폴더 X만 볼 수 있음"을 원하나요? `workspaceAccess: "none"`을 유지하고 허용 목록에 있는 경로만 샌드박스에 마운트하세요.

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

- 구성 키와 기본값: [Gateway configuration](/ko/gateway/config-agents#agentsdefaultssandbox)
- 도구가 차단된 이유 디버깅: [Sandbox vs Tool Policy vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated)
- 바인드 마운트 세부 정보: [Sandboxing](/ko/gateway/sandboxing#custom-bind-mounts)

## 표시 레이블

- UI 레이블은 사용 가능한 경우 `displayName`을 사용하며, `<channel>:<token>` 형식입니다.
- `#room`은 방/채널용으로 예약되어 있습니다. 그룹 채팅은 `g-<slug>`를 사용합니다(소문자, 공백 -> `-`, `#@+._-` 유지).

## 그룹 정책

채널별로 그룹/방 메시지가 처리되는 방식을 제어합니다:

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

| 정책          | 동작                                                         |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | 그룹은 허용 목록을 우회하며, 멘션 게이팅은 계속 적용됩니다. |
| `"disabled"`  | 모든 그룹 메시지를 완전히 차단합니다.                       |
| `"allowlist"` | 구성된 허용 목록과 일치하는 그룹/룸만 허용합니다.           |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy`는 멘션 게이팅(@멘션 필요)과 별개입니다.
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom`을 사용합니다(폴백: 명시적 `allowFrom`).
    - Signal: `groupAllowFrom`은 인바운드 Signal 그룹 ID 또는 보낸 사람 전화번호/UUID와 일치할 수 있습니다.
    - DM 페어링 승인(`*-allowFrom` 저장소 항목)은 DM 액세스에만 적용됩니다. 그룹 보낸 사람 권한 부여는 그룹 허용 목록에 명시적으로 유지됩니다.
    - Discord: 허용 목록은 `channels.discord.guilds.<id>.channels`를 사용합니다.
    - Slack: 허용 목록은 `channels.slack.channels`를 사용합니다.
    - Matrix: 허용 목록은 `channels.matrix.groups`를 사용합니다. 룸 ID 또는 별칭을 권장합니다. 참여한 룸 이름 조회는 최선 노력 방식이며, 확인되지 않은 이름은 런타임에서 무시됩니다. 보낸 사람을 제한하려면 `channels.matrix.groupAllowFrom`을 사용합니다. 룸별 `users` 허용 목록도 지원됩니다.
    - 그룹 DM은 별도로 제어됩니다(`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram 허용 목록은 사용자 ID(`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) 또는 사용자 이름(`"@alice"` 또는 `"alice"`)과 일치할 수 있습니다. 접두사는 대소문자를 구분하지 않습니다.
    - 기본값은 `groupPolicy: "allowlist"`입니다. 그룹 허용 목록이 비어 있으면 그룹 메시지는 차단됩니다.
    - 런타임 안전성: 제공자 블록이 완전히 누락된 경우(`channels.<provider>` 없음), 그룹 정책은 `channels.defaults.groupPolicy`를 상속하는 대신 실패 시 닫힘 모드(일반적으로 `allowlist`)로 폴백합니다.

  </Accordion>
</AccordionGroup>

빠른 개념 모델(그룹 메시지 평가 순서):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`(open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    그룹 허용 목록(`*.groups`, `*.groupAllowFrom`, 채널별 허용 목록).
  </Step>
  <Step title="Mention gating">
    멘션 게이팅(`requireMention`, `/activation`).
  </Step>
</Steps>

## 멘션 게이팅(기본값)

그룹 메시지는 그룹별로 재정의하지 않는 한 멘션이 필요합니다. 기본값은 `*.groups."*"` 아래의 하위 시스템별로 있습니다.

채널이 답장 메타데이터를 지원하는 경우, 봇 메시지에 답장하면 암시적 멘션으로 간주됩니다. 인용 메타데이터를 노출하는 채널에서는 봇 메시지 인용도 암시적 멘션으로 간주될 수 있습니다. 현재 기본 제공 사례에는 Telegram, WhatsApp, Slack, Discord, Microsoft Teams, ZaloUser가 포함됩니다.

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

## 구성된 멘션 패턴 범위 지정

구성된 `mentionPatterns`는 정규식 폴백 트리거입니다. 플랫폼이 네이티브 봇 멘션을 노출하지 않거나, `openclaw:` 같은 일반 텍스트를 멘션으로 간주하려는 경우 사용합니다. 네이티브 플랫폼 멘션은 별개입니다. Discord, Slack, Telegram, Matrix 또는 다른 채널이 메시지가 봇을 명시적으로 멘션했음을 증명할 수 있으면, 구성된 정규식 패턴이 거부되더라도 해당 네이티브 멘션은 계속 트리거됩니다.

기본적으로 구성된 멘션 패턴은 해당 채널이 제공자와 대화 정보를 멘션 감지에 전달하는 모든 위치에 적용됩니다. 광범위한 패턴이 모든 그룹에서 에이전트를 깨우지 않게 하려면 `channels.<channel>.mentionPatterns`로 채널별 범위를 지정합니다.

채널에서 정규식 멘션 패턴을 기본적으로 끄고 특정 룸에서 `allowIn`으로 다시 선택하려면 `mode: "deny"`를 사용합니다.

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

정규식 멘션 패턴을 넓게 적용한 뒤 시끄러운 룸에서 `denyIn`으로 끄려면 기본 `mode: "allow"`를 사용하거나 `mode`를 생략합니다.

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

정책 해석:

| 필드            | 효과                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | 대화 ID가 `denyIn`에 없으면 정규식 멘션 패턴이 활성화됩니다. 이것이 기본값입니다.                                    |
| `mode: "deny"`  | 대화 ID가 `allowIn`에 없으면 정규식 멘션 패턴이 비활성화됩니다.                                                       |
| `allowIn`       | 거부 모드에서 정규식 멘션 패턴이 활성화되는 대화 ID입니다.                                                            |
| `denyIn`        | 정규식 멘션 패턴이 비활성화되는 대화 ID입니다. 같은 ID가 둘 다에 포함되면 `denyIn`이 `allowIn`보다 우선합니다.       |

현재 지원되는 범위 지정 정규식 정책:

| 채널     | `allowIn` / `denyIn`에서 사용되는 ID                            |
| -------- | --------------------------------------------------------------- |
| Discord  | Discord 채널 ID.                                                |
| Matrix   | Matrix 룸 ID.                                                   |
| Slack    | Slack 채널 ID.                                                  |
| Telegram | 포럼 주제의 경우 그룹 채팅 ID 또는 `chatId:topic:threadId`.     |
| WhatsApp | `123@g.us` 같은 WhatsApp 대화 ID.                               |

채널이 여러 계정을 지원하는 경우 계정 수준 채널 구성은 `channels.<channel>.accounts.<accountId>.mentionPatterns` 아래에 동일한 정책을 설정할 수 있습니다. 해당 계정에서는 계정 정책이 최상위 채널 정책보다 우선합니다.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns`는 대소문자를 구분하지 않는 안전한 정규식 패턴입니다. 잘못된 패턴과 안전하지 않은 중첩 반복 형태는 무시됩니다.
    - 명시적 멘션을 제공하는 표면은 계속 통과합니다. 구성된 정규식 패턴은 폴백입니다.
    - `channels.<channel>.mentionPatterns.mode: "deny"`는 해당 채널에서 구성된 멘션 패턴을 기본적으로 비활성화합니다. 선택한 대화는 `allowIn`으로 다시 활성화합니다.
    - `channels.<channel>.mentionPatterns.denyIn`은 특정 대화 ID에서 구성된 멘션 패턴을 비활성화하지만, 네이티브 플랫폼 @멘션은 계속 통과합니다.
    - 에이전트별 재정의: `agents.list[].groupChat.mentionPatterns`(여러 에이전트가 그룹을 공유할 때 유용).
    - 멘션 게이팅은 멘션 감지가 가능한 경우에만 적용됩니다(네이티브 멘션 또는 `mentionPatterns`가 구성됨).
    - 그룹이나 보낸 사람을 허용 목록에 추가해도 멘션 게이팅은 비활성화되지 않습니다. 모든 메시지가 트리거되어야 하는 경우 해당 그룹의 `requireMention`을 `false`로 설정합니다.
    - 자동 그룹 채팅 프롬프트 컨텍스트는 매 턴 해석된 무음 답장 지침을 전달합니다. 워크스페이스 파일은 `NO_REPLY` 메커니즘을 중복해서는 안 됩니다.
    - 자동 무음 답장이 허용된 그룹은 깨끗한 빈 모델 턴 또는 추론 전용 모델 턴을 `NO_REPLY`와 동등한 무음으로 처리합니다. 직접 채팅은 `NO_REPLY` 지침을 받지 않으며, 메시지 도구만 사용하는 그룹 답장은 `message(action=send)`를 호출하지 않아 조용히 유지됩니다.
    - 항상 켜져 있는 주변 그룹 대화는 기본적으로 사용자 요청 의미를 사용합니다. 대신 조용한 컨텍스트로 제출하려면 `messages.groupChat.unmentionedInbound: "room_event"`를 설정합니다. 설정 예시는 [주변 룸 이벤트](/ko/channels/ambient-room-events)를 참조하세요.
    - 룸 이벤트는 가짜 사용자 요청으로 저장되지 않으며, 메시지 도구가 없는 룸 이벤트의 비공개 어시스턴트 텍스트는 채팅 기록으로 재생되지 않습니다.
    - Discord 기본값은 `channels.discord.guilds."*"`에 있습니다(길드/채널별 재정의 가능).
    - 그룹 기록 컨텍스트는 채널 전체에서 일관되게 래핑됩니다. 멘션 게이팅이 적용된 그룹은 보류 중인 건너뛴 메시지를 유지합니다. 항상 켜져 있는 그룹도 채널이 지원하는 경우 최근 처리된 룸 메시지를 유지할 수 있습니다. 전역 기본값에는 `messages.groupChat.historyLimit`을 사용하고, 재정의에는 `channels.<channel>.historyLimit` 또는 `channels.<channel>.accounts.*.historyLimit`을 사용합니다. 비활성화하려면 `0`으로 설정합니다.

  </Accordion>
</AccordionGroup>

## 그룹/채널 도구 제한(선택 사항)

일부 채널 구성은 **특정 그룹/룸/채널 내부에서** 사용할 수 있는 도구를 제한하도록 지원합니다.

- `tools`: 전체 그룹에 대한 도구 허용/거부.
- `toolsBySender`: 그룹 내 보낸 사람별 재정의. 명시적 키 접두사를 사용합니다: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>`, 및 `"*"` 와일드카드. 채널 ID는 표준 OpenClaw 채널 ID를 사용합니다. `teams` 같은 별칭은 `msteams`로 정규화됩니다. 레거시 접두사 없는 키도 계속 허용되며 `id:`로만 일치됩니다.

해석 순서(가장 구체적인 항목이 우선):

<Steps>
  <Step title="Group toolsBySender">
    그룹/채널 `toolsBySender` 일치.
  </Step>
  <Step title="Group tools">
    그룹/채널 `tools`.
  </Step>
  <Step title="Default toolsBySender">
    기본(`"*"`) `toolsBySender` 일치.
  </Step>
  <Step title="Default tools">
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
그룹/채널 도구 제한은 전역/에이전트 도구 정책에 추가로 적용됩니다(거부는 계속 우선합니다). 일부 채널은 룸/채널에 다른 중첩 구조를 사용합니다(예: Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## 그룹 허용 목록

`channels.whatsapp.groups`, `channels.telegram.groups` 또는 `channels.imessage.groups`가 구성되면 키는 그룹 허용 목록으로 작동합니다. 모든 그룹을 허용하면서 기본 멘션 동작을 계속 설정하려면 `"*"`를 사용합니다.

<Warning>
흔한 혼동: DM 페어링 승인은 그룹 권한 부여와 다릅니다. DM 페어링을 지원하는 채널에서 페어링 저장소는 DM만 잠금 해제합니다. 그룹 명령은 여전히 `groupAllowFrom` 같은 설정 허용 목록이나 해당 채널에 문서화된 설정 폴백을 통한 명시적인 그룹 발신자 권한 부여가 필요합니다.
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
  <Tab title="모든 그룹을 허용하되 멘션 필요">
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

소유자는 `channels.whatsapp.allowFrom`으로 결정됩니다(설정되지 않은 경우 봇 자신의 E.164). 명령을 독립 메시지로 보내세요. 현재 다른 표면은 `/activation`을 무시합니다.

## 컨텍스트 필드

그룹 인바운드 페이로드는 다음을 설정합니다.

- `ChatType=group`
- `GroupSubject`(알려진 경우)
- `GroupMembers`(알려진 경우)
- `WasMentioned`(멘션 게이팅 결과)
- Telegram 포럼 주제에는 `MessageThreadId`와 `IsForum`도 포함됩니다.

에이전트 시스템 프롬프트는 새 그룹 세션의 첫 번째 턴에 그룹 소개를 포함합니다. 이는 모델에게 사람처럼 응답하고, 빈 줄을 최소화하며 일반 채팅 간격을 따르고, 리터럴 `\n` 시퀀스를 입력하지 말라고 상기시킵니다. Telegram이 아닌 그룹에서는 Markdown 표도 권장하지 않습니다. Telegram 리치 텍스트 지침은 Telegram 채널 프롬프트에서 제공됩니다. 채널에서 제공된 그룹 이름과 참가자 레이블은 인라인 시스템 지침이 아니라 펜스 처리된 신뢰할 수 없는 메타데이터로 렌더링됩니다.

## iMessage 세부 사항

- 라우팅하거나 허용 목록에 추가할 때는 `chat_id:<id>`를 선호하세요.
- 채팅 목록: `imsg chats --limit 20`.
- 그룹 답장은 항상 동일한 `chat_id`로 돌아갑니다.

## WhatsApp 시스템 프롬프트

그룹 및 직접 프롬프트 해결, 와일드카드 동작, 계정 재정의 의미 체계를 포함한 표준 WhatsApp 시스템 프롬프트 규칙은 [WhatsApp](/ko/channels/whatsapp#system-prompts)을 참조하세요.

## WhatsApp 세부 사항

WhatsApp 전용 동작(기록 삽입, 멘션 처리 세부 사항)은 [그룹 메시지](/ko/channels/group-messages)를 참조하세요.

## 관련 항목

- [브로드캐스트 그룹](/ko/channels/broadcast-groups)
- [채널 라우팅](/ko/channels/channel-routing)
- [그룹 메시지](/ko/channels/group-messages)
- [페어링](/ko/channels/pairing)
