---
read_when:
    - 처음으로 OpenClaw 설정하기
    - 일반적인 구성 패턴 찾기
    - 특정 설정 섹션으로 이동하기
summary: '구성 개요: 일반 작업, 빠른 설정, 전체 참조 링크'
title: 구성
x-i18n:
    generated_at: "2026-06-27T17:27:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw는 `~/.openclaw/openclaw.json`에서 선택적 <Tooltip tip="JSON5는 주석과 후행 쉼표를 지원합니다">**JSON5**</Tooltip> 구성을 읽습니다.
활성 구성 경로는 일반 파일이어야 합니다. 심볼릭 링크된 `openclaw.json`
레이아웃은 OpenClaw가 소유한 쓰기 작업에서 지원되지 않습니다. 원자적 쓰기가
심볼릭 링크를 보존하는 대신 해당 경로를 대체할 수 있습니다. 구성을 기본 상태
디렉터리 밖에 보관한다면 `OPENCLAW_CONFIG_PATH`가 실제 파일을 직접 가리키게 하세요.

파일이 없으면 OpenClaw는 안전한 기본값을 사용합니다. 구성을 추가하는 일반적인 이유:

- 채널을 연결하고 누가 봇에 메시지를 보낼 수 있는지 제어
- 모델, 도구, 샌드박싱 또는 자동화(cron, 훅) 설정
- 세션, 미디어, 네트워킹 또는 UI 조정

사용 가능한 모든 필드는 [전체 참조](/ko/gateway/configuration-reference)를 확인하세요.

에이전트와 자동화는 구성을 편집하기 전에 정확한 필드 수준 문서를 위해
`config.schema.lookup`을 사용해야 합니다. 작업 중심 가이드는 이 페이지를 사용하고,
더 넓은 필드 맵과 기본값은 [구성 참조](/ko/gateway/configuration-reference)를
사용하세요.

