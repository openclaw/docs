---
read_when:
    - GitHub Copilot을 모델 제공자로 사용하려고 합니다
    - '`openclaw models auth login-github-copilot` 흐름이 필요합니다'
    - 기본 제공 Copilot 공급자, Copilot SDK 하네스, Copilot Proxy 중에서 선택하고 있습니다
summary: OpenClaw에서 디바이스 플로우 또는 비대화형 토큰 가져오기를 사용하여 GitHub Copilot에 로그인하기
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:01:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot은 GitHub의 AI 코딩 어시스턴트입니다. GitHub 계정과 플랜에 따라 Copilot
모델에 접근할 수 있습니다. OpenClaw는 Copilot을 모델 공급자 또는 에이전트 런타임으로
세 가지 방식으로 사용할 수 있습니다.

## OpenClaw에서 Copilot을 사용하는 세 가지 방법

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    네이티브 디바이스 로그인 플로우를 사용해 GitHub 토큰을 얻은 다음, OpenClaw가 실행될 때
    이를 Copilot API 토큰으로 교환합니다. 이 경로는 VS Code가 필요 없기 때문에
    **기본값**이자 가장 간단한 방법입니다.

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL을 방문하고 일회용 코드를 입력하라는 메시지가 표시됩니다. 완료될 때까지
        터미널을 열어 두세요.
      </Step>
      <Step title="Set a default model">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        또는 구성에서 설정합니다.

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

  <Tab title="Copilot SDK harness plugin (copilot)">
    선택한 `github-copilot/*` 모델의 저수준 에이전트 루프를 GitHub의
    Copilot CLI와 SDK가 소유하도록 하려면 외부 `@openclaw/copilot` Plugin을
    설치합니다.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    그런 다음 모델 또는 공급자를 런타임에 옵트인합니다.

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    해당 에이전트 턴에 네이티브 Copilot CLI 세션, SDK 관리 스레드 상태,
    Copilot 소유 Compaction이 필요할 때 이 방법을 선택하세요. 전체 런타임 계약은
    [Copilot SDK 하네스](/ko/plugins/copilot)를 참조하세요.

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 확장을 로컬 브리지로 사용합니다. OpenClaw는
    프록시의 `/v1` 엔드포인트와 통신하고, 사용자가 그곳에 구성한 모델 목록을 사용합니다.

    <Note>
    이미 VS Code에서 Copilot Proxy를 실행 중이거나 이를 통해 라우팅해야 할 때
    이 방법을 선택하세요. Plugin을 활성화하고 VS Code 확장을 계속 실행해야 합니다.
    </Note>

  </Tab>
</Tabs>

## 선택적 플래그

| 플래그          | 설명                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | 확인 프롬프트 건너뛰기                             |
| `--set-default` | 공급자의 권장 기본 모델도 적용                     |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 비대화형 온보딩

