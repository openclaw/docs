---
doc-schema-version: 1
read_when:
    - 빠른 Plugin 목록, 설치, 업데이트, 검사 또는 제거 예시가 필요합니다
    - Plugin 설치 소스를 선택하려는 경우
    - Plugin 패키지를 게시하기 위한 올바른 참조가 필요합니다
sidebarTitle: Manage plugins
summary: OpenClaw Plugin을 나열, 설치, 업데이트, 검사 및 제거하는 빠른 예제
title: Plugin 관리
x-i18n:
    generated_at: "2026-06-27T17:46:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dd0c1143c6312603311931cbbdc63069a44bc5ec487e2a46b0266b86a556da4e
    source_path: plugins/manage-plugins.md
    workflow: 16
---

일반적인 Plugin 관리 명령에는 이 페이지를 사용하세요. 전체 명령
계약, 플래그, 소스 선택 규칙, 예외 사례는
[`openclaw plugins`](/ko/cli/plugins)를 참조하세요.

대부분의 설치 워크플로는 다음과 같습니다.

1. 패키지 찾기
2. ClawHub, npm, git 또는 로컬 경로에서 설치하기
3. 관리형 Gateway가 자동으로 재시작되도록 두거나, 비관리형일 때 수동으로 재시작하기
4. Plugin의 런타임 등록 확인하기

## Plugin 목록 표시 및 검색

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search "calendar"
```

스크립트에는 `--json`을 사용하세요.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list`는 콜드 인벤토리 확인입니다. OpenClaw가 구성, 매니페스트,
Plugin 레지스트리에서 발견할 수 있는 항목을 보여주며, 이미 실행 중인
Gateway가 Plugin 런타임을 가져왔다는 것을 증명하지는 않습니다. JSON 출력에는
레지스트리 진단 정보와 Plugin 패키지가 `dependencies` 또는
`optionalDependencies`를 선언한 경우 각 Plugin의 정적 `dependencyStatus`가
포함됩니다.

`plugins search`는 설치 가능한 Plugin 패키지를 ClawHub에서 조회하고
`openclaw plugins install clawhub:<package>` 같은 설치 힌트를 출력합니다.

## Plugin 설치

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Install from ClawHub.
openclaw plugins install clawhub:<package>
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta

# Install from npm.
openclaw plugins install npm:<package>
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from a local npm pack artifact.
openclaw plugins install npm-pack:<path.tgz>

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

베어 패키지 명세는 실행 전환 기간 동안 npm에서 설치됩니다. 결정적인 소스 선택이
필요할 때는 `clawhub:`, `npm:`, `git:`, 또는 `npm-pack:`을 사용하세요.
베어 이름이 공식 Plugin ID와 일치하면 OpenClaw가 카탈로그 항목을 직접 설치할 수
있습니다.

기존 설치 대상을 의도적으로 덮어쓰려는 경우에만 `--force`를 사용하세요. 추적되는
npm, ClawHub 또는 hook-pack 설치를 일반적으로 업그레이드하려면
`openclaw plugins update`를 사용하세요.

## 재시작 및 검사

Plugin 코드를 설치, 업데이트 또는 제거한 뒤에는 구성 다시 로드가 활성화된 실행 중인
관리형 Gateway가 자동으로 재시작됩니다. Gateway가 관리형이 아니거나 다시 로드가
비활성화되어 있으면, 라이브 런타임 표면을 확인하기 전에 직접 재시작하세요.

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Plugin이 도구, 훅, 서비스, Gateway 메서드, HTTP 라우트 또는 Plugin 소유 CLI
명령 같은 런타임 표면을 등록했다는 증거가 필요할 때는 `inspect --runtime`을
사용하세요. 일반 `inspect`와 `list`는 콜드 매니페스트, 구성, 레지스트리
확인입니다.

