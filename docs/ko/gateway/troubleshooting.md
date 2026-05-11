---
read_when:
    - 문제 해결 허브에서 더 심층적인 진단을 위해 이곳으로 안내했습니다
    - 정확한 명령이 포함된 안정적인 증상 기반 런북 섹션이 필요합니다
sidebarTitle: Troubleshooting
summary: Gateway, 채널, 자동화, 노드 및 브라우저를 위한 심층 문제 해결 런북
title: 문제 해결
x-i18n:
    generated_at: "2026-05-11T20:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 146a593493ce265da9a24660e8a9fc2effa25cae16cf00bf77cc1f2fec84275d
    source_path: gateway/troubleshooting.md
    workflow: 16
---

이 페이지는 심층 런북입니다. 빠른 분류 흐름을 먼저 보려면 [/help/troubleshooting](/ko/help/troubleshooting)에서 시작하세요.

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

- `openclaw gateway status`에 `Runtime: running`, `Connectivity probe: ok`, `Capability: ...` 줄이 표시됩니다.
- `openclaw doctor`가 차단적인 구성/서비스 문제를 보고하지 않습니다.
- `openclaw channels status --probe`가 계정별 실시간 전송 상태와, 지원되는 경우 `works` 또는 `audit ok` 같은 프로브/감사 결과를 표시합니다.

## 분리된 설치와 최신 구성 가드

업데이트 후 Gateway 서비스가 예기치 않게 중지되거나, 로그에서 한 `openclaw` 바이너리가 마지막으로 `openclaw.json`을 기록한 버전보다 오래되었다고 표시될 때 사용하세요.

OpenClaw는 구성 쓰기에 `meta.lastTouchedVersion`을 찍습니다. 읽기 전용 명령은 더 최신 OpenClaw가 작성한 구성도 계속 검사할 수 있지만, 오래된 바이너리의 프로세스 및 서비스 변경은 계속 진행하지 않습니다. 차단되는 작업에는 Gateway 서비스 시작, 중지, 재시작, 제거, 강제 서비스 재설치, 서비스 모드 Gateway 시작, `gateway --force` 포트 정리가 포함됩니다.

```bash
which openclaw
openclaw --version
openclaw gateway status --deep
openclaw config get meta.lastTouchedVersion
```

<Steps>
  <Step title="PATH 수정">
    `PATH`를 수정해 `openclaw`이 더 최신 설치로 해석되도록 한 다음 작업을 다시 실행하세요.
  </Step>
  <Step title="Gateway 서비스 재설치">
    더 최신 설치에서 의도한 Gateway 서비스를 재설치하세요.

    ```bash
    openclaw gateway install --force
    openclaw gateway restart
    ```

  </Step>
  <Step title="오래된 래퍼 제거">
    여전히 오래된 `openclaw` 바이너리를 가리키는 오래된 시스템 패키지나 이전 래퍼 항목을 제거하세요.
  </Step>
</Steps>

<Warning>
의도적인 다운그레이드나 긴급 복구에만 단일 명령에 대해 `OPENCLAW_ALLOW_OLDER_BINARY_DESTRUCTIVE_ACTIONS=1`을 설정하세요. 일반 작업에서는 설정하지 않은 상태로 두세요.
</Warning>

## 경로 이탈로 Skills 심볼릭 링크 건너뜀

로그에 다음이 포함될 때 사용하세요.

```text
Skipping escaped skill path outside its configured root: ... reason=symlink-escape
```

OpenClaw는 모든 skill 루트를 격리 경계로 취급합니다. `~/.agents/skills`, `<workspace>/.agents/skills`, `<workspace>/skills` 또는 `~/.openclaw/skills` 아래의 심볼릭 링크는 실제 대상이 해당 루트 외부로 해석되면 명시적으로 신뢰된 대상이 아닌 한 건너뜁니다.

링크를 검사하세요.

```bash
ls -l ~/.agents/skills/<name>
realpath ~/.agents/skills/<name>
openclaw config get skills.load
```

대상이 의도된 것이라면 직접 skill 루트와 허용된 심볼릭 링크 대상을 모두 구성하세요.

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

그런 다음 새 세션을 시작하거나 skills 감시자가 새로 고칠 때까지 기다리세요. 실행 중인 프로세스가 구성 변경 이전의 것이라면 Gateway를 재시작하세요.

`~`, `/` 또는 전체 동기화 프로젝트 폴더 같은 넓은 대상을 사용하지 마세요. `allowSymlinkTargets`는 신뢰할 수 있는 `SKILL.md` 디렉터리가 들어 있는 실제 skill 루트로 범위를 제한하세요.

관련 항목:

