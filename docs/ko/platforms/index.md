---
read_when:
    - OS 지원 또는 설치 경로 찾기
    - Gateway를 실행할 위치 결정하기
summary: 플랫폼 지원 개요(Gateway + 컴패니언 앱)
title: 플랫폼
x-i18n:
    generated_at: "2026-06-27T17:39:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw 코어는 TypeScript로 작성되었습니다. **Node가 권장 런타임입니다**.
Bun은 Gateway에 권장되지 않습니다. WhatsApp 및
Telegram 채널에 알려진 문제가 있습니다. 자세한 내용은 [Bun(실험적)](/ko/install/bun)을 참고하세요.

Windows Hub, macOS(메뉴 막대 앱), 모바일 노드
(iOS/Android)용 컴패니언 앱이 있습니다. Linux 컴패니언 앱은 계획되어 있지만, Gateway는 현재
완전히 지원됩니다. Windows에서는 데스크톱 앱에는 Windows Hub를, 터미널 우선 사용에는 네이티브
PowerShell 설치를, 가장 Linux와 호환되는 Gateway 런타임에는 WSL2를 선택하세요.

## OS 선택

- macOS: [macOS](/ko/platforms/macos)
- iOS: [iOS](/ko/platforms/ios)
- Android: [Android](/ko/platforms/android)
- Windows: [Windows](/ko/platforms/windows)
- Linux: [Linux](/ko/platforms/linux)

## VPS 및 호스팅

- VPS 허브: [VPS 호스팅](/ko/vps)
- Fly.io: [Fly.io](/ko/install/fly)
- Hetzner(Docker): [Hetzner](/ko/install/hetzner)
- GCP(Compute Engine): [GCP](/ko/install/gcp)
- Azure(Linux VM): [Azure](/ko/install/azure)
- exe.dev(VM + HTTPS 프록시): [exe.dev](/ko/install/exe-dev)
- EasyRunner(Podman + Caddy): [EasyRunner](/ko/platforms/easyrunner)

## 공통 링크

- 설치 가이드: [시작하기](/ko/start/getting-started)
- Windows Hub: [Windows](/ko/platforms/windows)
- Gateway 런북: [Gateway](/ko/gateway)
- Gateway 구성: [구성](/ko/gateway/configuration)
- 서비스 상태: `openclaw gateway status`

## Gateway 서비스 설치(CLI)

다음 중 하나를 사용하세요(모두 지원됨).

- 마법사(권장): `openclaw onboard --install-daemon`
- 직접 실행: `openclaw gateway install`
- 구성 플로우: `openclaw configure` → **Gateway 서비스** 선택
- 복구/마이그레이션: `openclaw doctor`(서비스 설치 또는 수정을 제안함)

서비스 대상은 OS에 따라 다릅니다.

- macOS: LaunchAgent(`ai.openclaw.gateway` 또는 `ai.openclaw.<profile>`; 레거시 `com.openclaw.*`)
- Linux/WSL2: systemd 사용자 서비스(`openclaw-gateway[-<profile>].service`)
- 네이티브 Windows: 예약된 작업(`OpenClaw Gateway` 또는 `OpenClaw Gateway (<profile>)`), 작업 생성이 거부되면 사용자별 시작 폴더 로그인 항목 폴백 사용

## 관련 항목

- [설치 개요](/ko/install)
- [Windows Hub](/ko/platforms/windows)
- [macOS 앱](/ko/platforms/macos)
- [iOS 앱](/ko/platforms/ios)
