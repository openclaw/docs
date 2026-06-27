---
read_when:
    - OpenClaw를 기본 macOS 환경과 격리하려는 경우
    - 샌드박스에서 iMessage 통합을 원합니다
    - 재설정 가능한 macOS 환경을 복제할 수 있기를 원합니다
    - 로컬 및 호스팅 macOS VM 옵션을 비교하려는 경우
summary: 격리 또는 iMessage가 필요할 때 샌드박스화된 macOS 가상 머신(로컬 또는 호스팅)에서 OpenClaw를 실행하세요
title: macOS 가상 머신
x-i18n:
    generated_at: "2026-06-27T17:37:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aee2fa0651b711f29d7d092da931bd924bc8ce8a5ca389cf8f189725fa586f3f
    source_path: install/macos-vm.md
    workflow: 16
---

## 권장 기본값(대부분의 사용자)

- 상시 실행 Gateway와 낮은 비용을 위해 **소형 Linux VPS**를 사용하세요. [VPS 호스팅](/ko/vps)을 참고하세요.
- 브라우저 자동화를 위한 완전한 제어와 **가정용 IP**가 필요하다면 **전용 하드웨어**(Mac mini 또는 Linux 장비)를 사용하세요. 많은 사이트가 데이터 센터 IP를 차단하므로, 로컬 브라우징이 더 잘 작동하는 경우가 많습니다.
- **하이브리드:** Gateway는 저렴한 VPS에 두고, 브라우저/UI 자동화가 필요할 때 Mac을 **node**로 연결하세요. [Nodes](/ko/nodes) 및 [Gateway 원격](/ko/gateway/remote)을 참고하세요.

iMessage 같은 macOS 전용 기능이 특별히 필요하거나 일상적으로 사용하는 Mac과 엄격히 격리하고 싶을 때 macOS VM을 사용하세요.

## macOS VM 옵션

### Apple Silicon Mac의 로컬 VM(Lume)

