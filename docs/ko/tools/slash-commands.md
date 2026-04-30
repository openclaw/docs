---
read_when:
    - 채팅 명령 사용 또는 구성
    - 명령 라우팅 또는 권한 디버깅
sidebarTitle: Slash commands
summary: '슬래시 명령: 텍스트와 네이티브, 구성 및 지원되는 명령'
title: 슬래시 명령어
x-i18n:
    generated_at: "2026-04-30T06:55:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87471982fd03fb35bcb44ae62c9f9e40ec38ad17059c88a1e990194a296fbbd
    source_path: tools/slash-commands.md
    workflow: 16
---

명령은 Gateway에서 처리됩니다. 대부분의 명령은 `/`로 시작하는 **독립형** 메시지로 보내야 합니다. 호스트 전용 bash 채팅 명령은 `! <cmd>`를 사용합니다(`/bash <cmd>`는 별칭).

대화나 스레드가 ACP 세션에 바인딩되어 있으면, 일반 후속 텍스트는 해당 ACP 하네스로 라우팅됩니다. Gateway 관리 명령은 계속 로컬에 남습니다. `/acp ...`는 항상 OpenClaw ACP 명령 핸들러에 도달하며, `/status`와 `/unfocus`는 해당 표면에서 명령 처리가 활성화되어 있을 때마다 로컬에 남습니다.

관련된 시스템은 두 가지입니다.

<AccordionGroup>
  <Accordion title="명령">
    독립형 `/...` 메시지입니다.
  </Accordion>
  <Accordion title="지시문">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - 지시문은 모델이 메시지를 보기 전에 메시지에서 제거됩니다.
    - 일반 채팅 메시지(지시문만 있는 메시지가 아님)에서는 "인라인 힌트"로 처리되며 세션 설정으로 유지되지 **않습니다**.
    - 지시문만 있는 메시지(메시지에 지시문만 포함된 경우)에서는 세션에 유지되고 확인 응답을 보냅니다.
    - 지시문은 **인증된 발신자**에게만 적용됩니다. `commands.allowFrom`이 설정되어 있으면 이것만 허용 목록으로 사용됩니다. 그렇지 않으면 인증은 채널 허용 목록/페어링과 `commands.useAccessGroups`에서 가져옵니다. 인증되지 않은 발신자에게는 지시문이 일반 텍스트로 처리됩니다.

  </Accordion>
  <Accordion title="인라인 바로가기">
    허용 목록에 있거나 인증된 발신자만 사용할 수 있습니다: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    즉시 실행되고, 모델이 메시지를 보기 전에 제거되며, 남은 텍스트는 일반 흐름을 계속 따릅니다.

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
  채팅 메시지에서 `/...` 파싱을 활성화합니다. 네이티브 명령이 없는 표면(WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)에서는 이 값을 `false`로 설정해도 텍스트 명령이 계속 작동합니다.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  네이티브 명령을 등록합니다. 자동: Discord/Telegram에서는 켜짐, Slack에서는 꺼짐(슬래시 명령을 추가할 때까지), 네이티브 지원이 없는 제공자에서는 무시됩니다. 제공자별로 재정의하려면 `channels.discord.commands.native`, `channels.telegram.commands.native`, 또는 `channels.slack.commands.native`를 설정하세요(bool 또는 `"auto"`). `false`는 시작 시 Discord/Telegram에 이전에 등록된 명령을 지웁니다. Slack 명령은 Slack 앱에서 관리되며 자동으로 제거되지 않습니다.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  지원되는 경우 **skill** 명령을 네이티브로 등록합니다. 자동: Discord/Telegram에서는 켜짐, Slack에서는 꺼짐(Slack은 Skills마다 슬래시 명령을 만들어야 함). 제공자별로 재정의하려면 `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, 또는 `channels.slack.commands.nativeSkills`를 설정하세요(bool 또는 `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>`가 호스트 셸 명령을 실행하도록 활성화합니다(`/bash <cmd>`는 별칭이며 `tools.elevated` 허용 목록이 필요함).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash가 백그라운드 모드로 전환하기 전에 대기하는 시간을 제어합니다(`0`은 즉시 백그라운드로 전환).
</ParamField>
<ParamField path="commands.config" type="boolean" default="false">
  `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기).
</ParamField>
<ParamField path="commands.mcp" type="boolean" default="false">
  `/mcp`를 활성화합니다(`mcp.servers` 아래의 OpenClaw 관리 MCP 구성 읽기/쓰기).
