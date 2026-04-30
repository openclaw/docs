---
read_when:
    - Oracle Cloud에서 OpenClaw 설정하기
    - OpenClaw를 위한 저비용 VPS 호스팅 찾기
    - 작은 서버에서 OpenClaw를 24/7로 실행하고 싶습니다
summary: Oracle Cloud(상시 무료 ARM)에서 OpenClaw
title: Oracle Cloud (플랫폼)
x-i18n:
    generated_at: "2026-04-30T06:40:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d86af91bd924ad08535a21fa481ce551e8c19f1a6cd82b61c335da7a068a09f0
    source_path: platforms/oracle.md
    workflow: 16
---

# Oracle Cloud(OCI)에서 OpenClaw 실행

## 목표

Oracle Cloud의 **Always Free** ARM 티어에서 지속 실행되는 OpenClaw Gateway를 실행합니다.

Oracle의 무료 티어는 OpenClaw에 매우 적합할 수 있지만(특히 이미 OCI 계정이 있다면), 몇 가지 트레이드오프가 있습니다.

- ARM 아키텍처(대부분은 작동하지만 일부 바이너리는 x86 전용일 수 있음)
- 용량과 가입 과정이 까다로울 수 있음

## 비용 비교(2026년)

| 제공업체     | 플랜            | 사양                  | 월 가격 | 참고                 |
| ------------ | --------------- | ---------------------- | -------- | --------------------- |
| Oracle Cloud | Always Free ARM | 최대 4 OCPU, 24GB RAM | $0       | ARM, 제한된 용량 |
| Hetzner      | CX22            | 2 vCPU, 4GB RAM        | 약 $4     | 가장 저렴한 유료 옵션  |
| DigitalOcean | Basic           | 1 vCPU, 1GB RAM        | $6       | 쉬운 UI, 좋은 문서    |
| Vultr        | Cloud Compute   | 1 vCPU, 1GB RAM        | $6       | 다양한 위치        |
| Linode       | Nanode          | 1 vCPU, 1GB RAM        | $5       | 현재 Akamai의 일부    |

---

## 사전 준비 사항

