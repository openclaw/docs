---
read_when:
    - 에이전트를 통해 PDF를 분석하려는 경우
    - 정확한 PDF 도구 매개변수와 제한을 알아야 합니다
    - 네이티브 PDF 모드와 추출 폴백을 디버깅하고 있습니다
summary: 기본 제공자 지원 및 추출 대체 경로를 사용하여 하나 이상의 PDF 문서 분석
title: PDF 도구
x-i18n:
    generated_at: "2026-05-06T06:43:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: ac1cbbc363975d5571fe5b46b39e2d897e1b80b5859a1f44ef81050f55554444
    source_path: tools/pdf.md
    workflow: 16
---

`pdf`는 하나 이상의 PDF 문서를 분석하고 텍스트를 반환합니다.

빠른 동작:

- Anthropic 및 Google 모델 제공자에 대한 네이티브 제공자 모드.
- 다른 제공자에 대한 추출 폴백 모드(먼저 텍스트를 추출한 다음, 필요할 때 페이지 이미지를 사용).
- 단일(`pdf`) 또는 다중(`pdfs`) 입력을 지원하며, 호출당 최대 10개의 PDF를 지원합니다.

## 사용 가능 여부

이 도구는 OpenClaw가 에이전트에 대해 PDF를 처리할 수 있는 모델 구성을 확인할 수 있을 때만 등록됩니다.

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel`로 폴백
3. 에이전트의 확인된 세션/기본 모델로 폴백
4. 네이티브 PDF 제공자가 인증 기반인 경우, 일반 이미지 폴백 후보보다 우선 사용

사용 가능한 모델을 확인할 수 없으면 `pdf` 도구는 노출되지 않습니다.

사용 가능 여부 참고 사항:

- 폴백 체인은 인증을 고려합니다. 구성된 `provider/model`은
  OpenClaw가 에이전트에 대해 해당 제공자를 실제로 인증할 수 있을 때만 인정됩니다.
- 현재 네이티브 PDF 제공자는 **Anthropic** 및 **Google**입니다.
- 확인된 세션/기본 제공자에 이미 구성된 vision/PDF
  모델이 있으면, PDF 도구는 다른 인증 기반 제공자로 폴백하기 전에 이를 재사용합니다.

## 입력 참조

<ParamField path="pdf" type="string">
하나의 PDF 경로 또는 URL입니다.
</ParamField>

<ParamField path="pdfs" type="string[]">
여러 PDF 경로 또는 URL이며, 총 10개까지 가능합니다.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
분석 프롬프트입니다.
</ParamField>

<ParamField path="pages" type="string">
`1-5` 또는 `1,3,7-9` 같은 페이지 필터입니다.
</ParamField>

<ParamField path="model" type="string">
`provider/model` 형식의 선택적 모델 재정의입니다.
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF별 크기 제한(MB)입니다. 기본값은 `agents.defaults.pdfMaxBytesMb` 또는 `10`입니다.
</ParamField>

입력 참고 사항:

- `pdf`와 `pdfs`는 로드 전에 병합되고 중복 제거됩니다.
- PDF 입력이 제공되지 않으면 도구가 오류를 발생시킵니다.
- `pages`는 1부터 시작하는 페이지 번호로 파싱되고, 중복 제거, 정렬된 뒤 구성된 최대 페이지 수로 제한됩니다.
- `maxBytesMb`의 기본값은 `agents.defaults.pdfMaxBytesMb` 또는 `10`입니다.

## 지원되는 PDF 참조

- 로컬 파일 경로(`~` 확장 포함)
- `file://` URL
- `http://` 및 `https://` URL
- `media://inbound/<id>` 같은 OpenClaw 관리형 인바운드 참조

참조 참고 사항:

- 다른 URI 스킴(예: `ftp://`)은 `unsupported_pdf_reference`와 함께 거부됩니다.
- 샌드박스 모드에서는 원격 `http(s)` URL이 거부됩니다.
- 작업 공간 전용 파일 정책이 활성화된 경우, 허용된 루트 밖의 로컬 파일 경로는 거부됩니다.
- 관리형 인바운드 참조와 OpenClaw의 인바운드 미디어 저장소 아래에서 재생된 경로는 작업 공간 전용 파일 정책에서 허용됩니다.

## 실행 모드

### 네이티브 제공자 모드

네이티브 모드는 제공자 `anthropic` 및 `google`에 사용됩니다.
이 도구는 원시 PDF 바이트를 제공자 API로 직접 보냅니다.

네이티브 모드 제한:

- `pages`는 지원되지 않습니다. 설정하면 도구가 오류를 반환합니다.
- 다중 PDF 입력이 지원됩니다. 각 PDF는 프롬프트 앞에 네이티브 문서 블록 /
  인라인 PDF 파트로 전송됩니다.

### 추출 폴백 모드

폴백 모드는 네이티브가 아닌 제공자에 사용됩니다.

흐름:

1. 선택한 페이지에서 텍스트를 추출합니다(최대 `agents.defaults.pdfMaxPages`, 기본값 `20`).
2. 추출된 텍스트 길이가 `200`자 미만이면 선택한 페이지를 PNG 이미지로 렌더링하고 포함합니다.
3. 추출된 콘텐츠와 프롬프트를 선택한 모델로 보냅니다.

폴백 세부 정보:

- 페이지 이미지 추출은 `4,000,000`의 픽셀 예산을 사용합니다.
- 대상 모델이 이미지 입력을 지원하지 않고 추출 가능한 텍스트가 없으면 도구가 오류를 발생시킵니다.
- 텍스트 추출은 성공했지만 이미지 추출에 텍스트 전용 모델에서 vision이 필요한 경우,
  OpenClaw는 렌더링된 이미지를 제외하고 추출된 텍스트로 계속 진행합니다.
- 추출 폴백은 번들된 `document-extract` Plugin을 사용합니다. 이 Plugin은
  `pdfjs-dist`를 소유하며, `@napi-rs/canvas`는 이미지 렌더링 폴백이
  사용 가능할 때만 사용됩니다.

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

전체 필드 세부 정보는 [구성 참조](/ko/gateway/configuration-reference)를 참조하세요.

## 출력 세부 정보

도구는 `content[0].text`에 텍스트를 반환하고 `details`에 구조화된 메타데이터를 반환합니다.

일반적인 `details` 필드:

- `model`: 확인된 모델 참조(`provider/model`)
- `native`: 네이티브 제공자 모드는 `true`, 폴백은 `false`
- `attempts`: 성공 전에 실패한 폴백 시도

경로 필드:

- 단일 PDF 입력: `details.pdf`
- 여러 PDF 입력: `details.pdfs[]`와 `pdf` 항목
- 샌드박스 경로 재작성 메타데이터(해당하는 경우): `rewrittenFrom`

## 오류 동작

- PDF 입력 누락: `pdf required: provide a path or URL to a PDF document` 발생
- PDF가 너무 많음: `details.error = "too_many_pdfs"`에 구조화된 오류 반환
- 지원되지 않는 참조 스킴: `details.error = "unsupported_pdf_reference"` 반환
- `pages`가 있는 네이티브 모드: 명확한 `pages is not supported with native PDF providers` 오류 발생

## 예시

단일 PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "Summarize this report in 5 bullets"
}
```

여러 PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "Compare risks and timeline changes across both documents"
}
```

페이지 필터가 적용된 폴백 모델:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Extract only customer-impacting incidents"
}
```

## 관련 항목

- [도구 개요](/ko/tools) - 사용 가능한 모든 에이전트 도구
- [구성 참조](/ko/gateway/config-agents#agent-defaults) - pdfMaxBytesMb 및 pdfMaxPages 구성
