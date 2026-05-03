---
read_when:
    - Codex 모드의 OpenClaw 에이전트가 Codex Computer Use를 사용하도록 하려는 경우
    - Codex Computer Use, PeekabooBridge, 직접 cua-driver MCP 중에서 선택하고 있습니다
    - Codex Computer Use와 직접 cua-driver MCP 설정 중에서 선택하고 있습니다
    - 번들 Codex Plugin용 computerUse를 구성하고 있습니다
    - /codex computer-use 상태 또는 설치 문제를 해결하고 있습니다
summary: Codex 모드 OpenClaw 에이전트용 Codex Computer Use 설정
title: Codex 컴퓨터 사용
x-i18n:
    generated_at: "2026-05-03T06:18:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use는 로컬 데스크톱 제어를 위한 Codex 네이티브 MCP Plugin입니다. OpenClaw는
데스크톱 앱을 벤더링하지 않고, 데스크톱 작업을 직접 실행하지 않으며, Codex 권한을
우회하지 않습니다. 번들된 `codex` Plugin은 Codex app-server만 준비합니다:
Codex Plugin 지원을 활성화하고, 구성된 Codex Computer Use Plugin을 찾거나 설치하며,
`computer-use` MCP 서버를 사용할 수 있는지 확인한 다음, Codex 모드 턴 동안 네이티브
MCP 도구 호출은 Codex가 소유하도록 둡니다.

OpenClaw가 이미 네이티브 Codex 하네스를 사용 중일 때 이 페이지를 사용하세요. 런타임
설정 자체는 [Codex 하네스](/ko/plugins/codex-harness)를 참고하세요.

## OpenClaw.app 및 Peekaboo

OpenClaw.app의 Peekaboo 통합은 Codex Computer Use와 별개입니다. macOS 앱은
PeekabooBridge 소켓을 호스팅할 수 있어, `peekaboo` CLI가 Peekaboo 자체 자동화
도구를 위해 앱의 로컬 손쉬운 사용 및 화면 기록 권한을 재사용할 수 있습니다. 이
브리지는 Codex Computer Use를 설치하거나 프록시하지 않으며, Codex Computer Use는
PeekabooBridge 소켓을 통해 호출하지 않습니다.

OpenClaw.app을 Peekaboo CLI 자동화를 위한 권한 인식 호스트로 사용하려면
[Peekaboo 브리지](/ko/platforms/mac/peekaboo)를 사용하세요. Codex 모드 OpenClaw
에이전트가 턴 시작 전에 Codex의 네이티브 `computer-use` MCP Plugin을 사용할 수
있어야 한다면 이 페이지를 사용하세요.

## iOS 앱

iOS 앱은 Codex Computer Use와 별개입니다. 이 앱은 Codex `computer-use` MCP 서버를
설치하거나 프록시하지 않으며, 데스크톱 제어 백엔드가 아닙니다. 대신 iOS 앱은
OpenClaw 노드로 연결되고 `canvas.*`, `camera.*`, `screen.*`, `location.*`,
`talk.*` 같은 노드 명령을 통해 모바일 기능을 노출합니다.

에이전트가 Gateway를 통해 iPhone 노드를 구동하게 하려면 [iOS](/ko/platforms/ios)를
사용하세요. Codex 모드 에이전트가 Codex의 네이티브 Computer Use Plugin을 통해 로컬
macOS 데스크톱을 제어해야 한다면 이 페이지를 사용하세요.

## 직접 cua-driver MCP

Codex Computer Use만이 데스크톱 제어를 노출하는 유일한 방법은 아닙니다.
OpenClaw가 관리하는 런타임이 TryCua의 드라이버를 직접 호출하도록 하려면 Codex 전용
마켓플레이스 흐름 대신 OpenClaw의 MCP 레지스트리를 통해 업스트림 `cua-driver mcp`
서버를 사용하세요.

`cua-driver`를 설치한 뒤, OpenClaw 명령을 요청하거나:

```bash
cua-driver mcp-config --client openclaw
```

stdio 서버를 직접 등록하세요:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

