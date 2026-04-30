---
read_when:
    - Codex, Claude 또는 Cursor와 호환되는 번들을 설치하려고 합니다
    - OpenClaw가 번들 콘텐츠를 네이티브 기능에 매핑하는 방식을 이해해야 합니다
    - 번들 감지 또는 누락된 기능을 디버깅하고 있습니다
summary: Codex, Claude, Cursor 번들을 OpenClaw Plugin으로 설치하고 사용하기
title: Plugin 번들
x-i18n:
    generated_at: "2026-04-30T06:40:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6d03643c3029f5c6c81fab3aa1c00accba94da64a834e381b29db8f405d6bdee
    source_path: plugins/bundles.md
    workflow: 16
---

OpenClaw는 세 가지 외부 생태계인 **Codex**, **Claude**,
**Cursor**에서 Plugin을 설치할 수 있습니다. 이를 **번들**이라고 부릅니다. 번들은
OpenClaw가 Skills, 훅, MCP 도구 같은 네이티브 기능으로 매핑하는 콘텐츠 및 메타데이터 팩입니다.

<Info>
  번들은 네이티브 OpenClaw Plugin과 **같지 않습니다**. 네이티브 Plugin은
  프로세스 내부에서 실행되며 모든 기능을 등록할 수 있습니다. 번들은 선택적 기능
  매핑과 더 좁은 신뢰 경계를 가진 콘텐츠 팩입니다.
</Info>

## 번들이 존재하는 이유

많은 유용한 Plugin이 Codex, Claude 또는 Cursor 형식으로 게시됩니다. 작성자가 이를
네이티브 OpenClaw Plugin으로 다시 작성하도록 요구하는 대신, OpenClaw는
이러한 형식을 감지하고 지원되는 콘텐츠를 네이티브 기능 세트로 매핑합니다.
즉 Claude 명령 팩이나 Codex Skills 번들을 설치해 즉시 사용할 수 있습니다.

## 번들 설치

<Steps>
  <Step title="디렉터리, 아카이브 또는 마켓플레이스에서 설치">
    ```bash
    # Local directory
    openclaw plugins install ./my-bundle

    # Archive
    openclaw plugins install ./my-bundle.tgz

    # Claude marketplace
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="감지 확인">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    번들은 `codex`, `claude`, `cursor` 중 하나의 하위 유형과 함께 `Format: bundle`로 표시됩니다.

  </Step>

  <Step title="다시 시작하고 사용">
    ```bash
    openclaw gateway restart
    ```

    매핑된 기능(Skills, 훅, MCP 도구, LSP 기본값)은 다음 세션에서 사용할 수 있습니다.

  </Step>
</Steps>

## OpenClaw가 번들에서 매핑하는 항목

현재 모든 번들 기능이 OpenClaw에서 실행되는 것은 아닙니다. 작동하는 항목과
감지되지만 아직 연결되지 않은 항목은 다음과 같습니다.

### 현재 지원됨

| 기능          | 매핑 방식                                                                                       | 적용 대상       |
| ------------- | ----------------------------------------------------------------------------------------------- | -------------- |
| Skills 콘텐츠 | 번들 Skills 루트가 일반 OpenClaw Skills로 로드됩니다                                             | 모든 형식       |
| 명령          | `commands/`와 `.cursor/commands/`가 Skills 루트로 처리됩니다                                     | Claude, Cursor |
| 훅 팩         | OpenClaw 스타일 `HOOK.md` + `handler.ts` 레이아웃                                                | Codex          |
| MCP 도구      | 번들 MCP 구성이 내장 Pi 설정에 병합되며, 지원되는 stdio 및 HTTP 서버가 로드됩니다                | 모든 형식       |
| LSP 서버      | Claude `.lsp.json`과 매니페스트 선언 `lspServers`가 내장 Pi LSP 기본값에 병합됩니다             | Claude         |
| 설정          | Claude `settings.json`이 내장 Pi 기본값으로 가져와집니다                                        | Claude         |

#### Skills 콘텐츠

- 번들 Skills 루트는 일반 OpenClaw Skills 루트로 로드됩니다
- Claude `commands` 루트는 추가 Skills 루트로 처리됩니다
- Cursor `.cursor/commands` 루트는 추가 Skills 루트로 처리됩니다

즉 Claude 마크다운 명령 파일은 일반 OpenClaw Skills 로더를 통해 작동합니다.
Cursor 명령 마크다운도 같은 경로를 통해 작동합니다.

#### 훅 팩

- 번들 훅 루트는 일반 OpenClaw 훅 팩 레이아웃을 사용할 때만 **작동합니다**.
  현재는 주로 Codex 호환 사례입니다:
  - `HOOK.md`
  - `handler.ts` 또는 `handler.js`

#### Pi용 MCP

- 활성화된 번들은 MCP 서버 구성을 제공할 수 있습니다
- OpenClaw는 번들 MCP 구성을 유효한 내장 Pi 설정에 `mcpServers`로 병합합니다
- OpenClaw는 stdio 서버를 실행하거나 HTTP 서버에 연결하여 내장 Pi 에이전트 턴 중
  지원되는 번들 MCP 도구를 노출합니다
- `coding` 및 `messaging` 도구 프로필은 기본적으로 번들 MCP 도구를 포함합니다.
  에이전트 또는 Gateway에서 제외하려면 `tools.deny: ["bundle-mcp"]`를 사용하세요
- 프로젝트 로컬 Pi 설정은 번들 기본값 이후에도 계속 적용되므로, 필요할 때 워크스페이스
  설정이 번들 MCP 항목을 재정의할 수 있습니다
- 번들 MCP 도구 카탈로그는 등록 전에 결정적으로 정렬되므로,
  업스트림 `listTools()` 순서 변경으로 프롬프트 캐시 도구 블록이 흔들리지 않습니다

##### 전송 방식

MCP 서버는 stdio 또는 HTTP 전송을 사용할 수 있습니다:

**Stdio**는 자식 프로세스를 실행합니다:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "command": "node",
        "args": ["server.js"],
        "env": { "PORT": "3000" }
      }
    }
  }
}
```

