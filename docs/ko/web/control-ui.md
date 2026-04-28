---
read_when:
    - 브라우저에서 Gateway를 운영하려는 경우
    - SSH 터널 없이 Tailnet 액세스를 사용하려는 경우
sidebarTitle: Control UI
summary: Gateway용 브라우저 기반 Control UI (채팅, 노드, 구성)
title: Control UI
x-i18n:
    generated_at: "2026-04-26T11:41:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

Control UI는 Gateway가 제공하는 작은 **Vite + Lit** 단일 페이지 앱입니다.

- 기본값: `http://<host>:18789/`
- 선택적 prefix: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

같은 포트에서 **직접 Gateway WebSocket**과 통신합니다.

## 빠른 열기 (로컬)

Gateway가 같은 컴퓨터에서 실행 중이라면 다음을 여세요.

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지가 열리지 않으면 먼저 Gateway를 시작하세요: `openclaw gateway`.

인증은 WebSocket handshake 중 다음 방식으로 전달됩니다.

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때의 Tailscale Serve identity header
- `gateway.auth.mode: "trusted-proxy"`일 때의 trusted-proxy identity header

대시보드 설정 패널은 현재 브라우저 탭 세션과 선택된 gateway URL에 대해 token을 유지하지만, password는 저장하지 않습니다. 온보딩은 보통 첫 연결 시 shared-secret 인증용 gateway token을 생성하지만, `gateway.auth.mode`가 `"password"`일 때는 password 인증도 동작합니다.

## device pairing (첫 연결)

새 브라우저나 device에서 Control UI에 연결하면, Gateway는 보통 **일회성 pairing 승인**을 요구합니다. 이것은 무단 액세스를 방지하기 위한 보안 조치입니다.

**표시되는 메시지:** "disconnected (1008): pairing required"

<Steps>
  <Step title="대기 중인 요청 목록 보기">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="request ID로 승인">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

브라우저가 변경된 auth 세부 정보(역할/범위/public key)로 pairing을 다시 시도하면, 이전 대기 요청은 대체되고 새 `requestId`가 생성됩니다. 승인 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 pairing된 상태에서 읽기 권한에서 쓰기/admin 권한으로 변경하면, 이는 조용한 재연결이 아니라 승인 업그레이드로 처리됩니다. OpenClaw는 기존 승인을 유지하고 더 넓은 범위의 재연결을 차단한 뒤, 새 scope 집합을 명시적으로 승인하라고 요청합니다.

한 번 승인되면 device는 기억되며, `openclaw devices revoke --device <id> --role <role>`로 취소하지 않는 한 재승인이 필요하지 않습니다. token 순환과 취소는 [Devices CLI](/ko/cli/devices)를 참고하세요.

<Note>
- 직접적인 로컬 loopback 브라우저 연결(`127.0.0.1` / `localhost`)은 자동 승인됩니다.
- `gateway.auth.allowTailscale: true`이고 Tailscale identity가 검증되며 브라우저가 device identity를 제시하면, Tailscale Serve는 Control UI operator 세션에서 pairing 왕복 과정을 건너뛸 수 있습니다.
- 직접 Tailnet bind, LAN 브라우저 연결, device identity가 없는 브라우저 프로필은 여전히 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 device ID를 생성하므로, 브라우저를 바꾸거나 브라우저 데이터를 지우면 다시 pairing해야 합니다.

</Note>

## 개인 identity (브라우저 로컬)

Control UI는 공유 세션에서 발신 메시지의 작성자 표시를 위해 브라우저별 개인 identity(표시 이름 및 아바타)를 지원합니다. 이는 브라우저 저장소에 저장되며, 현재 브라우저 프로필 범위에만 적용되고, 실제로 보낸 메시지의 일반 transcript 작성자 메타데이터 외에는 다른 device와 동기화되거나 서버 측에 저장되지 않습니다. 사이트 데이터를 지우거나 브라우저를 바꾸면 비어 있는 상태로 초기화됩니다.

