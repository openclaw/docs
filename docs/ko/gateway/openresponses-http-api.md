---
read_when:
    - OpenResponses API를 사용하는 클라이언트 통합하기
    - item 기반 입력, 클라이언트 도구 호출 또는 SSE 이벤트가 필요합니다
summary: Gateway에서 OpenResponses 호환 `/v1/responses` HTTP 엔드포인트 노출하기
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-25T06:01:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b48685ab42d6f031849990b60a57af9501c216f058dc38abce184b963b05cedb
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

OpenClaw의 Gateway는 OpenResponses 호환 `POST /v1/responses` 엔드포인트를 제공할 수 있습니다.

이 엔드포인트는 기본적으로 **비활성화**되어 있습니다. 먼저 config에서 활성화하세요.

- `POST /v1/responses`
- Gateway와 동일한 포트(WS + HTTP 멀티플렉스): `http://<gateway-host>:<port>/v1/responses`

내부적으로 요청은 일반 Gateway 에이전트 실행(`openclaw agent`와 동일한 코드 경로)으로 처리되므로, 라우팅/권한/config는 Gateway와 일치합니다.

## 인증, 보안 및 라우팅

운영 동작은 [OpenAI Chat Completions](/ko/gateway/openai-http-api)와 일치합니다.

- 일치하는 Gateway HTTP 인증 경로를 사용합니다:
  - 공유 시크릿 인증(`gateway.auth.mode="token"` 또는 `"password"`): `Authorization: Bearer <token-or-password>`
  - trusted-proxy 인증(`gateway.auth.mode="trusted-proxy"`): 구성된 비루프백 trusted proxy 소스의 identity-aware proxy 헤더
  - private-ingress open 인증(`gateway.auth.mode="none"`): 인증 헤더 없음
- 이 엔드포인트는 해당 gateway 인스턴스에 대한 전체 operator 액세스로 취급합니다
- 공유 시크릿 인증 모드(`token` 및 `password`)에서는 더 좁게 선언된 bearer `x-openclaw-scopes` 값을 무시하고 일반적인 전체 operator 기본값을 복원합니다
- 신뢰된 ID 전달 HTTP 모드(예: trusted proxy 인증 또는 `gateway.auth.mode="none"`)에서는 `x-openclaw-scopes`가 있으면 이를 존중하고, 없으면 일반적인 operator 기본 범위 집합으로 대체합니다
- 에이전트 선택: `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"`, 또는 `x-openclaw-agent-id`
- 선택한 에이전트의 백엔드 모델을 재정의하려면 `x-openclaw-model`을 사용합니다
- 명시적인 세션 라우팅에는 `x-openclaw-session-key`를 사용합니다
- 기본값이 아닌 합성 인그레스 채널 컨텍스트가 필요하면 `x-openclaw-message-channel`을 사용합니다

인증 매트릭스:

- `gateway.auth.mode="token"` 또는 `"password"` + `Authorization: Bearer ...`
  - 공유 gateway operator 시크릿의 소유를 증명합니다
  - 더 좁은 `x-openclaw-scopes`는 무시합니다
  - 전체 기본 operator 범위 집합을 복원합니다:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 이 엔드포인트의 chat 턴은 owner-sender 턴으로 취급합니다
- 신뢰된 ID 전달 HTTP 모드(예: trusted proxy 인증 또는 private ingress의 `gateway.auth.mode="none"`)
  - 헤더가 있으면 `x-openclaw-scopes`를 존중합니다
  - 헤더가 없으면 일반적인 operator 기본 범위 집합으로 대체합니다
  - 호출자가 명시적으로 범위를 좁히고 `operator.admin`을 생략한 경우에만 owner 의미론을 잃습니다

이 엔드포인트는 `gateway.http.endpoints.responses.enabled`로 활성화하거나 비활성화합니다.

동일한 호환성 표면에는 다음도 포함됩니다.

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

