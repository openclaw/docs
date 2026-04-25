---
read_when:
    - 브라우저에서 Gateway를 운영하려고 합니다
    - SSH 터널 없이 Tailnet 액세스를 원합니다
summary: Gateway용 브라우저 기반 Control UI(채팅, Nodes, config)
title: Control UI
x-i18n:
    generated_at: "2026-04-25T06:13:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0c41605af9972b2ec0a8f23724f0279c1890740b150b37814d2f879a466d36b0
    source_path: web/control-ui.md
    workflow: 15
---

Control UI는 Gateway가 제공하는 작은 **Vite + Lit** 단일 페이지 앱입니다:

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

이 UI는 동일한 포트의 **Gateway WebSocket**과 직접 통신합니다.

## 빠르게 열기 (로컬)

Gateway가 같은 컴퓨터에서 실행 중이라면 다음을 여세요:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지가 로드되지 않으면 먼저 Gateway를 시작하세요: `openclaw gateway`.

인증은 WebSocket 핸드셰이크 중 다음을 통해 제공됩니다:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때 trusted-proxy ID 헤더

대시보드 설정 패널은 현재 브라우저 탭 세션과 선택된 gateway URL에 대한 토큰을
유지하지만 비밀번호는 저장하지 않습니다. 온보딩은 보통 첫 연결 시
공유 시크릿 인증을 위한 gateway 토큰을 생성하지만,
`gateway.auth.mode`가 `"password"`일 때는 비밀번호 인증도 작동합니다.

## 디바이스 페어링 (첫 연결)

새 브라우저나 디바이스에서 Control UI에 연결할 때 Gateway는
**일회성 페어링 승인**을 요구합니다. `gateway.auth.allowTailscale: true`로 같은 Tailnet에 있더라도
예외가 아닙니다. 이는
무단 액세스를 방지하기 위한 보안 조치입니다.

**표시되는 내용:** `"disconnected (1008): pairing required"`

**디바이스 승인 방법:**

```bash
# 보류 중인 요청 목록 보기
openclaw devices list

# 요청 ID로 승인
openclaw devices approve <requestId>
```

브라우저가 변경된 인증 세부 정보(역할/범위/공개
키)로 페어링을 다시 시도하면 이전 보류 요청은 대체되고 새 `requestId`가
생성됩니다. 승인 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 페어링되어 있고 읽기 액세스에서
쓰기/관리자 액세스로 변경하는 경우, 이는 무음 재연결이 아니라 승인 업그레이드로 처리됩니다.
OpenClaw는 기존 승인을 계속 활성 상태로 유지하고, 더 넓은 범위의 재연결은 차단한 뒤,
새 범위 집합을 명시적으로 승인하라고 요청합니다.

한 번 승인되면 디바이스는 기억되며, `openclaw devices revoke --device <id> --role <role>`로 폐기하지 않는 한
다시 승인할 필요가 없습니다.
토큰 교체 및 폐기는 [Devices CLI](/ko/cli/devices)를 참조하세요.

**참고:**

- 직접 로컬 loopback 브라우저 연결(`127.0.0.1` / `localhost`)은
  자동 승인됩니다.
- Tailnet 및 LAN 브라우저 연결은 같은 머신에서 시작되더라도 여전히
  명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 디바이스 ID를 생성하므로 브라우저를 바꾸거나
  브라우저 데이터를 지우면 다시 페어링해야 합니다.

## 개인 ID (브라우저 로컬)

Control UI는 공유 세션에서 발신 메시지에 귀속을 붙이기 위한
브라우저별 개인 ID(표시 이름 및 아바타)를 지원합니다. 이 정보는
브라우저 저장소에 저장되며, 현재 브라우저 프로필 범위에 한정되고, 다른 디바이스와 동기화되지 않으며,
실제로 전송한 메시지의 일반 transcript 작성자 메타데이터 외에는 서버 측에 저장되지 않습니다.
사이트 데이터를 지우거나 브라우저를 바꾸면 비어 있는 상태로 초기화됩니다.

## 런타임 config 엔드포인트