Copilot용 GitHub OAuth 액세스 토큰이 이미 있다면 `openclaw onboard --non-interactive`로
헤드리스 설정 중에 가져옵니다.

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice`를 생략할 수도 있습니다. `--github-copilot-token`을 전달하면
GitHub Copilot 공급자 인증 선택으로 추론됩니다. 플래그가 생략되면 온보딩은
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, 그다음 `GITHUB_TOKEN`으로 폴백합니다.
`COPILOT_GITHUB_TOKEN`을 설정한 상태에서 `--secret-input-mode ref`를 사용하면
`auth-profiles.json`에 평문 대신 env 기반 `tokenRef`를 저장합니다.

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    디바이스 로그인 플로우에는 대화형 TTY가 필요합니다. 비대화형 스크립트나 CI 파이프라인이
    아니라 터미널에서 직접 실행하세요.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    Copilot 모델 사용 가능 여부는 GitHub 플랜에 따라 달라집니다. 모델이
    거부되면 다른 ID(예: `github-copilot/gpt-5.5`)를 시도하세요. 현재 모델 목록은
    GitHub의 [Copilot 플랜별 지원 모델](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)을
    참조하세요.
  </Accordion>

  <Accordion title="Live catalog refresh from the Copilot API">
    디바이스 로그인 또는 env-var 인증 경로가 GitHub 토큰을 확인하면
    OpenClaw는 `${baseUrl}/models`에서 필요할 때 모델 카탈로그를 새로 고칩니다.
    이는 VS Code Copilot이 사용하는 것과 동일한 엔드포인트이므로, 런타임은 매니페스트
    변경 부담 없이 계정별 권한과 정확한 컨텍스트 윈도우를 추적합니다.
    새로 게시된 Copilot 모델은 OpenClaw 업그레이드 없이 표시되며, 컨텍스트 윈도우는
    실제 모델별 제한을 반영합니다
    (예: gpt-5.x 시리즈는 400k, 내부 `claude-opus-*-1m` 변형은 1M).

    번들된 정적 카탈로그는 디스커버리가 비활성화되었거나, 사용자에게 GitHub 인증 프로필이
    없거나, 토큰 교환이 실패하거나, `/models` HTTPS 호출에 오류가 발생할 때 보이는
    폴백으로 유지됩니다. 정적 매니페스트 카탈로그에만 전적으로 의존하도록 옵트아웃하려면
    (오프라인/에어갭 시나리오):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Transport selection">
    Claude 모델 ID는 Anthropic Messages 전송을 자동으로 사용합니다. GPT,
    o-series, Gemini 모델은 OpenAI Responses 전송을 유지합니다. OpenClaw는
    모델 참조를 기반으로 올바른 전송을 선택합니다.
  </Accordion>

  <Accordion title="Request compatibility">
    OpenClaw는 내장 Compaction, 도구 결과, 이미지 후속 턴을 포함하여 Copilot 전송에서
    Copilot IDE 스타일 요청 헤더를 보냅니다. 해당 동작이 Copilot API에 대해
    검증되지 않는 한, Copilot에 대해 공급자 수준 Responses continuation을 활성화하지
    않습니다.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw는 다음 우선순위 순서로 환경 변수에서 Copilot 인증을 확인합니다.

    | 우선순위 | 변수                  | 참고                             |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 가장 높은 우선순위, Copilot 전용 |
    | 2        | `GH_TOKEN`            | GitHub CLI 토큰(폴백)            |
    | 3        | `GITHUB_TOKEN`        | 표준 GitHub 토큰(가장 낮음)      |

    여러 변수가 설정되어 있으면 OpenClaw는 우선순위가 가장 높은 변수를 사용합니다.
    디바이스 로그인 플로우(`openclaw models auth login-github-copilot`)는
    해당 토큰을 인증 프로필 저장소에 저장하며 모든 환경 변수보다 우선합니다.

  </Accordion>

  <Accordion title="Token storage">
    로그인은 인증 프로필 저장소에 GitHub 토큰을 저장하고, OpenClaw가 실행될 때 이를
    Copilot API 토큰으로 교환합니다. 토큰을 수동으로 관리할 필요는 없습니다.
  </Accordion>
</AccordionGroup>

<Warning>
디바이스 로그인 명령에는 대화형 TTY가 필요합니다. 헤드리스 설정이 필요할 때는
비대화형 온보딩을 사용하세요.
</Warning>

## 메모리 검색 임베딩

GitHub Copilot은 [메모리 검색](/ko/concepts/memory-search)을 위한 임베딩 공급자로도
사용할 수 있습니다. Copilot 구독이 있고 로그인한 상태라면 OpenClaw는 별도의 API 키 없이
이를 임베딩에 사용할 수 있습니다.

### 구성

GitHub Copilot 임베딩을 사용하려면 `memorySearch.provider`를 명시적으로 설정하세요.
GitHub 토큰을 사용할 수 있으면 OpenClaw는 Copilot API에서 사용 가능한 임베딩 모델을
발견하고 가장 적합한 모델을 자동으로 선택합니다.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 작동 방식

1. OpenClaw가 GitHub 토큰을 확인합니다(env vars 또는 인증 프로필에서).
2. 이를 수명이 짧은 Copilot API 토큰으로 교환합니다.
3. Copilot `/models` 엔드포인트를 쿼리하여 사용 가능한 임베딩 모델을 발견합니다.
4. 가장 적합한 모델을 선택합니다(`text-embedding-3-small` 선호).
5. Copilot `/embeddings` 엔드포인트로 임베딩 요청을 보냅니다.

모델 사용 가능 여부는 GitHub 플랜에 따라 달라집니다. 사용 가능한 임베딩 모델이 없으면
OpenClaw는 Copilot을 건너뛰고 다음 공급자를 시도합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="OAuth and auth" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보와 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
