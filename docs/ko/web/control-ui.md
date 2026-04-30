---
read_when:
    - 브라우저에서 Gateway를 운영하려는 경우
    - SSH 터널 없이 Tailnet에 접근하려는 경우
sidebarTitle: Control UI
summary: Gateway용 브라우저 기반 제어 사용자 인터페이스(채팅, 노드, 구성)
title: 제어 UI
x-i18n:
    generated_at: "2026-04-30T06:57:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 982d25d48770b753faa4e57d9a284e9bff10c15cda21dd9c00848d2a6b912d41
    source_path: web/control-ui.md
    workflow: 16
---

제어 UI는 Gateway에서 제공되는 작은 **Vite + Lit** 단일 페이지 앱입니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

동일한 포트에서 **Gateway WebSocket에 직접** 통신합니다.

## 빠르게 열기(로컬)

Gateway가 같은 컴퓨터에서 실행 중이면 다음을 여세요.

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지가 로드되지 않으면 먼저 Gateway를 시작하세요: `openclaw gateway`.

인증은 WebSocket 핸드셰이크 중 다음을 통해 제공됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 신뢰할 수 있는 프록시 ID 헤더

대시보드 설정 패널은 현재 브라우저 탭 세션과 선택된 Gateway URL에 대한 토큰을 보관하며, 비밀번호는 저장하지 않습니다. 온보딩은 보통 첫 연결 시 공유 시크릿 인증을 위한 Gateway 토큰을 생성하지만, `gateway.auth.mode`가 `"password"`이면 비밀번호 인증도 작동합니다.

## 기기 페어링(첫 연결)

새 브라우저나 기기에서 제어 UI에 연결하면 Gateway는 보통 **일회성 페어링 승인**을 요구합니다. 이는 무단 접근을 방지하기 위한 보안 조치입니다.

**표시되는 내용:** "disconnected (1008): pairing required"

<Steps>
  <Step title="대기 중인 요청 나열">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="요청 ID로 승인">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

브라우저가 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 다시 시도하면 이전 대기 요청은 대체되고 새 `requestId`가 생성됩니다. 승인 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 페어링되어 있고 읽기 접근에서 쓰기/관리자 접근으로 변경하면, 이는 조용한 재연결이 아니라 승인 업그레이드로 처리됩니다. OpenClaw는 기존 승인을 활성 상태로 유지하고, 더 넓은 범위의 재연결을 차단하며, 새 범위 세트를 명시적으로 승인하라고 요청합니다.

승인되면 기기가 기억되며, `openclaw devices revoke --device <id> --role <role>`로 철회하지 않는 한 다시 승인할 필요가 없습니다. 토큰 회전 및 철회는 [기기 CLI](/ko/cli/devices)를 참고하세요.

<Note>
- 직접 local loopback 브라우저 연결(`127.0.0.1` / `localhost`)은 자동 승인됩니다.
- `gateway.auth.allowTailscale: true`이고, Tailscale ID가 검증되며, 브라우저가 기기 ID를 제시하면 Tailscale Serve는 제어 UI 운영자 세션의 페어링 왕복 과정을 건너뛸 수 있습니다.
- 직접 Tailnet 바인딩, LAN 브라우저 연결, 기기 ID가 없는 브라우저 프로필은 여전히 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 기기 ID를 생성하므로, 브라우저를 바꾸거나 브라우저 데이터를 지우면 다시 페어링해야 합니다.

</Note>

## 개인 ID(브라우저 로컬)

제어 UI는 공유 세션에서 작성자 표시를 위해 발신 메시지에 연결되는 브라우저별 개인 ID(표시 이름 및 아바타)를 지원합니다. 이는 브라우저 저장소에 있으며, 현재 브라우저 프로필로 범위가 제한되고, 실제로 전송한 메시지의 일반적인 대화 기록 작성자 메타데이터 외에는 다른 기기로 동기화되거나 서버 측에 저장되지 않습니다. 사이트 데이터를 지우거나 브라우저를 바꾸면 빈 상태로 초기화됩니다.

