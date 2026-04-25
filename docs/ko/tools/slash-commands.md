---
read_when:
    - 채팅 명령어 사용 또는 구성하기
    - 명령 라우팅 또는 권한 디버깅하기
summary: '슬래시 명령어: 텍스트 vs 네이티브, config 및 지원되는 명령어'
title: 슬래시 명령어
x-i18n:
    generated_at: "2026-04-25T06:13:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01d8c7a30f9a7bf9ea08ec6372bf47feb5d6153859f616cb0531cb910557d17e
    source_path: tools/slash-commands.md
    workflow: 15
---

명령어는 Gateway가 처리합니다. 대부분의 명령어는 `/`로 시작하는 **독립 메시지**로 보내야 합니다.
호스트 전용 bash 채팅 명령어는 `! <cmd>`를 사용합니다(``/bash <cmd>`는 별칭).

관련된 두 가지 시스템이 있습니다:

- **명령어**: 독립적인 `/...` 메시지.
- **지시어**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`.
  - 지시어는 모델이 메시지를 보기 전에 제거됩니다.
  - 일반 채팅 메시지(지시어만 있는 메시지가 아님)에서는 “인라인 힌트”로 취급되며 세션 설정을 유지하지 않습니다.
  - 지시어만 있는 메시지(메시지에 지시어만 포함된 경우)에서는 세션에 유지되며 확인 응답을 보냅니다.
  - 지시어는 **권한이 있는 발신자**에게만 적용됩니다. `commands.allowFrom`이 설정되어 있으면 이것이 유일한
    허용 목록으로 사용됩니다. 그렇지 않으면 채널 허용 목록/페어링과 `commands.useAccessGroups`에서 인증이 옵니다.
    권한이 없는 발신자에게는 지시어가 일반 텍스트로 처리됩니다.

몇 가지 **인라인 단축키**도 있습니다(허용 목록/권한 있는 발신자만): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
이들은 즉시 실행되고, 모델이 메시지를 보기 전에 제거되며, 남은 텍스트는 정상 흐름을 계속 탑니다.

## Config

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

- `commands.text`(기본값 `true`)는 채팅 메시지에서 `/...` 파싱을 활성화합니다.
  - 네이티브 명령어가 없는 인터페이스(WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)에서는 이것을 `false`로 설정해도 텍스트 명령어가 계속 동작합니다.
- `commands.native`(기본값 `"auto"`)는 네이티브 명령어를 등록합니다.
  - 자동: Discord/Telegram에서는 켜짐, Slack에서는 꺼짐(슬래시 명령어를 추가하기 전까지), 네이티브 지원이 없는 provider에서는 무시됨.
  - provider별 재정의를 위해 `channels.discord.commands.native`, `channels.telegram.commands.native`, `channels.slack.commands.native`를 설정하세요(bool 또는 `"auto"`).
  - `false`는 시작 시 Discord/Telegram에 이전에 등록된 명령어를 제거합니다. Slack 명령어는 Slack 앱에서 관리되며 자동으로 제거되지 않습니다.
- `commands.nativeSkills`(기본값 `"auto"`)는 지원되는 경우 **Skill** 명령어를 네이티브로 등록합니다.
  - 자동: Discord/Telegram에서는 켜짐, Slack에서는 꺼짐(Slack은 Skill마다 슬래시 명령어를 만들어야 함).
  - provider별 재정의를 위해 `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, `channels.slack.commands.nativeSkills`를 설정하세요(bool 또는 `"auto"`).
- `commands.bash`(기본값 `false`)는 `! <cmd>`로 호스트 셸 명령을 실행할 수 있게 합니다(``/bash <cmd>`는 별칭이며 `tools.elevated` allowlist가 필요).
- `commands.bashForegroundMs`(기본값 `2000`)는 bash가 백그라운드 모드로 전환되기 전까지 기다리는 시간을 제어합니다(`0`이면 즉시 백그라운드로 전환).
- `commands.config`(기본값 `false`)는 `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기).
- `commands.mcp`(기본값 `false`)는 `/mcp`를 활성화합니다(`mcp.servers` 아래의 OpenClaw 관리 MCP config 읽기/쓰기).
- `commands.plugins`(기본값 `false`)는 `/plugins`를 활성화합니다(Plugin 디스커버리/상태 + 설치 + 활성화/비활성화 제어).
- `commands.debug`(기본값 `false`)는 `/debug`를 활성화합니다(런타임 전용 재정의).
- `commands.restart`(기본값 `true`)는 `/restart` 및 gateway 재시작 도구 작업을 활성화합니다.
- `commands.ownerAllowFrom`(선택 사항)은 owner 전용 명령어/도구 인터페이스에 대한 명시적 owner 허용 목록을 설정합니다. 이는 `commands.allowFrom`과 별개입니다.
- 채널별 `channels.<channel>.commands.enforceOwnerForCommands`(선택 사항, 기본값 `false`)는 해당 인터페이스에서 owner 전용 명령어 실행 시 **owner identity**를 요구합니다. `true`이면 발신자는 해석된 owner 후보(예: `commands.ownerAllowFrom` 항목 또는 provider 네이티브 owner 메타데이터)와 일치하거나 내부 메시지 채널에서 내부 `operator.admin` 범위를 가져야 합니다. 채널 `allowFrom`의 와일드카드 항목이나 비어 있거나 해석할 수 없는 owner 후보 목록은 **충분하지 않으며** — owner 전용 명령어는 해당 채널에서 fail closed됩니다. owner 전용 명령어를 `ownerAllowFrom`과 표준 명령어 허용 목록으로만 제어하고 싶다면 이것을 끄세요.
- `commands.ownerDisplay`는 시스템 프롬프트에서 owner ID가 어떻게 표시되는지를 제어합니다: `raw` 또는 `hash`.
- `commands.ownerDisplaySecret`는 `commands.ownerDisplay="hash"`일 때 사용되는 HMAC secret을 선택적으로 설정합니다.
- `commands.allowFrom`(선택 사항)은 명령어 인증을 위한 provider별 허용 목록을 설정합니다. 구성되면 이것이
  명령어와 지시어에 대한 유일한 인증 소스가 되며(채널 허용 목록/페어링과 `commands.useAccessGroups`
  는 무시됨), `"*"`를 전역 기본값으로 사용할 수 있고 provider별 키가 이를 재정의합니다.
- `commands.useAccessGroups`(기본값 `true`)는 `commands.allowFrom`이 설정되지 않았을 때 명령어에 허용 목록/정책을 적용합니다.

## 명령어 목록

현재 source-of-truth:

- 코어 내장 명령어는 `src/auto-reply/commands-registry.shared.ts`에서 옴
- 생성된 dock 명령어는 `src/auto-reply/commands-registry.data.ts`에서 옴
- Plugin 명령어는 Plugin의 `registerCommand()` 호출에서 옴
- gateway에서 실제 사용 가능 여부는 여전히 config 플래그, 채널 인터페이스, 설치/활성화된 Plugin에 따라 달라짐

### 코어 내장 명령어

현재 사용할 수 있는 내장 명령어:

- `/new [model]`는 새 세션을 시작합니다. `/reset`은 재설정 별칭입니다.
- `/reset soft [message]`는 현재 transcript를 유지하고, 재사용된 CLI backend 세션 ID를 제거한 뒤, 시작/시스템 프롬프트 로딩을 제자리에서 다시 실행합니다.
- `/compact [instructions]`는 세션 컨텍스트를 Compaction합니다. [/concepts/compaction](/ko/concepts/compaction)을 참조하세요.
- `/stop`은 현재 실행을 중단합니다.
- `/session idle <duration|off>` 및 `/session max-age <duration|off>`는 스레드 바인딩 만료를 관리합니다.
- `/think <level>`은 thinking 수준을 설정합니다. 옵션은 활성 모델의 provider 프로필에서 오며, 일반적인 수준은 `off`, `minimal`, `low`, `medium`, `high`이고, `xhigh`, `adaptive`, `max` 또는 이진 `on` 같은 커스텀 수준은 지원되는 경우에만 제공됩니다. 별칭: `/thinking`, `/t`.
- `/verbose on|off|full`은 verbose 출력을 전환합니다. 별칭: `/v`.
- `/trace on|off`는 현재 세션의 Plugin trace 출력을 전환합니다.
- `/fast [status|on|off]`는 fast 모드를 표시하거나 설정합니다.
- `/reasoning [on|off|stream]`은 reasoning 표시 여부를 전환합니다. 별칭: `/reason`.
- `/elevated [on|off|ask|full]`은 elevated 모드를 전환합니다. 별칭: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`는 exec 기본값을 표시하거나 설정합니다.
- `/model [name|#|status]`는 모델을 표시하거나 설정합니다.
- `/models [provider] [page] [limit=<n>|size=<n>|all]`는 provider 또는 provider의 모델을 나열합니다.
- `/queue <mode>`는 queue 동작(`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`)과 `debounce:2s cap:25 drop:summarize` 같은 옵션을 관리합니다.
- `/help`는 짧은 도움말 요약을 표시합니다.
- `/commands`는 생성된 명령어 카탈로그를 표시합니다.
- `/tools [compact|verbose]`는 현재 에이전트가 지금 사용할 수 있는 항목을 보여줍니다.
- `/status`는 사용 가능한 경우 `Execution`/`Runtime` 레이블과 provider 사용량/할당량을 포함한 실행/런타임 상태를 표시합니다.
- `/tasks`는 현재 세션의 활성/최근 백그라운드 작업을 나열합니다.
- `/context [list|detail|json]`은 컨텍스트가 어떻게 assemble되는지 설명합니다.
- `/export-session [path]`는 현재 세션을 HTML로 내보냅니다. 별칭: `/export`.
- `/export-trajectory [path]`는 현재 세션용 JSONL [trajectory bundle](/ko/tools/trajectory)을 내보냅니다. 별칭: `/trajectory`.
- `/whoami`는 발신자 ID를 표시합니다. 별칭: `/id`.
- `/skill <name> [input]`은 이름으로 Skill을 실행합니다.
- `/allowlist [list|add|remove] ...`는 allowlist 항목을 관리합니다. 텍스트 전용입니다.
- `/approve <id> <decision>`은 exec 승인 프롬프트를 처리합니다.
- `/btw <question>`은 향후 세션 컨텍스트를 바꾸지 않고 옆질문을 합니다. [/tools/btw](/ko/tools/btw)를 참조하세요.
- `/subagents list|kill|log|info|send|steer|spawn`은 현재 세션의 서브에이전트 실행을 관리합니다.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help`는 ACP 세션 및 런타임 옵션을 관리합니다.
- `/focus <target>`은 현재 Discord 스레드 또는 Telegram 토픽/대화를 세션 대상에 바인딩합니다.
- `/unfocus`는 현재 바인딩을 제거합니다.
- `/agents`는 현재 세션의 스레드 바인딩 에이전트를 나열합니다.
- `/kill <id|#|all>`은 실행 중인 서브에이전트 하나 또는 모두를 중단합니다.
- `/steer <id|#> <message>`는 실행 중인 서브에이전트에 steering을 보냅니다. 별칭: `/tell`.
- `/config show|get|set|unset`은 `openclaw.json`을 읽거나 씁니다. owner 전용입니다. `commands.config: true`가 필요합니다.
- `/mcp show|get|set|unset`은 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버 config를 읽거나 씁니다. owner 전용입니다. `commands.mcp: true`가 필요합니다.
- `/plugins list|inspect|show|get|install|enable|disable`는 Plugin 상태를 검사하거나 변경합니다. `/plugin`은 별칭입니다. 쓰기는 owner 전용입니다. `commands.plugins: true`가 필요합니다.
- `/debug show|set|unset|reset`은 런타임 전용 config 재정의를 관리합니다. owner 전용입니다. `commands.debug: true`가 필요합니다.
- `/usage off|tokens|full|cost`는 응답별 사용량 푸터를 제어하거나 로컬 비용 요약을 출력합니다.
- `/tts on|off|status|provider|limit|summary|audio|help`는 TTS를 제어합니다. [/tools/tts](/ko/tools/tts)를 참조하세요.
- `/restart`는 활성화된 경우 OpenClaw를 재시작합니다. 기본값은 활성화이며, 비활성화하려면 `commands.restart: false`를 설정하세요.
- `/activation mention|always`는 그룹 활성화 모드를 설정합니다.
- `/send on|off|inherit`는 전송 정책을 설정합니다. owner 전용입니다.
- `/bash <command>`는 호스트 셸 명령을 실행합니다. 텍스트 전용입니다. 별칭: `! <command>`. `commands.bash: true` 및 `tools.elevated` allowlist가 필요합니다.
- `!poll [sessionId]`는 백그라운드 bash 작업을 확인합니다.
- `!stop [sessionId]`는 백그라운드 bash 작업을 중지합니다.