</ParamField>
<ParamField path="commands.plugins" type="boolean" default="false">
  `/plugins`를 활성화합니다(Plugin 검색/상태 및 설치 + 활성화/비활성화 제어).
</ParamField>
<ParamField path="commands.debug" type="boolean" default="false">
  `/debug`를 활성화합니다(런타임 전용 재정의).
</ParamField>
<ParamField path="commands.restart" type="boolean" default="true">
  `/restart`와 Gateway 재시작 도구 작업을 활성화합니다.
</ParamField>
<ParamField path="commands.ownerAllowFrom" type="string[]">
  소유자 전용 명령/도구 표면에 대한 명시적 소유자 허용 목록을 설정합니다. 이는 위험한 작업을 승인하고 `/diagnostics`, `/export-trajectory`, `/config` 같은 명령을 실행할 수 있는 인간 운영자 계정입니다. `commands.allowFrom` 및 DM 페어링 접근과는 별개입니다.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  채널별 설정: 소유자 전용 명령을 해당 표면에서 실행하려면 **소유자 ID**가 필요하도록 합니다. `true`일 때 발신자는 확인된 소유자 후보(예: `commands.ownerAllowFrom`의 항목 또는 제공자 네이티브 소유자 메타데이터)와 일치하거나, 내부 메시지 채널에서 내부 `operator.admin` 범위를 보유해야 합니다. 채널 `allowFrom`의 와일드카드 항목 또는 비어 있거나 확인되지 않은 소유자 후보 목록만으로는 충분하지 **않습니다**. 소유자 전용 명령은 해당 채널에서 닫힌 상태로 실패합니다. 소유자 전용 명령을 `ownerAllowFrom`과 표준 명령 허용 목록으로만 제한하려면 이 설정을 꺼 두세요.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  시스템 프롬프트에 소유자 ID가 표시되는 방식을 제어합니다.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  선택적으로 `commands.ownerDisplay="hash"`일 때 사용되는 HMAC 시크릿을 설정합니다.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  명령 인증을 위한 제공자별 허용 목록입니다. 구성되면 명령과 지시문에 대한 유일한 인증 소스가 됩니다(채널 허용 목록/페어링 및 `commands.useAccessGroups`는 무시됨). 전역 기본값에는 `"*"`를 사용하세요. 제공자별 키가 이를 재정의합니다.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom`이 설정되지 않았을 때 명령에 대한 허용 목록/정책을 적용합니다.
</ParamField>

## 명령 목록

현재 단일 진실 공급원:

- 코어 내장 명령은 `src/auto-reply/commands-registry.shared.ts`에서 가져옵니다.
- 생성된 dock 명령은 `src/auto-reply/commands-registry.data.ts`에서 가져옵니다.
- Plugin 명령은 Plugin `registerCommand()` 호출에서 가져옵니다.
- Gateway에서의 실제 사용 가능 여부는 여전히 구성 플래그, 채널 표면, 설치/활성화된 Plugin에 따라 달라집니다.

### 코어 내장 명령

<AccordionGroup>
  <Accordion title="세션 및 실행">
    - `/new [model]`은 새 세션을 시작합니다. `/reset`은 reset 별칭입니다.
    - `/reset soft [message]`는 현재 기록을 유지하고, 재사용된 CLI 백엔드 세션 ID를 버리며, 시작/시스템 프롬프트 로딩을 제자리에서 다시 실행합니다.
    - `/compact [instructions]`는 세션 컨텍스트를 압축합니다. [Compaction](/ko/concepts/compaction)을 참고하세요.
    - `/stop`은 현재 실행을 중단합니다.
    - `/session idle <duration|off>` 및 `/session max-age <duration|off>`는 스레드 바인딩 만료를 관리합니다.
    - `/export-session [path]`는 현재 세션을 HTML로 내보냅니다. 별칭: `/export`.
    - `/export-trajectory [path]`는 exec 승인을 요청한 다음 현재 세션에 대한 JSONL [trajectory bundle](/ko/tools/trajectory)을 내보냅니다. 하나의 OpenClaw 세션에 대한 프롬프트, 도구, 기록 타임라인이 필요할 때 사용하세요. 그룹 채팅에서는 승인 프롬프트와 내보내기 결과가 소유자에게 비공개로 전송됩니다. 별칭: `/trajectory`.

  </Accordion>
  <Accordion title="모델 및 실행 제어">
    - `/think <level>`은 사고 수준을 설정합니다. 옵션은 활성 모델의 제공자 프로필에서 가져옵니다. 일반적인 수준은 `off`, `minimal`, `low`, `medium`, `high`이며, `xhigh`, `adaptive`, `max` 같은 사용자 지정 수준이나 이진 `on`은 지원되는 곳에서만 사용할 수 있습니다. 별칭: `/thinking`, `/t`.
    - `/verbose on|off|full`은 자세한 출력을 전환합니다. 별칭: `/v`.
    - `/trace on|off`는 현재 세션의 Plugin 추적 출력을 전환합니다.
    - `/fast [status|on|off]`는 빠른 모드를 표시하거나 설정합니다.
    - `/reasoning [on|off|stream]`은 추론 표시 여부를 전환합니다. 별칭: `/reason`.
    - `/elevated [on|off|ask|full]`은 elevated 모드를 전환합니다. 별칭: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`는 exec 기본값을 표시하거나 설정합니다.
    - `/model [name|#|status]`는 모델을 표시하거나 설정합니다.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]`는 구성되었거나 인증 가능한 제공자 또는 특정 제공자의 모델을 나열합니다. `all`을 추가하면 해당 제공자의 전체 카탈로그를 탐색합니다.
    - `/queue <mode>`는 큐 동작(`steer`, 레거시 `queue`, `followup`, `collect`, `steer-backlog`, `interrupt`)과 `debounce:0.5s cap:25 drop:summarize` 같은 옵션을 관리합니다. `/queue default` 또는 `/queue reset`은 세션 재정의를 지웁니다. [Command queue](/ko/concepts/queue) 및 [Steering queue](/ko/concepts/queue-steering)를 참고하세요.

  </Accordion>
  <Accordion title="검색 및 상태">
    - `/help`는 짧은 도움말 요약을 표시합니다.
    - `/commands`는 생성된 명령 카탈로그를 표시합니다.
    - `/tools [compact|verbose]`는 현재 에이전트가 지금 사용할 수 있는 항목을 표시합니다.
    - `/status`는 사용 가능한 경우 `Execution`/`Runtime` 레이블과 제공자 사용량/할당량을 포함한 실행/런타임 상태를 표시합니다.
    - `/diagnostics [note]`는 Gateway 버그와 Codex 하네스 실행을 위한 소유자 전용 지원 보고서 흐름입니다. `openclaw gateway diagnostics export --json`을 실행하기 전에 매번 명시적 exec 승인을 요청합니다. 모든 항목을 허용하는 규칙으로 diagnostics를 승인하지 마세요. 승인 후에는 로컬 번들 경로, 매니페스트 요약, 개인정보 보호 참고 사항, 관련 세션 ID가 포함된 붙여넣기 가능한 보고서를 보냅니다. 그룹 채팅에서는 승인 프롬프트와 보고서가 소유자에게 비공개로 전송됩니다. 활성 세션이 OpenAI Codex 하네스를 사용하는 경우, 동일한 승인으로 관련 Codex 피드백도 OpenAI 서버에 전송되며 완료된 응답에는 OpenClaw 세션 ID, Codex 스레드 ID, `codex resume <thread-id>` 명령이 나열됩니다. [Diagnostics Export](/ko/gateway/diagnostics)를 참고하세요.
    - `/crestodian <request>`는 소유자 DM에서 Crestodian 설정 및 복구 헬퍼를 실행합니다.
    - `/tasks`는 현재 세션의 활성/최근 백그라운드 작업을 나열합니다.
    - `/context [list|detail|json]`는 컨텍스트가 조립되는 방식을 설명합니다.
    - `/whoami`는 발신자 ID를 표시합니다. 별칭: `/id`.
    - `/usage off|tokens|full|cost`는 응답별 사용량 바닥글을 제어하거나 로컬 비용 요약을 출력합니다.

  </Accordion>
  <Accordion title="Skills, 허용 목록, 승인">
    - `/skill <name> [input]`는 이름으로 skill을 실행합니다.
    - `/allowlist [list|add|remove] ...`는 허용 목록 항목을 관리합니다. 텍스트 전용입니다.
    - `/approve <id> <decision>`는 exec 승인 프롬프트를 해결합니다.
    - `/btw <question>`은 향후 세션 컨텍스트를 변경하지 않고 부가 질문을 합니다. [BTW](/ko/tools/btw)를 참고하세요.

  </Accordion>
  <Accordion title="하위 에이전트 및 ACP">
    - `/subagents list|kill|log|info|send|steer|spawn`은 현재 세션의 하위 에이전트 실행을 관리합니다.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help`는 ACP 세션과 런타임 옵션을 관리합니다.
    - `/focus <target>`은 현재 Discord 스레드 또는 Telegram 주제/대화를 세션 대상에 바인딩합니다.
    - `/unfocus`는 현재 바인딩을 제거합니다.
    - `/agents`는 현재 세션의 스레드 바인딩 에이전트를 나열합니다.
    - `/kill <id|#|all>`은 실행 중인 하위 에이전트 하나 또는 전체를 중단합니다.
    - `/steer <id|#> <message>`는 실행 중인 하위 에이전트에 steering을 보냅니다. 별칭: `/tell`.

  </Accordion>
  <Accordion title="소유자 전용 쓰기 및 관리자">
    - `/config show|get|set|unset`은 `openclaw.json`을 읽거나 씁니다. 소유자 전용입니다. `commands.config: true`가 필요합니다.
    - `/mcp show|get|set|unset`은 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버 구성을 읽거나 씁니다. 소유자 전용입니다. `commands.mcp: true`가 필요합니다.
    - `/plugins list|inspect|show|get|install|enable|disable`은 Plugin 상태를 검사하거나 변경합니다. `/plugin`은 별칭입니다. 쓰기는 소유자 전용입니다. `commands.plugins: true`가 필요합니다.
    - `/debug show|set|unset|reset`은 런타임 전용 구성 재정의를 관리합니다. 소유자 전용입니다. `commands.debug: true`가 필요합니다.
    - `/restart`는 활성화된 경우 OpenClaw를 다시 시작합니다. 기본값: 활성화됨. 비활성화하려면 `commands.restart: false`를 설정하세요.
    - `/send on|off|inherit`는 전송 정책을 설정합니다. 소유자 전용입니다.

  </Accordion>
  <Accordion title="음성, TTS, 채널 제어">
    - `/tts on|off|status|chat|latest|provider|limit|summary|audio|help`는 TTS를 제어합니다. [TTS](/ko/tools/tts)를 참조하세요.
    - `/activation mention|always`는 그룹 활성화 모드를 설정합니다.
    - `/bash <command>`는 호스트 셸 명령을 실행합니다. 텍스트 전용입니다. 별칭: `! <command>`. `commands.bash: true`와 `tools.elevated` 허용 목록이 필요합니다.
    - `!poll [sessionId]`는 백그라운드 bash 작업을 확인합니다.
    - `!stop [sessionId]`는 백그라운드 bash 작업을 중지합니다.

  </Accordion>
