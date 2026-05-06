---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: '도구가 차단되는 이유: 샌드박스 런타임, 도구 허용/거부 정책, 권한 상승 실행 게이트'
title: 샌드박스, 도구 정책, 권한 상승 비교
x-i18n:
    generated_at: "2026-05-06T06:27:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw에는 서로 관련되어 있지만 다른 세 가지 제어가 있습니다.

1. **샌드박스**(`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`)는 **도구가 실행되는 위치**(샌드박스 백엔드 또는 호스트)를 결정합니다.
2. **도구 정책**(`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`)은 **사용 가능하거나 허용되는 도구**를 결정합니다.
3. **상승 권한**(`tools.elevated.*`, `agents.list[].tools.elevated.*`)은 샌드박스 처리된 상태일 때 샌드박스 밖에서 실행하기 위한 **`exec` 전용 우회 수단**입니다(기본값은 `gateway`, 또는 `exec` 대상이 `node`로 구성된 경우 `node`).

## 빠른 디버그

검사기를 사용하여 OpenClaw가 _실제로_ 무엇을 하는지 확인하세요.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

다음을 출력합니다.

- 적용되는 샌드박스 모드/범위/작업 공간 접근 권한
- 세션이 현재 샌드박스 처리되어 있는지 여부(메인 vs 비메인)
- 적용되는 샌드박스 도구 허용/거부(및 에이전트/전역/기본값 중 어디에서 왔는지)
- 상승 권한 게이트 및 수정용 키 경로

## 샌드박스: 도구가 실행되는 위치

샌드박스 처리는 `agents.defaults.sandbox.mode`로 제어됩니다.

- `"off"`: 모든 것이 호스트에서 실행됩니다.
- `"non-main"`: 비메인 세션만 샌드박스 처리됩니다(그룹/채널에서 흔한 “예상 밖” 동작).
- `"all"`: 모든 것이 샌드박스 처리됩니다.

전체 매트릭스(범위, 작업 공간 마운트, 이미지)는 [샌드박스 처리](/ko/gateway/sandboxing)를 참조하세요.

### 바인드 마운트(보안 빠른 확인)

- `docker.binds`는 샌드박스 파일 시스템을 _뚫습니다_. 마운트한 것은 설정한 모드(`:ro` 또는 `:rw`)로 컨테이너 안에서 보입니다.
- 모드를 생략하면 기본값은 읽기-쓰기입니다. 소스/시크릿에는 `:ro`를 선호하세요.
- `scope: "shared"`는 에이전트별 바인드를 무시합니다(전역 바인드만 적용).
- OpenClaw는 바인드 소스를 두 번 검증합니다. 먼저 정규화된 소스 경로에서 검증하고, 그다음 가장 깊이 존재하는 상위 경로를 통해 해석한 후 다시 검증합니다. 심볼릭 링크 상위 경로를 통한 이탈은 차단 경로 또는 허용 루트 검사를 우회하지 못합니다.
- 존재하지 않는 말단 경로도 안전하게 검사됩니다. `/workspace/alias-out/new-file`이 심볼릭 링크된 상위 경로를 통해 차단된 경로 또는 구성된 허용 루트 밖으로 해석되면 바인드는 거부됩니다.
- `/var/run/docker.sock`을 바인딩하면 사실상 샌드박스에 호스트 제어권을 넘겨줍니다. 의도한 경우에만 수행하세요.
- 작업 공간 접근 권한(`workspaceAccess: "ro"`/`"rw"`)은 바인드 모드와 독립적입니다.

## 도구 정책: 어떤 도구가 존재하고 호출 가능한지

두 계층이 중요합니다.

