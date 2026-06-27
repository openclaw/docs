---
read_when:
    - 작성된 policy.jsonc에 대해 OpenClaw 설정을 확인하려는 경우
    - doctor lint에서 정책 발견 사항을 원합니다
    - 감사 증거를 위한 정책 증명 해시가 필요합니다
summary: '`openclaw policy` 적합성 검사를 위한 CLI 참조'
title: 정책
x-i18n:
    generated_at: "2026-06-27T17:19:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy`는 번들로 제공되는 Policy Plugin이 제공합니다. Policy는
기존 OpenClaw 설정 위에 놓이는 엔터프라이즈 적합성 계층입니다. 두 번째
구성 시스템을 추가하지 않습니다. `policy.jsonc`는 작성된 요구 사항을
정의하고, OpenClaw는 활성 워크스페이스를 증거로 관찰하며, 정책 상태 검사는
`doctor --lint`를 통해 드리프트를 보고합니다. 최종 적합성 신호는 깨끗한
`doctor --lint` 실행입니다. Policy는 별도의 상태 게이트를 만들지 않고
공유 lint 표면에 발견 사항을 제공합니다.

Policy는 현재 구성된 채널, MCP 서버, 모델 제공자, 네트워크 SSRF 태세,
수신/채널 접근 태세, Gateway 노출 태세, 에이전트 워크스페이스 태세,
데이터 처리 태세, OpenClaw 구성 비밀 제공자/인증 프로필 태세, 관리되는 도구
선언을 관리합니다. 예를 들어 IT 또는 워크스페이스 운영자는 Telegram이
승인된 채널 제공자가 아님을 기록하고, MCP 서버와 모델 참조를 승인된 항목으로
제한하며, 사설 네트워크 fetch/browser 접근이 비활성 상태로 유지되도록 요구하고,
직접 메시지 세션 격리와 채널 수신 태세가 검토된 범위 안에 머물도록 요구하고,
Gateway bind/auth/HTTP 노출이 검토된 범위 안에 머물도록 요구하고,
에이전트 워크스페이스 접근과 도구 거부가 검토된 태세에 머물도록 요구하고,
OpenClaw 구성 SecretRefs가 관리되는 제공자를 사용하도록 요구하고,
구성 인증 프로필이 제공자/모드 메타데이터를 포함하도록 요구하고,
관리되는 도구가 위험 및 민감도 메타데이터를 포함하도록 요구하고, 민감한 로깅
수정을 요구하고, 텔레메트리 콘텐츠 캡처를 거부하고, 세션 보존 유지 관리를
요구하고, 세션 전사 메모리 인덱싱을 거부한 다음, `doctor --lint`를 공유
적합성 게이트로 사용할 수 있습니다.

워크스페이스에 "이 채널들은 활성화되면 안 됨" 또는 "관리되는 도구는 승인
메타데이터를 선언해야 함" 같은 지속적인 진술과, OpenClaw가 여전히 그 진술을
준수함을 반복적으로 증명할 방법이 필요할 때 Policy를 사용하세요. 로컬 동작만
필요하고 정책 발견 사항이나 증명 출력이 필요하지 않다면 일반 구성과
워크스페이스 문서만 사용하세요.

## 빠른 시작

처음 사용하기 전에 번들 Policy Plugin을 활성화하세요.

```bash
openclaw plugins enable policy
```

Policy가 활성화되면 doctor는 임의 Plugin을 활성화하지 않고도 정책 상태 검사를
로드할 수 있습니다. `policy.jsonc`가 없어도 Plugin은 활성 상태로 남아 있으므로
doctor가 누락된 아티팩트를 보고할 수 있습니다.

Policy는 작성되는 것이며, 사용자의 현재 설정에서 생성되지 않습니다. 채널,
MCP 서버, 모델 제공자, 네트워크 태세, 수신/채널 접근, Gateway 노출,
에이전트 워크스페이스 태세, 구성된 샌드박스 런타임 태세, OpenClaw 데이터 처리
태세, 구성 비밀 제공자/인증 프로필 태세, exec 승인 파일 태세, 도구
메타데이터를 위한 최소 정책은 다음과 같습니다.

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

