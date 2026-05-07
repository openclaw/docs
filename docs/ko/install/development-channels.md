---
read_when:
    - 안정/베타/개발 간에 전환하려는 경우
    - 특정 버전, 태그 또는 SHA를 고정하려는 경우
    - 프리릴리스를 태그하거나 게시하는 경우
sidebarTitle: Release Channels
summary: '안정, 베타 및 개발 채널: 의미, 전환, 고정 및 태깅'
title: 릴리스 채널
x-i18n:
    generated_at: "2026-05-07T01:52:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6579110cc5c0e62ef238d7e4200db5fea188f35dc9366a17b3cf92a58c8935cc
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw는 세 가지 업데이트 채널을 제공합니다.

- **stable**: npm dist-tag `latest`. 대부분의 사용자에게 권장됩니다.
- **beta**: 최신 상태일 때 npm dist-tag `beta`를 사용합니다. beta가 없거나
  최신 stable 릴리스보다 오래된 경우 업데이트 흐름은 `latest`로 대체됩니다.
- **dev**: `main`(git)의 이동하는 최신 head입니다. npm dist-tag: `dev`(게시된 경우).
  `main` 브랜치는 실험 및 활발한 개발용입니다. 완료되지 않은 기능이나
  호환성을 깨는 변경 사항이 포함될 수 있습니다. 프로덕션 Gateway에는 사용하지 마세요.

보통 stable 빌드를 먼저 **beta**에 배포하고, 그곳에서 테스트한 다음, 버전 번호를
변경하지 않고 검증된 빌드를 `latest`로 이동하는 명시적 승격 단계를 실행합니다.
유지관리자는 필요할 때 stable 릴리스를 `latest`에 직접 게시할 수도 있습니다.
npm 설치에서는 dist-tag가 기준입니다.

## 계획된 월간 지원 라인

OpenClaw는 아직 LTS나 월간 지원 채널을 제공하지 않습니다. `latest`가 빠르게 계속
이동하는 동안 사용자가 더 안정적인 라인에 머물 수 있도록 SemVer와 호환되는 월간
지원 라인을 준비하고 있습니다.

계획된 버전 형식은 `YYYY.M.PATCH`입니다.

- `YYYY`는 연도입니다.
- `M`은 앞에 0이 없는 월간 릴리스 라인입니다.
- `PATCH`는 해당 월간 라인 내에서 증가하며, 필요하면 100을 넘을 수 있습니다.

향후 태그 예시:

- 6월 라인에는 `v2026.6.0`, `v2026.6.1`, `v2026.6.2`.
- 빠른/latest 트레인의 프리릴리스에는 `v2026.6.3-beta.1`.
- 향후 `stable-2026-6` 또는 `lts-2026-6` 같은 지원 라인 dist-tag가
  월간 라인을 가리킬 수 있지만, 현재는 그런 채널을 사용할 수 없습니다.

해당 마이그레이션이 적용될 때까지 공개 업데이트 채널은 `stable`, `beta`,
`dev`로 유지됩니다.

## 채널 전환

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`은 config(`update.channel`)에 선택을 저장하고 설치 방식을 정렬합니다.

- **`stable`**(패키지 설치): npm dist-tag `latest`를 통해 업데이트합니다.
- **`beta`**(패키지 설치): npm dist-tag `beta`를 우선 사용하지만, `beta`가 없거나
  현재 stable 태그보다 오래된 경우 `latest`로 대체됩니다.
- **`stable`**(git 설치): 최신 stable git 태그를 체크아웃합니다.
- **`beta`**(git 설치): 최신 beta git 태그를 우선 사용하지만, beta가 없거나 오래된 경우
  최신 stable git 태그로 대체됩니다.
- **`dev`**: git 체크아웃을 보장하고(기본값 `~/openclaw`, `OPENCLAW_GIT_DIR`로 재정의),
  `main`으로 전환한 뒤 upstream에 rebase하고, 빌드한 다음, 해당 체크아웃에서
  전역 CLI를 설치합니다.

<Tip>
stable과 dev를 병렬로 사용하려면 클론을 두 개 유지하고 Gateway가 stable 클론을 가리키도록 하세요.
</Tip>

## 일회성 버전 또는 태그 지정

저장된 채널을 변경하지 않고 단일 업데이트에 대해 특정 dist-tag, 버전 또는 패키지
spec을 대상으로 지정하려면 `--tag`를 사용하세요.

```bash
# 특정 버전 설치
openclaw update --tag 2026.4.1-beta.1

