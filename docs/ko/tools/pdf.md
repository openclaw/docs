---
read_when:
    - PDF를 에이전트에서 분석하려는 경우
    - 정확한 PDF 도구 매개변수와 제한이 필요합니다
    - 네이티브 PDF 모드와 추출 fallback을 디버깅하고 있습니다
summary: 기본 제공자 지원 및 추출 폴백으로 하나 이상의 PDF 문서 분석
title: PDF 도구
x-i18n:
    generated_at: "2026-06-27T18:15:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6cce4328a7457f30b8c64abdcfa94b6a5d5649c2bcdfde3187288b11a0e154b1
    source_path: tools/pdf.md
    workflow: 16
---

`pdf`는 하나 이상의 PDF 문서를 분석하고 텍스트를 반환합니다.

빠른 동작:

- Anthropic 및 Google 모델 제공자에는 네이티브 제공자 모드가 사용됩니다.
- 다른 제공자에는 추출 폴백 모드가 사용됩니다(먼저 텍스트를 추출한 다음, 필요할 때 페이지 이미지를 사용).
- 단일(`pdf`) 또는 다중(`pdfs`) 입력을 지원하며, 호출당 최대 10개의 PDF를 처리합니다.

## 사용 가능 여부

이 도구는 OpenClaw가 에이전트에 대해 PDF 지원 모델 구성을 확인할 수 있을 때만 등록됩니다.

1. `agents.defaults.pdfModel`
2. `agents.defaults.imageModel`로 폴백
3. 에이전트의 확인된 세션/기본 모델로 폴백
4. 네이티브 PDF 제공자가 인증 기반인 경우, 일반 이미지 폴백 후보보다 우선 사용

사용 가능한 모델을 확인할 수 없으면 `pdf` 도구는 노출되지 않습니다.

사용 가능 여부 참고:

- 폴백 체인은 인증을 고려합니다. 구성된 `provider/model`은
  OpenClaw가 실제로 에이전트에 대해 해당 제공자를 인증할 수 있을 때만 유효합니다.
- 현재 네이티브 PDF 제공자는 **Anthropic** 및 **Google**입니다.
- 확인된 세션/기본 제공자에 이미 구성된 비전/PDF
  모델이 있으면, PDF 도구는 인증 기반의 다른 제공자로 폴백하기 전에 해당 모델을 재사용합니다.

## 입력 참조

<ParamField path="pdf" type="string">
하나의 PDF 경로 또는 URL입니다.
</ParamField>

<ParamField path="pdfs" type="string[]">
여러 PDF 경로 또는 URL입니다. 총 최대 10개까지 가능합니다.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
분석 프롬프트입니다.
</ParamField>

<ParamField path="pages" type="string">
`1-5` 또는 `1,3,7-9`와 같은 페이지 필터입니다.
</ParamField>

<ParamField path="password" type="string">
추출 폴백 모드에서 암호화된 PDF에 사용할 비밀번호입니다.
</ParamField>

<ParamField path="model" type="string">
`provider/model` 형식의 선택적 모델 재정의입니다.
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF당 MB 단위 크기 제한입니다. 기본값은 `agents.defaults.pdfMaxBytesMb` 또는 `10`입니다.
</ParamField>

입력 참고:

- `pdf` 및 `pdfs`는 로드 전에 병합되고 중복 제거됩니다.
- PDF 입력이 제공되지 않으면 도구가 오류를 반환합니다.
- `pages`는 1부터 시작하는 페이지 번호로 파싱되며, 중복 제거, 정렬 후 구성된 최대 페이지 수로 제한됩니다.
- `password`는 요청의 모든 PDF에 적용되며 추출 폴백 모드에서만 사용됩니다.
- `maxBytesMb`의 기본값은 `agents.defaults.pdfMaxBytesMb` 또는 `10`입니다.

## 지원되는 PDF 참조

- 로컬 파일 경로(`~` 확장 포함)
- `file://` URL
- `http://` 및 `https://` URL
- `media://inbound/<id>`와 같은 OpenClaw 관리 인바운드 참조

