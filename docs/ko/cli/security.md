---
read_when:
    - config/state에 대한 빠른 보안 감사를 실행하려고 합니다
    - 안전한 "수정" 제안(권한, 기본값 강화)을 적용하려는 경우
summary: '`openclaw security`용 CLI 참조(일반적인 보안 위험 요소 감사 및 수정)'
title: 보안
x-i18n:
    generated_at: "2026-06-27T17:19:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58876d7ab4dd3e5d3f5c915700b08ca234e5ccefdfc35a79e60a31e1fce21774
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

일반 `security audit`는 차가운 설정/파일 시스템/읽기 전용 경로에 머뭅니다. 기본적으로 Plugin 런타임 보안 수집기를 찾지 않으므로, 일상적인 감사가 설치된 모든 Plugin 런타임을 로드하지 않습니다. 최선 노력 방식의 라이브 Gateway 프로브와 Plugin 소유 보안 감사 수집기를 포함하려면 `--deep`을 사용하세요. 명시적인 내부 호출자도 적절한 런타임 범위를 이미 가지고 있을 때 해당 Plugin 소유 수집기를 선택적으로 사용할 수 있습니다.

감사는 여러 DM 발신자가 기본 세션을 공유할 때 경고하고 **보안 DM 모드**를 권장합니다: 공유 받은 편지함에는 `session.dmScope="per-channel-peer"`(또는 다중 계정 채널에는 `per-account-channel-peer`).
이는 협력적/공유 받은 편지함 강화를 위한 것입니다. 상호 신뢰하지 않거나 적대적인 운영자가 단일 Gateway를 공유하는 구성은 권장되지 않습니다. 별도 Gateway(또는 별도 OS 사용자/호스트)로 신뢰 경계를 나누세요.
또한 설정이 공유 사용자 인그레스 가능성을 시사할 때(예: 열린 DM/그룹 정책, 구성된 그룹 대상, 와일드카드 발신자 규칙) `security.trust_model.multi_user_heuristic`을 내보내며, OpenClaw가 기본적으로 개인 비서 신뢰 모델임을 알려 줍니다.
의도적인 공유 사용자 구성의 경우 감사 지침은 모든 세션을 샌드박스화하고, 파일 시스템 접근을 작업 공간 범위로 제한하며, 개인/비공개 신원 또는 자격 증명을 해당 런타임에 두지 않는 것입니다.
또한 작은 모델(`<=300B`)을 샌드박스 없이 사용하면서 웹/브라우저 도구를 활성화한 경우 경고합니다.
Webhook 인그레스의 경우, 시작 시 치명적이지 않은 보안 경고를 로그에 남기고 감사는 `hooks.token`이 `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 및 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 포함한 활성 Gateway 공유 비밀 인증 값을 재사용하는지 플래그로 표시합니다. 또한 다음 경우에도 경고합니다.

- `hooks.token`이 짧음
- `hooks.path="/"`
- `hooks.defaultSessionKey`가 설정되지 않음
- `hooks.allowedAgentIds`가 제한되지 않음
- 요청 `sessionKey` 재정의가 활성화됨
- `hooks.allowedSessionKeyPrefixes` 없이 재정의가 활성화됨

Gateway 비밀번호 인증이 시작 시에만 제공되는 경우, 감사가 이를 `hooks.token`과 대조할 수 있도록 같은 값을 `openclaw security audit --auth password --password <password>`에 전달하세요.
지속 저장된 재사용 `hooks.token`을 회전하려면 `openclaw doctor --fix`를 실행한 다음, 외부 훅 발신자가 새 훅 토큰을 사용하도록 업데이트하세요.

샌드박스 모드가 꺼진 상태에서 샌드박스 Docker 설정이 구성된 경우, `gateway.nodes.denyCommands`가 효과 없는 패턴형/알 수 없는 항목을 사용하는 경우(셸 텍스트 필터링이 아니라 정확한 node 명령 이름 일치만 해당), `gateway.nodes.allowCommands`가 위험한 node 명령을 명시적으로 활성화하는 경우, 전역 `tools.profile="minimal"`이 에이전트 도구 프로필로 재정의되는 경우, 쓰기/편집 도구가 비활성화되었지만 제약적인 샌드박스 파일 시스템 경계 없이 `exec`가 여전히 사용 가능한 경우, 열린 DM 또는 그룹이 샌드박스/작업 공간 보호 없이 런타임/파일 시스템 도구를 노출하는 경우, 그리고 설치된 Plugin 도구가 허용적인 도구 정책 아래에서 접근 가능할 수 있는 경우에도 경고합니다.
또한 `gateway.allowRealIpFallback=true`(프록시가 잘못 구성된 경우 헤더 스푸핑 위험)와 `discovery.mdns.mode="full"`(mDNS TXT 레코드를 통한 메타데이터 유출)을 플래그로 표시합니다.
또한 샌드박스 브라우저가 `sandbox.browser.cdpSourceRange` 없이 Docker `bridge` 네트워크를 사용하는 경우 경고합니다.
또한 위험한 샌드박스 Docker 네트워크 모드(`host` 및 `container:*` 네임스페이스 조인 포함)를 플래그로 표시합니다.
또한 기존 샌드박스 브라우저 Docker 컨테이너에 누락되었거나 오래된 해시 라벨이 있는 경우(예: `openclaw.browserConfigEpoch`가 없는 마이그레이션 전 컨테이너) 경고하고 `openclaw sandbox recreate --browser --all`을 권장합니다.
또한 npm 기반 Plugin/훅 설치 레코드가 고정되지 않았거나, 무결성 메타데이터가 없거나, 현재 설치된 패키지 버전과 차이가 있는 경우 경고합니다.
채널 허용 목록이 안정적인 ID 대신 변경 가능한 이름/이메일/태그에 의존하는 경우 경고합니다(해당되는 범위의 Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC).
`gateway.auth.mode="none"`가 공유 비밀 없이 Gateway HTTP API에 접근 가능하게 남겨 두는 경우 경고합니다(`/tools/invoke` 및 활성화된 모든 `/v1/*` 엔드포인트).
`dangerous`/`dangerously` 접두사가 붙은 설정은 명시적인 비상 운영자 재정의입니다. 이를 활성화하는 것만으로는 보안 취약점 보고가 아닙니다.
전체 위험 매개변수 목록은 [보안](/ko/gateway/security)의 "안전하지 않거나 위험한 플래그 요약" 섹션을 참조하세요.

의도적인 상시 발견 항목은 `security.audit.suppressions`로 수락할 수 있습니다.
각 억제는 정확한 `checkId`와 일치하며, 대소문자를 구분하지 않는 부분 문자열인
`titleIncludes` 및/또는 `detailIncludes`로 범위를 좁힐 수 있습니다.

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "Enabled extension plugins: gbrain",
          "reason": "trusted local operator plugin"
        }
      ]
    }
  }
}
```

억제된 발견 항목은 활성 `summary`와 `findings` 목록에서 제거됩니다.
JSON 출력은 감사 가능성을 위해 이를 `suppressedFindings` 아래에 유지합니다.
억제가 구성된 경우, 활성 출력은 억제할 수 없는
`security.audit.suppressions.active` 정보 발견 항목도 유지하므로 독자가 감사가
필터링되었음을 알 수 있습니다. 위험한 설정 플래그는 발견 항목 하나당 플래그 하나로 내보내므로,
위험한 플래그 하나를 수락해도 같은
`config.insecure_or_dangerous_flags` `checkId`를 공유하는 다른 활성화된 플래그가 숨겨지지 않습니다.
억제는 상시 위험을 숨길 수 있으므로, 에이전트 실행 셸 명령을 통해 억제를 추가하거나 제거하려면 신뢰할 수 있는 로컬 자동화를 위해 exec가 이미 `security="full"` 및 `ask="off"`로 실행 중인 경우가 아니라면 exec 승인이 필요합니다.

SecretRef 동작:

- `security audit`는 대상 경로에 대해 지원되는 SecretRef를 읽기 전용 모드에서 확인합니다.
- 현재 명령 경로에서 SecretRef를 사용할 수 없는 경우, 감사는 중단되지 않고 계속 진행하며 `secretDiagnostics`를 보고합니다.
- `--token` 및 `--password`는 해당 명령 호출의 심층 프로브 인증만 재정의합니다. 설정 또는 SecretRef 매핑을 다시 작성하지 않습니다.

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

## `--fix`가 변경하는 내용

`--fix`는 안전하고 결정적인 개선을 적용합니다.

- 일반적인 `groupPolicy="open"`을 `groupPolicy="allowlist"`로 전환합니다(지원되는 채널의 계정 변형 포함).
- WhatsApp 그룹 정책이 `allowlist`로 전환될 때, 저장된 `allowFrom` 파일의 목록이 존재하고 설정이 아직
  `allowFrom`을 정의하지 않은 경우 그 목록으로 `groupAllowFrom`을 시드합니다.
- `logging.redactSensitive`를 `"off"`에서 `"tools"`로 설정합니다.
- 상태/설정 및 일반적인 민감 파일의 권한을 강화합니다.
  (`credentials/*.json`, `auth-profiles.json`, `sessions.json`, 세션
  `*.jsonl`)
- `openclaw.json`에서 참조하는 설정 include 파일도 강화합니다.
- POSIX 호스트에서는 `chmod`를, Windows에서는 `icacls` 재설정을 사용합니다.

`--fix`는 다음을 수행하지 **않습니다**.

- 토큰/비밀번호/API 키 회전
- 도구 비활성화(`gateway`, `cron`, `exec` 등)
- Gateway 바인드/인증/네트워크 노출 선택 변경
- Plugin/Skills 제거 또는 재작성

## 관련 항목

- [CLI 참조](/ko/cli)
- [보안 감사](/ko/gateway/security)
