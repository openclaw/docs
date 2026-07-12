---
read_when:
    - 작성된 policy.jsonc를 기준으로 OpenClaw 설정을 확인하려는 경우
    - doctor 린트에 정책 관련 진단 결과가 필요합니다
    - 감사 증거를 위한 정책 증명 해시가 필요합니다
summary: '`openclaw policy` 적합성 검사를 위한 CLI 참조 문서'
title: 정책
x-i18n:
    generated_at: "2026-07-12T00:38:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy`는 번들 Policy Plugin에서 제공합니다. 이는 기존 OpenClaw 설정 위에 적용되는 엔터프라이즈 적합성 계층이지, 두 번째 구성 시스템이 아닙니다. 요구 사항은 `policy.jsonc`에 작성하며, OpenClaw는 활성 워크스페이스를 증거로 관찰하고, Policy는 `doctor --lint`를 통해 드리프트를 보고합니다. Policy는 요청 시점에 도구 호출을 강제하거나 런타임 동작을 다시 작성하지 않으며, `auth-profiles.json` 같은 에이전트별 자격 증명 저장소를 증명하지도 않습니다.

Policy는 구성된 채널, MCP 서버, 모델 제공자, 네트워크 SSRF 태세, 인그레스/채널 접근, Gateway 노출 및 Node 명령 태세, 에이전트 워크스페이스 접근, 샌드박스 태세, 데이터 처리 태세, 비밀 제공자/인증 프로필 태세, 관리 대상 도구 메타데이터(`TOOLS.md`)를 검사합니다. 워크스페이스에 "Telegram을 활성화해서는 안 됩니다" 또는 "관리 대상 도구는 위험 및 소유자 메타데이터를 선언해야 합니다"와 같이 지속적으로 검사할 수 있는 명세가 필요할 때 사용하십시오. 증명이나 드리프트 감지 없이 로컬 동작만 필요하다면 일반 구성으로 충분합니다.

## 빠른 시작

```bash
openclaw plugins enable policy
```

`policy.jsonc`가 없어도 Plugin은 활성화된 상태를 유지하므로, doctor가 검사를 조용히 건너뛰는 대신 누락된 아티팩트를 보고할 수 있습니다.

`policy.jsonc`는 직접 작성해야 하며 현재 설정에서 생성되지 않습니다. 각 최상위 섹션은 규칙 네임스페이스입니다. 그 아래에 구체적인 규칙이 있을 때만 검사가 실행됩니다(지원되지 않는 섹션이나 키는 조용히 무시되지 않고 `policy/policy-jsonc-invalid`로 실패합니다). 지원되는 모든 섹션을 포함하는 최소 예시는 다음과 같습니다.

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

아래 규칙 표만으로는 명확하지 않은 공통 참고 사항은 다음과 같습니다.

- 비-local loopback 바인딩을 거부하면서 `gateway.bind`를 생략하면 런타임 기본값을 수용한다는 의미입니다. 엄격한 적합성을 위해서는 `gateway.bind: "loopback"`을 설정하십시오.
- 읽기 전용 에이전트의 경우 해당 기본값/에이전트에서 샌드박스 `mode`를 `all` 또는 `non-main`으로 설정하고 `workspaceAccess`를 `none` 또는 `ro`로 설정하십시오. 샌드박스 모드가 누락되거나 `off`이면 읽기 전용 Policy를 충족하지 않습니다.
- `agents.workspace.denyTools`는 `exec`, `process`, `write`, `edit`, `apply_patch`를 허용합니다. 구성의 도구 거부 그룹 `group:fs`(파일 변경)와 `group:runtime`(셸/프로세스)은 이에 상응하는 태세를 충족합니다.
- 실행 승인 검사는 `execApprovals` 규칙이 있을 때만 실제 `exec-approvals.json` 아티팩트를 읽습니다. 누락되거나 유효하지 않은 아티팩트는 인위적인 통과가 아니라 관찰할 수 없는 증거입니다.
- 비밀 및 인증 프로필 증거는 제공자/소스 태세와 SecretRef 메타데이터만 기록하며 원시 값은 절대 기록하지 않습니다. Policy는 `auth-profiles.json` 같은 에이전트별 자격 증명 저장소를 읽거나 증명하지 않습니다.
- 데이터 처리 증거는 구성 수준의 태세(수정 모드, 텔레메트리 캡처 토글, 세션 유지 관리 모드, 대화록 인덱싱 설정)일 뿐입니다. 로그, 텔레메트리 내보내기, 대화록 또는 메모리 파일은 검사하지 않으며, 검사 결과가 깨끗하더라도 그 안에 개인 데이터나 비밀이 없다는 사실을 입증하지는 않습니다.

### Policy 규칙 참조

아래의 모든 규칙은 선택 사항이며, 규칙이 있을 때만 검사가 실행됩니다. 관찰되는 상태는 기존 OpenClaw 구성 또는 워크스페이스 메타데이터입니다.

#### 범위 지정 오버레이

특정 에이전트나 채널에 최상위 기준선보다 엄격한 Policy가 필요한 경우 `scopes.<scopeName>`을 사용하십시오. 범위 이름은 단순한 레이블이며, 일치는 범위 내부의 선택기를 사용합니다. 오버레이는 추가 방식으로 적용됩니다. 전역 규칙은 계속 실행되며, 범위 지정 규칙은 동일한 증거에 대해 자체 결과를 추가할 수 있습니다.

