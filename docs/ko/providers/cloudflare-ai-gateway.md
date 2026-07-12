---
read_when:
    - OpenClaw에서 Cloudflare AI Gateway를 사용하려고 합니다
    - 계정 ID, Gateway ID 또는 API 키 환경 변수가 필요합니다.
summary: Cloudflare AI Gateway 설정(인증 + 모델 선택)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-07-12T15:35:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)는 공급자 API 앞에 위치하여 분석, 캐싱, 제어 기능을 추가합니다. Anthropic의 경우 OpenClaw는 Gateway 엔드포인트를 통해 Anthropic Messages API를 사용합니다.

| 속성          | 값                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- |
| 공급자        | `cloudflare-ai-gateway`                                                                  |
| Plugin        | 공식 외부 패키지(`@openclaw/cloudflare-ai-gateway-provider`)                             |
| 기본 URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 기본 모델     | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 키        | `CLOUDFLARE_AI_GATEWAY_API_KEY`(Gateway를 통한 요청에 사용하는 공급자 API 키)            |

<Note>
Cloudflare AI Gateway를 통해 라우팅되는 Anthropic 모델의 경우 공급자 키로 **Anthropic API 키**를 사용하십시오.
</Note>

Anthropic Messages 모델에서 사고 기능이 활성화되면 OpenClaw는 Cloudflare AI Gateway를 통해 페이로드를 전송하기 전에 마지막의 어시스턴트 프리필 턴을 제거합니다.
Anthropic은 확장 사고 기능과 함께 응답을 프리필하는 것을 거부하지만, 일반적인 비사고 프리필은 계속 사용할 수 있습니다.

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작하십시오.

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="공급자 API 키 및 Gateway 세부 정보 설정">
    온보딩을 실행하고 Cloudflare AI Gateway 인증 옵션을 선택하십시오.

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    계정 ID, Gateway ID 및 API 키를 입력하라는 메시지가 표시됩니다.

  </Step>
  <Step title="기본 모델 설정">
    OpenClaw 구성에 모델을 추가하십시오.

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
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 비대화형 예시

스크립트 또는 CI 설정에서는 모든 값을 명령줄에 전달하십시오.

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
    Cloudflare에서 Gateway 인증을 활성화한 경우 `cf-aig-authorization` 헤더를 추가하십시오. 이는 공급자 API 키와 **별도로 추가해야 합니다**.

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
    `cf-aig-authorization` 헤더는 Cloudflare Gateway 자체에 인증하며, 공급자 API 키(예: Anthropic 키)는 업스트림 공급자에 인증합니다.
    </Tip>

  </Accordion>

  <Accordion title="환경 관련 참고 사항">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 해당 프로세스에서 `CLOUDFLARE_AI_GATEWAY_API_KEY`를 사용할 수 있는지 확인하십시오.

    <Warning>
    대화형 셸에서만 내보낸 키는 해당 환경도 launchd/systemd 데몬으로 가져오지 않는 한 데몬에 적용되지 않습니다. Gateway 프로세스가 키를 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정하십시오.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 방법 및 FAQ입니다.
  </Card>
</CardGroup>
