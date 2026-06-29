---
read_when:
    - QMD를 메모리 백엔드로 설정하려고 합니다
    - '고급 메모리 기능(예: 재순위화 또는 추가 인덱싱된 경로)을 원합니다'
summary: BM25, 벡터, 재순위화, 쿼리 확장을 갖춘 로컬 우선 검색 사이드카
title: QMD 메모리 엔진
x-i18n:
    generated_at: "2026-06-28T22:33:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 14af147882829451f026f0b9b6cc052c6e2129626a4ab0d0b1c7b77a31c1c050
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd)는 OpenClaw와 함께 실행되는 로컬 우선 검색 사이드카입니다. BM25, 벡터 검색, 재순위화를 단일 바이너리로 결합하며, 작업공간 메모리 파일을 넘어서는 콘텐츠도 인덱싱할 수 있습니다.

## 기본 제공 기능 대비 추가되는 점

- 더 나은 재현율을 위한 **재순위화 및 쿼리 확장**.
- **추가 디렉터리 인덱싱** -- 프로젝트 문서, 팀 노트, 디스크의 모든 항목.
- **세션 대화 기록 인덱싱** -- 이전 대화 불러오기.
- **완전 로컬** -- 공식 llama.cpp 제공자 Plugin으로 실행되며 GGUF 모델을 자동 다운로드합니다.
- **자동 대체** -- QMD를 사용할 수 없으면 OpenClaw가 기본 제공 엔진으로 매끄럽게 대체합니다.

## 시작하기

### 사전 요구 사항

- QMD 설치: `npm install -g @tobilu/qmd` 또는 `bun install -g @tobilu/qmd`
- 확장을 허용하는 SQLite 빌드(macOS에서는 `brew install sqlite`).
- QMD가 Gateway의 `PATH`에 있어야 합니다.
- macOS와 Linux는 별도 설정 없이 작동합니다. Windows는 WSL2를 통한 사용이 가장 잘 지원됩니다.

### 활성화

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw는 `~/.openclaw/agents/<agentId>/qmd/` 아래에 자체 포함형 QMD 홈을 만들고 사이드카 수명 주기를 자동으로 관리합니다. 컬렉션, 업데이트, 임베딩 실행이 자동으로 처리됩니다. 현재 QMD 컬렉션 및 MCP 쿼리 형식을 우선 사용하지만, 필요할 때는 대체 컬렉션 패턴 플래그와 이전 MCP 도구 이름으로도 대체합니다. 부팅 시 조정은 같은 이름의 이전 QMD 컬렉션이 아직 존재할 때 오래된 관리형 컬렉션을 다시 표준 패턴으로 재생성하기도 합니다.

## 사이드카 작동 방식

- OpenClaw는 작업공간 메모리 파일과 구성된 모든 `memory.qmd.paths`에서 컬렉션을 만든 다음, QMD 관리자가 열릴 때와 이후 주기적으로(기본값 5분마다) `qmd update`를 실행합니다. 이러한 새로 고침은 프로세스 내부 파일시스템 크롤이 아니라 QMD 하위 프로세스를 통해 실행됩니다. 의미 기반 모드는 `qmd embed`도 실행합니다.
- 기본 작업공간 컬렉션은 `MEMORY.md`와 `memory/` 트리를 추적합니다. 소문자 `memory.md`는 루트 메모리 파일로 인덱싱되지 않습니다.
- QMD 자체 스캐너는 숨김 경로와 `.git`, `.cache`, `node_modules`, `vendor`, `dist`, `build` 같은 일반적인 의존성/빌드 디렉터리를 무시합니다. Gateway 시작은 기본적으로 QMD를 초기화하지 않으므로, 콜드 부팅은 메모리가 처음 사용되기 전에 메모리 런타임을 가져오거나 장기 실행 감시자를 만들지 않습니다.
- 그래도 Gateway 시작 시 QMD를 초기화하려면 `memory.qmd.update.startup`을 `idle` 또는 `immediate`로 설정하세요. `memory.qmd.update.onBoot: true`이면 시작 시 초기 새로 고침을 실행합니다. `onBoot: false`이면 시작 시 해당 즉시 새로 고침은 건너뛰지만, 업데이트 또는 임베딩 간격이 구성된 경우 장기 실행 관리자는 계속 열어 두므로 QMD가 정기 감시자와 타이머를 소유할 수 있습니다.
- 검색은 구성된 `searchMode`를 사용합니다(기본값: `search`; `vsearch` 및 `query`도 지원). `search`는 BM25 전용이므로, OpenClaw는 해당 모드에서 의미 기반 벡터 준비 상태 프로브와 임베딩 유지 관리를 건너뜁니다. 모드가 실패하면 OpenClaw는 `qmd query`로 다시 시도합니다.
- `searchMode`가 `query`일 때 재순위화기 없이 QMD의 하이브리드 쿼리 경로를 사용하려면 `memory.qmd.rerank`를 `false`로 설정하세요. OpenClaw는 직접 QMD CLI 경로에는 `--no-rerank`를, QMD의 MCP 쿼리 도구에는 `rerank: false`를 전달합니다. 이 옵션에는 QMD 2.1 이상이 필요합니다.
- 다중 컬렉션 필터를 알리는 QMD 릴리스에서는 OpenClaw가 같은 소스의 컬렉션을 하나의 QMD 검색 호출로 묶습니다. 이전 QMD 릴리스는 호환 가능한 컬렉션별 대체 경로를 유지합니다.
- QMD가 완전히 실패하면 OpenClaw는 기본 제공 SQLite 엔진으로 대체합니다. 바이너리 누락 또는 손상된 사이드카 의존성이 재시도 폭주를 만들지 않도록, 반복되는 채팅 턴 시도는 열기 실패 후 잠시 백오프합니다. `openclaw memory status`와 일회성 CLI 프로브는 여전히 QMD를 직접 다시 확인합니다.

