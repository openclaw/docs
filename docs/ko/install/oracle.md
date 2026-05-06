---
read_when:
    - Oracle Cloud에서 OpenClaw 설정하기
    - OpenClaw용 무료 VPS 호스팅 찾기
    - 소형 서버에서 OpenClaw를 24시간 연중무휴로 실행하고 싶음
summary: Oracle Cloud의 Always Free ARM 티어에서 OpenClaw 호스팅하기
title: Oracle Cloud
x-i18n:
    generated_at: "2026-05-06T06:31:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9115c83c7a78b78d8b6701b028a2f6e9f08a71f7fff14b7b45f1610b8052c14e
    source_path: install/oracle.md
    workflow: 16
---

Oracle Cloud의 **Always Free** ARM 티어(최대 4 OCPU, 24GB RAM, 200GB 스토리지)에서 지속 실행되는 OpenClaw Gateway를 무료로 실행합니다.

## 사전 준비

- Oracle Cloud 계정([가입](https://www.oracle.com/cloud/free/)) -- 문제가 생기면 [커뮤니티 가입 가이드](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)를 참고하세요
- Tailscale 계정([tailscale.com](https://tailscale.com)에서 무료)
- SSH 키 쌍
- 약 30분

## 설정

<Steps>
  <Step title="OCI 인스턴스 만들기">
    1. [Oracle Cloud Console](https://cloud.oracle.com/)에 로그인합니다.
    2. **Compute > Instances > Create Instance**로 이동합니다.
    3. 다음과 같이 구성합니다.
       - **Name:** `openclaw`
       - **Image:** Ubuntu 24.04 (aarch64)
       - **Shape:** `VM.Standard.A1.Flex` (Ampere ARM)
       - **OCPUs:** 2(또는 최대 4)
       - **Memory:** 12GB(또는 최대 24GB)
       - **Boot volume:** 50GB(최대 200GB 무료)
       - **SSH key:** 공개 키 추가
    4. **Create**를 클릭하고 공용 IP 주소를 기록합니다.

    <Tip>
    인스턴스 생성이 "Out of capacity"로 실패하면 다른 가용성 도메인을 시도하거나 나중에 다시 시도하세요. 무료 티어 용량은 제한되어 있습니다.
    </Tip>

  </Step>

  <Step title="연결하고 시스템 업데이트하기">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    일부 종속성의 ARM 컴파일에는 `build-essential`이 필요합니다.

  </Step>

  <Step title="사용자와 호스트 이름 구성하기">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    linger를 활성화하면 로그아웃 후에도 사용자 서비스가 계속 실행됩니다.

  </Step>

  <Step title="Tailscale 설치하기">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    이제부터는 Tailscale을 통해 연결합니다: `ssh ubuntu@openclaw`.

  </Step>

  <Step title="OpenClaw 설치하기">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    "How do you want to hatch your bot?" 메시지가 표시되면 **Do this later**를 선택합니다.

  </Step>

  <Step title="Gateway 구성하기">
    안전한 원격 액세스를 위해 Tailscale Serve와 함께 토큰 인증을 사용합니다.

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    여기서 `gateway.trustedProxies=["127.0.0.1"]`는 로컬 Tailscale Serve 프록시의 전달된 IP/로컬 클라이언트 처리를 위한 것일 뿐입니다. 이것은 `gateway.auth.mode: "trusted-proxy"`가 **아닙니다**. 이 설정에서 diff 뷰어 라우트는 fail-closed 동작을 유지합니다. 전달된 프록시 헤더가 없는 원시 `127.0.0.1` 뷰어 요청은 `Diff not found`를 반환할 수 있습니다. 첨부 파일에는 `mode=file` / `mode=both`를 사용하거나, 공유 가능한 뷰어 링크가 필요하면 원격 뷰어를 의도적으로 활성화하고 `plugins.entries.diffs.config.viewerBaseUrl`을 설정하세요(또는 프록시 `baseUrl`을 전달하세요).

  </Step>

  <Step title="VCN 보안 잠그기">
    네트워크 경계에서 Tailscale을 제외한 모든 트래픽을 차단합니다.

    1. OCI Console에서 **Networking > Virtual Cloud Networks**로 이동합니다.
    2. VCN을 클릭한 다음 **Security Lists > Default Security List**를 클릭합니다.
    3. `0.0.0.0/0 UDP 41641`(Tailscale)을 제외한 모든 수신 규칙을 **제거**합니다.
    4. 기본 송신 규칙은 유지합니다(모든 아웃바운드 허용).

    이렇게 하면 네트워크 경계에서 포트 22의 SSH, HTTP, HTTPS 및 그 밖의 모든 것이 차단됩니다. 이 시점부터는 Tailscale을 통해서만 연결할 수 있습니다.

  </Step>

  <Step title="확인하기">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    tailnet의 모든 장치에서 Control UI에 액세스합니다.

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    `<tailnet-name>`을 tailnet 이름(`tailscale status`에서 확인 가능)으로 바꿉니다.

  </Step>
</Steps>

## 보안 상태 확인하기

VCN이 잠겨 있고(UDP 41641만 열림) Gateway가 loopback에 바인딩되어 있으면, 공용 트래픽은 네트워크 경계에서 차단되고 관리자 액세스는 tailnet 전용이 됩니다. 따라서 기존 VPS 강화 단계 중 여러 가지가 필요하지 않습니다.

| 기존 단계          | 필요 여부        | 이유                                                                      |
| ------------------ | ----------- | ------------------------------------------------------------------------- |
| UFW 방화벽         | 아니요      | VCN이 트래픽이 인스턴스에 도달하기 전에 차단합니다.                       |
| fail2ban           | 아니요      | 포트 22가 VCN에서 차단되어 무차별 대입 공격 표면이 없습니다.              |
| sshd 강화          | 아니요      | Tailscale SSH는 sshd를 사용하지 않습니다.                                 |
| root 로그인 비활성화 | 아니요    | Tailscale은 시스템 사용자가 아니라 tailnet ID로 인증합니다.               |
| SSH 키 전용 인증   | 아니요      | 동일하게, tailnet ID가 시스템 SSH 키를 대체합니다.                        |
| IPv6 강화          | 일반적으로 아님 | VCN/서브넷 설정에 따라 다릅니다. 실제로 할당/노출된 항목을 확인하세요. |

그래도 권장되는 항목:

- 자격 증명 파일 권한을 제한하려면 `chmod 700 ~/.openclaw`를 실행하세요.
- OpenClaw별 상태 점검에는 `openclaw security audit`를 사용하세요.
- OS 패치를 위해 정기적으로 `sudo apt update && sudo apt upgrade`를 실행하세요.
- [Tailscale 관리자 콘솔](https://login.tailscale.com/admin)에서 장치를 주기적으로 검토하세요.

빠른 확인 명령:

```bash
# Confirm no public ports are listening
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# Verify Tailscale SSH is active
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# Optional: disable sshd entirely once Tailscale SSH is confirmed working
sudo systemctl disable --now ssh
```

## ARM 참고 사항

Always Free 티어는 ARM(`aarch64`)입니다. 대부분의 OpenClaw 기능은 문제없이 작동하지만, 소수의 네이티브 바이너리는 ARM 빌드가 필요합니다.

- Node.js, Telegram, WhatsApp(Baileys): 순수 JavaScript이므로 문제가 없습니다.
- 네이티브 코드가 포함된 대부분의 npm 패키지: 사전 빌드된 `linux-arm64` 아티팩트를 사용할 수 있습니다.
- 선택적 CLI 헬퍼(예: Skills에서 제공하는 Go/Rust 바이너리): 설치 전에 `aarch64` / `linux-arm64` 릴리스가 있는지 확인하세요.

`uname -m`으로 아키텍처를 확인하세요(`aarch64`가 출력되어야 함). ARM 빌드가 없는 바이너리는 소스에서 설치하거나 건너뛰세요.

## 지속성 및 백업

OpenClaw 상태는 다음 위치에 저장됩니다.

- `~/.openclaw/` — `openclaw.json`, 에이전트별 `auth-profiles.json`, 채널/제공자 상태 및 세션 데이터.
- `~/.openclaw/workspace/` — 에이전트 워크스페이스(SOUL.md, 메모리, 아티팩트).

이 데이터는 재부팅 후에도 유지됩니다. 이식 가능한 스냅샷을 만들려면 다음을 실행합니다.

```bash
openclaw backup create
```

## 대안: SSH 터널

Tailscale Serve가 작동하지 않으면 로컬 머신에서 SSH 터널을 사용하세요.

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

그런 다음 `http://localhost:18789`를 엽니다.

## 문제 해결

**인스턴스 생성 실패("Out of capacity")** -- 무료 티어 ARM 인스턴스는 인기가 많습니다. 다른 가용성 도메인을 시도하거나 사용량이 적은 시간대에 다시 시도하세요.

**Tailscale이 연결되지 않음** -- 다시 인증하려면 `sudo tailscale up --ssh --hostname=openclaw --reset`을 실행하세요.

**Gateway가 시작되지 않음** -- `openclaw doctor --non-interactive`를 실행하고 `journalctl --user -u openclaw-gateway.service -n 50`으로 로그를 확인하세요.

**ARM 바이너리 문제** -- 대부분의 npm 패키지는 ARM64에서 작동합니다. 네이티브 바이너리는 `linux-arm64` 또는 `aarch64` 릴리스를 찾으세요. `uname -m`으로 아키텍처를 확인하세요.

## 다음 단계

- [채널](/ko/channels) -- Telegram, WhatsApp, Discord 등 연결
- [Gateway 구성](/ko/gateway/configuration) -- 모든 구성 옵션
- [업데이트](/ko/install/updating) -- OpenClaw를 최신 상태로 유지하기

## 관련 항목

- [설치 개요](/ko/install)
- [GCP](/ko/install/gcp)
- [VPS 호스팅](/ko/vps)
