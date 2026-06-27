---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: '도구가 차단되는 이유: 샌드박스 런타임, 도구 허용/거부 정책, 상승된 exec 게이트'
title: 샌드박스 vs 도구 정책 vs 승격된 권한
x-i18n:
    generated_at: "2026-06-27T17:30:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw에는 서로 관련은 있지만 다른 세 가지 제어가 있습니다:

1. **샌드박스**(`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`)는 **도구가 어디에서 실행되는지**(샌드박스 백엔드 대 호스트)를 결정합니다.
2. **도구 정책**(`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`)은 **어떤 도구를 사용할 수 있거나 허용할지**를 결정합니다.
3. **권한 상승**(`tools.elevated.*`, `agents.list[].tools.elevated.*`)은 샌드박스 상태일 때(기본값은 `gateway`, 또는 exec 대상이 `node`로 구성된 경우 `node`) 샌드박스 밖에서 실행하기 위한 **exec 전용 탈출구**입니다.

## 빠른 디버그

검사기를 사용해 OpenClaw가 _실제로_ 무엇을 하는지 확인하세요:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

다음이 출력됩니다:

- 유효한 샌드박스 모드/범위/워크스페이스 접근
- 세션이 현재 샌드박스 상태인지 여부(메인 대 비메인)
- 유효한 샌드박스 도구 허용/거부(그리고 에이전트/전역/기본값 중 어디에서 왔는지)
- 권한 상승 게이트와 수정용 키 경로

## 샌드박스: 도구가 실행되는 위치

샌드박스는 `agents.defaults.sandbox.mode`로 제어됩니다:

- `"off"`: 모든 것이 호스트에서 실행됩니다.
- `"non-main"`: 비메인 세션만 샌드박스됩니다(그룹/채널에서 흔한 "예상 밖" 상황).
- `"all"`: 모든 것이 샌드박스됩니다.

전체 매트릭스(범위, 워크스페이스 마운트, 이미지)는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.

### 바인드 마운트(보안 빠른 점검)

- `docker.binds`는 샌드박스 파일시스템을 _뚫습니다_: 마운트한 것은 무엇이든 설정한 모드(`:ro` 또는 `:rw`)로 컨테이너 안에서 보입니다.
- 모드를 생략하면 기본값은 읽기-쓰기입니다. 소스/비밀 정보에는 `:ro`를 선호하세요.
- `scope: "shared"`는 에이전트별 바인드를 무시합니다(전역 바인드만 적용).
- OpenClaw는 바인드 소스를 두 번 검증합니다. 먼저 정규화된 소스 경로에서, 그다음 가장 깊은 기존 상위 항목을 통해 해석한 뒤 다시 검증합니다. 심볼릭 링크 상위 경로 탈출은 차단 경로 또는 허용 루트 검사를 우회하지 못합니다.
- 존재하지 않는 리프 경로도 안전하게 검사됩니다. `/workspace/alias-out/new-file`이 심볼릭 링크된 상위 항목을 통해 차단 경로 또는 구성된 허용 루트 밖으로 해석되면 바인드는 거부됩니다.
- `/var/run/docker.sock`을 바인딩하면 사실상 호스트 제어권을 샌드박스에 넘기는 것입니다. 의도한 경우에만 수행하세요.
- 워크스페이스 접근(`workspaceAccess: "ro"`/`"rw"`)은 바인드 모드와 독립적입니다.

## 도구 정책: 어떤 도구가 존재하고 호출 가능한지

두 계층이 중요합니다:

- **도구 프로필**: `tools.profile` 및 `agents.list[].tools.profile`(기본 허용 목록)
- **Provider 도구 프로필**: `tools.byProvider[provider].profile` 및 `agents.list[].tools.byProvider[provider].profile`
- **전역/에이전트별 도구 정책**: `tools.allow`/`tools.deny` 및 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Provider 도구 정책**: `tools.byProvider[provider].allow/deny` 및 `agents.list[].tools.byProvider[provider].allow/deny`
- **샌드박스 도구 정책**(샌드박스 상태일 때만 적용): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 및 `agents.list[].tools.sandbox.tools.*`

경험칙:

- `deny`가 항상 우선합니다.
- `allow`가 비어 있지 않으면 나머지는 모두 차단된 것으로 처리됩니다.
- 도구 정책은 최종 차단 지점입니다. `/exec`는 거부된 `exec` 도구를 재정의할 수 없습니다.
- 도구 정책은 이름으로 도구 가용성을 필터링합니다. `exec` 내부의 부작용은 검사하지 않습니다. `exec`가 허용되면 `write`, `edit`, 또는 `apply_patch`를 거부해도 셸 명령이 읽기 전용이 되지는 않습니다.
- `/exec`는 권한 있는 발신자에 대한 세션 기본값만 변경합니다. 도구 접근 권한을 부여하지 않습니다.
  Provider 도구 키는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.4`)을 받을 수 있습니다.
- Gateway 로그에는 도구 정책 단계가 도구를 제거하거나 샌드박스 도구 정책이 호출을 차단할 때 `agents/tool-policy` 감사 항목이 포함됩니다. 규칙 레이블, 구성 키, 영향을 받은 도구 이름을 보려면 `openclaw logs`를 사용하세요.

### 도구 그룹(축약형)

도구 정책(전역, 에이전트, 샌드박스)은 여러 도구로 확장되는 `group:*` 항목을 지원합니다:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

사용 가능한 그룹:

- `group:runtime`: `exec`, `process`, `code_execution`(`bash`는 `exec`의 별칭으로 허용됨)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  읽기 전용 에이전트의 경우 샌드박스 파일시스템 정책 또는 별도 호스트 경계가 읽기 전용 제약을 강제하지 않는 한, 변경 가능한 파일시스템 도구뿐 아니라 `group:runtime`도 거부하세요.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: 모든 내장 OpenClaw 도구(Provider Plugin 제외)
- `group:plugins`: `bundle-mcp`를 통해 노출되는 구성된 MCP 서버를 포함한, 로드된 모든 Plugin 소유 도구

샌드박스된 MCP 서버의 경우 샌드박스 도구 정책은 두 번째 허용 게이트입니다. `mcp.servers`가 구성되어 있지만 샌드박스된 턴에 내장 도구만 표시된다면 `bundle-mcp`, `group:plugins`, 또는 `outlook__send_mail`이나 `outlook__*` 같은 서버 접두 MCP 도구 이름/글롭을 `tools.sandbox.tools.alsoAllow`에 추가한 다음 Gateway를 재시작/다시 로드하고 도구 목록을 다시 캡처하세요. 서버 글롭은 Provider에 안전한 MCP 서버 접두사를 사용합니다. `[A-Za-z0-9_-]`가 아닌 문자는 `-`가 되고, 문자로 시작하지 않는 이름에는 `mcp-` 접두사가 붙으며, 길거나 중복된 접두사는 잘리거나 접미사가 붙을 수 있습니다.

`openclaw doctor`는 현재 `mcp.servers`의 OpenClaw 관리 서버에 대해 이 형태를 검사합니다. 번들 Plugin 매니페스트 또는 Claude `.mcp.json`에서 로드된 MCP 서버도 동일한 샌드박스 게이트를 사용하지만, 이 진단은 아직 해당 소스를 열거하지 않습니다. 샌드박스된 턴에서 해당 도구가 사라지면 동일한 허용 목록 항목을 사용하세요.

## 권한 상승: exec 전용 "호스트에서 실행"

권한 상승은 추가 도구를 부여하지 않습니다. `exec`에만 영향을 줍니다.

- 샌드박스 상태라면 `/elevated on`(또는 `elevated: true`가 있는 `exec`)은 샌드박스 밖에서 실행됩니다(승인은 여전히 적용될 수 있음).
- 세션에 대한 exec 승인을 건너뛰려면 `/elevated full`을 사용하세요.
- 이미 직접 실행 중이라면 권한 상승은 사실상 아무 작업도 하지 않습니다(그래도 게이트는 적용됨).
- 권한 상승은 **skill 범위가 아니며**, 도구 허용/거부를 재정의하지 **않습니다**.
- 권한 상승은 `host=auto`에서 임의의 교차 호스트 재정의를 부여하지 않습니다. 일반 exec 대상 규칙을 따르며, 구성된/세션 대상이 이미 `node`인 경우에만 `node`를 유지합니다.
- `/exec`는 권한 상승과 별개입니다. 권한 있는 발신자에 대한 세션별 exec 기본값만 조정합니다.

게이트:

- 활성화: `tools.elevated.enabled`(및 선택적으로 `agents.list[].tools.elevated.enabled`)
- 발신자 허용 목록: `tools.elevated.allowFrom.<provider>`(및 선택적으로 `agents.list[].tools.elevated.allowFrom.<provider>`)

[권한 상승 모드](/ko/tools/elevated)를 참조하세요.

## 흔한 "샌드박스 감금" 수정

### "도구 X가 샌드박스 도구 정책에 의해 차단됨"

수정용 키(하나 선택):

- 샌드박스 비활성화: `agents.defaults.sandbox.mode=off`(또는 에이전트별 `agents.list[].sandbox.mode=off`)
- 샌드박스 안에서 도구 허용:
  - `tools.sandbox.tools.deny`(또는 에이전트별 `agents.list[].tools.sandbox.tools.deny`)에서 제거
  - 또는 `tools.sandbox.tools.allow`(또는 에이전트별 허용)에 추가
- `agents/tool-policy` 항목은 `openclaw logs`에서 확인하세요. 이 항목은 샌드박스 모드와 허용 또는 거부 규칙 중 무엇이 도구를 차단했는지 기록합니다.

### "이게 메인이라고 생각했는데 왜 샌드박스되나요?"

`"non-main"` 모드에서는 그룹/채널 키가 메인이 _아닙니다_. 메인 세션 키(`sandbox explain`에 표시됨)를 사용하거나 모드를 `"off"`로 전환하세요.

## 관련 항목

- [샌드박싱](/ko/gateway/sandboxing) -- 전체 샌드박스 참조(모드, 범위, 백엔드, 이미지)
- [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의와 우선순위
- [권한 상승 모드](/ko/tools/elevated)