</AccordionGroup>

### 생성된 도킹 명령

도킹 명령은 현재 세션의 응답 경로를 연결된 다른 채널로 전환합니다. 설정,
예시, 문제 해결은 [채널 도킹](/ko/concepts/channel-docking)을 참조하세요.

도킹 명령은 네이티브 명령을 지원하는 채널 Plugin에서 생성됩니다. 현재 번들 세트:

- `/dock-discord` (별칭: `/dock_discord`)
- `/dock-mattermost` (별칭: `/dock_mattermost`)
- `/dock-slack` (별칭: `/dock_slack`)
- `/dock-telegram` (별칭: `/dock_telegram`)

직접 채팅에서 도킹 명령을 사용해 현재 세션의 응답 경로를 연결된 다른 채널로 전환하세요. 에이전트는 동일한 세션 컨텍스트를 유지하지만, 해당 세션의 이후 응답은 선택한 채널 피어로 전달됩니다.

도킹 명령에는 `session.identityLinks`가 필요합니다. 소스 발신자와 대상 피어는 같은 ID 그룹에 있어야 합니다. 예: `["telegram:123", "discord:456"]`. ID가 `123`인 Telegram 사용자가 `/dock_discord`를 보내면 OpenClaw는 활성 세션에 `lastChannel: "discord"` 및 `lastTo: "456"`을 저장합니다. 발신자가 Discord 피어에 연결되어 있지 않으면, 명령은 일반 채팅으로 넘어가지 않고 설정 힌트로 응답합니다.

