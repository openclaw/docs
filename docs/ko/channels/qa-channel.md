---
read_when:
    - 로컬 또는 CI 테스트 실행에 합성 QA 전송 계층을 연결합니다
    - 번들로 제공되는 qa-channel 구성 인터페이스가 필요합니다
    - 엔드투엔드 QA 자동화를 반복 개선하고 있습니다
summary: 결정론적 OpenClaw QA 시나리오를 위한 합성 Slack급 채널 Plugin
title: QA 채널
x-i18n:
    generated_at: "2026-07-16T12:19:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel`은 자동화된 OpenClaw QA를 위한 저장소 로컬 합성 메시지 전송 수단입니다(`extensions/qa-channel`, 비공개 패키지, 패키징된 설치에서 제외됨). 프로덕션 채널이 아니며, 상태를 결정론적으로 유지하고 완전히 검사할 수 있도록 하면서 실제 전송 수단이 사용하는 것과 동일한 채널 Plugin 경계를 실행하기 위해 존재합니다.

## 기능

- Slack급 대상 문법:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 공유 `channel:` 및 `group:` 대화는 에이전트에 그룹/채널 룸 턴으로 표시되므로 Discord, Slack, Telegram 및 유사한 전송 수단에서 사용하는 것과 동일한 표시 응답 및 메시지 도구 라우팅 정책을 실행합니다.
- 수신 메시지 주입, 발신 트랜스크립트 캡처, 스레드 생성, 반응, 편집, 삭제 및 검색/읽기 작업을 위한 HTTP 기반 합성 버스입니다.
- `.artifacts/qa-e2e/`에 Markdown 보고서를 작성하는 호스트 측 자체 검사 실행기입니다.

## 구성

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

계정 키:

- `enabled` - 이 계정의 마스터 토글입니다.
- `name` - 선택적 표시 레이블입니다.
- `baseUrl` - 합성 버스 URL입니다. 이 값이 설정되면 계정이 구성된 것으로 간주합니다.
- `botUserId` - 대상 문법에서 사용하는 합성 봇 사용자 ID입니다(기본값: `openclaw`).
- `botDisplayName` - 발신 메시지의 표시 이름입니다(기본값: `OpenClaw QA`).
- `pollTimeoutMs` - 롱 폴링 대기 시간입니다. 100에서 30000 사이의 정수입니다(기본값: 1000).
- `allowFrom` - 발신자 허용 목록입니다(사용자 ID 또는 `"*"`; 기본값: `["*"]`). DM에는
  항상 `open` 정책이 적용되며, 허용 목록 기반 그룹 정책에서도 이러한 합성
  발신자 ID를 사용합니다.
- `groupPolicy` - 공유 룸 정책: `"open"`(기본값), `"allowlist"` 또는
  `"disabled"`입니다.
- `groupAllowFrom` - 선택적 공유 룸 발신자 허용 목록입니다.
  `"allowlist"`에서 생략하면 QA Channel은 `allowFrom`로 대체합니다.
- `groups.<room>.requireMention` - 특정 그룹/채널 룸에서 응답하기 전에 봇 멘션을
  요구합니다(기본값: false). `groups."*"`에서 기본값을 설정하며,
  룸별 `tools` / `toolsBySender`에서 도구 정책 재정의를 설정합니다.
- `defaultTo` - 대상이 제공되지 않았을 때 사용할 대체 대상입니다.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - 작업별 도구 게이팅입니다.

최상위 수준의 다중 계정 키:

- `accounts` - 계정 ID를 키로 사용하는 명명된 계정별 재정의 레코드입니다.
- `defaultAccount` - 여러 계정이 구성된 경우 선호하는 계정 ID입니다.

## 실행기

호스트 측 자체 검사(`.artifacts/qa-e2e/` 아래에 Markdown 보고서 작성):

```bash
pnpm qa:e2e
```

이 명령은 `qa-lab`을 통해 라우팅하고, 저장소 내 QA 버스를 시작하며, `qa-channel` 런타임 슬라이스를 부팅한 다음 결정론적 자체 검사를 실행합니다.

전체 저장소 기반 시나리오 모음:

```bash
pnpm openclaw qa suite
```

QA Gateway 레인에 대해 시나리오를 병렬로 실행합니다. 시나리오, 프로필 및 제공자 모드는 [QA 개요](/ko/concepts/qa-e2e-automation)를 참조하십시오.

Docker 기반 QA 사이트(하나의 스택에 Gateway + QA Lab 디버거 UI):

```bash
pnpm qa:lab:up
```

QA 사이트를 빌드하고, Docker 기반 Gateway + QA Lab 스택을 시작한 다음 QA Lab URL을 출력합니다. 여기에서 시나리오를 선택하고, 모델 레인을 선택하며, 개별 실행을 시작하고, 결과를 실시간으로 확인할 수 있습니다. QA Lab 디버거는 배포되는 Control UI 번들과 별개입니다.

## 관련 항목

- [QA 개요](/ko/concepts/qa-e2e-automation) - 전체 스택, 전송 어댑터, Matrix 프로필 및 시나리오 작성
- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [채널 개요](/ko/channels)
