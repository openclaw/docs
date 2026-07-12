---
read_when:
    - OpenAI Chat Completions를 사용하는 도구 통합하기
summary: Gateway에서 OpenAI 호환 `/v1/chat/completions` HTTP 엔드포인트를 제공하십시오
title: OpenAI 채팅 완성
x-i18n:
    generated_at: "2026-07-12T15:15:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9b1fffd2ce3da881ecd91adbb7c5d10b1d7adbd99af9b2ea4544b62ecbaf1f32
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway는 소규모 OpenAI 호환 Chat Completions 인터페이스를 제공할 수 있습니다. 이 기능은 **기본적으로 비활성화되어 있습니다**.

활성화하면 Gateway와 동일한 포트에서 다음 항목을 모두 제공합니다(WS + HTTP 멀티플렉싱).

| 메서드 | 경로                   |
| ------ | ---------------------- |
| POST   | `/v1/chat/completions` |
| GET    | `/v1/models`           |
| GET    | `/v1/models/{id}`      |
| POST   | `/v1/embeddings`       |
| POST   | `/v1/responses`        |

요청은 일반적인 Gateway 에이전트 실행(`openclaw agent`와 동일한 코드 경로)으로 처리되므로 라우팅, 권한, 구성은 사용 중인 Gateway와 일치합니다.

## 엔드포인트 활성화

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

비활성화하려면 `enabled: false`로 설정하거나 생략하십시오.

## 보안 경계(중요)

이 엔드포인트를 Gateway 인스턴스에 대한 **전체 운영자 액세스 권한**으로 취급하십시오.

- 이 엔드포인트에 유효한 Gateway 토큰/비밀번호는 제한적인 사용자별 범위가 아니라 소유자/운영자 자격 증명과 동일합니다.
- 요청은 신뢰할 수 있는 운영자 작업과 동일한 제어 영역 에이전트 경로를 통해 실행되므로 대상 에이전트의 정책에서 민감한 도구를 허용하면 이 엔드포인트에서도 해당 도구를 사용할 수 있습니다.
- 루프백, tailnet 또는 비공개 인그레스에서만 사용하십시오. 공용 인터넷에 노출하지 마십시오.

인증 매트릭스:

| 인증 경로                                                                                            | 동작                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"` 또는 `"password"` + `Authorization: Bearer ...`                           | 공유 Gateway 비밀의 소유를 증명합니다. 모든 `x-openclaw-scopes` 헤더를 무시하고 전체 기본 운영자 범위 집합인 `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`를 복원합니다. 채팅 턴을 소유자 발신자의 턴으로 취급합니다. |
| 신뢰할 수 있는 ID 정보 포함 HTTP(신뢰 프록시 인증 또는 비공개 인그레스의 `gateway.auth.mode="none"`) | `x-openclaw-scopes`가 있으면 이를 적용하고, 없으면 기본 운영자 범위 집합을 사용합니다. 호출자가 범위를 명시적으로 축소하고 `operator.admin`을 제외한 경우에만 소유자 의미 체계를 잃습니다. `x-openclaw-model`과 같은 소유자 수준 제어에는 `operator.admin`이 필요합니다.                        |

[운영자 범위](/ko/gateway/operator-scopes), [보안](/ko/gateway/security), [원격 액세스](/ko/gateway/remote)를 참조하십시오.

## 인증

