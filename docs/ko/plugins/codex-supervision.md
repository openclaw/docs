---
read_when:
    - Codex Desktop 또는 CLI 세션이 OpenClaw에 표시되도록 하려는 경우
    - 저장되었거나 유휴 상태인 로컬 Codex 세션에서 분기하거나 해당 세션을 보관해야 합니다
    - 페어링된 Node에서 Codex 세션과 대화 기록을 노출합니다
sidebarTitle: Codex supervision
summary: OpenClaw Node 전반에서 보관 처리되지 않은 네이티브 Codex 세션과 페이지가 매겨진 트랜스크립트를 탐색합니다
title: Codex 세션 감독하기
x-i18n:
    generated_at: "2026-07-12T15:32:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e9378214df3f400b793b4a2c7bd91fb607a73910d4046f69d26debe308869df6
    source_path: plugins/codex-supervision.md
    workflow: 16
---

Codex 감독은 공식 `codex` Plugin에서 명시적으로 활성화해야 하는 기능입니다. 이 기능은 Gateway 컴퓨터와 감독을 명시적으로 활성화한 페어링된 컴퓨터의 보관되지 않은 Codex Desktop 및 CLI 소스 세션을 일반 세션 사이드바와 채팅 창에 표시합니다.

초기 릴리스에서는 의도적으로 소유권 범위를 좁게 유지합니다.

- 저장되었거나 유휴 상태인 로컬 세션은 범위가 제한된 영구 사용자 및 어시스턴트 기록으로 모델이 고정된 OpenClaw 채팅을 생성할 수 있습니다. 첫 번째 메시지는 네이티브 스냅샷 포크를 생성한 다음, Codex App Server가 해당 포크에 선택한 모델과 제공자를 정확히 사용하여 전체 Codex 하네스 스레드를 시작합니다. 이후 턴에서는 정식 네이티브 스레드의 영구 저장된 쌍을 복원하며, 감독 바인딩은 OpenClaw가 다른 런타임, 모델 또는 폴백으로 대체하지 못하게 합니다. 별도의 네이티브 Codex 컨트롤에서는 여전히 이 영구 저장된 쌍을 변경할 수 있습니다. 이미 생성된 브랜치는 기존 채팅을 엽니다.
- 다른 Codex 프로세스에서 발견된 저장 세션의 실시간 활동 여부는 알 수 없습니다. 이 세션은 브랜치를 생성할 수 있으며, 다른 Codex 클라이언트가 사용하고 있지 않다고 운영자가 확인한 후에만 보관할 수 있습니다.
- 활성 소스는 계속 표시되지만 현재 턴이 완료될 때까지 브랜치를 생성하거나 보관할 수 없습니다. 이미 감독되는 채팅이 있으면 **채팅 열기**를 계속 사용할 수 있습니다.
- 페어링된 Node의 세션은 범위가 제한된 커서 페이지네이션 방식의 App Server 읽기를 통해 영구 저장된 트랜스크립트를 노출합니다. 원격에서 계속하려면 향후 스트리밍 Node 브리지가 필요하며, 원격 보관에는 러너 소유권 리스 또는 이에 상응하는 펜싱도 필요합니다.
- 보관된 세션은 목록에 표시되지 않습니다. 저장되었거나 유휴 상태인 로컬 세션은 다른 Codex 클라이언트가 사용하고 있지 않다고 운영자가 확인한 후에만 보관할 수 있습니다.

## 시작하기 전에

- Gateway에 공식 `@openclaw/codex` Plugin을 설치합니다. OpenClaw macOS 앱에서는 Codex 기능을 활성화할 때 이를 설치할 수 있으며, CLI 설치 환경에서는 `openclaw plugins install @openclaw/codex`를 실행할 수 있습니다.
- 세션을 표시하려는 각 컴퓨터에 Codex Desktop 또는 Codex CLI를 설치하고 로그인합니다.
- 원격 컴퓨터를 OpenClaw Node로 페어링합니다. 각 컴퓨터에서 로컬로 명시적 활성화가 필요하며, Gateway에서만 감독을 활성화해도 다른 Node에는 권한이 부여되지 않습니다.
- 소유자가 제어하는 Gateway를 사용합니다. 세션 제목, 작업 디렉터리 및 Git 브랜치에서 민감한 프로젝트 정보가 노출될 수 있습니다.

