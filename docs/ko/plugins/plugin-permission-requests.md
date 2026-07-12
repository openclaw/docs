---
read_when:
    - 부수 효과가 실행되기 전에 확인하려면 Plugin 훅이나 도구가 필요합니다.
    - Plugin 승인 프롬프트가 전달될 위치를 구성해야 합니다.
    - 선택적 도구, exec 승인, Plugin 승인 중에서 결정하고 있습니다
sidebarTitle: Permission requests
summary: 사용자에게 Plugin 도구 호출 및 Plugin 소유 권한 프롬프트를 승인하도록 요청합니다
title: Plugin 권한 요청
x-i18n:
    generated_at: "2026-07-12T15:30:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin 권한 요청을 사용하면 사용자가 승인하거나 거부할 때까지 Plugin 코드가 도구 호출 또는 Plugin 소유 작업을 일시 중지할 수 있습니다. 이 요청은 Gateway `plugin.approval.*` 흐름과 채팅 승인 버튼 및 `/approve` 명령을 처리하는 동일한 승인 UI 화면을 사용합니다.

Plugin/앱 권한에는 Plugin 권한 요청을 사용하십시오. 이는 호스트 실행 승인, 선택적 도구 허용 목록 또는 Codex의 기본 권한 검토를 대체하지 않습니다.

## 적절한 게이트 선택

필요한 결정 지점에 맞는 게이트를 선택하십시오.

| 게이트                           | 사용 시점                                                                | 제어 대상                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 선택적 도구                      | 사용자가 옵트인하기 전까지 모델에 도구가 표시되지 않아야 할 때           | `tools.allow`를 통한 도구 노출                                                                                         |
| Plugin 권한 요청                 | Plugin 훅 또는 Plugin 소유 작업이 단일 작업 실행 전에 승인을 요청해야 할 때 | `plugin.approval.*`을 통한 런타임 승인                                                                                 |
| 실행 승인                        | 호스트 명령 또는 셸 유사 도구에 운영자 승인이 필요할 때                  | 호스트 실행 정책 및 영구 실행 허용 목록                                                                                |
| Codex 기본 권한 요청             | Codex가 기본 셸, 파일, MCP 또는 앱 서버 작업 전에 승인을 요청할 때       | Codex 앱 서버 또는 기본 훅 승인 처리. OpenClaw가 프롬프트를 소유하면 Plugin 승인을 통해 라우팅됩니다.                   |
| MCP 승인 요청                    | Codex MCP 서버가 도구 호출 승인을 요청할 때                              | OpenClaw Plugin 승인을 통해 브리지되는 MCP 승인 응답                                                                   |

선택적 도구는 검색 시점 게이트입니다. Plugin 권한 요청은 호출별 게이트입니다. 민감한 도구를 모델이 보기 전에 명시적 옵트인을 요구하고 작업 실행 전에 승인을 요구해야 한다면 두 가지를 모두 사용하십시오.

## 도구 호출 전 승인 요청

