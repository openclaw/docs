---
read_when:
    - 채팅 명령어 사용 또는 구성하기
    - 명령어 라우팅 또는 권한 문제를 디버깅하기
summary: '슬래시 명령: 텍스트 방식과 네이티브 방식, 구성, 그리고 지원되는 명령어'
title: 슬래시 명령어
x-i18n:
    generated_at: "2026-04-11T02:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cc346361c3b1a63aae9ec0f28706f4cb0b866b6c858a3999101f6927b923b4a
    source_path: tools/slash-commands.md
    workflow: 15
---

# 슬래시 명령어

명령은 Gateway가 처리합니다. 대부분의 명령은 `/`로 시작하는 **독립 실행형** 메시지로 보내야 합니다.
호스트 전용 bash 채팅 명령은 `! <cmd>`를 사용합니다(` /bash <cmd>`는 별칭).

서로 관련된 두 가지 시스템이 있습니다.

- **명령어**: 독립 실행형 `/...` 메시지
- **지시어**: `/think`, `/fast`, `/verbose`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue`
  - 지시어는 모델이 메시지를 보기 전에 제거됩니다.
  - 일반 채팅 메시지(지시어만 있는 메시지가 아님)에서는 “인라인 힌트”로 처리되며 세션 설정을 유지하지 않습니다.
  - 지시어만 있는 메시지(메시지가 지시어만 포함)에서는 세션에 유지되고 확인 응답을 보냅니다.
  - 지시어는 **권한이 있는 발신자**에게만 적용됩니다. `commands.allowFrom`이 설정되어 있으면 이것이 유일하게 사용되는
    allowlist입니다. 그렇지 않으면 권한 부여는 채널 allowlist/페어링과 `commands.useAccessGroups`에서 옵니다.
    권한이 없는 발신자에게는 지시어가 일반 텍스트로 처리됩니다.

몇 가지 **인라인 바로가기**도 있습니다(allowlist/권한 있는 발신자 전용): `/help`, `/commands`, `/status`, `/whoami` (`/id`).
이들은 즉시 실행되고, 모델이 메시지를 보기 전에 제거되며, 나머지 텍스트는 일반 흐름으로 계속 전달됩니다.

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

- `commands.text`(기본값 `true`)는 채팅 메시지에서 `/...` 파싱을 활성화합니다.
  - 네이티브 명령이 없는 표면(WhatsApp/WebChat/Signal/iMessage/Google Chat/Microsoft Teams)에서는 이를 `false`로 설정해도 텍스트 명령은 계속 작동합니다.
- `commands.native`(기본값 `"auto"`)는 네이티브 명령을 등록합니다.
  - Auto: Discord/Telegram에서는 켜짐, Slack에서는 꺼짐(슬래시 명령을 추가하기 전까지), 네이티브 지원이 없는 provider에서는 무시됩니다.
  - provider별 재정의에는 `channels.discord.commands.native`, `channels.telegram.commands.native`, 또는 `channels.slack.commands.native`를 설정하세요(bool 또는 `"auto"`).
  - `false`는 시작 시 Discord/Telegram에서 이전에 등록된 명령을 지웁니다. Slack 명령은 Slack 앱에서 관리되며 자동으로 제거되지 않습니다.
- `commands.nativeSkills`(기본값 `"auto"`)는 지원되는 경우 **Skill** 명령을 네이티브로 등록합니다.
  - Auto: Discord/Telegram에서는 켜짐, Slack에서는 꺼짐(Slack은 Skill마다 슬래시 명령을 만들어야 함).
  - provider별 재정의에는 `channels.discord.commands.nativeSkills`, `channels.telegram.commands.nativeSkills`, 또는 `channels.slack.commands.nativeSkills`를 설정하세요(bool 또는 `"auto"`).
- `commands.bash`(기본값 `false`)는 `! <cmd>`로 호스트 셸 명령을 실행할 수 있게 합니다(` /bash <cmd>`는 별칭이며 `tools.elevated` allowlist가 필요).
- `commands.bashForegroundMs`(기본값 `2000`)는 bash가 백그라운드 모드로 전환되기 전에 얼마나 기다릴지 제어합니다(`0`이면 즉시 백그라운드로 전환).
- `commands.config`(기본값 `false`)는 `/config`를 활성화합니다(`openclaw.json` 읽기/쓰기).
- `commands.mcp`(기본값 `false`)는 `/mcp`를 활성화합니다(`mcp.servers` 아래 OpenClaw 관리 MCP config 읽기/쓰기).
- `commands.plugins`(기본값 `false`)는 `/plugins`를 활성화합니다(플러그인 검색/상태 및 설치 + 활성화/비활성화 제어).
- `commands.debug`(기본값 `false`)는 `/debug`를 활성화합니다(런타임 전용 재정의).
- `commands.restart`(기본값 `true`)는 `/restart`와 gateway 재시작 도구 작업을 활성화합니다.
- `commands.ownerAllowFrom`(선택 사항)은 owner 전용 명령/도구 표면을 위한 명시적 owner allowlist를 설정합니다. 이는 `commands.allowFrom`과 별개입니다.
- `commands.ownerDisplay`는 시스템 프롬프트에서 owner id가 표시되는 방식을 제어합니다: `raw` 또는 `hash`.
- `commands.ownerDisplaySecret`는 `commands.ownerDisplay="hash"`일 때 사용되는 HMAC secret을 선택적으로 설정합니다.
- `commands.allowFrom`(선택 사항)은 명령 권한 부여를 위한 provider별 allowlist를 설정합니다. 구성된 경우, 이것이 명령과 지시어에 대한
  유일한 권한 부여 소스가 되며(채널 allowlist/페어링과 `commands.useAccessGroups`는 무시됨). 전역 기본값에는 `"*"`를 사용하고, provider별 키가 이를 재정의합니다.
- `commands.useAccessGroups`(기본값 `true`)는 `commands.allowFrom`이 설정되지 않았을 때 명령에 대해 allowlist/정책을 강제합니다.

## 명령 목록

현재 source-of-truth:

- core 내장은 `src/auto-reply/commands-registry.shared.ts`에서 옵니다
- 생성된 dock 명령은 `src/auto-reply/commands-registry.data.ts`에서 옵니다
- 플러그인 명령은 플러그인의 `registerCommand()` 호출에서 옵니다
- 실제로 gateway에서 사용 가능한지는 여전히 config 플래그, 채널 표면, 설치/활성화된 플러그인에 따라 달라집니다

### core 내장 명령

현재 사용 가능한 내장 명령:

- `/new [model]`은 새 세션을 시작합니다. `/reset`은 reset 별칭입니다.
- `/compact [instructions]`는 세션 컨텍스트를 압축합니다. [/concepts/compaction](/ko/concepts/compaction)을 참조하세요.
- `/stop`은 현재 실행을 중단합니다.
- `/session idle <duration|off>` 및 `/session max-age <duration|off>`는 thread-binding 만료를 관리합니다.
- `/think <off|minimal|low|medium|high|xhigh>`는 thinking 수준을 설정합니다. 별칭: `/thinking`, `/t`.
- `/verbose on|off|full`은 verbose 출력을 전환합니다. 별칭: `/v`.
- `/fast [status|on|off]`는 fast mode를 표시하거나 설정합니다.
- `/reasoning [on|off|stream]`은 reasoning 가시성을 전환합니다. 별칭: `/reason`.
- `/elevated [on|off|ask|full]`는 elevated mode를 전환합니다. 별칭: `/elev`.
- `/exec host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>`는 exec 기본값을 표시하거나 설정합니다.
- `/model [name|#|status]`는 모델을 표시하거나 설정합니다.
- `/models [provider] [page] [limit=<n>|size=<n>|all]`는 provider 또는 해당 provider의 모델을 나열합니다.
- `/queue <mode>`는 queue 동작(`steer`, `interrupt`, `followup`, `collect`, `steer-backlog`)과 `debounce:2s cap:25 drop:summarize` 같은 옵션을 관리합니다.
- `/help`는 짧은 도움말 요약을 표시합니다.
- `/commands`는 생성된 명령 카탈로그를 표시합니다.
- `/tools [compact|verbose]`는 현재 에이전트가 지금 사용할 수 있는 항목을 표시합니다.
- `/status`는 사용 가능한 경우 provider 사용량/할당량을 포함한 런타임 상태를 표시합니다.
- `/tasks`는 현재 세션의 활성/최근 백그라운드 작업을 나열합니다.
- `/context [list|detail|json]`는 컨텍스트가 어떻게 조립되는지 설명합니다.
- `/export-session [path]`는 현재 세션을 HTML로 내보냅니다. 별칭: `/export`.
- `/whoami`는 발신자 id를 표시합니다. 별칭: `/id`.
- `/skill <name> [input]`은 이름으로 Skills를 실행합니다.
- `/allowlist [list|add|remove] ...`는 allowlist 엔트리를 관리합니다. 텍스트 전용.
- `/approve <id> <decision>`은 exec 승인 프롬프트를 처리합니다.
- `/btw <question>`은 향후 세션 컨텍스트를 바꾸지 않고 옆질문을 합니다. [/tools/btw](/ko/tools/btw)를 참조하세요.
- `/subagents list|kill|log|info|send|steer|spawn`은 현재 세션의 sub-agent 실행을 관리합니다.
- `/acp spawn|cancel|steer|close|sessions|status|set-mode|set|cwd|permissions|timeout|model|reset-options|doctor|install|help`는 ACP 세션과 런타임 옵션을 관리합니다.
- `/focus <target>`은 현재 Discord thread 또는 Telegram topic/conversation을 세션 대상에 바인딩합니다.
- `/unfocus`는 현재 바인딩을 제거합니다.
- `/agents`는 현재 세션의 thread-bound 에이전트를 나열합니다.
- `/kill <id|#|all>`은 실행 중인 sub-agent 하나 또는 모두를 중단합니다.
- `/steer <id|#> <message>`는 실행 중인 sub-agent에 조정 메시지를 보냅니다. 별칭: `/tell`.
- `/config show|get|set|unset`은 `openclaw.json`을 읽거나 씁니다. owner 전용. `commands.config: true` 필요.
- `/mcp show|get|set|unset`은 `mcp.servers` 아래 OpenClaw 관리 MCP 서버 config를 읽거나 씁니다. owner 전용. `commands.mcp: true` 필요.
- `/plugins list|inspect|show|get|install|enable|disable`는 플러그인 상태를 조회하거나 변경합니다. `/plugin`은 별칭입니다. 쓰기는 owner 전용. `commands.plugins: true` 필요.
- `/debug show|set|unset|reset`은 런타임 전용 config 재정의를 관리합니다. owner 전용. `commands.debug: true` 필요.
- `/usage off|tokens|full|cost`는 응답별 사용량 footer를 제어하거나 로컬 비용 요약을 출력합니다.
- `/tts on|off|status|provider|limit|summary|audio|help`는 TTS를 제어합니다. [/tools/tts](/ko/tools/tts)를 참조하세요.
- `/restart`는 활성화된 경우 OpenClaw를 재시작합니다. 기본값: 활성화됨. 비활성화하려면 `commands.restart: false`를 설정하세요.
- `/activation mention|always`는 그룹 활성화 모드를 설정합니다.
- `/send on|off|inherit`는 send 정책을 설정합니다. owner 전용.
- `/bash <command>`는 호스트 셸 명령을 실행합니다. 텍스트 전용. 별칭: `! <command>`. `commands.bash: true`와 `tools.elevated` allowlist가 필요합니다.
- `!poll [sessionId]`는 백그라운드 bash 작업을 확인합니다.
- `!stop [sessionId]`는 백그라운드 bash 작업을 중지합니다.

### 생성된 dock 명령

Dock 명령은 네이티브 명령 지원이 있는 채널 플러그인에서 생성됩니다. 현재 번들 세트:

- `/dock-discord` (별칭: `/dock_discord`)
- `/dock-mattermost` (별칭: `/dock_mattermost`)
- `/dock-slack` (별칭: `/dock_slack`)
- `/dock-telegram` (별칭: `/dock_telegram`)

### 번들 플러그인 명령

번들 플러그인은 더 많은 슬래시 명령을 추가할 수 있습니다. 이 리포지토리의 현재 번들 명령:

- `/dreaming [on|off|status|help]`는 memory dreaming을 전환합니다. [Dreaming](/ko/concepts/dreaming)을 참조하세요.
- `/pair [qr|status|pending|approve|cleanup|notify]`는 디바이스 페어링/설정 흐름을 관리합니다. [Pairing](/ko/channels/pairing)을 참조하세요.
- `/phone status|arm <camera|screen|writes|all> [duration]|disarm`은 고위험 phone node 명령을 일시적으로 활성화합니다.
- `/voice status|list [limit]|set <voiceId|name>`는 Talk 음성 config를 관리합니다. Discord에서 네이티브 명령 이름은 `/talkvoice`입니다.
- `/card ...`는 LINE 리치 카드 preset을 전송합니다. [LINE](/ko/channels/line)을 참조하세요.
- `/codex status|models|threads|resume|compact|review|account|mcp|skills`는 번들 Codex app-server harness를 조회하고 제어합니다. [Codex Harness](/ko/plugins/codex-harness)를 참조하세요.
- QQBot 전용 명령:
  - `/bot-ping`
  - `/bot-version`
  - `/bot-help`
  - `/bot-upgrade`
  - `/bot-logs`

### 동적 Skill 명령

사용자가 호출할 수 있는 Skills도 슬래시 명령으로 노출됩니다.

- `/skill <name> [input]`는 항상 일반 진입점으로 작동합니다.
- Skill/플러그인이 등록하면 `/prose` 같은 직접 명령으로도 나타날 수 있습니다.
- 네이티브 Skill 명령 등록은 `commands.nativeSkills` 및 `channels.<provider>.commands.nativeSkills`로 제어됩니다.

참고 사항:

- 명령은 명령과 인자 사이에 선택적으로 `:`를 받을 수 있습니다(예: `/think: high`, `/send: on`, `/help:`).
- `/new <model>`은 모델 alias, `provider/model`, 또는 provider 이름(fuzzy match)을 받을 수 있습니다. 일치 항목이 없으면 해당 텍스트는 메시지 본문으로 처리됩니다.
- 전체 provider 사용량 세부 내역은 `openclaw status --usage`를 사용하세요.
- `/allowlist add|remove`는 `commands.config=true`가 필요하며 채널 `configWrites`를 따릅니다.
- 다중 계정 채널에서 config 대상 `/allowlist --account <id>` 및 `/config set channels.<provider>.accounts.<id>...`도 대상 account의 `configWrites`를 따릅니다.
- `/usage`는 응답별 사용량 footer를 제어합니다. `/usage cost`는 OpenClaw 세션 로그에서 로컬 비용 요약을 출력합니다.
- `/restart`는 기본적으로 활성화되어 있습니다. 비활성화하려면 `commands.restart: false`를 설정하세요.
- `/plugins install <spec>`는 `openclaw plugins install`과 같은 플러그인 사양을 받습니다: 로컬 경로/아카이브, npm 패키지, 또는 `clawhub:<pkg>`.
- `/plugins enable|disable`는 플러그인 config를 업데이트하며 재시작을 요청할 수 있습니다.
- Discord 전용 네이티브 명령: `/vc join|leave|status`는 음성 채널을 제어합니다(`channels.discord.voice` 및 네이티브 명령 필요, 텍스트로는 사용 불가).
- Discord thread-binding 명령(` /focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`)은 실효적으로 thread binding이 활성화되어 있어야 합니다(`session.threadBindings.enabled` 및/또는 `channels.discord.threadBindings.enabled`).
- ACP 명령 참조 및 런타임 동작: [ACP Agents](/ko/tools/acp-agents).
- `/verbose`는 디버깅과 추가 가시성을 위한 것이므로 일반 사용에서는 **꺼짐**으로 유지하세요.
- `/fast on|off`는 세션 재정의를 유지합니다. 이를 지우고 config 기본값으로 되돌리려면 Sessions UI의 `inherit` 옵션을 사용하세요.
- `/fast`는 provider별 동작입니다. OpenAI/OpenAI Codex는 이를 네이티브 Responses 엔드포인트에서 `service_tier=priority`로 매핑하고, `api.anthropic.com`으로 전송되는 OAuth 인증 트래픽을 포함한 직접 공개 Anthropic 요청은 이를 `service_tier=auto` 또는 `standard_only`로 매핑합니다. 자세한 내용은 [OpenAI](/ko/providers/openai) 및 [Anthropic](/ko/providers/anthropic)을 참조하세요.
- 도구 실패 요약은 관련 있을 때 여전히 표시되지만, 자세한 실패 텍스트는 `/verbose`가 `on` 또는 `full`일 때만 포함됩니다.
- `/reasoning`(및 `/verbose`)은 그룹 설정에서 위험할 수 있습니다. 의도하지 않은 내부 reasoning 또는 도구 출력을 노출할 수 있기 때문입니다. 특히 그룹 채팅에서는 꺼둔 상태를 유지하는 것이 좋습니다.
- `/model`은 새 세션 모델을 즉시 유지합니다.
- 에이전트가 idle 상태라면 다음 실행에서 바로 사용됩니다.
- 이미 실행이 활성 상태라면 OpenClaw는 라이브 전환을 pending으로 표시하고 깔끔한 재시도 지점에서만 새 모델로 다시 시작합니다.
- 도구 활동 또는 응답 출력이 이미 시작되었다면, pending 전환은 이후 재시도 기회나 다음 사용자 턴까지 대기 상태로 남을 수 있습니다.
- **빠른 경로:** allowlist에 있는 발신자의 명령 전용 메시지는 즉시 처리됩니다(큐 + 모델 우회).
- **그룹 멘션 게이팅:** allowlist에 있는 발신자의 명령 전용 메시지는 멘션 요구 사항을 우회합니다.
- **인라인 바로가기(allowlist에 있는 발신자 전용):** 특정 명령은 일반 메시지 안에 포함되어 있어도 작동하며 모델이 나머지 텍스트를 보기 전에 제거됩니다.
  - 예: `hey /status`는 상태 응답을 트리거하고, 나머지 텍스트는 일반 흐름으로 계속 전달됩니다.
- 현재: `/help`, `/commands`, `/status`, `/whoami` (`/id`)
- 권한 없는 명령 전용 메시지는 조용히 무시되며, 인라인 `/...` 토큰은 일반 텍스트로 처리됩니다.
- **Skill 명령:** `user-invocable` Skills는 슬래시 명령으로 노출됩니다. 이름은 `a-z0-9_`로 정리되며(최대 32자), 충돌 시 숫자 접미사가 붙습니다(예: `_2`).
  - `/skill <name> [input]`은 이름으로 Skills를 실행합니다(네이티브 명령 제한 때문에 Skill별 명령을 만들 수 없을 때 유용함).
  - 기본적으로 Skill 명령은 일반 요청으로 모델에 전달됩니다.
  - Skills는 선택적으로 `command-dispatch: tool`을 선언해 명령을 도구로 직접 라우팅할 수 있습니다(결정적, 모델 없음).
  - 예: `/prose` (OpenProse 플러그인) — [OpenProse](/ko/prose) 참조.
- **네이티브 명령 인자:** Discord는 동적 옵션에 autocomplete를 사용합니다(필수 인자를 생략하면 버튼 메뉴도 사용). Telegram과 Slack은 명령이 선택지를 지원하고 인자를 생략한 경우 버튼 메뉴를 표시합니다.

## `/tools`

`/tools`는 config 질문이 아니라 런타임 질문에 답합니다: **이 대화에서 이 에이전트가 지금
무엇을 사용할 수 있는가**입니다.

- 기본 `/tools`는 compact 형식이며 빠르게 훑어보기에 최적화되어 있습니다.
- `/tools verbose`는 짧은 설명을 추가합니다.
- 인자를 지원하는 네이티브 명령 표면은 동일한 `compact|verbose` 모드 전환을 노출합니다.
- 결과는 세션 범위이므로 에이전트, 채널, 스레드, 발신자 권한, 모델이 바뀌면
  출력도 바뀔 수 있습니다.
- `/tools`에는 core 도구, 연결된
  플러그인 도구, 채널 소유 도구를 포함해 런타임에서 실제로 도달 가능한 도구가 포함됩니다.

프로필 및 재정의 편집은 `/tools`를 정적 카탈로그처럼 취급하는 대신
Control UI Tools 패널 또는 config/catalog 표면을 사용하세요.

## 사용량 표면(무엇이 어디에 표시되는가)

- **provider 사용량/할당량**(예: “Claude 80% left”)은 사용량 추적이 활성화되어 있을 때 현재 모델 provider에 대해 `/status`에 표시됩니다. OpenClaw는 provider window를 `% left`로 정규화합니다. MiniMax의 경우 남은 비율 전용 필드는 표시 전에 반전되며, `model_remains` 응답은 모델 태그가 붙은 플랜 레이블과 함께 chat-model 엔트리를 우선 사용합니다.
- `/status`의 **토큰/캐시 줄**은 라이브 세션 스냅샷이 부족할 때 최신 대화 기록 사용량 엔트리로 fallback할 수 있습니다. 기존의 0이 아닌 라이브 값이 여전히 우선하며, 저장된 총량이 없거나 더 작을 때 대화 기록 fallback은 활성 런타임 모델 레이블과 더 큰 프롬프트 지향 총량도 복구할 수 있습니다.
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

참고 사항:

- `/model` 및 `/model list`는 compact 형식의 번호 있는 선택기(모델 family + 사용 가능한 provider)를 표시합니다.
- Discord에서 `/model` 및 `/models`는 provider 및 모델 드롭다운과 Submit 단계가 있는 대화형 선택기를 엽니다.
- `/model <#>`는 해당 선택기에서 선택합니다(가능하면 현재 provider를 우선 사용).
- `/model status`는 사용 가능한 경우 구성된 provider 엔드포인트(`baseUrl`) 및 API 모드(`api`)를 포함한 자세한 보기를 표시합니다.

## 디버그 재정의

`/debug`는 **런타임 전용** config 재정의(디스크가 아닌 메모리)를 설정할 수 있게 합니다. owner 전용입니다. 기본적으로 비활성화되어 있으며 `commands.debug: true`로 활성화하세요.

예시:

```
/debug show
/debug set messages.responsePrefix="[openclaw]"
/debug set channels.whatsapp.allowFrom=["+1555","+4477"]
/debug unset messages.responsePrefix
/debug reset
```

참고 사항:

- 재정의는 새 config 읽기에 즉시 적용되지만 `openclaw.json`에는 기록되지 않습니다.
- `/debug reset`을 사용해 모든 재정의를 지우고 디스크상의 config로 되돌리세요.

## Config 업데이트

`/config`는 디스크의 config(`openclaw.json`)에 기록합니다. owner 전용입니다. 기본적으로 비활성화되어 있으며 `commands.config: true`로 활성화하세요.

예시:

```
/config show
/config show messages.responsePrefix
/config get messages.responsePrefix
/config set messages.responsePrefix="[openclaw]"
/config unset messages.responsePrefix
```

참고 사항:

- 기록 전에 config가 검증되며, 유효하지 않은 변경은 거부됩니다.
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

참고 사항:

- `/mcp`는 Pi 소유 프로젝트 설정이 아니라 OpenClaw config에 저장합니다.
- 어떤 transport가 실제로 실행 가능한지는 런타임 adapter가 결정합니다.

## 플러그인 업데이트

`/plugins`는 운영자가 감지된 플러그인을 점검하고 config에서 활성화 여부를 전환할 수 있게 합니다. 읽기 전용 흐름에서는 `/plugin`을 별칭으로 사용할 수 있습니다. 기본적으로 비활성화되어 있으며 `commands.plugins: true`로 활성화하세요.

예시:

```text
/plugins
/plugins list
/plugin show context7
/plugins enable context7
/plugins disable context7
```

참고 사항:

- `/plugins list`와 `/plugins show`는 현재 workspace와 디스크상 config를 기준으로 실제 플러그인 검색을 사용합니다.
- `/plugins enable|disable`는 플러그인 config만 업데이트하며, 플러그인을 설치하거나 제거하지는 않습니다.
- 활성화/비활성화 변경 후에는 적용을 위해 gateway를 재시작하세요.

## 표면 참고 사항

- **텍스트 명령**은 일반 채팅 세션에서 실행됩니다(DM은 `main`을 공유하고, 그룹은 자체 세션을 가짐).
- **네이티브 명령**은 격리된 세션을 사용합니다.
  - Discord: `agent:<agentId>:discord:slash:<userId>`
  - Slack: `agent:<agentId>:slack:slash:<userId>` (접두사는 `channels.slack.slashCommand.sessionPrefix`로 구성 가능)
  - Telegram: `telegram:slash:<userId>` (채팅 세션을 `CommandTargetSessionKey`로 대상으로 함)
- **`/stop`**은 활성 채팅 세션을 대상으로 하여 현재 실행을 중단할 수 있게 합니다.
- **Slack:** `channels.slack.slashCommand`는 여전히 단일 `/openclaw` 스타일 명령용으로 지원됩니다. `commands.native`를 활성화하면 내장 명령마다 Slack 슬래시 명령을 하나씩 만들어야 합니다(`/help`와 같은 이름). Slack용 명령 인자 메뉴는 ephemeral Block Kit 버튼으로 전달됩니다.
  - Slack 네이티브 예외: Slack이 `/status`를 예약하고 있으므로 `/status`가 아니라 `/agentstatus`를 등록하세요. 텍스트 `/status`는 Slack 메시지에서 여전히 작동합니다.

## BTW 부가 질문

`/btw`는 현재 세션에 대한 빠른 **부가 질문**입니다.

일반 채팅과 달리:

- 현재 세션을 배경 컨텍스트로 사용하고,
- 별도의 **도구 없는** 원샷 호출로 실행되며,
- 이후 세션 컨텍스트를 변경하지 않고,
- 대화 기록 히스토리에 기록되지 않으며,
- 일반 assistant 메시지 대신 실시간 부가 결과로 전달됩니다.

따라서 `/btw`는 메인
작업을 계속 진행하면서 일시적인 확인이 필요할 때 유용합니다.

예시:

```text
/btw 지금 우리는 무엇을 하고 있나요?
```

전체 동작과 클라이언트 UX
세부 사항은 [BTW Side Questions](/ko/tools/btw)를 참조하세요.
