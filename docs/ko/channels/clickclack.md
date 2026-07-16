---
read_when:
    - OpenClaw를 ClickClack 워크스페이스에 연결하기
    - ClickClack 봇 ID 테스트하기
summary: ClickClack 봇 토큰 채널 설정 및 대상 구문
title: ClickClack
x-i18n:
    generated_at: "2026-07-16T12:16:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2c422664ecdc9e41eb1810ca61654b886f1c51357fb9f48054d30c20a86ea8bc
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack은 일급 ClickClack 봇 토큰을 통해 OpenClaw를 자체 호스팅 ClickClack 워크스페이스에 연결합니다.

OpenClaw 에이전트를 ClickClack 봇 사용자로 표시하려는 경우 사용하십시오. ClickClack은 독립 서비스 봇과 사용자 소유 봇을 지원합니다. 사용자 소유 봇은 `owner_user_id`을 유지하며 부여한 토큰 범위만 받습니다.

## 빠른 설정

ClickClack에서 **Workspace settings → Integrations → OpenClaw**를 열고 봇을
생성한 다음 토큰을 복사하십시오. 그런 다음 채널을 구성합니다.

```bash
openclaw channels add clickclack --base-url https://clickclack.example.com --token ccb_... --workspace default
```

`workspace`은 워크스페이스 ID(`wsp_...`), 슬러그 또는 표시 이름을 허용합니다.
`channels add`은 저장 후 서버, 토큰 및 워크스페이스를 검증한 다음
실행 중인 Gateway가 새 계정을 인식했는지 보고합니다. OpenClaw가
이미 실행 중이면 ClickClack이 자동으로 연결되므로 두 번째 명령은
필요하지 않습니다. 그렇지 않으면 다음 명령으로 시작하십시오.

```bash
openclaw gateway
```

안내형 설정을 사용하려면 다음을 실행하십시오.

```bash
openclaw onboard
```

ClickClack을 선택한 다음 메시지가 표시되면 서버 URL, 봇 토큰 및 워크스페이스를
입력하십시오. 안내형 설정은 저장 후 서버, 토큰 및 워크스페이스를 확인합니다.
확인에 실패해도 구성이 삭제되지는 않습니다.

### 대안: 환경 변수 기반 토큰

