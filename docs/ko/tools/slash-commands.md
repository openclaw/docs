---
read_when:
    - 채팅 명령 사용 또는 구성
    - 명령 라우팅 또는 권한 디버깅
sidebarTitle: Slash commands
summary: '슬래시 명령: 텍스트 방식과 네이티브 방식, 구성, 지원되는 명령'
title: 슬래시 명령
x-i18n:
    generated_at: "2026-04-26T11:41:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75bf58d02738e30bfdc00ad1c264b2f066eebd2819f4ea0209f504f279755993
    source_path: tools/slash-commands.md
    workflow: 15
---

명령은 Gateway에서 처리됩니다. 대부분의 명령은 `/`로 시작하는 **독립형**
메시지로 전송해야 합니다. 호스트 전용 bash 채팅 명령은 `! <cmd>`를 사용하며
(`/bash <cmd>`는 별칭입니다).

대화나 스레드가 ACP 세션에 바인딩되어 있으면 일반 후속 텍스트는 해당 ACP 하니스로 라우팅됩니다.
Gateway 관리 명령은 계속 로컬에 남습니다. `/acp ...`는 항상 OpenClaw ACP 명령 핸들러로 전달되고,
`/status`와 `/unfocus`는 해당 표면에서 명령 처리가 활성화되어 있을 때
항상 로컬에 유지됩니다.

관련된 시스템은 두 가지가 있습니다:

<AccordionGroup>
  <Accordion title="명령">
    독립형 `/...` 메시지입니다.
  </Accordion>
  <Accordion title="지시어">
    `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.

    - 지시어는 모델이 메시지를 보기 전에 제거됩니다.
    - 일반 채팅 메시지에서(지시어만 있는 메시지가 아닌 경우) 이들은 “인라인 힌트”로 처리되며 세션 설정을 유지하지 **않습니다**.
    - 지시어만 있는 메시지(메시지에 지시어만 포함된 경우)에서는 세션에 유지되며 확인 응답을 반환합니다.
    - 지시어는 **권한이 있는 발신자**에게만 적용됩니다. `commands.allowFrom`이 설정된 경우 이것이 유일한 허용 목록으로 사용됩니다. 그렇지 않으면 권한은 채널 허용 목록/페어링과 `commands.useAccessGroups`에서 결정됩니다. 권한이 없는 발신자에게는 지시어가 일반 텍스트로 처리됩니다.

  </Accordion>
  <Accordion title="인라인 단축키">
    허용 목록에 있거나 권한이 있는 발신자 전용: `/help`, `/commands`, `/status`, `/whoami` (`/id`).

    이들은 즉시 실행되고, 모델이 메시지를 보기 전에 제거되며, 남은 텍스트는 일반 흐름을 계속 따릅니다.

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
  채팅 메시지에서 `/...` 파싱을 활성화합니다. 네이티브 명령이 없는 표면(WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)에서는 이를 `false`로 설정해도 텍스트 명령이 계속 작동합니다.
</ParamField>
<ParamField path="commands.native" type='boolean | "auto"' default='"auto"'>
  네이티브 명령을 등록합니다. Auto: Discord/Telegram에서는 켜짐, Slack에서는 꺼짐(슬래시 명령을 추가할 때까지), 네이티브 지원이 없는 제공자에서는 무시됩니다. 제공자별로 재정의하려면 `channels.discord.commands.native`, `channels.telegram.commands.native`, 또는 `channels.slack.commands.native`를 설정하세요(bool 또는 `"auto"`). `false`는 시작 시 Discord/Telegram에 이전에 등록된 명령을 지웁니다. Slack 명령은 Slack 앱에서 관리되며 자동으로 제거되지 않습니다.
</ParamField>
<ParamField path="commands.nativeSkills" type='boolean | "auto"' default='"auto"'>
  지원되는 경우 **skill** 명령을 네이티브로 등록합니다. Auto: Discord/Telegram에서는 켜짐, Slack에서는 꺼짐(Slack은 skill당 하나의 슬래시 명령 생성이 필요함). 제공자별로 재정의하려면 `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, 또는 `channels.slack.commands.nativeSkills`를 설정하세요(bool 또는 `"auto"`).
