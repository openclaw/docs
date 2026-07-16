---
read_when:
    - Signal 지원 설정하기
    - Signal 송수신 디버깅
summary: signal-cli(네이티브 데몬 또는 bbernhard 컨테이너)를 통한 Signal 지원, 설정 경로 및 번호 모델
title: Signal
x-i18n:
    generated_at: "2026-07-16T12:20:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal은 다운로드 가능한 채널 플러그인입니다(`@openclaw/signal`). Gateway는 HTTP를 통해 `signal-cli`와 통신합니다. 네이티브 데몬(JSON-RPC + SSE) 또는 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) 컨테이너(REST + WebSocket)를 사용할 수 있습니다. OpenClaw에는 libsignal이 내장되어 있지 않습니다.

## 번호 모델(먼저 읽으십시오)

- Gateway는 **Signal 기기**, 즉 `signal-cli` 계정에 연결됩니다.
- 봇을 **개인 Signal 계정**에서 실행하면 루프 방지를 위해 자신의 메시지를 무시합니다.
- "봇에 문자를 보내면 답장하는" 방식으로 사용하려면 **별도의 봇 번호**를 사용하십시오.

## 설치

```bash
openclaw plugins install @openclaw/signal
```

소스가 지정되지 않은 플러그인 사양은 먼저 ClawHub를 시도한 다음 npm으로 대체합니다. `openclaw plugins install clawhub:@openclaw/signal` 또는 `npm:@openclaw/signal`로 소스를 강제 지정하십시오. `plugins install`는 플러그인을 등록하고 활성화하므로 별도의 `enable` 단계가 필요하지 않습니다. 일반 설치 규칙은 [플러그인](/ko/tools/plugin)을 참조하십시오.

## 빠른 설정

