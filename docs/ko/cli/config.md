---
read_when:
    - 구성을 비대화식으로 읽거나 편집하려는 경우
sidebarTitle: Config
summary: '`openclaw config`에 대한 CLI 참조 (get/set/patch/unset/file/schema/validate)'
title: 구성
x-i18n:
    generated_at: "2026-06-27T17:16:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d658c0edbf900565c4645c1d24a9f3e092a3d8a4fec85f7fc7e3989550d13197
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json`의 비대화형 편집을 위한 구성 헬퍼: 경로별로 값을 get/set/patch/unset/file/schema/validate하고 활성 구성 파일을 출력합니다. 하위 명령 없이 실행하면 구성 마법사를 엽니다(`openclaw configure`와 동일).

<Note>
`OPENCLAW_NIX_MODE=1`일 때 OpenClaw는 `openclaw.json`을 불변으로 취급합니다. `config get`, `config file`, `config schema`, `config validate` 같은 읽기 전용 명령은 계속 작동하지만, 구성 쓰기 명령은 거부됩니다. 대신 에이전트는 설치의 Nix 소스를 편집해야 합니다. 자사 nix-openclaw 배포판의 경우 [nix-openclaw 빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하고 `programs.openclaw.config` 또는 `instances.<name>.config` 아래에 값을 설정하세요.
</Note>

## 루트 옵션

<ParamField path="--section <section>" type="string">
  하위 명령 없이 `openclaw config`를 실행할 때 반복 가능한 안내 설정 섹션 필터입니다.
</ParamField>

지원되는 안내 섹션: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

## 예시

```bash
openclaw config file
openclaw config --section model
openclaw config --section gateway --section daemon
openclaw config schema
openclaw config get browser.executablePath
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
openclaw config set agents.defaults.heartbeat.every "2h"
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set secrets.providers.vaultfile --provider-source file --provider-path /etc/openclaw/secrets.json --provider-mode json
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config unset plugins.entries.brave.config.webSearch.apiKey
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config validate
openclaw config validate --json
```

### `config schema`

`openclaw.json`에 대해 생성된 JSON schema를 JSON으로 stdout에 출력합니다.

<AccordionGroup>
  <Accordion title="포함 내용">
    - 현재 루트 구성 스키마와 편집기 도구용 루트 `$schema` 문자열 필드.
    - Control UI에서 사용하는 필드 `title` 및 `description` 문서 메타데이터.
    - 중첩 객체, 와일드카드(`*`), 배열 항목(`[]`) 노드는 일치하는 필드 문서가 있을 때 동일한 `title` / `description` 메타데이터를 상속합니다.
    - `anyOf` / `oneOf` / `allOf` 분기도 일치하는 필드 문서가 있을 때 동일한 문서 메타데이터를 상속합니다.
    - 런타임 매니페스트를 로드할 수 있을 때 최선의 라이브 Plugin + 채널 스키마 메타데이터.
    - 현재 구성이 유효하지 않은 경우에도 깔끔한 대체 스키마.

  </Accordion>
  <Accordion title="관련 런타임 RPC">
    `config.schema.lookup`은 얕은 스키마 노드(`title`, `description`, `type`, `enum`, `const`, 공통 범위), 일치하는 UI 힌트 메타데이터, 즉시 하위 요약이 포함된 정규화된 구성 경로 하나를 반환합니다. Control UI 또는 사용자 지정 클라이언트에서 경로 범위 드릴다운에 사용하세요.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
```

다른 도구로 검사하거나 검증하려면 파일로 파이프하세요.

```bash
openclaw config schema > openclaw.schema.json
```

### 경로

경로는 점 표기법 또는 대괄호 표기법을 사용합니다. zsh 같은 셸이 OpenClaw가 경로를 받기 전에 `[0]`을 glob으로 확장하지 않도록 셸 예시에서는 대괄호 표기법 경로를 따옴표로 감싸세요.

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
```

특정 에이전트를 대상으로 지정하려면 에이전트 목록 인덱스를 사용하세요.

```bash
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

## 값

