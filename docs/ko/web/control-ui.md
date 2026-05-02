---
read_when:
    - 브라우저에서 Gateway를 운영하려고 합니다
    - SSH 터널 없이 Tailnet 액세스를 원합니다
sidebarTitle: Control UI
summary: Gateway용 브라우저 기반 제어 사용자 인터페이스(채팅, 노드, 설정)
title: 제어 UI
x-i18n:
    generated_at: "2026-05-02T23:39:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 50bef807915f27406e19f1c6ca7d839a610d79ba79da85d7a78523400cbf9208
    source_path: web/control-ui.md
    workflow: 16
---

Control UI는 Gateway에서 제공하는 작은 **Vite + Lit** 단일 페이지 앱입니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

동일한 포트에서 **Gateway WebSocket에 직접** 통신합니다.

## 빠른 열기(로컬)

Gateway가 같은 컴퓨터에서 실행 중이면 다음을 여세요.

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지를 로드하지 못하면 먼저 Gateway를 시작하세요: `openclaw gateway`.

인증은 WebSocket 핸드셰이크 중에 다음을 통해 제공됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 신뢰할 수 있는 프록시 ID 헤더

대시보드 설정 패널은 현재 브라우저 탭 세션 및 선택한 게이트웨이 URL에 대한 토큰을 보관하며, 비밀번호는 유지하지 않습니다. 온보딩은 보통 첫 연결 시 공유 비밀 인증을 위한 게이트웨이 토큰을 생성하지만, `gateway.auth.mode`가 `"password"`일 때는 비밀번호 인증도 작동합니다.

## 기기 페어링(첫 연결)

새 브라우저나 기기에서 Control UI에 연결하면 Gateway는 보통 **일회성 페어링 승인**을 요구합니다. 이는 무단 접근을 방지하기 위한 보안 조치입니다.

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

브라우저가 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 다시 시도하면 이전 대기 요청은 대체되고 새 `requestId`가 생성됩니다. 승인하기 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 페어링되어 있고 읽기 접근 권한에서 쓰기/관리자 접근 권한으로 변경하는 경우, 이는 조용한 재연결이 아니라 승인 업그레이드로 처리됩니다. OpenClaw는 기존 승인을 활성 상태로 유지하고, 더 넓은 범위의 재연결을 차단하며, 새 범위 집합을 명시적으로 승인하도록 요청합니다.

승인되면 기기가 기억되며 `openclaw devices revoke --device <id> --role <role>`로 취소하지 않는 한 재승인이 필요하지 않습니다. 토큰 순환 및 취소는 [기기 CLI](/ko/cli/devices)를 참조하세요.

<Note>
- 직접 local loopback 브라우저 연결(`127.0.0.1` / `localhost`)은 자동 승인됩니다.
- `gateway.auth.allowTailscale: true`이고, Tailscale ID가 확인되며, 브라우저가 기기 ID를 제공하는 경우 Tailscale Serve는 Control UI 운영자 세션의 페어링 왕복을 건너뛸 수 있습니다.
- 직접 Tailnet 바인딩, LAN 브라우저 연결, 기기 ID가 없는 브라우저 프로필은 여전히 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 기기 ID를 생성하므로, 브라우저를 전환하거나 브라우저 데이터를 지우면 다시 페어링해야 합니다.

</Note>

## 개인 ID(브라우저 로컬)

Control UI는 공유 세션에서 출처 표시를 위해 발신 메시지에 연결되는 브라우저별 개인 ID(표시 이름 및 아바타)를 지원합니다. 이는 브라우저 저장소에 저장되고 현재 브라우저 프로필로 범위가 지정되며, 실제로 보내는 메시지의 일반적인 대화록 작성자 메타데이터 외에는 다른 기기와 동기화되거나 서버 측에 유지되지 않습니다. 사이트 데이터를 지우거나 브라우저를 전환하면 비어 있는 상태로 재설정됩니다.

동일한 브라우저 로컬 패턴이 어시스턴트 아바타 재정의에도 적용됩니다. 업로드된 어시스턴트 아바타는 로컬 브라우저에서만 게이트웨이가 해석한 ID 위에 오버레이되며 `config.patch`를 통해 왕복하지 않습니다. 공유 `ui.assistant.avatar` 구성 필드는 필드를 직접 쓰는 비 UI 클라이언트(예: 스크립트 기반 게이트웨이 또는 사용자 지정 대시보드)에서 계속 사용할 수 있습니다.

