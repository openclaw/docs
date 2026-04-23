---
read_when:
    - OpenClaw에서 Anthropic 모델을 사용하려고 합니다
summary: API 키 또는 Claude CLI를 통해 OpenClaw에서 Anthropic Claude 사용하기
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T14:06:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e1e95c84a43b083d12558d8b8c86d36b79e7ef15e4ad7e96a84b2d0e1ea36585
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic는 **Claude** 모델 제품군을 개발합니다. OpenClaw는 두 가지 인증 경로를 지원합니다:

- **API 키** — 사용량 기반 청구를 사용하는 직접 Anthropic API 액세스(`anthropic/*` 모델)
- **Claude CLI** — 같은 호스트의 기존 Claude CLI 로그인을 재사용

<Warning>
Anthropic 담당자가 OpenClaw 스타일의 Claude CLI 사용이 다시 허용된다고 알려주었으므로,
Anthropic가 새로운 정책을 발표하지 않는 한 OpenClaw는 Claude CLI 재사용과
`claude -p` 사용을 허용된 것으로 취급합니다.

장기간 실행되는 Gateway 호스트에서는 Anthropic API 키가 여전히 가장 명확하고
예측 가능한 프로덕션 경로입니다.

Anthropic의 현재 공개 문서:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## 시작하기

