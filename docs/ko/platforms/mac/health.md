---
read_when:
    - mac 앱 상태 표시기 디버깅하기
summary: macOS 앱이 Gateway/Baileys 상태를 보고하는 방식
title: 상태 점검(macOS)
x-i18n:
    generated_at: "2026-04-24T06:24:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# macOS에서의 상태 점검

메뉴 막대 앱에서 연결된 채널이 정상인지 확인하는 방법입니다.

## 메뉴 막대

- 상태 점은 이제 Baileys 상태를 반영합니다.
  - 초록색: 연결됨 + 최근에 소켓 열림.
  - 주황색: 연결 중/재시도 중.
  - 빨간색: 로그아웃됨 또는 probe 실패.
- 보조 줄에는 "linked · auth 12m"가 표시되거나 실패 이유가 표시됩니다.
- "Run Health Check" 메뉴 항목은 온디맨드 probe를 트리거합니다.

## 설정

- General 탭에 Health 카드가 추가되며 다음을 표시합니다: linked auth age, session-store path/count, last check time, last error/status code, 그리고 Run Health Check / Reveal Logs 버튼.
- 캐시된 스냅샷을 사용하므로 UI가 즉시 로드되며, 오프라인일 때도 우아하게 폴백합니다.
- **Channels 탭**은 WhatsApp/Telegram용 채널 상태 + 제어(로그인 QR, 로그아웃, probe, 마지막 disconnect/error)를 표시합니다.

## probe 작동 방식

- 앱은 약 60초마다 그리고 온디맨드 시 `ShellExecutor`를 통해 `openclaw health --json`을 실행합니다. probe는 자격 증명을 로드하고 메시지를 보내지 않고 상태를 보고합니다.
- 깜빡임을 피하려면 마지막 정상 스냅샷과 마지막 오류를 별도로 캐시하고, 각각의 타임스탬프를 표시합니다.

## 확신이 서지 않을 때

- [Gateway 상태 점검](/ko/gateway/health)의 CLI 흐름(`openclaw status`, `openclaw status --deep`, `openclaw health --json`)을 계속 사용할 수 있으며, `web-heartbeat` / `web-reconnect` 관련 `/tmp/openclaw/openclaw-*.log`를 tail할 수 있습니다.

## 관련

- [Gateway 상태 점검](/ko/gateway/health)
- [macOS 앱](/ko/platforms/macos)
