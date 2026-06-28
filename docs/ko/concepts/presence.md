---
read_when:
    - 인스턴스 탭 디버깅
    - 중복되거나 오래된 인스턴스 행 조사하기
    - Gateway WS 연결 또는 시스템 이벤트 비컨 변경
summary: OpenClaw 프레즌스 항목이 생성, 병합 및 표시되는 방식
title: 프레즌스
x-i18n:
    generated_at: "2026-05-06T06:22:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab76e81fc1842c747b0a33da8cf9874e3537c5ab023450ee1a6a314453e7263
    source_path: concepts/presence.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw "프레즌스"는 다음에 대한 경량의 최선 노력 방식 보기입니다.

- **Gateway** 자체, 그리고
- **Gateway에 연결된 클라이언트**(Mac 앱, WebChat, CLI 등)

프레즌스는 주로 macOS 앱의 **인스턴스** 탭을 렌더링하고
운영자가 빠르게 가시성을 확보하는 데 사용됩니다.

## 프레즌스 필드(표시되는 내용)

프레즌스 항목은 다음과 같은 필드를 가진 구조화된 객체입니다.

- `instanceId`(선택 사항이지만 강력 권장): 안정적인 클라이언트 ID(보통 `connect.client.instanceId`)
- `host`: 사람이 읽기 쉬운 호스트 이름
- `ip`: 최선 노력 방식의 IP 주소
- `version`: 클라이언트 버전 문자열
- `deviceFamily` / `modelIdentifier`: 하드웨어 힌트
- `mode`: `ui`, `webchat`, `cli`, `backend`, `probe`, `test`, `node`, ...
- `lastInputSeconds`: "마지막 사용자 입력 이후 경과한 초"(알려진 경우)
- `reason`: `self`, `connect`, `node-connected`, `periodic`, ...
- `ts`: 마지막 업데이트 타임스탬프(에포크 이후 ms)

## 생성자(프레즌스의 출처)

프레즌스 항목은 여러 소스에서 생성되고 **병합**됩니다.

### 1) Gateway 자체 항목

Gateway는 시작 시 항상 "자체" 항목을 시드하여, 클라이언트가 연결되기 전에도 UI에 게이트웨이 호스트가 표시되도록 합니다.

### 2) WebSocket 연결

모든 WS 클라이언트는 `connect` 요청으로 시작합니다. 핸드셰이크에 성공하면
Gateway는 해당 연결에 대한 프레즌스 항목을 upsert합니다.

#### 일회성 CLI 명령이 표시되지 않는 이유

CLI는 짧은 일회성 명령을 위해 연결하는 경우가 많습니다. 인스턴스 목록이 불필요하게 늘어나는 것을 피하기 위해 `client.mode === "cli"`는 **프레즌스 항목으로 변환되지 않습니다**.

### 3) `system-event` 비콘

클라이언트는 `system-event` 메서드를 통해 더 풍부한 주기적 비콘을 보낼 수 있습니다. Mac 앱은 이를 사용해 호스트 이름, IP, `lastInputSeconds`를 보고합니다.

### 4) Node 연결(role: node)

Node가 `role: node`로 Gateway WebSocket을 통해 연결되면, Gateway는 해당 Node에 대한 프레즌스 항목을 upsert합니다(다른 WS 클라이언트와 동일한 흐름).

## 병합 + 중복 제거 규칙(`instanceId`가 중요한 이유)

프레즌스 항목은 단일 인메모리 맵에 저장됩니다.

- 항목은 **프레즌스 키**를 기준으로 키가 지정됩니다.
- 가장 좋은 키는 재시작 후에도 유지되는 안정적인 `instanceId`(`connect.client.instanceId`에서 가져옴)입니다.
- 키는 대소문자를 구분하지 않습니다.

클라이언트가 안정적인 `instanceId` 없이 다시 연결하면 **중복** 행으로 표시될 수 있습니다.

## TTL 및 제한된 크기

프레즌스는 의도적으로 일시적입니다.

- **TTL:** 5분보다 오래된 항목은 정리됩니다
- **최대 항목 수:** 200개(가장 오래된 항목부터 삭제)

이렇게 하면 목록을 최신 상태로 유지하고 메모리가 무한히 증가하지 않도록 할 수 있습니다.

## 원격/터널 주의 사항(loopback IP)

클라이언트가 SSH 터널 / 로컬 포트 포워딩을 통해 연결되면 Gateway는 원격 주소를 `127.0.0.1`로 볼 수 있습니다. 클라이언트가 보고한 양호한 IP를 덮어쓰지 않도록 loopback 원격 주소는 무시됩니다.

## 소비자

### macOS 인스턴스 탭

macOS 앱은 `system-presence`의 출력을 렌더링하고 마지막 업데이트의 경과 시간에 따라 작은 상태 표시기(활성/유휴/오래됨)를 적용합니다.

## 디버깅 팁

- 원시 목록을 보려면 Gateway에 대해 `system-presence`를 호출하세요.
- 중복이 보이는 경우:
  - 클라이언트가 핸드셰이크에서 안정적인 `client.instanceId`를 보내는지 확인하세요
  - 주기적 비콘이 동일한 `instanceId`를 사용하는지 확인하세요
  - 연결에서 파생된 항목에 `instanceId`가 누락되었는지 확인하세요(이 경우 중복은 예상된 동작입니다)

## 관련 항목

<CardGroup cols={2}>
  <Card title="입력 표시기" href="/ko/concepts/typing-indicators" icon="ellipsis">
    입력 표시기가 전송되는 시점과 이를 조정하는 방법입니다.
  </Card>
  <Card title="스트리밍 및 청킹" href="/ko/concepts/streaming" icon="bars-staggered">
    아웃바운드 스트리밍, 청킹, 채널별 포맷 지정입니다.
  </Card>
  <Card title="Gateway 아키텍처" href="/ko/concepts/architecture" icon="diagram-project">
    프레즌스 업데이트를 구동하는 Gateway 구성 요소와 WebSocket 프로토콜입니다.
  </Card>
  <Card title="Gateway 프로토콜" href="/ko/gateway/protocol" icon="plug">
    `connect`, `system-event`, `system-presence`의 와이어 프로토콜입니다.
  </Card>
</CardGroup>
