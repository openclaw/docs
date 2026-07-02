---
read_when:
    - 브라우저에서 Gateway를 운영하려는 경우
    - SSH 터널 없이 Tailnet 액세스를 원합니다
sidebarTitle: Control UI
summary: Gateway용 브라우저 기반 제어 UI(채팅, 활동, 노드, 설정)
title: Control UI
x-i18n:
    generated_at: "2026-07-02T00:49:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 643249e6857cc1a32302f5139fcf89d46e01127f741f31efd36db4a6c60ef7b7
    source_path: web/control-ui.md
    workflow: 16
---

Control UI는 Gateway에서 제공되는 작은 **Vite + Lit** 단일 페이지 앱입니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

동일한 포트에서 **Gateway WebSocket에 직접** 통신합니다.

## 빠른 열기(로컬)

Gateway가 같은 컴퓨터에서 실행 중이면 다음을 여세요.

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지가 로드되지 않으면 먼저 Gateway를 시작하세요: `openclaw gateway`.

<Note>
네이티브 Windows LAN 바인드에서는 Gateway 호스트에서 `127.0.0.1`이 작동하더라도 Windows 방화벽이나 조직에서 관리하는 그룹 정책이 광고된 LAN URL을 여전히 차단할 수 있습니다. Windows 호스트에서 `openclaw gateway status --deep`를 실행하세요. 차단되었을 가능성이 있는 포트, 프로필 불일치, 정책이 무시할 수 있는 로컬 방화벽 규칙을 보고합니다.
</Note>

인증은 WebSocket 핸드셰이크 중 다음을 통해 제공됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 신뢰할 수 있는 프록시 ID 헤더

대시보드 설정 패널은 현재 브라우저 탭 세션과 선택한 Gateway URL에 대한 토큰을 보관하며, 비밀번호는 유지하지 않습니다. 온보딩은 일반적으로 첫 연결 시 공유 비밀 인증을 위한 Gateway 토큰을 생성하지만, `gateway.auth.mode`가 `"password"`일 때는 비밀번호 인증도 작동합니다.

## 기기 페어링(첫 연결)

새 브라우저나 기기에서 Control UI에 연결하면 Gateway는 일반적으로 **일회성 페어링 승인**을 요구합니다. 이는 무단 접근을 방지하기 위한 보안 조치입니다.

**표시되는 내용:** "disconnected (1008): pairing required"

<Steps>
  <Step title="보류 중인 요청 나열">
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

브라우저가 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 재시도하면 이전 보류 요청은 대체되고 새 `requestId`가 생성됩니다. 승인하기 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 페어링되어 있고 읽기 접근 권한에서 쓰기/관리자 접근 권한으로 변경하면, 이는 조용한 재연결이 아니라 승인 업그레이드로 처리됩니다. OpenClaw는 기존 승인을 활성 상태로 유지하고, 더 넓은 범위의 재연결을 차단하며, 새 범위 세트를 명시적으로 승인하도록 요청합니다.

승인되면 기기가 기억되며, `openclaw devices revoke --device <id> --role <role>`로 해지하지 않는 한 재승인이 필요하지 않습니다. 토큰 순환과 해지는 [기기 CLI](/ko/cli/devices)를 참조하세요.

`openclaw_gateway` 어댑터를 통해 연결하는 Paperclip 에이전트도 동일한 최초 실행 승인 흐름을 사용합니다. 초기 연결 시도 후 `openclaw devices approve --latest`를 실행해 보류 중인 요청을 미리 본 다음, 출력된 `openclaw devices approve <requestId>` 명령을 다시 실행해 승인하세요. 원격 Gateway에는 명시적인 `--url` 및 `--token` 값을 전달하세요. 재시작 후에도 승인을 안정적으로 유지하려면 실행할 때마다 새 임시 기기 ID를 생성하게 두는 대신 Paperclip에서 영구 `adapterConfig.devicePrivateKeyPem`을 구성하세요.

<Note>
- 직접 local loopback 브라우저 연결(`127.0.0.1` / `localhost`)은 자동 승인됩니다.
- Tailscale Serve는 `gateway.auth.allowTailscale: true`이고, Tailscale ID가 확인되며, 브라우저가 기기 ID를 제시할 때 Control UI 운영자 세션의 페어링 왕복을 건너뛸 수 있습니다.
- 직접 Tailnet 바인드, LAN 브라우저 연결, 기기 ID가 없는 브라우저 프로필은 여전히 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 기기 ID를 생성하므로 브라우저를 바꾸거나 브라우저 데이터를 지우면 다시 페어링해야 합니다.

</Note>

## 개인 ID(브라우저 로컬)

Control UI는 공유 세션에서 귀속 표시를 위해 보내는 메시지에 첨부되는 브라우저별 개인 ID(표시 이름과 아바타)를 지원합니다. 이는 브라우저 저장소에 있으며 현재 브라우저 프로필로 범위가 제한되고, 실제로 보낸 메시지의 일반적인 transcript 작성자 메타데이터를 제외하고는 다른 기기와 동기화되거나 서버 측에 유지되지 않습니다. 사이트 데이터를 지우거나 브라우저를 바꾸면 비어 있는 상태로 재설정됩니다.

동일한 브라우저 로컬 패턴이 어시스턴트 아바타 재정의에도 적용됩니다. 업로드된 어시스턴트 아바타는 로컬 브라우저에서만 Gateway가 확인한 ID 위에 오버레이되며 `config.patch`를 통해 왕복하지 않습니다. 공유 `ui.assistant.avatar` 구성 필드는 스크립트형 Gateway나 사용자 지정 대시보드처럼 해당 필드를 직접 쓰는 비 UI 클라이언트에서도 계속 사용할 수 있습니다.

