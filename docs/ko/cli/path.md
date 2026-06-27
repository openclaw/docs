---
read_when:
    - 터미널에서 워크스페이스 파일 내부의 리프를 읽거나 쓰려고 합니다
    - 워크스페이스 상태에 대해 스크립트를 작성하고 있으며 종류에 구애받지 않는 안정적인 주소 지정 체계가 필요한 경우
    - '`oc://` 경로를 디버깅하는 중입니다(구문을 검증하고, 무엇으로 해석되는지 확인).'
summary: '`openclaw path`에 대한 CLI 참조(`oc://` 주소 지정 체계를 통해 워크스페이스 파일 검사 및 편집)'
title: 경로
x-i18n:
    generated_at: "2026-06-27T17:19:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Plugin이 제공하는 `oc://` 주소 지정 기반에 대한 셸 접근입니다. 주소 지정 가능한 작업 영역 파일(markdown, jsonc, jsonl, yaml/yml/lobster)을 검사하고 편집하기 위한, 종류별로 디스패치되는 단일 경로 체계입니다. 셀프 호스터, Plugin 작성자, 편집기 확장은 파일 종류별 파서를 직접 만들지 않고도 좁은 위치를 읽고, 찾고, 업데이트하는 데 이를 사용합니다.

CLI는 이 기반의 공개 동작을 그대로 반영합니다.

- `resolve`는 구체적이며 단일 일치 항목을 대상으로 합니다.
- `find`는 와일드카드, 유니온, 조건자, 위치 확장을 위한 다중 일치 동작입니다.
- `set`은 구체적인 경로 또는 삽입 마커만 허용하며, 와일드카드 패턴은 쓰기 전에 거부됩니다.

`path`는 번들로 제공되는 선택적 `oc-path` Plugin이 제공합니다. 처음 사용하기 전에 활성화하세요.

```bash
openclaw plugins enable oc-path
```

## 사용하는 이유

OpenClaw 상태는 사람이 편집하는 markdown, 주석이 있는 JSONC 설정, 추가 전용 JSONL 로그, YAML 워크플로/명세 파일에 걸쳐 분산되어 있습니다. 셸 스크립트, 훅, 에이전트는 종종 이러한 파일에서 작은 값 하나만 필요로 합니다. 예를 들어 frontmatter 키, Plugin 설정, 로그 레코드 필드, YAML 단계, 또는 이름이 지정된 섹션 아래의 글머리표 항목입니다.

`openclaw path`는 이러한 호출자에게 파일 종류마다 일회성 grep, 정규식, 파서를 두는 대신 안정적인 주소를 제공합니다. 동일한 `oc://` 경로를 터미널에서 검증, 해석, 검색, 드라이런, 쓰기할 수 있으므로 좁은 범위의 자동화를 더 쉽게 검토하고 더 안전하게 재실행할 수 있습니다. 파일의 나머지 주석, 줄 끝, 주변 서식을 보존하면서 리프 하나만 업데이트하려는 경우 특히 유용합니다.

원하는 대상에는 논리적 주소가 있지만 실제 파일 형식이 달라지는 경우 사용하세요.

- 훅이 주석을 잃지 않고 값을 다시 쓰기 위해, 주석이 있는 JSONC에서 설정 하나를 읽으려는 경우.
- 유지보수 스크립트가 전체 로그를 사용자 지정 파서에 로드하지 않고 JSONL 로그에서 일치하는 모든 이벤트 필드를 찾으려는 경우.
- 편집기 확장이 slug로 markdown 섹션이나 글머리표 항목으로 이동한 뒤, 해석된 정확한 줄을 렌더링하려는 경우.
- 에이전트가 적용 전에 작은 작업 영역 편집을 드라이런하고, 변경된 바이트를 리뷰에서 볼 수 있게 하려는 경우.

일반적인 전체 파일 편집, 복잡한 설정 마이그레이션, 메모리 전용 쓰기에는 `openclaw path`가 필요하지 않을 가능성이 큽니다. 그런 작업은 소유자 명령 또는 Plugin을 사용해야 합니다. `path`는 반복 가능한 터미널 명령이 또 다른 맞춤 파서보다 더 명확한, 작고 주소 지정 가능한 파일 작업을 위한 것입니다.

## 사용 방법

사람이 편집하는 설정 파일에서 값 하나 읽기:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

디스크를 건드리지 않고 쓰기 미리보기:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

추가 전용 JSONL 로그에서 일치하는 레코드 찾기:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

줄 번호 대신 섹션과 항목으로 markdown의 지침 주소 지정:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

스크립트가 읽거나 쓰기 전에 CI 또는 사전 점검 스크립트에서 경로 검증:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

