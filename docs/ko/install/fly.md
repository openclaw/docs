---
read_when:
    - Fly.io에 OpenClaw 배포하기
    - Fly 볼륨, 비밀 정보 및 최초 실행 구성 설정하기
summary: 영구 스토리지와 HTTPS를 사용하는 OpenClaw의 Fly.io 단계별 배포 가이드
title: Fly.io
x-i18n:
    generated_at: "2026-07-12T00:50:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e2cb4203cdea9db2fa76ed60de01da67d550a75d538895b06732446d0f70e2f4
    source_path: install/fly.md
    workflow: 16
---

**목표:** 영구 스토리지, 자동 HTTPS, Discord/채널 액세스를 지원하는 [Fly.io](https://fly.io) 머신에서 OpenClaw Gateway 실행.

## 필요한 항목

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) 설치
- Fly.io 계정(무료 요금제 사용 가능)
- 모델 인증: 선택한 모델 제공자의 API 키
- 채널 자격 증명: Discord 봇 토큰, Telegram 토큰 등

## 초보자용 빠른 경로

1. 저장소를 복제하고 `fly.toml` 사용자 지정
2. 앱과 볼륨을 생성하고 비밀 값 설정
3. `fly deploy`로 배포
4. SSH로 접속해 구성을 생성하거나 Control UI 사용

