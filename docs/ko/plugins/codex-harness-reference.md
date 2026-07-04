---
read_when:
    - 모든 Codex 하니스 구성 필드가 필요합니다
    - 앱 서버 전송, 인증, 검색 또는 시간 초과 동작을 변경하고 있습니다
    - Codex 하네스 시작, 모델 검색 또는 환경 격리를 디버깅하고 있습니다
summary: Codex 하네스의 구성, 인증, 디스커버리 및 앱 서버 참조
title: Codex 하네스 참조
x-i18n:
    generated_at: "2026-07-04T20:28:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1ffe2404dd35df36a706c098f99b841a9664baf76ee5d712836bb35d9ac78bc
    source_path: plugins/codex-harness-reference.md
    workflow: 16
---

이 참조는 번들된 `codex`
plugin의 상세 구성을 다룹니다. 설정 및 라우팅 결정을 위해서는
[Codex 하네스](/ko/plugins/codex-harness)부터 시작하세요.

## Plugin 구성 표면

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

지원되는 최상위 필드:

| 필드                       | 기본값                   | 의미                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 활성화됨                 | Codex 앱 서버 `model/list`의 모델 검색 설정입니다.                                                                                        |
| `appServer`                | 관리형 stdio 앱 서버     | 전송, 명령, 인증, 승인, 샌드박스, 제한 시간 설정입니다.                                                                                   |
| `codexDynamicToolsLoading` | `"searchable"`           | OpenClaw 동적 도구를 초기 Codex 도구 컨텍스트에 직접 넣으려면 `"direct"`를 사용합니다.                                                     |
| `codexDynamicToolsExclude` | `[]`                     | Codex 앱 서버 턴에서 생략할 추가 OpenClaw 동적 도구 이름입니다.                                                                            |
| `codexPlugins`             | 비활성화됨               | 마이그레이션된 소스 설치형 큐레이션 플러그인에 대한 네이티브 Codex plugin/앱 지원입니다. [네이티브 Codex plugins](/ko/plugins/codex-native-plugins)를 참조하세요. |
| `computerUse`              | 비활성화됨               | Codex Computer Use 설정입니다. [Codex Computer Use](/ko/plugins/codex-computer-use)를 참조하세요.                                             |

## 앱 서버 전송

기본적으로 OpenClaw는 번들된
plugin과 함께 제공되는 관리형 Codex 바이너리를 시작합니다.

```bash
codex app-server --listen stdio://
```

이렇게 하면 앱 서버 버전이 로컬에 별도로 설치되어 있을 수 있는 Codex CLI 대신 번들된 `codex` plugin에 묶입니다. 다른 실행 파일을 실행하려는 의도가 있을 때만
`appServer.command`를 설정하세요.

이미 실행 중인 앱 서버의 경우 WebSocket 전송을 사용하세요.

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

지원되는 `appServer` 필드:

