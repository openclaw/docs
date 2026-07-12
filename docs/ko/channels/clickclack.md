---
read_when:
    - OpenClaw을 ClickClack 워크스페이스에 연결하기
    - ClickClack 봇 ID 테스트하기
summary: ClickClack 봇 토큰 채널 설정 및 대상 구문
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T14:57:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack은 일급 ClickClack 봇 토큰을 통해 OpenClaw를 자체 호스팅 ClickClack 워크스페이스에 연결합니다.

OpenClaw 에이전트를 ClickClack 봇 사용자로 표시하려는 경우 사용하십시오. ClickClack은 독립 서비스 봇과 사용자 소유 봇을 지원합니다. 사용자 소유 봇은 `owner_user_id`를 유지하며, 부여한 토큰 범위만 받습니다.

## 빠른 설정

ClickClack 서버에서 봇 토큰을 생성합니다.

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

사용자 소유 봇의 경우 `--owner <user_id>`를 추가합니다.

OpenClaw를 구성합니다.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

그런 다음 실행합니다.

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

계정은 `baseUrl`, `token`, `workspace`가 모두 설정된 경우에만 구성된 것으로 간주됩니다. `workspace`에는 워크스페이스 ID(`wsp_...`), 슬러그 또는 이름을 사용할 수 있으며, Gateway는 시작 시 이를 ID로 확인합니다.

### 계정 구성 키

| 키                      | 기본값              | 참고                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 없음(필수)          | ClickClack 서버 URL입니다.                                                              |
| `token`                 | 없음(필수)          | 일반 문자열 또는 비밀 참조(`source: "env" \| "file" \| "exec"`)입니다.                  |
| `workspace`             | 없음(필수)          | 워크스페이스 ID, 슬러그 또는 이름입니다.                                                |
| `replyMode`             | `"agent"`           | `"agent"`는 전체 에이전트 파이프라인을 실행하고, `"model"`은 짧은 직접 모델 완성을 전송합니다. |
| `defaultTo`             | `"channel:general"` | 아웃바운드 경로에 대상이 없을 때 사용하는 대상입니다.                                  |
| `allowFrom`             | `["*"]`             | 인바운드 DM 및 채널 메시지에 대한 사용자 ID 허용 목록입니다.                           |
| `botUserId`             | 자동 감지           | 시작 시 봇 토큰 ID에서 확인됩니다.                                                      |
| `agentId`               | 경로 기본값         | 이 계정의 인바운드 메시지를 하나의 에이전트에 고정합니다.                               |
| `toolsAllow`            | 없음                | 이 계정에서 보내는 에이전트 응답에 대한 도구 허용 목록입니다.                          |
| `model`, `systemPrompt` | 없음                | `replyMode: "model"` 완성에서 사용합니다.                                               |
| `reconnectMs`           | `1500`              | 실시간 재연결 지연 시간(100~60000)입니다.                                               |

`plugins.allow`가 비어 있지 않은 제한 목록인 경우, 채널 설정에서
ClickClack을 명시적으로 선택하거나 `openclaw plugins enable clickclack`을
실행하면 해당 목록에 `clickclack`이 추가됩니다. 온보딩 설치에도 동일한
명시적 선택 동작이 적용됩니다. 이러한 경로는 `plugins.deny` 또는 전역
`plugins.enabled: false` 설정을 재정의하지 않습니다. 직접
`openclaw plugins install @openclaw/clickclack`을 실행하면 일반적인
Plugin 설치 정책을 따르며 기존 허용 목록에도 ClickClack을 기록합니다.

## 여러 봇

각 계정은 자체 ClickClack 실시간 연결을 열고 자체 봇 토큰을 사용합니다.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## 응답 모드

- `replyMode: "agent"`(기본값)는 세션 기록 및 도구 정책을 포함하는 일반 에이전트 파이프라인을 통해 인바운드 메시지를 전달합니다.
- `replyMode: "model"`은 에이전트 파이프라인을 건너뛰고 Plugin 런타임의 `llm.complete`를 사용하여 짧은 직접 봇 응답을 생성합니다(`model` 및 `systemPrompt`를 사용하여 선택적으로 조정할 수 있음).

모델 모드는 확인된 봇 에이전트 ID에 대해 완성을 실행하므로 명시적인
`plugins.entries.clickclack.llm.allowAgentIdOverride: true` 신뢰
비트가 필요합니다.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

기본 `agent` 응답 모드만 사용하는 경우 신뢰 비트를 끈 상태로 유지하십시오.
이 모드에서는 필요하지 않습니다.

서비스 간 상관관계 증거에는 `agent` 모드를 사용하십시오. 표준
`msg_<ulid>` 형식의 권위 있는 ClickClack 메시지 ID에 대해 채널은
결정적 OpenClaw 실행 ID `clickclack:<message-id>`를 파생합니다. 이후 각 모델 호출은
진단에서 `clickclack:<message-id>:model:<n>`으로 표시되며, 해당
턴에서 ClawRouter를 사용하면 동일한 모델 호출 ID가 `X-Request-ID`로 전송됩니다.
`model` 모드는 일반 에이전트 실행/세션 진단을 우회하므로 이 증거
경로에 적합하지 않습니다.

