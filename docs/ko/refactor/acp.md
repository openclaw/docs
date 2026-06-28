---
read_when:
    - ACP 세션 수명 주기 또는 ACPX 프로세스 정리 리팩터링
    - ACPX 고아 프로세스, PID 재사용 또는 다중 Gateway 정리 안전성 디버깅
    - 생성된 ACP 또는 하위 에이전트 세션의 sessions_list 표시 여부 변경
    - 백그라운드 작업, ACP 세션 또는 프로세스 리스를 위한 소유권 메타데이터 설계
sidebarTitle: ACP lifecycle refactor
summary: ACP 세션 및 ACPX 프로세스 소유권을 명시화하기 위한 마이그레이션 계획
title: ACP 수명 주기 리팩터링
x-i18n:
    generated_at: "2026-05-07T13:24:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b7f4ee447e0b436601c68251c26c1b897a642f6a8b1886d18647b62817996792
    source_path: refactor/acp.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ACP 수명 주기는 현재 작동하지만, 너무 많은 부분이 사후에 추론됩니다.
프로세스 정리는 PID, 명령 문자열, 래퍼 경로, 라이브 프로세스 테이블에서
소유권을 재구성합니다. 세션 가시성은 세션 키 문자열과 보조
`sessions.list({ spawnedBy })` 조회로 소유권을 재구성합니다.
이 방식은 좁은 범위의 수정은 가능하게 하지만, 다음과 같은 엣지 케이스를
놓치기도 쉽습니다. PID 재사용, 따옴표 처리된 명령, 어댑터 손자 프로세스,
다중 Gateway 상태 루트, `cancel` 대 `close`, 그리고 `tree` 대 `all`
가시성이 모두 같은 소유권 규칙을 다시 발견해야 하는 별도 위치가 됩니다.

이 리팩터링은 소유권을 일급 개념으로 만듭니다. 목표는 새로운 ACP 제품
표면이 아니라, 기존 ACP 및 ACPX 동작을 위한 더 안전한 내부 계약입니다.

## 목표

- 현재 라이브 증거가 OpenClaw 소유 리스와 일치하지 않는 한 정리는
  프로세스에 절대 신호를 보내지 않습니다.
- `cancel`, `close`, 시작 시 정리는 서로 다른 수명 주기 의도를 가집니다.
- `sessions_list`, `sessions_history`, `sessions_send`, 상태 확인은 같은
  요청자 소유 세션 모델을 사용합니다.
- 다중 Gateway 설치가 서로의 ACPX 래퍼를 정리할 수 없습니다.
- 이전 ACPX 세션 레코드는 마이그레이션 중에도 계속 작동합니다.
- 런타임은 계속 Plugin 소유입니다. 코어는 ACPX 패키지 세부 정보를 알지 않습니다.

## 비목표

- ACPX를 대체하거나 공개 `/acp` 명령 표면을 변경하는 것.
- 벤더별 ACP 어댑터 동작을 코어로 이동하는 것.
- 업그레이드 전에 사용자가 상태를 수동으로 정리하도록 요구하는 것.
- `cancel`이 재사용 가능한 ACP 세션을 닫도록 만드는 것.

## 대상 모델

### Gateway 인스턴스 식별자

각 Gateway 프로세스에는 안정적인 런타임 인스턴스 ID가 있어야 합니다.

```ts
type GatewayInstanceId = string;
```

이는 Gateway 시작 시 생성하고 해당 설치의 수명 동안 상태에 유지할 수
있습니다. 보안 비밀이 아니라 한 Gateway의 ACP 프로세스를 다른 Gateway의
프로세스와 혼동하지 않기 위한 소유권 구분자입니다.

### ACP 세션 소유권

생성된 모든 ACP 세션에는 정규화된 소유권 메타데이터가 있어야 합니다.

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Gateway는 알려진 경우 세션 행에서 이러한 필드를 반환해야 합니다.
가시성 필터링은 행 메타데이터에 대한 순수 검사여야 합니다.

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

이를 통해 가시성 확인에서 숨겨진 보조 `sessions.list({ spawnedBy })`
호출을 제거합니다. 생성된 교차 에이전트 ACP 자식은 두 번째 쿼리가 우연히
찾았기 때문이 아니라, 행이 그렇게 말하기 때문에 요청자 소유입니다.

