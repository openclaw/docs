---
read_when:
    - Gateway용 저렴한 상시 가동 Linux 호스트가 필요한 경우
    - 자체 VPS를 운영하지 않고 원격 제어 UI 액세스가 필요합니다
summary: 원격 액세스를 위해 exe.dev(VM + HTTPS 프록시)에서 OpenClaw Gateway 실행하기
title: exe.dev
x-i18n:
    generated_at: "2026-04-30T06:37:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b571f9b29bb2cca0f311db4188c922b2f70ee91cb48b233cf9922e57a7f05340
    source_path: install/exe-dev.md
    workflow: 16
---

목표: exe.dev VM에서 실행되는 OpenClaw Gateway를 노트북에서 `https://<vm-name>.exe.xyz`로 접속할 수 있게 하기

이 페이지는 exe.dev의 기본 **exeuntu** 이미지를 가정합니다. 다른 배포판을 선택했다면 패키지를 그에 맞게 매핑하세요.

## 초보자 빠른 경로

1. [https://exe.new/openclaw](https://exe.new/openclaw)
2. 필요에 따라 인증 키/토큰을 입력합니다
3. VM 옆의 "Agent"를 클릭하고 Shelley가 프로비저닝을 완료할 때까지 기다립니다
4. `https://<vm-name>.exe.xyz/`를 열고 구성된 공유 비밀로 인증합니다. 이 가이드는 기본적으로 토큰 인증을 사용하지만, `gateway.auth.mode`를 전환하면 비밀번호 인증도 작동합니다
5. `openclaw devices approve <requestId>`로 대기 중인 기기 페어링 요청을 승인합니다

## 필요한 것

- exe.dev 계정
- [exe.dev](https://exe.dev) 가상 머신에 대한 `ssh exe.dev` 접근 권한(선택 사항)

## Shelley를 사용한 자동 설치

[exe.dev](https://exe.dev)의 에이전트인 Shelley는 우리의 프롬프트로 OpenClaw를 즉시 설치할 수 있습니다. 사용되는 프롬프트는 아래와 같습니다.

```
Set up OpenClaw (https://docs.openclaw.ai/install) on this VM. Use the non-interactive and accept-risk flags for openclaw onboarding. Add the supplied auth or token as needed. Configure nginx to forward from the default port 18789 to the root location on the default enabled site config, making sure to enable Websocket support. Pairing is done by "openclaw devices list" and "openclaw devices approve <request id>". Make sure the dashboard shows that OpenClaw's health is OK. exe.dev handles forwarding from port 8000 to port 80/443 and HTTPS for us, so the final "reachable" should be <vm-name>.exe.xyz, without port specification.
```

## 수동 설치

## 1) VM 생성

사용 중인 기기에서:

```bash
ssh exe.dev new
```

그런 다음 연결합니다.

```bash
ssh <vm-name>.exe.xyz
```

<Tip>
이 VM을 **상태 유지형**으로 유지하세요. OpenClaw는 `~/.openclaw/` 아래에 `openclaw.json`, 에이전트별 `auth-profiles.json`, 세션, 채널/프로바이더 상태를 저장하고, 작업 공간은 `~/.openclaw/workspace/` 아래에 저장합니다.
</Tip>

## 2) 필수 구성 요소 설치(VM에서)

```bash
sudo apt-get update
sudo apt-get install -y git curl jq ca-certificates openssl
```

## 3) OpenClaw 설치

OpenClaw 설치 스크립트를 실행합니다.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

## 4) nginx를 설정해 OpenClaw를 포트 8000으로 프록시

`/etc/nginx/sites-enabled/default`를 다음으로 편집합니다.

```
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    listen 8000;
    listen [::]:8000;

    server_name _;

    location / {
        proxy_pass http://127.0.0.1:18789;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout settings for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

클라이언트가 제공한 체인을 보존하는 대신 전달 헤더를 덮어쓰세요.
OpenClaw는 명시적으로 구성된 프록시에서 온 전달 IP 메타데이터만 신뢰하며,
append 방식의 `X-Forwarded-For` 체인은 강화 위험으로 취급됩니다.

## 5) OpenClaw 접속 및 권한 부여

`https://<vm-name>.exe.xyz/`에 접속합니다(온보딩의 Control UI 출력을 참조). 인증을 요청하면 VM에서 구성된 공유 비밀을 붙여넣으세요. 이 가이드는 토큰 인증을 사용하므로 `openclaw config get gateway.auth.token`으로 `gateway.auth.token`을 가져옵니다(또는 `openclaw doctor --generate-gateway-token`으로 생성합니다).
Gateway를 비밀번호 인증으로 변경했다면 대신 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 사용하세요.
`openclaw devices list`와 `openclaw devices approve <requestId>`로 기기를 승인합니다. 확실하지 않다면 브라우저에서 Shelley를 사용하세요!

## 원격 채널 설정

원격 호스트에서는 여러 번의 SSH 호출로 `config set`을 실행하기보다 한 번의 `config patch` 호출을 선호하세요. 실제 토큰은 VM 환경 또는 `~/.openclaw/.env`에 보관하고, `openclaw.json`에는 SecretRefs만 넣으세요.

VM에서 서비스 환경에 필요한 비밀이 포함되도록 합니다.

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

로컬 머신에서 패치 파일을 만들고 VM으로 파이프합니다.

```json5
// openclaw.remote.patch.json5
{
  secrets: {
    providers: {
      default: { source: "env" },
    },
  },
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      groupPolicy: "open",
      requireMention: false,
    },
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
      dmPolicy: "disabled",
      dm: { enabled: false },
      groupPolicy: "allowlist",
    },
  },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
      models: {
        "openai/gpt-5.5": { params: { fastMode: true } },
      },
    },
  },
}
```

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --dry-run' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin' < ./openclaw.remote.patch.json5
ssh <vm-name>.exe.xyz 'openclaw gateway restart && openclaw health'
```

중첩 allowlist를 패치 값과 정확히 같게 만들어야 할 때, 예를 들어 Discord 채널 allowlist를 교체할 때는 `--replace-path`를 사용하세요.

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

## 원격 접근

원격 접근은 [exe.dev](https://exe.dev)의 인증이 처리합니다. 기본적으로 포트 8000의 HTTP 트래픽은 이메일 인증을 사용해 `https://<vm-name>.exe.xyz`로 전달됩니다.

## 업데이트

```bash
npm i -g openclaw@latest
openclaw doctor
openclaw gateway restart
openclaw health
```

가이드: [업데이트](/ko/install/updating)

## 관련 항목

- [원격 Gateway](/ko/gateway/remote)
- [설치 개요](/ko/install)
