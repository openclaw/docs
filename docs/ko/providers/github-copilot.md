---
read_when:
    - GitHub Copilot을 모델 제공자로 사용하려고 합니다
    - '`openclaw models auth login-github-copilot` 흐름이 필요합니다'
    - 기본 제공 Copilot 공급자, Copilot SDK 하네스, Copilot Proxy 중에서 선택합니다
summary: 기기 흐름 또는 비대화형 토큰 가져오기를 사용하여 OpenClaw에서 GitHub Copilot에 로그인합니다.
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T15:39:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot은 GitHub의 AI 코딩 어시스턴트입니다. GitHub 계정 및 요금제에서 사용할 수 있는 Copilot
모델에 대한 액세스를 제공합니다. OpenClaw에서는 다음과 같은 세 가지 방식으로 Copilot을 모델
공급자 또는 에이전트 런타임으로 사용할 수 있습니다.

## OpenClaw에서 Copilot을 사용하는 세 가지 방법

<Tabs>
  <Tab title="내장 공급자(github-copilot)">
    기본 디바이스 로그인 흐름을 사용하여 GitHub 토큰을 받은 다음, OpenClaw 실행 시
    이를 Copilot API 토큰으로 교환합니다. VS Code가 필요하지 않으므로 이 방식이
    **기본값**이자 가장 간단한 경로입니다.

    <Steps>
      <Step title="로그인 명령 실행">
        ```bash
        openclaw models auth login-github-copilot
        ```

        URL을 방문하여 일회용 코드를 입력하라는 메시지가 표시됩니다. 완료될 때까지
        터미널을 열어 두십시오.
      </Step>
      <Step title="기본 모델 설정">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        또는 구성에서 다음과 같이 설정합니다.

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

  <Tab title="Copilot SDK 하네스 Plugin(copilot)">
    선택한 `github-copilot/*` 모델에 대해 GitHub의 Copilot CLI와 SDK가
    저수준 에이전트 루프를 담당하도록 하려면 외부 `@openclaw/copilot` Plugin을
    설치하십시오.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    그런 다음 런타임을 사용하도록 모델 또는 공급자를 설정합니다.

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

    해당 에이전트 턴에 기본 Copilot CLI 세션, SDK가 관리하는 스레드 상태,
    Copilot이 담당하는 Compaction을 사용하려면 이 방식을 선택하십시오. 명시적으로
    `agentRuntime`을 설정하지 않으면 `github-copilot/*` 모델은 계속 내장
    공급자를 사용합니다. 전체 런타임 계약은 [Copilot SDK 하네스](/ko/plugins/copilot)를
    참조하십시오.

  </Tab>

  <Tab title="Copilot Proxy Plugin(copilot-proxy)">
    **Copilot Proxy** VS Code 확장 프로그램을 로컬 브리지로 사용합니다. OpenClaw는
    프록시의 `/v1` 엔드포인트(기본값 `http://localhost:3000/v1`)와 통신하며
    구성한 모델 목록을 사용합니다.

    `copilot-proxy` Plugin은 OpenClaw에 포함되어 제공되며 기본적으로 활성화됩니다.
    다음 명령으로 기본 URL과 모델 ID를 구성하십시오.

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    이미 VS Code에서 Copilot Proxy를 실행하고 있거나 이를 통해 라우팅해야 할 때
    이 방식을 선택하십시오. VS Code 확장 프로그램을 계속 실행해 두어야 합니다.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise(데이터 상주)

조직에서 데이터 상주형 GitHub Enterprise 테넌트(`your-org.ghe.com`과 같은
`*.ghe.com` 호스트)를 사용하는 경우 Copilot은 공개 `github.com`이 아닌
테넌트 로컬 엔드포인트에 존재합니다. OpenClaw는 이를 일급 인증 선택지로
제공하므로 URL을 직접 편집할 필요가 없습니다.

<Steps>
  <Step title="Enterprise 인증 선택지 선택">
    온보딩 또는 `openclaw models auth`에서
    **GitHub Copilot (Enterprise / data residency)**를 선택하십시오. Enterprise
    도메인(예: `your-org.ghe.com`)을 입력하라는 메시지가 표시된 후 해당 테넌트를
    대상으로 디바이스 로그인이 실행됩니다.

    테넌트 루트(`your-org.ghe.com`)만 입력하십시오. `api.your-org.ghe.com` 또는
    `copilot-api.your-org.ghe.com`과 같은 파생 서비스 호스트는 허용되지 않습니다.
    OpenClaw가 테넌트 루트에서 해당 엔드포인트를 자동으로 파생합니다.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="도메인이 구성에 영구 저장됨">
    선택한 호스트는 공급자 매개변수 아래에 저장되므로 이후 토큰 갱신과 완료 요청이
    자동으로 해당 테넌트를 대상으로 합니다.

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