기본 계정은 구성에 토큰을 저장하는 대신 `CLICKCLACK_BOT_TOKEN`을 읽을 수
있습니다.

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw channels add clickclack --base-url https://clickclack.example.com --workspace default --use-env
openclaw gateway
```

명명된 계정은 구성된 토큰 또는 토큰 파일을 사용해야 합니다. 공유 환경
변수는 의도적으로 기본 계정에서만 사용할 수 있습니다.

### JSON5 참조

동등한 구성 형태는 다음과 같습니다.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

`baseUrl`, 토큰 소스 및 `workspace`이 모두 설정된 경우에만
계정이 구성된 것으로 간주됩니다. 기본 계정의 토큰 소스는 `token`,
`tokenFile` 또는 `CLICKCLACK_BOT_TOKEN`일 수 있습니다. `workspace`은 워크스페이스
ID(`wsp_...`), 슬러그 또는 이름을 허용하며, Gateway는 시작 시 이를 ID로 확인합니다.

### 계정 구성 키

| 키                      | 기본값              | 참고                                                                                    |
| ----------------------- | ------------------- | --------------------------------------------------------------------------------------- |
| `baseUrl`               | 없음(필수)          | ClickClack 서버 URL.                                                                    |
| `token`                 | 없음                | 일반 문자열 또는 비밀 참조(`source: "env" \| "file" \| "exec"`) 형식의 봇 토큰.         |
| `tokenFile`             | 없음                | 봇 토큰 파일의 경로이며 `token`보다 우선합니다.                                |
| `workspace`             | 없음(필수)          | 워크스페이스 ID, 슬러그 또는 이름.                                                      |
| `replyMode`             | `"agent"`           | `"agent"`은 전체 에이전트 파이프라인을 실행하고, `"model"`은 짧은 직접 모델 완성을 전송합니다. |
| `defaultTo`             | `"channel:general"` | 발신 경로에 대상이 지정되지 않았을 때 사용하는 대상.                                    |
| `allowFrom`             | `["*"]`             | 수신 DM 및 채널 메시지에 대한 사용자 ID 허용 목록.                                     |
| `botUserId`             | 자동 감지           | 시작 시 봇 토큰 ID에서 확인됩니다.                                                     |
| `agentId`               | 경로 기본값         | 이 계정의 수신 메시지를 하나의 에이전트에 고정합니다.                                   |
| `toolsAllow`            | 없음                | 이 계정에서 보내는 에이전트 응답에 대한 도구 허용 목록.                                |
| `model`, `systemPrompt` | 없음                | `replyMode: "model"` 완성에서 사용됩니다.                                              |
| `commandMenu`           | `true`              | ClickClack 작성기 자동 완성에 네이티브 명령을 게시합니다.                               |
| `reconnectMs`           | `1500`              | 실시간 재연결 지연 시간(100~60000).                                                     |

`plugins.allow`이 비어 있지 않은 제한 목록인 경우, 채널 설정에서
ClickClack을 명시적으로 선택하거나 `openclaw plugins enable clickclack`을 실행하면
해당 목록에 `clickclack`이 추가됩니다. 온보딩 설치도 동일한
명시적 선택 동작을 사용합니다. 이러한 경로는 `plugins.deny` 또는 전역
`plugins.enabled: false` 설정을 재정의하지 않습니다. 직접
`openclaw plugins install @openclaw/clickclack`은 일반적인
Plugin 설치 정책을 따르며 기존 허용 목록에도 ClickClack을 기록합니다.

## 여러 봇

각 계정은 자체 ClickClack 실시간 연결을 열고 자체 봇 토큰을 사용합니다.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## 응답 모드

- `replyMode: "agent"`(기본값)은 세션 기록 및 도구 정책을 포함한 일반 에이전트 파이프라인을 통해 수신 메시지를 디스패치합니다.
- `replyMode: "model"`은 에이전트 파이프라인을 건너뛰고 Plugin 런타임의 `llm.complete`을 사용하여 봇이 직접 응답하도록 하며, 선택적으로 `model` 및 `systemPrompt`으로 형태를 지정할 수 있습니다. 선택한 공급자와 모델이 완성 예산을 관리합니다.

모델 모드는 확인된 봇 에이전트 ID에 대해 완성을 실행하며, 이를 위해서는
명시적 `plugins.entries.clickclack.llm.allowAgentIdOverride: true` 신뢰
비트가 필요합니다.

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

기본 `agent` 응답 모드만 사용하는 경우 신뢰 비트를 끈 상태로 유지하십시오.
이 모드에서는 필요하지 않습니다.

## 명령 메뉴

Gateway가 시작될 때 구성된 각 계정은 OpenClaw의 네이티브
명령을 ClickClack에 게시합니다. 해당 명령은 봇 핸들로 레이블이 지정되어
작성기 자동 완성에 표시됩니다. 게시된 명령 집합은 시작할 때마다 전체가
교체되며, 네이티브 명령 카탈로그가 비어 있을 때 오래된 메뉴를 지우는 작업도 포함됩니다.

명령 메뉴 동기화는 기본적으로 활성화됩니다. 사용하지 않으려면 계정에서
`commandMenu: false`을 설정하십시오.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      commandMenu: false,
    },
  },
}
```

토큰에는 `commands:write`이 필요합니다. 현재 ClickClack `bot:write` 및
`bot:admin` 번들에는 해당 범위가 포함되어 있으며,
개별적으로 부여할 수도 있습니다. 명령 메뉴가 도입되기 전에 생성된 토큰은
범위를 추가하거나 토큰을 교체해야 할 수 있습니다.

동기화는 최선형 방식으로 Gateway 시작 시 한 번 실행됩니다. 범위 누락 또는 네트워크
실패 시 경고가 기록되며, 엔드포인트가 없는 이전 ClickClack 서버에서는 디버그
수준으로 기록됩니다. 이러한 실패는 모두 실시간 시작을 차단하지 않습니다. 메뉴는
에이전트가 오프라인인 동안에도 사용할 수 있으며 봇이 워크스페이스를 떠나면
제거됩니다.