| 필드                                          | 기본값                                                 | 의미                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`는 Codex를 생성하고, `"websocket"`은 `url`에 연결합니다.                                                                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"`는 OpenClaw 에이전트별로 Codex 상태를 격리합니다. `"user"`는 네이티브 `$CODEX_HOME` 또는 `~/.codex`를 공유하고, 네이티브 인증을 사용하며, 소유자 전용 스레드 관리를 활성화합니다. 사용자 범위에는 stdio가 필요합니다.                                                                                                                                                                  |
| `command`                                     | 관리형 Codex 바이너리                                  | stdio 전송용 실행 파일입니다. 관리형 바이너리를 사용하려면 설정하지 않은 상태로 둡니다.                                                                                                                                                                                                                                                                                                          |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 전송용 인수입니다.                                                                                                                                                                                                                                                                                                                                                                        |
| `url`                                         | 설정 안 됨                                            | WebSocket app-server URL입니다.                                                                                                                                                                                                                                                                                                                                                                 |
| `authToken`                                   | 설정 안 됨                                            | WebSocket 전송용 Bearer 토큰입니다. 리터럴 문자열이나 `${CODEX_APP_SERVER_TOKEN}` 같은 SecretInput을 허용합니다.                                                                                                                                                                                                                                                                                 |
| `headers`                                     | `{}`                                                   | 추가 WebSocket 헤더입니다. 헤더 값은 리터럴 문자열이나 SecretInput 값을 허용합니다. 예: `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"`.                                                                                                                                                                                                                                        |
| `clearEnv`                                    | `[]`                                                   | OpenClaw가 상속 환경을 구성한 후 생성된 stdio app-server 프로세스에서 제거되는 추가 환경 변수 이름입니다.                                                                                                                                                                                                                                                                                       |
| `remoteWorkspaceRoot`                         | 설정 안 됨                                            | 원격 Codex app-server 작업 영역 루트입니다. 설정하면 OpenClaw는 확인된 OpenClaw 작업 영역에서 로컬 작업 영역 루트를 추론하고, 현재 cwd 접미사를 이 원격 루트 아래에 보존하며, 최종 app-server cwd만 Codex로 보냅니다. cwd가 확인된 OpenClaw 작업 영역 루트 밖에 있으면 OpenClaw는 gateway 로컬 경로를 원격 app-server로 보내는 대신 닫힌 상태로 실패합니다. |
| `requestTimeoutMs`                            | `60000`                                                | app-server 제어 평면 호출의 제한 시간입니다.                                                                                                                                                                                                                                                                                                                                                    |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | Codex가 턴을 수락한 후 또는 턴 범위 app-server 요청 후 OpenClaw가 `turn/completed`를 기다리는 동안의 무음 구간입니다.                                                                                                                                                                                                                                                                           |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw가 `turn/completed`를 기다리는 동안 도구 핸드오프, 네이티브 도구 완료, 도구 후 원시 어시스턴트 진행, 원시 reasoning 완료 또는 reasoning 진행 후 사용되는 완료 유휴 및 진행 가드입니다. 도구 후 합성이 최종 어시스턴트 릴리스 예산보다 더 오래 정당하게 조용히 유지될 수 있는 신뢰된 작업이나 무거운 작업에 사용합니다.                                                      |
| `mode`                                        | 로컬 Codex 요구 사항이 YOLO를 허용하지 않는 경우를 제외하고 `"yolo"` | YOLO 또는 가디언 검토 실행을 위한 프리셋입니다.                                                                                                                                                                                                                                                                                                                                                  |
| `approvalPolicy`                              | `"never"` 또는 허용된 가디언 승인 정책                 | 스레드 시작, 재개, 턴에 전송되는 네이티브 Codex 승인 정책입니다.                                                                                                                                                                                                                                                                                                                                |
| `sandbox`                                     | `"danger-full-access"` 또는 허용된 가디언 샌드박스     | 스레드 시작 및 재개에 전송되는 네이티브 Codex 샌드박스 모드입니다. 활성 OpenClaw 샌드박스는 `danger-full-access` 턴을 Codex `workspace-write`로 좁힙니다. 턴 네트워크 플래그는 OpenClaw 샌드박스 송신을 따릅니다.                                                                                                                                                                             |
| `approvalsReviewer`                           | `"user"` 또는 허용된 가디언 검토자                    | 허용되는 경우 Codex가 네이티브 승인 프롬프트를 검토하도록 하려면 `"auto_review"`를 사용합니다.                                                                                                                                                                                                                                                                                                  |
| `defaultWorkspaceDir`                         | 현재 프로세스 디렉터리                                 | `--cwd`가 생략되었을 때 `/codex bind`에서 사용하는 작업 영역입니다.                                                                                                                                                                                                                                                                                                                             |
| `serviceTier`                                 | 설정 안 됨                                            | 선택적 Codex app-server 서비스 계층입니다. `"priority"`는 빠른 모드 라우팅을 활성화하고, `"flex"`는 flex 처리를 요청하며, `null`은 재정의를 지웁니다. 레거시 `"fast"`는 `"priority"`로 허용됩니다.                                                                                                                                                                                               |
| `networkProxy`                                | 비활성화                                               | app-server 명령에 대해 Codex 권한 프로필 네트워킹을 사용하도록 선택합니다. OpenClaw는 `sandbox`를 보내는 대신 선택된 `permissions.<profile>.network` 구성을 정의하고 `default_permissions`로 선택합니다.                                                                                                                                                                                       |
| `experimental.sandboxExecServer`              | `false`                                                | 네이티브 Codex 실행이 활성 OpenClaw 샌드박스 내부에서 실행될 수 있도록 OpenClaw 샌드박스 기반 Codex 환경을 Codex app-server 0.132.0 이상에 등록하는 미리 보기 옵트인입니다.                                                                                                                                                                                                                    |

