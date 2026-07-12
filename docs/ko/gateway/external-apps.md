---
read_when:
    - OpenClaw과 통신하는 외부 앱, 스크립트, 대시보드, CI 작업 또는 IDE 확장 기능을 구축하고 있습니다.
    - Gateway RPC와 Plugin SDK 중에서 선택하고 있습니다
    - Gateway 에이전트 실행, 세션, 이벤트, 승인, 모델 또는 도구와 통합하는 경우
    - 호스팅 컨트롤러를 외부 깨우기 스케줄러와 페어링하고 있습니다
sidebarTitle: External apps
summary: 외부 앱, 스크립트, 대시보드, CI 작업 및 IDE 확장을 위한 현재 통합 경로
title: 외부 앱을 위한 Gateway 통합
x-i18n:
    generated_at: "2026-07-12T00:46:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

외부 앱은 Gateway 프로토콜을 통해 OpenClaw와 통신합니다. 이 프로토콜은 WebSocket 전송과 RPC 메서드로 구성됩니다. 스크립트, 대시보드, CI 작업, IDE 확장 프로그램 또는 다른 프로세스에서 에이전트 실행을 시작하거나, 이벤트를 스트리밍하거나, 결과를 기다리거나, 작업을 취소하거나, Gateway 리소스를 검사할 때 사용합니다.

<Warning>
  아직 공개 npm 클라이언트 패키지는 없습니다. 릴리스 노트에서 패키지 게시를 발표하고 이 페이지에 설치 지침이 추가되기 전까지는 OpenClaw 클라이언트 패키지 이름을 애플리케이션 종속성으로 추가하지 마세요.
</Warning>

<Note>
  이 페이지는 OpenClaw 프로세스 외부의 코드를 위한 것입니다. OpenClaw 내부에서 실행되는 Plugin 코드는 대신 문서화된 `openclaw/plugin-sdk/*` 하위 경로를 사용해야 합니다.
</Note>

## 현재 사용할 수 있는 기능

| 인터페이스                            | 상태      | 용도                                                                                              |
| ------------------------------------- | --------- | ------------------------------------------------------------------------------------------------- |
| [Gateway 프로토콜](/ko/gateway/protocol) | 사용 가능 | WebSocket 전송, 연결 핸드셰이크, 인증 범위, 프로토콜 버전 관리 및 이벤트.                         |
| [Gateway RPC 참조](/ko/reference/rpc)    | 사용 가능 | 에이전트, 세션, 작업, 모델, 도구, 아티팩트 및 승인을 위한 현재 Gateway 메서드.                    |
| [`openclaw agent`](/ko/cli/agent)        | 사용 가능 | CLI를 셸에서 실행하는 것으로 충분한 경우의 일회성 스크립트 통합.                                 |
| [`openclaw message`](/ko/cli/message)    | 사용 가능 | 스크립트에서 메시지 또는 채널 작업 전송.                                                         |

향후 제공될 클라이언트 라이브러리 패키지는 내부적으로 개발 중이지만, 아직 공개 설치 인터페이스는 아닙니다. 릴리스에서 게시되고 버전이 지정된 패키지를 발표하기 전까지는 미리 보기 구현 세부 정보로 취급하세요.

## 권장 경로

1. Gateway를 실행하거나 검색합니다.
2. [Gateway 프로토콜](/ko/gateway/protocol)을 통해 연결합니다.
3. [Gateway RPC 참조](/ko/reference/rpc)에 문서화된 RPC 메서드를 호출합니다.
4. 테스트한 OpenClaw 버전을 고정합니다.
5. OpenClaw를 업그레이드할 때 RPC 참조를 다시 확인합니다.

에이전트 실행의 경우 `agent` RPC로 시작하고 터미널 결과를 얻기 위해 `agent.wait`와 함께 사용하세요. 지속적인 대화 상태에는 `sessions.*` 메서드를 사용하세요. UI 통합의 경우 Gateway 이벤트를 구독하고 앱에서 이해하는 이벤트 계열만 렌더링하세요.

## 협력적 호스트 일시 중단

실행 중인 프로세스를 동결하거나 스냅샷으로 저장하는 호스팅 컨트롤러는 호스트 중립적인 일시 중단 핸드셰이크를 사용할 수 있습니다.

