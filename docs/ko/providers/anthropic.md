---
read_when:
    - OpenClaw에서 Anthropic 모델을 사용하려고 합니다
summary: OpenClaw에서 API 키 또는 Claude CLI를 통해 Anthropic Claude 사용하기
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:43:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic은 **Claude** 모델 제품군을 만듭니다. OpenClaw는 두 가지 인증 경로를 지원합니다.

- **API 키** — 사용량 기반 과금으로 Anthropic API에 직접 액세스(`anthropic/*` 모델)
- **Claude CLI** — 같은 호스트의 기존 Claude Code 로그인을 재사용

<Warning>
OpenClaw의 Claude CLI 백엔드는 설치된 Claude Code CLI를 비대화형 출력 모드로 실행합니다. Anthropic의 현재 Claude Code 문서는 `claude -p`를 Agent SDK/프로그래밍 방식 사용으로 설명합니다. Anthropic의 2026년 6월 15일 지원 업데이트는 발표되었던 Agent SDK 과금 변경을 일시 중단했습니다. 현재 Anthropic은 Claude Agent SDK, `claude -p`, 서드파티 앱 사용량이 여전히 구독의 사용 한도에서 차감된다고 말합니다. 이전에 발표된 월간 Agent SDK 크레딧은 Anthropic이 해당 계획을 수정하는 동안 사용할 수 없습니다.

대화형 Claude Code도 로그인된 Claude 플랜 한도에서 계속 차감됩니다. API 키 인증은 그대로 직접 종량제 API 과금입니다. 장기간 실행되는 Gateway 호스트, 공유 자동화, 예측 가능한 프로덕션 지출에는 Anthropic API 키를 사용하세요.

구독 과금 동작에 의존하기 전에 Anthropic의 최신 지원 문서를 확인하세요.

