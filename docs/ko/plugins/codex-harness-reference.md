---
read_when:
    - 모든 Codex 하네스 구성 필드가 필요합니다
    - app-server 전송, 인증, 탐색 또는 시간 초과 동작을 변경하고 있습니다
    - Codex 하네스 시작, 모델 검색 또는 환경 격리 문제를 디버깅하는 경우
summary: Codex 하네스의 구성, 인증, 검색 및 앱 서버 참조 문서
title: Codex 하니스 참조
x-i18n:
    generated_at: "2026-07-12T15:26:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb3dcb14d9dbd70a225c13f239369b6d9d2cc0b0681aa29265f528287a6a8e4c
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

이 참조 문서에서는 공식 `codex` Plugin의 세부 구성을 다룹니다.
설정 및 라우팅 결정에 대해서는
[Codex 하네스](/ko/plugins/codex-harness)부터 참조하십시오.

## Plugin 구성 범위

모든 Codex 하네스 설정은 `plugins.entries.codex.config` 아래에 있습니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

최상위 필드:

| 필드                       | 기본값                   | 의미                                                                                                                                           |
| -------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 활성화                   | Codex app-server `model/list`의 모델 검색 설정입니다.                                                                                          |
| `appServer`                | 관리형 stdio app-server  | 전송, 명령, 인증, 승인, 샌드박스 및 시간 제한 설정입니다. 일반 하네스는 기본적으로 에이전트 범위 상태를 사용합니다.                             |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw 동적 도구를 초기 Codex 도구 컨텍스트에 직접 포함하려면 `"direct"`를 사용합니다.                                                       |
| `codexDynamicToolsExclude` | `[]`                     | Codex app-server 턴에서 제외할 추가 OpenClaw 동적 도구 이름입니다.                                                                             |
| `codexPlugins`             | 비활성화                 | 연결된 계정 앱에 대한 옵트인 액세스를 포함한 네이티브 Codex Plugin/앱 지원입니다. [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)을 참조하십시오. |
| `computerUse`              | 비활성화                 | Codex Computer Use 설정입니다. [Codex Computer Use](/ko/plugins/codex-computer-use)를 참조하십시오.                                               |
| `supervision`              | 비활성화                 | 보관되지 않은 네이티브 세션 카탈로그, 로컬 브랜치 계속 실행 및 에이전트 도구 정책입니다. [Codex 감독](/plugins/codex-supervision)을 참조하십시오. |

## 감독

감독은 Gateway 컴퓨터와 옵트인된 페어링 Node에서 보관되지 않은 Codex 세션을
나열합니다. 에이전트 하네스와 별도로 활성화하십시오.

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

`supervision` 필드:

