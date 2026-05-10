---
read_when:
    - 전체 에이전트 턴을 실행하지 않고 도구 호출하기
    - 도구 정책 적용이 필요한 자동화 구축
summary: Gateway HTTP 엔드포인트를 통해 단일 도구를 직접 호출
title: 도구 호출 API
x-i18n:
    generated_at: "2026-05-10T19:37:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 531e77673fb9c06d0cc8f8145d874e22f7e590dc3e4c5dee1574874af5666886
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw의 Gateway는 단일 도구를 직접 호출하기 위한 간단한 HTTP 엔드포인트를 노출합니다. 이 엔드포인트는 항상 활성화되어 있으며 Gateway 인증과 도구 정책을 사용합니다. OpenAI 호환 `/v1/*` 표면과 마찬가지로, 공유 비밀 bearer 인증은 전체 Gateway에 대한 신뢰된 운영자 접근으로 취급됩니다.

- `POST /tools/invoke`
- Gateway와 같은 포트(WS + HTTP 멀티플렉스): `http://<gateway-host>:<port>/tools/invoke`

기본 최대 페이로드 크기는 2 MB입니다.

## 인증

Gateway 인증 구성을 사용합니다.

일반적인 HTTP 인증 경로:

- 공유 비밀 인증(`gateway.auth.mode="token"` 또는 `"password"`):
  `Authorization: Bearer <token-or-password>`
- 신뢰된 ID 보유 HTTP 인증(`gateway.auth.mode="trusted-proxy"`):
  구성된 ID 인식 프록시를 통해 라우팅하고 필요한 ID 헤더를
  주입하게 합니다
- private-ingress 공개 인증(`gateway.auth.mode="none"`):
  인증 헤더가 필요하지 않습니다

참고:

