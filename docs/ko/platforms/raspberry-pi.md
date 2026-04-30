---
read_when:
    - Raspberry Pi에서 OpenClaw 설정하기
    - ARM 장치에서 OpenClaw 실행하기
    - 저렴한 상시 작동 개인용 인공지능 만들기
summary: Raspberry Pi에서 OpenClaw 사용하기(저예산 self-hosted 설정)
title: Raspberry Pi (플랫폼)
x-i18n:
    generated_at: "2026-04-30T06:40:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5a277499ee8759f766984b3fd2097dbd55f2f34ba6169fdfc2eb9dd53d6bb7c
    source_path: platforms/raspberry-pi.md
    workflow: 16
---

# Raspberry Pi에서 OpenClaw 사용

## 목표

일회성 비용 **~$35-80**로 Raspberry Pi에서 지속적으로 항상 켜져 있는 OpenClaw Gateway를 실행합니다(월 이용료 없음).

다음에 적합합니다.

- 24/7 개인 AI 어시스턴트
- 홈 자동화 허브
- 저전력, 상시 사용 가능한 Telegram/WhatsApp 봇

## 하드웨어 요구 사항

| Pi 모델        | RAM     | 작동 여부 | 참고 사항                          |
| --------------- | ------- | -------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | ✅ 최고  | 가장 빠름, 권장                    |
| **Pi 4**        | 4GB     | ✅ 좋음  | 대부분 사용자에게 적절한 선택      |
| **Pi 4**        | 2GB     | ✅ 가능  | 작동함, swap 추가                  |
| **Pi 4**        | 1GB     | ⚠️ 부족  | swap과 최소 구성으로 가능          |
| **Pi 3B+**      | 1GB     | ⚠️ 느림  | 작동하지만 반응이 느림             |
| **Pi Zero 2 W** | 512MB   | ❌       | 권장하지 않음                      |

**최소 사양:** 1GB RAM, 1코어, 500MB 디스크  
**권장:** 2GB+ RAM, 64비트 OS, 16GB+ SD 카드(또는 USB SSD)

## 필요한 것

- Raspberry Pi 4 또는 5(2GB+ 권장)
- MicroSD 카드(16GB+) 또는 USB SSD(성능 우수)
- 전원 공급 장치(공식 Pi PSU 권장)
- 네트워크 연결(Ethernet 또는 WiFi)
- 약 30분

## 1) OS 플래시

**Raspberry Pi OS Lite (64-bit)**를 사용하세요. 헤드리스 서버에는 데스크톱이 필요 없습니다.

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) 다운로드
2. OS 선택: **Raspberry Pi OS Lite (64-bit)**
3. 기어 아이콘(⚙️)을 클릭해 미리 구성:
   - 호스트 이름 설정: `gateway-host`
   - SSH 활성화
   - 사용자 이름/비밀번호 설정
   - WiFi 구성(Ethernet을 사용하지 않는 경우)
4. SD 카드 / USB 드라이브에 플래시
5. Pi에 삽입하고 부팅

## 2) SSH로 연결

```bash
ssh user@gateway-host
# or use the IP address
ssh user@192.168.x.x
```

## 3) 시스템 설정

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y git curl build-essential

# Set timezone (important for cron/reminders)
sudo timedatectl set-timezone America/Chicago  # Change to your timezone
```

## 4) Node.js 24 설치(ARM64)

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v24.x.x
npm --version
```

## 5) swap 추가(2GB 이하에서 중요)

swap은 메모리 부족으로 인한 크래시를 방지합니다.

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize for low RAM (reduce swappiness)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) OpenClaw 설치

### 옵션 A: 표준 설치(권장)

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 옵션 B: 수정 가능한 설치(실험용)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

수정 가능한 설치는 로그와 코드에 직접 접근할 수 있게 해 줍니다. ARM 관련 문제를 디버깅할 때 유용합니다.

## 7) 온보딩 실행

```bash
openclaw onboard --install-daemon
```

마법사를 따르세요.

