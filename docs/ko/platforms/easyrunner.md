---
read_when:
    - EasyRunner에 OpenClaw 배포하기
    - EasyRunner의 Caddy 프록시 뒤에서 Gateway 실행
    - 호스팅된 Gateway를 위한 영구 볼륨 및 인증 선택
summary: Podman과 Caddy를 사용하여 EasyRunner에서 OpenClaw Gateway 실행
title: EasyRunner
x-i18n:
    generated_at: "2026-06-27T17:39:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b6d67270e1b47ecbd67361edd018b531598d0365e2dacd594cb73c6b74c10478
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner는 Caddy 프록시 뒤에서 작은 컨테이너화된 앱으로 OpenClaw Gateway를 호스팅할 수 있습니다. 이 가이드는 Podman 호환 Compose 앱을 실행하고 Caddy를 통해 HTTPS를 노출하는 EasyRunner 호스트를 가정합니다.

## 시작하기 전에

- 도메인이 라우팅된 EasyRunner 서버.
- 빌드되었거나 게시된 OpenClaw 컨테이너 이미지.
- `/home/node/.openclaw`용 영구 설정 볼륨.
- `/workspace`용 영구 작업 공간 볼륨.
- 강력한 Gateway 토큰 또는 비밀번호.

가능하면 기기 인증을 활성화해 두세요. 리버스 프록시 배포가 기기 ID를 올바르게 전달할 수 없다면 먼저 신뢰할 수 있는 프록시 설정을 수정하세요. 위험한 인증 우회는 완전히 비공개이고 운영자가 제어하는 네트워크에서만 사용하세요.

## Compose 앱

다음과 같은 형태의 Compose 파일로 EasyRunner 앱을 만드세요.

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
      OPENCLAW_WORKSPACE_DIR: /workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["openclaw", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

`openclaw.example.com`을 Gateway 호스트 이름으로 바꾸세요. `OPENCLAW_GATEWAY_TOKEN`은 앱 정의에 커밋하지 말고 EasyRunner의 시크릿/환경 관리자에 저장하세요.

## OpenClaw 구성

영구 설정 볼륨 안에서는 Gateway가 프록시를 통해서만 도달 가능하게 유지하고 인증을 요구하세요.

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

Caddy가 Gateway의 TLS를 종료하는 경우, 인증 검사를 전역으로 비활성화하지 말고 정확한 프록시 경로에 대해 신뢰할 수 있는 프록시 설정을 구성하세요. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하세요.

## 확인

작업용 컴퓨터에서:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

EasyRunner 호스트에서 앱 로그를 확인하여 Gateway가 수신 중이고 시작 시 SecretRef, Plugin 또는 채널 인증 실패가 없는지 확인하세요.

## 업데이트 및 백업

- 새 OpenClaw 이미지를 가져오거나 빌드한 다음 EasyRunner 앱을 다시 배포하세요.
- 업데이트 전에 `openclaw-config` 볼륨을 백업하세요.
- 에이전트가 지속 가능한 프로젝트 데이터를 `openclaw-workspace`에 쓰는 경우 이를 백업하세요.
- 주요 업데이트 후에는 `openclaw doctor`를 실행하여 설정 마이그레이션과 서비스 경고를 확인하세요.

## 문제 해결

- `gateway probe`가 연결할 수 없음: Caddy 호스트 이름이 앱을 가리키고 컨테이너가 `0.0.0.0:1455`에서 수신하는지 확인하세요.
- 인증 실패: EasyRunner 시크릿의 토큰과 로컬 클라이언트 명령을 함께 교체하세요.
- 복원 후 파일이 root 소유임: 컨테이너 사용자가 `/home/node/.openclaw`와 `/workspace`에 쓸 수 있도록 마운트된 볼륨을 수정하세요.
- 브라우저 또는 채널 Plugin 실패: 필요한 외부 바이너리, 네트워크 송신, 마운트된 자격 증명을 컨테이너 내부에서 사용할 수 있는지 확인하세요.
