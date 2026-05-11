---
read_when:
    - 백그라운드 작업 또는 깨우기 예약
    - 외부 트리거(Webhook, Gmail)를 OpenClaw에 연결하기
    - 예약된 작업에 Heartbeat와 Cron 중 선택하기
sidebarTitle: Scheduled tasks
summary: Gateway 스케줄러를 위한 예약 작업, Webhook 및 Gmail PubSub 트리거
title: 예약된 작업
x-i18n:
    generated_at: "2026-05-11T20:20:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56af55d8151b22dedb5ad02c2eb5e706711e1435c806dbc2e2ef71b13ebde3b9
    source_path: automation/cron-jobs.md
    workflow: 16
---

Cron은 Gateway의 내장 스케줄러입니다. 작업을 유지하고, 적절한 시간에 에이전트를 깨우며, 출력을 채팅 채널이나 webhook 엔드포인트로 다시 전달할 수 있습니다.

## 빠른 시작

<Steps>
  <Step title="일회성 알림 추가">
    ```bash
    openclaw cron add \
      --name "Reminder" \
      --at "2026-02-01T16:00:00Z" \
      --session main \
      --system-event "Reminder: check the cron docs draft" \
      --wake now \
      --delete-after-run
    ```
  </Step>
  <Step title="작업 확인">
    ```bash
    openclaw cron list
    openclaw cron get <job-id>
    openclaw cron show <job-id>
    ```
  </Step>
  <Step title="실행 기록 보기">
    ```bash
    openclaw cron runs --id <job-id>
    ```
  </Step>
</Steps>

## cron 작동 방식

- Cron은 **Gateway 내부** 프로세스에서 실행됩니다(모델 내부가 아님).
- 작업 정의는 `~/.openclaw/cron/jobs.json`에 유지되므로 다시 시작해도 일정이 손실되지 않습니다.
- 런타임 실행 상태는 옆의 `~/.openclaw/cron/jobs-state.json`에 유지됩니다. cron 정의를 git에서 추적하는 경우 `jobs.json`을 추적하고 `jobs-state.json`은 gitignore에 추가하세요.
- 분리 후에는 이전 OpenClaw 버전이 `jobs.json`을 읽을 수 있지만, 런타임 필드가 이제 `jobs-state.json`에 있으므로 작업을 새 작업처럼 처리할 수 있습니다.
- Gateway가 실행 중이거나 중지된 상태에서 `jobs.json`이 편집되면, OpenClaw는 변경된 일정 필드를 보류 중인 런타임 슬롯 메타데이터와 비교하고 오래된 `nextRunAtMs` 값을 지웁니다. 순수한 서식 변경이나 키 순서만 바뀐 재작성은 보류 중인 슬롯을 보존합니다.
- 모든 cron 실행은 [백그라운드 작업](/ko/automation/tasks) 레코드를 생성합니다.
- Gateway 시작 시, 기한이 지난 격리된 에이전트 턴 작업은 즉시 재생되는 대신 채널 연결 시간대 밖으로 다시 예약되므로, 다시 시작한 후에도 Discord/Telegram 시작과 네이티브 명령 설정이 계속 응답성을 유지합니다.
- 일회성 작업(`--at`)은 기본적으로 성공 후 자동 삭제됩니다.
- 격리된 cron 실행은 실행이 완료되면 `cron:<jobId>` 세션에 대해 추적된 브라우저 탭/프로세스를 최선의 방식으로 닫으므로, 분리된 브라우저 자동화가 고아 프로세스를 남기지 않습니다.
- 좁은 범위의 cron 자체 정리 권한을 받은 격리된 cron 실행은 여전히 스케줄러 상태, 현재 작업의 자체 필터링된 목록, 해당 작업의 실행 기록을 읽을 수 있으므로, 상태/Heartbeat 검사가 더 넓은 cron 변경 접근 권한을 얻지 않고도 자체 일정을 검사할 수 있습니다.
- 격리된 cron 실행은 오래된 확인 응답도 방지합니다. 첫 번째 결과가 단순한 임시 상태 업데이트(`on it`, `pulling everything together` 및 유사한 힌트)이고 최종 답변을 담당하는 하위 서브에이전트 실행이 더 이상 없으면, OpenClaw는 전달 전에 실제 결과를 한 번 다시 요청합니다.
- 격리된 cron 실행은 내장 실행에서 구조화된 실행 거부 메타데이터를 우선 사용한 다음, `SYSTEM_RUN_DENIED` 및 `INVALID_REQUEST` 같은 알려진 최종 요약/출력 마커로 대체하므로, 차단된 명령이 정상 실행으로 보고되지 않습니다.
- 격리된 cron 실행은 응답 페이로드가 생성되지 않은 경우에도 실행 수준 에이전트 실패를 작업 오류로 처리하므로, 모델/제공자 실패는 작업을 성공으로 정리하는 대신 오류 카운터를 증가시키고 실패 알림을 트리거합니다.
- 격리된 에이전트 턴 작업이 `timeoutSeconds`에 도달하면, cron은 기본 에이전트 실행을 중단하고 짧은 정리 시간을 제공합니다. 실행이 비워지지 않으면, cron이 타임아웃을 기록하기 전에 Gateway 소유 정리가 해당 실행의 세션 소유권을 강제로 해제하므로, 대기 중인 채팅 작업이 오래된 처리 세션 뒤에 남지 않습니다.
- 격리된 에이전트 턴이 러너 시작 전이나 첫 모델 호출 전에 멈추면, cron은 `setup timed out before runner start` 또는 `stalled before first model call (last phase: context-engine)` 같은 단계별 타임아웃을 기록합니다. 이러한 감시기는 외부 CLI 프로세스가 실제로 시작되기 전에 내장 제공자와 CLI 기반 제공자를 포괄하며, 긴 `timeoutSeconds` 값과 독립적으로 제한되므로 콜드 스타트/인증/컨텍스트 실패가 전체 작업 예산을 기다리지 않고 빠르게 드러납니다.

