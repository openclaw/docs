---
read_when:
    - 터미널에서 워크스페이스 파일 내부의 리프를 읽거나 쓰려는 경우
    - 워크스페이스 상태를 대상으로 스크립트를 작성하면서 종류에 구애받지 않는 안정적인 주소 지정 체계를 원합니다.
    - '`oc://` 경로를 디버깅하는 중입니다(구문을 검증하고 어떤 경로로 해석되는지 확인하세요).'
summary: '`openclaw path`의 CLI 참조(`oc://` 주소 지정 체계를 통해 작업 공간 파일 검사 및 편집)'
title: 경로
x-i18n:
    generated_at: "2026-07-12T00:42:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

`oc://` 주소 지정 체계에 대한 셸 접근 기능입니다. 주소 지정 가능한 워크스페이스 파일(markdown, jsonc, jsonl, yaml/yml/lobster)을 검사하고 편집하기 위해 파일 종류에 따라 동작이 결정되는 단일 경로 구문을 제공합니다. 자체 호스팅 운영자, Plugin 작성자, 편집기 확장 기능은 파일 종류별 파서를 직접 만들지 않고도 특정 위치를 읽거나 찾거나 업데이트할 수 있습니다.

`path`는 번들로 제공되는 선택적 `oc-path` Plugin에서 제공합니다. 처음 사용하기 전에 활성화하세요.

```bash
openclaw plugins enable oc-path
```

CLI 동사는 주소 지정 모델을 그대로 반영합니다.

- `resolve`는 구체적인 단일 일치 항목을 처리합니다.
- `find`는 와일드카드, 합집합, 조건식, 위치 확장을 통해 여러 일치 항목을 찾는 동사입니다.
- `set`은 구체적인 경로나 삽입 표시자만 허용하며, 와일드카드 패턴은 쓰기 전에 거부됩니다.
- `validate`는 파일 시스템에 접근하지 않고 경로를 파싱합니다.
- `emit`은 파일을 파싱한 뒤 다시 출력하여 왕복 처리합니다(바이트 충실도 진단).

## 사용하는 이유

OpenClaw 상태는 사람이 편집하는 markdown, 주석이 포함된 JSONC 구성, 추가 전용 JSONL 로그, YAML 워크플로/명세 파일에 분산되어 있습니다. 스크립트, 훅, 에이전트는 이러한 파일에서 프런트매터 키, Plugin 설정, 로그 레코드 필드, YAML 단계, 이름이 지정된 섹션 아래의 글머리표 항목 같은 작은 값 하나만 필요한 경우가 많습니다.

`openclaw path`는 호출자가 파일 종류마다 일회성 grep, 정규식 또는 파서를 만드는 대신 안정적인 주소를 사용할 수 있게 합니다. 동일한 `oc://` 경로를 터미널에서 검증하고, 해석하고, 검색하고, 모의 실행하고, 쓸 수 있으므로 범위가 좁은 자동화를 검토하고 재실행하기가 쉽습니다. 파일의 나머지 부분은 보존되므로 하나의 말단 값을 써도 주석, 줄바꿈 형식 또는 주변 서식이 손상되지 않습니다.

원하는 대상에 논리적 주소가 있지만 파일 구조가 서로 다를 때 사용하세요.

- 훅에서 주석이 포함된 JSONC의 설정 하나를 읽고, 값을 다시 쓸 때 주석을 보존합니다.
- 유지보수 스크립트에서 전체 로그를 사용자 정의 파서로 불러오지 않고도 JSONL 로그의 모든 일치 이벤트 필드를 찾습니다.
- 편집기에서 줄 번호 대신 슬러그를 사용해 markdown 섹션이나 글머리표 항목으로 이동한 다음, 해석된 정확한 줄을 렌더링합니다.
- 에이전트가 작은 워크스페이스 편집을 적용하기 전에 모의 실행하고, 검토 시 변경된 바이트를 확인합니다.

일반적인 전체 파일 편집, 복잡한 구성 마이그레이션 또는 메모리 전용 쓰기에는 `openclaw path`를 사용하지 마세요. 이러한 작업에는 소유자 명령이나 Plugin을 사용해야 합니다. `path`는 또 다른 맞춤형 파서를 만드는 것보다 반복 실행 가능한 터미널 명령이 더 적합한, 작고 주소 지정 가능한 파일 작업을 위한 기능입니다.

