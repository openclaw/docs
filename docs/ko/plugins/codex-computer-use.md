---
read_when:
    - Codex 모드 OpenClaw 에이전트가 Codex Computer Use를 사용하도록 하려는 경우
    - Codex Computer Use, PeekabooBridge, 직접 cua-driver MCP 중에서 선택합니다.
    - 번들 Codex Plugin의 computerUse를 구성하고 있습니다
    - /codex 컴퓨터 사용 상태 또는 설치 문제를 해결하고 있습니다
summary: Codex 모드 OpenClaw 에이전트용 Codex Computer Use 설정하기
title: Codex 컴퓨터 사용 기능
x-i18n:
    generated_at: "2026-07-12T15:28:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use는 로컬 데스크톱 제어를 위한 Codex 네이티브 MCP Plugin입니다. OpenClaw는
데스크톱 앱을 자체적으로 포함하거나, 데스크톱 작업을 직접 실행하거나, Codex 권한을
우회하지 않습니다. 번들 `codex` Plugin은 Codex app-server만 준비합니다.
즉, Codex Plugin 지원을 활성화하고, 구성된 Computer Use Plugin을 찾거나 설치하며,
`computer-use` MCP 서버를 사용할 수 있는지 확인한 다음, Codex 모드 턴 중 네이티브
MCP 도구 호출은 Codex가 담당하도록 합니다.

OpenClaw가 이미 네이티브 Codex 하네스를 사용 중일 때 이 페이지를 사용하십시오. 런타임
설정 자체에 대해서는 [Codex 하네스](/ko/plugins/codex-harness)를 참조하십시오.

이는 OpenClaw에 내장된 [Node 기반 컴퓨터 도구](/nodes/computer-use)와는 다릅니다. 에이전트가 Gateway에서 실행되든 다른 Node에서 실행되든 동일한 에이전트 계약으로 페어링된 Mac을 제어해야 할 때는 내장 도구를 사용하십시오. Codex app-server가 로컬 MCP 설치, 권한, 네이티브 도구 호출을 담당해야 할 때는 Codex Computer Use를 사용하십시오.

## OpenClaw.app과 Peekaboo

OpenClaw.app의 Peekaboo 통합은 Codex Computer Use와 별개입니다.
macOS 앱은 PeekabooBridge 소켓을 호스팅하여 `peekaboo` CLI가 Peekaboo 자체
자동화 도구에 앱의 로컬 손쉬운 사용 및 화면 기록 권한을 재사용할 수 있게 합니다.
이 브리지는 Codex Computer Use를 설치하거나 프록시하지 않으며,
Codex Computer Use도 PeekabooBridge 소켓을 통해 호출하지 않습니다.

OpenClaw.app을 Peekaboo CLI 자동화를 위한 권한 인식 호스트로 사용하려면
[Peekaboo 브리지](/ko/platforms/mac/peekaboo)를 사용하십시오. Codex 모드 OpenClaw
에이전트가 턴 시작 전에 Codex의 네이티브 `computer-use` MCP Plugin을 사용할 수
있어야 할 때는 이 페이지를 사용하십시오.

## iOS 앱

iOS 앱은 Codex Computer Use와 별개입니다. 이 앱은 Codex `computer-use` MCP
서버를 설치하거나 프록시하지 않으며 데스크톱 제어 백엔드도 아닙니다. 대신 iOS 앱은
OpenClaw Node로 연결되며 `canvas.*`, `camera.*`, `screen.*`, `location.*`,
`talk.*` 같은 Node 명령을 통해 모바일 기능을 제공합니다.

에이전트가 Gateway를 통해 iPhone Node를 제어하도록 하려면 [iOS](/ko/platforms/ios)를
사용하십시오. Codex 모드 에이전트가 Codex의 네이티브 Computer Use Plugin을 통해
로컬 macOS 데스크톱을 제어해야 할 때는 이 페이지를 사용하십시오.

## 직접 cua-driver MCP 사용

