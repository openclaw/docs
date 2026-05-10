---
read_when:
    - OpenClaw가 해당 모델이 선택된 경우에만 로컬 모델 서버를 시작하도록 하려는 경우
    - ds4, inferrs, vLLM, llama.cpp, MLX 또는 다른 OpenAI 호환 로컬 서버를 실행합니다
    - 로컬 프로바이더의 콜드 스타트, 준비 상태 및 유휴 종료를 제어해야 합니다
summary: OpenClaw 모델 요청 전에 필요 시 로컬 모델 서버 시작
title: 로컬 모델 서비스
x-i18n:
    generated_at: "2026-05-10T19:36:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b900146c5831c784b5da66666322ed0f5d3457ccd741556f418cd197749b87b1
    source_path: gateway/local-model-services.md
    workflow: 16
---

`models.providers.<id>.localService`를 사용하면 OpenClaw가 필요할 때 provider 소유의 로컬
모델 서버를 시작할 수 있습니다. 이는 provider 수준 설정입니다. 선택한 모델이
해당 provider에 속하면 OpenClaw는 서비스를 프로브하고, endpoint가 내려가 있으면
process를 시작하며, 준비 상태가 될 때까지 기다린 다음 모델 요청을 보냅니다.

하루 종일 계속 실행해 두기에는 비용이 큰 로컬 서버나, 모델 선택만으로 backend가
올라와야 하는 수동 설정에 사용하세요.

## 작동 방식

1. 모델 요청이 설정된 provider로 해석됩니다.
2. 해당 provider에 `localService`가 있으면 OpenClaw가 `healthUrl`을 프로브합니다.
3. 프로브가 성공하면 OpenClaw는 기존 서버를 사용합니다.
4. 프로브가 실패하면 OpenClaw가 `args`와 함께 `command`를 시작합니다.
5. OpenClaw는 `readyTimeoutMs`가 만료될 때까지 준비 상태를 폴링합니다.
6. 모델 요청은 일반 provider transport를 통해 전송됩니다.
7. OpenClaw가 process를 시작했고 `idleStopMs`가 양수이면, 마지막 진행 중 요청이
   그 시간만큼 idle 상태였던 뒤 process가 중지됩니다.

OpenClaw는 이를 위해 launchd, systemd, Docker 또는 daemon을 설치하지 않습니다. 서버는
처음 서버가 필요했던 OpenClaw process의 child process입니다.

## 설정 형태

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

## 필드

- `command`: 절대 실행 파일 경로입니다. Shell lookup은 사용되지 않습니다.
- `args`: process 인수입니다. Shell expansion, pipe, globbing 또는 quoting
  규칙은 적용되지 않습니다.
- `cwd`: process에 사용할 선택적 working directory입니다.
- `env`: OpenClaw process 환경 위에 병합되는 선택적 환경 변수입니다.
- `healthUrl`: 준비 상태 URL입니다. 생략하면 OpenClaw는 `baseUrl`에 `/models`를
  덧붙이므로 `http://127.0.0.1:8000/v1`은
  `http://127.0.0.1:8000/v1/models`가 됩니다.
- `readyTimeoutMs`: 시작 준비 상태 기한입니다. 기본값: `120000`.
- `idleStopMs`: OpenClaw가 시작한 process의 idle 종료 지연 시간입니다. `0`이거나
  생략하면 OpenClaw가 종료될 때까지 process를 계속 실행합니다.

## Inferrs 예시

Inferrs는 사용자 지정 OpenAI 호환 `/v1` backend이므로 동일한 로컬 서비스
API가 `inferrs` provider 항목과 함께 작동합니다.

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

OpenClaw를 실행하는 머신에서 `which inferrs`의 결과로 `command`를 바꾸세요.

## ds4 예시

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
          command: "/Users/you/Projects/oss/ds4/ds4-server",
          args: [
            "--model",
            "/Users/you/Projects/oss/ds4/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "393216",
          ],
          cwd: "/Users/you/Projects/oss/ds4",
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

## 운영 참고 사항

- 하나의 OpenClaw process가 자신이 시작한 child를 관리합니다. 동일한 health URL이
  이미 live 상태인 것을 확인한 다른 OpenClaw process는 그것을 채택하지 않고 재사용합니다.
- 시작은 provider command와 인수 집합별로 직렬화되므로 동시 요청이 동일한 설정에 대해
  중복 서버를 생성하지 않습니다.
- 활성 streaming response는 lease를 유지합니다. idle 종료는 response
  body 처리가 완료될 때까지 기다립니다.
- 느린 로컬 provider에는 `timeoutSeconds`를 사용하여 cold start와 긴 generation이
  기본 모델 요청 timeout에 걸리지 않게 하세요.
- 서버가 `/v1/models`가 아닌 다른 위치에서 준비 상태를 노출하는 경우 명시적 `healthUrl`을 사용하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Local models" href="/ko/gateway/local-models" icon="server">
    로컬 모델 설정, provider 선택지, 안전 가이드입니다.
  </Card>
  <Card title="Inferrs" href="/ko/providers/inferrs" icon="cpu">
    inferrs OpenAI 호환 로컬 서버를 통해 OpenClaw를 실행합니다.
  </Card>
</CardGroup>