| 선택기       | 지원되는 섹션                                                                 | 사용 시점                                           |
| ------------ | ------------------------------------------------------------------------------ | --------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | 하나 이상의 런타임 에이전트에 더 엄격한 규칙이 필요할 때 |
| `channelIds` | `ingress.channels`                                                             | 하나 이상의 채널에 더 엄격한 인그레스 규칙이 필요할 때   |

`agentIds` 항목이 `agents.list[]`에 없으면 OpenClaw는 건너뛰는 대신 해당 런타임 에이전트 ID에 상속된 전역/기본 태세를 기준으로 범위 지정 규칙을 평가합니다.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

위와 같이 각 범위가 서로 다른 필드를 관리한다면 동일한 에이전트가 여러 범위에 나타날 수 있습니다. 동일한 에이전트에 대해 범위 지정 필드가 반복되면 동일하거나 더 엄격해야 합니다. 더 약한 중복 선언은 거부됩니다(허용 목록은 부분집합, 거부 목록은 상위집합이어야 하며 필수 불리언 값은 고정됩니다).

컨테이너 태세 규칙(`sandbox.containers.*`)은 일치하는 에이전트의 샌드박스 백엔드가 노출할 수 있는 증거에 대해서만 검사됩니다. 백엔드가 활성화된 규칙을 관찰할 수 없다면 Policy는 통과시키는 대신 `policy/sandbox-container-posture-unobservable`을 보고합니다. 컨테이너 규칙의 범위는 해당 규칙을 노출할 수 있는 백엔드를 사용하는 에이전트 그룹으로 지정하십시오.

최상위 `ingress.session.requireDmScope`는 전역으로 유지됩니다. `session.dmScope`는 채널에 귀속할 수 있는 증거가 아니므로 `channelIds`로 범위를 지정할 수 없습니다.

`policy.jsonc`에 있는 모든 범위는 유효하고 적용 가능해야 합니다.

#### 채널

| Policy 필드                          | 관찰되는 상태                            | 사용 시점                                                        |
| ------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | `channels.*` 제공자 및 활성화 상태       | `telegram` 같은 제공자의 구성된 채널을 거부할 때                 |
| `channels.denyRules[].reason`        | 결과 메시지 및 복구 힌트 컨텍스트        | 제공자가 거부된 이유를 설명할 때                                 |

#### MCP 서버

| Policy 필드         | 관찰되는 상태       | 사용 시점                                                     |
| ------------------- | ------------------- | ------------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ID  | 구성된 모든 MCP 서버가 허용 목록에 포함되도록 요구할 때       |
| `mcp.servers.deny`  | `mcp.servers.*` ID  | 구성된 특정 MCP 서버 ID를 거부할 때                            |

#### 모델 제공자

| Policy 필드              | 관찰되는 상태                                    | 사용 시점                                                                        |
| ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ID 및 선택된 모델 참조      | 구성된 제공자와 선택된 모델 참조가 승인된 제공자를 사용하도록 요구할 때          |
| `models.providers.deny`  | `models.providers.*` ID 및 선택된 모델 참조      | 구성된 제공자와 선택된 모델 참조를 제공자 ID별로 거부할 때                        |

#### 네트워크

| Policy 필드                    | 관찰되는 상태                         | 사용 시점                                                           |
| ------------------------------ | ------------------------------------- | ------------------------------------------------------------------- |
| `network.privateNetwork.allow` | 사설 네트워크 SSRF 우회 수단          | 사설 네트워크 접근이 비활성화된 상태를 유지하도록 요구하려면 `false`로 설정 |

#### 인그레스 및 채널 접근