1. 호스트가 제어하는 외부 인그레스의 수락을 중지합니다.
2. 안정적이고 고유한 `requestId`를 사용하여 `gateway.suspend.prepare`를 호출합니다.
3. 응답이 `busy`이면 프로세스를 계속 실행하고 나중에 다시 시도합니다.
4. 응답이 `ready`이면 반환된 `suspensionId`를 저장한 다음 `expiresAtMs` 이전에 프로세스를 동결하거나 스냅샷으로 저장합니다.
5. 동결 해제 후 또는 일시 중단을 취소한 경우 기존 WebSocket이나 Admin HTTP 제어 경로를 통해 해당 `suspensionId`로 `gateway.suspend.resume`을 호출합니다.

준비된 Gateway는 새로운 WebSocket 핸드셰이크를 거부합니다. WebSocket 컨트롤러는 호스트 작업 중에도 인증된 연결을 열린 상태로 유지해야 합니다. 이를 보장할 수 없다면 준비하기 전에 [Admin HTTP RPC Plugin](/ko/plugins/admin-http-rpc)을 활성화하여 사용하세요. 제어 경로가 끊어진 경우 다시 연결하기 전에 2분의 임대 기간이 만료될 때까지 기다리세요. 만료되면 수락이 자동으로 다시 열립니다.

RPC 계약은 다음과 같습니다.

- `gateway.suspend.prepare` — `operator.admin`; 매개변수
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; 매개변수
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; 매개변수
  `{ "suspensionId": "id-from-prepare" }`

ID는 앞뒤 공백이 제거되며 공백이 아닌 문자를 포함해야 하고 128자로 제한됩니다. 사용 중인 준비 결과에는 `status: "busy"`, `reason`, `retryAfterMs`, `activeCount`, `blockers`가 포함됩니다. 준비 완료 결과의 형식은 다음과 같습니다.

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

상태 조회는 `{"status":"running"}` 또는 `expiresAtMs`가 포함된 준비 완료 결과를 반환합니다. 재개는 `{"ok":true,"status":"running","resumed":true}`를 반환하며, 성공적으로 재개한 후 반복 호출하면 `resumed: false`를 반환합니다.

경쟁하는 요청 ID 또는 일시적인 스케줄러 재개 실패는 `retryAfterMs`가 포함된 재시도 가능한 `UNAVAILABLE`을 반환합니다. 스케줄러 복구 중에는 준비, 상태 조회, 재개 모두 해당 오류를 반환하고 Gateway는 준비되지 않은 실패 폐쇄 상태를 유지하며, 호스트는 이를 동결하거나 스냅샷으로 저장해서는 안 됩니다. OpenClaw는 스케줄러를 자동으로 재시도하며 복구가 성공한 후에만 수락을 다시 엽니다. 일치하지 않는 재개 ID는 `INVALID_REQUEST`를 반환합니다. 준비 작업에는 분당 세 번 시도할 수 있는 Gateway 제어 영역 쓰기 예산이 함께 적용되므로 반환된 재시도 지연을 준수하세요. WebSocket 클라이언트는 기기와 IP별로 버킷화됩니다. Admin HTTP 컨트롤러는 확인된 클라이언트 IP별로 버킷화되므로, 하나의 프록시 뒤에 있는 컨트롤러는 예산을 공유할 수 있습니다.

준비는 거부만 수행합니다. OpenClaw는 새로운 루트/세션/명령 수락을 닫고, 자동 Cron 틱을 일시 중지하며, 작업을 동기적으로 검사합니다. 활성 상태인 항목이 있으면 `busy`를 반환하기 전에 스케줄러를 재개하고 수락을 다시 엽니다. 해당 작업을 중단하거나 완료될 때까지 기다리지는 않습니다. 준비 완료 임대는 2분간 지속됩니다. 동일한 `requestId`로 `prepare`를 반복하면 임대가 갱신되며, 임대가 만료되면 수락을 다시 열기 전에 스케줄러가 재개됩니다.
준비 완료 임대 중에 실행 시점이 된 재시작 알림은 임대가 재개될 때까지 기다립니다. 재시작이 진행 중이면 준비 결과로 `busy`가 반환됩니다.

