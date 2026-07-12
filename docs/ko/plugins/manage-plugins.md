---
doc-schema-version: 1
read_when:
    - Control UI에서 Plugin을 탐색, 설치, 활성화 또는 비활성화하려는 경우
    - 빠르게 Plugin 목록을 확인하고 설치, 업데이트, 검사 또는 제거하는 예시가 필요합니다
    - Plugin 설치 소스를 선택하려고 합니다
    - Plugin 패키지 게시에 적합한 참고 자료가 필요한 경우
sidebarTitle: Manage plugins
summary: Control UI 또는 CLI에서 OpenClaw Plugin 관리하기
title: Plugin 관리하기
x-i18n:
    generated_at: "2026-07-12T01:00:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b235dfca7ef815cc8b0f82db6a9ba8cb344b00612ffd77ca67c8bbd379bdf2a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Control UI는 일반적인 검색, 설치, 활성화 및 비활성화
워크플로를 지원합니다. CLI는 업데이트, 제거, 고급 구성 및 명시적인
설치 소스 제어 기능을 추가로 제공합니다. 전체 명령 계약, 플래그, 소스 선택
규칙 및 예외 사례는 [`openclaw plugins`](/ko/cli/plugins)를 참조하세요.

일반적인 CLI 워크플로는 패키지를 찾고, ClawHub, npm, git 또는
로컬 경로에서 설치하고, 관리형 Gateway가 자동으로 재시작되도록 하거나 수동으로 재시작한 다음,
Plugin의 런타임 등록을 확인하는 것입니다.

## Control UI 사용

Control UI에서 **Plugin**을 열거나, 구성된 Control UI 기본 경로를 기준으로
`/settings/plugins`를 사용하세요. 예를 들어 기본 경로가 `/openclaw`이면
`/openclaw/settings/plugins`를 사용합니다. 이 페이지에는 두 개의 탭이 있습니다.

- **설치됨**에는 범주별(채널,
  모델 제공자, 메모리, 도구)로 그룹화된 전체 로컬 목록이 표시됩니다. 각 행을 열면 세부 정보 보기가 나타나며, 오버플로
  (`…`) 메뉴에서 Plugin을 활성화하거나 비활성화할 수 있고, 외부에서 설치한
  Plugin에는 **제거** 옵션도 제공됩니다. 이 탭에는 구성된
  [MCP 서버](/ko/cli/mcp)도 표시되며, 동일한 메뉴 기반의 활성화, 비활성화 및 제거
  작업을 통해 Gateway 구성의 `mcp.servers`를 편집합니다.
