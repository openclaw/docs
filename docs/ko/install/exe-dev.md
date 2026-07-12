---
read_when:
    - Gateway를 위한 저렴한 상시 가동 Linux 호스트가 필요합니다
    - 자체 VPS를 운영하지 않고 원격 Control UI에 액세스하려는 경우
summary: 원격 액세스를 위해 exe.dev(VM + HTTPS 프록시)에서 OpenClaw Gateway 실행하기
title: exe.dev
x-i18n:
    generated_at: "2026-07-12T15:23:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a768511d2d7e4e4ec10bcdae83684417bde05286468b0534200f8dd5ec015f7b
    source_path: install/exe-dev.md
    workflow: 16
---

**목표:** [exe.dev](https://exe.dev) VM에서 OpenClaw Gateway를 실행하고 `https://<vm-name>.exe.xyz`에서 접속할 수 있도록 합니다.

이 가이드에서는 exe.dev의 기본 **exeuntu** 이미지를 사용한다고 가정합니다. 다른 배포판에서는 패키지를 해당 환경에 맞게 변경하십시오.

## 필요한 항목

- exe.dev 계정
- exe.dev VM에 대한 `ssh exe.dev` 액세스(수동 설정 시 선택 사항)

## 초보자를 위한 빠른 경로

1. [https://exe.new/openclaw](https://exe.new/openclaw)을 엽니다.
2. 필요에 따라 인증 키/토큰을 입력합니다.
3. VM 옆의 "Agent"를 클릭하고 Shelley가 프로비저닝을 완료할 때까지 기다립니다.
4. `https://<vm-name>.exe.xyz/`을 열고 구성된 공유 비밀로 인증합니다(기본값은 토큰 인증이며, `gateway.auth.mode`를 전환하면 비밀번호 인증도 사용할 수 있습니다).
5. `openclaw devices approve <requestId>`로 대기 중인 기기 페어링 요청을 승인합니다.

## Shelley를 사용한 자동 설치

exe.dev의 에이전트인 Shelley는 프롬프트를 통해 OpenClaw를 설치할 수 있습니다.

```text
이 VM에 OpenClaw(https://docs.openclaw.ai/install)를 설정하십시오. OpenClaw 온보딩에는 비대화형 플래그와 위험 수락 플래그를 사용하십시오. 필요에 따라 제공된 인증 정보 또는 토큰을 추가하십시오. 기본 활성화 사이트 구성에서 기본 포트 18789의 요청을 루트 위치로 전달하도록 nginx를 구성하고 WebSocket 지원을 활성화해야 합니다. 페어링은 "openclaw devices list" 및 "openclaw devices approve <request id>"로 수행합니다. 대시보드에 OpenClaw의 상태가 정상으로 표시되는지 확인하십시오. exe.dev가 포트 8000에서 포트 80/443으로의 전달과 HTTPS를 처리하므로 최종 "접속 가능" 주소는 포트 지정 없이 <vm-name>.exe.xyz여야 합니다.
```

## 수동 설치

<Steps>
  <Step title="VM 생성">
    기기에서 다음을 실행합니다.

    ```bash
    ssh exe.dev new
    ```

    그런 다음 연결합니다.

    ```bash
    ssh <vm-name>.exe.xyz
    ```

    <Tip>
    이 VM을 **상태 유지형**으로 유지하십시오. OpenClaw는 `openclaw.json`, 에이전트별 `auth-profiles.json`, 세션 및 채널/제공자 상태를 `~/.openclaw/` 아래에 저장하며, 워크스페이스는 `~/.openclaw/workspace/` 아래에 저장합니다.
    </Tip>

  </Step>

  <Step title="필수 구성 요소 설치(VM에서)">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl jq ca-certificates openssl
    ```
  </Step>

  <Step title="OpenClaw 설치">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="포트 8000으로 프록시하도록 nginx 구성">
    `/etc/nginx/sites-enabled/default`를 편집합니다.

    ```nginx
    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        listen 8000;
        listen [::]:8000;

        server_name _;

        location / {
            proxy_pass http://127.0.0.1:18789;
            proxy_http_version 1.1;

            # WebSocket 지원
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            # 표준 프록시 헤더
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $remote_addr;
            proxy_set_header X-Forwarded-Proto $scheme;

            # 장기 연결을 위한 시간 제한 설정
            proxy_read_timeout 86400s;
            proxy_send_timeout 86400s;
        }
    }
    ```

    클라이언트가 제공한 체인을 보존하지 말고 전달 헤더를 덮어쓰십시오. OpenClaw는 명시적으로 구성된 프록시의 전달된 IP 메타데이터만 신뢰하며, 추가 방식의 `X-Forwarded-For` 체인은 보안 강화 위험으로 간주합니다.

  </Step>

  <Step title="OpenClaw에 액세스하고 기기 승인">
    `https://<vm-name>.exe.xyz/`을 엽니다(온보딩의 Control UI 출력을 참조하십시오). 인증을 요구하면 VM에 구성된 공유 비밀을 붙여 넣습니다.

    이 가이드에서는 기본적으로 토큰 인증을 사용하므로 `openclaw config get gateway.auth.token`으로 `gateway.auth.token`을 가져오거나 `openclaw doctor --n`으로 새 토큰을 생성하십시오. Gateway를 비밀번호 인증으로 전환한 경우에는 대신 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 사용하십시오.

    `openclaw devices list`와 `openclaw devices approve <requestId>`로 기기를 승인합니다. 확실하지 않은 경우 브라우저에서 Shelley를 사용하십시오.

  </Step>
</Steps>

## 원격 채널 설정

원격 호스트에서는 `config set`을 위한 여러 SSH 호출보다 하나의 `config patch` 호출을 사용하는 것이 좋습니다. 실제 토큰은 VM 환경이나 `~/.openclaw/.env`에 보관하고 `openclaw.json`에는 SecretRef만 넣으십시오. 전체 SecretRef 계약은 [비밀 관리](/ko/gateway/secrets)를 참조하십시오.

VM에서 서비스 환경에 필요한 비밀이 포함되도록 설정합니다.

```bash
cat >> ~/.openclaw/.env <<'EOF'
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
DISCORD_BOT_TOKEN=...
OPENAI_API_KEY=sk-...
EOF
```

로컬 머신에서 패치 파일을 생성하고 VM으로 파이프합니다.

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
      model: { primary: "openai/gpt-5.6-sol" },
      models: {
        "openai/gpt-5.6-sol": { params: { fastMode: true } },
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

중첩된 허용 목록을 패치 값과 정확히 일치시켜야 하는 경우 `--replace-path`를 사용하십시오. 예를 들어 Discord 채널 허용 목록을 교체하려면 다음과 같이 실행합니다.

```bash
ssh <vm-name>.exe.xyz 'openclaw config patch --stdin --replace-path "channels.discord.guilds[\"123\"].channels"' < ./discord.patch.json5
```

전체 채널 구성 참조는 [Discord](/ko/channels/discord) 및 [Slack](/ko/channels/slack)을 참조하십시오.

## 원격 액세스

exe.dev는 원격 액세스 인증을 처리합니다. 기본적으로 포트 8000의 HTTP 트래픽은 이메일 인증과 함께 `https://<vm-name>.exe.xyz`로 전달됩니다.

## 업데이트

```bash
openclaw update
```

채널 전환 및 수동 복구에 대해서는 [업데이트](/ko/install/updating)를 참조하십시오.

## 관련 문서

- [원격 Gateway](/ko/gateway/remote)
- [설치 개요](/ko/install)
