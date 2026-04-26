---
read_when:
    - 에이전트가 코드 또는 Markdown 편집 내용을 diff로 표시하도록 하려 합니다
    - canvas에서 바로 사용할 수 있는 뷰어 URL 또는 렌더링된 diff 파일이 필요합니다
    - 보안 기본값이 적용된 제어된 임시 diff 아티팩트가 필요합니다
sidebarTitle: Diffs
summary: 에이전트용 읽기 전용 diff 뷰어 및 파일 렌더러(선택적 Plugin 도구)
title: Diffs
x-i18n:
    generated_at: "2026-04-26T11:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8af098a294a4ba56e1a8df3b4f9650802fc53392634fee97b330f03b69e10781
    source_path: tools/diffs.md
    workflow: 15
---

`diffs`는 짧은 내장 시스템 안내와, 변경 내용을 읽기 전용 diff 아티팩트로 변환해 에이전트가 사용할 수 있게 해주는 보조 skill을 함께 제공하는 선택적 Plugin 도구입니다.

다음 두 입력 방식 중 하나를 받을 수 있습니다.

- `before` 및 `after` 텍스트
- 통합 `patch`

다음 결과를 반환할 수 있습니다.

- canvas 표시용 gateway 뷰어 URL
- 메시지 전달용 렌더링된 파일 경로(PNG 또는 PDF)
- 한 번의 호출로 두 출력 모두

활성화되면 이 Plugin은 시스템 프롬프트 공간에 간결한 사용 안내를 앞부분에 추가하고, 에이전트가 더 자세한 지침이 필요한 경우를 위해 상세한 skill도 노출합니다.

## 빠른 시작

<Steps>
  <Step title="Plugin 활성화">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="모드 선택">
    <Tabs>
      <Tab title="view">
        canvas 우선 흐름: 에이전트는 `mode: "view"`로 `diffs`를 호출하고 `canvas present`로 `details.viewerUrl`을 엽니다.
      </Tab>
      <Tab title="file">
        채팅 파일 전달: 에이전트는 `mode: "file"`로 `diffs`를 호출하고 `message`에서 `path` 또는 `filePath`를 사용해 `details.filePath`를 전송합니다.
      </Tab>
      <Tab title="both">
        결합 모드: 에이전트는 `mode: "both"`로 `diffs`를 호출해 한 번에 두 아티팩트를 모두 받습니다.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 내장 시스템 안내 비활성화

`diffs` 도구는 활성화된 상태로 유지하되 내장 시스템 프롬프트 안내만 비활성화하려면 `plugins.entries.diffs.hooks.allowPromptInjection`을 `false`로 설정하세요.

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

이렇게 하면 Plugin, 도구, 보조 skill은 계속 사용할 수 있는 상태로 유지하면서 diffs Plugin의 `before_prompt_build` hook만 차단합니다.

안내와 도구를 모두 비활성화하려면 대신 Plugin 자체를 비활성화하세요.

## 일반적인 에이전트 워크플로

<Steps>
  <Step title="diffs 호출">
    에이전트가 입력과 함께 `diffs` 도구를 호출합니다.
  </Step>
  <Step title="details 읽기">
    에이전트가 응답에서 `details` 필드를 읽습니다.
  </Step>
  <Step title="표시">
    에이전트는 `canvas present`로 `details.viewerUrl`을 열거나, `message`에서 `path` 또는 `filePath`를 사용해 `details.filePath`를 보내거나, 둘 다 수행합니다.
  </Step>
</Steps>

## 입력 예시

<Tabs>
  <Tab title="Before and after">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## 도구 입력 참조

명시되지 않은 경우를 제외하고 모든 필드는 선택 사항입니다.

<ParamField path="before" type="string">
  원본 텍스트. `patch`가 생략된 경우 `after`와 함께 필수입니다.
</ParamField>
<ParamField path="after" type="string">
  업데이트된 텍스트. `patch`가 생략된 경우 `before`와 함께 필수입니다.
</ParamField>
<ParamField path="patch" type="string">
  통합 diff 텍스트. `before` 및 `after`와 상호 배타적입니다.
</ParamField>
<ParamField path="path" type="string">
  before/after 모드에서 표시할 파일명입니다.
</ParamField>
<ParamField path="lang" type="string">
  before/after 모드에서 사용할 언어 재정의 힌트입니다. 알 수 없는 값은 일반 텍스트로 대체됩니다.
