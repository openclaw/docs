---
read_when:
    - QMD를 메모리 백엔드로 설정하려고 합니다
    - 재순위 지정이나 추가 인덱싱 경로 같은 고급 메모리 기능이 필요합니다
summary: BM25, 벡터, 재순위화 및 쿼리 확장을 지원하는 로컬 우선 검색 사이드카
title: QMD 메모리 엔진
x-i18n:
    generated_at: "2026-07-16T12:32:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b13017ead7e7340624a35e603a18216a5c23405cbab09e7f53b1e15d74d59d23
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd)는 OpenClaw와 함께 실행되는 로컬 우선 검색 사이드카입니다. BM25, 벡터 검색, 재순위화를 단일 바이너리로 결합하며, 워크스페이스 메모리 파일 외부의 콘텐츠도 인덱싱할 수 있습니다.

## 기본 제공 기능과 비교해 추가되는 기능

- 더 나은 재현율을 위한 **재순위화 및 쿼리 확장**.
- **추가 디렉터리 인덱싱** - 프로젝트 문서, 팀 노트 등 디스크의 모든 항목.
- **세션 트랜스크립트 인덱싱** - 이전 대화를 다시 불러옵니다.
- **완전한 로컬 실행** - 공식 llama.cpp 제공자 Plugin으로 실행되며
  GGUF 모델을 자동으로 다운로드합니다.
- **자동 폴백** - QMD를 사용할 수 없으면 OpenClaw가 중단 없이
  기본 제공 엔진으로 폴백합니다.

## 시작하기

### 사전 요구 사항

- QMD를 설치하십시오: `npm install -g @tobilu/qmd` 또는 `bun install -g @tobilu/qmd`
- 확장을 허용하는 SQLite 빌드(macOS에서는 `brew install sqlite`).
- QMD가 Gateway의 `PATH`에 있어야 합니다.
- macOS와 Linux에서는 별도 설정 없이 작동합니다. Windows는 WSL2를 통해 사용하는 것이 가장 잘 지원됩니다.

### 활성화

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw는 `~/.openclaw/agents/<agentId>/qmd/` 아래에 독립적인 QMD 홈을 생성하고
사이드카 수명 주기를 자동으로 관리합니다. 컬렉션, 업데이트, 임베딩 실행을 모두 자동으로 처리합니다.
현재 QMD 컬렉션 및 MCP 쿼리 형식을 우선 사용하지만, 필요한 경우
대체 컬렉션 패턴 플래그와 이전 MCP 도구 이름으로 폴백합니다.
시작 시 조정 과정에서는 같은 이름의 이전 QMD 컬렉션이 여전히
존재하는 경우 오래된 관리형 컬렉션을 정식 패턴으로 다시 생성합니다.

## 사이드카 작동 방식

- OpenClaw는 워크스페이스 메모리 파일과 구성된 모든
  `memory.qmd.paths`에서 컬렉션을 생성한 다음, QMD 관리자가
  열릴 때와 이후 주기적으로(`memory.qmd.update.interval`, 기본값
  `5m`) `qmd update`을 실행합니다. 새로 고침은 프로세스 내 파일 시스템
  크롤링이 아니라 QMD 하위 프로세스를 통해 실행됩니다. 의미론적 검색 모드에서는
  `qmd embed`도 실행합니다
  (`memory.qmd.update.embedInterval`, 기본값 `60m`).
- 기본 워크스페이스 컬렉션은 `MEMORY.md`와 `memory/`
  트리를 추적합니다. 소문자 `memory.md`는 루트 메모리 파일로 인덱싱되지 않습니다.
- QMD 자체 스캐너는 숨겨진 경로와 `.git`, `.cache`, `node_modules`, `vendor`, `dist`,
  `build` 같은 일반적인 종속성/빌드 디렉터리를 무시합니다.
  Gateway 시작 시에는 기본적으로 QMD를 초기화하지 않으므로
  (`memory.qmd.update.startup`의 기본값은 `off`),
  콜드 부팅 시 메모리를 처음 사용하기 전에 메모리 런타임을 가져오거나
  장기 실행 감시자를 생성하지 않습니다.
- Gateway 시작 시 QMD를 초기화하려면 `memory.qmd.update.startup`을 `idle` 또는 `immediate`로 설정하십시오.
  `memory.qmd.update.onBoot`의 기본값은 `true`이며
  시작 시 초기 새로 고침을 실행합니다. 즉시 새로 고침을 건너뛰려면
  `false`로 설정하십시오(업데이트 또는 임베딩 간격이 구성되어 있으면
  장기 실행 관리자는 계속 열리므로 QMD가 정기 감시자/타이머를 계속 관리합니다).
- 검색에는 구성된 `searchMode`을 사용합니다(기본값: `search`; `vsearch` 및
  `query`도 지원). `search`은 BM25 전용이므로 OpenClaw는 이 모드에서 의미론적
  벡터 준비 상태 검사와 임베딩 유지 관리를 건너뜁니다. 모드가
  실패하면 OpenClaw는 `qmd query`로 다시 시도합니다.
