---
read_when:
    - OpenClaw와 함께 Cloudflare AI Gateway를 사용하려고 합니다
    - 계정 ID, Gateway ID 또는 API 키 env var가 필요합니다
summary: Cloudflare AI Gateway 설정(인증 + 모델 선택)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-12T23:30:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12e9589fe74e6a6335370b9cf2361a464876a392a33f8317d7fd30c3f163b2e5
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway는 프로바이더 API 앞단에 위치하며, 분석, 캐싱, 제어 기능을 추가할 수 있게 해줍니다. Anthropic의 경우 OpenClaw는 Gateway 엔드포인트를 통해 Anthropic Messages API를 사용합니다.

| 속성          | 값                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- |
| 프로바이더    | `cloudflare-ai-gateway`                                                                  |
| 기본 URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`              |
| 기본 모델     | `cloudflare-ai-gateway/claude-sonnet-4-5`                                                |
| API 키        | `CLOUDFLARE_AI_GATEWAY_API_KEY` (Gateway를 통한 요청에 사용하는 프로바이더 API 키)      |

<Note>
Cloudflare AI Gateway를 통해 라우팅되는 Anthropic 모델의 경우, 프로바이더 키로 **Anthropic API 키**를 사용하세요.
</Note>

## 시작하기

<Steps>
  <Step title="프로바이더 API 키와 Gateway 세부 정보 설정">
    온보딩을 실행하고 Cloudflare AI Gateway 인증 옵션을 선택하세요:

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    그러면 계정 ID, gateway ID, API 키를 입력하라는 메시지가 표시됩니다.

  </Step>
  <Step title="기본 모델 설정">
    OpenClaw 구성에 모델을 추가하세요:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
        },
      },
    }
    ```

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 비대화형 예시

스크립트 또는 CI 설정의 경우, 모든 값을 명령줄에 전달하세요:

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
    Cloudflare에서 Gateway 인증을 활성화했다면 `cf-aig-authorization` 헤더를 추가하세요. 이는 프로바이더 API 키에 **추가로** 필요한 항목입니다.

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
    `cf-aig-authorization` 헤더는 Cloudflare Gateway 자체에 인증하는 데 사용되고, 프로바이더 API 키(예: Anthropic 키)는 업스트림 프로바이더에 인증하는 데 사용됩니다.
    </Tip>

  </Accordion>

  <Accordion title="환경 참고">
    Gateway가 데몬(`launchd/systemd`)으로 실행되는 경우, `CLOUDFLARE_AI_GATEWAY_API_KEY`를 해당 프로세스에서 사용할 수 있어야 합니다.

    <Warning>
    키가 `~/.profile`에만 있으면, 그 환경이 함께 가져와지지 않는 한 `launchd/systemd` 데몬에는 도움이 되지 않습니다. Gateway 프로세스가 키를 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    프로바이더, 모델 ref, 페일오버 동작 선택하기.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 FAQ.
  </Card>
</CardGroup>