이 경로는 드라이버 스키마와 구조화된 MCP 응답을 포함해 업스트림 MCP 도구 표면을
그대로 유지합니다. CUA 드라이버를 일반 OpenClaw MCP 서버로 사용할 수 있게 하려면 이
경로를 사용하세요. Codex app-server가 Codex 모드 턴 안에서 Plugin 설치, MCP 다시
로드, 네이티브 도구 호출을 소유해야 한다면 이 페이지의 Codex Computer Use 설정을
사용하세요.

CUA의 드라이버는 macOS 전용이며, 여전히 손쉬운 사용 및 화면 기록처럼 앱이 요청하는
로컬 macOS 권한이 필요합니다. OpenClaw는 `cua-driver`를 설치하거나, 해당 권한을
부여하거나, 업스트림 드라이버의 안전 모델을 우회하지 않습니다.

## 빠른 설정

Codex 모드 턴에서 스레드가 시작되기 전에 Computer Use를 사용할 수 있어야 한다면
`plugins.entries.codex.config.computerUse`를 설정하세요:

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
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

이 구성에서는 OpenClaw가 각 Codex 모드 턴 전에 Codex app-server를 확인합니다.
Computer Use가 없지만 Codex app-server가 설치 가능한 마켓플레이스를 이미 발견한
경우, OpenClaw는 Codex app-server에 Plugin을 설치하거나 다시 활성화하고 MCP 서버를
다시 로드하도록 요청합니다. macOS에서 일치하는 마켓플레이스가 등록되어 있지 않고
표준 Codex 앱 번들이 존재하면, OpenClaw는 실패하기 전에
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled`의 번들된
Codex 마켓플레이스도 등록하려고 시도합니다. 설정이 여전히 MCP 서버를 사용할 수 있게
만들지 못하면 스레드가 시작되기 전에 턴이 실패합니다.

기존 세션은 런타임과 Codex 스레드 바인딩을 유지합니다. `agentRuntime` 또는 Computer
Use 구성을 변경한 뒤에는 테스트하기 전에 영향을 받는 채팅에서 `/new` 또는 `/reset`을
사용하세요.

## 명령

`codex` Plugin 명령 표면을 사용할 수 있는 모든 채팅 화면에서 `/codex computer-use`
명령을 사용하세요. 이는 OpenClaw 채팅/런타임 명령이며, `openclaw codex ...` CLI
하위 명령이 아닙니다:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status`는 읽기 전용입니다. 마켓플레이스 소스를 추가하거나, Plugin을 설치하거나,
Codex Plugin 지원을 활성화하지 않습니다.

`install`은 Codex app-server Plugin 지원을 활성화하고, 선택적으로 구성된
마켓플레이스 소스를 추가하며, Codex app-server를 통해 구성된 Plugin을 설치하거나
다시 활성화하고, MCP 서버를 다시 로드한 뒤, MCP 서버가 도구를 노출하는지 확인합니다.

## 마켓플레이스 선택

OpenClaw는 Codex 자체가 노출하는 것과 동일한 app-server API를 사용합니다.
마켓플레이스 필드는 Codex가 `computer-use`를 어디에서 찾아야 하는지 선택합니다.

| 필드                 | 사용 시점                                                        | 설치 지원                                                 |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| 마켓플레이스 필드 없음 | Codex app-server가 이미 알고 있는 마켓플레이스를 사용하게 하려는 경우입니다. | 예, app-server가 로컬 마켓플레이스를 반환할 때입니다.        |
| `marketplaceSource`  | app-server가 추가할 수 있는 Codex 마켓플레이스 소스가 있는 경우입니다. | 예, 명시적 `/codex computer-use install`에 해당합니다.     |
| `marketplacePath`    | 호스트의 로컬 마켓플레이스 파일 경로를 이미 알고 있는 경우입니다.   | 예, 명시적 설치와 턴 시작 자동 설치에 해당합니다.           |
| `marketplaceName`    | 이미 등록된 마켓플레이스 하나를 이름으로 선택하려는 경우입니다.     | 선택된 마켓플레이스에 로컬 경로가 있을 때만 예입니다.       |

새 Codex 홈은 공식 마켓플레이스를 시드하는 데 짧은 시간이 필요할 수 있습니다. 설치 중
OpenClaw는 최대 `marketplaceDiscoveryTimeoutMs` 밀리초 동안 `plugin/list`를
폴링합니다. 기본값은 60초입니다.

