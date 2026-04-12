---
read_when:
    - 모델 프로바이더로 GitHub Copilot를 사용하려고 합니다
    - '`openclaw models auth login-github-copilot` 흐름이 필요합니다'
summary: 디바이스 흐름을 사용해 OpenClaw에서 GitHub Copilot에 로그인하기
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-12T23:30:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51fee006e7d4e78e37b0c29356b0090b132de727d99b603441767d3fb642140b
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot는 GitHub의 AI 코딩 도우미입니다. GitHub 계정과 요금제에 맞는 Copilot
모델에 접근할 수 있도록 해줍니다. OpenClaw는 Copilot을 모델
프로바이더로 두 가지 방식으로 사용할 수 있습니다.

## OpenClaw에서 Copilot을 사용하는 두 가지 방법

<Tabs>
  <Tab title="내장 프로바이더 (github-copilot)">
    네이티브 디바이스 로그인 흐름을 사용해 GitHub 토큰을 얻은 다음, OpenClaw가 실행될 때 이를
    Copilot API 토큰으로 교환합니다. VS Code가 필요하지 않기 때문에 이것이 **기본값**이자 가장 간단한 경로입니다.

    <Steps>
      <Step title="로그인 명령 실행">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL에 방문해 일회용 코드를 입력하라는 메시지가 표시됩니다. 완료될 때까지
        터미널을 열어 두세요.
      </Step>
      <Step title="기본 모델 설정">
        ```bash
        openclaw models set github-copilot/gpt-4o
        ```

        또는 구성에서:

        ```json5
        {
          agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy Plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 확장을 로컬 브리지로 사용합니다. OpenClaw는
    프록시의 `/v1` 엔드포인트와 통신하고, 그곳에서 구성한 모델 목록을 사용합니다.

    <Note>
    이미 VS Code에서 Copilot Proxy를 실행 중이거나
    이를 통해 라우팅해야 하는 경우 이 옵션을 선택하세요. Plugin을 활성화하고 VS Code 확장을 계속 실행 상태로 유지해야 합니다.
    </Note>

  </Tab>
</Tabs>

## 선택적 플래그

| 플래그          | 설명                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | 확인 프롬프트 건너뛰기                              |
| `--set-default` | 프로바이더의 권장 기본 모델도 함께 적용            |

```bash
# 확인 건너뛰기
openclaw models auth login-github-copilot --yes

# 로그인하고 한 번에 기본 모델 설정
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="대화형 TTY 필요">
    디바이스 로그인 흐름에는 대화형 TTY가 필요합니다. 비대화형 스크립트나 CI 파이프라인이 아니라
    터미널에서 직접 실행하세요.
  </Accordion>

  <Accordion title="모델 사용 가능 여부는 요금제에 따라 달라집니다">
    Copilot 모델 사용 가능 여부는 GitHub 요금제에 따라 다릅니다. 어떤 모델이
    거부되면 다른 ID를 시도해 보세요(예: `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="전송 선택">
    Claude 모델 ID는 자동으로 Anthropic Messages 전송을 사용합니다. GPT,
    o-series, Gemini 모델은 OpenAI Responses 전송을 유지합니다. OpenClaw는
    모델 ref를 기준으로 올바른 전송을 선택합니다.
  </Accordion>

  <Accordion title="환경 변수 확인 순서">
    OpenClaw는 다음 우선순위 순서로 환경 변수에서 Copilot 인증을 확인합니다:

    | 우선순위 | 변수                 | 참고                                  |
    | -------- | -------------------- | ------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 가장 높은 우선순위, Copilot 전용       |
    | 2        | `GH_TOKEN`           | GitHub CLI 토큰(대체 경로)            |
    | 3        | `GITHUB_TOKEN`       | 표준 GitHub 토큰(가장 낮은 우선순위)  |

    여러 변수가 설정되어 있으면 OpenClaw는 가장 우선순위가 높은 변수를 사용합니다.
    디바이스 로그인 흐름(`openclaw models auth login-github-copilot`)은
    인증 프로필 저장소에 토큰을 저장하며, 모든 환경
    변수보다 우선합니다.

  </Accordion>

  <Accordion title="토큰 저장">
    로그인은 인증 프로필 저장소에 GitHub 토큰을 저장하고, OpenClaw가 실행될 때 이를
    Copilot API 토큰으로 교환합니다. 토큰을 수동으로
    관리할 필요는 없습니다.
  </Accordion>
</AccordionGroup>

<Warning>
대화형 TTY가 필요합니다. 로그인 명령은 헤드리스 스크립트나 CI 작업 내부가 아니라
터미널에서 직접 실행하세요.
</Warning>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    프로바이더, 모델 ref, 페일오버 동작 선택하기.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보와 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