## 사용 방법

사람이 편집한 구성 파일에서 값 하나를 읽습니다.

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

디스크를 변경하지 않고 쓰기 작업을 미리 봅니다.

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

추가 전용 JSONL 로그에서 일치하는 레코드를 찾습니다.

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

줄 번호 대신 섹션과 항목으로 markdown의 지침을 지정합니다.

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

스크립트가 읽거나 쓰기 전에 CI 또는 사전 점검 스크립트에서 경로를 검증합니다.

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

이러한 명령은 셸 스크립트에 그대로 복사할 수 있도록 설계되었습니다. 호출자에게 구조화된 출력이 필요하면 `--json`을 사용하고, 사람이 결과를 확인할 때는 `--human`을 사용하세요.

## 작동 방식

1. `oc://` 주소를 파일, 섹션, 항목, 필드 및 선택적 세션 쿼리 슬롯으로 파싱합니다.
2. 대상 확장자(`.md`, `.jsonc`, `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`)에 따라 파일 종류 어댑터를 선택합니다.
3. 해당 파일 종류의 구조에 맞춰 슬롯을 해석합니다. 대상은 markdown 제목/항목, JSONC 객체 키/배열 인덱스, JSONL 줄 레코드 또는 YAML 맵/시퀀스 노드입니다.
4. `set`의 경우 동일한 어댑터를 통해 편집된 바이트를 출력하므로, 해당 파일 종류에서 지원하는 경우 변경되지 않은 부분의 주석, 줄바꿈 형식 및 주변 서식이 유지됩니다.

`resolve`와 `set`에는 구체적인 대상 하나가 필요합니다. `find`는 탐색용 동사로, 와일드카드, 합집합, 조건식, 서수를 구체적인 일치 항목으로 확장하여 쓸 대상을 선택하기 전에 검사할 수 있게 합니다.

## 하위 명령

| 하위 명령               | 용도                                                                                   |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `resolve <oc-path>`     | 경로의 구체적인 일치 항목 또는 "찾을 수 없음"을 출력합니다.                           |
| `find <pattern>`        | 와일드카드, 합집합 또는 조건식 경로의 일치 항목을 열거합니다.                         |
| `set <oc-path> <value>` | 구체적인 경로에 말단 값 또는 삽입 대상을 씁니다. `--dry-run`을 지원합니다.            |
| `validate <oc-path>`    | 파싱만 수행하고 구조적 구성(파일/섹션/항목/필드)을 출력합니다.                        |
| `emit <file>`           | 파일을 파싱하고 다시 출력하여 왕복 처리합니다(바이트 충실도 진단).                    |

## 전역 플래그

| 플래그          | 적용 대상                        | 용도                                                                                  |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | 이 디렉터리를 기준으로 파일 슬롯을 해석합니다(기본값: `process.cwd()`).               |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | 파일 슬롯에서 해석된 경로를 재정의합니다(절대 경로 접근).                             |
| `--json`        | 모두                             | JSON 출력을 강제합니다(stdout이 TTY가 아닐 때의 기본값).                              |
| `--human`       | 모두                             | 사람이 읽을 수 있는 출력을 강제합니다(stdout이 TTY일 때의 기본값).                   |
| `--value-json`  | `set`                            | JSON/JSONC/JSONL 말단 값을 교체할 때 `<value>`를 JSON으로 파싱합니다.                 |
| `--dry-run`     | `set`                            | 실제로 쓰지 않고 쓰게 될 바이트를 출력합니다.                                        |
| `--diff`        | `set` (`--dry-run` 필요)         | 전체 바이트 대신 통합 diff를 출력합니다.                                              |

`validate`는 `--json`/`--human`만 받습니다. 파일 시스템에 접근하지 않으므로 `--cwd`와 `--file`은 적용되지 않습니다.

## `oc://` 구문

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

슬롯 규칙상 `field`에는 `item`이 필요하고, `item`에는 `section`이 필요합니다. 네 슬롯 모두에 다음 규칙이 적용됩니다.

