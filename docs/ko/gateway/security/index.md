---
read_when:
    - 접근 범위나 자동화를 확대하는 기능 추가
summary: 셸 접근 권한이 있는 AI Gateway를 실행할 때의 보안 고려 사항 및 위협 모델
title: 보안
x-i18n:
    generated_at: "2026-04-30T06:33:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a1733675f30b5eb8a45eae671aaa8cf41323e16d2543a02ed7bda558c4ebad1
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **개인 비서 신뢰 모델.** 이 지침은 gateway당 하나의 신뢰할 수 있는
  운영자 경계(단일 사용자, 개인 비서 모델)를 가정합니다.
  OpenClaw는 하나의 agent 또는 gateway를 공유하는 여러
  적대적 사용자를 위한 적대적 멀티테넌트 보안 경계가 **아닙니다**.
  혼합 신뢰 또는 적대적 사용자 운영이 필요하다면 신뢰 경계를 분리하세요(별도 gateway +
  credentials, 가능하면 별도 OS 사용자 또는 host).
</Warning>

## 범위 먼저: 개인 비서 보안 모델

OpenClaw 보안 지침은 **개인 비서** 배포를 가정합니다. 즉, 하나의 신뢰할 수 있는 운영자 경계와 잠재적으로 여러 agents입니다.

- 지원되는 보안 태세: gateway당 하나의 사용자/신뢰 경계(경계마다 하나의 OS 사용자/host/VPS 권장).
- 지원되는 보안 경계가 아님: 서로 신뢰하지 않거나 적대적인 사용자가 사용하는 하나의 공유 gateway/agent.
- 적대적 사용자 격리가 필요하다면 신뢰 경계별로 분리하세요(별도 gateway + credentials, 가능하면 별도 OS 사용자/hosts).
- 신뢰할 수 없는 여러 사용자가 tool이 활성화된 하나의 agent에 메시지를 보낼 수 있다면, 해당 agent에 대해 같은 위임된 tool 권한을 공유하는 것으로 취급하세요.

이 페이지는 **해당 모델 내에서의** 강화 방법을 설명합니다. 하나의 공유 gateway에서 적대적 멀티테넌트 격리를 제공한다고 주장하지 않습니다.

## 빠른 확인: `openclaw security audit`

참고: [정형 검증(보안 모델)](/ko/security/formal-verification)

정기적으로 실행하세요(특히 config를 변경하거나 network surface를 노출한 뒤):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix`는 의도적으로 범위가 좁습니다. 일반적인 열린 group
policies를 allowlists로 전환하고, `logging.redactSensitive: "tools"`를 복원하며,
state/config/include-file 권한을 강화하고, Windows에서 실행 중일 때는
POSIX `chmod` 대신 Windows ACL resets를 사용합니다.

일반적인 실수(Gateway auth 노출, browser control 노출, elevated allowlists, filesystem permissions, permissive exec approvals, open-channel tool 노출)를 표시합니다.

OpenClaw는 product이자 실험입니다. frontier-model 동작을 실제 messaging surfaces 및 실제 tools에 연결하는 것입니다. **“완벽하게 안전한” 설정은 없습니다.** 목표는 다음을 의도적으로 정하는 것입니다.

- 누가 bot과 대화할 수 있는지
- bot이 어디에서 작업할 수 있는지
- bot이 무엇을 건드릴 수 있는지

작동하는 가장 작은 access부터 시작한 다음, 확신이 생기면 넓히세요.

### 배포 및 host 신뢰

OpenClaw는 host와 config 경계가 신뢰된다고 가정합니다.

- 누군가 Gateway host state/config(`openclaw.json`을 포함한 `~/.openclaw`)를 수정할 수 있다면, 그 사람을 신뢰할 수 있는 운영자로 취급하세요.
- 서로 신뢰하지 않거나 적대적인 여러 운영자를 위해 하나의 Gateway를 실행하는 것은 **권장 설정이 아닙니다**.
- 혼합 신뢰 팀의 경우 별도 gateways로 신뢰 경계를 분리하세요(또는 최소한 별도 OS 사용자/hosts).
- 권장 기본값: machine/host(또는 VPS)당 한 사용자, 해당 사용자용 gateway 하나, 그리고 그 gateway 안의 하나 이상의 agents.
- 하나의 Gateway instance 안에서 authenticated operator access는 사용자별 tenant role이 아니라 신뢰할 수 있는 control-plane role입니다.
- Session identifiers(`sessionKey`, session IDs, labels)는 routing selectors이지 authorization tokens가 아닙니다.
- 여러 사람이 tool이 활성화된 하나의 agent에 메시지를 보낼 수 있다면, 각자가 동일한 permission set을 조종할 수 있습니다. 사용자별 session/memory isolation은 privacy에 도움이 되지만, 공유 agent를 사용자별 host authorization으로 바꾸지는 않습니다.

### 공유 Slack workspace: 실제 위험

"Slack의 모든 사람이 bot에게 메시지를 보낼 수 있다면" 핵심 위험은 위임된 tool 권한입니다.

- 허용된 sender는 agent의 policy 내에서 tool calls(`exec`, browser, network/file tools)를 유도할 수 있습니다.
- 한 sender의 prompt/content injection이 shared state, devices, outputs에 영향을 주는 actions를 일으킬 수 있습니다.
- 하나의 공유 agent에 sensitive credentials/files가 있다면, 허용된 모든 sender가 tool usage를 통해 잠재적으로 exfiltration을 유도할 수 있습니다.

Team workflows에는 최소 tools를 가진 별도 agents/gateways를 사용하고, personal-data agents는 private로 유지하세요.

### 회사 공유 agent: 허용 가능한 패턴

해당 agent를 사용하는 모든 사람이 같은 신뢰 경계 안에 있고(예: 한 회사 team), agent가 엄격히 business-scoped인 경우 허용됩니다.

- dedicated machine/VM/container에서 실행하세요.
- 해당 runtime에 dedicated OS user + dedicated browser/profile/accounts를 사용하세요.
- 해당 runtime에 personal Apple/Google accounts 또는 personal password-manager/browser profiles로 로그인하지 마세요.

같은 runtime에서 personal identities와 company identities를 섞으면 분리가 무너지고 personal-data exposure risk가 커집니다.

## Gateway 및 Node 신뢰 개념

Gateway와 Node를 역할이 다른 하나의 operator trust domain으로 취급하세요.

- **Gateway**는 control plane 및 policy surface입니다(`gateway.auth`, tool policy, routing).
- **Node**는 해당 Gateway에 paired된 remote execution surface입니다(commands, device actions, host-local capabilities).
- Gateway에 authenticated된 caller는 Gateway scope에서 신뢰됩니다. Pairing 이후 node actions는 해당 node에서 신뢰할 수 있는 operator actions입니다.
- shared gateway token/password로 authenticated된 direct loopback backend clients는 user
  device identity를 제시하지 않고도 internal control-plane RPCs를 만들 수 있습니다.
  이는 remote 또는 browser pairing bypass가 아닙니다. network
  clients, node clients, device-token clients, explicit device identities는
  여전히 pairing 및 scope-upgrade enforcement를 거칩니다.
- `sessionKey`는 routing/context selection이지 사용자별 auth가 아닙니다.
- Exec approvals(allowlist + ask)는 operator intent에 대한 guardrails이지 적대적 멀티테넌트 격리가 아닙니다.
- 신뢰할 수 있는 단일 운영자 설정에 대한 OpenClaw의 product default는 `gateway`/`node`에서 host exec가 approval prompts 없이 허용되는 것입니다(`security="full"`, 강화하지 않는 한 `ask="off"`). 이 기본값은 의도적인 UX이며, 그 자체로 취약점은 아닙니다.
- Exec approvals는 정확한 request context와 최선의 direct local file operands에 바인딩됩니다. 모든 runtime/interpreter loader path를 의미론적으로 모델링하지는 않습니다. 강한 경계에는 sandboxing과 host isolation을 사용하세요.

적대적 사용자 격리가 필요하다면 OS 사용자/host별로 신뢰 경계를 분리하고 별도 gateways를 실행하세요.

## 신뢰 경계 매트릭스

위험을 triage할 때 이 빠른 모델을 사용하세요.

| 경계 또는 제어                                           | 의미                                              | 흔한 오해                                                                      |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | gateway APIs에 대한 callers 인증                 | "보안성을 위해 모든 frame마다 per-message signatures가 필요하다"              |
| `sessionKey`                                              | context/session selection을 위한 routing key      | "Session key는 user auth boundary다"                                          |
| Prompt/content guardrails                                 | model abuse risk 완화                             | "Prompt injection만으로 auth bypass가 증명된다"                               |
| `canvas.eval` / browser evaluate                          | 활성화 시 의도된 operator capability              | "모든 JS eval primitive는 이 신뢰 모델에서 자동으로 vuln이다"                 |
| Local TUI `!` shell                                       | 명시적으로 operator가 트리거한 local execution    | "Local shell convenience command는 remote injection이다"                       |
| Node pairing 및 node commands                             | paired devices에서 operator-level remote execution | "Remote device control은 기본적으로 untrusted user access로 취급해야 한다"    |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Opt-in trusted-network node enrollment policy     | "기본적으로 비활성화된 allowlist는 automatic pairing vulnerability다"         |

## 설계상 취약점이 아닌 것

<Accordion title="범위 밖인 일반적인 findings">

이러한 패턴은 자주 보고되며, 실제 boundary bypass가 입증되지 않는 한
대개 조치 없이 종료됩니다.

- policy, auth, sandbox bypass가 없는 prompt-injection-only chains.
- 하나의 공유 host 또는 config에서의 적대적 멀티테넌트 운영을 가정하는 claims.
- 공유 gateway 설정에서 일반적인 operator read-path access(예:
  `sessions.list` / `sessions.preview` / `chat.history`)를 IDOR로 분류하는 claims.
- Localhost-only deployment findings(예: loopback-only
  gateway의 HSTS).
- 이 repo에 존재하지 않는 inbound paths에 대한 Discord inbound webhook signature findings.
- `system.run`에 대해 node pairing metadata를 숨겨진 두 번째 per-command
  approval layer로 취급하는 reports. 실제 execution boundary는 여전히
  gateway의 global node command policy와 node 자체 exec
  approvals입니다.
- 구성된 `gateway.nodes.pairing.autoApproveCidrs` 자체를
  vulnerability로 취급하는 reports. 이 설정은 기본적으로 비활성화되어 있고,
  명시적인 CIDR/IP entries가 필요하며, requested scopes가 없는 최초 `role: node` pairing에만 적용되고,
  operator/browser/Control UI,
  WebChat, role upgrades, scope upgrades, metadata changes, public-key changes,
  또는 loopback trusted-proxy auth가 명시적으로 활성화되지 않은 same-host loopback trusted-proxy header paths를 auto-approve하지 않습니다.
- `sessionKey`를 auth token으로 취급하는 "Missing per-user authorization" findings.

</Accordion>

## 60초 안에 적용하는 hardened baseline

먼저 이 baseline을 사용한 다음, 신뢰할 수 있는 agent별로 tools를 선택적으로 다시 활성화하세요.

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

이렇게 하면 Gateway는 local-only로 유지되고, DMs가 격리되며, control-plane/runtime tools가 기본적으로 비활성화됩니다.

## 공유 inbox 빠른 규칙

두 명 이상이 bot에게 DM을 보낼 수 있다면:

- `session.dmScope: "per-channel-peer"`를 설정하세요(또는 multi-account channels의 경우 `"per-account-channel-peer"`).
- `dmPolicy: "pairing"` 또는 엄격한 allowlists를 유지하세요.
- Shared DMs와 broad tool access를 절대 결합하지 마세요.
- 이는 cooperative/shared inboxes를 강화하지만, 사용자가 host/config write access를 공유할 때 적대적 co-tenant isolation을 제공하도록 설계된 것은 아닙니다.

## Context visibility 모델

OpenClaw는 두 개념을 분리합니다.

- **Trigger authorization**: 누가 agent를 trigger할 수 있는지(`dmPolicy`, `groupPolicy`, allowlists, mention gates).
- **Context visibility**: model input에 어떤 supplemental context가 injected되는지(reply body, quoted text, thread history, forwarded metadata).

Allowlists는 triggers 및 command authorization을 gate합니다. `contextVisibility` 설정은 supplemental context(quoted replies, thread roots, fetched history)가 필터링되는 방식을 제어합니다.

- `contextVisibility: "all"`(기본값)은 supplemental context를 받은 그대로 유지합니다.
- `contextVisibility: "allowlist"`는 active allowlist checks에서 허용된 senders로 supplemental context를 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`처럼 동작하지만, 명시적인 quoted reply 하나는 계속 유지합니다.

