---
read_when:
    - OpenClaw에서 Together AI를 사용하려고 합니다
    - API 키 환경 변수 또는 CLI 인증 옵션이 필요합니다.
summary: Together AI 설정(인증 + 모델 선택)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T01:09:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai)는 통합 API를 통해 Llama, DeepSeek, Kimi 등을 비롯한 주요 오픈 소스 모델에 대한 액세스를 제공합니다.
OpenClaw는 이를 `together` 제공자로 번들로 제공합니다.

| 속성     | 값                            |
| -------- | ----------------------------- |
| 제공자   | `together`                    |
| 인증     | `TOGETHER_API_KEY`            |
| API      | OpenAI 호환                   |
| 기본 URL | `https://api.together.xyz/v1` |

## 시작하기

<Steps>
  <Step title="API 키 발급">
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys)에서
    API 키를 생성합니다.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="기본 모델 설정">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### 비대화형 예시

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
온보딩은 `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`를 기본 모델로 설정합니다.
</Note>

## 기본 제공 카탈로그

비용은 토큰 백만 개당 미국 달러(USD) 기준입니다.

| 모델 참조                                          | 이름                         | 입력           | 컨텍스트 | 최대 출력 | 비용(입력/출력) | 참고                 |
| -------------------------------------------------- | ---------------------------- | -------------- | -------- | --------- | --------------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | 텍스트         | 131,072  | 8,192     | 0.88 / 0.88     | 기본 모델            |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | 텍스트, 이미지 | 262,144  | 32,768    | 1.20 / 4.50     | 추론 모델            |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | 텍스트         | 512,000  | 8,192     | 2.10 / 4.40     | 추론 모델            |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | 텍스트         | 32,768   | 8,192     | 0.30 / 0.30     | 빠른 비추론 모델     |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | 텍스트         | 202,752  | 8,192     | 1.40 / 4.40     | 추론 모델            |

## 동영상 생성

번들로 제공되는 `together` Plugin은 공유 `video_generate` 도구를 통한 동영상 생성도 등록합니다.

| 속성                  | 값                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| 기본 동영상 모델      | `Wan-AI/Wan2.2-T2V-A14B`                                                                        |
| 기타 모델             | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                          |
| 모드                  | 텍스트-동영상 변환, `Wan-AI/Wan2.2-I2V-A14B`에서만 이미지-동영상 변환 지원(참조 이미지 한 장) |
| 길이                  | 1~10초                                                                                          |
| 지원되는 매개변수     | `size`(`<width>x<height>`로 파싱), `aspectRatio`/`resolution`은 읽지 않음                       |

Together를 기본 동영상 제공자로 사용하려면 다음과 같이 설정합니다.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
공유 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [동영상 생성](/ko/tools/video-generation)을 참조하세요.
</Tip>

<AccordionGroup>
  <Accordion title="환경 참고 사항">
    Gateway가 데몬(launchd/systemd)으로 실행되는 경우 `TOGETHER_API_KEY`를 해당 프로세스에서 사용할 수 있는지 확인하세요(예: `~/.openclaw/.env` 또는 `env.shellEnv` 사용).

    <Warning>
    대화형 셸에만 설정된 키는 데몬에서 관리하는 Gateway 프로세스에 표시되지 않습니다. 지속적으로 사용할 수 있도록 `~/.openclaw/.env` 또는 `env.shellEnv` 설정을 사용하세요.
    </Warning>

  </Accordion>

  <Accordion title="문제 해결">
    - 키가 작동하는지 확인: `openclaw models list --provider together`
    - 모델이 표시되지 않으면 Gateway 프로세스의 올바른 환경에 API 키가 설정되어 있는지 확인하세요.
    - 모델 참조는 `together/<model-id>` 형식을 사용합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공자" href="/ko/concepts/model-providers" icon="layers">
    제공자 규칙, 모델 참조 및 장애 조치 동작입니다.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 동영상 생성 도구 매개변수 및 제공자 선택입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    제공자 설정을 포함한 전체 구성 스키마입니다.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 대시보드, API 문서 및 요금 정보입니다.
  </Card>
</CardGroup>
