---
read_when:
    - 재현 가능하고 롤백 가능한 설치를 원한다면
    - 이미 Nix/NixOS/Home Manager를 사용 중입니다
    - 모든 것을 고정하고 선언적으로 관리하려는 경우
summary: Nix로 OpenClaw를 선언적으로 설치하기
title: Nix
x-i18n:
    generated_at: "2026-05-06T06:31:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0c25b97fb46a906bb726a13de095ead1e6c3642d28f66173b488acfbc5e0001
    source_path: install/nix.md
    workflow: 16
---

OpenClaw를 선언적으로 설치하려면 모든 기능이 포함된 Home Manager 모듈인 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)**을 사용하세요.

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) 저장소는 Nix 설치의 기준 소스입니다. 이 페이지는 간단한 개요입니다.
</Info>

## 제공되는 것

- Gateway + macOS 앱 + 도구(whisper, spotify, cameras) -- 모두 고정됨
- 재부팅 후에도 유지되는 launchd 서비스
- 선언적 구성을 지원하는 Plugin 시스템
- 즉시 롤백: `home-manager switch --rollback`

## 빠른 시작

<Steps>
  <Step title="Install Determinate Nix">
    Nix가 아직 설치되어 있지 않다면 [Determinate Nix installer](https://github.com/DeterminateSystems/nix-installer) 안내를 따르세요.
  </Step>
  <Step title="Create a local flake">
    nix-openclaw 저장소의 에이전트 우선 템플릿을 사용하세요.
    ```bash
    mkdir -p ~/code/openclaw-local
    # Copy templates/agent-first/flake.nix from the nix-openclaw repo
    ```
  </Step>
  <Step title="Configure secrets">
    메시징 봇 토큰과 모델 제공자 API 키를 설정하세요. `~/.secrets/`의 일반 파일로도 충분합니다.
  </Step>
  <Step title="Fill in template placeholders and switch">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="Verify">
    launchd 서비스가 실행 중이고 봇이 메시지에 응답하는지 확인하세요.
  </Step>
</Steps>

전체 모듈 옵션과 예시는 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)를 참조하세요.

## Nix 모드 런타임 동작

`OPENCLAW_NIX_MODE=1`이 설정되면(nix-openclaw에서는 자동), OpenClaw는 자동 설치 흐름을 비활성화하는 결정적 모드로 전환됩니다.

수동으로 설정할 수도 있습니다.

```bash
export OPENCLAW_NIX_MODE=1
```

macOS에서는 GUI 앱이 셸 환경 변수를 자동으로 상속하지 않습니다. 대신 defaults를 통해 Nix 모드를 활성화하세요.

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 모드에서 변경되는 것

- 자동 설치 및 자체 변경 흐름이 비활성화됩니다
- 누락된 종속성에 대해 Nix 전용 해결 메시지가 표시됩니다
- UI에 읽기 전용 Nix 모드 배너가 표시됩니다

### 구성 및 상태 경로

OpenClaw는 `OPENCLAW_CONFIG_PATH`에서 JSON5 구성을 읽고 변경 가능한 데이터를 `OPENCLAW_STATE_DIR`에 저장합니다. Nix에서 실행할 때는 런타임 상태와 구성이 불변 스토어 밖에 있도록 이를 Nix에서 관리하는 위치로 명시적으로 설정하세요.

| 변수                   | 기본값                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 서비스 PATH 검색

launchd/systemd gateway 서비스는 Nix 프로필 바이너리를 자동으로 검색하므로
`nix`로 설치된 실행 파일을 셸에서 호출하는 Plugin과 도구가
수동 PATH 설정 없이 작동합니다.

- `NIX_PROFILES`가 설정된 경우, 모든 항목이 오른쪽에서 왼쪽으로 우선순위를 적용해 서비스 PATH에 추가됩니다(Nix 셸 우선순위와 일치 -- 가장 오른쪽이 우선).
- `NIX_PROFILES`가 설정되지 않은 경우, `~/.nix-profile/bin`이 대체 경로로 추가됩니다.

이는 macOS launchd와 Linux systemd 서비스 환경 모두에 적용됩니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    기준 소스 Home Manager 모듈 및 전체 설정 가이드입니다.
  </Card>
  <Card title="Setup wizard" href="/ko/start/wizard" icon="wand-magic-sparkles">
    Nix를 사용하지 않는 CLI 설정 안내입니다.
  </Card>
  <Card title="Docker" href="/ko/install/docker" icon="docker">
    Nix를 사용하지 않는 대안인 컨테이너 기반 설정입니다.
  </Card>
  <Card title="Updating" href="/ko/install/updating" icon="arrow-up-right-from-square">
    패키지와 함께 Home Manager로 관리되는 설치를 업데이트합니다.
  </Card>
</CardGroup>
