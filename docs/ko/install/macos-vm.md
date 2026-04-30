---
read_when:
    - OpenClaw를 기본 macOS 환경과 격리하려는 경우
    - 샌드박스에서 iMessage 통합(BlueBubbles)을 사용하려는 경우
    - 복제할 수 있는 재설정 가능한 macOS 환경이 필요합니다
    - 로컬과 호스팅형 macOS VM 옵션을 비교하려는 경우
summary: 격리 또는 iMessage가 필요할 때 샌드박스된 macOS VM(로컬 또는 호스팅)에서 OpenClaw를 실행하세요
title: macOS 가상 머신
x-i18n:
    generated_at: "2026-04-30T06:37:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 49cd3d420db02bcdb80378c3a91a1c1243e7be2012525c31de1dd49db397d560
    source_path: install/macos-vm.md
    workflow: 16
---

# macOS VM에서 OpenClaw 실행하기(샌드박싱)

## 권장 기본값(대부분의 사용자)

- 항상 켜져 있는 Gateway와 낮은 비용이 필요하다면 **소형 Linux VPS**를 사용하세요. [VPS 호스팅](/ko/vps)을 참고하세요.
- 브라우저 자동화를 위한 완전한 제어와 **가정용 IP**가 필요하다면 **전용 하드웨어**(Mac mini 또는 Linux 박스)를 사용하세요. 많은 사이트가 데이터 센터 IP를 차단하므로, 로컬 브라우징이 더 잘 작동하는 경우가 많습니다.
- **하이브리드:** 저렴한 VPS에 Gateway를 유지하고, 브라우저/UI 자동화가 필요할 때 Mac을 **node**로 연결하세요. [Nodes](/ko/nodes) 및 [Gateway 원격](/ko/gateway/remote)을 참고하세요.

macOS 전용 기능(iMessage/BlueBubbles)이 특별히 필요하거나 일상적으로 사용하는 Mac과 엄격히 분리하고 싶을 때 macOS VM을 사용하세요.

## macOS VM 옵션

### Apple Silicon Mac의 로컬 VM(Lume)

[Lume](https://cua.ai/docs/lume)을 사용해 기존 Apple Silicon Mac의 샌드박스된 macOS VM에서 OpenClaw를 실행하세요.

이 방식은 다음을 제공합니다.

- 격리된 전체 macOS 환경(호스트는 깨끗하게 유지)
- BlueBubbles를 통한 iMessage 지원(Linux/Windows에서는 불가능)
- VM 복제로 즉시 초기화
- 추가 하드웨어 또는 클라우드 비용 없음

### 호스팅 Mac 제공업체(클라우드)

클라우드에서 macOS를 사용하려면 호스팅 Mac 제공업체도 사용할 수 있습니다.

- [MacStadium](https://www.macstadium.com/) (호스팅 Mac)
- 다른 호스팅 Mac 벤더도 작동합니다. 해당 벤더의 VM + SSH 문서를 따르세요.

macOS VM에 SSH로 접근할 수 있게 되면 아래 6단계부터 계속하세요.

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
3. 사용자 계정 생성(사용자 이름과 비밀번호 기억)
4. 모든 선택 기능 건너뛰기

설정이 완료되면 SSH를 활성화하세요.

1. 시스템 설정 → 일반 → 공유 열기
2. "원격 로그인" 활성화

---

## 4) VM IP 주소 확인

```bash
lume get openclaw
```

IP 주소를 확인하세요(보통 `192.168.64.x`).

---

## 5) VM에 SSH 접속

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

온보딩 프롬프트에 따라 모델 제공업체(Anthropic, OpenAI 등)를 설정하세요.

---

## 7) 채널 구성

구성 파일을 편집하세요.

```bash
nano ~/.openclaw/openclaw.json
```

채널을 추가하세요.

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

그런 다음 WhatsApp에 로그인하세요(QR 스캔).

```bash
openclaw channels login
```

---

## 8) VM을 헤드리스로 실행

VM을 중지하고 표시 없이 다시 시작하세요.

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM은 백그라운드에서 실행됩니다. OpenClaw의 데몬이 Gateway를 계속 실행합니다.

상태를 확인하려면:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 보너스: iMessage 통합

이것이 macOS에서 실행하는 핵심 기능입니다. [BlueBubbles](https://bluebubbles.app)를 사용해 OpenClaw에 iMessage를 추가하세요.

VM 내부에서:

1. bluebubbles.app에서 BlueBubbles 다운로드
2. Apple ID로 로그인
3. Web API를 활성화하고 비밀번호 설정
4. BlueBubbles Webhook을 Gateway로 지정(예: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

OpenClaw 구성에 추가하세요.

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

Gateway를 다시 시작하세요. 이제 에이전트가 iMessage를 보내고 받을 수 있습니다.

전체 설정 세부 정보: [BlueBubbles 채널](/ko/channels/bluebubbles)

---

## 골든 이미지 저장

추가로 커스터마이징하기 전에 깨끗한 상태를 스냅샷으로 저장하세요.

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

다음 방법으로 VM을 계속 실행하세요.

- Mac을 전원에 연결해 두기
- 시스템 설정 → 에너지 절약에서 잠자기 비활성화
- 필요하다면 `caffeinate` 사용

진정한 상시 실행이 필요하다면 전용 Mac mini 또는 소형 VPS를 고려하세요. [VPS 호스팅](/ko/vps)을 참고하세요.

---

## 문제 해결

| 문제                         | 해결 방법                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| VM에 SSH 접속 불가           | VM의 시스템 설정에서 "원격 로그인"이 활성화되어 있는지 확인하세요                    |
| VM IP가 표시되지 않음        | VM이 완전히 부팅될 때까지 기다린 다음 `lume get openclaw`를 다시 실행하세요         |
| Lume 명령을 찾을 수 없음     | PATH에 `~/.local/bin`을 추가하세요                                                   |
| WhatsApp QR이 스캔되지 않음  | `openclaw channels login` 실행 시 호스트가 아니라 VM에 로그인되어 있는지 확인하세요 |

---

## 관련 문서

- [VPS 호스팅](/ko/vps)
- [Nodes](/ko/nodes)
- [Gateway 원격](/ko/gateway/remote)
- [BlueBubbles 채널](/ko/channels/bluebubbles)
- [Lume 빠른 시작](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 참조](https://cua.ai/docs/lume/reference/cli-reference)
- [무인 VM 설정](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (고급)
- [Docker 샌드박싱](/ko/install/docker) (대체 격리 방식)
