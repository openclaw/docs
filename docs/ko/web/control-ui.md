---
read_when:
    - 브라우저에서 Gateway를 운영하려는 경우
    - SSH 터널 없이 Tailnet 액세스를 원합니다
sidebarTitle: Control UI
summary: Gateway용 브라우저 기반 제어 UI(채팅, 활동, 노드, 설정)
title: 제어 UI
x-i18n:
    generated_at: "2026-06-27T18:18:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc8b9675454d57bbfb6be10bb7ef94152a89a72c94affdf72be8c79cf14cbb08
    source_path: web/control-ui.md
    workflow: 16
---

Control UI는 Gateway에서 제공되는 작은 **Vite + Lit** 단일 페이지 앱입니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

동일한 포트에서 **Gateway WebSocket에 직접** 통신합니다.

## 빠른 열기(로컬)

Gateway가 같은 컴퓨터에서 실행 중이면 다음을 여세요.

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) 또는 [http://localhost:18789/](http://localhost:18789/)

페이지가 로드되지 않으면 먼저 Gateway를 시작하세요: `openclaw gateway`.

인증은 WebSocket 핸드셰이크 중 다음을 통해 제공됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 신뢰할 수 있는 프록시 ID 헤더

대시보드 설정 패널은 현재 브라우저 탭 세션과 선택한 gateway URL에 대한 토큰을 보관하며, 비밀번호는 유지하지 않습니다. 온보딩은 일반적으로 첫 연결 시 공유 비밀 인증용 gateway 토큰을 생성하지만, `gateway.auth.mode`가 `"password"`일 때는 비밀번호 인증도 작동합니다.

## 기기 페어링(첫 연결)

새 브라우저나 기기에서 Control UI에 연결하면 Gateway는 일반적으로 **일회성 페어링 승인**을 요구합니다. 이는 무단 접근을 방지하기 위한 보안 조치입니다.

**표시되는 내용:** "disconnected (1008): pairing required"

<Steps>
  <Step title="List pending requests">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Approve by request ID">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

브라우저가 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 다시 시도하면, 이전 대기 요청은 대체되고 새 `requestId`가 생성됩니다. 승인하기 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 페어링되어 있고 읽기 접근 권한에서 쓰기/관리자 접근 권한으로 변경하면, 이는 조용한 재연결이 아니라 승인 업그레이드로 처리됩니다. OpenClaw는 기존 승인을 활성 상태로 유지하고 더 넓은 권한의 재연결을 차단한 다음, 새 범위 집합을 명시적으로 승인하도록 요청합니다.

승인되면 기기가 기억되며, `openclaw devices revoke --device <id> --role <role>`로 철회하지 않는 한 재승인이 필요하지 않습니다. 토큰 순환 및 철회는 [Devices CLI](/ko/cli/devices)를 참조하세요.

`openclaw_gateway` 어댑터를 통해 연결하는 Paperclip 에이전트는 동일한 최초 실행 승인 흐름을 사용합니다. 초기 연결 시도 후 `openclaw devices approve --latest`를 실행하여 대기 요청을 미리 확인한 다음, 출력된 `openclaw devices approve <requestId>` 명령을 다시 실행하여 승인하세요. 원격 gateway에는 명시적인 `--url` 및 `--token` 값을 전달하세요. 재시작 후에도 승인을 안정적으로 유지하려면, 실행할 때마다 새 임시 기기 ID를 생성하게 두는 대신 Paperclip에서 영구 `adapterConfig.devicePrivateKeyPem`을 구성하세요.

<Note>
- 직접 local loopback 브라우저 연결(`127.0.0.1` / `localhost`)은 자동 승인됩니다.
- Tailscale Serve는 `gateway.auth.allowTailscale: true`이고 Tailscale ID가 확인되며 브라우저가 자신의 기기 ID를 제시할 때 Control UI 운영자 세션의 페어링 왕복을 건너뛸 수 있습니다.
- 직접 Tailnet 바인딩, LAN 브라우저 연결, 기기 ID가 없는 브라우저 프로필은 여전히 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 기기 ID를 생성하므로, 브라우저를 전환하거나 브라우저 데이터를 지우면 다시 페어링해야 합니다.

</Note>

## 개인 ID(브라우저 로컬)

Control UI는 공유 세션에서 출처 표시를 위해 발신 메시지에 연결되는 브라우저별 개인 ID(표시 이름 및 아바타)를 지원합니다. 이는 브라우저 저장소에 있으며, 현재 브라우저 프로필로 범위가 제한되고, 실제로 보낸 메시지의 일반적인 transcript 작성자 메타데이터를 제외하면 다른 기기로 동기화되거나 서버 측에 유지되지 않습니다. 사이트 데이터를 지우거나 브라우저를 전환하면 빈 값으로 재설정됩니다.

동일한 브라우저 로컬 패턴은 어시스턴트 아바타 재정의에도 적용됩니다. 업로드된 어시스턴트 아바타는 로컬 브라우저에서만 gateway가 해석한 ID 위에 오버레이되며 `config.patch`를 통해 왕복하지 않습니다. 공유 `ui.assistant.avatar` config 필드는 해당 필드를 직접 쓰는 비 UI 클라이언트(예: 스크립트화된 gateways 또는 사용자 지정 대시보드)에서 계속 사용할 수 있습니다.

## 런타임 config 엔드포인트

Control UI는 `/control-ui-config.json`에서 런타임 설정을 가져오며, 이는 gateway의 Control UI 기본 경로를 기준으로 해석됩니다(예: UI가 `/__openclaw__/` 아래에서 제공될 때 `/__openclaw__/control-ui-config.json`). 해당 엔드포인트는 나머지 HTTP 표면과 동일한 gateway 인증으로 보호됩니다. 인증되지 않은 브라우저는 이를 가져올 수 없으며, 성공적인 가져오기에는 이미 유효한 gateway 토큰/비밀번호, Tailscale Serve ID 또는 신뢰할 수 있는 프록시 ID 중 하나가 필요합니다.

## 언어 지원

Control UI는 첫 로드 시 브라우저 로캘을 기반으로 자체 지역화를 수행할 수 있습니다. 나중에 재정의하려면 **Overview -> Gateway Access -> Language**를 여세요. 로캘 선택기는 Appearance 아래가 아니라 Gateway Access 카드에 있습니다.

- 지원되는 로캘: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 영어가 아닌 번역은 브라우저에서 지연 로드됩니다.
- 선택한 로캘은 브라우저 저장소에 저장되며 이후 방문 시 재사용됩니다.
- 누락된 번역 키는 영어로 대체됩니다.

Docs 번역은 동일한 비영어 로캘 집합에 대해 생성되지만, docs 사이트에 내장된 Mintlify 언어 선택기는 Mintlify가 허용하는 로캘 코드로 제한됩니다. 태국어(`th`) 및 페르시아어(`fa`) docs는 publish repo에 계속 생성되지만, Mintlify가 해당 코드를 지원할 때까지 해당 선택기에 표시되지 않을 수 있습니다.

## Appearance 테마

Appearance 패널은 내장 Claw, Knot, Dash 테마와 브라우저 로컬 tweakcn 가져오기 슬롯 하나를 유지합니다. 테마를 가져오려면 [tweakcn 편집기](https://tweakcn.com/editor/theme)를 열고 테마를 선택하거나 만든 다음 **Share**를 클릭하고 복사한 테마 링크를 Appearance에 붙여넣으세요. 가져오기는 `https://tweakcn.com/r/themes/<id>` 레지스트리 URL, `https://tweakcn.com/editor/theme?theme=amethyst-haze` 같은 편집기 URL, 상대 `/themes/<id>` 경로, 원시 테마 ID, `amethyst-haze` 같은 기본 테마 이름도 허용합니다.

Appearance에는 브라우저 로컬 텍스트 크기 설정도 포함됩니다. 이 설정은 나머지 Control UI 기본 설정과 함께 저장되고, 채팅 텍스트, 작성기 텍스트, 도구 카드, 채팅 사이드바에 적용되며, 모바일 Safari가 포커스 시 자동 확대하지 않도록 텍스트 입력을 최소 16px로 유지합니다.

가져온 테마는 현재 브라우저 프로필에만 저장됩니다. gateway config에 기록되지 않으며 기기 간 동기화되지 않습니다. 가져온 테마를 교체하면 하나의 로컬 슬롯이 업데이트됩니다. 이를 지우면 가져온 테마가 선택되어 있었던 경우 활성 테마가 Claw로 다시 전환됩니다.

## 수행할 수 있는 작업(현재)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Gateway WS(`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)를 통해 모델과 채팅합니다.
    - 채팅 기록 새로 고침은 메시지별 텍스트 제한이 있는 제한된 최근 창을 요청하므로, 큰 세션에서도 채팅을 사용할 수 있게 되기 전에 브라우저가 전체 transcript 페이로드를 렌더링하도록 강제하지 않습니다.
    - 브라우저 realtime 세션을 통해 음성 대화를 합니다. OpenAI는 직접 WebRTC를 사용하고, Google Live는 WebSocket을 통한 제한된 일회용 브라우저 토큰을 사용하며, 백엔드 전용 realtime 음성 plugins는 Gateway 릴레이 전송을 사용합니다. 클라이언트 소유 공급자 세션은 `talk.client.create`로 시작하고, Gateway 릴레이 세션은 `talk.session.create`로 시작합니다. 릴레이는 공급자 자격 증명을 Gateway에 유지하면서 브라우저가 `talk.session.appendAudio`를 통해 마이크 PCM을 스트리밍하게 하고, Gateway 정책 및 더 큰 구성된 OpenClaw 모델을 위해 `openclaw_agent_consult` 공급자 도구 호출을 `talk.client.toolCall`을 통해 전달하며, 활성 실행 음성 조정을 `talk.client.steer` 또는 `talk.session.steer`를 통해 라우팅합니다.
    - 채팅에서 도구 호출 및 실시간 도구 출력 카드를 스트리밍합니다(에이전트 이벤트).
    - 기존 `session.tool` / 도구 이벤트 전달에서 실시간 도구 활동에 대한 브라우저 로컬, 삭제 우선 요약을 제공하는 Activity 탭입니다.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - Channels: 내장 및 번들/외부 Plugin channels 상태, QR 로그인, 채널별 config(`channels.status`, `web.login.*`, `config.patch`).
    - 채널 probe 새로 고침은 느린 공급자 검사가 끝나는 동안 이전 스냅샷을 계속 표시하며, probe 또는 audit이 UI 예산을 초과하면 부분 스냅샷에 레이블을 붙입니다.
    - Instances: presence 목록 및 새로 고침(`system-presence`).
    - Sessions: 기본적으로 구성된 에이전트 세션을 나열하고, 오래된 미구성 에이전트 세션 키에서 폴백하며, 세션별 model/thinking/fast/verbose/trace/reasoning 재정의를 적용합니다(`sessions.list`, `sessions.patch`).
    - Dreams: dreaming 상태, 활성화/비활성화 토글, Dream Diary 리더(`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron 작업: 목록/추가/편집/실행/활성화/비활성화 및 실행 기록(`cron.*`).
    - Skills: 상태, 활성화/비활성화, 설치, API 키 업데이트(`skills.*`).
    - Nodes: 목록 및 caps(`node.list`).
    - Exec 승인: `exec host=gateway/node`에 대한 gateway 또는 node allowlist 및 ask 정책 편집(`exec.approvals.*`).

  </Accordion>
  <Accordion title="Config">
    - `~/.openclaw/openclaw.json` 보기/편집(`config.get`, `config.set`).
    - MCP에는 구성된 서버, 활성화, OAuth/filter/parallel 요약, 일반 운영자 명령, 범위가 지정된 `mcp` config 편집기를 위한 전용 설정 페이지가 있습니다.
    - 검증과 함께 적용 및 재시작(`config.apply`)하고 마지막 활성 세션을 깨웁니다.
    - 쓰기에는 동시 편집으로 인한 덮어쓰기를 방지하는 base-hash 가드가 포함됩니다.
    - 쓰기(`config.set`/`config.apply`/`config.patch`)는 제출된 config 페이로드의 refs에 대해 활성 SecretRef 해석을 사전 확인합니다. 해석되지 않은 활성 제출 refs는 쓰기 전에 거부됩니다.
    - 양식 저장은 저장된 config에서 복원할 수 없는 오래된 삭제 자리 표시자를 버리면서, 저장된 secrets에 여전히 매핑되는 삭제된 값은 보존합니다.
    - Schema 및 양식 렌더링(`config.schema` / `config.schema.lookup`, 필드 `title` / `description`, 일치한 UI 힌트, 즉시 하위 요약, 중첩 object/wildcard/array/composition nodes의 docs 메타데이터, 사용 가능한 경우 Plugin 및 channel schemas 포함). Raw JSON 편집기는 스냅샷에 안전한 raw 왕복이 있을 때만 사용할 수 있습니다.
    - 스냅샷이 raw 텍스트를 안전하게 왕복할 수 없으면 Control UI는 Form 모드를 강제하고 해당 스냅샷의 Raw 모드를 비활성화합니다.
    - Raw JSON 편집기의 "Reset to saved"는 평탄화된 스냅샷을 다시 렌더링하는 대신 raw로 작성된 형태(서식, 주석, `$include` 레이아웃)를 보존하므로, 스냅샷이 안전하게 왕복할 수 있을 때 외부 편집이 reset 후에도 유지됩니다.
    - 구조화된 SecretRef object 값은 실수로 object가 string으로 손상되는 것을 방지하기 위해 양식 텍스트 입력에서 읽기 전용으로 렌더링됩니다.

  </Accordion>
  <Accordion title="Debug, logs, update">
    - Debug: status/health/models 스냅샷, 이벤트 로그, 수동 RPC 호출(`status`, `health`, `models.list`).
    - 이벤트 로그에는 Control UI 새로 고침/RPC 타이밍, 느린 chat/config 렌더링 타이밍, 그리고 브라우저가 해당 PerformanceObserver entry types를 노출할 때 긴 animation frames 또는 long tasks에 대한 브라우저 응답성 항목이 포함됩니다.
    - Logs: 필터/내보내기가 있는 gateway 파일 로그의 실시간 tail(`logs.tail`).
    - Update: 재시작 보고서와 함께 패키지/git 업데이트 및 재시작(`update.run`)을 실행한 다음, 재연결 후 `update.status`를 폴링하여 실행 중인 gateway 버전을 확인합니다.

  </Accordion>
  <Accordion title="Cron 작업 패널 참고 사항">
    - 격리된 작업의 경우 전달 기본값은 요약 알림입니다. 내부 전용 실행을 원하면 없음으로 전환할 수 있습니다.
    - 알림이 선택되면 채널/대상 필드가 표시됩니다.
    - Webhook 모드는 `delivery.mode = "webhook"`을 사용하며 `delivery.to`는 유효한 HTTP(S) Webhook URL로 설정합니다.
    - 메인 세션 작업에서는 Webhook 및 없음 전달 모드를 사용할 수 있습니다.
    - 고급 편집 컨트롤에는 실행 후 삭제, 에이전트 재정의 지우기, Cron exact/stagger 옵션, 에이전트 모델/사고 재정의, 최선형 전달 토글이 포함됩니다.
    - 양식 유효성 검사는 필드 수준 오류와 함께 인라인으로 표시되며, 잘못된 값은 수정될 때까지 저장 버튼을 비활성화합니다.
    - 전용 bearer 토큰을 보내려면 `cron.webhookToken`을 설정하세요. 생략하면 인증 헤더 없이 Webhook이 전송됩니다.
    - 사용 중단된 fallback: `cron.webhook`의 `notify: true`가 있는 저장된 레거시 작업을 명시적인 작업별 Webhook 또는 완료 전달로 마이그레이션하려면 `openclaw doctor --fix`를 실행하세요.

  </Accordion>
</AccordionGroup>

## MCP 페이지

전용 MCP 페이지는 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버를 위한 운영자 보기입니다. 이 페이지 자체가 MCP 전송을 시작하지는 않습니다. 저장된 구성을 검사하고 편집한 다음, 라이브 서버 증명이 필요할 때 `openclaw mcp doctor --probe`를 사용하세요.

일반적인 워크플로:

1. 사이드바에서 **MCP**를 엽니다.
2. 요약 카드에서 전체, 활성화됨, OAuth, 필터링된 서버 수를 확인합니다.
3. 각 서버 행에서 전송, 활성화 여부, 인증, 필터, 제한 시간, 명령 힌트를 검토합니다.
4. 서버 구성을 유지하되 런타임 검색에서는 제외해야 할 때 활성화 여부를 토글합니다.
5. 서버 정의, 헤더, TLS/mTLS 경로, OAuth 메타데이터, 도구 필터, Codex 프로젝션 메타데이터를 위한 범위 지정된 `mcp` 구성 섹션을 편집합니다.
6. 구성을 기록하려면 **저장**을 사용하고, 실행 중인 Gateway가 변경된 구성을 적용해야 하면 **저장 및 게시**를 사용합니다.
7. 편집된 프로세스에 정적 진단, 라이브 증명, 또는 캐시된 런타임 폐기가 필요하면 터미널에서 `openclaw mcp status --verbose`, `openclaw mcp doctor --probe`, 또는 `openclaw mcp reload`를 실행합니다.

이 페이지는 렌더링하기 전에 자격 증명을 포함한 URL 유사 값을 마스킹하고, 서버 이름을 명령 스니펫에서 따옴표로 감싸므로 복사한 명령이 공백이나 셸 메타문자가 있어도 계속 작동합니다. 전체 CLI 및 구성 참조는 [MCP](/ko/cli/mcp)에 있습니다.

## 활동 탭

활동 탭은 라이브 도구 활동을 관찰하는 일시적인 브라우저 로컬 관찰자입니다. 이는 채팅 도구 카드를 구동하는 동일한 Gateway `session.tool` / 도구 이벤트 스트림에서 파생됩니다. 별도의 Gateway 이벤트 계열, 엔드포인트, 영구 활동 저장소, 메트릭 피드, 또는 외부 관찰자 스트림을 추가하지 않습니다.

활동 항목은 정리된 요약과 마스킹되고 잘린 출력 미리보기만 유지합니다. 도구 인수 값은 활동 상태에 저장되지 않습니다. UI는 인수가 숨겨졌음을 표시하고 인수 필드 개수만 기록합니다. 메모리 내 목록은 현재 브라우저 탭을 따르며, 제어 UI 내 탐색 중에는 유지되고, 페이지 새로고침, 세션 전환, 또는 **지우기** 시 초기화됩니다.

## 채팅 동작

<AccordionGroup>
  <Accordion title="전송 및 기록 의미">
    - `chat.send`는 **비차단**입니다. `{ runId, status: "started" }`로 즉시 ack하고 응답은 `chat` 이벤트를 통해 스트리밍됩니다. 신뢰할 수 있는 제어 UI 클라이언트는 로컬 진단을 위한 선택적 ACK 타이밍 메타데이터도 받을 수 있습니다.
    - 채팅 업로드는 이미지와 비디오가 아닌 파일을 허용합니다. 이미지는 네이티브 이미지 경로를 유지하며, 다른 파일은 관리형 미디어로 저장되고 기록에는 첨부 파일 링크로 표시됩니다.
    - 같은 `idempotencyKey`로 다시 전송하면 실행 중에는 `{ status: "in_flight" }`를 반환하고, 완료 후에는 `{ status: "ok" }`를 반환합니다.
    - `chat.history` 응답은 UI 안전을 위해 크기가 제한됩니다. 트랜스크립트 항목이 너무 크면 Gateway는 긴 텍스트 필드를 자르고, 무거운 메타데이터 블록을 생략하며, 과도하게 큰 메시지를 자리 표시자(`[chat.history omitted: message too large]`)로 대체할 수 있습니다.
    - 보이는 어시스턴트 메시지가 `chat.history`에서 잘렸다면, 사이드 리더는 필요 시 `sessionKey`, 활성 `agentId`, 그리고 트랜스크립트 `messageId`를 통해 `chat.message.get`으로 전체 표시 정규화 트랜스크립트 항목을 가져올 수 있습니다. Gateway가 여전히 더 많은 내용을 반환할 수 없으면, 리더는 잘린 미리보기를 조용히 반복하는 대신 명시적인 사용 불가 상태를 표시합니다.
    - 어시스턴트/생성 이미지는 관리형 미디어 참조로 유지되고 인증된 Gateway 미디어 URL을 통해 다시 제공되므로, 새로고침은 원시 base64 이미지 페이로드가 채팅 기록 응답에 계속 남아 있는지에 의존하지 않습니다.
    - `chat.history`를 렌더링할 때 제어 UI는 보이는 어시스턴트 텍스트에서 표시 전용 인라인 지시문 태그(예: `[[reply_to_*]]` 및 `[[audio_as_voice]]`), 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함), 유출된 ASCII/전각 모델 제어 토큰을 제거하고, 보이는 전체 텍스트가 정확한 무음 토큰 `NO_REPLY` / `no_reply` 또는 Heartbeat 승인 토큰 `HEARTBEAT_OK`뿐인 어시스턴트 항목은 생략합니다.
    - 활성 전송 중과 최종 기록 새로고침 중에 `chat.history`가 잠시 이전 스냅샷을 반환하더라도 채팅 보기는 로컬 낙관적 사용자/어시스턴트 메시지를 계속 표시합니다. Gateway 기록이 따라잡으면 정식 트랜스크립트가 해당 로컬 메시지를 대체합니다.
    - 라이브 `chat` 이벤트는 전달 상태이고, `chat.history`는 영구 세션 트랜스크립트에서 재구성됩니다. 도구 최종 이벤트 후 제어 UI는 기록을 다시 로드하고 작은 낙관적 꼬리만 병합합니다. 트랜스크립트 경계는 [WebChat](/ko/web/webchat)에 문서화되어 있습니다.
    - `chat.inject`는 세션 트랜스크립트에 어시스턴트 메모를 추가하고 UI 전용 업데이트를 위한 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, 채널 전달 없음).
    - 채팅 헤더는 세션 선택기 앞에 에이전트 필터를 표시하며, 세션 선택기는 선택한 에이전트로 범위가 지정됩니다. 에이전트를 전환하면 해당 에이전트에 연결된 세션만 표시되고, 저장된 대시보드 세션이 아직 없으면 해당 에이전트의 메인 세션으로 fallback합니다.
    - 데스크톱 너비에서는 채팅 컨트롤이 하나의 컴팩트한 행에 유지되고 트랜스크립트를 아래로 스크롤하는 동안 접힙니다. 위로 스크롤하거나, 맨 위로 돌아가거나, 맨 아래에 도달하면 컨트롤이 복원됩니다.
    - 연속된 중복 텍스트 전용 메시지는 개수 배지가 있는 하나의 말풍선으로 렌더링됩니다. 이미지, 첨부 파일, 도구 출력, 또는 캔버스 미리보기를 포함한 메시지는 접히지 않습니다.
    - 채팅 헤더의 모델 및 사고 선택기는 `sessions.patch`를 통해 활성 세션을 즉시 패치합니다. 이는 영구 세션 재정의이며, 단일 턴 전용 전송 옵션이 아닙니다.
    - 같은 세션의 모델 선택기 변경이 아직 저장 중일 때 메시지를 보내면, 작성기는 선택한 모델을 사용해 전송하도록 `chat.send`를 호출하기 전에 해당 세션 패치를 기다립니다.
    - 제어 UI에서 `/new`를 입력하면 새 채팅과 동일한 새로운 대시보드 세션을 만들고 전환합니다. 단, `session.dmScope: "main"`이 구성되어 있고 현재 상위가 에이전트의 메인 세션인 경우에는 그 자리에서 메인 세션을 초기화합니다. `/reset`을 입력하면 현재 세션에 대한 Gateway의 명시적인 제자리 초기화를 유지합니다.
    - 채팅 모델 선택기는 Gateway의 구성된 모델 보기를 요청합니다. `agents.defaults.models`가 있으면 해당 허용 목록이 선택기를 구동하며, 공급자 범위 카탈로그를 동적으로 유지하는 `provider/*` 항목도 포함됩니다. 그렇지 않으면 선택기는 명시적인 `models.providers.*.models` 항목과 사용할 수 있는 인증이 있는 공급자를 표시합니다. 전체 카탈로그는 디버그 `models.list` RPC에서 `view: "all"`로 계속 사용할 수 있습니다.
    - 새로운 Gateway 세션 사용량 보고서에 현재 컨텍스트 토큰이 포함되어 있으면 채팅 작성기 영역에 컴팩트한 컨텍스트 사용량 표시기가 표시됩니다. 컨텍스트 압박이 높으면 경고 스타일로 전환되고, 권장 Compaction 수준에서는 일반 세션 Compaction 경로를 실행하는 컴팩트한 버튼을 표시합니다. 오래된 토큰 스냅샷은 Gateway가 새로운 사용량을 다시 보고할 때까지 숨겨집니다.

  </Accordion>
  <Accordion title="Talk 모드(브라우저 실시간)">
    Talk 모드는 등록된 실시간 음성 공급자를 사용합니다. OpenAI는 `talk.realtime.provider: "openai"`와 `openai` API 키 인증 프로필, `talk.realtime.providers.openai.apiKey`, 또는 `OPENAI_API_KEY`로 구성하세요. OpenAI OAuth 프로필은 Realtime 음성을 구성하지 않습니다. Google은 `talk.realtime.provider: "google"`와 `talk.realtime.providers.google.apiKey`로 구성하세요. 브라우저는 표준 공급자 API 키를 절대 받지 않습니다. OpenAI는 WebRTC용 임시 Realtime 클라이언트 비밀을 받습니다. Google Live는 브라우저 WebSocket 세션을 위한 일회용 제한 Live API 인증 토큰을 받으며, 지침과 도구 선언은 Gateway가 토큰 안에 고정합니다. 백엔드 실시간 브리지만 노출하는 공급자는 Gateway 릴레이 전송을 통해 실행되므로, 브라우저 오디오는 인증된 Gateway RPC를 통해 이동하는 동안 자격 증명과 벤더 소켓은 서버 측에 유지됩니다. Realtime 세션 프롬프트는 Gateway가 조립합니다. `talk.client.create`는 호출자가 제공한 지침 재정의를 허용하지 않습니다.

    채팅 작성기에는 Talk 시작/중지 버튼 옆에 Talk 옵션 버튼이 포함됩니다. 옵션은 다음 Talk 세션에 적용되며 공급자, 전송, 모델, 음성, 추론 노력, VAD 임계값, 무음 지속 시간, 접두 패딩을 재정의할 수 있습니다. 옵션이 비어 있으면 Gateway는 가능한 경우 구성된 기본값을 사용하고, 없으면 공급자 기본값을 사용합니다. Gateway 릴레이를 선택하면 백엔드 릴레이 경로가 강제됩니다. WebRTC를 선택하면 세션은 클라이언트 소유로 유지되며, 공급자가 브라우저 세션을 만들 수 없는 경우 조용히 릴레이로 fallback하지 않고 실패합니다.

    채팅 작성기에서 Talk 컨트롤은 마이크 받아쓰기 버튼 옆의 파형 버튼입니다. Talk가 시작되면 작성기 상태 행은 `Connecting Talk...`를 표시한 다음, 오디오가 연결되면 `Talk live`를 표시하거나, 실시간 도구 호출이 `talk.client.toolCall`을 통해 구성된 더 큰 모델에 문의하는 동안 `Asking OpenClaw...`를 표시합니다.

    유지관리자 라이브 스모크: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`는 OpenAI 백엔드 WebSocket 브리지, OpenAI 브라우저 WebRTC SDP 교환, Google Live 제한 토큰 브라우저 WebSocket 설정, 가짜 마이크 미디어가 있는 Gateway 릴레이 브라우저 어댑터를 검증합니다. 이 명령은 공급자 상태만 출력하며 비밀을 기록하지 않습니다.

  </Accordion>
  <Accordion title="중지 및 중단">
    - **중지**를 클릭합니다(`chat.abort` 호출).
    - 실행이 활성 상태인 동안 일반 후속 메시지는 대기열에 들어갑니다. 대기 중인 메시지에서 **조향**을 클릭하면 해당 후속 메시지를 실행 중인 턴에 주입합니다.
    - 대역 외로 중단하려면 `/stop`을 입력하거나 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 독립 중단 문구를 입력합니다.
    - `chat.abort`는 `{ sessionKey }`(`runId` 없음)를 지원하여 해당 세션의 모든 활성 실행을 중단합니다.

  </Accordion>
  <Accordion title="중단 부분 유지">
    - 실행이 중단되면 부분 어시스턴트 텍스트가 UI에 계속 표시될 수 있습니다.
    - Gateway는 버퍼링된 출력이 있으면 중단된 부분 어시스턴트 텍스트를 트랜스크립트 기록에 유지합니다.
    - 유지된 항목에는 중단 메타데이터가 포함되어 트랜스크립트 소비자가 중단 부분과 일반 완료 출력을 구분할 수 있습니다.

  </Accordion>
</AccordionGroup>

## PWA 설치 및 웹 푸시

제어 UI는 `manifest.webmanifest`와 서비스 워커를 함께 제공하므로 최신 브라우저에서 독립 실행형 PWA로 설치할 수 있습니다. 웹 푸시를 사용하면 탭이나 브라우저 창이 열려 있지 않아도 Gateway가 알림으로 설치된 PWA를 깨울 수 있습니다.

OpenClaw 업데이트 직후 페이지에 **프로토콜 불일치**가 표시되면 먼저 `openclaw dashboard`로 대시보드를 다시 열고 페이지를 강력 새로고침하세요. 그래도 실패하면 대시보드 origin의 사이트 데이터를 지우거나 비공개 브라우저 창에서 테스트하세요. 오래된 탭이나 브라우저 서비스 워커 캐시가 새 Gateway에 대해 업데이트 전 제어 UI 번들을 계속 실행할 수 있습니다.

| 표면                                                  | 하는 일                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 매니페스트입니다. 접근 가능해지면 브라우저가 "앱 설치"를 제공합니다. |
| `ui/public/sw.js`                                     | `push` 이벤트와 알림 클릭을 처리하는 서비스 워커입니다. |
| `push/vapid-keys.json` (OpenClaw 상태 디렉터리 아래) | Web Push 페이로드 서명에 사용되는 자동 생성 VAPID 키 쌍입니다. |
| `push/web-push-subscriptions.json`                    | 유지되는 브라우저 구독 엔드포인트입니다.                          |

키를 고정하려는 경우(다중 호스트 배포, 시크릿 순환, 테스트 등) Gateway 프로세스의 환경 변수를 통해 VAPID 키 쌍을 재정의하세요.

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (기본값은 `https://openclaw.ai`)

Control UI는 브라우저 구독을 등록하고 테스트하기 위해 다음 범위 제한 Gateway 메서드를 사용합니다.

- `push.web.vapidPublicKey` — 활성 VAPID 공개 키를 가져옵니다.
- `push.web.subscribe` — `endpoint`와 `keys.p256dh`/`keys.auth`를 등록합니다.
- `push.web.unsubscribe` — 등록된 엔드포인트를 제거합니다.
- `push.web.test` — 호출자의 구독으로 테스트 알림을 보냅니다.

<Note>
Web Push는 iOS APNS 릴레이 경로(릴레이 기반 푸시는 [구성](/ko/gateway/configuration) 참조) 및 네이티브 모바일 페어링을 대상으로 하는 기존 `push.test` 메서드와 독립적입니다.
</Note>

## 호스팅된 임베드

어시스턴트 메시지는 `[embed ...]` 쇼트코드를 사용해 호스팅된 웹 콘텐츠를 인라인으로 렌더링할 수 있습니다. iframe 샌드박스 정책은 `gateway.controlUi.embedSandbox`로 제어됩니다.

<Tabs>
  <Tab title="strict">
    호스팅된 임베드 내부의 스크립트 실행을 비활성화합니다.
  </Tab>
  <Tab title="scripts (default)">
    출처 격리를 유지하면서 대화형 임베드를 허용합니다. 이것이 기본값이며, 일반적으로 독립형 브라우저 게임/위젯에 충분합니다.
  </Tab>
  <Tab title="trusted">
    의도적으로 더 강한 권한이 필요한 동일 사이트 문서에 대해 `allow-scripts`에 더해 `allow-same-origin`을 추가합니다.
  </Tab>
</Tabs>

예시:

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
임베드된 문서에 실제로 동일 출처 동작이 필요한 경우에만 `trusted`를 사용하세요. 대부분의 에이전트 생성 게임과 대화형 캔버스에는 `scripts`가 더 안전한 선택입니다.
</Warning>

절대 외부 `http(s)` 임베드 URL은 기본적으로 계속 차단됩니다. 의도적으로 `[embed url="https://..."]`가 타사 페이지를 로드하도록 하려면 `gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## 채팅 메시지 너비

그룹화된 채팅 메시지는 읽기 쉬운 기본 최대 너비를 사용합니다. 와이드 모니터 배포에서는 번들 CSS를 패치하지 않고 `gateway.controlUi.chatMessageMaxWidth`를 설정해 재정의할 수 있습니다.

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

이 값은 브라우저에 도달하기 전에 검증됩니다. 지원되는 값에는 `960px` 또는 `82%` 같은 일반 길이와 백분율, 그리고 제한된 `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, `fit-content(...)` 너비 표현식이 포함됩니다.

## tailnet 접근(권장)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway를 loopback에 유지하고 Tailscale Serve가 HTTPS로 프록시하도록 합니다.

    ```bash
    openclaw gateway --tailscale serve
    ```

    열기:

    - `https://<magicdns>/` (또는 구성한 `gateway.controlUi.basePath`)

    기본적으로 `gateway.auth.allowTailscale`이 `true`이면 Control UI/WebSocket Serve 요청은 Tailscale 신원 헤더(`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는 `x-forwarded-for` 주소를 `tailscale whois`로 확인하고 헤더와 일치시키는 방식으로 신원을 검증하며, 요청이 Tailscale의 `x-forwarded-*` 헤더와 함께 loopback에 도달할 때만 이를 허용합니다. 브라우저 장치 신원이 있는 Control UI 운영자 세션의 경우, 이 검증된 Serve 경로는 장치 페어링 왕복도 건너뜁니다. 장치가 없는 브라우저와 노드 역할 연결은 계속 일반 장치 검사를 따릅니다. Serve 트래픽에도 명시적인 공유 시크릿 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

    해당 비동기 Serve 신원 경로에서는 동일한 클라이언트 IP와 인증 범위에 대한 실패한 인증 시도가 레이트 리밋 쓰기 전에 직렬화됩니다. 따라서 같은 브라우저에서 동시에 발생한 잘못된 재시도는 두 개의 일반 불일치가 병렬로 경쟁하는 대신 두 번째 요청에서 `retry later`를 표시할 수 있습니다.

    <Warning>
    토큰 없는 Serve 인증은 Gateway 호스트가 신뢰된다고 가정합니다. 신뢰할 수 없는 로컬 코드가 해당 호스트에서 실행될 수 있다면 토큰/비밀번호 인증을 요구하세요.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    그런 다음 엽니다.

    - `http://<tailscale-ip>:18789/` (또는 구성한 `gateway.controlUi.basePath`)

    일치하는 공유 시크릿을 UI 설정에 붙여넣으세요(`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

  </Tab>
</Tabs>

## 안전하지 않은 HTTP

일반 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 대시보드를 열면 브라우저가 **비보안 컨텍스트**에서 실행되어 WebCrypto를 차단합니다. 기본적으로 OpenClaw는 장치 신원이 없는 Control UI 연결을 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 사용한 localhost 전용 안전하지 않은 HTTP 호환성
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 운영자 Control UI 인증
- 비상용 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 수정:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 여세요.

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (Gateway 호스트에서)

<AccordionGroup>
  <Accordion title="Insecure-auth toggle behavior">
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

    - 비보안 HTTP 컨텍스트에서 localhost Control UI 세션이 장치 신원 없이 진행되도록 허용합니다.
    - 페어링 검사를 우회하지 않습니다.
    - 원격(non-localhost) 장치 신원 요구 사항을 완화하지 않습니다.

  </Accordion>
  <Accordion title="Break-glass only">
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
    `dangerouslyDisableDeviceAuth`는 Control UI 장치 신원 검사를 비활성화하며 심각한 보안 하향입니다. 긴급 사용 후 빠르게 되돌리세요.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 성공적인 trusted-proxy 인증은 장치 신원 없이 **운영자** Control UI 세션을 허용할 수 있습니다.
    - 이는 노드 역할 Control UI 세션으로 확장되지 **않습니다**.
    - 동일 호스트 loopback 리버스 프록시는 여전히 trusted-proxy 인증을 충족하지 않습니다. [Trusted proxy auth](/ko/gateway/trusted-proxy-auth)를 참조하세요.

  </Accordion>
</AccordionGroup>

HTTPS 설정 지침은 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## 콘텐츠 보안 정책

Control UI는 엄격한 `img-src` 정책과 함께 제공됩니다. **동일 출처** 자산, `data:` URL, 로컬에서 생성된 `blob:` URL만 허용됩니다. 원격 `http(s)` 및 프로토콜 상대 이미지 URL은 브라우저에서 거부되며 네트워크 가져오기를 발생시키지 않습니다.

실제로는 다음을 의미합니다.

- 상대 경로(예: `/avatars/<id>`) 아래에서 제공되는 아바타와 이미지는 계속 렌더링됩니다. 여기에는 UI가 가져와 로컬 `blob:` URL로 변환하는 인증된 아바타 경로도 포함됩니다.
- 인라인 `data:image/...` URL은 계속 렌더링됩니다(프로토콜 내 페이로드에 유용).
- Control UI가 생성한 로컬 `blob:` URL은 계속 렌더링됩니다.
- 채널 메타데이터가 내보내는 원격 아바타 URL은 Control UI의 아바타 헬퍼에서 제거되고 내장 로고/배지로 대체되므로, 손상되었거나 악의적인 채널이 운영자 브라우저에서 임의의 원격 이미지 가져오기를 강제할 수 없습니다.

이 동작을 얻기 위해 아무것도 변경할 필요가 없습니다. 항상 켜져 있으며 구성할 수 없습니다.

## 아바타 경로 인증

Gateway 인증이 구성되면 Control UI 아바타 엔드포인트는 API의 나머지 부분과 동일한 Gateway 토큰을 요구합니다.

- `GET /avatar/<agentId>`는 인증된 호출자에게만 아바타 이미지를 반환합니다. `GET /avatar/<agentId>?meta=1`은 동일한 규칙에 따라 아바타 메타데이터를 반환합니다.
- 두 경로 중 하나에 대한 인증되지 않은 요청은 거부됩니다(동일 계열 assistant-media 경로와 일치). 이렇게 하면 그 외에는 보호되는 호스트에서 아바타 경로가 에이전트 신원을 유출하는 것을 방지합니다.
- Control UI 자체는 아바타를 가져올 때 Gateway 토큰을 bearer 헤더로 전달하고, 인증된 blob URL을 사용하므로 이미지가 대시보드에서 계속 렌더링됩니다.

Gateway 인증을 비활성화하면(공유 호스트에서는 권장하지 않음) Gateway의 나머지 부분과 마찬가지로 아바타 경로도 인증 없이 접근 가능해집니다.

## 어시스턴트 미디어 경로 인증

Gateway 인증이 구성되면 어시스턴트 로컬 미디어 미리보기는 2단계 경로를 사용합니다.

- `GET /__openclaw__/assistant-media?meta=1&source=<path>`는 일반 Control UI 운영자 인증을 요구합니다. 브라우저는 가용성을 확인할 때 Gateway 토큰을 bearer 헤더로 보냅니다.
- 성공한 메타데이터 응답에는 정확히 해당 소스 경로로 범위가 제한된 짧은 수명의 `mediaTicket`이 포함됩니다.
- 브라우저에서 렌더링되는 이미지, 오디오, 비디오, 문서 URL은 활성 Gateway 토큰이나 비밀번호 대신 `mediaTicket=<ticket>`을 사용합니다. 티켓은 빠르게 만료되며 다른 소스를 승인할 수 없습니다.

이렇게 하면 재사용 가능한 Gateway 자격 증명을 보이는 미디어 URL에 넣지 않고도 일반 미디어 렌더링이 브라우저 네이티브 미디어 요소와 호환됩니다.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음으로 빌드하세요.

```bash
pnpm ui:build
```

선택적 절대 기준 경로(고정 자산 URL을 원하는 경우):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 개발 서버):

```bash
pnpm ui:dev
```

그런 다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키도록 하세요.

## 빈 Control UI 페이지

브라우저가 빈 대시보드를 로드하고 DevTools에 유용한 오류가 표시되지 않는다면, 확장 프로그램이나 초기 콘텐츠 스크립트가 JavaScript 모듈 앱 평가를 막았을 수 있습니다. 정적 페이지에는 시작 후 `<openclaw-app>`이 등록되지 않았을 때 나타나는 일반 HTML 복구 패널이 포함되어 있습니다.

브라우저 환경을 변경한 후 패널의 **다시 시도** 동작을 사용하거나, 다음 확인 후 수동으로 다시 로드하세요.

- 모든 페이지에 주입되는 확장 프로그램, 특히 `<all_urls>` 콘텐츠 스크립트가 있는 확장 프로그램을 비활성화합니다.
- 비공개 창, 깨끗한 브라우저 프로필, 또는 다른 브라우저를 시도합니다.
- Gateway를 계속 실행한 상태로 유지하고 브라우저 변경 후 동일한 대시보드 URL을 확인합니다.

## 디버깅/테스트: 개발 서버 + 원격 Gateway

Control UI는 정적 파일입니다. WebSocket 대상은 구성 가능하며 HTTP 출처와 다를 수 있습니다. 로컬에서 Vite 개발 서버를 사용하면서 Gateway는 다른 곳에서 실행하려는 경우 유용합니다.

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

    선택적 1회 인증(필요한 경우):

    ```text
    http://localhost:5173/?gatewayUrl=wss%3A%2F%2F<gateway-host>%3A18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes">
    - `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서 제거됩니다.
    - `gatewayUrl`을 통해 전체 `ws://` 또는 `wss://` 엔드포인트를 전달하는 경우, 브라우저가 쿼리 문자열을 올바르게 파싱하도록 `gatewayUrl` 값을 URL 인코딩하세요.
    - 가능하면 `token`은 URL 프래그먼트(`#token=...`)를 통해 전달해야 합니다. 프래그먼트는 서버로 전송되지 않으므로 요청 로그와 Referer 유출을 방지합니다. 레거시 `?token=` 쿼리 매개변수는 호환성을 위해 여전히 한 번 가져오지만, 폴백으로만 사용되며 bootstrap 직후 즉시 제거됩니다.
    - `password`는 메모리에만 보관됩니다.
    - `gatewayUrl`이 설정되면 UI는 구성이나 환경 자격 증명으로 폴백하지 않습니다. `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류입니다.
    - Gateway가 TLS 뒤에 있을 때(Tailscale Serve, HTTPS 프록시 등) `wss://`를 사용하세요.
    - `gatewayUrl`은 클릭재킹을 방지하기 위해 최상위 창(임베드되지 않은 창)에서만 허용됩니다.
    - 공개 비루프백 제어 UI 배포는 `gateway.controlUi.allowedOrigins`를 명시적으로 설정해야 합니다(전체 origin). 루프백, RFC1918/link-local, `.local`, `.ts.net` 또는 Tailscale CGNAT 호스트에서 로드되는 비공개 동일 origin LAN/Tailnet은 Host 헤더 폴백을 활성화하지 않아도 허용됩니다.
    - Gateway 시작 시 유효한 런타임 바인드와 포트에서 `http://localhost:<port>` 및 `http://127.0.0.1:<port>` 같은 로컬 origin을 시드할 수 있지만, 원격 브라우저 origin에는 여전히 명시적 항목이 필요합니다.
    - 엄격하게 제어되는 로컬 테스트를 제외하고 `gateway.controlUi.allowedOrigins: ["*"]`를 사용하지 마세요. 이는 모든 브라우저 origin을 허용한다는 뜻이지, "내가 사용하는 호스트와 일치"한다는 뜻이 아닙니다.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host 헤더 origin 폴백 모드를 활성화하지만, 위험한 보안 모드입니다.

  </Accordion>
</AccordionGroup>

예시:

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
