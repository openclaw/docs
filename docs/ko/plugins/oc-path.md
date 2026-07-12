---
read_when:
    - 터미널에서 워크스페이스 파일 내의 단일 리프를 검사하거나 편집하려고 합니다
    - 워크스페이스 상태를 대상으로 스크립트를 작성하며 종류에 구애받지 않는 안정적인 주소 지정 체계가 필요합니다
    - 자체 호스팅 Gateway에서 선택 사항인 `oc-path` Plugin을 활성화할지 결정하고 있습니다.
summary: '번들 `oc-path` Plugin: `oc://` 작업 공간 파일 주소 지정 체계를 위한 `openclaw path` CLI를 제공합니다.'
title: OC 경로 Plugin
x-i18n:
    generated_at: "2026-07-12T15:34:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

번들로 제공되는 `oc-path` Plugin은 `oc://` 워크스페이스 파일 주소 지정 체계를 위한 [`openclaw path`](/ko/cli/path) CLI를 추가합니다. 이 Plugin은 OpenClaw 저장소의 `extensions/oc-path/`에 포함되어 있지만 선택적으로 활성화해야 합니다. 설치하거나 빌드해도 활성화하기 전까지는 작동하지 않습니다.

`oc://` 주소는 워크스페이스 파일 내부의 단일 리프 또는 와일드카드로 지정한 리프 집합을 가리킵니다. 이 Plugin은 다음 네 가지 파일 유형을 인식합니다.

- **markdown** (`.md`): 프런트매터, 섹션, 항목, 필드
- **jsonc** (`.jsonc`, `.json`): 주석과 서식을 보존함
- **jsonl** (`.jsonl`, `.ndjson`): 줄 단위 레코드
- **yaml** (`.yaml`, `.yml`, `.lobster`): `yaml` 패키지의 `Document` API를 통한 맵/시퀀스/스칼라 노드

자체 호스팅 운영자와 편집기 확장 기능은 SDK를 직접 대상으로 스크립트를 작성하지 않고도 CLI로 단일 리프를 읽거나 씁니다. 에이전트와 훅은 이를 결정론적 기반 계층으로 사용하므로 바이트 충실도를 유지하는 왕복 변환과 삭제 표시 센티널 보호 기능이 모든 파일 유형에 일관되게 적용됩니다. 전체 문법, 동작별 플래그 목록, 파일 유형별 실습 예시는 [CLI 참조](/ko/cli/path)를 확인하십시오. 이 페이지에서는 Plugin을 활성화해야 하는 이유와 활성화 방법을 설명합니다.

## 활성화해야 하는 이유

스크립트, 훅 또는 로컬 에이전트 도구가 파일 형태별 전용 파서 없이 워크스페이스 상태의 정확한 일부를 가리켜야 할 때 `oc-path`를 활성화하십시오. 하나의 `oc://` 주소로 마크다운 프런트매터 키, 섹션 항목, JSONC 구성 리프, JSONL 이벤트 필드 또는 YAML 워크플로 단계를 지정할 수 있습니다.

이는 변경 사항을 작고 감사 가능하며 반복 가능하게 유지해야 하는 유지관리자 워크플로에 중요합니다. 하나의 값을 검사하고, 일치하는 레코드를 찾고, 쓰기를 시험 실행한 다음, 주석과 줄 끝 문자 및 주변 서식은 그대로 두고 해당 리프만 적용할 수 있습니다.

일반적인 활성화 사유는 다음과 같습니다.

- **로컬 자동화**: 셸 스크립트가 마크다운, JSONC, JSONL, YAML별 파싱 코드를 각각 포함하는 대신 `openclaw path … --json`으로 워크스페이스 값 하나를 확인하거나 업데이트합니다.
- **에이전트가 확인할 수 있는 편집**: 에이전트가 주소로 지정된 리프 하나를 쓰기 전에 시험 실행 차이를 표시하므로 자유 형식으로 파일 전체를 다시 작성하는 것보다 검토하기 쉽습니다.
- **편집기 통합**: 편집기가 제목 텍스트를 추측하지 않고 `oc://AGENTS.md/tools/gh`를 정확한 마크다운 노드와 줄 번호에 매핑합니다.
- **진단**: `emit`은 파서와 이미터를 통해 파일을 왕복 변환하므로 자동 편집에 의존하기 전에 해당 파일 유형이 바이트 단위로 안정적인지 확인할 수 있습니다.