같은 브라우저 로컬 패턴은 어시스턴트 아바타 재정의에도 적용됩니다. 업로드된 어시스턴트 아바타는 로컬 브라우저에서만 Gateway가 해석한 ID 위에 오버레이되며, `config.patch`를 통해 왕복하지 않습니다. 공유 `ui.assistant.avatar` 구성 필드는 필드를 직접 쓰는 비 UI 클라이언트(예: 스크립트 Gateway 또는 사용자 지정 대시보드)에서 계속 사용할 수 있습니다.

## 런타임 구성 엔드포인트

제어 UI는 `/__openclaw/control-ui-config.json`에서 런타임 설정을 가져옵니다. 해당 엔드포인트는 나머지 HTTP 표면과 동일한 Gateway 인증으로 보호됩니다. 인증되지 않은 브라우저는 이를 가져올 수 없으며, 성공적으로 가져오려면 이미 유효한 Gateway 토큰/비밀번호, Tailscale Serve ID 또는 신뢰할 수 있는 프록시 ID 중 하나가 필요합니다.

## 언어 지원

제어 UI는 첫 로드 시 브라우저 로캘을 기반으로 자체 지역화를 수행할 수 있습니다. 나중에 재정의하려면 **개요 -> Gateway 접근 -> 언어**를 여세요. 로캘 선택기는 외관 아래가 아니라 Gateway 접근 카드에 있습니다.

- 지원되는 로캘: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 영어가 아닌 번역은 브라우저에서 지연 로드됩니다.
- 선택한 로캘은 브라우저 저장소에 저장되고 이후 방문 시 재사용됩니다.
- 누락된 번역 키는 영어로 대체됩니다.

문서 번역은 동일한 비영어 로캘 세트에 대해 생성되지만, 문서 사이트의 기본 Mintlify 언어 선택기는 Mintlify가 허용하는 로캘 코드로 제한됩니다. 태국어(`th`) 및 페르시아어(`fa`) 문서도 게시 저장소에 생성되지만, Mintlify가 해당 코드를 지원할 때까지 선택기에 표시되지 않을 수 있습니다.

## 외관 테마

