---
read_when:
    - macOS 앱 설치하기
    - macOS에서 로컬 Gateway 모드와 원격 Gateway 모드 중 선택하기
    - macOS 앱 릴리스 다운로드를 찾고 있습니다
summary: OpenClaw macOS 메뉴 막대 앱 설치 및 사용하기
title: macOS 앱
x-i18n:
    generated_at: "2026-07-16T12:46:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

macOS 앱은 OpenClaw **메뉴 막대 컴패니언**입니다. 기본 트레이 UI, macOS
권한 요청, 알림, WebChat, 음성 입력, Canvas 및
`system.run` 같은 Mac 호스팅 Node 도구를 제공합니다.

CLI와 Gateway만 필요하십니까? [시작하기](/ko/start/getting-started)부터 확인하십시오.

## 다운로드

[OpenClaw GitHub 릴리스](https://github.com/openclaw/openclaw/releases)에서 macOS 앱 빌드를 받으십시오.
릴리스에 macOS 앱 자산이 포함되어 있으면 다음을 찾으십시오.

- `OpenClaw-<version>.dmg` (권장)
- `OpenClaw-<version>.zip`

일부 릴리스에는 CLI, 증빙 자료 또는 Windows 자산만 포함됩니다. 최신 릴리스에
macOS 앱 자산이 없으면 자산이 포함된 가장 최신 릴리스를 사용하거나
[macOS 개발 환경 설정](/ko/platforms/mac/dev-setup)을 통해 소스에서 빌드하십시오.

## 처음 실행

1. **OpenClaw.app**을 설치하고 실행하십시오.
2. 로컬 Gateway를 사용하려면 **This Mac**을 선택하고, 그렇지 않으면 원격 Gateway에 연결하십시오.
3. 앱이 일치하는 CLI 런타임을 설치하는 동안 기다리십시오. 로컬 모드에서는
   Gateway도 설치하고 시작합니다.
4. 실시간 모델 확인을 통해 추론 연결을 설정하십시오. 확인을 통과하면 OpenClaw가
   나머지 설정을 처리합니다.
5. macOS 권한 체크리스트를 완료하고 온보딩 테스트 메시지를 보내십시오.

앱이 기본 에이전트에 모델이 구성된 기존 Gateway에 연결되면
해당 Gateway가 이미 설정된 것으로 간주하여 제공자 온보딩과
OpenClaw를 건너뛰고 대시보드를 엽니다. Gateway에 연결할 수 없거나
기본 에이전트에 모델이 없으면 복구를 위해 추론 온보딩을 계속
사용할 수 있습니다.

CLI/Gateway 설정 경로는 [시작하기](/ko/start/getting-started)를 참조하십시오.
권한 복구는 [macOS 권한](/ko/platforms/mac/permissions)을 참조하십시오.

## 업데이트

대시보드 업데이트 카드에는 앱이 업데이트할 항목이 표시됩니다.

- **Mac 앱 + Gateway 업데이트**는 서명된 앱이 로컬 launchd
  Gateway를 소유한다는 의미입니다. Sparkle이 앱을 먼저 업데이트하며, 앱을 다시 실행하면
  일치하는 버전으로 Gateway를 자동 업데이트하고 재시작한 다음
  연결을 확인합니다.
- **Gateway 업데이트**는 앱이 원격 Gateway, 수동으로
  관리되는 로컬 Gateway 또는 앱이 소유하지 않는 다른 설치에 연결되어 있다는 의미입니다. 이 버튼은
  Mac 앱을 변경하는 대신 해당 Gateway의 일반 업데이트 흐름을 실행합니다.

조정된 업데이트에 실패하면 재시도,
[업데이트 가이드](/ko/install/updating), Discord 작업이 제공되는 설정 형식 창이 계속 표시됩니다. 자동 복구는
더 최신 버전의 Gateway로 다운그레이드하거나 `extended-stable` 채널 고정을 재정의하지 않습니다.

업데이트가 성공하면 앱은 사람이 가장 최근에 사용한
최상위 직접 세션을 찾아 해당 에이전트에 일회성 업데이트 이벤트를 제공합니다. Heartbeat와
Cron 활동은 이 선택에 영향을 주지 않습니다. 그러면 에이전트가 사용자가 가장 자주 사용했을 가능성이 높은
대화에서 다시 맞이할 수 있습니다. 원격 모드에서는 앱이
로컬 Mac Node 런타임만 업데이트하며 원격 Gateway가 앱보다 이전 버전이면 알림을
건너뜁니다.

Sparkle은 Gateway의 `update.channel` 설정을 따릅니다. `beta` 및 `dev`은
베타 앱 빌드를 사용하도록 설정하며, `stable`, `extended-stable` 및 누락되거나 알 수 없는 값은
안정적인 앱 빌드를 계속 사용합니다.

## 대시보드 링크 열기

macOS 앱의 내장 대시보드에서 외부 웹 링크를 클릭하면 대시보드 탐색을 계속 표시하면서 창 너비의 절반 크기로 조절 가능한 브라우저 사이드바에 링크가 열립니다. 구분선을 드래그하여 다른 너비를 선택할 수 있으며 앱이 이를 기억합니다. 각 링크는 자체 탭에서 열리고, 여러 페이지가 열리면 탭 막대가 나타나며, 같은 링크를 다시 클릭하면 기존 탭을 재사용합니다. 탭을 드래그하여 순서를 변경하고, 탭 닫기 버튼이나 가운데 클릭으로 닫을 수 있으며, 탭을 마우스 오른쪽 버튼으로 클릭하면 **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab**, **Close Other Tabs**를 사용할 수 있습니다. 창 제목 표시줄의 뒤로/앞으로 컨트롤과 트랙패드 스와이프로 대시보드 기록을 탐색하며, 사이드바 자체의 뒤로/앞으로 컨트롤로 활성 탭의 기록을 탐색합니다. 사이드바에는 새로고침, 기본 브라우저에서 열기 및 닫기 컨트롤도 있습니다.

제목 표시줄 컨트롤은 앱 사이드바를 따릅니다. 사이드바가 펼쳐져 있을 때 뒤로/앞으로 컨트롤은 사이드바 토글 옆의 오른쪽 가장자리에 위치하며, 접혀 있을 때는 검색 버튼(명령 팔레트 열기)과 새 세션 버튼이 표시될 자리를 마련합니다.

외부 링크를 마우스 오른쪽 버튼으로 클릭하여 **Open in Sidebar**, **Open in Default Browser** 또는 **Copy Link**를 선택하십시오. 대시보드에서 보조 키를 누른 클릭과 사용자가 활성화한 새 창 링크는 계속 기본 브라우저에서 열리며, 사이드바 내부의 새 창 링크는 새 사이드바 탭으로 열립니다. 일반적인 브라우저 호스팅 Control UI 페이지에서는 브라우저의 일반 링크 및 컨텍스트 메뉴 동작이 유지됩니다.

## 브라우저 로그인 가져오기

앱이 로컬 Gateway를 사용하는 동안 브라우저 사이드바를 처음 열면 Mac에 쿠키가 있는 Chrome 계열 프로필이 존재하는 경우 대시보드에 닫을 수 있는 배너가 표시됩니다. 배너에서는 에이전트가 탐색에 사용하는 격리된 관리형 프로필로 해당 쿠키를 복사할 수 있습니다. **Import** 컨트롤에서 프로필을 선택하십시오(Touch ID가 필요할 수 있음). 진행 상황과 가져온 쿠키 수가 인라인으로 표시되며 쿠키만 복사됩니다. 비밀번호는 소스 브라우저를 절대 벗어나지 않습니다. 배너를 닫으면 선택 사항이 기록되며 **Settings → General → Browser login → Import…**에서 언제든지 다시 표시할 수 있습니다. 기본 가져오기 흐름과 `browser.allowSystemProfileImport` 게이트에 대해서는 [브라우저](/ko/cli/browser)를 참조하십시오.

## Gateway 모드 선택

| 모드   | 사용 시점                                                                    | 세부 정보 페이지                                        |
| ------ | ------------------------------------------------------------------------------ | -------------------------------------------------- |
| 로컬  | 이 Mac에서 Gateway를 실행하고 launchd를 통해 계속 실행해야 할 때                | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway) |
| 원격 | 다른 호스트에서 Gateway를 실행하고 이 Mac에서 SSH, LAN 또는 Tailnet을 통해 제어할 때 | [원격 제어](/ko/platforms/mac/remote)            |

