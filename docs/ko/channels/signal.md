---
read_when:
    - Signal 지원 설정
    - Signal 송수신 디버깅
summary: signal-cli(네이티브 데몬 또는 bbernhard 컨테이너)를 통한 Signal 지원, 설정 경로 및 번호 모델
title: Signal
x-i18n:
    generated_at: "2026-07-12T00:33:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal은 다운로드 가능한 채널 Plugin(`@openclaw/signal`)입니다. Gateway는 HTTP를 통해 `signal-cli`와 통신합니다. 네이티브 데몬(JSON-RPC + SSE) 또는 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) 컨테이너(REST + WebSocket)를 사용할 수 있습니다. OpenClaw에는 libsignal이 내장되어 있지 않습니다.

## 번호 모델(먼저 읽어보세요)

- Gateway는 **Signal 기기**, 즉 `signal-cli` 계정에 연결됩니다.
- **개인 Signal 계정**에서 봇을 실행하면 루프 방지를 위해 자신의 메시지를 무시합니다.
- "봇에게 문자를 보내면 답장하게" 하려면 **별도의 봇 번호**를 사용하세요.

## 설치

```bash
openclaw plugins install @openclaw/signal
```

접두사가 없는 Plugin 사양은 먼저 ClawHub를 시도한 다음 npm으로 대체합니다. `openclaw plugins install clawhub:@openclaw/signal` 또는 `npm:@openclaw/signal`로 소스를 강제 지정할 수 있습니다. `plugins install`은 Plugin을 등록하고 활성화하므로 별도의 `enable` 단계가 필요하지 않습니다. 일반적인 설치 규칙은 [Plugin](/ko/tools/plugin)을 참조하세요.

## 빠른 설정

