---
read_when:
    - 브라우저에서 Gateway를 운영하려는 경우
    - SSH 터널 없이 Tailnet 액세스를 원합니다
sidebarTitle: Control UI
summary: Gateway용 브라우저 기반 제어 UI(채팅, 활동, 노드, 설정)
title: Control UI
x-i18n:
    generated_at: "2026-07-04T20:29:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 883e951b304a104a5cb2d0197199d06e372b1b8a25efdfd082ae190575bf409d
    source_path: web/control-ui.md
    workflow: 16
---

Control UI는 Gateway에서 제공하는 작은 **Vite + Lit** 단일 페이지 앱입니다.

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

동일한 포트에서 **Gateway WebSocket에 직접** 통신합니다.

## 빠르게 열기(로컬)

Gateway가 같은 컴퓨터에서 실행 중이면 다음을 여세요.

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지가 로드되지 않으면 먼저 Gateway를 시작하세요: `openclaw gateway`.

<Note>
네이티브 Windows LAN 바인드에서는 Gateway 호스트에서 `127.0.0.1`이 작동하더라도 Windows 방화벽이나 조직에서 관리하는 그룹 정책이 광고된 LAN URL을 여전히 차단할 수 있습니다. Windows 호스트에서 `openclaw gateway status --deep`를 실행하세요. 차단 가능성이 있는 포트, 프로필 불일치, 정책이 무시할 수 있는 로컬 방화벽 규칙을 보고합니다.
</Note>

인증은 WebSocket 핸드셰이크 중 다음을 통해 제공됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 신뢰할 수 있는 프록시 ID 헤더

대시보드 설정 패널은 현재 브라우저 탭 세션과 선택한 Gateway URL에 대한 토큰을 유지하며, 비밀번호는 유지되지 않습니다. 온보딩은 일반적으로 첫 연결 시 공유 비밀 인증용 Gateway 토큰을 생성하지만, `gateway.auth.mode`가 `"password"`일 때는 비밀번호 인증도 작동합니다.

## 기기 페어링(첫 연결)

새 브라우저나 기기에서 Control UI에 연결하면 Gateway는 일반적으로 **일회성 페어링 승인**을 요구합니다. 이는 무단 액세스를 방지하기 위한 보안 조치입니다.

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

브라우저가 변경된 인증 세부 정보(역할/범위/공개 키)로 페어링을 다시 시도하면 이전 보류 중 요청은 대체되고 새 `requestId`가 생성됩니다. 승인 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 페어링되어 있고 읽기 액세스에서 쓰기/관리자 액세스로 변경하는 경우, 이는 조용한 재연결이 아니라 승인 업그레이드로 처리됩니다. OpenClaw는 기존 승인을 활성 상태로 유지하고, 더 넓은 범위의 재연결을 차단하며, 새 범위 집합을 명시적으로 승인하도록 요청합니다.

승인되면 기기가 기억되며 `openclaw devices revoke --device <id> --role <role>`로 취소하지 않는 한 재승인이 필요하지 않습니다. 토큰 로테이션과 취소는 [기기 CLI](/ko/cli/devices)를 참조하세요.

`openclaw_gateway` 어댑터를 통해 연결하는 Paperclip 에이전트도 동일한 최초 실행 승인 흐름을 사용합니다. 초기 연결 시도 후 `openclaw devices approve --latest`를 실행해 보류 중 요청을 미리 본 다음, 출력된 `openclaw devices approve <requestId>` 명령을 다시 실행해 승인하세요. 원격 Gateway에는 명시적인 `--url` 및 `--token` 값을 전달하세요. 재시작 후에도 승인을 안정적으로 유지하려면 Paperclip이 실행마다 새 임시 기기 ID를 생성하도록 두는 대신, 지속적인 `adapterConfig.devicePrivateKeyPem`을 구성하세요.

<Note>
- 직접 local loopback 브라우저 연결(`127.0.0.1` / `localhost`)은 자동 승인됩니다.
- `gateway.auth.allowTailscale: true`이고 Tailscale ID가 확인되며 브라우저가 기기 ID를 제시하는 경우, Tailscale Serve는 Control UI 운영자 세션의 페어링 왕복 과정을 건너뛸 수 있습니다.
- 직접 Tailnet 바인드, LAN 브라우저 연결, 기기 ID가 없는 브라우저 프로필은 여전히 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 기기 ID를 생성하므로, 브라우저를 바꾸거나 브라우저 데이터를 지우면 다시 페어링해야 합니다.

</Note>

## 모바일 기기 페어링

이미 페어링된 관리자는 터미널을 열지 않고 iOS/Android 연결 QR을 만들 수 있습니다.

<Steps>
  <Step title="Open mobile pairing">
    **Nodes**를 선택한 다음 **Devices** 카드에서 **Pair mobile device**를 클릭하세요.
  </Step>
  <Step title="Connect the phone">
    OpenClaw 모바일 앱에서 **Settings** → **Gateway**를 열고 QR 코드를 스캔하세요. 대신 설정 코드를 복사해 붙여넣을 수도 있습니다.
  </Step>
  <Step title="Confirm the connection">
    공식 iOS/Android 앱은 자동으로 연결됩니다. **Devices**에 보류 중 요청이 표시되면 승인하기 전에 역할과 범위를 검토하세요.
  </Step>
</Steps>