참조 참고:

- 다른 URI 스킴(예: `ftp://`)은 `unsupported_pdf_reference`로 거부됩니다.
- 샌드박스 모드에서는 원격 `http(s)` URL이 거부됩니다.
- 작업공간 전용 파일 정책이 활성화된 경우, 허용된 루트 밖의 로컬 파일 경로는 거부됩니다.
- OpenClaw의 인바운드 미디어 저장소 아래의 관리형 인바운드 참조 및 재생된 경로는 작업공간 전용 파일 정책에서도 허용됩니다.

## 실행 모드

### 네이티브 제공자 모드

네이티브 모드는 제공자 `anthropic` 및 `google`에 사용됩니다.
이 도구는 원시 PDF 바이트를 제공자 API로 직접 전송합니다.

네이티브 모드 제한:

- `pages`는 지원되지 않습니다. 설정하면 도구가 오류를 반환합니다.
- `password`는 지원되지 않습니다. 암호화된 PDF를 분석하려면 비네이티브 모델을 사용하세요.
- 다중 PDF 입력이 지원됩니다. 각 PDF는 프롬프트 전에 네이티브 문서 블록 /
  인라인 PDF 파트로 전송됩니다.

### 추출 폴백 모드

폴백 모드는 비네이티브 제공자에 사용됩니다.

흐름:

1. 선택한 페이지에서 텍스트를 추출합니다(`agents.defaults.pdfMaxPages`까지, 기본값 `20`).
2. 추출된 텍스트 길이가 `200`자 미만이면 선택한 페이지를 PNG 이미지로 렌더링하여 포함합니다.
3. 추출된 콘텐츠와 프롬프트를 선택한 모델로 전송합니다.

폴백 세부 정보:

- 페이지 이미지 추출은 `4,000,000`의 픽셀 예산을 사용합니다.
- 암호화된 PDF는 최상위 `password` 매개변수로 열 수 있습니다.
- 대상 모델이 이미지 입력을 지원하지 않고 추출 가능한 텍스트가 없으면 도구가 오류를 반환합니다.
- 텍스트 추출은 성공했지만 이미지 추출에 텍스트 전용 모델의 비전이 필요한 경우,
  OpenClaw는 렌더링된 이미지를 제외하고 추출된 텍스트로 계속 진행합니다.
- 추출 폴백은 번들된 `document-extract` Plugin을 사용합니다. 이 Plugin은
  PDFium WebAssembly를 통해 텍스트 추출과 이미지 렌더링을 제공하는
  `clawpdf`를 소유합니다.

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

이 도구는 `content[0].text`에 텍스트를, `details`에 구조화된 메타데이터를 반환합니다.

일반적인 `details` 필드:

- `model`: 확인된 모델 참조(`provider/model`)
- `native`: 네이티브 제공자 모드이면 `true`, 폴백이면 `false`
- `attempts`: 성공 전 실패한 폴백 시도

경로 필드:

- 단일 PDF 입력: `details.pdf`
- 다중 PDF 입력: `details.pdfs[]`와 `pdf` 항목
- 샌드박스 경로 재작성 메타데이터(해당하는 경우): `rewrittenFrom`

## 오류 동작

- PDF 입력 누락: `pdf required: provide a path or URL to a PDF document`를 throw합니다
- PDF가 너무 많음: `details.error = "too_many_pdfs"`에 구조화된 오류를 반환합니다
- 지원되지 않는 참조 스킴: `details.error = "unsupported_pdf_reference"`를 반환합니다
- `pages`가 있는 네이티브 모드: 명확한 `pages is not supported with native PDF providers` 오류를 throw합니다

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

추출 폴백을 사용하는 암호화된 PDF:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "Summarize this contract"
}
```

## 관련 항목

- [도구 개요](/ko/tools) - 사용 가능한 모든 에이전트 도구
- [구성 참조](/ko/gateway/config-agents#agent-defaults) - pdfMaxBytesMb 및 pdfMaxPages 구성