여러 알려진 마켓플레이스에 Computer Use가 포함되어 있으면 OpenClaw는
`openai-bundled`, 그다음 `openai-curated`, 그다음 `local`을 선호합니다. 알 수 없는
모호한 일치는 안전하게 실패하고 `marketplaceName` 또는 `marketplacePath`를 설정하라고
요청합니다.

## 번들된 macOS 마켓플레이스

최근 Codex 데스크톱 빌드는 여기에 Computer Use를 번들합니다:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

`computerUse.autoInstall`이 true이고 `computer-use`를 포함하는 마켓플레이스가
등록되어 있지 않으면, OpenClaw는 표준 번들 마켓플레이스 루트를 자동으로 추가하려고
시도합니다:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Codex가 있는 셸에서 명시적으로 등록할 수도 있습니다:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

비표준 Codex 앱 경로를 사용하는 경우 `computerUse.marketplacePath`를 로컬
마켓플레이스 파일 경로로 설정하거나 `/codex computer-use install --source
<marketplace-source>`를 한 번 실행하세요.

## 원격 카탈로그 제한

Codex app-server는 원격 전용 카탈로그 항목을 나열하고 읽을 수 있지만, 현재 원격
`plugin/install`은 지원하지 않습니다. 즉 `marketplaceName`은 상태 확인을 위해 원격
전용 마켓플레이스를 선택할 수 있지만, 설치 및 다시 활성화에는 여전히
`marketplaceSource` 또는 `marketplacePath`를 통한 로컬 마켓플레이스가 필요합니다.

상태가 원격 Codex 마켓플레이스에서 Plugin을 사용할 수 있지만 원격 설치가 지원되지
않는다고 표시하면, 로컬 소스 또는 경로로 설치를 실행하세요:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## 구성 참조

| 필드                            | 기본값          | 의미                                                                           |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferred       | Computer Use를 요구합니다. 다른 Computer Use 필드가 설정되면 기본값은 true입니다. |
| `autoInstall`                   | false          | 턴 시작 시 이미 발견된 마켓플레이스에서 설치하거나 다시 활성화합니다.             |
| `marketplaceDiscoveryTimeoutMs` | 60000          | 설치가 Codex app-server 마켓플레이스 발견을 기다리는 시간입니다.                 |
| `marketplaceSource`             | unset          | Codex app-server `marketplace/add`에 전달되는 소스 문자열입니다.                 |
| `marketplacePath`               | unset          | Plugin을 포함하는 로컬 Codex 마켓플레이스 파일 경로입니다.                       |
| `marketplaceName`               | unset          | 선택할 등록된 Codex 마켓플레이스 이름입니다.                                    |
| `pluginName`                    | `computer-use` | Codex 마켓플레이스 Plugin 이름입니다.                                           |
| `mcpServerName`                 | `computer-use` | 설치된 Plugin이 노출하는 MCP 서버 이름입니다.                                   |

턴 시작 자동 설치는 의도적으로 구성된 `marketplaceSource` 값을 거부합니다. 새 소스를
추가하는 것은 명시적 설정 작업이므로 `/codex computer-use install --source
<marketplace-source>`를 한 번 사용한 뒤, 이후에는 `autoInstall`이 발견된 로컬
마켓플레이스에서 다시 활성화를 처리하게 하세요. 턴 시작 자동 설치는 구성된
`marketplacePath`를 사용할 수 있습니다. 이는 이미 호스트의 로컬 경로이기 때문입니다.

## OpenClaw가 확인하는 것

OpenClaw는 내부적으로 안정적인 설정 이유를 보고하고, 사용자가 보는 상태를 채팅용으로
형식화합니다:

