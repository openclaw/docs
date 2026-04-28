---
read_when:
    - 보안 강화가 적용된 자동화된 서버 배포를 원합니다
    - 방화벽으로 격리된 설정과 VPN 액세스가 필요합니다
    - 원격 Debian/Ubuntu 서버에 배포하고 있습니다
summary: Ansible, Tailscale VPN, 방화벽 격리를 사용한 자동화되고 강화된 OpenClaw 설치
title: Ansible
x-i18n:
    generated_at: "2026-04-21T06:04:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2a23374c971a1f3163dd18c32e553ebaad55b2542c1f25f49bcc9ae464d679e8
    source_path: install/ansible.md
    workflow: 15
---

# Ansible 설치

**[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**를 사용해 프로덕션 서버에 OpenClaw를 배포하세요. 보안 우선 아키텍처를 갖춘 자동화 설치 도구입니다.

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 저장소가 Ansible 배포의 기준 소스입니다. 이 페이지는 빠른 개요입니다.
</Info>

## 사전 요구 사항

| 요구 사항 | 세부 정보                                                   |
| ----------- | --------------------------------------------------------- |
| **OS**      | Debian 11+ 또는 Ubuntu 20.04+                               |
| **액세스**  | root 또는 sudo 권한                                   |
| **네트워크** | 패키지 설치를 위한 인터넷 연결              |
| **Ansible** | 2.14+ (빠른 시작 스크립트가 자동으로 설치) |

## 제공되는 항목

- **방화벽 우선 보안** -- UFW + Docker 격리(SSH + Tailscale만 액세스 가능)
- **Tailscale VPN** -- 서비스를 공개적으로 노출하지 않고 안전한 원격 액세스 제공
- **Docker** -- 격리된 샌드박스 컨테이너, localhost 전용 바인딩
- **심층 방어** -- 4계층 보안 아키텍처
- **Systemd 통합** -- 보안 강화와 함께 부팅 시 자동 시작
- **원커맨드 설정** -- 몇 분 안에 전체 배포 완료

## 빠른 시작

원커맨드 설치:

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 설치되는 항목

Ansible 플레이북은 다음을 설치하고 구성합니다:

1. **Tailscale** -- 안전한 원격 액세스를 위한 메시 VPN
2. **UFW 방화벽** -- SSH + Tailscale 포트만 허용
3. **Docker CE + Compose V2** -- 기본 에이전트 샌드박스 백엔드용
4. **Node.js 24 + pnpm** -- 런타임 의존성(Node 22 LTS, 현재 `22.14+`,도 계속 지원됨)
5. **OpenClaw** -- 컨테이너가 아닌 호스트 기반 설치
6. **Systemd 서비스** -- 보안 강화와 함께 자동 시작

<Note>
Gateway는 Docker 안이 아니라 호스트에서 직접 실행됩니다. 에이전트 샌드박싱은
선택 사항이며, 이 플레이북은 기본 샌드박스
백엔드이기 때문에 Docker를 설치합니다. 자세한 내용과 다른 백엔드는 [샌드박싱](/ko/gateway/sandboxing)을 참고하세요.
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
  <Step title="메시징 provider 연결">
    WhatsApp, Telegram, Discord 또는 Signal에 로그인합니다:
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
  <Step title="Tailscale 연결">
    안전한 원격 액세스를 위해 VPN 메시 네트워크에 참여합니다.
  </Step>
</Steps>

### 빠른 명령

```bash
# 서비스 상태 확인
sudo systemctl status openclaw

# 실시간 로그 보기
sudo journalctl -u openclaw -f

# Gateway 재시작
sudo systemctl restart openclaw

# Provider 로그인 (openclaw 사용자로 실행)
sudo -i -u openclaw
openclaw channels login
```

## 보안 아키텍처

이 배포는 4계층 방어 모델을 사용합니다:

1. **방화벽(UFW)** -- SSH(22) + Tailscale(41641/udp)만 공개 노출
2. **VPN(Tailscale)** -- Gateway는 VPN 메시를 통해서만 액세스 가능
3. **Docker 격리** -- DOCKER-USER iptables 체인이 외부 포트 노출 방지
4. **Systemd 강화** -- NoNewPrivileges, PrivateTmp, 비특권 사용자

외부 공격 표면을 확인하려면:

```bash
nmap -p- YOUR_SERVER_IP
```

오직 22번 포트(SSH)만 열려 있어야 합니다. 다른 모든 서비스(Gateway, Docker)는 잠겨 있습니다.

Docker는 Gateway 자체를 실행하기 위한 것이 아니라 에이전트 샌드박스(격리된 도구 실행)를 위해 설치됩니다. 샌드박스 구성은 [Multi-Agent Sandbox and Tools](/ko/tools/multi-agent-sandbox-tools)를 참고하세요.

## 수동 설치

자동화 대신 수동 제어를 선호한다면:

<Steps>
  <Step title="사전 요구 사항 설치">
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

    또는 직접 실행한 뒤 나중에 설정 스크립트를 수동으로 실행할 수 있습니다:
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # 그런 다음 실행: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 업데이트

Ansible 설치 프로그램은 OpenClaw를 수동 업데이트 방식으로 설정합니다. 표준 업데이트 흐름은 [업데이트](/ko/install/updating)를 참고하세요.

Ansible 플레이북을 다시 실행하려면(예: 구성 변경 시):

```bash
cd openclaw-ansible
./run-playbook.sh
```

이는 멱등적이며 여러 번 실행해도 안전합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="방화벽이 연결을 차단합니다">
    - 먼저 Tailscale VPN을 통해 액세스할 수 있는지 확인하세요
    - SSH 액세스(포트 22)는 항상 허용됩니다
    - Gateway는 설계상 Tailscale을 통해서만 액세스할 수 있습니다

  </Accordion>
  <Accordion title="서비스가 시작되지 않습니다">
    ```bash
    # 로그 확인
    sudo journalctl -u openclaw -n 100

    # 권한 확인
    sudo ls -la /opt/openclaw

    # 수동 시작 테스트
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker 샌드박스 문제">
    ```bash
    # Docker 실행 상태 확인
    sudo systemctl status docker

    # 샌드박스 이미지 확인
    sudo docker images | grep openclaw-sandbox

    # 이미지가 없으면 샌드박스 이미지 빌드
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="Provider 로그인이 실패합니다">
    반드시 `openclaw` 사용자로 실행 중인지 확인하세요:
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## 고급 구성

자세한 보안 아키텍처 및 문제 해결은 openclaw-ansible 저장소를 참고하세요:

- [보안 아키텍처](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [기술 세부 사항](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [문제 해결 가이드](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 관련 항목

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- 전체 배포 가이드
- [Docker](/ko/install/docker) -- 컨테이너형 Gateway 설정
- [샌드박싱](/ko/gateway/sandboxing) -- 에이전트 샌드박스 구성
- [Multi-Agent Sandbox and Tools](/ko/tools/multi-agent-sandbox-tools) -- 에이전트별 격리
