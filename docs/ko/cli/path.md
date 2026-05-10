---
read_when:
    - 터미널에서 워크스페이스 파일 내부의 리프를 읽거나 쓰고 싶습니다
    - 워크스페이스 상태를 대상으로 스크립트를 작성하고 있으며, 종류에 구애받지 않는 안정적인 주소 지정 체계가 필요합니다.
    - '`oc://` 경로를 디버깅하고 있습니다(구문을 검증하고 무엇으로 해석되는지 확인)'
summary: '`openclaw path`에 대한 CLI 참조(`oc://` 주소 지정 체계를 통해 작업 공간 파일을 검사하고 편집)'
title: 경로
x-i18n:
    generated_at: "2026-05-10T19:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: d0b965b791fa658dd04015bb7b5c8c458f6527092473c61cd701eff24a5770fe
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

`oc://` 주소 지정 기반에 대한 Plugin 제공 셸 액세스: 주소 지정 가능한 workspace 파일(markdown, jsonc, jsonl)을 검사하고 편집하기 위한 종류별 디스패치 경로 체계입니다. 셀프 호스터, Plugin 작성자, 편집기 확장은 파일 종류별 parser를 직접 만들지 않고도 좁은 위치를 읽고, 찾고, 업데이트하는 데 이를 사용합니다.

CLI는 기반의 공개 verb를 그대로 반영합니다.

- `resolve`는 구체적이며 단일 일치입니다.
- `find`는 wildcard, union, predicate, 위치 확장을 위한 다중 일치 verb입니다.
- `set`은 구체 경로나 insertion marker만 허용하며, wildcard 패턴은 쓰기 전에 거부됩니다.

`path`는 번들로 제공되는 선택적 `oc-path` Plugin에서 제공합니다. 처음 사용하기 전에 활성화하세요.

```bash
openclaw plugins enable oc-path
```

## 사용하는 이유

OpenClaw 상태는 사람이 편집하는 markdown, 주석이 있는 JSONC config, append-only JSONL log에 걸쳐 분산되어 있습니다. Shell script, hook, agent는 종종 이러한 파일에서 작은 값 하나만 필요로 합니다. frontmatter key, Plugin setting, log record field, 또는 이름 있는 section 아래의 bullet item 같은 값입니다.

`openclaw path`는 이러한 호출자에게 각 파일 종류마다 만든 일회성 grep, regex, parser 대신 안정적인 address를 제공합니다. 동일한 `oc://` path를 terminal에서 validate, resolve, search, dry-run, write할 수 있으므로 좁은 automation을 더 쉽게 review하고 더 안전하게 replay할 수 있습니다. 파일의 나머지 comment, line ending, 주변 formatting을 보존하면서 leaf 하나만 update하고 싶을 때 특히 유용합니다.

원하는 대상에 논리적 address가 있지만 실제 file shape가 달라지는 경우 사용하세요.

- hook이 주석이 있는 JSONC에서 setting 하나를 읽고, 값을 다시 쓸 때 comment를 잃지 않으려는 경우.
- maintenance script가 JSONL log 전체를 custom parser로 load하지 않고 모든 matching event field를 찾으려는 경우.
- editor extension이 slug로 markdown section 또는 bullet item으로 jump한 다음, resolve된 정확한 line을 render하려는 경우.
- agent가 적용하기 전에 작은 workspace edit을 dry-run하고, 변경된 byte를 review에서 확인하려는 경우.

일반적인 whole-file edit, 풍부한 config migration, memory 전용 write에는 `openclaw path`가 필요하지 않을 가능성이 큽니다. 그런 작업은 owner command 또는 Plugin을 사용해야 합니다. `path`는 또 다른 bespoke parser보다 반복 가능한 terminal command가 더 명확한 작고 주소 지정 가능한 file operation을 위한 것입니다.

## 사용 방법

사람이 편집한 config file에서 값 하나를 읽습니다.

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

disk를 건드리지 않고 write를 preview합니다.

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

append-only JSONL log에서 matching record를 찾습니다.

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

markdown의 instruction을 line number 대신 section과 item으로 address합니다.

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

script가 read 또는 write하기 전에 CI 또는 preflight script에서 path를 validate합니다.

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

이 command들은 shell script에 복사해 넣을 수 있도록 설계되었습니다. 호출자에게 structured output이 필요하면 `--json`을 사용하고, 사람이 result를 검사할 때는 `--human`을 사용하세요.

## 작동 방식

`openclaw path`는 네 가지 작업을 수행합니다.

1. `oc://` address를 file, section, item, field, optional session slot으로 parse합니다.
2. target extension(`.md`, `.jsonc`, `.jsonl` 및 관련 alias)에서 file-kind adapter를 선택합니다.
3. 해당 file kind의 AST를 기준으로 slot을 resolve합니다. markdown heading/item, JSONC object key/array index, 또는 JSONL line record입니다.
4. `set`의 경우 동일한 adapter를 통해 edited byte를 emit하여, kind가 지원하는 범위에서 file의 untouched part가 comment, line ending, 주변 formatting을 유지하게 합니다.