도킹은 활성 세션 경로만 변경합니다. 채널 계정을 만들거나, 액세스를 부여하거나, 채널 허용 목록을 우회하거나, 대화 기록을 다른 세션으로 이동하지 않습니다. 경로를 다시 전환하려면 `/dock-telegram`, `/dock-slack`, `/dock-mattermost` 또는 다른 생성된 도킹 명령을 사용하세요.

### 번들 Plugin 명령

번들 Plugin은 더 많은 슬래시 명령을 추가할 수 있습니다. 이 저장소의 현재 번들 명령:

- `/dreaming [on|off|status|help]`는 메모리 Dreaming을 전환합니다. [Dreaming](/ko/concepts/dreaming)을 참조하세요.
- `/pair [qr|status|pending|approve|cleanup|notify]`는 기기 페어링/설정 흐름을 관리합니다. [페어링](/ko/channels/pairing)을 참조하세요.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`는 고위험 전화 Node 명령을 일시적으로 활성화합니다.
- `/voice status|list [limit]|set <voiceId|name>`는 Talk 음성 구성을 관리합니다. Discord에서는 네이티브 명령 이름이 `/talkvoice`입니다.
- `/card ...`는 LINE 리치 카드 프리셋을 보냅니다. [LINE](/ko/channels/line)을 참조하세요.
- `/codex status|models|threads|resume|compact|review|diagnostics|account|mcp|skills`는 번들 Codex 앱 서버 하네스를 검사하고 제어합니다. [Codex 하네스](/ko/plugins/codex-harness)를 참조하세요.
- QQBot 전용 명령:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 동적 Skill 명령

사용자가 호출할 수 있는 Skills도 슬래시 명령으로 노출됩니다.

- `/skill <name> [input]`는 범용 진입점으로 항상 작동합니다.
- Skill/Plugin이 등록한 경우 Skills가 `/prose` 같은 직접 명령으로도 나타날 수 있습니다.
- 네이티브 Skill 명령 등록은 `commands.nativeSkills` 및 `channels.<provider>.commands.nativeSkills`로 제어됩니다.

<AccordionGroup>
  <Accordion title="인수 및 파서 참고 사항">
    - 명령은 명령과 인수 사이에 선택적 `:`를 허용합니다(예: `/think: high`, `/send: on`, `/help:`).
    - `/new <model>`은 모델 별칭, `provider/model` 또는 공급자 이름(퍼지 매치)을 허용합니다. 일치 항목이 없으면 텍스트는 메시지 본문으로 처리됩니다.
    - 전체 공급자 사용량 분석은 `openclaw status --usage`를 사용하세요.
    - `/allowlist add|remove`에는 `commands.config=true`가 필요하며 채널 `configWrites`를 준수합니다.
    - 다중 계정 채널에서는 구성 대상 `/allowlist --account <id>` 및 `/config set channels.<provider>.accounts.<id>...`도 대상 계정의 `configWrites`를 준수합니다.
    - `/usage`는 응답별 사용량 바닥글을 제어합니다. `/usage cost`는 OpenClaw 세션 로그에서 로컬 비용 요약을 출력합니다.
    - `/restart`는 기본적으로 활성화됩니다. 비활성화하려면 `commands.restart: false`를 설정하세요.
    - `/plugins install <spec>`은 `openclaw plugins install`과 동일한 Plugin 사양을 허용합니다: 로컬 경로/아카이브, npm 패키지 또는 `clawhub:<pkg>`.
    - `/plugins enable|disable`은 Plugin 구성을 업데이트하며 재시작을 요청할 수 있습니다.

  </Accordion>
  <Accordion title="채널별 동작">
    - Discord 전용 네이티브 명령: `/vc join|leave|status`는 음성 채널을 제어합니다(텍스트로는 사용할 수 없음). `join`에는 길드와 선택된 음성/스테이지 채널이 필요합니다. `channels.discord.voice`와 네이티브 명령이 필요합니다.
    - Discord 스레드 바인딩 명령(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`)에는 유효한 스레드 바인딩이 활성화되어 있어야 합니다(`session.threadBindings.enabled` 및/또는 `channels.discord.threadBindings.enabled`).
    - ACP 명령 참조 및 런타임 동작: [ACP 에이전트](/ko/tools/acp-agents).

  </Accordion>
  <Accordion title="자세히 / 추적 / 빠른 모드 / 추론 안전">
    - `/verbose`는 디버깅과 추가 가시성을 위한 것입니다. 일반 사용에서는 **끄세요**.
    - `/trace`는 `/verbose`보다 범위가 좁습니다. Plugin 소유의 추적/디버그 줄만 표시하고 일반 verbose 도구 잡음은 끕니다.
    - `/fast on|off`는 세션 재정의를 유지합니다. 지우고 구성 기본값으로 되돌리려면 Sessions UI의 `inherit` 옵션을 사용하세요.
    - `/fast`는 공급자별로 다릅니다. OpenAI/OpenAI Codex는 네이티브 Responses 엔드포인트에서 이를 `service_tier=priority`로 매핑하는 반면, OAuth 인증 트래픽이 `api.anthropic.com`으로 전송되는 경우를 포함한 직접 공개 Anthropic 요청은 이를 `service_tier=auto` 또는 `standard_only`로 매핑합니다. [OpenAI](/ko/providers/openai) 및 [Anthropic](/ko/providers/anthropic)을 참조하세요.
    - 도구 실패 요약은 관련이 있을 때 계속 표시되지만, 자세한 실패 텍스트는 `/verbose`가 `on` 또는 `full`일 때만 포함됩니다.
    - `/reasoning`, `/verbose`, `/trace`는 그룹 설정에서 위험합니다. 노출하려 하지 않았던 내부 추론, 도구 출력 또는 Plugin 진단이 드러날 수 있습니다. 특히 그룹 채팅에서는 꺼두는 것이 좋습니다.

  </Accordion>
  <Accordion title="모델 전환">
    - `/model`은 새 세션 모델을 즉시 유지합니다.
    - 에이전트가 유휴 상태이면 다음 실행에서 바로 사용합니다.
    - 실행이 이미 활성 상태이면 OpenClaw는 실시간 전환을 대기 중으로 표시하고 깨끗한 재시도 지점에서만 새 모델로 다시 시작합니다.
    - 도구 활동이나 응답 출력이 이미 시작된 경우, 대기 중인 전환은 이후 재시도 기회 또는 다음 사용자 턴까지 대기열에 남아 있을 수 있습니다.
    - 로컬 TUI에서 `/crestodian [request]`는 일반 에이전트 TUI에서 Crestodian으로 돌아갑니다. 이는 메시지 채널 복구 모드와 별개이며 원격 구성 권한을 부여하지 않습니다.

  </Accordion>
  <Accordion title="빠른 경로 및 인라인 단축키">
    - **빠른 경로:** 허용 목록에 있는 발신자의 명령 전용 메시지는 즉시 처리됩니다(큐 + 모델 우회).
    - **그룹 멘션 게이팅:** 허용 목록에 있는 발신자의 명령 전용 메시지는 멘션 요구 사항을 우회합니다.
    - **인라인 단축키(허용 목록에 있는 발신자만):** 특정 명령은 일반 메시지 안에 포함되어도 작동하며, 모델이 나머지 텍스트를 보기 전에 제거됩니다.
      - 예: `hey /status`는 상태 응답을 트리거하고, 나머지 텍스트는 일반 흐름을 계속 통과합니다.
    - 현재: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - 권한이 없는 명령 전용 메시지는 조용히 무시되고, 인라인 `/...` 토큰은 일반 텍스트로 처리됩니다.

  </Accordion>
  <Accordion title="Skill 명령 및 네이티브 인수">
    - **Skill 명령:** `user-invocable` Skills는 슬래시 명령으로 노출됩니다. 이름은 `a-z0-9_`로 정리됩니다(최대 32자). 충돌 시 숫자 접미사가 붙습니다(예: `_2`).
      - `/skill <name> [input]`는 이름으로 Skill을 실행합니다(네이티브 명령 제한 때문에 Skill별 명령을 만들 수 없을 때 유용).
      - 기본적으로 Skill 명령은 일반 요청으로 모델에 전달됩니다.
      - Skills는 선택적으로 `command-dispatch: tool`을 선언하여 명령을 도구로 직접 라우팅할 수 있습니다(결정적, 모델 없음).
      - 예: `/prose`(OpenProse Plugin) — [OpenProse](/ko/prose)를 참조하세요.
    - **네이티브 명령 인수:** Discord는 동적 옵션에 자동 완성을 사용합니다(필수 인수를 생략하면 버튼 메뉴도 사용). Telegram과 Slack은 명령이 선택지를 지원하고 인수를 생략하면 버튼 메뉴를 표시합니다. 동적 선택지는 대상 세션 모델에 대해 해석되므로, `/think` 수준 같은 모델별 옵션은 해당 세션의 `/model` 재정의를 따릅니다.

  </Accordion>
