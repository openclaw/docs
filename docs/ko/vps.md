---
read_when:
    - Linux 서버 또는 클라우드 VPS에서 Gateway를 실행하려는 경우
    - 호스팅 가이드를 빠르게 파악할 수 있는 안내가 필요합니다.
    - OpenClaw을 위한 일반적인 Linux 서버 튜닝이 필요합니다
sidebarTitle: Linux Server
summary: Linux 서버 또는 클라우드 VPS에서 OpenClaw 실행 — 제공업체 선택, 아키텍처 및 튜닝
title: Linux 서버
x-i18n:
    generated_at: "2026-07-12T01:23:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

어떤 Linux 서버나 클라우드 VPS에서도 OpenClaw Gateway를 실행할 수 있습니다. 이 페이지에서는
제공업체를 선택하는 방법과 클라우드 배포의 작동 방식을 설명하고, 모든 환경에 적용되는 일반적인 Linux
튜닝을 다룹니다.

## 제공업체 선택

<CardGroup cols={2}>
  <Card title="Azure" href="/ko/install/azure">Linux VM</Card>
  <Card title="DigitalOcean" href="/ko/install/digitalocean">간편한 유료 VPS</Card>
  <Card title="exe.dev" href="/ko/install/exe-dev">HTTPS 프록시가 포함된 VM</Card>
  <Card title="Fly.io" href="/ko/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/ko/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/ko/install/hetzner">Hetzner VPS의 Docker</Card>
  <Card title="Hostinger" href="/ko/install/hostinger">원클릭 설정을 지원하는 VPS</Card>
  <Card title="Northflank" href="/ko/install/northflank">브라우저에서 원클릭 설정</Card>
  <Card title="Oracle Cloud" href="/ko/install/oracle">상시 무료 ARM 등급</Card>
  <Card title="Railway" href="/ko/install/railway">브라우저에서 원클릭 설정</Card>
  <Card title="Raspberry Pi" href="/ko/install/raspberry-pi">ARM 자체 호스팅</Card>
</CardGroup>

**AWS(EC2 / Lightsail / 무료 등급)**도 잘 작동합니다.
커뮤니티 동영상 안내는
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)에서
확인할 수 있습니다(커뮤니티 리소스이므로 이용할 수 없게 될 수 있음).

## 클라우드 설정의 작동 방식

- **Gateway는 VPS에서 실행**되며 상태와 작업 공간을 관리합니다.
- 노트북이나 휴대전화에서 **제어 UI** 또는 **Tailscale/SSH**를 통해 연결합니다.
- VPS를 기준 데이터 원본으로 취급하고 상태와 작업 공간을 정기적으로 **백업**하세요.
- 안전한 기본 설정: Gateway를 local loopback에 유지하고 SSH 터널이나 Tailscale Serve를 통해 접근하세요.
  `lan` 또는 `tailnet`에 바인딩하면 인증이 신뢰할 수 있는 프록시에 위임된 경우를 제외하고
  Gateway에 공유 비밀
  (`gateway.auth.token` 또는 `gateway.auth.password`)이 필요합니다.

관련 페이지: [Gateway 원격 접근](/ko/gateway/remote), [플랫폼 허브](/ko/platforms).

## 먼저 관리자 접근 강화

공용 VPS에 OpenClaw를 설치하기 전에 서버 자체를 어떻게 관리할지
결정하세요.

- Tailnet 전용 관리자 접근을 사용하려면 먼저 Tailscale을 설치하고 VPS를
  tailnet에 연결한 다음, Tailscale IP 또는 MagicDNS 이름을 통해 두 번째 SSH 세션이
  연결되는지 확인하고 공용 SSH 접근을 제한하세요.
- Tailscale을 사용하지 않는 경우 더 많은 서비스를 노출하기 전에
  SSH 접근 경로에 동등한 보안 강화 조치를 적용하세요.
- 이는 Gateway 접근과 별개입니다. OpenClaw를 계속 local loopback에 바인딩하고
  대시보드에는 SSH 터널이나 Tailscale Serve를 통해 접근할 수 있습니다.

Tailscale 관련 Gateway 옵션은 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## VPS의 회사 공용 에이전트

모든 사용자가 동일한 신뢰 경계에 속하고 에이전트를 업무 전용으로 사용하는 경우,
팀이 하나의 에이전트를 실행하는 것도 유효한 구성입니다.

- 전용 런타임(VPS/VM/컨테이너 + 전용 OS 사용자/계정)에서 실행하세요.
- 해당 런타임에서 개인 Apple/Google 계정이나 개인 브라우저/비밀번호 관리자 프로필에 로그인하지 마세요.
- 사용자들이 서로 적대적일 수 있다면 Gateway/호스트/OS 사용자별로 분리하세요.

보안 모델 세부 정보: [보안](/ko/gateway/security).

## VPS에서 Node 사용

Gateway는 클라우드에 유지하면서 로컬 기기
(Mac/iOS/Android/헤드리스)의 **Node**를 페어링할 수 있습니다. Node는 로컬 화면/카메라/캔버스 및 `system.run`
기능을 제공하며 Gateway는 클라우드에 그대로 유지됩니다.

문서: [Node](/ko/nodes), [Node CLI](/ko/cli/nodes).

## 소형 VM 및 ARM 호스트의 시작 성능 튜닝

저전력 VM(또는 ARM 호스트)에서 CLI 명령이 느리게 느껴진다면 Node의 모듈 컴파일 캐시를 활성화하세요.

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE`는 반복 실행 시 명령 시작 시간을 단축하며, 최초 실행에서 캐시를 준비합니다.
- `OPENCLAW_NO_RESPAWN=1`은 일반적인 Gateway 재시작을 동일 프로세스 내에서 수행하므로 추가 프로세스 전달을 방지하고 소형 호스트에서 PID 추적을 간단하게 유지합니다.
- Raspberry Pi 관련 세부 정보는 [Raspberry Pi](/ko/install/raspberry-pi)를 참조하세요.

### systemd 튜닝 확인 목록(선택 사항)

`systemd`를 사용하는 VM 호스트에서는 다음을 고려하세요.

- 안정적인 시작 경로를 위한 서비스 환경 변수: `OPENCLAW_NO_RESPAWN=1` 및
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 명시적인 재시작 동작: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- 상태/캐시 경로에 SSD 기반 디스크를 사용하여 임의 입출력으로 인한 콜드 스타트 지연을 줄이세요.

표준 `openclaw onboard --install-daemon` 경로는 systemd 사용자
유닛을 설치합니다. 다음 명령으로 편집하세요.

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

의도적으로 시스템 유닛을 설치했다면
`sudo systemctl edit openclaw-gateway.service`로 편집하세요.

`Restart=` 정책이 자동 복구에 도움이 되는 방식:
[systemd로 서비스 복구를 자동화할 수 있습니다](https://www.redhat.com/en/blog/systemd-automate-recovery).

Linux OOM 동작, 하위 프로세스 종료 대상 선택 및 `exit 137`
진단에 관한 자세한 내용은 [Linux 메모리 압박 및 OOM 강제 종료](/ko/platforms/linux#memory-pressure-and-oom-kills)를 참조하세요.

## 관련 문서

- [설치 개요](/ko/install)
- [DigitalOcean](/ko/install/digitalocean)
- [Fly.io](/ko/install/fly)
- [Hetzner](/ko/install/hetzner)
