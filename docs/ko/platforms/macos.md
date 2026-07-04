---
read_when:
    - macOS 앱 설치하기
    - macOS에서 로컬 및 원격 Gateway 모드 선택하기
    - macOS 앱 릴리스 다운로드를 찾는 중
summary: OpenClaw macOS 메뉴 막대 앱 설치 및 사용
title: macOS 앱
x-i18n:
    generated_at: "2026-07-04T06:26:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

macOS 앱은 OpenClaw **메뉴 막대 컴패니언**입니다. 네이티브 트레이 UI, macOS 권한 프롬프트, 알림, WebChat, 음성 입력, Canvas, 또는 `system.run` 같은 Mac 호스트 노드 도구가 필요할 때 사용하세요.

CLI와 Gateway만 필요하다면 [시작하기](/ko/start/getting-started)부터 시작하세요.

## 다운로드

[OpenClaw GitHub 릴리스](https://github.com/openclaw/openclaw/releases)에서 macOS 앱 빌드를 다운로드하세요.
릴리스에 macOS 앱 자산이 포함되어 있으면 다음을 찾으세요.

- `OpenClaw-<version>.dmg` (권장)
- `OpenClaw-<version>.zip`

일부 릴리스에는 CLI, 증거, 또는 Windows 자산만 포함됩니다. 최신 릴리스에 macOS 앱 자산이 없으면 해당 자산이 있는 최신 릴리스를 사용하거나 [macOS 개발 설정](/ko/platforms/mac/dev-setup)으로 소스에서 앱을 빌드하세요.

## 첫 실행

1. **OpenClaw.app**을 설치하고 실행합니다.
2. 로컬 Gateway의 경우 **이 Mac**을 선택하거나 원격 Gateway에 연결합니다.
3. 로컬 모드에서는 앱이 사용자 공간 런타임과 Gateway를 설치하는 동안 기다립니다.
4. 공급자 설정과 macOS 권한 체크리스트를 완료합니다.
5. 온보딩 테스트 메시지를 보냅니다.

CLI/Gateway 설정 경로는 [시작하기](/ko/start/getting-started)를 사용하세요.
권한 복구는 [macOS 권한](/ko/platforms/mac/permissions)을 사용하세요.

## Gateway 모드 선택

| 모드   | 사용 시점                                                                             | 세부 페이지                                        |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 로컬  | 이 Mac이 Gateway를 실행하고 launchd로 계속 유지해야 할 때.                         | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway) |
| 원격 | 다른 호스트가 Gateway를 실행하고 이 Mac이 SSH, LAN, 또는 Tailnet을 통해 제어해야 할 때. | [원격 제어](/ko/platforms/mac/remote)            |

로컬 모드에는 설치된 `openclaw` CLI가 필요합니다. 새 Mac에서는 앱이 Gateway 마법사를 시작하기 전에 일치하는 CLI와 런타임을 자동으로 설치합니다.
수동 복구는 [macOS의 Gateway](/ko/platforms/mac/bundled-gateway)를 참조하세요.

## 앱이 담당하는 것

- 메뉴 막대 상태, 알림, 상태, WebChat.
- 화면, 마이크, 음성, 자동화, 손쉬운 사용에 대한 macOS 권한 프롬프트.
- Canvas, 카메라/화면 캡처, 알림, `system.run` 같은 로컬 노드 도구.
- Mac 호스트 명령에 대한 실행 승인 프롬프트.
- 원격 모드 SSH 터널 또는 직접 Gateway 연결.

앱은 OpenClaw Gateway나 일반 CLI 문서를 대체하지 **않습니다**. 핵심 Gateway 구성, 공급자, Plugin, 채널, 도구, 보안은 각각의 문서에 있습니다.

## macOS 세부 페이지

| 작업                                     | 읽을 문서                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway 서비스 설치 또는 디버그 | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway)                                          |
| 클라우드 동기화 폴더 밖에 상태 유지   | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 앱 검색 및 연결 디버그     | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| launchd 동작 이해              | [Gateway 수명 주기](/ko/platforms/mac/child-process)                                           |
| 권한 또는 서명/TCC 문제 해결    | [macOS 권한](/ko/platforms/mac/permissions)                                             |
| 원격 Gateway에 연결              | [원격 제어](/ko/platforms/mac/remote)                                                     |
| 메뉴 막대 상태 및 상태 검사 읽기   | [메뉴 막대](/ko/platforms/mac/menu-bar), [상태 검사](/ko/platforms/mac/health)                 |
| 내장 채팅 UI 사용                 | [WebChat](/ko/platforms/mac/webchat)                                                           |
| 음성 깨우기 또는 푸시 투 토크 사용           | [음성 깨우기](/ko/platforms/mac/voicewake)                                                      |
| Canvas 및 Canvas 딥 링크 사용         | [Canvas](/ko/platforms/mac/canvas)                                                             |
| UI 자동화를 위한 PeekabooBridge 호스트    | [Peekaboo 브리지](/ko/platforms/mac/peekaboo)                                                  |
| 명령 승인 구성              | [실행 승인](/ko/tools/exec-approvals), [고급 세부 정보](/ko/tools/exec-approvals-advanced) |
| Mac 노드 명령 및 앱 IPC 검사    | [macOS IPC](/ko/platforms/mac/xpc)                                                             |
| 로그 캡처                             | [macOS 로깅](/ko/platforms/mac/logging)                                                     |
| 소스에서 빌드                        | [macOS 개발 설정](/ko/platforms/mac/dev-setup)                                                 |

## 관련 항목

- [플랫폼](/ko/platforms)
- [시작하기](/ko/start/getting-started)
- [Gateway](/ko/gateway)
- [실행 승인](/ko/tools/exec-approvals)