1. **Gateway 모드:** 로컬
2. **인증:** API 키 권장(헤드리스 Pi에서는 OAuth가 까다로울 수 있음)
3. **채널:** Telegram으로 시작하는 것이 가장 쉬움
4. **Daemon:** 예(systemd)

## 8) 설치 확인

```bash
# Check status
openclaw status

# Check service (standard install = systemd user unit)
systemctl --user status openclaw-gateway.service

# View logs
journalctl --user -u openclaw-gateway.service -f
```

## 9) OpenClaw 대시보드에 접근

`user@gateway-host`를 Pi 사용자 이름과 호스트 이름 또는 IP 주소로 바꾸세요.

컴퓨터에서 Pi에 새 대시보드 URL을 출력하도록 요청합니다.

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

명령은 `Dashboard URL:`을 출력합니다. `gateway.auth.token` 구성 방식에 따라 URL은 일반 `http://127.0.0.1:18789/` 링크일 수도 있고 `#token=...`을 포함한 링크일 수도 있습니다.

컴퓨터의 다른 터미널에서 SSH 터널을 만듭니다.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

그런 다음 출력된 대시보드 URL을 로컬 브라우저에서 엽니다.

UI가 공유 비밀 인증을 요청하면 구성된 토큰 또는 비밀번호를 Control UI 설정에 붙여 넣으세요. 토큰 인증에는 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)을 사용하세요.

상시 원격 접근은 [Tailscale](/ko/gateway/tailscale)을 참고하세요.

---

## 성능 최적화

### USB SSD 사용(큰 개선 효과)

SD 카드는 느리고 마모됩니다. USB SSD는 성능을 크게 개선합니다.

```bash
# Check if booting from USB
lsblk
```

설정 방법은 [Pi USB 부팅 가이드](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)를 참고하세요.

### CLI 시작 속도 향상(모듈 컴파일 캐시)

저전력 Pi 호스트에서는 Node의 모듈 컴파일 캐시를 활성화해 반복적인 CLI 실행을 더 빠르게 만드세요.

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

참고:

- `NODE_COMPILE_CACHE`는 이후 실행(`status`, `health`, `--help`) 속도를 높입니다.
- `/var/tmp`는 `/tmp`보다 재부팅 후에도 더 잘 유지됩니다.
- `OPENCLAW_NO_RESPAWN=1`은 CLI 자체 재실행으로 인한 추가 시작 비용을 피합니다.
- 첫 실행은 캐시를 예열하며, 이후 실행에서 가장 큰 효과를 얻습니다.

### systemd 시작 튜닝(선택 사항)

이 Pi가 주로 OpenClaw를 실행한다면 서비스 drop-in을 추가해 재시작 지터를 줄이고 시작 환경을 안정적으로 유지하세요.

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

그런 다음 적용합니다.

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw-gateway.service
```

가능하다면 콜드 스타트 중 SD 카드의 무작위 I/O 병목을 피하기 위해 OpenClaw 상태/캐시를 SSD 기반 스토리지에 유지하세요.

헤드리스 Pi라면 사용자 서비스가 로그아웃 후에도 유지되도록 한 번 lingering을 활성화하세요.

```bash
sudo loginctl enable-linger "$(whoami)"
```

`Restart=` 정책이 자동 복구에 어떻게 도움이 되는지:
[systemd는 서비스 복구를 자동화할 수 있습니다](https://www.redhat.com/en/blog/systemd-automate-recovery).

### 메모리 사용량 줄이기

```bash
# Disable GPU memory allocation (headless)
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# Disable Bluetooth if not needed
sudo systemctl disable bluetooth
```

### 리소스 모니터링

```bash
# Check memory
free -h

# Check CPU temperature
vcgencmd measure_temp

