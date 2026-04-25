---
read_when:
    - 액세스 범위나 자동화를 넓히는 기능 추가
summary: 셸 접근 권한이 있는 AI Gateway를 실행할 때의 보안 고려 사항 및 위협 모델
title: 보안
x-i18n:
    generated_at: "2026-04-25T06:02:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a63386bac5db060ff1edc2260aae4a192ac666fc82956c8538915a970205215c
    source_path: gateway/security/index.md
    workflow: 15
---

<Warning>
  **개인 비서 신뢰 모델.** 이 가이드는 Gateway당 하나의 신뢰된
  운영자 경계(단일 사용자, 개인 비서 모델)를 가정합니다.
  OpenClaw는 하나의 에이전트나 Gateway를 여러 적대적 사용자가 공유하는
  환경에 대해 적대적 멀티테넌트 보안 경계로 설계되지 않았습니다. 혼합 신뢰 또는
  적대적 사용자 운영이 필요하다면 신뢰 경계를 분리하세요(별도 Gateway +
  자격 증명, 가능하면 별도 OS 사용자 또는 호스트).
</Warning>

## 먼저 범위를 정하기: 개인 비서 보안 모델

OpenClaw 보안 가이드는 **개인 비서** 배포를 가정합니다: 하나의 신뢰된 운영자 경계와, 그 안의 여러 에이전트입니다.

- 지원되는 보안 자세: Gateway당 하나의 사용자/신뢰 경계(가능하면 경계마다 하나의 OS 사용자/호스트/VPS).
- 지원되지 않는 보안 경계: 서로 신뢰하지 않거나 적대적인 사용자가 하나의 공유 Gateway/에이전트를 함께 사용하는 경우.
- 적대적 사용자 격리가 필요하면 신뢰 경계별로 분리하세요(별도 Gateway + 자격 증명, 가능하면 별도 OS 사용자/호스트).
- 여러 비신뢰 사용자가 하나의 도구 사용 가능 에이전트에 메시지를 보낼 수 있다면, 그들은 해당 에이전트에 위임된 동일한 도구 권한을 공유하는 것으로 간주해야 합니다.

이 페이지는 **그 모델 안에서의** 강화 방법을 설명합니다. 하나의 공유 Gateway에서 적대적 멀티테넌트 격리를 제공한다고 주장하지는 않습니다.

## 빠른 점검: `openclaw security audit`

참고: [정형 검증(보안 모델)](/ko/security/formal-verification)

