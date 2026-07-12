---
read_when:
    - 아웃바운드 채널의 마크다운 서식 또는 청킹을 변경하고 있습니다
    - 새 채널 포매터 또는 스타일 매핑을 추가하는 경우
    - 채널 전반의 서식 회귀를 디버깅하고 있습니다
summary: 아웃바운드 채널용 Markdown 서식 처리 파이프라인
title: Markdown 서식
x-i18n:
    generated_at: "2026-07-12T00:45:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f9a35fd9a6386068e1e3bec73ec6e692f49239b468f42dd737f919b1c6a88e41
    source_path: concepts/markdown-formatting.md
    workflow: 16
---

OpenClaw은 발신 Markdown을 채널별 출력으로 렌더링하기 전에 공유 중간 표현
(IR)으로 변환합니다. IR은 일반 텍스트와 스타일/링크 범위를 유지하므로 한 번의
파싱 단계로 모든 채널을 처리할 수 있으며, 청크 분할 시 범위 중간에서 서식이
나뉘지 않습니다.

## 파이프라인

1. **Markdown을 IR로 파싱** (`markdownToIR`) - 일반 텍스트와 스타일 범위
   (굵게, 기울임꼴, 취소선, 코드, 코드 블록, 스포일러, 인용문,
   제목 1~6) 및 링크 범위입니다. 오프셋은 UTF-16 코드 단위이므로 Signal 스타일
   범위가 해당 API와 직접 정렬됩니다. 표는 채널이 표 모드를 사용하도록
   설정된 경우에만 파싱됩니다.
2. **IR 청크 분할** (`chunkMarkdownIR` / `renderMarkdownIRChunksWithinLimit`)
   - 렌더링 전에 IR 텍스트를 분할하므로 인라인 스타일과
     링크가 경계를 가로질러 끊어지는 대신 청크별로 분할됩니다.
3. **채널별 렌더링** (`renderMarkdownWithMarkers`) - 스타일 마커 맵이
   범위를 채널의 네이티브 마크업으로 변환합니다.

| 채널                                                             | 렌더러                                                                               | 참고                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Slack                                                            | mrkdwn 토큰 (`*bold*`, `_italic_`, `` `code` ``, 코드 펜스)                          | 링크는 `<url\|label>`이 되며, 중복 링크를 방지하기 위해 파싱 중 자동 링크를 비활성화합니다 |
| Telegram                                                         | HTML 태그 (`<b>`, `<i>`, `<s>`, `<code>`, `<pre><code>`, `<a href>`, `<tg-spoiler>`) | `richMessages`가 켜져 있으면 리치 메시지 표와 제목(`<h1>`-`<h6>`)도 지원합니다           |
| Signal                                                           | 일반 텍스트 + `text-style` 범위                                                      | 레이블이 URL과 다르면 링크를 `label (url)`로 렌더링합니다                                |
| Discord, WhatsApp, iMessage, Microsoft Teams 및 기타 채널        | 일반 텍스트                                                                          | IR 기반 스타일링은 없으며, Markdown 표 변환은 여전히 `convertMarkdownTables`를 통해 실행됩니다 |

## IR 예시

입력 Markdown:
__OC_I18N_900000__
IR(개략도):
__OC_I18N_900001__
## 표 처리

`markdown.tables`는 채널별로, 선택적으로 계정별로 채널이 Markdown 표를
변환하는 방식을 제어합니다.

| 모드      | 동작                                                                                 |
| --------- | ------------------------------------------------------------------------------------ |
| `code`    | 코드 블록 안에 정렬된 ASCII 표로 렌더링합니다(대체 기본값)                           |
| `bullets` | 각 행을 `label: value` 글머리 기호 항목으로 변환합니다                               |
| `block`   | 전송 수단에서 지원하는 경우 네이티브 표를 유지하고, 그렇지 않으면 `code`로 대체합니다 |
| `off`     | 표 파싱을 비활성화하며, 원시 표 텍스트를 변경 없이 전달합니다                        |

