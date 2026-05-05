---
read_when:
    - doctor 마이그레이션 추가 또는 수정
    - 호환성을 깨는 구성 변경 도입
sidebarTitle: Doctor
summary: 'Doctor 명령: 상태 검사, 설정 마이그레이션 및 복구 단계'
title: 진단
x-i18n:
    generated_at: "2026-05-05T08:25:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 360f9f7a349e4633ff61d526f1eb5b668b595b4f35c5e0fd2a314715a0599c4c
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

    프롬프트 없이 기본값을 승인합니다(해당되는 경우 재시작/서비스/샌드박스 복구 단계 포함).

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

    적극적인 복구도 적용합니다(사용자 지정 슈퍼바이저 구성을 덮어씀).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    프롬프트 없이 실행하고 안전한 마이그레이션만 적용합니다(구성 정규화 + 디스크의 상태 이동). 사람이 확인해야 하는 재시작/서비스/샌드박스 작업은 건너뜁니다. 레거시 상태 마이그레이션은 감지되면 자동으로 실행됩니다.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    추가 Gateway 설치를 시스템 서비스에서 스캔합니다(launchd/systemd/schtasks).

  </Tab>
</Tabs>

쓰기 전에 변경 사항을 검토하려면 먼저 구성 파일을 여세요.

```bash
cat ~/.openclaw/openclaw.json
```

## 수행하는 작업(요약)