```bash
# 이 구성에서 GitHub Plugin이 활성화되어 있습니까?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# 이 세션 로그에는 어떤 도구 호출 이름이 나타납니까?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# 이 작은 구성 편집은 어떤 바이트를 기록합니까?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path`는 의도적으로 상위 수준 의미 체계의 소유자가 아닙니다. 메모리 Plugin은 계속 메모리 쓰기를 담당하고, 구성 명령은 계속 전체 구성 관리를 담당하며, 마지막 정상 상태(LKG) 구성 복구는 계속 복원과 승격을 담당합니다. `oc-path`는 이러한 상위 수준 도구가 기반으로 사용할 수 있는 범위가 좁은 주소 지정 및 바이트 보존 파일 작업 계층입니다.

## 실행 위치

이 Plugin은 명령을 호출하는 호스트의 **`openclaw` CLI 프로세스 내부에서** 실행됩니다. 실행 중인 Gateway가 필요하지 않으며 네트워크 소켓도 열지 않습니다. 모든 동작은 지정한 파일에 대한 순수 변환입니다.

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

`onStartup: false`는 Plugin을 Gateway 시작 경로에서 제외합니다. `commandAliases`와 `activation.onCommands`는 `openclaw path …`를 처음 실행할 때 CLI가 Plugin을 지연 로드하도록 지정하므로 이 동작을 사용하지 않는 설치 환경에는 비용이 발생하지 않습니다.

## 활성화

```bash
openclaw plugins enable oc-path
```

새 상태가 매니페스트 스냅샷에 반영되도록 Gateway를 실행 중이라면 다시 시작하십시오. 동일한 호스트에서는 별도의 조건 없이 `openclaw path` 호출이 즉시 작동하며, CLI가 필요할 때 Plugin을 로드합니다.

비활성화하려면 다음 명령을 사용하십시오.

```bash
openclaw plugins disable oc-path
```

## 종속성

모든 파서 종속성은 Plugin에 로컬로 포함되어 있으므로 `oc-path`를 활성화해도 코어 런타임에 새 패키지가 추가되지 않습니다.

| 종속성         | 용도                                                                   |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | `resolve`, `find`, `set`, `validate`, `emit` 하위 명령 연결.           |
| `jsonc-parser` | 주석과 후행 쉼표를 유지하는 JSONC 구문 분석 및 리프 편집.              |
| `markdown-it`  | 섹션/항목/필드 모델을 위한 마크다운 토큰화.                            |
| `yaml`         | 주석과 흐름 스타일을 유지하는 YAML `Document` 구문 분석/출력/편집.     |

JSONL은 직접 구현된 방식을 유지합니다. 줄 단위 구문 분석은 어떤 종속성을 사용하는 것보다 간단하며, 줄별 구문 분석은 이미 `jsonc-parser`를 거칩니다.

## 제공 기능

| 표면                           | 제공 위치                                               |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path` CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://` 파서/포매터            | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| 유형별 구문 분석/출력/편집     | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| 범용 확인/검색/설정            | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| 삭제 표시 센티널 보호 기능     | `extensions/oc-path/src/oc-path/sentinel.ts`            |

현재 공개 표면은 CLI뿐입니다. 기반 계층의 동작은 Plugin 내부 전용입니다. 소비자는 CLI를 사용하거나 SDK를 기반으로 자체 Plugin을 빌드합니다.

## 다른 Plugin과의 관계

- **`memory-*`**: 메모리 쓰기는 `oc-path`가 아닌 메모리 Plugin을 통해 수행합니다. `oc-path`는 일반 파일 기반 계층이며, 메모리 Plugin은 그 위에 자체 의미 체계를 구성합니다.
- **LKG**: `path`는 마지막 정상 상태 구성 복원을 인식하지 않습니다. `path`를 통해 편집한 파일이 LKG 추적 대상이기도 하다면 다음 구성 관찰 주기에서 해당 파일을 승격할지 복구할지 결정합니다. `path` 편집은 해당 파일에 대한 다른 직접 쓰기와 동일하게 취급하십시오.

## 안전성

`set`은 기반 계층의 출력 경로를 통해 원시 바이트를 기록하며, 이 경로는 삭제 표시 센티널 보호 기능을 자동으로 적용합니다. `__OPENCLAW_REDACTED__`를 그대로 포함하거나 부분 문자열로 포함하는 리프는 쓰기 시 `OC_EMIT_SENTINEL` 오류로 거부됩니다. 또한 CLI는 출력하는 모든 사람용 또는 JSON 출력에서 센티널 리터럴을 제거하고 `[REDACTED]`로 대체하므로 터미널 캡처와 파이프라인에 해당 마커가 노출되지 않습니다.

## 관련 항목

- [`openclaw path` CLI 참조](/ko/cli/path)
- [Plugin 관리](/ko/plugins/manage-plugins)
- [Plugin 빌드](/ko/plugins/building-plugins)