| 필드                  | 기본값                  | 의미                                                                                                                                                                                                                                      |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`             | `false`                 | 로컬 세션 카탈로그를 게시하고, Gateway에서는 Codex Sessions 페이지를 위해 옵트인된 페어링 Node의 카탈로그를 집계합니다.                                                                                                                    |
| `endpoints`           | 기본 제공 로컬 엔드포인트 | 유지되는 Codex 감독 에이전트 및 독립 실행형 MCP 도구를 위한 호환성 및 고급 엔드포인트 대상입니다. 사용자 카탈로그와 브랜치 흐름은 이러한 대상을 무시하고 `appServer`에서 확인된 감독 App Server를 사용합니다.                                |
| `allowRawTranscripts` | `false`                 | 감독이 활성화된 상태에서 자율 에이전트 또는 독립 실행형 MCP의 트랜스크립트 읽기와 트랜스크립트에서 파생된 목록 필드를 허용합니다. `codex_threads`의 메타데이터 전용 읽기는 계속 사용할 수 있습니다. 인증된 Control UI 계속 실행은 제어하지 않습니다. |
| `allowWriteControls`  | `false`                 | 감독이 활성화된 상태에서 자율 `codex_threads`의 포크, 이름 변경, 보관 및 보관 해제 변경과 독립 실행형 MCP의 전송, 조정 및 중단 작업을 허용합니다. 다른 바인딩, 호스트, 상태 또는 확인 검사를 우회하지 않습니다.                                 |

엔드포인트 항목에는 다음 필드를 사용할 수 있습니다.

| 필드           | 적용 대상     | 의미                                                                  |
| -------------- | ------------- | --------------------------------------------------------------------- |
| `id`           | 모두          | 안정적인 엔드포인트 ID입니다.                                         |
| `label`        | 모두          | 선택적 표시 레이블입니다.                                             |
| `transport`    | 모두          | `"stdio-proxy"` 또는 `"websocket"`입니다.                             |
| `command`      | `stdio-proxy` | 선택적 App Server 명령입니다.                                         |
| `args`         | `stdio-proxy` | 선택적 명령 인수입니다.                                               |
| `cwd`          | `stdio-proxy` | 선택적 자식 프로세스 작업 디렉터리입니다.                             |
| `url`          | `websocket`   | 필수 WebSocket 또는 지원되는 로컬 소켓 URL입니다.                     |
| `authTokenEnv` | `websocket`   | 값으로 엔드포인트를 인증하는 선택적 환경 변수입니다.                  |

**Codex Sessions** 페이지는 Plugin의 감독 App Server를 사용하며 보관되지 않은
세션만 표시합니다. 명시적인 `appServer` 연결 설정이 없으면 해당 연결은 관리형
사용자 홈 stdio입니다. 저장되었거나 유휴 상태인 행에서는 마지막으로 유지된
소스 터미널 턴까지의 제한된 사용자 및 어시스턴트 기록을 포함하여 모델이 고정된
Chat을 생성할 수 있습니다. 비공개 바인딩은 스냅샷 포크, 정규
`appServer` 소스 브랜치, 기록 삽입 및 이후 턴이 해당 연결을 계속 사용하도록
합니다. 최초 정규 시작에서는 포크가 반환한 쌍을 사용합니다. 이후 재개에서는
OpenClaw 모델 및 제공자 재정의를 생략하여 Codex가 정규 스레드에 유지된 쌍을
복원하도록 합니다. 별도의 네이티브 변경으로 해당 쌍을 업데이트할 수 있지만,
외부 모델 및 폴백 체인은 이를 대체하지 않습니다. 다른 실행자가 없다는 확인 후
저장된 행과 유휴 행을 보관할 수 있습니다. 단, 다른 활성 OpenClaw 바인딩이
정확한 대상 또는 해당 대상에서 생성된 보관되지 않은 하위 항목 중 하나를 소유한
경우에는 보관할 수 없습니다. OpenClaw는 Codex의 하위 항목 페이지네이션을
따르며 열거 오류, 순환 또는 안전 한도 소진 시 실패 시 닫힙니다. 확인 절차는
알 수 없는 네이티브 클라이언트와 상태 확인부터 보관까지의 경쟁 상태도 계속
처리합니다. 감독되는 모델 고정 Chat은 네이티브 바인딩을 보호하는 동안 삭제할
수 없습니다. 활성 소스에서는 브랜치를 생성하거나 보관할 수 없지만 기존의
감독되는 Chat은 계속 열 수 있습니다. 페어링 Node의 모든 행은 읽기 전용으로
유지됩니다. Node 전송은 아직 하네스에 필요한 스트리밍 수명 주기를 제공하지
않습니다.

`appServer.homeScope: "user"`만 설정하면 관리형 하네스 프로세스에서 사용하는
Codex 홈만 변경되며, 플릿 카탈로그는 게시되지 않습니다. 감독을 활성화해도
하네스 기본값은 변경되지 않습니다. 대신 명시적인 `appServer` 연결 설정이
없으면 별도의 감독 연결은 기본적으로 관리형 사용자 홈 stdio를 사용합니다.
명시적인 설정은 해당 연결에 적용됩니다. 대기 중이거나 커밋된 감독 바인딩은
모든 턴에서 해당 연결을 유지합니다. 감독이 비활성화되거나 연결 또는 수명 주기가
달라지면 에이전트 홈 하네스로 폴백하지 않고 실패 시 닫힙니다. 기본 연결은
네이티브 Codex 클라이언트와 저장된 세션을 공유하지만, 프로세스 로컬 활동 상태는
공유하지 않습니다.

레거시 `plugins.entries.codex-supervisor` 설정은 폐기되었습니다. 이전 항목,
엔드포인트 정의, 정책 플래그 및 Plugin 허용/거부 참조를 이 블록으로
마이그레이션하려면 `openclaw doctor --fix`를 실행하십시오. 충돌이 발생하면
명시적인 정규 `codex.config.supervision` 값이 우선합니다.

## App-server 전송

일반 하네스 턴에서 OpenClaw는 공식 Plugin과 함께 제공되는 관리형 Codex
바이너리(현재 `@openai/codex` `0.144.1`)를 시작합니다.

```bash
codex app-server --listen stdio://
```

이렇게 하면 app-server 버전이 로컬에 별도로 설치된 Codex CLI가 아니라 공식
`codex` Plugin에 연결됩니다. 의도적으로 다른 실행 파일을 사용하려는 경우에만
`appServer.command`를 설정하십시오. 격리된 기본 에이전트 홈을 사용하는 일반
관리형 턴은 macOS 데스크톱 번들이 설치되어 있어도 이 고정 패키지를 우선합니다.
[Computer Use](/ko/plugins/codex-computer-use)가 활성화되었거나 `homeScope`가
`"user"`이고 네이티브 Computer Use 상태를 로드할 수 있는 경우에는 관리형
시작이 필요한 macOS 권한을 소유한 데스크톱 앱 바이너리를 대신 우선합니다.
격리된 에이전트 홈의 유효한 Codex 구성에서 네이티브 Computer Use가 활성화된
경우에도 동일한 데스크톱 우선 규칙이 적용됩니다. 데스크톱 앱 번들이 설치되어
있지 않으면 OpenClaw는 고정 패키지 바이너리로 폴백합니다.

실행 파일 핸드오프와 네이티브 구성 펜싱은 실행 중인 하나의 Gateway 프로세스
내에서 클라이언트를 조정합니다. 다른 프로세스가 네이티브 Codex Plugin 구성을
변경한 후에는 Gateway를 다시 시작하십시오.

감독은 별도의 연결을 확인합니다. 명시적인 `appServer` 연결 설정이 없으면
`homeScope: "user"`가 설정된 관리형 stdio를 사용하며, 일반 하네스는
`homeScope: "agent"`가 설정된 관리형 stdio를 계속 사용합니다. 명시적인 연결
설정은 두 경로 모두에 적용됩니다. 일반 하네스가 네이티브 클라이언트와
`$CODEX_HOME`(또는 `~/.codex`)을 공유해야 하는 경우 `homeScope: "user"`를
명시적으로 설정하십시오. 비공개 감독 바인딩은 일반 하네스 기본값과 관계없이
감독 연결을 사용합니다. 독립적인 App Server 프로세스는 각각 별도의 실시간
상태와 승인 상태를 유지합니다.

이미 실행 중인 app-server에는 WebSocket 전송을 사용하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

`appServer` 필드:

| 필드                                          | 기본값                                                 | 의미                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`는 Codex를 실행합니다. 명시적 `"unix"`는 로컬 제어 소켓에 연결하며, `"websocket"`은 `url`에 연결합니다.                                                                                                                                                                                                                                                                                  |
| `homeScope`                                   | `"agent"`                                              | `"agent"`는 일반 하네스 상태를 OpenClaw 에이전트별로 격리합니다. `"user"`는 네이티브 `$CODEX_HOME` 또는 `~/.codex`를 공유하고 네이티브 인증을 사용하며 소유자 전용 스레드 관리를 활성화하는 명시적 옵트인입니다. 사용자 범위는 로컬 stdio 또는 Unix 전송을 지원합니다. 별도의 감독 연결에서는 값이 설정되지 않은 경우 stdio 또는 Unix에는 `"user"`가, WebSocket에는 `"agent"`가 적용됩니다. |
| `command`                                     | 관리형 Codex 바이너리                                  | stdio 전송에 사용할 실행 파일입니다. 관리형 바이너리를 사용하려면 설정하지 마십시오.                                                                                                                                                                                                                                                                                                            |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 전송에 사용할 인수입니다.                                                                                                                                                                                                                                                                                                                                                                 |
| `url`                                         | 설정되지 않음                                          | WebSocket App Server URL 또는 `unix://` URL입니다. 명시적으로 빈 Unix 경로를 지정하면 표준 사용자 홈 제어 소켓을 선택합니다.                                                                                                                                                                                                                                                                     |
| `authToken`                                   | 설정되지 않음                                          | WebSocket 전송용 Bearer 토큰입니다. 리터럴 문자열 또는 `${CODEX_APP_SERVER_TOKEN}` 같은 SecretInput을 허용합니다.                                                                                                                                                                                                                                                                                |
| `headers`                                     | `{}`                                                   | 추가 WebSocket 헤더입니다. 헤더 값에는 리터럴 문자열 또는 SecretInput 값을 사용할 수 있습니다. 예: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                              |
| `clearEnv`                                    | `[]`                                                   | OpenClaw가 상속 환경을 구성한 후 실행된 stdio app-server 프로세스에서 제거할 추가 환경 변수 이름입니다.                                                                                                                                                                                                                                                                                          |
| `remoteWorkspaceRoot`                         | 설정되지 않음                                          | 원격 Codex app-server 작업 공간 루트입니다. 설정하면 OpenClaw는 확인된 OpenClaw 작업 공간에서 로컬 작업 공간 루트를 추론하고, 이 원격 루트 아래에서 현재 cwd 접미사를 유지하며, 최종 app-server cwd만 Codex에 전송합니다. cwd가 확인된 OpenClaw 작업 공간 루트 외부에 있으면 OpenClaw는 Gateway 로컬 경로를 원격 app-server에 전송하는 대신 실패 시 차단합니다. |
| `requestTimeoutMs`                            | `60000`                                                | app-server 제어 영역 호출의 제한 시간입니다.                                                                                                                                                                                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex가 턴을 수락한 후 또는 턴 범위 app-server 요청 후 OpenClaw가 `turn/completed`를 기다리는 동안 적용되는 무활동 시간입니다.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw가 `turn/completed`를 기다리는 동안 도구 인계, 네이티브 도구 완료, 도구 실행 후 원시 어시스턴트 진행, 원시 추론 완료 또는 추론 진행 이후에 사용하는 완료 무활동 및 진행 보호 장치입니다. 도구 실행 후 합성이 최종 어시스턴트 릴리스 제한 시간보다 오랫동안 합법적으로 진행 없이 유지될 수 있는 신뢰할 수 있거나 무거운 워크로드에 사용하십시오. |
| `mode`                                        | 로컬 Codex 요구 사항이 YOLO를 허용하지 않으면 `"yolo"` | YOLO 또는 가디언 검토 실행을 위한 프리셋입니다.                                                                                                                                                                                                                                                                                                                                                  |
| `approvalPolicy`                              | `"never"` 또는 허용된 가디언 승인 정책                 | 스레드 시작, 재개 및 턴에 전송되는 네이티브 Codex 승인 정책입니다.                                                                                                                                                                                                                                                                                                                              |
| `sandbox`                                     | `"danger-full-access"` 또는 허용된 가디언 샌드박스     | 스레드 시작 및 재개에 전송되는 네이티브 Codex 샌드박스 모드입니다. 활성 OpenClaw 샌드박스는 `danger-full-access` 턴을 Codex `workspace-write`로 제한하며, 턴 네트워크 플래그는 OpenClaw 샌드박스 이그레스를 따릅니다.                                                                                                                                                                                 |
| `approvalsReviewer`                           | `"user"` 또는 허용된 가디언 검토자                     | 허용되는 경우 Codex가 네이티브 승인 프롬프트를 검토하도록 하려면 `"auto_review"`를 사용하십시오.                                                                                                                                                                                                                                                                                                 |
| `defaultWorkspaceDir`                         | 현재 프로세스 디렉터리                                 | `--cwd`를 생략했을 때 `/codex bind`가 사용하는 작업 공간입니다.                                                                                                                                                                                                                                                                                                                                 |
| `serviceTier`                                 | 설정되지 않음                                          | 선택적 Codex app-server 서비스 등급입니다. `"priority"`는 고속 모드 라우팅을 활성화하고, `"flex"`는 flex 처리를 요청하며, `null`은 재정의를 해제합니다. 레거시 `"fast"`는 `"priority"`로 허용됩니다.                                                                                                                                                                                               |
| `networkProxy`                                | 비활성화됨                                             | app-server 명령에 Codex 권한 프로필 네트워킹을 사용하도록 옵트인합니다. OpenClaw는 `sandbox`를 전송하는 대신 선택한 `permissions.<profile>.network` 구성을 정의하고 `default_permissions`로 이를 선택합니다.                                                                                                                                                                                     |
| `experimental.sandboxExecServer`              | `false`                                                | 네이티브 Codex 실행이 활성 OpenClaw 샌드박스 내부에서 실행될 수 있도록 지원되는 Codex app-server에 OpenClaw 샌드박스 기반 Codex 환경을 등록하는 미리 보기 옵트인입니다.                                                                                                                                                                                                                           |

