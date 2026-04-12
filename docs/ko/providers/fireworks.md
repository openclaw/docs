---
read_when:
    - OpenClaw에서 Fireworks를 사용하고 싶습니다
    - Fireworks API 키 환경 변수 또는 기본 모델 id가 필요합니다
summary: Fireworks 설정(인증 + 모델 선택)
title: Fireworks
x-i18n:
    generated_at: "2026-04-12T23:30:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a85d9507c19e275fdd846a303d844eda8045d008774d4dde1eae408e8716b6f
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai)는 OpenAI 호환 API를 통해 오픈 웨이트 모델과 라우팅된 모델을 제공합니다. OpenClaw에는 번들 Fireworks provider Plugin이 포함되어 있습니다.

| Property      | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| Auth          | `FIREWORKS_API_KEY`                                    |
| API           | OpenAI 호환 chat/completions                           |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| Default model | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## 시작하기

<Steps>
  <Step title="온보딩을 통해 Fireworks 인증 설정">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    이렇게 하면 Fireworks 키가 OpenClaw 구성에 저장되고 Fire Pass 시작 모델이 기본값으로 설정됩니다.

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## 비대화형 예시

스크립트 또는 CI 설정의 경우, 모든 값을 명령줄에서 전달하세요.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 기본 제공 카탈로그

| Model ref                                              | Name                        | 입력       | 컨텍스트 | 최대 출력 | 참고                                         |
| ------------------------------------------------------ | --------------------------- | ---------- | -------- | --------- | -------------------------------------------- |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000  | 256,000   | Fireworks의 기본 번들 시작 모델              |

<Tip>
Fireworks가 최신 Qwen 또는 Gemma 릴리스 같은 새 모델을 게시하면, 번들 카탈로그 업데이트를 기다리지 않고 해당 Fireworks 모델 id를 사용해 바로 전환할 수 있습니다.
</Tip>

## 사용자 지정 Fireworks 모델 id

OpenClaw는 동적 Fireworks 모델 id도 허용합니다. Fireworks에 표시된 정확한 모델 또는 router id를 사용하고 앞에 `fireworks/`를 붙이세요.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="모델 id 접두사 방식">
    OpenClaw의 모든 Fireworks 모델 ref는 `fireworks/`로 시작하고, 그 뒤에 Fireworks 플랫폼의 정확한 id 또는 router 경로가 따라옵니다. 예를 들면:

    - Router 모델: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 직접 모델: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw는 API 요청을 구성할 때 `fireworks/` 접두사를 제거하고, 남은 경로를 Fireworks 엔드포인트로 전송합니다.

  </Accordion>

  <Accordion title="환경 참고">
    Gateway가 대화형 셸 외부에서 실행된다면, 해당 프로세스에서도 `FIREWORKS_API_KEY`를 사용할 수 있어야 합니다.

    <Warning>
    `~/.profile`에만 있는 키는 해당 환경이 launchd/systemd 데몬에도 가져와지지 않으면 도움이 되지 않습니다. Gateway 프로세스가 키를 읽을 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv`에 키를 설정하세요.
    </Warning>

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 ref, failover 동작을 선택합니다.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제 해결과 FAQ입니다.
  </Card>
</CardGroup>