**HTTP**는 기본적으로 `sse`를 통해 실행 중인 MCP 서버에 연결하거나, 요청된 경우 `streamable-http`로 연결합니다:

```json
{
  "mcp": {
    "servers": {
      "my-server": {
        "url": "http://localhost:3100/mcp",
        "transport": "streamable-http",
        "headers": {
          "Authorization": "Bearer ${MY_SECRET_TOKEN}"
        },
        "connectionTimeoutMs": 30000
      }
    }
  }
}
```

- `transport`는 `"streamable-http"` 또는 `"sse"`로 설정할 수 있으며, 생략하면 OpenClaw는 `sse`를 사용합니다
- `type: "http"`는 CLI 네이티브 다운스트림 형태입니다. OpenClaw 구성에서는 `transport: "streamable-http"`를 사용하세요. `openclaw mcp set`과 `openclaw doctor --fix`는 일반적인 별칭을 정규화합니다.
- `http:` 및 `https:` URL 스킴만 허용됩니다
- `headers` 값은 `${ENV_VAR}` 보간을 지원합니다
- `command`와 `url`이 모두 있는 서버 항목은 거부됩니다
- URL 자격 증명(userinfo 및 쿼리 매개변수)은 도구 설명과 로그에서
  마스킹됩니다
- `connectionTimeoutMs`는 stdio와 HTTP 전송 모두에 대해 기본 30초 연결 제한 시간을
  재정의합니다

##### 도구 이름 지정

OpenClaw는 번들 MCP 도구를 `serverName__toolName` 형식의 제공자 안전 이름으로 등록합니다.
예를 들어 `"vigil-harbor"` 키가 지정된 서버가 `memory_search` 도구를 노출하면
`vigil-harbor__memory_search`로 등록됩니다.

- `A-Za-z0-9_-` 이외의 문자는 `-`로 대체됩니다
- 서버 접두사는 30자로 제한됩니다
- 전체 도구 이름은 64자로 제한됩니다
- 빈 서버 이름은 `mcp`로 대체됩니다
- 충돌하는 정리된 이름은 숫자 접미사로 구분됩니다
- 최종 노출 도구 순서는 반복되는 Pi 턴의 캐시 안정성을 유지하기 위해 안전 이름 기준으로 결정적입니다
- 프로필 필터링은 하나의 번들 MCP 서버에서 온 모든 도구를 `bundle-mcp`가 소유한 Plugin으로 처리하므로,
  프로필 허용 목록과 거부 목록에는 개별 노출 도구 이름 또는 `bundle-mcp` Plugin 키를 포함할 수 있습니다

#### 내장 Pi 설정

- Claude `settings.json`은 번들이 활성화될 때 기본 내장 Pi 설정으로 가져와집니다
- OpenClaw는 셸 재정의 키를 적용하기 전에 정리합니다

정리된 키:

- `shellPath`
- `shellCommandPrefix`

#### 내장 Pi LSP

- 활성화된 Claude 번들은 LSP 서버 구성을 제공할 수 있습니다
- OpenClaw는 `.lsp.json`과 매니페스트에 선언된 모든 `lspServers` 경로를 로드합니다
- 번들 LSP 구성은 유효한 내장 Pi LSP 기본값에 병합됩니다
- 현재는 지원되는 stdio 기반 LSP 서버만 실행할 수 있습니다. 지원되지 않는
  전송 방식도 `openclaw plugins inspect <id>`에는 계속 표시됩니다

### 감지되지만 실행되지 않음

다음 항목은 인식되어 진단에 표시되지만, OpenClaw는 실행하지 않습니다:

- Claude `agents`, `hooks.json` 자동화, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- 기능 보고를 넘어서는 Codex 인라인/앱 메타데이터

## 번들 형식