# beta dist-tag에서 설치(일회성, 저장되지 않음)
openclaw update --tag beta

# GitHub main 브랜치에서 설치(npm tarball)
openclaw update --tag main

# 특정 npm 패키지 spec 설치
openclaw update --tag openclaw@2026.4.1-beta.1
```

참고:

- `--tag`는 **패키지(npm) 설치에만** 적용됩니다. git 설치는 이를 무시합니다.
- 태그는 저장되지 않습니다. 다음 `openclaw update`는 평소처럼 구성된 채널을 사용합니다.
- 다운그레이드 보호: 대상 버전이 현재 버전보다 오래된 경우 OpenClaw가 확인을 요청합니다
  (`--yes`로 건너뛸 수 있음).
- `--channel beta`는 `--tag beta`와 다릅니다. 채널 흐름은 beta가 없거나 오래된 경우
  stable/latest로 대체될 수 있지만, `--tag beta`는 그 한 번의 실행에서 원시 `beta`
  dist-tag를 대상으로 지정합니다.

## Dry run

변경 사항을 적용하지 않고 `openclaw update`가 수행할 작업을 미리 확인합니다.

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry run은 유효한 채널, 대상 버전, 계획된 작업, 다운그레이드 확인이 필요한지 여부를 보여줍니다.

## Plugin과 채널

`openclaw update`로 채널을 전환하면 OpenClaw는 Plugin 소스도 동기화합니다.

- `dev`는 git 체크아웃의 번들 Plugin을 우선 사용합니다.
- `stable`과 `beta`는 npm으로 설치된 Plugin 패키지를 복원합니다.
- npm으로 설치된 Plugin은 core 업데이트가 완료된 후 업데이트됩니다.

## 현재 상태 확인

```bash
openclaw update status
```

활성 채널, 설치 종류(git 또는 패키지), 현재 버전, 소스(config, git 태그, git 브랜치 또는 기본값)를 표시합니다.

## 태그 지정 모범 사례

- git 체크아웃이 도달해야 하는 릴리스에 태그를 지정하세요(현재 stable 릴리스는 `vYYYY.M.D`,
  현재 beta 릴리스는 `vYYYY.M.D-beta.N`).
- `vYYYY.M.D.beta.N`도 호환성을 위해 인식되지만, `-beta.N`을 권장합니다.
- 기존 `vYYYY.M.D-<patch>` 태그는 여전히 stable(non-beta)로 인식되지만,
  계획된 월간 지원 모델에서는 하이픈 보정 접미사 대신 일반 패치 번호
  (`vYYYY.M.PATCH`)를 사용합니다.
- 태그는 불변으로 유지하세요. 태그를 이동하거나 재사용하지 마세요.
- npm 설치에서는 npm dist-tag가 기준입니다.
  - `latest` -> stable
  - `beta` -> 후보 빌드 또는 beta 우선 stable 빌드
  - `dev` -> main 스냅샷(선택 사항)

## macOS 앱 가용성

Beta 및 dev 빌드에는 macOS 앱 릴리스가 **포함되지 않을 수 있습니다**. 괜찮습니다.

- git 태그와 npm dist-tag는 여전히 게시할 수 있습니다.
- 릴리스 노트나 changelog에 "이 beta에는 macOS 빌드 없음"을 명시하세요.

## 관련 항목

- [업데이트](/ko/install/updating)
- [Installer 내부 구조](/ko/install/installer)
