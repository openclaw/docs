---
read_when:
    - 새 머신 설정하기
    - 개인 환경을 망가뜨리지 않고 “최신 + 최고”를 원한다면
summary: OpenClaw의 고급 설정 및 개발 워크플로
title: 설정
x-i18n:
    generated_at: "2026-04-30T06:51:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: f96e5e8d46e694f0dfc67eeeb34f4c49498a56e384c3a2a6266c2214afdc0870
    source_path: start/setup.md
    workflow: 16
---

<Note>
처음 설정하는 경우 [시작하기](/ko/start/getting-started)부터 시작하세요.
온보딩 세부 정보는 [온보딩(CLI)](/ko/start/wizard)을 참조하세요.
</Note>

## 요약

업데이트를 얼마나 자주 받고 싶은지, Gateway를 직접 실행할지에 따라 설정 워크플로를 선택하세요.

- **맞춤 설정은 저장소 밖에 둡니다:** 저장소 업데이트가 건드리지 않도록 구성과 워크스페이스를 `~/.openclaw/openclaw.json` 및 `~/.openclaw/workspace/`에 보관하세요.
- **안정 워크플로(대부분에게 권장):** macOS 앱을 설치하고 번들된 Gateway를 실행하게 두세요.
- **최신 개발 워크플로(dev):** `pnpm gateway:watch`로 Gateway를 직접 실행한 다음 macOS 앱이 로컬 모드로 연결되게 하세요.

## 사전 요구 사항(소스 기준)

- Node 24 권장(Node 22 LTS, 현재 `22.14+`, 여전히 지원됨)
- `pnpm` 권장(또는 의도적으로 [Bun 워크플로](/ko/install/bun)를 사용하는 경우 Bun)
- Docker(선택 사항, 컨테이너화된 설정/e2e에만 필요 — [Docker](/ko/install/docker) 참조)

## 맞춤 설정 전략(업데이트로 문제가 생기지 않게)

“100% 나에게 맞춘” 설정 _그리고_ 쉬운 업데이트를 원한다면 사용자 지정 항목을 다음 위치에 보관하세요.

- **구성:** `~/.openclaw/openclaw.json`(JSON/JSON5에 가까움)
- **워크스페이스:** `~/.openclaw/workspace`(skills, 프롬프트, 메모리; 비공개 git 저장소로 만드세요)

한 번만 부트스트랩합니다.

```bash
openclaw setup
```

이 저장소 안에서는 로컬 CLI 엔트리를 사용하세요.

```bash
openclaw setup
```

아직 전역 설치가 없다면 `pnpm openclaw setup`으로 실행하세요(Bun 워크플로를 사용하는 경우 `bun run openclaw setup`).

## 이 저장소에서 Gateway 실행

`pnpm build` 후에는 패키지된 CLI를 직접 실행할 수 있습니다.

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 안정 워크플로(macOS 앱 우선)

1. **OpenClaw.app**(메뉴 막대)을 설치하고 실행합니다.
2. 온보딩/권한 체크리스트를 완료합니다(TCC 프롬프트).
3. Gateway가 **로컬**이고 실행 중인지 확인합니다(앱이 관리함).
4. 표면을 연결합니다(예: WhatsApp).

```bash
openclaw channels login
```

5. 정상 동작을 확인합니다.

```bash
openclaw health
```

빌드에서 온보딩을 사용할 수 없다면:

- `openclaw setup`을 실행한 다음 `openclaw channels login`을 실행하고, Gateway를 수동으로 시작하세요(`openclaw gateway`).

## 최신 개발 워크플로(터미널의 Gateway)

목표: TypeScript Gateway에서 작업하고, 핫 리로드를 사용하며, macOS 앱 UI가 연결된 상태를 유지합니다.

### 0) (선택 사항) macOS 앱도 소스에서 실행

macOS 앱도 최신 개발 상태로 사용하려면:

```bash
./scripts/restart-mac.sh
```

