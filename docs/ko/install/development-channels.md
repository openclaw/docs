---
read_when:
    - stable/extended-stable/beta/dev 간에 전환하려고 합니다
    - 특정 버전, 태그 또는 SHA를 고정하려는 경우
    - 시험판 릴리스에 태그를 지정하거나 게시하고 있습니다
sidebarTitle: Release Channels
summary: '안정, 확장 안정, 베타 및 개발 채널: 의미, 전환, 고정 및 태그 지정'
title: 릴리스 채널
x-i18n:
    generated_at: "2026-07-12T15:25:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a99e31f5121c0ab8696e638cb10a7ce16e8f32c81e4b2bef1f703eef71191494
    source_path: install/development-channels.md
    workflow: 16
---

OpenClaw은 네 가지 업데이트 채널을 제공합니다.

- **stable**: npm dist-tag `latest`. 대부분의 사용자에게 권장합니다.
- **extended-stable**: npm dist-tag `extended-stable`. 새로 추가된 후행
  지원 월 패키지 채널입니다. 패키지 전용이며 설치는 포그라운드에서만
  수행됩니다. 저장된 선택 항목은 `update.checkOnStart`가 활성화된 경우
  읽기 전용 업데이트 알림을 받지만, 자동으로 적용되지는 않습니다.
- **beta**: npm dist-tag `beta`. `beta`가 없거나 현재 안정 릴리스보다
  오래된 경우 `latest`로 폴백합니다.
- **dev**: `main`의 이동식 최신 헤드(git)입니다. 게시된 경우 npm dist-tag는
  `dev`입니다. `main`은 실험 및 활발한 개발용이며, 미완성 기능이나
  호환성을 깨뜨리는 변경 사항이 포함될 수 있습니다. 프로덕션 Gateway에서는 실행하지 마십시오.

안정 빌드는 일반적으로 먼저 **beta**로 출시되어 검증된 후, 버전 증가 없이
**latest**로 승격됩니다. 유지관리자는 `latest`에 직접 게시할 수도 있습니다.
npm 설치에서는 dist-tag가 기준 정보입니다.

## 채널 전환

```bash
openclaw update --channel stable
openclaw update --channel extended-stable
openclaw update --channel beta
openclaw update --channel dev
```

`--channel`은 선택 사항을 구성의 `update.channel`에 유지하며, 다음 두
설치 경로를 모두 제어합니다.

| 채널              | npm/패키지 설치                                                                                                                                                                        | git 설치                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`          | dist-tag `latest`                                                                                                                                                                      | 최신 안정 git 태그(`-alpha.N`, `-beta.N`, `-rc.N`, `-dev.N`, `-next.N`, `-preview.N`, `-canary.N`, `-nightly.N` 및 기타 명명된 사전 릴리스 접미사 제외) |
| `extended-stable` | 공개 npm `extended-stable` 선택자를 확인하고, 정확히 선택된 패키지를 검증한 후 해당 버전을 정확히 설치합니다. `latest`, `beta` 또는 `dev`로 폴백하지 않고 실패 시 중단합니다. | 지원되지 않음: OpenClaw은 체크아웃을 변경하지 않고 패키지 설치를 사용하도록 안내합니다.                                                                           |
| `beta`            | dist-tag `beta`. `beta`가 없거나 더 오래된 경우 `latest`로 폴백합니다.                                                                                                                 | 최신 베타 git 태그. 베타가 없거나 더 오래된 경우 최신 안정 git 태그로 폴백합니다.                                                                                  |
| `dev`             | dist-tag `dev`(드묾. 대부분의 dev 사용자는 git 설치를 실행함)                                                                                                                          | 가져오기를 수행하고 체크아웃을 업스트림 `main` 브랜치에 리베이스한 다음, 빌드하고 전역 CLI를 다시 설치합니다.                                                      |

`dev` git 설치의 기본 체크아웃은 `~/openclaw`이며(`OPENCLAW_HOME`이 설정된
경우 `$OPENCLAW_HOME/openclaw`), `OPENCLAW_GIT_DIR`로 재정의할 수 있습니다.

<Tip>
stable과 dev를 병렬로 유지하려면 별도의 체크아웃 두 개를 사용하고 각 Gateway가 자체 체크아웃을 가리키도록 하십시오.
</Tip>

## 일회성 버전 또는 태그 지정

유지된 채널을 변경하지 **않고** 단일 업데이트에 특정 dist-tag, 버전 또는
패키지 사양을 지정하려면 `--tag`를 사용하십시오.

```bash
# 특정 버전 설치
openclaw update --tag 2026.4.1-beta.1

# beta dist-tag에서 설치(일회성이며 유지되지 않음)
openclaw update --tag beta

# 이동식 GitHub main 체크아웃으로 전환(유지됨)
openclaw update --channel dev

# 특정 npm 패키지 사양 설치
openclaw update --tag openclaw@2026.4.1-beta.1

