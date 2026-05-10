---
read_when:
    - 터미널에서 워크스페이스 파일 안의 단일 리프를 검사하거나 편집하려고 합니다
    - 작업 공간 상태를 대상으로 스크립트를 작성하고 있으며 안정적이고 유형에 구애받지 않는 주소 지정 체계가 필요합니다
    - 자체 호스팅 Gateway에서 선택 사항인 `oc-path` Plugin을 활성화할지 결정하고 있습니다
summary: '번들로 제공되는 `oc-path` Plugin: `oc://` workspace-file 주소 지정 체계를 위한 `openclaw path` CLI를 제공합니다'
title: OC Path Plugin
x-i18n:
    generated_at: "2026-05-10T19:44:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

번들로 제공되는 `oc-path` Plugin은 `oc://` 워크스페이스 파일 주소 지정 체계를 위한 [`openclaw path`](/ko/cli/path) CLI를 추가합니다. OpenClaw 저장소의 `extensions/oc-path/` 아래에 포함되어 있지만 선택 사항입니다. 설치/빌드 후에도 활성화하기 전까지는 비활성 상태로 유지됩니다.

`oc://` 주소는 워크스페이스 파일 안의 단일 리프(또는 리프의 와일드카드 집합)를 가리킵니다. 이 Plugin은 현재 세 가지 종류의 파일을 이해합니다.

- **마크다운** (`.md`, `.mdx`): 프런트매터, 섹션, 항목, 필드
- **jsonc** (`.jsonc`, `.json5`, `.json`): 주석과 서식 보존
- **jsonl** (`.jsonl`, `.ndjson`): 라인 지향 레코드

자체 호스팅 사용자와 편집기 확장은 SDK에 직접 스크립팅하지 않고도 CLI를 사용해 단일 리프를 읽거나 씁니다. 에이전트와 후크는 이를 결정적 기반으로 취급하므로 바이트 충실도 왕복 처리와 수정 표시 센티널 가드가 파일 종류 전반에 일관되게 적용됩니다.

## 활성화해야 하는 이유

각 파일 형태마다 파서를 새로 만들지 않고도 스크립트, 후크 또는 로컬 에이전트 도구가 워크스페이스 상태의 정확한 한 부분을 가리키게 하려면 `oc-path`를 활성화하세요. 단일 `oc://` 주소는 마크다운 프런트매터 키, 섹션 항목, JSONC 구성 리프 또는 JSONL 이벤트 필드를 지칭할 수 있습니다.

이는 변경이 작고, 감사 가능하며, 반복 가능해야 하는 유지관리자 워크플로에 중요합니다. 값 하나를 검사하고, 일치하는 레코드를 찾고, 쓰기를 드라이런한 다음, 주석, 줄 끝, 주변 서식은 그대로 둔 채 해당 리프만 적용할 수 있습니다. 이를 선택형 Plugin으로 유지하면, 해당 기능이 필요 없는 설치 환경의 코어에 파서 의존성이나 CLI 표면을 넣지 않으면서 고급 사용자에게 주소 지정 기반을 제공할 수 있습니다.

활성화하는 일반적인 이유:

- **로컬 자동화**: 셸 스크립트가 별도의 마크다운, JSONC, JSONL 파싱 코드를 들고 다니는 대신 `openclaw path … --json`으로 워크스페이스 값 하나를 해석하거나 업데이트할 수 있습니다.
- **에이전트에 보이는 편집**: 에이전트가 쓰기 전에 주소가 지정된 리프 하나에 대한 드라이런 diff를 보여줄 수 있어, 자유 형식 파일 재작성보다 검토하기 쉽습니다.
- **편집기 통합**: 편집기가 제목 텍스트를 추측하지 않고 `oc://AGENTS.md/tools/gh`를 정확한 마크다운 노드와 줄 번호에 매핑할 수 있습니다.
- **진단**: `emit`은 파일을 파서와 이미터를 통해 왕복 처리하므로, 자동 편집에 의존하기 전에 파일 종류가 바이트 안정적인지 확인할 수 있습니다.

구체적인 예:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