- [Skills 구성](/ko/tools/skills-config#symlinked-sibling-repos)
- [구성 예시](/ko/gateway/configuration-examples#symlinked-sibling-skill-repo)

## 긴 컨텍스트에 Anthropic 429 추가 사용량 필요

로그/오류에 `HTTP 429: rate_limit_error: Extra usage is required for long context requests`가 포함될 때 사용하세요.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

다음을 확인하세요.

- 선택한 Anthropic Opus/Sonnet 모델에 `params.context1m: true`가 있습니다.
- 현재 Anthropic 자격 증명이 긴 컨텍스트 사용 대상이 아닙니다.
- 요청이 1M 베타 경로가 필요한 긴 세션/모델 실행에서만 실패합니다.

수정 옵션:

<Steps>
  <Step title="context1m 비활성화">
    해당 모델의 `context1m`을 비활성화해 일반 컨텍스트 창으로 되돌리세요.
  </Step>
  <Step title="대상 자격 증명 사용">
    긴 컨텍스트 요청 대상인 Anthropic 자격 증명을 사용하거나 Anthropic API 키로 전환하세요.
  </Step>
  <Step title="대체 모델 구성">
    Anthropic 긴 컨텍스트 요청이 거부되어도 실행이 계속되도록 대체 모델을 구성하세요.
  </Step>
</Steps>

관련 항목:

- [Anthropic](/ko/providers/anthropic)
- [토큰 사용량 및 비용](/ko/reference/token-use)
- [Anthropic에서 HTTP 429가 표시되는 이유는 무엇인가요?](/ko/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## 로컬 OpenAI 호환 백엔드는 직접 프로브를 통과하지만 에이전트 실행은 실패함

다음 상황에서 사용하세요.

- `curl ... /v1/models`가 작동함
- 작은 직접 `/v1/chat/completions` 호출이 작동함
- OpenClaw 모델 실행이 일반 에이전트 턴에서만 실패함

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

다음을 확인하세요.

- 직접 작은 호출은 성공하지만 OpenClaw 실행은 더 큰 프롬프트에서만 실패함
- 직접 `/v1/chat/completions`가 같은 기본 모델 ID로 작동하는데도 `model_not_found` 또는 404 오류가 발생함
- `messages[].content`가 문자열이어야 한다는 백엔드 오류
- OpenAI 호환 로컬 백엔드에서 간헐적인 `incomplete turn detected ... stopReason=stop payloads=0` 경고
- 더 큰 프롬프트 토큰 수나 전체 에이전트 런타임 프롬프트에서만 나타나는 백엔드 충돌

<AccordionGroup>
  <Accordion title="일반적인 시그니처">
    - 로컬 MLX/vLLM 스타일 서버에서 `model_not_found` → `baseUrl`에 `/v1`이 포함되어 있는지, `/v1/chat/completions` 백엔드에 대해 `api`가 `"openai-completions"`인지, `models.providers.<provider>.models[].id`가 제공자 로컬 기본 ID인지 확인하세요. 예를 들어 `mlx/mlx-community/Qwen3-30B-A3B-6bit`처럼 제공자 접두사를 한 번 붙여 선택하고, 카탈로그 항목은 `mlx-community/Qwen3-30B-A3B-6bit`로 유지하세요.
    - `messages[...].content: invalid type: sequence, expected a string` → 백엔드가 구조화된 Chat Completions 콘텐츠 파트를 거부합니다. 수정: `models.providers.<provider>.models[].compat.requiresStringContent: true`를 설정하세요.
    - `validation.keys` 또는 `["role","content"]` 같은 허용된 메시지 키 → 백엔드가 Chat Completions 메시지의 OpenAI 스타일 재생 메타데이터를 거부합니다. 수정: `models.providers.<provider>.models[].compat.strictMessageKeys: true`를 설정하세요.
    - `incomplete turn detected ... stopReason=stop payloads=0` → 백엔드가 Chat Completions 요청을 완료했지만 해당 턴에 사용자에게 보이는 어시스턴트 텍스트를 반환하지 않았습니다. OpenClaw는 재생에 안전한 빈 OpenAI 호환 턴을 한 번 다시 시도합니다. 지속적인 실패는 일반적으로 백엔드가 빈/비텍스트 콘텐츠를 내보내거나 최종 답변 텍스트를 억제하고 있음을 의미합니다.
    - 직접 작은 요청은 성공하지만 OpenClaw 에이전트 실행은 백엔드/모델 충돌로 실패함(예: 일부 `inferrs` 빌드의 Gemma) → OpenClaw 전송은 이미 올바를 가능성이 높고, 백엔드가 더 큰 에이전트 런타임 프롬프트 형태에서 실패하는 것입니다.
    - 도구를 비활성화한 뒤 실패가 줄어들지만 사라지지는 않음 → 도구 스키마도 압박의 일부였지만, 남은 문제는 여전히 업스트림 모델/서버 용량 또는 백엔드 버그입니다.

  </Accordion>
  <Accordion title="수정 옵션">
    1. 문자열 전용 Chat Completions 백엔드에는 `compat.requiresStringContent: true`를 설정하세요.
    2. 각 메시지에서 `role`과 `content`만 허용하는 엄격한 Chat Completions 백엔드에는 `compat.strictMessageKeys: true`를 설정하세요.
    3. OpenClaw의 도구 스키마 표면을 안정적으로 처리할 수 없는 모델/백엔드에는 `compat.supportsTools: false`를 설정하세요.
    4. 가능한 곳에서 프롬프트 압박을 낮추세요. 더 작은 워크스페이스 부트스트랩, 더 짧은 세션 기록, 더 가벼운 로컬 모델, 또는 더 강력한 긴 컨텍스트 지원을 갖춘 백엔드를 사용하세요.
    5. 작은 직접 요청은 계속 통과하지만 OpenClaw 에이전트 턴이 여전히 백엔드 내부에서 충돌한다면, 이를 업스트림 서버/모델 제한으로 보고 허용된 페이로드 형태와 함께 그곳에 재현 사례를 제출하세요.
  </Accordion>
</AccordionGroup>

관련 항목:

- [구성](/ko/gateway/configuration)
- [로컬 모델](/ko/gateway/local-models)
- [OpenAI 호환 엔드포인트](/ko/gateway/configuration-reference#openai-compatible-endpoints)

## 응답 없음

채널은 올라와 있지만 아무것도 응답하지 않는다면, 어떤 것도 다시 연결하기 전에 라우팅과 정책을 확인하세요.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

다음을 확인하세요.

- DM 발신자에 대해 페어링이 보류 중입니다.
- 그룹 멘션 게이팅(`requireMention`, `mentionPatterns`).
- 채널/그룹 허용 목록 불일치.

일반적인 시그니처:

- `drop guild message (mention required` → 멘션 전까지 그룹 메시지가 무시됩니다.
- `pairing request` → 발신자 승인이 필요합니다.
- `blocked` / `allowlist` → 발신자/채널이 정책에 의해 필터링되었습니다.

관련 항목:

- [채널 문제 해결](/ko/channels/troubleshooting)
- [그룹](/ko/channels/groups)
- [페어링](/ko/channels/pairing)

## 대시보드 제어 UI 연결

대시보드/제어 UI가 연결되지 않을 때는 URL, 인증 모드, 보안 컨텍스트 가정을 검증하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

다음을 확인하세요.

- 올바른 프로브 URL 및 대시보드 URL.
- 클라이언트와 Gateway 간 인증 모드/토큰 불일치.
- 장치 ID가 필요한 곳에서 HTTP 사용.

<AccordionGroup>
  <Accordion title="연결 / 인증 시그니처">
    - `device identity required` → 보안 컨텍스트가 아니거나 장치 인증이 누락되었습니다.
    - `origin not allowed` → 브라우저 `Origin`이 `gateway.controlUi.allowedOrigins`에 없습니다(또는 명시적 허용 목록 없이 loopback이 아닌 브라우저 원본에서 연결 중입니다).
    - `device nonce required` / `device nonce mismatch` → 클라이언트가 챌린지 기반 장치 인증 흐름(`connect.challenge` + `device.nonce`)을 완료하지 않고 있습니다.
    - `device signature invalid` / `device signature expired` → 클라이언트가 현재 핸드셰이크에 대해 잘못된 페이로드(또는 오래된 타임스탬프)에 서명했습니다.
    - `AUTH_TOKEN_MISMATCH` 및 `canRetryWithDeviceToken=true` → 클라이언트가 캐시된 장치 토큰으로 신뢰된 재시도를 한 번 수행할 수 있습니다.
    - 그 캐시 토큰 재시도는 페어링된 장치 토큰과 함께 저장된 캐시 범위 집합을 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 대신 요청한 범위 집합을 유지합니다.
    - `AUTH_SCOPE_MISMATCH` → 장치 토큰은 인식되었지만 승인된 범위가 이 연결 요청을 포함하지 않습니다. 공유 Gateway 토큰을 교체하지 말고 다시 페어링하거나 요청된 범위 계약을 승인하세요.
    - 해당 재시도 경로 밖에서는 연결 인증 우선순위가 명시적 공유 토큰/비밀번호, 명시적 `deviceToken`, 저장된 장치 토큰, 부트스트랩 토큰 순입니다.
    - 비동기 Tailscale Serve Control UI 경로에서는 같은 `{scope, ip}`에 대한 실패 시도가 제한기가 실패를 기록하기 전에 직렬화됩니다. 따라서 같은 클라이언트에서 동시에 두 번 잘못 재시도하면 두 번의 단순 불일치 대신 두 번째 시도에서 `retry later`가 나타날 수 있습니다.
    - 브라우저 원본 loopback 클라이언트에서 `too many failed authentication attempts (retry later)` → 같은 정규화된 `Origin`에서 반복된 실패가 일시적으로 잠깁니다. 다른 localhost 원본은 별도 버킷을 사용합니다.
    - 그 재시도 후에도 반복되는 `unauthorized` → 공유 토큰/장치 토큰 드리프트입니다. 토큰 구성을 새로 고치고 필요하면 장치 토큰을 다시 승인/교체하세요.
    - `gateway connect failed:` → 잘못된 호스트/포트/URL 대상입니다.

  </Accordion>
</AccordionGroup>

### 인증 세부 코드 빠른 맵

실패한 `connect` 응답의 `error.details.code`를 사용해 다음 작업을 선택하세요:

| 상세 코드                  | 의미                                                                                                                                                                                      | 권장 조치                                                                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | 클라이언트가 필요한 공유 토큰을 보내지 않았습니다.                                                                                                                                                 | 클라이언트에 토큰을 붙여넣거나 설정한 뒤 다시 시도하세요. 대시보드 경로의 경우: `openclaw config get gateway.auth.token`을 실행한 다음 제어 UI 설정에 붙여넣으세요.                                                                                                                                              |
| `AUTH_TOKEN_MISMATCH`        | 공유 토큰이 Gateway 인증 토큰과 일치하지 않았습니다.                                                                                                                                               | `canRetryWithDeviceToken=true`이면 신뢰할 수 있는 재시도를 한 번 허용하세요. 캐시된 토큰 재시도는 저장된 승인 범위를 재사용합니다. 명시적인 `deviceToken` / `scopes` 호출자는 요청한 범위를 유지합니다. 계속 실패하면 [토큰 드리프트 복구 체크리스트](/ko/cli/devices#token-drift-recovery-checklist)를 실행하세요. |
| `AUTH_DEVICE_TOKEN_MISMATCH` | 캐시된 장치별 토큰이 오래되었거나 취소되었습니다.                                                                                                                                                 | [장치 CLI](/ko/cli/devices)를 사용해 장치 토큰을 교체하거나 다시 승인한 다음 다시 연결하세요.                                                                                                                                                                                                        |
| `AUTH_SCOPE_MISMATCH`        | 장치 토큰은 유효하지만, 승인된 역할/범위가 이 연결 요청을 포함하지 않습니다.                                                                                                       | 장치를 다시 페어링하거나 요청된 범위 계약을 승인하세요. 이를 공유 토큰 드리프트로 취급하지 마세요.                                                                                                                                                                                     |
| `PAIRING_REQUIRED`           | 장치 ID에 승인이 필요합니다. `not-paired`, `scope-upgrade`, `role-upgrade` 또는 `metadata-upgrade` 여부는 `error.details.reason`을 확인하고, 있는 경우 `requestId` / `remediationHint`를 사용하세요. | 대기 중인 요청을 승인하세요: `openclaw devices list`를 실행한 다음 `openclaw devices approve <requestId>`를 실행하세요. 범위/역할 업그레이드는 요청된 접근 권한을 검토한 후 동일한 흐름을 사용합니다.                                                                                                               |

<Note>
공유 Gateway 토큰/비밀번호로 인증된 직접 루프백 백엔드 RPC는 CLI의 페어링된 장치 범위 기준선에 의존해서는 안 됩니다. 하위 에이전트나 다른 내부 호출이 여전히 `scope-upgrade`로 실패하면, 호출자가 `client.id: "gateway-client"` 및 `client.mode: "backend"`를 사용하고 있으며 명시적인 `deviceIdentity` 또는 장치 토큰을 강제하지 않는지 확인하세요.
</Note>

장치 인증 v2 마이그레이션 확인:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

로그에 nonce/서명 오류가 표시되면 연결 클라이언트를 업데이트하고 검증하세요.

<Steps>
  <Step title="connect.challenge 대기">
    클라이언트가 Gateway에서 발급한 `connect.challenge`를 기다립니다.
  </Step>
  <Step title="페이로드 서명">
    클라이언트가 챌린지에 바인딩된 페이로드에 서명합니다.
  </Step>
  <Step title="장치 nonce 전송">
    클라이언트가 동일한 챌린지 nonce와 함께 `connect.params.device.nonce`를 보냅니다.
  </Step>
</Steps>

`openclaw devices rotate` / `revoke` / `remove`가 예기치 않게 거부되는 경우:

- 페어링된 장치 토큰 세션은 호출자에게 `operator.admin`도 있는 경우를 제외하고 **자신의** 장치만 관리할 수 있습니다
- `openclaw devices rotate --scope ...`는 호출자 세션이 이미 보유한 operator 범위만 요청할 수 있습니다

관련 항목:

- [구성](/ko/gateway/configuration) (Gateway 인증 모드)
- [제어 UI](/ko/web/control-ui)
- [장치](/ko/cli/devices)
- [원격 접근](/ko/gateway/remote)
- [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)

## Gateway 서비스가 실행되지 않음

서비스가 설치되어 있지만 프로세스가 계속 실행 상태를 유지하지 못할 때 사용하세요.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

확인할 항목:

- 종료 힌트가 포함된 `Runtime: stopped`.
- 서비스 구성 불일치(`Config (cli)` 대 `Config (service)`).
- 포트/리스너 충돌.
- `--deep`을 사용할 때 추가 launchd/systemd/schtasks 설치.
- `Other gateway-like services detected (best effort)` 정리 힌트.

<AccordionGroup>
  <Accordion title="일반적인 시그니처">
    - `Gateway start blocked: set gateway.mode=local` 또는 `existing config is missing gateway.mode` → 로컬 Gateway 모드가 활성화되지 않았거나 구성 파일이 덮어써져 `gateway.mode`가 손실되었습니다. 해결: 구성에서 `gateway.mode="local"`을 설정하거나 `openclaw onboard --mode local` / `openclaw setup`을 다시 실행해 예상되는 로컬 모드 구성을 다시 찍으세요. Podman으로 OpenClaw를 실행하는 경우 기본 구성 경로는 `~/.openclaw/openclaw.json`입니다.
    - `refusing to bind gateway ... without auth` → 유효한 Gateway 인증 경로(토큰/비밀번호 또는 구성된 경우 신뢰할 수 있는 프록시) 없이 비루프백 바인딩을 시도했습니다.
    - `another gateway instance is already listening` / `EADDRINUSE` → 포트 충돌입니다.
    - `Other gateway-like services detected (best effort)` → 오래되었거나 병렬로 실행되는 launchd/systemd/schtasks 유닛이 있습니다. 대부분의 설정에서는 머신당 하나의 Gateway만 유지해야 합니다. 둘 이상이 꼭 필요하면 포트와 구성/상태/작업 공간을 분리하세요. [/gateway#multiple-gateways-same-host](/ko/gateway#multiple-gateways-same-host)를 참조하세요.
    - doctor의 `System-level OpenClaw gateway service detected` → 사용자 수준 서비스는 없지만 systemd 시스템 유닛이 있습니다. doctor가 사용자 서비스를 설치하도록 허용하기 전에 중복 항목을 제거하거나 비활성화하세요. 또는 시스템 유닛이 의도한 감독자인 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요.
    - `Gateway service port does not match current gateway config` → 설치된 감독자가 여전히 이전 `--port`를 고정하고 있습니다. `openclaw doctor --fix` 또는 `openclaw gateway install --force`를 실행한 다음 Gateway 서비스를 다시 시작하세요.

  </Accordion>
</AccordionGroup>

관련 항목:

- [백그라운드 실행 및 프로세스 도구](/ko/gateway/background-process)
- [구성](/ko/gateway/configuration)
- [Doctor](/ko/gateway/doctor)

## Gateway가 잘못된 구성을 거부함

Gateway 시작이 `Invalid config`로 실패하거나 핫 리로드 로그에서
잘못된 편집을 건너뛰었다고 표시될 때 사용하세요.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

확인할 항목:

- `Invalid config at ...`
- `config reload skipped (invalid config): ...`
- `Config write rejected: ...`
- 활성 구성 옆의 타임스탬프가 찍힌 `openclaw.json.rejected.*` 파일
- `doctor --fix`가 깨진 직접 편집을 복구한 경우 타임스탬프가 찍힌 `openclaw.json.clobbered.*` 파일

<AccordionGroup>
  <Accordion title="발생한 일">
    - 시작, 핫 리로드 또는 OpenClaw가 소유한 쓰기 중 구성이 검증을 통과하지 못했습니다.
    - Gateway 시작은 `openclaw.json`을 다시 쓰는 대신 실패로 닫힙니다.
    - 핫 리로드는 잘못된 외부 편집을 건너뛰고 현재 런타임 구성을 활성 상태로 유지합니다.
    - OpenClaw가 소유한 쓰기는 커밋 전에 잘못되었거나 파괴적인 페이로드를 거부하고 `.rejected.*`를 저장합니다.
    - `openclaw doctor --fix`가 복구를 담당합니다. JSON이 아닌 접두사를 제거하거나 마지막 정상 복사본을 복원하면서 거부된 페이로드를 `.clobbered.*`로 보존할 수 있습니다.

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
  <Accordion title="일반적인 시그니처">
    - `.clobbered.*`가 있음 → doctor가 활성 구성을 복구하는 동안 깨진 외부 편집을 보존했습니다.
    - `.rejected.*`가 있음 → OpenClaw가 소유한 구성 쓰기가 커밋 전에 스키마 또는 덮어쓰기 검사를 통과하지 못했습니다.
    - `Config write rejected:` → 쓰기가 필수 형태를 제거하거나, 파일을 급격히 줄이거나, 잘못된 구성을 유지하려고 했습니다.
    - `config reload skipped (invalid config):` → 직접 편집이 검증에 실패했고 실행 중인 Gateway에서 무시되었습니다.
    - `Invalid config at ...` → Gateway 서비스가 부팅되기 전에 시작이 실패했습니다.
    - `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` 또는 `size-drop-vs-last-good:*` → OpenClaw가 소유한 쓰기가 마지막 정상 백업과 비교해 필드나 크기를 잃어 거부되었습니다.
    - `Config last-known-good promotion skipped` → 후보에 `***` 같은 마스킹된 비밀 플레이스홀더가 포함되어 있었습니다.

  </Accordion>
  <Accordion title="수정 옵션">
    1. `openclaw doctor --fix`를 실행해 doctor가 접두사가 붙었거나 덮어써진 구성을 복구하거나 마지막 정상 구성을 복원하게 하세요.
    2. `.clobbered.*` 또는 `.rejected.*`에서 의도한 키만 복사한 다음 `openclaw config set` 또는 `config.patch`로 적용하세요.
    3. 다시 시작하기 전에 `openclaw config validate`를 실행하세요.
    4. 직접 편집하는 경우 변경하려는 부분 객체만이 아니라 전체 JSON5 구성을 유지하세요.
  </Accordion>
</AccordionGroup>

관련 항목:

- [Config](/ko/cli/config)
- [구성: 핫 리로드](/ko/gateway/configuration#config-hot-reload)
- [구성: 엄격한 검증](/ko/gateway/configuration#strict-validation)
- [Doctor](/ko/gateway/doctor)

## Gateway 프로브 경고

`openclaw gateway probe`가 대상에 도달하지만 여전히 경고 블록을 출력할 때 사용하세요.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

확인할 항목:

- JSON 출력의 `warnings[].code` 및 `primaryTargetId`.
- 경고가 SSH 폴백, 여러 Gateway, 누락된 범위 또는 확인되지 않은 인증 참조에 관한 것인지 여부.

일반적인 시그니처:

- `SSH tunnel failed to start; falling back to direct probes.` → SSH 설정에 실패했지만, 명령은 여전히 구성된 직접 대상/루프백 대상에 대한 시도를 수행했습니다.
- `multiple reachable gateways detected` → 둘 이상의 대상이 응답했습니다. 보통 의도적인 다중 Gateway 설정이거나 오래된/중복 리스너가 있다는 뜻입니다.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → 연결은 성공했지만 세부 RPC가 범위로 제한되었습니다. 장치 ID를 페어링하거나 `operator.read`가 있는 자격 증명을 사용하세요.
- `Gateway accepted the WebSocket connection, but follow-up read diagnostics failed` → 연결은 성공했지만 전체 진단 RPC 세트가 시간 초과되었거나 실패했습니다. 이를 진단 기능이 저하된 도달 가능한 Gateway로 취급하세요. `--json` 출력에서 `connect.ok`와 `connect.rpcOk`를 비교하세요.
- `Capability: pairing-pending` 또는 `gateway closed (1008): pairing required` → Gateway가 응답했지만, 이 클라이언트는 일반 operator 접근 전에 여전히 페어링/승인이 필요합니다.
- 확인되지 않은 `gateway.auth.*` / `gateway.remote.*` SecretRef 경고 텍스트 → 실패한 대상의 이 명령 경로에서 인증 자료를 사용할 수 없었습니다.

관련 항목:

- [Gateway](/ko/cli/gateway)
- [동일한 호스트의 여러 Gateway](/ko/gateway#multiple-gateways-same-host)
- [원격 액세스](/ko/gateway/remote)

## 채널은 연결되었지만 메시지가 흐르지 않음

채널 상태가 연결됨이지만 메시지 흐름이 중단된 경우, 정책, 권한, 채널별 전달 규칙에 집중하세요.

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
- 누락된 채널 API 권한/스코프.

일반적인 징후:

- `mention required` → 그룹 멘션 정책에 따라 메시지가 무시됨.
- `pairing` / 보류 중인 승인 추적 → 보낸 사람이 승인되지 않음.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → 채널 인증/권한 문제.

관련 항목:

- [채널 문제 해결](/ko/channels/troubleshooting)
- [Discord](/ko/channels/discord)
- [Telegram](/ko/channels/telegram)
- [WhatsApp](/ko/channels/whatsapp)

## Cron 및 Heartbeat 전달

cron 또는 heartbeat가 실행되지 않았거나 전달되지 않은 경우, 먼저 스케줄러 상태를 확인한 다음 전달 대상을 확인하세요.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

확인할 항목:

- Cron이 활성화되어 있고 다음 깨우기가 있음.
- 작업 실행 기록 상태(`ok`, `skipped`, `error`).
- Heartbeat 건너뜀 이유(`quiet-hours`, `requests-in-flight`, `cron-in-progress`, `lanes-busy`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

<AccordionGroup>
  <Accordion title="일반적인 징후">
    - `cron: scheduler disabled; jobs will not run automatically` → cron이 비활성화됨.
    - `cron: timer tick failed` → 스케줄러 틱 실패. 파일/로그/런타임 오류를 확인하세요.
    - `heartbeat skipped` 및 `reason=quiet-hours` → 활성 시간 창 밖임.
    - `heartbeat skipped` 및 `reason=empty-heartbeat-file` → `HEARTBEAT.md`가 있지만 빈 줄 / markdown 헤더만 포함하므로 OpenClaw가 모델 호출을 건너뜀.
    - `heartbeat skipped` 및 `reason=no-tasks-due` → `HEARTBEAT.md`에 `tasks:` 블록이 있지만 이 틱에 기한이 된 작업이 없음.
    - `heartbeat: unknown accountId` → Heartbeat 전달 대상의 계정 id가 유효하지 않음.
    - `heartbeat skipped` 및 `reason=dm-blocked` → `agents.defaults.heartbeat.directPolicy`(또는 에이전트별 재정의)가 `block`으로 설정된 상태에서 Heartbeat 대상이 DM 스타일 대상으로 해석됨.

  </Accordion>
</AccordionGroup>

관련 항목:

- [Heartbeat](/ko/gateway/heartbeat)
- [예약된 작업](/ko/automation/cron-jobs)
- [예약된 작업: 문제 해결](/ko/automation/cron-jobs#troubleshooting)

## Node가 페어링되었지만 도구가 실패함

node가 페어링되었지만 도구가 실패하는 경우, 포그라운드, 권한, 승인 상태를 분리해 확인하세요.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

확인할 항목:

- 예상 기능을 갖춘 Node 온라인 상태.
- 카메라/마이크/위치/화면에 대한 OS 권한 부여.
- Exec 승인 및 허용 목록 상태.

일반적인 징후:

- `NODE_BACKGROUND_UNAVAILABLE` → node 앱이 포그라운드에 있어야 함.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → OS 권한 누락.
- `SYSTEM_RUN_DENIED: approval required` → exec 승인 보류 중.
- `SYSTEM_RUN_DENIED: allowlist miss` → 명령이 허용 목록에 의해 차단됨.

관련 항목:

- [Exec 승인](/ko/tools/exec-approvals)
- [Node 문제 해결](/ko/nodes/troubleshooting)
- [Nodes](/ko/nodes/index)

## 브라우저 도구 실패

Gateway 자체는 정상인데 브라우저 도구 동작이 실패할 때 사용하세요.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

확인할 항목:

- `plugins.allow`가 설정되어 있고 `browser`를 포함하는지 여부.
- 유효한 브라우저 실행 파일 경로.
- CDP 프로필 도달 가능성.
- `existing-session` / `user` 프로필에 사용할 로컬 Chrome 가용성.

<AccordionGroup>
  <Accordion title="Plugin / 실행 파일 징후">
    - `unknown command "browser"` 또는 `unknown command 'browser'` → 번들 브라우저 Plugin이 `plugins.allow`에 의해 제외됨.
    - `browser.enabled=true`인데 브라우저 도구가 누락됨 / 사용할 수 없음 → `plugins.allow`가 `browser`를 제외하여 Plugin이 로드되지 않음.
    - `Failed to start Chrome CDP on port` → 브라우저 프로세스 실행 실패.
    - `browser.executablePath not found` → 구성된 경로가 유효하지 않음.
    - `browser.cdpUrl must be http(s) or ws(s)` → 구성된 CDP URL이 `file:` 또는 `ftp:` 같은 지원되지 않는 스킴을 사용함.
    - `browser.cdpUrl has invalid port` → 구성된 CDP URL의 포트가 잘못되었거나 범위를 벗어남.
    - `Playwright is not available in this gateway build; '<feature>' is unsupported.` → 현재 Gateway 설치에 핵심 브라우저 런타임 의존성이 없음. OpenClaw를 재설치하거나 업데이트한 다음 Gateway를 다시 시작하세요. ARIA 스냅샷과 기본 페이지 스크린샷은 계속 작동할 수 있지만, 탐색, AI 스냅샷, CSS 선택자 요소 스크린샷, PDF 내보내기는 계속 사용할 수 없음.

  </Accordion>
  <Accordion title="Chrome MCP / existing-session 징후">
    - `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session이 아직 선택된 브라우저 데이터 디렉터리에 연결할 수 없음. 브라우저 검사 페이지를 열고 원격 디버깅을 활성화한 뒤, 브라우저를 열린 상태로 유지하고 첫 연결 프롬프트를 승인한 다음 다시 시도하세요. 로그인 상태가 필요하지 않다면 관리형 `openclaw` 프로필을 선호하세요.
    - `No Chrome tabs found for profile="user"` → Chrome MCP 연결 프로필에 열린 로컬 Chrome 탭이 없음.
    - `Remote CDP for profile "<name>" is not reachable` → 구성된 원격 CDP 엔드포인트에 Gateway 호스트에서 도달할 수 없음.
    - `Browser attachOnly is enabled ... not reachable` 또는 `Browser attachOnly is enabled and CDP websocket ... is not reachable` → 연결 전용 프로필에 도달 가능한 대상이 없거나, HTTP 엔드포인트가 응답했지만 CDP WebSocket을 열 수 없음.

  </Accordion>
  <Accordion title="요소 / 스크린샷 / 업로드 징후">
    - `fullPage is not supported for element screenshots` → 스크린샷 요청에서 `--full-page`를 `--ref` 또는 `--element`와 함께 사용함.
    - `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → Chrome MCP / `existing-session` 스크린샷 호출은 CSS `--element`가 아니라 페이지 캡처 또는 스냅샷 `--ref`를 사용해야 함.
    - `existing-session file uploads do not support element selectors; use ref/inputRef.` → Chrome MCP 업로드 훅에는 CSS 선택자가 아니라 스냅샷 refs가 필요함.
    - `existing-session file uploads currently support one file at a time.` → Chrome MCP 프로필에서는 호출당 업로드 하나만 보내세요.
    - `existing-session dialog handling does not support timeoutMs.` → Chrome MCP 프로필의 dialog 훅은 timeout 재정의를 지원하지 않음.
    - `existing-session type does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session 프로필의 `act:type`에는 `timeoutMs`를 생략하거나, 사용자 지정 timeout이 필요할 때 관리형/CDP 브라우저 프로필을 사용하세요.
    - `existing-session evaluate does not support timeoutMs overrides.` → `profile="user"` / Chrome MCP existing-session 프로필의 `act:evaluate`에는 `timeoutMs`를 생략하거나, 사용자 지정 timeout이 필요할 때 관리형/CDP 브라우저 프로필을 사용하세요.
    - `response body is not supported for existing-session profiles yet.` → `responsebody`에는 아직 관리형 브라우저 또는 원시 CDP 프로필이 필요함.
    - 연결 전용 또는 원격 CDP 프로필에서 오래된 viewport / dark-mode / locale / offline 재정의 → 전체 Gateway를 다시 시작하지 않고 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 상태를 해제하려면 `openclaw browser stop --browser-profile <name>`을 실행하세요.

  </Accordion>
</AccordionGroup>

관련 항목:

- [브라우저(OpenClaw 관리형)](/ko/tools/browser)
- [브라우저 문제 해결](/ko/tools/browser-linux-troubleshooting)

## 업그레이드 후 갑자기 무언가가 고장난 경우

업그레이드 후 발생하는 대부분의 손상은 구성 드리프트이거나 더 엄격한 기본값이 이제 적용되기 때문입니다.

<AccordionGroup>
  <Accordion title="1. 인증 및 URL 재정의 동작 변경">
    ```bash
    openclaw gateway status
    openclaw config get gateway.mode
    openclaw config get gateway.remote.url
    openclaw config get gateway.auth.mode
    ```

    확인할 항목:

    - `gateway.mode=remote`인 경우, 로컬 서비스는 정상이어도 CLI 호출이 원격을 대상으로 할 수 있음.
    - 명시적 `--url` 호출은 저장된 자격 증명으로 폴백하지 않음.

    일반적인 징후:

    - `gateway connect failed:` → 잘못된 URL 대상.
    - `unauthorized` → 엔드포인트에는 도달했지만 인증이 잘못됨.

  </Accordion>
  <Accordion title="2. 바인드 및 인증 보호 장치 강화">
    ```bash
    openclaw config get gateway.bind
    openclaw config get gateway.auth.mode
    openclaw config get gateway.auth.token
    openclaw gateway status
    openclaw logs --follow
    ```

    확인할 항목:

    - Non-loopback 바인드(`lan`, `tailnet`, `custom`)에는 유효한 Gateway 인증 경로가 필요함: 공유 토큰/비밀번호 인증 또는 올바르게 구성된 non-loopback `trusted-proxy` 배포.
    - `gateway.token` 같은 이전 키는 `gateway.auth.token`을 대체하지 않음.

    일반적인 징후:

    - `refusing to bind gateway ... without auth` → 유효한 Gateway 인증 경로 없이 non-loopback 바인드.
    - 런타임이 실행 중인데 `Connectivity probe: failed` → Gateway는 살아 있지만 현재 인증/URL로 접근할 수 없음.

  </Accordion>
  <Accordion title="3. 페어링 및 디바이스 ID 상태 변경">
    ```bash
    openclaw devices list
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    openclaw doctor
    ```

    확인할 항목:

    - 대시보드/nodes에 대한 보류 중인 디바이스 승인.
    - 정책 또는 ID 변경 후 보류 중인 DM 페어링 승인.

    일반적인 징후:

    - `device identity required` → 디바이스 인증이 충족되지 않음.
    - `pairing required` → 보낸 사람/디바이스가 승인되어야 함.

  </Accordion>
</AccordionGroup>

확인 후에도 서비스 구성과 런타임이 계속 불일치하면 동일한 프로필/상태 디렉터리에서 서비스 메타데이터를 다시 설치하세요.

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
