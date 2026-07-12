---
read_when:
    - Plugin 패키지 설치를 디버깅하고 있습니다
    - Plugin 시작, doctor 또는 패키지 관리자 설치 동작을 변경하고 있습니다
    - 패키지로 배포된 OpenClaw 설치 또는 번들 Plugin 매니페스트를 유지 관리하고 있습니다.
sidebarTitle: Dependencies
summary: OpenClaw가 Plugin 패키지를 설치하고 Plugin 종속성을 확인하는 방법
title: Plugin 종속성 해결
x-i18n:
    generated_at: "2026-07-12T15:30:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ae24a82568e275399cb7b68729d2805956792852612f84d6918850305f0eb243
    source_path: plugins/dependency-resolution.md
    workflow: 16
---

OpenClaw는 설치/업데이트 시에만 Plugin 종속성을 처리합니다. 런타임
로딩에서는 패키지 관리자를 실행하거나, 종속성 트리를 복구하거나, OpenClaw
패키지 디렉터리를 변경하지 않습니다.

## 책임 분담

Plugin 패키지는 자체 종속성 그래프를 소유합니다.

- 런타임 종속성은 Plugin 패키지의 `dependencies` 또는
  `optionalDependencies`에 둡니다.
- SDK/코어 가져오기는 피어 종속성이거나 OpenClaw에서 제공하는 가져오기입니다.
- 로컬 개발 Plugin은 이미 설치된 자체 종속성을 사용합니다.
- npm 및 git Plugin은 OpenClaw가 소유하는 패키지 루트에 설치됩니다.

OpenClaw는 Plugin 수명 주기만 소유합니다.

- Plugin 소스를 검색합니다.
- 명시적으로 요청된 경우 패키지를 설치하거나 업데이트합니다.
- 설치 메타데이터를 기록합니다.
- Plugin 진입점을 로드합니다.
- 종속성이 없으면 조치 가능한 오류와 함께 실패합니다.

## 설치 루트

OpenClaw는 소스별로 안정적인 루트를 사용합니다.

- npm 패키지는
  `~/.openclaw/npm/projects/<encoded-package>` 아래의 Plugin별 프로젝트에 설치됩니다.
- git 패키지는 `~/.openclaw/git` 아래에 복제됩니다.
- 로컬/경로/아카이브 설치는 종속성을 복구하지 않고 복사하거나 참조합니다.

npm 설치는 해당 Plugin별 프로젝트 루트에서 다음과 같이 실행됩니다.

```bash
cd ~/.openclaw/npm/projects/<encoded-package>
npm install --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts --no-audit --no-fund
```

`openclaw plugins install npm-pack:<path.tgz>`는 로컬 npm-pack tarball에도
동일한 Plugin별 npm 프로젝트 루트를 사용합니다. OpenClaw는 tarball의 npm
메타데이터를 읽고, 이를 복사된 `file:` 종속성으로 관리형 프로젝트에 추가한 후,
위의 일반 npm 설치를 실행하고, 설치된 잠금 파일 메타데이터를 검증한 다음
Plugin을 신뢰합니다. 이 경로는 로컬 pack 아티팩트가 모방 대상인 레지스트리
아티팩트처럼 동작해야 하는 패키지 승인 및 릴리스 후보 검증을 위해 존재합니다.

게시하기 전에 공식 또는 외부 Plugin 패키지를 테스트할 때 `npm-pack:`을
사용하십시오. 원시 아카이브 또는 경로 설치는 로컬 디버깅에 유용하지만,
설치된 npm 또는 ClawHub 패키지와 동일한 종속성 경로를 검증하지는 않습니다.
`npm-pack:`은 관리형 패키지 설치 형태를 검증하지만, 그 자체만으로 해당
Plugin이 카탈로그에 연결된 공식 콘텐츠임을 증명하지는 않습니다.

동작이 번들 Plugin 또는 신뢰할 수 있는 공식 Plugin 상태에 따라 달라지는 경우,
로컬 패키지 검증을 카탈로그 기반 공식 설치 또는 공식 신뢰를 기록하는 게시된
패키지 경로와 함께 사용하십시오. 권한이 있는 헬퍼 접근 및 신뢰할 수 있는 공식
범위 처리는 로컬 tarball 설치에서 추론하지 말고 해당 신뢰 설치 경로에서
검증해야 합니다.

런타임에 가져오기가 누락되어 Plugin이 실패하면 관리형 프로젝트를 수동으로
복구하지 말고 패키지 매니페스트를 수정하십시오. 런타임 가져오기는 Plugin
패키지의 `dependencies` 또는 `optionalDependencies`에 있어야 하며,
`devDependencies`는 관리형 런타임 프로젝트에 설치되지 않습니다.
`~/.openclaw/npm/projects/<encoded-package>` 내부에서 로컬 `npm install`을
실행하면 임시 진단을 진행할 수 있지만, 다음 설치 또는 업데이트 시 패키지
메타데이터에서 프로젝트를 다시 생성하므로 패키지 승인 검증으로 인정되지 않습니다.

