---
read_when:
    - Docker 대신 Podman으로 컨테이너화된 Gateway를 사용하려는 경우
summary: 루트리스 Podman 컨테이너에서 OpenClaw 실행하기
title: Podman
x-i18n:
    generated_at: "2026-04-30T06:38:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: bfdcbbdb62c2f8ca2d6d370b742003e6f92f6921a38c00ba19e810d83e350647
    source_path: install/podman.md
    workflow: 16
---

루트 없는 Podman 컨테이너에서 OpenClaw Gateway를 실행하고, 현재 비루트 사용자로 관리합니다.

의도된 모델은 다음과 같습니다.

- Podman이 Gateway 컨테이너를 실행합니다.
- 호스트의 `openclaw` CLI가 컨트롤 플레인입니다.
- 지속 상태는 기본적으로 호스트의 `~/.openclaw` 아래에 저장됩니다.
- 일상적인 관리는 `sudo -u openclaw`, `podman exec` 또는 별도의 서비스 사용자 대신 `openclaw --container <name> ...`를 사용합니다.

## 필수 조건

- 루트 없는 모드의 **Podman**
- 호스트에 설치된 **OpenClaw CLI**
- **선택 사항:** Quadlet 관리 자동 시작을 원하는 경우 `systemd --user`
- **선택 사항:** 헤드리스 호스트에서 부팅 지속성을 위해 `loginctl enable-linger "$(whoami)"`를 원하는 경우에만 `sudo`

## 빠른 시작

<Steps>
  <Step title="일회성 설정">
    저장소 루트에서 `./scripts/podman/setup.sh`를 실행합니다.
  </Step>

  <Step title="Gateway 컨테이너 시작">
    `./scripts/run-openclaw-podman.sh launch`로 컨테이너를 시작합니다.
  </Step>

  <Step title="컨테이너 내부에서 온보딩 실행">
    `./scripts/run-openclaw-podman.sh launch setup`을 실행한 다음 `http://127.0.0.1:18789/`를 엽니다.
  </Step>

  <Step title="호스트 CLI에서 실행 중인 컨테이너 관리">
    `OPENCLAW_CONTAINER=openclaw`를 설정한 다음 호스트에서 일반 `openclaw` 명령을 사용합니다.
  </Step>
</Steps>

설정 세부 정보:

- `./scripts/podman/setup.sh`는 기본적으로 루트 없는 Podman 저장소에 `openclaw:local`을 빌드하거나, 설정한 경우 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`를 사용합니다.
- 누락된 경우 `gateway.mode: "local"`이 포함된 `~/.openclaw/openclaw.json`을 생성합니다.
- 누락된 경우 `OPENCLAW_GATEWAY_TOKEN`이 포함된 `~/.openclaw/.env`를 생성합니다.
- 수동 실행의 경우, 헬퍼는 `~/.openclaw/.env`에서 Podman 관련 키의 작은 허용 목록만 읽고 명시적인 런타임 env vars를 컨테이너에 전달합니다. 전체 env 파일을 Podman에 넘기지 않습니다.

Quadlet 관리 설정:

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet은 systemd 사용자 서비스에 의존하므로 Linux 전용 옵션입니다.

`OPENCLAW_PODMAN_QUADLET=1`도 설정할 수 있습니다.

선택적 빌드/설정 env vars:

- `OPENCLAW_IMAGE` 또는 `OPENCLAW_PODMAN_IMAGE` -- `openclaw:local`을 빌드하는 대신 기존/가져온 이미지를 사용합니다
- `OPENCLAW_DOCKER_APT_PACKAGES` -- 이미지 빌드 중 추가 apt 패키지를 설치합니다
- `OPENCLAW_EXTENSIONS` -- 빌드 시점에 Plugin 종속성을 미리 설치합니다
- `OPENCLAW_INSTALL_BROWSER` -- 브라우저 자동화를 위해 Chromium 및 Xvfb를 미리 설치합니다(활성화하려면 `1`로 설정)

컨테이너 시작:

```bash
./scripts/run-openclaw-podman.sh launch
```

이 스크립트는 `--userns=keep-id`를 사용해 현재 uid/gid로 컨테이너를 시작하고 OpenClaw 상태를 컨테이너에 바인드 마운트합니다.

온보딩:

```bash
./scripts/run-openclaw-podman.sh launch setup
```

그런 다음 `http://127.0.0.1:18789/`를 열고 `~/.openclaw/.env`의 토큰을 사용합니다.

