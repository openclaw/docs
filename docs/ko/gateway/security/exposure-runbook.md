---
read_when:
    - LAN, tailnet, Tailscale Serve, Funnel 또는 리버스 프록시를 통해 Gateway 공개하기
    - 실제 메시징 사용자를 허용하기 전 배포 검토하기
    - 위험한 원격 액세스 또는 DM 구성 롤백하기
sidebarTitle: Exposure runbook
summary: 루프백 외부에 OpenClaw Gateway를 노출하기 전 사전 점검 및 롤백 체크리스트
title: Gateway 공개 실행 지침서
x-i18n:
    generated_at: "2026-07-12T15:21:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Gateway에 접근할 수 있는 주체, 인증 방식, 트리거할 수 있는 에이전트, 해당 에이전트가
사용할 수 있는 도구를 설명할 수 있을 때만 Gateway를 노출하십시오. 확실하지 않다면
루프백 전용 접근으로 되돌리고 감사를 다시 실행하십시오.
</Warning>

이 런북은 포괄적인 [보안](/ko/gateway/security) 지침을 원격 접근 및 메시징 노출을 위한
운영자 체크리스트로 구체화합니다.

## 노출 패턴 선택

워크플로를 충족하는 가장 제한적인 패턴을 우선 사용하십시오.

| 패턴                       | 권장 상황                                        | 필수 제어                                                                                                                               |
| -------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 루프백 + SSH 터널          | 개인 사용, 관리자 접근, 디버깅                   | `gateway.bind: "loopback"`을 유지하고 `127.0.0.1:18789`를 터널링                                                                         |
| 루프백 + Tailscale Serve   | Control UI/WebSocket에 대한 개인 tailnet 접근    | Gateway를 루프백 전용으로 유지합니다. Tailscale ID 헤더는 다른 인증 경로가 아닌 Control UI WebSocket 표면만 인증합니다                    |
| Tailnet/LAN 바인딩         | 알려진 장치로 구성된 전용 사설 네트워크          | Gateway 인증, 방화벽 허용 목록, 공개 포트 포워딩 금지                                                                                    |
| 신뢰할 수 있는 리버스 프록시 | Gateway 앞에 조직 SSO/OIDC가 있는 경우          | `trusted-proxy` 인증, 엄격한 `trustedProxies`, 헤더 덮어쓰기/제거 규칙, 명시적인 허용 사용자                                             |
| 공용 인터넷                | 드물고 위험도가 높은 배포                        | ID 인식 프록시, TLS, 속도 제한, 엄격한 허용 목록, 샌드박스에서 실행되는 비기본 세션                                                       |

Gateway로 직접 공개 포트 포워딩하지 마십시오. 공개 접근이 필요한 경우
Gateway 앞에 ID 인식 프록시를 배치하고, 해당 프록시를 Gateway로 연결되는
유일한 네트워크 경로로 설정하십시오.

## 사전 인벤토리

바인딩, 프록시, Tailscale 또는 채널 정책을 변경하기 전에 다음을 기록하십시오.

- Gateway 호스트, OS 사용자 및 상태 디렉터리(기본값 `~/.openclaw`).
- Gateway URL 및 바인딩 모드(`gateway.bind`, 기본 포트 `18789`).
- 인증 모드, 토큰/비밀번호 출처 또는 신뢰할 수 있는 프록시 ID 출처.
- 활성화된 모든 채널과 각 채널의 DM, 그룹 또는 Webhook 허용 여부.
- 로컬이 아닌 발신자가 접근할 수 있는 에이전트.
- 접근 가능한 각 에이전트의 도구 프로필, 샌드박스 모드 및 권한 상승 도구 정책.
- 해당 에이전트가 사용할 수 있는 외부 자격 증명.
- `~/.openclaw/openclaw.json` 및 자격 증명의 백업 위치.

둘 이상의 사람이 봇에 메시지를 보낼 수 있다면 이를 사용자별 호스트 격리가 아니라
공유된 위임 도구 권한으로 취급하십시오.

## 기준 검사

접근을 개방하기 전에 다음을 실행하십시오.

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

심각한 결과를 먼저 해결하십시오. 배포에 의도적이고 문서화된 경우에만 경고를
수용하십시오. 각 `checkId`의 의미와 수정 키는
[보안 감사 검사](/ko/gateway/security/audit-checks)를 참조하십시오.

원격 CLI 검증 시 자격 증명을 명시적으로 전달하십시오.

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

명시적인 원격 URL에 로컬 구성의 자격 증명이 적용된다고 가정하지 마십시오.

## 최소 안전 기준

노출되는 배포의 시작점으로 다음 구성을 사용하십시오.

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

한 번에 하나의 제어만 완화하십시오. 쓰기 가능한 도구를 활성화하기 전에
특정 채널 허용 목록을 추가하거나, 원격 Control UI 트래픽을 허용하기 전에
리버스 프록시를 활성화하십시오.

`tools.exec.security: "deny"`는 안전한 진단을 포함한 모든 exec 호출을
차단합니다. 진단이나 위험도가 낮은 명령이 필요한 경우 위협 모델에 맞는
특정 발신자, 에이전트, 명령 및 승인 모드를 선택한 후에만 이를 완화하십시오.

## DM 및 그룹 노출

메시징 채널은 신뢰할 수 없는 입력 표면입니다. DM 또는 그룹을 허용하기 전에
다음을 수행하십시오.