외관 패널은 내장 Claw, Knot, Dash 테마와 브라우저 로컬 tweakcn 가져오기 슬롯 하나를 유지합니다. 테마를 가져오려면 [tweakcn themes](https://tweakcn.com/themes)를 열고, 테마를 선택하거나 만든 뒤 **공유**를 클릭하고, 복사된 테마 링크를 외관에 붙여넣으세요. 가져오기는 `https://tweakcn.com/r/themes/<id>` 레지스트리 URL, `https://tweakcn.com/editor/theme?theme=amethyst-haze` 같은 편집기 URL, 상대 `/themes/<id>` 경로, 원시 테마 ID, `amethyst-haze` 같은 기본 테마 이름도 허용합니다.

가져온 테마는 현재 브라우저 프로필에만 저장됩니다. Gateway 구성에 기록되지 않으며 기기 간 동기화되지 않습니다. 가져온 테마를 교체하면 하나의 로컬 슬롯이 업데이트됩니다. 가져온 테마가 선택된 상태에서 이를 지우면 활성 테마가 Claw로 다시 전환됩니다.

## 할 수 있는 일(현재)

<AccordionGroup>
  <Accordion title="채팅 및 대화">
    - Gateway WS(`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)를 통해 모델과 채팅합니다.
    - 브라우저 실시간 세션을 통해 대화합니다. OpenAI는 직접 WebRTC를 사용하고, Google Live는 WebSocket을 통한 제한된 일회용 브라우저 토큰을 사용하며, 백엔드 전용 실시간 음성 Plugin은 Gateway 릴레이 전송을 사용합니다. 릴레이는 Provider 자격 증명을 Gateway에 보관하는 동안 브라우저가 `talk.realtime.relay*` RPC를 통해 마이크 PCM을 스트리밍하고, 더 크게 구성된 OpenClaw 모델을 위해 `openclaw_agent_consult` 도구 호출을 `chat.send`를 통해 다시 보냅니다.
    - 채팅에서 도구 호출과 실시간 도구 출력 카드(에이전트 이벤트)를 스트리밍합니다.

  </Accordion>
  <Accordion title="채널, 인스턴스, 세션, 꿈">
    - 채널: 내장 및 번들/외부 Plugin 채널 상태, QR 로그인, 채널별 구성(`channels.status`, `web.login.*`, `config.patch`).
    - 인스턴스: 현재 상태 목록 및 새로고침(`system-presence`).
    - 세션: 목록 및 세션별 모델/생각/빠름/상세/추적/추론 재정의(`sessions.list`, `sessions.patch`).
    - 꿈: Dreaming 상태, 활성화/비활성화 토글, Dream Diary 리더(`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, 노드, 실행 승인">
    - Cron 작업: 목록/추가/편집/실행/활성화/비활성화 및 실행 기록(`cron.*`).
    - Skills: 상태, 활성화/비활성화, 설치, API 키 업데이트(`skills.*`).
    - 노드: 목록 및 기능(`node.list`).
    - 실행 승인: `exec host=gateway/node`에 대한 Gateway 또는 노드 허용 목록 및 요청 정책 편집(`exec.approvals.*`).

  </Accordion>
  <Accordion title="구성">
    - `~/.openclaw/openclaw.json` 보기/편집(`config.get`, `config.set`).
    - 검증과 함께 적용 및 재시작(`config.apply`)하고 마지막 활성 세션을 깨웁니다.
    - 쓰기에는 동시 편집 덮어쓰기를 방지하는 기본 해시 보호가 포함됩니다.
    - 쓰기(`config.set`/`config.apply`/`config.patch`)는 제출된 구성 페이로드의 참조에 대해 활성 SecretRef 해석을 사전 검사합니다. 해석되지 않은 활성 제출 참조는 쓰기 전에 거부됩니다.
    - 스키마 및 폼 렌더링(`config.schema` / `config.schema.lookup`, 필드 `title` / `description`, 일치하는 UI 힌트, 즉시 하위 요약, 중첩 객체/와일드카드/배열/컴포지션 노드의 문서 메타데이터, 사용 가능한 경우 Plugin 및 채널 스키마 포함). 원시 JSON 편집기는 스냅샷이 안전한 원시 왕복을 지원할 때만 사용할 수 있습니다.
    - 스냅샷이 원시 텍스트를 안전하게 왕복할 수 없으면 제어 UI는 해당 스냅샷에 대해 폼 모드를 강제하고 원시 모드를 비활성화합니다.
    - 원시 JSON 편집기의 "저장된 값으로 재설정"은 평탄화된 스냅샷을 다시 렌더링하는 대신 원시 작성 형태(서식, 주석, `$include` 레이아웃)를 보존하므로, 스냅샷이 안전하게 왕복할 수 있을 때 외부 편집 내용이 재설정 후에도 유지됩니다.
    - 구조화된 SecretRef 객체 값은 실수로 객체가 문자열로 손상되는 것을 방지하기 위해 폼 텍스트 입력에서 읽기 전용으로 렌더링됩니다.

  </Accordion>
  <Accordion title="디버그, 로그, 업데이트">
    - 디버그: 상태/상태 점검/모델 스냅샷, 이벤트 로그, 수동 RPC 호출(`status`, `health`, `models.list`).
    - 로그: 필터/내보내기가 있는 Gateway 파일 로그의 실시간 tail(`logs.tail`).
    - 업데이트: 패키지/git 업데이트 및 재시작(`update.run`)을 재시작 보고서와 함께 실행한 다음, 재연결 후 `update.status`를 폴링하여 실행 중인 Gateway 버전을 확인합니다.

  </Accordion>
  <Accordion title="Cron 작업 패널 참고 사항">
    - 격리된 작업의 경우 전달 기본값은 요약 알림입니다. 내부 전용 실행을 원하면 없음으로 전환할 수 있습니다.
    - 알림이 선택되면 채널/대상 필드가 표시됩니다.
    - Webhook 모드는 `delivery.to`를 유효한 HTTP(S) Webhook URL로 설정한 상태에서 `delivery.mode = "webhook"`을 사용합니다.
    - 메인 세션 작업의 경우 Webhook 및 없음 전달 모드를 사용할 수 있습니다.
    - 고급 편집 컨트롤에는 실행 후 삭제, 에이전트 재정의 지우기, Cron 정확/분산 옵션, 에이전트 모델/생각 재정의, 최선 노력 전달 토글이 포함됩니다.
    - 폼 검증은 필드 수준 오류와 함께 인라인으로 표시됩니다. 잘못된 값은 수정될 때까지 저장 버튼을 비활성화합니다.
    - 전용 bearer 토큰을 보내려면 `cron.webhookToken`을 설정하세요. 생략하면 인증 헤더 없이 Webhook이 전송됩니다.
    - 사용 중단된 폴백: `notify: true`가 있는 저장된 레거시 작업은 마이그레이션될 때까지 계속 `cron.webhook`을 사용할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 채팅 동작

<AccordionGroup>
  <Accordion title="전송 및 기록 의미 체계">
    - `chat.send`는 **논블로킹**입니다. `{ runId, status: "started" }`로 즉시 확인 응답을 보내고, 응답은 `chat` 이벤트를 통해 스트리밍됩니다.
    - 채팅 업로드는 이미지와 동영상이 아닌 파일을 허용합니다. 이미지는 네이티브 이미지 경로를 유지하고, 다른 파일은 관리형 미디어로 저장되며 기록에는 첨부 링크로 표시됩니다.
    - 동일한 `idempotencyKey`로 다시 보내면 실행 중에는 `{ status: "in_flight" }`를 반환하고, 완료 후에는 `{ status: "ok" }`를 반환합니다.
    - `chat.history` 응답은 UI 안전성을 위해 크기가 제한됩니다. 트랜스크립트 항목이 너무 크면 Gateway가 긴 텍스트 필드를 잘라내거나, 무거운 메타데이터 블록을 생략하거나, 너무 큰 메시지를 자리 표시자(`[chat.history omitted: message too large]`)로 대체할 수 있습니다.
    - 어시스턴트/생성 이미지는 관리형 미디어 참조로 영구 저장되고 인증된 Gateway 미디어 URL을 통해 다시 제공되므로, 다시 로드할 때 원시 base64 이미지 페이로드가 채팅 기록 응답에 계속 남아 있는 것에 의존하지 않습니다.
    - `chat.history`는 또한 보이는 어시스턴트 텍스트에서 표시 전용 인라인 지시문 태그(예: `[[reply_to_*]]` 및 `[[audio_as_voice]]`), 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함), 유출된 ASCII/전각 모델 제어 토큰을 제거하고, 보이는 전체 텍스트가 정확한 무음 토큰 `NO_REPLY` / `no_reply`뿐인 어시스턴트 항목은 생략합니다.
    - 활성 전송 중 및 최종 기록 새로 고침 중에 `chat.history`가 잠시 오래된 스냅샷을 반환하면 채팅 뷰는 로컬의 낙관적 사용자/어시스턴트 메시지를 계속 표시합니다. Gateway 기록이 따라잡으면 정식 트랜스크립트가 해당 로컬 메시지를 대체합니다.
    - `chat.inject`는 세션 트랜스크립트에 어시스턴트 메모를 추가하고 UI 전용 업데이트를 위해 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, 채널 전달 없음).
    - 채팅 헤더 모델 및 사고 선택기는 `sessions.patch`를 통해 활성 세션을 즉시 패치합니다. 이는 한 턴 전송 옵션이 아니라 영구 세션 오버라이드입니다.
    - 채팅 모델 선택기는 Gateway에 구성된 모델 뷰를 요청합니다. `agents.defaults.models`가 있으면 해당 허용 목록이 선택기를 구동합니다. 그렇지 않으면 선택기에 명시적인 `models.providers.*.models` 항목과 사용 가능한 인증이 있는 제공자가 표시됩니다. 전체 카탈로그는 디버그 `models.list` RPC에서 `view: "all"`로 계속 사용할 수 있습니다.
    - 최신 Gateway 세션 사용량 보고서가 높은 컨텍스트 압박을 표시하면 채팅 작성 영역에 컨텍스트 알림이 표시되고, 권장 Compaction 수준에서는 일반 세션 Compaction 경로를 실행하는 압축 버튼이 표시됩니다. 오래된 토큰 스냅샷은 Gateway가 다시 최신 사용량을 보고할 때까지 숨겨집니다.

  </Accordion>
  <Accordion title="대화 모드(브라우저 실시간)">
    대화 모드는 등록된 실시간 음성 제공자를 사용합니다. `talk.provider: "openai"`와 `talk.providers.openai.apiKey`로 OpenAI를 구성하거나, `talk.provider: "google"`과 `talk.providers.google.apiKey`로 Google을 구성하세요. Voice Call 실시간 제공자 구성은 여전히 대체 구성으로 재사용할 수 있습니다. 브라우저는 표준 제공자 API 키를 절대 받지 않습니다. OpenAI는 WebRTC용 임시 Realtime 클라이언트 비밀을 받습니다. Google Live는 브라우저 WebSocket 세션을 위한 일회용 제한 Live API 인증 토큰을 받으며, 지침과 도구 선언은 Gateway에 의해 토큰 안에 잠깁니다. 백엔드 실시간 브리지만 노출하는 제공자는 Gateway 릴레이 전송을 통해 실행되므로, 자격 증명과 공급업체 소켓은 서버 측에 머무르고 브라우저 오디오는 인증된 Gateway RPC를 통해 이동합니다. Realtime 세션 프롬프트는 Gateway가 조립합니다. `talk.realtime.session`은 호출자가 제공하는 지침 오버라이드를 허용하지 않습니다.

    채팅 작성기에서 대화 컨트롤은 마이크 받아쓰기 버튼 옆의 파형 버튼입니다. 대화가 시작되면 작성기 상태 행에 `Connecting Talk...`가 표시된 뒤 오디오가 연결되면 `Talk live`가 표시되고, 실시간 도구 호출이 `chat.send`를 통해 구성된 더 큰 모델에 문의하는 동안에는 `Asking OpenClaw...`가 표시됩니다.

    유지관리자 라이브 스모크: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`는 OpenAI 브라우저 WebRTC SDP 교환, Google Live 제한 토큰 브라우저 WebSocket 설정, 가짜 마이크 미디어를 사용하는 Gateway 릴레이 브라우저 어댑터를 검증합니다. 이 명령은 제공자 상태만 출력하며 비밀은 로그로 남기지 않습니다.

  </Accordion>
  <Accordion title="중지 및 중단">
    - **중지**를 클릭합니다(`chat.abort` 호출).
    - 실행이 활성 상태인 동안 일반 후속 메시지는 대기열에 들어갑니다. 대기 중인 메시지에서 **조향**을 클릭하면 해당 후속 메시지를 실행 중인 턴에 주입합니다.
    - `/stop`을 입력하거나 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 독립형 중단 문구를 입력하여 대역 외로 중단합니다.
    - `chat.abort`는 해당 세션의 모든 활성 실행을 중단하기 위해 `{ sessionKey }`(`runId` 없음)를 지원합니다.

  </Accordion>
  <Accordion title="중단 부분 보존">
    - 실행이 중단되면 부분 어시스턴트 텍스트가 UI에 계속 표시될 수 있습니다.
    - 버퍼링된 출력이 있으면 Gateway는 중단된 부분 어시스턴트 텍스트를 트랜스크립트 기록에 영구 저장합니다.
    - 영구 저장된 항목에는 중단 메타데이터가 포함되어 트랜스크립트 소비자가 중단 부분과 정상 완료 출력을 구분할 수 있습니다.

  </Accordion>
</AccordionGroup>

## PWA 설치 및 웹 푸시

Control UI는 `manifest.webmanifest`와 서비스 워커를 제공하므로, 최신 브라우저에서 독립 실행형 PWA로 설치할 수 있습니다. Web Push를 사용하면 탭이나 브라우저 창이 열려 있지 않아도 Gateway가 알림으로 설치된 PWA를 깨울 수 있습니다.

| 표면                                                  | 수행하는 작업                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 매니페스트입니다. 접근 가능해지면 브라우저가 "앱 설치"를 제공합니다. |
| `ui/public/sw.js`                                     | `push` 이벤트와 알림 클릭을 처리하는 서비스 워커입니다. |
| `push/vapid-keys.json`(OpenClaw 상태 디렉터리 아래) | Web Push 페이로드 서명에 사용되는 자동 생성 VAPID 키 쌍입니다. |
| `push/web-push-subscriptions.json`                    | 영구 저장된 브라우저 구독 엔드포인트입니다. |

키를 고정하려는 경우(다중 호스트 배포, 비밀 순환 또는 테스트) Gateway 프로세스의 환경 변수를 통해 VAPID 키 쌍을 오버라이드하세요.

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`(기본값은 `mailto:openclaw@localhost`)

