---
read_when:
    - code_execution을 활성화하거나 구성하려고 합니다
    - 로컬 셸 액세스 없이 원격 분석을 수행하려고 합니다
    - x_search 또는 web_search를 원격 Python 분석과 결합하려고 합니다
summary: 'code_execution: xAI를 사용하여 샌드박스 처리된 원격 Python 분석 실행'
title: 코드 실행
x-i18n:
    generated_at: "2026-07-12T15:49:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution`은 xAI의 Responses API에서 샌드박스 처리된 원격 Python 분석을 실행합니다
(`https://api.x.ai/v1/responses`, `x_search`가 사용하는 것과 동일한 엔드포인트). 번들로 제공되는 `xai` Plugin이
`tools` 계약에 따라 등록합니다.

<Warning>
  `code_execution`은 xAI 서버에서 실행됩니다. xAI는 도구 호출 1,000회당 $5와
  모델의 입력 및 출력 토큰에 대해 요금을 청구합니다.
</Warning>

| 속성               | 값                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| 도구 이름          | `code_execution`                                                                  |
| 제공자 Plugin      | `xai` (번들 제공, `enabledByDefault: true`)                                       |
| 인증               | xAI 인증 프로필, `XAI_API_KEY` 또는 `plugins.entries.xai.config.webSearch.apiKey` |
| 기본 모델          | `grok-4.3`                                                                        |
| 기본 제한 시간     | 30초                                                                              |
| 기본 `maxTurns`    | 설정되지 않음(xAI가 자체 내부 제한을 적용함)                                     |

계산, 표 작성, 빠른 통계 및 차트 형식의 분석에 사용하십시오. 여기에는
`x_search` 또는 `web_search`가 반환한 데이터의 분석도 포함됩니다. 이 도구는
로컬 파일, 셸, 저장소 또는 페어링된 기기에 접근할 수 없으며 호출 간에
상태를 유지하지 않습니다. 따라서 각 호출을 노트북 세션이 아닌 일회성 분석으로
간주하십시오. 최신 X 데이터를 사용하려면 먼저 [`x_search`](/ko/tools/web#x_search)를
실행하고 그 결과를 전달하십시오.

로컬 실행에는 대신 [`exec`](/ko/tools/exec)를 사용하십시오.

## 설정

<Steps>
  <Step title="xAI 자격 증명 제공">
    OAuth를 사용하려면 자격 요건을 충족하는 SuperGrok 또는 X Premium 구독이 필요합니다
    (기기 코드 인증을 사용하므로 localhost 콜백 없이 원격 호스트에서도
    작동합니다).

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    새로 설치하는 동안 온보딩에서도 같은 옵션을 사용할 수 있습니다.

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    또는 API 키를 사용합니다.

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    또는 설정을 통해 지정합니다.

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

    이 세 가지 방법은 모두 `x_search`와 Grok `web_search`에도 인증을 제공합니다.

  </Step>

  <Step title="code_execution 활성화 및 조정">
    `enabled`를 생략하면 활성 모델의 제공자가 `xai`이고 xAI 자격 증명을
    확인할 수 있을 때만 `code_execution`이 노출됩니다. 제공자가 xAI가 아닌 것으로
    확인된 활성 모델에서 제공자 간 사용을 선택하려면
    `plugins.entries.xai.config.codeExecution.enabled`를 `true`로 설정하십시오.
    활성 모델 제공자가 없거나 확인되지 않으면 도구는 계속 숨겨집니다.
    모든 제공자에서 비활성화하려면 `enabled`를 `false`로 설정하십시오.
    xAI 자격 증명은 항상 필요합니다.

    같은 블록에서 모델, 턴 한도 또는 제한 시간을 재정의할 수 있습니다.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // 확인된 비xAI 모델 제공자에는 필요함
                model: "grok-4.3", // 기본 xAI 코드 실행 모델 재정의
                maxTurns: 2,            // 내부 도구 턴의 선택적 한도
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

    xAI Plugin이 다시 등록되고 위의 제공자, 활성화 및 인증 검사를 통과하면
    `code_execution`이 에이전트의 도구 목록에 표시됩니다.

  </Step>
</Steps>

## 사용 방법

분석 의도를 명확히 지정하십시오. 이 도구는 단일 `task` 매개변수를 받으므로
전체 요청과 모든 인라인 데이터를 하나의 프롬프트로 보내십시오.

```text
code_execution을 사용하여 다음 숫자의 7일 이동 평균을 계산하십시오: ...
```

```text
x_search를 사용하여 이번 주에 OpenClaw를 언급한 게시물을 찾은 다음, code_execution을 사용하여 날짜별로 집계하십시오.
```

```text
web_search를 사용하여 최신 AI 벤치마크 수치를 수집한 다음, code_execution을 사용하여 백분율 변화를 비교하십시오.
```

## 오류

인증이 없으면 도구는 예외를 발생시키는 대신 구조화된 JSON 오류를 반환하므로
에이전트가 스스로 수정할 수 있습니다.

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution에는 xAI 자격 증명이 필요합니다. Grok으로 로그인하려면 `openclaw onboard --auth-choice xai-oauth`를 실행하거나, `openclaw onboard --auth-choice xai-api-key`를 실행하거나, Gateway 환경에서 `XAI_API_KEY`를 설정하거나, `plugins.entries.xai.config.webSearch.apiKey`를 구성하십시오.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 관련 항목

<CardGroup cols={2}>
  <Card title="Exec 도구" href="/ko/tools/exec" icon="terminal">
    사용자의 컴퓨터 또는 페어링된 Node에서 로컬 셸을 실행합니다.
  </Card>
  <Card title="Exec 승인" href="/ko/tools/exec-approvals" icon="shield">
    셸 실행을 위한 허용/거부 정책입니다.
  </Card>
  <Card title="웹 도구" href="/ko/tools/web" icon="globe">
    `web_search`, `x_search`, `web_fetch`입니다.
  </Card>
  <Card title="xAI 제공자" href="/ko/providers/xai" icon="microchip">
    Grok 모델, 웹/X 검색 및 코드 실행 설정입니다.
  </Card>
</CardGroup>
