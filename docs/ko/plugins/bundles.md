---
read_when:
    - Codex, Claude 또는 Cursor 호환 번들을 설치하려고 합니다.
    - OpenClaw가 번들 콘텐츠를 네이티브 기능에 어떻게 매핑하는지 이해해야 합니다.
    - 번들 감지 또는 누락된 기능을 디버깅하고 있습니다.
summary: Codex, Claude, Cursor 번들을 OpenClaw plugin으로 설치하고 사용하기
title: Plugin 번들
x-i18n:
    generated_at: "2026-04-23T14:05:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd5ac067546429412f8f4fd2c0da22005686c2d4377944ecd078f56054223f9b
    source_path: plugins/bundles.md
    workflow: 15
---

# Plugin 번들

OpenClaw는 **Codex**, **Claude**,
**Cursor**의 세 가지 외부 생태계에서 plugin을 설치할 수 있습니다. 이를 **번들**이라고 합니다. 번들은
OpenClaw가 Skills, hooks, MCP 도구 같은 네이티브 기능으로 매핑하는 콘텐츠 및 메타데이터 팩입니다.

<Info>
  번들은 네이티브 OpenClaw plugin과 **같지 않습니다**. 네이티브 plugin은
  프로세스 내에서 실행되며 어떤 capability도 등록할 수 있습니다. 번들은 콘텐츠 팩이며
  기능 매핑은 선택적이고 신뢰 경계도 더 좁습니다.
</Info>

## 번들이 존재하는 이유

유용한 plugin 중 상당수는 Codex, Claude, Cursor 형식으로 게시됩니다. 저자가
이를 네이티브 OpenClaw plugin으로 다시 작성해야 하도록 하는 대신, OpenClaw는
이 형식을 감지하고 지원되는 콘텐츠를 네이티브 기능 집합으로 매핑합니다.
즉 Claude 명령 팩이나 Codex Skills 번들을 설치하면
바로 사용할 수 있습니다.

## 번들 설치

<Steps>
  <Step title="디렉터리, 아카이브 또는 마켓플레이스에서 설치">
    ```bash
    # 로컬 디렉터리
    openclaw plugins install ./my-bundle

    # 아카이브
    openclaw plugins install ./my-bundle.tgz

    # Claude 마켓플레이스
    openclaw plugins marketplace list <marketplace-name>
    openclaw plugins install <plugin-name>@<marketplace-name>
    ```

  </Step>

  <Step title="감지 확인">
    ```bash
    openclaw plugins list
    openclaw plugins inspect <id>
    ```

    번들은 `Format: bundle`로 표시되며 하위 유형은 `codex`, `claude`, `cursor` 중 하나입니다.

  </Step>

  <Step title="재시작 후 사용">
    ```bash
    openclaw gateway restart
    ```

    매핑된 기능(Skills, hooks, MCP 도구, LSP 기본값)은 다음 세션에서 사용할 수 있습니다.

  </Step>
</Steps>

## OpenClaw가 번들에서 매핑하는 항목

현재 OpenClaw에서 모든 번들 기능이 실행되는 것은 아닙니다. 여기서는
동작하는 항목과 감지되지만 아직 연결되지 않은 항목을 설명합니다.

### 현재 지원됨

| 기능          | 매핑 방식                                                                                     | 적용 대상      |
| ------------- | --------------------------------------------------------------------------------------------- | -------------- |
| Skills 콘텐츠 | 번들 Skills 루트가 일반 OpenClaw Skills로 로드됨                                              | 모든 형식      |
| 명령          | `commands/`와 `.cursor/commands/`를 Skills 루트로 취급                                        | Claude, Cursor |
| Hook 팩       | OpenClaw 스타일 `HOOK.md` + `handler.ts` 레이아웃                                             | Codex          |
| MCP 도구      | 번들 MCP config를 내장 Pi 설정에 병합하고, 지원되는 stdio 및 HTTP 서버를 로드                 | 모든 형식      |
| LSP 서버      | Claude `.lsp.json` 및 manifest 선언 `lspServers`를 내장 Pi LSP 기본값에 병합                  | Claude         |
| 설정          | Claude `settings.json`을 내장 Pi 기본값으로 가져옴                                            | Claude         |

#### Skills 콘텐츠

- 번들 Skills 루트는 일반 OpenClaw Skills 루트로 로드됩니다
- Claude `commands` 루트는 추가 Skills 루트로 취급됩니다
- Cursor `.cursor/commands` 루트는 추가 Skills 루트로 취급됩니다

즉 Claude markdown 명령 파일은 일반 OpenClaw Skills
로더를 통해 동작합니다. Cursor 명령 markdown도 같은 경로를 통해 동작합니다.

#### Hook 팩