# 채널을 유지하지 않고 GitHub main에서 한 번 설치
openclaw update --tag main
```

참고:

- `--tag`는 **패키지(npm) 설치에만** 적용되며, git 설치에서는 무시됩니다.
- 태그는 유지되지 않으며, 다음 `openclaw update`는 구성된 채널을 사용합니다.
- `--tag main`은 해당 한 번의 실행에 대해 npm 호환 사양
  `github:openclaw/openclaw#main`으로 매핑됩니다. 계속 이동하는 `main`
  설치를 유지하려면 `openclaw update --channel dev`를 사용하거나(패키지
  설치가 git 체크아웃으로 전환됨), 설치 프로그램의 git 방식으로 다시 설치하십시오.
  `curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git --version main`.
  npm 설치 경로는 GitHub/git 소스 대상을 명시적으로 거부하고 대신 git 방식을
  사용하도록 안내합니다.
- 다운그레이드 보호: 대상 버전이 현재 버전보다 오래된 경우 OpenClaw이
  확인을 요청합니다(`--yes`로 건너뛸 수 있음).
- extended-stable은 항상 검증된 정확한 패키지 대상을 사용합니다. 이는
  `--tag extended-stable`의 일회성 별칭이 아니며, `--tag`는 유효한
  extended-stable 채널과 함께 사용할 수 없습니다.
- `--channel beta`는 `--tag beta`와 다릅니다. 채널 흐름은 beta가 없거나
  더 오래된 경우 stable/latest로 폴백할 수 있지만, `--tag beta`는 항상
  해당 한 번의 실행에 원시 `beta` dist-tag를 지정합니다.

## 시험 실행

변경 사항을 적용하지 않고 `openclaw update`가 수행할 작업을 미리 확인합니다.

```bash
openclaw update --dry-run
openclaw update --channel beta --dry-run
openclaw update --tag 2026.4.1-beta.1 --dry-run
openclaw update --dry-run --json
```

시험 실행은 유효 채널, 대상 버전, 계획된 작업 및 다운그레이드 확인이
필요한지 여부를 보고합니다.

## Plugin 및 채널

`openclaw update`로 채널을 전환하면 Plugin 소스도 동기화됩니다.

- `dev`는 번들 대응 항목이 있는 설치된 Plugin을 해당 번들(git 체크아웃)
  소스로 다시 전환합니다.
- `stable`과 `beta`는 npm 또는 ClawHub에서 설치된 Plugin 패키지를
  복원합니다.
- `extended-stable`은 단순/기본 또는 `latest` 의도를 가진 적격 공식 npm
  Plugin을 정확히 설치된 코어 버전으로 확인합니다. 런타임에 Plugin의
  `@extended-stable` 태그를 조회하지 않습니다.
- npm으로 설치된 Plugin은 코어 업데이트가 완료된 후 업데이트됩니다.

## 현재 상태 확인

```bash
openclaw update status
```

활성 채널과 이를 결정한 소스(구성, git 태그, git 브랜치, 설치된 버전 또는
기본값), 설치 종류(git 또는 패키지), 현재 버전 및 업데이트 가능 여부를
표시합니다.

## 태그 지정 모범 사례

- git 체크아웃이 도달할 릴리스에 태그를 지정하십시오. 안정 버전은
  `vYYYY.M.PATCH`, 베타는 `vYYYY.M.PATCH-beta.N`을 사용합니다.
  `-alpha.N`, `-rc.N`, `-next.N`과 같은 명명된 사전 릴리스 접미사는
  안정 또는 베타 대상이 아닙니다.
- `vYYYY.M.PATCH-1` 및 `v1.0.1-1`과 같은 레거시 숫자형 안정 태그도
  호환성을 위해 안정 git 태그로 계속 인식됩니다.
- `vYYYY.M.PATCH.beta.N`(점으로 구분)도 호환성을 위해 인식되지만,
  `-beta.N`을 사용하는 것이 좋습니다.
- 태그를 변경 불가능하게 유지하십시오. 태그를 이동하거나 재사용하지 마십시오.
- npm 설치에서는 npm dist-tag가 계속 기준 정보입니다.
  - `latest` -> stable
  - `extended-stable` -> 후행 지원 월 패키지 릴리스
  - `beta` -> 후보 빌드 또는 베타 우선 안정 빌드
  - `dev` -> main 스냅샷(선택 사항)

## macOS 앱 제공 여부

베타 및 dev 빌드에는 macOS 앱 릴리스가 포함되지 **않을** 수 있습니다.
이는 문제가 아닙니다.

- git 태그와 npm dist-tag는 각각 별도로 게시할 수 있습니다.
- 릴리스 노트 또는 변경 로그에 "이 베타에는 macOS 빌드가 없음"을 명시하십시오.

## 관련 문서

- [업데이트](/ko/install/updating)
- [설치 프로그램 내부 구조](/ko/install/installer)
