---
read_when:
    - Codex 플릿 감독 설계
    - Codex 세션을 읽고, 조종하거나, 생성하는 OpenClaw 도구 빌드
    - 감독형 Codex를 위한 로컬, Cloudflare, VPS 배포 선택
summary: OpenClaw가 제어하는 Codex 앱 서버 세션을 위한 플릿 감독 계획.
title: Claw 감독자
x-i18n:
    generated_at: "2026-06-27T18:10:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw 감독자

## 목표

Claw 감독자는 항상 켜져 있는 하나의 OpenClaw 인스턴스가 일반적인 Codex 사용자 경험을 바꾸지 않고 Codex 세션 플릿을 모니터링하고 구동할 수 있게 합니다. 사용자는 호스트에 SSH로 접속하고, Codex를 시작하고, TUI에서 작업하면서도 감독자가 세션을 읽고, 조정하고, 중단하고, 관련 세션을 생성하고, 핸드오프를 수락하게 할 수 있습니다. Codex 세션은 MCP를 통해 OpenClaw로 다시 호출할 수도 있습니다.

## 제품 모델

Codex는 기본 작업 표면으로 유지됩니다. OpenClaw는 Codex를 불투명한 OpenClaw 하위 에이전트 안에 숨기는 대신 Codex를 감독합니다.

OpenClaw Plugin의 이름은 `codex-supervisor`입니다. `crabfleet`는 재사용 가능한 Plugin 이름이 아니라 CRAB 머신의 배포 및 호스트 플릿 프로필로 유지됩니다.

이 모델에는 세 가지 역할이 있습니다.

- 사람이 붙어 있는 Codex: 공유 앱 서버를 통해 시작되는 일반 대화형 Codex TUI입니다.
- 자율 Codex: 감독자가 생성하고 사람이 나중에 연결할 수 있는 Codex 앱 서버 스레드입니다.
- 감독자 Claw: 플릿 상태, transcript 읽기, 조정, 중단, 생성, 핸드오프를 위한 도구를 갖춘 항상 켜져 있는 OpenClaw 에이전트입니다.

OpenClaw는 내부적으로 기존 하위 에이전트 장치를 사용할 수 있지만, 외부 계약은 Codex 스레드 ID가 있는 연결 가능한 Codex 세션입니다.

## 아키텍처

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

각 Codex 지원 호스트는 다음을 실행합니다.

- Codex 앱 서버 데몬.
- 항상 `--remote`로 대화형 Codex를 시작하는 런처.
- 앱 서버 엔드포인트와 라이브 스레드를 감독자에 등록하는 커넥터.

감독자는 다음을 실행합니다.

- 엔드포인트 레지스트리.
- 세션 레지스트리.
- Codex 앱 서버 JSON-RPC 클라이언트 풀.
- Codex에서 Claw로 호출하기 위한 MCP 서버.
- Claw에서 Codex를 제어하기 위한 OpenClaw 도구.
- 자율 동작, 승인, 루프 방지를 위한 정책 엔진.

## Codex 앱 서버 계약

Codex 앱 서버 API를 표준 제어 평면으로 사용합니다.

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

대화형 Codex는 TUI와 감독자가 같은 앱 서버에 연결되도록 `codex --remote <endpoint>`로 시작해야 합니다. 독립 실행형 `codex exec`는 현재 라이브 공유 세션이 아닙니다. Codex가 `exec --remote`를 지원할 때까지는 자율 작업에 앱 서버 API를 사용하세요.

## 세션 레지스트리

감독자는 관찰된 Codex 스레드마다 하나의 레코드를 저장합니다.

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

로컬 구현은 대부분의 필드를 Codex 스레드 메타데이터에서 파생할 수 있습니다. 플릿 배포는 호스트 ID, 사용자 연결 상태, git 상태, 사이드카 상태로 레코드를 보강해야 합니다.

## Codex용 MCP 표면

감독되는 모든 Codex에는 `openclaw-codex-supervisor`라는 MCP 서버가 제공됩니다.

도구:

