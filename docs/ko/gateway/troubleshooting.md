---
read_when:
    - 문제 해결 허브에서 더 심층적인 진단을 위해 이 페이지로 안내했습니다.
    - 정확한 명령어가 포함된 증상 기반의 안정적인 런북 섹션이 필요합니다.
sidebarTitle: Troubleshooting
summary: Gateway, 채널, 자동화, Node 및 브라우저를 위한 심층 문제 해결 런북
title: 문제 해결
x-i18n:
    generated_at: "2026-07-12T15:22:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f53064a0d42e601ec1a1904fc9d0e8ebb9def7a2fb9d2579c7f10ca675b8f7fd
    source_path: gateway/troubleshooting.md
    workflow: 16
---

이 문서는 심층 런북입니다. 먼저 빠른 트리아지 절차는 [/help/troubleshooting](/ko/help/troubleshooting)에서 시작하십시오.

## 명령 실행 순서

다음 순서대로 실행하십시오.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

정상 상태 신호:

- `openclaw gateway status`에 `Runtime: running`, `Connectivity probe: ok`, `Capability: ...` 줄이 표시됩니다.
- `openclaw doctor`에서 차단을 유발하는 구성/서비스 문제가 보고되지 않습니다.
- `openclaw channels status --probe`에 계정별 실시간 전송 상태가 표시되며, 지원되는 경우 `works` 또는 `audit ok`가 표시됩니다.

## 업데이트 후

업데이트가 완료되었지만 Gateway가 중단되었거나, 채널이 비어 있거나, 모델 호출이 401 오류로 실패할 때 사용하십시오.

```bash
openclaw status --all
openclaw update status --json
openclaw gateway status --deep
openclaw doctor --fix
openclaw gateway restart
```

확인할 사항:

- `openclaw status` / `openclaw status --all`의 `Update restart`. 대기 중이거나 실패한 인계에는 다음으로 실행할 명령이 포함됩니다.
- Channels 아래의 `plugin load failed: dependency tree corrupted; run openclaw doctor --fix`: 채널 구성은 아직 존재하지만 채널을 로드하기 전에 Plugin 등록에 실패했습니다.
- 재인증 후 공급자 401 오류: `openclaw doctor --fix`는 에이전트별로 남아 있는 오래된 OAuth 인증 섀도를 확인하고 이전 복사본을 제거하여 모든 에이전트가 현재 공유 프로필을 해석하도록 합니다.

## 분리된 설치와 최신 구성 보호 장치

업데이트 후 Gateway 서비스가 예기치 않게 중지되거나, 로그에 한 `openclaw` 바이너리가 마지막으로 `openclaw.json`을 기록한 버전보다 오래된 것으로 표시될 때 사용하십시오.

OpenClaw는 구성 기록 시 `meta.lastTouchedVersion`을 스탬프합니다. 읽기 전용 명령은 최신 OpenClaw가 기록한 구성을 검사할 수 있지만, 이전 바이너리에서는 프로세스 및 서비스 변경 실행이 거부됩니다. 차단되는 작업은 Gateway 서비스 시작/중지/재시작/제거, 강제 서비스 재설치, 서비스 모드 Gateway 시작, `gateway --force` 포트 정리입니다.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH 수정">
    `openclaw`가 최신 설치를 가리키도록 `PATH`를 수정한 다음 작업을 다시 실행하십시오.
  </Step>
  <Step title="Gateway 서비스 재설치">
    최신 설치에서 사용할 Gateway 서비스를 다시 설치하십시오.

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="오래된 래퍼 제거">
    여전히 이전 `openclaw` 바이너리를 가리키는 오래된 시스템 패키지 또는 이전 래퍼 항목을 제거하십시오.
  </Step>
</Steps>

<Warning>
의도적인 다운그레이드 또는 긴급 복구에만 단일 명령에 대해 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`을 설정하십시오. 정상 작동 시에는 설정하지 마십시오.
</Warning>

## 롤백 후 프로토콜 불일치

다운그레이드 또는 롤백 후 로그에 `protocol mismatch`가 계속 출력될 때 사용하십시오. 이전 Gateway가 실행 중이지만, 최신 로컬 클라이언트 프로세스가 이전 Gateway에서 지원할 수 없는 프로토콜 범위로 계속 재연결하고 있습니다.

```bash
openclaw --version
which -a openclaw
openclaw gateway status --deep
openclaw doctor --deep
openclaw logs --follow
```

확인할 사항:

- Gateway 로그의 `protocol mismatch ... client=... v<version> min=<n> max=<n> expected=<n>`.
- `openclaw gateway status --deep`의 `Established clients:` 또는 `openclaw doctor --deep`의 `Gateway clients`: Gateway 포트에 연결된 활성 TCP 클라이언트이며, OS에서 허용하는 경우 PID와 명령줄도 표시됩니다.
- 롤백한 최신 OpenClaw 설치 또는 래퍼를 명령줄에서 가리키는 클라이언트 프로세스.

해결 방법:

1. `gateway status --deep`에 표시된 오래된 OpenClaw 클라이언트 프로세스를 중지하거나 다시 시작하십시오.
2. OpenClaw를 내장하는 앱 또는 래퍼를 다시 시작하십시오. 로컬 대시보드, 편집기, 앱 서버 도우미 또는 장시간 실행 중인 `openclaw logs --follow` 셸이 포함됩니다.
3. `openclaw gateway status --deep` 또는 `openclaw doctor --deep`을 다시 실행하여 오래된 클라이언트 PID가 사라졌는지 확인하십시오.

이전 Gateway가 호환되지 않는 최신 프로토콜을 허용하도록 만들지 마십시오. 프로토콜 버전 상향은 통신 계약을 보호합니다. 롤백 복구는 프로세스/버전 정리 문제입니다.

## 경로 이탈로 건너뛴 Skill 심볼릭 링크

로그에 다음 내용이 포함될 때 사용하십시오.

```text
구성된 루트 외부로 이탈한 Skill 경로를 건너뜁니다: ... reason=symlink-escape
```

각 Skill 루트는 포함 경계입니다. `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` 또는 `~/.openclaw/skills` 아래의 심볼릭 링크는 실제 대상이 해당 루트 외부로 해석될 경우 건너뜁니다. 단, 대상을 명시적으로 신뢰하도록 설정한 경우는 예외입니다.

링크를 검사하십시오.

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

대상이 의도된 것이라면 직접 Skill 루트와 허용된 심볼릭 링크 대상을 모두 구성하십시오.

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

그런 다음 새 세션을 시작하거나 Skills 감시기가 새로 고쳐질 때까지 기다리십시오. 실행 중인 프로세스가 구성 변경 이전에 시작되었다면 Gateway를 다시 시작하십시오.

`~`, `/` 또는 전체 동기화 프로젝트 폴더와 같이 범위가 넓은 대상을 사용하지 마십시오. `allowSymlinkTargets`의 범위를 신뢰할 수 있는 `SKILL.md` 디렉터리가 포함된 실제 Skill 루트로 제한하십시오.

Skill Workshop 적용 작업에서도 신뢰할 수 있는 심볼릭 링크 기반 워크스페이스 Skill 경로를 통해 쓰기를 수행해야 한다면 `skills.workshop.allowSymlinkTargetWrites`를 활성화하십시오. 읽기 전용 공유 Skill 루트에서는 비활성화 상태를 유지하십시오.

관련 항목:

- [Skills 구성](/ko/tools/skills-config#symlinked-skill-roots)
- [구성 예제](/ko/gateway/configuration-examples#symlinked-sibling-skill-repo)

## 긴 컨텍스트에 Anthropic 429 추가 사용량 필요

로그/오류에 `HTTP 429: rate_limit_error: Extra usage is required for long context requests`가 포함될 때 사용하십시오.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

확인할 사항:

- 선택한 Anthropic 모델이 정식 출시된 1M 지원 Claude 4.x 모델(Opus 4.6/4.7/4.8, Sonnet 4.6)이거나 모델 구성에 레거시 `params.context1m: true`가 여전히 포함되어 있습니다.
- 현재 Anthropic 자격 증명은 긴 컨텍스트 사용 자격이 없습니다.
- 1M 컨텍스트 경로가 필요한 긴 세션/모델 실행에서만 요청이 실패합니다.

해결 방법:

<Steps>
  <Step title="표준 컨텍스트 창 사용">
    표준 창 모델로 전환하거나, 1M 컨텍스트를 정식 지원하지 않는 이전
    모델 구성에서 레거시 `context1m`을 제거하십시오.
  </Step>
  <Step title="자격을 갖춘 자격 증명 사용">
    긴 컨텍스트 요청 자격을 갖춘 Anthropic 자격 증명을 사용하거나 Anthropic API 키로 전환하십시오.
  </Step>
  <Step title="대체 모델 구성">
    Anthropic 긴 컨텍스트 요청이 거부되어도 실행이 계속되도록 대체 모델을 구성하십시오.
  </Step>
</Steps>

관련 항목:

- [Anthropic](/ko/providers/anthropic)
- [토큰 사용량 및 비용](/ko/reference/token-use)
- [Anthropic에서 HTTP 429가 표시되는 이유는 무엇인가요?](/ko/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 업스트림 403 차단 응답

업스트림 LLM 공급자가 `Your request was blocked`와 같은 일반적인 `403`을 반환할 때 사용하십시오.

항상 OpenClaw 구성 문제라고 가정하지 마십시오. 이 응답은 OpenAI 호환 엔드포인트 앞에 있는 CDN, WAF, 봇 관리 규칙 또는 리버스 프록시와 같은 업스트림 보안 계층에서 발생할 수 있습니다.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
```