규칙이 권한의 원천입니다. 카테고리 블록은 네임스페이스일 뿐이며, 구체적인
규칙이 있을 때 검사가 실행됩니다. OpenClaw는 현재 `channels.*` 설정,
`mcp.servers.*`, `models.providers.*`, 선택된 에이전트 모델 참조, 네트워크
SSRF 설정, 직접 메시지 세션 범위, 채널 DM 정책, 채널 그룹 정책, 채널/그룹
멘션 게이트, Gateway bind/auth/Control UI/Tailscale/remote/HTTP 태세,
OpenClaw 구성 에이전트 샌드박스 워크스페이스 접근 및 도구 거부 태세,
데이터 처리 구성 태세, 구성 비밀 제공자 및 SecretRef 출처, 구성 인증 프로필
메타데이터, 구성된 전역/에이전트별 도구 태세, `TOOLS.md` 선언을 증거로 읽은
다음, 적합하지 않은 관찰 상태를 보고합니다. 정책이 비-loopback Gateway
바인딩을 거부하는 경우, 런타임 기본값을 검토할 의향이 있을 때만
`gateway.bind`를 생략하세요. 엄격한 구성 적합성을 원하면
`gateway.bind=loopback`을 설정하세요. 읽기 전용 에이전트 태세의 경우 적용되는
기본값 또는 에이전트에서 샌드박스 모드를 구성하고 `workspaceAccess`를 `none`
또는 `ro`로 설정하세요. 생략된 샌드박스 모드나 `off` 샌드박스 모드는
읽기 전용/쓰기 금지 정책을 충족하지 않습니다. `agents.workspace.denyTools`는
`exec`, `process`, `write`, `edit`, `apply_patch`를 지원합니다. OpenClaw 구성
`group:fs`는 파일 변경 도구를 포함하고 `group:runtime`은 셸/프로세스 도구를
포함합니다. 도구 태세 정책은 `tools.profile`, `tools.allow`,
`tools.alsoAllow`, `tools.deny`, `tools.fs.workspaceOnly`,
`tools.exec.security`, `tools.exec.ask`, `tools.exec.host`,
`tools.elevated.enabled` 및 동일한 에이전트별 `agents.list[].tools.*` 재정의를
관찰합니다. Exec 승인 정책은 `execApprovals` 규칙이 있을 때만 지정된
`exec-approvals.json` 제품 아티팩트를 읽습니다. 증거는 소켓 토큰이나 마지막으로
사용한 명령 텍스트 없이 기본값, 에이전트별 태세, allowlist 패턴을 기록합니다.
Policy는 런타임에 도구 호출을 강제하지 않습니다. 비밀 증거는 원시 비밀 값이
아니라 제공자/소스 태세와 SecretRef 메타데이터를 기록합니다. Policy는
`auth-profiles.json` 같은 에이전트별 자격 증명 저장소를 읽거나 증명하지
않습니다. 해당 저장소는 기존 인증 및 자격 증명 흐름이 계속 소유합니다.
데이터 처리 증거는 구성 수준 태세만 다룹니다. 구성된 수정 모드, 텔레메트리
콘텐츠 캡처 토글, 세션 유지 관리 모드, 세션 전사 메모리 인덱싱 설정을
확인합니다. 원시 로그, 텔레메트리 내보내기, 전사 내용, 메모리 파일을 검사하지
않으며, 개인 데이터나 비밀이 존재하지 않음을 증명하지 않습니다.

### Policy 규칙 참조

아래의 각 정책 필드는 선택 사항입니다. 일치하는 규칙이 `policy.jsonc`에 있을
때만 검사가 실행됩니다. 관찰 상태는 기존 OpenClaw 구성 또는 워크스페이스
메타데이터입니다. 정책은 드리프트를 보고하지만, 복구 경로가 명시적으로
사용 가능하고 활성화된 경우가 아니면 런타임 동작을 다시 쓰지 않습니다.
Policy 파일은 엄격합니다. 지원되지 않는 섹션이나 규칙 키는 무시되지 않고
`policy/policy-jsonc-invalid`로 보고됩니다.

Policy 오버레이는 넓은 최상위 규칙을 전역으로 유지한 다음, 명명된 범위 블록이
명시적 선택자에 대해 더 엄격한 일반 정책 섹션을 추가할 수 있게 합니다. 범위
이름은 설명용 버킷일 뿐입니다. 일치는 범위 내부의 선택자 값을 사용합니다.
오버레이는 가산적입니다. 전역 클레임은 계속 실행되며, 범위가 지정된 클레임은
동일한 관찰 구성에 대해 자체 발견 사항을 낼 수 있습니다.

#### 범위 지정 오버레이

일부 에이전트나 채널 집합에 최상위 기준보다 더 엄격한 정책이 필요할 때
`scopes.<scopeName>`을 사용하세요. 에이전트 범위 섹션은 `agentIds`를 사용하며,
`tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`,
`execApprovals.*`를 지원합니다. 채널 범위 수신은 `channelIds`를 사용하며,
`ingress.channels.*`를 지원합니다. 지원되지 않는 섹션은 무시되지 않고
거부됩니다. `agentIds` 항목이 `agents.list[]`에 없으면 OpenClaw는 해당
런타임 에이전트 ID에 대해 상속된 전역/기본 태세를 기준으로 범위 규칙을
평가합니다.

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

위와 같이 각 범위가 서로 다른 필드를 관리하는 경우 동일한 에이전트가 여러
범위에 나타날 수 있습니다. 동일한 에이전트에 대해 범위가 지정된 필드가
반복되면 정책 메타데이터에 따라 동일하거나 더 제한적이어야 합니다. 더 약한
중복 클레임은 거부됩니다. 엄격성 메타데이터는 허용 목록을 부분 집합으로,
거부 목록을 상위 집합으로, 필수 불리언을 고정 요구 사항으로 취급합니다.

컨테이너 태세 정책은 OpenClaw가 일치한 에이전트에 대해 관찰할 수 있는 증거에
대해서만 평가됩니다. 활성화된 `sandbox.containers.*` 규칙이 해당 필드를
노출할 수 없는 샌드박스 백엔드를 사용하는 에이전트에 적용되면, 정책은 해당
클레임을 통과로 처리하지 않고 `policy/sandbox-container-posture-unobservable`을
보고합니다. 서로 다른 샌드박스 백엔드를 사용하는 에이전트 그룹에는 별도의
`agentIds` 범위를 사용하고, 해당 필드를 관찰할 수 없는 그룹에서는 지원되지
않는 컨테이너 규칙을 설정하지 않거나 false로 두세요.