## 감독 활성화

안내형 `openclaw onboard` 및 macOS 최초 실행 설정은 네이티브 Codex 설치를 감지하고 선택한 추론 백엔드를 성공적으로 활성화한 후 Codex 감독을 설치하고 활성화하려고 시도합니다. Codex가 기본 백엔드일 필요는 없습니다. 이러한 기회 기반 Plugin 활성화에 성공하면 감독을 사용할 수 있습니다. 감독이 처음 연결될 때 App Server 사용 가능 여부를 확인합니다. Codex Plugin을 명시적으로 비활성화하거나 정책으로 차단하면 기회 기반 활성화가 방지되며, 기존에 명시적으로 설정된 `supervision.enabled: false`는 에이전트용 감독 도구를 비활성화합니다. 운영자 카탈로그는 Codex Plugin이 활성 상태인 동안 항상 등록됩니다. 기존 설치에서는 동일한 기능을 수동으로 활성화할 수 있습니다.

`openclaw.json`에서 `codex` Plugin과 해당 감독 기능을 활성화합니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

`plugins.allow`가 있으면 `codex`를 포함합니다. Plugin 활성화를 변경한 후 Gateway를 다시 시작합니다.

명시적인 `appServer` 연결 설정이 없으면 감독은 네이티브 사용자 Codex 홈을 대상으로 별도의 관리형 stdio 감독 연결을 사용합니다. 일반 Codex 하네스는 기본적으로 에이전트 범위로 유지됩니다. 따라서 일반 OpenClaw 턴이 네이티브 Codex 상태를 공유하지 않으면서도 두 앱 모두에서 네이티브 세션을 볼 수 있습니다. 하네스에서도 해당 상태를 공유해야 한다면 `appServer.homeScope: "user"`를 명시적으로 설정합니다. 감독은 명시적인 `appServer` 연결 설정을 로컬 사용자 홈 기본값으로 대체하지 않고 그대로 따릅니다.

**Codex** 사이드바 그룹에서 채택한 채팅은 일반 하네스 세션이 아닙니다. 비공개 감독 바인딩은 소스 읽기, 정식 브랜치 생성, 기록 주입 및 이후 모든 턴에 감독 연결을 사용합니다. 기본 로컬 연결을 사용하면 다른 세션의 기본값을 변경하지 않으면서 네이티브 사용자 Codex 홈, 인증 및 제공자 구성을 유지합니다.

기본 로컬 감독 연결에서는 저장소를 네이티브 Codex 클라이언트와 공유합니다. OpenClaw는 다른 클라이언트가 동일한 실시간 App Server 프로세스를 공유한다고 가정하지 않으며, 네이티브 상태 소유권은 프로세스 로컬입니다. 따라서 감독 App Server가 `notLoaded`로 보고하는 스레드는 유휴 상태가 아니라 **저장됨 / 활동 여부 알 수 없음**으로 처리합니다.

세션을 표시하려는 모든 헤드리스 Node 호스트에서도 동일하게 명시적으로 활성화합니다. 네이티브 OpenClaw macOS 앱은 페어링된 Gateway에 Codex 카탈로그를 알릴 때 동일한 로컬 설정을 읽습니다. 페어링된 네이티브 Mac 카탈로그는 설정되지 않았거나 명시적으로 `appServer.homeScope: "user"`로 설정된 상태에서 기본값 또는 명시적인 `appServer.transport: "stdio"`만 지원합니다. 해당 stdio 프로세스에는 `command`, `args` 및 `clearEnv`가 적용됩니다. Mac 구성에서 `"unix"`, `"websocket"` 또는 `homeScope: "agent"`를 선택하면 앱은 카탈로그 기능이나 명령을 알리지 않으며, 오래된 직접 호출은 사용자 Codex 홈을 노출하거나 다른 로컬 stdio App Server를 생성하는 대신 실패합니다.

새로 알린 Node 명령은 Node의 승인된 명령 범위를 변경합니다. Gateway 호스트에서 업데이트를 승인합니다.

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