Gateway 인증 구성을 사용합니다(해당 모드의 자세한 내용은 [신뢰 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조).

| 모드                                | 인증 방법                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gateway.auth.mode="token"`         | `Authorization: Bearer <token>`. `gateway.auth.token` 또는 `OPENCLAW_GATEWAY_TOKEN`으로 설정합니다.                                                                                              |
| `gateway.auth.mode="password"`      | `Authorization: Bearer <password>`. `gateway.auth.password` 또는 `OPENCLAW_GATEWAY_PASSWORD`로 설정합니다.                                                                                     |
| `gateway.auth.mode="trusted-proxy"` | 구성된 ID 인식 프록시를 통해 라우팅합니다. 프록시가 필수 ID 헤더를 삽입합니다. 동일 호스트의 루프백 프록시는 `gateway.auth.trustedProxy.allowLoopback = true`를 명시적으로 설정해야 합니다. |
| `gateway.auth.mode="none"`          | 인증 헤더가 필요하지 않습니다(비공개 인그레스 전용).                                                                                                                                         |

참고:

- `trusted-proxy` Gateway에서 프록시를 우회하는 동일 호스트 호출자는 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 직접 사용하는 방식으로 대체할 수 있습니다. `Forwarded`, `X-Forwarded-*` 또는 `X-Real-IP` 헤더 증거가 있으면 요청은 계속 신뢰 프록시 경로를 사용합니다.
- `gateway.auth.rateLimit`이 구성되어 있고 인증 시도가 너무 많이 실패하면 엔드포인트가 `Retry-After` 헤더와 함께 `429`를 반환합니다.

## 이 엔드포인트를 사용해야 하는 경우

- 통합이 동일한 Gateway를 위한 또 하나의 운영자/클라이언트 인터페이스에 불과하다면 새로운 내장 채널을 추가하는 대신 이 엔드포인트를 사용하십시오.
- 원격 Gateway에 직접 연결하는 네이티브 모바일 클라이언트에서는 장치에 공유 HTTP 토큰/비밀번호가 필요하지 않도록 페어링된 장치 부트스트랩/장치 토큰 흐름과 함께 [WebChat](/ko/web/webchat) 또는 [Gateway 프로토콜](/ko/gateway/protocol)을 사용하는 것이 좋습니다.
- 자체 사용자, 대화방, Webhook 전송 또는 아웃바운드 전송 기능이 있는 외부 메시징 네트워크를 통합할 때는 대신 채널 Plugin을 빌드하십시오. [Plugin 빌드](/ko/plugins/building-plugins)를 참조하십시오.

## 에이전트 우선 모델 계약

OpenClaw는 OpenAI `model` 필드를 원시 제공자 모델 ID가 아닌 **에이전트 대상**으로 취급합니다.

| `model` 값                                   | 라우팅 대상                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw`                                   | 구성된 기본 에이전트                                                                                                 |
| `openclaw/default`                           | 구성된 기본 에이전트(안정적인 별칭이며 실제 기본 에이전트 ID가 환경에 따라 변경되더라도 안전하게 하드코딩할 수 있음) |
| `openclaw/<agentId>` 또는 `openclaw:<agentId>` | 특정 에이전트                                                                                                           |
| `agent:<agentId>`                            | 특정 에이전트(호환성 별칭)                                                                                     |

선택적 요청 헤더:

| 헤더                                            | 효과                                                                                                                                                                                                                                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `x-openclaw-model: <provider/model-or-bare-id>` | 선택한 에이전트의 백엔드 모델을 재정의합니다. 공유 비밀 Bearer 호출자는 이를 직접 사용할 수 있습니다. ID 정보가 있는 호출자(신뢰 프록시 또는 `x-openclaw-scopes`를 사용하는 비공개 무인증 인그레스)는 `operator.admin`이 필요하며, 그렇지 않으면 `403 missing scope: operator.admin`이 반환됩니다. |
| `x-openclaw-agent-id: <agentId>`                | 에이전트 선택을 위한 호환성 재정의입니다.                                                                                                                                                                                                                                 |
| `x-openclaw-session-key: <sessionKey>`          | 명시적인 세션 라우팅입니다. 예약된 내부 네임스페이스(`subagent:`, `cron:`, `acp:`)를 사용하면 `400 invalid_request_error`로 거부됩니다.                                                                                                                                |
| `x-openclaw-message-channel: <channel>`         | 채널 인식 프롬프트/정책을 위한 합성 인그레스 채널 컨텍스트를 설정합니다.                                                                                                                                                                                              |

`/v1/models`에는 백엔드 제공자 모델이나 하위 에이전트가 아닌 최상위 에이전트 대상(`openclaw`, `openclaw/default`, `openclaw/<agentId>`)이 나열됩니다. 하위 에이전트는 내부 실행 토폴로지로 유지됩니다. `x-openclaw-model`을 생략하면 선택한 에이전트가 일반적으로 구성된 모델로 실행됩니다.

`/v1/embeddings`는 동일한 에이전트 대상 `model` ID를 사용합니다. 특정 임베딩 모델을 선택하려면 `x-openclaw-model`을 전송하십시오(공유 비밀 호출자 또는 `operator.admin`이 있는 ID 정보 포함 호출자). 그렇지 않으면 요청은 선택한 에이전트의 일반적인 임베딩 설정을 사용합니다.

## 세션 동작

기본적으로 엔드포인트는 **요청별로 상태를 유지하지 않습니다**(호출할 때마다 새 세션 키가 생성됨).

요청에 OpenAI `user` 문자열이 포함되어 있으면 Gateway는 이 문자열에서 안정적인 세션 키를 파생하므로 반복 호출에서 에이전트 세션을 공유할 수 있습니다. 사용자 지정 앱에서는 대화 스레드별로 동일한 `user` 값을 재사용하십시오. 여러 대화/장치가 하나의 OpenClaw 세션을 공유하도록 하려는 경우가 아니라면 계정 수준 식별자는 사용하지 마십시오. 여러 클라이언트/스레드에 걸쳐 명시적으로 라우팅을 제어해야 할 때만 위의 예약된 네임스페이스를 피하는 애플리케이션 소유 키와 함께 `x-openclaw-session-key`를 사용하십시오.

## 요청 제한(구성)

기본값은 `gateway.http.endpoints.chatCompletions` 아래에서 조정할 수 있습니다.

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxImageParts: 8,
          maxTotalImageBytes: 20000000,
          images: {
            allowUrl: false,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

생략 시 기본값:

| 키                    | 기본값                                                                     |
| --------------------- | --------------------------------------------------------------------------- |
| `maxBodyBytes`        | 20MB                                                                        |
| `maxImageParts`       | 8(최신 사용자 메시지에서 읽는 `image_url` 부분의 최대 개수)                 |
| `maxTotalImageBytes`  | 20MB(한 요청에 포함된 모든 `image_url` 부분에서 디코딩된 바이트의 누적 합계) |
| `images.allowUrl`     | `false`(활성화하지 않으면 URL에서 가져온 `image_url` 부분이 거부됨)         |
| `images.maxBytes`     | 이미지당 10MB                                                              |
| `images.maxRedirects` | 3                                                                           |
| `images.timeoutMs`    | 10s                                                                         |

HEIC/HEIF `image_url` 소스는 허용되며 공유 OpenClaw 이미지 프로세서(Rastermill)를 통해 제공자에게 전달되기 전에 JPEG로 정규화됩니다. 외부 코덱 지원이 필요한 형식에는 시스템 변환기(`sips`, ImageMagick, GraphicsMagick 또는 ffmpeg)를 대체 수단으로 사용합니다.

보안 참고: 호스트 이름을 허용 목록에 추가해도 비공개/내부 IP 차단을 우회하지 않습니다. 인터넷에 노출된 Gateway의 경우 애플리케이션 수준 보호 장치와 함께 네트워크 이그레스 제어를 적용하십시오. [보안](/ko/gateway/security)을 참조하십시오.

## 채팅 도구 계약

`/v1/chat/completions`는 일반적인 OpenAI Chat 클라이언트와 호환되는 함수 도구 하위 집합을 지원합니다.

### 지원되는 요청 필드

| 필드                       | 참고                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools`                    | `{ "type": "function", "function": { ... } }` 배열                                                                                            |
| `tool_choice`              | `"auto"`, `"none"`, `"required"` 또는 `{ "type": "function", "function": { "name": "..." } }`                                                 |
| `messages[*].role: "tool"` | 후속 턴                                                                                                                                       |
| `messages[*].tool_call_id` | 도구 결과를 이전 도구 호출에 연결합니다                                                                                                       |
| `max_completion_tokens`    | 숫자. 전체 완성 토큰 수의 호출별 상한입니다(추론 토큰 포함). 현재 필드 이름이며, `max_tokens`와 함께 전송되면 이 필드가 사용됩니다.            |
| `max_tokens`               | 숫자. 레거시 별칭이며, `max_completion_tokens`도 있으면 무시됩니다.                                                                           |
| `temperature`              | 0-2 범위의 숫자. 최선형으로 업스트림 제공자에 전달됩니다. 범위를 벗어나면 `400 invalid_request_error`가 반환됩니다.                            |
| `top_p`                    | 0-1 범위의 숫자. 최선형으로 처리됩니다. 범위를 벗어나면 `400 invalid_request_error`가 반환됩니다.                                             |
| `frequency_penalty`        | -2.0~2.0 범위의 숫자. 최선형으로 처리됩니다. 범위를 벗어나면 `400 invalid_request_error`가 반환됩니다.                                        |
| `presence_penalty`         | -2.0~2.0 범위의 숫자. 최선형으로 처리됩니다. 범위를 벗어나면 `400 invalid_request_error`가 반환됩니다.                                        |
| `seed`                     | 정수. 최선형으로 처리됩니다. 정수가 아닌 값에는 `400 invalid_request_error`가 반환됩니다.                                                     |
| `stop`                     | 문자열 또는 최대 4개의 문자열 배열. 최선형으로 처리됩니다. 시퀀스가 4개를 초과하거나 문자열이 아닌 항목 또는 빈 항목이 있으면 `400 invalid_request_error`가 반환됩니다. |

모든 샘플링 및 토큰 상한 필드는 동일한 에이전트 스트림 매개변수 채널을 통해 전달되며 최선형으로 전달됩니다.

- 토큰 상한: 제공자 전송 방식에 따라 전송 필드 이름이 선택됩니다. OpenAI 계열 엔드포인트에는 `max_completion_tokens`를 사용하고, 레거시 이름만 허용하는 제공자(Mistral, Chutes)에는 `max_tokens`를 사용합니다.
- `stop`은 전송 방식의 중지 필드에 매핑됩니다. Chat Completions 백엔드에는 `stop`, Anthropic에는 `stop_sequences`를 사용합니다. OpenAI Responses API에는 중지 매개변수가 없으므로 Responses 기반 모델에는 `stop`이 적용되지 않습니다.
- ChatGPT 기반 Codex Responses 백엔드는 고정된 서버 측 샘플링을 사용하며, 요청이 해당 백엔드에 도달하기 전에 `temperature`/`top_p`를 제거합니다(`max_output_tokens`, `metadata`, `prompt_cache_retention`, `service_tier`도 함께 제거됨).

### 지원되지 않는 변형

다음 경우 `400 invalid_request_error`를 반환합니다.

- 배열이 아닌 `tools`, 함수가 아닌 도구 항목 또는 누락된 `tool.function.name`
- `allowed_tools`, `custom`과 같은 `tool_choice` 변형
- 제공된 도구와 일치하지 않는 `tool_choice.function.name` 값

`tool_choice: "required"` 및 함수가 고정된 `tool_choice`의 경우 엔드포인트는 노출되는 클라이언트 함수 도구 집합을 좁히고, 응답하기 전에 클라이언트 도구를 호출하도록 런타임에 지시하며, 에이전트 응답에 일치하는 구조화된 클라이언트 도구 호출이 없으면 오류를 반환합니다. 이는 모든 내부 OpenClaw 에이전트 도구가 아니라 호출자가 제공한 HTTP `tools` 목록에 적용됩니다.

### 비스트리밍 도구 응답 형식

에이전트가 도구를 호출하면 응답은 다음 형식을 사용합니다.

- `choices[0].finish_reason = "tool_calls"`
- `id`, `type: "function"`, `function.name`, `function.arguments`(JSON 문자열)를 포함하는 `choices[0].message.tool_calls[]` 항목
- 도구 호출 전의 어시스턴트 설명은 `choices[0].message.content`에 포함됩니다(비어 있을 수 있음).

### 스트리밍 도구 응답 형식

`stream: true`인 경우 도구 호출은 증분 SSE 청크로 도착합니다. 먼저 어시스턴트 역할 델타가 오고, 선택적으로 어시스턴트 설명 델타가 이어진 다음, 도구 식별 정보와 인수 조각을 담은 하나 이상의 `delta.tool_calls` 청크가 오며, 마지막으로 `finish_reason: "tool_calls"`와 `data: [DONE]`이 포함된 최종 청크가 도착합니다.

`stream_options.include_usage=true`인 경우 `[DONE]` 전에 마지막 사용량 청크가 전송됩니다.

### 도구 후속 처리 루프

`tool_calls`를 받은 후 요청된 함수를 실행하고, 이전 어시스턴트 도구 호출 메시지와 일치하는 `tool_call_id`를 가진 하나 이상의 `role: "tool"` 메시지를 포함하는 후속 요청을 보내십시오. 이렇게 하면 동일한 에이전트 추론 루프가 계속되어 최종 답변이 생성됩니다.

## 스트리밍(SSE)

Server-Sent Events를 수신하려면 `stream: true`를 설정하십시오.

- `Content-Type: text/event-stream`
- 각 이벤트 줄은 `data: <json>` 형식입니다.
- 스트림은 `data: [DONE]`으로 종료됩니다.

## Open WebUI 빠른 설정

- 기본 URL: `http://127.0.0.1:18789/v1`
- macOS의 Docker 기본 URL: `http://host.docker.internal:18789/v1`
- API 키: Gateway 전달자 토큰
- 모델: `openclaw/default`

예상 동작: `GET /v1/models`는 `openclaw/default`를 나열하고, Open WebUI는 이를 채팅 모델 ID로 사용합니다. 특정 백엔드 제공자/모델을 사용하려면 에이전트의 일반 기본 모델을 설정하거나 `x-openclaw-model`을 전송하십시오(공유 비밀 호출자 또는 `operator.admin` 권한이 있는 신원 포함 호출자).

빠른 스모크 테스트:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

이 명령이 `openclaw/default`를 반환하면 대부분의 Open WebUI 설정에서 동일한 기본 URL과 토큰으로 연결할 수 있습니다.

## 예시

하나의 앱 대화에 대한 안정적인 세션:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"오늘 할 일을 요약해 줘"}]
  }'
```

해당 대화의 이후 호출에서 동일한 `user` 값을 재사용하면 같은 에이전트 세션이 계속됩니다.

비스트리밍:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"안녕하세요"}]
  }'
```

스트리밍:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"안녕하세요"}]
  }'
```

모델 목록 조회:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

모델 하나 조회:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

임베딩 생성:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

`/v1/embeddings`는 `input`으로 문자열 또는 문자열 배열을 지원합니다.

## 관련 항목

- [구성 참조](/ko/gateway/configuration-reference)
- [운영자 범위](/ko/gateway/operator-scopes)
- [OpenAI](/ko/providers/openai)
