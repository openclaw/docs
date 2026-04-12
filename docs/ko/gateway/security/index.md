---
read_when:
    - 접근 권한이나 자동화를 확장하는 기능 추가하기
summary: 셸 접근 권한이 있는 AI Gateway를 실행할 때의 보안 고려 사항 및 위협 모델
title: 보안
x-i18n:
    generated_at: "2026-04-12T23:28:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f3ef693813b696be2e24bcc333c8ee177fa56c3cb06c5fac12a0bd220a29917
    source_path: gateway/security/index.md
    workflow: 15
---

# 보안

<Warning>
**개인 비서 신뢰 모델:** 이 가이드는 Gateway당 하나의 신뢰된 운영자 경계(단일 사용자/개인 비서 모델)를 가정합니다.
OpenClaw는 여러 적대적 사용자가 하나의 agent/gateway를 공유하는 상황을 위한 적대적 멀티 테넌트 보안 경계가 **아닙니다**.
혼합 신뢰 또는 적대적 사용자 운영이 필요하다면, 신뢰 경계를 분리하세요(별도의 gateway + credentials, 가능하면 별도의 OS 사용자/호스트).
</Warning>

**이 페이지에서 다루는 내용:** [신뢰 모델](#scope-first-personal-assistant-security-model) | [빠른 감사](#quick-check-openclaw-security-audit) | [강화된 기본 기준](#hardened-baseline-in-60-seconds) | [DM 접근 모델](#dm-access-model-pairing-allowlist-open-disabled) | [구성 강화](#configuration-hardening-examples) | [사고 대응](#incident-response)

## 먼저 범위를 정하기: 개인 비서 보안 모델

OpenClaw의 보안 가이드는 **개인 비서** 배포를 가정합니다. 즉, 하나의 신뢰된 운영자 경계와 그 아래 잠재적으로 여러 agent가 있는 구조입니다.

- 지원되는 보안 자세: Gateway당 하나의 사용자/신뢰 경계(가능하면 경계당 하나의 OS 사용자/호스트/VPS).
- 지원되지 않는 보안 경계: 서로 신뢰하지 않거나 적대적인 사용자가 하나의 공유 gateway/agent를 사용하는 경우.
- 적대적 사용자 격리가 필요하다면 신뢰 경계별로 분리하세요(별도의 gateway + credentials, 가능하면 별도의 OS 사용자/호스트).
- 여러 신뢰하지 않는 사용자가 하나의 tool-enabled agent에 메시지를 보낼 수 있다면, 그들은 해당 agent에 위임된 동일한 도구 권한을 공유하는 것으로 간주해야 합니다.

이 페이지는 **그 모델 내에서의** 강화 방법을 설명합니다. 하나의 공유 gateway에서 적대적 멀티 테넌트 격리를 제공한다고 주장하지 않습니다.

## 빠른 점검: `openclaw security audit`

참고: [형식 검증(보안 모델)](/ko/security/formal-verification)

이 명령은 정기적으로 실행하세요(특히 config를 변경했거나 네트워크 표면을 노출한 뒤):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix`는 의도적으로 범위를 좁게 유지합니다. 일반적인 열린 그룹 정책을 allowlist로 바꾸고, `logging.redactSensitive: "tools"`를 복원하며, state/config/include-file 권한을 강화하고, Windows에서는 POSIX `chmod` 대신 Windows ACL 재설정을 사용합니다.

이 명령은 일반적인 위험 요소를 표시합니다(Gateway 인증 노출, 브라우저 제어 노출, 확장 권한 allowlist, 파일 시스템 권한, 느슨한 exec 승인, 열린 채널 도구 노출).

OpenClaw는 제품이면서 동시에 실험이기도 합니다. 즉, 최첨단 모델의 동작을 실제 메시징 표면과 실제 도구에 연결하고 있습니다. **“완벽하게 안전한” 설정은 없습니다.** 목표는 다음 사항을 의식적으로 결정하는 것입니다.

- 누가 봇과 대화할 수 있는지
- 봇이 어디에서 동작할 수 있는지
- 봇이 무엇에 접근할 수 있는지

동작하는 최소한의 접근 권한에서 시작한 다음, 확신이 생길수록 점진적으로 넓히세요.

### 배포 및 호스트 신뢰

OpenClaw는 호스트와 config 경계가 신뢰된다고 가정합니다.

- 누군가가 Gateway 호스트의 state/config(`openclaw.json`을 포함한 `~/.openclaw`)를 수정할 수 있다면, 그 사람은 신뢰된 운영자로 간주해야 합니다.
- 서로 신뢰하지 않거나 적대적인 운영자 여러 명을 위해 하나의 Gateway를 실행하는 것은 **권장되는 설정이 아닙니다**.
- 혼합 신뢰 팀의 경우, 별도의 gateways(또는 최소한 별도의 OS 사용자/호스트)로 신뢰 경계를 분리하세요.
- 권장 기본값: 머신/호스트(또는 VPS)당 사용자 하나, 그 사용자를 위한 gateway 하나, 그리고 그 gateway 안에 하나 이상의 agent.
- 하나의 Gateway 인스턴스 안에서 인증된 운영자 접근은 사용자별 테넌트 역할이 아니라 신뢰된 control-plane 역할입니다.
- 세션 식별자(`sessionKey`, session IDs, labels)는 라우팅 선택자이지 인증 토큰이 아닙니다.
- 여러 사람이 하나의 tool-enabled agent에 메시지를 보낼 수 있다면, 그들 각각은 동일한 권한 집합을 조종할 수 있습니다. 사용자별 세션/메모리 격리는 프라이버시에는 도움이 되지만, 공유 agent를 사용자별 호스트 권한 모델로 바꾸어 주지는 않습니다.

### 공유 Slack 워크스페이스: 실제 위험

“Slack의 모두가 봇에 메시지를 보낼 수 있다”면, 핵심 위험은 위임된 도구 권한입니다.

- 허용된 모든 발신자는 agent 정책 범위 안에서 tool call(`exec`, browser, network/file tools)을 유발할 수 있습니다.
- 한 발신자의 프롬프트/콘텐츠 주입은 공유 state, 장치, 출력에 영향을 주는 작업을 일으킬 수 있습니다.
- 하나의 공유 agent가 민감한 credentials/files를 가지고 있다면, 허용된 모든 발신자가 tool usage를 통해 잠재적으로 이를 유출하도록 유도할 수 있습니다.

팀 워크플로에는 최소한의 도구만 가진 별도의 agents/gateways를 사용하고, 개인 데이터 agent는 비공개로 유지하세요.

### 회사 공유 agent: 허용 가능한 패턴

이 패턴은 해당 agent를 사용하는 모든 사람이 동일한 신뢰 경계 안에 있고(예: 하나의 회사 팀), agent 범위가 엄격히 업무로 제한될 때 허용 가능합니다.

- 전용 머신/VM/container에서 실행하세요.
- 해당 런타임을 위해 전용 OS 사용자 + 전용 browser/profile/accounts를 사용하세요.
- 그 런타임에서 개인 Apple/Google 계정이나 개인 password-manager/browser profile에 로그인하지 마세요.

같은 런타임에서 개인 및 회사 신원을 섞으면 분리가 무너지고 개인 데이터 노출 위험이 커집니다.

## Gateway와 node 신뢰 개념

Gateway와 node를 역할은 다르지만 하나의 운영자 신뢰 도메인으로 취급하세요.

- **Gateway**는 control plane이자 정책 표면입니다(`gateway.auth`, tool policy, routing).
- **Node**는 해당 Gateway에 페어링된 원격 실행 표면입니다(commands, device actions, host-local capabilities).
- Gateway에 인증된 호출자는 Gateway 범위에서 신뢰됩니다. 페어링 후 node 작업은 해당 node에서의 신뢰된 운영자 작업으로 취급됩니다.
- `sessionKey`는 라우팅/컨텍스트 선택용이지 사용자별 인증이 아닙니다.
- Exec 승인은(allowlist + ask) 적대적 멀티 테넌트 격리가 아니라 운영자 의도를 위한 가드레일입니다.
- 신뢰된 단일 운영자 설정에 대한 OpenClaw의 제품 기본값은 `gateway`/`node`에서의 호스트 exec를 승인 프롬프트 없이 허용하는 것입니다(`security="full"`, 더 엄격하게 하지 않는 한 `ask="off"`). 이 기본값은 의도된 UX이며, 그 자체로 취약점은 아닙니다.
- Exec 승인은 정확한 요청 컨텍스트와 가능한 범위에서 직접적인 로컬 파일 피연산자에 바인딩됩니다. 모든 런타임/인터프리터 로더 경로를 의미적으로 모델링하지는 않습니다. 강한 경계가 필요하다면 샌드박싱과 호스트 격리를 사용하세요.

적대적 사용자 격리가 필요하다면, OS 사용자/호스트별로 신뢰 경계를 분리하고 별도의 gateways를 실행하세요.

## 신뢰 경계 매트릭스

위험을 분류할 때 빠른 모델로 아래를 사용하세요.

| 경계 또는 제어 | 의미 | 흔한 오해 |
| --- | --- | --- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | gateway API에 대한 호출자를 인증함 | “안전하려면 모든 프레임에 대해 메시지별 서명이 필요하다” |
| `sessionKey` | 컨텍스트/세션 선택을 위한 라우팅 키 | “세션 키는 사용자 인증 경계다” |
| 프롬프트/콘텐츠 가드레일 | 모델 오용 위험을 줄임 | “프롬프트 인젝션만으로도 인증 우회를 입증한다” |
| `canvas.eval` / browser evaluate | 활성화된 경우 의도된 운영자 기능 | “어떤 JS eval 원시 기능이든 이 신뢰 모델에서는 자동으로 취약점이다” |
| 로컬 TUI `!` shell | 명시적으로 운영자가 트리거하는 로컬 실행 | “로컬 셸 편의 명령은 원격 인젝션이다” |
| Node 페어링 및 node 명령 | 페어링된 장치에서의 운영자 수준 원격 실행 | “원격 장치 제어는 기본적으로 신뢰하지 않는 사용자 접근으로 취급해야 한다” |

## 설계상 취약점이 아닌 것들

다음 패턴은 자주 보고되지만, 실제 경계 우회가 입증되지 않는 한 보통 조치 없음으로 종료됩니다.

- 정책/auth/sandbox 우회 없이 프롬프트 인젝션만으로 이루어진 체인.
- 하나의 공유 호스트/config에서 적대적 멀티 테넌트 운영을 가정하는 주장.
- 공유 gateway 설정에서 일반적인 운영자 읽기 경로 접근(예: `sessions.list`/`sessions.preview`/`chat.history`)을 IDOR로 분류하는 주장.
- localhost 전용 배포에서의 지적(예: loopback 전용 gateway에서의 HSTS).
- 이 저장소에 존재하지 않는 인바운드 경로에 대해 Discord 인바운드 Webhook 서명 문제를 제기하는 보고.
- `system.run`에 대해 node 페어링 메타데이터를 숨겨진 2차 명령별 승인 계층으로 취급하는 보고. 실제 실행 경계는 여전히 gateway의 전역 node command policy와 node 자체의 exec 승인입니다.
- `sessionKey`를 인증 토큰으로 취급하는 “사용자별 권한 부재” 지적.

## 연구자 사전 점검 체크리스트

GHSA를 열기 전에 다음을 모두 확인하세요.

1. 재현이 최신 `main` 또는 최신 릴리스에서도 여전히 동작하는지.
2. 보고서에 정확한 코드 경로(`file`, function, line range)와 테스트한 version/commit이 포함되어 있는지.
3. 영향이 문서화된 신뢰 경계를 넘는지(단순한 프롬프트 인젝션이 아닌지).
4. 주장이 [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope)에 포함되어 있지 않은지.
5. 기존 advisories를 확인해 중복이 없는지(해당하는 경우 정식 GHSA 재사용).
6. 배포 가정이 명시되어 있는지(loopback/local vs exposed, trusted vs untrusted operators).

## 60초 안에 적용하는 강화된 기본 기준

먼저 이 기본 기준을 사용한 뒤, 신뢰된 agent별로 도구를 선택적으로 다시 활성화하세요.

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

이 설정은 Gateway를 로컬 전용으로 유지하고, DM을 격리하며, control-plane/runtime 도구를 기본적으로 비활성화합니다.

## 공유 받은편지함 빠른 규칙

두 명 이상이 봇에 DM을 보낼 수 있다면:

- `session.dmScope: "per-channel-peer"`(또는 멀티 계정 채널의 경우 `"per-account-channel-peer"`)로 설정하세요.
- `dmPolicy: "pairing"` 또는 엄격한 allowlist를 유지하세요.
- 공유 DM과 광범위한 도구 접근을 절대 함께 사용하지 마세요.
- 이 설정은 협업용/공유 받은편지함을 강화해 주지만, 사용자가 호스트/config 쓰기 권한을 공유하는 환경에서 적대적 공동 테넌트 격리를 위해 설계된 것은 아닙니다.

## 컨텍스트 가시성 모델

OpenClaw는 두 가지 개념을 분리합니다.

- **트리거 권한 부여**: 누가 agent를 트리거할 수 있는가(`dmPolicy`, `groupPolicy`, allowlists, mention gates).
- **컨텍스트 가시성**: 어떤 보조 컨텍스트가 모델 입력에 주입되는가(답장 본문, 인용된 텍스트, 스레드 히스토리, 전달된 메타데이터).

Allowlists는 트리거와 명령 권한 부여를 제어합니다. `contextVisibility` 설정은 보조 컨텍스트(인용된 답장, 스레드 루트, 가져온 히스토리)를 활성 allowlist 검사에서 허용된 발신자만 남기도록 필터링하는 방식을 제어합니다.

- `contextVisibility: "all"`(기본값)은 보조 컨텍스트를 받은 그대로 유지합니다.
- `contextVisibility: "allowlist"`는 보조 컨텍스트를 활성 allowlist 검사에서 허용된 발신자로 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`와 동일하게 동작하지만, 하나의 명시적 인용 답장은 유지합니다.

`contextVisibility`는 채널별 또는 방/대화별로 설정할 수 있습니다. 설정 방법은 [그룹 채팅](/ko/channels/groups#context-visibility-and-allowlists)을 참고하세요.

Advisory 분류 가이드:

- “모델이 allowlist에 없는 발신자의 인용문이나 과거 텍스트를 볼 수 있다”는 주장만 보여 주는 보고는 auth 또는 sandbox 경계 우회가 아니라, `contextVisibility`로 완화할 수 있는 강화 이슈입니다.
- 보안 영향이 있다고 보려면, 보고는 여전히 신뢰 경계 우회(auth, policy, sandbox, approval 또는 다른 문서화된 경계)를 입증해야 합니다.

## audit가 확인하는 내용(개요)

- **인바운드 접근**(DM 정책, 그룹 정책, allowlists): 낯선 사람이 봇을 트리거할 수 있는가?
- **도구 영향 범위**(확장 권한 도구 + 열린 방): 프롬프트 인젝션이 셸/파일/네트워크 작업으로 이어질 수 있는가?
- **Exec 승인 드리프트**(`security=full`, `autoAllowSkills`, `strictInlineEval` 없는 인터프리터 allowlists): 호스트 exec 가드레일이 여전히 의도한 대로 동작하고 있는가?
  - `security="full"`은 광범위한 자세 경고이지 버그의 증거가 아닙니다. 이는 신뢰된 개인 비서 설정을 위한 선택된 기본값이며, 위협 모델상 승인이나 allowlist 가드레일이 필요할 때만 더 엄격하게 하세요.
- **네트워크 노출**(Gateway bind/auth, Tailscale Serve/Funnel, 약하거나 짧은 인증 토큰).
- **브라우저 제어 노출**(원격 nodes, relay ports, 원격 CDP endpoints).
- **로컬 디스크 위생**(권한, symlinks, config includes, “동기화된 폴더” 경로).
- **Plugins**(명시적 allowlist 없이 extensions가 존재함).
- **정책 드리프트/오구성**(sandbox docker 설정은 되어 있지만 sandbox mode는 꺼짐; `gateway.nodes.denyCommands` 패턴이 실제로는 명령 이름의 정확한 일치만 수행하므로 비효율적임(예: `system.run`) 그리고 셸 텍스트는 검사하지 않음; 위험한 `gateway.nodes.allowCommands` 항목; 전역 `tools.profile="minimal"`이 에이전트별 프로필로 재정의됨; 느슨한 도구 정책 아래에서 extension plugin tools에 접근 가능함).
- **런타임 기대 드리프트**(예: `tools.exec.host`의 기본값이 이제 `auto`인데도 암묵적 exec가 여전히 `sandbox`를 의미한다고 가정하는 경우, 또는 sandbox mode가 꺼져 있는데 `tools.exec.host="sandbox"`를 명시적으로 설정하는 경우).
- **모델 위생**(구성된 모델이 레거시처럼 보일 때 경고하며, 강제 차단은 아님).

`--deep`으로 실행하면 OpenClaw는 최선의 노력 기준으로 live Gateway probe도 시도합니다.

## credential 저장소 맵

접근 권한을 감사하거나 백업 대상을 결정할 때 아래를 사용하세요.

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram bot token**: config/env 또는 `channels.telegram.tokenFile`(일반 파일만 허용, symlink는 거부됨)
- **Discord bot token**: config/env 또는 SecretRef(env/file/exec providers)
- **Slack tokens**: config/env (`channels.slack.*`)
- **Pairing allowlists**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json`(기본 계정)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json`(기본이 아닌 계정)
- **모델 auth profiles**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **파일 기반 비밀 payload(선택 사항)**: `~/.openclaw/secrets.json`
- **레거시 OAuth import**: `~/.openclaw/credentials/oauth.json`

## 보안 감사 체크리스트

audit가 결과를 출력하면, 다음 우선순위로 처리하세요.

1. **“open” 상태이면서 tools가 활성화된 항목**: 먼저 DMs/groups를 잠그고(pairing/allowlists), 그다음 tool policy/sandboxing을 강화하세요.
2. **공개 네트워크 노출**(LAN bind, Funnel, 인증 누락): 즉시 수정하세요.
3. **브라우저 제어 원격 노출**: 운영자 접근처럼 취급하세요(tailnet 전용, node를 의도적으로 페어링, 공개 노출 지양).
4. **권한**: state/config/credentials/auth가 그룹/전체 사용자에게 읽기 가능하지 않도록 하세요.
5. **Plugins/extensions**: 명시적으로 신뢰하는 것만 로드하세요.
6. **모델 선택**: tools가 있는 봇에는 최신의, 지시문 내성이 강화된 모델을 우선 사용하세요.

## 보안 감사 용어집

실제 배포에서 가장 자주 보게 될 가능성이 높은 고신호 `checkId` 값들입니다(전체 목록은 아님):

| `checkId` | 심각도 | 중요한 이유 | 주요 수정 key/path | 자동 수정 |
| --- | --- | --- | --- | --- |
| `fs.state_dir.perms_world_writable` | critical | 다른 사용자/프로세스가 전체 OpenClaw state를 수정할 수 있음 | `~/.openclaw`의 파일 시스템 권한 | yes |
| `fs.state_dir.perms_group_writable` | warn | 같은 그룹 사용자가 전체 OpenClaw state를 수정할 수 있음 | `~/.openclaw`의 파일 시스템 권한 | yes |
| `fs.state_dir.perms_readable` | warn | 다른 사용자가 state 디렉터리를 읽을 수 있음 | `~/.openclaw`의 파일 시스템 권한 | yes |
| `fs.state_dir.symlink` | warn | state dir 대상이 또 다른 신뢰 경계가 됨 | state dir 파일 시스템 레이아웃 | no |
| `fs.config.perms_writable` | critical | 다른 사용자가 auth/tool policy/config를 변경할 수 있음 | `~/.openclaw/openclaw.json`의 파일 시스템 권한 | yes |
| `fs.config.symlink` | warn | config 대상이 또 다른 신뢰 경계가 됨 | config 파일 파일 시스템 레이아웃 | no |
| `fs.config.perms_group_readable` | warn | 같은 그룹 사용자가 config 토큰/설정을 읽을 수 있음 | config 파일의 파일 시스템 권한 | yes |
| `fs.config.perms_world_readable` | critical | config가 토큰/설정을 노출할 수 있음 | config 파일의 파일 시스템 권한 | yes |
| `fs.config_include.perms_writable` | critical | config include 파일을 다른 사용자가 수정할 수 있음 | `openclaw.json`에서 참조하는 include-file 권한 | yes |
| `fs.config_include.perms_group_readable` | warn | 같은 그룹 사용자가 포함된 secrets/settings를 읽을 수 있음 | `openclaw.json`에서 참조하는 include-file 권한 | yes |
| `fs.config_include.perms_world_readable` | critical | 포함된 secrets/settings를 모든 사용자가 읽을 수 있음 | `openclaw.json`에서 참조하는 include-file 권한 | yes |
| `fs.auth_profiles.perms_writable` | critical | 다른 사용자가 저장된 모델 credentials를 주입하거나 교체할 수 있음 | `agents/<agentId>/agent/auth-profiles.json` 권한 | yes |
| `fs.auth_profiles.perms_readable` | warn | 다른 사용자가 API 키와 OAuth 토큰을 읽을 수 있음 | `agents/<agentId>/agent/auth-profiles.json` 권한 | yes |
| `fs.credentials_dir.perms_writable` | critical | 다른 사용자가 채널 pairing/credential state를 수정할 수 있음 | `~/.openclaw/credentials`의 파일 시스템 권한 | yes |
| `fs.credentials_dir.perms_readable` | warn | 다른 사용자가 채널 credential state를 읽을 수 있음 | `~/.openclaw/credentials`의 파일 시스템 권한 | yes |
| `fs.sessions_store.perms_readable` | warn | 다른 사용자가 세션 transcript/metadata를 읽을 수 있음 | session store 권한 | yes |
| `fs.log_file.perms_readable` | warn | 다른 사용자가 민감 정보가 일부 가려졌지만 여전히 민감한 로그를 읽을 수 있음 | gateway 로그 파일 권한 | yes |
| `fs.synced_dir` | warn | iCloud/Dropbox/Drive에 있는 state/config는 토큰/transcript 노출 범위를 넓힘 | config/state를 동기화 폴더 밖으로 이동 | no |
| `gateway.bind_no_auth` | critical | 공유 비밀 없이 원격 bind됨 | `gateway.bind`, `gateway.auth.*` | no |
| `gateway.loopback_no_auth` | critical | reverse-proxied loopback가 인증 없이 노출될 수 있음 | `gateway.auth.*`, proxy 설정 | no |
| `gateway.trusted_proxies_missing` | warn | reverse-proxy 헤더가 존재하지만 신뢰되지 않음 | `gateway.trustedProxies` | no |
| `gateway.http.no_auth` | warn/critical | `auth.mode="none"`으로 Gateway HTTP APIs에 접근 가능함 | `gateway.auth.mode`, `gateway.http.endpoints.*` | no |
| `gateway.http.session_key_override_enabled` | info | HTTP API 호출자가 `sessionKey`를 재정의할 수 있음 | `gateway.http.allowSessionKeyOverride` | no |
| `gateway.tools_invoke_http.dangerous_allow` | warn/critical | HTTP API를 통해 위험한 tools를 다시 활성화함 | `gateway.tools.allow` | no |
| `gateway.nodes.allow_commands_dangerous` | warn/critical | 고영향 node commands(카메라/화면/연락처/캘린더/SMS)를 활성화함 | `gateway.nodes.allowCommands` | no |
| `gateway.nodes.deny_commands_ineffective` | warn | 패턴처럼 보이는 deny 항목이 셸 텍스트나 그룹과 매치되지 않음 | `gateway.nodes.denyCommands` | no |
| `gateway.tailscale_funnel` | critical | 공용 인터넷 노출 | `gateway.tailscale.mode` | no |
| `gateway.tailscale_serve` | info | Serve를 통해 tailnet 노출이 활성화됨 | `gateway.tailscale.mode` | no |
| `gateway.control_ui.allowed_origins_required` | critical | 명시적인 browser-origin allowlist 없이 loopback이 아닌 Control UI를 노출함 | `gateway.controlUi.allowedOrigins` | no |
| `gateway.control_ui.allowed_origins_wildcard` | warn/critical | `allowedOrigins=["*"]`는 browser-origin allowlisting을 비활성화함 | `gateway.controlUi.allowedOrigins` | no |
| `gateway.control_ui.host_header_origin_fallback` | warn/critical | Host-header origin fallback를 활성화함(DNS rebinding 강화 수준 저하) | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | no |
| `gateway.control_ui.insecure_auth` | warn | insecure-auth 호환성 토글이 활성화됨 | `gateway.controlUi.allowInsecureAuth` | no |
| `gateway.control_ui.device_auth_disabled` | critical | 장치 identity 검사를 비활성화함 | `gateway.controlUi.dangerouslyDisableDeviceAuth` | no |
| `gateway.real_ip_fallback_enabled` | warn/critical | `X-Real-IP` fallback 신뢰로 인해 proxy 오구성 시 source-IP spoofing이 가능해질 수 있음 | `gateway.allowRealIpFallback`, `gateway.trustedProxies` | no |
| `gateway.token_too_short` | warn | 짧은 공유 토큰은 brute force가 더 쉬움 | `gateway.auth.token` | no |
| `gateway.auth_no_rate_limit` | warn | rate limiting 없는 노출된 auth는 brute-force 위험을 높임 | `gateway.auth.rateLimit` | no |
| `gateway.trusted_proxy_auth` | critical | 이제 proxy identity가 auth 경계가 됨 | `gateway.auth.mode="trusted-proxy"` | no |
| `gateway.trusted_proxy_no_proxies` | critical | 신뢰된 proxy IP 없이 trusted-proxy auth를 사용하는 것은 안전하지 않음 | `gateway.trustedProxies` | no |
| `gateway.trusted_proxy_no_user_header` | critical | trusted-proxy auth가 사용자 identity를 안전하게 확인할 수 없음 | `gateway.auth.trustedProxy.userHeader` | no |
| `gateway.trusted_proxy_no_allowlist` | warn | trusted-proxy auth가 인증된 모든 업스트림 사용자를 허용함 | `gateway.auth.trustedProxy.allowUsers` | no |
| `gateway.probe_auth_secretref_unavailable` | warn | 이 명령 경로에서는 심층 probe가 auth SecretRefs를 확인할 수 없었음 | deep-probe auth source / SecretRef availability | no |
| `gateway.probe_failed` | warn/critical | live Gateway probe 실패 | gateway reachability/auth | no |
| `discovery.mdns_full_mode` | warn/critical | mDNS 전체 모드는 로컬 네트워크에 `cliPath`/`sshPort` 메타데이터를 광고함 | `discovery.mdns.mode`, `gateway.bind` | no |
| `config.insecure_or_dangerous_flags` | warn | 안전하지 않거나 위험한 디버그 플래그가 하나라도 활성화됨 | 여러 key(자세한 내용은 finding detail 참고) | no |
| `config.secrets.gateway_password_in_config` | warn | Gateway 비밀번호가 config에 직접 저장되어 있음 | `gateway.auth.password` | no |
| `config.secrets.hooks_token_in_config` | warn | Hook bearer token이 config에 직접 저장되어 있음 | `hooks.token` | no |
| `hooks.token_reuse_gateway_token` | critical | Hook ingress token이 Gateway auth 잠금 해제에도 사용됨 | `hooks.token`, `gateway.auth.token` | no |
| `hooks.token_too_short` | warn | hook ingress에 대한 brute force가 더 쉬움 | `hooks.token` | no |
| `hooks.default_session_key_unset` | warn | Hook agent 실행이 요청별로 생성된 세션으로 fan out됨 | `hooks.defaultSessionKey` | no |
| `hooks.allowed_agent_ids_unrestricted` | warn/critical | 인증된 hook 호출자가 구성된 모든 agent로 라우팅할 수 있음 | `hooks.allowedAgentIds` | no |
| `hooks.request_session_key_enabled` | warn/critical | 외부 호출자가 `sessionKey`를 선택할 수 있음 | `hooks.allowRequestSessionKey` | no |
| `hooks.request_session_key_prefixes_missing` | warn/critical | 외부 세션 키 형태에 대한 제한이 없음 | `hooks.allowedSessionKeyPrefixes` | no |
| `hooks.path_root` | critical | Hook 경로가 `/`이어서 ingress 충돌 또는 오라우팅이 더 쉬움 | `hooks.path` | no |
| `hooks.installs_unpinned_npm_specs` | warn | Hook install 기록이 변경 불가능한 npm specs에 고정되어 있지 않음 | hook install metadata | no |
| `hooks.installs_missing_integrity` | warn | Hook install 기록에 integrity metadata가 없음 | hook install metadata | no |
| `hooks.installs_version_drift` | warn | Hook install 기록이 설치된 packages와 어긋남 | hook install metadata | no |
| `logging.redact_off` | warn | 민감한 값이 logs/status에 노출됨 | `logging.redactSensitive` | yes |
| `browser.control_invalid_config` | warn | 브라우저 제어 config가 런타임 전에 유효하지 않음 | `browser.*` | no |
| `browser.control_no_auth` | critical | token/password auth 없이 브라우저 제어가 노출됨 | `gateway.auth.*` | no |
| `browser.remote_cdp_http` | warn | 일반 HTTP를 통한 원격 CDP는 전송 암호화가 없음 | browser profile `cdpUrl` | no |
| `browser.remote_cdp_private_host` | warn | 원격 CDP가 private/internal host를 대상으로 함 | browser profile `cdpUrl`, `browser.ssrfPolicy.*` | no |
| `sandbox.docker_config_mode_off` | warn | Sandbox Docker config가 존재하지만 비활성 상태임 | `agents.*.sandbox.mode` | no |
| `sandbox.bind_mount_non_absolute` | warn | 상대 경로 bind mounts는 예측 불가능하게 해석될 수 있음 | `agents.*.sandbox.docker.binds[]` | no |
| `sandbox.dangerous_bind_mount` | critical | Sandbox bind mount 대상이 차단된 시스템, credential 또는 Docker socket 경로임 | `agents.*.sandbox.docker.binds[]` | no |
| `sandbox.dangerous_network_mode` | critical | Sandbox Docker network가 `host` 또는 `container:*` namespace-join 모드를 사용함 | `agents.*.sandbox.docker.network` | no |
| `sandbox.dangerous_seccomp_profile` | critical | Sandbox seccomp profile이 container 격리를 약화시킴 | `agents.*.sandbox.docker.securityOpt` | no |
| `sandbox.dangerous_apparmor_profile` | critical | Sandbox AppArmor profile이 container 격리를 약화시킴 | `agents.*.sandbox.docker.securityOpt` | no |
| `sandbox.browser_cdp_bridge_unrestricted` | warn | Sandbox browser bridge가 source-range 제한 없이 노출됨 | `sandbox.browser.cdpSourceRange` | no |
| `sandbox.browser_container.non_loopback_publish` | critical | 기존 browser container가 loopback이 아닌 인터페이스에 CDP를 publish함 | browser sandbox container publish config | no |
| `sandbox.browser_container.hash_label_missing` | warn | 기존 browser container가 현재 config-hash labels보다 이전 것임 | `openclaw sandbox recreate --browser --all` | no |
| `sandbox.browser_container.hash_epoch_stale` | warn | 기존 browser container가 현재 browser config epoch보다 이전 것임 | `openclaw sandbox recreate --browser --all` | no |
| `tools.exec.host_sandbox_no_sandbox_defaults` | warn | sandbox가 꺼져 있으면 `exec host=sandbox`는 fail closed됨 | `tools.exec.host`, `agents.defaults.sandbox.mode` | no |
| `tools.exec.host_sandbox_no_sandbox_agents` | warn | sandbox가 꺼져 있으면 에이전트별 `exec host=sandbox`는 fail closed됨 | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode` | no |
| `tools.exec.security_full_configured` | warn/critical | 호스트 exec가 `security="full"`로 실행 중임 | `tools.exec.security`, `agents.list[].tools.exec.security` | no |
| `tools.exec.auto_allow_skills_enabled` | warn | Exec 승인이 skill bins를 암묵적으로 신뢰함 | `~/.openclaw/exec-approvals.json` | no |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn | 인터프리터 allowlists가 강제 재승인 없이 inline eval을 허용함 | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, exec approvals allowlist | no |
| `tools.exec.safe_bins_interpreter_unprofiled` | warn | `safeBins` 안의 인터프리터/런타임 bins가 명시적 profiles 없이 exec 위험을 넓힘 | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*` | no |
| `tools.exec.safe_bins_broad_behavior` | warn | `safeBins` 안의 광범위 동작 도구가 저위험 stdin-filter 신뢰 모델을 약화시킴 | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins` | no |
| `tools.exec.safe_bin_trusted_dirs_risky` | warn | `safeBinTrustedDirs`에 변경 가능하거나 위험한 디렉터리가 포함됨 | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs` | no |
| `skills.workspace.symlink_escape` | warn | Workspace `skills/**/SKILL.md`가 workspace 루트 밖으로 확인됨(symlink-chain drift) | workspace `skills/**` 파일 시스템 상태 | no |
| `plugins.extensions_no_allowlist` | warn | 명시적인 plugin allowlist 없이 extensions가 설치되어 있음 | `plugins.allowlist` | no |
| `plugins.installs_unpinned_npm_specs` | warn | Plugin install 기록이 변경 불가능한 npm specs에 고정되어 있지 않음 | plugin install metadata | no |
| `plugins.installs_missing_integrity` | warn | Plugin install 기록에 integrity metadata가 없음 | plugin install metadata | no |
| `plugins.installs_version_drift` | warn | Plugin install 기록이 설치된 packages와 어긋남 | plugin install metadata | no |
| `plugins.code_safety` | warn/critical | Plugin 코드 스캔에서 의심스럽거나 위험한 패턴이 발견됨 | plugin code / install source | no |
| `plugins.code_safety.entry_path` | warn | Plugin entry 경로가 숨김 위치 또는 `node_modules` 위치를 가리킴 | plugin manifest `entry` | no |
| `plugins.code_safety.entry_escape` | critical | Plugin entry가 plugin 디렉터리를 벗어남 | plugin manifest `entry` | no |
| `plugins.code_safety.scan_failed` | warn | Plugin 코드 스캔을 완료할 수 없었음 | plugin extension path / scan environment | no |
| `skills.code_safety` | warn/critical | Skills 설치 메타데이터/코드에 의심스럽거나 위험한 패턴이 포함됨 | skill install source | no |
| `skills.code_safety.scan_failed` | warn | Skill 코드 스캔을 완료할 수 없었음 | skill scan environment | no |
| `security.exposure.open_channels_with_exec` | warn/critical | 공유/공개 방에서 exec가 활성화된 agent에 접근할 수 있음 | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*` | no |
| `security.exposure.open_groups_with_elevated` | critical | 열린 그룹 + 확장 권한 도구는 고영향 프롬프트 인젝션 경로를 만듦 | `channels.*.groupPolicy`, `tools.elevated.*` | no |
| `security.exposure.open_groups_with_runtime_or_fs` | critical/warn | 열린 그룹에서 sandbox/workspace 가드 없이 명령/파일 도구에 접근할 수 있음 | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode` | no |
| `security.trust_model.multi_user_heuristic` | warn | config가 multi-user처럼 보이지만 gateway 신뢰 모델은 개인 비서 모델임 | 신뢰 경계 분리 또는 공유 사용자 강화(`sandbox.mode`, tool deny/workspace scoping) | no |
| `tools.profile_minimal_overridden` | warn | agent 재정의가 전역 minimal profile을 우회함 | `agents.list[].tools.profile` | no |
| `plugins.tools_reachable_permissive_policy` | warn | 느슨한 정책 컨텍스트에서 extension tools에 접근 가능함 | `tools.profile` + tool allow/deny | no |
| `models.legacy` | warn | 레거시 모델 계열이 여전히 구성되어 있음 | model selection | no |
| `models.weak_tier` | warn | 구성된 모델이 현재 권장 등급보다 낮음 | model selection | no |
| `models.small_params` | critical/info | 작은 모델 + 안전하지 않은 tool 표면은 인젝션 위험을 높임 | model choice + sandbox/tool policy | no |
| `summary.attack_surface` | info | auth, channel, tool, 노출 상태에 대한 롤업 요약 | 여러 key(자세한 내용은 finding detail 참고) | no |

## HTTP를 통한 Control UI

Control UI는 장치 identity를 생성하기 위해 **보안 컨텍스트**(HTTPS 또는 localhost)가 필요합니다. `gateway.controlUi.allowInsecureAuth`는 로컬 호환성 토글입니다.

- localhost에서는 페이지가 보안되지 않은 HTTP로 로드될 때 device identity 없이도 Control UI auth를 허용합니다.
- pairing 검사를 우회하지는 않습니다.
- 원격(non-localhost) device identity 요구 사항을 완화하지도 않습니다.

가능하면 HTTPS(Tailscale Serve)를 사용하거나 `127.0.0.1`에서 UI를 여세요.

비상 상황에서만 `gateway.controlUi.dangerouslyDisableDeviceAuth`를 사용해 device identity 검사를 완전히 비활성화할 수 있습니다. 이는 심각한 보안 저하이므로, 적극적으로 디버깅 중이고 빠르게 되돌릴 수 있는 경우가 아니라면 꺼 둬야 합니다.

이러한 위험한 플래그와는 별도로, `gateway.auth.mode: "trusted-proxy"`가 성공적으로 설정되면 device identity 없이도 **운영자** Control UI 세션을 허용할 수 있습니다. 이는 `allowInsecureAuth` 지름길이 아니라 의도된 auth-mode 동작이며, node-role Control UI 세션에는 여전히 적용되지 않습니다.

`openclaw security audit`는 이 설정이 활성화되어 있을 때 경고를 표시합니다.

## 안전하지 않거나 위험한 플래그 요약

알려진 안전하지 않거나 위험한 디버그 스위치가 활성화되면 `openclaw security audit`는 `config.insecure_or_dangerous_flags`를 포함합니다. 현재 이 검사는 다음을 집계합니다.

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

OpenClaw config schema에 정의된 전체 `dangerous*` / `dangerously*` config keys:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.synology-chat.dangerouslyAllowNameMatching` (extension channel)
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (extension channel)
- `channels.zalouser.dangerouslyAllowNameMatching` (extension channel)
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `channels.irc.dangerouslyAllowNameMatching` (extension channel)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `channels.mattermost.dangerouslyAllowNameMatching` (extension channel)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (extension channel)
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## Reverse Proxy 구성

Gateway를 reverse proxy(nginx, Caddy, Traefik 등) 뒤에서 실행한다면, 올바른 forwarded-client IP 처리를 위해 `gateway.trustedProxies`를 구성하세요.

Gateway는 `trustedProxies`에 **포함되지 않은** 주소에서 오는 proxy headers를 감지하면, 해당 연결을 로컬 클라이언트로 취급하지 않습니다. gateway auth가 비활성화되어 있으면 그런 연결은 거부됩니다. 이렇게 하면 proxied 연결이 localhost에서 온 것처럼 보이면서 자동 신뢰를 받는 인증 우회를 방지할 수 있습니다.

`gateway.trustedProxies`는 `gateway.auth.mode: "trusted-proxy"`에도 사용되지만, 해당 auth mode는 더 엄격합니다.

- trusted-proxy auth는 **loopback-source proxies에서는 fail closed**합니다.
- 동일 호스트의 loopback reverse proxies는 여전히 로컬 클라이언트 감지와 forwarded IP 처리를 위해 `gateway.trustedProxies`를 사용할 수 있습니다.
- 동일 호스트의 loopback reverse proxies에서는 `gateway.auth.mode: "trusted-proxy"` 대신 token/password auth를 사용하세요.

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # 선택 사항. 기본값은 false.
  # 프록시가 X-Forwarded-For를 제공할 수 없는 경우에만 활성화하세요.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

`trustedProxies`가 구성되면 Gateway는 클라이언트 IP를 판별하기 위해 `X-Forwarded-For`를 사용합니다. `X-Real-IP`는 `gateway.allowRealIpFallback: true`를 명시적으로 설정한 경우가 아니면 기본적으로 무시됩니다.

좋은 reverse proxy 동작(들어오는 forwarding headers를 덮어씀):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

나쁜 reverse proxy 동작(신뢰되지 않은 forwarding headers를 추가/보존함):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS 및 origin 관련 참고

- OpenClaw Gateway는 우선 로컬/loopback을 기준으로 설계됩니다. reverse proxy에서 TLS를 종료한다면, 해당 프록시가 노출하는 HTTPS 도메인에서 HSTS를 설정하세요.
- Gateway 자체가 HTTPS를 종료한다면 `gateway.http.securityHeaders.strictTransportSecurity`를 설정해 OpenClaw 응답에서 HSTS 헤더를 내보낼 수 있습니다.
- 자세한 배포 가이드는 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth#tls-termination-and-hsts)에 있습니다.
- loopback이 아닌 Control UI 배포의 경우, 기본적으로 `gateway.controlUi.allowedOrigins`가 필요합니다.
- `gateway.controlUi.allowedOrigins: ["*"]`는 강화된 기본값이 아니라 명시적인 전체 허용 browser-origin 정책입니다. 엄격하게 통제된 로컬 테스트가 아니라면 피하세요.
- 일반적인 loopback 예외가 활성화되어 있어도, loopback에서의 browser-origin auth 실패는 여전히 rate-limited됩니다. 다만 잠금 키는 하나의 공유 localhost 버킷이 아니라 정규화된 `Origin` 값별로 범위가 지정됩니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host-header origin fallback mode를 활성화합니다. 운영자가 선택한 위험한 정책으로 취급하세요.
- DNS rebinding과 proxy-host header 동작은 배포 강화 이슈로 취급하세요. `trustedProxies`를 엄격하게 유지하고, gateway를 공용 인터넷에 직접 노출하지 마세요.

## 로컬 세션 로그는 디스크에 저장됩니다

OpenClaw는 세션 연속성과 (선택적으로) 세션 메모리 인덱싱을 위해 세션 transcript를 `~/.openclaw/agents/<agentId>/sessions/*.jsonl` 아래 디스크에 저장합니다. 하지만 이는 동시에 **파일 시스템 접근 권한이 있는 모든 프로세스/사용자가 이 로그를 읽을 수 있음**을 의미합니다. 디스크 접근을 신뢰 경계로 취급하고 `~/.openclaw`의 권한을 엄격히 설정하세요(아래 audit 섹션 참고). 에이전트 간 더 강한 격리가 필요하다면, 별도의 OS 사용자 또는 별도의 호스트에서 실행하세요.

## Node 실행(`system.run`)

macOS node가 페어링되어 있으면 Gateway는 해당 node에서 `system.run`을 호출할 수 있습니다. 이것은 Mac에 대한 **원격 코드 실행**입니다.

- node pairing(승인 + token)이 필요합니다.
- Gateway node pairing은 명령별 승인 표면이 아닙니다. 이는 node identity/trust와 token 발급을 설정합니다.
- Gateway는 `gateway.nodes.allowCommands` / `denyCommands`를 통해 거친 전역 node command policy를 적용합니다.
- Mac에서는 **설정 → Exec approvals**를 통해 제어합니다(security + ask + allowlist).
- node별 `system.run` 정책은 node 자체의 exec approvals 파일(`exec.approvals.node.*`)이며, 이는 gateway의 전역 command-ID 정책보다 더 엄격할 수도 있고 더 느슨할 수도 있습니다.
- `security="full"` 및 `ask="off"`로 실행되는 node는 기본적인 신뢰된 운영자 모델을 따르고 있는 것입니다. 배포에서 명시적으로 더 엄격한 승인 또는 allowlist 정책이 필요하지 않은 한, 이를 예상된 동작으로 취급하세요.
- 승인 모드는 정확한 요청 컨텍스트와, 가능한 경우 하나의 구체적인 로컬 스크립트/파일 피연산자에 바인딩됩니다. 인터프리터/런타임 명령에 대해 OpenClaw가 정확히 하나의 직접 로컬 파일을 식별할 수 없으면, 승인 기반 실행은 전체 의미론적 범위를 보장하는 척하지 않고 거부됩니다.
- `host=node`의 경우 승인 기반 실행은 정규화된 준비된 `systemRunPlan`도 저장합니다. 이후 승인된 전달은 이 저장된 계획을 재사용하며, gateway 검증은 승인 요청 생성 이후 호출자가 명령/cwd/세션 컨텍스트를 수정하는 것을 거부합니다.
- 원격 실행을 원하지 않는다면 security를 **deny**로 설정하고 해당 Mac의 node pairing을 제거하세요.

이 구분은 분류 시 중요합니다.

- 다시 연결된 페어링된 node가 다른 command list를 광고하는 것만으로는, Gateway의 전역 정책과 node의 로컬 exec approvals가 실제 실행 경계를 계속 강제하는 한 그 자체로 취약점이 아닙니다.
- node pairing 메타데이터를 숨겨진 2차 명령별 승인 계층으로 간주하는 보고는 대개 보안 경계 우회가 아니라 정책/UX 혼동입니다.

## 동적 Skills(watcher / remote nodes)

OpenClaw는 세션 중간에도 Skills 목록을 새로 고칠 수 있습니다.

- **Skills watcher**: `SKILL.md` 변경 사항은 다음 agent turn에서 Skills 스냅샷을 갱신할 수 있습니다.
- **Remote nodes**: macOS node를 연결하면 macOS 전용 Skills가 사용 가능해질 수 있습니다(bin probing 기준).

skill 폴더는 **신뢰된 코드**로 취급하고, 수정 권한을 엄격히 제한하세요.

## 위협 모델

AI 비서는 다음을 할 수 있습니다.

- 임의의 셸 명령 실행
- 파일 읽기/쓰기
- 네트워크 서비스 접근
- 누구에게나 메시지 전송(WhatsApp 접근 권한을 부여한 경우)

당신에게 메시지를 보내는 사람은 다음을 시도할 수 있습니다.

- AI를 속여 나쁜 일을 하게 만들기
- 데이터 접근을 위해 사회공학 기법 사용
- 인프라 세부 정보를 탐색하기

## 핵심 개념: 지능보다 먼저 접근 제어

여기서 대부분의 실패는 정교한 익스플로잇이 아닙니다. “누군가 봇에 메시지를 보냈고, 봇이 요청한 대로 했다”는 유형입니다.

OpenClaw의 입장은 다음과 같습니다.

- **먼저 identity:** 누가 봇과 대화할 수 있는지 결정합니다(DM pairing / allowlists / 명시적 “open”).
- **다음은 범위:** 봇이 어디에서 동작할 수 있는지 결정합니다(그룹 allowlists + mention gating, tools, sandboxing, device permissions).
- **마지막은 모델:** 모델은 조작될 수 있다고 가정하고, 조작되더라도 영향 범위가 제한되도록 설계합니다.

## 명령 권한 부여 모델

슬래시 명령과 directives는 **권한이 있는 발신자**에 대해서만 처리됩니다. 권한 부여는 채널 allowlists/pairing과 `commands.useAccessGroups`에서 파생됩니다([Configuration](/ko/gateway/configuration) 및 [Slash commands](/ko/tools/slash-commands) 참고). 채널 allowlist가 비어 있거나 `"*"`를 포함하면, 해당 채널의 명령은 사실상 열린 상태가 됩니다.

`/exec`는 권한 있는 운영자를 위한 세션 전용 편의 기능입니다. config를 쓰거나 다른 세션을 변경하지는 않습니다.

## control plane tools 위험

두 개의 내장 도구는 영속적인 control-plane 변경을 일으킬 수 있습니다.

- `gateway`는 `config.schema.lookup` / `config.get`으로 config를 검사할 수 있고, `config.apply`, `config.patch`, `update.run`으로 영속적인 변경을 수행할 수 있습니다.
- `cron`은 원래의 채팅/작업이 끝난 뒤에도 계속 실행되는 예약 작업을 만들 수 있습니다.

owner-only `gateway` runtime tool은 여전히 `tools.exec.ask` 또는 `tools.exec.security`를 다시 쓰는 것을 거부합니다. 레거시 `tools.bash.*` 별칭은 쓰기 전에 동일한 보호된 exec 경로로 정규화됩니다.

신뢰하지 않는 콘텐츠를 처리하는 모든 agent/표면에 대해서는 기본적으로 이를 거부하세요.

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false`는 restart 작업만 차단합니다. `gateway`의 config/update 작업은 비활성화하지 않습니다.

## Plugins/extensions

Plugins는 Gateway와 **같은 프로세스 안에서** 실행됩니다. 신뢰된 코드로 취급하세요:

- 신뢰하는 출처의 plugins만 설치하세요.
- 명시적인 `plugins.allow` allowlist를 사용하는 편이 좋습니다.
- 활성화하기 전에 plugin config를 검토하세요.
- plugin 변경 후에는 Gateway를 재시작하세요.
- plugins를 설치하거나 업데이트할 때(`openclaw plugins install <package>`, `openclaw plugins update <id>`), 신뢰하지 않는 코드를 실행하는 것처럼 취급하세요.
  - 설치 경로는 활성 plugin install root 아래의 plugin별 디렉터리입니다.
  - OpenClaw는 설치/업데이트 전에 내장된 위험 코드 스캔을 실행합니다. `critical` 결과는 기본적으로 차단됩니다.
  - OpenClaw는 `npm pack`을 사용한 다음 해당 디렉터리에서 `npm install --omit=dev`를 실행합니다(npm lifecycle scripts는 설치 중 코드를 실행할 수 있습니다).
  - 버전이 고정된 정확한 버전(`@scope/pkg@1.2.3`)을 선호하고, 활성화 전에 디스크에 풀린 코드를 검사하세요.
  - `--dangerously-force-unsafe-install`은 plugin 설치/업데이트 흐름에서 내장 스캔의 false positive에 대한 비상용 옵션입니다. plugin `before_install` hook 정책 차단은 우회하지 않으며, 스캔 실패도 우회하지 않습니다.
  - Gateway 기반 skill dependency installs도 동일한 dangerous/suspicious 구분을 따릅니다. 내장된 `critical` 결과는 호출자가 `dangerouslyForceUnsafeInstall`을 명시적으로 설정하지 않는 한 차단되며, suspicious 결과는 여전히 경고만 표시합니다. `openclaw skills install`은 별도의 ClawHub skill 다운로드/설치 흐름으로 유지됩니다.

자세한 내용: [Plugins](/ko/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## DM 접근 모델(pairing / allowlist / open / disabled)

현재 DM을 지원하는 모든 채널은 메시지가 처리되기 **전에** 인바운드 DM을 제어하는 DM 정책(`dmPolicy` 또는 `*.dm.policy`)을 지원합니다.

- `pairing`(기본값): 알 수 없는 발신자는 짧은 pairing 코드를 받고, 승인될 때까지 봇은 그들의 메시지를 무시합니다. 코드는 1시간 후 만료되며, 새 요청이 생성되기 전까지 반복 DM으로는 코드가 다시 전송되지 않습니다. 보류 중인 요청은 기본적으로 **채널당 3개**로 제한됩니다.
- `allowlist`: 알 수 없는 발신자는 차단됩니다(pairing 핸드셰이크 없음).
- `open`: 누구나 DM을 보낼 수 있도록 허용합니다(공개). 채널 allowlist에 `"*"`가 포함되어 있어야 합니다(**명시적 opt-in 필요**).
- `disabled`: 인바운드 DM을 완전히 무시합니다.

CLI로 승인:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

자세한 내용 + 디스크 파일: [Pairing](/ko/channels/pairing)

## DM 세션 격리(multi-user mode)

기본적으로 OpenClaw는 **모든 DM을 main session으로 라우팅**하여 여러 장치와 채널에 걸친 연속성을 유지합니다. **여러 사람**이 봇에 DM을 보낼 수 있다면(open DMs 또는 다중 인원 allowlist), DM 세션을 격리하는 것을 고려하세요.

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

이렇게 하면 그룹 채팅은 격리된 상태로 유지하면서 사용자 간 컨텍스트 누출을 방지할 수 있습니다.

이것은 메시징 컨텍스트 경계이지 호스트 관리자 경계가 아닙니다. 사용자가 서로 적대적이고 같은 Gateway 호스트/config를 공유한다면, 신뢰 경계별로 별도의 gateways를 실행하세요.

### 보안 DM 모드(권장)

위 스니펫을 **보안 DM 모드**로 간주하세요.

- 기본값: `session.dmScope: "main"`(모든 DM이 하나의 세션을 공유하여 연속성을 유지)
- 로컬 CLI onboarding 기본값: 설정되지 않은 경우 `session.dmScope: "per-channel-peer"`를 기록함(기존 명시적 값은 유지)
- 보안 DM 모드: `session.dmScope: "per-channel-peer"`(각 채널+발신자 쌍이 격리된 DM 컨텍스트를 가짐)
- 채널 간 peer 격리: `session.dmScope: "per-peer"`(각 발신자가 같은 유형의 모든 채널에 걸쳐 하나의 세션을 가짐)

같은 채널에서 여러 계정을 실행한다면 대신 `per-account-channel-peer`를 사용하세요. 같은 사람이 여러 채널로 연락한다면 `session.identityLinks`를 사용해 해당 DM 세션들을 하나의 정식 identity로 합칠 수 있습니다. 자세한 내용은 [Session Management](/ko/concepts/session) 및 [Configuration](/ko/gateway/configuration)을 참고하세요.

## Allowlists(DM + groups) - 용어

OpenClaw에는 “누가 나를 트리거할 수 있는가?”를 결정하는 두 개의 별도 계층이 있습니다.

- **DM allowlist**(`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; 레거시: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): direct messages에서 누가 봇과 대화할 수 있는지.
  - `dmPolicy="pairing"`일 때 승인 결과는 `~/.openclaw/credentials/` 아래 계정 범위 pairing allowlist 저장소에 기록되며(기본 계정은 `<channel>-allowFrom.json`, 기본이 아닌 계정은 `<channel>-<accountId>-allowFrom.json`), config allowlists와 병합됩니다.
- **그룹 allowlist**(채널별): 어떤 그룹/channels/guilds에서 봇이 메시지를 아예 받을지.
  - 일반적인 패턴:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: `requireMention` 같은 그룹별 기본값. 설정되면 그룹 allowlist로도 동작합니다(전체 허용 동작을 유지하려면 `"*"` 포함).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: 그룹 세션 *안에서* 누가 봇을 트리거할 수 있는지 제한(WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: 표면별 allowlists + 멘션 기본값.
  - 그룹 검사는 이 순서로 실행됩니다: 먼저 `groupPolicy`/그룹 allowlists, 그다음 mention/reply 활성화.
  - 봇 메시지에 답장하는 것(암시적 멘션)은 `groupAllowFrom` 같은 발신자 allowlists를 우회하지 않습니다.
  - **보안 참고:** `dmPolicy="open"`과 `groupPolicy="open"`은 최후의 수단 설정으로 취급하세요. 거의 사용하지 말아야 하며, 방의 모든 구성원을 완전히 신뢰하는 경우가 아니라면 pairing + allowlists를 우선하세요.

자세한 내용: [Configuration](/ko/gateway/configuration) 및 [Groups](/ko/channels/groups)

## 프롬프트 인젝션(무엇이고, 왜 중요한가)

프롬프트 인젝션은 공격자가 모델을 조작해 안전하지 않은 행동을 하도록 메시지를 만드는 것입니다(“지시사항을 무시하라”, “파일 시스템을 덤프하라”, “이 링크를 따라가 명령을 실행하라” 등).

강한 시스템 프롬프트가 있더라도 **프롬프트 인젝션은 해결되지 않습니다**. 시스템 프롬프트 가드레일은 부드러운 지침일 뿐이고, 강한 강제력은 tool policy, exec approvals, sandboxing, 채널 allowlists에서 나옵니다(그리고 운영자는 설계상 이를 비활성화할 수 있습니다). 실제로 도움이 되는 것은 다음과 같습니다.

- 인바운드 DM을 엄격히 잠그기(pairing/allowlists).
- 그룹에서는 mention gating을 선호하고, 공개 방에서는 “항상 활성” 봇을 피하기.
- 링크, 첨부 파일, 붙여넣은 지시문을 기본적으로 적대적인 것으로 취급하기.
- 민감한 tool execution은 sandbox에서 실행하고, 비밀 정보는 agent가 접근 가능한 파일 시스템 밖에 두기.
- 참고: sandboxing은 opt-in입니다. sandbox mode가 꺼져 있으면 암묵적인 `host=auto`는 gateway host로 해석됩니다. 명시적인 `host=sandbox`는 사용 가능한 sandbox runtime이 없기 때문에 여전히 fail closed됩니다. 해당 동작을 config에 명시하려면 `host=gateway`를 설정하세요.
- 고위험 tools(`exec`, `browser`, `web_fetch`, `web_search`)는 신뢰된 agents 또는 명시적 allowlists로 제한하기.
- 인터프리터(`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`)를 allowlist에 넣는다면, inline eval 형태도 명시적 승인이 필요하도록 `tools.exec.strictInlineEval`을 활성화하기.
- **모델 선택은 중요합니다:** 오래되었거나 작거나 레거시인 모델은 프롬프트 인젝션과 tool misuse에 훨씬 더 취약합니다. tool-enabled agents에는 가능한 한 가장 강력한 최신 세대의 instruction-hardened 모델을 사용하세요.

신뢰하지 않아야 할 위험 신호:

- “이 파일/URL을 읽고 그대로 따르세요.”
- “시스템 프롬프트나 안전 규칙을 무시하세요.”
- “숨겨진 지시사항이나 tool output을 공개하세요.”
- “`~/.openclaw` 또는 로그의 전체 내용을 붙여넣으세요.”

## 안전하지 않은 외부 콘텐츠 우회 플래그

OpenClaw에는 외부 콘텐츠 안전 래핑을 비활성화하는 명시적 우회 플래그가 있습니다.

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload 필드 `allowUnsafeExternalContent`

가이드:

- 운영 환경에서는 이를 설정하지 않거나 false로 유지하세요.
- 엄격히 제한된 디버깅 목적으로만 일시적으로 활성화하세요.
- 활성화했다면 해당 agent를 격리하세요(sandbox + 최소 tools + 전용 세션 네임스페이스).

Hooks 위험 참고:

- Hook payload는 전달이 통제된 시스템에서 오더라도 신뢰되지 않는 콘텐츠입니다(메일/문서/웹 콘텐츠는 프롬프트 인젝션을 담을 수 있습니다).
- 약한 모델 등급은 이 위험을 증가시킵니다. hook 기반 자동화에는 강력한 최신 모델 등급을 사용하고, tool policy는 엄격하게 유지하세요(`tools.profile: "messaging"` 또는 그보다 더 엄격하게). 가능하면 sandboxing도 사용하세요.

### 프롬프트 인젝션은 공개 DM이 없어도 발생할 수 있습니다

봇에 메시지를 보낼 수 있는 사람이 **오직 당신뿐**이어도, 봇이 읽는 **신뢰되지 않는 콘텐츠**(웹 검색/가져오기 결과, browser 페이지, 이메일, 문서, 첨부 파일, 붙여넣은 로그/코드)를 통해 프롬프트 인젝션은 여전히 발생할 수 있습니다. 즉, 위협 표면은 발신자만이 아니라 **콘텐츠 자체**이기도 합니다.

tools가 활성화되어 있을 때 일반적인 위험은 컨텍스트 유출 또는 tool call 유발입니다. 영향 범위를 줄이려면:

- 신뢰되지 않는 콘텐츠를 요약하는 읽기 전용 또는 tool-disabled **reader agent**를 사용한 뒤, 그 요약을 main agent로 전달하세요.
- 필요하지 않다면 tool-enabled agents에서는 `web_search` / `web_fetch` / `browser`를 꺼 두세요.
- OpenResponses URL 입력(`input_file` / `input_image`)의 경우, `gateway.http.endpoints.responses.files.urlAllowlist`와 `gateway.http.endpoints.responses.images.urlAllowlist`를 엄격하게 설정하고 `maxUrlParts`는 낮게 유지하세요. 비어 있는 allowlists는 미설정으로 간주되므로, URL 가져오기를 완전히 비활성화하려면 `files.allowUrl: false` / `images.allowUrl: false`를 사용하세요.
- OpenResponses 파일 입력의 경우, 디코딩된 `input_file` 텍스트도 여전히 **신뢰되지 않는 외부 콘텐츠**로 주입됩니다. Gateway가 이를 로컬에서 디코딩했다고 해서 파일 텍스트를 신뢰된 것으로 간주하지 마세요. 이 주입 블록은 이 경로에서 더 긴 `SECURITY NOTICE:` 배너는 생략하더라도, 여전히 명시적인 `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 경계 마커와 `Source: External` 메타데이터를 포함합니다.
- 동일한 마커 기반 래핑은 media-understanding이 첨부 문서에서 텍스트를 추출해 미디어 프롬프트에 추가할 때도 적용됩니다.
- 신뢰되지 않는 입력을 다루는 모든 agent에 대해 sandboxing과 엄격한 tool allowlists를 활성화하세요.
- 비밀 정보는 프롬프트에 넣지 말고 gateway host의 env/config를 통해 전달하세요.

### 모델 강도(보안 참고)

프롬프트 인젝션 저항성은 모델 등급마다 **균일하지 않습니다**. 더 작고 저렴한 모델일수록, 특히 적대적인 프롬프트 아래에서 tool misuse와 instruction hijacking에 더 취약한 경향이 있습니다.

<Warning>
tool-enabled agents 또는 신뢰되지 않는 콘텐츠를 읽는 agents의 경우, 오래되거나 작은 모델에서의 프롬프트 인젝션 위험은 종종 지나치게 높습니다. 그런 워크로드를 약한 모델 등급에서 실행하지 마세요.
</Warning>

권장 사항:

- tools를 실행하거나 파일/네트워크에 접근할 수 있는 모든 봇에는 **최신 세대의 최고 등급 모델**을 사용하세요.
- tool-enabled agents 또는 신뢰되지 않는 받은편지함에는 **오래되었거나 약하거나 작은 등급**을 사용하지 마세요. 프롬프트 인젝션 위험이 너무 큽니다.
- 반드시 작은 모델을 사용해야 한다면 **영향 범위를 줄이세요**(읽기 전용 도구, 강력한 sandboxing, 최소한의 파일 시스템 접근, 엄격한 allowlists).
- 작은 모델을 실행할 때는 **모든 세션에 sandboxing을 활성화**하고, 입력이 엄격하게 통제되지 않는 한 **web_search/web_fetch/browser를 비활성화**하세요.
- 신뢰된 입력만 있고 tools가 없는 chat-only 개인 비서라면, 작은 모델도 보통 괜찮습니다.

<a id="reasoning-verbose-output-in-groups"></a>

## 그룹에서의 Reasoning 및 자세한 출력

`/reasoning`, `/verbose`, `/trace`는 공개 채널용이 아닌 내부 추론, tool output 또는 plugin diagnostics를 노출할 수 있습니다. 그룹 환경에서는 이를 **디버그 전용**으로 취급하고, 명시적으로 필요하지 않은 한 꺼 두세요.

가이드:

- 공개 방에서는 `/reasoning`, `/verbose`, `/trace`를 비활성화하세요.
- 활성화한다면 신뢰된 DMs 또는 엄격히 통제된 방에서만 사용하세요.
- 기억하세요: verbose 및 trace output에는 tool args, URLs, plugin diagnostics, 모델이 본 데이터가 포함될 수 있습니다.

## 구성 강화(예시)

### 0) 파일 권한

Gateway host에서 config와 state를 비공개로 유지하세요.

- `~/.openclaw/openclaw.json`: `600`(사용자 읽기/쓰기만)
- `~/.openclaw`: `700`(사용자만)

`openclaw doctor`는 이러한 권한이 너무 넓을 경우 경고하고 더 엄격하게 조정할 것을 제안할 수 있습니다.

### 0.4) 네트워크 노출(bind + port + firewall)

Gateway는 단일 포트에서 **WebSocket + HTTP**를 멀티플렉싱합니다.

- 기본값: `18789`
- config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

이 HTTP 표면에는 Control UI와 canvas host가 포함됩니다.

- Control UI(SPA assets) (기본 base path `/`)
- Canvas host: `/__openclaw__/canvas/` 및 `/__openclaw__/a2ui/`(임의 HTML/JS; 신뢰되지 않는 콘텐츠로 취급)

일반 브라우저에서 canvas 콘텐츠를 로드한다면, 다른 신뢰되지 않는 웹 페이지와 동일하게 취급하세요.

- canvas host를 신뢰되지 않는 네트워크/사용자에게 노출하지 마세요.
- 의미를 완전히 이해하지 못한다면 canvas 콘텐츠가 권한 있는 웹 표면과 같은 origin을 공유하게 하지 마세요.

bind mode는 Gateway가 어디에서 수신 대기할지를 제어합니다.

- `gateway.bind: "loopback"`(기본값): 로컬 클라이언트만 연결할 수 있습니다.
- loopback이 아닌 bind(`"lan"`, `"tailnet"`, `"custom"`)는 공격 표면을 넓힙니다. gateway auth(공유 token/password 또는 올바르게 구성된 non-loopback trusted proxy)와 실제 firewall이 있을 때만 사용하세요.

경험칙:

- LAN bind보다 Tailscale Serve를 선호하세요(Serve는 Gateway를 loopback에 유지하고, 접근은 Tailscale이 처리함).
- 반드시 LAN에 bind해야 한다면, port를 엄격한 source IP allowlist로 firewall 처리하세요. 넓게 port-forward하지 마세요.
- 인증 없이 `0.0.0.0`에 Gateway를 절대 노출하지 마세요.

### 0.4.1) Docker port publishing + UFW(`DOCKER-USER`)

VPS에서 Docker로 OpenClaw를 실행한다면, publish된 container 포트(`-p HOST:CONTAINER` 또는 Compose `ports:`)는 호스트 `INPUT` 규칙만이 아니라 Docker의 forwarding chains를 통해 라우팅된다는 점을 기억하세요.

Docker 트래픽을 firewall 정책과 일치시키려면 `DOCKER-USER`에서 규칙을 강제하세요(이 체인은 Docker 자체 accept 규칙보다 먼저 평가됩니다). 많은 최신 배포판에서 `iptables`/`ip6tables`는 `iptables-nft` 프런트엔드를 사용하지만, 여전히 nftables 백엔드에 이 규칙을 적용합니다.

최소 allowlist 예시(IPv4):

```bash
# /etc/ufw/after.rules (독립된 *filter section으로 추가)
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

IPv6는 별도의 테이블을 사용합니다. Docker IPv6가 활성화되어 있다면 `/etc/ufw/after6.rules`에도 동일한 정책을 추가하세요.

문서 스니펫에 `eth0` 같은 인터페이스 이름을 하드코딩하지 마세요. 인터페이스 이름은 VPS 이미지마다 다르며(`ens3`, `enp*` 등), 불일치하면 deny 규칙이 의도치 않게 건너뛰어질 수 있습니다.

리로드 후 빠른 검증:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

외부에서 보여야 하는 포트는 의도적으로 노출한 것만이어야 합니다(대부분의 설정에서는 SSH + reverse proxy 포트).

### 0.4.2) mDNS/Bonjour discovery(정보 노출)

Gateway는 로컬 장치 검색을 위해 mDNS(5353 포트의 `_openclaw-gw._tcp`)를 통해 자신의 존재를 브로드캐스트합니다. 전체 모드에서는 운영 정보를 노출할 수 있는 TXT 레코드가 포함됩니다.

- `cliPath`: CLI 바이너리의 전체 파일 시스템 경로(사용자 이름과 설치 위치 노출)
- `sshPort`: 호스트에서 SSH가 사용 가능함을 광고
- `displayName`, `lanHost`: 호스트 이름 정보

**운영 보안 고려 사항:** 인프라 세부 정보를 브로드캐스트하면 로컬 네트워크의 누구에게나 정찰이 더 쉬워집니다. 파일 시스템 경로나 SSH 가용성 같은 “무해해 보이는” 정보도 공격자가 환경을 파악하는 데 도움이 됩니다.

**권장 사항:**

1. **Minimal mode**(기본값, 노출된 gateways에 권장): mDNS 브로드캐스트에서 민감한 필드를 생략합니다.

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. 로컬 장치 검색이 필요 없다면 **완전히 비활성화**하세요.

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Full mode**(opt-in): TXT 레코드에 `cliPath` + `sshPort`를 포함합니다.

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **환경 변수**(대안): config 변경 없이 mDNS를 비활성화하려면 `OPENCLAW_DISABLE_BONJOUR=1`을 설정하세요.

minimal mode에서도 Gateway는 장치 검색에 충분한 정보(`role`, `gatewayPort`, `transport`)를 계속 브로드캐스트하지만 `cliPath`와 `sshPort`는 생략합니다. CLI 경로 정보가 필요한 앱은 대신 인증된 WebSocket 연결을 통해 이를 가져올 수 있습니다.

### 0.5) Gateway WebSocket 잠그기(로컬 auth)

Gateway auth는 기본적으로 **필수**입니다. 유효한 gateway auth 경로가 구성되지 않으면 Gateway는 WebSocket 연결을 거부합니다(fail‑closed).

onboarding은 기본적으로(loopback에서도) token을 생성하므로 로컬 클라이언트도 인증해야 합니다.

모든 WS 클라이언트가 인증하도록 token을 설정하세요.

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor가 대신 생성해 줄 수도 있습니다: `openclaw doctor --generate-gateway-token`.

참고: `gateway.remote.token` / `.password`는 클라이언트 credential source입니다. 이것만으로는 로컬 WS 접근을 보호하지 않습니다.
로컬 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 대체값으로 사용할 수 있습니다.
`gateway.auth.token` / `gateway.auth.password`가 SecretRef로 명시적으로 구성되었지만 확인할 수 없으면, 확인은 fail closed되며(remote fallback으로 가려지지 않음) 종료됩니다.
선택 사항: `wss://`를 사용할 때 `gateway.remote.tlsFingerprint`로 원격 TLS를 pinning할 수 있습니다.
일반 텍스트 `ws://`는 기본적으로 loopback 전용입니다. 신뢰된 private-network 경로에서는 비상용으로 클라이언트 프로세스에 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하세요.

로컬 장치 pairing:

- direct local loopback 연결은 같은 호스트 클라이언트의 원활한 사용을 위해 자동 승인됩니다.
- OpenClaw에는 신뢰된 공유 비밀 helper 흐름을 위한 좁은 backend/container-local self-connect 경로도 있습니다.
- 같은 호스트의 tailnet bind를 포함한 tailnet 및 LAN 연결은 pairing 관점에서 원격으로 취급되며 여전히 승인이 필요합니다.

auth 모드:

- `gateway.auth.mode: "token"`: 공유 bearer token(대부분의 설정에 권장).
- `gateway.auth.mode: "password"`: password auth(가능하면 env `OPENCLAW_GATEWAY_PASSWORD`를 통해 설정).
- `gateway.auth.mode: "trusted-proxy"`: identity-aware reverse proxy가 사용자를 인증하고 headers를 통해 identity를 전달하도록 신뢰([Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth) 참고).

회전 체크리스트(token/password):

1. 새 비밀을 생성/설정합니다(`gateway.auth.token` 또는 `OPENCLAW_GATEWAY_PASSWORD`).
2. Gateway를 재시작합니다(또는 macOS 앱이 Gateway를 감독 중이면 앱을 재시작).
3. 원격 클라이언트가 있다면 업데이트합니다(Gateway를 호출하는 머신의 `gateway.remote.token` / `.password`).
4. 이전 자격 증명으로는 더 이상 연결할 수 없는지 확인합니다.

### 0.6) Tailscale Serve identity headers

`gateway.auth.allowTailscale`이 `true`일 때(Serve의 기본값), OpenClaw는 Control UI/WebSocket 인증을 위해 Tailscale Serve identity headers(`tailscale-user-login`)를 허용합니다. OpenClaw는 `x-forwarded-for` 주소를 로컬 Tailscale 데몬(`tailscale whois`)으로 확인하고 이를 header와 일치시키는 방식으로 identity를 검증합니다. 이 경로는 Tailscale이 주입한 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host`가 포함된 loopback 요청에만 작동합니다.
이 비동기 identity 확인 경로에서는 limiter가 실패를 기록하기 전에 동일한 `{scope, ip}`에 대한 실패 시도가 직렬화됩니다. 따라서 하나의 Serve 클라이언트에서 동시에 여러 잘못된 재시도를 하면, 두 번째 시도는 단순한 불일치 둘이 경쟁하는 대신 즉시 잠길 수 있습니다.
HTTP API endpoints(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는 Tailscale identity-header auth를 사용하지 않습니다. 이들은 여전히 gateway에 구성된 HTTP auth mode를 따릅니다.

중요한 경계 참고:

- Gateway HTTP bearer auth는 사실상 전부 아니면 전무인 운영자 접근입니다.
- `/v1/chat/completions`, `/v1/responses`, 또는 `/api/channels/*`를 호출할 수 있는 credentials는 해당 gateway에 대한 전체 접근 운영자 비밀로 취급하세요.
- OpenAI 호환 HTTP 표면에서는 shared-secret bearer auth가 전체 기본 운영자 범위(`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`)와 agent turn에 대한 owner 의미를 복원합니다. 더 좁은 `x-openclaw-scopes` 값은 이 shared-secret 경로를 축소하지 않습니다.
- HTTP에서의 요청별 scope 의미는 trusted proxy auth 또는 private ingress에서의 `gateway.auth.mode="none"` 같은 identity-bearing mode에서만 적용됩니다.
- 이러한 identity-bearing mode에서는 `x-openclaw-scopes`를 생략하면 일반 운영자 기본 scope 집합으로 대체됩니다. 더 좁은 scope 집합을 원한다면 header를 명시적으로 보내세요.
- `/tools/invoke`도 같은 shared-secret 규칙을 따릅니다. token/password bearer auth는 거기서도 전체 운영자 접근으로 취급되며, identity-bearing mode만 선언된 scopes를 존중합니다.
- 신뢰하지 않는 호출자와 이러한 credentials를 공유하지 마세요. 신뢰 경계별로 별도의 gateways를 사용하는 편이 좋습니다.

**신뢰 가정:** tokenless Serve auth는 gateway host가 신뢰된다고 가정합니다.
이를 적대적인 같은 호스트 프로세스로부터의 보호로 취급하지 마세요. gateway host에서 신뢰하지 않는 로컬 코드가 실행될 수 있다면 `gateway.auth.allowTailscale`을 비활성화하고 `gateway.auth.mode: "token"` 또는 `"password"`로 명시적인 shared-secret auth를 요구하세요.

**보안 규칙:** 자체 reverse proxy에서 이 headers를 전달하지 마세요. gateway 앞에서 TLS를 종료하거나 프록시를 사용하는 경우 `gateway.auth.allowTailscale`을 비활성화하고 shared-secret auth(`gateway.auth.mode: "token"` 또는 `"password"`) 또는 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 대신 사용하세요.

신뢰된 proxies:

- Gateway 앞에서 TLS를 종료한다면 `gateway.trustedProxies`에 프록시 IP를 설정하세요.
- OpenClaw는 로컬 pairing 검사와 HTTP auth/local 검사를 위한 클라이언트 IP 판별 시 해당 IP들에서 온 `x-forwarded-for`(또는 `x-real-ip`)를 신뢰합니다.
- 프록시가 `x-forwarded-for`를 **덮어쓰도록** 하고, Gateway 포트에 대한 직접 접근은 차단하세요.

자세한 내용은 [Tailscale](/ko/gateway/tailscale) 및 [Web overview](/web)를 참고하세요.

### 0.6.1) node host를 통한 브라우저 제어(권장)

Gateway가 원격에 있고 browser가 다른 머신에서 실행된다면, browser 머신에서 **node host**를 실행하고 Gateway가 browser 작업을 프록시하게 하세요([Browser tool](/ko/tools/browser) 참고). node pairing은 관리자 접근처럼 취급하세요.

권장 패턴:

- Gateway와 node host를 같은 tailnet(Tailscale) 안에 유지하세요.
- node를 의도적으로 페어링하고, browser proxy routing이 필요 없다면 비활성화하세요.

피해야 할 것:

- relay/control 포트를 LAN 또는 공용 인터넷에 노출하는 것.
- browser control endpoints에 Tailscale Funnel을 사용하는 것(공개 노출).

### 0.7) 디스크상의 secrets(민감한 데이터)

`~/.openclaw/`(또는 `$OPENCLAW_STATE_DIR/`) 아래의 모든 항목에는 secrets 또는 개인 데이터가 있을 수 있다고 가정하세요.

- `openclaw.json`: config에는 토큰(gateway, remote gateway), provider settings, allowlists가 포함될 수 있습니다.
- `credentials/**`: 채널 credentials(예: WhatsApp creds), pairing allowlists, 레거시 OAuth imports.
- `agents/<agentId>/agent/auth-profiles.json`: API 키, token profiles, OAuth 토큰, 선택적인 `keyRef`/`tokenRef`.
- `secrets.json`(선택 사항): `file` SecretRef providers(`secrets.providers`)에서 사용하는 파일 기반 secret payload.
- `agents/<agentId>/agent/auth.json`: 레거시 호환성 파일. 정적 `api_key` 항목은 발견 시 제거됩니다.
- `agents/<agentId>/sessions/**`: 개인 메시지와 tool output을 포함할 수 있는 세션 transcript(`*.jsonl`) + 라우팅 metadata(`sessions.json`).
- 번들 plugin packages: 설치된 plugins(및 해당 `node_modules/`).
- `sandboxes/**`: 도구 sandbox 작업 공간. sandbox 안에서 읽거나 쓴 파일의 복사본이 누적될 수 있습니다.

강화 팁:

- 권한을 엄격히 유지하세요(디렉터리는 `700`, 파일은 `600`).
- gateway host에서 전체 디스크 암호화를 사용하세요.
- 호스트를 공유한다면 Gateway 전용 OS 사용자 계정을 사용하는 편이 좋습니다.

### 0.8) 로그 + transcript(redaction + retention)

접근 제어가 올바르더라도 로그와 transcript는 민감한 정보를 유출할 수 있습니다.

- Gateway 로그에는 tool 요약, 오류, URL이 포함될 수 있습니다.
- 세션 transcript에는 붙여넣은 secrets, 파일 내용, 명령 출력, 링크가 포함될 수 있습니다.

권장 사항:

- tool summary redaction을 켜 두세요(`logging.redactSensitive: "tools"`; 기본값).
- `logging.redactPatterns`를 사용해 환경에 맞는 사용자 지정 패턴을 추가하세요(토큰, 호스트 이름, 내부 URL).
- 진단 정보를 공유할 때는 raw logs보다 `openclaw status --all`을 우선 사용하세요(붙여넣기 가능, secrets redacted).
- 오래 보관할 필요가 없다면 오래된 세션 transcript와 로그 파일을 정리하세요.

자세한 내용: [Logging](/ko/gateway/logging)

### 1) DMs: 기본값은 pairing

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) 그룹: 어디서나 멘션 필수

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

그룹 채팅에서는 명시적으로 멘션되었을 때만 응답하세요.

### 3) 번호 분리하기(WhatsApp, Signal, Telegram)

전화번호 기반 채널의 경우, AI는 개인 번호와 별도의 전화번호에서 실행하는 것을 고려하세요.

- 개인 번호: 개인 대화가 비공개로 유지됨
- 봇 번호: 적절한 경계 아래에서 AI가 처리함

### 4) 읽기 전용 모드(sandbox + tools 사용)

다음을 조합하면 읽기 전용 프로필을 만들 수 있습니다.

- `agents.defaults.sandbox.workspaceAccess: "ro"`(또는 workspace 접근이 전혀 없도록 `"none"`)
- `write`, `edit`, `apply_patch`, `exec`, `process` 등을 차단하는 tool allow/deny 목록

추가 강화 옵션:

- `tools.exec.applyPatch.workspaceOnly: true`(기본값): sandboxing이 꺼져 있어도 `apply_patch`가 workspace 디렉터리 밖을 쓰거나 삭제하지 못하게 합니다. `apply_patch`가 의도적으로 workspace 밖 파일을 다루게 하려는 경우에만 `false`로 설정하세요.
- `tools.fs.workspaceOnly: true`(선택 사항): `read`/`write`/`edit`/`apply_patch` 경로와 native prompt image auto-load 경로를 workspace 디렉터리로 제한합니다(현재 절대 경로를 허용하고 있고 단일 가드레일을 원할 때 유용함).
- 파일 시스템 루트는 좁게 유지하세요. agent workspaces/sandbox workspaces에 홈 디렉터리 같은 넓은 루트를 피하세요. 넓은 루트는 민감한 로컬 파일(예: `~/.openclaw` 아래의 state/config)을 파일 시스템 도구에 노출할 수 있습니다.

### 5) 보안 기본 기준(복사/붙여넣기)

Gateway를 비공개로 유지하고, DM pairing을 요구하며, 항상 활성인 그룹 봇을 피하는 “안전한 기본값” config 예시:

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

tool execution도 “기본적으로 더 안전하게” 하고 싶다면, 모든 non-owner agent에 대해 sandbox를 추가하고 위험한 tools를 deny하세요(아래 “에이전트별 접근 프로필” 예시 참고).

채팅 기반 agent turn의 내장 기본 기준: non-owner 발신자는 `cron` 또는 `gateway` tools를 사용할 수 없습니다.

## Sandboxing(권장)

전용 문서: [Sandboxing](/ko/gateway/sandboxing)

서로 보완적인 두 가지 접근 방식:

- **전체 Gateway를 Docker에서 실행**(container 경계): [Docker](/ko/install/docker)
- **도구 sandbox**(`agents.defaults.sandbox`, 호스트 gateway + Docker로 격리된 tools): [Sandboxing](/ko/gateway/sandboxing)

참고: 에이전트 간 접근을 막으려면 `agents.defaults.sandbox.scope`를 `"agent"`(기본값)로 유지하거나, 더 엄격한 세션별 격리를 위해 `"session"`을 사용하세요. `scope: "shared"`는 단일 container/workspace를 사용합니다.

sandbox 내부의 agent workspace 접근도 고려하세요.

- `agents.defaults.sandbox.workspaceAccess: "none"`(기본값)은 agent workspace 접근을 차단하며, tools는 `~/.openclaw/sandboxes` 아래의 sandbox workspace에서 실행됩니다.
- `agents.defaults.sandbox.workspaceAccess: "ro"`는 agent workspace를 `/agent`에 읽기 전용으로 마운트합니다(`write`/`edit`/`apply_patch` 비활성화).
- `agents.defaults.sandbox.workspaceAccess: "rw"`는 agent workspace를 `/workspace`에 읽기/쓰기로 마운트합니다.
- 추가 `sandbox.docker.binds`는 정규화되고 canonicalized된 source paths를 기준으로 검증됩니다. 부모 symlink 트릭과 canonical home aliases는 `/etc`, `/var/run`, 또는 OS 홈 아래 credential 디렉터리 같은 차단된 루트로 해석되면 여전히 fail closed됩니다.

중요: `tools.elevated`는 sandbox 밖에서 exec를 실행하는 전역 기본 탈출구입니다. 유효한 호스트는 기본적으로 `gateway`이고, exec 대상이 `node`로 설정된 경우에는 `node`입니다. `tools.elevated.allowFrom`은 엄격하게 유지하고 낯선 사람에게는 활성화하지 마세요. `agents.list[].tools.elevated`를 사용해 에이전트별로 elevated를 더 제한할 수도 있습니다. 자세한 내용은 [Elevated Mode](/ko/tools/elevated)를 참고하세요.

### 서브 에이전트 위임 가드레일

세션 tools를 허용한다면, 위임된 서브 에이전트 실행도 또 하나의 경계 결정으로 취급하세요.

- 에이전트가 정말 위임이 필요하지 않다면 `sessions_spawn`을 deny하세요.
- `agents.defaults.subagents.allowAgents`와 에이전트별 `agents.list[].subagents.allowAgents` 재정의는 알려진 안전한 대상 에이전트로 제한하세요.
- 반드시 sandbox 안에 머물러야 하는 워크플로에서는 `sessions_spawn`을 `sandbox: "require"`로 호출하세요(기본값은 `inherit`).
- `sandbox: "require"`는 대상 child runtime이 sandboxed가 아니면 즉시 실패합니다.

## 브라우저 제어 위험

브라우저 제어를 활성화하면 모델은 실제 브라우저를 조작할 수 있습니다.
해당 브라우저 프로필에 이미 로그인된 세션이 있다면, 모델은 그 계정과 데이터에 접근할 수 있습니다. 브라우저 프로필은 **민감한 상태**로 취급하세요.

- 에이전트 전용 프로필(기본 `openclaw` 프로필)을 사용하는 편이 좋습니다.
- 에이전트를 개인용 주력 프로필에 연결하지 마세요.
- sandboxed agents에는 신뢰하는 경우가 아니라면 호스트 브라우저 제어를 비활성화하세요.
- 독립형 loopback 브라우저 제어 API는 shared-secret auth(gateway token bearer auth 또는 gateway password)만 허용합니다. trusted-proxy 또는 Tailscale Serve identity headers는 사용하지 않습니다.
- 브라우저 다운로드는 신뢰되지 않는 입력으로 취급하고, 격리된 다운로드 디렉터리를 사용하는 편이 좋습니다.
- 가능하면 에이전트 프로필에서 브라우저 sync/password managers를 비활성화하세요(영향 범위 축소).
- 원격 gateways의 경우 “브라우저 제어”는 해당 프로필이 접근할 수 있는 모든 것에 대한 “운영자 접근”과 동등하다고 가정하세요.
- Gateway와 node hosts는 tailnet 전용으로 유지하고, 브라우저 제어 포트를 LAN 또는 공용 인터넷에 노출하지 마세요.
- 필요 없으면 browser proxy routing을 비활성화하세요(`gateway.nodes.browser.mode="off"`).
- Chrome MCP existing-session mode는 **더 안전한** 방식이 아닙니다. 해당 호스트의 Chrome 프로필이 접근할 수 있는 범위에서 그대로 사용자처럼 동작할 수 있습니다.

### 브라우저 SSRF 정책(기본적으로 엄격함)

OpenClaw의 브라우저 탐색 정책은 기본적으로 엄격합니다. private/internal 대상은 명시적으로 opt in하지 않는 한 차단된 상태로 유지됩니다.

- 기본값: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`가 설정되지 않아 브라우저 탐색은 private/internal/special-use 대상을 계속 차단합니다.
- 레거시 별칭: 호환성을 위해 `browser.ssrfPolicy.allowPrivateNetwork`도 여전히 허용됩니다.
- opt-in mode: private/internal/special-use 대상을 허용하려면 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`를 설정하세요.
- 엄격 모드에서는 명시적 예외를 위해 `hostnameAllowlist`(예: `*.example.com`)와 `allowedHostnames`(정확한 호스트 예외, `localhost` 같은 차단된 이름 포함)를 사용하세요.
- 리디렉션 기반 우회를 줄이기 위해 탐색은 요청 전 검사되며, 탐색 후 최종 `http(s)` URL에 대해서도 최선의 노력 기준으로 다시 검사됩니다.

엄격한 정책 예시:

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

## 에이전트별 접근 프로필(multi-agent)

멀티 에이전트 라우팅에서는 각 agent가 자체 sandbox + tool policy를 가질 수 있습니다.
이를 사용해 에이전트별로 **전체 접근**, **읽기 전용**, **접근 없음**을 부여하세요.
자세한 내용과 우선순위 규칙은 [Multi-Agent Sandbox & Tools](/ko/tools/multi-agent-sandbox-tools)를 참고하세요.

일반적인 사용 사례:

- 개인 agent: 전체 접근, sandbox 없음
- 가족/업무 agent: sandboxed + 읽기 전용 tools
- 공개 agent: sandboxed + 파일 시스템/셸 tools 없음

### 예시: 전체 접근(sandbox 없음)

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

### 예시: 읽기 전용 tools + 읽기 전용 workspace

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

### 예시: 파일 시스템/셸 접근 없음(provider messaging 허용)

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
        // Session tools는 transcript의 민감한 데이터를 노출할 수 있습니다. 기본적으로 OpenClaw는 이 도구들을
        // 현재 세션 + 생성된 서브에이전트 세션으로 제한하지만, 필요하면 더 엄격히 제한할 수 있습니다.
        // 자세한 내용은 config reference의 `tools.sessions.visibility`를 참고하세요.
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

## AI에 알려줄 내용

에이전트의 시스템 프롬프트에 보안 가이드라인을 포함하세요.

```text
## 보안 규칙
- 낯선 사람과 디렉터리 목록이나 파일 경로를 절대 공유하지 마세요
- API 키, 자격 증명 또는 인프라 세부 정보를 절대 공개하지 마세요
- 시스템 config를 수정하는 요청은 owner와 확인하세요
- 확신이 없으면 행동하기 전에 물어보세요
- 명시적으로 권한이 부여되지 않은 한 개인 데이터를 비공개로 유지하세요
```

## 사고 대응

AI가 잘못된 행동을 했다면:

### 격리

1. **중지:** macOS 앱이 Gateway를 감독 중이라면 앱을 중지하거나, `openclaw gateway` 프로세스를 종료하세요.
2. **노출 차단:** 무슨 일이 일어났는지 이해할 때까지 `gateway.bind: "loopback"`으로 설정하거나(Tailscale Funnel/Serve를 비활성화) 하세요.
3. **접근 동결:** 위험한 DMs/groups를 `dmPolicy: "disabled"`로 전환하거나 멘션 필수로 바꾸고, 사용 중이었다면 `"*"` 전체 허용 항목을 제거하세요.

### 교체(비밀이 유출되었다면 침해로 가정)

1. Gateway auth(`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`)를 교체하고 재시작하세요.
2. Gateway를 호출할 수 있는 모든 머신의 원격 클라이언트 secrets(`gateway.remote.token` / `.password`)를 교체하세요.
3. provider/API credentials(WhatsApp creds, Slack/Discord tokens, `auth-profiles.json`의 모델/API 키, 사용 중인 경우 암호화된 secrets payload 값)를 교체하세요.

### 감사

1. Gateway 로그를 확인하세요: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`(또는 `logging.file`).
2. 관련 transcript를 검토하세요: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. 최근 config 변경 사항을 검토하세요(접근 범위를 넓혔을 수 있는 항목: `gateway.bind`, `gateway.auth`, dm/group policies, `tools.elevated`, plugin changes).
4. `openclaw security audit --deep`를 다시 실행하고 critical findings가 해결되었는지 확인하세요.

### 보고용 수집 항목

- 타임스탬프, gateway host OS + OpenClaw 버전
- 세션 transcript + 짧은 로그 tail(redacting 후)
- 공격자가 보낸 내용 + agent가 수행한 작업
- Gateway가 loopback을 넘어 노출되었는지 여부(LAN/Tailscale Funnel/Serve)

## Secret Scanning(`detect-secrets`)

CI는 `secrets` job에서 `detect-secrets` pre-commit hook를 실행합니다.
`main`에 대한 push는 항상 전체 파일 스캔을 실행합니다. Pull request는 base commit을 사용할 수 있으면 변경된 파일만 빠르게 검사하고, 그렇지 않으면 전체 파일 스캔으로 대체합니다. 실패했다면 baseline에 아직 없는 새로운 후보가 있다는 뜻입니다.

### CI가 실패할 때

1. 로컬에서 재현하세요.

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. 도구를 이해하세요.
   - pre-commit의 `detect-secrets`는 저장소의 baseline과 excludes를 사용해 `detect-secrets-hook`를 실행합니다.
   - `detect-secrets audit`는 대화형 검토를 열어 각 baseline 항목을 실제 비밀인지 false positive인지 표시하게 합니다.
3. 실제 비밀이라면 교체/제거한 뒤, 스캔을 다시 실행해 baseline을 업데이트하세요.
4. false positive라면 대화형 audit를 실행해 false로 표시하세요.

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 새로운 excludes가 필요하다면 `.detect-secrets.cfg`에 추가하고, 동일한 `--exclude-files` / `--exclude-lines` 플래그로 baseline을 다시 생성하세요(config 파일은 참고용일 뿐이며, detect-secrets는 이를 자동으로 읽지 않습니다).

의도한 상태를 반영하도록 업데이트된 `.secrets.baseline`을 커밋하세요.

## 보안 문제 보고

OpenClaw에서 취약점을 발견하셨나요? 책임감 있게 보고해 주세요.

1. 이메일: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 수정되기 전에는 공개 게시를 하지 마세요
3. 원하신다면 익명으로 처리하며, 그렇지 않으면 기여자를 명시해 드립니다
