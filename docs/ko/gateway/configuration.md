---
read_when:
    - 처음으로 OpenClaw 설정하기
    - 일반적인 구성 패턴을 찾고 있습니다.
    - 특정 구성 섹션으로 이동하기
summary: '구성 개요: 일반적인 작업, 빠른 설정, 그리고 전체 참조 링크'
title: 구성
x-i18n:
    generated_at: "2026-04-11T02:44:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: e874be80d11b9123cac6ce597ec02667fbc798f622a076f68535a1af1f0e399c
    source_path: gateway/configuration.md
    workflow: 15
---

# 구성

OpenClaw는 `~/.openclaw/openclaw.json`에서 선택적인 <Tooltip tip="JSON5는 주석과 후행 쉼표를 지원합니다">**JSON5**</Tooltip> 구성을 읽습니다.

파일이 없으면 OpenClaw는 안전한 기본값을 사용합니다. 구성을 추가하는 일반적인 이유는 다음과 같습니다.

- 채널을 연결하고 누가 봇에 메시지를 보낼 수 있는지 제어
- 모델, 도구, 샌드박싱 또는 자동화(cron, hooks) 설정
- 세션, 미디어, 네트워킹 또는 UI 조정

사용 가능한 모든 필드는 [전체 참조](/ko/gateway/configuration-reference)를 확인하세요.

