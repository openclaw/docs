---
read_when:
    - OpenResponses API를 사용하는 클라이언트 통합
    - 항목 기반 입력, 클라이언트 도구 호출 또는 SSE 이벤트가 필요한 경우
summary: Gateway에서 OpenResponses 호환 /v1/responses HTTP 엔드포인트 노출
title: OpenResponses API
x-i18n:
    generated_at: "2026-04-30T06:32:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw의 Gateway는 OpenResponses 호환 `POST /v1/responses` 엔드포인트를 제공할 수 있습니다.

이 엔드포인트는 **기본적으로 비활성화되어 있습니다**. 먼저 구성에서 활성화하세요.

- `POST /v1/responses`
- Gateway와 동일한 포트(WS + HTTP 멀티플렉스): `http://<gateway-host>:<port>/v1/responses`

내부적으로 요청은 일반 Gateway 에이전트 실행(`openclaw agent`와 동일한 코드 경로)으로 실행되므로 라우팅/권한/구성은 Gateway와 일치합니다.

## 인증, 보안, 라우팅

동작 방식은 [OpenAI Chat Completions](/ko/gateway/openai-http-api)와 일치합니다.

- 일치하는 Gateway HTTP 인증 경로를 사용합니다.
  - 공유 비밀 인증(`gateway.auth.mode="token"` 또는 `"password"`): `Authorization: Bearer <token-or-password>`
  - 신뢰할 수 있는 프록시 인증(`gateway.auth.mode="trusted-proxy"`): 구성된 신뢰할 수 있는 프록시 소스의 ID 인식 프록시 헤더입니다. 동일 호스트 루프백 프록시는 명시적으로 `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다.
  - 비공개 인그레스 공개 인증(`gateway.auth.mode="none"`): 인증 헤더 없음
- 이 엔드포인트를 Gateway 인스턴스에 대한 전체 운영자 접근으로 취급합니다.
- 공유 비밀 인증 모드(`token` 및 `password`)에서는 더 좁은 bearer 선언 `x-openclaw-scopes` 값을 무시하고 일반 전체 운영자 기본값을 복원합니다.
- 신뢰할 수 있는 ID 포함 HTTP 모드(예: 신뢰할 수 있는 프록시 인증 또는 `gateway.auth.mode="none"`)에서는 `x-openclaw-scopes`가 있으면 이를 따르고, 없으면 일반 운영자 기본 scope 집합으로 대체합니다.
- `model: "openclaw"`, `model: "openclaw/default"`, `model: "openclaw/<agentId>"` 또는 `x-openclaw-agent-id`로 에이전트를 선택합니다.
- 선택한 에이전트의 백엔드 모델을 재정의하려면 `x-openclaw-model`을 사용합니다.
- 명시적 세션 라우팅에는 `x-openclaw-session-key`를 사용합니다.
- 기본값이 아닌 합성 인그레스 채널 컨텍스트를 원하면 `x-openclaw-message-channel`을 사용합니다.

인증 매트릭스:

- `gateway.auth.mode="token"` 또는 `"password"` + `Authorization: Bearer ...`
  - 공유 Gateway 운영자 비밀을 보유하고 있음을 증명합니다.
  - 더 좁은 `x-openclaw-scopes`를 무시합니다.
  - 전체 기본 운영자 scope 집합을 복원합니다.
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 이 엔드포인트의 채팅 턴을 소유자 발신자 턴으로 취급합니다.
- 신뢰할 수 있는 ID 포함 HTTP 모드(예: 신뢰할 수 있는 프록시 인증 또는 비공개 인그레스의 `gateway.auth.mode="none"`)
  - 헤더가 있으면 `x-openclaw-scopes`를 따릅니다.
  - 헤더가 없으면 일반 운영자 기본 scope 집합으로 대체합니다.
  - 호출자가 명시적으로 scope를 좁히고 `operator.admin`을 생략한 경우에만 소유자 의미 체계를 잃습니다.

`gateway.http.endpoints.responses.enabled`로 이 엔드포인트를 활성화하거나 비활성화합니다.

동일한 호환성 표면에는 다음도 포함됩니다.

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

에이전트 대상 모델, `openclaw/default`, 임베딩 패스스루, 백엔드 모델 재정의가 함께 동작하는 방식에 대한 표준 설명은 [OpenAI Chat Completions](/ko/gateway/openai-http-api#agent-first-model-contract) 및 [모델 목록과 에이전트 라우팅](/ko/gateway/openai-http-api#model-list-and-agent-routing)을 참조하세요.

## 세션 동작

기본적으로 엔드포인트는 **요청별 무상태**입니다(호출마다 새 세션 키가 생성됨).

요청에 OpenResponses `user` 문자열이 포함되어 있으면 Gateway가 여기서 안정적인 세션 키를 파생하므로 반복 호출이 에이전트 세션을 공유할 수 있습니다.

## 요청 형태(지원됨)

요청은 항목 기반 입력을 사용하는 OpenResponses API를 따릅니다. 현재 지원 범위:

- `input`: 문자열 또는 항목 객체 배열입니다.
- `instructions`: 시스템 프롬프트에 병합됩니다.
- `tools`: 클라이언트 도구 정의(함수 도구)입니다.
- `tool_choice`: 클라이언트 도구를 필터링하거나 요구합니다.
- `stream`: SSE 스트리밍을 활성화합니다.
- `max_output_tokens`: 최선 노력 방식의 출력 제한입니다(제공자에 따라 다름).
- `user`: 안정적인 세션 라우팅입니다.

허용되지만 **현재 무시됨**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

지원됨:

- `previous_response_id`: 요청이 동일한 에이전트/사용자/요청된 세션 scope 안에 유지되면 OpenClaw가 이전 응답 세션을 재사용합니다.

## 항목(입력)

### `message`

역할: `system`, `developer`, `user`, `assistant`.

- `system` 및 `developer`는 시스템 프롬프트에 추가됩니다.
- 가장 최근의 `user` 또는 `function_call_output` 항목이 “현재 메시지”가 됩니다.
- 이전 user/assistant 메시지는 컨텍스트용 기록으로 포함됩니다.

### `function_call_output`(턴 기반 도구)

도구 결과를 모델에 다시 보냅니다.

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 및 `item_reference`

스키마 호환성을 위해 허용되지만 프롬프트를 만들 때는 무시됩니다.

## 도구(클라이언트 측 함수 도구)

`tools: [{ type: "function", function: { name, description?, parameters? } }]`로 도구를 제공합니다.

에이전트가 도구 호출을 결정하면 응답은 `function_call` 출력 항목을 반환합니다.
그런 다음 턴을 계속하려면 `function_call_output`이 포함된 후속 요청을 보냅니다.

## 이미지(`input_image`)

base64 또는 URL 소스를 지원합니다.

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

허용되는 MIME 유형(현재): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
최대 크기(현재): 10MB.

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

허용되는 MIME 유형(현재): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

최대 크기(현재): 5MB.

현재 동작:

- 파일 내용은 디코딩되어 사용자 메시지가 아니라 **시스템 프롬프트**에 추가되므로 일시적으로 유지됩니다(세션 기록에 지속되지 않음).
- 디코딩된 파일 텍스트는 추가되기 전에 **신뢰할 수 없는 외부 콘텐츠**로 래핑되므로 파일 바이트는 신뢰할 수 있는 지침이 아니라 데이터로 취급됩니다.
- 삽입된 블록은 `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` 같은 명시적 경계 마커를 사용하며 `Source: External` 메타데이터 줄을 포함합니다.
- 이 파일 입력 경로는 프롬프트 예산을 보존하기 위해 긴 `SECURITY NOTICE:` 배너를 의도적으로 생략합니다. 경계 마커와 메타데이터는 그대로 유지됩니다.
- PDF는 먼저 텍스트로 파싱됩니다. 텍스트가 거의 발견되지 않으면 첫 페이지들이 이미지로 래스터화되어 모델에 전달되고, 삽입된 파일 블록은 `[PDF content rendered to images]` 플레이스홀더를 사용합니다.

PDF 파싱은 번들된 `document-extract` Plugin이 제공하며, 이 Plugin은 Node 친화적인 `pdfjs-dist` 레거시 빌드(워커 없음)를 사용합니다. 최신 PDF.js 빌드는 브라우저 워커/DOM 전역을 기대하므로 Gateway에서 사용되지 않습니다.

URL 가져오기 기본값:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8`(요청당 URL 기반 `input_file` + `input_image` 부분 합계)
- 요청은 보호됩니다(DNS 확인, 비공개 IP 차단, 리디렉션 한도, 시간 제한).
- 선택적 호스트명 허용 목록은 입력 유형별로 지원됩니다(`files.urlAllowlist`, `images.urlAllowlist`).
  - 정확한 호스트: `"cdn.example.com"`
  - 와일드카드 하위 도메인: `"*.assets.example.com"`(apex와 일치하지 않음)
  - 비어 있거나 생략된 허용 목록은 호스트명 허용 목록 제한이 없음을 의미합니다.