최상위 `ingress.session.requireDmScope`는 `session.dmScope`가 채널 귀속 증거가
아니므로 전역으로 유지됩니다.

| 선택자       | 지원되는 섹션                                                                    | 사용 시점                                                   |
| ------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, and `execApprovals` | 하나 이상의 런타임 에이전트에 더 엄격한 규칙이 필요할 때.   |
| `channelIds` | `ingress.channels`                                                                 | 하나 이상의 채널에 더 엄격한 인그레스 규칙이 필요할 때.     |

`policy.jsonc`에 있는 모든 범위는 유효하고 적용 가능해야 합니다.

#### 채널

| 정책 필드                           | 관찰된 상태                            | 사용 시점                                                     |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------ |
| `channels.denyRules[].when.provider` | `channels.*` provider 및 enabled 상태   | `telegram` 같은 제공자의 구성된 채널을 거부합니다.           |
| `channels.denyRules[].reason`        | 발견 메시지 및 복구 힌트 컨텍스트      | 제공자가 거부되는 이유를 설명합니다.                         |

#### MCP 서버

| 정책 필드           | 관찰된 상태        | 사용 시점                                                   |
| ------------------- | ------------------ | ---------------------------------------------------------- |
| `mcp.servers.allow` | `mcp.servers.*` ids | 구성된 모든 MCP 서버가 허용 목록에 포함되도록 요구합니다. |
| `mcp.servers.deny`  | `mcp.servers.*` ids | 특정 구성된 MCP 서버 id를 거부합니다.                     |

#### 모델 제공자

| 정책 필드                | 관찰된 상태                                      | 사용 시점                                                                 |
| ------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------- |
| `models.providers.allow` | `models.providers.*` ids 및 선택된 모델 ref      | 구성된 제공자와 선택된 모델 ref가 승인된 제공자를 사용하도록 요구합니다. |
| `models.providers.deny`  | `models.providers.*` ids 및 선택된 모델 ref      | 제공자 id별로 구성된 제공자와 선택된 모델 ref를 거부합니다.              |

#### 네트워크

| 정책 필드                      | 관찰된 상태                        | 사용 시점                                                             |
| ------------------------------ | ---------------------------------- | -------------------------------------------------------------------- |
| `network.privateNetwork.allow` | 사설 네트워크 SSRF 우회 경로       | 사설 네트워크 액세스가 비활성 상태로 유지되도록 요구하려면 `false`로 설정합니다. |

#### 인그레스 및 채널 액세스

| 정책 필드                                 | 관찰된 상태                                                     | 사용 시점                                                           |
| ----------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------ |
| `ingress.session.requireDmScope`          | `session.dmScope`                                              | 검토된 다이렉트 메시지 격리 범위를 요구합니다.                     |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` 및 레거시 채널 DM 정책 필드              | 검토된 다이렉트 메시지 채널 정책만 허용합니다.                     |
| `ingress.channels.denyOpenGroups`         | 채널, 계정, 그룹 인그레스 정책                                 | 구성된 채널과 계정의 공개 그룹 인그레스를 거부합니다.              |
| `ingress.channels.requireMentionInGroups` | 채널, 계정, 그룹, 길드 및 중첩 멘션 게이트 구성                | 그룹 인그레스가 열려 있거나 멘션 게이트가 적용될 때 멘션 게이트를 요구합니다. |

#### Gateway

| 정책 필드                               | 관찰된 상태                                     | 사용 시점                                                     |
| --------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                 | 루프백 Gateway 바인딩을 요구하려면 `false`로 설정합니다.     |
| `gateway.exposure.allowTailscaleFunnel` | Tailscale serve/funnel Gateway 태세            | Tailscale Funnel 노출을 거부하려면 `false`로 설정합니다.      |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                            | 비활성화된 Gateway 인증을 거부하려면 `true`로 설정합니다.     |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                       | 명시적 인증 속도 제한 구성을 요구하려면 `true`로 설정합니다.  |
| `gateway.controlUi.allowInsecure`       | Control UI 비보안 인증/디바이스/오리진 토글    | 비보안 Control UI 노출 토글을 거부하려면 `false`로 설정합니다. |
| `gateway.remote.allow`                  | 원격 Gateway 모드/구성                         | 원격 Gateway 모드를 거부하려면 `false`로 설정합니다.          |
| `gateway.http.denyEndpoints`            | Gateway HTTP API 엔드포인트                    | `chatCompletions` 또는 `responses` 같은 엔드포인트 id를 거부합니다. |
| `gateway.http.requireUrlAllowlists`     | Gateway HTTP URL 가져오기 입력                 | URL 가져오기 입력에 URL 허용 목록을 요구하려면 `true`로 설정합니다. |

#### 에이전트 작업공간

| 정책 필드                        | 관찰된 상태                                                                            | 사용 시점                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` 및 `agents.list[].sandbox.workspaceAccess`  | `none` 또는 `ro` 같은 샌드박스 작업공간 액세스 값만 허용합니다.                                                     |
| `agents.workspace.denyTools`     | 전역 및 에이전트별 도구 거부 구성                                                     | `exec`, `process`, `write`, `edit`, 또는 `apply_patch` 같은 작업공간/런타임 변경 도구가 거부되도록 요구합니다.       |

