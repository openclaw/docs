---
read_when:
    - doctor 마이그레이션 추가 또는 수정
    - 호환성을 깨는 설정 변경 도입
sidebarTitle: Doctor
summary: 'doctor 명령: 상태 점검, 구성 마이그레이션 및 복구 단계'
title: 진단
x-i18n:
    generated_at: "2026-05-12T08:45:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53d67fcc5ab4a356747bc4f4af0c5d42cbdae0c89a41616aaded7589e408a017
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`는 OpenClaw의 복구 + 마이그레이션 도구입니다. 오래된 구성/상태를 수정하고, 상태를 점검하며, 실행 가능한 복구 단계를 제공합니다.

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

    공격적인 복구도 적용합니다(사용자 지정 슈퍼바이저 구성을 덮어씀).

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

## 수행 작업(요약)

<AccordionGroup>
  <Accordion title="상태, UI 및 업데이트">
    - git 설치에 대한 선택적 사전 업데이트(대화형 전용).
    - UI 프로토콜 최신성 검사(프로토콜 스키마가 더 최신이면 Control UI를 다시 빌드).
    - 상태 검사 + 재시작 프롬프트.
    - Skills 상태 요약(적격/누락/차단됨) 및 Plugin 상태.

  </Accordion>
  <Accordion title="구성 및 마이그레이션">
    - 레거시 값에 대한 구성 정규화.
    - 레거시 플랫 `talk.*` 필드에서 `talk.provider` + `talk.providers.<provider>`로 Talk 구성 마이그레이션.
    - 레거시 Chrome 확장 프로그램 구성 및 Chrome MCP 준비 상태에 대한 브라우저 마이그레이션 검사.
    - OpenCode 제공자 재정의 경고(`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth 섀도잉 경고(`models.providers.openai-codex`).
    - OpenAI Codex OAuth 프로필에 대한 OAuth TLS 필수 조건 검사.
    - `plugins.allow`는 제한적이지만 도구 정책이 여전히 와일드카드 또는 Plugin 소유 도구를 요청할 때 Plugin/도구 허용 목록 경고.
    - 레거시 디스크상 상태 마이그레이션(세션/에이전트 디렉터리/WhatsApp 인증).
    - 레거시 Plugin 매니페스트 계약 키 마이그레이션(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - 레거시 Cron 저장소 마이그레이션(`jobId`, `schedule.cron`, 최상위 delivery/payload 필드, payload `provider`, 단순 `notify: true` Webhook 폴백 작업).
    - 레거시 전체 에이전트 런타임 정책 정리. 제공자/모델 런타임 정책이 활성 경로 선택기입니다.
    - Plugin이 활성화된 경우 오래된 Plugin 구성 정리. `plugins.enabled=false`인 경우 오래된 Plugin 참조는 비활성 격리 구성으로 간주되어 보존됩니다.

  </Accordion>
  <Accordion title="상태 및 무결성">
    - 세션 잠금 파일 검사 및 오래된 잠금 정리.
    - 영향을 받은 2026.4.24 빌드에서 생성된 중복 프롬프트 재작성 브랜치에 대한 세션 전사 복구.
    - 멈춘 하위 에이전트 재시작 복구 묘비 감지. 시작 시 해당 자식을 계속 재시작 중단으로 처리하지 않도록 오래된 중단 복구 플래그를 지우는 `--fix` 지원 포함.
    - 상태 무결성 및 권한 검사(세션, 전사, 상태 디렉터리).
    - 로컬에서 실행 중일 때 구성 파일 권한 검사(chmod 600).
    - 모델 인증 상태: OAuth 만료를 검사하고, 만료 임박 토큰을 새로 고칠 수 있으며, 인증 프로필 쿨다운/비활성화 상태를 보고합니다.
    - 추가 작업공간 디렉터리 감지(`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, 서비스 및 슈퍼바이저">
    - 샌드박싱이 활성화된 경우 샌드박스 이미지 복구.
    - 레거시 서비스 마이그레이션 및 추가 Gateway 감지.
    - Matrix 채널 레거시 상태 마이그레이션(`--fix` / `--repair` 모드).
    - Gateway 런타임 검사(서비스가 설치되었지만 실행 중이 아님, 캐시된 launchd 레이블).
    - 채널 상태 경고(실행 중인 Gateway에서 프로브됨).
    - 채널별 권한 검사는 `openclaw channels capabilities` 아래에 있습니다. 예를 들어 Discord 음성 채널 권한은 `openclaw channels capabilities --channel discord --target channel:<channel-id>`로 감사합니다.
    - 로컬 TUI 클라이언트가 아직 실행 중인 상태에서 성능이 저하된 Gateway 이벤트 루프 상태에 대한 WhatsApp 응답성 검사. `--fix`는 확인된 로컬 TUI 클라이언트만 중지합니다.
    - 기본 모델, 폴백, Heartbeat/하위 에이전트/Compaction 재정의, 훅, 채널 모델 재정의, 세션 경로 핀의 레거시 `openai-codex/*` 모델 참조에 대한 Codex 경로 복구. `--fix`는 이를 `openai/*`로 다시 쓰고, 오래된 세션/전체 에이전트 런타임 핀을 제거하며, 정식 OpenAI 에이전트 참조를 기본 Codex 하네스에 남깁니다.
    - 선택적 복구가 포함된 슈퍼바이저 구성 감사(launchd/systemd/schtasks).
    - 설치 또는 업데이트 중 셸 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 값을 캡처한 Gateway 서비스에 대한 임베디드 프록시 환경 정리.
    - Gateway 런타임 모범 사례 검사(Node 대 Bun, 버전 관리자 경로).
    - Gateway 포트 충돌 진단(기본값 `18789`).

  </Accordion>
  <Accordion title="인증, 보안 및 페어링">
    - 열린 DM 정책에 대한 보안 경고.
    - local token 모드에 대한 Gateway 인증 검사(토큰 소스가 없을 때 토큰 생성을 제안하며, token SecretRef 구성을 덮어쓰지 않음).
    - 기기 페어링 문제 감지(대기 중인 최초 페어링 요청, 대기 중인 역할/범위 업그레이드, 오래된 로컬 기기 토큰 캐시 드리프트, 페어링된 레코드 인증 드리프트).

  </Accordion>
  <Accordion title="작업공간 및 셸">
    - Linux에서 systemd linger 검사.
    - 작업공간 부트스트랩 파일 크기 검사(컨텍스트 파일의 잘림/한계 근접 경고).
    - 기본 에이전트에 대한 Skills 준비 상태 검사. 누락된 바이너리, 환경, 구성 또는 OS 요구 사항이 있는 허용된 Skills를 보고하며, `--fix`는 `skills.entries`에서 사용할 수 없는 Skills를 비활성화할 수 있습니다.
    - 셸 completion 상태 검사 및 자동 설치/업그레이드.
    - 메모리 검색 임베딩 제공자 준비 상태 검사(로컬 모델, 원격 API 키 또는 QMD 바이너리).
    - 소스 설치 검사(pnpm 작업공간 불일치, 누락된 UI 자산, 누락된 tsx 바이너리).
    - 업데이트된 구성 + 마법사 메타데이터를 씁니다.

  </Accordion>
</AccordionGroup>

## Dreams UI 백필 및 재설정

Control UI Dreams 장면에는 grounded Dreaming 워크플로를 위한 **백필**, **재설정**, **Grounded 지우기** 작업이 포함됩니다. 이 작업들은 Gateway doctor 스타일 RPC 메서드를 사용하지만, `openclaw doctor` CLI 복구/마이그레이션의 일부는 **아닙니다**.

수행하는 작업:

- **백필**은 활성 작업공간의 과거 `memory/YYYY-MM-DD.md` 파일을 스캔하고, grounded REM 일기 패스를 실행하며, 되돌릴 수 있는 백필 항목을 `DREAMS.md`에 씁니다.
- **재설정**은 `DREAMS.md`에서 표시된 해당 백필 일기 항목만 제거합니다.
- **Grounded 지우기**는 과거 재생에서 왔고 아직 실시간 회상 또는 일일 지원을 축적하지 않은, 스테이징된 grounded 전용 단기 항목만 제거합니다.

자체적으로 수행하지 **않는** 작업:

- `MEMORY.md`를 편집하지 않습니다
- 전체 doctor 마이그레이션을 실행하지 않습니다
- 스테이징된 CLI 경로를 먼저 명시적으로 실행하지 않는 한 grounded 후보를 라이브 단기 승격 저장소에 자동으로 스테이징하지 않습니다

grounded 과거 재생이 일반적인 깊은 승격 경로에 영향을 주게 하려면 대신 CLI 플로를 사용하세요.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

이는 `DREAMS.md`를 검토 표면으로 유지하면서 grounded 지속 후보를 단기 Dreaming 저장소에 스테이징합니다.

## 자세한 동작 및 근거

<AccordionGroup>
  <Accordion title="0. 선택적 업데이트(git 설치)">
    이것이 git 체크아웃이고 doctor가 대화형으로 실행 중이면, doctor 실행 전에 업데이트(fetch/rebase/build)를 제안합니다.
  </Accordion>
  <Accordion title="1. 구성 정규화">
    구성에 레거시 값 형태가 포함된 경우(예: 채널별 재정의가 없는 `messages.ackReaction`) doctor는 이를 현재 스키마로 정규화합니다.

    여기에는 레거시 Talk 플랫 필드가 포함됩니다. 현재 공개 Talk 음성 구성은 `talk.provider` + `talk.providers.<provider>`이고, 실시간 음성 구성은 `talk.realtime.*`입니다. Doctor는 이전 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 형태를 제공자 맵으로 다시 쓰고, 레거시 최상위 실시간 선택기(`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`)를 `talk.realtime`로 다시 씁니다.

    또한 doctor는 `plugins.allow`가 비어 있지 않고 도구 정책이 와일드카드 또는 Plugin 소유 도구 항목을 사용할 때 경고합니다.
    `tools.allow: ["*"]`는 실제로 로드되는 Plugin의 도구에만 매칭됩니다. 배타적 Plugin 허용 목록을 우회하지 않습니다.
    Doctor는 기존 번들 제공자 동작을 보존하기 위해 마이그레이션된 레거시 허용 목록 구성에 `plugins.bundledDiscovery: "compat"`를 쓰고,
    그런 다음 더 엄격한 `"allowlist"` 설정을 안내합니다.

  </Accordion>
  <Accordion title="2. 레거시 구성 키 마이그레이션">
    구성에 사용 중단된 키가 포함된 경우, 다른 명령은 실행을 거부하고 `openclaw doctor`를 실행하라고 요청합니다.

    Doctor는 다음을 수행합니다.

    - 발견된 레거시 키를 설명합니다.
    - 적용한 마이그레이션을 표시합니다.
    - 업데이트된 스키마로 `~/.openclaw/openclaw.json`을 다시 씁니다.

    Gateway 시작은 레거시 구성 형식을 거부하고 `openclaw doctor --fix`를 실행하라고 요청합니다. 시작 시 `openclaw.json`을 다시 쓰지는 않습니다. Cron 작업 저장소 마이그레이션도 `openclaw doctor --fix`가 처리합니다.

    현재 마이그레이션:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 표시되는 응답 정책이 누락된 구성된 채널 설정 → `messages.groupChat.visibleReplies: "message_tool"`
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
    - 이름 있는 `accounts`가 있지만 단일 계정 최상위 채널 값이 남아 있는 채널의 경우, 해당 계정 범위 값을 그 채널에 대해 선택된 승격 계정으로 이동합니다(대부분의 채널은 `accounts.default`; Matrix는 기존의 일치하는 이름 있는/default 대상을 보존할 수 있음).
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*`(tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` 제거; 느린 공급자/모델 제한 시간에는 `models.providers.<id>.timeoutSeconds` 사용
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` 제거(레거시 확장 relay 설정)
    - 레거시 `models.providers.*.api: "openai"` → `"openai-completions"`(Gateway 시작 시에도 `api`가 미래 또는 알 수 없는 enum 값으로 설정된 공급자는 닫힌 상태로 실패하지 않고 건너뜀)
    - `plugins.entries.codex.config.codexDynamicToolsProfile` 제거; Codex 앱 서버는 항상 Codex 네이티브 워크스페이스 도구를 네이티브로 유지

    Doctor 경고에는 다중 계정 채널에 대한 계정 기본값 지침도 포함됩니다.

    - 두 개 이상의 `channels.<channel>.accounts` 항목이 `channels.<channel>.defaultAccount` 또는 `accounts.default` 없이 구성된 경우, doctor는 fallback 라우팅이 예상치 못한 계정을 선택할 수 있다고 경고합니다.
    - `channels.<channel>.defaultAccount`가 알 수 없는 계정 ID로 설정된 경우, doctor는 경고하고 구성된 계정 ID를 나열합니다.

  </Accordion>
  <Accordion title="2b. OpenCode 공급자 재정의">
    `models.providers.opencode`, `opencode-zen` 또는 `opencode-go`를 수동으로 추가했다면, 이는 `@earendil-works/pi-ai`의 기본 제공 OpenCode 카탈로그를 재정의합니다. 이로 인해 모델이 잘못된 API를 사용하거나 비용이 0으로 설정될 수 있습니다. Doctor는 재정의를 제거하고 모델별 API 라우팅과 비용을 복원할 수 있도록 경고합니다.
  </Accordion>
  <Accordion title="2c. 브라우저 마이그레이션 및 Chrome MCP 준비 상태">
    브라우저 구성이 아직 제거된 Chrome 확장 경로를 가리키는 경우, doctor는 이를 현재 호스트 로컬 Chrome MCP 연결 모델로 정규화합니다.

    - `browser.profiles.*.driver: "extension"`은 `"existing-session"`이 됩니다.
    - `browser.relayBindHost`가 제거됩니다.

    Doctor는 `defaultProfile: "user"` 또는 구성된 `existing-session` 프로필을 사용할 때 호스트 로컬 Chrome MCP 경로도 감사합니다.

    - 기본 자동 연결 프로필에 대해 동일한 호스트에 Google Chrome이 설치되어 있는지 확인합니다.
    - 감지된 Chrome 버전을 확인하고 Chrome 144 미만이면 경고합니다.
    - 브라우저 inspect 페이지에서 원격 디버깅을 활성화하라고 알려줍니다(예: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` 또는 `edge://inspect/#remote-debugging`).

    Doctor는 Chrome 쪽 설정을 대신 활성화할 수 없습니다. 호스트 로컬 Chrome MCP에는 여전히 다음이 필요합니다.

    - Gateway/Node 호스트의 Chromium 기반 브라우저 144+
    - 로컬에서 실행 중인 브라우저
    - 해당 브라우저에서 활성화된 원격 디버깅
    - 브라우저에서 첫 연결 동의 프롬프트 승인

    여기서 준비 상태는 로컬 연결 전제 조건에만 관한 것입니다. Existing-session은 현재 Chrome MCP 라우트 제한을 유지합니다. `responsebody`, PDF 내보내기, 다운로드 가로채기, batch 작업 같은 고급 라우트에는 여전히 관리형 브라우저 또는 raw CDP 프로필이 필요합니다.

    이 검사는 Docker, sandbox, remote-browser 또는 기타 headless 흐름에는 적용되지 않습니다. 이러한 흐름은 계속 raw CDP를 사용합니다.

  </Accordion>
  <Accordion title="2d. OAuth TLS 전제 조건">
    OpenAI Codex OAuth 프로필이 구성된 경우, doctor는 OpenAI 인증 엔드포인트를 검사하여 로컬 Node/OpenSSL TLS 스택이 인증서 체인을 검증할 수 있는지 확인합니다. 검사가 인증서 오류(예: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, 만료된 인증서 또는 자체 서명 인증서)로 실패하면, doctor는 플랫폼별 수정 지침을 출력합니다. Homebrew Node를 사용하는 macOS에서는 일반적으로 `brew postinstall ca-certificates`가 수정 방법입니다. `--deep`을 사용하면 Gateway가 정상이어도 검사가 실행됩니다.
  </Accordion>
  <Accordion title="2e. Codex OAuth 공급자 재정의">
    이전에 `models.providers.openai-codex` 아래에 레거시 OpenAI transport 설정을 추가했다면, 최신 릴리스가 자동으로 사용하는 기본 제공 Codex OAuth 공급자 경로를 가릴 수 있습니다. Doctor는 Codex OAuth와 함께 이러한 오래된 transport 설정이 보이면 경고하므로, 오래된 transport 재정의를 제거하거나 다시 작성하여 기본 제공 라우팅/fallback 동작을 복구할 수 있습니다. 사용자 지정 프록시와 헤더 전용 재정의는 계속 지원되며 이 경고를 트리거하지 않습니다.
  </Accordion>
  <Accordion title="2f. Codex 라우트 복구">
    Doctor는 레거시 `openai-codex/*` 모델 참조를 확인합니다. 네이티브 Codex harness 라우팅은 표준 `openai/*` 모델 참조를 사용합니다. OpenAI 에이전트 턴은 OpenClaw PI OpenAI 경로 대신 Codex 앱 서버 harness를 거칩니다.

    `--fix` / `--repair` 모드에서 doctor는 기본 에이전트 및 에이전트별 참조를 다시 작성합니다. 여기에는 기본 모델, fallback, heartbeat/subagent/compaction 재정의, hooks, 채널 모델 재정의, 오래된 영구 세션 라우트 상태가 포함됩니다.

    - `openai-codex/gpt-*`는 `openai/gpt-*`가 됩니다.
    - 복구된 에이전트 모델 참조에 대해 Codex 의도는 공급자/모델 범위 `agentRuntime.id: "codex"` 항목으로 이동하므로, 모델 참조가 `openai/*`가 된 뒤에도 `openai-codex:...` 인증 프로필을 선택할 수 있습니다.
    - 런타임 선택이 공급자/모델 범위이므로 오래된 전체 에이전트 런타임 구성과 영구 세션 런타임 고정이 제거됩니다.
    - 복구된 레거시 모델 참조가 이전 인증 경로를 유지하기 위해 Codex 라우팅을 필요로 하지 않는 한 기존 공급자/모델 런타임 정책은 보존됩니다.
    - 기존 모델 fallback 목록은 레거시 항목이 다시 작성된 상태로 보존됩니다. 복사된 모델별 설정은 레거시 키에서 표준 `openai/*` 키로 이동합니다.
    - 영구 세션 `modelProvider`/`providerOverride`, `model`/`modelOverride`, fallback 알림 및 인증 프로필 고정은 발견된 모든 에이전트 세션 저장소에서 복구됩니다.
    - `/codex ...`는 "채팅에서 네이티브 Codex 대화를 제어하거나 바인딩"한다는 뜻입니다.
    - `/acp ...` 또는 `runtime: "acp"`는 "외부 ACP/acpx 어댑터를 사용"한다는 뜻입니다.

  </Accordion>
  <Accordion title="2g. 세션 라우트 정리">
    Doctor는 Codex 같은 Plugin 소유 라우트에서 구성된 모델 또는 런타임을 옮긴 뒤 남은 오래된 자동 생성 라우트 상태를 찾기 위해 발견된 에이전트 세션 저장소도 스캔합니다.

    `openclaw doctor --fix`는 소유 라우트가 더 이상 구성되어 있지 않을 때 `modelOverrideSource: "auto"` 모델 고정, 런타임 모델 메타데이터, 고정된 harness ID, CLI 세션 바인딩, 자동 인증 프로필 재정의 같은 자동 생성된 오래된 상태를 정리할 수 있습니다. 명시적 사용자 또는 레거시 세션 모델 선택은 수동 검토 대상으로 보고되고 그대로 유지됩니다. 해당 라우트를 더 이상 의도하지 않는 경우 `/model ...`, `/new`로 전환하거나 세션을 재설정하세요.

  </Accordion>
  <Accordion title="3. 레거시 상태 마이그레이션(디스크 레이아웃)">
    Doctor는 이전 온디스크 레이아웃을 현재 구조로 마이그레이션할 수 있습니다.

    - 세션 저장소 + transcripts:
      - `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
    - 에이전트 디렉터리:
      - `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
    - WhatsApp 인증 상태(Baileys):
      - 레거시 `~/.openclaw/credentials/*.json`에서(`oauth.json` 제외)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...`로(기본 계정 ID: `default`)

    이러한 마이그레이션은 최선 노력 방식이며 멱등적입니다. doctor는 백업으로 남겨 둔 레거시 폴더가 있으면 경고를 내보냅니다. Gateway/CLI도 시작 시 레거시 세션 + 에이전트 디렉터리를 자동으로 마이그레이션하므로, 수동으로 doctor를 실행하지 않아도 기록/인증/모델이 에이전트별 경로에 들어갑니다. WhatsApp 인증은 의도적으로 `openclaw doctor`를 통해서만 마이그레이션됩니다. Talk 공급자/공급자 맵 정규화는 이제 구조적 동등성으로 비교하므로, 키 순서만 다른 diff는 더 이상 반복적인 no-op `doctor --fix` 변경을 트리거하지 않습니다.

  </Accordion>
  <Accordion title="3a. 레거시 Plugin manifest 마이그레이션">
    Doctor는 설치된 모든 Plugin manifest에서 사용 중단된 최상위 capability 키(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`)를 스캔합니다. 발견되면 이를 `contracts` 객체로 이동하고 manifest 파일을 제자리에서 다시 쓰도록 제안합니다. 이 마이그레이션은 멱등적입니다. `contracts` 키에 이미 동일한 값이 있으면 데이터를 중복하지 않고 레거시 키가 제거됩니다.
  </Accordion>
  <Accordion title="3b. 레거시 cron 저장소 마이그레이션">
    Doctor는 cron 작업 저장소(기본값은 `~/.openclaw/cron/jobs.json`, 재정의된 경우 `cron.store`)에서 스케줄러가 호환성을 위해 아직 허용하는 이전 작업 형태도 확인합니다.

    현재 cron 정리에는 다음이 포함됩니다.

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 최상위 payload 필드(`message`, `model`, `thinking`, ...) → `payload`
    - 최상위 delivery 필드(`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` delivery 별칭 → 명시적 `delivery.channel`
    - 단순 레거시 `notify: true` Webhook 폴백 작업 → `delivery.to=cron.webhook`이 포함된 명시적 `delivery.mode="webhook"`

    Doctor는 동작 변경 없이 처리할 수 있는 경우에만 `notify: true` 작업을 자동 마이그레이션합니다. 작업이 레거시 알림 폴백과 기존의 Webhook이 아닌 delivery 모드를 함께 사용하는 경우, doctor는 경고를 표시하고 해당 작업을 수동 검토 대상으로 남겨 둡니다.

    Linux에서 doctor는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 호출하는 경우에도 경고합니다. 이 호스트 로컬 스크립트는 현재 OpenClaw에서 유지 관리되지 않으며, cron이 systemd 사용자 버스에 도달할 수 없을 때 `~/.openclaw/logs/whatsapp-health.log`에 잘못된 `Gateway inactive` 메시지를 쓸 수 있습니다. 오래된 crontab 항목은 `crontab -e`로 제거하세요. 현재 상태 확인에는 `openclaw channels status --probe`, `openclaw doctor`, `openclaw gateway status`를 사용하세요.

  </Accordion>
  <Accordion title="3c. 세션 잠금 정리">
    Doctor는 모든 에이전트 세션 디렉터리에서 오래된 쓰기 잠금 파일, 즉 세션이 비정상 종료될 때 남은 파일을 검사합니다. 발견된 각 잠금 파일에 대해 경로, PID, PID가 아직 살아 있는지 여부, 잠금 경과 시간, 오래된 것으로 간주되는지 여부(죽은 PID, 30분 초과, 또는 OpenClaw 프로세스가 아닌 것으로 증명할 수 있는 살아 있는 PID)를 보고합니다. `--fix` / `--repair` 모드에서는 오래된 잠금 파일을 자동으로 제거합니다. 그렇지 않으면 참고 메시지를 출력하고 `--fix`로 다시 실행하라고 안내합니다.
  </Accordion>
  <Accordion title="3d. 세션 transcript 브랜치 복구">
    Doctor는 에이전트 세션 JSONL 파일에서 2026.4.24 프롬프트 transcript 재작성 버그로 생성된 중복 브랜치 형태를 검사합니다. 이는 OpenClaw 내부 런타임 컨텍스트가 포함된 버려진 사용자 턴과, 동일한 표시 사용자 프롬프트를 포함한 활성 형제 브랜치입니다. `--fix` / `--repair` 모드에서 doctor는 영향을 받은 각 파일을 원본 옆에 백업한 뒤 transcript를 활성 브랜치로 다시 작성하여 Gateway 기록과 메모리 리더가 더 이상 중복 턴을 보지 않도록 합니다.
  </Accordion>
  <Accordion title="4. 상태 무결성 검사(세션 지속성, 라우팅, 안전성)">
    상태 디렉터리는 운영상의 뇌간입니다. 이 디렉터리가 사라지면 세션, 자격 증명, 로그, 설정을 잃게 됩니다(다른 곳에 백업이 없는 경우).

    Doctor가 확인하는 항목:

    - **상태 디렉터리 누락**: 치명적인 상태 손실을 경고하고, 디렉터리 재생성을 묻고, 누락된 데이터는 복구할 수 없다고 알려 줍니다.
    - **상태 디렉터리 권한**: 쓰기 가능 여부를 확인합니다. 권한 복구를 제안하며, 소유자/그룹 불일치가 감지되면 `chown` 힌트를 출력합니다.
    - **macOS 클라우드 동기화 상태 디렉터리**: 상태가 iCloud Drive(`~/Library/Mobile Documents/com~apple~CloudDocs/...`) 또는 `~/Library/CloudStorage/...` 아래로 해석되면 경고합니다. 동기화 기반 경로는 I/O가 느려지고 잠금/동기화 경합을 일으킬 수 있기 때문입니다.
    - **Linux SD 또는 eMMC 상태 디렉터리**: 상태가 `mmcblk*` 마운트 소스로 해석되면 경고합니다. SD 또는 eMMC 기반 랜덤 I/O는 세션 및 자격 증명 쓰기에서 더 느리고 더 빨리 마모될 수 있기 때문입니다.
    - **세션 디렉터리 누락**: 기록을 지속하고 `ENOENT` 크래시를 방지하려면 `sessions/`와 세션 저장소 디렉터리가 필요합니다.
    - **Transcript 불일치**: 최근 세션 항목에 transcript 파일이 없으면 경고합니다.
    - **기본 세션 "1줄 JSONL"**: 기본 transcript가 한 줄뿐인 경우 플래그를 지정합니다(기록이 누적되지 않음).
    - **여러 상태 디렉터리**: 여러 홈 디렉터리에 `~/.openclaw` 폴더가 있거나 `OPENCLAW_STATE_DIR`이 다른 곳을 가리키는 경우 경고합니다(기록이 설치 간에 나뉠 수 있음).
    - **원격 모드 알림**: `gateway.mode=remote`인 경우 doctor는 원격 호스트에서 실행하라고 알려 줍니다(상태가 그곳에 있음).
    - **설정 파일 권한**: `~/.openclaw/openclaw.json`이 그룹/전체 사용자에게 읽기 가능하면 경고하고 `600`으로 강화하도록 제안합니다.

  </Accordion>
  <Accordion title="5. 모델 인증 상태(OAuth 만료)">
    Doctor는 인증 저장소의 OAuth 프로필을 검사하고, 토큰이 곧 만료되거나 만료된 경우 경고하며, 안전한 경우 새로 고칠 수 있습니다. Anthropic OAuth/토큰 프로필이 오래된 경우 Anthropic API 키 또는 Anthropic 설정 토큰 경로를 제안합니다. 새로 고침 프롬프트는 대화형(TTY)으로 실행할 때만 표시됩니다. `--non-interactive`는 새로 고침 시도를 건너뜁니다.

    OAuth 새로 고침이 영구적으로 실패하면(예: `refresh_token_reused`, `invalid_grant`, 또는 provider가 다시 로그인하라고 알리는 경우) doctor는 재인증이 필요하다고 보고하고 실행할 정확한 `openclaw models auth login --provider ...` 명령을 출력합니다.

    Doctor는 다음으로 인해 일시적으로 사용할 수 없는 인증 프로필도 보고합니다.

    - 짧은 cooldown(속도 제한/시간 초과/인증 실패)
    - 더 긴 비활성화(청구/크레딧 실패)

  </Accordion>
  <Accordion title="6. Hooks 모델 검증">
    `hooks.gmail.model`이 설정되어 있으면 doctor는 카탈로그와 allowlist에 대해 모델 참조를 검증하고, 해석되지 않거나 허용되지 않는 경우 경고합니다.
  </Accordion>
  <Accordion title="7. Sandbox 이미지 복구">
    sandboxing이 활성화되어 있으면 doctor는 Docker 이미지를 확인하고 현재 이미지가 없을 경우 빌드하거나 레거시 이름으로 전환하도록 제안합니다.
  </Accordion>
  <Accordion title="7b. Plugin 설치 정리">
    Doctor는 `openclaw doctor --fix` / `openclaw doctor --repair` 모드에서 레거시 OpenClaw 생성 Plugin 의존성 스테이징 상태를 제거합니다. 여기에는 오래된 생성 의존성 루트, 이전 설치 스테이지 디렉터리, 초기 번들 Plugin 의존성 복구 코드에서 남은 패키지 로컬 잔해, 현재 번들 manifest를 가릴 수 있는 고아 또는 복구된 번들 `@openclaw/*` Plugin의 관리형 npm 사본이 포함됩니다. Doctor는 `peerDependencies.openclaw`를 선언하는 관리형 npm Plugin에 호스트 `openclaw` 패키지도 다시 연결하여, 업데이트 또는 npm 복구 이후에도 `openclaw/plugin-sdk/*` 같은 패키지 로컬 런타임 import가 계속 해석되도록 합니다.

    Doctor는 설정이 다운로드 가능한 Plugin을 참조하지만 로컬 Plugin 레지스트리가 찾을 수 없는 경우 누락된 Plugin을 다시 설치할 수도 있습니다. 예로는 실제 `plugins.entries`, 설정된 channel/provider/search 설정, 설정된 에이전트 런타임이 있습니다. 패키지 업데이트 중에는 core 패키지가 교체되는 동안 doctor가 패키지 관리자 Plugin 복구를 실행하지 않습니다. 설정된 Plugin을 여전히 복구해야 하는 경우 업데이트 후 `openclaw doctor --fix`를 다시 실행하세요. Gateway 시작과 설정 다시 로드는 패키지 관리자를 실행하지 않습니다. Plugin 설치는 명시적인 doctor/install/update 작업으로 남습니다.

  </Accordion>
  <Accordion title="8. Gateway 서비스 마이그레이션 및 정리 힌트">
    Doctor는 레거시 Gateway 서비스(launchd/systemd/schtasks)를 감지하고, 이를 제거한 뒤 현재 Gateway 포트를 사용하여 OpenClaw 서비스를 설치하도록 제안합니다. 추가 Gateway 유사 서비스도 검사하고 정리 힌트를 출력할 수 있습니다. 프로필 이름이 붙은 OpenClaw Gateway 서비스는 일급 대상으로 간주되며 "extra"로 플래그되지 않습니다.

    Linux에서 사용자 수준 Gateway 서비스가 없지만 시스템 수준 OpenClaw Gateway 서비스가 있는 경우, doctor는 두 번째 사용자 수준 서비스를 자동으로 설치하지 않습니다. `openclaw gateway status --deep` 또는 `openclaw doctor --deep`로 검사한 다음, 중복을 제거하거나 시스템 supervisor가 Gateway 수명 주기를 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요.

  </Accordion>
  <Accordion title="8b. 시작 시 Matrix 마이그레이션">
    Matrix channel 계정에 보류 중이거나 조치 가능한 레거시 상태 마이그레이션이 있으면, doctor는 (`--fix` / `--repair` 모드에서) 마이그레이션 전 스냅샷을 생성한 뒤 최선 노력 방식의 마이그레이션 단계를 실행합니다. 레거시 Matrix 상태 마이그레이션과 레거시 암호화 상태 준비입니다. 두 단계 모두 치명적이지 않습니다. 오류는 로그에 기록되고 시작은 계속됩니다. 읽기 전용 모드(`--fix` 없이 `openclaw doctor`)에서는 이 검사를 완전히 건너뜁니다.
  </Accordion>
  <Accordion title="8c. 기기 페어링 및 인증 드리프트">
    Doctor는 이제 일반 상태 검사 과정의 일부로 기기 페어링 상태를 검사합니다.

    보고하는 내용:

    - 보류 중인 최초 페어링 요청
    - 이미 페어링된 기기의 보류 중인 역할 업그레이드
    - 이미 페어링된 기기의 보류 중인 범위 업그레이드
    - 기기 id는 여전히 일치하지만 기기 ID가 승인된 기록과 더 이상 일치하지 않는 공개 키 불일치 복구
    - 승인된 역할에 대한 활성 토큰이 없는 페어링 기록
    - 승인된 페어링 기준선을 벗어난 범위를 가진 페어링 토큰
    - Gateway 측 토큰 rotation보다 오래되었거나 오래된 범위 메타데이터를 가진 현재 머신의 로컬 캐시 기기 토큰 항목

    Doctor는 페어링 요청을 자동 승인하거나 기기 토큰을 자동 rotation하지 않습니다. 대신 정확한 다음 단계를 출력합니다.

    - `openclaw devices list`로 보류 중인 요청 검사
    - `openclaw devices approve <requestId>`로 정확한 요청 승인
    - `openclaw devices rotate --device <deviceId> --role <role>`로 새 토큰 rotation
    - `openclaw devices remove <deviceId>`로 오래된 기록 제거 및 재승인

    이는 흔한 "이미 페어링되었지만 여전히 페어링 필요가 표시되는" 구멍을 닫습니다. doctor는 이제 최초 페어링, 보류 중인 역할/범위 업그레이드, 오래된 토큰/기기 ID 드리프트를 구분합니다.

  </Accordion>
  <Accordion title="9. 보안 경고">
    Doctor는 provider가 allowlist 없이 DM에 열려 있거나 정책이 위험한 방식으로 설정된 경우 경고를 출력합니다.
  </Accordion>
  <Accordion title="10. systemd linger(Linux)">
    systemd 사용자 서비스로 실행 중인 경우, doctor는 로그아웃 후에도 Gateway가 계속 살아 있도록 lingering이 활성화되어 있는지 확인합니다.
  </Accordion>
  <Accordion title="11. Workspace 상태(Skills, Plugin, 레거시 디렉터리)">
    Doctor는 기본 에이전트의 workspace 상태 요약을 출력합니다.

    - **Skills 상태**: 적격 Skills, 요구 사항 누락 Skills, allowlist 차단 Skills의 수를 셉니다.
    - **레거시 workspace 디렉터리**: `~/openclaw` 또는 다른 레거시 workspace 디렉터리가 현재 workspace와 함께 존재하면 경고합니다.
    - **Plugin 상태**: 활성화/비활성화/오류 Plugin 수를 셉니다. 오류가 있는 경우 Plugin ID를 나열하고, 번들 Plugin 기능을 보고합니다.
    - **Plugin 호환성 경고**: 현재 런타임과 호환성 문제가 있는 Plugin에 플래그를 지정합니다.
    - **Plugin 진단**: Plugin 레지스트리에서 로드 시 출력한 경고나 오류를 표시합니다.

  </Accordion>
  <Accordion title="11b. Bootstrap 파일 크기">
    Doctor는 workspace bootstrap 파일(예: `AGENTS.md`, `CLAUDE.md`, 또는 기타 주입된 컨텍스트 파일)이 설정된 문자 예산에 가깝거나 초과했는지 확인합니다. 파일별 원시 문자 수와 주입된 문자 수, truncation 비율, truncation 원인(`max/file` 또는 `max/total`), 총 예산 대비 총 주입 문자 수를 보고합니다. 파일이 잘렸거나 한도에 가까우면 doctor는 `agents.defaults.bootstrapMaxChars`와 `agents.defaults.bootstrapTotalMaxChars` 조정 팁을 출력합니다.
  </Accordion>
  <Accordion title="11d. 오래된 channel Plugin 정리">
    `openclaw doctor --fix`가 누락된 channel Plugin을 제거할 때, 해당 Plugin을 참조하던 dangling channel 범위 설정도 함께 제거합니다. `channels.<id>` 항목, 해당 channel을 지명한 Heartbeat 대상, `agents.*.models["<channel>/*"]` 재정의입니다. 이렇게 하면 channel 런타임은 사라졌지만 설정은 여전히 Gateway에 이를 바인딩하라고 요청하는 Gateway 부팅 루프를 방지합니다.
  </Accordion>
  <Accordion title="11c. 셸 completion">
    Doctor는 현재 셸(zsh, bash, fish 또는 PowerShell)에 탭 completion이 설치되어 있는지 확인합니다.

    - 셸 프로필이 느린 동적 completion 패턴(`source <(openclaw completion ...)`)을 사용하는 경우, doctor가 이를 더 빠른 캐시 파일 변형으로 업그레이드합니다.
    - 프로필에 completion이 구성되어 있지만 캐시 파일이 없으면, doctor가 캐시를 자동으로 다시 생성합니다.
    - completion이 전혀 구성되어 있지 않으면, doctor가 설치를 안내합니다(대화형 모드에서만 해당; `--non-interactive`에서는 건너뜀).

    캐시를 수동으로 다시 생성하려면 `openclaw completion --write-state`를 실행하세요.

  </Accordion>
  <Accordion title="12. Gateway 인증 검사(로컬 토큰)">
    Doctor는 로컬 gateway 토큰 인증 준비 상태를 확인합니다.

    - 토큰 모드에 토큰이 필요하지만 토큰 소스가 없으면, doctor가 토큰 생성을 제안합니다.
    - `gateway.auth.token`이 SecretRef로 관리되지만 사용할 수 없으면, doctor가 경고하고 이를 일반 텍스트로 덮어쓰지 않습니다.
    - `openclaw doctor --generate-gateway-token`은 토큰 SecretRef가 구성되어 있지 않은 경우에만 생성을 강제합니다.

  </Accordion>
  <Accordion title="12b. 읽기 전용 SecretRef 인식 복구">
    일부 복구 흐름은 런타임의 빠른 실패 동작을 약화하지 않고 구성된 자격 증명을 검사해야 합니다.

    - 이제 `openclaw doctor --fix`는 대상 config 복구에 status 계열 명령과 동일한 읽기 전용 SecretRef 요약 모델을 사용합니다.
    - 예: Telegram `allowFrom` / `groupAllowFrom` `@username` 복구는 가능한 경우 구성된 봇 자격 증명을 사용하려고 시도합니다.
    - Telegram 봇 토큰이 SecretRef를 통해 구성되어 있지만 현재 명령 경로에서 사용할 수 없는 경우, doctor는 충돌하거나 토큰이 누락되었다고 잘못 보고하는 대신 자격 증명이 구성되었지만 사용할 수 없다고 보고하고 자동 확인을 건너뜁니다.

  </Accordion>
  <Accordion title="13. Gateway 상태 검사 + 재시작">
    Doctor는 상태 검사를 실행하고 Gateway가 비정상으로 보이면 재시작을 제안합니다.
  </Accordion>
  <Accordion title="13b. 메모리 검색 준비 상태">
    Doctor는 구성된 메모리 검색 임베딩 provider가 기본 agent에 대해 준비되었는지 확인합니다. 동작은 구성된 backend와 provider에 따라 달라집니다.

    - **QMD backend**: `qmd` 바이너리를 사용할 수 있고 시작할 수 있는지 확인합니다. 그렇지 않으면 npm package와 수동 바이너리 경로 옵션을 포함한 수정 안내를 출력합니다.
    - **명시적 로컬 provider**: 로컬 model 파일 또는 인식된 원격/다운로드 가능한 model URL이 있는지 확인합니다. 없으면 원격 provider로 전환할 것을 제안합니다.
    - **명시적 원격 provider**(`openai`, `voyage` 등): API key가 환경 또는 auth store에 있는지 확인합니다. 없으면 실행 가능한 수정 힌트를 출력합니다.
    - **자동 provider**: 먼저 로컬 model 사용 가능 여부를 확인한 다음, 자동 선택 순서의 각 원격 provider를 시도합니다.

    캐시된 Gateway probe 결과를 사용할 수 있는 경우(검사 시점에 Gateway가 정상), doctor는 그 결과를 CLI에서 보이는 config와 대조하고 불일치를 기록합니다. Doctor는 기본 경로에서 새로운 임베딩 ping을 시작하지 않습니다. 실시간 provider 검사가 필요하면 deep 메모리 status 명령을 사용하세요.

    런타임에서 임베딩 준비 상태를 확인하려면 `openclaw memory status --deep`을 사용하세요.

  </Accordion>
  <Accordion title="14. Channel status 경고">
    Gateway가 정상인 경우, doctor는 channel status probe를 실행하고 제안된 수정과 함께 경고를 보고합니다.
  </Accordion>
  <Accordion title="15. Supervisor config 감사 + 복구">
    Doctor는 설치된 supervisor config(launchd/systemd/schtasks)에 누락되었거나 오래된 기본값(예: systemd network-online 의존성 및 재시작 지연)이 있는지 확인합니다. 불일치를 찾으면 업데이트를 권장하고 service file/task를 현재 기본값으로 다시 작성할 수 있습니다.

    참고:

    - `openclaw doctor`는 supervisor config를 다시 작성하기 전에 확인을 요청합니다.
    - `openclaw doctor --yes`는 기본 복구 프롬프트를 수락합니다.
    - `openclaw doctor --repair`는 프롬프트 없이 권장 수정 사항을 적용합니다.
    - `openclaw doctor --repair --force`는 사용자 지정 supervisor config를 덮어씁니다.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`은 Gateway service lifecycle에 대해 doctor를 읽기 전용으로 유지합니다. 여전히 service 상태를 보고하고 service가 아닌 복구를 실행하지만, 외부 supervisor가 해당 lifecycle을 소유하므로 service 설치/시작/재시작/bootstrap, supervisor config 재작성, legacy service 정리를 건너뜁니다.
    - Linux에서 doctor는 일치하는 systemd Gateway unit이 활성 상태일 때 command/entrypoint metadata를 다시 작성하지 않습니다. 또한 duplicate-service scan 중 비활성 non-legacy 추가 Gateway 유사 unit을 무시하여 companion service file이 정리 노이즈를 만들지 않도록 합니다.
    - 토큰 auth에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, doctor service 설치/복구는 SecretRef를 검증하지만 확인된 일반 텍스트 토큰 값을 supervisor service environment metadata에 저장하지 않습니다.
    - Doctor는 이전 LaunchAgent, systemd 또는 Windows Scheduled Task 설치가 inline으로 포함한 관리형 `.env`/SecretRef 기반 service environment 값을 감지하고, 해당 값이 supervisor 정의가 아니라 runtime source에서 로드되도록 service metadata를 다시 작성합니다.
    - Doctor는 `gateway.port`가 변경된 뒤에도 service command가 이전 `--port`를 고정하고 있으면 이를 감지하고 service metadata를 현재 port로 다시 작성합니다.
    - 토큰 auth에 토큰이 필요하고 구성된 토큰 SecretRef가 확인되지 않으면, doctor는 실행 가능한 안내와 함께 설치/복구 경로를 차단합니다.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, doctor는 mode가 명시적으로 설정될 때까지 설치/복구를 차단합니다.
    - Linux user-systemd unit의 경우, doctor 토큰 drift 검사는 이제 service auth metadata를 비교할 때 `Environment=`와 `EnvironmentFile=` 소스를 모두 포함합니다.
    - Doctor service 복구는 config가 더 최신 버전에서 마지막으로 작성된 경우, 더 오래된 OpenClaw 바이너리에서 Gateway service를 다시 작성하거나 중지하거나 재시작하는 것을 거부합니다. [Gateway 문제 해결](/ko/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)을 참조하세요.
    - 언제든지 `openclaw gateway install --force`를 통해 전체 재작성을 강제할 수 있습니다.

  </Accordion>
  <Accordion title="16. Gateway 런타임 + 포트 진단">
    Doctor는 service 런타임(PID, 마지막 종료 상태)을 검사하고 service가 설치되어 있지만 실제로 실행 중이 아닐 때 경고합니다. 또한 Gateway port(기본값 `18789`)의 port 충돌을 확인하고 가능한 원인(Gateway가 이미 실행 중, SSH tunnel)을 보고합니다.
  </Accordion>
  <Accordion title="17. Gateway 런타임 모범 사례">
    Doctor는 Gateway service가 Bun 또는 버전 관리 Node 경로(`nvm`, `fnm`, `volta`, `asdf` 등)에서 실행될 때 경고합니다. WhatsApp + Telegram channel에는 Node가 필요하며, service가 셸 init을 로드하지 않으므로 버전 관리자 경로는 업그레이드 후 중단될 수 있습니다. Doctor는 가능한 경우 system Node 설치(Homebrew/apt/choco)로 마이그레이션할 것을 제안합니다.

    새로 설치되거나 복구된 macOS LaunchAgent는 대화형 셸 PATH를 복사하는 대신 표준 system PATH(`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`)를 사용하므로, Homebrew로 관리되는 system 바이너리는 계속 사용할 수 있고 Volta, asdf, fnm, pnpm 및 기타 버전 관리자 디렉터리는 Node child process가 확인하는 대상을 변경하지 않습니다. Linux service는 여전히 명시적 environment root(`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`)와 안정적인 user-bin 디렉터리를 유지하지만, 추정된 버전 관리자 fallback 디렉터리는 해당 디렉터리가 디스크에 존재할 때만 service PATH에 기록됩니다.

  </Accordion>
  <Accordion title="18. Config 쓰기 + wizard metadata">
    Doctor는 config 변경 사항을 저장하고 doctor 실행을 기록하기 위해 wizard metadata를 찍습니다.
  </Accordion>
  <Accordion title="19. Workspace 팁(backup + memory system)">
    Doctor는 workspace memory system이 없으면 이를 제안하고, workspace가 아직 git 아래에 있지 않으면 backup 팁을 출력합니다.

    workspace 구조와 git backup(비공개 GitHub 또는 GitLab 권장)에 대한 전체 가이드는 [/concepts/agent-workspace](/ko/concepts/agent-workspace)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [Gateway runbook](/ko/gateway)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