`appServer.networkProxy`는 Codex 샌드박스 계약을 변경하므로 명시적입니다.
활성화하면 OpenClaw는 생성된 권한 프로필이 Codex 관리형 네트워킹을 시작할 수
있도록 Codex 스레드 구성에 `features.network_proxy.enabled`와
`default_permissions`도 설정합니다. 기본적으로 OpenClaw는 프로필 본문에서
충돌에 강한 `openclaw-network-<fingerprint>` 프로필 이름을 생성합니다.
안정적인 로컬 이름이 필요할 때만 `profileName`을 사용합니다.

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

일반 앱 서버 런타임이 `danger-full-access`가 되는 경우,
`networkProxy`를 활성화하면 생성된 권한 프로필에 workspace 스타일 파일 시스템 접근이 사용됩니다. Codex가 관리하는 네트워크 적용은 샌드박스 네트워킹이므로, 전체 접근 프로필은 아웃바운드 트래픽을 보호하지 못합니다.

Plugin은 더 오래되었거나 버전이 없는 앱 서버 핸드셰이크를 차단합니다. Codex 앱 서버는 안정 버전 `0.125.0` 이상을 보고해야 합니다.

OpenClaw는 루프백이 아닌 WebSocket 앱 서버 URL을 원격으로 취급하며, `appServer.authToken` 또는 `Authorization` 헤더를 통해 신원을 포함하는 WebSocket 인증을 요구합니다. `appServer.authToken`과 각 `appServer.headers.*` 값은 SecretInput일 수 있습니다. secrets 런타임은 OpenClaw가 앱 서버 시작 옵션을 만들기 전에 SecretRefs와 env 축약형을 해석하며, 해석되지 않은 구조화된 SecretRefs는 토큰이나 헤더가 전송되기 전에 실패합니다. 네이티브 Codex plugins가 구성되어 있으면, OpenClaw는 연결된 앱 서버의 Plugin 제어 플레인을 사용해 해당 plugins를 설치하거나 새로 고친 다음 앱 인벤토리를 새로 고쳐 Plugin 소유 앱이 Codex 스레드에 보이도록 합니다. `app/list`는 여전히 권한 있는 인벤토리 및 메타데이터 소스이지만, 나열된 접근 가능한 앱에 대해 Codex가 현재 비활성화된 것으로 표시하더라도 `thread/start`가 `config.apps[appId].enabled = true`를 보내는지 여부는 OpenClaw 정책이 결정합니다. 알 수 없거나 누락된 앱 ID는 계속 실패 시 폐쇄됩니다. 이 경로는 `plugin/install`을 통해 마켓플레이스 plugins만 활성화하고 인벤토리를 새로 고칩니다. OpenClaw가 관리하는 Plugin 설치와 앱 인벤토리 새로 고침을 수락하도록 신뢰할 수 있는 원격 앱 서버에만 OpenClaw를 연결하세요.

## 승인 및 샌드박스 모드

