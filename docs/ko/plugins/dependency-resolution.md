---
read_when:
    - Plugin 패키지 설치를 디버깅하고 있습니다
    - Plugin 시작, doctor 또는 패키지 관리자 설치 동작을 변경하고 있습니다
    - 패키지된 OpenClaw 설치본 또는 번들된 Plugin 매니페스트를 유지 관리하고 있습니다
sidebarTitle: Dependencies
summary: OpenClaw가 Plugin 패키지를 설치하고 Plugin 의존성을 해결하는 방식
title: Plugin 의존성 해결
x-i18n:
    generated_at: "2026-05-05T01:48:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a832f705e51bba8ac77e2a8715a7213fd2caf10bfa42059d53db4a6d5ad8c20
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

# Plugin 의존성 해결

OpenClaw는 Plugin 의존성 작업을 설치/업데이트 시점에 유지합니다. 런타임 로드는
패키지 관리자를 실행하거나, 의존성 트리를 복구하거나, OpenClaw
패키지 디렉터리를 변경하지 않습니다.

## 책임 분리

Plugin 패키지는 자체 의존성 그래프를 소유합니다.

- 런타임 의존성은 Plugin 패키지 `dependencies` 또는
  `optionalDependencies`에 있습니다
- SDK/코어 import는 peer이거나 OpenClaw가 제공하는 import입니다
- 로컬 개발 Plugin은 이미 설치된 자체 의존성을 가져옵니다
- npm 및 git Plugin은 OpenClaw가 소유한 패키지 루트에 설치됩니다

OpenClaw는 Plugin 생명주기만 소유합니다.

- Plugin 소스 검색
- 명시적으로 요청된 경우 패키지 설치 또는 업데이트
- 설치 메타데이터 기록
- Plugin 진입점 로드
- 의존성이 누락된 경우 조치 가능한 오류와 함께 실패

## 설치 루트

OpenClaw는 소스별로 안정적인 루트를 사용합니다.

- npm 패키지는 `~/.openclaw/npm` 아래에 설치됩니다
- git 패키지는 `~/.openclaw/git` 아래에 clone됩니다
- 로컬/경로/아카이브 설치는 의존성 복구 없이 복사되거나 참조됩니다

npm 설치는 npm 루트에서 다음과 같이 실행됩니다.

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

npm은 전이 의존성을 Plugin 패키지 옆의 `~/.openclaw/npm/node_modules`로
hoist할 수 있습니다. OpenClaw는 설치를 신뢰하기 전에 관리되는 npm 루트를
스캔하고, 제거 중에는 npm을 사용해 npm 관리 패키지를 제거하므로 hoist된
런타임 의존성은 관리되는 정리 경계 안에 유지됩니다.

git 설치는 저장소를 clone하거나 새로 고친 다음 다음을 실행합니다.

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

설치된 Plugin은 그 패키지 디렉터리에서 로드되므로, 패키지 로컬 및 상위
`node_modules` 해결은 일반 Node 패키지에서와 같은 방식으로 작동합니다.

## 로컬 Plugin

로컬 Plugin은 개발자가 제어하는 디렉터리로 취급됩니다. OpenClaw는 이를 위해
`npm install`, `pnpm install` 또는 의존성 복구를 실행하지 않습니다. 로컬
Plugin에 의존성이 있는 경우 로드하기 전에 해당 Plugin 안에 설치하세요.

타사 TypeScript 로컬 Plugin은 긴급 Jiti 경로를 사용할 수 있습니다. 패키징된
JavaScript Plugin과 번들된 내부 Plugin은 Jiti 대신 네이티브 import/require를
통해 로드됩니다.

## 시작 및 재로드

Gateway 시작과 config 재로드는 절대 Plugin 의존성을 설치하지 않습니다. 이들은
Plugin 설치 기록을 읽고, 진입점을 계산한 뒤, 이를 로드합니다.

런타임에 의존성이 누락된 경우 Plugin 로드는 실패하며, 오류는 운영자에게 명시적
수정 방법을 안내해야 합니다.

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`는 레거시 OpenClaw 생성 의존성 상태를 정리하고, config에서
참조하지만 로컬 설치 기록에서 누락된 다운로드 가능한 Plugin을 복구할 수
있습니다. Doctor는 이미 설치된 로컬 Plugin의 의존성을 복구하지 않습니다.

## 번들된 Plugin

가볍고 코어에 중요한 번들된 Plugin은 OpenClaw의 일부로 제공됩니다. 이들은
무거운 런타임 의존성 트리를 갖지 않거나, ClawHub/npm의 다운로드 가능한 패키지로
이동되어야 합니다.

코어 패키지에 포함되어 제공되거나, 외부에 설치되거나, 소스 전용으로 유지되는
Plugin의 현재 생성된 목록은 [Plugin 인벤토리](/ko/plugins/plugin-inventory)를
참조하세요.

번들된 Plugin manifest는 의존성 staging을 요청해서는 안 됩니다. 크거나 선택적인
Plugin 기능은 일반 Plugin으로 패키징하고 타사 Plugin과 동일한
npm/git/ClawHub 경로를 통해 설치해야 합니다.

소스 checkout에서 OpenClaw는 저장소를 pnpm monorepo로 취급합니다.
`pnpm install` 후에는 번들된 Plugin이 `extensions/<id>`에서 로드되므로 패키지
로컬 workspace 의존성을 사용할 수 있고, 편집 사항이 직접 반영됩니다. 소스
checkout 개발은 pnpm 전용입니다. 저장소 루트에서 일반 `npm install`을 실행하는
것은 번들된 Plugin 의존성을 준비하는 지원되는 방법이 아닙니다.

| 설치 형태                         | 번들된 Plugin 위치                    | 의존성 소유자                                                         |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 패키지 내부의 빌드된 런타임 트리      | OpenClaw 패키지 및 명시적 Plugin 설치/업데이트/doctor 흐름           |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace 패키지    | 각 Plugin 패키지의 자체 의존성을 포함한 pnpm workspace               |
| `openclaw plugins install ...`   | 관리되는 npm/git/ClawHub Plugin 루트  | Plugin 설치/업데이트 흐름                                            |

## 레거시 정리

이전 OpenClaw 버전은 시작 시 또는 doctor 복구 중에 번들된 Plugin 의존성 루트를
생성했습니다. 현재 doctor 정리는 `--fix`가 사용될 때 이러한 오래된 디렉터리와
symlink를 제거합니다. 여기에는 이전 `plugin-runtime-deps` 루트, 가지치기된
`plugin-runtime-deps` 대상을 가리키는 전역 Node-prefix 패키지 symlink,
`.openclaw-runtime-deps*` manifest, 생성된 Plugin `node_modules`, 설치 stage
디렉터리, 패키지 로컬 pnpm store가 포함됩니다. 패키징된 postinstall도 레거시
대상 루트를 가지치기하기 전에 이러한 전역 symlink를 제거하여 업그레이드 후
끊어진 ESM 패키지 import가 남지 않게 합니다.

이러한 경로는 레거시 잔여물일 뿐입니다. 새 설치는 이를 생성해서는 안 됩니다.
