---
read_when:
    - 에이전트가 코드 또는 Markdown 편집 내용을 diff로 표시하도록 하려는 경우
    - 캔버스에서 바로 사용할 수 있는 뷰어 URL 또는 렌더링된 diff 파일이 필요합니다
    - 보안 기본값이 적용된 제어 가능한 임시 diff 아티팩트가 필요합니다
sidebarTitle: Diffs
summary: 에이전트용 읽기 전용 차이점 뷰어 및 파일 렌더러(선택적 Plugin 도구)
title: 차이점
x-i18n:
    generated_at: "2026-05-02T21:14:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs`는 짧은 내장 시스템 가이드와 동반 Skills를 제공하는 선택적 Plugin 도구로, 변경 내용을 에이전트용 읽기 전용 diff 아티팩트로 변환합니다.

다음 중 하나를 입력받을 수 있습니다.

- `before` 및 `after` 텍스트
- 통합 `patch`

다음을 반환할 수 있습니다.

- 캔버스 표시용 Gateway 뷰어 URL
- 메시지 전달용 렌더링된 파일 경로(PNG 또는 PDF)
- 한 번의 호출에서 두 출력 모두

활성화하면 이 Plugin은 시스템 프롬프트 공간에 간결한 사용 가이드를 앞에 추가하고, 에이전트에 더 자세한 지침이 필요한 경우를 위한 상세 Skills도 노출합니다.

## 빠른 시작

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        캔버스 우선 흐름: 에이전트는 `mode: "view"`로 `diffs`를 호출하고 `canvas present`로 `details.viewerUrl`을 엽니다.
      </Tab>
      <Tab title="file">
        채팅 파일 전달: 에이전트는 `mode: "file"`로 `diffs`를 호출하고 `path` 또는 `filePath`를 사용해 `message`로 `details.filePath`를 보냅니다.
      </Tab>
      <Tab title="both">
        결합 방식: 에이전트는 한 번의 호출에서 두 아티팩트를 모두 얻기 위해 `mode: "both"`로 `diffs`를 호출합니다.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 내장 시스템 가이드 비활성화

`diffs` 도구는 활성화된 상태로 유지하되 내장 시스템 프롬프트 가이드를 비활성화하려면 `plugins.entries.diffs.hooks.allowPromptInjection`을 `false`로 설정합니다.

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

이렇게 하면 diffs Plugin의 `before_prompt_build` 훅은 차단되지만 Plugin, 도구, 동반 Skills는 계속 사용할 수 있습니다.

가이드와 도구를 모두 비활성화하려면 대신 Plugin을 비활성화하세요.

## 일반적인 에이전트 워크플로

<Steps>
  <Step title="Call diffs">
    에이전트가 입력과 함께 `diffs` 도구를 호출합니다.
  </Step>
  <Step title="Read details">
    에이전트가 응답에서 `details` 필드를 읽습니다.
  </Step>
  <Step title="Present">
    에이전트는 `canvas present`로 `details.viewerUrl`을 열거나, `path` 또는 `filePath`를 사용해 `message`로 `details.filePath`를 보내거나, 둘 다 수행합니다.
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

별도 표시가 없는 한 모든 필드는 선택 사항입니다.

<ParamField path="before" type="string">
  원본 텍스트입니다. `patch`가 생략된 경우 `after`와 함께 필요합니다.
</ParamField>
<ParamField path="after" type="string">
  업데이트된 텍스트입니다. `patch`가 생략된 경우 `before`와 함께 필요합니다.
</ParamField>
<ParamField path="patch" type="string">
  통합 diff 텍스트입니다. `before` 및 `after`와 함께 사용할 수 없습니다.
</ParamField>
<ParamField path="path" type="string">
  before/after 모드에서 표시할 파일 이름입니다.
</ParamField>
<ParamField path="lang" type="string">
  before/after 모드의 언어 오버라이드 힌트입니다. 알 수 없는 값은 일반 텍스트로 대체됩니다.
