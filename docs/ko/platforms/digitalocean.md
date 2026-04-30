---
read_when:
    - DigitalOcean에서 OpenClaw 설정하기
    - OpenClaw용 저렴한 VPS 호스팅 찾기
summary: DigitalOcean에서 OpenClaw 실행하기(간단한 유료 VPS 옵션)
title: DigitalOcean (플랫폼)
x-i18n:
    generated_at: "2026-04-30T06:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 13df486b81590d6350f4b33f5460069fee21881631970d5f4ae34f6ce956407e
    source_path: platforms/digitalocean.md
    workflow: 16
---

# DigitalOcean에서 OpenClaw 사용하기

## 목표

DigitalOcean에서 지속 실행되는 OpenClaw Gateway를 **월 $6**(또는 예약 요금제로 월 $4)에 실행합니다.

월 $0 옵션을 원하고 ARM + 제공업체별 설정이 괜찮다면 [Oracle Cloud 가이드](/ko/install/oracle)를 참고하세요.

## 비용 비교(2026년)

| 제공업체     | 플랜            | 사양                  | 월 가격    | 참고 사항                                 |
| ------------ | --------------- | ---------------------- | ----------- | ------------------------------------- |
| Oracle Cloud | Always Free ARM | 최대 4 OCPU, 24GB RAM | $0          | ARM, 제한된 용량 / 가입 관련 특이 사항 |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | €3.79 (~$4) | 가장 저렴한 유료 옵션                  |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6          | 쉬운 UI, 좋은 문서                    |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6          | 많은 지역                        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5          | 현재 Akamai의 일부                    |

**제공업체 선택:**

- DigitalOcean: 가장 단순한 UX + 예측 가능한 설정(이 가이드)
- Hetzner: 좋은 가격 대비 성능([Hetzner 가이드](/ko/install/hetzner) 참고)
- Oracle Cloud: 월 $0도 가능하지만 더 까다롭고 ARM 전용([Oracle 가이드](/ko/install/oracle) 참고)

---

## 필수 조건

- DigitalOcean 계정([$200 무료 크레딧으로 가입](https://m.do.co/c/signup))
- SSH 키 쌍(또는 비밀번호 인증 사용 의향)
- 약 20분

## 1) Droplet 만들기

<Warning>
깨끗한 기본 이미지(Ubuntu 24.04 LTS)를 사용하세요. 시작 스크립트와 방화벽 기본값을 검토하지 않았다면 타사 Marketplace 1-click 이미지는 피하세요.
</Warning>

1. [DigitalOcean](https://cloud.digitalocean.com/)에 로그인합니다
2. **Create → Droplets**를 클릭합니다
3. 다음을 선택합니다:
   - **Region:** 사용자(또는 사용자들)와 가장 가까운 지역
   - **Image:** Ubuntu 24.04 LTS
   - **Size:** Basic → Regular → **$6/mo**(1 vCPU, 1GB RAM, 25GB SSD)
   - **Authentication:** SSH 키(권장) 또는 비밀번호
4. **Create Droplet**을 클릭합니다
5. IP 주소를 기록합니다

## 2) SSH로 연결하기

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) OpenClaw 설치하기

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# Install OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# Verify
openclaw --version
```

## 4) 온보딩 실행하기

```bash
openclaw onboard --install-daemon
```

마법사가 다음을 안내합니다:

- 모델 인증(API 키 또는 OAuth)
- 채널 설정(Telegram, WhatsApp, Discord 등)
- Gateway 토큰(자동 생성)
- 데몬 설치(systemd)

## 5) Gateway 확인하기

```bash
# Check status
openclaw status

# Check service
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 6) 대시보드에 접근하기

Gateway는 기본적으로 loopback에 바인딩됩니다. Control UI에 접근하려면:

**옵션 A: SSH 터널(권장)**

```bash
# From your local machine
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# Then open: http://localhost:18789
```

**옵션 B: Tailscale Serve(HTTPS, loopback 전용)**

```bash
# On the droplet
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# Configure Gateway to use Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

열기: `https://<magicdns>/`

참고:

- Serve는 Gateway를 loopback 전용으로 유지하고 Tailscale ID 헤더를 통해 Control UI/WebSocket 트래픽을 인증합니다(토큰 없는 인증은 신뢰할 수 있는 Gateway 호스트를 가정합니다. HTTP API는 해당 Tailscale 헤더를 사용하지 않고 대신 Gateway의 일반 HTTP 인증 모드를 따릅니다).
- 대신 명시적인 공유 비밀 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하고 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

**옵션 C: Tailnet 바인드(Serve 없음)**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

열기: `http://<tailscale-ip>:18789`(토큰 필요).

## 7) 채널 연결하기

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# Scan QR code
```

다른 제공업체는 [채널](/ko/channels)을 참고하세요.

---

## 1GB RAM 최적화

$6 Droplet에는 RAM이 1GB뿐입니다. 원활하게 실행되도록 하려면:

### 스왑 추가(권장)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 더 가벼운 모델 사용

OOM이 발생한다면 다음을 고려하세요:

- 로컬 모델 대신 API 기반 모델(Claude, GPT) 사용
- `agents.defaults.model.primary`를 더 작은 모델로 설정

### 메모리 모니터링

```bash
free -h
htop
```

---

## 지속성

모든 상태는 다음 위치에 저장됩니다:

- `~/.openclaw/` — `openclaw.json`, 에이전트별 `auth-profiles.json`, 채널/제공업체 상태, 세션 데이터
- `~/.openclaw/workspace/` — 작업 공간(SOUL.md, 메모리 등)

이 데이터는 재부팅 후에도 유지됩니다. 주기적으로 백업하세요:

```bash
openclaw backup create
```

---

## Oracle Cloud 무료 대안

Oracle Cloud는 여기의 어떤 유료 옵션보다 훨씬 강력한 **Always Free** ARM 인스턴스를 제공합니다. 비용은 월 $0입니다.

| 제공 내용      | 사양                  |
| ----------------- | ---------------------- |
| **4 OCPU**       | ARM Ampere A1          |
| **24GB RAM**      | 충분하고도 남음       |
| **200GB 스토리지** | 블록 볼륨           |
| **영구 무료**  | 신용카드 청구 없음 |

**주의 사항:**

- 가입이 까다로울 수 있습니다(실패하면 다시 시도)
- ARM 아키텍처 — 대부분은 작동하지만 일부 바이너리는 ARM 빌드가 필요합니다

전체 설정 가이드는 [Oracle Cloud](/ko/install/oracle)를 참고하세요. 가입 팁과 등록 절차 문제 해결은 이 [커뮤니티 가이드](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)를 참고하세요.

---

## 문제 해결

### Gateway가 시작되지 않음

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### 포트가 이미 사용 중임

```bash
lsof -i :18789
kill <PID>
```

### 메모리 부족

```bash
# Check memory
free -h

# Add more swap
# Or upgrade to $12/mo droplet (2GB RAM)
```

---

## 관련 문서

- [Hetzner 가이드](/ko/install/hetzner) — 더 저렴하고 더 강력함
- [Docker 설치](/ko/install/docker) — 컨테이너화된 설정
- [Tailscale](/ko/gateway/tailscale) — 안전한 원격 접근
- [구성](/ko/gateway/configuration) — 전체 구성 참조
