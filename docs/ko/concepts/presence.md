---
read_when:
    - Control UI 기기 페이지의 실시간 상태 디버깅하기
    - 중복되거나 오래된 인스턴스 행 조사하기
    - Gateway WS 연결 또는 시스템 이벤트 비콘 변경하기
summary: OpenClaw 프레즌스 항목이 생성, 병합 및 표시되는 방식
title: 현재 상태
x-i18n:
    generated_at: "2026-07-16T12:30:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

OpenClaw의 "프레즌스"는 다음 항목을 보여 주는 경량의 최선형 뷰입니다.

- **Gateway** 자체 및
- **Gateway에 연결된 사용자 표시 클라이언트**(Mac 앱, WebChat, 노드 등)

프레즌스는 Control UI의 **Devices** 페이지
(**Settings → Devices** 아래)와 macOS 앱의 **Instances** 탭에 실시간 연결 메타데이터를 표시합니다.

이 페이지에서는 Gateway 클라이언트 목록을 다룹니다. 가장 최근에
사용한 Mac을 감지하고 노드 알림을 해당 Mac으로 라우팅하는 방법은
[활성 컴퓨터 프레즌스](/ko/nodes/presence)를 참조하십시오.

## 프레즌스 필드(표시되는 항목)

프레즌스 항목은 다음과 같은 필드가 있는 구조화된 객체입니다.

- `instanceId`(선택 사항이지만 적극 권장): 안정적인 클라이언트 ID(일반적으로 `connect.client.instanceId`)
- `host`: 사람이 알아보기 쉬운 호스트 이름
- `ip`: 최선형 IP 주소
- `version`: 클라이언트 버전 문자열
- `deviceFamily` / `modelIdentifier`: 하드웨어 정보
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: 파악할 수 있는 경우 마지막 사용자 입력 이후 경과한 시간(초)
- `reason`: 클라이언트가 제공하는 자유 형식 문자열입니다. Gateway 자체에서는 `self`, `connect`, `disconnect`만 내보냅니다.
- `deviceId`, `roles`, `scopes`: 연결 핸드셰이크에서 가져온 기기 ID와 역할/범위 정보
- `ts`: 마지막 업데이트 타임스탬프(에포크 이후 경과한 밀리초)

## 생성자(프레즌스의 출처)

프레즌스 항목은 여러 소스에서 생성되어 **병합**됩니다.

### 1) Gateway 자체 항목

Gateway는 클라이언트가 연결되기 전에도 UI에 Gateway 호스트가
표시되도록 시작할 때 항상 "자체" 항목을 초기값으로 추가합니다.

### 2) WebSocket 연결

모든 WS 클라이언트는 `connect` 요청으로 시작합니다. 핸드셰이크에 성공하면
Gateway가 해당 연결의 프레즌스 항목을 업서트합니다.

#### 일시적인 제어 영역 연결이 표시되지 않는 이유

CLI 명령, 백엔드 RPC 클라이언트 및 프로브는 잠시만 연결되는 경우가 많습니다. 이러한
변동이 전체 프레즌스 TTL 동안 유지되지 않도록 `cli`, `backend`,
또는 `probe` 모드의 클라이언트는 프레즌스 항목으로 **변환되지 않습니다**. 테스트 모드 클라이언트는
테스트 스위트에서 실제 클라이언트를 대신하는 용도로 사용하므로 계속 추적됩니다.

### 3) `system-event` 비콘

클라이언트는 `system-event` 메서드를 통해 더 풍부한 정보를 담은 주기적 비콘을 전송할 수 있습니다. Mac
앱에서는 이를 사용하여 호스트 이름, IP 및 `lastInputSeconds`을 보고합니다.

### 4) 노드 연결(역할: 노드)

노드가 `role: node`을 사용하여 Gateway WebSocket을 통해 연결되면 Gateway는
해당 노드의 프레즌스 항목을 업서트합니다(다른 WS 클라이언트와 동일한 흐름).

