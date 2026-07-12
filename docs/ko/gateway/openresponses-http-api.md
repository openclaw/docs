---
read_when:
    - OpenResponses API를 사용하는 클라이언트 통합하기
    - 항목 기반 입력, 클라이언트 도구 호출 또는 SSE 이벤트가 필요한 경우
summary: Gateway에서 OpenResponses 호환 `/v1/responses` HTTP 엔드포인트를 제공합니다
title: OpenResponses API
x-i18n:
    generated_at: "2026-07-12T15:20:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway는 OpenResponses 호환 `POST /v1/responses` 엔드포인트를 제공할 수 있습니다. 이 엔드포인트는 **기본적으로 비활성화되어 있으며** Gateway와 포트를 공유합니다(WS + HTTP 멀티플렉싱): `http://<gateway-host>:<port>/v1/responses`.

요청은 일반적인 Gateway 에이전트 실행(`openclaw agent`와 동일한 코드 경로)으로 처리되므로 라우팅, 권한 및 구성은 사용 중인 Gateway와 일치합니다.

`gateway.http.endpoints.responses.enabled`로 활성화하거나 비활성화합니다. 활성화하면 동일한 호환성 표면에서 `GET /v1/models`, `GET /v1/models/{id}`, `POST /v1/embeddings`, `POST /v1/chat/completions`도 제공됩니다.

## 인증, 보안 및 라우팅

운영 동작은 [OpenAI Chat Completions](/ko/gateway/openai-http-api)와 일치합니다.

- 인증 경로는 `gateway.auth.mode`와 일치합니다. 공유 비밀(`token`/`password`)은 `Authorization: Bearer <token-or-password>`를 사용하고, 신뢰할 수 있는 프록시는 ID 인식 프록시 헤더를 사용합니다(동일 호스트 루프백 프록시에는 `gateway.auth.trustedProxy.allowLoopback = true`가 필요하며, `Forwarded`/`X-Forwarded-*`/`X-Real-IP` 헤더가 없으면 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 통해 동일 호스트 직접 폴백을 사용합니다). 비공개 인그레스에서 `none`을 사용하면 인증 헤더가 필요하지 않습니다. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하십시오.
- 이 엔드포인트는 Gateway 인스턴스에 대한 전체 운영자 액세스로 취급하십시오.
- 공유 비밀 인증 모드는 bearer가 선언한 더 제한적인 `x-openclaw-scopes`를 무시하고 전체 기본 운영자 범위 집합인 `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`를 복원합니다. 이 엔드포인트의 채팅 턴은 소유자가 보낸 턴으로 취급됩니다.
- 신뢰할 수 있는 ID를 전달하는 HTTP 모드(신뢰할 수 있는 프록시 또는 `gateway.auth.mode="none"`)는 `x-openclaw-scopes`가 있으면 이를 따르고, 없으면 운영자 기본 범위 집합으로 폴백합니다. 호출자가 범위를 명시적으로 제한하고 `operator.admin`을 생략한 경우에만 소유자 의미 체계가 사라집니다.
- `model: "openclaw"`, `"openclaw/default"`, `"openclaw/<agentId>"` 또는 `x-openclaw-agent-id` 헤더로 에이전트를 선택합니다.
- 선택한 에이전트의 백엔드 모델을 재정의하려면 `x-openclaw-model`을 사용합니다(ID를 전달하는 인증 경로에서는 `operator.admin` 필요).
- 명시적인 세션 라우팅에는 `x-openclaw-session-key`를 사용합니다(예약된 네임스페이스 `subagent:`, `cron:`, `acp:`를 사용하면 `400 invalid_request_error`로 거부됩니다).
- 기본값이 아닌 합성 인그레스 채널 컨텍스트에는 `x-openclaw-message-channel`을 사용합니다.

