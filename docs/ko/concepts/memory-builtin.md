---
read_when:
    - 기본 메모리 백엔드를 이해하려고 합니다
    - 임베딩 제공자 또는 하이브리드 검색을 구성하려는 경우
summary: 키워드, 벡터 및 하이브리드 검색을 지원하는 기본 SQLite 기반 메모리 백엔드
title: 내장 메모리 엔진
x-i18n:
    generated_at: "2026-07-12T15:10:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

내장 엔진은 기본 메모리 백엔드입니다. 에이전트별 SQLite 데이터베이스에 메모리 인덱스를 저장하며, 시작하는 데 추가 종속성이 필요하지 않습니다.

## 제공 기능

- FTS5 전체 텍스트 인덱싱(BM25 점수)을 통한 **키워드 검색**.
- 지원되는 모든 제공자의 임베딩을 통한 **벡터 검색**.
- 최상의 결과를 위해 두 검색 방식을 결합하는 **하이브리드 검색**.
- 중국어, 일본어, 한국어용 트라이그램 토큰화를 통한 **CJK 지원**.
- 데이터베이스 내 벡터 쿼리를 위한 **sqlite-vec 가속**(선택 사항).

## 시작하기

기본적으로 내장 엔진은 OpenAI 임베딩을 사용합니다. `OPENAI_API_KEY` 또는
`models.providers.openai.apiKey`가 이미 구성되어 있으면 별도의 메모리 구성 없이
벡터 검색을 사용할 수 있습니다.

제공자를 명시적으로 설정하려면 다음과 같이 구성하십시오.

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

임베딩 제공자가 없으면 키워드 검색만 사용할 수 있습니다.

로컬 GGUF 임베딩을 강제로 사용하려면 공식 llama.cpp 제공자
Plugin을 설치한 다음 `local.modelPath`가 GGUF 파일을 가리키도록 설정하십시오.

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

## 지원되는 임베딩 제공자

| 제공자            | ID                  | 참고 사항                           |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | AWS 자격 증명 체인을 사용합니다     |
| DeepInfra         | `deepinfra`         | 기본값: `BAAI/bge-m3`               |
| Gemini            | `gemini`            | 멀티모달(이미지 + 오디오)을 지원합니다 |
| GitHub Copilot    | `github-copilot`    | Copilot 구독을 사용합니다           |
| LM Studio         | `lmstudio`          | 로컬/자체 호스팅                    |
| 로컬              | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | 로컬/자체 호스팅                    |
| OpenAI            | `openai`            | 기본값: `text-embedding-3-small`    |
| OpenAI 호환       | `openai-compatible` | 범용 `/v1/embeddings` 엔드포인트    |
| Voyage            | `voyage`            |                                     |

OpenAI 이외의 제공자로 전환하려면 `memorySearch.provider`를 설정하십시오.

## 인덱싱 작동 방식

OpenClaw는 `MEMORY.md`와 `memory/*.md`를 청크(기본값은 400토큰, 80토큰 중첩)로 나누어 인덱싱하고 에이전트별 SQLite 데이터베이스에 저장합니다.

- **인덱스 위치:** 소유 에이전트의 데이터베이스인
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **스토리지 유지 관리:** SQLite WAL 사이드카는 주기적 체크포인트와
  종료 시 체크포인트를 통해 크기가 제한됩니다.
- **파일 감시:** 메모리 파일이 변경되면 디바운스된 재인덱싱이 실행됩니다
  (기본값 1.5초).
- **자동 재인덱싱:** 임베딩 제공자, 모델, 청킹 구성, 구성된 소스 또는 범위가 변경되면
  인덱스가 자동으로 다시 빌드됩니다.
- **요청 시 재인덱싱:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths`를 사용하여 워크스페이스 외부의 Markdown 파일도
인덱싱할 수 있습니다. [구성 참조](/ko/reference/memory-config#additional-memory-paths)를
확인하십시오.
</Info>

## 사용 시점

내장 엔진은 대부분의 사용자에게 적합합니다.

- 추가 종속성 없이 즉시 사용할 수 있습니다.
- 키워드 및 벡터 검색을 모두 효과적으로 처리합니다.
- 모든 임베딩 제공자를 지원합니다.
- 하이브리드 검색은 두 검색 방식의 장점을 결합합니다.

재순위 지정이나 쿼리 확장이 필요하거나 워크스페이스 외부 디렉터리를
인덱싱하려면 [QMD](/ko/concepts/memory-qmd)로 전환하는 것을 고려하십시오.

자동 사용자 모델링을 사용하는 세션 간 메모리가 필요하면
[Honcho](/ko/concepts/memory-honcho)를 고려하십시오.

## 문제 해결

**메모리 검색이 비활성화되었습니까?** `openclaw memory status`를 확인하십시오.
제공자가 감지되지 않으면 제공자를 명시적으로 설정하거나 API 키를 추가하십시오.

**로컬 제공자가 감지되지 않습니까?** 로컬 경로가 존재하는지 확인하고 다음을 실행하십시오.

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

독립 실행형 CLI 명령과 Gateway는 모두 동일한 `local` 제공자 ID를 사용합니다.
로컬 임베딩을 사용하려면 `memorySearch.provider: "local"`을 설정하십시오.

**결과가 오래되었습니까?** 다시 빌드하려면 `openclaw memory index --force`를
실행하십시오. 드문 극단적인 경우에는 감시기가 변경 사항을 놓칠 수 있습니다.

**sqlite-vec가 로드되지 않습니까?** OpenClaw는 자동으로 프로세스 내 코사인
유사도로 대체합니다. `openclaw memory status --deep`는 로컬 벡터 저장소를
임베딩 제공자와 별도로 보고하므로, `Vector store:
unavailable`은 sqlite-vec 로드 문제를 나타내고 `Embeddings: unavailable`은
제공자/인증 또는 모델 준비 상태 문제를 나타냅니다. 구체적인 로드 오류는 로그에서
확인하십시오.

## 구성

임베딩 제공자 설정, 하이브리드 검색 조정(가중치, MMR, 시간적 감쇠), 배치 인덱싱,
멀티모달 메모리, sqlite-vec, 추가 경로 및 기타 모든 구성 옵션은
[메모리 구성 참조](/ko/reference/memory-config)를 확인하십시오.

## 관련 항목

- [메모리 개요](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [Active Memory](/ko/concepts/active-memory)
