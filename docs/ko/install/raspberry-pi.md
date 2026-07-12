---
read_when:
    - Raspberry Pi에서 OpenClaw 설정하기
    - ARM 기기에서 OpenClaw 실행하기
    - 저렴한 상시 가동형 개인 AI 구축하기
summary: 상시 자체 호스팅을 위해 Raspberry Pi에서 OpenClaw 호스팅하기
title: Raspberry Pi
x-i18n:
    generated_at: "2026-07-12T15:24:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 60f8f3b23577155658d410993937ebe7c34c21f71c1bd7d9b0c453f15c4aa024
    source_path: install/raspberry-pi.md
    workflow: 16
---

Raspberry Pi에서 영구적으로 상시 실행되는 OpenClaw Gateway를 운영합니다. Pi는 Gateway 역할만 하고 모델은 API를 통해 클라우드에서 실행되므로, 보급형 Pi로도 워크로드를 충분히 처리할 수 있습니다. 일반적인 하드웨어 비용은 **일회성 $35-80**이며 월별 요금은 없습니다.

## 하드웨어 호환성

| Pi 모델     | RAM    | 작동 여부 | 참고                                    |
| ----------- | ------ | --------- | --------------------------------------- |
| Pi 5        | 4/8 GB | 최적      | 가장 빠르며 권장합니다.                 |
| Pi 4        | 4 GB   | 좋음      | 대부분의 사용자에게 가장 적합합니다.   |
| Pi 4        | 2 GB   | 가능      | 스왑을 추가하십시오.                    |
| Pi 4        | 1 GB   | 빠듯함    | 스왑과 최소 구성으로 사용할 수 있습니다. |
| Pi 3B+      | 1 GB   | 느림      | 작동하지만 반응이 느립니다.             |
| Pi Zero 2 W | 512 MB | 불가      | 권장하지 않습니다.                      |

**최소 사양:** RAM 1 GB, 코어 1개, 여유 디스크 공간 500 MB, 64비트 OS.
**권장 사양:** RAM 2 GB 이상, SD 카드 16 GB 이상(또는 USB SSD), 이더넷.

## 사전 요구 사항

- RAM 2 GB 이상의 Raspberry Pi 4 또는 5(4 GB 권장)
- MicroSD 카드(16 GB 이상) 또는 USB SSD(성능 우수)
- 공식 Pi 전원 공급 장치
- 네트워크 연결(이더넷 또는 WiFi)
- 64비트 Raspberry Pi OS(필수 -- 32비트를 사용하지 마십시오)
- 약 30분

## 설정

