---
read_when:
    - 채팅 명령 사용 또는 구성
    - OpenClaw 명령 라우팅 또는 권한 디버깅
    - Skills 명령이 등록되는 방식 이해하기
sidebarTitle: Slash commands
summary: 사용 가능한 모든 슬래시 명령어, 지시문, 인라인 단축키 — 구성, 라우팅, 표면별 동작.
title: 슬래시 명령어
x-i18n:
    generated_at: "2026-07-01T20:17:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f9b74740baad038d667ccb8d80fc46af686111785b585ea1cb8cde13f41d98f
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway는 `/`로 시작하는 독립 메시지로 전송된 명령을 처리합니다.
호스트 전용 bash 명령은 `! <cmd>`를 사용합니다(`/bash <cmd>`는 별칭).

대화가 ACP 세션에 바인딩되어 있으면 일반 텍스트는 ACP 하네스로 라우팅됩니다. Gateway 관리 명령은 로컬에 남습니다. `/acp ...`는 항상 OpenClaw 명령 핸들러에 도달하며, 표면에서 명령 처리가 활성화된 경우 `/status`와 `/unfocus`도 로컬에 남습니다.

## 세 가지 명령 유형

<CardGroup cols={3}>
  <Card title="명령" icon="terminal">
    Gateway가 처리하는 독립 `/...` 메시지입니다. 메시지의 유일한 내용으로 전송해야 합니다.
  </Card>
  <Card title="지시문" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — 모델이 보기 전에 메시지에서 제거됩니다.
    단독으로 전송되면 세션 설정을 유지하고, 다른 텍스트와 함께 전송되면
    인라인 힌트로 작동합니다.
  </Card>
  <Card title="인라인 바로 가기" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — 즉시 실행되며 모델이 남은
    텍스트를 보기 전에 제거됩니다. 승인된 발신자만 사용할 수 있습니다.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="지시문 동작 세부 정보">
    - 지시문은 모델이 보기 전에 메시지에서 제거됩니다.
    - **지시문 전용** 메시지(메시지가 지시문만 포함)에서는 세션에
      유지되고 확인 응답을 반환합니다.
    - 다른 텍스트가 있는 **일반 채팅** 메시지에서는 인라인 힌트로 작동하며
      세션 설정을 유지하지 **않습니다**.
    - 지시문은 **승인된 발신자**에게만 적용됩니다. `commands.allowFrom`이
      설정되어 있으면 이것이 사용되는 유일한 허용 목록입니다. 그렇지 않으면
      권한 부여는 채널 허용 목록/페어링과 `commands.useAccessGroups`에서
      옵니다. 승인되지 않은 발신자에게는 지시문이 일반 텍스트로 처리됩니다.
  </Accordion>
</AccordionGroup>

## 구성