준비 완료 상태에서도 `/healthz`는 활성 상태를 유지하고 `/readyz`는 `503`을 반환합니다. 로컬 또는 인증된 준비 상태 응답에는 `gateway-draining`이 포함되며, 인증되지 않은 원격 프로브에는 `{ "ready": false }`만 반환됩니다. HTTP 상태 프로브, 기존 WebSocket 연결의 일시 중단 메서드 및 이미 활성화된 Admin HTTP RPC 경로는 계속 사용할 수 있습니다. 다른 RPC는 재시도 가능한 `UNAVAILABLE`을 반환합니다. OpenAI 호환 API, 도구/세션 작업, Node 감시 및 구성된 훅을 포함한 내장 HTTP 사용자 작업 경로와 일반 Plugin HTTP 경로는 `error.code: "gateway_unavailable"`과 함께 `503`을 반환합니다. 새 Plugin 소유 WebSocket 업그레이드도 `503`을 반환합니다. 이는 업그레이드 소유권에만 적용되며, 나중에 이미 설정된 Plugin 소켓을 통해 수행되는 작업에는 적용되지 않습니다.

이 핸드셰이크는 수신 메시지를 영속화하거나, 타사 채널 전송을 중지하거나, 호스팅 플랫폼을 제어하지 않습니다. 호스트는 준비 전에 인그레스를 차단해야 하며, 절전 해제, 스냅샷/동결 및 중지는 계속 호스트의 책임입니다. `activeCount`는 추적되는 작업의 집계 수이며, `blockers`에는 0이 아닌 범주별 개수와 제한된 작업 세부 정보가 포함됩니다. 이는 일반적인 프로세스 정지 장벽이 아닙니다. `background-exec` 차단 항목은 집계 정보만 제공합니다. 명령 텍스트, 프로세스 ID, 출력 및 세션이나 범위 식별자는 프로토콜을 통해 절대 전달되지 않습니다. 채널 상태 확인, 유지 관리, 캐시 새로 고침, 이미 설정된 Plugin WebSocket 세션 및 등록되지 않은 Plugin 소유 백그라운드 작업은 계속 활성 상태일 수 있습니다.
호스팅 플랫폼은 전체 프로세스 트리와 파일 시스템을 일관되게 동결하거나 스냅샷으로 저장해야 합니다. 이 최초 계약으로는 등록되지 않은 작업이 유휴 상태임을 입증할 수 없습니다.

<Tip>
  호스트 절전 해제 예약의 경우 OpenClaw 측 부분은 프로세스 내 Plugin에 유지하고, 멱등적인 전체 스냅샷을 외부 호스트 어댑터에 투영하세요. 호스팅 컨트롤러는 Plugin SDK를 가져오거나 이벤트 델타에서 Cron 상태를 재구성해서는 안 됩니다. [안전한 외부 Cron 투영](/ko/plugins/hooks#safe-external-cron-projection)을 참조하세요.
</Tip>

## 앱 코드와 Plugin 코드

코드가 OpenClaw 외부에 있는 경우 Gateway RPC를 사용하세요.

- 에이전트 실행을 시작하거나 관찰하는 Node 스크립트
- Gateway를 호출하는 CI 작업
- 대시보드 및 관리자 패널
- IDE 확장 프로그램
- 채널 Plugin이 될 필요가 없는 외부 브리지
- 가짜 또는 실제 Gateway 전송을 사용하는 통합 테스트

코드가 OpenClaw 내부에서 실행되는 경우 Plugin SDK를 사용하세요.

- 제공자 Plugin
- 채널 Plugin
- 도구 또는 수명 주기 훅
- 에이전트 하네스 Plugin
- 신뢰할 수 있는 런타임 도우미

외부 앱은 `openclaw/plugin-sdk/*`를 가져와서는 안 됩니다. 해당 하위 경로는 OpenClaw가 로드하는 Plugin용입니다.

## 관련 문서

- [Gateway 프로토콜](/ko/gateway/protocol)
- [Gateway RPC 참조](/ko/reference/rpc)
- [CLI 에이전트 명령](/ko/cli/agent)
- [CLI 메시지 명령](/ko/cli/message)
- [에이전트 루프](/ko/concepts/agent-loop)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [세션](/ko/concepts/session)
- [백그라운드 작업](/ko/automation/tasks)
- [ACP 에이전트](/ko/tools/acp-agents)
- [Plugin SDK 개요](/ko/plugins/sdk-overview)
