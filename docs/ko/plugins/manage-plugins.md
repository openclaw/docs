---
read_when:
    - 빠른 Plugin 설치, 목록 조회, 업데이트 또는 제거 예제가 필요합니다
    - ClawHub와 npm Plugin 배포 중에서 선택하려는 경우
    - Plugin 패키지를 게시하고 있습니다
sidebarTitle: Manage plugins
summary: OpenClaw Plugin 설치, 목록 조회, 제거, 업데이트 및 게시를 위한 빠른 예시
title: Plugin 관리
x-i18n:
    generated_at: "2026-05-02T22:19:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

대부분의 Plugin 워크플로는 몇 가지 명령으로 이루어집니다. 검색, 설치, Gateway 재시작,
확인, 그리고 Plugin이 더 이상 필요하지 않을 때 제거하는 것입니다.

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

`plugins list`는 콜드 인벤토리 확인입니다. OpenClaw가 구성, 매니페스트,
Plugin 레지스트리에서 발견할 수 있는 항목을 보여주지만, 이미 실행 중인
Gateway 프로세스가 Plugin 런타임을 가져왔다는 것을 증명하지는 않습니다.

## Plugin 설치

```bash
# ClawHub에서 Plugin 패키지를 검색합니다.
openclaw plugins search "calendar"

# 단순 패키지 사양은 먼저 ClawHub를 시도한 뒤 npm으로 폴백합니다.
openclaw plugins install <package>

# 하나의 소스를 강제합니다.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# 특정 버전 또는 dist-tag를 설치합니다.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex

# git 또는 로컬 개발 체크아웃에서 설치합니다.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Plugin 코드를 설치한 뒤에는 채널을 제공하는 Gateway를 다시 시작하세요.

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

도구, 훅, 서비스, Gateway 메서드 또는 Plugin 소유 CLI 명령과 같은 런타임
표면을 Plugin이 등록했다는 증명이 필요할 때 `inspect --runtime`을 사용하세요.

## Plugin 업데이트

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Plugin이 `@beta`와 같은 npm dist-tag에서 설치된 경우, 이후
`update <plugin-id>` 호출은 기록된 해당 태그를 재사용합니다. 명시적인 npm
사양을 전달하면 향후 업데이트를 위해 추적되는 설치가 해당 사양으로 전환됩니다.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

두 번째 명령은 이전에 정확한 버전 또는 태그로 고정되었던 Plugin을 레지스트리의
기본 릴리스 라인으로 되돌립니다.

`openclaw update`가 베타 채널에서 실행되면, 기본 라인의 npm 및 ClawHub
Plugin 기록은 먼저 일치하는 Plugin `@beta` 릴리스를 시도합니다. 해당 베타
릴리스가 없으면 OpenClaw는 기록된 기본/최신 사양으로 폴백합니다.
정확한 버전과 `@rc` 또는 `@beta` 같은 명시적 태그는 유지됩니다.

## Plugin 제거

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

제거는 Plugin의 구성 항목, Plugin 인덱스 레코드, 허용/거부 목록 항목, 그리고
해당되는 경우 연결된 로드 경로를 제거합니다. 관리형 설치 디렉터리는
`--keep-files`를 전달하지 않는 한 제거됩니다.

## Plugin 게시

외부 Plugin을 [ClawHub](https://clawhub.ai), npmjs.com 또는 둘 다에 게시할 수
있습니다.

### ClawHub에 게시

ClawHub는 OpenClaw Plugin을 위한 주요 공개 검색 표면입니다. 사용자는 설치 전에
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

단순 형식도 여전히 ClawHub를 먼저 확인합니다.

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

동일한 패키지가 ClawHub에서도 제공되는 경우, `npm:`은 ClawHub 조회를 건너뛰고
npm 확인을 강제합니다.

## 소스 선택

- **ClawHub**: OpenClaw 네이티브 검색, 스캔 요약, 버전, 설치 힌트가 필요할 때
  사용하세요.
- **npmjs.com**: 이미 JavaScript 패키지를 배포하고 있거나 npm
  dist-tag/비공개 레지스트리 워크플로가 필요할 때 사용하세요.
- **Git**: 브랜치, 태그 또는 커밋에서 직접 설치하려는 경우 사용하세요.
- **로컬 경로**: 같은 머신에서 Plugin을 개발하거나 테스트 중일 때 사용하세요.

## 관련 항목

- [Plugins](/ko/tools/plugin) - 개요 및 문제 해결
- [`openclaw plugins`](/ko/cli/plugins) - 전체 CLI 참조
- [ClawHub](/ko/tools/clawhub) - 게시 및 레지스트리 작업
- [Building plugins](/ko/plugins/building-plugins) - Plugin 패키지 만들기
- [Plugin manifest](/ko/plugins/manifest) - 매니페스트 및 패키지 메타데이터