이 릴리스에서는 네이티브 명령 사양만 게시합니다. 별칭과
Skills, Plugin 또는 사용자 지정 명령 카탈로그는 메뉴에 추가되지 않습니다. 같은
이름이 HTTP 슬래시 명령으로도 등록되어 있으면 ClickClack은 해당 등록을
먼저 디스패치하며, 다른 메뉴 명령은 일반 메시지 전달을 계속 사용합니다.

서비스 간 상관관계 증거에는 `agent` 모드를 사용하십시오. 표준
`msg_<ulid>` 형태의 권위 있는 ClickClack 메시지 ID가 있으면 채널은
결정론적 OpenClaw 실행 ID `clickclack:<message-id>`을 파생합니다. 그러면 각 모델 호출이
진단에서 `clickclack:<message-id>:model:<n>`으로 표시되며, 해당
턴이 ClawRouter를 사용하면 같은 모델 호출 ID가 `X-Request-ID`로 전송됩니다.
`model` 모드는 일반 에이전트 실행/세션 진단을 우회하므로
이 증거 경로에 적합하지 않습니다.

실시간 이벤트에 검증된 `payload.correlation_id`이 포함되어 있으면
채널은 권위 있는 메시지 가져오기 및 그 결과로 생성되는 ClickClack 응답 요청에서 이를
`X-Correlation-ID`으로 전달합니다. 값에는 ClickClack의 안전한
128자 집합(`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` 및 `-`)을 사용하며, 유효하지 않은 값은
생략됩니다. 이러한 조인에는 식별자만 포함되며 메시지 본문,
프롬프트, 완성, 자격 증명 또는 도구 출력은 절대 포함되지 않습니다.

## 영구 미디어 전달

미디어가 포함된 에이전트 응답은 필수 영구 전달 방식을 사용합니다. OpenClaw는
첫 번째 ClickClack 쓰기 전에 파트별로 안정적인 메시지 및 업로드 논스를 할당하므로,
재시도할 때 저장소 할당량을 추가로 사용하거나 중복을 게시하는 대신 동일한 업로드와
메시지를 재사용합니다. 재시작 후 업로드가 이미 존재하는 경우
OpenClaw는 원래 로컬 경로나 원격 미디어 URL을 다시 읽지 않습니다.

이 복구 계약에는 다음을 지원하는 ClickClack 서버가 필요합니다.

- `GET /api/uploads/by-nonce`에서
  발견 및 누락 결과에 `X-ClickClack-Upload-Nonce: supported`을 사용합니다.
- `GET /api/messages/by-nonce`에서
  발견 및 누락 결과에 `X-ClickClack-Message-Nonce: supported`을 사용합니다.
- 동일한 소유자 범위 논스 및 업로드에 대해 멱등적인 메시지 생성과 첨부 파일 연결을 지원합니다.

이전 서버의 일반 404는 전송이 없다는 증거로 취급되지 않습니다.
OpenClaw는 중복 위험을 감수하는 대신 전달을 미해결 상태로 둡니다. 미디어를 생성하는
에이전트 응답을 활성화하기 전에 ClickClack을 업데이트하십시오.

## 에이전트 활동 행

기본적으로 에이전트 턴이 실행되는 동안 ClickClack 채널에는 아무것도 표시되지 않고 최종 응답만 게시됩니다. 턴이 진행되는 동안 영구적인 `agent_commentary` 및 `agent_tool` 메시지 행을 게시하려면 계정에서 `agentActivity: true`을 설정하십시오.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

요구 사항 및 동작:

- **기본적으로 꺼져 있습니다.** 표준 설정 및 이전 ClickClack 서버에는 영향을 주지 않습니다.
- **`agent_activity:write` 토큰 범위가 필요합니다.** 이 범위는 `bot:write`과 별개이며 해당 범위로부터 상속되지 않습니다. 옵션을 활성화하기 전에 `--scopes bot:write,agent_activity:write`을 사용하여 봇 토큰을 생성하거나 기존 토큰에 해당 범위를 부여하십시오.
- **최선형 성능 저하.** 토큰에 `agent_activity:write`이 없거나 서버가 활동 쓰기를 거부하면 실패가 기록되지만 최종 응답은 정상적으로 전달되며 활동 행은 표시되지 않습니다.
- 행은 턴별(`turn_id`)로 그룹화되며, 하나의 논리적 단계가 하나의 행이 되도록 병합됩니다. 도구 행은 Discord/Slack/Telegram과 동일한 진행 상황 형식(도구 이름과 명령 세부 정보)을 사용합니다.
- **귀속 메타데이터.** 에이전트가 작성한 게시물(활동 행 및 최종 응답)에는 해당 턴에서 실제로 사용된 모델(대체 후 모델 포함)로부터 확인된 `author_model` 및 `author_thinking` 필드가 포함됩니다. 이러한 열을 정의하지 않는 서버는 알 수 없는 JSON 필드를 무시합니다. 해당 필드를 영구 저장하는 서버는 메시지별로 "어떤 모델이 어떤 사고 수준에서 이 문장을 말했는가"에 답할 수 있습니다.

## 대상

- `channel:<name-or-id>`은(는) 워크스페이스 채널로 전송합니다. 접두사가 없는 대상은 기본적으로 `channel:`을(를) 사용합니다.
- `dm:<user_id>`은(는) 해당 사용자와의 직접 대화를 생성하거나 재사용합니다.
- `thread:<message_id>`은(는) 해당 메시지를 루트로 하는 스레드에 답글을 보냅니다.

명시적 아웃바운드 대상에는 `clickclack:` 또는 `cc:` 공급자 접두사를 사용할 수도 있습니다.

아웃바운드 미디어는 ClickClack의 업로드 API를 사용한 다음, 영구 업로드를
생성된 채널 메시지, 스레드 답글 또는 DM에 첨부합니다. 로컬 파일과 지원되는
원격 미디어 URL에는 OpenClaw의 일반 미디어 액세스 정책이 적용되며, 파일당
제한은 64 MiB입니다. 영구 대기열 전송은 각 업로드와 메시지 부분에 별도의
소유자 범위 논스를 사용한 다음, 동일한 객체로 첨부 연결을 재시도합니다. 서버
계약 및 복구 동작은 [영구 미디어 전송](#durable-media-delivery)을 참조하십시오.

예:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 권한

ClickClack 토큰 범위는 ClickClack API에서 적용됩니다.

- `bot:read`: 워크스페이스/채널/메시지/스레드/DM/실시간/프로필 데이터를 읽습니다.
- `bot:write`: `bot:read`에 더해 채널 메시지, 스레드 답글, DM, 업로드 및 명령 메뉴 게시를 허용합니다.
- `bot:admin`: `bot:write`에 더해 채널 생성을 허용합니다.
- `commands:write`: 봇의 명령 메뉴를 게시합니다. 현재 `bot:write` 및 `bot:admin` 번들에 포함되어 있으며 개별적으로 부여할 수도 있습니다.
- `agent_activity:write`: 영구 에이전트 활동 행(`agent_commentary` / `agent_tool`)입니다. `bot:write` 또는 `bot:admin`에서 상속되지 않으며, `agentActivity: true`이 설정된 경우에만 필요합니다.

일반 에이전트 채팅과 명령 메뉴 동기화에는 OpenClaw에 현재 `bot:write`만 필요합니다. [에이전트 활동 행](#agent-activity-rows)을 활성화할 때 `agent_activity:write`을 추가하십시오.

## 문제 해결

- `ClickClack is not configured for account "<id>"`: 해당 계정에 `baseUrl`, `token`(예: `CLICKCLACK_BOT_TOKEN`을 통해) 및 `workspace`을 설정하십시오.
- `ClickClack workspace not found: <value>`: `workspace`을 ClickClack에서 반환한 워크스페이스 ID, 슬러그 또는 이름으로 설정하십시오.
- 인바운드 답글이 없음: 토큰에 실시간 읽기 액세스 권한이 있는지 확인하고, 봇은 자체 메시지와 다른 봇의 메시지를 무시한다는 점에 유의하십시오.
- 채널 전송 실패: 봇이 워크스페이스의 구성원이며 `bot:write`을 보유하는지 확인하십시오.
- 명령 메뉴가 없음: `commandMenu`이 `false`이 아닌지, ClickClack 서버가 `PUT /api/bots/self/commands`을 지원하는지, 토큰에 `commands:write`이 있는지 확인하십시오.
