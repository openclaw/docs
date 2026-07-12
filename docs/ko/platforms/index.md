---
read_when:
    - OS 지원 또는 설치 경로 찾기
    - Gateway 실행 위치 결정하기
summary: 플랫폼 지원 개요(Gateway + 컴패니언 앱)
title: 플랫폼
x-i18n:
    generated_at: "2026-07-12T15:26:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw 코어는 TypeScript로 작성되었습니다. **Node를 권장 런타임으로 사용합니다**.
Gateway에는 Bun을 권장하지 않습니다. WhatsApp 및 Telegram 채널에서
알려진 문제가 있습니다. 자세한 내용은 [Bun(실험적)](/ko/install/bun)을 참조하십시오.

Windows Hub, macOS(메뉴 막대 앱), 모바일 Node(iOS/Android)용
컴패니언 앱이 제공됩니다. Linux 컴패니언 앱은 계획 중이지만, 현재 Gateway는
완전히 지원됩니다. Windows에서는 데스크톱 앱을 사용하려면 Windows Hub를,
터미널 중심으로 사용하려면 네이티브 PowerShell 설치를, Linux와 가장
호환되는 Gateway 런타임을 사용하려면 WSL2를 선택하십시오.

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

## 자주 사용하는 링크

- 설치 가이드: [시작하기](/ko/start/getting-started)
- Windows Hub: [Windows](/ko/platforms/windows)
- Gateway 운영 안내서: [Gateway](/ko/gateway)
- Gateway 구성: [구성](/ko/gateway/configuration)
- 서비스 상태: `openclaw gateway status`

## Gateway 서비스 설치(CLI)

다음 방법 중 하나를 사용하십시오(모두 지원됨).

- 마법사(권장): `openclaw onboard --install-daemon`
- 직접 설치: `openclaw gateway install`
- 구성 흐름: `openclaw configure` → **Gateway service** 선택
- 복구/마이그레이션: `openclaw doctor`(서비스 설치 또는 수정을 제안함)

서비스 대상은 OS에 따라 다릅니다.

- macOS: LaunchAgent(`ai.openclaw.gateway`, 명명된 프로필의 경우 `ai.openclaw.<profile>`)
- Linux/WSL2: systemd 사용자 서비스(`openclaw-gateway[-<profile>].service`)
- 네이티브 Windows: 예약된 작업(`OpenClaw Gateway` 또는 `OpenClaw Gateway (<profile>)`). 작업 생성이 거부되면 사용자별 Startup 폴더 로그인 항목으로 대체

## 관련 문서

- [설치 개요](/ko/install)
- [Windows Hub](/ko/platforms/windows)
- [macOS 앱](/ko/platforms/macos)
- [iOS 앱](/ko/platforms/ios)
