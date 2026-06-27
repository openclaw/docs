---
read_when:
    - 문제 해결 허브에서 더 자세한 진단을 위해 이 페이지로 안내했습니다
    - 정확한 명령어가 포함된 안정적인 증상 기반 런북 섹션이 필요합니다
sidebarTitle: Troubleshooting
summary: Gateway, 채널, 자동화, 노드 및 브라우저를 위한 심층 문제 해결 런북
title: 문제 해결
x-i18n:
    generated_at: "2026-06-27T17:33:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ce8e8aed5c3e00be5b093875222962c22883472802e164534dae32adc5365c5
    source_path: gateway/troubleshooting.md
    workflow: 16
---

이 페이지는 상세 실행 지침서입니다. 빠른 분류 흐름을 먼저 원한다면 [/help/troubleshooting](/ko/help/troubleshooting)에서 시작하세요.

## 명령 사다리

먼저 다음을 이 순서대로 실행하세요.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

예상되는 정상 신호:

- `openclaw gateway status`가 `Runtime: running`, `Connectivity probe: ok`, 그리고 `Capability: ...` 줄을 표시합니다.
- `openclaw doctor`가 차단되는 구성/서비스 문제가 없다고 보고합니다.
- `openclaw channels status --probe`가 계정별 실시간 전송 상태와, 지원되는 경우 `works` 또는 `audit ok` 같은 프로브/감사 결과를 표시합니다.

## 업데이트 후

업데이트가 완료되었지만 Gateway가 내려가 있거나, 채널이 비어 있거나,
모델 호출이 401로 실패하기 시작할 때 사용하세요.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

확인할 항목:

- `openclaw status` / `openclaw status --all`의 `Update restart`. 보류 중이거나
  실패한 인계에는 다음에 실행할 명령이 포함됩니다.
- Channels 아래의 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`.
  이는 채널 구성은 여전히 존재하지만, 채널이 로드되기 전에 Plugin
  등록이 실패했다는 뜻입니다.
- 재인증 후 provider 401. `openclaw doctor --fix`는 오래된
  agent별 OAuth 인증 섀도를 확인하고 이전 복사본을 제거하여 모든 agent가
  현재 공유 프로필을 해석하도록 합니다.

## 분리된 설치와 더 새로운 구성 보호 장치

Gateway 서비스가 업데이트 후 예기치 않게 중지되거나, 로그에 한 `openclaw` 바이너리가 마지막으로 `openclaw.json`을 쓴 버전보다 오래되었다고 표시될 때 사용하세요.

OpenClaw는 구성 쓰기에 `meta.lastTouchedVersion`을 찍습니다. 읽기 전용 명령은 더 새로운 OpenClaw가 쓴 구성을 계속 검사할 수 있지만, 프로세스와 서비스 변경은 더 오래된 바이너리에서 계속 진행하지 않습니다. 차단되는 작업에는 Gateway 서비스 시작, 중지, 재시작, 제거, 강제 서비스 재설치, 서비스 모드 Gateway 시작, 그리고 `gateway --force` 포트 정리가 포함됩니다.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH 수정">
    `openclaw`가 더 새로운 설치로 해석되도록 `PATH`를 수정한 다음 작업을 다시 실행하세요.
  </Step>
  <Step title="Gateway 서비스 재설치">
    더 새로운 설치에서 의도한 Gateway 서비스를 다시 설치하세요.

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="오래된 래퍼 제거">
    여전히 오래된 `openclaw` 바이너리를 가리키는 오래된 시스템 패키지 또는 이전 래퍼 항목을 제거하세요.
  </Step>
</Steps>

<Warning>
의도적인 다운그레이드 또는 긴급 복구에만 단일 명령에 대해 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`을 설정하세요. 일반 작업에서는 설정하지 않은 상태로 두세요.
</Warning>

## 롤백 후 프로토콜 불일치

OpenClaw를 다운그레이드하거나 롤백한 뒤 로그에 `protocol mismatch`가 계속 출력될 때 사용하세요. 이는 더 오래된 Gateway가 실행 중이지만, 더 새로운 로컬 클라이언트 프로세스가 여전히 더 오래된 Gateway가 처리할 수 없는 프로토콜 범위로 다시 연결하려 한다는 뜻입니다.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

확인할 항목:

- Gateway 로그의 `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`.
- `openclaw gateway status --deep`의 `Established clients:` 또는 `openclaw doctor --deep`의 `Gateway clients`. 이는 OS가 허용할 때 PID와 명령줄을 포함해 Gateway 포트에 연결된 활성 TCP 클라이언트를 나열합니다.
- 명령줄이 롤백한 더 새로운 OpenClaw 설치 또는 래퍼를 가리키는 클라이언트 프로세스.

수정:

1. `gateway status --deep`에 표시된 오래된 OpenClaw 클라이언트 프로세스를 중지하거나 재시작하세요.
2. 로컬 대시보드, 편집기, 앱 서버 헬퍼, 오래 실행 중인 `openclaw logs --follow` 셸처럼 OpenClaw를 포함하는 앱 또는 래퍼를 재시작하세요.
3. `openclaw gateway status --deep` 또는 `openclaw doctor --deep`를 다시 실행하고 오래된 클라이언트 PID가 사라졌는지 확인하세요.

더 오래된 Gateway가 더 새로운 호환되지 않는 프로토콜을 수락하게 만들지 마세요. 프로토콜 증가는 와이어 계약을 보호합니다. 롤백 복구는 프로세스/버전 정리 문제입니다.

## 경로 이탈로 인해 Skill 심볼릭 링크 건너뜀

로그에 다음이 포함될 때 사용하세요.

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw는 모든 skill 루트를 포함 경계로 취급합니다. `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills`, 또는
`~/.openclaw/skills` 아래의 심볼릭 링크는 실제 대상이 해당 루트 밖으로 해석되면
대상이 명시적으로 신뢰되지 않는 한 건너뜁니다.

링크를 검사하세요.

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

대상이 의도된 것이라면 직접 skill 루트와
허용된 심볼릭 링크 대상을 모두 구성하세요.

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

그런 다음 새 세션을 시작하거나 skills 감시자가 새로 고쳐질 때까지 기다리세요. 실행 중인 프로세스가 구성 변경보다 먼저 시작되었다면
gateway를 재시작하세요.