채널별 Plugin 기본값: Signal, WhatsApp, Matrix의 기본값은
`bullets`이고, Mattermost의 기본값은 `off`이며, Telegram의 기본값은 `block`입니다
(계정에서 `richMessages`가 활성화되어 있지 않으면 `code`로 해석됨). 명시적인
Plugin 기본값이 없는 채널은 `code`를 대체 기본값으로 사용합니다.
__OC_I18N_900002__
## 청크 분할 규칙

- 청크 제한은 채널 어댑터/구성에서 가져오며 렌더링된 출력이 아니라
  IR 텍스트에 적용됩니다.
- 펜스로 둘러싸인 코드 블록은 채널이 닫는 펜스를 올바르게 렌더링할 수 있도록
  후행 줄 바꿈이 포함된 하나의 블록으로 유지됩니다.
- 목록 및 인용문 접두사는 IR 텍스트의 일부이므로 청크 분할 시
  접두사 중간에서 나뉘지 않습니다.
- 인라인 스타일은 청크 사이에서 절대 분할되지 않으며, 렌더러는 다음 청크의
  시작 부분에서 열린 스타일을 다시 엽니다.

채널 간 청크 경계 및 전달 동작은 [스트리밍 및 청크 분할](/concepts/streaming)을
참조하세요.

## 링크 정책

- **Slack:** `[label](url)` -> `<url|label>`이며, 단독 URL은 그대로 유지됩니다.
- **Telegram:** `[label](url)` -> `<a href="url">label</a>`입니다(HTML 파싱 모드).
- **Signal:** 레이블이 이미 URL과 일치하지 않는 한 `[label](url)` ->
  `label (url)`입니다.

## 스포일러

스포일러 마커(`||spoiler||`)는 Signal(`SPOILER` 스타일 범위에 매핑)과
Telegram(`<tg-spoiler>`에 매핑)에서 파싱됩니다. 다른 채널은
`||...||`을 일반 텍스트로 처리합니다.

## 채널 포매터 추가 또는 업데이트

1. 채널에 적합한 옵션(`autolink`, `headingStyle`, `blockquotePrefix`,
   `tableMode`)을 전달하여 `markdownToIR(...)`로 **한 번만 파싱**합니다.
2. 스타일 마커 맵과 함께 `renderMarkdownWithMarkers(...)`로 **렌더링**합니다
   (또는 Signal과 같은 전송 수단에는 사용자 지정 스타일 범위 로직을 사용합니다).
3. 각 청크를 렌더링하기 전에 `chunkMarkdownIR(...)` 또는
   `renderMarkdownIRChunksWithinLimit(...)`로 **청크를 분할**합니다.
4. 발신 전송 경로에서 새 청크 분할기와 렌더러를 호출하도록
   **어댑터를 연결**합니다.
5. 채널에서 청크를 분할하는 경우 형식 테스트와 발신 전달 테스트로
   **테스트**합니다.

## 흔히 발생하는 문제

- Slack 꺾쇠괄호 토큰(`<@U123>`, `<#C123>`, `<https://...>`)은
  이스케이프 처리 후에도 유지되어야 하며, 원시 HTML은 여전히 안전하게 이스케이프해야 합니다.
- Telegram HTML에서는 마크업이 손상되지 않도록 태그 외부의 텍스트를 이스케이프해야 합니다.
- Signal 스타일 범위는 코드 포인트 오프셋이 아닌 UTF-16 오프셋을 사용합니다.
- 닫는 마커가 독립된 줄에 위치하도록 펜스로 둘러싸인 코드 블록의
  후행 줄 바꿈을 유지하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="스트리밍 및 청크 분할" href="/ko/concepts/streaming" icon="bars-staggered">
    발신 스트리밍 동작, 청크 경계 및 채널별 전달 방식입니다.
  </Card>
  <Card title="시스템 프롬프트" href="/ko/concepts/system-prompt" icon="message-lines">
    삽입된 작업 공간 파일을 포함하여 대화 전에 모델에 표시되는 내용입니다.
  </Card>
</CardGroup>
