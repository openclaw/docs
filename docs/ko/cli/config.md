---
read_when:
    - 대화형 절차 없이 구성을 읽거나 편집하려고 합니다
sidebarTitle: Config
summary: '`openclaw config`에 대한 CLI 참조(get/set/patch/unset/file/schema/validate)'
title: 구성
x-i18n:
    generated_at: "2026-07-16T12:24:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 63be5cbac6c7db9c6b93ad690e5decab9f4ce7904e8b10f26a3b1e39e4729450
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json`의 비대화형 도우미: 경로별 값 가져오기/설정/패치/해제, 스키마 출력, 검증 또는 활성 파일 경로 출력. 하위 명령 없이 `openclaw config`을 실행하면 `openclaw configure`과 동일한 안내형 마법사가 열립니다.

<Note>
`OPENCLAW_NIX_MODE=1`인 경우 OpenClaw는 `openclaw.json`을 변경할 수 없는 것으로 취급합니다. 읽기 전용 명령(`config get`, `config file`, `config schema`, `config validate`)은 계속 작동하지만 구성 쓰기는 거부됩니다. 대신 설치용 Nix 소스를 편집하십시오. 공식 nix-openclaw 배포판의 경우 [nix-openclaw 빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하고 `programs.openclaw.config` 또는 `instances.<name>.config` 아래에 값을 설정하십시오.
</Note>

## 루트 옵션

<ParamField path="--section <section>" type="string">
  하위 명령 없이 `openclaw config`을 실행할 때 반복해서 지정할 수 있는 안내형 설정 섹션 필터입니다.
</ParamField>

안내형 섹션: `workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`.

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

### 경로

점 또는 대괄호 표기법을 사용합니다. zsh가 `[0]`을 글로브 확장하지 않도록 셸 예시에서는 대괄호 경로를 따옴표로 묶으십시오.

```bash
openclaw config get agents.defaults.workspace
openclaw config get 'agents.list[0].id'
openclaw config get agents.list
openclaw config set 'agents.list[1].tools.exec.node' "node-id-or-name"
```

### `config get`

민감 정보가 제거된 구성 스냅샷에서 값을 읽습니다(비밀은 절대 출력되지 않습니다). `--json`은 원시 값을 JSON으로 출력합니다. 그렇지 않으면 문자열/숫자/불리언은 서식 없이 출력되고 객체/배열은 서식이 적용된 JSON으로 출력됩니다.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

`OPENCLAW_CONFIG_PATH` 또는 기본 위치에서 확인된 활성 구성 파일 경로를 출력합니다. 이 경로는 심볼릭 링크가 아닌 일반 파일을 가리킵니다. [쓰기 안전성](#write-safety)을 참조하십시오.

### `config schema`

`openclaw.json`용으로 생성된 JSON 스키마를 stdout에 출력합니다.

<AccordionGroup>
  <Accordion title="포함 항목">
    - 현재 루트 구성 스키마와 편집기 도구용 루트 `$schema` 문자열 필드.
    - Control UI에서 사용하는 필드 `title` / `description` 문서 메타데이터.
    - 일치하는 필드 문서가 있을 때 중첩 객체, 와일드카드(`*`) 및 배열 항목(`[]`) 노드는 동일한 `title` / `description` 메타데이터를 상속합니다.
    - `anyOf` / `oneOf` / `allOf` 분기도 동일한 문서 메타데이터를 상속합니다.
    - 런타임 매니페스트를 로드할 수 있을 때 최선형 라이브 Plugin 및 채널 스키마 메타데이터.
    - 현재 구성이 유효하지 않은 경우에도 깔끔한 대체 스키마.

  </Accordion>
  <Accordion title="관련 런타임 RPC">
    `config.schema.lookup`은 얕은 스키마 노드(`title`, `description`, `type`, `enum`, `const`, 공통 범위), 일치하는 UI 힌트 메타데이터 및 직계 하위 항목 요약과 함께 정규화된 구성 경로 하나를 반환합니다. Control UI 또는 사용자 지정 클라이언트에서 경로 범위별 드릴다운에 사용하십시오.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Gateway를 시작하지 않고 현재 구성을 활성 스키마에 대해 검증합니다.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
이미 검증에 실패하고 있다면 `openclaw configure` 또는 `openclaw doctor --fix`으로 시작하십시오. `openclaw chat`은 잘못된 구성 보호 기능을 우회하지 않습니다.
</Note>

## 값

가능하면 값은 JSON5로 파싱되며, 그렇지 않으면 원시 문자열로 처리됩니다. 문자열 대체 없이 표준 JSON을 요구하려면 `--strict-json`을 사용하십시오. 이 경우 주석, 후행 쉼표 또는 따옴표 없는 키와 같은 JSON5 전용 구문은 거부됩니다. `--json`은 `config set`에서 `--strict-json`의 레거시 별칭입니다.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`은 터미널 형식의 텍스트 대신 원시 값을 JSON으로 출력합니다.