```json5
{
  commands: {
    native: "auto",
    nativeSkills: "auto",
    text: true,
    bash: false,
    bashForegroundMs: 2000,
    config: false,
    mcp: false,
    plugins: false,
    debug: false,
    restart: true,
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw",
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<ParamField path="commands.text" type="boolean" default="true">
  채팅 메시지에서 `/...` 파싱을 활성화합니다. 네이티브 명령이 없는 표면
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams)에서는
  `false`로 설정되어 있어도 텍스트 명령이 작동합니다.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  네이티브 명령을 등록합니다. 자동: Discord/Telegram에서는 켜짐, Slack에서는 꺼짐,
  네이티브 지원이 없는 공급자에서는 무시됩니다. 채널별로
  `channels.<provider>.commands.native`로 재정의합니다. Discord에서 `false`는
  슬래시 명령 등록을 건너뜁니다. 이전에 등록된 명령은 제거될 때까지 계속
  표시될 수 있습니다.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  지원되는 경우 skill 명령을 네이티브로 등록합니다. 자동: Discord/Telegram에서는
  켜짐, Slack에서는 꺼짐. `channels.<provider>.commands.nativeSkills`로 재정의합니다.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>`로 호스트 셸 명령을 실행할 수 있게 합니다(`/bash <cmd>` 별칭).
  `tools.elevated` 허용 목록이 필요합니다.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash가 백그라운드 모드로 전환하기 전에 기다리는 시간입니다(`0`은 즉시
  백그라운드로 전환).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기). 소유자 전용입니다.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp`를 활성화합니다(`mcp.servers` 아래의 OpenClaw 관리 MCP 구성 읽기/쓰기). 소유자 전용입니다.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins`를 활성화합니다(Plugin 검색/상태 및 설치 + 활성화/비활성화). 쓰기는 소유자 전용입니다.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug`를 활성화합니다(런타임 전용 구성 재정의). 소유자 전용입니다.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` 및 gateway 재시작 도구 작업을 활성화합니다.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  소유자 전용 명령 표면을 위한 명시적 소유자 허용 목록입니다.
  `commands.allowFrom` 및 DM 페어링 액세스와 별개입니다.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  채널별: 소유자 전용 명령에 소유자 ID를 요구합니다. `true`이면 발신자는
  `commands.ownerAllowFrom`과 일치하거나 내부 `operator.admin` 범위를 보유해야
  합니다. 와일드카드 `allowFrom` 항목만으로는 충분하지 **않습니다**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  시스템 프롬프트에 소유자 ID가 표시되는 방식을 제어합니다.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"`일 때 사용되는 HMAC 비밀입니다.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  명령 권한 부여를 위한 공급자별 허용 목록입니다. 구성되면 명령과 지시문에
  대한 **유일한** 권한 부여 소스입니다. 전역 기본값에는 `"*"`를 사용하고,
  공급자별 키는 이를 재정의합니다.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom`이 설정되지 않은 경우 명령에 대한 허용 목록/정책을 적용합니다.
</ParamField>

## 명령 목록

명령은 세 가지 소스에서 옵니다.

- **코어 기본 제공:** `src/auto-reply/commands-registry.shared.ts`
- **생성된 dock 명령:** `src/auto-reply/commands-registry.data.ts`
- **Plugin 명령:** plugin `registerCommand()` 호출

사용 가능 여부는 구성 플래그, 채널 표면, 설치/활성화된
plugins에 따라 달라집니다.

### 코어 명령

<AccordionGroup>
  <Accordion title="세션 및 실행">
    | 명령 | 설명 |
    | --- | --- |
    | `/new [model]` | 현재 세션을 보관하고 새 세션을 시작합니다 |
    | `/reset [soft [message]]` | 현재 세션을 제자리에서 재설정합니다. `soft`는 transcript를 유지하고, 재사용된 CLI 백엔드 세션 ID를 삭제하며, 시작을 다시 실행합니다 |
    | `/name <title>` | 현재 세션의 이름을 지정하거나 변경합니다. 제목을 생략하면 현재 이름과 제안을 표시합니다 |
    | `/compact [instructions]` | 세션 컨텍스트를 압축합니다. [Compaction](/ko/concepts/compaction)을 참조하세요 |
    | `/stop` | 현재 실행을 중단합니다 |
    | `/session idle <duration\|off>` | 스레드 바인딩 유휴 만료를 관리합니다 |
    | `/session max-age <duration\|off>` | 스레드 바인딩 최대 수명 만료를 관리합니다 |
    | `/export-session [path]` | 현재 세션을 HTML로 내보냅니다. 별칭: `/export` |
    | `/export-trajectory [path]` | 현재 세션의 JSONL trajectory 번들을 내보냅니다. 별칭: `/trajectory` |

    <Note>
      Control UI는 입력된 `/new`를 가로채 새 dashboard 세션을 만들고 전환합니다.
      단, `session.dmScope: "main"`이 구성되어 있고 현재 부모가 에이전트의
      main 세션인 경우에는 `/new`가 main 세션을 제자리에서 재설정합니다.
      입력된 `/reset`은 여전히 Gateway의 제자리 재설정을 실행합니다. 고정된
      세션 모델 선택을 지우려면 `/model default`를 사용하세요.
    </Note>

  </Accordion>

  <Accordion title="모델 및 실행 제어">
    | 명령 | 설명 |
    | --- | --- |
    | `/think <level\|default>` | 사고 수준을 설정하거나 세션 재정의를 지웁니다. 별칭: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | 자세한 출력 표시를 전환합니다. 별칭: `/v` |
    | `/trace on\|off` | 현재 세션에 대한 plugin trace 출력을 전환합니다 |
    | `/fast [status\|auto\|on\|off\|default]` | 빠른 모드를 표시, 설정 또는 지웁니다 |
    | `/reasoning [on\|off\|stream]` | 추론 표시 여부를 전환합니다. 별칭: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | elevated 모드를 전환합니다. 별칭: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec 기본값을 표시하거나 설정합니다 |
    | `/login [codex\|openai\|openai-codex]` | 비공개 채팅 또는 Web UI 세션에서 Codex/OpenAI 로그인을 페어링합니다. 소유자/관리자 전용 |
    | `/model [name\|#\|status]` | 모델을 표시하거나 설정합니다 |
    | `/models [provider] [page] [limit=<n>\|all]` | 구성되었거나 인증 사용 가능한 공급자 또는 모델을 나열합니다 |
    | `/queue <mode>` | 활성 실행 대기열 동작을 관리합니다. [Queue](/ko/concepts/queue) 및 [Queue 조정](/ko/concepts/queue-steering)을 참조하세요 |
    | `/steer <message>` | 활성 실행에 지침을 주입합니다. 별칭: `/tell`. [Steer](/ko/tools/steer)를 참조하세요 |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning 안전성">
        - `/verbose`는 디버깅용입니다. 일반 사용에서는 **꺼진** 상태로 두세요.
        - `/trace`는 plugin 소유 trace/debug 줄만 드러내며, 일반적인 자세한 대화는 꺼진 상태로 유지됩니다.
        - `/fast auto|on|off`는 세션 재정의를 유지합니다. 이를 지우려면 Sessions UI `inherit` 옵션을 사용하세요.
        - `/fast`는 공급자별입니다. OpenAI/Codex는 이를 `service_tier=priority`에 매핑하고, 직접 Anthropic 요청은 `service_tier=auto` 또는 `standard_only`에 매핑합니다.
        - `/reasoning`, `/verbose`, `/trace`는 그룹 환경에서 위험합니다. 내부 추론 또는 plugin 진단 정보를 드러낼 수 있습니다. 그룹 채팅에서는 꺼진 상태로 두세요.

      </Accordion>
      <Accordion title="모델 전환 세부 정보">
        - `/model`은 새 모델을 즉시 세션에 유지합니다.
        - 에이전트가 유휴 상태이면 다음 실행에서 바로 사용합니다.
        - 실행이 활성 상태이면 전환이 보류로 표시되고 다음 깔끔한 재시도 지점에서 적용됩니다.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="검색 및 상태">
    | 명령 | 설명 |
    | --- | --- |
    | `/help` | 짧은 도움말 요약을 표시합니다 |
    | `/commands` | 생성된 명령 카탈로그를 표시합니다 |
    | `/tools [compact\|verbose]` | 현재 에이전트가 지금 사용할 수 있는 항목을 표시합니다 |
    | `/status` | 실행/런타임 상태, Gateway 및 시스템 uptime, plugin health, 공급자 사용량/할당량을 표시합니다 |
    | `/status plugins` | 자세한 plugin health를 표시합니다: 로드 오류, quarantines, 채널 실패, dependency 문제, compatibility notices |
    | `/goal [status\|start\|pause\|resume\|complete\|block\|clear] ...` | 현재 세션의 지속 [goal](/ko/tools/goal)을 관리합니다 |
    | `/diagnostics [note]` | 소유자 전용 지원 보고서 흐름입니다. 매번 exec 승인을 요청합니다 |
    | `/crestodian <request>` | 소유자 DM에서 Crestodian 설정 및 복구 도우미를 실행합니다 |
    | `/tasks` | 현재 세션의 활성/최근 백그라운드 task를 나열합니다 |
    | `/context [list\|detail\|map\|json]` | 컨텍스트가 조립되는 방식을 설명합니다 |
    | `/whoami` | 발신자 ID를 표시합니다. 별칭: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 응답별 사용량 footer를 제어합니다(`reset`/`inherit`/`clear`/`default`는 세션 재정의를 지워 구성된 기본값을 다시 상속함) 또는 로컬 비용 요약을 출력합니다 |
  </Accordion>

  <Accordion title="Skills, 허용 목록, 승인">
    | 명령 | 설명 |
    | --- | --- |
    | `/skill <name> [input]` | 이름으로 skill을 실행합니다 |
    | `/allowlist [list\|add\|remove] ...` | 허용 목록 항목을 관리합니다. 텍스트 전용 |
    | `/approve <id> <decision>` | exec 또는 plugin 승인 프롬프트를 해결합니다 |
    | `/btw <question>` | 세션 컨텍스트를 변경하지 않고 부가 질문을 합니다. 별칭: `/side`. [BTW](/ko/tools/btw)을 참조하세요 |
  </Accordion>

  <Accordion title="Subagents and ACP">
    | 명령 | 설명 |
    | --- | --- |
    | `/subagents list\|log\|info` | 현재 세션의 하위 에이전트 실행을 검사합니다 |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP 세션과 런타임 옵션을 관리합니다. 런타임 제어에는 외부 소유자 또는 내부 Gateway 관리자 ID가 필요합니다 |
    | `/focus <target>` | 현재 Discord 스레드 또는 Telegram 토픽을 세션 대상에 바인딩합니다 |
    | `/unfocus` | 현재 스레드 바인딩을 제거합니다 |
    | `/agents` | 현재 세션의 스레드 바인딩 에이전트를 나열합니다 |
  </Accordion>

  <Accordion title="Owner-only writes and admin">
    | 명령 | 필요 항목 | 설명 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json`을 읽거나 씁니다. 소유자 전용 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw가 관리하는 MCP 서버 구성을 읽거나 씁니다. 소유자 전용 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin 상태를 검사하거나 변경합니다. 쓰기는 소유자 전용입니다. 별칭: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | 런타임 전용 구성 재정의입니다. 소유자 전용 |
    | `/restart` | `commands.restart: true` (기본값) | OpenClaw를 다시 시작합니다 |
    | `/send on\|off\|inherit` | 소유자 | 전송 정책을 설정합니다 |
  </Accordion>

  <Accordion title="Voice, TTS, channel control">
    | 명령 | 설명 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS를 제어합니다. [TTS](/ko/tools/tts)를 참조하세요 |
    | `/activation mention\|always` | 그룹 활성화 모드를 설정합니다 |
    | `/bash <command>` | 호스트 셸 명령을 실행합니다. 별칭: `! <command>`. `commands.bash: true`가 필요합니다 |
    | `!poll [sessionId]` | 백그라운드 bash 작업을 확인합니다 |
    | `!stop [sessionId]` | 백그라운드 bash 작업을 중지합니다 |
  </Accordion>
</AccordionGroup>

### 도킹 명령

도킹 명령은 활성 세션의 응답 경로를 연결된 다른 채널로 전환합니다.
설정 및 문제 해결은 [채널 도킹](/ko/concepts/channel-docking)을 참조하세요.

네이티브 명령 지원이 있는 채널 Plugin에서 생성됨:

- `/dock-discord` (별칭: `/dock_discord`)
- `/dock-mattermost` (별칭: `/dock_mattermost`)
- `/dock-slack` (별칭: `/dock_slack`)
- `/dock-telegram` (별칭: `/dock_telegram`)

도킹 명령에는 `session.identityLinks`가 필요합니다. 소스 발신자와 대상 피어는
같은 ID 그룹에 있어야 합니다.

### 번들 Plugin 명령

| 명령                                                                                         | 설명                                                                                      |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                                                          | 메모리 Dreaming을 켜거나 끕니다(소유자 또는 Gateway 관리자). [Dreaming](/ko/concepts/dreaming)을 참조하세요 |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]`                                      | 기기 페어링을 관리합니다. [페어링](/ko/channels/pairing)을 참조하세요                         |
| `/phone status\|arm ...\|disarm`                                                             | 고위험 전화 노드 명령을 일시적으로 준비 상태로 전환합니다                                  |
| `/voice status\|list\|set <voiceId>`                                                         | Talk 음성 구성을 관리합니다. Discord 네이티브 이름: `/talkvoice`                           |
| `/card ...`                                                                                  | LINE 리치 카드 프리셋을 보냅니다. [LINE](/ko/channels/line)을 참조하세요                      |
| `/codex status\|models\|threads\|resume\|compact\|review\|diagnostics\|account\|mcp\|skills` | Codex 앱 서버 하네스를 제어합니다. [Codex 하네스](/ko/plugins/codex-harness)를 참조하세요     |

QQBot 전용: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill 명령

사용자가 호출할 수 있는 Skills는 슬래시 명령으로 노출됩니다:

- `/skill <name> [input]`은 항상 일반 진입점으로 작동합니다.
- Skills는 직접 명령으로 등록될 수 있습니다(예: OpenProse의 `/prose`).
- 네이티브 Skill 명령 등록은 `commands.nativeSkills` 및
  `channels.<provider>.commands.nativeSkills`로 제어됩니다.
- 이름은 `a-z0-9_`로 정리됩니다(최대 32자). 충돌이 발생하면 숫자 접미사가 붙습니다.

<AccordionGroup>
  <Accordion title="Skill command dispatch">
    기본적으로 Skill 명령은 일반 요청처럼 모델로 라우팅됩니다.

    Skills는 도구로 직접 라우팅하도록 `command-dispatch: tool`을 선언할 수 있습니다
    (결정적이며, 모델이 관여하지 않음). 예: `/prose`(OpenProse Plugin)
    — [OpenProse](/ko/prose)를 참조하세요.

  </Accordion>
  <Accordion title="Native command arguments">
    Discord는 필수 인수가 생략되면 동적 옵션과 버튼 메뉴에 자동 완성을 사용합니다.
    Telegram과 Slack은 선택지가 있는 명령에 버튼 메뉴를 표시합니다. 동적 선택지는 대상 세션 모델을 기준으로 해석되므로,
    `/think` 수준 같은 모델별 옵션은 세션의 `/model` 재정의를 따릅니다.
  </Accordion>
</AccordionGroup>

## `/tools` — 에이전트가 지금 사용할 수 있는 것

`/tools`는 런타임 질문에 답합니다: **이 대화에서 이 에이전트가 지금 사용할 수 있는 것은 무엇인가** — 정적 구성 카탈로그가 아닙니다.

```text
/tools         # compact view
/tools verbose # with short descriptions
```

결과는 세션 범위입니다. 에이전트, 채널, 스레드, 발신자
권한 부여 또는 모델을 변경하면 출력이 바뀔 수 있습니다. 프로필 및 재정의 편집에는
Control UI Tools 패널 또는 구성 표면을 사용하세요.

## `/model` — 모델 선택

```text
/model             # show model picker
/model list        # same
/model 3           # select by number from picker
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # clear the session model selection
/model status      # detailed view with endpoint and API mode
```

Discord에서 `/model`과 `/models`는 제공자 및
모델 드롭다운이 있는 대화형 선택기를 엽니다. 선택기는
`provider/*` 항목을 포함하여 `agents.defaults.models`를 존중합니다.

## `/config` — 디스크 구성 쓰기

<Note>
  소유자 전용. 기본적으로 비활성화되어 있습니다 — `commands.config: true`로 활성화하세요.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

구성은 쓰기 전에 검증됩니다. 잘못된 변경은 거부됩니다. `/config`
업데이트는 재시작 후에도 유지됩니다.

## `/mcp` — MCP 서버 구성

<Note>
  소유자 전용. 기본적으로 비활성화되어 있습니다 — `commands.mcp: true`로 활성화하세요.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp`는 구성을 임베디드 에이전트 프로젝트 설정이 아니라 OpenClaw 구성에 저장합니다.

## `/debug` — 런타임 전용 재정의

<Note>
  소유자 전용. 기본적으로 비활성화되어 있습니다 — `commands.debug: true`로 활성화하세요.
  재정의는 새 구성 읽기에 즉시 적용되지만 디스크에는 **쓰지 않습니다**.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins` — Plugin 관리

<Note>
  쓰기는 소유자 전용입니다. 기본적으로 비활성화되어 있습니다 — `commands.plugins: true`로 활성화하세요.
</Note>

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
/plugins install ./path/to/plugin
```

`/plugins enable|disable`은 Plugin 구성을 업데이트하고 새 에이전트 턴에 대해 Gateway
Plugin 런타임을 핫 리로드합니다. `/plugins install`은 Plugin 소스 모듈이 변경되었기 때문에 관리되는
Gateway를 자동으로 다시 시작합니다.

## `/trace` — Plugin 추적 출력

```text
/trace          # show current trace state
/trace on
/trace off
```

`/trace`는 전체 verbose 모드 없이 세션 범위 Plugin 추적/디버그 라인을 드러냅니다.
이는 `/debug`(런타임 재정의) 또는 `/verbose`(일반
도구 출력)를 대체하지 않습니다.

## `/btw` — 부가 질문

`/btw`는 현재 세션 컨텍스트에 대한 빠른 부가 질문입니다. 별칭: `/side`.

```text
/btw what are we doing right now?
/side what changed while the main run continued?
```

일반 메시지와 달리:

- 현재 세션을 배경 컨텍스트로 사용합니다.
- Codex 하네스 세션에서는 임시 Codex 사이드 스레드로 실행됩니다.
- 이후 세션 컨텍스트를 변경하지 **않습니다**.
- transcript 기록에 쓰이지 않습니다.

전체 동작은 [BTW 부가 질문](/ko/tools/btw)을 참조하세요.

## 표면 참고 사항

<AccordionGroup>
  <Accordion title="Session scoping per surface">
    - **텍스트 명령:** 일반 채팅 세션에서 실행됩니다(DM은 `main`을 공유하고, 그룹은 자체 세션을 가집니다).
    - **네이티브 Discord 명령:** `agent:<agentId>:discord:slash:<userId>`
    - **네이티브 Slack 명령:** `agent:<agentId>:slack:slash:<userId>`(`channels.slack.slashCommand.sessionPrefix`로 접두사 구성 가능)
    - **네이티브 Telegram 명령:** `telegram:slash:<userId>`(`CommandTargetSessionKey`를 통해 채팅 세션을 대상으로 지정)
    - **`/login codex`**는 기기 페어링 코드를 비공개 채팅 또는 Web UI 응답 경로로만 보냅니다. Telegram 그룹/토픽 호출은 대신 소유자에게 봇에 DM을 보내라고 요청합니다.
    - **`/stop`**은 현재 실행을 중단하기 위해 활성 채팅 세션을 대상으로 지정합니다.

  </Accordion>
  <Accordion title="Slack specifics">
    `channels.slack.slashCommand`는 단일 `/openclaw` 스타일 명령을 지원합니다.
    `commands.native: true`를 사용하면 내장 명령마다 Slack 슬래시 명령을 하나씩 만드세요.
    Slack이 `/status`를 예약하므로 `/agentstatus`(`/status`가 아님)를 등록하세요.
    텍스트 `/status`는 Slack 메시지에서 계속 작동합니다.
  </Accordion>
  <Accordion title="Fast path and inline shortcuts">
    - 허용 목록에 있는 발신자의 명령 전용 메시지는 즉시 처리됩니다(대기열 + 모델 우회).
    - 인라인 단축키(`/help`, `/commands`, `/status`, `/whoami`)도 일반 메시지 안에 포함되어 작동하며, 남은 텍스트를 모델이 보기 전에 제거됩니다.
    - 권한이 없는 명령 전용 메시지는 조용히 무시됩니다. 인라인 `/...` 토큰은 일반 텍스트로 처리됩니다.

  </Accordion>
  <Accordion title="Argument notes">
    - 명령은 명령과 인수 사이에 선택적 `:`를 허용합니다(`/think: high`, `/send: on`).
    - `/new <model>`은 모델 별칭, `provider/model` 또는 제공자 이름(퍼지 매칭)을 허용합니다. 일치하는 항목이 없으면 텍스트가 메시지 본문으로 처리됩니다.
    - `/allowlist add|remove`에는 `commands.config: true`가 필요하며 채널 `configWrites`를 존중합니다.

  </Accordion>
</AccordionGroup>

## 제공자 사용량 및 상태

- **제공자 사용량/할당량**(예: "Claude 80% left")은 사용량 추적이 활성화된 경우 현재 모델 제공자에 대해 `/status`에 표시됩니다.
- **토큰/캐시 라인**은 live 세션 스냅샷이 희소할 때 최신 transcript 사용량 항목으로 폴백할 수 있습니다.
- **실행 vs 런타임:** `/status`는 유효한 샌드박스 경로에 대해 `Execution`을, 세션을 실행하는 주체에 대해 `Runtime`을 보고합니다: `OpenClaw Default`, `OpenAI Codex`, CLI 백엔드 또는 ACP 백엔드.
- **응답별 토큰/비용:** `/usage off|tokens|full`로 제어됩니다.
- `/model status`는 사용량이 아니라 모델/인증/엔드포인트에 관한 것입니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Skills" href="/ko/tools/skills" icon="puzzle-piece">
    Skill 슬래시 명령이 등록되고 게이트되는 방식입니다.
  </Card>
  <Card title="Creating skills" href="/ko/tools/creating-skills" icon="hammer">
    자체 슬래시 명령을 등록하는 Skill을 빌드합니다.
  </Card>
  <Card title="BTW" href="/ko/tools/btw" icon="comments">
    세션 컨텍스트를 변경하지 않는 부가 질문입니다.
  </Card>
  <Card title="Steer" href="/ko/tools/steer" icon="compass">
    `/steer`로 실행 중인 에이전트를 안내합니다.
  </Card>
</CardGroup>