</ParamField>
<ParamField path="commands.bash" type="boolean" default="false">
  `! <cmd>`로 호스트 셸 명령 실행을 활성화합니다(`tools.elevated` 허용 목록 필요, `/bash <cmd>`는 별칭).
</ParamField>
<ParamField path="commands.bashForegroundMs" type="number" default="2000">
  bash가 백그라운드 모드로 전환되기 전에 얼마나 기다릴지 제어합니다(`0`이면 즉시 백그라운드로 전환).
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
  소유자 전용 명령/도구 표면에 대한 명시적 소유자 허용 목록을 설정합니다. `commands.allowFrom`과는 별개입니다.
</ParamField>
<ParamField path="channels.<channel>.commands.enforceOwnerForCommands" type="boolean" default="false">
  채널별: 해당 표면에서 소유자 전용 명령을 실행하려면 **소유자 신원**을 요구합니다. `true`일 때 발신자는 해결된 소유자 후보(예: `commands.ownerAllowFrom` 항목 또는 제공자 네이티브 소유자 메타데이터)와 일치하거나 내부 메시지 채널에서 내부 `operator.admin` 범위를 가져야 합니다. 채널 `allowFrom`의 와일드카드 항목이나 비어 있거나 해결되지 않은 소유자 후보 목록만으로는 **충분하지 않으며**, 소유자 전용 명령은 해당 채널에서 실패 시 차단됩니다. 소유자 전용 명령을 `ownerAllowFrom`과 표준 명령 허용 목록으로만 제한하려면 이 옵션을 꺼 두세요.
</ParamField>
<ParamField path="commands.ownerDisplay" type='"raw" | "hash"'>
  시스템 프롬프트에서 소유자 ID가 표시되는 방식을 제어합니다.
</ParamField>
<ParamField path="commands.ownerDisplaySecret" type="string">
  `commands.ownerDisplay="hash"`일 때 사용할 HMAC 비밀을 선택적으로 설정합니다.
</ParamField>
<ParamField path="commands.allowFrom" type="object">
  명령 권한 부여를 위한 제공자별 허용 목록입니다. 구성되면 이것이 명령과 지시어에 대한 유일한 권한 소스가 됩니다(채널 허용 목록/페어링 및 `commands.useAccessGroups`는 무시됨). 전역 기본값에는 `"*"`를 사용하고, 제공자별 키가 이를 재정의합니다.
</ParamField>
<ParamField path="commands.useAccessGroups" type="boolean" default="true">
  `commands.allowFrom`이 설정되지 않은 경우 명령에 대해 허용 목록/정책을 강제합니다.
</ParamField>

## 명령 목록

현재 소스 오브 트루스:

- 코어 내장 명령은 `src/auto-reply/commands-registry.shared.ts`에서 가져옵니다
- 생성된 dock 명령은 `src/auto-reply/commands-registry.data.ts`에서 가져옵니다
- Plugin 명령은 Plugin의 `registerCommand()` 호출에서 가져옵니다
- 실제로 Gateway에서 사용 가능한지는 여전히 구성 플래그, 채널 표면, 설치/활성화된 Plugin에 따라 달라집니다

### 코어 내장 명령