npm은 전이 종속성을 Plugin 패키지 옆의 Plugin별 프로젝트
`node_modules`로 호이스팅할 수 있습니다. OpenClaw는 설치를 신뢰하기 전에
관리형 프로젝트 루트를 검사하고 제거 시 해당 프로젝트를 삭제하므로,
호이스팅된 런타임 종속성은 해당 Plugin의 정리 경계 내부에 유지됩니다.

게시된 npm Plugin 패키지는 `npm-shrinkwrap.json`을 포함할 수 있습니다.
npm은 설치 중 이 게시 가능한 잠금 파일을 사용하며, OpenClaw의 관리형 npm
프로젝트 루트는 일반 설치 경로를 통해 이를 지원합니다. OpenClaw가 소유하는
게시 가능 Plugin 패키지는 해당 패키지의 게시된 종속성 그래프에서 생성된
패키지 로컬 shrinkwrap을 포함해야 합니다.

```bash
pnpm deps:shrinkwrap:generate
pnpm deps:shrinkwrap:check
```

생성기는 Plugin `devDependencies`를 제거하고, 워크스페이스 재정의 정책을
적용하며, `openclaw.release.publishToNpm: true`인 각 Plugin에 대해
`extensions/<id>/npm-shrinkwrap.json`을 작성합니다. 서드 파티 Plugin
패키지도 shrinkwrap을 포함할 수 있습니다. OpenClaw는 커뮤니티 패키지에 이를
요구하지 않지만, 파일이 있으면 npm이 이를 따릅니다.

로컬 패키지를 릴리스 후보 검증으로 간주하기 전에 설치될 tarball을 검사하십시오.

```bash
npm pack --pack-destination /tmp
tar -xOf /tmp/<plugin-package>.tgz package/package.json
tar -tf /tmp/<plugin-package>.tgz | grep '^package/dist/'
```

종속성을 변경한 경우 프로덕션 설치에서 개발 종속성 없이 런타임 패키지를
확인할 수 있는지도 검증하십시오.

```bash
tmpdir=$(mktemp -d)
(
  cd "$tmpdir"
  npm init -y >/dev/null
  npm install --package-lock-only --omit=dev --omit=peer --legacy-peer-deps --ignore-scripts /tmp/<plugin-package>.tgz
)
rm -rf "$tmpdir"
```

OpenClaw가 소유하는 npm Plugin 패키지는 명시적인 `bundledDependencies`와
함께 게시할 수도 있습니다. npm 게시 경로는 런타임 종속성 이름 목록을
오버레이하고, 게시된 매니페스트에서 개발 전용 워크스페이스 메타데이터를
제거하며, 패키지 로컬 런타임 종속성에 대해 스크립트 없는 npm 설치를 실행한
다음, 해당 종속성 파일이 포함된 Plugin tarball을 패킹하거나 게시합니다.
네이티브 구성 요소가 많은 패키지(Codex, ACPX, Copilot, llama.cpp,
memory-lancedb, Tlon)는 `openclaw.release.bundleRuntimeDependencies: false`로
이 동작을 사용하지 않습니다. 이러한 패키지도 shrinkwrap은 포함하지만,
Plugin tarball에 모든 플랫폼 바이너리를 포함하는 대신 npm이 설치 중 런타임
종속성을 확인합니다. 루트 `openclaw` 패키지는 전체 종속성 트리를 번들로
포함하지 않습니다.

`openclaw/plugin-sdk/*`를 가져오는 Plugin은 `openclaw`를 피어 종속성으로
선언합니다. 오래된 호스트 패키지가 해당 Plugin 내부의 npm 피어 확인에 영향을
줄 수 있으므로, OpenClaw는 npm이 관리형 프로젝트에 호스트 패키지의 별도
레지스트리 사본을 설치하도록 허용하지 않습니다. 관리형 npm 설치에서는 npm
피어 확인/구체화를 건너뛰며, OpenClaw는 설치 또는 업데이트 후 호스트 피어를
선언하는 설치된 패키지에 대해 Plugin 로컬 `node_modules/openclaw` 링크를
다시 설정합니다.

git 설치는 저장소를 복제하거나 새로 고친 후 다음을 실행합니다.

```bash
npm install --omit=dev --ignore-scripts --no-audit --no-fund
```

그런 다음 설치된 Plugin은 해당 패키지 디렉터리에서 로드되므로, 패키지 로컬 및
상위 `node_modules` 확인은 일반 Node 패키지와 같은 방식으로 작동합니다.

## 로컬 Plugin