보관되지 않은 Codex 세션도 호스트별로 그룹화되어 기본 Control UI 사이드바에 표시됩니다. 세션을 선택하면 저장된 트랜스크립트를 읽을 수 있습니다. 뷰어는 최신 Codex `thread/turns/list` API를 `itemsView: "full"`과 함께 사용하며 요청당 최대 20개 턴을 로드합니다. **이전 트랜스크립트 항목 로드**는 최신 페이지의 불투명한 App Server 커서를 따릅니다. 로드된 페이지는 시간순으로 렌더링됩니다. 뷰어는 범위가 제한되지 않은 `thread/read` 기록을 로드하지 않습니다. 20 MiB 전송 안전 상한을 초과하는 페이지는 Node 또는 Gateway 연결에 위험을 초래하는 대신 안전하게 실패합니다.

일반 세션 사이드바에서 **Codex** 그룹을 여십시오. 동일한 세션이 호스트별로 그룹화되어 나열됩니다. **세션 더 로드**는 이전 행이 있는 각 호스트의 다음 페이지를 추가하며, 추가된 행은 사이드바가 주기적으로 새로 고쳐져도 유지됩니다. 네이티브 검색은 트랜스크립트 미리 보기와도 일치할 수 있으므로 쿼리를 App Server로 보내지 않고, 반환되는 각 검색 페이지에서 호스트별로 제한된 수의 네이티브 페이지만 스캔합니다.

호스트 가용성과 스레드 상태는 별개입니다. **오프라인** 또는 **사용할 수 없음**은 호스트 새로 고침 상태를 나타냅니다. 사용할 수 없는 호스트는 새로운 세션 행을 반환하지 않으며 스레드의 네이티브 상태를 `offline`으로 변경하지 않습니다. 세션 행에는 `idle`, `active`, `notLoaded` 또는 오류와 같은 Codex 상태가 사용됩니다. 한 호스트에서 실패해도 정상 호스트의 결과는 숨겨지지 않습니다.

## 운영자 CLI 사용

터미널 CLI는 보관되지 않은 동일한 카탈로그와 Gateway 로컬 분기 및 보관 작업을 제공합니다.

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

`openclaw codex sessions` 옵션:

- `--search <text>`는 세션 제목을 대소문자 구분 없이 검색합니다.
- `--host <id>`는 응답을 `gateway:local` 또는 `node:<node-id>`와 같은 하나의 안정적인 카탈로그 호스트로 제한합니다.
- `--limit <count>`는 호스트당 행 수를 1~100개로 설정하며, 기본값은 50입니다.
- `--cursor <cursor>`는 한 호스트의 다음 페이지를 이어서 조회하므로 `--host`가 필요합니다.
- `--json`은 구조화된 Gateway 응답을 출력합니다.

세 명령 모두 Gateway 클라이언트에서 `--url`, `--token`, `--timeout <ms>`를 상속합니다. 세션 목록 조회의 기본 제한 시간은 콜드 상태의 페어링된 Node 카탈로그도 완료될 수 있도록 75,000 ms이며, 계속 및 보관의 기본 제한 시간은 30,000 ms입니다. 또한 공유 `--expect-final` 스위치도 제공하지만, 이 단항 관리 RPC의 동작은 변경되지 않습니다.
각 명령에는 Gateway의 `operator.write` 범위가 필요합니다.
각 하위 명령에서 표준 `-h, --help` 출력을 사용할 수 있습니다.
보관된 항목 또는 보관된 항목 포함 옵션은 없습니다. `sessions`는 페어링된 호스트를 나열할 수 있지만, `continue`와 `archive`는 항상 `gateway:local`을 대상으로 합니다. 페어링된 행은 목록 조회만 가능합니다. 보관에는 항상 `--confirm-no-other-runner`가 필요합니다.

이러한 셸 명령은 채팅 내 `/codex` 런타임 명령과는 별개입니다.
`/codex threads [filter]`은 현재 대화 연결에서 사용할 수 있는 App Server 스레드를
나열합니다. `/codex sessions --host <node>`는 감독 플릿 카탈로그가 아니라 한 Node에서 재개할 수 있는 Codex
CLI 세션 파일을 나열합니다. `/codex
resume` 및 `/codex bind`는 안전하게 감독되는 브랜치를 생성하는 대신 현재 대화를 연결하며,
모델이 고정된 감독 대상 Chat은 이러한 바인딩 변경을 거부합니다.
`/codex continue` 또는 `/codex archive` 런타임 명령은
존재하지 않습니다.

## 로컬 세션에서 분기하기