<Steps>
  <Step title="OS 플래시">
    **Raspberry Pi OS Lite (64-bit)**를 사용하십시오. 헤드리스 서버에는 데스크톱이 필요하지 않습니다.

    1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/)를 다운로드합니다.
    2. OS로 **Raspberry Pi OS Lite (64-bit)**를 선택합니다.
    3. 설정 대화 상자에서 다음 항목을 미리 구성합니다.
       - 호스트 이름: `gateway-host`
       - SSH 활성화
       - 사용자 이름 및 비밀번호 설정
       - WiFi 구성(이더넷을 사용하지 않는 경우)
    4. SD 카드 또는 USB 드라이브에 플래시한 다음, Pi에 삽입하고 부팅합니다.

  </Step>

  <Step title="SSH로 연결">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="시스템 업데이트">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # 시간대 설정(cron 및 알림에 중요)
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="Node.js 24 설치">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="스왑 추가(2 GB 이하에서 중요)">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # RAM이 적은 장치에서 스왑 사용 성향 낮추기
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="OpenClaw 설치">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --install-daemon
    ```

    마법사의 안내를 따르십시오. 헤드리스 장치에서는 OAuth보다 API 키를 권장합니다. 시작하기 가장 쉬운 채널은 Telegram입니다.

  </Step>

  <Step title="확인">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI에 액세스">
    컴퓨터에서 Pi로부터 대시보드 URL을 가져옵니다.

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    그런 다음 다른 터미널에서 SSH 터널을 생성합니다.

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    로컬 브라우저에서 출력된 URL을 여십시오. 상시 원격 액세스에 대해서는 [Tailscale 통합](/ko/gateway/tailscale)을 참조하십시오.

  </Step>
</Steps>

## 성능 개선 팁

**USB SSD를 사용하십시오** -- SD 카드는 느리고 수명이 짧습니다. USB SSD는 성능을 크게 향상하고 더 많은 쓰기 주기를 견딜 수 있습니다. OS를 SD에 유지하는 경우 `OPENCLAW_STATE_DIR`에 USB SSD를 사용하십시오. [Pi USB 부팅 가이드](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)를 참조하십시오.

**모듈 컴파일 캐시를 활성화하십시오** -- 저전력 Pi 호스트에서 반복적인 CLI 호출 속도를 높입니다. `OPENCLAW_NO_RESPAWN=1`은 일상적인 Gateway 재시작을 동일한 프로세스에서 처리하여 추가 프로세스 전달을 방지하고 소형 호스트에서 PID 추적을 단순하게 유지합니다.

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

`/tmp`가 아닌 `/var/tmp`를 사용하십시오. 일부 배포판은 부팅 시 `/tmp`를 비워 준비된 캐시가 삭제될 수 있습니다.

**메모리 사용량을 줄이십시오** -- 헤드리스 설정에서는 GPU 메모리를 확보하고 사용하지 않는 서비스를 비활성화하십시오.

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**안정적인 재시작을 위한 systemd 드롭인** -- 이 Pi에서 주로 OpenClaw를 실행한다면 서비스 드롭인을 추가하십시오.

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

그런 다음 `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`를 실행하십시오. 헤드리스 Pi에서는 사용자가 로그아웃한 후에도 사용자 서비스가 유지되도록 리거링도 한 번 활성화하십시오: `sudo loginctl enable-linger "$(whoami)"`.

## 권장 모델 설정

Pi에서는 Gateway만 실행되므로 클라우드 호스팅 API 모델을 사용하십시오. Pi에서 로컬 LLM을 실행하지 마십시오. 소형 모델조차 실용적으로 사용하기에는 너무 느립니다.

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

## ARM 바이너리 참고 사항

대부분의 OpenClaw 기능은 변경 없이 ARM64에서 작동합니다(Node.js, Telegram, WhatsApp/Baileys, Chromium). ARM 빌드가 없는 경우가 있는 바이너리는 일반적으로 Skills에서 제공하는 선택적 Go/Rust CLI 도구입니다. `uname -m`으로 아키텍처를 확인하고(`aarch64`가 표시되어야 함), 소스에서 빌드하기 전에 누락된 바이너리의 릴리스 페이지에서 `linux-arm64` / `aarch64` 아티팩트를 확인하십시오.

## 지속성 및 백업

OpenClaw 상태는 다음 위치에 저장됩니다.

- `~/.openclaw/` -- `openclaw.json`, 에이전트별 `auth-profiles.json`, 채널/제공자 상태, 세션.
- `~/.openclaw/workspace/` -- 에이전트 작업 공간(SOUL.md, 메모리, 아티팩트).

이 데이터는 재부팅 후에도 유지되며, 성능과 수명 측면에서 SD 카드보다 SSD를 사용할 때 더 유리합니다. 다음 명령으로 이동 가능한 스냅샷을 생성하십시오.

```bash
openclaw backup create
```

## 문제 해결

**메모리 부족** -- `free -h`로 스왑이 활성화되어 있는지 확인하십시오. 사용하지 않는 서비스를 비활성화하십시오(`sudo systemctl disable cups bluetooth avahi-daemon`). API 기반 모델만 사용하십시오.

**성능 저하** -- SD 카드 대신 USB SSD를 사용하십시오. `vcgencmd get_throttled`로 CPU 스로틀링 여부를 확인하십시오(`0x0`을 반환해야 함).

**서비스가 시작되지 않음** -- `journalctl --user -u openclaw-gateway.service --no-pager -n 100`으로 로그를 확인하고 `openclaw doctor --non-interactive`를 실행하십시오. 헤드리스 Pi인 경우 리거링이 활성화되어 있는지도 확인하십시오: `sudo loginctl enable-linger "$(whoami)"`.

**ARM 바이너리 문제** -- Skill이 "exec format error"와 함께 실패하는 경우 해당 바이너리에 ARM64 빌드가 있는지 확인하십시오. `uname -m`으로 아키텍처를 확인하십시오(`aarch64`가 표시되어야 함).

**WiFi 연결 끊김** -- WiFi 전원 관리를 비활성화하십시오: `sudo iwconfig wlan0 power off`.

## 다음 단계

- [채널](/ko/channels) -- Telegram, WhatsApp, Discord 등을 연결합니다
- [Gateway 구성](/ko/gateway/configuration) -- 모든 구성 옵션
- [업데이트](/ko/install/updating) -- OpenClaw를 최신 상태로 유지합니다

## 관련 문서

- [설치 개요](/ko/install)
- [Linux 서버](/ko/vps)
- [플랫폼](/ko/platforms)