[Lume](https://cua.ai/docs/lume)를 사용해 기존 Apple Silicon Mac의 샌드박스된 macOS VM에서 OpenClaw를 실행합니다.

이를 통해 다음을 얻을 수 있습니다.

- 격리된 전체 macOS 환경(호스트는 깨끗하게 유지)
- `imsg`를 통한 iMessage 지원(기본 로컬 경로는 Linux/Windows에서 불가능)
- VM 복제로 즉시 초기화
- 추가 하드웨어 또는 클라우드 비용 없음

### 호스팅 Mac 제공업체(클라우드)

클라우드에서 macOS를 사용하려면 호스팅 Mac 제공업체도 사용할 수 있습니다.

- [MacStadium](https://www.macstadium.com/) (호스팅 Mac)
- 다른 호스팅 Mac 업체도 사용할 수 있습니다. 해당 업체의 VM + SSH 문서를 따르세요.

macOS VM에 SSH로 접속할 수 있게 되면 아래 6단계부터 계속하세요.

---

## 빠른 경로(Lume, 숙련 사용자)

1. Lume 설치
2. `lume create openclaw --os macos --ipsw latest`
3. 설정 지원을 완료하고 원격 로그인(SSH) 활성화
4. `lume run openclaw --no-display`
5. SSH로 접속해 OpenClaw 설치 및 채널 구성
6. 완료

---

## 필요한 것(Lume)

- Apple Silicon Mac(M1/M2/M3/M4)
- 호스트의 macOS Sequoia 이상
- VM당 약 60GB의 여유 디스크 공간
- 약 20분

---

## 1) Lume 설치

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

`~/.local/bin`이 PATH에 없다면:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

확인:

```bash
lume --version
```

문서: [Lume 설치](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) macOS VM 생성

```bash
lume create openclaw --os macos --ipsw latest
```

이 명령은 macOS를 다운로드하고 VM을 생성합니다. VNC 창이 자동으로 열립니다.

<Note>
연결 상태에 따라 다운로드에 시간이 걸릴 수 있습니다.
</Note>

---

## 3) 설정 지원 완료

VNC 창에서:

1. 언어와 지역 선택
2. Apple ID 건너뛰기(나중에 iMessage를 사용하려면 로그인)
3. 사용자 계정 생성(사용자 이름과 비밀번호를 기억하세요)
4. 모든 선택적 기능 건너뛰기

설정이 완료된 후:

1. SSH 활성화: 시스템 설정 -> 일반 -> 공유를 열고 "원격 로그인"을 활성화합니다.
2. 헤드리스 VM 사용을 위해 자동 로그인을 활성화합니다: 시스템 설정 -> 사용자 및 그룹을 열고 "다음 사용자로 자동 로그인:"을 선택한 뒤 VM 사용자를 선택합니다.

---

## 4) VM IP 주소 가져오기

```bash
lume get openclaw
```

IP 주소(일반적으로 `192.168.64.x`)를 찾으세요.

---

## 5) VM에 SSH로 접속

```bash
ssh youruser@192.168.64.X
```

`youruser`를 생성한 계정으로 바꾸고, IP를 VM의 IP로 바꾸세요.

---

## 6) OpenClaw 설치

VM 안에서:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

온보딩 프롬프트를 따라 모델 제공업체(Anthropic, OpenAI 등)를 설정하세요.

---

## 7) 채널 구성

구성 파일을 편집합니다.

```bash
nano ~/.openclaw/openclaw.json
```

채널을 추가합니다.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

그런 다음 WhatsApp에 로그인합니다(QR 스캔).

```bash
openclaw channels login
```

---

## 8) VM을 헤드리스로 실행

VM을 중지하고 디스플레이 없이 다시 시작합니다.

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM은 백그라운드에서 실행됩니다. OpenClaw의 데몬이 gateway를 계속 실행합니다.

상태를 확인하려면:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 보너스: iMessage 통합

이것이 macOS에서 실행하는 핵심 기능입니다. [iMessage](/ko/channels/imessage)를 `imsg`와 함께 사용해 OpenClaw에 메시지를 추가하세요.

VM 안에서:

1. 메시지에 로그인합니다.
2. `imsg`를 설치합니다.
3. OpenClaw/`imsg`를 실행하는 프로세스에 전체 디스크 접근 권한과 자동화 권한을 부여합니다.
4. `imsg rpc --help`로 RPC 지원을 확인합니다.

OpenClaw 구성에 추가합니다.

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

gateway를 다시 시작합니다. 이제 에이전트가 iMessages를 보내고 받을 수 있습니다.

전체 설정 세부 정보: [iMessage 채널](/ko/channels/imessage)

---

## 골든 이미지 저장

추가 사용자 지정 전에 깨끗한 상태의 스냅샷을 만드세요.

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

언제든지 초기화:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 실행

다음으로 VM을 계속 실행 상태로 유지하세요.

- Mac을 전원에 연결해 두기
- 시스템 설정 → 에너지 절약에서 잠자기 비활성화
- 필요한 경우 `caffeinate` 사용

진정한 상시 실행이 필요하다면 전용 Mac mini 또는 소형 VPS를 고려하세요. [VPS 호스팅](/ko/vps)을 참고하세요.

---

## 문제 해결

| 문제                     | 해결 방법                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| VM에 SSH로 접속할 수 없음 | VM의 시스템 설정에서 "원격 로그인"이 활성화되어 있는지 확인하세요                         |
| VM IP가 표시되지 않음     | VM이 완전히 부팅될 때까지 기다린 뒤 `lume get openclaw`를 다시 실행하세요                 |
| Lume 명령을 찾을 수 없음  | `~/.local/bin`을 PATH에 추가하세요                                                        |
| WhatsApp QR이 스캔되지 않음 | `openclaw channels login`을 실행할 때 호스트가 아니라 VM에 로그인되어 있는지 확인하세요 |

---

## 관련 문서

- [VPS 호스팅](/ko/vps)
- [Nodes](/ko/nodes)
- [Gateway 원격](/ko/gateway/remote)
- [iMessage 채널](/ko/channels/imessage)
- [Lume 빠른 시작](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 참조](https://cua.ai/docs/lume/reference/cli-reference)
- [무인 VM 설정](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (고급)
- [Docker 샌드박싱](/ko/install/docker) (대체 격리 방식)