`appServer.networkProxy`는 Codex 샌드박스 계약을 변경하므로 명시적으로
설정해야 합니다. 활성화하면 OpenClaw는 생성된 권한 프로필이 Codex 관리
네트워킹을 시작할 수 있도록 Codex 스레드 구성에
`features.network_proxy.enabled`와 `default_permissions`도 설정합니다.
기본적으로 OpenClaw는 프로필 본문에서 충돌 방지
`openclaw-network-<fingerprint>` 프로필 이름을 생성합니다. 안정적인 로컬
이름이 필요한 경우에만 `profileName`을 사용하십시오.

```js
export default {
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
};
```

일반 app-server 런타임이 `danger-full-access`를 사용하는 경우,
`networkProxy`를 활성화하면 생성된 권한 프로필에는 대신 workspace 스타일의
파일 시스템 접근 권한이 사용됩니다. Codex에서 관리하는 네트워크 강제 적용은
샌드박스 네트워킹이므로, 전체 접근 프로필로는 아웃바운드 트래픽을 보호할 수 없습니다.

Plugin은 이전 버전이거나 버전 정보가 없는 app-server 핸드셰이크를 차단합니다. Codex app-server는
안정 버전 `0.143.0` 이상을 보고해야 합니다.

OpenClaw는 루프백이 아닌 WebSocket app-server URL을 원격으로 취급하며
`appServer.authToken` 또는 `Authorization` 헤더를 통한
ID 정보가 포함된 WebSocket 인증을 요구합니다. `appServer.authToken`과 각 `appServer.headers.*`
값에는 SecretInput을 사용할 수 있습니다. 시크릿 런타임은 OpenClaw가 app-server 시작 옵션을
구성하기 전에 SecretRef와 환경 변수 축약형을 확인하며, 확인되지 않은
구조화된 SecretRef가 있으면 토큰이나 헤더가 전송되기 전에 실패합니다. 네이티브
Codex Plugin이 구성된 경우 OpenClaw는 연결된 app-server의 Plugin
제어 영역을 사용하여 해당 Plugin을 설치하거나 새로 고친 다음 앱
인벤토리를 새로 고쳐 Plugin 소유 앱이 Codex 스레드에 표시되도록 합니다. `app/list`는
계속해서 인벤토리 및 메타데이터의 권위 있는 소스이지만, 현재 Codex에서
비활성화된 것으로 표시하더라도 목록에 있고 접근 가능한 앱에 대해 `thread/start`가
`config.apps[appId].enabled = true`를 전송할지는 OpenClaw 정책에서
결정합니다. 알 수 없거나 누락된 앱 ID는 계속 실패 시 차단됩니다. 이 경로는
`plugin/install`을 통해 마켓플레이스 Plugin을 활성화하고 인벤토리를 새로 고치는
작업만 수행합니다. OpenClaw에서 관리하는 Plugin 설치와 앱 인벤토리 새로 고침을
수락하도록 신뢰할 수 있는 원격 app-server에만 OpenClaw를 연결하십시오.