Control UI는 브라우저 구독을 등록하고 테스트하기 위해 다음 범위 제한 Gateway 메서드를 사용합니다.

- `push.web.vapidPublicKey` — 활성 VAPID 공개 키를 가져옵니다.
- `push.web.subscribe` — `endpoint`와 `keys.p256dh`/`keys.auth`를 등록합니다.
- `push.web.unsubscribe` — 등록된 엔드포인트를 제거합니다.
- `push.web.test` — 호출자의 구독으로 테스트 알림을 보냅니다.

<Note>
Web Push는 iOS APNS 릴레이 경로(릴레이 기반 푸시는 [구성](/ko/gateway/configuration) 참조) 및 네이티브 모바일 페어링을 대상으로 하는 기존 `push.test` 메서드와 독립적입니다.
</Note>

## 호스팅된 임베드

어시스턴트 메시지는 `[embed ...]` 숏코드를 사용하여 호스팅된 웹 콘텐츠를 인라인으로 렌더링할 수 있습니다. iframe 샌드박스 정책은 `gateway.controlUi.embedSandbox`로 제어됩니다.

<Tabs>
  <Tab title="strict">
    호스팅된 임베드 내부의 스크립트 실행을 비활성화합니다.
  </Tab>
  <Tab title="scripts (default)">
    출처 격리를 유지하면서 대화형 임베드를 허용합니다. 이것이 기본값이며 일반적으로 독립형 브라우저 게임/위젯에 충분합니다.
  </Tab>
  <Tab title="trusted">
    의도적으로 더 강한 권한이 필요한 동일 사이트 문서에 대해 `allow-scripts` 위에 `allow-same-origin`을 추가합니다.
  </Tab>