<Steps>
  <Step title="Fly 앱 생성">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 원하는 이름 선택
    fly apps create my-openclaw

    # 일반적으로 1GB면 충분함
    fly volumes create openclaw_data --size 1 --region iad
    ```

    가까운 리전을 선택하세요. 일반적인 옵션은 `lhr`(런던), `iad`(버지니아), `sjc`(산호세)입니다.

  </Step>

  <Step title="fly.toml 구성">
    앱 이름과 요구 사항에 맞게 `fly.toml`을 편집하세요. 저장소에서 추적하는 `fly.toml`은 아래에 표시된 공개 템플릿이며, `deploy/fly.private.toml`은 공개 IP가 없는 강화된 변형입니다([비공개 배포](#private-deployment-hardened) 참조).

    ```toml
    app = "my-openclaw"  # 앱 이름
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    OpenClaw Docker 이미지의 진입점은 `tini`이며, 기본적으로 `node openclaw.mjs gateway`를 실행합니다. Fly의 `[processes]`는 `ENTRYPOINT`를 변경하지 않고 Docker의 `CMD`를 대체하므로(여기서는 동일하게 컴파일된 진입점인 `node dist/index.js gateway ...`를 직접 실행함), 프로세스는 계속 `tini` 아래에서 실행됩니다.

    **주요 설정:**

    | 설정                           | 이유                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly 프록시가 Gateway에 연결할 수 있도록 `0.0.0.0`에 바인딩                  |
    | `--allow-unconfigured`         | 구성 파일 없이 시작(나중에 구성 파일 생성)                                 |
    | `internal_port = 3000`         | Fly 상태 검사를 위해 `--port 3000` 또는 `OPENCLAW_GATEWAY_PORT`와 일치해야 함 |
    | `memory = "2048mb"`            | 512MB는 너무 작으며 2GB 권장                                                |
    | `OPENCLAW_STATE_DIR = "/data"` | 볼륨에 상태를 영구 저장                                                     |

  </Step>

  <Step title="비밀 값 설정">
    ```bash
    # 필수: local loopback이 아닌 바인딩에 사용할 Gateway 인증 토큰
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # 모델 제공자 API 키
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # 선택 사항: 기타 제공자
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # 채널 토큰
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    local loopback이 아닌 바인딩(`--bind lan`)에는 유효한 Gateway 인증 경로가 필요합니다. 이 예에서는 `OPENCLAW_GATEWAY_TOKEN`을 사용하지만, `gateway.auth.password` 또는 올바르게 구성된 local loopback이 아닌 신뢰 프록시 배포도 이 요구 사항을 충족합니다. SecretRef 계약은 [비밀 값 관리](/ko/gateway/secrets)를 참조하세요.

    이러한 토큰을 비밀번호처럼 취급하세요. 비밀 값이 `openclaw.json`에 포함되지 않도록 API 키와 토큰은 구성 파일보다 환경 변수/`fly secrets`를 사용하는 것이 좋습니다.

  </Step>

  <Step title="배포">
    ```bash
    fly deploy
    ```

    첫 번째 배포에서는 Docker 이미지를 빌드합니다. 배포 후 확인하세요.

    ```bash
    fly status
    fly logs
    ```

    HTTP/WebSocket 리스너가 준비되면 Gateway 시작 로그에 `gateway ready`가 기록됩니다. Fly 자체의 상태 검사는 `fly.toml`에 따라 `internal_port = 3000`을 감시합니다. 이미지의 Docker `HEALTHCHECK` 지시문은 기본 포트 18789의 `/healthz`도 폴링하지만, 이 배포에서는 Gateway 포트를 `--port 3000`으로 재정의하므로 사용되지 않습니다.

  </Step>

  <Step title="구성 파일 생성">
    적절한 구성을 생성하려면 머신에 SSH로 접속하세요.

    ```bash
    fly ssh console
    ```

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    `OPENCLAW_STATE_DIR=/data`를 사용하면 구성 경로는 `/data/openclaw.json`입니다.

    `https://my-openclaw.fly.dev`를 실제 Fly 앱 출처로 바꾸세요. Gateway 시작 시 런타임의 `--bind` 및 `--port` 값에서 로컬 Control UI 출처를 초기화하므로 구성이 존재하기 전에도 첫 부팅을 진행할 수 있지만, Fly를 통한 브라우저 액세스에는 여전히 `gateway.controlUi.allowedOrigins`에 정확한 HTTPS 출처가 나열되어 있어야 합니다.

    Discord 토큰은 다음 중 하나에서 가져올 수 있습니다.

    - 환경 변수 `DISCORD_BOT_TOKEN`(비밀 값에 권장). 구성에 추가할 필요 없이 Gateway가 자동으로 읽음
    - 구성 파일의 `channels.discord.token`

    적용하려면 다시 시작하세요.

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway 액세스">
    ### Control UI

    ```bash
    fly open
    ```

    또는 `https://my-openclaw.fly.dev/`에 방문하세요.

    구성된 공유 비밀 값으로 인증하세요. `OPENCLAW_GATEWAY_TOKEN`의 Gateway 토큰을 사용하거나, 비밀번호 인증으로 전환했다면 비밀번호를 사용합니다.

    ### 로그

    ```bash
    fly logs              # 실시간 로그
    fly logs --no-tail    # 최근 로그
    ```

    ### SSH 콘솔

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 문제 해결

### "앱이 예상 주소에서 수신 대기하지 않음"

Gateway가 `0.0.0.0` 대신 `127.0.0.1`에 바인딩되고 있습니다.

**해결 방법:** `fly.toml`의 프로세스 명령에 `--bind lan`을 추가하세요.

### 상태 검사 실패/연결 거부

Fly가 구성된 포트에서 Gateway에 연결할 수 없습니다.

**해결 방법:** `internal_port`가 Gateway 포트(`--port 3000` 또는 `OPENCLAW_GATEWAY_PORT=3000`)와 일치하는지 확인하세요.

### OOM/메모리 문제

컨테이너가 계속 다시 시작되거나 종료됩니다. 징후로는 `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` 또는 별다른 메시지 없는 재시작이 있습니다.

**해결 방법:** `fly.toml`에서 메모리를 늘리세요.

```toml
[[vm]]
  memory = "2048mb"
```

또는 기존 머신을 업데이트하세요.

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

512MB는 너무 작습니다. 1GB도 작동할 수 있지만 부하가 있거나 상세 로깅을 사용할 때 OOM이 발생할 수 있습니다. 2GB를 권장합니다.