## 승인 및 샌드박스 모드

로컬 stdio app-server 세션은 기본적으로 YOLO 모드를 사용합니다.
`approvalPolicy: "never"`, `approvalsReviewer: "user"`,
`sandbox: "danger-full-access"`입니다. 이 신뢰할 수 있는 로컬 운영자 구성에서는
응답할 사람이 없는 네이티브 승인 프롬프트 없이도 무인 OpenClaw 턴과 Heartbeat가
계속 진행될 수 있습니다.

Codex의 로컬 시스템 요구 사항 파일에서 암시적 YOLO 승인,
검토자 또는 샌드박스 값을 허용하지 않는 경우 OpenClaw는 암시적 기본값을 대신 guardian으로
취급하고 허용된 guardian 권한을 선택합니다. `tools.exec.mode: "auto"`도
guardian 검토 방식의 Codex 승인을 강제하며 안전하지 않은 레거시
`approvalPolicy: "never"` 또는 `sandbox: "danger-full-access"` 재정의를 유지하지 않습니다.
의도적으로 승인 없이 사용하려면 `tools.exec.mode: "full"`을 설정하십시오.
동일한 요구 사항 파일에서 호스트 이름과 일치하는 `[[remote_sandbox_config]]` 항목은
샌드박스 기본값 결정에 반영됩니다.

Codex guardian 검토 방식 승인을 사용하려면 `appServer.mode: "guardian"`을 설정하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

