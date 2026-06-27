---
read_when:
    - 터미널에서 작업공간 파일의 단일 리프를 검사하거나 편집하려는 경우
    - 작업공간 상태를 스크립트로 다루며 종류에 구애받지 않는 안정적인 주소 지정 체계가 필요합니다
    - 자체 호스팅 Gateway에서 선택적 `oc-path` Plugin을 활성화할지 결정하고 있습니다
summary: '번들 `oc-path` Plugin: `oc://` 작업 영역 파일 주소 지정 체계를 위한 `openclaw path` CLI를 제공합니다'
title: OC 경로 Plugin
x-i18n:
    generated_at: "2026-06-27T17:47:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

번들된 `oc-path` Plugin은 `oc://` 워크스페이스 파일 주소 지정 스킴을 위한 [`openclaw path`](/ko/cli/path) CLI를 추가합니다. 이는 OpenClaw 저장소의 `extensions/oc-path/` 아래에 포함되어 제공되지만 옵트인 방식입니다. 설치/빌드 후에도 사용자가 활성화할 때까지 비활성 상태로 남습니다.

`oc://` 주소는 워크스페이스 파일 안의 단일 리프(또는 와일드카드 리프 집합)를 가리킵니다. 현재 이 Plugin은 네 가지 파일 종류를 이해합니다.

- **markdown** (`.md`, `.mdx`): frontmatter, 섹션, 항목, 필드
- **jsonc** (`.jsonc`, `.json5`, `.json`): 주석과 서식을 보존
- **jsonl** (`.jsonl`, `.ndjson`): 줄 단위 레코드
- **yaml** (`.yaml`, `.yml`, `.lobster`): YAML 문서 API를 통한 맵/시퀀스/스칼라 노드

셀프 호스터와 에디터 확장은 SDK를 직접 스크립팅하지 않고 CLI를 사용해 단일 리프를 읽거나 씁니다. 에이전트와 훅은 이를 결정적 기반으로 취급하므로 바이트 충실도 왕복 처리와 수정 감춤 센티널 가드가 모든 종류에 균일하게 적용됩니다.

## 활성화하는 이유

각 파일 형태마다 파서를 새로 만들지 않고 스크립트, 훅, 로컬 에이전트 도구가 워크스페이스 상태의 정확한 한 부분을 가리키게 하려면 `oc-path`를 활성화하세요. 하나의 `oc://` 주소로 markdown frontmatter 키, 섹션 항목, JSONC 구성 리프, JSONL 이벤트 필드, YAML 워크플로 단계의 이름을 지정할 수 있습니다.

이는 변경이 작고, 감사 가능하며, 반복 가능해야 하는 유지관리자 워크플로에서 중요합니다. 값 하나를 검사하고, 일치하는 레코드를 찾고, 쓰기를 dry-run한 다음, 주석, 줄 끝, 주변 서식은 그대로 두고 해당 리프만 적용할 수 있습니다. 이를 옵트인 Plugin으로 유지하면, 해당 기능이 필요 없는 설치 환경의 코어에 파서 의존성이나 CLI 표면을 넣지 않으면서 파워 유저에게 주소 지정 기반을 제공할 수 있습니다.

일반적인 활성화 이유는 다음과 같습니다.

- **로컬 자동화**: 셸 스크립트가 별도의 markdown, JSONC, JSONL, YAML 파싱 코드를 들고 다니는 대신 `openclaw path … --json`으로 워크스페이스 값 하나를 해석하거나 업데이트할 수 있습니다.
- **에이전트에 보이는 편집**: 에이전트가 쓰기 전에 주소로 지정된 리프 하나에 대한 dry-run diff를 보여줄 수 있어, 자유 형식 파일 재작성보다 검토하기 쉽습니다.
- **에디터 통합**: 에디터가 헤딩 텍스트를 추측하지 않고 `oc://AGENTS.md/tools/gh`를 정확한 markdown 노드와 줄 번호에 매핑할 수 있습니다.
- **진단**: `emit`은 파서와 emitter를 통해 파일을 왕복 처리하므로, 자동 편집에 의존하기 전에 파일 종류가 바이트 안정적인지 확인할 수 있습니다.

구체적인 예시는 다음과 같습니다.