값은 가능한 경우 JSON5로 파싱되며, 그렇지 않으면 문자열로 처리됩니다. JSON5 파싱을 요구하려면 `--strict-json`을 사용하세요. `--json`은 레거시 별칭으로 계속 지원됩니다.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`은 터미널 형식 텍스트 대신 원시 값을 JSON으로 출력합니다.

<Note>
객체 할당은 기본적으로 대상 경로를 대체합니다. `agents.defaults.models`, `models.providers`, `models.providers.<id>.models`, `plugins.entries`, `auth.profiles`처럼 사용자가 추가한 항목을 흔히 보관하는 보호된 맵/목록 경로는 `--replace`를 전달하지 않는 한 기존 항목을 제거하는 대체를 거부합니다.
</Note>

해당 맵에 항목을 추가할 때는 `--merge`를 사용하세요.

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

제공한 값이 완전한 대상 값이 되도록 의도한 경우에만 `--replace`를 사용하세요.

## `config set` 모드

`openclaw config set`은 네 가지 할당 방식을 지원합니다.

<Tabs>
  <Tab title="값 모드">
    ```bash
    openclaw config set <path> <value>
    ```
  </Tab>
  <Tab title="SecretRef 빌더 모드">
    ```bash
    openclaw config set channels.discord.token \
      --ref-provider default \
      --ref-source env \
      --ref-id DISCORD_BOT_TOKEN
    ```
  </Tab>
  <Tab title="Provider 빌더 모드">
    Provider 빌더 모드는 `secrets.providers.<alias>` 경로만 대상으로 합니다.

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="배치 모드">
    ```bash
    openclaw config set --batch-json '[
      {
        "path": "secrets.providers.default",
        "provider": { "source": "env" }
      },
      {
        "path": "channels.discord.token",
        "ref": { "source": "env", "provider": "default", "id": "DISCORD_BOT_TOKEN" }
      }
    ]'
    ```

    ```bash
    openclaw config set --batch-file ./config-set.batch.json --dry-run
    ```

  </Tab>
</Tabs>

<Warning>
SecretRef 할당은 지원되지 않는 런타임 변경 가능 표면(예: `hooks.token`, `commands.ownerDisplaySecret`, Discord 스레드 바인딩 Webhook 토큰, WhatsApp 자격 증명 JSON)에서 거부됩니다. [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참고하세요.
</Warning>

배치 파싱은 항상 배치 페이로드(`--batch-json`/`--batch-file`)를 단일 진실 공급원으로 사용합니다. `--strict-json` / `--json`은 배치 파싱 동작을 변경하지 않습니다.

## `config patch`

여러 경로 기반 `config set` 명령을 실행하는 대신 구성 형태의 패치를 붙여넣거나 파이프하려면 `config patch`를 사용하세요. 입력은 JSON5 객체입니다. 객체는 재귀적으로 병합되고, 배열과 스칼라 값은 대상 값을 대체하며, `null`은 대상 경로를 삭제합니다.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

stdin을 통해 패치를 파이프할 수도 있으며, 이는 원격 설정 스크립트에 유용합니다.

```bash
ssh openclaw-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh openclaw-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
```

패치 예시:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

객체나 배열 하나가 재귀적으로 패치되는 대신 제공된 값과 정확히 같아야 할 때는 `--replace-path <path>`를 사용하세요.

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run`은 쓰기 없이 스키마 및 SecretRef 해석 가능성 검사를 실행합니다. exec 기반 SecretRefs는 dry-run 중 기본적으로 건너뜁니다. dry-run에서 제공자 명령을 의도적으로 실행하려면 `--allow-exec`을 추가하세요.

JSON 경로/값 모드는 SecretRefs와 providers 모두에 대해 계속 지원됩니다.

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

## Provider 빌더 플래그

Provider 빌더 대상은 경로로 `secrets.providers.<alias>`를 사용해야 합니다.

<AccordionGroup>
  <Accordion title="공통 플래그">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="Env provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (반복 가능)

  </Accordion>
  <Accordion title="File provider (--provider-source file)">
    - `--provider-path <path>` (필수)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="Exec provider (--provider-source exec)">
    - `--provider-command <path>` (필수)
    - `--provider-arg <arg>` (반복 가능)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (반복 가능)
    - `--provider-pass-env <ENV_VAR>` (반복 가능)
    - `--provider-trusted-dir <path>` (반복 가능)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

강화된 exec provider 예시:

```bash
openclaw config set secrets.providers.vault \
  --provider-source exec \
  --provider-command /usr/local/bin/openclaw-vault \
  --provider-arg read \
  --provider-arg openai/api-key \
  --provider-json-only \
  --provider-pass-env VAULT_TOKEN \
  --provider-trusted-dir /usr/local/bin \
  --provider-timeout-ms 5000
```

## Dry run

`openclaw.json`에 쓰지 않고 변경 사항을 검증하려면 `--dry-run`을 사용하세요.

```bash
openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run

openclaw config set channels.discord.token \
  --ref-provider default \
  --ref-source env \
  --ref-id DISCORD_BOT_TOKEN \
  --dry-run \
  --json

openclaw config set channels.discord.token \
  --ref-provider vault \
  --ref-source exec \
  --ref-id discord/token \
  --dry-run \
  --allow-exec
```

<AccordionGroup>
  <Accordion title="Dry-run 동작">
    - 빌더 모드: 변경된 refs/providers에 대해 SecretRef 해석 가능성 검사를 실행합니다.
    - JSON 모드(`--strict-json`, `--json` 또는 배치 모드): 스키마 검증과 SecretRef 해석 가능성 검사를 실행합니다.
    - 알려진 지원되지 않는 SecretRef 대상 표면에 대해서도 정책 검증이 실행됩니다.
    - 정책 검사는 변경 후 전체 구성을 평가하므로, 부모 객체 쓰기(예: `hooks`를 객체로 설정)는 지원되지 않는 표면 검증을 우회할 수 없습니다.
    - Exec SecretRef 검사는 명령 부작용을 피하기 위해 dry-run 중 기본적으로 건너뜁니다.
    - exec SecretRef 검사에 옵트인하려면 `--dry-run`과 함께 `--allow-exec`을 사용하세요(제공자 명령이 실행될 수 있음).
    - `--allow-exec`은 dry-run 전용이며 `--dry-run` 없이 사용하면 오류가 발생합니다.

  </Accordion>
  <Accordion title="--dry-run --json 필드">
    `--dry-run --json`은 기계가 읽을 수 있는 보고서를 출력합니다:

    - `ok`: dry-run 통과 여부
    - `operations`: 평가된 할당 수
    - `checks`: 스키마/해결 가능성 검사가 실행되었는지 여부
    - `checks.resolvabilityComplete`: 해결 가능성 검사가 완료까지 실행되었는지 여부(exec ref를 건너뛰면 false)
    - `refsChecked`: dry-run 중 실제로 해결된 ref 수
    - `skippedExecRefs`: `--allow-exec`가 설정되지 않아 건너뛴 exec ref 수
    - `errors`: `ok=false`일 때 구조화된 누락 경로, 스키마 또는 해결 가능성 실패

  </Accordion>
</AccordionGroup>

### JSON 출력 형태

```json5
{
  ok: boolean,
  operations: number,
  configPath: string,
  inputModes: ["value" | "json" | "builder" | "unset", ...],
  checks: {
    schema: boolean,
    resolvability: boolean,
    resolvabilityComplete: boolean,
  },
  refsChecked: number,
  skippedExecRefs: number,
  errors?: [
    {
      kind: "missing-path" | "schema" | "resolvability",
      message: string,
      ref?: string, // 해결 가능성 오류에 있을 때 제공됨
    },
  ],
}
```

