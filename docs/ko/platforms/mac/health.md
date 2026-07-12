---
read_when:
    - Mac 앱 상태 표시기 디버깅
summary: macOS 앱이 Gateway/채널 상태를 보고하는 방식
title: 상태 확인(macOS)
x-i18n:
    generated_at: "2026-07-12T00:57:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a086c527796dbe453bdee1cc9cbe1e0fc1157de710c8c6de186411fe9aa3bc7b
    source_path: platforms/mac/health.md
    workflow: 16
---

# macOS의 상태 점검

메뉴 막대 앱에서 연결된 채널의 상태를 확인하는 방법입니다.

## 메뉴 막대

상태 점:

- 녹색: 연결됨 + 프로브 정상.
- 주황색: 연결되었지만 채널 프로브에서 성능 저하/연결되지 않음이 보고됨.
- 빨간색: 아직 연결되지 않음.

보조 줄에는 "연결됨 · 인증 12분" 또는 실패 원인이 표시됩니다.
메뉴의 "지금 상태 점검 실행"을 누르면 필요 시 프로브가 실행됩니다.

## 설정

- 일반 탭에는 상태 점, 요약 줄(연결 상태 + 인증 경과 시간), 선택적 실패 상세 정보 줄로 구성된 상태 카드가 표시되며 **지금 다시 시도** 및 **로그 열기** 버튼을 제공합니다.
- **채널 탭**에는 WhatsApp 및 Telegram의 채널별 상태와 제어 기능(로그인 QR, 로그아웃, 프로브, 마지막 연결 해제/오류)이 표시됩니다.

## 프로브 작동 방식

앱은 기존 WebSocket 연결을 통해 Gateway의 `health` RPC를 약 60초마다 또는 필요 시 호출합니다(CLI 셸 호출 방식이 아님). RPC는 메시지를 전송하지 않고 자격 증명을 불러와 상태를 보고합니다. 앱은 마지막 정상 스냅샷과 마지막 오류를 별도로 캐시하므로 UI가 즉시 로드되며 오프라인 상태에서도 깜박이지 않습니다.

## 확실하지 않은 경우

[Gateway 상태](/ko/gateway/health)의 CLI 흐름(`openclaw status`, `openclaw status --deep`, `openclaw health --json`)을 사용하고 `/tmp/openclaw/openclaw-*.log`를 추적하면서 `web-heartbeat` / `web-reconnect`로 필터링하세요.

## 관련 문서

- [Gateway 상태](/ko/gateway/health)
- [macOS 앱](/ko/platforms/macos)