Gateway 컴퓨터의 저장된 행 또는 유휴 행에서 **Continue as branch**를 선택하십시오.
OpenClaw은 일반 Chat 항목을 생성하고, 소스에서 마지막으로 영구 저장된 종료 턴(완료됨, 중단됨 또는
실패함)까지 범위가 제한된 사용자 및 어시스턴트 기록을 미러링하며, 대기 중인 하네스 브랜치를
기록한 후 Chat을 엽니다. 일반 모델 선택기는 잠겨 있지만, 아직 구체적인 모델이나 제공자는
선택되지 않았습니다. 소스는 재개되지 않으며 정식 하네스 스레드도 아직 시작되지 않습니다.
이 작업을 반복하면 다른 브랜치를 생성하는 대신 기존 Chat이 열립니다.

미러는 세 가지 제한을 모두 충족하는 가장 최근의 표시 가능한 후반부를 유지합니다. 사용자 또는
어시스턴트 메시지는 최대 200개, UTF-8 텍스트는 총 512 KiB, 메시지당 64 KiB입니다.
크기가 제한을 초과하는 메시지는 표시자와 함께 잘리고, 한도에 도달하면 오래된 메시지는
생략됩니다. 이미지 또는 로컬 이미지 입력은 리터럴 `[Image attachment]` 플레이스홀더가 되며,
이미지 데이터와 로컬 경로는 복사되지 않습니다.

첫 번째 일반 Chat 메시지를 전송하여 작업을 시작하십시오. Codex 하네스는 실제 승인, 정보 요청,
이벤트 및 전달 핸들러를 설치합니다. 모델이나 제공자 재정의를 지정하지 않고 감독 연결에서
임시 네이티브 포크를 사용하여 소스 스냅샷을 고정합니다. Codex App Server는 현재 네이티브
구성에서 둘 다 선택하고 실제 선택 결과를 반환합니다. 동일한 연결에서 OpenClaw은 반환된 쌍을
정확히 사용해 해당 cwd 및 런타임 정책에 따라 정식 `appServer` 소스 전체 하네스 스레드를
시작하고, 범위가 제한된 표시 기록을 주입한 후 임시 포크를 보관 처리합니다. 정식 스레드에는
OpenClaw 하네스 도구 전체가 제공됩니다. 이는 전체 네이티브 롤아웃 복제본이 아니라 표시 기록
브랜치입니다. 소스 추론, 도구 호출 및 도구 결과는 생략됩니다. 이 턴과 이후의 모든 턴은 다른
OpenClaw 모델 런타임이나 일반 agent-home 하네스가 아닌, 감독되는 Codex 연결에서 계속
진행됩니다.

반환된 선택 결과가 소스의 과거 모델을 증명하지는 않습니다. 현재 네이티브 구성이 소스의 마지막
턴에 기록된 모델과 다르면 Codex가 일반적인 모델 불일치 경고를 표시합니다. OpenClaw은 반환된
쌍을 사용하여 정식 스레드를 시작합니다. Codex는 해당 정식 스레드의 네이티브 모델과 제공자를
영구 저장하며, OpenClaw이 모델 및 제공자 재정의를 생략하므로 이후 재개 시에도 이 설정이
유지됩니다. 별도의 네이티브 Codex 제어를 통해 정식 스레드가 변경되면 OpenClaw은 Codex가
영구 저장한 선택을 수락합니다. OpenClaw은 외부 모델이나 폴백 체인으로 절대 대체하지 않습니다.

감독이 적용되고 모델이 잠긴 Chat은 삭제할 수 없으며, 모델을 전환하거나 `/new`
또는 `/reset`을 사용하거나, Gateway 세션 재설정 작업을 호출하거나, 일반
**세션 포크** 작업을 사용할 수 없습니다. `/codex model <model>`, `/codex
bind`, `/codex resume`(`--bind here`를 사용하는 노드 세션 포함)를 통한 변경과
`/codex detach` 또는 `/codex unbind`도 잠긴 네이티브 바인딩을 교체하거나
지우므로 거부됩니다. `/codex model` 조회와 `/codex fast`,
`/codex permissions`, `/codex threads`는 계속 사용할 수 있습니다. 다른
모델이나 새 스레드가 필요하면 별도의 일반 세션을 시작하십시오.

