---
read_when:
    - 로컬 inferrs 서버에서 OpenClaw를 실행하려고 합니다.
    - inferrs를 통해 Gemma 또는 다른 모델을 제공하고 있습니다
    - inferrs에 필요한 정확한 OpenClaw 호환성 플래그가 필요합니다.
summary: inferrs(OpenAI 호환 로컬 서버)를 통해 OpenClaw 실행하기
title: Inferrs
x-i18n:
    generated_at: "2026-07-12T15:36:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs)는 OpenAI 호환 `/v1` API를 통해 로컬 모델을 제공합니다. OpenClaw는 범용 `openai-completions` 어댑터를 통해 inferrs와 통신합니다.

| 속성               | 값                                                                   |
| ------------------ | -------------------------------------------------------------------- |
| 공급자 ID          | `inferrs`(사용자 지정, `models.providers.inferrs`에서 구성)          |
| Plugin             | 없음 — 번들 OpenClaw 공급자 Plugin이 아님                             |
| 인증 환경 변수     | 필요 없음. inferrs 서버에 인증이 없다면 어떤 값이든 사용 가능        |
| API                | OpenAI 호환(`openai-completions`)                                    |
| 권장 기본 URL      | `http://127.0.0.1:8080/v1`(또는 inferrs 서버가 수신 대기하는 위치)    |

<Note>
  `inferrs`는 전용 OpenClaw 공급자 Plugin이 아니라 사용자 지정 자체 호스팅 OpenAI 호환 백엔드입니다. 따라서 온보딩 인증 옵션에서 선택하는 대신 `models.providers.inferrs`에서 구성합니다. 자동 검색을 지원하는 번들 Plugin은 [SGLang](/ko/providers/sglang) 또는 [vLLM](/ko/providers/vllm)을 참조하십시오.
</Note>

## 시작하기

<Steps>
  <Step title="모델과 함께 inferrs 시작">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="서버에 연결할 수 있는지 확인">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="OpenClaw 공급자 항목 추가">
    명시적인 공급자 항목을 추가하고 기본 모델이 해당 항목을 가리키도록 설정합니다. 아래 구성 예시를 참조하십시오.
  </Step>
</Steps>

## 전체 구성 예시

로컬 `inferrs` 서버의 Gemma 4:

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## 필요 시 시작

OpenClaw는 `inferrs/...` 모델이 선택된 경우에만 `inferrs`를 직접 시작할 수 있습니다. 동일한 공급자 항목에 `localService`를 추가하십시오.

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command`는 절대 경로여야 합니다. Gateway 호스트에서 `which inferrs`를 실행하고 해당 경로를 사용하십시오. 전체 필드 참조: [로컬 모델 서비스](/ko/gateway/local-model-services).

## 고급 구성

<AccordionGroup>
  <Accordion title="requiresStringContent가 중요한 이유">
    일부 `inferrs` Chat Completions 경로는 구조화된 콘텐츠 부분 배열이 아닌 문자열 `messages[].content`만 허용합니다.

    <Warning>
    OpenClaw 실행이 다음 오류와 함께 실패하는 경우:

    ```text
    messages[1].content: 잘못된 유형: 시퀀스, 문자열이 필요함
    ```

    모델 항목에서 `compat.requiresStringContent: true`를 설정하십시오. 그러면 OpenClaw는 요청을 보내기 전에 텍스트로만 구성된 콘텐츠 부분을 일반 문자열로 평탄화합니다.
    </Warning>

  </Accordion>

  <Accordion title="Gemma 및 도구 스키마 주의 사항">
    일부 `inferrs` + Gemma 조합은 작은 직접 `/v1/chat/completions` 요청은 허용하지만 전체 OpenClaw 에이전트 런타임 턴에서는 실패합니다. 먼저 도구 스키마 표면을 비활성화해 보십시오.

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    이렇게 하면 더 엄격한 로컬 백엔드에 가해지는 프롬프트 부담이 줄어듭니다. 작은 직접 요청은 계속 작동하지만 일반 OpenClaw 에이전트 턴이 `inferrs` 내부에서 계속 충돌한다면 OpenClaw 전송 문제가 아니라 업스트림 모델/서버의 제한으로 간주하십시오.

  </Accordion>

  <Accordion title="수동 스모크 테스트">
    구성을 완료한 후 두 계층을 모두 테스트하십시오.

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"2 + 2는 무엇인가요?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "2 + 2는 무엇인가요? 짧은 문장 하나로 답하십시오." \
      --json
    ```

    첫 번째 명령은 작동하지만 두 번째 명령이 실패하면 아래 문제 해결을 참조하십시오.

  </Accordion>

  <Accordion title="프록시 방식 동작">
    `inferrs`는 `openai-responses`가 아닌 범용 `openai-completions` 어댑터를 사용하므로 OpenAI 네이티브 전용 요청 구성은 적용되지 않습니다. `service_tier`, Responses `store`, 프롬프트 캐시 힌트 및 OpenAI 추론 호환 페이로드 구성은 전송되지 않습니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="curl /v1/models 실패">
    `inferrs`가 실행 중이 아니거나, 연결할 수 없거나, 구성한 호스트/포트에 바인딩되지 않았습니다. 서버가 시작되어 해당 주소에서 수신 대기 중인지 확인하십시오.
  </Accordion>

  <Accordion title="messages[].content에 문자열이 필요함">
    모델 항목에서 `compat.requiresStringContent: true`를 설정하십시오(위 내용 참조).
  </Accordion>

  <Accordion title="직접 /v1/chat/completions 호출은 성공하지만 openclaw infer model run은 실패함">
    도구 스키마 표면을 비활성화하려면 `compat.supportsTools: false`를 설정하십시오(위의 Gemma 주의 사항 참조).
  </Accordion>

  <Accordion title="더 큰 에이전트 턴에서 inferrs가 계속 충돌함">
    스키마 오류가 사라졌지만 더 큰 에이전트 턴에서 `inferrs`가 계속 충돌한다면 업스트림 `inferrs` 또는 모델의 제한으로 간주하십시오. 프롬프트 부담을 줄이거나 백엔드/모델을 전환하십시오.
  </Accordion>
</AccordionGroup>

<Tip>
일반적인 도움말은 [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq)를 참조하십시오.
</Tip>

## 관련 항목

<CardGroup cols={2}>
  <Card title="로컬 모델" href="/ko/gateway/local-models" icon="server">
    로컬 모델 서버에서 OpenClaw를 실행합니다.
  </Card>
  <Card title="로컬 모델 서비스" href="/ko/gateway/local-model-services" icon="play">
    구성된 공급자를 위해 필요할 때 로컬 모델 서버를 시작합니다.
  </Card>
  <Card title="Gateway 문제 해결" href="/ko/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    프로브는 통과하지만 에이전트 실행은 실패하는 로컬 OpenAI 호환 백엔드를 디버깅합니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    모든 공급자, 모델 참조 및 장애 조치 동작을 개괄합니다.
  </Card>
</CardGroup>
