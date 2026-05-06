---
read_when:
    - Plugin 패키지 설치를 디버깅하는 중입니다
    - Plugin 시작, doctor 또는 패키지 관리자 설치 동작을 변경하는 경우
    - 패키지된 OpenClaw 설치본 또는 번들된 Plugin 매니페스트를 유지 관리하는 경우
sidebarTitle: Dependencies
summary: OpenClaw가 Plugin 패키지를 설치하고 Plugin 의존성을 해결하는 방식
title: Plugin 의존성 해결
x-i18n:
    generated_at: "2026-05-06T17:58:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15cdc75d92a675fd5474c49572639ab7510618e393fb7cf9f8b94506c859bee8
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw는 Plugin 의존성 작업을 설치/업데이트 시점에 유지합니다. 런타임 로딩은 패키지 관리자를 실행하거나, 의존성 트리를 복구하거나, OpenClaw 패키지 디렉터리를 변경하지 않습니다.

## 책임 분리

Plugin 패키지는 자체 의존성 그래프를 소유합니다.

- 런타임 의존성은 Plugin 패키지의 `dependencies` 또는 `optionalDependencies`에 있습니다.
- SDK/코어 가져오기는 peer 또는 OpenClaw가 제공하는 가져오기입니다.
- 로컬 개발 Plugin은 이미 설치된 자체 의존성을 가져옵니다.
- npm 및 git Plugin은 OpenClaw가 소유한 패키지 루트에 설치됩니다.

OpenClaw는 Plugin 수명 주기만 소유합니다.

- Plugin 소스 발견
- 명시적으로 요청된 경우 패키지 설치 또는 업데이트
- 설치 메타데이터 기록
- Plugin 진입점 로드
- 의존성이 누락된 경우 실행 가능한 오류로 실패

## 설치 루트

OpenClaw는 소스별로 안정적인 루트를 사용합니다.

- npm 패키지는 `~/.openclaw/npm` 아래에 설치됩니다.
- git 패키지는 `~/.openclaw/git` 아래에 클론됩니다.
- local/path/archive 설치는 의존성 복구 없이 복사되거나 참조됩니다.

npm 설치는 npm 루트에서 다음과 같이 실행됩니다.

```bash
npm install --prefix ~/.openclaw/npm <spec> --omit=dev --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`는 로컬 npm-pack tarball에 동일한 관리형 npm 루트를 사용합니다. OpenClaw는 tarball의 npm 메타데이터를 읽고, 이를 복사된 `file:` 의존성으로 관리형 루트에 추가한 뒤, 일반 npm install을 실행하고, Plugin을 신뢰하기 전에 설치된 lockfile 메타데이터를 확인합니다. 이는 로컬 pack 아티팩트가 시뮬레이션하는 레지스트리 아티팩트처럼 동작해야 하는 패키지 승인 및 릴리스 후보 증명용입니다.

npm은 전이 의존성을 Plugin 패키지 옆의 `~/.openclaw/npm/node_modules`로 호이스트할 수 있습니다. OpenClaw는 설치를 신뢰하기 전에 관리형 npm 루트를 스캔하고, uninstall 중에는 npm을 사용해 npm 관리 패키지를 제거하므로 호이스트된 런타임 의존성은 관리형 정리 경계 안에 남습니다.

`openclaw/plugin-sdk/*`를 가져오는 Plugin은 `openclaw`를 peer dependency로 선언합니다. OpenClaw는 npm이 호스트 패키지의 별도 레지스트리 복사본을 관리형 루트에 설치하도록 두지 않습니다. 오래된 호스트 패키지가 이후 Plugin 설치 중 npm peer resolution에 영향을 줄 수 있기 때문입니다. 대신 npm이 install, update, uninstall 중 공유 루트를 변경한 뒤, OpenClaw는 host peer를 선언하는 설치된 패키지에 대해 Plugin 로컬 `node_modules/openclaw` 링크를 다시 보장합니다.

git 설치는 저장소를 클론하거나 새로 고친 다음 다음을 실행합니다.

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

설치된 Plugin은 그 패키지 디렉터리에서 로드되므로, 패키지 로컬 및 상위 `node_modules` 해석은 일반 Node 패키지에서와 같은 방식으로 동작합니다.