<Steps>
  <Step title="번호 선택">
    봇에는 **별도의 Signal 번호**를 사용하세요(권장).
  </Step>
  <Step title="Plugin 설치">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="안내형 설정 실행">
    ```bash
    openclaw channels add
    ```
    마법사는 `signal-cli`가 `PATH`에 있는지 감지하고, 없으면 설치 옵션을 제공합니다. Linux x86-64에서는 공식 네이티브 GraalVM 빌드를 다운로드하고, macOS 및 기타 아키텍처에서는 Homebrew를 통해 설치합니다. 그런 다음 봇 번호와 `signal-cli` 경로를 입력하라는 메시지가 표시됩니다.
  </Step>
  <Step title="계정 연결 또는 등록">
    - **QR 연결(가장 빠름):** `signal-cli link -n "OpenClaw"`을 실행한 다음 Signal로 스캔합니다. [경로 A](#setup-path-a-link-existing-signal-account-qr)를 참조하세요.
    - **SMS 등록:** 전용 번호를 캡차 및 SMS 인증으로 등록합니다. [경로 B](#setup-path-b-register-dedicated-bot-number-sms-linux)를 참조하세요.

  </Step>
  <Step title="확인 및 페어링">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    첫 DM을 보낸 후 페어링을 승인합니다: `openclaw pairing approve signal <CODE>`.
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

| 필드         | 설명                                                       |
| ------------ | ---------------------------------------------------------- |
| `account`    | E.164 형식의 봇 전화번호 (`+15551234567`)                  |
| `cliPath`    | `signal-cli` 경로(`PATH`에 있으면 `signal-cli`)             |
| `configPath` | `--config`로 전달되는 signal-cli 구성 디렉터리              |
| `dmPolicy`   | DM 접근 정책(`pairing` 권장)                               |
| `allowFrom`  | DM이 허용된 전화번호 또는 `uuid:<id>` 값                   |

다중 계정을 지원하려면 계정별 구성 및 선택적 `name`과 함께 `channels.signal.accounts`를 사용하세요. 공통 패턴은 [다중 계정 채널](/ko/gateway/config-channels#multi-account-all-channels)을 참조하세요.

## 주요 기능

- 결정적 라우팅: 답장은 항상 Signal로 돌아갑니다.
- DM은 에이전트의 기본 세션을 공유하며, 그룹은 격리됩니다(`agent:<agentId>:signal:group:<groupId>`).
- 기본적으로 Signal은 `/config set|unset`에 의해 트리거된 구성 업데이트를 기록할 수 있습니다(`commands.config: true` 필요). 비활성화하려면 `channels.signal.configWrites: false`를 설정하세요.

## 설정 경로 A: 기존 Signal 계정 연결(QR)

1. `signal-cli`(JVM 또는 네이티브 빌드)를 설치하거나 `openclaw channels add`가 대신 설치하도록 합니다.
2. 봇 계정을 연결합니다. `signal-cli link -n "OpenClaw"`을 실행한 다음 Signal에서 QR 코드를 스캔합니다.
3. Signal을 구성하고 Gateway를 시작합니다.

## 설정 경로 B: 전용 봇 번호 등록(SMS, Linux)

기존 Signal 앱 계정을 연결하는 대신 전용 봇 번호를 사용하려면 이 방법을 사용하세요. 아래 절차는 Ubuntu 24에서 테스트되었습니다.

1. SMS를 수신할 수 있는 번호를 준비합니다(유선 전화는 음성 인증 가능). 전용 봇 번호를 사용하면 계정 및 세션 충돌을 방지할 수 있습니다.
2. Gateway 호스트에 `signal-cli`를 설치합니다.

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM 빌드(`signal-cli-${VERSION}.tar.gz`)를 사용하는 경우 먼저 JRE를 설치하세요. `signal-cli`를 최신 상태로 유지하세요. Signal 서버 API가 변경되면 오래된 릴리스가 작동하지 않을 수 있다고 업스트림에서 안내하고 있습니다.

3. 번호를 등록하고 인증합니다.

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

캡차가 필요한 경우(이 단계를 완료하려면 브라우저 접근이 필요함):

1. `https://signalcaptchas.org/registration/generate.html`을 엽니다.
2. 캡차를 완료한 후 "Open Signal"에서 `signalcaptcha://...` 링크 대상을 복사합니다.
3. 가능하면 브라우저 세션과 동일한 외부 IP에서 실행하세요(캡차 토큰은 빠르게 만료됨).
4. 즉시 등록하고 인증합니다.

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw를 구성하고 Gateway를 다시 시작한 다음 채널을 확인합니다.

```bash
# Gateway를 사용자 systemd 서비스로 실행하는 경우:
systemctl --user restart openclaw-gateway.service

# 그런 다음 확인:
openclaw doctor
openclaw channels status --probe
```

5. DM 발신자를 페어링합니다.
   - 봇 번호로 아무 메시지나 보냅니다.
   - 서버에서 승인합니다: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "Unknown contact"가 표시되지 않도록 휴대폰 연락처에 봇 번호를 저장합니다.

<Warning>
`signal-cli`로 전화번호 계정을 등록하면 해당 번호의 기본 Signal 앱 세션 인증이 해제될 수 있습니다. 전용 봇 번호를 사용하는 것이 좋습니다. 기존 휴대폰 앱 설정을 유지하려면 QR 연결 모드를 사용하세요.
</Warning>

업스트림 참고 자료:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- 캡차 절차: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 연결 절차: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 외부 데몬 모드(httpUrl)

`signal-cli`를 직접 관리하려면(JVM 콜드 스타트가 느린 경우, 컨테이너 초기화, CPU 공유 등) 데몬을 별도로 실행하고 OpenClaw가 이를 가리키도록 설정하세요.

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

이렇게 하면 자동 생성과 OpenClaw의 시작 대기를 건너뜁니다. 자동 생성된 프로세스의 시작이 느린 경우 `channels.signal.startupTimeoutMs`를 설정하세요.

## 컨테이너 모드(bbernhard/signal-cli-rest-api)

`signal-cli`를 네이티브로 실행하는 대신, REST + WebSocket 인터페이스로 `signal-cli`를 래핑하는 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 컨테이너를 사용하세요.

요구 사항:

- 실시간 메시지를 수신하려면 컨테이너를 **반드시** `MODE=json-rpc`로 실행해야 합니다.
- OpenClaw를 연결하기 전에 컨테이너 내부에서 Signal 계정을 등록하거나 연결하세요.

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
      apiMode: "container", // 또는 자동 감지를 위한 "auto"
    },
  },
}
```

`apiMode`는 OpenClaw가 사용할 프로토콜을 제어합니다.

| 값            | 동작                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------- |
| `"auto"`      | (기본값) 두 전송 방식을 모두 탐색하며, 스트리밍 시 컨테이너의 WebSocket 수신을 검증함           |
| `"native"`    | 네이티브 signal-cli 강제 사용(`/api/v1/rpc`의 JSON-RPC, `/api/v1/events`의 SSE)                 |
| `"container"` | bbernhard 컨테이너 강제 사용(`/v2/send`의 REST, `/v1/receive/{account}`의 WebSocket)            |

`apiMode`가 `"auto"`이면 OpenClaw는 반복 탐색을 방지하기 위해 감지된 모드를 데몬 URL별로 30초 동안 캐시합니다(두 전송 방식이 모두 정상일 때는 네이티브가 우선함). 컨테이너 수신은 `/v1/receive/{account}`가 WebSocket으로 업그레이드된 후에만 스트리밍용으로 선택되며, 이를 위해서는 `MODE=json-rpc`가 필요합니다.

컨테이너에서 일치하는 API를 제공하는 경우 컨테이너 모드는 네이티브 모드와 동일한 Signal 작업을 지원합니다. 여기에는 송신, 수신, 첨부 파일, 입력 중 표시, 읽음/열람 확인, 반응, 그룹 및 서식 있는 텍스트가 포함됩니다. OpenClaw는 `group.{base64(internal_id)}` 그룹 ID와 서식 있는 텍스트용 `text_mode: "styled"`를 포함하여 네이티브 Signal RPC 호출을 컨테이너의 REST 페이로드로 변환합니다.

운영 참고 사항:

- 컨테이너 모드에서는 `autoStart: false`를 사용하세요. `apiMode: "container"`가 선택된 경우 OpenClaw가 네이티브 데몬을 생성해서는 안 됩니다.
- 수신에는 `MODE=json-rpc`를 사용하세요. `MODE=normal`을 사용하면 `/v1/about`이 정상처럼 보일 수 있지만 `/v1/receive/{account}`가 WebSocket으로 업그레이드되지 않으므로 OpenClaw는 `auto` 모드에서 컨테이너 수신 스트리밍을 선택하지 않습니다.
- `httpUrl`이 bbernhard REST API를 가리키면 `apiMode: "container"`, 네이티브 `signal-cli` JSON-RPC/SSE를 가리키면 `"native"`, 배포 환경에 따라 달라질 수 있으면 `"auto"`를 설정하세요.
- 컨테이너 첨부 파일 다운로드에는 네이티브 모드와 동일한 미디어 바이트 제한이 적용됩니다. 서버가 `Content-Length`를 전송하면 전체 버퍼링 전에 크기 초과 응답을 거부하며, 그렇지 않으면 스트리밍 중에 거부합니다.

## 접근 제어(DM + 그룹)

DM:

- 기본값: `channels.signal.dmPolicy = "pairing"`.
- 알 수 없는 발신자는 페어링 코드를 받으며, 승인될 때까지 메시지가 무시됩니다(코드는 1시간 후 만료됨).
- `openclaw pairing list signal` 및 `openclaw pairing approve signal <CODE>`로 승인합니다.
- 페어링은 Signal DM의 기본 토큰 교환 방식입니다. 자세한 내용은 [페어링](/ko/channels/pairing)을 참조하세요.
- UUID만 있는 발신자(`sourceUuid`에서 가져옴)는 `channels.signal.allowFrom`에 `uuid:<id>` 형식으로 저장됩니다.

그룹:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `allowlist`가 설정된 경우 `channels.signal.groupAllowFrom`은 그룹 답장을 트리거할 수 있는 그룹 또는 발신자를 제어합니다. 항목은 Signal 그룹 ID(원시 값, `group:<id>` 또는 `signal:group:<id>`), 발신자 전화번호, `uuid:<id>` 값 또는 `*`일 수 있습니다.
- `channels.signal.groups["<group-id>" | "*"]`는 `requireMention`, `tools`, `toolsBySender`를 사용하여 그룹 동작을 재정의할 수 있습니다.
- 다중 계정 설정에서 계정별로 재정의하려면 `channels.signal.accounts.<id>.groups`를 사용하세요.
- `groupAllowFrom`을 통해 그룹을 허용 목록에 추가해도 멘션 제한이 자동으로 비활성화되지는 않습니다. 구체적으로 구성된 `channels.signal.groups["<group-id>"]` 항목은 `requireMention: true`가 명시적으로 설정되지 않는 한 모든 그룹 메시지를 처리합니다.
- 런타임 참고 사항: `channels.signal`이 완전히 없으면 `channels.defaults.groupPolicy`가 설정되어 있더라도 런타임은 그룹 검사 시 `groupPolicy="allowlist"`로 대체합니다.

## 작동 방식(동작)

- 네이티브 모드: `signal-cli`가 데몬으로 실행되며 Gateway가 SSE를 통해 이벤트를 읽습니다.
- 컨테이너 모드: Gateway가 REST API를 통해 전송하고 WebSocket을 통해 수신합니다.
- 수신 메시지는 공유 채널 봉투 형식으로 정규화됩니다.
- 답장은 항상 동일한 번호 또는 그룹으로 라우팅됩니다.
- 수신 메시지에 대한 답장에는 백엔드가 수신 타임스탬프와 작성자를 허용할 때 네이티브 Signal 인용 메타데이터가 포함됩니다. 인용 메타데이터가 없거나 거부되면 OpenClaw는 답장을 일반 메시지로 전송합니다.
- 네이티브 인용 사용은 `channels.signal.replyToMode = off | first | all | batched`로 구성하거나, 채팅 유형별 재정의를 위해 `channels.signal.replyToModeByChatType.direct/group`을 사용하세요. `channels.signal.accounts.<id>` 아래의 계정 수준 값이 우선합니다.

## 미디어 + 제한

- 발신 텍스트는 `channels.signal.textChunkLimit`(기본값 4000)에 맞춰 청크로 분할됩니다.
- 선택적 줄바꿈 기준 청크 분할: 길이 기준으로 분할하기 전에 빈 줄(문단 경계)을 기준으로 나누려면 `channels.signal.chunkMode="newline"`을 설정합니다.
- 첨부 파일을 지원합니다(`signal-cli`에서 base64로 가져옴).
- `contentType`이 없으면 음성 메모 첨부 파일은 `signal-cli` 파일 이름을 MIME 대체값으로 사용하므로, 오디오 전사에서 AAC 음성 메모를 계속 분류할 수 있습니다.
- 기본 미디어 용량 제한: `channels.signal.mediaMaxMb`(기본값 8).
- 미디어 다운로드를 건너뛰려면 `channels.signal.ignoreAttachments`를 사용합니다.
- 그룹 기록 컨텍스트는 `channels.signal.historyLimit`(또는 `channels.signal.accounts.*.historyLimit`)을 사용하며, 설정되지 않은 경우 `messages.groupChat.historyLimit`을 사용합니다. 비활성화하려면 `0`으로 설정합니다(기본값 50).

## 입력 중 표시 + 읽음 확인

- **입력 중 표시**: OpenClaw는 `signal-cli sendTyping`을 통해 입력 중 신호를 전송하고 응답이 실행되는 동안 이를 갱신합니다.
- **읽음 확인**: `channels.signal.sendReadReceipts`가 true이면 OpenClaw는 허용된 DM의 읽음 확인을 전달합니다.
- `signal-cli`는 그룹의 읽음 확인을 제공하지 않습니다.

## 수명 주기 상태 반응

Signal이 수신 턴에 공유 대기열 등록/사고/도구/Compaction/완료/오류 반응 수명 주기를 표시하도록 하려면 `messages.statusReactions.enabled: true`를 설정합니다. Signal은 수신 메시지 타임스탬프를 반응 대상으로 사용합니다. 그룹 반응은 Signal 그룹 ID와 원래 발신자를 대상 작성자로 지정하여 전송됩니다.

상태 반응에는 확인 반응과 일치하는 `messages.ackReactionScope`(`direct`, `group-all`, `group-mentions` 또는 `all`)도 필요합니다. Signal 상태 반응을 비활성화하려면 `channels.signal.reactionLevel: "off"`를 설정합니다.

`messages.removeAckAfterReply: true`는 구성된 유지 시간이 지난 후 최종 상태 반응을 제거합니다. 그렇지 않으면 Signal은 최종 완료/오류 상태 이후 초기 확인 반응을 복원합니다.

## 반응(메시지 도구)

`channel=signal`과 함께 `message action=react`를 사용합니다.

- 대상: 발신자의 E.164 또는 UUID(페어링 출력의 `uuid:<id>` 사용, 접두사 없는 UUID도 사용 가능).
- `messageId`는 반응할 메시지의 Signal 타임스탬프입니다.
- 그룹 반응에는 `targetAuthor` 또는 `targetAuthorUuid`가 필요합니다.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

구성:

- `channels.signal.actions.reactions`: 반응 작업을 활성화/비활성화합니다(기본값 true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`(기본값 `minimal`).
  - `off`/`ack`는 에이전트 반응을 비활성화합니다(메시지 도구 `react`에서 오류 발생).
  - `minimal`/`extensive`는 에이전트 반응을 활성화하고 안내 수준을 설정합니다.