같은 브라우저 로컬 패턴은 assistant 아바타 재정의에도 적용됩니다. 업로드한 assistant 아바타는 gateway가 해석한 identity 위에 현재 로컬 브라우저에서만 덮어씌워지며 `config.patch`를 통해 왕복되지 않습니다. 공용 `ui.assistant.avatar` config 필드는 여전히, 이 필드를 직접 쓰는 비-UI 클라이언트(예: 스크립트된 gateway 또는 사용자 정의 대시보드)를 위해 사용할 수 있습니다.

## 런타임 config 엔드포인트

Control UI는 `/__openclaw/control-ui-config.json`에서 런타임 설정을 가져옵니다. 이 엔드포인트는 다른 HTTP 표면과 동일한 gateway 인증으로 보호됩니다. 인증되지 않은 브라우저는 이를 가져올 수 없으며, 성공적인 fetch에는 유효한 gateway token/password, Tailscale Serve identity 또는 trusted-proxy identity 중 하나가 필요합니다.

## 언어 지원

Control UI는 처음 로드될 때 브라우저 locale을 기반으로 스스로 현지화할 수 있습니다. 이후 수동으로 바꾸려면 **Overview -> Gateway Access -> Language**를 여세요. locale 선택기는 Appearance가 아니라 Gateway Access 카드에 있습니다.

- 지원 locale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 영어가 아닌 번역은 브라우저에서 지연 로드됩니다.
- 선택한 locale은 브라우저 저장소에 저장되어 다음 방문에도 재사용됩니다.
- 번역 키가 없으면 영어로 폴백됩니다.

## 현재 할 수 있는 일