특히 구성을 변경하거나 네트워크 노출면을 열었을 때 정기적으로 실행하세요:

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix`는 의도적으로 범위를 좁게 유지합니다: 일반적인 개방형 그룹
정책을 허용 목록으로 전환하고, `logging.redactSensitive: "tools"`를 복원하며,
상태/구성/include 파일 권한을 강화하고, Windows에서는 POSIX `chmod` 대신
Windows ACL 재설정을 사용합니다.

이는 흔한 실수들(Gateway 인증 노출, 브라우저 제어 노출, elevated 허용 목록,
파일시스템 권한, 느슨한 exec 승인, 개방형 채널 도구 노출)을 표시합니다.

OpenClaw는 제품이면서 동시에 실험이기도 합니다. 실제 메시징 표면과 실제 도구에
최전선 모델 동작을 연결하고 있기 때문입니다. **“완벽하게 안전한” 설정은 없습니다.**
목표는 다음을 의식적으로 결정하는 것입니다:

- 누가 봇과 대화할 수 있는가
- 봇이 어디에서 동작할 수 있는가
- 봇이 무엇에 접근할 수 있는가

동작에 필요한 최소한의 액세스부터 시작하고, 신뢰가 쌓이면서 점진적으로 넓히세요.

### 배포 및 호스트 신뢰

OpenClaw는 호스트와 구성 경계가 신뢰된다고 가정합니다:

- 누군가가 Gateway 호스트 상태/구성(`~/.openclaw`, `openclaw.json` 포함)을 수정할 수 있다면, 그 사용자는 신뢰된 운영자로 간주해야 합니다.
- 서로 신뢰하지 않거나 적대적인 여러 운영자를 위해 하나의 Gateway를 운영하는 것은 **권장되는 설정이 아닙니다**.
- 혼합 신뢰 팀의 경우, 별도 Gateway(또는 최소한 별도 OS 사용자/호스트)로 신뢰 경계를 분리하세요.
- 권장 기본값: 머신/호스트(또는 VPS)당 사용자 1명, 그 사용자당 Gateway 1개, 그리고 그 Gateway 안의 하나 이상의 에이전트.
- 하나의 Gateway 인스턴스 안에서, 인증된 운영자 액세스는 사용자별 테넌트 역할이 아니라 신뢰된 제어 평면 역할입니다.
- 세션 식별자(`sessionKey`, 세션 ID, 레이블)는 라우팅 선택자이지 인증 토큰이 아닙니다.
- 여러 사람이 하나의 도구 사용 가능 에이전트에 메시지를 보낼 수 있다면, 그들 모두가 동일한 권한 집합을 조작할 수 있습니다. 사용자별 세션/메모리 격리는 개인정보 보호에는 도움이 되지만, 공유 에이전트를 사용자별 호스트 권한 경계로 바꾸지는 않습니다.

### 공유 Slack 작업공간: 실제 위험

“Slack의 모든 사람이 봇에 메시지를 보낼 수 있다”면, 핵심 위험은 위임된 도구 권한입니다:

- 허용된 어떤 발신자든 에이전트 정책 범위 내에서 도구 호출(`exec`, 브라우저, 네트워크/파일 도구)을 유도할 수 있습니다.
- 한 발신자의 프롬프트/콘텐츠 주입이 공유 상태, 장치 또는 출력에 영향을 주는 동작을 일으킬 수 있습니다.
- 하나의 공유 에이전트가 민감한 자격 증명/파일을 가지고 있으면, 허용된 어떤 발신자든 도구 사용을 통해 유출을 유도할 수 있습니다.

팀 워크플로에는 최소 도구만 가진 별도 에이전트/Gateway를 사용하고, 개인 데이터 에이전트는 비공개로 유지하세요.

### 회사 공유 에이전트: 허용 가능한 패턴

이 패턴은 해당 에이전트를 사용하는 모든 사람이 동일한 신뢰 경계에 있고(예: 한 회사 팀),
에이전트가 업무 범위로 엄격히 제한되어 있을 때 허용 가능합니다.

- 전용 머신/VM/컨테이너에서 실행하세요.
- 해당 런타임에는 전용 OS 사용자 + 전용 브라우저/프로필/계정을 사용하세요.
- 그 런타임에 개인 Apple/Google 계정이나 개인 비밀번호 관리자/브라우저 프로필로 로그인하지 마세요.

동일한 런타임에서 개인 ID와 회사 ID를 섞으면, 분리가 무너지고 개인 데이터 노출 위험이 커집니다.

## Gateway와 Node 신뢰 개념

Gateway와 Node를 역할이 다른 하나의 운영자 신뢰 도메인으로 취급하세요:

- **Gateway**는 제어 평면이자 정책 표면입니다(`gateway.auth`, 도구 정책, 라우팅).
- **Node**는 해당 Gateway와 페어링된 원격 실행 표면입니다(명령, 장치 동작, 호스트 로컬 capability).
- Gateway에 인증된 호출자는 Gateway 범위에서 신뢰됩니다. 페어링 후에는 node 동작이 그 node에서의 신뢰된 운영자 동작이 됩니다.
- `sessionKey`는 라우팅/컨텍스트 선택용이지 사용자별 인증이 아닙니다.
- Exec 승인(허용 목록 + ask)은 운영자 의도를 위한 가드레일이지 적대적 멀티테넌트 격리를 위한 것이 아닙니다.
- 신뢰된 단일 운영자 설정에 대한 OpenClaw의 기본 제품값은 `gateway`/`node`에서의 호스트 exec를 승인 프롬프트 없이 허용하는 것입니다(`security="full"`, 이를 더 엄격히 하지 않으면 `ask="off"`). 이 기본값은 의도된 UX이며, 그 자체로 취약점이 아닙니다.
- Exec 승인은 정확한 요청 컨텍스트와 best-effort 직접 로컬 파일 피연산자에 바인딩됩니다. 모든 런타임/인터프리터 로더 경로를 의미적으로 모델링하지는 않습니다. 강한 경계가 필요하면 sandboxing과 호스트 격리를 사용하세요.

적대적 사용자 격리가 필요하면 OS 사용자/호스트별로 신뢰 경계를 분리하고 별도 Gateway를 실행하세요.

## 신뢰 경계 매트릭스

위험을 분류할 때 빠른 모델로 사용하세요:

| 경계 또는 제어                                          | 의미                                              | 흔한 오해                                                                    |
| ------------------------------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Gateway API에 대한 호출자 인증                    | “안전하려면 모든 프레임에 사용자별 서명이 필요하다”                          |
| `sessionKey`                                           | 컨텍스트/세션 선택을 위한 라우팅 키               | “세션 키는 사용자 인증 경계다”                                               |
| 프롬프트/콘텐츠 가드레일                               | 모델 악용 위험 감소                               | “프롬프트 주입만으로 인증 우회가 입증된다”                                   |
| `canvas.eval` / 브라우저 evaluate                      | 활성화 시 의도된 운영자 capability                | “이 신뢰 모델에서는 모든 JS eval 원시 기능이 자동으로 취약점이다”            |
| 로컬 TUI `!` 셸                                        | 운영자가 명시적으로 트리거하는 로컬 실행          | “로컬 셸 편의 명령은 원격 주입이다”                                          |
| Node 페어링 및 node 명령                               | 페어링된 장치에서의 운영자 수준 원격 실행         | “원격 장치 제어는 기본적으로 비신뢰 사용자 액세스로 취급해야 한다”           |
| `gateway.nodes.pairing.autoApproveCidrs`               | 선택적 신뢰 네트워크 node 등록 정책              | “기본적으로 꺼져 있는 허용 목록도 자동 페어링 취약점이다”                   |

## 설계상 취약점이 아닌 것들

<Accordion title="범위 밖인 흔한 보고">

이 패턴들은 자주 보고되지만, 실제 경계 우회가 입증되지 않는 한 대체로 조치 없이 종료됩니다:

- 정책, 인증 또는 sandbox 우회가 없는 프롬프트 주입 전용 체인.
- 하나의 공유 호스트 또는 구성에서 적대적 멀티테넌트 운영을 가정하는 주장.
- 공유 Gateway 설정에서 일반 운영자 읽기 경로 접근(예: `sessions.list` / `sessions.preview` / `chat.history`)을 IDOR로 분류하는 주장.
- localhost 전용 배포에 대한 지적(예: loopback 전용 Gateway에서 HSTS 부재).
- 이 리포지토리에 존재하지 않는 수신 경로에 대한 Discord 수신 Webhook 서명 지적.
- node 페어링 메타데이터를 `system.run`에 대한 숨겨진 두 번째 명령별 승인 계층으로 취급하는 보고. 실제 실행 경계는 여전히 Gateway의 전역 node 명령 정책과 node 자체의 exec 승인입니다.
- 구성된 `gateway.nodes.pairing.autoApproveCidrs`를 그 자체로 취약점으로 취급하는 보고. 이 설정은 기본적으로 비활성화되어 있고, 명시적인 CIDR/IP 항목이 필요하며, 요청된 범위가 없는 최초 `role: node` 페어링에만 적용되고, operator/browser/Control UI, WebChat, 역할 업그레이드, 범위 업그레이드, 메타데이터 변경, 공개 키 변경, 동일 호스트 loopback trusted-proxy 헤더 경로는 자동 승인하지 않습니다.
- `sessionKey`를 인증 토큰으로 취급하는 “사용자별 권한 부재” 보고.

</Accordion>

## 60초 안에 적용하는 강화된 기본값

먼저 이 기본값을 적용한 뒤, 신뢰된 에이전트별로 필요한 도구만 선택적으로 다시 활성화하세요:

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

이렇게 하면 Gateway를 로컬 전용으로 유지하고, DM을 격리하며, 제어 평면/런타임 도구를 기본적으로 비활성화합니다.

## 공유 받은편지함 빠른 규칙

한 명 이상이 봇에 DM을 보낼 수 있다면:

- `session.dmScope: "per-channel-peer"`를 설정하세요(다중 계정 채널이면 `"per-account-channel-peer"`).
- `dmPolicy: "pairing"` 또는 엄격한 허용 목록을 유지하세요.
- 공유 DM과 광범위한 도구 액세스를 절대 결합하지 마세요.
- 이는 협업/공유 받은편지함을 강화하지만, 사용자가 호스트/구성 쓰기 권한을 공유하는 경우 적대적 공동 테넌트 격리를 위한 설계는 아닙니다.

## 컨텍스트 가시성 모델

OpenClaw는 두 가지 개념을 분리합니다:

- **트리거 권한 부여**: 누가 에이전트를 트리거할 수 있는가(`dmPolicy`, `groupPolicy`, 허용 목록, 멘션 게이트).
- **컨텍스트 가시성**: 어떤 보조 컨텍스트가 모델 입력에 주입되는가(답장 본문, 인용 텍스트, 스레드 기록, 전달 메타데이터).

허용 목록은 트리거와 명령 권한 부여를 제어합니다. `contextVisibility` 설정은 보조 컨텍스트(인용 답장, 스레드 루트, 가져온 기록)를 활성 허용 목록 검사로 허용된 발신자 기준으로 어떻게 필터링할지 제어합니다:

- `contextVisibility: "all"`(기본값)은 보조 컨텍스트를 수신된 그대로 유지합니다.
- `contextVisibility: "allowlist"`는 보조 컨텍스트를 활성 허용 목록 검사에서 허용된 발신자로 필터링합니다.
- `contextVisibility: "allowlist_quote"`는 `allowlist`와 동일하게 동작하지만, 하나의 명시적 인용 답장은 유지합니다.

`contextVisibility`는 채널별 또는 방/대화별로 설정할 수 있습니다. 설정 세부 사항은 [그룹 채팅](/ko/channels/groups#context-visibility-and-allowlists)을 참고하세요.

권고형 분류 지침:

- “모델이 허용 목록에 없는 발신자의 인용문이나 과거 텍스트를 볼 수 있다”만 보여주는 주장은 `contextVisibility`로 해결할 수 있는 강화 이슈이지, 그 자체로 인증 또는 sandbox 경계 우회는 아닙니다.
- 보안 영향이 있으려면 보고서는 여전히 실제 신뢰 경계 우회(인증, 정책, sandbox, 승인 또는 다른 문서화된 경계)를 입증해야 합니다.

## audit가 검사하는 내용(개요)

- **수신 액세스** (DM 정책, 그룹 정책, 허용 목록): 낯선 사람이 봇을 트리거할 수 있는가?
- **도구 영향 범위** (elevated 도구 + 개방형 방): 프롬프트 주입이 셸/파일/네트워크 작업으로 이어질 수 있는가?
- **Exec 승인 드리프트** (`security=full`, `autoAllowSkills`, `strictInlineEval` 없는 인터프리터 허용 목록): 호스트 exec 가드레일이 여전히 의도한 대로 동작하는가?
  - `security="full"`은 광범위한 자세 경고이지 버그의 증거가 아닙니다. 이는 신뢰된 개인 비서 설정을 위한 선택된 기본값입니다. 위협 모델에 승인 또는 허용 목록 가드레일이 필요할 때만 더 엄격히 하세요.
- **네트워크 노출** (Gateway bind/auth, Tailscale Serve/Funnel, 약하거나 짧은 인증 토큰).
- **브라우저 제어 노출** (원격 node, relay 포트, 원격 CDP 엔드포인트).
- **로컬 디스크 위생** (권한, symlink, config include, “동기화 폴더” 경로).
- **Plugins** (명시적 허용 목록 없이 Plugin이 로드됨).
- **정책 드리프트/오구성** (sandbox Docker 설정이 구성되어 있지만 sandbox 모드가 꺼져 있음, `gateway.nodes.denyCommands` 패턴이 비효율적임 — 매칭은 정확한 명령 이름만 대상으로 하며(예: `system.run`) 셸 텍스트는 검사하지 않음; 위험한 `gateway.nodes.allowCommands` 항목; 전역 `tools.profile="minimal"`이 에이전트별 프로필로 재정의됨; 느슨한 도구 정책 아래 Plugin 소유 도구에 도달 가능).
- **런타임 기대 드리프트** (예: `tools.exec.host` 기본값이 이제 `auto`인데도 암묵적 exec가 여전히 `sandbox`를 의미한다고 가정하거나, sandbox 모드가 꺼져 있는데 `tools.exec.host="sandbox"`를 명시적으로 설정하는 경우).
- **모델 위생** (구성된 모델이 레거시처럼 보일 때 경고, 강제 차단은 아님).

`--deep`를 실행하면 OpenClaw는 best-effort 방식의 실제 Gateway 프로브도 시도합니다.

## 자격 증명 저장소 맵

액세스를 감사하거나 무엇을 백업할지 결정할 때 사용하세요:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 봇 토큰**: config/env 또는 `channels.telegram.tokenFile` (일반 파일만 허용, symlink 거부)
- **Discord 봇 토큰**: config/env 또는 SecretRef (env/file/exec 공급자)
- **Slack 토큰**: config/env (`channels.slack.*`)
- **페어링 허용 목록**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (기본 계정)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (기본이 아닌 계정)
- **모델 인증 프로필**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **파일 기반 비밀 payload(선택 사항)**: `~/.openclaw/secrets.json`
- **레거시 OAuth import**: `~/.openclaw/credentials/oauth.json`

## 보안 audit 체크리스트

audit가 결과를 출력하면 다음 우선순위로 처리하세요:

1. **“open” 상태 + 도구 활성화**: 먼저 DM/그룹을 잠그고(페어링/허용 목록), 그다음 도구 정책/sandboxing을 강화하세요.
2. **공용 네트워크 노출** (LAN bind, Funnel, 인증 없음): 즉시 수정하세요.
3. **원격 브라우저 제어 노출**: 운영자 액세스처럼 취급하세요(tailnet 전용, node를 신중히 페어링, 공용 노출 지양).
4. **권한**: 상태/구성/자격 증명/인증이 그룹/전체 읽기 가능하지 않도록 하세요.
5. **Plugins**: 명시적으로 신뢰하는 것만 로드하세요.
6. **모델 선택**: 도구를 사용하는 모든 봇에는 현대적이고 지시 강화가 잘 된 모델을 우선 사용하세요.

## 보안 audit 용어집

각 audit 결과는 구조화된 `checkId`로 식별됩니다(예:
`gateway.bind_no_auth` 또는 `tools.exec.security_full_configured`). 흔한
치명도 클래스는 다음과 같습니다:

- `fs.*` — 상태, 구성, 자격 증명, 인증 프로필의 파일시스템 권한.
- `gateway.*` — bind 모드, 인증, Tailscale, Control UI, trusted-proxy 설정.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` — 표면별 강화.
- `plugins.*`, `skills.*` — Plugin/skill 공급망 및 스캔 결과.
- `security.exposure.*` — 액세스 정책과 도구 영향 범위가 만나는 교차 점검.

전체 카탈로그와 치명도 수준, 수정 키, 자동 수정 지원은
[보안 audit 검사](/ko/gateway/security/audit-checks)를 참고하세요.

## HTTP를 통한 Control UI

Control UI는 장치 ID 생성을 위해 **보안 컨텍스트**(HTTPS 또는 localhost)가 필요합니다.
`gateway.controlUi.allowInsecureAuth`는 로컬 호환성 토글입니다:

- localhost에서는 페이지가 비보안 HTTP로 로드될 때 장치 ID 없이도 Control UI 인증을 허용합니다.
- 페어링 검사를 우회하지는 않습니다.
- 원격(non-localhost) 장치 ID 요구 사항을 완화하지도 않습니다.

HTTPS(Tailscale Serve)를 사용하거나 `127.0.0.1`에서 UI를 여는 것이 좋습니다.

비상 상황 전용으로 `gateway.controlUi.dangerouslyDisableDeviceAuth`는
장치 ID 검사를 완전히 비활성화합니다. 이는 심각한 보안 저하이므로,
활발히 디버깅 중이고 빠르게 되돌릴 수 있을 때만 켜 두세요.

이러한 위험한 플래그와는 별개로, 성공적인 `gateway.auth.mode: "trusted-proxy"`는
장치 ID 없이도 **운영자** Control UI 세션을 허용할 수 있습니다. 이는
의도된 인증 모드 동작이지 `allowInsecureAuth` 지름길이 아니며,
node 역할 Control UI 세션으로 확장되지는 않습니다.

`openclaw security audit`는 이 설정이 활성화되면 경고를 출력합니다.

## 안전하지 않거나 위험한 플래그 요약

`openclaw security audit`는 알려진 안전하지 않거나 위험한 디버그 스위치가 활성화되면
`config.insecure_or_dangerous_flags`를 발생시킵니다. 프로덕션에서는 이를
설정하지 마세요.