| 정책 필드                               | 관찰된 상태                                                    | 사용 시점                                                                  |
| --------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`        | `session.dmScope`                                              | 검토된 다이렉트 메시지 격리 범위를 요구합니다.                             |
| `ingress.channels.allowDmPolicies`      | `channels.*.dmPolicy` 및 레거시 채널 DM 정책 필드              | 검토된 다이렉트 메시지 채널 정책만 허용합니다.                             |
| `ingress.channels.denyOpenGroups`       | 채널, 계정 및 그룹 인그레스 정책                               | 구성된 채널 및 계정에 대한 개방형 그룹 인그레스를 거부합니다.              |
| `ingress.channels.requireMentionInGroups` | 채널, 계정, 그룹, 길드 및 중첩된 멘션 게이트 구성             | 그룹 인그레스가 개방되어 있거나 멘션으로 제한될 때 멘션 게이트를 요구합니다. |

#### Gateway

| 정책 필드                             | 관찰된 상태                                     | 사용 시점                                                                                         |
| ------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                | local loopback Gateway 바인딩을 요구하려면 `false`로 설정합니다.                                  |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale 서브/퍼널 Gateway 보안 태세         | Tailscale Funnel 노출을 거부하려면 `false`로 설정합니다.                                          |
| `gateway.auth.requireAuth`            | `gateway.auth.mode`                             | 비활성화된 Gateway 인증을 거부하려면 `true`로 설정합니다.                                         |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                      | 명시적인 인증 속도 제한 구성을 요구하려면 `true`로 설정합니다.                                    |
| `gateway.controlUi.allowInsecure`     | 제어 UI의 안전하지 않은 인증/장치/오리진 토글  | 안전하지 않은 제어 UI 노출 토글을 거부하려면 `false`로 설정합니다.                                |
| `gateway.remote.allow`                | 원격 Gateway 모드/구성                          | 원격 Gateway 모드를 거부하려면 `false`로 설정합니다.                                              |
| `gateway.http.denyEndpoints`          | Gateway HTTP API 엔드포인트                     | `chatCompletions` 또는 `responses`와 같은 엔드포인트 ID를 거부합니다.                              |
| `gateway.http.requireUrlAllowlists`   | Gateway HTTP URL 가져오기 입력                  | URL 가져오기 입력에 URL 허용 목록을 요구하려면 `true`로 설정합니다.                               |
| `gateway.nodes.denyCommands`          | `gateway.nodes.denyCommands`                    | `system.run`과 같은 정확한 Node 명령 ID가 OpenClaw 구성에서 거부되도록 요구합니다.                 |

`gateway.nodes.denyCommands`는 정확하며 대소문자를 구분하는 거부 상위 집합 규칙입니다.
정책이 권한 있는 Node 명령이 OpenClaw 구성에서 명시적으로
거부됨을 입증해야 할 때 사용합니다. 권한 있는 Node 명령을 의도적으로 허용하는
배포는 `gateway.nodes.allowCommands`에만 의존하지 말고 검토 후
`policy.jsonc`를 업데이트해야 합니다.

#### 에이전트 작업 공간

| 정책 필드                       | 관찰된 상태                                                                           | 사용 시점                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 및 `agents.list[].sandbox.workspaceAccess` | `none` 또는 `ro`와 같은 샌드박스 작업 공간 접근 값만 허용합니다.                           |
| `agents.workspace.denyTools`    | 전역 및 에이전트별 도구 거부 구성                                                     | 변경 도구(`exec`, `process`, `write`, `edit`, `apply_patch`)가 거부되도록 요구합니다.       |

#### 샌드박스 보안 태세

| 정책 필드                                            | 관찰된 상태                                             | 사용 시점                                                           |
| ---------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------- |
| `sandbox.requireMode`                                | `agents.defaults.sandbox.mode` 및 에이전트별 모드      | `all` 또는 `non-main`과 같이 검토된 샌드박스 모드만 허용합니다.     |
| `sandbox.allowBackends`                              | `agents.defaults.sandbox.backend` 및 에이전트별 백엔드 | `docker`와 같이 검토된 샌드박스 백엔드만 허용합니다.                |
| `sandbox.containers.denyHostNetwork`                 | 컨테이너 기반 샌드박스/브라우저 네트워크 모드          | 호스트 네트워크 모드를 거부합니다.                                  |
| `sandbox.containers.denyContainerNamespaceJoin`      | 컨테이너 기반 샌드박스/브라우저 네트워크 모드          | 다른 컨테이너의 네트워크 네임스페이스 참여를 거부합니다.            |
| `sandbox.containers.requireReadOnlyMounts`           | 컨테이너 기반 샌드박스/브라우저 마운트 모드            | 마운트가 읽기 전용이도록 요구합니다.                                |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 컨테이너 기반 샌드박스/브라우저 마운트 대상           | 컨테이너 런타임 소켓 마운트를 거부합니다.                           |
| `sandbox.containers.denyUnconfinedProfiles`          | 컨테이너 보안 프로필 태세                               | 제한되지 않은 컨테이너 보안 프로필을 거부합니다.                    |
| `sandbox.browser.requireCdpSourceRange`              | 샌드박스 브라우저 CDP 소스 범위                         | 브라우저 CDP 노출에 소스 범위를 선언하도록 요구합니다.              |

정책은 누락된 `sandbox.mode`를 암시적 기본값인 `off`로 처리하므로,
`sandbox.requireMode`는 신규 또는 구성되지 않은 샌드박스를
`["all"]`과 같은 허용 목록 밖에 있는 것으로 보고합니다.

#### 데이터 처리

| 정책 필드                                          | 관찰된 상태                                                                          | 사용 시점                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`   | `logging.redactSensitive`                                                            | `logging.redactSensitive: "off"`를 거부하려면 `true`로 설정합니다.            |
| `dataHandling.telemetry.denyContentCapture`        | `diagnostics.otel.captureContent`                                                    | 텔레메트리 콘텐츠 캡처를 거부하려면 `true`로 설정합니다.                     |
| `dataHandling.retention.requireSessionMaintenance` | `session.maintenance.mode`                                                           | 유효 세션 유지 관리 모드 `enforce`를 요구하려면 `true`로 설정합니다.          |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 및 `agents.*.memorySearch.experimental.sessionMemory` | 세션 대화 기록의 메모리 인덱싱을 거부하려면 `true`로 설정합니다.             |

#### 시크릿

| 정책 필드                        | 관찰된 상태                                              | 사용 시점                                                                   |
| -------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 구성 SecretRef 및 `secrets.providers.*` 선언            | SecretRef가 선언된 공급자를 가리키도록 요구하려면 `true`로 설정합니다.       |
| `secrets.denySources`            | 시크릿 공급자 소스 및 SecretRef 소스                     | `exec`, `file` 또는 구성된 다른 소스 이름과 같은 소스를 거부합니다.          |
| `secrets.allowInsecureProviders` | 안전하지 않은 시크릿 공급자 태세 플래그                  | 안전하지 않은 태세를 선택한 공급자를 거부하려면 `false`로 설정합니다.        |

#### 실행 승인

