---
read_when:
    - OpenClaw 처음 설정하기
    - 일반적인 구성 패턴 찾기
    - 특정 config 섹션으로 이동하기
summary: '구성 개요: 일반적인 작업, 빠른 설정, 그리고 전체 참조 링크'
title: 구성
x-i18n:
    generated_at: "2026-04-23T14:03:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# 구성

OpenClaw는 `~/.openclaw/openclaw.json`에서 선택적인 <Tooltip tip="JSON5는 주석과 후행 쉼표를 지원합니다">**JSON5**</Tooltip> config를 읽습니다.
활성 config 경로는 일반 파일이어야 합니다. 심볼릭 링크된 `openclaw.json`
레이아웃은 OpenClaw 소유 쓰기에는 지원되지 않습니다. 원자적 쓰기로 인해
심볼릭 링크를 유지하는 대신 경로가 교체될 수 있습니다. 기본 state 디렉터리 밖에
config를 보관하는 경우 `OPENCLAW_CONFIG_PATH`를 실제 파일로 직접 지정하세요.

파일이 없으면 OpenClaw는 안전한 기본값을 사용합니다. config를 추가하는 일반적인 이유는 다음과 같습니다.

- 채널을 연결하고 누가 봇에 메시지를 보낼 수 있는지 제어
- 모델, 도구, 샌드박싱 또는 자동화(Cron, hooks) 설정
- 세션, 미디어, 네트워킹 또는 UI 조정

사용 가능한 모든 필드는 [전체 참조](/ko/gateway/configuration-reference)를 참조하세요.

<Tip>
**구성이 처음이신가요?** 대화형 설정을 위해 `openclaw onboard`로 시작하거나, 완전한 복사-붙여넣기용 config는 [Configuration Examples](/ko/gateway/configuration-examples) 가이드를 확인하세요.
</Tip>

## 최소 config

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## config 편집