- **검색**은 스토어입니다. OpenClaw에 포함된 추천 Plugin, 공식
  외부 Plugin 및 선별된 커넥터 모음을 제공합니다. 커넥터 카드는 클릭 한 번으로
  호스팅된 MCP 서버를 추가하거나(GitHub, Notion, Linear, Sentry,
  Home Assistant), 미리 입력된 ClawHub 검색으로 이동합니다. 검색
  상자에 입력하면 [ClawHub](https://clawhub.ai/plugins)를 인라인으로 조회하고 다운로드 횟수와 소스 검증 배지가 포함된 **ClawHub
  제공** 섹션을 추가합니다.

포함된 Plugin은 패키지를 설치할 필요가 없습니다. 해당 메뉴 작업은 **활성화**
또는 **비활성화**입니다. 예를 들어 Workboard는 OpenClaw에 포함되어 있으며 기본적으로
비활성화되어 있으므로 **활성화**를 선택하여 켜세요. 번들 Plugin은
제거할 수 없으며 비활성화만 가능합니다.

카탈로그 및 검색에 접근하려면 `operator.read`가 필요합니다. 설치, 활성화, 비활성화,
제거 및 MCP 서버 변경에는 `operator.admin`이 필요합니다. ClawHub 설치는
Gateway가 수행하며 신뢰성, 무결성 및 Plugin 설치
정책 검사를 유지합니다.

Plugin 코드를 설치하거나 제거하려면 Gateway를 재시작해야 합니다. 설치된 Plugin과 현재
Gateway 런타임이 지원하는 경우 활성화 상태 변경은 재시작 없이
적용할 수 있으며, 그렇지 않으면 UI에서 재시작이 필요하다고 안내합니다.
OAuth 기반 MCP 커넥터는 추가된 후에도 CLI에서 일회성으로 `openclaw mcp login <name>`을
실행해야 합니다.

Control UI에서는 임의의 npm, git 또는 로컬 경로 소스에서 설치하거나,
Plugin을 업데이트하거나, 상세한 Plugin 구성을 제공하지 않습니다. 이러한 작업에는
아래의 CLI 워크플로를 사용하세요.

## Plugin 목록 조회 및 검색

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

스크립트용 `--json`:

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list`는 콜드 인벤토리 검사입니다. 즉, OpenClaw가
구성, 매니페스트 및 영구 저장된 Plugin 레지스트리에서 검색할 수 있는 항목을 확인합니다. 이미 실행 중인
Gateway가 Plugin 런타임을 가져왔음을 증명하지는 않습니다. JSON 출력에는
레지스트리 진단 정보와 각 Plugin의 `dependencyStatus`(선언된
`dependencies`/`optionalDependencies`가 디스크에서 확인되는지 여부)가 포함됩니다.

`plugins search`는 설치 가능한 Plugin 패키지를 ClawHub에서 검색하고 결과마다
설치 힌트(`openclaw plugins install clawhub:<package>`)를 출력합니다.

## Plugin 활성화 및 비활성화

```bash
openclaw plugins enable <plugin-id>
openclaw plugins disable <plugin-id>
```

설치된 파일은 건드리지 않고 Plugin의 구성 항목을 전환합니다. 일부
번들 Plugin(번들 모델/음성 제공자, 번들 브라우저 Plugin)은
기본적으로 활성화되며, 그 외에는 설치 후 `enable`을 실행해야 합니다.

## Plugin 설치

```bash
# ClawHub에서 Plugin 패키지를 검색합니다.
openclaw plugins search "calendar"

# ClawHub에서 설치합니다.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# npm에서 설치합니다.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# 로컬 npm-pack 아티팩트에서 설치합니다.
openclaw plugins install npm-pack:<path.tgz>

# git 또는 로컬 개발 체크아웃에서 설치합니다.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

접두사 없는 패키지 사양은 출시 전환 기간에 npm에서 설치됩니다. 단,
이름이 번들 또는 공식 Plugin ID와 일치하면 OpenClaw는
대신 해당 로컬/공식 복사본을 사용합니다. 결정론적으로 소스를 선택하려면 `clawhub:`, `npm:`, `git:` 또는
`npm-pack:`을 사용하세요.

다른 소스에서 기존 설치 대상을 덮어쓸 때만 `--force`를 사용하세요.
추적 중인 npm, ClawHub 또는 훅 팩 설치의 일반적인 업그레이드에는
대신 `openclaw plugins update`를 사용하세요. `--force`는
`--link`와 함께 사용할 수 없습니다.

## 재시작 및 검사

구성 다시 로드가 활성화된 실행 중인 관리형 Gateway는 Plugin 코드를 설치, 업데이트 또는 제거한 후
자동으로 재시작됩니다. Gateway가 비관리형이거나 다시 로드가 비활성화된 경우, 실제
런타임 표면을 확인하기 전에 직접 재시작하세요.

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

`inspect --runtime`은 Plugin 모듈을 로드하고 해당 모듈이 런타임
표면(도구, 훅, 서비스, Gateway 메서드, HTTP 경로, Plugin 소유
CLI 명령)을 등록했음을 증명합니다. 일반 `inspect`와 `list`는 콜드 매니페스트/구성/레지스트리
검사만 수행합니다.

## Plugin 업데이트

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Plugin ID를 전달하면 추적 중인 설치 사양을 재사용합니다. 저장된 배포 태그
(`@beta`)와 정확히 고정된 버전은 이후의 `update <plugin-id>`
실행에도 유지됩니다.

`openclaw plugins update --all`은 일괄 유지 관리 경로입니다. 일반적인
추적 설치 사양은 그대로 준수하지만, 신뢰할 수 있는 공식 OpenClaw
Plugin 레코드는 오래된 정확한 공식 패키지 버전에 고정된 상태로
남는 대신 현재 공식 카탈로그 대상으로 동기화됩니다. `update.channel`이
`beta`이면 해당 동기화는 베타 릴리스 계열을 우선합니다. 정확한 버전 또는 태그가 지정된 공식 사양을
변경하지 않으려면 대상이 지정된 `update <plugin-id>`를 사용하세요.

npm 설치의 경우 추적 레코드를 전환하려면 명시적인 패키지 사양을
전달하세요.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

두 번째 명령은 이전에 정확한 버전 또는 태그로 고정된 Plugin을
레지스트리의 기본 릴리스 계열로 되돌립니다.

정확한 대체 및 고정 규칙은 [`openclaw plugins`](/ko/cli/plugins#update)를
참조하세요.

## Plugin 제거

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

제거 작업은 Plugin의 구성 항목, 영구 저장된 Plugin 인덱스 레코드,
허용/거부 목록 항목 및 해당되는 경우 연결된 `plugins.load.paths` 항목을
제거합니다. `--keep-files`를 전달하지 않으면 관리형 설치 디렉터리도 제거됩니다.
제거로 Plugin 소스가 변경되면 실행 중인 관리형 Gateway가 자동으로 재시작됩니다.

Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 Plugin 설치, 업데이트, 제거,
활성화 및 비활성화가 모두 차단됩니다. 대신 설치용 Nix 소스에서
이러한 선택을 관리하세요.

## 소스 선택

| 소스        | 사용 시점                                                                    | 예시                                                           |
| ----------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | OpenClaw 네이티브 검색, 검사 요약, 버전 및 힌트가 필요한 경우               | `openclaw plugins install clawhub:<package>`                   |
| git         | 저장소의 브랜치, 태그 또는 커밋을 사용하려는 경우                            | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 로컬 경로   | 동일한 컴퓨터에서 Plugin을 개발하거나 테스트하는 경우                        | `openclaw plugins install --link ./my-plugin`                  |
| 마켓플레이스 | Claude 호환 마켓플레이스 Plugin을 설치하는 경우                             | `openclaw plugins install <plugin> --marketplace <source>`     |
| npm 팩      | npm 설치 의미 체계를 통해 로컬 패키지 아티팩트를 검증하는 경우               | `openclaw plugins install npm-pack:<path.tgz>`                 |
| npmjs.com   | 이미 JavaScript 패키지를 배포 중이거나 npm 배포 태그/비공개 레지스트리가 필요한 경우 | `openclaw plugins install npm:@acme/openclaw-plugin`           |

관리형 로컬 경로 설치 대상은 Plugin 디렉터리 또는 아카이브여야 합니다.
독립 실행형 Plugin 파일은 `plugins install`로 설치하지 말고
`plugins.load.paths`에 추가하세요.

## Plugin 게시

ClawHub는 OpenClaw Plugin의 기본 공개 검색 표면입니다. 사용자가 설치하기 전에
Plugin 메타데이터, 버전 기록, 레지스트리 검사 결과 및 설치 힌트를
찾을 수 있도록 하려면 ClawHub에 게시하세요.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

네이티브 npm Plugin은 게시하기 전에 Plugin 매니페스트(`openclaw.plugin.json`)와
`package.json` 메타데이터를 포함해야 합니다.

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

이 페이지를 게시 참조 문서로 취급하지 말고 전체 게시 계약은 다음 페이지를
참조하세요.

- [ClawHub 게시](/ko/clawhub/publishing)에서는 소유자, 범위,
  릴리스, 검토, 패키지 검증 및 패키지 이전을 설명합니다.
- [Plugin 빌드](/ko/plugins/building-plugins)에서는 전체 Plugin
  패키지 구조(`openclaw.plugin.json` 포함)와 최초 게시
  워크플로를 보여 줍니다.
- [Plugin 매니페스트](/ko/plugins/manifest)에서는 네이티브 Plugin 매니페스트
  필드를 정의합니다.

동일한 패키지를 ClawHub와 npm에서 모두 사용할 수 있다면 명시적인
`clawhub:` 또는 `npm:` 접두사를 사용하여 소스를 강제 지정하세요.

## 관련 문서

- [Plugin](/ko/tools/plugin) - 설치, 구성, 재시작 및 문제 해결
- [`openclaw plugins`](/ko/cli/plugins) - 전체 CLI 참조
- [커뮤니티 Plugin](/ko/plugins/community) - 공개 검색 및 ClawHub 게시
- [ClawHub](/ko/clawhub/cli) - 레지스트리 CLI 작업
- [Plugin 빌드](/ko/plugins/building-plugins) - Plugin 패키지 만들기
- [Plugin 매니페스트](/ko/plugins/manifest) - 매니페스트 및 패키지 메타데이터
