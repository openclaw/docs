---
read_when:
    - Docker 대신 Podman을 사용하는 컨테이너화된 Gateway가 필요한 경우
summary: 루트리스 Podman 컨테이너에서 OpenClaw 실행하기
title: Podman
x-i18n:
    generated_at: "2026-07-12T00:51:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2db1f2b0413d7b9e1b2007aaae2da9d07fa44a1b52901d4a6cbc6274e54567f1
    source_path: install/podman.md
    workflow: 16
---

루트 권한이 없는 Podman 컨테이너에서 OpenClaw Gateway를 실행하고, 현재의 루트가 아닌 사용자가 관리합니다.

모델은 다음과 같습니다.

- Podman이 Gateway 컨테이너를 실행합니다.
- 호스트의 `openclaw` CLI가 제어 평면 역할을 합니다.
- 영구 상태는 기본적으로 호스트의 `~/.openclaw` 아래에 저장됩니다.
- 일상적인 관리에는 `sudo -u openclaw`, `podman exec` 또는 별도의 서비스 사용자 대신 `openclaw --container <name> ...`을 사용합니다.

## 사전 요구 사항

- 루트리스 모드의 **Podman**
- 호스트에 설치된 **OpenClaw CLI**
- **선택 사항:** Quadlet으로 관리되는 자동 시작을 사용하려는 경우 `systemd --user`
- **선택 사항:** 헤드리스 호스트에서 부팅 후에도 계속 실행하기 위해 `loginctl enable-linger "$(whoami)"`를 사용하려는 경우에만 `sudo`

## 빠른 시작