## 로컬 Plugin

로컬 Plugin은 개발자가 제어하는 디렉터리로 취급됩니다. OpenClaw는 이들에 대해 `npm install`, `pnpm install` 또는 의존성 복구를 실행하지 않습니다. 로컬 Plugin에 의존성이 있는 경우, 로드하기 전에 해당 Plugin 안에 설치하세요.

서드파티 TypeScript 로컬 Plugin은 비상 Jiti 경로를 사용할 수 있습니다. 패키징된 JavaScript Plugin과 번들된 내부 Plugin은 Jiti 대신 네이티브 import/require를 통해 로드됩니다.

## 시작 및 다시 로드

Gateway 시작 및 config 다시 로드는 Plugin 의존성을 설치하지 않습니다. Plugin 설치 레코드를 읽고, 진입점을 계산한 뒤, 이를 로드합니다.

런타임에 의존성이 누락된 경우, Plugin 로드는 실패하고 오류는 운영자에게 명시적인 수정 방법을 안내해야 합니다.

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`는 레거시 OpenClaw 생성 의존성 상태를 정리하고, config에서 참조하지만 로컬 설치 레코드에 없는 다운로드 가능한 Plugin을 복구할 수 있습니다. Doctor는 이미 설치된 로컬 Plugin의 의존성을 복구하지 않습니다.

## 번들 Plugin

가볍고 코어에 중요한 번들 Plugin은 OpenClaw의 일부로 제공됩니다. 이들은 무거운 런타임 의존성 트리가 없거나 ClawHub/npm의 다운로드 가능한 패키지로 옮겨져야 합니다.

코어 패키지에 포함되거나, 외부에서 설치되거나, 소스 전용으로 유지되는 Plugin의 현재 생성된 목록은 [Plugin 인벤터리](/ko/plugins/plugin-inventory)를 참조하세요.

번들 Plugin 매니페스트는 의존성 staging을 요청해서는 안 됩니다. 크거나 선택적인 Plugin 기능은 일반 Plugin으로 패키징하고 서드파티 Plugin과 동일한 npm/git/ClawHub 경로를 통해 설치해야 합니다.

소스 checkout에서 OpenClaw는 저장소를 pnpm monorepo로 취급합니다. `pnpm install` 후에는 번들 Plugin이 `extensions/<id>`에서 로드되므로 패키지 로컬 workspace 의존성을 사용할 수 있고, 편집 내용이 직접 반영됩니다. 소스 checkout 개발은 pnpm 전용입니다. 저장소 루트에서 일반 `npm install`을 실행하는 것은 번들 Plugin 의존성을 준비하는 지원 방식이 아닙니다.

| 설치 형태                         | 번들 Plugin 위치                    | 의존성 소유자                                                          |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 패키지 내부의 빌드된 런타임 트리 | OpenClaw 패키지 및 명시적 Plugin install/update/doctor 흐름     |
| Git checkout plus `pnpm install` | `extensions/<id>` workspace 패키지  | 각 Plugin 패키지의 자체 의존성을 포함한 pnpm workspace |
| `openclaw plugins install ...`   | 관리형 npm/git/ClawHub Plugin 루트   | Plugin install/update 흐름                                       |

## 레거시 정리

이전 OpenClaw 버전은 시작 시 또는 doctor repair 중 번들 Plugin 의존성 루트를 생성했습니다. 현재 doctor cleanup은 `--fix`를 사용할 때 이러한 오래된 디렉터리와 symlink를 제거합니다. 여기에는 오래된 `plugin-runtime-deps` 루트, 정리된 `plugin-runtime-deps` 대상의 global Node-prefix 패키지 symlink, `.openclaw-runtime-deps*` 매니페스트, 생성된 Plugin `node_modules`, install stage 디렉터리, 패키지 로컬 pnpm store가 포함됩니다. 패키징된 postinstall도 레거시 대상 루트를 정리하기 전에 이러한 global symlink를 제거하므로 업그레이드 후 끊어진 ESM 패키지 import가 남지 않습니다.

이 경로들은 레거시 잔여물일 뿐입니다. 새 설치가 이들을 생성해서는 안 됩니다.