이 Plugin은 의도적으로 더 높은 수준의 의미 체계 소유자가 아닙니다. 메모리 Plugin은 여전히 메모리 쓰기를 소유하고, 구성 명령은 여전히 전체 구성 관리를 소유하며, LKG 로직은 여전히 복원/승격을 소유합니다. `oc-path`는 이러한 더 높은 수준의 도구가 기반으로 삼을 수 있는 좁은 주소 지정 및 바이트 보존 파일 작업 계층입니다.

## 실행 위치

이 Plugin은 명령을 호출하는 호스트의 **`openclaw` CLI 내부 프로세스**에서 실행됩니다. 실행 중인 Gateway가 필요 없고 네트워크 소켓도 열지 않습니다. 모든 동사는 지정한 파일에 대한 순수 변환입니다.

Plugin 메타데이터는 `extensions/oc-path/openclaw.plugin.json`에 있습니다.

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false`는 이 Plugin을 Gateway 핫 경로에서 제외합니다. `onCommands:
["path"]`는 처음 `openclaw path …`를 실행할 때 CLI가 Plugin을 지연 로드하도록 하므로, 이 동사를 사용하지 않는 설치 환경은 비용을 지불하지 않습니다.

## 활성화

```bash
openclaw plugins enable oc-path
```

Gateway를 실행 중이라면 다시 시작하여 매니페스트 스냅샷이 새 상태를 반영하게 하세요. 단독 `openclaw path` 호출은 동일 호스트에서 즉시 작동합니다. CLI가 필요할 때 Plugin을 로드합니다.

비활성화:

```bash
openclaw plugins disable oc-path
```

## 의존성

모든 파서 의존성은 Plugin 로컬입니다. `oc-path`를 활성화해도 새 패키지가 코어 런타임으로 들어오지 않습니다.

| 의존성         | 목적                                                                |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | `resolve`, `find`, `set`, `validate`, `emit`의 하위 명령 연결. |
| `jsonc-parser` | 주석과 후행 쉼표를 유지한 JSONC 파싱 및 리프 편집.    |
| `markdown-it`  | 섹션 / 항목 / 필드 모델을 위한 마크다운 토큰화.         |

JSONL은 직접 구현된 상태로 유지됩니다. 라인 지향 파싱은 어떤 의존성보다 단순하며, 라인별 JSONC 파싱은 이미 `jsonc-parser`를 거칩니다.

## 제공 항목

| 표면                           | 제공 위치                                                |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` 파서 / 포매터          | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 종류별 파싱 / 방출 / 편집      | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| 범용 해석 / 찾기 / 설정        | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 수정 표시 센티널 가드          | `extensions/oc-path/src/oc-path/sentinel.ts`            |

현재 CLI가 유일한 공개 표면입니다. 기반 동사는 Plugin 내부 전용입니다. 소비자는 CLI를 사용하거나 SDK를 대상으로 자체 Plugin을 빌드합니다.

## 다른 Plugin과의 관계

- **`memory-*`**: 메모리 쓰기는 `oc-path`가 아니라 메모리 Plugin을 통해 수행됩니다. `oc-path`는 범용 파일 기반이며, 메모리 Plugin은 그 위에 자체 의미 체계를 계층화합니다.
- **LKG**: `path`는 Last-Known-Good 구성 복원을 알지 못합니다. 파일이 LKG 추적 대상이면 다음 `observe` 호출이 승격 또는 복구 여부를 결정합니다. LKG 승격/복구 수명 주기를 통한 원자적 다중 설정을 위한 `set --batch`는 LKG 복구 기반과 함께 계획되어 있습니다.

## 안전성

`set`은 기반의 방출 경로를 통해 원시 바이트를 쓰며, 이 경로는 수정 표시 센티널 가드를 자동으로 적용합니다. `__OPENCLAW_REDACTED__`를 포함한 리프(그 자체이든 부분 문자열이든)는 쓰기 시점에 `OC_EMIT_SENTINEL`로 거부됩니다. CLI는 또한 사람이 읽는 출력이나 JSON 출력에 출력하는 리터럴 센티널을 모두 제거하고 `[REDACTED]`로 대체하므로, 터미널 캡처와 파이프라인이 마커를 유출하지 않습니다.

## 관련

- [`openclaw path` CLI 참조](/ko/cli/path)
- [Plugin 관리](/ko/plugins/manage-plugins)
- [Plugin 빌드](/ko/plugins/building-plugins)