- **따옴표로 묶은 세그먼트** — `"a/b.c"`에서는 `/` 및 `.` 구분자가 그대로 유지됩니다. 내용은 바이트 리터럴이며, 따옴표 안에는 `"`와 `\`를 사용할 수 없습니다. 파일 슬롯도 따옴표를 인식합니다. `oc://"skills/email-drafter"/Tools/$last`는 `skills/email-drafter`를 단일 파일 경로로 처리합니다.
- **조건식** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`. 숫자 연산자를 사용하려면 양쪽 모두 유한한 숫자로 변환할 수 있어야 합니다.
- **합집합** — `{a,b,c}`는 대안 중 하나와 일치합니다.
- **와일드카드** — `*`(단일 하위 세그먼트)와 `**`(0개 이상, 재귀적). `find`에서는 사용할 수 있지만 `resolve`와 `set`에서는 모호하므로 거부됩니다.
- **위치 지정자** — `$first`/`$last`는 첫 번째/마지막 인덱스 또는 선언된 키로 해석됩니다.
- **서수** — 문서 순서상 N번째 일치 항목은 `#N`으로 지정합니다.
- **삽입 표시자** — 키/인덱스 기반 삽입을 위한 `+`, `+key`, `+nnn`입니다(`set`과 함께 사용).
- **세션 범위** — `?session=cron-daily` 등입니다. 슬롯 중첩과는 독립적입니다. 세션 값은 원시 값이며 퍼센트 디코딩되지 않습니다. 제어 문자나 예약된 쿼리 구분자(`?`, `&`, `%`)를 포함할 수 없습니다.

따옴표, 조건식 또는 합집합 세그먼트 외부에 있는 예약 문자(`?`, `&`, `%`)는 거부됩니다. 제어 문자(U+0000-U+001F, U+007F)는 `session` 쿼리 값을 포함하여 어디에서든 거부됩니다.

정규 경로에는 `formatOcPath(parseOcPath(path)) === path`가 보장됩니다. 비정규 쿼리 매개변수는 비어 있지 않은 첫 번째 `session=` 값을 제외하고 무시됩니다.

엄격한 제한은 경로 최대 4096바이트, 최대 4개 슬롯(파일/섹션/항목/필드), 슬롯당 최대 64개의 점으로 구분된 하위 세그먼트, 깊은 JSON 경로의 중첩 탐색 최대 256단계입니다. 이와 별도로 16 MiB를 초과하는 모든 JSONC/JSON 파일 입력은 해당 파일을 불러오는 모든 동사에서 파싱하지 않고 파싱 진단과 함께 거부됩니다.

## 파일 종류별 주소 지정