<a id="maintenance"></a>

<Note>
cron의 작업 조정은 먼저 런타임 소유이고, 그다음으로 지속 기록 기반입니다. 활성 cron 작업은 이전 자식 세션 행이 여전히 존재하더라도 cron 런타임이 해당 작업을 실행 중으로 추적하는 동안 계속 활성 상태로 유지됩니다. 런타임이 작업 소유를 중지하고 5분 유예 시간이 만료되면, 유지 관리 검사는 일치하는 `cron:<jobId>:<startedAt>` 실행에 대해 유지된 실행 로그와 작업 상태를 확인합니다. 해당 지속 기록이 종료 결과를 보여주면 작업 원장이 그 결과로 최종 처리되고, 그렇지 않으면 Gateway 소유 유지 관리가 작업을 `lost`로 표시할 수 있습니다. 오프라인 CLI 감사는 지속 기록에서 복구할 수 있지만, 자체적인 빈 인프로세스 활성 작업 집합을 Gateway 소유 cron 실행이 사라졌다는 증거로 간주하지 않습니다.
</Note>

## 일정 유형

| 종류    | CLI 플래그 | 설명                                                    |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | 일회성 타임스탬프(ISO 8601 또는 `20m` 같은 상대 시간)   |
| `every` | `--every` | 고정 간격                                               |
| `cron`  | `--cron`  | 선택적 `--tz`가 있는 5필드 또는 6필드 cron 표현식       |

시간대가 없는 타임스탬프는 UTC로 처리됩니다. 로컬 벽시계 기준 예약에는 `--tz America/New_York`를 추가하세요.

매시 정각 반복 표현식은 부하 급증을 줄이기 위해 자동으로 최대 5분까지 분산됩니다. 정확한 시간을 강제하려면 `--exact`를 사용하고, 명시적 시간 범위에는 `--stagger 30s`를 사용하세요.

### 월 중 날짜와 요일은 OR 논리를 사용합니다

