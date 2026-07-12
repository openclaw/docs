---
read_when:
    - doctor 마이그레이션 추가 또는 수정
    - 호환성을 깨뜨리는 구성 변경 사항 도입
sidebarTitle: Doctor
summary: 'Doctor 명령: 상태 검사, 구성 마이그레이션 및 복구 단계'
title: Doctor
x-i18n:
    generated_at: "2026-07-12T15:16:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 39e6be1fa29f2cc0e9832a4c8e5b0ae3dd2e7de43e2466df20f7067ef5ddf0a8
    source_path: gateway/doctor.md
    workflow: 16
---

`openclaw doctor`는 OpenClaw의 복구 및 마이그레이션 도구입니다. 오래된 구성/상태를 수정하고, 상태를 점검하며, 실행 가능한 복구 단계를 제공합니다.

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

    메시지를 표시하지 않고 기본값을 수락합니다(해당하는 경우 재시작/서비스/샌드박스 복구 단계 포함).

  </Tab>
  <Tab title="--fix">
    ```bash
    openclaw doctor --fix
    ```

    메시지를 표시하지 않고 권장 복구를 적용합니다(`--repair`는 별칭입니다).

  </Tab>
  <Tab title="--lint">
    ```bash
    openclaw doctor --lint
    openclaw doctor --lint --json
    ```

    CI 또는 사전 점검 자동화를 위한 구조화된 상태 점검을 실행합니다. 읽기 전용이며,
    메시지 표시, 복구, 마이그레이션, 재시작 또는 상태 쓰기를 수행하지 않습니다.

  </Tab>
  <Tab title="--fix --force">
    ```bash
    openclaw doctor --fix --force
    ```

    적극적인 복구도 적용합니다(사용자 지정 감독자 구성을 덮어씁니다).

  </Tab>
  <Tab title="--non-interactive">
    ```bash
    openclaw doctor --non-interactive
    ```

    메시지를 표시하지 않고 안전한 마이그레이션만 적용하여 실행합니다(구성 정규화 +
    디스크상의 상태 이동). 사람의 확인이 필요한 재시작/서비스/샌드박스 작업은
    건너뜁니다. 레거시 상태 마이그레이션은 감지될 경우 계속 자동으로 실행됩니다.

  </Tab>
  <Tab title="--deep">
    ```bash
    openclaw doctor --deep
    ```

    추가 Gateway 설치를 찾기 위해 시스템 서비스(launchd/systemd/schtasks)를 검사합니다.

  </Tab>
</Tabs>

쓰기 전에 변경 사항을 검토하려면 먼저 구성 파일을 여십시오.

```bash
cat ~/.openclaw/openclaw.json
```

## 읽기 전용 린트 모드

`openclaw doctor --lint`는 자동화에 적합한
`openclaw doctor --fix`의 짝입니다. 두 명령은 동일한 Doctor 규칙 레지스트리를 공유하지만
규칙을 선택하거나 적용하는 방식은 다릅니다.

| 모드                     | 메시지 표시 | 구성/상태 쓰기          | 출력                   | 용도                            |
| ------------------------ | ----------- | ----------------------- | ---------------------- | ------------------------------- |
| `openclaw doctor`        | 예          | 아니요                  | 친숙한 상태 보고서     | 사람이 상태를 확인할 때         |
| `openclaw doctor --fix`  | 경우에 따라 | 예, 복구 정책에 따름    | 친숙한 복구 로그       | 승인된 복구를 적용할 때         |
| `openclaw doctor --lint` | 아니요      | 아니요                  | 구조화된 발견 사항     | CI, 사전 점검 및 검토 게이트    |

기본 `doctor --lint`는 광범위하고 안전한 자동화 프로필을 실행합니다. 즉,
정적이고 로컬에서 수행되며 CI 또는 사전 점검 출력에 유용한 검사를 실행합니다. 권고성 검사,
환경에 민감한 검사, 실행 중인 서비스에 의존하는 검사, 계정/워크스페이스
인벤토리 또는 이전 데이터 정리 검사는 건너뜁니다. 이러한 선택형 검사를 포함한
등록된 전체 린트 감사를 원하면 `doctor --lint --all`을 사용하고, 특정 검사만
실행하려면 `--only <id>`를 사용하십시오.

`doctor --fix`는 기본 린트 프로필을 사용하지 않으며
`--all`을 허용하지 않습니다. Doctor의 순서가 지정된 복구 경로를 실행합니다. 최신 상태 검사는
선택적인 `repair()` 구현을 제공할 수 있으며, 이전 영역은 여전히 레거시
Doctor 복구 흐름을 사용합니다. 일부 린트 발견 사항은 의도적으로 진단 전용이므로
검사가 `--lint --all`에 표시된다고 해서 `--fix`가 해당 영역을 변경한다는 의미는 아닙니다.
이 계약은 `detect()`(발견 사항 보고)와 `repair()`(변경 사항/차이/부수 효과 보고)를
분리하여 린트 검사를 변경 계획기로 만들지 않고도 향후
`doctor --fix --dry-run`을 위한 경로를 열어 둡니다.

