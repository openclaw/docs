---
read_when:
    - 전체 에이전트 턴을 실행하지 않고 도구 호출하기
    - 도구 정책 적용이 필요한 자동화 구축하기
summary: Gateway HTTP 엔드포인트를 통해 단일 도구를 직접 호출합니다
title: 도구가 API를 호출합니다
x-i18n:
    generated_at: "2026-07-12T15:19:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

OpenClaw의 Gateway는 단일 도구를 직접 호출하기 위한 HTTP 엔드포인트를 제공합니다. 이 엔드포인트는 항상 활성화되며 Gateway 인증과 도구 정책을 사용합니다. OpenAI 호환 `/v1/*` 표면과 마찬가지로, 공유 비밀 전달자 인증은 전체 Gateway에 대한 신뢰할 수 있는 운영자 액세스로 취급됩니다.

- `POST /tools/invoke`
- Gateway와 동일한 포트(WS + HTTP 멀티플렉싱): `http://<gateway-host>:<port>/tools/invoke`
- 기본 최대 요청 본문 크기: 2 MB

## 인증

Gateway 인증 구성을 사용합니다.

일반적인 HTTP 인증 경로:

- 공유 비밀 인증(`gateway.auth.mode="token"` 또는 `"password"`): `Authorization: Bearer <token-or-password>`
- 신뢰할 수 있는 ID 전달 HTTP 인증(`gateway.auth.mode="trusted-proxy"`): 구성된 ID 인식 프록시를 통해 라우팅하고 필요한 ID 헤더를 주입하도록 합니다.
- 비공개 인그레스 개방형 인증(`gateway.auth.mode="none"`): 인증 헤더가 필요하지 않습니다.

참고:

- `mode="token"`은 `gateway.auth.token`(또는 `OPENCLAW_GATEWAY_TOKEN`)을 사용합니다.
- `mode="password"`는 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 사용합니다.
- `mode="trusted-proxy"`에서는 HTTP 요청이 구성된 신뢰할 수 있는 프록시 소스에서 와야 합니다. 동일 호스트의 루프백 프록시에는 명시적인 `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다.
- 프록시를 우회하는 동일 호스트 내부 호출자는 로컬 직접 대체 경로로 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 사용할 수 있습니다. `Forwarded`, `X-Forwarded-*` 또는 `X-Real-IP` 헤더 증거가 있으면 요청은 대신 신뢰할 수 있는 프록시 경로를 계속 사용합니다.
- `gateway.auth.rateLimit`이 구성되어 있고 인증 실패가 너무 많이 발생하면 엔드포인트는 `Retry-After`와 함께 `429`를 반환합니다.

## 보안 경계(중요)

이 엔드포인트를 Gateway 인스턴스에 대한 **전체 운영자 액세스** 표면으로 취급하십시오.

- 여기서 HTTP 전달자 인증은 사용자별로 범위가 제한된 모델이 아닙니다.
- 이 엔드포인트의 유효한 Gateway 토큰/비밀번호는 소유자/운영자 자격 증명처럼 취급해야 합니다.
- 공유 비밀 인증 모드(`token` 및 `password`)에서는 호출자가 더 좁은 `x-openclaw-scopes` 헤더를 보내더라도 엔드포인트가 일반적인 전체 운영자 기본값을 복원합니다.
- 공유 비밀 인증은 또한 이 엔드포인트의 직접 도구 호출을 소유자 발신자 턴으로 취급합니다.
- 신뢰할 수 있는 ID 전달 HTTP 모드(신뢰할 수 있는 프록시 인증 또는 비공개 인그레스의 `gateway.auth.mode="none"`)에서는 `x-openclaw-scopes`가 있으면 이를 따르고, 그렇지 않으면 일반적인 운영자 기본 범위 집합을 사용합니다.
- 이 엔드포인트는 루프백/테일넷/비공개 인그레스에서만 유지하십시오. 공용 인터넷에 직접 노출하지 마십시오.

인증 매트릭스:

| 인증 모드                                                                               | 동작                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token` 또는 `password` + `Authorization: Bearer ...`                                     | 공유 Gateway 운영자 비밀을 보유하고 있음을 증명합니다. 더 좁은 `x-openclaw-scopes`를 무시합니다. 전체 기본 운영자 범위 집합인 `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`를 복원합니다. 직접 도구 호출을 소유자 발신자 턴으로 취급합니다. |
| 신뢰할 수 있는 ID 전달 HTTP(신뢰할 수 있는 프록시 인증 또는 비공개 인그레스의 `mode="none"`) | 외부의 신뢰할 수 있는 ID 또는 배포 경계를 인증합니다. `x-openclaw-scopes`가 있으면 이를 따릅니다. 헤더가 없으면 일반적인 운영자 기본 범위 집합을 사용합니다. 호출자가 명시적으로 범위를 좁히고 `operator.admin`을 생략한 경우에만 소유자 의미 체계가 사라집니다.                               |

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

- `tool` / `name`(문자열, 필수): 호출할 도구 이름입니다. 둘 다 전송되면 `name`이 우선합니다.
- `action`(문자열, 선택 사항): 도구 스키마가 `action` 속성을 지원하고 `args`에서 아직 설정하지 않은 경우 `args.action`에 병합됩니다.
- `args`(객체, 선택 사항): 도구별 인수입니다.
- `sessionKey`(문자열, 선택 사항): 대상 세션 키입니다. 생략하거나 `"main"`이면 Gateway는 구성된 기본 세션 키를 사용합니다(`session.mainKey`와 기본 에이전트를 따르며, 전역 세션 범위에서는 `global`을 사용합니다).
- `agentId`(문자열, 선택 사항): 해당 에이전트의 세션 키를 확인합니다. 이미 다른 에이전트에 매핑되는 명시적 `sessionKey`와 충돌하면 `400` 오류가 발생합니다.
- `idempotencyKey`(문자열, 선택 사항): 호출에 사용할 안정적인 도구 호출 ID를 파생하는 데 사용됩니다.
- `dryRun`(불리언, 선택 사항): 향후 사용을 위해 예약되어 있으며 현재는 무시됩니다.