실행 승인 검사는 런타임 `exec-approvals.json` 아티팩트를 읽습니다.
기본 경로는 `~/.openclaw/exec-approvals.json`이며,
`OPENCLAW_STATE_DIR`이 설정된 경우에는 `$OPENCLAW_STATE_DIR/exec-approvals.json`입니다.
`execApprovals.defaults.*` 또는 `execApprovals.agents.*` 아래의
보안 태세 규칙에는 읽을 수 있는 아티팩트 증거가 필요합니다. 아티팩트가 없거나 유효하지 않으면
최선형 통과가 아니라 관찰 불가능한 증거로 보고됩니다. 읽을 수 있게 되면 생략된
필드는 런타임 기본값을 상속합니다. 누락된 `defaults.security`는 `full`이며,
누락된 에이전트 보안은 해당 기본값을 상속합니다. 증거에는 `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, 선택적 `argPattern`, 유효한
`autoAllowSkills` 보안 태세 및 항목 소스가 포함되며, 소켓 경로/토큰,
`commandText`, `lastUsedCommand`, 확인된 경로 또는 타임스탬프는 절대 포함되지 않습니다.

| 정책 필드                                  | 관찰된 상태                                                                            | 사용 시점                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                | 활성 런타임 `exec-approvals.json` 경로                                                 | 승인 아티팩트가 존재하고 파싱되도록 요구하려면 `true`로 설정합니다.                            |
| `execApprovals.defaults.allowSecurity`     | `defaults.security`, 기본값은 `full`                                                   | 승인된 기본 승인 보안 모드만 허용합니다.                                                      |
| `execApprovals.agents.allowSecurity`       | 기본값을 상속하는 `agents.*.security`                                                  | 승인된 에이전트별 유효 승인 보안 모드만 허용합니다.                                           |
| `execApprovals.agents.allowAutoAllowSkills` | 런타임 기본값을 상속하는 `defaults.autoAllowSkills` 및 `agents.*.autoAllowSkills`     | 암시적 Skills CLI 승인 없이 엄격한 수동 허용 목록을 요구하려면 `false`로 설정합니다.           |
| `execApprovals.agents.allowlist.expected`  | 집계된 `agents.*.allowlist[]` 패턴 및 선택적 argPattern 항목                           | 승인 허용 목록이 검토된 패턴 집합과 일치하도록 요구합니다.                                    |

예: 승인 아티팩트를 요구하고, 허용 범위가 넓은 기본값을 거부하며, 선택한 에이전트에 대해
검토된 실행 승인 보안 태세만 허용합니다.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // 보안 모드: "deny", "allowlist" 또는 "full".
      // 이 기본값은 잠금이 적용된 거부 태세만 허용합니다.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // 선택된 에이전트는 검토된 허용 목록 태세를 사용할 수 있지만 "full"은 사용할 수 없습니다.
          "allowSecurity": ["allowlist"],
          // false이면 Skills CLI가 autoAllowSkills를 통해 암묵적으로 승인되는 대신
          // 검토된 허용 목록에 포함되어야 합니다.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // 단순 항목: argPattern이 없는, 정확히 검토된 실행 파일 패턴입니다.
              "travel-hub",
              // 제한 항목: 패턴과 검토된 인수 정규식입니다.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### 인증 프로필

| 정책 필드                      | 관찰된 상태                                  | 사용 시점                                                                                  |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` 공급자 및 모드 메타데이터 | 구성 인증 프로필에 `provider`, `mode` 등의 메타데이터 키를 요구합니다.                    |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | `api_key`, `aws-sdk`, `oauth`, `token` 등 지원되는 인증 프로필 모드만 허용합니다.          |

#### 도구 메타데이터

| 정책 필드              | 관찰된 상태                    | 사용 시점                                                                                 |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | 관리되는 `TOOLS.md` 선언       | 관리되는 도구가 `risk`, `sensitivity`, `owner` 등의 메타데이터 키를 선언하도록 요구합니다. |

#### 도구 태세

| 정책 필드                      | 관찰된 상태                                                 | 사용 시점                                                                                                  |
| ------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 및 `agents.list[].tools.profile`            | `minimal`, `messaging`, `coding` 등의 도구 프로필 ID만 허용합니다.                                         |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 및 에이전트별 `tools.fs` 재정의    | 파일 시스템 도구가 워크스페이스 전용 태세를 취하도록 요구하려면 `true`로 설정합니다.                       |
| `tools.exec.allowSecurity`      | `tools.exec.security` 및 에이전트별 실행 보안                | `deny`, `allowlist` 등의 실행 보안 모드만 허용합니다.                                                      |
| `tools.exec.requireAsk`         | `tools.exec.ask` 및 에이전트별 실행 확인 모드                | `always` 등의 승인 태세를 요구합니다.                                                                      |
| `tools.exec.allowHosts`         | `tools.exec.host` 및 에이전트별 실행 호스트 라우팅           | `sandbox` 등의 실행 호스트 라우팅 모드만 허용합니다.                                                       |
| `tools.elevated.allow`          | `tools.elevated.enabled` 및 에이전트별 권한 상승 태세        | 권한 상승 도구 모드를 비활성화된 상태로 유지하도록 요구하려면 `false`로 설정합니다.                        |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 및 에이전트별 `tools.alsoAllow`            | 정확한 `alsoAllow` 항목을 요구하고 누락되거나 예상하지 못한 추가 도구 권한 부여를 보고합니다.              |
| `tools.denyTools`               | `tools.deny` 및 `agents.list[].tools.deny`                   | 구성된 도구 거부 목록에 `group:runtime`, `group:fs` 등의 도구 ID 또는 그룹이 포함되도록 요구합니다.        |

