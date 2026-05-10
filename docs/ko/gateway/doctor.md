---
read_when:
    - 진단 마이그레이션 추가 또는 수정
    - 호환성을 깨는 설정 변경 사항 도입
sidebarTitle: Doctor
summary: '진단 명령: 상태 검사, 구성 마이그레이션 및 복구 단계'
title: 진단
x-i18n:
    generated_at: "2026-05-10T19:35:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 417440c2f658be5848b305bffeb006ad435f069d93f7e73ffbeef9468b58e1b3
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`는 OpenClaw용 복구 및 마이그레이션 도구입니다. 오래된 구성/상태를 수정하고, 상태를 점검하며, 실행 가능한 복구 단계를 제공합니다.

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

    프롬프트 없이 기본값을 수락합니다(해당되는 경우 재시작/서비스/샌드박스 복구 단계 포함).

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

    적극적인 복구도 적용합니다(사용자 지정 supervisor 구성을 덮어씀).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    프롬프트 없이 실행하고 안전한 마이그레이션만 적용합니다(구성 정규화 + 디스크상의 상태 이동). 사람의 확인이 필요한 재시작/서비스/샌드박스 작업은 건너뜁니다. 레거시 상태 마이그레이션은 감지되면 자동으로 실행됩니다.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    추가 Gateway 설치를 찾기 위해 시스템 서비스를 스캔합니다(launchd/systemd/schtasks).

  </Tab>
</Tabs>

쓰기 전에 변경 사항을 검토하려면 먼저 구성 파일을 여세요.

```bash
cat ~/.openclaw/openclaw.json
```

## 수행 내용(요약)

<AccordionGroup>
  <Accordion title="상태, UI, 업데이트">
    - git 설치의 선택적 사전 업데이트(대화형 전용).
    - UI 프로토콜 최신성 확인(프로토콜 스키마가 더 최신이면 Control UI를 다시 빌드).
    - 상태 확인 + 재시작 프롬프트.
    - Skills 상태 요약(적격/누락/차단) 및 Plugin 상태.

  </Accordion>
  <Accordion title="구성 및 마이그레이션">
    - 레거시 값에 대한 구성 정규화.
    - 레거시 평면 `talk.*` 필드에서 `talk.provider` + `talk.providers.<provider>`로 Talk 구성 마이그레이션.
    - 레거시 Chrome 확장 구성 및 Chrome MCP 준비 상태에 대한 브라우저 마이그레이션 확인.
    - OpenCode 제공자 재정의 경고(`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth 섀도잉 경고(`models.providers.openai-codex`).
    - OpenAI Codex OAuth 프로필에 대한 OAuth TLS 필수 조건 확인.
    - `plugins.allow`가 제한적이지만 도구 정책이 여전히 와일드카드 또는 Plugin 소유 도구를 요청할 때 Plugin/도구 허용 목록 경고.
    - 레거시 디스크상 상태 마이그레이션(세션/에이전트 디렉터리/WhatsApp 인증).
    - 레거시 Plugin 매니페스트 계약 키 마이그레이션(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - 레거시 Cron 저장소 마이그레이션(`jobId`, `schedule.cron`, 최상위 전달/페이로드 필드, 페이로드 `provider`, 단순 `notify: true` Webhook 대체 작업).
    - 레거시 전체 에이전트 런타임 정책 정리. 제공자/모델 런타임 정책이 활성 경로 선택기입니다.
    - Plugin이 활성화된 경우 오래된 Plugin 구성 정리. `plugins.enabled=false`일 때 오래된 Plugin 참조는 비활성 격리 구성으로 간주되어 보존됩니다.

  </Accordion>
  <Accordion title="상태 및 무결성">
    - 세션 잠금 파일 검사 및 오래된 잠금 정리.
    - 영향을 받은 2026.4.24 빌드가 만든 중복 프롬프트 재작성 브랜치에 대한 세션 대화 기록 복구.
    - 중단된 subagent 재시작-복구 tombstone 감지. 오래된 중단 복구 플래그를 지워 시작 시 자식을 계속 재시작-중단으로 취급하지 않도록 하는 `--fix` 지원 포함.
    - 상태 무결성 및 권한 확인(세션, 대화 기록, 상태 디렉터리).
    - 로컬에서 실행할 때 구성 파일 권한 확인(chmod 600).
    - 모델 인증 상태: OAuth 만료를 확인하고, 만료 임박 토큰을 새로 고칠 수 있으며, auth-profile 쿨다운/비활성화 상태를 보고합니다.
    - 추가 작업공간 디렉터리 감지(`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, 서비스, supervisor">
    - 샌드박싱이 활성화된 경우 샌드박스 이미지 복구.
    - 레거시 서비스 마이그레이션 및 추가 Gateway 감지.
    - Matrix 채널 레거시 상태 마이그레이션(`--fix` / `--repair` 모드).
    - Gateway 런타임 확인(서비스가 설치되었지만 실행 중이 아님, 캐시된 launchd 레이블).
    - 채널 상태 경고(실행 중인 Gateway에서 조사).
    - 채널별 권한 확인은 `openclaw channels capabilities` 아래에 있습니다. 예를 들어 Discord 음성 채널 권한은 `openclaw channels capabilities --channel discord --target channel:<channel-id>`로 감사합니다.
    - 로컬 TUI 클라이언트가 여전히 실행 중인 상태에서 저하된 Gateway 이벤트 루프 상태에 대한 WhatsApp 응답성 확인. `--fix`는 검증된 로컬 TUI 클라이언트만 중지합니다.
    - 기본 모델, fallback, heartbeat/subagent/compaction 재정의, hook, 채널 모델 재정의, 세션 경로 pin의 레거시 `openai-codex/*` 모델 참조에 대한 Codex 경로 복구. `--fix`는 이를 `openai/*`로 다시 쓰고, 오래된 세션/전체 에이전트 런타임 pin을 제거하며, 정식 OpenAI 에이전트 참조는 기본 Codex harness에 남겨둡니다.
    - 선택적 복구가 포함된 supervisor 구성 감사(launchd/systemd/schtasks).
    - 설치 또는 업데이트 중 shell `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 값을 캡처한 Gateway 서비스의 내장 proxy 환경 정리.
    - Gateway 런타임 모범 사례 확인(Node vs Bun, 버전 관리자 경로).
    - Gateway 포트 충돌 진단(기본값 `18789`).

  </Accordion>
  <Accordion title="인증, 보안, pairing">
    - 열린 DM 정책에 대한 보안 경고.
    - 로컬 토큰 모드에 대한 Gateway 인증 확인(토큰 소스가 없으면 토큰 생성을 제안함. 토큰 SecretRef 구성은 덮어쓰지 않음).
    - 장치 pairing 문제 감지(대기 중인 최초 pair 요청, 대기 중인 역할/범위 업그레이드, 오래된 로컬 device-token 캐시 drift, paired-record 인증 drift).

  </Accordion>
  <Accordion title="작업공간 및 shell">
    - Linux의 systemd linger 확인.
    - 작업공간 bootstrap 파일 크기 확인(컨텍스트 파일의 잘림/제한 근접 경고).
    - 기본 에이전트에 대한 Skills 준비 상태 확인. 누락된 bin, env, config 또는 OS 요구 사항이 있는 허용된 Skills를 보고하며, `--fix`는 `skills.entries`에서 사용할 수 없는 Skills를 비활성화할 수 있습니다.
    - Shell completion 상태 확인 및 자동 설치/업그레이드.
    - 메모리 검색 embedding 제공자 준비 상태 확인(로컬 모델, 원격 API 키 또는 QMD 바이너리).
    - 소스 설치 확인(pnpm 작업공간 불일치, 누락된 UI asset, 누락된 tsx 바이너리).
    - 업데이트된 구성 + wizard 메타데이터를 씁니다.

  </Accordion>
</AccordionGroup>

## Dreams UI backfill 및 reset

Control UI Dreams scene에는 grounded dreaming 워크플로를 위한 **Backfill**, **Reset**, **Clear Grounded** 작업이 포함됩니다. 이러한 작업은 Gateway doctor 스타일 RPC 메서드를 사용하지만, `openclaw doctor` CLI 복구/마이그레이션의 일부는 **아닙니다**.

수행하는 작업:

- **Backfill**은 활성 작업공간의 과거 `memory/YYYY-MM-DD.md` 파일을 스캔하고, grounded REM diary pass를 실행하며, 되돌릴 수 있는 backfill 항목을 `DREAMS.md`에 씁니다.
- **Reset**은 `DREAMS.md`에서 표시된 backfill diary 항목만 제거합니다.
- **Clear Grounded**는 과거 replay에서 왔고 아직 live recall 또는 daily support를 누적하지 않은 staged grounded-only 단기 항목만 제거합니다.

자체적으로 수행하지 **않는** 작업:

- `MEMORY.md`를 편집하지 않습니다
- 전체 doctor 마이그레이션을 실행하지 않습니다
- 먼저 staged CLI 경로를 명시적으로 실행하지 않는 한, grounded candidate를 live 단기 promotion 저장소에 자동으로 stage하지 않습니다

grounded 과거 replay가 일반 deep promotion lane에 영향을 주게 하려면 대신 CLI flow를 사용하세요.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

이는 `DREAMS.md`를 검토 surface로 유지하면서 grounded durable candidate를 단기 dreaming 저장소에 stage합니다.

## 상세 동작 및 근거

<AccordionGroup>
  <Accordion title="0. 선택적 업데이트(git 설치)">
    이것이 git checkout이고 doctor가 대화형으로 실행 중이면, doctor를 실행하기 전에 업데이트(fetch/rebase/build)를 제안합니다.
  </Accordion>
  <Accordion title="1. 구성 정규화">
    구성에 레거시 값 형태가 포함되어 있으면(예: 채널별 재정의 없이 `messages.ackReaction`이 있는 경우) doctor가 이를 현재 스키마로 정규화합니다.

    여기에는 레거시 Talk 평면 필드가 포함됩니다. 현재 공개 Talk speech 구성은 `talk.provider` + `talk.providers.<provider>`이고, realtime voice 구성은 `talk.realtime.*`입니다. Doctor는 이전 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 형태를 제공자 map으로 다시 쓰고, 레거시 최상위 realtime selector(`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`)를 `talk.realtime`으로 다시 씁니다.

    또한 Doctor는 `plugins.allow`가 비어 있지 않고 도구 정책이
    와일드카드 또는 Plugin 소유 도구 항목을 사용할 때 경고합니다. `tools.allow: ["*"]`는 실제로 로드되는 Plugin의 도구에만 일치하며,
    배타적인 Plugin 허용 목록을 우회하지 않습니다. Doctor는 마이그레이션된
    레거시 허용 목록 구성에 `plugins.bundledDiscovery: "compat"`를 써서 기존 bundled provider 동작을 보존한 다음,
    더 엄격한 `"allowlist"` 설정을 가리킵니다.

  </Accordion>
  <Accordion title="2. 레거시 구성 키 마이그레이션">
    구성에 deprecated 키가 포함되어 있으면 다른 명령은 실행을 거부하고 `openclaw doctor`를 실행하라고 요청합니다.

    Doctor는 다음을 수행합니다.

    - 어떤 레거시 키가 발견되었는지 설명합니다.
    - 적용한 마이그레이션을 표시합니다.
    - 업데이트된 스키마로 `~/.openclaw/openclaw.json`을 다시 씁니다.

    Gateway 시작은 레거시 구성 형식을 거부하고 `openclaw doctor --fix` 실행을 요청합니다. 시작 시 `openclaw.json`을 다시 쓰지는 않습니다. Cron 작업 저장소 마이그레이션도 `openclaw doctor --fix`에서 처리됩니다.

    현재 마이그레이션:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 표시 가능한 답장 정책이 누락된 구성된 채널 구성 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 최상위 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 레거시 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - 레거시 최상위 실시간 Talk 선택자(`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) + `talk.provider`/`talk.providers` → `talk.realtime`
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
    - 이름이 지정된 `accounts`가 있지만 단일 계정 최상위 채널 값이 남아 있는 채널의 경우, 해당 계정 범위 값을 그 채널에 대해 선택된 승격 계정으로 이동합니다(대부분의 채널은 `accounts.default`; Matrix는 기존의 일치하는 이름 지정/기본 대상을 보존할 수 있음).
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`(tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` 제거; 느린 provider/model 제한 시간에는 `models.providers.<id>.timeoutSeconds` 사용
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` 제거(레거시 extension relay 설정)
    - 레거시 `models.providers.*.api: "openai"` → `"openai-completions"`(Gateway 시작 시 `api`가 향후 또는 알 수 없는 enum 값으로 설정된 provider는 실패로 닫는 대신 건너뜁니다)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` 제거; Codex app-server는 항상 Codex 네이티브 workspace tools를 네이티브로 유지합니다

    Doctor 경고에는 다중 계정 채널에 대한 계정 기본값 지침도 포함됩니다.

    - 두 개 이상의 `channels.<channel>.accounts` 항목이 `channels.<channel>.defaultAccount` 또는 `accounts.default` 없이 구성된 경우, doctor는 fallback 라우팅이 예상치 못한 계정을 선택할 수 있다고 경고합니다.
    - `channels.<channel>.defaultAccount`가 알 수 없는 계정 ID로 설정된 경우, doctor는 경고하고 구성된 계정 ID를 나열합니다.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`, `opencode-zen` 또는 `opencode-go`를 수동으로 추가한 경우, 이는 `@mariozechner/pi-ai`의 기본 제공 OpenCode 카탈로그를 재정의합니다. 이로 인해 모델이 잘못된 API로 강제되거나 비용이 0으로 초기화될 수 있습니다. Doctor는 override를 제거하고 모델별 API 라우팅과 비용을 복원할 수 있도록 경고합니다.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    브라우저 구성이 아직 제거된 Chrome extension 경로를 가리키는 경우, doctor는 이를 현재 host-local Chrome MCP attach 모델로 정규화합니다.

    - `browser.profiles.*.driver: "extension"`는 `"existing-session"`이 됩니다
    - `browser.relayBindHost`가 제거됩니다

    Doctor는 `defaultProfile: "user"` 또는 구성된 `existing-session` profile을 사용할 때 host-local Chrome MCP 경로도 감사합니다.

    - 기본 자동 연결 profile의 경우 동일한 호스트에 Google Chrome이 설치되어 있는지 확인합니다
    - 감지된 Chrome 버전을 확인하고 Chrome 144 미만이면 경고합니다
    - 브라우저 inspect 페이지에서 remote debugging을 활성화하라고 알립니다(예: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` 또는 `edge://inspect/#remote-debugging`)

    Doctor는 Chrome 쪽 설정을 대신 활성화할 수 없습니다. Host-local Chrome MCP에는 여전히 다음이 필요합니다.

    - gateway/node 호스트의 Chromium 기반 브라우저 144+
    - 브라우저가 로컬에서 실행 중이어야 함
    - 해당 브라우저에서 remote debugging 활성화
    - 브라우저에서 첫 attach consent prompt 승인

    여기서 준비 상태는 local attach 전제 조건에만 관한 것입니다. Existing-session은 현재 Chrome MCP route 제한을 유지합니다. `responsebody`, PDF export, download interception, batch actions 같은 고급 route에는 여전히 managed browser 또는 raw CDP profile이 필요합니다.

    이 검사는 Docker, sandbox, remote-browser 또는 기타 headless flow에는 적용되지 **않습니다**. 이러한 flow는 계속 raw CDP를 사용합니다.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    OpenAI Codex OAuth profile이 구성되면, doctor는 OpenAI authorization endpoint를 조사하여 로컬 Node/OpenSSL TLS 스택이 certificate chain을 검증할 수 있는지 확인합니다. 조사가 인증서 오류(예: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, 만료된 인증서 또는 self-signed 인증서)로 실패하면, doctor는 플랫폼별 수정 지침을 출력합니다. Homebrew Node를 사용하는 macOS에서는 보통 `brew postinstall ca-certificates`로 해결합니다. `--deep`을 사용하면 Gateway가 정상이어도 조사가 실행됩니다.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    이전에 `models.providers.openai-codex` 아래에 레거시 OpenAI transport 설정을 추가했다면, 최신 릴리스가 자동으로 사용하는 기본 제공 Codex OAuth provider 경로를 가릴 수 있습니다. Doctor는 Codex OAuth와 함께 이러한 오래된 transport 설정을 발견하면 경고하여, 오래된 transport override를 제거하거나 다시 작성하고 기본 제공 라우팅/fallback 동작을 되찾을 수 있게 합니다. 사용자 지정 프록시와 header-only override는 여전히 지원되며 이 경고를 트리거하지 않습니다.
  </Accordion>
  <Accordion title="2f. Codex route repair">
    Doctor는 레거시 `openai-codex/*` model ref를 확인합니다. 네이티브 Codex harness 라우팅은 정식 `openai/*` model ref를 사용합니다. OpenAI agent turn은 OpenClaw PI OpenAI 경로 대신 Codex app-server harness를 거칩니다.

    `--fix` / `--repair` 모드에서 doctor는 primary model, fallback, heartbeat/subagent/compaction override, hook, channel model override, 오래된 persisted session route state를 포함하여 영향을 받는 default-agent 및 per-agent ref를 다시 작성합니다.

    - `openai-codex/gpt-*`는 `openai/gpt-*`가 됩니다.
    - Codex 의도는 복구된 agent model ref의 provider/model 범위 `agentRuntime.id: "codex"` 항목으로 이동하므로, model ref가 `openai/*`가 된 뒤에도 `openai-codex:...` auth profile을 계속 선택할 수 있습니다.
    - runtime 선택이 provider/model 범위이므로 오래된 whole-agent runtime config 및 persisted session runtime pin이 제거됩니다.
    - 복구된 레거시 model ref가 기존 auth 경로를 유지하기 위해 Codex 라우팅이 필요한 경우가 아니면 기존 provider/model runtime policy가 보존됩니다.
    - 기존 model fallback 목록은 레거시 항목을 다시 작성한 채 보존됩니다. 복사된 per-model 설정은 레거시 키에서 정식 `openai/*` 키로 이동합니다.
    - Persisted session `modelProvider`/`providerOverride`, `model`/`modelOverride`, fallback notice, auth-profile pin은 발견된 모든 agent session store에서 복구됩니다.
    - `/codex ...`는 "채팅에서 네이티브 Codex 대화를 제어하거나 바인딩"한다는 뜻입니다.
    - `/acp ...` 또는 `runtime: "acp"`는 "외부 ACP/acpx adapter를 사용"한다는 뜻입니다.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor는 구성된 모델 또는 runtime을 Codex 같은 Plugin 소유 route에서 다른 곳으로 이동한 뒤 남아 있는 오래된 자동 생성 route state가 있는지도 발견된 agent session store에서 스캔합니다.

    `openclaw doctor --fix`는 소유 route가 더 이상 구성되어 있지 않을 때 `modelOverrideSource: "auto"` model pin, runtime model metadata, pinned harness id, CLI session binding, auto auth-profile override 같은 자동 생성된 오래된 state를 정리할 수 있습니다. 명시적인 사용자 또는 레거시 session model 선택은 수동 검토 대상으로 보고되며 그대로 둡니다. 해당 route가 더 이상 의도되지 않은 경우 `/model ...`, `/new`로 전환하거나 session을 reset하세요.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor는 이전 on-disk layout을 현재 구조로 마이그레이션할 수 있습니다.

    - Session store + transcript:
      - `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
    - Agent dir:
      - `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
    - WhatsApp auth state(Baileys):
      - 레거시 `~/.openclaw/credentials/*.json`에서(`oauth.json` 제외)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...`로(기본 account id: `default`)

    이러한 마이그레이션은 best-effort이며 멱등적입니다. doctor는 백업으로 남겨 둔 레거시 폴더가 있으면 경고를 출력합니다. Gateway/CLI도 시작 시 레거시 sessions + agent dir를 자동 마이그레이션하므로 history/auth/models가 수동 doctor 실행 없이 per-agent 경로에 위치합니다. WhatsApp auth는 의도적으로 `openclaw doctor`를 통해서만 마이그레이션됩니다. Talk provider/provider-map 정규화는 이제 구조적 동등성으로 비교하므로, key-order-only diff는 더 이상 반복적인 무효 `doctor --fix` 변경을 트리거하지 않습니다.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor는 설치된 모든 Plugin manifest에서 사용 중단된 최상위 capability 키(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`)를 스캔합니다. 발견되면 이를 `contracts` 객체로 이동하고 manifest 파일을 in-place로 다시 작성하라고 제안합니다. 이 마이그레이션은 멱등적입니다. `contracts` 키에 이미 동일한 값이 있으면 데이터 중복 없이 레거시 키가 제거됩니다.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor는 cron job store(기본값 `~/.openclaw/cron/jobs.json`, 또는 override된 경우 `cron.store`)에서 scheduler가 호환성을 위해 아직 허용하는 오래된 job shape도 확인합니다.

    현재 cron 정리에는 다음이 포함됩니다.

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 최상위 payload 필드(`message`, `model`, `thinking`, ...) → `payload`
    - 최상위 delivery 필드(`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` delivery 별칭 → 명시적 `delivery.channel`
    - 단순 레거시 `notify: true` webhook 폴백 작업 → `delivery.to=cron.webhook`가 포함된 명시적 `delivery.mode="webhook"`

    Doctor는 동작을 변경하지 않고 수행할 수 있을 때만 `notify: true` 작업을 자동 마이그레이션합니다. 작업이 레거시 notify 폴백과 기존 비-webhook delivery 모드를 함께 사용하는 경우, doctor는 경고하고 해당 작업을 수동 검토 대상으로 남겨 둡니다.

    Linux에서 doctor는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 호출하는 경우에도 경고합니다. 이 호스트 로컬 스크립트는 현재 OpenClaw에서 유지 관리되지 않으며, cron이 systemd 사용자 버스에 도달할 수 없을 때 `~/.openclaw/logs/whatsapp-health.log`에 잘못된 `Gateway inactive` 메시지를 쓸 수 있습니다. 오래된 crontab 항목은 `crontab -e`로 제거하세요. 현재 상태 검사는 `openclaw channels status --probe`, `openclaw doctor`, `openclaw gateway status`를 사용하세요.

  </Accordion>
  <Accordion title="3c. 세션 잠금 정리">
    Doctor는 모든 에이전트 세션 디렉터리에서 오래된 쓰기 잠금 파일, 즉 세션이 비정상적으로 종료될 때 남겨진 파일을 스캔합니다. 발견된 각 잠금 파일에 대해 경로, PID, 해당 PID가 아직 살아 있는지 여부, 잠금 기간, 오래된 것으로 간주되는지 여부(죽은 PID, 30분 초과, 또는 OpenClaw가 아닌 프로세스에 속함을 입증할 수 있는 살아 있는 PID)를 보고합니다. `--fix` / `--repair` 모드에서는 오래된 잠금 파일을 자동으로 제거합니다. 그렇지 않으면 참고 메시지를 출력하고 `--fix`로 다시 실행하라고 안내합니다.
  </Accordion>
  <Accordion title="3d. 세션 transcript 브랜치 복구">
    Doctor는 2026.4.24 prompt transcript 재작성 버그로 생성된 중복 브랜치 형태를 찾기 위해 에이전트 세션 JSONL 파일을 스캔합니다. 이 형태는 OpenClaw 내부 런타임 컨텍스트가 있는 버려진 사용자 턴과 동일한 표시 사용자 프롬프트를 포함하는 활성 형제 항목으로 구성됩니다. `--fix` / `--repair` 모드에서 doctor는 영향을 받은 각 파일을 원본 옆에 백업한 뒤 transcript를 활성 브랜치로 다시 작성하여 gateway 기록과 memory 리더가 더 이상 중복 턴을 보지 않도록 합니다.
  </Accordion>
  <Accordion title="4. 상태 무결성 검사(세션 지속성, 라우팅, 안전성)">
    상태 디렉터리는 운영상의 뇌간입니다. 이 디렉터리가 사라지면 다른 곳에 백업이 없는 한 세션, 자격 증명, 로그, config를 잃게 됩니다.

    Doctor가 검사하는 항목:

    - **상태 디렉터리 없음**: 치명적인 상태 손실을 경고하고, 디렉터리를 다시 만들지 묻고, 누락된 데이터는 복구할 수 없음을 알려 줍니다.
    - **상태 디렉터리 권한**: 쓰기 가능 여부를 확인합니다. 권한 복구를 제안하며, 소유자/그룹 불일치가 감지되면 `chown` 힌트를 출력합니다.
    - **macOS 클라우드 동기화 상태 디렉터리**: 상태가 iCloud Drive(`~/Library/Mobile Documents/com~apple~CloudDocs/...`) 또는 `~/Library/CloudStorage/...` 아래로 해석되면 경고합니다. 동기화 기반 경로는 I/O를 느리게 만들고 잠금/동기화 경합을 일으킬 수 있기 때문입니다.
    - **Linux SD 또는 eMMC 상태 디렉터리**: 상태가 `mmcblk*` 마운트 소스로 해석되면 경고합니다. SD 또는 eMMC 기반 랜덤 I/O는 세션 및 자격 증명 쓰기에서 더 느리고 더 빨리 마모될 수 있기 때문입니다.
    - **세션 디렉터리 없음**: `sessions/`와 세션 저장소 디렉터리는 기록을 지속하고 `ENOENT` 크래시를 피하는 데 필요합니다.
    - **Transcript 불일치**: 최근 세션 항목에 transcript 파일이 없으면 경고합니다.
    - **기본 세션 "1-line JSONL"**: 기본 transcript가 한 줄뿐인 경우 표시합니다(기록이 누적되지 않음).
    - **여러 상태 디렉터리**: 여러 홈 디렉터리에 걸쳐 여러 `~/.openclaw` 폴더가 있거나 `OPENCLAW_STATE_DIR`가 다른 곳을 가리키면 경고합니다(설치 간에 기록이 분리될 수 있음).
    - **원격 모드 알림**: `gateway.mode=remote`인 경우 doctor는 원격 호스트에서 실행하라고 알려 줍니다(상태는 그곳에 있음).
    - **Config 파일 권한**: `~/.openclaw/openclaw.json`이 그룹/전체 읽기 가능이면 경고하고 `600`으로 강화하도록 제안합니다.

  </Accordion>
  <Accordion title="5. 모델 인증 상태(OAuth 만료)">
    Doctor는 인증 저장소의 OAuth 프로필을 검사하고, 토큰이 곧 만료되거나 만료된 경우 경고하며, 안전한 경우 이를 새로 고칠 수 있습니다. Anthropic OAuth/토큰 프로필이 오래된 경우 Anthropic API 키 또는 Anthropic setup-token 경로를 제안합니다. 새로 고침 프롬프트는 대화형(TTY)으로 실행 중일 때만 나타나며, `--non-interactive`는 새로 고침 시도를 건너뜁니다.

    OAuth 새로 고침이 영구적으로 실패하는 경우(예: `refresh_token_reused`, `invalid_grant`, 또는 provider가 다시 로그인하라고 알리는 경우), doctor는 재인증이 필요하다고 보고하고 실행할 정확한 `openclaw models auth login --provider ...` 명령을 출력합니다.

    Doctor는 다음으로 인해 일시적으로 사용할 수 없는 인증 프로필도 보고합니다.

    - 짧은 cooldown(속도 제한/timeout/인증 실패)
    - 더 긴 비활성화(결제/크레딧 실패)

  </Accordion>
  <Accordion title="6. hooks 모델 검증">
    `hooks.gmail.model`이 설정된 경우 doctor는 모델 참조를 catalog 및 allowlist와 대조해 검증하고, 해석되지 않거나 허용되지 않는 경우 경고합니다.
  </Accordion>
  <Accordion title="7. sandbox 이미지 복구">
    sandboxing이 활성화되면 doctor는 Docker 이미지를 검사하고 현재 이미지가 없을 경우 빌드하거나 레거시 이름으로 전환하도록 제안합니다.
  </Accordion>
  <Accordion title="7b. Plugin 설치 정리">
    Doctor는 `openclaw doctor --fix` / `openclaw doctor --repair` 모드에서 레거시 OpenClaw 생성 Plugin dependency staging 상태를 제거합니다. 여기에는 오래된 생성 dependency 루트, 이전 install-stage 디렉터리, 이전 bundled-plugin dependency 복구 코드가 남긴 package-local 잔해, 현재 bundled manifest를 가릴 수 있는 고아 상태 또는 복구된 managed npm bundled `@openclaw/*` plugins 복사본이 포함됩니다.

    Doctor는 config가 참조하지만 로컬 plugin registry가 찾을 수 없는 누락된 다운로드 가능 plugins도 다시 설치할 수 있습니다. 예로는 실제 `plugins.entries`, 구성된 channel/provider/search 설정, 구성된 에이전트 runtime이 있습니다. package 업데이트 중에는 core package가 교체되는 동안 doctor가 package-manager plugin 복구를 실행하지 않습니다. 구성된 Plugin에 여전히 복구가 필요하면 업데이트 후 `openclaw doctor --fix`를 다시 실행하세요. Gateway 시작과 config reload는 package manager를 실행하지 않습니다. Plugin 설치는 명시적인 doctor/install/update 작업으로 남습니다.

  </Accordion>
  <Accordion title="8. Gateway 서비스 마이그레이션 및 정리 힌트">
    Doctor는 레거시 gateway 서비스(launchd/systemd/schtasks)를 감지하고, 이를 제거한 뒤 현재 gateway 포트를 사용하는 OpenClaw 서비스를 설치하도록 제안합니다. 추가 gateway 유사 서비스를 스캔하고 정리 힌트를 출력할 수도 있습니다. 프로필 이름이 붙은 OpenClaw gateway 서비스는 일급 서비스로 간주되며 "extra"로 표시되지 않습니다.

    Linux에서 사용자 수준 gateway 서비스가 없지만 시스템 수준 OpenClaw gateway 서비스가 존재하는 경우, doctor는 두 번째 사용자 수준 서비스를 자동으로 설치하지 않습니다. `openclaw gateway status --deep` 또는 `openclaw doctor --deep`로 검사한 다음, 중복 항목을 제거하거나 시스템 supervisor가 gateway lifecycle을 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요.

  </Accordion>
  <Accordion title="8b. Startup Matrix 마이그레이션">
    Matrix channel 계정에 보류 중이거나 조치 가능한 레거시 상태 마이그레이션이 있는 경우, doctor는 (`--fix` / `--repair` 모드에서) 마이그레이션 전 스냅샷을 만든 뒤 최선 노력 방식의 마이그레이션 단계인 레거시 Matrix 상태 마이그레이션과 레거시 암호화 상태 준비를 실행합니다. 두 단계 모두 치명적이지 않으며, 오류는 로그에 기록되고 startup은 계속됩니다. 읽기 전용 모드(`--fix` 없이 `openclaw doctor`)에서는 이 검사를 완전히 건너뜁니다.
  </Accordion>
  <Accordion title="8c. 기기 페어링 및 인증 drift">
    Doctor는 이제 일반 상태 점검의 일부로 기기 페어링 상태를 검사합니다.

    보고 항목:

    - 보류 중인 최초 페어링 요청
    - 이미 페어링된 기기의 보류 중인 역할 업그레이드
    - 이미 페어링된 기기의 보류 중인 scope 업그레이드
    - device id는 여전히 일치하지만 기기 identity가 더 이상 승인된 기록과 일치하지 않는 public-key 불일치 복구
    - 승인된 역할에 대한 활성 토큰이 없는 페어링 기록
    - scope가 승인된 페어링 baseline을 벗어난 페어링 토큰
    - gateway 측 토큰 rotation보다 오래되었거나 오래된 scope metadata를 가진 현재 머신의 로컬 캐시 device-token 항목

    Doctor는 페어링 요청을 자동 승인하거나 device token을 자동 회전하지 않습니다. 대신 정확한 다음 단계를 출력합니다.

    - `openclaw devices list`로 보류 중인 요청 검사
    - `openclaw devices approve <requestId>`로 정확한 요청 승인
    - `openclaw devices rotate --device <deviceId> --role <role>`로 새 토큰 회전
    - `openclaw devices remove <deviceId>`로 오래된 기록 제거 및 재승인

    이는 흔한 "이미 페어링되었지만 여전히 페어링 필요가 표시됨" 문제를 닫습니다. doctor는 이제 최초 페어링, 보류 중인 역할/scope 업그레이드, 오래된 토큰/device-identity drift를 구분합니다.

  </Accordion>
  <Accordion title="9. 보안 경고">
    Doctor는 provider가 allowlist 없이 DM에 열려 있거나 policy가 위험한 방식으로 구성된 경우 경고를 출력합니다.
  </Accordion>
  <Accordion title="10. systemd linger(Linux)">
    systemd 사용자 서비스로 실행 중인 경우 doctor는 로그아웃 후에도 gateway가 살아 있도록 lingering이 활성화되어 있는지 확인합니다.
  </Accordion>
  <Accordion title="11. 워크스페이스 상태(skills, plugins, 레거시 디렉터리)">
    Doctor는 기본 에이전트에 대한 워크스페이스 상태 요약을 출력합니다.

    - **Skills 상태**: eligible, missing-requirements, allowlist-blocked Skills 수를 셉니다.
    - **레거시 워크스페이스 디렉터리**: `~/openclaw` 또는 기타 레거시 워크스페이스 디렉터리가 현재 워크스페이스와 함께 존재하면 경고합니다.
    - **Plugin 상태**: enabled/disabled/errored plugins 수를 셉니다. 오류가 있는 Plugin ID를 나열하고 bundle plugin capabilities를 보고합니다.
    - **Plugin 호환성 경고**: 현재 runtime과 호환성 문제가 있는 plugins를 표시합니다.
    - **Plugin diagnostics**: plugin registry가 load-time에 출력한 warning 또는 error를 드러냅니다.

  </Accordion>
  <Accordion title="11b. Bootstrap 파일 크기">
    Doctor는 워크스페이스 bootstrap 파일(예: `AGENTS.md`, `CLAUDE.md`, 기타 주입된 context 파일)이 구성된 문자 예산에 근접하거나 초과했는지 검사합니다. 파일별 raw 문자 수와 injected 문자 수, truncation 비율, truncation 원인(`max/file` 또는 `max/total`), 총 예산 대비 총 injected 문자 비율을 보고합니다. 파일이 truncate되었거나 한도에 가까운 경우 doctor는 `agents.defaults.bootstrapMaxChars` 및 `agents.defaults.bootstrapTotalMaxChars` 조정을 위한 팁을 출력합니다.
  </Accordion>
  <Accordion title="11d. 오래된 channel Plugin 정리">
    `openclaw doctor --fix`가 누락된 channel Plugin을 제거할 때, 해당 Plugin을 참조하던 dangling channel-scoped config도 함께 제거합니다. `channels.<id>` 항목, 해당 channel을 지정한 Heartbeat 대상, `agents.*.models["<channel>/*"]` override가 포함됩니다. 이를 통해 channel runtime은 사라졌지만 config가 여전히 gateway에 해당 channel 바인딩을 요청하는 Gateway boot loop를 방지합니다.
  </Accordion>
  <Accordion title="11c. 셸 completion">
    Doctor는 현재 셸(zsh, bash, fish, PowerShell)에 tab completion이 설치되어 있는지 확인합니다.

    - 셸 프로필이 느린 동적 completion 패턴(`source <(openclaw completion ...)`)을 사용하는 경우, doctor는 이를 더 빠른 캐시 파일 변형으로 업그레이드합니다.
    - completion이 프로필에 구성되어 있지만 캐시 파일이 없는 경우, doctor는 캐시를 자동으로 다시 생성합니다.
    - completion이 전혀 구성되어 있지 않은 경우, doctor는 설치를 묻습니다(대화형 모드만 해당, `--non-interactive`에서는 건너뜀).

    캐시를 수동으로 다시 생성하려면 `openclaw completion --write-state`를 실행하세요.

  </Accordion>
  <Accordion title="12. Gateway 인증 확인(로컬 토큰)">
    Doctor는 로컬 gateway 토큰 인증 준비 상태를 확인합니다.

    - 토큰 모드에 토큰이 필요하지만 토큰 소스가 없으면, doctor가 생성을 제안합니다.
    - `gateway.auth.token`이 SecretRef로 관리되지만 사용할 수 없으면, doctor가 경고하고 이를 평문으로 덮어쓰지 않습니다.
    - `openclaw doctor --generate-gateway-token`은 토큰 SecretRef가 구성되지 않은 경우에만 생성을 강제합니다.

  </Accordion>
  <Accordion title="12b. 읽기 전용 SecretRef 인식 복구">
    일부 복구 흐름은 런타임의 빠른 실패 동작을 약화하지 않고 구성된 자격 증명을 검사해야 합니다.

    - 이제 `openclaw doctor --fix`는 대상 지정 config 복구에 status 계열 명령과 동일한 읽기 전용 SecretRef 요약 모델을 사용합니다.
    - 예: Telegram `allowFrom` / `groupAllowFrom` `@username` 복구는 사용 가능한 경우 구성된 봇 자격 증명을 사용하려고 시도합니다.
    - Telegram 봇 토큰이 SecretRef를 통해 구성되었지만 현재 명령 경로에서 사용할 수 없는 경우, doctor는 충돌하거나 토큰이 누락되었다고 잘못 보고하는 대신 자격 증명이 구성되었지만 사용할 수 없다고 보고하고 자동 해석을 건너뜁니다.

  </Accordion>
  <Accordion title="13. Gateway 상태 확인 + 재시작">
    Doctor는 상태 확인을 실행하고 gateway가 비정상으로 보이면 재시작을 제안합니다.
  </Accordion>
  <Accordion title="13b. 메모리 검색 준비 상태">
    Doctor는 구성된 메모리 검색 임베딩 제공자가 기본 에이전트에 대해 준비되었는지 확인합니다. 동작은 구성된 백엔드와 제공자에 따라 달라집니다.

    - **QMD 백엔드**: `qmd` 바이너리를 사용할 수 있고 시작할 수 있는지 검사합니다. 그렇지 않으면 npm 패키지와 수동 바이너리 경로 옵션을 포함한 수정 안내를 출력합니다.
    - **명시적 로컬 제공자**: 로컬 모델 파일 또는 인식된 원격/다운로드 가능한 모델 URL이 있는지 확인합니다. 누락된 경우 원격 제공자로 전환할 것을 제안합니다.
    - **명시적 원격 제공자**(`openai`, `voyage` 등): 환경 또는 인증 저장소에 API 키가 있는지 확인합니다. 누락된 경우 실행 가능한 수정 힌트를 출력합니다.
    - **자동 제공자**: 먼저 로컬 모델 가용성을 확인한 다음, 자동 선택 순서대로 각 원격 제공자를 시도합니다.

    캐시된 gateway 검사 결과를 사용할 수 있는 경우(확인 시점에 gateway가 정상 상태였던 경우), doctor는 해당 결과를 CLI에서 볼 수 있는 config와 교차 확인하고 불일치가 있으면 이를 알립니다. Doctor는 기본 경로에서 새 임베딩 ping을 시작하지 않습니다. 실시간 제공자 확인이 필요하면 deep 메모리 상태 명령을 사용하세요.

    런타임에서 임베딩 준비 상태를 확인하려면 `openclaw memory status --deep`을 사용하세요.

  </Accordion>
  <Accordion title="14. 채널 상태 경고">
    Gateway가 정상 상태이면 doctor는 채널 상태 검사를 실행하고 제안된 수정 사항과 함께 경고를 보고합니다.
  </Accordion>
  <Accordion title="15. Supervisor config 감사 + 복구">
    Doctor는 설치된 supervisor config(launchd/systemd/schtasks)에 누락되었거나 오래된 기본값(예: systemd network-online 의존성과 재시작 지연)이 있는지 확인합니다. 불일치를 발견하면 업데이트를 권장하고 서비스 파일/작업을 현재 기본값으로 다시 작성할 수 있습니다.

    참고:

    - `openclaw doctor`는 supervisor config를 다시 작성하기 전에 확인을 요청합니다.
    - `openclaw doctor --yes`는 기본 복구 프롬프트를 수락합니다.
    - `openclaw doctor --repair`는 프롬프트 없이 권장 수정 사항을 적용합니다.
    - `openclaw doctor --repair --force`는 사용자 지정 supervisor config를 덮어씁니다.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`은 gateway 서비스 수명 주기에 대해 doctor를 읽기 전용으로 유지합니다. 서비스 상태를 계속 보고하고 비서비스 복구를 실행하지만, 외부 supervisor가 해당 수명 주기를 소유하므로 서비스 설치/시작/재시작/bootstrap, supervisor config 재작성, 레거시 서비스 정리를 건너뜁니다.
    - Linux에서 doctor는 일치하는 systemd gateway 유닛이 활성 상태인 동안 명령/엔트리포인트 메타데이터를 다시 작성하지 않습니다. 또한 중복 서비스 검사 중 비활성 비레거시 추가 gateway 유사 유닛을 무시하여 보조 서비스 파일이 정리 잡음을 만들지 않도록 합니다.
    - 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, doctor 서비스 설치/복구는 SecretRef를 검증하지만 해석된 평문 토큰 값을 supervisor 서비스 환경 메타데이터에 저장하지 않습니다.
    - Doctor는 이전 LaunchAgent, systemd 또는 Windows Scheduled Task 설치가 인라인으로 포함한 관리형 `.env`/SecretRef 기반 서비스 환경 값을 감지하고, 해당 값이 supervisor 정의 대신 런타임 소스에서 로드되도록 서비스 메타데이터를 다시 작성합니다.
    - Doctor는 `gateway.port`가 변경된 후에도 서비스 명령이 여전히 이전 `--port`를 고정하고 있는 경우를 감지하고, 서비스 메타데이터를 현재 포트로 다시 작성합니다.
    - 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 해석되지 않은 경우, doctor는 실행 가능한 안내와 함께 설치/복구 경로를 차단합니다.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, doctor는 모드가 명시적으로 설정될 때까지 설치/복구를 차단합니다.
    - Linux 사용자 systemd 유닛의 경우, doctor 토큰 드리프트 확인은 이제 서비스 인증 메타데이터를 비교할 때 `Environment=`와 `EnvironmentFile=` 소스를 모두 포함합니다.
    - Doctor 서비스 복구는 config가 더 최신 버전에서 마지막으로 작성된 경우, 더 오래된 OpenClaw 바이너리의 gateway 서비스를 다시 작성하거나 중지하거나 재시작하는 것을 거부합니다. [Gateway 문제 해결](/ko/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)을 참조하세요.
    - 언제든지 `openclaw gateway install --force`를 통해 전체 재작성을 강제할 수 있습니다.

  </Accordion>
  <Accordion title="16. Gateway 런타임 + 포트 진단">
    Doctor는 서비스 런타임(PID, 마지막 종료 상태)을 검사하고 서비스가 설치되어 있지만 실제로 실행 중이 아닐 때 경고합니다. 또한 gateway 포트(기본값 `18789`)에서 포트 충돌을 확인하고 가능한 원인(gateway가 이미 실행 중, SSH 터널)을 보고합니다.
  </Accordion>
  <Accordion title="17. Gateway 런타임 모범 사례">
    Doctor는 gateway 서비스가 Bun 또는 버전 관리 Node 경로(`nvm`, `fnm`, `volta`, `asdf` 등)에서 실행될 때 경고합니다. WhatsApp + Telegram 채널에는 Node가 필요하며, 서비스가 셸 초기화를 로드하지 않기 때문에 버전 관리자 경로는 업그레이드 후 깨질 수 있습니다. Doctor는 사용 가능한 경우 시스템 Node 설치(Homebrew/apt/choco)로 마이그레이션할 것을 제안합니다.

    새로 설치되거나 복구된 macOS LaunchAgent는 대화형 셸 PATH를 복사하는 대신 표준 시스템 PATH(`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`)를 사용하므로, Homebrew로 관리되는 시스템 바이너리는 계속 사용할 수 있고 Volta, asdf, fnm, pnpm 및 기타 버전 관리자 디렉터리는 Node 자식 프로세스가 해석하는 대상을 변경하지 않습니다. Linux 서비스는 여전히 명시적 환경 루트(`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`)와 안정적인 사용자 bin 디렉터리를 유지하지만, 추정된 버전 관리자 fallback 디렉터리는 해당 디렉터리가 디스크에 존재할 때만 서비스 PATH에 기록됩니다.

  </Accordion>
  <Accordion title="18. Config 쓰기 + 마법사 메타데이터">
    Doctor는 모든 config 변경 사항을 저장하고 doctor 실행을 기록하기 위해 마법사 메타데이터를 찍습니다.
  </Accordion>
  <Accordion title="19. 작업 영역 팁(백업 + 메모리 시스템)">
    Doctor는 작업 영역 메모리 시스템이 없으면 이를 제안하고, 작업 영역이 아직 git 아래에 있지 않은 경우 백업 팁을 출력합니다.

    작업 영역 구조와 git 백업(비공개 GitHub 또는 GitLab 권장)에 대한 전체 가이드는 [/concepts/agent-workspace](/ko/concepts/agent-workspace)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [Gateway 실행 안내서](/ko/gateway)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
