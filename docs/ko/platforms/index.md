---
read_when:
    - OS 지원 또는 설치 경로 찾기
    - Gateway를 실행할 위치 결정
summary: 플랫폼 지원 개요 (Gateway + 컴패니언 앱)
title: 플랫폼
x-i18n:
    generated_at: "2026-05-06T06:32:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw 코어는 TypeScript로 작성되었습니다. **Node가 권장 런타임입니다**.
Gateway에는 Bun을 권장하지 않습니다. WhatsApp 및
Telegram 채널에서 알려진 문제가 있습니다. 자세한 내용은 [Bun(실험적)](/ko/install/bun)을 참조하세요.

macOS(메뉴 막대 앱) 및 모바일 노드(iOS/Android)용 컴패니언 앱이 있습니다. Windows 및
Linux 컴패니언 앱은 계획 중이지만, Gateway는 현재 완전히 지원됩니다.
Windows용 네이티브 컴패니언 앱도 계획 중이며, Gateway는 WSL2를 통해 사용하는 것이 권장됩니다.

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

## 일반 링크

- 설치 가이드: [시작하기](/ko/start/getting-started)
- Gateway 런북: [Gateway](/ko/gateway)
- Gateway 구성: [구성](/ko/gateway/configuration)
- 서비스 상태: `openclaw gateway status`

## Gateway 서비스 설치(CLI)

다음 중 하나를 사용하세요(모두 지원됨).

- 마법사(권장): `openclaw onboard --install-daemon`
- 직접 실행: `openclaw gateway install`
- 구성 플로: `openclaw configure` → **Gateway 서비스** 선택
- 복구/마이그레이션: `openclaw doctor`(서비스 설치 또는 수정을 제안함)

서비스 대상은 OS에 따라 달라집니다.

- macOS: LaunchAgent(`ai.openclaw.gateway` 또는 `ai.openclaw.<profile>`, 레거시 `com.openclaw.*`)
- Linux/WSL2: systemd 사용자 서비스(`openclaw-gateway[-<profile>].service`)
- 네이티브 Windows: 예약 작업(`OpenClaw Gateway` 또는 `OpenClaw Gateway (<profile>)`), 작업 생성이 거부되는 경우 사용자별 시작 프로그램 폴더 로그인 항목 대체 방식 사용

## 관련

- [설치 개요](/ko/install)
- [macOS 앱](/ko/platforms/macos)
- [iOS 앱](/ko/platforms/ios)