## 병합 및 중복 제거 규칙(`instanceId`이 중요한 이유)

프레즌스 항목은 단일 인메모리 맵에 저장되며, 다음 항목 중 사용 가능한 첫 번째 항목을
순서대로 대소문자 구분 없이 키로 사용합니다. 페어링된 기기 ID, `connect.client.instanceId`,
마지막 수단으로 연결별 ID를 사용합니다.

일시적인 제어 영역 클라이언트는 추적에서 완전히 제외되므로(위 내용 참조)
해당 연결 ID가 키로 사용되지 않습니다. 그 외 모든 클라이언트에서는
연결 ID가 대체 키로 사용되므로 안정적인 `instanceId` 없이 다시 연결하는 클라이언트는
**중복** 행으로 표시됩니다.

## TTL 및 크기 제한

프레즌스는 의도적으로 일시적으로 유지됩니다.

- **TTL:** 5분이 지난 항목은 제거됩니다.
- **최대 항목 수:** 200개(가장 오래된 항목부터 삭제)

이렇게 하면 목록을 최신 상태로 유지하면서 메모리가 무제한으로 증가하는 것을 방지할 수 있습니다.

## 원격/터널 주의 사항(루프백 IP)

클라이언트가 SSH 터널/로컬 포트 포워딩을 통해 연결되면 Gateway에서
원격 주소를 `127.0.0.1`로 인식할 수 있습니다. 해당 터널 주소가
클라이언트의 IP로 기록되지 않도록 연결 처리 과정에서는 루프백 주소를
항목에 기록하는 대신 로컬로 감지된(루프백) 클라이언트의 `ip`을 완전히 생략합니다.

## 소비자

### Control UI의 Devices 페이지

**Devices** 페이지는 `system-presence`을 영구적인 페어링 및 노드
레코드와 결합합니다. Gateway 자체 비콘을 맨 위에 고정하고 일치하는 기기 또는
인스턴스 ID를 사용하여 실시간 플랫폼, 버전, 모델 및 최근 입력 메타데이터를 표시합니다.

### macOS의 Instances 탭

macOS 앱은 `system-presence`의 출력을 렌더링하고 마지막 업데이트 후 경과 시간에 따라
작은 상태 표시기(활성/유휴/오래됨)를 적용합니다.

## 디버깅 팁

- 원시 목록을 보려면 Gateway에 `system-presence`을 호출하십시오.
- 중복 항목이 표시되는 경우:
  - 클라이언트가 핸드셰이크에서 안정적인 `client.instanceId`을 전송하는지 확인하십시오.
  - 주기적 비콘에서 동일한 `instanceId`을 사용하는지 확인하십시오.
  - 연결에서 파생된 항목에 `instanceId`이 누락되었는지 확인하십시오(이 경우 중복은 예상된 동작입니다).

## 관련 문서

<CardGroup cols={2}>
  <Card title="활성 컴퓨터 프레즌스" href="/ko/nodes/presence" icon="computer-mouse">
    물리적 Mac 입력으로 활성 노드를 선택하고 연결 알림을 라우팅하는 방법입니다.
  </Card>
  <Card title="입력 중 표시기" href="/ko/concepts/typing-indicators" icon="ellipsis">
    입력 중 표시기가 전송되는 시점과 조정 방법입니다.
  </Card>
  <Card title="스트리밍 및 청킹" href="/ko/concepts/streaming" icon="bars-staggered">
    아웃바운드 스트리밍, 청킹 및 채널별 형식 지정입니다.
  </Card>
  <Card title="Gateway 아키텍처" href="/ko/concepts/architecture" icon="diagram-project">
    Gateway 구성 요소와 프레즌스 업데이트를 구동하는 WebSocket 프로토콜입니다.
  </Card>
  <Card title="Gateway 프로토콜" href="/ko/gateway/protocol" icon="plug">
    `connect`, `system-event`, `system-presence`의 유선 프로토콜입니다.
  </Card>
</CardGroup>