<AccordionGroup>
  <Accordion title="채팅 및 Talk">
    - Gateway WS를 통해 모델과 채팅 (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
    - 브라우저에서 WebRTC를 통해 OpenAI Realtime에 직접 연결해 Talk 모드 사용. Gateway는 `talk.realtime.session`으로 짧은 수명의 Realtime client secret을 발급하고, 브라우저는 마이크 오디오를 직접 OpenAI로 전송하며 `openclaw_agent_consult` 도구 호출은 더 큰 구성형 OpenClaw 모델을 위해 `chat.send`를 통해 다시 릴레이합니다.
    - Chat에서 도구 호출 + 라이브 도구 출력 카드 스트리밍(에이전트 이벤트)

  </Accordion>
  <Accordion title="채널, 인스턴스, 세션, Dreams">
    - Channels: 기본 제공 및 번들/외부 Plugin channel 상태, QR 로그인, channel별 config (`channels.status`, `web.login.*`, `config.patch`)
    - Instances: presence 목록 + 새로 고침 (`system-presence`)
    - Sessions: 목록 + 세션별 모델/thinking/fast/verbose/trace/reasoning 재정의 (`sessions.list`, `sessions.patch`)
    - Dreams: Dreaming 상태, 활성화/비활성화 토글, Dream Diary 읽기 (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)

  </Accordion>
  <Accordion title="Cron, Skills, 노드, exec 승인">
    - Cron 작업: 목록/추가/편집/실행/활성화/비활성화 + 실행 기록 (`cron.*`)
    - Skills: 상태, 활성화/비활성화, 설치, API key 업데이트 (`skills.*`)
    - Nodes: 목록 + capability (`node.list`)
    - Exec 승인: `exec host=gateway/node`에 대한 gateway 또는 node allowlist + ask 정책 편집 (`exec.approvals.*`)

  </Accordion>
  <Accordion title="구성">
    - `~/.openclaw/openclaw.json` 보기/편집 (`config.get`, `config.set`)
    - 검증과 함께 적용 + 재시작 (`config.apply`) 및 마지막 활성 세션 깨우기
    - 쓰기에는 동시 편집 덮어쓰기를 방지하는 base-hash guard가 포함됩니다.
    - 쓰기(`config.set`/`config.apply`/`config.patch`)는 편집 저장 전에 제출된 config payload 안의 활성 SecretRef 해석 가능성에 대한 사전 검사를 수행하며, 해석되지 않는 활성 ref는 쓰기 전에 거부됩니다.
    - Schema + 폼 렌더링 (`config.schema` / `config.schema.lookup`, 필드 `title` / `description`, 일치하는 UI 힌트, 즉시 하위 항목 요약, 중첩 object/wildcard/array/composition 노드의 문서 메타데이터, 사용 가능 시 Plugin + channel schema 포함). 안전한 raw 왕복이 가능한 스냅샷에서만 Raw JSON editor를 사용할 수 있습니다.
    - 스냅샷이 raw 텍스트로 안전하게 왕복할 수 없으면, Control UI는 Form 모드를 강제하고 해당 스냅샷에 대해 Raw 모드를 비활성화합니다.
    - Raw JSON editor의 "Reset to saved"는 평탄화된 스냅샷을 다시 렌더링하는 대신 raw로 작성된 형태(포맷, 주석, `$include` 레이아웃)를 유지하므로, 스냅샷이 안전하게 왕복 가능한 경우 외부 편집 내용이 reset 후에도 살아남습니다.
    - 구조화된 SecretRef 객체 값은 실수로 객체가 문자열로 손상되는 것을 방지하기 위해 폼 텍스트 입력에서 읽기 전용으로 렌더링됩니다.

  </Accordion>
  <Accordion title="디버그, 로그, 업데이트">
    - Debug: 상태/헬스/모델 스냅샷 + 이벤트 로그 + 수동 RPC 호출 (`status`, `health`, `models.list`)
    - Logs: 필터/내보내기 기능이 있는 gateway 파일 로그 실시간 tail (`logs.tail`)
    - Update: 패키지/git 업데이트 + 재시작 실행 (`update.run`) 및 재시작 보고서

  </Accordion>
  <Accordion title="Cron 작업 패널 참고">
    - 격리된 작업의 경우 전달 기본값은 요약 알림입니다. 내부 전용 실행을 원하면 none으로 바꿀 수 있습니다.
    - announce가 선택되면 channel/target 필드가 표시됩니다.
    - Webhook 모드는 `delivery.mode = "webhook"`을 사용하고 `delivery.to`에 유효한 HTTP(S) Webhook URL을 설정합니다.
    - main-session 작업의 경우 webhook과 none 전달 모드를 모두 사용할 수 있습니다.
    - 고급 편집 제어에는 delete-after-run, clear agent override, cron exact/stagger 옵션, agent model/thinking 재정의, best-effort 전달 토글이 포함됩니다.
    - 폼 검증은 필드별 오류와 함께 인라인으로 동작하며, 잘못된 값이 있으면 수정할 때까지 저장 버튼이 비활성화됩니다.
    - 전용 bearer token을 보내려면 `cron.webhookToken`을 설정하세요. 생략하면 Webhook은 auth header 없이 전송됩니다.
    - deprecated 폴백: `notify: true`가 저장된 레거시 작업은 마이그레이션 전까지 여전히 `cron.webhook`을 사용할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 채팅 동작

<AccordionGroup>
  <Accordion title="전송 및 기록 의미">
    - `chat.send`는 **논블로킹**입니다. 즉시 `{ runId, status: "started" }`로 ack를 반환하고, 응답은 `chat` 이벤트를 통해 스트리밍됩니다.
    - 같은 `idempotencyKey`로 다시 보내면 실행 중에는 `{ status: "in_flight" }`, 완료 후에는 `{ status: "ok" }`를 반환합니다.
    - `chat.history` 응답은 UI 안전을 위해 크기 제한이 있습니다. transcript 항목이 너무 크면 Gateway는 긴 텍스트 필드를 자르고, 무거운 메타데이터 블록을 생략하며, 과도하게 큰 메시지를 placeholder(`[chat.history omitted: message too large]`)로 대체할 수 있습니다.
    - assistant/생성 image는 관리형 미디어 참조로 저장되고 인증된 Gateway 미디어 URL을 통해 다시 제공되므로, reload가 채팅 기록 응답에 raw base64 image payload가 남아 있는지에 의존하지 않습니다.
    - `chat.history`는 또한 보이는 assistant 텍스트에서 표시 전용 인라인 directive 태그(예: `[[reply_to_*]]`, `[[audio_as_voice]]`), 일반 텍스트 도구 호출 XML payload(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함), 누출된 ASCII/전각 모델 제어 토큰을 제거하고, 전체 보이는 텍스트가 정확히 `NO_REPLY` / `no_reply`인 assistant 항목은 생략합니다.
    - 활성 send 중과 최종 history 새로 고침 중에 `chat.history`가 잠시 더 오래된 스냅샷을 반환하더라도, 채팅 뷰는 로컬 낙관적 user/assistant 메시지를 계속 표시합니다. Gateway history가 따라잡으면 canonical transcript가 로컬 메시지를 대체합니다.
    - `chat.inject`는 세션 transcript에 assistant note를 추가하고 UI 전용 업데이트를 위해 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, channel 전달 없음).
    - 채팅 헤더의 모델 및 thinking 선택기는 `sessions.patch`를 통해 활성 세션에 즉시 patch됩니다. 이들은 한 턴 전용 전송 옵션이 아니라 지속적인 세션 재정의입니다.
    - 최신 Gateway 세션 사용량 보고가 높은 컨텍스트 압박을 보여주면, 채팅 입력 영역은 context notice를 표시하고, 권장 Compaction 수준에서는 일반 세션 Compaction 경로를 실행하는 compact 버튼을 표시합니다. 오래된 토큰 스냅샷은 Gateway가 새 사용량을 다시 보고할 때까지 숨겨집니다.

  </Accordion>
  <Accordion title="Talk 모드 (브라우저 WebRTC)">
    Talk 모드는 브라우저 WebRTC 세션을 지원하는 등록된 실시간 음성 provider를 사용합니다. `talk.provider: "openai"`와 `talk.providers.openai.apiKey`로 OpenAI를 구성하거나 Voice Call 실시간 provider config를 재사용하세요. 브라우저는 표준 OpenAI API key를 받지 않고 ephemeral Realtime client secret만 받습니다. Google Live 실시간 음성은 백엔드 Voice Call 및 Google Meet 브리지에서는 지원되지만, 이 브라우저 WebRTC 경로에서는 아직 지원되지 않습니다. Realtime 세션 프롬프트는 Gateway가 구성하며, `talk.realtime.session`은 호출자 제공 지침 재정의를 허용하지 않습니다.

    채팅 입력창에서 Talk 제어는 마이크 받아쓰기 버튼 옆의 파도 모양 버튼입니다. Talk가 시작되면, 입력창 상태 줄에 먼저 `Connecting Talk...`가 표시되고, 오디오가 연결되면 `Talk live`, 실시간 도구 호출이 `chat.send`를 통해 구성된 더 큰 OpenClaw 모델에 질의 중일 때는 `Asking OpenClaw...`가 표시됩니다.

  </Accordion>
  <Accordion title="중지 및 abort">
    - **Stop**을 클릭합니다(`chat.abort` 호출).
    - 실행 중에는 일반 후속 메시지가 큐에 들어갑니다. 큐에 있는 메시지의 **Steer**를 클릭하면 그 후속 메시지가 현재 실행 중인 턴에 주입됩니다.
    - `/stop`을 입력하거나(또는 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 독립형 abort 구문) 대역 외 중지를 수행합니다.
    - `chat.abort`는 `{ sessionKey }`(`runId` 없이)를 지원하며, 해당 세션의 모든 활성 실행을 중지합니다.

  </Accordion>
  <Accordion title="Abort 부분 보존">
    - 실행이 중단되면, 부분적인 assistant 텍스트가 UI에 계속 표시될 수 있습니다.
    - Gateway는 버퍼링된 출력이 존재할 때 중단된 부분 assistant 텍스트를 transcript 기록에 저장합니다.
    - 저장된 항목에는 abort 메타데이터가 포함되므로 transcript 소비자는 abort 부분 출력과 정상 완료 출력을 구분할 수 있습니다.

  </Accordion>