## 검사 실행

작성 중에는 정책 전용 검사를 실행합니다.

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check`는 정책 검사 집합만 실행하고 증거, 발견 사항 및 증명 해시를
출력합니다. Policy Plugin이 활성화된 경우 동일한 발견 사항이
`openclaw doctor --lint`에도 표시됩니다.

운영자 정책 파일을 작성된 기준선과 비교합니다.

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare`는 정책 파일 구문을 다른 정책 파일 구문과 비교하며,
런타임 상태, 증거, 자격 증명 또는 비밀을 검사하지 않습니다. 범위가 지정된
오버레이를 관리하는 것과 동일한 규칙 메타데이터를 사용합니다. 허용 목록은
동일하거나 더 좁아야 하고, 거부 목록은 동일하거나 더 넓어야 하며, 필수 불리언은
그 값을 유지해야 하고, 순서가 지정된 문자열은 구성된 순서에서 더 엄격한 쪽으로만
이동할 수 있으며, 정확한 목록은 일치해야 합니다. 기준선은 조직에서 작성한
정책일 수 있으며, 검사 대상 정책에는 더 엄격한 값이나 추가 규칙을 넣을 수
있습니다. 최상위 검사 대상 규칙은 동일하거나 더 제한적인 경우 범위가 지정된
기준선 규칙을 충족할 수 있습니다. 파일 간에 범위 이름이 일치할 필요는 없으며,
비교는 선택자(`agentIds`/`channelIds`)와 필드를 기준으로 합니다.

