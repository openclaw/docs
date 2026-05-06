---
read_when:
    - OpenClaw를 기본 macOS 환경과 격리하고 싶은 경우
    - 샌드박스에서 iMessage 통합(BlueBubbles)을 원합니다
    - 복제 가능하고 초기화할 수 있는 macOS 환경이 필요합니다
    - 로컬 및 호스팅된 macOS VM 옵션을 비교하려는 경우
summary: 격리 또는 iMessage가 필요할 때 샌드박스화된 macOS VM(로컬 또는 호스팅)에서 OpenClaw를 실행하세요
title: macOS 가상 머신
x-i18n:
    generated_at: "2026-05-06T06:31:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2b6841f66e63606346f364bb1b1b9ca4a3d52558e3d8c6f129c5b89387c6968
    source_path: install/macos-vm.md
    workflow: 16
---

## 권장 기본값(대부분의 사용자)

- 상시 실행 Gateway와 낮은 비용을 위한 **소형 Linux VPS**. [VPS 호스팅](/ko/vps)을 참고하세요.
- 브라우저 자동화를 위한 완전한 제어와 **가정용 IP**가 필요하다면 **전용 하드웨어**(Mac mini 또는 Linux 박스)를 사용하세요. 많은 사이트가 데이터 센터 IP를 차단하므로 로컬 브라우징이 더 잘 작동하는 경우가 많습니다.
- **하이브리드:** Gateway는 저렴한 VPS에 유지하고, 브라우저/UI 자동화가 필요할 때 Mac을 **Node**로 연결하세요. [Node](/ko/nodes) 및 [Gateway 원격](/ko/gateway/remote)을 참고하세요.

macOS 전용 기능(iMessage/BlueBubbles)이 필요하거나 매일 사용하는 Mac과 엄격하게 격리하려면 macOS VM을 사용하세요.

## macOS VM 옵션

### Apple Silicon Mac의 로컬 VM(Lume)

[Lume](https://cua.ai/docs/lume)을 사용해 기존 Apple Silicon Mac의 샌드박스된 macOS VM에서 OpenClaw를 실행합니다.

다음을 제공합니다.

- 격리된 전체 macOS 환경(호스트는 깨끗하게 유지)
- BlueBubbles를 통한 iMessage 지원(Linux/Windows에서는 불가능)
- VM 복제를 통한 즉시 초기화
- 추가 하드웨어 또는 클라우드 비용 없음

### 호스팅 Mac 제공업체(클라우드)

클라우드에서 macOS를 사용하려면 호스팅 Mac 제공업체도 사용할 수 있습니다.

- [MacStadium](https://www.macstadium.com/) (호스팅 Mac)
- 다른 호스팅 Mac 업체도 사용할 수 있습니다. 해당 업체의 VM + SSH 문서를 따르세요.

macOS VM에 SSH로 접근할 수 있게 되면 아래 6단계로 진행하세요.

---

## 빠른 경로(Lume, 숙련 사용자)

1. Lume 설치
2. `lume create openclaw --os macos --ipsw latest`
3. 설정 지원을 완료하고 원격 로그인(SSH)을 활성화
4. `lume run openclaw --no-display`
5. SSH로 접속해 OpenClaw를 설치하고 채널을 구성
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

macOS를 다운로드하고 VM을 생성합니다. VNC 창이 자동으로 열립니다.

<Note>
다운로드는 연결 상태에 따라 시간이 걸릴 수 있습니다.
</Note>

---

## 3) 설정 지원 완료

VNC 창에서:

1. 언어와 지역을 선택
2. Apple ID 건너뛰기(나중에 iMessage를 사용하려면 로그인)
3. 사용자 계정 생성(사용자 이름과 비밀번호를 기억하세요)
4. 모든 선택 기능 건너뛰기

설정이 완료되면 SSH를 활성화합니다.

1. 시스템 설정 → 일반 → 공유 열기
2. "원격 로그인" 활성화

---

## 4) VM IP 주소 확인

```bash
lume get openclaw
```

IP 주소를 찾으세요(보통 `192.168.64.x`).

---

## 5) VM에 SSH로 접속

```bash
ssh youruser@192.168.64.X
```

`youruser`를 생성한 계정으로 바꾸고, IP를 VM의 IP로 바꾸세요.

---

## 6) OpenClaw 설치

VM 내부에서:

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

VM은 백그라운드에서 실행됩니다. OpenClaw의 데몬이 Gateway를 계속 실행합니다.

상태 확인:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 보너스: iMessage 통합

macOS에서 실행할 때의 핵심 기능입니다. [BlueBubbles](https://bluebubbles.app)를 사용해 OpenClaw에 iMessage를 추가하세요.

VM 내부에서:

1. bluebubbles.app에서 BlueBubbles 다운로드
2. Apple ID로 로그인
3. Web API를 활성화하고 비밀번호 설정
4. BlueBubbles Webhook이 Gateway를 가리키도록 설정(예: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

OpenClaw 구성에 추가합니다.

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Gateway를 다시 시작합니다. 이제 에이전트가 iMessage를 보내고 받을 수 있습니다.

전체 설정 상세: [BlueBubbles 채널](/ko/channels/bluebubbles)

---

## 골든 이미지 저장

추가 사용자 지정 전에 깨끗한 상태를 스냅샷으로 저장합니다.

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

언제든 초기화:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 24/7 실행

다음으로 VM을 계속 실행 상태로 유지합니다.

- Mac 전원을 연결한 상태로 유지
- 시스템 설정 → 에너지 절약에서 잠자기 비활성화
- 필요한 경우 `caffeinate` 사용

진정한 상시 실행이 필요하다면 전용 Mac mini 또는 소형 VPS를 고려하세요. [VPS 호스팅](/ko/vps)을 참고하세요.

---

## 문제 해결

| 문제                     | 해결 방법                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| VM에 SSH로 접속할 수 없음 | VM의 시스템 설정에서 "원격 로그인"이 활성화되어 있는지 확인하세요                         |
| VM IP가 표시되지 않음     | VM이 완전히 부팅될 때까지 기다린 다음 `lume get openclaw`를 다시 실행하세요               |
| Lume 명령을 찾을 수 없음  | `~/.local/bin`을 PATH에 추가하세요                                                        |
| WhatsApp QR이 스캔되지 않음 | `openclaw channels login`을 실행할 때 호스트가 아니라 VM에 로그인되어 있는지 확인하세요 |

---

## 관련 문서

- [VPS 호스팅](/ko/vps)
- [Node](/ko/nodes)
- [Gateway 원격](/ko/gateway/remote)
- [BlueBubbles 채널](/ko/channels/bluebubbles)
- [Lume 빠른 시작](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 참조](https://cua.ai/docs/lume/reference/cli-reference)
- [무인 VM 설정](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (고급)
- [Docker 샌드박싱](/ko/install/docker) (대체 격리 방식)