- 계정별 재정의: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## 승인 반응

Signal 실행 및 Plugin 승인 프롬프트는 최상위 `approvals.exec` 및 `approvals.plugin` 라우팅 블록을 사용합니다. Signal에는 `channels.signal.execApprovals` 블록이 없습니다.

- `👍`은 한 번 승인합니다.
- `👎`은 거부합니다.
- 요청에서 영구 승인을 제공하는 경우 `/approve <id> allow-always`를 사용합니다.

승인 반응을 처리하려면 `channels.signal.allowFrom`, `channels.signal.defaultTo` 또는 일치하는 계정 수준 필드에 명시적인 Signal 승인자가 필요합니다. 동일한 직접 채팅의 실행 승인 프롬프트는 명시적인 승인자가 없어도 중복 로컬 `/approve` 대체 경로를 숨길 수 있습니다. 승인자가 없는 그룹 승인은 로컬 대체 경로를 계속 표시합니다.

## 전송 대상(CLI/Cron)

- DM: `signal:+15551234567`(또는 일반 E.164).
- UUID DM: `uuid:<id>`(또는 접두사 없는 UUID).
- 그룹: `signal:group:<groupId>`.
- 사용자 이름: `username:<name>`(Signal 계정에서 지원하는 경우).

## 별칭

