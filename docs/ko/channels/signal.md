---
read_when:
    - Signal 지원 설정하기
    - Signal 송수신 디버깅
summary: signal-cli(네이티브 데몬 또는 bbernhard 컨테이너)를 통한 Signal 지원, 설정 경로, 번호 모델
title: Signal
x-i18n:
    generated_at: "2026-06-27T17:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

상태: 외부 CLI 통합. Gateway는 HTTP를 통해 `signal-cli`와 통신합니다. 네이티브 데몬(JSON-RPC + SSE) 또는 bbernhard/signal-cli-rest-api 컨테이너(REST + WebSocket)를 사용할 수 있습니다.

## 사전 요구 사항

- 서버에 OpenClaw가 설치되어 있어야 합니다(아래 Linux 흐름은 Ubuntu 24에서 테스트됨).
- 다음 중 하나:
  - 호스트에서 `signal-cli`를 사용할 수 있음(네이티브 모드), **또는**
  - `bbernhard/signal-cli-rest-api` Docker 컨테이너(컨테이너 모드).
- 확인 SMS 1개를 받을 수 있는 전화번호(SMS 등록 경로용).
- 등록 중 Signal 캡차(`signalcaptchas.org`)를 위한 브라우저 접근.

## 빠른 설정(초보자)

1. 봇에는 **별도의 Signal 번호**를 사용합니다(권장).
2. OpenClaw Plugin을 설치합니다.

```bash
openclaw plugins install @openclaw/signal
```

3. `signal-cli`를 설치합니다(JVM 빌드를 사용하는 경우 Java 필요).
4. 설정 경로 하나를 선택합니다.
   - **경로 A(QR 연결):** `signal-cli link -n "OpenClaw"`를 실행하고 Signal로 스캔합니다.
   - **경로 B(SMS 등록):** 캡차 + SMS 확인으로 전용 번호를 등록합니다.
5. OpenClaw를 구성하고 Gateway를 다시 시작합니다.
6. 첫 DM을 보내고 페어링을 승인합니다(`openclaw pairing approve signal <CODE>`).

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

필드 참조:

| 필드         | 설명                                                        |
| ------------ | ----------------------------------------------------------- |
| `account`    | E.164 형식의 봇 전화번호(`+15551234567`)                    |
| `cliPath`    | `signal-cli` 경로(`PATH`에 있으면 `signal-cli`)             |
| `configPath` | `--config`로 전달되는 signal-cli 구성 디렉터리              |
| `dmPolicy`   | DM 접근 정책(`pairing` 권장)                                |
| `allowFrom`  | DM이 허용되는 전화번호 또는 `uuid:<id>` 값                  |

## 개요

- `signal-cli`를 통한 Signal 채널(내장 libsignal 아님).
- 결정적 라우팅: 응답은 항상 Signal로 돌아갑니다.
- DM은 에이전트의 기본 세션을 공유하고, 그룹은 격리됩니다(`agent:<agentId>:signal:group:<groupId>`).

## 구성 쓰기

기본적으로 Signal은 `/config set|unset`으로 트리거되는 구성 업데이트 쓰기가 허용됩니다(`commands.config: true` 필요).

비활성화하려면:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## 번호 모델(중요)

- Gateway는 **Signal 기기**(`signal-cli` 계정)에 연결됩니다.
- 봇을 **개인 Signal 계정**에서 실행하면, 자신의 메시지는 무시됩니다(루프 보호).
- "내가 봇에게 문자를 보내고 봇이 답한다"는 방식에는 **별도의 봇 번호**를 사용하세요.

## 설정 경로 A: 기존 Signal 계정 연결(QR)

1. `signal-cli`를 설치합니다(JVM 또는 네이티브 빌드).
2. 봇 계정을 연결합니다.
   - `signal-cli link -n "OpenClaw"`를 실행한 다음 Signal에서 QR을 스캔합니다.
3. Signal을 구성하고 Gateway를 시작합니다.

예시:

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