# Live monitoring
htop
```

---

## ARM 관련 참고 사항

### 바이너리 호환성

대부분의 OpenClaw 기능은 ARM64에서 작동하지만, 일부 외부 바이너리는 ARM 빌드가 필요할 수 있습니다.

| 도구               | ARM64 상태 | 참고 사항                           |
| ------------------ | ---------- | ----------------------------------- |
| Node.js            | ✅         | 매우 잘 작동                        |
| WhatsApp (Baileys) | ✅         | 순수 JS, 문제 없음                  |
| Telegram           | ✅         | 순수 JS, 문제 없음                  |
| gog (Gmail CLI)    | ⚠️         | ARM 릴리스 확인                     |
| Chromium (browser) | ✅         | `sudo apt install chromium-browser` |

Skills가 실패하면 해당 바이너리에 ARM 빌드가 있는지 확인하세요. 많은 Go/Rust 도구에는 있지만, 일부에는 없습니다.

### 32비트 vs 64비트

**항상 64비트 OS를 사용하세요.** Node.js와 많은 최신 도구가 이를 필요로 합니다. 다음으로 확인하세요.

```bash
uname -m
# Should show: aarch64 (64-bit) not armv7l (32-bit)
```

---

## 권장 모델 설정

Pi는 Gateway일 뿐이므로(모델은 클라우드에서 실행됨) API 기반 모델을 사용하세요.

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

**Pi에서 로컬 LLM을 실행하려고 하지 마세요**. 작은 모델도 너무 느립니다. 무거운 작업은 Claude/GPT가 처리하게 하세요.

---

## 부팅 시 자동 시작

온보딩에서 이를 설정하지만, 확인하려면 다음을 실행하세요.

```bash
# Check service is enabled
systemctl --user is-enabled openclaw-gateway.service

# Enable if not
systemctl --user enable openclaw-gateway.service

# Start on boot
systemctl --user start openclaw-gateway.service
```

---

## 문제 해결

### 메모리 부족(OOM)

```bash
# Check memory
free -h

# Add more swap (see Step 5)
# Or reduce services running on the Pi
```

### 느린 성능

- SD 카드 대신 USB SSD 사용
- 사용하지 않는 서비스 비활성화: `sudo systemctl disable cups bluetooth avahi-daemon`
- CPU 스로틀링 확인: `vcgencmd get_throttled`(`0x0`을 반환해야 함)

### 서비스가 시작되지 않음

```bash
# Check logs
journalctl --user -u openclaw-gateway.service --no-pager -n 100

# Common fix: rebuild
cd ~/openclaw  # if using hackable install
npm run build
systemctl --user restart openclaw-gateway.service
```

### ARM 바이너리 문제

Skills가 "exec format error"로 실패하는 경우:

1. 바이너리에 ARM64 빌드가 있는지 확인
2. 소스에서 빌드 시도
3. 또는 ARM 지원 Docker 컨테이너 사용

### WiFi 끊김

WiFi를 사용하는 헤드리스 Pi의 경우:

```bash
# Disable WiFi power management
sudo iwconfig wlan0 power off

# Make permanent
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 비용 비교

| 설정           | 일회성 비용 | 월 비용  | 참고 사항                    |
| -------------- | ----------- | -------- | ---------------------------- |
| **Pi 4 (2GB)** | ~$45        | $0       | + 전기료(연 ~$5)             |
| **Pi 4 (4GB)** | ~$55        | $0       | 권장                         |
| **Pi 5 (4GB)** | ~$60        | $0       | 최고의 성능                  |
| **Pi 5 (8GB)** | ~$80        | $0       | 과하지만 미래 대비에 좋음    |
| DigitalOcean   | $0          | $6/mo    | $72/년                       |
| Hetzner        | $0          | €3.79/mo | ~$50/년                      |

**손익분기점:** Pi는 클라우드 VPS와 비교해 약 6-12개월이면 비용을 회수합니다.

---

## 관련 문서

- [Linux 가이드](/ko/platforms/linux) — 일반 Linux 설정
- [DigitalOcean 가이드](/ko/install/digitalocean) — 클라우드 대안
- [Hetzner 가이드](/ko/install/hetzner) — Docker 설정
- [Tailscale](/ko/gateway/tailscale) — 원격 접근
- [Nodes](/ko/nodes) — 노트북/휴대폰을 Pi Gateway와 페어링