- 번들 hook 루트는 일반 OpenClaw hook-pack
  레이아웃을 사용할 때만 동작합니다. 현재는 주로 Codex 호환 사례입니다:
  - `HOOK.md`
  - `handler.ts` 또는 `handler.js`

#### Pi용 MCP

- 활성화된 번들은 MCP 서버 config를 추가할 수 있습니다
- OpenClaw는 번들 MCP config를 유효한 내장 Pi 설정의
  `mcpServers`로 병합합니다
- OpenClaw는 내장 Pi agent 턴 동안 지원되는 번들 MCP 도구를
  stdio 서버를 실행하거나 HTTP 서버에 연결하는 방식으로 노출합니다
- `coding` 및 `messaging` 도구 프로필에는 기본적으로 번들 MCP 도구가 포함됩니다. agent 또는 gateway에서 제외하려면 `tools.deny: ["bundle-mcp"]`를 사용하세요
- 프로젝트 로컬 Pi 설정은 번들 기본값 이후에도 계속 적용되므로, 필요하면 workspace
  설정으로 번들 MCP 항목을 재정의할 수 있습니다
- 번들 MCP 도구 카탈로그는 등록 전에 결정적으로 정렬되므로,
  upstream `listTools()` 순서 변경으로 prompt-cache 도구 블록이 불필요하게 흔들리지 않습니다

##### 전송

MCP 서버는 stdio 또는 HTTP 전송을 사용할 수 있습니다.

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

**HTTP**는 기본적으로 `sse`, 요청 시 `streamable-http`를 사용하여 실행 중인 MCP 서버에 연결합니다:

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
- `http:` 및 `https:` URL 스킴만 허용됩니다
- `headers` 값은 `${ENV_VAR}` 보간을 지원합니다
- `command`와 `url`을 모두 가진 서버 항목은 거부됩니다
- URL credentials(userinfo 및 query params)는 도구
  설명과 로그에서 redact됩니다
- `connectionTimeoutMs`는 stdio와 HTTP 전송 모두에 대해
  기본 30초 연결 타임아웃을 재정의합니다

##### 도구 이름 지정

OpenClaw는 번들 MCP 도구를 provider에 안전한 이름 형식인
`serverName__toolName`으로 등록합니다. 예를 들어 `"vigil-harbor"`라는 키의 서버가
`memory_search` 도구를 노출하면 `vigil-harbor__memory_search`로 등록됩니다.

- `A-Za-z0-9_-` 밖의 문자는 `-`로 대체됩니다
- 서버 접두사는 최대 30자로 제한됩니다
- 전체 도구 이름은 최대 64자로 제한됩니다
- 빈 서버 이름은 `mcp`로 폴백합니다
- 정리 후 이름 충돌은 숫자 접미사로 구분됩니다
- 최종 노출 도구 순서는 반복되는 Pi
  턴의 캐시 안정성을 위해 안전한 이름 기준으로 결정적으로 정렬됩니다
- 프로필 필터링은 하나의 번들 MCP 서버에서 나온 모든 도구를
  `bundle-mcp`가 소유한 plugin으로 취급하므로, 프로필 allowlist와 deny list에는
  개별 노출 도구 이름이나 `bundle-mcp` plugin 키를 둘 다 포함할 수 있습니다

#### 내장 Pi 설정

- Claude `settings.json`은 번들이 활성화되어 있을 때
  기본 내장 Pi 설정으로 가져와집니다
- OpenClaw는 적용 전에 shell 재정의 키를 정리합니다

정리되는 키:

- `shellPath`
- `shellCommandPrefix`

#### 내장 Pi LSP

- 활성화된 Claude 번들은 LSP 서버 config를 추가할 수 있습니다
- OpenClaw는 `.lsp.json`과 manifest에 선언된 `lspServers` 경로를 로드합니다
- 번들 LSP config는 유효한 내장 Pi LSP 기본값에 병합됩니다
- 현재 실행 가능한 것은 지원되는 stdio 기반 LSP 서버뿐입니다. 지원되지 않는
  전송도 `openclaw plugins inspect <id>`에는 계속 표시됩니다

### 감지되지만 실행되지 않음

다음 항목은 인식되고 진단에는 표시되지만, OpenClaw가 실행하지는 않습니다:

- Claude `agents`, `hooks.json` 자동화, `outputStyles`
- Cursor `.cursor/agents`, `.cursor/hooks.json`, `.cursor/rules`
- capability 보고를 넘어서는 Codex 인라인/앱 메타데이터

## 번들 형식

