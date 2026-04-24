---
read_when:
    - 브라우저에서 Gateway를 운영하려는 경우
    - SSH 터널 없이 Tailnet 액세스를 원합니다
summary: Gateway용 브라우저 기반 Control UI(채팅, Node, 구성)
title: Control UI
x-i18n:
    generated_at: "2026-04-24T09:01:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: c84a74e20d6c8829168025830ff4ec8f650f10f72fcaed7c8d2f5d92ab98d616
    source_path: web/control-ui.md
    workflow: 15
---

Control UI는 Gateway가 제공하는 작은 **Vite + Lit** 단일 페이지 앱입니다:

- 기본값: `http://<host>:18789/`
- 선택적 접두사: `gateway.controlUi.basePath` 설정(예: `/openclaw`)

이 UI는 **같은 포트의 Gateway WebSocket**에 직접 연결합니다.

## 빠르게 열기(로컬)

Gateway가 같은 컴퓨터에서 실행 중이면 다음을 여세요:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (또는 [http://localhost:18789/](http://localhost:18789/))

페이지가 로드되지 않으면 먼저 Gateway를 시작하세요: `openclaw gateway`.

인증은 WebSocket 핸드셰이크 중 다음을 통해 제공됩니다:

- `connect.params.auth.token`
- `connect.params.auth.password`
- `gateway.auth.allowTailscale: true`일 때의 Tailscale Serve ID 헤더
- `gateway.auth.mode: "trusted-proxy"`일 때의 trusted-proxy ID 헤더

dashboard 설정 패널은 현재 브라우저 탭 세션과 선택한 gateway URL에 대해
token을 유지합니다. password는 저장되지 않습니다. 온보딩은 일반적으로
첫 연결 시 공유 비밀 인증용 gateway token을 생성하지만,
`gateway.auth.mode`가 `"password"`일 때는 password 인증도 동작합니다.

## 기기 페어링(첫 연결)

새 브라우저 또는 기기에서 Control UI에 연결하면 Gateway는
**일회성 페어링 승인**을 요구합니다. 같은 Tailnet에 있고
`gateway.auth.allowTailscale: true`인 경우에도 마찬가지입니다. 이는
무단 액세스를 방지하기 위한 보안 조치입니다.

**표시되는 내용:** `"disconnected (1008): pairing required"`

**기기를 승인하려면:**

```bash
# 보류 중인 요청 목록
openclaw devices list

# 요청 ID로 승인
openclaw devices approve <requestId>
```

브라우저가 변경된 인증 세부 정보(role/scopes/public
key)로 페어링을 재시도하면 이전 보류 요청은 대체되고 새 `requestId`가
생성됩니다. 승인 전에 `openclaw devices list`를 다시 실행하세요.

브라우저가 이미 페어링된 상태에서 읽기 액세스에서
쓰기/관리자 액세스로 변경하면, 이는 조용한 재연결이 아니라 승인 업그레이드로 처리됩니다.
OpenClaw는 이전 승인을 유지하고, 더 넓은 재연결을 차단하며,
새 범위 세트를 명시적으로 승인하라고 요청합니다.

한 번 승인되면 기기는 기억되며,
`openclaw devices revoke --device <id> --role <role>`로 취소하지 않는 한 재승인이 필요하지 않습니다.
token 회전 및 취소는 [Devices CLI](/ko/cli/devices)를 참조하세요.

**참고:**

- 직접 로컬 loopback 브라우저 연결(`127.0.0.1` / `localhost`)은
  자동 승인됩니다.
- Tailnet 및 LAN 브라우저 연결은 같은 머신에서 시작되더라도
  여전히 명시적 승인이 필요합니다.
- 각 브라우저 프로필은 고유한 기기 ID를 생성하므로, 브라우저를 바꾸거나
  브라우저 데이터를 지우면 다시 페어링해야 합니다.

## 개인 ID(브라우저 로컬)

Control UI는 공유 세션에서 작성자 표시를 위해
발신 메시지에 첨부되는 브라우저별 개인 ID(표시 이름 및
아바타)를 지원합니다. 이는 브라우저 저장소에 저장되고, 현재 브라우저 프로필 범위에 한정되며,
다른 기기로 동기화되지 않고, 실제로 보낸 메시지의 일반적인 전사 작성자 메타데이터 외에는
서버 측에 저장되지 않습니다. 사이트 데이터를 지우거나
브라우저를 바꾸면 비어 있는 상태로 초기화됩니다.

## 런타임 구성 엔드포인트

Control UI는 런타임 설정을
`/__openclaw/control-ui-config.json`에서 가져옵니다. 이 엔드포인트는
나머지 HTTP 표면과 동일한 gateway 인증으로 보호됩니다. 인증되지 않은 브라우저는
이를 가져올 수 없으며, 성공적인 가져오기를 위해서는 이미 유효한 gateway
token/password, Tailscale Serve ID 또는 trusted-proxy ID가 필요합니다.

## 언어 지원

Control UI는 첫 로드 시 브라우저 로캘에 따라 자체 로컬라이즈할 수 있습니다.
나중에 이를 재정의하려면 **개요 -> Gateway 액세스 -> 언어**를 여세요.
로캘 선택기는 모양이 아니라 Gateway Access 카드에 있습니다.

- 지원 로캘: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- 영어가 아닌 번역은 브라우저에서 지연 로드됩니다.
- 선택한 로캘은 브라우저 저장소에 저장되어 다음 방문에도 재사용됩니다.
- 누락된 번역 키는 영어로 폴백합니다.

## 현재 가능한 작업

- Gateway WS를 통한 모델 채팅 (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`)
- 브라우저에서 WebRTC를 통해 OpenAI Realtime과 직접 대화. Gateway는
  `talk.realtime.session`으로 짧은 수명의 Realtime 클라이언트 비밀을 발급하며,
  브라우저는 마이크 오디오를 OpenAI로 직접 보내고
  더 큰 구성된 OpenClaw 모델에 대해 `openclaw_agent_consult` 도구 호출을
  `chat.send`를 통해 다시 전달합니다.
- 채팅에서 도구 호출 + 실시간 도구 출력 카드 스트리밍(에이전트 이벤트)
- 채널: 내장 및 번들/외부 Plugin 채널 상태, QR 로그인, 채널별 구성 (`channels.status`, `web.login.*`, `config.patch`)
- 인스턴스: 프레즌스 목록 + 새로고침 (`system-presence`)
- 세션: 목록 + 세션별 모델/thinking/fast/verbose/trace/reasoning 재정의 (`sessions.list`, `sessions.patch`)
- Dreams: Dreaming 상태, 활성화/비활성화 토글, Dream Diary 리더 (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`)
- Cron 작업: 목록/추가/편집/실행/활성화/비활성화 + 실행 기록 (`cron.*`)
- Skills: 상태, 활성화/비활성화, 설치, API 키 업데이트 (`skills.*`)
- Node: 목록 + capability (`node.list`)
- Exec 승인: Gateway 또는 Node allowlist 편집 + `exec host=gateway/node`에 대한 ask 정책 (`exec.approvals.*`)
- 구성: `~/.openclaw/openclaw.json` 보기/편집 (`config.get`, `config.set`)
- 구성: 검증과 함께 적용 + 재시작 (`config.apply`) 및 마지막 활성 세션 깨우기
- 구성 쓰기에는 동시 편집 덮어쓰기를 방지하기 위한 base-hash 가드가 포함됩니다
- 구성 쓰기(`config.set`/`config.apply`/`config.patch`)는 제출된 구성 페이로드의 ref에 대해 활성 SecretRef 해석을 사전 점검하며, 해석되지 않은 활성 제출 ref는 쓰기 전에 거부됩니다
- 구성 스키마 + 폼 렌더링 (`config.schema` / `config.schema.lookup`,
  필드 `title` / `description`, 일치하는 UI 힌트, 즉시 하위
  요약, 중첩 객체/와일드카드/배열/조합 노드의 문서 메타데이터,
  사용 가능한 경우 Plugin + 채널 스키마 포함); Raw JSON 편집기는
  스냅샷이 안전한 raw 왕복을 지원할 때만 사용할 수 있습니다
- 스냅샷이 raw 텍스트를 안전하게 왕복할 수 없으면 Control UI는 Form 모드를 강제하고 해당 스냅샷에 대해 Raw 모드를 비활성화합니다
- Raw JSON 편집기의 "Reset to saved"는 평탄화된 스냅샷을 다시 렌더링하는 대신 raw 작성 형태(서식, 주석, `$include` 레이아웃)를 유지하므로, 스냅샷이 안전하게 왕복 가능한 경우 외부 편집이 reset 이후에도 유지됩니다
- 구조화된 SecretRef 객체 값은 실수로 객체가 문자열로 손상되는 일을 방지하기 위해 폼 텍스트 입력에서 읽기 전용으로 렌더링됩니다
- 디버그: 상태/health/models 스냅샷 + 이벤트 로그 + 수동 RPC 호출 (`status`, `health`, `models.list`)
- 로그: 필터/내보내기가 가능한 Gateway 파일 로그 라이브 tail (`logs.tail`)
- 업데이트: 패키지/git 업데이트 + 재시작 실행 (`update.run`) 및 재시작 보고서

Cron 작업 패널 참고 사항:

- 격리된 작업의 경우 전달 기본값은 요약 알림입니다. 내부 전용 실행을 원하면 none으로 전환할 수 있습니다.
- announce가 선택되면 채널/대상 필드가 표시됩니다.
- Webhook 모드는 `delivery.mode = "webhook"`를 사용하고 `delivery.to`는 유효한 HTTP(S) Webhook URL로 설정합니다.
- 메인 세션 작업의 경우 webhook 및 none 전달 모드를 사용할 수 있습니다.
- 고급 편집 컨트롤에는 실행 후 삭제, 에이전트 재정의 지우기, Cron exact/stagger 옵션,
  에이전트 model/thinking 재정의, best-effort 전달 토글이 포함됩니다.
- 폼 검증은 필드 수준 오류와 함께 인라인으로 표시되며, 잘못된 값은 수정되기 전까지 저장 버튼을 비활성화합니다.
- 전용 bearer token을 보내려면 `cron.webhookToken`을 설정하세요. 생략하면 Webhook은 인증 헤더 없이 전송됩니다.
- 사용 중단된 폴백: `notify: true`가 있는 저장된 레거시 작업은 마이그레이션 전까지 여전히 `cron.webhook`을 사용할 수 있습니다.

## 채팅 동작

- `chat.send`는 **논블로킹**입니다. 즉시 `{ runId, status: "started" }`로 ack하고 응답은 `chat` 이벤트를 통해 스트리밍됩니다.
- 같은 `idempotencyKey`로 다시 보내면 실행 중에는 `{ status: "in_flight" }`, 완료 후에는 `{ status: "ok" }`를 반환합니다.
- `chat.history` 응답은 UI 안전을 위해 크기 제한이 있습니다. 전사 항목이 너무 크면 Gateway는 긴 텍스트 필드를 자르거나, 무거운 메타데이터 블록을 생략하거나, 너무 큰 메시지를 플레이스홀더(`\[chat.history omitted: message too large]`)로 대체할 수 있습니다.
- 어시스턴트/생성된 이미지는 관리형 미디어 참조로 저장되고 인증된 Gateway 미디어 URL을 통해 다시 제공되므로, 새로고침 시 원시 base64 이미지 페이로드가 채팅 기록 응답에 남아 있을 필요가 없습니다.
- `chat.history`는 또한 표시 전용 인라인 directive 태그(예: `[[reply_to_*]]` 및 `[[audio_as_voice]]`), 일반 텍스트 도구 호출 XML 페이로드(`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, 잘린 도구 호출 블록 포함), 유출된 ASCII/전각 모델 제어 token을 보이는 어시스턴트 텍스트에서 제거하고, 전체 보이는 텍스트가 정확한 무음 token `NO_REPLY` / `no_reply`뿐인 어시스턴트 항목은 생략합니다.
- `chat.inject`는 세션 전사에 어시스턴트 메모를 추가하고 UI 전용 업데이트를 위해 `chat` 이벤트를 브로드캐스트합니다(에이전트 실행 없음, 채널 전달 없음).
- 채팅 헤더의 model 및 thinking 선택기는 `sessions.patch`를 통해 활성 세션을 즉시 패치합니다. 이것은 한 턴 전용 send 옵션이 아니라 영구 세션 재정의입니다.
- Talk 모드는 브라우저 WebRTC 세션을 지원하는 등록된 realtime 음성 provider를 사용합니다. `talk.provider: "openai"`와
  `talk.providers.openai.apiKey`로 OpenAI를 구성하거나,
  Voice Call realtime provider 구성을 재사용하세요. 브라우저는 표준 OpenAI API 키를 절대 받지 않으며,
  ephemeral Realtime 클라이언트 비밀만 받습니다. Google Live realtime 음성은
  백엔드 Voice Call 및 Google Meet 브리지에서는 지원되지만, 이 브라우저
  WebRTC 경로에서는 아직 지원되지 않습니다. Realtime 세션 프롬프트는 Gateway가 조합하며,
  `talk.realtime.session`은 호출자가 제공한 instruction 재정의를 받지 않습니다.
- 채팅 composer에서 Talk 컨트롤은
  마이크 받아쓰기 버튼 옆의 물결 버튼입니다. Talk가 시작되면 composer 상태 행에
  `Connecting Talk...`가 표시되고, 오디오가 연결되면 `Talk live`,
  realtime 도구 호출이 `chat.send`를 통해 구성된 더 큰 모델과 상담 중이면
  `Asking OpenClaw...`가 표시됩니다.
- 중지:
  - **Stop** 클릭 (`chat.abort` 호출)
  - 실행이 활성 상태인 동안 일반 후속 메시지는 큐에 들어갑니다. 큐에 있는 메시지의 **Steer**를 클릭하면 해당 후속 메시지를 실행 중인 턴에 주입합니다.
  - `/stop` 입력(또는 독립 실행 중단 구문인 `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`)으로 out-of-band 중단
  - `chat.abort`는 `{ sessionKey }`(`runId` 없음)를 지원하여 해당 세션의 모든 활성 실행을 중단합니다
- 중단 시 부분 보존:
  - 실행이 중단되면 부분 어시스턴트 텍스트가 UI에 계속 표시될 수 있습니다
  - 버퍼링된 출력이 있으면 Gateway는 중단된 부분 어시스턴트 텍스트를 전사 기록에 저장합니다
  - 저장된 항목에는 중단 메타데이터가 포함되어 전사 소비자가 중단된 부분 결과와 정상 완료 출력을 구분할 수 있습니다

## 호스팅된 임베드

어시스턴트 메시지는 `[embed ...]`
쇼트코드를 사용해 호스팅된 웹 콘텐츠를 인라인으로 렌더링할 수 있습니다. iframe sandbox 정책은
`gateway.controlUi.embedSandbox`로 제어됩니다:

- `strict`: 호스팅된 임베드 내부의 스크립트 실행 비활성화
- `scripts`: origin 격리를 유지하면서 대화형 임베드 허용. 이것이
  기본값이며 일반적으로 독립형 브라우저 게임/위젯에는 충분합니다
- `trusted`: 의도적으로 더 강한 권한이 필요한 same-site
  문서에 대해 `allow-scripts` 위에 `allow-same-origin` 추가

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

임베드된 문서에 genuinely same-origin
동작이 필요할 때만 `trusted`를 사용하세요. 대부분의 에이전트 생성 게임 및 대화형 canvas에는
`scripts`가 더 안전한 선택입니다.

절대 외부 `http(s)` 임베드 URL은 기본적으로 계속 차단됩니다. 의도적으로
`[embed url="https://..."]`가 서드파티 페이지를 로드하도록 하려면
`gateway.controlUi.allowExternalEmbedUrls: true`를 설정하세요.

## Tailnet 액세스(권장)

### 통합 Tailscale Serve(권장 방식)

Gateway를 loopback에 유지하고 Tailscale Serve가 HTTPS로 프록시하도록 합니다:

```bash
openclaw gateway --tailscale serve
```

열기:

- `https://<magicdns>/` (또는 구성한 `gateway.controlUi.basePath`)

기본적으로 `gateway.auth.allowTailscale`이 `true`이면 Control UI/WebSocket Serve 요청은
Tailscale ID 헤더(`tailscale-user-login`)를 통해 인증할 수 있습니다. OpenClaw는
`tailscale whois`로 `x-forwarded-for` 주소를 해석하고
이를 헤더와 일치시키는 방식으로 ID를 검증하며, 요청이 loopback에 도달하고
Tailscale의 `x-forwarded-*` 헤더가 있을 때만 이를 수락합니다.
Serve 트래픽에도 명시적 공유 비밀
자격 증명을 요구하려면 `gateway.auth.allowTailscale: false`를 설정하세요. 그런 다음
`gateway.auth.mode: "token"` 또는
`"password"`를 사용하세요.
비동기 Serve ID 경로의 경우, 같은 클라이언트 IP
및 인증 범위에 대한 인증 실패 시도는 rate-limit 기록 전에 직렬화됩니다.
따라서 같은 브라우저에서 동시에 잘못 재시도하면 두 개의 일반 불일치가 병렬로 경쟁하는 대신
두 번째 요청에서 `retry later`가 표시될 수 있습니다.
token 없는 Serve 인증은 gateway 호스트가 신뢰된다고 가정합니다. 해당 호스트에서
신뢰할 수 없는 로컬 코드가 실행될 수 있다면 token/password 인증을 요구하세요.

### tailnet에 bind + token

```bash
openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
```

그런 다음 열기:

- `http://<tailscale-ip>:18789/` (또는 구성한 `gateway.controlUi.basePath`)

일치하는 공유 비밀을 UI 설정에 붙여 넣으세요(
`connect.params.auth.token` 또는 `connect.params.auth.password`로 전송됨).

## 안전하지 않은 HTTP

일반 HTTP(`http://<lan-ip>` 또는 `http://<tailscale-ip>`)로 dashboard를 열면,
브라우저는 **비보안 컨텍스트**에서 실행되며 WebCrypto를 차단합니다. 기본적으로
OpenClaw는 기기 ID 없이 Control UI 연결을 **차단**합니다.

문서화된 예외:

- `gateway.controlUi.allowInsecureAuth=true`를 사용하는 localhost 전용 안전하지 않은 HTTP 호환성
- `gateway.auth.mode: "trusted-proxy"`를 통한 성공적인 운영자 Control UI 인증
- 비상용 `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**권장 해결 방법:** HTTPS(Tailscale Serve)를 사용하거나 UI를 로컬에서 여세요:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (gateway 호스트에서)

**안전하지 않은 인증 토글 동작:**

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

- 비보안 HTTP 컨텍스트에서 localhost Control UI 세션이
  기기 ID 없이 진행되도록 허용합니다.
- 페어링 검사를 우회하지 않습니다.
- 원격(non-localhost) 기기 ID 요구 사항을 완화하지 않습니다.

**비상용으로만 사용:**

```json5
{
  gateway: {
    controlUi: { dangerouslyDisableDeviceAuth: true },
    bind: "tailnet",
    auth: { mode: "token", token: "replace-me" },
  },
}
```

`dangerouslyDisableDeviceAuth`는 Control UI 기기 ID 검사를 비활성화하며,
심각한 보안 저하를 초래합니다. 비상 사용 후 빠르게 되돌리세요.

trusted-proxy 참고:

- 성공적인 trusted-proxy 인증은 기기 ID 없이도 **operator** Control UI 세션을 허용할 수 있습니다
- 이는 node-role Control UI 세션에는 **적용되지 않습니다**
- 같은 호스트의 loopback reverse proxy도 여전히 trusted-proxy 인증을 충족하지 않습니다. 자세한 내용은
  [Trusted Proxy Auth](/ko/gateway/trusted-proxy-auth)를 참조하세요

HTTPS 설정 안내는 [Tailscale](/ko/gateway/tailscale)을 참조하세요.

## 콘텐츠 보안 정책

Control UI는 엄격한 `img-src` 정책과 함께 제공됩니다. **same-origin** 자산과 `data:` URL만 허용됩니다. 원격 `http(s)` 및 프로토콜 상대 이미지 URL은 브라우저에서 거부되며 네트워크 fetch를 발생시키지 않습니다.

실제로 의미하는 바:

- 상대 경로(예: `/avatars/<id>`) 아래에서 제공되는 아바타와 이미지는 계속 렌더링됩니다.
- 인라인 `data:image/...` URL은 계속 렌더링됩니다(프로토콜 내 페이로드에 유용).
- 채널 메타데이터가 내보내는 원격 아바타 URL은 Control UI의 아바타 헬퍼에서 제거되고 내장 로고/배지로 대체되므로, 손상되었거나 악의적인 채널이 운영자 브라우저에서 임의의 원격 이미지 fetch를 강제할 수 없습니다.

이 동작을 사용하기 위해 변경할 것은 없습니다. 항상 활성화되어 있으며 구성할 수 없습니다.

## 아바타 라우트 인증

gateway 인증이 구성된 경우, Control UI 아바타 엔드포인트는 나머지 API와 동일한 gateway token을 요구합니다:

- `GET /avatar/<agentId>`는 인증된 호출자에게만 아바타 이미지를 반환합니다. `GET /avatar/<agentId>?meta=1`은 동일한 규칙에 따라 아바타 메타데이터를 반환합니다.
- 두 라우트에 대한 인증되지 않은 요청은 거부됩니다(형제 assistant-media 라우트와 동일). 이렇게 하면 다른 부분이 보호된 호스트에서 아바타 라우트가 에이전트 ID를 노출하는 것을 방지합니다.
- Control UI 자체는 아바타를 가져올 때 gateway token을 bearer 헤더로 전달하고, 인증된 blob URL을 사용하므로 dashboard에서도 이미지가 계속 렌더링됩니다.

gateway 인증을 비활성화하면(공유 호스트에서는 권장되지 않음), 나머지 gateway와 마찬가지로 아바타 라우트도 인증되지 않게 됩니다.

## UI 빌드하기

Gateway는 `dist/control-ui`의 정적 파일을 제공합니다. 다음으로 빌드하세요:

```bash
pnpm ui:build
```

선택적 절대 base(고정된 자산 URL이 필요할 때):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

로컬 개발용(별도 dev 서버):

```bash
pnpm ui:dev
```

그런 다음 UI가 Gateway WS URL(예: `ws://127.0.0.1:18789`)을 가리키도록 하세요.

## 디버깅/테스트: dev 서버 + 원격 Gateway

Control UI는 정적 파일이며, WebSocket 대상은 구성 가능하고
HTTP origin과 달라도 됩니다. 이는 Vite dev 서버는 로컬에서 실행하고
Gateway는 다른 곳에서 실행할 때 유용합니다.

1. UI dev 서버 시작: `pnpm ui:dev`
2. 다음과 같은 URL 열기:

```text
http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
```

선택적 1회성 인증(필요한 경우):

```text
http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
```

참고:

- `gatewayUrl`은 로드 후 localStorage에 저장되고 URL에서는 제거됩니다.
- `token`은 가능하면 URL fragment(`#token=...`)를 통해 전달해야 합니다. fragment는 서버로 전송되지 않으므로, 요청 로그 및 Referer 유출을 방지할 수 있습니다. 레거시 `?token=` 쿼리 파라미터도 호환성을 위해 한 번은 계속 가져오지만, 폴백 전용이며 부트스트랩 직후 즉시 제거됩니다.
- `password`는 메모리에만 유지됩니다.
- `gatewayUrl`이 설정되면 UI는 config 또는 환경 자격 증명으로 폴백하지 않습니다.
  `token`(또는 `password`)을 명시적으로 제공하세요. 명시적 자격 증명이 없으면 오류입니다.
- Gateway가 TLS 뒤에 있는 경우(Tailscale Serve, HTTPS 프록시 등) `wss://`를 사용하세요.
- `gatewayUrl`은 클릭재킹 방지를 위해 최상위 창에서만 허용됩니다(임베드 상태에서는 불가).
- loopback이 아닌 Control UI 배포에서는 `gateway.controlUi.allowedOrigins`
  를 명시적으로 설정해야 합니다(전체 origin). 여기에는 원격 dev 설정도 포함됩니다.
- 엄격하게 제어된 로컬 테스트가 아닌 한 `gateway.controlUi.allowedOrigins: ["*"]`를 사용하지 마세요.
  이것은 “내가 사용 중인 호스트와 일치”가 아니라 모든 브라우저 origin을 허용한다는 뜻입니다.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`는
  Host 헤더 origin 폴백 모드를 활성화하지만, 위험한 보안 모드입니다.

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

- [Dashboard](/ko/web/dashboard) — Gateway dashboard
- [WebChat](/ko/web/webchat) — 브라우저 기반 채팅 인터페이스
- [TUI](/ko/web/tui) — 터미널 사용자 인터페이스
- [Health Checks](/ko/gateway/health) — Gateway 상태 모니터링