</ParamField>
<ParamField path="title" type="string">
  뷰어 제목 재정의입니다.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  출력 모드입니다. 기본값은 Plugin 기본값 `defaults.mode`입니다. 사용 중단된 별칭: `"image"`는 `"file"`처럼 동작하며 하위 호환성을 위해 계속 허용됩니다.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  뷰어 테마입니다. 기본값은 Plugin 기본값 `defaults.theme`입니다.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  diff 레이아웃입니다. 기본값은 Plugin 기본값 `defaults.layout`입니다.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  전체 컨텍스트를 사용할 수 있을 때 변경되지 않은 섹션을 확장합니다. 호출별 옵션만 지원하며(Plugin 기본값 key 아님)입니다.
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  렌더링된 파일 형식입니다. 기본값은 Plugin 기본값 `defaults.fileFormat`입니다.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG 또는 PDF 렌더링용 품질 프리셋입니다.
</ParamField>
<ParamField path="fileScale" type="number">
  디바이스 배율 재정의(`1`-`4`)입니다.
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  최대 렌더링 너비(CSS 픽셀, `640`-`2400`)입니다.
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  뷰어 및 독립 파일 출력용 아티팩트 TTL(초)입니다. 최대 21600입니다.
</ParamField>
<ParamField path="baseUrl" type="string">
  뷰어 URL origin 재정의입니다. Plugin의 `viewerBaseUrl`을 재정의합니다. `http` 또는 `https`여야 하며 query/hash는 허용되지 않습니다.
</ParamField>

<AccordionGroup>
  <Accordion title="레거시 입력 별칭">
    하위 호환성을 위해 계속 허용됩니다.

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="검증 및 제한">
    - `before`와 `after`는 각각 최대 512 KiB입니다.
    - `patch`는 최대 2 MiB입니다.
    - `path`는 최대 2048바이트입니다.
    - `lang`는 최대 128바이트입니다.
    - `title`은 최대 1024바이트입니다.
    - patch 복잡도 상한: 최대 128개 파일, 총 120000줄.
    - `patch`와 `before` 또는 `after`를 함께 사용하면 거부됩니다.
    - 렌더링된 파일 안전 제한(PNG와 PDF 모두 적용):
      - `fileQuality: "standard"`: 최대 8 MP(렌더링 픽셀 8,000,000개).
      - `fileQuality: "hq"`: 최대 14 MP(렌더링 픽셀 14,000,000개).
      - `fileQuality: "print"`: 최대 24 MP(렌더링 픽셀 24,000,000개).
      - PDF는 최대 50페이지 제한도 있습니다.
  </Accordion>
</AccordionGroup>

## 출력 details 계약

도구는 `details` 아래에 구조화된 메타데이터를 반환합니다.

<AccordionGroup>
  <Accordion title="뷰어 필드">
    뷰어를 생성하는 모드에서 공통으로 반환되는 필드:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (사용 가능한 경우 `agentId`, `sessionId`, `messageChannel`, `agentAccountId`)

  </Accordion>
  <Accordion title="파일 필드">
    PNG 또는 PDF가 렌더링될 때 반환되는 파일 필드:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (`filePath`와 동일한 값, message 도구 호환용)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="호환성 별칭">
    기존 호출자를 위해 함께 반환되는 항목:

    - `format` (`fileFormat`과 동일한 값)
    - `imagePath` (`filePath`와 동일한 값)
    - `imageBytes` (`fileBytes`와 동일한 값)
    - `imageQuality` (`fileQuality`와 동일한 값)
    - `imageScale` (`fileScale`와 동일한 값)
    - `imageMaxWidth` (`fileMaxWidth`와 동일한 값)

  </Accordion>
</AccordionGroup>

모드 동작 요약:

| 모드     | 반환 내용                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | 뷰어 필드만 반환됩니다.                                                                                                    |
| `"file"` | 파일 필드만 반환되며, 뷰어 아티팩트는 생성되지 않습니다.                                                                                  |
| `"both"` | 뷰어 필드와 파일 필드를 함께 반환합니다. 파일 렌더링이 실패하더라도 `fileError` 및 `imageError` 별칭과 함께 뷰어는 계속 반환됩니다. |

## 축소된 변경 없음 섹션

