---
read_when:
    - 에이전트에서 PDF를 분석하려고 합니다.
    - 정확한 PDF 도구 파라미터와 제한 사항이 필요합니다.
    - 네이티브 PDF 모드와 추출 fallback을 디버깅하고 있습니다.
summary: 네이티브 provider 지원 및 추출 fallback으로 하나 이상의 PDF 문서를 분석합니다
title: PDF 도구
x-i18n:
    generated_at: "2026-04-25T06:13:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89bbc675f2b87729e283659f9604724be7a827b50b11edc853a42c448bbaaf6e
    source_path: tools/pdf.md
    workflow: 15
---

`pdf`는 하나 이상의 PDF 문서를 분석하고 텍스트를 반환합니다.

빠른 동작 개요:

- Anthropic 및 Google 모델 provider에 대해 네이티브 provider 모드 사용.
- 다른 provider에 대해서는 extraction fallback 모드 사용(먼저 텍스트 추출, 필요 시 페이지 이미지 사용).
- 단일(`pdf`) 또는 다중(`pdfs`) 입력을 지원하며, 호출당 최대 10개의 PDF까지 지원합니다.

## 사용 가능 조건

이 도구는 OpenClaw가 에이전트에 대해 PDF 가능한 모델 config를 해석할 수 있을 때만 등록됩니다:

1. `agents.defaults.pdfModel`
2. fallback으로 `agents.defaults.imageModel`
3. fallback으로 에이전트의 해석된 session/default 모델
4. 네이티브 PDF provider가 auth 기반인 경우, 일반 이미지 fallback 후보보다 먼저 우선 선택

사용 가능한 모델을 해석할 수 없으면 `pdf` 도구는 노출되지 않습니다.

사용 가능성 참고:

- fallback 체인은 auth를 인식합니다. 구성된 `provider/model`도
  OpenClaw가 실제로 해당 provider에 대해 에이전트 인증을 할 수 있을 때만 유효합니다.
- 현재 네이티브 PDF provider는 **Anthropic**과 **Google**입니다.
- 해석된 session/default provider에 이미 구성된 vision/PDF
  모델이 있으면, PDF 도구는 다른 auth 기반 provider로 fallback하기 전에 이를 재사용합니다.

## 입력 참조

<ParamField path="pdf" type="string">
PDF 경로 또는 URL 하나.
</ParamField>

<ParamField path="pdfs" type="string[]">
PDF 경로 또는 URL 여러 개, 총 최대 10개.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
분석 프롬프트.
</ParamField>

<ParamField path="pages" type="string">
`1-5` 또는 `1,3,7-9` 같은 페이지 필터.
</ParamField>

<ParamField path="model" type="string">
`provider/model` 형식의 선택적 모델 override.
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF당 크기 제한(MB). 기본값은 `agents.defaults.pdfMaxBytesMb` 또는 `10`.
</ParamField>

입력 참고:

- `pdf`와 `pdfs`는 로드 전에 병합되고 deduplicate됩니다.
- PDF 입력이 제공되지 않으면 도구는 오류를 반환합니다.
- `pages`는 1부터 시작하는 페이지 번호로 파싱되며, deduplicate되고, 정렬되며, 구성된 최대 페이지 수로 clamp됩니다.
- `maxBytesMb` 기본값은 `agents.defaults.pdfMaxBytesMb` 또는 `10`입니다.

## 지원되는 PDF 참조

- 로컬 파일 경로(`~` 확장 포함)
- `file://` URL
- `http://` 및 `https://` URL
- `media://inbound/<id>` 같은 OpenClaw 관리 인바운드 ref

참조 참고:

- 다른 URI 스킴(예: `ftp://`)은 `unsupported_pdf_reference`로 거부됩니다.
- sandbox 모드에서는 원격 `http(s)` URL이 거부됩니다.
- workspace 전용 파일 정책이 활성화된 경우, 허용된 루트 밖의 로컬 파일 경로는 거부됩니다.
- OpenClaw의 인바운드 미디어 저장소 아래의 관리된 인바운드 ref 및 replay된 경로는 workspace 전용 파일 정책에서도 허용됩니다.

## 실행 모드

### 네이티브 provider 모드

네이티브 모드는 provider `anthropic` 및 `google`에 사용됩니다.
이 도구는 raw PDF 바이트를 provider API로 직접 전송합니다.

네이티브 모드 제한:

- `pages`는 지원되지 않습니다. 설정하면 도구는 오류를 반환합니다.
- 다중 PDF 입력은 지원되며, 각 PDF는 프롬프트 전에 네이티브 document block /
  inline PDF part로 전송됩니다.

### Extraction fallback 모드

fallback 모드는 네이티브가 아닌 provider에 사용됩니다.

흐름:

1. 선택된 페이지에서 텍스트를 추출합니다(`agents.defaults.pdfMaxPages`까지, 기본값 `20`).
2. 추출된 텍스트 길이가 `200`자 미만이면, 선택된 페이지를 PNG 이미지로 렌더링하여 포함합니다.
3. 추출된 콘텐츠와 프롬프트를 선택된 모델로 전송합니다.

fallback 세부 정보:

- 페이지 이미지 추출은 `4,000,000`의 픽셀 예산을 사용합니다.
- 대상 모델이 이미지 입력을 지원하지 않고 추출 가능한 텍스트도 없으면 도구는 오류를 반환합니다.
- 텍스트 추출은 성공했지만 이미지 추출에 텍스트 전용 모델에서
  vision이 필요하다면, OpenClaw는 렌더링된 이미지를 버리고
  추출된 텍스트만으로 계속 진행합니다.
- extraction fallback은 번들된 `document-extract` Plugin을 사용합니다. 이 Plugin이
  `pdfjs-dist`를 소유하며, `@napi-rs/canvas`는 이미지 렌더링 fallback을
  사용할 수 있을 때만 사용됩니다.

## 구성

```json5
{
  agents: {
    defaults: {
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
    },
  },
}
```

전체 필드 세부 정보는 [Configuration Reference](/ko/gateway/configuration-reference)를 참조하세요.

## 출력 세부 정보

이 도구는 `content[0].text`에 텍스트를, `details`에 구조화된 메타데이터를 반환합니다.

일반적인 `details` 필드:

- `model`: 해석된 모델 ref (`provider/model`)
- `native`: 네이티브 provider 모드이면 `true`, fallback이면 `false`
- `attempts`: 성공 전에 실패한 fallback 시도

경로 필드:

- 단일 PDF 입력: `details.pdf`
- 다중 PDF 입력: `details.pdfs[]`의 `pdf` 항목
- sandbox 경로 재작성 메타데이터(해당 시): `rewrittenFrom`

## 오류 동작

- PDF 입력 누락: `pdf required: provide a path or URL to a PDF document` 발생
- PDF가 너무 많음: `details.error = "too_many_pdfs"`에 구조화된 오류 반환
- 지원되지 않는 참조 스킴: `details.error = "unsupported_pdf_reference"` 반환
- `pages`가 있는 네이티브 모드: `pages is not supported with native PDF providers`라는 명확한 오류 발생

## 예시

단일 PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

다중 PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

페이지 필터링된 fallback 모델:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## 관련 항목

- [Tools Overview](/ko/tools) — 사용 가능한 모든 에이전트 도구
- [Configuration Reference](/ko/gateway/config-agents#agent-defaults) — pdfMaxBytesMb 및 pdfMaxPages 구성