| 종류          | 파일 확장자                  | 주소 지정 모델                                                                                             |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                        | 슬러그로 H2 섹션을, 슬러그 또는 `#N`으로 글머리표 항목을, `[frontmatter]`로 프런트매터를 지정합니다.       |
| JSONC/JSON    | `.jsonc`, `.json`            | 객체 키와 배열 인덱스를 사용하며, 따옴표로 묶지 않으면 점이 중첩 하위 세그먼트를 구분합니다.              |
| JSONL         | `.jsonl`, `.ndjson`          | 최상위 줄 주소(`L1`, `L2`, `$first`, `$last`)를 지정한 다음 줄 내부를 JSONC 방식으로 탐색합니다.          |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`  | 맵 키와 시퀀스 인덱스를 사용하며, 주석과 흐름 스타일은 YAML 문서 API에서 처리합니다.                       |

`resolve`는 1부터 시작하는 줄 번호와 함께 `root`, `node`, `leaf` 또는 `insertion-point` 구조의 일치 항목을 반환합니다. 말단 값은 텍스트와 `leafType`으로 제공되므로 Plugin 작성자는 파일 종류별 AST 구조에 의존하지 않고 미리보기를 렌더링할 수 있습니다.

## 변경 계약

`set`은 구체적인 대상 하나에 씁니다.

- Markdown 프런트매터 값과 `- key: value` 항목 필드는 문자열 말단 값입니다. Markdown 삽입은 섹션, 프런트매터 키 또는 섹션 항목을 추가하고 변경된 파일을 정규 markdown 형식으로 렌더링합니다. `set`을 통해 섹션 본문 전체를 쓸 수는 없습니다.
- JSONC 말단 값 쓰기는 문자열 값을 기존 말단 값의 형식(`string`, 유한한 `number`, `true`/`false` 또는 `null`)으로 변환합니다. JSONC/JSON/JSONL 말단 값 교체 시 `<value>`를 JSON으로 파싱하여 형태를 변경해야 하는 경우 `--value-json`을 사용하세요. 예를 들어 문자열 형태의 보안 비밀 참조 축약형을 객체로 교체할 수 있습니다. JSONC 객체 및 배열 삽입은 `<value>`를 JSON으로 파싱하며, 일반적인 말단 값 쓰기에는 `jsonc-parser` 편집 경로를 사용하여 주석과 주변 서식을 보존합니다.
- JSONL 말단 값 쓰기는 한 줄 내부에서 JSONC와 같은 방식으로 변환합니다. 전체 줄 교체 및 추가 시 `<value>`를 JSON으로 파싱합니다. 렌더링된 JSONL은 파일에서 우세한 LF/CRLF 줄바꿈 형식을 유지합니다. 파일의 줄바꿈에 대해 다수결을 적용하므로 대부분이 CRLF인 파일은 일부 LF가 섞여 있어도 CRLF를 유지합니다.
- YAML 말단 값 쓰기는 기존 스칼라 형식(`string`, 유한한 `number`, `true`/`false` 또는 `null`)으로 변환합니다. YAML 삽입은 번들로 제공되는 `yaml` 패키지의 문서 API를 사용하여 맵/시퀀스를 업데이트합니다. 파서 오류가 있는 잘못된 YAML 문서는 변경 전에 `parse-error`로 거부됩니다.

정확한 바이트가 중요한 사용자 표시 쓰기 작업 전에는 `--dry-run`을 사용하세요. JSONC 및 YAML 편집은 기존 문서를 패치하므로(`jsonc-parser` 또는 `yaml` 문서 API 사용) 변경되지 않은 바이트는 일반적으로 보존됩니다. 반면 markdown은 편집할 때마다 파싱된 구조에서 파일을 다시 빌드하므로 변경된 말단 값 외부의 부수적인 서식도 정규화될 수 있습니다. 전체 렌더링 파일 대신 변경 전후에 초점을 맞춘 패치 형태로 미리보려면 `--diff`를 추가하세요.

## 예제

```bash
# 경로 검증(파일 시스템 접근 없음)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# 말단 값 읽기
openclaw path resolve 'oc://gateway.jsonc/version'

# 와일드카드 검색
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# 쓰기 모의 실행
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# 통합 diff 형식으로 쓰기 모의 실행
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# 쓰기 적용
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# 바이트 충실도 왕복 처리(진단)
openclaw path emit ./AGENTS.md
```

추가 문법 예제:

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

## 파일 종류별 사용법

동일한 다섯 가지 동사를 모든 종류에 사용할 수 있으며, 주소 지정 체계는
파일 확장자에 따라 처리를 분기합니다.

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

`[frontmatter]` 조건자는 YAML 프런트매터 블록의 주소를 지정합니다. `tools`는
슬러그를 통해 `## Tools` 제목과 일치하며, 소스에서 밑줄을 사용하더라도 항목
리프는 슬러그 형식을 유지합니다(`send_email`은 `send-email`이 됨).

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

JSONC 편집은 `jsonc-parser`를 거치므로 `set` 이후에도 주석과 공백이
유지됩니다. 변경을 확정하기 전에 먼저 `--dry-run`으로 실행하여 바이트를
검토하세요. `.json` 파일은 `.jsonc`와 동일한 어댑터와 편집 경로를 사용합니다.

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

각 줄은 하나의 레코드입니다. 줄 번호를 모르는 경우 조건자(`[event=action]`)로
주소를 지정하고, 아는 경우 표준 `LN` 세그먼트로 주소를 지정하세요.
`.ndjson` 파일은 `.jsonl`과 동일한 어댑터를 사용합니다.

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

YAML은 직접 만든 파서 대신 `yaml` 패키지의 `Document` API를 사용합니다.
따라서 일반적인 파싱/출력 왕복 과정에서 주석과 작성 형식이 유지되며,
해석된 경로는 JSONC와 동일한 맵 키/시퀀스 인덱스 모델을 사용합니다.
동일한 어댑터가 `.yaml`, `.yml`, `.lobster` 파일을 처리합니다.