</ParamField>
<ParamField path="title" type="string">
  뷰어 제목 오버라이드입니다.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  출력 모드입니다. 기본값은 Plugin 기본값 `defaults.mode`입니다. 지원 중단된 별칭: `"image"`는 `"file"`처럼 동작하며 이전 버전과의 호환성을 위해 여전히 허용됩니다.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  뷰어 테마입니다. 기본값은 Plugin 기본값 `defaults.theme`입니다.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  Diff 레이아웃입니다. 기본값은 Plugin 기본값 `defaults.layout`입니다.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  전체 컨텍스트를 사용할 수 있을 때 변경되지 않은 섹션을 확장합니다. 호출별 옵션일 뿐입니다(Plugin 기본 키가 아님).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  렌더링된 파일 형식입니다. 기본값은 Plugin 기본값 `defaults.fileFormat`입니다.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG 또는 PDF 렌더링을 위한 품질 프리셋입니다.
</ParamField>
<ParamField path="fileScale" type="number">
  디바이스 배율 오버라이드(`1`-`4`)입니다.
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS 픽셀 단위의 최대 렌더링 너비(`640`-`2400`)입니다.
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  뷰어 및 독립 실행형 파일 출력의 아티팩트 TTL(초)입니다. 최대 21600입니다.
</ParamField>
<ParamField path="baseUrl" type="string">
  뷰어 URL 출처 오버라이드입니다. Plugin `viewerBaseUrl`을 오버라이드합니다. `http` 또는 `https`여야 하며 쿼리/해시가 없어야 합니다.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    이전 버전과의 호환성을 위해 여전히 허용됩니다.

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before`와 `after`는 각각 최대 512 KiB입니다.
    - `patch`는 최대 2 MiB입니다.
    - `path`는 최대 2048바이트입니다.
    - `lang`은 최대 128바이트입니다.
    - `title`은 최대 1024바이트입니다.
    - 패치 복잡도 상한: 최대 128개 파일 및 총 120000줄입니다.
    - `patch`와 `before` 또는 `after`를 함께 사용하면 거부됩니다.
    - 렌더링된 파일 안전 제한(PNG 및 PDF에 적용):
      - `fileQuality: "standard"`: 최대 8 MP(8,000,000 렌더링 픽셀).
      - `fileQuality: "hq"`: 최대 14 MP(14,000,000 렌더링 픽셀).
      - `fileQuality: "print"`: 최대 24 MP(24,000,000 렌더링 픽셀).
      - PDF에는 최대 50페이지 제한도 있습니다.

  </Accordion>
</AccordionGroup>

## 출력 details 계약

이 도구는 `details` 아래에 구조화된 메타데이터를 반환합니다.

<AccordionGroup>
  <Accordion title="Viewer fields">
    뷰어를 생성하는 모드의 공통 필드입니다.

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context`(사용 가능한 경우 `agentId`, `sessionId`, `messageChannel`, `agentAccountId`)

  </Accordion>
  <Accordion title="File fields">
    PNG 또는 PDF가 렌더링될 때의 파일 필드입니다.

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`(메시지 도구 호환성을 위해 `filePath`와 같은 값)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="Compatibility aliases">
    기존 호출자를 위해서도 반환됩니다.

    - `format`(`fileFormat`과 같은 값)
    - `imagePath`(`filePath`와 같은 값)
    - `imageBytes`(`fileBytes`와 같은 값)
    - `imageQuality`(`fileQuality`와 같은 값)
    - `imageScale`(`fileScale`과 같은 값)
    - `imageMaxWidth`(`fileMaxWidth`와 같은 값)

  </Accordion>
</AccordionGroup>

모드 동작 요약:

| 모드     | 반환되는 내용                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | 뷰어 필드만 반환됩니다.                                                                                                    |
| `"file"` | 파일 필드만 반환되며 뷰어 아티팩트는 없습니다.                                                                                  |
| `"both"` | 뷰어 필드와 파일 필드를 함께 반환합니다. 파일 렌더링에 실패하면 뷰어는 `fileError` 및 `imageError` 별칭과 함께 계속 반환됩니다. |

## 접힌 변경되지 않은 섹션

- 뷰어는 `N unmodified lines` 같은 행을 표시할 수 있습니다.
- 해당 행의 확장 컨트롤은 조건부이며 모든 입력 종류에서 보장되지는 않습니다.
- 렌더링된 diff에 확장 가능한 컨텍스트 데이터가 있을 때 확장 컨트롤이 표시되며, 이는 before/after 입력에서 일반적입니다.
- 많은 통합 패치 입력에서는 생략된 컨텍스트 본문을 파싱된 패치 헝크에서 사용할 수 없으므로, 확장 컨트롤 없이 행이 표시될 수 있습니다. 이는 예상된 동작입니다.
- `expandUnchanged`는 확장 가능한 컨텍스트가 있을 때만 적용됩니다.

## Plugin 기본값

`~/.openclaw/openclaw.json`에서 Plugin 전체 기본값을 설정합니다.

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

명시적 도구 매개변수는 이 기본값을 오버라이드합니다.

### 영구 뷰어 URL 설정

<ParamField path="viewerBaseUrl" type="string">
  도구 호출에서 `baseUrl`을 전달하지 않을 때 반환되는 뷰어 링크에 대한 Plugin 소유 fallback입니다. `http` 또는 `https`여야 하며 쿼리/해시가 없어야 합니다.
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

## 보안 설정

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: 뷰어 경로에 대한 non-loopback 요청이 거부됩니다. `true`: 토큰화된 경로가 유효하면 원격 뷰어가 허용됩니다.
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

- 아티팩트는 임시 하위 폴더 `$TMPDIR/openclaw-diffs` 아래에 저장됩니다.
- 뷰어 아티팩트 메타데이터에는 다음이 포함됩니다.
  - 임의 아티팩트 ID(16진수 20자)
  - 임의 토큰(16진수 48자)
  - `createdAt` 및 `expiresAt`
  - 저장된 `viewer.html` 경로
- 지정하지 않으면 기본 아티팩트 TTL은 30분입니다.
- 허용되는 최대 뷰어 TTL은 6시간입니다.
- 정리는 아티팩트 생성 후 기회가 있을 때 실행됩니다.
- 만료된 아티팩트는 삭제됩니다.
- fallback 정리는 메타데이터가 없을 때 24시간보다 오래된 오래된 폴더를 제거합니다.

## 뷰어 URL 및 네트워크 동작

뷰어 경로:

- `/plugins/diffs/view/{artifactId}/{token}`

뷰어 애셋:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

뷰어 문서는 이러한 애셋을 뷰어 URL 기준 상대 경로로 해석하므로, 선택적 `baseUrl` 경로 접두사도 두 애셋 요청 모두에 보존됩니다.

URL 구성 동작:

- 도구 호출 `baseUrl`이 제공되면 엄격한 검증 후 사용됩니다.
- 그렇지 않고 Plugin `viewerBaseUrl`이 설정되어 있으면 그것이 사용됩니다.
- 둘 중 어느 오버라이드도 없으면 뷰어 URL은 기본적으로 loopback `127.0.0.1`을 사용합니다.
- Gateway 바인드 모드가 `custom`이고 `gateway.customBindHost`가 설정되어 있으면 해당 호스트가 사용됩니다.

`baseUrl` 규칙:

- `http://` 또는 `https://`여야 합니다.
- 쿼리와 해시는 거부됩니다.
- 출처와 선택적 기본 경로가 허용됩니다.