반복해서 사용하는 Signal 대상에 안정적인 이름을 지정하려면 별칭을 구성합니다. 별칭은 OpenClaw 측 구성에만 적용되며 Signal 연락처를 생성하거나 편집하지 않습니다.

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

Signal 전송 대상을 허용하는 모든 위치에서 별칭을 사용할 수 있습니다.

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
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

`openclaw directory peers list --channel signal`과 `openclaw directory groups list --channel signal`은 구성된 별칭을 나열합니다. Signal 디렉터리는 구성에 기반하며 Signal 연락처를 실시간으로 조회하거나 Signal 계정을 변경하지 않습니다.

## 문제 해결

먼저 다음 진단 절차를 실행합니다.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

필요하면 DM 페어링 상태를 확인합니다.

```bash
openclaw pairing list signal
```

일반적인 오류:

- 데몬에 연결할 수 있지만 응답이 없음: 계정/데몬 설정(`httpUrl`, `account`)과 수신 모드를 확인합니다.
- DM이 무시됨: 발신자가 페어링 승인을 기다리고 있습니다.
- 그룹 메시지가 무시됨: 그룹 발신자/멘션 제한이 전송을 차단합니다.
- 편집 후 구성 검증 오류: `openclaw doctor --fix`를 실행합니다.
- 진단에 Signal이 없음: `channels.signal.enabled: true`인지 확인합니다.

