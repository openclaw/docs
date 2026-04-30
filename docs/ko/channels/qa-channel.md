---
read_when:
    - 합성 QA 전송 계층을 로컬 또는 CI 테스트 실행에 연결하고 있습니다
    - 번들된 qa-channel 설정 인터페이스가 필요합니다
    - 엔드투엔드 QA 자동화를 반복 개선하고 있습니다
summary: 결정론적 OpenClaw QA 시나리오를 위한 합성 Slack급 채널 Plugin
title: QA 채널
x-i18n:
    generated_at: "2026-04-30T06:19:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel`은 자동화된 OpenClaw QA를 위한 번들 합성 메시지 전송 계층입니다. 프로덕션 채널이 아니며, 상태를 결정적으로 유지하고 완전히 검사 가능하게 하면서 실제 전송 계층에서 사용하는 동일한 채널 Plugin 경계를 실행하기 위해 존재합니다.

## 수행하는 작업

- Slack 계열 대상 문법:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- 인바운드 메시지 주입, 아웃바운드 대화 기록 캡처, 스레드 생성, 반응, 편집, 삭제, 검색/읽기 동작을 위한 HTTP 기반 합성 버스.
- Markdown 보고서를 `.artifacts/qa-e2e/`에 쓰는 호스트 측 자체 점검 실행기.

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

- `enabled` — 이 계정의 마스터 토글입니다.
- `name` — 선택적 표시 레이블입니다.
- `baseUrl` — 합성 버스 URL입니다.
- `botUserId` — 대상 문법에 사용되는 Matrix 스타일 봇 사용자 ID입니다.
- `botDisplayName` — 아웃바운드 메시지의 표시 이름입니다.
- `pollTimeoutMs` — 롱 폴링 대기 창입니다. 100에서 30000 사이의 정수입니다.
- `allowFrom` — 발신자 허용 목록입니다(사용자 ID 또는 `"*"`).
- `defaultTo` — 대상이 제공되지 않았을 때의 대체 대상입니다.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — 동작별 도구 게이팅입니다.

최상위 수준의 다중 계정 키:

- `accounts` — 계정 ID를 키로 하는 이름 지정 계정별 재정의 레코드입니다.
- `defaultAccount` — 여러 계정이 구성된 경우 선호하는 계정 ID입니다.

## 실행기

호스트 측 자체 점검(`.artifacts/qa-e2e/` 아래에 Markdown 보고서 작성):

```bash
pnpm qa:e2e
```

이는 `qa-lab`을 통해 라우팅하고, 저장소 내 QA 버스를 시작하며, 번들 `qa-channel` 런타임 슬라이스를 부팅하고, 결정적 자체 점검을 실행합니다.

전체 저장소 기반 시나리오 스위트:

```bash
pnpm openclaw qa suite
```

QA Gateway 레인을 대상으로 시나리오를 병렬로 실행합니다. 시나리오, 프로필, 제공자 모드는 [QA 개요](/ko/concepts/qa-e2e-automation)를 참조하세요.

Docker 기반 QA 사이트(Gateway + QA Lab 디버거 UI를 하나의 스택으로 제공):

```bash
pnpm qa:lab:up
```

QA 사이트를 빌드하고, Docker 기반 Gateway + QA Lab 스택을 시작하며, QA Lab URL을 출력합니다. 여기에서 시나리오를 선택하고, 모델 레인을 선택하며, 개별 실행을 시작하고, 결과를 실시간으로 볼 수 있습니다. QA Lab 디버거는 배포되는 Control UI 번들과 별개입니다.

## 관련 항목

- [QA 개요](/ko/concepts/qa-e2e-automation) — 전체 스택, 전송 어댑터, 시나리오 작성
- [Matrix QA](/ko/concepts/qa-matrix) — 실제 채널을 구동하는 라이브 전송 실행기 예시
- [페어링](/ko/channels/pairing)
- [그룹](/ko/channels/groups)
- [채널 개요](/ko/channels)
