---
read_when:
    - 메모리 백엔드로 QMD를 설정하려고 합니다
    - 리랭킹이나 추가 인덱싱 경로 같은 고급 메모리 기능을 원합니다
summary: BM25, 벡터, 리랭킹, 쿼리 확장을 갖춘 로컬 우선 검색 사이드카
title: QMD 메모리 엔진
x-i18n:
    generated_at: "2026-04-12T23:27:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 27afc996b959d71caed964a3cae437e0e29721728b30ebe7f014db124c88da04
    source_path: concepts/memory-qmd.md
    workflow: 15
---

# QMD 메모리 엔진

[QMD](https://github.com/tobi/qmd)는 OpenClaw와 함께 실행되는 로컬 우선 검색 사이드카입니다. 단일 바이너리에서 BM25, 벡터 검색, 리랭킹을 결합하며, 워크스페이스 메모리 파일을 넘어서는 콘텐츠도 인덱싱할 수 있습니다.

## 내장 기능 대비 추가되는 점

- 더 나은 재현율을 위한 **리랭킹 및 쿼리 확장**.
- **추가 디렉터리 인덱싱** -- 프로젝트 문서, 팀 노트, 디스크에 있는 모든 것.
- **세션 기록 인덱싱** -- 이전 대화를 다시 찾기.
- **완전 로컬** -- Bun + node-llama-cpp를 통해 실행되며, GGUF 모델을 자동으로 다운로드합니다.
- **자동 폴백** -- QMD를 사용할 수 없으면 OpenClaw가 내장 엔진으로 원활하게 폴백합니다.

## 시작하기

### 사전 요구 사항

- QMD 설치: `npm install -g @tobilu/qmd` 또는 `bun install -g @tobilu/qmd`
- 확장을 허용하는 SQLite 빌드(`macOS`에서는 `brew install sqlite`).
- QMD가 gateway의 `PATH`에 있어야 합니다.
- macOS와 Linux는 별도 설정 없이 동작합니다. Windows는 WSL2를 통해 가장 잘 지원됩니다.

### 활성화

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw는 `~/.openclaw/agents/<agentId>/qmd/` 아래에 독립적인 QMD 홈을 만들고 사이드카 수명 주기를 자동으로 관리합니다 -- 컬렉션, 업데이트, 임베딩 실행이 모두 자동으로 처리됩니다. 현재 QMD 컬렉션 및 MCP 쿼리 형태를 우선 사용하지만, 필요할 경우 레거시 `--mask` 컬렉션 플래그와 이전 MCP 도구 이름으로도 폴백합니다.

## 사이드카 작동 방식

- OpenClaw는 워크스페이스 메모리 파일과 설정된 `memory.qmd.paths`에서 컬렉션을 생성한 다음, 부팅 시와 주기적으로(기본값: 5분마다) `qmd update` + `qmd embed`를 실행합니다.
- 기본 워크스페이스 컬렉션은 `MEMORY.md`와 `memory/` 트리를 추적합니다. 소문자 `memory.md`는 별도의 QMD 컬렉션이 아니라 부트스트랩 폴백으로 유지됩니다.
- 부팅 시 새로 고침은 채팅 시작을 막지 않도록 백그라운드에서 실행됩니다.
- 검색은 설정된 `searchMode`(기본값: `search`; `vsearch` 및 `query`도 지원)를 사용합니다. 어떤 모드가 실패하면 OpenClaw는 `qmd query`로 재시도합니다.
- QMD가 완전히 실패하면 OpenClaw는 내장 SQLite 엔진으로 폴백합니다.

<Info>
첫 번째 검색은 느릴 수 있습니다 -- 첫 `qmd query` 실행 시 QMD가 리랭킹과 쿼리 확장을 위해 GGUF 모델(~2 GB)을 자동으로 다운로드합니다.
</Info>

## 모델 재정의

QMD 모델 환경 변수는 gateway 프로세스에서 변경 없이 그대로 전달되므로, 새 OpenClaw 설정을 추가하지 않고도 QMD를 전역적으로 조정할 수 있습니다:

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

임베딩 모델을 변경한 후에는 인덱스가 새로운 벡터 공간과 일치하도록 임베딩을 다시 실행하세요.

## 추가 경로 인덱싱

추가 디렉터리를 검색 가능하게 하도록 QMD를 지정합니다:

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

추가 경로의 스니펫은 검색 결과에 `qmd/<collection>/<relative-path>` 형태로 표시됩니다. `memory_get`은 이 접두사를 이해하고 올바른 컬렉션 루트에서 읽습니다.

## 세션 기록 인덱싱

이전 대화를 다시 찾기 위해 세션 인덱싱을 활성화합니다:

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

기록은 정리된 User/Assistant 턴으로 내보내져 `~/.openclaw/agents/<id>/qmd/sessions/` 아래의 전용 QMD 컬렉션에 저장됩니다.

## 검색 범위

기본적으로 QMD 검색 결과는 직접 세션과 채널 세션에서 표시되며 그룹에는 표시되지 않습니다. 이를 변경하려면 `memory.qmd.scope`를 설정하세요:

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

범위 때문에 검색이 거부되면 OpenClaw는 파생된 채널과 채팅 유형을 포함한 경고를 기록하므로, 빈 결과를 더 쉽게 디버그할 수 있습니다.

## 인용

`memory.citations`가 `auto` 또는 `on`이면 검색 스니펫에 `Source: <path#line>` 바닥글이 포함됩니다. 바닥글은 생략하되 경로는 내부적으로 계속 agent에 전달하려면 `memory.citations = "off"`로 설정하세요.

## 사용해야 하는 경우

다음이 필요하다면 QMD를 선택하세요:

- 더 높은 품질의 결과를 위한 리랭킹.
- 워크스페이스 외부의 프로젝트 문서나 노트 검색.
- 과거 세션 대화 다시 찾기.
- API 키가 필요 없는 완전 로컬 검색.

더 단순한 설정에는 [내장 엔진](/ko/concepts/memory-builtin)이 추가 의존성 없이 잘 작동합니다.

## 문제 해결

**QMD를 찾을 수 없나요?** 바이너리가 gateway의 `PATH`에 있는지 확인하세요. OpenClaw가 서비스로 실행 중이라면 심볼릭 링크를 만드세요:
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`.

**첫 검색이 매우 느린가요?** QMD는 처음 사용할 때 GGUF 모델을 다운로드합니다. OpenClaw가 사용하는 것과 동일한 XDG 디렉터리를 사용해 `qmd query "test"`로 미리 워밍업하세요.

**검색 시간이 초과되나요?** `memory.qmd.limits.timeoutMs`(기본값: 4000ms)를 늘리세요. 느린 하드웨어에서는 `120000`으로 설정하세요.

**그룹 채팅에서 결과가 비어 있나요?** `memory.qmd.scope`를 확인하세요 -- 기본값은 직접 세션과 채널 세션만 허용합니다.

**워크스페이스에 보이는 임시 리포지토리 때문에 `ENAMETOOLONG` 또는 인덱싱 손상이 발생하나요?** 현재 QMD 순회는 OpenClaw 내장 심볼릭 링크 규칙이 아니라 기본 QMD 스캐너 동작을 따릅니다. QMD가 순환 안전 순회나 명시적인 제외 제어를 제공할 때까지는 임시 모노레포 체크아웃을 `.tmp/` 같은 숨김 디렉터리 아래나 인덱싱된 QMD 루트 밖에 두세요.

## 구성

전체 구성 표면(`memory.qmd.*`), 검색 모드, 업데이트 주기, 범위 규칙 및 기타 모든 설정은 [메모리 구성 참조](/ko/reference/memory-config)를 참고하세요.