<AccordionGroup>
  <Accordion title="현재 audit가 추적하는 플래그">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`
  </Accordion>

  <Accordion title="config 스키마의 모든 `dangerous*` / `dangerously*` 키">
    Control UI 및 브라우저:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    채널 이름 매칭(번들 및 Plugin 채널, 해당하는 경우
    `accounts.<accountId>`별로도 사용 가능):

    - `channels.discord.dangerouslyAllowNameMatching`
    - `channels.slack.dangerouslyAllowNameMatching`
    - `channels.googlechat.dangerouslyAllowNameMatching`
    - `channels.msteams.dangerouslyAllowNameMatching`
    - `channels.synology-chat.dangerouslyAllowNameMatching` (Plugin 채널)
    - `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (Plugin 채널)
    - `channels.zalouser.dangerouslyAllowNameMatching` (Plugin 채널)
    - `channels.irc.dangerouslyAllowNameMatching` (Plugin 채널)
    - `channels.mattermost.dangerouslyAllowNameMatching` (Plugin 채널)

    네트워크 노출:

    - `channels.telegram.network.dangerouslyAllowPrivateNetwork` (계정별로도 가능)

    Sandbox Docker(기본값 + 에이전트별):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## 역방향 프록시 구성

Gateway를 역방향 프록시(nginx, Caddy, Traefik 등) 뒤에서 실행하는 경우,
전달된 클라이언트 IP를 올바르게 처리하려면 `gateway.trustedProxies`를 구성하세요.

Gateway가 **`trustedProxies`에 없는 주소**에서 온 프록시 헤더를 감지하면,
해당 연결을 로컬 클라이언트로 취급하지 **않습니다**. Gateway 인증이 비활성화되어 있으면,
그 연결은 거부됩니다. 이렇게 하면 프록시된 연결이 localhost에서 온 것처럼 보여
자동 신뢰를 받는 인증 우회를 방지할 수 있습니다.

`gateway.trustedProxies`는 `gateway.auth.mode: "trusted-proxy"`에도 영향을 주지만,
이 인증 모드는 더 엄격합니다:

- trusted-proxy 인증은 **loopback 소스 프록시에서 fail closed**합니다
- 동일 호스트 loopback 역방향 프록시는 여전히 `gateway.trustedProxies`를
  로컬 클라이언트 감지 및 전달 IP 처리에 사용할 수 있습니다
- 동일 호스트 loopback 역방향 프록시에서는 `gateway.auth.mode: "trusted-proxy"` 대신
  token/password 인증을 사용하세요

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # 선택 사항. 기본값 false.
  # 프록시가 X-Forwarded-For를 제공할 수 없는 경우에만 활성화하세요.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

`trustedProxies`가 구성되면 Gateway는 `X-Forwarded-For`를 사용해 클라이언트 IP를 결정합니다. `gateway.allowRealIpFallback: true`가 명시적으로 설정되지 않는 한 `X-Real-IP`는 기본적으로 무시됩니다.

신뢰된 프록시 헤더가 있다고 해서 node 장치 페어링이 자동으로 신뢰되는 것은 아닙니다.
`gateway.nodes.pairing.autoApproveCidrs`는 별도의, 기본적으로 비활성화된
운영자 정책입니다. 이 기능이 활성화되어 있어도, 로컬 호출자가 해당
헤더를 위조할 수 있으므로 loopback 소스 trusted-proxy 헤더 경로는
node 자동 승인에서 제외됩니다.

좋은 역방향 프록시 동작(들어오는 전달 헤더 덮어쓰기):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

나쁜 역방향 프록시 동작(신뢰되지 않은 전달 헤더 추가/유지):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS 및 origin 참고 사항

- OpenClaw Gateway는 로컬/loopback 우선입니다. 역방향 프록시에서 TLS를 종료한다면, 프록시가 바라보는 HTTPS 도메인에서 HSTS를 설정하세요.
- Gateway 자체가 HTTPS를 종료한다면 `gateway.http.securityHeaders.strictTransportSecurity`를 설정해 OpenClaw 응답에서 HSTS 헤더를 보낼 수 있습니다.
- 자세한 배포 안내는 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth#tls-termination-and-hsts)에 있습니다.
- non-loopback Control UI 배포에서는 기본적으로 `gateway.controlUi.allowedOrigins`가 필요합니다.
- `gateway.controlUi.allowedOrigins: ["*"]`는 강화된 기본값이 아니라 명시적 전체 허용 브라우저 origin 정책입니다. 엄격히 통제된 로컬 테스트가 아니면 피하세요.
- 일반적인 loopback 예외가 활성화되어 있어도 loopback에서의 브라우저 origin 인증 실패는 여전히 속도 제한되지만, 잠금 키는 공유 localhost 버킷 하나가 아니라 정규화된 `Origin` 값별로 범위가 지정됩니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host 헤더 origin 대체 모드를 활성화합니다. 운영자가 선택한 위험한 정책으로 취급하세요.
- DNS rebinding과 프록시 host 헤더 동작은 배포 강화 문제로 취급하세요. `trustedProxies`는 엄격히 유지하고 Gateway를 공용 인터넷에 직접 노출하지 마세요.

## 로컬 세션 로그는 디스크에 저장됩니다

OpenClaw는 세션 연속성과(선택적으로) 세션 메모리 인덱싱을 위해 세션 전사를
`~/.openclaw/agents/<agentId>/sessions/*.jsonl` 아래 디스크에 저장합니다.
이는 세션 연속성에 필요하지만, 동시에
**파일시스템 액세스가 있는 모든 프로세스/사용자가 해당 로그를 읽을 수 있다**는 뜻이기도 합니다.
디스크 액세스를 신뢰 경계로 취급하고 `~/.openclaw` 권한을 엄격히 제한하세요
(아래 audit 섹션 참고). 에이전트 간 더 강한 격리가 필요하다면 별도 OS 사용자 또는 별도 호스트 아래에서 실행하세요.

## Node 실행(`system.run`)

macOS node가 페어링되어 있으면 Gateway는 해당 node에서 `system.run`을 호출할 수 있습니다. 이는 Mac에서의 **원격 코드 실행**입니다:

- Node 페어링(승인 + 토큰)이 필요합니다.
- Gateway node 페어링은 명령별 승인 표면이 아닙니다. 이는 node ID/신뢰와 토큰 발급을 설정합니다.
- Gateway는 `gateway.nodes.allowCommands` / `denyCommands`를 통해 거친 전역 node 명령 정책을 적용합니다.
- Mac에서는 **설정 → Exec approvals**에서 제어합니다(security + ask + allowlist).
- node별 `system.run` 정책은 node 자체의 exec 승인 파일(`exec.approvals.node.*`)이며, Gateway의 전역 명령 ID 정책보다 더 엄격하거나 더 느슨할 수 있습니다.
- `security="full"` 및 `ask="off"`로 실행되는 node는 기본 신뢰 운영자 모델을 따르는 것입니다. 배포에서 더 엄격한 승인 또는 허용 목록 자세를 명시적으로 요구하지 않는 한, 이를 예상된 동작으로 취급하세요.
- 승인 모드는 정확한 요청 컨텍스트와, 가능한 경우 하나의 구체적인 로컬 스크립트/파일 피연산자에 바인딩됩니다. 인터프리터/런타임 명령에 대해 OpenClaw가 정확히 하나의 직접 로컬 파일을 식별할 수 없으면, 전체 의미적 범위를 보장한다고 약속하는 대신 승인 기반 실행이 거부됩니다.
- `host=node`의 경우, 승인 기반 실행은 준비된 표준
  `systemRunPlan`도 저장합니다. 이후 승인된 전달은 저장된 계획을 재사용하며,
  Gateway 검증은 승인 요청 생성 후 호출자가 command/cwd/session 컨텍스트를 수정하는 것을 거부합니다.
- 원격 실행을 원하지 않으면 security를 **deny**로 설정하고 해당 Mac의 node 페어링을 제거하세요.

이 구분은 분류에 중요합니다:

- 다시 연결된 페어링된 node가 다른 명령 목록을 광고하는 것은, Gateway 전역 정책과 node의 로컬 exec 승인이 여전히 실제 실행 경계를 강제하는 한, 그 자체로 취약점이 아닙니다.
- node 페어링 메타데이터를 숨겨진 두 번째 명령별 승인 계층으로 취급하는 보고는 대개 정책/UX 혼동이지 보안 경계 우회가 아닙니다.

## 동적 Skills(watcher / 원격 nodes)

OpenClaw는 세션 중간에 Skills 목록을 새로 고칠 수 있습니다:

- **Skills watcher**: `SKILL.md` 변경 사항이 다음 에이전트 턴에서 Skills 스냅샷을 갱신할 수 있습니다.
- **원격 nodes**: macOS node가 연결되면 macOS 전용 Skills가 적격 상태가 될 수 있습니다(bin 프로빙 기준).

skill 폴더는 **신뢰된 코드**로 취급하고, 수정 권한이 있는 사용자를 제한하세요.

## 위협 모델

AI 비서는 다음을 할 수 있습니다:

- 임의의 셸 명령 실행
- 파일 읽기/쓰기
- 네트워크 서비스 접근
- 누구에게나 메시지 전송(WhatsApp 액세스를 부여한 경우)

당신에게 메시지를 보내는 사람들은 다음을 시도할 수 있습니다:

- AI를 속여 나쁜 일을 하게 만들기
- 데이터 접근을 위한 사회공학
- 인프라 세부 정보 탐색

## 핵심 개념: 지능보다 먼저 액세스 제어

여기서 대부분의 실패는 정교한 익스플로잇이 아니라 —
“누군가가 봇에 메시지를 보냈고, 봇이 시키는 대로 했다”입니다.

OpenClaw의 입장:

- **먼저 ID:** 누가 봇과 대화할 수 있는지 결정하세요(DM 페어링 / 허용 목록 / 명시적 “open”).
- **그다음 범위:** 봇이 어디에서 동작할 수 있는지 결정하세요(그룹 허용 목록 + 멘션 게이팅, 도구, sandboxing, 장치 권한).
- **마지막이 모델:** 모델은 조작될 수 있다고 가정하고, 조작되더라도 영향 범위가 제한되도록 설계하세요.

## 명령 권한 부여 모델