| 이유                         | 의미                                                   | 다음 단계                                      |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled`가 false로 해석되었습니다.        | `enabled` 또는 다른 Computer Use 필드를 설정하세요. |
| `marketplace_missing`        | 일치하는 마켓플레이스를 사용할 수 없습니다.             | 소스, 경로 또는 마켓플레이스 이름을 구성하세요. |
| `plugin_not_installed`       | 마켓플레이스는 있지만 Plugin이 설치되어 있지 않습니다.  | 설치를 실행하거나 `autoInstall`을 활성화하세요. |
| `plugin_disabled`            | Plugin은 설치되어 있지만 Codex 구성에서 비활성화되어 있습니다. | 설치를 실행해 다시 활성화하세요.              |
| `remote_install_unsupported` | 선택된 마켓플레이스가 원격 전용입니다.                  | `marketplaceSource` 또는 `marketplacePath`를 사용하세요. |
| `mcp_missing`                | Plugin은 활성화되어 있지만 MCP 서버를 사용할 수 없습니다. | Codex Computer Use와 OS 권한을 확인하세요.     |
| `ready`                      | Plugin과 MCP 도구를 사용할 수 있습니다.                 | Codex 모드 턴을 시작하세요.                    |
| `check_failed`               | 상태 확인 중 Codex app-server 요청이 실패했습니다.      | app-server 연결성과 로그를 확인하세요.         |
| `auto_install_blocked`       | 턴 시작 설정에 새 소스 추가가 필요합니다.               | 먼저 명시적 설치를 실행하세요.                 |

채팅 출력에는 Plugin 상태, MCP 서버 상태, 마켓플레이스, 사용 가능한 경우 도구, 그리고
실패한 설정 단계에 대한 구체적인 메시지가 포함됩니다.

## macOS 권한

Computer Use는 macOS 전용입니다. Codex가 소유한 MCP 서버가 앱을 검사하거나 제어하려면
먼저 로컬 OS 권한이 필요할 수 있습니다. OpenClaw가 Computer Use는 설치되어 있지만 MCP
서버를 사용할 수 없다고 말하면, 먼저 Codex 쪽 Computer Use 설정을 확인하세요:

- Codex app-server가 데스크톱 제어가 수행될 동일한 호스트에서 실행 중입니다.
- Computer Use Plugin이 Codex config에서 활성화되어 있습니다.
- `computer-use` MCP server가 Codex app-server MCP status에 표시됩니다.
- macOS가 데스크톱 제어 앱에 필요한 권한을 부여했습니다.
- 현재 호스트 세션이 제어 대상 데스크톱에 접근할 수 있습니다.

OpenClaw는 `computerUse.enabled`가 true일 때 의도적으로 차단 방식으로 실패합니다. Codex 모드 턴은 config가 요구한 네이티브 데스크톱 도구 없이 조용히 진행되어서는 안 됩니다.

## 문제 해결

**상태가 설치되지 않았다고 표시합니다.** `/codex computer-use install`을 실행하세요. marketplace가 발견되지 않으면 `--source` 또는 `--marketplace-path`를 전달하세요.

**상태가 설치되었지만 비활성화되었다고 표시합니다.** `/codex computer-use install`을 다시 실행하세요. Codex app-server 설치는 Plugin config를 다시 활성화 상태로 기록합니다.

**상태가 원격 설치는 지원되지 않는다고 표시합니다.** 로컬 marketplace 소스나 경로를 사용하세요. 원격 전용 catalog 항목은 검사할 수 있지만 현재 app-server API를 통해 설치할 수는 없습니다.

**상태가 MCP server를 사용할 수 없다고 표시합니다.** MCP server가 다시 로드되도록 설치를 한 번 다시 실행하세요. 계속 사용할 수 없다면 Codex Computer Use 앱, Codex app-server MCP status 또는 macOS 권한을 수정하세요.

**상태 또는 프로브가 `computer-use.list_apps`에서 시간 초과됩니다.** Plugin과 MCP server는 존재하지만, 로컬 Computer Use bridge가 응답하지 않았습니다. Codex Computer Use를 종료하거나 다시 시작하고, 필요한 경우 Codex Desktop을 다시 실행한 다음 새 OpenClaw 세션에서 다시 시도하세요.

**Computer Use 도구가 `Native hook relay unavailable`이라고 표시합니다.** Codex 네이티브 도구 hook이 로컬 bridge 또는 Gateway fallback을 통해 활성 OpenClaw relay에 도달할 수 없었습니다. `/new` 또는 `/reset`으로 새 OpenClaw 세션을 시작하세요. 계속 발생하면 이전 app-server thread와 hook registration이 제거되도록 gateway를 다시 시작한 다음 다시 시도하세요.

**턴 시작 자동 설치가 소스를 거부합니다.** 이는 의도된 동작입니다. 먼저 명시적으로 `/codex computer-use install --source <marketplace-source>`를 사용해 소스를 추가하세요. 그러면 이후 턴 시작 자동 설치에서 발견된 로컬 marketplace를 사용할 수 있습니다.