Control UI는 런타임 설정을
`/__openclaw/control-ui-config.json`에서 가져옵니다. 이 엔드포인트는
나머지 HTTP 표면과 동일한 gateway 인증으로 보호됩니다. 인증되지 않은 브라우저는
이를 가져올 수 없으며, 성공적인 가져오기는 이미 유효한 gateway
토큰/비밀번호, Tailscale Serve ID, 또는 trusted-proxy ID가 필요합니다.

## 언어 지원

Control UI는 첫 로드 시 브라우저 locale을 기준으로 자체를 현지화할 수 있습니다.
나중에 이를 재정의하려면 **Overview -> Gateway Access -> Language**를 여세요.
locale 선택기는 Appearance 아래가 아니라 Gateway Access 카드에 있습니다.

- 지원 locale: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 영어가 아닌 번역은 브라우저에서 지연 로드됩니다.
- 선택한 locale은 브라우저 저장소에 저장되어 이후 방문에서도 재사용됩니다.
- 누락된 번역 키는 영어로 대체됩니다.

## 현재 할 수 있는 일

- Gateway WS를 통해 모델과 채팅 (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- 브라우저에서 WebRTC를 통해 OpenAI Realtime과 직접 통신. Gateway는
  `talk.realtime.session`으로 단기 Realtime 클라이언트 시크릿을 발급하고,
  브라우저는 마이크 오디오를 OpenAI에 직접 보내며
  더 큰 구성된 OpenClaw 모델을 위해 `openclaw_agent_consult` 도구 호출을
  `chat.send`를 통해 다시 전달합니다.
- Chat에서 도구 호출 + 실시간 도구 출력 카드 스트리밍 (agent 이벤트)
- 채널: 내장 + 번들/외부 Plugin 채널의 상태, QR 로그인, 채널별 config (`channels.status`, `web.login.*`, `config.patch`)
- 인스턴스: presence 목록 + 새로고침 (`system-presence`)
- 세션: 목록 + 세션별 모델/thinking/fast/verbose/trace/reasoning 재정의 (`sessions.list`, `sessions.patch`)
- Dreams: dreaming 상태, 활성화/비활성화 토글, Dream Diary 읽기 (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron 작업: 목록/추가/편집/실행/활성화/비활성화 + 실행 기록 (`cron.*`)
- Skills: 상태, 활성화/비활성화, 설치, API 키 업데이트 (`skills.*`)
- Nodes: 목록 + capability (`node.list`)
- Exec 승인: `exec host=gateway/node`용 gateway 또는 node 허용 목록 + ask 정책 편집 (`exec.approvals.*`)
- Config: `~/.openclaw/openclaw.json` 보기/편집 (`config.get`, `config.set`)
- Config: 검증과 함께 적용 + 재시작 (`config.apply`) 및 마지막 활성 세션 깨우기
- Config 쓰기에는 동시 편집 덮어쓰기를 방지하는 base-hash 가드가 포함됩니다
- Config 쓰기 (`config.set`/`config.apply`/`config.patch`)는 제출된 config payload의 ref에 대해
  활성 SecretRef 확인도 사전 실행합니다. 해결되지 않은 활성 제출 ref는 쓰기 전에 거부됩니다
- Config 스키마 + 폼 렌더링 (`config.schema` / `config.schema.lookup`,
  필드 `title` / `description`, 일치하는 UI 힌트, 즉시 자식
  요약, 중첩 객체/와일드카드/배열/조합 노드의 문서 메타데이터,
  가능한 경우 Plugin + 채널 스키마 포함); Raw JSON 편집기는
  스냅샷이 안전한 raw 왕복을 지원할 때만 사용할 수 있습니다
- 스냅샷이 raw 텍스트를 안전하게 왕복할 수 없으면 Control UI는 Form 모드를 강제하고 해당 스냅샷에 대해 Raw 모드를 비활성화합니다
- Raw JSON 편집기의 "Reset to saved"는 평탄화된 스냅샷을 다시 렌더링하는 대신 raw 작성 형태(포맷, 주석, `$include` 레이아웃)를 보존하므로, 스냅샷이 안전하게 왕복 가능할 때 외부 편집 내용도 reset 후 살아남습니다
- 구조화된 SecretRef 객체 값은 우발적인 객체→문자열 손상을 방지하기 위해 폼 텍스트 입력에서 읽기 전용으로 렌더링됩니다
- 디버그: 상태/health/models 스냅샷 + 이벤트 로그 + 수동 RPC 호출 (`status`, `health`, `models.list`)
- 로그: 필터/내보내기를 포함한 gateway 파일 로그의 실시간 tail (`logs.tail`)
- 업데이트: 패키지/git 업데이트 + 재시작 (`update.run`) 및 재시작 보고서

Cron 작업 패널 참고:

- 격리 작업의 경우 전송 기본값은 요약 알림입니다. 내부 전용 실행만 원하면 none으로 바꿀 수 있습니다.
- announce가 선택되면 채널/대상 필드가 나타납니다.
- Webhook 모드는 `delivery.mode = "webhook"`를 사용하며 `delivery.to`는 유효한 HTTP(S) Webhook URL로 설정됩니다.
- 메인 세션 작업의 경우 Webhook과 none 전송 모드를 사용할 수 있습니다.
- 고급 편집 제어에는 실행 후 삭제, agent 재정의 지우기, Cron exact/stagger 옵션,
  agent 모델/thinking 재정의, best-effort 전송 토글이 포함됩니다.
- 폼 검증은 필드별 오류와 함께 인라인으로 이루어지며, 잘못된 값이 있으면 수정될 때까지 저장 버튼이 비활성화됩니다.
- 전용 bearer 토큰을 보내려면 `cron.webhookToken`을 설정하세요. 생략하면 Webhook은 인증 헤더 없이 전송됩니다.
- deprecated 대체 경로: `notify: true`가 저장된 레거시 작업은 마이그레이션 전까지 여전히 `cron.webhook`을 사용할 수 있습니다.

## 채팅 동작

- `chat.send`는 **논블로킹**입니다: 즉시 `{ runId, status: "started" }`로 ack를 반환하고 응답은 `chat` 이벤트를 통해 스트리밍됩니다.
- 동일한 `idempotencyKey`로 다시 보내면 실행 중에는 `{ status: "in_flight" }`, 완료 후에는 `{ status: "ok" }`를 반환합니다.
- `chat.history` 응답은 UI 안전을 위해 크기 제한이 있습니다. transcript 항목이 너무 크면 Gateway는 긴 텍스트 필드를 잘라내거나, 무거운 메타데이터 블록을 생략하거나, oversized 메시지를 placeholder(`[_chat.history omitted: message too large]`)로 대체할 수 있습니다.
- Assistant/생성된 이미지는 관리되는 미디어 참조로 영속화되고 인증된 Gateway 미디어 URL을 통해 다시 제공되므로, 새로고침 시 raw base64 이미지 payload가 chat history 응답에 그대로 남아 있을 필요가 없습니다.
- `chat.history`는 또한 표시 전용 인라인 지시 태그(예: `[[reply_to_*]]`, `[[audio_as_voice]]`), 일반 텍스트 도구 호출 XML payload(`<_tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함), 유출된 ASCII/전각 모델 제어 토큰을 visible assistant 텍스트에서 제거하고, visible 텍스트 전체가 정확한 무음 토큰 `NO_REPLY` / `no_reply`만인 assistant 항목은 생략합니다.
- 활성 전송 중 및 최종 history 새로고침 동안, 채팅 보기는 `chat.history`가 잠시 더 오래된 스냅샷을 반환하더라도 로컬의 낙관적 user/assistant 메시지를 계속 표시합니다. Gateway history가 따라잡으면 정식 transcript가 تلك 로컬 메시지를 대체합니다.
- `chat.inject`는 세션 transcript에 assistant 노트를 추가하고 UI 전용 업데이트를 위해 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, 채널 전송 없음).
- 채팅 헤더의 모델 및 thinking 선택기는 `sessions.patch`를 통해 활성 세션을 즉시 패치합니다. 이는 한 턴 전용 전송 옵션이 아니라 지속적인 세션 재정의입니다.
- 새 Gateway 세션 usage 보고가 높은 컨텍스트 압박을 보여주면, 채팅
  입력기 영역은 컨텍스트 알림을 표시하고, 권장 Compaction 수준에서는
  일반 세션 Compaction 경로를 실행하는 compact 버튼도 표시합니다. 오래된 토큰
  스냅샷은 Gateway가 새로운 usage를 다시 보고할 때까지 숨겨집니다.
- Talk 모드는 브라우저 WebRTC 세션을 지원하는 등록된 realtime voice provider를 사용합니다. `talk.provider: "openai"`와
  `talk.providers.openai.apiKey`를 구성하거나
  Voice Call realtime provider config를 재사용하세요. 브라우저는 표준 OpenAI API 키를 받지 않고,
  일시적 Realtime 클라이언트 시크릿만 받습니다. Google Live realtime voice는
  백엔드 Voice Call 및 Google Meet 브리지에서는 지원되지만, 이 브라우저
  WebRTC 경로에서는 아직 지원되지 않습니다. Realtime 세션 프롬프트는 Gateway가 조립하며,
  `talk.realtime.session`은 호출자 제공 지시 재정의를 받지 않습니다.
- Chat 입력기에서 Talk 제어는
  마이크 받아쓰기 버튼 옆의 파형 버튼입니다. Talk가 시작되면 입력기 상태 줄에는
  `Connecting Talk...`가 표시되고, 오디오가 연결되면 `Talk live`,
  realtime 도구 호출이 `chat.send`를 통해 구성된 더 큰
  모델과 상의하는 동안에는 `Asking OpenClaw...`가 표시됩니다.
- 중지:
  - **Stop** 클릭 (`chat.abort` 호출)
  - 실행이 활성 상태인 동안 일반 후속 메시지는 큐에 들어갑니다. 큐에 들어간 메시지의 **Steer**를 클릭하면 해당 후속 메시지가 실행 중인 턴에 주입됩니다.
  - `/stop` 입력(또는 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop` 같은 독립 중단 구문)으로 대역 외 중단
  - `chat.abort`는 `{ sessionKey }` (`runId` 없음)를 지원하여 해당 세션의 모든 활성 실행을 중단할 수 있습니다
- 중단 시 부분 보존:
  - 실행이 중단되면 부분 assistant 텍스트가 여전히 UI에 표시될 수 있습니다
  - Gateway는 버퍼된 출력이 존재할 경우 중단된 부분 assistant 텍스트를 transcript history에 영속화합니다
  - 영속화된 항목에는 중단 메타데이터가 포함되므로 transcript 소비자가 중단된 부분 출력과 정상 완료 출력을 구분할 수 있습니다

## 호스팅된 embed

Assistant 메시지는 `[embed ...]`
shortcode를 사용해 호스팅된 웹 콘텐츠를 인라인으로 렌더링할 수 있습니다. iframe sandbox 정책은
`gateway.controlUi.embedSandbox`로 제어됩니다:

- `strict`: 호스팅된 embed 내부에서 스크립트 실행을 비활성화합니다
- `scripts`: origin 격리를 유지하면서 대화형 embed를 허용합니다. 이것이
  기본값이며 보통 독립형 브라우저 게임/위젯에는 충분합니다
- `trusted`: 의도적으로 더 강한 권한이 필요한 same-site
  문서에 대해 `allow-scripts` 위에 `allow-same-origin`을 추가합니다

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

임베드된 문서가 정말로 same-origin
동작을 필요로 할 때만 `trusted`를 사용하세요. 대부분의 에이전트 생성 게임 및 대화형 캔버스에는
`scripts`가 더 안전한 선택입니다.

절대 외부 `http(s)` embed URL은 기본적으로 계속 차단됩니다. `[embed url="https://..."]`로
서드파티 페이지를 의도적으로 로드하려면 `gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## Tailnet 액세스 (권장)

### 통합 Tailscale Serve (권장)

Gateway는 loopback에 유지하고 Tailscale Serve가 HTTPS로 프록시하게 하세요:

```bash
openclaw gateway --tailscale serve
```

열기:

- `https://<magicdns>/` (또는 구성한 `gateway.controlUi.basePath`)

기본적으로 Control UI/WebSocket Serve 요청은
`gateway.auth.allowTailscale`가 `true`일 때 Tailscale ID 헤더
(`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는
`x-forwarded-for` 주소를 `tailscale whois`로 확인하고 이를 헤더와 일치시켜 ID를 검증하며,
요청이 loopback으로 들어오고 Tailscale의 `x-forwarded-*` 헤더를 가질 때만
이를 수락합니다. Serve 트래픽에도 명시적 공유 시크릿
자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음 `gateway.auth.mode: "token"` 또는
`"password"`를 사용하세요.
이 비동기 Serve ID 경로에서는 동일한 클라이언트 IP와
인증 범위에 대한 실패한 인증 시도가 속도 제한 기록 전에 직렬화됩니다. 따라서 같은 브라우저에서 동시에 잘못된 재시도를 하면,
병렬로 두 번 단순 불일치가 경쟁하는 대신 두 번째 요청에서 `retry later`가 표시될 수 있습니다.
토큰 없는 Serve 인증은 gateway 호스트가 신뢰된다는 가정에 기반합니다. 해당 호스트에서 신뢰할 수 없는 로컬
코드가 실행될 수 있다면 token/password 인증을 요구하세요.

### Tailnet에 바인드 + 토큰

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

그다음 다음을 여세요:

- `http://<tailscale-ip>:18789/` (또는 구성한 `gateway.controlUi.basePath`)

일치하는 공유 시크릿을 UI 설정에 붙여넣으세요(
`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

## 비보안 HTTP

대시보드를 일반 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 열면,
브라우저는 **비보안 컨텍스트**에서 실행되며 WebCrypto를 차단합니다. 기본적으로,
OpenClaw는 디바이스 ID 없이 Control UI 연결을 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 사용한 localhost 전용 비보안 HTTP 호환성
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 operator Control UI 인증
- 비상용 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 해결 방법:** HTTPS(Tailscale Serve)를 사용하거나 로컬에서 UI를 여세요:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway 호스트에서)

**비보안 인증 토글 동작:**

```json5
{
  gateway: {
    controlUi: { allowInsecureAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`allowInsecureAuth`는 로컬 호환성 토글일 뿐입니다:

- 비보안 HTTP 컨텍스트에서 localhost Control UI 세션이
  디바이스 ID 없이 진행되도록 허용합니다.
- 페어링 검사를 우회하지는 않습니다.
- 원격(비localhost) 디바이스 ID 요구 사항을 완화하지도 않습니다.

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

`dangerouslyDisableDeviceAuth`는 Control UI 디바이스 ID 검사를 비활성화하며,
심각한 보안 저하를 초래합니다. 비상 사용 후에는 빠르게 되돌리세요.

trusted-proxy 참고:

- 성공적인 trusted-proxy 인증은 디바이스 ID 없이도 **operator** Control UI 세션을 허용할 수 있습니다
- 이것은 node 역할 Control UI 세션에는 **적용되지 않습니다**
- 같은 호스트의 loopback reverse proxy는 여전히 trusted-proxy 인증 조건을 충족하지 않습니다. [Trusted proxy auth](/ko/gateway/trusted-proxy-auth)를 참조하세요

HTTPS 설정 지침은 [Tailscale](/ko/gateway/tailscale)를 참조하세요.

## 콘텐츠 보안 정책

Control UI는 엄격한 `img-src` 정책과 함께 제공됩니다: **same-origin** 자산과 `data:` URL만 허용됩니다. 원격 `http(s)` 및 프로토콜 상대 이미지 URL은 브라우저가 거부하며 네트워크 fetch도 발생하지 않습니다.

실제로 이는 다음을 의미합니다:

- 상대 경로(예: `/avatars/<id>`)로 제공되는 아바타와 이미지는 계속 렌더링됩니다.
- 인라인 `data:image/...` URL도 계속 렌더링됩니다(프로토콜 내부 payload에 유용함).
- 채널 메타데이터가 내보내는 원격 아바타 URL은 Control UI의 아바타 helper에서 제거되고 내장 로고/배지로 대체되므로, 손상되었거나 악의적인 채널이 운영자 브라우저에서 임의의 원격 이미지 fetch를 강제로 발생시킬 수 없습니다.

이 동작을 얻기 위해 따로 변경할 것은 없습니다 — 항상 활성화되어 있으며 구성할 수 없습니다.

## 아바타 라우트 인증

gateway 인증이 구성된 경우, Control UI 아바타 엔드포인트는 나머지 API와 동일한 gateway 토큰을 요구합니다:

- `GET /avatar/<agentId>`는 인증된 호출자에게만 아바타 이미지를 반환합니다. `GET /avatar/<agentId>?meta=1`은 같은 규칙 아래에서 아바타 메타데이터를 반환합니다.
- 두 라우트 모두 인증되지 않은 요청은 거부됩니다(형제 assistant-media 라우트와 동일). 이렇게 하면 다른 방식으로 보호되는 호스트에서 아바타 라우트가 에이전트 ID를 누설하는 것을 방지합니다.
- Control UI 자체는 아바타를 가져올 때 gateway 토큰을 bearer 헤더로 전달하고, 인증된 blob URL을 사용하므로 대시보드에서 이미지가 계속 렌더링됩니다.

gateway 인증을 비활성화하면(공유 호스트에서는 권장하지 않음), 나머지 gateway와 마찬가지로 아바타 라우트도 인증 없이 접근 가능해집니다.

## UI 빌드하기

Gateway는 `dist/control-ui`에서 정적 파일을 제공합니다. 다음으로 빌드하세요:

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

그런 다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키게 하세요.

## 디버깅/테스트: dev 서버 + 원격 Gateway

Control UI는 정적 파일이며 WebSocket 대상은 구성 가능하고
HTTP origin과 달라도 됩니다. 이는 Vite dev 서버는 로컬에 두고
Gateway는 다른 곳에서 실행할 때 유용합니다.

1. UI dev 서버 시작: `pnpm ui:dev`
2. 다음과 같은 URL 열기:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

선택적 일회성 인증(필요한 경우):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

참고:

- `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서 제거됩니다.
- 가능하면 `token`은 URL fragment(`#token=...`)를 통해 전달해야 합니다. fragment는 서버로 전송되지 않으므로 요청 로그와 Referer 누출을 피할 수 있습니다. 레거시 `?token=` 쿼리 매개변수도 호환성을 위해 한 번은 계속 가져오지만, 대체 경로로만 사용되며 bootstrap 직후 제거됩니다.
- `password`는 메모리에만 유지됩니다.
- `gatewayUrl`이 설정되면 UI는 config나 환경 자격 증명으로 대체하지 않습니다.
  `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류입니다.
- Gateway가 TLS 뒤에 있을 때는 `wss://`를 사용하세요(Tailscale Serve, HTTPS 프록시 등).
- `gatewayUrl`은 클릭재킹 방지를 위해 최상위 창에서만 허용됩니다(embed에서는 불가).
- 비loopback Control UI 배포는 반드시 `gateway.controlUi.allowedOrigins`
  을 명시적으로 설정해야 합니다(전체 origin). 원격 dev 설정도 여기에 포함됩니다.
- `gateway.controlUi.allowedOrigins: ["*"]`는 엄격히 통제된
  로컬 테스트 외에는 사용하지 마세요. 이것은 “현재 사용하는 호스트와 일치”가 아니라 “모든 브라우저 origin 허용”을 의미합니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는
  Host-header origin fallback 모드를 활성화하지만, 이는 위험한 보안 모드입니다.

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

원격 액세스 설정 세부 정보: [Remote access](/ko/gateway/remote).

## 관련 항목

- [Dashboard](/ko/web/dashboard) — gateway 대시보드
- [WebChat](/ko/web/webchat) — 브라우저 기반 채팅 인터페이스
- [TUI](/ko/web/tui) — 터미널 사용자 인터페이스
- [Health Checks](/ko/gateway/health) — gateway 상태 모니터링
