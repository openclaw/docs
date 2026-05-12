---
read_when:
    - 아웃바운드 채널의 Markdown 서식 또는 청킹을 변경하고 있습니다
    - 새 채널 포매터 또는 스타일 매핑을 추가하는 경우
    - 채널 전반에서 서식 회귀를 디버깅하고 있습니다
summary: 아웃바운드 채널을 위한 Markdown 서식 지정 파이프라인
title: Markdown 서식
x-i18n:
    generated_at: "2026-05-12T12:50:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8db92aaf1063ebcbd8630dfcb8ca0a4e9eeb1c64f5b8868bf11c836777180515
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw는 발신 Markdown을 채널별 출력을 렌더링하기 전에 공유 중간
표현(IR)으로 변환해 형식을 지정합니다. IR은 원본 텍스트를 그대로 유지하면서
스타일/링크 범위를 함께 담아, 청킹과 렌더링이 채널 전반에서 일관되게
유지되도록 합니다.

## 목표

- **일관성:** 한 번의 파싱 단계, 여러 렌더러.
- **안전한 청킹:** 렌더링 전에 텍스트를 분할하여 인라인 서식이 청크 사이에서
  깨지지 않도록 합니다.
- **채널 적합성:** Markdown을 다시 파싱하지 않고 동일한 IR을 Slack mrkdwn, Telegram HTML, Signal
  스타일 범위에 매핑합니다.

## 파이프라인

1. **Markdown 파싱 -> IR**
   - IR은 일반 텍스트와 스타일 범위(bold/italic/strike/code/spoiler), 링크 범위로 구성됩니다.
   - 오프셋은 UTF-16 코드 단위이므로 Signal 스타일 범위가 해당 API와 정렬됩니다.
   - 표는 채널이 표 변환을 선택한 경우에만 파싱됩니다.
2. **IR 청킹(서식 우선)**
   - 청킹은 렌더링 전에 IR 텍스트에서 수행됩니다.
   - 인라인 서식은 청크 사이에서 분할되지 않으며, 범위는 청크별로 잘립니다.
3. **채널별 렌더링**
   - **Slack:** mrkdwn 토큰(bold/italic/strike/code), 링크는 `<url|label>`.
   - **Telegram:** HTML 태그(`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`).
   - **Signal:** 일반 텍스트 + `text-style` 범위; 레이블이 다른 경우 링크는 `label (url)`이 됩니다.

## IR 예시

입력 Markdown:

```markdown
Hello **world** - see [docs](https://docs.openclaw.ai).
```

IR(개략):

```json
{
  "text": "Hello world - see docs.",
  "styles": [{ "start": 6, "end": 11, "style": "bold" }],
  "links": [{ "start": 19, "end": 23, "href": "https://docs.openclaw.ai" }]
}
```

## 사용 위치

- Slack, Telegram, Signal 발신 어댑터는 IR에서 렌더링합니다.
- 다른 채널(WhatsApp, iMessage, Microsoft Teams, Discord)은 여전히 일반 텍스트 또는
  자체 서식 규칙을 사용하며, 활성화된 경우 청킹 전에 Markdown 표 변환을 적용합니다.

## 표 처리

Markdown 표는 채팅 클라이언트 전반에서 일관되게 지원되지 않습니다. 채널별(및 계정별)
변환을 제어하려면 `markdown.tables`를 사용하세요.

- `code`: 표를 코드 블록으로 렌더링합니다(대부분의 채널 기본값).
- `bullets`: 각 행을 글머리 기호 항목으로 변환합니다(Matrix, Signal, WhatsApp 기본값).
- `off`: 표 파싱과 변환을 비활성화합니다. 원시 표 텍스트가 그대로 전달됩니다.

설정 키:

```yaml
channels:
  discord:
    markdown:
      tables: code
    accounts:
      work:
        markdown:
          tables: off
```

## 청킹 규칙

- 청크 제한은 채널 어댑터/설정에서 가져오며 IR 텍스트에 적용됩니다.
- 코드 펜스는 채널이 올바르게 렌더링할 수 있도록 후행 줄바꿈이 있는 단일 블록으로 보존됩니다.
- 목록 접두사와 블록 인용 접두사는 IR 텍스트의 일부이므로 청킹이 접두사 중간에서
  분할되지 않습니다.
- 인라인 스타일(bold/italic/strike/inline-code/spoiler)은 청크 사이에서 절대 분할되지 않으며,
  렌더러가 각 청크 안에서 스타일을 다시 엽니다.

채널 전반의 청킹 동작에 대해 더 자세히 알아보려면
[스트리밍 + 청킹](/ko/concepts/streaming)을 참조하세요.

## 링크 정책

- **Slack:** `[label](url)` -> `<url|label>`; 원시 URL은 그대로 유지됩니다. 중복 링크 생성을
  피하기 위해 파싱 중 자동 링크는 비활성화됩니다.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>`(HTML 파싱 모드).
- **Signal:** `[label](url)` -> 레이블이 URL과 일치하지 않는 한 `label (url)`.

## 스포일러

스포일러 마커(`||spoiler||`)는 Signal에서만 파싱되며, 여기서는
SPOILER 스타일 범위에 매핑됩니다. 다른 채널은 이를 일반 텍스트로 처리합니다.

## 채널 포매터를 추가하거나 업데이트하는 방법

1. **한 번 파싱:** 채널에 적합한 옵션(자동 링크, 제목 스타일, 블록 인용 접두사)과 함께
   공유 `markdownToIR(...)` 헬퍼를 사용합니다.
2. **렌더링:** `renderMarkdownWithMarkers(...)`와 스타일 마커 맵(또는 Signal 스타일 범위)으로
   렌더러를 구현합니다.
3. **청킹:** 렌더링 전에 `chunkMarkdownIR(...)`를 호출하고 각 청크를 렌더링합니다.
4. **어댑터 연결:** 채널 발신 어댑터를 업데이트하여 새 청커와 렌더러를 사용하도록 합니다.
5. **테스트:** 형식 테스트를 추가하거나 업데이트하고, 채널이 청킹을 사용하는 경우 발신 전달 테스트도 추가합니다.

## 일반적인 주의 사항

- Slack 꺾쇠괄호 토큰(`<@U123>`, `<#C123>`, `<https://...>`)은
  보존해야 하며, 원시 HTML은 안전하게 이스케이프해야 합니다.
- Telegram HTML은 마크업이 깨지지 않도록 태그 외부 텍스트를 이스케이프해야 합니다.
- Signal 스타일 범위는 UTF-16 오프셋에 의존하므로 코드 포인트 오프셋을 사용하지 마세요.
- 펜스 코드 블록의 후행 줄바꿈을 보존하여 닫는 마커가 자체 줄에 오도록 합니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="스트리밍과 청킹" href="/ko/concepts/streaming" icon="bars-staggered">
    발신 스트리밍 동작, 청크 경계, 채널별 전달입니다.
  </Card>
  <Card title="시스템 프롬프트" href="/ko/concepts/system-prompt" icon="message-lines">
    삽입된 워크스페이스 파일을 포함해, 대화 전에 모델이 보는 내용입니다.
  </Card>
</CardGroup>