Channel별 또는 room/conversation별로 `contextVisibility`를 설정하세요. 설정 세부 정보는 [Group Chats](/ko/channels/groups#context-visibility-and-allowlists)를 참고하세요.

Advisory triage 지침:

- “모델이 허용 목록에 없는 발신자의 인용 또는 과거 텍스트를 볼 수 있음”만 보여 주는 주장은 `contextVisibility`로 해결할 수 있는 강화 발견 사항이며, 그 자체로 인증 또는 샌드박스 경계 우회는 아닙니다.
- 보안 영향이 있으려면 보고서에는 여전히 입증된 신뢰 경계 우회(인증, 정책, 샌드박스, 승인 또는 문서화된 다른 경계)가 필요합니다.

## 감사에서 확인하는 항목(상위 수준)

- **인바운드 접근**(DM 정책, 그룹 정책, 허용 목록): 모르는 사람이 봇을 트리거할 수 있나요?
- **도구 영향 범위**(상승된 권한의 도구 + 열린 방): 프롬프트 인젝션이 셸/파일/네트워크 작업으로 이어질 수 있나요?
- **실행 승인 드리프트**(`security=full`, `autoAllowSkills`, `strictInlineEval` 없는 인터프리터 허용 목록): 호스트 실행 가드레일이 여전히 의도한 대로 작동하고 있나요?
  - `security="full"`은 광범위한 태세 경고이지 버그의 증거가 아닙니다. 신뢰할 수 있는 개인 비서 설정을 위해 선택된 기본값입니다. 위협 모델에 승인 또는 허용 목록 가드레일이 필요할 때만 더 엄격하게 조정하세요.
- **네트워크 노출**(Gateway 바인드/인증, Tailscale Serve/Funnel, 약하거나 짧은 인증 토큰).
- **브라우저 제어 노출**(원격 Node, 릴레이 포트, 원격 CDP 엔드포인트).
- **로컬 디스크 위생**(권한, 심볼릭 링크, 구성 include, “동기화된 폴더” 경로).
- **Plugin**(명시적 허용 목록 없이 Plugin 로드).
- **정책 드리프트/잘못된 구성**(샌드박스 docker 설정이 구성되어 있지만 샌드박스 모드가 꺼져 있음, 매칭이 정확한 명령 이름만 대상으로 하므로(예: `system.run`) 셸 텍스트를 검사하지 않아 효과가 없는 `gateway.nodes.denyCommands` 패턴, 위험한 `gateway.nodes.allowCommands` 항목, 에이전트별 프로필이 전역 `tools.profile="minimal"`을 재정의함, 허용적인 도구 정책에서 Plugin 소유 도구에 접근 가능).
- **런타임 기대값 드리프트**(예: `tools.exec.host`가 이제 기본값이 `auto`인데도 암시적 실행이 여전히 `sandbox`를 의미한다고 가정하거나, 샌드박스 모드가 꺼져 있는데 `tools.exec.host="sandbox"`를 명시적으로 설정).
- **모델 위생**(구성된 모델이 레거시로 보일 때 경고하며, 강제 차단은 아님).

`--deep`을 실행하면 OpenClaw는 최선의 라이브 Gateway 프로브도 시도합니다.

## 자격 증명 저장소 맵

접근을 감사하거나 백업할 항목을 결정할 때 사용하세요.

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 봇 토큰**: config/env 또는 `channels.telegram.tokenFile`(일반 파일만 가능, 심볼릭 링크 거부)
- **Discord 봇 토큰**: config/env 또는 SecretRef(env/file/exec providers)
- **Slack 토큰**: config/env(`channels.slack.*`)
- **페어링 허용 목록**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`(기본 계정)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`(기본이 아닌 계정)
- **모델 인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **파일 기반 비밀 페이로드(선택 사항)**: `~/.openclaw/secrets.json`
- **레거시 OAuth 가져오기**: `~/.openclaw/credentials/oauth.json`

## 보안 감사 체크리스트

감사에서 발견 사항이 출력되면 다음 우선순위로 처리하세요.

1. **“열림” + 도구 활성화된 모든 항목**: 먼저 DM/그룹을 잠그고(페어링/허용 목록), 그다음 도구 정책/샌드박싱을 강화하세요.
2. **공개 네트워크 노출**(LAN 바인드, Funnel, 인증 누락): 즉시 수정하세요.
3. **브라우저 제어 원격 노출**: 운영자 접근처럼 취급하세요(tailnet 전용, Node를 의도적으로 페어링, 공개 노출 방지).
4. **권한**: 상태/구성/자격 증명/인증이 그룹 또는 모든 사용자에게 읽기 가능하지 않은지 확인하세요.
5. **Plugin**: 명시적으로 신뢰하는 것만 로드하세요.
6. **모델 선택**: 도구가 있는 모든 봇에는 최신의 지시 강화 모델을 선호하세요.

## 보안 감사 용어집

각 감사 발견 사항은 구조화된 `checkId`(예:
`gateway.bind_no_auth` 또는 `tools.exec.security_full_configured`)로 식별됩니다. 일반적인
중대 심각도 클래스:

- `fs.*` — 상태, 구성, 자격 증명, 인증 프로필에 대한 파일 시스템 권한.
- `gateway.*` — 바인드 모드, 인증, Tailscale, Control UI, 신뢰된 프록시 설정.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — 표면별 강화.
- `plugins.*`, `skills.*` — Plugin/Skills 공급망 및 스캔 발견 사항.
- `security.exposure.*` — 접근 정책과 도구 영향 범위가 만나는 교차 확인.

심각도 수준, 수정 키, 자동 수정 지원이 포함된 전체 카탈로그는
[보안 감사 검사](/ko/gateway/security/audit-checks)를 참조하세요.

## HTTP를 통한 Control UI

Control UI가 장치 ID를 생성하려면 **보안 컨텍스트**(HTTPS 또는 localhost)가 필요합니다. `gateway.controlUi.allowInsecureAuth`는 로컬 호환성 토글입니다.

- localhost에서는 페이지가 보안되지 않은 HTTP로 로드될 때 장치 ID 없이 Control UI 인증을 허용합니다.
- 페어링 검사를 우회하지 않습니다.
- 원격(non-localhost) 장치 ID 요구 사항을 완화하지 않습니다.

HTTPS(Tailscale Serve)를 선호하거나 `127.0.0.1`에서 UI를 여세요.

비상 상황에서만 `gateway.controlUi.dangerouslyDisableDeviceAuth`는 장치 ID 검사를 완전히 비활성화합니다. 이는 심각한 보안 다운그레이드입니다. 적극적으로 디버깅 중이고 빠르게 되돌릴 수 있는 경우가 아니면 꺼 두세요.

이러한 위험한 플래그와 별개로, 성공한 `gateway.auth.mode: "trusted-proxy"`는 장치 ID 없이 **운영자** Control UI 세션을 허용할 수 있습니다. 이는 의도된 인증 모드 동작이지 `allowInsecureAuth` 지름길이 아니며, 여전히 Node 역할 Control UI 세션으로 확장되지는 않습니다.

이 설정이 활성화되면 `openclaw security audit`가 경고합니다.

## 안전하지 않거나 위험한 플래그 요약

알려진 안전하지 않거나 위험한 디버그 스위치가 활성화되면 `openclaw security audit`는 `config.insecure_or_dangerous_flags`를 발생시킵니다. 프로덕션에서는 이러한 항목을 설정하지 않은 상태로 유지하세요.

<AccordionGroup>
  <Accordion title="현재 감사에서 추적하는 플래그">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="구성 스키마의 모든 `dangerous*` / `dangerously*` 키">
    Control UI 및 브라우저:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    채널 이름 매칭(번들 및 Plugin 채널, 해당하는 경우 `accounts.<accountId>`별로도 사용 가능):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching`(Plugin 채널)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath`(Plugin 채널)
    - `channels.zalouser.dangerouslyAllowNameMatching`(Plugin 채널)
    - `channels.irc.dangerouslyAllowNameMatching`(Plugin 채널)
    - `channels.mattermost.dangerouslyAllowNameMatching`(Plugin 채널)

    네트워크 노출:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork`(계정별로도 가능)

    샌드박스 Docker(기본값 + 에이전트별):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## 리버스 프록시 구성

Gateway를 리버스 프록시(nginx, Caddy, Traefik 등) 뒤에서 실행하는 경우, 전달된 클라이언트 IP 처리를 올바르게 하려면 `gateway.trustedProxies`를 구성하세요.

Gateway가 `trustedProxies`에 **없는** 주소에서 프록시 헤더를 감지하면, 연결을 로컬 클라이언트로 취급하지 **않습니다**. Gateway 인증이 비활성화되어 있으면 해당 연결은 거부됩니다. 이를 통해 프록시된 연결이 localhost에서 온 것처럼 보이고 자동 신뢰를 받는 인증 우회를 방지합니다.

`gateway.trustedProxies`는 `gateway.auth.mode: "trusted-proxy"`에도 사용되지만, 해당 인증 모드는 더 엄격합니다.

- trusted-proxy 인증은 기본적으로 loopback 소스 프록시에서 **닫힌 상태로 실패합니다**
- 동일 호스트 loopback 리버스 프록시는 로컬 클라이언트 감지와 전달된 IP 처리를 위해 `gateway.trustedProxies`를 사용할 수 있습니다
- 동일 호스트 loopback 리버스 프록시는 `gateway.auth.trustedProxy.allowLoopback = true`인 경우에만 `gateway.auth.mode: "trusted-proxy"`를 충족할 수 있습니다. 그렇지 않으면 토큰/비밀번호 인증을 사용하세요

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

`trustedProxies`가 구성되면 Gateway는 클라이언트 IP를 확인하기 위해 `X-Forwarded-For`를 사용합니다. `gateway.allowRealIpFallback: true`가 명시적으로 설정되지 않은 한 `X-Real-IP`는 기본적으로 무시됩니다.

신뢰된 프록시 헤더가 Node 장치 페어링을 자동으로 신뢰하게 만들지는 않습니다.
`gateway.nodes.pairing.autoApproveCidrs`는 별도의, 기본적으로 비활성화된
운영자 정책입니다. 활성화되어 있더라도 loopback 소스 trusted-proxy 헤더 경로는
Node 자동 승인에서 제외됩니다. 로컬 호출자가 해당 헤더를 위조할 수 있기 때문이며,
loopback trusted-proxy 인증이 명시적으로 활성화된 경우도 포함됩니다.

좋은 리버스 프록시 동작(들어오는 전달 헤더 덮어쓰기):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

나쁜 리버스 프록시 동작(신뢰할 수 없는 전달 헤더 추가/보존):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS 및 origin 참고 사항

- OpenClaw gateway는 로컬/loopback 우선입니다. 리버스 프록시에서 TLS를 종료하는 경우, 프록시가 바라보는 HTTPS 도메인에서 HSTS를 설정하세요.
- gateway 자체가 HTTPS를 종료하는 경우, OpenClaw 응답에서 HSTS 헤더를 내보내도록 `gateway.http.securityHeaders.strictTransportSecurity`를 설정할 수 있습니다.
- 자세한 배포 지침은 [신뢰된 프록시 인증](/ko/gateway/trusted-proxy-auth#tls-termination-and-hsts)에 있습니다.
- non-loopback Control UI 배포의 경우, 기본적으로 `gateway.controlUi.allowedOrigins`가 필요합니다.
- `gateway.controlUi.allowedOrigins: ["*"]`는 명시적인 모든 브라우저 origin 허용 정책이며, 강화된 기본값이 아닙니다. 엄격하게 통제된 로컬 테스트 밖에서는 피하세요.
- loopback에서 브라우저 origin 인증 실패는 일반 loopback 예외가 활성화되어 있더라도 여전히 속도 제한이 적용되지만, 잠금 키는 하나의 공유 localhost 버킷이 아니라 정규화된 `Origin` 값별로 범위가 지정됩니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host 헤더 origin fallback 모드를 활성화합니다. 이를 운영자가 선택한 위험한 정책으로 취급하세요.
- DNS 리바인딩 및 프록시 Host 헤더 동작을 배포 강화 문제로 취급하세요. `trustedProxies`를 엄격하게 유지하고 gateway를 공용 인터넷에 직접 노출하지 마세요.

## 로컬 세션 로그는 디스크에 저장됩니다

OpenClaw는 세션 transcript를 `~/.openclaw/agents/<agentId>/sessions/*.jsonl` 아래의 디스크에 저장합니다.
이는 세션 연속성과 (선택적으로) 세션 메모리 인덱싱에 필요하지만, 동시에
**파일 시스템 접근 권한이 있는 모든 프로세스/사용자가 해당 로그를 읽을 수 있음**을 의미합니다. 디스크 접근을 신뢰
경계로 취급하고 `~/.openclaw`의 권한을 잠그세요(아래 감사 섹션 참조). 에이전트 간에
더 강한 격리가 필요하면 별도의 OS 사용자 또는 별도의 호스트에서 실행하세요.

## Node 실행(system.run)

macOS Node가 페어링된 경우, Gateway는 해당 Node에서 `system.run`을 호출할 수 있습니다. 이는 Mac에서의 **원격 코드 실행**입니다:

- Node 페어링(승인 + 토큰)이 필요합니다.
- Gateway Node 페어링은 명령별 승인 표면이 아닙니다. Node 신원/신뢰와 토큰 발급을 설정합니다.
- Gateway는 `gateway.nodes.allowCommands` / `denyCommands`를 통해 대략적인 전역 Node 명령 정책을 적용합니다.
- Mac에서는 **Settings → Exec approvals**(보안 + 묻기 + 허용 목록)로 제어합니다.
- Node별 `system.run` 정책은 Node 자체의 실행 승인 파일(`exec.approvals.node.*`)이며, Gateway의 전역 명령 ID 정책보다 더 엄격하거나 더 느슨할 수 있습니다.
- `security="full"` 및 `ask="off"`로 실행되는 Node는 기본 신뢰된 운영자 모델을 따릅니다. 배포 환경에서 더 엄격한 승인 또는 허용 목록 태도를 명시적으로 요구하지 않는 한 이를 예상된 동작으로 취급하세요.
- 승인 모드는 정확한 요청 컨텍스트와, 가능한 경우 하나의 구체적인 로컬 스크립트/파일 피연산자에 바인딩됩니다. OpenClaw가 인터프리터/런타임 명령에 대해 정확히 하나의 직접 로컬 파일을 식별할 수 없으면, 승인 기반 실행은 전체 의미론적 범위를 약속하는 대신 거부됩니다.
- `host=node`의 경우 승인 기반 실행은 정식으로 준비된
  `systemRunPlan`도 저장합니다. 나중에 승인된 전달은 저장된 해당 계획을 재사용하며, Gateway
  검증은 승인 요청이 생성된 뒤 호출자가 command/cwd/session 컨텍스트를 편집하는 것을 거부합니다.
- 원격 실행을 원하지 않으면 보안을 **deny**로 설정하고 해당 Mac의 Node 페어링을 제거하세요.

이 구분은 triage에서 중요합니다.

- 다시 연결된 페어링된 Node가 다른 명령 목록을 광고하는 것은, Gateway 전역 정책과 Node의 로컬 실행 승인이 실제 실행 경계를 여전히 강제한다면 그 자체로 취약점이 아닙니다.
- Node 페어링 메타데이터를 두 번째 숨겨진 명령별 승인 계층으로 취급하는 보고서는 보통 보안 경계 우회가 아니라 정책/UX 혼동입니다.

## 동적 Skills(감시자 / 원격 Node)

OpenClaw는 세션 중간에 Skills 목록을 새로 고칠 수 있습니다.

- **Skills 감시자**: `SKILL.md` 변경 사항은 다음 에이전트 턴에서 Skills 스냅샷을 업데이트할 수 있습니다.
- **원격 Node**: macOS Node를 연결하면 macOS 전용 Skills가 적격해질 수 있습니다(bin 프로빙 기준).

Skills 폴더를 **신뢰된 코드**로 취급하고 수정 권한이 있는 사람을 제한하세요.

## 위협 모델

AI 어시스턴트는 다음을 할 수 있습니다.

- 임의의 셸 명령 실행
- 파일 읽기/쓰기
- 네트워크 서비스 접근
- 누구에게나 메시지 보내기(WhatsApp 접근 권한을 부여한 경우)

당신에게 메시지를 보내는 사람은 다음을 할 수 있습니다.

- AI가 나쁜 일을 하도록 속이려고 시도
- 데이터 접근 권한을 얻기 위한 사회공학
- 인프라 세부 정보 탐색

## 핵심 개념: 지능보다 접근 제어가 먼저

여기서 발생하는 대부분의 실패는 정교한 익스플로잇이 아니라 “누군가 봇에게 메시지를 보냈고 봇이 요청대로 수행했다”는 경우입니다.

OpenClaw의 입장:

- **신원 먼저:** 누가 봇과 대화할 수 있는지 결정합니다(DM 페어링 / 허용 목록 / 명시적 “open”).
- **범위 다음:** 봇이 어디에서 동작할 수 있는지 결정합니다(그룹 허용 목록 + 멘션 게이팅, 도구, 샌드박싱, 기기 권한).
- **모델 마지막:** 모델이 조작될 수 있다고 가정하고, 조작의 영향 범위가 제한되도록 설계합니다.

## 명령 승인 모델

Slash commands와 지시어는 **승인된 발신자**에게만 적용됩니다. 승인은 채널 허용 목록/페어링과 `commands.useAccessGroups`에서 파생됩니다([Configuration](/ko/gateway/configuration) 및 [Slash commands](/ko/tools/slash-commands) 참조). 채널 허용 목록이 비어 있거나 `"*"`를 포함하면, 해당 채널의 명령은 사실상 개방됩니다.

`/exec`는 승인된 운영자를 위한 세션 전용 편의 기능입니다. config를 쓰거나 다른 세션을 변경하지 **않습니다**.

## 제어 평면 도구 위험

두 가지 내장 도구는 지속적인 제어 평면 변경을 만들 수 있습니다.

- `gateway`는 `config.schema.lookup` / `config.get`으로 config를 검사할 수 있고, `config.apply`, `config.patch`, `update.run`으로 지속적인 변경을 만들 수 있습니다.
- `cron`은 원래 채팅/작업이 끝난 뒤에도 계속 실행되는 예약 작업을 만들 수 있습니다.

소유자 전용 `gateway` 런타임 도구는 여전히
`tools.exec.ask` 또는 `tools.exec.security` 재작성을 거부합니다. 레거시 `tools.bash.*` 별칭은
쓰기 전에 동일한 보호된 exec 경로로 정규화됩니다.
에이전트가 구동하는 `gateway config.apply` 및 `gateway config.patch` 편집은
기본적으로 fail-closed입니다. 프롬프트, 모델, 멘션 게이팅 경로의 좁은 집합만
에이전트가 조정할 수 있습니다. 따라서 새 민감 config 트리는
의도적으로 허용 목록에 추가되지 않는 한 보호됩니다.

신뢰할 수 없는 콘텐츠를 처리하는 모든 에이전트/표면에서는 기본적으로 다음을 거부하세요.

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false`는 재시작 동작만 차단합니다. `gateway` config/update 동작은 비활성화하지 않습니다.

## Plugin

Plugin은 Gateway와 **동일 프로세스 내**에서 실행됩니다. 이를 신뢰된 코드로 취급하세요.

- 신뢰하는 출처의 Plugin만 설치하세요.
- 명시적인 `plugins.allow` 허용 목록을 선호하세요.
- 활성화하기 전에 Plugin config를 검토하세요.
- Plugin 변경 후 Gateway를 재시작하세요.
- Plugin을 설치하거나 업데이트하는 경우(`openclaw plugins install <package>`, `openclaw plugins update <id>`), 신뢰할 수 없는 코드를 실행하는 것처럼 취급하세요.
  - 설치 경로는 활성 Plugin 설치 루트 아래의 Plugin별 디렉터리입니다.
  - OpenClaw는 설치/업데이트 전에 내장 위험 코드 스캔을 실행합니다. `critical` 발견 사항은 기본적으로 차단됩니다.
  - OpenClaw는 `npm pack`을 사용한 다음 해당 디렉터리에서 프로젝트 로컬 `npm install --omit=dev --ignore-scripts`를 실행합니다. 상속된 전역 npm 설치 설정은 무시되므로 의존성이 Plugin 설치 경로 아래에 유지됩니다.
  - 고정된 정확한 버전(`@scope/pkg@1.2.3`)을 선호하고, 활성화하기 전에 디스크의 압축 해제된 코드를 검사하세요.
  - `--dangerously-force-unsafe-install`은 Plugin 설치/업데이트 흐름에서 내장 스캔 오탐을 위한 비상 수단일 뿐입니다. Plugin `before_install` 훅 정책 차단을 우회하지 않으며 스캔 실패도 우회하지 않습니다.
  - Gateway 기반 Skill 의존성 설치는 동일한 위험/의심 분리를 따릅니다. 호출자가 `dangerouslyForceUnsafeInstall`을 명시적으로 설정하지 않는 한 내장 `critical` 발견 사항은 차단되며, 의심스러운 발견 사항은 계속 경고만 합니다. `openclaw skills install`은 별도의 ClawHub Skill 다운로드/설치 흐름으로 유지됩니다.

세부 정보: [Plugin](/ko/tools/plugin)

## DM 접근 모델: 페어링, 허용 목록, 개방, 비활성화

현재 DM 가능 채널은 모두 메시지가 처리되기 **전**에 수신 DM을 게이트하는 DM 정책(`dmPolicy` 또는 `*.dm.policy`)을 지원합니다.

- `pairing`(기본값): 알 수 없는 발신자는 짧은 페어링 코드를 받고, 승인될 때까지 봇은 해당 메시지를 무시합니다. 코드는 1시간 후 만료됩니다. 반복 DM은 새 요청이 생성될 때까지 코드를 다시 보내지 않습니다. 대기 중인 요청은 기본적으로 **채널당 3개**로 제한됩니다.
- `allowlist`: 알 수 없는 발신자는 차단됩니다(페어링 핸드셰이크 없음).
- `open`: 누구나 DM할 수 있도록 허용합니다(공개). 채널 허용 목록에 `"*"`가 포함되어야 **합니다**(명시적 옵트인).
- `disabled`: 수신 DM을 완전히 무시합니다.

CLI로 승인:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

세부 정보 + 디스크의 파일: [Pairing](/ko/channels/pairing)

## DM 세션 격리(다중 사용자 모드)

기본적으로 OpenClaw는 기기와 채널 전반에서 어시스턴트의 연속성을 유지하기 위해 **모든 DM을 기본 세션으로 라우팅**합니다. **여러 사람**이 봇에게 DM할 수 있다면(open DM 또는 다중 사용자 허용 목록), DM 세션 격리를 고려하세요.

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

이렇게 하면 그룹 채팅은 격리된 상태로 유지하면서 사용자 간 컨텍스트 누출을 방지합니다.

이는 메시징 컨텍스트 경계이지, 호스트 관리자 경계가 아닙니다. 사용자가 서로 적대적이고 동일한 Gateway 호스트/config를 공유한다면, 신뢰 경계별로 별도의 Gateway를 실행하세요.

### 보안 DM 모드(권장)

위 스니펫을 **보안 DM 모드**로 취급하세요.

- 기본값: `session.dmScope: "main"`(연속성을 위해 모든 DM이 하나의 세션을 공유).
- 로컬 CLI 온보딩 기본값: 설정되지 않은 경우 `session.dmScope: "per-channel-peer"`를 씁니다(기존 명시적 값은 유지).
- 보안 DM 모드: `session.dmScope: "per-channel-peer"`(각 채널+발신자 쌍이 격리된 DM 컨텍스트를 얻음).
- 교차 채널 피어 격리: `session.dmScope: "per-peer"`(각 발신자가 동일 유형의 모든 채널에서 하나의 세션을 얻음).

동일 채널에서 여러 계정을 실행하는 경우 대신 `per-account-channel-peer`를 사용하세요. 동일 인물이 여러 채널에서 연락하는 경우 `session.identityLinks`를 사용해 해당 DM 세션을 하나의 정식 신원으로 합치세요. [Session Management](/ko/concepts/session) 및 [Configuration](/ko/gateway/configuration)을 참조하세요.

## DM 및 그룹의 허용 목록

OpenClaw에는 “누가 나를 트리거할 수 있는가?”에 대한 두 개의 별도 계층이 있습니다.

- **DM 허용 목록**(`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; 레거시: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): 다이렉트 메시지에서 봇과 대화할 수 있는 사람입니다.
  - `dmPolicy="pairing"`일 때 승인은 `~/.openclaw/credentials/` 아래의 계정 범위 페어링 허용 목록 저장소(기본 계정은 `<channel>-allowFrom.json`, 기본값이 아닌 계정은 `<channel>-<accountId>-allowFrom.json`)에 기록되고, config 허용 목록과 병합됩니다.
- **그룹 허용 목록**(채널별): 봇이 메시지를 수락할 그룹/채널/길드입니다.
  - 일반적인 패턴:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: `requireMention` 같은 그룹별 기본값입니다. 설정되면 그룹 허용 목록으로도 작동합니다(모두 허용 동작을 유지하려면 `"*"` 포함).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: 그룹 세션 _내부_에서 봇을 트리거할 수 있는 사람을 제한합니다(WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: 표면별 허용 목록 + 멘션 기본값.
  - 그룹 검사는 다음 순서로 실행됩니다. `groupPolicy`/그룹 허용 목록 먼저, 멘션/답장 활성화가 두 번째입니다.
  - 봇 메시지에 답장하는 것(암시적 멘션)은 `groupAllowFrom` 같은 발신자 허용 목록을 우회하지 **않습니다**.
  - **보안 참고:** `dmPolicy="open"` 및 `groupPolicy="open"`을 최후의 수단 설정으로 취급하세요. 거의 사용하지 않아야 하며, 방의 모든 구성원을 완전히 신뢰하지 않는 한 페어링 + 허용 목록을 선호하세요.

세부 정보: [Configuration](/ko/gateway/configuration) 및 [Groups](/ko/channels/groups)

## 프롬프트 인젝션(무엇이며, 왜 중요한가)

프롬프트 인젝션은 공격자가 모델을 조작해 안전하지 않은 일을 하도록 만드는 메시지를 작성하는 경우입니다(“지침을 무시해”, “파일 시스템을 덤프해”, “이 링크를 따라가서 명령을 실행해” 등).

강력한 시스템 프롬프트가 있어도 **프롬프트 인젝션은 해결되지 않았습니다**. 시스템 프롬프트 가드레일은 부드러운 지침일 뿐이며, 강제 집행은 도구 정책, exec 승인, 샌드박싱, 채널 허용 목록에서 나옵니다(그리고 운영자는 설계상 이를 비활성화할 수 있습니다). 실제로 도움이 되는 것:

- 인바운드 DM은 엄격히 제한하세요(페어링/허용 목록).
- 그룹에서는 멘션 게이팅을 선호하고, 공개 방에서는 “상시 실행” 봇을 피하세요.
- 링크, 첨부 파일, 붙여넣은 지침은 기본적으로 적대적인 것으로 취급하세요.
- 민감한 도구 실행은 샌드박스에서 실행하고, 에이전트가 접근 가능한 파일시스템에 비밀 정보를 두지 마세요.
- 참고: 샌드박싱은 옵트인입니다. 샌드박스 모드가 꺼져 있으면 암시적 `host=auto`는 gateway 호스트로 해석됩니다. 명시적 `host=sandbox`는 사용 가능한 샌드박스 런타임이 없으므로 여전히 안전하게 실패합니다. 이 동작을 설정에서 명시하려면 `host=gateway`를 설정하세요.
- 고위험 도구(`exec`, `browser`, `web_fetch`, `web_search`)는 신뢰할 수 있는 에이전트 또는 명시적 허용 목록으로 제한하세요.
- 인터프리터(`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`)를 허용 목록에 추가하는 경우, 인라인 평가 형식에도 여전히 명시적 승인이 필요하도록 `tools.exec.strictInlineEval`을 활성화하세요.
- 셸 승인 분석은 **따옴표 없는 heredoc** 내부의 POSIX 매개변수 확장 형식(`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`)도 거부하므로, 허용 목록에 포함된 heredoc 본문이 일반 텍스트인 것처럼 허용 목록 검토를 우회해 셸 확장을 몰래 수행할 수 없습니다. 리터럴 본문 의미를 선택하려면 heredoc 종료자를 따옴표로 감싸세요(예: `<<'EOF'`). 변수가 확장될 수 있는 따옴표 없는 heredoc은 거부됩니다.
- **모델 선택은 중요합니다:** 오래되었거나 작거나 레거시인 모델은 프롬프트 인젝션과 도구 오용에 대한 견고성이 훨씬 낮습니다. 도구가 활성화된 에이전트에는 사용 가능한 가장 강력한 최신 세대의 지침 강화 모델을 사용하세요.

신뢰할 수 없는 것으로 취급해야 할 위험 신호:

- “이 파일/URL을 읽고 그 내용 그대로 수행해.”
- “시스템 프롬프트나 안전 규칙을 무시해.”
- “숨겨진 지침이나 도구 출력을 공개해.”
- “~/.openclaw 또는 로그의 전체 내용을 붙여넣어.”

## 외부 콘텐츠 특수 토큰 정리

OpenClaw는 모델에 도달하기 전에 래핑된 외부 콘텐츠와 메타데이터에서 일반적인 자체 호스팅 LLM 채팅 템플릿 특수 토큰 리터럴을 제거합니다. 적용되는 마커 계열에는 Qwen/ChatML, Llama, Gemma, Mistral, Phi, GPT-OSS 역할/턴 토큰이 포함됩니다.

이유:

- 자체 호스팅 모델을 앞단에 둔 OpenAI 호환 백엔드는 사용자 텍스트에 나타나는 특수 토큰을 마스킹하지 않고 그대로 보존하는 경우가 있습니다. 인바운드 외부 콘텐츠(가져온 페이지, 이메일 본문, 파일 내용 도구 출력)에 쓸 수 있는 공격자는 그렇지 않으면 합성 `assistant` 또는 `system` 역할 경계를 주입해 래핑된 콘텐츠의 보호 장치를 벗어날 수 있습니다.
- 정리는 외부 콘텐츠 래핑 계층에서 이루어지므로, Provider별로 처리하는 대신 가져오기/읽기 도구와 인바운드 채널 콘텐츠 전반에 균일하게 적용됩니다.
- 아웃바운드 모델 응답에는 이미 사용자에게 보이는 최종 채널 전달 경계에서 유출된 `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` 및 유사한 내부 런타임 스캐폴딩을 제거하는 별도 정리기가 있습니다. 외부 콘텐츠 정리기는 그 인바운드 대응물입니다.

이는 이 페이지의 다른 강화 조치인 `dmPolicy`, 허용 목록, exec 승인, 샌드박싱, `contextVisibility`를 대체하지 않습니다. 이러한 조치가 여전히 핵심 역할을 합니다. 이는 특수 토큰을 그대로 포함한 사용자 텍스트를 전달하는 자체 호스팅 스택에 대한 특정 토크나이저 계층 우회를 차단합니다.

## 안전하지 않은 외부 콘텐츠 우회 플래그

OpenClaw에는 외부 콘텐츠 안전 래핑을 비활성화하는 명시적 우회 플래그가 포함되어 있습니다.

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron 페이로드 필드 `allowUnsafeExternalContent`

지침:

- 프로덕션에서는 이를 설정하지 않거나 false로 유지하세요.
- 범위가 매우 제한된 디버깅을 위해서만 일시적으로 활성화하세요.
- 활성화하는 경우 해당 에이전트를 격리하세요(샌드박스 + 최소 도구 + 전용 세션 네임스페이스).

Hooks 위험 참고:

- Hook 페이로드는 전달이 사용자가 제어하는 시스템에서 오더라도 신뢰할 수 없는 콘텐츠입니다(메일/문서/웹 콘텐츠는 프롬프트 인젝션을 포함할 수 있음).
- 약한 모델 계층은 이 위험을 증가시킵니다. Hook 기반 자동화에는 강력한 최신 모델 계층을 선호하고 도구 정책을 엄격하게 유지하세요(`tools.profile: "messaging"` 또는 더 엄격하게). 가능한 경우 샌드박싱도 사용하세요.

### 프롬프트 인젝션에는 공개 DM이 필요하지 않습니다

**사용자만** 봇에 메시지를 보낼 수 있더라도, 봇이 읽는 모든 **신뢰할 수 없는 콘텐츠**(웹 검색/가져오기 결과, 브라우저 페이지,
이메일, 문서, 첨부 파일, 붙여넣은 로그/코드)를 통해 프롬프트 인젝션이 여전히 발생할 수 있습니다. 즉, 발신자만
유일한 위협 표면이 아니며, **콘텐츠 자체**가 적대적 지침을 포함할 수 있습니다.

도구가 활성화된 경우 일반적인 위험은 컨텍스트 유출 또는
도구 호출 트리거입니다. 폭발 반경을 줄이려면:

- 읽기 전용 또는 도구 비활성 **리더 에이전트**를 사용해 신뢰할 수 없는 콘텐츠를 요약한 다음,
  그 요약을 주 에이전트에 전달하세요.
- 필요한 경우가 아니라면 도구 활성 에이전트에서 `web_search` / `web_fetch` / `browser`를 꺼두세요.
- OpenResponses URL 입력(`input_file` / `input_image`)의 경우,
  `gateway.http.endpoints.responses.files.urlAllowlist` 및
  `gateway.http.endpoints.responses.images.urlAllowlist`를 엄격하게 설정하고 `maxUrlParts`를 낮게 유지하세요.
  빈 허용 목록은 설정되지 않은 것으로 취급됩니다. URL 가져오기를 완전히 비활성화하려면 `files.allowUrl: false` / `images.allowUrl: false`를 사용하세요.
- OpenResponses 파일 입력의 경우 디코딩된 `input_file` 텍스트는 여전히
  **신뢰할 수 없는 외부 콘텐츠**로 주입됩니다. Gateway가 로컬에서 디코딩했다는 이유만으로
  파일 텍스트가 신뢰할 수 있다고 가정하지 마세요. 이 경로는 더 긴 `SECURITY NOTICE:` 배너를 생략하더라도, 주입된 블록에는 여전히 명시적인
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 경계 마커와 `Source: External`
  메타데이터가 포함됩니다.
- 미디어 이해가 첨부 문서에서 텍스트를 추출해 미디어 프롬프트에 추가하기 전에도 동일한 마커 기반 래핑이 적용됩니다.
- 신뢰할 수 없는 입력을 다루는 모든 에이전트에 대해 샌드박싱과 엄격한 도구 허용 목록을 활성화하세요.
- 비밀 정보는 프롬프트에서 제외하고, 대신 gateway 호스트의 env/config를 통해 전달하세요.

### 자체 호스팅 LLM 백엔드

vLLM, SGLang, TGI, LM Studio 또는 사용자 지정 Hugging Face 토크나이저 스택과 같은 OpenAI 호환 자체 호스팅 백엔드는
채팅 템플릿 특수 토큰 처리 방식이 호스팅 Provider와 다를 수 있습니다. 백엔드가 사용자 콘텐츠 내부의
`<|im_start|>`, `<|start_header_id|>`, `<start_of_turn>` 같은 리터럴 문자열을
구조적 채팅 템플릿 토큰으로 토크나이즈하면, 신뢰할 수 없는 텍스트가 토크나이저 계층에서
역할 경계를 위조하려고 시도할 수 있습니다.

OpenClaw는 모델로 보내기 전에 래핑된 외부 콘텐츠에서 일반적인 모델 계열 특수 토큰 리터럴을 제거합니다. 외부 콘텐츠 래핑을
활성화된 상태로 유지하고, 사용 가능한 경우 사용자 제공 콘텐츠의 특수 토큰을 분리하거나 이스케이프하는 백엔드 설정을 선호하세요. OpenAI
및 Anthropic 같은 호스팅 Provider는 이미 자체 요청 측 정리를 적용합니다.

### 모델 강도(보안 참고)

프롬프트 인젝션 저항성은 모델 계층 전반에서 **균일하지 않습니다**. 더 작고 저렴한 모델은 일반적으로 도구 오용과 지침 탈취에 더 취약하며, 특히 적대적 프롬프트에서 그렇습니다.

<Warning>
도구가 활성화된 에이전트 또는 신뢰할 수 없는 콘텐츠를 읽는 에이전트의 경우, 오래되었거나 작은 모델의 프롬프트 인젝션 위험은 종종 너무 높습니다. 이러한 워크로드를 약한 모델 계층에서 실행하지 마세요.
</Warning>

권장 사항:

- 도구를 실행하거나 파일/네트워크에 접근할 수 있는 모든 봇에는 **최신 세대의 최상위 계층 모델**을 사용하세요.
- 도구가 활성화된 에이전트 또는 신뢰할 수 없는 인박스에는 **오래되었거나 약하거나 작은 계층을 사용하지 마세요**. 프롬프트 인젝션 위험이 너무 높습니다.
- 더 작은 모델을 반드시 사용해야 한다면 **폭발 반경을 줄이세요**(읽기 전용 도구, 강력한 샌드박싱, 최소 파일시스템 접근, 엄격한 허용 목록).
- 작은 모델을 실행할 때는 **모든 세션에 샌드박싱을 활성화**하고 입력이 엄격히 통제되지 않는 한 **web_search/web_fetch/browser를 비활성화**하세요.
- 신뢰할 수 있는 입력만 있고 도구가 없는 채팅 전용 개인 비서에는 보통 더 작은 모델도 괜찮습니다.

## 그룹에서의 추론 및 상세 출력

`/reasoning`, `/verbose`, `/trace`는 공개 채널에 의도되지 않았던 내부 추론, 도구
출력 또는 Plugin 진단을 노출할 수 있습니다. 그룹 설정에서는 이를 **디버그
전용**으로 취급하고 명시적으로 필요한 경우가 아니면 꺼두세요.

지침:

- 공개 방에서는 `/reasoning`, `/verbose`, `/trace`를 비활성화 상태로 유지하세요.
- 활성화한다면 신뢰할 수 있는 DM 또는 엄격히 통제된 방에서만 사용하세요.
- 기억하세요: verbose 및 trace 출력에는 도구 인수, URL, Plugin 진단, 모델이 본 데이터가 포함될 수 있습니다.

## 구성 강화 예시

### 파일 권한

gateway 호스트에서 config + 상태를 비공개로 유지하세요.

- `~/.openclaw/openclaw.json`: `600`(사용자 읽기/쓰기 전용)
- `~/.openclaw`: `700`(사용자 전용)

`openclaw doctor`는 이러한 권한을 경고하고 강화할 수 있도록 제안할 수 있습니다.

### 네트워크 노출(bind, 포트, 방화벽)

Gateway는 단일 포트에서 **WebSocket + HTTP**를 멀티플렉싱합니다.

- 기본값: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

이 HTTP 표면에는 Control UI와 캔버스 호스트가 포함됩니다.

- Control UI(SPA assets)(기본 base path `/`)
- 캔버스 호스트: `/__openclaw__/canvas/` 및 `/__openclaw__/a2ui/`(임의의 HTML/JS; 신뢰할 수 없는 콘텐츠로 취급)

일반 브라우저에서 캔버스 콘텐츠를 로드하는 경우, 다른 신뢰할 수 없는 웹 페이지처럼 취급하세요.

- 캔버스 호스트를 신뢰할 수 없는 네트워크/사용자에게 노출하지 마세요.
- 영향을 완전히 이해하지 못했다면 캔버스 콘텐츠가 권한 있는 웹 표면과 같은 origin을 공유하게 하지 마세요.

Bind 모드는 Gateway가 수신하는 위치를 제어합니다.

- `gateway.bind: "loopback"`(기본값): 로컬 클라이언트만 연결할 수 있습니다.
- Non-loopback binds(`"lan"`, `"tailnet"`, `"custom"`)는 공격 표면을 확장합니다. Gateway 인증(공유 토큰/비밀번호 또는 올바르게 구성된 신뢰 프록시)과 실제 방화벽이 있을 때만 사용하세요.

경험칙:

- LAN bind보다 Tailscale Serve를 선호하세요(Serve는 Gateway를 loopback에 유지하고 Tailscale이 접근을 처리합니다).
- LAN에 반드시 bind해야 한다면, 소스 IP의 엄격한 허용 목록으로 포트를 방화벽 처리하세요. 광범위하게 포트 포워딩하지 마세요.
- 인증되지 않은 Gateway를 `0.0.0.0`에 절대 노출하지 마세요.

### UFW를 사용한 Docker 포트 게시

VPS에서 Docker로 OpenClaw를 실행하는 경우, 게시된 컨테이너 포트
(`-p HOST:CONTAINER` 또는 Compose `ports:`)는 호스트 `INPUT` 규칙뿐 아니라 Docker의 포워딩
체인을 통해 라우팅된다는 점을 기억하세요.

Docker 트래픽을 방화벽 정책과 일치시키려면
`DOCKER-USER`에서 규칙을 강제하세요(이 체인은 Docker 자체 accept 규칙보다 먼저 평가됩니다).
많은 최신 배포판에서 `iptables`/`ip6tables`는 `iptables-nft` 프론트엔드를 사용하며
여전히 이러한 규칙을 nftables 백엔드에 적용합니다.

최소 허용 목록 예시(IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

IPv6에는 별도의 테이블이 있습니다. Docker IPv6가 활성화된 경우 `/etc/ufw/after6.rules`에
일치하는 정책을 추가하세요.

문서 스니펫에서 `eth0` 같은 인터페이스 이름을 하드코딩하지 마세요. 인터페이스 이름은
VPS 이미지마다 다르며(`ens3`, `enp*` 등), 불일치하면 실수로
거부 규칙을 건너뛸 수 있습니다.

다시 로드한 후 빠른 검증:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

예상되는 외부 포트는 의도적으로 노출한 것뿐이어야 합니다(대부분의
설정에서는 SSH + 리버스 프록시 포트).

### mDNS/Bonjour 검색

Gateway는 로컬 장치 검색을 위해 mDNS(포트 5353의 `_openclaw-gw._tcp`)를 통해 자신의 존재를 브로드캐스트합니다. 전체 모드에서는 운영 세부 정보를 노출할 수 있는 TXT 레코드가 포함됩니다:

- `cliPath`: CLI 바이너리의 전체 파일 시스템 경로(사용자 이름과 설치 위치 노출)
- `sshPort`: 호스트에서 SSH를 사용할 수 있음을 알림
- `displayName`, `lanHost`: 호스트 이름 정보

**운영 보안 고려 사항:** 인프라 세부 정보를 브로드캐스트하면 로컬 네트워크의 누구든 정찰하기가 더 쉬워집니다. 파일 시스템 경로와 SSH 사용 가능 여부처럼 "무해해" 보이는 정보도 공격자가 환경을 파악하는 데 도움이 됩니다.

**권장 사항:**

1. **최소 모드**(기본값, 노출된 Gateway에 권장): mDNS 브로드캐스트에서 민감한 필드를 생략합니다.

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. 로컬 장치 검색이 필요하지 않다면 **완전히 비활성화**합니다.

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **전체 모드**(명시적 선택): TXT 레코드에 `cliPath` + `sshPort`를 포함합니다.

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **환경 변수**(대안): 구성 변경 없이 mDNS를 비활성화하려면 `OPENCLAW_DISABLE_BONJOUR=1`을 설정합니다.

최소 모드에서 Gateway는 여전히 장치 검색에 충분한 정보(`role`, `gatewayPort`, `transport`)를 브로드캐스트하지만 `cliPath`와 `sshPort`는 생략합니다. CLI 경로 정보가 필요한 앱은 대신 인증된 WebSocket 연결을 통해 가져올 수 있습니다.

### Gateway WebSocket 잠그기(로컬 인증)

Gateway 인증은 **기본적으로 필수**입니다. 유효한 Gateway 인증 경로가 구성되어 있지 않으면
Gateway는 WebSocket 연결을 거부합니다(닫힌 상태로 실패).

온보딩은 기본적으로 토큰을 생성하므로(루프백의 경우에도)
로컬 클라이언트는 인증해야 합니다.

**모든** WS 클라이언트가 인증해야 하도록 토큰을 설정합니다.

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor가 대신 생성할 수 있습니다: `openclaw doctor --generate-gateway-token`.

<Note>
`gateway.remote.token` 및 `gateway.remote.password`는 클라이언트 자격 증명 소스입니다. 이 값만으로는 로컬 WS 접근을 보호하지 **않습니다**. 로컬 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 대체 수단으로 사용할 수 있습니다. `gateway.auth.token` 또는 `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 확인되지 않으면, 확인은 닫힌 상태로 실패합니다(원격 대체 수단이 이를 가리지 않음).
</Note>
선택 사항: `wss://`를 사용할 때 `gateway.remote.tlsFingerprint`로 원격 TLS를 고정합니다.
평문 `ws://`는 기본적으로 루프백 전용입니다. 신뢰할 수 있는 사설 네트워크
경로의 경우, 비상 해제 수단으로 클라이언트 프로세스에서
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정합니다. 이는 의도적으로 프로세스 환경 전용이며,
`openclaw.json` 구성 키가 아닙니다.
모바일 페어링 및 Android 수동 또는 스캔된 Gateway 경로는 더 엄격합니다.
평문은 루프백에서는 허용되지만, 사설 LAN, 링크 로컬, `.local`, 점이 없는 호스트 이름은
신뢰할 수 있는 사설 네트워크 평문 경로를 명시적으로 선택하지 않는 한 TLS를 사용해야 합니다.

로컬 장치 페어링:

- 같은 호스트 클라이언트가 원활히 동작하도록 직접 local loopback 연결의 장치 페어링은 자동 승인됩니다.
- OpenClaw에는 신뢰할 수 있는 공유 비밀 도우미 흐름을 위한 좁은 백엔드/컨테이너 로컬 자체 연결 경로도 있습니다.
- 같은 호스트 tailnet 바인드를 포함한 tailnet 및 LAN 연결은 페어링에서 원격으로 취급되며 여전히 승인이 필요합니다.
- 루프백 요청의 전달된 헤더 증거는 루프백 지역성을 무효화합니다. 메타데이터 업그레이드 자동 승인은 좁은 범위로 제한됩니다. 두 규칙은 [Gateway 페어링](/ko/gateway/pairing)을 참조하세요.

인증 모드:

- `gateway.auth.mode: "token"`: 공유 bearer 토큰(대부분의 설정에 권장).
- `gateway.auth.mode: "password"`: 비밀번호 인증(환경 변수 `OPENCLAW_GATEWAY_PASSWORD`로 설정하는 것을 권장).
- `gateway.auth.mode: "trusted-proxy"`: ID 인식 리버스 프록시가 사용자를 인증하고 헤더를 통해 ID를 전달하도록 신뢰합니다([신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth) 참조).

회전 체크리스트(토큰/비밀번호):

1. 새 비밀을 생성/설정합니다(`gateway.auth.token` 또는 `OPENCLAW_GATEWAY_PASSWORD`).
2. Gateway를 다시 시작합니다(또는 macOS 앱이 Gateway를 감독하는 경우 macOS 앱을 다시 시작).
3. 모든 원격 클라이언트를 업데이트합니다(Gateway를 호출하는 머신의 `gateway.remote.token` / `.password`).
4. 이전 자격 증명으로 더 이상 연결할 수 없는지 확인합니다.

### Tailscale Serve ID 헤더

`gateway.auth.allowTailscale`이 `true`이면(Serve의 기본값) OpenClaw는
Control UI/WebSocket 인증에 Tailscale Serve ID 헤더(`tailscale-user-login`)를
허용합니다. OpenClaw는 로컬 Tailscale 데몬(`tailscale whois`)을 통해
`x-forwarded-for` 주소를 확인하고 이를 헤더와 일치시켜 ID를 검증합니다.
이는 루프백에 도달하고 Tailscale이 삽입한 `x-forwarded-for`,
`x-forwarded-proto`, `x-forwarded-host`를 포함하는 요청에만 트리거됩니다.
이 비동기 ID 확인 경로에서는 동일한 `{scope, ip}`에 대한 실패 시도가
리미터가 실패를 기록하기 전에 직렬화됩니다. 따라서 한 Serve 클라이언트의
동시 잘못된 재시도는 두 개의 단순 불일치로 경쟁하며 통과하는 대신
두 번째 시도를 즉시 잠글 수 있습니다.
HTTP API 엔드포인트(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는
Tailscale ID 헤더 인증을 사용하지 **않습니다**. 이들은 여전히 Gateway의
구성된 HTTP 인증 모드를 따릅니다.

중요한 경계 참고:

- Gateway HTTP bearer 인증은 사실상 전부 아니면 전무인 운영자 접근입니다.
- `/v1/chat/completions`, `/v1/responses` 또는 `/api/channels/*`를 호출할 수 있는 자격 증명은 해당 Gateway의 전체 접근 운영자 비밀로 취급하세요.
- OpenAI 호환 HTTP 표면에서 공유 비밀 bearer 인증은 전체 기본 운영자 범위(`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`)와 에이전트 턴의 소유자 의미 체계를 복원합니다. 더 좁은 `x-openclaw-scopes` 값은 이 공유 비밀 경로를 축소하지 않습니다.
- HTTP의 요청별 범위 의미 체계는 요청이 신뢰할 수 있는 프록시 인증 또는 사설 ingress의 `gateway.auth.mode="none"`처럼 ID를 포함하는 모드에서 올 때만 적용됩니다.
- 이러한 ID 포함 모드에서 `x-openclaw-scopes`를 생략하면 일반 운영자 기본 범위 집합으로 대체됩니다. 더 좁은 범위 집합을 원하면 헤더를 명시적으로 보내세요.
- `/tools/invoke`도 동일한 공유 비밀 규칙을 따릅니다. 토큰/비밀번호 bearer 인증은 여기에서도 전체 운영자 접근으로 취급되며, ID 포함 모드는 여전히 선언된 범위를 존중합니다.
- 이러한 자격 증명을 신뢰할 수 없는 호출자와 공유하지 마세요. 신뢰 경계마다 별도의 Gateway를 사용하는 것이 좋습니다.

**신뢰 가정:** 토큰 없는 Serve 인증은 Gateway 호스트를 신뢰한다고 가정합니다.
이를 적대적인 같은 호스트 프로세스에 대한 보호로 취급하지 마세요. 신뢰할 수 없는
로컬 코드가 Gateway 호스트에서 실행될 수 있다면 `gateway.auth.allowTailscale`을
비활성화하고 `gateway.auth.mode: "token"` 또는 `"password"`로 명시적 공유 비밀 인증을
요구하세요.

**보안 규칙:** 자체 리버스 프록시에서 이러한 헤더를 전달하지 마세요. Gateway 앞에서
TLS를 종료하거나 프록시를 사용하는 경우 `gateway.auth.allowTailscale`을 비활성화하고
대신 공유 비밀 인증(`gateway.auth.mode: "token"` 또는 `"password"`)이나
[신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 사용하세요.

신뢰할 수 있는 프록시:

- Gateway 앞에서 TLS를 종료하는 경우 `gateway.trustedProxies`를 프록시 IP로 설정합니다.
- OpenClaw는 해당 IP의 `x-forwarded-for`(또는 `x-real-ip`)를 신뢰하여 로컬 페어링 검사와 HTTP 인증/로컬 검사에 사용할 클라이언트 IP를 결정합니다.
- 프록시가 `x-forwarded-for`를 **덮어쓰고** Gateway 포트에 대한 직접 접근을 차단하는지 확인하세요.

[Tailscale](/ko/gateway/tailscale) 및 [웹 개요](/ko/web)를 참조하세요.

### Node 호스트를 통한 브라우저 제어(권장)

Gateway가 원격에 있지만 브라우저가 다른 머신에서 실행되는 경우, 브라우저 머신에서
**Node 호스트**를 실행하고 Gateway가 브라우저 작업을 프록시하도록 하세요([브라우저 도구](/ko/tools/browser) 참조).
Node 페어링은 관리자 접근처럼 취급하세요.

권장 패턴:

- Gateway와 Node 호스트를 동일한 tailnet(Tailscale)에 유지합니다.
- Node를 의도적으로 페어링합니다. 필요하지 않으면 브라우저 프록시 라우팅을 비활성화합니다.

피하세요:

- LAN 또는 공용 인터넷에 릴레이/제어 포트를 노출하는 것.
- 브라우저 제어 엔드포인트에 Tailscale Funnel을 사용하는 것(공개 노출).

### 디스크의 비밀

`~/.openclaw/`(또는 `$OPENCLAW_STATE_DIR/`) 아래의 모든 항목에는 비밀 또는 비공개 데이터가 포함될 수 있다고 가정하세요.

- `openclaw.json`: 구성에는 토큰(Gateway, 원격 Gateway), 제공자 설정, 허용 목록이 포함될 수 있습니다.
- `credentials/**`: 채널 자격 증명(예: WhatsApp 자격 증명), 페어링 허용 목록, 레거시 OAuth 가져오기.
- `agents/<agentId>/agent/auth-profiles.json`: API 키, 토큰 프로필, OAuth 토큰, 선택적 `keyRef`/`tokenRef`.
- `secrets.json`(선택 사항): `file` SecretRef 제공자(`secrets.providers`)가 사용하는 파일 기반 비밀 페이로드.
- `agents/<agentId>/agent/auth.json`: 레거시 호환성 파일. 정적 `api_key` 항목은 발견되면 제거됩니다.
- `agents/<agentId>/sessions/**`: 비공개 메시지와 도구 출력을 포함할 수 있는 세션 transcript(`*.jsonl`) + 라우팅 메타데이터(`sessions.json`).
- 번들 Plugin 패키지: 설치된 Plugin(및 해당 `node_modules/`).
- `sandboxes/**`: 도구 sandbox 작업 영역. sandbox 내부에서 읽고/쓴 파일의 사본이 누적될 수 있습니다.

강화 팁:

- 권한을 엄격하게 유지하세요(디렉터리는 `700`, 파일은 `600`).
- Gateway 호스트에서 전체 디스크 암호화를 사용하세요.
- 호스트를 공유하는 경우 Gateway용 전용 OS 사용자 계정을 사용하는 것이 좋습니다.

### 작업 영역 `.env` 파일

OpenClaw는 에이전트와 도구를 위해 작업 영역 로컬 `.env` 파일을 로드하지만, 해당 파일이 Gateway 런타임 제어를 조용히 재정의하도록 허용하지 않습니다.

- `OPENCLAW_*`로 시작하는 모든 키는 신뢰할 수 없는 작업 영역 `.env` 파일에서 차단됩니다.
- Matrix, Mattermost, IRC, Synology Chat의 채널 엔드포인트 설정도 작업 영역 `.env` 재정의에서 차단되므로, 복제된 작업 영역이 로컬 엔드포인트 구성을 통해 번들 connector 트래픽을 리디렉션할 수 없습니다. 엔드포인트 환경 키(예: `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`)는 작업 영역에서 로드된 `.env`가 아니라 Gateway 프로세스 환경 또는 `env.shellEnv`에서 와야 합니다.
- 차단은 닫힌 상태로 실패합니다. 향후 릴리스에 새 런타임 제어 변수가 추가되어도 체크인되었거나 공격자가 제공한 `.env`에서 상속될 수 없습니다. 해당 키는 무시되고 Gateway는 자체 값을 유지합니다.
- 신뢰할 수 있는 프로세스/OS 환경 변수(Gateway 자체 shell, launchd/systemd unit, 앱 번들)는 여전히 적용됩니다. 이는 `.env` 파일 로딩만 제한합니다.

이유: 작업 영역 `.env` 파일은 에이전트 코드 옆에 있는 경우가 많고, 실수로 커밋되거나 도구가 작성할 수 있습니다. 전체 `OPENCLAW_*` 접두사를 차단하면 나중에 새 `OPENCLAW_*` 플래그가 추가되어도 작업 영역 상태에서 조용히 상속되는 회귀가 절대 발생하지 않습니다.

### 로그와 transcript(수정 및 보존)

접근 제어가 올바르더라도 로그와 transcript는 민감한 정보를 유출할 수 있습니다.

- Gateway 로그에는 도구 요약, 오류, URL이 포함될 수 있습니다.
- 세션 transcript에는 붙여 넣은 비밀, 파일 내용, 명령 출력, 링크가 포함될 수 있습니다.

권장 사항:

- 로그 및 transcript 수정을 켜 둡니다(`logging.redactSensitive: "tools"`; 기본값).
- 환경에 맞는 사용자 지정 패턴을 `logging.redactPatterns`로 추가합니다(토큰, 호스트 이름, 내부 URL).
- 진단 정보를 공유할 때는 원시 로그보다 `openclaw status --all`(붙여 넣기 가능, 비밀 수정됨)을 선호하세요.
- 장기 보존이 필요하지 않으면 오래된 세션 transcript와 로그 파일을 정리하세요.

세부 정보: [로깅](/ko/gateway/logging)

### DM: 기본적으로 페어링

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 그룹: 모든 곳에서 멘션 필요

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

그룹 채팅에서는 명시적으로 멘션된 경우에만 응답합니다.

### 별도 번호(WhatsApp, Signal, Telegram)

전화번호 기반 채널의 경우, 개인 번호와는 별도의 전화번호에서 AI를 실행하는 것을 고려하세요:

- 개인 번호: 대화는 비공개로 유지됩니다
- 봇 번호: AI가 적절한 경계를 두고 이를 처리합니다

### 읽기 전용 모드(샌드박스 및 도구 사용)

다음을 조합해 읽기 전용 프로필을 만들 수 있습니다.

- `agents.defaults.sandbox.workspaceAccess: "ro"`(또는 워크스페이스 접근 없음은 `"none"`)
- `write`, `edit`, `apply_patch`, `exec`, `process` 등을 차단하는 도구 허용/거부 목록

추가 강화 옵션:

- `tools.exec.applyPatch.workspaceOnly: true`(기본값): 샌드박싱이 꺼져 있어도 `apply_patch`가 워크스페이스 디렉터리 밖에 쓰거나 삭제할 수 없도록 합니다. 의도적으로 `apply_patch`가 워크스페이스 밖의 파일을 건드리게 하려는 경우에만 `false`로 설정하세요.
- `tools.fs.workspaceOnly: true`(선택 사항): `read`/`write`/`edit`/`apply_patch` 경로와 네이티브 프롬프트 이미지 자동 로드 경로를 워크스페이스 디렉터리로 제한합니다(현재 절대 경로를 허용하고 있고 단일 안전장치를 원할 때 유용).
- 파일시스템 루트를 좁게 유지하세요. 에이전트 워크스페이스/샌드박스 워크스페이스에 홈 디렉터리처럼 넓은 루트는 피하세요. 넓은 루트는 민감한 로컬 파일(예: `~/.openclaw` 아래의 상태/설정)을 파일시스템 도구에 노출할 수 있습니다.

### 보안 기준선(복사/붙여넣기)

Gateway를 비공개로 유지하고, DM 페어링을 요구하며, 항상 켜져 있는 그룹 봇을 피하는 “안전한 기본값” 설정입니다.

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

도구 실행도 “기본적으로 더 안전하게” 만들고 싶다면, 소유자가 아닌 에이전트에 대해 샌드박스와 위험한 도구 거부 설정을 추가하세요(아래 “에이전트별 접근 프로필” 예시 참고).

채팅 기반 에이전트 턴의 내장 기준선: 소유자가 아닌 보낸 사람은 `cron` 또는 `gateway` 도구를 사용할 수 없습니다.

## 샌드박싱(권장)

전용 문서: [샌드박싱](/ko/gateway/sandboxing)

두 가지 상호 보완적인 접근 방식:

- **전체 Gateway를 Docker에서 실행**(컨테이너 경계): [Docker](/ko/install/docker)
- **도구 샌드박스**(`agents.defaults.sandbox`, 호스트 gateway + 샌드박스로 격리된 도구, Docker가 기본 백엔드): [샌드박싱](/ko/gateway/sandboxing)

<Note>
에이전트 간 접근을 방지하려면 `agents.defaults.sandbox.scope`를 `"agent"`(기본값)로 유지하거나, 더 엄격한 세션별 격리를 위해 `"session"`으로 유지하세요. `scope: "shared"`는 단일 컨테이너 또는 워크스페이스를 사용합니다.
</Note>

샌드박스 내부의 에이전트 워크스페이스 접근도 고려하세요.

- `agents.defaults.sandbox.workspaceAccess: "none"`(기본값)은 에이전트 워크스페이스를 접근 불가로 유지합니다. 도구는 `~/.openclaw/sandboxes` 아래의 샌드박스 워크스페이스에서 실행됩니다.
- `agents.defaults.sandbox.workspaceAccess: "ro"`는 에이전트 워크스페이스를 `/agent`에 읽기 전용으로 마운트합니다(`write`/`edit`/`apply_patch` 비활성화).
- `agents.defaults.sandbox.workspaceAccess: "rw"`는 에이전트 워크스페이스를 `/workspace`에 읽기/쓰기 가능으로 마운트합니다.
- 추가 `sandbox.docker.binds`는 정규화 및 표준화된 소스 경로를 기준으로 검증됩니다. 부모 심볼릭 링크 트릭과 표준 홈 별칭도 `/etc`, `/var/run` 또는 OS 홈 아래의 자격 증명 디렉터리 같은 차단된 루트로 해석되면 안전하게 실패합니다.

<Warning>
`tools.elevated`는 샌드박스 밖에서 exec를 실행하는 전역 기준선 탈출구입니다. 유효 호스트는 기본적으로 `gateway`이며, exec 대상이 `node`로 설정된 경우에는 `node`입니다. `tools.elevated.allowFrom`을 엄격하게 유지하고 낯선 사용자에게 활성화하지 마세요. `agents.list[].tools.elevated`를 통해 에이전트별로 elevated를 추가 제한할 수 있습니다. [Elevated 모드](/ko/tools/elevated)를 참고하세요.
</Warning>

### 하위 에이전트 위임 안전장치

세션 도구를 허용한다면, 위임된 하위 에이전트 실행도 또 다른 경계 결정으로 취급하세요.

- 에이전트가 실제로 위임이 필요한 경우가 아니라면 `sessions_spawn`을 거부하세요.
- `agents.defaults.subagents.allowAgents`와 에이전트별 `agents.list[].subagents.allowAgents` 재정의를 알려진 안전한 대상 에이전트로 제한하세요.
- 샌드박스 상태를 유지해야 하는 워크플로에서는 `sessions_spawn`을 `sandbox: "require"`로 호출하세요(기본값은 `inherit`).
- `sandbox: "require"`는 대상 자식 런타임이 샌드박스 처리되지 않은 경우 빠르게 실패합니다.

## 브라우저 제어 위험

브라우저 제어를 활성화하면 모델이 실제 브라우저를 조작할 수 있게 됩니다.
해당 브라우저 프로필에 이미 로그인된 세션이 있으면 모델이
그 계정과 데이터에 접근할 수 있습니다. 브라우저 프로필을 **민감한 상태**로 취급하세요.

- 에이전트 전용 프로필(기본 `openclaw` 프로필)을 선호하세요.
- 에이전트를 개인 일상용 프로필에 연결하지 마세요.
- 샌드박스 처리된 에이전트는 신뢰하지 않는 한 호스트 브라우저 제어를 비활성화해 두세요.
- 독립 실행형 loopback 브라우저 제어 API는 공유 비밀 인증
  (Gateway 토큰 bearer 인증 또는 Gateway 비밀번호)만 인정합니다. trusted-proxy 또는 Tailscale Serve ID 헤더는 사용하지 않습니다.
- 브라우저 다운로드를 신뢰할 수 없는 입력으로 취급하세요. 격리된 다운로드 디렉터리를 선호하세요.
- 가능하다면 에이전트 프로필에서 브라우저 동기화/비밀번호 관리자를 비활성화하세요(피해 범위 감소).
- 원격 Gateway의 경우 “브라우저 제어”는 해당 프로필이 도달할 수 있는 모든 것에 대한 “운영자 접근”과 같다고 가정하세요.
- Gateway와 Node 호스트는 tailnet 전용으로 유지하고, 브라우저 제어 포트를 LAN 또는 공용 인터넷에 노출하지 마세요.
- 필요하지 않을 때는 브라우저 프록시 라우팅을 비활성화하세요(`gateway.nodes.browser.mode="off"`).
- Chrome MCP 기존 세션 모드는 “더 안전한” 것이 **아닙니다**. 해당 호스트 Chrome 프로필이 도달할 수 있는 모든 곳에서 당신처럼 동작할 수 있습니다.

### 브라우저 SSRF 정책(기본적으로 엄격)

OpenClaw의 브라우저 탐색 정책은 기본적으로 엄격합니다. 명시적으로 옵트인하지 않는 한 비공개/내부 대상은 계속 차단됩니다.

- 기본값: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`는 설정되지 않으므로, 브라우저 탐색은 비공개/내부/특수 용도 대상을 계속 차단합니다.
- 레거시 별칭: `browser.ssrfPolicy.allowPrivateNetwork`는 호환성을 위해 여전히 허용됩니다.
- 옵트인 모드: 비공개/내부/특수 용도 대상을 허용하려면 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`를 설정하세요.
- 엄격 모드에서는 명시적 예외에 `hostnameAllowlist`(`*.example.com` 같은 패턴)와 `allowedHostnames`(`localhost`처럼 차단된 이름을 포함한 정확한 호스트 예외)를 사용하세요.
- 리디렉션 기반 전환을 줄이기 위해 탐색 전에 요청을 검사하고, 탐색 후 최종 `http(s)` URL에서 최선의 방식으로 다시 검사합니다.

엄격 정책 예시:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## 에이전트별 접근 프로필(다중 에이전트)

다중 에이전트 라우팅을 사용하면 각 에이전트가 자체 샌드박스와 도구 정책을 가질 수 있습니다.
이를 사용해 에이전트별로 **전체 접근**, **읽기 전용**, 또는 **접근 없음**을 부여하세요.
전체 세부 정보와 우선순위 규칙은 [다중 에이전트 샌드박스 및 도구](/ko/tools/multi-agent-sandbox-tools)를 참고하세요.

일반적인 사용 사례:

- 개인 에이전트: 전체 접근, 샌드박스 없음
- 가족/업무 에이전트: 샌드박스 처리 + 읽기 전용 도구
- 공개 에이전트: 샌드박스 처리 + 파일시스템/셸 도구 없음

### 예시: 전체 접근(샌드박스 없음)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### 예시: 읽기 전용 도구 + 읽기 전용 워크스페이스

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### 예시: 파일시스템/셸 접근 없음(제공자 메시징 허용)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## 사고 대응

AI가 문제가 되는 행동을 한 경우:

### 격리

1. **중지:** macOS 앱(Gateway를 감독하는 경우)을 중지하거나 `openclaw gateway` 프로세스를 종료하세요.
2. **노출 차단:** 무슨 일이 있었는지 파악할 때까지 `gateway.bind: "loopback"`을 설정하거나 Tailscale Funnel/Serve를 비활성화하세요.
3. **접근 동결:** 위험한 DM/그룹을 `dmPolicy: "disabled"`로 전환하거나 멘션을 요구하도록 하고, `"*"` 전체 허용 항목이 있었다면 제거하세요.

### 순환(비밀이 유출된 경우 침해로 간주)

1. Gateway 인증(`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`)을 순환하고 재시작하세요.
2. Gateway를 호출할 수 있는 모든 머신에서 원격 클라이언트 비밀(`gateway.remote.token` / `.password`)을 순환하세요.
3. 제공자/API 자격 증명(WhatsApp 자격 증명, Slack/Discord 토큰, `auth-profiles.json`의 모델/API 키, 사용 중인 경우 암호화된 비밀 페이로드 값)을 순환하세요.

### 감사

1. Gateway 로그를 확인하세요: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`(또는 `logging.file`).
2. 관련 transcript를 검토하세요: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. 최근 설정 변경을 검토하세요(접근을 넓혔을 수 있는 모든 것: `gateway.bind`, `gateway.auth`, DM/그룹 정책, `tools.elevated`, Plugin 변경).
4. `openclaw security audit --deep`을 다시 실행하고 치명적 발견 사항이 해결되었는지 확인하세요.

### 보고서용 수집

- 타임스탬프, gateway 호스트 OS + OpenClaw 버전
- 세션 transcript + 짧은 로그 끝부분(민감 정보 제거 후)
- 공격자가 보낸 내용 + 에이전트가 한 일
- Gateway가 loopback을 넘어 노출되었는지 여부(LAN/Tailscale Funnel/Serve)

## detect-secrets를 사용한 비밀 스캔

CI는 `secrets` 작업에서 `detect-secrets` pre-commit 훅을 실행합니다.
`main`으로의 푸시는 항상 전체 파일 스캔을 실행합니다. Pull request는 베이스 커밋을 사용할 수 있으면 변경 파일
빠른 경로를 사용하고, 그렇지 않으면 전체 파일 스캔으로 폴백합니다.
실패한다면 기준선에 아직 없는 새 후보가 있다는 뜻입니다.

### CI가 실패하는 경우

1. 로컬에서 재현하세요.

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. 도구를 이해하세요.
   - pre-commit의 `detect-secrets`는 저장소의
     기준선과 제외 항목을 사용해 `detect-secrets-hook`을 실행합니다.
   - `detect-secrets audit`은 각 기준선 항목을 실제 또는 false positive로 표시하는 대화형 검토를 엽니다.
3. 실제 비밀의 경우: 순환/제거한 다음 스캔을 다시 실행해 기준선을 업데이트하세요.
4. false positive의 경우: 대화형 감사를 실행하고 false로 표시하세요.

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 새 제외 항목이 필요하면 `.detect-secrets.cfg`에 추가하고 일치하는 `--exclude-files` / `--exclude-lines` 플래그로
   기준선을 다시 생성하세요(설정 파일은 참조용일 뿐이며, detect-secrets가 자동으로 읽지 않습니다).

업데이트된 `.secrets.baseline`이 의도한 상태를 반영하면 커밋하세요.

## 보안 문제 보고

OpenClaw에서 취약점을 발견했나요? 책임감 있게 보고해 주세요.

1. 이메일: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 수정될 때까지 공개적으로 게시하지 마세요
3. 크레딧을 드리겠습니다(익명을 선호하지 않는 경우)