## 보안 모델

<AccordionGroup>
  <Accordion title="뷰어 보안 강화">
    - 기본적으로 루프백 전용입니다.
    - 엄격한 ID 및 토큰 검증을 사용하는 토큰화된 뷰어 경로입니다.
    - 뷰어 응답 CSP:
      - `default-src 'none'`
      - 스크립트와 에셋은 자체 출처에서만 허용
      - 외부로 나가는 `connect-src` 없음
    - 원격 액세스가 활성화된 경우 원격 미스 제한:
      - 60초당 실패 40회
      - 60초 잠금(`429 Too Many Requests`)

  </Accordion>
  <Accordion title="파일 렌더링 보안 강화">
    - 스크린샷 브라우저 요청 라우팅은 기본적으로 거부됩니다.
    - `http://127.0.0.1/plugins/diffs/assets/*`의 로컬 뷰어 에셋만 허용됩니다.
    - 외부 네트워크 요청은 차단됩니다.

  </Accordion>
</AccordionGroup>

## 파일 모드의 브라우저 요구 사항

`mode: "file"` 및 `mode: "both"`에는 Chromium 호환 브라우저가 필요합니다.

해결 순서:

<Steps>
  <Step title="구성">
    OpenClaw 구성의 `browser.executablePath`.
  </Step>
  <Step title="환경 변수">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="플랫폼 대체 수단">
    플랫폼 명령/경로 검색 대체 수단입니다.
  </Step>
