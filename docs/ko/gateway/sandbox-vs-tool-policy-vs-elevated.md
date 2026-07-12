---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: '도구가 차단되는 이유: 샌드박스 런타임, 도구 허용/거부 정책 및 권한 상승 실행 게이트'
title: 샌드박스와 도구 정책 및 권한 상승 비교
x-i18n:
    generated_at: "2026-07-12T00:50:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw에는 서로 관련되어 있지만 다른 세 가지 제어 기능이 있습니다.

1. **샌드박스** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`)는 **도구가 실행되는 위치**(샌드박스 백엔드 또는 호스트)를 결정합니다.
2. **도구 정책** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`)은 **사용 가능하거나 허용되는 도구**를 결정합니다.
3. **권한 상승** (`tools.elevated.*`, `agents.list[].tools.elevated.*`)은 샌드박스 환경에서 샌드박스 외부로 실행하기 위한 **`exec` 전용 탈출구**입니다(`exec` 대상이 `node`로 구성된 경우에는 `node`, 기본적으로는 `gateway`).

## 빠른 디버깅

검사기를 사용하여 OpenClaw가 _실제로_ 무엇을 하는지 확인합니다.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

다음 항목을 출력합니다.

- 적용되는 샌드박스 모드/범위/워크스페이스 접근 권한
- 세션이 현재 샌드박스화되어 있는지 여부(기본 세션과 기본이 아닌 세션)
- 적용되는 샌드박스 도구 허용/거부 설정 및 설정 출처(에이전트/전역/기본값)
- 권한 상승 게이트와 수정에 사용할 키 경로

## 샌드박스: 도구가 실행되는 위치

샌드박스화는 `agents.defaults.sandbox.mode`로 제어합니다.

- `"off"`: 모든 항목이 호스트에서 실행됩니다.
- `"non-main"`: 기본 세션이 아닌 세션만 샌드박스화됩니다(그룹/채널에서 흔히 발생하는 "예상 밖"의 동작).
- `"all"`: 모든 항목이 샌드박스화됩니다.

`agents.defaults.sandbox.workspaceAccess`는 샌드박스에서 볼 수 있는 범위를 제어합니다. 값은 `"none"`, `"ro"` 또는 `"rw"`입니다.

전체 조합(범위, 워크스페이스 마운트, 이미지)은 [샌드박스화](/ko/gateway/sandboxing)를 참조하세요.

### 바인드 마운트(빠른 보안 확인)

- `docker.binds`는 샌드박스 파일 시스템을 _관통_합니다. 마운트한 모든 항목은 설정한 모드(`:ro` 또는 `:rw`)로 컨테이너 내부에 표시됩니다.
- 모드를 생략하면 기본값은 읽기-쓰기입니다. 소스/비밀 정보에는 `:ro`를 권장합니다.
- `scope: "shared"`는 에이전트별 바인드를 무시합니다(전역 바인드만 적용됨).
- OpenClaw는 바인드 소스를 두 번 검증합니다. 먼저 정규화된 소스 경로에서 검증한 다음, 존재하는 가장 깊은 상위 경로를 통해 확인된 경로에서 다시 검증합니다. 상위 경로의 심볼릭 링크를 통한 이탈로는 차단 경로나 허용된 루트 검사를 우회할 수 없습니다.
- 존재하지 않는 말단 경로도 안전하게 검사합니다. `/workspace/alias-out/new-file`이 심볼릭 링크인 상위 경로를 통해 차단된 경로나 구성된 허용 루트 외부로 확인되면 바인드가 거부됩니다.
- `/var/run/docker.sock`을 바인딩하면 사실상 샌드박스에 호스트 제어 권한을 넘기는 것입니다. 의도한 경우에만 수행하세요.
- 워크스페이스 접근 권한(`workspaceAccess`)은 바인드 모드와 별개입니다.

## 도구 정책: 존재하고 호출 가능한 도구

다음 계층이 중요합니다.

- **도구 프로필**: `tools.profile` 및 `agents.list[].tools.profile`(기본 허용 목록)
- **제공자 도구 프로필**: `tools.byProvider[provider].profile` 및 `agents.list[].tools.byProvider[provider].profile`
- **전역/에이전트별 도구 정책**: `tools.allow`/`tools.deny` 및 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **제공자 도구 정책**: `tools.byProvider[provider].allow/deny` 및 `agents.list[].tools.byProvider[provider].allow/deny`
- **샌드박스 도구 정책**(샌드박스화된 경우에만 적용): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 및 `agents.list[].tools.sandbox.tools.*`

일반 원칙:

- `deny`가 항상 우선합니다.
- `allow`가 비어 있지 않으면 그 외 모든 항목은 차단된 것으로 처리됩니다.
- 도구 정책은 최종 차단 장치입니다. `/exec`로 거부된 `exec` 도구를 재정의할 수 없습니다.
- 도구 정책은 이름을 기준으로 도구의 사용 가능 여부를 필터링하며, `exec` 내부의 부작용은 검사하지 않습니다. `exec`가 허용되어 있다면 `write`, `edit` 또는 `apply_patch`를 거부해도 셸 명령이 읽기 전용으로 바뀌지는 않습니다.
- `/exec`는 권한이 있는 발신자의 세션 기본값만 변경하며, 도구 접근 권한을 부여하지 않습니다.
- 제공자 도구 키에는 `provider`(예: `google-antigravity`) 또는 `provider/model`(예: `openai/gpt-5.4`)을 사용할 수 있습니다.
- 도구 정책 단계에서 도구가 제거되거나 샌드박스 도구 정책이 호출을 차단하면 Gateway 로그에 `agents/tool-policy` 감사 항목이 포함됩니다. `openclaw logs`를 사용하여 규칙 레이블, 구성 키 및 영향을 받는 도구 이름을 확인하세요.

