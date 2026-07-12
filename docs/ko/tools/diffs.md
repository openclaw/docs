---
read_when:
    - 에이전트가 코드 또는 Markdown 편집 내용을 diff 형식으로 표시하도록 하려는 경우
    - 캔버스에서 바로 사용할 수 있는 뷰어 URL 또는 렌더링된 diff 파일이 필요합니다.
    - 안전한 기본값이 적용된, 제어 가능한 임시 diff 아티팩트가 필요합니다
sidebarTitle: Diffs
summary: 에이전트용 읽기 전용 diff 뷰어 및 파일 렌더러(선택적 Plugin 도구)
title: 차이점
x-i18n:
    generated_at: "2026-07-12T15:48:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs`는 변경 전/후 텍스트나 통합 패치를 읽기 전용 diff 아티팩트로 변환하는 선택적 번들 Plugin 도구입니다. 또한 시스템 프롬프트 앞에 간단한 에이전트 지침을 추가하고, 더 자세한 지침을 제공하는 보조 Skills를 함께 제공합니다.

입력: `before` + `after` 텍스트 또는 통합 `patch`(상호 배타적).

출력: 캔버스 표시에 사용할 Gateway 뷰어 URL, 메시지 전달에 사용할 렌더링된 PNG/PDF 파일 경로 또는 둘 다.

## 빠른 시작

<Steps>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
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
        캔버스 우선 흐름: 에이전트가 `mode: "view"`로 `diffs`를 호출하고 `canvas present`로 `details.viewerUrl`을 엽니다.
      </Tab>
      <Tab title="file">
        채팅 파일 전달: 에이전트가 `mode: "file"`로 `diffs`를 호출하고 `path` 또는 `filePath`를 사용하는 `message`로 `details.filePath`를 전송합니다.
      </Tab>
      <Tab title="both">
        결합 모드(기본값): 에이전트가 `mode: "both"`로 `diffs`를 호출하여 한 번의 호출로 두 아티팩트를 모두 가져옵니다.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## 내장 시스템 지침 비활성화

도구는 유지하되 앞에 추가되는 시스템 프롬프트 지침을 제거하려면 `plugins.entries.diffs.hooks.allowPromptInjection`을 `false`로 설정합니다.

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

이 설정은 도구와 Skills를 계속 사용할 수 있도록 유지하면서 Plugin의 `before_prompt_build` 훅을 차단합니다. 지침과 도구를 모두 비활성화하려면 Plugin 자체를 비활성화하십시오.

## 도구 입력 참조

별도 표시가 없으면 모든 필드는 선택 사항입니다.

<ParamField path="before" type="string">
  원본 텍스트입니다. `patch`를 생략한 경우 `after`와 함께 필수입니다.
</ParamField>
<ParamField path="after" type="string">
  업데이트된 텍스트입니다. `patch`를 생략한 경우 `before`와 함께 필수입니다.
</ParamField>
<ParamField path="patch" type="string">
  통합 diff 텍스트입니다. `before` 및 `after`와 상호 배타적입니다.
</ParamField>
<ParamField path="path" type="string">
  변경 전/후 모드에 표시할 파일 이름입니다.
</ParamField>
<ParamField path="lang" type="string">
  변경 전/후 모드의 언어 재정의 힌트입니다. Diff Viewer Language Pack Plugin이 설치되어 있지 않으면 알 수 없는 값과 기본 뷰어 집합에 포함되지 않은 언어는 일반 텍스트로 대체됩니다.
</ParamField>
<ParamField path="title" type="string">
  뷰어 제목 재정의입니다.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  출력 모드입니다. Plugin 기본값 `defaults.mode`(`both`)가 기본으로 사용됩니다. 사용 중단된 별칭 `"image"`는 `"file"`과 동일하게 동작합니다.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  뷰어 테마입니다. Plugin 기본값 `defaults.theme`이 기본으로 사용됩니다.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  diff 레이아웃입니다. Plugin 기본값 `defaults.layout`이 기본으로 사용됩니다.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  전체 컨텍스트를 사용할 수 있을 때 변경되지 않은 섹션을 펼칩니다. 호출별 옵션으로만 사용할 수 있습니다(Plugin 기본 키가 아님).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  렌더링된 파일 형식입니다. Plugin 기본값 `defaults.fileFormat`이 기본으로 사용됩니다.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  PNG/PDF 렌더링의 품질 사전 설정입니다.