로컬 stdio 앱 서버 세션은 기본적으로 YOLO 모드를 사용합니다:
`approvalPolicy: "never"`, `approvalsReviewer: "user"`, 그리고
`sandbox: "danger-full-access"`. 이 신뢰된 로컬 운영자 자세 덕분에, 응답할 사람이 없는 네이티브 승인 프롬프트 없이도 무인 OpenClaw 턴과 Heartbeat가 진행될 수 있습니다.

Codex의 로컬 시스템 요구 사항 파일이 암시적 YOLO 승인, reviewer 또는 샌드박스 값을 허용하지 않는 경우, OpenClaw는 암시적 기본값을 대신 guardian으로 취급하고 허용된 guardian 권한을 선택합니다. `tools.exec.mode: "auto"`도 guardian 검토 Codex 승인을 강제하며, 안전하지 않은 레거시 `approvalPolicy: "never"` 또는 `sandbox: "danger-full-access"` 오버라이드를 보존하지 않습니다. 의도적으로 승인 없는 자세를 사용하려면 `tools.exec.mode: "full"`을 설정하세요.
동일한 요구 사항 파일의 호스트 이름 일치
`[[remote_sandbox_config]]` 항목은 샌드박스 기본값 결정에 반영됩니다.

Codex guardian 검토 승인을 사용하려면 `appServer.mode: "guardian"`을 설정하세요:

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

`guardian` 프리셋은 해당 값이 허용될 때 `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"`, 그리고 `sandbox: "workspace-write"`로 확장됩니다. 개별 정책 필드는 `mode`를 오버라이드합니다. 이전
`guardian_subagent` reviewer 값은 호환성 별칭으로 여전히 허용되지만, 새 구성은 `auto_review`를 사용해야 합니다.

OpenClaw 샌드박스가 활성 상태일 때도 로컬 Codex 앱 서버 프로세스는 Gateway 호스트에서 실행됩니다. 따라서 OpenClaw는 Codex 호스트 측 샌드박싱을 OpenClaw 샌드박스 백엔드와 동등하게 취급하는 대신, 해당 턴에서 Codex 네이티브 Code Mode, 사용자 MCP 서버, 앱 기반 Plugin 실행을 비활성화합니다. 일반 exec/process 도구를 사용할 수 있을 때는 `sandbox_exec` 및 `sandbox_process` 같은 OpenClaw 샌드박스 기반 동적 도구를 통해 셸 접근이 노출됩니다.

Ubuntu/AppArmor 호스트에서 활성 OpenClaw 샌드박싱 없이 의도적으로 네이티브 Codex `workspace-write`를 실행하면, 셸 명령이 시작되기 전에 Codex bwrap가 `workspace-write`에서 실패할 수 있습니다. `bwrap: setting up uid map: Permission denied` 또는
`bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`가 보이면 더 넓은 Docker 컨테이너 권한을 부여하지 말고 `openclaw doctor`를 실행한 뒤 OpenClaw 서비스 사용자의 보고된 호스트 네임스페이스 정책을 수정하세요. 서비스 프로세스에는 범위가 지정된 AppArmor 프로필을 선호하세요.
`kernel.apparmor_restrict_unprivileged_userns=0` 폴백은 호스트 전체에 적용되며 보안상 트레이드오프가 있습니다.

## 샌드박스된 네이티브 실행

안정적인 기본값은 실패 시 폐쇄입니다. 활성 OpenClaw 샌드박싱은 그렇지 않으면 Codex 앱 서버 호스트에서 실행될 네이티브 Codex 실행 표면을 비활성화합니다. OpenClaw의 샌드박스 백엔드로 Codex의 원격 환경 지원을 시험하려는 경우에만 `appServer.experimental.sandboxExecServer: true`를 사용하세요. 이 프리뷰 경로에는 Codex 앱 서버 0.132.0 이상이 필요합니다.

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

플래그가 켜져 있고 현재 OpenClaw 세션이 샌드박스되어 있으면, OpenClaw는 활성 샌드박스가 뒷받침하는 local loopback exec-server를 시작하고, 이를 Codex 앱 서버에 등록한 다음, 해당 OpenClaw 소유 환경으로 Codex 스레드와 턴을 시작합니다. 앱 서버가 환경을 등록할 수 없으면, 실행은 호스트 실행으로 조용히 폴백하는 대신 실패 시 폐쇄됩니다.

