---
read_when:
    - code_execution을 활성화하거나 구성하려고 합니다
    - 로컬 셸 액세스 없이 원격 분석을 원합니다
    - x_search 또는 web_search를 원격 Python 분석과 결합하려는 경우
summary: code_execution -- xAI를 사용해 샌드박스화된 원격 Python 분석 실행
title: 코드 실행
x-i18n:
    generated_at: "2026-04-30T06:53:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution`은 xAI의 Responses API에서 샌드박스 처리된 원격 Python 분석을 실행합니다.
이는 로컬 [`exec`](/ko/tools/exec)와 다릅니다.

- `exec`는 사용자 머신 또는 노드에서 셸 명령을 실행합니다
- `code_execution`은 xAI의 원격 샌드박스에서 Python을 실행합니다

다음 용도에는 `code_execution`을 사용하세요.

- 계산
- 표 작성
- 빠른 통계
- 차트형 분석
- `x_search` 또는 `web_search`가 반환한 데이터 분석

로컬 파일, 셸, 저장소 또는 페어링된 디바이스가 필요할 때는 사용하지 **마세요**.
이 경우에는 [`exec`](/ko/tools/exec)를 사용하세요.

## 설정

xAI API 키가 필요합니다. 다음 중 아무거나 사용할 수 있습니다.

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

예시:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## 사용 방법

자연스럽게 요청하고 분석 의도를 명확히 하세요.

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

이 도구는 내부적으로 단일 `task` 매개변수를 받으므로, 에이전트는 전체 분석 요청과 모든 인라인 데이터를 하나의 프롬프트로 보내야 합니다.

## 제한 사항

- 이는 로컬 프로세스 실행이 아니라 원격 xAI 실행입니다.
- 영구 노트북이 아니라 일회성 분석으로 취급해야 합니다.
- 로컬 파일이나 작업 공간에 접근할 수 있다고 가정하지 마세요.
- 최신 X 데이터가 필요하면 먼저 [`x_search`](/ko/tools/web#x_search)를 사용하세요.

## 관련 문서

- [Exec 도구](/ko/tools/exec)
- [Exec 승인](/ko/tools/exec-approvals)
- [apply_patch 도구](/ko/tools/apply-patch)
- [Web 도구](/ko/tools/web)
- [xAI](/ko/providers/xai)
