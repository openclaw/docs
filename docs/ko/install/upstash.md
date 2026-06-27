---
read_when:
    - OpenClaw를 Upstash Box에 배포하기
    - OpenClaw용 관리형 Linux 환경과 SSH 터널을 통한 대시보드 액세스가 필요한 경우
summary: 연결 유지 및 SSH 터널 액세스를 사용하여 Upstash Box에서 OpenClaw 호스팅
title: Upstash Box
x-i18n:
    generated_at: "2026-06-27T17:38:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

Upstash Box에서 지속 실행되는 OpenClaw Gateway를 실행합니다. Upstash Box는 keep-alive 수명 주기 지원을 제공하는 관리형 Linux 환경입니다.

대시보드 액세스에는 SSH 터널을 사용하세요. Gateway 포트를 공용 인터넷에 직접 노출하지 마세요.

## 필수 조건

- Upstash 계정
- keep-alive Upstash Box
- 로컬 머신의 SSH 클라이언트

## Box 만들기

Upstash Console에서 keep-alive Box를 만듭니다. `right-flamingo-14486` 같은 Box ID와 Box API 키를 기록해 둡니다.

Upstash는 현재 OpenClaw Box 안내를 [OpenClaw 설정](https://upstash.com/docs/box/guides/openclaw-setup)에서 관리합니다.

## SSH 터널로 연결하기

OpenClaw 대시보드 포트를 로컬 머신으로 전달합니다. 메시지가 표시되면 Box API 키를 SSH 비밀번호로 사용하세요.

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

keepalive 옵션은 온보딩 중 유휴 터널 끊김을 줄입니다.

## OpenClaw 설치

Box 내부에서 실행합니다.

```bash
sudo npm install -g openclaw
```

## 온보딩 실행

```bash
openclaw onboard --install-daemon
```

프롬프트를 따릅니다. 온보딩이 완료되면 대시보드 URL과 토큰을 복사합니다.

## Gateway 시작

Box 네트워크에 맞게 Gateway를 구성하고 백그라운드에서 시작합니다.

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

SSH 터널이 활성화된 상태에서 대시보드 URL을 로컬로 엽니다.

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 자동 재시작

Box가 시작될 때 Gateway가 재시작되도록 이 명령을 Box init 스크립트로 설정합니다.

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## 문제 해결

온보딩 중 SSH가 멈추면 깨끗한 SSH 구성과 keepalive로 다시 연결합니다.

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

이렇게 하면 오래된 로컬 `~/.ssh/config` 설정을 우회하고 유휴 네트워크 기간에도 터널을 활성 상태로 유지합니다.

## 관련 항목

- [원격 액세스](/ko/gateway/remote)
- [Gateway 보안](/ko/gateway/security)
- [OpenClaw 업데이트](/ko/install/updating)
