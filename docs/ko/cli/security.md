---
read_when:
    - 구성/상태에 대한 빠른 보안 감사를 실행하려고 합니다
    - 안전한 "수정" 제안(권한, 기본값 강화)을 적용하려고 합니다.
summary: '`openclaw security` CLI 참조(감사 및 일반적인 보안 실수 수정)'
title: 보안
x-i18n:
    generated_at: "2026-07-12T15:07:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 613d1afa63e46a7dc3474d0b175cf2389703a86b00f861b4140d64e11c28ece5
    source_path: cli/security.md
    workflow: 16
---

# `openclaw security`

보안 도구: 감사 및 선택적 안전 수정. 관련 문서: [보안](/ko/gateway/security).

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --deep --password <password>
openclaw security audit --deep --token <token>
openclaw security audit --auth password --password <password>
openclaw security audit --fix
openclaw security audit --json
```

## 감사 모드

일반 `security audit`는 콜드 구성/파일 시스템/읽기 전용 경로에서만 실행됩니다. Plugin 런타임 보안 수집기를 검색하지 않으므로 일상적인 감사에서 설치된 모든 Plugin 런타임을 로드하지 않습니다. `--deep`은 최선형 실시간 Gateway 프로브와 Plugin 소유의 보안 감사 수집기를 추가합니다(명시적인 내부 호출자도 이미 적절한 런타임 범위를 보유한 경우 해당 수집기 사용을 선택할 수 있습니다).

Gateway 비밀번호 인증이 시작 시에만 제공되는 경우 감사에서 `hooks.token`과 비교할 수 있도록 `--auth password --password <password>`로 동일한 값을 전달하십시오.

## 검사 항목

**DM/신뢰 모델**

- 여러 DM 발신자가 기본 세션을 공유하면 경고하고, 공유 받은편지함에 안전한 DM 모드인 `session.dmScope="per-channel-peer"`(다중 계정 채널의 경우 `per-account-channel-peer`)를 권장합니다. 이는 상호 신뢰하지 않는 운영자를 격리하기 위한 것이 아니라 협업/공유 받은편지함 보안 강화입니다. 그러한 경우 별도의 Gateway(또는 별도의 OS 사용자/호스트)로 신뢰 경계를 분리하십시오.
- 구성이 공유 사용자로부터의 인입 가능성을 시사하는 경우(예: 개방형 DM/그룹 정책, 구성된 그룹 대상 또는 와일드카드 발신자 규칙) `security.trust_model.multi_user_heuristic`을 출력합니다. OpenClaw의 기본 신뢰 모델은 적대적 멀티테넌트 격리가 아니라 개인 비서(운영자 한 명)입니다. 의도적인 공유 사용자 설정에서는 모든 세션을 샌드박스화하고, 파일 시스템 접근을 작업 공간 범위로 제한하며, 개인/비공개 ID 또는 자격 증명을 해당 런타임에 두지 마십시오.
- 소형 모델(`<=300B` 매개변수)을 샌드박스 없이 웹/브라우저 도구가 활성화된 상태로 사용하면 경고합니다.

**Webhook/후크**

시작 로그에 치명적이지 않은 보안 경고가 기록되며, 감사에서는 `hooks.token`이 활성 Gateway 공유 비밀 인증 값(`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)을 재사용하는 경우 플래그를 지정합니다. 또한 다음 경우에도 경고합니다.

- `hooks.token`이 짧은 경우
- `hooks.path="/"`인 경우
- `hooks.defaultSessionKey`가 설정되지 않은 경우
- `hooks.allowedAgentIds`가 제한되지 않은 경우
- 요청의 `sessionKey` 재정의가 활성화된 경우
- `hooks.allowedSessionKeyPrefixes` 없이 재정의가 활성화된 경우

`openclaw doctor --fix`를 실행하여 영구 저장된 재사용 `hooks.token`을 교체한 다음, 외부 후크 발신자가 새 토큰을 사용하도록 업데이트하십시오.

**샌드박스/도구**

- 샌드박스 모드가 꺼진 상태에서 샌드박스 Docker 설정이 구성되어 있으면 경고합니다.
- `gateway.nodes.denyCommands`에 효과가 없는 패턴 유사 항목이나 알 수 없는 항목이 사용되면 경고합니다(일치는 셸 텍스트 필터링이 아니라 정확한 Node 명령 이름에만 적용됩니다).
- `gateway.nodes.allowCommands`가 위험한 Node 명령을 명시적으로 활성화하면 경고합니다.
- 전역 `tools.profile="minimal"`이 에이전트 도구 프로필에 의해 재정의되면 경고합니다.
- 쓰기/편집 도구가 비활성화되어 있지만 제한적인 샌드박스 파일 시스템 경계 없이 `exec`를 계속 사용할 수 있으면 경고합니다.
- 개방형 DM 또는 그룹이 샌드박스/작업 공간 보호 없이 런타임/파일 시스템 도구를 노출하면 경고합니다.
- 허용적인 도구 정책에서 설치된 Plugin 도구에 접근할 수 있으면 경고합니다.

**샌드박스 브라우저**

- 샌드박스 브라우저가 `sandbox.browser.cdpSourceRange` 없이 Docker `bridge` 네트워크를 사용하면 경고합니다.
- `host` 및 `container:*` 네임스페이스 조인을 포함하여 위험한 샌드박스 Docker 네트워크 모드에 플래그를 지정합니다.
- 기존 샌드박스 브라우저 Docker 컨테이너에 해시 레이블이 없거나 오래된 경우(예: 마이그레이션 이전 컨테이너에 `openclaw.browserConfigEpoch`가 없는 경우) 경고하고 `openclaw sandbox recreate --browser --all`을 권장합니다.