슬래시 명령과 지시문은 **권한 있는 발신자**에 대해서만 처리됩니다. 권한은
채널 허용 목록/페어링과 `commands.useAccessGroups`에서 파생됩니다([구성](/ko/gateway/configuration)
및 [슬래시 명령](/ko/tools/slash-commands) 참고). 채널 허용 목록이 비어 있거나 `"*"`를 포함하면,
해당 채널의 명령은 사실상 개방됩니다.

`/exec`는 권한 있는 운영자를 위한 세션 전용 편의 기능입니다. 이는 구성을 쓰거나
다른 세션을 변경하지 않습니다.

## 제어 평면 도구 위험

내장 도구 두 개는 지속적인 제어 평면 변경을 할 수 있습니다:

- `gateway`는 `config.schema.lookup` / `config.get`으로 구성을 검사할 수 있고, `config.apply`, `config.patch`, `update.run`으로 지속적 변경을 가할 수 있습니다.
- `cron`은 원래 채팅/작업이 끝난 뒤에도 계속 실행되는 예약 작업을 만들 수 있습니다.

owner 전용 `gateway` 런타임 도구는 여전히
`tools.exec.ask` 또는 `tools.exec.security` 재작성을 거부합니다. 레거시 `tools.bash.*` 별칭도
쓰기 전에 동일한 보호된 exec 경로로 정규화됩니다.
에이전트 구동 `gateway config.apply` 및 `gateway config.patch` 편집은
기본적으로 fail-closed입니다. 프롬프트, 모델, 멘션 게이팅 경로 중
일부 좁은 집합만 에이전트가 조정할 수 있습니다. 따라서 새 민감 구성 트리는
의도적으로 허용 목록에 추가하지 않는 한 보호됩니다.

비신뢰 콘텐츠를 처리하는 모든 에이전트/표면에서는 기본적으로 이를 거부하세요:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false`는 재시작 작업만 차단합니다. `gateway` 구성/업데이트 작업은 비활성화하지 않습니다.

## Plugins

Plugins는 Gateway와 **같은 프로세스 내에서** 실행됩니다. 신뢰된 코드로 취급하세요:

- 신뢰할 수 있는 소스의 Plugin만 설치하세요.
- 명시적인 `plugins.allow` 허용 목록을 사용하는 것이 좋습니다.
- 활성화 전에 Plugin 구성을 검토하세요.
- Plugin 변경 후 Gateway를 재시작하세요.
- Plugin을 설치하거나 업데이트하는 경우(`openclaw plugins install <package>`, `openclaw plugins update <id>`), 이를 비신뢰 코드를 실행하는 것처럼 취급하세요:
  - 설치 경로는 활성 Plugin 설치 루트 아래의 Plugin별 디렉터리입니다.
  - OpenClaw는 설치/업데이트 전에 내장 위험 코드 스캔을 실행합니다. `critical` 결과는 기본적으로 차단합니다.
  - OpenClaw는 `npm pack`을 사용한 다음 해당 디렉터리에서 `npm install --omit=dev`를 실행합니다(npm 라이프사이클 스크립트는 설치 중 코드를 실행할 수 있음).
  - 고정된 정확한 버전(`@scope/pkg@1.2.3`)을 선호하고, 활성화 전에 디스크에 풀린 코드를 검사하세요.
  - `--dangerously-force-unsafe-install`은 Plugin 설치/업데이트 흐름에서 내장 스캔의 오탐에 대한 비상 탈출용입니다. 이는 Plugin `before_install` 훅 정책 차단을 우회하지 않으며 스캔 실패도 우회하지 않습니다.
  - Gateway 기반 skill 의존성 설치도 동일한 위험/의심 분리를 따릅니다: 내장 `critical` 결과는 호출자가 명시적으로 `dangerouslyForceUnsafeInstall`을 설정하지 않는 한 차단되며, 의심 결과는 경고만 유지합니다. `openclaw skills install`은 여전히 별도의 ClawHub skill 다운로드/설치 흐름입니다.

자세한 내용: [Plugins](/ko/tools/plugin)

## DM 액세스 모델: pairing, allowlist, open, disabled

현재 DM을 지원하는 모든 채널은 메시지가 처리되기 **전에**
수신 DM을 차단하는 DM 정책(`dmPolicy` 또는 `*.dm.policy`)을 지원합니다:

- `pairing`(기본값): 알 수 없는 발신자는 짧은 페어링 코드를 받고, 승인되기 전까지 봇은 메시지를 무시합니다. 코드는 1시간 후 만료되며, 새 요청이 생성되기 전까지 반복 DM에는 코드를 다시 보내지 않습니다. 보류 요청은 기본적으로 **채널당 3개**로 제한됩니다.
- `allowlist`: 알 수 없는 발신자는 차단됩니다(페어링 핸드셰이크 없음).
- `open`: 누구나 DM할 수 있도록 허용합니다(공개). **채널 허용 목록에 `"*"`가 포함되어 있어야 합니다**(명시적 opt-in).
- `disabled`: 수신 DM을 완전히 무시합니다.

CLI로 승인:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

세부 정보 + 디스크 파일: [페어링](/ko/channels/pairing)

## DM 세션 격리(다중 사용자 모드)

기본적으로 OpenClaw는 **모든 DM을 메인 세션으로 라우팅**하여 비서가 장치와 채널 전반에서 연속성을 갖게 합니다. **여러 사람**이 봇에 DM할 수 있다면(open DM 또는 다중 인원 허용 목록), DM 세션을 격리하는 것을 고려하세요:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

이렇게 하면 그룹 채팅은 격리된 상태로 유지하면서 사용자 간 컨텍스트 누출을 방지할 수 있습니다.

이는 메시징 컨텍스트 경계이지 호스트 관리자 경계가 아닙니다. 사용자가 서로 적대적이고 동일한 Gateway 호스트/구성을 공유한다면, 대신 신뢰 경계별로 별도 Gateway를 실행하세요.

### 보안 DM 모드(권장)

위 스니펫을 **보안 DM 모드**로 취급하세요:

- 기본값: `session.dmScope: "main"` (모든 DM이 연속성을 위해 하나의 세션을 공유).
- 로컬 CLI 온보딩 기본값: 설정되지 않은 경우 `session.dmScope: "per-channel-peer"`를 기록(기존 명시적 값은 유지).
- 보안 DM 모드: `session.dmScope: "per-channel-peer"` (각 채널+발신자 쌍이 격리된 DM 컨텍스트를 가짐).
- 채널 간 피어 격리: `session.dmScope: "per-peer"` (각 발신자가 동일 유형의 모든 채널에 걸쳐 하나의 세션을 가짐).

같은 채널에서 여러 계정을 운영한다면 대신 `per-account-channel-peer`를 사용하세요. 같은 사람이 여러 채널에서 연락한다면 `session.identityLinks`를 사용해 그 DM 세션을 하나의 표준 ID로 합치세요. [세션 관리](/ko/concepts/session)와 [구성](/ko/gateway/configuration)을 참고하세요.

## DM 및 그룹 허용 목록

OpenClaw에는 “누가 나를 트리거할 수 있는가?”에 대한 두 개의 별도 계층이 있습니다:

- **DM 허용 목록** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; 레거시: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): direct message에서 누가 봇과 대화할 수 있는지.
  - `dmPolicy="pairing"`일 때 승인 내역은 `~/.openclaw/credentials/` 아래의 계정 범위 페어링 허용 목록 저장소에 기록되며(기본 계정은 `<channel>-allowFrom.json`, 기본이 아닌 계정은 `<channel>-<accountId>-allowFrom.json`), config 허용 목록과 병합됩니다.
- **그룹 허용 목록**(채널별): 봇이 어떤 그룹/채널/guild에서 메시지를 아예 받을지.
  - 일반적인 패턴:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: `requireMention` 같은 그룹별 기본값. 설정되면 그룹 허용 목록 역할도 합니다(전체 허용 동작을 유지하려면 `"*"` 포함).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: 그룹 세션 *내부에서* 누가 봇을 트리거할 수 있는지 제한(WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: 표면별 허용 목록 + 멘션 기본값.
  - 그룹 검사는 이 순서로 실행됩니다: 먼저 `groupPolicy`/그룹 허용 목록, 그다음 멘션/답장 활성화.
  - 봇 메시지에 답장하는 것(암묵적 멘션)은 `groupAllowFrom` 같은 발신자 허용 목록을 우회하지 않습니다.
  - **보안 참고:** `dmPolicy="open"` 및 `groupPolicy="open"`은 최후 수단 설정으로 취급하세요. 거의 사용하지 말아야 하며, 방의 모든 구성원을 완전히 신뢰하지 않는 한 페어링 + 허용 목록을 선호하세요.

자세한 내용: [구성](/ko/gateway/configuration) 및 [그룹](/ko/channels/groups)

## 프롬프트 주입(무엇이며, 왜 중요한가)

프롬프트 주입은 공격자가 모델을 조작하도록 메시지를 만드는 경우입니다(“지시를 무시해라”, “파일시스템을 덤프해라”, “이 링크를 열고 명령을 실행해라” 등).

강력한 시스템 프롬프트가 있어도 **프롬프트 주입은 해결된 문제가 아닙니다**. 시스템 프롬프트 가드레일은 연성 지침일 뿐이며, 강한 강제력은 도구 정책, exec 승인, sandboxing, 채널 허용 목록에서 나옵니다(운영자는 설계상 이것들을 비활성화할 수도 있습니다). 실제로 도움이 되는 것은:

- 수신 DM은 잠근 상태로 유지하세요(페어링/허용 목록).
- 그룹에서는 멘션 게이팅을 우선 사용하고, 공용 방에서 “항상 켜진” 봇은 피하세요.
- 링크, 첨부파일, 붙여넣은 지침은 기본적으로 적대적이라고 가정하세요.
- 민감한 도구 실행은 sandbox에서 수행하고, 비밀은 에이전트가 접근 가능한 파일시스템 밖에 두세요.
- 참고: sandboxing은 opt-in입니다. sandbox 모드가 꺼져 있으면 암묵적 `host=auto`는 Gateway 호스트로 해석됩니다. 명시적 `host=sandbox`는 사용 가능한 sandbox 런타임이 없기 때문에 여전히 fail closed합니다. 이 동작을 config에서 명시적으로 나타내고 싶다면 `host=gateway`를 설정하세요.
- 고위험 도구(`exec`, `browser`, `web_fetch`, `web_search`)는 신뢰된 에이전트 또는 명시적 허용 목록으로 제한하세요.
- 인터프리터(`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`)를 허용 목록에 넣는다면 `tools.exec.strictInlineEval`을 활성화해서 inline eval 형식도 명시적 승인이 필요하도록 하세요.
- 셸 승인 분석은 **인용되지 않은 heredoc** 내부의 POSIX 매개변수 확장 형식(`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`)도 거부하므로, 허용 목록에 있는 heredoc 본문이 일반 텍스트처럼 보이면서 셸 확장을 몰래 통과시키지 못합니다. 리터럴 본문 의미를 사용하려면 heredoc 종료자를 인용하세요(예: `<<'EOF'`). 변수를 확장했을 인용되지 않은 heredoc은 거부됩니다.
- **모델 선택은 중요합니다:** 오래되거나 작거나 레거시인 모델은 프롬프트 주입 및 도구 오용에 훨씬 취약합니다. 도구 사용 가능 에이전트에는 최신 세대의 지시 강화가 잘 된 가장 강력한 모델을 사용하세요.

비신뢰로 취급해야 할 위험 신호:

- “이 파일/URL을 읽고 거기 적힌 대로 정확히 해.”
- “시스템 프롬프트나 안전 규칙을 무시해.”
- “숨겨진 지침이나 도구 출력을 공개해.”
- “`~/.openclaw`나 로그의 전체 내용을 붙여 넣어.”

## 외부 콘텐츠 특수 토큰 정리

OpenClaw는 래핑된 외부 콘텐츠와 메타데이터가 모델에 도달하기 전에, 자체 호스팅 LLM 채팅 템플릿에서 흔히 쓰이는 특수 토큰 리터럴을 제거합니다. 적용되는 마커 계열에는 Qwen/ChatML, Llama, Gemma, Mistral, Phi, GPT-OSS 역할/턴 토큰이 포함됩니다.

이유:

- 자체 호스팅 모델을 앞단에 둔 OpenAI 호환 백엔드는 사용자 텍스트에 나타나는 특수 토큰을 마스킹하지 않고 그대로 보존하는 경우가 있습니다. 공격자가 수신 외부 콘텐츠(가져온 페이지, 이메일 본문, 파일 내용 도구 출력)에 쓸 수 있다면, 합성된 `assistant` 또는 `system` 역할 경계를 주입해 래핑된 콘텐츠 가드레일을 벗어날 수 있습니다.
- 정리는 외부 콘텐츠 래핑 계층에서 수행되므로, 공급자별이 아니라 fetch/read 도구와 수신 채널 콘텐츠 전반에 일관되게 적용됩니다.
- 발신 모델 응답에는 이미 유출된 `<tool_call>`, `<function_calls>` 및 유사한 스캐폴딩을 사용자 표시 답장에서 제거하는 별도의 정리기가 있습니다. 외부 콘텐츠 정리기는 그 수신 측 대응물입니다.

이 기능이 이 페이지의 다른 강화 수단을 대체하는 것은 아닙니다. `dmPolicy`, 허용 목록, exec 승인, sandboxing, `contextVisibility`가 여전히 주된 역할을 합니다. 이는 특수 토큰을 그대로 전달하는 자체 호스팅 스택에 대한 특정 토크나이저 계층 우회 하나를 막습니다.

## 안전하지 않은 외부 콘텐츠 우회 플래그

OpenClaw에는 외부 콘텐츠 안전 래핑을 비활성화하는 명시적 우회 플래그가 있습니다:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Cron payload 필드 `allowUnsafeExternalContent`

가이드:

- 프로덕션에서는 이를 설정하지 않거나 false로 유지하세요.
- 엄격히 제한된 디버깅에만 일시적으로 활성화하세요.
- 활성화한 경우, 해당 에이전트를 격리하세요(sandbox + 최소 도구 + 전용 세션 네임스페이스).

훅 위험 참고:

- 훅 payload는 신뢰할 수 없는 콘텐츠입니다. 전달이 직접 제어하는 시스템에서 오더라도 마찬가지입니다(메일/문서/웹 콘텐츠는 프롬프트 주입을 실을 수 있음).
- 약한 모델 등급은 이 위험을 더 키웁니다. 훅 기반 자동화에는 강한 최신 모델 등급을 우선 사용하고, 도구 정책은 엄격하게 유지하세요(`tools.profile: "messaging"` 또는 그보다 엄격), 가능하면 sandboxing도 함께 사용하세요.

### 프롬프트 주입은 공개 DM이 없어도 발생할 수 있습니다

**오직 당신만** 봇에 메시지를 보낼 수 있어도, 봇이 읽는
어떤 **비신뢰 콘텐츠**(웹 검색/가져오기 결과, 브라우저 페이지,
이메일, 문서, 첨부파일, 붙여넣은 로그/코드)를 통해서도 프롬프트 주입은 발생할 수 있습니다. 즉,
위협 표면은 발신자만이 아니라 **콘텐츠 자체**이기도 합니다.

도구가 활성화되어 있을 때 전형적인 위험은 컨텍스트 유출이나
도구 호출 유발입니다. 다음으로 영향 범위를 줄이세요:

- 비신뢰 콘텐츠를 요약하는 읽기 전용 또는 도구 비활성화 **reader agent**를 사용하고,
  그 요약만 메인 에이전트에 전달하세요.
- 필요한 경우가 아니면 도구 사용 가능 에이전트에서는 `web_search` / `web_fetch` / `browser`를 꺼 두세요.
- OpenResponses URL 입력(`input_file` / `input_image`)의 경우
  `gateway.http.endpoints.responses.files.urlAllowlist` 및
  `gateway.http.endpoints.responses.images.urlAllowlist`를 엄격하게 설정하고, `maxUrlParts`는 낮게 유지하세요.
  빈 허용 목록은 설정되지 않은 것으로 취급됩니다. URL 가져오기를 완전히 비활성화하려면
  `files.allowUrl: false` / `images.allowUrl: false`를 사용하세요.
- OpenResponses 파일 입력의 경우, 디코딩된 `input_file` 텍스트도 여전히
  **비신뢰 외부 콘텐츠**로 주입됩니다. Gateway가 이를 로컬에서 디코딩했다는 이유만으로
  파일 텍스트를 신뢰된 것으로 간주하지 마세요. 이 주입 블록은 여전히 명시적인
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` 경계 마커와 `Source: External`
  메타데이터를 담고 있으며, 이 경로에서는 더 긴 `SECURITY NOTICE:` 배너만 생략됩니다.