- `dmPolicy: "open"`보다 `dmPolicy: "pairing"` 또는 엄격한 `allowFrom` 목록을 우선 사용하십시오.
- `"*"` 허용 목록을 광범위한 도구 접근과 함께 사용하지 마십시오.
- 방이 엄격하게 통제되지 않는 한 그룹에서 멘션을 요구하십시오.
- 여러 사람이 봇에 DM을 보낼 수 있는 경우 DM 세션이 컨텍스트를 공유하지 않도록
  `session.dmScope: "per-channel-peer"`(다중 계정 채널의 경우
  `"per-account-channel-peer"`)를 설정하십시오.
- 공유 채널을 최소한의 도구만 사용하고 개인 자격 증명이 없는 에이전트로 라우팅하십시오.

페어링은 발신자가 봇을 트리거하도록 승인합니다. 그렇다고 해당 발신자가
별도의 호스트 보안 경계가 되는 것은 아닙니다.

## 리버스 프록시 검사

ID 인식 프록시의 경우 다음을 확인하십시오.

- 프록시는 Gateway로 전달하기 전에 사용자를 인증해야 합니다.
- 방화벽 또는 네트워크 정책은 Gateway 포트에 대한 직접 접근을 차단해야 합니다.
- `gateway.trustedProxies`에는 프록시 출발지 IP만 나열해야 합니다.
- 프록시는 클라이언트가 제공한 ID 및 포워딩 헤더를 제거하거나 덮어써야 합니다.
- 프록시가 둘 이상의 사용자 그룹에 서비스를 제공하는 경우 `gateway.auth.trustedProxy.allowUsers`를 설정하십시오.
- 로컬 프로세스를 신뢰하고 프록시가 ID 헤더를 소유하는 동일 호스트 프록시에만
  `gateway.auth.trustedProxy.allowLoopback`을 사용하십시오.

프록시 변경 후 `openclaw security audit --deep`을 실행하십시오.
프록시가 인증 경계가 되므로 신뢰할 수 있는 프록시 관련 결과는 신뢰도가 높은
신호입니다.

## 도구 및 샌드박스 검토

에이전트를 원격 발신자에게 노출하기 전에 다음을 수행하십시오.

- 호스트에서 실행되는 세션과 샌드박스에서 실행되는 세션을 확인하십시오.
- 호스트 exec를 거부하거나 승인을 요구하십시오.
- 신뢰할 수 있는 특정 발신자에게 필요한 경우가 아니면 권한 상승 도구를 비활성화된 상태로 유지하십시오.
- 개방형 또는 반개방형 메시징 표면에서는 브라우저, 캔버스, Node, Cron, Gateway 및 세션 생성 도구를 사용하지 마십시오.
- 바인드 마운트 범위를 좁게 유지하고 자격 증명, 홈, Docker 소켓 및 시스템 경로를 피하십시오.
- 신뢰 경계가 실질적으로 다른 경우 별도의 Gateway, OS 사용자 또는 호스트를 사용하십시오.

원격 사용자를 완전히 신뢰할 수 없다면 프롬프트나 세션 레이블만이 아니라
별도의 배포를 통해 격리해야 합니다.

## 변경 후 검증

각 노출 변경 후 다음을 수행하십시오.

1. `openclaw security audit --deep`을 다시 실행하십시오.
2. 승인된 연결이 성공적으로 이루어지는지 확인하십시오.
3. 승인되지 않은 발신자 또는 브라우저 세션이 거부되는지 확인하십시오.
4. 로그에서 비밀이 마스킹되는지 확인하십시오.
5. DM/그룹 라우팅이 의도한 에이전트에만 도달하는지 확인하십시오.
6. 영향도가 높은 도구가 승인을 요청하거나 거부되는지 확인하십시오.
7. 수용한 잔여 경고를 문서화하십시오.

현재 노출 변경을 완전히 이해하기 전에는 다음 노출 변경으로 진행하지 마십시오.

## 롤백 계획

Gateway가 과도하게 노출되었을 가능성이 있는 경우:

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

그런 다음 다음을 수행하십시오.

1. 공개 포워딩, Tailscale Funnel 또는 리버스 프록시 경로를 중지하십시오.
2. Gateway 토큰/비밀번호 및 영향을 받은 연동 자격 증명을 교체하십시오.
3. 허용 목록에서 `"*"` 및 예상하지 못한 발신자를 제거하십시오.
4. 최근 감사 로그, 실행 기록, 도구 호출 및 구성 변경을 검토하십시오.
5. `openclaw security audit --deep`을 다시 실행하십시오.
6. 워크플로를 충족하는 가장 제한적인 패턴으로 접근을 다시 활성화하십시오.

## 검토 체크리스트

- 문서화된 이유가 없는 한 Gateway는 루프백 전용으로 유지됩니다.
- 비루프백 접근에는 인증과 방화벽이 적용되며 공개 직접 경로가 없습니다.
- 신뢰할 수 있는 프록시 배포에는 엄격한 프록시 IP 및 헤더 제어가 적용됩니다.
- DM은 기본적으로 공개 접근이 아닌 페어링 또는 허용 목록을 사용합니다.
- 그룹은 멘션 또는 명시적인 허용 목록을 요구합니다.
- 공유 채널은 개인 자격 증명에 접근하지 않습니다.
- 비기본 세션은 샌드박스 모드에서 실행됩니다.
- 호스트 exec 및 권한 상승 도구는 거부되거나 승인 절차를 거칩니다.
- 로그에서 비밀이 마스킹됩니다.
- 심각한 감사 결과가 해결되었습니다.
- 롤백 단계가 테스트되고 문서화되었습니다.