<Note>
객체 할당은 기본적으로 대상 경로를 대체합니다. 일반적으로 사용자가 추가한 항목을 보유하는 보호된 경로에서는 기존 항목을 제거할 수 있는 대체가 거부되며, 이 동작을 허용하려면 `--replace`을 전달해야 합니다: `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries`, `auth.profiles`.
</Note>

해당 맵에 항목을 추가할 때는 `--merge`을 사용하십시오.

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

제공한 값이 의도적으로 완전한 대상 값이 되어야 하는 경우에만 `--replace`을 사용하십시오.

## `config set` 모드

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
  <Tab title="제공자 빌더 모드">
    `secrets.providers.<alias>` 경로만 대상으로 합니다.

    ```bash
    openclaw config set secrets.providers.vault \
      --provider-source exec \
      --provider-command /usr/local/bin/openclaw-vault \
      --provider-arg read \
      --provider-arg openai/api-key \
      --provider-timeout-ms 5000
    ```

  </Tab>
  <Tab title="일괄 모드">
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
지원되지 않는 런타임 변경 가능 표면(예: `hooks.token`, `commands.ownerDisplaySecret`, Discord 스레드 바인딩 Webhook 토큰 및 WhatsApp 자격 증명 JSON)에서는 SecretRef 할당이 거부됩니다. [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참조하십시오.
</Warning>

일괄 파싱은 항상 일괄 페이로드(`--batch-json`/`--batch-file`)를 기준 정보로 사용하며, `--strict-json` / `--json`은 일괄 파싱 동작을 변경하지 않습니다.

JSON 경로/값 모드는 SecretRef 및 제공자에도 직접 사용할 수 있습니다.

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### 제공자 빌더 플래그

제공자 빌더 대상은 경로로 `secrets.providers.<alias>`을 사용해야 합니다.

<AccordionGroup>
  <Accordion title="공통 플래그">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="환경 제공자(--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (반복 가능)

  </Accordion>
  <Accordion title="파일 제공자(--provider-source file)">
    - `--provider-path <path>` (필수)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="실행 제공자(--provider-source exec)">
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

강화된 실행 제공자 예시:

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

## `config patch`

경로 기반 `config set` 명령을 여러 번 실행하는 대신 구성 형태의 JSON5 패치를 붙여넣거나 파이프로 전달합니다. 객체는 재귀적으로 병합되고, 배열과 스칼라 값은 대상을 대체하며, `null`은 대상 경로를 삭제합니다.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

원격 설정 스크립트에서는 stdin을 통해 패치를 파이프로 전달하십시오.

```bash
ssh user@gateway-host 'openclaw config patch --stdin --dry-run' < ./openclaw.patch.json5
ssh user@gateway-host 'openclaw config patch --stdin' < ./openclaw.patch.json5
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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
      },
    },
  },
}
```

객체 또는 배열 하나가 재귀적으로 패치되는 대신 제공된 값과 정확히 같아져야 할 때는 `--replace-path <path>`을 사용하십시오.

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run`은 쓰지 않고 스키마 및 SecretRef 확인 가능성 검사를 실행합니다. 실행 기반 SecretRef는 기본적으로 시험 실행 중 건너뜁니다. 시험 실행에서 제공자 명령을 의도적으로 실행하려면 `--allow-exec`을 추가하십시오.

## 시험 실행

`--dry-run`은 `openclaw.json`을 쓰지 않고 변경 사항을 검증합니다. `config set`, `config patch`, `config unset`에서 사용할 수 있습니다.

```bash
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
  <Accordion title="드라이런 동작">
    - 빌더 모드: 변경된 참조/프로바이더에 대해 SecretRef 해석 가능성 검사를 실행합니다.
    - JSON 모드(`--strict-json`, `--json` 또는 배치 모드): 스키마 검증과 SecretRef 해석 가능성 검사를 실행합니다.
    - 정책 검증은 변경 후 전체 구성을 대상으로 실행되므로, 상위 객체 쓰기(예: `hooks`을 객체로 설정)로 지원되지 않는 표면에 대한 검증을 우회할 수 없습니다.
    - 명령 부작용을 방지하기 위해 Exec SecretRef 검사는 기본적으로 건너뜁니다. 사용하려면 `--allow-exec`을 전달하십시오(프로바이더 명령이 실행될 수 있습니다). `--allow-exec`은 드라이런 전용이며 `--dry-run`이 없으면 오류가 발생합니다.

  </Accordion>
  <Accordion title="--dry-run --json 필드">
    - `ok`: 드라이런 통과 여부
    - `operations`: 평가한 할당 수
    - `checks`: 스키마/해석 가능성 검사 실행 여부
    - `checks.resolvabilityComplete`: 해석 가능성 검사가 완료될 때까지 실행되었는지 여부(Exec 참조를 건너뛰면 false)
    - `refsChecked`: 드라이런 중 실제로 해석된 참조 수
    - `skippedExecRefs`: `--allow-exec`이 설정되지 않아 건너뛴 Exec 참조 수
    - `errors`: `ok=false`일 때 구조화된 누락 경로, 스키마 또는 해석 가능성 실패 정보

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
      ref?: string, // 해석 가능성 오류에 포함됨
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
          "message": "오류: 환경 변수 \"MISSING_TEST_SECRET\"이 설정되지 않았습니다.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="드라이런이 실패하는 경우">
    - `config schema validation failed`: 변경 후 구성 형태가 유효하지 않습니다. 경로/값 또는 프로바이더/참조 객체 형태를 수정하십시오.
    - `Config policy validation failed: unsupported SecretRef usage`: 해당 자격 증명을 일반 텍스트/문자열 입력으로 되돌리십시오. SecretRef는 지원되는 표면에서만 사용하십시오.
    - `SecretRef assignment(s) could not be resolved`: 참조된 프로바이더/참조를 현재 해석할 수 없습니다(환경 변수 누락, 잘못된 파일 포인터, Exec 프로바이더 실패 또는 프로바이더/소스 불일치).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Exec 해석 가능성을 검증해야 하는 경우 `--allow-exec`을 사용하여 다시 실행하십시오.
    - 배치 모드에서는 실패한 항목을 수정하고 쓰기 전에 `--dry-run`을 다시 실행하십시오.

  </Accordion>
</AccordionGroup>

## 변경 사항 적용

`config set` / `config patch` / `config unset`이 성공할 때마다 CLI는 Gateway를 다시 시작해야 하는지 알 수 있도록 다음 세 가지 안내 중 하나를 출력합니다.

| 안내                                                | 의미                                |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | 변경된 경로에는 전체 재시작이 필요합니다. |
| `Change will apply without restarting the gateway.` | 핫 리로드가 변경 사항을 자동으로 반영합니다.  |
| `No gateway restart needed.`                        | 런타임과 관련된 변경 사항이 없습니다.      |

CLI는 모든 Plugin의 리로드 메타데이터가 로드되었는지 확인할 수 없으므로 `plugins.entries`(또는 그 하위 경로)에 쓰면 항상 재시작해야 합니다.

## 쓰기 안전성

`openclaw config set` 및 기타 OpenClaw 소유 구성 작성기는 디스크에 커밋하기 전에 변경 후 전체 구성을 검증합니다. 새 페이로드가 스키마 검증에 실패하거나 파괴적인 덮어쓰기로 보이면 활성 구성은 그대로 유지되고 거부된 페이로드는 그 옆에 `openclaw.json.rejected.*`으로 저장됩니다.

OpenClaw 소유 쓰기는 JSON5를 표준 JSON으로 다시 직렬화합니다. 소스에 주석이 있으면 작성기는 주석을 제거하기 직전에 경고합니다. 주석을 보존해야 한다면 직접 편집기를 사용하십시오.

<Warning>
활성 구성 경로는 일반 파일이어야 합니다. 심볼릭 링크된 `openclaw.json` 레이아웃에 대한 쓰기는 지원되지 않습니다. 대신 `OPENCLAW_CONFIG_PATH`을 사용하여 실제 파일을 직접 가리키십시오.
</Warning>

작은 편집에는 CLI 쓰기를 우선 사용하십시오.

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

쓰기가 거부되면 저장된 페이로드를 검사하고 전체 구성 형태를 수정하십시오.

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

편집기를 사용한 직접 쓰기도 허용되지만, 실행 중인 Gateway는 검증이 완료될 때까지 이를 신뢰할 수 없는 것으로 취급합니다. 유효하지 않은 직접 편집은 시작에 실패하거나 핫 리로드에서 건너뜁니다. Gateway는 `openclaw.json`을 다시 작성하지 않습니다. 접두사가 붙거나 덮어써진 구성을 복구하거나 마지막으로 정상임이 확인된 복사본을 복원하려면 `openclaw doctor --fix`을 실행하십시오. [Gateway 문제 해결](/ko/gateway/troubleshooting#gateway-rejected-invalid-config)을 참조하십시오.

전체 파일 복구는 Doctor 복구에만 사용됩니다. Plugin 스키마 변경 또는 `minHostVersion` 불일치는 모델, 프로바이더, 인증 프로필, 채널, Gateway 노출, 도구, 메모리, 브라우저 또는 Cron 구성과 같은 관련 없는 사용자 설정을 롤백하는 대신 명확한 오류를 유지합니다.

## 복구 루프

`openclaw config validate`이 통과한 후 로컬 TUI를 사용하여 내장 에이전트가 활성 구성을 문서와 비교하게 하고, 같은 터미널에서 각 변경 사항을 검증하십시오.

```bash
openclaw chat
```

TUI 내에서 선행 `!`은 세션당 한 번 표시되는 확인 프롬프트를 거친 후 리터럴 로컬 셸 명령을 실행합니다.

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

<Steps>
  <Step title="문서와 비교">
    에이전트에게 현재 구성을 관련 문서 페이지와 비교하고 가장 작은 수정 사항을 제안하도록 요청하십시오.
  </Step>
  <Step title="대상별 편집 적용">
    `openclaw config set` 또는 `openclaw configure`을 사용하여 대상별 편집을 적용하십시오.
  </Step>
  <Step title="다시 검증">
    각 변경 후 `openclaw config validate`을 다시 실행하십시오.
  </Step>
  <Step title="런타임 문제에 Doctor 사용">
    검증은 통과하지만 런타임이 여전히 정상적이지 않다면 마이그레이션 및 복구 도움을 위해 `openclaw doctor` 또는 `openclaw doctor --fix`을 실행하십시오.
  </Step>
</Steps>

## 관련 문서

- [CLI 참조](/ko/cli)
- [구성](/ko/gateway/configuration)