## 런타임 구성 엔드포인트

Control UI는 `/__openclaw/control-ui-config.json`에서 런타임 설정을 가져옵니다. 해당 엔드포인트는 나머지 HTTP 표면과 동일한 게이트웨이 인증으로 보호됩니다. 인증되지 않은 브라우저는 이를 가져올 수 없으며, 성공적인 가져오기를 위해서는 이미 유효한 게이트웨이 토큰/비밀번호, Tailscale Serve ID 또는 신뢰할 수 있는 프록시 ID 중 하나가 필요합니다.

## 언어 지원

Control UI는 첫 로드 시 브라우저 로캘을 기준으로 자체 지역화를 수행할 수 있습니다. 나중에 재정의하려면 **개요 -> Gateway 접근 -> 언어**를 여세요. 로캘 선택기는 모양 아래가 아니라 Gateway 접근 카드에 있습니다.

- 지원되는 로캘: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 영어가 아닌 번역은 브라우저에서 지연 로드됩니다.
- 선택한 로캘은 브라우저 저장소에 저장되고 이후 방문 시 재사용됩니다.
- 누락된 번역 키는 영어로 대체됩니다.

문서 번역도 동일한 비영어 로캘 집합에 대해 생성되지만, 문서 사이트에 내장된 Mintlify 언어 선택기는 Mintlify가 허용하는 로캘 코드로 제한됩니다. 태국어(`th`) 및 페르시아어(`fa`) 문서는 게시 저장소에 계속 생성되지만, Mintlify가 해당 코드를 지원할 때까지 해당 선택기에 표시되지 않을 수 있습니다.

## 모양 테마