이 프리뷰 경로는 로컬 전용입니다. 원격 WebSocket 앱 서버는 같은 호스트에서 실행 중이 아니면 loopback exec-server에 도달할 수 없으므로 OpenClaw는 해당 조합을 거부합니다.

## 인증 및 환경 격리

기본 에이전트별 홈에서는 다음 순서로 인증이 선택됩니다:

1. 에이전트에 대한 명시적 OpenClaw Codex 인증 프로필.
2. 해당 에이전트의 Codex 홈에 있는 앱 서버의 기존 계정.
3. 로컬 stdio 앱 서버 실행에 한해서, 앱 서버 계정이 없고 OpenAI 인증이 여전히 필요한 경우 `CODEX_API_KEY`, 그다음
   `OPENAI_API_KEY`.

OpenClaw가 ChatGPT 구독 스타일 Codex 인증 프로필을 발견하면, 생성된 Codex 자식 프로세스에서 `CODEX_API_KEY`와 `OPENAI_API_KEY`를 제거합니다. 이를 통해 Gateway 수준 API 키는 임베딩이나 직접 OpenAI 모델에 사용할 수 있게 유지하면서, 네이티브 Codex 앱 서버 턴이 실수로 API를 통해 과금되지 않도록 합니다.

명시적 Codex API 키 프로필과 로컬 stdio env 키 폴백은 상속된 자식 프로세스 env 대신 앱 서버 로그인을 사용합니다. WebSocket 앱 서버 연결은 Gateway env API 키 폴백을 받지 않습니다. 명시적 인증 프로필이나 원격 앱 서버 자체 계정을 사용하세요.

Stdio 앱 서버 실행은 기본적으로 OpenClaw의 프로세스 환경을 상속합니다. OpenClaw는 Codex 앱 서버 계정 브리지를 소유하며 `CODEX_HOME`을 해당 에이전트의 OpenClaw 상태 아래 에이전트별 디렉터리로 설정합니다. 이렇게 하면 Codex 구성, 계정, Plugin 캐시/데이터, 스레드 상태가 운영자의 개인 `~/.codex` 홈에서 유입되지 않고 OpenClaw 에이전트 범위에 유지됩니다.

네이티브 Codex 상태를 Codex Desktop 및 CLI와 공유하려면 `appServer.homeScope: "user"`를 설정하세요. 이 로컬 stdio 전용 모드는 `$CODEX_HOME`이 설정되어 있으면 이를 사용하고, 그렇지 않으면 `~/.codex`를 사용합니다. 여기에는 네이티브 인증, 구성, plugins, 스레드가 포함됩니다. OpenClaw는 앱 서버에 대한 인증 프로필 브리지를 건너뜁니다. 검증된 owner 턴은 `codex_threads`를 사용해 해당 스레드를 나열, 검색, 읽기, 포크, 이름 변경, 보관 및 복원할 수 있습니다. OpenClaw에서 계속하기 전에 스레드를 포크하세요. 독립적인 Codex 프로세스들은 같은 스레드에 대한 동시 writer를 조정하지 않습니다.

OpenClaw는 일반 로컬 앱 서버 실행에서 `HOME`을 다시 쓰지 않습니다. `openclaw`, `gh`, `git`, 클라우드 CLI, 셸 명령 같은 Codex 실행 하위 프로세스는 일반 프로세스 홈을 보고 사용자 홈 구성과 토큰을 찾을 수 있습니다. Codex는 `$HOME/.agents/skills`와 `$HOME/.agents/plugins/marketplace.json`도 발견할 수 있습니다. 이 `.agents` 발견은 의도적으로 운영자 홈과 공유되며, 격리된 `~/.codex` 상태와는 별개입니다.

