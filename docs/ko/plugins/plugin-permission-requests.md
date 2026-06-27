---
read_when:
    - 부작용이 실행되기 전에 확인하려면 Plugin 훅 또는 도구가 필요합니다
    - Plugin 승인 프롬프트가 전달될 위치를 구성해야 합니다
    - 선택적 도구, exec 승인, Plugin 승인 중 무엇을 사용할지 결정하고 있습니다
sidebarTitle: Permission requests
summary: 사용자에게 Plugin 도구 호출과 Plugin 소유 권한 프롬프트를 승인하도록 요청하기
title: Plugin 권한 요청
x-i18n:
    generated_at: "2026-06-27T17:48:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Plugin 권한 요청을 사용하면 Plugin 코드가 사용자가 승인하거나 거부할 때까지 도구 호출 또는 Plugin 소유 작업을 일시 중지할 수 있습니다. 이 요청은 Gateway `plugin.approval.*` 흐름과 채팅 승인 버튼 및 `/approve` 명령을 처리하는 동일한 승인 UI 표면을 사용합니다.

Plugin/앱 권한에는 Plugin 권한 요청을 사용하세요. 이는 호스트 exec 승인, 선택적 도구 허용 목록, Codex의 네이티브 권한 검토를 대체하지 않습니다.

## 올바른 게이트 선택

필요한 결정 지점에 맞는 게이트를 선택하세요.

| 게이트                             | 사용하는 경우                                                              | 제어 대상                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 선택적 도구                   | 사용자가 동의하기 전까지 도구가 모델에 표시되지 않아야 합니다.        | `tools.allow`를 통한 도구 노출.                                                                              |
| Plugin 권한 요청       | Plugin 훅 또는 Plugin 소유 작업이 하나의 동작을 실행하기 전에 요청해야 합니다. | `plugin.approval.*`를 통한 런타임 승인.                                                                     |
| Exec 승인                   | 호스트 명령 또는 셸과 유사한 도구에 운영자 승인이 필요합니다.               | 호스트 exec 정책 및 영구 exec 허용 목록.                                                                     |
| Codex 네이티브 권한 요청 | Codex가 네이티브 셸, 파일, MCP 또는 앱 서버 동작 전에 요청합니다.        | OpenClaw가 프롬프트를 소유할 때 Plugin 승인을 통해 라우팅되는 Codex 앱 서버 또는 네이티브 훅 승인 처리. |
| MCP 승인 유도        | Codex MCP 서버가 도구 호출에 대한 승인을 요청합니다.                    | OpenClaw Plugin 승인을 통해 브리지되는 MCP 승인 응답.                                                 |

선택적 도구는 발견 시점 게이트입니다. Plugin 권한 요청은 호출별 게이트입니다. 민감한 도구가 모델에 표시되기 전에 명시적인 동의를 요구하고, 동작이 실행되기 전에 승인을 요구해야 하는 경우 둘 다 사용하세요.

## 도구 호출 전에 승인 요청

대부분의 Plugin 작성 프롬프트는 `before_tool_call` 훅에서 시작해야 합니다. 이 훅은 모델이 도구를 선택한 후 OpenClaw가 실행하기 전에 실행됩니다.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

동작을 승인할 사람을 위해 프롬프트 텍스트를 작성하세요.

- `title`은 짧고 동작 중심으로 유지하세요. Gateway는 최대 80자를 허용합니다.
- `description`은 구체적이고 범위를 한정하세요. Gateway는 최대 256자를 허용합니다.
- 동작, 대상, 위험을 포함하세요. 채팅 승인 표면에 표시되어서는 안 되는 비밀, 토큰 또는 비공개 페이로드는 포함하지 마세요.
- 잘못된 결정이 프로덕션 손상이나 데이터 손실을 일으킬 수 있는 동작에만 `severity: "critical"`을 사용하세요.
- 해당 동작에 영구 신뢰가 안전하지 않은 경우 `allowedDecisions: ["allow-once", "deny"]`를 사용하세요.

## 결정 동작

OpenClaw는 `plugin:` ID로 보류 중인 승인을 생성하고, 사용 가능한 승인 표면에 전달한 다음, 결정을 기다립니다.

| 결정          | 결과                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | 현재 호출이 계속됩니다.                                               |
| `allow-always`    | 현재 호출이 계속되고 결정이 Plugin에 전달됩니다.      |
| `deny`            | 호출이 거부된 도구 결과로 차단됩니다.                            |
| 제한 시간           | `timeoutBehavior`가 `"allow"`가 아닌 한 호출이 차단됩니다.                |
| 취소      | 실행이 중단되면 호출이 차단됩니다.                              |
| 승인 경로 없음 | 연결된 승인 표면에서 이를 해결할 수 없기 때문에 호출이 차단됩니다. |