</AccordionGroup>

## PWA 설치 및 Web Push

Control UI는 `manifest.webmanifest`와 service worker를 제공하므로, 최신 브라우저에서는 이를 독립형 PWA로 설치할 수 있습니다. Web Push를 사용하면 탭이나 브라우저 창이 열려 있지 않아도 Gateway가 설치된 PWA를 알림으로 깨울 수 있습니다.

| 표면                                                  | 역할                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `ui/public/manifest.webmanifest`                      | PWA manifest. 접근 가능해지면 브라우저가 "앱 설치"를 제안합니다.      |
| `ui/public/sw.js`                                     | `push` 이벤트와 알림 클릭을 처리하는 service worker                  |
| `push/vapid-keys.json` (OpenClaw 상태 디렉터리 아래)  | Web Push payload 서명에 사용되는 자동 생성 VAPID 키 쌍               |
| `push/web-push-subscriptions.json`                    | 저장된 브라우저 구독 엔드포인트                                      |

키를 고정하고 싶다면(멀티 호스트 배포, 비밀 정보 교체, 테스트 등) Gateway 프로세스의 env var를 통해 VAPID 키 쌍을 재정의하세요.

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (기본값: `mailto:openclaw@localhost`)

Control UI는 브라우저 구독 등록 및 테스트를 위해 다음 scope-gated Gateway 메서드를 사용합니다.