모양 패널은 내장된 Claw, Knot, Dash 테마와 브라우저 로컬 tweakcn 가져오기 슬롯 하나를 유지합니다. 테마를 가져오려면 [tweakcn themes](https://tweakcn.com/themes)를 열고, 테마를 선택하거나 만든 다음 **공유**를 클릭하고, 복사한 테마 링크를 모양에 붙여넣으세요. 가져오기 도구는 `https://tweakcn.com/r/themes/<id>` 레지스트리 URL, `https://tweakcn.com/editor/theme?theme=amethyst-haze` 같은 편집기 URL, 상대 `/themes/<id>` 경로, 원시 테마 ID, `amethyst-haze` 같은 기본 테마 이름도 허용합니다.

가져온 테마는 현재 브라우저 프로필에만 저장됩니다. 게이트웨이 구성에 기록되지 않으며 기기 간에 동기화되지 않습니다. 가져온 테마를 교체하면 하나의 로컬 슬롯이 업데이트됩니다. 이를 지우면 가져온 테마가 선택되어 있었던 경우 활성 테마가 Claw로 다시 전환됩니다.

## 수행할 수 있는 작업(현재)

<AccordionGroup>
  <Accordion title="채팅과 Talk">
    - Gateway WS(`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)를 통해 모델과 채팅합니다.
    - 서버 측 STT(`chat.transcribeAudio`)로 채팅 작성기에 받아쓰기합니다. 브라우저는 짧은 마이크 클립을 녹음하여 Gateway로 보내고, Gateway는 구성된 `tools.media.audio` 전사 파이프라인을 실행한 뒤 공급자 자격 증명을 브라우저에 노출하지 않고 초안 텍스트를 반환합니다.
    - 브라우저 실시간 세션을 통해 대화합니다. OpenAI는 직접 WebRTC를 사용하고, Google Live는 WebSocket을 통한 제한된 일회용 브라우저 토큰을 사용하며, 백엔드 전용 실시간 음성 Plugin은 Gateway 릴레이 전송을 사용합니다. 릴레이는 공급자 자격 증명을 Gateway에 유지하고, 브라우저는 `talk.realtime.relay*` RPC를 통해 마이크 PCM을 스트리밍하며, 더 큰 구성된 OpenClaw 모델을 위해 `openclaw_agent_consult` 도구 호출을 `chat.send`를 통해 다시 보냅니다.
    - 채팅에서 도구 호출 + 라이브 도구 출력 카드를 스트리밍합니다(에이전트 이벤트).

  </Accordion>
  <Accordion title="채널, 인스턴스, 세션, 꿈">
    - 채널: 내장 및 번들/외부 Plugin 채널 상태, QR 로그인, 채널별 구성(`channels.status`, `web.login.*`, `config.patch`).
    - 인스턴스: 현재 상태 목록 + 새로 고침(`system-presence`).
    - 세션: 목록 + 세션별 모델/생각/빠름/상세/추적/추론 재정의(`sessions.list`, `sessions.patch`).
    - 꿈: Dreaming 상태, 활성화/비활성화 토글, Dream Diary 리더(`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node, 실행 승인">
    - Cron 작업: 목록/추가/편집/실행/활성화/비활성화 + 실행 기록(`cron.*`).
    - Skills: 상태, 활성화/비활성화, 설치, API 키 업데이트(`skills.*`).
    - Node: 목록 + 기능(`node.list`).
    - 실행 승인: `exec host=gateway/node`에 대한 게이트웨이 또는 Node 허용 목록 + 요청 정책 편집(`exec.approvals.*`).

  </Accordion>
  <Accordion title="구성">
    - `~/.openclaw/openclaw.json` 보기/편집(`config.get`, `config.set`).
    - 유효성 검사를 거쳐 적용 + 재시작(`config.apply`)하고 마지막 활성 세션을 깨웁니다.
    - 쓰기에는 동시 편집 덮어쓰기를 방지하기 위한 기본 해시 가드가 포함됩니다.
    - 쓰기(`config.set`/`config.apply`/`config.patch`)는 제출된 구성 페이로드의 참조에 대해 활성 SecretRef 해석을 사전 점검합니다. 해석되지 않은 활성 제출 참조는 쓰기 전에 거부됩니다.
    - 스키마 + 폼 렌더링(`config.schema` / `config.schema.lookup`, 필드 `title` / `description`, 일치하는 UI 힌트, 즉시 하위 요약, 중첩 객체/와일드카드/배열/컴포지션 노드의 문서 메타데이터, 사용 가능한 경우 Plugin + 채널 스키마 포함); 원시 JSON 편집기는 스냅샷에 안전한 원시 왕복이 있을 때만 사용할 수 있습니다.
    - 스냅샷이 원시 텍스트를 안전하게 왕복할 수 없으면 Control UI는 폼 모드를 강제하고 해당 스냅샷의 원시 모드를 비활성화합니다.
    - 원시 JSON 편집기 "저장된 상태로 재설정"은 평탄화된 스냅샷을 다시 렌더링하는 대신 원시 작성 형태(서식, 주석, `$include` 레이아웃)를 보존하므로, 스냅샷이 안전하게 왕복할 수 있을 때 외부 편집이 재설정 후에도 유지됩니다.
    - 구조화된 SecretRef 객체 값은 실수로 객체가 문자열로 손상되는 것을 방지하기 위해 폼 텍스트 입력에서 읽기 전용으로 렌더링됩니다.

  </Accordion>
  <Accordion title="디버그, 로그, 업데이트">
    - 디버그: 상태/상태 점검/모델 스냅샷 + 이벤트 로그 + 수동 RPC 호출(`status`, `health`, `models.list`).
    - 로그: 필터/내보내기가 있는 게이트웨이 파일 로그의 라이브 tail(`logs.tail`).
    - 업데이트: 재시작 보고서와 함께 패키지/git 업데이트 + 재시작(`update.run`)을 실행한 다음, 재연결 후 `update.status`를 폴링하여 실행 중인 게이트웨이 버전을 확인합니다.

  </Accordion>
  <Accordion title="Cron 작업 패널 참고 사항">
    - 격리된 작업의 경우 전달 기본값은 요약 알림입니다. 내부 전용 실행을 원하면 없음으로 전환할 수 있습니다.
    - 알림이 선택되면 채널/대상 필드가 표시됩니다.
    - Webhook 모드는 `delivery.mode = "webhook"`를 사용하며 `delivery.to`가 유효한 HTTP(S) Webhook URL로 설정됩니다.
    - 메인 세션 작업의 경우 Webhook 및 없음 전달 모드를 사용할 수 있습니다.
    - 고급 편집 컨트롤에는 실행 후 삭제, 에이전트 재정의 지우기, Cron 정확/분산 옵션, 에이전트 모델/생각 재정의, 최선 노력 전달 토글이 포함됩니다.
    - 폼 유효성 검사는 필드 수준 오류와 함께 인라인으로 제공되며, 잘못된 값은 수정될 때까지 저장 버튼을 비활성화합니다.
    - 전용 bearer 토큰을 보내려면 `cron.webhookToken`을 설정하세요. 생략하면 Webhook은 인증 헤더 없이 전송됩니다.
    - 사용 중단된 대체 경로: `notify: true`가 있는 저장된 레거시 작업은 마이그레이션될 때까지 여전히 `cron.webhook`을 사용할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 채팅 동작

<AccordionGroup>
  <Accordion title="전송 및 기록 의미 체계">
    - `chat.send`는 **논블로킹**입니다. 즉시 `{ runId, status: "started" }`로 확인 응답하고, 응답은 `chat` 이벤트를 통해 스트리밍됩니다.
    - `chat.transcribeAudio`는 Chat 초안용 일회성 받아쓰기 도우미입니다. 브라우저에서 녹음된 base64 오디오를 받고, 업로드를 Gateway WebSocket 프레임 제한 아래로 유지하며, 임시 로컬 파일을 쓰고, 활성 Gateway 구성으로 미디어 이해 오디오 전사를 실행하며, `{ text, provider, model }`을 반환한 뒤 임시 파일을 제거합니다. 에이전트 실행을 만들지 않으며 실시간 Talk와는 별개입니다.
    - Chat 업로드는 이미지와 비동영상 파일을 받습니다. 이미지는 네이티브 이미지 경로를 유지하고, 다른 파일은 관리형 미디어로 저장되어 기록에 첨부 파일 링크로 표시됩니다.
    - 같은 `idempotencyKey`로 다시 전송하면 실행 중에는 `{ status: "in_flight" }`를 반환하고, 완료 후에는 `{ status: "ok" }`를 반환합니다.
    - `chat.history` 응답은 UI 안전을 위해 크기가 제한됩니다. 대화 기록 항목이 너무 크면 Gateway가 긴 텍스트 필드를 잘라내고, 무거운 메타데이터 블록을 생략하며, 크기가 너무 큰 메시지를 자리 표시자(`[chat.history omitted: message too large]`)로 대체할 수 있습니다.
    - Assistant/생성 이미지는 관리형 미디어 참조로 영구 저장되고 인증된 Gateway 미디어 URL을 통해 다시 제공되므로, 다시 로드할 때 원시 base64 이미지 페이로드가 Chat 기록 응답에 계속 남아 있는 것에 의존하지 않습니다.
    - `chat.history`는 보이는 Assistant 텍스트에서 표시 전용 인라인 지시 태그(예: `[[reply_to_*]]`, `[[audio_as_voice]]`), 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및 잘린 도구 호출 블록 포함), 유출된 ASCII/전각 모델 제어 토큰도 제거하며, 전체 표시 텍스트가 정확한 무음 토큰 `NO_REPLY` / `no_reply`뿐인 Assistant 항목은 생략합니다.
    - 활성 전송 중 및 최종 기록 새로 고침 동안 `chat.history`가 잠시 이전 스냅샷을 반환하더라도 Chat 뷰는 로컬의 낙관적 사용자/Assistant 메시지를 계속 표시합니다. Gateway 기록이 따라잡으면 정식 대화 기록이 해당 로컬 메시지를 대체합니다.
    - `chat.inject`는 세션 대화 기록에 Assistant 메모를 추가하고 UI 전용 업데이트를 위해 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, 채널 전달 없음).
    - Chat 헤더의 모델 및 thinking 선택기는 `sessions.patch`를 통해 활성 세션을 즉시 패치합니다. 이는 영구 세션 오버라이드이며 한 턴 전용 전송 옵션이 아닙니다.
    - Control UI에서 `/new`를 입력하면 New Chat과 동일한 새 대시보드 세션을 만들고 전환합니다. `/reset`을 입력하면 현재 세션에 대한 Gateway의 명시적 제자리 초기화를 유지합니다.
    - Chat 모델 선택기는 Gateway의 구성된 모델 뷰를 요청합니다. `agents.defaults.models`가 있으면 해당 허용 목록이 선택기를 구동합니다. 그렇지 않으면 선택기에 명시적 `models.providers.*.models` 항목과 사용 가능한 인증이 있는 제공자가 표시됩니다. 전체 카탈로그는 디버그 `models.list` RPC에서 `view: "all"`로 계속 사용할 수 있습니다.
    - 새 Gateway 세션 사용량 보고서가 높은 컨텍스트 압박을 나타내면 Chat 작성 영역에 컨텍스트 알림이 표시되고, 권장 Compaction 수준에서는 일반 세션 Compaction 경로를 실행하는 압축 버튼이 표시됩니다. Gateway가 새 사용량을 다시 보고할 때까지 오래된 토큰 스냅샷은 숨겨집니다.

  </Accordion>
  <Accordion title="Talk 모드(브라우저 실시간)">
    Talk 모드는 등록된 실시간 음성 제공자를 사용합니다. OpenAI는 `talk.provider: "openai"`와 `talk.providers.openai.apiKey`로 구성하거나, Google은 `talk.provider: "google"`와 `talk.providers.google.apiKey`로 구성하세요. Voice Call 실시간 제공자 구성은 여전히 대체 수단으로 재사용할 수 있습니다. 브라우저는 표준 제공자 API 키를 절대 받지 않습니다. OpenAI는 WebRTC용 임시 Realtime 클라이언트 비밀 값을 받습니다. Google Live는 브라우저 WebSocket 세션용 일회용 제한 Live API 인증 토큰을 받으며, 지침과 도구 선언은 Gateway에 의해 토큰 안에 고정됩니다. 백엔드 실시간 브리지만 노출하는 제공자는 Gateway 릴레이 전송을 통해 실행되므로, 자격 증명과 공급업체 소켓은 서버 측에 남고 브라우저 오디오는 인증된 Gateway RPC를 통해 이동합니다. Realtime 세션 프롬프트는 Gateway가 조립하며, `talk.realtime.session`은 호출자가 제공하는 지침 오버라이드를 받지 않습니다.

    Chat 작성기에서 Talk 컨트롤은 마이크 받아쓰기 버튼 옆의 파형 버튼입니다. Talk가 시작되면 작성기 상태 행에 `Connecting Talk...`가 표시된 다음, 오디오가 연결된 동안 `Talk live`가 표시되거나, 실시간 도구 호출이 `chat.send`를 통해 구성된 더 큰 모델에 문의하는 동안 `Asking OpenClaw...`가 표시됩니다.

    유지관리자 라이브 스모크: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`는 OpenAI 브라우저 WebRTC SDP 교환, Google Live 제한 토큰 브라우저 WebSocket 설정, 가짜 마이크 미디어를 사용하는 Gateway 릴레이 브라우저 어댑터를 검증합니다. 이 명령은 제공자 상태만 출력하고 비밀 값은 기록하지 않습니다.

  </Accordion>
  <Accordion title="중지 및 중단">
    - **Stop**을 클릭합니다(`chat.abort` 호출).
    - 실행이 활성 상태인 동안 일반 후속 메시지는 대기열에 들어갑니다. 대기 중인 메시지에서 **Steer**를 클릭하면 해당 후속 메시지가 실행 중인 턴에 주입됩니다.
    - `/stop`을 입력하거나 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 독립형 중단 문구를 입력하여 대역 외로 중단합니다.
    - `chat.abort`는 해당 세션의 모든 활성 실행을 중단하기 위해 `{ sessionKey }`(`runId` 없음)를 지원합니다.

  </Accordion>
  <Accordion title="중단 부분 보존">
    - 실행이 중단되면 부분 Assistant 텍스트가 UI에 계속 표시될 수 있습니다.
    - Gateway는 버퍼링된 출력이 있을 때 중단된 부분 Assistant 텍스트를 대화 기록에 영구 저장합니다.
    - 영구 저장된 항목에는 중단 메타데이터가 포함되어, 대화 기록 소비자가 중단 부분과 정상 완료 출력을 구분할 수 있습니다.

  </Accordion>
</AccordionGroup>

## PWA 설치 및 웹 푸시

Control UI는 `manifest.webmanifest`와 서비스 워커를 함께 제공하므로, 최신 브라우저에서 독립 실행형 PWA로 설치할 수 있습니다. Web Push를 사용하면 탭이나 브라우저 창이 열려 있지 않아도 Gateway가 알림으로 설치된 PWA를 깨울 수 있습니다.

| 표면                                                  | 수행하는 작업                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 매니페스트입니다. 도달 가능해지면 브라우저가 "Install app"을 제공합니다. |
| `ui/public/sw.js`                                     | `push` 이벤트와 알림 클릭을 처리하는 서비스 워커입니다. |
| `push/vapid-keys.json`(OpenClaw 상태 디렉터리 아래) | Web Push 페이로드 서명에 사용하는 자동 생성 VAPID 키 쌍입니다.       |
| `push/web-push-subscriptions.json`                    | 영구 저장된 브라우저 구독 엔드포인트입니다.                          |

키를 고정하려는 경우(다중 호스트 배포, 비밀 값 교체 또는 테스트) Gateway 프로세스에서 환경 변수로 VAPID 키 쌍을 오버라이드하세요.

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

Assistant 메시지는 `[embed ...]` 숏코드로 호스팅된 웹 콘텐츠를 인라인 렌더링할 수 있습니다. iframe 샌드박스 정책은 `gateway.controlUi.embedSandbox`로 제어됩니다.

<Tabs>
  <Tab title="strict">
    호스팅된 임베드 내부의 스크립트 실행을 비활성화합니다.
  </Tab>
  <Tab title="scripts (default)">
    원본 격리를 유지하면서 인터랙티브 임베드를 허용합니다. 이것이 기본값이며, 일반적으로 자체 포함 브라우저 게임/위젯에 충분합니다.
  </Tab>
  <Tab title="trusted">
    의도적으로 더 강한 권한이 필요한 동일 사이트 문서를 위해 `allow-scripts` 위에 `allow-same-origin`을 추가합니다.
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
임베드된 문서에 동일 원본 동작이 실제로 필요할 때만 `trusted`를 사용하세요. 대부분의 에이전트 생성 게임과 인터랙티브 캔버스에는 `scripts`가 더 안전한 선택입니다.
</Warning>

절대 외부 `http(s)` 임베드 URL은 기본적으로 계속 차단됩니다. 의도적으로 `[embed url="https://..."]`가 서드파티 페이지를 로드하도록 하려면 `gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## Chat 메시지 너비