기본 에이전트 범위에서는 OpenClaw plugins와 OpenClaw skill 스냅샷이 여전히 OpenClaw 자체 Plugin 레지스트리와 skill 로더를 통해 흐릅니다. 개인 Codex `~/.codex` 자산은 그렇지 않습니다. 격리된 OpenClaw 에이전트의 일부가 되어야 하는 유용한 Codex CLI skills 또는 plugins가 Codex 홈에 있다면, 명시적으로 인벤토리화하세요:

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

배포에 추가 환경 격리가 필요하면 해당 변수를 `appServer.clearEnv`에 추가하세요:

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

`appServer.clearEnv`는 생성된 Codex 앱 서버 자식 프로세스에만 영향을 줍니다. OpenClaw는 로컬 실행 정규화 중 이 목록에서 `CODEX_HOME`과 `HOME`을 제거합니다. `CODEX_HOME`은 선택된 에이전트 또는 사용자 범위를 계속 가리키고, `HOME`은 하위 프로세스가 일반 사용자 홈 상태를 사용할 수 있도록 계속 상속됩니다.

## 동적 도구

Codex 동적 도구는 기본적으로 `searchable` 로딩을 사용합니다. OpenClaw는 Codex 네이티브 워크스페이스 작업과 중복되는 동적 도구를 노출하지 않습니다:

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

메시징, 미디어, Cron, 브라우저, 노드, Gateway, `heartbeat_respond`, `web_search` 같은 대부분의 나머지 OpenClaw 통합 도구는 `openclaw` 네임스페이스 아래 Codex 도구 검색을 통해 사용할 수 있습니다. 이렇게 하면 초기 모델 컨텍스트가 더 작아집니다. `sessions_yield`와 메시지 도구 전용 소스 응답은 턴 제어 계약이므로 direct로 유지됩니다. `sessions_spawn`은 searchable로 유지되어 Codex의 네이티브 `spawn_agent`가 기본 Codex 하위 에이전트 표면으로 남고, 명시적 OpenClaw 또는 ACP 위임은 여전히 `openclaw` 동적 도구 네임스페이스를 통해 사용할 수 있습니다.

지연된 동적 도구를 검색할 수 없는 사용자 지정 Codex 앱 서버에 연결하거나 전체 도구 페이로드를 디버깅할 때만 `codexDynamicToolsLoading: "direct"`를 설정하세요.

## 시간 제한

OpenClaw 소유 동적 도구 호출은 `appServer.requestTimeoutMs`와 독립적으로 제한됩니다. 각 Codex `item/tool/call` 요청은 다음 순서로 첫 번째 사용 가능한 시간 제한을 사용합니다:

- 양수 per-call `timeoutMs` 인수.
- `image_generate`의 경우 `agents.defaults.imageGenerationModel.timeoutMs`.
- 구성된 시간 제한이 없는 `image_generate`의 경우 120초 이미지 생성 기본값.
- 미디어 이해 `image` 도구의 경우 `tools.media.image.timeoutSeconds`를 밀리초로 변환한 값, 또는 60초 미디어 기본값. 이미지 이해의 경우 이는 요청 자체에 적용되며 이전 준비 작업으로 줄어들지 않습니다.
- 90초 동적 도구 기본값.

이 watchdog은 외부 동적 `item/tool/call` 예산입니다. Provider별 요청 시간 제한은 해당 호출 안에서 실행되며 자체 시간 제한 의미를 유지합니다. 동적 도구 예산은 600000 ms로 제한됩니다. 시간 제한 시 OpenClaw는 지원되는 경우 도구 신호를 중단하고 실패한 동적 도구 응답을 Codex에 반환하여, 세션이 `processing`에 남는 대신 턴이 계속될 수 있게 합니다.

