---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: '도구가 차단되는 이유: 샌드박스 런타임, 도구 허용/거부 정책 및 권한 상승 실행 게이트'
title: 샌드박스와 도구 정책, 상승 권한의 차이
x-i18n:
    generated_at: "2026-05-10T19:36:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw에는 서로 관련되어 있지만 서로 다른 세 가지 제어가 있습니다.

1. **Sandbox**(`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`)는 **도구가 어디에서 실행되는지**(sandbox 백엔드와 호스트 중)를 결정합니다.
2. **도구 정책**(`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`)은 **어떤 도구를 사용할 수 있고 허용되는지**를 결정합니다.
3. **Elevated**(`tools.elevated.*`, `agents.list[].tools.elevated.*`)는 sandbox 처리된 상태일 때(`gateway`가 기본값, 또는 exec 대상이 `node`로 구성된 경우 `node`) sandbox 밖에서 실행하기 위한 **exec 전용 탈출구**입니다.

## 빠른 디버그

검사기를 사용해 OpenClaw가 _실제로_ 무엇을 하고 있는지 확인하세요.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

다음을 출력합니다.

- 유효한 sandbox 모드/범위/작업 영역 액세스
- 세션이 현재 sandbox 처리되어 있는지 여부(main과 non-main)
- 유효한 sandbox 도구 allow/deny(그리고 agent/global/default 중 어디에서 왔는지)
- elevated 게이트 및 수정 키 경로

## Sandbox: 도구가 실행되는 위치

Sandbox 처리는 `agents.defaults.sandbox.mode`로 제어됩니다.

- `"off"`: 모든 것이 호스트에서 실행됩니다.
- `"non-main"`: non-main 세션만 sandbox 처리됩니다(그룹/채널에서 흔한 "예상 밖" 상황).
- `"all"`: 모든 것이 sandbox 처리됩니다.

전체 매트릭스(범위, 작업 영역 마운트, 이미지)는 [Sandbox 처리](/ko/gateway/sandboxing)를 참조하세요.

### 바인드 마운트(보안 빠른 점검)

- `docker.binds`는 sandbox 파일 시스템을 _관통합니다_. 마운트한 대상은 설정한 모드(`:ro` 또는 `:rw`)로 컨테이너 내부에 표시됩니다.
- 모드를 생략하면 기본값은 읽기-쓰기입니다. 소스/시크릿에는 `:ro`를 선호하세요.
- `scope: "shared"`는 agent별 바인드를 무시합니다(전역 바인드만 적용).
- OpenClaw는 바인드 소스를 두 번 검증합니다. 먼저 정규화된 소스 경로에서, 그다음 가장 깊은 기존 조상을 통해 해석한 뒤 다시 검증합니다. 심볼릭 링크 부모를 통한 탈출은 차단 경로 또는 허용 루트 검사를 우회하지 못합니다.
- 존재하지 않는 리프 경로도 안전하게 검사됩니다. `/workspace/alias-out/new-file`이 심볼릭 링크된 부모를 통해 차단된 경로 또는 구성된 허용 루트 밖으로 해석되면 해당 바인드는 거부됩니다.
- `/var/run/docker.sock`을 바인딩하면 사실상 호스트 제어권을 sandbox에 넘기는 것입니다. 의도한 경우에만 사용하세요.
- 작업 영역 액세스(`workspaceAccess: "ro"`/`"rw"`)는 바인드 모드와 독립적입니다.

## 도구 정책: 어떤 도구가 존재하고 호출 가능한지

중요한 계층은 두 가지입니다.

- **도구 프로필**: `tools.profile` 및 `agents.list[].tools.profile`(기본 allowlist)
- **제공자 도구 프로필**: `tools.byProvider[provider].profile` 및 `agents.list[].tools.byProvider[provider].profile`
- **전역/agent별 도구 정책**: `tools.allow`/`tools.deny` 및 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **제공자 도구 정책**: `tools.byProvider[provider].allow/deny` 및 `agents.list[].tools.byProvider[provider].allow/deny`
- **Sandbox 도구 정책**(sandbox 처리된 경우에만 적용): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 및 `agents.list[].tools.sandbox.tools.*`

