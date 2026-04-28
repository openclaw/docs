---
read_when:
    - OS 지원 또는 설치 경로를 찾는 경우
    - Gateway를 어디에서 실행할지 결정하기
summary: 플랫폼 지원 개요(Gateway + 컴패니언 앱)
title: 플랫폼
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T06:23:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

OpenClaw core는 TypeScript로 작성되어 있습니다. **권장 런타임은 Node**입니다.
Gateway에는 Bun을 권장하지 않습니다. WhatsApp 및
Telegram 채널과 관련된 알려진 문제가 있습니다. 자세한 내용은 [Bun (experimental)](/ko/install/bun)을 참조하세요.

macOS(메뉴 막대 앱)와 모바일 Node(iOS/Android)용 컴패니언 앱이 있습니다. Windows와
Linux 컴패니언 앱도 계획되어 있지만, Gateway는 오늘 이미 완전히 지원됩니다.
Windows용 네이티브 컴패니언 앱도 계획 중이며, Gateway는 WSL2를 통한 실행을 권장합니다.

## OS 선택

- macOS: [macOS](/ko/platforms/macos)
- iOS: [iOS](/ko/platforms/ios)
- Android: [Android](/ko/platforms/android)
- Windows: [Windows](/ko/platforms/windows)
- Linux: [Linux](/ko/platforms/linux)

## VPS 및 호스팅

- VPS 허브: [VPS hosting](/ko/vps)
- Fly.io: [Fly.io](/ko/install/fly)
- Hetzner (Docker): [Hetzner](/ko/install/hetzner)
- GCP (Compute Engine): [GCP](/ko/install/gcp)
- Azure (Linux VM): [Azure](/ko/install/azure)
- exe.dev (VM + HTTPS 프록시): [exe.dev](/ko/install/exe-dev)

## 자주 쓰는 링크

- 설치 가이드: [Getting Started](/ko/start/getting-started)
- Gateway 운영 가이드: [Gateway](/ko/gateway)
- Gateway 설정: [Configuration](/ko/gateway/configuration)
- 서비스 상태: `openclaw gateway status`

## Gateway 서비스 설치(CLI)

다음 중 하나를 사용하세요(모두 지원됨).

- 마법사(권장): `openclaw onboard --install-daemon`
- 직접 설치: `openclaw gateway install`
- Configure 흐름: `openclaw configure` → **Gateway service** 선택
- 수리/마이그레이션: `openclaw doctor` (서비스 설치 또는 수정 제안)

서비스 대상은 OS에 따라 다릅니다.

- macOS: LaunchAgent (`ai.openclaw.gateway` 또는 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`)
- Linux/WSL2: systemd 사용자 서비스 (`openclaw-gateway[-<profile>].service`)
- 네이티브 Windows: 예약된 작업(`OpenClaw Gateway` 또는 `OpenClaw Gateway (<profile>)`), 작업 생성이 거부되면 사용자별 Startup-folder 로그인 항목으로 대체

## 관련 항목

- [Install overview](/ko/install)
- [macOS app](/ko/platforms/macos)
- [iOS app](/ko/platforms/ios)