### Gateway 잠금 문제

컨테이너를 다시 시작한 후 "이미 실행 중" 오류와 함께 Gateway가 시작을 거부합니다.

단일 인스턴스 잠금 파일은 영구 `/data` 볼륨이 아니라 `<tmpdir>/openclaw-<uid>/gateway.<hash>.lock`(Linux: `/tmp/openclaw-<uid>/gateway.<hash>.lock`)에 있으므로, 일반적으로 컨테이너를 완전히 다시 시작하면 컨테이너 파일 시스템의 나머지 부분과 함께 삭제됩니다. 잠금이 남아 시작을 차단하는 경우(예: 컨테이너 파일 시스템을 보존하는 `fly machine restart`) 수동으로 제거하세요.

```bash
fly ssh console --command "rm -f /tmp/openclaw-*/gateway.*.lock"
fly machine restart <machine-id>
```

### 구성을 읽지 못함

`--allow-unconfigured`는 시작 보호 절차만 우회합니다. `/data/openclaw.json`을 생성하거나 복구하지 않으므로, 실제 구성이 존재하며 정상적인 로컬 Gateway 시작을 위한 `"gateway": { "mode": "local" }`을 포함하는지 확인하세요.

구성이 존재하는지 확인하세요.

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH를 통한 구성 작성

`fly ssh console -C`는 셸 리디렉션을 지원하지 않습니다. 구성 파일을 작성하려면 다음을 사용하세요.

```bash
# echo + tee(로컬에서 원격으로 파이프)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 또는 sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

파일이 이미 존재하면 `fly sftp`가 실패할 수 있습니다. 먼저 삭제하세요.

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 상태가 영구 저장되지 않음

다시 시작한 후 인증 프로필, 채널/제공자 상태 또는 세션이 사라진다면 상태 디렉터리가 볼륨이 아닌 컨테이너 파일 시스템에 기록되고 있는 것입니다.

**해결 방법:** `fly.toml`에 `OPENCLAW_STATE_DIR=/data`가 설정되어 있는지 확인하고 다시 배포하세요.

## 업데이트

```bash
git pull
fly deploy
fly status
fly logs
```

여기서는 `git pull` + `fly deploy`가 관리형 경로입니다. Dockerfile에서 이미지를 다시 빌드하므로 CLI/Gateway 버전, 기본 OS 이미지 및 모든 Dockerfile 변경 사항이 함께 업데이트됩니다. 실행 중인 컨테이너 내부에서 `openclaw update`를 실행하는 것은 같은 작업이 아닙니다. 이미지는 `.git` 체크아웃이 없고 감지할 npm 관리 전역 설치도 없는 Docker 빌드 `dist/` 트리로 제공되기 때문입니다. VM 방식 설치의 해당 흐름은 [업데이트](/ko/install/updating)를 참조하세요.

### 머신 명령 업데이트

전체 재배포 없이 시작 명령을 변경하려면 다음을 실행하세요.

```bash
fly machines list
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 또는 메모리 증가와 함께
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

나중에 `fly deploy`를 실행하면 머신 명령이 `fly.toml`에 있는 내용으로 다시 설정됩니다. 재배포 후 수동 변경 사항을 다시 적용하세요.

## 비공개 배포(강화)

기본적으로 Fly는 공개 IP를 할당하므로 Gateway는 `https://your-app.fly.dev`에서 접근할 수 있으며 인터넷 스캐너(Shodan, Censys 등)에 노출됩니다.

**공개 IP가 없는** 강화된 배포에는 `deploy/fly.private.toml`을 사용하세요. 이 파일에는 `[http_service]`가 없으므로 공개 인그레스가 할당되지 않습니다.

### 비공개 배포를 사용해야 하는 경우

- 아웃바운드 호출/메시지만 사용(인바운드 Webhook 없음)
- ngrok 또는 Tailscale 터널이 모든 Webhook 콜백을 처리
- 브라우저 대신 SSH, 프록시 또는 WireGuard를 통해 Gateway에 액세스
- 인터넷 스캐너에 배포를 노출하지 않아야 함

