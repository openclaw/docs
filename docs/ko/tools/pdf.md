---
read_when:
    - 에이전트의 PDF를 분석하려고 합니다
    - 정확한 PDF 도구 매개변수와 제한 사항이 필요합니다
    - 네이티브 PDF 모드와 추출 폴백을 디버깅하고 있습니다
summary: 네이티브 제공자 지원 및 추출 폴백을 사용하여 하나 이상의 PDF 문서 분석
title: PDF 도구
x-i18n:
    generated_at: "2026-07-12T15:50:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 54bde94a2b70fd209c70c13a1e75dc81c6cbebca7f6d56776bf37fa62cd78254
    source_path: tools/pdf.md
    workflow: 16
---

`pdf`는 하나 이상의 PDF 문서를 분석하고 텍스트를 반환합니다. Anthropic 및 Google 모델에서는 네이티브 문서 입력을 사용하며, 그 외 모든 제공자에서는 텍스트/이미지 추출 방식으로 대체합니다.

## 사용 가능 조건

이 도구는 OpenClaw가 에이전트에 사용할 PDF 지원 모델을 결정할 수 있을 때만 등록됩니다. 결정 순서는 다음과 같습니다.

1. `agents.defaults.pdfModel`(명시적인 기본 모델/대체 모델)
2. `agents.defaults.imageModel`(명시적인 기본 모델/대체 모델)
3. 제공자가 네이티브 PDF 입력을 지원하거나(Anthropic, Google) 비전 모델이 이미 구성된 경우, 에이전트에 대해 결정된 세션/기본 모델
4. 사용 가능한 인증이 있는 이미지/비전 지원 제공자를 자동 감지하며, 네이티브 PDF 제공자를 우선함

모든 대체 후보는 사용 전에 인증 여부를 확인하므로, 구성된 `provider/model`은 OpenClaw가 에이전트에 대해 해당 제공자를 인증할 수 있는 경우에만 유효합니다. 사용 가능한 모델을 결정할 수 없으면 `pdf` 도구는 노출되지 않습니다.

## 입력 참조

<ParamField path="pdf" type="string">
PDF 경로 또는 URL 하나입니다.
</ParamField>

<ParamField path="pdfs" type="string[]">
여러 PDF 경로 또는 URL이며, 총 10개까지 지정할 수 있습니다.
</ParamField>

<ParamField path="prompt" type="string" default="Analyze this PDF document.">
분석 프롬프트입니다.
</ParamField>

<ParamField path="pages" type="string">
`1-5` 또는 `1,3,7-9`와 같은 페이지 필터입니다. 네이티브 제공자 모드에서는 지원되지 않습니다.
</ParamField>

<ParamField path="password" type="string">
암호화된 PDF의 비밀번호입니다. 요청의 모든 PDF에 적용되며, 추출 대체 모드에서만 사용됩니다.
</ParamField>

<ParamField path="model" type="string">
`provider/model` 형식의 선택적 모델 재정의입니다.
</ParamField>

<ParamField path="maxBytesMb" type="number">
PDF당 MB 단위 크기 제한입니다. 기본값은 `agents.defaults.pdfMaxBytesMb`이며, 설정하지 않은 경우 `10`입니다.
</ParamField>

참고:

- `pdf`와 `pdfs`는 로드하기 전에 병합하고 중복을 제거하며, 최소 하나는 필수입니다.
- `pages`는 1부터 시작하는 페이지 번호로 파싱되고, 중복 제거 및 정렬 후 `agents.defaults.pdfMaxPages`(기본값 `20`) 범위로 제한됩니다. 범위 내 페이지와 하나도 일치하지 않는 범위는 모델 호출 전에 오류가 발생합니다.

## 지원되는 PDF 참조

- 로컬 파일 경로(`~` 확장 포함)
- `file://` URL
- `http://` 및 `https://` URL
- `media://inbound/<id>`와 같은 OpenClaw 관리 인바운드 참조

그 외 URI 스킴(예: `ftp://`)은 `details.error = "unsupported_pdf_reference"`를 반환합니다. 도구가 샌드박스에서 실행될 때 원격 `http(s)` URL은 거부됩니다. 작업 공간 전용 파일 정책이 활성화된 경우 허용된 루트 외부의 로컬 경로는 거부되지만, OpenClaw의 인바운드 미디어 저장소 아래에 있는 관리형 인바운드 참조와 재생된 경로는 계속 허용됩니다.

## 실행 모드

### 네이티브 제공자 모드

제공자 `anthropic` 및 `google`에 사용됩니다(현재 네이티브 PDF 문서 지원을 선언하는 유일한 제공자). 원시 PDF 바이트는 파일별 네이티브 문서/인라인 PDF 부분으로 제공자 API에 직접 전달됩니다.

제한 사항:

- `pages`는 지원되지 않습니다. 설정하면 도구에서 `pages is not supported with native PDF providers` 오류가 발생합니다.
- `password`는 지원되지 않습니다. 설정하면 도구에서 `password is not supported with native PDF providers` 오류가 발생합니다. 암호화된 PDF에는 비네이티브 모델을 사용하십시오.

### 추출 대체 모드

그 외 모든 제공자에 사용됩니다.

1. 텍스트 및 이미지 추출에 `clawpdf` 패키지(PDFium WebAssembly)를 사용하는 번들 `document-extract` Plugin을 통해 선택한 페이지에서 텍스트를 추출합니다(`agents.defaults.pdfMaxPages`까지, 기본값 `20`).
2. 추출된 텍스트가 `200`자보다 짧으면 동일한 페이지를 PNG 이미지로 렌더링합니다. 렌더링 예산은 이미지가 필요한 모든 페이지에 공유되는 총 `4,000,000`픽셀이며(페이지별이 아니라 남은 페이지마다 비례하여 할당), 이미 충분한 텍스트가 있는 텍스트 페이지는 렌더링을 완전히 건너뜁니다.
3. 추출된 텍스트(및 렌더링된 이미지가 있는 경우 해당 이미지)와 프롬프트를 선택한 모델에 전송합니다.

세부 정보:

- 암호화된 PDF는 최상위 `password` 매개변수로 엽니다.
- 모델이 이미지 입력을 지원하지 않고 추출할 수 있는 텍스트도 없으면 도구에서 오류가 발생합니다.
- 이미지 렌더링에 실패하면 OpenClaw는 이미지를 제외하고 추출된 텍스트로 계속 진행합니다.
- 대상 모델이 텍스트 전용이고 추출 과정에서 이미지가 생성된 경우, OpenClaw는 이미지를 제외하고 텍스트만 전송합니다.

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

| 키                              | 기본값     | 의미                                                                                     |
| ------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| `agents.defaults.pdfModel`      | 설정 안 됨 | 명시적인 기본/대체 PDF 모델이며, `imageModel`, 그다음 세션 모델 순으로 대체합니다.       |
| `agents.defaults.pdfMaxBytesMb` | `10`       | PDF당 MB 단위 크기 제한입니다.                                                           |
| `agents.defaults.pdfMaxPages`   | `20`       | PDF당 처리되는 최대 페이지 수입니다.                                                     |

전체 필드 세부 정보는 [구성 참조](/ko/gateway/config-agents#agent-defaults)를 확인하십시오.

## 출력 세부 정보

도구는 `content[0].text`에 텍스트를 반환하고 `details`에 구조화된 메타데이터를 반환합니다.

일반적인 `details` 필드:

- `model`: 결정된 모델 참조(`provider/model`)
- `native`: 네이티브 제공자 모드이면 `true`, 대체 모드이면 `false`
- `attempts`: 성공 전에 실패한 대체 시도

경로 필드:

- 단일 PDF 입력: `details.pdf`
- 여러 PDF 입력: `pdf` 항목이 포함된 `details.pdfs[]`
- 샌드박스 경로 재작성 메타데이터(해당하는 경우): `rewrittenFrom`

## 오류 동작

| 조건                              | 결과                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| PDF 입력 없음                     | `pdf required: provide a path or URL to a PDF document` 오류 발생 |
| PDF가 10개보다 많음               | `details.error = "too_many_pdfs"`                              |
| 지원되지 않는 참조 스킴           | `details.error = "unsupported_pdf_reference"`                  |
| 네이티브 제공자에 `pages` 사용    | `pages is not supported with native PDF providers` 오류 발생   |
| 네이티브 제공자에 `password` 사용 | `password is not supported with native PDF providers` 오류 발생 |

## 예시

단일 PDF:

```json
{
  "pdf": "/tmp/report.pdf",
  "prompt": "이 보고서를 5개의 글머리 기호로 요약하십시오"
}
```

여러 PDF:

```json
{
  "pdfs": ["/tmp/q1.pdf", "/tmp/q2.pdf"],
  "prompt": "두 문서의 위험 및 일정 변경 사항을 비교하십시오"
}
```

페이지 필터가 적용된 대체 모델:

```json
{
  "pdf": "https://example.com/report.pdf",
  "pages": "1-3,7",
  "model": "openai/gpt-5.4-mini",
  "prompt": "고객에게 영향을 미치는 인시던트만 추출하십시오"
}
```

추출 대체 모드를 사용하는 암호화된 PDF:

```json
{
  "pdf": "/tmp/locked.pdf",
  "password": "example-password",
  "model": "openai/gpt-5.4-mini",
  "prompt": "이 계약서를 요약하십시오"
}
```

## 관련 항목

- [도구 개요](/ko/tools) - 사용 가능한 모든 에이전트 도구
- [구성 참조](/ko/gateway/config-agents#agent-defaults) - pdfMaxBytesMb 및 pdfMaxPages 구성
