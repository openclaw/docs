---
read_when:
    - 구성/상태에 대한 빠른 보안 감사를 실행하려는 경우
    - 안전한 "수정" 제안(권한, 기본값 강화)을 적용하려는 경우
summary: 'CLI 참조: `openclaw security`(흔한 보안 실수 유발 요소 감사 및 수정)'
title: 보안
x-i18n:
    generated_at: "2026-05-10T19:29:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb7c65b2d5b17ade8756997f53f28283fbbc9146ccc460fb0e2d49b6d64777e5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

보안 도구(감사 + 선택적 수정).

관련 항목:

- 보안 가이드: [보안](/ko/gateway/security)

## 감사

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --fix
openclaw security audit --json
```

일반 `security audit`는 콜드 config/filesystem/read-only 경로에 머뭅니다. 기본적으로 Plugin 런타임 보안 수집기를 검색하지 않으므로, 일상적인 감사가 설치된 모든 Plugin 런타임을 로드하지 않습니다. 최선 노력 방식의 라이브 Gateway 프로브와 Plugin 소유 보안 감사 수집기를 포함하려면 `--deep`를 사용하세요. 명시적인 내부 호출자도 이미 적절한 런타임 범위를 가지고 있다면 해당 Plugin 소유 수집기를 사용하도록 선택할 수 있습니다.

여러 DM 발신자가 기본 세션을 공유할 때 감사는 경고하고 **보안 DM 모드**를 권장합니다. 공유 받은 편지함에는 `session.dmScope="per-channel-peer"`(또는 다중 계정 채널에는 `per-account-channel-peer`)를 사용하세요.
이는 협력적/공유 받은 편지함 강화를 위한 것입니다. 서로 신뢰하지 않거나 적대적인 운영자가 단일 Gateway를 공유하는 구성은 권장되지 않습니다. 별도 Gateway(또는 별도 OS 사용자/호스트)로 신뢰 경계를 분리하세요.
또한 config가 공유 사용자 인그레스 가능성을 시사할 때(예: 열린 DM/그룹 정책, 구성된 그룹 대상, 와일드카드 발신자 규칙) `security.trust_model.multi_user_heuristic`를 내보내며, OpenClaw는 기본적으로 개인 비서 신뢰 모델임을 상기시킵니다.
의도적인 공유 사용자 구성의 경우, 감사 지침은 모든 세션을 샌드박스화하고, 파일시스템 접근을 워크스페이스 범위로 제한하며, 개인/비공개 ID 또는 자격 증명을 해당 런타임에서 제외하는 것입니다.
또한 작은 모델(`<=300B`)이 샌드박스 없이 사용되고 웹/브라우저 도구가 활성화되어 있을 때 경고합니다.
Webhook 인그레스의 경우, `hooks.token`이 Gateway 토큰을 재사용할 때, `hooks.token`이 짧을 때, `hooks.path="/"`일 때, `hooks.defaultSessionKey`가 설정되지 않았을 때, `hooks.allowedAgentIds`가 제한되지 않았을 때, 요청 `sessionKey` 재정의가 활성화되어 있을 때, 그리고 `hooks.allowedSessionKeyPrefixes` 없이 재정의가 활성화되어 있을 때 경고합니다.
또한 샌드박스 모드가 꺼져 있는데 샌드박스 Docker 설정이 구성되어 있을 때, `gateway.nodes.denyCommands`가 효과 없는 패턴형/알 수 없는 항목을 사용할 때(셸 텍스트 필터링이 아니라 정확한 Node 명령 이름 일치만), `gateway.nodes.allowCommands`가 위험한 Node 명령을 명시적으로 활성화할 때, 전역 `tools.profile="minimal"`이 에이전트 도구 프로필에 의해 재정의될 때, 쓰기/편집 도구는 비활성화되어 있지만 제약적인 샌드박스 파일시스템 경계 없이 `exec`가 여전히 사용 가능할 때, 열린 그룹이 샌드박스/워크스페이스 보호 없이 런타임/파일시스템 도구를 노출할 때, 그리고 설치된 Plugin 도구가 허용적인 도구 정책 아래에서 접근 가능할 수 있을 때 경고합니다.
또한 `gateway.allowRealIpFallback=true`(프록시가 잘못 구성된 경우 헤더 스푸핑 위험)와 `discovery.mdns.mode="full"`(mDNS TXT 레코드를 통한 메타데이터 유출)을 표시합니다.
또한 샌드박스 브라우저가 `sandbox.browser.cdpSourceRange` 없이 Docker `bridge` 네트워크를 사용할 때 경고합니다.
또한 위험한 샌드박스 Docker 네트워크 모드(`host` 및 `container:*` 네임스페이스 조인 포함)를 표시합니다.
또한 기존 샌드박스 브라우저 Docker 컨테이너에 누락되었거나 오래된 해시 레이블이 있을 때(예: `openclaw.browserConfigEpoch`가 누락된 마이그레이션 전 컨테이너) 경고하고 `openclaw sandbox recreate --browser --all`를 권장합니다.
또한 npm 기반 Plugin/후크 설치 기록이 고정되지 않았거나, 무결성 메타데이터가 누락되었거나, 현재 설치된 패키지 버전과 달라졌을 때 경고합니다.
채널 허용 목록이 안정적인 ID 대신 변경 가능한 이름/이메일/태그에 의존할 때 경고합니다(해당되는 경우 Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC 범위).
`gateway.auth.mode="none"`가 공유 비밀 없이 Gateway HTTP API에 접근할 수 있게 둘 때 경고합니다(`/tools/invoke` 및 활성화된 모든 `/v1/*` 엔드포인트).
`dangerous`/`dangerously`로 시작하는 설정은 명시적인 비상용 운영자 재정의입니다. 이를 활성화하는 것만으로는 보안 취약점 보고가 아닙니다.
전체 위험 매개변수 목록은 [보안](/ko/gateway/security)의 "안전하지 않거나 위험한 플래그 요약" 섹션을 참조하세요.

SecretRef 동작:

- `security audit`는 대상 경로에 대해 읽기 전용 모드로 지원되는 SecretRef를 해석합니다.
- 현재 명령 경로에서 SecretRef를 사용할 수 없으면 감사는 계속 진행되고 충돌하는 대신 `secretDiagnostics`를 보고합니다.
- `--token` 및 `--password`는 해당 명령 호출의 심층 프로브 인증만 재정의합니다. config 또는 SecretRef 매핑을 다시 쓰지 않습니다.

## JSON 출력

CI/정책 검사에는 `--json`을 사용하세요.

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix`와 `--json`을 함께 사용하면 출력에 수정 작업과 최종 보고서가 모두 포함됩니다.

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix`가 변경하는 항목

`--fix`는 안전하고 결정적인 복구를 적용합니다.

- 일반적인 `groupPolicy="open"`을 `groupPolicy="allowlist"`로 전환합니다(지원되는 채널의 계정 변형 포함)
- WhatsApp 그룹 정책이 `allowlist`로 전환될 때, 해당 목록이 존재하고 config가 아직 `allowFrom`을 정의하지 않은 경우 저장된 `allowFrom` 파일에서 `groupAllowFrom`을 시드합니다
- `logging.redactSensitive`를 `"off"`에서 `"tools"`로 설정합니다
- 상태/config 및 일반적인 민감 파일의 권한을 강화합니다
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, 세션
  `*.jsonl`)
- `openclaw.json`에서 참조하는 config include 파일도 강화합니다
- POSIX 호스트에서는 `chmod`를 사용하고 Windows에서는 `icacls` 재설정을 사용합니다

`--fix`가 수행하지 **않는** 작업:

- 토큰/비밀번호/API 키 순환
- 도구 비활성화(`gateway`, `cron`, `exec` 등)
- Gateway 바인드/인증/네트워크 노출 선택 변경
- plugins/skills 제거 또는 다시 작성

## 관련 항목

- [CLI 참조](/ko/cli)
- [보안 감사](/ko/gateway/security)