- 뷰어는 `N unmodified lines`와 같은 행을 표시할 수 있습니다.
- 해당 행의 확장 컨트롤은 조건부이며 모든 입력 종류에서 보장되지는 않습니다.
- 렌더링된 diff에 확장 가능한 컨텍스트 데이터가 있을 때 확장 컨트롤이 표시되며, 이는 일반적으로 before/after 입력에서 흔합니다.
- 많은 통합 patch 입력에서는 생략된 컨텍스트 본문이 파싱된 patch hunk에 없으므로, 확장 컨트롤 없이 행만 나타날 수 있습니다. 이는 예상된 동작입니다.
- `expandUnchanged`는 확장 가능한 컨텍스트가 존재할 때만 적용됩니다.

## Plugin 기본값

Plugin 전체 기본값은 `~/.openclaw/openclaw.json`에서 설정합니다.

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

지원되는 기본값:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

명시적인 도구 매개변수는 이 기본값들을 재정의합니다.

### 영구 뷰어 URL 구성

<ParamField path="viewerBaseUrl" type="string">
  도구 호출에서 `baseUrl`을 전달하지 않을 때 반환되는 뷰어 링크에 사용하는 Plugin 소유 fallback입니다. `http` 또는 `https`여야 하며 query/hash는 허용되지 않습니다.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## 보안 구성

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: loopback이 아닌 요청은 뷰어 라우트에서 거부됩니다. `true`: 토큰화된 경로가 유효하면 원격 뷰어가 허용됩니다.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## 아티팩트 수명 주기 및 저장소

- 아티팩트는 temp 하위 폴더 `$TMPDIR/openclaw-diffs` 아래에 저장됩니다.
- 뷰어 아티팩트 메타데이터에는 다음이 포함됩니다.
  - 임의의 아티팩트 ID(20자 16진수)
  - 임의의 토큰(48자 16진수)
  - `createdAt` 및 `expiresAt`
  - 저장된 `viewer.html` 경로
- 아티팩트 TTL은 지정하지 않으면 기본 30분입니다.
- 허용되는 최대 뷰어 TTL은 6시간입니다.
- 정리는 아티팩트 생성 후 기회가 있을 때 실행됩니다.
- 만료된 아티팩트는 삭제됩니다.
- 메타데이터가 없을 때 fallback 정리는 24시간보다 오래된 오래된 폴더를 제거합니다.

## 뷰어 URL 및 네트워크 동작

뷰어 라우트:

- `/plugins/diffs/view/{artifactId}/{token}`

뷰어 에셋:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

뷰어 문서는 해당 에셋을 뷰어 URL을 기준으로 상대 경로로 해석하므로, 선택적 `baseUrl` 경로 접두사는 에셋 요청에서도 유지됩니다.

URL 구성 동작:

- 도구 호출의 `baseUrl`이 제공되면 엄격한 검증 후 이를 사용합니다.
- 그렇지 않고 Plugin `viewerBaseUrl`이 구성되어 있으면 그것을 사용합니다.
- 둘 다 없으면 뷰어 URL은 기본적으로 loopback `127.0.0.1`을 사용합니다.
- gateway 바인드 모드가 `custom`이고 `gateway.customBindHost`가 설정되어 있으면 해당 호스트를 사용합니다.

`baseUrl` 규칙:

- `http://` 또는 `https://`여야 합니다.
- Query와 hash는 거부됩니다.
- origin과 선택적 기본 경로만 허용됩니다.

## 보안 모델

<AccordionGroup>
  <Accordion title="뷰어 강화">
    - 기본적으로 loopback 전용입니다.
    - 엄격한 ID 및 토큰 검증이 적용된 토큰화된 뷰어 경로를 사용합니다.
    - 뷰어 응답 CSP:
      - `default-src 'none'`
      - 스크립트와 에셋은 self에서만 허용
      - 외부 `connect-src` 없음
    - 원격 액세스가 활성화된 경우 원격 실패 요청 제한:
      - 60초당 실패 40회
      - 60초 잠금 (`429 Too Many Requests`)
  </Accordion>
  <Accordion title="파일 렌더링 강화">
    - 스크린샷 브라우저 요청 라우팅은 기본적으로 거부됩니다.
    - `http://127.0.0.1/plugins/diffs/assets/*`의 로컬 뷰어 에셋만 허용됩니다.
    - 외부 네트워크 요청은 차단됩니다.
  </Accordion>
