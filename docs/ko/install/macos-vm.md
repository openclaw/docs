---
read_when:
    - 기본 macOS 환경에서 OpenClaw를 격리하려는 경우
    - 샌드박스에서 iMessage 연동을 사용하려고 합니다
    - 복제할 수 있고 초기화 가능한 macOS 환경이 필요합니다
    - 로컬 및 호스팅 macOS VM 옵션을 비교하려고 합니다
summary: 격리가 필요하거나 iMessage를 사용할 때는 샌드박스된 macOS VM(로컬 또는 호스팅)에서 OpenClaw를 실행하십시오.
title: macOS 가상 머신
x-i18n:
    generated_at: "2026-07-12T15:27:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7e6b963faaf40f65adce1081715bc295059b8bed278a8c71a05a86e04ad7a7a5
    source_path: install/macos-vm.md
    workflow: 16
---

## 권장 기본 구성(대부분의 사용자)

- 상시 가동 Gateway를 저렴하게 운영하려면 **소형 Linux VPS**를 사용하십시오. [VPS 호스팅](/ko/vps)을 참조하십시오.
- 완전한 제어와 브라우저 자동화를 위한 **가정용 IP**가 필요하다면 **전용 하드웨어**(Mac mini 또는 Linux 장비)를 사용하십시오. 많은 사이트가 데이터 센터 IP를 차단하므로 로컬 브라우징이 더 원활한 경우가 많습니다.
- **하이브리드**: Gateway는 저렴한 VPS에서 계속 실행하고, 브라우저/UI 자동화가 필요할 때 Mac을 **Node**로 연결하십시오. [Node](/ko/nodes) 및 [원격 Gateway](/ko/gateway/remote)를 참조하십시오.

iMessage 같은 macOS 전용 기능이 반드시 필요하거나 일상적으로 사용하는 Mac과 엄격히 격리하려는 경우에만 macOS VM을 사용하십시오.

## macOS VM 옵션

### Apple Silicon Mac의 로컬 VM(Lume)

