---
read_when:
    - code_execution을 활성화하거나 구성하려고 합니다
    - 원격 분석은 필요하지만 로컬 셸 접근은 원하지 않는 경우
    - x_search 또는 web_search를 원격 Python 분석과 결합하려는 경우
summary: 'code_execution: xAI로 샌드박스 처리된 원격 Python 분석 실행'
title: 코드 실행
x-i18n:
    generated_at: "2026-06-27T18:12:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution`은 xAI의 Responses API에서 샌드박스 처리된 원격 Python 분석을 실행합니다. 번들된 `xai` Plugin(`tools` 계약 아래)에 의해 등록되며 `x_search`가 사용하는 것과 같은 `https://api.x.ai/v1/responses` 엔드포인트로 디스패치됩니다.

| 속성               | 값                                                                                |
| ------------------ | --------------------------------------------------------------------------------- |
| 도구 이름          | `code_execution`                                                                  |
| 제공자 Plugin      | `xai`(번들됨, `enabledByDefault: true`)                                           |
| 인증               | xAI 인증 프로필, `XAI_API_KEY`, 또는 `plugins.entries.xai.config.webSearch.apiKey` |
| 기본 모델          | `grok-4-1-fast`                                                                   |
| 기본 제한 시간     | 30초                                                                              |
| 기본 `maxTurns`    | 설정되지 않음(xAI가 자체 내부 한도를 적용함)                                      |

이는 로컬 [`exec`](/ko/tools/exec)와 다릅니다.

- `exec`는 사용자의 머신 또는 페어링된 노드에서 셸 명령을 실행합니다.
- `code_execution`은 xAI의 원격 샌드박스에서 Python을 실행합니다.

다음에는 `code_execution`을 사용하세요.

- 계산.
- 표 작성.
- 빠른 통계.
- 차트 스타일 분석.
- `x_search` 또는 `web_search`가 반환한 데이터 분석.

로컬 파일, 셸, 저장소 또는 페어링된 장치가 필요할 때는 사용하지 **마세요**. 그 경우에는 [`exec`](/ko/tools/exec)를 사용하세요.

## 설정

<Steps>
  <Step title="xAI credentials 제공">
    적격 SuperGrok 또는 X Premium 구독으로 Grok OAuth에 로그인하거나
    API 키를 저장하세요. xAI OAuth는 장치 코드 검증을 사용하므로 localhost 콜백 없이
    원격 호스트에서도 작동합니다. OAuth는 `code_execution` 및 `x_search`에서 작동하며,
    `XAI_API_KEY` 또는 Plugin 웹 검색 구성도 Grok `web_search`에 사용할 수 있습니다.

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    새로 설치하는 동안에는 onboarding 안에서도 같은 인증 선택지를 사용할 수 있습니다.

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    또는 API 키를 사용하세요.

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    또는 구성을 통해 사용하세요.

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
    xAI credentials를 사용할 수 있으면 `code_execution`을 사용할 수 있습니다.
    비활성화하려면 `plugins.entries.xai.config.codeExecution.enabled`를 `false`로 설정하거나,
    같은 블록을 사용해 모델과 제한 시간을 조정하세요.

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // 기본 xAI 코드 실행 모델을 재정의
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

    xAI Plugin이 `enabled: true`로 다시 등록되면 `code_execution`이 에이전트의 도구 목록에 표시됩니다.

  </Step>
</Steps>

## 사용 방법

자연스럽게 요청하되 분석 의도를 명시하세요.

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

## 오류

인증 없이 도구가 실행되면 인증 프로필, 환경 변수, 구성 옵션을 가리키는 구조화된 `missing_xai_api_key` 오류를 반환합니다. 이 오류는 throw된 예외가 아니라 JSON이므로 에이전트가 스스로 수정할 수 있습니다.

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## 제한

- 이는 로컬 프로세스 실행이 아니라 원격 xAI 실행입니다.
- 결과는 영구 노트북 세션이 아니라 일시적 분석으로 취급하세요.
- 로컬 파일이나 작업공간에 접근할 수 있다고 가정하지 마세요.
- 최신 X 데이터가 필요하면 먼저 [`x_search`](/ko/tools/web#x_search)를 사용한 뒤 결과를 `code_execution`에 전달하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Exec 도구" href="/ko/tools/exec" icon="terminal">
    사용자의 머신 또는 페어링된 노드에서 로컬 셸 실행.
  </Card>
  <Card title="Exec 승인" href="/ko/tools/exec-approvals" icon="shield">
    셸 실행에 대한 허용/거부 정책.
  </Card>
  <Card title="웹 도구" href="/ko/tools/web" icon="globe">
    `web_search`, `x_search`, 그리고 `web_fetch`.
  </Card>
  <Card title="xAI 제공자" href="/ko/providers/xai" icon="microchip">
    Grok 모델, 웹/X 검색, 코드 실행 구성.
  </Card>
</CardGroup>
