---
read_when:
    - Plugin 패키지 설치를 디버깅하고 있습니다
    - Plugin 시작, doctor 또는 패키지 관리자 설치 동작을 변경하고 있습니다
    - 패키징된 OpenClaw 설치 또는 번들 Plugin 매니페스트를 유지 관리하는 경우
sidebarTitle: Dependencies
summary: OpenClaw가 Plugin 패키지를 설치하고 Plugin 의존성을 해석하는 방식
title: Plugin 의존성 확인
x-i18n:
    generated_at: "2026-07-04T15:11:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc6cc80bfe4e4c06ca0e99877c0d4148861ff88366ae233c254aac56c7cdf6d
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw는 Plugin 의존성 작업을 설치/업데이트 시점에 유지합니다. 런타임 로딩은
패키지 관리자를 실행하거나, 의존성 트리를 복구하거나, OpenClaw
패키지 디렉터리를 변경하지 않습니다.

## 책임 분리

Plugin 패키지는 자체 의존성 그래프를 소유합니다.

- 런타임 의존성은 Plugin 패키지의 `dependencies` 또는
  `optionalDependencies`에 있습니다
- SDK/코어 import는 peer이거나 OpenClaw가 제공하는 import입니다
- 로컬 개발 Plugin은 이미 설치된 자체 의존성을 가져옵니다
- npm 및 git Plugin은 OpenClaw가 소유한 패키지 루트에 설치됩니다

OpenClaw는 Plugin 수명 주기만 소유합니다.

- Plugin 소스 발견
- 명시적으로 요청된 경우 패키지 설치 또는 업데이트
- 설치 메타데이터 기록
- Plugin entrypoint 로드
- 의존성이 누락된 경우 실행 가능한 오류와 함께 실패

## 설치 루트

OpenClaw는 소스별 안정적인 루트를 사용합니다.

- npm 패키지는
  `~/.openclaw/npm/projects/<encoded-package>` 아래의 Plugin별 프로젝트에 설치됩니다
- git 패키지는 `~/.openclaw/git` 아래에 clone됩니다
- 로컬/경로/아카이브 설치는 의존성 복구 없이 복사되거나 참조됩니다

