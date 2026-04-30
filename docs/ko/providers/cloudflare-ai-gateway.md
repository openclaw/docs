---
read_when:
    - OpenClaw와 함께 Cloudflare AI Gateway를 사용하려고 합니다
    - 계정 ID, Gateway ID 또는 API 키 환경 변수가 필요합니다
summary: Cloudflare AI Gateway 설정 (인증 + 모델 선택)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-30T06:46:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway는 제공자 API 앞단에 위치하여 분석, 캐싱, 제어 기능을 추가할 수 있게 해줍니다. Anthropic의 경우 OpenClaw는 Gateway 엔드포인트를 통해 Anthropic Messages API를 사용합니다.

| 속성          | 값                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- |
| 제공자        | `cloudflare-ai-gateway`                                                                  |
| 기본 URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 기본 모델     | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 키        | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway를 통한 요청에 사용하는 제공자 API 키) |

<Note>
Cloudflare AI Gateway를 통해 라우팅되는 Anthropic 모델에는 제공자 키로 **Anthropic API 키**를 사용하세요.
</Note>

Anthropic Messages 모델에서 thinking이 활성화된 경우, OpenClaw는 Cloudflare AI Gateway를 통해 페이로드를 보내기 전에 끝부분의 assistant prefill 턴을 제거합니다.
Anthropic은 extended thinking과 함께 response prefilling을 거부하지만, 일반적인 non-thinking prefill은 계속 사용할 수 있습니다.

## 시작하기

<Steps>
  <Step title="제공자 API 키와 Gateway 세부 정보 설정">
    온보딩을 실행하고 Cloudflare AI Gateway 인증 옵션을 선택합니다.

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    계정 ID, Gateway ID, API 키를 입력하라는 메시지가 표시됩니다.

  </Step>
  <Step title="기본 모델 설정">
    OpenClaw 구성에 모델을 추가합니다.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="모델을 사용할 수 있는지 확인">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 비대화형 예시

스크립트 또는 CI 설정에서는 모든 값을 명령줄에 전달합니다.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 고급 구성

<AccordionGroup>
  <Accordion title="인증된 Gateway">
    Cloudflare에서 Gateway 인증을 활성화한 경우 `cf-aig-authorization` 헤더를 추가합니다. 이는 제공자 API 키에 **추가로** 필요합니다.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    `cf-aig-authorization` 헤더는 Cloudflare Gateway 자체에 인증하고, 제공자 API 키(예: Anthropic 키)는 업스트림 제공자에 인증합니다.
    </Tip>

  </Accordion>

  <Accordion title="환경 참고 사항">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 해당 프로세스에서 `CLOUDFLARE_AI_GATEWAY_API_KEY`를 사용할 수 있는지 확인하세요.

    <Warning>
    `~/.profile`에만 있는 키는 해당 환경을 그곳에도 가져오지 않는 한 launchd/systemd 데몬에 도움이 되지 않습니다. Gateway 프로세스가 키를 읽을 수 있도록 `~/.openclaw/.env`에 키를 설정하거나 `env.shellEnv`를 통해 설정하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ입니다.
  </Card>
</CardGroup>