</AccordionGroup>

## `/tools`

`/tools`는 구성 질문이 아니라 런타임 질문에 답합니다. **이 에이전트가 지금 이 대화에서 무엇을 사용할 수 있는가**입니다.

- 기본 `/tools`는 간결하며 빠르게 훑어보도록 최적화되어 있습니다.
- `/tools verbose`는 짧은 설명을 추가합니다.
- 인수를 지원하는 네이티브 명령 표면은 `compact|verbose`와 동일한 모드 전환을 노출합니다.
- 결과는 세션 범위이므로 에이전트, 채널, 스레드, 발신자 권한 또는 모델 변경이 출력을 바꿀 수 있습니다.
- `/tools`에는 핵심 도구, 연결된 Plugin 도구, 채널 소유 도구를 포함하여 런타임에서 실제로 도달 가능한 도구가 포함됩니다.

프로필 및 재정의 편집에는 `/tools`를 정적 카탈로그로 취급하지 말고 Control UI 도구 패널 또는 구성/카탈로그 표면을 사용하세요.

## 사용량 표면(어디에 무엇이 표시되는지)

- **공급자 사용량/할당량**(예: "Claude 80% left")은 사용량 추적이 활성화된 경우 현재 모델 공급자의 `/status`에 표시됩니다. OpenClaw는 공급자 창을 `% left`로 정규화합니다. MiniMax의 경우 남은 비율 전용 필드는 표시 전에 반전되며, `model_remains` 응답은 채팅 모델 항목과 모델 태그가 붙은 플랜 레이블을 우선합니다.
- **토큰/캐시 줄**은 실시간 세션 스냅샷이 희소할 때 최신 대화 기록 사용량 항목으로 대체될 수 있습니다. 기존의 0이 아닌 실시간 값이 계속 우선하며, 저장된 합계가 없거나 더 작을 때 대화 기록 대체는 활성 런타임 모델 레이블과 더 큰 프롬프트 지향 합계도 복구할 수 있습니다.
- **실행 vs 런타임:** `/status`는 유효한 샌드박스 경로에 대해 `Execution`을 보고하고, 실제로 세션을 실행하는 주체에 대해 `Runtime`을 보고합니다: `OpenClaw Pi Default`, `OpenAI Codex`, CLI 백엔드 또는 ACP 백엔드.
- **응답별 토큰/비용**은 `/usage off|tokens|full`로 제어됩니다(일반 응답에 추가됨).
- `/model status`는 사용량이 아니라 **모델/인증/엔드포인트**에 관한 것입니다.