해당 값이 허용되는 경우 `guardian` 프리셋은 `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, `sandbox: "workspace-write"`로 확장됩니다.
개별 정책 필드는 `mode`보다 우선합니다. 이전의
`guardian_subagent` 검토자 값도 호환성 별칭으로 계속 허용되지만,
새 구성에서는 `auto_review`를 사용해야 합니다.

OpenClaw 샌드박스가 활성화되어 있어도 로컬 Codex app-server 프로세스는
Gateway 호스트에서 계속 실행됩니다. 따라서 OpenClaw는 Codex 호스트 측 샌드박싱을
OpenClaw 샌드박스 백엔드와 동등하게 취급하지 않고, 해당 턴에서 Codex 네이티브 Code Mode,
사용자 MCP 서버 및 앱 기반 Plugin 실행을 비활성화합니다.
일반 exec/process 도구를 사용할 수 있는 경우 셸 접근은
`sandbox_exec` 및 `sandbox_process`와 같은 OpenClaw 샌드박스 기반 동적 도구를 통해 제공됩니다.

<Note>
Docker 기반 OpenClaw 샌드박스 호스트(`agents.defaults.sandbox.mode`가
Docker 백엔드로 설정된 경우)에서 `openclaw doctor`는 샌드박스 컨테이너 내부의
`workspace-write` 셸 실행을 위해 중첩된 Codex `bwrap`에 필요한 권한 없는 사용자
네임스페이스와, Docker 샌드박스의 네트워크 송신이 비활성화된 경우 네트워크
네임스페이스를 호스트에서 허용하는지 검사합니다. 검사가 실패하면 Ubuntu/AppArmor
호스트에서 일반적으로 `bwrap: setting up uid map: Permission denied` 또는
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`가 표시됩니다.
OpenClaw 서비스 사용자를 위해 보고된 호스트 네임스페이스 정책을 수정하고 Gateway를
다시 시작하십시오. 호스트 전체에 적용되는
`kernel.apparmor_restrict_unprivileged_userns=0` 대체 설정보다 서비스 프로세스에
범위가 제한된 AppArmor 프로필을 사용하는 것이 좋으며, 중첩된 `bwrap` 요구 사항을
충족하기 위한 목적으로 더 광범위한 Docker 컨테이너 권한을 부여하지 마십시오.
</Note>

## 샌드박스 내 네이티브 실행

안정적인 기본 동작은 실패 시 차단입니다. 활성화된 OpenClaw 샌드박싱은 원래
Codex app-server 호스트에서 실행될 네이티브 Codex 실행 표면을 비활성화합니다.
OpenClaw의 샌드박스 백엔드에서 Codex의 원격 환경 지원을 시험하려는 경우에만
`appServer.experimental.sandboxExecServer: true`를 사용하십시오.
이 프리뷰 경로는 지원되는 모든 Codex app-server 버전에서 작동합니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

플래그가 켜져 있고 현재 OpenClaw 세션이 샌드박스에서 실행 중이면 OpenClaw는
활성 샌드박스가 지원하는 로컬 루프백 exec-server를 시작하고 이를
Codex app-server에 등록한 다음, OpenClaw가 소유한 해당 환경으로 Codex 스레드와
턴을 시작합니다. app-server에서 환경을 등록할 수 없으면 호스트 실행으로 조용히
대체하지 않고 실행을 실패 처리하여 차단합니다.

이 프리뷰 경로는 로컬 전용입니다. 원격 WebSocket app-server가 동일한 호스트에서
실행되고 있지 않으면 루프백 exec-server에 접근할 수 없으므로 OpenClaw는
이 조합을 거부합니다.

## 인증 및 환경 격리

기본 에이전트별 홈에서는 다음 순서로 인증이 선택됩니다.

1. 에이전트에 대한 명시적 OpenClaw Codex 인증 프로필.
2. 해당 에이전트의 Codex 홈에 있는 app-server의 기존 계정.
3. 로컬 stdio app-server 실행에 한해, app-server 계정이 없고 OpenAI 인증이
   여전히 필요한 경우 `CODEX_API_KEY`, 그다음 `OPENAI_API_KEY`.

OpenClaw가 ChatGPT 구독 방식의 Codex 인증 프로필(OAuth 또는
토큰 자격 증명 유형)을 감지하면 생성된 Codex 자식 프로세스에서 `CODEX_API_KEY`와
`OPENAI_API_KEY`를 제거합니다. 이렇게 하면 임베딩이나 직접 OpenAI 모델을 위한
Gateway 수준 API 키를 계속 사용할 수 있으면서도 네이티브 Codex app-server 턴의
비용이 실수로 API를 통해 청구되지 않습니다.

명시적 Codex API 키 프로필과 로컬 stdio 환경 키 대체 경로는 상속된 자식 프로세스
환경 대신 app-server 로그인을 사용합니다. WebSocket app-server 연결에는
Gateway 환경 API 키 대체 값이 전달되지 않습니다. 명시적 인증 프로필이나 원격
app-server 자체 계정을 사용하십시오.

stdio app-server 실행은 기본적으로 OpenClaw의 프로세스 환경을 상속합니다.
OpenClaw는 Codex app-server 계정 브리지를 소유하며 `CODEX_HOME`을 해당 에이전트의
OpenClaw 상태 아래에 있는 에이전트별 디렉터리로 설정합니다. 이를 통해 Codex
구성, 계정, Plugin 캐시/데이터 및 스레드 상태의 범위가 운영자의 개인
`~/.codex` 홈에서 유입되지 않고 OpenClaw 에이전트로 제한됩니다.

Codex Desktop 및 CLI와 네이티브 Codex 상태를 공유하려면
`appServer.homeScope: "user"`를 설정하십시오. 이 로컬 사용자 홈 모드는 관리형 stdio와
명시적 Unix 전송을 지원합니다. `$CODEX_HOME`이 설정되어 있으면 이를 사용하고, 그렇지 않으면
`~/.codex`를 사용하며 네이티브 인증, 구성, Plugin 및 스레드가 포함됩니다.
OpenClaw는 app-server에 대한 인증 프로필 브리지를 건너뜁니다. 검증된 소유자
턴에서는 `codex_threads`를 사용하여 해당 스레드를 목록 조회(선택적 `search` 필터 사용),
읽기, 포크, 이름 변경, 보관 및 보관 해제할 수 있습니다. OpenClaw에서 스레드를
계속 사용하기 전에 포크하십시오. 독립적인 Codex 프로세스는 동일한 스레드에 대한
동시 작성자를 조율하지 않습니다.