Codex Computer Use만이 데스크톱 제어를 제공하는 유일한 방법은 아닙니다. OpenClaw가
관리하는 런타임에서 TryCua 드라이버를 직접 호출하려면 Codex 전용 마켓플레이스 흐름
대신 OpenClaw의 MCP 레지스트리를 통해 업스트림 `cua-driver mcp` 서버를 사용하십시오.

`cua-driver`를 설치한 후 OpenClaw 명령을 요청하십시오.

```bash
cua-driver mcp-config --client openclaw
```

또는 stdio 서버를 직접 등록하십시오.

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

이 경로는 드라이버 스키마와 구조화된 MCP 응답을 포함한 업스트림 MCP 도구 표면을
그대로 유지합니다. CUA 드라이버를 일반 OpenClaw MCP 서버로 사용하려면 이 방법을
사용하십시오. Codex app-server가 Codex 모드 턴 내에서 Plugin 설치, MCP 다시
로드, 네이티브 도구 호출을 담당해야 할 때는 이 페이지의 Codex Computer Use 설정을
사용하십시오.

CUA 드라이버는 macOS 전용이며 손쉬운 사용 및 화면 기록처럼 해당 앱에서 요청하는
로컬 macOS 권한이 여전히 필요합니다. OpenClaw는 `cua-driver`를 설치하거나, 해당
권한을 부여하거나, 업스트림 드라이버의 안전 모델을 우회하지 않습니다.

## 빠른 설정

Codex 모드 턴에서 스레드가 시작되기 전에 Computer Use를 사용할 수 있어야 하는 경우
`plugins.entries.codex.config.computerUse`를 설정하십시오. `autoInstall: true`는
Computer Use 사용을 선택하고 OpenClaw가 턴 전에 이를 설치하거나 다시 활성화할 수
있게 합니다.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

이 구성에서는 OpenClaw가 각 Codex 모드 턴 전에 Codex app-server를 확인합니다.
Computer Use가 없지만 Codex app-server가 설치 가능한 마켓플레이스를 이미 발견한
경우, OpenClaw는 Codex app-server에 Plugin을 설치하거나 다시 활성화하고 MCP 서버를
다시 로드하도록 요청합니다. macOS에서는 일치하는 마켓플레이스가 등록되지 않았지만
표준 데스크톱 앱 번들이 존재하는 경우 OpenClaw가
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`에서 번들
Codex 마켓플레이스 등록도 시도하며, 기존 독립 실행형 설치를 위한 대체 경로로
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`를 유지합니다.
설정 후에도 MCP 서버를 사용할 수 없으면 스레드가 시작되기 전에 턴이 실패합니다.

Computer Use 구성을 변경한 후 기존 Codex 스레드가 이미 시작된 상태라면 테스트하기
전에 해당 채팅에서 `/new` 또는 `/reset`을 사용하십시오.

macOS에서 Computer Use의 관리형 시작은
`/Applications/ChatGPT.app/Contents/Resources/codex`의 데스크톱 앱 바이너리를
우선 사용한 다음, 기존 독립 실행형 설치의 경우
`/Applications/Codex.app/Contents/Resources/codex`로 대체합니다. 자체 클라이언트를
시작하는 일회성 Computer Use 상태 및 설치 명령에도 이 방식이 적용됩니다. 이렇게 하면
로컬 macOS 권한을 소유한 앱 번들 아래에서 데스크톱 제어가 유지됩니다. 데스크톱 앱이
설치되어 있지 않으면 OpenClaw는 Plugin 옆에 설치된 관리형 Codex 바이너리로
대체합니다. 기본 격리 에이전트 홈을 사용하는 일반 관리형 Codex 턴에서는 오래된
데스크톱 앱이 최신 모델 지원보다 우선하지 않도록 고정된 패키지를 먼저 사용합니다.
사용자 범위 홈은 네이티브 Computer Use 상태를 로드할 수 있으므로 계속 데스크톱을
우선합니다. 유효한 Codex 구성에서 Computer Use를 활성화한 격리 에이전트 홈도
데스크톱을 우선합니다. 명시적인 `appServer.command` 구성 또는
`OPENCLAW_CODEX_APP_SERVER_BIN`은 여전히 이 관리형 선택을 재정의합니다.