<Tabs>
  <Tab title="API 키">
    **가장 적합한 경우:** 표준 API 액세스 및 사용량 기반 청구.

    <Steps>
      <Step title="API 키 받기">
        [Anthropic Console](https://console.anthropic.com/)에서 API 키를 생성합니다.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        # 선택: Anthropic API key
        ```

        또는 키를 직접 전달합니다:

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

    ### config 예시

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **가장 적합한 경우:** 별도의 API 키 없이 기존 Claude CLI 로그인을 재사용.

    <Steps>
      <Step title="Claude CLI가 설치되고 로그인되어 있는지 확인">
        다음으로 확인합니다:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        # 선택: Claude CLI
        ```

        OpenClaw는 기존 Claude CLI credentials를 감지하고 재사용합니다.
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 백엔드의 설정 및 런타임 세부 사항은 [CLI Backends](/ko/gateway/cli-backends)에 있습니다.
    </Note>

    <Tip>
    가장 명확한 청구 경로를 원하면 Anthropic API 키를 대신 사용하세요. OpenClaw는 [OpenAI Codex](/ko/providers/openai), [Qwen Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [Z.AI / GLM](/ko/providers/glm)의 구독형 옵션도 지원합니다.
    </Tip>

  </Tab>
</Tabs>

## Thinking 기본값(Claude 4.6)

Claude 4.6 모델은 명시적인 thinking level이 설정되지 않은 경우 OpenClaw에서 기본적으로 `adaptive` thinking을 사용합니다.

메시지별로 `/think:<level>` 또는 모델 params에서 재정의합니다:

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

OpenClaw는 API 키 인증에 대해 Anthropic의 프롬프트 캐싱 기능을 지원합니다.

| 값                  | 캐시 기간 | 설명                                   |
| ------------------- | --------- | -------------------------------------- |
| `"short"` (기본값)  | 5분       | API 키 인증에 자동 적용                |
| `"long"`            | 1시간     | 확장 캐시                              |
| `"none"`            | 캐싱 없음 | 프롬프트 캐싱 비활성화                 |

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
  <Accordion title="agent별 캐시 재정의">
    모델 수준 params를 기준선으로 사용한 다음, `agents.list[].params`를 통해 특정 agent를 재정의하세요:

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

    config 병합 순서:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id`가 일치할 때, 키 기준 재정의)

    이렇게 하면 한 agent는 장기 캐시를 유지하면서, 같은 모델을 사용하는 다른 agent는 버스트성/재사용이 적은 트래픽에 대해 캐싱을 비활성화할 수 있습니다.

  </Accordion>

  <Accordion title="Bedrock Claude 참고">
    - Bedrock의 Anthropic Claude 모델(`amazon-bedrock/*anthropic.claude*`)은 구성된 경우 `cacheRetention` pass-through를 허용합니다.
    - Anthropic가 아닌 Bedrock 모델은 런타임에 강제로 `cacheRetention: "none"`으로 설정됩니다.
    - API 키 스마트 기본값은 명시적 값이 없을 때 Claude-on-Bedrock ref에 대해서도 `cacheRetention: "short"`를 기본 설정합니다.
  </Accordion>
</AccordionGroup>

## 고급 구성

<AccordionGroup>
  <Accordion title="Fast mode">
    OpenClaw의 공용 `/fast` 토글은 직접 Anthropic 트래픽(`api.anthropic.com`으로의 API 키 및 OAuth)도 지원합니다.

    | 명령 | 매핑 대상 |
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
    - 직접 `api.anthropic.com` 요청에만 주입됩니다. 프록시 경로는 `service_tier`를 건드리지 않습니다.
    - 명시적인 `serviceTier` 또는 `service_tier` params가 설정되면 둘 다 있을 때 `/fast`보다 우선합니다.
    - Priority Tier 용량이 없는 계정에서는 `service_tier: "auto"`가 `standard`로 확인될 수 있습니다.
    </Note>

  </Accordion>

  <Accordion title="미디어 이해(이미지 및 PDF)">
    번들된 Anthropic plugin은 이미지 및 PDF 이해 기능을 등록합니다. OpenClaw는
    구성된 Anthropic 인증에서 미디어 capabilities를 자동으로 확인하므로
    추가 config는 필요하지 않습니다.

    | 속성           | 값                   |
    | -------------- | -------------------- |
    | 기본 모델      | `claude-opus-4-6`    |
    | 지원 입력      | 이미지, PDF 문서     |

    이미지나 PDF가 대화에 첨부되면, OpenClaw는 자동으로
    이를 Anthropic 미디어 이해 provider를 통해 라우팅합니다.

  </Accordion>

  <Accordion title="1M 컨텍스트 윈도우(beta)">
    Anthropic의 1M 컨텍스트 윈도우는 beta 게이트로 보호됩니다. 모델별로 활성화하세요:

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
    Anthropic credential에 대한 장문맥 액세스가 필요합니다. 레거시 토큰 인증(`sk-ant-oat-*`)은 1M 컨텍스트 요청에서 거부됩니다. OpenClaw는 경고를 기록하고 표준 컨텍스트 윈도우로 폴백합니다.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M 컨텍스트">
    `anthropic/claude-opus-4.7` 및 그 `claude-cli` 변형은 기본적으로 1M 컨텍스트
    윈도우를 사용합니다. `params.context1m: true`는 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="401 오류 / 토큰이 갑자기 유효하지 않음">
    Anthropic 토큰 인증은 만료되거나 취소될 수 있습니다. 새 설정에서는 Anthropic API 키로 마이그레이션하세요.
  </Accordion>

  <Accordion title='provider "anthropic"에 대한 API 키를 찾을 수 없음'>
    인증은 **agent별**입니다. 새 agent는 메인 agent의 키를 상속하지 않습니다. 해당 agent에 대해 온보딩을 다시 실행하거나, Gateway 호스트에 API 키를 구성한 다음 `openclaw models status`로 확인하세요.
  </Accordion>

  <Accordion title='profile "anthropic:default"에 대한 credentials를 찾을 수 없음'>
    어떤 인증 프로필이 활성 상태인지 보려면 `openclaw models status`를 실행하세요. 온보딩을 다시 실행하거나, 해당 프로필 경로에 대한 API 키를 구성하세요.
  </Accordion>

  <Accordion title="사용 가능한 인증 프로필 없음(모두 cooldown 상태)">
    `auth.unusableProfiles`를 보려면 `openclaw models status --json`을 확인하세요. Anthropic rate-limit cooldown은 모델 범위일 수 있으므로, 같은 Anthropic 계열의 다른 모델은 여전히 사용할 수 있을 수 있습니다. 다른 Anthropic 프로필을 추가하거나 cooldown이 끝날 때까지 기다리세요.
  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [Troubleshooting](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작 선택.
  </Card>
  <Card title="CLI 백엔드" href="/ko/gateway/cli-backends" icon="terminal">
    Claude CLI 백엔드 설정 및 런타임 세부 사항.
  </Card>
  <Card title="프롬프트 캐싱" href="/ko/reference/prompt-caching" icon="database">
    provider 전반에서 프롬프트 캐싱이 동작하는 방식.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 사항과 credentials 재사용 규칙.
  </Card>
</CardGroup>
