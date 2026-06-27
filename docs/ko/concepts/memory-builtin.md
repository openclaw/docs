---
read_when:
    - 기본 메모리 백엔드를 이해하려는 경우
    - 임베딩 제공자 또는 하이브리드 검색을 구성하려는 경우
summary: 키워드, 벡터 및 하이브리드 검색을 지원하는 기본 SQLite 기반 메모리 백엔드
title: 내장 메모리 엔진
x-i18n:
    generated_at: "2026-06-27T17:22:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

내장 엔진은 기본 메모리 백엔드입니다. 에이전트별 SQLite 데이터베이스에
메모리 인덱스를 저장하며, 시작하는 데 추가 의존성이 필요하지 않습니다.

## 제공 기능

- FTS5 전문 색인(BM25 점수)을 통한 **키워드 검색**.
- 지원되는 모든 공급자의 임베딩을 통한 **벡터 검색**.
- 최상의 결과를 위해 둘을 결합하는 **하이브리드 검색**.
- 중국어, 일본어, 한국어용 트라이그램 토큰화를 통한 **CJK 지원**.
- 데이터베이스 내 벡터 쿼리를 위한 **sqlite-vec 가속**(선택 사항).

## 시작하기

기본적으로 내장 엔진은 OpenAI 임베딩을 사용합니다. 이미
`OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`를 구성했다면, 추가
메모리 구성 없이 벡터 검색이 작동합니다.

공급자를 명시적으로 설정하려면:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

임베딩 공급자가 없으면 키워드 검색만 사용할 수 있습니다.

로컬 GGUF 임베딩을 강제로 사용하려면 공식 llama.cpp 공급자 Plugin을 설치한
다음 `local.modelPath`가 GGUF 파일을 가리키도록 설정합니다.

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## 지원되는 임베딩 공급자

| 공급자            | ID                  | 참고 사항                           |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | AWS 자격 증명 체인을 사용           |
| DeepInfra         | `deepinfra`         | 기본값: `BAAI/bge-m3`               |
| Gemini            | `gemini`            | 멀티모달(이미지 + 오디오) 지원      |
| GitHub Copilot    | `github-copilot`    | Copilot 구독 사용                   |
| 로컬              | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | 로컬/자체 호스팅                    |
| OpenAI            | `openai`            | 기본값: `text-embedding-3-small`    |
| OpenAI 호환       | `openai-compatible` | 일반 `/v1/embeddings` 엔드포인트    |
| Voyage            | `voyage`            |                                     |

OpenAI 이외의 공급자를 사용하려면 `memorySearch.provider`를 설정합니다.

## 색인 작동 방식

OpenClaw는 `MEMORY.md`와 `memory/*.md`를 청크(약 400토큰, 80토큰 중첩)로
나누어 색인하고 에이전트별 SQLite 데이터베이스에 저장합니다.

- **인덱스 위치:** 소유 에이전트 데이터베이스
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **저장소 유지 관리:** SQLite WAL 사이드카는 주기적 체크포인트와 종료 시
  체크포인트로 제한됩니다.
- **파일 감시:** 메모리 파일 변경은 디바운스된 재색인(1.5초)을 트리거합니다.
- **자동 재색인:** 임베딩 공급자, 모델 또는 청크 구성 변경 시 전체 인덱스가
  자동으로 다시 빌드됩니다.
- **요청 시 재색인:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths`를 사용해 작업 공간 밖의 Markdown 파일도 색인할 수
있습니다. [구성 참조](/ko/reference/memory-config#additional-memory-paths)를
참고하세요.
</Info>

## 사용 시점

내장 엔진은 대부분의 사용자에게 적합한 선택입니다.

- 추가 의존성 없이 바로 작동합니다.
- 키워드 검색과 벡터 검색을 잘 처리합니다.
- 모든 임베딩 공급자를 지원합니다.
- 하이브리드 검색은 두 검색 방식의 장점을 결합합니다.

재순위화, 쿼리 확장이 필요하거나 작업 공간 밖의 디렉터리를 색인하려면
[QMD](/ko/concepts/memory-qmd)로 전환하는 것을 고려하세요.

자동 사용자 모델링을 포함한 세션 간 메모리를 원한다면
[Honcho](/ko/concepts/memory-honcho)를 고려하세요.

## 문제 해결

**메모리 검색이 비활성화되었나요?** `openclaw memory status`를 확인하세요.
공급자가 감지되지 않으면 하나를 명시적으로 설정하거나 API 키를 추가하세요.

**로컬 공급자가 감지되지 않나요?** 로컬 경로가 존재하는지 확인하고 다음을
실행하세요.

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

독립 실행형 CLI 명령과 Gateway는 동일한 `local` 공급자 ID를 사용합니다.
로컬 임베딩을 원할 때는 `memorySearch.provider: "local"`을 설정하세요.

**결과가 오래되었나요?** 다시 빌드하려면 `openclaw memory index --force`를
실행하세요. 드문 엣지 케이스에서는 감시자가 변경 사항을 놓칠 수 있습니다.

**sqlite-vec가 로드되지 않나요?** OpenClaw는 자동으로 프로세스 내 코사인
유사도로 대체합니다. `openclaw memory status --deep`은 로컬 벡터 저장소를
임베딩 공급자와 별도로 보고하므로, `Vector store: unavailable`은 sqlite-vec
로드 문제를 가리키고 `Embeddings: unavailable`은 공급자/인증 또는 모델
준비 상태를 가리킵니다. 구체적인 로드 오류는 로그를 확인하세요.

## 구성

임베딩 공급자 설정, 하이브리드 검색 튜닝(가중치, MMR, 시간 감쇠), 배치
색인, 멀티모달 메모리, sqlite-vec, 추가 경로 및 기타 모든 구성 옵션은
[메모리 구성 참조](/ko/reference/memory-config)를 참고하세요.

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [Active Memory](/ko/concepts/active-memory)