OpenClaw는 실행 중인 하나의 Gateway 내에서 네이티브 Codex 구성 읽기와 Computer Use
설치를 직렬화합니다. 별도의 Codex 프로세스나 다른 Gateway는 이 보호 범위에 포함되지
않습니다. Gateway 외부에서 네이티브 Codex Plugin 구성을 변경한 후에는 새 선택에
의존하기 전에 Gateway를 다시 시작하고 새 채팅을 시작하십시오.

## 명령

`codex` Plugin 명령 표면을 사용할 수 있는 모든 채팅 표면에서
`/codex computer-use` 명령을 사용하십시오. 이는 OpenClaw 채팅/런타임 명령이며
`openclaw codex ...` CLI 하위 명령이 아닙니다.

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status`는 기본 작업이며 읽기 전용입니다. 마켓플레이스 소스를 추가하거나, Plugin을
설치하거나, Codex Plugin 지원을 활성화하지 않습니다. Computer Use 사용을 선택하는
구성이 없으면 일회성 설치 명령을 실행한 후에도 `status`에서 비활성화된 것으로 보고될
수 있습니다.

`install`은 Codex app-server Plugin 지원을 활성화하고, 선택적으로 구성된
마켓플레이스 소스를 추가하며, Codex app-server를 통해 구성된 Plugin을 설치하거나
다시 활성화하고, MCP 서버를 다시 로드한 후 MCP 서버가 도구를 제공하는지 확인합니다.
설치는 신뢰할 수 있는 호스트 리소스를 변경하므로 소유자 또는 `operator.admin`
Gateway 클라이언트만 `install`을 실행할 수 있습니다. 그 밖의 권한 있는 발신자는
재정의를 포함하여 읽기 전용 `status` 명령을 계속 사용할 수 있습니다.

이전 릴리스에서는 일회성 `--plugin`, `--server`, `--mcp-server` ID 재정의를
허용했습니다. 대신 `computerUse.pluginName`과 `computerUse.mcpServerName`을
영구적으로 구성하십시오. 기존 ID 플래그를 사용하면 명령은 영구 저장해야 할 정확한
설정을 식별하고, 마이그레이션 안내에서 요청된 작업과 지원되는 모든 마켓플레이스
플래그를 다시 제시합니다.

## 마켓플레이스 선택

OpenClaw는 Codex 자체에서 제공하는 것과 동일한 app-server API를 사용합니다.
마켓플레이스 필드는 Codex가 `computer-use`를 찾을 위치를 선택합니다.

| 필드                 | 사용 시점                                                        | 설치 지원                                                |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 마켓플레이스 필드 없음 | Codex app-server가 이미 알고 있는 마켓플레이스를 사용하도록 하려는 경우 | app-server가 로컬 마켓플레이스를 반환하는 경우 지원됩니다. |
| `marketplaceSource`  | app-server가 추가할 수 있는 Codex 마켓플레이스 소스가 있는 경우 | 명시적인 `/codex computer-use install`에 지원됩니다. |
| `marketplacePath`    | 호스트의 로컬 마켓플레이스 파일 경로를 이미 알고 있는 경우 | 명시적 설치 및 턴 시작 시 자동 설치에 지원됩니다. |
| `marketplaceName`    | 이미 등록된 마켓플레이스 하나를 이름으로 선택하려는 경우 | 선택한 마켓플레이스에 로컬 경로가 있는 경우에만 지원됩니다. |

새 Codex 홈은 공식 마켓플레이스를 초기화하는 데 잠시 시간이 필요할 수 있습니다.
설치 중 OpenClaw는 최대 `marketplaceDiscoveryTimeoutMs`밀리초(기본값 60초) 동안
`plugin/list`를 폴링합니다.

알려진 여러 마켓플레이스에 Computer Use가 포함된 경우 OpenClaw는
`openai-bundled`, `openai-curated`, `local` 순으로 우선합니다. 알 수 없고 모호한
일치 항목이 있으면 안전을 위해 실패하고 `marketplaceName` 또는 `marketplacePath`를
설정하도록 요청합니다.

## 번들 macOS 마켓플레이스

현재 ChatGPT 데스크톱 빌드는 다음 위치에 Computer Use를 번들로 포함합니다. 기존
독립 실행형 Codex 데스크톱 빌드는 `Codex.app` 아래에서 동일한 레이아웃을 사용합니다.

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall`이 true이고 `computer-use`를 포함하는 마켓플레이스가
등록되지 않은 경우 OpenClaw는 존재하는 첫 번째 표준 번들 마켓플레이스 루트를
추가하려고 시도합니다.

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