## 하위 명령어 참고 자료

### `resolve <oc-path>`

단일 리프 또는 Node를 읽습니다. 와일드카드는 거부되므로 와일드카드에는
`find`를 사용하세요. 일치 항목이 있으면 `0`, 정상적인 불일치에는 `1`,
파싱 오류 또는 거부된 패턴에는 `2`로 종료합니다.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

와일드카드/조건자/합집합 패턴에 일치하는 모든 항목을 열거합니다. 하나 이상
일치하면 `0`, 일치 항목이 없으면 `1`로 종료합니다. 파일 슬롯 와일드카드는
`OC_PATH_FILE_WILDCARD_UNSUPPORTED`와 함께 거부됩니다. 구체적인 파일을
전달하세요(여러 파일 글로빙은 후속 기능입니다).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

리프를 씁니다. 파일을 변경하지 않고 기록될 바이트를 미리 보려면
`--dry-run`과 함께 사용하세요. 통합 diff 미리 보기를 사용하려면 `--diff`를
추가하세요. 쓰기에 성공하면 `0`, 기반 계층에서 거부하면(예: 센티널 가드에
걸린 경우) `1`, 파싱 오류에는 `2`로 종료합니다.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` 삽입 표시는 명명된 자식이 아직 존재하지 않는 경우 이를 생성합니다.
`+nnn`과 단독 `+`는 각각 인덱스 기반 삽입과 끝에 추가하는 삽입에 사용됩니다.

### `validate <oc-path>`

파싱만 검사합니다. 파일 시스템에는 접근하지 않습니다. 변수를 치환하기 전에
템플릿 경로의 형식이 올바른지 확인하거나 디버깅을 위해 구조 분석 결과가
필요할 때 유용합니다.

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

유효하면 `0`, 유효하지 않으면 구조화된 `code` 및 `message`와 함께 `1`,
인수 오류에는 `2`로 종료합니다.

### `emit <file>`

파일 종류별 파서와 이미터를 통해 파일을 왕복 처리합니다. 정상적인 파일에서는
출력이 입력과 바이트 단위로 동일해야 합니다. 차이가 있으면 파서 버그가 있거나
센티널에 걸렸음을 나타냅니다. 실제 입력에 대한 기반 계층의 동작을 디버깅할 때
유용합니다.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 종료 코드

| 코드 | 의미                                                                           |
| ---- | ------------------------------------------------------------------------------ |
| `0`  | 성공. (`resolve`/`find`: 하나 이상 일치. `set`: 쓰기 성공.)                    |
| `1`  | 일치 항목이 없거나 기반 계층에서 `set`을 거부함(시스템 수준 오류는 아님).       |
| `2`  | 인수 또는 파싱 오류.                                                           |

## 출력 모드

`openclaw path`는 TTY를 인식합니다. 터미널에서는 사람이 읽을 수 있는 출력을
사용하고, stdout이 파이프되거나 리디렉션되면 JSON을 사용합니다. `--json`과
`--human`은 자동 감지를 재정의합니다.

## 참고 사항

- `set`은 기반 계층의 출력 경로를 통해 바이트를 쓰며, 이 경로는 자동으로
  수정 센티널 가드를 적용합니다. `__OPENCLAW_REDACTED__`를 그대로 포함하거나
  부분 문자열로 포함하는 리프는 쓰기 시 거부됩니다.
- JSONC 파싱 및 리프 편집은 Plugin 로컬 `jsonc-parser` 의존성을 사용합니다.
  따라서 직접 만든 파서/재렌더링 경로를 거치지 않고 일반적인 리프 쓰기에서
  주석과 서식이 유지됩니다.
- `path`는 마지막 정상 상태(LKG) 구성 추적 또는 복구를 인식하지 않습니다.
  해당 수명 주기는 다른 곳에서 관리됩니다. `path`를 통해 편집한 파일이
  LKG 추적 대상이기도 한 경우, 다음 구성 읽기에서 해당 파일을 승격할지
  복구할지 결정합니다. `path` 편집은 해당 파일에 대한 다른 직접 쓰기와
  동일하게 취급하세요.

## 관련 항목

- [CLI 참고 자료](/ko/cli)