<AccordionGroup>
  <Accordion title="세션 및 실행">
    - `/new [model]`은 새 세션을 시작합니다. `/reset`은 reset 별칭입니다.
    - `/reset soft [message]`는 현재 transcript를 유지하고, 재사용된 CLI 백엔드 세션 ID를 제거한 뒤, 시작/시스템 프롬프트 로딩을 현재 위치에서 다시 실행합니다.
    - `/compact [instructions]`는 세션 컨텍스트를 압축합니다. [Compaction](/ko/concepts/compaction)을 참조하세요.
    - `/stop`은 현재 실행을 중단합니다.
    - `/session idle <duration|off>` 및 `/session max-age <duration|off>`는 스레드 바인딩 만료를 관리합니다.
    - `/export-session [path]`는 현재 세션을 HTML로 내보냅니다. 별칭: `/export`.
    - `/export-trajectory [path]`는 현재 세션에 대한 JSONL [trajectory bundle](/ko/tools/trajectory)을 내보냅니다. 별칭: `/trajectory`.
  </Accordion>
  <Accordion title="모델 및 실행 제어">
    - `/think <level>`은 thinking 수준을 설정합니다. 옵션은 활성 모델의 제공자 프로필에서 가져오며, 일반적인 수준은 `off`, `minimal`, `low`, `medium`, `high`이고, `xhigh`, `adaptive`, `max` 같은 사용자 지정 수준이나 이진 `on`은 지원되는 경우에만 제공됩니다. 별칭: `/thinking`, `/t`.
    - `/verbose on|off|full`은 상세 출력 여부를 전환합니다. 별칭: `/v`.
    - `/trace on|off`는 현재 세션의 Plugin trace 출력을 전환합니다.
    - `/fast [status|on|off]`는 fast mode를 표시하거나 설정합니다.
    - `/reasoning [on|off|stream]`은 reasoning 표시를 전환합니다. 별칭: `/reason`.
    - `/elevated [on|off|ask|full]`는 elevated mode를 전환합니다. 별칭: `/elev`.
    - `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`는 exec 기본값을 표시하거나 설정합니다.
    - `/model [name|#|status]`는 모델을 표시하거나 설정합니다.
    - `/models [provider] [page] [limit=<n>|size=<n>|all]`는 제공자 또는 제공자의 모델을 나열합니다.
    - `/queue <mode>`는 대기열 동작(`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`)과 `debounce:2s cap:25 drop:summarize` 같은 옵션을 관리합니다.
  </Accordion>
  <Accordion title="검색 및 상태">
    - `/help`는 짧은 도움말 요약을 표시합니다.
    - `/commands`는 생성된 명령 카탈로그를 표시합니다.
    - `/tools [compact|verbose]`는 현재 에이전트가 지금 사용할 수 있는 항목을 표시합니다.
    - `/status`는 `Execution`/`Runtime` 레이블과 제공자 사용량/할당량(가능한 경우)을 포함한 실행/런타임 상태를 표시합니다.
    - `/crestodian <request>`는 소유자 DM에서 Crestodian 설정 및 복구 도우미를 실행합니다.
    - `/tasks`는 현재 세션의 활성/최근 백그라운드 작업을 나열합니다.
    - `/context [list|detail|json]`은 컨텍스트가 어떻게 조합되는지 설명합니다.
    - `/whoami`는 발신자 ID를 표시합니다. 별칭: `/id`.
    - `/usage off|tokens|full|cost`는 응답별 사용량 바닥글을 제어하거나 로컬 비용 요약을 출력합니다.
  </Accordion>
  <Accordion title="Skills, 허용 목록, 승인">
    - `/skill <name> [input]`은 이름으로 skill을 실행합니다.
    - `/allowlist [list|add|remove] ...`는 허용 목록 항목을 관리합니다. 텍스트 전용입니다.
    - `/approve <id> <decision>`은 exec 승인 프롬프트를 해결합니다.
    - `/btw <question>`은 향후 세션 컨텍스트를 변경하지 않고 부가 질문을 합니다. [BTW](/ko/tools/btw)를 참조하세요.
  </Accordion>
  <Accordion title="하위 에이전트 및 ACP">
    - `/subagents list|kill|log|info|send|steer|spawn`은 현재 세션의 하위 에이전트 실행을 관리합니다.
    - `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help`는 ACP 세션 및 런타임 옵션을 관리합니다.
    - `/focus <target>`은 현재 Discord 스레드 또는 Telegram topic/대화를 세션 대상에 바인딩합니다.
    - `/unfocus`는 현재 바인딩을 제거합니다.
    - `/agents`는 현재 세션의 스레드 바인딩된 에이전트를 나열합니다.
    - `/kill <id|#|all>`은 하나 또는 모든 실행 중인 하위 에이전트를 중단합니다.
    - `/steer <id|#> <message>`는 실행 중인 하위 에이전트에 조정 메시지를 보냅니다. 별칭: `/tell`.
  </Accordion>
  <Accordion title="소유자 전용 쓰기 및 관리">
    - `/config show|get|set|unset`은 `openclaw.json`을 읽거나 씁니다. 소유자 전용입니다. `commands.config: true`가 필요합니다.
    - `/mcp show|get|set|unset`은 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버 구성을 읽거나 씁니다. 소유자 전용입니다. `commands.mcp: true`가 필요합니다.
    - `/plugins list|inspect|show|get|install|enable|disable`은 Plugin 상태를 검사하거나 변경합니다. `/plugin`은 별칭입니다. 쓰기 작업은 소유자 전용입니다. `commands.plugins: true`가 필요합니다.
    - `/debug show|set|unset|reset`은 런타임 전용 구성 재정의를 관리합니다. 소유자 전용입니다. `commands.debug: true`가 필요합니다.
    - `/restart`는 활성화된 경우 OpenClaw를 재시작합니다. 기본값: 활성화됨. 비활성화하려면 `commands.restart: false`를 설정하세요.
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

