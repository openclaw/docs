---
read_when:
    - Upstash Box에 OpenClaw 배포하기
    - SSH 터널을 통해 대시보드에 액세스할 수 있는 OpenClaw용 관리형 Linux 환경이 필요한 경우
summary: keep-alive 및 SSH 터널 액세스를 사용하여 Upstash Box에서 OpenClaw 호스팅하기
title: Upstash Box
x-i18n:
    generated_at: "2026-07-12T00:51:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Upstash Box에서 연결 유지 수명 주기를 지원하는 관리형 Linux 환경에 영구 OpenClaw Gateway를 실행합니다.

대시보드에 액세스할 때는 SSH 터널을 사용하세요. Gateway 포트를 공용 인터넷에 직접 노출하지 마세요.

## 사전 요구 사항

- Upstash 계정
- 연결 유지가 설정된 Upstash Box
- 로컬 머신의 SSH 클라이언트

## Box 생성

Upstash Console에서 연결 유지가 설정된 Box를 생성하세요. Box ID(예: `right-flamingo-14486`)와 Box API 키를 기록해 두세요.

Upstash에서 최신 OpenClaw Box 안내를
[OpenClaw 설정](https://upstash.com/docs/box/guides/openclaw-setup)에 제공합니다.

## SSH 터널로 연결

OpenClaw 대시보드 포트를 로컬 머신으로 전달하세요. 메시지가 표시되면 Box API 키를 SSH 비밀번호로 사용하세요.

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

연결 유지 옵션은 온보딩 중 유휴 상태로 인한 터널 연결 끊김을 줄여 줍니다.

## OpenClaw 설치

Box 내부에서 다음을 실행하세요.

```bash
sudo npm install -g openclaw
```

## 온보딩 실행

```bash
openclaw onboard --install-daemon
```

안내에 따라 진행하세요. 온보딩이 완료되면 대시보드 URL과 토큰을 복사하세요.

## Gateway 시작

Box 네트워크에 맞게 Gateway를 구성하고 백그라운드에서 시작하세요.

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

SSH 터널이 활성화된 상태에서 로컬로 대시보드 URL을 여세요.

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 자동 재시작

Box가 시작될 때 Gateway도 다시 시작되도록 이 명령을 Box 초기화 스크립트로 설정하세요.

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## 문제 해결

온보딩 중 SSH가 멈추면 초기화된 SSH 구성과 연결 유지 옵션을 사용하여 다시 연결하세요.

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

이렇게 하면 오래된 로컬 `~/.ssh/config` 설정을 우회하고 네트워크 유휴 시간에도 터널을 활성 상태로 유지할 수 있습니다.

## 관련 문서

- [원격 액세스](/ko/gateway/remote)
- [Gateway 보안](/ko/gateway/security)
- [OpenClaw 업데이트](/ko/install/updating)