- `searchMode`가 `query`인 경우, 재순위화 도구 없이
  QMD의 하이브리드 쿼리 경로를 사용하려면 `memory.qmd.rerank`을 `false`로 설정하십시오
  (QMD 2.1 이상 필요). OpenClaw는 직접 QMD CLI 경로에
  `--no-rerank`을, QMD의 MCP 쿼리 도구에
  `rerank: false`을 전달합니다.
- 다중 컬렉션 필터 지원을 명시하는 QMD 릴리스에서는 OpenClaw가
  동일한 소스의 컬렉션을 하나의 QMD 검색 호출로 그룹화합니다. 이전 QMD 릴리스에서는
  호환 가능한 컬렉션별 폴백을 유지합니다.
- QMD가 완전히 실패하면 OpenClaw는 기본 제공 SQLite 엔진으로 폴백합니다.
  바이너리 누락이나 손상된 사이드카 종속성으로 재시도 폭주가 발생하지 않도록
  열기 실패 후 반복되는 채팅 턴 시도에는 잠시 백오프를 적용합니다.
  `openclaw memory status` 및 일회성 CLI 검사는 여전히 QMD를
  직접 다시 확인합니다.

<Info>
첫 번째 검색은 느릴 수 있습니다. QMD는 최초 `qmd query` 실행 시
재순위화 및 쿼리 확장을 위한 GGUF 모델(약 2GB)을 자동으로 다운로드합니다.
</Info>

## 검색 성능 및 호환성

OpenClaw는 현재 및 이전 QMD 설치 모두와 호환되도록 QMD 검색 경로를
유지합니다.

시작 시 OpenClaw는 관리자마다 설치된 QMD 도움말 텍스트를 한 번 확인합니다.
바이너리가 다중 컬렉션 필터 지원을 명시하면 OpenClaw는
동일한 소스의 모든 컬렉션을 하나의 명령으로 검색합니다.

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

이를 통해 영구 메모리 컬렉션마다 QMD 하위 프로세스를 하나씩 시작하지 않아도 됩니다.
세션 트랜스크립트 컬렉션은 별도의 소스 그룹에 유지되므로 혼합된
`memory` + `sessions` 검색에서도 두 소스의 입력이 결과 다양화 도구에
제공됩니다.

이전 QMD 빌드는 하나의 컬렉션 필터만 허용합니다. OpenClaw가 이러한
빌드를 감지하면 호환성 경로를 유지하여 각 컬렉션을
개별적으로 검색한 후 결과를 병합하고 중복을 제거합니다.

설치된 계약을 수동으로 확인하려면 다음을 실행하십시오.

```bash
qmd --help | grep -i collection
```

현재 QMD 도움말에는 하나 이상의 컬렉션을 대상으로 지정하는 내용이 있습니다. 이전 도움말은
일반적으로 단일 컬렉션을 설명합니다.

## 모델 재정의

QMD 모델 환경 변수는 Gateway 프로세스에서 변경 없이 전달되므로
새 OpenClaw 구성을 추가하지 않고도 QMD를 전역적으로 조정할 수 있습니다.

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

임베딩 모델을 변경한 후에는 인덱스가 새 벡터 공간과 일치하도록 임베딩을
다시 실행하십시오.

## 추가 경로 인덱싱

검색할 수 있도록 QMD가 추가 디렉터리를 가리키게 하십시오.

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

추가 경로의 스니펫은 검색 결과에 `qmd/<collection>/<relative-path>`로
표시됩니다. `memory_get`은 이 접두사를 인식하고 올바른
컬렉션 루트에서 읽습니다.

## 세션 트랜스크립트 인덱싱

이전 대화를 다시 불러올 수 있도록 세션 인덱싱을 활성화하십시오. QMD에는 일반
`memorySearch` 세션 소스와 QMD 트랜스크립트 내보내기 도구가 모두 필요합니다.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        experimental: { sessionMemory: true },
        sources: ["memory", "sessions"],
      },
    },
  },
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

트랜스크립트는 정제된 사용자/어시스턴트 턴으로 내보내지며
`~/.openclaw/agents/<id>/qmd/sessions/` 아래의 전용 QMD 컬렉션에 저장됩니다.
`memorySearch.experimental.sessionMemory`만 설정하면 트랜스크립트가
QMD로 내보내지지 않습니다.

