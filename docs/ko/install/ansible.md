---
read_when:
    - 보안 강화를 적용한 자동화된 서버 배포를 원합니다
    - VPN 액세스가 가능한 방화벽 격리 설정이 필요합니다
    - 원격 Debian/Ubuntu 서버에 배포하는 경우
summary: Ansible, Tailscale VPN 및 방화벽 격리를 사용한 자동화되고 보안이 강화된 OpenClaw 설치
title: Ansible
x-i18n:
    generated_at: "2026-04-30T06:35:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbe42e3f83b02e436f0dc5111dda1e069c573b32fdde23ad50dbb2b147c6dd72
    source_path: install/ansible.md
    workflow: 16
---

# Ansible 설치

보안 우선 아키텍처를 갖춘 자동 설치 프로그램인 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**로 프로덕션 서버에 OpenClaw를 배포하세요.

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 저장소는 Ansible 배포의 원천 정보입니다. 이 페이지는 간단한 개요입니다.
</Info>

## 필수 조건

| 요구 사항 | 세부 정보                                                 |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ 또는 Ubuntu 20.04+                               |
| **액세스**  | root 또는 sudo 권한                                   |
| **네트워크** | 패키지 설치를 위한 인터넷 연결              |
| **Ansible** | 2.14+ (빠른 시작 스크립트가 자동으로 설치) |

## 제공되는 것

- **방화벽 우선 보안** -- UFW + Docker 격리(SSH + Tailscale만 접근 가능)
- **Tailscale VPN** -- 서비스를 공개적으로 노출하지 않는 안전한 원격 액세스
- **Docker** -- 격리된 샌드박스 컨테이너, localhost 전용 바인딩
- **심층 방어** -- 4계층 보안 아키텍처
- **Systemd 통합** -- 강화 설정과 함께 부팅 시 자동 시작
- **한 번의 명령으로 설정** -- 몇 분 안에 전체 배포 완료

## 빠른 시작

한 번의 명령으로 설치:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 설치되는 항목

Ansible 플레이북은 다음을 설치하고 구성합니다.

1. **Tailscale** -- 안전한 원격 액세스를 위한 메시 VPN
2. **UFW 방화벽** -- SSH + Tailscale 포트만 허용
3. **Docker CE + Compose V2** -- 기본 에이전트 샌드박스 백엔드용
4. **Node.js 24 + pnpm** -- 런타임 의존성(Node 22 LTS, 현재 `22.14+`, 계속 지원됨)
5. **OpenClaw** -- 컨테이너화되지 않은 호스트 기반 설치
6. **Systemd 서비스** -- 보안 강화와 함께 자동 시작

<Note>
Gateway는 Docker가 아닌 호스트에서 직접 실행됩니다. 에이전트 샌드박싱은
선택 사항입니다. 이 플레이북은 Docker가 기본 샌드박스
백엔드이기 때문에 Docker를 설치합니다. 자세한 내용과 다른 백엔드는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
</Note>

## 설치 후 설정

<Steps>
  <Step title="openclaw 사용자로 전환">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="온보딩 마법사 실행">
    설치 후 스크립트가 OpenClaw 설정 구성을 안내합니다.
  </Step>
  <Step title="메시징 제공자 연결">
    WhatsApp, Telegram, Discord 또는 Signal에 로그인합니다.
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="설치 확인">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Tailscale에 연결">
    안전한 원격 액세스를 위해 VPN 메시에 참여합니다.
  </Step>
</Steps>

### 빠른 명령

```bash
# Check service status
sudo systemctl status openclaw

# View live logs
sudo journalctl -u openclaw -f

# Restart gateway
sudo systemctl restart openclaw

# Provider login (run as openclaw user)
sudo -i -u openclaw
openclaw channels login
```

## 보안 아키텍처

배포는 4계층 방어 모델을 사용합니다.

1. **방화벽(UFW)** -- SSH(22) + Tailscale(41641/udp)만 공개적으로 노출
2. **VPN(Tailscale)** -- Gateway는 VPN 메시를 통해서만 접근 가능
3. **Docker 격리** -- DOCKER-USER iptables 체인이 외부 포트 노출을 방지
4. **Systemd 강화** -- NoNewPrivileges, PrivateTmp, 비권한 사용자

외부 공격 표면을 확인하려면 다음을 실행하세요.

```bash
nmap -p- YOUR_SERVER_IP
```

포트 22(SSH)만 열려 있어야 합니다. 다른 모든 서비스(Gateway, Docker)는 차단됩니다.

Docker는 Gateway 자체를 실행하기 위한 것이 아니라 에이전트 샌드박스(격리된 도구 실행)를 위해 설치됩니다. 샌드박스 구성은 [Multi-Agent Sandbox and Tools](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

## 수동 설치

자동화 대신 수동 제어를 선호하는 경우:

<Steps>
  <Step title="필수 조건 설치">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="저장소 복제">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="Ansible 컬렉션 설치">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="플레이북 실행">
    ```bash
    ./run-playbook.sh
    ```

    또는 직접 실행한 다음 나중에 설정 스크립트를 수동으로 실행합니다.
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # Then run: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 업데이트

Ansible 설치 프로그램은 OpenClaw를 수동 업데이트용으로 설정합니다. 표준 업데이트 흐름은 [업데이트](/ko/install/updating)를 참조하세요.

Ansible 플레이북을 다시 실행하려면(예: 구성 변경 시):

```bash
cd openclaw-ansible
./run-playbook.sh
```

이는 멱등적이며 여러 번 실행해도 안전합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="방화벽이 내 연결을 차단함">
    - 먼저 Tailscale VPN을 통해 접근할 수 있는지 확인하세요
    - SSH 액세스(포트 22)는 항상 허용됩니다
    - Gateway는 설계상 Tailscale을 통해서만 접근할 수 있습니다

  </Accordion>
  <Accordion title="서비스가 시작되지 않음">
    ```bash
    # Check logs
    sudo journalctl -u openclaw -n 100

    # Verify permissions
    sudo ls -la /opt/openclaw

    # Test manual start
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker 샌드박스 문제">
    ```bash
    # Verify Docker is running
    sudo systemctl status docker

    # Check sandbox image
    sudo docker images | grep openclaw-sandbox

    # Build sandbox image if missing
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="제공자 로그인이 실패함">
    `openclaw` 사용자로 실행 중인지 확인하세요.
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## 고급 구성

자세한 보안 아키텍처와 문제 해결은 openclaw-ansible 저장소를 참조하세요.

- [보안 아키텍처](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [기술 세부 정보](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [문제 해결 가이드](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 관련 항목

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- 전체 배포 가이드
- [Docker](/ko/install/docker) -- 컨테이너화된 Gateway 설정
- [샌드박싱](/ko/gateway/sandboxing) -- 에이전트 샌드박스 구성
- [Multi-Agent Sandbox and Tools](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 격리