해당 `homeScope` 옵트인은 일반 하네스 세션에 적용됩니다. Codex Sessions를 통해 생성된
Chat은 대신 비공개 감독 연결을 사용하며, 이 연결은 정식 브랜치와 향후 재개를 위해
네이티브 연결의 인증 및 제공자 구성을 유지합니다.

모델이 고정된 감독형 Chat에서 `codex_threads`는 다른 포크를 연결하거나
Chat에 바인딩된 네이티브 스레드를 보관할 수 없습니다. 목록 조회와 메타데이터 전용 읽기는
계속 사용할 수 있습니다. 원시 트랜스크립트를 읽으려면 `allowRawTranscripts`가 필요합니다.
이 옵션이 비활성화되어 있으면 네이티브 검색이 트랜스크립트 미리 보기와 일치할 수 있으므로
목록 검색도 거부됩니다. 이름 변경, 보관 해제, 분리된 포크 및 다른 OpenClaw Chat이 소유하지
않은 관련 없는 스레드의 보관에는 `allowWriteControls`가 필요합니다. 어느 옵션도 잠긴
바인딩을 우회하지 않습니다.

OpenClaw는 일반적인 로컬 app-server 실행에서 `HOME`을 다시 작성하지 않습니다.
`openclaw`, `gh`, `git`, 클라우드 CLI 및 셸 명령과 같은 Codex 실행 하위 프로세스는
일반 프로세스 홈을 참조하며 사용자 홈의 구성과 토큰을 찾을 수 있습니다.
Codex는 `$HOME/.agents/skills`와
`$HOME/.agents/plugins/marketplace.json`도 검색할 수 있습니다. 이 `.agents` 검색은
의도적으로 운영자 홈과 공유되며 격리된 `~/.codex` 상태와는 별개입니다.

기본 에이전트 범위에서는 OpenClaw Plugin과 OpenClaw Skills 스냅샷이
계속 OpenClaw 자체 Plugin 레지스트리와 Skills 로더를 통해 전달되며, 개인
Codex `~/.codex` 자산은 전달되지 않습니다. 격리된 OpenClaw 에이전트에 포함해야 하는
유용한 Codex CLI Skills나 Codex 홈의 Plugin이 있다면 명시적으로 인벤토리를 확인하십시오.

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

배포에 추가 환경 격리가 필요한 경우 해당 변수를 `appServer.clearEnv`에
추가하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv`는 생성된 Codex app-server 자식 프로세스에만 영향을 줍니다.
OpenClaw는 로컬 실행 정규화 중 이 목록에서 `CODEX_HOME`과 `HOME`을 제거합니다.
`CODEX_HOME`은 선택한 에이전트 또는 사용자 범위를 계속 가리키고,
`HOME`은 하위 프로세스가 일반 사용자 홈 상태를 사용할 수 있도록 계속 상속됩니다.

## 동적 도구

Codex 동적 도구는 기본적으로 `searchable` 로딩을 사용하며,
`deferLoading: true`와 함께 `openclaw` 네임스페이스 아래에 노출됩니다. OpenClaw는
Codex 네이티브 workspace 작업 또는 Codex 자체 도구 검색 표면과 중복되는
동적 도구를 노출하지 않습니다.

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`
- `tool_call`
- `tool_describe`
- `tool_search`
- `tool_search_code`

메시징, 미디어, Cron, 브라우저, Node, Gateway, `heartbeat_respond`,
`web_search` 등 나머지 대부분의 OpenClaw 통합 도구는 해당 네임스페이스의 Codex 도구
검색을 통해 사용할 수 있습니다. 이를 통해 초기 모델 컨텍스트를 더 작게 유지합니다.
Codex 도구 검색을 사용할 수 없거나 커넥터만 포함된 범위로 해석될 수 있으므로,
일부 도구는 `codexDynamicToolsLoading`과 관계없이 직접 호출 가능한 상태를 유지합니다.
해당 도구는 `agents_list`, `sessions_spawn`, `sessions_yield`입니다. 개발자 지침에서는
일반 Codex 하위 에이전트가 Codex 네이티브 하위 에이전트 작업에 네이티브
`spawn_agent`를 사용하도록 계속 안내하며, `sessions_spawn`은 명시적 OpenClaw 또는
ACP 위임에 계속 사용할 수 있습니다. 메시지 도구 전용 소스 응답도 턴 제어 계약이므로
직접 호출 가능한 상태를 유지합니다.

OpenClaw `computer` 도구를 포함하여 `catalogMode: "direct-only"`로 표시된 도구는
`openclaw_direct` 아래에 그룹화됩니다. OpenClaw는 운영자가 제공한 항목을 대체하지 않고
해당 네임스페이스를 Codex의 `code_mode.direct_only_tool_namespaces` 목록에 추가합니다.
따라서 Codex는 이러한 도구를 중첩된 Code Mode `tools.*` 호출을 통해 라우팅하지 않고
일반 및 Code Mode 전용 스레드에서 `DirectModelOnly`로 노출합니다. 이 경계는 이미지가
포함된 결과에 필요합니다. 중첩된 Code Mode 직렬화는 이미지 출력을 텍스트로 평탄화하여
다음 컴퓨터 작업에 필요한 스크린샷을 폐기하기 때문입니다.

지연된 동적 도구를 검색할 수 없는 사용자 지정 Codex app-server에 연결하거나
전체 도구 페이로드를 디버깅할 때만 `codexDynamicToolsLoading: "direct"`를 설정하십시오.