- 첨부 문서에서 미디어 이해가 텍스트를 추출해 미디어 프롬프트에 추가할 때도 동일한 마커 기반 래핑이 적용됩니다.
- 비신뢰 입력을 다루는 모든 에이전트에 sandboxing과 엄격한 도구 허용 목록을 활성화하세요.
- 비밀은 프롬프트에 넣지 말고, Gateway 호스트의 env/config로 전달하세요.

### 자체 호스팅 LLM 백엔드

vLLM, SGLang, TGI, LM Studio 또는 사용자 지정 Hugging Face 토크나이저 스택 같은
OpenAI 호환 자체 호스팅 백엔드는
채팅 템플릿 특수 토큰 처리 방식에서 호스팅 공급자와 다를 수 있습니다. 백엔드가
`<|im_start|>`, `<|start_header_id|>`, `<start_of_turn>` 같은
리터럴 문자열을 사용자 콘텐츠 안에서도 구조적 채팅 템플릿 토큰으로 토크나이즈하면,
비신뢰 텍스트가 토크나이저 계층에서 역할 경계를 위조하려고 시도할 수 있습니다.

OpenClaw는 래핑된 외부 콘텐츠를 모델에 전달하기 전에 일반적인
모델 계열 특수 토큰 리터럴을 제거합니다. 외부 콘텐츠
래핑은 계속 활성화하고, 가능하다면 사용자 제공 콘텐츠의 특수
토큰을 분할하거나 이스케이프하는 백엔드 설정을 우선 사용하세요. OpenAI
및 Anthropic 같은 호스팅 공급자는 이미 자체 요청 측 정리를 적용합니다.

### 모델 강도(보안 참고)

프롬프트 주입 저항성은 모델 등급 전반에서 **균일하지 않습니다**. 더 작고 저렴한 모델일수록 일반적으로 도구 오용과 지시 탈취에 더 취약하며, 특히 적대적 프롬프트 아래에서 그렇습니다.

<Warning>
도구 사용 가능 에이전트나 비신뢰 콘텐츠를 읽는 에이전트의 경우, 오래되거나 작은 모델의 프롬프트 주입 위험은 대체로 너무 높습니다. 그런 작업 부하를 약한 모델 등급에서 실행하지 마세요.
</Warning>

권장 사항:

- 도구를 실행하거나 파일/네트워크에 접근할 수 있는 모든 봇에는 **최신 세대의 최고 등급 모델**을 사용하세요.
- 도구 사용 가능 에이전트나 비신뢰 받은편지함에는 **오래되거나 약하거나 작은 등급**을 사용하지 마세요. 프롬프트 주입 위험이 너무 큽니다.
- 더 작은 모델을 반드시 써야 한다면 **영향 범위를 줄이세요**(읽기 전용 도구, 강한 sandboxing, 최소 파일시스템 접근, 엄격한 허용 목록).
- 작은 모델을 실행할 때는 **모든 세션에 sandboxing을 활성화**하고, 입력이 엄격히 통제되지 않는 한 **web_search/web_fetch/browser를 비활성화**하세요.
- 신뢰된 입력만 있고 도구가 없는 채팅 전용 개인 비서라면, 작은 모델도 대체로 괜찮습니다.

## 그룹에서의 추론 및 상세 출력

`/reasoning`, `/verbose`, `/trace`는 내부 추론, 도구
출력 또는 Plugin 진단 정보를 노출할 수 있으며,
이는 공용 채널에 의도되지 않았을 수 있습니다. 그룹 설정에서는 이를 **디버그 전용**
으로 취급하고, 명시적으로 필요하지 않다면 꺼 두세요.

가이드:

- 공용 방에서는 `/reasoning`, `/verbose`, `/trace`를 비활성화된 상태로 유지하세요.
- 활성화한다면 신뢰된 DM 또는 엄격히 통제된 방에서만 하세요.
- 기억하세요: verbose 및 trace 출력에는 도구 인수, URL, Plugin 진단, 모델이 본 데이터가 포함될 수 있습니다.

## 구성 강화 예시

### 파일 권한

Gateway 호스트에서 config + state를 비공개로 유지하세요:

- `~/.openclaw/openclaw.json`: `600` (사용자 읽기/쓰기만)
- `~/.openclaw`: `700` (사용자만)

`openclaw doctor`는 이러한 권한을 경고하고 강화하도록 제안할 수 있습니다.

### 네트워크 노출(bind, port, firewall)

Gateway는 **WebSocket + HTTP**를 단일 포트로 다중화합니다:

- 기본값: `18789`
- config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

이 HTTP 표면에는 Control UI와 canvas host가 포함됩니다:

- Control UI(SPA 자산) (기본 base path `/`)
- Canvas host: `/__openclaw__/canvas/` 및 `/__openclaw__/a2ui/` (임의 HTML/JS; 비신뢰 콘텐츠로 취급)

일반 브라우저에서 canvas 콘텐츠를 로드한다면, 다른 비신뢰 웹 페이지처럼 취급하세요:

- canvas host를 비신뢰 네트워크/사용자에게 노출하지 마세요.
- 함의를 완전히 이해하지 못한다면 canvas 콘텐츠가 권한 있는 웹 표면과 동일 origin을 공유하게 하지 마세요.

bind 모드는 Gateway가 어디서 수신 대기할지 제어합니다:

- `gateway.bind: "loopback"`(기본값): 로컬 클라이언트만 연결 가능.
- non-loopback bind(`"lan"`, `"tailnet"`, `"custom"`)는 공격 표면을 넓힙니다. Gateway 인증(공유 token/password 또는 올바르게 구성된 non-loopback trusted proxy)과 실제 firewall이 있을 때만 사용하세요.

경험칙:

- LAN bind보다 Tailscale Serve를 우선 사용하세요(Serve는 Gateway를 loopback에 유지하고, 액세스는 Tailscale이 처리함).
- LAN에 바인드해야 한다면, 포트를 소스 IP의 엄격한 허용 목록으로 방화벽 처리하세요. 광범위한 포트 포워딩은 하지 마세요.
- `0.0.0.0`에 인증 없이 Gateway를 노출하지 마세요.

### UFW를 사용하는 Docker 포트 공개

VPS에서 Docker로 OpenClaw를 실행한다면, 공개된 컨테이너 포트
(`-p HOST:CONTAINER` 또는 Compose `ports:`)는
호스트 `INPUT` 규칙만이 아니라 Docker의 포워딩 체인을 통해 라우팅된다는 점을 기억하세요.

Docker 트래픽을 방화벽 정책과 일치시키려면
`DOCKER-USER`에서 규칙을 강제하세요(이 체인은 Docker 자체 accept 규칙보다 먼저 평가됩니다).
많은 최신 배포판에서 `iptables`/`ip6tables`는 `iptables-nft` 프런트엔드를 사용하며,
여전히 nftables 백엔드에 이 규칙을 적용합니다.

최소 허용 목록 예시(IPv4):