<Info>
첫 검색은 느릴 수 있습니다. QMD는 첫 `qmd query` 실행 시 재순위화 및 쿼리 확장을 위한 GGUF 모델(~2GB)을 자동 다운로드합니다.
</Info>

## 검색 성능 및 호환성

OpenClaw는 QMD 검색 경로가 현재 및 이전 QMD 설치 모두와 호환되도록 유지합니다.

시작 시 OpenClaw는 설치된 QMD 도움말 텍스트를 관리자마다 한 번 확인합니다. 바이너리가 여러 컬렉션 필터 지원을 알리면 OpenClaw는 같은 소스의 모든 컬렉션을 하나의 명령으로 검색합니다.

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

이렇게 하면 지속 메모리 컬렉션마다 QMD 하위 프로세스를 하나씩 시작하지 않아도 됩니다. 세션 대화 기록 컬렉션은 자체 소스 그룹에 남아 있으므로, `memory` + `sessions`가 섞인 검색도 두 소스 모두에서 결과 다양화 입력을 계속 제공합니다.

이전 QMD 빌드는 컬렉션 필터를 하나만 허용합니다. OpenClaw가 이러한 빌드 중 하나를 감지하면 호환성 경로를 유지하고, 결과를 병합 및 중복 제거하기 전에 각 컬렉션을 별도로 검색합니다.

설치된 계약을 직접 검사하려면 다음을 실행하세요.

```bash
qmd --help | grep -i collection
```

현재 QMD 도움말은 컬렉션 필터가 하나 이상의 컬렉션을 대상으로 할 수 있다고 말합니다. 이전 도움말은 보통 단일 컬렉션을 설명합니다.

## 모델 재정의

QMD 모델 환경 변수는 Gateway 프로세스에서 변경 없이 전달되므로, 새 OpenClaw 구성을 추가하지 않고도 QMD를 전역으로 조정할 수 있습니다.

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

임베딩 모델을 변경한 후에는 인덱스가 새 벡터 공간과 일치하도록 임베딩을 다시 실행하세요.

## 추가 경로 인덱싱

추가 디렉터리를 검색 가능하게 하려면 QMD가 해당 디렉터리를 가리키도록 설정하세요.

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

추가 경로의 스니펫은 검색 결과에서 `qmd/<collection>/<relative-path>`로 나타납니다. `memory_get`은 이 접두사를 이해하고 올바른 컬렉션 루트에서 읽습니다.

## 세션 대화 기록 인덱싱

이전 대화를 불러오려면 세션 인덱싱을 활성화하세요. QMD에는 일반 `memorySearch` 세션 소스와 QMD 대화 기록 내보내기가 모두 필요합니다.

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

대화 기록은 정리된 User/Assistant 턴으로 `~/.openclaw/agents/<id>/qmd/sessions/` 아래의 전용 QMD 컬렉션에 내보내집니다. `memorySearch.experimental.sessionMemory`만 설정해도 대화 기록이 QMD로 내보내지지는 않습니다.

