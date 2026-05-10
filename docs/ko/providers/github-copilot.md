---
read_when:
    - GitHub Copilot을 모델 제공자로 사용하려는 경우
    - '`openclaw models auth login-github-copilot` 흐름이 필요합니다'
summary: 디바이스 플로우 또는 비대화형 토큰 가져오기를 사용하여 OpenClaw에서 GitHub Copilot에 로그인
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-10T19:48:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot은 GitHub의 AI 코딩 어시스턴트입니다. GitHub 계정과 플랜에 맞는 Copilot
모델에 접근할 수 있게 해줍니다. OpenClaw는 두 가지 방식으로 Copilot을 모델
제공자로 사용할 수 있습니다.

## OpenClaw에서 Copilot을 사용하는 두 가지 방법

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    네이티브 디바이스 로그인 플로우를 사용해 GitHub 토큰을 얻은 다음, OpenClaw가 실행될 때
    이를 Copilot API 토큰으로 교환합니다. VS Code가 필요 없기 때문에 이것이 **기본값**이며 가장 간단한 경로입니다.

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL을 방문하고 일회용 코드를 입력하라는 안내가 표시됩니다. 완료될 때까지
        터미널을 열어 두세요.
      </Step>
      <Step title="Set a default model">
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

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    **Copilot Proxy** VS Code 확장을 로컬 브리지로 사용합니다. OpenClaw는
    프록시의 `/v1` 엔드포인트와 통신하고, 그곳에 구성한 모델 목록을 사용합니다.

    <Note>
    이미 VS Code에서 Copilot Proxy를 실행 중이거나 이를 통해 라우팅해야 하는 경우 선택하세요.
    Plugin을 활성화하고 VS Code 확장을 계속 실행해야 합니다.
    </Note>

  </Tab>
</Tabs>

## 선택적 플래그

| 플래그            | 설명                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | 확인 프롬프트 건너뛰기                        |
| `--set-default` | 제공자의 권장 기본 모델도 적용 |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## 비대화형 온보딩

Copilot용 GitHub OAuth 액세스 토큰이 이미 있다면,
headless 설정 중 `openclaw onboard --non-interactive`로 가져오세요.

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice`를 생략할 수도 있습니다. `--github-copilot-token`을 전달하면
GitHub Copilot 제공자 인증 선택이 추론됩니다. 플래그를 생략하면 온보딩은
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, 그다음 `GITHUB_TOKEN`으로 폴백합니다.
`COPILOT_GITHUB_TOKEN`이 설정된 상태에서 `--secret-input-mode ref`를 사용하면
`auth-profiles.json`에 평문 대신 env 기반 `tokenRef`가 저장됩니다.

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    디바이스 로그인 플로우에는 대화형 TTY가 필요합니다. 비대화형 스크립트나 CI 파이프라인이 아니라
    터미널에서 직접 실행하세요.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    Copilot 모델 사용 가능 여부는 GitHub 플랜에 따라 달라집니다. 모델이 거부되면
    다른 ID를 시도하세요(예: `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Live catalog refresh from the Copilot API">
    디바이스 로그인(또는 env-var) 인증 경로가 GitHub 토큰을 확인하면,
    OpenClaw는 `${baseUrl}/models`에서 필요할 때 모델 카탈로그를 새로 고칩니다.
    이는 VS Code Copilot이 사용하는 것과 같은 엔드포인트이므로 런타임은
    매니페스트 변경 없이 계정별 권한과 정확한 컨텍스트 창을 추적합니다.
    새로 게시된 Copilot 모델은 OpenClaw 업그레이드 없이 표시되며,
    컨텍스트 창은 실제 모델별 제한을 반영합니다
    (예: gpt-5.x 시리즈는 400k, 내부
    `claude-opus-*-1m` 변형은 1M).

    검색이 비활성화되어 있거나, 사용자에게 GitHub 인증 프로필이 없거나, 토큰 교환이
    실패하거나, `/models` HTTPS 호출에서 오류가 발생하면 번들된 정적 카탈로그가 표시되는 폴백으로 유지됩니다.
    완전히 옵트아웃하고 정적 매니페스트 카탈로그에만 의존하려면(오프라인 / 에어갭 시나리오):

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
    모델 ref를 기반으로 올바른 전송을 선택합니다.
  </Accordion>

  <Accordion title="Request compatibility">
    OpenClaw는 내장 Compaction, 도구 결과, 이미지 후속 턴을 포함해
    Copilot 전송에서 Copilot IDE 스타일 요청 헤더를 보냅니다. Copilot의 API에 대해
    해당 동작이 검증되지 않은 경우, Copilot에 대해 제공자 수준 Responses continuation을 활성화하지 않습니다.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw는 다음 우선순위에 따라 환경 변수에서 Copilot 인증을 확인합니다.

    | 우선순위 | 변수              | 참고                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 가장 높은 우선순위, Copilot 전용 |
    | 2        | `GH_TOKEN`            | GitHub CLI 토큰(폴백)      |
    | 3        | `GITHUB_TOKEN`        | 표준 GitHub 토큰(가장 낮음)   |

    여러 변수가 설정되어 있으면 OpenClaw는 우선순위가 가장 높은 변수를 사용합니다.
    디바이스 로그인 플로우(`openclaw models auth login-github-copilot`)는
    해당 토큰을 인증 프로필 저장소에 저장하며 모든 환경 변수보다 우선합니다.

  </Accordion>

  <Accordion title="Token storage">
    로그인은 GitHub 토큰을 인증 프로필 저장소에 저장하고 OpenClaw가 실행될 때
    이를 Copilot API 토큰으로 교환합니다. 토큰을 수동으로 관리할 필요가 없습니다.
  </Accordion>
</AccordionGroup>

<Warning>
디바이스 로그인 명령에는 대화형 TTY가 필요합니다. headless 설정이 필요할 때는
비대화형 온보딩을 사용하세요.
</Warning>

## 메모리 검색 임베딩

GitHub Copilot은 [메모리 검색](/ko/concepts/memory-search)의 임베딩 제공자로도
사용할 수 있습니다. Copilot 구독이 있고 로그인되어 있다면, OpenClaw는 별도의 API 키 없이
임베딩에 이를 사용할 수 있습니다.

### 자동 감지

`memorySearch.provider`가 `"auto"`(기본값)일 때 GitHub Copilot은
우선순위 15에서 시도됩니다. 즉 로컬 임베딩 이후, OpenAI 및 기타 유료
제공자 이전입니다. GitHub 토큰이 있으면 OpenClaw는 Copilot API에서
사용 가능한 임베딩 모델을 검색하고 가장 적합한 모델을 자동으로 선택합니다.

### 명시적 config

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
2. 이를 단기 Copilot API 토큰으로 교환합니다.
3. Copilot `/models` 엔드포인트를 쿼리해 사용 가능한 임베딩 모델을 검색합니다.
4. 가장 적합한 모델을 선택합니다(`text-embedding-3-small` 선호).
5. 임베딩 요청을 Copilot `/embeddings` 엔드포인트로 보냅니다.

모델 사용 가능 여부는 GitHub 플랜에 따라 달라집니다. 사용 가능한 임베딩 모델이
없으면 OpenClaw는 Copilot을 건너뛰고 다음 제공자를 시도합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 ref, 장애 조치 동작 선택.
  </Card>
  <Card title="OAuth and auth" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보와 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