</ParamField>
<ParamField path="fileScale" type="number">
  장치 배율 재정의입니다(`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  CSS 픽셀 단위의 최대 렌더링 너비입니다(`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  뷰어 및 독립 실행형 파일 출력 아티팩트의 TTL(초)입니다. 최대 `21600`입니다.
</ParamField>
<ParamField path="baseUrl" type="string">
  뷰어 URL 출처 재정의입니다. Plugin의 `viewerBaseUrl`을 재정의합니다. 쿼리/해시 없이 `http` 또는 `https`여야 합니다.
</ParamField>

<AccordionGroup>
  <Accordion title="검증 및 제한">
    - `before`/`after`: 각각 최대 512 KiB.
    - `patch`: 최대 2 MiB.
    - `path`: 최대 2048바이트.
    - `lang`: 최대 128바이트.
    - `title`: 최대 1024바이트.
    - 패치 복잡도 제한: 최대 128개 파일 및 총 120000줄.
    - `patch`를 `before`/`after`와 함께 사용하면 거부됩니다.
    - 렌더링된 파일의 안전 제한(PNG 및 PDF):
      - `fileQuality: "standard"`: 최대 8 MP(렌더링된 픽셀 8,000,000개).
      - `fileQuality: "hq"`: 최대 14 MP.
      - `fileQuality: "print"`: 최대 24 MP.
      - PDF는 최대 50페이지로도 제한됩니다.

  </Accordion>
</AccordionGroup>

## 구문 강조

내장 언어:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, `toml`.

일반적인 별칭(`js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, `ps1` 등)은 해당 언어로 정규화됩니다.

더 많은 언어(Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff 등)를 사용하려면 Diff Viewer Language Pack Plugin을 설치하십시오.

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

팩이 없어도 지원되지 않는 언어는 읽을 수 있는 일반 텍스트로 렌더링됩니다. 업스트림 카탈로그는 [Diffs Language Pack Plugin](/ko/plugins/reference/diffs-language-pack)과 [Shiki 언어](https://shiki.style/languages)를 참조하십시오.

## 출력 세부 정보 계약

성공한 모든 결과에는 `changed`가 포함됩니다. 변경 전/후 입력이 동일하면 아티팩트를 생성하지 않고 `false`를 반환하며, 렌더링된 결과는 `true`를 반환합니다.

<AccordionGroup>
  <Accordion title="뷰어 필드(view 및 both 모드)">
    - `changed`
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
  <Accordion title="파일 필드(file 및 both 모드)">
    - `changed`
    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path`(메시지 도구 호환성을 위해 `filePath`와 동일한 값)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
</AccordionGroup>

| 모드     | 반환 내용                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | 뷰어 필드만 반환합니다.                                                                             |
| `"file"` | 뷰어 아티팩트 없이 파일 필드만 반환합니다.                                                           |
| `"both"` | 뷰어 필드와 파일 필드를 함께 반환합니다. 파일 렌더링에 실패해도 뷰어는 `fileError`와 함께 반환됩니다. |

### 접힌 변경되지 않은 섹션

뷰어에는 `N unmodified lines`와 같은 행이 표시됩니다. 렌더링된 diff에 확장 가능한 컨텍스트 데이터가 있을 때만 확장 컨트롤이 나타납니다(일반적으로 변경 전/후 입력의 경우). 많은 통합 패치는 헝크에서 컨텍스트 본문을 생략하므로 확장 컨트롤 없이 행만 나타날 수 있습니다. 이는 예상된 동작이며 버그가 아닙니다. `expandUnchanged`는 확장 가능한 컨텍스트가 있을 때만 적용됩니다.

### 여러 파일 탐색

둘 이상의 파일을 변경하는 패치는 변경된 파일 요약 카드로 시작합니다. 이 카드에는 총 `+N` / `-N` 개수, 파일별 개수, 추가됨/삭제됨/이름 변경됨 배지, 각 파일로 이동하는 앵커 링크가 포함됩니다. 렌더링된 PNG/PDF 파일은 파일별 헤더 개수를 유지하지만, 정적 파일에서는 작동하지 않는 컨트롤이므로 대화형 보기 전환 컨트롤은 제외합니다.

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
            ttlSeconds: 21600,
          },
        },
      },
    },
  },
}
```

지원되는 `defaults` 키는 `fontFamily`, `fontSize`, `lineSpacing`, `layout`, `showLineNumbers`, `diffIndicators`, `wordWrap`, `background`, `theme`, `fileFormat`, `fileQuality`, `fileScale`, `fileMaxWidth`, `mode`, `ttlSeconds`입니다. 명시적인 도구 호출 매개변수가 이러한 값을 재정의합니다.

### 영구 뷰어 URL 구성

<ParamField path="viewerBaseUrl" type="string">
  도구 호출에서 `baseUrl`을 전달하지 않을 때 반환되는 뷰어 링크에 사용하는 Plugin 소유의 대체 값입니다. 쿼리/해시가 없는 `http` 또는 `https`여야 합니다.
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
  `false`: 뷰어 경로에 대한 루프백이 아닌 요청은 거부됩니다. `true`: 토큰이 포함된 경로가 유효하면 원격 뷰어가 허용됩니다.
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

- 아티팩트는 `$TMPDIR/openclaw-diffs` 아래에 저장됩니다.
- 뷰어 메타데이터에는 무작위 20자리 16진수 아티팩트 ID, 무작위 48자리 16진수 토큰, `createdAt`/`expiresAt`, 저장된 `viewer.html` 경로가 기록됩니다.
- 기본 아티팩트 TTL: 30분. 허용되는 최대 TTL: 6시간.
- 각 아티팩트 생성 호출 후 기회가 있을 때마다 정리가 실행되며, 만료된 아티팩트가 삭제됩니다.
- 메타데이터가 없으면 대체 정리 작업이 24시간보다 오래된 폴더를 제거합니다.

## 뷰어 URL 및 네트워크 동작

뷰어 경로: `/plugins/diffs/view/{artifactId}/{token}`

뷰어 에셋:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js`(diff가 언어 팩 언어를 사용하는 경우에만 해당)