### 생성된 dock 명령

Dock 명령은 네이티브 명령을 지원하는 채널 Plugin에서 생성됩니다. 현재 번들된 집합:

- `/dock-discord` (별칭: `/dock_discord`)
- `/dock-mattermost` (별칭: `/dock_mattermost`)
- `/dock-slack` (별칭: `/dock_slack`)
- `/dock-telegram` (별칭: `/dock_telegram`)

### 번들된 Plugin 명령

번들된 Plugin은 더 많은 슬래시 명령을 추가할 수 있습니다. 이 저장소의 현재 번들 명령:

- `/dreaming [on|off|status|help]`는 memory dreaming을 전환합니다. [Dreaming](/ko/concepts/dreaming)을 참조하세요.
- `/pair [qr|status|pending|approve|cleanup|notify]`는 장치 페어링/설정 흐름을 관리합니다. [Pairing](/ko/channels/pairing)을 참조하세요.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`은 고위험 phone node 명령을 일시적으로 활성화합니다.
- `/voice status|list [limit]|set <voiceId|name>`는 Talk voice 구성을 관리합니다. Discord에서 네이티브 명령 이름은 `/talkvoice`입니다.
- `/card ...`는 LINE rich card 프리셋을 전송합니다. [LINE](/ko/channels/line)을 참조하세요.
- `/codex status|models|threads|resume|compact|review|account|mcp|skills`는 번들된 Codex app-server 하니스를 검사하고 제어합니다. [Codex harness](/ko/plugins/codex-harness)를 참조하세요.
- QQBot 전용 명령:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 동적 skill 명령

사용자가 호출할 수 있는 Skills도 슬래시 명령으로 노출됩니다:

- `/skill <name> [input]`은 항상 범용 진입점으로 작동합니다.
- skill/plugin이 등록하면 Skills는 `/prose` 같은 직접 명령으로도 나타날 수 있습니다.
- 네이티브 skill 명령 등록은 `commands.nativeSkills` 및 `channels.<provider>.commands.nativeSkills`로 제어됩니다.

<AccordionGroup>
  <Accordion title="인수 및 파서 참고">
    - 명령은 명령과 인수 사이에 선택적으로 `:`를 허용합니다(예: `/think: high`, `/send: on`, `/help:`).
    - `/new <model>`은 모델 별칭, `provider/model`, 또는 제공자 이름(퍼지 매치)을 허용합니다. 일치 항목이 없으면 해당 텍스트는 메시지 본문으로 처리됩니다.
    - 전체 제공자 사용량 분석은 `openclaw status --usage`를 사용하세요.
    - `/allowlist add|remove`는 `commands.config=true`가 필요하며 채널 `configWrites`를 따릅니다.
    - 다중 계정 채널에서 config 대상 `/allowlist --account <id>` 및 `/config set channels.<provider>.accounts.<id>...`도 대상 계정의 `configWrites`를 따릅니다.
    - `/usage`는 응답별 사용량 바닥글을 제어합니다. `/usage cost`는 OpenClaw 세션 로그에서 로컬 비용 요약을 출력합니다.
    - `/restart`는 기본적으로 활성화되어 있습니다. 비활성화하려면 `commands.restart: false`를 설정하세요.
    - `/plugins install <spec>`은 `openclaw plugins install`과 동일한 Plugin spec을 허용합니다: 로컬 경로/아카이브, npm 패키지, 또는 `clawhub:<pkg>`.
    - `/plugins enable|disable`는 Plugin 구성을 업데이트하며 재시작을 요청할 수 있습니다.
  </Accordion>
  <Accordion title="채널별 동작">
    - Discord 전용 네이티브 명령: `/vc join|leave|status`는 음성 채널을 제어합니다(텍스트로는 사용할 수 없음). `join`에는 길드와 선택된 voice/stage 채널이 필요합니다. `channels.discord.voice` 및 네이티브 명령이 필요합니다.
    - Discord 스레드 바인딩 명령(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`)에는 유효한 스레드 바인딩 활성화가 필요합니다(`session.threadBindings.enabled` 및/또는 `channels.discord.threadBindings.enabled`).
    - ACP 명령 참조 및 런타임 동작: [ACP agents](/ko/tools/acp-agents).
  </Accordion>
  <Accordion title="Verbose / trace / fast / reasoning 안전성">
    - `/verbose`는 디버깅과 추가 가시성을 위한 것이므로 일반 사용에서는 **꺼 둔 상태**를 유지하세요.
    - `/trace`는 `/verbose`보다 범위가 좁습니다. Plugin 소유의 trace/debug 줄만 드러내고 일반 verbose 도구 출력은 계속 끕니다.
    - `/fast on|off`는 세션 재정의를 유지합니다. 이를 지우고 구성 기본값으로 되돌리려면 Sessions UI의 `inherit` 옵션을 사용하세요.
    - `/fast`는 제공자별입니다. OpenAI/OpenAI Codex는 이를 네이티브 Responses 엔드포인트의 `service_tier=priority`에 매핑하고, `api.anthropic.com`으로 전송되는 OAuth 인증 트래픽을 포함한 직접 공개 Anthropic 요청은 이를 `service_tier=auto` 또는 `standard_only`에 매핑합니다. [OpenAI](/ko/providers/openai) 및 [Anthropic](/ko/providers/anthropic)을 참조하세요.
    - 관련이 있을 때 도구 실패 요약은 계속 표시되지만, 자세한 실패 텍스트는 `/verbose`가 `on` 또는 `full`일 때만 포함됩니다.
    - `/reasoning`, `/verbose`, `/trace`는 그룹 설정에서 위험합니다. 의도하지 않은 내부 reasoning, 도구 출력 또는 Plugin 진단이 드러날 수 있습니다. 특히 그룹 채팅에서는 꺼 두는 것이 좋습니다.
  </Accordion>
  <Accordion title="모델 전환">
    - `/model`은 새 세션 모델을 즉시 유지합니다.
    - 에이전트가 유휴 상태이면 다음 실행에서 바로 사용됩니다.
    - 이미 실행이 활성화되어 있으면 OpenClaw는 라이브 전환을 보류 중으로 표시하고 깔끔한 재시도 시점에서만 새 모델로 다시 시작합니다.
    - 도구 활동이나 응답 출력이 이미 시작되었다면 보류 중인 전환은 이후 재시도 기회 또는 다음 사용자 턴까지 대기할 수 있습니다.
    - 로컬 TUI에서 `/crestodian [request]`는 일반 에이전트 TUI에서 Crestodian으로 돌아갑니다. 이는 메시지 채널 구조 모드와 별개이며 원격 구성 권한을 부여하지 않습니다.
  </Accordion>
  <Accordion title="빠른 경로 및 인라인 단축키">
    - **빠른 경로:** 허용 목록에 있는 발신자의 명령 전용 메시지는 즉시 처리됩니다(대기열 + 모델 우회).
    - **그룹 멘션 게이팅:** 허용 목록에 있는 발신자의 명령 전용 메시지는 멘션 요구 사항을 우회합니다.
    - **인라인 단축키(허용 목록에 있는 발신자 전용):** 일부 명령은 일반 메시지에 포함되어도 작동하며, 모델이 남은 텍스트를 보기 전에 제거됩니다.
      - 예: `hey /status`는 상태 응답을 트리거하고, 남은 텍스트는 일반 흐름을 계속 따릅니다.
    - 현재: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
    - 권한이 없는 명령 전용 메시지는 조용히 무시되며, 인라인 `/...` 토큰은 일반 텍스트로 처리됩니다.
  </Accordion>
  <Accordion title="Skill 명령 및 네이티브 인수">
    - **Skill 명령:** `user-invocable` Skills는 슬래시 명령으로 노출됩니다. 이름은 `a-z0-9_`로 정리되며(최대 32자), 충돌 시 숫자 접미사가 붙습니다(예: `_2`).
      - `/skill <name> [input]`은 이름으로 skill을 실행합니다(네이티브 명령 제한 때문에 skill별 명령이 불가능할 때 유용함).
      - 기본적으로 skill 명령은 일반 요청으로 모델에 전달됩니다.
      - Skills는 선택적으로 `command-dispatch: tool`을 선언하여 명령을 도구로 직접 라우팅할 수 있습니다(결정적, 모델 없음).
      - 예: `/prose` (OpenProse Plugin) — [OpenProse](/ko/prose)를 참조하세요.
    - **네이티브 명령 인수:** Discord는 동적 옵션에 자동완성을 사용합니다(필수 인수를 생략하면 버튼 메뉴도 제공). Telegram과 Slack은 명령이 선택지를 지원하고 인수를 생략하면 버튼 메뉴를 표시합니다. 동적 선택지는 대상 세션 모델을 기준으로 확인되므로 `/think` 수준 같은 모델별 옵션은 해당 세션의 `/model` 재정의를 따릅니다.
  </Accordion>