- Oracle Cloud 계정([가입](https://www.oracle.com/cloud/free/)) — 문제가 발생하면 [커뮤니티 가입 가이드](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)를 참조하세요
- Tailscale 계정([tailscale.com](https://tailscale.com)에서 무료)
- 약 30분

## 1) OCI 인스턴스 만들기

1. [Oracle Cloud Console](https://cloud.oracle.com/)에 로그인합니다
2. **Compute → Instances → Create Instance**로 이동합니다
3. 구성:
   - **이름:** `openclaw`
   - **이미지:** Ubuntu 24.04 (aarch64)
   - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
   - **OCPU:** 2개(또는 최대 4개)
   - **메모리:** 12 GB(또는 최대 24 GB)
   - **부트 볼륨:** 50 GB(무료로 최대 200 GB)
   - **SSH 키:** 공개 키 추가
4. **Create**를 클릭합니다
5. 공용 IP 주소를 기록합니다

**팁:** 인스턴스 생성이 "Out of capacity"로 실패하면 다른 가용성 도메인을 시도하거나 나중에 다시 시도하세요. 무료 티어 용량은 제한되어 있습니다.

## 2) 연결 및 업데이트

```bash
# Connect via public IP
ssh ubuntu@YOUR_PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential
```

**참고:** 일부 의존성을 ARM용으로 컴파일하려면 `build-essential`이 필요합니다.

## 3) 사용자와 호스트 이름 구성

```bash
# Set hostname
sudo hostnamectl set-hostname openclaw

# Set password for ubuntu user
sudo passwd ubuntu

# Enable lingering (keeps user services running after logout)
sudo loginctl enable-linger ubuntu
```

## 4) Tailscale 설치

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --ssh --hostname=openclaw
```

이렇게 하면 Tailscale SSH가 활성화되어, tailnet의 어느 기기에서든 `ssh openclaw`로 연결할 수 있습니다. 공용 IP는 필요 없습니다.

확인:

```bash
tailscale status
```

**이제부터는 Tailscale로 연결하세요:** `ssh ubuntu@openclaw`(또는 Tailscale IP 사용).

## 5) OpenClaw 설치

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
source ~/.bashrc
```

"How do you want to hatch your bot?"라는 메시지가 표시되면 **"Do this later"**를 선택합니다.

> 참고: ARM 네이티브 빌드 문제가 발생하면 Homebrew를 사용하기 전에 시스템 패키지(예: `sudo apt install -y build-essential`)부터 확인하세요.

## 6) Gateway 구성(loopback + 토큰 인증) 및 Tailscale Serve 활성화

토큰 인증을 기본값으로 사용하세요. 예측 가능하며 “insecure auth” Control UI 플래그가 필요하지 않습니다.

```bash
# Keep the Gateway private on the VM
openclaw config set gateway.bind loopback

# Require auth for the Gateway + Control UI
openclaw config set gateway.auth.mode token
openclaw doctor --generate-gateway-token

# Expose over Tailscale Serve (HTTPS + tailnet access)
openclaw config set gateway.tailscale.mode serve
openclaw config set gateway.trustedProxies '["127.0.0.1"]'

systemctl --user restart openclaw-gateway.service
```

여기서 `gateway.trustedProxies=["127.0.0.1"]`는 local Tailscale Serve 프록시의 전달된 IP/local-client 처리를 위한 것일 뿐입니다. 이는 **`gateway.auth.mode: "trusted-proxy"`가 아닙니다**. 이 설정에서는 diff 뷰어 라우트가 실패 시 닫힘 동작을 유지합니다. 전달 프록시 헤더가 없는 원시 `127.0.0.1` 뷰어 요청은 `Diff not found`를 반환할 수 있습니다. 첨부 파일에는 `mode=file` / `mode=both`를 사용하거나, 공유 가능한 뷰어 링크가 필요하면 의도적으로 원격 뷰어를 활성화하고 `plugins.entries.diffs.config.viewerBaseUrl`을 설정하세요(또는 프록시 `baseUrl` 전달).

## 7) 확인

```bash
# Check version
openclaw --version

# Check daemon status
systemctl --user status openclaw-gateway.service

# Check Tailscale Serve
tailscale serve status

# Test local response
curl http://localhost:18789
```

## 8) VCN 보안 잠그기

이제 모든 것이 작동하므로 Tailscale을 제외한 모든 트래픽을 차단하도록 VCN을 잠급니다. OCI의 Virtual Cloud Network는 네트워크 경계에서 방화벽처럼 동작합니다. 트래픽은 인스턴스에 도달하기 전에 차단됩니다.

1. OCI Console에서 **Networking → Virtual Cloud Networks**로 이동합니다
2. 내 VCN → **Security Lists** → Default Security List를 클릭합니다
3. 다음을 제외한 모든 인그레스 규칙을 **제거**합니다:
   - `0.0.0.0/0 UDP 41641` (Tailscale)
4. 기본 이그레스 규칙은 유지합니다(모든 아웃바운드 허용)

이렇게 하면 네트워크 경계에서 포트 22의 SSH, HTTP, HTTPS 및 그 밖의 모든 것이 차단됩니다. 이제부터는 Tailscale로만 연결할 수 있습니다.

---

## Control UI에 접근하기

Tailscale 네트워크의 어느 기기에서든:

```
https://openclaw.<tailnet-name>.ts.net/
```

`<tailnet-name>`을 tailnet 이름으로 바꾸세요(`tailscale status`에서 확인 가능).

SSH 터널은 필요 없습니다. Tailscale은 다음을 제공합니다.

- HTTPS 암호화(자동 인증서)
- Tailscale ID를 통한 인증
- tailnet의 어느 기기에서든 접근(노트북, 휴대폰 등)

---

## 보안: VCN + Tailscale(권장 기준선)

VCN이 잠겨 있고(UDP 41641만 열림) Gateway가 loopback에 바인딩되어 있으면, 강력한 심층 방어를 얻을 수 있습니다. 공용 트래픽은 네트워크 경계에서 차단되고, 관리자 접근은 tailnet을 통해 이루어집니다.

이 설정은 인터넷 전역 SSH 무차별 대입 공격을 막기 위한 추가 호스트 기반 방화벽 규칙의 _필요성_ 을 대체하는 경우가 많습니다. 하지만 여전히 OS를 최신 상태로 유지하고, `openclaw security audit`를 실행하며, 공용 인터페이스에서 실수로 리스닝하고 있지 않은지 확인해야 합니다.

### 이미 보호됨

| 기존 단계   | 필요한가요?     | 이유                                                                          |
| ------------------ | ----------- | ---------------------------------------------------------------------------- |
| UFW 방화벽       | 아니요          | 트래픽이 인스턴스에 도달하기 전에 VCN이 차단함                                   |
| fail2ban           | 아니요          | VCN에서 포트 22가 차단되어 있으면 무차별 대입이 없음                                     |
| sshd 강화     | 아니요          | Tailscale SSH는 sshd를 사용하지 않음                                               |
| 루트 로그인 비활성화 | 아니요          | Tailscale은 시스템 사용자가 아니라 Tailscale ID를 사용함                          |
| SSH 키 전용 인증  | 아니요          | Tailscale이 tailnet을 통해 인증함                                     |
| IPv6 강화     | 보통은 아님 | VCN/서브넷 설정에 따라 다릅니다. 실제로 할당/노출된 항목을 확인하세요 |

### 여전히 권장됨

- **자격 증명 권한:** `chmod 700 ~/.openclaw`
- **보안 감사:** `openclaw security audit`
- **시스템 업데이트:** 정기적으로 `sudo apt update && sudo apt upgrade`
- **Tailscale 모니터링:** [Tailscale 관리자 콘솔](https://login.tailscale.com/admin)에서 기기를 검토하세요

### 보안 상태 확인

```bash
# Confirm no public ports listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely
sudo systemctl disable --now ssh
```

---

## 대체 방법: SSH 터널

Tailscale Serve가 작동하지 않으면 SSH 터널을 사용하세요.

```bash
# From your local machine (via Tailscale)
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

그런 다음 `http://localhost:18789`를 엽니다.

---

## 문제 해결

### 인스턴스 생성 실패("Out of capacity")

무료 티어 ARM 인스턴스는 인기가 많습니다. 다음을 시도하세요.

- 다른 가용성 도메인
- 사용량이 적은 시간대(이른 아침)에 다시 시도
- shape 선택 시 "Always Free" 필터 사용

### Tailscale이 연결되지 않음

```bash
# Check status
sudo tailscale status

# Re-authenticate
sudo tailscale up --ssh --hostname=openclaw --reset
```

### Gateway가 시작되지 않음

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service -n 50
```

### Control UI에 연결할 수 없음

```bash
# Verify Tailscale Serve is running
tailscale serve status

# Check gateway is listening
curl http://localhost:18789

# Restart if needed
systemctl --user restart openclaw-gateway.service
```

### ARM 바이너리 문제

일부 도구에는 ARM 빌드가 없을 수 있습니다. 확인:

```bash
uname -m  # Should show aarch64
```

대부분의 npm 패키지는 잘 작동합니다. 바이너리는 `linux-arm64` 또는 `aarch64` 릴리스를 찾아보세요.

---

## 지속성

모든 상태는 다음에 저장됩니다.

- `~/.openclaw/` — `openclaw.json`, 에이전트별 `auth-profiles.json`, 채널/제공자 상태 및 세션 데이터
- `~/.openclaw/workspace/` — workspace(SOUL.md, memory, artifacts)

주기적으로 백업하세요.

```bash
openclaw backup create
```

---

## 관련 항목

- [Gateway 원격 접근](/ko/gateway/remote) — 다른 원격 접근 패턴
- [Tailscale 통합](/ko/gateway/tailscale) — 전체 Tailscale 문서
- [Gateway 구성](/ko/gateway/configuration) — 모든 구성 옵션
- [DigitalOcean 가이드](/ko/install/digitalocean) — 유료 + 더 쉬운 가입을 원한다면
- [Hetzner 가이드](/ko/install/hetzner) — Docker 기반 대안
