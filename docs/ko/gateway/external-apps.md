---
read_when:
    - OpenClaw와 통신하는 외부 앱, 스크립트, 대시보드, CI 작업 또는 IDE 확장을 구축하고 있습니다
    - Gateway RPC와 Plugin SDK 중에서 선택하고 있습니다
    - Gateway 에이전트 실행, 세션, 이벤트, 승인, 모델 또는 도구와 통합하는 경우
sidebarTitle: External apps
summary: 외부 앱, 스크립트, 대시보드, CI 작업, IDE 확장을 위한 현재 통합 경로
title: 외부 앱용 Gateway 통합
x-i18n:
    generated_at: "2026-06-27T17:28:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69a1bee50620326e68d40c821d36c0e321fced755a2b3904d77e55624117cbff
    source_path: gateway/external-apps.md
    workflow: 16
---

외부 앱은 현재 Gateway 프로토콜을 통해 OpenClaw와 통신해야 합니다. 스크립트, 대시보드, CI 작업, IDE
확장 프로그램 또는 다른 프로세스가 에이전트 실행을 시작하거나, 이벤트를 스트리밍하거나, 결과를 기다리거나,
작업을 취소하거나, Gateway 리소스를 검사하려는 경우 Gateway WebSocket 및 RPC 메서드를 사용하세요.

<Warning>
  아직 공개 npm 클라이언트 패키지는 없습니다. 릴리스 노트에서 게시된 패키지를 발표하고
  이 페이지에 설치 지침이 포함되기 전까지는 OpenClaw 클라이언트 패키지 이름을 애플리케이션
  의존성으로 추가하지 마세요.
</Warning>

<Note>
  이 페이지는 OpenClaw 프로세스 외부의 코드를 위한 것입니다. OpenClaw 내부에서 실행되는 Plugin 코드는
  대신 문서화된 `openclaw/plugin-sdk/*` 하위 경로를 사용해야 합니다.
</Note>

## 현재 사용할 수 있는 항목

| 표면                                    | 상태   | 사용 용도                                                                                      |
| --------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| [Gateway 프로토콜](/ko/gateway/protocol)   | 준비됨 | WebSocket 전송, 연결 핸드셰이크, 인증 범위, 프로토콜 버전 관리, 이벤트.                       |
| [Gateway RPC 참조](/ko/reference/rpc)      | 준비됨 | 에이전트, 세션, 작업, 모델, 도구, 아티팩트, 승인을 위한 현재 Gateway 메서드.                  |
| [`openclaw agent`](/ko/cli/agent)          | 준비됨 | CLI를 호출하는 것으로 충분한 경우의 일회성 스크립트 통합.                                     |
| [`openclaw message`](/ko/cli/message)      | 준비됨 | 스크립트에서 메시지 또는 채널 작업 보내기.                                                    |

소스 트리에는 향후 클라이언트 라이브러리를 위한 내부 패키지 작업이 포함되어 있지만,
이는 공개 설치 표면이 아닙니다. 패키지가 게시되고 버전이 지정될 때까지는 미리 보기 구현 세부 정보로
간주하세요.

## 권장 경로

1. Gateway를 실행하거나 검색합니다.
2. [Gateway 프로토콜](/ko/gateway/protocol)을 통해 연결합니다.
3. [Gateway RPC 참조](/ko/reference/rpc)의 문서화된 RPC 메서드를 호출합니다.
4. 테스트 기준으로 삼는 OpenClaw 버전을 고정합니다.
5. OpenClaw를 업그레이드할 때 RPC 참조를 다시 확인합니다.

에이전트 실행의 경우 `agent` RPC로 시작하고 최종 결과가 필요할 때는 `agent.wait`와 함께 사용하세요.
지속적인 대화 상태에는 `sessions.*` 메서드를 사용하세요. UI 통합의 경우 Gateway 이벤트를 구독하고
앱이 이해하는 이벤트 계열만 렌더링하세요.

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
- 신뢰할 수 있는 런타임 헬퍼

외부 앱은 `openclaw/plugin-sdk/*`를 가져오면 안 됩니다. 해당 하위 경로는
OpenClaw가 로드하는 Plugin을 위한 것입니다.

## 관련

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