#### 샌드박스 태세

| 정책 필드                                             | 관찰된 상태                                             | 사용 시점                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` 및 에이전트별 모드       | `all` 또는 `non-main` 같은 검토된 샌드박스 모드만 허용합니다. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` 및 에이전트별 백엔드  | `docker` 같은 검토된 샌드박스 백엔드만 허용합니다.            |
| `sandbox.containers.denyHostNetwork`                  | 컨테이너 기반 샌드박스/브라우저 네트워크 모드           | 호스트 네트워크 모드를 거부합니다.                            |
| `sandbox.containers.denyContainerNamespaceJoin`       | 컨테이너 기반 샌드박스/브라우저 네트워크 모드           | 다른 컨테이너 네트워크 네임스페이스 참여를 거부합니다.        |
| `sandbox.containers.requireReadOnlyMounts`            | 컨테이너 기반 샌드박스/브라우저 마운트 모드             | 마운트가 읽기 전용이도록 요구합니다.                          |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | 컨테이너 기반 샌드박스/브라우저 마운트 대상             | 컨테이너 런타임 소켓 마운트를 거부합니다.                     |
| `sandbox.containers.denyUnconfinedProfiles`           | 컨테이너 보안 프로필 태세                              | 제한 없는 컨테이너 보안 프로필을 거부합니다.                  |
| `sandbox.browser.requireCdpSourceRange`               | 샌드박스 브라우저 CDP 소스 범위                         | 브라우저 CDP 노출이 소스 범위를 선언하도록 요구합니다.        |

정책은 누락된 `sandbox.mode`를 암시적 기본값 `off`로 처리하므로,
`sandbox.requireMode`는 새 샌드박스 또는 구성되지 않은 샌드박스를 `["all"]` 같은
허용 목록 밖으로 보고합니다.

#### 데이터 처리

| 정책 필드                                           | 관찰된 상태                                                                          | 사용 시점                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | `logging.redactSensitive: "off"`를 거부하려면 `true`로 설정합니다.      |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | 원격 분석 콘텐츠 캡처를 거부하려면 `true`로 설정합니다.                |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | 유효한 세션 유지관리 모드 `enforce`를 요구하려면 `true`로 설정합니다. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` 및 `agents.*.memorySearch.experimental.sessionMemory`  | 세션 transcript의 메모리 인덱싱을 거부하려면 `true`로 설정합니다.       |

#### 시크릿

| 정책 필드                         | 관찰된 상태                                                | 사용 시점                                                                |
| --------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | 구성 SecretRefs 및 `secrets.providers.*` 선언              | SecretRefs가 선언된 제공자를 가리키도록 요구하려면 `true`로 설정합니다. |
| `secrets.denySources`             | 시크릿 제공자 소스 및 SecretRef 소스                       | `exec`, `file`, 또는 다른 구성된 소스 이름 같은 소스를 거부합니다.       |
| `secrets.allowInsecureProviders`  | 비보안 시크릿 제공자 태세 플래그                           | 비보안 태세를 선택한 제공자를 거부하려면 `false`로 설정합니다.          |

#### Exec 승인

Exec 승인 정책은 활성 런타임 `exec-approvals.json` 아티팩트를 관찰합니다.
기본적으로 이는 `~/.openclaw/exec-approvals.json`입니다. `OPENCLAW_STATE_DIR`가
설정된 경우 정책은 `$OPENCLAW_STATE_DIR/exec-approvals.json`을 읽습니다.
`execApprovals.defaults.*` 또는 `execApprovals.agents.*` 같은 실제 태세 규칙에는
읽을 수 있는 아티팩트 증거가 필요합니다. 누락되었거나 유효하지 않은 아티팩트는
합성 런타임 기본값에 대한 최선 노력 통과가 되는 대신 관찰할 수 없는 증거로
보고됩니다. 아티팩트를 읽을 수 있게 되면, 생략된 승인 필드는 런타임 기본값을
상속합니다. 누락된 `defaults.security`는 `full`이고, 누락된 에이전트 보안은 그
기본값을 상속합니다. 증거에는 `defaults`, `agents.*`, `agents.*.allowlist[].pattern`,
선택적 `argPattern`, 유효한 `autoAllowSkills` 태세, 항목 소스가 포함됩니다.
소켓 경로/토큰, `commandText`, `lastUsedCommand`, 확인된 경로 또는 타임스탬프는
포함되지 않습니다.

| 정책 필드                                | 관찰된 상태                                                                         | 사용 시점                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | 활성 런타임 `exec-approvals.json` 경로                                              | 승인 아티팩트가 존재하고 파싱되어야 하도록 `true`로 설정합니다.                     |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, 기본값은 `full`                                              | 승인된 기본 승인 보안 모드만 허용합니다.                                    |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, 기본값을 상속                                               | 승인된 에이전트별 유효 승인 보안 모드만 허용합니다.                        |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` 및 `agents.*.autoAllowSkills`, 런타임 기본값을 상속 | 암시적 Skills CLI 승인 없이 엄격한 수동 허용 목록을 요구하려면 `false`로 설정합니다. |
| `execApprovals.agents.allowlist.expected`   | 집계된 `agents.*.allowlist[]` 패턴 및 선택적 argPattern 항목               | 승인 허용 목록이 검토된 패턴 세트와 일치하도록 요구합니다.                      |