### 생성된 dock 명령어

Dock 명령어는 네이티브 명령어를 지원하는 채널 Plugin에서 생성됩니다. 현재 번들된 집합:

- `/dock-discord` (별칭: `/dock_discord`)
- `/dock-mattermost` (별칭: `/dock_mattermost`)
- `/dock-slack` (별칭: `/dock_slack`)
- `/dock-telegram` (별칭: `/dock_telegram`)

### 번들 Plugin 명령어

번들 Plugin은 추가 슬래시 명령어를 더할 수 있습니다. 이 repo에 현재 번들된 명령어:

- `/dreaming [on|off|status|help]`는 메모리 Dreaming을 전환합니다. [Dreaming](/ko/concepts/dreaming)을 참조하세요.
- `/pair [qr|status|pending|approve|cleanup|notify]`는 디바이스 페어링/setup 흐름을 관리합니다. [Pairing](/ko/channels/pairing)을 참조하세요.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`는 고위험 휴대폰 node 명령을 일시적으로 arm합니다.
- `/voice status|list [limit]|set <voiceId|name>`는 Talk 음성 config를 관리합니다. Discord에서 네이티브 명령어 이름은 `/talkvoice`입니다.
- `/card ...`는 LINE rich card 프리셋을 보냅니다. [LINE](/ko/channels/line)을 참조하세요.
- `/codex status|models|threads|resume|compact|review|account|mcp|skills`는 번들 Codex app-server harness를 검사하고 제어합니다. [Codex Harness](/ko/plugins/codex-harness)를 참조하세요.
- QQBot 전용 명령어:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 동적 Skill 명령어

사용자가 호출할 수 있는 Skills도 슬래시 명령어로 노출됩니다:

- `/skill <name> [input]`는 일반 진입점으로 항상 동작합니다.
- Skill/Plugin이 등록하면 `/prose` 같은 직접 명령어로도 나타날 수 있습니다.
- 네이티브 Skill 명령어 등록은 `commands.nativeSkills`와 `channels.<provider>.commands.nativeSkills`로 제어됩니다.

참고:

- 명령어는 명령어와 인수 사이에 선택적으로 `:`를 사용할 수 있습니다(예: `/think: high`, `/send: on`, `/help:`).
- `/new <model>`은 모델 별칭, `provider/model`, 또는 provider 이름(fuzzy match)을 받습니다. 일치하는 항목이 없으면 해당 텍스트는 메시지 본문으로 처리됩니다.
- 전체 provider 사용량 상세 정보는 `openclaw status --usage`를 사용하세요.
- `/allowlist add|remove`는 `commands.config=true`가 필요하며 채널 `configWrites`를 따릅니다.
- 멀티 계정 채널에서 config 대상 `/allowlist --account <id>` 및 `/config set channels.<provider>.accounts.<id>...`도 대상 계정의 `configWrites`를 따릅니다.
- `/usage`는 응답별 사용량 푸터를 제어합니다. `/usage cost`는 OpenClaw 세션 로그에서 로컬 비용 요약을 출력합니다.
- `/restart`는 기본적으로 활성화됩니다. 비활성화하려면 `commands.restart: false`를 설정하세요.
- `/plugins install <spec>`는 `openclaw plugins install`과 동일한 Plugin spec을 받습니다: 로컬 경로/아카이브, npm 패키지, 또는 `clawhub:<pkg>`.
- `/plugins enable|disable`는 Plugin config를 업데이트하며 재시작을 요구할 수 있습니다.
- Discord 전용 네이티브 명령어: `/vc join|leave|status`는 음성 채널을 제어합니다(`channels.discord.voice`와 네이티브 명령어 필요. 텍스트로는 사용 불가).
- Discord 스레드 바인딩 명령어(`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`)는 유효한 스레드 바인딩이 활성화되어 있어야 합니다(`session.threadBindings.enabled` 및/또는 `channels.discord.threadBindings.enabled`).
- ACP 명령어 참조 및 런타임 동작: [ACP Agents](/ko/tools/acp-agents).
- `/verbose`는 디버깅과 추가 가시성을 위한 것입니다. 일반 사용에서는 **꺼 두는 것**이 좋습니다.
- `/trace`는 `/verbose`보다 범위가 좁습니다. Plugin 소유 trace/debug 줄만 표시하고 일반 verbose 도구 출력은 끈 상태로 유지합니다.
- `/fast on|off`는 세션 재정의를 유지합니다. 이를 지우고 config 기본값으로 돌아가려면 Sessions UI의 `inherit` 옵션을 사용하세요.
- `/fast`는 provider별 동작입니다: OpenAI/OpenAI Codex는 네이티브 Responses 엔드포인트에서 이를 `service_tier=priority`로 매핑하고, `api.anthropic.com`으로 전송되는 OAuth 인증 트래픽을 포함한 직접 public Anthropic 요청은 이를 `service_tier=auto` 또는 `standard_only`로 매핑합니다. [OpenAI](/ko/providers/openai) 및 [Anthropic](/ko/providers/anthropic)을 참조하세요.
- 도구 실패 요약은 관련이 있을 때 계속 표시되지만, 자세한 실패 텍스트는 `/verbose`가 `on` 또는 `full`일 때만 포함됩니다.
- `/reasoning`, `/verbose`, `/trace`는 그룹 환경에서 위험할 수 있습니다: 노출할 의도가 없던 내부 reasoning, 도구 출력, Plugin 진단을 드러낼 수 있습니다. 특히 그룹 채팅에서는 꺼 두는 것이 좋습니다.
- `/model`은 새 세션 모델을 즉시 유지합니다.
- 에이전트가 유휴 상태라면 다음 실행에서 즉시 사용됩니다.
- 이미 실행 중인 작업이 있으면, OpenClaw는 라이브 전환을 보류 상태로 표시하고 깨끗한 재시도 지점에서만 새 모델로 재시작합니다.
- 도구 활동이나 응답 출력이 이미 시작된 경우, 보류 중인 전환은 이후 재시도 기회나 다음 사용자 턴까지 대기할 수 있습니다.
- **빠른 경로:** 허용 목록에 있는 발신자의 명령어 전용 메시지는 즉시 처리됩니다(queue + 모델 우회).
- **그룹 멘션 게이팅:** 허용 목록에 있는 발신자의 명령어 전용 메시지는 멘션 요구 사항을 우회합니다.
- **인라인 단축키(허용 목록 발신자만):** 특정 명령어는 일반 메시지 안에 포함되어도 동작하며, 모델이 나머지 텍스트를 보기 전에 제거됩니다.
  - 예시: `hey /status`는 상태 응답을 트리거하고, 남은 텍스트는 정상 흐름을 계속 탑니다.
- 현재 대상: `/help`, `/commands`, `/status`, `/whoami` (`/id`).
- 권한 없는 명령어 전용 메시지는 조용히 무시되며, 인라인 `/...` 토큰은 일반 텍스트로 처리됩니다.
- **Skill 명령어:** `user-invocable` Skills는 슬래시 명령어로 노출됩니다. 이름은 `a-z0-9_`로 정규화되며(최대 32자), 충돌 시 숫자 접미사가 붙습니다(예: `_2`).
  - `/skill <name> [input]`은 이름으로 Skill을 실행합니다(Skill별 명령어가 네이티브 명령어 제한에 걸릴 때 유용).
  - 기본적으로 Skill 명령어는 일반 요청으로 모델에 전달됩니다.
  - Skill은 선택적으로 `command-dispatch: tool`을 선언해 명령어를 직접 도구로 라우팅할 수 있습니다(결정적이며 모델 없음).
  - 예시: `/prose` (OpenProse Plugin) — [OpenProse](/ko/prose) 참조.
- **네이티브 명령어 인수:** Discord는 동적 옵션에 autocomplete를 사용하며(필수 인수를 생략하면 버튼 메뉴도 사용), Telegram과 Slack은 명령어가 선택지를 지원하고 인수를 생략하면 버튼 메뉴를 표시합니다.

## `/tools`

`/tools`는 config 질문이 아니라 런타임 질문에 답합니다: **이 대화에서
이 에이전트가 지금 사용할 수 있는 것**이 무엇인가입니다.

- 기본 `/tools`는 간결하며 빠르게 훑어보기에 최적화되어 있습니다.
- `/tools verbose`는 짧은 설명을 추가합니다.
- 인수를 지원하는 네이티브 명령어 인터페이스는 동일한 `compact|verbose` 모드 전환을 노출합니다.
- 결과는 세션 범위이므로, 에이전트, 채널, 스레드, 발신자 권한, 모델이 바뀌면
  출력도 바뀔 수 있습니다.
- `/tools`에는 실제 런타임에서 접근 가능한 도구가 포함되며, 여기에는 코어 도구, 연결된
  Plugin 도구, 채널 소유 도구가 포함됩니다.

프로필 및 재정의 편집은 `/tools`를 정적 카탈로그처럼 취급하지 말고 Control UI Tools 패널 또는 config/catalog 인터페이스를 사용하세요.

## 사용량 인터페이스(무엇이 어디에 표시되는가)

- **Provider 사용량/할당량**(예: “Claude 80% left”)은 사용량 추적이 활성화된 경우 현재 모델 provider에 대해 `/status`에 표시됩니다. OpenClaw는 provider 기간을 `% left`로 정규화합니다. MiniMax의 경우 remaining-only 퍼센트 필드는 표시 전에 반전되며, `model_remains` 응답은 모델 태그가 붙은 플랜 레이블과 함께 채팅 모델 항목을 우선합니다.
- `/status`의 **토큰/캐시 줄**은 라이브 세션 스냅샷이 희소할 때 최신 transcript 사용량 항목으로 fallback할 수 있습니다. 기존의 0이 아닌 라이브 값이 여전히 우선하며, transcript fallback은 저장된 총합이 없거나 더 작을 때 활성 런타임 모델 레이블과 더 큰 prompt 지향 총합도 복구할 수 있습니다.
- **Execution vs runtime:** `/status`는 유효한 sandbox 경로에 대해 `Execution`을, 세션을 실제로 실행하는 주체에 대해 `Runtime`을 보고합니다: `OpenClaw Pi Default`, `OpenAI Codex`, CLI backend, 또는 ACP backend.
- **응답별 토큰/비용**은 `/usage off|tokens|full`로 제어됩니다(일반 응답에 추가됨).
- `/model status`는 사용량이 아니라 **모델/auth/엔드포인트**에 관한 것입니다.

## 모델 선택(`/model`)

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

- `/model`과 `/model list`는 간결한 번호 선택기(모델 계열 + 사용 가능한 provider)를 표시합니다.
- Discord에서 `/model`과 `/models`는 provider 및 모델 드롭다운, Submit 단계가 포함된 인터랙티브 선택기를 엽니다.
- `/model <#>`는 해당 선택기에서 선택합니다(가능하면 현재 provider를 우선).
- `/model status`는 자세한 보기를 표시하며, 사용 가능한 경우 구성된 provider 엔드포인트(`baseUrl`)와 API 모드(`api`)도 포함합니다.

