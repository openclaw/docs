---
read_when:
    - 다른 애플리케이션에서 OpenClaw의 모델 전송 계층을 재사용하려고 합니다
    - packages/ai 또는 AI 전송 호스트 포트를 변경하고 있습니다
    - 루트 패키지 외에 OpenClaw 릴리스가 npm에 게시하는 항목을 검토하고 있습니다.
summary: '@openclaw/ai npm 패키지: 재사용 가능한 모델 전송 계층, 격리된 런타임 및 호스트 정책 포트'
title: '@openclaw/ai 패키지'
x-i18n:
    generated_at: "2026-07-12T15:42:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 610057caae0a9bbf9f74074cda75fc40c0b9aa9d3441f8263151f08f1a3f35a8
    source_path: reference/openclaw-ai.md
    workflow: 16
---

`@openclaw/ai`는 OpenClaw 모델 실행 계층의 배포 가능한 라이브러리 형태입니다.
공급자 중립적인 메시지/도구/스트림 계약, 검증, 진단, 이벤트 스트림, 격리된
런타임 레지스트리와 8가지 기본 제공 API 계열(Anthropic Messages, OpenAI
Completions, OpenAI Responses, Azure OpenAI Responses, ChatGPT/Codex Responses,
Google Generative AI, Google Vertex, Mistral Conversations)을 위한 지연 로딩
어댑터를 제공합니다.

모든 릴리스에서 루트 `openclaw` 패키지와 함께 동일한 버전으로 고정되어
배포되며, 설치 시 전이적 종속성 트리가 고정되도록 자체 `npm-shrinkwrap.json`을
포함합니다. `openclaw`를 설치하면 일치하는 `@openclaw/ai`가 자동으로
설치됩니다. 라이브러리 사용자는 OpenClaw 애플리케이션 코드 없이 이 패키지를
직접 종속성으로 사용할 수 있습니다.

## 빠른 시작

```js
import { createLlmRuntime } from "@openclaw/ai";
import { registerBuiltInApiProviders } from "@openclaw/ai/providers";

const runtime = createLlmRuntime();
registerBuiltInApiProviders(runtime.registry);

const stream = runtime.streamSimple(model, { messages }, { apiKey });
for await (const event of stream) {
  if (event.type === "text_delta") process.stdout.write(event.delta);
}
const result = await stream.result();
```

실행 가능한 버전은 저장소의 `examples/ai-chat`에 있습니다.

## 설계 계약

- **기본적으로 인스턴스 범위입니다.** 패키지를 가져와도 전역으로 아무것도
  등록되지 않습니다. `createApiRegistry()` / `createLlmRuntime()`은 격리된
  인스턴스를 반환하며, `registerBuiltInApiProviders(registry)`를 사용하면 특정
  레지스트리에 기본 제공 전송 계층을 활성화할 수 있습니다. 공급자 SDK 모듈은
  처음 사용할 때 지연 로딩됩니다.
- **호스트 정책은 번들에 포함되지 않고 주입됩니다.** 요청 fetch 보호(예:
  SSRF 정책), 도구 결과 재생 텍스트의 비밀 정보 삭제, OpenAI의 엄격한 도구
  기본값 및 진단 로깅은 `configureAiTransportHost`로 구성하는
  `AiTransportHost` 포트입니다. 라이브러리 기본값은 아무 작업도 하지 않으며,
  OpenClaw는 스트림 파사드에서 실제 구현을 설치합니다.
- **단일 이벤트 스트림 식별자를 사용합니다.** `@openclaw/ai/event-stream`은
  OpenClaw 코어, agent-core 및 외부 사용자가 공유하는 표준 `EventStream`
  생성자입니다.
- **`internal/*` 하위 경로는 API가 아닙니다.** 이 경로는 OpenClaw
  애플리케이션 자체를 위해 존재하며 semver를 보장하지 않습니다.
- 공급자 ID, 자격 증명, 모델 카탈로그, 재시도 및 장애 조치는 계속해서
  애플리케이션의 책임입니다. OpenClaw는 이 패키지 주위에 이러한 기능을
  계층화하며, 라이브러리 사용자는 `Model` 객체와 옵션을 직접 제공합니다.

## 하위 경로 내보내기

| 하위 경로        | 내용                                                                           |
| ---------------- | ------------------------------------------------------------------------------ |
| `.`              | 계약, `createApiRegistry`, `createLlmRuntime`, `configureAiTransportHost`       |
| `./providers`    | `registerBuiltInApiProviders`, `resetApiProviders`                             |
| `./types`        | 모델/메시지/도구/스트림 유형                                                   |
| `./validation`   | 도구 인수 검증                                                                 |
| `./diagnostics`  | 진단 계약                                                                      |
| `./event-stream` | 공유 `EventStream` 구현                                                        |
| `./internal/*`   | OpenClaw 내부 전용, semver 보장 없음                                           |
