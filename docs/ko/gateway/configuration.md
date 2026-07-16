---
read_when:
    - OpenClaw을 처음 설정하기
    - 일반적인 구성 패턴을 찾고 있습니다
    - 특정 구성 섹션으로 이동하기
summary: '구성 개요: 일반적인 작업, 빠른 설정, 전체 참고 문서 링크'
title: 구성
x-i18n:
    generated_at: "2026-07-16T12:39:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw은 `~/.openclaw/openclaw.json`에서 선택적 <Tooltip tip="JSON5는 주석과 후행 쉼표를 지원합니다">**JSON5**</Tooltip> 구성을 읽습니다. 파일이 없으면 OpenClaw은 안전한 기본값을 사용합니다.

활성 구성 경로는 일반 파일이어야 합니다. OpenClaw이 수행하는 쓰기는 파일을 원자적으로 교체하므로(경로 위로 이름 변경), 심볼릭 링크인 `openclaw.json`에 쓰면 링크를 따라 쓰는 대신 대상이 교체됩니다. 심볼릭 링크를 사용하는 구성 레이아웃은 피하십시오. 구성을 기본 상태 디렉터리 외부에 보관하는 경우 `OPENCLAW_CONFIG_PATH`이 실제 파일을 직접 가리키도록 하십시오.

구성을 추가하는 일반적인 이유:

- 채널을 연결하고 봇에 메시지를 보낼 수 있는 사용자를 제어합니다
- 모델, 도구, 샌드박싱 또는 자동화(cron, 훅)를 설정합니다
- 세션, 미디어, 네트워킹 또는 UI를 조정합니다

사용 가능한 모든 필드는 [전체 참조](/ko/gateway/configuration-reference)를 참조하십시오.

에이전트와 자동화는 구성을 편집하기 전에 필드 수준의 정확한
문서를 확인하기 위해 `config.schema.lookup`을 사용해야 합니다. 작업 중심 안내에는 이 페이지를 사용하고,
더 광범위한 필드 맵과 기본값은
[구성 참조](/ko/gateway/configuration-reference)를 사용하십시오.

<Tip>
**구성을 처음 사용하십니까?** 대화형 설정은 `openclaw onboard`으로 시작하거나, 복사하여 바로 사용할 수 있는 완전한 구성은 [구성 예제](/ko/gateway/configuration-examples) 가이드를 확인하십시오.
</Tip>

## 최소 구성

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## 구성 편집