<AccordionGroup>
  <Accordion title="Codex 번들">
    마커: `.codex-plugin/plugin.json`

    선택적 콘텐츠: `skills/`, `hooks/`, `.mcp.json`, `.app.json`

    Codex 번들은 Skills 루트와 OpenClaw 스타일
    hook-pack 디렉터리(`HOOK.md` + `handler.ts`)를 사용할 때 OpenClaw와 가장 잘 맞습니다.

  </Accordion>

  <Accordion title="Claude 번들">
    두 가지 감지 모드:

    - **Manifest 기반:** `.claude-plugin/plugin.json`
    - **Manifest 없음:** 기본 Claude 레이아웃(`skills/`, `commands/`, `agents/`, `hooks/`, `.mcp.json`, `.lsp.json`, `settings.json`)

    Claude 전용 동작:

    - `commands/`는 Skills 콘텐츠로 취급됩니다
    - `settings.json`은 내장 Pi 설정으로 가져옵니다(shell 재정의 키는 정리됨)
    - `.mcp.json`은 지원되는 stdio 도구를 내장 Pi에 노출합니다
    - `.lsp.json`과 manifest 선언 `lspServers` 경로는 내장 Pi LSP 기본값에 로드됩니다
    - `hooks/hooks.json`은 감지만 되며 실행되지는 않습니다
    - manifest의 사용자 정의 컴포넌트 경로는 추가 방식입니다(기본값을 대체하지 않고 확장함)

  </Accordion>

  <Accordion title="Cursor 번들">
    마커: `.cursor-plugin/plugin.json`

    선택적 콘텐츠: `skills/`, `.cursor/commands/`, `.cursor/agents/`, `.cursor/rules/`, `.cursor/hooks.json`, `.mcp.json`

    - `.cursor/commands/`는 Skills 콘텐츠로 취급됩니다
    - `.cursor/rules/`, `.cursor/agents/`, `.cursor/hooks.json`은 감지 전용입니다

  </Accordion>
</AccordionGroup>

## 감지 우선순위

OpenClaw는 먼저 네이티브 plugin 형식을 확인합니다:

1. `openclaw.plugin.json` 또는 `openclaw.extensions`가 있는 유효한 `package.json` — **네이티브 plugin**으로 취급
2. 번들 마커(`.codex-plugin/`, `.claude-plugin/`, 또는 기본 Claude/Cursor 레이아웃) — **번들**로 취급

디렉터리에 둘 다 있으면 OpenClaw는 네이티브 경로를 사용합니다. 이렇게 하면
이중 형식 패키지가 번들로 부분 설치되는 일을 방지할 수 있습니다.

## 런타임 dependency 및 정리

- 번들된 plugin 런타임 dependency는 OpenClaw 패키지 내부의
  `dist/*` 아래에 포함되어 배포됩니다. OpenClaw는 시작 시 번들된
  plugin에 대해 `npm install`을 실행하지 않습니다. 릴리스 파이프라인이
  완전한 번들 dependency payload를 포함해 배포할 책임을 집니다(사후 게시 검증 규칙은
  [Releasing](/ko/reference/RELEASING) 참조).

## 보안

번들은 네이티브 plugin보다 더 좁은 신뢰 경계를 가집니다:

- OpenClaw는 임의의 번들 런타임 모듈을 프로세스 내에서 로드하지 않습니다
- Skills 및 hook-pack 경로는 plugin 루트 내부에 있어야 합니다(경계 검사 적용)
- 설정 파일도 동일한 경계 검사를 사용해 읽습니다
- 지원되는 stdio MCP 서버는 하위 프로세스로 실행될 수 있습니다

이로 인해 번들은 기본적으로 더 안전하지만, 그래도
노출하는 기능에 대해서는 서드파티 번들을 신뢰된 콘텐츠로 취급해야 합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="번들은 감지되지만 capability가 실행되지 않음">
    `openclaw plugins inspect <id>`를 실행하세요. capability가 나열되어 있지만
    연결되지 않은 것으로 표시되면, 이는 설치가 깨진 것이 아니라 제품 제한입니다.
  </Accordion>

  <Accordion title="Claude 명령 파일이 나타나지 않음">
    번들이 활성화되어 있고 markdown 파일이 감지된
    `commands/` 또는 `skills/` 루트 안에 있는지 확인하세요.
  </Accordion>

  <Accordion title="Claude 설정이 적용되지 않음">
    `settings.json`의 내장 Pi 설정만 지원됩니다. OpenClaw는
    번들 설정을 원시 config patch로 취급하지 않습니다.
  </Accordion>

  <Accordion title="Claude hooks가 실행되지 않음">
    `hooks/hooks.json`은 감지 전용입니다. 실행 가능한 hooks가 필요하면
    OpenClaw hook-pack 레이아웃을 사용하거나 네이티브 plugin을 제공하세요.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [Install and Configure Plugins](/ko/tools/plugin)
- [Building Plugins](/ko/plugins/building-plugins) — 네이티브 plugin 만들기
- [Plugin Manifest](/ko/plugins/manifest) — 네이티브 manifest 스키마