### 1) 개발 Gateway 시작

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`는 이름이 지정된 tmux 세션에서 Gateway 감시 프로세스를 시작하거나 다시 시작하고, 대화형 터미널에서 자동으로 연결합니다. 비대화형 셸은 분리된 상태로 유지되며 `tmux attach -t openclaw-gateway-watch-main`를 출력합니다. 대화형 실행을 분리된 상태로 유지하려면 `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`를 사용하고, 포그라운드 감시 모드에는 `pnpm gateway:watch:raw`를 사용하세요. 감시기는 관련 소스, 구성, 번들 Plugin 메타데이터 변경 시 다시 로드합니다.
`pnpm openclaw setup`은 새 체크아웃에서 한 번만 수행하는 로컬 구성/워크스페이스 초기화 단계입니다.
`pnpm gateway:watch`는 `dist/control-ui`를 다시 빌드하지 않으므로 `ui/` 변경 후에는 `pnpm ui:build`를 다시 실행하거나 Control UI를 개발하는 동안 `pnpm ui:dev`를 사용하세요.

의도적으로 Bun 워크플로를 사용하는 경우 동등한 명령은 다음과 같습니다.

```bash
bun install
# First run only (or after resetting local OpenClaw config/workspace)
bun run openclaw setup
bun run gateway:watch
```

### 2) macOS 앱이 실행 중인 Gateway를 가리키게 하기

**OpenClaw.app**에서:

- 연결 모드: **로컬**
  앱이 구성된 포트에서 실행 중인 Gateway에 연결됩니다.

### 3) 확인

- 앱 내 Gateway 상태가 **“기존 gateway 사용 중 …”**으로 표시되어야 합니다.
- 또는 CLI로 확인합니다.

```bash
openclaw health
```

### 흔한 함정

- **잘못된 포트:** Gateway WS 기본값은 `ws://127.0.0.1:18789`입니다. 앱과 CLI가 같은 포트를 사용하게 하세요.
- **상태가 저장되는 위치:**
  - 채널/프로바이더 상태: `~/.openclaw/credentials/`
  - 모델 인증 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 세션: `~/.openclaw/agents/<agentId>/sessions/`
  - 로그: `/tmp/openclaw/`

## 자격 증명 저장소 맵

인증을 디버깅하거나 백업할 항목을 결정할 때 사용하세요.

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 봇 토큰**: 구성/env 또는 `channels.telegram.tokenFile`(일반 파일만 허용, 심볼릭 링크는 거부됨)
- **Discord 봇 토큰**: 구성/env 또는 SecretRef(env/file/exec 프로바이더)
- **Slack 토큰**: 구성/env(`channels.slack.*`)
- **페어링 허용 목록**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`(기본 계정)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`(기본이 아닌 계정)
- **모델 인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **파일 기반 비밀 페이로드(선택 사항)**: `~/.openclaw/secrets.json`
- **레거시 OAuth 가져오기**: `~/.openclaw/credentials/oauth.json`
  자세한 내용: [보안](/ko/gateway/security#credential-storage-map).

## 업데이트(설정을 망가뜨리지 않고)

- `~/.openclaw/workspace`와 `~/.openclaw/`는 “내 것”으로 유지하세요. 개인 프롬프트/구성을 `openclaw` 저장소에 넣지 마세요.
- 소스 업데이트: `git pull` + 선택한 패키지 관리자 설치 단계(기본값은 `pnpm install`, Bun 워크플로는 `bun install`) + 일치하는 `gateway:watch` 명령을 계속 사용하세요.

## Linux(systemd 사용자 서비스)

Linux 설치는 systemd **사용자** 서비스를 사용합니다. 기본적으로 systemd는 로그아웃/유휴 시 사용자 서비스를 중지하며, 이로 인해 Gateway가 종료됩니다. 온보딩은 이를 위해 lingering을 활성화하려고 시도합니다(sudo를 요청할 수 있음). 여전히 꺼져 있다면 다음을 실행하세요.

```bash
sudo loginctl enable-linger $USER
```

항상 켜져 있어야 하거나 다중 사용자 서버라면 사용자 서비스 대신 **시스템** 서비스를 고려하세요(lingering 필요 없음). systemd 참고 사항은 [Gateway 런북](/ko/gateway)을 참조하세요.

## 관련 문서

- [Gateway 런북](/ko/gateway)(플래그, 감독, 포트)
- [Gateway 구성](/ko/gateway/configuration)(구성 스키마 + 예제)
- [Discord](/ko/channels/discord) 및 [Telegram](/ko/channels/telegram)(reply tags + replyToMode settings)
- [OpenClaw 어시스턴트 설정](/ko/start/openclaw)
- [macOS 앱](/ko/platforms/macos)(gateway 수명 주기)