- [Claude Code CLI 참조](https://code.claude.com/docs/en/cli-usage)
- [Claude 플랜으로 Claude Agent SDK 사용](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Pro 또는 Max 플랜으로 Claude Code 사용](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Team 또는 Enterprise 플랜으로 Claude Code 사용](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code 비용 관리](https://code.claude.com/docs/en/costs)

</Warning>

## 시작하기

<Tabs>
  <Tab title="API 키">
    **가장 적합한 경우:** 표준 API 액세스와 사용량 기반 과금.

    <Steps>
      <Step title="API 키 받기">
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

    ### 구성 예시

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **가장 적합한 경우:** 별도의 API 키 없이 기존 Claude CLI 로그인을 재사용.

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

    <Warning>
    Claude CLI 재사용은 OpenClaw 프로세스가 Claude CLI 로그인과 같은 호스트에서 실행된다고 가정합니다. Docker 설치는 컨테이너 홈을 유지하고 그 안에서 Claude Code에 로그인할 수 있습니다. [Docker의 Claude CLI 백엔드](/ko/install/docker#claude-cli-backend-in-docker)를 참조하세요. [Podman](/ko/install/podman) 같은 다른 컨테이너 설치는 호스트 `~/.claude`를 설정 또는 런타임에 마운트하지 않습니다. 이 경우 Anthropic API 키를 사용하거나 [OpenAI Codex](/ko/providers/openai)처럼 OpenClaw 관리 OAuth를 제공하는 공급자를 선택하세요.
    </Warning>

    ### 구성 예시

    표준 Anthropic 모델 참조와 CLI 런타임 재정의를 함께 사용하는 방식을 권장합니다.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    레거시 `claude-cli/claude-opus-4-7` 모델 참조도 호환성을 위해 계속 작동하지만, 새 구성에서는 공급자/모델 선택을 `anthropic/*`로 유지하고 실행 백엔드는 공급자/모델 런타임 정책에 넣어야 합니다.

    ### 과금 및 `claude -p`

    OpenClaw는 Claude CLI 실행에 Claude Code의 비대화형 `claude -p` 경로를 사용합니다. Anthropic은 현재 이 경로를 Agent SDK/프로그래밍 방식 사용으로 취급합니다.

    - Anthropic의 2026년 6월 15일 지원 업데이트는 이전에 발표된 별도 Agent SDK 크레딧 계획을 일시 중단했습니다.
    - 현재 구독 플랜의 Claude Agent SDK, `claude -p`, 서드파티 앱 사용량은 여전히 로그인된 구독의 사용 한도에서 차감됩니다.
    - 이전에 발표된 월간 Agent SDK 크레딧은 Anthropic이 해당 계획을 수정하는 동안 사용할 수 없습니다.
    - Console/API 키 로그인은 종량제 API 과금을 사용하며 구독 Agent SDK 크레딧을 받지 않습니다.

    일시 중단 공지는 Anthropic의 [Agent SDK 플랜 문서](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)를 참조하고, 구독 동작은 Claude Code 플랜 문서인 [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan) 및 [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)를 참조하세요.

    Anthropic은 OpenClaw 릴리스 없이 Claude Code 과금 및 속도 제한 동작을 변경할 수 있습니다. 과금 예측 가능성이 중요하다면 `claude auth status`, `/status`, 그리고 Anthropic의 링크된 문서를 확인하세요.

    <Tip>
    공유 프로덕션 자동화에는 Claude CLI 대신 Anthropic API 키를 사용하세요. OpenClaw는 [OpenAI Codex](/ko/providers/openai), [Qwen Cloud](/ko/providers/qwen), [MiniMax](/ko/providers/minimax), [Z.AI / GLM](/ko/providers/zai)의 구독형 옵션도 지원합니다.
    </Tip>

  </Tab>
</Tabs>

## 사고 기본값(Claude Fable 5, 4.8 및 4.6)

`anthropic/claude-fable-5`는 항상 적응형 사고를 사용하며 기본값은 `high` 노력도입니다. Anthropic이 이 모델에서 사고 비활성화를 허용하지 않기 때문에 `/think off`와 `/think minimal`은 `low` 노력도를 사용합니다. OpenClaw는 Fable 5 요청에서 사용자 지정 temperature 값도 생략합니다.

Claude Opus 4.8은 OpenClaw에서 기본적으로 사고가 꺼진 상태를 유지합니다. `/think high|xhigh|max`로 적응형 사고를 명시적으로 활성화하면 OpenClaw는 Anthropic의 Opus 4.8 노력도 값을 전송합니다. Claude 4.6 모델은 기본값이 `adaptive`입니다.

메시지별로 `/think:<level>`로 재정의하거나 모델 매개변수에서 재정의합니다.

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
관련 Anthropic 문서:
- [적응형 사고](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [확장 사고](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## 프롬프트 캐싱

OpenClaw는 API 키 인증에 대해 Anthropic의 프롬프트 캐싱 기능을 지원합니다.

| 값                  | 캐시 기간 | 설명                                  |
| ------------------- | --------- | ------------------------------------- |
| `"short"` (기본값)  | 5분       | API 키 인증에 자동 적용              |
| `"long"`            | 1시간     | 확장 캐시                            |
| `"none"`            | 캐싱 없음 | 프롬프트 캐싱 비활성화              |

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
    모델 수준 매개변수를 기준값으로 사용한 다음 `agents.list[].params`를 통해 특정 에이전트를 재정의합니다.

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

    구성 병합 순서:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params`(일치하는 `id`, 키별로 재정의)

    이를 통해 한 에이전트는 장기 캐시를 유지하고, 같은 모델의 다른 에이전트는 급증형/낮은 재사용 트래픽에 대해 캐싱을 비활성화할 수 있습니다.

  </Accordion>

  <Accordion title="Bedrock Claude 참고 사항">
    - Bedrock의 Anthropic Claude 모델(`amazon-bedrock/*anthropic.claude*`)은 구성된 경우 `cacheRetention` 패스스루를 허용합니다.
    - Anthropic이 아닌 Bedrock 모델은 런타임에서 `cacheRetention: "none"`으로 강제됩니다.
    - API 키 스마트 기본값은 명시적 값이 설정되지 않은 경우 Claude-on-Bedrock 참조에도 `cacheRetention: "short"`를 설정합니다.

  </Accordion>
</AccordionGroup>

## 고급 구성

<AccordionGroup>
  <Accordion title="빠른 모드">
    OpenClaw의 공유 `/fast` 토글은 Anthropic 직접 트래픽(API 키 및 `api.anthropic.com`에 대한 OAuth)을 지원합니다.

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
    - 명시적 `serviceTier` 또는 `service_tier` 매개변수는 둘 다 설정된 경우 `/fast`를 재정의합니다.
    - Priority Tier 용량이 없는 계정에서는 `service_tier: "auto"`가 `standard`로 해석될 수 있습니다.

    </Note>

  </Accordion>

  <Accordion title="미디어 이해(이미지 및 PDF)">
    번들된 Anthropic Plugin은 이미지 및 PDF 이해를 등록합니다. OpenClaw는 구성된 Anthropic 인증에서 미디어 기능을 자동으로 확인합니다. 추가 구성은 필요하지 않습니다.

    | 속성            | 값                    |
    | --------------- | --------------------- |
    | 기본 모델       | `claude-opus-4-8`     |
    | 지원 입력       | 이미지, PDF 문서     |

    이미지 또는 PDF가 대화에 첨부되면 OpenClaw는 이를 Anthropic 미디어 이해 공급자를 통해 자동으로 라우팅합니다.

  </Accordion>

  <Accordion title="1M 컨텍스트 창">
    Anthropic의 1M 컨텍스트 창은 Opus 4.8, Opus 4.7, Opus 4.6, Sonnet 4.6 같은 GA 지원 Claude 4.x 모델에서 사용할 수 있습니다. OpenClaw는 해당 모델의 크기를 자동으로 1M으로 설정합니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    이전 구성은 `params.context1m: true`를 유지할 수 있지만, OpenClaw는 더 이상 폐기된 `context-1m-2025-08-07` 베타 헤더를 보내지 않습니다. 해당 값이 있는 이전 `anthropicBeta` 구성 항목은 요청 헤더 확인 중 무시되며, 지원되지 않는 이전 Claude 모델은 일반 컨텍스트 창을 유지합니다.

    `params.context1m: true`는 적격 GA 지원 Opus 및 Sonnet 모델의 Claude CLI 백엔드(`claude-cli/*`)에도 적용되어, 해당 CLI 세션의 런타임 컨텍스트 창이 직접 API 동작과 일치하도록 유지합니다.

    <Warning>
    Anthropic 자격 증명에 긴 컨텍스트 액세스 권한이 필요합니다. OAuth/구독 토큰 인증은 필요한 Anthropic 베타 헤더를 유지하지만, OpenClaw는 이전 구성에 남아 있는 경우 폐기된 1M 베타 헤더를 제거합니다.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M 컨텍스트">
    `anthropic/claude-opus-4-8` 및 해당 `claude-cli` 변형은 기본적으로 1M 컨텍스트
    창을 가집니다. `params.context1m: true`는 필요하지 않습니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="401 오류 / 토큰이 갑자기 유효하지 않음">
    Anthropic 토큰 인증은 만료될 수 있으며 철회될 수도 있습니다. 새 설정에는 대신 Anthropic API 키를 사용하세요.
  </Accordion>

  <Accordion title='제공자 "anthropic"에 대한 API 키를 찾을 수 없음'>
    Anthropic 인증은 **에이전트별**입니다. 새 에이전트는 기본 에이전트의 키를 상속하지 않습니다. 해당 에이전트에 대해 온보딩을 다시 실행하거나 Gateway 호스트에 API 키를 구성한 다음, `openclaw models status`로 확인하세요.
  </Accordion>

  <Accordion title='프로필 "anthropic:default"에 대한 자격 증명을 찾을 수 없음'>
    `openclaw models status`를 실행하여 어떤 인증 프로필이 활성 상태인지 확인하세요. 온보딩을 다시 실행하거나 해당 프로필 경로에 대한 API 키를 구성하세요.
  </Accordion>

  <Accordion title="사용 가능한 인증 프로필 없음(모두 쿨다운 중)">
    `auth.unusableProfiles`를 보려면 `openclaw models status --json`을 확인하세요. Anthropic 속도 제한 쿨다운은 모델 범위일 수 있으므로, 같은 계열의 다른 Anthropic 모델은 여전히 사용할 수 있습니다. 다른 Anthropic 프로필을 추가하거나 쿨다운이 끝날 때까지 기다리세요.
  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="CLI 백엔드" href="/ko/gateway/cli-backends" icon="terminal">
    Claude CLI 백엔드 설정 및 런타임 세부 정보.
  </Card>
  <Card title="프롬프트 캐싱" href="/ko/reference/prompt-caching" icon="database">
    제공자 전반에서 프롬프트 캐싱이 작동하는 방식.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