<Tabs>
  <Tab title="대화형 마법사">
    ```bash
    openclaw onboard       # 전체 온보딩 흐름
    openclaw configure     # config 마법사
    ```
  </Tab>
  <Tab title="CLI (원라이너)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789)를 열고 **Config** 탭을 사용하세요.
    Control UI는 라이브 config 스키마에서 폼을 렌더링하며, 사용 가능한 경우
    plugin 및 채널 스키마와 함께 필드 `title` / `description` 문서 메타데이터를 포함하고,
    비상 탈출구로 **Raw JSON** 편집기도 제공합니다. 드릴다운
    UI 및 기타 도구를 위해 gateway는 `config.schema.lookup`도 노출하여
    경로 범위 스키마 노드 하나와 즉시 하위 요약을 가져올 수 있게 합니다.
  </Tab>
  <Tab title="직접 편집">
    `~/.openclaw/openclaw.json`을 직접 편집하세요. Gateway가 파일을 감시하고 변경 사항을 자동 적용합니다([hot reload](#config-hot-reload) 참조).
  </Tab>
</Tabs>

## 엄격한 검증

<Warning>
OpenClaw는 스키마와 완전히 일치하는 구성만 허용합니다. 알 수 없는 키, 잘못된 타입, 유효하지 않은 값이 있으면 Gateway는 **시작을 거부**합니다. 루트 수준의 유일한 예외는 편집기가 JSON Schema 메타데이터를 연결할 수 있도록 하는 `$schema`(문자열)입니다.
</Warning>

`openclaw config schema`는 Control UI
및 검증에 사용되는 canonical JSON Schema를 출력합니다. `config.schema.lookup`은 드릴다운 도구용으로 단일 경로 범위 노드와
하위 요약을 가져옵니다. 필드 `title`/`description` 문서 메타데이터는
중첩 객체, 와일드카드(`*`), 배열 항목(`[]`), `anyOf`/
`oneOf`/`allOf` 분기까지 이어집니다. 런타임 plugin 및 채널 스키마는
manifest registry가 로드되면 병합됩니다.

검증이 실패하면:

- Gateway가 부팅되지 않습니다
- 진단 명령만 동작합니다(`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- 정확한 문제를 보려면 `openclaw doctor`를 실행하세요
- 복구를 적용하려면 `openclaw doctor --fix`(또는 `--yes`)를 실행하세요

Gateway는 시작이 성공할 때마다 신뢰할 수 있는 마지막 정상 사본을 유지합니다.
이후 `openclaw.json`이 검증에 실패하거나(`gateway.mode`가 사라짐,
급격히 축소됨, 또는 앞부분에 엉뚱한 로그 줄이 붙음) 문제가 생기면, OpenClaw는 깨진 파일을
`.clobbered.*`로 보존하고 마지막 정상 사본을 복원한 뒤 복구
이유를 기록합니다. 다음 agent 턴에도 시스템 이벤트 경고가 전달되므로
메인 agent가 복원된 config를 무분별하게 다시 쓰지 않습니다. 후보에 `***` 같은
redact된 비밀 플레이스홀더가 포함되어 있으면 마지막 정상 사본으로 승격되지 않습니다.

## 일반적인 작업

<AccordionGroup>
  <Accordion title="채널 설정하기(WhatsApp, Telegram, Discord 등)">
    각 채널은 `channels.<provider>` 아래에 자체 config 섹션을 가집니다. 설정 단계는 전용 채널 페이지를 참조하세요.

    - [WhatsApp](/ko/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/ko/channels/telegram) — `channels.telegram`
    - [Discord](/ko/channels/discord) — `channels.discord`
    - [Feishu](/ko/channels/feishu) — `channels.feishu`
    - [Google Chat](/ko/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/ko/channels/msteams) — `channels.msteams`
    - [Slack](/ko/channels/slack) — `channels.slack`
    - [Signal](/ko/channels/signal) — `channels.signal`
    - [iMessage](/ko/channels/imessage) — `channels.imessage`
    - [Mattermost](/ko/channels/mattermost) — `channels.mattermost`

    모든 채널은 동일한 DM 정책 패턴을 공유합니다.

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // allowlist/open에서만 사용
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="모델 선택 및 구성">
    기본 모델과 선택적 폴백을 설정합니다.

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

    - `agents.defaults.models`는 모델 카탈로그를 정의하며 `/model`의 allowlist 역할도 합니다.
    - 기존 모델을 제거하지 않고 allowlist 항목을 추가하려면 `openclaw config set agents.defaults.models '<json>' --strict-json --merge`를 사용하세요. 항목을 제거하게 되는 일반 교체는 `--replace`를 전달하지 않으면 거부됩니다.
    - 모델 ref는 `provider/model` 형식을 사용합니다(예: `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`는 transcript/도구 이미지 축소 크기를 제어합니다(기본값 `1200`). 값이 낮을수록 스크린샷이 많은 실행에서 보통 vision token 사용량이 줄어듭니다.
    - 채팅 중 모델 전환은 [Models CLI](/ko/concepts/models)를, 인증 순환 및 폴백 동작은 [Model Failover](/ko/concepts/model-failover)를 참조하세요.
    - 사용자 정의/자체 호스팅 provider는 참조의 [Custom providers](/ko/gateway/configuration-reference#custom-providers-and-base-urls)를 확인하세요.

  </Accordion>

  <Accordion title="누가 봇에 메시지를 보낼 수 있는지 제어">
    DM 접근은 채널별 `dmPolicy`로 제어됩니다.

    - `"pairing"`(기본값): 알 수 없는 발신자는 승인용 일회성 페어링 코드를 받습니다
    - `"allowlist"`: `allowFrom`(또는 페어링된 허용 저장소)에 있는 발신자만 허용
    - `"open"`: 모든 수신 DM 허용(`allowFrom: ["*"]` 필요)
    - `"disabled"`: 모든 DM 무시

    그룹에는 `groupPolicy` + `groupAllowFrom` 또는 채널별 allowlist를 사용하세요.

    채널별 자세한 내용은 [전체 참조](/ko/gateway/configuration-reference#dm-and-group-access)를 참조하세요.

  </Accordion>

  <Accordion title="그룹 채팅 멘션 게이팅 설정">
    그룹 메시지는 기본적으로 **멘션 필요**입니다. agent별 패턴을 구성하세요.

    ```json5
    {
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

    - **메타데이터 멘션**: 네이티브 @멘션(WhatsApp 탭-투-멘션, Telegram @bot 등)
    - **텍스트 패턴**: `mentionPatterns`의 안전한 정규식 패턴
    - 채널별 재정의와 self-chat mode는 [전체 참조](/ko/gateway/configuration-reference#group-chat-mention-gating)를 참조하세요.

  </Accordion>

  <Accordion title="agent별 Skills 제한">
    공유 기준선에는 `agents.defaults.skills`를 사용하고, 특정
    agent는 `agents.list[].skills`로 재정의하세요.

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // github, weather 상속
          { id: "docs", skills: ["docs-search"] }, // defaults 대체
          { id: "locked-down", skills: [] }, // Skills 없음
        ],
      },
    }
    ```

    - 기본적으로 Skills를 제한하지 않으려면 `agents.defaults.skills`를 생략하세요.
    - 기본값을 상속하려면 `agents.list[].skills`를 생략하세요.
    - Skills를 사용하지 않으려면 `agents.list[].skills: []`로 설정하세요.
    - [Skills](/ko/tools/skills), [Skills config](/ko/tools/skills-config), 그리고
      [Configuration Reference](/ko/gateway/configuration-reference#agents-defaults-skills)를 참조하세요.

  </Accordion>

  <Accordion title="Gateway 채널 상태 모니터링 조정">
    정체된 것처럼 보이는 채널을 Gateway가 얼마나 적극적으로 재시작할지 제어합니다.

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

    - 전역적으로 상태 모니터 재시작을 비활성화하려면 `gateway.channelHealthCheckMinutes: 0`으로 설정하세요.
    - `channelStaleEventThresholdMinutes`는 검사 간격보다 크거나 같아야 합니다.
    - 전역 모니터를 끄지 않고 한 채널 또는 계정의 자동 재시작만 비활성화하려면 `channels.<provider>.healthMonitor.enabled` 또는 `channels.<provider>.accounts.<id>.healthMonitor.enabled`를 사용하세요.
    - 운영 디버깅은 [Health Checks](/ko/gateway/health)를, 모든 필드는 [전체 참조](/ko/gateway/configuration-reference#gateway)를 참조하세요.

  </Accordion>

  <Accordion title="세션과 재설정 구성">
    세션은 대화의 연속성과 격리를 제어합니다.

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // 다중 사용자에 권장
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
    - `threadBindings`: 스레드 바인드 세션 라우팅의 전역 기본값(Discord는 `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` 지원).
    - 범위, identity 링크, send 정책은 [Session Management](/ko/concepts/session)를 참조하세요.
    - 모든 필드는 [전체 참조](/ko/gateway/configuration-reference#session)를 참조하세요.

  </Accordion>

  <Accordion title="샌드박싱 활성화">
    격리된 샌드박스 런타임에서 agent 세션을 실행합니다.

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

    먼저 이미지를 빌드하세요: `scripts/sandbox-setup.sh`

    전체 가이드는 [Sandboxing](/ko/gateway/sandboxing), 모든 옵션은 [전체 참조](/ko/gateway/configuration-reference#agentsdefaultssandbox)를 참조하세요.

  </Accordion>

  <Accordion title="공식 iOS 빌드용 relay 기반 푸시 활성화">
    relay 기반 푸시는 `openclaw.json`에서 구성합니다.

    gateway config에 다음을 설정하세요.

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

    동등한 CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    이 설정이 하는 일:

    - Gateway가 외부 relay를 통해 `push.test`, wake nudges, reconnect wake를 전송할 수 있게 합니다.
    - 페어링된 iOS 앱이 전달한 registration 범위 send grant를 사용합니다. Gateway에는 배포 전체 범위 relay token이 필요하지 않습니다.
    - 각 relay 기반 registration을 iOS 앱이 페어링한 Gateway identity에 바인딩하므로, 다른 Gateway가 저장된 registration을 재사용할 수 없습니다.
    - 로컬/수동 iOS 빌드는 direct APNs를 계속 사용합니다. relay 기반 전송은 relay를 통해 등록된 공식 배포 빌드에만 적용됩니다.
    - 등록 트래픽과 전송 트래픽이 동일한 relay 배포에 도달하도록, 공식/TestFlight iOS 빌드에 내장된 relay base URL과 일치해야 합니다.

    엔드 투 엔드 흐름:

    1. 동일한 relay base URL로 컴파일된 공식/TestFlight iOS 빌드를 설치합니다.
    2. Gateway에서 `gateway.push.apns.relay.baseUrl`을 구성합니다.
    3. iOS 앱을 Gateway와 페어링하고 node 세션과 operator 세션이 모두 연결되도록 합니다.
    4. iOS 앱이 Gateway identity를 가져오고, App Attest와 앱 receipt를 사용해 relay에 등록한 다음, relay 기반 `push.apns.register` payload를 페어링된 Gateway에 게시합니다.
    5. Gateway는 relay handle과 send grant를 저장한 뒤, 이를 `push.test`, wake nudges, reconnect wake에 사용합니다.

    운영 참고:

    - iOS 앱을 다른 Gateway로 전환하면, 해당 Gateway에 바인딩된 새 relay registration을 게시할 수 있도록 앱을 다시 연결하세요.
    - 다른 relay 배포를 가리키는 새 iOS 빌드를 배포하면, 앱은 이전 relay origin을 재사용하는 대신 캐시된 relay registration을 새로 고칩니다.

    호환성 참고:

    - `OPENCLAW_APNS_RELAY_BASE_URL` 및 `OPENCLAW_APNS_RELAY_TIMEOUT_MS`는 여전히 임시 env 재정의로 동작합니다.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`는 loopback 전용 개발용 비상 탈출구로 유지됩니다. HTTP relay URL을 config에 영구 저장하지 마세요.

    엔드 투 엔드 흐름은 [iOS App](/ko/platforms/ios#relay-backed-push-for-official-builds), relay 보안 모델은 [Authentication and trust flow](/ko/platforms/ios#authentication-and-trust-flow)를 참조하세요.

  </Accordion>

  <Accordion title="Heartbeat 설정하기(주기적 체크인)">
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
    - `target`: `last` | `none` | `<channel-id>`(예: `discord`, `matrix`, `telegram`, `whatsapp`)
    - `directPolicy`: DM 스타일 Heartbeat 대상에 대해 `allow`(기본값) 또는 `block`
    - 전체 가이드는 [Heartbeat](/ko/gateway/heartbeat)를 참조하세요.

  </Accordion>

  <Accordion title="Cron 작업 구성">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: 완료된 격리 실행 세션을 `sessions.json`에서 정리합니다(기본값 `24h`, 비활성화하려면 `false`로 설정).
    - `runLog`: 크기와 유지 줄 수 기준으로 `cron/runs/<jobId>.jsonl`을 정리합니다.
    - 기능 개요와 CLI 예시는 [Cron jobs](/ko/automation/cron-jobs)를 참조하세요.

  </Accordion>

  <Accordion title="Webhook 설정하기(hooks)">
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

    보안 참고:
    - 모든 hook/Webhook payload 콘텐츠는 신뢰할 수 없는 입력으로 취급하세요.
    - 전용 `hooks.token`을 사용하세요. 공유 Gateway token을 재사용하지 마세요.
    - Hook 인증은 헤더 전용입니다(`Authorization: Bearer ...` 또는 `x-openclaw-token`). 쿼리 문자열 토큰은 거부됩니다.
    - `hooks.path`는 `/`일 수 없습니다. Webhook 수신은 `/hooks` 같은 전용 하위 경로에 두세요.
    - `unsafe-content` 우회 플래그(`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`)는 범위가 엄격히 제한된 디버깅이 아닌 한 비활성 상태로 유지하세요.
    - `hooks.allowRequestSessionKey`를 활성화하는 경우, 호출자가 선택한 세션 키 범위를 제한하도록 `hooks.allowedSessionKeyPrefixes`도 함께 설정하세요.
    - hook 기반 agent에는 강력한 최신 모델 티어와 엄격한 도구 정책을 권장합니다(예: 가능하면 메시징 전용 + 샌드박싱).

    모든 매핑 옵션과 Gmail 통합은 [전체 참조](/ko/gateway/configuration-reference#hooks)를 참조하세요.

  </Accordion>

  <Accordion title="다중 agent 라우팅 구성">
    별도의 workspace와 세션을 가진 여러 격리 agent를 실행합니다.

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

    바인딩 규칙과 agent별 액세스 프로필은 [Multi-Agent](/ko/concepts/multi-agent) 및 [전체 참조](/ko/gateway/configuration-reference#multi-agent-routing)를 참조하세요.

  </Accordion>

  <Accordion title="config를 여러 파일로 분리하기($include)">
    큰 config를 정리하려면 `$include`를 사용하세요.

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
    - **파일 배열**: 순서대로 deep-merge됩니다(뒤의 값이 우선)
    - **형제 키**: include 이후 병합됩니다(포함된 값을 재정의)
    - **중첩 include**: 최대 10단계까지 지원
    - **상대 경로**: include하는 파일 기준으로 확인됨
    - **OpenClaw 소유 쓰기**: 쓰기가 `plugins: { $include: "./plugins.json5" }` 같은 단일 파일 include로 뒷받침되는 최상위 섹션 하나만 변경하는 경우, OpenClaw는 해당 포함 파일을 업데이트하고 `openclaw.json`은 그대로 둡니다
    - **지원되지 않는 write-through**: 루트 include, include 배열, 형제 재정의가 있는 include는 config를 평탄화하는 대신 OpenClaw 소유 쓰기에 대해 fail closed됩니다
    - **오류 처리**: 누락된 파일, parse 오류, 순환 include에 대해 명확한 오류 제공

  </Accordion>
</AccordionGroup>

## Config hot reload

Gateway는 `~/.openclaw/openclaw.json`을 감시하고 변경 사항을 자동 적용합니다. 대부분의 설정에는 수동 재시작이 필요하지 않습니다.

직접 파일을 편집한 경우 검증되기 전까지는 신뢰할 수 없는 것으로 취급됩니다. watcher는
에디터의 임시 쓰기/이름 변경 잡음이 가라앉을 때까지 기다린 뒤 최종 파일을 읽고,
유효하지 않은 외부 편집은 마지막 정상 config를 복원하여 거부합니다. OpenClaw 소유
config 쓰기도 기록 전에 동일한 스키마 게이트를 사용합니다. `gateway.mode`를
삭제하거나 파일을 절반 이상 축소하는 등의 파괴적 clobber는 거부되며
검사용 `.rejected.*`로 저장됩니다.

로그에 `Config auto-restored from last-known-good` 또는
`config reload restored last-known-good config`가 보이면,
`openclaw.json` 옆의 해당 `.clobbered.*` 파일을 확인하고, 거부된 payload를 수정한 다음
`openclaw config validate`를 실행하세요. 복구 체크리스트는 [Gateway troubleshooting](/ko/gateway/troubleshooting#gateway-restored-last-known-good-config)를
참조하세요.

### 다시 로드 모드

| 모드                   | 동작                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (기본값)  | 안전한 변경은 즉시 hot-apply합니다. 중요한 변경은 자동으로 재시작합니다.                |
| **`hot`**              | 안전한 변경만 hot-apply합니다. 재시작이 필요하면 경고를 기록하며, 처리는 사용자가 합니다. |
| **`restart`**          | 안전 여부와 관계없이 모든 config 변경 시 Gateway를 재시작합니다.                        |
| **`off`**              | 파일 감시를 비활성화합니다. 변경 사항은 다음 수동 재시작 때 적용됩니다.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### hot-apply되는 항목과 재시작이 필요한 항목

대부분의 필드는 다운타임 없이 hot-apply됩니다. `hybrid` 모드에서는 재시작이 필요한 변경도 자동 처리됩니다.

| 범주                | 필드                                                              | 재시작 필요? |
| ------------------- | ----------------------------------------------------------------- | ------------ |
| 채널                | `channels.*`, `web`(WhatsApp) — 모든 내장 및 plugin 채널         | 아니요       |
| Agent 및 모델       | `agent`, `agents`, `models`, `routing`                            | 아니요       |
| 자동화              | `hooks`, `cron`, `agent.heartbeat`                                | 아니요       |
| 세션 및 메시지      | `session`, `messages`                                             | 아니요       |
| 도구 및 미디어      | `tools`, `browser`, `skills`, `audio`, `talk`                     | 아니요       |
| UI 및 기타          | `ui`, `logging`, `identity`, `bindings`                           | 아니요       |
| Gateway 서버        | `gateway.*`(port, bind, auth, Tailscale, TLS, HTTP)               | **예**       |
| 인프라              | `discovery`, `canvasHost`, `plugins`                              | **예**       |

<Note>
`gateway.reload`와 `gateway.remote`는 예외입니다. 이를 변경해도 **재시작이 트리거되지 않습니다**.
</Note>

### 다시 로드 계획

`$include`를 통해 참조되는 소스 파일을 편집할 때 OpenClaw는
평탄화된 메모리 뷰가 아니라 source-authored 레이아웃을 기준으로 reload를 계획합니다.
이렇게 하면
`plugins: { $include: "./plugins.json5" }`처럼 단일 최상위 섹션이 자체 포함 파일에 있을 때도
hot-reload 결정(hot-apply 대 재시작)이 예측 가능하게 유지됩니다.
소스 레이아웃이 모호하면 reload 계획은 fail closed됩니다.

## Config RPC(프로그래밍 방식 업데이트)

Gateway API를 통해 config를 기록하는 도구에는 다음 흐름을 권장합니다.

- 한 서브트리를 검사하려면 `config.schema.lookup`(얕은 스키마 노드 + 하위
  요약)
- 현재 스냅샷과 `hash`를 가져오려면 `config.get`
- 부분 업데이트에는 `config.patch`(JSON merge patch: 객체는 병합, `null`은
  삭제, 배열은 교체)
- 전체 config를 교체하려는 경우에만 `config.apply`
- 명시적 self-update + 재시작에는 `update.run`

<Note>
제어 plane 쓰기(`config.apply`, `config.patch`, `update.run`)는
`deviceId+clientIp`당 60초에 3회로 rate-limit됩니다. 재시작
요청은 병합된 뒤 재시작 주기 사이에 30초 쿨다운을 적용합니다.
</Note>

예시 부분 patch:

```bash
openclaw gateway call config.get --params '{}'  # payload.hash 캡처
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply`와 `config.patch`는 모두 `raw`, `baseHash`, `sessionKey`,
`note`, `restartDelayMs`를 받습니다. config가 이미 존재하는 경우 두
메서드 모두 `baseHash`가 필요합니다.

## 환경 변수

OpenClaw는 부모 프로세스의 env vars와 함께 다음도 읽습니다.

- 현재 작업 디렉터리의 `.env`(있을 경우)
- `~/.openclaw/.env`(전역 폴백)

어느 파일도 기존 env vars를 재정의하지 않습니다. config에 인라인 env vars를 설정할 수도 있습니다.

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Shell env 가져오기(선택 사항)">
  활성화되어 있고 필요한 키가 설정되지 않은 경우, OpenClaw는 로그인 shell을 실행하고 누락된 키만 가져옵니다:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

동등한 env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="config 값에서 env var 치환">
  `${VAR_NAME}`를 사용해 모든 config 문자열 값에서 env var를 참조할 수 있습니다:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

규칙:

- 대문자 이름만 일치합니다: `[A-Z_][A-Z0-9_]*`
- 누락되었거나 비어 있는 var는 로드 시 오류를 발생시킵니다
- 리터럴 출력에는 `$${VAR}`로 이스케이프하세요
- `$include` 파일 내부에서도 동작합니다
- 인라인 치환: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef(env, file, exec)">
  SecretRef 객체를 지원하는 필드에서는 다음을 사용할 수 있습니다:

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

SecretRef 세부 사항(`env`/`file`/`exec`용 `secrets.providers` 포함)은 [Secrets Management](/ko/gateway/secrets)에 있습니다.
지원되는 credentials 경로는 [SecretRef Credential Surface](/ko/reference/secretref-credential-surface)에 나와 있습니다.
</Accordion>

전체 우선순위와 소스는 [Environment](/ko/help/environment)를 참조하세요.

## 전체 참조

완전한 필드별 참조는 **[Configuration Reference](/ko/gateway/configuration-reference)**를 참조하세요.

---

_관련 항목: [Configuration Examples](/ko/gateway/configuration-examples) · [Configuration Reference](/ko/gateway/configuration-reference) · [Doctor](/ko/gateway/doctor)_