`~`, `/`, 또는 동기화된 프로젝트 폴더 전체 같은 광범위한 대상을 사용하지 마세요.
신뢰할 수 있는 `SKILL.md` 디렉터리를 포함하는 실제 skill 루트로 `allowSymlinkTargets` 범위를 유지하세요.

Skill Workshop 적용이 이러한 신뢰된 심볼릭 링크 workspace skill 경로에도
써야 한다면 `skills.workshop.allowSymlinkTargetWrites`를 활성화하세요. 읽기 전용
공유 skill 루트에는 비활성화된 상태로 두세요.

관련:

- [Skills 구성](/ko/tools/skills-config#symlinked-skill-roots)
- [구성 예시](/ko/gateway/configuration-examples#symlinked-sibling-skill-repo)

## 긴 컨텍스트에 Anthropic 429 추가 사용량 필요

로그/오류에 `HTTP 429: rate_limit_error: Extra usage is required for long context requests`가 포함될 때 사용하세요.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

확인할 항목:

- 선택된 Anthropic 모델이 GA 지원 1M Claude 4.x 모델이거나, 모델에 기존 `params.context1m: true`가 있습니다.
- 현재 Anthropic 자격 증명이 긴 컨텍스트 사용 자격을 갖추지 않았습니다.
- 1M 컨텍스트 경로가 필요한 긴 세션/모델 실행에서만 요청이 실패합니다.

수정 옵션:

<Steps>
  <Step title="표준 컨텍스트 창 사용">
    표준 창 모델로 전환하거나, 1M 컨텍스트를 GA 지원하지 않는 이전
    모델 구성에서 기존 `context1m`을 제거하세요.
  </Step>
  <Step title="자격 있는 자격 증명 사용">
    긴 컨텍스트 요청 자격이 있는 Anthropic 자격 증명을 사용하거나 Anthropic API 키로 전환하세요.
  </Step>
  <Step title="대체 모델 구성">
    Anthropic 긴 컨텍스트 요청이 거부될 때 실행이 계속되도록 대체 모델을 구성하세요.
  </Step>
</Steps>

관련:

- [Anthropic](/ko/providers/anthropic)
- [토큰 사용량과 비용](/ko/reference/token-use)
- [Anthropic에서 HTTP 429가 표시되는 이유는 무엇인가요?](/ko/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 업스트림 403 차단 응답

업스트림 LLM provider가 `Your request was blocked` 같은 일반 `403`을 반환할 때 사용하세요.

이것이 항상 OpenClaw 구성 문제라고 가정하지 마세요. 응답은 CDN, WAF, 봇 관리 규칙 또는 OpenAI 호환 엔드포인트 앞단의
리버스 프록시 같은 업스트림 보안 계층에서 올 수 있습니다.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

확인할 항목:

- 같은 provider 아래 여러 모델이 같은 방식으로 실패함
- 정상적인 provider API 오류 대신 HTML 또는 일반 보안 텍스트
- 같은 요청 시간에 provider 측 보안 이벤트
- 작은 직접 `curl` 프로브는 성공하지만 일반 SDK 형태 요청은 실패함

증거가 WAF/CDN 차단을 가리키면 provider 측 필터링을 먼저 수정하세요. OpenClaw가
사용하는 API 경로에 대해 좁게 범위가 지정된 허용 또는 건너뛰기 규칙을 선호하고,
전체 사이트의 보호를 비활성화하지 마세요.

<Warning>
최소 `curl` 성공은 실제 SDK 스타일 요청이 같은 업스트림 보안 계층을
통과한다는 것을 보장하지 않습니다.
</Warning>

관련:

- [OpenAI 호환 엔드포인트](/ko/gateway/configuration-reference#openai-compatible-endpoints)
- [Provider 구성](/ko/providers)
- [로그](/ko/logging)

## 로컬 OpenAI 호환 백엔드는 직접 프로브를 통과하지만 agent 실행은 실패함

다음일 때 사용하세요.

- `curl ... /v1/models`가 작동함
- 작은 직접 `/v1/chat/completions` 호출이 작동함
- OpenClaw 모델 실행이 일반 agent 턴에서만 실패함

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

확인할 항목:

- 작은 직접 호출은 성공하지만 OpenClaw 실행은 더 큰 프롬프트에서만 실패함
- 같은 기본 모델 id로 직접 `/v1/chat/completions`가 작동하더라도
  `model_not_found` 또는 404 오류가 발생함
- `messages[].content`가 문자열이어야 한다는 백엔드 오류
- OpenAI 호환 로컬 백엔드에서 간헐적인 `incomplete turn detected ... stopReason=stop payloads=0` 경고
- 더 큰 프롬프트 토큰 수 또는 전체 agent 런타임 프롬프트에서만 나타나는 백엔드 크래시

<AccordionGroup>
  <Accordion title="일반적인 시그니처">
    - 로컬 MLX/vLLM 스타일 서버에서 `model_not_found` → `baseUrl`에 `/v1`이 포함되어 있는지, `/v1/chat/completions` 백엔드의 `api`가 `"openai-completions"`인지, `models.providers.<provider>.models[].id`가 기본 provider 로컬 id인지 확인하세요. 예를 들어 `mlx/mlx-community/Qwen3-30B-A3B-6bit`처럼 provider 접두사를 한 번 붙여 선택하고, 카탈로그 항목은 `mlx-community/Qwen3-30B-A3B-6bit`로 유지하세요.
    - `messages[...].content: invalid type: sequence, expected a string` → 백엔드가 구조화된 Chat Completions content parts를 거부합니다. 수정: `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하세요.
    - `validation.keys` 또는 `["role","content"]` 같은 허용된 메시지 키 → 백엔드가 Chat Completions 메시지의 OpenAI 스타일 replay 메타데이터를 거부합니다. 수정: `models.providers.<provider>.models[].compat.strictMessageKeys: true`를 설정하세요.
    - `incomplete turn detected ... stopReason=stop payloads=0` → 백엔드가 Chat Completions 요청을 완료했지만 해당 턴에 사용자가 볼 수 있는 assistant 텍스트를 반환하지 않았습니다. OpenClaw는 replay-safe 빈 OpenAI 호환 턴을 한 번 다시 시도합니다. 지속적인 실패는 일반적으로 백엔드가 빈/비텍스트 content를 내보내거나 최종 답변 텍스트를 억제한다는 뜻입니다.
    - 작은 직접 요청은 성공하지만 OpenClaw agent 실행이 백엔드/모델 크래시와 함께 실패함(예: 일부 `inferrs` 빌드의 Gemma) → OpenClaw 전송은 이미 올바를 가능성이 큽니다. 백엔드가 더 큰 agent 런타임 프롬프트 형태에서 실패하고 있습니다.
    - 도구를 비활성화한 후 실패가 줄어들지만 사라지지는 않음 → 도구 스키마가 압박의 일부였지만, 남은 문제는 여전히 업스트림 모델/서버 용량 또는 백엔드 버그입니다.

  </Accordion>
  <Accordion title="수정 옵션">
    1. 문자열 전용 Chat Completions 백엔드에는 `compat.requiresStringContent: true`를 설정하세요.
    2. 각 메시지에서 `role`과 `content`만 허용하는 엄격한 Chat Completions 백엔드에는 `compat.strictMessageKeys: true`를 설정하세요.
    3. OpenClaw의 도구 스키마 표면을 안정적으로 처리할 수 없는 모델/백엔드에는 `compat.supportsTools: false`를 설정하세요.
    4. 가능하면 프롬프트 압박을 낮추세요. 더 작은 workspace 부트스트랩, 더 짧은 세션 기록, 더 가벼운 로컬 모델, 또는 더 강한 긴 컨텍스트 지원을 갖춘 백엔드를 사용하세요.
    5. 작은 직접 요청은 계속 통과하지만 OpenClaw agent 턴이 여전히 백엔드 내부에서 크래시한다면, 업스트림 서버/모델 제한으로 취급하고 허용된 payload 형태와 함께 그쪽에 재현 사례를 제출하세요.
  </Accordion>
</AccordionGroup>

관련:

- [구성](/ko/gateway/configuration)
- [로컬 모델](/ko/gateway/local-models)
- [OpenAI 호환 엔드포인트](/ko/gateway/configuration-reference#openai-compatible-endpoints)

## 응답 없음

채널은 올라와 있지만 아무것도 응답하지 않으면, 무언가를 다시 연결하기 전에 라우팅과 정책을 확인하세요.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

확인할 항목:

- DM 발신자에 대해 페어링이 대기 중인지.
- 그룹 멘션 게이팅(`requireMention`, `mentionPatterns`).
- 채널/그룹 허용 목록 불일치.

일반적인 징후:

- `drop guild message (mention required` → 멘션될 때까지 그룹 메시지가 무시됩니다.
- `pairing request` → 발신자 승인이 필요합니다.
- `blocked` / `allowlist` → 발신자/채널이 정책에 의해 필터링되었습니다.

관련 항목:

- [채널 문제 해결](/ko/channels/troubleshooting)
- [그룹](/ko/channels/groups)
- [페어링](/ko/channels/pairing)

## 대시보드 제어 UI 연결

대시보드/제어 UI가 연결되지 않으면 URL, 인증 모드, 보안 컨텍스트 가정을 검증하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

확인할 항목:

- 올바른 프로브 URL 및 대시보드 URL.
- 클라이언트와 Gateway 간 인증 모드/토큰 불일치.
- 디바이스 ID가 필요한 곳에서 HTTP를 사용하는지.

업데이트 후 로컬 브라우저가 `127.0.0.1:18789`에 연결할 수 없다면, 먼저 로컬 Gateway 서비스를 복구하고 대시보드를 제공 중인지 확인하세요.

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

`curl`이 OpenClaw HTML을 반환하면 Gateway는 작동 중이며, 남은 문제는 브라우저 캐시, 오래된 딥 링크, 또는 오래된 탭 상태일 가능성이 큽니다. `http://127.0.0.1:18789`를 직접 열고 대시보드에서 이동하세요. 재시작 후에도 서비스가 계속 실행되지 않으면 `openclaw gateway start`를 실행하고 `openclaw gateway status`를 다시 확인하세요.

<AccordionGroup>
  <Accordion title="연결 / 인증 징후">
    - `device identity required` → 비보안 컨텍스트이거나 디바이스 인증이 없습니다.
    - `origin not allowed` → 브라우저 `Origin`이 `gateway.controlUi.allowedOrigins`에 없습니다(또는 명시적 허용 목록 없이 비루프백 브라우저 출처에서 연결 중입니다).
    - `device nonce required` / `device nonce mismatch` → 클라이언트가 챌린지 기반 디바이스 인증 흐름(`connect.challenge` + `device.nonce`)을 완료하지 않고 있습니다.
    - `device signature invalid` / `device signature expired` → 클라이언트가 현재 핸드셰이크에 대해 잘못된 페이로드(또는 오래된 타임스탬프)에 서명했습니다.
    - `canRetryWithDeviceToken=true`가 있는 `AUTH_TOKEN_MISMATCH` → 클라이언트가 캐시된 디바이스 토큰으로 신뢰된 재시도를 한 번 수행할 수 있습니다.
    - 해당 캐시 토큰 재시도는 페어링된 디바이스 토큰과 함께 저장된 캐시된 스코프 집합을 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 대신 요청한 스코프 집합을 유지합니다.
    - `AUTH_SCOPE_MISMATCH` → 디바이스 토큰은 인식되었지만 승인된 스코프가 이 연결 요청을 포함하지 않습니다. 공유 Gateway 토큰을 교체하지 말고 다시 페어링하거나 요청된 스코프 계약을 승인하세요.
    - 해당 재시도 경로 밖에서는 연결 인증 우선순위가 명시적 공유 토큰/비밀번호, 명시적 `deviceToken`, 저장된 디바이스 토큰, 부트스트랩 토큰 순입니다.
    - 비동기 Tailscale Serve 제어 UI 경로에서는 같은 `{scope, ip}`에 대한 실패 시도가 리미터가 실패를 기록하기 전에 직렬화됩니다. 따라서 같은 클라이언트에서 동시에 두 번 잘못 재시도하면 두 번의 단순 불일치 대신 두 번째 시도에서 `retry later`가 나타날 수 있습니다.
    - 브라우저 출처 루프백 클라이언트에서 `too many failed authentication attempts (retry later)` → 같은 정규화된 `Origin`에서 반복된 실패가 일시적으로 잠깁니다. 다른 localhost 출처는 별도 버킷을 사용합니다.
    - 해당 재시도 후에도 `unauthorized`가 반복됨 → 공유 토큰/디바이스 토큰 드리프트입니다. 토큰 구성을 새로 고치고 필요하면 디바이스 토큰을 다시 승인/교체하세요.
    - `gateway connect failed:` → 잘못된 호스트/포트/URL 대상입니다.

  </Accordion>
</AccordionGroup>

### 인증 세부 코드 빠른 매핑

실패한 `connect` 응답의 `error.details.code`를 사용해 다음 작업을 선택하세요.

| 세부 코드                  | 의미                                                                                                                                                                                      | 권장 작업                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 클라이언트가 필요한 공유 토큰을 보내지 않았습니다.                                                                                                                                                 | 클라이언트에 토큰을 붙여넣거나 설정한 뒤 다시 시도하세요. 대시보드 경로의 경우: `openclaw config get gateway.auth.token` 후 제어 UI 설정에 붙여넣으세요.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 공유 토큰이 Gateway 인증 토큰과 일치하지 않았습니다.                                                                                                                                               | `canRetryWithDeviceToken=true`이면 신뢰된 재시도를 한 번 허용하세요. 캐시 토큰 재시도는 저장된 승인 스코프를 재사용하며, 명시적 `deviceToken` / `scopes` 호출자는 요청한 스코프를 유지합니다. 계속 실패하면 [토큰 드리프트 복구 체크리스트](/ko/cli/devices#token-drift-recovery-checklist)를 실행하세요. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 캐시된 디바이스별 토큰이 오래되었거나 폐기되었습니다.                                                                                                                                                 | [디바이스 CLI](/ko/cli/devices)를 사용해 디바이스 토큰을 교체/재승인한 다음 다시 연결하세요.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | 디바이스 토큰은 유효하지만 승인된 역할/스코프가 이 연결 요청을 포함하지 않습니다.                                                                                                       | 디바이스를 다시 페어링하거나 요청된 스코프 계약을 승인하세요. 이를 공유 토큰 드리프트로 취급하지 마세요.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | 디바이스 ID에 승인이 필요합니다. `not-paired`, `scope-upgrade`, `role-upgrade`, 또는 `metadata-upgrade`에 대해 `error.details.reason`을 확인하고, 있으면 `requestId` / `remediationHint`를 사용하세요. | 대기 중인 요청을 승인하세요: `openclaw devices list` 후 `openclaw devices approve <requestId>`. 스코프/역할 업그레이드는 요청된 접근 권한을 검토한 뒤 같은 흐름을 사용합니다.                                                                                                               |

<Note>
공유 Gateway 토큰/비밀번호로 인증된 직접 루프백 백엔드 RPC는 CLI의 페어링된 디바이스 스코프 기준선에 의존해서는 안 됩니다. 하위 에이전트나 다른 내부 호출이 여전히 `scope-upgrade`로 실패한다면, 호출자가 `client.id: "gateway-client"` 및 `client.mode: "backend"`를 사용하고 있고 명시적 `deviceIdentity` 또는 디바이스 토큰을 강제하지 않는지 확인하세요.
</Note>

디바이스 인증 v2 마이그레이션 확인:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 논스/서명 오류가 표시되면 연결 클라이언트를 업데이트하고 검증하세요.

<Steps>
  <Step title="connect.challenge 대기">
    클라이언트는 Gateway가 발급한 `connect.challenge`를 기다립니다.
  </Step>
  <Step title="페이로드 서명">
    클라이언트는 챌린지에 바인딩된 페이로드에 서명합니다.
  </Step>
  <Step title="디바이스 논스 전송">
    클라이언트는 동일한 챌린지 논스와 함께 `connect.params.device.nonce`를 전송합니다.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove`가 예상치 못하게 거부되는 경우:

- 페어링된 디바이스 토큰 세션은 호출자에게 `operator.admin`도 있는 경우가 아니면 **자기 자신의** 디바이스만 관리할 수 있습니다.
- `openclaw devices rotate --scope ...`는 호출자 세션이 이미 보유한 운영자 스코프만 요청할 수 있습니다.

관련 항목:

- [구성](/ko/gateway/configuration) (Gateway 인증 모드)
- [제어 UI](/ko/web/control-ui)
- [디바이스](/ko/cli/devices)
- [원격 접근](/ko/gateway/remote)
- [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)

## Gateway 서비스가 실행 중이 아님

서비스가 설치되어 있지만 프로세스가 계속 유지되지 않을 때 사용하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 시스템 수준 서비스도 스캔
```

확인할 항목:

- 종료 힌트가 있는 `Runtime: stopped`.
- 서비스 구성 불일치(`Config (cli)` 대 `Config (service)`).
- 포트/리스너 충돌.
- `--deep` 사용 시 추가 launchd/systemd/schtasks 설치.
- `Other gateway-like services detected (best effort)` 정리 힌트.

<AccordionGroup>
  <Accordion title="일반적인 징후">
    - `Gateway start blocked: set gateway.mode=local` 또는 `existing config is missing gateway.mode` → 로컬 Gateway 모드가 활성화되지 않았거나, 구성 파일이 덮어써져 `gateway.mode`가 손실되었습니다. 해결: 구성에서 `gateway.mode="local"`을 설정하거나, `openclaw onboard --mode local` / `openclaw setup`을 다시 실행해 예상되는 로컬 모드 구성을 다시 찍으세요. Podman을 통해 OpenClaw를 실행 중이면 기본 구성 경로는 `~/.openclaw/openclaw.json`입니다.
    - `refusing to bind gateway ... without auth` → 유효한 Gateway 인증 경로(토큰/비밀번호 또는 구성된 경우 신뢰할 수 있는 프록시) 없이 비루프백 바인딩을 시도했습니다.
    - `another gateway instance is already listening` / `EADDRINUSE` → 포트 충돌입니다.
    - `Other gateway-like services detected (best effort)` → 오래되었거나 병렬로 실행되는 launchd/systemd/schtasks 유닛이 있습니다. 대부분의 설정은 머신당 하나의 Gateway를 유지해야 합니다. 둘 이상이 정말 필요하다면 포트 + 구성/상태/작업 영역을 분리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.
    - doctor의 `System-level OpenClaw gateway service detected` → 사용자 수준 서비스가 없는 상태에서 systemd 시스템 유닛이 존재합니다. doctor가 사용자 서비스를 설치하도록 허용하기 전에 중복 항목을 제거하거나 비활성화하세요. 시스템 유닛이 의도한 감독자라면 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요.
    - `Gateway service port does not match current gateway config` → 설치된 감독자가 여전히 이전 `--port`를 고정하고 있습니다. `openclaw doctor --fix` 또는 `openclaw gateway install --force`를 실행한 뒤 Gateway 서비스를 재시작하세요.

  </Accordion>
</AccordionGroup>

관련 항목:

- [백그라운드 실행 및 프로세스 도구](/ko/gateway/background-process)
- [구성](/ko/gateway/configuration)
- [Doctor](/ko/gateway/doctor)

## macOS Gateway가 조용히 응답을 멈췄다가, 대시보드를 건드리면 다시 응답함

macOS 호스트의 채널(Telegram, WhatsApp 등)이 한 번에 몇 분에서 몇 시간 동안 조용해지고, 제어 UI를 열거나 SSH로 접속하거나 그 밖의 방식으로 호스트와 상호작용하는 순간 Gateway가 다시 돌아오는 것처럼 보일 때 사용하세요. 확인할 때쯤에는 Gateway가 다시 살아 있으므로 보통 `openclaw status`에는 명확한 증상이 없습니다.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

확인할 사항:

- `~/.openclaw/logs/stability/`에 있는 하나 이상의 `*-uncaught_exception.json` 번들에서 `error.code`가 `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH`, `ECONNREFUSED` 같은 일시적 네트워크 코드로 설정되어 있는지 확인합니다.
- 충돌 타임스탬프와 일치하는 `Entering Sleep state due to 'Maintenance Sleep'` 또는 `en0 driver is slow (msg: WillChangeState to 0)` 같은 `pmset -g log` 줄을 확인합니다. Power Nap / Maintenance Sleep은 Wi-Fi 드라이버를 잠깐 상태 0으로 전환합니다. 그 시간대에 걸린 모든 아웃바운드 `connect()`는 그 외에는 네트워크 연결이 정상인 호스트에서도 `ENETDOWN`으로 실패할 수 있습니다.
- `launchctl print` 출력에서 `state = not running`이 표시되고 최근 `runs`가 여러 번 있으며 종료 코드가 있는지 확인합니다. 특히 충돌과 다음 실행 사이의 간격이 몇 초가 아니라 한 시간 정도일 때 그렇습니다. macOS launchd는 충돌이 짧은 시간에 몰린 뒤 문서화되지 않은 재시작 보호 게이트를 적용하며, 대화형 로그인, 대시보드 연결, `launchctl kickstart` 같은 외부 트리거가 다시 활성화할 때까지 `KeepAlive=true`를 더 이상 따르지 않을 수 있습니다.

일반적인 징후:

- `error.code`가 `ENETDOWN` 또는 유사 코드이고 호출 스택이 Node `net` `lookupAndConnect` / `Socket.connect`를 가리키는 안정성 번들. OpenClaw `2026.5.26` 이상은 이를 무해한 일시적 네트워크 오류로 분류하므로 더 이상 최상위 미처리 핸들러로 전파되지 않습니다. 더 오래된 릴리스를 사용 중이라면 먼저 업그레이드하세요.
- Control UI에 연결하거나 호스트에 SSH로 접속하는 즉시 끝나는 긴 무활동 기간: Gateway에 대해 대시보드가 수행한 작업이 아니라 사용자에게 보이는 활동이 launchd의 재시작 게이트를 다시 활성화합니다.
- 하루 동안 `runs` 횟수가 증가하지만 `~/Library/Logs/openclaw/gateway.log`에 대응하는 `received SIG*; shutting down` 줄이 없는 경우: 정상 종료는 신호를 기록하지만, 일시적 충돌은 기록하지 않습니다.

해야 할 일:

1. `2026.5.26` 이전 릴리스를 실행 중이라면 **Gateway를 업그레이드**합니다. 업그레이드 후에는 이후의 `ENETDOWN` 오류가 프로세스를 종료하는 대신 경고로 기록됩니다.
2. 항상 켜져 있는 서버로 실행해야 하는 Mac mini / 데스크톱 호스트에서는 **유지 관리 절전 활동을 줄입니다**.

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   이렇게 하면 근본적인 드라이버 상태 변동이 크게 줄어들지만 완전히 없어지지는 않습니다. 시스템은 이 플래그와 관계없이 TCP keepalive 및 mDNS 유지 관리를 위해 일부 유지 관리 절전을 계속 수행할 수 있습니다.

3. 향후 충돌이 짧은 시간에 몰려 launchd에 의해 정지되는 상황을 빠르게 감지하도록 **활성 상태 감시기**를 추가합니다.

   ```bash
   # Example launchd-aware liveness check, suitable for a 5-minute cron or LaunchAgent
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   핵심은 재시작 게이트를 외부에서 다시 활성화하는 것입니다. macOS에서는 충돌이 짧은 시간에 몰린 뒤 `KeepAlive=true`만으로는 충분하지 않습니다.

관련 항목:

- [macOS 플랫폼 참고 사항](/ko/platforms/macos)
- [로깅](/ko/logging)
- [진단 도구](/ko/gateway/doctor)

## 높은 메모리 사용 중 Gateway가 종료됨

Gateway가 부하 상태에서 사라지거나, 감독자가 OOM 유형의 재시작을 보고하거나, 로그에 `critical memory pressure bundle written`이 언급될 때 사용합니다.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

확인할 사항:

- 최신 안정성 번들의 `Reason: diagnostic.memory.pressure.critical`.
- `critical/rss_threshold`, `critical/heap_threshold`, `critical/rss_growth`가 포함된 `Memory pressure:`.
- 힙 한도에 가까운 `V8 heap:` 값.
- `agents/<agent>/sessions/<session>.jsonl` 또는 `sessions/<session>.jsonl` 같은 `Largest session files:` 항목.
- Gateway가 컨테이너 또는 메모리 제한 서비스 안에서 실행될 때의 Linux cgroup 메모리 카운터.

일반적인 징후:

- 재시작 직전에 `critical memory pressure bundle written`이 나타남 → OpenClaw가 OOM 전 안정성 번들을 캡처했습니다. `openclaw gateway stability --bundle latest`로 검사하세요.
- Gateway 로그에 `memory pressure: level=critical ... memoryPressureSnapshot=disabled`가 나타남 → OpenClaw가 심각한 메모리 압박을 감지했지만, OOM 전 안정성 스냅샷은 꺼져 있습니다.
- `Largest session files:`가 매우 큰 수정된 대화 기록 경로를 가리킴 → 재시작하기 전에 보존된 세션 기록을 줄이고, 세션 증가를 검사하거나, 오래된 대화 기록을 활성 저장소 밖으로 옮깁니다.
- `V8 heap:` 사용 바이트가 힙 한도에 가까움 → 프롬프트/세션 압박을 낮추고, 동시 작업을 줄이거나, 워크로드가 예상된 것임을 확인한 뒤에만 Node 힙 한도를 높입니다.
- `Memory pressure: critical/rss_growth` → 하나의 샘플링 창 안에서 메모리가 빠르게 증가했습니다. 최신 로그에서 대규모 가져오기, 폭주하는 도구 출력, 반복 재시도, 대기열에 쌓인 에이전트 작업 묶음을 확인하세요.
- 로그에는 심각한 메모리 압박이 나타나지만 번들이 없음 → 이것이 기본값입니다. 향후 심각한 메모리 압박 이벤트에서 OOM 전 안정성 번들을 캡처하려면 `diagnostics.memoryPressureSnapshot: true`를 설정하세요.

안정성 번들에는 페이로드가 없습니다. 여기에는 운영 메모리 증거와 수정된 상대 파일 경로가 포함되며, 메시지 텍스트, Webhook 본문, 자격 증명, 토큰, 쿠키, 원시 세션 ID는 포함되지 않습니다. 원시 로그를 복사하는 대신 버그 보고서에 진단 내보내기를 첨부하세요.

관련 항목:

- [Gateway 상태](/ko/gateway/health)
- [진단 내보내기](/ko/gateway/diagnostics)
- [세션](/ko/cli/sessions)

## Gateway가 잘못된 구성을 거부함

Gateway 시작이 `Invalid config`로 실패하거나 핫 리로드 로그에 잘못된 편집을 건너뛰었다고 표시될 때 사용합니다.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

확인할 사항:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- 활성 구성 옆의 타임스탬프가 있는 `openclaw.json.rejected.*` 파일
- `doctor --fix`가 손상된 직접 편집을 복구한 경우 타임스탬프가 있는 `openclaw.json.clobbered.*` 파일
- OpenClaw는 각 구성 경로에 대해 최신 32개의 `.clobbered.*` 파일을 유지하고 더 오래된 파일을 순환합니다.

<AccordionGroup>
  <Accordion title="발생한 일">
    - 시작, 핫 리로드 또는 OpenClaw 소유 쓰기 중에 구성이 검증을 통과하지 못했습니다.
    - Gateway 시작은 `openclaw.json`을 다시 쓰는 대신 닫힌 상태로 실패합니다.
    - 핫 리로드는 잘못된 외부 편집을 건너뛰고 현재 런타임 구성을 활성 상태로 유지합니다.
    - OpenClaw 소유 쓰기는 커밋 전에 잘못되었거나 파괴적인 페이로드를 거부하고 `.rejected.*`를 저장합니다.
    - `openclaw doctor --fix`가 복구를 소유합니다. 거부된 페이로드를 `.clobbered.*`로 보존하면서 JSON이 아닌 접두사를 제거하거나 마지막으로 확인된 정상 복사본을 복원할 수 있습니다.
    - 하나의 구성 경로에 대해 복구가 많이 발생하면 OpenClaw는 더 오래된 `.clobbered.*` 파일을 순환하여 최신 복구 페이로드를 계속 사용할 수 있게 합니다.

  </Accordion>
  <Accordion title="검사 및 복구">
    ```bash
    CONFIG="$(openclaw config file)"
    ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
    diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
    openclaw config validate
    openclaw doctor
    ```
  </Accordion>
  <Accordion title="일반적인 징후">
    - `.clobbered.*`가 있음 → doctor가 활성 구성을 복구하면서 손상된 외부 편집을 보존했습니다.
    - `.rejected.*`가 있음 → OpenClaw 소유 구성 쓰기가 커밋 전에 스키마 또는 덮어쓰기 검사를 통과하지 못했습니다.
    - `Config write rejected:` → 쓰기가 필수 형태를 삭제하거나, 파일을 급격히 줄이거나, 잘못된 구성을 저장하려고 했습니다.
    - `config reload skipped (invalid config):` → 직접 편집이 검증에 실패하여 실행 중인 Gateway에서 무시되었습니다.
    - `Invalid config at ...` → Gateway 서비스가 부팅되기 전에 시작이 실패했습니다.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good`, `size-drop-vs-last-good:*` → OpenClaw 소유 쓰기가 마지막으로 확인된 정상 백업과 비교해 필드 또는 크기를 잃어 거부되었습니다.
    - `Config last-known-good promotion skipped` → 후보에 `***` 같은 수정된 비밀 플레이스홀더가 포함되어 있었습니다.

  </Accordion>
  <Accordion title="수정 옵션">
    1. `openclaw doctor --fix`를 실행하여 doctor가 접두사가 붙었거나 덮어쓴 구성을 복구하거나 마지막으로 확인된 정상 항목을 복원하게 합니다.
    2. `.clobbered.*` 또는 `.rejected.*`에서 의도한 키만 복사한 다음 `openclaw config set` 또는 `config.patch`로 적용합니다.
    3. 재시작하기 전에 `openclaw config validate`를 실행합니다.
    4. 손으로 편집하는 경우 변경하려는 부분 객체만이 아니라 전체 JSON5 구성을 유지하세요.
  </Accordion>
</AccordionGroup>

관련 항목:

- [구성](/ko/cli/config)
- [구성: 핫 리로드](/ko/gateway/configuration#config-hot-reload)
- [구성: 엄격한 검증](/ko/gateway/configuration#strict-validation)
- [진단 도구](/ko/gateway/doctor)

## Gateway 프로브 경고

`openclaw gateway probe`가 무언가에 도달했지만 여전히 경고 블록을 출력할 때 사용합니다.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

확인할 사항:

- JSON 출력의 `warnings[].code` 및 `primaryTargetId`.
- 경고가 SSH 폴백, 여러 Gateway, 누락된 범위, 또는 확인되지 않은 인증 참조에 관한 것인지 여부.

일반적인 징후:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 설정이 실패했지만, 명령이 직접 구성된 대상 또는 loopback 대상을 계속 시도했습니다.
- `multiple reachable gateway identities detected` → 서로 다른 Gateway가 응답했거나, OpenClaw가 도달 가능한 대상이 같은 Gateway인지 증명할 수 없었습니다. 같은 Gateway에 대한 SSH 터널, 프록시 URL, 또는 구성된 원격 URL은 전송 포트가 다르더라도 여러 전송을 가진 하나의 Gateway로 처리됩니다.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 연결은 되었지만 세부 RPC가 범위로 제한되어 있습니다. 장치 ID를 페어링하거나 `operator.read`가 있는 자격 증명을 사용하세요.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 연결은 되었지만 전체 진단 RPC 집합이 시간 초과되었거나 실패했습니다. 이를 진단 성능이 저하된 도달 가능한 Gateway로 취급하고, `--json` 출력에서 `connect.ok`와 `connect.rpcOk`를 비교하세요.
- `Capability: pairing-pending` 또는 `gateway closed (1008): pairing required` → Gateway가 응답했지만, 이 클라이언트는 일반 운영자 접근 전에 여전히 페어링/승인이 필요합니다.
- 확인되지 않은 `gateway.auth.*` / `gateway.remote.*` SecretRef 경고 텍스트 → 실패한 대상에 대해 이 명령 경로에서 인증 자료를 사용할 수 없었습니다.

관련 항목:

- [Gateway](/ko/cli/gateway)
- [같은 호스트의 여러 Gateway](/ko/gateway#multiple-gateways-same-host)
- [원격 접근](/ko/gateway/remote)

## 채널은 연결되었지만 메시지가 흐르지 않음

채널 상태가 연결됨이지만 메시지 흐름이 멈춘 경우 정책, 권한, 채널별 전달 규칙에 집중하세요.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

확인할 사항:

- DM 정책(`pairing`, `allowlist`, `open`, `disabled`).
- 그룹 허용 목록 및 멘션 요구 사항.
- 누락된 채널 API 권한/범위.

일반적인 징후:

- `mention required` → 그룹 멘션 정책에 의해 메시지가 무시되었습니다.
- `pairing` / 승인 대기 추적 → 발신자가 승인되지 않았습니다.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 채널 인증/권한 문제입니다.

관련 항목:

- [채널 문제 해결](/ko/channels/troubleshooting)
- [Discord](/ko/channels/discord)
- [Telegram](/ko/channels/telegram)
- [WhatsApp](/ko/channels/whatsapp)

## Cron 및 Heartbeat 전달

Cron 또는 Heartbeat가 실행되지 않았거나 전달되지 않은 경우 먼저 스케줄러 상태를 확인한 다음 전달 대상을 확인하세요.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

확인할 항목:

- Cron이 활성화되어 있고 다음 깨우기 시간이 있는지.
- 작업 실행 기록 상태(`ok`, `skipped`, `error`).
- Heartbeat 건너뛰기 이유(`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="Common signatures">
    - `cron: scheduler disabled; jobs will not run automatically` → cron이 비활성화됨.
    - `cron: timer tick failed` → 스케줄러 틱 실패. 파일/로그/런타임 오류를 확인하세요.
    - `heartbeat skipped`와 `reason=quiet-hours` → 활성 시간 창 밖임.
    - `heartbeat skipped`와 `reason=empty-heartbeat-file` → `HEARTBEAT.md`가 있지만 빈 줄, 주석, 헤더, 펜스 또는 빈 체크리스트 스캐폴딩만 포함되어 있어 OpenClaw가 모델 호출을 건너뜁니다.
    - `heartbeat skipped`와 `reason=no-tasks-due` → `HEARTBEAT.md`에 `tasks:` 블록이 있지만 이번 틱에 기한이 된 작업이 없습니다.
    - `heartbeat: unknown accountId` → Heartbeat 전달 대상의 계정 ID가 잘못되었습니다.
    - `heartbeat skipped`와 `reason=dm-blocked` → `agents.defaults.heartbeat.directPolicy`(또는 에이전트별 재정의)가 `block`으로 설정된 상태에서 Heartbeat 대상이 DM 스타일 대상으로 해석되었습니다.

  </Accordion>
</AccordionGroup>

관련 항목:

- [Heartbeat](/ko/gateway/heartbeat)
- [예약된 작업](/ko/automation/cron-jobs)
- [예약된 작업: 문제 해결](/ko/automation/cron-jobs#troubleshooting)

## Node가 페어링되었지만 도구가 실패함

Node가 페어링되었지만 도구가 실패하면 포그라운드, 권한, 승인 상태를 분리해서 확인하세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

확인할 항목:

- Node가 온라인이고 예상 기능을 갖추었는지.
- 카메라/마이크/위치/화면에 대한 OS 권한 부여.
- Exec 승인 및 허용 목록 상태.

일반적인 시그니처:

- `NODE_BACKGROUND_UNAVAILABLE` → node 앱이 포그라운드에 있어야 합니다.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 권한이 누락되었습니다.
- `SYSTEM_RUN_DENIED: approval required` → exec 승인이 대기 중입니다.
- `SYSTEM_RUN_DENIED: allowlist miss` → 명령이 허용 목록에 의해 차단되었습니다.

관련 항목:

- [Exec 승인](/ko/tools/exec-approvals)
- [Node 문제 해결](/ko/nodes/troubleshooting)
- [Nodes](/ko/nodes/index)

## 브라우저 도구 실패

Gateway 자체는 정상인데 브라우저 도구 작업이 실패할 때 사용하세요.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

확인할 항목:

- `plugins.allow`가 설정되어 있고 `browser`를 포함하는지.
- 유효한 브라우저 실행 파일 경로.
- CDP 프로필 도달 가능성.
- `existing-session` / `user` 프로필을 위한 로컬 Chrome 사용 가능 여부.

<AccordionGroup>
  <Accordion title="Plugin / executable signatures">
    - `unknown command "browser"` 또는 `unknown command 'browser'` → 번들 브라우저 Plugin이 `plugins.allow`에서 제외되었습니다.
    - `browser.enabled=true`인데 브라우저 도구가 없거나 사용할 수 없음 → `plugins.allow`가 `browser`를 제외하여 Plugin이 로드되지 않았습니다.
    - `Failed to start Chrome CDP on port` → 브라우저 프로세스를 시작하지 못했습니다.
    - `browser.executablePath not found` → 구성된 경로가 잘못되었습니다.
    - `browser.cdpUrl must be http(s) or ws(s)` → 구성된 CDP URL이 `file:` 또는 `ftp:` 같은 지원되지 않는 스킴을 사용합니다.
    - `browser.cdpUrl has invalid port` → 구성된 CDP URL의 포트가 잘못되었거나 범위를 벗어났습니다.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 현재 Gateway 설치에 핵심 브라우저 런타임 의존성이 없습니다. OpenClaw를 다시 설치하거나 업데이트한 다음 Gateway를 다시 시작하세요. ARIA 스냅샷과 기본 페이지 스크린샷은 계속 작동할 수 있지만, 탐색, AI 스냅샷, CSS 선택자 요소 스크린샷, PDF 내보내기는 계속 사용할 수 없습니다.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session signatures">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session이 아직 선택한 브라우저 데이터 디렉터리에 연결할 수 없습니다. 브라우저 검사 페이지를 열고 원격 디버깅을 활성화한 뒤, 브라우저를 열린 상태로 유지하고 첫 연결 프롬프트를 승인한 다음 다시 시도하세요. 로그인 상태가 필요하지 않다면 관리형 `openclaw` 프로필을 선호하세요.
    - `No Chrome tabs found for profile="user"` → Chrome MCP 연결 프로필에 열린 로컬 Chrome 탭이 없습니다.
    - `Remote CDP for profile "<name>" is not reachable` → 구성된 원격 CDP 엔드포인트에 Gateway 호스트에서 도달할 수 없습니다.
    - `Browser attachOnly is enabled ... not reachable` 또는 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → attach-only 프로필에 도달 가능한 대상이 없거나, HTTP 엔드포인트가 응답했지만 CDP WebSocket을 열 수 없었습니다.

  </Accordion>
  <Accordion title="Element / screenshot / upload signatures">
    - `fullPage is not supported for element screenshots` → 스크린샷 요청에서 `--full-page`를 `--ref` 또는 `--element`와 함께 사용했습니다.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 스크린샷 호출은 CSS `--element`가 아니라 페이지 캡처 또는 스냅샷 `--ref`를 사용해야 합니다.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 업로드 훅에는 CSS 선택자가 아니라 스냅샷 ref가 필요합니다.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP 프로필에서는 호출당 업로드 하나만 보내세요.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 프로필의 다이얼로그 훅은 타임아웃 재정의를 지원하지 않습니다.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session 프로필의 `act:type`에서는 `timeoutMs`를 생략하거나, 사용자 지정 타임아웃이 필요할 때 관리형/CDP 브라우저 프로필을 사용하세요.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session 프로필의 `act:evaluate`에서는 `timeoutMs`를 생략하거나, 사용자 지정 타임아웃이 필요할 때 관리형/CDP 브라우저 프로필을 사용하세요.
    - `response body is not supported for existing-session profiles yet.` → `responsebody`에는 아직 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다.
    - attach-only 또는 원격 CDP 프로필에서 오래된 뷰포트 / 다크 모드 / 로캘 / 오프라인 재정의 → 전체 Gateway를 다시 시작하지 않고 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 상태를 해제하려면 `openclaw browser stop --browser-profile <name>`을 실행하세요.

  </Accordion>
</AccordionGroup>

관련 항목:

- [브라우저(OpenClaw 관리형)](/ko/tools/browser)
- [브라우저 문제 해결](/ko/tools/browser-linux-troubleshooting)

## 업그레이드 후 갑자기 문제가 생긴 경우

대부분의 업그레이드 후 손상은 구성 드리프트 또는 이제 적용되는 더 엄격한 기본값 때문입니다.

<AccordionGroup>
  <Accordion title="1. Auth and URL override behavior changed">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    확인할 항목:

    - `gateway.mode=remote`이면 로컬 서비스는 정상이어도 CLI 호출이 원격을 대상으로 할 수 있습니다.
    - 명시적 `--url` 호출은 저장된 자격 증명으로 폴백하지 않습니다.

    일반적인 시그니처:

    - `gateway connect failed:` → URL 대상이 잘못되었습니다.
    - `unauthorized` → 엔드포인트에는 도달했지만 인증이 잘못되었습니다.

  </Accordion>
  <Accordion title="2. Bind and auth guardrails are stricter">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    확인할 항목:

    - 비-loopback 바인드(`lan`, `tailnet`, `custom`)에는 유효한 Gateway 인증 경로가 필요합니다. 공유 토큰/비밀번호 인증 또는 올바르게 구성된 비-loopback `trusted-proxy` 배포가 필요합니다.
    - `gateway.token` 같은 이전 키는 `gateway.auth.token`을 대체하지 않습니다.

    일반적인 시그니처:

    - `refusing to bind gateway ... without auth` → 유효한 Gateway 인증 경로 없이 비-loopback 바인드를 시도했습니다.
    - 런타임이 실행 중인데 `Connectivity probe: failed` → Gateway는 살아 있지만 현재 인증/url로 접근할 수 없습니다.

  </Accordion>
  <Accordion title="3. Pairing and device identity state changed">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    확인할 항목:

    - 대시보드/노드의 보류 중인 디바이스 승인.
    - 정책 또는 ID 변경 후 보류 중인 DM 페어링 승인.

    일반적인 시그니처:

    - `device identity required` → 디바이스 인증이 충족되지 않았습니다.
    - `pairing required` → 발신자/디바이스가 승인되어야 합니다.

  </Accordion>
</AccordionGroup>

확인 후에도 서비스 구성과 런타임이 여전히 일치하지 않으면 같은 프로필/상태 디렉터리에서 서비스 메타데이터를 다시 설치하세요.

```bash
openclaw gateway install --force
openclaw gateway restart
```

관련 항목:

- [인증](/ko/gateway/authentication)
- [백그라운드 exec 및 프로세스 도구](/ko/gateway/background-process)
- [Gateway 소유 페어링](/ko/gateway/pairing)

## 관련 항목

- [Doctor](/ko/gateway/doctor)
- [FAQ](/ko/help/faq)
- [Gateway 런북](/ko/gateway)