## 런타임 구성 엔드포인트

Control UI는 Gateway의 Control UI 기본 경로를 기준으로 확인되는 `/control-ui-config.json`에서 런타임 설정을 가져옵니다(예: UI가 `/__openclaw__/` 아래에서 제공될 때 `/__openclaw__/control-ui-config.json`). 해당 엔드포인트는 나머지 HTTP 표면과 동일한 Gateway 인증으로 보호됩니다. 인증되지 않은 브라우저는 이를 가져올 수 없으며, 성공적으로 가져오려면 이미 유효한 Gateway 토큰/비밀번호, Tailscale Serve ID 또는 신뢰할 수 있는 프록시 ID 중 하나가 필요합니다.

## 언어 지원

Control UI는 첫 로드 시 브라우저 로캘에 따라 자체 로컬라이즈할 수 있습니다. 나중에 재정의하려면 **개요 -> Gateway 접근 -> 언어**를 여세요. 로캘 선택기는 Appearance 아래가 아니라 Gateway Access 카드에 있습니다.

- 지원 로캘: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 영어가 아닌 번역은 브라우저에서 지연 로드됩니다.
- 선택한 로캘은 브라우저 저장소에 저장되어 이후 방문 시 재사용됩니다.
- 누락된 번역 키는 영어로 대체됩니다.

Docs 번역은 동일한 영어 외 로캘 세트에 대해 생성되지만, docs 사이트에 내장된 Mintlify 언어 선택기는 Mintlify가 허용하는 로캘 코드로 제한됩니다. 태국어(`th`)와 페르시아어(`fa`) docs는 게시 저장소에 계속 생성되지만, Mintlify가 해당 코드를 지원할 때까지 해당 선택기에 표시되지 않을 수 있습니다.

## Appearance 테마