## 모델 선택(`/model`)

`/model`은 지시문으로 구현됩니다.

예시:

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model opus@anthropic:default
/model status
```

참고:

- `/model` 및 `/model list`는 간결한 번호가 매겨진 선택기를 표시합니다(모델 패밀리 + 사용 가능한 공급자).
- Discord에서는 `/model` 및 `/models`가 공급자 및 모델 드롭다운과 제출 단계가 있는 대화형 선택기를 엽니다.
- `/model <#>`은 해당 선택기에서 선택합니다(가능하면 현재 공급자를 우선).
- `/model status`는 구성된 공급자 엔드포인트(`baseUrl`)와 API 모드(`api`)가 사용 가능할 때 이를 포함한 상세 보기를 표시합니다.

## 디버그 재정의

`/debug`를 사용하면 **런타임 전용** 구성 재정의(디스크가 아닌 메모리)를 설정할 수 있습니다. 소유자 전용입니다. 기본적으로 비활성화되어 있으며, `commands.debug: true`로 활성화합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
재정의는 새 구성 읽기에 즉시 적용되지만 `openclaw.json`에는 기록되지 않습니다. 모든 재정의를 지우고 디스크의 구성으로 돌아가려면 `/debug reset`을 사용하세요.
</Note>

## Plugin 추적 출력