## 디버그 재정의

`/debug`는 **런타임 전용** config 재정의(메모리, 디스크 아님)를 설정할 수 있게 합니다. owner 전용입니다. 기본적으로 비활성화되어 있으며 `commands.debug: true`로 활성화하세요.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

참고:

- 재정의는 새 config 읽기에 즉시 적용되지만 `openclaw.json`에는 쓰지 않습니다.
- 모든 재정의를 지우고 디스크상의 config로 돌아가려면 `/debug reset`을 사용하세요.

## Plugin trace 출력

`/trace`는 전체 verbose 모드를 켜지 않고도 **세션 범위 Plugin trace/debug 줄**을 전환할 수 있게 합니다.

예시:

```text
/trace
/trace on
/trace off
```

참고:

- 인수 없이 `/trace`를 실행하면 현재 세션 trace 상태를 표시합니다.
- `/trace on`은 현재 세션의 Plugin trace 줄을 활성화합니다.
- `/trace off`는 다시 비활성화합니다.
- Plugin trace 줄은 `/status`에 표시되거나 일반 assistant 응답 뒤의 후속 진단 메시지로 나타날 수 있습니다.
- `/trace`는 `/debug`를 대체하지 않습니다. `/debug`는 여전히 런타임 전용 config 재정의를 관리합니다.
- `/trace`는 `/verbose`를 대체하지 않습니다. 일반 verbose 도구/상태 출력은 여전히 `/verbose`에 속합니다.