## 시간 제한

OpenClaw 소유의 동적 도구 호출은 `appServer.requestTimeoutMs`와
독립적으로 제한됩니다. 각 Codex `item/tool/call` 요청은 다음 순서로
처음 사용 가능한 타임아웃을 사용합니다.

- 호출별 `timeoutMs` 인수가 양수인 경우 해당 값.
- `image_generate`의 경우 `agents.defaults.imageGenerationModel.timeoutMs`.
- 타임아웃이 구성되지 않은 `image_generate`의 경우 이미지 생성 기본값인
  120초.
- 미디어 이해 `image` 도구의 경우 `tools.media.image.timeoutSeconds`를
  밀리초로 변환한 값 또는 미디어 기본값인 60초. 이미지 이해에서는 이 값이
  요청 자체에 적용되며 이전 준비 작업으로 인해 줄어들지 않습니다.
- `message` 도구의 경우 고정 기본값인 120초.
- 동적 도구 기본값인 90초.

이 감시 타이머는 외부 동적 `item/tool/call` 예산입니다. 제공자별 요청
타임아웃은 해당 호출 내부에서 실행되며 자체 타임아웃 의미 체계를
유지합니다. 동적 도구 예산의 상한은 600000 ms입니다. 타임아웃이 발생하면
OpenClaw는 지원되는 경우 도구 신호를 중단하고 실패한 동적 도구 응답을
Codex에 반환하여 세션을 `processing` 상태로 방치하는 대신 턴을 계속할 수
있게 합니다.

Codex가 턴을 수락한 후, 그리고 OpenClaw가 턴 범위의 앱 서버 요청에
응답한 후, 하네스는 Codex가 현재 턴에서 진행하고 최종적으로
`turn/completed`로 네이티브 턴을 완료할 것으로 예상합니다. 앱 서버가
`appServer.turnCompletionIdleTimeoutMs` 동안 아무 활동도 하지 않으면
OpenClaw는 최선의 방식으로 Codex 턴을 중단하고 진단용 타임아웃을 기록하며,
후속 채팅 메시지가 오래된 네이티브 턴 뒤에서 대기열에 쌓이지 않도록
OpenClaw 세션 레인을 해제합니다.

같은 턴에 대한 대부분의 비종료 알림은 Codex가 턴이 여전히 활성 상태임을
입증하므로 이 짧은 감시 타이머를 해제합니다. 도구 핸드오프에는 더 긴 도구
실행 후 유휴 예산이 사용됩니다. 즉, OpenClaw가 `item/tool/call` 응답을
반환한 후, `commandExecution` 같은 네이티브 도구 항목이 완료된 후, 원시
`custom_tool_call_output` 완료 후, 그리고 도구 실행 후의 원시 어시스턴트
진행, 원시 추론 완료 또는 추론 진행 후에 적용됩니다. 이 가드는 구성된
경우 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`를 사용하고,
그렇지 않으면 기본적으로 5분을 사용합니다. 동일한 도구 실행 후 예산은
Codex가 다음 현재 턴 이벤트를 내보내기 전의 조용한 종합 구간에 대한 진행
감시 타이머도 연장합니다. 추론 완료, 해설 `agentMessage` 완료, 도구 실행 전
원시 추론 또는 어시스턴트 진행 뒤에는 자동 최종 응답이 이어질 수 있으므로,
세션 레인을 즉시 해제하는 대신 진행 후 응답 가드를 사용합니다. 최종/비해설
완료 `agentMessage` 항목과 도구 실행 전 원시 어시스턴트 완료만 어시스턴트
출력 해제를 활성화합니다. 그 후 Codex가 `turn/completed` 없이 조용해지면
OpenClaw는 최선의 방식으로 네이티브 턴을 중단하고 세션 레인을 해제합니다.
어시스턴트, 도구, 활성 항목 또는 부수 효과의 증거 없이 발생한 턴 완료 유휴
타임아웃을 포함하여 재실행해도 안전한 stdio 앱 서버 실패는 새로운 앱 서버
시도에서 한 번 재시도됩니다. 안전하지 않은 타임아웃은 정지된 앱 서버
클라이언트를 폐기하고 OpenClaw 세션 레인을 해제합니다. 또한 자동 재실행
대신 오래된 네이티브 스레드 바인딩을 제거합니다. 완료 감시 타임아웃은
Codex 전용 타임아웃 문구로 표시됩니다. 재실행해도 안전한 경우에는 응답이
불완전할 수 있다고 알리고, 안전하지 않은 경우에는 재시도하기 전에 현재
상태를 확인하라고 사용자에게 안내합니다. 공개 타임아웃 진단에는 마지막 앱
서버 알림 메서드, 원시 어시스턴트 응답 항목 ID/유형/역할, 활성 요청/항목
수, 활성화된 감시 상태 같은 구조화된 필드가 포함됩니다. 마지막 알림이 원시
어시스턴트 응답 항목인 경우 길이가 제한된 어시스턴트 텍스트 미리 보기도
포함됩니다. 원시 프롬프트나 도구 콘텐츠는 포함되지 않습니다.

## 모델 검색

기본적으로 Codex Plugin은 앱 서버에 사용 가능한 모델을 요청합니다. 모델
가용성은 Codex 앱 서버가 소유하므로 OpenClaw가 번들 `@openai/codex`
버전을 업그레이드하거나 배포 환경에서 `appServer.command`가 다른 Codex
바이너리를 가리키면 목록이 변경될 수 있습니다. 가용성은 계정 범위일 수도
있습니다. 실행 중인 Gateway에서 `/codex models`를 사용하여 해당 하네스와
계정의 실시간 카탈로그를 확인하십시오.

검색이 실패하거나 타임아웃되면 OpenClaw는 번들 대체 카탈로그를 사용합니다.

| 모델 ID        | 표시 이름    | 추론 수준                |
| -------------- | ------------ | ------------------------ |
| `gpt-5.5`      | gpt-5.5      | low, medium, high, xhigh |
| `gpt-5.4-mini` | GPT-5.4-Mini | low, medium, high, xhigh |

<Note>
현재 번들 하네스는 `@openai/codex` `0.144.1`입니다. 해당 번들 앱 서버에
대한 `model/list` 프로브에서는 다음과 같은 공개 선택기 행이 반환되었습니다.

| 모델 ID         | 입력 형식   | 추론 수준                            |
| --------------- | ----------- | ------------------------------------ |
| `gpt-5.6-sol`   | 텍스트, 이미지 | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-terra` | 텍스트, 이미지 | low, medium, high, xhigh, max, ultra |
| `gpt-5.6-luna`  | 텍스트, 이미지 | low, medium, high, xhigh, max        |
| `gpt-5.5`       | 텍스트, 이미지 | low, medium, high, xhigh             |
| `gpt-5.4`       | 텍스트, 이미지 | low, medium, high, xhigh             |
| `gpt-5.4-mini`  | 텍스트, 이미지 | low, medium, high, xhigh             |
| `gpt-5.2`       | 텍스트, 이미지 | low, medium, high, xhigh             |

