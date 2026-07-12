---
read_when:
    - Docker를 사용하여 클라우드 VM에 OpenClaw를 배포하고 있습니다
    - 공유 바이너리 빌드, 영속성 및 업데이트 흐름이 필요합니다
summary: 장기 실행 OpenClaw Gateway 호스트를 위한 공유 Docker VM 런타임 단계
title: Docker VM 런타임
x-i18n:
    generated_at: "2026-07-12T00:50:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1c474b1f826077ac03c7aaa1e334ed2f38d2de2770f32f2cc907846ecc8bb19
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

GCP, Hetzner 및 유사한 VPS 제공업체의 VM 기반 Docker 설치에 공통으로 적용되는 런타임 단계입니다.

## 필수 바이너리를 이미지에 포함하기

실행 중인 컨테이너 내부에 바이너리를 설치하면 문제가 발생합니다. 런타임에 설치한 모든 항목은 재시작하면 사라집니다. Skills에 필요한 모든 외부 바이너리를 빌드 시 이미지에 포함하세요.

아래 예시에서는 알파벳순으로 세 가지 바이너리만 다룹니다.

- Gmail 액세스용 `gog`(`gogcli`에서 제공)
- Google Places용 `goplaces`
- WhatsApp용 `wacli`

이는 예시일 뿐이며 전체 목록이 아닙니다. 동일한 패턴을 사용하여 Skills에 필요한 만큼 바이너리를 설치하세요. 나중에 새 바이너리가 필요한 Skills를 추가하는 경우:

1. Dockerfile을 업데이트합니다.
2. 이미지를 다시 빌드합니다.
3. 컨테이너를 재시작합니다.

**Dockerfile 예시**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# Example binary 1: Gmail CLI (gogcli — installs as `gog`)
# Copy the current Linux asset URL from https://github.com/steipete/gogcli/releases
RUN curl -L https://github.com/steipete/gogcli/releases/latest/download/gogcli_linux_amd64.tar.gz \
  | tar -xzO gog > /usr/local/bin/gog; \
  chmod +x /usr/local/bin/gog

# Example binary 2: Google Places CLI
# Copy the current Linux asset URL from https://github.com/steipete/goplaces/releases
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_linux_amd64.tar.gz \
  | tar -xzO goplaces > /usr/local/bin/goplaces; \
  chmod +x /usr/local/bin/goplaces

# Example binary 3: WhatsApp CLI
# Copy the current Linux asset URL from https://github.com/steipete/wacli/releases
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli-linux-amd64.tar.gz \
  | tar -xzO wacli > /usr/local/bin/wacli; \
  chmod +x /usr/local/bin/wacli

# Add more binaries below using the same pattern

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

<Note>
위 URL은 예시입니다. ARM 기반 VM에서는 `arm64` 자산을 선택하세요. 재현 가능한 빌드를 위해 버전이 지정된 릴리스 URL을 고정하세요.
</Note>

## 빌드 및 실행

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile` 실행 중 빌드가 `Killed` 메시지 또는 종료 코드 137과 함께 실패하면 VM의 메모리가 부족한 것입니다. 다시 시도하기 전에 더 큰 머신 클래스를 사용하세요.

바이너리를 확인합니다.

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

예상 출력:

```text
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway가 실행 중인지 확인합니다.

```bash
docker compose logs -f openclaw-gateway
curl -fsS http://127.0.0.1:18789/healthz
```

`/healthz`가 200 응답을 반환하면 Gateway 프로세스가 요청을 수신 중이며 정상 상태임을 의미합니다. 이미지에 내장된 `HEALTHCHECK`도 동일한 엔드포인트를 폴링합니다.

## 항목별 영구 저장 위치

OpenClaw는 Docker에서 실행되지만, Docker가 기준 데이터 원본은 아닙니다. 모든 장기 상태는 재시작, 재빌드 및 재부팅 후에도 유지되어야 합니다.

| 구성 요소 | 위치 | 영구 저장 방식 | 참고 |
| ---------------------- | ------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Gateway 구성 | `/home/node/.openclaw/` | 호스트 볼륨 마운트 | `openclaw.json` 포함 |
| 채널/제공업체 자격 증명 | `/home/node/.openclaw/credentials/` | 호스트 볼륨 마운트 | 채널 및 제공업체 자격 증명 자료 |
| 모델 인증 프로필 | `/home/node/.openclaw/agents/` | 호스트 볼륨 마운트 | `agents/<agentId>/agent/auth-profiles.json`(OAuth, API 키) |
| 레거시 OAuth 키 파일 | `/home/node/.config/openclaw/` | 호스트 볼륨 마운트 | 마이그레이션 이전 OAuth 사이드카를 위한 읽기 전용 호환성 지원입니다. `openclaw doctor --fix`는 이를 `auth-profiles.json`으로 마이그레이션합니다. |
| Skills 구성 | `/home/node/.openclaw/skills/` | 호스트 볼륨 마운트 | Skills 수준 상태 |
| 에이전트 작업 공간 | `/home/node/.openclaw/workspace/` | 호스트 볼륨 마운트 | 코드 및 에이전트 산출물 |
| WhatsApp 세션 | `/home/node/.openclaw/` | 호스트 볼륨 마운트 | QR 로그인을 유지합니다. |
| Gmail 키링 | `/home/node/.openclaw/` | 호스트 볼륨 + 비밀번호 | `GOG_KEYRING_PASSWORD` 필요 |
| Plugin 패키지 | `/home/node/.openclaw/npm`, `/home/node/.openclaw/git` | 호스트 볼륨 마운트 | 다운로드 가능한 Plugin 패키지 루트 |
| 외부 바이너리 | `/usr/local/bin/` | Docker 이미지 | 빌드 시 반드시 포함해야 합니다. |
| Node 런타임 | 컨테이너 파일 시스템 | Docker 이미지 | 이미지를 빌드할 때마다 다시 빌드됩니다. |
| OS 패키지 | 컨테이너 파일 시스템 | Docker 이미지 | 런타임에 설치하지 마세요. |
| Docker 컨테이너 | 임시 | 재시작 가능 | 삭제해도 안전합니다. |

## 업데이트

VM에서 OpenClaw를 업데이트하려면:

```bash
git pull
docker compose build
docker compose up -d
```

## 관련 문서

- [Docker](/ko/install/docker)
- [Podman](/ko/install/podman)
- [ClawDock](/ko/install/clawdock)