</AccordionGroup>

## `/tools`

`/tools`는 구성 질문이 아니라 런타임 질문에 답합니다: **이 대화에서 이 에이전트가 지금 사용할 수 있는 것**입니다.

- 기본 `/tools`는 간결하며 빠르게 훑어보기 좋게 최적화되어 있습니다.
- `/tools verbose`는 짧은 설명을 추가합니다.
- 인수를 지원하는 네이티브 명령 표면은 동일한 `compact|verbose` 모드 전환을 노출합니다.
- 결과는 세션 범위이므로 에이전트, 채널, 스레드, 발신자 권한 또는 모델이 바뀌면 출력도 달라질 수 있습니다.
- `/tools`에는 코어 도구, 연결된 Plugin 도구, 채널 소유 도구를 포함해 런타임에 실제로 도달 가능한 도구가 포함됩니다.

프로필 및 재정의 편집은 `/tools`를 정적 카탈로그로 취급하지 말고 Control UI Tools 패널 또는 config/catalog 표면을 사용하세요.

## 사용량 표면(어디에 무엇이 표시되는지)

- **제공자 사용량/할당량**(예: "Claude 80% left")은 사용량 추적이 활성화된 경우 현재 모델 제공자에 대해 `/status`에 표시됩니다. OpenClaw는 제공자 창을 `% left`로 정규화합니다. MiniMax의 경우 remaining-only 퍼센트 필드는 표시 전에 반전되며, `model_remains` 응답은 모델 태그가 붙은 플랜 라벨과 함께 chat-model 항목을 우선합니다.
- `/status`의 **토큰/캐시 줄**은 라이브 세션 스냅샷이 희소할 경우 최신 transcript 사용량 항목으로 대체될 수 있습니다. 기존의 0이 아닌 라이브 값이 여전히 우선하며, transcript 대체는 저장된 총계가 없거나 더 작을 때 활성 런타임 모델 라벨과 더 큰 프롬프트 지향 총계도 복구할 수 있습니다.
- **실행 대 런타임:** `/status`는 유효한 샌드박스 경로에 대해 `Execution`을 보고하고, 실제로 세션을 실행 중인 주체에 대해 `Runtime`을 보고합니다: `OpenClaw Pi Default`, `OpenAI Codex`, CLI 백엔드, 또는 ACP 백엔드.
- **응답별 토큰/비용**은 `/usage off|tokens|full`로 제어됩니다(일반 응답에 추가됨).
- `/model status`는 사용량이 아니라 **모델/인증/엔드포인트**에 관한 것입니다.

