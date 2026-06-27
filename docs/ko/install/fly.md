---
read_when:
    - Fly.io에 OpenClaw 배포하기
    - Fly 볼륨, 시크릿 및 최초 실행 구성 설정하기
summary: OpenClaw용 영구 스토리지 및 HTTPS를 갖춘 Fly.io 단계별 배포
title: Fly.io
x-i18n:
    generated_at: "2026-06-27T17:36:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d74dbda6177ab279a59de720cf4e88a15aa90798e5f04e87712c99093282a1e
    source_path: install/fly.md
    workflow: 16
---

**목표:** 영구 스토리지, 자동 HTTPS, Discord/채널 접근을 갖춘 [Fly.io](https://fly.io) 머신에서 OpenClaw Gateway 실행.

## 필요한 것

- [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/) 설치
- Fly.io 계정(무료 티어 사용 가능)
- 모델 인증: 선택한 모델 제공자의 API 키
- 채널 자격 증명: Discord 봇 토큰, Telegram 토큰 등

## 초보자 빠른 경로

1. 저장소 클론 → `fly.toml` 사용자 지정
2. 앱 + 볼륨 생성 → 시크릿 설정
3. `fly deploy`로 배포
4. SSH로 접속해 설정을 만들거나 Control UI 사용

<Steps>
  <Step title="Fly 앱 생성">
    ```bash
    # Clone the repo
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # Create a new Fly app (pick your own name)
    fly apps create my-openclaw

    # Create a persistent volume (1GB is usually enough)
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **팁:** 가까운 리전을 선택하세요. 일반적인 옵션: `lhr`(런던), `iad`(버지니아), `sjc`(산호세).

  </Step>

  <Step title="fly.toml 구성">
    앱 이름과 요구 사항에 맞게 `fly.toml`을 편집하세요.

    **보안 참고:** 기본 설정은 공개 URL을 노출합니다. 공개 IP가 없는 강화된 배포는 [비공개 배포](#private-deployment-hardened)를 보거나 `deploy/fly.private.toml`을 사용하세요.

    ```toml
    app = "my-openclaw"  # Your app name
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

    OpenClaw Docker 이미지는 `tini`를 엔트리포인트로 사용합니다. Fly 프로세스 명령은 Docker `ENTRYPOINT`를 바꾸지 않고 `CMD`만 대체하므로, 프로세스는 여전히 `tini` 아래에서 실행됩니다.

    **핵심 설정:**

    | 설정                           | 이유                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | Fly의 프록시가 Gateway에 도달할 수 있도록 `0.0.0.0`에 바인딩합니다          |
    | `--allow-unconfigured`         | 설정 파일 없이 시작합니다(나중에 만들 예정)                                 |
    | `internal_port = 3000`         | Fly 상태 확인을 위해 `--port 3000`(또는 `OPENCLAW_GATEWAY_PORT`)과 일치해야 합니다 |
    | `memory = "2048mb"`            | 512MB는 너무 작으며, 2GB를 권장합니다                                       |
    | `OPENCLAW_STATE_DIR = "/data"` | 볼륨에 상태를 영구 저장합니다                                               |

  </Step>

  <Step title="시크릿 설정">
    ```bash
    # Required: Gateway token (for non-loopback binding)
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # Model provider API keys
    fly secrets set ANTHROPIC_API_KEY=example-anthropic-key-not-real

    # Optional: Other providers
    fly secrets set OPENAI_API_KEY=example-openai-key-not-real
    fly secrets set GOOGLE_API_KEY=...

    # Channel tokens
    fly secrets set DISCORD_BOT_TOKEN=example-discord-bot-token
    ```

    **참고:**

    - 비루프백 바인드(`--bind lan`)에는 유효한 Gateway 인증 경로가 필요합니다. 이 Fly.io 예시는 `OPENCLAW_GATEWAY_TOKEN`을 사용하지만, `gateway.auth.password` 또는 올바르게 구성된 비루프백 `trusted-proxy` 배포도 요구 사항을 충족합니다.
    - 이러한 토큰은 비밀번호처럼 취급하세요.
    - 모든 API 키와 토큰에는 **설정 파일보다 환경 변수를 권장**합니다. 이렇게 하면 시크릿이 실수로 노출되거나 로그에 기록될 수 있는 `openclaw.json` 밖에 유지됩니다.

  </Step>

  <Step title="배포">
    ```bash
    fly deploy
    ```

    첫 배포는 Docker 이미지를 빌드합니다(약 2~3분). 이후 배포는 더 빠릅니다.

    배포 후 확인하세요.

    ```bash
    fly status
    fly logs
    ```

    다음이 표시되어야 합니다.

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="설정 파일 생성">
    머신에 SSH로 접속해 적절한 설정을 만드세요.

    ```bash
    fly ssh console
    ```

    설정 디렉터리와 파일을 만드세요.

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

    **참고:** `OPENCLAW_STATE_DIR=/data`를 사용하면 설정 경로는 `/data/openclaw.json`입니다.

    **참고:** `https://my-openclaw.fly.dev`를 실제 Fly 앱
    origin으로 바꾸세요. Gateway 시작 시 런타임 `--bind` 및 `--port`
    값에서 로컬 Control UI origin을 시드하므로 설정이 없더라도 첫 부팅은
    진행될 수 있지만, Fly를 통한 브라우저 접근에는
    `gateway.controlUi.allowedOrigins`에 정확한 HTTPS origin이 여전히 필요합니다.

    **참고:** Discord 토큰은 다음 중 하나에서 가져올 수 있습니다.

    - 환경 변수: `DISCORD_BOT_TOKEN`(시크릿에 권장)
    - 설정 파일: `channels.discord.token`

    환경 변수를 사용하는 경우 설정에 토큰을 추가할 필요가 없습니다. Gateway는 `DISCORD_BOT_TOKEN`을 자동으로 읽습니다.

    적용하려면 재시작하세요.

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="Gateway 접근">
    ### Control UI

    브라우저에서 여세요.

    ```bash
    fly open
    ```

    또는 `https://my-openclaw.fly.dev/`를 방문하세요.

    구성된 공유 시크릿으로 인증하세요. 이 가이드는
    `OPENCLAW_GATEWAY_TOKEN`의 Gateway 토큰을 사용합니다. 비밀번호 인증으로
    전환했다면 대신 해당 비밀번호를 사용하세요.

    ### 로그

    ```bash
    fly logs              # Live logs
    fly logs --no-tail    # Recent logs
    ```

    ### SSH 콘솔

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 문제 해결

### "앱이 예상 주소에서 수신 대기하지 않음"

Gateway가 `0.0.0.0` 대신 `127.0.0.1`에 바인딩하고 있습니다.

**해결:** `fly.toml`의 프로세스 명령에 `--bind lan`을 추가하세요.

### 상태 확인 실패 / 연결 거부

Fly가 구성된 포트에서 Gateway에 도달할 수 없습니다.

**해결:** `internal_port`가 Gateway 포트와 일치하는지 확인하세요(`--port 3000` 또는 `OPENCLAW_GATEWAY_PORT=3000` 설정).

### OOM / 메모리 문제

컨테이너가 계속 재시작되거나 종료됩니다. 징후: `SIGABRT`, `v8::internal::Runtime_AllocateInYoungGeneration` 또는 조용한 재시작.

**해결:** `fly.toml`에서 메모리를 늘리세요.

```toml
[[vm]]
  memory = "2048mb"
```

또는 기존 머신을 업데이트하세요.

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**참고:** 512MB는 너무 작습니다. 1GB도 동작할 수 있지만 부하가 있거나 상세 로깅을 사용할 때 OOM이 발생할 수 있습니다. **2GB를 권장합니다.**

### Gateway 잠금 문제

Gateway가 "already running" 오류와 함께 시작을 거부합니다.

컨테이너가 재시작되었지만 PID 잠금 파일이 볼륨에 남아 있을 때 발생합니다.

**해결:** 잠금 파일을 삭제하세요.

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

잠금 파일은 하위 디렉터리가 아닌 `/data/gateway.*.lock`에 있습니다.

### 설정을 읽지 못함

`--allow-unconfigured`는 시작 가드만 우회합니다. `/data/openclaw.json`을 만들거나 복구하지 않으므로, 일반적인 로컬 Gateway 시작을 원할 때 실제 설정이 존재하고 `gateway.mode="local"`을 포함하는지 확인하세요.

설정이 있는지 확인하세요.

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### SSH로 설정 쓰기

`fly ssh console -C` 명령은 셸 리디렉션을 지원하지 않습니다. 설정 파일을 쓰려면:

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**참고:** 파일이 이미 있으면 `fly sftp`가 실패할 수 있습니다. 먼저 삭제하세요.

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 상태가 영구 저장되지 않음

재시작 후 인증 프로필, 채널/제공자 상태 또는 세션이 사라진다면
상태 디렉터리가 컨테이너 파일시스템에 쓰이고 있는 것입니다.

**해결:** `fly.toml`에 `OPENCLAW_STATE_DIR=/data`가 설정되어 있는지 확인하고 다시 배포하세요.

## 업데이트

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### 머신 명령 업데이트

전체 재배포 없이 시작 명령을 변경해야 하는 경우:

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**참고:** `fly deploy` 후에는 머신 명령이 `fly.toml`의 내용으로 재설정될 수 있습니다. 수동 변경을 했다면 배포 후 다시 적용하세요.

## 비공개 배포(강화)

기본적으로 Fly는 공개 IP를 할당하여 Gateway를 `https://your-app.fly.dev`에서 접근할 수 있게 합니다. 이는 편리하지만 배포가 인터넷 스캐너(Shodan, Censys 등)에 발견될 수 있음을 의미합니다.

**공개 노출이 없는** 강화된 배포에는 비공개 템플릿을 사용하세요.

### 비공개 배포를 사용할 때

- **아웃바운드** 호출/메시지만 보냅니다(인바운드 Webhook 없음)
- Webhook 콜백에 **ngrok 또는 Tailscale** 터널을 사용합니다
- 브라우저 대신 **SSH, 프록시 또는 WireGuard**로 Gateway에 접근합니다
- 배포를 **인터넷 스캐너로부터 숨기고** 싶습니다

### 설정

표준 설정 대신 `deploy/fly.private.toml`을 사용하세요.

```bash
# Deploy with private config
fly deploy -c deploy/fly.private.toml
```

또는 기존 배포를 변환하세요.

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c deploy/fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

이후 `fly ips list`에는 `private` 유형 IP만 표시되어야 합니다.

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 비공개 배포 접근

공개 URL이 없으므로 다음 방법 중 하나를 사용하세요.

**옵션 1: 로컬 프록시(가장 간단함)**

```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**옵션 2: WireGuard VPN**

```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**옵션 3: SSH만 사용**

```bash
fly ssh console -a my-openclaw
```

### 비공개 배포에서 Webhook 사용

공개 노출 없이 Webhook 콜백(Twilio, Telnyx 등)이 필요한 경우:

1. **ngrok 터널** - 컨테이너 내부 또는 사이드카로 ngrok 실행
2. **Tailscale Funnel** - Tailscale을 통해 특정 경로 노출
3. **아웃바운드 전용** - 일부 제공업체(Twilio)는 Webhook 없이도 아웃바운드 호출이 정상 작동합니다

ngrok을 사용한 음성 통화 설정 예시:

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

ngrok 터널은 컨테이너 내부에서 실행되며 Fly 앱 자체를 노출하지 않고 공개 Webhook URL을 제공합니다. 전달된 호스트 헤더가 허용되도록 `webhookSecurity.allowedHosts`를 공개 터널 호스트 이름으로 설정하세요.

### 보안 이점

| 측면              | 공개         | 비공개     |
| ----------------- | ------------ | ---------- |
| 인터넷 스캐너     | 발견 가능    | 숨김       |
| 직접 공격         | 가능         | 차단됨     |
| Control UI 액세스 | 브라우저     | 프록시/VPN |
| Webhook 전달      | 직접         | 터널 경유  |

## 참고

- Fly.io는 **x86 아키텍처**를 사용합니다(ARM 아님)
- Dockerfile은 두 아키텍처 모두와 호환됩니다
- WhatsApp/Telegram 온보딩에는 `fly ssh console`을 사용하세요
- 영구 데이터는 `/data`의 볼륨에 저장됩니다
- Signal에는 Java + signal-cli가 필요합니다. 사용자 지정 이미지를 사용하고 메모리는 2GB 이상으로 유지하세요.

## 비용

권장 설정(`shared-cpu-2x`, 2GB RAM)을 사용하는 경우:

- 사용량에 따라 월 약 $10-15
- 무료 티어에는 일부 허용량이 포함됩니다

자세한 내용은 [Fly.io 가격](https://fly.io/docs/about/pricing/)을 참고하세요.

## 다음 단계

- 메시징 채널 설정: [채널](/ko/channels)
- Gateway 설정: [Gateway 설정](/ko/gateway/configuration)
- OpenClaw를 최신 상태로 유지: [업데이트](/ko/install/updating)

## 관련 항목

- [설치 개요](/ko/install)
- [Hetzner](/ko/install/hetzner)
- [Docker](/ko/install/docker)
- [VPS 호스팅](/ko/vps)