앱이 Node 호스트 런타임을 재사용하므로 두 모드 모두 설치된 `openclaw` CLI가
필요합니다. 새 Mac에서는 앱이 일치하는 CLI를 자동으로 설치합니다. 그런 다음 로컬
모드는 Gateway 마법사를 시작하고, 원격 모드는 두 번째 로컬 Gateway를 시작하지 않고 선택한
Gateway에 연결합니다.
수동 복구에 대해서는 [macOS의 Gateway](/ko/platforms/mac/bundled-gateway)를 참조하십시오.

## 앱이 소유하는 항목

- 메뉴 막대 상태, 알림, 상태 확인 및 WebChat.
- 화면, 마이크, 음성, 자동화 및 손쉬운 사용에 대한 macOS 권한 요청.
- 기본 Canvas, 카메라/화면 캡처, 알림,
  위치 및 컴퓨터 제어 기능과 CLI Node 호스트의 시스템, 브라우저,
  Plugin, Skills 및 MCP 명령을 결합하는 하나의 Mac Node.
- Mac 호스팅 명령에 대한 실행 승인 요청.
- 승인된 셸 명령을 앱 컨텍스트에서 실행하여 앱의 macOS
  권한 귀속을 유지하면서 CLI 런타임이 공유 Node 정책을 소유하도록 합니다.