`resolve`와 `set`은 하나의 구체 target이 필요합니다. `find`는 탐색용 verb입니다. wildcard, union, predicate, ordinal을 구체 match로 확장하여, 쓸 대상을 하나 선택하기 전에 검사할 수 있게 합니다.

## 하위 command

| 하위 command            | 목적                                                                         |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | path의 구체 match를 출력합니다(또는 "not found").                            |
| `find <pattern>`        | wildcard / union / predicate path에 대한 match를 열거합니다.                 |
| `set <oc-path> <value>` | 구체 path의 leaf 또는 insertion target을 씁니다. `--dry-run`을 지원합니다.   |
| `validate <oc-path>`    | parse만 수행하며 구조적 breakdown(file / section / item / field)을 출력합니다. |
| `emit <file>`           | `parseXxx` + `emitXxx`를 통해 file을 round-trip합니다(byte-fidelity diagnostic). |

## 전역 flag

| Flag            | 목적                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| `--cwd <dir>`   | 이 directory를 기준으로 file slot을 resolve합니다(default: `process.cwd()`). |
| `--file <path>` | file slot의 resolved path를 override합니다(absolute access).              |
| `--json`        | JSON output을 강제합니다(stdout이 TTY가 아닐 때 default).                 |
| `--human`       | human output을 강제합니다(stdout이 TTY일 때 default).                     |
| `--dry-run`     | (`set`에서만) 실제로 쓰지 않고 쓰여질 byte를 출력합니다.                  |

## `oc://` 구문

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Slot 규칙: `field`에는 `item`이 필요하고, `item`에는 `section`이 필요합니다. 네 slot 전체에 적용됩니다.

- **Quoted segment** — `"a/b.c"`는 `/` 및 `.` separator를 그대로 통과합니다.
  Content는 byte-literal이며, quote 안에는 `"`와 `\`가 허용되지 않습니다.
  file slot도 quote-aware입니다. `oc://"skills/email-drafter"/Tools/$last`는
  `skills/email-drafter`를 단일 file path로 취급합니다.
- **Predicate** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Numeric op는 양쪽 모두 finite number로 coerce되어야 합니다.
- **Union** — `{a,b,c}`는 alternative 중 하나와 match합니다.
- **Wildcard** — `*`(single sub-segment) 및 `**`(zero-or-more,
  recursive). `find`는 이를 허용하며, `resolve`와 `set`은 ambiguous하므로 거부합니다.
- **Positional** — `$last`는 마지막 index / 마지막으로 선언된 key로 resolve됩니다.
- **Ordinal** — document order 기준 N번째 match에는 `#N`을 사용합니다.
- **Insertion marker** — keyed / indexed insertion에는 `+`, `+key`, `+nnn`을 사용합니다(`set`과 함께 사용).
- **Session scope** — `?session=cron-daily` 등입니다. Slot nesting과 직교합니다.
  Session value는 raw이며 percent-decoded되지 않습니다. control character 또는 reserved query delimiter(`?`, `&`, `%`)를 포함할 수 없습니다.

Quoted, predicate, union segment 밖의 reserved character(`?`, `&`, `%`)는 거부됩니다. Control character(U+0000-U+001F, U+007F)는 `session` query value를 포함해 어디서든 거부됩니다.

Canonical path에 대해서는 `formatOcPath(parseOcPath(path)) === path`가 보장됩니다. Non-canonical query parameter는 첫 번째 non-empty `session=` value를 제외하고 무시됩니다.

## file kind별 주소 지정

| Kind       | 주소 지정 모델                                                                            |
| ---------- | ----------------------------------------------------------------------------------------- |
| Markdown   | slug 기준 H2 section, slug 또는 `#N` 기준 bullet item, `[frontmatter]`를 통한 frontmatter. |
| JSONC/JSON | Object key와 array index. quote되지 않은 경우 dot은 nested sub-segment를 분리합니다.       |
| JSONL      | Top-level line address(`L1`, `L2`, `$last`) 이후 line 내부에서 JSONC-style descent.        |

`resolve`는 1-based line number와 함께 `root`, `node`, `leaf`, 또는 `insertion-point` 구조의 match를 반환합니다. Leaf value는 text와 `leafType`으로 노출되므로 Plugin 작성자는 kind별 AST shape에 의존하지 않고 preview를 render할 수 있습니다.

## Mutation contract

`set`은 하나의 구체 target을 씁니다.

- Markdown frontmatter value와 `- key: value` item field는 string leaf입니다.
  Markdown insertion은 section, frontmatter key, section item을 append하고, 변경된 file에 대해 canonical markdown shape를 render합니다.
- JSONC leaf write는 string value를 기존 leaf type(`string`, finite `number`, `true`/`false`, 또는 `null`)으로 coerce합니다. JSONC object 및 array insertion은 `<value>`를 JSON으로 parse하고, 일반 leaf write에는 `jsonc-parser` edit path를 사용하여 comment와 주변 formatting을 보존합니다.
- JSONL leaf write는 line 내부에서 JSONC처럼 coerce합니다. Whole-line replacement와 append는 `<value>`를 JSON으로 parse합니다. Rendered JSONL은 file의 dominant LF/CRLF line-ending convention을 보존합니다.

