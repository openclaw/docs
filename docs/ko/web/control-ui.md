---
read_when:
    - 브라우저에서 Gateway를 운영하려고 합니다
    - SSH 터널 없이 Tailnet 액세스를 원합니다
summary: Gateway용 브라우저 기반 제어 UI(채팅, nodes, 구성)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T18:23:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 29d77ae57e32abe5ad25b2c22986d9d8e67f7ac183af06e8ffc4907ae4e6c0bc
    source_path: web/control-ui.md
    workflow: 15
---

Control UI는 Gateway가 제공하는 작은 **Vite + Lit** 단일 페이지 앱입니다:

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

같은 포트에서 **Gateway WebSocket에 직접 연결**합니다.

## 빠르게 열기(로컬)

Gateway가 같은 컴퓨터에서 실행 중이라면 다음을 여세요:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지가 로드되지 않으면 먼저 Gateway를 시작하세요: `openclaw gateway`.

auth는 WebSocket 핸드셰이크 중 다음을 통해 제공됩니다:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때의 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때의 trusted-proxy ID 헤더

대시보드 설정 패널은 현재 브라우저 탭 세션과 선택된 Gateway URL에 대한
토큰을 유지하며, 비밀번호는 저장되지 않습니다. 온보딩은 일반적으로 첫 연결 시
공유 비밀 auth용 Gateway 토큰을 생성하지만,
`gateway.auth.mode`가 `"password"`일 때는 비밀번호 auth도 작동합니다.

## 기기 페어링(첫 연결)

새 브라우저 또는 기기에서 Control UI에 연결하면 Gateway는
**일회성 페어링 승인**을 요구합니다 — 같은 Tailnet에 있고
`gateway.auth.allowTailscale: true`인 경우에도 마찬가지입니다. 이것은 무단 액세스를
방지하기 위한 보안 조치입니다.

**표시되는 메시지:** "disconnected (1008): pairing required"

**기기 승인 방법:**

```bash
# 대기 중인 요청 나열
openclaw devices list

# 요청 ID로 승인
openclaw devices approve <requestId>
```

브라우저가 변경된 auth 세부 정보(role/scopes/public
key)로 페어링을 다시 시도하면 이전 대기 요청은 대체되고 새 `requestId`가
생성됩니다. 승인 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 페어링되어 있고 이를 읽기 액세스에서
쓰기/admin 액세스로 변경하면, 이는 조용한 재연결이 아니라 승인 업그레이드로 처리됩니다.
OpenClaw는 기존 승인을 유지하고, 더 넓은 범위의 재연결을 차단하며,
새 범위 세트를 명시적으로 승인하도록 요청합니다.

한 번 승인되면 기기가 기억되며,
`openclaw devices revoke --device <id> --role <role>`로 취소하지 않는 한 다시 승인할 필요가 없습니다. 토큰 회전 및 취소는
[Devices CLI](/ko/cli/devices)를 참조하세요.

**참고 사항:**

- 직접적인 로컬 loopback 브라우저 연결(`127.0.0.1` / `localhost`)은
  자동 승인됩니다.
- Tailnet 및 LAN 브라우저 연결은 같은 머신에서 시작되더라도
  여전히 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 기기 ID를 생성하므로, 브라우저를 변경하거나
  브라우저 데이터를 지우면 다시 페어링해야 합니다.

## 개인 ID(브라우저 로컬)

Control UI는 공유 세션에서 귀속 표시를 위해 아웃바운드 메시지에 첨부되는
브라우저별 개인 ID(표시 이름 및
아바타)를 지원합니다. 이는 브라우저 저장소에 저장되고, 현재 브라우저 프로필 범위로 제한되며,
다른 기기와 동기화되지 않고, 실제로 전송한 메시지의 일반적인 transcript
작성자 메타데이터 외에는 서버 측에 저장되지 않습니다.
사이트 데이터를 지우거나 브라우저를 바꾸면 빈 상태로 재설정됩니다.