문제없는 비교(`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

문제없는 `policy check --json` 출력에는 운영자나 감독자가 기록할 수 있는
안정적인 해시가 포함됩니다.

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## 정책 구성

정책 구성은 `plugins.entries.policy.config` 아래에 있습니다.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| 설정                      | 목적                                                               |
| ------------------------- | ------------------------------------------------------------------ |
| `enabled`                 | `policy.jsonc`가 존재하기 전에도 정책 검사를 활성화합니다.         |
| `workspaceRepairs`        | `doctor --fix`가 정책 관리 워크스페이스 설정을 수정하도록 허용합니다. |
| `expectedHash`            | 승인된 정책 아티팩트에 대한 선택적 해시 잠금입니다.                |
| `expectedAttestationHash` | 마지막으로 승인된 문제없는 정책 검사에 대한 선택적 해시 잠금입니다. |
| `path`                    | 정책 아티팩트의 워크스페이스 상대 위치입니다.                      |

Plugin을 설치된 상태로 유지하면서 워크스페이스의 정책 검사를 비활성화하려면
`plugins.entries.policy.config.enabled`를 `false`로 설정합니다.

## 정책 상태 승인

JSON 출력 예시:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash`는 작성된 규칙 아티팩트를 식별합니다. `evidence`는
검사에서 사용한 관찰된 OpenClaw 상태를 기록하며, `workspace.hash`는 해당 증거
페이로드를 식별합니다. `findingsHash`는 정확한 발견 사항 집합을 식별합니다.
`checkedAt`은 검사가 실행된 시점을 기록합니다. `attestationHash`는 안정적인
주장(정책 해시, 증거 해시, 발견 사항 해시 및 문제없음/문제 있음 상태)을 식별하며
의도적으로 `checkedAt`을 제외하므로 동일한 정책 상태는 항상 동일한 증명 해시를
생성합니다. 이 네 값이 함께 한 번의 정책 검사를 위한 감사 튜플을 구성합니다.

Gateway 또는 감독자가 정책을 사용하여 런타임 작업을 차단하거나 승인하거나
주석을 추가하는 경우, 마지막으로 문제없이 완료된 검사의 증명 해시를 기록해야
합니다. `checkedAt`은 감사 로그를 위해 JSON 출력에 남아 있지만 안정적인 해시의
일부는 아닙니다.

정책 상태 승인 수명 주기:

1. `policy.jsonc`를 작성하거나 검토합니다.
2. `openclaw policy check --json`을 실행합니다.
3. 문제가 없으면 `attestation.policy.hash`를 `expectedHash`로 기록합니다.
4. `attestation.attestationHash`를 `expectedAttestationHash`로 기록합니다.
5. CI 또는 릴리스 게이트에서 `openclaw doctor --lint`를 다시 실행합니다.

정책 규칙을 의도적으로 변경한 경우 깨끗한 검사 결과를 기준으로 허용된 두 해시를 모두 업데이트하세요. 작업 공간 설정만 변경되고 정책은 그대로인 경우에는 일반적으로 `expectedAttestationHash`만 변경됩니다.

`agents.workspace` 규칙을 활성화하거나 업그레이드하면 작업 공간 해시와 증명 해시에 `agentWorkspace` 증거가 추가됩니다. 활성화한 후 새 증거를 검토하고 허용된 증명 해시를 갱신하세요. 도구 태세 규칙을 활성화하거나 업그레이드해도 같은 방식으로 `toolPosture` 증거가 추가됩니다.

`openclaw policy watch`는 검사를 다시 실행하고 현재 증거가 더 이상 `expectedAttestationHash`와 일치하지 않을 때 보고합니다.

```bash
openclaw policy watch --json
```

단일 드리프트 평가가 필요한 CI 또는 스크립트에서는 `--once`를 사용하세요. `--once`가 없으면 기본적으로 2초마다 폴링합니다. 간격을 변경하려면 `--interval-ms`를 사용하세요.

## 발견 사항

| 검사 ID                                                  | 발견 사항                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `policy/policy-jsonc-missing`                            | 정책이 활성화되어 있지만 `policy.jsonc`가 없습니다.                                        |
| `policy/policy-jsonc-invalid`                            | 정책을 파싱할 수 없거나 잘못된 형식의 규칙 항목이 포함되어 있습니다.                       |
| `policy/policy-hash-mismatch`                            | 정책이 구성된 `expectedHash`와 일치하지 않습니다.                                          |
| `policy/attestation-hash-mismatch`                       | 현재 정책 증거가 더 이상 허용된 증명과 일치하지 않습니다.                                  |
| `policy/policy-conformance-invalid`                      | 기준 정책 파일 또는 검사 대상 정책 파일의 비교 구문이 잘못되었습니다.                     |
| `policy/policy-conformance-missing`                      | 검사 대상 정책 파일에 기준 정책 파일에서 요구하는 규칙이 없습니다.                        |
| `policy/policy-conformance-weaker`                       | 검사 대상 정책 파일의 값이 기준 정책 파일보다 약합니다.                                   |
| `policy/channels-denied-provider`                        | 활성화된 채널이 채널 거부 규칙과 일치합니다.                                               |
| `policy/mcp-denied-server`                               | 구성된 MCP 서버가 정책에 의해 거부됩니다.                                                  |
| `policy/mcp-unapproved-server`                           | 구성된 MCP 서버가 허용 목록에 포함되어 있지 않습니다.                                     |
| `policy/models-denied-provider`                          | 구성된 모델 제공자 또는 모델 참조가 거부된 제공자를 사용합니다.                           |
| `policy/models-unapproved-provider`                      | 구성된 모델 제공자 또는 모델 참조가 허용 목록에 포함되어 있지 않습니다.                    |
| `policy/network-private-access-enabled`                  | 정책에서 금지한 사설 네트워크 SSRF 우회 수단이 활성화되어 있습니다.                        |
| `policy/ingress-dm-policy-unapproved`                    | 채널 DM 정책이 정책 허용 목록에 포함되어 있지 않습니다.                                   |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope`가 정책에서 요구하는 DM 격리 범위와 일치하지 않습니다.                    |
| `policy/ingress-open-groups-denied`                      | 정책에서 공개 그룹 인그레스를 금지하지만 채널 그룹 정책이 `open`입니다.                    |
| `policy/ingress-group-mention-required`                  | 정책에서 멘션 게이트를 요구하지만 채널 또는 그룹 항목에서 이를 비활성화합니다.             |
| `policy/gateway-non-loopback-bind`                       | 정책에서 금지하지만 Gateway 바인딩 태세가 비루프백 노출을 허용합니다.                      |
| `policy/gateway-auth-disabled`                           | 정책에서 인증을 요구하지만 Gateway 인증이 비활성화되어 있습니다.                           |
| `policy/gateway-rate-limit-missing`                      | 정책에서 요구하지만 Gateway 인증 속도 제한 태세가 명시되어 있지 않습니다.                  |
| `policy/gateway-control-ui-insecure`                     | Gateway 제어 UI의 안전하지 않은 노출 토글이 활성화되어 있습니다.                           |
| `policy/gateway-tailscale-funnel`                        | 정책에서 금지하지만 Gateway Tailscale Funnel 노출이 활성화되어 있습니다.                   |
| `policy/gateway-remote-enabled`                          | 정책에서 금지하지만 Gateway 원격 모드가 활성화되어 있습니다.                               |
| `policy/gateway-http-endpoint-enabled`                   | 정책에서 금지한 Gateway HTTP API 엔드포인트가 활성화되어 있습니다.                         |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL 가져오기 입력에 필수 URL 허용 목록이 없습니다.                            |
| `policy/gateway-node-command-denied`                     | 정책에서 거부한 Node 명령이 OpenClaw 구성에서는 거부되지 않습니다.                        |
| `policy/agents-workspace-access-denied`                  | 에이전트 샌드박스 모드 또는 작업 공간 접근이 정책 허용 목록에 포함되어 있지 않습니다.      |
| `policy/agents-tool-not-denied`                          | 에이전트 또는 기본 구성에서 정책이 요구하는 도구를 거부하지 않습니다.                     |
| `policy/tools-profile-unapproved`                        | 구성된 전역 또는 에이전트별 도구 프로필이 허용 목록에 포함되어 있지 않습니다.              |
| `policy/tools-fs-workspace-only-required`                | 파일 시스템 도구에 작업 공간 전용 경로 태세가 구성되어 있지 않습니다.                     |
| `policy/tools-exec-security-unapproved`                  | 실행 보안 모드가 정책 허용 목록에 포함되어 있지 않습니다.                                 |
| `policy/tools-exec-ask-unapproved`                       | 실행 확인 모드가 정책 허용 목록에 포함되어 있지 않습니다.                                 |
| `policy/tools-exec-host-unapproved`                      | 실행 호스트 라우팅이 정책 허용 목록에 포함되어 있지 않습니다.                             |
| `policy/tools-elevated-enabled`                          | 정책에서 금지하지만 상승된 도구 모드가 활성화되어 있습니다.                               |
| `policy/tools-also-allow-missing`                        | 구성된 `alsoAllow` 목록에 정책에서 요구하는 항목이 없습니다.                               |
| `policy/tools-also-allow-unexpected`                     | 구성된 `alsoAllow` 목록에 정책에서 예상하지 않은 항목이 포함되어 있습니다.                 |
| `policy/tools-required-deny-missing`                     | 전역 또는 에이전트별 도구 거부 목록에 필수 거부 도구가 포함되어 있지 않습니다.             |
| `policy/sandbox-mode-unapproved`                         | 샌드박스 모드가 정책 허용 목록에 포함되어 있지 않습니다.                                  |
| `policy/sandbox-backend-unapproved`                      | 샌드박스 백엔드가 정책 허용 목록에 포함되어 있지 않습니다.                                |
| `policy/sandbox-container-posture-unobservable`          | 컨테이너 태세를 관찰할 수 없는 백엔드에 컨테이너 태세 규칙이 활성화되어 있습니다.           |
| `policy/sandbox-container-host-network-denied`           | 컨테이너 기반 샌드박스 또는 브라우저가 호스트 네트워크 모드를 사용합니다.                  |
| `policy/sandbox-container-namespace-join-denied`         | 컨테이너 기반 샌드박스 또는 브라우저가 다른 컨테이너 네임스페이스에 참여합니다.             |
| `policy/sandbox-container-mount-mode-required`           | 컨테이너 기반 샌드박스 또는 브라우저 마운트가 읽기 전용이 아닙니다.                        |
| `policy/sandbox-container-runtime-socket-mount`          | 컨테이너 기반 샌드박스 또는 브라우저 마운트가 컨테이너 런타임 소켓을 노출합니다.            |
| `policy/sandbox-container-unconfined-profile`            | 정책에서 금지하지만 컨테이너 샌드박스 프로필이 비제한 상태입니다.                          |
| `policy/sandbox-browser-cdp-source-range-missing`        | 정책에서 요구하지만 샌드박스 브라우저 CDP 소스 범위가 없습니다.                            |
| `policy/data-handling-redaction-disabled`                | 정책에서 요구하지만 민감한 로깅 정보 가리기가 비활성화되어 있습니다.                      |
| `policy/data-handling-telemetry-content-capture`         | 정책에서 금지하지만 텔레메트리 콘텐츠 캡처가 활성화되어 있습니다.                          |
| `policy/data-handling-session-retention-not-enforced`    | 정책에서 요구하지만 세션 보존 유지 관리가 적용되지 않습니다.                              |
| `policy/data-handling-session-transcript-memory-enabled` | 정책에서 금지하지만 세션 기록 메모리 인덱싱이 활성화되어 있습니다.                         |
| `policy/secrets-unmanaged-provider`                      | 구성의 SecretRef가 `secrets.providers`에 선언되지 않은 제공자를 참조합니다.                |
| `policy/secrets-denied-provider-source`                  | 구성의 비밀 정보 제공자 또는 SecretRef가 정책에서 거부된 소스를 사용합니다.                |
| `policy/secrets-insecure-provider`                       | 정책에서 금지하지만 비밀 정보 제공자가 안전하지 않은 태세를 사용하도록 설정되어 있습니다. |
| `policy/auth-profile-invalid-metadata`                   | 구성의 인증 프로필에 유효한 제공자 또는 모드 메타데이터가 없습니다.                       |
| `policy/auth-profile-unapproved-mode`                    | 구성의 인증 프로필 모드가 정책 허용 목록에 포함되어 있지 않습니다.                        |
| `policy/exec-approvals-missing`                          | 정책에서 `exec-approvals.json`을 요구하지만 아티팩트가 없습니다.                           |
| `policy/exec-approvals-invalid`                          | 구성된 실행 승인 아티팩트를 파싱할 수 없습니다.                                            |
| `policy/exec-approvals-default-security-unapproved`      | 실행 승인 기본값이 정책 허용 목록에 포함되지 않은 보안 모드를 사용합니다.                  |
| `policy/exec-approvals-agent-security-unapproved`        | 에이전트별 유효 실행 승인 보안 모드가 허용 목록에 포함되어 있지 않습니다.                  |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 정책에서 금지하지만 실행 승인 에이전트가 Skills CLI를 암묵적으로 자동 허용합니다.          |
| `policy/exec-approvals-allowlist-missing`                | 승인 허용 목록에 정책에서 요구하는 패턴이 없습니다.                                       |
| `policy/exec-approvals-allowlist-unexpected`             | 승인 허용 목록에 정책에서 예상하지 않은 패턴이 포함되어 있습니다.                         |
| `policy/tools-missing-risk-level`                        | 관리 대상 도구 선언에 위험 메타데이터가 없습니다.                                         |
| `policy/tools-unknown-risk-level`                        | 관리 대상 도구 선언에서 알 수 없는 위험 값을 사용합니다.                                  |
| `policy/tools-missing-sensitivity-token`                 | 관리 대상 도구 선언에 민감도 메타데이터가 없습니다.                                       |
| `policy/tools-missing-owner`                             | 관리 대상 도구 선언에 소유자 메타데이터가 없습니다.                                       |
| `policy/tools-unknown-sensitivity-token`                 | 관리 대상 도구 선언에서 알 수 없는 민감도 값을 사용합니다.                                |

발견 사항에는 준수하지 않는 것으로 관찰된 작업 공간 대상을 나타내는 `target`과 해당 대상을 발견 사항으로 판정하게 한 작성된 규칙을 나타내는 `requirement`가 모두 포함될 수 있습니다. 현재 두 값 모두 `oc://` 주소 문자열이지만, 필드 이름은 주소 형식이 아니라 정책상의 역할을 설명합니다.

발견 사항 예시:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## 복구

`doctor --lint`와 `policy check`는 읽기 전용입니다.

`doctor --fix`는 `workspaceRepairs`가 명시적으로 활성화된 경우에만 정책에서 관리하는 워크스페이스 설정을 수정합니다. 그렇지 않으면 검사에서 복구할 항목을 보고하지만 설정은 변경하지 않습니다.

이 버전에서는 복구 기능이 `channels.denyRules`에서 거부된 채널을 비활성화하고 아래에 나열된 자동 축소 복구를 적용할 수 있습니다. 유효한 규칙이 워크스페이스 구성을 변경할 수 있으므로 정책 파일을 검토한 후에만 `workspaceRepairs`를 활성화하십시오.

- 전역 정책에서 권한 상승 도구를 금지하는 경우 `tools.elevated.enabled=false`로 설정
- 정책에서 해당 도구를 거부하도록 요구하는 경우 누락된 필수 거부 도구 ID를 `tools.deny` 또는 `agents.list[].tools.deny`에 추가
- 안전하지 않은 `gateway.controlUi.*` 토글을 `false`로 설정
- 정책에서 원격 Gateway 모드를 거부하는 경우 `gateway.mode=local`로 설정
- 정책에서 Gateway HTTP API 엔드포인트를 거부하는 경우 보고된 `gateway.http.endpoints.*.enabled` 경로를 `false`로 설정
- 정책에서 개방형 그룹 인바운드를 거부하는 경우 보고된 채널 인바운드 `groupPolicy` 경로를 `allowlist`로 설정
- 정책에서 그룹 멘션을 요구하는 경우 보고된 채널 인바운드 `requireMention` 경로를 `true`로 설정
- 정책에서 민감한 로깅 정보의 마스킹을 요구하는 경우 `logging.redactSensitive=tools`로 설정
- 정책에서 텔레메트리 콘텐츠 캡처를 거부하는 경우 `diagnostics.otel.captureContent=false`로 설정하거나, 객체 형식의 텔레메트리 캡처 설정에서는 `diagnostics.otel.captureContent.enabled=false`로 설정

범위가 지정된 권한 상승 도구 복구는 감지만 수행합니다. 또한 발견 항목이 공유 로깅 또는 텔레메트리 구성을 보고하는 경우에는 공유 설정을 변경하면 범위가 지정된 정책 대상 이외에도 영향을 미치므로 범위가 지정된 데이터 처리 복구를 건너뜁니다.

발견 항목이 상속된 루트 `tools.deny`를 보고하는 경우에는 필요한 도구를 루트 구성에 추가하면 범위가 지정된 정책 대상 이외에도 영향을 미치므로 범위가 지정된 필수 거부 복구를 건너뜁니다. 에이전트 로컬 필수 거부 복구는 보고된 `agents.list[].tools.deny` 경로를 업데이트할 수 있습니다.

발견 항목이 상속된 `channels.defaults.*`를 보고하는 경우에는 공유 채널 기본값을 변경하면 범위가 지정된 정책 대상 이외에도 영향을 미치므로 범위가 지정된 채널 인바운드 복구를 건너뜁니다. Gateway HTTP URL 가져오기 허용 목록 발견 항목은 자동 복구가 올바른 엔드포인트 URL 허용 목록 값을 선택할 수 없으므로 수동으로 처리해야 합니다.

Gateway 바인딩 및 노드 명령 발견 항목은 계속 검토가 필요합니다. `policy/gateway-non-loopback-bind` 또는 `policy/gateway-node-command-denied`를 구성 경로에 매핑할 수 있는 경우 `doctor --fix`는 제안된 `gateway.bind` 또는 `gateway.nodes.denyCommands` 변경 사항을 건너뛴 미리 보기 지침으로 보고합니다. 변경 사항을 적용하지 않으며, 운영자가 구성 또는 정책을 검토하고 업데이트하기 전까지 해당 발견 항목은 복구된 것으로 간주되지 않습니다.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## 종료 코드

| 명령             | `0`                                                     | `1`                                                                | `2`                     |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------- |
| `policy check`   | 임계값에 해당하는 발견 항목이 없습니다.                 | 하나 이상의 발견 항목이 임계값에 해당합니다.                      | 인수 또는 런타임 오류.  |
| `policy compare` | 정책 파일이 기준선만큼 엄격하거나 그보다 더 엄격합니다. | 정책 파일이 유효하지 않거나 누락되었거나 기준선 규칙보다 약합니다. | 인수 또는 런타임 오류. |
| `policy watch`   | 발견 항목이 없고 승인된 해시가 최신 상태입니다.         | 발견 항목이 있거나 승인된 증명이 오래되었습니다.                   | 인수 또는 런타임 오류. |

## 관련 항목

- [Doctor 린트 모드](/ko/cli/doctor#lint-mode)
- [경로 CLI](/ko/cli/path)