**네트워크/검색**

- `gateway.allowRealIpFallback=true`에 플래그를 지정합니다(프록시가 잘못 구성된 경우 헤더 스푸핑 위험).
- `discovery.mdns.mode="full"`에 플래그를 지정합니다(mDNS TXT 레코드를 통한 메타데이터 유출).
- `gateway.auth.mode="none"`으로 인해 공유 비밀 없이 Gateway HTTP API(`/tools/invoke` 및 활성화된 모든 `/v1/*` 엔드포인트)에 접근할 수 있으면 경고합니다.

**Plugin/채널**

- npm 기반 Plugin/훅 설치 기록의 버전이 고정되지 않았거나, 무결성 메타데이터가 누락되었거나, 현재 설치된 패키지 버전과 차이가 있으면 경고합니다.
- 채널 허용 목록이 안정적인 ID 대신 변경 가능한 이름/이메일/태그에 의존하면 경고합니다(해당하는 경우 Discord, Slack, Google Chat, Microsoft Teams, Mattermost, IRC 범위).

`dangerous`/`dangerously` 접두사가 붙은 설정은 비상시 사용하는 명시적 운영자 재정의입니다. 이러한 설정을 활성화했다는 사실만으로 보안 취약점 보고에 해당하지는 않습니다. 위험한 매개변수의 전체 목록은 [보안](/ko/gateway/security)의 "안전하지 않거나 위험한 플래그 요약"을 참조하십시오.

## SecretRef 동작

`security audit`는 검사 대상 경로에서 지원되는 SecretRef를 읽기 전용 모드로 확인합니다. 현재 명령 경로에서 SecretRef를 사용할 수 없는 경우에도 감사는 중단되지 않고 계속되며, 충돌하는 대신 `secretDiagnostics`를 보고합니다. `--token`과 `--password`는 해당 명령 호출의 심층 검사 인증만 재정의하며, 구성이나 SecretRef 매핑을 다시 작성하지 않습니다.

## 억제

의도적으로 상시 유지하는 결과는 `security.audit.suppressions`로 허용합니다. 각 억제는 정확한 `checkId`와 일치하며, 대소문자를 구분하지 않는 `titleIncludes` 및/또는 `detailIncludes` 부분 문자열로 범위를 좁힐 수 있습니다.

```json
{
  "security": {
    "audit": {
      "suppressions": [
        {
          "checkId": "plugins.tools_reachable_permissive_policy",
          "detailIncludes": "활성화된 확장 Plugin: gbrain",
          "reason": "신뢰할 수 있는 로컬 운영자 Plugin"
        }
      ]
    }
  }
}
```

억제된 결과는 활성 `summary`와 `findings` 목록에서 제거됩니다. JSON 출력에서는 감사 가능성을 위해 이를 `suppressedFindings` 아래에 유지합니다. 억제가 구성된 경우, 활성 출력에는 억제할 수 없는 `security.audit.suppressions.active` 정보 결과도 유지되어 독자가 감사가 필터링되었음을 알 수 있습니다. 위험한 구성 플래그는 결과 하나당 플래그 하나씩 출력되므로, 위험한 플래그 하나를 허용해도 동일한 `config.insecure_or_dangerous_flags` checkId를 공유하는 다른 활성화된 플래그는 숨겨지지 않습니다.

억제는 상시 위험을 숨길 수 있으므로, 에이전트가 실행하는 셸 명령을 통해 억제를 추가하거나 제거하려면 exec가 신뢰할 수 있는 로컬 자동화를 위해 이미 `security="full"` 및 `ask="off"`로 실행 중인 경우가 아니라면 exec 승인이 필요합니다.

## JSON 출력

```bash
openclaw security audit --json | jq '.summary'
openclaw security audit --deep --json | jq '.findings[] | select(.severity=="critical") | .checkId'
```

`--fix --json`을 사용하면 출력에 수정 작업과 최종 보고서가 모두 포함됩니다.

```bash
openclaw security audit --fix --json | jq '{fix: .fix.ok, summary: .report.summary}'
```

## `--fix`가 변경하는 항목

안전하고 결정론적인 교정 작업을 적용합니다.

- 일반적인 `groupPolicy="open"`을 `groupPolicy="allowlist"`로 전환합니다(지원되는 채널의 계정 변형 포함).
- WhatsApp 그룹 정책이 `allowlist`로 전환될 때 저장된 `allowFrom` 파일의 목록이 존재하고 구성에 `allowFrom`이 아직 정의되지 않은 경우, 해당 목록으로 `groupAllowFrom`을 초기화합니다.
- `logging.redactSensitive`를 `"off"`에서 `"tools"`로 설정합니다.
- 상태/구성 및 일반적인 민감한 파일(`credentials/*.json`, `auth-profiles.json`, `openclaw-agent.sqlite` 및 레거시 세션 아티팩트)의 권한을 강화합니다.
- `openclaw.json`에서 참조하는 구성 포함 파일의 권한도 강화합니다.
- POSIX 호스트에서는 `chmod`를 사용하고 Windows에서는 `icacls` 재설정을 사용합니다.

`--fix`는 다음 작업을 수행하지 **않습니다**.

- 토큰/비밀번호/API 키 교체
- 도구(`gateway`, `cron`, `exec` 등) 비활성화
- Gateway 바인딩/인증/네트워크 노출 선택 변경
- Plugin/Skills 제거 또는 다시 작성

## 관련 문서

- [CLI 참조](/ko/cli)
- [보안 감사](/ko/gateway/security)