Codex가 턴을 수락한 뒤, 그리고 OpenClaw가 턴 범위 앱 서버 요청에 응답한 뒤, 하네스는 Codex가 현재 턴 진행을 수행하고 결국 `turn/completed`로 네이티브 턴을 완료할 것을 기대합니다. 앱 서버가 `appServer.turnCompletionIdleTimeoutMs` 동안 조용해지면, OpenClaw는 최선의 노력으로 Codex 턴을 인터럽트하고, 진단용 시간 제한을 기록하며, 후속 채팅 메시지가 오래된 네이티브 턴 뒤에 대기하지 않도록 OpenClaw 세션 lane을 해제합니다.

대부분의 동일 턴 비터미널 알림은 Codex가 해당 턴이 아직 살아 있음을 증명했기 때문에 이 짧은 감시 장치를 해제합니다. 도구 핸드오프는 더 긴 도구 이후 유휴 예산을 사용합니다. OpenClaw가 `item/tool/call` 응답을 반환한 뒤, `commandExecution` 같은 네이티브 도구 항목이 완료된 뒤, 원시 `custom_tool_call_output` 완료 뒤, 그리고 도구 이후 원시 어시스턴트 진행, 원시 추론 완료 또는 추론 진행 뒤에 적용됩니다. 이 가드는 구성된 경우 `appServer.postToolRawAssistantCompletionIdleTimeoutMs`를 사용하고, 그렇지 않으면 기본값으로 5분을 사용합니다. 동일한 도구 이후 예산은 Codex가 다음 현재 턴 이벤트를 내보내기 전 조용한 합성 구간의 진행 감시 장치도 연장합니다. 추론 완료, commentary `agentMessage` 완료, 도구 이전 원시 추론 또는 어시스턴트 진행 뒤에는 자동 최종 응답이 이어질 수 있으므로, 세션 레인을 즉시 해제하는 대신 진행 이후 응답 가드를 사용합니다. 최종/비-commentary 완료 `agentMessage` 항목과 도구 이전 원시 어시스턴트 완료만 어시스턴트 출력 해제를 장착합니다. 이후 Codex가 `turn/completed` 없이 조용해지면 OpenClaw는 최선 노력으로 네이티브 턴을 인터럽트하고 세션 레인을 해제합니다. 어시스턴트, 도구, 활성 항목 또는 부작용 증거가 없는 턴 완료 유휴 타임아웃을 포함한 재생 안전 stdio 앱 서버 실패는 새 앱 서버 시도에서 한 번 재시도됩니다. 안전하지 않은 타임아웃은 여전히 멈춘 앱 서버 클라이언트를 폐기하고 OpenClaw 세션 레인을 해제합니다. 또한 자동으로 재생되는 대신 오래된 네이티브 스레드 바인딩을 지웁니다. 완료 감시 타임아웃은 Codex 전용 타임아웃 문구를 표시합니다. 재생 안전 사례는 응답이 불완전할 수 있다고 말하고, 안전하지 않은 사례는 재시도하기 전에 현재 상태를 확인하라고 사용자에게 알립니다. 공개 타임아웃 진단에는 마지막 앱 서버 알림 메서드, 원시 어시스턴트 응답 항목 id/type/role, 활성 요청/항목 수, 장착된 감시 상태 같은 구조적 필드가 포함됩니다. 마지막 알림이 원시 어시스턴트 응답 항목인 경우에는 제한된 어시스턴트 텍스트 미리보기도 포함됩니다. 원시 프롬프트나 도구 콘텐츠는 포함하지 않습니다.

## 모델 검색

기본적으로 Codex Plugin은 앱 서버에 사용 가능한 모델을 요청합니다. 모델 가용성은 Codex 앱 서버가 소유하므로, OpenClaw가 번들된 `@openai/codex` 버전을 업그레이드하거나 배포가 `appServer.command`를 다른 Codex 바이너리로 지정하면 목록이 바뀔 수 있습니다. 가용성은 계정 범위일 수도 있습니다. 실행 중인 Gateway에서 `/codex models`를 사용해 해당 하네스와 계정의 실시간 카탈로그를 확인하세요.

검색이 실패하거나 타임아웃되면 OpenClaw는 다음에 대해 번들된 대체 카탈로그를 사용합니다.