- `push.web.vapidPublicKey` — 활성 VAPID 공개 키를 가져옵니다.
- `push.web.subscribe` — `endpoint`와 `keys.p256dh`/`keys.auth`를 등록합니다.
- `push.web.unsubscribe` — 등록된 endpoint를 제거합니다.
- `push.web.test` — 호출자의 구독으로 테스트 알림을 보냅니다.

<Note>
Web Push는 iOS APNS relay 경로와는 독립적입니다(relay 기반 push는 [Configuration](/ko/gateway/configuration) 참고). 또한 기존 `push.test` 메서드와도 별개이며, 이 메서드는 기본 모바일 pairing을 대상으로 합니다.
</Note>

## 호스팅된 embed

assistant 메시지는 `[embed ...]` shortcode를 사용해 호스팅된 웹 콘텐츠를 인라인으로 렌더링할 수 있습니다. iframe sandbox 정책은 `gateway.controlUi.embedSandbox`로 제어됩니다.

<Tabs>
  <Tab title="strict">
    호스팅된 embed 내부에서 스크립트 실행을 비활성화합니다.
  </Tab>
  <Tab title="scripts (기본값)">
    인터랙티브 embed를 허용하면서 origin 격리는 유지합니다. 이것이 기본값이며, 일반적으로 자체 포함형 브라우저 게임/위젯에는 충분합니다.
  </Tab>
  <Tab title="trusted">
    의도적으로 더 강한 권한이 필요한 same-site 문서에 대해 `allow-scripts` 위에 `allow-same-origin`을 추가합니다.
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
내장된 문서가 정말로 same-origin 동작을 필요로 하는 경우에만 `trusted`를 사용하세요. 대부분의 에이전트 생성 게임 및 인터랙티브 캔버스에는 `scripts`가 더 안전한 선택입니다.
</Warning>