설정 코드를 만들려면 `operator.admin`이 필요하며, 해당 세션이 없으면 버튼이 비활성화됩니다. 설정 코드에는 수명이 짧은 부트스트랩 자격 증명이 포함되므로 QR과 복사한 코드는 유효한 동안 비밀번호처럼 취급하세요. 원격 페어링의 경우 Gateway는 `wss://`로 확인되어야 합니다(예: Tailscale Serve/Funnel을 통해). 일반 `ws://`는 loopback 및 사설 LAN 주소로 제한됩니다. 전체 보안 및 대체 방식 세부 정보는 [페어링](/ko/channels/pairing#pair-from-the-control-ui-recommended)을 참조하세요.

## 개인 ID(브라우저 로컬)

Control UI는 공유 세션에서 귀속 표시를 위해 발신 메시지에 연결되는 브라우저별 개인 ID(표시 이름과 아바타)를 지원합니다. 이는 브라우저 저장소에 저장되고 현재 브라우저 프로필로 범위가 제한되며, 실제로 보낸 메시지의 일반적인 transcript 작성자 메타데이터 외에는 다른 기기에 동기화되거나 서버 측에 유지되지 않습니다. 사이트 데이터를 지우거나 브라우저를 바꾸면 비어 있는 상태로 재설정됩니다.

동일한 브라우저 로컬 패턴이 어시스턴트 아바타 재정의에도 적용됩니다. 업로드된 어시스턴트 아바타는 로컬 브라우저에서만 Gateway가 확인한 ID 위에 오버레이되며 `config.patch`를 통해 왕복하지 않습니다. 공유 `ui.assistant.avatar` 구성 필드는 해당 필드를 직접 쓰는 비 UI 클라이언트(예: 스크립트 기반 Gateway 또는 사용자 지정 대시보드)를 위해 여전히 사용할 수 있습니다.

## 런타임 구성 엔드포인트

Control UI는 런타임 설정을 Gateway의 Control UI 기본 경로를 기준으로 확인되는 `/control-ui-config.json`에서 가져옵니다(예: UI가 `/__openclaw__/` 아래에서 제공될 때 `/__openclaw__/control-ui-config.json`). 해당 엔드포인트는 나머지 HTTP 표면과 동일한 Gateway 인증으로 보호됩니다. 인증되지 않은 브라우저는 이를 가져올 수 없으며, 성공적으로 가져오려면 이미 유효한 Gateway 토큰/비밀번호, Tailscale Serve ID 또는 신뢰할 수 있는 프록시 ID 중 하나가 필요합니다.

## 언어 지원

Control UI는 첫 로드 시 브라우저 로케일에 따라 자체적으로 현지화할 수 있습니다. 나중에 재정의하려면 **Overview -> Gateway Access -> Language**를 여세요. 로케일 선택기는 Appearance 아래가 아니라 Gateway Access 카드에 있습니다.

- 지원 로케일: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `ar`, `it`, `tr`, `uk`, `id`, `pl`, `th`, `vi`, `nl`, `fa`
- 영어가 아닌 번역은 브라우저에서 지연 로드됩니다.
- 선택한 로케일은 브라우저 저장소에 저장되고 향후 방문 시 재사용됩니다.
- 누락된 번역 키는 영어로 대체됩니다.

문서 번역도 동일한 비영어 로케일 집합에 대해 생성되지만, 문서 사이트에 내장된 Mintlify 언어 선택기는 Mintlify가 허용하는 로케일 코드로 제한됩니다. 태국어(`th`)와 페르시아어(`fa`) 문서는 publish repo에 계속 생성되지만, Mintlify가 해당 코드를 지원할 때까지 해당 선택기에 표시되지 않을 수 있습니다.

## Appearance 테마

Appearance 패널은 내장 Claw, Knot, Dash 테마와 브라우저 로컬 tweakcn 가져오기 슬롯 하나를 유지합니다. 테마를 가져오려면 [tweakcn 편집기](https://tweakcn.com/editor/theme)를 열고 테마를 선택하거나 만든 다음 **Share**를 클릭하고 복사한 테마 링크를 Appearance에 붙여넣으세요. 가져오기는 `https://tweakcn.com/r/themes/<id>` 레지스트리 URL, `https://tweakcn.com/editor/theme?theme=amethyst-haze` 같은 편집기 URL, 상대 `/themes/<id>` 경로, 원시 테마 ID, `amethyst-haze` 같은 기본 테마 이름도 허용합니다.

Appearance에는 브라우저 로컬 Text size 설정도 포함됩니다. 이 설정은 나머지 Control UI 환경설정과 함께 저장되고, 채팅 텍스트, 작성기 텍스트, 도구 카드, 채팅 사이드바에 적용되며, 모바일 Safari가 포커스 시 자동 확대하지 않도록 텍스트 입력을 최소 16px로 유지합니다.

가져온 테마는 현재 브라우저 프로필에만 저장됩니다. Gateway 구성에 기록되지 않으며 기기 간 동기화되지 않습니다. 가져온 테마를 교체하면 로컬 슬롯 하나가 업데이트됩니다. 이를 지우면 가져온 테마가 선택되어 있던 경우 활성 테마가 Claw로 다시 전환됩니다.

## 수행할 수 있는 작업(현재)

<AccordionGroup>
  <Accordion title="Chat and Talk">
    - Gateway WS(`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)를 통해 모델과 채팅합니다.
    - 채팅 기록 새로고침은 메시지별 텍스트 제한이 있는 제한된 최근 창을 요청하므로, 큰 세션에서도 채팅을 사용할 수 있게 되기 전에 브라우저가 전체 transcript 페이로드를 렌더링하도록 강제하지 않습니다.
    - 브라우저 실시간 세션을 통해 말합니다. OpenAI는 직접 WebRTC를 사용하고, Google Live는 WebSocket을 통한 제한된 일회용 브라우저 토큰을 사용하며, 백엔드 전용 실시간 음성 Plugin은 Gateway 릴레이 전송을 사용합니다. 클라이언트 소유 제공자 세션은 `talk.client.create`로 시작하고, Gateway 릴레이 세션은 `talk.session.create`로 시작합니다. 릴레이는 브라우저가 `talk.session.appendAudio`를 통해 마이크 PCM을 스트리밍하는 동안 제공자 자격 증명을 Gateway에 유지하고, Gateway 정책 및 더 크게 구성된 OpenClaw 모델을 위해 `openclaw_agent_consult` 제공자 도구 호출을 `talk.client.toolCall`을 통해 전달하며, 활성 실행 음성 조정을 `talk.client.steer` 또는 `talk.session.steer`를 통해 라우팅합니다.
    - Chat에서 도구 호출과 라이브 도구 출력 카드를 스트리밍합니다(에이전트 이벤트).
    - 기존 `session.tool` / 도구 이벤트 전달에서 라이브 도구 활동을 브라우저 로컬의 수정 우선 요약으로 보여주는 Activity 탭.

  </Accordion>
  <Accordion title="Channels, instances, sessions, dreams">
    - 채널: 내장 및 번들/외부 Plugin 채널 상태, QR 로그인, 채널별 구성(`channels.status`, `web.login.*`, `config.patch`).
    - 채널 프로브 새로고침은 느린 제공자 확인이 끝나는 동안 이전 스냅샷을 계속 표시하며, 프로브나 감사가 UI 예산을 초과하면 부분 스냅샷에 레이블이 지정됩니다.
    - 인스턴스: 존재 목록 + 새로고침(`system-presence`).
    - 세션: 기본적으로 구성된 에이전트 세션을 나열하고, 자주 쓰는 세션을 고정하고, 이름을 바꾸고, 비활성 세션을 보관하거나 복원하고, 오래된 미구성 에이전트 세션 키에서 대체하며, 세션별 모델/thinking/fast/verbose/trace/reasoning 재정의를 적용합니다(`sessions.list`, `sessions.patch`). 고정된 세션은 최근의 고정되지 않은 세션보다 위에 정렬됩니다. 보관된 세션은 Sessions 페이지의 보관된 보기 안에 있으며 transcript를 유지합니다.
    - Dreams: Dreaming 상태, 활성화/비활성화 토글, Dream Diary 리더(`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).

  </Accordion>
  <Accordion title="Cron, skills, nodes, exec approvals">
    - Cron 작업: 목록/추가/편집/실행/활성화/비활성화 + 실행 기록(`cron.*`).
    - Skills: 상태, 활성화/비활성화, 설치, API 키 업데이트(`skills.*`).
    - 노드: 목록 + 기능(`node.list`), 모바일 설정 코드 생성, 기기 페어링 승인(`device.pair.*`).
    - 실행 승인: Gateway 또는 노드 허용 목록 편집 + `exec host=gateway/node`에 대한 요청 정책(`exec.approvals.*`).

  </Accordion>
  <Accordion title="구성">
    - `~/.openclaw/openclaw.json`을 보거나 편집합니다(`config.get`, `config.set`).
    - MCP에는 구성된 서버, 활성화, OAuth/필터/병렬 요약, 일반적인 운영자 명령, 범위가 지정된 `mcp` 구성 편집기를 위한 전용 설정 페이지가 있습니다.
    - 검증과 함께 적용하고 다시 시작한 뒤(`config.apply`) 마지막 활성 세션을 깨웁니다.
    - 쓰기에는 동시 편집을 덮어쓰지 않도록 하는 기본 해시 보호 장치가 포함됩니다.
    - 쓰기(`config.set`/`config.apply`/`config.patch`)는 제출된 구성 페이로드의 참조에 대해 활성 SecretRef 해석을 사전 점검합니다. 해석되지 않은 활성 제출 참조는 쓰기 전에 거부됩니다.
    - 양식 저장은 저장된 암호에 여전히 매핑되는 마스킹된 값을 보존하면서, 저장된 구성에서 복원할 수 없는 오래된 마스킹 자리표시자를 폐기합니다.
    - 스키마 + 양식 렌더링(`config.schema` / `config.schema.lookup`, 필드 `title` / `description`, 일치하는 UI 힌트, 직계 자식 요약, 중첩 객체/와일드카드/배열/컴포지션 노드의 문서 메타데이터, 사용 가능한 경우 Plugin + 채널 스키마 포함). Raw JSON 편집기는 스냅샷이 안전한 원시 왕복을 지원할 때만 사용할 수 있습니다.
    - 스냅샷이 원시 텍스트를 안전하게 왕복할 수 없으면 Control UI는 해당 스냅샷에 대해 양식 모드를 강제하고 Raw 모드를 비활성화합니다.
    - Raw JSON 편집기의 "저장된 값으로 재설정"은 평탄화된 스냅샷을 다시 렌더링하는 대신 원시 작성 형태(서식, 주석, `$include` 레이아웃)를 보존하므로, 스냅샷이 안전하게 왕복할 수 있을 때 외부 편집 내용이 재설정 후에도 유지됩니다.
    - 구조화된 SecretRef 객체 값은 실수로 객체가 문자열로 손상되지 않도록 양식 텍스트 입력에서 읽기 전용으로 렌더링됩니다.

  </Accordion>
  <Accordion title="디버그, 로그, 업데이트">
    - 디버그: 상태/상태 점검/모델 스냅샷 + 이벤트 로그 + 수동 RPC 호출(`status`, `health`, `models.list`).
    - 이벤트 로그에는 Control UI 새로 고침/RPC 타이밍, 느린 채팅/구성 렌더링 타이밍, 브라우저가 해당 PerformanceObserver 항목 유형을 노출할 때 긴 애니메이션 프레임 또는 긴 작업에 대한 브라우저 응답성 항목이 포함됩니다.
    - 로그: 필터/내보내기가 포함된 Gateway 파일 로그의 실시간 tail(`logs.tail`).
    - 업데이트: 다시 시작 보고서와 함께 패키지/git 업데이트 + 다시 시작을 실행한 다음(`update.run`), 다시 연결한 후 `update.status`를 폴링하여 실행 중인 Gateway 버전을 확인합니다.

  </Accordion>
  <Accordion title="Cron 작업 패널 참고 사항">
    - 격리된 작업의 경우 전달 기본값은 요약 알림입니다. 내부 전용 실행을 원하면 none으로 전환할 수 있습니다.
    - 알림이 선택되면 채널/대상 필드가 나타납니다.
    - Webhook 모드는 `delivery.to`가 유효한 HTTP(S) Webhook URL로 설정된 상태에서 `delivery.mode = "webhook"`을 사용합니다.
    - 메인 세션 작업에는 Webhook 및 none 전달 모드를 사용할 수 있습니다.
    - 고급 편집 컨트롤에는 실행 후 삭제, 에이전트 재정의 지우기, Cron 정확/분산 옵션, 에이전트 모델/thinking 재정의, 최선형 전달 토글이 포함됩니다.
    - 양식 검증은 필드 수준 오류와 함께 인라인으로 표시됩니다. 잘못된 값은 수정될 때까지 저장 버튼을 비활성화합니다.
    - 전용 bearer 토큰을 보내려면 `cron.webhookToken`을 설정합니다. 생략하면 Webhook은 인증 헤더 없이 전송됩니다.
    - 지원 중단된 폴백: `openclaw doctor --fix`를 실행하여 `notify: true`가 있는 저장된 레거시 작업을 `cron.webhook`에서 명시적인 작업별 Webhook 또는 완료 전달로 마이그레이션합니다.

  </Accordion>
</AccordionGroup>

## MCP 페이지

전용 MCP 페이지는 `mcp.servers` 아래의 OpenClaw 관리 MCP 서버를 위한 운영자 보기입니다. 이 페이지 자체가 MCP 전송을 시작하지는 않습니다. 저장된 구성을 검사하고 편집하는 데 사용한 다음, 라이브 서버 증명이 필요할 때 `openclaw mcp doctor --probe`를 사용하세요.

일반적인 워크플로:

1. 사이드바에서 **MCP**를 엽니다.
2. 요약 카드에서 전체, 활성화됨, OAuth, 필터링된 서버 수를 확인합니다.
3. 각 서버 행에서 전송, 활성화, 인증, 필터, 제한 시간, 명령 힌트를 검토합니다.
4. 서버가 구성된 상태로 유지되지만 런타임 검색에서는 제외되어야 할 때 활성화를 토글합니다.
5. 서버 정의, 헤더, TLS/mTLS 경로, OAuth 메타데이터, 도구 필터, Codex 프로젝션 메타데이터를 위해 범위가 지정된 `mcp` 구성 섹션을 편집합니다.
6. 구성 쓰기에는 **저장**을 사용하고, 실행 중인 Gateway가 변경된 구성을 적용해야 할 때는 **저장 및 게시**를 사용합니다.
7. 편집된 프로세스에 정적 진단, 라이브 증명 또는 캐시된 런타임 폐기가 필요할 때 터미널에서 `openclaw mcp status --verbose`, `openclaw mcp doctor --probe` 또는 `openclaw mcp reload`를 실행합니다.

이 페이지는 렌더링 전에 자격 증명을 포함하는 URL 유사 값을 마스킹하고, 복사한 명령이 공백이나 셸 메타문자가 있는 경우에도 계속 작동하도록 명령 스니펫에서 서버 이름을 따옴표로 감쌉니다. 전체 CLI 및 구성 참조는 [MCP](/ko/cli/mcp)에 있습니다.

## 활동 탭

활동 탭은 실시간 도구 활동을 위한 브라우저 로컬 임시 관찰자입니다. 이는 채팅 도구 카드를 구동하는 것과 동일한 Gateway `session.tool` / 도구 이벤트 스트림에서 파생됩니다. 별도의 Gateway 이벤트 계열, 엔드포인트, 영구 활동 저장소, 메트릭 피드 또는 외부 관찰자 스트림을 추가하지 않습니다.

활동 항목은 정리된 요약과 마스킹되고 잘린 출력 미리보기만 유지합니다. 도구 인수 값은 활동 상태에 저장되지 않습니다. UI는 인수가 숨겨졌음을 표시하고 인수 필드 수만 기록합니다. 인메모리 목록은 현재 브라우저 탭을 따르고, Control UI 내 탐색 중에는 유지되며, 페이지 새로 고침, 세션 전환 또는 **지우기** 시 재설정됩니다.

## 채팅 동작

<AccordionGroup>
  <Accordion title="전송 및 기록 의미 체계">
    - `chat.send`는 **비차단**입니다. `{ runId, status: "started" }`로 즉시 ACK하고 응답은 `chat` 이벤트를 통해 스트리밍됩니다. 신뢰할 수 있는 Control UI 클라이언트는 로컬 진단을 위한 선택적 ACK 타이밍 메타데이터도 받을 수 있습니다.
    - 채팅 업로드는 이미지와 비동영상 파일을 허용합니다. 이미지는 네이티브 이미지 경로를 유지하고, 다른 파일은 관리형 미디어로 저장되어 기록에 첨부 파일 링크로 표시됩니다.
    - 동일한 `idempotencyKey`로 다시 보내면 실행 중에는 `{ status: "in_flight" }`를 반환하고, 완료 후에는 `{ status: "ok" }`를 반환합니다.
    - `chat.history` 응답은 UI 안전을 위해 크기가 제한됩니다. transcript 항목이 너무 크면 Gateway는 긴 텍스트 필드를 잘라내고, 무거운 메타데이터 블록을 생략하며, 지나치게 큰 메시지를 자리표시자(`[chat.history omitted: message too large]`)로 대체할 수 있습니다.
    - 표시되는 어시스턴트 메시지가 `chat.history`에서 잘렸을 때, 사이드 리더는 `sessionKey`, 필요 시 활성 `agentId`, transcript `messageId`를 통해 `chat.message.get`으로 표시 정규화된 전체 transcript 항목을 요청 시 가져올 수 있습니다. Gateway가 여전히 더 많은 내용을 반환할 수 없으면, 리더는 잘린 미리보기를 조용히 반복하는 대신 명시적인 사용 불가 상태를 표시합니다.
    - 어시스턴트/생성 이미지는 관리형 미디어 참조로 지속되고 인증된 Gateway 미디어 URL을 통해 다시 제공되므로, 다시 로드할 때 원시 base64 이미지 페이로드가 채팅 기록 응답에 남아 있는지에 의존하지 않습니다.
    - `chat.history`를 렌더링할 때 Control UI는 표시되는 어시스턴트 텍스트에서 표시 전용 인라인 지시문 태그(예: `[[reply_to_*]]` 및 `[[audio_as_voice]]`), 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함), 유출된 ASCII/전각 모델 제어 토큰을 제거하고, 표시되는 전체 텍스트가 정확한 무음 토큰 `NO_REPLY` / `no_reply` 또는 Heartbeat 확인 토큰 `HEARTBEAT_OK`뿐인 어시스턴트 항목은 생략합니다.
    - 활성 전송 중 및 최종 기록 새로 고침 중에 `chat.history`가 잠시 이전 스냅샷을 반환하더라도 채팅 보기는 로컬 optimistic 사용자/어시스턴트 메시지를 계속 표시합니다. Gateway 기록이 따라잡으면 정식 transcript가 해당 로컬 메시지를 대체합니다.
    - 실시간 `chat` 이벤트는 전달 상태이고, `chat.history`는 영구 세션 transcript에서 다시 빌드됩니다. 도구 최종 이벤트 후 Control UI는 기록을 다시 로드하고 작은 optimistic tail만 병합합니다. transcript 경계는 [WebChat](/ko/web/webchat)에 문서화되어 있습니다.
    - `chat.inject`는 어시스턴트 메모를 세션 transcript에 추가하고 UI 전용 업데이트를 위해 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, 채널 전달 없음).
    - 사이드바는 새 세션 작업, 모든 세션 링크, 전체 세션 선택기를 여는 세션 검색 버튼과 함께 최근 세션을 나열합니다(선택된 에이전트로 범위가 지정되며 검색 및 페이지네이션 포함). 에이전트를 전환하면 해당 에이전트에 연결된 세션만 표시되고, 저장된 대시보드 세션이 아직 없으면 해당 에이전트의 메인 세션으로 폴백합니다.
    - 각 세션 선택기 행은 세션 이름을 바꾸거나, 고정하거나, 보관할 수 있습니다. 활성 실행과 에이전트의 메인 세션은 보관할 수 없습니다. 현재 선택된 세션을 보관하면 채팅은 해당 에이전트의 메인 세션으로 다시 전환됩니다.
    - 데스크톱 너비에서는 채팅 컨트롤이 하나의 compact 행에 유지되고 transcript를 아래로 스크롤하는 동안 접힙니다. 위로 스크롤하거나, 맨 위로 돌아가거나, 맨 아래에 도달하면 컨트롤이 복원됩니다.
    - 연속된 중복 텍스트 전용 메시지는 개수 배지와 함께 하나의 말풍선으로 렌더링됩니다. 이미지, 첨부 파일, 도구 출력 또는 캔버스 미리보기가 있는 메시지는 접히지 않습니다.
    - 채팅 헤더 모델 및 thinking 선택기는 `sessions.patch`를 통해 활성 세션을 즉시 패치합니다. 이는 영구 세션 재정의이며, 한 턴 전용 전송 옵션이 아닙니다.
    - 같은 세션의 모델 선택기 변경이 아직 저장 중일 때 메시지를 보내면, composer는 `chat.send`를 호출하기 전에 해당 세션 패치를 기다려 전송이 선택된 모델을 사용하도록 합니다.
    - Control UI에서 `/new`를 입력하면 새 채팅과 동일한 새 대시보드 세션을 만들고 전환합니다. 단, `session.dmScope: "main"`이 구성되어 있고 현재 부모가 에이전트의 메인 세션인 경우에는 그 자리에서 메인 세션을 재설정합니다. `/reset`을 입력하면 현재 세션에 대한 Gateway의 명시적인 제자리 재설정이 유지됩니다.
    - 채팅 모델 선택기는 Gateway의 구성된 모델 보기를 요청합니다. `agents.defaults.models`가 있으면 해당 허용 목록이 선택기를 구동하며, provider 범위 카탈로그를 동적으로 유지하는 `provider/*` 항목도 포함됩니다. 그렇지 않으면 선택기는 명시적인 `models.providers.*.models` 항목과 사용 가능한 인증이 있는 provider를 표시합니다. 전체 카탈로그는 디버그 `models.list` RPC에서 `view: "all"`로 계속 사용할 수 있습니다.
    - 최신 Gateway 세션 사용량 보고서에 현재 컨텍스트 토큰이 포함되어 있으면, 채팅 composer 도구 모음은 사용된 비율이 포함된 작은 컨텍스트 사용량 링을 표시합니다. 전체 토큰 세부 정보는 해당 tooltip에 있습니다. 링은 높은 컨텍스트 압력에서 경고 스타일로 전환되고, 권장 Compaction 수준에서는 일반 세션 Compaction 경로를 실행하는 compact 버튼을 표시합니다. 오래된 토큰 스냅샷은 Gateway가 최신 사용량을 다시 보고할 때까지 숨겨집니다.

  </Accordion>
  <Accordion title="말하기 모드(브라우저 실시간)">
    말하기 모드는 등록된 실시간 음성 provider를 사용합니다. OpenAI는 `talk.realtime.provider: "openai"`와 `openai` API 키 인증 프로필, `talk.realtime.providers.openai.apiKey` 또는 `OPENAI_API_KEY`로 구성합니다. OpenAI OAuth 프로필은 Realtime 음성을 구성하지 않습니다. Google은 `talk.realtime.provider: "google"`와 `talk.realtime.providers.google.apiKey`로 구성합니다. 브라우저는 표준 provider API 키를 절대 받지 않습니다. OpenAI는 WebRTC용 임시 Realtime 클라이언트 암호를 받습니다. Google Live는 브라우저 WebSocket 세션용 일회용 제한 Live API 인증 토큰을 받으며, 명령 및 도구 선언은 Gateway에 의해 토큰 안에 잠깁니다. 백엔드 실시간 브리지만 노출하는 provider는 Gateway relay 전송을 통해 실행되므로, 자격 증명과 vendor 소켓은 서버 측에 남고 브라우저 오디오는 인증된 Gateway RPC를 통해 이동합니다. Realtime 세션 프롬프트는 Gateway가 조립합니다. `talk.client.create`는 호출자가 제공하는 명령 재정의를 허용하지 않습니다.

    Chat 작성기에는 Talk 시작/중지 버튼 옆에 Talk 옵션 버튼이 있습니다. 옵션은 다음 Talk 세션에 적용되며 provider, transport, model, voice, reasoning effort, VAD threshold, silence duration, prefix padding을 재정의할 수 있습니다. 옵션이 비어 있으면 Gateway는 가능한 경우 구성된 기본값을 사용하거나 provider 기본값을 사용합니다. Gateway relay를 선택하면 backend relay 경로가 강제됩니다. WebRTC를 선택하면 세션은 client-owned 상태로 유지되며, provider가 브라우저 세션을 만들 수 없을 때 조용히 relay로 폴백하지 않고 실패합니다.

    Chat 작성기에서 Talk 컨트롤은 마이크 받아쓰기 버튼 옆의 파형 버튼입니다. Talk가 시작되면 작성기 상태 행에 먼저 `Connecting Talk...`가 표시되고, 오디오가 연결된 동안에는 `Talk live`가 표시되며, realtime tool call이 `talk.client.toolCall`을 통해 구성된 더 큰 model에 문의하는 동안에는 `Asking OpenClaw...`가 표시됩니다.

    Maintainer live smoke: `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`는 OpenAI backend WebSocket bridge, OpenAI 브라우저 WebRTC SDP exchange, Google Live constrained-token 브라우저 WebSocket 설정, fake microphone media를 사용하는 Gateway relay 브라우저 adapter를 검증합니다. 이 명령은 provider 상태만 출력하며 secrets를 로그에 남기지 않습니다.

  </Accordion>
  <Accordion title="중지 및 중단">
    - **Stop**을 클릭합니다(`chat.abort` 호출).
    - 실행이 활성 상태인 동안 일반 후속 입력은 대기열에 들어갑니다. 대기 중인 메시지에서 **Steer**를 클릭하면 해당 후속 입력을 실행 중인 턴에 주입합니다.
    - 대역 외로 중단하려면 `/stop` 또는 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 단독 중단 문구를 입력합니다.
    - `chat.abort`는 해당 세션의 모든 활성 실행을 중단하기 위해 `{ sessionKey }`를 지원합니다(`runId` 없음).

  </Accordion>
  <Accordion title="중단된 부분 보존">
    - 실행이 중단되어도 부분 assistant 텍스트가 UI에 계속 표시될 수 있습니다.
    - buffered output이 있으면 Gateway는 중단된 부분 assistant 텍스트를 transcript 기록에 유지합니다.
    - 유지된 항목에는 중단 metadata가 포함되어 transcript 소비자가 중단된 부분과 정상 completion 출력을 구분할 수 있습니다.

  </Accordion>