<Steps>
  <Step title="최초 설정">
    저장소 루트에서 `./scripts/podman/setup.sh`를 실행합니다.

    이 명령은 루트리스 Podman 저장소에 `openclaw:local`을 빌드하거나, `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`가 설정되어 있으면 해당 이미지를 가져옵니다. 또한 `~/.openclaw/openclaw.json`이 없으면 `gateway.mode: "local"` 설정으로 생성하고, `~/.openclaw/.env`가 없으면 생성된 `OPENCLAW_GATEWAY_TOKEN`을 포함하여 생성합니다.

    선택적 빌드 시점 환경 변수:

    | 변수 | 효과 |
    | --- | --- |
    | `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` | `openclaw:local`을 빌드하는 대신 기존 이미지나 가져온 이미지 사용 |
    | `OPENCLAW_IMAGE_APT_PACKAGES` | 이미지 빌드 중 추가 apt 패키지 설치(레거시 `OPENCLAW_DOCKER_APT_PACKAGES`도 허용) |
    | `OPENCLAW_IMAGE_PIP_PACKAGES` | 이미지 빌드 중 추가 Python 패키지 설치. 버전을 고정하고 신뢰하는 패키지 인덱스만 사용해야 함 |
    | `OPENCLAW_EXTENSIONS` | 지원되는 선택 Plugin을 컴파일·패키징하고 해당 런타임 종속성 설치 |
    | `OPENCLAW_INSTALL_BROWSER` | 브라우저 자동화를 위해 Chromium과 Xvfb 사전 설치(`1`로 설정) |

    대신 Quadlet으로 관리되는 설정을 사용하려면(Linux 및 systemd 사용자 서비스만 해당):

    ```bash
    ./scripts/podman/setup.sh --quadlet
    ```

    또는 `OPENCLAW_PODMAN_QUADLET=1`을 설정합니다.

  </Step>

  <Step title="Gateway 컨테이너 시작">
    ```bash
    ./scripts/run-openclaw-podman.sh launch
    ```

    `--userns=keep-id`를 사용하여 현재 uid/gid로 컨테이너를 시작하고 OpenClaw 상태를 컨테이너에 바인드 마운트합니다.

  </Step>

  <Step title="컨테이너 내부에서 온보딩 실행">
    ```bash
    ./scripts/run-openclaw-podman.sh launch setup
    ```

    그런 다음 `http://127.0.0.1:18789/`을 열고 `~/.openclaw/.env`의 토큰을 사용합니다.

    모델 인증: 설정 중에 OpenClaw가 관리하는 인증을 사용합니다(Anthropic API 키 또는 Codex 기반 OpenAI를 위한 OpenAI Codex 브라우저 OAuth/기기 코드 인증). Podman 실행기는 `~/.claude`나 `~/.codex` 같은 호스트 CLI 자격 증명 홈을 설정 또는 Gateway 컨테이너에 마운트하지 않습니다. 기존 호스트 CLI 로그인은 동일 호스트에서의 편의 기능일 뿐입니다. 컨테이너 설치에서는 공급자 인증을 설정이 관리하는 마운트된 `~/.openclaw` 상태에 보관합니다.

  </Step>

  <Step title="호스트 CLI에서 실행 중인 컨테이너 관리">
    ```bash
    export OPENCLAW_CONTAINER=openclaw
    ```

    그러면 일반적인 `openclaw` 명령이 해당 컨테이너 내부에서 자동으로 실행됩니다.

    ```bash
    openclaw dashboard --no-open
    openclaw gateway status --deep   # 추가 서비스 검사 포함
    openclaw doctor
    openclaw channels login
    ```

    macOS에서는 Podman 머신 때문에 브라우저가 Gateway에 로컬로 보이지 않을 수 있습니다. 실행 후 Control UI에 기기 인증 오류가 표시되면 [Podman과 Tailscale](#podman-and-tailscale)의 Tailscale 지침을 따르세요.

  </Step>
</Steps>

수동 실행기는 `~/.openclaw/.env`에서 Podman 관련 키의 작은 허용 목록만 읽고 명시적인 런타임 환경 변수를 컨테이너에 전달합니다. 전체 환경 파일을 Podman에 넘기지는 않습니다.

<a id="podman-and-tailscale"></a>

## Podman과 Tailscale

HTTPS 또는 원격 브라우저 접근에는 기본 Tailscale 문서를 따르세요.

Podman 관련 참고 사항:

- Podman 게시 호스트를 `127.0.0.1`로 유지합니다.
- `openclaw gateway --tailscale serve`보다 호스트에서 관리하는 `tailscale serve`를 권장합니다.
- macOS에서 로컬 브라우저 기기 인증 컨텍스트가 불안정하다면 임시 로컬 터널 우회 방법 대신 Tailscale 접근을 사용합니다.

[Tailscale](/ko/gateway/tailscale) 및 [Control UI](/ko/web/control-ui)를 참조하세요.

## Systemd(Quadlet, 선택 사항)

`./scripts/podman/setup.sh --quadlet`을 실행했다면 설정 과정에서 `~/.config/containers/systemd/openclaw.container`에 Quadlet 파일을 설치합니다.

| 작업 | 명령                                       |
| ---- | ------------------------------------------ |
| 시작 | `systemctl --user start openclaw.service`  |
| 중지 | `systemctl --user stop openclaw.service`   |
| 상태 | `systemctl --user status openclaw.service` |
| 로그 | `journalctl --user -u openclaw.service -f` |

Quadlet 파일을 편집한 후:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/헤드리스 호스트에서 부팅 후에도 계속 실행하려면 현재 사용자에 대해 lingering을 활성화합니다.

```bash
sudo loginctl enable-linger "$(whoami)"
```

생성된 Quadlet 서비스는 고정되고 강화된 기본 구성을 유지합니다. 게시 포트는 `127.0.0.1`에 바인딩되고(`18789` Gateway, `18790` 브리지), 컨테이너 내부에서는 `--bind lan`, `keep-id` 사용자 네임스페이스, `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, `TimeoutStartSec=300`을 사용합니다. `OPENCLAW_GATEWAY_TOKEN` 같은 값을 위해 `~/.openclaw/.env`를 런타임 `EnvironmentFile`로 읽지만, 수동 실행기의 Podman 전용 재정의 허용 목록은 사용하지 않습니다. 게시 포트, 게시 호스트 또는 기타 컨테이너 실행 플래그를 사용자 지정하려면 수동 실행기를 사용하거나 `~/.config/containers/systemd/openclaw.container`를 직접 편집한 다음 서비스를 다시 로드하고 재시작합니다.

## 구성, 환경 변수 및 저장소

- **구성 디렉터리:** `~/.openclaw`
- **작업 공간 디렉터리:** `~/.openclaw/workspace`
- **토큰 파일:** `~/.openclaw/.env`
- **실행 도우미:** `./scripts/run-openclaw-podman.sh`

실행 스크립트와 Quadlet은 호스트 상태를 컨테이너에 바인드 마운트합니다. `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`, `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`. 기본적으로 이들은 익명 컨테이너 상태가 아닌 호스트 디렉터리이므로 컨테이너를 교체해도 `openclaw.json`, 에이전트별 `auth-profiles.json`, 채널/공급자 상태, 세션 및 작업 공간이 유지됩니다. 또한 설정 과정에서 게시된 Gateway 포트의 `127.0.0.1`과 `localhost`를 `gateway.controlUi.allowedOrigins`에 추가하므로 컨테이너가 local loopback이 아닌 주소에 바인딩되어도 로컬 대시보드가 작동합니다.

수동 실행기에 유용한 환경 변수(`~/.openclaw/.env`에 저장하세요. 실행기는 컨테이너/이미지 기본값을 확정하기 전에 이 파일을 읽습니다):

| 변수                                       | 기본값           | 효과                                    |
| ------------------------------------------ | ---------------- | --------------------------------------- |
| `OPENCLAW_PODMAN_CONTAINER`                | `openclaw`       | 컨테이너 이름                           |
| `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` | `openclaw:local` | 실행할 이미지                           |
| `OPENCLAW_PODMAN_GATEWAY_HOST_PORT`        | `18789`          | 컨테이너 `18789`에 매핑되는 호스트 포트 |
| `OPENCLAW_PODMAN_BRIDGE_HOST_PORT`         | `18790`          | 컨테이너 `18790`에 매핑되는 호스트 포트 |
| `OPENCLAW_PODMAN_PUBLISH_HOST`             | `127.0.0.1`      | 게시된 포트에 사용할 호스트 인터페이스  |
| `OPENCLAW_GATEWAY_BIND`                    | `lan`            | 컨테이너 내부의 Gateway 바인드 모드      |
| `OPENCLAW_PODMAN_USERNS`                   | `keep-id`        | `keep-id`, `auto` 또는 `host`           |

기본값이 아닌 `OPENCLAW_CONFIG_DIR` 또는 `OPENCLAW_WORKSPACE_DIR`을 사용하는 경우 `./scripts/podman/setup.sh`와 이후의 `./scripts/run-openclaw-podman.sh launch` 명령 모두에 동일한 변수를 설정하세요. 저장소 로컬 실행기는 셸 간에 사용자 지정 경로 재정의를 유지하지 않습니다.

## 이미지 업그레이드

새 이미지를 다시 빌드하거나 가져온 후 컨테이너 또는 Quadlet 서비스를 재시작합니다.
새 OpenClaw 버전으로 처음 시작할 때 Gateway는 준비 완료 상태를 보고하기 전에 안전한 상태 및
Plugin 복구를 실행합니다.

Gateway가 준비 상태가 되지 않고 종료되면 동일하게 마운트된 상태/구성을 대상으로
같은 이미지를 `openclaw doctor --fix`와 함께 한 번 실행한 다음
Gateway를 정상적으로 재시작합니다.

```bash
OPENCLAW_CONFIG_DIR="${OPENCLAW_CONFIG_DIR:-$HOME/.openclaw}"
OPENCLAW_WORKSPACE_DIR="${OPENCLAW_WORKSPACE_DIR:-$OPENCLAW_CONFIG_DIR/workspace}"
OPENCLAW_PODMAN_IMAGE="${OPENCLAW_PODMAN_IMAGE:-${OPENCLAW_IMAGE:-openclaw:local}}"

podman run --rm -it \
  --userns=keep-id \
  --user "$(id -u):$(id -g)" \
  -e HOME=/home/node \
  -e NPM_CONFIG_CACHE=/home/node/.openclaw/.npm \
  -v "$OPENCLAW_CONFIG_DIR:/home/node/.openclaw:rw" \
  -v "$OPENCLAW_WORKSPACE_DIR:/home/node/.openclaw/workspace:rw" \
  "$OPENCLAW_PODMAN_IMAGE" \
  openclaw doctor --fix
```

SELinux 호스트에서 Podman이 마운트된 상태에 대한 접근을 차단하면 두 바인드 마운트 모두에 `,Z`를 추가합니다.

## 유용한 명령

- **컨테이너 로그:** `podman logs -f openclaw`
- **컨테이너 중지:** `podman stop openclaw`
- **컨테이너 제거:** `podman rm -f openclaw`
- **호스트 CLI에서 대시보드 URL 열기:** `openclaw dashboard --no-open`
- **호스트 CLI를 통한 상태/정상성 확인:** `openclaw gateway status --deep`(RPC 검사 + 추가 서비스 검사)

## 문제 해결

- **구성 또는 작업 공간에서 권한 거부(EACCES):** 컨테이너는 기본적으로 `--userns=keep-id` 및 `--user <your uid>:<your gid>`로 실행됩니다. 호스트 구성/작업 공간 경로의 소유자가 현재 사용자인지 확인하세요.
- **Gateway 시작 차단(`gateway.mode=local` 누락):** `~/.openclaw/openclaw.json`이 존재하고 `gateway.mode="local"`을 설정하는지 확인하세요. 파일이 없으면 `scripts/podman/setup.sh`가 생성합니다.
- **이미지 업데이트 후 컨테이너가 다시 시작됨:** [이미지 업그레이드](#upgrading-images)의 일회성 `openclaw doctor --fix` 명령을 실행한 다음 Gateway를 다시 시작하세요.
- **컨테이너 CLI 명령이 잘못된 대상을 사용함:** `openclaw --container <name> ...`을 명시적으로 사용하거나 셸에서 `OPENCLAW_CONTAINER=<name>`을 내보내세요.
- **`--container` 사용 시 `openclaw update` 실패:** 예상된 동작입니다. 이미지를 다시 빌드하거나 가져온 다음 컨테이너 또는 Quadlet 서비스를 재시작하세요.
- **Quadlet 서비스가 시작되지 않음:** `systemctl --user daemon-reload`를 실행한 다음 `systemctl --user start openclaw.service`를 실행하세요. 헤드리스 시스템에서는 `sudo loginctl enable-linger "$(whoami)"`도 필요할 수 있습니다.
- **SELinux가 바인드 마운트를 차단함:** 기본 마운트 동작을 그대로 두세요. SELinux가 강제 또는 허용 모드일 때 실행기가 Linux에서 자동으로 `:Z`를 추가합니다.

## 관련 문서

- [Docker](/ko/install/docker)
- [Gateway 백그라운드 프로세스](/ko/gateway/background-process)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
