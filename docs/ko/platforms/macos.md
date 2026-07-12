---
read_when:
    - macOS 앱 설치하기
    - macOS에서 로컬 Gateway 모드와 원격 Gateway 모드 중 선택하기
    - macOS 앱 릴리스 다운로드 찾기
summary: OpenClaw macOS 메뉴 막대 앱 설치 및 사용
title: macOS 앱
x-i18n:
    generated_at: "2026-07-12T15:30:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6f15d0840b7ceb8ac4d82f2c67c060c4b7e8bd25cbb12c216b93be31cb2604b0
    source_path: platforms/macos.md
    workflow: 16
---

macOS 앱은 OpenClaw **메뉴 막대 동반 앱**입니다. 네이티브 트레이 UI, macOS
권한 요청, 알림, WebChat, 음성 입력, Canvas와 `system.run` 같은
Mac 호스팅 Node 도구를 제공합니다.

CLI와 Gateway만 필요하십니까? [시작하기](/ko/start/getting-started)부터 확인하십시오.

## 다운로드

[OpenClaw GitHub 릴리스](https://github.com/openclaw/openclaw/releases)에서 macOS 앱 빌드를 받으십시오.
릴리스에 macOS 앱 자산이 포함된 경우 다음 파일을 찾으십시오.

- `OpenClaw-<version>.dmg`(권장)
- `OpenClaw-<version>.zip`

일부 릴리스에는 CLI, 증빙 자료 또는 Windows 자산만 포함됩니다. 최신 릴리스에
macOS 앱 자산이 없다면 자산이 포함된 가장 최신 릴리스를 사용하거나
[macOS 개발 환경 설정](/ko/platforms/mac/dev-setup)을 따라 소스에서 빌드하십시오.

## 처음 실행

1. **OpenClaw.app**을 설치하고 실행합니다.
2. 로컬 Gateway를 사용하려면 **This Mac**을 선택하고, 그렇지 않으면 원격 Gateway에 연결합니다.
3. 로컬 모드: 앱이 사용자 공간 런타임과 Gateway를 설치하는 동안 기다립니다.
4. 실제 모델 검사로 추론 연결을 설정합니다. 검사를 통과하면 Crestodian이
   나머지 설정을 처리합니다.
5. macOS 권한 체크리스트를 완료하고 온보딩 테스트 메시지를 전송합니다.

앱이 기본 에이전트에 모델이 구성된 기존 Gateway에 연결되면
해당 Gateway가 이미 설정된 것으로 간주하고 공급자 온보딩과
Crestodian을 건너뛴 후 대시보드를 엽니다. Gateway에 연결할 수 없거나
기본 에이전트에 모델이 없다면 복구를 위한 추론 온보딩을 계속
사용할 수 있습니다.

CLI/Gateway 설정 경로는 [시작하기](/ko/start/getting-started)를 참조하십시오.
권한 복구는 [macOS 권한](/ko/platforms/mac/permissions)을 참조하십시오.

## 업데이트

대시보드 업데이트 카드는 먼저 Sparkle을 통해 서명된 macOS 앱을 업데이트합니다.
앱이 다시 실행되면 앱에서 관리하는 일치하는 로컬 Gateway를 자동으로
업데이트하고 재시작합니다. Homebrew 및 사용자가 관리하는 다른 CLI 설치는
일반 Gateway 업데이트 흐름을 유지하며(카드에서 Gateway 업데이트를 직접 실행),
자동 복구는 더 최신인 Gateway를 다운그레이드하거나
`extended-stable` 채널 고정을 재정의하지 않습니다.

Sparkle은 Gateway의 `update.channel` 설정을 따릅니다. `beta`와 `dev`는
베타 앱 빌드를 사용하도록 옵트인하며, `stable`, `extended-stable`, 누락된 값 또는 알 수 없는 값은
안정 버전 앱 빌드를 계속 사용합니다.

## 대시보드 링크 열기

macOS 앱의 내장 대시보드에서 외부 웹 링크를 클릭하면 크기를 조절할 수 있는 브라우저 사이드바에서 열립니다. 각 링크는 자체 탭에서 열리며, 같은 링크를 다시 클릭하면 기존 탭을 재사용합니다. 탭을 드래그하여 순서를 변경하고, 탭 닫기 버튼이나 가운데 클릭으로 닫을 수 있으며, 탭을 마우스 오른쪽 버튼으로 클릭하면 **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab**, **Close Other Tabs**를 사용할 수 있습니다. 창 제목 표시줄의 뒤로/앞으로 컨트롤과 트랙패드 스와이프는 대시보드 기록을 탐색하며, 사이드바 자체의 뒤로/앞으로 컨트롤은 활성 탭의 기록을 탐색합니다. 사이드바에는 새로고침, 기본 브라우저에서 열기, 닫기 컨트롤도 있으며 너비를 기억합니다.

제목 표시줄 컨트롤은 앱 사이드바의 상태를 따릅니다. 사이드바가 펼쳐져 있으면 뒤로/앞으로 컨트롤이 사이드바 토글 옆의 오른쪽 가장자리에 배치됩니다. 사이드바가 접혀 있으면 검색 버튼(명령 팔레트 열기)과 새 세션 버튼을 위한 공간을 내어 줍니다.

외부 링크를 마우스 오른쪽 버튼으로 클릭하여 **Open in Sidebar**, **Open in Default Browser** 또는 **Copy Link**를 선택하십시오. 대시보드에서 보조 키와 함께 클릭하거나 사용자가 활성화한 새 창 링크는 계속 기본 브라우저에서 열리며, 사이드바 내부의 새 창 링크는 새 사이드바 탭으로 열립니다. 일반 브라우저에서 호스팅되는 Control UI 페이지는 브라우저의 일반적인 링크 및 컨텍스트 메뉴 동작을 유지합니다.

## 브라우저 로그인 가져오기

앱이 로컬 Gateway를 사용하고 Mac에 쿠키가 있는 Chrome 계열 프로필이 존재하면, 대시보드 창에 해당 쿠키를 에이전트가 탐색에 사용하는 격리된 관리형 프로필로 복사할 수 있는 닫기 가능한 배너가 표시됩니다. 배너의 **Import** 컨트롤에서 프로필을 선택하십시오(Touch ID가 필요할 수 있음). 진행 상황과 가져온 쿠키 수가 인라인으로 표시되며 쿠키만 복사됩니다. 비밀번호는 절대 원본 브라우저를 벗어나지 않습니다. 배너를 닫으면 해당 선택이 기록되며, **Settings → General → Browser login → Import…**에서 언제든지 다시 표시할 수 있습니다. 기본 가져오기 흐름과 `browser.allowSystemProfileImport` 게이트는 [브라우저](/ko/cli/browser)를 참조하십시오.

## Gateway 모드 선택

| 모드   | 사용 시점                                                                    | 상세 페이지                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 로컬  | 이 Mac에서 Gateway를 실행하고 launchd를 통해 계속 실행해야 하는 경우                | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway) |
| 원격 | 다른 호스트에서 Gateway를 실행하고 이 Mac에서 SSH, LAN 또는 Tailnet을 통해 제어하는 경우 | [원격 제어](/ko/platforms/mac/remote)            |