</AccordionGroup>

## PWA 설치 및 웹 푸시

Control UI는 `manifest.webmanifest`와 service worker를 제공하므로 최신 브라우저에서 독립 실행형 PWA로 설치할 수 있습니다. Web Push를 사용하면 탭이나 브라우저 창이 열려 있지 않아도 Gateway가 알림으로 설치된 PWA를 깨울 수 있습니다.

OpenClaw 업데이트 직후 페이지에 **Protocol mismatch**가 표시되면 먼저 `openclaw dashboard`로 대시보드를 다시 열고 페이지를 강력 새로고침하세요. 그래도 실패하면 대시보드 origin의 사이트 데이터를 지우거나 비공개 브라우저 창에서 테스트하세요. 오래된 탭이나 브라우저 service-worker cache가 업데이트 전 Control UI bundle을 더 새로운 Gateway에 대해 계속 실행할 수 있습니다.

| Surface                                               | 수행하는 작업                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest입니다. 접근 가능해지면 브라우저가 "Install app"을 제공합니다.   |
| `ui/public/sw.js`                                     | `push` events와 notification clicks를 처리하는 service worker입니다. |
| `push/vapid-keys.json` (OpenClaw state dir 아래) | Web Push payloads 서명에 사용되는 자동 생성 VAPID keypair입니다.       |
| `push/web-push-subscriptions.json`                    | 유지되는 브라우저 subscription endpoints입니다.                          |

