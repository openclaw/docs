---
read_when:
    - EasyRunner에 OpenClaw 배포하기
    - EasyRunner의 Caddy 프록시 뒤에서 Gateway 실행하기
    - 호스팅된 Gateway의 영구 볼륨 및 인증 선택하기
summary: Podman과 Caddy를 사용하여 EasyRunner에서 OpenClaw Gateway 실행하기
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T15:29:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner는 Caddy 프록시 뒤에서 OpenClaw Gateway를 소규모 컨테이너화된 앱으로 호스팅합니다. 이 가이드에서는 Podman 호환 Compose 앱을 실행하고 Caddy를 통해 HTTPS를 종료하는 EasyRunner 호스트를 사용한다고 가정합니다.

## 시작하기 전에

- 도메인이 라우팅된 EasyRunner 서버.
- 공식 OpenClaw 이미지(`ghcr.io/openclaw/openclaw`) 또는 직접 빌드한 이미지.
- `/home/node/.openclaw`용 영구 구성 볼륨.
- `/home/node/.openclaw/workspace`용 영구 작업 공간 볼륨.
- 강력한 Gateway 토큰 또는 비밀번호.

가능하면 기기 인증을 활성화된 상태로 유지하십시오. 리버스 프록시가 기기 ID를 올바르게 전달할 수 없다면 먼저 신뢰할 수 있는 프록시 설정을 수정하십시오([신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조). 위험한 인증 우회는 운영자가 제어하는 완전한 사설 네트워크에서만 사용하십시오.

## Compose 앱

다음과 같은 형태의 Compose 파일을 사용하여 EasyRunner 앱을 생성하십시오.

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

`openclaw.example.com`을 Gateway 호스트 이름으로 바꾸십시오. `OPENCLAW_GATEWAY_TOKEN`을 앱 정의에 커밋하지 말고 EasyRunner의 보안 비밀/환경 관리자에 저장하십시오. 이미지는 기본적으로 루프백에 바인딩되므로 Caddy가 컨테이너에 접근하려면 `command`에 명시적인 `--bind lan --port 1455`가 필요합니다.

## OpenClaw 구성

영구 구성 볼륨 내에서 Gateway가 프록시를 통해서만 접근 가능하도록 유지하고 인증을 요구하십시오.

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

Caddy가 Gateway의 TLS를 종료하는 경우 인증 검사를 전역적으로 비활성화하지 말고 정확한 프록시 경로에 대해 신뢰할 수 있는 프록시 설정을 구성하십시오. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하십시오.

## 확인

워크스테이션에서 다음을 실행하십시오.

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

EasyRunner 호스트에서 `GET /healthz`(활성 상태) 및 `GET /readyz`(준비 상태)는 인증이 필요하지 않으며 이미지에 내장된 컨테이너 상태 확인을 지원합니다. 또한 앱 로그에서 Gateway가 수신 대기 중인지 확인하고, 시작 시 SecretRef, Plugin 또는 채널 인증 오류가 없는지 확인하십시오.

## 업데이트 및 백업

- 새 OpenClaw 이미지를 가져오거나 빌드한 후 EasyRunner 앱을 다시 배포하십시오.
- 업데이트 전에 `openclaw-config` 볼륨을 백업하십시오. 이 볼륨에는 `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` 및 설치된 Plugin 패키지 상태가 저장됩니다.
- 에이전트가 `openclaw-workspace`에 영구 프로젝트 데이터를 기록하는 경우 해당 볼륨을 백업하십시오.
- 주요 업데이트 후 `openclaw doctor`를 실행하여 구성 마이그레이션과 서비스 경고를 확인하십시오.

## 문제 해결

- `gateway probe`가 연결할 수 없음: Caddy 호스트 이름이 앱을 가리키고 있으며 컨테이너가 `0.0.0.0:1455`에서 수신 대기하는지 확인하십시오.
- 인증 실패: EasyRunner 보안 비밀의 토큰과 로컬 클라이언트 명령의 토큰을 함께 교체하십시오.
- 복원 후 파일이 root 소유로 표시됨: 이미지는 `node`(uid 1000)로 실행됩니다. 해당 사용자가 `/home/node/.openclaw` 및 `/home/node/.openclaw/workspace`에 쓸 수 있도록 마운트된 볼륨의 권한을 복구하십시오.
- 브라우저 또는 채널 Plugin 실패: 필요한 외부 바이너리, 외부 네트워크 통신 및 마운트된 자격 증명을 컨테이너 내에서 사용할 수 있는지 확인하십시오.