Plugin에서 작성하는 대부분의 프롬프트는 `before_tool_call` 훅에서 시작해야 합니다. 이 훅은 모델이 도구를 선택한 후 OpenClaw가 도구를 실행하기 전에 실행됩니다.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "배포 정책",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "알 수 없음";

      return {
        requireApproval: {
          title: "서비스 배포",
          description: `${environment}에 서비스를 배포합니다.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          onResolution(decision) {
            console.log(`배포 승인 결정 완료: ${decision}`);
          },
        },
      };
    });
  },
});
```

작업을 승인할 사람을 위한 프롬프트 텍스트를 작성하십시오.

- `title`은 짧고 작업 중심으로 유지하십시오. Gateway는 80자로 제한합니다.
- `description`은 구체적이고 범위가 명확해야 합니다. Gateway는 512자로 제한합니다.
- 작업, 대상 및 위험을 포함하십시오. 채팅 승인 화면에 표시되어서는 안 되는 비밀, 토큰 또는 비공개 페이로드는 포함하지 마십시오.
- `severity`를 생략하면 기본값은 `"warning"`입니다. 잘못된 결정으로 프로덕션 피해나 데이터 손실이 발생할 수 있는 작업에만 `"critical"`을 사용하십시오.
- `allowedDecisions`를 생략하면 기본값은 `["allow-once", "allow-always", "deny"]`입니다. 해당 작업에 영구적인 신뢰를 적용하는 것이 안전하지 않다면 `["allow-once", "deny"]`를 전달하십시오.
- `timeoutMs`의 기본값은 120000(2분)이며, 요청한 값과 관계없이 최대 600000(10분)으로 제한됩니다.

## 결정 동작

OpenClaw는 `plugin:` ID로 대기 중인 승인을 생성하고, 사용 가능한 승인 화면으로 전달한 다음 결정을 기다립니다.

| 결정              | 결과                                                                      |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | 현재 호출이 계속됩니다.                                                   |
| `allow-always`    | 현재 호출이 계속되고 결정이 Plugin에 전달됩니다.                          |
| `deny`            | 거부된 도구 결과와 함께 호출이 차단됩니다.                                |
| 시간 초과         | 호출이 차단됩니다.                                                        |
| 취소              | 실행이 중단되면 호출이 차단됩니다.                                        |
| 승인 경로 없음    | 결정을 처리할 수 있는 연결된 승인 화면이 없으므로 호출이 차단됩니다.      |

요청에서 허용한 정확한 `allow-once` 및 `allow-always` 결정만 실행을 허용합니다. 알 수 없거나, 잘못된 형식이거나, 일치하지 않거나, 누락되었거나, 시간 초과된 결정은 안전하게 차단됩니다. 레거시 `timeoutBehavior` 필드는 Plugin 호환성을 위해 계속 허용되지만 더 이상 사용되지 않으며 무시됩니다. 새 훅에서는 설정하지 마십시오.

`allow-always`는 요청한 Plugin 또는 런타임이 해당 영속성을 구현한 경우에만 영구적으로 적용됩니다. 일반적인 `before_tool_call.requireApproval` 훅에서 OpenClaw는 `allow-once`와 `allow-always`를 현재 호출에 대한 승인 결정으로 처리하고, 결정된 값을 `onResolution`에 전달합니다. Plugin에서 `allow-always`를 제공한다면 이후 어떤 호출을 신뢰하는지 정확히 문서화하고 구현하십시오.

훅이 `params`도 반환하면 OpenClaw는 승인이 성공한 후에만 해당 매개변수 변경 사항을 적용합니다. 우선순위가 높은 훅에서 승인을 요청했더라도 우선순위가 낮은 훅이 이후에 차단할 수 있습니다.

`allowedDecisions`는 사용자에게 표시되는 버튼과 명령을 제한합니다. Gateway는 요청에서 제공하지 않은 결정에 대한 처리 시도를 거부합니다.

## 승인 프롬프트 라우팅

승인 프롬프트는 로컬 UI 화면이나 승인 처리를 지원하는 채팅 채널에서 처리할 수 있습니다. Plugin 승인 프롬프트를 명시적인 채팅 대상으로 전달하려면 `approvals.plugin`을 구성하십시오.

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin`은 `approvals.exec`와 독립적입니다. 실행 승인 전달을 활성화해도 Plugin 승인 프롬프트가 라우팅되지 않으며, Plugin 승인 전달을 활성화해도 호스트 실행 정책은 변경되지 않습니다.

프롬프트에 수동 승인 텍스트가 포함된 경우 제공된 결정 중 하나를 사용해 처리하십시오.

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

전체 전달 모델, 동일 채팅 승인 동작, 기본 채널 전달 및 채널별 승인자 규칙은 [고급 실행 승인](/ko/tools/exec-approvals-advanced#plugin-approval-forwarding)을 참조하십시오.

## Codex 기본 권한

Codex 기본 권한 프롬프트도 Plugin 승인을 통해 전달될 수 있지만, Plugin에서 작성한 훅과 소유권이 다릅니다.

- Codex 앱 서버 승인 요청은 Codex 검토 후 OpenClaw를 통해 라우팅됩니다.
- 기본 훅 `permission_request` 릴레이가 활성화된 경우 `plugin.approval.request`를 통해 요청할 수 있습니다.
- Codex가 `_meta.codex_approval_kind`를 `"mcp_tool_call"`로 표시하면 MCP 도구 승인 요청이 Plugin 승인을 통해 라우팅됩니다.

Codex 관련 동작 및 폴백 규칙은 [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)을 참조하십시오.

## 문제 해결

**도구에 Plugin 승인을 사용할 수 없다고 표시됩니다.** 승인 UI 또는 구성된 승인 경로가 요청을 수락하지 않았습니다. 승인 기능을 지원하는 클라이언트를 연결하거나, 동일 채팅의 `/approve`를 지원하는 채널을 사용하거나, `approvals.plugin`을 구성하십시오.

**`allow-always`가 표시되지만 다음 호출에서 다시 프롬프트가 나타납니다.** 일반 Plugin 승인 흐름은 임의의 훅에 대한 신뢰를 자동으로 영속화하지 않습니다. `onResolution("allow-always")` 이후 Plugin 소유 신뢰를 Plugin에 영속화하거나 `allow-once`와 `deny`만 제공하십시오.

**`/approve`에서 결정을 거부합니다.** 요청이 `allowedDecisions`를 제한했습니다. 프롬프트에 표시된 결정 중 하나를 사용하십시오.

**Discord, Matrix, Slack 또는 Telegram 프롬프트가 실행 승인과 다르게 라우팅됩니다.** Plugin 승인과 실행 승인은 별도의 구성을 사용하며 서로 다른 권한 부여 검사를 사용할 수 있습니다. `approvals.exec`만 확인하지 말고 `approvals.plugin`과 채널의 Plugin 승인 지원 여부를 확인하십시오.

## 관련 문서

- [Plugin 훅](/ko/plugins/hooks#tool-call-policy)
- [Plugin 빌드](/ko/plugins/building-plugins#registering-tools)
- [고급 실행 승인](/ko/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway 프로토콜](/ko/gateway/protocol)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