keys를 고정하려는 경우(다중 호스트 배포, secrets rotation, tests) Gateway 프로세스에서 env vars를 통해 VAPID keypair를 재정의합니다.

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (기본값: `https://openclaw.ai`)

Control UI는 브라우저 subscriptions를 등록하고 테스트하기 위해 이러한 scope-gated Gateway methods를 사용합니다.

- `push.web.vapidPublicKey` — 활성 VAPID public key를 가져옵니다.
- `push.web.subscribe` — `endpoint`와 `keys.p256dh`/`keys.auth`를 등록합니다.
- `push.web.unsubscribe` — 등록된 endpoint를 제거합니다.
- `push.web.test` — 호출자의 subscription에 test notification을 보냅니다.

<Note>
Web Push는 iOS APNS relay 경로(relay-backed push는 [Configuration](/ko/gateway/configuration) 참조) 및 native mobile pairing을 대상으로 하는 기존 `push.test` method와 독립적입니다.
</Note>

## Hosted embeds

Assistant 메시지는 `[embed ...]` shortcode로 hosted web content를 inline으로 렌더링할 수 있습니다. iframe sandbox policy는 `gateway.controlUi.embedSandbox`로 제어됩니다.

<Tabs>
  <Tab title="strict">
    hosted embeds 내부의 script 실행을 비활성화합니다.
  </Tab>
  <Tab title="scripts (기본값)">
    origin isolation을 유지하면서 interactive embeds를 허용합니다. 이것이 기본값이며 보통 self-contained browser games/widgets에 충분합니다.
  </Tab>
  <Tab title="trusted">
    의도적으로 더 강한 권한이 필요한 same-site documents를 위해 `allow-scripts`에 더해 `allow-same-origin`을 추가합니다.
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
embedded document에 same-origin behavior가 실제로 필요할 때만 `trusted`를 사용하세요. 대부분의 agent-generated games와 interactive canvases에는 `scripts`가 더 안전한 선택입니다.
</Warning>

