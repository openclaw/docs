---
read_when:
    - OpenClaw에서 Anthropic 모델을 사용하려는 경우
summary: API 키 또는 Claude CLI로 OpenClaw에서 Anthropic Claude 사용
title: Anthropic
x-i18n:
    generated_at: "2026-04-25T06:08:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic은 **Claude** 모델 계열을 개발합니다. OpenClaw는 두 가지 인증 경로를 지원합니다:

- **API key** — 사용량 기반 과금이 적용되는 직접 Anthropic API 액세스(`anthropic/*` 모델)
- **Claude CLI** — 동일 호스트의 기존 Claude CLI 로그인 재사용

<Warning>
Anthropic 직원은 OpenClaw 스타일의 Claude CLI 사용이 다시 허용된다고 알려주었으므로,
Anthropic이 새 정책을 발표하지 않는 한 OpenClaw는 Claude CLI 재사용과
`claude -p` 사용을 허용된 것으로 취급합니다.

장기간 실행되는 gateway 호스트의 경우, Anthropic API key가 여전히 가장 명확하고
예측 가능한 프로덕션 경로입니다.

Anthropic의 현재 공개 문서:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## 시작하기

<Tabs>
  <Tab title="API key">
    **가장 적합한 경우:** 표준 API 액세스 및 사용량 기반 과금.

    <Steps>
      <Step title="API key 받기">
        [Anthropic Console](https://console.anthropic.com/)에서 API key를 생성하세요.
      </Step>
      <Step title="onboarding 실행">
        ```bash
        openclaw onboard
        # 선택: Anthropic API key
        ```

        또는 key를 직접 전달하세요:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Config 예시

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **가장 적합한 경우:** 별도의 API key 없이 기존 Claude CLI 로그인을 재사용하는 경우.

    <Steps>
      <Step title="Claude CLI가 설치되고 로그인되어 있는지 확인">
        다음으로 확인하세요:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="onboarding 실행">
        ```bash
        openclaw onboard
        # 선택: Claude CLI
        ```

        OpenClaw는 기존 Claude CLI credential을 감지하고 재사용합니다.
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI backend의 setup 및 런타임 세부 정보는 [CLI Backends](/ko/gateway/cli-backends)에 있습니다.
    </Note>

    <Tip>
    가장 명확한 과금 경로를 원한다면 대신 Anthropic API key를 사용하세요. OpenClaw는 [OpenAI Codex](/ko/providers/openai), [Qwen Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [Z.AI / GLM](/ko/providers/glm)의 subscription 스타일 옵션도 지원합니다.
    </Tip>

  </Tab>
</Tabs>

## Thinking 기본값(Claude 4.6)

Claude 4.6 모델은 명시적인 thinking 수준이 설정되지 않은 경우 OpenClaw에서 기본적으로 `adaptive` thinking을 사용합니다.

메시지별로는 `/think:<level>`로, 또는 모델 params에서 재정의하세요:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
관련 Anthropic 문서:
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## 프롬프트 캐싱

OpenClaw는 API-key 인증에 대해 Anthropic의 프롬프트 캐싱 기능을 지원합니다.

| 값                  | 캐시 기간 | 설명                                 |
| ------------------- | --------- | ------------------------------------ |
| `"short"` (기본값)  | 5분       | API-key 인증에 자동 적용             |
| `"long"`            | 1시간     | 확장 캐시                            |
| `"none"`            | 캐싱 없음 | 프롬프트 캐싱 비활성화               |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="에이전트별 캐시 재정의">
    모델 수준 params를 기본값으로 사용한 다음, `agents.list[].params`로 특정 에이전트를 재정의하세요:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Config 병합 순서:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` 일치 시 키별 재정의)

    이렇게 하면 한 에이전트는 장시간 유지되는 캐시를 유지하고, 같은 모델을 사용하는 다른 에이전트는 급증하거나 재사용이 적은 트래픽에 대해 캐싱을 비활성화할 수 있습니다.

  </Accordion>

  <Accordion title="Bedrock Claude 참고">
    - Bedrock의 Anthropic Claude 모델(`amazon-bedrock/*anthropic.claude*`)은 구성된 경우 `cacheRetention` passthrough를 허용합니다.
    - Anthropic이 아닌 Bedrock 모델은 런타임에 강제로 `cacheRetention: "none"`이 적용됩니다.
    - API-key 스마트 기본값은 명시적인 값이 설정되지 않은 경우 Claude-on-Bedrock ref에 대해서도 `cacheRetention: "short"`를 설정합니다.
  </Accordion>
</AccordionGroup>

## 고급 구성

<AccordionGroup>
  <Accordion title="Fast 모드">
    OpenClaw의 공용 `/fast` 토글은 직접 Anthropic 트래픽(API-key 및 `api.anthropic.com`에 대한 OAuth)을 지원합니다.

    | 명령어 | 매핑 대상 |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - 직접 `api.anthropic.com` 요청에만 주입됩니다. 프록시 경로는 `service_tier`를 그대로 둡니다.
    - 명시적인 `serviceTier` 또는 `service_tier` params가 있으면 `/fast`보다 우선합니다.
    - Priority Tier 용량이 없는 계정에서는 `service_tier: "auto"`가 `standard`로 해석될 수 있습니다.
    </Note>

  </Accordion>

  <Accordion title="미디어 이해(이미지 및 PDF)">
    번들 Anthropic Plugin은 이미지 및 PDF 이해 기능을 등록합니다. OpenClaw는
    구성된 Anthropic 인증에서 미디어 capability를 자동으로 해석하므로 추가
    config가 필요하지 않습니다.

    | 속성            | 값                   |
    | --------------- | -------------------- |
    | 기본 모델       | `claude-opus-4-6`    |
    | 지원 입력       | 이미지, PDF 문서     |

    이미지나 PDF가 대화에 첨부되면 OpenClaw는 이를 자동으로
    Anthropic 미디어 이해 provider를 통해 라우팅합니다.

  </Accordion>

  <Accordion title="1M 컨텍스트 창(beta)">
    Anthropic의 1M 컨텍스트 창은 beta gate가 적용됩니다. 모델별로 활성화하세요:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw는 이를 요청 시 `anthropic-beta: context-1m-2025-08-07`로 매핑합니다.

    <Warning>
    Anthropic credential에서 긴 컨텍스트 액세스 권한이 필요합니다. 레거시 토큰 인증(`sk-ant-oat-*`)은 1M 컨텍스트 요청에서 거부되며, OpenClaw는 경고를 로그에 남기고 표준 컨텍스트 창으로 fallback합니다.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M 컨텍스트">
    `anthropic/claude-opus-4.7` 및 해당 `claude-cli` 변형은 기본적으로 1M 컨텍스트
    창을 사용합니다 — `params.context1m: true`가 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="401 오류 / 토큰이 갑자기 무효화됨">
    Anthropic 토큰 인증은 만료될 수 있고 취소될 수 있습니다. 새 설정에서는 대신 Anthropic API key를 사용하세요.
  </Accordion>

  <Accordion title='provider "anthropic"에 대한 API key를 찾을 수 없음'>
    Anthropic 인증은 **에이전트별**입니다 — 새 에이전트는 메인 에이전트의 key를 상속하지 않습니다. 해당 에이전트에 대해 onboarding을 다시 실행하거나(또는 gateway 호스트에 API key를 구성한 뒤), `openclaw models status`로 확인하세요.
  </Accordion>

  <Accordion title='profile "anthropic:default"에 대한 credential을 찾을 수 없음'>
    `openclaw models status`를 실행해 어떤 auth profile이 활성인지 확인하세요. onboarding을 다시 실행하거나, 해당 profile 경로에 API key를 구성하세요.
  </Accordion>

  <Accordion title="사용 가능한 auth profile 없음(모두 cooldown 상태)">
    `openclaw models status --json`에서 `auth.unusableProfiles`를 확인하세요. Anthropic 속도 제한 cooldown은 모델 범위일 수 있으므로, 형제 Anthropic 모델은 여전히 사용할 수 있을 수 있습니다. 다른 Anthropic profile을 추가하거나 cooldown이 끝날 때까지 기다리세요.
  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [Troubleshooting](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택하기.
  </Card>
  <Card title="CLI 백엔드" href="/ko/gateway/cli-backends" icon="terminal">
    Claude CLI backend setup 및 런타임 세부 정보.
  </Card>
  <Card title="프롬프트 캐싱" href="/ko/reference/prompt-caching" icon="database">
    provider 전반에서 프롬프트 캐싱이 동작하는 방식.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 credential 재사용 규칙.
  </Card>
</CardGroup>