<Steps>
  <Step title="번호 선택">
    봇에는 **별도의 Signal 번호**를 사용하십시오(권장).
  </Step>
  <Step title="플러그인 설치">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="안내식 설정 실행">
    ```bash
    openclaw channels add
    ```
    마법사는 `signal-cli`가 `PATH`에 있는지 감지하고, 없으면 설치를 제안합니다. Linux x86-64에서는 공식 네이티브 GraalVM 빌드를 다운로드하고, macOS 및 기타 아키텍처에서는 Homebrew를 통해 설치합니다. 그런 다음 봇 번호와 `signal-cli` 경로를 입력하라는 메시지를 표시합니다.

    비대화형 설정의 경우 `openclaw channels add --channel signal`는 봇 전화번호용 `--signal-number <e164>`, Signal 데몬 엔드포인트용 `--http-host <host>` 및 `--http-port <port>`(기본값 `127.0.0.1:8080`)도 허용합니다.

  </Step>
  <Step title="계정 연결 또는 등록">
    - **QR 연결(가장 빠름):** `signal-cli link -n "OpenClaw"`을 실행한 다음 Signal로 스캔하십시오. [경로 A](#setup-path-a-link-existing-signal-account-qr)를 참조하십시오.
    - **SMS 등록:** 전용 번호를 captcha 및 SMS 인증과 함께 사용합니다. [경로 B](#setup-path-b-register-dedicated-bot-number-sms-linux)를 참조하십시오.

  </Step>
  <Step title="확인 및 페어링">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    첫 DM을 전송하고 페어링을 승인하십시오: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

최소 구성:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| 필드        | 설명                                       |
| ------------ | ------------------------------------------------- |
| `account`    | E.164 형식의 봇 전화번호(`+15551234567`) |
| `cliPath`    | `signal-cli` 경로(`PATH`에 있으면 `signal-cli`)  |
| `configPath` | `--config`로 전달되는 signal-cli 구성 디렉터리        |
| `dmPolicy`   | DM 액세스 정책(`pairing` 권장)          |
| `allowFrom`  | DM이 허용된 전화번호 또는 `uuid:<id>` 값 |

다중 계정 지원: 계정별 구성 및 선택적 `name`과 함께 `channels.signal.accounts`을 사용하십시오. 공통 패턴은 [다중 계정 채널](/ko/gateway/config-channels#multi-account-all-channels)을 참조하십시오.

## 개요

- 결정론적 라우팅: 답장은 항상 Signal로 돌아갑니다.
- DM은 에이전트의 기본 세션을 공유하고, 그룹은 격리됩니다(`agent:<agentId>:signal:group:<groupId>`).
- 기본적으로 Signal은 `/config set|unset`에 의해 트리거된 구성 업데이트를 기록할 수 있습니다(`commands.config: true` 필요). `channels.signal.configWrites: false`로 비활성화하십시오.

## 설정 경로 A: 기존 Signal 계정 연결(QR)

1. `signal-cli`(JVM 또는 네이티브 빌드)를 설치하거나 `openclaw channels add`이 설치하도록 하십시오.
2. 봇 계정을 연결하십시오. `signal-cli link -n "OpenClaw"`을 실행한 다음 Signal에서 QR을 스캔하십시오.
3. Signal을 구성하고 Gateway를 시작하십시오.

## 설정 경로 B: 전용 봇 번호 등록(SMS, Linux)

기존 Signal 앱 계정을 연결하는 대신 전용 봇 번호를 사용하려면 이 방법을 사용하십시오. 아래 절차는 Ubuntu 24에서 테스트되었습니다.

1. SMS를 수신할 수 있는 번호를 준비하십시오(유선 전화는 음성 인증도 가능). 전용 봇 번호를 사용하면 계정/세션 충돌을 방지할 수 있습니다.
2. Gateway 호스트에 `signal-cli`을 설치하십시오.

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM 빌드(`signal-cli-${VERSION}.tar.gz`)를 사용하는 경우 먼저 JRE를 설치하십시오. `signal-cli`을 최신 상태로 유지하십시오. 업스트림에서는 Signal 서버 API가 변경됨에 따라 이전 릴리스가 작동하지 않을 수 있다고 설명합니다.

3. 번호를 등록하고 인증하십시오.

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

captcha가 필요한 경우(이 단계를 완료하려면 브라우저 액세스가 필요함):

1. `https://signalcaptchas.org/registration/generate.html`을 여십시오.
2. captcha를 완료하고 "Open Signal"에서 `signalcaptcha://...` 링크 대상을 복사하십시오.
3. 가능하면 브라우저 세션과 동일한 외부 IP에서 실행하십시오(captcha 토큰은 빠르게 만료됨).
4. 즉시 등록하고 인증하십시오.

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw를 구성하고 Gateway를 다시 시작한 다음 채널을 확인하십시오.

```bash
# Gateway를 사용자 systemd 서비스로 실행하는 경우:
systemctl --user restart openclaw-gateway.service

# 그런 다음 확인:
openclaw doctor
openclaw channels status --probe
```

5. DM 발신자를 페어링하십시오.
   - 봇 번호로 아무 메시지나 전송하십시오.
   - 서버에서 승인하십시오: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "Unknown contact"를 방지하려면 휴대전화에 봇 번호를 연락처로 저장하십시오.

<Warning>
`signal-cli`로 전화번호 계정을 등록하면 해당 번호의 기본 Signal 앱 세션 인증이 해제될 수 있습니다. 전용 봇 번호를 사용하거나, 기존 휴대전화 앱 설정을 유지하려면 QR 연결 모드를 사용하십시오.
</Warning>

업스트림 참고 자료:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- Captcha 절차: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 연결 절차: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 외부 데몬 모드(httpUrl)

`signal-cli`을 직접 관리하려면(JVM의 느린 콜드 스타트, 컨테이너 초기화, 공유 CPU) 데몬을 별도로 실행하고 OpenClaw가 이를 가리키도록 설정하십시오.

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

이렇게 하면 자동 생성과 OpenClaw의 시작 대기를 건너뜁니다. 자동 생성된 데몬의 시작이 느리면 `channels.signal.startupTimeoutMs`을 설정하십시오.

## 컨테이너 모드(bbernhard/signal-cli-rest-api)

`signal-cli`을 네이티브로 실행하는 대신, `signal-cli`을 REST + WebSocket 인터페이스 뒤에서 래핑하는 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 컨테이너를 사용하십시오.

요구 사항:

- 실시간 메시지를 수신하려면 컨테이너를 **반드시** `MODE=json-rpc`로 실행해야 합니다.
- OpenClaw에 연결하기 전에 컨테이너 내부에서 Signal 계정을 등록하거나 연결하십시오.

`docker-compose.yml` 서비스 예시:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

OpenClaw 구성:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // 또는 자동 감지하려면 "auto"
    },
  },
}
```

`apiMode`은 OpenClaw가 사용할 프로토콜을 제어합니다.

| 값         | 동작                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (기본값) 두 전송 방식을 모두 탐색하며, 스트리밍으로 컨테이너 WebSocket 수신을 검증함    |
| `"native"`    | 네이티브 signal-cli 강제 사용(`/api/v1/rpc`의 JSON-RPC, `/api/v1/events`의 SSE)         |
| `"container"` | bbernhard 컨테이너 강제 사용(`/v2/send`의 REST, `/v1/receive/{account}`의 WebSocket) |

`apiMode`가 `"auto"`인 경우, OpenClaw는 반복 탐색을 방지하기 위해 감지된 모드를 데몬 URL별로 30초 동안 캐시합니다(두 전송 방식이 모두 정상일 때는 네이티브가 우선함). 컨테이너 수신은 `/v1/receive/{account}`이 WebSocket으로 업그레이드된 후에만 스트리밍용으로 선택되며, 이를 위해서는 `MODE=json-rpc`이 필요합니다.

컨테이너 모드는 컨테이너가 일치하는 API를 제공하는 경우 네이티브 모드와 동일한 Signal 작업을 지원합니다. 여기에는 송수신, 첨부 파일, 입력 표시기, 읽음/확인 영수증, 반응, 그룹 및 스타일 적용 텍스트가 포함됩니다. OpenClaw는 `group.{base64(internal_id)}` 그룹 ID와 서식 있는 텍스트용 `text_mode: "styled"`을 포함하여 네이티브 Signal RPC 호출을 컨테이너의 REST 페이로드로 변환합니다.

운영 참고 사항:

- 컨테이너 모드에서는 `autoStart: false`을 사용하십시오. `apiMode: "container"`이 선택되었을 때 OpenClaw가 네이티브 데몬을 생성해서는 안 됩니다.
- 수신에는 `MODE=json-rpc`을 사용하십시오. `MODE=normal`을 사용하면 `/v1/about`이 정상으로 보일 수 있지만 `/v1/receive/{account}`은 WebSocket으로 업그레이드되지 않으므로, OpenClaw는 `auto` 모드에서 컨테이너 수신 스트리밍을 선택하지 않습니다.
- `httpUrl`이 bbernhard REST API를 가리키면 `apiMode: "container"`, 네이티브 `signal-cli` JSON-RPC/SSE를 가리키면 `"native"`, 배포에 따라 달라질 수 있으면 `"auto"`을 설정하십시오.
- 컨테이너 첨부 파일 다운로드에는 네이티브 모드와 동일한 미디어 바이트 제한이 적용됩니다. 서버가 `Content-Length`을 전송하면 크기 제한을 초과한 응답은 완전히 버퍼링되기 전에 거부되며, 그렇지 않은 경우에는 스트리밍 중에 거부됩니다.

## 액세스 제어(DM + 그룹)

DM:

- 기본값: `channels.signal.dmPolicy = "pairing"`.
- 알 수 없는 발신자에게는 페어링 코드가 제공되며, 승인될 때까지 메시지가 무시됩니다(코드는 1시간 후 만료됨).
- `openclaw pairing list signal` 및 `openclaw pairing approve signal <CODE>`을 통해 승인하십시오.
- 페어링은 Signal DM의 기본 토큰 교환 방식입니다. 자세한 내용: [페어링](/ko/channels/pairing)
- UUID만 있는 발신자(`sourceUuid`에서 제공)는 `channels.signal.allowFrom`에 `uuid:<id>`로 저장됩니다.

그룹:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `allowlist`이 설정된 경우 `channels.signal.groupAllowFrom`은 그룹 답장을 트리거할 수 있는 그룹 또는 발신자를 제어합니다. 항목은 Signal 그룹 ID(원시 형식, `group:<id>` 또는 `signal:group:<id>`), 발신자 전화번호, `uuid:<id>` 값 또는 `*`일 수 있습니다.
- `channels.signal.groups["<group-id>" | "*"]`은 `requireMention`, `tools`, `toolsBySender`으로 그룹 동작을 재정의할 수 있습니다.
- 다중 계정 설정에서 계정별 재정의를 적용하려면 `channels.signal.accounts.<id>.groups`을 사용하십시오.
- `groupAllowFrom`을 통해 Signal 그룹을 허용 목록에 추가해도 멘션 게이팅이 자동으로 비활성화되지는 않습니다. 구체적으로 구성된 `channels.signal.groups["<group-id>"]` 항목은 `requireMention=true`이 설정되지 않은 한 모든 그룹 메시지를 처리합니다.
- `requireMention=true`을 사용하면 구조화된 멘션 메타데이터에서 봇 계정 전화번호 또는 `accountUuid`과 대조하여 Signal 네이티브 @멘션을 일치시킵니다. 구성된 `mentionPatterns`은 일반 텍스트 대체 수단으로 유지됩니다.
- 런타임 참고: `channels.signal`이 완전히 누락된 경우 런타임은 그룹 검사에 `groupPolicy="allowlist"`을 대신 사용합니다(`channels.defaults.groupPolicy`이 설정되어 있어도 마찬가지임).

제한된 컨텍스트를 사용하는 멘션 게이팅 그룹:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

봇을 멘션하지 않은 허용된 그룹 메시지에는 응답하지 않으며, 제한된 대기 기록 창에만 보관됩니다. 이후 네이티브 @멘션 또는 대체 텍스트 멘션이 봇을 트리거하면 OpenClaw는 해당 최근 컨텍스트를 포함하여 같은 그룹에 응답합니다. 건너뛴 첨부 파일의 본문은 다운로드되지 않으며, 대기 중인 컨텍스트에 간결한 미디어 자리표시자로만 표시될 수 있습니다.

## 작동 방식(동작)

- 네이티브 모드: `signal-cli`은 데몬으로 실행되며, Gateway는 SSE를 통해 이벤트를 읽습니다.
- 컨테이너 모드: Gateway는 REST API를 통해 전송하고 WebSocket을 통해 수신합니다.
- 수신 메시지는 공유 채널 엔벌로프로 정규화됩니다.
- 응답은 항상 동일한 번호 또는 그룹으로 다시 라우팅됩니다.
- 백엔드가 수신 타임스탬프와 작성자를 허용하면 수신 메시지에 대한 응답에 네이티브 Signal 인용 메타데이터가 포함됩니다. 인용 메타데이터가 없거나 거부되면 OpenClaw는 응답을 일반 메시지로 전송합니다.
- `channels.signal.replyToMode = off | first | all | batched`로 네이티브 인용 사용을 구성하거나, 채팅 유형별 재정의에는 `channels.signal.replyToModeByChatType.direct/group`를 사용하십시오. `channels.signal.accounts.<id>` 아래의 계정 수준 값이 우선합니다.

## 미디어 및 제한

- 발신 텍스트는 `channels.signal.textChunkLimit`(기본값 4000) 단위로 분할됩니다.
- 선택적 줄바꿈 분할: 길이 기준으로 분할하기 전에 빈 줄(문단 경계)을 기준으로 분할하려면 `channels.signal.streaming.chunkMode="newline"`를 설정하십시오.
- 첨부 파일이 지원됩니다(`signal-cli`에서 base64를 가져옵니다).
- `contentType`이 없으면 음성 메모 첨부 파일은 MIME 대체값으로 `signal-cli` 파일 이름을 사용하므로, 오디오 전사가 AAC 음성 메모를 계속 분류할 수 있습니다.
- 기본 미디어 상한: `channels.signal.mediaMaxMb`(기본값 8).
- 미디어 다운로드를 건너뛰려면 `channels.signal.ignoreAttachments`을 사용하십시오.
- 그룹 기록 컨텍스트는 `channels.signal.historyLimit`(또는 `channels.signal.accounts.*.historyLimit`)을 사용하고, 없으면 `messages.groupChat.historyLimit`으로 대체됩니다. 비활성화하려면 `0`를 설정하십시오(기본값 50).

## 입력 중 표시 및 읽음 확인

- **입력 중 표시**: OpenClaw는 `signal-cli sendTyping`를 통해 입력 중 신호를 전송하고 응답이 실행되는 동안 이를 새로 고칩니다.
- **읽음 확인**: `channels.signal.sendReadReceipts`이 true이면 OpenClaw는 허용된 DM에 대한 읽음 확인을 전달합니다.
- `signal-cli`은 그룹의 읽음 확인을 노출하지 않습니다.

## 수명 주기 상태 반응

Signal에서 수신 턴에 공유 대기/사고/도구/Compaction/완료/오류 반응 수명 주기를 표시하도록 하려면 `messages.statusReactions.enabled: true`을 설정하십시오. Signal은 수신 메시지 타임스탬프를 반응 대상으로 사용합니다. 그룹 반응은 Signal 그룹 ID와 원래 발신자를 대상 작성자로 함께 지정하여 전송됩니다.

상태 반응에는 확인 반응과 일치하는 `messages.ackReactionScope`(`direct`, `group-all`, `group-mentions` 또는 `all`)도 필요합니다. Signal 상태 반응을 비활성화하려면 `channels.signal.reactionLevel: "off"`를 설정하십시오.

`messages.removeAckAfterReply: true`는 구성된 유지 시간이 지나면 최종 상태 반응을 지웁니다. 그렇지 않으면 Signal은 최종 완료/오류 상태 후에 초기 확인 반응을 복원합니다.

## 반응(메시지 도구)

`channel=signal`과 함께 `message action=react`을 사용하십시오.

- 대상: 발신자의 E.164 또는 UUID(페어링 출력의 `uuid:<id>`을 사용하십시오. 접두사 없는 UUID도 작동합니다).
- `messageId`은 반응하려는 메시지의 Signal 타임스탬프입니다.
- 그룹 반응에는 `targetAuthor` 또는 `targetAuthorUuid`이 필요합니다.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

구성:

- `channels.signal.actions.reactions`: 반응 작업을 활성화/비활성화합니다(기본값 true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`(기본값 `minimal`).
  - `off`/`ack`은 에이전트 반응을 비활성화합니다(메시지 도구 `react`에서 오류가 발생합니다).
  - `minimal`/`extensive`은 에이전트 반응을 활성화하고 지침 수준을 설정합니다.