셸에서 Codex를 사용하여 이를 명시적으로 등록할 수도 있습니다.

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

비표준 Codex 앱 경로를 사용하는 경우 `/codex computer-use install
--source <marketplace-root>`를 한 번 실행하거나 `computerUse.marketplacePath`를
로컬 마켓플레이스 파일 경로로 설정하십시오. 번들 마켓플레이스 루트가 아니라
마켓플레이스 JSON 파일 경로가 있는 경우에만 `--marketplace-path`를 사용하십시오.

### 공유 Plugin 캐시

기본값 `pluginCacheMode: "independent"`는 각 Codex 홈과 해당 Plugin 캐시를
관리하지 않은 상태로 둡니다. app-server가 시작되기 전에 번들 Computer Use Plugin을
활성 Codex 홈에서 검색 가능한 Plugin 캐시로 복사하려면
`pluginCacheMode: "shared"`를 설정하십시오. 실행 중인 Codex 클라이언트가 여전히
버전별 Plugin 디렉터리를 참조할 수 있으므로 공유 모드에서는 이전 캐시 버전을
보존합니다. 교체 복사에 실패해도 활성 캐시를 보존합니다. 명시적인
`marketplaceName` 또는 `marketplacePath` 구성은 이 조정을 비활성화하여 OpenClaw가
해당 선택을 재정의하지 않도록 합니다.

## 원격 카탈로그 제한

Codex app-server는 원격 전용 카탈로그 항목을 나열하고 읽을 수 있지만 현재 원격
`plugin/install`은 지원하지 않습니다. 즉, `marketplaceName`으로 상태 확인을 위한
원격 전용 마켓플레이스를 선택할 수 있지만 설치 및 재활성화에는 여전히
`marketplaceSource` 또는 `marketplacePath`를 통한 로컬 마켓플레이스가 필요합니다.

상태에서 Plugin을 원격 Codex 마켓플레이스에서 사용할 수 있지만 원격 설치는 지원되지
않는다고 표시되면 로컬 소스 또는 경로를 지정하여 설치를 실행하십시오.

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 구성 참고 자료

| 필드                            | 기본값         | 의미                                                                                      |
| ------------------------------- | -------------- | ----------------------------------------------------------------------------------------- |
| `enabled`                       | 추론됨         | Computer Use를 요구합니다. 다른 Computer Use 필드가 설정되면 기본값은 true입니다.         |
| `autoInstall`                   | false          | 턴 시작 시 이미 검색된 마켓플레이스에서 설치하거나 다시 활성화합니다.                     |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Codex app-server의 마켓플레이스 검색을 설치가 기다리는 시간입니다.                         |
| `liveTestTimeoutMs`             | 60000          | 임시 준비 상태 스레드와 해당 정리 요청의 제한 시간입니다.                                 |
| `toolCallTimeoutMs`             | 60000          | Computer Use `list_apps` 준비 상태 도구 호출의 제한 시간입니다.                           |
| `healthCheckEnabled`            | false          | 소유 app-server 클라이언트가 활성 상태인 동안 주기적으로 준비 상태 프로브를 실행합니다.   |
| `healthCheckIntervalMinutes`    | 60             | 프로브 주기이며, 허용되는 값은 30, 60, 120 또는 240분입니다.                              |
| `pluginCacheMode`               | `independent`  | 번들 데스크톱 Plugin에서 Codex 홈 캐시를 새로 고치려면 `shared`를 사용합니다.              |
| `strictReadiness`               | false          | 라이브 프로브 실패 시 경고와 함께 계속하는 대신 시작을 중단합니다.                        |
| `autoRepair`                    | false          | 오래된 범위 지정 Computer Use MCP 자식 프로세스를 종료하고 실패한 프로브를 한 번 재시도합니다. |
| `marketplaceSource`             | 설정되지 않음  | Codex app-server `marketplace/add`에 전달되는 소스 문자열입니다.                           |
| `marketplacePath`               | 설정되지 않음  | Plugin을 포함하는 로컬 Codex 마켓플레이스 파일 경로입니다.                                |
| `marketplaceName`               | 설정되지 않음  | 선택할 등록된 Codex 마켓플레이스 이름입니다.                                               |
| `pluginName`                    | `computer-use` | Codex 마켓플레이스 Plugin 이름입니다.                                                      |
| `mcpServerName`                 | `computer-use` | 설치된 Plugin이 노출하는 MCP 서버 이름입니다.                                              |