- **도구 프로필**: `tools.profile` 및 `agents.list[].tools.profile`(기본 허용 목록)
- **프로바이더 도구 프로필**: `tools.byProvider[provider].profile` 및 `agents.list[].tools.byProvider[provider].profile`
- **전역/에이전트별 도구 정책**: `tools.allow`/`tools.deny` 및 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **프로바이더 도구 정책**: `tools.byProvider[provider].allow/deny` 및 `agents.list[].tools.byProvider[provider].allow/deny`
- **샌드박스 도구 정책**(샌드박스 처리된 경우에만 적용): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 및 `agents.list[].tools.sandbox.tools.*`

경험칙:

- `deny`가 항상 우선합니다.
- `allow`가 비어 있지 않으면 나머지는 모두 차단된 것으로 처리됩니다.
- 도구 정책은 최종 차단 지점입니다. `/exec`는 거부된 `exec` 도구를 우회할 수 없습니다.
- `/exec`는 권한 있는 발신자의 세션 기본값만 변경합니다. 도구 접근 권한을 부여하지 않습니다.
  프로바이더 도구 키는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.4`)을 허용합니다.

### 도구 그룹(약식)

도구 정책(전역, 에이전트, 샌드박스)은 여러 도구로 확장되는 `group:*` 항목을 지원합니다.

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

- `group:runtime`: `exec`, `process`, `code_execution`(`bash`는 `exec`의
  별칭으로 허용됨)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: 모든 내장 OpenClaw 도구(프로바이더 Plugin 제외)

## 상승 권한: `exec` 전용 “호스트에서 실행”

상승 권한은 추가 도구를 부여하지 않습니다. `exec`에만 영향을 줍니다.

- 샌드박스 처리된 상태라면 `/elevated on`(또는 `elevated: true`가 있는 `exec`)은 샌드박스 밖에서 실행됩니다(승인이 여전히 적용될 수 있음).
- 세션의 `exec` 승인을 건너뛰려면 `/elevated full`을 사용하세요.
- 이미 직접 실행 중이면 상승 권한은 사실상 아무 동작도 하지 않습니다(여전히 게이트는 적용됨).
- 상승 권한은 **Skill 범위가 아니며** 도구 허용/거부를 재정의하지 **않습니다**.
- 상승 권한은 `host=auto`에서 임의의 크로스 호스트 재정의를 부여하지 않습니다. 일반 `exec` 대상 규칙을 따르며, 구성된/세션 대상이 이미 `node`인 경우에만 `node`를 보존합니다.
- `/exec`는 상승 권한과 별개입니다. 권한 있는 발신자의 세션별 `exec` 기본값만 조정합니다.

게이트:

- 활성화: `tools.elevated.enabled`(및 선택적으로 `agents.list[].tools.elevated.enabled`)
- 발신자 허용 목록: `tools.elevated.allowFrom.<provider>`(및 선택적으로 `agents.list[].tools.elevated.allowFrom.<provider>`)

[상승 권한 모드](/ko/tools/elevated)를 참조하세요.

## 일반적인 “샌드박스 감금” 수정

### “도구 X가 샌드박스 도구 정책에 의해 차단됨”

수정용 키(하나 선택):

- 샌드박스 비활성화: `agents.defaults.sandbox.mode=off`(또는 에이전트별 `agents.list[].sandbox.mode=off`)
- 샌드박스 안에서 도구 허용:
  - `tools.sandbox.tools.deny`(또는 에이전트별 `agents.list[].tools.sandbox.tools.deny`)에서 제거
  - 또는 `tools.sandbox.tools.allow`(또는 에이전트별 허용)에 추가

### “이것이 메인이라고 생각했는데 왜 샌드박스 처리되나요?”

`"non-main"` 모드에서 그룹/채널 키는 메인이 _아닙니다_. 메인 세션 키(`sandbox explain`에 표시됨)를 사용하거나 모드를 `"off"`로 전환하세요.

## 관련 항목

- [샌드박스 처리](/ko/gateway/sandboxing) -- 전체 샌드박스 참조(모드, 범위, 백엔드, 이미지)
- [멀티 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의 및 우선순위
- [상승 권한 모드](/ko/tools/elevated)