Cron 표현식은 [croner](https://github.com/Hexagon/croner)로 파싱됩니다. 월 중 날짜 필드와 요일 필드가 모두 와일드카드가 아닐 때, croner는 두 필드가 모두 일치할 때가 아니라 **둘 중 하나**가 일치할 때 매칭합니다. 이는 표준 Vixie cron 동작입니다.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

이는 월 0~1회가 아니라 약 5~6회 실행됩니다. OpenClaw는 여기서 Croner의 기본 OR 동작을 사용합니다. 두 조건을 모두 요구하려면 Croner의 `+` 요일 수정자(`0 9 15 * +1`)를 사용하거나, 한 필드에 일정을 걸고 다른 조건은 작업의 프롬프트나 명령에서 검사하세요.

## 실행 스타일

| 스타일        | `--session` 값     | 실행 위치                | 적합한 용도                    |
| ------------- | ------------------ | ------------------------ | ------------------------------ |
| 메인 세션     | `main`             | 다음 Heartbeat 턴        | 알림, 시스템 이벤트            |
| 격리됨        | `isolated`         | 전용 `cron:<jobId>`      | 보고서, 백그라운드 잡무        |
| 현재 세션     | `current`          | 생성 시점에 바인딩       | 컨텍스트 인식 반복 작업        |
| 사용자 세션   | `session:custom-id` | 영구 이름 지정 세션     | 기록을 기반으로 쌓아 가는 워크플로 |

<AccordionGroup>
  <Accordion title="메인 세션 vs 격리됨 vs 사용자 지정">
    **메인 세션** 작업은 시스템 이벤트를 대기열에 넣고 선택적으로 Heartbeat를 깨웁니다(`--wake now` 또는 `--wake next-heartbeat`). 이러한 시스템 이벤트는 대상 세션의 일일/유휴 재설정 최신성을 연장하지 않습니다. **격리된** 작업은 새 세션으로 전용 에이전트 턴을 실행합니다. **사용자 지정 세션**(`session:xxx`)은 실행 간 컨텍스트를 유지하므로, 이전 요약을 기반으로 하는 일일 스탠드업 같은 워크플로를 가능하게 합니다.
  </Accordion>
  <Accordion title="격리된 작업에서 '새 세션'의 의미">
    격리된 작업에서 "새 세션"은 각 실행마다 새 transcript/session id를 의미합니다. OpenClaw는 사고/빠름/상세 설정, 레이블, 명시적인 사용자 선택 모델/인증 재정의 같은 안전한 선호 설정을 가져올 수 있지만, 이전 cron 행의 주변 대화 컨텍스트는 상속하지 않습니다. 채널/그룹 라우팅, 전송 또는 대기열 정책, 승격, 원점, ACP 런타임 바인딩은 상속되지 않습니다. 반복 작업이 의도적으로 동일한 대화 컨텍스트를 기반으로 해야 할 때는 `current` 또는 `session:<id>`를 사용하세요.
  </Accordion>
  <Accordion title="런타임 정리">
    격리된 작업의 경우 이제 런타임 해제에 해당 cron 세션의 최선의 브라우저 정리가 포함됩니다. 정리 실패는 무시되므로 실제 cron 결과가 계속 우선합니다.

    격리된 cron 실행은 공유 런타임 정리 경로를 통해 작업을 위해 생성된 번들 MCP 런타임 인스턴스도 모두 폐기합니다. 이는 메인 세션 및 사용자 지정 세션 MCP 클라이언트가 해제되는 방식과 일치하므로, 격리된 cron 작업이 실행 간 stdio 자식 프로세스나 장기 유지 MCP 연결을 누출하지 않습니다.

  </Accordion>
  <Accordion title="서브에이전트 및 Discord 전달">
    격리된 cron 실행이 서브에이전트를 조율할 때, 전달은 오래된 상위 임시 텍스트보다 최종 하위 출력을 우선합니다. 하위 실행이 아직 실행 중이면, OpenClaw는 해당 부분 상위 업데이트를 알리는 대신 억제합니다.

    텍스트 전용 Discord 알림 대상의 경우, OpenClaw는 스트리밍/중간 텍스트 페이로드와 최종 답변을 모두 재생하는 대신 표준 최종 어시스턴트 텍스트를 한 번 전송합니다. 미디어 및 구조화된 Discord 페이로드는 첨부 파일과 컴포넌트가 누락되지 않도록 여전히 별도 페이로드로 전달됩니다.

  </Accordion>
</AccordionGroup>

### 격리된 작업의 페이로드 옵션

<ParamField path="--message" type="string" required>
  프롬프트 텍스트(격리된 작업에 필수).
</ParamField>
<ParamField path="--model" type="string">
  모델 재정의. 작업에 대해 선택된 허용 모델을 사용합니다.
</ParamField>
<ParamField path="--thinking" type="string">
  사고 수준 재정의.
</ParamField>
<ParamField path="--light-context" type="boolean">
  워크스페이스 부트스트랩 파일 주입을 건너뜁니다.
</ParamField>
<ParamField path="--tools" type="string">
  작업이 사용할 수 있는 도구를 제한합니다. 예: `--tools exec,read`.
</ParamField>

`--model`은 선택된 허용 모델을 해당 작업의 기본 모델로 사용합니다. 이는 채팅 세션 `/model` 재정의와 같지 않습니다. 작업 기본 모델이 실패해도 구성된 대체 체인은 계속 적용됩니다. 요청된 모델이 허용되지 않았거나 확인할 수 없으면, cron은 작업의 에이전트/기본 모델 선택으로 조용히 대체하는 대신 명시적 유효성 검사 오류로 실행을 실패 처리합니다.

Cron 작업은 페이로드 수준 `fallbacks`도 포함할 수 있습니다. 해당 목록이 있으면 작업에 대해 구성된 대체 체인을 대체합니다. 선택된 모델만 시도하는 엄격한 cron 실행을 원할 때는 작업 페이로드/API에서 `fallbacks: []`를 사용하세요. 작업에 `--model`이 있지만 페이로드 또는 구성된 대체 항목이 없으면, OpenClaw는 명시적인 빈 대체 재정의를 전달하여 에이전트 기본 모델이 숨겨진 추가 재시도 대상으로 추가되지 않도록 합니다.

격리된 작업의 모델 선택 우선순위는 다음과 같습니다.

1. Gmail 후크 모델 재정의(실행이 Gmail에서 왔고 해당 재정의가 허용된 경우)
2. 작업별 페이로드 `model`
3. 사용자가 선택하여 저장한 cron 세션 모델 재정의
4. 에이전트/기본 모델 선택

빠른 모드도 확인된 라이브 선택을 따릅니다. 선택된 모델 구성에 `params.fastMode`가 있으면 격리된 cron은 기본적으로 이를 사용합니다. 저장된 세션 `fastMode` 재정의는 어느 방향이든 구성보다 계속 우선합니다.

격리된 실행이 라이브 모델 전환 인계를 만나면, cron은 전환된 제공자/모델로 다시 시도하고 재시도 전에 활성 실행에 대해 해당 라이브 선택을 유지합니다. 전환에 새 인증 프로필도 포함되어 있으면, cron은 활성 실행에 대한 인증 프로필 재정의도 유지합니다. 재시도는 제한됩니다. 최초 시도에 더해 전환 재시도 2회 후에는 cron이 무한 루프를 도는 대신 중단합니다.

Before an isolated Cron run enters the agent runner, OpenClaw checks reachable local provider endpoints for configured `api: "ollama"` and `api: "openai-completions"` providers whose `baseUrl` is loopback, private-network, or `.local`. If that endpoint is down, the run is recorded as `skipped` with a clear provider/model error instead of starting a model call. The endpoint result is cached for 5 minutes, so many due jobs using the same dead local Ollama, vLLM, SGLang, or LM Studio server share one small probe instead of creating a request storm. Skipped provider-preflight runs do not increment execution-error backoff; enable `failureAlert.includeSkipped` when you want repeated skip notifications.

## Delivery and output

| Mode       | What happens                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Fallback-deliver final text to the target if the agent did not send |
| `webhook`  | POST finished event payload to a URL                                |
| `none`     | No runner fallback delivery                                         |

Use `--announce --channel telegram --to "-1001234567890"` for channel delivery. For Telegram forum topics, use `-1001234567890:topic:123`; direct RPC/config callers may also pass `delivery.threadId` as a string or number. Slack/Discord/Mattermost targets should use explicit prefixes (`channel:<id>`, `user:<id>`). Matrix room IDs are case-sensitive; use the exact room ID or `room:!room:server` form from Matrix.

When announce delivery uses `channel: "last"` or omits `channel`, a provider-prefixed target such as `telegram:123` can select the channel before Cron falls back to session history or a single configured channel. Only prefixes advertised by the loaded Plugin are provider selectors. If `delivery.channel` is explicit, the target prefix must name the same provider; for example, `channel: "whatsapp"` with `to: "telegram:123"` is rejected instead of letting WhatsApp interpret the Telegram ID as a phone number. Target-kind and service prefixes such as `channel:<id>`, `user:<id>`, `imessage:<handle>`, and `sms:<number>` remain channel-owned target syntax, not provider selectors.

For isolated jobs, chat delivery is shared. If a chat route is available, the agent can use the `message` tool even when the job uses `--no-deliver`. If the agent sends to the configured/current target, OpenClaw skips the fallback announce. Otherwise `announce`, `webhook`, and `none` only control what the runner does with the final reply after the agent turn.

When an agent creates an isolated reminder from an active chat, OpenClaw stores the preserved live delivery target for the fallback announce route. Internal session keys may be lowercase; provider delivery targets are not reconstructed from those keys when current chat context is available.

Implicit announce delivery uses configured channel allowlists to validate and reroute stale targets. DM pairing-store approvals are not fallback automation recipients; set `delivery.to` or configure the channel `allowFrom` entry when a scheduled job should proactively send to a DM.

Failure notifications follow a separate destination path:

- `cron.failureDestination` sets a global default for failure notifications.
- `job.delivery.failureDestination` overrides that per job.
- If neither is set and the job already delivers via `announce`, failure notifications now fall back to that primary announce target.
- `delivery.failureDestination` is only supported on `sessionTarget="isolated"` jobs unless the primary delivery mode is `webhook`.
- `failureAlert.includeSkipped: true` opts a job or global Cron alert policy into repeated skipped-run alerts. Skipped runs keep a separate consecutive skip counter, so they do not affect execution-error backoff.

## CLI examples

<Tabs>
  <Tab title="One-shot reminder">
    ```bash
    openclaw cron add \
      --name "Calendar check" \
      --at "20m" \
      --session main \
      --system-event "Next heartbeat: check calendar." \
      --wake now
    ```
  </Tab>
  <Tab title="Recurring isolated job">
    ```bash
    openclaw cron add \
      --name "Morning brief" \
      --cron "0 7 * * *" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Summarize overnight updates." \
      --announce \
      --channel slack \
      --to "channel:C1234567890"
    ```
  </Tab>
  <Tab title="Model and thinking override">
    ```bash
    openclaw cron add \
      --name "Deep analysis" \
      --cron "0 6 * * 1" \
      --tz "America/Los_Angeles" \
      --session isolated \
      --message "Weekly deep analysis of project progress." \
      --model "opus" \
      --thinking high \
      --announce
    ```
  </Tab>
</Tabs>

## Webhooks

Gateway can expose HTTP Webhook endpoints for external triggers. Enable in config:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Authentication

Every request must include the hook token via header:

- `Authorization: Bearer <token>` (recommended)
- `x-openclaw-token: <token>`

Query-string tokens are rejected.

<AccordionGroup>
  <Accordion title="POST /hooks/wake">
    Enqueue a system event for the main session:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/wake \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"text":"New email received","mode":"now"}'
    ```

    <ParamField path="text" type="string" required>
      Event description.
    </ParamField>
    <ParamField path="mode" type="string" default="now">
      `now` or `next-heartbeat`.
    </ParamField>

  </Accordion>
  <Accordion title="POST /hooks/agent">
    Run an isolated agent turn:

    ```bash
    curl -X POST http://127.0.0.1:18789/hooks/agent \
      -H 'Authorization: Bearer SECRET' \
      -H 'Content-Type: application/json' \
      -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4"}'
    ```

    Fields: `message` (required), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `fallbacks`, `thinking`, `timeoutSeconds`.

  </Accordion>
  <Accordion title="Mapped hooks (POST /hooks/<name>)">
    Custom hook names are resolved via `hooks.mappings` in config. Mappings can transform arbitrary payloads into `wake` or `agent` actions with templates or code transforms.
  </Accordion>
</AccordionGroup>

<Warning>
Keep hook endpoints behind loopback, tailnet, or trusted reverse proxy.

- Use a dedicated hook token; do not reuse Gateway auth tokens.
- Keep `hooks.path` on a dedicated subpath; `/` is rejected.
- Set `hooks.allowedAgentIds` to limit explicit `agentId` routing.
- Keep `hooks.allowRequestSessionKey=false` unless you require caller-selected sessions.
- If you enable `hooks.allowRequestSessionKey`, also set `hooks.allowedSessionKeyPrefixes` to constrain allowed session key shapes.
- Hook payloads are wrapped with safety boundaries by default.

</Warning>

## Gmail PubSub integration

Wire Gmail inbox triggers to OpenClaw via Google PubSub.

<Note>
**Prerequisites:** `gcloud` CLI, `gog` (gogcli), OpenClaw hooks enabled, Tailscale for the public HTTPS endpoint.
</Note>

### Wizard setup (recommended)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

This writes `hooks.gmail` config, enables the Gmail preset, and uses Tailscale Funnel for the push endpoint.

### Gateway auto-start

When `hooks.enabled=true` and `hooks.gmail.account` is set, the Gateway starts `gog gmail watch serve` on boot and auto-renews the watch. Set `OPENCLAW_SKIP_GMAIL_WATCHER=1` to opt out.

### Manual one-time setup

<Steps>
  <Step title="Select the GCP project">
    Select the GCP project that owns the OAuth client used by `gog`:

    ```bash
    gcloud auth login
    gcloud config set project <project-id>
    gcloud services enable gmail.googleapis.com pubsub.googleapis.com
    ```

  </Step>
  <Step title="Create topic and grant Gmail push access">
    ```bash
    gcloud pubsub topics create gog-gmail-watch
    gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
      --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
      --role=roles/pubsub.publisher
    ```
  </Step>
  <Step title="Start the watch">
    ```bash
    gog gmail watch start \
      --account openclaw@gmail.com \
      --label INBOX \
      --topic projects/<project-id>/topics/gog-gmail-watch
    ```
  </Step>
</Steps>

### Gmail model override

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Managing jobs

```bash
# List all jobs
openclaw cron list