<Tip>
**구성이 처음이신가요?** 대화형 설정을 위해 `openclaw onboard`로 시작하거나, 완전한 복붙용 구성을 보려면 [구성 예제](/ko/gateway/configuration-examples) 가이드를 확인하세요.
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
  <Tab title="CLI (한 줄 명령)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    [http://127.0.0.1:18789](http://127.0.0.1:18789)을 열고 **Config** 탭을 사용하세요.
    Control UI는 라이브 구성 스키마로부터 폼을 렌더링하며, 가능한 경우
    필드 `title` / `description` 문서 메타데이터와 플러그인 및 채널 스키마를
    포함하고, 탈출구로 **Raw JSON** 편집기도 제공합니다. 드릴다운 UI와
    기타 도구를 위해 gateway는 `config.schema.lookup`도 노출하여
    하나의 경로 범위 스키마 노드와 즉시 하위 요약을 가져올 수 있게 합니다.
  </Tab>
  <Tab title="직접 편집">
    `~/.openclaw/openclaw.json`을 직접 편집하세요. Gateway가 파일을 감시하고 변경 사항을 자동으로 적용합니다([핫 리로드](#config-hot-reload) 참조).
  </Tab>
</Tabs>

## 엄격한 검증

<Warning>
OpenClaw는 스키마와 완전히 일치하는 구성만 허용합니다. 알 수 없는 키, 잘못된 형식의 타입, 또는 유효하지 않은 값이 있으면 Gateway는 **시작을 거부합니다**. 유일한 루트 수준 예외는 `$schema`(문자열)이며, 이를 통해 편집기가 JSON Schema 메타데이터를 연결할 수 있습니다.
</Warning>

스키마 도구 관련 참고 사항:

- `openclaw config schema`는 Control UI와 구성 검증에서 사용하는 것과 동일한 JSON Schema 계열을 출력합니다.
- 이 스키마 출력을 `openclaw.json`에 대한 표준 기계 판독 계약으로 취급하세요. 이 개요와 구성 참조는 이를 요약한 것입니다.
- 필드 `title` 및 `description` 값은 편집기와 폼 도구를 위해 스키마 출력에 포함됩니다.
- 중첩 객체, 와일드카드(`*`), 배열 항목(`[]`) 엔트리는 일치하는 필드 문서가 있는 경우 동일한 문서 메타데이터를 상속합니다.
- `anyOf` / `oneOf` / `allOf` 구성 분기도 동일한 문서 메타데이터를 상속하므로, union/intersection 변형에서도 같은 필드 도움말이 유지됩니다.
- `config.schema.lookup`는 하나의 정규화된 구성 경로와 얕은 스키마 노드(`title`, `description`, `type`, `enum`, `const`, 일반적인 범위 제한 및 유사한 검증 필드), 일치한 UI 힌트 메타데이터, 그리고 드릴다운 도구용 즉시 하위 요약을 반환합니다.
- gateway가 현재 매니페스트 레지스트리를 로드할 수 있을 때 런타임 플러그인/채널 스키마가 병합됩니다.
- `pnpm config:docs:check`는 docs용 구성 기준 아티팩트와 현재 스키마 표면 사이의 드리프트를 감지합니다.

검증에 실패하면:

- Gateway가 부팅되지 않습니다
- 진단 명령만 작동합니다 (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- 정확한 문제를 보려면 `openclaw doctor`를 실행하세요
- 수정을 적용하려면 `openclaw doctor --fix`(또는 `--yes`)를 실행하세요

## 일반적인 작업

<AccordionGroup>
  <Accordion title="채널 설정하기 (WhatsApp, Telegram, Discord 등)">
    각 채널에는 `channels.<provider>` 아래에 자체 구성 섹션이 있습니다. 설정 단계는 전용 채널 페이지를 확인하세요.

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
    기본 모델과 선택적 대체 모델을 설정합니다.

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

    - `agents.defaults.models`는 모델 카탈로그를 정의하며 `/model`에 대한 allowlist 역할도 합니다.
    - 모델 참조는 `provider/model` 형식을 사용합니다(예: `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx`는 대화 기록/도구 이미지 축소 크기 조정을 제어합니다(기본값 `1200`). 값을 낮추면 스크린샷이 많은 실행에서 일반적으로 비전 토큰 사용량이 줄어듭니다.
    - 채팅에서 모델을 전환하려면 [Models CLI](/ko/concepts/models)를, 인증 회전 및 대체 동작은 [Model Failover](/ko/concepts/model-failover)를 참조하세요.
    - 커스텀/self-hosted provider는 참조 문서의 [Custom providers](/ko/gateway/configuration-reference#custom-providers-and-base-urls)를 확인하세요.

  </Accordion>

  <Accordion title="누가 봇에 메시지를 보낼 수 있는지 제어">
    DM 액세스는 채널별로 `dmPolicy`를 통해 제어됩니다.

    - `"pairing"` (기본값): 알 수 없는 발신자는 승인을 위한 일회용 페어링 코드를 받습니다
    - `"allowlist"`: `allowFrom`(또는 페어링된 허용 저장소)에 있는 발신자만 허용
    - `"open"`: 모든 수신 DM 허용(`allowFrom: ["*"]` 필요)
    - `"disabled"`: 모든 DM 무시

    그룹의 경우 `groupPolicy` + `groupAllowFrom` 또는 채널별 allowlist를 사용하세요.

    채널별 자세한 내용은 [전체 참조](/ko/gateway/configuration-reference#dm-and-group-access)를 확인하세요.

  </Accordion>

  <Accordion title="그룹 채팅 멘션 게이팅 설정">
    그룹 메시지는 기본적으로 **멘션 필요**입니다. 에이전트별 패턴을 구성하세요.

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
    - 채널별 재정의 및 self-chat 모드는 [전체 참조](/ko/gateway/configuration-reference#group-chat-mention-gating)를 확인하세요.

  </Accordion>

  <Accordion title="에이전트별 Skills 제한">
    공통 기준선에는 `agents.defaults.skills`를 사용하고, 특정
    에이전트는 `agents.list[].skills`로 재정의하세요.

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

    - 기본적으로 제한 없는 Skills를 원하면 `agents.defaults.skills`를 생략하세요.
    - 기본값을 상속하려면 `agents.list[].skills`를 생략하세요.
    - Skills가 없게 하려면 `agents.list[].skills: []`로 설정하세요.
    - [Skills](/ko/tools/skills), [Skills config](/ko/tools/skills-config), 그리고
      [Configuration Reference](/ko/gateway/configuration-reference#agents-defaults-skills)를 참조하세요.

  </Accordion>

  <Accordion title="gateway 채널 상태 모니터링 조정">
    gateway가 오래된 것으로 보이는 채널을 얼마나 적극적으로 재시작할지 제어합니다.

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
    - 전역 모니터를 끄지 않고 특정 채널 또는 계정에 대한 자동 재시작만 끄려면 `channels.<provider>.healthMonitor.enabled` 또는 `channels.<provider>.accounts.<id>.healthMonitor.enabled`를 사용하세요.
    - 운영 디버깅은 [Health Checks](/ko/gateway/health)를, 모든 필드는 [전체 참조](/ko/gateway/configuration-reference#gateway)를 확인하세요.

  </Accordion>

  <Accordion title="세션 및 초기화 구성">
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

    - `dmScope`: `main` (공유) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: 스레드 바인딩 세션 라우팅을 위한 전역 기본값(Discord는 `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`를 지원)
    - 범위 지정, ID 링크, 전송 정책은 [Session Management](/ko/concepts/session)를 참조하세요.
    - 모든 필드는 [전체 참조](/ko/gateway/configuration-reference#session)를 확인하세요.

  </Accordion>

  <Accordion title="샌드박싱 활성화">
    격리된 Docker 컨테이너에서 에이전트 세션을 실행합니다.

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

    전체 가이드는 [Sandboxing](/ko/gateway/sandboxing), 모든 옵션은 [전체 참조](/ko/gateway/configuration-reference#agentsdefaultssandbox)를 확인하세요.

  </Accordion>

  <Accordion title="공식 iOS 빌드를 위한 relay 기반 push 활성화">
    relay 기반 push는 `openclaw.json`에서 구성합니다.

    gateway 구성에서 다음을 설정하세요.

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

    CLI 대응 명령:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    이것이 수행하는 작업:

    - gateway가 외부 relay를 통해 `push.test`, wake nudges, 재연결 wake를 보낼 수 있게 합니다.
- 페어링된 iOS 앱이 전달한 registration 범위 send grant를 사용합니다. gateway에는 배포 전체 범위 relay 토큰이 필요하지 않습니다.
- 각 relay 기반 registration은 iOS 앱이 페어링한 gateway ID에 바인딩되므로, 다른 gateway가 저장된 registration을 재사용할 수 없습니다.
- 로컬/수동 iOS 빌드는 direct APNs를 계속 사용합니다. relay 기반 전송은 relay를 통해 등록한 공식 배포 빌드에만 적용됩니다.
- registration 및 전송 트래픽이 동일한 relay 배포에 도달하도록, 공식/TestFlight iOS 빌드에 내장된 relay base URL과 일치해야 합니다.

엔드투엔드 흐름:

1. 동일한 relay base URL로 컴파일된 공식/TestFlight iOS 빌드를 설치합니다.
2. gateway에서 `gateway.push.apns.relay.baseUrl`을 구성합니다.
3. iOS 앱을 gateway와 페어링하고 node 세션과 operator 세션이 모두 연결되도록 합니다.
4. iOS 앱이 gateway ID를 가져오고, App Attest와 앱 영수증을 사용해 relay에 등록한 뒤, relay 기반 `push.apns.register` payload를 페어링된 gateway에 게시합니다.
5. gateway가 relay handle과 send grant를 저장한 다음, 이를 `push.test`, wake nudges, 재연결 wake에 사용합니다.

운영 참고 사항:

- iOS 앱을 다른 gateway로 전환하면, 해당 gateway에 바인딩된 새 relay registration을 게시할 수 있도록 앱을 다시 연결하세요.
- 다른 relay 배포를 가리키는 새 iOS 빌드를 배포하면, 앱은 이전 relay origin을 재사용하는 대신 캐시된 relay registration을 새로 고칩니다.

호환성 참고 사항:

- `OPENCLAW_APNS_RELAY_BASE_URL` 및 `OPENCLAW_APNS_RELAY_TIMEOUT_MS`는 임시 env 재정의로 여전히 작동합니다.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`는 여전히 loopback 전용 개발용 예외 수단입니다. HTTP relay URL을 config에 영구 저장하지 마세요.

엔드투엔드 흐름은 [iOS App](/ko/platforms/ios#relay-backed-push-for-official-builds), relay 보안 모델은 [Authentication and trust flow](/ko/platforms/ios#authentication-and-trust-flow)를 참조하세요.

  </Accordion>

  <Accordion title="heartbeat 설정하기 (주기적 체크인)">
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

    - `every`: 기간 문자열(`30m`, `2h`). 비활성화하려면 `0m`으로 설정하세요.
    - `target`: `last` | `none` | `<channel-id>` (예: `discord`, `matrix`, `telegram`, `whatsapp`)
    - `directPolicy`: DM 스타일 heartbeat 대상에 대해 `allow`(기본값) 또는 `block`
    - 전체 가이드는 [Heartbeat](/ko/gateway/heartbeat)를 참조하세요.

  </Accordion>

  <Accordion title="cron 작업 구성">
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

    - `sessionRetention`: 완료된 격리 실행 세션을 `sessions.json`에서 정리합니다(기본값 `24h`; 비활성화하려면 `false`로 설정).
    - `runLog`: `cron/runs/<jobId>.jsonl`을 크기와 보존 라인 수 기준으로 정리합니다.
    - 기능 개요와 CLI 예시는 [Cron jobs](/ko/automation/cron-jobs)를 참조하세요.

  </Accordion>

  <Accordion title="웹훅(hooks) 설정">
    Gateway에서 HTTP 웹훅 엔드포인트를 활성화합니다.

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
    - 모든 hook/webhook payload 내용은 신뢰할 수 없는 입력으로 취급하세요.
    - 전용 `hooks.token`을 사용하세요. 공유 Gateway 토큰을 재사용하지 마세요.
    - hook 인증은 헤더 전용입니다(`Authorization: Bearer ...` 또는 `x-openclaw-token`). 쿼리 문자열 토큰은 거부됩니다.
    - `hooks.path`는 `/`일 수 없습니다. 웹훅 ingress는 `/hooks`와 같은 전용 하위 경로에 두세요.
    - 엄격하게 제한된 디버깅을 하지 않는 한, 안전하지 않은 콘텐츠 우회 플래그(`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`)는 비활성화 상태로 유지하세요.
    - `hooks.allowRequestSessionKey`를 활성화하는 경우, 호출자가 선택하는 세션 키를 제한하기 위해 `hooks.allowedSessionKeyPrefixes`도 설정하세요.
    - hook 기반 에이전트의 경우, 강력한 최신 모델 티어와 엄격한 도구 정책(예: 가능하다면 메시징 전용 + 샌드박싱)을 사용하는 것이 좋습니다.

    모든 매핑 옵션과 Gmail 통합은 [전체 참조](/ko/gateway/configuration-reference#hooks)를 참조하세요.

  </Accordion>

  <Accordion title="다중 에이전트 라우팅 구성">
    별도의 workspace와 세션으로 여러 개의 격리된 에이전트를 실행합니다.

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

    바인딩 규칙과 에이전트별 액세스 프로필은 [Multi-Agent](/ko/concepts/multi-agent) 및 [전체 참조](/ko/gateway/configuration-reference#multi-agent-routing)를 참조하세요.

  </Accordion>

  <Accordion title="구성을 여러 파일로 분할하기 ($include)">
    `$include`를 사용해 큰 구성을 정리하세요.

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
    - **파일 배열**: 순서대로 deep merge됩니다(나중 것이 우선)
    - **형제 키**: include 후 병합됩니다(포함된 값 재정의)
    - **중첩 include**: 최대 10단계 깊이까지 지원
    - **상대 경로**: 포함하는 파일 기준으로 해석
    - **오류 처리**: 누락된 파일, 파싱 오류, 순환 include에 대해 명확한 오류 제공

  </Accordion>
</AccordionGroup>

## 구성 핫 리로드

Gateway는 `~/.openclaw/openclaw.json`을 감시하고 변경 사항을 자동으로 적용합니다 — 대부분의 설정에는 수동 재시작이 필요하지 않습니다.

### 리로드 모드

| 모드                   | 동작                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------- |
| **`hybrid`** (기본값)  | 안전한 변경은 즉시 핫 적용합니다. 중요한 변경은 자동으로 재시작합니다.              |
| **`hot`**              | 안전한 변경만 핫 적용합니다. 재시작이 필요하면 경고를 기록하며, 처리는 사용자가 합니다. |
| **`restart`**          | 안전하든 아니든 모든 구성 변경 시 Gateway를 재시작합니다.                           |
| **`off`**              | 파일 감시를 비활성화합니다. 변경 사항은 다음 수동 재시작 시 적용됩니다.             |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### 핫 적용되는 항목과 재시작이 필요한 항목

대부분의 필드는 다운타임 없이 핫 적용됩니다. `hybrid` 모드에서는 재시작이 필요한 변경도 자동으로 처리됩니다.

| 범주                | 필드                                                                 | 재시작 필요? |
| ------------------- | -------------------------------------------------------------------- | ------------ |
| 채널                | `channels.*`, `web` (WhatsApp) — 모든 내장 및 확장 채널              | 아니요       |
| 에이전트 및 모델    | `agent`, `agents`, `models`, `routing`                               | 아니요       |
| 자동화              | `hooks`, `cron`, `agent.heartbeat`                                   | 아니요       |
| 세션 및 메시지      | `session`, `messages`                                                | 아니요       |
| 도구 및 미디어      | `tools`, `browser`, `skills`, `audio`, `talk`                        | 아니요       |
| UI 및 기타          | `ui`, `logging`, `identity`, `bindings`                              | 아니요       |
| Gateway 서버        | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **예**       |
| 인프라              | `discovery`, `canvasHost`, `plugins`                                 | **예**       |

<Note>
`gateway.reload`와 `gateway.remote`는 예외입니다 — 이를 변경해도 **재시작이 트리거되지 않습니다**.
</Note>

## 구성 RPC (프로그래밍 방식 업데이트)

<Note>
control-plane 쓰기 RPC(`config.apply`, `config.patch`, `update.run`)는 `deviceId+clientIp`당 **60초에 3회 요청**으로 속도 제한됩니다. 제한되면 RPC는 `retryAfterMs`와 함께 `UNAVAILABLE`을 반환합니다.
</Note>

안전한/기본 흐름:

- `config.schema.lookup`: 얕은 스키마 노드, 일치한 힌트 메타데이터, 즉시 하위 요약과 함께 하나의 경로 범위 구성 하위 트리를 검사
- `config.get`: 현재 스냅샷 + 해시 가져오기
- `config.patch`: 권장되는 부분 업데이트 경로
- `config.apply`: 전체 구성 교체 전용
- `update.run`: 명시적 자체 업데이트 + 재시작

전체 구성을 교체하는 것이 아니라면 `config.schema.lookup`
다음 `config.patch`를 사용하는 것이 좋습니다.

<AccordionGroup>
  <Accordion title="config.apply (전체 교체)">
    전체 구성을 검증하고 기록한 뒤 한 번에 Gateway를 재시작합니다.

    <Warning>
    `config.apply`는 **전체 구성**을 교체합니다. 부분 업데이트에는 `config.patch`를, 단일 키에는 `openclaw config set`을 사용하세요.
    </Warning>

    매개변수:

    - `raw` (string) — 전체 구성에 대한 JSON5 payload
    - `baseHash` (optional) — `config.get`의 구성 해시(구성이 이미 있으면 필수)
    - `sessionKey` (optional) — 재시작 후 wake-up ping을 위한 세션 키
    - `note` (optional) — restart sentinel용 메모
    - `restartDelayMs` (optional) — 재시작 전 지연 시간(기본값 2000)

    재시작 요청은 이미 대기 중/진행 중인 요청이 있는 동안 병합되며, 재시작 사이클 간에는 30초 쿨다운이 적용됩니다.

    ```bash
    openclaw gateway call config.get --params '{}'  # payload.hash 캡처
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (부분 업데이트)">
    부분 업데이트를 기존 구성에 병합합니다(JSON merge patch 의미론):

    - 객체는 재귀적으로 병합
    - `null`은 키를 삭제
    - 배열은 교체

    매개변수:

    - `raw` (string) — 변경할 키만 포함한 JSON5
    - `baseHash` (required) — `config.get`의 구성 해시
    - `sessionKey`, `note`, `restartDelayMs` — `config.apply`와 동일

    재시작 동작은 `config.apply`와 동일합니다: 대기 중인 재시작 병합 + 재시작 사이클 간 30초 쿨다운.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## 환경 변수

OpenClaw는 부모 프로세스의 env vars와 다음 위치를 함께 읽습니다.

- 현재 작업 디렉터리의 `.env` (존재하는 경우)
- `~/.openclaw/.env` (전역 fallback)

어느 파일도 기존 env vars를 덮어쓰지 않습니다. config에 인라인 env vars를 설정할 수도 있습니다.

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="셸 env 가져오기 (선택 사항)">
  활성화되어 있고 예상 키가 설정되지 않은 경우, OpenClaw는 로그인 셸을 실행하고 누락된 키만 가져옵니다.

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

환경 변수 대응 항목: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="구성 값에서 env var 치환">
  `${VAR_NAME}`를 사용해 모든 구성 문자열 값에서 env vars를 참조할 수 있습니다.

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

규칙:

- 대문자 이름만 일치: `[A-Z_][A-Z0-9_]*`
- 누락되었거나 비어 있는 vars는 로드 시 오류를 발생시킵니다
- 리터럴 출력은 `$${VAR}`로 이스케이프하세요
- `$include` 파일 내부에서도 작동합니다
- 인라인 치환: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
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

SecretRef 자세한 내용(`env`/`file`/`exec`용 `secrets.providers` 포함)은 [Secrets Management](/ko/gateway/secrets)를 참조하세요.
지원되는 자격 증명 경로는 [SecretRef Credential Surface](/ko/reference/secretref-credential-surface)에 나와 있습니다.
</Accordion>

전체 우선순위와 소스는 [Environment](/ko/help/environment)를 참조하세요.

## 전체 참조

필드별 전체 참조는 **[Configuration Reference](/ko/gateway/configuration-reference)**를 참조하세요.

---

_관련 항목: [Configuration Examples](/ko/gateway/configuration-examples) · [Configuration Reference](/ko/gateway/configuration-reference) · [Doctor](/ko/gateway/doctor)_