</Tabs>

예:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
임베드된 문서에 동일 출처 동작이 실제로 필요한 경우에만 `trusted`를 사용하세요. 대부분의 에이전트 생성 게임과 대화형 캔버스에는 `scripts`가 더 안전한 선택입니다.
</Warning>

절대 외부 `http(s)` 임베드 URL은 기본적으로 계속 차단됩니다. 의도적으로 `[embed url="https://..."]`가 서드파티 페이지를 로드하게 하려면 `gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## Tailnet 접근(권장)

<Tabs>
  <Tab title="통합 Tailscale Serve(선호)">
    Gateway를 loopback에 유지하고 Tailscale Serve가 HTTPS로 프록시하게 합니다.

    ```bash
    openclaw gateway --tailscale serve
    ```

    열기:

    - `https://<magicdns>/`(또는 구성한 `gateway.controlUi.basePath`)

    기본적으로 `gateway.auth.allowTailscale`이 `true`이면 Control UI/WebSocket Serve 요청은 Tailscale ID 헤더(`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는 `tailscale whois`로 `x-forwarded-for` 주소를 확인하고 이를 헤더와 일치시켜 ID를 검증하며, 요청이 loopback에 도달하고 Tailscale의 `x-forwarded-*` 헤더가 있을 때만 이를 허용합니다. 브라우저 장치 ID가 있는 Control UI 운영자 세션의 경우, 이 검증된 Serve 경로는 장치 페어링 왕복도 건너뜁니다. 장치가 없는 브라우저와 노드 역할 연결은 계속 일반 장치 검사를 따릅니다. Serve 트래픽에도 명시적인 공유 비밀 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

    해당 비동기 Serve ID 경로에서는 동일한 클라이언트 IP와 인증 범위에 대한 실패한 인증 시도가 rate-limit 쓰기 전에 직렬화됩니다. 따라서 동일한 브라우저에서 동시 실패 재시도가 발생하면 두 개의 일반 불일치가 병렬로 경합하는 대신 두 번째 요청에 `retry later`가 표시될 수 있습니다.

    <Warning>
    토큰 없는 Serve 인증은 gateway 호스트가 신뢰된다고 가정합니다. 신뢰할 수 없는 로컬 코드가 해당 호스트에서 실행될 수 있다면 토큰/비밀번호 인증을 요구하세요.
    </Warning>

  </Tab>
  <Tab title="tailnet에 바인딩 + 토큰">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    그런 다음 열기:

    - `http://<tailscale-ip>:18789/`(또는 구성한 `gateway.controlUi.basePath`)

    일치하는 공유 비밀을 UI 설정에 붙여넣습니다(`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

  </Tab>
</Tabs>

## 안전하지 않은 HTTP

일반 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 대시보드를 열면 브라우저가 **비보안 컨텍스트**에서 실행되고 WebCrypto를 차단합니다. 기본적으로 OpenClaw는 장치 ID가 없는 Control UI 연결을 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 통한 localhost 전용 안전하지 않은 HTTP 호환성
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 운영자 Control UI 인증
- 비상용 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 해결 방법:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 여세요.

- `https://<magicdns>/`(Serve)
- `http://127.0.0.1:18789/`(gateway 호스트에서)

<AccordionGroup>
  <Accordion title="안전하지 않은 인증 토글 동작">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth`는 로컬 호환성 토글일 뿐입니다.

    - 비보안 HTTP 컨텍스트에서 localhost Control UI 세션이 장치 ID 없이 진행되도록 허용합니다.
    - 페어링 검사를 우회하지 않습니다.
    - 원격(non-localhost) 장치 ID 요구 사항을 완화하지 않습니다.

  </Accordion>
  <Accordion title="비상용으로만 사용">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth`는 Control UI 기기 신원 확인을 비활성화하며 심각한 보안 수준 저하입니다. 긴급 사용 후에는 신속히 되돌리세요.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 성공한 신뢰할 수 있는 프록시 인증은 기기 신원 없이 **운영자** Control UI 세션을 허용할 수 있습니다.
    - 이는 node-role Control UI 세션으로 확장되지 **않습니다**.
    - 동일 호스트 loopback 역방향 프록시는 여전히 신뢰할 수 있는 프록시 인증을 충족하지 않습니다. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하세요.

  </Accordion>
</AccordionGroup>

HTTPS 설정 지침은 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## 콘텐츠 보안 정책

Control UI는 엄격한 `img-src` 정책과 함께 제공됩니다. **동일 출처** 자산, `data:` URL, 로컬에서 생성된 `blob:` URL만 허용됩니다. 원격 `http(s)` 및 프로토콜 상대 이미지 URL은 브라우저에서 거부되며 네트워크 가져오기를 발생시키지 않습니다.

실제로는 다음을 의미합니다.

- 상대 경로 아래에서 제공되는 아바타와 이미지(예: `/avatars/<id>`)는 계속 렌더링됩니다. UI가 가져와 로컬 `blob:` URL로 변환하는 인증된 아바타 라우트도 포함됩니다.
- 인라인 `data:image/...` URL은 계속 렌더링됩니다(프로토콜 내 페이로드에 유용).
- Control UI가 만든 로컬 `blob:` URL은 계속 렌더링됩니다.
- 채널 메타데이터가 내보내는 원격 아바타 URL은 Control UI의 아바타 헬퍼에서 제거되고 내장 로고/배지로 대체됩니다. 따라서 손상되었거나 악의적인 채널이 운영자 브라우저에서 임의의 원격 이미지 가져오기를 강제할 수 없습니다.

이 동작을 얻기 위해 변경해야 할 것은 없습니다. 항상 켜져 있으며 구성할 수 없습니다.

## 아바타 라우트 인증

Gateway 인증이 구성된 경우 Control UI 아바타 엔드포인트는 나머지 API와 동일한 Gateway 토큰을 요구합니다.

- `GET /avatar/<agentId>`는 인증된 호출자에게만 아바타 이미지를 반환합니다. `GET /avatar/<agentId>?meta=1`은 동일한 규칙에 따라 아바타 메타데이터를 반환합니다.
- 두 라우트에 대한 인증되지 않은 요청은 거부됩니다(형제 assistant-media 라우트와 일치). 이렇게 하면 다른 방식으로 보호되는 호스트에서 아바타 라우트가 에이전트 신원을 유출하는 것을 방지합니다.
- Control UI 자체는 아바타를 가져올 때 Gateway 토큰을 bearer 헤더로 전달하고, 인증된 blob URL을 사용하므로 이미지가 대시보드에서 계속 렌더링됩니다.

Gateway 인증을 비활성화하면(공유 호스트에서는 권장하지 않음) Gateway의 나머지 부분과 마찬가지로 아바타 라우트도 인증되지 않은 상태가 됩니다.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음으로 빌드하세요.

```bash
pnpm ui:build
```

선택적 절대 기준 경로(고정 자산 URL을 원하는 경우):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 dev 서버):

```bash
pnpm ui:dev
```

그런 다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키도록 하세요.

## 디버깅/테스트: dev 서버 + 원격 Gateway

Control UI는 정적 파일입니다. WebSocket 대상은 구성 가능하며 HTTP 출처와 다를 수 있습니다. 로컬에서 Vite dev 서버를 사용하면서 Gateway는 다른 곳에서 실행하려는 경우 유용합니다.

<Steps>
  <Step title="Start the UI dev server">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Open with gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws%3A%2F%2F<gateway-host>%3A18789
    ```

    선택적 일회성 인증(필요한 경우):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서 제거됩니다.
    - `gatewayUrl`을 통해 전체 `ws://` 또는 `wss://` 엔드포인트를 전달하는 경우, 브라우저가 쿼리 문자열을 올바르게 파싱하도록 `gatewayUrl` 값을 URL 인코딩하세요.
    - 가능하면 `token`은 URL 프래그먼트(`#token=...`)를 통해 전달해야 합니다. 프래그먼트는 서버로 전송되지 않으므로 요청 로그와 Referer 유출을 방지합니다. 레거시 `?token=` 쿼리 매개변수는 호환성을 위해 여전히 한 번 가져오지만, 대체 수단으로만 사용되며 부트스트랩 직후 제거됩니다.
    - `password`는 메모리에만 보관됩니다.
    - `gatewayUrl`이 설정되면 UI는 구성 또는 환경 자격 증명으로 대체하지 않습니다. `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류입니다.
    - Gateway가 TLS 뒤에 있는 경우(Tailscale Serve, HTTPS 프록시 등) `wss://`를 사용하세요.
    - `gatewayUrl`은 클릭재킹을 방지하기 위해 최상위 창(임베드되지 않음)에서만 허용됩니다.
    - local loopback이 아닌 Control UI 배포는 `gateway.controlUi.allowedOrigins`를 명시적으로 설정해야 합니다(전체 출처). 여기에는 원격 dev 설정도 포함됩니다.
    - Gateway 시작 시 유효한 런타임 바인드와 포트에서 `http://localhost:<port>` 및 `http://127.0.0.1:<port>` 같은 로컬 출처를 시드할 수 있지만, 원격 브라우저 출처에는 여전히 명시적 항목이 필요합니다.
    - 엄격하게 제어되는 로컬 테스트를 제외하고 `gateway.controlUi.allowedOrigins: ["*"]`를 사용하지 마세요. 이는 "내가 사용하는 호스트와 일치"가 아니라 모든 브라우저 출처를 허용한다는 뜻입니다.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host 헤더 출처 대체 모드를 활성화하지만, 이는 위험한 보안 모드입니다.

  </Accordion>
</AccordionGroup>

예:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

원격 액세스 설정 세부 정보: [원격 액세스](/ko/gateway/remote).

## 관련 항목

- [대시보드](/ko/web/dashboard) — Gateway 대시보드
- [상태 확인](/ko/gateway/health) — Gateway 상태 모니터링
- [TUI](/ko/web/tui) — 터미널 사용자 인터페이스
- [WebChat](/ko/web/webchat) — 브라우저 기반 채팅 인터페이스