- 원격 모드 SSH 터널 또는 직접 Gateway 연결.

앱은 Gateway 또는 일반 CLI 문서를 대체하지 **않습니다**. Gateway
구성, 제공자, Plugin, 채널, 도구 및 보안은 각각의
문서에서 다룹니다.

## macOS 세부 정보 페이지

| 작업                                     | 참조                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway 서비스 설치 또는 디버그 | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway)                                          |
| 클라우드 동기화 폴더 외부에 상태 유지   | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| 앱 검색 및 연결 디버그     | [macOS의 Gateway](/ko/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| launchd 동작 이해              | [Gateway 수명 주기](/ko/platforms/mac/child-process)                                           |
| 권한 또는 서명/TCC 문제 해결    | [macOS 권한](/ko/platforms/mac/permissions)                                             |
| 가장 최근에 사용한 Mac 감지    | [활성 컴퓨터 프레즌스](/ko/nodes/presence)                                                 |
| 원격 Gateway에 연결              | [원격 제어](/ko/platforms/mac/remote)                                                     |
| 메뉴 막대 상태 및 상태 확인 읽기   | [메뉴 막대](/ko/platforms/mac/menu-bar), [상태 확인](/ko/platforms/mac/health)                 |
| 내장 채팅 UI 사용                 | [WebChat](/ko/platforms/mac/webchat)                                                           |
| 음성 깨우기 또는 눌러서 말하기 사용           | [음성 깨우기](/ko/platforms/mac/voicewake)                                                      |
| Canvas 및 Canvas 딥 링크 사용         | [Canvas](/ko/platforms/mac/canvas)                                                             |
| UI 자동화를 위한 PeekabooBridge 호스팅    | [Peekaboo 브리지](/ko/platforms/mac/peekaboo)                                                  |
| 명령 승인 구성              | [실행 승인](/ko/tools/exec-approvals), [고급 세부 정보](/ko/tools/exec-approvals-advanced) |
| Mac Node 명령 및 앱 IPC 검사    | [macOS IPC](/ko/platforms/mac/xpc)                                                             |
| 로그 캡처                             | [macOS 로깅](/ko/platforms/mac/logging)                                                     |
| 소스에서 빌드                        | [macOS 개발 환경 설정](/ko/platforms/mac/dev-setup)                                                 |

## 관련 항목

- [플랫폼](/ko/platforms)
- [시작하기](/ko/start/getting-started)
- [Gateway](/ko/gateway)
- [실행 승인](/ko/tools/exec-approvals)