동일한 브라우저 로컬 패턴이 assistant 아바타 override에도 적용됩니다.
업로드된 assistant 아바타는 로컬 브라우저에서만 Gateway가 해석한 ID 위에 덧씌워지며
`config.patch`를 통해 왕복되지 않습니다. 공유
`ui.assistant.avatar` config 필드는 여전히 해당 필드를 직접 쓰는 비 UI 클라이언트(예: 스크립트된 Gateway 또는 사용자 지정 대시보드)에서 사용할 수 있습니다.

## 런타임 config 엔드포인트

Control UI는 런타임 설정을
`/__openclaw/control-ui-config.json`에서 가져옵니다. 이 엔드포인트는 나머지
HTTP 표면과 동일한 Gateway auth로 보호됩니다. 인증되지 않은 브라우저는 이를
가져올 수 없고, 성공적인 가져오기를 위해서는 이미 유효한 Gateway
토큰/비밀번호, Tailscale Serve ID 또는 trusted-proxy ID가 필요합니다.

## 언어 지원

Control UI는 첫 로드 시 브라우저 로캘에 따라 자체적으로 현지화될 수 있습니다.
나중에 이를 override하려면 **개요 -> Gateway Access -> 언어**를 여세요.
로캘 선택기는 Appearance 아래가 아니라 Gateway Access 카드에 있습니다.

- 지원되는 로캘: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 영어가 아닌 번역은 브라우저에서 lazy-load됩니다.
- 선택한 로캘은 브라우저 저장소에 저장되며 이후 방문 시 재사용됩니다.
- 번역 키가 없으면 영어로 fallback합니다.

## 현재 가능한 작업

