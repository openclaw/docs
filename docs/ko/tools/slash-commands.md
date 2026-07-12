---
read_when:
    - 채팅 명령 사용 또는 구성
    - 명령 라우팅 또는 권한 디버깅
    - Skills 명령이 등록되는 방식 이해하기
sidebarTitle: Slash commands
summary: 사용 가능한 모든 슬래시 명령어, 지시문 및 인라인 단축키 — 구성, 라우팅 및 화면별 동작.
title: 슬래시 명령어
x-i18n:
    generated_at: "2026-07-12T15:50:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0017f229610ff5b1f4ff4a11a77814575835cfd07c7d4dbcce8b0d51ed4f4dd1
    source_path: tools/slash-commands.md
    workflow: 16
---

Gateway는 `/`로 시작하는 독립형 메시지로 전송된 명령을 처리합니다.
호스트 전용 bash 명령은 `! <cmd>`를 사용합니다(`/bash <cmd>`는 별칭입니다).

대화가 ACP 세션에 바인딩된 경우 일반 텍스트는 ACP
하네스로 라우팅됩니다. Gateway 관리 명령은 로컬에서 유지됩니다. `/acp ...`는 항상
OpenClaw 명령 핸들러에 전달되며, 해당 화면에서 명령 처리가 활성화되어 있으면
`/status`와 `/unfocus`도 로컬에서 유지됩니다.

## 세 가지 명령 유형

<CardGroup cols={3}>
  <Card title="명령" icon="terminal">
    Gateway가 처리하는 독립형 `/...` 메시지입니다. 메시지의
    유일한 콘텐츠로 전송해야 합니다.
  </Card>
  <Card title="지시어" icon="sliders">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`,
    `/exec`, `/model`, `/queue` — 모델이 메시지를 보기 전에 제거됩니다.
    단독으로 전송하면 세션 설정을 유지하고, 다른 텍스트와 함께 전송하면
    인라인 힌트로 작동합니다.
  </Card>
  <Card title="인라인 단축 명령" icon="bolt">
    `/help`, `/commands`, `/status`, `/whoami` — 즉시 실행되며 모델이
    나머지 텍스트를 보기 전에 제거됩니다. 승인된 발신자만 사용할 수 있습니다.
  </Card>
</CardGroup>

<AccordionGroup>
  <Accordion title="지시어 동작 세부 정보">
    - 지시어는 모델이 메시지를 보기 전에 제거됩니다.
    - **지시어 전용** 메시지(메시지가 지시어로만 구성된 경우)에서는 지시어가
      세션에 유지되고 확인 응답을 반환합니다.
    - 다른 텍스트가 포함된 **일반 채팅** 메시지에서는 인라인 힌트로 작동하며
      세션 설정을 유지하지 **않습니다**.
    - 지시어는 **승인된 발신자**에게만 적용됩니다. `commands.allowFrom`이
      설정되어 있으면 해당 허용 목록만 사용하고, 그렇지 않으면 채널 허용 목록/페어링과
      `commands.useAccessGroups`를 통해 권한을 확인합니다. 승인되지 않은
      발신자의 지시어는 일반 텍스트로 처리됩니다.
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
  채팅 메시지에서 `/...` 구문 분석을 활성화합니다. 네이티브 명령이 없는 화면
  (WhatsApp, WebChat, Signal, iMessage, Google Chat, Microsoft Teams)에서는
  `false`로 설정해도 텍스트 명령이 작동합니다.
</ParamField>

<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  네이티브 명령을 등록합니다. 자동: Discord/Telegram에서는 활성화되고 Slack에서는
  비활성화되며, 네이티브 지원이 없는 제공자에서는 무시됩니다. 채널별로
  `channels.<provider>.commands.native`를 사용하여 재정의할 수 있습니다. Discord에서
  `false`이면 슬래시 명령 등록을 건너뛰지만, 이전에 등록된 명령은 삭제될 때까지
  계속 표시될 수 있습니다.
</ParamField>

<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  지원되는 경우 Skills 명령을 네이티브로 등록합니다. 자동: Discord/Telegram에서는
  활성화되고 Slack에서는 비활성화됩니다.
  `channels.<provider>.commands.nativeSkills`로 재정의할 수 있습니다.
</ParamField>

<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>`로 호스트 셸 명령을 실행할 수 있게 합니다(`/bash <cmd>` 별칭).
  `tools.elevated` 허용 목록이 필요합니다.