확인할 사항:

- 동일한 공급자 아래의 여러 모델이 같은 방식으로 실패합니다.
- 정상적인 공급자 API 오류 대신 HTML 또는 일반적인 보안 문구가 표시됩니다.
- 동일한 요청 시간에 공급자 측 보안 이벤트가 있습니다.
- 작은 직접 `curl` 프로브는 성공하지만 일반적인 SDK 형태의 요청은 실패합니다.

증거가 WAF/CDN 차단을 가리키는 경우 공급자 측 필터링을 먼저 수정하십시오. OpenClaw가 사용하는 API 경로에 범위를 좁혀 허용 또는 건너뛰기 규칙을 적용하고, 전체 사이트의 보호 기능을 비활성화하지 마십시오.

<Warning>
최소한의 `curl` 요청이 성공하더라도 실제 SDK 방식의 요청이 동일한 업스트림 보안 계층을 통과한다고 보장할 수 없습니다.
</Warning>

관련 항목:

- [OpenAI 호환 엔드포인트](/ko/gateway/configuration-reference#openai-compatible-endpoints)
- [공급자 구성](/ko/providers)
- [로그](/ko/logging)

## 직접 프로브는 통과하지만 에이전트 실행은 실패하는 로컬 OpenAI 호환 백엔드

다음 상황에서 사용하십시오.

- `curl ... /v1/models`가 작동합니다.
- 작은 직접 `/v1/chat/completions` 호출이 작동합니다.
- OpenClaw 모델 실행은 일반 에이전트 턴에서만 실패합니다.

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"안녕하세요"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "안녕하세요" --json
openclaw logs --follow
```

확인할 사항:

- 작은 직접 호출은 성공하지만 OpenClaw 실행은 더 큰 프롬프트에서만 실패합니다.
- 동일한 접두사 없는 모델 ID로 직접 `/v1/chat/completions`가 작동함에도 `model_not_found` 또는 404 오류가 발생합니다.
- `messages[].content`가 문자열이어야 한다는 백엔드 오류가 발생합니다.
- OpenAI 호환 로컬 백엔드에서 간헐적인 `incomplete turn detected ... stopReason=stop payloads=0` 경고가 발생합니다.
- 더 큰 프롬프트 토큰 수 또는 전체 에이전트 런타임 프롬프트에서만 백엔드 충돌이 발생합니다.

<AccordionGroup>
  <Accordion title="일반적인 징후">
    - 로컬 MLX/vLLM 방식 서버의 `model_not_found`: `baseUrl`에 `/v1`이 포함되어 있는지, `/v1/chat/completions` 백엔드에서 `api`가 `"openai-completions"`인지, `models.providers.<provider>.models[].id`가 공급자 로컬의 접두사 없는 ID인지 확인하십시오. 공급자 접두사를 한 번만 붙여 선택하십시오. 예: `mlx/mlx-community/Qwen3-30B-A3B-6bit`. 카탈로그 항목은 `mlx-community/Qwen3-30B-A3B-6bit`로 유지하십시오.
    - `messages[...].content: invalid type: sequence, expected a string`: 백엔드가 구조화된 Chat Completions 콘텐츠 부분을 거부합니다. 해결 방법: `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하십시오.
    - `validation.keys` 또는 `["role","content"]`와 같은 허용 메시지 키: 백엔드가 Chat Completions 메시지의 OpenAI 방식 재생 메타데이터를 거부합니다. 해결 방법: `models.providers.<provider>.models[].compat.strictMessageKeys: true`를 설정하십시오.
    - `incomplete turn detected ... stopReason=stop payloads=0`: 백엔드는 Chat Completions 요청을 완료했지만 해당 턴에 사용자에게 표시할 어시스턴트 텍스트를 반환하지 않았습니다. OpenClaw는 재생해도 안전한 빈 OpenAI 호환 턴을 한 번 재시도합니다. 실패가 지속되면 일반적으로 백엔드가 빈 콘텐츠/텍스트가 아닌 콘텐츠를 내보내거나 최종 답변 텍스트를 억제하고 있음을 의미합니다.
    - 작은 직접 요청은 성공하지만 OpenClaw 에이전트 실행이 백엔드/모델 충돌로 실패하는 경우(예: 일부 `inferrs` 빌드의 Gemma): OpenClaw 전송은 이미 올바를 가능성이 높으며, 더 큰 에이전트 런타임 프롬프트 형태에서 백엔드가 실패하는 것입니다.
    - 도구를 비활성화하면 실패가 줄어들지만 사라지지는 않는 경우: 도구 스키마도 부담의 일부였지만, 남은 문제는 여전히 업스트림 모델/서버 용량 또는 백엔드 버그입니다.

  </Accordion>
  <Accordion title="해결 방법">
    1. 문자열 전용 Chat Completions 백엔드에는 `compat.requiresStringContent: true`를 설정하십시오.
    2. 각 메시지에서 `role`과 `content`만 허용하는 엄격한 Chat Completions 백엔드에는 `compat.strictMessageKeys: true`를 설정하십시오.
    3. OpenClaw의 도구 스키마 표면을 안정적으로 처리할 수 없는 모델/백엔드에는 `compat.supportsTools: false`를 설정하십시오.
    4. 가능한 경우 프롬프트 부담을 줄이십시오. 더 작은 워크스페이스 부트스트랩, 더 짧은 세션 기록, 더 가벼운 로컬 모델 또는 더 강력한 긴 컨텍스트 지원을 제공하는 백엔드를 사용하십시오.
    5. 작은 직접 요청은 계속 통과하지만 OpenClaw 에이전트 턴이 여전히 백엔드 내부에서 충돌한다면 업스트림 서버/모델의 제한으로 취급하고, 허용된 페이로드 형태와 함께 해당 업스트림에 재현 사례를 제출하십시오.
  </Accordion>
</AccordionGroup>

관련 항목:

- [구성](/ko/gateway/configuration)
- [로컬 모델](/ko/gateway/local-models)
- [OpenAI 호환 엔드포인트](/ko/gateway/configuration-reference#openai-compatible-endpoints)

## 응답 없음

채널이 작동 중이지만 아무 응답도 없다면 다시 연결하기 전에 라우팅과 정책을 확인하십시오.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

다음을 확인하십시오.

- DM 발신자의 페어링이 대기 중인지 확인합니다.
- 그룹 멘션 게이팅(`requireMention`, `mentionPatterns`)을 확인합니다.
- 채널/그룹 허용 목록이 일치하지 않는지 확인합니다.

일반적인 로그 패턴:

- `drop guild message (mention required` → 멘션될 때까지 그룹 메시지가 무시됩니다.
- `pairing request` → 발신자 승인이 필요합니다.
- `blocked` / `allowlist` → 정책에 따라 발신자/채널이 필터링되었습니다.

관련 문서:

- [채널 문제 해결](/ko/channels/troubleshooting)
- [그룹](/ko/channels/groups)
- [페어링](/ko/channels/pairing)

## 대시보드 제어 UI 연결

대시보드/제어 UI가 연결되지 않으면 URL, 인증 모드 및 보안 컨텍스트 전제를 검증하십시오.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

다음을 확인하십시오.

- 프로브 URL과 대시보드 URL이 올바른지 확인합니다.
- 클라이언트와 Gateway 간에 인증 모드/토큰이 일치하지 않는지 확인합니다.
- 기기 ID가 필요한 곳에서 HTTP를 사용하고 있는지 확인합니다.

업데이트 후 로컬 브라우저가 `127.0.0.1:18789`에 연결할 수 없다면 먼저 로컬 Gateway 서비스를 복구하고 대시보드를 제공하고 있는지 확인하십시오.

```bash
openclaw gateway restart
lsof -i :18789
curl http://127.0.0.1:18789
```

`curl`이 OpenClaw HTML을 반환하면 Gateway는 작동 중이며, 남은 문제는 브라우저 캐시, 오래된 딥 링크 또는 오래된 탭 상태일 가능성이 큽니다. `http://127.0.0.1:18789`를 직접 열고 대시보드에서 이동하십시오. 재시작 후 서비스가 계속 실행되지 않으면 `openclaw gateway start`를 실행한 다음 `openclaw gateway status`를 다시 확인하십시오.

<AccordionGroup>
  <Accordion title="연결/인증 로그 패턴">
    - `device identity required` → 보안 컨텍스트가 아니거나 기기 인증이 없습니다.
    - `origin not allowed` → 브라우저 `Origin`이 `gateway.controlUi.allowedOrigins`에 없습니다(또는 명시적인 허용 목록 없이 루프백이 아닌 브라우저 출처에서 연결하고 있습니다).
    - `device nonce required` / `device nonce mismatch` → 클라이언트가 챌린지 기반 기기 인증 흐름(`connect.challenge` + `device.nonce`)을 완료하지 않고 있습니다.
    - `device signature invalid` / `device signature expired` → 클라이언트가 현재 핸드셰이크에 대해 잘못된 페이로드(또는 오래된 타임스탬프)에 서명했습니다.
    - `AUTH_TOKEN_MISMATCH`와 `canRetryWithDeviceToken=true` → 클라이언트가 캐시된 기기 토큰으로 신뢰할 수 있는 재시도를 한 번 수행할 수 있습니다.
    - 이 캐시된 토큰 재시도는 페어링된 기기 토큰과 함께 저장된 캐시된 범위 집합을 재사용합니다. 명시적인 `deviceToken` / 명시적인 `scopes` 호출자는 요청한 범위 집합을 그대로 유지합니다.
    - `AUTH_SCOPE_MISMATCH` → 기기 토큰은 인식되었지만 승인된 범위가 이 연결 요청을 포함하지 않습니다. 공유 Gateway 토큰을 교체하지 말고 다시 페어링하거나 요청된 범위 계약을 승인하십시오.
    - 해당 재시도 경로 외부에서 연결 인증 우선순위는 명시적인 공유 토큰/비밀번호, 명시적인 `deviceToken`, 저장된 기기 토큰, 부트스트랩 토큰 순입니다.
    - 비동기 Tailscale Serve 제어 UI 경로에서는 제한기가 실패를 기록하기 전에 동일한 `{scope, ip}`에 대한 실패 시도가 직렬화됩니다. 따라서 동일한 클라이언트에서 잘못된 재시도 두 건이 동시에 발생하면 두 건의 단순 불일치 대신 두 번째 시도에서 `retry later`가 표시될 수 있습니다.
    - 브라우저 출처의 루프백 클라이언트에서 `too many failed authentication attempts (retry later)` 발생 → 정규화된 동일 `Origin`에서 반복된 실패로 인해 일시적으로 잠겼습니다. 다른 localhost 출처는 별도의 버킷을 사용합니다.
    - 해당 재시도 후에도 `unauthorized`가 반복됨 → 공유 토큰/기기 토큰이 불일치합니다. 토큰 구성을 새로 고치고 필요한 경우 기기 토큰을 다시 승인하거나 교체하십시오.
    - `gateway connect failed:` → 호스트/포트/URL 대상이 잘못되었습니다.

  </Accordion>
</AccordionGroup>

### 인증 세부 코드 빠른 참조

실패한 `connect` 응답의 `error.details.code`를 사용하여 다음 조치를 선택하십시오.

| 세부 코드                    | 의미                                                                                                                                                                                         | 권장 조치                                                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 클라이언트가 필수 공유 토큰을 보내지 않았습니다.                                                                                                                                             | 클라이언트에 토큰을 붙여 넣거나 설정한 후 다시 시도하십시오. 대시보드 경로에서는 `openclaw config get gateway.auth.token`을 실행한 다음 제어 UI 설정에 붙여 넣으십시오.                                                                                                                                             |
| `AUTH_TOKEN_MISMATCH`        | 공유 토큰이 Gateway 인증 토큰과 일치하지 않았습니다.                                                                                                                                         | `canRetryWithDeviceToken=true`이면 신뢰할 수 있는 재시도를 한 번 허용하십시오. 캐시된 토큰 재시도는 저장된 승인 범위를 재사용하며, 명시적인 `deviceToken` / `scopes` 호출자는 요청한 범위를 유지합니다. 계속 실패하면 [토큰 불일치 복구 체크리스트](/ko/cli/devices#token-drift-recovery-checklist)를 실행하십시오. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 캐시된 기기별 토큰이 오래되었거나 취소되었습니다.                                                                                                                                            | [기기 CLI](/ko/cli/devices)를 사용하여 기기 토큰을 교체하거나 다시 승인한 다음 다시 연결하십시오.                                                                                                                                                                                                                   |
| `AUTH_SCOPE_MISMATCH`        | 기기 토큰은 유효하지만 승인된 역할/범위가 이 연결 요청을 포함하지 않습니다.                                                                                                                  | 기기를 다시 페어링하거나 요청된 범위 계약을 승인하십시오. 이를 공유 토큰 불일치로 취급하지 마십시오.                                                                                                                                                                                                             |
| `PAIRING_REQUIRED`           | 기기 ID에 승인이 필요합니다. `error.details.reason`에서 `not-paired`, `scope-upgrade`, `role-upgrade` 또는 `metadata-upgrade`를 확인하고, 있는 경우 `requestId` / `remediationHint`를 사용하십시오. | 대기 중인 요청을 승인하십시오. `openclaw devices list`를 실행한 다음 `openclaw devices approve <requestId>`를 실행합니다. 요청된 접근 권한을 검토한 후 범위/역할 업그레이드에도 동일한 흐름을 사용합니다.                                                                                                          |

<Note>
공유 Gateway 토큰/비밀번호로 인증된 직접 루프백 백엔드 RPC는 CLI의 페어링된 기기 범위 기준에 의존해서는 안 됩니다. 하위 에이전트나 다른 내부 호출이 계속 `scope-upgrade`로 실패하면 호출자가 `client.id: "gateway-client"` 및 `client.mode: "backend"`를 사용하고 있으며 명시적인 `deviceIdentity` 또는 기기 토큰을 강제로 지정하지 않는지 확인하십시오.
</Note>

기기 인증 v2 마이그레이션 확인:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 논스/서명 오류가 표시되면 연결 클라이언트를 업데이트하고 다음을 확인하십시오.

<Steps>
  <Step title="connect.challenge 대기">
    클라이언트가 Gateway에서 발급한 `connect.challenge`를 기다립니다.
  </Step>
  <Step title="페이로드 서명">
    클라이언트가 챌린지에 바인딩된 페이로드에 서명합니다.
  </Step>
  <Step title="기기 논스 전송">
    클라이언트가 동일한 챌린지 논스와 함께 `connect.params.device.nonce`를 전송합니다.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove`가 예기치 않게 거부되는 경우:

- 페어링된 기기 토큰 세션은 호출자에게 `operator.admin`도 있는 경우를 제외하고 **자신의** 기기만 관리할 수 있습니다.
- `openclaw devices rotate --scope ...`는 호출자 세션이 이미 보유한 운영자 범위만 요청할 수 있습니다.

관련 문서:

- [구성](/ko/gateway/configuration) (Gateway 인증 모드)
- [제어 UI](/ko/web/control-ui)
- [기기](/ko/cli/devices)
- [원격 액세스](/ko/gateway/remote)
- [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)

## Gateway 서비스가 실행되지 않음

서비스가 설치되어 있지만 프로세스가 계속 실행되지 않을 때 사용하십시오.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # 시스템 수준 서비스도 검사
```

다음을 확인하십시오.

- 종료 관련 힌트와 함께 `Runtime: stopped`가 표시되는지 확인합니다.
- 서비스 구성 불일치(`Config (cli)`와 `Config (service)`)를 확인합니다.
- 포트/리스너 충돌을 확인합니다.
- `--deep`을 사용할 때 추가 launchd/systemd/schtasks 설치가 있는지 확인합니다.
- `Other gateway-like services detected (best effort)` 정리 힌트를 확인합니다.

<AccordionGroup>
  <Accordion title="일반적인 로그 패턴">
    - `Gateway start blocked: set gateway.mode=local` 또는 `existing config is missing gateway.mode` → 로컬 Gateway 모드가 활성화되지 않았거나 구성 파일이 덮어써져 `gateway.mode`가 유실되었습니다. 해결 방법: 구성에서 `gateway.mode="local"`을 설정하거나 `openclaw onboard --mode local` / `openclaw setup`을 다시 실행하여 예상되는 로컬 모드 구성을 다시 적용하십시오. Podman을 통해 OpenClaw를 실행하는 경우 기본 구성 경로는 `~/.openclaw/openclaw.json`입니다.
    - `refusing to bind gateway ... without auth` → 유효한 Gateway 인증 경로(토큰/비밀번호 또는 구성된 경우 신뢰할 수 있는 프록시) 없이 루프백이 아닌 주소에 바인딩하려고 합니다.
    - `another gateway instance is already listening` / `EADDRINUSE` → 포트가 충돌합니다.
    - `Other gateway-like services detected (best effort)` → 오래되었거나 병렬로 실행되는 launchd/systemd/schtasks 유닛이 있습니다. 대부분의 설정에서는 머신당 하나의 Gateway만 유지해야 합니다. 둘 이상이 필요한 경우 포트와 구성/상태/작업 공간을 격리하십시오. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하십시오.
    - doctor에서 `System-level OpenClaw gateway service detected` 표시 → 사용자 수준 서비스가 없는 상태에서 systemd 시스템 유닛이 존재합니다. doctor가 사용자 서비스를 설치하도록 허용하기 전에 중복 항목을 제거하거나 비활성화하십시오. 시스템 유닛이 의도한 수퍼바이저인 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하십시오.
    - `Gateway service port does not match current gateway config` → 설치된 수퍼바이저가 여전히 이전 `--port`를 고정하여 사용합니다. `openclaw doctor --fix` 또는 `openclaw gateway install --force`를 실행한 다음 Gateway 서비스를 재시작하십시오.

  </Accordion>
</AccordionGroup>

관련 문서:

- [백그라운드 실행 및 프로세스 도구](/ko/gateway/background-process)
- [구성](/ko/gateway/configuration)
- [Doctor](/ko/gateway/doctor)

## macOS Gateway가 아무 경고 없이 응답을 중지했다가 대시보드를 조작하면 재개됨

macOS 호스트의 채널(Telegram, WhatsApp 등)이 한 번에 몇 분에서 몇 시간 동안 조용해지고, 제어 UI를 열거나 SSH로 접속하거나 호스트와 다른 방식으로 상호 작용하는 순간 Gateway가 다시 작동하는 것으로 보일 때 사용하십시오. 확인할 때쯤에는 Gateway가 다시 작동하고 있으므로 일반적으로 `openclaw status`에는 뚜렷한 증상이 없습니다.

```bash
ls ~/.openclaw/logs/stability/ | tail -5
openclaw gateway stability --bundle latest
pmset -g log | grep -iE "sleep|wake|maintenance" | tail -50
launchctl print gui/$UID/ai.openclaw.gateway | grep -E "state|last exit|runs"
```

다음을 확인하십시오.

- `~/.openclaw/logs/stability/`에 하나 이상의 `*-uncaught_exception.json` 번들이 있으며, `error.code`가 `ENETDOWN`, `ENETUNREACH`, `EHOSTUNREACH`, `ECONNREFUSED` 같은 일시적인 네트워크 코드로 설정되어 있습니다.
- 비정상 종료 타임스탬프와 일치하는 `pmset -g log` 줄에 `Entering Sleep state due to 'Maintenance Sleep'` 또는 `en0 driver is slow (msg: WillChangeState to 0)` 같은 내용이 있습니다. Power Nap / Maintenance Sleep은 Wi-Fi 드라이버를 잠시 상태 0으로 전환합니다. 그 시간대에 실행된 모든 아웃바운드 `connect()`는 다른 때에는 호스트의 네트워크 연결이 완전하더라도 `ENETDOWN`으로 실패할 수 있습니다.
- `launchctl print` 출력에 `state = not running`이 표시되고 최근 `runs`가 여러 번 기록되어 있으며 종료 코드도 있습니다. 특히 비정상 종료 후 다음 실행까지의 간격이 몇 초가 아니라 약 한 시간인 경우에 해당합니다. macOS launchd는 비정상 종료가 연속으로 발생한 후 문서화되지 않은 재생성 보호 게이트를 적용합니다. 이 게이트로 인해 대화형 로그인, 대시보드 연결 또는 `launchctl kickstart` 같은 외부 트리거가 다시 활성화할 때까지 `KeepAlive=true`를 따르지 않을 수 있습니다.

일반적인 징후:

- `error.code`가 `ENETDOWN` 또는 유사 코드이며 호출 스택이 Node `net`의 `lookupAndConnect` / `Socket.connect`를 가리키는 안정성 번들입니다. OpenClaw `2026.5.26` 이상에서는 이를 무해한 일시적 네트워크 오류로 분류하므로 더 이상 최상위 미처리 핸들러로 전파되지 않습니다. 이전 릴리스를 사용 중이라면 먼저 업그레이드하십시오.
- Control UI에 연결하거나 호스트에 SSH로 접속하는 즉시 끝나는 긴 비활성 기간입니다. launchd의 재생성 게이트를 다시 활성화하는 것은 사용자에게 보이는 활동이며, 대시보드가 Gateway에 수행하는 작업이 아닙니다.
- `~/Library/Logs/openclaw/gateway.log`에 대응하는 `received SIG*; shutting down` 줄이 없는데도 하루 동안 `runs` 횟수가 증가합니다. 정상 종료 시에는 신호가 기록되지만, 일시적인 비정상 종료 시에는 기록되지 않습니다.

수행할 작업:

1. `2026.5.26` 이전 릴리스를 실행 중이라면 **Gateway를 업그레이드하십시오**. 업그레이드 후에는 향후 `ENETDOWN` 오류가 프로세스를 종료하는 대신 경고로 기록됩니다.
2. 상시 가동 서버로 사용할 Mac mini / 데스크톱 호스트에서 **유지 관리 절전 활동을 줄이십시오**.

   ```bash
   sudo pmset -a sleep 0 disksleep 0 standby 0 powernap 0
   ```

   이렇게 하면 근본적인 드라이버 상태 변동이 크게 줄어들지만 완전히 제거되지는 않습니다. 이러한 플래그와 관계없이 시스템은 TCP keepalive 및 mDNS 유지를 위해 일부 유지 관리 절전을 계속 수행할 수 있습니다.

3. 향후 비정상 종료가 연속으로 발생해 launchd에 의해 중지되더라도 빠르게 감지되도록 **활성 상태 감시기를 추가하십시오**.

   ```bash
   # 5분 간격 cron 또는 LaunchAgent에 적합한 launchd 인식 활성 상태 검사 예시
   state=$(launchctl print gui/$UID/ai.openclaw.gateway 2>/dev/null | awk -F'= ' '/state =/ {print $2; exit}')
   if [ "$state" != "running" ]; then
     launchctl kickstart -k gui/$UID/ai.openclaw.gateway
   fi
   ```

   목적은 재생성 게이트를 외부에서 다시 활성화하는 것입니다. macOS에서는 비정상 종료가 연속으로 발생한 후 `KeepAlive=true`만으로는 충분하지 않습니다.

관련 문서:

- [macOS 플랫폼 참고 사항](/ko/platforms/macos)
- [로깅](/ko/logging)
- [Doctor](/ko/gateway/doctor)

## 중복 Gateway/Node LaunchAgent로 인한 macOS launchd 감독 루프

macOS 설치가 몇 초마다 계속 재시작되고, `openclaw` 상태 검사가 정상과 사용 불가 상태 사이를 오가며, 서비스가 실행 중인 것처럼 보여도 채널 디스패치가 멈추는 경우 사용하십시오.

이 문제는 `ai.openclaw.gateway`와 `ai.openclaw.node` LaunchAgent가 모두 활성화되어 있고 각각 `OPENCLAW_LAUNCHD_LABEL`을 주입하는 이전 설치에서 관찰되었습니다. 이 상태에서는 OpenClaw가 launchd 감독을 감지하고 재시작을 launchd에 다시 넘기려고 시도하다가 하나의 안정적인 Gateway 프로세스를 유지하는 대신 빠른 `EADDRINUSE`/재생성 루프에 빠질 수 있습니다.

```bash
for i in 1 2 3 4; do
  ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
  sleep 10
done

openclaw gateway status --deep
openclaw node status
launchctl print gui/$UID/ai.openclaw.gateway | grep -E 'state|last exit|runs'
tail -n 80 ~/Library/Logs/openclaw/gateway.log
```

확인할 사항:

- 30초 동안의 샘플에서 하나의 안정적인 프로세스가 아니라 둘 이상의 Gateway PID가 나타납니다.
- `gateway.log`에 `EADDRINUSE`, `another gateway instance is already listening` 또는 반복되는 재시작/인계 줄이 있습니다.
- 하나의 관리형 Gateway 서비스만 실행해야 하는 호스트에서 `~/Library/LaunchAgents/ai.openclaw.gateway.plist`와 `~/Library/LaunchAgents/ai.openclaw.node.plist`가 동시에 로드되어 있습니다.

수행할 작업:

1. 이 호스트에서 Gateway 서비스만 실행해야 한다면 OpenClaw를 통해 관리형 Node 서비스를 제거하십시오. 원격 Node 기능을 위해 Node 서비스를 실제로 사용 중이라면 **이 단계를 건너뛰십시오**. 제거하면 이 호스트에서 해당 기능이 중지됩니다.

   ```bash
   openclaw node uninstall
   ```

2. OpenClaw를 시작하기 전에 상속된 launchd 마커를 제거하는 영구적인 Gateway 래퍼를 설치하십시오. 지원되는 `--wrapper` 옵션을 사용하십시오. 서비스 재설치, 업데이트 및 Doctor 복구 시 해당 파일이 다시 생성되므로 `~/.openclaw/service-env/` 아래의 생성된 파일을 편집하지 마십시오.

   ```bash
   mkdir -p ~/.local/bin
   cat >~/.local/bin/openclaw-launchd-workaround <<'EOF'
   #!/bin/sh
   set -eu
   unset OPENCLAW_LAUNCHD_LABEL LAUNCH_JOB_LABEL LAUNCH_JOB_NAME XPC_SERVICE_NAME || true
   exec openclaw "$@"
   EOF
   chmod 700 ~/.local/bin/openclaw-launchd-workaround

   openclaw gateway install \
     --wrapper ~/.local/bin/openclaw-launchd-workaround \
     --force
   ```

   `gateway install`은 강제 재설치, 업데이트 및 Doctor 복구 후에도 래퍼 경로를 유지합니다.

3. Gateway가 단순히 수신 대기 중인 것이 아니라 안정적으로 RPC를 제공하는지 확인하십시오.

   ```bash
   openclaw gateway status --deep --require-rpc

   for i in 1 2 3 4; do
     ps aux | grep 'openclaw.*index.js' | grep -v grep | awk '{print $2}'
     sleep 10
   done
   ```

   PID 샘플에는 계속 교체되는 PID 집합이 아니라 하나의 안정적인 프로세스가 표시되어야 하며, 인바운드 채널 디스패치가 재개되어야 합니다.

4. 근본적인 이중 LaunchAgent 루프가 수정된 릴리스로 업그레이드한 후에는 우회 방법을 제거하고 일반 관리형 서비스를 다시 설치하십시오.

   ```bash
   OPENCLAW_WRAPPER= openclaw gateway install --force
   rm ~/.local/bin/openclaw-launchd-workaround
   ```

관련 문서:

- [macOS 플랫폼 참고 사항](/ko/platforms/mac/bundled-gateway)
- [Doctor](/ko/gateway/doctor)
- [Gateway CLI](/ko/cli/gateway)

## 메모리 사용량이 많을 때 Gateway 종료

부하가 걸릴 때 Gateway가 사라지거나, 감독자가 OOM 형태의 재시작을 보고하거나, 로그에 `critical memory pressure bundle written`이 표시되는 경우 사용하십시오.

```bash
openclaw gateway status --deep
openclaw logs --follow
openclaw gateway stability --bundle latest
openclaw gateway diagnostics export
```

확인할 사항:

- 최신 안정성 번들에 `Reason: diagnostic.memory.pressure.critical`이 있습니다.
- `Memory pressure:`에 `critical/rss_threshold`, `critical/heap_threshold` 또는 `critical/rss_growth`가 있습니다.
- `V8 heap:` 값이 힙 제한에 가깝습니다.
- `Largest session files:`에 `agents/<agent>/sessions/<session>.jsonl` 또는 `sessions/<session>.jsonl` 같은 항목이 있습니다.
- Gateway가 컨테이너 또는 메모리 제한 서비스 내에서 실행될 때 Linux cgroup 메모리 카운터가 있습니다.

일반적인 징후:

- 재시작 직전에 `critical memory pressure bundle written`이 표시됩니다 → OpenClaw가 OOM 발생 전 안정성 번들을 캡처했습니다. `openclaw gateway stability --bundle latest`로 검사하십시오.
- Gateway 로그에 `memory pressure: level=critical ... memoryPressureSnapshot=disabled`가 표시됩니다 → OpenClaw가 심각한 메모리 압박을 감지했지만 OOM 발생 전 안정성 스냅샷이 비활성화되어 있습니다.
- `Largest session files:`가 매우 큰 수정된 트랜스크립트 경로를 가리킵니다 → 보존되는 세션 기록을 줄이거나, 세션 증가량을 검사하거나, 재시작하기 전에 오래된 트랜스크립트를 활성 저장소 밖으로 이동하십시오.
- `V8 heap:`의 사용 바이트가 힙 제한에 가깝습니다 → 프롬프트/세션 압박을 낮추거나, 동시 작업을 줄이거나, 워크로드가 예상된 것인지 확인한 후에만 Node 힙 제한을 높이십시오.
- `Memory pressure: critical/rss_growth` → 하나의 샘플링 구간 내에서 메모리가 빠르게 증가했습니다. 최신 로그에서 대규모 가져오기, 제어되지 않는 도구 출력, 반복적인 재시도 또는 대기 중인 에이전트 작업 묶음을 확인하십시오.
- 로그에 심각한 메모리 압박이 표시되지만 번들이 없습니다 → 이것이 기본 동작입니다. 향후 심각한 메모리 압박 이벤트에서 OOM 발생 전 안정성 번들을 캡처하려면 `diagnostics.memoryPressureSnapshot: true`를 설정하십시오.

안정성 번들에는 페이로드가 포함되지 않습니다. 여기에는 운영 메모리 증거와 수정된 상대 파일 경로가 포함되며, 메시지 텍스트, Webhook 본문, 자격 증명, 토큰, 쿠키 또는 원시 세션 ID는 포함되지 않습니다. 원시 로그를 복사하는 대신 버그 보고서에 진단 내보내기를 첨부하십시오.

관련 문서:

- [Gateway 상태](/ko/gateway/health)
- [진단 내보내기](/ko/gateway/diagnostics)
- [세션](/ko/cli/sessions)

## Gateway가 잘못된 구성을 거부함

Gateway 시작이 `Invalid config`로 실패하거나 핫 리로드 로그에 잘못된 편집을 건너뛰었다고 표시되는 경우 사용하십시오.

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
- 활성 구성 옆에 타임스탬프가 포함된 `openclaw.json.rejected.*` 파일이 있습니다.
- `doctor --fix`가 잘못된 직접 편집을 복구한 경우 타임스탬프가 포함된 `openclaw.json.clobbered.*` 파일이 있습니다.
- OpenClaw는 각 구성 경로마다 최신 `.clobbered.*` 파일 32개를 유지하고 오래된 파일을 순환 삭제합니다.

<AccordionGroup>
  <Accordion title="발생한 상황">
    - 시작, 핫 리로드 또는 OpenClaw 소유 쓰기 중에 구성 검증이 실패했습니다.
    - Gateway 시작은 `openclaw.json`을 다시 작성하는 대신 안전하게 실패합니다.
    - 핫 리로드는 잘못된 외부 편집을 건너뛰고 현재 런타임 구성을 활성 상태로 유지합니다.
    - OpenClaw 소유 쓰기는 커밋 전에 잘못되거나 파괴적인 페이로드를 거부하고 `.rejected.*`로 저장합니다.
    - 복구는 `openclaw doctor --fix`가 담당합니다. JSON이 아닌 접두사를 제거하거나, 거부된 페이로드를 `.clobbered.*`로 보존하면서 마지막 정상 사본을 복원할 수 있습니다.
    - 하나의 구성 경로에서 복구가 여러 번 수행되면 OpenClaw는 이전 `.clobbered.*` 파일을 순환 삭제하여 가장 최근에 복구된 페이로드를 계속 사용할 수 있게 합니다.

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
    - `.clobbered.*`가 있습니다 → Doctor가 활성 구성을 복구하는 동안 잘못된 외부 편집을 보존했습니다.
    - `.rejected.*`가 있습니다 → OpenClaw 소유 구성 쓰기가 커밋 전에 스키마 또는 덮어쓰기 검사를 통과하지 못했습니다.
    - `Config write rejected:` → 쓰기 작업이 필수 구조를 제거하거나, 파일 크기를 급격히 줄이거나, 잘못된 구성을 저장하려고 했습니다.
    - `config reload skipped (invalid config):` → 직접 편집이 검증에 실패하여 실행 중인 Gateway에서 무시되었습니다.
    - `Invalid config at ...` → Gateway 서비스가 시작되기 전에 시작이 실패했습니다.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` 또는 `size-drop-vs-last-good:*` → 마지막 정상 백업과 비교해 필드 또는 크기가 손실되어 OpenClaw 소유 쓰기가 거부되었습니다.
    - `Config last-known-good promotion skipped` → 후보에 `***` 같은 수정된 비밀 값 자리표시자가 포함되어 있었습니다.

  </Accordion>
  <Accordion title="해결 방법">
    1. Doctor가 접두사 또는 덮어쓰기로 손상된 구성을 복구하거나 마지막 정상 상태를 복원하도록 `openclaw doctor --fix`를 실행하십시오.
    2. `.clobbered.*` 또는 `.rejected.*`에서 의도한 키만 복사한 다음 `openclaw config set` 또는 `config.patch`로 적용하십시오.
    3. 재시작하기 전에 `openclaw config validate`를 실행하십시오.
    4. 직접 편집하는 경우 변경하려던 일부 객체만이 아니라 전체 JSON5 구성을 유지하십시오.
  </Accordion>
</AccordionGroup>

관련 문서:

- [구성](/ko/cli/config)
- [구성: 핫 리로드](/ko/gateway/configuration#config-hot-reload)
- [구성: 엄격한 검증](/ko/gateway/configuration#strict-validation)
- [Doctor](/ko/gateway/doctor)

## Gateway 프로브 경고

`openclaw gateway probe`가 대상에 도달하지만 여전히 경고 블록을 출력할 때 사용하십시오.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

확인할 항목:

- JSON 출력의 `warnings[].code` 및 `primaryTargetId`.
- 경고가 SSH 폴백, 여러 Gateway, 누락된 범위 또는 확인되지 않은 인증 참조에 관한 것인지 여부.

일반적인 징후:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 설정에 실패했지만 명령은 구성된 직접 대상/루프백 대상에 대한 프로브를 계속 시도했습니다.
- `multiple reachable gateway identities detected` → 서로 다른 Gateway가 응답했거나, OpenClaw가 도달 가능한 대상이 동일한 Gateway임을 입증하지 못했습니다. 동일한 Gateway로 연결되는 SSH 터널, 프록시 URL 또는 구성된 원격 URL은 전송 포트가 다르더라도 여러 전송 방식을 사용하는 하나의 Gateway로 처리됩니다.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 연결에는 성공했지만 세부 RPC가 범위에 의해 제한됩니다. 기기 ID를 페어링하거나 `operator.read`가 있는 자격 증명을 사용하십시오.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 연결에는 성공했지만 전체 진단 RPC 세트가 시간 초과되거나 실패했습니다. 이를 진단 기능이 저하된 도달 가능한 Gateway로 간주하십시오. `--json` 출력에서 `connect.ok`와 `connect.rpcOk`를 비교하십시오.
- `Capability: pairing-pending` 또는 `gateway closed (1008): pairing required` → Gateway가 응답했지만 이 클라이언트는 정상적인 운영자 액세스 전에 여전히 페어링/승인이 필요합니다.
- 확인되지 않은 `gateway.auth.*` / `gateway.remote.*` SecretRef 경고 텍스트 → 실패한 대상에 대해 이 명령 경로에서 인증 자료를 사용할 수 없었습니다.

관련 항목:

- [Gateway](/ko/cli/gateway)
- [동일한 호스트의 여러 Gateway](/ko/gateway#multiple-gateways-same-host)
- [원격 액세스](/ko/gateway/remote)

## 채널은 연결되었지만 메시지가 전달되지 않음

채널 상태는 연결됨이지만 메시지 흐름이 중단된 경우 정책, 권한 및 채널별 전달 규칙을 중점적으로 확인하십시오.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

확인할 항목:

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

Cron 또는 Heartbeat가 실행되지 않았거나 전달되지 않은 경우 먼저 스케줄러 상태를 확인한 다음 전달 대상을 확인하십시오.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

확인할 항목:

- Cron이 활성화되어 있고 다음 기상 시점이 있는지 여부.
- 작업 실행 기록 상태(`ok`, `skipped`, `error`).
- Heartbeat 건너뛰기 사유(`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="일반적인 징후">
    - `cron: scheduler disabled; jobs will not run automatically` → Cron이 비활성화되어 있습니다.
    - `cron: timer tick failed` → 스케줄러 틱에 실패했습니다. 파일/로그/런타임 오류를 확인하십시오.
    - `reason=quiet-hours`와 함께 표시되는 `heartbeat skipped` → 활성 시간 범위를 벗어났습니다.
    - `reason=empty-heartbeat-file`과 함께 표시되는 `heartbeat skipped` → `HEARTBEAT.md`가 있지만 빈 내용, 주석, 헤더, 펜스 또는 빈 체크리스트 골격만 포함하므로 OpenClaw가 모델 호출을 건너뜁니다.
    - `reason=no-tasks-due`와 함께 표시되는 `heartbeat skipped` → `HEARTBEAT.md`에 `tasks:` 블록이 있지만 이번 틱에 실행할 작업이 없습니다.
    - `heartbeat: unknown accountId` → Heartbeat 전달 대상의 계정 ID가 잘못되었습니다.
    - `reason=dm-blocked`와 함께 표시되는 `heartbeat skipped` → `agents.defaults.heartbeat.directPolicy`(또는 에이전트별 재정의)가 `block`으로 설정된 상태에서 Heartbeat 대상이 DM 방식의 대상으로 확인되었습니다.

  </Accordion>
</AccordionGroup>

관련 항목:

- [Heartbeat](/ko/gateway/heartbeat)
- [예약된 작업](/ko/automation/cron-jobs)
- [예약된 작업: 문제 해결](/ko/automation/cron-jobs#troubleshooting)

## Node는 페어링되었지만 도구가 실패함

Node가 페어링되었지만 도구가 실패하는 경우 포그라운드, 권한 및 승인 상태를 각각 분리하여 확인하십시오.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

확인할 항목:

- 예상 기능을 갖춘 Node가 온라인 상태인지 여부.
- 카메라/마이크/위치/화면에 대한 OS 권한 부여.
- 실행 승인 및 허용 목록 상태.

일반적인 징후:

- `NODE_BACKGROUND_UNAVAILABLE` → Node 앱이 포그라운드에 있어야 합니다.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 권한이 누락되었습니다.
- `SYSTEM_RUN_DENIED: approval required` → 실행 승인이 대기 중입니다.
- `SYSTEM_RUN_DENIED: allowlist miss` → 명령이 허용 목록에 의해 차단되었습니다.

관련 항목:

- [실행 승인](/ko/tools/exec-approvals)
- [Node 문제 해결](/ko/nodes/troubleshooting)
- [Node](/ko/nodes/index)

## 브라우저 도구가 실패함

Gateway 자체는 정상인데 브라우저 도구 작업이 실패할 때 사용하십시오.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

확인할 항목:

- `plugins.allow`가 설정되어 있고 `browser`가 포함되어 있는지 여부.
- 유효한 브라우저 실행 파일 경로.
- CDP 프로필에 도달할 수 있는지 여부.
- `existing-session` / `user` 프로필에서 로컬 Chrome을 사용할 수 있는지 여부.

<AccordionGroup>
  <Accordion title="Plugin / 실행 파일 징후">
    - `unknown command "browser"` 또는 `unknown command 'browser'` → 번들 브라우저 Plugin이 `plugins.allow`에서 제외되었습니다.
    - `browser.enabled=true`인데 브라우저 도구가 누락되었거나 사용할 수 없음 → `plugins.allow`에서 `browser`를 제외하여 Plugin이 로드되지 않았습니다.
    - `Failed to start Chrome CDP on port` → 브라우저 프로세스를 시작하지 못했습니다.
    - `browser.executablePath not found` → 구성된 경로가 잘못되었습니다.
    - `browser.cdpUrl must be http(s) or ws(s)` → 구성된 CDP URL이 `file:` 또는 `ftp:`와 같은 지원되지 않는 스킴을 사용합니다.
    - `browser.cdpUrl has invalid port` → 구성된 CDP URL의 포트가 잘못되었거나 허용 범위를 벗어났습니다.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 현재 Gateway 설치에 핵심 브라우저 런타임 종속성이 없습니다. OpenClaw를 다시 설치하거나 업데이트한 다음 Gateway를 다시 시작하십시오. ARIA 스냅샷과 기본 페이지 스크린샷은 계속 사용할 수 있지만 탐색, AI 스냅샷, CSS 선택자 요소 스크린샷 및 PDF 내보내기는 계속 사용할 수 없습니다.

  </Accordion>
  <Accordion title="Chrome MCP / 기존 세션 징후">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP 기존 세션이 아직 선택한 브라우저 데이터 디렉터리에 연결하지 못했습니다. 브라우저 검사 페이지를 열고 원격 디버깅을 활성화한 다음 브라우저를 열린 상태로 유지하고 첫 연결 프롬프트를 승인한 후 다시 시도하십시오. 로그인 상태가 필요하지 않으면 관리형 `openclaw` 프로필을 사용하는 것이 좋습니다.
    - `No browser tabs found for profile="user"` → Chrome MCP 연결 프로필에 열려 있는 로컬 Chrome 탭이 없습니다.
    - `Remote CDP for profile "<name>" is not reachable` → Gateway 호스트에서 구성된 원격 CDP 엔드포인트에 도달할 수 없습니다.
    - `Browser attachOnly is enabled ... not reachable` 또는 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 연결 전용 프로필에 도달 가능한 대상이 없거나 HTTP 엔드포인트는 응답했지만 CDP WebSocket을 여전히 열 수 없습니다.

  </Accordion>
  <Accordion title="요소 / 스크린샷 / 업로드 징후">
    - `fullPage is not supported for element screenshots` → 스크린샷 요청에서 `--full-page`를 `--ref` 또는 `--element`와 함께 사용했습니다.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 스크린샷 호출은 CSS `--element`가 아니라 페이지 캡처 또는 스냅샷 `--ref`를 사용해야 합니다.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 업로드 훅에는 CSS 선택자가 아니라 스냅샷 참조가 필요합니다.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP 프로필에서는 호출당 하나의 업로드만 전송하십시오.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 프로필의 대화 상자 훅은 시간 제한 재정의를 지원하지 않습니다.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP 기존 세션 프로필에서 `act:type`을 사용할 때 `timeoutMs`를 생략하거나, 사용자 지정 시간 제한이 필요하면 관리형/CDP 브라우저 프로필을 사용하십시오.
    - `response body is not supported for existing-session profiles yet.` → `responsebody`에는 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다.
    - 연결 전용 또는 원격 CDP 프로필의 오래된 뷰포트 / 다크 모드 / 로캘 / 오프라인 재정의 → 전체 Gateway를 다시 시작하지 않고 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 상태를 해제하려면 `openclaw browser stop --browser-profile <name>`을 실행하십시오.

  </Accordion>
</AccordionGroup>

관련 항목:

- [브라우저(OpenClaw 관리형)](/ko/tools/browser)
- [브라우저 문제 해결](/ko/tools/browser-linux-troubleshooting)

## 업그레이드 후 갑자기 문제가 발생한 경우

업그레이드 후 발생하는 대부분의 문제는 구성 드리프트 또는 이제 적용되는 더 엄격한 기본값 때문입니다.

<AccordionGroup>
  <Accordion title="1. 인증 및 URL 재정의 동작 변경">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    확인할 사항:

    - `gateway.mode=remote`인 경우 로컬 서비스가 정상이어도 CLI 호출은 원격을 대상으로 할 수 있습니다.
    - 명시적인 `--url` 호출은 저장된 자격 증명으로 폴백하지 않습니다.

    일반적인 징후:

    - `gateway connect failed:` → URL 대상이 잘못되었습니다.
    - `unauthorized` → 엔드포인트에 도달할 수 있지만 인증이 잘못되었습니다.

  </Accordion>
  <Accordion title="2. 바인드 및 인증 보호 규칙 강화">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    확인할 사항:

    - 비루프백 바인드(`lan`, `tailnet`, `custom`)에는 유효한 Gateway 인증 경로가 필요합니다. 공유 토큰/비밀번호 인증 또는 올바르게 구성된 비루프백 `trusted-proxy` 배포를 사용해야 합니다.
    - `gateway.token`과 같은 이전 키는 `gateway.auth.token`을 대체하지 않습니다.

    일반적인 징후:

    - `refusing to bind gateway ... without auth` → 유효한 Gateway 인증 경로가 없는 비루프백 바인드입니다.
    - 런타임이 실행 중인데 `Connectivity probe: failed`가 표시됨 → Gateway는 작동 중이지만 현재 인증/URL로는 액세스할 수 없습니다.

  </Accordion>
  <Accordion title="3. 페어링 및 기기 ID 상태 변경">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    확인할 사항:

    - 대시보드/Node의 대기 중인 기기 승인.
    - 정책 또는 ID 변경 후 대기 중인 DM 페어링 승인.

    일반적인 징후:

    - `device identity required` → 기기 인증이 충족되지 않았습니다.
    - `pairing required` → 발신자/기기를 승인해야 합니다.

  </Accordion>
</AccordionGroup>

확인 후에도 서비스 구성과 런타임이 일치하지 않으면 동일한 프로필/상태 디렉터리에서 서비스 메타데이터를 다시 설치하십시오.

```bash
openclaw gateway install --force
openclaw gateway restart
```

관련 항목:

- [인증](/ko/gateway/authentication)
- [백그라운드 실행 및 프로세스 도구](/ko/gateway/background-process)
- [Node 페어링](/ko/gateway/pairing)

## 관련 항목

- [Doctor](/ko/gateway/doctor)
- [FAQ](/ko/help/faq)
- [Gateway 실행 지침서](/ko/gateway)
