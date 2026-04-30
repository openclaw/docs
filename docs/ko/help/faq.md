---
read_when:
    - 일반적인 설정, 설치, 온보딩 또는 런타임 지원 질문에 답변하기
    - 심층 디버깅 전에 사용자가 보고한 문제 분류
summary: OpenClaw 설치, 구성 및 사용에 관한 자주 묻는 질문
title: 자주 묻는 질문
x-i18n:
    generated_at: "2026-04-30T06:35:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c09be6571e048b71e4e02288b22b51e70102872675dfc7bef133b955a06f6ac9
    source_path: help/faq.md
    workflow: 16
---

빠른 답변과 실제 환경 설정(로컬 개발, VPS, 다중 에이전트, OAuth/API 키, 모델 페일오버)을 위한 심층 문제 해결입니다. 런타임 진단은 [문제 해결](/ko/gateway/troubleshooting)을 참조하세요. 전체 구성 레퍼런스는 [구성](/ko/gateway/configuration)을 참조하세요.

## 문제가 발생했을 때 첫 60초

1. **빠른 상태 확인(첫 번째 확인)**

   ```bash
   openclaw status
   ```

   빠른 로컬 요약: OS + 업데이트, Gateway/서비스 도달 가능성, 에이전트/세션, 제공자 구성 + 런타임 문제(Gateway에 도달할 수 있는 경우).

2. **붙여넣을 수 있는 보고서(공유해도 안전)**

   ```bash
   openclaw status --all
   ```

   로그 꼬리 포함 읽기 전용 진단(토큰은 수정됨).

3. **데몬 + 포트 상태**

   ```bash
   openclaw gateway status
   ```

   감독자 런타임과 RPC 도달 가능성, 프로브 대상 URL, 서비스가 사용했을 가능성이 높은 구성을 표시합니다.

4. **심층 프로브**

   ```bash
   openclaw status --deep
   ```

   지원되는 경우 채널 프로브를 포함해 실시간 Gateway 상태 프로브를 실행합니다
   (도달 가능한 Gateway 필요). [상태](/ko/gateway/health)를 참조하세요.

5. **최신 로그 추적**

   ```bash
   openclaw logs --follow
   ```

   RPC가 다운된 경우 다음으로 대체하세요.

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   파일 로그는 서비스 로그와 별개입니다. [로깅](/ko/logging) 및 [문제 해결](/ko/gateway/troubleshooting)을 참조하세요.

6. **Doctor 실행(복구)**

   ```bash
   openclaw doctor
   ```

   구성/상태를 복구/마이그레이션하고 상태 검사를 실행합니다. [Doctor](/ko/gateway/doctor)를 참조하세요.