# Get one stored job as JSON
openclaw cron get <jobId>

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

<Note>
Model override note:

- `openclaw cron add|edit --model ...` changes the job's selected model.
- If the model is allowed, that exact provider/model reaches the isolated agent run.
- If it is not allowed or cannot be resolved, Cron fails the run with an explicit validation error.
- Configured fallback chains still apply because Cron `--model` is a job primary, not a session `/model` override.
- Payload `fallbacks` replaces configured fallbacks for that job; `fallbacks: []` disables fallback and makes the run strict.
- A plain `--model` with no explicit or configured fallback list does not fall through to the agent primary as a silent extra retry target.

</Note>

## Configuration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

`maxConcurrentRuns` limits both scheduled Cron dispatch and isolated agent-turn execution. Isolated Cron agent turns use the queue's dedicated `cron-nested` execution lane internally, so raising this value lets independent Cron LLM runs progress in parallel instead of only starting their outer Cron wrappers. The shared non-Cron `nested` lane is not widened by this setting.

The runtime state sidecar is derived from `cron.store`: a `.json` store such as `~/clawd/cron/jobs.json` uses `~/clawd/cron/jobs-state.json`, while a store path without a `.json` suffix appends `-state.json`.

If you hand-edit `jobs.json`, leave `jobs-state.json` out of source control. OpenClaw uses that sidecar for pending slots, active markers, last-run metadata, and the schedule identity that tells the scheduler when an externally edited job needs a fresh `nextRunAtMs`.