</AccordionGroup>

## 파일 모드의 브라우저 요구 사항

`mode: "file"` 및 `mode: "both"`에는 Chromium 호환 브라우저가 필요합니다.

확인 순서:

<Steps>
  <Step title="구성">
    OpenClaw 구성의 `browser.executablePath`.
  </Step>
  <Step title="환경 변수">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
  </Step>
  <Step title="플랫폼 fallback">
    플랫폼 명령/경로 검색 fallback.
  </Step>
</Steps>

일반적인 실패 메시지:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge 또는 Brave를 설치하거나, 위의 실행 파일 경로 옵션 중 하나를 설정하여 해결하세요.

## 문제 해결

<AccordionGroup>
  <Accordion title="입력 검증 오류">
    - `Provide patch or both before and after text.` — `before`와 `after`를 모두 포함하거나 `patch`를 제공하세요.
    - `Provide either patch or before/after input, not both.` — 입력 모드를 섞어 사용하지 마세요.
    - `Invalid baseUrl: ...` — query/hash 없이 선택적 경로가 포함된 `http(s)` origin을 사용하세요.
    - `{field} exceeds maximum size (...)` — 페이로드 크기를 줄이세요.
    - 큰 patch 거부 — patch 파일 수 또는 전체 줄 수를 줄이세요.
  </Accordion>
  <Accordion title="뷰어 접근성">
    - 뷰어 URL은 기본적으로 `127.0.0.1`로 확인됩니다.
    - 원격 액세스 시나리오에서는 다음 중 하나를 사용하세요.
      - Plugin `viewerBaseUrl` 설정
      - 도구 호출마다 `baseUrl` 전달
      - `gateway.bind=custom` 및 `gateway.customBindHost` 사용
    - `gateway.trustedProxies`에 동일 호스트 프록시용 loopback(예: Tailscale Serve)이 포함되어 있으면, 전달된 client-IP 헤더가 없는 원시 loopback 뷰어 요청은 설계상 fail closed됩니다.
    - 이 프록시 토폴로지에서는:
      - 첨부 파일만 필요하다면 `mode: "file"` 또는 `mode: "both"`를 우선 사용하거나
      - 공유 가능한 뷰어 URL이 필요하다면 `security.allowRemoteViewer`를 의도적으로 활성화하고 Plugin `viewerBaseUrl`을 설정하거나 프록시/공개 `baseUrl`을 전달하세요.
    - 외부 뷰어 액세스가 실제로 필요한 경우에만 `security.allowRemoteViewer`를 활성화하세요.
  </Accordion>
  <Accordion title="변경되지 않은 줄 행에 확장 버튼이 없음">
    patch 입력에서 patch가 확장 가능한 컨텍스트를 포함하지 않으면 이런 현상이 발생할 수 있습니다. 이는 예상된 동작이며 뷰어 실패를 의미하지 않습니다.
  </Accordion>
  <Accordion title="아티팩트를 찾을 수 없음">
    - TTL 만료로 아티팩트가 만료되었습니다.
    - 토큰 또는 경로가 변경되었습니다.
    - 정리 과정에서 오래된 데이터가 제거되었습니다.
  </Accordion>
</AccordionGroup>

## 운영 가이드

- canvas에서 로컬 대화형 검토를 할 때는 `mode: "view"`를 권장합니다.
- 첨부 파일이 필요한 외부 채팅 채널에는 `mode: "file"`을 권장합니다.
- 배포 환경에 원격 뷰어 URL이 필요하지 않다면 `allowRemoteViewer`를 비활성화 상태로 유지하세요.
- 민감한 diff에는 명시적으로 짧은 `ttlSeconds`를 설정하세요.
- 필요하지 않다면 diff 입력에 시크릿을 포함하지 마세요.
- 채널이 이미지를 강하게 압축하는 경우(예: Telegram 또는 WhatsApp) PDF 출력(`fileFormat: "pdf"`)을 권장합니다.

<Note>
Diff 렌더링 엔진은 [Diffs](https://diffs.com) 기반입니다.
</Note>

## 관련 항목

- [Browser](/ko/tools/browser)
- [Plugins](/ko/tools/plugin)
- [도구 개요](/ko/tools)