- URL 기반 가져오기를 완전히 비활성화하려면 `files.allowUrl: false` 및/또는 `images.allowUrl: false`를 설정합니다.

## 파일 + 이미지 제한(구성)

기본값은 `gateway.http.endpoints.responses` 아래에서 조정할 수 있습니다.

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
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- HEIC/HEIF `input_image` 소스는 허용되며 제공자 전달 전에 JPEG로 정규화됩니다.

보안 참고:

- URL 허용 목록은 가져오기 전과 리디렉션 홉에서 적용됩니다.
- 호스트명을 허용 목록에 추가해도 비공개/내부 IP 차단을 우회하지 않습니다.
- 인터넷에 노출된 Gateway의 경우 앱 수준 보호 장치에 더해 네트워크 이그레스 제어를 적용하세요.
  [보안](/ko/gateway/security)을 참조하세요.

## 스트리밍(SSE)

서버 전송 이벤트(SSE)를 받으려면 `stream: true`를 설정합니다.

- `Content-Type: text/event-stream`
- 각 이벤트 줄은 `event: <type>` 및 `data: <json>`입니다.
- 스트림은 `data: [DONE]`으로 종료됩니다.

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
- `response.failed`(오류 시)

## 사용량

기반 제공자가 토큰 수를 보고할 때 `usage`가 채워집니다.
OpenClaw는 이러한 카운터가 downstream 상태/세션 표면에 도달하기 전에 `input_tokens` / `output_tokens` 및 `prompt_tokens` / `completion_tokens`를 포함한 일반적인 OpenAI 스타일 별칭을 정규화합니다.

## 오류

오류는 다음과 같은 JSON 객체를 사용합니다.

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

일반적인 사례:

- `401` 인증 누락/잘못됨
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

## 관련 문서

- [OpenAI chat completions](/ko/gateway/openai-http-api)
- [OpenAI](/ko/providers/openai)