<AccordionGroup>
  <Accordion title="상태, UI, 업데이트">
    - git 설치에 대한 선택적 사전 업데이트(대화형 전용).
    - UI 프로토콜 최신 상태 확인(프로토콜 스키마가 더 최신이면 Control UI 재빌드).
    - 상태 확인 + 재시작 프롬프트.
    - Skills 상태 요약(적격/누락/차단됨) 및 Plugin 상태.

  </Accordion>
  <Accordion title="구성 및 마이그레이션">
    - 레거시 값에 대한 구성 정규화.
    - 레거시 평면 `talk.*` 필드에서 `talk.provider` + `talk.providers.<provider>`로 Talk 구성 마이그레이션.
    - 레거시 Chrome 확장 구성 및 Chrome MCP 준비 상태에 대한 브라우저 마이그레이션 확인.
    - OpenCode 제공자 재정의 경고(`models.providers.opencode` / `models.providers.opencode-go`).
    - Codex OAuth 섀도잉 경고(`models.providers.openai-codex`).
    - OpenAI Codex OAuth 프로필에 대한 OAuth TLS 필수 조건 확인.
    - `plugins.allow`가 제한적인데 도구 정책이 여전히 와일드카드 또는 Plugin 소유 도구를 요청하는 경우 Plugin/도구 허용 목록 경고.
    - 레거시 디스크 상태 마이그레이션(세션/에이전트 디렉터리/WhatsApp 인증).
    - 레거시 Plugin 매니페스트 계약 키 마이그레이션(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - 레거시 Cron 저장소 마이그레이션(`jobId`, `schedule.cron`, 최상위 delivery/payload 필드, payload `provider`, 단순 `notify: true` Webhook 폴백 작업).
    - 레거시 에이전트 런타임 정책을 `agents.defaults.agentRuntime` 및 `agents.list[].agentRuntime`으로 마이그레이션.
    - Plugin이 활성화된 경우 오래된 Plugin 구성 정리. `plugins.enabled=false`인 경우 오래된 Plugin 참조는 비활성 격리 구성으로 처리되어 보존됩니다.

  </Accordion>
  <Accordion title="상태 및 무결성">
    - 세션 잠금 파일 검사 및 오래된 잠금 정리.
    - 영향을 받은 2026.4.24 빌드에서 생성된 중복 프롬프트 재작성 브랜치에 대한 세션 기록 복구.
    - 멈춘 하위 에이전트 재시작-복구 톰스톤 감지. 오래된 중단 복구 플래그를 지워 시작 시 하위 항목을 재시작 중단으로 계속 처리하지 않도록 하는 `--fix` 지원 포함.
    - 상태 무결성 및 권한 확인(세션, 기록, 상태 디렉터리).
    - 로컬에서 실행할 때 구성 파일 권한 확인(chmod 600).
    - 모델 인증 상태: OAuth 만료를 확인하고, 만료 임박 토큰을 새로 고칠 수 있으며, 인증 프로필 쿨다운/비활성 상태를 보고합니다.
    - 추가 작업 공간 디렉터리 감지(`~/openclaw`).

  </Accordion>
  <Accordion title="Gateway, 서비스, 슈퍼바이저">
    - 샌드박싱이 활성화된 경우 샌드박스 이미지 복구.
    - 레거시 서비스 마이그레이션 및 추가 Gateway 감지.
    - Matrix 채널 레거시 상태 마이그레이션(`--fix` / `--repair` 모드).
    - Gateway 런타임 확인(서비스가 설치되었지만 실행 중이 아님, 캐시된 launchd 레이블).
    - 채널 상태 경고(실행 중인 Gateway에서 프로브).
    - 로컬 TUI 클라이언트가 계속 실행 중인 상태에서 Gateway 이벤트 루프 상태가 저하된 경우 WhatsApp 응답성 확인. `--fix`는 확인된 로컬 TUI 클라이언트만 중지합니다.
    - 선택적 복구가 포함된 슈퍼바이저 구성 감사(launchd/systemd/schtasks).
    - 설치 또는 업데이트 중 셸 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 값을 캡처한 Gateway 서비스의 내장 프록시 환경 정리.
    - Gateway 런타임 모범 사례 확인(Node 대 Bun, 버전 관리자 경로).
    - Gateway 포트 충돌 진단(기본값 `18789`).

  </Accordion>
  <Accordion title="인증, 보안, 페어링">
    - 공개 DM 정책에 대한 보안 경고.
    - 로컬 토큰 모드에 대한 Gateway 인증 확인(토큰 소스가 없으면 토큰 생성을 제안하며, 토큰 SecretRef 구성을 덮어쓰지 않음).
    - 기기 페어링 문제 감지(대기 중인 최초 페어링 요청, 대기 중인 역할/범위 업그레이드, 오래된 로컬 기기 토큰 캐시 드리프트, 페어링된 레코드 인증 드리프트).

  </Accordion>
  <Accordion title="작업 공간 및 셸">
    - Linux에서 systemd linger 확인.
    - 작업 공간 부트스트랩 파일 크기 확인(컨텍스트 파일의 잘림/한계 근접 경고).
    - 기본 에이전트에 대한 Skills 준비 상태 확인. 누락된 바이너리, env, 구성 또는 OS 요구 사항이 있는 허용된 Skills를 보고하며, `--fix`는 `skills.entries`에서 사용할 수 없는 Skills를 비활성화할 수 있습니다.
    - 셸 완성 상태 확인 및 자동 설치/업그레이드.
    - 메모리 검색 임베딩 제공자 준비 상태 확인(로컬 모델, 원격 API 키 또는 QMD 바이너리).
    - 소스 설치 확인(pnpm 작업 공간 불일치, 누락된 UI 자산, 누락된 tsx 바이너리).
    - 업데이트된 구성 + 마법사 메타데이터를 씁니다.

  </Accordion>
</AccordionGroup>

## Dreams UI 백필 및 재설정

Control UI Dreams 장면에는 근거 기반 Dreaming 워크플로를 위한 **백필**, **재설정**, **근거 항목 지우기** 작업이 포함됩니다. 이 작업들은 Gateway doctor 스타일 RPC 메서드를 사용하지만, `openclaw doctor` CLI 복구/마이그레이션의 일부는 **아닙니다**.

수행하는 작업:

- **백필**은 활성 작업 공간의 과거 `memory/YYYY-MM-DD.md` 파일을 스캔하고, 근거 기반 REM 일기 패스를 실행하며, 되돌릴 수 있는 백필 항목을 `DREAMS.md`에 씁니다.
- **재설정**은 표시된 백필 일기 항목만 `DREAMS.md`에서 제거합니다.
- **근거 항목 지우기**는 과거 재생에서 온, 아직 실시간 회상이나 일일 지원을 누적하지 않은 준비된 근거 전용 단기 항목만 제거합니다.

자체적으로 수행하지 **않는** 작업:

- `MEMORY.md`를 편집하지 않습니다
- 전체 doctor 마이그레이션을 실행하지 않습니다
- 준비된 CLI 경로를 먼저 명시적으로 실행하지 않는 한, 근거 후보를 실시간 단기 승격 저장소에 자동으로 스테이징하지 않습니다

근거 기반 과거 재생이 일반 심층 승격 경로에 영향을 주게 하려면 대신 CLI 흐름을 사용하세요.

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

그러면 `DREAMS.md`를 검토 표면으로 유지하면서 근거 기반 내구 후보를 단기 Dreaming 저장소에 스테이징합니다.

## 자세한 동작 및 근거

<AccordionGroup>
  <Accordion title="0. 선택적 업데이트(git 설치)">
    이것이 git 체크아웃이고 doctor가 대화형으로 실행 중이면, doctor 실행 전에 업데이트(fetch/rebase/build)를 제안합니다.
  </Accordion>
  <Accordion title="1. 구성 정규화">
    구성에 레거시 값 형태가 포함되어 있으면(예: 채널별 재정의 없이 `messages.ackReaction`), doctor가 이를 현재 스키마로 정규화합니다.

    여기에는 레거시 Talk 평면 필드가 포함됩니다. 현재 공개 Talk 구성은 `talk.provider` + `talk.providers.<provider>`입니다. Doctor는 이전 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 형태를 제공자 맵으로 다시 씁니다.

    Doctor는 또한 `plugins.allow`가 비어 있지 않고 도구 정책이
    와일드카드 또는 Plugin 소유 도구 항목을 사용하는 경우 경고합니다. `tools.allow: ["*"]`는 실제로 로드되는 Plugin의 도구에만 일치하며,
    독점 Plugin 허용 목록을 우회하지 않습니다. Doctor는 마이그레이션된
    레거시 허용 목록 구성에 대해 `plugins.bundledDiscovery: "compat"`를 써서 기존 번들 제공자 동작을 보존한 다음,
    더 엄격한 `"allowlist"` 설정을 안내합니다.

  </Accordion>
  <Accordion title="2. 레거시 구성 키 마이그레이션">
    구성에 사용 중단된 키가 포함되어 있으면, 다른 명령은 실행을 거부하고 `openclaw doctor`를 실행하라고 요청합니다.

    Doctor는 다음을 수행합니다.

    - 발견된 레거시 키를 설명합니다.
    - 적용한 마이그레이션을 표시합니다.
    - 업데이트된 스키마로 `~/.openclaw/openclaw.json`을 다시 씁니다.

    Gateway도 시작 시 레거시 구성 형식을 감지하면 doctor 마이그레이션을 자동 실행하므로, 오래된 구성은 수동 개입 없이 복구됩니다. Cron 작업 저장소 마이그레이션은 `openclaw doctor --fix`에서 처리됩니다.

    현재 마이그레이션:

    - `routing.allowFrom` → `channels.whatsapp.allowFrom`
    - `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
    - `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
    - `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
    - `channels.telegram.requireMention` → `channels.telegram.groups."*".requireMention`
    - 표시 가능한 응답 정책이 누락된 구성된 채널 설정 → `messages.groupChat.visibleReplies: "message_tool"`
    - `routing.queue` → `messages.queue`
    - `routing.bindings` → 최상위 `bindings`
    - `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
    - 레거시 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
    - `routing.agentToAgent` → `tools.agentToAgent`
    - `routing.transcribeAudio` → `tools.media.audio.models`
    - `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
    - `messages.tts.provider: "edge"` 및 `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` 및 `messages.tts.providers.microsoft`
    - `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
    - `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
    - `plugins.entries.voice-call.config.tts.provider: "edge"` 및 `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` 및 `providers.microsoft`
    - `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
    - `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
    - `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
    - `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold` → `plugins.entries.voice-call.config.streaming.providers.openai.*`
    - `bindings[].match.accountID` → `bindings[].match.accountId`
    - 이름이 지정된 `accounts`가 있지만 단일 계정용 최상위 채널 값이 남아 있는 채널의 경우, 해당 계정 범위 값을 그 채널에 대해 선택된 승격 계정으로 이동합니다(대부분의 채널은 `accounts.default`; Matrix는 기존의 일치하는 이름/기본 대상을 보존할 수 있음)
    - `identity` → `agents.list[].identity`
    - `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
    - `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks` → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
    - `agents.defaults.llm` 제거; 느린 provider/model 시간 제한에는 `models.providers.<id>.timeoutSeconds` 사용
    - `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
    - `browser.profiles.*.driver: "extension"` → `"existing-session"`
    - `browser.relayBindHost` 제거(레거시 extension relay 설정)
    - 레거시 `models.providers.*.api: "openai"` → `"openai-completions"`(Gateway 시작 시 `api`가 향후 또는 알 수 없는 enum 값으로 설정된 provider도 실패로 닫지 않고 건너뜀)

    Doctor 경고에는 다중 계정 채널에 대한 계정 기본값 안내도 포함됩니다.

    - 두 개 이상의 `channels.<channel>.accounts` 항목이 `channels.<channel>.defaultAccount` 또는 `accounts.default` 없이 구성된 경우, doctor는 fallback routing이 예상치 못한 계정을 선택할 수 있다고 경고합니다.
    - `channels.<channel>.defaultAccount`가 알 수 없는 계정 ID로 설정된 경우, doctor는 경고하고 구성된 계정 ID를 나열합니다.

  </Accordion>
  <Accordion title="2b. OpenCode provider overrides">
    `models.providers.opencode`, `opencode-zen` 또는 `opencode-go`를 수동으로 추가한 경우, `@mariozechner/pi-ai`의 내장 OpenCode catalog를 재정의합니다. 이로 인해 모델이 잘못된 API에 강제로 배치되거나 비용이 0으로 설정될 수 있습니다. Doctor가 경고하므로 재정의를 제거하고 모델별 API 라우팅 및 비용을 복원할 수 있습니다.
  </Accordion>
  <Accordion title="2c. Browser migration and Chrome MCP readiness">
    브라우저 설정이 아직 제거된 Chrome extension 경로를 가리키는 경우, doctor는 이를 현재의 호스트 로컬 Chrome MCP attach 모델로 정규화합니다.

    - `browser.profiles.*.driver: "extension"`은 `"existing-session"`이 됩니다
    - `browser.relayBindHost`가 제거됩니다

    또한 `defaultProfile: "user"` 또는 구성된 `existing-session` 프로필을 사용할 때 doctor는 호스트 로컬 Chrome MCP 경로를 감사합니다.

    - 기본 자동 연결 프로필에 대해 동일한 호스트에 Google Chrome이 설치되어 있는지 확인합니다
    - 감지된 Chrome 버전을 확인하고 Chrome 144 미만이면 경고합니다
    - 브라우저 검사 페이지에서 원격 디버깅을 활성화하라고 알려줍니다(예: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` 또는 `edge://inspect/#remote-debugging`)

    Doctor는 Chrome 쪽 설정을 대신 활성화할 수 없습니다. 호스트 로컬 Chrome MCP에는 여전히 다음이 필요합니다.

    - Gateway/Node 호스트의 Chromium 기반 브라우저 144+
    - 로컬에서 실행 중인 브라우저
    - 해당 브라우저에서 원격 디버깅 활성화
    - 브라우저에서 첫 attach 동의 프롬프트 승인

    여기서 준비 상태는 로컬 attach 사전 요구 사항에만 관한 것입니다. Existing-session은 현재 Chrome MCP 경로 제한을 유지합니다. `responsebody`, PDF 내보내기, 다운로드 가로채기, 일괄 작업 같은 고급 경로에는 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다.

    이 검사는 Docker, sandbox, remote-browser 또는 기타 headless flow에는 적용되지 않습니다. 이러한 flow는 계속 원시 CDP를 사용합니다.

  </Accordion>
  <Accordion title="2d. OAuth TLS prerequisites">
    OpenAI Codex OAuth 프로필이 구성되면, doctor는 OpenAI authorization endpoint를 probe하여 로컬 Node/OpenSSL TLS stack이 인증서 체인을 검증할 수 있는지 확인합니다. probe가 인증서 오류(예: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, 만료된 인증서 또는 자체 서명 인증서)로 실패하면, doctor는 플랫폼별 수정 안내를 출력합니다. macOS에서 Homebrew Node를 사용하는 경우 일반적으로 수정 방법은 `brew postinstall ca-certificates`입니다. `--deep`에서는 Gateway가 정상이어도 probe가 실행됩니다.
  </Accordion>
  <Accordion title="2e. Codex OAuth provider overrides">
    이전에 `models.providers.openai-codex` 아래에 레거시 OpenAI transport 설정을 추가했다면, 최신 릴리스가 자동으로 사용하는 내장 Codex OAuth provider 경로를 가릴 수 있습니다. Doctor는 Codex OAuth와 함께 이러한 오래된 transport 설정을 발견하면 경고하므로, 낡은 transport 재정의를 제거하거나 다시 작성하여 내장 라우팅/fallback 동작을 되돌릴 수 있습니다. 사용자 지정 proxy와 header-only 재정의는 계속 지원되며 이 경고를 발생시키지 않습니다.
  </Accordion>
  <Accordion title="2f. Codex plugin route warnings">
    번들된 Codex Plugin이 활성화되면, doctor는 `openai-codex/*` 기본 모델 ref가 여전히 기본 PI runner를 통해 resolve되는지도 확인합니다. 이 조합은 PI를 통한 Codex OAuth/subscription auth를 원할 때 유효하지만, 네이티브 Codex app-server harness와 혼동하기 쉽습니다. Doctor는 경고하고 명시적인 app-server 형태를 가리킵니다: `openai/*` plus `agentRuntime.id: "codex"` 또는 `OPENCLAW_AGENT_RUNTIME=codex`.

    Doctor는 두 경로가 모두 유효하기 때문에 이를 자동으로 복구하지 않습니다.

    - `openai-codex/*` + PI는 "일반 OpenClaw runner를 통해 Codex OAuth/subscription auth 사용"을 의미합니다.
    - `openai/*` + `agentRuntime.id: "codex"`는 "내장된 turn을 네이티브 Codex app-server를 통해 실행"을 의미합니다.
    - `/codex ...`는 "채팅에서 네이티브 Codex conversation을 제어하거나 bind"를 의미합니다.
    - `/acp ...` 또는 `runtime: "acp"`는 "외부 ACP/acpx adapter 사용"을 의미합니다.

    경고가 나타나면 의도한 경로를 선택하고 config를 수동으로 편집하세요. PI Codex OAuth가 의도된 경우 경고를 그대로 유지하세요.

  </Accordion>
  <Accordion title="2g. Session route cleanup">
    Doctor는 Codex 같은 Plugin 소유 경로에서 구성된 기본/fallback 모델 또는 runtime을 다른 곳으로 옮긴 뒤, active sessions store에 오래된 자동 생성 route state가 남아 있는지도 스캔합니다.

    `openclaw doctor --fix`는 소유 경로가 더 이상 구성되지 않은 경우 `modelOverrideSource: "auto"` 모델 pin, runtime 모델 metadata, pinned harness id, CLI session binding, 자동 auth-profile override 같은 자동 생성된 오래된 state를 지울 수 있습니다. 명시적인 사용자 또는 레거시 session 모델 선택은 수동 검토 대상으로 보고되고 그대로 둡니다. 해당 경로를 더 이상 의도하지 않는 경우 `/model ...`, `/new`로 전환하거나 session을 reset하세요.

  </Accordion>
  <Accordion title="3. Legacy state migrations (disk layout)">
    Doctor는 오래된 온디스크 layout을 현재 구조로 migrate할 수 있습니다.

    - Sessions store + transcripts:
      - `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
    - Agent dir:
      - `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
    - WhatsApp auth state (Baileys):
      - 레거시 `~/.openclaw/credentials/*.json`에서(`oauth.json` 제외)
      - `~/.openclaw/credentials/whatsapp/<accountId>/...`로(기본 account id: `default`)

    이러한 migration은 최선 노력 방식이며 idempotent합니다. doctor는 백업으로 레거시 폴더를 남겨둘 때 경고를 출력합니다. Gateway/CLI도 시작 시 레거시 sessions + agent dir을 자동으로 migrate하여 history/auth/models가 수동 doctor 실행 없이 agent별 경로에 위치하도록 합니다. WhatsApp auth는 의도적으로 `openclaw doctor`를 통해서만 migrate됩니다. Talk provider/provider-map 정규화는 이제 구조적 동등성으로 비교하므로, key 순서만 다른 diff는 더 이상 반복적인 no-op `doctor --fix` 변경을 유발하지 않습니다.

  </Accordion>
  <Accordion title="3a. Legacy plugin manifest migrations">
    Doctor는 설치된 모든 Plugin manifest에서 deprecated된 최상위 capability key(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`)를 스캔합니다. 발견되면 이를 `contracts` 객체로 이동하고 manifest 파일을 제자리에서 다시 쓰도록 제안합니다. 이 migration은 idempotent합니다. `contracts` key에 이미 같은 값이 있으면, 데이터를 중복하지 않고 레거시 key를 제거합니다.
  </Accordion>
  <Accordion title="3b. Legacy cron store migrations">
    Doctor는 또한 cron job store(기본값은 `~/.openclaw/cron/jobs.json`, 재정의된 경우 `cron.store`)에서 scheduler가 호환성을 위해 아직 허용하는 오래된 job shape를 확인합니다.

    현재 cron cleanup에는 다음이 포함됩니다.

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 최상위 payload field(`message`, `model`, `thinking`, ...) → `payload`
    - 최상위 delivery field(`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - payload `provider` delivery alias → 명시적 `delivery.channel`
    - 단순 레거시 `notify: true` webhook fallback job → `delivery.to=cron.webhook`이 포함된 명시적 `delivery.mode="webhook"`

    Doctor는 동작 변경 없이 처리할 수 있을 때만 `notify: true` job을 자동으로 migrate합니다. job이 레거시 notify fallback과 기존 non-webhook delivery mode를 함께 사용하는 경우, doctor는 경고하고 해당 job을 수동 검토 대상으로 남겨둡니다.

    Linux에서는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 호출할 때 doctor도 경고합니다. 이 호스트 로컬 스크립트는 현재 OpenClaw에서 유지 관리되지 않으며, cron이 systemd 사용자 버스에 도달할 수 없을 때 `~/.openclaw/logs/whatsapp-health.log`에 잘못된 `Gateway inactive` 메시지를 쓸 수 있습니다. 오래된 crontab 항목은 `crontab -e`로 제거하고, 현재 상태 확인에는 `openclaw channels status --probe`, `openclaw doctor`, `openclaw gateway status`를 사용하세요.

  </Accordion>
  <Accordion title="3c. 세션 잠금 정리">
    Doctor는 모든 에이전트 세션 디렉터리에서 오래된 쓰기 잠금 파일을 스캔합니다. 이는 세션이 비정상적으로 종료될 때 남겨진 파일입니다. 발견한 각 잠금 파일에 대해 경로, PID, PID가 아직 살아 있는지 여부, 잠금 나이, 오래된 것으로 간주되는지 여부(죽은 PID 또는 30분 초과)를 보고합니다. `--fix` / `--repair` 모드에서는 오래된 잠금 파일을 자동으로 제거합니다. 그렇지 않으면 참고 메시지를 출력하고 `--fix`로 다시 실행하라고 안내합니다.
  </Accordion>
  <Accordion title="3d. 세션 transcript 브랜치 복구">
    Doctor는 2026.4.24 프롬프트 transcript 재작성 버그로 생성된 중복 브랜치 형태를 찾기 위해 에이전트 세션 JSONL 파일을 스캔합니다. 이 형태는 OpenClaw 내부 런타임 컨텍스트가 포함된 버려진 사용자 턴과, 동일한 표시 사용자 프롬프트를 포함한 활성 형제 브랜치로 구성됩니다. `--fix` / `--repair` 모드에서는 doctor가 영향을 받은 각 파일을 원본 옆에 백업한 뒤 transcript를 활성 브랜치로 다시 작성하여 Gateway 기록 및 memory 리더가 더 이상 중복 턴을 보지 않게 합니다.
  </Accordion>
  <Accordion title="4. 상태 무결성 검사(세션 지속성, 라우팅, 안전성)">
    상태 디렉터리는 운영상의 핵심 중추입니다. 이 디렉터리가 사라지면 다른 곳에 백업이 없는 한 세션, 자격 증명, 로그, 설정을 잃게 됩니다.

    Doctor는 다음을 검사합니다.

    - **상태 디렉터리 누락**: 치명적인 상태 손실을 경고하고, 디렉터리를 다시 만들지 묻고, 누락된 데이터는 복구할 수 없음을 알려줍니다.
    - **상태 디렉터리 권한**: 쓰기 가능 여부를 확인하고, 권한 복구를 제안합니다(소유자/그룹 불일치가 감지되면 `chown` 힌트도 출력).
    - **macOS 클라우드 동기화 상태 디렉터리**: 상태가 iCloud Drive(`~/Library/Mobile Documents/com~apple~CloudDocs/...`) 또는 `~/Library/CloudStorage/...` 아래로 해석될 때 경고합니다. 동기화 기반 경로는 I/O를 느리게 하고 잠금/동기화 경쟁을 일으킬 수 있기 때문입니다.
    - **Linux SD 또는 eMMC 상태 디렉터리**: 상태가 `mmcblk*` 마운트 소스로 해석될 때 경고합니다. SD 또는 eMMC 기반 랜덤 I/O는 세션 및 자격 증명 쓰기 중 더 느리고 더 빨리 마모될 수 있기 때문입니다.
    - **세션 디렉터리 누락**: `sessions/`와 세션 저장소 디렉터리는 기록을 유지하고 `ENOENT` 크래시를 피하는 데 필요합니다.
    - **Transcript 불일치**: 최근 세션 항목에 transcript 파일이 누락되어 있을 때 경고합니다.
    - **메인 세션 "1-line JSONL"**: 메인 transcript가 한 줄뿐일 때 표시합니다(기록이 누적되지 않음).
    - **여러 상태 디렉터리**: 여러 홈 디렉터리에 `~/.openclaw` 폴더가 있거나 `OPENCLAW_STATE_DIR`가 다른 곳을 가리킬 때 경고합니다(기록이 설치 간에 나뉠 수 있음).
    - **원격 모드 알림**: `gateway.mode=remote`이면 doctor는 원격 호스트에서 실행하라고 알려줍니다(상태가 그곳에 있음).
    - **설정 파일 권한**: `~/.openclaw/openclaw.json`이 그룹/전체 읽기 가능이면 경고하고 `600`으로 강화할 것을 제안합니다.

  </Accordion>
  <Accordion title="5. 모델 인증 상태(OAuth 만료)">
    Doctor는 인증 저장소의 OAuth 프로필을 검사하고, 토큰이 곧 만료되거나 만료되었을 때 경고하며, 안전한 경우 새로 고칠 수 있습니다. Anthropic OAuth/토큰 프로필이 오래되었으면 Anthropic API 키 또는 Anthropic setup-token 경로를 제안합니다. 새로 고침 프롬프트는 대화형(TTY)으로 실행할 때만 표시됩니다. `--non-interactive`는 새로 고침 시도를 건너뜁니다.

    OAuth 새로 고침이 영구적으로 실패하면(예: `refresh_token_reused`, `invalid_grant`, 또는 provider가 다시 로그인하라고 알리는 경우) doctor는 재인증이 필요하다고 보고하고 실행할 정확한 `openclaw models auth login --provider ...` 명령을 출력합니다.

    Doctor는 다음으로 인해 일시적으로 사용할 수 없는 인증 프로필도 보고합니다.

    - 짧은 쿨다운(속도 제한/시간 초과/인증 실패)
    - 더 긴 비활성화(결제/크레딧 실패)

  </Accordion>
  <Accordion title="6. Hooks 모델 검증">
    `hooks.gmail.model`이 설정되어 있으면 doctor는 카탈로그 및 allowlist를 기준으로 모델 참조를 검증하고, 해석되지 않거나 허용되지 않을 때 경고합니다.
  </Accordion>
  <Accordion title="7. 샌드박스 이미지 복구">
    샌드박스가 활성화되어 있으면 doctor는 Docker 이미지를 확인하고 현재 이미지가 없을 때 빌드하거나 레거시 이름으로 전환할 것을 제안합니다.
  </Accordion>
  <Accordion title="7b. Plugin 설치 정리">
    Doctor는 `openclaw doctor --fix` / `openclaw doctor --repair` 모드에서 레거시 OpenClaw 생성 Plugin 의존성 스테이징 상태를 제거합니다. 여기에는 오래된 생성 의존성 루트, 이전 설치 스테이지 디렉터리, 과거 번들 Plugin 의존성 복구 코드에서 남은 패키지 로컬 잔여물, 현재 번들 매니페스트를 가릴 수 있는 번들 `@openclaw/*` Plugin의 고아 또는 복구된 관리형 npm 사본이 포함됩니다.

    Doctor는 설정에서 참조하지만 로컬 Plugin 레지스트리가 찾을 수 없는 다운로드 가능 Plugin도 다시 설치할 수 있습니다. 예시에는 실제 `plugins.entries`, 설정된 채널/provider/검색 설정, 설정된 에이전트 런타임이 포함됩니다. 패키지 업데이트 중에는 core 패키지가 교체되는 동안 doctor가 패키지 관리자 Plugin 복구를 실행하지 않습니다. 설정된 Plugin에 여전히 복구가 필요하면 업데이트 후 `openclaw doctor --fix`를 다시 실행하세요. Gateway 시작 및 설정 다시 로드는 패키지 관리자를 실행하지 않습니다. Plugin 설치는 명시적인 doctor/install/update 작업으로 유지됩니다.

  </Accordion>
  <Accordion title="8. Gateway 서비스 마이그레이션 및 정리 힌트">
    Doctor는 레거시 gateway 서비스(launchd/systemd/schtasks)를 감지하고, 이를 제거한 뒤 현재 gateway 포트를 사용해 OpenClaw 서비스를 설치할 것을 제안합니다. 추가 gateway 유사 서비스를 스캔하고 정리 힌트를 출력할 수도 있습니다. 프로필 이름이 붙은 OpenClaw gateway 서비스는 일급 대상으로 간주되며 "extra"로 표시되지 않습니다.

    Linux에서 사용자 수준 gateway 서비스는 없지만 시스템 수준 OpenClaw gateway 서비스가 있으면 doctor는 두 번째 사용자 수준 서비스를 자동으로 설치하지 않습니다. `openclaw gateway status --deep` 또는 `openclaw doctor --deep`로 검사한 뒤, 중복 항목을 제거하거나 시스템 supervisor가 gateway 수명 주기를 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하세요.

  </Accordion>
  <Accordion title="8b. 시작 시 Matrix 마이그레이션">
    Matrix 채널 계정에 대기 중이거나 조치 가능한 레거시 상태 마이그레이션이 있으면 doctor는(`--fix` / `--repair` 모드에서) 마이그레이션 전 스냅샷을 만든 뒤 최선 노력 방식의 마이그레이션 단계인 레거시 Matrix 상태 마이그레이션과 레거시 암호화 상태 준비를 실행합니다. 두 단계 모두 치명적이지 않습니다. 오류는 로그에 기록되고 시작은 계속됩니다. 읽기 전용 모드(`--fix` 없이 `openclaw doctor`)에서는 이 검사를 완전히 건너뜁니다.
  </Accordion>
  <Accordion title="8c. 기기 페어링 및 인증 드리프트">
    Doctor는 이제 일반 상태 점검의 일부로 기기 페어링 상태를 검사합니다.

    보고하는 항목은 다음과 같습니다.

    - 대기 중인 최초 페어링 요청
    - 이미 페어링된 기기의 대기 중인 역할 업그레이드
    - 이미 페어링된 기기의 대기 중인 scope 업그레이드
    - 기기 ID는 여전히 일치하지만 기기 identity가 승인된 레코드와 더 이상 일치하지 않는 공개 키 불일치 복구
    - 승인된 역할에 대한 활성 토큰이 누락된 페어링 레코드
    - scope가 승인된 페어링 baseline 밖으로 드리프트한 페어링 토큰
    - gateway 측 토큰 회전보다 오래되었거나 오래된 scope 메타데이터를 가진 현재 머신의 로컬 캐시 기기 토큰 항목

    Doctor는 페어링 요청을 자동 승인하거나 기기 토큰을 자동 회전하지 않습니다. 대신 정확한 다음 단계를 출력합니다.

    - `openclaw devices list`로 대기 중인 요청 검사
    - `openclaw devices approve <requestId>`로 정확한 요청 승인
    - `openclaw devices rotate --device <deviceId> --role <role>`로 새 토큰 회전
    - `openclaw devices remove <deviceId>`로 오래된 레코드 제거 후 재승인

    이는 흔한 "이미 페어링되었지만 여전히 페어링 필요가 표시됨" 문제를 해결합니다. doctor는 이제 최초 페어링, 대기 중인 역할/scope 업그레이드, 오래된 토큰/기기 identity 드리프트를 구분합니다.

  </Accordion>
  <Accordion title="9. 보안 경고">
    Doctor는 provider가 allowlist 없이 DM에 열려 있거나 정책이 위험한 방식으로 설정되어 있을 때 경고를 출력합니다.
  </Accordion>
  <Accordion title="10. systemd linger(Linux)">
    systemd 사용자 서비스로 실행 중이면 doctor는 로그아웃 후에도 gateway가 계속 살아 있도록 lingering이 활성화되어 있는지 확인합니다.
  </Accordion>
  <Accordion title="11. 워크스페이스 상태(Skills, Plugin, 레거시 디렉터리)">
    Doctor는 기본 에이전트의 워크스페이스 상태 요약을 출력합니다.

    - **Skills 상태**: 적격, 요구 사항 누락, allowlist 차단 Skills 수를 셉니다.
    - **레거시 워크스페이스 디렉터리**: `~/openclaw` 또는 다른 레거시 워크스페이스 디렉터리가 현재 워크스페이스와 함께 존재할 때 경고합니다.
    - **Plugin 상태**: 활성화/비활성화/오류 Plugin 수를 셉니다. 오류가 있는 경우 Plugin ID를 나열하고 번들 Plugin capability를 보고합니다.
    - **Plugin 호환성 경고**: 현재 런타임과 호환성 문제가 있는 Plugin을 표시합니다.
    - **Plugin 진단**: Plugin 레지스트리에서 로드 시 출력한 경고나 오류를 표시합니다.

  </Accordion>
  <Accordion title="11b. Bootstrap 파일 크기">
    Doctor는 워크스페이스 bootstrap 파일(예: `AGENTS.md`, `CLAUDE.md` 또는 기타 주입된 컨텍스트 파일)이 설정된 문자 예산에 가깝거나 초과했는지 확인합니다. 파일별 raw 문자 수와 주입된 문자 수, 잘림 비율, 잘림 원인(`max/file` 또는 `max/total`), 전체 예산 대비 총 주입 문자 비율을 보고합니다. 파일이 잘렸거나 제한에 가까우면 doctor는 `agents.defaults.bootstrapMaxChars` 및 `agents.defaults.bootstrapTotalMaxChars` 조정 팁을 출력합니다.
  </Accordion>
  <Accordion title="11d. 오래된 채널 Plugin 정리">
    `openclaw doctor --fix`가 누락된 채널 Plugin을 제거할 때, 해당 Plugin을 참조하던 매달린 채널 범위 설정도 제거합니다. `channels.<id>` 항목, 채널 이름을 지정한 Heartbeat 대상, `agents.*.models["<channel>/*"]` override가 여기에 포함됩니다. 이렇게 하면 채널 런타임은 사라졌지만 설정이 여전히 gateway에 바인딩을 요청하는 Gateway 부팅 루프를 방지합니다.
  </Accordion>
  <Accordion title="11c. 셸 completion">
    Doctor는 현재 셸(zsh, bash, fish, PowerShell)에 탭 completion이 설치되어 있는지 확인합니다.

    - 셸 프로필이 느린 동적 completion 패턴(`source <(openclaw completion ...)`)을 사용하면 doctor가 더 빠른 캐시 파일 변형으로 업그레이드합니다.
    - completion이 프로필에 설정되어 있지만 캐시 파일이 없으면 doctor가 캐시를 자동으로 다시 생성합니다.
    - completion이 전혀 설정되어 있지 않으면 doctor가 설치할지 묻습니다(대화형 모드에서만, `--non-interactive`에서는 건너뜀).

    캐시를 수동으로 다시 생성하려면 `openclaw completion --write-state`를 실행하세요.

  </Accordion>
  <Accordion title="12. Gateway 인증 검사(로컬 토큰)">
    Doctor는 로컬 gateway 토큰 인증 준비 상태를 확인합니다.

    - 토큰 모드에 토큰이 필요하지만 토큰 소스가 없으면 doctor가 생성할 것을 제안합니다.
    - `gateway.auth.token`이 SecretRef 관리형이지만 사용할 수 없으면 doctor가 경고하고 이를 평문으로 덮어쓰지 않습니다.
    - `openclaw doctor --generate-gateway-token`은 토큰 SecretRef가 설정되어 있지 않을 때만 생성을 강제합니다.

  </Accordion>
  <Accordion title="12b. 읽기 전용 SecretRef 인식 복구">
    일부 복구 흐름은 런타임 fail-fast 동작을 약화하지 않으면서 설정된 자격 증명을 검사해야 합니다.

    - `openclaw doctor --fix`는 이제 대상 지정 구성 복구에 상태 계열 명령과 동일한 읽기 전용 SecretRef 요약 모델을 사용합니다.
    - 예: Telegram `allowFrom` / `groupAllowFrom` `@username` 복구는 사용 가능한 경우 구성된 봇 자격 증명을 사용하려고 시도합니다.
    - Telegram 봇 토큰이 SecretRef를 통해 구성되어 있지만 현재 명령 경로에서 사용할 수 없는 경우, doctor는 토큰이 누락되었다고 잘못 보고하거나 충돌하는 대신 자격 증명이 구성되었지만 사용할 수 없다고 보고하고 자동 확인을 건너뜁니다.

  </Accordion>
  <Accordion title="13. Gateway 상태 확인 + 재시작">
    Doctor는 상태 확인을 실행하고 Gateway가 비정상으로 보일 때 재시작을 제안합니다.
  </Accordion>
  <Accordion title="13b. 메모리 검색 준비 상태">
    Doctor는 구성된 메모리 검색 임베딩 공급자가 기본 에이전트에 대해 준비되었는지 확인합니다. 동작은 구성된 백엔드와 공급자에 따라 달라집니다.

    - **QMD 백엔드**: `qmd` 바이너리를 사용할 수 있고 시작 가능한지 검사합니다. 그렇지 않으면 npm 패키지와 수동 바이너리 경로 옵션을 포함한 수정 지침을 출력합니다.
    - **명시적 로컬 공급자**: 로컬 모델 파일 또는 인식 가능한 원격/다운로드 가능 모델 URL을 확인합니다. 없으면 원격 공급자로 전환할 것을 제안합니다.
    - **명시적 원격 공급자**(`openai`, `voyage` 등): API 키가 환경 또는 인증 저장소에 있는지 확인합니다. 없으면 실행 가능한 수정 힌트를 출력합니다.
    - **자동 공급자**: 먼저 로컬 모델 가용성을 확인한 다음, 자동 선택 순서대로 각 원격 공급자를 시도합니다.

    캐시된 Gateway 검사 결과를 사용할 수 있는 경우(확인 시점에 Gateway가 정상 상태였음), doctor는 해당 결과를 CLI에서 볼 수 있는 구성과 대조하고 불일치를 기록합니다. Doctor는 기본 경로에서 새 임베딩 핑을 시작하지 않습니다. 실시간 공급자 확인이 필요하면 심층 메모리 상태 명령을 사용하세요.

    런타임에서 임베딩 준비 상태를 확인하려면 `openclaw memory status --deep`를 사용하세요.

  </Accordion>
  <Accordion title="14. 채널 상태 경고">
    Gateway가 정상 상태이면 doctor는 채널 상태 검사를 실행하고 제안된 수정 사항과 함께 경고를 보고합니다.
  </Accordion>
  <Accordion title="15. Supervisor 구성 감사 + 복구">
    Doctor는 설치된 supervisor 구성(launchd/systemd/schtasks)에 누락되었거나 오래된 기본값(예: systemd network-online 종속성과 재시작 지연)이 있는지 확인합니다. 불일치를 찾으면 업데이트를 권장하고 서비스 파일/작업을 현재 기본값으로 다시 작성할 수 있습니다.

    참고:

    - `openclaw doctor`는 supervisor 구성을 다시 작성하기 전에 확인을 요청합니다.
    - `openclaw doctor --yes`는 기본 복구 프롬프트를 수락합니다.
    - `openclaw doctor --repair`는 프롬프트 없이 권장 수정 사항을 적용합니다.
    - `openclaw doctor --repair --force`는 사용자 지정 supervisor 구성을 덮어씁니다.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`은 Gateway 서비스 수명 주기에 대해 doctor를 읽기 전용으로 유지합니다. 여전히 서비스 상태를 보고하고 서비스가 아닌 복구를 실행하지만, 외부 supervisor가 해당 수명 주기를 소유하므로 서비스 설치/시작/재시작/bootstrap, supervisor 구성 재작성, 레거시 서비스 정리를 건너뜁니다.
    - Linux에서 doctor는 일치하는 systemd Gateway 유닛이 활성 상태일 때 명령/엔트리포인트 메타데이터를 다시 작성하지 않습니다. 또한 중복 서비스 스캔 중 비활성 비레거시 추가 Gateway 유사 유닛을 무시하여 동반 서비스 파일이 정리 잡음을 만들지 않게 합니다.
    - 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, doctor 서비스 설치/복구는 SecretRef를 검증하지만 확인된 일반 텍스트 토큰 값을 supervisor 서비스 환경 메타데이터에 유지하지 않습니다.
    - Doctor는 이전 LaunchAgent, systemd 또는 Windows Scheduled Task 설치가 인라인으로 포함한 관리형 `.env`/SecretRef 기반 서비스 환경 값을 감지하고, 해당 값이 supervisor 정의 대신 런타임 소스에서 로드되도록 서비스 메타데이터를 다시 작성합니다.
    - Doctor는 `gateway.port` 변경 후 서비스 명령이 여전히 이전 `--port`를 고정하고 있는 경우를 감지하고 서비스 메타데이터를 현재 포트로 다시 작성합니다.
    - 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 확인되지 않은 경우, doctor는 실행 가능한 지침과 함께 설치/복구 경로를 차단합니다.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, doctor는 모드가 명시적으로 설정될 때까지 설치/복구를 차단합니다.
    - Linux 사용자 systemd 유닛의 경우, doctor 토큰 드리프트 확인은 이제 서비스 인증 메타데이터를 비교할 때 `Environment=`와 `EnvironmentFile=` 소스를 모두 포함합니다.
    - 구성은 더 새로운 버전에서 마지막으로 작성되었는데 Gateway 서비스가 이전 OpenClaw 바이너리에서 실행 중인 경우, doctor 서비스 복구는 해당 서비스를 다시 작성하거나 중지하거나 재시작하지 않습니다. [Gateway 문제 해결](/ko/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)을 참조하세요.
    - `openclaw gateway install --force`를 통해 언제든 전체 재작성을 강제할 수 있습니다.

  </Accordion>
  <Accordion title="16. Gateway 런타임 + 포트 진단">
    Doctor는 서비스 런타임(PID, 마지막 종료 상태)을 검사하고 서비스가 설치되어 있지만 실제로 실행 중이 아닌 경우 경고합니다. 또한 Gateway 포트(기본값 `18789`)의 포트 충돌을 확인하고 가능한 원인(Gateway가 이미 실행 중, SSH 터널)을 보고합니다.
  </Accordion>
  <Accordion title="17. Gateway 런타임 모범 사례">
    Doctor는 Gateway 서비스가 Bun 또는 버전 관리 Node 경로(`nvm`, `fnm`, `volta`, `asdf` 등)에서 실행될 때 경고합니다. WhatsApp + Telegram 채널에는 Node가 필요하며, 서비스가 셸 초기화를 로드하지 않기 때문에 버전 관리자 경로는 업그레이드 후 중단될 수 있습니다. Doctor는 사용 가능한 경우 시스템 Node 설치(Homebrew/apt/choco)로 마이그레이션하도록 제안합니다.

    새로 설치되거나 복구된 macOS LaunchAgent는 대화형 셸 PATH를 복사하는 대신 표준 시스템 PATH(`/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`)를 사용하므로 Volta, asdf, fnm, pnpm 및 기타 버전 관리자 디렉터리가 어떤 Node 자식 프로세스가 확인되는지 변경하지 않습니다. Linux 서비스는 여전히 명시적 환경 루트(`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`)와 안정적인 사용자 bin 디렉터리를 유지하지만, 추정된 버전 관리자 대체 디렉터리는 해당 디렉터리가 디스크에 존재할 때만 서비스 PATH에 기록됩니다.

  </Accordion>
  <Accordion title="18. 구성 쓰기 + 마법사 메타데이터">
    Doctor는 모든 구성 변경 사항을 유지하고 doctor 실행을 기록하도록 마법사 메타데이터에 스탬프를 찍습니다.
  </Accordion>
  <Accordion title="19. 워크스페이스 팁(백업 + 메모리 시스템)">
    Doctor는 워크스페이스 메모리 시스템이 없으면 이를 제안하고, 워크스페이스가 아직 git 아래에 있지 않으면 백업 팁을 출력합니다.

    워크스페이스 구조와 git 백업(비공개 GitHub 또는 GitLab 권장)에 대한 전체 가이드는 [/concepts/agent-workspace](/ko/concepts/agent-workspace)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

- [Gateway 런북](/ko/gateway)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