- `gateway.auth.mode="token"`일 때는 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)을 사용합니다.
- `gateway.auth.mode="password"`일 때는 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 사용합니다.
- `gateway.auth.mode="trusted-proxy"`일 때는 HTTP 요청이 구성된 신뢰된 프록시 소스에서 와야 합니다. 같은 호스트의 loopback 프록시는 명시적으로
  `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다.
- `gateway.auth.rateLimit`이 구성되어 있고 인증 실패가 너무 많이 발생하면 엔드포인트는 `Retry-After`와 함께 `429`를 반환합니다.

## 보안 경계(중요)

이 엔드포인트를 Gateway 인스턴스에 대한 **전체 운영자 접근** 표면으로 취급하세요.

- 여기의 HTTP bearer 인증은 좁은 사용자별 범위 모델이 아닙니다.
- 이 엔드포인트에 대한 유효한 Gateway 토큰/비밀번호는 소유자/운영자 자격 증명처럼 취급해야 합니다.
- 공유 비밀 인증 모드(`token` 및 `password`)에서는 호출자가 더 좁은 `x-openclaw-scopes` 헤더를 보내더라도 엔드포인트가 일반적인 전체 운영자 기본값을 복원합니다.
- 공유 비밀 인증은 또한 이 엔드포인트의 직접 도구 호출을 소유자 발신자 턴으로 취급합니다.
- 신뢰된 ID 보유 HTTP 모드(예: 신뢰된 프록시 인증 또는 private ingress의 `gateway.auth.mode="none"`)는 `x-openclaw-scopes`가 있으면 이를 존중하고, 없으면 일반적인 운영자 기본 범위 집합으로 대체합니다.
- 이 엔드포인트는 loopback/tailnet/private ingress에서만 유지하세요. 공개 인터넷에 직접 노출하지 마세요.

인증 매트릭스:

- `gateway.auth.mode="token"` 또는 `"password"` + `Authorization: Bearer ...`
  - 공유 Gateway 운영자 비밀의 소유를 증명합니다
  - 더 좁은 `x-openclaw-scopes`를 무시합니다
  - 전체 기본 운영자 범위 집합을 복원합니다:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - 이 엔드포인트의 직접 도구 호출을 소유자 발신자 턴으로 취급합니다
- 신뢰된 ID 보유 HTTP 모드(예: 신뢰된 프록시 인증 또는 private ingress의 `gateway.auth.mode="none"`)
  - 일부 외부의 신뢰된 ID 또는 배포 경계를 인증합니다
  - 헤더가 있을 때 `x-openclaw-scopes`를 존중합니다
  - 헤더가 없을 때 일반적인 운영자 기본 범위 집합으로 대체합니다
  - 호출자가 명시적으로 범위를 좁히고 `operator.admin`을 생략한 경우에만 소유자 의미를 잃습니다

## 요청 본문

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

필드:

- `tool`(문자열, 필수): 호출할 도구 이름입니다.
- `action`(문자열, 선택 사항): 도구 스키마가 `action`을 지원하고 args 페이로드에서 이를 생략한 경우 args에 매핑됩니다.
- `args`(객체, 선택 사항): 도구별 인수입니다.
- `sessionKey`(문자열, 선택 사항): 대상 세션 키입니다. 생략되거나 `"main"`이면 Gateway는 구성된 기본 세션 키(`session.mainKey`와 기본 에이전트를 존중하거나, 전역 범위에서는 `global`)를 사용합니다.
- `dryRun`(불리언, 선택 사항): 향후 사용을 위해 예약되어 있으며, 현재는 무시됩니다.

## 정책 + 라우팅 동작

도구 가용성은 Gateway 에이전트가 사용하는 동일한 정책 체인을 통해 필터링됩니다.

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 그룹 정책(세션 키가 그룹 또는 채널에 매핑되는 경우)
- 서브에이전트 정책(서브에이전트 세션 키로 호출하는 경우)

정책에서 도구가 허용되지 않으면 엔드포인트는 **404**를 반환합니다.

중요한 경계 참고:

- Exec 승인은 운영자 보호 장치이지, 이 HTTP 엔드포인트에 대한 별도의 권한 부여 경계가 아닙니다. 도구가 Gateway 인증 + 도구 정책을 통해 여기에서 접근 가능하다면 `/tools/invoke`는 호출별 추가 승인 프롬프트를 더하지 않습니다.
- 여기에서 `exec`에 접근 가능하다면 이를 변경 가능한 셸 표면으로 취급하세요. `write`, `edit`, `apply_patch` 또는 HTTP 파일 시스템 쓰기 도구를 거부해도 셸 실행이 읽기 전용이 되지는 않습니다.
- 신뢰할 수 없는 호출자와 Gateway bearer 자격 증명을 공유하지 마세요. 신뢰 경계 간 분리가 필요하다면 별도의 Gateway를 실행하세요(이상적으로는 별도의 OS 사용자/호스트도 사용).

Gateway HTTP는 기본적으로 하드 거부 목록도 적용합니다(세션 정책이 도구를 허용하더라도).

- `exec` - 직접 명령 실행(RCE 표면)
- `spawn` - 임의 자식 프로세스 생성(RCE 표면)
- `shell` - 셸 명령 실행(RCE 표면)
- `fs_write` - 호스트의 임의 파일 변경
- `fs_delete` - 호스트의 임의 파일 삭제
- `fs_move` - 호스트의 임의 파일 이동/이름 변경
- `apply_patch` - 패치 적용은 임의 파일을 다시 쓸 수 있습니다
- `sessions_spawn` - 세션 오케스트레이션; 원격으로 에이전트를 생성하는 것은 RCE입니다
- `sessions_send` - 세션 간 메시지 주입
- `cron` - 영구 자동화 제어 플레인
- `gateway` - Gateway 제어 플레인; HTTP를 통한 재구성을 방지합니다
- `nodes` - 노드 명령 릴레이는 페어링된 호스트의 system.run에 도달할 수 있습니다
- `whatsapp_login` - 터미널 QR 스캔이 필요한 대화형 설정이며 HTTP에서 멈춥니다

`gateway.tools`를 통해 이 거부 목록을 사용자 지정할 수 있습니다.

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

그룹 정책이 컨텍스트를 해석하는 데 도움이 되도록 선택적으로 다음을 설정할 수 있습니다.

- `x-openclaw-message-channel: <channel>`(예: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>`(여러 계정이 있는 경우)

## 응답

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`(잘못된 요청 또는 도구 입력 오류)
- `401` → 권한 없음
- `429` → 인증 속도 제한됨(`Retry-After` 설정됨)
- `404` → 도구를 사용할 수 없음(찾을 수 없거나 허용 목록에 없음)
- `405` → 허용되지 않는 메서드
- `500` → `{ ok: false, error: { type, message } }`(예상치 못한 도구 실행 오류; 정제된 메시지)

## 예시

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## 관련 항목

- [Gateway 프로토콜](/ko/gateway/protocol)
- [도구와 Plugin](/ko/tools)