### 설정

```bash
fly deploy -c deploy/fly.private.toml
```

또는 기존 배포를 변환하세요.

```bash
# 현재 IP 목록 표시
fly ips list -a my-openclaw

# 공개 IP 해제
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 향후 배포에서 공개 IP를 다시 할당하지 않도록 비공개 구성으로 전환
fly deploy -c deploy/fly.private.toml

# 비공개 전용 IPv6 할당
fly ips allocate-v6 --private -a my-openclaw
```

이후 `fly ips list`에는 `private` 유형 IP만 표시되어야 합니다.

```text
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 비공개 배포에 액세스하기

**옵션 1: 로컬 프록시(가장 간단함)**

```bash
fly proxy 3000:3000 -a my-openclaw
# 브라우저에서 http://localhost:3000 열기
```

**옵션 2: WireGuard VPN**

```bash
fly wireguard create
# WireGuard 클라이언트로 가져온 후 내부 IPv6를 통해 액세스
# 예: http://[fdaa:x:x:x:x::x]:3000
```

**옵션 3: SSH만 사용**

```bash
fly ssh console -a my-openclaw
```

### 비공개 배포에서 Webhook 사용하기

공개 노출 없이 Webhook 콜백(Twilio, Telnyx 등)을 사용하려면 다음 방법 중 하나를 사용하세요.

1. **ngrok 터널**: 컨테이너 내부 또는 사이드카로 ngrok을 실행합니다.
2. **Tailscale Funnel**: Tailscale을 통해 특정 경로를 노출합니다.
3. **아웃바운드 전용**: 일부 제공업체(Twilio)는 Webhook 없이 아웃바운드 통화를 지원합니다.

`plugins.entries.voice-call.config` 아래에 설정하는 ngrok 음성 통화 구성 예시는 다음과 같습니다.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

ngrok 터널은 컨테이너 내부에서 실행되며 Fly 앱 자체를 노출하지 않고 공개 Webhook URL을 제공합니다. 전달된 호스트 헤더가 허용되도록 `webhookSecurity.allowedHosts`를 터널 호스트 이름으로 설정하세요.

### 보안 절충점

| 측면              | 공개         | 비공개       |
| ----------------- | ------------ | ------------ |
| 인터넷 스캐너     | 검색 가능    | 숨김         |
| 직접 공격         | 가능         | 차단됨       |
| 제어 UI 액세스    | 브라우저     | 프록시/VPN   |
| Webhook 전달      | 직접         | 터널 경유    |

## 참고 사항

- Fly.io는 x86 아키텍처를 사용하며 Dockerfile은 x86과 ARM 모두와 호환됩니다.
- WhatsApp/Telegram 온보딩에는 `fly ssh console`을 사용하세요.
- 영구 데이터는 `/data`의 볼륨에 저장됩니다.
- Signal을 사용하려면 이미지에 signal-cli(Java 기반 CLI)가 필요합니다. 사용자 지정 이미지를 사용하고 메모리를 2GB 이상으로 유지하세요.

## 비용

권장 구성(`shared-cpu-2x`, 2GB RAM)을 사용하면 사용량에 따라 월 약 10~15달러가 소요되며, 무료 등급에서 일부 기본 할당량을 제공합니다. 현재 요금은 [Fly.io 요금](https://fly.io/docs/about/pricing/)을 참조하세요.

## 다음 단계

- 메시징 채널 설정: [채널](/ko/channels)
- Gateway 구성: [Gateway 구성](/ko/gateway/configuration)
- OpenClaw를 최신 상태로 유지: [업데이트](/ko/install/updating)

## 관련 문서

- [설치 개요](/ko/install)
- [Hetzner](/ko/install/hetzner)
- [Docker](/ko/install/docker)
- [VPS 호스팅](/ko/vps)