앱 서버 카탈로그는 `ultra`를 보고할 수 있지만, 현재 OpenClaw 추론 제어에서
노출하는 수준은 `max`까지입니다.

실시간 선택기 행은 계정 범위이며 계정, Codex 카탈로그 또는 번들 버전에 따라
변경될 수 있습니다. 특정 시점의 표에 의존하지 말고 `/codex models`를
실행하여 현재 목록을 확인하십시오. 숨겨진 모델도 내부 또는 특수 흐름을 위해
앱 서버 카탈로그에 나타날 수 있지만 일반적인 모델 선택기 옵션은 아닐 수
있습니다.
</Note>

`plugins.entries.codex.config.discovery`에서 검색을 조정하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

시작 시 Codex 프로브를 피하고 대체 카탈로그만 사용하려면 검색을
비활성화하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## 워크스페이스 부트스트랩 파일

Codex는 네이티브 프로젝트 문서 검색을 통해 `AGENTS.md` 자체를 처리합니다.
Codex 대체 파일 이름은 `AGENTS.md`가 없을 때만 적용되므로 OpenClaw는
합성 Codex 프로젝트 문서 파일을 작성하거나 페르소나 파일에 Codex 대체 파일
이름을 사용하지 않습니다.

OpenClaw 워크스페이스와 동등한 동작을 제공하기 위해 Codex 하네스는 다른
부트스트랩 파일도 개발자 지침으로 전달하지만, 전달 방식은 동일하지 않습니다.

- `TOOLS.md`는 **상속되는** Codex 개발자 지침으로 전달되므로 턴 중에
  생성된 네이티브 Codex 하위 에이전트도 이를 확인합니다.
- `SOUL.md`, `IDENTITY.md`, `USER.md`는 **턴 범위의** 협업 지침으로
  전달됩니다. 네이티브 Codex 하위 에이전트는 이를 상속하지 않으므로 하위
  에이전트 턴에 상위 에이전트의 페르소나와 사용자 프로필이 적용되지
  않습니다.
- 로드된 간결한 OpenClaw Skills 목록도 턴 범위의 협업 개발자 지침으로
  전달되므로 네이티브 Codex 하위 에이전트 역시 이를 상속하지 않습니다.
- `HEARTBEAT.md` 콘텐츠는 삽입되지 않습니다. Heartbeat 턴은 파일이
  존재하고 비어 있지 않을 때 해당 파일을 읽으라는 협업 모드 포인터를
  받습니다.
- 구성된 에이전트 워크스페이스의 `MEMORY.md` 콘텐츠는 해당 워크스페이스에
  메모리 도구를 사용할 수 있을 때 네이티브 Codex 턴 입력에 붙여 넣지
  않습니다. 파일이 존재하면 하네스는 작은 워크스페이스 메모리 포인터를 턴
  범위의 협업 개발자 지침에 추가하며, 영구 메모리가 관련된 경우 Codex는
  `memory_search` 또는 `memory_get`을 사용해야 합니다. 도구가 비활성화되어
  있거나 메모리 검색을 사용할 수 없거나 활성 워크스페이스가 에이전트 메모리
  워크스페이스와 다른 경우 `MEMORY.md`는 일반적인 제한된 턴 컨텍스트
  경로를 사용합니다.
- `BOOTSTRAP.md`가 있으면 OpenClaw 턴 입력 참조 컨텍스트로 전달됩니다.

## 환경 재정의

로컬 테스트에는 환경 재정의를 계속 사용할 수 있습니다.

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command`가 설정되지 않은 경우
`OPENCLAW_CODEX_APP_SERVER_BIN`은 관리형 바이너리를 우회합니다.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신
`plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나,
일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을
사용하십시오. 반복 가능한 배포에는 설정을 사용하는 것이 좋습니다. 이렇게
하면 Plugin 동작이 나머지 Codex 하네스 설정과 동일한 검토된 파일에
유지되기 때문입니다.

## 관련 문서

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [Codex 감독](/plugins/codex-supervision)
- [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)
- [Codex 컴퓨터 사용](/ko/plugins/codex-computer-use)
- [OpenAI 제공자](/ko/providers/openai)
- [구성 참조](/ko/gateway/configuration-reference)