절대 external `http(s)` embed URLs는 기본적으로 계속 차단됩니다. 의도적으로 `[embed url="https://..."]`가 third-party pages를 로드하도록 하려면 `gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## Chat message width

그룹화된 chat messages는 읽기 쉬운 기본 max-width를 사용합니다. Wide-monitor 배포에서는 bundled CSS를 패치하지 않고 `gateway.controlUi.chatMessageMaxWidth`를 설정해 재정의할 수 있습니다.

```json5
{
  gateway: {
    controlUi: {
      chatMessageMaxWidth: "min(1280px, 82%)",
    },
  },
}
```

값은 브라우저에 도달하기 전에 검증됩니다. 지원되는 값에는 `960px` 또는 `82%` 같은 plain lengths와 percentages, 그리고 제한된 `min(...)`, `max(...)`, `clamp(...)`, `calc(...)`, `fit-content(...)` width expressions가 포함됩니다.

## Tailnet access (권장)

<Tabs>
  <Tab title="Integrated Tailscale Serve (선호)">
    Gateway를 loopback에 유지하고 Tailscale Serve가 HTTPS로 프록시하게 합니다.

    ```bash
    openclaw gateway --tailscale serve
    ```

    열기:

    - `https://<magicdns>/` (또는 구성한 `gateway.controlUi.basePath`)

    기본적으로 `gateway.auth.allowTailscale`이 `true`이면 Control UI/WebSocket Serve 요청은 Tailscale identity headers(`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는 `tailscale whois`로 `x-forwarded-for` 주소를 해석하고 header와 일치시키는 방식으로 identity를 검증하며, 요청이 Tailscale의 `x-forwarded-*` headers와 함께 loopback에 도달할 때만 이를 허용합니다. 브라우저 device identity가 있는 Control UI operator sessions의 경우, 이 검증된 Serve 경로는 device-pairing 왕복도 건너뜁니다. device-less browsers와 node-role connections는 계속 일반 device checks를 따릅니다. Serve traffic에도 명시적인 shared-secret credentials를 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음 `gateway.auth.mode: "token"` 또는 `"password"`를 사용합니다.

    해당 async Serve identity path에서는 같은 client IP와 auth scope에 대한 실패한 auth attempts가 rate-limit writes 전에 직렬화됩니다. 따라서 같은 브라우저에서 concurrent bad retries가 발생하면 두 개의 plain mismatches가 병렬로 경합하는 대신 두 번째 요청에 `retry later`가 표시될 수 있습니다.

    <Warning>
    Tokenless Serve auth는 gateway host가 신뢰된다고 가정합니다. 신뢰할 수 없는 local code가 해당 host에서 실행될 수 있다면 token/password auth를 요구하세요.
    </Warning>

  </Tab>
  <Tab title="Tailnet에 bind + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    그런 다음 열기:

    - `http://<tailscale-ip>:18789/` (또는 구성한 `gateway.controlUi.basePath`)

    일치하는 shared secret을 UI settings에 붙여넣습니다(`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

  </Tab>
</Tabs>

## Insecure HTTP

plain HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 대시보드를 열면 브라우저가 **non-secure context**에서 실행되어 WebCrypto를 차단합니다. 기본적으로 OpenClaw는 device identity가 없는 Control UI connections를 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 사용하는 localhost-only insecure HTTP compatibility
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 operator Control UI auth
- break-glass `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 해결 방법:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 엽니다.

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway host에서)

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

    `allowInsecureAuth`는 local compatibility toggle일 뿐입니다.

    - non-secure HTTP contexts에서 localhost Control UI sessions가 device identity 없이 진행되도록 허용합니다.
    - pairing checks를 우회하지 않습니다.
    - remote(non-localhost) device identity requirements를 완화하지 않습니다.

  </Accordion>
  <Accordion title="Break-glass 전용">
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
    `dangerouslyDisableDeviceAuth`는 Control UI device identity checks를 비활성화하며 심각한 보안 저하입니다. 긴급 사용 후 빠르게 되돌리세요.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy note">
    - 성공적인 trusted-proxy auth는 device identity가 없는 **operator** Control UI sessions를 허용할 수 있습니다.
    - 이는 node-role Control UI sessions로 확장되지 **않습니다**.
    - same-host loopback reverse proxies는 여전히 trusted-proxy auth를 충족하지 않습니다. [Trusted proxy auth](/ko/gateway/trusted-proxy-auth)를 참조하세요.

  </Accordion>
</AccordionGroup>

HTTPS 설정 지침은 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## Content security policy

Control UI는 엄격한 `img-src` policy와 함께 제공됩니다. **same-origin** assets, `data:` URLs, locally generated `blob:` URLs만 허용됩니다. Remote `http(s)` 및 protocol-relative image URLs는 브라우저에서 거부되며 network fetches를 발생시키지 않습니다.

실제로 의미하는 바:

- relative paths(예: `/avatars/<id>`) 아래에서 제공되는 avatars와 images는 계속 렌더링되며, UI가 가져와 local `blob:` URLs로 변환하는 authenticated avatar routes도 포함됩니다.
- Inline `data:image/...` URLs는 계속 렌더링됩니다(in-protocol payloads에 유용).
- Control UI가 생성한 local `blob:` URLs는 계속 렌더링됩니다.
- channel metadata가 내보낸 remote avatar URLs는 Control UI의 avatar helpers에서 제거되고 built-in logo/badge로 대체되므로, compromised 또는 malicious channel이 operator browser에서 임의의 remote image fetches를 강제할 수 없습니다.

이 동작을 얻기 위해 아무것도 변경할 필요가 없습니다. 항상 켜져 있으며 구성할 수 없습니다.

## Avatar route auth

gateway auth가 구성되면 Control UI avatar endpoint는 API의 나머지 부분과 동일한 gateway token을 요구합니다.

- `GET /avatar/<agentId>`는 인증된 호출자에게만 avatar image를 반환합니다. `GET /avatar/<agentId>?meta=1`은 같은 규칙에 따라 avatar metadata를 반환합니다.
- 두 route에 대한 unauthenticated requests는 거부됩니다(sibling assistant-media route와 일치). 이를 통해 avatar route가 그 외에는 보호되는 hosts에서 agent identity를 누출하지 않도록 합니다.
- Control UI 자체는 avatars를 가져올 때 gateway token을 bearer header로 전달하고 authenticated blob URLs를 사용하므로 dashboards에서도 image가 계속 렌더링됩니다.

Gateway 인증을 비활성화하면(공유 호스트에서는 권장하지 않음), 나머지 Gateway와 마찬가지로 아바타 라우트도 인증이 필요 없어집니다.

## 어시스턴트 미디어 라우트 인증

Gateway 인증이 구성되어 있으면 어시스턴트 로컬 미디어 미리보기는 2단계 라우트를 사용합니다.

- `GET /__openclaw__/assistant-media?meta=1&source=<path>`에는 일반 Control UI 운영자 인증이 필요합니다. 브라우저는 사용 가능 여부를 확인할 때 Gateway 토큰을 bearer 헤더로 보냅니다.
- 성공한 메타데이터 응답에는 해당 정확한 소스 경로로 범위가 제한된 단기 `mediaTicket`이 포함됩니다.
- 브라우저에서 렌더링되는 이미지, 오디오, 비디오, 문서 URL은 활성 Gateway 토큰이나 비밀번호 대신 `mediaTicket=<ticket>`을 사용합니다. 티켓은 빠르게 만료되며 다른 소스를 인증할 수 없습니다.

이렇게 하면 재사용 가능한 Gateway 자격 증명을 보이는 미디어 URL에 넣지 않으면서도 일반 미디어 렌더링을 브라우저 네이티브 미디어 요소와 호환되게 유지할 수 있습니다.

## UI 빌드

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음 명령으로 빌드하세요.

```bash
pnpm ui:build
```

선택적 절대 베이스(고정 애셋 URL을 원할 때):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 개발 서버):