일부 기본 제공 검사는 내부적으로 기본 비활성화되어 있어 기본
`doctor --lint` 자동화 프로필의 일부가 되지 않으면서도 `--all`, `--only`,
Doctor 복구 흐름에서 사용할 수 있습니다. 발견 사항의 심각도는 여전히 각
발견 사항별로 (`info`, `warning`, 또는 `error`) 출력됩니다. 기본 선택은 심각도
수준이 아닙니다.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --only core/doctor/gateway-config --json
```

JSON 출력 필드:

- `ok`: 발견 사항 중 선택한 심각도 임계값을 충족한 항목이 있는지 여부
- `checksRun` / `checksSkipped`: 개수(프로필, `--only` 또는 `--skip`에 의해 건너뜀)
- `findings`: `checkId`, `severity`, `message`와 선택적인 `path`, `line`, `column`, `ocPath`, `source`, `target`, `requirement`, `fixHint`가 포함된 구조화된 진단

종료 코드:

| 코드 | 의미                                                     |
| ---- | -------------------------------------------------------- |
| `0`  | 선택한 임계값 이상의 발견 사항 없음                     |
| `1`  | 하나 이상의 발견 사항이 선택한 임계값을 충족함          |
| `2`  | 발견 사항을 출력하기 전에 명령/런타임 실패 발생         |

플래그:

- `--severity-min info|warning|error`(기본값 `warning`): 출력할 항목과 0이 아닌 종료 코드를 발생시킬 항목을 모두 제어합니다.
- `--all`: 기본 자동화 집합에서 제외된 선택형 검사를 포함하여 등록된 모든 린트 검사를 실행합니다.
- `--only <id>`(반복 가능): 지정한 검사 ID만 실행합니다. 알 수 없는 ID는 오류 발견 사항으로 보고됩니다.
- `--skip <id>`(반복 가능): 나머지 실행은 유지하면서 특정 검사를 제외합니다.
- `--json`, `--severity-min`, `--all`, `--only`, `--skip`에는 `--lint`가 필요합니다. 일반 `openclaw doctor` 및 `--fix` 실행에서는 이를 거부합니다.

## 수행 작업(요약)

<AccordionGroup>
  <Accordion title="상태, UI 및 업데이트">
    - git 설치에 대한 선택적 사전 업데이트를 수행합니다(대화형 모드에서만).
    - UI 프로토콜 최신 상태를 확인합니다(프로토콜 스키마가 더 최신이면 Control UI를 다시 빌드합니다).
    - 상태 점검 및 재시작 메시지를 표시합니다.
    - Skills 상태 요약(사용 가능/누락/차단) 및 Plugin 상태를 표시합니다.

  </Accordion>
  <Accordion title="구성 및 마이그레이션">
    - 레거시 값 형태의 구성을 정규화합니다.
    - 레거시 플랫 `talk.*` 필드를 `talk.provider` + `talk.providers.<provider>`로 마이그레이션합니다.
    - 레거시 Chrome 확장 프로그램 구성과 Chrome MCP 준비 상태에 대한 브라우저 마이그레이션을 확인합니다.
    - OpenCode 제공자 재정의 경고를 표시합니다(`models.providers.opencode` / `opencode-zen` / `opencode-go`).
    - 레거시 OpenAI Codex 제공자/프로필을 마이그레이션하고(`openai-codex` → `openai`), 오래된 `models.providers.openai-codex`에 대한 섀도잉 경고를 표시합니다.
    - OpenAI Codex OAuth 프로필의 OAuth TLS 필수 조건을 확인합니다.
    - `plugins.allow`가 제한적인데도 도구 정책에서 와일드카드나 Plugin 소유 도구를 요구하는 경우 Plugin/도구 허용 목록 경고를 표시합니다.
    - 레거시 디스크 상태(세션/에이전트 디렉터리/WhatsApp 인증)를 마이그레이션합니다.
    - 레거시 Plugin 매니페스트 계약 키를 마이그레이션합니다(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
    - 레거시 Cron 저장소를 마이그레이션합니다(`jobId`, `schedule.cron`, 최상위 전달/페이로드 필드, 페이로드 `provider`, `notify: true` Webhook 폴백 작업).
    - `agents.defaults`, `agents.list[]`, `models.providers.*`(모델별 항목 포함) 전체에서 Codex CLI 런타임 고정을 복구합니다(`agentRuntime.id: "codex-cli"` → `"codex"`).
    - Plugin이 활성화된 경우 오래된 Plugin 구성을 정리합니다. `plugins.enabled=false`이면 오래된 Plugin 참조를 비활성 격리 구성으로 유지합니다.

  </Accordion>
  <Accordion title="상태 및 무결성">
    - 세션 잠금 파일을 검사하고 오래된 잠금을 정리합니다.
    - 영향을 받은 2026.4.24 빌드에서 생성된 중복 프롬프트 재작성 분기의 세션 트랜스크립트를 복구합니다.
    - 교착된 하위 에이전트의 재시작 복구 툼스톤을 감지하며, `--fix`를 사용하면 오래된 중단 복구 플래그를 지워 시작 시 하위 항목을 재시작 중단 상태로 계속 처리하지 않도록 할 수 있습니다.
    - 상태 무결성과 권한(세션, 트랜스크립트, 상태 디렉터리)을 확인합니다.
    - 로컬에서 실행할 때 구성 파일 권한(chmod 600)을 확인합니다.
    - 모델 인증 상태: OAuth 만료를 확인하고, 만료가 임박한 토큰을 갱신할 수 있으며, 인증 프로필의 쿨다운/비활성화 상태를 보고합니다.

  </Accordion>
  <Accordion title="Gateway, 서비스 및 감독자">
    - 샌드박스가 활성화되어 있으면 샌드박스 이미지를 복구합니다.
    - 레거시 서비스를 마이그레이션하고 추가 Gateway를 감지합니다.
    - Matrix 채널의 레거시 상태를 마이그레이션합니다(`--fix` / `--repair` 모드).
    - Gateway 런타임을 확인합니다(서비스는 설치되어 있지만 실행되지 않음, 캐시된 launchd 레이블).
    - 채널 상태 경고를 표시합니다(실행 중인 Gateway에서 프로브).
    - 채널별 권한 검사는 `openclaw channels capabilities`에서 수행합니다. 예를 들어 Discord 음성 채널 권한은 `openclaw channels capabilities --channel discord --target channel:<channel-id>`로 감사합니다.
    - 로컬 TUI 클라이언트가 계속 실행 중인 상태에서 Gateway 이벤트 루프 상태가 저하된 경우 WhatsApp 응답성을 확인합니다. `--fix`는 검증된 로컬 TUI 클라이언트만 중지합니다.
    - 기본 모델, 폴백, 이미지/동영상 생성 모델, Heartbeat/하위 에이전트/Compaction 재정의, 훅, 채널 모델 재정의 및 세션 경로 고정의 레거시 `openai-codex/*` 모델 참조에 대해 Codex 경로를 복구합니다. `--fix`는 이를 `openai/*`로 다시 작성하고, `openai-codex:*` 인증 프로필/순서를 `openai:*`로 마이그레이션하며, 오래된 세션/전체 에이전트 런타임 고정을 제거하고, 복구된 유효 경로를 통해 Codex 호환 여부를 결정합니다.
    - 선택적 복구와 함께 감독자 구성(launchd/systemd/schtasks)을 감사합니다.
    - 설치 또는 업데이트 중 셸의 `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY` 값을 캡처한 Gateway 서비스에서 포함된 프록시 환경을 정리합니다.
    - Gateway 런타임 모범 사례(Node와 Bun 비교, 버전 관리자 경로)를 확인합니다.
    - Gateway 포트 충돌을 진단합니다(기본값 `18789`).

  </Accordion>
  <Accordion title="인증, 보안 및 페어링">
    - 개방형 DM 정책에 대한 보안 경고를 표시합니다.
    - 로컬 토큰 모드의 Gateway 인증을 확인합니다(토큰 소스가 없으면 토큰 생성을 제안하며, 토큰 SecretRef 구성은 덮어쓰지 않습니다).
    - 기기 페어링 문제를 감지합니다(대기 중인 최초 페어링 요청, 대기 중인 역할/범위 업그레이드, 오래된 로컬 기기 토큰 캐시 불일치 및 페어링된 레코드의 인증 불일치).

  </Accordion>
  <Accordion title="워크스페이스 및 셸">
    - Linux에서 systemd linger를 확인합니다.
    - 워크스페이스 부트스트랩 파일 크기를 확인합니다(컨텍스트 파일의 잘림/한도 근접 경고).
    - 기본 에이전트의 Skills 준비 상태를 확인합니다. 바이너리, 환경, 구성 또는 OS 요구 사항이 누락된 허용된 Skills를 보고하며, `--fix`를 사용하면 `skills.entries`에서 사용할 수 없는 Skills를 비활성화할 수 있습니다.
    - 셸 자동 완성 상태를 확인하고 자동 설치/업그레이드합니다.
    - 메모리 검색 임베딩 제공자의 준비 상태를 확인합니다(로컬 모델, 원격 API 키 또는 QMD 바이너리).
    - 소스 설치를 확인합니다(pnpm 워크스페이스 불일치, 누락된 UI 자산, 누락된 tsx 바이너리).
    - 업데이트된 구성 및 마법사 메타데이터를 씁니다.

  </Accordion>
</AccordionGroup>

## Dreams UI 백필 및 재설정

Control UI Dreams 장면에는 근거 기반 Dreaming 워크플로를 위한 **백필**, **재설정**, **근거 기반 항목 지우기** 작업이 포함되어 있습니다. 이 작업들은 Gateway doctor 스타일 RPC 메서드를 사용하지만 `openclaw doctor` CLI 복구/마이그레이션의 일부는 **아닙니다**.

| 작업                  | 수행 내용                                                                                                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 백필                  | 활성 워크스페이스의 이전 `memory/YYYY-MM-DD.md` 파일을 검사하고, 근거 기반 REM 일기 패스를 실행한 후 되돌릴 수 있는 백필 항목을 `DREAMS.md`에 씁니다.                           |
| 재설정                | `DREAMS.md`에서 표시된 백필 일기 항목만 제거합니다.                                                                                                                            |
| 근거 기반 항목 지우기 | 아직 실시간 회상 또는 일별 지원이 누적되지 않은 이전 재생의 준비된 근거 기반 전용 단기 항목만 제거합니다.                                                                       |

  이 중 어느 것도 자체적으로 `MEMORY.md`를 편집하거나, 전체 doctor 마이그레이션을 실행하거나, 근거가 있는 후보를 실제 단기 승격 저장소에 스테이징하지 않습니다. 근거가 있는 과거 재실행 데이터를 일반 심층 승격 단계에 제공하려면 대신 다음 CLI 흐름을 사용하십시오.

  ```bash
  openclaw memory rem-backfill --path ./memory --stage-short-term
  ```

  이 명령은 `DREAMS.md`를 검토 화면으로 유지하면서 근거가 있는 영구 후보를 단기 Dreaming 저장소에 스테이징합니다.

  ## 세부 동작 및 근거

  <AccordionGroup>
  <Accordion title="0. 선택적 업데이트(git 설치)">
    git 체크아웃이며 doctor가 대화형으로 실행 중인 경우, doctor를 실행하기 전에 업데이트(fetch/rebase/build)를 제안합니다.
  </Accordion>
  <Accordion title="1. 구성 정규화">
    Doctor는 레거시 값 형식을 현재 스키마로 정규화합니다. 현재 Talk 음성 구성은 `talk.provider` + `talk.providers.<provider>`이며, 실시간 음성 구성은 `talk.realtime.*` 아래에 있습니다. Doctor는 이전 `talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` / `talk.apiKey` 형식을 제공자 맵으로 다시 작성하고, 레거시 최상위 실시간 선택자(`talk.mode`, `talk.transport`, `talk.brain`, `talk.model`, `talk.voice`)를 `talk.realtime`으로 다시 작성합니다.

    또한 Doctor는 `plugins.allow`가 비어 있지 않고 도구 정책에서 와일드카드 또는 Plugin 소유 도구 항목을 사용할 때 경고합니다. `tools.allow: ["*"]`는 실제로 로드되는 Plugin의 도구만 일치시키며, 독점적 Plugin 허용 목록을 우회하지 않습니다.

  </Accordion>
  <Accordion title="2. 레거시 구성 키 마이그레이션">
    구성에 활성 마이그레이션이 있는 더 이상 사용되지 않는 키가 포함되어 있으면 다른 명령은 실행을 거부하고 `openclaw doctor`를 실행하도록 요청합니다. Doctor는 발견된 레거시 키를 설명하고, 적용한 마이그레이션을 표시하며, 업데이트된 스키마로 `~/.openclaw/openclaw.json`을 다시 작성합니다. Gateway 시작은 레거시 구성 형식을 거부하고 `openclaw doctor --fix`를 실행하도록 요청하며, 시작 시 `openclaw.json`을 다시 작성하지 않습니다. Cron 작업 저장소 마이그레이션도 `openclaw doctor --fix`에서 처리합니다.

    <Note>
      Doctor는 키가 폐기된 후 대략 두 달 동안만 자동 마이그레이션을
      제공합니다. 더 오래된 레거시 키(예: 다중 에이전트 이전 구성 형식의
      원래 `routing.queue`, `routing.bindings`, `routing.agents`/`defaultAgentId`,
      `routing.transcribeAudio`, 최상위 `agent.*` 또는 최상위 `identity`)에는
      더 이상 마이그레이션 경로가 없으며, 이제 이러한 키를 사용하는 구성은
      다시 작성되는 대신 유효성 검사에 실패합니다. Doctor가 진행할 수 있도록
      현재 구성 참조에 맞춰 해당 키를 직접 수정하십시오.
    </Note>

    활성 마이그레이션:

    | 레거시 키                                                                                    | 현재 키                                                                 |
    | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
    | `routing.allowFrom`                                                                              | `channels.whatsapp.allowFrom`                                                |
    | `routing.groupChat.requireMention`                                                               | `channels.whatsapp/telegram/imessage.groups."*".requireMention`             |
    | `routing.groupChat.historyLimit`                                                                 | `messages.groupChat.historyLimit`                                            |
    | `routing.groupChat.mentionPatterns`                                                              | `messages.groupChat.mentionPatterns`                                         |
    | `channels.telegram.requireMention`                                                               | `channels.telegram.groups."*".requireMention`                               |
    | `channels.webchat`, `gateway.webchat`                                                            | 제거됨(WebChat은 폐기됨)                                                 |
    | `channels.feishu.accounts.<accountId>.botName`                                                   | `channels.feishu.accounts.<accountId>.name`                                 |
    | `session.threadBindings.ttlHours`, `channels.<id>.threadBindings.ttlHours`(계정별 설정 포함)      | `...threadBindings.idleHours`                                               |
    | 레거시 `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey`        | `talk.provider` + `talk.providers.<provider>`                               |
    | 레거시 최상위 실시간 Talk 선택기(`talk.mode`/`talk.transport`/`talk.brain`/`talk.model`/`talk.voice`) | `talk.realtime`                                                              |
    | `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)                             | `messages.tts.providers.<provider>`                                          |
    | `messages.tts.provider: "edge"` / `messages.tts.providers.edge`                                  | `messages.tts.provider: "microsoft"` / `messages.tts.providers.microsoft`   |
    | TTS 화자 필드 `voice`/`voiceName`/`voiceId`                                                 | `speakerVoice`/`speakerVoiceId`                                              |
    | `channels.<id>.tts.<provider>` / `channels.<id>.accounts.<accountId>.tts.<provider>`(Discord를 제외한 모든 채널)                                          | `...tts.providers.<provider>`                                                |
    | `channels.<id>.voice.tts.<provider>` / `channels.<id>.accounts.<accountId>.voice.tts.<provider>`(Discord를 포함한 모든 채널)                          | `...voice.tts.providers.<provider>`                                          |
    | `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`)     | `plugins.entries.voice-call.config.tts.providers.<provider>`                |
    | `plugins.entries.voice-call.config.tts.provider: "edge"` / `...tts.providers.edge`                | `provider: "microsoft"` / `...tts.providers.microsoft`                      |
    | `plugins.entries.voice-call.config.provider: "log"`                                              | `"mock"`                                                                      |
    | `plugins.entries.voice-call.config.twilio.from`                                                  | `plugins.entries.voice-call.config.fromNumber`                              |
    | `plugins.entries.voice-call.config.streaming.sttProvider`                                        | `plugins.entries.voice-call.config.streaming.provider`                      |
    | `plugins.entries.voice-call.config.streaming.openaiApiKey`/`sttModel`/`silenceDurationMs`/`vadThreshold` | `plugins.entries.voice-call.config.streaming.providers.openai.*`             |
    | `models.providers.*.api: "openai"`                                                               | `"openai-completions"`(Gateway 시작 시에도 `api`가 향후 또는 알 수 없는 열거형 값인 공급자는 실패로 종료하는 대신 건너뜀) |
    | `browser.ssrfPolicy.allowPrivateNetwork`                                                         | `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`                          |
    | `browser.profiles.*.driver: "extension"`                                                         | `"existing-session"`                                                          |
    | `browser.relayBindHost`                                                                          | 제거됨(레거시 Chrome 확장 프로그램 릴레이 설정)                             |
    | `mcp.servers.*.type`(CLI 네이티브 별칭)                                                        | `mcp.servers.*.transport`                                                    |
    | `plugins.entries.codex.config.codexDynamicToolsProfile`                                          | 제거됨(Codex 앱 서버는 항상 Codex 네이티브 워크스페이스 도구를 네이티브 상태로 유지함) |
    | `commands.modelsWrite`                                                                           | 제거됨(`/models add`는 더 이상 사용되지 않음)                                       |
    | `agents.defaults/list[].silentReplyRewrite`, `surfaces.*.silentReplyRewrite`                     | 제거됨(정확한 `NO_REPLY`가 더 이상 표시되는 대체 텍스트로 다시 작성되지 않음)  |
    | `agents.defaults/list[].systemPromptOverride`                                                    | 제거됨(OpenClaw가 생성된 시스템 프롬프트를 관리함)                        |
    | `agents.defaults/list[].embeddedPi`                                                              | `embeddedAgent`                                                              |
    | `agents.defaults/list[].sandbox.perSession`                                                      | `sandbox.scope`                                                              |
    | `agents.defaults.llm`                                                                             | 제거됨(느린 모델/공급자 시간 제한에는 `models.providers.<id>.timeoutSeconds`를 사용하며, 에이전트/실행 시간 제한 상한보다 낮게 유지됨) |
    | 최상위 `memorySearch`                                                                         | `agents.defaults.memorySearch`                                              |
    | `memorySearch.provider: "auto"`                                                                  | `"openai"`                                                                    |
    | `memorySearch.store.path`(모든 수준)                                                            | 제거됨(메모리 인덱스는 각 에이전트 데이터베이스에 저장됨)                       |
    | 최상위 `heartbeat`                                                                            | `agents.defaults.heartbeat` / `channels.defaults.heartbeat`                 |
    | `plugins.openai-codex` 정책 ID                                                                | `plugins.openai`                                                             |
    | `tools.web.x_search.apiKey`                                                                      | `plugins.entries.xai.config.webSearch.apiKey`                               |
    | `session.maintenance.rotateBytes`, `session.parentForkMaxTokens`                                 | 제거됨(더 이상 사용되지 않음)                                                        |
    | `diagnostics.memoryPressureBundle`                                                               | `diagnostics.memoryPressureSnapshot`                                        |

    <Note>
      위의 `plugins.entries.voice-call.config.*` 행은 `openclaw
      doctor`가 아니라 Voice Call Plugin 자체에서 구성을 불러올 때마다
      정규화합니다. 또한 Plugin은 시작 시 `openclaw
      doctor --fix`를 안내하는 경고를 기록하지만, 현재 doctor는 이러한 키에 대해
      `openclaw.json`을 다시 작성하지 않습니다. 런타임에 변경 사항을
      적용하는 것은 Plugin 자체의 정규화입니다.
    </Note>

    다중 계정 채널의 계정 기본값 지침:

    - `channels.<channel>.defaultAccount` 또는 `accounts.default` 없이 `channels.<channel>.accounts` 항목이 두 개 이상 구성되어 있으면, 대체 라우팅에서 예상치 못한 계정을 선택할 수 있다고 doctor가 경고합니다.
    - `channels.<channel>.defaultAccount`가 알 수 없는 계정 ID로 설정되어 있으면, doctor가 경고하고 구성된 계정 ID를 나열합니다.

  </Accordion>
  <Accordion title="2b. OpenCode 공급자 재정의">
    `models.providers.opencode`, `opencode-zen` 또는 `opencode-go`를 수동으로 추가한 경우 `openclaw/plugin-sdk/llm`의 기본 제공 OpenCode 카탈로그를 재정의합니다. 이로 인해 모델이 잘못된 API를 사용하거나 비용이 0으로 설정될 수 있습니다. 재정의를 제거하고 모델별 API 라우팅과 비용을 복원할 수 있도록 Doctor가 경고합니다.
  </Accordion>
  <Accordion title="2c. 브라우저 마이그레이션 및 Chrome MCP 준비 상태">
    브라우저 구성이 여전히 제거된 Chrome 확장 프로그램 경로를 가리키는 경우 Doctor는 이를 현재의 호스트 로컬 Chrome MCP 연결 모델로 정규화합니다(`browser.profiles.*.driver: "extension"` → `"existing-session"`; `browser.relayBindHost` 제거).

    `defaultProfile: "user"` 또는 구성된 `existing-session` 프로필을 사용하는 경우 Doctor는 호스트 로컬 Chrome MCP 경로도 검사합니다.

    - 기본 자동 연결 프로필에 대해 동일한 호스트에 Google Chrome이 설치되어 있는지 확인합니다
    - 감지된 Chrome 버전을 확인하고 Chrome 144 미만이면 경고합니다
    - 브라우저 검사 페이지(예: `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging` 또는 `edge://inspect/#remote-debugging`)에서 원격 디버깅을 활성화하도록 안내합니다

    Doctor가 Chrome 측 설정을 대신 활성화할 수는 없습니다. 호스트 로컬 Chrome MCP를 사용하려면 Gateway/Node 호스트에서 Chromium 기반 브라우저 144+가 로컬로 실행 중이어야 하며, 원격 디버깅을 활성화하고 브라우저에서 최초 연결 동의 프롬프트를 승인해야 합니다.

    여기서 준비 상태는 로컬 연결의 사전 요구 사항만 다룹니다. 기존 세션은 현재 Chrome MCP 경로 제한을 그대로 유지합니다. `responsebody`, PDF 내보내기, 다운로드 가로채기, 일괄 작업과 같은 고급 경로에는 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다. 이 검사는 Docker, 샌드박스, 원격 브라우저 또는 기타 헤드리스 흐름에는 적용되지 않으며, 이러한 흐름은 계속 원시 CDP를 사용합니다.

  </Accordion>
  <Accordion title="2d. OAuth TLS 사전 요구 사항">
    OpenAI Codex OAuth 프로필이 구성되면 Doctor는 OpenAI 권한 부여 엔드포인트를 탐색하여 로컬 Node/OpenSSL TLS 스택이 인증서 체인을 검증할 수 있는지 확인합니다. 탐색이 인증서 오류(예: `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, 만료된 인증서 또는 자체 서명 인증서)로 실패하면 Doctor는 플랫폼별 해결 지침을 출력합니다. Homebrew Node를 사용하는 macOS에서는 일반적으로 `brew postinstall ca-certificates`로 해결합니다. `--deep`을 사용하면 Gateway가 정상이어도 탐색을 실행합니다.
  </Accordion>
  <Accordion title="2e. Codex OAuth 공급자 재정의">
    이전에 `models.providers.openai-codex` 아래에 레거시 OpenAI 전송 설정을 추가했다면 기본 제공 Codex OAuth 공급자 경로를 가릴 수 있습니다. Doctor는 Codex OAuth와 함께 이러한 이전 전송 설정을 감지하면 오래된 전송 재정의를 제거하거나 다시 작성하여 현재 라우팅 동작을 복원할 수 있도록 경고합니다. 사용자 지정 프록시와 헤더 전용 재정의는 계속 지원되며 이 경고를 트리거하지 않지만, 이렇게 작성된 요청 경로는 암시적 Codex 선택 대상이 아닙니다.
  </Accordion>
  <Accordion title="2f. Codex 경로 복구">
    Doctor는 레거시 `openai-codex/*` 모델 참조를 확인합니다. 네이티브 Codex 하네스 라우팅은 표준 `openai/*` 모델 참조를 사용하지만, 접두사만으로는 Codex가 선택되지 않습니다. 런타임 정책이 설정되지 않았거나 `auto`인 경우, 작성된 요청 재정의가 없는 정확한 공식 HTTPS Platform Responses 또는 ChatGPT Responses 경로만 대상이 됩니다. [OpenAI 암시적 에이전트 런타임](/ko/providers/openai#implicit-agent-runtime)을 참조하십시오.

    `--fix` / `--repair` 모드에서 Doctor는 기본 에이전트 및 에이전트별 참조를 다시 작성합니다. 여기에는 기본 모델, 폴백, 이미지/동영상 생성 모델, Heartbeat/하위 에이전트/Compaction 재정의, 훅, 채널 모델 재정의, 오래되어 지속된 세션 경로 상태가 포함됩니다.

    - `openai-codex/gpt-*`는 `openai/gpt-*`가 됩니다.
    - 복구된 에이전트 모델 참조의 Codex 의도는 공급자/모델 범위 `agentRuntime.id: "codex"` 항목으로 이동합니다.
    - 런타임 선택은 공급자/모델 범위이므로 오래된 전체 에이전트 런타임 구성 및 지속된 세션 런타임 고정 값이 제거됩니다.
    - 복구된 레거시 모델 참조가 이전 인증 경로를 유지하기 위해 Codex 라우팅을 필요로 하지 않는 한 기존 공급자/모델 런타임 정책은 보존됩니다.
    - 기존 모델 폴백 목록은 레거시 항목을 다시 작성한 상태로 보존되며, 복사된 모델별 설정은 레거시 키에서 표준 `openai/*` 키로 이동합니다.
    - 지속된 세션 `modelProvider`/`providerOverride`, `model`/`modelOverride`, 폴백 알림 및 인증 프로필 고정 값은 발견된 모든 에이전트 세션 저장소에서 복구됩니다.
    - Doctor는 별개의 레거시 런타임 ID인 오래된 `agentRuntime.id: "codex-cli"` 고정 값을 `agents.defaults`, `agents.list[]` 및 `models.providers.*` 모델 항목 전체에서 `"codex"`로 별도 복구합니다.
    - `/codex ...`는 "채팅에서 네이티브 Codex 대화를 제어하거나 연결합니다"라는 뜻입니다.
    - `/acp ...` 또는 `runtime: "acp"`는 "외부 ACP/acpx 어댑터를 사용합니다"라는 뜻입니다.

  </Accordion>
  <Accordion title="2g. 세션 경로 정리">
    Doctor는 Codex와 같이 Plugin이 소유하는 경로에서 구성된 모델이나 런타임을 이동한 후 남은 오래된 자동 생성 경로 상태가 있는지 발견된 에이전트 세션 저장소도 검사합니다.

    `openclaw doctor --fix`는 소유 경로가 더 이상 구성되지 않은 경우 `modelOverrideSource: "auto"` 모델 고정 값, 런타임 모델 메타데이터, 고정된 하네스 ID, CLI 세션 바인딩 및 자동 인증 프로필 재정의와 같은 자동 생성된 오래된 상태를 지울 수 있습니다. 사용자가 명시적으로 선택했거나 레거시 세션에서 선택한 모델은 수동 검토 대상으로 보고되며 변경되지 않습니다. 해당 경로를 더 이상 사용하지 않으려면 `/model ...`, `/new`를 사용하여 전환하거나 세션을 재설정하십시오.

  </Accordion>
  <Accordion title="3. 레거시 상태 마이그레이션(디스크 레이아웃)">
    Doctor는 이전 온디스크 레이아웃을 현재 구조로 마이그레이션할 수 있습니다.

    - 세션 저장소 및 트랜스크립트: `~/.openclaw/sessions/`에서 `~/.openclaw/agents/<agentId>/sessions/`로
    - 에이전트 디렉터리: `~/.openclaw/agent/`에서 `~/.openclaw/agents/<agentId>/agent/`로
    - WhatsApp 인증 상태(Baileys): 레거시 `~/.openclaw/credentials/*.json`(`oauth.json` 제외)에서 `~/.openclaw/credentials/whatsapp/<accountId>/...`로(기본 계정 ID: `default`)

    이러한 마이그레이션은 최선형 방식이며 멱등성을 갖습니다. Doctor는 백업으로 남겨 둔 레거시 폴더가 있으면 경고합니다. Gateway/CLI도 시작 시 레거시 세션과 에이전트 디렉터리를 자동으로 마이그레이션하므로 Doctor를 수동으로 실행하지 않아도 기록/인증/모델이 에이전트별 경로로 이동합니다. WhatsApp 인증은 의도적으로 `openclaw doctor`를 통해서만 마이그레이션됩니다. Talk 공급자/공급자 맵 정규화는 구조적 동등성을 기준으로 비교하므로 키 순서만 다른 차이는 더 이상 반복적인 무변경 `doctor --fix` 변경을 트리거하지 않습니다.

  </Accordion>
  <Accordion title="3a. 레거시 Plugin 매니페스트 마이그레이션">
    Doctor는 설치된 모든 Plugin 매니페스트에서 더 이상 사용되지 않는 최상위 기능 키(`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders`)를 검사합니다. 발견되면 이를 `contracts` 객체로 이동하고 매니페스트 파일을 그 자리에서 다시 작성하도록 제안합니다. 이 마이그레이션은 멱등성을 갖습니다. `contracts`에 이미 동일한 값이 있으면 데이터를 중복하지 않고 레거시 키를 제거합니다.
  </Accordion>
  <Accordion title="3b. 레거시 Cron 저장소 마이그레이션">
    Doctor는 Cron 작업 저장소(기본값: `~/.openclaw/cron/jobs.json`, 재정의된 경우 `cron.store`)에서 스케줄러가 호환성을 위해 여전히 허용하는 이전 작업 형태도 확인합니다.

    현재 Cron 정리 항목은 다음과 같습니다.

    - `jobId` → `id`
    - `schedule.cron` → `schedule.expr`
    - 최상위 페이로드 필드(`message`, `model`, `thinking`, ...) → `payload`
    - 최상위 전달 필드(`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
    - 페이로드 `provider` 전달 별칭 → 명시적 `delivery.channel`
    - 레거시 `notify: true` Webhook 폴백 작업 → `cron.webhook`이 설정된 경우 명시적 Webhook 전달. 알림 작업은 채팅 전달을 유지하고 `delivery.completionDestination`을 받습니다. `cron.webhook`이 설정되지 않은 경우 런타임 전달에서 읽지 않으므로 대상이 없는 작업에서는 비활성 최상위 `notify` 표시가 제거됩니다(알림을 포함한 기존 전달은 보존됨).

    Gateway는 로드 시 잘못된 Cron 행도 정리하여 유효한 작업이 계속 실행되도록 합니다. 원시의 잘못된 행은 `jobs.json`에서 제거되기 전에 활성 저장소 옆의 `jobs-quarantine.json`에 복사됩니다. Doctor는 격리된 행을 보고하므로 수동으로 검토하거나 복구할 수 있습니다.

    Gateway 시작 시 런타임 투영을 정규화하고 최상위 `notify` 표시를 무시하지만, Doctor가 복구할 수 있도록 지속된 Cron 구성은 그대로 둡니다. `cron.webhook`이 설정되지 않은 경우 Doctor는 마이그레이션 대상이 없는 작업(`delivery.mode`가 없거나 미지정됨, 사용할 수 없는 Webhook 대상 또는 기존 알림/채팅 전달)에서 비활성 표시를 제거하고 기존 전달은 변경하지 않습니다. 따라서 반복적인 `doctor --fix` 실행에서 동일한 작업에 대해 더 이상 다시 경고하지 않습니다. `cron.webhook`이 설정되어 있지만 유효한 HTTP(S) URL이 아닌 경우 Doctor는 계속 경고하고 URL을 수정할 수 있도록 표시를 남겨 둡니다.

    Linux에서는 사용자의 crontab이 여전히 레거시 `~/.openclaw/bin/ensure-whatsapp.sh`를 호출하는 경우에도 Doctor가 경고합니다. 이 호스트 로컬 스크립트는 현재 OpenClaw에서 유지 관리되지 않으며, Cron이 systemd 사용자 버스에 연결할 수 없을 때 `~/.openclaw/logs/whatsapp-health.log`에 잘못된 `Gateway inactive` 메시지를 기록할 수 있습니다. `crontab -e`로 오래된 crontab 항목을 제거하십시오. 현재 상태 확인에는 `openclaw channels status --probe`, `openclaw doctor` 및 `openclaw gateway status`를 사용하십시오.

  </Accordion>
  <Accordion title="3c. 세션 잠금 정리">
    Doctor는 비정상적으로 종료된 세션이 남긴 오래된 쓰기 잠금 파일이 있는지 모든 에이전트 세션 디렉터리를 검사합니다. 발견된 각 잠금 파일에 대해 경로, PID, PID의 생존 여부, 잠금 기간 및 오래된 것으로 간주되는지 여부(종료된 PID, 잘못된 소유자 메타데이터, 30분 초과 또는 OpenClaw가 아닌 프로세스에 속한 것으로 확인된 활성 PID)를 보고합니다. `--fix` / `--repair` 모드에서는 종료되었거나, 고아 상태이거나, 재사용되었거나, 오래되고 잘못되었거나, OpenClaw가 아닌 소유자의 잠금을 자동으로 제거합니다. 활성 OpenClaw 프로세스가 여전히 소유한 오래된 잠금은 보고하지만 그대로 유지하여 Doctor가 활성 트랜스크립트 작성자를 중단하지 않도록 합니다.
  </Accordion>
  <Accordion title="3d. 세션 트랜스크립트 브랜치 복구">
    Doctor는 2026.4.24 프롬프트 트랜스크립트 재작성 버그로 생성된 중복 브랜치 형태가 있는지 에이전트 세션 JSONL 파일을 검사합니다. 이 형태는 OpenClaw 내부 런타임 컨텍스트가 포함된 폐기된 사용자 턴과 동일한 가시적 사용자 프롬프트가 포함된 활성 형제 항목으로 구성됩니다. `--fix` / `--repair` 모드에서 Doctor는 영향을 받은 각 파일을 원본 옆에 백업하고 트랜스크립트를 활성 브랜치로 다시 작성하여 Gateway 기록 및 메모리 리더가 더 이상 중복 턴을 보지 않도록 합니다.
  </Accordion>
  <Accordion title="4. 상태 무결성 검사(세션 지속성, 라우팅 및 안전)">
    상태 디렉터리는 운영의 중추입니다. 다른 곳에 백업이 없는 상태에서 이 디렉터리가 사라지면 세션, 자격 증명, 로그 및 구성을 잃게 됩니다.

    Doctor가 확인하는 항목:

    - **상태 디렉터리 없음**: 치명적인 상태 손실을 경고하고, 디렉터리를 다시 생성할지 묻고, 누락된 데이터는 복구할 수 없음을 알려 줍니다.
    - **상태 디렉터리 권한**: 쓰기 가능 여부를 확인하고, 권한 복구를 제안합니다(소유자/그룹 불일치가 감지되면 `chown` 힌트도 표시합니다).
    - **macOS 클라우드 동기화 상태 디렉터리**: 상태 경로가 iCloud Drive(`~/Library/Mobile Documents/com~apple~CloudDocs/...`) 또는 `~/Library/CloudStorage/...` 아래로 확인되면 경고합니다. 동기화 기반 경로에서는 I/O가 느려지고 잠금/동기화 경합이 발생할 수 있기 때문입니다.
    - **Linux SD 또는 eMMC 상태 디렉터리**: 상태 경로가 `mmcblk*` 마운트 소스로 확인되면 경고합니다. 세션 및 자격 증명을 기록할 때 SD/eMMC 기반 무작위 I/O가 더 느리고 더 빨리 마모될 수 있기 때문입니다.
    - **Linux 휘발성 상태 디렉터리**: 상태 경로가 `tmpfs` 또는 `ramfs`로 확인되면 경고합니다. 세션, 자격 증명, 구성 및 SQLite 상태(WAL/저널 사이드카 포함)가 재부팅 시 사라지기 때문입니다. Docker `overlay` 마운트의 쓰기 가능 계층은 컨테이너가 유지되는 동안 호스트 재부팅 후에도 지속되므로 의도적으로 경고하지 않습니다.
    - **세션 디렉터리 없음**: 기록을 영구 보존하고 `ENOENT` 충돌을 방지하려면 `sessions/`와 세션 저장소 디렉터리가 필요합니다.
    - **트랜스크립트 불일치**: 최근 세션 항목에 트랜스크립트 파일이 없으면 경고합니다.
    - **주 세션 "1줄 JSONL"**: 주 트랜스크립트가 한 줄뿐이면 표시합니다(기록이 누적되지 않는 상태입니다).
    - **여러 상태 디렉터리**: 여러 홈 디렉터리에 `~/.openclaw` 폴더가 있거나 `OPENCLAW_STATE_DIR`이 다른 위치를 가리키면 경고합니다(설치 간에 기록이 분산될 수 있습니다).
    - **원격 모드 알림**: `gateway.mode=remote`이면 doctor가 원격 호스트에서 실행해야 함을 알려 줍니다(상태가 그곳에 저장됩니다).
    - **구성 파일 권한**: `~/.openclaw/openclaw.json`을 그룹이나 모든 사용자가 읽을 수 있으면 경고하고, 권한을 `600`으로 강화하도록 제안합니다.

  </Accordion>
  <Accordion title="5. 모델 인증 상태(OAuth 만료)">
    Doctor는 인증 저장소의 OAuth 프로필을 검사하고, 토큰이 곧 만료되거나 이미 만료된 경우 경고하며, 안전한 경우 토큰을 갱신할 수 있습니다. Anthropic OAuth/토큰 프로필이 오래된 경우 Anthropic API 키 또는 Anthropic 설정 토큰 경로를 제안합니다. 갱신 프롬프트는 대화형(TTY)으로 실행할 때만 표시되며, `--non-interactive`에서는 갱신 시도를 건너뜁니다.

    OAuth 갱신이 영구적으로 실패하면(예: `refresh_token_reused`, `invalid_grant` 또는 공급자가 다시 로그인하라고 알리는 경우) doctor는 재인증이 필요하다고 보고하고 실행할 정확한 `openclaw models auth login --provider ...` 명령을 출력합니다.

    또한 doctor는 짧은 쿨다운(속도 제한/시간 초과/인증 실패)이나 장기 비활성화(결제/크레딧 실패)로 인해 일시적으로 사용할 수 없는 인증 프로필을 보고합니다.

    토큰이 macOS Keychain에 저장된 레거시 Codex OAuth 프로필(파일 기반 사이드카 레이아웃 이전의 구형 온보딩)은 doctor를 통해서만 복구됩니다. 대화형 터미널에서 `openclaw doctor --fix`를 한 번 실행하여 Keychain 기반 레거시 토큰을 `auth-profiles.json` 내부로 직접 마이그레이션하십시오. 이후 임베디드 턴(Telegram, cron, 하위 에이전트 디스패치)에서는 해당 토큰을 정식 OpenAI OAuth 프로필로 확인합니다.

  </Accordion>
  <Accordion title="6. Hooks 모델 검증">
    `hooks.gmail.model`이 설정되어 있으면 doctor가 카탈로그 및 허용 목록을 기준으로 모델 참조를 검증하고, 모델을 확인할 수 없거나 허용되지 않은 경우 경고합니다.
  </Accordion>
  <Accordion title="7. 샌드박스 이미지 복구">
    샌드박스가 활성화되어 있으면 doctor가 Docker 이미지를 확인하고, 현재 이미지가 없을 경우 이미지를 빌드하거나 레거시 이름으로 전환하도록 제안합니다.
  </Accordion>
  <Accordion title="7b. Plugin 설치 정리">
    Doctor는 `openclaw doctor --fix` / `openclaw doctor --repair` 모드에서 OpenClaw가 생성한 레거시 Plugin 종속성 스테이징 상태를 제거합니다. 여기에는 오래되어 남아 있는 생성된 종속성 루트, 이전 설치 단계 디렉터리, 과거 번들 Plugin 종속성 복구 코드가 남긴 패키지 로컬 잔여물, 현재 번들 매니페스트를 가릴 수 있는 번들 `@openclaw/*` Plugin의 고아 또는 복구된 관리형 npm 복사본이 포함됩니다. 또한 doctor는 `peerDependencies.openclaw`를 선언하는 관리형 npm Plugin에 호스트 `openclaw` 패키지를 다시 연결하여 업데이트 또는 npm 복구 후에도 `openclaw/plugin-sdk/*` 같은 패키지 로컬 런타임 가져오기가 계속 확인되도록 합니다.

    구성에서 다운로드 가능한 Plugin을 참조하지만 로컬 Plugin 레지스트리가 찾을 수 없는 경우에도 doctor가 누락된 Plugin을 다시 설치할 수 있습니다(실질적인 `plugins.entries`, 구성된 채널/공급자/검색 설정, 구성된 에이전트 런타임). 패키지 업데이트 중에는 핵심 패키지를 교체하는 동안 doctor가 Plugin 패키지를 다시 설치하지 않습니다. 구성된 Plugin을 계속 복구해야 한다면 업데이트 후 `openclaw doctor --fix`를 다시 실행하십시오. 아래의 컨테이너 이미지 시작 예외를 제외하면 Gateway 시작과 구성 다시 로드는 패키지 복구를 실행하지 않습니다. Plugin 설치는 명시적인 doctor/install/update 작업으로 유지됩니다.

    컨테이너화된 Gateway 시작에는 제한적인 업그레이드 예외가 있습니다. 새 OpenClaw 버전에서 `openclaw gateway run`을 시작하면 준비 완료 전에 안전한 상태 마이그레이션과 기존 핵심 패키지 이후 Plugin 수렴을 실행한 다음, 버전별 체크포인트를 기록합니다. 이 시작 절차에서는 오래된 번들 Plugin 레코드를 정리하고, 로컬 Plugin 링크를 복구하고, 수렴 경로에 필요한 경우 구성된 Plugin 패키지를 다시 설치하고, 활성 Plugin 페이로드를 확인할 수 있습니다. 시작 시 안전하게 복구할 수 없다면 컨테이너를 정상적으로 다시 시작하기 전에 동일하게 마운트된 상태/구성을 대상으로 같은 이미지를 `openclaw doctor --fix`와 함께 한 번 실행하십시오.

  </Accordion>
  <Accordion title="8. Gateway 서비스 마이그레이션 및 정리 힌트">
    Doctor는 레거시 Gateway 서비스(launchd/systemd/schtasks)를 감지하고, 해당 서비스를 제거한 후 현재 Gateway 포트를 사용하여 OpenClaw 서비스를 설치하도록 제안합니다. 추가 Gateway 유사 서비스를 검사하고 정리 힌트를 출력할 수도 있습니다. 프로필 이름이 지정된 OpenClaw Gateway 서비스는 일급 서비스로 간주되며 "추가" 서비스로 표시되지 않습니다.

    Linux에서 사용자 수준 Gateway 서비스가 없지만 시스템 수준 OpenClaw Gateway 서비스가 존재하는 경우 doctor는 두 번째 사용자 수준 서비스를 자동으로 설치하지 않습니다. `openclaw gateway status --deep` 또는 `openclaw doctor --deep`으로 검사한 다음, 중복 서비스를 제거하거나 시스템 감독자가 Gateway 수명 주기를 소유하는 경우 `OPENCLAW_SERVICE_REPAIR_POLICY=external`을 설정하십시오.

  </Accordion>
  <Accordion title="8b. 시작 시 Matrix 마이그레이션">
    Matrix 채널 계정에 대기 중이거나 실행 가능한 레거시 상태 마이그레이션이 있으면 doctor는 (`--fix` / `--repair` 모드에서) 마이그레이션 전 스냅샷을 생성한 다음 최선형 마이그레이션 단계인 레거시 Matrix 상태 마이그레이션과 레거시 암호화 상태 준비를 실행합니다. 두 단계 모두 치명적이지 않으며, 오류는 기록되고 시작은 계속됩니다. 읽기 전용 모드(`--fix` 없이 `openclaw doctor`)에서는 이 검사를 완전히 건너뜁니다.
  </Accordion>
  <Accordion title="8c. 기기 페어링 및 인증 드리프트">
    Doctor는 일반 상태 검사 과정에서 기기 페어링 상태를 검사하고 다음을 보고합니다.

    - 대기 중인 최초 페어링 요청
    - 이미 페어링된 기기의 대기 중인 역할 또는 범위 업그레이드
    - 기기 ID는 여전히 일치하지만 기기 ID 정보가 승인된 레코드와 더 이상 일치하지 않는 경우의 공개 키 불일치 복구
    - 승인된 역할의 활성 토큰이 누락된 페어링 레코드
    - 범위가 승인된 페어링 기준선에서 벗어난 페어링 토큰
    - Gateway 측 토큰 순환보다 오래되었거나 오래된 범위 메타데이터가 포함된 현재 머신의 로컬 캐시 기기 토큰 항목

    Doctor는 페어링 요청을 자동 승인하거나 기기 토큰을 자동 순환하지 않습니다. 정확한 다음 단계를 출력합니다.

    - `openclaw devices list`로 대기 중인 요청 검사
    - `openclaw devices approve <requestId>`로 정확한 요청 승인
    - `openclaw devices rotate --device <deviceId> --role <role>`로 새 토큰 순환
    - `openclaw devices remove <deviceId>`로 오래된 레코드를 제거한 후 다시 승인

    이를 통해 최초 페어링, 대기 중인 역할/범위 업그레이드, 오래된 토큰/기기 ID 정보 드리프트를 구분하여 흔히 발생하는 "이미 페어링했지만 여전히 페어링이 필요하다는 메시지가 표시되는" 문제를 해결합니다.

  </Accordion>
  <Accordion title="9. 보안 경고">
    공급자가 허용 목록 없이 DM에 개방되어 있거나 정책이 위험한 방식으로 구성된 경우 doctor가 경고합니다.
  </Accordion>
  <Accordion title="10. systemd linger(Linux)">
    systemd 사용자 서비스로 실행 중이면 doctor가 linger가 활성화되어 있는지 확인하여 로그아웃 후에도 Gateway가 계속 실행되도록 합니다.
  </Accordion>
  <Accordion title="11. 작업 공간 상태(Skills, Plugin 및 TaskFlow)">
    Doctor는 기본 에이전트의 작업 공간 상태 요약을 출력합니다.

    - **Skills 상태**: 사용 가능한 Skills, 요구 사항이 누락된 Skills, 허용 목록으로 차단된 Skills의 수를 계산합니다.
    - **Plugin 상태**: 활성화/비활성화/오류 발생 Plugin 수를 계산하고, 오류가 있는 Plugin의 ID를 나열하며, 번들 Plugin 기능을 보고합니다.
    - **Plugin 호환성 경고**: 현재 런타임과 호환성 문제가 있는 Plugin을 표시합니다.
    - **Plugin 진단**: Plugin 레지스트리가 로드 시 표시한 모든 경고 또는 오류를 노출합니다.
    - **TaskFlow 복구**: 수동 검사 또는 취소가 필요한 의심스러운 관리형 TaskFlow를 표시합니다.

  </Accordion>
  <Accordion title="11b. 부트스트랩 파일 크기">
    Doctor는 작업 공간 부트스트랩 파일(예: `AGENTS.md`, `CLAUDE.md` 또는 기타 삽입된 컨텍스트 파일)이 구성된 문자 예산에 근접했거나 초과했는지 확인합니다. 파일별 원본 문자 수와 삽입된 문자 수, 잘림 비율, 잘림 원인(`max/file` 또는 `max/total`), 총예산 대비 총 삽입 문자 수를 보고합니다. 파일이 잘렸거나 제한에 근접하면 doctor가 `agents.defaults.bootstrapMaxChars` 및 `agents.defaults.bootstrapTotalMaxChars` 조정 팁을 출력합니다.
  </Accordion>
  <Accordion title="11c. 셸 자동 완성">
    Doctor는 현재 셸(zsh, bash, fish 또는 PowerShell)에 탭 자동 완성이 설치되어 있는지 확인합니다.

    - 셸 프로필이 느린 동적 자동 완성 패턴(`source <(openclaw completion ...)`)을 사용하면 doctor가 더 빠른 캐시 파일 방식으로 업그레이드합니다.
    - 프로필에 자동 완성이 구성되어 있지만 캐시 파일이 없으면 doctor가 캐시를 자동으로 다시 생성합니다.
    - 자동 완성이 전혀 구성되어 있지 않으면 doctor가 설치 여부를 묻습니다(대화형 모드에서만 실행되며 `--non-interactive`에서는 건너뜁니다).

    캐시를 수동으로 다시 생성하려면 `openclaw completion --write-state`를 실행하십시오.

  </Accordion>
  <Accordion title="11d. 오래된 채널 Plugin 정리">
    `openclaw doctor --fix`가 누락된 채널 Plugin을 제거하면 해당 Plugin을 참조하던 연결이 끊긴 채널 범위 구성도 제거합니다. 여기에는 `channels.<id>` 항목, 해당 채널을 지정한 Heartbeat 대상, `agents.*.models["<channel>/*"]` 재정의가 포함됩니다. 이렇게 하면 채널 런타임은 사라졌지만 구성에서 여전히 Gateway가 해당 런타임에 바인딩하도록 요청하여 발생하는 Gateway 부팅 루프를 방지합니다.
  </Accordion>
  <Accordion title="12. Gateway 인증 검사(로컬 토큰)">
    Doctor는 로컬 Gateway 토큰 인증 준비 상태를 확인합니다.

    - 토큰 모드에 토큰이 필요하지만 토큰 소스가 없으면 doctor가 토큰 생성을 제안합니다.
    - `gateway.auth.token`이 SecretRef로 관리되지만 사용할 수 없는 경우 doctor가 경고하며 일반 텍스트로 덮어쓰지 않습니다.
    - `openclaw doctor --generate-gateway-token`은 토큰 SecretRef가 구성되지 않은 경우에만 강제로 생성합니다.

  </Accordion>
  <Accordion title="12b. SecretRef를 인식하는 읽기 전용 복구">
    일부 복구 흐름에서는 런타임의 빠른 실패 동작을 약화하지 않으면서 구성된 자격 증명을 검사해야 합니다.

    - `openclaw doctor --fix`는 대상별 구성 복구에 상태 계열 명령과 동일한 읽기 전용 SecretRef 요약 모델을 사용합니다.
    - 예: Telegram `allowFrom` / `groupAllowFrom` `@username` 복구는 가능한 경우 구성된 봇 자격 증명을 사용하려고 시도합니다.
    - Telegram 봇 토큰이 SecretRef를 통해 구성되어 있지만 현재 명령 경로에서 사용할 수 없는 경우, doctor는 충돌하거나 토큰이 누락되었다고 잘못 보고하지 않고 자격 증명이 구성되었지만 사용할 수 없다고 보고한 후 자동 확인을 건너뜁니다.

  </Accordion>
  <Accordion title="13. Gateway 상태 확인 + 재시작">
    Doctor는 상태 확인을 실행하고 Gateway가 비정상으로 보이면 재시작을 제안합니다.
  </Accordion>
  <Accordion title="13b. 메모리 검색 준비 상태">
    Doctor는 구성된 메모리 검색 임베딩 공급자가 기본 에이전트에서 준비되었는지 확인합니다. 동작은 구성된 백엔드와 공급자에 따라 달라집니다.

    - **QMD 백엔드**: `qmd` 바이너리를 사용할 수 있고 시작할 수 있는지 검사합니다. 그렇지 않으면 `npm install -g @tobilu/qmd`(또는 이에 해당하는 Bun 명령)와 수동 바이너리 경로 옵션을 포함한 해결 지침을 출력합니다.
    - **명시적 로컬 공급자**: 로컬 모델 파일 또는 인식 가능한 원격/다운로드 가능 모델 URL이 있는지 확인합니다. 없으면 원격 공급자로 전환할 것을 제안합니다.
    - **명시적 원격 공급자**(`openai`, `voyage` 등): 환경이나 인증 저장소에 API 키가 있는지 확인합니다. 없으면 실행 가능한 해결 힌트를 출력합니다.
    - **레거시 자동 공급자**: `memorySearch.provider: "auto"`를 OpenAI로 취급하고 OpenAI 준비 상태를 확인하며, `doctor --fix`는 이를 `provider: "openai"`로 다시 작성합니다.

    캐시된 Gateway 검사 결과를 사용할 수 있는 경우(확인 당시 Gateway가 정상 상태였던 경우), doctor는 해당 결과를 CLI에 표시되는 구성과 교차 확인하고 불일치 사항을 알립니다. Doctor는 기본 경로에서 새로운 임베딩 핑을 시작하지 않습니다. 실시간 공급자 확인이 필요하면 심층 메모리 상태 명령을 사용하십시오.

    런타임에서 임베딩 준비 상태를 확인하려면 `openclaw memory status --deep`을 사용하십시오.

  </Accordion>
  <Accordion title="14. 채널 상태 경고">
    Gateway가 정상 상태이면 doctor는 채널 상태 검사를 실행하고 권장 해결 방법과 함께 경고를 보고합니다.
  </Accordion>
  <Accordion title="15. 감독자 구성 감사 + 복구">
    Doctor는 설치된 감독자 구성(launchd/systemd/schtasks)에 누락되거나 오래된 기본값(예: systemd network-online 종속성과 재시작 지연)이 있는지 확인합니다. 불일치가 발견되면 업데이트를 권장하고 서비스 파일/작업을 현재 기본값으로 다시 작성할 수 있습니다.

    참고:

    - `openclaw doctor`는 감독자 구성을 다시 작성하기 전에 확인을 요청합니다.
    - `openclaw doctor --yes`는 기본 복구 확인에 동의합니다.
    - `openclaw doctor --fix`는 확인 없이 권장 해결 방법을 적용합니다(`--repair`는 별칭입니다).
    - `openclaw doctor --fix --force`는 사용자 지정 감독자 구성을 덮어씁니다.
    - `OPENCLAW_SERVICE_REPAIR_POLICY=external`은 Gateway 서비스 수명 주기에 대해 doctor를 읽기 전용으로 유지합니다. 서비스 상태를 계속 보고하고 서비스 외 복구를 실행하지만, 외부 감독자가 해당 수명 주기를 소유하므로 서비스 설치/시작/재시작/부트스트랩, 감독자 구성 재작성 및 레거시 서비스 정리를 건너뜁니다.
    - Linux에서 doctor는 일치하는 systemd Gateway 유닛이 활성 상태인 동안 명령/진입점 메타데이터를 다시 작성하지 않습니다. 또한 중복 서비스 검사 중 비활성 상태인 비레거시 추가 Gateway 유사 유닛을 무시하므로 보조 서비스 파일이 정리 관련 불필요한 메시지를 생성하지 않습니다.
    - 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, doctor 서비스 설치/복구는 SecretRef를 검증하지만 확인된 평문 토큰 값을 감독자 서비스 환경 메타데이터에 저장하지 않습니다.
    - Doctor는 이전 LaunchAgent, systemd 또는 Windows Scheduled Task 설치에서 인라인으로 포함한 관리형 `.env`/SecretRef 기반 서비스 환경 값을 감지하고, 해당 값이 감독자 정의 대신 런타임 소스에서 로드되도록 서비스 메타데이터를 다시 작성합니다.
    - Doctor는 `gateway.port`가 변경된 후에도 서비스 명령이 이전 `--port`를 계속 고정하는 경우를 감지하고 서비스 메타데이터를 현재 포트로 다시 작성합니다.
    - 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef를 확인할 수 없는 경우, doctor는 실행 가능한 지침과 함께 설치/복구 경로를 차단합니다.
    - `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, doctor는 모드가 명시적으로 설정될 때까지 설치/복구를 차단합니다.
    - Linux 사용자 systemd 유닛의 경우, doctor의 토큰 불일치 확인은 서비스 인증 메타데이터를 비교할 때 `Environment=` 및 `EnvironmentFile=` 소스를 모두 포함합니다.
    - Doctor 서비스 복구는 구성이 더 최신 버전에서 마지막으로 작성된 경우, 이전 OpenClaw 바이너리를 사용하여 Gateway 서비스를 다시 작성하거나 중지하거나 재시작하는 것을 거부합니다. [Gateway 문제 해결](/ko/gateway/troubleshooting#split-brain-installs-and-newer-config-guard)을 참조하십시오.
    - `openclaw gateway install --force`를 사용하면 언제든지 전체 재작성을 강제할 수 있습니다.

  </Accordion>
  <Accordion title="16. Gateway 런타임 + 포트 진단">
    Doctor는 서비스 런타임(PID, 마지막 종료 상태)을 검사하고 서비스가 설치되어 있지만 실제로 실행 중이 아닐 때 경고합니다. 또한 Gateway 포트(기본값 `18789`)의 포트 충돌을 확인하고 가능한 원인(Gateway가 이미 실행 중, SSH 터널)을 보고합니다.
  </Accordion>
  <Accordion title="17. Gateway 런타임 모범 사례">
    Doctor는 Gateway 서비스가 Bun 또는 버전 관리되는 Node 경로(`nvm`, `fnm`, `volta`, `asdf` 등)에서 실행될 때 경고합니다. WhatsApp 및 Telegram 채널에는 Node가 필요하며, 서비스가 셸 초기화 구성을 로드하지 않으므로 업그레이드 후 버전 관리자 경로가 작동하지 않을 수 있습니다. Doctor는 시스템 Node 설치를 사용할 수 있는 경우(Homebrew/apt/choco) 해당 설치로 마이그레이션할 것을 제안합니다.

    새로 설치되거나 복구된 macOS LaunchAgent는 대화형 셸 PATH를 복사하는 대신 표준 시스템 PATH(`/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`)를 사용합니다. 따라서 Homebrew로 관리되는 시스템 바이너리는 계속 사용할 수 있으며 Volta, asdf, fnm, pnpm 및 기타 버전 관리자 디렉터리는 Node 자식 프로세스가 확인하는 바이너리를 변경하지 않습니다. Linux 서비스는 명시적 환경 루트(`NVM_DIR`, `FNM_DIR`, `VOLTA_HOME`, `ASDF_DATA_DIR`, `BUN_INSTALL`, `PNPM_HOME`)와 안정적인 사용자 바이너리 디렉터리를 계속 유지하지만, 추정된 버전 관리자 대체 디렉터리는 해당 디렉터리가 디스크에 실제로 존재하는 경우에만 서비스 PATH에 기록됩니다.

  </Accordion>
  <Accordion title="18. 구성 기록 + 마법사 메타데이터">
    Doctor는 모든 구성 변경 사항을 저장하고 doctor 실행을 기록하도록 마법사 메타데이터를 추가합니다.
  </Accordion>
  <Accordion title="19. 작업 공간 팁(백업 + 메모리 시스템)">
    Doctor는 작업 공간 메모리 시스템이 없으면 이를 제안하고, 작업 공간이 아직 git으로 관리되지 않는 경우 백업 팁을 출력합니다.

    작업 공간 구조와 git 백업(비공개 GitHub 또는 GitLab 권장)에 대한 전체 가이드는 [/concepts/agent-workspace](/ko/concepts/agent-workspace)를 참조하십시오.

  </Accordion>
</AccordionGroup>

## 관련 문서

- [Gateway 운영 가이드](/ko/gateway)
- [Gateway 문제 해결](/ko/gateway/troubleshooting)
