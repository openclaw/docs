---
read_when:
    - 모델 또는 임베딩 제공자가 선택된 경우에만 OpenClaw가 로컬 모델 서버를 시작하도록 하려는 경우
    - ds4, Inferrs, vLLM, llama.cpp, MLX 또는 기타 OpenAI 호환 로컬 서버를 실행합니다
    - 로컬 제공자의 콜드 스타트, 준비 상태, 유휴 종료를 제어해야 합니다
summary: OpenClaw 모델 및 임베딩 요청 전에 필요할 때 로컬 모델 서버 시작하기
title: 로컬 모델 서비스
x-i18n:
    generated_at: "2026-07-12T15:19:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a761113dd591fed0394379b2bad173165efc5e284565c652493e73d1e724529d
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService`는 필요할 때 공급자 소유의 로컬 모델 서버를 시작합니다. 모델 또는 임베딩 요청이 해당 공급자를 선택하면 OpenClaw는 상태 엔드포인트를 점검하고, 서버가 중지되어 있으면 프로세스를 시작하며, 준비될 때까지 기다린 다음 요청을 전송합니다. 비용이 많이 드는 로컬 서버를 하루 종일 실행하지 않으려면 이 기능을 사용하십시오.

## 작동 방식

1. 모델 또는 임베딩 요청이 구성된 공급자로 해석됩니다.
2. 해당 공급자에 `localService`가 있으면 OpenClaw가 `healthUrl`을 점검합니다.
3. 점검에 성공하면 OpenClaw는 이미 실행 중인 서버를 사용합니다.
4. 점검에 실패하면 OpenClaw는 `args`와 함께 `command`를 실행합니다.
5. OpenClaw는 `readyTimeoutMs`가 만료될 때까지 상태 엔드포인트를 폴링합니다.
6. 요청은 일반 모델 또는 임베딩 전송 경로를 거칩니다.
7. OpenClaw가 프로세스를 시작했고 `idleStopMs`가 설정되어 있으면, 마지막 처리 중 요청이 해당 시간 동안 유휴 상태인 후 프로세스를 중지합니다.

OpenClaw는 이를 위해 launchd, systemd, Docker 또는 어떤 데몬도 설치하지 않습니다. 서버는 처음으로 해당 서버가 필요했던 OpenClaw 프로세스의 일반 자식 프로세스입니다.

시작은 구성된 공급자와 명령/인수/환경 변수 집합별로 직렬화되므로, 동일한 서비스에 대한 동시 채팅 및 임베딩 요청이 중복 서버를 생성하지 않습니다. 각 요청은 응답 처리가 완료될 때까지 자체 임대를 유지하므로, 유휴 종료는 처리 중인 모든 모델 및 임베딩 요청이 완료될 때까지 기다립니다. 구성된 공급자 별칭은 서로 구분된 상태로 유지됩니다. 두 별칭이 서로 다른 GPU 호스트를 가리킬 수 있으며, 동일한 Ollama, LM Studio 또는 OpenAI 호환 어댑터 ID로 합쳐지지 않습니다.

다른 OpenClaw 프로세스가 이미 동일한 `healthUrl`에서 정상 상태인 서버를 실행 중이면 이 프로세스는 서버를 관리 대상으로 채택하지 않고 재사용합니다(각 프로세스는 자신이 직접 시작한 자식 프로세스만 관리합니다). 시작 및 종료 로그에는 길이가 제한되고 민감 정보가 제거된 자식 프로세스 출력의 마지막 부분과 타이밍 및 종료 세부 정보가 포함됩니다. 구성된 환경 변수 값은 절대 출력되지 않습니다.

## 구성 형식

```json5
{
  models: {
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "local-model",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/absolute/path/to/server",
          args: ["--host", "127.0.0.1", "--port", "8000"],
          cwd: "/absolute/path/to/working-dir",
          env: { LOCAL_MODEL_CACHE: "/absolute/path/to/cache" },
          healthUrl: "http://127.0.0.1:8000/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "my-local-model",
            name: "My Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

느린 콜드 스타트와 긴 생성 작업이 기본 모델 요청 시간 제한에 걸리지 않도록 공급자 항목에 `timeoutSeconds`를 설정하십시오(`localService`가 아님). 서버가 기본 URL의 `/models` 이외 위치에서 준비 상태를 제공하는 경우에는 항상 명시적인 `healthUrl`을 설정하십시오.

## 필드

| 필드             | 필수 여부 | 설명                                                                                                                                 |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `command`        | 예        | 실행 파일의 절대 경로입니다. 셸 PATH 조회를 수행하지 않습니다.                                                                       |
| `args`           | 아니요    | 프로세스 인수입니다. 셸 확장, 파이프, 글로빙 또는 따옴표 처리를 수행하지 않습니다.                                                    |
| `cwd`            | 아니요    | 프로세스의 작업 디렉터리입니다.                                                                                                      |
| `env`            | 아니요    | OpenClaw 프로세스 환경에 병합되는 환경 변수입니다.                                                                                   |
| `healthUrl`      | 아니요    | 준비 상태 URL입니다. 기본값은 `baseUrl`에 `/models`를 추가한 값입니다(`http://127.0.0.1:8000/v1`은 `http://127.0.0.1:8000/v1/models`가 됩니다). |
| `readyTimeoutMs` | 아니요    | 시작 준비 상태 기한입니다. 기본값: `120000`.                                                                                         |
| `idleStopMs`     | 아니요    | OpenClaw가 시작한 프로세스의 유휴 종료 지연 시간입니다. `0`이거나 생략하면 OpenClaw가 종료될 때까지 프로세스를 유지합니다.             |

## Inferrs 예제

Inferrs는 사용자 지정 OpenAI 호환 `/v1` 백엔드이므로 동일한 `localService` API를 `inferrs` 공급자 항목과 함께 사용할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
    },
  },
  models: {
    mode: "merge",
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
            compat: { requiresStringContent: true },
          },
        ],
      },
    },
  },
}
```

`command`를 OpenClaw를 실행하는 머신에서 `which inferrs`를 실행한 결과로 바꾸십시오. 전체 inferrs 설정: [Inferrs](/ko/providers/inferrs).

## ds4 예제

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [],
      },
    },
  },
}
```

전체 설정, 컨텍스트 크기 조정 및 검증 명령: [ds4](/ko/providers/ds4).

## 관련 항목

<CardGroup cols={2}>
  <Card title="로컬 모델" href="/ko/gateway/local-models" icon="server">
    로컬 모델 설정, 공급자 선택 및 안전 지침입니다.
  </Card>
  <Card title="Inferrs" href="/ko/providers/inferrs" icon="cpu">
    inferrs OpenAI 호환 로컬 서버를 통해 OpenClaw를 실행합니다.
  </Card>
</CardGroup>
