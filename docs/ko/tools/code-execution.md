---
read_when:
    - code_execution을 활성화하거나 구성하려고 합니다
    - 로컬 셸 액세스 없이 원격 분석을 원합니다
    - x_search 또는 web_search를 원격 Python 분석과 결합하려는 경우
summary: 'code_execution: xAI로 샌드박스화된 원격 Python 분석 실행'
title: 코드 실행
x-i18n:
    generated_at: "2026-05-06T06:41:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution`은 xAI의 Responses API에서 샌드박스 처리된 원격 Python 분석을 실행합니다. 번들된 `xai` Plugin(`tools` 계약 아래)에 의해 등록되며, `x_search`가 사용하는 동일한 `https://api.x.ai/v1/responses` 엔드포인트로 디스패치됩니다.

| 속성               | 값                                                             |
| ------------------ | -------------------------------------------------------------- |
| 도구 이름          | `code_execution`                                               |
| Provider Plugin    | `xai` (번들됨, `enabledByDefault: true`)                       |
| 인증               | `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey` |
| 기본 모델          | `grok-4-1-fast`                                                |
| 기본 제한 시간     | 30초                                                           |
| 기본 `maxTurns`    | 설정되지 않음(xAI가 자체 내부 제한 적용)                      |

이는 로컬 [`exec`](/ko/tools/exec)와 다릅니다.

- `exec`는 사용자의 머신이나 페어링된 node에서 셸 명령을 실행합니다.
- `code_execution`은 xAI의 원격 샌드박스에서 Python을 실행합니다.

다음 용도로 `code_execution`을 사용하세요.

- 계산.
- 표 작성.
- 빠른 통계.
- 차트형 분석.
- `x_search` 또는 `web_search`가 반환한 데이터 분석.

로컬 파일, 셸, repo 또는 페어링된 기기가 필요할 때는 사용하지 **마세요**. 그런 경우에는 [`exec`](/ko/tools/exec)를 사용하세요.

## 설정

<Steps>
  <Step title="xAI API 키 제공">
    Gateway 환경에 `XAI_API_KEY`를 설정하거나, 동일한 자격 증명이 `code_execution`, `x_search`, 웹 검색 및 기타 xAI 도구를 포괄하도록 xAI Plugin 아래에 키를 구성하세요.

    ```bash
    export XAI_API_KEY=xai-...
    ```

    또는 config를 통해 설정합니다.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="code_execution 활성화 및 조정">
    이 도구는 `plugins.entries.xai.config.codeExecution.enabled`로 제어됩니다. 기본값은 꺼짐입니다.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // 기본 xAI 코드 실행 모델 재정의
                maxTurns: 2,            // 내부 도구 턴에 대한 선택적 상한
                timeoutSeconds: 30,     // 요청 제한 시간(기본값: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Gateway 재시작">
    ```bash
    openclaw gateway restart
    ```

    xAI Plugin이 `enabled: true`로 다시 등록되면 `code_execution`이 agent의 도구 목록에 표시됩니다.

  </Step>
</Steps>

## 사용 방법

자연스럽게 요청하되 분석 의도를 명확히 밝히세요.

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

이 도구는 내부적으로 단일 `task` 매개변수를 받으므로, agent는 전체 분석 요청과 모든 인라인 데이터를 하나의 프롬프트로 보내야 합니다.

## 오류

도구가 인증 없이 실행되면 env var와 config 경로를 가리키는 구조화된 `missing_xai_api_key` 오류를 반환합니다. 이 오류는 발생한 예외가 아니라 JSON이므로 agent가 스스로 수정할 수 있습니다.

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 제한

- 이는 로컬 프로세스 실행이 아니라 원격 xAI 실행입니다.
- 결과를 지속적인 notebook 세션이 아닌 일시적인 분석으로 취급하세요.
- 로컬 파일이나 workspace에 접근할 수 있다고 가정하지 마세요.
- 최신 X 데이터의 경우 먼저 [`x_search`](/ko/tools/web#x_search)를 사용하고 결과를 `code_execution`으로 전달하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Exec 도구" href="/ko/tools/exec" icon="terminal">
    사용자의 머신 또는 페어링된 node에서 로컬 셸 실행.
  </Card>
  <Card title="Exec 승인" href="/ko/tools/exec-approvals" icon="shield">
    셸 실행에 대한 허용/거부 정책.
  </Card>
  <Card title="웹 도구" href="/ko/tools/web" icon="globe">
    `web_search`, `x_search`, `web_fetch`.
  </Card>
  <Card title="xAI provider" href="/ko/providers/xai" icon="microchip">
    Grok 모델, 웹/X 검색 및 코드 실행 config.
  </Card>
</CardGroup>