- Gateway WS를 통한 모델과 채팅 (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- 브라우저에서 WebRTC를 통해 OpenAI Realtime과 직접 통신. Gateway는
  `talk.realtime.session`으로 수명이 짧은 Realtime 클라이언트 시크릿을 발급하고, 브라우저는
  마이크 오디오를 OpenAI로 직접 보내며
  `openclaw_agent_consult` 도구 호출을 더 큰 구성된 OpenClaw 모델용 `chat.send`를 통해 다시 전달합니다.
- 채팅에서 도구 호출 + 실시간 도구 출력 카드 스트리밍(에이전트 이벤트)
- 채널: 기본 제공 채널 및 번들/외부 Plugin 채널의 상태, QR 로그인, 채널별 config (`channels.status`, `web.login.*`, `config.patch`)
- 인스턴스: 존재 목록 + 새로 고침 (`system-presence`)
- 세션: 목록 + 세션별 모델/thinking/fast/verbose/trace/reasoning override (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming 상태, 활성화/비활성화 토글, Dream Diary 읽기(`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron 작업: 목록/추가/편집/실행/활성화/비활성화 + 실행 기록 (`cron.*`)
- Skills: 상태, 활성화/비활성화, 설치, API 키 업데이트 (`skills.*`)
- Nodes: 목록 + cap (`node.list`)
- Exec 승인: `exec host=gateway/node`용 Gateway 또는 Node 허용 목록 + ask 정책 편집 (`exec.approvals.*`)
- Config: `~/.openclaw/openclaw.json` 보기/편집 (`config.get`, `config.set`)
- Config: 유효성 검사와 함께 적용 + 재시작(`config.apply`) 및 마지막 활성 세션 깨우기
- Config 쓰기에는 동시 편집 덮어쓰기를 방지하는 base-hash 가드가 포함됨
- Config 쓰기(`config.set`/`config.apply`/`config.patch`)는 제출된 config payload 내 ref에 대해 활성 SecretRef 해석도 사전 점검하며, 해석되지 않은 활성 제출 ref는 쓰기 전에 거부됨
- Config schema + 폼 렌더링 (`config.schema` / `config.schema.lookup`,
  필드 `title` / `description`, 일치하는 UI 힌트, 직접 하위 항목
  요약, 중첩 객체/와일드카드/배열/컴포지션 노드의 docs 메타데이터,
  그리고 사용 가능할 때 Plugin + 채널 schema 포함); Raw JSON 편집기는
  스냅샷이 안전한 raw 왕복을 지원할 때만 사용할 수 있음
- 스냅샷이 raw 텍스트를 안전하게 왕복할 수 없으면, Control UI는 Form 모드를 강제하고 해당 스냅샷에 대해 Raw 모드를 비활성화함
- Raw JSON 편집기의 "Reset to saved"는 평탄화된 스냅샷을 다시 렌더링하는 대신 raw 작성 형태(서식, 주석, `$include` 레이아웃)를 유지하므로, 스냅샷이 안전하게 왕복될 수 있을 때 외부 편집이 재설정 후에도 유지됨
- 구조화된 SecretRef 객체 값은 실수로 객체가 문자열로 손상되는 것을 방지하기 위해 폼 텍스트 입력에서 읽기 전용으로 렌더링됨
- 디버그: 상태/health/models 스냅샷 + 이벤트 로그 + 수동 RPC 호출 (`status`, `health`, `models.list`)
- 로그: 필터/내보내기가 가능한 Gateway 파일 로그 실시간 tail (`logs.tail`)
- 업데이트: 패키지/git 업데이트 + 재시작 실행 (`update.run`) 및 재시작 리포트

Cron 작업 패널 참고 사항:

- 격리된 작업의 경우 전달 기본값은 announce summary입니다. 내부 전용 실행을 원하면 none으로 전환할 수 있습니다.
- announce가 선택되면 channel/target 필드가 표시됩니다.
- Webhook 모드는 `delivery.mode = "webhook"`을 사용하며 `delivery.to`는 유효한 HTTP(S) Webhook URL로 설정됩니다.
- main-session 작업에는 webhook 및 none 전달 모드를 사용할 수 있습니다.
- 고급 편집 컨트롤에는 실행 후 삭제, agent override 지우기, Cron exact/stagger 옵션,
  agent model/thinking override, best-effort 전달 토글이 포함됩니다.
- 폼 유효성 검사는 필드 수준 오류와 함께 인라인으로 수행되며, 잘못된 값이 있으면 수정될 때까지 저장 버튼이 비활성화됩니다.
- 전용 bearer 토큰을 보내려면 `cron.webhookToken`을 설정하세요. 생략하면 Webhook은 auth 헤더 없이 전송됩니다.
- 지원 중단된 fallback: 저장된 레거시 작업 중 `notify: true`인 항목은 마이그레이션될 때까지 여전히 `cron.webhook`을 사용할 수 있습니다.

## 채팅 동작

- `chat.send`는 **논블로킹**입니다: 즉시 `{ runId, status: "started" }`로 ack를 반환하고 응답은 `chat` 이벤트를 통해 스트리밍됩니다.
- 동일한 `idempotencyKey`로 다시 보내면 실행 중에는 `{ status: "in_flight" }`를 반환하고, 완료 후에는 `{ status: "ok" }`를 반환합니다.
- `chat.history` 응답은 UI 안전을 위해 크기가 제한됩니다. transcript 항목이 너무 크면 Gateway는 긴 텍스트 필드를 잘라내고, 무거운 메타데이터 블록을 생략하며, 원시 transcript 덤프처럼 동작하는 대신 큰 메시지를 placeholder(`[chat.history omitted: message too large]`)로 대체할 수 있습니다.
- assistant/생성된 이미지는 관리형 미디어 참조로 저장되고 인증된 Gateway 미디어 URL을 통해 다시 제공되므로, 새로고침 시 채팅 기록 응답에 원시 base64 이미지 payload가 남아 있는지에 의존하지 않습니다.
- `chat.history`는 표시 전용 인라인 directive 태그(예: `[[reply_to_*]]` 및 `[[audio_as_voice]]`), 일반 텍스트 tool-call XML payload(`including <tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 그리고 잘린 tool-call 블록 포함), 유출된 ASCII/전각 모델 제어 토큰도 assistant 표시 텍스트에서 제거하며, 전체 표시 텍스트가 정확히 무음 토큰 `NO_REPLY` / `no_reply`뿐인 assistant 항목은 생략합니다.
- 활성 전송 중 및 최종 기록 새로고침 중에는 `chat.history`가 잠시 더 오래된 스냅샷을 반환하더라도 채팅 보기가 로컬의 낙관적 사용자/assistant 메시지를 계속 표시합니다. Gateway 기록이 따라잡으면 정식 transcript가 해당 로컬 메시지를 대체합니다.
- `chat.inject`는 assistant 메모를 세션 transcript에 추가하고 UI 전용 업데이트를 위해 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, 채널 전달 없음).
- 채팅 헤더의 모델 및 thinking 선택기는 `sessions.patch`를 통해 활성 세션을 즉시 패치합니다. 이것은 한 번의 턴에만 적용되는 전송 옵션이 아니라 지속적인 세션 override입니다.
- 최신 Gateway 세션 사용량 리포트가 높은 컨텍스트 압박을 보여주면 채팅 작성기 영역에 컨텍스트 알림이 표시되고, 권장 Compaction 수준에서는 일반 세션 Compaction 경로를 실행하는 compact 버튼이 표시됩니다. 오래된 토큰 스냅샷은 Gateway가 다시 최신 사용량을 보고할 때까지 숨겨집니다.
- Talk 모드는 브라우저 WebRTC 세션을 지원하는 등록된 realtime voice provider를 사용합니다. `talk.provider: "openai"`와 `talk.providers.openai.apiKey`로 OpenAI를 구성하거나, Voice Call realtime provider config를 재사용하세요. 브라우저는 표준 OpenAI API 키를 받지 않으며 수명이 짧은 Realtime 클라이언트 시크릿만 받습니다. Google Live realtime voice는 백엔드 Voice Call 및 Google Meet 브리지에서는 지원되지만, 이 브라우저 WebRTC 경로에서는 아직 지원되지 않습니다. Realtime 세션 프롬프트는 Gateway가 조립하며, `talk.realtime.session`은 호출자 제공 instruction override를 받지 않습니다.
- 채팅 작성기에서 Talk 컨트롤은 마이크 dictation 버튼 옆의 파형 버튼입니다. Talk가 시작되면 작성기 상태 행에 `Connecting Talk...`가 표시되고, 오디오가 연결된 동안에는 `Talk live`, realtime 도구 호출이 `chat.send`를 통해 구성된 더 큰 모델에 질의하는 동안에는 `Asking OpenClaw...`가 표시됩니다.
- 중지:
  - **Stop** 클릭(`chat.abort` 호출)
  - 실행이 활성 상태인 동안 일반 후속 메시지는 대기열에 들어갑니다. 대기 중인 메시지에서 **Steer**를 클릭하면 해당 후속 메시지를 실행 중인 턴에 주입합니다.
  - `/stop` 입력(또는 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 독립형 중단 구문)으로 대역 외 중단
  - `chat.abort`는 `{ sessionKey }`(`runId` 없음)를 지원하며 해당 세션의 모든 활성 실행을 중단합니다
- 중단 시 부분 유지:
  - 실행이 중단되면 UI에 assistant 부분 텍스트가 계속 표시될 수 있습니다
  - Gateway는 버퍼링된 출력이 있으면 중단된 assistant 부분 텍스트를 transcript 기록에 저장합니다
  - 저장된 항목에는 중단 메타데이터가 포함되므로 transcript 소비자는 중단된 부분 출력과 정상 완료 출력을 구분할 수 있습니다

## PWA 설치 및 웹 푸시

Control UI는 `manifest.webmanifest`와 서비스 워커를 제공하므로
최신 브라우저에서 독립형 PWA로 설치할 수 있습니다. Web Push를 사용하면
탭이나 브라우저 창이 열려 있지 않아도 Gateway가 알림으로 설치된 PWA를
깨울 수 있습니다.

| 표면                                                  | 기능                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                      | PWA manifest. 브라우저는 접근 가능해지면 "앱 설치"를 제안합니다.   |
| `ui/public/sw.js`                                     | `push` 이벤트와 알림 클릭을 처리하는 서비스 워커.                  |
| `push/vapid-keys.json` (OpenClaw 상태 디렉터리 아래) | Web Push payload 서명에 사용되는 자동 생성 VAPID 키 쌍.            |
| `push/web-push-subscriptions.json`                    | 저장된 브라우저 구독 endpoint.                                     |

키 고정이 필요한 경우(멀티 호스트 배포, 시크릿 교체 또는
테스트) Gateway 프로세스의 env var를 통해 VAPID 키 쌍을 override하세요:

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT`(기본값 `mailto:openclaw@localhost`)

Control UI는 브라우저 구독을 등록하고
테스트하기 위해 다음 범위 제한 Gateway 메서드를 사용합니다:

- `push.web.vapidPublicKey` — 활성 VAPID 공개 키를 가져옵니다.
- `push.web.subscribe` — `endpoint`와 `keys.p256dh`/`keys.auth`를 등록합니다.
- `push.web.unsubscribe` — 등록된 endpoint를 제거합니다.
- `push.web.test` — 호출자의 구독으로 테스트 알림을 전송합니다.

Web Push는 iOS APNS 릴레이 경로
([구성](/ko/gateway/configuration)의 릴레이 기반 푸시 참조) 및
기존 `push.test` 메서드와는 독립적이며, 후자는 네이티브 모바일 페어링을 대상으로 합니다.

## 호스팅된 embed

assistant 메시지는 `[embed ...]`
shortcode로 호스팅된 웹 콘텐츠를 인라인으로 렌더링할 수 있습니다. iframe sandbox 정책은
`gateway.controlUi.embedSandbox`로 제어됩니다:

- `strict`: 호스팅된 embed 내부의 스크립트 실행 비활성화
- `scripts`: 원본 격리를 유지하면서 대화형 embed 허용; 기본값이며 대개 자체 포함형 브라우저 게임/위젯에 충분함
- `trusted`: 동일 사이트 문서가 의도적으로 더 강한 권한을 필요로 할 때 `allow-scripts`에 `allow-same-origin` 추가

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

내장된 문서에 정말로 same-origin
동작이 필요할 때만 `trusted`를 사용하세요. 대부분의 에이전트 생성 게임과 대화형 canvas에서는 `scripts`가
더 안전한 선택입니다.

절대 외부 `http(s)` embed URL은 기본적으로 계속 차단됩니다. 의도적으로
`[embed url="https://..."]`로 타사 페이지를 로드하려면
`gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## Tailnet 액세스(권장)

### 통합 Tailscale Serve(권장)

Gateway는 loopback에 유지하고 Tailscale Serve가 HTTPS로 프록시하도록 하세요:

```bash
openclaw gateway --tailscale serve
```

열기:

- `https://<magicdns>/`(또는 구성한 `gateway.controlUi.basePath`)

기본적으로 `gateway.auth.allowTailscale`가 `true`이면 Control UI/WebSocket Serve 요청은 Tailscale ID 헤더
(`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는
`tailscale whois`로 `x-forwarded-for` 주소를 해석하고
이를 헤더와 일치시키는 방식으로 ID를 검증하며, 요청이
Tailscale의 `x-forwarded-*` 헤더와 함께 loopback에 도달할 때만 이를 수락합니다.
Serve 트래픽에도 명시적인 공유 비밀
자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음 `gateway.auth.mode: "token"` 또는
`"password"`를 사용하세요.
비동기 Serve ID 경로에서는 동일한 클라이언트 IP와 auth 범위에 대한 인증 실패 시도는
rate-limit 쓰기 전에 직렬화됩니다. 따라서 동일한 브라우저에서 동시에 발생한 잘못된 재시도는
두 개의 단순 불일치가 병렬로 경쟁하는 대신 두 번째 요청에서 `retry later`를 표시할 수 있습니다.
토큰 없는 Serve auth는 Gateway 호스트가 신뢰된다고 가정합니다. 해당 호스트에서 신뢰할 수 없는 로컬 코드가 실행될 수 있다면 토큰/비밀번호 auth를 요구하세요.

### tailnet + token으로 바인드

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

그런 다음 열기:

- `http://<tailscale-ip>:18789/`(또는 구성한 `gateway.controlUi.basePath`)

일치하는 공유 비밀을 UI 설정에 붙여 넣으세요(`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

## 안전하지 않은 HTTP

일반 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 대시보드를 열면,
브라우저는 **비보안 컨텍스트**에서 실행되며 WebCrypto를 차단합니다. 기본적으로
OpenClaw는 기기 ID 없이 이루어지는 Control UI 연결을 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 사용하는 localhost 전용 안전하지 않은 HTTP 호환성
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 운영자 Control UI auth
- 비상용 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 해결 방법:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 여세요:

- `https://<magicdns>/`(Serve)
- `http://127.0.0.1:18789/`(Gateway 호스트에서)

**안전하지 않은 auth 토글 동작:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth`는 로컬 호환성 토글 전용입니다:

- 비보안 HTTP 컨텍스트에서 localhost Control UI 세션이 기기 ID 없이 계속 진행되도록 허용합니다.
- 페어링 검사를 우회하지 않습니다.
- 원격(non-localhost) 기기 ID 요구 사항을 완화하지 않습니다.

**비상용 전용:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth`는 Control UI 기기 ID 검사를 비활성화하며
심각한 보안 저하를 초래합니다. 비상 사용 후에는 신속히 되돌리세요.

trusted-proxy 참고:

- trusted-proxy auth가 성공하면 기기 ID 없이 **운영자** Control UI 세션을 허용할 수 있습니다
- 이는 node 역할 Control UI 세션으로는 확장되지 않습니다
- 동일 호스트 loopback 리버스 프록시는 여전히 trusted-proxy auth를 충족하지 않습니다. 자세한 내용은
  [Trusted proxy auth](/ko/gateway/trusted-proxy-auth)를 참조하세요

HTTPS 설정 안내는 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## Content Security Policy

Control UI는 엄격한 `img-src` 정책과 함께 제공됩니다: **same-origin** 자산, `data:` URL, 로컬에서 생성된 `blob:` URL만 허용됩니다. 원격 `http(s)` 및 프로토콜 상대 이미지 URL은 브라우저에서 거부되며 네트워크 fetch를 발생시키지 않습니다.

실제로 의미하는 바:

- 상대 경로(예: `/avatars/<id>`) 아래에서 제공되는 아바타와 이미지는 계속 렌더링되며, UI가 가져와 로컬 `blob:` URL로 변환하는 인증된 아바타 경로도 포함됩니다.
- 인라인 `data:image/...` URL은 계속 렌더링됩니다(프로토콜 내 payload에 유용함).
- Control UI가 생성한 로컬 `blob:` URL은 계속 렌더링됩니다.
- 채널 메타데이터가 내보내는 원격 아바타 URL은 Control UI의 아바타 헬퍼에서 제거되고 내장 로고/배지로 대체되므로, 손상되었거나 악의적인 채널이 운영자 브라우저에서 임의의 원격 이미지 fetch를 강제할 수 없습니다.

이 동작을 위해 변경할 것은 없습니다 — 항상 활성화되어 있으며 구성할 수 없습니다.

## 아바타 경로 auth

Gateway auth가 구성되어 있으면 Control UI 아바타 endpoint는 나머지 API와 동일한 Gateway 토큰을 요구합니다:

- `GET /avatar/<agentId>`는 인증된 호출자에게만 아바타 이미지를 반환합니다. `GET /avatar/<agentId>?meta=1`는 동일한 규칙 아래에서 아바타 메타데이터를 반환합니다.
- 두 경로에 대한 인증되지 않은 요청은 거부됩니다(형제 assistant-media 경로와 동일). 이렇게 하면 다른 부분이 보호된 호스트에서 아바타 경로를 통해 에이전트 ID가 유출되는 것을 방지할 수 있습니다.
- Control UI 자체는 아바타를 가져올 때 Gateway 토큰을 bearer 헤더로 전달하고, 인증된 blob URL을 사용하므로 대시보드에서 이미지가 계속 렌더링됩니다.

Gateway auth를 비활성화하면(공유 호스트에서는 권장되지 않음), 아바타 경로도 Gateway의 나머지 부분과 동일하게 인증 없이 접근 가능해집니다.

## UI 빌드

Gateway는 `dist/control-ui`의 정적 파일을 제공합니다. 다음으로 빌드하세요:

```bash
pnpm ui:build
```

선택적 절대 base(고정 자산 URL이 필요한 경우):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 개발 서버):

```bash
pnpm ui:dev
```

그런 다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키도록 하세요.

## 디버깅/테스트: 개발 서버 + 원격 Gateway

Control UI는 정적 파일이며, WebSocket 대상은 구성 가능하고
HTTP origin과 달라도 됩니다. 이는 Vite 개발 서버는 로컬에서 실행하고
Gateway는 다른 곳에서 실행할 때 유용합니다.

1. UI 개발 서버 시작: `pnpm ui:dev`
2. 다음과 같은 URL 열기:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

선택적 일회성 auth(필요 시):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

참고:

- `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서는 제거됩니다.
- 가능하면 `token`은 URL fragment(`#token=...`)를 통해 전달해야 합니다. fragment는 서버로 전송되지 않으므로 요청 로그와 Referer 유출을 피할 수 있습니다. 레거시 `?token=` 쿼리 파라미터도 호환성을 위해 한 번은 가져오지만, fallback으로만 사용되며 부트스트랩 직후 즉시 제거됩니다.
- `password`는 메모리에만 유지됩니다.
- `gatewayUrl`이 설정되면 UI는 config 또는 환경 자격 증명으로 fallback하지 않습니다.
  `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류가 발생합니다.
- Gateway가 TLS 뒤에 있으면(`Tailscale Serve`, HTTPS 프록시 등) `wss://`를 사용하세요.
- `gatewayUrl`은 클릭재킹 방지를 위해 최상위 창에서만 허용됩니다(임베드된 경우는 허용되지 않음).
- loopback이 아닌 Control UI 배포는 `gateway.controlUi.allowedOrigins`를
  명시적으로 설정해야 합니다(전체 origin). 여기에는 원격 개발 설정도 포함됩니다.
- 엄격히 통제된 로컬 테스트가 아닌 한 `gateway.controlUi.allowedOrigins: ["*"]`를 사용하지 마세요.
  이는 “내가 사용 중인 호스트에 맞춤”이 아니라 모든 브라우저 origin을 허용한다는 의미입니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는
  Host 헤더 origin fallback 모드를 활성화하지만, 이는 위험한 보안 모드입니다.

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

- [Dashboard](/ko/web/dashboard) — Gateway 대시보드
- [WebChat](/ko/web/webchat) — 브라우저 기반 채팅 인터페이스
- [TUI](/ko/web/tui) — 터미널 사용자 인터페이스
- [Health Checks](/ko/gateway/health) — Gateway 상태 모니터링