- GPT-5.5
- GPT-5.4 mini

현재 번들된 하네스는 `@openai/codex` `0.142.5`입니다. 해당 번들 앱 서버에 대한 `model/list` 프로브는 다음 공개 선택기 행을 반환했습니다.

| 모델 ID               | 입력 모달리티 | 추론 노력                |
| --------------------- | ------------- | ------------------------ |
| `gpt-5.5`             | text, image   | low, medium, high, xhigh |
| `gpt-5.4`             | text, image   | low, medium, high, xhigh |
| `gpt-5.4-mini`        | text, image   | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | text          | low, medium, high, xhigh |

숨겨진 모델은 내부 또는 특수 흐름을 위해 앱 서버 카탈로그에서 반환될 수 있지만, 일반적인 모델 선택기 옵션은 아닙니다.

`plugins.entries.codex.config.discovery`에서 검색을 조정하세요.

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

시작 시 Codex 프로브를 피하고 대체 카탈로그만 사용하려면 검색을 비활성화하세요.

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

## 작업 영역 부트스트랩 파일

Codex는 네이티브 프로젝트 문서 검색을 통해 `AGENTS.md`를 직접 처리합니다. OpenClaw는 합성 Codex 프로젝트 문서 파일을 작성하지 않으며 persona 파일에 대해 Codex 대체 파일 이름에 의존하지 않습니다. Codex 대체는 `AGENTS.md`가 없을 때만 적용되기 때문입니다.

OpenClaw 작업 영역 동등성을 위해 Codex 하네스는 다른 부트스트랩 파일을 확인합니다. `SOUL.md`, `IDENTITY.md`, `TOOLS.md`, `USER.md`는 활성 에이전트, 사용 가능한 작업 영역 지침, 사용자 프로필을 정의하므로 OpenClaw Codex 개발자 지침으로 전달됩니다. 압축된 OpenClaw Skills 목록은 턴 범위 협업 개발자 지침으로 전달됩니다. `HEARTBEAT.md` 콘텐츠는 삽입되지 않습니다. Heartbeat 턴은 파일이 존재하고 비어 있지 않을 때 해당 파일을 읽으라는 협업 모드 포인터를 받습니다. 구성된 에이전트 작업 영역의 `MEMORY.md` 콘텐츠는 해당 작업 영역에서 메모리 도구를 사용할 수 있을 때 네이티브 Codex 턴 입력에 붙여넣지 않습니다. 파일이 존재하면 하네스는 턴 범위 협업 개발자 지침에 작은 작업 영역 메모리 포인터를 추가하며, 지속 메모리가 관련될 때 Codex는 `memory_search` 또는 `memory_get`을 사용해야 합니다. 도구가 비활성화되어 있거나, 메모리 검색을 사용할 수 없거나, 활성 작업 영역이 에이전트 메모리 작업 영역과 다른 경우 `MEMORY.md`는 일반적인 제한된 턴 컨텍스트 경로를 사용합니다.
`BOOTSTRAP.md`가 있으면 OpenClaw 턴 입력 참조 컨텍스트로 전달됩니다.

## 환경 재정의

로컬 테스트를 위해 환경 재정의는 계속 사용할 수 있습니다.

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`appServer.command`가 설정되지 않은 경우 `OPENCLAW_CODEX_APP_SERVER_BIN`은 관리형 바이너리를 우회합니다.

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신 `plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나, 일회성 로컬 테스트에는 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을 사용하세요. 반복 가능한 배포에는 구성이 선호됩니다. Plugin 동작을 나머지 Codex 하네스 설정과 같은 검토된 파일에 유지하기 때문입니다.

## 관련 항목

- [Codex 하네스](/ko/plugins/codex-harness)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)
- [Codex Computer Use](/ko/plugins/codex-computer-use)
- [OpenAI 제공자](/ko/providers/openai)
- [구성 참조](/ko/gateway/configuration-reference)