경험칙:

- `deny`가 항상 우선합니다.
- `allow`가 비어 있지 않으면 그 외 모든 것은 차단된 것으로 취급됩니다.
- 도구 정책은 최종 차단 지점입니다. `/exec`는 거부된 `exec` 도구를 override할 수 없습니다.
- 도구 정책은 이름으로 도구 가용성을 필터링합니다. `exec` 내부의 부수 효과는 검사하지 않습니다. `exec`가 허용된 경우 `write`, `edit`, `apply_patch`를 거부해도 셸 명령이 읽기 전용이 되지는 않습니다.
- `/exec`는 승인된 발신자에 대한 세션 기본값만 변경합니다. 도구 액세스를 부여하지 않습니다.
  제공자 도구 키는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.4`)을 허용합니다.

### 도구 그룹(축약형)

도구 정책(전역, agent, sandbox)은 여러 도구로 확장되는 `group:*` 항목을 지원합니다.

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

- `group:runtime`: `exec`, `process`, `code_execution`(`bash`는
  `exec`의 별칭으로 허용됨)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  읽기 전용 agent의 경우 sandbox 파일 시스템 정책이나 별도 호스트 경계가 읽기 전용 제약을 강제하지 않는 한, 변경 가능한 파일 시스템 도구뿐 아니라 `group:runtime`도 거부하세요.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: 모든 내장 OpenClaw 도구(제공자 Plugin 제외)

## Elevated: exec 전용 "호스트에서 실행"

Elevated는 추가 도구를 부여하지 **않습니다**. `exec`에만 영향을 줍니다.

- sandbox 처리된 상태라면 `/elevated on`(또는 `elevated: true`가 포함된 `exec`)은 sandbox 밖에서 실행됩니다(승인이 여전히 적용될 수 있음).
- 세션의 exec 승인을 건너뛰려면 `/elevated full`을 사용하세요.
- 이미 직접 실행 중이라면 elevated는 사실상 아무 효과가 없습니다(게이트는 여전히 적용).
- Elevated는 **skill 범위가 아니며** 도구 allow/deny를 override하지 **않습니다**.
- Elevated는 `host=auto`에서 임의의 교차 호스트 override를 부여하지 않습니다. 일반 exec 대상 규칙을 따르며, 구성된/세션 대상이 이미 `node`인 경우에만 `node`를 보존합니다.
- `/exec`는 elevated와 별개입니다. 승인된 발신자에 대한 세션별 exec 기본값만 조정합니다.

게이트:

- 활성화: `tools.elevated.enabled`(및 선택적으로 `agents.list[].tools.elevated.enabled`)
- 발신자 allowlist: `tools.elevated.allowFrom.<provider>`(및 선택적으로 `agents.list[].tools.elevated.allowFrom.<provider>`)

[Elevated 모드](/ko/tools/elevated)를 참조하세요.

## 일반적인 "sandbox 감금" 수정

### "도구 X가 sandbox 도구 정책에 의해 차단됨"

수정 키(하나 선택):

- sandbox 비활성화: `agents.defaults.sandbox.mode=off`(또는 agent별 `agents.list[].sandbox.mode=off`)
- sandbox 내부에서 도구 허용:
  - `tools.sandbox.tools.deny`(또는 agent별 `agents.list[].tools.sandbox.tools.deny`)에서 제거
  - 또는 `tools.sandbox.tools.allow`(또는 agent별 allow)에 추가

### "main이라고 생각했는데 왜 sandbox 처리되나요?"

`"non-main"` 모드에서는 그룹/채널 키가 main이 _아닙니다_. main 세션 키(`sandbox explain`에 표시됨)를 사용하거나 모드를 `"off"`로 전환하세요.

## 관련 문서

- [Sandbox 처리](/ko/gateway/sandboxing) -- 전체 sandbox 참조(모드, 범위, 백엔드, 이미지)
- [Multi-Agent Sandbox 및 도구](/ko/tools/multi-agent-sandbox-tools) -- agent별 override 및 우선순위
- [Elevated 모드](/ko/tools/elevated)