## Config 업데이트

`/config`는 디스크상의 config(`openclaw.json`)에 기록합니다. owner 전용입니다. 기본적으로 비활성화되어 있으며 `commands.config: true`로 활성화하세요.

예시:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

참고:

- 쓰기 전에 config가 검증되며 잘못된 변경은 거부됩니다.
- `/config` 업데이트는 재시작 후에도 유지됩니다.

## MCP 업데이트

`/mcp`는 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버 정의를 기록합니다. owner 전용입니다. 기본적으로 비활성화되어 있으며 `commands.mcp: true`로 활성화하세요.

예시:

```text
/mcp show
/mcp show context7
/mcp set context7={"command":"uvx","args":["context7-mcp"]}
/mcp unset context7
```

참고:

- `/mcp`는 Pi 소유 프로젝트 설정이 아니라 OpenClaw config에 저장합니다.
- 어떤 전송 방식이 실제로 실행 가능한지는 런타임 adapter가 결정합니다.

## Plugin 업데이트

`/plugins`는 운영자가 발견된 Plugin을 검사하고 config에서 활성화 여부를 전환할 수 있게 합니다. 읽기 전용 흐름에서는 `/plugin`을 별칭으로 사용할 수 있습니다. 기본적으로 비활성화되어 있으며 `commands.plugins: true`로 활성화하세요.

