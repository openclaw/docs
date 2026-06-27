---
read_when:
    - Linux 서버 또는 클라우드 VPS에서 Gateway를 실행하려는 경우
    - 호스팅 가이드를 빠르게 파악할 수 있는 개요가 필요합니다
    - OpenClaw를 위한 일반 Linux 서버 튜닝이 필요한 경우
sidebarTitle: Linux Server
summary: OpenClaw를 Linux 서버 또는 클라우드 VPS에서 실행하기 — 제공자 선택기, 아키텍처 및 튜닝
title: Linux 서버
x-i18n:
    generated_at: "2026-06-27T18:18:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d32ca9cd62e99b340827f086602922eae3731d9b6cb42b1fd629917d604c549b
    source_path: vps.md
    workflow: 16
---

모든 Linux 서버 또는 클라우드 VPS에서 OpenClaw Gateway를 실행하세요. 이 페이지는
제공업체를 선택하고, 클라우드 배포가 작동하는 방식을 설명하며, 어디서나 적용되는 일반 Linux
튜닝을 다룹니다.

## 제공업체 선택

<CardGroup cols={2}>
  <Card title="Railway" href="/ko/install/railway">원클릭 브라우저 설정</Card>
  <Card title="Northflank" href="/ko/install/northflank">원클릭 브라우저 설정</Card>
  <Card title="DigitalOcean" href="/ko/install/digitalocean">간단한 유료 VPS</Card>
  <Card title="Oracle Cloud" href="/ko/install/oracle">항상 무료인 ARM 티어</Card>
  <Card title="Fly.io" href="/ko/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/ko/install/hetzner">Hetzner VPS의 Docker</Card>
  <Card title="Hostinger" href="/ko/install/hostinger">원클릭 설정을 제공하는 VPS</Card>
  <Card title="GCP" href="/ko/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/ko/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/ko/install/exe-dev">HTTPS 프록시가 있는 VM</Card>
  <Card title="Raspberry Pi" href="/ko/install/raspberry-pi">ARM 셀프 호스팅</Card>
</CardGroup>

**AWS(EC2 / Lightsail / 무료 티어)**도 잘 작동합니다.
커뮤니티 동영상 안내는 다음에서 볼 수 있습니다.
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(커뮤니티 리소스 -- 사용할 수 없게 될 수 있음).

## 클라우드 설정 작동 방식

- **Gateway는 VPS에서 실행**되며 상태 + 워크스페이스를 소유합니다.
- 노트북 또는 휴대폰에서 **Control UI** 또는 **Tailscale/SSH**를 통해 연결합니다.
- VPS를 단일 정보 소스로 간주하고 상태 + 워크스페이스를 정기적으로 **백업**하세요.
- 안전한 기본값: Gateway를 loopback에 유지하고 SSH 터널 또는 Tailscale Serve를 통해 접근하세요.
  `lan` 또는 `tailnet`에 바인딩하는 경우 `gateway.auth.token` 또는 `gateway.auth.password`가 필요합니다.

관련 페이지: [Gateway 원격 접근](/ko/gateway/remote), [플랫폼 허브](/ko/platforms).

## 먼저 관리자 접근 강화

공개 VPS에 OpenClaw를 설치하기 전에, 해당 서버 자체를 어떻게 관리할지
결정하세요.

- Tailnet 전용 관리자 접근을 원한다면 먼저 Tailscale을 설치하고, VPS를
  tailnet에 연결한 다음, Tailscale IP 또는 MagicDNS 이름을 통해 두 번째 SSH 세션을
  확인한 후 공개 SSH를 제한하세요.
- Tailscale을 사용하지 않는 경우, 더 많은 서비스를 노출하기 전에 SSH
  경로에 대해 동등한 강화를 적용하세요.
- 이는 Gateway 접근과 별개입니다. OpenClaw를 계속 loopback에 바인딩하고
  대시보드에는 SSH 터널 또는 Tailscale Serve를 사용할 수 있습니다.

Tailscale 관련 Gateway 옵션은 [Tailscale](/ko/gateway/tailscale)에 있습니다.

## VPS의 공유 회사 에이전트

모든 사용자가 같은 신뢰 경계 안에 있고 에이전트가 업무 전용일 때, 팀용 단일 에이전트를 실행하는 것은 유효한 설정입니다.

- 전용 런타임(VPS/VM/컨테이너 + 전용 OS 사용자/계정)에 유지하세요.
- 해당 런타임에 개인 Apple/Google 계정이나 개인 브라우저/비밀번호 관리자 프로필로 로그인하지 마세요.
- 사용자들이 서로 적대적일 수 있다면 Gateway/호스트/OS 사용자별로 분리하세요.

보안 모델 세부 정보: [보안](/ko/gateway/security).

## VPS와 함께 노드 사용

Gateway는 클라우드에 유지하고 로컬 기기
(Mac/iOS/Android/headless)의 **노드**와 페어링할 수 있습니다. 노드는 로컬 화면/카메라/캔버스 및 `system.run`
기능을 제공하고, Gateway는 클라우드에 남아 있습니다.

문서: [노드](/ko/nodes), [노드 CLI](/ko/cli/nodes).

## 소형 VM 및 ARM 호스트를 위한 시작 튜닝

저전력 VM(또는 ARM 호스트)에서 CLI 명령이 느리게 느껴진다면 Node의 모듈 컴파일 캐시를 활성화하세요.

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`는 반복 명령 시작 시간을 개선합니다.
- `OPENCLAW_NO_RESPAWN=1`은 일반적인 Gateway 재시작을 프로세스 내에서 유지하여 추가 프로세스 인계를 피하고 작은 호스트에서 PID 추적을 단순하게 유지합니다.
- 첫 번째 명령 실행은 캐시를 준비합니다. 이후 실행은 더 빠릅니다.
- Raspberry Pi 관련 세부 정보는 [Raspberry Pi](/ko/install/raspberry-pi)를 참조하세요.

### systemd 튜닝 체크리스트(선택 사항)

`systemd`를 사용하는 VM 호스트의 경우 다음을 고려하세요.

- 안정적인 시작 경로를 위해 서비스 env 추가:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 재시작 동작을 명시적으로 유지:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 상태/캐시 경로에는 SSD 기반 디스크를 선호하여 무작위 I/O 콜드 스타트 페널티를 줄이세요.

표준 `openclaw onboard --install-daemon` 경로의 경우 사용자 유닛을 편집하세요.

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

시스템 유닛을 의도적으로 설치했다면 대신
`sudo systemctl edit openclaw-gateway.service`로 `openclaw-gateway.service`를 편집하세요.

`Restart=` 정책이 자동 복구에 도움이 되는 방식:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Linux OOM 동작, 자식 프로세스 희생자 선택, `exit 137`
진단은 [Linux 메모리 압박 및 OOM 종료](/ko/platforms/linux#memory-pressure-and-oom-kills)를 참조하세요.

## 관련 항목

- [설치 개요](/ko/install)
- [DigitalOcean](/ko/install/digitalocean)
- [Fly.io](/ko/install/fly)
- [Hetzner](/ko/install/hetzner)
