---
read_when:
    - 보안 강화를 적용한 자동화된 서버 배포가 필요한 경우
    - VPN 액세스가 가능한 방화벽 격리 설정이 필요합니다.
    - 원격 Debian/Ubuntu 서버에 배포하고 있습니다
summary: Ansible, Tailscale VPN 및 방화벽 격리를 활용한 자동화되고 강화된 OpenClaw 설치
title: Ansible
x-i18n:
    generated_at: "2026-07-12T00:49:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d3626ab364169609f92f636cb6b86cb980dca2b235500e748296128765444ae
    source_path: install/ansible.md
    workflow: 16
---

보안 우선 아키텍처를 갖춘 자동 설치 프로그램인 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**을 사용하여 OpenClaw를 프로덕션 서버에 배포하세요.

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 저장소는 Ansible 배포의 기준 소스입니다. 이 페이지에서는 간략한 개요를 제공합니다.
</Info>

## 사전 요구 사항

| 요구 사항 | 세부 정보                                                        |
| --------- | ---------------------------------------------------------------- |
| 운영 체제 | Debian 11 이상 또는 Ubuntu 20.04 이상                            |
| 접근 권한 | root 또는 sudo 권한                                              |
| 네트워크  | 패키지 설치를 위한 인터넷 연결                                   |
| Ansible   | 2.14 이상(빠른 시작 스크립트에서 자동으로 설치됨)                |

## 제공되는 기능

- 방화벽 우선 보안: UFW + Docker 격리(SSH + Tailscale을 통해서만 접근 가능)
- 서비스를 공개적으로 노출하지 않고 원격으로 접근할 수 있는 Tailscale VPN
- localhost 전용 바인딩을 사용하는 격리된 샌드박스 컨테이너용 Docker
- 보안 강화 및 부팅 시 자동 시작을 지원하는 systemd 통합
- 단일 명령 설정

## 빠른 시작

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 설치되는 항목

1. Tailscale(안전한 원격 접근을 위한 메시 VPN)
2. UFW 방화벽(SSH + Tailscale 포트만 허용)
3. Docker CE + Compose V2(기본 에이전트 샌드박스 백엔드)
4. Node.js 및 pnpm(OpenClaw에는 Node 22.19 이상 또는 23.11 이상이 필요하며, Node 24를 권장함)
5. 컨테이너가 아닌 호스트 기반으로 설치되는 OpenClaw
6. 보안이 강화된 systemd 서비스

<Note>
Gateway는 Docker 내부가 아닌 호스트에서 직접 실행됩니다. 에이전트 샌드박싱은
선택 사항입니다. 이 플레이북은 Docker가 기본 샌드박스
백엔드이므로 Docker를 설치합니다. 다른 백엔드는 [샌드박싱](/ko/gateway/sandboxing)을 참조하세요.
</Note>

## 설치 후 설정

<Steps>
  <Step title="openclaw 사용자로 전환">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="온보딩 마법사 실행">
    설치 후 스크립트가 OpenClaw 구성 과정을 안내합니다.
  </Step>
  <Step title="메시징 채널 연결">
    WhatsApp, Telegram, Discord 또는 Signal에 로그인합니다.
    ```bash
    openclaw channels login --channel <name>
    ```
  </Step>
  <Step title="설치 확인">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="Tailscale에 연결">
    안전한 원격 접근을 위해 VPN 메시에 참여합니다.
  </Step>
</Steps>

### 빠른 명령

```bash
# 서비스 상태 확인
sudo systemctl status openclaw

# 실시간 로그 보기
sudo journalctl -u openclaw -f

# Gateway 다시 시작
sudo systemctl restart openclaw

# 채널 로그인(openclaw 사용자로 실행)
sudo -i -u openclaw
openclaw channels login --channel <name>
```

## 보안 아키텍처

4계층 방어 모델:

1. 방화벽(UFW): SSH(22)와 Tailscale(41641/udp)만 공개적으로 노출
2. VPN(Tailscale): VPN 메시를 통해서만 Gateway에 접근 가능
3. Docker 격리: `DOCKER-USER` iptables 체인이 외부 포트 노출 방지
4. systemd 보안 강화: `NoNewPrivileges`, `PrivateTmp`, 비특권 사용자

외부 공격 표면을 확인합니다.

```bash
nmap -p- YOUR_SERVER_IP
```

포트 22(SSH)만 열려 있어야 합니다. Gateway와 Docker는 외부 접근이 차단된 상태로 유지됩니다.

Docker는 Gateway 실행용이 아니라 에이전트 샌드박스(격리된 도구 실행)용으로 설치됩니다. 샌드박스 구성은 [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참조하세요.

## 수동 설치

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

    또는 플레이북을 직접 실행한 후 설정 스크립트를 수동으로 실행합니다.
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # 그런 다음 실행: /tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 업데이트

Ansible 설치 프로그램은 OpenClaw를 수동으로 업데이트하도록 설정합니다. 표준 절차는 [업데이트](/ko/install/updating)를 참조하세요.

예를 들어 구성을 변경한 후 플레이북을 다시 실행하려면 다음 명령을 사용합니다.

```bash
cd openclaw-ansible
./run-playbook.sh
```

이 작업은 멱등성을 보장하므로 여러 번 실행해도 안전합니다.

## 문제 해결

<AccordionGroup>
  <Accordion title="방화벽이 연결을 차단함">
    - 먼저 Tailscale VPN을 통해 연결하세요. Gateway는 설계상 이 방식으로만 접근할 수 있습니다.
    - SSH(포트 22)는 항상 허용됩니다.

  </Accordion>
  <Accordion title="서비스가 시작되지 않음">
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
    # Docker가 실행 중인지 확인
    sudo systemctl status docker

    # 샌드박스 이미지 확인
    sudo docker images | grep openclaw-sandbox

    # 이미지가 없으면 샌드박스 이미지 빌드(소스 체크아웃 필요)
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    # 소스 체크아웃 없이 npm으로 설치한 경우 다음 참조
    # https://docs.openclaw.ai/gateway/sandboxing#images-and-setup
    ```

  </Accordion>
  <Accordion title="채널 로그인 실패">
    `openclaw` 사용자로 실행하고 있는지 확인하세요.
    ```bash
    sudo -i -u openclaw
    openclaw channels login --channel <name>
    ```
  </Accordion>
</AccordionGroup>

## 고급 구성

자세한 보안 아키텍처와 문제 해결 방법은 openclaw-ansible 저장소를 참조하세요.

- [보안 아키텍처](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [기술 세부 정보](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [문제 해결 가이드](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 관련 문서

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible): 전체 배포 가이드
- [Docker](/ko/install/docker): 컨테이너화된 Gateway 설정
- [샌드박싱](/ko/gateway/sandboxing): 에이전트 샌드박스 구성
- [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools): 에이전트별 격리