### ACPX 프로세스 리스

생성된 모든 래퍼 실행은 리스 레코드를 만들어야 합니다.

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

래퍼 프로세스는 환경에서 리스 ID와 Gateway 인스턴스 ID를 받아야 합니다.

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

플랫폼이 허용하는 경우 검증은 명령 따옴표 처리와 혼동될 수 없는 라이브
프로세스 메타데이터를 우선해야 합니다.

- 루트 PID가 여전히 존재함
- 라이브 래퍼 경로가 `wrapperRoot` 아래에 있음
- 사용 가능한 경우 프로세스 그룹이 리스와 일치함
- 읽을 수 있는 경우 환경에 예상 리스 ID가 포함됨
- 명령 해시 또는 실행 파일 경로가 리스와 일치함

라이브 프로세스를 검증할 수 없으면 정리는 실패-폐쇄 방식으로 실패합니다.

## 수명 주기 컨트롤러

프로세스 리스와 정리 정책을 소유하는 단일 ACPX 수명 주기 컨트롤러를 도입합니다.

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn`은 턴 취소만 요청합니다. 재사용 가능한 래퍼나 어댑터
프로세스를 정리해서는 안 됩니다.

`closeSession`은 정리할 수 있지만, 세션 레코드를 로드하고, 리스를
로드하고, 라이브 프로세스 트리가 여전히 해당 리스에 속하는지 검증한
후에만 가능합니다.

`reapStartupOrphans`는 상태의 열린 리스에서 시작합니다. 프로세스 테이블을
사용해 하위 프로세스를 찾을 수 있지만, 먼저 임의의 ACP처럼 보이는 명령을
스캔한 뒤 아마 우리 것이라고 결정해서는 안 됩니다.

## 래퍼 계약

생성된 래퍼는 작게 유지되어야 합니다. 래퍼는 다음을 수행해야 합니다.

- 지원되는 경우 프로세스 그룹에서 어댑터 시작
- 일반 종료 신호를 프로세스 그룹으로 전달
- 부모 프로세스 종료 감지
- 부모 프로세스 종료 시 SIGTERM을 보낸 뒤 SIGKILL 폴백이 실행될 때까지
  래퍼를 계속 살려 둠
- 사용 가능한 경우 루트 PID와 프로세스 그룹 ID를 수명 주기 컨트롤러에 보고

래퍼가 세션 정책을 결정해서는 안 됩니다. 래퍼는 자체 어댑터 그룹에 대한
로컬 프로세스 트리 정리만 강제합니다.

## 세션 가시성 계약

가시성은 정규화된 행 소유권을 사용해야 합니다.

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

규칙:

- `self`: 요청자 세션만.
- `tree`: 요청자 세션과 요청자가 소유하거나 요청자에서 생성된 행.
- `all`: 같은 에이전트의 모든 행, a2a가 허용된 교차 에이전트 행, 그리고
  일반 a2a가 비활성화되어 있어도 요청자 소유로 생성된 교차 에이전트 행.
- `agent`: 같은 에이전트만, 단 명시적 소유자 관계가 해당 행이 요청자에게
  속한다고 말하는 경우는 예외.

이렇게 하면 `tree`와 `all`은 단조적이 됩니다. `all`은 `tree`가 보여줄
소유 자식을 숨겨서는 안 됩니다.

## 마이그레이션 계획

### 1단계: 식별자와 리스 추가

- Gateway 상태에 `gatewayInstanceId`를 추가합니다.
- ACPX 상태 디렉터리 아래에 ACPX 리스 저장소를 추가합니다.
- 생성된 래퍼를 생성하기 전에 리스를 기록합니다.
- 새 ACPX 세션 레코드에 `leaseId`를 저장합니다.
- 이전 레코드를 위해 기존 PID와 명령 필드를 유지합니다.

### 2단계: 리스 우선 정리

- 닫기 정리를 `leaseId`를 먼저 로드하도록 변경합니다.
- 신호를 보내기 전에 리스를 기준으로 라이브 프로세스 소유권을 검증합니다.
- 현재 루트 PID와 래퍼 루트 폴백은 레거시 레코드에만 유지합니다.
- 검증된 정리 후 리스를 `closed`로 표시합니다.
- 정리 전에 프로세스가 사라진 경우 리스를 `lost`로 표시합니다.

### 3단계: 리스 우선 시작 시 정리

- 시작 시 정리는 열린 리스를 스캔합니다.
- 각 리스에 대해 루트 프로세스를 검증하고 하위 프로세스를 수집합니다.
- 검증된 트리를 자식 우선으로 정리합니다.
- 제한된 보존 기간으로 오래된 `closed` 및 `lost` 리스를 만료합니다.
- 명령 마커 스캔은 가능한 경우 래퍼 루트와 Gateway 인스턴스로 보호되는
  임시 레거시 폴백으로만 유지합니다.

### 4단계: 세션 소유권 행

- Gateway 세션 행에 소유권 메타데이터를 추가합니다.
- ACPX, 하위 에이전트, 백그라운드 작업, 세션 저장소 작성자가
  `ownerSessionKey` 또는 `spawnedBy`를 채우도록 가르칩니다.
- 세션 가시성 확인을 행 메타데이터 사용 방식으로 전환합니다.
- 가시성 확인 시점의 보조 `sessions.list({ spawnedBy })` 조회를 제거합니다.

### 5단계: 레거시 휴리스틱 제거

한 릴리스 기간 후:

- 비레거시 ACPX 정리에 대해 저장된 루트 명령 문자열에 의존하지 않음
- 명령 마커 시작 시 스캔 제거
- 가시성 폴백 목록 조회 제거
- 누락되었거나 검증할 수 없는 리스에 대해서는 방어적인 실패-폐쇄 동작 유지

## 테스트

두 개의 테이블 기반 스위트를 추가합니다.

프로세스 수명 주기 시뮬레이터:

- 관련 없는 프로세스가 PID를 재사용
- 다른 Gateway의 래퍼 루트가 PID를 재사용
- 저장된 래퍼 명령은 셸 따옴표 처리되어 있고, 라이브 `ps` 명령은 그렇지 않음
- 어댑터 자식은 종료되고 손자 프로세스는 프로세스 그룹에 남음
- 부모 프로세스 종료 SIGTERM 폴백이 SIGKILL에 도달
- 프로세스 목록을 사용할 수 없음
- 프로세스가 누락된 오래된 리스
- 래퍼, 어댑터 자식, 손자 프로세스가 있는 시작 시 고아 프로세스

세션 가시성 매트릭스:

- `self`, `tree`, `agent`, `all`
- a2a 활성화 및 비활성화
- 같은 에이전트 행
- 교차 에이전트 행
- 요청자 소유로 생성된 교차 에이전트 ACP 행
- `tree`로 제한된 샌드박스 요청자
- 목록, 기록, 전송, 상태 작업

중요한 불변 조건: 요청자 소유로 생성된 자식은 구성된 가시성이 요청자 세션
트리를 포함하는 모든 곳에서 보이고, `all`은 `tree`보다 덜 유능해서는 안 됩니다.

## 호환성 참고 사항

이전 세션 레코드에는 `leaseId`가 없을 수 있습니다. 이 경우 레거시
실패-폐쇄 정리 경로를 사용해야 합니다.

- 라이브 루트 프로세스를 요구
- 생성된 래퍼가 예상되는 경우 래퍼 루트 소유권을 요구
- 비래퍼 루트의 경우 명령 일치를 요구
- 오래된 저장 PID 메타데이터만으로는 절대 신호를 보내지 않음

레거시 레코드를 검증할 수 없으면 그대로 둡니다. 시작 시 리스 정리와 다음
릴리스 기간을 통해 결국 폴백을 폐기해야 합니다.

## 성공 기준

- 오래되었거나 부실한 ACPX 세션을 닫아도 다른 Gateway의 프로세스를 종료할 수 없습니다.
- 부모 프로세스 종료 후에도 끈질긴 어댑터 손자 프로세스가 계속 실행되지 않습니다.
- `cancel`은 재사용 가능한 세션을 닫지 않고 활성 턴을 중단합니다.
- `sessions_list`는 `tree`와 `all` 모두에서 요청자 소유 교차 에이전트 ACP
  자식을 표시할 수 있습니다.
- 시작 시 정리는 광범위한 명령 문자열 스캔이 아니라 리스에 의해 구동됩니다.
- 집중 프로세스 및 가시성 매트릭스 테스트는 이전에 일회성 검토 수정이
  필요했던 모든 엣지 케이스를 다룹니다.