```bash
# 이 구성에서 GitHub Plugin이 활성화되어 있나요?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# 이 세션 로그에 어떤 도구 호출 이름이 나타나나요?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# 이 작은 구성 편집은 어떤 바이트를 쓰게 되나요?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

이 Plugin은 의도적으로 더 높은 수준의 의미 체계 소유자가 아닙니다. 메모리 Plugin은 여전히 메모리 쓰기를 소유하고, 구성 명령은 여전히 전체 구성 관리를 소유하며, LKG 로직은 여전히 복원/승격을 소유합니다. `oc-path`는 이러한 상위 수준 도구가 그 위에 구축할 수 있는 좁은 주소 지정 및 바이트 보존 파일 작업 계층입니다.

## 실행 위치

이 Plugin은 명령을 호출하는 호스트의 **`openclaw` CLI 내부 인프로세스**에서 실행됩니다. 실행 중인 Gateway가 필요하지 않으며 네트워크 소켓을 열지 않습니다. 모든 동사는 사용자가 가리키는 파일에 대한 순수 변환입니다.

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

`onStartup: false`는 Plugin을 Gateway hot path 밖에 둡니다. `onCommands: ["path"]`는 처음 `openclaw path …`를 실행할 때 CLI가 Plugin을 지연 로드하도록 지시하므로, 해당 동사를 전혀 사용하지 않는 설치 환경은 비용을 지불하지 않습니다.

## 활성화

```bash
openclaw plugins enable oc-path
```

Gateway를 실행 중이라면 다시 시작하여 매니페스트 스냅샷이 새 상태를 반영하게 하세요. 같은 호스트에서 직접 실행하는 `openclaw path` 호출은 즉시 동작합니다. CLI가 필요할 때 Plugin을 로드합니다.

비활성화하려면 다음을 사용하세요.

```bash
openclaw plugins disable oc-path
```

## 의존성

모든 파서 의존성은 Plugin 로컬입니다. `oc-path`를 활성화해도 코어 런타임에 새 패키지를 끌어오지 않습니다.

| 의존성         | 목적                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | `resolve`, `find`, `set`, `validate`, `emit`의 하위 명령 연결.         |
| `jsonc-parser` | 주석과 trailing comma를 유지한 JSONC 파싱 및 리프 편집.                |
| `markdown-it`  | 섹션 / 항목 / 필드 모델을 위한 Markdown 토큰화.                        |
| `yaml`         | 주석과 flow style을 유지한 YAML `Document` 파싱 / emit / 편집.          |

JSONL은 직접 구현된 상태로 유지됩니다. 줄 단위 파싱은 어떤 의존성보다 단순하며, 줄별 JSONC 파싱은 이미 `jsonc-parser`를 거칩니다.

## 제공 기능

| 표면                           | 제공 위치                                                |
| ------------------------------ | -------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                 |
| `oc://` 파서 / 포매터          | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| 종류별 파싱 / emit / 편집      | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`   |
| 범용 resolve / find / set      | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts`  |
| 수정 감춤 센티널 가드          | `extensions/oc-path/src/oc-path/sentinel.ts`             |

현재 CLI가 유일한 공개 표면입니다. 기반 동사는 Plugin 내부 전용입니다. 소비자는 CLI를 사용하거나 SDK를 대상으로 자체 Plugin을 빌드합니다.

## 다른 Plugin과의 관계

- **`memory-*`**: 메모리 쓰기는 `oc-path`가 아니라 메모리 Plugin을 통해 수행됩니다. `oc-path`는 범용 파일 기반이며, 메모리 Plugin은 그 위에 자체 의미 체계를 계층화합니다.
- **LKG**: `path`는 Last-Known-Good 구성 복원에 대해 알지 못합니다. 파일이 LKG 추적 대상이면, 다음 `observe` 호출이 승격할지 복구할지 결정합니다. LKG 승격/복구 수명주기를 통한 원자적 다중 set을 위한 `set --batch`는 LKG 복구 기반과 함께 계획되어 있습니다.

## 안전성

`set`은 기반의 emit 경로를 통해 원시 바이트를 쓰며, 이 경로는 수정 감춤 센티널 가드를 자동으로 적용합니다. `__OPENCLAW_REDACTED__`를 포함한 리프는 그대로이든 부분 문자열이든 쓰기 시점에 `OC_EMIT_SENTINEL`로 거부됩니다. CLI는 또한 사람이 읽는 출력이나 JSON 출력에 나타나는 리터럴 센티널을 `[REDACTED]`로 바꾸어 제거하므로, 터미널 캡처와 파이프라인이 마커를 유출하지 않습니다.

## 관련 항목

- [`openclaw path` CLI 참조](/ko/cli/path)
- [Plugin 관리](/ko/plugins/manage-plugins)
- [Plugin 빌드](/ko/plugins/building-plugins)