에이전트 대상 모델, `openclaw/default`, embeddings 패스스루, 백엔드 모델 재정의가 어떻게 맞물리는지에 대한 정식 설명은 [OpenAI Chat Completions](/ko/gateway/openai-http-api#agent-first-model-contract) 및 [Model list and agent routing](/ko/gateway/openai-http-api#model-list-and-agent-routing)을 참조하세요.

## 세션 동작

기본적으로 이 엔드포인트는 **요청별 무상태**입니다(호출마다 새 세션 키 생성).

요청에 OpenResponses `user` 문자열이 포함되면 Gateway는
그 값으로부터 안정적인 세션 키를 도출하므로, 반복 호출이 동일한 에이전트 세션을 공유할 수 있습니다.

## 요청 형식(지원 항목)

요청은 item 기반 입력을 사용하는 OpenResponses API를 따릅니다. 현재 지원 항목:

- `input`: 문자열 또는 item 객체 배열
- `instructions`: 시스템 프롬프트에 병합됨
- `tools`: 클라이언트 도구 정의(function 도구)
- `tool_choice`: 클라이언트 도구 필터링 또는 강제
- `stream`: SSE 스트리밍 활성화
- `max_output_tokens`: best-effort 출력 제한(provider 종속)
- `user`: 안정적인 세션 라우팅

허용되지만 **현재는 무시되는 항목**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

지원됨:

- `previous_response_id`: 요청이 동일한 에이전트/사용자/요청된 세션 범위 안에 머무르면 OpenClaw는 이전 응답 세션을 재사용합니다.

## Items (입력)

### `message`

역할: `system`, `developer`, `user`, `assistant`.

- `system`과 `developer`는 시스템 프롬프트에 추가됩니다.
- 가장 최근의 `user` 또는 `function_call_output` item이 “현재 메시지”가 됩니다.
- 이전의 user/assistant 메시지는 컨텍스트를 위한 기록으로 포함됩니다.

### `function_call_output` (턴 기반 도구)

도구 결과를 모델에 다시 보냅니다:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 및 `item_reference`

스키마 호환성을 위해 허용되지만 프롬프트를 구성할 때는 무시됩니다.

## 도구(클라이언트 측 function 도구)

`tools: [{ type: "function", function: { name, description?, parameters? } }]` 형식으로 도구를 제공합니다.

에이전트가 도구 호출을 결정하면 응답은 `function_call` 출력 item을 반환합니다.
그다음 턴을 이어가려면 `function_call_output`이 포함된 후속 요청을 보내면 됩니다.

## 이미지 (`input_image`)

base64 또는 URL 소스를 지원합니다:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

허용 MIME 유형(현재): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
최대 크기(현재): 10MB.

## 파일 (`input_file`)

base64 또는 URL 소스를 지원합니다:

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

허용 MIME 유형(현재): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

최대 크기(현재): 5MB.

현재 동작:

- 파일 내용은 user 메시지가 아니라 **시스템 프롬프트**에 디코드되어 추가되므로,
  일시적 상태로 유지됩니다(세션 기록에 저장되지 않음).
- 디코드된 파일 텍스트는 추가되기 전에 **신뢰되지 않는 외부 콘텐츠**로 감싸지므로,
  파일 바이트는 신뢰된 지시가 아니라 데이터로 취급됩니다.
- 주입된 블록은
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 같은 명시적 경계 마커를 사용하고
  `Source: External` 메타데이터 줄을 포함합니다.
- 이 파일 입력 경로는 프롬프트 예산을 보존하기 위해 긴 `SECURITY NOTICE:` 배너를
  의도적으로 생략합니다. 경계 마커와 메타데이터는 여전히 유지됩니다.
- PDF는 먼저 텍스트 파싱을 시도합니다. 텍스트가 거의 없으면 처음 몇 페이지를
  이미지로 래스터화하여 모델에 전달하고, 주입된 파일 블록에는
  `[PDF content rendered to images]` 플레이스홀더를 사용합니다.

PDF 파싱은 번들된 `document-extract` Plugin이 제공하며,
Node 친화적인 `pdfjs-dist` 레거시 빌드(worker 없음)를 사용합니다. 최신 PDF.js 빌드는
브라우저 worker/DOM 전역을 기대하므로 Gateway에서는 사용되지 않습니다.

URL 가져오기 기본값:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (요청당 URL 기반 `input_file` + `input_image` 파트 총합)
- 요청은 보호됩니다(DNS 확인, 사설 IP 차단, 리디렉션 상한, 제한 시간).
- 입력 유형별 선택적 hostname 허용 목록이 지원됩니다(`files.urlAllowlist`, `images.urlAllowlist`).
  - 정확한 호스트: `"cdn.example.com"`
  - 와일드카드 하위 도메인: `"*.assets.example.com"` (apex와는 일치하지 않음)
  - 비어 있거나 생략된 허용 목록은 hostname 허용 목록 제한이 없음을 의미합니다.
- URL 기반 가져오기를 완전히 비활성화하려면 `files.allowUrl: false` 및/또는 `images.allowUrl: false`를 설정하세요.

## 파일 + 이미지 제한(config)

기본값은 `gateway.http.endpoints.responses` 아래에서 조정할 수 있습니다:

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
            maxChars: 200000,
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

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10초
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10초
- HEIC/HEIF `input_image` 소스는 허용되며 provider 전달 전에 JPEG로 정규화됩니다.

보안 참고:

- URL 허용 목록은 가져오기 전과 리디렉션 홉에서 강제 적용됩니다.
- hostname을 허용 목록에 추가해도 사설/내부 IP 차단은 우회되지 않습니다.
- 인터넷에 노출된 gateway의 경우 앱 수준 가드 외에도 네트워크 송신 제어를 적용하세요.
  [Security](/ko/gateway/security)를 참조하세요.

## 스트리밍 (SSE)

`stream: true`를 설정하면 Server-Sent Events(SSE)를 받을 수 있습니다:

- `Content-Type: text/event-stream`
- 각 이벤트 줄은 `event: <type>` 및 `data: <json>` 형식입니다
- 스트림은 `data: [DONE]`으로 종료됩니다

현재 내보내는 이벤트 유형:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (오류 발생 시)

## 사용량

기반 provider가 토큰 수를 보고하면 `usage`가 채워집니다.
OpenClaw는 해당 카운터가 downstream 상태/세션 표면에 도달하기 전에
일반적인 OpenAI 스타일 별칭을 정규화합니다. 여기에는 `input_tokens` / `output_tokens`
및 `prompt_tokens` / `completion_tokens`가 포함됩니다.

## 오류

오류는 다음과 같은 JSON 객체를 사용합니다:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

일반적인 경우:

- `401` 인증 누락/유효하지 않음
- `400` 잘못된 요청 본문
- `405` 잘못된 메서드

## 예시

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

## 관련 항목

- [OpenAI chat completions](/ko/gateway/openai-http-api)
- [OpenAI](/ko/providers/openai)
