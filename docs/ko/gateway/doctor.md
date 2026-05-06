---
read_when:
    - 진단 마이그레이션 추가 또는 수정
    - 호환성을 깨는 설정 변경 도입
sidebarTitle: Doctor
summary: '진단 명령어: 상태 점검, 설정 마이그레이션 및 복구 단계'
title: 진단
x-i18n:
    generated_at: "2026-05-06T17:55:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e8a1e280717b7a523ba092dec2e2f7d1c13e67a5ede30d0b4bb5a3100dc0e44
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`는 OpenClaw의 복구 + 마이그레이션 도구입니다. 오래된 config/state를 수정하고, 상태를 점검하며, 실행 가능한 복구 단계를 제공합니다.

## 빠른 시작

```bash
openclaw doctor
```

### 헤드리스 및 자동화 모드

<Tabs>
  <Tab title="--yes">
    ```bash
    openclaw doctor --yes
    ```

    프롬프트 없이 기본값을 수락합니다(해당하는 경우 restart/service/sandbox 복구 단계 포함).

  </Tab>
  <Tab title="--repair">
    ```bash
    openclaw doctor --repair
    ```

    프롬프트 없이 권장 복구를 적용합니다(안전한 경우 복구 + 재시작).

  </Tab>
  <Tab title="--repair --force">
    ```bash
    openclaw doctor --repair --force
    ```

    공격적인 복구도 적용합니다(사용자 지정 supervisor config를 덮어씀).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    프롬프트 없이 실행하고 안전한 마이그레이션만 적용합니다(config 정규화 + 디스크 내 state 이동). 사람의 확인이 필요한 restart/service/sandbox 작업은 건너뜁니다. 레거시 state 마이그레이션은 감지되면 자동으로 실행됩니다.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    추가 Gateway 설치(launchd/systemd/schtasks)를 찾기 위해 시스템 서비스를 스캔합니다.

  </Tab>
</Tabs>

쓰기 전에 변경 사항을 검토하려면 먼저 config 파일을 여세요.

```bash
cat ~/.openclaw/openclaw.json
```

## 수행 작업(요약)

<AccordionGroup>
  <Accordion title="상태, UI, 업데이트">
    - git 설치에 대한 선택적 사전 업데이트(대화형 전용).
    - UI 프로토콜 최신성 검사(프로토콜 스키마가 더 최신이면 Control UI를 다시 빌드).
    - 상태 검사 + 재시작 프롬프트.
    - Skills 상태 요약(적격/누락/차단) 및 Plugin 상태.

  </Accordion>
  <Accordion title="Config와 마이그레이션">
    - 레거시 값에 대한 config 정규화.
    - 레거시 평면 `talk.*` 필드에서 `talk.provider` + `talk.providers.<provider>`로 Talk config 마이그레이션.
    - 레거시 Chrome 확장 config 및 Chrome MCP 준비 상태에 대한 브라우저 마이그레이션 검사.
    - OpenCode provider override 경고(`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth shadowing 경고(`models.providers.openai-codex`).
    - OpenAI Codex OAuth 프로필에 대한 OAuth TLS 필수 조건 검사.
    - `plugins.allow`가 제한적이지만 도구 정책이 여전히 와일드카드 또는 Plugin 소유 도구를 요청할 때 Plugin/tool allowlist 경고.
    - 레거시 디스크 내 state 마이그레이션(sessions/agent dir/WhatsApp auth).
    - 레거시 Plugin manifest contract 키 마이그레이션(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - 레거시 Cron 저장소 마이그레이션(`jobId`, `schedule.cron`, 최상위 delivery/payload 필드, payload `provider`, 단순 `notify: true` Webhook fallback jobs).
    - 레거시 agent runtime-policy를 `agents.defaults.agentRuntime` 및 `agents.list[].agentRuntime`로 마이그레이션.
    - Plugin이 활성화된 경우 오래된 Plugin config 정리. `plugins.enabled=false`인 경우 오래된 Plugin 참조는 비활성 containment config로 취급되어 보존됩니다.

  </Accordion>
  <Accordion title="State 및 무결성">
    - 세션 lock file 검사 및 오래된 lock 정리.
    - 영향을 받은 2026.4.24 빌드에서 생성된 중복 prompt-rewrite branch에 대한 세션 transcript 복구.
    - wedged subagent restart-recovery tombstone 감지. `--fix` 지원을 통해 오래된 aborted recovery flag를 지워 startup이 child를 restart-aborted로 계속 취급하지 않도록 합니다.
    - State 무결성 및 권한 검사(sessions, transcripts, state dir).
    - 로컬에서 실행할 때 config 파일 권한 검사(chmod 600).
    - Model auth 상태: OAuth 만료를 검사하고, 만료 임박 토큰을 새로 고칠 수 있으며, auth-profile cooldown/disabled 상태를 보고합니다.
    - 추가 workspace dir 감지(`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, 서비스, supervisor">
    - sandboxing이 활성화된 경우 sandbox 이미지 복구.
    - 레거시 서비스 마이그레이션 및 추가 Gateway 감지.
    - Matrix 채널 레거시 state 마이그레이션(`--fix` / `--repair` 모드).
    - Gateway runtime 검사(서비스가 설치되었지만 실행 중이 아님, 캐시된 launchd label).
    - 채널 상태 경고(실행 중인 Gateway에서 probe).
    - local TUI 클라이언트가 계속 실행 중인 상태에서 Gateway event-loop 상태가 저하된 경우 WhatsApp 응답성 검사. `--fix`는 검증된 local TUI 클라이언트만 중지합니다.
    - primary models, fallbacks, heartbeat/subagent/compaction overrides, hooks, channel model overrides, session route pins의 레거시 `openai-codex/*` model ref에 대한 Codex route 복구. `--fix`는 이를 `openai/*`로 다시 쓰고, Codex Plugin이 설치 및 활성화되어 있고 `codex` harness를 제공하며 사용 가능한 OAuth가 있는 경우에만 `agentRuntime.id: "codex"`를 선택합니다. 그렇지 않으면 `agentRuntime.id: "pi"`를 선택합니다.
    - 선택적 복구가 포함된 supervisor config audit(launchd/systemd/schtasks).
    - 설치 또는 업데이트 중 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 값을 캡처한 Gateway 서비스에 대한 embedded proxy 환경 정리.
    - Gateway runtime 모범 사례 검사(Node vs Bun, version-manager paths).
    - Gateway 포트 충돌 진단(기본값 `18789`).

  </Accordion>
  <Accordion title="Auth, 보안, 페어링">
    - open DM 정책에 대한 보안 경고.
    - local token mode에 대한 Gateway auth 검사(토큰 소스가 없으면 토큰 생성을 제안하며 token SecretRef config를 덮어쓰지 않음).
    - 디바이스 페어링 문제 감지(대기 중인 최초 pair 요청, 대기 중인 role/scope upgrade, 오래된 local device-token cache drift, paired-record auth drift).

  </Accordion>
  <Accordion title="Workspace 및 shell">
    - Linux의 systemd linger 검사.
    - Workspace bootstrap 파일 크기 검사(context 파일에 대한 truncation/near-limit 경고).
    - 기본 agent에 대한 Skills 준비 상태 검사. 누락된 bins, env, config 또는 OS 요구 사항이 있는 허용된 skills를 보고하며, `--fix`는 `skills.entries`에서 사용할 수 없는 skills를 비활성화할 수 있습니다.
    - Shell completion 상태 검사 및 자동 설치/업그레이드.
    - Memory search embedding provider 준비 상태 검사(local model, remote API key 또는 QMD binary).
    - 소스 설치 검사(pnpm workspace 불일치, 누락된 UI assets, 누락된 tsx binary).
    - 업데이트된 config + wizard metadata를 씁니다.

  </Accordion>
</AccordionGroup>

## Dreams UI backfill 및 reset

Control UI Dreams scene에는 grounded Dreaming 워크플로를 위한 **Backfill**, **Reset**, **Clear Grounded** 작업이 포함되어 있습니다. 이러한 작업은 Gateway doctor 스타일 RPC 메서드를 사용하지만, `openclaw doctor` CLI repair/migration의 일부는 **아닙니다**.

수행하는 작업:

- **Backfill**은 활성 workspace의 과거 `memory/YYYY-MM-DD.md` 파일을 스캔하고, grounded REM diary pass를 실행하며, 되돌릴 수 있는 backfill entry를 `DREAMS.md`에 씁니다.
- **Reset**은 `DREAMS.md`에서 표시된 backfill diary entry만 제거합니다.
- **Clear Grounded**는 과거 replay에서 왔고 아직 live recall 또는 daily support가 누적되지 않은 staged grounded-only short-term entry만 제거합니다.

그 자체로 수행하지 **않는** 작업:

- `MEMORY.md`를 편집하지 않습니다
- 전체 doctor 마이그레이션을 실행하지 않습니다
- staged CLI path를 먼저 명시적으로 실행하지 않는 한 grounded candidate를 live short-term promotion store에 자동으로 stage하지 않습니다

grounded historical replay가 일반 deep promotion lane에 영향을 주도록 하려면 대신 CLI 흐름을 사용하세요.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

이는 `DREAMS.md`를 review surface로 유지하면서 grounded durable candidate를 short-term Dreaming store에 stage합니다.

## 상세 동작 및 근거

<AccordionGroup>
  <Accordion title="0. 선택적 업데이트(git 설치)">
    이것이 git checkout이고 doctor가 대화형으로 실행 중이면 doctor 실행 전에 업데이트(fetch/rebase/build)를 제안합니다.
  </Accordion>
  <Accordion title="1. Config 정규화">
    config에 레거시 값 형태(예: 채널별 override가 없는 `messages.ackReaction`)가 포함되어 있으면 doctor는 이를 현재 스키마로 정규화합니다.

    여기에는 레거시 Talk 평면 필드가 포함됩니다. 현재 공개 Talk speech config는 `talk.provider` + `talk.providers.<provider>`이고, realtime voice config는 `talk.realtime.*`입니다. Doctor는 이전 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 형태를 provider map으로 다시 쓰고, 레거시 최상위 realtime selector(`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`)를 `talk.realtime`로 다시 씁니다.

    Doctor는 또한 `plugins.allow`가 비어 있지 않고 도구 정책이
    wildcard 또는 Plugin 소유 도구 entry를 사용할 때 경고합니다. `tools.allow: ["*"]`는 실제로 로드되는 Plugin의 도구에만 일치하며,
    exclusive Plugin allowlist를 우회하지 않습니다. Doctor는 마이그레이션된
    레거시 allowlist config에 대해 기존 bundled provider 동작을 보존하기 위해 `plugins.bundledDiscovery: "compat"`를 쓰고,
    그런 다음 더 엄격한 `"allowlist"` 설정을 안내합니다.

  </Accordion>
  <Accordion title="2. 레거시 config 키 마이그레이션">
    config에 deprecated key가 포함되어 있으면 다른 명령은 실행을 거부하고 `openclaw doctor`를 실행하라고 요청합니다.

    Doctor는 다음을 수행합니다.

    - 발견된 레거시 키를 설명합니다.
    - 적용한 마이그레이션을 보여줍니다.
    - 업데이트된 스키마로 `~/.openclaw/openclaw.json`을 다시 씁니다.

    Gateway startup은 레거시 config 형식을 거부하고 `openclaw doctor --fix`를 실행하라고 요청합니다. startup에서 `openclaw.json`을 다시 쓰지는 않습니다. Cron job store 마이그레이션도 `openclaw doctor --fix`에서 처리됩니다.

    현재 마이그레이션:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - visible reply policy가 누락된 configured-channel 설정 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 최상위 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 레거시 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - 레거시 최상위 실시간 Talk selector(`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>`(`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 및 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 및 `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>`(`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>`(`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>`(`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 및 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 및 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 이름 있는 `accounts`가 있지만 단일 계정용 최상위 channel 값이 남아 있는 channel의 경우, 해당 계정 범위 값을 해당 channel에 대해 선택된 승격 계정으로 이동합니다(대부분의 channel은 `accounts.default`; Matrix는 기존의 일치하는 named/default 대상을 보존할 수 있음)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`(tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` 제거; 느린 provider/model timeout에는 `models.providers.<id>.timeoutSeconds` 사용
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` 제거(레거시 extension relay 설정)
    - 레거시 `models.providers.*.api: "openai"` → `"openai-completions"`(Gateway 시작 시 `api`가 미래 또는 알 수 없는 enum 값으로 설정된 provider도 fail closed하지 않고 건너뜀)

    Doctor 경고에는 multi-account channel을 위한 account-default 지침도 포함됩니다.

    - 두 개 이상의 `channels.<channel>.accounts` 항목이 `channels.<channel>.defaultAccount` 또는 `accounts.default` 없이 설정된 경우, doctor는 fallback routing이 예상치 못한 계정을 선택할 수 있다고 경고합니다.
    - `channels.<channel>.defaultAccount`가 알 수 없는 account ID로 설정된 경우, doctor는 경고하고 설정된 account ID를 나열합니다.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`, `opencode-zen` 또는 `opencode-go`를 수동으로 추가한 경우, `@mariozechner/pi-ai`의 기본 제공 OpenCode 카탈로그를 재정의합니다. 이로 인해 model이 잘못된 API로 강제되거나 비용이 0이 될 수 있습니다. Doctor는 해당 재정의를 제거하고 model별 API routing 및 비용을 복원할 수 있도록 경고합니다.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    browser 설정이 제거된 Chrome extension 경로를 계속 가리키는 경우, doctor는 이를 현재 host-local Chrome MCP attach model로 정규화합니다.

    - `browser.profiles.*.driver: "extension"`은 `"existing-session"`이 됩니다
    - `browser.relayBindHost`가 제거됩니다

    Doctor는 `defaultProfile: "user"` 또는 설정된 `existing-session` profile을 사용할 때 host-local Chrome MCP 경로도 감사합니다.

    - 기본 auto-connect profile을 위해 같은 host에 Google Chrome이 설치되어 있는지 확인합니다
    - 감지된 Chrome version을 확인하고 Chrome 144 미만이면 경고합니다
    - browser inspect page에서 remote debugging을 활성화하라고 알려 줍니다(예: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` 또는 `edge://inspect/#remote-debugging`)

    Doctor는 Chrome 쪽 설정을 대신 활성화할 수 없습니다. Host-local Chrome MCP에는 여전히 다음이 필요합니다.

    - gateway/node host의 Chromium 기반 browser 144+
    - 로컬에서 실행 중인 browser
    - 해당 browser에서 remote debugging 활성화
    - browser에서 첫 attach consent prompt 승인

    여기서 readiness는 local attach prerequisites에만 관한 것입니다. Existing-session은 현재 Chrome MCP route limit을 유지합니다. `responsebody`, PDF export, download interception, batch action 같은 advanced route에는 여전히 managed browser 또는 raw CDP profile이 필요합니다.

    이 검사는 Docker, sandbox, remote-browser 또는 기타 headless flow에는 적용되지 **않습니다**. 이러한 flow는 계속 raw CDP를 사용합니다.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    OpenAI Codex OAuth profile이 설정된 경우, doctor는 OpenAI authorization endpoint를 probe하여 local Node/OpenSSL TLS stack이 certificate chain을 검증할 수 있는지 확인합니다. probe가 certificate error(예: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, 만료된 cert 또는 self-signed cert)로 실패하면 doctor는 platform별 수정 지침을 출력합니다. Homebrew Node를 사용하는 macOS에서는 일반적으로 `brew postinstall ca-certificates`로 수정할 수 있습니다. `--deep`에서는 Gateway가 정상이어도 probe가 실행됩니다.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    이전에 `models.providers.openai-codex` 아래에 레거시 OpenAI transport 설정을 추가했다면, 최신 release가 자동으로 사용하는 기본 제공 Codex OAuth provider path를 가릴 수 있습니다. Doctor는 Codex OAuth와 함께 이러한 오래된 transport 설정이 보이면 경고하므로, stale transport override를 제거하거나 다시 작성해 기본 제공 routing/fallback 동작을 복원할 수 있습니다. Custom proxy와 header-only override는 계속 지원되며 이 경고를 트리거하지 않습니다.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor는 레거시 `openai-codex/*` model ref를 확인합니다. Native Codex harness routing은 canonical `openai/*` model ref와 `agentRuntime.id: "codex"`를 사용하므로 turn이 OpenClaw PI OpenAI path 대신 Codex app-server harness를 거칩니다.

    `--fix` / `--repair` mode에서 doctor는 primary model, fallback, heartbeat/subagent/compaction override, hook, channel model override, stale persisted session route state를 포함하여 영향을 받는 default-agent 및 per-agent ref를 다시 작성합니다.

    - `openai-codex/gpt-*`는 `openai/gpt-*`가 됩니다.
    - 일치하는 agent runtime은 Codex가 설치되어 있고, 활성화되어 있으며, `codex` harness를 제공하고, 사용할 수 있는 OAuth가 있는 경우에만 `agentRuntime.id: "codex"`가 됩니다.
    - 그렇지 않으면 일치하는 agent runtime은 `agentRuntime.id: "pi"`가 됩니다.
    - 기존 model fallback list는 레거시 항목이 다시 작성된 상태로 보존됩니다. 복사된 per-model 설정은 레거시 key에서 canonical `openai/*` key로 이동합니다.
    - Persisted session의 `modelProvider`/`providerOverride`, `model`/`modelOverride`, fallback notice, auth-profile pin, Codex harness pin은 발견된 모든 agent session store에서 복구됩니다.
    - `/codex ...`는 “채팅에서 native Codex conversation을 제어하거나 bind한다”는 뜻입니다.
    - `/acp ...` 또는 `runtime: "acp"`는 “external ACP/acpx adapter를 사용한다”는 뜻입니다.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor는 설정된 model 또는 runtime을 Codex 같은 plugin-owned route에서 다른 곳으로 옮긴 뒤 stale auto-created route state가 있는지도 발견된 agent session store에서 스캔합니다.

    `openclaw doctor --fix`는 소유 route가 더 이상 설정되지 않았을 때 `modelOverrideSource: "auto"` model pin, runtime model metadata, pinned harness id, CLI session binding, auto auth-profile override 같은 auto-created stale state를 지울 수 있습니다. 명시적인 사용자 또는 레거시 session model 선택은 수동 검토 대상으로 보고되고 그대로 둡니다. 해당 route가 더 이상 의도된 것이 아니라면 `/model ...`, `/new`로 전환하거나 session을 reset하세요.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor는 오래된 on-disk layout을 현재 구조로 migration할 수 있습니다.

    - Session store + transcript:
      - `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
    - Agent dir:
      - `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
    - WhatsApp auth state(Baileys):
      - 레거시 `~/.openclaw/credentials/*.json`에서(`oauth.json` 제외)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...`로(기본 account id: `default`)

    이러한 migration은 best-effort이며 idempotent합니다. doctor는 legacy folder를 backup으로 남겨 두는 경우 경고를 표시합니다. Gateway/CLI도 시작 시 레거시 session + agent dir을 자동 migration하므로 history/auth/model이 수동 doctor 실행 없이 per-agent path에 저장됩니다. WhatsApp auth는 의도적으로 `openclaw doctor`를 통해서만 migration됩니다. Talk provider/provider-map normalization은 이제 structural equality로 비교하므로, key order만 다른 diff는 더 이상 반복적인 no-op `doctor --fix` 변경을 트리거하지 않습니다.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor는 설치된 모든 plugin manifest에서 deprecated top-level capability key(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`)를 스캔합니다. 발견되면 이를 `contracts` object로 이동하고 manifest file을 in-place로 다시 쓰도록 제안합니다. 이 migration은 idempotent합니다. `contracts` key에 이미 같은 값이 있으면 data를 중복하지 않고 legacy key가 제거됩니다.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor는 cron job store(기본값 `~/.openclaw/cron/jobs.json`, override된 경우 `cron.store`)에서도 scheduler가 compatibility를 위해 여전히 허용하는 오래된 job shape가 있는지 확인합니다.

    현재 cron cleanup에는 다음이 포함됩니다.

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 최상위 payload field(`message`, `model`, `thinking`, ...) → `payload`
    - 최상위 delivery field(`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` delivery alias → 명시적 `delivery.channel`
    - 단순 레거시 `notify: true` webhook fallback job → `delivery.to=cron.webhook`가 있는 명시적 `delivery.mode="webhook"`

    Doctor는 동작을 변경하지 않고 처리할 수 있을 때만 `notify: true` 작업을 자동 마이그레이션합니다. 작업이 기존 notify 대체 동작과 기존 비 Webhook 전달 모드를 함께 사용하는 경우 doctor는 경고하고 해당 작업을 수동 검토 대상으로 남겨 둡니다.

    Linux에서는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 호출하는 경우에도 doctor가 경고합니다. 이 호스트 로컬 스크립트는 현재 OpenClaw에서 유지 관리되지 않으며, cron이 systemd 사용자 버스에 연결할 수 없을 때 `~/.openclaw/logs/whatsapp-health.log`에 잘못된 `Gateway inactive` 메시지를 쓸 수 있습니다. `crontab -e`로 오래된 crontab 항목을 제거하세요. 현재 상태 점검에는 `openclaw channels status --probe`, `openclaw doctor`, `openclaw gateway status`를 사용하세요.

  </Accordion>
  <Accordion title="3c. 세션 잠금 정리">
    Doctor는 모든 에이전트 세션 디렉터리에서 오래된 쓰기 잠금 파일, 즉 세션이 비정상 종료되었을 때 남은 파일을 스캔합니다. 발견된 각 잠금 파일에 대해 경로, PID, PID가 아직 살아 있는지 여부, 잠금 경과 시간, 오래된 것으로 간주되는지 여부(죽은 PID 또는 30분 초과)를 보고합니다. `--fix` / `--repair` 모드에서는 오래된 잠금 파일을 자동으로 제거합니다. 그렇지 않으면 참고 메시지를 출력하고 `--fix`로 다시 실행하라고 안내합니다.
  </Accordion>
  <Accordion title="3d. 세션 transcript 브랜치 복구">
    Doctor는 2026.4.24 프롬프트 transcript 재작성 버그로 생성된 중복 브랜치 형태를 찾기 위해 에이전트 세션 JSONL 파일을 스캔합니다. 이는 OpenClaw 내부 런타임 컨텍스트가 있는 버려진 사용자 턴과 동일한 표시 사용자 프롬프트를 포함하는 활성 형제 항목이 함께 있는 형태입니다. `--fix` / `--repair` 모드에서 doctor는 영향을 받은 각 파일을 원본 옆에 백업하고 transcript를 활성 브랜치로 다시 작성하여 Gateway 기록 및 메모리 리더가 더 이상 중복 턴을 보지 않게 합니다.
  </Accordion>
  <Accordion title="4. 상태 무결성 검사(세션 지속성, 라우팅 및 안전성)">
    상태 디렉터리는 운영상의 중추입니다. 이것이 사라지면 다른 곳에 백업이 없는 한 세션, 자격 증명, 로그, 구성을 잃게 됩니다.

    Doctor가 검사하는 항목:

    - **상태 디렉터리 없음**: 치명적인 상태 손실을 경고하고, 디렉터리를 다시 만들지 묻고, 누락된 데이터는 복구할 수 없음을 알려 줍니다.
    - **상태 디렉터리 권한**: 쓰기 가능 여부를 확인합니다. 권한 복구를 제안하고 소유자/그룹 불일치가 감지되면 `chown` 힌트를 출력합니다.
    - **macOS 클라우드 동기화 상태 디렉터리**: 상태가 iCloud Drive(`~/Library/Mobile Documents/com~apple~CloudDocs/...`) 또는 `~/Library/CloudStorage/...` 아래로 해석될 때 경고합니다. 동기화 기반 경로는 I/O를 느리게 만들고 잠금/동기화 경합을 일으킬 수 있기 때문입니다.
    - **Linux SD 또는 eMMC 상태 디렉터리**: 상태가 `mmcblk*` 마운트 소스로 해석될 때 경고합니다. SD 또는 eMMC 기반 랜덤 I/O는 세션 및 자격 증명 쓰기에서 더 느리고 더 빨리 마모될 수 있기 때문입니다.
    - **세션 디렉터리 없음**: `sessions/` 및 세션 저장소 디렉터리는 기록을 유지하고 `ENOENT` 크래시를 방지하는 데 필요합니다.
    - **Transcript 불일치**: 최근 세션 항목에 transcript 파일이 없을 때 경고합니다.
    - **메인 세션 "1줄 JSONL"**: 메인 transcript가 한 줄뿐인 경우 표시합니다(기록이 누적되지 않음).
    - **여러 상태 디렉터리**: 홈 디렉터리 전반에 여러 `~/.openclaw` 폴더가 있거나 `OPENCLAW_STATE_DIR`이 다른 위치를 가리킬 때 경고합니다(설치 간 기록이 분리될 수 있음).
    - **원격 모드 알림**: `gateway.mode=remote`인 경우 doctor는 원격 호스트에서 실행하라고 알려 줍니다(상태가 그곳에 있음).
    - **구성 파일 권한**: `~/.openclaw/openclaw.json`이 그룹/전체 사용자에게 읽기 가능하면 경고하고 `600`으로 강화할 것을 제안합니다.

  </Accordion>
  <Accordion title="5. 모델 인증 상태(OAuth 만료)">
    Doctor는 인증 저장소의 OAuth 프로필을 검사하고, 토큰이 곧 만료되거나 만료된 경우 경고하며, 안전할 때 갱신할 수 있습니다. Anthropic OAuth/토큰 프로필이 오래된 경우 Anthropic API 키 또는 Anthropic setup-token 경로를 제안합니다. 갱신 프롬프트는 대화형(TTY)으로 실행할 때만 표시됩니다. `--non-interactive`는 갱신 시도를 건너뜁니다.

    OAuth 갱신이 영구적으로 실패하면(예: `refresh_token_reused`, `invalid_grant` 또는 제공자가 다시 로그인하라고 알리는 경우) doctor는 재인증이 필요하다고 보고하고 실행할 정확한 `openclaw models auth login --provider ...` 명령을 출력합니다.

    Doctor는 다음으로 인해 일시적으로 사용할 수 없는 인증 프로필도 보고합니다.

    - 짧은 cooldown(rate limit/timeout/auth failure)
    - 더 긴 비활성화(billing/credit failure)

  </Accordion>
  <Accordion title="6. Hooks 모델 검증">
    `hooks.gmail.model`이 설정된 경우 doctor는 카탈로그 및 허용 목록을 기준으로 모델 참조를 검증하고, 확인할 수 없거나 허용되지 않는 경우 경고합니다.
  </Accordion>
  <Accordion title="7. 샌드박스 이미지 복구">
    샌드박스가 활성화된 경우 doctor는 Docker 이미지를 검사하고 현재 이미지가 없으면 빌드하거나 레거시 이름으로 전환할 것을 제안합니다.
  </Accordion>
  <Accordion title="7b. Plugin 설치 정리">
    Doctor는 `openclaw doctor --fix` / `openclaw doctor --repair` 모드에서 레거시 OpenClaw 생성 Plugin 의존성 스테이징 상태를 제거합니다. 여기에는 오래된 생성 의존성 루트, 이전 install-stage 디렉터리, 예전 번들 Plugin 의존성 복구 코드에서 남은 패키지 로컬 잔해, 현재 번들 매니페스트를 가릴 수 있는 번들 `@openclaw/*` Plugin의 고아 상태 또는 복구된 관리형 npm 사본이 포함됩니다.

    Doctor는 구성에서 다운로드 가능한 Plugin을 참조하지만 로컬 Plugin 레지스트리에서 찾을 수 없는 경우 누락된 Plugin을 다시 설치할 수도 있습니다. 예로는 실제 `plugins.entries`, 구성된 채널/제공자/검색 설정, 구성된 에이전트 런타임이 있습니다. 패키지 업데이트 중에는 core 패키지가 교체되는 동안 doctor가 패키지 관리자 Plugin 복구를 실행하지 않습니다. 구성된 Plugin에 여전히 복구가 필요하면 업데이트 후 `openclaw doctor --fix`를 다시 실행하세요. Gateway 시작 및 구성 다시 로드는 패키지 관리자를 실행하지 않습니다. Plugin 설치는 명시적인 doctor/install/update 작업으로 남아 있습니다.

  </Accordion>
  <Accordion title="8. Gateway 서비스 마이그레이션 및 정리 힌트">
    Doctor는 레거시 Gateway 서비스(launchd/systemd/schtasks)를 감지하고 이를 제거한 뒤 현재 Gateway 포트를 사용하여 OpenClaw 서비스를 설치할 것을 제안합니다. 또한 추가 Gateway 유사 서비스를 스캔하고 정리 힌트를 출력할 수 있습니다. 프로필 이름이 지정된 OpenClaw Gateway 서비스는 일급 대상으로 간주되며 "extra"로 표시되지 않습니다.

    Linux에서 사용자 수준 Gateway 서비스가 없지만 시스템 수준 OpenClaw Gateway 서비스가 있는 경우 doctor는 두 번째 사용자 수준 서비스를 자동으로 설치하지 않습니다. `openclaw gateway status --deep` 또는 `openclaw doctor --deep`로 검사한 다음, 중복 서비스를 제거하거나 시스템 supervisor가 Gateway 수명 주기를 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요.

  </Accordion>
  <Accordion title="8b. 시작 시 Matrix 마이그레이션">
    Matrix 채널 계정에 보류 중이거나 조치 가능한 레거시 상태 마이그레이션이 있는 경우 doctor는 (`--fix` / `--repair` 모드에서) 마이그레이션 전 스냅샷을 만든 다음 최선의 마이그레이션 단계를 실행합니다. 레거시 Matrix 상태 마이그레이션 및 레거시 암호화 상태 준비가 이에 해당합니다. 두 단계 모두 치명적이지 않습니다. 오류는 로그에 기록되고 시작은 계속됩니다. 읽기 전용 모드(`--fix` 없이 `openclaw doctor`)에서는 이 검사를 완전히 건너뜁니다.
  </Accordion>
  <Accordion title="8c. 기기 페어링 및 인증 드리프트">
    이제 Doctor는 일반 상태 점검의 일부로 기기 페어링 상태를 검사합니다.

    보고하는 항목:

    - 보류 중인 최초 페어링 요청
    - 이미 페어링된 기기의 보류 중인 역할 업그레이드
    - 이미 페어링된 기기의 보류 중인 범위 업그레이드
    - 기기 id는 여전히 일치하지만 기기 identity가 더 이상 승인된 레코드와 일치하지 않는 공개 키 불일치 복구
    - 승인된 역할에 대한 활성 토큰이 없는 페어링된 레코드
    - 범위가 승인된 페어링 기준선 밖으로 드리프트된 페어링 토큰
    - Gateway 측 토큰 rotation보다 오래되었거나 오래된 범위 메타데이터를 포함하는 현재 머신의 로컬 캐시 기기 토큰 항목

    Doctor는 페어링 요청을 자동 승인하거나 기기 토큰을 자동 rotation하지 않습니다. 대신 정확한 다음 단계를 출력합니다.

    - `openclaw devices list`로 보류 중인 요청 검사
    - `openclaw devices approve <requestId>`로 정확한 요청 승인
    - `openclaw devices rotate --device <deviceId> --role <role>`로 새 토큰 rotation
    - `openclaw devices remove <deviceId>`로 오래된 레코드 제거 후 다시 승인

    이는 흔한 "이미 페어링되었지만 여전히 페어링 필요 메시지가 표시되는" 문제를 해결합니다. 이제 doctor는 최초 페어링, 보류 중인 역할/범위 업그레이드, 오래된 토큰/기기 identity 드리프트를 구분합니다.

  </Accordion>
  <Accordion title="9. 보안 경고">
    Doctor는 제공자가 허용 목록 없이 DM에 열려 있거나 정책이 위험한 방식으로 구성된 경우 경고를 출력합니다.
  </Accordion>
  <Accordion title="10. systemd linger(Linux)">
    systemd 사용자 서비스로 실행 중인 경우 doctor는 Gateway가 로그아웃 후에도 살아 있도록 lingering이 활성화되어 있는지 확인합니다.
  </Accordion>
  <Accordion title="11. Workspace 상태(Skills, Plugin 및 레거시 디렉터리)">
    Doctor는 기본 에이전트의 Workspace 상태 요약을 출력합니다.

    - **Skills 상태**: 적격, 요구 사항 누락, 허용 목록 차단 Skills 수를 셉니다.
    - **레거시 Workspace 디렉터리**: `~/openclaw` 또는 기타 레거시 Workspace 디렉터리가 현재 Workspace와 함께 존재할 때 경고합니다.
    - **Plugin 상태**: 활성화/비활성화/오류 Plugin 수를 셉니다. 오류가 있는 경우 Plugin ID를 나열하고 번들 Plugin 기능을 보고합니다.
    - **Plugin 호환성 경고**: 현재 런타임과 호환성 문제가 있는 Plugin을 표시합니다.
    - **Plugin 진단**: Plugin 레지스트리가 로드 시 출력한 경고 또는 오류를 표시합니다.

  </Accordion>
  <Accordion title="11b. Bootstrap 파일 크기">
    Doctor는 Workspace Bootstrap 파일(예: `AGENTS.md`, `CLAUDE.md` 또는 기타 주입된 컨텍스트 파일)이 구성된 문자 예산에 가깝거나 초과하는지 확인합니다. 파일별 원시 문자 수와 주입된 문자 수, 잘림 비율, 잘림 원인(`max/file` 또는 `max/total`), 전체 예산 대비 총 주입 문자 비율을 보고합니다. 파일이 잘렸거나 한도에 가까우면 doctor는 `agents.defaults.bootstrapMaxChars` 및 `agents.defaults.bootstrapTotalMaxChars` 조정 팁을 출력합니다.
  </Accordion>
  <Accordion title="11d. 오래된 채널 Plugin 정리">
    `openclaw doctor --fix`가 누락된 채널 Plugin을 제거할 때 해당 Plugin을 참조하던 dangling 채널 범위 구성도 함께 제거합니다. 여기에는 `channels.<id>` 항목, 해당 채널 이름을 지정한 Heartbeat 대상, `agents.*.models["<channel>/*"]` override가 포함됩니다. 이렇게 하면 채널 런타임은 사라졌지만 구성에서 여전히 Gateway에 바인딩을 요청하는 Gateway 부팅 루프를 방지합니다.
  </Accordion>
  <Accordion title="11c. 셸 completion">
    Doctor는 현재 셸(zsh, bash, fish 또는 PowerShell)에 탭 completion이 설치되어 있는지 확인합니다.

    - 셸 프로필이 느린 동적 completion 패턴(`source <(openclaw completion ...)`)을 사용하는 경우 doctor는 이를 더 빠른 캐시 파일 방식으로 업그레이드합니다.
    - 프로필에 completion이 구성되어 있지만 캐시 파일이 없으면 doctor가 캐시를 자동으로 다시 생성합니다.
    - completion이 전혀 구성되어 있지 않으면 doctor가 설치 여부를 묻습니다(대화형 모드만 해당. `--non-interactive`에서는 건너뜀).

    캐시를 수동으로 다시 생성하려면 `openclaw completion --write-state`를 실행하세요.

  </Accordion>
  <Accordion title="12. Gateway 인증 검사(로컬 토큰)">
    Doctor는 로컬 Gateway 토큰 인증 준비 상태를 확인합니다.

    - 토큰 모드에 토큰이 필요하지만 토큰 소스가 없으면 doctor가 생성을 제안합니다.
    - `gateway.auth.token`이 SecretRef로 관리되지만 사용할 수 없는 경우 doctor가 경고하고 이를 평문으로 덮어쓰지 않습니다.
    - `openclaw doctor --generate-gateway-token`은 토큰 SecretRef가 구성되지 않은 경우에만 생성을 강제합니다.

  </Accordion>
  <Accordion title="12b. 읽기 전용 SecretRef 인식 복구">
    일부 복구 흐름은 런타임 빠른 실패 동작을 약화하지 않고 구성된 자격 증명을 검사해야 합니다.

    - `openclaw doctor --fix`는 이제 대상 config 복구에 status 계열 명령과 동일한 읽기 전용 SecretRef 요약 모델을 사용합니다.
    - 예: Telegram `allowFrom` / `groupAllowFrom` `@username` 복구는 사용 가능한 경우 구성된 봇 자격 증명을 사용하려고 시도합니다.
    - Telegram 봇 토큰이 SecretRef로 구성되어 있지만 현재 명령 경로에서 사용할 수 없는 경우, doctor는 자격 증명이 구성되었지만 사용할 수 없다고 보고하고, 토큰이 누락된 것으로 잘못 보고하거나 충돌하는 대신 자동 확인을 건너뜁니다.

  </Accordion>
  <Accordion title="13. Gateway 상태 확인 + 재시작">
    Doctor는 상태 확인을 실행하고 Gateway가 비정상으로 보이면 재시작을 제안합니다.
  </Accordion>
  <Accordion title="13b. 메모리 검색 준비 상태">
    Doctor는 구성된 메모리 검색 임베딩 provider가 기본 에이전트에 대해 준비되었는지 확인합니다. 동작은 구성된 백엔드와 provider에 따라 달라집니다.

    - **QMD 백엔드**: `qmd` 바이너리를 사용할 수 있고 시작할 수 있는지 검사합니다. 그렇지 않으면 npm 패키지와 수동 바이너리 경로 옵션을 포함한 수정 안내를 출력합니다.
    - **명시적 로컬 provider**: 로컬 모델 파일 또는 인식된 원격/다운로드 가능한 모델 URL을 확인합니다. 없으면 원격 provider로 전환할 것을 제안합니다.
    - **명시적 원격 provider**(`openai`, `voyage` 등): API 키가 환경 또는 인증 저장소에 있는지 확인합니다. 없으면 실행 가능한 수정 힌트를 출력합니다.
    - **자동 provider**: 먼저 로컬 모델 가용성을 확인한 다음, 자동 선택 순서에 따라 각 원격 provider를 시도합니다.

    캐시된 Gateway 검사 결과를 사용할 수 있으면(확인 당시 Gateway가 정상 상태였음), doctor는 그 결과를 CLI에서 볼 수 있는 config와 상호 참조하고 불일치를 알립니다. Doctor는 기본 경로에서 새 임베딩 ping을 시작하지 않습니다. 실시간 provider 확인이 필요하면 심층 메모리 상태 명령을 사용하세요.

    런타임에서 임베딩 준비 상태를 확인하려면 `openclaw memory status --deep`을 사용하세요.

  </Accordion>
  <Accordion title="14. 채널 상태 경고">
    Gateway가 정상 상태이면 doctor는 채널 상태 검사를 실행하고 제안된 수정과 함께 경고를 보고합니다.
  </Accordion>
  <Accordion title="15. Supervisor config 감사 + 복구">
    Doctor는 설치된 supervisor config(launchd/systemd/schtasks)에 누락되었거나 오래된 기본값(예: systemd network-online 종속성 및 재시작 지연)이 있는지 확인합니다. 불일치가 발견되면 업데이트를 권장하고 service 파일/task를 현재 기본값으로 다시 작성할 수 있습니다.

    참고:

    - `openclaw doctor`는 supervisor config를 다시 작성하기 전에 확인을 요청합니다.
    - `openclaw doctor --yes`는 기본 복구 프롬프트를 수락합니다.
    - `openclaw doctor --repair`는 확인 없이 권장 수정 사항을 적용합니다.
    - `openclaw doctor --repair --force`는 사용자 지정 supervisor config를 덮어씁니다.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`은 Gateway service 수명 주기에 대해 doctor를 읽기 전용으로 유지합니다. service 상태를 계속 보고하고 비 service 복구를 실행하지만, 외부 supervisor가 해당 수명 주기를 소유하므로 service 설치/시작/재시작/bootstrap, supervisor config 재작성, 레거시 service 정리를 건너뜁니다.
    - Linux에서 doctor는 일치하는 systemd Gateway unit이 활성 상태인 동안 command/entrypoint 메타데이터를 다시 작성하지 않습니다. 또한 duplicate-service 검사 중 비활성 비 레거시 추가 Gateway 유사 unit을 무시하므로 동반 service 파일이 정리 잡음을 만들지 않습니다.
    - 토큰 auth에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, doctor service 설치/복구는 SecretRef를 검증하지만 확인된 일반 텍스트 토큰 값을 supervisor service 환경 메타데이터에 유지하지 않습니다.
    - Doctor는 이전 LaunchAgent, systemd 또는 Windows Scheduled Task 설치가 인라인으로 포함한 관리형 `.env`/SecretRef 기반 service 환경 값을 감지하고, 해당 값이 supervisor 정의 대신 런타임 소스에서 로드되도록 service 메타데이터를 다시 작성합니다.
    - Doctor는 `gateway.port` 변경 후에도 service command가 여전히 이전 `--port`를 고정하고 있는 경우를 감지하고 service 메타데이터를 현재 포트로 다시 작성합니다.
    - 토큰 auth에 토큰이 필요하고 구성된 토큰 SecretRef가 확인되지 않은 경우, doctor는 실행 가능한 안내와 함께 설치/복구 경로를 차단합니다.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, doctor는 mode가 명시적으로 설정될 때까지 설치/복구를 차단합니다.
    - Linux user-systemd unit의 경우, doctor 토큰 드리프트 검사는 이제 service auth 메타데이터를 비교할 때 `Environment=`와 `EnvironmentFile=` 소스를 모두 포함합니다.
    - Doctor service 복구는 config가 더 새 버전에서 마지막으로 작성된 경우 이전 OpenClaw 바이너리의 Gateway service를 다시 작성, 중지 또는 재시작하는 것을 거부합니다. [Gateway 문제 해결](/ko/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)을 참조하세요.
    - `openclaw gateway install --force`를 통해 언제든지 전체 재작성을 강제할 수 있습니다.

  </Accordion>
  <Accordion title="16. Gateway 런타임 + 포트 진단">
    Doctor는 service 런타임(PID, 마지막 종료 상태)을 검사하고, service가 설치되어 있지만 실제로 실행 중이 아닐 때 경고합니다. 또한 Gateway 포트(기본값 `18789`)의 포트 충돌을 확인하고 가능한 원인(Gateway가 이미 실행 중, SSH 터널)을 보고합니다.
  </Accordion>
  <Accordion title="17. Gateway 런타임 모범 사례">
    Doctor는 Gateway service가 Bun 또는 버전 관리 Node 경로(`nvm`, `fnm`, `volta`, `asdf` 등)에서 실행될 때 경고합니다. WhatsApp + Telegram 채널에는 Node가 필요하며, 버전 관리자 경로는 service가 셸 초기화를 로드하지 않기 때문에 업그레이드 후 깨질 수 있습니다. Doctor는 사용 가능한 경우 시스템 Node 설치(Homebrew/apt/choco)로 마이그레이션할 것을 제안합니다.

    새로 설치되거나 복구된 macOS LaunchAgent는 대화형 셸 PATH를 복사하는 대신 표준 시스템 PATH(`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`)를 사용하므로 Volta, asdf, fnm, pnpm 및 기타 버전 관리자 디렉터리가 Node 자식 프로세스 확인 방식을 변경하지 않습니다. Linux service는 여전히 명시적 환경 루트(`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`)와 안정적인 user-bin 디렉터리를 유지하지만, 추측된 버전 관리자 fallback 디렉터리는 해당 디렉터리가 디스크에 존재할 때만 service PATH에 기록됩니다.

  </Accordion>
  <Accordion title="18. Config 쓰기 + wizard 메타데이터">
    Doctor는 config 변경 사항을 유지하고 doctor 실행을 기록하기 위해 wizard 메타데이터를 표시합니다.
  </Accordion>
  <Accordion title="19. Workspace 팁(백업 + 메모리 시스템)">
    Doctor는 누락된 경우 workspace 메모리 시스템을 제안하고, workspace가 아직 git 아래에 있지 않으면 백업 팁을 출력합니다.

    workspace 구조 및 git 백업(비공개 GitHub 또는 GitLab 권장)에 대한 전체 가이드는 [/concepts/agent-workspace](/ko/concepts/agent-workspace)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [Gateway runbook](/ko/gateway)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