이 명령들은 셸 스크립트에 복사해 넣을 수 있도록 설계되었습니다. 호출자에게 구조화된 출력이 필요하면 `--json`을 사용하고, 사람이 결과를 검사할 때는 `--human`을 사용하세요.

## 작동 방식

`openclaw path`는 네 가지 작업을 수행합니다.

1. `oc://` 주소를 파일, 섹션, 항목, 필드, 선택적 세션 슬롯으로 파싱합니다.
2. 대상 확장자(`.md`, `.jsonc`, `.jsonl`, `.yaml`, `.yml`, `.lobster` 및 관련 별칭)에서 파일 종류 어댑터를 선택합니다.
3. 해당 파일 종류의 AST에 대해 슬롯을 해석합니다. markdown 제목/항목, JSONC 객체 키/배열 인덱스, JSONL 줄 레코드, 또는 YAML 맵/시퀀스 노드가 대상입니다.
4. `set`의 경우 동일한 어댑터를 통해 편집된 바이트를 내보내므로, 해당 종류가 지원하는 범위에서 파일의 변경되지 않은 부분은 주석, 줄 끝, 주변 서식을 유지합니다.

`resolve`와 `set`은 구체적인 대상 하나를 요구합니다. `find`는 탐색용 동작입니다. 쓰기 대상을 선택하기 전에 검사할 수 있도록 와일드카드, 유니온, 조건자, 순번을 구체적인 일치 항목으로 확장합니다.

## 하위 명령

| 하위 명령               | 목적                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | 경로의 구체적인 일치 항목을 출력합니다(또는 "찾을 수 없음").                |
| `find <pattern>`        | 와일드카드 / 유니온 / 조건자 경로의 일치 항목을 열거합니다.                 |
| `set <oc-path> <value>` | 구체적인 경로의 리프 또는 삽입 대상을 씁니다. `--dry-run`을 지원합니다.     |
| `validate <oc-path>`    | 파싱만 수행하고 구조적 분해(파일 / 섹션 / 항목 / 필드)를 출력합니다.        |
| `emit <file>`           | `parseXxx` + `emitXxx`를 통해 파일을 왕복 처리합니다(바이트 충실도 진단).   |

## 전역 플래그

| 플래그          | 목적                                                                         |
| --------------- | ---------------------------------------------------------------------------- |
| `--cwd <dir>`   | 이 디렉터리를 기준으로 파일 슬롯을 해석합니다(기본값: `process.cwd()`).      |
| `--file <path>` | 파일 슬롯의 해석된 경로를 재정의합니다(절대 접근).                           |
| `--json`        | JSON 출력을 강제합니다(stdout이 TTY가 아닐 때 기본값).                       |
| `--human`       | 사람이 읽는 출력을 강제합니다(stdout이 TTY일 때 기본값).                    |
| `--dry-run`     | (`set`에서만) 실제로 쓰지 않고 쓰일 바이트를 출력합니다.                     |
| `--diff`        | (`set --dry-run`과 함께) 전체 바이트 대신 unified diff를 출력합니다.         |

## `oc://` 구문

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

슬롯 규칙: `field`에는 `item`이 필요하고, `item`에는 `section`이 필요합니다. 네 슬롯 전체에 적용됩니다.

- **인용된 세그먼트** — `"a/b.c"`는 `/` 및 `.` 구분자에서도 유지됩니다.
  내용은 바이트 리터럴이며, 따옴표 안에서는 `"`와 `\`가 허용되지 않습니다.
  파일 슬롯도 인용을 인식합니다. `oc://"skills/email-drafter"/Tools/$last`는 `skills/email-drafter`를 단일 파일 경로로 취급합니다.
- **조건자** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. 숫자 연산은 양쪽 모두가 유한 숫자로 강제 변환될 수 있어야 합니다.
- **유니온** — `{a,b,c}`는 대안 중 하나와 일치합니다.
- **와일드카드** — `*`(단일 하위 세그먼트) 및 `**`(0개 이상, 재귀).
  `find`는 이를 허용하지만, `resolve`와 `set`은 모호하므로 거부합니다.
- **위치 지정** — `$first` / `$last`는 첫 번째 / 마지막 인덱스 또는 선언된 키로 해석됩니다.
- **순번** — 문서 순서 기준 N번째 일치 항목은 `#N`입니다.
- **삽입 마커** — 키 기반 / 인덱스 기반 삽입을 위한 `+`, `+key`, `+nnn`(`set`과 함께 사용).
- **세션 범위** — `?session=cron-daily` 등입니다. 슬롯 중첩과는 직교합니다. 세션 값은 원시 값이며 퍼센트 디코딩되지 않습니다. 제어 문자나 예약된 쿼리 구분자(`?`, `&`, `%`)를 포함할 수 없습니다.