예를 들어, 승인 아티팩트를 요구하고, 허용적인 기본값을 거부하며,
선택한 에이전트에 대해 검토된 exec 승인 태세만 허용합니다.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

| 정책 필드                    | 관찰된 상태                               | 사용 시점                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | `auth.profiles.*` 제공자 및 모드 메타데이터 | 구성 인증 프로필에 `provider` 및 `mode` 같은 메타데이터 키를 요구합니다.               |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | `api_key`, `aws-sdk`, `oauth`, `token` 같은 지원되는 인증 프로필 모드만 허용합니다. |

#### 도구 메타데이터

| 정책 필드            | 관찰된 상태                   | 사용 시점                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | 관리되는 `TOOLS.md` 선언 | 관리되는 도구가 `risk`, `sensitivity`, `owner` 같은 메타데이터 키를 선언하도록 요구합니다. |

#### 도구 태세

| 정책 필드                    | 관찰된 상태                                              | 사용 시점                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` 및 `agents.list[].tools.profile`           | `minimal`, `messaging`, `coding` 같은 도구 프로필 ID만 허용합니다.                                 |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` 및 에이전트별 `tools.fs` 재정의 | 작업공간 전용 파일시스템 도구 태세를 요구하려면 `true`로 설정합니다.                                         |
| `tools.exec.allowSecurity`      | `tools.exec.security` 및 에이전트별 exec 보안           | `deny` 또는 `allowlist` 같은 exec 보안 모드만 허용합니다.                                            |
| `tools.exec.requireAsk`         | `tools.exec.ask` 및 에이전트별 exec 요청 모드                | `always` 같은 승인 태세를 요구합니다.                                                               |
| `tools.exec.allowHosts`         | `tools.exec.host` 및 에이전트별 exec 호스트 라우팅           | `sandbox` 같은 exec 호스트 라우팅 모드만 허용합니다.                                                    |
| `tools.elevated.allow`          | `tools.elevated.enabled` 및 에이전트별 승격 태세     | 승격 도구 모드가 비활성화된 상태로 유지되도록 요구하려면 `false`로 설정합니다.                                           |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` 및 에이전트별 `tools.alsoAllow`           | 정확한 `alsoAllow` 항목을 요구하고 누락되었거나 예상치 못한 추가 도구 권한 부여를 보고합니다.                 |
| `tools.denyTools`               | `tools.deny` 및 `agents.list[].tools.deny`                 | 구성된 도구 거부 목록에 `group:runtime` 및 `group:fs` 같은 도구 ID 또는 그룹이 포함되도록 요구합니다. |

작성 중에는 정책 전용 검사를 실행합니다.

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check`는 정책 검사 세트만 실행하고 증거, 발견 사항,
증명 해시를 출력합니다. Policy Plugin이 활성화된 경우 동일한 발견 사항이
`openclaw doctor --lint`에도 나타납니다.