로컬 모드에는 설치된 `openclaw` CLI가 필요합니다. 새 Mac에서는 앱이
Gateway 마법사를 시작하기 전에 일치하는 CLI와 런타임을 자동으로 설치합니다.
수동 복구는 [macOS의 Gateway](/ko/platforms/mac/bundled-gateway)를 참조하십시오.

## 앱이 관리하는 항목

- 메뉴 막대 상태, 알림, 상태 확인 및 WebChat
- 화면, 마이크, 음성, 자동화 및 손쉬운 사용에 대한 macOS 권한 요청
- 로컬 Node 도구: Canvas, 카메라/화면 캡처, 알림 및 `system.run`
- Mac에서 호스팅되는 명령에 대한 실행 승인 요청
- 원격 모드 SSH 터널 또는 직접 Gateway 연결

앱은 Gateway 또는 일반 CLI 문서를 대체하지 **않습니다**. Gateway
구성, 공급자, plugins, 채널, 도구 및 보안은 각각의
문서에서 설명합니다.

## macOS 상세 페이지

| 작업                                     | 참고 자료                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway 서비스 설치 또는 디버깅 | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway)                                          |
| 클라우드 동기화 폴더에서 상태 제외   | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 앱 검색 및 연결 문제 디버깅     | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| launchd 동작 이해              | [Gateway 수명 주기](/ko/platforms/mac/child-process)                                           |
| 권한 또는 서명/TCC 문제 해결    | [macOS 권한](/ko/platforms/mac/permissions)                                             |
| 가장 최근에 사용한 Mac 감지    | [활성 컴퓨터 존재 여부](/nodes/presence)                                                 |
| 원격 Gateway에 연결              | [원격 제어](/ko/platforms/mac/remote)                                                     |
| 메뉴 막대 상태 및 상태 검사 확인   | [메뉴 막대](/ko/platforms/mac/menu-bar), [상태 검사](/ko/platforms/mac/health)                 |
| 내장 채팅 UI 사용                 | [WebChat](/ko/platforms/mac/webchat)                                                           |
| 음성 호출 또는 눌러서 말하기 사용           | [음성 호출](/ko/platforms/mac/voicewake)                                                      |
| Canvas 및 Canvas 딥 링크 사용         | [Canvas](/ko/platforms/mac/canvas)                                                             |
| UI 자동화를 위한 PeekabooBridge 호스팅    | [Peekaboo 브리지](/ko/platforms/mac/peekaboo)                                                  |
| 명령 승인 구성              | [실행 승인](/ko/tools/exec-approvals), [고급 세부 정보](/ko/tools/exec-approvals-advanced) |
| Mac Node 명령 및 앱 IPC 검사    | [macOS IPC](/ko/platforms/mac/xpc)                                                             |
| 로그 캡처                             | [macOS 로깅](/ko/platforms/mac/logging)                                                     |
| 소스에서 빌드                        | [macOS 개발 환경 설정](/ko/platforms/mac/dev-setup)                                                 |

## 관련 문서

- [플랫폼](/ko/platforms)
- [시작하기](/ko/start/getting-started)
- [Gateway](/ko/gateway)
- [실행 승인](/ko/tools/exec-approvals)