이 Chat의 감독을 활성화된 상태로 유지하십시오. 감독이 비활성화되거나 저장된
연결 바인딩을 사용할 수 없게 되거나 일관성이 깨지면, 일반 agent-home 세션으로
이동하는 대신 해당 턴이 실패-폐쇄됩니다.

`codex` Plugin을 비활성화하거나 제거해도 해당 소유권은 해제되지 않으며
Chat에서 다른 모델을 사용할 수 있게 되지도 않습니다. 잠긴 Chat은 보존되지만
사용할 수 없는 상태로 유지됩니다. 이를 재개하려면 동일한 Plugin을 다시
설치하거나 활성화하고 Gateway를 재시작하십시오. 이러한 의도적인 실패-폐쇄
동작은 보존 정리 또는 일시적인 Plugin 중단으로 인해 네이티브 바인딩이
소유자 없이 방치되는 것을 방지합니다.

`codex_threads` 에이전트 도구도 동일한 경계를 따릅니다. 다른 포크를 연결하거나
Chat에 바인딩된 네이티브 스레드를 보관할 수 없습니다. 목록 조회와 메타데이터
전용 읽기는 계속 사용할 수 있습니다. 원시 대화 기록을 읽으려면
`allowRawTranscripts`가 필요합니다. 원시 액세스가 비활성화되면 네이티브
검색에 대화 기록 미리보기가 포함되므로 `codex_threads`는 목록 검색도
거부합니다. Control UI와 운영자 CLI에서는 범위가 제한된 제목 전용 검색을
계속 제공합니다. 관련 없는 미소유 스레드의 이름 변경, 보관 해제, 분리된 포크,
보관에는 `allowWriteControls`가 필요합니다. 어느 옵션도 잠긴 바인딩을
우회하지 않습니다.

OpenClaw는 소스 스레드를 단순히 나열하거나 대기 중인 Chat을 표시하는 동안에는
승인 요청을 구독하거나 응답하지 않습니다. 첫 번째 턴에서 별도의 정규 하네스
스레드를 시작하면, 경합하는 롤아웃 작성자를 만들지 않고 다른 Codex 프로세스가
소스를 계속 소유할 수 있습니다.

원래 CLI 또는 VS Code 소스는 네이티브 클라이언트와 OpenClaw 카탈로그에서 계속
표시됩니다. 정규 브랜치는 네이티브 Codex 스레드로 저장되지만 소스 종류는
`appServer`입니다. Codex Desktop 또는 다른 네이티브 클라이언트가 이 소스
종류를 필터링할 수 있으므로, 브랜치 자체가 모든 네이티브 기록 보기에 표시된다고
보장할 수 없습니다.

OpenClaw의 App Server가 활성 상태로 보고한 행에서는 새 브랜치를 시작할 수
없습니다. 현재 턴이 완료될 때까지 기다린 후 카탈로그를 새로 고치십시오. Codex
App Server는 하나의 프로세스 내에서 변경 작업을 직렬화하지만, 독점적인
프로세스 간 실행기 또는 승인 소유자 임대를 제공하지는 않습니다.

**저장됨 / 활동 알 수 없음** 행의 경우 Chat 미러와 첫 번째 턴 스냅샷 고정은
마지막으로 터미널 상태가 영구 저장된 턴까지의 Codex 상태를 사용합니다. 소스
스레드는 재개, 중단 또는 보관되지 않습니다. 다른 프로세스에서 진행 중인 턴이
있다면 해당 턴의 최신 진행 중 작업이 브랜치에 포함되지 않을 수 있습니다.

## 로컬 세션 보관

저장되었거나 유휴 상태인 Gateway 로컬 행에서 **보관**을 선택한 다음, 다른
Codex 클라이언트 또는 OpenClaw 실행기가 해당 스레드나 그 스레드에서 생성된
하위 항목을 사용하고 있지 않은지 확인하십시오. OpenClaw는 프로세스 로컬
상태를 새로 읽고, 상태가 `idle` 또는 `notLoaded`일 때만 진행하여 네이티브
Codex 보관 작업을 호출한 뒤 보관되지 않은 목록에서 세션을 제거합니다. 네이티브
Codex는 해당 스레드에서 생성된 하위 항목도 보관하려고 시도합니다.