<Tip>
**구성이 처음인가요?** 대화형 설정은 `openclaw onboard`로 시작하거나, 완전한 복사-붙여넣기용 구성을 보려면 [구성 예시](/ko/gateway/configuration-examples) 가이드를 확인하세요.
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
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (한 줄 명령)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789)를 열고 **Config** 탭을 사용하세요.
    Control UI는 라이브 구성 스키마에서 양식을 렌더링하며, 필드
    `title` / `description` 문서 메타데이터와 사용 가능한 경우 Plugin 및 채널 스키마를
    포함하고, 탈출구로 **Raw JSON** 편집기를 제공합니다. 드릴다운
    UI와 기타 도구를 위해 Gateway는 경로 범위 스키마 노드 하나와
    직계 자식 요약을 가져오는 `config.schema.lookup`도 노출합니다.
  </Tab>
  <Tab title="직접 편집">
    `~/.openclaw/openclaw.json`을 직접 편집하세요. Gateway는 파일을 감시하고 변경 사항을 자동으로 적용합니다([핫 리로드](#config-hot-reload) 참조).
  </Tab>
</Tabs>

## 엄격한 검증

<Warning>
OpenClaw는 스키마와 완전히 일치하는 구성만 허용합니다. 알 수 없는 키, 잘못된 형식의 타입 또는 유효하지 않은 값이 있으면 Gateway가 **시작을 거부**합니다. 유일한 루트 수준 예외는 `$schema`(문자열)이며, 이를 통해 편집기가 JSON Schema 메타데이터를 연결할 수 있습니다.
</Warning>

`openclaw config schema`는 Control UI와 검증에서 사용하는 표준 JSON Schema를
출력합니다. `config.schema.lookup`은 드릴다운 도구를 위해 경로 범위 노드 하나와
자식 요약을 가져옵니다. 필드 `title`/`description` 문서 메타데이터는
중첩 객체, 와일드카드(`*`), 배열 항목(`[]`), `anyOf`/
`oneOf`/`allOf` 분기를 통해 전달됩니다. 매니페스트 레지스트리가 로드되면
런타임 Plugin 및 채널 스키마가 병합됩니다.

검증에 실패하면:

- Gateway가 부팅되지 않습니다
- 진단 명령만 작동합니다(`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- 정확한 문제를 보려면 `openclaw doctor`를 실행하세요
- 복구를 적용하려면 `openclaw doctor --fix`(또는 `--yes`)를 실행하세요

Gateway는 성공적으로 시작할 때마다 신뢰할 수 있는 마지막 정상 사본을 보관하지만,
시작 및 핫 리로드에서 이를 자동으로 복원하지는 않습니다. `openclaw.json`이
검증에 실패하면(Plugin 로컬 검증 포함) Gateway 시작이 실패하거나
리로드를 건너뛰고 현재 런타임은 마지막으로 승인된 구성을 유지합니다.
접두사가 붙었거나 덮어쓴 구성을 복구하거나 마지막 정상 사본을 복원하려면
`openclaw doctor --fix`(또는 `--yes`)를 실행하세요. 후보에 `***` 같은
편집된 비밀 플레이스홀더가 포함된 경우 마지막 정상 상태로 승격하지 않습니다.

## 일반 작업

<AccordionGroup>
  <Accordion title="채널 설정(WhatsApp, Telegram, Discord 등)">
    각 채널에는 `channels.<provider>` 아래에 자체 구성 섹션이 있습니다. 설정 단계는 전용 채널 페이지를 참고하세요:

    - [WhatsApp](/ko/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/ko/channels/telegram) - `channels.telegram`
    - [Discord](/ko/channels/discord) - `channels.discord`
    - [Feishu](/ko/channels/feishu) - `channels.feishu`
    - [Google Chat](/ko/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/ko/channels/msteams) - `channels.msteams`
    - [Slack](/ko/channels/slack) - `channels.slack`
    - [Signal](/ko/channels/signal) - `channels.signal`
    - [iMessage](/ko/channels/imessage) - `channels.imessage`
    - [Mattermost](/ko/channels/mattermost) - `channels.mattermost`

    모든 채널은 동일한 DM 정책 패턴을 공유합니다:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="모델 선택 및 구성">
    기본 모델과 선택적 폴백을 설정하세요:

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

    - `agents.defaults.models`는 모델 카탈로그를 정의하고 `/model`의 허용 목록 역할을 합니다. `provider/*` 항목은 동적 모델 발견을 계속 사용하면서도 `/model`, `/models`, 모델 선택기를 선택된 제공자로 필터링합니다.
    - 기존 모델을 제거하지 않고 허용 목록 항목을 추가하려면 `openclaw config set agents.defaults.models '<json>' --strict-json --merge`를 사용하세요. 항목을 제거하게 되는 일반 교체는 `--replace`를 전달하지 않는 한 거부됩니다.
    - 모델 참조는 `provider/model` 형식(예: `anthropic/claude-opus-4-6`)을 사용합니다.
    - `agents.defaults.imageMaxDimensionPx`는 트랜스크립트/도구 이미지 다운스케일링을 제어합니다(기본값 `1200`). 낮은 값은 일반적으로 스크린샷이 많은 실행에서 비전 토큰 사용량을 줄입니다.
    - 채팅에서 모델을 전환하려면 [모델 CLI](/ko/concepts/models)를, 인증 순환 및 폴백 동작은 [모델 장애 조치](/ko/concepts/model-failover)를 참고하세요.
    - 사용자 지정/자체 호스팅 제공자는 참조의 [사용자 지정 제공자](/ko/gateway/config-tools#custom-providers-and-base-urls)를 참고하세요.

  </Accordion>

  <Accordion title="누가 봇에 메시지를 보낼 수 있는지 제어">
    DM 접근은 채널별로 `dmPolicy`를 통해 제어됩니다:

    - `"pairing"`(기본값): 알 수 없는 발신자는 승인을 위한 일회성 페어링 코드를 받습니다
    - `"allowlist"`: `allowFrom`(또는 페어링된 허용 저장소)에 있는 발신자만 허용
    - `"open"`: 모든 인바운드 DM 허용(`allowFrom: ["*"]` 필요)
    - `"disabled"`: 모든 DM 무시

    그룹에는 `groupPolicy` + `groupAllowFrom` 또는 채널별 허용 목록을 사용하세요.

    채널별 세부 정보는 [전체 참조](/ko/gateway/config-channels#dm-and-group-access)를 확인하세요.

  </Accordion>

  <Accordion title="그룹 채팅 멘션 게이트 설정">
    그룹 메시지는 기본적으로 **멘션 필요**입니다. 에이전트별 트리거 패턴을 구성하세요. 일반 그룹/채널 답장은 자동으로 게시됩니다. 에이전트가 언제 말할지 결정해야 하는 공유 방에서는 메시지 도구 경로를 선택하세요:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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

    - **메타데이터 멘션**: 네이티브 @-멘션(WhatsApp 탭하여 멘션, Telegram @bot 등)
    - **텍스트 패턴**: `mentionPatterns`의 안전한 정규식 패턴
    - **표시 답장**: `messages.visibleReplies`는 전역적으로 메시지 도구 전송을 요구할 수 있으며, `messages.groupChat.visibleReplies`는 그룹/채널에 대해 이를 재정의합니다.
    - 표시 답장 모드, 채널별 재정의, 셀프 채팅 모드는 [전체 참조](/ko/gateway/config-channels#group-chat-mention-gating)를 확인하세요.

  </Accordion>

  <Accordion title="에이전트별 Skills 제한">
    공유 기준선에는 `agents.defaults.skills`를 사용한 다음, 특정
    에이전트는 `agents.list[].skills`로 재정의하세요:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - 기본적으로 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략하세요.
    - 기본값을 상속하려면 `agents.list[].skills`를 생략하세요.
    - Skills가 없도록 하려면 `agents.list[].skills: []`를 설정하세요.
    - [Skills](/ko/tools/skills), [Skills 구성](/ko/tools/skills-config), 그리고
      [구성 참조](/ko/gateway/config-agents#agents-defaults-skills)를 확인하세요.

  </Accordion>

  <Accordion title="Gateway 채널 상태 모니터링 조정">
    오래된 것으로 보이는 채널을 Gateway가 얼마나 적극적으로 재시작할지 제어하세요:

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

    - 상태 모니터 재시작을 전역적으로 비활성화하려면 `gateway.channelHealthCheckMinutes: 0`을 설정하세요.
    - `channelStaleEventThresholdMinutes`는 확인 간격보다 크거나 같아야 합니다.
    - 전역 모니터를 비활성화하지 않고 한 채널 또는 계정의 자동 재시작을 비활성화하려면 `channels.<provider>.healthMonitor.enabled` 또는 `channels.<provider>.accounts.<id>.healthMonitor.enabled`를 사용하세요.
    - 운영 디버깅은 [상태 확인](/ko/gateway/health)을, 모든 필드는 [전체 참조](/ko/gateway/configuration-reference#gateway)를 확인하세요.

  </Accordion>

  <Accordion title="Gateway WebSocket 핸드셰이크 타임아웃 조정">
    부하가 있거나 저전력인 호스트에서 로컬 클라이언트가 인증 전 WebSocket 핸드셰이크를
    완료할 시간을 더 주세요:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - 기본값은 `15000`밀리초입니다.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS`는 일회성 서비스 또는 셸 재정의에 여전히 우선합니다.
    - 먼저 시작/이벤트 루프 지연을 수정하는 것이 좋습니다. 이 설정은 정상적이지만 워밍업 중 느린 호스트를 위한 것입니다.

  </Accordion>

  <Accordion title="세션 및 재설정 구성">
    세션은 대화 연속성과 격리를 제어합니다:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
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

    - `dmScope`: `main` (공유) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: 스레드에 바인딩된 세션 라우팅을 위한 전역 기본값입니다(Discord는 `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`를 지원합니다).
    - 범위 지정, ID 연결, 전송 정책은 [세션 관리](/ko/concepts/session)를 참조하세요.
    - 모든 필드는 [전체 참조](/ko/gateway/config-agents#session)를 참조하세요.

  </Accordion>

  <Accordion title="Enable sandboxing">
    에이전트 세션을 격리된 샌드박스 런타임에서 실행합니다.

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    먼저 이미지를 빌드하세요. 소스 체크아웃에서는 `scripts/sandbox-setup.sh`를 실행하고, npm 설치에서는 [샌드박싱 § 이미지 및 설정](/ko/gateway/sandboxing#images-and-setup)의 인라인 `docker build` 명령을 참조하세요.

    전체 가이드는 [샌드박싱](/ko/gateway/sandboxing)을, 모든 옵션은 [전체 참조](/ko/gateway/config-agents#agentsdefaultssandbox)를 참조하세요.

  </Accordion>

  <Accordion title="Enable relay-backed push for official iOS builds">
    공개 App Store/TestFlight 빌드용 릴레이 기반 푸시는 호스팅된 OpenClaw 릴레이 `https://ios-push-relay.openclaw.ai`를 사용합니다.

    사용자 지정 릴레이 배포에는 릴레이 URL이 Gateway 릴레이 URL과 일치하는 의도적으로 분리된 iOS 빌드/배포 경로가 필요합니다. 사용자 지정 릴레이 빌드를 사용하는 경우 Gateway 설정에서 다음을 설정하세요.

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    CLI 동등 명령:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    이 설정이 하는 일:

    - Gateway가 외부 릴레이를 통해 `push.test`, 깨우기 알림, 재연결 깨우기를 보낼 수 있게 합니다.
    - 페어링된 iOS 앱이 전달한 등록 범위 전송 권한을 사용합니다. Gateway에는 배포 전체 릴레이 토큰이 필요하지 않습니다.
    - 각 릴레이 기반 등록을 iOS 앱이 페어링된 Gateway ID에 바인딩하므로, 다른 Gateway가 저장된 등록을 재사용할 수 없습니다.
    - 로컬/수동 iOS 빌드는 직접 APNs를 계속 사용합니다. 릴레이 기반 전송은 릴레이를 통해 등록된 공식 배포 빌드에만 적용됩니다.
    - iOS 빌드에 내장된 릴레이 기본 URL과 일치해야 하므로, 등록 및 전송 트래픽이 동일한 릴레이 배포에 도달합니다.

    엔드투엔드 흐름:

    1. 공식/TestFlight iOS 빌드를 설치합니다.
    2. 선택 사항: 의도적으로 분리된 사용자 지정 릴레이 빌드를 사용할 때만 Gateway에서 `gateway.push.apns.relay.baseUrl`을 설정합니다.
    3. iOS 앱을 Gateway에 페어링하고 노드 세션과 운영자 세션이 모두 연결되도록 합니다.
    4. iOS 앱이 Gateway ID를 가져오고, App Attest와 앱 영수증을 사용해 릴레이에 등록한 다음, 릴레이 기반 `push.apns.register` 페이로드를 페어링된 Gateway에 게시합니다.
    5. Gateway는 릴레이 핸들과 전송 권한을 저장한 뒤 `push.test`, 깨우기 알림, 재연결 깨우기에 사용합니다.

    운영 참고 사항:

    - iOS 앱을 다른 Gateway로 전환하는 경우, 앱이 해당 Gateway에 바인딩된 새 릴레이 등록을 게시할 수 있도록 앱을 다시 연결하세요.
    - 다른 릴레이 배포를 가리키는 새 iOS 빌드를 출시하면, 앱은 이전 릴레이 출처를 재사용하는 대신 캐시된 릴레이 등록을 새로 고칩니다.

    호환성 참고 사항:

    - `OPENCLAW_APNS_RELAY_BASE_URL` 및 `OPENCLAW_APNS_RELAY_TIMEOUT_MS`는 임시 환경 변수 재정의로 계속 작동합니다.
    - 사용자 지정 Gateway 릴레이 URL은 iOS 빌드에 내장된 릴레이 기본 URL과 일치해야 합니다. 공개 App Store 릴리스 레인은 사용자 지정 iOS 릴레이 URL 재정의를 거부합니다.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`는 local loopback 전용 개발용 우회 수단으로 남아 있습니다. HTTP 릴레이 URL을 설정에 영구 저장하지 마세요.

    엔드투엔드 흐름은 [iOS 앱](/ko/platforms/ios#relay-backed-push-for-official-builds)을, 릴레이 보안 모델은 [인증 및 신뢰 흐름](/ko/platforms/ios#authentication-and-trust-flow)을 참조하세요.

  </Accordion>

  <Accordion title="Set up heartbeat (periodic check-ins)">
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

    - `every`: 기간 문자열(`30m`, `2h`). 비활성화하려면 `0m`으로 설정합니다.
    - `target`: `last` | `none` | `<channel-id>`(예: `discord`, `matrix`, `telegram` 또는 `whatsapp`)
    - `directPolicy`: DM 스타일 Heartbeat 대상에 대해 `allow`(기본값) 또는 `block`
    - 전체 가이드는 [Heartbeat](/ko/gateway/heartbeat)를 참조하세요.

  </Accordion>

  <Accordion title="Configure cron jobs">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: 완료된 격리 실행 세션을 `sessions.json`에서 정리합니다(기본값 `24h`; 비활성화하려면 `false`로 설정).
    - `runLog`: 작업별로 보존된 Cron 실행 기록 행을 정리합니다. `maxBytes`는 이전 파일 기반 실행 로그용으로 계속 허용됩니다.
    - 기능 개요와 CLI 예시는 [Cron 작업](/ko/automation/cron-jobs)을 참조하세요.

  </Accordion>

  <Accordion title="Set up webhooks (hooks)">
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
    - 모든 훅/Webhook 페이로드 콘텐츠를 신뢰할 수 없는 입력으로 취급하세요.
    - 전용 `hooks.token`을 사용하세요. 활성 Gateway 인증 비밀(`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`)을 재사용하지 마세요.
    - 훅 인증은 헤더 전용입니다(`Authorization: Bearer ...` 또는 `x-openclaw-token`). 쿼리 문자열 토큰은 거부됩니다.
    - `hooks.path`는 `/`일 수 없습니다. Webhook 인그레스는 `/hooks` 같은 전용 하위 경로에 유지하세요.
    - 엄격하게 범위가 제한된 디버깅을 수행하는 경우가 아니라면 안전하지 않은 콘텐츠 우회 플래그(`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`)를 비활성화 상태로 두세요.
    - `hooks.allowRequestSessionKey`를 활성화하는 경우, 호출자가 선택한 세션 키를 제한하도록 `hooks.allowedSessionKeyPrefixes`도 설정하세요.
    - 훅으로 구동되는 에이전트에는 강력한 최신 모델 티어와 엄격한 도구 정책을 선호하세요(예: 가능하면 메시징 전용과 샌드박싱).

    모든 매핑 옵션과 Gmail 통합은 [전체 참조](/ko/gateway/configuration-reference#hooks)를 참조하세요.

  </Accordion>

  <Accordion title="Configure multi-agent routing">
    별도 워크스페이스와 세션을 가진 여러 격리 에이전트를 실행합니다.

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

    바인딩 규칙과 에이전트별 액세스 프로필은 [멀티 에이전트](/ko/concepts/multi-agent) 및 [전체 참조](/ko/gateway/config-agents#multi-agent-routing)를 참조하세요.

  </Accordion>

  <Accordion title="Split config into multiple files ($include)">
    큰 설정을 구성하려면 `$include`를 사용하세요.

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

    - **단일 파일**: 포함하는 객체를 대체합니다.
    - **파일 배열**: 순서대로 깊게 병합됩니다(나중 값이 우선).
    - **형제 키**: include 이후에 병합됩니다(포함된 값을 재정의).
    - **중첩 include**: 최대 10단계 깊이까지 지원됩니다.
    - **상대 경로**: include하는 파일을 기준으로 확인됩니다.
    - **경로 형식**: include 경로에는 널 바이트가 포함될 수 없으며, 확인 전후 모두 4096자보다 엄격히 짧아야 합니다.
    - **OpenClaw 소유 쓰기**: 쓰기가 `plugins: { $include: "./plugins.json5" }` 같은 단일 파일 include가 뒷받침하는 최상위 섹션 하나만 변경하는 경우, OpenClaw는 해당 포함 파일을 업데이트하고 `openclaw.json`은 그대로 둡니다.
    - **지원되지 않는 쓰기 전달**: 루트 include, include 배열, 형제 재정의가 있는 include는 설정을 평탄화하는 대신 OpenClaw 소유 쓰기에 대해 안전하게 실패합니다.
    - **격리**: `$include` 경로는 `openclaw.json`이 있는 디렉터리 아래로 확인되어야 합니다. 여러 머신 또는 사용자 간에 트리를 공유하려면 include가 참조할 수 있는 추가 디렉터리의 경로 목록(POSIX에서는 `:`, Windows에서는 `;`)으로 `OPENCLAW_INCLUDE_ROOTS`를 설정하세요. 심볼릭 링크는 확인된 뒤 다시 검사되므로, 어휘상으로는 설정 디렉터리 안에 있지만 실제 대상이 허용된 모든 루트를 벗어나는 경로는 여전히 거부됩니다.
    - **오류 처리**: 누락된 파일, 구문 분석 오류, 순환 include, 잘못된 경로 형식, 과도한 길이에 대해 명확한 오류를 제공합니다.

  </Accordion>
</AccordionGroup>

## 설정 핫 리로드

Gateway는 `~/.openclaw/openclaw.json`을 감시하고 변경 사항을 자동으로 적용합니다. 대부분의 설정에는 수동 재시작이 필요하지 않습니다.

직접 파일 편집은 검증되기 전까지 신뢰할 수 없는 것으로 취급됩니다. 감시자는 편집기의 임시 쓰기/이름 변경 변동이 안정될 때까지 기다린 뒤 최종 파일을 읽고, 잘못된 외부 편집은 `openclaw.json`을 다시 쓰지 않고 거부합니다. OpenClaw 소유 설정 쓰기도 쓰기 전에 동일한 스키마 게이트를 사용합니다. `gateway.mode`를 삭제하거나 파일 크기를 절반 이상 줄이는 등의 파괴적 덮어쓰기는 거부되고 검사를 위해 `.rejected.*`로 저장됩니다.

`config reload skipped (invalid config)`가 표시되거나 시작 시 `Invalid
config`가 보고되면 설정을 검사하고 `openclaw config validate`를 실행한 다음, 복구를 위해 `openclaw
doctor --fix`를 실행하세요. 체크리스트는 [Gateway 문제 해결](/ko/gateway/troubleshooting#gateway-rejected-invalid-config)을 참조하세요.

### 리로드 모드

| 모드                   | 동작                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (기본값) | 안전한 변경 사항을 즉시 핫 적용합니다. 중요한 변경 사항은 자동으로 재시작합니다.           |
| **`hot`**              | 안전한 변경 사항만 핫 적용합니다. 재시작이 필요할 때 경고를 기록합니다. 처리는 사용자가 합니다. |
| **`restart`**          | 안전 여부와 관계없이 설정 변경 시 Gateway를 재시작합니다.                                 |
| **`off`**              | 파일 감시를 비활성화합니다. 변경 사항은 다음 수동 재시작 때 적용됩니다.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 핫 적용되는 항목과 재시작이 필요한 항목

대부분의 필드는 중단 없이 핫 적용됩니다. `hybrid` 모드에서는 재시작이 필요한 변경 사항이 자동으로 처리됩니다.

| 범주                | 필드                                                              | 재시작 필요 여부 |
| ------------------- | ----------------------------------------------------------------- | ---------------- |
| 채널                | `channels.*`, `web` (WhatsApp) - 모든 기본 제공 및 Plugin 채널    | 아니요           |
| 에이전트 및 모델    | `agent`, `agents`, `models`, `routing`                            | 아니요           |
| 자동화              | `hooks`, `cron`, `agent.heartbeat`                                | 아니요           |
| 세션 및 메시지      | `session`, `messages`                                             | 아니요           |
| 도구 및 미디어      | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | 아니요           |
| UI 및 기타          | `ui`, `logging`, `identity`, `bindings`                           | 아니요           |
| Gateway 서버        | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **예**           |
| 인프라              | `discovery`, `plugins`                                            | **예**           |

<Note>
`gateway.reload`와 `gateway.remote`는 예외입니다. 이를 변경해도 재시작이 트리거되지 **않습니다**.
</Note>

### 재로드 계획

`$include`를 통해 참조되는 소스 파일을 편집하면 OpenClaw는 평탄화된 메모리 내 뷰가 아니라 소스에 작성된 레이아웃에서 재로드를 계획합니다.
따라서 `plugins: { $include: "./plugins.json5" }`처럼 단일 최상위 섹션이 자체 포함 파일에 있더라도 핫 리로드 결정(핫 적용 vs 재시작)을 예측 가능하게 유지합니다. 소스 레이아웃이 모호하면 재로드 계획은 안전하게 실패합니다.

## Config RPC(프로그래밍 방식 업데이트)

Gateway API를 통해 설정을 쓰는 도구의 경우 다음 흐름을 권장합니다.

- `config.schema.lookup`으로 하나의 하위 트리를 검사합니다(얕은 스키마 노드 + 하위 요약).
- `config.get`으로 현재 스냅샷과 `hash`를 가져옵니다.
- 부분 업데이트에는 `config.patch`를 사용합니다(JSON 병합 패치: 객체는 병합, `null`은 삭제, 배열은 항목이 제거될 경우 `replacePaths`로 명시적으로 확인된 때에만 교체).
- 전체 설정을 교체하려는 경우에만 `config.apply`를 사용합니다.
- 명시적 자체 업데이트와 재시작에는 `update.run`을 사용합니다. 재시작 후 세션에서 후속 턴 하나를 실행해야 하는 경우 `continuationMessage`를 포함합니다.
- `update.status`로 최신 업데이트 재시작 센티널을 검사하고 재시작 후 실행 중인 버전을 확인합니다.

에이전트는 정확한 필드 수준 문서와 제약 조건을 확인하는 첫 지점으로 `config.schema.lookup`을 취급해야 합니다. 더 넓은 설정 맵, 기본값, 또는 전용 하위 시스템 참조 링크가 필요할 때는 [설정 참조](/ko/gateway/configuration-reference)를 사용하세요.

<Note>
컨트롤 플레인 쓰기(`config.apply`, `config.patch`, `update.run`)는 `deviceId+clientIp`당 60초에 3개 요청으로 속도 제한됩니다. 재시작 요청은 병합된 뒤 재시작 주기 사이에 30초 쿨다운을 강제합니다.
`update.status`는 읽기 전용이지만, 재시작 센티널에 업데이트 단계 요약과 명령 출력 꼬리가 포함될 수 있으므로 관리자 범위입니다.
</Note>

부분 패치 예:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply`와 `config.patch`는 모두 `raw`, `baseHash`, `sessionKey`, `note`, `restartDelayMs`를 받습니다. 설정이 이미 존재하는 경우 두 메서드 모두에 `baseHash`가 필요합니다.

`config.patch`는 배열 교체가 의도된 설정 경로 배열인 `replacePaths`도 받습니다. 패치가 기존 배열을 더 적은 항목으로 교체하거나 삭제하려는 경우, Gateway는 해당 정확한 경로가 `replacePaths`에 나타나지 않으면 쓰기를 거부합니다. 배열 항목 아래의 중첩 배열은 `agents.list[].skills`처럼 `[]`를 사용합니다. 이를 통해 잘린 `config.get` 스냅샷이 라우팅 또는 허용 목록 배열을 조용히 덮어쓰는 일을 방지합니다. 전체 설정을 교체하려는 경우 `config.apply`를 사용하세요.

## 환경 변수

OpenClaw는 부모 프로세스와 다음 위치에서 환경 변수를 읽습니다.

- 현재 작업 디렉터리의 `.env`(있는 경우)
- `~/.openclaw/.env`(전역 폴백)

두 파일 모두 기존 환경 변수를 재정의하지 않습니다. 설정에서 인라인 환경 변수를 지정할 수도 있습니다.

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="셸 환경 가져오기(선택 사항)">
  활성화되어 있고 예상 키가 설정되지 않은 경우, OpenClaw는 로그인 셸을 실행하고 누락된 키만 가져옵니다.

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

동등한 환경 변수: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="설정 값의 환경 변수 치환">
  `${VAR_NAME}`으로 모든 설정 문자열 값에서 환경 변수를 참조하세요.

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

규칙:

- 일치하는 대문자 이름만 허용: `[A-Z_][A-Z0-9_]*`
- 누락되었거나 비어 있는 변수는 로드 시 오류를 발생시킵니다.
- 리터럴 출력을 위해 `$${VAR}`로 이스케이프합니다.
- `$include` 파일 내부에서도 작동합니다.
- 인라인 치환: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="비밀 참조(env, file, exec)">
  SecretRef 객체를 지원하는 필드에는 다음을 사용할 수 있습니다.

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

SecretRef 세부 정보(`env`/`file`/`exec`용 `secrets.providers` 포함)는 [비밀 관리](/ko/gateway/secrets)에 있습니다.
지원되는 자격 증명 경로는 [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)에 나열되어 있습니다.
</Accordion>

전체 우선순위와 소스는 [환경](/ko/help/environment)을 참조하세요.

## 전체 참조

완전한 필드별 참조는 **[설정 참조](/ko/gateway/configuration-reference)**를 참조하세요.

---

_관련: [설정 예시](/ko/gateway/configuration-examples) · [설정 참조](/ko/gateway/configuration-reference) · [Doctor](/ko/gateway/doctor)_

## 관련

- [설정 참조](/ko/gateway/configuration-reference)
- [설정 예시](/ko/gateway/configuration-examples)
- [Gateway 런북](/ko/gateway)
