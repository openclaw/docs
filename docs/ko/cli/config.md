---
read_when:
    - 대화형 절차 없이 구성을 읽거나 편집하려는 경우
sidebarTitle: Config
summary: '`openclaw config`의 CLI 참조(get/set/patch/unset/file/schema/validate)'
title: 구성
x-i18n:
    generated_at: "2026-07-12T15:02:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1a9531407b2314d1a6bc05a87eb7efb6c37a847378b150125693f4d59733a2e9
    source_path: cli/config.md
    workflow: 16
---

`openclaw.json`을 위한 비대화형 도우미입니다. 경로를 기준으로 값을 가져오거나 설정, 패치, 설정 해제하고, 스키마를 출력하거나 검증하며, 활성 파일 경로를 출력합니다. 하위 명령 없이 `openclaw config`를 실행하면 `openclaw configure`와 동일한 안내형 마법사가 열립니다.

<Note>
`OPENCLAW_NIX_MODE=1`이면 OpenClaw는 `openclaw.json`을 변경할 수 없는 것으로 취급합니다. 읽기 전용 명령(`config get`, `config file`, `config schema`, `config validate`)은 계속 작동하지만, 구성 쓰기 명령은 거부됩니다. 대신 설치의 Nix 소스를 편집하십시오. 공식 nix-openclaw 배포판의 경우 [nix-openclaw 빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하고 `programs.openclaw.config` 또는 `instances.<name>.config` 아래에 값을 설정하십시오.
</Note>

## 루트 옵션

<ParamField path="--section <section>" type="string">
  하위 명령 없이 `openclaw config`를 실행할 때 반복 지정할 수 있는 안내형 설정 섹션 필터입니다.
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

마스킹된 구성 스냅샷에서 값을 읽습니다(비밀 정보는 절대 출력하지 않습니다). `--json`은 원시 값을 JSON으로 출력합니다. 그렇지 않으면 문자열, 숫자, 불리언은 그대로 출력하고 객체와 배열은 서식이 적용된 JSON으로 출력합니다.

```bash
openclaw config get browser.executablePath
openclaw config get agents.defaults.model --json
```

### `config file`

`OPENCLAW_CONFIG_PATH` 또는 기본 위치에서 확인된 활성 구성 파일 경로를 출력합니다. 이 경로는 심볼릭 링크가 아닌 일반 파일을 가리킵니다. [쓰기 안전성](#write-safety)을 참조하십시오.

### `config schema`

`openclaw.json`용으로 생성된 JSON 스키마를 표준 출력에 출력합니다.

<AccordionGroup>
  <Accordion title="포함되는 내용">
    - 현재 루트 구성 스키마와 편집기 도구를 위한 루트 `$schema` 문자열 필드입니다.
    - Control UI에서 사용하는 필드 `title` / `description` 문서 메타데이터입니다.
    - 일치하는 필드 문서가 있으면 중첩 객체, 와일드카드(`*`), 배열 항목(`[]`) Node가 동일한 `title` / `description` 메타데이터를 상속합니다.
    - `anyOf` / `oneOf` / `allOf` 분기도 동일한 문서 메타데이터를 상속합니다.
    - 런타임 매니페스트를 불러올 수 있는 경우 최선형 방식으로 제공되는 실시간 Plugin 및 채널 스키마 메타데이터입니다.
    - 현재 구성이 유효하지 않은 경우에도 제공되는 깔끔한 대체 스키마입니다.

  </Accordion>
  <Accordion title="관련 런타임 RPC">
    `config.schema.lookup`은 얕은 스키마 Node(`title`, `description`, `type`, `enum`, `const`, 공통 경계값), 일치하는 UI 힌트 메타데이터, 직계 자식 요약과 함께 정규화된 구성 경로 하나를 반환합니다. Control UI 또는 사용자 지정 클라이언트에서 경로 범위의 상세 탐색에 사용하십시오.
  </Accordion>
</AccordionGroup>

```bash
openclaw config schema
openclaw config schema > openclaw.schema.json
```

### `config validate`

Gateway를 시작하지 않고 현재 구성을 활성 스키마에 따라 검증합니다.

```bash
openclaw config validate
openclaw config validate --json
```

<Note>
검증이 이미 실패하고 있다면 `openclaw configure` 또는 `openclaw doctor --fix`로 시작하십시오. `openclaw chat`은 유효하지 않은 구성 보호 장치를 우회하지 않습니다.
</Note>

## 값

가능하면 값을 JSON5로 구문 분석하고, 그렇지 않으면 원시 문자열로 취급합니다. 문자열 대체 없이 표준 JSON을 요구하려면 `--strict-json`을 사용하십시오. 이 경우 주석, 후행 쉼표, 따옴표 없는 키와 같은 JSON5 전용 구문은 거부됩니다. `--json`은 `config set`에서 `--strict-json`의 레거시 별칭입니다.

```bash
openclaw config set agents.defaults.heartbeat.every "0m"
openclaw config set gateway.port 19001 --strict-json
openclaw config set channels.whatsapp.groups '["*"]' --strict-json
```

`config get <path> --json`은 터미널용으로 서식이 적용된 텍스트 대신 원시 값을 JSON으로 출력합니다.

<Note>
객체 할당은 기본적으로 대상 경로를 대체합니다. 일반적으로 사용자가 추가한 항목을 보관하는 보호 경로는 `--replace`를 전달하지 않는 한 기존 항목을 제거하는 대체를 거부합니다. 해당 경로는 `agents.defaults.models`, `agents.list`, `models.providers`, `models.providers.<id>`, `models.providers.<id>.models`, `plugins.entries`, `auth.profiles`입니다.
</Note>

이러한 맵에 항목을 추가할 때는 `--merge`를 사용하십시오.

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
openclaw config set models.providers.ollama.models '[{"id":"llama3.2","name":"Llama 3.2"}]' --strict-json --merge
```

제공된 값이 의도적으로 전체 대상 값이 되어야 하는 경우에만 `--replace`를 사용하십시오.

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
  <Tab title="Provider 빌더 모드">
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
  <Tab title="일괄 처리 모드">
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
지원되지 않는 런타임 변경 가능 영역(예: `hooks.token`, `commands.ownerDisplaySecret`, Discord 스레드 바인딩 Webhook 토큰, WhatsApp 자격 증명 JSON)에서는 SecretRef 할당이 거부됩니다. [SecretRef 자격 증명 영역](/ko/reference/secretref-credential-surface)을 참조하십시오.
</Warning>

일괄 구문 분석은 항상 일괄 페이로드(`--batch-json`/`--batch-file`)를 정보의 기준으로 사용합니다. `--strict-json` / `--json`은 일괄 구문 분석 동작을 변경하지 않습니다.

JSON 경로/값 모드도 SecretRef와 Provider에 직접 사용할 수 있습니다.

```bash
openclaw config set channels.discord.token \
  '{"source":"env","provider":"default","id":"DISCORD_BOT_TOKEN"}' \
  --strict-json

openclaw config set secrets.providers.vaultfile \
  '{"source":"file","path":"/etc/openclaw/secrets.json","mode":"json"}' \
  --strict-json
```

### Provider 빌더 플래그

Provider 빌더 대상은 경로로 `secrets.providers.<alias>`를 사용해야 합니다.

<AccordionGroup>
  <Accordion title="공통 플래그">
    - `--provider-source <env|file|exec>`
    - `--provider-timeout-ms <ms>` (`file`, `exec`)

  </Accordion>
  <Accordion title="환경 Provider (--provider-source env)">
    - `--provider-allowlist <ENV_VAR>` (반복 지정 가능)

  </Accordion>
  <Accordion title="파일 Provider (--provider-source file)">
    - `--provider-path <path>` (필수)
    - `--provider-mode <singleValue|json>`
    - `--provider-max-bytes <bytes>`
    - `--provider-allow-insecure-path`

  </Accordion>
  <Accordion title="실행 Provider (--provider-source exec)">
    - `--provider-command <path>` (필수)
    - `--provider-arg <arg>` (반복 지정 가능)
    - `--provider-no-output-timeout-ms <ms>`
    - `--provider-max-output-bytes <bytes>`
    - `--provider-json-only`
    - `--provider-env <KEY=VALUE>` (반복 지정 가능)
    - `--provider-pass-env <ENV_VAR>` (반복 지정 가능)
    - `--provider-trusted-dir <path>` (반복 지정 가능)
    - `--provider-allow-insecure-path`
    - `--provider-allow-symlink-command`

  </Accordion>
</AccordionGroup>

강화된 실행 Provider 예시:

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

여러 경로 기반 `config set` 명령을 실행하는 대신 구성 형태의 JSON5 패치를 붙여 넣거나 파이프로 전달합니다. 객체는 재귀적으로 병합되고, 배열과 스칼라 값은 대상을 대체하며, `null`은 대상 경로를 삭제합니다.

```bash
openclaw config patch --file ./openclaw.patch.json5 --dry-run
openclaw config patch --file ./openclaw.patch.json5
```

원격 설정 스크립트에서는 표준 입력을 통해 패치를 파이프로 전달하십시오.

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

객체나 배열 하나가 재귀적으로 패치되지 않고 제공된 정확한 값이 되어야 하는 경우 `--replace-path <path>`를 사용하십시오.

```bash
openclaw config patch --file ./discord.patch.json5 --replace-path 'channels.discord.guilds["123"].channels'
```

`--dry-run`은 파일에 쓰지 않고 스키마와 SecretRef 확인 가능성을 검사합니다. 실행 기반 SecretRef는 기본적으로 드라이런 중에 건너뜁니다. 드라이런에서 의도적으로 Provider 명령을 실행하려면 `--allow-exec`을 추가하십시오.

## 드라이런

`--dry-run`은 `openclaw.json`에 쓰지 않고 변경 사항을 검증합니다. `config set`, `config patch`, `config unset`에서 사용할 수 있습니다.

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
    - 빌더 모드: 변경된 참조/제공자에 대해 SecretRef 해석 가능 여부 검사를 실행합니다.
    - JSON 모드(`--strict-json`, `--json` 또는 배치 모드): 스키마 검증과 SecretRef 해석 가능 여부 검사를 실행합니다.
    - 정책 검증은 변경 후의 전체 구성을 대상으로 실행되므로, 상위 객체 쓰기(예: `hooks`를 객체로 설정)로 지원되지 않는 표면 검증을 우회할 수 없습니다.
    - 명령 부작용을 방지하기 위해 Exec SecretRef 검사는 기본적으로 건너뜁니다. 사용하려면 `--allow-exec`를 전달하십시오(이 경우 제공자 명령이 실행될 수 있습니다). `--allow-exec`는 드라이런에서만 사용할 수 있으며 `--dry-run` 없이 사용하면 오류가 발생합니다.

  </Accordion>
  <Accordion title="--dry-run --json 필드">
    - `ok`: 드라이런 통과 여부
    - `operations`: 평가된 할당 수
    - `checks`: 스키마/해석 가능 여부 검사의 실행 여부
    - `checks.resolvabilityComplete`: 해석 가능 여부 검사가 완료될 때까지 실행되었는지 여부(Exec 참조를 건너뛴 경우 false)
    - `refsChecked`: 드라이런 중 실제로 해석된 참조 수
    - `skippedExecRefs`: `--allow-exec`가 설정되지 않아 건너뛴 Exec 참조 수
    - `errors`: `ok=false`일 때 구조화된 누락 경로, 스키마 또는 해석 가능 여부 실패 정보

  </Accordion>
</AccordionGroup>

### JSON 출력 구조

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
      ref?: string, // 해석 가능 여부 오류에 존재함
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
          "message": "오류: 환경 변수 \"MISSING_TEST_SECRET\"가 설정되지 않았습니다.",
          "ref": "env:default:MISSING_TEST_SECRET"
        }
      ]
    }
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="드라이런이 실패하는 경우">
    - `config schema validation failed`: 변경 후 구성 구조가 유효하지 않습니다. 경로/값 또는 제공자/참조 객체 구조를 수정하십시오.
    - `Config policy validation failed: unsupported SecretRef usage`: 해당 자격 증명을 일반 텍스트/문자열 입력으로 되돌리십시오. SecretRef는 지원되는 표면에서만 사용하십시오.
    - `SecretRef assignment(s) could not be resolved`: 참조된 제공자/참조를 현재 해석할 수 없습니다(환경 변수 누락, 잘못된 파일 포인터, Exec 제공자 실패 또는 제공자/소스 불일치).
    - `Dry run note: skipped <n> exec SecretRef resolvability check(s)`: Exec 해석 가능 여부 검증이 필요하면 `--allow-exec`를 사용하여 다시 실행하십시오.
    - 배치 모드에서는 실패한 항목을 수정하고 쓰기 전에 `--dry-run`을 다시 실행하십시오.

  </Accordion>
</AccordionGroup>

## 변경 사항 적용

`config set` / `config patch` / `config unset`이 성공할 때마다 CLI는 Gateway 재시작이 필요한지 알 수 있도록 다음 세 가지 안내 중 하나를 출력합니다.

| 안내                                                | 의미                                |
| --------------------------------------------------- | -------------------------------------- |
| `Restart the gateway to apply.`                     | 변경된 경로를 적용하려면 전체 재시작이 필요합니다. |
| `Change will apply without restarting the gateway.` | 핫 리로드가 변경 사항을 자동으로 반영합니다.  |
| `No gateway restart needed.`                        | 런타임과 관련된 변경 사항이 없습니다.      |

CLI는 모든 Plugin의 리로드 메타데이터가 로드되었는지 확인할 수 없으므로 `plugins.entries`(또는 그 하위 경로)에 쓰면 항상 재시작이 필요합니다.

## 쓰기 안전성

`openclaw config set` 및 기타 OpenClaw 소유 구성 작성기는 디스크에 커밋하기 전에 변경 후의 전체 구성을 검증합니다. 새 페이로드가 스키마 검증에 실패하거나 파괴적인 덮어쓰기로 판단되면 활성 구성은 그대로 유지되고, 거부된 페이로드는 옆에 `openclaw.json.rejected.*`로 저장됩니다.

<Warning>
활성 구성 경로는 일반 파일이어야 합니다. 심볼릭 링크로 연결된 `openclaw.json` 레이아웃에는 쓰기가 지원되지 않습니다. 대신 `OPENCLAW_CONFIG_PATH`가 실제 파일을 직접 가리키도록 설정하십시오.
</Warning>

작은 편집에는 CLI 쓰기를 사용하는 것이 좋습니다.

```bash
openclaw config set gateway.reload.mode hybrid --dry-run
openclaw config set gateway.reload.mode hybrid
openclaw config validate
```

쓰기가 거부되면 저장된 페이로드를 검사하고 전체 구성 구조를 수정하십시오.

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".rejected.* 2>/dev/null | head
openclaw config validate
```

편집기로 직접 쓰는 것도 허용되지만, 실행 중인 Gateway는 검증되기 전까지 이를 신뢰할 수 없는 것으로 취급합니다. 유효하지 않은 직접 편집은 시작에 실패하게 하거나 핫 리로드에서 건너뛰며, Gateway는 `openclaw.json`을 다시 쓰지 않습니다. 접두사가 붙거나 덮어써진 구성을 복구하거나 마지막으로 정상 확인된 복사본을 복원하려면 `openclaw doctor --fix`를 실행하십시오. [Gateway 문제 해결](/ko/gateway/troubleshooting#gateway-rejected-invalid-config)을 참조하십시오.

전체 파일 복구는 Doctor 복구용으로만 사용됩니다. Plugin 스키마 변경이나 `minHostVersion` 불일치는 모델, 제공자, 인증 프로필, 채널, Gateway 노출, 도구, 메모리, 브라우저 또는 Cron 구성과 같은 관련 없는 사용자 설정을 롤백하지 않고 명확하게 오류를 표시합니다.

## 복구 루프

`openclaw config validate`를 통과한 후에는 로컬 TUI를 사용하여 내장 에이전트가 활성 구성을 문서와 비교하도록 하고, 동일한 터미널에서 각 변경 사항을 검증하십시오.

```bash
openclaw chat
```

TUI 안에서 앞에 `!`를 붙이면 리터럴 로컬 셸 명령을 실행합니다(세션당 한 번 표시되는 확인 프롬프트를 승인한 후).

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
  <Step title="대상 편집 적용">
    `openclaw config set` 또는 `openclaw configure`를 사용하여 대상 편집을 적용하십시오.
  </Step>
  <Step title="다시 검증">
    변경할 때마다 `openclaw config validate`를 다시 실행하십시오.
  </Step>
  <Step title="런타임 문제에 Doctor 사용">
    검증을 통과했지만 런타임 상태가 여전히 정상이 아니면 마이그레이션 및 복구 도움말을 위해 `openclaw doctor` 또는 `openclaw doctor --fix`를 실행하십시오.
  </Step>
</Steps>

## 관련 항목

- [CLI 참조](/ko/cli)
- [구성](/ko/gateway/configuration)