```bash
pnpm ui:dev
```

그런 다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키도록 설정하세요.

## 빈 Control UI 페이지

브라우저가 빈 대시보드를 로드하고 DevTools에 유용한 오류가 표시되지 않는다면, 확장 프로그램이나 초기 콘텐츠 스크립트가 JavaScript 모듈 앱의 평가를 막았을 수 있습니다. 정적 페이지에는 시작 후 `<openclaw-app>`이 등록되지 않았을 때 표시되는 일반 HTML 복구 패널이 포함되어 있습니다.

브라우저 환경을 변경한 뒤 패널의 **다시 시도** 동작을 사용하거나, 다음 사항을 확인한 뒤 수동으로 다시 로드하세요.

- 모든 페이지에 주입되는 확장 프로그램, 특히 `<all_urls>` 콘텐츠 스크립트가 있는 확장 프로그램을 비활성화합니다.
- 시크릿 창, 깨끗한 브라우저 프로필, 또는 다른 브라우저를 사용해 봅니다.
- Gateway를 계속 실행한 상태에서 브라우저 변경 후 같은 대시보드 URL을 확인합니다.

## 디버깅/테스트: 개발 서버 + 원격 Gateway

Control UI는 정적 파일이며, WebSocket 대상은 구성 가능하고 HTTP 출처와 다를 수 있습니다. 로컬에서는 Vite 개발 서버를 사용하고 Gateway는 다른 곳에서 실행하려는 경우 유용합니다.

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
  <Accordion title="참고">
    - `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서 제거됩니다.
    - `gatewayUrl`을 통해 전체 `ws://` 또는 `wss://` 엔드포인트를 전달하는 경우, 브라우저가 쿼리 문자열을 올바르게 파싱하도록 `gatewayUrl` 값을 URL 인코딩하세요.
    - 가능하면 `token`은 URL 프래그먼트(`#token=...`)를 통해 전달해야 합니다. 프래그먼트는 서버로 전송되지 않으므로 요청 로그와 Referer 유출을 방지합니다. 레거시 `?token=` 쿼리 매개변수는 호환성을 위해 여전히 한 번 가져오지만, fallback으로만 사용되며 bootstrap 직후 즉시 제거됩니다.
    - `password`는 메모리에만 보관됩니다.
    - `gatewayUrl`이 설정되면 UI는 구성이나 환경 자격 증명으로 fallback하지 않습니다. `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류입니다.
    - Gateway가 TLS 뒤에 있을 때(Tailscale Serve, HTTPS 프록시 등)는 `wss://`를 사용하세요.
    - `gatewayUrl`은 클릭재킹을 방지하기 위해 최상위 창(임베드되지 않은 창)에서만 허용됩니다.
    - 공개 non-loopback Control UI 배포는 `gateway.controlUi.allowedOrigins`를 명시적으로 설정해야 합니다(전체 출처). loopback, RFC1918/link-local, `.local`, `.ts.net`, 또는 Tailscale CGNAT 호스트에서 로드되는 비공개 same-origin LAN/Tailnet은 Host-header fallback을 활성화하지 않아도 허용됩니다.
    - Gateway 시작 시 유효한 런타임 바인드와 포트에서 `http://localhost:<port>` 및 `http://127.0.0.1:<port>` 같은 로컬 출처를 시드할 수 있지만, 원격 브라우저 출처에는 여전히 명시적 항목이 필요합니다.
    - 엄격하게 제어되는 로컬 테스트를 제외하고 `gateway.controlUi.allowedOrigins: ["*"]`를 사용하지 마세요. 이는 "내가 사용하는 호스트와 일치"가 아니라, 모든 브라우저 출처를 허용한다는 뜻입니다.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host-header 출처 fallback 모드를 활성화하지만, 위험한 보안 모드입니다.

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
