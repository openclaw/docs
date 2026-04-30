---
read_when:
    - 기본 메모리 백엔드를 이해하려는 경우
    - 임베딩 제공자 또는 하이브리드 검색을 구성하려는 경우
summary: 키워드, 벡터 및 하이브리드 검색을 지원하는 기본 SQLite 기반 메모리 백엔드
title: 내장 메모리 엔진
x-i18n:
    generated_at: "2026-04-30T06:26:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

내장 엔진은 기본 메모리 백엔드입니다. 에이전트별 SQLite 데이터베이스에 메모리 인덱스를 저장하며, 시작하는 데 추가 의존성이 필요하지 않습니다.

## 제공 기능

- FTS5 전체 텍스트 인덱싱(BM25 점수)을 통한 **키워드 검색**.
- 지원되는 모든 제공자의 임베딩을 통한 **벡터 검색**.
- 최상의 결과를 위해 둘을 결합하는 **하이브리드 검색**.
- 중국어, 일본어, 한국어를 위한 trigram 토큰화를 통한 **CJK 지원**.
- 데이터베이스 내 벡터 쿼리를 위한 **sqlite-vec 가속**(선택 사항).

## 시작하기

OpenAI, Gemini, Voyage, Mistral 또는 DeepInfra의 API 키가 있으면 내장
엔진이 이를 자동 감지하고 벡터 검색을 활성화합니다. 설정은 필요하지 않습니다.

제공자를 명시적으로 설정하려면:

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

내장 로컬 임베딩 제공자를 강제로 사용하려면 선택 사항인
`node-llama-cpp` 런타임 패키지를 OpenClaw 옆에 설치한 다음 `local.modelPath`가
GGUF 파일을 가리키도록 설정하세요.

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

| 제공자    | ID          | 자동 감지 | 비고                                |
| --------- | ----------- | --------- | ----------------------------------- |
| OpenAI    | `openai`    | 예        | 기본값: `text-embedding-3-small`    |
| Gemini    | `gemini`    | 예        | 멀티모달(이미지 + 오디오) 지원      |
| Voyage    | `voyage`    | 예        |                                     |
| Mistral   | `mistral`   | 예        |                                     |
| DeepInfra | `deepinfra` | 예        | 기본값: `BAAI/bge-m3`               |
| Ollama    | `ollama`    | 아니요    | 로컬, 명시적으로 설정               |
| 로컬      | `local`     | 예(첫 번째) | 선택 사항인 `node-llama-cpp` 런타임 |

자동 감지는 API 키를 확인할 수 있는 첫 번째 제공자를 표시된 순서대로 선택합니다.
재정의하려면 `memorySearch.provider`를 설정하세요.

## 인덱싱 작동 방식

OpenClaw는 `MEMORY.md`와 `memory/*.md`를 청크(약 400 토큰,
80 토큰 중첩)로 인덱싱하고, 에이전트별 SQLite 데이터베이스에 저장합니다.

- **인덱스 위치:** `~/.openclaw/memory/<agentId>.sqlite`
- **스토리지 유지관리:** SQLite WAL 사이드카는 주기적 체크포인트와
  종료 체크포인트로 제한됩니다.
- **파일 감시:** 메모리 파일 변경은 디바운스된 재인덱싱(1.5초)을 트리거합니다.
- **자동 재인덱싱:** 임베딩 제공자, 모델 또는 청킹 설정이 변경되면
  전체 인덱스가 자동으로 다시 빌드됩니다.
- **요청 시 재인덱싱:** `openclaw memory index --force`

<Info>
`memorySearch.extraPaths`를 사용해 워크스페이스 외부의 Markdown 파일도
인덱싱할 수 있습니다. [설정 참조](/ko/reference/memory-config#additional-memory-paths)를
참고하세요.
</Info>

## 사용 시점

내장 엔진은 대부분의 사용자에게 적합한 선택입니다.

- 추가 의존성 없이 바로 작동합니다.
- 키워드 검색과 벡터 검색을 잘 처리합니다.
- 모든 임베딩 제공자를 지원합니다.
- 하이브리드 검색은 두 검색 방식의 장점을 결합합니다.

재순위 지정, 쿼리 확장, 또는 워크스페이스 외부 디렉터리 인덱싱이 필요하면
[QMD](/ko/concepts/memory-qmd)로 전환하는 것을 고려하세요.

자동 사용자 모델링을 갖춘 세션 간 메모리를 원한다면
[Honcho](/ko/concepts/memory-honcho)를 고려하세요.

## 문제 해결

**메모리 검색이 비활성화되었나요?** `openclaw memory status`를 확인하세요. 제공자가
감지되지 않으면 하나를 명시적으로 설정하거나 API 키를 추가하세요.

**로컬 제공자가 감지되지 않나요?** 로컬 경로가 존재하는지 확인하고 다음을 실행하세요.

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

독립 실행형 CLI 명령과 Gateway는 동일한 `local` 제공자 ID를 사용합니다.
제공자가 `auto`로 설정된 경우, `memorySearch.local.modelPath`가 기존 로컬 파일을
가리킬 때만 로컬 임베딩이 먼저 고려됩니다.

**오래된 결과가 표시되나요?** 다시 빌드하려면 `openclaw memory index --force`를 실행하세요. 드문 예외 상황에서는 감시기가 변경 사항을 놓칠 수 있습니다.

**sqlite-vec가 로드되지 않나요?** OpenClaw는 자동으로 프로세스 내 코사인 유사도로
대체합니다. 구체적인 로드 오류는 로그를 확인하세요.

## 설정

임베딩 제공자 설정, 하이브리드 검색 조정(가중치, MMR, 시간 감쇠),
배치 인덱싱, 멀티모달 메모리, sqlite-vec, 추가 경로 및 기타 모든 설정 옵션은
[메모리 설정 참조](/ko/reference/memory-config)를 참고하세요.

## 관련

- [메모리 개요](/ko/concepts/memory)
- [메모리 검색](/ko/concepts/memory-search)
- [Active Memory](/ko/concepts/active-memory)