뷰어 문서는 이러한 에셋을 뷰어 URL을 기준으로 해석하므로, 선택적 `baseUrl` 경로 접두사도 에셋 요청에 적용됩니다.

URL 해석 순서: 도구 호출의 `baseUrl`(엄격한 검증 후) -> Plugin의 `viewerBaseUrl` -> 루프백 `127.0.0.1` 기본값. Gateway 바인드 모드가 `custom`이고 `gateway.customBindHost`가 설정되어 있으면 루프백 대신 해당 호스트가 사용됩니다.

`baseUrl` 규칙: `http://` 또는 `https://`여야 하며, 쿼리와 해시는 거부됩니다. 오리진과 선택적 기본 경로를 함께 사용할 수 있습니다.

## 보안 모델

<AccordionGroup>
  <Accordion title="뷰어 보안 강화">
    - 기본적으로 루프백에서만 접근할 수 있습니다.
    - 엄격한 ID 및 토큰 패턴 검증이 적용된 토큰화된 뷰어 경로를 사용합니다.
    - 뷰어 응답 CSP: `default-src 'none'`; 스크립트/에셋은 자체 출처에서만 허용되며, 외부로 나가는 `connect-src`는 허용되지 않습니다.
    - 원격 접근이 활성화된 경우 원격 요청 실패를 제한합니다. 60초 동안 40회 실패하면 60초 동안 잠금이 적용됩니다(`429 Too Many Requests`).

  </Accordion>
  <Accordion title="파일 렌더링 보안 강화">
    - 스크린샷 브라우저 요청 라우팅은 기본적으로 거부됩니다.
    - `http://127.0.0.1/plugins/diffs/assets/*`의 로컬 뷰어 에셋만 허용됩니다.
    - 외부 네트워크 요청은 차단됩니다.

  </Accordion>
</AccordionGroup>

## 파일 모드의 브라우저 요구 사항