npm 설치는 해당 Plugin별 프로젝트 루트에서 다음과 같이 실행됩니다.

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`는 로컬 npm-pack tarball에 대해
동일한 Plugin별 npm 프로젝트 루트를 사용합니다. OpenClaw는 tarball의 npm
메타데이터를 읽고, 복사된 `file:` 의존성으로 관리형 프로젝트에 추가하고,
일반 npm install을 실행한 다음, Plugin을 신뢰하기 전에 설치된 lockfile 메타데이터를
검증합니다.
이는 로컬 pack artifact가 시뮬레이션하는 registry artifact처럼 동작해야 하는
패키지 승인 및 릴리스 후보 증명용입니다.

공식 또는 외부 Plugin 패키지를 게시 전에 테스트할 때는 `npm-pack:`을 사용하세요.
raw 아카이브 또는 경로 설치는 로컬 디버깅에 유용하지만, 설치된 npm 또는 ClawHub
패키지와 동일한 의존성 경로를 증명하지는 않습니다.
`npm-pack:`은 관리형 패키지 설치 형태를 증명합니다. 그 자체만으로는
Plugin이 catalog에 연결된 공식 콘텐츠라는 증거가 아닙니다.

동작이 번들 Plugin 또는 신뢰할 수 있는 공식 Plugin 상태에 의존하는 경우,
로컬 패키지 증명을 catalog 기반 공식 설치 또는 공식 신뢰를 기록하는 게시된
패키지 경로와 함께 사용하세요. 권한 있는 helper 접근과 신뢰할 수 있는 공식 범위
처리는 해당 신뢰된 설치 경로에서 검증해야 하며, 로컬 tarball 설치에서 추론해서는
안 됩니다.

Plugin이 런타임에 import 누락으로 실패하면, 관리형 프로젝트를 수동으로 복구하지
말고 패키지 manifest를 수정하세요. 런타임 import는 Plugin 패키지의
`dependencies` 또는 `optionalDependencies`에 속합니다. `devDependencies`는
관리형 런타임 프로젝트에 설치되지 않습니다. `~/.openclaw/npm/projects/<encoded-package>`
안에서 로컬 `npm install`을 실행하면 임시 진단은 풀 수 있지만, 다음 설치 또는 업데이트가
패키지 메타데이터에서 프로젝트를 다시 만들기 때문에 패키지 승인 증명은 아닙니다.

npm은 전이 의존성을 Plugin 패키지 옆의 Plugin별 프로젝트
`node_modules`로 hoist할 수 있습니다. OpenClaw는 설치를 신뢰하기 전에 관리형
프로젝트 루트를 검사하고, uninstall 중에 해당 프로젝트를 제거하므로 hoist된 런타임
의존성은 해당 Plugin의 정리 경계 안에 남습니다.

게시된 npm Plugin 패키지는 `npm-shrinkwrap.json`을 포함할 수 있습니다. npm은
설치 중에 해당 게시 가능한 lockfile을 사용하며, OpenClaw의 관리형 npm 프로젝트
루트는 일반 npm install 경로를 통해 이를 지원합니다. OpenClaw가 소유한 게시 가능
Plugin 패키지는 해당 Plugin 패키지의 게시된 의존성 그래프에서 생성된 패키지 로컬
shrinkwrap을 포함해야 합니다.

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

generator는 Plugin `devDependencies`를 제거하고, workspace override 정책을
적용하며, 각 `publishToNpm` Plugin에 대해 `extensions/<id>/npm-shrinkwrap.json`을
작성합니다. 서드파티 Plugin 패키지도 shrinkwrap을 포함할 수 있습니다.
OpenClaw는 커뮤니티 패키지에 이를 요구하지 않지만, 존재하는 경우 npm은 이를
따릅니다.

로컬 패키지를 릴리스 후보 증명으로 취급하기 전에, 설치될 tarball을 검사하세요.

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

의존성 변경의 경우, 프로덕션 설치가 dev 의존성 없이 런타임 패키지를 해석할 수
있는지도 검증하세요.

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw가 소유한 npm Plugin 패키지는 명시적인 `bundledDependencies`와 함께
게시할 수도 있습니다. npm publish 경로는 런타임 의존성 이름 목록을 overlay하고,
게시된 패키지 manifest에서 dev 전용 workspace 메타데이터를 제거하며, 패키지 로컬
런타임 의존성에 대해 script 없는 npm install을 실행한 다음, 해당 의존성 파일을
포함한 Plugin tarball을 pack하거나 게시합니다. Codex 및 ACP 런타임을 포함한
native-heavy 패키지는 `openclaw.release.bundleRuntimeDependencies: false`로
opt out합니다. 이러한 패키지는 여전히 shrinkwrap을 포함하지만, 모든 플랫폼 binary를
Plugin tarball에 포함하는 대신 설치 중에 npm이 런타임 의존성을 해석합니다. 루트
`openclaw` 패키지는 전체 의존성 트리를 bundle하지 않습니다.

`openclaw/plugin-sdk/*`를 import하는 Plugin은 `openclaw`를 peer 의존성으로
선언합니다. OpenClaw는 npm이 host 패키지의 별도 registry copy를 관리형 프로젝트에
설치하도록 허용하지 않습니다. 오래된 host 패키지가 해당 Plugin 내부의 npm peer
해석에 영향을 줄 수 있기 때문입니다. 관리형 npm 설치는 npm peer 해석/구체화를
건너뛰며, OpenClaw는 설치 또는 업데이트 후 host peer를 선언하는 설치된 패키지에
대해 Plugin 로컬 `node_modules/openclaw` 링크를 다시 보장합니다.

git 설치는 repository를 clone하거나 refresh한 다음 다음을 실행합니다.

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

그런 다음 설치된 Plugin은 해당 패키지 디렉터리에서 로드되므로, 패키지 로컬 및 상위
`node_modules` 해석은 일반 Node 패키지와 같은 방식으로 작동합니다.

## 로컬 Plugin

로컬 Plugin은 개발자가 제어하는 디렉터리로 취급됩니다. OpenClaw는 이들에 대해
`npm install`, `pnpm install` 또는 의존성 복구를 실행하지 않습니다. 로컬
Plugin에 의존성이 있으면, 로드하기 전에 해당 Plugin 안에 설치하세요.

서드파티 TypeScript 로컬 Plugin은 비상 Jiti 경로를 사용할 수 있습니다. 패키지된
JavaScript Plugin과 번들 내부 Plugin은 Jiti 대신 native import/require를 통해
로드됩니다.

## 시작 및 reload

Gateway 시작과 config reload는 Plugin 의존성을 설치하지 않습니다. 이들은
Plugin 설치 기록을 읽고, entrypoint를 계산한 뒤, 이를 로드합니다.

런타임에 의존성이 누락된 경우 Plugin 로드는 실패하며, 오류는 operator에게
명시적인 수정 방법을 안내해야 합니다.

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`는 레거시 OpenClaw 생성 의존성 상태를 정리하고, config에서
참조하지만 로컬 설치 기록에 누락된 다운로드 가능한 Plugin을 복구할 수 있습니다.
Doctor는 이미 설치된 로컬 Plugin의 의존성을 복구하지 않습니다.

## 번들 Plugin

가볍고 코어에 중요한 번들 Plugin은 OpenClaw의 일부로 제공됩니다.
이들은 무거운 런타임 의존성 트리가 없거나 ClawHub/npm의 다운로드 가능한 패키지로
이동되어야 합니다.

코어 패키지에 포함되어 제공되거나, 외부에서 설치되거나, 소스 전용으로 유지되는
Plugin의 현재 생성 목록은 [Plugin inventory](/ko/plugins/plugin-inventory)를
참조하세요.

번들 Plugin manifest는 의존성 staging을 요청해서는 안 됩니다. 크거나 선택적인
Plugin 기능은 일반 Plugin으로 패키지하고 서드파티 Plugin과 동일한 npm/git/ClawHub
경로를 통해 설치해야 합니다.

소스 checkout에서 OpenClaw는 repository를 pnpm monorepo로 취급합니다.
`pnpm install` 후에는 번들 Plugin이 `extensions/<id>`에서 로드되므로 패키지 로컬
workspace 의존성을 사용할 수 있고 편집 사항이 직접 반영됩니다. 소스 checkout
개발은 pnpm 전용입니다. repository 루트에서 plain `npm install`을 실행하는 것은
번들 Plugin 의존성을 준비하는 지원되는 방법이 아닙니다.

| 설치 형태                         | 번들 Plugin 위치                       | 의존성 소유자                                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 패키지 내부의 빌드된 런타임 트리       | OpenClaw 패키지 및 명시적 Plugin 설치/업데이트/doctor flow          |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace 패키지     | 각 Plugin 패키지의 자체 의존성을 포함한 pnpm workspace              |
| `openclaw plugins install ...`   | 관리형 npm 프로젝트/git/ClawHub 루트   | Plugin 설치/업데이트 flow                                            |

## 레거시 정리

이전 OpenClaw 버전은 시작 시 또는 doctor 복구 중에 번들 Plugin 의존성 루트를
생성했습니다. 현재 doctor cleanup은 `--fix`가 사용될 때 이러한 오래된 디렉터리와
symlink를 제거합니다. 여기에는 이전 `plugin-runtime-deps` 루트, 정리된
`plugin-runtime-deps` 대상이 가리키는 global Node-prefix 패키지 symlink,
`.openclaw-runtime-deps*` manifest, 생성된 Plugin `node_modules`, 설치 stage
디렉터리, 패키지 로컬 pnpm store가 포함됩니다. 패키지된 postinstall도 레거시 대상
루트를 정리하기 전에 이러한 global symlink를 제거하므로, 업그레이드 후 끊어진 ESM
패키지 import가 남지 않습니다.

이전 npm 설치도 공유 `~/.openclaw/npm/node_modules` 루트를 사용했습니다.
현재 install, update, uninstall, doctor flow는 복구 및 정리 목적으로만 해당
레거시 flat 루트를 여전히 인식합니다. 새 npm 설치는 대신 Plugin별 프로젝트 루트를
생성해야 합니다.