세션 검색 결과는 여전히
[`tools.sessions.visibility`](/ko/gateway/config-tools#toolssessions)에 의해 필터링됩니다.
기본 `tree` 가시성은 관련 없는 동일 에이전트 세션을 노출하지 않습니다.
Gateway가 디스패치한 세션을 별도의 DM 세션에서 다시 불러올 수 있어야 한다면
`tools.sessions.visibility: "agent"`을 의도적으로 설정하십시오.

## 검색 범위

기본적으로 QMD 검색 결과는 직접 세션에서만 표시되며
그룹 또는 채널 채팅에서는 표시되지 않습니다. 이를 변경하려면 `memory.qmd.scope`을 구성하십시오.

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

위 스니펫은 실제 기본 규칙입니다. 범위가 검색을 거부하면
OpenClaw는 파생된 채널 및 채팅 유형과 함께 경고를 기록하므로 빈
결과의 원인을 더 쉽게 디버그할 수 있습니다.

## 인용

`memory.citations`가 `auto` 또는 `on`이면 검색 스니펫에
`Source: <path>#L<line>`(또는 `#L<start>-L<end>`) 바닥글이 추가됩니다. `auto`
모드에서는 직접 채팅 세션에만 바닥글이 추가됩니다.
에이전트에 내부적으로 경로를 계속 전달하면서 바닥글을 생략하려면
`memory.citations = "off"`으로 설정하십시오.

## 사용 시점

다음이 필요한 경우 QMD를 선택하십시오.

- 더 높은 품질의 결과를 위한 재순위화.
- 워크스페이스 외부의 프로젝트 문서 또는 노트 검색.
- 과거 세션 대화 다시 불러오기.
- API 키가 필요 없는 완전한 로컬 검색.

더 간단한 설정에서는 추가 종속성 없이
[기본 제공 엔진](/ko/concepts/memory-builtin)을 사용할 수 있습니다.

## 문제 해결

**QMD를 찾을 수 없습니까?** 바이너리가 Gateway의 `PATH`에 있는지 확인하십시오. OpenClaw가
서비스로 실행되는 경우 심볼릭 링크를 생성하십시오.
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

셸에서 `qmd --version`이 작동하지만 OpenClaw가 여전히
`spawn qmd ENOENT`을 보고한다면 Gateway 프로세스의 `PATH`가
대화형 셸과 다를 가능성이 큽니다. 바이너리를 명시적으로 고정하십시오.

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

QMD가 설치된 환경에서 `command -v qmd`을 사용한 다음
`openclaw memory status --deep`로 다시 확인하십시오.

**첫 검색이 매우 느립니까?** QMD는 처음 사용할 때 GGUF 모델을 다운로드합니다. OpenClaw가 사용하는 것과 동일한 XDG 디렉터리를 사용하여
`qmd query "test"`로 미리 준비하십시오.

**검색 중 QMD 하위 프로세스가 많이 생성됩니까?** 가능하면 QMD를 업데이트하십시오. OpenClaw는
설치된 QMD가 다중 `-c` 필터 지원을 명시하는 경우에만 동일한 소스의 다중 컬렉션 검색에
프로세스 하나를 사용합니다. 그렇지 않으면 정확성을 위해 이전 컬렉션별 폴백을
유지합니다.

**BM25 전용 QMD가 계속 llama.cpp 빌드를 시도합니까?**
`memory.qmd.searchMode = "search"`을 설정하십시오. OpenClaw는 해당 모드를
어휘 전용으로 처리하여 QMD 벡터 상태 검사와 임베딩 유지 관리를 건너뛰고,
의미론적 준비 상태 검사는 `vsearch` 또는 `query` 설정에 맡깁니다.

**검색 시간이 초과됩니까?** `memory.qmd.limits.timeoutMs`(기본값: 4000ms)을 늘리십시오.
느린 하드웨어에서는 예를 들어 `120000`처럼 더 높게 설정하십시오. 이 제한은
에이전트의 `memory_search` 호출 중 QMD 자체 검색 명령에 적용됩니다. 설정, 동기화,
기본 제공 폴백 및 보조 코퍼스 작업에는 각각 별도의 더 짧은 제한 시간이 적용됩니다.

**그룹 또는 채널 채팅에서 결과가 비어 있습니까?** 직접 세션만 허용하는
기본 `memory.qmd.scope`에서는 정상적인 동작입니다. 해당 위치에서도 QMD 결과를 사용하려면
`group` 또는 `channel` 채팅 유형에 대한
`allow` 규칙을 추가하십시오.

**루트 메모리 검색 범위가 갑자기 너무 넓어졌습니까?** Gateway를 다시 시작하거나
다음 시작 시 조정이 실행될 때까지 기다리십시오. OpenClaw는 같은 이름의 충돌을
감지하면 오래된 관리형 컬렉션을 정식 `MEMORY.md` 및 `memory/`
패턴으로 다시 생성합니다.

**워크스페이스에 표시되는 임시 저장소로 인해 `ENAMETOOLONG` 또는 인덱싱 오류가 발생합니까?**
QMD 순회는 OpenClaw의 기본 제공 심볼릭 링크 규칙이 아니라 기반 QMD 스캐너를 따릅니다.
QMD가 순환 안전 순회 또는 명시적 제외 제어를 제공할 때까지 임시 모노레포 체크아웃을
`.tmp/` 같은 숨겨진 디렉터리나 인덱싱된 QMD 루트 외부에 두십시오.

## 구성

전체 구성 표면(`memory.qmd.*`), 검색 모드, 업데이트 간격,
범위 규칙 및 기타 모든 옵션은
[메모리 구성 참조](/ko/reference/memory-config)를 확인하십시오.

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [기본 제공 메모리 엔진](/ko/concepts/memory-builtin)
- [Honcho 메모리](/ko/concepts/memory-honcho)