실시간 이벤트에 검증된 `payload.correlation_id`가 포함된 경우 채널은
권위 있는 메시지를 가져오는 요청과 그에 따른 ClickClack 응답 요청에서 이를
`X-Correlation-ID`로 전달합니다. 값은 ClickClack의 안전한
128자 문자 집합(`A-Z`, `a-z`, `0-9`, `.`, `_`, `:`, `-`)을 사용하며, 유효하지 않은 값은
생략됩니다. 이러한 연결에는 식별자만 포함되며 메시지 본문,
프롬프트, 완성, 자격 증명 또는 도구 출력은 포함되지 않습니다.

## 에이전트 활동 행

기본적으로 ClickClack 채널은 에이전트 턴이 실행되는 동안 아무것도 표시하지 않으며 최종 응답만 게시됩니다. 턴이 진행되는 동안 영구적인 `agent_commentary` 및 `agent_tool` 메시지 행을 게시하려면 계정에 `agentActivity: true`를 설정하십시오.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

요구 사항 및 동작:

- **기본값은 꺼짐입니다.** 기본 설정과 이전 ClickClack 서버에는 영향을 주지 않습니다.
- **`agent_activity:write` 토큰 범위가 필요합니다.** 이 범위는 `bot:write`와 별개이며 여기에서 상속되지 않습니다. 옵션을 활성화하기 전에 `--scopes bot:write,agent_activity:write`로 봇 토큰을 생성하거나 기존 토큰에 해당 범위를 부여하십시오.
- **최선형 성능 저하.** 토큰에 `agent_activity:write`가 없거나 서버에서 활동 쓰기를 거부하면 실패가 기록되고 최종 응답은 여전히 정상적으로 전달되지만 활동 행은 표시되지 않습니다.
- 행은 턴별로(`turn_id`) 그룹화되고 하나의 논리적 단계가 하나의 행이 되도록 병합되며, 도구 행은 Discord/Slack/Telegram과 동일한 진행 상황 형식(도구 이름과 명령 세부 정보)을 사용합니다.
- **귀속 메타데이터.** 에이전트가 작성한 게시물(활동 행과 최종 응답)에는 턴에 실제로 사용된 모델에서 확인된 `author_model` 및 `author_thinking` 필드가 포함됩니다(대체 후 포함). 이러한 열을 정의하지 않은 서버는 알 수 없는 JSON 필드를 무시합니다. 이를 저장하는 서버는 메시지별로 "어떤 모델이 어떤 사고 수준에서 이 문장을 말했는가"에 답할 수 있습니다.

## 대상

- `channel:<name-or-id>`는 워크스페이스 채널로 전송합니다. 접두사가 없는 대상에는 기본적으로 `channel:`이 적용됩니다.
- `dm:<user_id>`는 해당 사용자와의 직접 대화를 만들거나 재사용합니다.
- `thread:<message_id>`는 해당 메시지를 루트로 하는 스레드에 응답합니다.

명시적인 아웃바운드 대상에는 `clickclack:` 또는 `cc:` 제공자 접두사를 사용할 수도 있습니다.

예:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 권한

ClickClack 토큰 범위는 ClickClack API에서 적용됩니다.

- `bot:read`: 워크스페이스/채널/메시지/스레드/DM/실시간/프로필 데이터를 읽습니다.
- `bot:write`: `bot:read`와 더불어 채널 메시지, 스레드 응답, DM 및 업로드를 허용합니다.
- `bot:admin`: `bot:write`와 더불어 채널 생성을 허용합니다.
- `agent_activity:write`: 영구적인 에이전트 활동 행(`agent_commentary`/`agent_tool`)을 허용합니다. `bot:write` 또는 `bot:admin`에서 상속되지 않으며 `agentActivity: true`를 설정한 경우에만 필요합니다.

OpenClaw의 일반 에이전트 채팅에는 `bot:write`만 필요합니다. [에이전트 활동 행](#agent-activity-rows)을 활성화할 때 `agent_activity:write`를 추가하십시오.

## 문제 해결

- `ClickClack is not configured for account "<id>"`: 해당 계정에 `baseUrl`, `token`(예: `CLICKCLACK_BOT_TOKEN` 사용) 및 `workspace`를 설정하십시오.
- `ClickClack workspace not found: <value>`: `workspace`를 ClickClack에서 반환한 워크스페이스 ID, 슬러그 또는 이름으로 설정하십시오.
- 인바운드 응답이 없음: 토큰에 실시간 읽기 권한이 있는지 확인하고, 봇은 자신의 메시지와 다른 봇의 메시지를 무시한다는 점에 유의하십시오.
- 채널 전송 실패: 봇이 워크스페이스의 구성원이며 `bot:write` 권한이 있는지 확인하십시오.
