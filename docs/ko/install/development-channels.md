---
read_when:
    - stable/beta/dev 간에 전환하려는 경우
    - 특정 버전, 태그 또는 SHA를 고정하려는 경우
    - 사전 릴리스에 태그를 지정하거나 게시하는 경우
sidebarTitle: Release Channels
summary: 'stable, beta, dev 채널: 의미 체계, 전환, 고정 및 태그 지정'
title: 릴리스 채널
x-i18n:
    generated_at: "2026-05-06T06:29:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2516165635eb8fbaddf19e07fbb591b659479b5226c2bf467e29247552ababb
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw는 세 가지 업데이트 채널을 제공합니다.

- **stable**: npm dist-tag `latest`. 대부분의 사용자에게 권장됩니다.
- **beta**: 최신 상태일 때의 npm dist-tag `beta`; beta가 없거나
  최신 stable 릴리스보다 오래된 경우 업데이트 흐름은 `latest`로 대체됩니다.
- **dev**: `main`의 이동 중인 헤드(git). npm dist-tag: `dev`(게시된 경우).
  `main` 브랜치는 실험과 활발한 개발을 위한 것입니다. 불완전한 기능이나
  호환성을 깨는 변경 사항이 포함될 수 있습니다. 프로덕션 Gateway에는 사용하지 마세요.

일반적으로 stable 빌드를 먼저 **beta**로 배포하고, 그곳에서 테스트한 다음, 검증된 빌드를 버전 번호 변경 없이 `latest`로 옮기는
명시적 승격 단계를 실행합니다. 유지관리자는 필요할 때 stable 릴리스를
`latest`에 직접 게시할 수도 있습니다. dist-tag는 npm 설치의 신뢰 기준입니다.

## 채널 전환

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`은 선택 사항을 config(`update.channel`)에 유지하고
설치 방식을 맞춥니다.

- **`stable`**(패키지 설치): npm dist-tag `latest`를 통해 업데이트합니다.
- **`beta`**(패키지 설치): npm dist-tag `beta`를 우선 사용하지만,
  `beta`가 없거나 현재 stable 태그보다 오래된 경우 `latest`로 대체됩니다.
- **`stable`**(git 설치): 최신 stable git 태그를 체크아웃합니다.
- **`beta`**(git 설치): 최신 beta git 태그를 우선 사용하지만, beta가 없거나 오래된 경우
  최신 stable git 태그로 대체됩니다.
- **`dev`**: git 체크아웃(기본값 `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의)을 보장하고, `main`으로 전환한 뒤, upstream에 리베이스하고, 빌드한 다음,
  해당 체크아웃에서 전역 CLI를 설치합니다.

<Tip>
stable과 dev를 병렬로 사용하려면 클론 두 개를 유지하고 Gateway가 stable 쪽을 가리키게 하세요.
</Tip>

## 일회성 버전 또는 태그 지정

`--tag`를 사용하면 유지된 채널 설정을 변경하지 **않고** 단일
업데이트에 대해 특정 dist-tag, 버전 또는 패키지 명세를 대상으로 지정할 수 있습니다.

```bash
# Install a specific version
openclaw update --tag 2026.4.1-beta.1

# Install from the beta dist-tag (one-off, does not persist)
openclaw update --tag beta

# Install from GitHub main branch (npm tarball)
openclaw update --tag main

# Install a specific npm package spec
openclaw update --tag openclaw@2026.4.1-beta.1
```

참고:

- `--tag`는 **패키지(npm) 설치에만** 적용됩니다. git 설치는 이를 무시합니다.
- 태그는 유지되지 않습니다. 다음 `openclaw update`는 평소처럼 구성된
  채널을 사용합니다.
- 다운그레이드 보호: 대상 버전이 현재 버전보다 오래된 경우
  OpenClaw가 확인을 요청합니다(`--yes`로 건너뛰기).
- `--channel beta`는 `--tag beta`와 다릅니다. 채널 흐름은 beta가 없거나 오래된 경우
  stable/latest로 대체될 수 있지만, `--tag beta`는 해당 한 번의 실행에 대해
  원시 `beta` dist-tag를 대상으로 합니다.

## 드라이 런

변경하지 않고 `openclaw update`가 수행할 작업을 미리 확인합니다.

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

드라이 런은 적용되는 채널, 대상 버전, 계획된 작업, 그리고
다운그레이드 확인이 필요한지 여부를 보여줍니다.

## Plugin 및 채널

`openclaw update`로 채널을 전환하면 OpenClaw는 Plugin
소스도 동기화합니다.

- `dev`는 git 체크아웃의 번들 Plugin을 우선 사용합니다.
- `stable` 및 `beta`는 npm으로 설치된 Plugin 패키지를 복원합니다.
- npm으로 설치된 Plugin은 코어 업데이트가 완료된 뒤 업데이트됩니다.

## 현재 상태 확인

```bash
openclaw update status
```

활성 채널, 설치 종류(git 또는 패키지), 현재 버전, 그리고
소스(config, git 태그, git 브랜치 또는 기본값)를 보여줍니다.

## 태그 지정 모범 사례

- git 체크아웃이 도달해야 하는 릴리스에 태그를 지정하세요(stable은 `vYYYY.M.D`,
  beta는 `vYYYY.M.D-beta.N`).
- 호환성을 위해 `vYYYY.M.D.beta.N`도 인식되지만, `-beta.N`을 사용하는 것이 좋습니다.
- 기존 `vYYYY.M.D-<patch>` 태그는 여전히 stable(non-beta)로 인식됩니다.
- 태그는 불변으로 유지하세요. 태그를 이동하거나 재사용하지 마세요.
- npm dist-tag는 npm 설치의 신뢰 기준으로 유지됩니다.
  - `latest` -> stable
  - `beta` -> 후보 빌드 또는 beta-first stable 빌드
  - `dev` -> main 스냅샷(선택 사항)

## macOS 앱 사용 가능 여부

Beta 및 dev 빌드에는 macOS 앱 릴리스가 포함되지 **않을 수** 있습니다. 괜찮습니다.

- git 태그와 npm dist-tag는 여전히 게시할 수 있습니다.
- 릴리스 노트 또는 변경 로그에 "이 beta에는 macOS 빌드가 없음"이라고 명시하세요.

## 관련 항목

- [업데이트](/ko/install/updating)
- [설치 프로그램 내부 구조](/ko/install/installer)