호스트 CLI 기본값:

```bash
export OPENCLAW_CONTAINER=openclaw
```

그러면 다음과 같은 명령이 해당 컨테이너 내부에서 자동으로 실행됩니다.

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # includes extra service scan
openclaw doctor
openclaw channels login
```

macOS에서는 Podman machine 때문에 브라우저가 Gateway에 비로컬로 보일 수 있습니다.
실행 후 Control UI에서 디바이스 인증 오류가 보고되면
[Podman + Tailscale](#podman--tailscale)의 Tailscale 지침을 사용하세요.

<a id="podman--tailscale"></a>

## Podman + Tailscale

HTTPS 또는 원격 브라우저 액세스의 경우 기본 Tailscale 문서를 따르세요.

Podman 관련 참고:

- Podman 게시 호스트를 `127.0.0.1`로 유지하세요.
- `openclaw gateway --tailscale serve`보다 호스트 관리 `tailscale serve`를 선호하세요.
- macOS에서 로컬 브라우저 디바이스 인증 컨텍스트가 불안정한 경우, 임시 로컬 터널 우회 방법 대신 Tailscale 액세스를 사용하세요.

참조:

- [Tailscale](/ko/gateway/tailscale)
- [Control UI](/ko/web/control-ui)

## Systemd(Quadlet, 선택 사항)

`./scripts/podman/setup.sh --quadlet`을 실행했다면, 설정은 다음 위치에 Quadlet 파일을 설치합니다.

```bash
~/.config/containers/systemd/openclaw.container
```

유용한 명령:

- **시작:** `systemctl --user start openclaw.service`
- **중지:** `systemctl --user stop openclaw.service`
- **상태:** `systemctl --user status openclaw.service`
- **로그:** `journalctl --user -u openclaw.service -f`

Quadlet 파일을 편집한 후:

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

SSH/헤드리스 호스트에서 부팅 지속성을 위해 현재 사용자에 대해 linger를 활성화합니다.

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 구성, env 및 저장소

- **구성 디렉터리:** `~/.openclaw`
- **작업 공간 디렉터리:** `~/.openclaw/workspace`
- **토큰 파일:** `~/.openclaw/.env`
- **실행 헬퍼:** `./scripts/run-openclaw-podman.sh`

실행 스크립트와 Quadlet은 호스트 상태를 컨테이너에 바인드 마운트합니다.

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

기본적으로 이들은 익명 컨테이너 상태가 아니라 호스트 디렉터리이므로
`openclaw.json`, 에이전트별 `auth-profiles.json`, 채널/프로바이더 상태,
세션 및 작업 공간은 컨테이너 교체 후에도 유지됩니다.
또한 Podman 설정은 게시된 Gateway 포트에서 `127.0.0.1` 및 `localhost`에 대한 `gateway.controlUi.allowedOrigins`를 시드하므로, 로컬 대시보드가 컨테이너의 비루프백 바인드와 함께 작동합니다.

수동 실행기에 유용한 env vars:

- `OPENCLAW_PODMAN_CONTAINER` -- 컨테이너 이름(기본값은 `openclaw`)
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 실행할 이미지
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- 컨테이너 `18789`에 매핑되는 호스트 포트
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- 컨테이너 `18790`에 매핑되는 호스트 포트
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 게시된 포트의 호스트 인터페이스; 기본값은 `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- 컨테이너 내부의 Gateway 바인드 모드; 기본값은 `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`(기본값), `auto` 또는 `host`