그룹화된 Chat 메시지는 읽기 쉬운 기본 최대 너비를 사용합니다. 와이드 모니터 배포에서는 번들 CSS를 패치하지 않고 `gateway.controlUi.chatMessageMaxWidth`를 설정하여 오버라이드할 수 있습니다.

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

값은 브라우저에 도달하기 전에 검증됩니다. 지원되는 값에는 `960px` 또는 `82%` 같은 일반 길이와 백분율, 그리고 제한된 `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, `fit-content(...)` 너비 표현식이 포함됩니다.

## Tailnet 액세스(권장)

<Tabs>
  <Tab title="통합 Tailscale Serve(선호)">
    Gateway를 loopback에 유지하고 Tailscale Serve가 HTTPS로 프록시하도록 합니다.

    ```bash
    openclaw gateway --tailscale serve
    ```

    열기:

    - `https://<magicdns>/`(또는 구성한 `gateway.controlUi.basePath`)

    기본적으로 `gateway.auth.allowTailscale`이 `true`이면 Control UI/WebSocket Serve 요청은 Tailscale ID 헤더(`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는 `x-forwarded-for` 주소를 `tailscale whois`로 해석해 해당 헤더와 일치시키는 방식으로 ID를 검증하며, 요청이 Tailscale의 `x-forwarded-*` 헤더와 함께 loopback에 도달할 때만 이를 허용합니다. 브라우저 장치 ID가 있는 Control UI 운영자 세션의 경우, 이 검증된 Serve 경로는 장치 페어링 왕복도 건너뜁니다. 장치 없는 브라우저와 노드 역할 연결은 계속 일반 장치 검사를 따릅니다. Serve 트래픽에도 명시적 공유 비밀 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

    해당 비동기 Serve ID 경로에서는 같은 클라이언트 IP와 인증 범위에 대한 실패한 인증 시도가 속도 제한 쓰기 전에 직렬화됩니다. 따라서 같은 브라우저의 동시 잘못된 재시도는 두 개의 일반 불일치가 병렬로 경쟁하는 대신 두 번째 요청에서 `retry later`를 표시할 수 있습니다.

    <Warning>
    토큰 없는 Serve 인증은 게이트웨이 호스트를 신뢰할 수 있다고 가정합니다. 신뢰할 수 없는 로컬 코드가 해당 호스트에서 실행될 수 있다면 토큰/비밀번호 인증을 요구하세요.
    </Warning>

  </Tab>
  <Tab title="tailnet에 바인딩 + 토큰">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    그런 다음 열기:

    - `http://<tailscale-ip>:18789/`(또는 구성한 `gateway.controlUi.basePath`)

    일치하는 공유 비밀을 UI 설정에 붙여 넣으세요(`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

  </Tab>
</Tabs>

## 안전하지 않은 HTTP

일반 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 대시보드를 열면 브라우저가 **비보안 컨텍스트**에서 실행되어 WebCrypto를 차단합니다. 기본적으로 OpenClaw는 장치 ID가 없는 Control UI 연결을 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 사용하는 localhost 전용 비보안 HTTP 호환성
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 운영자 제어 UI 인증
- 비상용 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 수정:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 여세요.

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (Gateway 호스트에서)

<AccordionGroup>
  <Accordion title="비보안 인증 토글 동작">
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

    - 비보안 HTTP 컨텍스트에서 localhost 제어 UI 세션이 디바이스 ID 없이 계속 진행되도록 허용합니다.
    - 페어링 검사를 우회하지 않습니다.
    - 원격(non-localhost) 디바이스 ID 요구 사항을 완화하지 않습니다.

  </Accordion>
  <Accordion title="비상용 전용">
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
    `dangerouslyDisableDeviceAuth`는 제어 UI 디바이스 ID 검사를 비활성화하며, 심각한 보안 수준 저하입니다. 긴급 사용 후에는 빠르게 되돌리세요.
    </Warning>

  </Accordion>
  <Accordion title="신뢰할 수 있는 프록시 참고 사항">
    - 성공적인 trusted-proxy 인증은 디바이스 ID 없이 **운영자** 제어 UI 세션을 허용할 수 있습니다.
    - 이는 노드 역할 제어 UI 세션으로 확장되지 **않습니다**.
    - 동일 호스트 loopback 역방향 프록시도 trusted-proxy 인증을 충족하지 않습니다. [신뢰할 수 있는 프록시 인증](/ko/gateway/trusted-proxy-auth)을 참조하세요.

  </Accordion>
</AccordionGroup>

HTTPS 설정 지침은 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## 콘텐츠 보안 정책

제어 UI는 엄격한 `img-src` 정책과 함께 제공됩니다. **동일 출처** 자산, `data:` URL, 로컬에서 생성된 `blob:` URL만 허용됩니다. 원격 `http(s)` 및 프로토콜 상대 이미지 URL은 브라우저에서 거부되며 네트워크 가져오기를 발생시키지 않습니다.

실제로는 다음을 의미합니다.

- 상대 경로(예: `/avatars/<id>`) 아래에서 제공되는 아바타와 이미지는 계속 렌더링됩니다. 여기에는 UI가 가져와 로컬 `blob:` URL로 변환하는 인증된 아바타 경로도 포함됩니다.
- 인라인 `data:image/...` URL은 계속 렌더링됩니다(프로토콜 내 페이로드에 유용).
- 제어 UI가 만든 로컬 `blob:` URL은 계속 렌더링됩니다.
- 채널 메타데이터가 내보내는 원격 아바타 URL은 제어 UI의 아바타 헬퍼에서 제거되고 내장 로고/배지로 대체되므로, 손상되었거나 악의적인 채널이 운영자 브라우저에서 임의의 원격 이미지 가져오기를 강제할 수 없습니다.

이 동작을 얻기 위해 변경할 것은 없습니다. 항상 켜져 있으며 구성할 수 없습니다.

## 아바타 경로 인증

Gateway 인증이 구성되어 있으면 제어 UI 아바타 엔드포인트는 API의 나머지 부분과 동일한 Gateway 토큰을 요구합니다.

- `GET /avatar/<agentId>`는 인증된 호출자에게만 아바타 이미지를 반환합니다. `GET /avatar/<agentId>?meta=1`은 같은 규칙에 따라 아바타 메타데이터를 반환합니다.
- 두 경로 중 하나에 대한 인증되지 않은 요청은 거부됩니다(형제 assistant-media 경로와 동일). 이를 통해 그 외에는 보호되는 호스트에서 아바타 경로가 에이전트 ID를 유출하지 않도록 합니다.
- 제어 UI 자체는 아바타를 가져올 때 Gateway 토큰을 bearer 헤더로 전달하고, 이미지가 대시보드에서 계속 렌더링되도록 인증된 blob URL을 사용합니다.

Gateway 인증을 비활성화하면(공유 호스트에서는 권장하지 않음) Gateway의 나머지 부분과 마찬가지로 아바타 경로도 인증되지 않은 상태가 됩니다.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음으로 빌드하세요.

```bash
pnpm ui:build
```

선택적 절대 기본 경로(고정 자산 URL을 원할 때):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 개발 서버):

```bash
pnpm ui:dev
```

그런 다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키도록 하세요.

## 디버깅/테스트: 개발 서버 + 원격 Gateway

제어 UI는 정적 파일이며, WebSocket 대상은 구성 가능하고 HTTP 출처와 다를 수 있습니다. 로컬에서는 Vite 개발 서버를 사용하고 Gateway는 다른 곳에서 실행하려는 경우 유용합니다.

<Steps>
  <Step title="UI 개발 서버 시작">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl로 열기">
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
  <Accordion title="참고 사항">
    - `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서 제거됩니다.
    - `gatewayUrl`을 통해 전체 `ws://` 또는 `wss://` 엔드포인트를 전달하는 경우, 브라우저가 쿼리 문자열을 올바르게 파싱하도록 `gatewayUrl` 값을 URL 인코딩하세요.
    - 가능하면 `token`은 URL 프래그먼트(`#token=...`)를 통해 전달해야 합니다. 프래그먼트는 서버로 전송되지 않으므로 요청 로그 및 Referer 유출을 방지합니다. 레거시 `?token=` 쿼리 매개변수는 호환성을 위해 여전히 한 번 가져오지만, fallback으로만 사용되며 bootstrap 직후 즉시 제거됩니다.
    - `password`는 메모리에만 유지됩니다.
    - `gatewayUrl`이 설정되면 UI는 구성 또는 환경 자격 증명으로 fallback하지 않습니다. `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류입니다.
    - Gateway가 TLS(Tailscale Serve, HTTPS 프록시 등) 뒤에 있을 때는 `wss://`를 사용하세요.
    - 클릭재킹을 방지하기 위해 `gatewayUrl`은 최상위 창(임베드되지 않음)에서만 허용됩니다.
    - non-loopback 제어 UI 배포는 `gateway.controlUi.allowedOrigins`를 명시적으로 설정해야 합니다(전체 출처). 여기에는 원격 개발 설정도 포함됩니다.
    - Gateway 시작 시 유효한 런타임 바인드 및 포트에서 `http://localhost:<port>` 및 `http://127.0.0.1:<port>` 같은 로컬 출처를 시드할 수 있지만, 원격 브라우저 출처에는 여전히 명시적 항목이 필요합니다.
    - 엄격하게 제어되는 로컬 테스트를 제외하고 `gateway.controlUi.allowedOrigins: ["*"]`를 사용하지 마세요. 이는 "내가 사용하는 호스트와 일치"가 아니라 모든 브라우저 출처를 허용한다는 뜻입니다.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host 헤더 출처 fallback 모드를 활성화하지만, 위험한 보안 모드입니다.

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
- [상태 검사](/ko/gateway/health) — Gateway 상태 모니터링
- [TUI](/ko/web/tui) — 터미널 사용자 인터페이스
- [WebChat](/ko/web/webchat) — 브라우저 기반 채팅 인터페이스