정확한 byte가 중요할 때는 user-visible write 전에 `--dry-run`을 사용하세요. 기반은 parse/emit round-trip에 대해 byte-identical output을 보존하지만, mutation은 kind에 따라 edited region 또는 file을 canonicalize할 수 있습니다.

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

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
openclaw path emit ./AGENTS.md
```

추가 grammar 예시:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

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

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## file kind별 recipe

동일한 다섯 verb가 kind 전체에서 작동합니다. 주소 지정 scheme은 file extension에 따라 dispatch합니다. 아래 예시는 PR description의 fixture를 사용합니다.

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

`[frontmatter]` predicate는 YAML frontmatter block을 address합니다. `tools`는 slug를 통해 `## Tools` heading과 match하며, item leaf는 source가 underscore를 사용하더라도(`send_email` → `send-email`) slug form을 유지합니다.

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
유지됩니다. 커밋하기 전에 먼저 `--dry-run`으로 실행하여 바이트를
확인하세요.

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
주소를 지정하고, 알고 있을 때는 정식 `LN` 세그먼트로 지정하세요.

## 하위 명령 참조

### `resolve <oc-path>`

단일 리프 또는 노드를 읽습니다. 와일드카드는 거부됩니다. 해당 경우에는
`find`를 사용하세요. 일치 항목이 있으면 `0`, 깨끗한 미스이면 `1`,
구문 분석 오류나 거부된 패턴이면 `2`로 종료합니다.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

와일드카드 / 조건자 / 유니온 패턴의 모든 일치 항목을 열거합니다. 하나
이상의 일치 항목이 있으면 `0`, 없으면 `1`로 종료합니다. 파일 슬롯
와일드카드는 `OC_PATH_FILE_WILDCARD_UNSUPPORTED`로 거부됩니다. 구체적인
파일을 전달하세요(다중 파일 글로빙은 후속 기능입니다).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

리프를 씁니다. 파일을 건드리지 않고 기록될 바이트를 미리 보려면
`--dry-run`과 함께 사용하세요. 쓰기에 성공하면 `0`, 서브스트레이트가
거부하면(예: 센티널 가드 적중) `1`, 구문 분석 오류이면 `2`로 종료합니다.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

`+key` 삽입 표시는 명명된 자식이 아직 없으면 생성합니다. `+nnn`과
단독 `+`는 각각 인덱스 삽입과 추가 삽입에 사용됩니다.

### `validate <oc-path>`

구문 분석 전용 검사입니다. 파일 시스템 접근은 없습니다. 변수를 치환하기
전에 템플릿 경로가 올바른 형식인지 확인하거나, 디버깅을 위해 구조적
분해를 보고 싶을 때 유용합니다.

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

유효하면 `0`, 유효하지 않으면(구조화된 `code`와 `message` 포함) `1`,
인수 오류이면 `2`로 종료합니다.

### `emit <file>`

파일을 종류별 파서와 이미터를 통해 왕복시킵니다. 정상 파일에서는 출력이
입력과 바이트 단위로 동일해야 합니다. 차이가 있다면 파서 버그 또는
센티널 적중을 의미합니다. 실제 입력에서 서브스트레이트 동작을
디버깅하는 데 유용합니다.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## 종료 코드

| 코드 | 의미                                                                        |
| ---- | --------------------------------------------------------------------------- |
| `0`  | 성공. (`resolve` / `find`: 하나 이상의 일치 항목. `set`: 쓰기 성공.)       |
| `1`  | 일치 항목 없음, 또는 `set`이 서브스트레이트에 의해 거부됨(시스템 수준 오류 없음). |
| `2`  | 인수 또는 구문 분석 오류.                                                   |

## 출력 모드

`openclaw path`는 TTY를 인식합니다. 터미널에서는 사람이 읽을 수 있는
출력을, stdout이 파이프되거나 리디렉션되면 JSON을 출력합니다. `--json`과
`--human`은 자동 감지를 재정의합니다.

## 참고

- `set`은 서브스트레이트의 emit 경로를 통해 바이트를 쓰며, 이 경로는
  삭제 센티널 가드를 자동으로 적용합니다. `__OPENCLAW_REDACTED__`를
  포함하는 리프(그 자체이거나 부분 문자열)는 쓰기 시점에 거부됩니다.
- JSONC 구문 분석과 리프 편집은 Plugin 로컬 `jsonc-parser` 의존성을
  사용하므로, 일반적인 리프 쓰기에서는 직접 만든 파서/재렌더링 경로를
  거치지 않고 주석과 형식이 보존됩니다.
- `path`는 LKG를 알지 못합니다. 파일이 LKG 추적 대상이면, 다음 observe
  호출이 승격 / 복구 여부를 결정합니다. LKG 승격/복구 수명주기를 통한
  원자적 다중 설정을 위한 `set --batch`는 LKG 복구 서브스트레이트와 함께
  계획되어 있습니다.

## 관련

- [CLI 참조](/ko/cli)