수동 실행기는 컨테이너/이미지 기본값을 확정하기 전에 `~/.openclaw/.env`를 읽으므로, 이러한 값을 거기에 지속 저장할 수 있습니다.

기본값이 아닌 `OPENCLAW_CONFIG_DIR` 또는 `OPENCLAW_WORKSPACE_DIR`를 사용하는 경우, `./scripts/podman/setup.sh`와 이후 `./scripts/run-openclaw-podman.sh launch` 명령 모두에 동일한 변수를 설정하세요. 저장소 로컬 실행기는 셸 간에 사용자 지정 경로 재정의를 지속 저장하지 않습니다.

Quadlet 참고:

- 생성된 Quadlet 서비스는 의도적으로 고정되고 강화된 기본 형태를 유지합니다. 게시 포트는 `127.0.0.1`, 컨테이너 내부는 `--bind lan`, 사용자 네임스페이스는 `keep-id`입니다.
- `OPENCLAW_NO_RESPAWN=1`, `Restart=on-failure`, `TimeoutStartSec=300`을 고정합니다.
- `127.0.0.1:18789:18789`(Gateway)와 `127.0.0.1:18790:18790`(브리지)를 모두 게시합니다.
- `OPENCLAW_GATEWAY_TOKEN`과 같은 값을 위해 `~/.openclaw/.env`를 런타임 `EnvironmentFile`로 읽지만, 수동 실행기의 Podman 전용 재정의 허용 목록은 사용하지 않습니다.
- 사용자 지정 게시 포트, 게시 호스트 또는 다른 컨테이너 실행 플래그가 필요하면 수동 실행기를 사용하거나 `~/.config/containers/systemd/openclaw.container`를 직접 편집한 다음 서비스를 다시 로드하고 재시작하세요.

## 유용한 명령

- **컨테이너 로그:** `podman logs -f openclaw`
- **컨테이너 중지:** `podman stop openclaw`
- **컨테이너 제거:** `podman rm -f openclaw`
- **호스트 CLI에서 대시보드 URL 열기:** `openclaw dashboard --no-open`
- **호스트 CLI를 통한 상태/헬스 확인:** `openclaw gateway status --deep`(RPC 프로브 + 추가
  서비스 스캔)

## 문제 해결

- **구성 또는 작업 공간에서 권한 거부(EACCES):** 컨테이너는 기본적으로 `--userns=keep-id` 및 `--user <your uid>:<your gid>`로 실행됩니다. 호스트 구성/작업 공간 경로가 현재 사용자 소유인지 확인하세요.
- **Gateway 시작 차단(`gateway.mode=local` 누락):** `~/.openclaw/openclaw.json`이 있고 `gateway.mode="local"`을 설정하는지 확인하세요. 누락된 경우 `scripts/podman/setup.sh`가 이를 생성합니다.
- **컨테이너 CLI 명령이 잘못된 대상을 가리킴:** `openclaw --container <name> ...`를 명시적으로 사용하거나 셸에서 `OPENCLAW_CONTAINER=<name>`을 내보내세요.
- **`--container`와 함께 `openclaw update` 실패:** 예상된 동작입니다. 이미지를 다시 빌드/가져온 다음 컨테이너 또는 Quadlet 서비스를 재시작하세요.
- **Quadlet 서비스가 시작되지 않음:** `systemctl --user daemon-reload`를 실행한 다음 `systemctl --user start openclaw.service`를 실행하세요. 헤드리스 시스템에서는 `sudo loginctl enable-linger "$(whoami)"`도 필요할 수 있습니다.
- **SELinux가 바인드 마운트를 차단함:** 기본 마운트 동작을 그대로 두세요. SELinux가 enforcing 또는 permissive일 때 실행기가 Linux에서 자동으로 `:Z`를 추가합니다.

## 관련 항목

- [Docker](/ko/install/docker)
- [Gateway 백그라운드 프로세스](/ko/gateway/background-process)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