## 정책 + 라우팅 동작

도구 가용성은 Gateway 에이전트가 사용하는 것과 동일한 정책 체인을 통해 필터링됩니다.

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 그룹 정책(세션 키가 그룹 또는 채널에 매핑되는 경우)
- 하위 에이전트 정책(하위 에이전트 세션 키로 호출하는 경우)

정책에서 도구를 허용하지 않으면 엔드포인트는 **404**를 반환합니다.

중요한 경계 참고 사항:

- Exec 승인은 운영자 보호 장치이며 이 HTTP 엔드포인트의 별도 권한 부여 경계가 아닙니다. Gateway 인증 + 도구 정책을 통해 여기서 도구에 접근할 수 있다면 `/tools/invoke`는 호출별 추가 승인 프롬프트를 추가하지 않습니다.
- 여기서 `exec`에 접근할 수 있다면 상태를 변경하는 셸 표면으로 취급하십시오. `write`, `edit`, `apply_patch` 또는 HTTP 파일 시스템 쓰기 도구를 거부해도 셸 실행이 읽기 전용이 되지는 않습니다.
- 신뢰할 수 없는 호출자와 Gateway 전달자 자격 증명을 공유하지 마십시오. 신뢰 경계 간 분리가 필요하면 별도의 Gateway를 실행하십시오(이상적으로는 별도의 OS 사용자/호스트에서 실행).

Gateway HTTP는 기본적으로 강제 거부 목록도 적용합니다(세션 정책에서 도구를 허용하더라도 적용됨).

| 도구             | 이유                                                    |
| ---------------- | --------------------------------------------------------- |
| `exec`           | 직접 명령 실행(RCE 표면)                    |
| `spawn`          | 임의 하위 프로세스 생성(RCE 표면)            |
| `shell`          | 셸 명령 실행(RCE 표면)                     |
| `fs_write`       | 호스트의 임의 파일 변경                       |
| `fs_delete`      | 호스트의 임의 파일 삭제                       |
| `fs_move`        | 호스트의 임의 파일 이동/이름 변경                    |
| `apply_patch`    | 패치 적용으로 임의 파일을 다시 작성할 수 있음             |
| `sessions_spawn` | 세션 오케스트레이션. 원격 에이전트 생성은 RCE에 해당함    |
| `sessions_send`  | 세션 간 메시지 주입                           |
| `cron`           | 영구 자동화 제어 영역                       |
| `gateway`        | Gateway 제어 영역. HTTP를 통한 재구성을 방지함  |
| `nodes`          | Node 명령 릴레이가 페어링된 호스트의 `system.run`에 도달할 수 있음 |

`cron`, `gateway`, `nodes`는 소유자 전용이기도 합니다. 이 기본 거부 목록 밖에 있더라도 소유자가 아닌 호출자는 이 표면에서 해당 도구를 호출할 수 없습니다.

`gateway.tools`를 통해 일반 거부 목록을 사용자 지정합니다.

```json5
{
  gateway: {
    tools: {
      // HTTP /tools/invoke를 통해 차단할 추가 도구
      deny: ["browser"],
      // 소유자/관리자 호출자를 위해 기본 거부 목록에서 제거할 도구
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow`는 노출 재정의이지 범위 승격이 아닙니다. ID 전달 HTTP 모드에서는 `gateway.tools.allow`에 나열되어 있더라도 소유자/관리자 ID(`operator.admin`)가 없는 호출자가 `cron`, `gateway`, `nodes`를 사용할 수 없습니다. 공유 비밀 전달자 인증에는 위의 전체 신뢰 운영자 규칙이 계속 적용됩니다.

그룹 정책이 컨텍스트를 확인하도록 지원하기 위해 다음을 선택적으로 설정할 수 있습니다.

- `x-openclaw-message-channel: <channel>`(예: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>`(여러 계정이 있는 경우)
- `x-openclaw-message-to: <target>`(메시지 도구 정책의 전달 대상)
- `x-openclaw-thread-id: <threadId>`(메시지 도구 정책의 스레드 컨텍스트)

## 응답

| 상태 | 의미                                                                                        |
| ------ | ---------------------------------------------------------------------------------------------- |
| `200`  | `{ ok: true, result }`                                                                         |
| `400`  | `{ ok: false, error: { type, message } }`(잘못된 요청 또는 도구 입력 오류)                |
| `401`  | 인증되지 않음                                                                                   |
| `403`  | `{ ok: false, error: { type, message, requiresApproval? } }`(정책에 의해 도구 호출이 차단됨)     |
| `404`  | 도구를 사용할 수 없음(찾을 수 없거나 허용 목록에 없음)                                              |
| `405`  | 허용되지 않는 메서드                                                                             |
| `408`  | 요청 본문 읽기 시간 초과                                                                    |
| `413`  | 요청 본문이 최대 페이로드 크기를 초과함                                                     |
| `429`  | 인증 속도 제한 적용(`Retry-After` 설정됨)                                                          |
| `500`  | `{ ok: false, error: { type, message } }`(예기치 않은 도구 실행 오류, 메시지는 정제됨) |

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

## 관련 문서

- [Gateway 프로토콜](/ko/gateway/protocol)
- [도구 및 Plugin](/ko/tools)