7. **Gateway 스냅샷**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 오류 발생 시 대상 URL + 구성 경로를 표시
   ```

   실행 중인 Gateway에 전체 스냅샷을 요청합니다(WS 전용). [상태](/ko/gateway/health)를 참조하세요.

## 빠른 시작과 최초 실행 설정

최초 실행 Q&A(설치, 온보딩, 인증 경로, 구독, 초기 실패)는
[최초 실행 FAQ](/ko/help/faq-first-run)에 있습니다.

## OpenClaw란 무엇인가요?

<AccordionGroup>
  <Accordion title="OpenClaw란 무엇인가요? 한 문단으로 설명해 주세요.">
    OpenClaw는 자신의 기기에서 실행하는 개인 AI 어시스턴트입니다. 이미 사용하는 메시징 표면(WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, 그리고 QQ Bot 같은 번들 채널 Plugin)에서 응답하며, 지원되는 플랫폼에서는 음성 + 실시간 Canvas도 사용할 수 있습니다. **Gateway**는 항상 켜져 있는 제어 플레인이고, 어시스턴트가 제품입니다.
  </Accordion>

  <Accordion title="가치 제안">
    OpenClaw는 "단순한 Claude 래퍼"가 아닙니다. OpenClaw는 **로컬 우선 제어 플레인**으로, 이미 사용하는 채팅 앱에서 접근 가능한
    유능한 어시스턴트를 **자신의 하드웨어**에서 실행할 수 있게 해주며,
    상태 저장 세션, 메모리, 도구를 제공합니다. 워크플로의 제어권을 호스팅
    SaaS에 넘기지 않아도 됩니다.

    주요 특징:

    - **내 기기, 내 데이터:** 원하는 곳(Mac, Linux, VPS)에서 Gateway를 실행하고
      워크스페이스 + 세션 기록을 로컬에 유지합니다.
    - **웹 샌드박스가 아닌 실제 채널:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 등과
      지원되는 플랫폼의 모바일 음성 및 Canvas.
    - **모델 독립적:** 에이전트별 라우팅과 페일오버로 Anthropic, OpenAI, MiniMax, OpenRouter 등을 사용합니다.
    - **로컬 전용 옵션:** 원한다면 로컬 모델을 실행해 **모든 데이터를 기기에만 유지**할 수 있습니다.
    - **다중 에이전트 라우팅:** 채널, 계정, 작업별로 별도 에이전트를 사용하고, 각 에이전트는 자체
      워크스페이스와 기본값을 가집니다.
    - **오픈 소스이며 해킹 가능:** 벤더 종속 없이 검토, 확장, 자체 호스팅할 수 있습니다.

    문서: [Gateway](/ko/gateway), [채널](/ko/channels), [다중 에이전트](/ko/concepts/multi-agent),
    [메모리](/ko/concepts/memory).

  </Accordion>

  <Accordion title="방금 설정했습니다. 먼저 무엇을 해야 하나요?">
    좋은 첫 프로젝트:

    - 웹사이트를 만드세요(WordPress, Shopify 또는 간단한 정적 사이트).
    - 모바일 앱을 프로토타입으로 만드세요(개요, 화면, API 계획).
    - 파일과 폴더를 정리하세요(정리, 이름 지정, 태그 지정).
    - Gmail을 연결하고 요약이나 후속 조치를 자동화하세요.

    큰 작업도 처리할 수 있지만, 작업을 단계로 나누고
    병렬 작업에는 하위 에이전트를 사용할 때 가장 잘 작동합니다.

  </Accordion>

  <Accordion title="OpenClaw의 일상적인 상위 다섯 가지 사용 사례는 무엇인가요?">
    일상에서 얻는 이점은 보통 다음과 같습니다.

    - **개인 브리핑:** 관심 있는 받은편지함, 캘린더, 뉴스 요약.
    - **조사와 초안 작성:** 빠른 조사, 요약, 이메일이나 문서의 초안.
    - **알림과 후속 조치:** Cron 또는 Heartbeat 기반 알림과 체크리스트.
    - **브라우저 자동화:** 양식 작성, 데이터 수집, 웹 작업 반복.
    - **기기 간 조율:** 휴대폰에서 작업을 보내고, Gateway가 서버에서 실행하게 한 다음, 결과를 채팅으로 받습니다.

  </Accordion>

  <Accordion title="OpenClaw가 SaaS를 위한 리드 생성, 아웃리치, 광고, 블로그에 도움을 줄 수 있나요?">
    **조사, 선별, 초안 작성**에는 가능합니다. 사이트를 스캔하고, 후보 목록을 만들고,
    잠재 고객을 요약하며, 아웃리치나 광고 문안 초안을 작성할 수 있습니다.

    **아웃리치 또는 광고 실행**의 경우 사람이 개입하도록 하세요. 스팸을 피하고, 현지 법률과
    플랫폼 정책을 준수하며, 전송 전에 모든 내용을 검토하세요. 가장 안전한 패턴은
    OpenClaw가 초안을 작성하고 사용자가 승인하는 것입니다.

    문서: [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="웹 개발에서 Claude Code 대비 장점은 무엇인가요?">
    OpenClaw는 IDE 대체제가 아니라 **개인 비서**이자 조정 계층입니다. 저장소 안에서 가장 빠른 직접 코딩 루프를 원한다면
    Claude Code 또는 Codex를 사용하세요. 지속적인 메모리, 여러 기기에서의 접근, 도구 오케스트레이션이
    필요할 때 OpenClaw를 사용하세요.

    장점:

    - 세션 간 **영구 메모리 + 워크스페이스**
    - **다중 플랫폼 접근**(WhatsApp, Telegram, TUI, WebChat)
    - **도구 오케스트레이션**(브라우저, 파일, 일정 예약, 훅)
    - **상시 실행 Gateway**(VPS에서 실행하고 어디서나 상호작용)
    - local 브라우저/화면/카메라/실행용 **Node**

    쇼케이스: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 및 자동화

<AccordionGroup>
  <Accordion title="저장소를 더럽히지 않고 Skills를 사용자 지정하려면 어떻게 하나요?">
    저장소 사본을 편집하는 대신 관리형 오버라이드를 사용하세요. 변경 사항을 `~/.openclaw/skills/<name>/SKILL.md`에 넣거나 `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 폴더를 추가하세요. 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 → `skills.load.extraDirs`이므로, 관리형 오버라이드는 git을 건드리지 않고도 번들 Skills보다 우선합니다. Skill을 전역으로 설치해야 하지만 일부 에이전트에만 보이게 하려면 공유 사본을 `~/.openclaw/skills`에 두고 `agents.defaults.skills`와 `agents.list[].skills`로 표시 여부를 제어하세요. 업스트림에 반영할 만한 편집만 저장소에 두고 PR로 제출해야 합니다.
  </Accordion>

  <Accordion title="사용자 지정 폴더에서 Skills를 로드할 수 있나요?">
    예. `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 추가 디렉터리를 추가하세요(가장 낮은 우선순위). 기본 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 → `skills.load.extraDirs`입니다. `clawhub`는 기본적으로 `./skills`에 설치하며, OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 취급합니다. Skill이 특정 에이전트에만 보여야 한다면 `agents.defaults.skills` 또는 `agents.list[].skills`와 함께 사용하세요.
  </Accordion>

  <Accordion title="작업마다 다른 모델을 사용하려면 어떻게 하나요?">
    현재 지원되는 패턴은 다음과 같습니다.

    - **Cron 작업**: 격리된 작업은 작업별로 `model` 오버라이드를 설정할 수 있습니다.
    - **하위 에이전트**: 기본 모델이 다른 별도 에이전트로 작업을 라우팅합니다.
    - **필요할 때 전환**: 언제든지 `/model`을 사용해 현재 세션 모델을 전환합니다.

    [Cron 작업](/ko/automation/cron-jobs), [다중 에이전트 라우팅](/ko/concepts/multi-agent), [슬래시 명령](/ko/tools/slash-commands)을 참고하세요.

  </Accordion>

  <Accordion title="무거운 작업을 하는 동안 봇이 멈춥니다. 이를 어떻게 오프로드하나요?">
    오래 걸리거나 병렬로 실행되는 작업에는 **하위 에이전트**를 사용하세요. 하위 에이전트는 자체 세션에서 실행되고,
    요약을 반환하며, 기본 채팅을 계속 응답 가능한 상태로 유지합니다.

    봇에게 "spawn a sub-agent for this task"라고 요청하거나 `/subagents`를 사용하세요.
    채팅에서 `/status`를 사용해 현재 Gateway가 무엇을 하고 있는지(그리고 바쁜지)를 확인하세요.

    토큰 팁: 긴 작업과 하위 에이전트는 모두 토큰을 사용합니다. 비용이 걱정된다면
    `agents.defaults.subagents.model`을 통해 하위 에이전트에 더 저렴한 모델을 설정하세요.

    문서: [하위 에이전트](/ko/tools/subagents), [백그라운드 작업](/ko/automation/tasks).

  </Accordion>

  <Accordion title="Discord에서 스레드에 바인딩된 하위 에이전트 세션은 어떻게 작동하나요?">
    스레드 바인딩을 사용하세요. Discord 스레드를 하위 에이전트 또는 세션 대상으로 바인딩하면 해당 스레드의 후속 메시지가 바인딩된 세션에 유지됩니다.

    기본 흐름:

    - `sessions_spawn`에서 `thread: true`를 사용해 생성합니다(지속적인 후속 처리를 위해 선택적으로 `mode: "session"` 사용).
    - 또는 `/focus <target>`로 수동 바인딩합니다.
    - `/agents`를 사용해 바인딩 상태를 확인합니다.
    - `/session idle <duration|off>` 및 `/session max-age <duration|off>`를 사용해 자동 포커스 해제를 제어합니다.
    - `/unfocus`를 사용해 스레드를 분리합니다.

    필수 설정:

    - 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord 오버라이드: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - 생성 시 자동 바인딩: `channels.discord.threadBindings.spawnSubagentSessions: true`로 설정합니다.

    문서: [하위 에이전트](/ko/tools/subagents), [Discord](/ko/channels/discord), [설정 참조](/ko/gateway/configuration-reference), [슬래시 명령](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="하위 에이전트가 완료되었지만 완료 업데이트가 잘못된 곳으로 갔거나 게시되지 않았습니다. 무엇을 확인해야 하나요?">
    먼저 확인된 요청자 라우트를 확인하세요.

    - 완료 모드 하위 에이전트 전달은 바인딩된 스레드나 대화 라우트가 있으면 이를 우선합니다.
    - 완료 원본에 채널만 포함된 경우, OpenClaw는 직접 전달이 여전히 성공할 수 있도록 요청자 세션에 저장된 라우트(`lastChannel` / `lastTo` / `lastAccountId`)로 대체합니다.
    - 바인딩된 라우트도 사용 가능한 저장 라우트도 없으면 직접 전달이 실패할 수 있으며, 결과는 채팅에 즉시 게시되는 대신 대기열에 있는 세션 전달로 대체됩니다.
    - 유효하지 않거나 오래된 대상도 여전히 대기열 대체 또는 최종 전달 실패를 강제할 수 있습니다.
    - 자식의 마지막으로 보이는 어시스턴트 응답이 정확히 무음 토큰 `NO_REPLY` / `no_reply`이거나 정확히 `ANNOUNCE_SKIP`인 경우, OpenClaw는 오래된 이전 진행 상황을 게시하는 대신 의도적으로 알림을 억제합니다.
    - 자식이 도구 호출만 수행한 뒤 시간 초과된 경우, 알림은 원시 도구 출력을 재생하는 대신 이를 짧은 부분 진행 요약으로 축약할 수 있습니다.

    디버그:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [하위 에이전트](/ko/tools/subagents), [백그라운드 작업](/ko/automation/tasks), [세션 도구](/ko/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron 또는 리마인더가 실행되지 않습니다. 무엇을 확인해야 하나요?">
    Cron은 Gateway 프로세스 안에서 실행됩니다. Gateway가 계속 실행되고 있지 않으면
    예약된 작업은 실행되지 않습니다.

    체크리스트:

    - cron이 활성화되어 있는지(`cron.enabled`) 및 `OPENCLAW_SKIP_CRON`이 설정되어 있지 않은지 확인합니다.
    - Gateway가 24시간 내내 실행 중인지 확인합니다(절전/재시작 없음).
    - 작업의 시간대 설정을 확인합니다(`--tz`와 호스트 시간대 비교).

    디버그:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    문서: [Cron 작업](/ko/automation/cron-jobs), [자동화 및 작업](/ko/automation).

  </Accordion>

  <Accordion title="Cron이 실행되었지만 채널로 아무것도 전송되지 않았습니다. 왜 그런가요?">
    먼저 전달 모드를 확인하세요.

    - `--no-deliver` / `delivery.mode: "none"`은 러너 폴백 전송이 예상되지 않음을 의미합니다.
    - 알림 대상(`channel` / `to`)이 없거나 유효하지 않으면 러너가 아웃바운드 전달을 건너뜁니다.
    - 채널 인증 실패(`unauthorized`, `Forbidden`)는 러너가 전달을 시도했지만 자격 증명이 차단했음을 의미합니다.
    - 조용한 격리 결과(`NO_REPLY` / `no_reply`만)는 의도적으로 전달할 수 없는 것으로 처리되므로 러너도 대기 중인 폴백 전달을 억제합니다.

    격리된 Cron 작업의 경우 채팅 경로를 사용할 수 있으면 에이전트가 여전히 `message`
    도구로 직접 전송할 수 있습니다. `--announce`는 에이전트가 아직 전송하지 않은
    최종 텍스트에 대한 러너 폴백 경로만 제어합니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron 작업](/ko/automation/cron-jobs), [백그라운드 작업](/ko/automation/tasks).

  </Accordion>

  <Accordion title="격리된 Cron 실행이 모델을 전환하거나 한 번 재시도한 이유는 무엇인가요?">
    이는 일반적으로 중복 예약이 아니라 라이브 모델 전환 경로입니다.

    격리된 Cron은 활성 실행에서 `LiveSessionModelSwitchError`가 발생할 때
    런타임 모델 인계를 유지하고 재시도할 수 있습니다. 재시도는 전환된
    공급자/모델을 유지하며, 전환에 새 인증 프로필 오버라이드가 포함된 경우
    Cron은 재시도하기 전에 그것도 유지합니다.

    관련 선택 규칙:

    - 적용 가능한 경우 Gmail 훅 모델 오버라이드가 가장 먼저 우선합니다.
    - 그다음 작업별 `model`.
    - 그다음 저장된 Cron 세션 모델 오버라이드.
    - 그다음 일반 에이전트/기본 모델 선택.

    재시도 루프는 제한되어 있습니다. 초기 시도와 2회의 전환 재시도 후에는
    Cron이 무한 루프 대신 중단합니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron 작업](/ko/automation/cron-jobs), [Cron CLI](/ko/cli/cron).

  </Accordion>

  <Accordion title="Linux에서 Skills를 어떻게 설치하나요?">
    네이티브 `openclaw skills` 명령을 사용하거나 워크스페이스에 Skills를 넣으세요. macOS Skills UI는 Linux에서 사용할 수 없습니다.
    Skills는 [https://clawhub.ai](https://clawhub.ai)에서 둘러볼 수 있습니다.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install <skill-slug>
    openclaw skills install <skill-slug> --version <version>
    openclaw skills install <skill-slug> --force
    openclaw skills update --all
    openclaw skills list --eligible
    openclaw skills check
    ```

    네이티브 `openclaw skills install`은 활성 워크스페이스 `skills/`
    디렉터리에 기록합니다. 자체 Skills를 게시하거나 동기화하려는 경우에만 별도의
    `clawhub` CLI를 설치하세요. 에이전트 간 공유 설치의 경우 Skill을
    `~/.openclaw/skills` 아래에 두고, 어떤 에이전트가 볼 수 있는지 좁히려면
    `agents.defaults.skills` 또는 `agents.list[].skills`를 사용하세요.

  </Accordion>

  <Accordion title="OpenClaw가 일정에 따라 또는 백그라운드에서 지속적으로 작업을 실행할 수 있나요?">
    예. Gateway 스케줄러를 사용하세요.

    - 예약되거나 반복되는 작업에는 **Cron 작업**을 사용합니다(재시작 후에도 유지).
    - "기본 세션" 주기적 검사에는 **Heartbeat**를 사용합니다.
    - 요약을 게시하거나 채팅으로 전달하는 자율 에이전트에는 **격리 작업**을 사용합니다.

    문서: [Cron 작업](/ko/automation/cron-jobs), [자동화 및 작업](/ko/automation),
    [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux에서 Apple macOS 전용 Skills를 실행할 수 있나요?">
    직접적으로는 불가능합니다. macOS Skills는 `metadata.openclaw.os`와 필요한 바이너리로 제한되며, Skills는 **Gateway 호스트**에서 자격이 있을 때만 시스템 프롬프트에 나타납니다. Linux에서는 게이팅을 오버라이드하지 않는 한 `darwin` 전용 Skills(예: `apple-notes`, `apple-reminders`, `things-mac`)가 로드되지 않습니다.

    지원되는 패턴은 세 가지입니다.

    **옵션 A - Mac에서 Gateway 실행(가장 간단).**
    macOS 바이너리가 있는 곳에서 Gateway를 실행한 다음, Linux에서 [원격 모드](#gateway-ports-already-running-and-remote-mode) 또는 Tailscale을 통해 연결하세요. Gateway 호스트가 macOS이므로 Skills가 정상적으로 로드됩니다.

    **옵션 B - macOS Node 사용(SSH 없음).**
    Linux에서 Gateway를 실행하고, macOS Node(메뉴바 앱)를 페어링한 다음, Mac에서 **Node 실행 명령**을 "Always Ask" 또는 "Always Allow"로 설정하세요. 필요한 바이너리가 Node에 있으면 OpenClaw는 macOS 전용 Skills를 자격 있음으로 처리할 수 있습니다. 에이전트는 `nodes` 도구를 통해 해당 Skills를 실행합니다. "Always Ask"를 선택한 경우 프롬프트에서 "Always Allow"를 승인하면 해당 명령이 허용 목록에 추가됩니다.

    **옵션 C - SSH를 통해 macOS 바이너리 프록시(고급).**
    Gateway는 Linux에 유지하되, 필요한 CLI 바이너리가 Mac에서 실행되는 SSH 래퍼로 해석되도록 하세요. 그런 다음 Skill을 오버라이드해 Linux를 허용하면 계속 자격이 유지됩니다.

    1. 바이너리에 대한 SSH 래퍼를 만듭니다(예: Apple Notes용 `memo`).

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux 호스트의 `PATH`에 래퍼를 둡니다(예: `~/bin/memo`).
    3. Skill 메타데이터(워크스페이스 또는 `~/.openclaw/skills`)를 오버라이드해 Linux를 허용합니다.

       ```markdown
       ---
       name: apple-notes
       description: Manage Apple Notes via the memo CLI on macOS.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. Skills 스냅샷이 새로고침되도록 새 세션을 시작합니다.

  </Accordion>

  <Accordion title="Notion 또는 HeyGen 연동이 있나요?">
    현재 기본 제공되지는 않습니다.

    옵션:

    - **사용자 지정 Skill / Plugin:** 안정적인 API 접근에 가장 적합합니다(Notion/HeyGen 모두 API가 있습니다).
    - **브라우저 자동화:** 코드 없이 작동하지만 더 느리고 취약합니다.

    클라이언트별로 컨텍스트를 유지하려는 경우(에이전시 워크플로) 간단한 패턴은 다음과 같습니다.

    - 클라이언트당 Notion 페이지 하나(컨텍스트 + 선호도 + 활성 작업).
    - 세션 시작 시 에이전트에게 해당 페이지를 가져오도록 요청합니다.

    네이티브 연동을 원한다면 기능 요청을 열거나 해당 API를 대상으로 하는 Skill을
    빌드하세요.

    Skills 설치:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    네이티브 설치는 활성 워크스페이스 `skills/` 디렉터리에 배치됩니다. 에이전트 간 공유 Skills의 경우 `~/.openclaw/skills/<name>/SKILL.md`에 넣으세요. 일부 에이전트만 공유 설치를 볼 수 있어야 한다면 `agents.defaults.skills` 또는 `agents.list[].skills`를 구성하세요. 일부 Skills는 Homebrew로 설치된 바이너리를 기대합니다. Linux에서는 Linuxbrew를 의미합니다(위 Homebrew Linux FAQ 항목 참조). [Skills](/ko/tools/skills), [Skills 구성](/ko/tools/skills-config), [ClawHub](/ko/tools/clawhub)을 참조하세요.

  </Accordion>

  <Accordion title="OpenClaw에서 기존에 로그인된 Chrome을 어떻게 사용하나요?">
    Chrome DevTools MCP를 통해 연결되는 기본 제공 `user` 브라우저 프로필을 사용하세요.

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    사용자 지정 이름을 원한다면 명시적 MCP 프로필을 만드세요.

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    이 경로는 로컬 호스트 브라우저 또는 연결된 브라우저 Node를 사용할 수 있습니다. Gateway가 다른 곳에서 실행되는 경우 브라우저 머신에서 Node 호스트를 실행하거나 원격 CDP를 사용하세요.

    `existing-session` / `user`의 현재 제한 사항:

    - 작업은 CSS 선택자 기반이 아니라 ref 기반입니다
    - 업로드에는 `ref` / `inputRef`가 필요하며 현재 한 번에 파일 하나를 지원합니다
    - `responsebody`, PDF 내보내기, 다운로드 가로채기, 배치 작업에는 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다

  </Accordion>
</AccordionGroup>

## 샌드박싱 및 메모리

<AccordionGroup>
  <Accordion title="전용 샌드박싱 문서가 있나요?">
    예. [샌드박싱](/ko/gateway/sandboxing)을 참조하세요. Docker 전용 설정(Docker의 전체 Gateway 또는 샌드박스 이미지)은 [Docker](/ko/install/docker)를 참조하세요.
  </Accordion>

  <Accordion title="Docker가 제한적으로 느껴집니다. 전체 기능을 어떻게 활성화하나요?">
    기본 이미지는 보안 우선이며 `node` 사용자로 실행되므로 시스템 패키지,
    Homebrew 또는 번들 브라우저가 포함되지 않습니다. 더 완전한 설정을 위해서는:

    - 캐시가 유지되도록 `OPENCLAW_HOME_VOLUME`로 `/home/node`를 영구화합니다.
    - `OPENCLAW_DOCKER_APT_PACKAGES`로 시스템 의존성을 이미지에 포함합니다.
    - 번들 CLI를 통해 Playwright 브라우저를 설치합니다.
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH`를 설정하고 경로가 영구화되었는지 확인합니다.

    문서: [Docker](/ko/install/docker), [브라우저](/ko/tools/browser).

  </Accordion>

  <Accordion title="하나의 에이전트로 DM은 개인용으로 유지하고 그룹은 공개/샌드박스 처리할 수 있나요?">
    예. 비공개 트래픽이 **DM**이고 공개 트래픽이 **그룹**인 경우 가능합니다.

    `agents.defaults.sandbox.mode: "non-main"`을 사용하면 그룹/채널 세션(비-main 키)은 구성된 샌드박스 백엔드에서 실행되고, 기본 DM 세션은 호스트에서 유지됩니다. 하나를 선택하지 않으면 Docker가 기본 백엔드입니다. 그런 다음 `tools.sandbox.tools`를 통해 샌드박스 세션에서 사용할 수 있는 도구를 제한하세요.

    설정 안내 + 예시 구성: [그룹: 개인 DM + 공개 그룹](/ko/channels/groups#pattern-personal-dms-public-groups-single-agent)

    주요 구성 참조: [Gateway 구성](/ko/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="호스트 폴더를 샌드박스에 어떻게 바인드하나요?">
    `agents.defaults.sandbox.docker.binds`를 `["host:path:mode"]`로 설정하세요(예: `"/home/user/src:/src:ro"`). 전역 바인드와 에이전트별 바인드는 병합됩니다. `scope: "shared"`인 경우 에이전트별 바인드는 무시됩니다. 민감한 항목에는 `:ro`를 사용하고, 바인드는 샌드박스 파일시스템 장벽을 우회한다는 점을 기억하세요.

    OpenClaw는 정규화된 경로와 가장 깊이 존재하는 상위 항목을 통해 해석된 표준 경로 모두에 대해 바인드 소스를 검증합니다. 즉, 마지막 경로 세그먼트가 아직 존재하지 않는 경우에도 심볼릭 링크 부모를 통한 이탈은 닫힌 상태로 실패하며, 허용된 루트 검사는 심볼릭 링크 해석 후에도 계속 적용됩니다.

    예시와 안전 참고 사항은 [샌드박싱](/ko/gateway/sandboxing#custom-bind-mounts) 및 [샌드박스 vs 도구 정책 vs 권한 상승](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)을 참조하세요.

  </Accordion>

  <Accordion title="메모리는 어떻게 작동하나요?">
    OpenClaw 메모리는 에이전트 워크스페이스에 있는 Markdown 파일일 뿐입니다.

    - `memory/YYYY-MM-DD.md`의 일일 노트
    - `MEMORY.md`의 선별된 장기 노트(기본/비공개 세션만)

    OpenClaw는 자동 Compaction 전에 모델이 영구 노트를 작성하도록 상기시키기 위해
    **조용한 사전 Compaction 메모리 플러시**도 실행합니다. 이는 워크스페이스가
    쓰기 가능한 경우에만 실행됩니다(읽기 전용 샌드박스는 건너뜁니다). [메모리](/ko/concepts/memory)를 참조하세요.

  </Accordion>

  <Accordion title="메모리가 계속 잊어버립니다. 어떻게 유지되게 하나요?">
    봇에게 **해당 사실을 메모리에 기록**하라고 요청하세요. 장기 노트는 `MEMORY.md`에,
    단기 컨텍스트는 `memory/YYYY-MM-DD.md`에 들어갑니다.

    이는 아직 개선 중인 영역입니다. 모델에게 메모리를 저장하라고 상기시키면 도움이 됩니다.
    모델은 무엇을 해야 하는지 알고 있습니다. 계속 잊어버린다면 Gateway가 모든 실행에서
    동일한 워크스페이스를 사용하고 있는지 확인하세요.

    문서: [메모리](/ko/concepts/memory), [에이전트 워크스페이스](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="메모리는 영원히 지속되나요? 제한은 무엇인가요?">
    메모리 파일은 디스크에 있으며 삭제할 때까지 유지됩니다. 제한은 모델이 아니라
    저장 공간입니다. **세션 컨텍스트**는 여전히 모델 컨텍스트 창의 제한을 받으므로
    긴 대화는 compact되거나 잘릴 수 있습니다. 이것이 메모리 검색이 존재하는 이유입니다.
    관련 부분만 컨텍스트로 다시 가져옵니다.

    문서: [메모리](/ko/concepts/memory), [컨텍스트](/ko/concepts/context).

  </Accordion>

  <Accordion title="시맨틱 메모리 검색에 OpenAI API 키가 필요한가요?">
    **OpenAI 임베딩**을 사용하는 경우에만 필요합니다. Codex OAuth는 채팅/완성을 처리하며
    임베딩 액세스 권한을 부여하지 **않으므로**, **Codex로 로그인(OAuth 또는
    Codex CLI 로그인)**해도 시맨틱 메모리 검색에는 도움이 되지 않습니다. OpenAI 임베딩에는
    여전히 실제 API 키(`OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`)가 필요합니다.

    제공자를 명시적으로 설정하지 않으면, OpenClaw는 API 키를 확인할 수 있을 때
    제공자를 자동으로 선택합니다(인증 프로필, `models.providers.*.apiKey` 또는 환경 변수).
    OpenAI 키가 확인되면 OpenAI를 우선 사용하고, 그렇지 않으면 Gemini 키가
    확인될 때 Gemini를, 그다음 Voyage, 그다음 Mistral을 사용합니다. 원격 키가 없으면,
    메모리 검색은 구성할 때까지 비활성화된 상태로 유지됩니다. 로컬 모델 경로가
    구성되어 있고 실제로 존재하면, OpenClaw는
    `local`을 우선합니다. Ollama는 명시적으로
    `memorySearch.provider = "ollama"`를 설정했을 때 지원됩니다.

    로컬에 머무르고 싶다면 `memorySearch.provider = "local"`을 설정하세요(선택적으로
    `memorySearch.fallback = "none"`도 설정). Gemini 임베딩을 원하면
    `memorySearch.provider = "gemini"`를 설정하고 `GEMINI_API_KEY`(또는
    `memorySearch.remote.apiKey`)를 제공하세요. **OpenAI, Gemini, Voyage, Mistral, Ollama 또는 local** 임베딩
    모델을 지원합니다. 설정 자세한 내용은 [메모리](/ko/concepts/memory)를 참고하세요.

  </Accordion>
</AccordionGroup>

## 디스크에서 항목이 위치하는 곳

<AccordionGroup>
  <Accordion title="OpenClaw에서 사용하는 모든 데이터가 로컬에 저장되나요?">
    아닙니다. **OpenClaw의 상태는 로컬**이지만, **외부 서비스는 여전히 사용자가 보내는 내용을 볼 수 있습니다**.

    - **기본적으로 로컬:** 세션, 메모리 파일, 구성, 작업공간은 Gateway 호스트에 있습니다
      (`~/.openclaw` + 작업공간 디렉터리).
    - **필요에 따라 원격:** 모델 제공자(Anthropic/OpenAI 등)에게 보내는 메시지는
      해당 API로 전송되고, 채팅 플랫폼(WhatsApp/Telegram/Slack 등)은 메시지 데이터를
      자체 서버에 저장합니다.
    - **사용자가 범위를 제어합니다:** 로컬 모델을 사용하면 프롬프트가 사용자 머신에 남지만, 채널
      트래픽은 여전히 해당 채널의 서버를 거칩니다.

    관련 항목: [에이전트 작업공간](/ko/concepts/agent-workspace), [메모리](/ko/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw는 데이터를 어디에 저장하나요?">
    모든 항목은 `$OPENCLAW_STATE_DIR` 아래에 있습니다(기본값: `~/.openclaw`).

    | 경로                                                            | 목적                                                            |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 기본 구성(JSON5)                                                |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 레거시 OAuth 가져오기(처음 사용할 때 인증 프로필로 복사됨)       |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | 인증 프로필(OAuth, API 키 및 선택적 `keyRef`/`tokenRef`)  |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef 제공자를 위한 선택적 파일 기반 비밀 페이로드 |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 레거시 호환성 파일(정적 `api_key` 항목은 제거됨)      |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | 제공자 상태(예: `whatsapp/<accountId>/creds.json`)            |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | 에이전트별 상태(agentDir + 세션)                              |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 대화 기록 및 상태(에이전트별)                           |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 세션 메타데이터(에이전트별)                                       |

    레거시 단일 에이전트 경로: `~/.openclaw/agent/*`(`openclaw doctor`가 마이그레이션함).

    **작업공간**(AGENTS.md, 메모리 파일, Skills 등)은 별도이며 `agents.defaults.workspace`를 통해 구성됩니다(기본값: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md는 어디에 있어야 하나요?">
    이 파일들은 `~/.openclaw`가 아니라 **에이전트 작업공간**에 있습니다.

    - **작업공간(에이전트별)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, 선택적 `HEARTBEAT.md`.
      소문자 루트 `memory.md`는 레거시 복구 입력 전용입니다. 두 파일이 모두 있으면 `openclaw doctor --fix`가
      이를 `MEMORY.md`로 병합할 수 있습니다.
    - **상태 디렉터리(`~/.openclaw`)**: 구성, 채널/제공자 상태, 인증 프로필, 세션, 로그,
      공유 Skills(`~/.openclaw/skills`).

    기본 작업공간은 `~/.openclaw/workspace`이며, 다음으로 구성할 수 있습니다.

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    재시작 후 봇이 "잊어버린"다면, 매번 실행할 때 Gateway가 같은
    작업공간을 사용하는지 확인하세요(그리고 원격 모드는 로컬 노트북이 아니라 **gateway 호스트의**
    작업공간을 사용한다는 점을 기억하세요).

    팁: 지속적인 동작이나 선호사항을 원한다면, 채팅 기록에 의존하기보다 봇에게 이를 **AGENTS.md 또는 MEMORY.md에
    쓰도록** 요청하세요.

    [에이전트 작업공간](/ko/concepts/agent-workspace) 및 [메모리](/ko/concepts/memory)를 참고하세요.

  </Accordion>

  <Accordion title="권장 백업 전략">
    **에이전트 작업공간**을 **비공개** git 저장소에 넣고 비공개 위치(예: GitHub 비공개)에
    백업하세요. 이렇게 하면 메모리 + AGENTS/SOUL/USER
    파일을 보존하고, 나중에 어시스턴트의 "마음"을 복원할 수 있습니다.

    `~/.openclaw` 아래의 어떤 것도 커밋하지 **마세요**(자격 증명, 세션, 토큰 또는 암호화된 비밀 페이로드).
    전체 복원이 필요하다면 작업공간과 상태 디렉터리를
    별도로 모두 백업하세요(위의 마이그레이션 질문 참고).

    문서: [에이전트 작업공간](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw를 완전히 제거하려면 어떻게 하나요?">
    전용 가이드를 참고하세요: [제거](/ko/install/uninstall).
  </Accordion>

  <Accordion title="에이전트가 작업공간 밖에서 작업할 수 있나요?">
    예. 작업공간은 **기본 cwd**이자 메모리 기준점일 뿐, 엄격한 샌드박스가 아닙니다.
    상대 경로는 작업공간 안에서 해석되지만, 샌드박싱이 활성화되어 있지 않으면 절대 경로로 다른
    호스트 위치에 접근할 수 있습니다. 격리가 필요하면
    [`agents.defaults.sandbox`](/ko/gateway/sandboxing) 또는 에이전트별 샌드박스 설정을 사용하세요. 저장소를
    기본 작업 디렉터리로 만들고 싶다면 해당 에이전트의
    `workspace`를 저장소 루트로 지정하세요. OpenClaw 저장소는 소스 코드일 뿐입니다. 의도적으로 에이전트가 그 안에서 작업하게 하려는 경우가 아니라면
    작업공간은 별도로 유지하세요.

    예시(저장소를 기본 cwd로 사용):

    ```json5
    {
      agents: {
        defaults: {
          workspace: "~/Projects/my-repo",
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="원격 모드: 세션 저장소는 어디에 있나요?">
    세션 상태는 **gateway 호스트**가 소유합니다. 원격 모드에 있다면 중요한 세션 저장소는 로컬 노트북이 아니라 원격 머신에 있습니다. [세션 관리](/ko/concepts/session)를 참고하세요.
  </Accordion>
</AccordionGroup>

## 구성 기본 사항

<AccordionGroup>
  <Accordion title="구성 형식은 무엇인가요? 어디에 있나요?">
    OpenClaw는 `$OPENCLAW_CONFIG_PATH`에서 선택적 **JSON5** 구성을 읽습니다(기본값: `~/.openclaw/openclaw.json`).

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    파일이 없으면 안전에 가까운 기본값(`~/.openclaw/workspace` 기본 작업공간 포함)을 사용합니다.

  </Accordion>

  <Accordion title='gateway.bind: "lan"(또는 "tailnet")을 설정했는데 아무것도 수신하지 않거나 UI가 권한 없음이라고 표시합니다'>
    loopback이 아닌 바인드는 **유효한 gateway 인증 경로가 필요합니다**. 실제로는 다음을 의미합니다.

    - 공유 비밀 인증: 토큰 또는 비밀번호
    - 올바르게 구성된 identity-aware 리버스 프록시 뒤의 `gateway.auth.mode: "trusted-proxy"`

    ```json5
    {
      gateway: {
        bind: "lan",
        auth: {
          mode: "token",
          token: "replace-me",
        },
      },
    }
    ```

    참고:

    - `gateway.remote.token` / `.password`는 그 자체만으로 로컬 gateway 인증을 활성화하지 **않습니다**.
    - 로컬 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 fallback으로 사용할 수 있습니다.
    - 비밀번호 인증의 경우 대신 `gateway.auth.mode: "password"`와 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 설정하세요.
    - `gateway.auth.token` / `gateway.auth.password`가 SecretRef를 통해 명시적으로 구성되었지만 해석되지 않으면, 해석은 닫힌 상태로 실패합니다(원격 fallback으로 가려지지 않음).
    - 공유 비밀 Control UI 설정은 `connect.params.auth.token` 또는 `connect.params.auth.password`(앱/UI 설정에 저장됨)를 통해 인증합니다. Tailscale Serve 또는 `trusted-proxy` 같은 신원 포함 모드는 대신 요청 헤더를 사용합니다. 공유 비밀을 URL에 넣지 마세요.
    - `gateway.auth.mode: "trusted-proxy"`를 사용할 때, 같은 호스트의 loopback 리버스 프록시에는 명시적인 `gateway.auth.trustedProxy.allowLoopback = true`와 `gateway.trustedProxies`의 loopback 항목이 필요합니다.

  </Accordion>

  <Accordion title="이제 localhost에 토큰이 필요한 이유는 무엇인가요?">
    OpenClaw는 loopback을 포함해 기본적으로 gateway 인증을 적용합니다. 일반적인 기본 경로에서는 토큰 인증을 의미합니다. 명시적인 인증 경로가 구성되어 있지 않으면 gateway 시작 시 토큰 모드로 해석되고 토큰을 자동 생성하여 `gateway.auth.token`에 저장하므로 **로컬 WS 클라이언트는 인증해야 합니다**. 이렇게 하면 다른 로컬 프로세스가 Gateway를 호출하는 것을 차단합니다.

    다른 인증 경로를 선호한다면 비밀번호 모드(또는 identity-aware 리버스 프록시의 경우 `trusted-proxy`)를 명시적으로 선택할 수 있습니다. **정말로** 열린 loopback을 원한다면 구성에서 `gateway.auth.mode: "none"`을 명시적으로 설정하세요. Doctor는 언제든 토큰을 생성할 수 있습니다: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="구성을 변경한 후 재시작해야 하나요?">
    Gateway는 구성을 감시하며 hot-reload를 지원합니다.

    - `gateway.reload.mode: "hybrid"`(기본값): 안전한 변경은 hot-apply하고, 중요한 변경은 재시작
    - `hot`, `restart`, `off`도 지원됩니다

  </Accordion>

  <Accordion title="재미있는 CLI 태그라인을 비활성화하려면 어떻게 하나요?">
    구성에서 `cli.banner.taglineMode`를 설정하세요.

    ```json5
    {
      cli: {
        banner: {
          taglineMode: "off", // random | default | off
        },
      },
    }
    ```

    - `off`: 태그라인 텍스트를 숨기지만 배너 제목/버전 줄은 유지합니다.
    - `default`: 매번 `All your chats, one OpenClaw.`를 사용합니다.
    - `random`: 회전하는 재미있는/계절성 태그라인(기본 동작).
    - 배너를 전혀 원하지 않으면 환경 변수 `OPENCLAW_HIDE_BANNER=1`을 설정하세요.

  </Accordion>

  <Accordion title="웹 검색(및 웹 가져오기)을 활성화하려면 어떻게 하나요?">
    `web_fetch`는 API 키 없이 작동합니다. `web_search`는 선택한
    제공자에 따라 달라집니다.

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, Tavily 같은 API 기반 제공자는 일반적인 API 키 설정이 필요합니다.
    - Ollama Web Search는 키가 필요 없지만, 구성된 Ollama 호스트를 사용하며 `ollama signin`이 필요합니다.
    - DuckDuckGo는 키가 필요 없지만, 비공식 HTML 기반 통합입니다.
    - SearXNG는 키가 필요 없고 자체 호스팅됩니다. `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl`을 구성하세요.

    **권장:** `openclaw configure --section web`을 실행하고 제공자를 선택하세요.
    환경 변수 대안:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` 또는 `MINIMAX_API_KEY`
    - Perplexity: `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY`
    - SearXNG: `SEARXNG_BASE_URL`
    - Tavily: `TAVILY_API_KEY`

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "BRAVE_API_KEY_HERE",
              },
            },
          },
        },
        },
        tools: {
          web: {
            search: {
              enabled: true,
              provider: "brave",
              maxResults: 5,
            },
            fetch: {
              enabled: true,
              provider: "firecrawl", // optional; omit for auto-detect
            },
          },
        },
    }
    ```

    공급자별 웹 검색 구성은 이제 `plugins.entries.<plugin>.config.webSearch.*` 아래에 있습니다.
    기존 `tools.web.search.*` 공급자 경로는 호환성을 위해 일시적으로 계속 로드되지만, 새 구성에는 사용하지 않아야 합니다.
    Firecrawl 웹 가져오기 대체 구성은 `plugins.entries.firecrawl.config.webFetch.*` 아래에 있습니다.

    참고:

    - 허용 목록을 사용하는 경우 `web_search`/`web_fetch`/`x_search` 또는 `group:web`을 추가하세요.
    - `web_fetch`는 기본적으로 활성화됩니다(명시적으로 비활성화하지 않는 한).
    - `tools.web.fetch.provider`를 생략하면 OpenClaw는 사용 가능한 자격 증명에서 준비된 첫 번째 가져오기 대체 공급자를 자동 감지합니다. 현재 번들 공급자는 Firecrawl입니다.
    - 데몬은 `~/.openclaw/.env`(또는 서비스 환경)에서 환경 변수를 읽습니다.

    문서: [웹 도구](/ko/tools/web).

  </Accordion>

  <Accordion title="config.apply가 내 구성을 지웠습니다. 어떻게 복구하고 이를 방지할 수 있나요?">
    `config.apply`는 **전체 구성**을 교체합니다. 부분 객체를 보내면 그 외의 모든 것이
    제거됩니다.

    현재 OpenClaw는 많은 우발적인 덮어쓰기를 방지합니다.

    - OpenClaw가 소유한 구성 쓰기는 쓰기 전에 변경 후 전체 구성을 검증합니다.
    - 유효하지 않거나 파괴적인 OpenClaw 소유 쓰기는 거부되고 `openclaw.json.rejected.*`로 저장됩니다.
    - 직접 편집으로 시작 또는 핫 리로드가 중단되면 Gateway가 마지막으로 정상 작동한 구성을 복원하고 거부된 파일을 `openclaw.json.clobbered.*`로 저장합니다.
    - 복구 후 기본 에이전트는 부팅 경고를 받아 잘못된 구성을 다시 무작정 쓰지 않습니다.

    복구:

    - `openclaw logs --follow`에서 `Config auto-restored from last-known-good`, `Config write rejected:`, 또는 `config reload restored last-known-good config`를 확인하세요.
    - 활성 구성 옆의 최신 `openclaw.json.clobbered.*` 또는 `openclaw.json.rejected.*`를 검사하세요.
    - 복원된 활성 구성이 동작하면 그대로 두고, 의도한 키만 `openclaw config set` 또는 `config.patch`로 다시 복사하세요.
    - `openclaw config validate`와 `openclaw doctor`를 실행하세요.
    - 마지막 정상 구성이나 거부된 페이로드가 없다면 백업에서 복원하거나, `openclaw doctor`를 다시 실행하고 채널/모델을 재구성하세요.
    - 예상치 못한 일이었다면 버그를 제출하고 마지막으로 알고 있는 구성 또는 백업을 포함하세요.
    - 로컬 코딩 에이전트는 로그나 기록에서 동작하는 구성을 재구성할 수 있는 경우가 많습니다.

    방지:

    - 작은 변경에는 `openclaw config set`을 사용하세요.
    - 대화형 편집에는 `openclaw configure`를 사용하세요.
    - 정확한 경로나 필드 형태가 확실하지 않을 때는 먼저 `config.schema.lookup`을 사용하세요. 이 명령은 얕은 스키마 노드와 드릴다운용 직접 하위 요약을 반환합니다.
    - 부분 RPC 편집에는 `config.patch`를 사용하고, `config.apply`는 전체 구성 교체에만 사용하세요.
    - 에이전트 실행에서 소유자 전용 `gateway` 도구를 사용하는 경우에도 `tools.exec.ask` / `tools.exec.security`에 대한 쓰기는 거부됩니다(동일한 보호된 exec 경로로 정규화되는 기존 `tools.bash.*` 별칭 포함).

    문서: [구성](/ko/cli/config), [구성하기](/ko/cli/configure), [Gateway 문제 해결](/ko/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="여러 기기에 걸쳐 특화된 작업자를 사용하는 중앙 Gateway를 어떻게 실행하나요?">
    일반적인 패턴은 **하나의 Gateway**(예: Raspberry Pi)에 **Node**와 **에이전트**를 더하는 것입니다.

    - **Gateway(중앙):** 채널(Signal/WhatsApp), 라우팅, 세션을 소유합니다.
    - **Node(기기):** Mac/iOS/Android가 주변 장치로 연결되어 로컬 도구(`system.run`, `canvas`, `camera`)를 노출합니다.
    - **에이전트(작업자):** 특수 역할(예: "Hetzner ops", "Personal data")을 위한 별도의 두뇌/작업 공간입니다.
    - **하위 에이전트:** 병렬 처리가 필요할 때 기본 에이전트에서 백그라운드 작업을 생성합니다.
    - **TUI:** Gateway에 연결하고 에이전트/세션을 전환합니다.

    문서: [Node](/ko/nodes), [원격 액세스](/ko/gateway/remote), [멀티 에이전트 라우팅](/ko/concepts/multi-agent), [하위 에이전트](/ko/tools/subagents), [TUI](/ko/web/tui).

  </Accordion>

  <Accordion title="OpenClaw 브라우저를 헤드리스로 실행할 수 있나요?">
    예. 구성 옵션입니다.

    ```json5
    {
      browser: { headless: true },
      agents: {
        defaults: {
          sandbox: { browser: { headless: true } },
        },
      },
    }
    ```

    기본값은 `false`(헤드풀)입니다. 헤드리스는 일부 사이트에서 봇 방지 검사를 트리거할 가능성이 더 높습니다. [브라우저](/ko/tools/browser)를 참조하세요.

    헤드리스는 **동일한 Chromium 엔진**을 사용하며 대부분의 자동화(양식, 클릭, 스크래핑, 로그인)에서 동작합니다. 주요 차이점은 다음과 같습니다.

    - 표시되는 브라우저 창이 없습니다(시각 자료가 필요하면 스크린샷을 사용하세요).
    - 일부 사이트는 헤드리스 모드의 자동화에 더 엄격합니다(CAPTCHA, 봇 방지).
      예를 들어 X/Twitter는 헤드리스 세션을 자주 차단합니다.

  </Accordion>

  <Accordion title="브라우저 제어에 Brave를 어떻게 사용하나요?">
    `browser.executablePath`를 Brave 바이너리(또는 Chromium 기반 브라우저)로 설정하고 Gateway를 다시 시작하세요.
    전체 구성 예시는 [브라우저](/ko/tools/browser#use-brave-or-another-chromium-based-browser)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 원격 Gateway와 Node

<AccordionGroup>
  <Accordion title="명령은 Telegram, Gateway, Node 사이에서 어떻게 전파되나요?">
    Telegram 메시지는 **Gateway**가 처리합니다. Gateway는 에이전트를 실행하고,
    Node 도구가 필요할 때만 **Gateway WebSocket**을 통해 Node를 호출합니다.

    Telegram → Gateway → 에이전트 → `node.*` → Node → Gateway → Telegram

    Node는 인바운드 공급자 트래픽을 보지 않으며, Node RPC 호출만 받습니다.

  </Accordion>

  <Accordion title="Gateway가 원격으로 호스팅되는 경우 내 에이전트가 내 컴퓨터에 어떻게 액세스할 수 있나요?">
    짧은 답: **컴퓨터를 Node로 페어링하세요**. Gateway는 다른 곳에서 실행되지만,
    Gateway WebSocket을 통해 로컬 머신의 `node.*` 도구(화면, 카메라, 시스템)를 호출할 수 있습니다.

    일반적인 설정:

    1. 항상 켜져 있는 호스트(VPS/홈 서버)에서 Gateway를 실행합니다.
    2. Gateway 호스트와 컴퓨터를 같은 tailnet에 넣습니다.
    3. Gateway WS에 접근할 수 있는지 확인합니다(tailnet 바인드 또는 SSH 터널).
    4. macOS 앱을 로컬에서 열고 **SSH를 통한 원격** 모드(또는 직접 tailnet)로 연결하여
       Node로 등록되게 합니다.
    5. Gateway에서 Node를 승인합니다.

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    별도의 TCP 브리지는 필요하지 않습니다. Node는 Gateway WebSocket을 통해 연결됩니다.

    보안 알림: macOS Node를 페어링하면 해당 머신에서 `system.run`이 허용됩니다. 신뢰하는
    기기만 페어링하고 [보안](/ko/gateway/security)을 검토하세요.

    문서: [Node](/ko/nodes), [Gateway 프로토콜](/ko/gateway/protocol), [macOS 원격 모드](/ko/platforms/mac/remote), [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="Tailscale은 연결되었지만 응답이 없습니다. 이제 어떻게 해야 하나요?">
    기본 사항을 확인하세요.

    - Gateway 실행 중: `openclaw gateway status`
    - Gateway 상태: `openclaw status`
    - 채널 상태: `openclaw channels status`

    그런 다음 인증과 라우팅을 확인하세요.

    - Tailscale Serve를 사용하는 경우 `gateway.auth.allowTailscale`이 올바르게 설정되어 있는지 확인하세요.
    - SSH 터널로 연결하는 경우 로컬 터널이 올라와 있고 올바른 포트를 가리키는지 확인하세요.
    - 허용 목록(DM 또는 그룹)에 내 계정이 포함되어 있는지 확인하세요.

    문서: [Tailscale](/ko/gateway/tailscale), [원격 액세스](/ko/gateway/remote), [채널](/ko/channels).

  </Accordion>

  <Accordion title="두 OpenClaw 인스턴스가 서로 통신할 수 있나요(로컬 + VPS)?">
    예. 기본 제공 "봇 간" 브리지는 없지만 몇 가지
    신뢰할 수 있는 방식으로 연결할 수 있습니다.

    **가장 간단한 방법:** 두 봇이 모두 접근할 수 있는 일반 채팅 채널(Telegram/Slack/WhatsApp)을 사용하세요.
    Bot A가 Bot B에 메시지를 보내게 한 다음 Bot B가 평소처럼 답장하게 하세요.

    **CLI 브리지(일반):** 다른 봇이 수신하는 채팅을 대상으로,
    `openclaw agent --message ... --deliver`로 다른 Gateway를 호출하는 스크립트를 실행하세요.
    한 봇이 원격 VPS에 있다면 SSH/Tailscale을 통해 CLI가 해당 원격 Gateway를 가리키게 하세요
    ([원격 액세스](/ko/gateway/remote) 참조).

    예시 패턴(대상 Gateway에 접근할 수 있는 머신에서 실행):

    ```bash
    openclaw agent --message "Hello from local bot" --deliver --channel telegram --reply-to <chat-id>
    ```

    팁: 두 봇이 끝없이 반복하지 않도록 가드레일을 추가하세요(멘션 전용, 채널
    허용 목록, 또는 "봇 메시지에 답장하지 않기" 규칙).

    문서: [원격 액세스](/ko/gateway/remote), [에이전트 CLI](/ko/cli/agent), [에이전트 보내기](/ko/tools/agent-send).

  </Accordion>

  <Accordion title="여러 에이전트에 별도의 VPS가 필요한가요?">
    아니요. 하나의 Gateway가 여러 에이전트를 호스팅할 수 있으며, 각 에이전트는 자체 작업 공간, 모델 기본값,
    라우팅을 가질 수 있습니다. 이것이 일반적인 설정이며 에이전트마다 하나의 VPS를 실행하는 것보다 훨씬 저렴하고 간단합니다.

    강한 격리(보안 경계)가 필요하거나 공유하고 싶지 않은 매우
    다른 구성이 있을 때만 별도의 VPS를 사용하세요. 그 외에는 하나의 Gateway를 유지하고
    여러 에이전트 또는 하위 에이전트를 사용하세요.

  </Accordion>

  <Accordion title="VPS에서 SSH를 사용하는 대신 개인 노트북에서 Node를 사용하는 이점이 있나요?">
    예. Node는 원격 Gateway에서 노트북에 접근하는 일급 방식이며,
    셸 액세스 이상의 기능을 엽니다. Gateway는 macOS/Linux(Windows는 WSL2 통해)에서 실행되고
    가볍기 때문에(소형 VPS 또는 Raspberry Pi급 장치면 충분하며 4 GB RAM이면 넉넉함), 일반적인
    설정은 항상 켜져 있는 호스트와 Node로 사용하는 노트북입니다.

    - **인바운드 SSH가 필요 없습니다.** Node는 Gateway WebSocket으로 나가서 연결하고 기기 페어링을 사용합니다.
    - **더 안전한 실행 제어.** `system.run`은 해당 노트북의 Node 허용 목록/승인으로 보호됩니다.
    - **더 많은 기기 도구.** Node는 `system.run` 외에도 `canvas`, `camera`, `screen`을 노출합니다.
    - **로컬 브라우저 자동화.** Gateway는 VPS에 두되, 노트북의 Node 호스트를 통해 Chrome을 로컬에서 실행하거나 Chrome MCP를 통해 호스트의 로컬 Chrome에 연결하세요.

    SSH는 임시 셸 액세스에는 괜찮지만, 지속적인 에이전트 워크플로와
    기기 자동화에는 Node가 더 간단합니다.

    문서: [Node](/ko/nodes), [Node CLI](/ko/cli/nodes), [브라우저](/ko/tools/browser).

  </Accordion>

  <Accordion title="Node가 Gateway 서비스를 실행하나요?">
    아니요. 의도적으로 격리된 프로필을 실행하는 경우가 아니라면 호스트당 **하나의 Gateway**만 실행해야 합니다([여러 Gateway](/ko/gateway/multiple-gateways) 참조). Node는 Gateway에 연결되는 주변 장치입니다
    (iOS/Android Node 또는 macOS 메뉴 막대 앱의 "Node 모드"). 헤드리스 Node
    호스트와 CLI 제어는 [Node 호스트 CLI](/ko/cli/node)를 참조하세요.

    `gateway`, `discovery`, `canvasHost` 변경에는 전체 재시작이 필요합니다.

  </Accordion>

  <Accordion title="구성을 적용하는 API / RPC 방법이 있나요?">
    예.

    - `config.schema.lookup`: 쓰기 전에 얕은 스키마 노드, 일치하는 UI 힌트, 직접 하위 요약과 함께 하나의 구성 하위 트리를 검사합니다
    - `config.get`: 현재 스냅샷 + 해시를 가져옵니다
    - `config.patch`: 안전한 부분 업데이트(대부분의 RPC 편집에 권장); 가능하면 핫 리로드하고 필요하면 재시작합니다
    - `config.apply`: 검증 + 전체 구성 교체; 가능하면 핫 리로드하고 필요하면 재시작합니다
    - 소유자 전용 `gateway` 런타임 도구는 여전히 `tools.exec.ask` / `tools.exec.security` 재작성을 거부합니다. 기존 `tools.bash.*` 별칭은 동일한 보호된 exec 경로로 정규화됩니다

  </Accordion>

  <Accordion title="첫 설치를 위한 최소한의 합리적인 설정">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    이렇게 하면 작업 영역을 설정하고, 누가 봇을 트리거할 수 있는지 제한합니다.

  </Accordion>

  <Accordion title="VPS에 Tailscale을 설정하고 Mac에서 연결하려면 어떻게 하나요?">
    최소 단계:

    1. **VPS에 설치 + 로그인**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac에 설치 + 로그인**
       - Tailscale 앱을 사용하고 같은 tailnet에 로그인합니다.
    3. **MagicDNS 활성화(권장)**
       - Tailscale 관리 콘솔에서 MagicDNS를 활성화하여 VPS가 안정적인 이름을 갖도록 합니다.
    4. **tailnet 호스트 이름 사용**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH 없이 Control UI를 사용하려면 VPS에서 Tailscale Serve를 사용하세요.

    ```bash
    openclaw gateway --tailscale serve
    ```

    이렇게 하면 gateway가 loopback에 바인딩된 상태로 유지되고 Tailscale을 통해 HTTPS가 노출됩니다. [Tailscale](/ko/gateway/tailscale)을 참고하세요.

  </Accordion>

  <Accordion title="Mac 노드를 원격 Gateway(Tailscale Serve)에 연결하려면 어떻게 하나요?">
    Serve는 **Gateway Control UI + WS**를 노출합니다. 노드는 같은 Gateway WS 엔드포인트를 통해 연결됩니다.

    권장 설정:

    1. **VPS + Mac이 같은 tailnet에 있는지 확인합니다**.
    2. **Remote 모드에서 macOS 앱을 사용합니다**(SSH 대상은 tailnet 호스트 이름일 수 있음).
       앱이 Gateway 포트를 터널링하고 노드로 연결합니다.
    3. gateway에서 **노드를 승인합니다**.

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    문서: [Gateway protocol](/ko/gateway/protocol), [Discovery](/ko/gateway/discovery), [macOS remote mode](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="두 번째 노트북에 설치해야 하나요, 아니면 노드만 추가하면 되나요?">
    두 번째 노트북에서 **로컬 도구**(화면/카메라/실행)만 필요하다면
    **노드**로 추가하세요. 그러면 단일 Gateway를 유지하고 설정 중복을 피할 수 있습니다. 로컬 노드 도구는
    현재 macOS에서만 지원되지만, 다른 OS로도 확장할 계획입니다.

    **강한 격리** 또는 완전히 분리된 두 봇이 필요할 때만 두 번째 Gateway를 설치하세요.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/ko/cli/nodes), [Multiple gateways](/ko/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## 환경 변수와 .env 로드

<AccordionGroup>
  <Accordion title="OpenClaw는 환경 변수를 어떻게 로드하나요?">
    OpenClaw는 부모 프로세스(shell, launchd/systemd, CI 등)에서 env vars를 읽고 추가로 다음을 로드합니다.

    - 현재 작업 디렉터리의 `.env`
    - `~/.openclaw/.env`의 전역 fallback `.env`(즉 `$OPENCLAW_STATE_DIR/.env`)

    어느 `.env` 파일도 기존 env vars를 덮어쓰지 않습니다.

    설정에서 inline env vars를 정의할 수도 있습니다(프로세스 env에 없을 때만 적용됨).

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    전체 우선순위와 출처는 [/environment](/ko/help/environment)를 참고하세요.

  </Accordion>

  <Accordion title="서비스를 통해 Gateway를 시작했더니 env vars가 사라졌습니다. 이제 어떻게 해야 하나요?">
    일반적인 해결 방법 두 가지:

    1. 서비스가 shell env를 상속하지 않더라도 가져올 수 있도록 누락된 키를 `~/.openclaw/.env`에 넣습니다.
    2. shell import를 활성화합니다(선택적 편의 기능).

    ```json5
    {
      env: {
        shellEnv: {
          enabled: true,
          timeoutMs: 15000,
        },
      },
    }
    ```

    이렇게 하면 login shell을 실행하고 누락된 예상 키만 가져옵니다(절대 덮어쓰지 않음). Env var equivalents:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN을 설정했는데 models status에 "Shell env: off."라고 표시됩니다. 왜 그런가요?'>
    `openclaw models status`는 **shell env import**가 활성화되어 있는지를 보고합니다. "Shell env: off"는
    env vars가 누락되었다는 뜻이 **아닙니다**. OpenClaw가 login shell을
    자동으로 로드하지 않는다는 뜻일 뿐입니다.

    Gateway가 서비스(launchd/systemd)로 실행되는 경우 shell
    environment를 상속하지 않습니다. 다음 중 하나로 해결하세요.

    1. 토큰을 `~/.openclaw/.env`에 넣습니다.

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 또는 shell import를 활성화합니다(`env.shellEnv.enabled: true`).
    3. 또는 설정의 `env` 블록에 추가합니다(없을 때만 적용됨).

    그런 다음 gateway를 재시작하고 다시 확인합니다.

    ```bash
    openclaw models status
    ```

    Copilot 토큰은 `COPILOT_GITHUB_TOKEN`에서 읽습니다(`GH_TOKEN` / `GITHUB_TOKEN`도 가능).
    [/concepts/model-providers](/ko/concepts/model-providers) 및 [/environment](/ko/help/environment)를 참고하세요.

  </Accordion>
</AccordionGroup>

## 세션과 여러 채팅

<AccordionGroup>
  <Accordion title="새 대화를 시작하려면 어떻게 하나요?">
    독립 메시지로 `/new` 또는 `/reset`을 보내세요. [Session management](/ko/concepts/session)를 참고하세요.
  </Accordion>

  <Accordion title="/new를 보내지 않으면 세션이 자동으로 재설정되나요?">
    세션은 `session.idleMinutes` 이후 만료될 수 있지만, 이는 **기본적으로 비활성화**되어 있습니다(기본값 **0**).
    유휴 만료를 활성화하려면 양수 값으로 설정하세요. 활성화된 경우 유휴 기간 후 **다음**
    메시지가 해당 채팅 키에 대해 새 세션 ID를 시작합니다.
    이는 transcript를 삭제하지 않으며 새 세션을 시작할 뿐입니다.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw 인스턴스 팀(CEO 한 명과 여러 에이전트)을 만들 방법이 있나요?">
    예, **multi-agent routing**과 **sub-agents**를 통해 가능합니다. 하나의 coordinator
    agent와 여러 worker agent를 각자의 작업 영역 및 모델과 함께 만들 수 있습니다.

    다만 이는 **재미있는 실험**으로 보는 것이 가장 좋습니다. 토큰을 많이 사용하며, 별도 세션이 있는 하나의 봇을 사용하는 것보다
    덜 효율적인 경우가 많습니다. 우리가 구상하는 일반적인 모델은 병렬 작업을 위한 서로 다른 세션을 갖춘, 사용자가 대화하는 하나의 봇입니다. 해당
    봇은 필요할 때 sub-agents도 생성할 수 있습니다.

    문서: [Multi-agent routing](/ko/concepts/multi-agent), [Sub-agents](/ko/tools/subagents), [Agents CLI](/ko/cli/agents).

  </Accordion>

  <Accordion title="작업 중간에 context가 잘린 이유는 무엇인가요? 어떻게 방지하나요?">
    세션 context는 모델 window의 제한을 받습니다. 긴 채팅, 큰 도구 출력, 또는 많은
    파일이 Compaction이나 truncation을 유발할 수 있습니다.

    도움이 되는 방법:

    - 봇에게 현재 상태를 요약하고 파일에 쓰도록 요청합니다.
    - 긴 작업 전에는 `/compact`를 사용하고, 주제를 바꿀 때는 `/new`를 사용합니다.
    - 중요한 context를 작업 영역에 보관하고 봇에게 다시 읽도록 요청합니다.
    - 긴 작업이나 병렬 작업에는 sub-agents를 사용하여 main chat을 더 작게 유지합니다.
    - 이런 일이 자주 발생하면 더 큰 context window를 가진 모델을 선택합니다.

  </Accordion>

  <Accordion title="OpenClaw는 설치된 상태로 유지하면서 완전히 재설정하려면 어떻게 하나요?">
    reset 명령을 사용하세요.

    ```bash
    openclaw reset
    ```

    비대화형 전체 reset:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    그런 다음 setup을 다시 실행합니다.

    ```bash
    openclaw onboard --install-daemon
    ```

    참고:

    - 기존 설정을 감지하면 onboarding도 **Reset**을 제공합니다. [Onboarding (CLI)](/ko/start/wizard)를 참고하세요.
    - profiles(`--profile` / `OPENCLAW_PROFILE`)를 사용했다면 각 state dir을 reset하세요(기본값은 `~/.openclaw-<profile>`).
    - Dev reset: `openclaw gateway --dev --reset`(dev 전용; dev config + credentials + sessions + workspace를 삭제).

  </Accordion>

  <Accordion title='"context too large" 오류가 발생합니다. reset 또는 compact하려면 어떻게 하나요?'>
    다음 중 하나를 사용하세요.

    - **Compact**(대화는 유지하되 오래된 턴을 요약):

      ```
      /compact
      ```

      또는 요약을 안내하려면 `/compact <instructions>`를 사용합니다.

    - **Reset**(같은 채팅 키에 대해 새 세션 ID):

      ```
      /new
      /reset
      ```

    계속 발생하는 경우:

    - 오래된 도구 출력을 잘라내도록 **session pruning**(`agents.defaults.contextPruning`)을 활성화하거나 조정합니다.
    - 더 큰 context window를 가진 모델을 사용합니다.

    문서: [Compaction](/ko/concepts/compaction), [Session pruning](/ko/concepts/session-pruning), [Session management](/ko/concepts/session).

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required"가 표시되는 이유는 무엇인가요?'>
    이는 provider validation error입니다. 모델이 필수
    `input` 없이 `tool_use` 블록을 내보냈다는 뜻입니다. 보통 session history가 오래되었거나 손상된 경우를 의미합니다(긴 thread
    또는 tool/schema 변경 이후에 자주 발생).

    해결: `/new`로 새 세션을 시작하세요(독립 메시지).

  </Accordion>

  <Accordion title="30분마다 Heartbeat 메시지를 받는 이유는 무엇인가요?">
    Heartbeat는 기본적으로 **30m**마다 실행됩니다(OAuth auth 사용 시 **1h**). 조정하거나 비활성화하세요.

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // or "0m" to disable
          },
        },
      },
    }
    ```

    `HEARTBEAT.md`가 있지만 사실상 비어 있는 경우(빈 줄과 `# Heading` 같은 markdown
    header만 있는 경우), OpenClaw는 API 호출을 절약하기 위해 heartbeat 실행을 건너뜁니다.
    파일이 없으면 heartbeat는 계속 실행되고 모델이 무엇을 할지 결정합니다.

    Agent별 override는 `agents.list[].heartbeat`를 사용합니다. 문서: [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title='WhatsApp 그룹에 "bot account"를 추가해야 하나요?'>
    아니요. OpenClaw는 **사용자 본인 계정**에서 실행되므로 사용자가 그룹에 있으면 OpenClaw도 볼 수 있습니다.
    기본적으로 그룹 답장은 보낸 사람을 허용할 때까지 차단됩니다(`groupPolicy: "allowlist"`).

    **사용자만** 그룹 답장을 트리거할 수 있게 하려면 다음을 사용하세요.

    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="WhatsApp 그룹의 JID를 얻으려면 어떻게 하나요?">
    옵션 1(가장 빠름): 로그를 tail하고 그룹에서 test message를 보냅니다.

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us`로 끝나는 `chatId`(또는 `from`)를 찾으세요. 예:
    `1234567890-1234567890@g.us`.

    옵션 2(이미 설정/allowlist된 경우): 설정에서 그룹을 나열합니다.

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    문서: [WhatsApp](/ko/channels/whatsapp), [Directory](/ko/cli/directory), [Logs](/ko/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw가 그룹에서 답장하지 않는 이유는 무엇인가요?">
    일반적인 원인 두 가지:

    - Mention gating이 켜져 있습니다(기본값). 봇을 @mention해야 합니다(또는 `mentionPatterns`와 일치해야 함).
    - `channels.whatsapp.groups`를 `"*"` 없이 설정했고 해당 그룹이 allowlist되지 않았습니다.

    [Groups](/ko/channels/groups) 및 [Group messages](/ko/channels/group-messages)를 참고하세요.

  </Accordion>

  <Accordion title="그룹/thread는 DM과 context를 공유하나요?">
    기본적으로 direct chats는 main session으로 합쳐집니다. 그룹/채널은 고유한 session keys를 가지며, Telegram topics / Discord threads는 별도 세션입니다. [Groups](/ko/channels/groups) 및 [Group messages](/ko/channels/group-messages)를 참고하세요.
  </Accordion>

  <Accordion title="작업 영역과 agent를 몇 개까지 만들 수 있나요?">
    엄격한 제한은 없습니다. 수십 개(심지어 수백 개)도 괜찮지만 다음을 주의하세요.

    - **Disk growth:** sessions + transcripts는 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.
    - **Token cost:** agent가 많을수록 concurrent model usage가 늘어납니다.
    - **Ops overhead:** agent별 auth profiles, workspaces, channel routing.

    팁:

    - agent당 하나의 **active** workspace를 유지하세요(`agents.defaults.workspace`).
    - 디스크가 커지면 오래된 sessions(JSONL 또는 store entries 삭제)를 정리하세요.
    - stray workspaces와 profile mismatches를 찾으려면 `openclaw doctor`를 사용하세요.

  </Accordion>

  <Accordion title="여러 봇이나 채팅을 동시에 실행할 수 있나요(Slack), 그리고 어떻게 설정해야 하나요?">
    예. **Multi-Agent Routing**을 사용해 여러 격리된 에이전트를 실행하고 인바운드 메시지를
    채널/계정/피어 기준으로 라우팅하세요. Slack은 채널로 지원되며 특정 에이전트에 바인딩할 수 있습니다.

    브라우저 접근은 강력하지만 "사람이 할 수 있는 모든 일을 수행"할 수 있는 것은 아닙니다. 안티봇, CAPTCHA, MFA가
    여전히 자동화를 차단할 수 있습니다. 가장 안정적인 브라우저 제어를 위해서는 호스트에서 로컬 Chrome MCP를 사용하거나,
    실제로 브라우저를 실행하는 머신에서 CDP를 사용하세요.

    권장 설정:

    - 항상 켜져 있는 Gateway 호스트(VPS/Mac mini).
    - 역할별 에이전트 하나(바인딩).
    - 해당 에이전트에 바인딩된 Slack 채널.
    - 필요할 때 Chrome MCP 또는 노드를 통한 로컬 브라우저.

    문서: [Multi-Agent Routing](/ko/concepts/multi-agent), [Slack](/ko/channels/slack),
    [Browser](/ko/tools/browser), [Nodes](/ko/nodes).

  </Accordion>
</AccordionGroup>

## 모델, 장애 조치, 인증 프로필

모델 Q&A(기본값, 선택, 별칭, 전환, 장애 조치, 인증 프로필)는
[모델 FAQ](/ko/help/faq-models)에 있습니다.

## Gateway: 포트, "이미 실행 중", 원격 모드

<AccordionGroup>
  <Accordion title="Gateway는 어떤 포트를 사용하나요?">
    `gateway.port`는 WebSocket + HTTP(Control UI, 훅 등)를 위한 단일 멀티플렉스 포트를 제어합니다.

    우선순위:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > default 18789
    ```

  </Accordion>

  <Accordion title='왜 openclaw gateway status가 "Runtime: running"이지만 "Connectivity probe: failed"라고 하나요?'>
    "running"은 **슈퍼바이저의** 관점(launchd/systemd/schtasks)이기 때문입니다. 연결 프로브는 CLI가 실제로 gateway WebSocket에 연결하는 것입니다.

    `openclaw gateway status`를 사용하고 다음 줄을 신뢰하세요.

    - `Probe target:`(프로브가 실제로 사용한 URL)
    - `Listening:`(포트에 실제로 바인딩된 대상)
    - `Last gateway error:`(프로세스는 살아 있지만 포트가 수신 중이 아닐 때 흔한 근본 원인)

  </Accordion>

  <Accordion title='왜 openclaw gateway status가 "Config (cli)"와 "Config (service)"를 다르게 표시하나요?'>
    서비스가 다른 설정 파일로 실행되는 동안 하나의 설정 파일을 편집하고 있습니다(흔히 `--profile` / `OPENCLAW_STATE_DIR` 불일치).

    수정:

    ```bash
    openclaw gateway install --force
    ```

    서비스가 사용하기를 원하는 동일한 `--profile` / 환경에서 실행하세요.

  </Accordion>

  <Accordion title='"another gateway instance is already listening"은 무슨 뜻인가요?'>
    OpenClaw는 시작 즉시 WebSocket 리스너를 바인딩하여 런타임 잠금을 강제합니다(기본값 `ws://127.0.0.1:18789`). 바인딩이 `EADDRINUSE`로 실패하면 다른 인스턴스가 이미 수신 중임을 나타내는 `GatewayLockError`를 발생시킵니다.

    수정: 다른 인스턴스를 중지하거나, 포트를 비우거나, `openclaw gateway --port <port>`로 실행하세요.

  </Accordion>

  <Accordion title="OpenClaw를 원격 모드(클라이언트가 다른 곳의 Gateway에 연결)로 실행하려면 어떻게 하나요?">
    `gateway.mode: "remote"`를 설정하고 원격 WebSocket URL을 지정하세요. 선택적으로 공유 비밀 원격 자격 증명을 사용할 수 있습니다.

    ```json5
    {
      gateway: {
        mode: "remote",
        remote: {
          url: "ws://gateway.tailnet:18789",
          token: "your-token",
          password: "your-password",
        },
      },
    }
    ```

    참고:

    - `openclaw gateway`는 `gateway.mode`가 `local`일 때만 시작됩니다(또는 override 플래그를 전달한 경우).
    - macOS 앱은 설정 파일을 감시하고 이 값들이 변경되면 실시간으로 모드를 전환합니다.
    - `gateway.remote.token` / `.password`는 클라이언트 측 원격 자격 증명일 뿐이며, 그 자체로 로컬 gateway 인증을 활성화하지 않습니다.

  </Accordion>

  <Accordion title='Control UI가 "unauthorized"라고 하거나 계속 재연결합니다. 이제 어떻게 하나요?'>
    gateway 인증 경로와 UI의 인증 방식이 일치하지 않습니다.

    사실(코드 기준):

    - Control UI는 현재 브라우저 탭 세션과 선택한 gateway URL에 대해 토큰을 `sessionStorage`에 보관하므로, 같은 탭 새로고침은 장기 localStorage 토큰 지속성을 복원하지 않아도 계속 작동합니다.
    - `AUTH_TOKEN_MISMATCH`에서 신뢰된 클라이언트는 gateway가 재시도 힌트(`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)를 반환할 때 캐시된 디바이스 토큰으로 제한된 재시도를 한 번 시도할 수 있습니다.
    - 그 캐시 토큰 재시도는 이제 디바이스 토큰과 함께 저장된 캐시된 승인 범위를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 캐시된 범위를 상속하지 않고 여전히 요청한 범위 집합을 유지합니다.
    - 그 재시도 경로 밖에서는 연결 인증 우선순위가 명시적 공유 토큰/비밀번호, 명시적 `deviceToken`, 저장된 디바이스 토큰, bootstrap 토큰 순입니다.
    - bootstrap 토큰 범위 검사는 역할 접두사를 사용합니다. 내장 bootstrap operator 허용 목록은 operator 요청만 충족합니다. 노드 또는 다른 비operator 역할에는 여전히 해당 역할 접두사 아래의 범위가 필요합니다.

    수정:

    - 가장 빠른 방법: `openclaw dashboard`(대시보드 URL을 출력하고 복사하며, 열기를 시도합니다. headless라면 SSH 힌트를 표시합니다).
    - 아직 토큰이 없다면: `openclaw doctor --generate-gateway-token`.
    - 원격이라면 먼저 터널링하세요: `ssh -N -L 18789:127.0.0.1:18789 user@host` 그런 다음 `http://127.0.0.1:18789/`를 여세요.
    - 공유 비밀 모드: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 설정한 다음, 일치하는 비밀 값을 Control UI 설정에 붙여넣으세요.
    - Tailscale Serve 모드: `gateway.auth.allowTailscale`이 활성화되어 있고, Tailscale ID 헤더를 우회하는 원시 loopback/tailnet URL이 아니라 Serve URL을 열고 있는지 확인하세요.
    - 신뢰된 프록시 모드: 원시 gateway URL이 아니라 설정된 ID 인식 프록시를 통해 들어오고 있는지 확인하세요. 같은 호스트의 loopback 프록시도 `gateway.auth.trustedProxy.allowLoopback = true`가 필요합니다.
    - 한 번의 재시도 후에도 불일치가 계속되면 페어링된 디바이스 토큰을 교체/재승인하세요.
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 해당 rotate 호출이 거부되었다고 하면 두 가지를 확인하세요.
      - 페어링된 디바이스 세션은 `operator.admin`도 가지고 있지 않은 한 **자신의** 디바이스만 rotate할 수 있습니다
      - 명시적 `--scope` 값은 호출자의 현재 operator 범위를 초과할 수 없습니다
    - 여전히 막혔나요? `openclaw status --all`을 실행하고 [Troubleshooting](/ko/gateway/troubleshooting)을 따르세요. 인증 세부 정보는 [Dashboard](/ko/web/dashboard)를 참고하세요.

  </Accordion>

  <Accordion title="gateway.bind를 tailnet으로 설정했지만 바인딩할 수 없고 아무것도 수신하지 않습니다">
    `tailnet` 바인드는 네트워크 인터페이스에서 Tailscale IP(100.64.0.0/10)를 선택합니다. 머신이 Tailscale에 없거나 인터페이스가 내려가 있으면 바인딩할 대상이 없습니다.

    수정:

    - 해당 호스트에서 Tailscale을 시작하여 100.x 주소를 갖게 하거나,
    - `gateway.bind: "loopback"` / `"lan"`으로 전환하세요.

    참고: `tailnet`은 명시적입니다. `auto`는 loopback을 선호합니다. tailnet 전용 바인드를 원할 때는 `gateway.bind: "tailnet"`을 사용하세요.

  </Accordion>

  <Accordion title="같은 호스트에서 여러 Gateway를 실행할 수 있나요?">
    보통은 아닙니다. 하나의 Gateway가 여러 메시징 채널과 에이전트를 실행할 수 있습니다. 중복성(예: 구조용 봇)이나 강한 격리가 필요할 때만 여러 Gateway를 사용하세요.

    가능하지만 격리해야 합니다.

    - `OPENCLAW_CONFIG_PATH`(인스턴스별 설정)
    - `OPENCLAW_STATE_DIR`(인스턴스별 상태)
    - `agents.defaults.workspace`(워크스페이스 격리)
    - `gateway.port`(고유 포트)

    빠른 설정(권장):

    - 인스턴스마다 `openclaw --profile <name> ...`를 사용하세요(`~/.openclaw-<name>` 자동 생성).
    - 각 프로필 설정에서 고유한 `gateway.port`를 설정하세요(또는 수동 실행 시 `--port` 전달).
    - 프로필별 서비스를 설치하세요: `openclaw --profile <name> gateway install`.

    프로필은 서비스 이름에도 접미사를 붙입니다(`ai.openclaw.<profile>`; 레거시 `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    전체 가이드: [Multiple gateways](/ko/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / code 1008은 무슨 뜻인가요?'>
    Gateway는 **WebSocket 서버**이며, 첫 번째 메시지가
    `connect` 프레임이기를 기대합니다. 다른 것을 받으면 **code 1008**(정책 위반)로 연결을 닫습니다.

    흔한 원인:

    - WS 클라이언트 대신 브라우저에서 **HTTP** URL(`http://...`)을 열었습니다.
    - 잘못된 포트나 경로를 사용했습니다.
    - 프록시나 터널이 인증 헤더를 제거했거나 비Gateway 요청을 보냈습니다.

    빠른 수정:

    1. WS URL을 사용하세요: `ws://<host>:18789`(HTTPS라면 `wss://...`).
    2. 일반 브라우저 탭에서 WS 포트를 열지 마세요.
    3. 인증이 켜져 있으면 `connect` 프레임에 토큰/비밀번호를 포함하세요.

    CLI 또는 TUI를 사용한다면 URL은 다음과 같아야 합니다.

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    프로토콜 세부 정보: [Gateway protocol](/ko/gateway/protocol).

  </Accordion>
</AccordionGroup>

## 로깅 및 디버깅

<AccordionGroup>
  <Accordion title="로그는 어디에 있나요?">
    파일 로그(구조화됨):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file`로 안정적인 경로를 설정할 수 있습니다. 파일 로그 레벨은 `logging.level`로 제어됩니다. 콘솔 상세 출력은 `--verbose`와 `logging.consoleLevel`로 제어됩니다.

    가장 빠른 로그 tail:

    ```bash
    openclaw logs --follow
    ```

    서비스/슈퍼바이저 로그(gateway가 launchd/systemd를 통해 실행될 때):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` 및 `gateway.err.log`(기본값: `~/.openclaw/logs/...`; 프로필은 `~/.openclaw-<profile>/logs/...` 사용)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    자세한 내용은 [Troubleshooting](/ko/gateway/troubleshooting)을 참고하세요.

  </Accordion>

  <Accordion title="Gateway 서비스를 시작/중지/재시작하려면 어떻게 하나요?">
    gateway helper를 사용하세요.

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway를 수동으로 실행하는 경우 `openclaw gateway --force`가 포트를 회수할 수 있습니다. [Gateway](/ko/gateway)를 참고하세요.

  </Accordion>

  <Accordion title="Windows에서 터미널을 닫았습니다. OpenClaw를 어떻게 재시작하나요?">
    **두 가지 Windows 설치 모드**가 있습니다.

    **1) WSL2(권장):** Gateway가 Linux 안에서 실행됩니다.

    PowerShell을 열고 WSL에 들어간 다음 재시작하세요.

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    서비스를 설치한 적이 없다면 foreground에서 시작하세요.

    ```bash
    openclaw gateway run
    ```

    **2) 네이티브 Windows(권장하지 않음):** Gateway가 Windows에서 직접 실행됩니다.

    PowerShell을 열고 실행하세요.

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    수동으로 실행하는 경우(서비스 없음) 다음을 사용하세요.

    ```powershell
    openclaw gateway run
    ```

    문서: [Windows (WSL2)](/ko/platforms/windows), [Gateway service runbook](/ko/gateway).

  </Accordion>

  <Accordion title="Gateway는 올라와 있지만 응답이 도착하지 않습니다. 무엇을 확인해야 하나요?">
    빠른 상태 점검부터 시작하세요.

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    흔한 원인:

    - 모델 인증이 **gateway 호스트**에 로드되지 않음(`models status` 확인).
    - 채널 페어링/허용 목록이 응답을 차단함(채널 설정 + 로그 확인).
    - WebChat/Dashboard가 올바른 토큰 없이 열려 있음.

    원격이라면 터널/Tailscale 연결이 올라와 있고
    Gateway WebSocket에 접근 가능한지 확인하세요.

    문서: [Channels](/ko/channels), [Troubleshooting](/ko/gateway/troubleshooting), [Remote access](/ko/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 이제 어떻게 하나요?'>
    이는 보통 UI가 WebSocket 연결을 잃었다는 뜻입니다. 확인할 항목:

    1. Gateway가 실행 중인가요? `openclaw gateway status`
    2. Gateway가 정상인가요? `openclaw status`
    3. UI에 올바른 토큰이 있나요? `openclaw dashboard`
    4. 원격인 경우 터널/Tailscale 링크가 연결되어 있나요?

    그런 다음 로그를 tail하세요.

    ```bash
    openclaw logs --follow
    ```

    문서: [Dashboard](/ko/web/dashboard), [원격 액세스](/ko/gateway/remote), [문제 해결](/ko/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands가 실패합니다. 무엇을 확인해야 하나요?">
    로그와 채널 상태부터 시작하세요.

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    그런 다음 오류를 대조하세요.

    - `BOT_COMMANDS_TOO_MUCH`: Telegram 메뉴에 항목이 너무 많습니다. OpenClaw는 이미 Telegram 제한에 맞게 줄이고 더 적은 명령으로 다시 시도하지만, 일부 메뉴 항목은 여전히 제거해야 합니다. Plugin/스킬/사용자 지정 명령을 줄이거나, 메뉴가 필요하지 않다면 `channels.telegram.commands.native`를 비활성화하세요.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` 또는 유사한 네트워크 오류: VPS를 사용 중이거나 프록시 뒤에 있다면 아웃바운드 HTTPS가 허용되어 있고 `api.telegram.org`에 대한 DNS가 작동하는지 확인하세요.

    Gateway가 원격이면 Gateway 호스트의 로그를 보고 있는지 확인하세요.

    문서: [Telegram](/ko/channels/telegram), [채널 문제 해결](/ko/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI에 출력이 표시되지 않습니다. 무엇을 확인해야 하나요?">
    먼저 Gateway에 연결할 수 있고 에이전트를 실행할 수 있는지 확인하세요.

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI에서 `/status`를 사용해 현재 상태를 확인하세요. 채팅
    채널에서 응답을 기대한다면 전달이 활성화되어 있는지 확인하세요(`/deliver on`).

    문서: [TUI](/ko/web/tui), [슬래시 명령](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway를 완전히 중지한 다음 시작하려면 어떻게 하나요?">
    서비스를 설치했다면:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    이렇게 하면 **관리되는 서비스**(macOS의 launchd, Linux의 systemd)가 중지/시작됩니다.
    Gateway가 데몬으로 백그라운드에서 실행될 때 사용하세요.

    포그라운드에서 실행 중이라면 Ctrl-C로 중지한 다음:

    ```bash
    openclaw gateway run
    ```

    문서: [Gateway 서비스 런북](/ko/gateway).

  </Accordion>

  <Accordion title="간단 설명: openclaw gateway restart와 openclaw gateway">
    - `openclaw gateway restart`: **백그라운드 서비스**(launchd/systemd)를 다시 시작합니다.
    - `openclaw gateway`: 이 터미널 세션에서 Gateway를 **포그라운드**로 실행합니다.

    서비스를 설치했다면 Gateway 명령을 사용하세요. 일회성 포그라운드 실행을
    원할 때는 `openclaw gateway`를 사용하세요.

  </Accordion>

  <Accordion title="무언가 실패할 때 더 많은 세부 정보를 가장 빠르게 얻는 방법">
    더 자세한 콘솔 정보를 얻으려면 `--verbose`로 Gateway를 시작하세요. 그런 다음 로그 파일에서 채널 인증, 모델 라우팅, RPC 오류를 확인하세요.
  </Accordion>
</AccordionGroup>

## 미디어 및 첨부 파일

<AccordionGroup>
  <Accordion title="내 스킬이 이미지/PDF를 생성했지만 아무것도 전송되지 않았습니다">
    에이전트의 아웃바운드 첨부 파일에는 `MEDIA:<path-or-url>` 줄(그 자체로 한 줄)이 포함되어야 합니다. [OpenClaw 어시스턴트 설정](/ko/start/openclaw) 및 [에이전트 전송](/ko/tools/agent-send)을 참조하세요.

    CLI 전송:

    ```bash
    openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
    ```

    또한 다음을 확인하세요.

    - 대상 채널이 아웃바운드 미디어를 지원하고 허용 목록에 의해 차단되지 않았습니다.
    - 파일이 제공자의 크기 제한 이내입니다(이미지는 최대 2048px로 리사이즈됨).
    - `tools.fs.workspaceOnly=true`는 로컬 경로 전송을 워크스페이스, 임시/미디어 저장소, 샌드박스 검증 파일로 제한합니다.
    - `tools.fs.workspaceOnly=false`는 에이전트가 이미 읽을 수 있는 호스트 로컬 파일을 `MEDIA:`로 전송할 수 있게 하지만, 미디어와 안전한 문서 유형(이미지, 오디오, 비디오, PDF, Office 문서)에만 해당합니다. 일반 텍스트와 비밀처럼 보이는 파일은 여전히 차단됩니다.

    [이미지](/ko/nodes/images)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 보안 및 액세스 제어

<AccordionGroup>
  <Accordion title="OpenClaw를 인바운드 DM에 노출해도 안전한가요?">
    인바운드 DM을 신뢰할 수 없는 입력으로 취급하세요. 기본값은 위험을 줄이도록 설계되어 있습니다.

    - DM 가능 채널의 기본 동작은 **페어링**입니다.
      - 알 수 없는 발신자는 페어링 코드를 받으며, 봇은 해당 메시지를 처리하지 않습니다.
      - 승인: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 대기 중인 요청은 **채널당 3개**로 제한됩니다. 코드가 도착하지 않았다면 `openclaw pairing list --channel <channel> [--account <id>]`를 확인하세요.
    - DM을 공개적으로 열려면 명시적인 옵트인이 필요합니다(`dmPolicy: "open"` 및 허용 목록 `"*"`).

    위험한 DM 정책을 표시하려면 `openclaw doctor`를 실행하세요.

  </Accordion>

  <Accordion title="프롬프트 인젝션은 공개 봇에서만 문제가 되나요?">
    아닙니다. 프롬프트 인젝션은 누가 봇에 DM을 보낼 수 있는지가 아니라 **신뢰할 수 없는 콘텐츠**에 관한 문제입니다.
    어시스턴트가 외부 콘텐츠(웹 검색/가져오기, 브라우저 페이지, 이메일,
    문서, 첨부 파일, 붙여넣은 로그)를 읽는다면, 해당 콘텐츠에는
    모델을 가로채려는 지시가 포함될 수 있습니다. 이는 **발신자가 본인뿐인 경우에도** 발생할 수 있습니다.

    도구가 활성화되어 있을 때 위험이 가장 큽니다. 모델이 속아서 컨텍스트를
    유출하거나 사용자를 대신해 도구를 호출할 수 있습니다. 영향 범위를 줄이는 방법:

    - 신뢰할 수 없는 콘텐츠를 요약하려면 읽기 전용 또는 도구 비활성화 "reader" 에이전트를 사용하세요
    - 도구 활성화 에이전트에서는 `web_search` / `web_fetch` / `browser`를 끄세요
    - 디코딩된 파일/문서 텍스트도 신뢰할 수 없는 것으로 취급하세요. OpenResponses
      `input_file`과 미디어 첨부 파일 추출은 모두 원시 파일 텍스트를 전달하는 대신
      추출된 텍스트를 명시적인 외부 콘텐츠 경계 마커로 감쌉니다
    - 샌드박싱과 엄격한 도구 허용 목록을 사용하세요

    세부 정보: [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="봇에 자체 이메일, GitHub 계정 또는 전화번호가 있어야 하나요?">
    대부분의 설정에서는 그렇습니다. 별도의 계정과 전화번호로 봇을 격리하면
    문제가 발생했을 때 영향 범위가 줄어듭니다. 또한 개인 계정에 영향을 주지 않고
    자격 증명을 순환하거나 액세스를 철회하기가 더 쉬워집니다.

    작게 시작하세요. 실제로 필요한 도구와 계정에만 액세스를 부여하고, 필요하면
    나중에 확장하세요.

    문서: [보안](/ko/gateway/security), [페어링](/ko/channels/pairing).

  </Accordion>

  <Accordion title="내 문자 메시지에 대한 자율성을 부여할 수 있으며, 안전한가요?">
    개인 메시지에 대한 완전한 자율성은 권장하지 **않습니다**. 가장 안전한 패턴은 다음과 같습니다.

    - DM을 **페어링 모드** 또는 엄격한 허용 목록으로 유지하세요.
    - 대신 메시지를 보내게 하려면 **별도 번호 또는 계정**을 사용하세요.
    - 초안을 작성하게 한 다음 **전송 전에 승인**하세요.

    실험하려면 전용 계정에서 수행하고 격리 상태를 유지하세요. [보안](/ko/gateway/security)을 참조하세요.

  </Accordion>

  <Accordion title="개인 어시스턴트 작업에 더 저렴한 모델을 사용할 수 있나요?">
    예, 에이전트가 채팅 전용이고 입력을 신뢰할 수 **있다면** 가능합니다. 더 작은 등급은
    지시 가로채기에 더 취약하므로, 도구 활성화 에이전트나 신뢰할 수 없는 콘텐츠를
    읽는 경우에는 피하세요. 더 작은 모델을 반드시 사용해야 한다면 도구를 잠그고
    샌드박스 안에서 실행하세요. [보안](/ko/gateway/security)을 참조하세요.
  </Accordion>

  <Accordion title="Telegram에서 /start를 실행했지만 페어링 코드를 받지 못했습니다">
    페어링 코드는 알 수 없는 발신자가 봇에 메시지를 보내고
    `dmPolicy: "pairing"`이 활성화된 경우에만 전송됩니다. `/start` 자체는 코드를 생성하지 않습니다.

    대기 중인 요청 확인:

    ```bash
    openclaw pairing list telegram
    ```

    즉시 액세스하려면 발신자 ID를 허용 목록에 추가하거나 해당 계정에 대해 `dmPolicy: "open"`을 설정하세요.

  </Accordion>

  <Accordion title="WhatsApp: 내 연락처에 메시지를 보내나요? 페어링은 어떻게 작동하나요?">
    아니요. 기본 WhatsApp DM 정책은 **페어링**입니다. 알 수 없는 발신자는 페어링 코드만 받으며 메시지는 **처리되지 않습니다**. OpenClaw는 수신한 채팅이나 사용자가 명시적으로 트리거한 전송에만 응답합니다.

    페어링 승인:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    대기 중인 요청 나열:

    ```bash
    openclaw pairing list whatsapp
    ```

    마법사의 전화번호 프롬프트: 자신의 DM이 허용되도록 **허용 목록/소유자**를 설정하는 데 사용됩니다. 자동 전송에는 사용되지 않습니다. 개인 WhatsApp 번호에서 실행한다면 해당 번호를 사용하고 `channels.whatsapp.selfChatMode`를 활성화하세요.

  </Accordion>
</AccordionGroup>

## 채팅 명령, 작업 중단 및 "멈추지 않음"

<AccordionGroup>
  <Accordion title="내부 시스템 메시지가 채팅에 표시되지 않게 하려면 어떻게 하나요?">
    대부분의 내부 또는 도구 메시지는 해당 세션에서 **verbose**, **trace** 또는 **reasoning**이 활성화된 경우에만 표시됩니다.

    메시지가 보이는 채팅에서 수정하세요.

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    여전히 시끄럽다면 Control UI에서 세션 설정을 확인하고 verbose를
    **inherit**으로 설정하세요. 또한 설정에서 `verboseDefault`가 `on`으로 설정된 봇 프로필을 사용하고 있지 않은지 확인하세요.

    문서: [사고 및 verbose](/ko/tools/thinking), [보안](/ko/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="실행 중인 작업을 중지/취소하려면 어떻게 하나요?">
    다음 중 하나를 **독립된 메시지로** 보내세요(슬래시 없음).

    ```
    stop
    stop action
    stop current action
    stop run
    stop current run
    stop agent
    stop the agent
    stop openclaw
    openclaw stop
    stop don't do anything
    stop do not do anything
    stop doing anything
    please stop
    stop please
    abort
    esc
    wait
    exit
    interrupt
    ```

    이것들은 중단 트리거입니다(슬래시 명령이 아님).

    백그라운드 프로세스(exec 도구에서 시작된 것)의 경우, 에이전트에게 다음을 실행하도록 요청할 수 있습니다.

    ```
    process action:kill sessionId:XXX
    ```

    슬래시 명령 개요: [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

    대부분의 명령은 `/`로 시작하는 **독립된** 메시지로 전송해야 하지만, 일부 바로 가기(예: `/status`)는 허용 목록에 있는 발신자에게 인라인으로도 작동합니다.

  </Accordion>

  <Accordion title='Telegram에서 Discord 메시지를 보내려면 어떻게 하나요?("크로스 컨텍스트 메시징 거부됨")'>
    OpenClaw는 기본적으로 **크로스 제공자** 메시징을 차단합니다. 도구 호출이
    Telegram에 바인딩되어 있으면 명시적으로 허용하지 않는 한 Discord로 전송되지 않습니다.

    에이전트에 크로스 제공자 메시징 활성화:

    ```json5
    {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    }
    ```

    설정을 편집한 후 Gateway를 다시 시작하세요.

  </Accordion>

  <Accordion title='봇이 빠르게 이어지는 메시지를 "무시"하는 것처럼 느껴지는 이유는 무엇인가요?'>
    큐 모드는 새 메시지가 진행 중인 실행과 상호작용하는 방식을 제어합니다. 모드를 변경하려면 `/queue`를 사용하세요.

    - `steer` - 현재 실행의 다음 모델 경계까지 대기 중인 모든 조향을 큐에 넣음
    - `queue` - 기존 방식의 한 번에 하나씩 조향
    - `followup` - 메시지를 한 번에 하나씩 실행
    - `collect` - 메시지를 배치로 묶고 한 번만 응답
    - `steer-backlog` - 지금 조향한 다음 백로그 처리
    - `interrupt` - 현재 실행을 중단하고 새로 시작

    기본 모드는 `steer`입니다. 후속 모드에는 `debounce:0.5s cap:25 drop:summarize` 같은 옵션을 추가할 수 있습니다. [명령 큐](/ko/concepts/queue) 및 [조향 큐](/ko/concepts/queue-steering)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 기타

<AccordionGroup>
  <Accordion title='API 키를 사용할 때 Anthropic의 기본 모델은 무엇인가요?'>
    OpenClaw에서는 자격 증명과 모델 선택이 분리되어 있습니다. `ANTHROPIC_API_KEY`를 설정하거나 Anthropic API 키를 인증 프로필에 저장하면 인증이 활성화되지만, 실제 기본 모델은 `agents.defaults.model.primary`에 구성한 값입니다. 예를 들어 `anthropic/claude-sonnet-4-6` 또는 `anthropic/claude-opus-4-6`입니다. `No credentials found for profile "anthropic:default"`가 표시되면 실행 중인 에이전트의 예상 `auth-profiles.json`에서 Gateway가 Anthropic 자격 증명을 찾지 못했다는 뜻입니다.
  </Accordion>
</AccordionGroup>

---

아직 해결되지 않았나요? [Discord](https://discord.com/invite/clawd)에서 문의하거나 [GitHub 토론](https://github.com/openclaw/openclaw/discussions)을 열어 주세요.

## 관련 항목

- [첫 실행 FAQ](/ko/help/faq-first-run) — 설치, 온보딩, 인증, 구독, 초기 오류
- [모델 FAQ](/ko/help/faq-models) — 모델 선택, 장애 조치, 인증 프로필
- [문제 해결](/ko/help/troubleshooting) — 증상 우선 분류