새로 읽은 결과에서 세션이 활성 상태 또는 오류 상태로 보고되거나, 페어링된
노드에 속하거나, 새로 생성된 감독 대상 Chat에 아직 해당 소스에서 파생된 대기
중인 브랜치가 있으면 보관을 사용할 수 없습니다. 소스를 보관하기 전에 Chat의
첫 번째 메시지를 전송하여 정규 브랜치를 구체화하십시오. 또한 OpenClaw가 활성
바인딩이 정확한 대상 스레드 또는 보관되지 않은 생성 하위 항목을 소유하고 있음을
알고 있는 경우에도 보관이 차단됩니다. OpenClaw는 모든 페이지에 걸쳐 실험적인
Codex 하위 항목 조회를 수행합니다. 잘못된 응답, 요청 실패, 반복되는 커서 또는
스레드, 안전 제한 소진이 발생하면 보관이 거부됩니다.

읽기, 하위 항목 열거, 보관 요청은 하나의 조건부 작업이 아니므로 그 사이에
여전히 턴이 시작될 수 있습니다. App Server 상태 역시 독립적인 프로세스 간에
공유되지 않습니다. 따라서 알 수 없는 클라이언트와 이러한 경합에 대한 안전
경계는 확인 단계입니다. 확인하기 전에 다른 모든 클라이언트를 종료하거나 어떤
방식으로든 사용 중이 아님을 검증하십시오. Codex Desktop, Codex CLI 또는
소유자가 승인한 네이티브 스레드 관리 흐름을 사용하여 보관된 스레드를
복원하십시오. 보관을 해제하면 다시 표시됩니다.

```bash
codex unarchive <thread-id>
```

## 페어링된 노드의 제한 이해

페어링된 노드는 버전이 지정된 읽기 전용
`codex.appServer.threads.list.v1` 및
`codex.appServer.thread.turns.list.v1` 명령을 노출합니다. Gateway는 원시 App
Server 엔드포인트가 아니라 정규화된 메타데이터와 명시적으로 요청된 범위 제한
대화 기록 페이지만 수신합니다. 현재 노드 호출 전송은 요청/응답만 지원하므로
Codex 하네스에 필요한 장기 실행 이벤트, 승인, 스트리밍 수명 주기를 전달할 수
없습니다.

따라서 원격 행은 계속 표시되지만, 원격 스레드가 유휴 상태여도 **계속** 또는
**보관**을 제공하지 않습니다. 계속하기 위한 노드 측 스트리밍 실행기 브리지와
보관을 위한 안전한 실행기 소유권 경계가 마련될 때까지 해당 컴퓨터에서 Codex를
사용하십시오.

## 메타데이터 및 권한

카탈로그 행에는 다음 항목이 포함될 수 있습니다:

- 스레드 및 세션 식별자
- 제목 및 작업 디렉터리
- 현재 상태 및 활성 대기 플래그
- 생성, 업데이트 및 활동 타임스탬프
- 소스, 모델 제공자, Codex CLI 버전 및 Git 브랜치

카탈로그 프로젝션에서는 대화 기록 미리 보기, 턴, 롤아웃 경로,
Codex 홈 경로, Git 원격 저장소, 커밋 SHA 및 원시 App Server 오류를 제외합니다. 카탈로그
액세스와 Control UI 대화 기록 읽기에는 `operator.write` Gateway
범위가 필요합니다. 두 노드 명령 모두 읽기 전용이지만, 플릿 집계에서 표준 `node.invoke`
경로를 사용하기 때문입니다.

`supervision.allowRawTranscripts`와 `supervision.allowWriteControls`는
자율 에이전트 및 독립 실행형 MCP 도구를 제어합니다. 둘 다 기본값은 `false`입니다.
감독이 활성화된 경우 원시 대화 기록이 허용되지 않으면 `codex_threads`는
목록 및 메타데이터 전용 읽기 결과에서 대화 기록 미리 보기와 턴을 제거하며,
턴을 포함하는 읽기는 안전하게 실패합니다. 모든 포크, 이름 변경, 보관 및 보관 해제에는
쓰기 제어가 필요합니다. 이러한 옵션은 인증된 Control UI
대화 기록 보기를 제한하지 않으며 바인딩, 호스트, 상태 또는 확인 검사를 우회하지 않습니다.

### 호환성 도구

