---
read_when:
    - Docker를 사용해 클라우드 VM에 OpenClaw를 배포하고 있습니다
    - 공유 바이너리 베이크, 지속성 및 업데이트 흐름이 필요합니다
summary: 장기간 운영되는 OpenClaw Gateway 호스트를 위한 공유 Docker VM 런타임 단계
title: Docker VM 런타임
x-i18n:
    generated_at: "2026-04-30T06:36:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 01ce5a7e58619da9c9ec97eb1e4f88323ab26f42f40e0a3d655b18019de798dd
    source_path: install/docker-vm-runtime.md
    workflow: 16
---

VM 기반 Docker 설치를 위한 공유 런타임 단계입니다. GCP, Hetzner 및 유사한 VPS 제공업체가 여기에 해당합니다.

## 필요한 바이너리를 이미지에 포함하기

실행 중인 컨테이너 안에 바이너리를 설치하는 것은 함정입니다.
런타임에 설치한 것은 재시작 시 모두 사라집니다.

Skills에 필요한 모든 외부 바이너리는 이미지 빌드 시점에 설치해야 합니다.

아래 예시는 일반적인 바이너리 세 가지만 보여줍니다.

- Gmail 접근용 `gog`(`gogcli`에서 제공)
- Google Places용 `goplaces`
- WhatsApp용 `wacli`

이들은 예시이며, 완전한 목록이 아닙니다.
같은 패턴을 사용해 필요한 만큼 바이너리를 설치할 수 있습니다.

나중에 추가 바이너리에 의존하는 새 Skills를 추가한다면, 다음을 수행해야 합니다.

1. Dockerfile 업데이트
2. 이미지 다시 빌드
3. 컨테이너 재시작

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
위 URL은 예시입니다. ARM 기반 VM의 경우 `arm64` 에셋을 선택하세요. 재현 가능한 빌드를 위해 버전이 고정된 릴리스 URL을 사용하세요.
</Note>

## 빌드 및 실행

```bash
docker compose build
docker compose up -d openclaw-gateway
```

`pnpm install --frozen-lockfile` 중 빌드가 `Killed` 또는 `exit code 137`로 실패하면 VM 메모리가 부족한 것입니다.
다시 시도하기 전에 더 큰 머신 클래스를 사용하세요.

바이너리를 확인합니다.

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

예상 출력:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

Gateway를 확인합니다.

```bash
docker compose logs -f openclaw-gateway
```

예상 출력:

```
[gateway] listening on ws://0.0.0.0:18789
```

## 무엇이 어디에 유지되는가

OpenClaw는 Docker에서 실행되지만, Docker가 진실의 원천은 아닙니다.
모든 장기 상태는 재시작, 재빌드, 재부팅 이후에도 유지되어야 합니다.

| 구성 요소 | 위치 | 지속성 메커니즘 | 참고 |
| ------------------- | ---------------------------------------- | ---------------------- | ------------------------------------------------------------- |
| Gateway 구성 | `/home/node/.openclaw/` | 호스트 볼륨 마운트 | `openclaw.json`, `.env` 포함 |
| 모델 인증 프로필 | `/home/node/.openclaw/agents/` | 호스트 볼륨 마운트 | `agents/<agentId>/agent/auth-profiles.json` (OAuth, API 키) |
| Skill 구성 | `/home/node/.openclaw/skills/` | 호스트 볼륨 마운트 | Skill 수준 상태 |
| 에이전트 작업 영역 | `/home/node/.openclaw/workspace/` | 호스트 볼륨 마운트 | 코드 및 에이전트 산출물 |
| WhatsApp 세션 | `/home/node/.openclaw/` | 호스트 볼륨 마운트 | QR 로그인 유지 |
| Gmail 키링 | `/home/node/.openclaw/` | 호스트 볼륨 + 비밀번호 | `GOG_KEYRING_PASSWORD` 필요 |
| Plugin 런타임 의존성 | `/var/lib/openclaw/plugin-runtime-deps/` | Docker 명명된 볼륨 | 생성된 번들 Plugin 의존성 및 런타임 미러 |
| 외부 바이너리 | `/usr/local/bin/` | Docker 이미지 | 빌드 시점에 포함해야 함 |
| Node 런타임 | 컨테이너 파일 시스템 | Docker 이미지 | 이미지 빌드마다 다시 빌드됨 |
| OS 패키지 | 컨테이너 파일 시스템 | Docker 이미지 | 런타임에 설치하지 마세요 |
| Docker 컨테이너 | 일시적 | 재시작 가능 | 삭제해도 안전함 |

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