기존 Apple Silicon Mac에서 [Lume](https://cua.ai/docs/lume)를 사용하여 샌드박스형 macOS VM에 OpenClaw를 실행합니다. 다음과 같은 이점이 있습니다.

- 격리된 완전한 macOS 환경(호스트를 깨끗하게 유지)
- `imsg`를 통한 iMessage 지원. 기본 로컬 방식은 Linux/Windows에서 사용할 수 없음
- VM 복제를 통한 즉각적인 초기화
- 추가 하드웨어 또는 클라우드 비용 없음

### 호스팅형 Mac 제공업체(클라우드)

클라우드에서 macOS를 사용하려는 경우 호스팅형 Mac 제공업체도 사용할 수 있습니다.

- [MacStadium](https://www.macstadium.com/)(호스팅형 Mac)
- 다른 호스팅형 Mac 공급업체도 사용할 수 있습니다. 해당 업체의 VM 및 SSH 문서를 따르십시오.

macOS VM에 대한 SSH 액세스를 확보했으면 아래의 [OpenClaw 설치](#6-install-openclaw)로 계속 진행하십시오.

## 빠른 경로(Lume, 숙련된 사용자)

1. Lume를 설치합니다.
2. `lume create openclaw --os macos --ipsw latest`
3. Setup Assistant를 완료하고 Remote Login(SSH)을 활성화합니다.
4. `lume run openclaw --no-display`
5. SSH로 접속하여 OpenClaw를 설치하고 채널을 구성합니다.
6. 완료되었습니다.

## 필요한 항목(Lume)

- Apple Silicon Mac(M1/M2/M3/M4)
- 호스트의 macOS Sequoia 이상
- VM당 약 60 GB의 여유 디스크 공간
- 약 20분

## 1) Lume 설치

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin`이 PATH에 없다면 다음을 실행합니다.

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

확인합니다.

```bash
lume --version
```

문서: [Lume 설치](https://cua.ai/docs/lume/guide/getting-started/installation)

## 2) macOS VM 생성

```bash
lume create openclaw --os macos --ipsw latest
```

이 명령은 macOS를 다운로드하고 VM을 생성합니다. VNC 창이 자동으로 열립니다.

<Note>
연결 상태에 따라 다운로드에 시간이 걸릴 수 있습니다.
</Note>

## 3) Setup Assistant 완료

VNC 창에서 다음을 수행합니다.

1. 언어와 지역을 선택합니다.
2. Apple ID를 건너뜁니다(나중에 iMessage를 사용하려면 로그인).
3. 사용자 계정을 생성합니다(사용자 이름과 비밀번호를 기억해 두십시오).
4. 모든 선택적 기능을 건너뜁니다.

설정이 완료되면 다음을 수행합니다.

1. SSH를 활성화합니다. System Settings -> General -> Sharing에서 "Remote Login"을 활성화합니다.
2. 헤드리스 VM으로 사용하려면 자동 로그인을 활성화합니다. System Settings -> Users & Groups에서 "Automatically log in as:"를 선택하고 VM 사용자를 선택합니다.

## 4) VM IP 주소 확인

```bash
lume get openclaw
```

IP 주소를 찾습니다(일반적으로 `192.168.64.x`).

## 5) SSH로 VM에 접속

```bash
ssh youruser@192.168.64.X
```

`youruser`를 생성한 계정으로 바꾸고, IP를 VM의 IP로 바꾸십시오.

## 6) OpenClaw 설치

VM 내부에서 다음을 실행합니다.

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

온보딩 안내에 따라 모델 제공업체(Anthropic, OpenAI 등)를 설정합니다.

## 7) 채널 구성

구성 파일을 편집합니다.

```bash
nano ~/.openclaw/openclaw.json
```

채널을 추가합니다.

```json5
{
  channels: {
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

그런 다음 WhatsApp에 로그인합니다(QR 스캔).

```bash
openclaw channels login
```

## 8) VM을 헤드리스로 실행

VM을 중지하고 디스플레이 없이 다시 시작합니다.

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM은 백그라운드에서 실행되며 OpenClaw의 데몬이 Gateway를 계속 실행합니다. 상태를 확인하려면 다음을 실행합니다.

```bash
ssh youruser@192.168.64.X "openclaw status"
```

## 보너스: iMessage 통합

macOS에서 실행할 때 얻을 수 있는 가장 강력한 기능입니다. `imsg`와 함께 [iMessage](/ko/channels/imessage)를 사용하여 메시지 앱을 OpenClaw에 추가하십시오.

VM 내부에서 다음을 수행합니다.

1. 메시지 앱에 로그인합니다.
2. `imsg`를 설치합니다.
3. OpenClaw/`imsg`를 실행하는 프로세스에 Full Disk Access 및 Automation 권한을 부여합니다.
4. `imsg rpc --help`로 RPC 지원을 확인합니다.

OpenClaw 구성에 다음을 추가합니다.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

Gateway를 다시 시작합니다. 이제 에이전트가 iMessage를 보내고 받을 수 있습니다. 전체 설정 세부 정보는 [iMessage 채널](/ko/channels/imessage)을 참조하십시오.

## 골든 이미지 저장

추가로 사용자 지정하기 전에 깨끗한 상태의 스냅샷을 만듭니다.

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

언제든지 초기화할 수 있습니다.

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

## 연중무휴 실행

다음과 같이 VM을 계속 실행하십시오.

- Mac을 전원에 연결된 상태로 유지
- System Settings -> Energy Saver에서 잠자기 비활성화
- 필요한 경우 `caffeinate` 사용

진정한 상시 가동을 원한다면 전용 Mac mini 또는 소형 VPS를 고려하십시오. [VPS 호스팅](/ko/vps)을 참조하십시오.

## 문제 해결

| 문제                     | 해결 방법                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| VM에 SSH로 접속할 수 없음 | VM의 System Settings에서 "Remote Login"이 활성화되어 있는지 확인하십시오                          |
| VM IP가 표시되지 않음     | VM이 완전히 부팅될 때까지 기다린 후 `lume get openclaw`를 다시 실행하십시오                       |
| Lume 명령을 찾을 수 없음  | `~/.local/bin`을 PATH에 추가하십시오                                                              |
| WhatsApp QR이 스캔되지 않음 | `openclaw channels login`을 실행할 때 호스트가 아닌 VM에 로그인되어 있는지 확인하십시오           |

## 관련 문서

- [VPS 호스팅](/ko/vps)
- [Node](/ko/nodes)
- [원격 Gateway](/ko/gateway/remote)
- [iMessage 채널](/ko/channels/imessage)
- [Lume 빠른 시작](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 참조](https://cua.ai/docs/lume/reference/cli-reference)
- [무인 VM 설정](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)(고급)
- [Docker 샌드박싱](/ko/install/docker)(대체 격리 방식)