인용, 조건자, 유니온 세그먼트 밖의 예약 문자(`?`, `&`, `%`)는 거부됩니다. 제어 문자(U+0000-U+001F, U+007F)는 `session` 쿼리 값을 포함해 어디서든 거부됩니다.

정규 경로에 대해서는 `formatOcPath(parseOcPath(path)) === path`가 보장됩니다. 정규가 아닌 쿼리 매개변수는 비어 있지 않은 첫 번째 `session=` 값을 제외하고 무시됩니다.

## 파일 종류별 주소 지정

| 종류              | 주소 지정 모델                                                                                     |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | H2 섹션은 slug로, 글머리표 항목은 slug 또는 `#N`으로, frontmatter는 `[frontmatter]`로 주소 지정합니다. |
| JSONC/JSON        | 객체 키와 배열 인덱스입니다. 인용하지 않으면 점이 중첩 하위 세그먼트를 나눕니다.                   |
| JSONL             | 최상위 줄 주소(`L1`, `L2`, `$first`, `$last`) 이후 줄 내부에서 JSONC 스타일로 내려갑니다.          |
| YAML/YML/.lobster | 맵 키와 시퀀스 인덱스입니다. 주석과 flow style은 YAML 문서 API가 처리합니다.                       |

`resolve`는 구조화된 일치 항목을 반환합니다. `root`, `node`, `leaf`, 또는 `insertion-point`와 1부터 시작하는 줄 번호가 포함됩니다. 리프 값은 텍스트와 `leafType`으로 노출되므로, Plugin 작성자는 종류별 AST 형식에 의존하지 않고 미리보기를 렌더링할 수 있습니다.

## 변경 계약

`set`은 구체적인 대상 하나를 씁니다.

- Markdown frontmatter 값과 `- key: value` 항목 필드는 문자열 리프입니다.
  Markdown 삽입은 섹션, frontmatter 키, 또는 섹션 항목을 추가하고 변경된 파일에 대해 정규 markdown 형식을 렌더링합니다.
- JSONC 리프 쓰기는 문자열 값을 기존 리프 타입(`string`, 유한 `number`, `true`/`false`, 또는 `null`)으로 강제 변환합니다. JSONC/JSON/JSONL 리프 대체에서 `<value>`를 JSON으로 파싱해야 하며 문자열 SecretRef 축약형을 객체로 바꾸는 경우처럼 형식이 바뀔 수 있다면 `--value-json`을 사용하세요. JSONC 객체 및 배열 삽입은 `<value>`를 JSON으로 파싱하고 일반 리프 쓰기에는 `jsonc-parser` 편집 경로를 사용하여 주석과 주변 서식을 보존합니다.
- JSONL 리프 쓰기는 줄 내부에서 JSONC처럼 강제 변환합니다. 전체 줄 대체와 추가는 `<value>`를 JSON으로 파싱합니다. 렌더링된 JSONL은 파일의 지배적인 LF/CRLF 줄 끝 규칙을 보존합니다.
- YAML 리프 쓰기는 기존 스칼라 타입(`string`, 유한 `number`, `true`/`false`, 또는 `null`)으로 강제 변환합니다. YAML 삽입은 맵/시퀀스 업데이트에 번들된 `yaml` 패키지의 문서 API를 사용합니다. 파서 오류가 있는 잘못된 YAML 문서는 변경 전에 `parse-error`로 거부됩니다.

정확한 바이트가 중요한 사용자 표시 쓰기 전에는 `--dry-run`을 사용하세요. 이 기반은 parse/emit 왕복에 대해 바이트 동일 출력을 보존하지만, 변경은 종류에 따라 편집된 영역 또는 파일을 정규화할 수 있습니다.
전체 렌더링 파일 대신 집중된 전/후 패치로 미리보기를 보고 싶다면 `--diff`를 추가하세요.

## 예시

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

더 많은 문법 예시:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## 파일 종류별 레시피

동일한 다섯 가지 동사가 여러 종류에서 동작하며, 주소 지정 체계는
파일 확장자에 따라 디스패치합니다. 아래 예시는 PR 설명의 픽스처를 사용합니다.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