<Tabs>
  <Tab title="성공 예시">
    ```json
    {
      "ok": true,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0
    }
    ```
  </Tab>
  <Tab title="실패 예시">
    ```json
    {
      "ok": false,
      "operations": 1,
      "configPath": "~/.openclaw/openclaw.json",
      "inputModes": ["builder"],
      "checks": {
        "schema": false,
        "resolvability": true,
        "resolvabilityComplete": true
      },
      "refsChecked": 1,
      "skippedExecRefs": 0,
      "errors": [
        {
          "kind": "resolvability",
          "message": "Error: Environment variable \"MISSING_TEST_SECRET\" is not set.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="dry-run이 실패하는 경우">
    - `config schema validation failed`: 변경 후 config 형태가 유효하지 않습니다. path/value 또는 provider/ref 객체 형태를 수정하세요.
    - `Config policy validation failed: unsupported SecretRef usage`: 해당 자격 증명을 일반 텍스트/문자열 입력으로 되돌리고, SecretRef는 지원되는 표면에서만 유지하세요.
    - `SecretRef assignment(s) could not be resolved`: 참조된 provider/ref를 현재 해결할 수 없습니다(누락된 env var, 잘못된 file 포인터, exec provider 실패 또는 provider/source 불일치).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: dry-run이 exec ref를 건너뛰었습니다. exec 해결 가능성 검증이 필요하면 `--allow-exec`로 다시 실행하세요.
    - batch mode의 경우 실패한 항목을 수정하고 쓰기 전에 `--dry-run`을 다시 실행하세요.

  </Accordion>
</AccordionGroup>

## 쓰기 안전성

`openclaw config set` 및 기타 OpenClaw 소유 config 작성기는 디스크에 커밋하기 전에 변경 후 전체 config를 검증합니다. 새 페이로드가 스키마 검증에 실패하거나 파괴적인 덮어쓰기처럼 보이면 활성 config는 그대로 두고 거부된 페이로드를 `openclaw.json.rejected.*`로 그 옆에 저장합니다.

<Warning>
활성 config 경로는 일반 파일이어야 합니다. 심볼릭 링크된 `openclaw.json` 레이아웃은 쓰기에 지원되지 않습니다. 대신 `OPENCLAW_CONFIG_PATH`를 사용해 실제 파일을 직접 가리키세요.
</Warning>

작은 편집에는 CLI 쓰기를 선호하세요.

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

쓰기가 거부되면 저장된 페이로드를 검사하고 전체 config 형태를 수정하세요.

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

직접 에디터로 쓰는 것은 여전히 허용되지만, 실행 중인 Gateway는 검증될 때까지 이를 신뢰할 수 없는 것으로 취급합니다. 유효하지 않은 직접 편집은 시작에 실패하거나 hot reload에서 건너뜁니다. Gateway는 `openclaw.json`을 다시 쓰지 않습니다. 접두사가 붙었거나 덮어써진 config를 복구하거나 마지막으로 알려진 양호한 복사본을 복원하려면 `openclaw doctor --fix`를 실행하세요. [Gateway 문제 해결](/ko/gateway/troubleshooting#gateway-rejected-invalid-config)을 참조하세요.

전체 파일 복구는 doctor 복구용으로만 예약되어 있습니다. Plugin 스키마 변경 또는 `minHostVersion` 불일치는 모델, provider, auth profile, 채널, gateway 노출, 도구, memory, 브라우저 또는 cron config 같은 관련 없는 사용자 설정을 롤백하는 대신 명확하게 드러납니다.

## 하위 명령

- `config file`: 활성 config 파일 경로를 출력합니다(`OPENCLAW_CONFIG_PATH` 또는 기본 위치에서 확인됨). 경로는 심볼릭 링크가 아니라 일반 파일을 가리켜야 합니다.

편집 후 gateway를 다시 시작하세요.

## 검증

gateway를 시작하지 않고 현재 config를 활성 스키마에 대해 검증합니다.

```bash
openclaw config validate
openclaw config validate --json
```

`openclaw config validate`가 통과한 후에는 같은 터미널에서 각 변경 사항을 검증하는 동안 로컬 TUI를 사용해 내장 agent가 활성 config를 문서와 비교하도록 할 수 있습니다.

<Note>
검증이 이미 실패하는 경우 `openclaw configure` 또는 `openclaw doctor --fix`로 시작하세요. `openclaw chat`은 invalid-config guard를 우회하지 않습니다.
</Note>

```bash
openclaw chat
```

그런 다음 TUI 안에서:

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

일반적인 복구 루프:

<Steps>
  <Step title="문서와 비교">
    agent에게 현재 config를 관련 문서 페이지와 비교하고 가장 작은 수정을 제안하도록 요청하세요.
  </Step>
  <Step title="대상 편집 적용">
    `openclaw config set` 또는 `openclaw configure`로 대상 편집을 적용하세요.
  </Step>
  <Step title="다시 검증">
    각 변경 후 `openclaw config validate`를 다시 실행하세요.
  </Step>
  <Step title="런타임 문제에는 doctor 사용">
    검증은 통과하지만 runtime이 여전히 정상적이지 않다면, 마이그레이션 및 복구 도움말을 위해 `openclaw doctor` 또는 `openclaw doctor --fix`를 실행하세요.
  </Step>
</Steps>

## 관련 항목

- [CLI 참조](/ko/cli)
- [구성](/ko/gateway/configuration)
