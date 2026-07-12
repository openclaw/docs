---
read_when:
    - QMD를 메모리 백엔드로 설정하려는 경우
    - 재순위화나 추가 색인 경로 같은 고급 메모리 기능이 필요한 경우
summary: BM25, 벡터, 재순위화 및 쿼리 확장을 지원하는 로컬 우선 검색 사이드카
title: QMD 메모리 엔진
x-i18n:
    generated_at: "2026-07-12T00:45:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d4fc87c31835a6a1fdabbb271902334755b9801e51a5b2a3cb5525f1657e9317
    source_path: concepts/memory-qmd.md
    workflow: 16
---

[QMD](https://github.com/tobi/qmd)는 OpenClaw과 함께 실행되는 로컬 우선 검색 사이드카입니다. BM25, 벡터 검색, 재순위화를 단일 바이너리에 결합하며 워크스페이스 메모리 파일 외부의 콘텐츠도 인덱싱할 수 있습니다.

## 기본 제공 기능과 비교해 추가되는 기능

- 더 높은 재현율을 위한 **재순위화 및 쿼리 확장**.
- **추가 디렉터리 인덱싱** - 프로젝트 문서, 팀 메모 등 디스크의 모든 콘텐츠.
- **세션 대화 기록 인덱싱** - 이전 대화 회상.
- **완전한 로컬 실행** - 공식 llama.cpp 제공자 Plugin으로 실행되며 GGUF 모델을 자동으로 다운로드합니다.
- **자동 폴백** - QMD를 사용할 수 없으면 OpenClaw이 원활하게 기본 제공 엔진으로 폴백합니다.

## 시작하기

### 사전 요구 사항

- QMD 설치: `npm install -g @tobilu/qmd` 또는 `bun install -g @tobilu/qmd`
- 확장을 허용하는 SQLite 빌드(macOS에서는 `brew install sqlite`).
- QMD가 Gateway의 `PATH`에 있어야 합니다.
- macOS와 Linux에서는 별도 설정 없이 작동합니다. Windows에서는 WSL2 사용을 가장 권장합니다.

### 활성화

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw은 `~/.openclaw/agents/<agentId>/qmd/` 아래에 독립적인 QMD 홈을 생성하고 사이드카 수명 주기를 자동으로 관리합니다. 컬렉션, 업데이트, 임베딩 실행이 모두 자동으로 처리됩니다. 현재 QMD 컬렉션 및 MCP 쿼리 형식을 우선 사용하지만, 필요한 경우 대체 컬렉션 패턴 플래그와 이전 MCP 도구 이름으로 폴백합니다. 또한 시작 시 조정 과정에서 같은 이름의 이전 QMD 컬렉션이 여전히 존재하면 오래된 관리형 컬렉션을 표준 패턴으로 다시 생성합니다.

## 사이드카 작동 방식

- OpenClaw은 워크스페이스 메모리 파일과 구성된 모든 `memory.qmd.paths`에서 컬렉션을 생성한 다음, QMD 관리자가 열릴 때와 그 이후 주기적으로 `qmd update`를 실행합니다(`memory.qmd.update.interval`, 기본값 `5m`). 새로 고침은 프로세스 내 파일 시스템 탐색이 아니라 QMD 하위 프로세스를 통해 실행됩니다. 의미 검색 모드에서는 `qmd embed`도 실행합니다(`memory.qmd.update.embedInterval`, 기본값 `60m`).
- 기본 워크스페이스 컬렉션은 `MEMORY.md`와 `memory/` 트리를 추적합니다. 소문자 `memory.md`는 루트 메모리 파일로 인덱싱되지 않습니다.
- QMD 자체 스캐너는 숨김 경로와 `.git`, `.cache`, `node_modules`, `vendor`, `dist`, `build` 같은 일반적인 의존성/빌드 디렉터리를 무시합니다. Gateway 시작 시에는 기본적으로 QMD를 초기화하지 않으므로(`memory.qmd.update.startup`의 기본값은 `off`) 콜드 부팅 시 메모리가 처음 사용되기 전에 메모리 런타임을 가져오거나 장기 실행 감시자를 생성하지 않습니다.
- Gateway 시작 시 QMD를 초기화하려면 `memory.qmd.update.startup`을 `idle` 또는 `immediate`로 설정합니다. `memory.qmd.update.onBoot`의 기본값은 `true`이며 시작 시 최초 새로 고침을 실행합니다. 이 즉시 새로 고침을 건너뛰려면 `false`로 설정합니다. 업데이트 또는 임베딩 간격이 구성된 경우에도 장기 실행 관리자는 열리므로 QMD가 정기 감시자와 타이머를 계속 관리합니다.
- 검색은 구성된 `searchMode`를 사용합니다(기본값: `search`, `vsearch`와 `query`도 지원). `search`는 BM25 전용이므로 OpenClaw은 이 모드에서 의미 벡터 준비 상태 검사와 임베딩 유지 관리를 건너뜁니다. 모드 실행이 실패하면 OpenClaw은 `qmd query`로 다시 시도합니다.
- `searchMode`가 `query`이면 QMD의 하이브리드 쿼리 경로를 재순위화기 없이 사용하도록 `memory.qmd.rerank`를 `false`로 설정할 수 있습니다(QMD 2.1 이상 필요). OpenClaw은 직접 QMD CLI 경로에 `--no-rerank`를 전달하고 QMD의 MCP 쿼리 도구에 `rerank: false`를 전달합니다.
- 다중 컬렉션 필터를 지원한다고 명시하는 QMD 릴리스에서는 OpenClaw이 동일 소스 컬렉션을 하나의 QMD 검색 호출로 그룹화합니다. 이전 QMD 릴리스에서는 호환 가능한 컬렉션별 폴백을 유지합니다.
- QMD가 완전히 실패하면 OpenClaw은 기본 제공 SQLite 엔진으로 폴백합니다. 바이너리 누락이나 손상된 사이드카 의존성으로 인해 재시도 폭주가 발생하지 않도록, 열기 실패 후 반복되는 채팅 턴 시도에는 잠시 백오프가 적용됩니다. `openclaw memory status`와 일회성 CLI 검사는 여전히 QMD를 직접 다시 확인합니다.

<Info>
첫 번째 검색은 느릴 수 있습니다. QMD는 첫 `qmd query` 실행 시 재순위화와 쿼리 확장에 사용할 GGUF 모델(약 2GB)을 자동으로 다운로드합니다.
</Info>

## 검색 성능 및 호환성

OpenClaw은 현재 및 이전 QMD 설치 모두와 호환되는 QMD 검색 경로를 유지합니다.

시작 시 OpenClaw은 관리자마다 한 번씩 설치된 QMD의 도움말 텍스트를 확인합니다. 바이너리가 여러 컬렉션 필터 지원을 명시하면 OpenClaw은 동일 소스의 모든 컬렉션을 하나의 명령으로 검색합니다.

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

이렇게 하면 영구 메모리 컬렉션마다 QMD 하위 프로세스를 하나씩 시작하지 않아도 됩니다. 세션 대화 기록 컬렉션은 별도의 소스 그룹에 유지되므로 `memory`와 `sessions`를 함께 검색해도 결과 다각화기에 두 소스의 입력이 모두 제공됩니다.

이전 QMD 빌드는 컬렉션 필터를 하나만 허용합니다. OpenClaw이 이러한 빌드를 감지하면 호환성 경로를 유지하여 각 컬렉션을 개별적으로 검색한 후 결과를 병합하고 중복을 제거합니다.

설치된 계약을 직접 확인하려면 다음을 실행합니다.

```bash
qmd --help | grep -i collection
```

현재 QMD 도움말에는 하나 이상의 컬렉션을 대상으로 지정하는 기능이 언급됩니다. 이전 도움말은 일반적으로 단일 컬렉션을 설명합니다.

## 모델 재정의

QMD 모델 환경 변수는 Gateway 프로세스에서 변경 없이 전달되므로 새 OpenClaw 구성을 추가하지 않고도 QMD를 전역적으로 조정할 수 있습니다.

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

임베딩 모델을 변경한 후에는 인덱스가 새 벡터 공간과 일치하도록 임베딩을 다시 실행합니다.

## 추가 경로 인덱싱

추가 디렉터리를 검색할 수 있도록 QMD가 해당 디렉터리를 가리키게 설정합니다.

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

추가 경로의 스니펫은 검색 결과에 `qmd/<collection>/<relative-path>` 형식으로 표시됩니다. `memory_get`은 이 접두사를 인식하고 올바른 컬렉션 루트에서 읽습니다.

## 세션 대화 기록 인덱싱

이전 대화를 회상하려면 세션 인덱싱을 활성화합니다. QMD에는 일반 `memorySearch` 세션 소스와 QMD 대화 기록 내보내기가 모두 필요합니다.

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

대화 기록은 정제된 사용자/어시스턴트 턴으로 내보내져 `~/.openclaw/agents/<id>/qmd/sessions/` 아래의 전용 QMD 컬렉션에 저장됩니다. `memorySearch.experimental.sessionMemory`만 설정하면 대화 기록이 QMD로 내보내지지 않습니다.

세션 검색 결과에는 여전히 [`tools.sessions.visibility`](/ko/gateway/config-tools#toolssessions) 필터가 적용됩니다. 기본 `tree` 가시성은 관련 없는 동일 에이전트 세션을 노출하지 않습니다. Gateway가 디스패치한 세션을 별도의 DM 세션에서 회상할 수 있어야 한다면 의도적으로 `tools.sessions.visibility: "agent"`를 설정합니다.

## 검색 범위

기본적으로 QMD 검색 결과는 직접 세션에만 표시되며 그룹 또는 채널 채팅에는 표시되지 않습니다. 이를 변경하려면 `memory.qmd.scope`를 구성합니다.

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

위 스니펫이 실제 기본 규칙입니다. 범위 설정에 따라 검색이 거부되면 OpenClaw은 파생된 채널 및 채팅 유형과 함께 경고를 기록하므로 빈 결과를 더 쉽게 디버깅할 수 있습니다.

## 인용

`memory.citations`가 `auto` 또는 `on`이면 검색 스니펫에 `Source: <path>#L<line>` 또는 `#L<start>-L<end>` 바닥글이 추가됩니다. `auto` 모드에서는 직접 채팅 세션에만 바닥글이 추가됩니다. 에이전트 내부에는 경로를 계속 전달하면서 바닥글을 생략하려면 `memory.citations = "off"`로 설정합니다.

## 사용 시점

다음이 필요하면 QMD를 선택합니다.

- 더 높은 품질의 결과를 위한 재순위화.
- 워크스페이스 외부의 프로젝트 문서 또는 메모리 검색.
- 이전 세션 대화 회상.
- API 키가 필요 없는 완전한 로컬 검색.

더 간단한 설정에서는 추가 의존성 없이 [기본 제공 엔진](/ko/concepts/memory-builtin)을 사용할 수 있습니다.

## 문제 해결

**QMD를 찾을 수 없나요?** 바이너리가 Gateway의 `PATH`에 있는지 확인합니다. OpenClaw이 서비스로 실행되는 경우 심볼릭 링크를 생성합니다.
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

셸에서는 `qmd --version`이 작동하지만 OpenClaw이 여전히 `spawn qmd ENOENT`를 보고한다면 Gateway 프로세스의 `PATH`가 대화형 셸과 다를 가능성이 큽니다. 바이너리를 명시적으로 지정합니다.

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

QMD가 설치된 환경에서 `command -v qmd`를 사용한 다음 `openclaw memory status --deep`으로 다시 확인합니다.

**첫 검색이 매우 느린가요?** QMD는 처음 사용할 때 GGUF 모델을 다운로드합니다. OpenClaw과 동일한 XDG 디렉터리를 사용하여 `qmd query "test"`로 미리 준비합니다.

**검색 중 QMD 하위 프로세스가 많이 생성되나요?** 가능하면 QMD를 업데이트합니다. OpenClaw은 설치된 QMD가 여러 `-c` 필터 지원을 명시하는 경우에만 동일 소스의 다중 컬렉션 검색에 단일 프로세스를 사용합니다. 그렇지 않으면 정확성을 위해 이전 컬렉션별 폴백을 유지합니다.

**BM25 전용 QMD가 계속 llama.cpp를 빌드하려 하나요?** `memory.qmd.searchMode = "search"`로 설정합니다. OpenClaw은 이 모드를 어휘 검색 전용으로 처리하여 QMD 벡터 상태 검사와 임베딩 유지 관리를 건너뛰고, 의미 준비 상태 검사는 `vsearch` 또는 `query` 설정에만 적용합니다.

**검색 시간이 초과되나요?** `memory.qmd.limits.timeoutMs`를 늘립니다(기본값: 4000ms). 느린 하드웨어에서는 예를 들어 `120000`처럼 더 높은 값으로 설정합니다.

**그룹 또는 채널 채팅에서 결과가 비어 있나요?** 직접 세션만 허용하는 기본 `memory.qmd.scope`에서는 예상되는 동작입니다. 해당 위치에서도 QMD 결과를 사용하려면 `group` 또는 `channel` 채팅 유형에 대한 `allow` 규칙을 추가합니다.

**루트 메모리 검색 범위가 갑자기 너무 넓어졌나요?** Gateway를 다시 시작하거나 다음 시작 조정이 실행될 때까지 기다립니다. OpenClaw은 같은 이름의 충돌을 감지하면 오래된 관리형 컬렉션을 표준 `MEMORY.md` 및 `memory/` 패턴으로 다시 생성합니다.

**워크스페이스에서 보이는 임시 저장소 때문에 `ENAMETOOLONG`이 발생하거나 인덱싱이 손상되나요?** QMD 탐색은 OpenClaw의 기본 제공 심볼릭 링크 규칙이 아니라 기반 QMD 스캐너를 따릅니다. QMD가 순환 안전 탐색 또는 명시적 제외 제어 기능을 제공할 때까지 임시 모노레포 체크아웃을 `.tmp/` 같은 숨김 디렉터리나 인덱싱된 QMD 루트 외부에 보관합니다.

## 구성

전체 구성 표면(`memory.qmd.*`), 검색 모드, 업데이트 간격, 범위 규칙 및 기타 모든 옵션은 [메모리 구성 참조](/ko/reference/memory-config)를 확인하세요.

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [기본 제공 메모리 엔진](/ko/concepts/memory-builtin)
- [Honcho 메모리](/ko/concepts/memory-honcho)
