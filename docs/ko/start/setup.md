---
read_when:
    - 새 머신 설정하기
    - 개인 설정을 손상시키지 않으면서 "가장 최신의 뛰어난 기능"을 사용하려는 경우
summary: OpenClaw 고급 설정 및 개발 워크플로우
title: 설정
x-i18n:
    generated_at: "2026-07-12T15:46:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cd35e9ab99de49a14f3d8673b2d11abe46aace18cc7edac43987826bbd1fd857
    source_path: start/setup.md
    workflow: 16
---

<Note>
처음 설정하는 경우 [시작하기](/ko/start/getting-started)부터 시작하십시오.
온보딩에 대한 자세한 내용은 [온보딩(CLI)](/ko/start/wizard)을 참조하십시오.
</Note>

## 요약

업데이트 빈도와 Gateway를 직접 실행할지 여부에 따라 설정 워크플로를 선택하십시오.

- **맞춤 설정은 저장소 외부에 둡니다:** 설정과 작업 공간을 `~/.openclaw/openclaw.json` 및 `~/.openclaw/workspace/`에 보관하여 저장소 업데이트가 이를 건드리지 않도록 합니다.
- **안정적인 워크플로(대부분의 사용자에게 권장):** macOS 앱을 설치하고 번들 Gateway를 실행하도록 합니다.
- **최신 개발 버전 워크플로(개발용):** `pnpm gateway:watch`를 통해 Gateway를 직접 실행한 다음 macOS 앱이 로컬 모드에서 연결되도록 합니다.

## 사전 요구 사항(소스에서 실행)

- Node 24 권장(Node 22 LTS, 현재 `22.19+`도 계속 지원)
- 소스 체크아웃에는 `pnpm`이 필요합니다. OpenClaw는 개발 모드에서
  `extensions/*` pnpm 작업 공간 패키지의 번들 Plugin을 로드하므로 루트에서 `npm install`을
  실행해도 전체 소스 트리가 준비되지 않습니다.
- Docker(선택 사항, 컨테이너화된 설정/e2e에만 사용 - [Docker](/ko/install/docker) 참조)

## 맞춤 설정 전략(업데이트로 인한 문제 방지)

"나에게 100% 맞춤 설정"하면서도 쉽게 업데이트하려면 사용자 지정 항목을 다음 위치에 보관하십시오.

- **설정:** `~/.openclaw/openclaw.json`(JSON/JSON5 계열)
- **작업 공간:** `~/.openclaw/workspace`(Skills, 프롬프트, 메모리. 비공개 git 저장소로 만드십시오)

전체 온보딩 마법사를 실행하지 않고 설정/작업 공간 폴더를 한 번 초기화합니다.

```bash
openclaw setup --baseline
```

아직 전역 설치하지 않았습니까? 대신 이 저장소에서 실행하십시오.

```bash
pnpm openclaw setup --baseline
```

(`--baseline`이 없는 기본 `openclaw setup`은 `openclaw onboard`의 별칭이며 전체 대화형 마법사를 실행합니다.)

## 이 저장소에서 Gateway 실행

`pnpm build` 후 패키징된 CLI를 직접 실행할 수 있습니다.

```bash
node openclaw.mjs gateway --port 18789 --verbose
```

## 안정적인 워크플로(macOS 앱 우선)

1. **OpenClaw.app**(메뉴 막대)을 설치하고 실행합니다.
2. 온보딩/권한 체크리스트(TCC 프롬프트)를 완료합니다.
3. Gateway가 **Local**로 설정되어 실행 중인지 확인합니다(앱에서 관리).
4. 채널을 연결합니다(예: WhatsApp).

```bash
openclaw channels login
```

5. 정상 작동 여부를 확인합니다.

```bash
openclaw health
```

빌드에서 온보딩을 사용할 수 없는 경우:

- `openclaw setup`을 실행한 다음 `openclaw channels login`을 실행하고 Gateway를 수동으로 시작합니다(`openclaw gateway`).

## 최신 개발 버전 워크플로(터미널에서 Gateway 실행)

목표: TypeScript Gateway에서 작업하고 핫 리로드를 사용하면서 macOS 앱 UI의 연결을 유지합니다.

### 0) (선택 사항) macOS 앱도 소스에서 실행

macOS 앱도 최신 개발 버전으로 사용하려는 경우:

```bash
./scripts/restart-mac.sh
```

### 1) 개발용 Gateway 시작

```bash
pnpm install
# 최초 실행 시에만(또는 로컬 OpenClaw 설정/작업 공간을 초기화한 후)
pnpm openclaw setup
pnpm gateway:watch
```