Disable Cron: `cron.enabled: false` or `OPENCLAW_SKIP_CRON=1`.

<AccordionGroup>
  <Accordion title="Retry behavior">
    **One-shot retry**: transient errors (rate limit, overload, network, server error) retry up to 3 times with exponential backoff. Permanent errors disable immediately.

    **Recurring retry**: exponential backoff (30s to 60m) between retries. Backoff resets after the next successful run.

  </Accordion>
  <Accordion title="유지보수">
    `cron.sessionRetention`(기본값 `24h`)은 격리된 실행 세션 항목을 정리합니다. `cron.runLog.maxBytes` / `cron.runLog.keepLines`는 실행 로그 파일을 자동으로 정리합니다.
  </Accordion>
</AccordionGroup>

## 문제 해결

### 명령 단계

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
openclaw doctor
```

<AccordionGroup>
  <Accordion title="Cron이 실행되지 않음">
    - `cron.enabled`와 `OPENCLAW_SKIP_CRON` 환경 변수를 확인하세요.
    - Gateway가 계속 실행 중인지 확인하세요.
    - `cron` 일정의 경우 시간대(`--tz`)와 호스트 시간대를 확인하세요.
    - 실행 출력의 `reason: not-due`는 수동 실행이 `openclaw cron run <jobId> --due`로 확인되었고 작업의 실행 시점이 아직 되지 않았음을 의미합니다.

  </Accordion>
  <Accordion title="Cron은 실행되었지만 전달되지 않음">
    - 전달 모드 `none`은 실행기 대체 전송이 예상되지 않음을 의미합니다. 채팅 경로를 사용할 수 있으면 에이전트가 `message` 도구로 계속 직접 전송할 수 있습니다.
    - 전달 대상이 없거나 유효하지 않으면(`channel`/`to`) 아웃바운드를 건너뜁니다.
    - Matrix의 경우, 소문자로 변환된 `delivery.to` 방 ID가 있는 복사된 작업이나 레거시 작업은 Matrix 방 ID가 대소문자를 구분하므로 실패할 수 있습니다. 작업을 Matrix의 정확한 `!room:server` 또는 `room:!room:server` 값으로 수정하세요.
    - 채널 인증 오류(`unauthorized`, `Forbidden`)는 자격 증명 때문에 전달이 차단되었음을 의미합니다.
    - 격리된 실행이 무음 토큰(`NO_REPLY` / `no_reply`)만 반환하면 OpenClaw는 직접 아웃바운드 전달을 억제하고 대체 대기열 요약 경로도 억제하므로 채팅에 아무것도 다시 게시되지 않습니다.
    - 에이전트가 사용자에게 직접 메시지를 보내야 하는 경우, 작업에 사용할 수 있는 경로가 있는지 확인하세요(이전 채팅이 있는 `channel: "last"` 또는 명시적인 채널/대상).

  </Accordion>
  <Accordion title="Cron 또는 Heartbeat가 /new 스타일 전환을 막는 것처럼 보임">
    - 일일 및 유휴 초기화 최신성은 `updatedAt`을 기준으로 하지 않습니다. [세션 관리](/ko/concepts/session#session-lifecycle)를 참조하세요.
    - Cron 깨우기, Heartbeat 실행, exec 알림, Gateway 장부 기록은 라우팅/상태를 위해 세션 행을 업데이트할 수 있지만, `sessionStartedAt` 또는 `lastInteractionAt`을 연장하지는 않습니다.
    - 이러한 필드가 생기기 전에 생성된 레거시 행의 경우 파일을 계속 사용할 수 있으면 OpenClaw가 transcript JSONL 세션 헤더에서 `sessionStartedAt`을 복구할 수 있습니다. `lastInteractionAt`이 없는 레거시 유휴 행은 복구된 시작 시간을 유휴 기준으로 사용합니다.

  </Accordion>
  <Accordion title="시간대 관련 주의 사항">
    - `--tz`가 없는 Cron은 Gateway 호스트 시간대를 사용합니다.
    - 시간대가 없는 `at` 일정은 UTC로 처리됩니다.
    - Heartbeat `activeHours`는 구성된 시간대 해석을 사용합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [자동화 및 작업](/ko/automation) — 모든 자동화 메커니즘 한눈에 보기
- [백그라운드 작업](/ko/automation/tasks) — Cron 실행용 작업 원장
- [Heartbeat](/ko/gateway/heartbeat) — 주기적인 메인 세션 턴
- [시간대](/ko/concepts/timezone) — 시간대 구성