추가 확인:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

분류 절차는 [채널 문제 해결](/ko/channels/troubleshooting)을 참조하세요.

## 보안 참고 사항

- `signal-cli`는 계정 키를 로컬에 저장합니다(일반적으로 `~/.local/share/signal-cli/data/`).
- 서버를 마이그레이션하거나 재구축하기 전에 Signal 계정 상태를 백업합니다.
- 더 광범위한 DM 접근을 명시적으로 원하는 경우가 아니라면 `channels.signal.dmPolicy: "pairing"`을 유지합니다.
- SMS 인증은 등록 또는 복구 절차에만 필요하지만, 번호/계정에 대한 제어권을 잃으면 재등록이 복잡해질 수 있습니다.

## 구성 참조(Signal)

전체 구성: [구성](/ko/gateway/configuration)

공급자 옵션:

- `channels.signal.enabled`: 채널 시작을 활성화/비활성화합니다.
- `channels.signal.apiMode`: `auto | native | container`(기본값: auto). [컨테이너 모드](#container-mode-bbernhardsignal-cli-rest-api)를 참조하세요.
- `channels.signal.account`: 봇 계정의 E.164입니다.
- `channels.signal.cliPath`: `signal-cli` 경로입니다.
- `channels.signal.configPath`: 선택적 `signal-cli --config` 디렉터리입니다.
- `channels.signal.httpUrl`: 전체 데몬 URL입니다(호스트/포트 재정의).
- `channels.signal.httpHost`, `channels.signal.httpPort`: 데몬 바인딩입니다(기본값 `127.0.0.1:8080`).
- `channels.signal.autoStart`: 데몬을 자동으로 생성합니다(`httpUrl`이 설정되지 않은 경우 기본값 true).
- `channels.signal.startupTimeoutMs`: 밀리초 단위의 시작 대기 시간 제한입니다(최솟값 1000, 최댓값 120000, 기본값 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: 첨부 파일 다운로드를 건너뜁니다.
- `channels.signal.ignoreStories`: 데몬의 스토리를 무시합니다.
- `channels.signal.sendReadReceipts`: 읽음 확인을 전달합니다.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: pairing).
- `channels.signal.allowFrom`: DM 허용 목록(E.164 또는 `uuid:<id>`). `open`에는 `"*"`가 필요합니다. Signal에는 사용자 이름이 없으므로 전화번호/UUID ID를 사용합니다.
- `channels.signal.aliases`: DM 또는 그룹 전송 대상을 위한 OpenClaw 측 별칭입니다.
- `channels.signal.groupPolicy`: `open | allowlist | disabled`(기본값: allowlist).
- `channels.signal.groupAllowFrom`: 그룹 허용 목록입니다. Signal 그룹 ID(원시 값, `group:<id>` 또는 `signal:group:<id>`), 발신자 E.164 번호 또는 `uuid:<id>` 값을 허용합니다.
- `channels.signal.groups`: Signal 그룹 ID(또는 `"*"`)를 키로 사용하는 그룹별 재정의입니다. 지원되는 필드: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: 다중 계정 설정을 위한 `channels.signal.groups`의 계정별 버전입니다.
- `channels.signal.accounts.<id>.aliases`: 계정별 별칭이며 최상위 별칭과 병합됩니다.
- `channels.signal.replyToMode`: 기본 답장 인용 모드, `off | first | all | batched`(기본값: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: 채팅 유형별 기본 답장 인용 재정의입니다.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: 계정별 답장 인용 재정의입니다.
- `channels.signal.historyLimit`: 컨텍스트에 포함할 최대 그룹 메시지 수입니다(0이면 비활성화).
- `channels.signal.dmHistoryLimit`: 사용자 턴 단위의 DM 기록 제한입니다. 사용자별 재정의: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: 발신 청크의 문자 수입니다(기본값 4000).
- `channels.signal.chunkMode`: 길이 기준 청크 분할 전에 빈 줄(문단 경계)을 기준으로 나누려면 `length`(기본값) 또는 `newline`을 사용합니다.
- `channels.signal.mediaMaxMb`: 수신/발신 미디어의 MB 단위 용량 제한입니다(기본값 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`(기본값 `minimal`). [반응](#reactions-message-tool)을 참조하세요.
- `channels.signal.reactionNotifications`: `off | own | all | allowlist`(기본값 `own`) - 다른 사용자의 수신 반응을 에이전트에 알리는 조건입니다.
- `channels.signal.reactionAllowlist`: `reactionNotifications: "allowlist"`일 때 반응이 에이전트에 통지되는 발신자입니다.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: 채널 간에 공유되는 블록 모드 스트리밍 제어입니다. [스트리밍](/ko/concepts/streaming)을 참조하세요.

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns`(Signal은 기본 멘션을 지원하지 않음).
- `messages.groupChat.mentionPatterns`(전역 대체값).
- `messages.responsePrefix`.

## 관련 항목

- [채널 개요](/ko/channels) - 지원되는 모든 채널
- [페어링](/ko/channels/pairing) - DM 인증 및 페어링 절차
- [그룹](/ko/channels/groups) - 그룹 채팅 동작 및 멘션 제한
- [채널 라우팅](/ko/channels/channel-routing) - 메시지의 세션 라우팅
- [보안](/ko/gateway/security) - 접근 모델 및 보안 강화
