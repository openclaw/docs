---
read_when:
    - LAN, tailnet, Tailscale Serve, Funnel 또는 리버스 프록시를 통해 Gateway 노출하기
    - 실제 메시징 사용자를 허용하기 전에 배포 검토하기
    - 위험한 원격 액세스 또는 DM 구성 롤백
sidebarTitle: Exposure runbook
summary: OpenClaw Gateway를 루프백 외부에 노출하기 전 사전 점검 및 롤백 체크리스트
title: Gateway 노출 런북
x-i18n:
    generated_at: "2026-06-27T17:31:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Gateway를 노출하기 전에 누가 접근할 수 있는지, 어떻게 인증되는지,
어떤 에이전트를 트리거할 수 있는지, 그리고 그 에이전트가 어떤 도구를 사용할 수
있는지 설명할 수 있어야 합니다. 확실하지 않으면 loopback 전용 접근으로 되돌리고
감사를 다시 실행하세요.
</Warning>

이 런북은 더 광범위한 [보안](/ko/gateway/security) 지침을 원격 접근 및 메시징
노출을 위한 운영자 체크리스트로 바꿉니다.

## 노출 패턴 선택

워크플로를 충족하는 가장 좁은 패턴을 선호하세요.

| 패턴                       | 권장되는 경우                                  | 필수 제어                                                                                           |
| -------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 루프백 + SSH 터널          | 개인 사용, 관리자 접근, 디버깅                | `gateway.bind: "loopback"`을 유지하고 `127.0.0.1:18789`를 터널링                                   |
| 루프백 + Tailscale Serve   | Control UI/WebSocket에 대한 개인 tailnet 접근 | Gateway를 루프백 전용으로 유지하고, 지원되는 표면에만 Tailscale ID 헤더를 신뢰                     |
| Tailnet/LAN 바인드         | 알려진 장치가 있는 전용 사설 네트워크         | Gateway 인증, 방화벽 허용 목록, 공개 포트 포워딩 없음                                              |
| 신뢰할 수 있는 리버스 프록시 | Gateway 앞단의 조직 SSO/OIDC                  | `trusted-proxy` 인증, 엄격한 `trustedProxies`, 헤더 덮어쓰기/제거 규칙, 명시적 허용 사용자         |
| 공개 인터넷                | 드문 고위험 배포                               | ID 인식 프록시, TLS, 속도 제한, 엄격한 허용 목록, 샌드박스된 non-main 세션                         |

Gateway로 직접 공개 포트 포워딩하지 마세요. 공개 접근이 필요하다면
ID 인식 프록시를 앞단에 두고, 해당 프록시가 Gateway로 가는 유일한 네트워크
경로가 되도록 하세요.

## 사전 인벤토리

바인드, 프록시, Tailscale 또는 채널 정책을 변경하기 전에 다음을 기록하세요.

- Gateway 호스트, OS 사용자, 상태 디렉터리.
- Gateway URL 및 바인드 모드.
- 인증 모드, 토큰/비밀번호 출처 또는 신뢰할 수 있는 프록시 ID 출처.
- 활성화된 모든 채널과 DM, 그룹 또는 Webhook을 허용하는지 여부.
- 비로컬 발신자가 접근할 수 있는 에이전트.
- 접근 가능한 각 에이전트의 도구 프로필, 샌드박스 모드, 승격된 도구 정책.
- 해당 에이전트가 사용할 수 있는 외부 자격 증명.
- `~/.openclaw/openclaw.json` 및 자격 증명의 백업 위치.

둘 이상의 사람이 봇에 메시지를 보낼 수 있다면, 이를 사용자별 호스트 격리가 아니라
공유 위임 도구 권한으로 취급하세요.

## 기준 검사

접근을 열기 전에 다음을 실행하세요.

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

먼저 심각한 발견 사항을 해결하세요. 경고는 해당 배포에서 의도적이고 문서화된
경우에만 허용될 수 있습니다.

원격 CLI 검증에는 자격 증명을 명시적으로 전달하세요.

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

로컬 구성 자격 증명이 명시적 원격 URL에 적용된다고 가정하지 마세요.

## 최소 안전 기준

노출된 배포의 시작점으로 이 형태를 사용하세요.

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

그런 다음 한 번에 하나의 제어만 넓히세요. 예를 들어, 쓰기 가능 도구를 활성화하기
전에 특정 채널 허용 목록을 추가하거나, 원격 Control UI 트래픽을 허용하기 전에
리버스 프록시를 활성화하세요.

엄격한 `exec.security: "deny"` 기준은 무해한 진단을 포함한 모든 exec 호출을
차단합니다. 진단 또는 낮은 위험의 명령이 필요하다면, 위협 모델에 맞는 특정 발신자,
에이전트, 명령, 승인 모드를 선택한 뒤에만 이를 완화하세요.

## DM 및 그룹 노출

메시징 채널은 신뢰할 수 없는 입력 표면입니다. DM 또는 그룹을 허용하기 전에:

- `dmPolicy: "pairing"` 또는 엄격한 `allowFrom` 목록을 선호하세요.
- 모든 발신자를 신뢰하지 않는 한 `dmPolicy: "open"`을 피하세요.
- `"*"` 허용 목록을 광범위한 도구 접근과 결합하지 마세요.
- 공간이 엄격히 통제되지 않는 한 그룹에서는 멘션을 요구하세요.
- 여러 사람이 봇에 DM을 보낼 수 있을 때는 `session.dmScope: "per-channel-peer"`를 사용하세요.
- 공유 채널은 최소한의 도구와 개인 자격 증명이 없는 에이전트로 라우팅하세요.

페어링은 발신자가 봇을 트리거할 수 있도록 승인합니다. 그렇다고 해당 발신자가
별도의 호스트 보안 경계가 되는 것은 아닙니다.

## 리버스 프록시 검사

ID 인식 프록시의 경우:

- 프록시는 Gateway로 전달하기 전에 사용자를 인증해야 합니다.
- Gateway 포트로의 직접 접근은 방화벽 또는 네트워크 정책으로 차단해야 합니다.
- `gateway.trustedProxies`에는 프록시 출처 IP만 포함해야 합니다.
- 프록시는 클라이언트가 제공한 ID 및 전달 헤더를 제거하거나 덮어써야 합니다.
- 프록시가 둘 이상의 대상을 제공하는 경우 `gateway.auth.trustedProxy.allowUsers`에는 예상 사용자를 나열해야 합니다.
- 동일 호스트 루프백 프록시 모드는 로컬 프로세스를 신뢰하고 프록시가 ID 헤더를 소유할 때만 `allowLoopback`을 사용해야 합니다.

프록시 변경 후 `openclaw security audit --deep`을 실행하세요. 신뢰할 수 있는
프록시 관련 발견 사항은 프록시가 인증 경계가 되기 때문에 의도적으로 신호가 높습니다.

## 도구 및 샌드박스 검토

원격 발신자에게 에이전트를 노출하기 전에:

- 어떤 세션이 호스트에서 실행되고 어떤 세션이 샌드박스에서 실행되는지 확인하세요.
- 호스트 exec를 거부하거나 승인을 요구하세요.
- 특정한 신뢰된 발신자가 필요로 하지 않는 한 승격된 도구를 비활성화 상태로 유지하세요.
- 개방형 또는 준개방형 메시징 표면에는 브라우저, 캔버스, node, cron, gateway, session-spawn 도구를 피하세요.
- 바인드 마운트는 좁게 유지하고 자격 증명, 홈, Docker 소켓, 시스템 경로를 피하세요.
- 실질적으로 다른 신뢰 경계에는 별도의 Gateway, OS 사용자 또는 호스트를 사용하세요.

원격 사용자를 완전히 신뢰할 수 없다면, 격리는 프롬프트나 세션 라벨만이 아니라
별도의 배포에서 나와야 합니다.

## 변경 후 검증

각 노출 변경 후:

1. `openclaw security audit --deep`을 다시 실행합니다.
2. 성공적인 승인된 연결을 테스트합니다.
3. 승인되지 않은 발신자 또는 브라우저 세션이 거부되는지 테스트합니다.
4. 로그가 비밀을 마스킹하는지 확인합니다.
5. DM/그룹 라우팅이 의도한 에이전트에만 도달하는지 확인합니다.
6. 영향이 큰 도구가 승인을 요청하거나 거부되는지 확인합니다.
7. 수용한 잔여 경고를 문서화합니다.

현재 변경을 이해하기 전에는 다음 노출 변경으로 진행하지 마세요.

## 롤백 계획

Gateway가 과도하게 노출되었을 수 있다면:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

그런 다음:

1. 공개 포워딩, Tailscale Funnel 또는 리버스 프록시 라우트를 중지합니다.
2. Gateway 토큰/비밀번호와 영향을 받은 통합 자격 증명을 교체합니다.
3. 허용 목록에서 `"*"` 및 예상치 못한 발신자를 제거합니다.
4. 최근 감사 로그, 실행 기록, 도구 호출, 구성 변경을 검토합니다.
5. `openclaw security audit --deep`을 다시 실행합니다.
6. 워크플로를 충족하는 가장 좁은 패턴으로 접근을 다시 활성화합니다.

## 검토 체크리스트

- 문서화된 이유가 없는 한 Gateway는 루프백 전용으로 유지됩니다.
- 비루프백 접근에는 인증, 방화벽 적용, 공개 직접 경로 없음이 있습니다.
- 신뢰할 수 있는 프록시 배포에는 엄격한 프록시 IP와 헤더 제어가 있습니다.
- DM은 기본적으로 공개 접근이 아니라 페어링 또는 허용 목록을 사용합니다.
- 그룹은 멘션 또는 명시적 허용 목록을 요구합니다.
- 공유 채널은 개인 자격 증명에 도달하지 않습니다.
- Non-main 세션은 샌드박스 모드에서 실행됩니다.
- 호스트 exec 및 승격된 도구는 거부되거나 승인 게이트가 적용됩니다.
- 로그는 비밀을 마스킹합니다.
- 심각한 감사 발견 사항이 해결되었습니다.
- 롤백 단계가 테스트되고 문서화되었습니다.
