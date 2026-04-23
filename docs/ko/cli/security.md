---
read_when:
    - config/state에 대해 빠른 보안 감사를 실행하려고 합니다
    - 안전한 “fix” 제안(권한, 기본값 강화)을 적용하려고 합니다
summary: '`openclaw security`에 대한 CLI 참조(일반적인 보안 위험 요소 감사 및 수정)'
title: 보안
x-i18n:
    generated_at: "2026-04-23T14:02:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92b80468403b7d329391c40add9ae9c0e2423f5c6ff162291fa13ab91ace985d
    source_path: cli/security.md
    workflow: 15
---

# `openclaw security`

보안 도구(감사 + 선택적 수정)입니다.

관련 항목:

- 보안 가이드: [Security](/ko/gateway/security)

## 감사

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

감사는 여러 DM 발신자가 메인 session을 공유할 때 경고를 표시하고 **보안 DM 모드**를 권장합니다: 공유 inbox의 경우 `session.dmScope="per-channel-peer"`(또는 다중 계정 채널의 경우 `per-account-channel-peer`).
이것은 협업/공유 inbox 강화를 위한 것입니다. 상호 신뢰하지 않거나 적대적인 운영자들이 하나의 Gateway를 공유하는 설정은 권장되지 않습니다. 별도의 Gateway(또는 별도의 OS 사용자/호스트)로 신뢰 경계를 분리하세요.
또한 config가 공유 사용자 ingress 가능성을 시사할 때(예: open DM/group 정책, 구성된 group 대상, 또는 와일드카드 발신자 규칙) `security.trust_model.multi_user_heuristic`를 출력하고, OpenClaw는 기본적으로 개인 비서형 신뢰 모델임을 상기시킵니다.
의도적인 공유 사용자 설정의 경우, 감사 가이드는 모든 session을 sandbox로 격리하고, 파일시스템 접근을 workspace 범위로 제한하며, 개인/비공개 ID나 자격 증명을 해당 런타임에 두지 말 것을 권장합니다.
또한 작은 model(`<=300B`)을 sandbox 없이 사용하면서 web/browser tool을 활성화한 경우에도 경고합니다.
Webhook ingress의 경우 `hooks.token`이 Gateway 토큰을 재사용하는 경우, `hooks.token`이 짧은 경우, `hooks.path="/"`인 경우, `hooks.defaultSessionKey`가 설정되지 않은 경우, `hooks.allowedAgentIds`가 제한되지 않은 경우, 요청 `sessionKey` 재정의가 활성화된 경우, 그리고 `hooks.allowedSessionKeyPrefixes` 없이 재정의가 활성화된 경우에 경고합니다.
또한 sandbox 모드가 꺼져 있는데 sandbox Docker 설정이 구성된 경우, `gateway.nodes.denyCommands`가 비효율적인 패턴형/알 수 없는 항목을 사용하는 경우(정확한 node command-name 일치만 지원하며 shell-text 필터링은 아님), `gateway.nodes.allowCommands`가 위험한 node 명령을 명시적으로 활성화한 경우, 전역 `tools.profile="minimal"`이 agent tool profile에 의해 재정의되는 경우, open group이 sandbox/workspace 보호 없이 런타임/파일시스템 tool을 노출하는 경우, 설치된 Plugin tool이 느슨한 tool 정책 아래에서 도달 가능할 수 있는 경우에도 경고합니다.
또한 `gateway.allowRealIpFallback=true`(프록시가 잘못 구성된 경우 헤더 스푸핑 위험)와 `discovery.mdns.mode="full"`(mDNS TXT 레코드를 통한 메타데이터 유출)을 표시합니다.
또한 sandbox browser가 `sandbox.browser.cdpSourceRange` 없이 Docker `bridge` 네트워크를 사용할 때도 경고합니다.
또한 위험한 sandbox Docker 네트워크 모드(`host` 및 `container:*` 네임스페이스 조인 포함)도 표시합니다.
또한 기존 sandbox browser Docker 컨테이너에 해시 라벨이 없거나 오래된 경우(예: `openclaw.browserConfigEpoch`가 없는 마이그레이션 이전 컨테이너) 경고하고 `openclaw sandbox recreate --browser --all`을 권장합니다.
또한 npm 기반 Plugin/hook 설치 기록이 pin되지 않았거나, 무결성 메타데이터가 없거나, 현재 설치된 패키지 버전과 어긋나는 경우에도 경고합니다.
또한 채널 allowlist가 안정적인 ID 대신 변경 가능한 이름/이메일/태그에 의존하는 경우에도 경고합니다(해당되는 Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC 범위).
또한 `gateway.auth.mode="none"`으로 인해 공유 비밀 없이 Gateway HTTP API(`/tools/invoke` 및 활성화된 모든 `/v1/*` 엔드포인트)에 접근할 수 있는 경우에도 경고합니다.
`dangerous`/`dangerously` 접두사가 붙은 설정은 명시적인 break-glass 운영자 재정의이며, 그중 하나를 활성화했다고 해서 그 자체만으로 보안 취약점 보고는 아닙니다.
전체 위험 매개변수 목록은 [Security](/ko/gateway/security)의 "Insecure or dangerous flags summary" 섹션을 참조하세요.

SecretRef 동작:

- `security audit`는 대상 경로에 대해 읽기 전용 모드로 지원되는 SecretRef를 해석합니다.
- 현재 명령 경로에서 SecretRef를 사용할 수 없으면, 감사는 중단되지 않고 `secretDiagnostics`를 보고합니다.
- `--token`과 `--password`는 해당 명령 실행에 대한 deep-probe 인증만 재정의하며, config 또는 SecretRef 매핑을 다시 쓰지 않습니다.

## JSON 출력

CI/정책 검사에는 `--json`을 사용하세요:

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix`와 `--json`을 함께 사용하면 출력에 수정 작업과 최종 보고서가 모두 포함됩니다:

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix`가 변경하는 내용

`--fix`는 안전하고 결정적인 수정 작업을 적용합니다:

- 일반적인 `groupPolicy="open"`을 `groupPolicy="allowlist"`로 전환합니다(지원되는 채널의 계정 변형 포함)
- WhatsApp group 정책이 `allowlist`로 전환될 때, 저장된 `allowFrom` 파일 목록이 존재하고 config에 아직 `allowFrom`이 정의되어 있지 않으면 해당 목록으로 `groupAllowFrom`을 초기화합니다
- `logging.redactSensitive`를 `"off"`에서 `"tools"`로 설정합니다
- 상태/config 및 일반적인 민감 파일의 권한을 강화합니다
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, session
  `*.jsonl`)
- `openclaw.json`에서 참조하는 config include 파일의 권한도 강화합니다
- POSIX 호스트에서는 `chmod`를, Windows에서는 `icacls` 재설정을 사용합니다

`--fix`가 **하지 않는 일**:

- 토큰/비밀번호/API 키 교체
- tool 비활성화(`gateway`, `cron`, `exec` 등)
- gateway 바인드/인증/네트워크 노출 선택 변경
- Plugin/Skills 제거 또는 재작성