`/trace`를 사용하면 전체 상세 모드를 켜지 않고도 **세션 범위의 Plugin 추적/디버그 줄**을 전환할 수 있습니다.

예시:

```text
/trace
/trace on
/trace off
```

참고:

- 인수 없이 `/trace`를 실행하면 현재 세션 추적 상태가 표시됩니다.
- `/trace on`은 현재 세션에 대해 Plugin 추적 줄을 활성화합니다.
- `/trace off`는 이를 다시 비활성화합니다.
- Plugin 추적 줄은 `/status`에 표시되거나 일반 어시스턴트 응답 뒤의 후속 진단 메시지로 표시될 수 있습니다.
- `/trace`는 `/debug`를 대체하지 않습니다. `/debug`는 계속 런타임 전용 구성 재정의를 관리합니다.
- `/trace`는 `/verbose`를 대체하지 않습니다. 일반 상세 도구/상태 출력은 계속 `/verbose`에 속합니다.

## 구성 업데이트

`/config`는 디스크의 구성(`openclaw.json`)에 기록합니다. 소유자 전용입니다. 기본적으로 비활성화되어 있으며, `commands.config: true`로 활성화합니다.

예시:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
구성은 기록 전에 검증되며, 유효하지 않은 변경은 거부됩니다. `/config` 업데이트는 재시작 후에도 유지됩니다.
</Note>