예시:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

참고:

- `/plugins list`와 `/plugins show`는 현재 워크스페이스와 디스크상의 config에 대해 실제 Plugin 디스커버리를 사용합니다.
- `/plugins enable|disable`는 Plugin config만 업데이트하며 Plugin을 설치하거나 제거하지는 않습니다.
- 활성화/비활성화 변경 후에는 적용을 위해 gateway를 재시작하세요.

## 인터페이스 참고

- **텍스트 명령어**는 일반 채팅 세션에서 실행됩니다(DM은 `main` 공유, 그룹은 자체 세션 보유).
- **네이티브 명령어**는 격리된 세션을 사용합니다:
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (접두사는 `channels.slack.slashCommand.sessionPrefix`로 구성 가능)
  - Telegram: `telegram:slash:<userId>` (`CommandTargetSessionKey`를 통해 채팅 세션을 대상으로 삼음)
- **`/stop`**은 현재 실행을 중단할 수 있도록 활성 채팅 세션을 대상으로 합니다.
- **Slack:** `channels.slack.slashCommand`는 단일 `/openclaw` 스타일 명령어에 대해 계속 지원됩니다. `commands.native`를 활성화하면 내장 명령어마다 하나의 Slack 슬래시 명령어를 생성해야 합니다(`/help`와 동일한 이름). Slack의 명령어 인수 메뉴는 ephemeral Block Kit 버튼으로 전달됩니다.
  - Slack 네이티브 예외: Slack이 `/status`를 예약어로 사용하므로 `/status`가 아니라 `/agentstatus`를 등록하세요. 텍스트 `/status`는 여전히 Slack 메시지에서 동작합니다.

## BTW 옆질문

`/btw`는 현재 세션에 대한 빠른 **옆질문**입니다.

일반 채팅과 달리:

- 현재 세션을 배경 컨텍스트로 사용하고,
- 별도의 **도구 없는** 원샷 호출로 실행되며,
- 향후 세션 컨텍스트를 변경하지 않고,
- transcript 기록에 쓰이지 않으며,
- 일반 assistant 메시지가 아니라 라이브 side result로 전달됩니다.

따라서 `/btw`는 메인
작업을 계속 유지하면서 임시 설명이 필요할 때 유용합니다.

예시:

```text
/btw what are we doing right now?
```

전체 동작과 클라이언트 UX 세부 정보는 [BTW Side Questions](/ko/tools/btw)를 참조하세요.

## 관련 항목

- [Skills](/ko/tools/skills)
- [Skills config](/ko/tools/skills-config)
- [Skills 만들기](/ko/tools/creating-skills)