- 계정별 재정의: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## 승인 반응

Signal exec 및 Plugin 승인 프롬프트는 최상위 `approvals.exec` 및 `approvals.plugin` 라우팅 블록을 사용합니다. Signal에는 `channels.signal.execApprovals` 블록이 없습니다.

- `👍`은 한 번 승인합니다.
- `👎`은 거부합니다.
- 요청에서 영구 승인을 제공하는 경우 `/approve <id> allow-always`을 사용하십시오.

승인 반응을 처리하려면 `channels.signal.allowFrom`, `channels.signal.defaultTo` 또는 일치하는 계정 수준 필드에 명시적인 Signal 승인자가 있어야 합니다. 동일 채팅의 직접 exec 승인 프롬프트는 명시적인 승인자가 없어도 중복된 로컬 `/approve` 대체 항목을 계속 숨길 수 있습니다. 승인자가 없는 그룹 승인은 로컬 대체 항목을 계속 표시합니다.

## 전송 대상(CLI/Cron)

- DM: `signal:+15551234567`(또는 일반 E.164).
- UUID DM: `uuid:<id>`(또는 접두사 없는 UUID).
- 그룹: `signal:group:<groupId>`.
- 사용자 이름: `username:<name>`(Signal 계정에서 지원되는 경우).

## 별칭