```bash
# /etc/ufw/after.rules (독립된 *filter 섹션으로 추가)
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

IPv6에는 별도의 테이블이 있습니다. Docker IPv6가 활성화되어 있다면
`/etc/ufw/after6.rules`에 일치하는 정책을 추가하세요.

문서 스니펫에 `eth0` 같은 인터페이스 이름을 하드코딩하지 마세요. 인터페이스 이름은
VPS 이미지마다 다르며(`ens3`, `enp*` 등), 불일치하면
deny 규칙이 우연히 건너뛰어질 수 있습니다.

리로드 후 빠른 검증:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

외부에서 보이는 예상 포트는 의도적으로 노출한 것만이어야 합니다(대부분의
설정에서는 SSH + 역방향 프록시 포트).

### mDNS/Bonjour 검색

Gateway는 로컬 장치 검색을 위해 mDNS(`_openclaw-gw._tcp`, 포트 5353)로 자신의 존재를 브로드캐스트합니다. full 모드에서는 운영 세부 정보를 노출할 수 있는 TXT 레코드가 포함됩니다:

- `cliPath`: CLI 바이너리의 전체 파일시스템 경로(사용자 이름과 설치 위치 노출)
- `sshPort`: 호스트의 SSH 사용 가능 여부 광고
- `displayName`, `lanHost`: 호스트 이름 정보

**운영 보안 고려 사항:** 인프라 세부 정보를 브로드캐스트하면 로컬 네트워크의 누구에게나 정찰이 더 쉬워집니다. 파일시스템 경로나 SSH 사용 가능 여부 같은 “무해해 보이는” 정보도 공격자가 환경을 파악하는 데 도움이 됩니다.

**권장 사항:**

1. **최소 모드**(기본값, 노출된 Gateway에 권장): mDNS 브로드캐스트에서 민감한 필드를 제외합니다.

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

3. **전체 모드**(opt-in): TXT 레코드에 `cliPath` + `sshPort`를 포함합니다.

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **환경 변수**(대안): config 변경 없이 mDNS를 비활성화하려면 `OPENCLAW_DISABLE_BONJOUR=1`을 설정하세요.

최소 모드에서는 Gateway가 장치 검색에 충분한 정보(`role`, `gatewayPort`, `transport`)는 계속 브로드캐스트하지만 `cliPath`와 `sshPort`는 제외합니다. CLI 경로 정보가 필요한 앱은 대신 인증된 WebSocket 연결을 통해 이를 가져올 수 있습니다.

### Gateway WebSocket 잠그기(로컬 인증)

Gateway 인증은 기본적으로 **필수**입니다. 유효한 Gateway 인증 경로가 구성되어 있지 않으면
Gateway는 WebSocket 연결을 거부합니다(fail‑closed).

온보딩은 기본적으로 토큰을 생성하므로(loopback에서도),
로컬 클라이언트도 인증해야 합니다.

모든 WS 클라이언트가 인증하도록 토큰을 설정하세요:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor가 생성해 줄 수 있습니다: `openclaw doctor --generate-gateway-token`.

참고: `gateway.remote.token` / `.password`는 클라이언트 자격 증명 소스입니다. 이것만으로는
로컬 WS 액세스를 보호하지 **않습니다**.
로컬 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 대체값으로 사용할 수 있습니다.
`gateway.auth.token` / `gateway.auth.password`가
SecretRef를 통해 명시적으로 구성되어 있는데 해석되지 않으면, 해석은 fail closed합니다(원격 대체값으로 가려지지 않음).
선택 사항: `wss://`를 사용할 때 `gateway.remote.tlsFingerprint`로 원격 TLS를 고정하세요.
평문 `ws://`는 기본적으로 loopback 전용입니다. 신뢰된 사설 네트워크
경로의 경우, 클라이언트 프로세스에 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`을 설정하여
비상 탈출로 사용할 수 있습니다. 이는 의도적으로 프로세스 환경에서만 가능하며,
`openclaw.json` config 키는 아닙니다.
모바일 페어링과 Android 수동/스캔 Gateway 경로는 더 엄격합니다:
평문은 loopback에서만 허용되며, private-LAN, link-local, `.local`, 무점 호스트명은
신뢰된 사설 네트워크 평문 경로를 명시적으로 opt in하지 않는 한 TLS를 사용해야 합니다.

로컬 장치 페어링:

- 동일 호스트 클라이언트를 원활하게 유지하기 위해 직접 로컬 loopback 연결은 장치 페어링이 자동 승인됩니다.
- OpenClaw에는 신뢰된 공유 비밀 헬퍼 흐름을 위한 좁은 백엔드/컨테이너 로컬 self-connect 경로도 있습니다.
- tailnet 및 LAN 연결은 같은 호스트 tailnet bind를 포함하더라도 원격으로 취급되며 여전히 승인이 필요합니다.
- loopback 요청의 전달 헤더 증거는 loopback
  지역성을 무효화합니다. 메타데이터 업그레이드 자동 승인은 좁은 범위로 제한됩니다. 두 규칙 모두 [Gateway 페어링](/ko/gateway/pairing)을 참고하세요.

인증 모드:

- `gateway.auth.mode: "token"`: 공유 bearer 토큰(대부분 설정에 권장).
- `gateway.auth.mode: "password"`: 비밀번호 인증(환경 변수 `OPENCLAW_GATEWAY_PASSWORD`를 통한 설정 권장).
- `gateway.auth.mode: "trusted-proxy"`: ID 인식 역방향 프록시가 사용자를 인증하고 헤더를 통해 ID를 전달하도록 신뢰([Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth) 참고).

회전 체크리스트(token/password):

1. 새 비밀을 생성/설정합니다(`gateway.auth.token` 또는 `OPENCLAW_GATEWAY_PASSWORD`).
2. Gateway를 재시작합니다(또는 macOS 앱이 Gateway를 감독한다면 앱을 재시작).
3. 원격 클라이언트(`Gateway`를 호출하는 머신의 `gateway.remote.token` / `.password`)를 업데이트합니다.
4. 이전 자격 증명으로는 더 이상 연결할 수 없는지 확인합니다.

### Tailscale Serve ID 헤더

`gateway.auth.allowTailscale`이 `true`일 때(Serve의 기본값),
OpenClaw는 Control UI/WebSocket 인증을 위해 Tailscale Serve ID 헤더(`tailscale-user-login`)를 수락합니다. OpenClaw는
로컬 Tailscale 데몬(`tailscale whois`)을 통해
`x-forwarded-for` 주소를 해석하고 이를 헤더와 일치시켜 ID를 검증합니다. 이 경로는 loopback에 도달하고
Tailscale이 주입한 `x-forwarded-for`, `x-forwarded-proto`, `x-forwarded-host`를 포함한 요청에서만 트리거됩니다.
이 비동기 ID 검사 경로에서는 동일한 `{scope, ip}`에 대한 실패 시도가
리미터가 실패를 기록하기 전에 직렬화됩니다. 따라서 하나의 Serve 클라이언트에서 동시에 잘못된 재시도를 하면
두 번째 시도가 단순 불일치 둘로 경쟁하는 대신 즉시 잠길 수 있습니다.
HTTP API 엔드포인트(예: `/v1/*`, `/tools/invoke`, `/api/channels/*`)는
Tailscale ID 헤더 인증을 사용하지 **않습니다**. 이들은 여전히 Gateway의
구성된 HTTP 인증 모드를 따릅니다.

중요한 경계 참고:

- Gateway HTTP bearer 인증은 사실상 전체 또는 무의 운영자 액세스입니다.
- `/v1/chat/completions`, `/v1/responses`, `/api/channels/*`를 호출할 수 있는 자격 증명은 해당 Gateway에 대한 전체 액세스 운영자 비밀로 취급하세요.
- OpenAI 호환 HTTP 표면에서 공유 비밀 bearer 인증은 기본 운영자 범위 전체(`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`)와 에이전트 턴의 owner 의미를 복원합니다. 더 좁은 `x-openclaw-scopes` 값은 이 공유 비밀 경로를 줄이지 않습니다.
- HTTP에서 요청별 범위 의미는 요청이 trusted proxy auth 또는 사설 ingress의 `gateway.auth.mode="none"` 같은 ID 보유 모드에서 올 때만 적용됩니다.
- 이러한 ID 보유 모드에서는 `x-openclaw-scopes`를 생략하면 일반 운영자 기본 범위 집합으로 되돌아갑니다. 더 좁은 범위를 원하면 헤더를 명시적으로 보내세요.
- `/tools/invoke`도 동일한 공유 비밀 규칙을 따릅니다. token/password bearer 인증은 여기서도 전체 운영자 액세스로 취급되며, ID 보유 모드는 여전히 선언된 범위를 존중합니다.
- 이러한 자격 증명을 비신뢰 호출자와 공유하지 마세요. 신뢰 경계별로 별도 Gateway를 사용하는 것이 좋습니다.

**신뢰 가정:** 토큰 없는 Serve 인증은 Gateway 호스트가 신뢰된다고 가정합니다.
이를 적대적인 동일 호스트 프로세스에 대한 보호 수단으로 취급하지 마세요. Gateway 호스트에서
비신뢰 로컬 코드가 실행될 수 있다면 `gateway.auth.allowTailscale`을 비활성화하고
`gateway.auth.mode: "token"` 또는
`"password"`를 사용한 명시적 공유 비밀 인증을 요구하세요.

**보안 규칙:** 자체 역방향 프록시에서 이 헤더를 전달하지 마세요. Gateway 앞에서 TLS를 종료하거나
프록시한다면 `gateway.auth.allowTailscale`을 비활성화하고
공유 비밀 인증(`gateway.auth.mode:
"token"` 또는 `"password"`)이나 [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 대신 사용하세요.

신뢰된 프록시:

- Gateway 앞에서 TLS를 종료한다면 `gateway.trustedProxies`를 프록시 IP로 설정하세요.
- OpenClaw는 해당 IP에서 오는 `x-forwarded-for`(또는 `x-real-ip`)를 신뢰하여 로컬 페어링 검사와 HTTP 인증/로컬 검사용 클라이언트 IP를 결정합니다.
- 프록시가 `x-forwarded-for`를 **덮어쓰고** Gateway 포트로의 직접 액세스를 차단하는지 확인하세요.

참고: [Tailscale](/ko/gateway/tailscale) 및 [웹 개요](/ko/web).

### node host를 통한 브라우저 제어(권장)

Gateway는 원격에 있지만 브라우저가 다른 머신에서 실행된다면, 브라우저 머신에서 **node host**를 실행하고 Gateway가 브라우저 작업을 프록시하게 하세요([브라우저 도구](/ko/tools/browser) 참고).
node 페어링은 관리자 액세스처럼 취급하세요.

권장 패턴:

- Gateway와 node host를 같은 tailnet(Tailscale)에 두세요.
- node를 의도적으로 페어링하고, 필요하지 않다면 브라우저 프록시 라우팅은 비활성화하세요.

피해야 할 것:

- relay/control 포트를 LAN 또는 공용 인터넷에 노출하기.
- 브라우저 제어 엔드포인트에 Tailscale Funnel 사용하기(공개 노출).

### 디스크 상의 비밀

`~/.openclaw/`(또는 `$OPENCLAW_STATE_DIR/`) 아래의 모든 항목에는 비밀 또는 개인정보가 들어 있을 수 있다고 가정하세요:

- `openclaw.json`: config에 토큰(Gateway, 원격 Gateway), 공급자 설정, 허용 목록이 포함될 수 있습니다.
- `credentials/**`: 채널 자격 증명(예: WhatsApp creds), 페어링 허용 목록, 레거시 OAuth import.
- `agents/<agentId>/agent/auth-profiles.json`: API 키, 토큰 프로필, OAuth 토큰, 선택적 `keyRef`/`tokenRef`.
- `secrets.json`(선택 사항): `file` SecretRef 공급자(`secrets.providers`)가 사용하는 파일 기반 비밀 payload.
- `agents/<agentId>/agent/auth.json`: 레거시 호환성 파일. 정적 `api_key` 항목은 발견 시 제거됩니다.
- `agents/<agentId>/sessions/**`: 개인 메시지와 도구 출력을 담을 수 있는 세션 전사(`*.jsonl`) + 라우팅 메타데이터(`sessions.json`).
- 번들 Plugin 패키지: 설치된 Plugins(및 그 `node_modules/`).
- `sandboxes/**`: 도구 sandbox 작업공간. sandbox 안에서 읽고 쓴 파일의 복사본이 누적될 수 있습니다.

강화 팁:

- 권한을 엄격히 유지하세요(디렉터리 `700`, 파일 `600`).
- Gateway 호스트에서 전체 디스크 암호화를 사용하세요.
- 호스트가 공유된다면 Gateway에는 전용 OS 사용자 계정을 사용하는 것이 좋습니다.

### 작업공간 `.env` 파일

OpenClaw는 에이전트와 도구를 위해 작업공간 로컬 `.env` 파일을 로드하지만, 그런 파일이 Gateway 런타임 제어를 조용히 덮어쓰도록 허용하지는 않습니다.

- `OPENCLAW_*`로 시작하는 모든 키는 신뢰되지 않은 작업공간 `.env` 파일에서 차단됩니다.
- Matrix, Mattermost, IRC, Synology Chat의 채널 엔드포인트 설정도 작업공간 `.env` 재정의에서 차단되므로, 복제된 작업공간이 로컬 엔드포인트 config를 통해 번들 커넥터 트래픽을 리디렉션할 수 없습니다. 엔드포인트 env 키(`MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL` 등)는 작업공간 로드 `.env`가 아니라 Gateway 프로세스 환경 또는 `env.shellEnv`에서 와야 합니다.
- 이 차단은 fail-closed입니다. 향후 릴리스에서 새 런타임 제어 변수가 추가되더라도 체크인된 또는 공격자가 제공한 `.env`에서 상속될 수 없으며, 해당 키는 무시되고 Gateway는 자체 값을 유지합니다.
- 신뢰된 프로세스/OS 환경 변수(Gateway 자체 셸, launchd/systemd 유닛, 앱 번들)는 여전히 적용됩니다. 이는 `.env` 파일 로딩만 제한합니다.

이유: 작업공간 `.env` 파일은 에이전트 코드 옆에 자주 존재하고, 실수로 커밋되거나 도구에 의해 작성되기도 합니다. 전체 `OPENCLAW_*` 접두사를 차단하면 나중에 새 `OPENCLAW_*` 플래그가 추가되더라도 작업공간 상태에서 조용히 상속되는 퇴행이 발생하지 않습니다.

### 로그 및 전사(redaction 및 보존)

액세스 제어가 올바르더라도 로그와 전사는 민감 정보를 유출할 수 있습니다:

- Gateway 로그에는 도구 요약, 오류, URL이 포함될 수 있습니다.
- 세션 전사에는 붙여넣은 비밀, 파일 내용, 명령 출력, 링크가 포함될 수 있습니다.

권장 사항:

- 도구 요약 redaction을 켜 두세요(`logging.redactSensitive: "tools"`; 기본값).
- `logging.redactPatterns`를 통해 환경에 맞는 사용자 지정 패턴(토큰, 호스트명, 내부 URL)을 추가하세요.
- 진단을 공유할 때는 원시 로그보다 `openclaw status --all`(붙여넣기 가능, 비밀 redaction됨)을 선호하세요.
- 장기 보존이 필요하지 않다면 오래된 세션 전사와 로그 파일을 정리하세요.

자세한 내용: [로깅](/ko/gateway/logging)

### DM: 기본적으로 페어링

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 그룹: 어디서나 멘션 필요

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

그룹 채팅에서는 명시적으로 멘션될 때만 응답하세요.

### 별도 번호 사용(WhatsApp, Signal, Telegram)

전화번호 기반 채널의 경우, AI를 개인 번호와 별도의 번호에서 실행하는 것을 고려하세요:

- 개인 번호: 대화가 비공개로 유지됨
- 봇 번호: 적절한 경계 안에서 AI가 처리함

### 읽기 전용 모드(sandbox와 tools를 통해)

다음을 조합하면 읽기 전용 프로필을 구성할 수 있습니다:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (`"none"`이면 작업공간 액세스 없음)
- `write`, `edit`, `apply_patch`, `exec`, `process` 등을 차단하는 tool allow/deny 목록

추가 강화 옵션:

- `tools.exec.applyPatch.workspaceOnly: true`(기본값): sandboxing이 꺼져 있어도 `apply_patch`가 작업공간 디렉터리 밖을 쓰거나 삭제하지 못하도록 보장합니다. `apply_patch`가 작업공간 밖의 파일을 건드리게 하려는 의도가 있을 때만 `false`로 설정하세요.
- `tools.fs.workspaceOnly: true`(선택 사항): `read`/`write`/`edit`/`apply_patch` 경로와 기본 프롬프트 이미지 자동 로드 경로를 작업공간 디렉터리로 제한합니다(현재 절대 경로를 허용하고 있고 하나의 가드레일을 원할 때 유용).
- 파일시스템 루트는 좁게 유지하세요. 에이전트 작업공간/sandbox 작업공간에 홈 디렉터리 같은 넓은 루트를 사용하지 마세요. 넓은 루트는 로컬의 민감한 파일(예: `~/.openclaw` 아래 상태/config)을 파일시스템 도구에 노출할 수 있습니다.

### 보안 기본값(복사/붙여넣기)

Gateway를 비공개로 유지하고, DM 페어링을 요구하며, 항상 켜진 그룹 봇을 피하는 “안전한 기본값” config 예시:

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

도구 실행도 “기본적으로 더 안전하게” 하고 싶다면 sandbox를 추가하고, owner가 아닌 에이전트에 대해 위험한 도구를 거부하세요(아래 “에이전트별 액세스 프로필” 예시 참고).

채팅 기반 에이전트 턴에 대한 내장 기본값: owner가 아닌 발신자는 `cron` 또는 `gateway` 도구를 사용할 수 없습니다.

## Sandboxing(권장)

전용 문서: [Sandboxing](/ko/gateway/sandboxing)

서로 보완적인 두 가지 접근:

- **전체 Gateway를 Docker에서 실행**(컨테이너 경계): [Docker](/ko/install/docker)
- **도구 sandbox**(`agents.defaults.sandbox`, 호스트 Gateway + sandbox 격리 도구; Docker가 기본 백엔드): [Sandboxing](/ko/gateway/sandboxing)

참고: 에이전트 간 교차 액세스를 방지하려면 `agents.defaults.sandbox.scope`를 `"agent"`(기본값)
또는 더 엄격한 세션별 격리를 위해 `"session"`으로 유지하세요. `scope: "shared"`는
하나의 컨테이너/작업공간을 공유합니다.

sandbox 내부의 에이전트 작업공간 액세스도 고려하세요:

- `agents.defaults.sandbox.workspaceAccess: "none"`(기본값)은 에이전트 작업공간 접근을 차단합니다. 도구는 `~/.openclaw/sandboxes` 아래의 sandbox 작업공간에서 실행됩니다.
- `agents.defaults.sandbox.workspaceAccess: "ro"`는 에이전트 작업공간을 `/agent`에 읽기 전용으로 마운트합니다(`write`/`edit`/`apply_patch` 비활성화).
- `agents.defaults.sandbox.workspaceAccess: "rw"`는 에이전트 작업공간을 `/workspace`에 읽기/쓰기로 마운트합니다.
- 추가 `sandbox.docker.binds`는 정규화되고 canonicalized된 소스 경로를 기준으로 검증됩니다. 부모 symlink 트릭과 canonical home 별칭도 `/etc`, `/var/run`, OS 홈 아래 자격 증명 디렉터리 같은 차단된 루트로 해석되면 여전히 fail closed합니다.

중요: `tools.elevated`는 sandbox 밖에서 exec를 실행하는 전역 기본 탈출구입니다. 유효 호스트는 기본적으로 `gateway`이고, exec 대상이 `node`로 구성된 경우 `node`가 됩니다. `tools.elevated.allowFrom`은 엄격하게 유지하고 낯선 사용자에게는 활성화하지 마세요. `agents.list[].tools.elevated`로 에이전트별 elevated를 추가로 제한할 수도 있습니다. [Elevated Mode](/ko/tools/elevated)를 참고하세요.

### 하위 에이전트 위임 가드레일

세션 도구를 허용한다면, 위임된 하위 에이전트 실행도 또 하나의 경계 결정으로 취급하세요:

- 에이전트가 정말 위임을 필요로 하지 않는 한 `sessions_spawn`을 거부하세요.
- `agents.defaults.subagents.allowAgents`와 에이전트별 `agents.list[].subagents.allowAgents` 재정의는 알려진 안전한 대상 에이전트로 제한하세요.
- sandbox 안에 남아야 하는 워크플로에는 `sessions_spawn`을 `sandbox: "require"`로 호출하세요(기본값은 `inherit`).
- `sandbox: "require"`는 대상 자식 런타임이 sandbox되지 않았을 때 즉시 실패합니다.

## 브라우저 제어 위험

브라우저 제어를 활성화하면 모델에 실제 브라우저를 조작할 능력이 주어집니다.
해당 브라우저 프로필이 이미 로그인된 세션을 가지고 있다면, 모델은
그 계정과 데이터에 접근할 수 있습니다. 브라우저 프로필은 **민감한 상태**로 취급하세요:

- 에이전트 전용 프로필(기본 `openclaw` 프로필)을 사용하는 것이 좋습니다.
- 에이전트를 개인 일상용 프로필에 연결하지 마세요.
- sandbox된 에이전트에 대해서는 신뢰하지 않는 한 호스트 브라우저 제어를 비활성화하세요.
- 독립형 loopback 브라우저 제어 API는 공유 비밀 인증만 허용합니다
  (Gateway token bearer auth 또는 Gateway password). trusted-proxy 또는 Tailscale Serve ID 헤더는 사용하지 않습니다.
- 브라우저 다운로드는 비신뢰 입력으로 취급하고, 격리된 다운로드 디렉터리를 선호하세요.
- 가능하면 에이전트 프로필에서 브라우저 동기화/비밀번호 관리자를 비활성화하세요(영향 범위 축소).
- 원격 Gateway의 경우 “브라우저 제어”는 해당 프로필이 접근할 수 있는 모든 것에 대한 “운영자 액세스”와 동등하다고 가정하세요.
- Gateway와 node host는 tailnet 전용으로 유지하고, 브라우저 제어 포트를 LAN 또는 공용 인터넷에 노출하지 마세요.
- 필요 없으면 브라우저 프록시 라우팅을 비활성화하세요(`gateway.nodes.browser.mode="off"`).
- Chrome MCP existing-session 모드는 **더 안전한** 것이 아닙니다. 해당 호스트 Chrome 프로필이 접근할 수 있는 모든 것에 대해 당신처럼 동작할 수 있습니다.

### 브라우저 SSRF 정책(기본적으로 엄격)

OpenClaw의 브라우저 탐색 정책은 기본적으로 엄격합니다. 사설/내부 대상은 명시적으로 opt in하지 않는 한 차단된 상태를 유지합니다.

- 기본값: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`가 설정되지 않아 브라우저 탐색은 사설/내부/특수 용도 대상을 계속 차단합니다.
- 레거시 별칭: `browser.ssrfPolicy.allowPrivateNetwork`도 호환성을 위해 여전히 허용됩니다.
- opt-in 모드: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`를 설정하면 사설/내부/특수 용도 대상이 허용됩니다.
- 엄격 모드에서는 `hostnameAllowlist`(예: `*.example.com`)와 `allowedHostnames`(정확한 호스트 예외, `localhost` 같은 차단된 이름 포함)를 사용해 명시적 예외를 정의하세요.
- 리디렉션 기반 피벗을 줄이기 위해 탐색은 요청 전에 검사되고, 탐색 후 최종 `http(s)` URL에 대해 best-effort 재검사도 수행됩니다.

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

## 에이전트별 액세스 프로필(멀티 에이전트)

멀티 에이전트 라우팅을 사용하면 각 에이전트가 자체 sandbox + 도구 정책을 가질 수 있습니다:
이를 이용해 에이전트별로 **전체 액세스**, **읽기 전용**, **액세스 없음**을 부여하세요.
전체 세부 사항과 우선순위 규칙은 [멀티 에이전트 Sandbox & Tools](/ko/tools/multi-agent-sandbox-tools)를 참고하세요.

일반적인 사용 사례:

- 개인 에이전트: 전체 액세스, sandbox 없음
- 가족/업무 에이전트: sandbox + 읽기 전용 도구
- 공개 에이전트: sandbox + 파일시스템/셸 도구 없음

### 예시: 전체 액세스(sandbox 없음)

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

### 예시: 읽기 전용 도구 + 읽기 전용 작업공간

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

### 예시: 파일시스템/셸 액세스 없음(공급자 메시징 허용)

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
        // 세션 도구는 전사에서 민감한 데이터를 드러낼 수 있습니다. 기본적으로 OpenClaw는 이 도구를
        // 현재 세션 + 생성된 하위 에이전트 세션으로 제한하지만, 필요하면 더 강하게 제한할 수 있습니다.
        // 구성 참조의 `tools.sessions.visibility`를 참고하세요.
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

AI가 잘못된 행동을 했다면:

### 격리

1. **중지:** macOS 앱이 Gateway를 감독 중이라면 앱을 중지하거나, `openclaw gateway` 프로세스를 종료하세요.
2. **노출 차단:** 무슨 일이 일어났는지 이해할 때까지 `gateway.bind: "loopback"`으로 설정하거나(Tailscale Funnel/Serve 사용 중이면 비활성화) 외부 노출을 끄세요.
3. **액세스 동결:** 위험한 DM/그룹은 `dmPolicy: "disabled"`로 전환하거나 멘션이 필요하도록 만들고, 있었다면 `"*"` 전체 허용 항목을 제거하세요.

### 회전(비밀이 유출됐다면 침해로 가정)

1. Gateway 인증(`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`)을 회전하고 재시작하세요.
2. Gateway를 호출할 수 있는 모든 머신의 원격 클라이언트 비밀(`gateway.remote.token` / `.password`)을 회전하세요.
3. 공급자/API 자격 증명(WhatsApp creds, Slack/Discord 토큰, `auth-profiles.json`의 모델/API 키, 암호화된 비밀 payload 값 사용 시 해당 값)을 회전하세요.

### 감사

1. Gateway 로그 확인: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`(또는 `logging.file`).
2. 관련 전사 검토: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. 최근 config 변경 검토(액세스를 넓혔을 수 있는 항목: `gateway.bind`, `gateway.auth`, DM/그룹 정책, `tools.elevated`, Plugin 변경).
4. `openclaw security audit --deep`를 다시 실행하고 치명적 결과가 해결되었는지 확인하세요.

### 보고용 수집 항목

- 타임스탬프, Gateway 호스트 OS + OpenClaw 버전
- 세션 전사 + 짧은 로그 tail(redaction 후)
- 공격자가 보낸 내용 + 에이전트가 수행한 동작
- Gateway가 loopback 밖에 노출되어 있었는지 여부(LAN/Tailscale Funnel/Serve)

## detect-secrets를 사용한 비밀 스캔

CI는 `secrets` 작업에서 `detect-secrets` pre-commit 훅을 실행합니다.
`main`에 대한 push는 항상 전체 파일 스캔을 실행합니다. pull request는
기준 커밋을 사용할 수 있을 때 변경 파일 빠른 경로를 사용하고,
그렇지 않으면 전체 파일 스캔으로 돌아갑니다. 실패하면 baseline에 아직 없는 새 후보가 있다는 뜻입니다.

### CI가 실패한 경우

1. 로컬에서 재현:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. 도구 이해:
   - pre-commit의 `detect-secrets`는 리포지토리의
     baseline과 exclude를 사용해 `detect-secrets-hook`를 실행합니다.
   - `detect-secrets audit`는 대화형 검토를 열어 각 baseline
     항목을 실제인지 false positive인지 표시하게 합니다.
3. 실제 비밀인 경우: 회전/제거한 뒤 스캔을 다시 실행해 baseline을 업데이트하세요.
4. false positive인 경우: 대화형 audit를 실행하고 false로 표시하세요:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. 새 exclude가 필요하다면 `.detect-secrets.cfg`에 추가하고,
   일치하는 `--exclude-files` / `--exclude-lines` 플래그로 baseline을 다시 생성하세요(config
   파일은 참고용일 뿐이며, detect-secrets는 이를 자동으로 읽지 않습니다).

의도한 상태를 반영하게 되면 업데이트된 `.secrets.baseline`을 커밋하세요.

## 보안 문제 보고

OpenClaw에서 취약점을 발견했나요? 책임감 있게 보고해 주세요:

1. 이메일: [security@openclaw.ai](mailto:security@openclaw.ai)
2. 수정되기 전까지 공개 게시하지 마세요
3. 원하면 익명으로, 그렇지 않으면 크레딧을 드립니다