운영자 정책 파일을 작성된 기준 정책 파일과 비교합니다.

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare`는 정책 파일 구문을 정책 파일 구문과 비교합니다. OpenClaw
런타임 상태, 증거, 자격 증명 또는 비밀은 검사하지 않습니다. 이 명령은
범위 지정 오버레이를 관리하는 것과 동일한 정책 규칙 메타데이터를 사용합니다. 허용 목록은
같거나 더 좁게 유지되어야 하고, 거부 목록은 같거나 더 넓게 유지되어야 하며, 필수 불리언은
필수 값을 유지해야 하고, 순서가 있는 문자열은 구성된 순서에서 더 제한적인 끝으로만
이동해야 하며, 정확한 목록은 일치해야 합니다.

기준 파일은 조직이 작성한 정책일 수 있습니다. 검사 대상 정책은
더 엄격한 값을 사용하거나 추가 정책 규칙을 더할 수 있습니다. 최상위 검사 규칙도
동일하거나 더 제한적이면 범위 지정 기준 규칙을 충족할 수 있습니다. 최상위 정책은
광범위하게 적용되기 때문입니다. 범위 이름은 일치할 필요가 없습니다. 범위 지정
비교는 `agentIds` 또는 `channelIds` 같은 선택자 값과 검사 중인
정책 필드를 기준으로 키가 지정됩니다.

정상적인 비교 JSON 출력 예시는 정책 파일 비교 상태만 보고합니다.

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

정상적인 `policy check --json` 출력 예시에는 운영자 또는 감독자가
기록할 수 있는 안정적인 해시가 포함됩니다.

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

| 설정                   | 목적                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | `policy.jsonc`가 존재하기 전에도 정책 검사를 활성화합니다.         |
| `workspaceRepairs`        | `doctor --fix`가 정책 관리 작업공간 설정을 편집하도록 허용합니다. |
| `expectedHash`            | 승인된 정책 아티팩트에 대한 선택적 해시 잠금입니다.            |
| `expectedAttestationHash` | 마지막으로 수락된 정상 정책 검사에 대한 선택적 해시 잠금입니다.    |
| `path`                    | 정책 아티팩트의 작업공간 상대 위치입니다.             |

Plugin은 설치된 상태로 두면서 작업공간에 대한 정책 검사를 비활성화하려면
`plugins.entries.policy.config.enabled`를 `false`로 설정합니다.

도구 메타데이터 요구 사항은 `policy.jsonc`에서
`tools.requireMetadata`로 작성합니다. 예: `["risk", "sensitivity", "owner"]`.

## 정책 상태 수락

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

정책 해시는 작성된 규칙 아티팩트를 식별합니다. 증거 블록은 정책 검사에 사용된 관찰된 OpenClaw 상태를 기록합니다. `workspace.hash` 값은 검사된 범위에 대한 해당 증거 페이로드를 식별합니다. 발견 사항 해시는 검사에서 반환된 정확한 발견 사항 집합을 식별합니다. `checkedAt`은 평가가 실행된 시점을 기록합니다. 증명 해시는 안정적인 클레임, 즉 정책 해시, 증거 해시, 발견 사항 해시, 그리고 결과가 깨끗했는지 여부를 식별합니다. 여기에는 의도적으로 `checkedAt`이 포함되지 않으므로, 동일한 정책 상태는 반복 검사에서도 동일한 증명을 생성합니다. 이들은 함께 이 정책 검사의 감사 튜플을 형성합니다.

나중에 Gateway 또는 감독자가 런타임 작업을 차단, 승인 또는 주석 처리하는 데 정책을 사용하는 경우, 마지막으로 깨끗했던 정책 검사에서 얻은 증명 해시를 기록해야 합니다. `checkedAt`은 감사 로그를 위해 JSON 출력에 남아 있지만, 안정적인 증명 해시의 일부는 아닙니다.

정책 상태를 수락할 때는 다음 수명 주기를 사용하세요.

1. `policy.jsonc`를 작성하거나 검토합니다.
2. `openclaw policy check --json`을 실행합니다.
3. 결과가 깨끗하면 `attestation.policy.hash`를 `expectedHash`로 기록합니다.
4. `attestation.attestationHash`를 `expectedAttestationHash`로 기록합니다.
5. CI 또는 릴리스 게이트에서 `openclaw doctor --lint`를 다시 실행합니다.

정책 규칙이 의도적으로 변경되면, 깨끗한 검사에서 수락된 두 해시를 모두 업데이트하세요. 작업공간 설정이 의도적으로 변경되었지만 정책은 그대로인 경우, 일반적으로 `expectedAttestationHash`만 변경됩니다.

`agents.workspace` 규칙을 활성화하거나 업그레이드하면 작업공간 해시와 증명 해시에 `agentWorkspace` 증거가 추가됩니다. 운영자는 이러한 규칙을 활성화한 후 새 증거를 검토하고 수락된 증명 해시를 새로 고쳐야 합니다. 도구 자세 규칙을 활성화하거나 업그레이드하면 같은 방식으로 `toolPosture` 증거가 추가됩니다.

`openclaw policy watch`는 동일한 검사를 반복 실행하고 현재 증거가 더 이상 `expectedAttestationHash`와 일치하지 않을 때 보고합니다.

```bash
openclaw policy watch --json
```

한 번의 드리프트 평가만 필요한 CI 또는 스크립트에서는 `--once`를 사용하세요. `--once`가 없으면 명령은 기본적으로 2초마다 폴링합니다. 다른 간격을 선택하려면 `--interval-ms`를 사용하세요.

## 발견 사항

정책은 현재 다음을 검증합니다:

| 검사 id                                                 | 발견 사항                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | 정책이 활성화되어 있지만 `policy.jsonc`가 없습니다.                                  |
| `policy/policy-jsonc-invalid`                            | 정책을 파싱할 수 없거나 형식이 잘못된 규칙 항목이 포함되어 있습니다.                       |
| `policy/policy-hash-mismatch`                            | 정책이 구성된 `expectedHash`와 일치하지 않습니다.                                  |
| `policy/attestation-hash-mismatch`                       | 현재 정책 증거가 더 이상 수락된 증명과 일치하지 않습니다.               |
| `policy/policy-conformance-invalid`                      | 기준 또는 검사된 정책 파일에 잘못된 비교 구문이 있습니다.                  |
| `policy/policy-conformance-missing`                      | 검사된 정책 파일에 기준 정책 파일에서 요구하는 규칙이 없습니다.     |
| `policy/policy-conformance-weaker`                       | 검사된 정책 파일의 값이 기준 정책 파일보다 약합니다.           |
| `policy/channels-denied-provider`                        | 활성화된 채널이 채널 거부 규칙과 일치합니다.                                   |
| `policy/mcp-denied-server`                               | 구성된 MCP 서버가 정책에 의해 거부되었습니다.                                      |
| `policy/mcp-unapproved-server`                           | 구성된 MCP 서버가 허용 목록 밖에 있습니다.                                 |
| `policy/models-denied-provider`                          | 구성된 모델 공급자 또는 모델 참조가 거부된 공급자를 사용합니다.                  |
| `policy/models-unapproved-provider`                      | 구성된 모델 공급자 또는 모델 참조가 허용 목록 밖에 있습니다.                |
| `policy/network-private-access-enabled`                  | 정책이 거부하는데도 사설 네트워크 SSRF 우회 장치가 활성화되어 있습니다.             |
| `policy/ingress-dm-policy-unapproved`                    | 채널 DM 정책이 정책 허용 목록 밖에 있습니다.                              |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope`가 정책에서 요구하는 DM 격리 범위와 일치하지 않습니다.          |
| `policy/ingress-open-groups-denied`                      | 정책이 공개 그룹 인그레스를 거부하는데도 채널 그룹 정책이 `open`입니다.          |
| `policy/ingress-group-mention-required`                  | 정책이 멘션 게이트를 요구하는데도 채널 또는 그룹 항목이 이를 비활성화합니다.       |
| `policy/gateway-non-loopback-bind`                       | 정책이 거부하는데도 Gateway 바인딩 태세가 비루프백 노출을 허용합니다.         |
| `policy/gateway-auth-disabled`                           | 정책이 인증을 요구하는데도 Gateway 인증이 비활성화되어 있습니다.                     |
| `policy/gateway-rate-limit-missing`                      | 정책이 요구하는데도 Gateway 인증 속도 제한 태세가 명시되어 있지 않습니다.          |
| `policy/gateway-control-ui-insecure`                     | Gateway Control UI의 안전하지 않은 노출 토글이 활성화되어 있습니다.                         |
| `policy/gateway-tailscale-funnel`                        | 정책이 거부하는데도 Gateway Tailscale Funnel 노출이 활성화되어 있습니다.               |
| `policy/gateway-remote-enabled`                          | 정책이 거부하는데도 Gateway 원격 모드가 활성 상태입니다.                              |
| `policy/gateway-http-endpoint-enabled`                   | 정책에 의해 거부되었는데도 Gateway HTTP API 엔드포인트가 활성화되어 있습니다.                    |
| `policy/gateway-http-url-fetch-unrestricted`             | Gateway HTTP URL 가져오기 입력에 필요한 URL 허용 목록이 없습니다.                      |
| `policy/agents-workspace-access-denied`                  | 에이전트 샌드박스 모드 또는 워크스페이스 접근이 정책 허용 목록 밖에 있습니다.           |
| `policy/agents-tool-not-denied`                          | 에이전트 또는 기본 구성이 정책에서 요구하는 도구를 거부하지 않습니다.               |
| `policy/tools-profile-unapproved`                        | 구성된 전역 또는 에이전트별 도구 프로필이 허용 목록 밖에 있습니다.           |
| `policy/tools-fs-workspace-only-required`                | 파일시스템 도구가 워크스페이스 전용 경로 태세로 구성되어 있지 않습니다.             |
| `policy/tools-exec-security-unapproved`                  | 실행 보안 모드가 정책 허용 목록 밖에 있습니다.                               |
| `policy/tools-exec-ask-unapproved`                       | 실행 요청 모드가 정책 허용 목록 밖에 있습니다.                                    |
| `policy/tools-exec-host-unapproved`                      | 실행 호스트 라우팅이 정책 허용 목록 밖에 있습니다.                                |
| `policy/tools-elevated-enabled`                          | 정책이 거부하는데도 권한 상승 도구 모드가 활성화되어 있습니다.                              |
| `policy/tools-also-allow-missing`                        | 구성된 `alsoAllow` 목록에 정책에서 요구하는 항목이 없습니다.             |
| `policy/tools-also-allow-unexpected`                     | 구성된 `alsoAllow` 목록에 정책에서 예상하지 않은 항목이 포함되어 있습니다.           |
| `policy/tools-required-deny-missing`                     | 전역 또는 에이전트별 도구 거부 목록에 필수 거부 도구가 포함되어 있지 않습니다.     |
| `policy/sandbox-mode-unapproved`                         | 샌드박스 모드가 정책 허용 목록 밖에 있습니다.                                     |
| `policy/sandbox-backend-unapproved`                      | 샌드박스 백엔드가 정책 허용 목록 밖에 있습니다.                                  |
| `policy/sandbox-container-posture-unobservable`          | 관찰할 수 없는 백엔드에 컨테이너 태세 규칙이 활성화되어 있습니다.         |
| `policy/sandbox-container-host-network-denied`           | 컨테이너 기반 샌드박스 또는 브라우저가 호스트 네트워크 모드를 사용합니다.                     |
| `policy/sandbox-container-namespace-join-denied`         | 컨테이너 기반 샌드박스 또는 브라우저가 다른 컨테이너 네임스페이스에 참여합니다.          |
| `policy/sandbox-container-mount-mode-required`           | 컨테이너 기반 샌드박스 또는 브라우저 마운트가 읽기 전용이 아닙니다.                     |
| `policy/sandbox-container-runtime-socket-mount`          | 컨테이너 기반 샌드박스 또는 브라우저 마운트가 컨테이너 런타임 소켓을 노출합니다. |
| `policy/sandbox-container-unconfined-profile`            | 정책이 거부하는데도 컨테이너 샌드박스 프로필이 제한 해제 상태입니다.                    |
| `policy/sandbox-browser-cdp-source-range-missing`        | 정책이 요구하는데도 샌드박스 브라우저 CDP 소스 범위가 없습니다.             |
| `policy/data-handling-redaction-disabled`                | 정책이 요구하는데도 민감한 로깅 마스킹이 비활성화되어 있습니다.                  |
| `policy/data-handling-telemetry-content-capture`         | 정책이 거부하는데도 텔레메트리 콘텐츠 캡처가 활성화되어 있습니다.                       |
| `policy/data-handling-session-retention-not-enforced`    | 정책이 요구하는데도 세션 보존 유지 관리가 강제되지 않습니다.            |
| `policy/data-handling-session-transcript-memory-enabled` | 정책이 거부하는데도 세션 transcript 메모리 인덱싱이 활성화되어 있습니다.              |
| `policy/secrets-unmanaged-provider`                      | 구성 SecretRef가 `secrets.providers` 아래에 선언되지 않은 공급자를 참조합니다.  |
| `policy/secrets-denied-provider-source`                  | 구성 비밀 공급자 또는 SecretRef가 정책에 의해 거부된 소스를 사용합니다.             |
| `policy/secrets-insecure-provider`                       | 정책이 거부하는데도 비밀 공급자가 안전하지 않은 태세를 선택합니다.               |
| `policy/auth-profile-invalid-metadata`                   | 구성 인증 프로필에 유효한 공급자 또는 모드 메타데이터가 없습니다.                 |
| `policy/auth-profile-unapproved-mode`                    | 구성 인증 프로필 모드가 정책 허용 목록 밖에 있습니다.                       |
| `policy/exec-approvals-missing`                          | 정책이 `exec-approvals.json`을 요구하지만 아티팩트가 없습니다.               |
| `policy/exec-approvals-invalid`                          | 구성된 실행 승인 아티팩트를 파싱할 수 없습니다.                          |
| `policy/exec-approvals-default-security-unapproved`      | 실행 승인 기본값이 정책 허용 목록 밖의 보안 모드를 사용합니다.          |
| `policy/exec-approvals-agent-security-unapproved`        | 에이전트별 유효 실행 승인 보안 모드가 허용 목록 밖에 있습니다.       |
| `policy/exec-approvals-auto-allow-skills-enabled`        | 정책이 거부하는데도 실행 승인 에이전트가 암시적으로 skill CLI를 자동 허용합니다.   |
| `policy/exec-approvals-allowlist-missing`                | 승인 허용 목록에 정책에서 요구하는 패턴이 없습니다.                  |
| `policy/exec-approvals-allowlist-unexpected`             | 승인 허용 목록에 정책에서 예상하지 않은 패턴이 포함되어 있습니다.                |
| `policy/tools-missing-risk-level`                        | 관리되는 도구 선언에 위험 메타데이터가 없습니다.                             |
| `policy/tools-unknown-risk-level`                        | 관리되는 도구 선언이 알 수 없는 위험 값을 사용합니다.                           |
| `policy/tools-missing-sensitivity-token`                 | 관리되는 도구 선언에 민감도 메타데이터가 없습니다.                      |
| `policy/tools-missing-owner`                             | 관리되는 도구 선언에 소유자 메타데이터가 없습니다.                            |
| `policy/tools-unknown-sensitivity-token`                 | 관리되는 도구 선언이 알 수 없는 민감도 값을 사용합니다.                    |