<AccordionGroup>
  <Accordion title="Codex 번들">
    마커: `.codex-plugin/plugin.json`

    선택적 콘텐츠: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex 번들은 Skills 루트와 OpenClaw 스타일 훅 팩 디렉터리
    (`HOOK.md` + `handler.ts`)를 사용할 때 OpenClaw에 가장 잘 맞습니다.

  </Accordion>

  <Accordion title="Claude 번들">
    두 가지 감지 모드:

    - **매니페스트 기반:** `.claude-plugin/plugin.json`
    - **매니페스트 없음:** 기본 Claude 레이아웃(`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude 전용 동작:

    - `commands/`는 Skills 콘텐츠로 처리됩니다
    - `settings.json`은 내장 Pi 설정으로 가져와집니다(셸 재정의 키는 정리됨)
    - `.mcp.json`은 지원되는 stdio 도구를 내장 Pi에 노출합니다
    - `.lsp.json`과 매니페스트 선언 `lspServers` 경로는 내장 Pi LSP 기본값으로 로드됩니다
    - `hooks/hooks.json`은 감지되지만 실행되지 않습니다
    - 매니페스트의 사용자 지정 구성 요소 경로는 추가 방식입니다(기본값을 대체하지 않고 확장합니다)

  </Accordion>

  <Accordion title="Cursor 번들">
    마커: `.cursor-plugin/plugin.json`

    선택적 콘텐츠: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/`는 Skills 콘텐츠로 처리됩니다
    - `.cursor/rules/`, `.cursor/agents/`, `.cursor/hooks.json`는 감지만 됩니다

  </Accordion>
</AccordionGroup>

## 감지 우선순위

OpenClaw는 먼저 네이티브 Plugin 형식을 확인합니다:

1. `openclaw.plugin.json` 또는 `openclaw.extensions`가 있는 유효한 `package.json` — **네이티브 Plugin**으로 처리됨
2. 번들 마커(`.codex-plugin/`, `.claude-plugin/` 또는 기본 Claude/Cursor 레이아웃) — **번들**로 처리됨

디렉터리에 둘 다 포함된 경우 OpenClaw는 네이티브 경로를 사용합니다. 이를 통해
이중 형식 패키지가 번들로 부분 설치되는 것을 방지합니다.

## 런타임 종속성과 정리

- 서드파티 호환 번들은 시작 시 `npm install` 복구를 받지 않습니다.
  `openclaw plugins install`을 통해 설치되어야 하며, 설치된 Plugin 디렉터리에
  필요한 모든 것을 포함해야 합니다.
- OpenClaw 소유의 패키징된 번들 Plugin에는 좁은 예외가 있습니다. 해당 Plugin이
  활성화되면 Gateway 시작 시 가져오기 전에 선언된 누락 런타임 종속성을 복구할 수 있습니다.
  운영자는 `openclaw plugins deps`로 해당 단계를 검사하거나 복구할 수 있습니다.
- 릴리스 파이프라인은 가능할 때 완전한 번들 종속성 페이로드를 제공할 책임이 여전히 있습니다
  ([Releasing](/ko/reference/RELEASING)의 postpublish 검증 규칙 참조).

## 보안

번들은 네이티브 Plugin보다 더 좁은 신뢰 경계를 가집니다:

- OpenClaw는 임의의 번들 런타임 모듈을 프로세스 내부에서 로드하지 않습니다
- Skills 및 훅 팩 경로는 Plugin 루트 내부에 있어야 합니다(경계 검사됨)
- 설정 파일은 동일한 경계 검사로 읽습니다
- 지원되는 stdio MCP 서버는 하위 프로세스로 실행될 수 있습니다

이로 인해 번들은 기본적으로 더 안전하지만, 서드파티 번들은 여전히 해당 번들이 노출하는
기능에 대해서는 신뢰된 콘텐츠로 취급해야 합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="번들은 감지되지만 기능이 실행되지 않음">
    `openclaw plugins inspect <id>`를 실행하세요. 기능이 나열되어 있지만
    연결되지 않은 것으로 표시된다면, 이는 설치 오류가 아니라 제품 제한입니다.
  </Accordion>

  <Accordion title="Claude 명령 파일이 나타나지 않음">
    번들이 활성화되어 있고 마크다운 파일이 감지된 `commands/` 또는 `skills/`
    루트 안에 있는지 확인하세요.
  </Accordion>

  <Accordion title="Claude 설정이 적용되지 않음">
    `settings.json`의 내장 Pi 설정만 지원됩니다. OpenClaw는
    번들 설정을 원시 구성 패치로 처리하지 않습니다.
  </Accordion>

  <Accordion title="Claude 훅이 실행되지 않음">
    `hooks/hooks.json`는 감지만 됩니다. 실행 가능한 훅이 필요하면
    OpenClaw 훅 팩 레이아웃을 사용하거나 네이티브 Plugin을 배포하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [Plugin 설치 및 구성](/ko/tools/plugin)
- [Plugin 빌드](/ko/plugins/building-plugins) — 네이티브 Plugin 만들기
- [Plugin 매니페스트](/ko/plugins/manifest) — 네이티브 매니페스트 스키마