</Steps>

일반적인 실패 문구:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

Chrome, Chromium, Edge 또는 Brave를 설치하거나 위 실행 파일 경로 옵션 중 하나를 설정하여 해결하세요.

## 문제 해결

<AccordionGroup>
  <Accordion title="입력 검증 오류">
    - `Provide patch or both before and after text.` — `before`와 `after`를 모두 포함하거나 `patch`를 제공하세요.
    - `Provide either patch or before/after input, not both.` — 입력 모드를 혼합하지 마세요.
    - `Invalid baseUrl: ...` — 선택적 경로가 있는 `http(s)` 원점을 사용하고 쿼리/해시는 사용하지 마세요.
    - `{field} exceeds maximum size (...)` — 페이로드 크기를 줄이세요.
    - 큰 패치 거부 — 패치 파일 수 또는 총 줄 수를 줄이세요.

  </Accordion>
  <Accordion title="뷰어 접근성">
    - 뷰어 URL은 기본적으로 `127.0.0.1`로 해석됩니다.
    - 원격 액세스 시나리오에서는 다음 중 하나를 사용하세요.
      - Plugin `viewerBaseUrl` 설정, 또는
      - 도구 호출마다 `baseUrl` 전달, 또는
      - `gateway.bind=custom` 및 `gateway.customBindHost` 사용
    - `gateway.trustedProxies`에 동일 호스트 프록시(예: Tailscale Serve)를 위한 루프백이 포함된 경우, 전달된 클라이언트 IP 헤더가 없는 원시 루프백 뷰어 요청은 설계상 안전하게 실패합니다.
    - 해당 프록시 토폴로지에서는:
      - 첨부 파일만 필요한 경우 `mode: "file"` 또는 `mode: "both"`를 선호하거나
      - 공유 가능한 뷰어 URL이 필요한 경우 의도적으로 `security.allowRemoteViewer`를 활성화하고 Plugin `viewerBaseUrl`을 설정하거나 프록시/공개 `baseUrl`을 전달하세요
    - 외부 뷰어 액세스를 의도한 경우에만 `security.allowRemoteViewer`를 활성화하세요.

  </Accordion>
  <Accordion title="수정되지 않은 줄 행에 펼치기 버튼이 없음">
    패치 입력에서 패치가 펼칠 수 있는 컨텍스트를 포함하지 않는 경우 이런 일이 발생할 수 있습니다. 이는 예상된 동작이며 뷰어 실패를 의미하지 않습니다.
  </Accordion>
  <Accordion title="아티팩트를 찾을 수 없음">
    - TTL로 인해 아티팩트가 만료되었습니다.
    - 토큰 또는 경로가 변경되었습니다.
    - 정리가 오래된 데이터를 제거했습니다.

  </Accordion>
</AccordionGroup>

## 운영 지침

- 캔버스에서 로컬 대화형 리뷰에는 `mode: "view"`를 선호하세요.
- 첨부 파일이 필요한 외부 채팅 채널에는 `mode: "file"`을 선호하세요.
- 배포에서 원격 뷰어 URL이 필요하지 않으면 `allowRemoteViewer`를 비활성화 상태로 유지하세요.
- 민감한 diff에는 명시적으로 짧은 `ttlSeconds`를 설정하세요.
- 필요하지 않은 경우 diff 입력에 비밀 정보를 보내지 마세요.
- 채널이 이미지를 강하게 압축하는 경우(예: Telegram 또는 WhatsApp), PDF 출력(`fileFormat: "pdf"`)을 선호하세요.

<Note>
Diff 렌더링 엔진은 [Diffs](https://diffs.com)에서 제공합니다.
</Note>

## 관련 항목

- [브라우저](/ko/tools/browser)
- [Plugins](/ko/tools/plugin)
- [도구 개요](/ko/tools)