로컬 Plugin은 개발자가 제어하는 디렉터리입니다. OpenClaw는 로컬 Plugin에
대해 `npm install`, `pnpm install` 또는 종속성 복구를 실행하지 않습니다.
로컬 Plugin에 종속성이 있다면 로드하기 전에 해당 Plugin에 설치하십시오.

서드 파티 TypeScript 로컬 Plugin은 비상 경로로 Jiti를 통해 로드됩니다.
패키징된 JavaScript Plugin과 번들된 내부 Plugin은 대신 네이티브
import/require를 통해 로드됩니다.

## 시작 및 다시 로드

Gateway 시작 및 구성 다시 로드 시에는 Plugin 종속성을 설치하지 않습니다.
Plugin 설치 기록을 읽고 진입점을 계산한 다음 로드합니다.

런타임에 종속성이 없으면 Plugin 로드가 실패하며, 운영자에게 명시적인 수정
방법을 안내하는 오류가 표시됩니다.

```bash
openclaw plugins update <id>
openclaw plugins install <source>
openclaw doctor --fix
```

`doctor --fix`는 OpenClaw가 생성한 레거시 종속성 상태를 정리하며, 구성에서
계속 참조하지만 로컬 설치 기록에는 없는 다운로드 가능한 Plugin을 복구할 수
있습니다. Doctor는 이미 설치된 로컬 Plugin의 종속성을 복구하지 않습니다.

## 번들 Plugin

가볍고 코어에 필수적인 번들 Plugin은 OpenClaw의 일부로 제공됩니다. 이러한
Plugin은 무거운 런타임 종속성 트리를 포함하지 않거나, ClawHub/npm에서
다운로드할 수 있는 패키지로 이동해야 합니다.

코어 패키지에 포함되거나, 외부에 설치되거나, 소스 전용으로 유지되는 Plugin의
현재 생성 목록은 [Plugin 인벤토리](/ko/plugins/plugin-inventory)를 참조하십시오.

번들 Plugin 매니페스트는 종속성 스테이징을 요청해서는 안 됩니다. 규모가 크거나
선택적인 Plugin 기능은 일반 Plugin으로 패키징하고, 서드 파티 Plugin과 동일한
npm/git/ClawHub 경로를 통해 설치해야 합니다.

소스 체크아웃에서 OpenClaw는 저장소를 pnpm 모노레포로 취급합니다.
`pnpm install` 후 번들 Plugin은 `extensions/<id>`에서 로드되므로 패키지 로컬
워크스페이스 종속성을 사용할 수 있고 편집 내용이 직접 반영됩니다. 소스 체크아웃
개발에서는 pnpm만 사용합니다. 저장소 루트에서 일반 `npm install`을 실행해도
번들 Plugin 종속성이 준비되지 않습니다.

| 설치 형태                       | 번들 Plugin 위치                     | 종속성 소유자                                                        |
| -------------------------------- | ------------------------------------- | -------------------------------------------------------------------- |
| `npm install -g openclaw`        | 패키지 내부의 빌드된 런타임 트리     | OpenClaw 패키지 및 명시적인 Plugin 설치/업데이트/Doctor 흐름         |
| Git 체크아웃 및 `pnpm install`   | `extensions/<id>` 워크스페이스 패키지 | 각 Plugin 패키지의 자체 종속성을 포함한 pnpm 워크스페이스            |
| `openclaw plugins install ...`   | 관리형 npm 프로젝트/git/ClawHub 루트 | Plugin 설치/업데이트 흐름                                            |

## 레거시 정리

이전 OpenClaw 버전은 시작 시 또는 Doctor 복구 중에 번들 Plugin 종속성 루트를
생성했습니다. 현재 Doctor 정리는 `--fix`를 사용하여 이러한 오래된 디렉터리와
심볼릭 링크를 제거합니다. 여기에는 이전 `plugin-runtime-deps` 루트, 정리된
`plugin-runtime-deps` 대상을 가리키는 전역 Node 접두사 패키지 심볼릭 링크,
`.openclaw-runtime-deps*` 매니페스트, 생성된 Plugin `node_modules`, 설치
스테이지 디렉터리 및 패키지 로컬 pnpm 저장소가 포함됩니다. 패키징된 postinstall도
레거시 대상 루트를 정리하기 전에 이러한 전역 심볼릭 링크를 제거하므로, 업그레이드
후 끊어진 ESM 패키지 가져오기가 남지 않습니다.

이전 npm 설치에서도 공유 `~/.openclaw/npm/node_modules` 루트를 사용했습니다.
현재 설치, 업데이트, 제거 및 Doctor 흐름은 복구와 정리 목적으로만 해당 레거시
플랫 루트를 계속 인식합니다. 새로운 npm 설치는 대신 Plugin별 프로젝트 루트를
생성합니다.