</ParamField>

<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash가 백그라운드 모드로 전환되기 전에 대기하는 시간입니다(`0`이면
  즉시 백그라운드로 전환됩니다).
</ParamField>

<ParamField path="commands.config" type="boolean" default="false">
  `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기). 소유자 전용입니다.
</ParamField>

<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp`를 활성화합니다(`mcp.servers` 아래의 OpenClaw 관리 MCP 구성을 읽고 씁니다). 소유자 전용입니다.
</ParamField>

<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins`를 활성화합니다(Plugin 검색/상태 및 설치 + 활성화/비활성화). 쓰기는 소유자 전용입니다.
</ParamField>

<ParamField path="commands.debug" type="boolean" default="false">
  `/debug`를 활성화합니다(런타임 전용 구성 재정의). 소유자 전용입니다.
</ParamField>

<ParamField path="commands.restart" type="boolean" default="true">
  `/restart` 및 Gateway 재시작 도구 작업을 활성화합니다.
</ParamField>

<ParamField path="commands.ownerAllowFrom" type="string[]">
  소유자 전용 명령 화면에 대한 명시적 소유자 허용 목록입니다.
  `commands.allowFrom` 및 DM 페어링 액세스와는 별개입니다.
</ParamField>

<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  채널별 설정으로, 소유자 전용 명령에 소유자 ID를 요구합니다. `true`이면
  발신자가 `commands.ownerAllowFrom`과 일치하거나 내부 `operator.admin`
  범위를 보유해야 합니다. 와일드카드 `allowFrom` 항목만으로는 **충분하지 않습니다**.
</ParamField>

<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  시스템 프롬프트에 소유자 ID가 표시되는 방식을 제어합니다.
</ParamField>

<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay: "hash"`일 때 사용하는 HMAC 비밀 값입니다.
</ParamField>

<ParamField path="commands.allowFrom" type="object">
  명령어 권한 부여를 위한 제공자별 허용 목록입니다. 구성하면 명령어와 지시문의
  **유일한** 권한 부여 출처가 됩니다. 전역 기본값에는 `"*"`를 사용하며,
  제공자별 키가 이를 재정의합니다.
</ParamField>