턴 시작 자동 설치는 구성된 `marketplaceSource` 값을 의도적으로
거부합니다. 새 소스를 추가하는 작업은 명시적인 설정 작업이므로
`/codex computer-use install --source <marketplace-source>`를 한 번 사용한 후,
검색된 로컬 마켓플레이스에서 이후 다시 활성화하는 작업은 `autoInstall`이
처리하도록 하십시오. 턴 시작 자동 설치는 구성된 `marketplacePath`를 사용할
수 있습니다. 이 값은 이미 호스트의 로컬 경로이기 때문입니다.

각 필드는 일치하는 구성 키가 설정되지 않은 경우 확인되는 환경 변수
재정의도 허용합니다.

| 필드                            | 환경 변수                                                        |
| ------------------------------- | ---------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                    |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                       |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS`   |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`               |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`               |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`               |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`      |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                  |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                   |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                        |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`                 |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                   |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                   |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                        |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                    |

## OpenClaw가 확인하는 항목

OpenClaw는 내부적으로 안정적인 설정 사유를 보고하고 채팅용
사용자 대상 상태를 형식화합니다.

| 사유                         | 의미                                                        | 다음 단계                                      |
| ---------------------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| `disabled`                   | `computerUse.enabled`가 false로 확인되었습니다.             | `enabled` 또는 다른 Computer Use 필드를 설정하십시오. |
| `marketplace_missing`        | 일치하는 마켓플레이스를 사용할 수 없습니다.                 | 소스, 경로 또는 마켓플레이스 이름을 구성하십시오. |
| `plugin_not_installed`       | 마켓플레이스는 존재하지만 Plugin이 설치되지 않았습니다.     | 설치를 실행하거나 `autoInstall`을 활성화하십시오. |
| `plugin_disabled`            | Plugin이 설치되었지만 Codex 구성에서 비활성화되었습니다.     | 설치를 실행하여 다시 활성화하십시오.           |
| `remote_install_unsupported` | 선택한 마켓플레이스가 원격 전용입니다.                      | `marketplaceSource` 또는 `marketplacePath`를 사용하십시오. |
| `mcp_missing`                | Plugin은 활성화되었지만 MCP 서버를 사용할 수 없습니다.      | Codex Computer Use와 OS 권한을 확인하십시오.   |
| `ready`                      | Plugin과 MCP 도구를 사용할 수 있습니다.                     | Codex 모드 턴을 시작하십시오.                   |
| `check_failed`               | 상태 확인 중 Codex app-server 요청이 실패했습니다.          | app-server 연결과 로그를 확인하십시오.          |
| `auto_install_blocked`       | 턴 시작 설정에서 새 소스를 추가해야 합니다.                 | 먼저 명시적으로 설치를 실행하십시오.            |

채팅 출력에는 Plugin 상태, MCP 서버 상태, 마켓플레이스, 사용 가능한 경우
도구, 실패한 설정 단계의 구체적인 메시지가 포함됩니다.

## macOS 권한

