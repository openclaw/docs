---
read_when:
    - OpenClaw에서 Anthropic 모델을 사용하려는 경우
summary: OpenClaw에서 API 키 또는 Claude CLI를 통해 Anthropic Claude 사용
title: Anthropic
x-i18n:
    generated_at: "2026-05-07T13:23:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15ae1d2751d0127a45ece3d0a25bead21fd6bacc2ffc80636188fc2cb5f3d7ce
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic은 **Claude** 모델 제품군을 만듭니다. OpenClaw는 두 가지 인증 경로를 지원합니다.

- **API 키** — 사용량 기반 과금이 적용되는 직접 Anthropic API 액세스(`anthropic/*` 모델)
- **Claude CLI** — 동일한 호스트의 기존 Claude CLI 로그인을 재사용

<Warning>
Anthropic 직원은 OpenClaw 방식의 Claude CLI 사용이 다시 허용된다고 알려왔으므로,
OpenClaw는 Anthropic이 새 정책을 게시하지 않는 한 Claude CLI 재사용과 `claude -p` 사용을 승인된 것으로 취급합니다.

장기간 실행되는 gateway 호스트의 경우 Anthropic API 키가 여전히 가장 명확하고
예측 가능한 프로덕션 경로입니다.

Anthropic의 현재 공개 문서:

- [Claude Code CLI 참조](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK 개요](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Pro 또는 Max 플랜에서 Claude Code 사용](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Team 또는 Enterprise 플랜에서 Claude Code 사용](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## 시작하기

<Tabs>
  <Tab title="API 키">
    **권장 대상:** 표준 API 액세스 및 사용량 기반 과금.

    <Steps>
      <Step title="API 키 가져오기">
        [Anthropic Console](https://console.anthropic.com/)에서 API 키를 생성합니다.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        또는 키를 직접 전달합니다.

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

    ### 설정 예시

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **권장 대상:** 별도 API 키 없이 기존 Claude CLI 로그인을 재사용.

    <Steps>
      <Step title="Claude CLI가 설치되어 있고 로그인되어 있는지 확인">
        다음으로 확인합니다.

        ```bash
        claude --version
        ```
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw는 기존 Claude CLI 자격 증명을 감지하고 재사용합니다.
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI 백엔드의 설정 및 런타임 세부 정보는 [CLI 백엔드](/ko/gateway/cli-backends)에 있습니다.
    </Note>

    ### 설정 예시

    표준 Anthropic 모델 참조와 CLI 런타임 재정의를 함께 사용하는 것을 권장합니다.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    레거시 `claude-cli/claude-opus-4-7` 모델 참조도 호환성을 위해 계속 작동하지만,
    새 설정에서는 provider/model 선택을 `anthropic/*`로 유지하고 실행 백엔드는
    `agentRuntime.id`에 넣어야 합니다.

    <Tip>
    가장 명확한 과금 경로를 원한다면 Anthropic API 키를 대신 사용하세요. OpenClaw는 [OpenAI Codex](/ko/providers/openai), [Qwen Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [Z.AI / GLM](/ko/providers/glm)의 구독형 옵션도 지원합니다.
    </Tip>

  </Tab>
</Tabs>

## Thinking 기본값(Claude 4.6)

Claude 4.6 모델은 명시적인 thinking 수준이 설정되지 않은 경우 OpenClaw에서 기본적으로 `adaptive` thinking을 사용합니다.

메시지별로 `/think:<level>`을 사용하거나 모델 매개변수에서 재정의합니다.

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

| 값                  | 캐시 기간 | 설명                                  |
| ------------------- | --------- | ------------------------------------- |
| `"short"`(기본값)   | 5분       | API 키 인증에 자동으로 적용됨         |
| `"long"`            | 1시간     | 확장 캐시                             |
| `"none"`            | 캐싱 없음 | 프롬프트 캐싱 비활성화                |

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
    모델 수준 매개변수를 기준값으로 사용한 다음, `agents.list[].params`를 통해 특정 에이전트를 재정의합니다.

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

    설정 병합 순서:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`(일치하는 `id`, 키별 재정의)

    이를 통해 같은 모델의 한 에이전트는 장기 캐시를 유지하고, 다른 에이전트는 짧은 시간에 몰리는 재사용률 낮은 트래픽에 대해 캐싱을 비활성화할 수 있습니다.

  </Accordion>

  <Accordion title="Bedrock Claude 참고 사항">
    - Bedrock의 Anthropic Claude 모델(`amazon-bedrock/*anthropic.claude*`)은 설정된 경우 `cacheRetention` 패스스루를 허용합니다.
    - Anthropic이 아닌 Bedrock 모델은 런타임에 `cacheRetention: "none"`으로 강제됩니다.
    - API 키 스마트 기본값은 명시적 값이 설정되지 않은 경우 Claude-on-Bedrock 참조에도 `cacheRetention: "short"`를 시드합니다.

  </Accordion>
</AccordionGroup>

## 고급 설정

<AccordionGroup>
  <Accordion title="빠른 모드">
    OpenClaw의 공유 `/fast` 토글은 직접 Anthropic 트래픽(API 키 및 `api.anthropic.com`으로의 OAuth)을 지원합니다.

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
    - 직접 `api.anthropic.com` 요청에만 주입됩니다. 프록시 경로는 `service_tier`를 그대로 둡니다.
    - 명시적인 `serviceTier` 또는 `service_tier` 매개변수가 설정된 경우 `/fast`보다 우선합니다.
    - Priority Tier 용량이 없는 계정에서는 `service_tier: "auto"`가 `standard`로 해석될 수 있습니다.

    </Note>

  </Accordion>

  <Accordion title="미디어 이해(이미지 및 PDF)">
    번들 Anthropic Plugin은 이미지 및 PDF 이해 기능을 등록합니다. OpenClaw는
    설정된 Anthropic 인증에서 미디어 기능을 자동으로 해석하므로 추가 설정이
    필요하지 않습니다.

    | 속성 | 값 |
    | --------------- | --------------------- |
    | 기본 모델 | `claude-opus-4-7` |
    | 지원 입력 | 이미지, PDF 문서 |

    이미지 또는 PDF가 대화에 첨부되면 OpenClaw는 자동으로
    Anthropic 미디어 이해 provider를 통해 라우팅합니다.

  </Accordion>

  <Accordion title="1M 컨텍스트 창(베타)">
    Anthropic의 1M 컨텍스트 창은 베타 게이트가 적용됩니다. 모델별로 활성화합니다.

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

    OpenClaw는 요청에서 이를 `anthropic-beta: context-1m-2025-08-07`로 매핑합니다.

    `params.context1m: true`는 적격 Opus 및 Sonnet 모델의 Claude CLI 백엔드
    (`claude-cli/*`)에도 적용되어, 해당 CLI 세션의 런타임 컨텍스트 창을
    직접 API 동작과 일치하도록 확장합니다.

    <Warning>
    Anthropic 자격 증명에 긴 컨텍스트 액세스 권한이 필요합니다. 레거시 토큰 인증(`sk-ant-oat-*`)은 1M 컨텍스트 요청에서 거부됩니다. OpenClaw는 경고를 기록하고 표준 컨텍스트 창으로 폴백합니다.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M 컨텍스트">
    `anthropic/claude-opus-4.7` 및 해당 `claude-cli` 변형은 기본적으로 1M 컨텍스트
    창을 가집니다. `params.context1m: true`는 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="401 오류 / 토큰이 갑자기 유효하지 않음">
    Anthropic 토큰 인증은 만료될 수 있으며 철회될 수 있습니다. 새 설정에서는 대신 Anthropic API 키를 사용하세요.
  </Accordion>

  <Accordion title='provider "anthropic"에 대한 API 키를 찾을 수 없음'>
    Anthropic 인증은 **에이전트별**입니다. 새 에이전트는 기본 에이전트의 키를 상속하지 않습니다. 해당 에이전트에 대해 온보딩을 다시 실행하거나 gateway 호스트에 API 키를 설정한 다음, `openclaw models status`로 확인하세요.
  </Accordion>

  <Accordion title='profile "anthropic:default"에 대한 자격 증명을 찾을 수 없음'>
    어떤 인증 프로필이 활성 상태인지 확인하려면 `openclaw models status`를 실행하세요. 온보딩을 다시 실행하거나 해당 프로필 경로에 대한 API 키를 설정하세요.
  </Accordion>

  <Accordion title="사용 가능한 인증 프로필 없음(모두 쿨다운 중)">
    `auth.unusableProfiles`를 확인하려면 `openclaw models status --json`을 확인하세요. Anthropic 속도 제한 쿨다운은 모델 범위일 수 있으므로, 형제 Anthropic 모델은 여전히 사용할 수 있을 수 있습니다. 다른 Anthropic 프로필을 추가하거나 쿨다운이 끝날 때까지 기다리세요.
  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="CLI 백엔드" href="/ko/gateway/cli-backends" icon="terminal">
    Claude CLI 백엔드 설정 및 런타임 세부 정보.
  </Card>
  <Card title="프롬프트 캐싱" href="/ko/reference/prompt-caching" icon="database">
    provider 전반에서 프롬프트 캐싱이 작동하는 방식.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