## MCP 업데이트

`/mcp`는 `mcp.servers` 아래에 OpenClaw가 관리하는 MCP 서버 정의를 기록합니다. 소유자 전용입니다. 기본적으로 비활성화되어 있으며, `commands.mcp: true`로 활성화합니다.

예시:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp`는 Pi 소유 프로젝트 설정이 아니라 OpenClaw 구성에 구성을 저장합니다. 런타임 어댑터가 실제로 실행 가능한 전송 방식을 결정합니다.
</Note>

## Plugin 업데이트

`/plugins`를 사용하면 운영자가 발견된 Plugin을 검사하고 구성에서 활성화 여부를 전환할 수 있습니다. 읽기 전용 흐름에서는 `/plugin`을 별칭으로 사용할 수 있습니다. 기본적으로 비활성화되어 있으며, `commands.plugins: true`로 활성화합니다.

예시:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list`와 `/plugins show`는 현재 워크스페이스 및 디스크의 구성을 대상으로 실제 Plugin 발견을 사용합니다.
- `/plugins enable|disable`은 Plugin 구성만 업데이트하며, Plugin을 설치하거나 제거하지 않습니다.
- 활성화/비활성화 변경 후에는 이를 적용하려면 Gateway를 재시작하세요.

</Note>

## 표면 참고 사항

<AccordionGroup>
  <Accordion title="표면별 세션">
    - **텍스트 명령**은 일반 채팅 세션에서 실행됩니다(DM은 `main`을 공유하고, 그룹은 자체 세션을 가집니다).
    - **네이티브 명령**은 격리된 세션을 사용합니다.
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (`channels.slack.slashCommand.sessionPrefix`를 통해 접두사를 구성할 수 있음)
      - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey`를 통해 채팅 세션을 대상으로 함)
    - **`/stop`**은 현재 실행을 중단할 수 있도록 활성 채팅 세션을 대상으로 합니다.

  </Accordion>
  <Accordion title="Slack 세부 사항">
    `channels.slack.slashCommand`는 단일 `/openclaw` 스타일 명령에 대해 계속 지원됩니다. `commands.native`를 활성화하는 경우 내장 명령마다 하나의 Slack 슬래시 명령(`/help`와 같은 이름)을 만들어야 합니다. Slack용 명령 인수 메뉴는 임시 Block Kit 버튼으로 전달됩니다.

    Slack 네이티브 예외: Slack이 `/status`를 예약하므로 `/status`가 아니라 `/agentstatus`를 등록하세요. 텍스트 `/status`는 Slack 메시지에서 계속 작동합니다.

  </Accordion>
</AccordionGroup>

## BTW 부가 질문

`/btw`는 현재 세션에 대한 빠른 **부가 질문**입니다.

일반 채팅과 달리:

- 현재 세션을 배경 컨텍스트로 사용합니다.
- 별도의 **도구 없는** 일회성 호출로 실행됩니다.
- 이후 세션 컨텍스트를 변경하지 않습니다.
- 대화 기록에 기록되지 않습니다.
- 일반 어시스턴트 메시지 대신 실시간 부가 결과로 전달됩니다.

따라서 `/btw`는 기본 작업이 계속 진행되는 동안 임시 설명이 필요할 때 유용합니다.

예시:

```text
/btw what are we doing right now?
```

전체 동작 및 클라이언트 UX 세부 사항은 [BTW 부가 질문](/ko/tools/btw)을 참조하세요.

## 관련 항목

- [Skills 만들기](/ko/tools/creating-skills)
- [Skills](/ko/tools/skills)
- [Skills 구성](/ko/tools/skills-config)