`allow-always`는 요청한 Plugin 또는 런타임이 해당 지속성을 구현한 경우에만 영구적입니다. 일반적인 `before_tool_call.requireApproval` 훅의 경우 OpenClaw는 `allow-once`와 `allow-always`를 현재 호출에 대한 승인 결정으로 처리하고, 해결된 값을 `onResolution`에 전달합니다. Plugin이 `allow-always`를 제공하는 경우, 이후 어떤 호출을 신뢰하는지 정확히 문서화하고 구현하세요.

훅이 `params`도 반환하는 경우 OpenClaw는 승인이 성공한 후에만 해당 매개변수 변경을 적용합니다. 우선순위가 낮은 훅은 우선순위가 높은 훅이 승인을 요청한 후에도 여전히 차단할 수 있습니다.

`allowedDecisions`는 사용자에게 표시되는 버튼과 명령을 제한합니다. Gateway는 요청이 제공하지 않은 결정에 대한 해결 시도를 거부합니다.

## 승인 프롬프트 라우팅

승인 프롬프트는 로컬 UI 표면 또는 승인 처리를 지원하는 채팅 채널에서 해결할 수 있습니다. Plugin 승인 프롬프트를 명시적 채팅 대상으로 전달하려면 `approvals.plugin`을 구성하세요.

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

`approvals.plugin`은 `approvals.exec`와 독립적입니다. exec 승인 전달을 활성화해도 Plugin 승인 프롬프트는 라우팅되지 않으며, Plugin 승인 전달을 활성화해도 호스트 exec 정책은 변경되지 않습니다.

프롬프트에 수동 승인 텍스트가 포함된 경우, 제공된 결정 중 하나로 해결하세요.

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

전체 전달 모델, 동일 채팅 승인 동작, 네이티브 채널 전달, 채널별 승인자 규칙은 [고급 exec 승인](/ko/tools/exec-approvals-advanced#plugin-approval-forwarding)을 참조하세요.

## Codex 네이티브 권한

Codex 네이티브 권한 프롬프트도 Plugin 승인을 통해 이동할 수 있지만, Plugin 작성 훅과는 소유권이 다릅니다.

- Codex 앱 서버 승인 요청은 Codex 검토 후 OpenClaw를 통해 라우팅됩니다.
- 네이티브 훅 `permission_request` 릴레이는 해당 릴레이가 활성화된 경우 `plugin.approval.request`를 통해 요청할 수 있습니다.
- MCP 도구 승인 유도는 Codex가 `_meta.codex_approval_kind`를 `"mcp_tool_call"`로 표시할 때 Plugin 승인을 통해 라우팅됩니다.

Codex별 동작과 fallback 규칙은 [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)을 참조하세요.

## 문제 해결

**도구에 Plugin 승인을 사용할 수 없다고 표시됩니다.** 요청을 수락한 승인 UI 또는 구성된 승인 경로가 없습니다. 승인이 가능한 클라이언트를 연결하거나, 동일 채팅 `/approve`를 지원하는 채널을 사용하거나, `approvals.plugin`을 구성하세요.

**`allow-always`가 표시되지만 다음 호출에서 다시 프롬프트가 표시됩니다.** 일반 Plugin 승인 흐름은 임의 훅에 대한 신뢰를 자동으로 유지하지 않습니다. `onResolution("allow-always")` 이후 Plugin 소유 신뢰를 Plugin에 유지하거나, `allow-once`와 `deny`만 제공하세요.

**`/approve`가 결정을 거부합니다.** 요청이 `allowedDecisions`를 제한했습니다. 프롬프트에 출력된 결정 중 하나를 사용하세요.

**Slack, Discord, Telegram 또는 Matrix 프롬프트가 exec 승인과 다르게 라우팅됩니다.** Plugin 승인과 exec 승인은 별도 구성을 사용하며 다른 권한 검사를 사용할 수 있습니다. `approvals.exec`만 확인하지 말고 `approvals.plugin` 및 채널의 Plugin 승인 지원을 확인하세요.

## 관련 항목

- [Plugin 훅](/ko/plugins/hooks#tool-call-policy)
- [Plugin 빌드](/ko/plugins/building-plugins#registering-agent-tools)
- [고급 exec 승인](/ko/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Gateway 프로토콜](/ko/gateway/protocol)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