<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom`이 설정되지 않은 경우 명령어에 허용 목록/정책을 적용합니다.
</ParamField>

## 명령어 목록

명령어는 다음 세 가지 출처에서 제공됩니다.

- **핵심 기본 제공 명령어:** `src/auto-reply/commands-registry.shared.ts`
- **생성된 도크 명령어:** `src/auto-reply/commands-registry.data.ts`
- **Plugin 명령어:** Plugin의 `registerCommand()` 호출

사용 가능 여부는 구성 플래그, 채널 표면, 설치 및 활성화된
Plugin에 따라 달라집니다.

### 핵심 명령어

  <AccordionGroup>
  <Accordion title="세션 및 실행">
    | 명령 | 설명 |
    | --- | --- |
    | `/new [model]` | 현재 세션을 보관하고 새 세션을 시작합니다 |
    | `/reset [soft [message]]` | 현재 세션을 그 자리에서 재설정합니다. `soft`는 대화 기록을 유지하고, 재사용된 CLI 백엔드 세션 ID를 삭제하며, 시작 절차를 다시 실행합니다 |
    | `/name <title>` | 현재 세션의 이름을 지정하거나 변경합니다. 현재 이름과 제안을 확인하려면 제목을 생략합니다 |
    | `/compact [instructions]` | 세션 컨텍스트를 압축합니다. [Compaction](/ko/concepts/compaction)을 참조하십시오 |
    | `/stop` | 현재 실행을 중단합니다 |
    | `/session idle <duration\|off>` | 스레드 바인딩의 유휴 만료를 관리합니다 |
    | `/session max-age <duration\|off>` | 스레드 바인딩의 최대 수명 만료를 관리합니다 |
    | `/export-session [path]` | 현재 세션을 HTML로 내보냅니다. 별칭: `/export` |
    | `/export-trajectory [path]` | 현재 세션의 JSONL 궤적 번들을 내보냅니다. 별칭: `/trajectory` |

    <Note>
      Control UI는 입력된 `/new`를 가로채 새 대시보드 세션을 생성하고 해당 세션으로
      전환합니다. 단, `session.dmScope: "main"`이 구성되어 있고 현재 상위 세션이
      에이전트의 기본 세션인 경우에는 `/new`가 기본 세션을 그 자리에서
      재설정합니다. 입력된 `/reset`은 계속해서 Gateway의 인플레이스 재설정을
      실행합니다. 세션에 고정된 모델 선택을 해제하려면 `/model default`를 사용하십시오.
    </Note>

  </Accordion>

  <Accordion title="모델 및 실행 제어">
    | 명령 | 설명 |
    | --- | --- |
    | `/think <level\|default>` | 사고 수준을 설정하거나 세션 재정의를 해제합니다. 별칭: `/thinking`, `/t` |
    | `/verbose on\|off\|full` | 상세 출력을 전환합니다. 별칭: `/v` |
    | `/trace on\|off` | 현재 세션의 Plugin 추적 출력을 전환합니다 |
    | `/fast [status\|auto\|on\|off\|default]` | 빠른 모드를 표시, 설정 또는 해제합니다 |
    | `/reasoning [on\|off\|stream]` | 추론 표시 여부를 전환합니다. 별칭: `/reason` |
    | `/elevated [on\|off\|ask\|full]` | 권한 상승 모드를 전환합니다. 별칭: `/elev` |
    | `/exec host=<auto\|sandbox\|gateway\|node> security=<deny\|allowlist\|full> ask=<off\|on-miss\|always> node=<id>` | exec 기본값을 표시하거나 설정합니다 |
    | `/login [codex\|openai\|openai-codex]` | 비공개 채팅 또는 Web UI 세션에서 Codex/OpenAI 로그인을 연결합니다. 소유자/관리자만 사용할 수 있습니다 |
    | `/model [name\|#\|status]` | 모델을 표시하거나 설정합니다 |
    | `/models [provider] [page] [limit=<n>\|all]` | 구성되었거나 인증을 통해 사용 가능한 제공자 또는 모델을 나열합니다 |
    | `/queue <mode>` | 활성 실행 대기열 동작을 관리합니다. [대기열](/ko/concepts/queue) 및 [대기열 조정](/ko/concepts/queue-steering)을 참조하십시오 |
    | `/steer <message>` | 활성 실행에 지침을 삽입합니다. 별칭: `/tell`. [조정](/ko/tools/steer)을 참조하십시오 |

    <AccordionGroup>
      <Accordion title="verbose / trace / fast / reasoning 안전 지침">
        - `/verbose`는 디버깅용입니다. 일반적인 사용 시에는 **꺼짐** 상태로 유지하십시오.
        - `/trace`는 Plugin이 소유한 추적/디버그 줄만 표시하며, 일반적인 상세 메시지는 계속 표시하지 않습니다.
        - `/fast auto|on|off`는 세션 재정의를 유지합니다. 이를 해제하려면 세션 UI의 `inherit` 옵션을 사용하십시오.
        - `/fast`는 제공자별로 다르게 작동합니다. OpenAI/Codex에서는 `service_tier=priority`로 매핑되고, Anthropic 직접 요청에서는 `service_tier=auto` 또는 `standard_only`로 매핑됩니다.
        - `/reasoning`, `/verbose`, `/trace`는 그룹 환경에서 위험할 수 있습니다. 내부 추론이나 Plugin 진단 정보가 노출될 수 있으므로 그룹 채팅에서는 끈 상태로 유지하십시오.

      </Accordion>
      <Accordion title="모델 전환 세부 정보">
        - `/model`은 새 모델을 세션에 즉시 저장합니다.
        - 에이전트가 유휴 상태이면 다음 실행부터 바로 사용합니다.
        - 실행 중이면 전환이 보류 상태로 표시되고 다음 정상적인 재시도 지점에 적용됩니다.

      </Accordion>
    </AccordionGroup>

  </Accordion>

  <Accordion title="검색 및 상태">
    | 명령 | 설명 |
    | --- | --- |
    | `/help` | 간단한 도움말 요약을 표시합니다 |
    | `/commands` | 생성된 명령 카탈로그를 표시합니다 |
    | `/tools [compact\|verbose]` | 현재 에이전트가 지금 사용할 수 있는 항목을 표시합니다 |
    | `/status` | 실행/런타임 상태, Gateway 및 시스템 가동 시간, Plugin 상태와 공급자 사용량/할당량을 표시합니다 |
    | `/status plugins` | 로드 오류, 격리, 채널 Plugin 장애, 종속성 문제, 호환성 알림 등 자세한 Plugin 상태를 표시합니다. `commands.plugins: true`가 필요합니다 |
    | `/goal [status\|start\|edit\|pause\|resume\|complete\|block\|clear] ...` | 현재 세션의 영구 [목표](/ko/tools/goal)를 관리합니다 |
    | `/diagnostics [note]` | 소유자 전용 지원 보고서 흐름입니다. 매번 실행 승인을 요청합니다 |
    | `/crestodian <request>` | 소유자 DM에서 Crestodian 설정 및 복구 도우미를 실행합니다 |
    | `/tasks` | 현재 세션의 활성/최근 백그라운드 작업을 나열합니다 |
    | `/context [list\|detail\|map\|json]` | 컨텍스트가 구성되는 방식을 설명합니다 |
    | `/whoami` | 발신자 ID를 표시합니다. 별칭: `/id` |
    | `/usage off\|tokens\|full\|reset\|cost` | 응답별 사용량 바닥글을 제어하거나(`reset`/`inherit`/`clear`/`default`는 세션 재정의를 지워 구성된 기본값을 다시 상속함) 로컬 비용 요약을 출력합니다 |
  </Accordion>

  <Accordion title="Skills, 허용 목록 및 승인">
    | 명령 | 설명 |
    | --- | --- |
    | `/skill <name> [input]` | 이름으로 Skill을 실행합니다 |
    | `/learn [request]` | 현재 대화 또는 지정한 소스를 바탕으로 [Skill Workshop](/ko/tools/skill-workshop)을 통해 검토 가능한 Skill 하나를 작성합니다 |
    | `/allowlist [list\|add\|remove] ...` | 허용 목록 항목을 관리합니다. 텍스트 전용입니다 |
    | `/approve <id> <decision>` | 실행 또는 Plugin 승인 프롬프트를 처리합니다 |
    | `/btw <question>` | 세션 컨텍스트를 변경하지 않고 부가 질문을 합니다. 별칭: `/side`. [BTW](/ko/tools/btw)를 참조하십시오 |
  </Accordion>

  <Accordion title="서브에이전트 및 ACP">
    | 명령어 | 설명 |
    | --- | --- |
    | `/subagents list\|log\|info` | 현재 세션의 서브에이전트 실행을 확인합니다 |
    | `/acp spawn\|cancel\|steer\|close\|sessions\|status\|set-mode\|set\|cwd\|permissions\|timeout\|model\|reset-options\|doctor\|install\|help` | ACP 세션과 런타임 옵션을 관리합니다. 런타임 제어에는 외부 소유자 또는 내부 Gateway 관리자 ID가 필요합니다 |
    | `/focus <target>` | 현재 Discord 스레드 또는 Telegram 토픽을 세션 대상으로 바인딩합니다 |
    | `/unfocus` | 현재 스레드 바인딩을 제거합니다 |
    | `/agents` | 현재 세션에서 스레드에 바인딩된 에이전트를 나열합니다 |
  </Accordion>

  <Accordion title="소유자 전용 쓰기 및 관리">
    | 명령어 | 요구 사항 | 설명 |
    | --- | --- | --- |
    | `/config show\|get\|set\|unset` | `commands.config: true` | `openclaw.json`을 읽거나 씁니다. 소유자 전용입니다 |
    | `/mcp show\|get\|set\|unset` | `commands.mcp: true` | OpenClaw에서 관리하는 MCP 서버 구성을 읽거나 씁니다. 소유자 전용입니다 |
    | `/plugins list\|inspect\|show\|get\|install\|enable\|disable` | `commands.plugins: true` | Plugin 상태를 확인하거나 변경합니다. 쓰기는 소유자 전용입니다. 별칭: `/plugin` |
    | `/debug show\|set\|unset\|reset` | `commands.debug: true` | 런타임 전용 구성 재정의입니다. 소유자 전용입니다 |
    | `/restart` | `commands.restart: true` (기본값) | OpenClaw를 다시 시작합니다 |
    | `/send on\|off\|inherit` | 소유자 | 전송 정책을 설정합니다 |
  </Accordion>

  <Accordion title="음성, TTS 및 채널 제어">
    | 명령어 | 설명 |
    | --- | --- |
    | `/tts on\|off\|status\|chat\|latest\|provider\|limit\|summary\|audio\|help` | TTS를 제어합니다. [TTS](/ko/tools/tts)를 참조하십시오 |
    | `/activation mention\|always` | 그룹 활성화 모드를 설정합니다 |
    | `/bash <command>` | 호스트 셸 명령을 실행합니다. 별칭: `! <command>`. `commands.bash: true`가 필요합니다 |
    | `!poll [sessionId]` | 백그라운드 bash 작업을 확인합니다 |
    | `!stop [sessionId]` | 백그라운드 bash 작업을 중지합니다 |
  </Accordion>
</AccordionGroup>

### 도킹 명령어

도킹 명령어는 활성 세션의 응답 경로를 연결된 다른 채널로 전환합니다.
설정 및 문제 해결은 [채널 도킹](/ko/concepts/channel-docking)을 참조하십시오.

네이티브 명령을 지원하는 채널 Plugin에서 생성됩니다.

- `/dock-discord` (별칭: `/dock_discord`)
- `/dock-mattermost` (별칭: `/dock_mattermost`)
- `/dock-slack` (별칭: `/dock_slack`)
- `/dock-telegram` (별칭: `/dock_telegram`)

도킹 명령어에는 `session.identityLinks`가 필요합니다. 원본 발신자와 대상 피어는
동일한 ID 그룹에 속해야 합니다.

### 번들 Plugin 명령어

| 명령어                                                  | 설명                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/dreaming [on\|off\|status\|help]`                     | 메모리 Dreaming을 켜거나 끕니다(소유자 또는 Gateway 관리자). [Dreaming](/ko/concepts/dreaming)을 참조하십시오                                                                                                            |
| `/pair [qr\|status\|pending\|approve\|cleanup\|notify]` | 기기 페어링을 관리합니다. [페어링](/ko/channels/pairing)을 참조하십시오                                                                                                                                        |
| `/phone status\|arm ...\|disarm`                        | 고위험 Node 명령어(카메라/화면/컴퓨터/쓰기)를 일시적으로 활성화합니다. [컴퓨터 사용](/nodes/computer-use)을 참조하십시오                                                                               |
| `/voice status\|list\|set <voiceId>`                    | Talk 음성 구성을 관리합니다. Discord 네이티브 이름: `/talkvoice`                                                                                                                                    |
| `/card ...`                                             | LINE 리치 카드 사전 설정을 전송합니다. [LINE](/ko/channels/line)을 참조하십시오                                                                                                                                        |
| `/codex <action> ...`                                   | Codex 앱 서버 하네스를 바인딩하고 제어하며 확인합니다(상태, 스레드, 재개, 모델, 빠른 모드, 권한, 압축, 검토, MCP, Skills 등). [Codex 하네스](/ko/plugins/codex-harness)를 참조하십시오 |

QQBot 전용: `/bot-ping`, `/bot-version`, `/bot-help`, `/bot-upgrade`, `/bot-logs`

### Skill 명령어

사용자가 호출할 수 있는 Skills는 슬래시 명령어로 제공됩니다.

- `/skill <name> [input]`은 항상 일반 진입점으로 작동합니다.
- Skills는 직접 명령어로 등록할 수 있습니다(예: OpenProse의 `/prose`).
- 네이티브 Skill 명령어 등록은 `commands.nativeSkills` 및
  `channels.<provider>.commands.nativeSkills`로 제어합니다.
- 이름은 `a-z0-9_` 형식으로 정리되며(최대 32자), 충돌 시 숫자 접미사가 붙습니다.

<AccordionGroup>
  <Accordion title="Skill 명령어 디스패치">
    기본적으로 Skill 명령어는 일반 요청으로 모델에 라우팅됩니다.

    Skills는 `command-dispatch: tool`을 선언하여 도구로 직접 라우팅할 수 있습니다
    (결정론적이며 모델이 관여하지 않음). 예: `/prose`(OpenProse Plugin)
    — [OpenProse](/ko/prose)를 참조하십시오.

  </Accordion>
  <Accordion title="네이티브 명령어 인수">
    필수 인수를 생략하면 Discord는 동적 옵션에 자동 완성을 사용하고 필요한 경우
    버튼 메뉴를 사용합니다. Telegram과 Slack은 선택지가 있는 명령어에
    버튼 메뉴를 표시합니다. 동적 선택지는 대상 세션 모델을 기준으로 결정되므로,
    `/think` 수준과 같은 모델별 옵션은 세션의 `/model` 재정의를 따릅니다.
  </Accordion>
</AccordionGroup>

## `/tools`: 에이전트가 지금 사용할 수 있는 항목

`/tools`는 런타임 질문, 즉 **이 대화에서 이 에이전트가 지금 사용할 수 있는 항목**에
답합니다. 정적인 구성 카탈로그가 아닙니다.

```text
/tools         # 간략 보기
/tools verbose # 짧은 설명 포함
```

결과는 세션 범위로 한정됩니다. 에이전트, 채널, 스레드, 발신자
권한 부여 또는 모델을 변경하면 출력이 달라질 수 있습니다. 프로필 및 재정의 편집에는
Control UI의 도구 패널 또는 구성 화면을 사용하십시오.

## `/model`: 모델 선택

```text
/model             # 모델 선택기 표시
/model list        # 동일
/model 3           # 선택기의 번호로 선택
/model openai/gpt-5.4
/model opus@anthropic:default
/model default     # 세션 모델 선택 해제
/model status      # 엔드포인트 및 API 모드가 포함된 상세 보기
```

Discord에서 `/model` 및 `/models`는 공급자와 모델
드롭다운이 있는 대화형 선택기를 엽니다. 선택기는
`provider/*` 항목을 포함하여 `agents.defaults.models`를 따릅니다.

## `/config`: 디스크 구성 쓰기

<Note>
  소유자 전용입니다. 기본적으로 비활성화되어 있으며 `commands.config: true`로 활성화합니다.
</Note>

```text
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

구성은 쓰기 전에 검증됩니다. 잘못된 변경 사항은 거부됩니다. `/config`
업데이트는 재시작 후에도 유지됩니다.

## `/mcp`: MCP 서버 구성

<Note>
  소유자 전용입니다. 기본적으로 비활성화되어 있으며 `commands.mcp: true`로 활성화합니다.
</Note>

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

`/mcp`는 임베디드 에이전트 프로젝트 설정이 아닌 OpenClaw 구성에 설정을 저장합니다.
`/mcp show`는 자격 증명이 포함된 필드, 인식된 자격 증명 플래그 값,
알려진 비밀 형태의 인수를 마스킹합니다. 그룹에서 실행하면
구성이 소유자에게 비공개로 전송됩니다. 비공개 소유자 경로를
사용할 수 없으면 명령은 안전하게 실패하고 소유자에게 다이렉트
채팅에서 다시 시도하도록 요청합니다.

## `/debug`: 런타임 전용 재정의

<Note>
  소유자 전용입니다. 기본적으로 비활성화되어 있으며 `commands.debug: true`로 활성화합니다.
  재정의는 새로운 구성 읽기에 즉시 적용되지만 디스크에는 **기록되지 않습니다**.
</Note>

```text
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

## `/plugins`: Plugin 관리

<Note>
  쓰기는 소유자 전용입니다. 기본적으로 비활성화되어 있으며 `commands.plugins: true`로 활성화합니다.
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
Plugin 런타임을 핫 리로드합니다. `/plugins install`은 Plugin 소스 모듈이
변경되었으므로 관리형 Gateway를 자동으로 다시 시작합니다.

## `/trace`: Plugin 추적 출력

```text
/trace          # 현재 추적 상태 표시
/trace on
/trace off
```

`/trace`는 전체 상세 모드 없이 세션 범위의 Plugin 추적/디버그 줄을
표시합니다. `/debug`(런타임 재정의) 또는 `/verbose`(일반
도구 출력)를 대체하지 않습니다.

## `/btw`: 부가 질문

`/btw`는 현재 세션 컨텍스트에 관한 빠른 부가 질문입니다. 별칭: `/side`.

```text
/btw 지금 무엇을 하고 있나요?
/side 기본 실행이 계속되는 동안 무엇이 변경되었나요?
```

일반 메시지와 달리 다음과 같이 작동합니다.

- 현재 세션을 배경 컨텍스트로 사용합니다.
- Codex 하네스 세션에서는 임시 Codex 보조 스레드로 실행됩니다.
- 이후 세션 컨텍스트를 변경하지 **않습니다**.
- 대화 기록에 기록되지 않습니다.

전체 동작은 [BTW 부가 질문](/ko/tools/btw)을 참조하십시오.

## 화면별 참고 사항

<AccordionGroup>
  <Accordion title="화면별 세션 범위">
    - **텍스트 명령어:** 일반 채팅 세션에서 실행됩니다(DM은 `main`을 공유하고 그룹에는 자체 세션이 있습니다).
    - **네이티브 Discord 명령어:** `agent:<agentId>:discord:slash:<userId>`
    - **네이티브 Slack 명령어:** `agent:<agentId>:slack:slash:<userId>`(`channels.slack.slashCommand.sessionPrefix`를 통해 접두사를 구성할 수 있음)
    - **네이티브 Telegram 명령어:** `telegram:slash:<userId>`(`CommandTargetSessionKey`를 통해 채팅 세션을 대상으로 함)
    - **`/login codex`**는 비공개 채팅 또는 Web UI 응답 경로를 통해서만 기기 페어링 코드를 전송합니다. Telegram 그룹/토픽에서 호출하면 소유자에게 대신 봇에 DM을 보내도록 요청합니다.
    - **`/stop`**은 활성 채팅 세션을 대상으로 현재 실행을 중단합니다.

  </Accordion>
  <Accordion title="Slack 세부 사항">
    `channels.slack.slashCommand`는 단일 `/openclaw` 형식 명령어를 지원합니다.
    `commands.native: true`를 사용하면 내장 명령어마다 Slack 슬래시 명령어를 하나씩
    생성합니다. Slack이 `/status`를 예약하므로 `/status`가 아닌 `/agentstatus`를
    등록하십시오. 텍스트 `/status`는 Slack 메시지에서 계속 작동합니다.
  </Accordion>
  <Accordion title="빠른 경로 및 인라인 바로 가기">
    - 허용 목록에 있는 발신자의 명령어 전용 메시지는 즉시 처리됩니다(대기열 및 모델 우회).
    - 인라인 바로 가기(`/help`, `/commands`, `/status`, `/whoami`)도 일반 메시지에 삽입된 상태로 작동하며, 모델이 나머지 텍스트를 보기 전에 제거됩니다.
    - 권한이 없는 명령어 전용 메시지는 조용히 무시되며, 인라인 `/...` 토큰은 일반 텍스트로 처리됩니다.

  </Accordion>
  <Accordion title="인수 참고 사항">
    - 명령어와 인수 사이에 선택적으로 `:`을 사용할 수 있습니다(`/think: high`, `/send: on`).
    - `/new <model>`은 모델 별칭, `provider/model` 또는 공급자 이름(유사 일치)을 허용합니다. 일치 항목이 없으면 텍스트가 메시지 본문으로 처리됩니다.
    - `/allowlist add|remove`에는 `commands.config: true`가 필요하며 채널의 `configWrites`를 따릅니다.

  </Accordion>
</AccordionGroup>

## 공급자 사용량 및 상태

- **제공업체 사용량/할당량**(예: "Claude 80% 남음")은 사용량 추적이 활성화된 경우 현재 모델 제공업체에 대해 `/status`에 표시됩니다.
- `/status`의 **토큰/캐시 줄**은 실시간 세션 스냅샷에 정보가 부족한 경우 최신 트랜스크립트 사용량 항목을 대신 사용할 수 있습니다.
- **실행 환경과 런타임:** `/status`는 실제 샌드박스 경로를 `Execution`으로 보고하고, 세션을 실행하는 주체를 `Runtime`으로 보고합니다. 실행 주체는 `OpenClaw Default`, `OpenAI Codex`, CLI 백엔드 또는 ACP 백엔드일 수 있습니다.
- **응답별 토큰/비용:** `/usage off|tokens|full`로 제어합니다.
- `/model status`는 사용량이 아니라 모델/인증/엔드포인트에 관한 정보를 제공합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Skills" href="/ko/tools/skills" icon="puzzle-piece">
    Skills 슬래시 명령이 등록되고 제한되는 방식을 설명합니다.
  </Card>
  <Card title="Skills 만들기" href="/ko/tools/creating-skills" icon="hammer">
    자체 슬래시 명령을 등록하는 Skills를 만듭니다.
  </Card>
  <Card title="BTW" href="/ko/tools/btw" icon="comments">
    세션 컨텍스트를 변경하지 않고 부가 질문을 합니다.
  </Card>
  <Card title="Steer" href="/ko/tools/steer" icon="compass">
    `/steer`를 사용하여 실행 중인 에이전트를 안내합니다.
  </Card>
</CardGroup>