절대 외부 `http(s)` embed URL은 기본적으로 계속 차단됩니다. `[embed url="https://..."]`로 타사 페이지를 의도적으로 로드하려면 `gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## Tailnet 액세스 (권장)

<Tabs>
  <Tab title="통합 Tailscale Serve (권장)">
    Gateway를 loopback에 유지하고 Tailscale Serve가 HTTPS로 이를 프록시하도록 하세요.

    ```bash
    openclaw gateway --tailscale serve
    ```

    다음을 엽니다.

    - `https://<magicdns>/` (또는 구성된 `gateway.controlUi.basePath`)

    기본적으로 `gateway.auth.allowTailscale`가 `true`이면 Control UI/WebSocket Serve 요청은 Tailscale identity header(`tailscale-user-login`)를 통해 인증될 수 있습니다. OpenClaw는 `tailscale whois`로 `x-forwarded-for` 주소를 해석하여 identity를 검증하고 헤더와 일치하는지 확인하며, 요청이 Tailscale의 `x-forwarded-*` 헤더와 함께 loopback에 도달했을 때만 이를 허용합니다. 브라우저 device identity가 있는 Control UI operator 세션의 경우, 이 검증된 Serve 경로는 device-pairing 왕복도 건너뜁니다. device identity가 없는 브라우저와 node-role 연결은 여전히 일반적인 device 검사를 따릅니다. Serve 트래픽에도 명시적인 shared-secret 자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음 `gateway.auth.mode: "token"` 또는 `"password"`를 사용하세요.

    이 비동기 Serve identity 경로에서는 같은 클라이언트 IP와 auth scope에 대한 실패한 인증 시도가 rate-limit 기록 전에 직렬화됩니다. 따라서 같은 브라우저에서 동시에 잘못된 재시도를 하면, 두 개의 단순 불일치가 병렬로 경쟁하는 대신 두 번째 요청에서 `retry later`가 표시될 수 있습니다.

    <Warning>
    token 없는 Serve 인증은 gateway 호스트가 신뢰된다는 가정하에 동작합니다. 해당 호스트에서 신뢰할 수 없는 로컬 코드가 실행될 수 있다면 token/password 인증을 요구하세요.
    </Warning>

  </Tab>
  <Tab title="tailnet에 bind + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    그런 다음 다음을 엽니다.

    - `http://<tailscale-ip>:18789/` (또는 구성된 `gateway.controlUi.basePath`)

    UI 설정에 일치하는 shared secret을 붙여넣으세요(`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

  </Tab>
</Tabs>

## 보안되지 않은 HTTP

대시보드를 일반 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 열면 브라우저는 **비보안 컨텍스트**에서 동작하며 WebCrypto를 차단합니다. 기본적으로 OpenClaw는 device identity가 없는 Control UI 연결을 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 통한 localhost 전용 비보안 HTTP 호환성
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 operator Control UI 인증
- 비상용 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 해결책:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 여세요.

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway 호스트에서)

<AccordionGroup>
  <Accordion title="비보안 auth 토글 동작">
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

    - 비보안 HTTP 컨텍스트의 localhost Control UI 세션이 device identity 없이도 진행되도록 허용합니다.
    - pairing 검사를 우회하지 않습니다.
    - 원격(non-localhost) device identity 요구 사항을 완화하지 않습니다.

  </Accordion>
  <Accordion title="비상 전용">
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
    `dangerouslyDisableDeviceAuth`는 Control UI device identity 검사를 비활성화하며 심각한 보안 저하입니다. 비상 사용 후에는 빠르게 원상복구하세요.
    </Warning>

  </Accordion>
  <Accordion title="Trusted-proxy 참고">
    - 성공적인 trusted-proxy 인증은 device identity 없이도 **operator** Control UI 세션을 허용할 수 있습니다.
    - 이는 node-role Control UI 세션에는 확장되지 않습니다.
    - 같은 호스트의 loopback reverse proxy는 여전히 trusted-proxy 인증을 만족하지 않습니다. [Trusted proxy auth](/ko/gateway/trusted-proxy-auth)를 참고하세요.

  </Accordion>
</AccordionGroup>

HTTPS 설정 가이드는 [Tailscale](/ko/gateway/tailscale)를 참고하세요.

## Content Security Policy

Control UI는 엄격한 `img-src` 정책을 제공합니다. **same-origin** 자산, `data:` URL, 로컬에서 생성된 `blob:` URL만 허용됩니다. 원격 `http(s)` 및 프로토콜 상대 image URL은 브라우저가 거부하며 네트워크 fetch를 발생시키지 않습니다.

실제로 의미하는 바:

- 상대 경로(예: `/avatars/<id>`) 아래에서 제공되는 아바타와 이미지는 계속 렌더링되며, UI가 가져와 로컬 `blob:` URL로 변환하는 인증된 아바타 경로도 포함됩니다.
- 인라인 `data:image/...` URL은 계속 렌더링됩니다(프로토콜 내부 payload에 유용).
- Control UI가 생성한 로컬 `blob:` URL은 계속 렌더링됩니다.
- channel 메타데이터에서 나온 원격 아바타 URL은 Control UI의 아바타 helper에서 제거되고 기본 로고/배지로 대체되므로, 손상되었거나 악의적인 channel이 operator 브라우저에서 임의의 원격 image fetch를 강제할 수 없습니다.

이 동작을 사용하기 위해 별도 변경은 필요 없습니다. 항상 활성화되어 있으며 구성할 수 없습니다.

## Avatar 경로 인증

gateway 인증이 구성되어 있으면, Control UI 아바타 엔드포인트는 나머지 API와 동일한 gateway token을 요구합니다.

- `GET /avatar/<agentId>`는 인증된 호출자에게만 아바타 이미지를 반환합니다. `GET /avatar/<agentId>?meta=1`은 같은 규칙 아래에서 아바타 메타데이터를 반환합니다.
- 두 경로 모두 인증되지 않은 요청은 거부됩니다(형제 assistant-media 경로와 동일). 이렇게 하면 다른 부분이 보호되는 호스트에서 아바타 경로를 통한 agent identity 유출을 방지할 수 있습니다.
- Control UI 자체는 아바타를 가져올 때 gateway token을 bearer header로 전달하고 인증된 blob URL을 사용하므로, 대시보드에서 이미지가 계속 렌더링됩니다.

gateway 인증을 비활성화하면(공유 호스트에서는 권장하지 않음), 아바타 경로도 gateway의 나머지 부분과 마찬가지로 인증 없이 접근 가능해집니다.

## UI 빌드

Gateway는 `dist/control-ui`의 정적 파일을 제공합니다. 다음으로 빌드하세요.

```bash
pnpm ui:build
```

선택적 절대 base(고정 자산 URL이 필요할 때):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 dev 서버):

```bash
pnpm ui:dev
```

그런 다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키도록 하세요.

## 디버깅/테스트: dev 서버 + 원격 Gateway

Control UI는 정적 파일이며, WebSocket 대상은 구성 가능하고 HTTP origin과 달라도 됩니다. 이는 Vite dev 서버는 로컬에서 실행하고 Gateway는 다른 곳에서 실행할 때 유용합니다.

<Steps>
  <Step title="UI dev 서버 시작">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="gatewayUrl로 열기">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    선택적 일회성 인증(필요한 경우):

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="참고">
    - `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서는 제거됩니다.
    - 가능하면 `token`은 URL fragment(`#token=...`)를 통해 전달해야 합니다. fragment는 서버로 전송되지 않으므로 요청 로그와 Referer 유출을 피할 수 있습니다. 레거시 `?token=` 쿼리 매개변수도 호환성을 위해 한 번은 가져오지만, 폴백으로만 사용되며 bootstrap 직후 즉시 제거됩니다.
    - `password`는 메모리에만 유지됩니다.
    - `gatewayUrl`이 설정되면 UI는 config 또는 환경 자격 증명으로 폴백하지 않습니다. `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류입니다.
    - Gateway가 TLS 뒤에 있을 때는 `wss://`를 사용하세요(Tailscale Serve, HTTPS 프록시 등).
    - `gatewayUrl`은 클릭재킹 방지를 위해 최상위 창에서만 허용됩니다(embedded 불가).
    - loopback이 아닌 Control UI 배포는 반드시 `gateway.controlUi.allowedOrigins`를 명시적으로 설정해야 합니다(전체 origin). 원격 dev 구성도 여기에 포함됩니다.
    - Gateway 시작 시 유효 런타임 bind와 포트를 기준으로 `http://localhost:<port>` 및 `http://127.0.0.1:<port>` 같은 로컬 origin을 자동 추가할 수 있지만, 원격 브라우저 origin은 여전히 명시적으로 추가해야 합니다.
    - `gateway.controlUi.allowedOrigins: ["*"]`는 엄격히 통제된 로컬 테스트가 아닌 경우 사용하지 마세요. 이것은 "현재 사용 중인 호스트와 일치"가 아니라 "모든 브라우저 origin 허용"을 의미합니다.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는 Host-header origin 폴백 모드를 활성화하지만, 이는 위험한 보안 모드입니다.

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

원격 액세스 설정 세부 정보: [Remote access](/ko/gateway/remote)

## 관련 항목

- [Dashboard](/ko/web/dashboard) — gateway 대시보드
- [Health Checks](/ko/gateway/health) — gateway 상태 모니터링
- [TUI](/ko/web/tui) — 터미널 사용자 인터페이스
- [WebChat](/ko/web/webchat) — 브라우저 기반 채팅 인터페이스
