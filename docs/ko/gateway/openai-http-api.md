---
read_when:
    - OpenAI Chat Completions를 기대하는 도구 통합하기
summary: Gateway에서 OpenAI 호환 /v1/chat/completions HTTP 엔드포인트 노출
title: OpenAI 채팅 완성
x-i18n:
    generated_at: "2026-04-30T06:32:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw의 Gateway는 작은 OpenAI 호환 Chat Completions 엔드포인트를 제공할 수 있습니다.

이 엔드포인트는 **기본적으로 비활성화되어 있습니다**. 먼저 구성에서 활성화하세요.

- `POST /v1/chat/completions`
- Gateway와 같은 포트(WS + HTTP 멀티플렉스): `http://<gateway-host>:<port>/v1/chat/completions`

Gateway의 OpenAI 호환 HTTP 표면이 활성화되면 다음도 제공합니다.

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

내부적으로 요청은 일반 Gateway 에이전트 실행(`openclaw agent`와 같은 코드 경로)으로 실행되므로 라우팅/권한/구성이 Gateway와 일치합니다.

## 인증

Gateway 인증 구성을 사용합니다.

일반적인 HTTP 인증 경로:

- 공유 시크릿 인증(`gateway.auth.mode="token"` 또는 `"password"`):
  `Authorization: Bearer <token-or-password>`
- 신뢰할 수 있는 ID 포함 HTTP 인증(`gateway.auth.mode="trusted-proxy"`):
  구성된 ID 인식 프록시를 통해 라우팅하고 필요한 ID 헤더를
  주입하게 합니다
- 비공개 인그레스 개방 인증(`gateway.auth.mode="none"`):
  인증 헤더가 필요하지 않음

참고:

- `gateway.auth.mode="token"`인 경우 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)을 사용합니다.
- `gateway.auth.mode="password"`인 경우 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 사용합니다.
- `gateway.auth.mode="trusted-proxy"`인 경우 HTTP 요청은 구성된 신뢰할 수 있는 프록시 소스에서 와야 합니다. 같은 호스트의 loopback 프록시는 명시적으로 `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다.
- `gateway.auth.rateLimit`가 구성되어 있고 인증 실패가 너무 많이 발생하면 엔드포인트는 `Retry-After`와 함께 `429`를 반환합니다.

## 보안 경계(중요)

이 엔드포인트를 Gateway 인스턴스에 대한 **전체 운영자 액세스** 표면으로 취급하세요.

- 여기서의 HTTP 베어러 인증은 좁은 사용자별 범위 모델이 아닙니다.
- 이 엔드포인트의 유효한 Gateway 토큰/비밀번호는 소유자/운영자 자격 증명처럼 취급해야 합니다.
- 요청은 신뢰할 수 있는 운영자 작업과 같은 제어 평면 에이전트 경로를 통해 실행됩니다.
- 이 엔드포인트에는 별도의 비소유자/사용자별 도구 경계가 없습니다. 호출자가 여기서 Gateway 인증을 통과하면 OpenClaw는 해당 호출자를 이 Gateway의 신뢰할 수 있는 운영자로 취급합니다.
- 공유 시크릿 인증 모드(`token` 및 `password`)의 경우, 호출자가 더 좁은 `x-openclaw-scopes` 헤더를 보내더라도 엔드포인트는 일반적인 전체 운영자 기본값을 복원합니다.
- 신뢰할 수 있는 ID 포함 HTTP 모드(예: 신뢰할 수 있는 프록시 인증 또는 `gateway.auth.mode="none"`)는 `x-openclaw-scopes`가 있으면 이를 존중하고, 없으면 일반 운영자 기본 범위 집합으로 대체합니다.
- 대상 에이전트 정책이 민감한 도구를 허용하면 이 엔드포인트는 이를 사용할 수 있습니다.
- 이 엔드포인트는 loopback/tailnet/비공개 인그레스에만 두세요. 공개 인터넷에 직접 노출하지 마세요.

인증 매트릭스:

- `gateway.auth.mode="token"` 또는 `"password"` + `Authorization: Bearer ...`
  - 공유 Gateway 운영자 시크릿의 소유를 증명합니다
  - 더 좁은 `x-openclaw-scopes`를 무시합니다
  - 전체 기본 운영자 범위 집합을 복원합니다:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 이 엔드포인트의 채팅 턴을 소유자 발신자 턴으로 취급합니다
- 신뢰할 수 있는 ID 포함 HTTP 모드(예: 신뢰할 수 있는 프록시 인증 또는 비공개 인그레스의 `gateway.auth.mode="none"`)
  - 일부 외부 신뢰 ID 또는 배포 경계를 인증합니다
  - 헤더가 있으면 `x-openclaw-scopes`를 존중합니다
  - 헤더가 없으면 일반 운영자 기본 범위 집합으로 대체합니다
  - 호출자가 명시적으로 범위를 좁히고 `operator.admin`을 생략한 경우에만 소유자 의미를 잃습니다

[보안](/ko/gateway/security) 및 [원격 액세스](/ko/gateway/remote)를 참조하세요.

## 에이전트 우선 모델 계약

OpenClaw는 OpenAI `model` 필드를 원시 제공자 모델 ID가 아니라 **에이전트 대상**으로 취급합니다.

- `model: "openclaw"`는 구성된 기본 에이전트로 라우팅됩니다.
- `model: "openclaw/default"`도 구성된 기본 에이전트로 라우팅됩니다.
- `model: "openclaw/<agentId>"`는 특정 에이전트로 라우팅됩니다.

선택적 요청 헤더:

- `x-openclaw-model: <provider/model-or-bare-id>`는 선택된 에이전트의 백엔드 모델을 재정의합니다.
- `x-openclaw-agent-id: <agentId>`는 호환성 재정의로 계속 지원됩니다.
- `x-openclaw-session-key: <sessionKey>`는 세션 라우팅을 완전히 제어합니다.
- `x-openclaw-message-channel: <channel>`은 채널 인식 프롬프트 및 정책을 위한 합성 인그레스 채널 컨텍스트를 설정합니다.

호환성 별칭도 계속 허용됩니다.

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## 엔드포인트 활성화

`gateway.http.endpoints.chatCompletions.enabled`를 `true`로 설정합니다.

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

## 엔드포인트 비활성화

`gateway.http.endpoints.chatCompletions.enabled`를 `false`로 설정합니다.

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## 세션 동작

기본적으로 엔드포인트는 **요청별 무상태**입니다(호출할 때마다 새 세션 키가 생성됨).

요청에 OpenAI `user` 문자열이 포함되어 있으면 Gateway는 여기서 안정적인 세션 키를 파생하므로 반복 호출이 에이전트 세션을 공유할 수 있습니다.

## 이 표면이 중요한 이유

이는 자체 호스팅 프론트엔드와 도구를 위한 가장 영향력 높은 호환성 집합입니다.

- 대부분의 Open WebUI, LobeChat, LibreChat 설정은 `/v1/models`를 기대합니다.
- 많은 RAG 시스템은 `/v1/embeddings`를 기대합니다.
- 기존 OpenAI 채팅 클라이언트는 일반적으로 `/v1/chat/completions`로 시작할 수 있습니다.
- 더 에이전트 네이티브한 클라이언트는 점점 `/v1/responses`를 선호합니다.

## 모델 목록 및 에이전트 라우팅

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    OpenClaw 에이전트 대상 목록입니다.

    반환되는 ID는 `openclaw`, `openclaw/default`, `openclaw/<agentId>` 항목입니다.
    이를 OpenAI `model` 값으로 직접 사용하세요.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    백엔드 제공자 모델이나 하위 에이전트가 아니라 최상위 에이전트 대상을 나열합니다.

    하위 에이전트는 내부 실행 토폴로지로 남습니다. 의사 모델로 표시되지 않습니다.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default`는 구성된 기본 에이전트의 안정적인 별칭입니다.

    즉 실제 기본 에이전트 ID가 환경마다 달라져도 클라이언트는 하나의 예측 가능한 ID를 계속 사용할 수 있습니다.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    `x-openclaw-model`을 사용하세요.

    예:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    이를 생략하면 선택된 에이전트는 일반적으로 구성된 모델 선택으로 실행됩니다.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings`는 같은 에이전트 대상 `model` ID를 사용합니다.

    `model: "openclaw/default"` 또는 `model: "openclaw/<agentId>"`를 사용하세요.
    특정 임베딩 모델이 필요하면 `x-openclaw-model`에 보내세요.
    해당 헤더가 없으면 요청은 선택된 에이전트의 일반 임베딩 설정으로 전달됩니다.

  </Accordion>
</AccordionGroup>

## 스트리밍(SSE)

Server-Sent Events(SSE)를 받으려면 `stream: true`를 설정하세요.

- `Content-Type: text/event-stream`
- 각 이벤트 줄은 `data: <json>`입니다
- 스트림은 `data: [DONE]`으로 종료됩니다

## Open WebUI 빠른 설정

기본 Open WebUI 연결의 경우:

- 기본 URL: `http://127.0.0.1:18789/v1`
- macOS의 Docker 기본 URL: `http://host.docker.internal:18789/v1`
- API 키: Gateway 베어러 토큰
- 모델: `openclaw/default`

예상 동작:

- `GET /v1/models`는 `openclaw/default`를 나열해야 합니다
- Open WebUI는 `openclaw/default`를 채팅 모델 ID로 사용해야 합니다
- 해당 에이전트에 특정 백엔드 제공자/모델을 원하면 에이전트의 일반 기본 모델을 설정하거나 `x-openclaw-model`을 보내세요

빠른 스모크:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

이것이 `openclaw/default`를 반환하면 대부분의 Open WebUI 설정은 같은 기본 URL과 토큰으로 연결할 수 있습니다.

## 예시

비스트리밍:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
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
    "messages": [{"role":"user","content":"hi"}]
  }'
```

모델 나열:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

모델 하나 가져오기:

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

참고:

- `/v1/models`는 원시 제공자 카탈로그가 아니라 OpenClaw 에이전트 대상을 반환합니다.
- `openclaw/default`는 항상 존재하므로 하나의 안정적인 ID가 여러 환경에서 작동합니다.
- 백엔드 제공자/모델 재정의는 OpenAI `model` 필드가 아니라 `x-openclaw-model`에 넣어야 합니다.
- `/v1/embeddings`는 `input`을 문자열 또는 문자열 배열로 지원합니다.

## 관련 항목

- [구성 참조](/ko/gateway/configuration-reference)
- [OpenAI](/ko/providers/openai)