디바이스 흐름, 토큰 교환, 완료 요청은 각각
`https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token`,
`https://copilot-api.your-org.ghe.com`으로 확인됩니다. 데이터 상주 토큰에는
테넌트 스탬프가 포함되지만 프록시 힌트는 없으므로 완료 요청의 기본 URL은 공개
엔드포인트 대신 테넌트 Copilot 호스트로 대체됩니다.

<Note>
도메인을 전환하면 항상 디바이스 로그인이 다시 실행됩니다. Copilot 토큰이 이미
저장되어 있는 상태에서 다른 도메인(공개 `github.com` ↔ `*.ghe.com` 테넌트
또는 한 테넌트에서 다른 테넌트)을 선택하면 OpenClaw는 기존 토큰을 재사용하지
않습니다. 구성에 기록되는 도메인으로 토큰 범위가 지정되도록 새 로그인을
강제합니다. *동일한* 도메인에서 로그인을 다시 실행하는 경우에는 현재 토큰을
재사용할지 묻습니다. 공개 `github.com`으로 다시 전환하면 영구 저장된
`githubDomain`이 삭제되어 구성이 기본값으로 돌아갑니다.
</Note>

<Note>
`COPILOT_GITHUB_DOMAIN` 환경 변수는 도메인을 확인하는 모든 Copilot 경로에서
확인된 도메인을 재정의합니다. 여기에는 Enterprise 디바이스 로그인
(`--method device-enterprise`), 독립 실행형
`openclaw models auth login-github-copilot` 바로 가기, 토큰 갱신, 임베딩,
완료 요청이 포함됩니다. 완전한 헤드리스 또는 CI 설정에서는 이 변수를
`*.ghe.com` 호스트로 설정하십시오. 공개 `github.com`을 사용하려면 이 변수를
설정하지 않고 구성 매개변수도 지정하지 마십시오. 로그인 시 토큰을 발급한
도메인이 영구 저장되며(공개 `github.com`에 로그인하면 삭제됨), 환경 변수를
설정 해제한 후에도 라우팅이 올바르게 유지됩니다.
</Note>

## 선택적 플래그

| 명령                                                                   | 플래그          | 설명                                              |
| ---------------------------------------------------------------------- | --------------- | ------------------------------------------------- |
| `openclaw models auth login-github-copilot`                            | `--yes`         | 확인 없이 기존 인증 프로필을 덮어씁니다           |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | 공급자가 권장하는 기본 모델도 함께 적용합니다     |

```bash
# 재로그인 확인 건너뛰기
openclaw models auth login-github-copilot --yes

# 한 단계에서 로그인하고 기본 모델 설정
openclaw models auth login --provider github-copilot --method device --set-default
```

## 비대화형 온보딩

디바이스 로그인 흐름에는 대화형 TTY가 필요합니다. 헤드리스 설정에서는
`openclaw onboard --non-interactive`를 사용하여 기존 GitHub OAuth 액세스
토큰을 가져오십시오.

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

`--auth-choice`를 생략할 수도 있습니다. `--github-copilot-token`을 전달하면
GitHub Copilot 공급자 인증 선택지가 추론됩니다. 플래그를 생략하면 온보딩에서
`COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` 순서로 대체합니다.
`COPILOT_GITHUB_TOKEN`을 설정한 상태에서 `--secret-input-mode ref`를 사용하면
`auth-profiles.json`에 일반 텍스트 대신 환경 변수 기반 `tokenRef`가 저장됩니다.