정책 발견 사항에는 `target`과 `requirement`가 모두 포함될 수 있습니다. `target`은
준수하지 않는 것으로 관찰된 워크스페이스 항목입니다. `requirement`는 해당 항목을 발견 사항으로 만든
작성된 정책 규칙입니다. 두 값은 현재 주소이며, 보통
`oc://` 경로이지만, 필드 이름은 주소 형식이 아니라 해당 정책 역할을 설명합니다.

JSON 발견 사항 예시:

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

도구 발견 사항 예시:

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

MCP 발견 사항 예시:

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

모델 공급자 발견 사항 예시:

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

네트워크 발견 사항 예시:

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

Gateway 노출 발견 사항 예:

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

에이전트 워크스페이스 발견 사항 예:

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

`doctor --lint` 및 `policy check`는 읽기 전용입니다.

`doctor --fix`는 `workspaceRepairs`가 명시적으로 활성화된 경우에만
정책이 관리하는 워크스페이스 설정을 편집합니다. 이 옵트인이 없으면 정책 검사는
복구할 항목을 보고하고 설정은 변경하지 않습니다.

이 버전에서 복구는 OpenClaw 구성에서 활성화되어 있지만
`channels.denyRules`에 의해 거부된 채널을 비활성화할 수 있습니다. 유효한 거부 규칙은
구성된 채널을 끌 수 있으므로, 정책 파일을 검토한 뒤에만
`workspaceRepairs`를 활성화하세요.

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

| 명령             | `0`                                                    | `1`                                                                     | `2`                      |
| ---------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------ |
| `policy check`   | 임계값에 해당하는 발견 사항이 없습니다.               | 하나 이상의 발견 사항이 임계값에 해당했습니다.                         | 인수 또는 런타임 실패.   |
| `policy compare` | 정책 파일이 기준선만큼 엄격하거나 그보다 더 엄격합니다. | 정책 파일이 유효하지 않거나, 없거나, 기준선 규칙보다 약합니다.          | 인수 또는 런타임 실패.   |
| `policy watch`   | 발견 사항이 없고 수락된 해시가 최신입니다.            | 발견 사항이 있거나 수락된 증명이 오래되었습니다.                       | 인수 또는 런타임 실패.   |

## 관련 항목

- [Doctor 린트 모드](/ko/cli/doctor#lint-mode)
- [경로 CLI](/ko/cli/path)
