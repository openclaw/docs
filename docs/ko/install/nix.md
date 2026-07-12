---
read_when:
    - 재현 가능하고 롤백할 수 있는 설치를 원하는 경우
    - 이미 Nix/NixOS/Home Manager를 사용 중인 경우
    - 모든 항목을 고정하고 선언적으로 관리하려는 경우
summary: Nix를 사용하여 OpenClaw를 선언적으로 설치하기
title: Nix
x-i18n:
    generated_at: "2026-07-12T00:54:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6f74e259ec3d909c73d9184db24d236135db04c29c2e7fab9be9e6fa7f98ba91
    source_path: install/nix.md
    workflow: 16
---

**[nix-openclaw](https://github.com/openclaw/nix-openclaw)**을 사용해 OpenClaw를 선언적으로 설치하세요. nix-openclaw는 필요한 기능을 모두 갖춘 공식 Home Manager 모듈입니다.

<Info>
Nix 설치에 관한 기준 정보는 [nix-openclaw](https://github.com/openclaw/nix-openclaw) 저장소에서 확인할 수 있습니다. 이 페이지에서는 이를 간략히 살펴봅니다.
</Info>

## 제공되는 기능

- 모두 버전이 고정된 Gateway, macOS 앱 및 도구(whisper, spotify, 카메라)
- 재부팅 후에도 유지되는 launchd 서비스
- 선언적 구성을 지원하는 Plugin 시스템
- 즉시 롤백: `home-manager switch --rollback`

## 빠른 시작

<Steps>
  <Step title="Determinate Nix 설치">
    Nix가 아직 설치되어 있지 않다면 [Determinate Nix 설치 프로그램](https://github.com/DeterminateSystems/nix-installer)의 안내를 따르세요.
  </Step>
  <Step title="로컬 flake 생성">
    nix-openclaw 저장소의 에이전트 우선 템플릿을 사용하세요.
    ```bash
    mkdir -p ~/code/openclaw-local
    # nix-openclaw 저장소에서 templates/agent-first/flake.nix 복사
    ```
  </Step>
  <Step title="보안 정보 구성">
    메시징 봇 토큰과 모델 제공업체 API 키를 설정하세요. `~/.secrets/`의 일반 파일을 사용해도 됩니다.
  </Step>
  <Step title="템플릿 자리표시자를 채우고 전환">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="확인">
    launchd 서비스가 실행 중이고 봇이 메시지에 응답하는지 확인하세요.
  </Step>
</Steps>

전체 모듈 옵션과 예시는 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)를 참조하세요.

## Nix 모드 런타임 동작

`OPENCLAW_NIX_MODE=1`이 설정되면(nix-openclaw에서는 자동 설정) OpenClaw가 Nix 관리형 설치를 위한 결정적 모드로 전환됩니다. 다른 Nix 패키지도 동일한 모드를 설정할 수 있으며, nix-openclaw가 공식 참조 구현입니다.

직접 설정할 수도 있습니다.

```bash
export OPENCLAW_NIX_MODE=1
```

macOS에서는 GUI 앱이 셸 환경 변수를 상속하지 않습니다. 대신 `defaults`를 통해 Nix 모드를 활성화하세요.

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 모드에서 변경되는 사항

- 자동 설치 및 자체 변경 흐름이 비활성화됩니다.
- `openclaw.json`은 변경할 수 없는 파일로 취급됩니다. 시작 시 파생되는 기본값은 런타임에만 유지되며, 구성 작성 기능(설정, 온보딩, 구성을 변경하는 `openclaw update`, Plugin 설치/업데이트/제거/활성화, `doctor --fix`, `doctor --generate-gateway-token`, `openclaw config set)은 이 파일의 편집을 거부합니다.
- 대신 Nix 소스를 편집하세요. nix-openclaw에서는 에이전트 우선 [빠른 시작](https://github.com/openclaw/nix-openclaw#quick-start)을 따르고 `programs.openclaw.config` 또는 `instances.<name>.config` 아래에서 구성을 설정하세요.
- 종속성이 누락되면 Nix 전용 해결 안내 메시지가 표시됩니다.
- UI에 읽기 전용 Nix 모드 배너가 표시됩니다.

### 구성 및 상태 경로

OpenClaw는 `OPENCLAW_CONFIG_PATH`에서 JSON5 구성을 읽고 변경 가능한 데이터를 `OPENCLAW_STATE_DIR`에 저장합니다. Nix에서는 런타임 상태와 구성이 변경 불가능한 저장소에 들어가지 않도록 Nix 관리형 위치를 명시적으로 설정하세요.

| 변수                   | 기본값                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 서비스 PATH 검색

launchd/systemd Gateway 서비스는 Nix 프로필 바이너리를 자동으로 검색하므로 Plugin과 도구에서 `nix`로 설치된 실행 파일을 호출할 때 PATH를 직접 설정할 필요가 없습니다.

- `NIX_PROFILES`가 설정되어 있으면 모든 항목이 오른쪽에서 왼쪽으로 우선순위를 적용해 서비스 PATH에 추가됩니다(Nix 셸 우선순위와 동일하게 가장 오른쪽 항목이 우선합니다).
- `NIX_PROFILES`가 설정되어 있지 않으면 대체 경로로 `~/.nix-profile/bin`이 추가됩니다.

이는 macOS launchd와 Linux systemd 서비스 환경 모두에 적용됩니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    기준 정보인 Home Manager 모듈과 전체 설정 가이드입니다.
  </Card>
  <Card title="설정 마법사" href="/ko/start/wizard" icon="wand-magic-sparkles">
    Nix를 사용하지 않는 CLI 설정 절차입니다.
  </Card>
  <Card title="Docker" href="/ko/install/docker" icon="docker">
    Nix를 사용하지 않는 대안인 컨테이너 기반 설정입니다.
  </Card>
  <Card title="업데이트" href="/ko/install/updating" icon="arrow-up-right-from-square">
    패키지와 함께 Home Manager 관리형 설치를 업데이트하는 방법입니다.
  </Card>
</CardGroup>