### 도구 그룹(축약 표기)

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

| 그룹               | 도구                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`는 `exec`의 별칭으로 허용됨)                                                                                                                              |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                               |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                                                              |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                        |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                |
| `group:ui`         | `browser`, `canvas`                                                                                                                                                                                  |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                               |
| `group:messaging`  | `message`                                                                                                                                                                                            |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                  |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                                                             |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                 |
| `group:openclaw`   | 대부분의 OpenClaw 기본 제공 도구(`read`/`write`/`edit`/`apply_patch`/`exec`/`process` 파일 시스템 및 런타임 기본 요소, `canvas`, 제공자 Plugin 제외)                                                  |
| `group:plugins`    | `bundle-mcp`를 통해 노출되는 구성된 MCP 서버를 포함하여, 로드된 Plugin 소유 도구 전체                                                                                                                |

읽기 전용 에이전트에서는 샌드박스 파일 시스템 정책이나 별도의 호스트 경계가 읽기 전용 제약을 강제하지 않는 한, 파일 시스템 변경 도구뿐 아니라 `group:runtime`도 거부하세요.

샌드박스화된 MCP 서버의 경우 샌드박스 도구 정책이 두 번째 허용 게이트로 작동합니다. `mcp.servers`가 구성되어 있지만 샌드박스화된 턴에 기본 제공 도구만 표시되는 경우 `bundle-mcp`, `group:plugins` 또는 `outlook__send_mail`, `outlook__*`과 같은 서버 접두사가 붙은 MCP 도구 이름/글로브를 `tools.sandbox.tools.alsoAllow`에 추가한 다음 Gateway를 다시 시작하거나 다시 로드하고 도구 목록을 다시 캡처하세요. 서버 글로브는 제공자에 안전한 MCP 서버 접두사를 사용합니다. `[A-Za-z0-9_-]` 이외의 문자는 `-`로 바뀌고, 문자로 시작하지 않는 이름에는 `mcp-` 접두사가 붙으며, 길거나 중복되는 접두사는 잘리거나 접미사가 붙을 수 있습니다.

현재 `openclaw doctor`는 `mcp.servers`의 OpenClaw 관리 서버에 대해 이 구성을 검사합니다. 번들 Plugin 매니페스트 또는 Claude `.mcp.json`에서 로드된 MCP 서버에도 동일한 샌드박스 게이트가 적용되지만, 이 진단 기능은 아직 해당 소스를 열거하지 않습니다. 해당 도구가 샌드박스화된 턴에서 사라지는 경우 동일한 허용 목록 항목을 사용하세요.

## 권한 상승: `exec` 전용 "호스트에서 실행"

권한 상승은 추가 도구를 부여하지 **않으며**, `exec`에만 영향을 줍니다.

- 샌드박스화된 경우 `/elevated on`(또는 `elevated: true`가 설정된 `exec`)은 샌드박스 외부에서 실행됩니다(승인이 여전히 필요할 수 있음).
- 세션의 `exec` 승인을 건너뛰려면 `/elevated full`을 사용하세요.
- 이미 직접 실행 중이라면 권한 상승은 사실상 아무 효과가 없습니다(게이트는 계속 적용됨).
- 권한 상승은 Skills 범위로 제한되지 **않으며**, 도구 허용/거부를 재정의하지도 **않습니다**.
- 권한 상승은 `host=auto`에서 임의의 호스트 간 재정의를 허용하지 않습니다. 일반적인 `exec` 대상 규칙을 따르며, 구성된 대상이나 세션 대상이 이미 `node`인 경우에만 `node`를 유지합니다.
- `/exec`는 권한 상승과 별개입니다. 권한이 있는 발신자의 세션별 `exec` 기본값만 조정합니다.

게이트:

- 활성화: `tools.elevated.enabled`(선택적으로 `agents.list[].tools.elevated.enabled`)
- 발신자 허용 목록: `tools.elevated.allowFrom.<provider>`(선택적으로 `agents.list[].tools.elevated.allowFrom.<provider>`)

[권한 상승 모드](/ko/tools/elevated)를 참조하세요.

## 일반적인 "샌드박스 감옥" 문제 해결

### "샌드박스 도구 정책에 의해 도구 X가 차단됨"

수정 키(하나 선택):

- 샌드박스 비활성화: `agents.defaults.sandbox.mode=off`(또는 에이전트별 `agents.list[].sandbox.mode=off`)
- 샌드박스 내부에서 도구 허용:
  - `tools.sandbox.tools.deny`에서 제거(또는 에이전트별 `agents.list[].tools.sandbox.tools.deny`)
  - 또는 `tools.sandbox.tools.allow`에 추가(또는 에이전트별 허용 목록)
- `openclaw logs`에서 `agents/tool-policy` 항목을 확인하세요. 해당 항목에는 샌드박스 모드와 허용 또는 거부 규칙 중 어느 것이 도구를 차단했는지가 기록됩니다.

### "기본 세션인 줄 알았는데 왜 샌드박스화되어 있나요?"

`"non-main"` 모드에서는 그룹/채널 키가 기본 세션이 _아닙니다_. 기본 세션 키(`sandbox explain`에 표시됨)를 사용하거나 모드를 `"off"`로 전환하세요.

## 관련 문서

- [샌드박스화](/ko/gateway/sandboxing) -- 전체 샌드박스 참고 자료(모드, 범위, 백엔드, 이미지)
- [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 재정의 및 우선순위
- [권한 상승 모드](/ko/tools/elevated)