Computer Use는 macOS 전용입니다. Codex가 소유하는 MCP 서버에서 앱을
검사하거나 제어하려면 먼저 로컬 OS 권한이 필요할 수 있습니다. OpenClaw에서
Computer Use가 설치되었지만 MCP 서버를 사용할 수 없다고 표시하면 먼저
Codex 측 Computer Use 설정을 확인하십시오.

- 데스크톱 제어가 이루어져야 하는 동일한 호스트에서 Codex app-server가
  실행되고 있어야 합니다.
- Codex 구성에서 Computer Use Plugin이 활성화되어 있어야 합니다.
- Codex app-server MCP 상태에 `computer-use` MCP 서버가 표시되어야 합니다.
- macOS에서 데스크톱 제어 앱에 필요한 권한을 부여해야 합니다.
- 현재 호스트 세션에서 제어 대상 데스크톱에 접근할 수 있어야 합니다.

`computerUse.enabled`가 true이면 OpenClaw는 의도적으로 실패 시 닫힘
방식으로 동작합니다. Codex 모드 턴은 구성에서 요구한 네이티브 데스크톱
도구 없이 조용히 진행되어서는 안 됩니다.

## 문제 해결

**상태에 설치되지 않았다고 표시됩니다.** `/codex computer-use install`을
실행하십시오. 마켓플레이스가 검색되지 않으면 `--source` 또는
`--marketplace-path`를 전달하십시오.

**상태에 설치되었지만 비활성화되었다고 표시됩니다.** `/codex computer-use install`을
다시 실행하십시오. Codex app-server 설치는 Plugin 구성을 다시 활성화된 상태로
기록합니다.

**상태에 원격 설치가 지원되지 않는다고 표시됩니다.** 로컬 마켓플레이스
소스 또는 경로를 사용하십시오. 원격 전용 카탈로그 항목은 검사할 수 있지만
현재 app-server API를 통해 설치할 수 없습니다.

**상태에 MCP 서버를 사용할 수 없다고 표시됩니다.** MCP 서버가 다시
로드되도록 설치를 한 번 다시 실행하십시오. 계속 사용할 수 없으면 Codex
Computer Use 앱, Codex app-server MCP 상태 또는 macOS 권한을 수정하십시오.

**`computer-use.list_apps`에서 상태 확인 또는 프로브 시간이 초과됩니다.**
Plugin과 MCP 서버는 존재하지만 로컬 Computer Use 브리지가 응답하지
않았습니다. Codex Computer Use를 종료하거나 다시 시작하고, 필요한 경우
Codex Desktop을 다시 실행한 다음 새 OpenClaw 세션에서 재시도하십시오.
호스트가 이전에 더 오래된 관리형 Codex app-server를 통해 Computer Use를
실행했다면 데스크톱 번들 마켓플레이스에서 설치된 Plugin을 새로 고치십시오
(독립 실행형 Codex 데스크톱 설치에는 `Codex.app` 경로를 사용하십시오).

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Computer Use 도구에 `Native hook relay unavailable`이라고 표시됩니다.**
Codex 네이티브 도구 훅이 로컬 브리지 또는 Gateway 대체 경로를 통해 활성
OpenClaw 릴레이에 연결할 수 없습니다. `/new` 또는 `/reset`으로 새 OpenClaw
세션을 시작하십시오. 한 번은 작동하지만 이후 도구 호출에서 다시 실패한다면
`/new`는 현재 시도만 지우는 것입니다. 이전 스레드와 훅 등록이 제거되도록
Codex app-server 또는 OpenClaw Gateway를 다시 시작한 다음 새 세션에서
재시도하십시오.

**턴 시작 자동 설치가 소스를 거부합니다.** 이는 의도된 동작입니다. 먼저
명시적인 `/codex computer-use install --source
<marketplace-source>`로 소스를 추가하면 이후 턴 시작 자동 설치에서 검색된
로컬 마켓플레이스를 사용할 수 있습니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Peekaboo 브리지](/ko/platforms/mac/peekaboo)
- [iOS 앱](/ko/platforms/ios)