Appearance 패널은 기본 제공 Claw, Knot, Dash 테마와 브라우저 로컬 tweakcn 가져오기 슬롯 하나를 유지합니다. 테마를 가져오려면 [tweakcn editor](https://tweakcn.com/editor/theme)를 열고, 테마를 선택하거나 만든 다음, **Share**를 클릭하고 복사된 테마 링크를 Appearance에 붙여넣으세요. 가져오기 도구는 `https://tweakcn.com/r/themes/<id>` 레지스트리 URL, `https://tweakcn.com/editor/theme?theme=amethyst-haze` 같은 에디터 URL, 상대 `/themes/<id>` 경로, 원시 테마 ID, `amethyst-haze` 같은 기본 테마 이름도 허용합니다.

Appearance에는 브라우저 로컬 텍스트 크기 설정도 포함됩니다. 이 설정은 나머지 Control UI 기본 설정과 함께 저장되고, 채팅 텍스트, 작성기 텍스트, 도구 카드, 채팅 사이드바에 적용되며, 모바일 Safari가 포커스 시 자동 확대하지 않도록 텍스트 입력을 최소 16px로 유지합니다.

가져온 테마는 현재 브라우저 프로필에만 저장됩니다. Gateway 구성에 기록되지 않으며 기기 간 동기화되지 않습니다. 가져온 테마를 교체하면 하나의 로컬 슬롯이 업데이트됩니다. 이를 지우면 가져온 테마가 선택되어 있던 경우 활성 테마가 Claw로 다시 전환됩니다.

## 할 수 있는 일(현재)

<AccordionGroup>
  <Accordion title="채팅 및 대화">
    - Gateway WS(`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)를 통해 모델과 채팅합니다.
    - 채팅 기록 새로고침은 메시지별 텍스트 제한이 있는 제한된 최근 창을 요청하므로, 큰 세션이 채팅을 사용할 수 있게 되기 전에 브라우저가 전체 transcript 페이로드를 렌더링하도록 강제하지 않습니다.
    - 브라우저 실시간 세션을 통해 대화합니다. OpenAI는 직접 WebRTC를 사용하고, Google Live는 WebSocket을 통한 제한된 일회용 브라우저 토큰을 사용하며, 백엔드 전용 실시간 음성 Plugin은 Gateway 릴레이 전송을 사용합니다. 클라이언트 소유 provider 세션은 `talk.client.create`로 시작하고, Gateway 릴레이 세션은 `talk.session.create`로 시작합니다. 릴레이는 provider 자격 증명을 Gateway에 보관하면서 브라우저가 `talk.session.appendAudio`를 통해 마이크 PCM을 스트리밍하고, Gateway 정책과 더 크게 구성된 OpenClaw 모델을 위해 `openclaw_agent_consult` provider 도구 호출을 `talk.client.toolCall`을 통해 전달하며, 활성 실행 음성 조종을 `talk.client.steer` 또는 `talk.session.steer`를 통해 라우팅합니다.
    - 채팅에서 도구 호출과 실시간 도구 출력 카드를 스트리밍합니다(에이전트 이벤트).
    - 기존 `session.tool` / 도구 이벤트 전달에서 실시간 도구 활동에 대한 브라우저 로컬, 편집 우선 요약을 제공하는 Activity 탭입니다.

  </Accordion>
  <Accordion title="채널, 인스턴스, 세션, 꿈">
    - 채널: 기본 제공 및 번들/외부 Plugin 채널 상태, QR 로그인, 채널별 구성(`channels.status`, `web.login.*`, `config.patch`).
    - 채널 프로브 새로고침은 느린 provider 검사가 완료되는 동안 이전 스냅샷을 계속 표시하며, 프로브나 감사가 UI 예산을 초과하면 부분 스냅샷에 레이블이 지정됩니다.
    - 인스턴스: presence 목록 + 새로고침(`system-presence`).
    - 세션: 기본적으로 구성된 에이전트 세션을 나열하고, 오래된 구성되지 않은 에이전트 세션 키에서 대체하며, 세션별 모델/thinking/fast/verbose/trace/reasoning 재정의를 적용합니다(`sessions.list`, `sessions.patch`).
    - 꿈: Dreaming 상태, 활성화/비활성화 토글, Dream Diary 리더(`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, Skills, Node, 실행 승인">
    - Cron 작업: 나열/추가/편집/실행/활성화/비활성화 + 실행 기록(`cron.*`).
    - Skills: 상태, 활성화/비활성화, 설치, API 키 업데이트(`skills.*`).
    - Node: 목록 + 한도(`node.list`).
    - 실행 승인: Gateway 또는 Node 허용 목록 편집 + `exec host=gateway/node`에 대한 요청 정책(`exec.approvals.*`).

  </Accordion>
  <Accordion title="구성">
    - `~/.openclaw/openclaw.json` 보기/편집(`config.get`, `config.set`).
    - MCP에는 구성된 서버, 활성화, OAuth/필터/병렬 요약, 일반 운영자 명령, 범위가 지정된 `mcp` 구성 편집기를 위한 전용 설정 페이지가 있습니다.
    - 검증과 함께 적용 + 재시작(`config.apply`)하고 마지막 활성 세션을 깨웁니다.
    - 쓰기에는 동시 편집을 덮어쓰지 않도록 base-hash 보호가 포함됩니다.
    - 쓰기(`config.set`/`config.apply`/`config.patch`)는 제출된 구성 페이로드의 refs에 대해 활성 SecretRef 확인을 사전 점검합니다. 확인되지 않은 활성 제출 refs는 쓰기 전에 거부됩니다.
    - 양식 저장은 저장된 비밀에 계속 매핑되는 편집된 값을 보존하면서, 저장된 구성에서 복원할 수 없는 오래된 편집된 placeholder를 폐기합니다.
    - 스키마 + 양식 렌더링(`config.schema` / `config.schema.lookup`, 필드 `title` / `description`, 일치하는 UI 힌트, 즉시 하위 요약, 중첩 객체/와일드카드/배열/컴포지션 노드의 docs 메타데이터, 사용 가능한 경우 Plugin + 채널 스키마 포함). Raw JSON 편집기는 스냅샷에 안전한 원시 왕복이 있을 때만 사용할 수 있습니다.
    - 스냅샷이 원시 텍스트를 안전하게 왕복할 수 없으면 Control UI는 해당 스냅샷에 대해 Form 모드를 강제하고 Raw 모드를 비활성화합니다.
    - Raw JSON 편집기 "저장된 상태로 재설정"은 평면화된 스냅샷을 다시 렌더링하는 대신 원시 작성 형태(서식, 주석, `$include` 레이아웃)를 보존하므로, 스냅샷이 안전하게 왕복할 수 있을 때 외부 편집 내용이 재설정 후에도 유지됩니다.
    - 구조화된 SecretRef 객체 값은 실수로 객체가 문자열로 손상되는 것을 방지하기 위해 양식 텍스트 입력에서 읽기 전용으로 렌더링됩니다.

  </Accordion>
  <Accordion title="디버그, 로그, 업데이트">
    - 디버그: 상태/상태 점검/모델 스냅샷 + 이벤트 로그 + 수동 RPC 호출(`status`, `health`, `models.list`).
    - 이벤트 로그에는 Control UI 새로고침/RPC 타이밍, 느린 채팅/구성 렌더링 타이밍, 브라우저가 해당 PerformanceObserver 항목 유형을 노출할 때 긴 애니메이션 프레임 또는 긴 작업에 대한 브라우저 응답성 항목이 포함됩니다.
    - 로그: 필터/내보내기가 있는 Gateway 파일 로그의 실시간 tail(`logs.tail`).
    - 업데이트: 재시작 보고서와 함께 패키지/git 업데이트 + 재시작(`update.run`)을 실행한 다음, 재연결 후 `update.status`를 폴링하여 실행 중인 Gateway 버전을 확인합니다.

  </Accordion>
  <Accordion title="Cron 작업 패널 참고 사항">
    - 격리된 작업의 경우 전달 기본값은 요약 알림입니다. 내부 전용 실행을 원하면 없음으로 전환할 수 있습니다.
    - 알림이 선택되면 채널/대상 필드가 표시됩니다.
    - Webhook 모드는 `delivery.to`가 유효한 HTTP(S) Webhook URL로 설정된 상태에서 `delivery.mode = "webhook"`을 사용합니다.
    - 기본 세션 작업의 경우 Webhook 및 없음 전달 모드를 사용할 수 있습니다.
    - 고급 편집 컨트롤에는 실행 후 삭제, 에이전트 재정의 지우기, Cron exact/stagger 옵션, 에이전트 모델/추론 재정의, 최선 노력 전달 토글이 포함됩니다.
    - 양식 검증은 필드 수준 오류와 함께 인라인으로 표시되며, 잘못된 값은 수정될 때까지 저장 버튼을 비활성화합니다.
    - 전용 bearer token을 보내려면 `cron.webhookToken`을 설정하세요. 생략하면 Webhook은 인증 헤더 없이 전송됩니다.
    - 사용 중단된 fallback: `openclaw doctor --fix`를 실행하여 `notify: true`가 포함된 저장된 레거시 작업을 `cron.webhook`에서 명시적인 작업별 Webhook 또는 완료 전달로 마이그레이션하세요.

  </Accordion>
</AccordionGroup>

## MCP 페이지

전용 MCP 페이지는 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버를 위한 운영자 보기입니다. 이 페이지는 MCP transport를 직접 시작하지 않습니다. 저장된 config를 검사하고 편집하는 데 사용한 다음, 라이브 서버 proof가 필요할 때 `openclaw mcp doctor --probe`를 사용하세요.

일반적인 워크플로:

1. 사이드바에서 **MCP**를 엽니다.
2. 요약 카드에서 총 서버 수, 활성화됨, OAuth, 필터링된 서버 수를 확인합니다.
3. 각 서버 행에서 transport, 활성화 상태, auth, 필터, timeout, command hint를 검토합니다.
4. 서버가 구성된 상태로 유지되어야 하지만 runtime discovery에서는 제외되어야 할 때 활성화 상태를 토글합니다.
5. 서버 정의, header, TLS/mTLS 경로, OAuth metadata, tool filter, Codex projection metadata를 위해 범위가 지정된 `mcp` config 섹션을 편집합니다.
6. config 쓰기에는 **저장**을 사용하고, 실행 중인 Gateway가 변경된 config를 적용해야 할 때는 **저장 및 게시**를 사용합니다.
7. 편집된 프로세스에 static diagnostics, live proof 또는 cached-runtime disposal이 필요할 때 terminal에서 `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` 또는 `openclaw mcp reload`를 실행합니다.

이 페이지는 credential이 포함된 URL 유사 값을 렌더링하기 전에 redaction하고, command snippet에서 서버 이름을 따옴표로 감싸므로 복사한 command가 공백이나 shell metacharacter가 있어도 계속 작동합니다. 전체 CLI 및 config reference는 [MCP](/ko/cli/mcp)에 있습니다.

## 활동 탭

활동 탭은 라이브 tool activity를 위한 임시 browser-local observer입니다. Chat tool card를 구동하는 것과 동일한 Gateway `session.tool` / tool event stream에서 파생됩니다. 별도의 Gateway event family, endpoint, durable activity store, metrics feed 또는 external observer stream을 추가하지 않습니다.

활동 항목은 sanitized summary와 redacted, truncated output preview만 유지합니다. Tool argument 값은 Activity state에 저장되지 않습니다. UI는 argument가 숨겨져 있음을 표시하고 argument field count만 기록합니다. In-memory list는 현재 browser tab을 따르며, Control UI 내 탐색 중에는 유지되고 page reload, session switch 또는 **Clear** 시 reset됩니다.

## Chat 동작

<AccordionGroup>
  <Accordion title="전송 및 기록 의미론">
    - `chat.send`는 **non-blocking**입니다. `{ runId, status: "started" }`로 즉시 ack하고 response는 `chat` event를 통해 stream됩니다. 신뢰할 수 있는 Control UI client는 local diagnostics를 위해 선택적 ACK timing metadata도 받을 수 있습니다.
    - Chat upload는 이미지와 비디오가 아닌 file을 허용합니다. 이미지는 native image path를 유지하고, 다른 file은 managed media로 저장되어 history에 attachment link로 표시됩니다.
    - 동일한 `idempotencyKey`로 다시 전송하면 실행 중에는 `{ status: "in_flight" }`를 반환하고, 완료 후에는 `{ status: "ok" }`를 반환합니다.
    - `chat.history` response는 UI 안전을 위해 size-bounded입니다. transcript entry가 너무 크면 Gateway는 긴 text field를 truncate하고, 무거운 metadata block을 생략하며, oversized message를 placeholder(`[chat.history omitted: message too large]`)로 대체할 수 있습니다.
    - `chat.history`에서 표시되는 assistant message가 truncate된 경우, side reader는 필요 시 `sessionKey`, 필요한 경우 active `agentId`, transcript `messageId`를 통해 `chat.message.get`으로 전체 display-normalized transcript entry를 가져올 수 있습니다. Gateway가 여전히 더 많은 내용을 반환할 수 없으면 reader는 truncate된 preview를 조용히 반복하는 대신 명시적인 unavailable state를 표시합니다.
    - Assistant/generated image는 managed media reference로 persisted되고 authenticated Gateway media URL을 통해 다시 제공되므로, reload가 raw base64 image payload가 chat history response에 남아 있는 것에 의존하지 않습니다.
    - `chat.history`를 렌더링할 때 Control UI는 표시되는 assistant text에서 display-only inline directive tag(예: `[[reply_to_*]]` 및 `[[audio_as_voice]]`), plain-text tool-call XML payload(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` 및 truncate된 tool-call block 포함), leaked ASCII/full-width model control token을 제거하고, 전체 visible text가 정확한 silent token `NO_REPLY` / `no_reply` 또는 heartbeat acknowledgement token `HEARTBEAT_OK`뿐인 assistant entry는 생략합니다.
    - active send 중 및 최종 history refresh 중에, `chat.history`가 잠시 오래된 snapshot을 반환하면 chat view는 local optimistic user/assistant message를 계속 표시합니다. Gateway history가 따라잡으면 canonical transcript가 해당 local message를 대체합니다.
    - 라이브 `chat` event는 delivery state이고, `chat.history`는 durable session transcript에서 rebuild됩니다. tool-final event 이후 Control UI는 history를 reload하고 작은 optimistic tail만 merge합니다. transcript boundary는 [WebChat](/ko/web/webchat)에 문서화되어 있습니다.
    - `chat.inject`는 assistant note를 session transcript에 append하고 UI 전용 update를 위해 `chat` event를 broadcast합니다(agent run 없음, channel delivery 없음).
    - chat header는 session picker 앞에 agent filter를 표시하며, session picker는 selected agent로 scope됩니다. agent를 전환하면 해당 agent에 연결된 session만 표시되고, 아직 저장된 dashboard session이 없으면 해당 agent의 main session으로 fallback됩니다.
    - desktop width에서는 chat control이 compact row 하나에 유지되고 transcript 아래로 scroll할 때 collapse됩니다. 위로 scroll하거나, top으로 돌아가거나, bottom에 도달하면 control이 restore됩니다.
    - 연속된 duplicate text-only message는 count badge가 있는 하나의 bubble로 render됩니다. image, attachment, tool output 또는 canvas preview를 포함한 message는 collapse되지 않습니다.
    - chat header model 및 thinking picker는 `sessions.patch`를 통해 active session을 즉시 patch합니다. 이는 persistent session override이며 one-turn-only send option이 아닙니다.
    - 동일한 session의 model picker 변경이 아직 저장 중일 때 message를 보내면, composer는 `chat.send`를 호출하기 전에 해당 session patch를 기다려 send가 selected model을 사용하도록 합니다.
    - Control UI에서 `/new`를 입력하면 New Chat과 동일한 fresh dashboard session을 만들고 전환합니다. 단, `session.dmScope: "main"`이 구성되어 있고 current parent가 agent의 main session인 경우에는 main session을 제자리에서 reset합니다. `/reset`을 입력하면 current session에 대해 Gateway의 명시적인 in-place reset을 유지합니다.
    - chat model picker는 Gateway의 configured model view를 요청합니다. `agents.defaults.models`가 있으면 해당 allowlist가 picker를 구동하며, provider-scoped catalog를 dynamic하게 유지하는 `provider/*` entry도 포함합니다. 그렇지 않으면 picker는 명시적인 `models.providers.*.models` entry와 usable auth가 있는 provider를 표시합니다. 전체 catalog는 debug `models.list` RPC에서 `view: "all"`로 계속 사용할 수 있습니다.
    - fresh Gateway session usage report에 current context token이 포함되면 chat composer area에 compact context usage indicator가 표시됩니다. high context pressure에서는 warning styling으로 전환되고, recommended compaction level에서는 normal session compaction path를 실행하는 compact button이 표시됩니다. stale token snapshot은 Gateway가 fresh usage를 다시 report할 때까지 숨겨집니다.

  </Accordion>
  <Accordion title="Talk 모드(browser realtime)">
    Talk 모드는 registered realtime voice provider를 사용합니다. OpenAI는 `talk.realtime.provider: "openai"`와 `openai` API-key auth profile, `talk.realtime.providers.openai.apiKey` 또는 `OPENAI_API_KEY`로 구성하세요. OpenAI OAuth profile은 Realtime voice를 구성하지 않습니다. Google은 `talk.realtime.provider: "google"`과 `talk.realtime.providers.google.apiKey`로 구성하세요. browser는 standard provider API key를 절대 받지 않습니다. OpenAI는 WebRTC용 ephemeral Realtime client secret을 받습니다. Google Live는 browser WebSocket session을 위한 one-use constrained Live API auth token을 받으며, instruction과 tool declaration은 Gateway에 의해 token에 고정됩니다. backend realtime bridge만 노출하는 provider는 Gateway relay transport를 통해 실행되므로 credential과 vendor socket은 server-side에 남고 browser audio는 authenticated Gateway RPC를 통해 이동합니다. Realtime session prompt는 Gateway가 assemble합니다. `talk.client.create`는 caller-provided instruction override를 허용하지 않습니다.

    Chat composer에는 Talk start/stop button 옆에 Talk option button이 포함됩니다. 이 option은 다음 Talk session에 적용되며 provider, transport, model, voice, reasoning effort, VAD threshold, silence duration, prefix padding을 override할 수 있습니다. option이 비어 있으면 Gateway는 사용 가능한 configured default 또는 provider default를 사용합니다. Gateway relay를 선택하면 backend relay path가 강제됩니다. WebRTC를 선택하면 session은 client-owned로 유지되며, provider가 browser session을 만들 수 없을 때 relay로 조용히 fallback하지 않고 실패합니다.

    Chat composer에서 Talk control은 microphone dictation button 옆의 waves button입니다. Talk가 시작되면 composer status row에 `Connecting Talk...`가 표시된 뒤 audio가 연결되면 `Talk live`, realtime tool call이 `talk.client.toolCall`을 통해 configured larger model에 문의하는 동안에는 `Asking OpenClaw...`가 표시됩니다.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`는 OpenAI backend WebSocket bridge, OpenAI browser WebRTC SDP exchange, Google Live constrained-token browser WebSocket setup, fake microphone media를 사용하는 Gateway relay browser adapter를 검증합니다. 이 command는 provider status만 출력하며 secret을 log하지 않습니다.

  </Accordion>
  <Accordion title="중지 및 중단">
    - **중지**를 클릭합니다(`chat.abort` 호출).
    - run이 active인 동안 normal follow-up은 queue됩니다. queued message에서 **Steer**를 클릭하여 해당 follow-up을 running turn에 inject합니다.
    - `/stop`을 입력하거나 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 standalone abort phrase를 입력하여 out-of-band로 abort합니다.
    - `chat.abort`는 해당 session의 모든 active run을 abort하기 위해 `{ sessionKey }`(`runId` 없음)를 지원합니다.

  </Accordion>
  <Accordion title="중단 partial 유지">
    - run이 abort되면 partial assistant text가 UI에 계속 표시될 수 있습니다.
    - Gateway는 buffered output이 있을 때 aborted partial assistant text를 transcript history에 persist합니다.
    - persisted entry에는 abort metadata가 포함되어 transcript consumer가 abort partial과 normal completion output을 구분할 수 있습니다.

  </Accordion>
</AccordionGroup>

## PWA 설치 및 web push

Control UI는 `manifest.webmanifest`와 service worker를 제공하므로 modern browser에서 standalone PWA로 설치할 수 있습니다. Web Push를 사용하면 tab이나 browser window가 열려 있지 않아도 Gateway가 notification으로 installed PWA를 깨울 수 있습니다.

OpenClaw update 직후 page에 **Protocol mismatch**가 표시되면 먼저 `openclaw dashboard`로 dashboard를 다시 열고 page를 hard-refresh하세요. 그래도 실패하면 dashboard origin의 site data를 clear하거나 private browser window에서 test하세요. 오래된 tab이나 browser service-worker cache가 newer Gateway에 대해 pre-update Control UI bundle을 계속 실행할 수 있습니다.

| Surface                                               | 수행하는 작업                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA 매니페스트입니다. 접근 가능해지면 브라우저가 "앱 설치"를 제공합니다.   |
| `ui/public/sw.js`                                     | `push` 이벤트와 알림 클릭을 처리하는 서비스 워커입니다. |
| `push/vapid-keys.json` (OpenClaw 상태 디렉터리 아래) | Web Push 페이로드 서명에 사용되는 자동 생성 VAPID 키 쌍입니다.       |
| `push/web-push-subscriptions.json`                    | 저장된 브라우저 구독 엔드포인트입니다.                          |

키를 고정하려는 경우(다중 호스트 배포, 시크릿 교체, 테스트 등) Gateway 프로세스의 환경 변수를 통해 VAPID 키 쌍을 재정의하세요.

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (기본값은 `https://openclaw.ai`)

Control UI는 브라우저 구독을 등록하고 테스트하기 위해 다음 범위 제한 Gateway 메서드를 사용합니다.

- `push.web.vapidPublicKey` — 활성 VAPID 공개 키를 가져옵니다.
- `push.web.subscribe` — `endpoint`와 `keys.p256dh`/`keys.auth`를 등록합니다.
- `push.web.unsubscribe` — 등록된 엔드포인트를 제거합니다.
- `push.web.test` — 호출자의 구독으로 테스트 알림을 보냅니다.

<Note>
Web Push는 iOS APNS 릴레이 경로(릴레이 기반 푸시는 [구성](/ko/gateway/configuration) 참조) 및 기존 `push.test` 메서드와 독립적이며, 이들은 네이티브 모바일 페어링을 대상으로 합니다.
</Note>

## 호스팅된 임베드

Assistant 메시지는 `[embed ...]` 쇼트코드로 호스팅된 웹 콘텐츠를 인라인 렌더링할 수 있습니다. iframe 샌드박스 정책은 `gateway.controlUi.embedSandbox`로 제어합니다.

<Tabs>
  <Tab title="strict">
    호스팅된 임베드 내부의 스크립트 실행을 비활성화합니다.
  </Tab>
  <Tab title="scripts (default)">
    오리진 격리는 유지하면서 대화형 임베드를 허용합니다. 이것이 기본값이며, 보통 독립 실행형 브라우저 게임/위젯에 충분합니다.
  </Tab>
  <Tab title="trusted">
    의도적으로 더 강한 권한이 필요한 동일 사이트 문서에 대해 `allow-scripts` 위에 `allow-same-origin`을 추가합니다.
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
임베드된 문서에 실제로 same-origin 동작이 필요할 때만 `trusted`를 사용하세요. 대부분의 에이전트 생성 게임과 대화형 캔버스에는 `scripts`가 더 안전한 선택입니다.
</Warning>

절대 외부 `http(s)` 임베드 URL은 기본적으로 계속 차단됩니다. 의도적으로 `[embed url="https://..."]`가 서드파티 페이지를 로드하도록 하려면 `gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## 채팅 메시지 너비

그룹화된 채팅 메시지는 읽기 쉬운 기본 최대 너비를 사용합니다. 와이드 모니터 배포에서는 번들 CSS를 패치하지 않고 `gateway.controlUi.chatMessageMaxWidth`를 설정해 이를 재정의할 수 있습니다.

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

이 값은 브라우저에 도달하기 전에 검증됩니다. 지원되는 값에는 `960px` 또는 `82%` 같은 일반 길이와 퍼센트, 그리고 제한된 `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, `fit-content(...)` 너비 표현식이 포함됩니다.

## tailnet 접근(권장)

<Tabs>
  <Tab title="Integrated Tailscale Serve (preferred)">
    Gateway를 loopback에 유지하고 Tailscale Serve가 HTTPS로 프록시하게 하세요.

    ```bash
    openclaw gateway --tailscale serve
    ```

    열기:

    - `https://<magicdns>/` (또는 구성한 `gateway.controlUi.basePath`)

    기본적으로 `gateway.auth.allowTailscale`이 `true`이면 Control UI/WebSocket Serve 요청은 Tailscale ID 헤더(`tailscale-user-login`)로 인증할 수 있습니다. OpenClaw는 `tailscale whois`로 `x-forwarded-for` 주소를 확인하고 이를 헤더와 대조해 ID를 검증하며, 요청이 loopback에 도달하고 Tailscale의 `x-forwarded-*` 헤더가 있을 때만 이를 허용합니다. 브라우저 디바이스 ID가 있는 Control UI 운영자 세션에서는 이 검증된 Serve 경로가 디바이스 페어링 왕복도 건너뜁니다. 디바이스가 없는 브라우저와 node-role 연결은 계속 일반 디바이스 검사를 따릅니다. Serve 트래픽에도 명시적인 공유 시크릿 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

    해당 비동기 Serve ID 경로에서는 동일한 클라이언트 IP 및 인증 범위에 대한 실패한 인증 시도가 rate-limit 쓰기 전에 직렬화됩니다. 따라서 같은 브라우저에서 동시에 나쁜 재시도가 들어오면 두 일반 불일치가 병렬로 경쟁하는 대신 두 번째 요청에 `retry later`가 표시될 수 있습니다.

    <Warning>
    토큰 없는 Serve 인증은 gateway 호스트가 신뢰된다고 가정합니다. 신뢰할 수 없는 로컬 코드가 해당 호스트에서 실행될 수 있다면 토큰/비밀번호 인증을 요구하세요.
    </Warning>

  </Tab>
  <Tab title="Bind to tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    그런 다음 열기:

    - `http://<tailscale-ip>:18789/` (또는 구성한 `gateway.controlUi.basePath`)

    일치하는 공유 시크릿을 UI 설정에 붙여넣으세요(`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

  </Tab>
</Tabs>

## 안전하지 않은 HTTP

일반 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 대시보드를 열면 브라우저는 **비보안 컨텍스트**에서 실행되고 WebCrypto를 차단합니다. 기본적으로 OpenClaw는 디바이스 ID가 없는 Control UI 연결을 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 사용한 localhost 전용 안전하지 않은 HTTP 호환성
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 운영자 Control UI 인증
- 긴급용 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 수정:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 여세요.

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway 호스트에서)

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

    - 비보안 HTTP 컨텍스트에서 localhost Control UI 세션이 디바이스 ID 없이 진행되도록 허용합니다.
    - 페어링 검사를 우회하지 않습니다.
    - 원격(non-localhost) 디바이스 ID 요구 사항을 완화하지 않습니다.

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
    `dangerouslyDisableDeviceAuth`는 Control UI 디바이스 ID 검사를 비활성화하며 심각한 보안 수준 저하입니다. 긴급 사용 후 빠르게 되돌리세요.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 성공적인 trusted-proxy 인증은 디바이스 ID 없이 **운영자** Control UI 세션을 허용할 수 있습니다.
    - 이는 node-role Control UI 세션에는 확장되지 **않습니다**.
    - 같은 호스트의 loopback 리버스 프록시는 여전히 trusted-proxy 인증을 충족하지 않습니다. [Trusted proxy auth](/ko/gateway/trusted-proxy-auth)를 참조하세요.

  </Accordion>
</AccordionGroup>

HTTPS 설정 안내는 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## 콘텐츠 보안 정책

Control UI는 엄격한 `img-src` 정책과 함께 제공됩니다. **same-origin** 자산, `data:` URL, 로컬에서 생성된 `blob:` URL만 허용됩니다. 원격 `http(s)` 및 프로토콜 상대 이미지 URL은 브라우저에서 거부되며 네트워크 가져오기를 실행하지 않습니다.

실제로 의미하는 바:

- 상대 경로 아래에서 제공되는 아바타와 이미지(예: `/avatars/<id>`)는 계속 렌더링되며, UI가 가져와 로컬 `blob:` URL로 변환하는 인증된 아바타 경로도 포함됩니다.
- 인라인 `data:image/...` URL은 계속 렌더링됩니다(프로토콜 내부 페이로드에 유용).
- Control UI가 생성한 로컬 `blob:` URL은 계속 렌더링됩니다.
- 채널 메타데이터가 내보낸 원격 아바타 URL은 Control UI의 아바타 헬퍼에서 제거되고 내장 로고/배지로 대체되므로, 손상되었거나 악의적인 채널이 운영자 브라우저에서 임의의 원격 이미지 가져오기를 강제할 수 없습니다.

이 동작을 얻기 위해 아무것도 변경할 필요가 없습니다. 항상 켜져 있으며 구성할 수 없습니다.

## 아바타 경로 인증

gateway 인증이 구성된 경우 Control UI 아바타 엔드포인트는 API의 나머지 부분과 동일한 gateway 토큰을 요구합니다.

- `GET /avatar/<agentId>`는 인증된 호출자에게만 아바타 이미지를 반환합니다. `GET /avatar/<agentId>?meta=1`은 같은 규칙 아래 아바타 메타데이터를 반환합니다.
- 두 경로에 대한 인증되지 않은 요청은 거부됩니다(형제 assistant-media 경로와 일치). 이를 통해 다른 방식으로 보호되는 호스트에서 아바타 경로가 에이전트 ID를 유출하는 것을 방지합니다.
- Control UI 자체는 아바타를 가져올 때 gateway 토큰을 bearer 헤더로 전달하고, 인증된 blob URL을 사용해 이미지가 대시보드에서 계속 렌더링되도록 합니다.

gateway 인증을 비활성화하면(공유 호스트에서는 권장하지 않음) gateway의 나머지 부분과 마찬가지로 아바타 경로도 인증 없이 접근 가능해집니다.

## Assistant 미디어 경로 인증

gateway 인증이 구성된 경우 assistant 로컬 미디어 미리보기는 2단계 경로를 사용합니다.

- `GET /__openclaw__/assistant-media?meta=1&source=<path>`는 일반 Control UI 운영자 인증을 요구합니다. 브라우저는 가용성을 확인할 때 gateway 토큰을 bearer 헤더로 보냅니다.
- 성공적인 메타데이터 응답에는 해당 정확한 소스 경로로 범위가 제한된 짧은 수명의 `mediaTicket`이 포함됩니다.
- 브라우저에서 렌더링되는 이미지, 오디오, 비디오, 문서 URL은 활성 gateway 토큰이나 비밀번호 대신 `mediaTicket=<ticket>`을 사용합니다. 티켓은 빠르게 만료되며 다른 소스를 권한 부여할 수 없습니다.

이를 통해 재사용 가능한 gateway 자격 증명을 보이는 미디어 URL에 넣지 않고도 일반 미디어 렌더링이 브라우저 네이티브 미디어 요소와 호환되도록 유지합니다.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음으로 빌드하세요.

```bash
pnpm ui:build
```

선택적 절대 base(고정 자산 URL을 원하는 경우):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 개발 서버):

```bash
pnpm ui:dev
```

그런 다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키도록 하세요.

## 빈 Control UI 페이지

브라우저가 빈 대시보드를 로드하고 DevTools에 유용한 오류가 표시되지 않는다면, 확장 프로그램이나 초기 콘텐츠 스크립트가 JavaScript 모듈 앱의 평가를 막았을 수 있습니다. 정적 페이지에는 시작 후 `<openclaw-app>`이 등록되지 않았을 때 표시되는 일반 HTML 복구 패널이 포함되어 있습니다.

브라우저 환경을 변경한 후 패널의 **다시 시도** 작업을 사용하거나, 다음 확인 후 수동으로 새로고침하세요.

- 모든 페이지에 주입되는 확장 프로그램, 특히 `<all_urls>` 콘텐츠 스크립트가 있는 확장 프로그램을 비활성화하세요.
- 비공개 창, 깨끗한 브라우저 프로필, 또는 다른 브라우저를 시도하세요.
- Gateway를 계속 실행한 상태로 유지하고 브라우저 변경 후 같은 대시보드 URL을 확인하세요.

## 디버깅/테스트: 개발 서버 + 원격 Gateway

Control UI는 정적 파일입니다. WebSocket 대상은 구성 가능하며 HTTP 오리진과 다를 수 있습니다. 로컬에서는 Vite 개발 서버를 원하지만 Gateway는 다른 곳에서 실행되는 경우에 유용합니다.

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
  <Accordion title="참고">
    - `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서 제거됩니다.
    - `gatewayUrl`을 통해 전체 `ws://` 또는 `wss://` 엔드포인트를 전달하는 경우, 브라우저가 쿼리 문자열을 올바르게 파싱하도록 `gatewayUrl` 값을 URL 인코딩하세요.
    - 가능하면 `token`은 URL 프래그먼트(`#token=...`)로 전달해야 합니다. 프래그먼트는 서버로 전송되지 않으므로 요청 로그 및 Referer 유출을 방지합니다. 레거시 `?token=` 쿼리 매개변수는 호환성을 위해 한 번만 가져오지만, fallback으로만 사용되며 부트스트랩 직후 즉시 제거됩니다.
    - `password`는 메모리에만 보관됩니다.
    - `gatewayUrl`이 설정되면 UI는 구성 또는 환경 자격 증명으로 fallback하지 않습니다. `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류입니다.
    - Gateway가 TLS 뒤에 있을 때(Tailscale Serve, HTTPS 프록시 등)는 `wss://`를 사용하세요.
    - `gatewayUrl`은 클릭재킹을 방지하기 위해 최상위 창(임베드되지 않은 창)에서만 허용됩니다.
    - 공개 non-loopback Control UI 배포는 `gateway.controlUi.allowedOrigins`를 명시적으로 설정해야 합니다(전체 출처). loopback, RFC1918/link-local, `.local`, `.ts.net` 또는 Tailscale CGNAT 호스트에서 로드되는 비공개 동일 출처 LAN/Tailnet은 Host 헤더 fallback을 활성화하지 않아도 허용됩니다.
    - Gateway 시작 시 유효 런타임 바인드 및 포트에서 `http://localhost:<port>` 및 `http://127.0.0.1:<port>` 같은 로컬 출처를 시드할 수 있지만, 원격 브라우저 출처에는 여전히 명시적 항목이 필요합니다.
    - 엄격하게 제어되는 로컬 테스트를 제외하고 `gateway.controlUi.allowedOrigins: ["*"]`를 사용하지 마세요. 이는 "내가 사용하는 호스트와 일치"가 아니라 모든 브라우저 출처를 허용한다는 뜻입니다.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host 헤더 출처 fallback 모드를 활성화하지만, 위험한 보안 모드입니다.

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
- [상태 확인](/ko/gateway/health) — Gateway 상태 모니터링
- [TUI](/ko/web/tui) — 터미널 사용자 인터페이스
- [WebChat](/ko/web/webchat) — 브라우저 기반 채팅 인터페이스
