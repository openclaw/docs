---
read_when:
    - DigitalOcean에서 OpenClaw 설정하기
    - OpenClaw용 간단한 유료 VPS 찾기
summary: DigitalOcean Droplet에서 OpenClaw 호스팅하기
title: DigitalOcean
x-i18n:
    generated_at: "2026-07-12T15:23:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e124a59c079efda0c8e880018f2657fad784af1489ca3f98ed8ab609249e35bd
    source_path: install/digitalocean.md
    workflow: 16
---

DigitalOcean Droplet에서 영구 OpenClaw Gateway를 실행합니다(1 GB Basic 플랜 기준 월 약 $6).

DigitalOcean은 간편한 유료 VPS 선택지입니다. 더 저렴하거나 무료인 선택지는 다음과 같습니다.

- [Hetzner](/ko/install/hetzner) -- 비용 대비 더 많은 코어/RAM을 제공합니다.
- [Oracle Cloud](/ko/install/oracle) -- Always Free ARM 티어(최대 4 OCPU, 24 GB RAM)를 제공하지만, 가입 과정이 까다로울 수 있으며 ARM만 지원합니다.

## 사전 요구 사항

- DigitalOcean 계정([가입](https://cloud.digitalocean.com/registrations/new))
- SSH 키 쌍(또는 비밀번호 인증을 사용할 의향)
- 약 20분

## 설정

<Steps>
  <Step title="Droplet 생성">
    <Warning>
    깨끗한 기본 이미지(Ubuntu 24.04 LTS)를 사용하십시오. 시작 스크립트와 방화벽 기본값을 검토하지 않았다면 타사 Marketplace 1-click 이미지를 사용하지 마십시오.
    </Warning>

    1. [DigitalOcean](https://cloud.digitalocean.com/)에 로그인합니다.
    2. **Create > Droplets**를 클릭합니다.
    3. 다음을 선택합니다.
       - **Region:** 가장 가까운 리전
       - **Image:** Ubuntu 24.04 LTS
       - **Size:** Basic, Regular, 1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication:** SSH key(권장) 또는 password
    4. **Create Droplet**을 클릭하고 IP 주소를 기록합니다.

  </Step>

  <Step title="연결 및 설치">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # Node.js 24 설치
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # OpenClaw 설치
    curl -fsSL https://openclaw.ai/install.sh | bash

    # OpenClaw 상태와 서비스를 소유할 루트가 아닌 사용자를 생성합니다.
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    루트 셸은 시스템 부트스트랩에만 사용하십시오. 상태가 `/home/openclaw/.openclaw/` 아래에 저장되고 Gateway가 해당 사용자의 systemd `--user` 서비스로 설치되도록 루트가 아닌 `openclaw` 사용자로 OpenClaw 명령을 실행하십시오.

  </Step>

  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --install-daemon
    ```

    마법사가 모델 인증, 채널 설정, Gateway 토큰 생성, 데몬 설치(systemd 사용자 서비스)를 안내합니다.

  </Step>

  <Step title="스왑 추가(1 GB Droplet에 권장)">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="Gateway 확인">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="Control UI에 액세스">
    Gateway는 기본적으로 루프백에 바인딩됩니다. 다음 옵션 중 하나를 선택하십시오.

    **옵션 A: SSH 터널(가장 간단함)**

    ```bash
    # 로컬 머신에서 실행
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    그런 다음 `http://localhost:18789`를 엽니다.

    **옵션 B: Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    그런 다음 tailnet의 모든 기기에서 `https://<magicdns>/`를 엽니다.

    Tailscale Serve는 tailnet ID 헤더를 통해 Control UI 및 WebSocket 트래픽을 인증하며, 이는 Gateway 호스트 자체를 신뢰한다고 가정합니다. 이와 관계없이 HTTP API 엔드포인트에는 여전히 Gateway의 일반 인증 모드(토큰/비밀번호)가 적용됩니다. Serve를 통해 명시적인 공유 비밀 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하고 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하십시오.

    **옵션 C: Tailnet 바인딩(Serve 미사용)**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    그런 다음 `http://<tailscale-ip>:18789`를 엽니다(토큰 필요).

  </Step>
</Steps>

## 영속성과 백업

OpenClaw 상태는 다음 위치에 저장됩니다.

- `~/.openclaw/` -- `openclaw.json`, 채널/공급자 자격 증명, 에이전트별 `auth-profiles.json`, 세션 데이터
- `~/.openclaw/workspace/` -- 에이전트 작업 공간(SOUL.md, 메모리, 아티팩트)

이 데이터는 Droplet을 재부팅해도 유지됩니다. 이식 가능한 스냅샷을 생성하려면 다음을 실행합니다.

```bash
openclaw backup create
```

DigitalOcean 스냅샷은 전체 Droplet을 백업하며, `openclaw backup create`로 생성한 백업은 호스트 간에 이식할 수 있습니다.

## 1 GB RAM 사용 팁

$6 Droplet에는 RAM이 1 GB뿐입니다. 원활하게 실행하려면 다음을 따르십시오.

- 위의 스왑 설정이 재부팅 후에도 유지되도록 `/etc/fstab`에 포함되어 있는지 확인하십시오.
- 로컬 모델보다 API 기반 모델(Claude, GPT)을 사용하십시오. 로컬 LLM 추론은 1 GB 환경에서 실행하기에 적합하지 않습니다.
- 큰 프롬프트에서 OOM이 발생하면 `agents.defaults.model.primary`를 더 작은 모델로 설정하십시오.
- `free -h`와 `htop`으로 모니터링하십시오.

## 문제 해결

**Gateway가 시작되지 않음** -- `openclaw doctor --non-interactive`를 실행하고 `journalctl --user -u openclaw-gateway.service -n 50`으로 로그를 확인하십시오.

**포트가 이미 사용 중임** -- `lsof -i :18789`를 실행하여 프로세스를 찾은 다음 중지하십시오.

**메모리 부족** -- `free -h`로 스왑이 활성화되어 있는지 확인하십시오. 그래도 OOM이 발생하면 로컬 모델 대신 API 기반 모델(Claude, GPT)로 전환하거나 2 GB Droplet로 업그레이드하십시오.

## 다음 단계

- [채널](/ko/channels) -- Telegram, WhatsApp, Discord 등을 연결합니다
- [Gateway 구성](/ko/gateway/configuration) -- 모든 구성 옵션을 확인합니다
- [업데이트](/ko/install/updating) -- OpenClaw를 최신 상태로 유지합니다

## 관련 문서

- [설치 개요](/ko/install)
- [Fly.io](/ko/install/fly)
- [Hetzner](/ko/install/hetzner)
- [VPS 호스팅](/ko/vps)