## 모델 선택 (`/model`)

`/model`은 지시어로 구현됩니다.

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

- `/model` 및 `/model list`는 간결한 번호 선택기(모델 패밀리 + 사용 가능한 제공자)를 표시합니다.
- Discord에서 `/model`과 `/models`는 제공자 및 모델 드롭다운과 Submit 단계가 있는 대화형 선택기를 엽니다.
- `/model <#>`는 해당 선택기에서 선택합니다(가능하면 현재 제공자를 우선).
- `/model status`는 구성된 제공자 엔드포인트(`baseUrl`)와 API 모드(`api`)를 포함한 자세한 보기를 표시합니다.

## 디버그 재정의

`/debug`를 사용하면 **런타임 전용** 구성 재정의(메모리, 디스크 아님)를 설정할 수 있습니다. 소유자 전용입니다. 기본적으로 비활성화되어 있으며 `commands.debug: true`로 활성화합니다.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

<Note>
재정의는 새 구성 읽기에 즉시 적용되지만 `openclaw.json`에는 기록되지 **않습니다**. 모든 재정의를 지우고 디스크의 구성으로 돌아가려면 `/debug reset`을 사용하세요.
</Note>

## Plugin trace 출력

`/trace`를 사용하면 전체 verbose 모드를 켜지 않고도 **세션 범위 Plugin trace/debug 줄**을 전환할 수 있습니다.