<Tabs>
  <Tab title="대화형 마법사">
    ```bash
    openclaw onboard       # 전체 온보딩 흐름
    openclaw configure     # 구성 마법사
    ```
  </Tab>
  <Tab title="CLI(한 줄 명령)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="제어 UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789)을 열고 **구성** 탭을 사용하십시오.
    제어 UI는 실시간 구성 스키마에서 양식을 렌더링하며, 필드
    `title` / `description` 문서 메타데이터와 사용 가능한 경우 Plugin 및 채널 스키마를
    포함하고, 비상 수단으로 **원시 JSON** 편집기를 제공합니다. 세부 탐색
    UI와 기타 도구를 위해 Gateway는 경로 범위가 지정된 단일 스키마 노드와
    직계 하위 항목 요약을 가져오는 `config.schema.lookup`도 제공합니다.
  </Tab>
  <Tab title="직접 편집">
    `~/.openclaw/openclaw.json`을 직접 편집하십시오. Gateway는 파일을 감시하고 변경 사항을 자동으로 적용합니다([핫 리로드](#config-hot-reload) 참조).
  </Tab>
</Tabs>

## 엄격한 유효성 검사

<Warning>
OpenClaw은 스키마와 완전히 일치하는 구성만 허용합니다. 알 수 없는 키, 잘못된 형식의 유형 또는 유효하지 않은 값이 있으면 Gateway가 **시작을 거부**합니다. 루트 수준에서 유일한 예외는 `$schema`(문자열)이며, 이를 통해 편집기가 JSON Schema 메타데이터를 첨부할 수 있습니다.
</Warning>

`openclaw config schema`은 제어 UI와 유효성 검사에서 사용하는 표준 JSON Schema를
출력합니다. `config.schema.lookup`은 세부 탐색 도구를 위해 경로 범위가 지정된 단일 노드와
하위 항목 요약을 가져옵니다. 필드 `title`/`description` 문서 메타데이터는
중첩 객체, 와일드카드(`*`), 배열 항목(`[]`) 및 `anyOf`/
`oneOf`/`allOf` 분기에도 전달됩니다. 매니페스트 레지스트리가 로드되면 런타임 Plugin 및 채널 스키마가 병합됩니다.

유효성 검사에 실패하면:

- Gateway가 부팅되지 않습니다
- 진단 명령만 작동합니다(`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- 정확한 문제를 확인하려면 `openclaw doctor`을 실행하십시오
- 복구를 적용하려면 `openclaw doctor --fix`을 실행하십시오(`--repair`은 동일한 플래그이며, `--yes`은 프롬프트를 건너뜁니다)

Gateway는 시작에 성공할 때마다 신뢰할 수 있는 마지막 정상 사본을 유지하지만,
시작 및 핫 리로드 시 이를 자동으로 복원하지는 않으며 `openclaw doctor --fix`만
복원합니다. `openclaw.json`이 유효성 검사에 실패하면(Plugin 내부 유효성 검사 포함) Gateway
시작이 실패하거나 리로드를 건너뛰고 현재 런타임은 마지막으로 허용된
구성을 계속 사용합니다. 거부된 쓰기도 검사를 위해 `<path>.rejected.<timestamp>`으로 저장됩니다.
Gateway는 실수로 덮어쓴 것으로 보이는 쓰기를 차단합니다. 즉, `gateway.mode`을 삭제하거나,
`meta` 블록을 잃거나, 파일 크기를 절반 넘게 줄이는 경우입니다. 단, 쓰기 작업에서
파괴적 변경을 명시적으로 허용한 경우는 제외합니다. 후보에 `***` 또는 `[redacted]` 같은
마스킹된 시크릿 자리표시자가 포함되어 있으면 마지막 정상 상태로 승격하지 않습니다.

## 일반 작업

<AccordionGroup>
  <Accordion title="채널 설정(WhatsApp, Telegram, Discord 등)">
    각 채널에는 `channels.<provider>` 아래에 자체 구성 섹션이 있습니다. 설정 단계는 각 채널 전용 페이지를 참조하십시오.

    - [Discord](/ko/channels/discord) - `channels.discord`
    - [Feishu](/ko/channels/feishu) - `channels.feishu`
    - [Google Chat](/ko/channels/googlechat) - `channels.googlechat`
    - [iMessage](/ko/channels/imessage) - `channels.imessage`
    - [Mattermost](/ko/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/ko/channels/msteams) - `channels.msteams`
    - [Signal](/ko/channels/signal) - `channels.signal`
    - [Slack](/ko/channels/slack) - `channels.slack`
    - [Telegram](/ko/channels/telegram) - `channels.telegram`
    - [WhatsApp](/ko/channels/whatsapp) - `channels.whatsapp`

    모든 채널은 동일한 DM 정책 패턴을 공유합니다.

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // 페어링 | 허용 목록 | 공개 | 비활성화
          allowFrom: ["tg:123"], // 허용 목록/공개에만 사용
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="모델 선택 및 구성">
    기본 모델과 선택적 대체 모델을 설정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models`은 모델 카탈로그를 정의하고 `/model`의 허용 목록 역할을 합니다. `provider/*` 항목은 동적 모델 탐색을 계속 사용하면서 `/model`, `/models` 및 모델 선택기를 선택한 제공자로 필터링합니다.
    - 기존 모델을 제거하지 않고 허용 목록 항목을 추가하려면 `openclaw config set agents.defaults.models '<json>' --strict-json --merge`을 사용하십시오. 항목을 제거하게 되는 단순 교체는 `--replace`을 전달하지 않으면 거부됩니다.
    - 모델 참조는 `provider/model` 형식을 사용합니다(예: `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`은 트랜스크립트/도구 이미지 다운스케일링을 제어합니다(기본값 `1200`). 값이 낮을수록 일반적으로 스크린샷이 많은 실행에서 비전 토큰 사용량이 줄어듭니다.
    - 채팅에서 모델을 전환하는 방법은 [모델 CLI](/ko/concepts/models)를, 인증 순환 및 대체 동작은 [모델 장애 조치](/ko/concepts/model-failover)를 참조하십시오.
    - 사용자 지정/자체 호스팅 제공자는 참조 문서의 [사용자 지정 제공자](/ko/gateway/config-tools#custom-providers-and-base-urls)를 참조하십시오.

  </Accordion>

  <Accordion title="봇에 메시지를 보낼 수 있는 사용자 제어">
    DM 액세스는 채널별 `dmPolicy`(기본값 `"pairing"`)을 통해 제어됩니다.

    - `"pairing"`: 알 수 없는 발신자는 승인을 위한 일회용 페어링 코드를 받습니다
    - `"allowlist"`: `allowFrom`(또는 페어링된 허용 저장소)에 있는 발신자만 허용합니다
    - `"open"`: 모든 수신 DM을 허용합니다(`allowFrom: ["*"]` 필요)
    - `"disabled"`: 모든 DM을 무시합니다

    그룹에는 `groupPolicy`(`"allowlist" | "open" | "disabled"`)과 `groupAllowFrom` 또는 채널별 허용 목록을 함께 사용하십시오.

    채널별 세부 정보는 [전체 참조](/ko/gateway/config-channels#dm-and-group-access)를 확인하십시오.

  </Accordion>

  <Accordion title="그룹 채팅 멘션 게이팅 설정">
    그룹 메시지는 기본적으로 **멘션 필요**로 설정됩니다. 에이전트별 트리거 패턴을 구성하십시오. 일반 그룹/채널 답변은 자동으로 게시됩니다. 에이전트가 언제 말할지 결정해야 하는 공유 대화방에서는 메시지 도구 경로를 사용하도록 설정하십시오.

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // 모든 곳에서 메시지 도구 전송을 요구하려면 "message_tool"로 설정
        groupChat: {
          visibleReplies: "message_tool", // 명시적 사용 설정; 표시되는 출력에는 message(action=send)가 필요
          unmentionedInbound: "room_event", // 멘션되지 않은 상시 그룹 대화는 조용한 컨텍스트
        },
      },
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **메타데이터 멘션**: 네이티브 @멘션(WhatsApp 탭하여 멘션, Telegram @bot 등)
    - **텍스트 패턴**: `mentionPatterns`의 안전한 정규식 패턴
    - **표시되는 답변**: `messages.visibleReplies`은 전역적으로 메시지 도구 전송을 요구할 수 있으며, `messages.groupChat.visibleReplies`은 그룹/채널에서 이를 재정의합니다.
    - 표시되는 답변 모드, 채널별 재정의 및 셀프 채팅 모드는 [전체 참조](/ko/gateway/config-channels#group-chat-mention-gating)를 확인하십시오.

  </Accordion>

  <Accordion title="에이전트별 Skills 제한">
    공유 기준에는 `agents.defaults.skills`을 사용한 다음, 특정
    에이전트는 `agents.list[].skills`으로 재정의하십시오.

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather 상속
          { id: "docs", skills: ["docs-search"] }, // 기본값 대체
          { id: "locked-down", skills: [] }, // Skills 없음
        ],
      },
    }
    ```

    - 기본적으로 Skills를 제한하지 않으려면 `agents.defaults.skills`을 생략하십시오.
    - 기본값을 상속하려면 `agents.list[].skills`을 생략하십시오.
    - Skills를 사용하지 않으려면 `agents.list[].skills: []`으로 설정하십시오.
    - [Skills](/ko/tools/skills), [Skills 구성](/ko/tools/skills-config) 및
      [구성 참조](/ko/gateway/config-agents#agents-defaults-skills)를 확인하십시오.

  </Accordion>

  <Accordion title="Gateway 채널 상태 모니터링 조정">
    오래된 상태로 보이는 채널을 Gateway가 얼마나 적극적으로 다시 시작할지 제어하십시오.

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - 표시된 값은 기본값입니다. 상태 모니터에 의한 재시작을 전역적으로 비활성화하려면 `gateway.channelHealthCheckMinutes: 0`으로 설정하십시오.
    - `channelStaleEventThresholdMinutes`은 확인 간격보다 크거나 같아야 합니다.
    - 전역 모니터를 비활성화하지 않고 특정 채널 또는 계정의 자동 재시작을 비활성화하려면 `channels.<provider>.healthMonitor.enabled` 또는 `channels.<provider>.accounts.<id>.healthMonitor.enabled`을 사용하십시오.
    - 운영 디버깅은 [상태 확인](/ko/gateway/health)을, 모든 필드는 [전체 참조](/ko/gateway/configuration-reference#gateway)를 확인하십시오.

  </Accordion>

  <Accordion title="Gateway WebSocket 핸드셰이크 시간 제한 조정">
    부하가 높거나 성능이 낮은 호스트에서 로컬 클라이언트가 인증 전 WebSocket 핸드셰이크를
    완료할 시간을 더 제공하십시오.

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 기본값은 `15000`밀리초입니다.
    - 일회성 서비스 또는 셸 재정의에는 여전히 `OPENCLAW_HANDSHAKE_TIMEOUT_MS`이 우선 적용됩니다.
    - 먼저 시작 또는 이벤트 루프 중단 문제를 해결하는 것이 좋습니다. 이 설정은 정상적으로 작동하지만 준비 과정이 느린 호스트를 위한 것입니다.

  </Accordion>

  <Accordion title="세션 및 초기화 구성">
    세션은 대화의 연속성과 격리를 제어합니다.

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // 다중 사용자 환경에 권장
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main`(공유) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: 스레드에 바인딩된 세션 라우팅의 전역 기본값입니다. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`은 세션별로 이를 바인딩, 바인딩 해제, 나열 및 조정합니다(Discord는 스레드를 바인딩하고 Telegram은 토픽/대화를 바인딩합니다).
    - 범위 지정, ID 연결 및 전송 정책은 [세션 관리](/ko/concepts/session)를 참조하십시오.
    - 모든 필드는 [전체 참조](/ko/gateway/config-agents#session)를 참조하십시오.

  </Accordion>

  <Accordion title="샌드박싱 활성화">
    격리된 샌드박스 런타임에서 에이전트 세션을 실행합니다.

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // 끄기 | 기본 외 | 모두
            scope: "agent",    // 세션 | 에이전트 | 공유
          },
        },
      },
    }
    ```

    먼저 이미지를 빌드하십시오. 소스 체크아웃에서는 `scripts/sandbox-setup.sh`을 실행하고, npm 설치에서는 [샌드박싱 § 이미지 및 설정](/ko/gateway/sandboxing#images-and-setup)의 인라인 `docker build` 명령을 참조하십시오.

    전체 가이드는 [샌드박싱](/ko/gateway/sandboxing)을, 모든 옵션은 [전체 참조](/ko/gateway/config-agents#agentsdefaultssandbox)를 참조하십시오.

  </Accordion>

  <Accordion title="공식 iOS 빌드의 릴레이 기반 푸시 활성화">
    공개 App Store 빌드의 릴레이 기반 푸시는 호스팅된 OpenClaw 릴레이인 `https://ios-push-relay.openclaw.ai`을 사용합니다.

    사용자 지정 릴레이 배포에는 릴레이 URL이 Gateway 릴레이 URL과 일치하는 별도의 iOS 빌드/배포 경로가 필요합니다. 사용자 지정 릴레이 빌드를 사용하는 경우 Gateway 구성에서 다음을 설정하십시오.

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // 선택 사항. 기본값: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    동일한 CLI 명령:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    이 설정의 역할:

    - Gateway가 외부 릴레이를 통해 `push.test`, 깨우기 알림, 재연결 깨우기를 전송할 수 있게 합니다.
    - 페어링된 iOS 앱이 전달하는 등록 범위 전송 권한을 사용합니다. Gateway에는 배포 전체에 적용되는 릴레이 토큰이 필요하지 않습니다.
    - 각 릴레이 기반 등록을 iOS 앱이 페어링된 Gateway ID에 바인딩하여 다른 Gateway가 저장된 등록을 재사용할 수 없게 합니다.
    - 로컬/수동 iOS 빌드는 직접 APNs를 계속 사용합니다. 릴레이 기반 전송은 릴레이를 통해 등록된 공식 배포 빌드에만 적용됩니다.
    - 등록 및 전송 트래픽이 동일한 릴레이 배포에 도달하도록 iOS 빌드에 포함된 릴레이 기본 URL과 일치해야 합니다.

    엔드투엔드 흐름:

    1. 공식 iOS 앱을 설치합니다.
    2. 선택 사항: 별도의 사용자 지정 릴레이 빌드를 사용하는 경우에만 Gateway에서 `gateway.push.apns.relay.baseUrl`을 구성합니다.
    3. iOS 앱을 Gateway와 페어링하고 Node 및 운영자 세션이 모두 연결되도록 합니다.
    4. iOS 앱은 Gateway ID를 가져오고 App Attest와 앱 영수증을 사용하여 릴레이에 등록한 다음, 릴레이 기반 `push.apns.register` 페이로드를 페어링된 Gateway에 게시합니다.
    5. Gateway는 릴레이 핸들과 전송 권한을 저장한 후 `push.test`, 깨우기 알림 및 재연결 깨우기에 사용합니다.

    운영 참고 사항:

    - iOS 앱을 다른 Gateway로 전환한 경우 앱을 다시 연결하여 해당 Gateway에 바인딩된 새 릴레이 등록을 게시할 수 있도록 하십시오.
    - 다른 릴레이 배포를 가리키는 새 iOS 빌드를 배포하면 앱은 이전 릴레이 원본을 재사용하지 않고 캐시된 릴레이 등록을 새로 고칩니다.

    호환성 참고 사항:

    - `OPENCLAW_APNS_RELAY_BASE_URL` 및 `OPENCLAW_APNS_RELAY_TIMEOUT_MS`은 임시 환경 재정의로 계속 작동합니다.
    - 사용자 지정 Gateway 릴레이 URL은 iOS 빌드에 포함된 릴레이 기본 URL과 일치해야 합니다. 공개 App Store 릴리스 경로에서는 사용자 지정 iOS 릴레이 URL 재정의를 거부합니다.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`은 루프백 전용 개발 우회 수단으로 유지됩니다. HTTP 릴레이 URL을 구성에 영구 저장하지 마십시오.

    엔드투엔드 흐름은 [iOS 앱](/ko/platforms/ios#relay-backed-push-for-official-builds)을, 릴레이 보안 모델은 [인증 및 신뢰 흐름](/ko/platforms/ios#authentication-and-trust-flow)을 참조하십시오.

  </Accordion>

  <Accordion title="Heartbeat 설정(주기적 체크인)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: 기간 문자열(`30m`, `2h`). 비활성화하려면 `0m`으로 설정하십시오. 기본값: `30m`.
    - `target`: `last` | `none` | `<channel-id>`(예: `discord`, `matrix`, `telegram` 또는 `whatsapp`)
    - `directPolicy`: DM 방식 Heartbeat 대상에는 `allow`(기본값) 또는 `block`
    - 전체 가이드는 [Heartbeat](/ko/gateway/heartbeat)를 참조하십시오.

  </Accordion>

  <Accordion title="Cron 작업 구성">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // 기본값; Cron 디스패치 + 격리된 Cron 에이전트 턴 실행
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: SQLite 세션 행에서 완료된 격리 실행 세션을 정리합니다(기본값 `24h`, 비활성화하려면 `false`으로 설정).
    - 실행 기록은 작업별로 최신 터미널 행 2000개를 자동으로 유지하며, 유실된 행에는 24시간 정리 기간이 유지됩니다.
    - 기능 개요와 CLI 예시는 [Cron 작업](/ko/automation/cron-jobs)을 참조하십시오.

  </Accordion>

  <Accordion title="Webhook 설정(훅)">
    Gateway에서 HTTP Webhook 엔드포인트를 활성화합니다.

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    보안 참고 사항:
    - 모든 훅/Webhook 페이로드 콘텐츠를 신뢰할 수 없는 입력으로 취급하십시오.
    - 전용 `hooks.token`을 사용하십시오. 활성 Gateway 인증 비밀(`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)을 재사용하지 마십시오.
    - 훅 인증에는 헤더만 사용합니다(`Authorization: Bearer ...` 또는 `x-openclaw-token`). 쿼리 문자열 토큰은 거부됩니다.
    - `hooks.path`은 `/`일 수 없습니다. Webhook 수신 경로는 `/hooks`과 같은 전용 하위 경로로 유지하십시오.
    - 엄격히 제한된 디버깅을 수행하는 경우가 아니면 안전하지 않은 콘텐츠 우회 플래그(`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`)를 비활성화해 두십시오.
    - `hooks.allowRequestSessionKey`을 활성화하는 경우 호출자가 선택하는 세션 키를 제한하도록 `hooks.allowedSessionKeyPrefixes`도 설정하십시오.
    - 훅 기반 에이전트에는 강력한 최신 모델 등급과 엄격한 도구 정책을 사용하는 것이 좋습니다(예: 메시징만 허용하고 가능한 경우 샌드박싱 적용).

    모든 매핑 옵션과 Gmail 통합은 [전체 참조](/ko/gateway/configuration-reference#hooks)를 참조하십시오.

  </Accordion>

  <Accordion title="다중 에이전트 라우팅 구성">
    별도의 작업 공간과 세션을 사용하는 여러 격리된 에이전트를 실행합니다.

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    바인딩 규칙과 에이전트별 액세스 프로필은 [다중 에이전트](/ko/concepts/multi-agent) 및 [전체 참조](/ko/gateway/config-agents#multi-agent-routing)를 참조하십시오.

  </Accordion>

  <Accordion title="구성을 여러 파일로 분할($include)">
    대규모 구성을 체계적으로 관리하려면 `$include`을 사용하십시오.

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **단일 파일**: 포함하는 객체를 대체합니다
    - **파일 배열**: 순서대로 깊은 병합을 수행하며(나중 값 우선), 최대 10단계까지 중첩할 수 있습니다
    - **형제 키**: 포함 파일 처리 후 병합됩니다(포함된 값을 재정의)
    - **상대 경로**: 포함하는 파일을 기준으로 확인됩니다
    - **경로 형식**: 포함 경로에 null 바이트가 있어서는 안 되며, 확인 전후 모두 길이가 4096자 미만이어야 합니다
    - **OpenClaw 소유 쓰기**: 쓰기로 인해 `plugins: { $include: "./plugins.json5" }`과 같은 단일 파일 포함이 지원하는 최상위 섹션 하나만 변경되는 경우,
      OpenClaw는 해당 포함 파일을 업데이트하고 `openclaw.json`은 그대로 유지합니다
    - **지원되지 않는 쓰기 전달**: 루트 포함, 포함 배열 및
      형제 재정의가 있는 포함의 경우 구성을 평탄화하지 않고
      OpenClaw 소유 쓰기가 실패하도록 차단합니다
    - **제한**: `$include` 경로는 `openclaw.json`이 있는 디렉터리 아래로 확인되어야 합니다.
      여러 머신 또는 사용자 간에 트리를 공유하려면 포함에서 참조할 수 있는
      추가 디렉터리의 경로 목록(POSIX에서는 `:`, Windows에서는 `;`)으로
      `OPENCLAW_INCLUDE_ROOTS`을 설정하십시오. 심볼릭 링크는 확인 후 다시 검사되므로
      경로가 구문상 구성 디렉터리 안에 있더라도 실제 대상이 허용된 모든 루트
      외부로 벗어나면 거부됩니다.
    - **오류 처리**: 누락된 파일, 구문 분석 오류, 순환 포함, 잘못된 경로 형식 및 초과 길이에 대해 명확한 오류를 제공합니다

  </Accordion>
</AccordionGroup>

## 구성 핫 리로드

Gateway는 `~/.openclaw/openclaw.json`을 감시하고 변경 사항을 자동으로 적용합니다. 대부분의 설정은 수동으로 다시 시작할 필요가 없습니다.

직접 파일을 편집한 내용은 검증될 때까지 신뢰할 수 없는 것으로 취급됩니다. 감시자는
편집기의 임시 쓰기/이름 변경 작업이 안정될 때까지 기다린 후 최종 파일을 읽고,
`openclaw.json`을 다시 작성하지 않은 채 잘못된 외부 편집을 거부합니다. OpenClaw 소유 구성
쓰기도 쓰기 전에 동일한 스키마 검증 단계를 사용합니다(모든 쓰기에 적용되는 덮어쓰기/롤백
규칙은 [엄격한 검증](#strict-validation)을 참조하십시오).

`config reload skipped (invalid config)`이 표시되거나 시작 시 `Invalid
config`이 보고되면 구성을 검사하고 `openclaw config validate`을 실행한 다음, 복구를 위해 `openclaw
doctor --fix`을 실행하십시오. 체크리스트는 [Gateway 문제 해결](/ko/gateway/troubleshooting#gateway-rejected-invalid-config)을
참조하십시오.

### 리로드 모드

| 모드                   | 동작                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (기본값) | 안전한 변경 사항을 즉시 핫 적용합니다. 중요한 변경 사항에는 자동으로 재시작합니다.           |
| **`hot`**              | 안전한 변경 사항만 핫 적용합니다. 재시작이 필요하면 경고를 기록하며, 사용자가 직접 처리해야 합니다. |
| **`restart`**          | 안전 여부와 관계없이 구성 변경 시 Gateway를 재시작합니다.                                 |
| **`off`**              | 파일 감시를 비활성화합니다. 변경 사항은 다음 수동 재시작 시 적용됩니다.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 핫 적용되는 항목과 재시작이 필요한 항목

대부분의 필드는 중단 시간 없이 핫 적용됩니다. 일부 핫 적용 섹션은 전체 Gateway가 아니라
해당 하위 시스템(채널, cron, heartbeat, 상태 모니터)만 재시작합니다.
`hybrid` 모드에서는 Gateway 재시작이 필요한 변경 사항이 자동으로 처리됩니다.

| 범주            | 필드                                                                  | Gateway 재시작 필요 여부      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| 채널            | `channels.*`, `web` (WhatsApp) - 모든 기본 제공 및 Plugin 채널       | 아니요(해당 채널 재시작)   |
| 에이전트 및 모델      | `agent`, `agents`, `models`, `routing`                                  | 아니요                           |
| 자동화          | `hooks`, `cron`, `agent.heartbeat`                                      | 아니요(해당 하위 시스템 재시작) |
| 세션 및 메시지 | `session`, `messages`                                                   | 아니요                           |
| 도구 및 미디어       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | 아니요                           |
| Plugin 구성       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | 아니요(Plugin 런타임 다시 로드)  |
| UI 및 기타           | `ui`, `logging`, `identity`, `bindings`                                 | 아니요                           |
| Gateway 서버      | `gateway.*` (포트, 바인딩, 인증, tailscale, TLS, HTTP, 푸시)              | **예**                      |
| 인프라      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **예**                      |

<Note>
`gateway.reload` 및 `gateway.remote`은 `gateway.*`에서 예외입니다. 이를 변경해도 재시작이 **트리거되지 않습니다**. 개별 Plugin도 이 표를 재정의할 수 있습니다. 로드된 Plugin은 자체적으로 재시작을 트리거하는 구성 접두사를 선언할 수 있습니다(예를 들어 기본 제공 Canvas Plugin은 자체 `plugins.entries.canvas`뿐만 아니라 `plugins.enabled`, `plugins.allow`, `plugins.deny`에 대해서도 Gateway를 재시작합니다). 따라서 실제 동작은 활성화된 Plugin에 따라 달라집니다.
</Note>

### 다시 로드 계획

`$include`을 통해 참조되는 소스 파일을 편집하면 OpenClaw는
평면화된 메모리 내 뷰가 아니라 소스에 작성된 레이아웃을 기준으로 다시 로드를 계획합니다.
따라서 단일 최상위 섹션이 `plugins: { $include: "./plugins.json5" }`과 같은
별도의 포함 파일에 있더라도 핫 리로드 결정(핫 적용 또는 재시작)을 예측할 수 있습니다.
소스 레이아웃이 모호하면 다시 로드 계획은 실패 시 차단됩니다.

## 구성 RPC(프로그래밍 방식 업데이트)

Gateway API를 통해 구성을 작성하는 도구에는 다음 흐름을 권장합니다.

- `config.schema.lookup`로 하나의 하위 트리를 검사합니다(얕은 스키마 노드 + 하위
  요약).
- `config.get`로 현재 스냅샷과 `hash`을 가져옵니다.
- `config.patch`를 부분 업데이트에 사용합니다(JSON 병합 패치: 객체는 병합되고, `null`는
  삭제하며, 항목이 제거되는 경우 `replacePaths`으로 명시적으로 확인해야 배열을 교체합니다).
- `config.apply`은 전체 구성을 교체하려는 경우에만 사용합니다.
- `update.run`은 명시적인 자체 업데이트 후 재시작에 사용합니다. 재시작 후 세션에서 후속 턴 하나를 실행해야 하는 경우 `continuationMessage`을 포함합니다.
- `update.status`으로 최신 업데이트 재시작 센티널을 검사하고 재시작 후 실행 중인 버전을 확인합니다.

에이전트는 정확한 필드 수준 문서와 제약 조건을 확인할 때
`config.schema.lookup`을 가장 먼저 참조해야 합니다. 더 광범위한 구성 맵, 기본값 또는
전용 하위 시스템 참조 링크가 필요한 경우 [구성 참조](/ko/gateway/configuration-reference)를
사용하십시오.

<Note>
제어 영역 쓰기(`config.apply`, `config.patch`, `update.run`)는
`deviceId+clientIp`당 60초에 3개 요청으로 속도가 제한됩니다. 재시작
요청은 병합된 후 재시작 주기 사이에 30초의 대기 시간을 적용합니다.
`update.status`은 읽기 전용이지만 재시작 센티널에
업데이트 단계 요약과 명령 출력의 끝부분이 포함될 수 있으므로 관리자 범위로 제한됩니다.
</Note>

부분 패치 예시:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash 캡처
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply`과 `config.patch`은 모두 `raw`, `baseHash`, `sessionKey`,
`note`, `restartDelayMs`을 허용합니다. 구성 파일이 이미 존재하면 두 메서드 모두에
`baseHash`이 필요합니다(기존 구성이 없는 최초 쓰기에서는 이 검사를 건너뜁니다).

`config.patch`은 배열 교체가 의도된 구성 경로의 배열인 `replacePaths`도 허용합니다.
패치가 기존 배열을 더 적은 항목으로 교체하거나 삭제하려는 경우, 해당 경로가
`replacePaths`에 정확히 포함되어 있지 않으면 Gateway가 쓰기를 거부합니다. 배열 항목 아래의
중첩 배열에는 `agents.list[].skills`과 같이 `[]`을 사용합니다.
이렇게 하면 잘린 `config.get` 스냅샷이 라우팅 또는 허용 목록 배열을
조용히 덮어쓰는 것을 방지할 수 있습니다. 전체 구성을 교체하려면
`config.apply`을 사용하십시오.

## 환경 변수

OpenClaw는 상위 프로세스와 다음 위치에서 환경 변수를 읽습니다.

- 현재 작업 디렉터리의 `.env`(있는 경우)
- `~/.openclaw/.env`(전역 대체 위치)

어느 파일도 기존 환경 변수를 재정의하지 않습니다. 구성에서 인라인 환경 변수를 설정할 수도 있습니다.

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="셸 환경 가져오기(선택 사항)">
  활성화되어 있고 필요한 키가 설정되지 않은 경우 OpenClaw는 로그인 셸을 실행하고 누락된 키만 가져옵니다.

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

동등한 환경 변수: `OPENCLAW_LOAD_SHELL_ENV=1`. 기본 `timeoutMs`: `15000`.
</Accordion>

<Accordion title="구성 값의 환경 변수 치환">
  모든 구성 문자열 값에서 `${VAR_NAME}`을 사용하여 환경 변수를 참조합니다.

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

규칙:

- 대문자 이름만 일치: `[A-Z_][A-Z0-9_]*`
- 변수가 누락되었거나 비어 있으면 로드 시 오류가 발생합니다.
- 리터럴로 출력하려면 `$${VAR}`으로 이스케이프합니다.
- `$include` 파일 내에서도 작동합니다.
- 인라인 치환: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="보안 비밀 참조(env, file, exec)">
  SecretRef 객체를 지원하는 필드에서는 다음과 같이 사용할 수 있습니다.

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

SecretRef 세부 정보(`env`/`file`/`exec`에 대한 `secrets.providers` 포함)는 [보안 비밀 관리](/ko/gateway/secrets)에 있습니다.
지원되는 자격 증명 경로는 [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)에 나열되어 있습니다.
</Accordion>

전체 우선순위와 소스는 [환경](/ko/help/environment)을 참조하십시오.

## 전체 참조

전체 필드별 참조는 **[구성 참조](/ko/gateway/configuration-reference)**를 확인하십시오.

---

_관련 문서: [구성 예시](/ko/gateway/configuration-examples) · [구성 참조](/ko/gateway/configuration-reference) · [Doctor](/ko/gateway/doctor)_

## 관련 문서

- [구성 참조](/ko/gateway/configuration-reference)
- [구성 예시](/ko/gateway/configuration-examples)
- [Gateway 운영 지침서](/ko/gateway)
