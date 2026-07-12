---
read_when:
    - OpenClaw에서 Cloudflare AI Gateway를 사용하려는 경우
    - 계정 ID, Gateway ID 또는 API 키 환경 변수가 필요합니다.
summary: Cloudflare AI Gateway 설정(인증 + 모델 선택)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-07-12T01:06:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)는 제공자 API 앞에 위치하여 분석, 캐싱, 제어 기능을 추가합니다. Anthropic의 경우 OpenClaw는 Gateway 엔드포인트를 통해 Anthropic Messages API를 사용합니다.

| 속성          | 값                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------- |
| 제공자        | `cloudflare-ai-gateway`                                                                  |
| Plugin        | 공식 외부 패키지(`@openclaw/cloudflare-ai-gateway-provider`)                             |
| 기본 URL      | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 기본 모델     | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| API 키        | `CLOUDFLARE_AI_GATEWAY_API_KEY`(Gateway를 통한 요청에 사용할 제공자 API 키)              |

<Note>
Cloudflare AI Gateway를 통해 라우팅되는 Anthropic 모델에는 제공자 키로 **Anthropic API 키**를 사용하세요.
</Note>

Anthropic Messages 모델에서 사고 기능이 활성화된 경우, OpenClaw는 Cloudflare AI Gateway를 통해 페이로드를 보내기 전에 마지막에 있는 어시스턴트 프리필 턴을 제거합니다.
Anthropic은 확장 사고 기능과 함께 응답 프리필을 사용하는 것을 거부하지만, 일반적인 비사고 프리필은 계속 사용할 수 있습니다.

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="제공자 API 키 및 Gateway 세부 정보 설정">
    온보딩을 실행하고 Cloudflare AI Gateway 인증 옵션을 선택합니다.

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    계정 ID, Gateway ID 및 API 키를 입력하라는 메시지가 표시됩니다.

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
  <Step title="모델 사용 가능 여부 확인">
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
    Cloudflare에서 Gateway 인증을 활성화한 경우 `cf-aig-authorization` 헤더를 추가합니다. 이는 제공자 API 키와 **별도로 추가**해야 합니다.

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
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 해당 프로세스에서 `CLOUDFLARE_AI_GATEWAY_API_KEY`를 사용할 수 있는지 확인합니다.

    <Warning>
    대화형 셸에서만 내보낸 키는 해당 환경도 가져오지 않는 한 launchd/systemd 데몬에 적용되지 않습니다. Gateway 프로세스가 키를 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`를 통해 키를 설정합니다.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결 및 자주 묻는 질문입니다.
  </Card>
</CardGroup>
