---
read_when:
    - Upstash Box에 OpenClaw 배포하기
    - SSH 터널을 통한 대시보드 액세스를 제공하는 OpenClaw용 관리형 Linux 환경이 필요한 경우
summary: 연결 유지 및 SSH 터널 액세스를 사용하여 Upstash Box에서 OpenClaw 호스팅하기
title: Upstash Box
x-i18n:
    generated_at: "2026-07-12T15:23:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

Upstash Box의 keep-alive 수명 주기 지원이 포함된 관리형 Linux 환경에서 지속적으로 실행되는 OpenClaw Gateway를 운영합니다.

대시보드에 액세스하려면 SSH 터널을 사용하십시오. Gateway 포트를 공용 인터넷에 직접 노출하지 마십시오.

## 사전 요구 사항

- Upstash 계정
- keep-alive Upstash Box
- 로컬 컴퓨터의 SSH 클라이언트

## Box 생성

Upstash Console에서 keep-alive Box를 생성합니다. Box ID(예: `right-flamingo-14486`)와 Box API 키를 기록해 둡니다.

Upstash에서 관리하는 최신 OpenClaw Box 안내는 [OpenClaw 설정](https://upstash.com/docs/box/guides/openclaw-setup)에서 확인할 수 있습니다.

## SSH 터널로 연결

OpenClaw 대시보드 포트를 로컬 컴퓨터로 전달합니다. 메시지가 표시되면 Box API 키를 SSH 비밀번호로 사용하십시오.

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

keepalive 옵션은 온보딩 중 유휴 상태로 인한 터널 연결 끊김을 줄여 줍니다.

## OpenClaw 설치

Box 내부에서 다음을 실행합니다.

```bash
sudo npm install -g openclaw
```

## 온보딩 실행

```bash
openclaw onboard --install-daemon
```

안내에 따릅니다. 온보딩이 완료되면 대시보드 URL과 토큰을 복사합니다.

## Gateway 시작

Box 네트워크에 맞게 Gateway를 구성하고 백그라운드에서 시작합니다.

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

SSH 터널이 활성화된 상태에서 로컬로 대시보드 URL을 엽니다.

```text
http://127.0.0.1:18789/#token=<your-token>
```

## 자동 재시작

Box가 시작될 때 Gateway도 다시 시작되도록 다음 명령을 Box 초기화 스크립트로 설정합니다.

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## 문제 해결

온보딩 중 SSH가 멈추면 초기화된 SSH 구성과 keepalive 옵션을 사용하여 다시 연결합니다.

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

이 명령은 오래된 로컬 `~/.ssh/config` 설정을 우회하고 네트워크가 유휴 상태인 동안에도 터널을 활성 상태로 유지합니다.

## 관련 문서

- [원격 액세스](/ko/gateway/remote)
- [Gateway 보안](/ko/gateway/security)
- [OpenClaw 업데이트](/ko/install/updating)