`mode: "file"` 및 `mode: "both"`에는 Chromium 호환 브라우저가 필요합니다.

해석 순서:

  <Steps>
  <Step title="구성">
    OpenClaw 구성의 `browser.executablePath`.
  </Step>
  <Step title="환경 변수">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="플랫폼 대체 경로">
    Chrome, Chromium, Edge, Brave의 일반적인 설치 경로와 `PATH` 조회를 사용합니다.
  </Step>
</Steps>

일반적인 오류 메시지: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. Chrome, Chromium, Edge 또는 Brave를 설치하거나 위의 실행 파일 경로 옵션 중 하나를 설정하여 해결하십시오.

  ## 문제 해결

  <AccordionGroup>
  <Accordion title="입력 유효성 검사 오류">
    - `Provide patch or both before and after text.` -- `before`와 `after`를 모두 포함하거나 `patch`를 제공하십시오.
    - `Provide either patch or before/after input, not both.` -- 입력 모드를 혼용하지 마십시오.
    - `Invalid baseUrl: ...` -- 쿼리/해시 없이 선택적 경로가 포함된 `http(s)` 오리진을 사용하십시오.
    - `{field} exceeds maximum size (...)` -- 페이로드 크기를 줄이십시오.
    - 대규모 패치 거부 -- 패치 파일 수 또는 전체 줄 수를 줄이십시오.

  </Accordion>
  <Accordion title="뷰어 접근성">
    - 뷰어 URL은 기본적으로 `127.0.0.1`로 확인됩니다.
    - 원격으로 액세스하려면 Plugin의 `viewerBaseUrl`을 설정하거나, 호출별로 `baseUrl`을 전달하거나, `gateway.customBindHost`와 함께 `gateway.bind=custom`을 사용하십시오.
    - 동일 호스트 프록시(예: Tailscale Serve)를 위해 `gateway.trustedProxies`에 루프백이 포함된 경우, 전달된 클라이언트 IP 헤더가 없는 원시 루프백 뷰어 요청은 설계상 실패하도록 차단됩니다.
    - 해당 프록시 토폴로지에서는 첨부 파일에 `mode: "file"`/`"both"`를 사용하는 것이 좋으며, 공유 가능한 뷰어 링크가 필요한 경우 `security.allowRemoteViewer`와 Plugin의 `viewerBaseUrl`/프록시 `baseUrl`을 의도적으로 활성화하십시오.
    - 외부 뷰어 액세스가 필요한 경우에만 `security.allowRemoteViewer`를 활성화하십시오.

  </Accordion>
  <Accordion title="수정되지 않은 줄 행에 펼치기 버튼이 없음">
    펼칠 수 있는 컨텍스트가 없는 패치 입력에서는 예상되는 동작이며, 뷰어 오류가 아닙니다.
  </Accordion>
  <Accordion title="아티팩트를 찾을 수 없음">
    - TTL로 인해 아티팩트가 만료되었습니다.
    - 토큰 또는 경로가 변경되었습니다.
    - 정리 작업에서 오래된 데이터가 제거되었습니다.

  </Accordion>
</AccordionGroup>

## 운영 지침

- 캔버스에서 로컬 대화형 검토를 수행할 때는 `mode: "view"`를 사용하십시오.
- 첨부 파일이 필요한 외부 채팅 채널에는 `mode: "file"`을 사용하십시오.
- 배포 환경에 원격 뷰어 URL이 필요하지 않다면 `allowRemoteViewer`를 비활성화된 상태로 유지하십시오.
- 민감한 diff에는 명시적으로 짧은 `ttlSeconds`를 설정하십시오.
- 필요하지 않은 경우 diff 입력에 비밀 정보를 포함하지 마십시오.
- 채널에서 이미지를 과도하게 압축하는 경우(예: Telegram 또는 WhatsApp) PDF 출력(`fileFormat: "pdf"`)을 사용하십시오.

<Note>
Diff 렌더링 엔진은 [Diffs](https://diffs.com)를 기반으로 합니다.
</Note>

## 관련 항목

- [브라우저](/ko/tools/browser)
- [Plugin](/ko/tools/plugin)
- [도구 개요](/ko/tools)