세션 적중 결과는 여전히 [`tools.sessions.visibility`](/ko/gateway/config-tools#toolssessions)에 따라 필터링됩니다. 기본 `tree` 가시성은 관련 없는 같은 에이전트 세션을 노출하지 않습니다. Gateway에서 디스패치된 세션을 별도의 DM 세션에서 불러올 수 있어야 한다면 `tools.sessions.visibility: "agent"`를 의도적으로 설정하세요.

## 검색 범위

기본적으로 QMD 검색 결과는 직접 및 채널 세션(그룹 제외)에 표시됩니다. 이를 변경하려면 `memory.qmd.scope`를 구성하세요.

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

범위가 검색을 거부하면 OpenClaw는 빈 결과를 더 쉽게 디버그할 수 있도록 파생된 채널과 채팅 유형이 포함된 경고를 기록합니다.

## 인용

`memory.citations`가 `auto` 또는 `on`이면 검색 스니펫에 `Source: <path#line>` 푸터가 포함됩니다. 에이전트에 내부적으로 경로는 계속 전달하면서 푸터를 생략하려면 `memory.citations = "off"`로 설정하세요.

## 사용 시점

다음이 필요할 때 QMD를 선택하세요.

- 더 높은 품질의 결과를 위한 재순위화.
- 작업공간 밖의 프로젝트 문서 또는 노트 검색.
- 과거 세션 대화 불러오기.
- API 키 없는 완전 로컬 검색.

더 단순한 설정에서는 [기본 제공 엔진](/ko/concepts/memory-builtin)이 추가 의존성 없이 잘 작동합니다.

## 문제 해결

**QMD를 찾을 수 없나요?** 바이너리가 Gateway의 `PATH`에 있는지 확인하세요. OpenClaw가 서비스로 실행되는 경우 심볼릭 링크를 만드세요.
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

셸에서는 `qmd --version`이 작동하지만 OpenClaw가 여전히 `spawn qmd ENOENT`를 보고한다면 Gateway 프로세스의 `PATH`가 대화형 셸과 다를 가능성이 큽니다. 바이너리를 명시적으로 고정하세요.

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

QMD가 설치된 환경에서 `command -v qmd`를 사용한 다음 `openclaw memory status --deep`로 다시 확인하세요.

**첫 검색이 매우 느린가요?** QMD는 처음 사용할 때 GGUF 모델을 다운로드합니다. OpenClaw가 사용하는 동일한 XDG 디렉터리를 사용해 `qmd query "test"`로 미리 워밍업하세요.

**검색 중 QMD 하위 프로세스가 많이 생기나요?** 가능하면 QMD를 업데이트하세요. OpenClaw는 설치된 QMD가 여러 `-c` 필터 지원을 알릴 때만 같은 소스 다중 컬렉션 검색에 하나의 프로세스를 사용합니다. 그렇지 않으면 정확성을 위해 이전 컬렉션별 대체 경로를 유지합니다.

**BM25 전용 QMD가 여전히 llama.cpp를 빌드하려 하나요?** `memory.qmd.searchMode = "search"`를 설정하세요. OpenClaw는 해당 모드를 어휘 전용으로 취급하고, QMD 벡터 상태 프로브나 임베딩 유지 관리를 실행하지 않으며, 의미 기반 준비 상태 검사는 `vsearch` 또는 `query` 설정에 맡깁니다.

**검색 시간이 초과되나요?** `memory.qmd.limits.timeoutMs`를 늘리세요(기본값: 4000ms). 느린 하드웨어에서는 `120000`으로 설정하세요.

**그룹 채팅에서 결과가 비어 있나요?** `memory.qmd.scope`를 확인하세요. 기본값은 직접 및 채널 세션만 허용합니다.

**루트 메모리 검색이 갑자기 너무 넓어졌나요?** Gateway를 다시 시작하거나 다음 시작 시 조정을 기다리세요. OpenClaw는 같은 이름 충돌을 감지하면 오래된 관리형 컬렉션을 다시 표준 `MEMORY.md` 및 `memory/` 패턴으로 재생성합니다.

**작업공간에 보이는 임시 저장소가 `ENAMETOOLONG` 또는 손상된 인덱싱을 유발하나요?** QMD 순회는 현재 OpenClaw의 기본 제공 심볼릭 링크 규칙이 아니라 기반 QMD 스캐너 동작을 따릅니다. QMD가 순환 안전 순회 또는 명시적 제외 제어를 노출할 때까지 임시 모노레포 체크아웃은 `.tmp/` 같은 숨김 디렉터리 아래나 인덱싱된 QMD 루트 밖에 두세요.

## 구성

전체 구성 표면(`memory.qmd.*`), 검색 모드, 업데이트 간격, 범위 규칙 및 기타 모든 조정 항목은 [메모리 구성 참조](/ko/reference/memory-config)를 참조하세요.

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [기본 제공 메모리 엔진](/ko/concepts/memory-builtin)
- [Honcho 메모리](/ko/concepts/memory-honcho)