반복적으로 사용하는 Signal 대상에 안정적인 이름을 지정하려면 별칭을 구성하십시오. 별칭은 OpenClaw 측 구성일 뿐이며 Signal 연락처를 생성하거나 편집하지 않습니다.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Signal 전송 대상이 허용되는 모든 곳에서 별칭을 사용하십시오.

```bash
openclaw message send --channel signal --target signal:ops --message "배포가 완료되었습니다"
```

계정별 별칭은 최상위 별칭을 상속하며 이름을 추가하거나 재정의할 수 있습니다.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` 및 `openclaw directory groups list --channel signal`은 구성된 별칭을 나열합니다. Signal 디렉터리는 구성 기반이며 Signal 연락처를 실시간으로 조회하거나 Signal 계정을 변경하지 않습니다.

## 문제 해결

먼저 다음 진단 단계를 실행하십시오.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

그런 다음 필요한 경우 DM 페어링 상태를 확인하십시오.

```bash
openclaw pairing list signal
```

일반적인 실패:

- 데몬에 연결할 수 있지만 응답이 없음: 계정/데몬 설정(`httpUrl`, `account`)과 수신 모드를 확인하십시오.
- DM이 무시됨: 발신자가 페어링 승인을 기다리고 있습니다.
- 그룹 메시지가 무시됨: 그룹 발신자/멘션 게이트가 전송을 차단합니다.
- 편집 후 구성 유효성 검사 오류: `openclaw doctor --fix`을 실행하십시오.
- 진단에 Signal이 없음: `channels.signal.enabled: true`을 확인하십시오.

추가 확인:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

분류 절차는 [채널 문제 해결](/ko/channels/troubleshooting)을 참조하십시오.

## 보안 참고 사항

- `signal-cli`은 계정 키를 로컬에 저장합니다(일반적으로 `~/.local/share/signal-cli/data/`).
- 서버 마이그레이션 또는 재구축 전에 Signal 계정 상태를 백업하십시오.
- 더 광범위한 DM 접근을 명시적으로 원하는 경우가 아니면 `channels.signal.dmPolicy: "pairing"`를 유지하십시오.
- SMS 인증은 등록 또는 복구 흐름에만 필요하지만, 번호/계정에 대한 제어권을 잃으면 재등록이 복잡해질 수 있습니다.

## 구성 참조(Signal)

전체 구성: [구성](/ko/gateway/configuration)

제공자 옵션:

- `channels.signal.enabled`: 채널 시작을 활성화/비활성화합니다.
- `channels.signal.apiMode`: `auto | native | container`(기본값: 자동). [컨테이너 모드](#container-mode-bbernhardsignal-cli-rest-api)를 참조하십시오.
- `channels.signal.account`: 봇 계정의 E.164입니다.
- `channels.signal.accountUuid`: 네이티브 @멘션 감지 및 루프 방지를 위한 선택적 봇 계정 UUID입니다.
- `channels.signal.cliPath`: `signal-cli`의 경로입니다.
- `channels.signal.configPath`: 선택적 `signal-cli --config` 디렉터리입니다.
- `channels.signal.httpUrl`: 전체 데몬 URL입니다(호스트/포트를 재정의합니다).
- `channels.signal.httpHost`, `channels.signal.httpPort`: 데몬 바인딩입니다(기본값 `127.0.0.1:8080`).
- `channels.signal.autoStart`: 데몬을 자동으로 생성합니다(`httpUrl`이 설정되지 않은 경우 기본값 true).
- `channels.signal.startupTimeoutMs`: 시작 대기 제한 시간(ms)입니다(최소 1000, 상한 120000, 기본값 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: 첨부 파일 다운로드를 건너뜁니다.
- `channels.signal.ignoreStories`: 데몬의 스토리를 무시합니다.
- `channels.signal.sendReadReceipts`: 읽음 확인을 전달합니다.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: 페어링).
- `channels.signal.allowFrom`: DM 허용 목록(E.164 또는 `uuid:<id>`). `open`에는 `"*"`이 필요합니다. Signal에는 사용자 이름이 없으므로 전화번호/UUID ID를 사용하십시오.
- `channels.signal.aliases`: DM 또는 그룹 전송 대상을 위한 OpenClaw 측 별칭입니다.
- `channels.signal.groupPolicy`: `open | allowlist | disabled`(기본값: 허용 목록).
- `channels.signal.groupAllowFrom`: 그룹 허용 목록입니다. Signal 그룹 ID(원시 값, `group:<id>` 또는 `signal:group:<id>`), 발신자의 E.164 번호 또는 `uuid:<id>` 값을 허용합니다.
- `channels.signal.groups`: Signal 그룹 ID(또는 `"*"`)를 키로 사용하는 그룹별 재정의입니다. 지원되는 필드: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: 다중 계정 설정을 위한 `channels.signal.groups`의 계정별 버전입니다.
- `channels.signal.accounts.<id>.aliases`: 최상위 별칭과 병합되는 계정별 별칭입니다.
- `channels.signal.replyToMode`: 네이티브 응답 인용 모드, `off | first | all | batched`(기본값: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: 채팅 유형별 네이티브 응답 인용 재정의입니다.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: 계정별 응답 인용 재정의입니다.
- `channels.signal.historyLimit`: 컨텍스트에 포함할 최대 그룹 메시지 수입니다(0이면 비활성화).
- `channels.signal.dmHistoryLimit`: 사용자 턴 단위의 DM 기록 제한입니다. 사용자별 재정의: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: 발신 메시지의 문자 단위 분할 크기입니다(기본값 4000).
- `channels.signal.streaming.chunkMode`: `length`(기본값) 또는 길이 기준으로 분할하기 전에 빈 줄(문단 경계)을 기준으로 분할하는 `newline`.
- `channels.signal.mediaMaxMb`: 수신/발신 미디어 상한(MB)입니다(기본값 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`(기본값 `minimal`). [반응](#reactions-message-tool)을 참조하십시오.
- `channels.signal.reactionNotifications`: `off | own | all | allowlist`(기본값 `own`) - 다른 사용자의 수신 반응을 에이전트에 알리는 시점을 지정합니다.
- `channels.signal.reactionAllowlist`: `reactionNotifications: "allowlist"`일 때 해당 반응이 에이전트에 알려지는 발신자입니다.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: 여러 채널에서 공유되는 블록 모드 스트리밍 제어입니다. [스트리밍](/ko/concepts/streaming)을 참조하십시오.

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns` (일반 텍스트 대체 방식이며, 봇 계정 ID가 구성된 경우 구조화된 메타데이터에서 Signal 네이티브 @멘션을 감지합니다).
- `messages.groupChat.mentionPatterns` (전역 대체 방식).
- `messages.responsePrefix`.

## 관련 문서

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 게이팅
- [채널 라우팅](/ko/channels/channel-routing) - 메시지의 세션 라우팅
- [보안](/ko/gateway/security) - 액세스 모델 및 강화