`[frontmatter]` 조건자는 YAML frontmatter 블록의 주소를 지정합니다. `tools`는
슬러그를 통해 `## Tools` 제목과 일치하며, 항목 리프는 원본이 밑줄을 사용하더라도
슬러그 형식을 유지합니다(`send_email` → `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC 편집은 `jsonc-parser`를 거치므로, 주석과 공백은 `set` 이후에도 유지됩니다.
커밋하기 전에 먼저 `--dry-run`으로 실행하여 바이트를 검사하세요.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

각 줄은 하나의 레코드입니다. 줄 번호를 모를 때는 조건자(`[event=action]`)로
주소를 지정하고, 알고 있을 때는 정식 `LN` 세그먼트로 주소를 지정하세요.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML은 직접 만든 파서가 아니라 `yaml` 패키지의 `Document` API를 사용하므로,
일반적인 파싱/출력 왕복 과정에서 주석과 작성 형태가 보존되며, 해석된 경로는
JSONC와 동일한 맵 키 / 시퀀스 인덱스 모델을 사용합니다. 동일한 어댑터가
`.yaml`, `.yml`, `.lobster` 파일을 처리합니다.

## 하위 명령어 참조

### `resolve <oc-path>`

단일 리프 또는 노드를 읽습니다. 와일드카드는 거부됩니다. 해당 경우에는 `find`를
사용하세요. 일치 항목이 있으면 `0`, 정상적인 미일치이면 `1`, 파싱 오류 또는
거부된 패턴이면 `2`로 종료합니다.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

와일드카드 / 조건자 / 유니언 패턴의 모든 일치 항목을 열거합니다. 하나 이상의
일치 항목이 있으면 `0`, 없으면 `1`로 종료합니다. 파일 슬롯 와일드카드는
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`와 함께 거부됩니다. 구체적인 파일을
전달하세요. 여러 파일 글로빙은 후속 기능입니다.

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

리프를 씁니다. `--dry-run`과 함께 사용하면 파일을 건드리지 않고 기록될 바이트를
미리 볼 수 있습니다. 통합 diff 미리보기를 보려면 `--diff`를 추가하세요.
쓰기 성공 시 `0`, 서브스트레이트가 거부한 경우(예: 센티널 가드에 걸림) `1`,
파싱 오류 시 `2`로 종료합니다.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` 삽입 표시는 이름이 지정된 자식이 아직 없으면 생성합니다. `+nnn`과
단독 `+`는 각각 인덱스 기반 삽입과 append 삽입에 사용됩니다.

### `validate <oc-path>`

파싱 전용 검사입니다. 파일 시스템에 접근하지 않습니다. 변수를 치환하기 전에
템플릿 경로의 형식이 올바른지 확인하거나, 디버깅을 위해 구조적 분해 결과를
보고 싶을 때 유용합니다.

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

유효하면 `0`, 유효하지 않으면 구조화된 `code`와 `message`와 함께 `1`,
인수 오류 시 `2`로 종료합니다.

### `emit <file>`

종류별 파서와 출력기를 통해 파일을 왕복 처리합니다. 정상적인 파일에서는 출력이
입력과 바이트 단위로 동일해야 합니다. 차이가 있으면 파서 버그 또는 센티널 적중을
의미합니다. 실제 입력에서 서브스트레이트 동작을 디버깅할 때 유용합니다.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 종료 코드

| 코드 | 의미                                                                    |
| ---- | -------------------------------------------------------------------------- |
| `0`  | 성공. (`resolve` / `find`: 하나 이상의 일치 항목. `set`: 쓰기 성공.) |
| `1`  | 일치 항목 없음, 또는 서브스트레이트가 `set`을 거부함(시스템 수준 오류 없음).      |
| `2`  | 인수 또는 파싱 오류.                                                   |

## 출력 모드

`openclaw path`는 TTY를 인식합니다. 터미널에서는 사람이 읽을 수 있는 출력,
stdout이 파이프되거나 리디렉션되면 JSON을 출력합니다. `--json`과 `--human`은
자동 감지를 재정의합니다.

## 참고

- `set`은 서브스트레이트의 출력 경로를 통해 바이트를 쓰며, 이 경로는
  redaction-sentinel 가드를 자동으로 적용합니다. `__OPENCLAW_REDACTED__`를
  그대로 또는 부분 문자열로 포함하는 리프는 쓰기 시점에 거부됩니다.
- JSONC 파싱과 리프 편집은 Plugin 로컬 `jsonc-parser` 의존성을 사용하므로,
  직접 만든 파서/재렌더링 경로를 거치지 않고도 일반적인 리프 쓰기에서 주석과
  형식이 보존됩니다.
- `path`는 LKG를 알지 못합니다. 파일이 LKG 추적 대상이면 다음 observe 호출이
  승격 / 복구 여부를 결정합니다. LKG 승격/복구 수명 주기를 통한 원자적 다중
  설정을 위한 `set --batch`는 LKG 복구 서브스트레이트와 함께 계획되어 있습니다.

## 관련 항목

- [CLI 참조](/ko/cli)
