---
read_when:
    - GitHub Copilot을 모델 provider로 사용하려는 경우
    - '`openclaw models auth login-github-copilot` 플로우가 필요합니다'
summary: 디바이스 플로우를 사용해 OpenClaw에서 GitHub Copilot에 로그인하기
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-25T06:09:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot은 GitHub의 AI 코딩 어시스턴트입니다. GitHub 계정과 요금제에 맞는 Copilot
모델에 접근할 수 있습니다. OpenClaw는 Copilot을 모델
provider로 두 가지 방식으로 사용할 수 있습니다.

## OpenClaw에서 Copilot을 사용하는 두 가지 방법

<Tabs>
  <Tab title="내장 provider (github-copilot)">
    네이티브 디바이스 로그인 플로우를 사용해 GitHub 토큰을 얻고, OpenClaw 실행 시
    이를 Copilot API 토큰으로 교환합니다. 이것이 **기본값**이자 가장 간단한 경로이며
    VS Code가 필요하지 않습니다.

    <Steps>
      <Step title="로그인 명령 실행">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL을 방문하고 일회용 코드를 입력하라는 안내가 표시됩니다. 완료될 때까지
        터미널을 열어 두세요.
      </Step>
      <Step title="기본 모델 설정">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        또는 config에서:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code extension을 로컬 브리지로 사용합니다. OpenClaw는
    proxy의 `/v1` 엔드포인트와 통신하며, 거기에서 구성한 모델 목록을 사용합니다.

    <Note>
    이미 VS Code에서 Copilot Proxy를 실행 중이거나 이를 통해 라우팅해야 한다면
    이 방식을 선택하세요. Plugin을 활성화하고 VS Code extension이 계속 실행 중이어야 합니다.
    </Note>

  </Tab>
</Tabs>

## 선택적 플래그

| 플래그          | 설명                                          |
| --------------- | --------------------------------------------- |
| `--yes`         | 확인 프롬프트 건너뛰기                        |
| `--set-default` | provider의 권장 기본 모델도 함께 적용        |

```bash
# 확인 건너뛰기
openclaw models auth login-github-copilot --yes

# 로그인하고 기본 모델까지 한 번에 설정
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="대화형 TTY 필요">
    디바이스 로그인 플로우에는 대화형 TTY가 필요합니다. 비대화형 스크립트나 CI 파이프라인이 아니라
    터미널에서 직접 실행하세요.
  </Accordion>

  <Accordion title="모델 사용 가능 여부는 요금제에 따라 다름">
    Copilot 모델 사용 가능 여부는 GitHub 요금제에 따라 달라집니다. 모델이
    거부되면 다른 ID를 시도하세요(예: `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="전송 방식 선택">
    Claude 모델 ID는 자동으로 Anthropic Messages 전송 방식을 사용합니다. GPT,
    o-series, Gemini 모델은 OpenAI Responses 전송 방식을 유지합니다. OpenClaw는
    모델 ref를 기반으로 올바른 전송 방식을 선택합니다.
  </Accordion>

  <Accordion title="요청 호환성">
    OpenClaw는 Copilot 전송에서 Copilot IDE 스타일 요청 헤더를 전송하며,
    여기에는 내장 Compaction, tool-result, 이미지 후속 턴도 포함됩니다. OpenClaw는
    해당 동작이 Copilot API에서 검증되지 않은 한 Copilot에 대해 provider 수준 Responses continuation을 활성화하지 않습니다.
  </Accordion>

  <Accordion title="환경 변수 해석 순서">
    OpenClaw는 다음 우선순위로 환경 변수에서 Copilot 인증을 해석합니다:

    | 우선순위 | 변수                  | 참고                              |
    | -------- | --------------------- | --------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 가장 높은 우선순위, Copilot 전용   |
    | 2        | `GH_TOKEN`            | GitHub CLI 토큰(fallback)         |
    | 3        | `GITHUB_TOKEN`        | 표준 GitHub 토큰(가장 낮음)       |

    여러 변수가 설정되어 있으면 OpenClaw는 가장 높은 우선순위의 변수를 사용합니다.
    디바이스 로그인 플로우(`openclaw models auth login-github-copilot`)는
    auth profile 저장소에 토큰을 저장하며 모든 환경 변수보다 우선합니다.

  </Accordion>

  <Accordion title="토큰 저장소">
    로그인은 auth profile 저장소에 GitHub 토큰을 저장하고, OpenClaw 실행 시 이를
    Copilot API 토큰으로 교환합니다. 토큰을 수동으로 관리할 필요는 없습니다.
  </Accordion>
</AccordionGroup>

<Warning>
대화형 TTY가 필요합니다. 로그인 명령은 헤드리스 스크립트나 CI 작업 내부가 아니라
터미널에서 직접 실행하세요.
</Warning>

## 메모리 검색 임베딩

GitHub Copilot은
[메모리 검색](/ko/concepts/memory-search)의 임베딩 provider로도 사용할 수 있습니다. Copilot 구독이 있고
로그인되어 있다면 OpenClaw는 별도의 API key 없이 임베딩에 이를 사용할 수 있습니다.

### 자동 감지

`memorySearch.provider`가 `"auto"`(기본값)일 때 GitHub Copilot은
우선순위 15에서 시도됩니다 -- 로컬 임베딩 다음, OpenAI 및 기타 유료
provider 이전입니다. GitHub 토큰을 사용할 수 있으면 OpenClaw는
Copilot API에서 사용 가능한 임베딩 모델을 탐색하고 자동으로 가장 적합한 모델을 선택합니다.

### 명시적 config

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // 선택 사항: 자동 탐색된 모델 재정의
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 동작 방식

1. OpenClaw가 GitHub 토큰을 해석합니다(env var 또는 auth profile에서).
2. 이를 수명이 짧은 Copilot API 토큰으로 교환합니다.
3. Copilot `/models` 엔드포인트를 조회해 사용 가능한 임베딩 모델을 탐색합니다.
4. 가장 적합한 모델을 선택합니다(`text-embedding-3-small` 우선).
5. Copilot `/embeddings` 엔드포인트로 임베딩 요청을 보냅니다.

모델 사용 가능 여부는 GitHub 요금제에 따라 달라집니다. 사용할 수 있는 임베딩 모델이 없으면
OpenClaw는 Copilot을 건너뛰고 다음 provider를 시도합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택하기.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 credential 재사용 규칙.
  </Card>
</CardGroup>