예시:

```text
/trace
/trace on
/trace off
```

참고:

- 인수 없는 `/trace`는 현재 세션 trace 상태를 표시합니다.
- `/trace on`은 현재 세션의 Plugin trace 줄을 활성화합니다.
- `/trace off`는 이를 다시 비활성화합니다.
- Plugin trace 줄은 `/status`와 일반 어시스턴트 응답 뒤의 후속 진단 메시지로 나타날 수 있습니다.
- `/trace`는 `/debug`를 대체하지 않습니다. `/debug`는 여전히 런타임 전용 구성 재정의를 관리합니다.
- `/trace`는 `/verbose`도 대체하지 않습니다. 일반 verbose 도구/상태 출력은 여전히 `/verbose`에 속합니다.

## 구성 업데이트

`/config`는 디스크의 구성(`openclaw.json`)에 기록합니다. 소유자 전용입니다. 기본적으로 비활성화되어 있으며 `commands.config: true`로 활성화합니다.

예시:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

<Note>
구성은 기록 전에 유효성 검사를 거치며, 잘못된 변경은 거부됩니다. `/config` 업데이트는 재시작 후에도 유지됩니다.
</Note>

## MCP 업데이트

`/mcp`는 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버 정의를 기록합니다. 소유자 전용입니다. 기본적으로 비활성화되어 있으며 `commands.mcp: true`로 활성화합니다.