## Plugin 업데이트

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
openclaw plugins update <plugin-id> --dry-run
```

Plugin ID를 전달하면 OpenClaw는 추적된 설치 명세를 재사용합니다. `@beta` 같은
저장된 dist-tag와 정확히 고정된 버전은 이후 `update <plugin-id>` 실행에서도 계속
사용됩니다.

`openclaw plugins update --all`은 일괄 유지 관리 경로입니다. 일반적인 추적 설치
명세는 계속 존중하지만, 신뢰할 수 있는 공식 OpenClaw Plugin 레코드는 오래된 정확한
공식 패키지에 머무르는 대신 현재 공식 카탈로그 대상으로 동기화될 수 있습니다.
`update.channel`이 `beta`로 설정되어 있으면 해당 일괄 공식 동기화는 베타 채널
컨텍스트를 사용합니다. 정확하거나 태그가 지정된 공식 명세를 의도적으로 그대로
유지하려면 대상 지정 `update <plugin-id>`를 사용하세요.

npm 설치의 경우 명시적인 패키지 명세를 전달해 추적 레코드를 전환할 수 있습니다.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

두 번째 명령은 이전에 정확한 버전이나 태그로 고정되었던 Plugin을 레지스트리의
기본 릴리스 라인으로 되돌립니다.

`openclaw update`가 베타 채널에서 실행되면 Plugin 레코드는 일치하는 `@beta`
릴리스를 선호할 수 있습니다. 정확한 폴백 및 고정 규칙은
[`openclaw plugins`](/ko/cli/plugins#update)를 참조하세요.

## Plugin 제거

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
```

제거는 Plugin의 구성 항목, 영속 Plugin 인덱스 레코드, 허용/거부 목록 항목, 해당되는
경우 연결된 로드 경로를 제거합니다. `--keep-files`를 전달하지 않으면 관리형 설치
디렉터리가 제거됩니다. 제거로 Plugin 소스가 변경되면 실행 중인 관리형 Gateway가
자동으로 재시작됩니다.

Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 Plugin 설치, 업데이트, 제거, 활성화,
비활성화 명령이 비활성화됩니다. 대신 설치용 Nix 소스에서 이러한 선택을 관리하세요.

## 소스 선택

| 소스        | 사용할 때                                                                     | 예시                                                           |
| ----------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ClawHub     | OpenClaw 네이티브 탐색, 스캔 요약, 버전, 힌트가 필요할 때                     | `openclaw plugins install clawhub:<package>`                   |
| npmjs.com   | 이미 JavaScript 패키지를 배포하거나 npm dist-tag/private registry가 필요할 때 | `openclaw plugins install npm:@acme/openclaw-plugin`           |
| git         | 저장소의 브랜치, 태그 또는 커밋이 필요할 때                                   | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>` |
| 로컬 경로   | 같은 머신에서 Plugin을 개발하거나 테스트할 때                                 | `openclaw plugins install --link ./my-plugin`                  |
| npm pack    | npm 설치 의미 체계를 통해 로컬 패키지 아티팩트를 검증할 때                    | `openclaw plugins install npm-pack:<path.tgz>`                 |
| marketplace | Claude 호환 marketplace Plugin을 설치할 때                                    | `openclaw plugins install <plugin> --marketplace <source>`     |

관리형 로컬 경로 설치는 Plugin 디렉터리 또는 아카이브여야 합니다. 독립 실행형 Plugin
파일은 `plugins install`로 설치하지 말고 `plugins.load.paths`에 넣으세요.

## Plugin 게시

ClawHub는 OpenClaw Plugin의 주요 공개 탐색 표면입니다. 사용자가 설치하기 전에
Plugin 메타데이터, 버전 기록, 레지스트리 스캔 결과, 설치 힌트를 찾게 하려면 여기에
게시하세요.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

네이티브 npm Plugin은 게시 전에 Plugin 매니페스트와 패키지 메타데이터를 포함해야
합니다.

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

이 페이지를 게시 참조로 취급하지 말고 전체 게시 계약은 다음 페이지를 사용하세요.

- [ClawHub 게시](/ko/clawhub/publishing)는 소유자, 범위, 릴리스, 리뷰, 패키지 검증,
  패키지 이전을 설명합니다.
- [Plugin 빌드](/ko/plugins/building-plugins)는 Plugin 패키지 형태와 첫 게시
  워크플로를 보여줍니다.
- [Plugin 매니페스트](/ko/plugins/manifest)는 네이티브 Plugin 매니페스트 필드를
  정의합니다.

동일한 패키지가 ClawHub와 npm 모두에서 제공되는 경우, 한 소스를 강제로 사용해야
할 때 명시적인 `clawhub:` 또는 `npm:` 접두사를 사용하세요.

## 관련 항목

- [Plugins](/ko/tools/plugin) - 설치, 구성, 재시작 및 문제 해결
- [`openclaw plugins`](/ko/cli/plugins) - 전체 CLI 참조
- [커뮤니티 Plugin](/ko/plugins/community) - 공개 탐색 및 ClawHub 게시
- [ClawHub](/ko/clawhub/cli) - 레지스트리 CLI 작업
- [Plugin 빌드](/ko/plugins/building-plugins) - Plugin 패키지 만들기
- [Plugin 매니페스트](/ko/plugins/manifest) - 매니페스트 및 패키지 메타데이터
