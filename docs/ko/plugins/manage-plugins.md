---
read_when:
    - 빠른 Plugin 설치, 목록 조회, 업데이트 또는 제거 예시가 필요한 경우
    - ClawHub와 npm Plugin 배포 중에서 선택하려는 경우
    - Plugin 패키지를 게시하고 있습니다
sidebarTitle: Manage plugins
summary: OpenClaw Plugin의 설치, 목록 조회, 제거, 업데이트 및 게시를 위한 빠른 예시
title: Plugin 관리
x-i18n:
    generated_at: "2026-05-06T17:59:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

대부분의 Plugin 워크플로는 몇 가지 명령으로 이루어집니다. 검색, 설치, Gateway 재시작,
확인, 그리고 더 이상 Plugin이 필요하지 않을 때 제거입니다.

## Plugin 목록

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

스크립트에는 `--json`을 사용하세요. Plugin 패키지가 `dependencies` 또는
`optionalDependencies`를 선언한 경우, 레지스트리 진단과 각 Plugin의 정적
`dependencyStatus`가 포함됩니다.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list`는 콜드 인벤토리 검사입니다. OpenClaw가 구성, 매니페스트,
Plugin 레지스트리에서 발견할 수 있는 항목을 보여주지만, 이미 실행 중인 Gateway
프로세스가 Plugin 런타임을 가져왔다는 것을 증명하지는 않습니다.

## Plugin 설치

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Plugin 코드를 설치한 뒤, 채널을 제공하는 Gateway를 재시작하세요.

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

도구, 훅, 서비스, Gateway 메서드, Plugin 소유 CLI 명령과 같은 런타임 표면을
Plugin이 등록했다는 증명이 필요할 때는 `inspect --runtime`을 사용하세요.

## Plugin 업데이트

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Plugin이 `@beta` 같은 npm dist-tag에서 설치된 경우, 이후
`update <plugin-id>` 호출은 기록된 해당 태그를 재사용합니다. 명시적인 npm 사양을
전달하면 추적되는 설치가 향후 업데이트에 해당 사양을 사용하도록 전환됩니다.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

두 번째 명령은 이전에 정확한 버전이나 태그로 고정된 Plugin을 레지스트리의 기본
릴리스 라인으로 되돌립니다.

베타 채널에서 `openclaw update`가 실행되면, 기본 라인의 npm 및 ClawHub Plugin
레코드는 먼저 일치하는 Plugin `@beta` 릴리스를 시도합니다. 해당 베타 릴리스가
없으면 OpenClaw는 기록된 기본/최신 사양으로 대체합니다. npm Plugin의 경우,
베타 패키지가 존재하지만 설치 검증에 실패해도 OpenClaw는 대체합니다. 정확한 버전과
`@rc` 또는 `@beta` 같은 명시적 태그는 보존됩니다.

## Plugin 제거

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

제거는 해당되는 경우 Plugin의 구성 항목, Plugin 인덱스 레코드, 허용/거부 목록
항목, 연결된 로드 경로를 제거합니다. 관리형 설치 디렉터리는 `--keep-files`를
전달하지 않는 한 제거됩니다.

Nix 모드(`OPENCLAW_NIX_MODE=1`)에서는 Plugin 설치, 업데이트, 제거, 활성화,
비활성화 명령이 비활성화됩니다. 대신 설치의 Nix 소스에서 이러한 선택을
관리하세요. nix-openclaw의 경우 agent 우선
[빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 사용하세요.

## Plugin 게시

외부 Plugin은 [ClawHub](https://clawhub.ai), npmjs.com 또는 둘 다에 게시할 수
있습니다.

### ClawHub에 게시

ClawHub는 OpenClaw Plugin을 위한 기본 공개 검색 표면입니다. 사용자는 설치 전에
검색 가능한 메타데이터, 버전 기록, 레지스트리 스캔 결과를 확인할 수 있습니다.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

사용자는 다음으로 ClawHub에서 설치합니다.

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

축약 형식도 여전히 ClawHub를 먼저 확인합니다.

### npmjs.com에 게시

네이티브 npm Plugin에는 Plugin 매니페스트와 `package.json` OpenClaw 엔트리포인트
메타데이터가 포함되어야 합니다.

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
```

사용자는 npm 전용으로 다음과 같이 설치합니다.

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

같은 패키지가 ClawHub에서도 제공되는 경우, `npm:`은 ClawHub 조회를 건너뛰고 npm
해결을 강제합니다.

## 소스 선택

- **ClawHub**: OpenClaw 네이티브 검색, 스캔 요약, 버전, 설치 힌트가 필요할 때 사용하세요.
- **npmjs.com**: 이미 JavaScript 패키지를 배포하고 있거나 npm dist-tags/비공개 레지스트리 워크플로가 필요할 때 사용하세요.
- **Git**: 브랜치, 태그, 커밋에서 직접 설치하려는 경우 사용하세요.
- **로컬 경로**: 같은 머신에서 Plugin을 개발하거나 테스트할 때 사용하세요.

## 관련 항목

- [Plugin](/ko/tools/plugin) - 개요 및 문제 해결
- [`openclaw plugins`](/ko/cli/plugins) - 전체 CLI 참조
- [ClawHub](/ko/tools/clawhub) - 게시 및 레지스트리 작업
- [Plugin 빌드하기](/ko/plugins/building-plugins) - Plugin 패키지 만들기
- [Plugin 매니페스트](/ko/plugins/manifest) - 매니페스트 및 패키지 메타데이터