`gateway:watch`는 이름이 지정된 tmux 세션
(`openclaw-gateway-watch-main`)에서 Gateway 감시 프로세스를 시작하거나 다시 시작하며, 대화형
터미널에서는 자동으로 연결됩니다. 비대화형 셸은 분리된 상태를 유지하고
`tmux attach -t openclaw-gateway-watch-main`을 출력합니다. 대화형 실행을
분리된 상태로 유지하려면 `OPENCLAW_GATEWAY_WATCH_ATTACH=0 pnpm gateway:watch`를 사용하고,
포그라운드 감시 모드에는 `pnpm gateway:watch:raw`를 사용하십시오. 감시 프로세스는
관련 소스, 설정 및 번들 Plugin 메타데이터가 변경되면 다시 로드합니다. 감시 중인
Gateway가 시작 중 종료되면 `gateway:watch`는
`openclaw doctor --fix --non-interactive`를 한 번 실행한 후 재시도합니다. 이 개발 전용 복구 단계를
비활성화하려면 `OPENCLAW_GATEWAY_WATCH_AUTO_DOCTOR=0`을 설정하십시오.
`pnpm gateway:watch`는 `dist/control-ui`를 다시 빌드하지 않으므로 `ui/` 변경 후 `pnpm ui:build`를 다시 실행하거나 Control UI를 개발하는 동안 `pnpm ui:dev`를 사용하십시오.

### 2) macOS 앱을 실행 중인 Gateway에 연결

**OpenClaw.app**에서:

- Connection Mode: **Local**
  앱이 설정된 포트에서 실행 중인 Gateway에 연결됩니다.

### 3) 확인

- 앱 내 Gateway 상태가 **"Using existing gateway …"**로 표시되어야 합니다.
- 또는 CLI를 통해 확인합니다.

```bash
openclaw health
```

### 흔히 발생하는 실수

- **잘못된 포트:** Gateway WS의 기본값은 `ws://127.0.0.1:18789`입니다. 앱과 CLI에서 동일한 포트를 사용하십시오.
- **상태가 저장되는 위치:**
  - 채널/제공자 상태: `~/.openclaw/credentials/`
  - 모델 인증 프로필: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 세션 및 트랜스크립트: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
  - 레거시/보관 세션 아티팩트: `~/.openclaw/agents/<agentId>/sessions/`
  - 로그: `/tmp/openclaw/`

## 자격 증명 저장소 맵

인증을 디버깅하거나 백업할 항목을 결정할 때 사용하십시오.

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 봇 토큰**: 설정/환경 변수 또는 `channels.telegram.tokenFile`(일반 파일만 허용, 심볼릭 링크 거부)
- **Discord 봇 토큰**: 설정/환경 변수 또는 SecretRef(환경 변수/파일/실행 제공자)
- **Slack 토큰**: 설정/환경 변수(`channels.slack.*`)
- **페어링 허용 목록**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`(기본 계정)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`(기본이 아닌 계정)
- **모델 인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **파일 기반 보안 비밀 페이로드(선택 사항)**: `~/.openclaw/secrets.json`
- **레거시 OAuth 가져오기**: `~/.openclaw/credentials/oauth.json`
  자세한 내용은 [보안](/ko/gateway/security#credential-storage-map)을 참조하십시오.

## 설정을 망가뜨리지 않고 업데이트하기

- `~/.openclaw/workspace`와 `~/.openclaw/`를 "사용자 소유 항목"으로 유지하고, 개인 프롬프트/설정을 `openclaw` 저장소에 넣지 마십시오.
- 소스 업데이트: `git pull` + `pnpm install`을 실행하고 계속 `pnpm gateway:watch`를 사용합니다.

## Linux(systemd 사용자 서비스)

Linux 설치에서는 systemd **사용자** 서비스를 사용합니다. 기본적으로 systemd는 로그아웃/유휴 상태에서 사용자
서비스를 중지하므로 Gateway도 종료됩니다. 온보딩은 lingering을
활성화하려고 시도합니다(sudo를 요청할 수 있음). 여전히 비활성화되어 있다면 다음을 실행하십시오.

```bash
sudo loginctl enable-linger $USER
```

상시 가동 또는 다중 사용자 서버에서는 사용자 서비스 대신 **시스템** 서비스를
사용하는 것이 좋습니다(lingering 불필요). systemd 관련 참고 사항은 [Gateway 운영 가이드](/ko/gateway)를 참조하십시오.

## 관련 문서

- [Gateway 운영 가이드](/ko/gateway)(플래그, 감독, 포트)
- [Gateway 설정](/ko/gateway/configuration)(설정 스키마 + 예제)
- [Discord](/ko/channels/discord) 및 [Telegram](/ko/channels/telegram)(응답 태그 + replyToMode 설정)
- [OpenClaw 어시스턴트 설정](/ko/start/openclaw)
- [macOS 앱](/ko/platforms/macos)(Gateway 수명 주기)