에이전트 대상 모델, `openclaw/default`, 임베딩 패스스루 및 백엔드 모델 재정의에 대한 표준 설명은 [OpenAI Chat Completions](/ko/gateway/openai-http-api#agent-first-model-contract)을 참조하십시오.

[운영자 범위](/ko/gateway/operator-scopes) 및 [보안](/ko/gateway/security)을 참조하십시오.

## 세션 동작

기본적으로 엔드포인트는 **요청별로 상태를 유지하지 않습니다**(호출할 때마다 새 세션 키가 생성됩니다).

요청에 OpenResponses `user` 문자열이 포함되면 Gateway는 이 문자열에서 안정적인 세션 키를 파생하므로 반복 호출이 에이전트 세션을 공유할 수 있습니다.

요청이 동일한 에이전트/사용자/요청된 세션 범위 내에 있는 경우(인증 주체, 에이전트 ID 및 `x-openclaw-session-key`로 일치 여부 확인) `previous_response_id`는 이전 응답의 세션을 재사용합니다.

## 요청 형태

| 필드                                                             | 지원                                                                                                                            |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | 문자열 또는 항목 객체 배열입니다.                                                                                               |
| `instructions`                                                   | 시스템 프롬프트에 병합됩니다.                                                                                                   |
| `tools`                                                          | 클라이언트 도구 정의(함수 도구)입니다.                                                                                          |
| `tool_choice`                                                    | 클라이언트 도구를 필터링하거나 필수로 지정하는 `"auto"`, `"none"`, `"required"` 또는 `{ "type": "function", "name": "..." }`입니다. |
| `stream`                                                         | SSE 스트리밍을 활성화합니다.                                                                                                    |
| `max_output_tokens`                                              | 최선형 출력 제한입니다(제공자에 따라 다름).                                                                                     |
| `temperature`                                                    | 최선형 샘플링 온도입니다. 고정된 서버 측 샘플링을 사용하는 ChatGPT 기반 Codex Responses 백엔드에서는 무시됩니다.                 |
| `top_p`                                                          | 최선형 핵 샘플링입니다. `temperature`와 동일한 Codex Responses 주의 사항이 적용됩니다.                                           |
| `user`                                                           | 안정적인 세션 라우팅입니다.                                                                                                     |
| `previous_response_id`                                           | 세션 연속성입니다(위 내용 참조).                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | 허용되지만 현재는 무시됩니다.                                                                                                   |

## 항목(입력)

### `message`

역할: `system`, `developer`, `user`, `assistant`.

- `system`과 `developer`는 시스템 프롬프트에 추가됩니다.
- 가장 최근의 `user` 또는 `function_call_output` 항목이 "현재 메시지"가 됩니다.
- 이전 사용자/어시스턴트 메시지는 컨텍스트 기록으로 포함됩니다.

### `function_call_output`(턴 기반 도구)

도구 결과를 모델로 다시 보냅니다.

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 및 `item_reference`

스키마 호환성을 위해 허용되지만 프롬프트를 구성할 때는 무시됩니다.

## 도구(클라이언트 측 함수 도구)

`tools: [{ type: "function", name, description?, parameters? }]`로 도구를 제공합니다.

에이전트가 도구를 호출하면 응답에서 `function_call` 출력 항목을 반환합니다. 턴을 계속하려면 `function_call_output`이 포함된 후속 요청을 보내십시오.

`tool_choice: "required"` 및 함수가 고정된 `tool_choice`의 경우 엔드포인트는 노출되는 클라이언트 함수 도구 집합을 제한하고, 응답 전에 클라이언트 도구를 호출하도록 런타임에 지시하며, 일치하는 구조화된 클라이언트 도구 호출이 포함되지 않은 턴을 `/v1/chat/completions` 계약에 따라 거부합니다. 비스트리밍 요청은 `api_error`와 함께 `502`를 반환하고, 스트리밍 요청은 `response.failed` 이벤트를 방출합니다.

## 이미지(`input_image`)

base64 또는 URL 소스를 지원합니다.

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

허용되는 MIME 유형(기본값): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`. 최대 크기(기본값): 10MB.

## 파일(`input_file`)

base64 또는 URL 소스를 지원합니다.

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

허용되는 MIME 유형(기본값): `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. 최대 크기(기본값): 5MB.

현재 동작:

- 파일 콘텐츠는 디코딩되어 사용자 메시지가 아닌 **시스템 프롬프트**에 추가되므로 일시적으로 유지됩니다(세션 기록에 영구 저장되지 않음).
- 디코딩된 파일 텍스트는 추가되기 전에 **신뢰할 수 없는 외부 콘텐츠**로 래핑되므로 파일 바이트는 신뢰할 수 있는 지침이 아닌 데이터로 취급됩니다. 삽입된 블록은 명시적인 경계 마커(`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`)와 `Source: External` 메타데이터 줄을 사용합니다. 프롬프트 예산을 보존하기 위해 긴 `SECURITY NOTICE:` 배너는 의도적으로 생략하지만, 경계 마커와 메타데이터는 계속 적용됩니다.
- PDF는 먼저 텍스트로 파싱됩니다. 텍스트가 거의 없으면 첫 페이지들을 이미지로 래스터화하여 모델에 전달하며, 삽입된 파일 블록은 자리표시자 `[PDF content rendered to images]`를 사용합니다.

PDF 파싱은 번들된 `document-extract` Plugin에서 제공하며, 이 Plugin은 텍스트 추출 및 페이지 렌더링에 `clawpdf`와 패키지에 포함된 PDFium WebAssembly 런타임을 사용합니다.

URL 가져오기 기본값:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8`(요청당 URL 기반 `input_file` + `input_image` 부분의 총합)
- 요청에는 보호 조치가 적용됩니다(DNS 확인, 비공개 IP 차단, 리디렉션 제한, 시간 초과).
- 입력 유형별로 선택적 호스트 이름 허용 목록(`files.urlAllowlist`, `images.urlAllowlist`)을 지원합니다. 정확한 호스트(`"cdn.example.com"`) 또는 와일드카드 하위 도메인(`"*.assets.example.com"`, 최상위 도메인과는 일치하지 않음)을 사용할 수 있습니다. 허용 목록이 비어 있거나 생략되면 호스트 이름 허용 목록 제한이 없습니다.
- URL 기반 가져오기를 완전히 비활성화하려면 `files.allowUrl: false` 및/또는 `images.allowUrl: false`로 설정합니다.

## 파일 + 이미지 제한(구성)

기본값은 `gateway.http.endpoints.responses`에서 조정할 수 있습니다.

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 60000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
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

| 키                       | 기본값    |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20MB      |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

HEIC/HEIF `input_image` 소스는 공유 OpenClaw 이미지 프로세서(Rastermill)를 통해 제공자에게 전달되기 전에 JPEG로 정규화됩니다. 이 프로세서는 외부 코덱 지원이 필요한 형식의 경우 시스템 변환기(`sips`, ImageMagick, GraphicsMagick 또는 ffmpeg)로 폴백합니다.

보안 참고: URL 허용 목록은 가져오기 전과 리디렉션 홉마다 적용됩니다. 호스트 이름을 허용 목록에 추가해도 비공개/내부 IP 차단을 우회하지 않습니다. 인터넷에 노출된 Gateway의 경우 애플리케이션 수준 보호 조치와 함께 네트워크 이그레스 제어를 적용하십시오. [보안](/ko/gateway/security)을 참조하십시오.

## 스트리밍(SSE)

Server-Sent Events를 수신하려면 `stream: true`로 설정합니다.

- `Content-Type: text/event-stream`
- 각 이벤트 줄은 `event: <type>` 및 `data: <json>` 형식입니다.
- 스트림은 `data: [DONE]`으로 종료됩니다.

현재 전송되는 이벤트 유형은 `response.created`, `response.in_progress`, `response.output_item.added`, `response.content_part.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed`(오류 발생 시)입니다.

## 사용량

기반 제공자가 토큰 수를 보고하면 `usage`가 채워집니다. OpenClaw는 이러한 카운터가 하위 상태/세션 표면에 전달되기 전에 `input_tokens` / `output_tokens` 및 `prompt_tokens` / `completion_tokens`를 비롯한 일반적인 OpenAI 스타일 별칭을 정규화합니다.

## 오류

오류는 다음과 같은 JSON 객체를 사용합니다.

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

일반적인 경우: `400` 잘못된 요청 본문, `401` 인증 누락/잘못된 인증, `403` 운영자 범위 누락, `405` 잘못된 메서드, `429` 인증 실패 시도 횟수 초과(`Retry-After` 포함).

## 예제

비스트리밍:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

스트리밍:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## 관련 문서

- [OpenAI 채팅 완성](/ko/gateway/openai-http-api)
- [운영자 범위](/ko/gateway/operator-scopes)
- [OpenAI](/ko/providers/openai)