- `codex_sessions_list`: 보이는 Codex 세션을 나열합니다.
- `codex_session_read`: 하나의 transcript를 읽습니다.
- `codex_session_send`: 유휴 스레드에 메시지를 보내거나 활성 스레드를 조정합니다.
- `codex_session_interrupt`: 활성 턴을 중단합니다.
- `codex_endpoint_probe`: 엔드포인트 연결을 확인합니다.
- `claw_report_progress`: 현재 작업 상태를 감독자에 게시합니다.
- `claw_ask`: 감독자에게 도움이나 위임을 요청합니다.
- `codex_spawn`: 새 자율 Codex 세션을 생성합니다.
- `codex_handoff`: 사람 또는 피어 인계를 요청합니다.

리소스:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Claw 제어 표면

항상 켜져 있는 Claw는 내부 도구와 동일한 프리미티브를 받습니다.

- 세션 및 엔드포인트 나열
- transcript 읽기
- 텍스트 보내기/조정
- 활성 작업 중단
- 새 세션 생성
- 세션 요약 및 할당
- 필터링된 그룹에 지시 브로드캐스트
- 세션을 차단됨, 완료됨, 또는 폐기됨으로 표시

도구 동작:

- 대상 스레드가 유휴 상태이면 `codex_session_send`는 `turn/start`로 매핑됩니다.
- 대상 스레드가 활성 상태이고 진행 중인 턴 ID가 보이면 `turn/steer`로 매핑됩니다.
- 활성 턴을 식별할 수 없으면 도구는 관련 없는 턴을 생성하는 대신 닫힌 상태로 실패합니다.
- Codex에 노출된 MCP 쓰기 제어는 신뢰할 수 있는 감독자 전용 정책이 활성화하지 않는 한 비활성화 상태로 유지됩니다.
- 원시 transcript 읽기는 신뢰할 수 있는 감독자 전용 정책이 활성화하지 않는 한 비활성화 상태로 유지됩니다.
- 자율 승인 기본값은 명시적 정책이 달리 지정하지 않는 한 도구/파일 승인을 거부합니다.

## 시작 흐름

대화형 호스트 로그인:

1. 사용자가 CRAB 호스트에 SSH로 접속합니다.
2. SSH 서비스가 `codex app-server daemon start`를 시작하거나 확인합니다.
3. 로그인 래퍼가 `codex --remote unix:// --cd <workspace>`를 시작합니다.
4. 호스트 커넥터가 엔드포인트와 로드된 스레드를 등록합니다.
5. 감독자가 높은 우선순위의 플릿 이벤트를 내보냅니다: 새 Codex 세션, 작업공간, 사람이 붙어 있는 상태, 현재 작업 미리보기.
6. 감독자 Claw는 즉시 읽고 조정할 수 있습니다.

자율 생성:

1. 감독자가 호스트와 작업공간을 선택합니다.
2. 호스트 커넥터가 Codex 앱 서버 스레드를 열거나 재개합니다.
3. 감독자가 작업 텍스트와 MCP 구성으로 첫 번째 턴을 시작합니다.
4. 세션 레지스트리가 이를 자율 및 연결 가능으로 표시합니다.
5. Codex가 해당 정확한 UX를 지원하면 사람은 나중에 `codex --remote <endpoint> resume <threadId>`로 연결할 수 있으며, 또는 같은 앱 서버의 현재 재개 흐름을 통해 연결할 수 있습니다.

## 배포

권장 제어 평면:

- 호스트 커넥터는 감독자로 나가는 WebSocket 연결을 유지합니다.
- 감독자 상태는 OpenClaw Gateway 저장소에 저장됩니다.
- Codex 앱 서버는 각 호스트에 로컬로 유지됩니다. 인증되지 않은 원시 앱 서버를 공개 인터넷에 절대 노출하지 마세요.

Cloudflare 적합성:

- 레지스트리, Durable Objects, WebSocket 팬인, 경량 이벤트 라우팅, 공개 MCP/Gateway 엔드포인트에 적합합니다.
- Workers는 임의의 사설 Unix 소켓이나 local loopback 앱 서버로 다이얼할 수 없기 때문에 직접적인 사설 호스트 제어에는 그 자체만으로 충분하지 않습니다.
- 모든 호스트 커넥터가 아웃바운드 WebSocket으로 홈에 연결할 때 Cloudflare를 사용하세요.

VPS 폴백:

- 장기 실행 프로세스 제어, SSH 터널, 사설 네트워크 라우팅, 또는 로컬 파일시스템 접근이 필요할 때 Hetzner 서비스를 사용하세요.
- 동일한 프로토콜을 유지합니다: 호스트 커넥터는 아웃바운드, 감독자 레지스트리는 중앙, Codex 앱 서버는 로컬.