다중 계정 지원: 계정별 구성과 선택적 `name`이 있는 `channels.signal.accounts`를 사용합니다. 공유 패턴은 [`gateway/configuration`](/ko/gateway/config-channels#multi-account-all-channels)을 참고하세요.

## 설정 경로 B: 전용 봇 번호 등록(SMS, Linux)

기존 Signal 앱 계정을 연결하는 대신 전용 봇 번호를 사용하려는 경우 이 방법을 사용합니다.

1. SMS를 받을 수 있는 번호를 준비합니다(유선전화는 음성 확인 가능).
   - 계정/세션 충돌을 피하려면 전용 봇 번호를 사용하세요.
2. Gateway 호스트에 `signal-cli`를 설치합니다.

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

JVM 빌드(`signal-cli-${VERSION}.tar.gz`)를 사용하는 경우 먼저 JRE 25+를 설치합니다.
`signal-cli`를 최신 상태로 유지하세요. 업스트림에서는 Signal 서버 API가 변경되면 오래된 릴리스가 깨질 수 있다고 안내합니다.

3. 번호를 등록하고 확인합니다.

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

캡차가 필요한 경우:

1. `https://signalcaptchas.org/registration/generate.html`을 엽니다.
2. 캡차를 완료하고 "Open Signal"에서 `signalcaptcha://...` 링크 대상을 복사합니다.
3. 가능하면 브라우저 세션과 동일한 외부 IP에서 실행합니다.
4. 즉시 다시 등록을 실행합니다(캡차 토큰은 빨리 만료됨).

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. OpenClaw를 구성하고 Gateway를 다시 시작한 뒤 채널을 확인합니다.

```bash
# Gateway를 사용자 systemd 서비스로 실행하는 경우:
systemctl --user restart openclaw-gateway.service

# 그런 다음 확인:
openclaw doctor
openclaw channels status --probe
```

5. DM 발신자를 페어링합니다.
   - 봇 번호로 아무 메시지나 보냅니다.
   - 서버에서 코드를 승인합니다: `openclaw pairing approve signal <PAIRING_CODE>`.
   - "알 수 없는 연락처"를 피하려면 휴대폰에 봇 번호를 연락처로 저장합니다.

<Warning>
`signal-cli`로 전화번호 계정을 등록하면 해당 번호의 기본 Signal 앱 세션 인증이 해제될 수 있습니다. 전용 봇 번호를 선호하거나, 기존 휴대폰 앱 설정을 유지해야 한다면 QR 연결 모드를 사용하세요.
</Warning>

업스트림 참조:

- `signal-cli` README: `https://github.com/AsamK/signal-cli`
- 캡차 흐름: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- 연결 흐름: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## 외부 데몬 모드(httpUrl)

`signal-cli`를 직접 관리하려는 경우(느린 JVM 콜드 스타트, 컨테이너 초기화, 공유 CPU), 데몬을 별도로 실행하고 OpenClaw가 이를 가리키도록 합니다.

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

이렇게 하면 OpenClaw 내부의 자동 생성과 시작 대기를 건너뜁니다. 자동 생성 시 시작이 느리면 `channels.signal.startupTimeoutMs`를 설정하세요.

## 컨테이너 모드(bbernhard/signal-cli-rest-api)

`signal-cli`를 네이티브로 실행하는 대신 [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) Docker 컨테이너를 사용할 수 있습니다. 이는 REST API와 WebSocket 인터페이스 뒤에서 `signal-cli`를 래핑합니다.

요구 사항:

- 실시간 메시지 수신을 위해 컨테이너는 반드시 `MODE=json-rpc`로 실행되어야 합니다.
- OpenClaw를 연결하기 전에 컨테이너 안에서 Signal 계정을 등록하거나 연결하세요.

예시 `docker-compose.yml` 서비스:

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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

`apiMode` 필드는 OpenClaw가 사용할 프로토콜을 제어합니다.

| 값            | 동작                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `"auto"`      | (기본값) 두 전송 방식을 모두 프로브하며, 스트리밍은 컨테이너 WebSocket 수신을 검증합니다             |
| `"native"`    | 네이티브 signal-cli 강제 사용(`/api/v1/rpc`의 JSON-RPC, `/api/v1/events`의 SSE)                       |
| `"container"` | bbernhard 컨테이너 강제 사용(`/v2/send`의 REST, `/v1/receive/{account}`의 WebSocket)                  |

`apiMode`가 `"auto"`이면 OpenClaw는 반복 프로브를 피하기 위해 감지된 모드를 30초 동안 캐시합니다. 컨테이너 수신은 `/v1/receive/{account}`가 WebSocket으로 업그레이드된 뒤에만 스트리밍용으로 선택되며, 이를 위해서는 `MODE=json-rpc`가 필요합니다.

컨테이너 모드는 컨테이너가 일치하는 API를 노출하는 경우 네이티브 모드와 동일한 Signal 채널 작업을 지원합니다. 전송, 수신, 첨부 파일, 입력 표시기, 읽음/조회 수신 확인, 반응, 그룹, 서식 있는 텍스트가 포함됩니다. OpenClaw는 네이티브 Signal RPC 호출을 컨테이너의 REST 페이로드로 변환하며, 여기에는 `group.{base64(internal_id)}` 그룹 ID와 서식 있는 텍스트용 `text_mode: "styled"`가 포함됩니다.

운영 참고 사항:

- 컨테이너 모드에서는 `autoStart: false`를 사용하세요. `apiMode: "container"`가 선택된 경우 OpenClaw가 네이티브 데몬을 생성해서는 안 됩니다.
- 수신에는 `MODE=json-rpc`를 사용하세요. `MODE=normal`은 `/v1/about`을 정상처럼 보이게 할 수 있지만, `/v1/receive/{account}`는 WebSocket으로 업그레이드되지 않으므로 OpenClaw는 `auto` 모드에서 컨테이너 수신 스트리밍을 선택하지 않습니다.
- `httpUrl`이 bbernhard의 REST API를 가리킨다는 것을 알고 있으면 `apiMode: "container"`를 설정합니다. 네이티브 `signal-cli` JSON-RPC/SSE를 가리킨다는 것을 알고 있으면 `apiMode: "native"`를 설정합니다. 배포가 달라질 수 있으면 `"auto"`를 사용합니다.
- 컨테이너 첨부 파일 다운로드는 네이티브 모드와 동일한 미디어 바이트 제한을 따릅니다. 서버가 `Content-Length`를 보내면 크기 초과 응답은 완전히 버퍼링되기 전에 거부되며, 그렇지 않으면 스트리밍 중에 거부됩니다.

## 접근 제어(DM + 그룹)

DM:

- 기본값: `channels.signal.dmPolicy = "pairing"`.
- 알 수 없는 발신자는 페어링 코드를 받으며, 승인될 때까지 메시지는 무시됩니다(코드는 1시간 후 만료).
- 다음으로 승인:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- 페어링은 Signal DM의 기본 토큰 교환 방식입니다. 자세히: [페어링](/ko/channels/pairing)
- UUID만 있는 발신자(`sourceUuid`에서 가져옴)는 `channels.signal.allowFrom`에 `uuid:<id>`로 저장됩니다.

그룹:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom`은 `allowlist`가 설정된 경우 어떤 그룹 또는 발신자가 그룹 응답을 트리거할 수 있는지 제어합니다. 항목은 Signal 그룹 ID(raw, `group:<id>`, 또는 `signal:group:<id>`), 발신자 전화번호, `uuid:<id>` 값, 또는 `*`가 될 수 있습니다.
- `channels.signal.groups["<group-id>" | "*"]`는 `requireMention`, `tools`, `toolsBySender`로 그룹 동작을 재정의할 수 있습니다.
- 다중 계정 설정에서 계정별 재정의에는 `channels.signal.accounts.<id>.groups`를 사용합니다.
- `groupAllowFrom`을 통해 Signal 그룹을 허용 목록에 추가해도 그 자체로 멘션 게이팅이 비활성화되지는 않습니다. 구체적으로 구성된 `channels.signal.groups["<group-id>"]` 항목은 `requireMention=true`가 설정되지 않은 한 모든 그룹 메시지를 처리합니다.
- 런타임 참고: `channels.signal`이 완전히 없으면 런타임은 그룹 검사에 `groupPolicy="allowlist"`로 폴백합니다(`channels.defaults.groupPolicy`가 설정되어 있어도).

## 작동 방식(동작)

- 네이티브 모드: `signal-cli`가 데몬으로 실행되며, Gateway는 SSE를 통해 이벤트를 읽습니다.
- 컨테이너 모드: Gateway는 REST API로 전송하고 WebSocket으로 수신합니다.
- 인바운드 메시지는 공유 채널 envelope로 정규화됩니다.
- 응답은 항상 같은 번호 또는 그룹으로 다시 라우팅됩니다.

## 미디어 + 제한

- 아웃바운드 텍스트는 `channels.signal.textChunkLimit`(기본값 4000)에 맞춰 청크로 나뉩니다.
- 선택적 줄바꿈 청킹: 길이 기준 청킹 전에 빈 줄(문단 경계)을 기준으로 나누려면 `channels.signal.chunkMode="newline"`을 설정합니다.
- 첨부 파일이 지원됩니다(`signal-cli`에서 base64로 가져옴).
- 음성 메모 첨부 파일은 `contentType`이 없을 때 `signal-cli` 파일 이름을 MIME 폴백으로 사용하므로, 오디오 전사가 AAC 음성 메모를 계속 분류할 수 있습니다.
- 기본 미디어 한도: `channels.signal.mediaMaxMb`(기본값 8).
- 미디어 다운로드를 건너뛰려면 `channels.signal.ignoreAttachments`를 사용합니다.
- 그룹 기록 컨텍스트는 `channels.signal.historyLimit`(또는 `channels.signal.accounts.*.historyLimit`)을 사용하며, `messages.groupChat.historyLimit`로 폴백합니다. 비활성화하려면 `0`으로 설정합니다(기본값 50).

## 입력 표시 + 읽음 확인

- **입력 표시기**: OpenClaw는 `signal-cli sendTyping`을 통해 입력 중 신호를 보내고, 답변이 실행되는 동안 이를 갱신합니다.
- **읽음 확인**: `channels.signal.sendReadReceipts`가 true이면 OpenClaw는 허용된 DM의 읽음 확인을 전달합니다.
- signal-cli는 그룹의 읽음 확인을 노출하지 않습니다.

## 반응 (message 도구)

- `channel=signal`과 함께 `message action=react`를 사용합니다.
- 대상: 보낸 사람의 E.164 또는 UUID(페어링 출력의 `uuid:<id>` 사용, 단독 UUID도 동작함).
- `messageId`는 반응하려는 메시지의 Signal 타임스탬프입니다.
- 그룹 반응에는 `targetAuthor` 또는 `targetAuthorUuid`가 필요합니다.

예시:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

구성:

- `channels.signal.actions.reactions`: 반응 작업을 활성화/비활성화합니다(기본값 true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack`는 에이전트 반응을 비활성화합니다(message 도구 `react`는 오류를 반환함).
  - `minimal`/`extensive`는 에이전트 반응을 활성화하고 안내 수준을 설정합니다.
- 계정별 재정의: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## 승인 반응

Signal exec 및 Plugin 승인 프롬프트는 최상위 `approvals.exec` 및
`approvals.plugin` 라우팅 블록을 사용합니다. Signal에는
`channels.signal.execApprovals` 블록이 없습니다.

- `👍`는 한 번 승인합니다.
- `👎`는 거부합니다.
- 요청이 영구 승인을 제공할 때는 `/approve <id> allow-always`를 사용합니다.

승인 반응 해석에는 `channels.signal.allowFrom`, `channels.signal.defaultTo` 또는
일치하는 계정 수준 필드의 명시적 Signal 승인자가 필요합니다.
직접 같은 채팅의 exec 승인 프롬프트는 명시적 승인자 없이도 중복 로컬 `/approve` 폴백을
억제할 수 있습니다. 승인자가 없는 그룹 승인은 로컬 폴백을 계속 표시합니다.

## 전달 대상 (CLI/cron)

- DM: `signal:+15551234567`(또는 일반 E.164).
- UUID DM: `uuid:<id>`(또는 단독 UUID).
- 그룹: `signal:group:<groupId>`.
- 사용자 이름: `username:<name>`(Signal 계정에서 지원하는 경우).

## 문제 해결

먼저 이 절차를 실행합니다.

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

필요한 경우 DM 페어링 상태를 확인합니다.

```bash
openclaw pairing list signal
```

일반적인 실패:

- 데몬에 접근 가능하지만 응답 없음: 계정/데몬 설정(`httpUrl`, `account`) 및 수신 모드를 확인합니다.
- DM이 무시됨: 보낸 사람이 페어링 승인 대기 중입니다.
- 그룹 메시지가 무시됨: 그룹 보낸 사람/멘션 게이트가 전달을 차단합니다.
- 편집 후 구성 검증 오류: `openclaw doctor --fix`를 실행합니다.
- 진단에 Signal이 없음: `channels.signal.enabled: true`를 확인합니다.

추가 확인:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

분류 흐름은 [/channels/troubleshooting](/ko/channels/troubleshooting)을 참조하세요.

## 보안 참고 사항

- `signal-cli`는 계정 키를 로컬에 저장합니다(일반적으로 `~/.local/share/signal-cli/data/`).
- 서버 마이그레이션 또는 재빌드 전에 Signal 계정 상태를 백업하세요.
- 더 넓은 DM 접근을 명시적으로 원하지 않는 한 `channels.signal.dmPolicy: "pairing"`을 유지하세요.
- SMS 인증은 등록 또는 복구 흐름에만 필요하지만, 번호/계정에 대한 제어권을 잃으면 재등록이 복잡해질 수 있습니다.

## 구성 참조 (Signal)

전체 구성: [구성](/ko/gateway/configuration)

제공자 옵션:

- `channels.signal.enabled`: 채널 시작을 활성화/비활성화합니다.
- `channels.signal.apiMode`: `auto | native | container`(기본값: auto). [컨테이너 모드](#container-mode-bbernhardsignal-cli-rest-api)를 참조하세요.
- `channels.signal.account`: 봇 계정의 E.164입니다.
- `channels.signal.cliPath`: `signal-cli` 경로입니다.
- `channels.signal.configPath`: 선택적 `signal-cli --config` 디렉터리입니다.
- `channels.signal.httpUrl`: 전체 데몬 URL입니다(host/port를 재정의함).
- `channels.signal.httpHost`, `channels.signal.httpPort`: 데몬 바인드입니다(기본값 127.0.0.1:8080).
- `channels.signal.autoStart`: 데몬을 자동 생성합니다(`httpUrl`이 설정되지 않은 경우 기본값 true).
- `channels.signal.startupTimeoutMs`: 시작 대기 제한 시간(ms)입니다(상한 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: 첨부 파일 다운로드를 건너뜁니다.
- `channels.signal.ignoreStories`: 데몬의 스토리를 무시합니다.
- `channels.signal.sendReadReceipts`: 읽음 확인을 전달합니다.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled`(기본값: pairing).
- `channels.signal.allowFrom`: DM 허용 목록(E.164 또는 `uuid:<id>`). `open`에는 `"*"`가 필요합니다. Signal에는 사용자 이름이 없으므로 전화번호/UUID ID를 사용하세요.
- `channels.signal.groupPolicy`: `open | allowlist | disabled`(기본값: allowlist).
- `channels.signal.groupAllowFrom`: 그룹 허용 목록입니다. Signal 그룹 ID(원시 값, `group:<id>` 또는 `signal:group:<id>`), 보낸 사람 E.164 번호 또는 `uuid:<id>` 값을 허용합니다.
- `channels.signal.groups`: Signal 그룹 ID(또는 `"*"`)로 키가 지정된 그룹별 재정의입니다. 지원 필드: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: 다중 계정 설정을 위한 `channels.signal.groups`의 계정별 버전입니다.
- `channels.signal.historyLimit`: 컨텍스트로 포함할 최대 그룹 메시지 수입니다(0은 비활성화).
- `channels.signal.dmHistoryLimit`: 사용자 턴 단위의 DM 기록 제한입니다. 사용자별 재정의: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: 발신 청크 크기(문자)입니다.
- `channels.signal.chunkMode`: 길이 청킹 전에 빈 줄(문단 경계)을 기준으로 분할하려면 `length`(기본값) 또는 `newline`을 사용합니다.
- `channels.signal.mediaMaxMb`: 수신/발신 미디어 상한(MB)입니다.

관련 전역 옵션:

- `agents.list[].groupChat.mentionPatterns`(Signal은 네이티브 멘션을 지원하지 않음).
- `messages.groupChat.mentionPatterns`(전역 폴백).
- `messages.responsePrefix`.

## 관련 항목

- [채널 개요](/ko/channels) — 지원되는 모든 채널
- [페어링](/ko/channels/pairing) — DM 인증 및 페어링 흐름
- [그룹](/ko/channels/groups) — 그룹 채팅 동작 및 멘션 게이트
- [채널 라우팅](/ko/channels/channel-routing) — 메시지의 세션 라우팅
- [보안](/ko/gateway/security) — 접근 모델 및 강화