<AccordionGroup>
  <Accordion title="대화형 TTY 필요">
    디바이스 로그인 흐름에는 대화형 TTY가 필요합니다. 비대화형 스크립트나 CI
    파이프라인이 아닌 터미널에서 직접 실행하십시오.
  </Accordion>

  <Accordion title="모델 가용성은 요금제에 따라 달라짐">
    Copilot 모델 가용성은 GitHub 요금제에 따라 달라집니다. 모델이 거부되면
    다른 ID(예: `github-copilot/gpt-5.5`)를 사용해 보십시오. 현재 모델 목록은
    GitHub의 [Copilot 요금제별 지원 모델](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)을
    참조하십시오.
  </Accordion>

  <Accordion title="Copilot API에서 실시간 카탈로그 갱신">
    디바이스 로그인(또는 환경 변수) 인증 경로에서 GitHub 토큰을 확인한 후,
    OpenClaw는 필요할 때 `${baseUrl}/models`(VS Code Copilot에서 사용하는
    것과 동일한 엔드포인트)에서 모델 카탈로그를 갱신합니다. 따라서 매니페스트를
    계속 변경하지 않고도 런타임에서 계정별 사용 권한과 정확한 컨텍스트 창을
    추적할 수 있습니다. 새로 출시된 Copilot 모델은 OpenClaw를 업그레이드하지
    않아도 표시되며, 컨텍스트 창에는 실제 모델별 제한이 반영됩니다
    (예: gpt-5.x 계열은 400k, 내부 `claude-opus-*-1m` 변형은 1M).

    검색이 비활성화되었거나, 사용자에게 GitHub 인증 프로필이 없거나, 토큰 교환이
    실패하거나, `/models` HTTPS 호출에서 오류가 발생하면 번들 정적 카탈로그가
    표시되는 대체 항목으로 유지됩니다. 이 기능을 사용하지 않고 정적 매니페스트
    카탈로그에만 전적으로 의존하려면(오프라인/에어 갭 시나리오) 다음과 같이
    설정하십시오.

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

  <Accordion title="전송 방식 선택">
    Claude 모델 ID는 Anthropic Messages 전송 방식을 자동으로 사용합니다.
    Gemini 모델은 OpenAI Chat Completions 전송 방식을 사용하며, GPT 및 o-series
    모델은 계속 OpenAI Responses 전송 방식을 사용합니다. OpenClaw는 모델 참조를
    기준으로 올바른 전송 방식을 선택합니다.
  </Accordion>

  <Accordion title="요청 호환성">
    OpenClaw는 Copilot 전송에서 Copilot IDE 스타일 요청 헤더(VS Code
    편집기/Plugin 버전 및 `vscode-chat` 통합 ID)를 전송하고, 도구 결과 후속
    턴을 에이전트가 시작한 것으로 표시하며, 턴에 이미지 입력이 포함된 경우
    Copilot 비전 헤더를 설정합니다.
  </Accordion>

  <Accordion title="환경 변수 확인 순서">
    OpenClaw는 다음 우선순위로 환경 변수에서 Copilot 인증을 확인합니다.

    | 우선순위 | 변수                   | 참고                               |
    | -------- | ---------------------- | ---------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | 최고 우선순위, Copilot 전용        |
    | 2        | `GH_TOKEN`             | GitHub CLI 토큰(대체 항목)         |
    | 3        | `GITHUB_TOKEN`         | 표준 GitHub 토큰(최저 우선순위)    |

    여러 변수가 설정되어 있으면 OpenClaw는 우선순위가 가장 높은 변수를 사용합니다.
    디바이스 로그인 흐름(`openclaw models auth login-github-copilot`)은 토큰을
    인증 프로필 저장소에 저장하며 모든 환경 변수보다 우선합니다.

  </Accordion>

  <Accordion title="토큰 저장">
    로그인 시 GitHub 토큰이 인증 프로필 저장소(프로필 ID
    `github-copilot:github`)에 저장되고, OpenClaw 실행 시 수명이 짧은 Copilot
    API 토큰으로 교환됩니다. 토큰을 수동으로 관리할 필요가 없습니다.
  </Accordion>
</AccordionGroup>

## 메모리 검색 임베딩

GitHub Copilot은 [메모리 검색](/ko/concepts/memory-search)의 임베딩 공급자로도
사용할 수 있습니다. Copilot 구독이 있고 로그인한 경우 별도의 API 키 없이
OpenClaw에서 임베딩에 사용할 수 있습니다.

### 구성

GitHub Copilot 임베딩을 사용하려면 `memorySearch.provider`를 명시적으로
설정하십시오. GitHub 토큰을 사용할 수 있으면 OpenClaw는 Copilot API에서
사용 가능한 임베딩 모델을 검색하고 가장 적합한 모델을 자동으로 선택합니다.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // 선택 사항: 자동 검색된 모델 재정의
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### 작동 방식

1. OpenClaw가 GitHub 토큰을 확인합니다(환경 변수 또는 인증 프로필에서).
2. 수명이 짧은 Copilot API 토큰으로 교환합니다.
3. Copilot `/models` 엔드포인트를 조회하여 사용 가능한 임베딩 모델을 검색합니다.
4. 가장 적합한 모델을 선택합니다(선호 순서: `text-embedding-3-small`,
   `text-embedding-3-large`, `text-embedding-ada-002`).
5. Copilot `/embeddings` 엔드포인트로 임베딩 요청을 전송합니다.

모델 가용성은 GitHub 요금제에 따라 달라집니다. 사용 가능한 임베딩 모델이
없으면 OpenClaw는 Copilot을 건너뛰고 다음 공급자를 시도합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 자격 증명 재사용 규칙입니다.
  </Card>
</CardGroup>