## 보안

- 기본 바인드는 로컬 Unix 소켓입니다.
- 원격 앱 서버는 토큰 또는 서명된 bearer 인증을 사용합니다.
- 호스트 커넥터는 범위가 지정된 호스트 토큰으로 감독자에 인증합니다.
- 감독자 도구는 세션별 정책을 적용합니다: 읽기, 조정, 중단, 생성, 승인.
- 에이전트 간 메시지에는 `originSessionId`가 포함되며, 자기 에코는 삭제됩니다.
- 브로드캐스트에는 명시적 필터와 제한된 대상 수가 필요합니다.
- transcript 읽기는 OpenClaw 경계에서 비밀을 마스킹합니다.
- 승인 요청은 정책이 허용하지 않는 한 감독자에서 시작된 턴에 대해 기본적으로 거부됩니다.

## 구현 계획

1단계: 로컬 감독자 MVP

- stdio 프록시와 WebSocket 엔드포인트를 위한 Codex 앱 서버 JSON-RPC 클라이언트를 추가합니다.
- 감독자 엔드포인트/세션 레지스트리를 추가합니다.
- MCP 도구를 추가합니다: 나열, 읽기, 보내기, 중단, 프로브.
- 엔드포인트용 로컬 환경 구성을 추가합니다.
- 가짜 앱 서버 테스트와 하나의 라이브 로컬 앱 서버 스모크를 추가합니다.

2단계: OpenClaw 통합

- `codex-supervisor` Plugin에 감독자 도구를 등록합니다.
- Codex 스레드 구성에 감독자 MCP를 주입합니다.
- 에이전트 컨텍스트에 세션 요약을 추가합니다.
- 새 Codex 스레드가 나타나면 이벤트 알림을 추가합니다.
- 자율 보내기/중단/생성을 위한 정책 구성을 추가합니다.

3단계: 플릿 커넥터

- 호스트 사이드카가 앱 서버 엔드포인트, 호스트 메타데이터, git/작업공간 메타데이터, 사람 연결 상태를 등록합니다.
- Cloudflare 또는 VPS 제어 평면을 위한 아웃바운드 WebSocket 커넥터를 추가합니다.
- 재연결, Heartbeat, 오래된 세션 정리를 추가합니다.
- CRAB SSH 런처 래퍼를 추가합니다.

4단계: 자율 운영

- 생성/재개/인수 흐름을 추가합니다.
- 브로드캐스트와 위임을 추가합니다.
- 진행 보고와 작업 상태 요약을 추가합니다.
- 루프 방지와 속도 제한을 추가합니다.
- 대시보드 보기를 추가합니다.

5단계: 다중 Claw

- 그룹별로 세션을 샤딩합니다.
- 각 세션에 대한 리더십/리스을 추가합니다.
- 감사 로그와 재생을 추가합니다.
- Claw 그룹 간 에스컬레이션을 추가합니다.

## 인수 테스트

- 사람이 공유 앱 서버를 통해 Codex TUI를 시작합니다.
- 감독자가 `thread/loaded/list`를 통해 라이브 스레드를 나열합니다.
- 감독자가 `thread/read`를 통해 transcript를 읽습니다.
- 감독자가 `turn/start`를 통해 유휴 스레드에 텍스트를 보냅니다.
- 감독자가 `turn/steer`를 통해 활성 스레드를 조정합니다.
- 감독자 중단이 `turn/interrupt`를 통해 활성 턴을 중지합니다.
- Codex가 감독자 MCP를 호출하고 피어 세션을 나열합니다.
- 자율 Codex가 생성되고 나중에 사람이 연결됩니다.
- 손실된 호스트 커넥터는 기록을 삭제하지 않고 세션을 오래됨으로 표시합니다.

## 미해결 질문

- TUI 없이 생성된 앱 서버 스레드에 대한 정확한 Codex TUI 연결 UX.
- 헤드리스 라이브 공유 실행을 위해 Codex가 `exec --remote`를 추가해야 하는지 여부.
- 영속 상태 소유자: OpenClaw Gateway DB, Cloudflare Durable Object, 또는 VPS 데이터베이스.
- 감독자에서 시작된 턴에 대한 승인 정책 세분성.
- 얼마나 많은 transcript 요약을 항상 켜져 있는 Claw 컨텍스트에 주입하고, 얼마나 도구/리소스로 유지할지.