예시:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

<Note>
`/mcp`는 Pi 소유 프로젝트 설정이 아니라 OpenClaw 구성에 저장합니다. 어떤 전송이 실제로 실행 가능한지는 런타임 어댑터가 결정합니다.
</Note>

## Plugin 업데이트

`/plugins`를 사용하면 운영자가 검색된 Plugin을 검사하고 구성에서 활성화 여부를 전환할 수 있습니다. 읽기 전용 흐름은 `/plugin`을 별칭으로 사용할 수 있습니다. 기본적으로 비활성화되어 있으며 `commands.plugins: true`로 활성화합니다.

예시:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

<Note>
- `/plugins list`와 `/plugins show`는 현재 워크스페이스와 디스크의 구성을 기준으로 실제 Plugin 검색을 사용합니다.
- `/plugins enable|disable`는 Plugin 구성만 업데이트하며 Plugin을 설치하거나 제거하지는 않습니다.
- 활성화/비활성화 변경 후에는 적용을 위해 Gateway를 재시작하세요.
</Note>

## 표면 참고

<AccordionGroup>
  <Accordion title="표면별 세션">
    - **텍스트 명령**은 일반 채팅 세션에서 실행됩니다(DM은 `main`을 공유하고, 그룹은 자체 세션을 가짐).
    - **네이티브 명령**은 격리된 세션을 사용합니다:
      - Discord: `agent:<agentId>:discord:slash:<userId>`
      - Slack: `agent:<agentId>:slack:slash:<userId>` (접두사는 `channels.slack.slashCommand.sessionPrefix`로 구성 가능)
      - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey`를 통해 채팅 세션을 대상으로 함)
    - **`/stop`**은 활성 채팅 세션을 대상으로 하므로 현재 실행을 중단할 수 있습니다.
  </Accordion>
  <Accordion title="Slack 세부 사항">
    `channels.slack.slashCommand`는 단일 `/openclaw` 스타일 명령용으로 여전히 지원됩니다. `commands.native`를 활성화하면 기본 제공 명령마다 Slack 슬래시 명령을 하나씩 생성해야 합니다(`/help`와 같은 이름). Slack용 명령 인수 메뉴는 ephemeral Block Kit 버튼으로 전달됩니다.

    Slack 네이티브 예외: Slack이 `/status`를 예약하므로 `/status`가 아니라 `/agentstatus`를 등록하세요. 텍스트 `/status`는 Slack 메시지에서 여전히 작동합니다.

  </Accordion>
</AccordionGroup>

## BTW 부가 질문

`/btw`는 현재 세션에 대한 빠른 **부가 질문**입니다.

일반 채팅과 달리 다음과 같습니다:

- 현재 세션을 배경 컨텍스트로 사용하고,
- 별도의 **도구 없는** 일회성 호출로 실행되며,
- 향후 세션 컨텍스트를 변경하지 않고,
- transcript 기록에 쓰이지 않으며,
- 일반 어시스턴트 메시지 대신 라이브 부가 결과로 전달됩니다.

따라서 `/btw`는 주 작업을 계속 진행하면서 일시적인 명확화가 필요할 때 유용합니다.

예시:

```text
/btw what are we doing right now?
```

전체 동작 및 클라이언트 UX 세부 사항은 [BTW Side Questions](/ko/tools/btw)를 참조하세요.

## 관련 항목

- [Creating skills](/ko/tools/creating-skills)
- [Skills](/ko/tools/skills)
- [Skills config](/ko/tools/skills-config)