공식 `codex` Plugin은 기존 에이전트 및 독립 실행형 MCP 클라이언트를 위해
출시된 5개의 Supervisor 도구 이름을 유지합니다.

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list`는 기본적으로 로드된 항목만 반환하며 `loaded_only`
매개변수는 없습니다. `include_stored: true`로 설정하면 Codex의 상태 데이터베이스에서
보관되지 않은 저장 행도 함께 읽습니다. 선택적 `max_stored_sessions` 상한은 기본값이 200이며,
엔드포인트당 1~1,000개의 행을 허용합니다. 로드된 행에는 이 상한이 적용되지 않습니다.
원시 대화 기록 권한이 없으면 목록 결과에서 대화 기록에서 파생된 이름,
미리 보기 및 상세 엔드포인트 오류가 생략됩니다.
`codex_session_read`에는 `allowRawTranscripts`가 필요하며, `include_turns: true`를
지정하면 Codex에 턴도 추가로 요청합니다.

`codex_session_send`와 `codex_session_interrupt`에는
`allowWriteControls`가 필요합니다. 전송은 `mode: "auto" | "start" | "steer"`를 허용하지만,
`"start"`는 항상 거부되며 `"auto"`와 `"steer"`는 모두 읽을 수 있는
활성 턴만 조정할 수 있습니다. 유휴 스레드는 전체 하네스가 계속하기 전에 승인 및 도구
핸들러를 설치하는 **Codex 세션**을 사용하라는 안내와 함께 거부됩니다. 중단 역시
읽을 수 있는 활성 턴이 필요합니다. 이러한 도구는 유휴 소스 스레드를
재개하거나 시작하지 않습니다.

`openclaw doctor --fix`는 폐기된 `codex-supervisor` 항목과 해당 엔드포인트
및 권한 필드, Plugin 허용/거부 정책 참조를 명시적인 정식 설정을 덮어쓰지 않고
공식 `codex` Plugin으로 이동합니다. 독립 실행형 호환성 MCP 어댑터는 계속해서
해당 Plugin에서 동일한 5개 도구를 로드하며, 레거시 정책 환경 변수는 신뢰할 수 있는
해당 어댑터 내부에서만 적용됩니다.

모든 감독 구성 필드에 대해서는
[Codex 하네스 참조](/ko/plugins/codex-harness-reference#supervision)를 참조하십시오.

## 문제 해결

**세션이 표시되지 않음:** `@openclaw/codex`가 설치되어 있고, Plugin과
`supervision.enabled`가 모두 true이며, 현재 Plugin 허용 목록에서
`codex`가 허용되고, 세션이 보관되지 않았는지 확인하십시오. 활성화 설정을 변경한 후에는
Gateway 또는 노드를 다시 시작하십시오.

**계속이 비활성화됨:** 매핑되지 않은 행이 활성 상태이거나, 페어링된 노드에 속하거나,
호스트가 오프라인이거나, 다른 작업이 대기 중입니다. Gateway 로컬에 저장된 유휴
행에서는 안전하지 않은 정확한 스레드 인계 대신 **브랜치로 계속**을 제공합니다. 이미
감독되는 Chat이 있는 행에서는 **Chat 열기**를 제공합니다.

**보관이 비활성화됨:** 다른 실행기가 없다는 확인을 거친 후, 저장됨/활동 알 수 없음 상태와
유휴 상태인 Gateway 로컬 행을 보관할 수 있습니다. 활성, 오류,
오프라인, 페어링된 노드, 브랜치 대기 중 및 알려진 정확한 바인딩 소유자 행은
보관 작업에 대해 읽기 전용으로 유지됩니다.

**보관된 세션이 사라짐:** 예상된 동작입니다. 감독 페이지에는
보관된 항목 보기가 없습니다. `codex unarchive <thread-id>`를 실행하거나 Codex Desktop을 사용하여
다시 표시하십시오.

**이전 `codex-supervisor` 구성이 남아 있음:** `openclaw doctor --fix`를 실행하십시오. Doctor는
명시적인 Codex 설정을 덮어쓰지 않고 폐기된 Plugin 항목과 관련 Plugin 정책 참조를
`plugins.entries.codex.config.supervision`으로 이동합니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 참조](/ko/plugins/codex-harness-reference)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [Codex 감독 아키텍처](/ko/specs/codex-supervision)
- [노드](/ko/nodes)
- [Gateway 보안](/ko/gateway/security)
