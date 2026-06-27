---
read_when:
    - stable/beta/dev 간에 전환하려는 경우
    - 특정 버전, 태그 또는 SHA를 고정하려는 경우
    - 프리릴리스를 태그하거나 게시하고 있습니다
sidebarTitle: Release Channels
summary: '안정, 베타 및 dev 채널: 의미, 전환, 고정 및 태그 지정'
title: 릴리스 채널
x-i18n:
    generated_at: "2026-06-27T17:36:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b5b0b8b43dd15b3fdd83d28c5d0292d260594325ad6e6e95533720ba3e59277
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw은 세 가지 업데이트 채널을 제공합니다.

- **stable**: npm dist-tag `latest`. 대부분의 사용자에게 권장됩니다.
- **beta**: 최신 상태일 때 npm dist-tag `beta`; beta가 없거나 최신 stable 릴리스보다 오래된 경우 업데이트 흐름은 `latest`로 폴백합니다.
- **dev**: `main`의 이동하는 헤드(git). npm dist-tag: `dev`(게시된 경우).
  `main` 브랜치는 실험과 활발한 개발을 위한 것입니다. 완료되지 않은 기능이나 호환성을 깨는 변경 사항이 포함될 수 있습니다. 프로덕션 Gateway에는 사용하지 마세요.

일반적으로 stable 빌드는 먼저 **beta**로 배포하고, 그곳에서 테스트한 다음, 검증된 빌드를 버전 번호 변경 없이 `latest`로 이동하는 명시적 승격 단계를 실행합니다. Maintainer는 필요할 때 stable 릴리스를 `latest`로 직접 게시할 수도 있습니다. dist-tag는 npm 설치의 단일 기준입니다.

## 채널 전환

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`은 선택한 항목을 구성(`update.channel`)에 저장하고 설치 방식을 맞춥니다.

- **`stable`**(패키지 설치): npm dist-tag `latest`를 통해 업데이트합니다.
- **`beta`**(패키지 설치): npm dist-tag `beta`를 우선 사용하지만, `beta`가 없거나 현재 stable 태그보다 오래된 경우 `latest`로 폴백합니다.
- **`stable`**(git 설치): `-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` 및 기타 프리릴리스 접미사 같은 semver 프리릴리스 태그를 제외하고 최신 stable git 태그를 체크아웃합니다.
- **`beta`**(git 설치): 최신 beta git 태그를 우선 사용하지만, beta가 없거나 더 오래된 경우 최신 stable git 태그로 폴백합니다.
- **`dev`**: git 체크아웃을 보장하고(기본값 `~/openclaw`, 또는 `OPENCLAW_HOME`이 설정된 경우 `$OPENCLAW_HOME/openclaw`; `OPENCLAW_GIT_DIR`로 재정의), `main`으로 전환한 뒤 upstream에 리베이스하고, 빌드한 다음 해당 체크아웃에서 전역 CLI를 설치합니다.

<Tip>
stable과 dev를 병렬로 사용하려면 두 개의 클론을 유지하고 Gateway가 stable 클론을 가리키도록 하세요.
</Tip>

## 일회성 버전 또는 태그 지정

저장된 채널을 변경하지 않고 단일 업데이트에 특정 dist-tag, 버전 또는 패키지 사양을 대상으로 지정하려면 `--tag`를 사용하세요.

```bash
# 특정 버전 설치
openclaw update --tag 2026.4.1-beta.1

# beta dist-tag에서 설치(일회성, 저장되지 않음)
openclaw update --tag beta

# 이동하는 GitHub main 체크아웃으로 전환
openclaw update --channel dev

# 특정 npm 패키지 사양 설치
openclaw update --tag openclaw@2026.4.1-beta.1

# 채널을 저장하지 않고 GitHub main에서 한 번 설치
openclaw update --tag main
```

참고:

- `--tag`는 **패키지(npm) 설치에만** 적용됩니다. git 설치는 이를 무시합니다.
- 태그는 저장되지 않습니다. 다음 `openclaw update`는 평소처럼 구성된 채널을 사용합니다.
- 패키지 설치의 경우, OpenClaw은 staged npm 설치 전에 GitHub/git 소스 사양을 임시 tarball로 미리 패킹합니다. 이동하는 `main` 체크아웃을 지속 설치로 사용하려면 `--channel dev` 또는 `--install-method git --version main`을 사용하세요.
- 다운그레이드 보호: 대상 버전이 현재 버전보다 오래된 경우 OpenClaw이 확인을 요청합니다(`--yes`로 건너뛰기).
- `--channel beta`는 `--tag beta`와 다릅니다. 채널 흐름은 beta가 없거나 오래된 경우 stable/latest로 폴백할 수 있지만, `--tag beta`는 해당 한 번의 실행에서 원시 `beta` dist-tag를 대상으로 합니다.

## Dry run

변경하지 않고 `openclaw update`가 수행할 작업을 미리 봅니다.

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

dry run은 적용 채널, 대상 버전, 예정된 작업, 다운그레이드 확인이 필요한지 여부를 표시합니다.

## Plugin 및 채널

`openclaw update`로 채널을 전환하면 OpenClaw은 Plugin 소스도 동기화합니다.

- `dev`는 git 체크아웃의 번들 Plugin을 우선 사용합니다.
- `stable` 및 `beta`는 npm으로 설치된 Plugin 패키지를 복원합니다.
- npm으로 설치된 Plugin은 코어 업데이트가 완료된 후 업데이트됩니다.

## 현재 상태 확인

```bash
openclaw update status
```

활성 채널, 설치 종류(git 또는 패키지), 현재 버전, 소스(구성, git 태그, git 브랜치 또는 기본값)를 표시합니다.

## 태그 지정 모범 사례

- git 체크아웃이 도달하게 할 릴리스에 태그를 지정하세요(stable은 `vYYYY.M.PATCH`, beta는 `vYYYY.M.PATCH-beta.N`; `-alpha.N`, `-rc.N`, `-next.N` 같은 명명된 semver 프리릴리스 접미사는 stable 대상이 아닙니다).
- `vYYYY.M.PATCH-1` 및 `v1.0.1-1` 같은 레거시 숫자 stable 태그는 호환성을 위해 여전히 stable git 태그로 인식됩니다.
- `vYYYY.M.PATCH.beta.N`도 호환성을 위해 인식되지만, `-beta.N`을 선호하세요.
- 태그는 변경 불가능하게 유지하세요. 태그를 이동하거나 재사용하지 마세요.
- npm dist-tag는 npm 설치의 단일 기준으로 유지됩니다.
  - `latest` -> stable
  - `beta` -> 후보 빌드 또는 beta-first stable 빌드
  - `dev` -> main 스냅샷(선택 사항)

## macOS 앱 가용성

Beta 및 dev 빌드에는 macOS 앱 릴리스가 포함되지 **않을 수 있습니다**. 이는 괜찮습니다.

- git 태그와 npm dist-tag는 계속 게시할 수 있습니다.
- 릴리스 노트 또는 changelog에 "이 beta에는 macOS 빌드 없음"을 명시하세요.

## 관련 항목

- [업데이트](/ko/install/updating)
- [Installer 내부 구조](/ko/install/installer)
