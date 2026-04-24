---
read_when:
    - 일반적인 설정, 설치, 온보딩 또는 런타임 지원 질문에 답변합니다
    - 더 깊은 디버깅에 들어가기 전에 사용자가 보고한 문제를 분류합니다
summary: OpenClaw 설정, 구성 및 사용에 관한 자주 묻는 질문
title: 자주 묻는 질문
x-i18n:
    generated_at: "2026-04-24T08:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0ae635d7ade265e3e79d1f5489ae23034a341843bd784f68a985b18bee5bdf6f
    source_path: help/faq.md
    workflow: 15
---

실제 환경(로컬 개발, VPS, multi-agent, OAuth/API 키, 모델 장애 조치)을 위한 빠른 답변과 더 깊은 문제 해결. 런타임 진단은 [문제 해결](/ko/gateway/troubleshooting)을 참조하세요. 전체 구성 참조는 [구성](/ko/gateway/configuration)을 참조하세요.

## 문제가 생겼을 때 처음 60초

1. **빠른 상태 확인(첫 번째 확인)**

   ```bash
   openclaw status
   ```

   빠른 로컬 요약: OS + 업데이트, gateway/service 연결 가능 여부, agents/sessions, provider 구성 + 런타임 문제(gateway에 연결 가능한 경우).

2. **공유 가능한 보고서(안전하게 공유 가능)**

   ```bash
   openclaw status --all
   ```

   읽기 전용 진단과 로그 tail 포함(토큰은 마스킹됨).

3. **데몬 + 포트 상태**

   ```bash
   openclaw gateway status
   ```

   supervisor 런타임과 RPC 연결 가능 여부, probe 대상 URL, 서비스가 사용했을 가능성이 높은 구성을 표시합니다.

4. **심층 probe**

   ```bash
   openclaw status --deep
   ```

   지원되는 경우 채널 probe를 포함한 실시간 gateway 상태 probe를 실행합니다
   (연결 가능한 gateway 필요). [상태](/ko/gateway/health)를 참조하세요.

5. **최신 로그 tail**

   ```bash
   openclaw logs --follow
   ```

   RPC가 중단된 경우 다음으로 대체합니다:

   ```bash
   tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
   ```

   파일 로그는 서비스 로그와 별개입니다. [로깅](/ko/logging) 및 [문제 해결](/ko/gateway/troubleshooting)을 참조하세요.

6. **doctor 실행(복구)**

   ```bash
   openclaw doctor
   ```

   구성/상태를 복구 또는 마이그레이션하고 상태 점검을 실행합니다. [Doctor](/ko/gateway/doctor)를 참조하세요.

7. **Gateway 스냅샷**

   ```bash
   openclaw health --json
   openclaw health --verbose   # 오류 시 대상 URL + 구성 경로를 표시
   ```

   실행 중인 gateway에 전체 스냅샷을 요청합니다(WS 전용). [상태](/ko/gateway/health)를 참조하세요.

## 빠른 시작 및 첫 실행 설정

첫 실행 Q&A — 설치, 온보딩, 인증 경로, 구독, 초기 실패 —
는 [첫 실행 FAQ](/ko/help/faq-first-run)에 있습니다.

## OpenClaw란 무엇인가요?

<AccordionGroup>
  <Accordion title="한 문단으로 설명하는 OpenClaw란?">
    OpenClaw는 사용자의 장치에서 직접 실행하는 개인용 AI 어시스턴트입니다. 이미 사용 중인 메시징 인터페이스(WhatsApp, Telegram, Slack, Mattermost, Discord, Google Chat, Signal, iMessage, WebChat, 그리고 QQ Bot 같은 번들 채널 plugin)에서 응답할 수 있으며, 지원되는 플랫폼에서는 음성 + 실시간 Canvas도 사용할 수 있습니다. **Gateway**는 항상 켜져 있는 제어 플레인이며, 어시스턴트가 실제 제품입니다.
  </Accordion>

  <Accordion title="핵심 가치">
    OpenClaw는 "그저 Claude 래퍼"가 아닙니다. 이것은 **로컬 우선 제어 플레인**으로,
    이미 사용 중인 채팅 앱에서 접근할 수 있는 유능한 어시스턴트를
    **사용자 소유의 하드웨어**에서 실행할 수 있게 해주며,
    상태를 유지하는 세션, 메모리, 도구를 제공하면서도
    워크플로 제어권을 호스팅 SaaS에 넘기지 않도록 해줍니다.

    주요 특징:

    - **당신의 장치, 당신의 데이터:** Gateway를 원하는 곳(Mac, Linux, VPS)에서 실행하고
      워크스페이스 + 세션 기록을 로컬에 유지할 수 있습니다.
    - **웹 샌드박스가 아닌 실제 채널:** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 등,
      그리고 지원 플랫폼에서 모바일 음성 및 Canvas.
    - **모델에 종속되지 않음:** Anthropic, OpenAI, MiniMax, OpenRouter 등을 사용하고,
      agent별 라우팅과 장애 조치를 설정할 수 있습니다.
    - **로컬 전용 옵션:** 원하면 로컬 모델을 실행해 **모든 데이터를 장치에만 남길 수 있습니다**.
    - **Multi-agent 라우팅:** 채널, 계정 또는 작업별로 별도의 agent를 두고,
      각각 자체 워크스페이스와 기본값을 가질 수 있습니다.
    - **오픈 소스 및 확장 가능:** 벤더 종속 없이 직접 살펴보고, 확장하고, 셀프 호스팅할 수 있습니다.

    문서: [Gateway](/ko/gateway), [채널](/ko/channels), [Multi-agent](/ko/concepts/multi-agent),
    [메모리](/ko/concepts/memory).

  </Accordion>

  <Accordion title="방금 설정했어요. 무엇부터 하면 좋을까요?">
    시작하기 좋은 프로젝트:

    - 웹사이트 만들기(WordPress, Shopify, 또는 단순한 정적 사이트).
    - 모바일 앱 프로토타입 만들기(개요, 화면, API 계획).
    - 파일과 폴더 정리하기(정리, 이름 지정, 태깅).
    - Gmail을 연결하고 요약 또는 후속 작업 자동화하기.

    큰 작업도 처리할 수 있지만, 단계를 나누고
    sub agent를 사용해 병렬로 작업할 때 가장 잘 작동합니다.

  </Accordion>

  <Accordion title="OpenClaw의 일상적인 상위 5가지 사용 사례는 무엇인가요?">
    일상에서 유용한 활용 방식은 보통 다음과 같습니다:

    - **개인 브리핑:** 받은편지함, 일정, 관심 있는 뉴스의 요약.
    - **조사 및 초안 작성:** 빠른 조사, 요약, 이메일이나 문서의 초안 작성.
    - **알림 및 후속 작업:** Cron 또는 Heartbeat 기반 알림과 체크리스트.
    - **브라우저 자동화:** 양식 작성, 데이터 수집, 반복적인 웹 작업 수행.
    - **기기 간 조율:** 휴대폰에서 작업을 보내고, Gateway가 서버에서 실행한 뒤, 결과를 채팅으로 다시 받기.

  </Accordion>

  <Accordion title="OpenClaw가 SaaS의 리드 생성, 아웃리치, 광고, 블로그 작업에 도움이 되나요?">
    **조사, 적격성 판단, 초안 작성**에는 도움이 됩니다. 사이트를 스캔하고, 후보 목록을 만들고,
    잠재 고객을 요약하고, 아웃리치나 광고 문안의 초안을 작성할 수 있습니다.

    **아웃리치나 광고 집행**의 경우에는 사람을 검토 과정에 포함하세요. 스팸을 피하고, 현지 법률과
    플랫폼 정책을 준수하며, 전송 전에 모든 내용을 검토하세요. 가장 안전한 방식은
    OpenClaw가 초안을 만들고 사용자가 승인하는 것입니다.

    문서: [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="웹 개발에서 Claude Code 대비 장점은 무엇인가요?">
    OpenClaw는 IDE 대체제가 아니라 **개인용 어시스턴트**이자 조율 계층입니다.
    저장소 내부에서 가장 빠른 직접 코딩 루프가 필요하다면 Claude Code나 Codex를 사용하세요.
    지속되는 메모리, 기기 간 접근, 도구 오케스트레이션이 필요할 때 OpenClaw를 사용하세요.

    장점:

    - 세션 간 **지속되는 메모리 + 워크스페이스**
    - **멀티플랫폼 접근**(WhatsApp, Telegram, TUI, WebChat)
    - **도구 오케스트레이션**(브라우저, 파일, 일정 관리, hooks)
    - **항상 켜진 Gateway**(VPS에서 실행하고 어디서나 상호작용)
    - 로컬 브라우저/화면/카메라/실행을 위한 **Nodes**

    쇼케이스: [https://openclaw.ai/showcase](https://openclaw.ai/showcase)

  </Accordion>
</AccordionGroup>

## Skills 및 자동화

<AccordionGroup>
  <Accordion title="저장소를 더럽히지 않고 skills를 사용자 지정하려면 어떻게 하나요?">
    저장소 사본을 편집하는 대신 관리형 overrides를 사용하세요. 변경 사항은 `~/.openclaw/skills/<name>/SKILL.md`에 넣거나(`~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 폴더를 추가할 수도 있음) 관리하세요. 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 → `skills.load.extraDirs` 순서이므로, 관리형 overrides는 git을 건드리지 않고도 번들 skills보다 우선 적용됩니다. skill을 전역으로 설치하되 일부 agent에만 보이게 하려면, 공유 사본은 `~/.openclaw/skills`에 두고 `agents.defaults.skills`와 `agents.list[].skills`로 가시성을 제어하세요. 업스트림에 반영할 가치가 있는 수정만 저장소에 두고 PR로 보내야 합니다.
  </Accordion>

  <Accordion title="사용자 지정 폴더에서 skills를 로드할 수 있나요?">
    예. `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 추가 디렉터리를 지정할 수 있습니다(가장 낮은 우선순위). 기본 우선순위는 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 번들 → `skills.load.extraDirs`입니다. `clawhub`는 기본적으로 `./skills`에 설치하며, OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 처리합니다. skill이 특정 agent에만 보여야 한다면 `agents.defaults.skills` 또는 `agents.list[].skills`와 함께 사용하세요.
  </Accordion>

  <Accordion title="작업마다 다른 모델을 사용하려면 어떻게 하나요?">
    현재 지원되는 패턴은 다음과 같습니다:

    - **Cron 작업**: 격리된 작업마다 `model` override를 설정할 수 있습니다.
    - **Sub-agents**: 다른 기본 모델을 가진 별도 agent로 작업을 라우팅합니다.
    - **즉시 전환**: `/model`을 사용해 현재 세션 모델을 언제든 전환합니다.

    [Cron 작업](/ko/automation/cron-jobs), [Multi-Agent Routing](/ko/concepts/multi-agent), [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

  </Accordion>

  <Accordion title="무거운 작업을 하는 동안 봇이 멈춥니다. 어떻게 오프로딩하나요?">
    길거나 병렬인 작업에는 **sub-agents**를 사용하세요. Sub-agent는 자체 세션에서 실행되며,
    요약을 반환하고, 메인 채팅이 응답 상태를 유지하게 해줍니다.

    봇에게 "이 작업을 위해 sub-agent를 생성해"라고 요청하거나 `/subagents`를 사용하세요.
    채팅에서 `/status`를 사용하면 Gateway가 지금 무엇을 하고 있는지(그리고 바쁜지 여부)를 볼 수 있습니다.

    토큰 팁: 긴 작업과 sub-agent는 모두 토큰을 소비합니다. 비용이 걱정된다면
    `agents.defaults.subagents.model`을 통해 sub-agent에 더 저렴한 모델을 설정하세요.

    문서: [Sub-agents](/ko/tools/subagents), [백그라운드 작업](/ko/automation/tasks).

  </Accordion>

  <Accordion title="Discord에서 스레드에 바인딩된 subagent 세션은 어떻게 작동하나요?">
    스레드 바인딩을 사용하세요. Discord 스레드를 subagent 또는 세션 대상에 바인딩하면, 그 스레드의 후속 메시지는 해당 바인딩된 세션에 유지됩니다.

    기본 흐름:

    - `sessions_spawn`을 `thread: true`와 함께 사용해 생성합니다(지속적인 후속 처리를 위해 선택적으로 `mode: "session"` 사용 가능).
    - 또는 `/focus <target>`으로 수동 바인딩합니다.
    - `/agents`를 사용해 바인딩 상태를 확인합니다.
    - `/session idle <duration|off>` 및 `/session max-age <duration|off>`를 사용해 자동 unfocus를 제어합니다.
    - `/unfocus`를 사용해 스레드를 분리합니다.

    필요한 구성:

    - 전역 기본값: `session.threadBindings.enabled`, `session.threadBindings.idleHours`, `session.threadBindings.maxAgeHours`.
    - Discord overrides: `channels.discord.threadBindings.enabled`, `channels.discord.threadBindings.idleHours`, `channels.discord.threadBindings.maxAgeHours`.
    - 생성 시 자동 바인딩: `channels.discord.threadBindings.spawnSubagentSessions: true`를 설정합니다.

    문서: [Sub-agents](/ko/tools/subagents), [Discord](/ko/channels/discord), [구성 참조](/ko/gateway/configuration-reference), [슬래시 명령](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="subagent가 완료됐지만 완료 업데이트가 잘못된 곳으로 전송되었거나 아예 게시되지 않았습니다. 무엇을 확인해야 하나요?">
    먼저 해석된 요청자 경로를 확인하세요:

    - 완료 모드 subagent 전달은 바인딩된 스레드나 대화 경로가 있으면 이를 우선합니다.
    - 완료 출처에 채널만 있으면, OpenClaw는 요청자 세션의 저장된 경로(`lastChannel` / `lastTo` / `lastAccountId`)로 대체하여 직접 전달이 계속 가능하도록 합니다.
    - 바인딩된 경로도 없고 사용 가능한 저장 경로도 없으면, 직접 전달이 실패할 수 있으며 결과는 채팅에 즉시 게시되는 대신 대기열 세션 전달로 대체됩니다.
    - 잘못되었거나 오래된 대상은 여전히 대기열 대체 또는 최종 전달 실패를 유발할 수 있습니다.
    - 자식의 마지막으로 보이는 어시스턴트 응답이 정확히 무음 토큰 `NO_REPLY` / `no_reply`이거나 정확히 `ANNOUNCE_SKIP`이면, OpenClaw는 이전의 오래된 진행 상황을 게시하는 대신 의도적으로 알림을 억제합니다.
    - 자식이 도구 호출만 수행한 뒤 시간 초과되면, 알림은 원시 도구 출력을 재생하는 대신 이를 짧은 부분 진행 요약으로 축약할 수 있습니다.

    디버그:

    ```bash
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Sub-agents](/ko/tools/subagents), [백그라운드 작업](/ko/automation/tasks), [세션 도구](/ko/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron이나 알림이 실행되지 않습니다. 무엇을 확인해야 하나요?">
    Cron은 Gateway 프로세스 내부에서 실행됩니다. Gateway가 계속 실행 중이 아니라면,
    예약된 작업은 실행되지 않습니다.

    체크리스트:

    - cron이 활성화되어 있는지(`cron.enabled`)와 `OPENCLAW_SKIP_CRON`이 설정되어 있지 않은지 확인합니다.
    - Gateway가 24/7 실행 중인지 확인합니다(절전/재시작 없음).
    - 작업의 시간대 설정(`--tz` 대 호스트 시간대)을 확인합니다.

    디버그:

    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    문서: [Cron 작업](/ko/automation/cron-jobs), [자동화 및 작업](/ko/automation).

  </Accordion>

  <Accordion title="Cron이 실행됐지만 채널로 아무것도 전송되지 않았습니다. 왜 그런가요?">
    먼저 전달 모드를 확인하세요:

    - `--no-deliver` / `delivery.mode: "none"`이면 runner fallback 전송은 예상되지 않습니다.
    - announce 대상(`channel` / `to`)이 없거나 잘못되면 runner가 아웃바운드 전달을 건너뜁니다.
    - 채널 인증 실패(`unauthorized`, `Forbidden`)는 runner가 전달을 시도했지만 자격 증명 때문에 차단되었음을 의미합니다.
    - 무음 격리 결과(`NO_REPLY` / `no_reply`만 있는 경우)는 의도적으로 전달 불가로 처리되므로, runner도 대기열 fallback 전달을 억제합니다.

    격리된 Cron 작업의 경우, 채팅 경로를 사용할 수 있으면 agent가 `message`
    도구를 통해 직접 전송할 수 있습니다. `--announce`는 agent가 아직 직접 보내지 않은
    최종 텍스트에 대한 runner fallback 경로만 제어합니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron 작업](/ko/automation/cron-jobs), [백그라운드 작업](/ko/automation/tasks).

  </Accordion>

  <Accordion title="격리된 Cron 실행이 왜 모델을 전환하거나 한 번 재시도했나요?">
    이는 보통 중복 스케줄링이 아니라 실시간 모델 전환 경로입니다.

    격리된 Cron은 활성 실행이 `LiveSessionModelSwitchError`를 발생시킬 때
    런타임 모델 핸드오프를 유지하고 재시도할 수 있습니다. 재시도는 전환된
    provider/model을 유지하며, 전환에 새 auth profile override가 포함되어 있으면
    Cron은 재시도 전에 그것도 유지합니다.

    관련 선택 규칙:

    - 해당되는 경우 Gmail hook 모델 override가 먼저 우선합니다.
    - 그다음 작업별 `model`.
    - 그다음 저장된 cron-session 모델 override.
    - 그다음 일반 agent/default 모델 선택.

    재시도 루프는 제한되어 있습니다. 초기 시도 후 모델 전환 재시도 2회까지 수행한 뒤,
    Cron은 무한 반복하지 않고 중단합니다.

    디버그:

    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <runId-or-sessionKey>
    ```

    문서: [Cron 작업](/ko/automation/cron-jobs), [cron CLI](/ko/cli/cron).

  </Accordion>

  <Accordion title="Linux에서 skills를 설치하려면 어떻게 하나요?">
    기본 제공 `openclaw skills` 명령을 사용하거나 워크스페이스에 skills를 넣으세요. macOS Skills UI는 Linux에서 사용할 수 없습니다.
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

    기본 제공 `openclaw skills install`은 활성 워크스페이스의 `skills/`
    디렉터리에 기록합니다. 별도의 `clawhub` CLI는 직접 만든 skills를 게시하거나
    동기화하려는 경우에만 설치하세요. agent 간 공유 설치가 필요하면 skill을
    `~/.openclaw/skills` 아래에 두고, 어떤 agent가 볼 수 있는지 제한하려면
    `agents.defaults.skills` 또는 `agents.list[].skills`를 사용하세요.

  </Accordion>

  <Accordion title="OpenClaw가 예약된 작업이나 백그라운드에서 계속 실행되는 작업을 처리할 수 있나요?">
    예. Gateway 스케줄러를 사용하세요:

    - **Cron 작업**: 예약되었거나 반복되는 작업용(재시작 후에도 유지됨).
    - **Heartbeat**: "메인 세션"의 주기적 확인용.
    - **격리된 작업**: 요약을 게시하거나 채팅으로 전달하는 자율 agent용.

    문서: [Cron 작업](/ko/automation/cron-jobs), [자동화 및 작업](/ko/automation),
    [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux에서 Apple macOS 전용 skills를 실행할 수 있나요?">
    직접적으로는 불가능합니다. macOS skill은 `metadata.openclaw.os`와 필요한 바이너리로 제어되며, skill은 **Gateway 호스트**에서 사용할 수 있을 때만 시스템 프롬프트에 나타납니다. Linux에서는 `darwin` 전용 skills(`apple-notes`, `apple-reminders`, `things-mac` 등)가 해당 제어를 override하지 않는 한 로드되지 않습니다.

    지원되는 패턴은 세 가지입니다:

    **옵션 A - Mac에서 Gateway 실행(가장 간단함).**
    macOS 바이너리가 있는 곳에서 Gateway를 실행한 뒤, Linux에서는 [원격 모드](#gateway-ports-already-running-and-remote-mode)나 Tailscale을 통해 연결하세요. Gateway 호스트가 macOS이므로 skills가 정상적으로 로드됩니다.

    **옵션 B - macOS Node 사용(SSH 없음).**
    Linux에서 Gateway를 실행하고 macOS Node(메뉴 막대 앱)를 페어링한 다음, Mac에서 **Node Run Commands**를 "Always Ask" 또는 "Always Allow"로 설정하세요. 필요한 바이너리가 Node에 있으면 OpenClaw는 macOS 전용 skills를 사용 가능한 것으로 처리할 수 있습니다. agent는 `nodes` 도구를 통해 해당 skills를 실행합니다. "Always Ask"를 선택한 경우 프롬프트에서 "Always Allow"를 승인하면 해당 명령이 허용 목록에 추가됩니다.

    **옵션 C - SSH를 통해 macOS 바이너리 프록시(고급).**
    Gateway는 Linux에 유지하되, 필요한 CLI 바이너리가 Mac에서 실행되는 SSH 래퍼로 해석되도록 하세요. 그런 다음 skill이 계속 사용 가능하도록 Linux를 허용하도록 override하세요.

    1. 바이너리용 SSH 래퍼를 만듭니다(예: Apple Notes용 `memo`):

       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```

    2. Linux 호스트의 `PATH`에 래퍼를 추가합니다(예: `~/bin/memo`).
    3. Linux를 허용하도록 skill 메타데이터를 override합니다(워크스페이스 또는 `~/.openclaw/skills`):

       ```markdown
       ---
       name: apple-notes
       description: macOS의 memo CLI를 통해 Apple Notes를 관리합니다.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```

    4. skills 스냅샷이 새로 고쳐지도록 새 세션을 시작합니다.

  </Accordion>

  <Accordion title="Notion 또는 HeyGen 통합이 있나요?">
    현재 기본 제공되지는 않습니다.

    옵션:

    - **사용자 지정 skill / Plugin:** 안정적인 API 접근에 가장 적합합니다(Notion과 HeyGen 모두 API 제공).
    - **브라우저 자동화:** 코드 없이도 가능하지만 더 느리고 더 취약합니다.

    클라이언트별 컨텍스트(에이전시 워크플로 등)를 유지하려면, 간단한 패턴은 다음과 같습니다:

    - 클라이언트당 하나의 Notion 페이지(컨텍스트 + 선호도 + 현재 작업).
    - 세션 시작 시 agent에게 해당 페이지를 가져오라고 요청합니다.

    기본 제공 통합이 필요하다면 기능 요청을 열거나 해당 API를 대상으로 하는 skill을
    직접 만드세요.

    skills 설치:

    ```bash
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    기본 설치는 활성 워크스페이스의 `skills/` 디렉터리에 저장됩니다. agent 간 공유 skills의 경우 `~/.openclaw/skills/<name>/SKILL.md`에 두세요. 공유 설치가 일부 agent에만 보여야 한다면 `agents.defaults.skills` 또는 `agents.list[].skills`를 구성하세요. 일부 skills는 Homebrew로 설치된 바이너리를 기대합니다. Linux에서는 이는 Linuxbrew를 의미합니다(위의 Homebrew Linux FAQ 항목 참조). [Skills](/ko/tools/skills), [Skills 구성](/ko/tools/skills-config), [ClawHub](/ko/tools/clawhub)를 참조하세요.

  </Accordion>

  <Accordion title="기존에 로그인된 Chrome을 OpenClaw에서 사용하려면 어떻게 하나요?">
    Chrome DevTools MCP를 통해 연결되는 기본 제공 `user` 브라우저 프로필을 사용하세요:

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    사용자 지정 이름을 원하면 명시적인 MCP 프로필을 만드세요:

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    이 경로는 로컬 호스트 브라우저나 연결된 브라우저 Node를 사용할 수 있습니다. Gateway가 다른 곳에서 실행된다면 브라우저 머신에서 node host를 실행하거나 원격 CDP를 대신 사용하세요.

    `existing-session` / `user`의 현재 제한 사항:

    - 작업은 CSS 선택자 기반이 아니라 ref 기반입니다
    - 업로드는 `ref` / `inputRef`가 필요하며 현재는 한 번에 하나의 파일만 지원합니다
    - `responsebody`, PDF 내보내기, 다운로드 가로채기, 일괄 작업은 여전히 관리형 브라우저 또는 원시 CDP 프로필이 필요합니다

  </Accordion>
</AccordionGroup>

## 샌드박싱 및 메모리

<AccordionGroup>
  <Accordion title="전용 샌드박싱 문서가 있나요?">
    예. [샌드박싱](/ko/gateway/sandboxing)을 참조하세요. Docker별 설정(전체 gateway를 Docker에서 실행하거나 샌드박스 이미지를 사용하는 경우)은 [Docker](/ko/install/docker)를 참조하세요.
  </Accordion>

  <Accordion title="Docker가 제한적으로 느껴집니다. 전체 기능을 활성화하려면 어떻게 해야 하나요?">
    기본 이미지는 보안 우선이며 `node` 사용자로 실행되므로 시스템 패키지, Homebrew, 번들 브라우저를 포함하지 않습니다. 더 완전한 설정을 위해서는:

    - `OPENCLAW_HOME_VOLUME`으로 `/home/node`를 유지해 캐시가 지속되게 합니다.
    - `OPENCLAW_DOCKER_APT_PACKAGES`로 시스템 의존성을 이미지에 포함합니다.
    - 번들 CLI를 통해 Playwright 브라우저를 설치합니다:
      `node /app/node_modules/playwright-core/cli.js install chromium`
    - `PLAYWRIGHT_BROWSERS_PATH`를 설정하고 해당 경로가 유지되도록 합니다.

    문서: [Docker](/ko/install/docker), [브라우저](/ko/tools/browser).

  </Accordion>

  <Accordion title="한 agent로 DM은 개인용으로 유지하고 그룹은 공개/샌드박스 처리할 수 있나요?">
    예. 비공개 트래픽이 **DM**이고 공개 트래픽이 **그룹**이라면 가능합니다.

    `agents.defaults.sandbox.mode: "non-main"`을 사용하면 그룹/채널 세션(non-main 키)은 구성된 샌드박스 백엔드에서 실행되고, 메인 DM 세션은 호스트에서 실행됩니다. 별도로 선택하지 않으면 Docker가 기본 백엔드입니다. 그런 다음 `tools.sandbox.tools`를 통해 샌드박스 세션에서 사용할 수 있는 도구를 제한하세요.

    설정 안내 + 예제 구성: [그룹: 개인 DM + 공개 그룹](/ko/channels/groups#pattern-personal-dms-public-groups-single-agent)

    핵심 구성 참조: [Gateway 구성](/ko/gateway/config-agents#agentsdefaultssandbox)

  </Accordion>

  <Accordion title="호스트 폴더를 샌드박스에 바인딩하려면 어떻게 하나요?">
    `agents.defaults.sandbox.docker.binds`를 `["host:path:mode"]` 형식으로 설정하세요(예: `"/home/user/src:/src:ro"`). 전역 + agent별 바인드는 병합되며, `scope: "shared"`일 때는 agent별 바인드가 무시됩니다. 민감한 항목에는 `:ro`를 사용하고, 바인드는 샌드박스 파일 시스템 경계를 우회한다는 점을 기억하세요.

    OpenClaw는 정규화된 경로와 가장 깊게 존재하는 상위 경로를 통해 해석된 표준 경로를 모두 기준으로 바인드 소스를 검증합니다. 즉 마지막 경로 세그먼트가 아직 존재하지 않더라도, 심볼릭 링크 상위 경로를 통한 탈출은 닫힌 상태로 실패하며, 심볼릭 링크 해석 후에도 허용된 루트 검사가 계속 적용됩니다.

    예제와 안전 참고 사항은 [샌드박싱](/ko/gateway/sandboxing#custom-bind-mounts) 및 [샌드박스 vs 도구 정책 vs Elevated](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)를 참조하세요.

  </Accordion>

  <Accordion title="메모리는 어떻게 작동하나요?">
    OpenClaw 메모리는 agent 워크스페이스에 있는 Markdown 파일일 뿐입니다:

    - `memory/YYYY-MM-DD.md`의 일일 노트
    - `MEMORY.md`의 선별된 장기 노트(메인/비공개 세션만)

    OpenClaw는 모델이 자동 Compaction 전에 오래 유지될 노트를
    작성하도록 상기시키기 위해 **무음 사전 Compaction 메모리 플러시**도 실행합니다.
    이는 워크스페이스에 쓰기 권한이 있을 때만 실행됩니다
    (읽기 전용 샌드박스에서는 건너뜀). [메모리](/ko/concepts/memory)를 참조하세요.

  </Accordion>

  <Accordion title="메모리가 계속 잊어버립니다. 어떻게 고정하나요?">
    봇에게 **해당 사실을 메모리에 기록하라고** 요청하세요. 장기 노트는 `MEMORY.md`에,
    단기 컨텍스트는 `memory/YYYY-MM-DD.md`에 들어갑니다.

    이 부분은 아직 개선 중입니다. 모델에게 메모리를 저장하라고 상기시키면 도움이 되며,
    모델은 무엇을 해야 하는지 알게 됩니다. 계속 잊어버린다면 Gateway가 매번 동일한
    워크스페이스를 사용하고 있는지 확인하세요.

    문서: [메모리](/ko/concepts/memory), [Agent 워크스페이스](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="메모리는 영구적으로 유지되나요? 제한은 무엇인가요?">
    메모리 파일은 디스크에 저장되며 삭제할 때까지 유지됩니다. 제한은 모델이 아니라
    저장소 용량입니다. 하지만 **세션 컨텍스트**는 여전히 모델의 컨텍스트 창에 의해
    제한되므로, 긴 대화는 Compaction되거나 잘릴 수 있습니다. 그래서
    메모리 검색이 존재합니다. 관련 있는 부분만 다시 컨텍스트로 가져옵니다.

    문서: [메모리](/ko/concepts/memory), [컨텍스트](/ko/concepts/context).

  </Accordion>

  <Accordion title="시맨틱 메모리 검색에는 OpenAI API 키가 필요한가요?">
    **OpenAI 임베딩**을 사용할 때만 필요합니다. Codex OAuth는 채팅/완성만 지원하며
    임베딩 접근 권한은 **부여하지 않으므로**, **Codex로 로그인해도(OAuth 또는
    Codex CLI 로그인)** 시맨틱 메모리 검색에는 도움이 되지 않습니다. OpenAI 임베딩에는
    여전히 실제 API 키(`OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`)가 필요합니다.

    provider를 명시적으로 설정하지 않으면, OpenClaw는 API 키를 해석할 수 있을 때
    provider를 자동 선택합니다(auth profile, `models.providers.*.apiKey`, 또는 env var).
    OpenAI 키를 해석할 수 있으면 OpenAI를 우선하고, 그렇지 않으면 Gemini 키,
    그다음 Voyage, 그다음 Mistral 순으로 선택합니다. 원격 키를 사용할 수 없으면
    메모리 검색은 구성할 때까지 비활성화된 상태로 유지됩니다. 로컬 모델 경로가
    구성되어 있고 실제로 존재한다면, OpenClaw는
    `local`을 우선합니다. Ollama는
    `memorySearch.provider = "ollama"`를 명시적으로 설정한 경우 지원됩니다.

    로컬에만 머무르고 싶다면 `memorySearch.provider = "local"`로 설정하세요(선택적으로
    `memorySearch.fallback = "none"`도 설정 가능). Gemini 임베딩을 사용하려면
    `memorySearch.provider = "gemini"`로 설정하고 `GEMINI_API_KEY`(또는
    `memorySearch.remote.apiKey`)를 제공하세요. OpenClaw는 **OpenAI, Gemini, Voyage, Mistral, Ollama, 또는 local**
    임베딩 모델을 지원합니다. 설정 세부 정보는 [메모리](/ko/concepts/memory)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 디스크에서의 저장 위치

<AccordionGroup>
  <Accordion title="OpenClaw와 함께 사용하는 모든 데이터가 로컬에 저장되나요?">
    아니요. **OpenClaw의 상태는 로컬에 있지만**, **외부 서비스는 여전히 사용자가 보내는 내용을 볼 수 있습니다**.

    - **기본적으로 로컬:** 세션, 메모리 파일, 구성, 워크스페이스는 Gateway 호스트에 저장됩니다
      (`~/.openclaw` + 워크스페이스 디렉터리).
    - **필연적으로 원격:** 모델 provider(Anthropic/OpenAI 등)로 보내는 메시지는
      해당 API로 전송되며, 채팅 플랫폼(WhatsApp/Telegram/Slack 등)은 메시지 데이터를
      각자의 서버에 저장합니다.
    - **흔적 범위는 사용자가 제어:** 로컬 모델을 사용하면 프롬프트는 사용자 장치에 남지만,
      채널 트래픽은 여전히 해당 채널의 서버를 거칩니다.

    관련 문서: [Agent 워크스페이스](/ko/concepts/agent-workspace), [메모리](/ko/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw는 데이터를 어디에 저장하나요?">
    모든 것은 `$OPENCLAW_STATE_DIR` 아래에 저장됩니다(기본값: `~/.openclaw`):

    | Path                                                            | 용도                                                               |
    | --------------------------------------------------------------- | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                             | 기본 구성(JSON5)                                                   |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                    | 레거시 OAuth 가져오기(처음 사용할 때 auth profile로 복사됨)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profile(OAuth, API 키, 선택적 `keyRef`/`tokenRef`)            |
    | `$OPENCLAW_STATE_DIR/secrets.json`                              | `file` SecretRef provider용 선택적 파일 기반 secret payload        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`          | 레거시 호환 파일(정적 `api_key` 항목은 제거됨)                     |
    | `$OPENCLAW_STATE_DIR/credentials/`                              | Provider 상태(예: `whatsapp/<accountId>/creds.json`)               |
    | `$OPENCLAW_STATE_DIR/agents/`                                   | agent별 상태(agentDir + sessions)                                  |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                | 대화 기록 및 상태(agent별)                                         |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/sessions.json`   | 세션 메타데이터(agent별)                                           |

    레거시 단일 agent 경로: `~/.openclaw/agent/*` (`openclaw doctor`가 마이그레이션함).

    **워크스페이스**(`AGENTS.md`, 메모리 파일, skills 등)는 별도이며 `agents.defaults.workspace`를 통해 구성합니다(기본값: `~/.openclaw/workspace`).

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md는 어디에 있어야 하나요?">
    이 파일들은 `~/.openclaw`가 아니라 **agent 워크스페이스**에 있어야 합니다.

    - **워크스페이스(agent별)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`,
      `MEMORY.md`, `memory/YYYY-MM-DD.md`, 선택적 `HEARTBEAT.md`.
      소문자 루트 `memory.md`는 레거시 복구 입력 전용이며, `openclaw doctor --fix`는
      두 파일이 모두 있을 때 이를 `MEMORY.md`에 병합할 수 있습니다.
    - **상태 디렉터리(`~/.openclaw`)**: 구성, 채널/provider 상태, auth profile, sessions, logs,
      그리고 공유 skills(`~/.openclaw/skills`).

    기본 워크스페이스는 `~/.openclaw/workspace`이며, 다음으로 구성할 수 있습니다:

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    재시작 후 봇이 "잊어버린다"면, Gateway가 매번 동일한
    워크스페이스를 사용해 실행되는지 확인하세요(그리고 원격 모드에서는 로컬 노트북이 아니라
    **gateway 호스트의** 워크스페이스를 사용한다는 점도 기억하세요).

    팁: 지속적인 동작이나 선호 사항을 원한다면, 채팅 기록에 의존하기보다
    봇에게 **AGENTS.md 또는 MEMORY.md에 기록하라고** 요청하세요.

    [Agent 워크스페이스](/ko/concepts/agent-workspace) 및 [메모리](/ko/concepts/memory)를 참조하세요.

  </Accordion>

  <Accordion title="권장 백업 전략">
    **agent 워크스페이스**를 **비공개** git 저장소에 두고
    비공개 위치(예: GitHub private)에 백업하세요. 이렇게 하면 메모리 + AGENTS/SOUL/USER
    파일을 캡처할 수 있고, 나중에 어시스턴트의 "마음"을 복원할 수 있습니다.

    `~/.openclaw` 아래의 어떤 것도 커밋하지 마세요(credentials, sessions, tokens, 또는 암호화된 secret payload 포함).
    전체 복원이 필요하다면, 워크스페이스와 상태 디렉터리를
    각각 별도로 백업하세요(위의 마이그레이션 질문 참조).

    문서: [Agent 워크스페이스](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw를 완전히 제거하려면 어떻게 하나요?">
    전용 가이드: [제거](/ko/install/uninstall)를 참조하세요.
  </Accordion>

  <Accordion title="agent가 워크스페이스 밖에서도 작업할 수 있나요?">
    예. 워크스페이스는 **기본 cwd**이자 메모리 기준점이지, 강제적인 샌드박스는 아닙니다.
    상대 경로는 워크스페이스 내부에서 해석되지만, 절대 경로는 샌드박싱이 활성화되지 않은 한
    다른 호스트 위치에도 접근할 수 있습니다. 격리가 필요하다면
    [`agents.defaults.sandbox`](/ko/gateway/sandboxing) 또는 agent별 샌드박스 설정을 사용하세요. 저장소를
    기본 작업 디렉터리로 쓰고 싶다면 해당 agent의
    `workspace`를 저장소 루트로 지정하세요. OpenClaw 저장소는 단지 소스 코드일 뿐이므로,
    agent가 그 안에서 작업하도록 의도한 경우가 아니라면 워크스페이스는 별도로 두세요.

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
    세션 상태는 **gateway 호스트**가 소유합니다. 원격 모드라면, 중요한 세션 저장소는 로컬 노트북이 아니라 원격 머신에 있습니다. [세션 관리](/ko/concepts/session)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 기본 구성

<AccordionGroup>
  <Accordion title="구성 형식은 무엇이며, 어디에 있나요?">
    OpenClaw는 `$OPENCLAW_CONFIG_PATH`에 있는 선택적 **JSON5** 구성을 읽습니다(기본값: `~/.openclaw/openclaw.json`):

    ```
    $OPENCLAW_CONFIG_PATH
    ```

    파일이 없으면 안전한 기본값을 사용합니다(기본 워크스페이스 `~/.openclaw/workspace` 포함).

  </Accordion>

  <Accordion title='`gateway.bind: "lan"`(또는 `"tailnet"`)을 설정했더니 아무것도 수신하지 않거나 UI에 unauthorized가 표시됩니다'>
    루프백이 아닌 바인드는 **유효한 gateway 인증 경로가 필요합니다**. 실제로는 다음을 의미합니다:

    - shared-secret 인증: 토큰 또는 비밀번호
    - 올바르게 구성된 비루프백 identity-aware 리버스 프록시 뒤의 `gateway.auth.mode: "trusted-proxy"`

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

    - `gateway.remote.token` / `.password`만으로는 로컬 gateway 인증이 활성화되지 않습니다.
    - 로컬 호출 경로는 `gateway.auth.*`가 설정되지 않은 경우에만 `gateway.remote.*`를 fallback으로 사용할 수 있습니다.
    - 비밀번호 인증의 경우 대신 `gateway.auth.mode: "password"`와 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 설정하세요.
    - `gateway.auth.token` / `gateway.auth.password`가 SecretRef로 명시적으로 구성되었지만 해석되지 않으면, 해석은 닫힌 상태로 실패합니다(원격 fallback이 이를 가리지 않음).
    - shared-secret Control UI 설정은 `connect.params.auth.token` 또는 `connect.params.auth.password`를 통해 인증합니다(앱/UI 설정에 저장됨). Tailscale Serve 또는 `trusted-proxy` 같은 identity-bearing 모드는 대신 요청 헤더를 사용합니다. shared secret을 URL에 넣지 마세요.
    - `gateway.auth.mode: "trusted-proxy"`를 사용하더라도, 동일 호스트의 루프백 리버스 프록시는 여전히 trusted-proxy 인증 조건을 만족하지 않습니다. trusted proxy는 구성된 비루프백 소스여야 합니다.

  </Accordion>

  <Accordion title="왜 이제 localhost에서도 토큰이 필요한가요?">
    OpenClaw는 기본적으로 루프백을 포함한 gateway 인증을 강제합니다. 일반적인 기본 경로에서는 이것이 토큰 인증을 의미합니다. 명시적인 인증 경로가 구성되지 않으면 gateway 시작 시 토큰 모드로 해석되고 자동으로 토큰을 생성해 `gateway.auth.token`에 저장하므로, **로컬 WS 클라이언트도 인증해야 합니다**. 이렇게 하면 다른 로컬 프로세스가 Gateway를 호출하지 못하게 막을 수 있습니다.

    다른 인증 경로를 원한다면 비밀번호 모드(또는 비루프백 identity-aware 리버스 프록시의 경우 `trusted-proxy`)를 명시적으로 선택할 수 있습니다. **정말로** 열린 루프백을 원한다면 구성에 `gateway.auth.mode: "none"`을 명시적으로 설정하세요. Doctor는 언제든 토큰을 생성해 줄 수 있습니다: `openclaw doctor --generate-gateway-token`.

  </Accordion>

  <Accordion title="구성을 변경한 뒤 다시 시작해야 하나요?">
    Gateway는 구성을 감시하며 hot-reload를 지원합니다:

    - `gateway.reload.mode: "hybrid"`(기본값): 안전한 변경은 즉시 적용, 중요한 변경은 재시작
    - `hot`, `restart`, `off`도 지원됩니다

  </Accordion>

  <Accordion title="재미있는 CLI 태그라인을 끄려면 어떻게 하나요?">
    구성에서 `cli.banner.taglineMode`를 설정하세요:

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
    - `random`: 재미있거나 계절성 있는 태그라인을 순환 표시합니다(기본 동작).
    - 배너 자체를 완전히 숨기려면 env `OPENCLAW_HIDE_BANNER=1`을 설정하세요.

  </Accordion>

  <Accordion title="웹 검색(및 웹 가져오기)을 활성화하려면 어떻게 하나요?">
    `web_fetch`는 API 키 없이 작동합니다. `web_search`는 선택한
    provider에 따라 달라집니다:

    - Brave, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Perplexity, Tavily 같은 API 기반 provider는 일반적인 API 키 설정이 필요합니다.
    - Ollama Web Search는 키가 필요 없지만, 구성된 Ollama 호스트를 사용하며 `ollama signin`이 필요합니다.
    - DuckDuckGo는 키가 필요 없지만 비공식 HTML 기반 통합입니다.
    - SearXNG는 키가 필요 없는 셀프 호스팅 방식이며, `SEARXNG_BASE_URL` 또는 `plugins.entries.searxng.config.webSearch.baseUrl`을 구성하세요.

    **권장:** `openclaw configure --section web`을 실행하고 provider를 선택하세요.
    환경 변수 대안:

    - Brave: `BRAVE_API_KEY`
    - Exa: `EXA_API_KEY`
    - Firecrawl: `FIRECRAWL_API_KEY`
    - Gemini: `GEMINI_API_KEY`
    - Grok: `XAI_API_KEY`
    - Kimi: `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`
    - MiniMax Search: `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`, 또는 `MINIMAX_API_KEY`
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
              provider: "firecrawl", // 선택 사항; 자동 감지를 사용하려면 생략
            },
          },
        },
    }
    ```

    provider별 웹 검색 구성은 이제 `plugins.entries.<plugin>.config.webSearch.*` 아래에 있습니다.
    레거시 `tools.web.search.*` provider 경로도 호환성을 위해 일시적으로 계속 로드되지만, 새 구성에서는 사용하지 않아야 합니다.
    Firecrawl 웹 가져오기 fallback 구성은 `plugins.entries.firecrawl.config.webFetch.*` 아래에 있습니다.

    참고:

    - allowlist를 사용하는 경우 `web_search`/`web_fetch`/`x_search` 또는 `group:web`를 추가하세요.
    - `web_fetch`는 기본적으로 활성화되어 있습니다(명시적으로 비활성화하지 않는 한).
    - `tools.web.fetch.provider`를 생략하면, OpenClaw는 사용 가능한 자격 증명에서 준비된 첫 번째 가져오기 fallback provider를 자동 감지합니다. 현재 번들 provider는 Firecrawl입니다.
    - 데몬은 `~/.openclaw/.env`(또는 서비스 환경)에서 env var를 읽습니다.

    문서: [웹 도구](/ko/tools/web).

  </Accordion>

  <Accordion title="config.apply가 내 구성을 날려버렸습니다. 어떻게 복구하고 이를 피할 수 있나요?">
    `config.apply`는 **전체 구성**을 교체합니다. 부분 객체를 보내면
    나머지는 모두 제거됩니다.

    현재 OpenClaw는 많은 실수로 인한 덮어쓰기를 방지합니다:

    - OpenClaw 소유 구성 쓰기는 기록 전에 변경 후 전체 구성을 검증합니다.
    - 잘못되었거나 파괴적인 OpenClaw 소유 쓰기는 거부되고 `openclaw.json.rejected.*`로 저장됩니다.
    - 직접 편집으로 시작 또는 hot reload가 깨지면, Gateway는 마지막 정상 구성을 복원하고 거부된 파일을 `openclaw.json.clobbered.*`로 저장합니다.
    - 복구 후 메인 agent는 부팅 경고를 받아 잘못된 구성을 다시 무턱대고 쓰지 않게 됩니다.

    복구 방법:

    - `openclaw logs --follow`에서 `Config auto-restored from last-known-good`, `Config write rejected:`, 또는 `config reload restored last-known-good config`를 확인하세요.
    - 활성 구성 옆의 최신 `openclaw.json.clobbered.*` 또는 `openclaw.json.rejected.*`를 확인하세요.
    - 복원된 활성 구성이 정상적으로 작동하면 그대로 두고, 의도한 키만 `openclaw config set` 또는 `config.patch`로 다시 복사하세요.
    - `openclaw config validate`와 `openclaw doctor`를 실행하세요.
    - 마지막 정상 구성이나 거부된 payload가 전혀 없다면 백업에서 복원하거나 `openclaw doctor`를 다시 실행한 뒤 채널/모델을 다시 구성하세요.
    - 예상치 못한 상황이었다면 버그를 보고하고 마지막으로 알고 있던 구성이나 백업을 포함하세요.
    - 로컬 코딩 agent는 종종 로그나 기록에서 작동하는 구성을 재구성할 수 있습니다.

    피하는 방법:

    - 작은 변경에는 `openclaw config set`을 사용하세요.
    - 대화형 편집에는 `openclaw configure`를 사용하세요.
    - 정확한 경로나 필드 형태가 확실하지 않다면 먼저 `config.schema.lookup`을 사용하세요. 얕은 스키마 노드와 즉시 확인 가능한 하위 요약을 반환해 드릴다운할 수 있습니다.
    - 부분 RPC 편집에는 `config.patch`를 사용하고, `config.apply`는 전체 구성 교체에만 사용하세요.
    - agent 실행에서 owner 전용 `gateway` 도구를 사용하는 경우에도, `tools.exec.ask` / `tools.exec.security` 쓰기(동일한 보호된 exec 경로로 정규화되는 레거시 `tools.bash.*` 별칭 포함)는 계속 거부됩니다.

    문서: [구성](/ko/cli/config), [구성 설정](/ko/cli/configure), [Gateway 문제 해결](/ko/gateway/troubleshooting#gateway-restored-last-known-good-config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="여러 장치에 특화된 작업자를 두고 중앙 Gateway를 실행하려면 어떻게 하나요?">
    일반적인 패턴은 **하나의 Gateway**(예: Raspberry Pi)와 **Nodes** 및 **agents**를 함께 사용하는 것입니다:

    - **Gateway(중앙):** 채널(Signal/WhatsApp), 라우팅, 세션을 소유합니다.
    - **Nodes(장치):** Mac/iOS/Android가 주변 장치로 연결되어 로컬 도구(`system.run`, `canvas`, `camera`)를 노출합니다.
    - **Agents(작업자):** 특수 역할(예: "Hetzner ops", "개인 데이터")을 위한 별도 브레인/워크스페이스입니다.
    - **Sub-agents:** 병렬 처리가 필요할 때 메인 agent에서 백그라운드 작업을 생성합니다.
    - **TUI:** Gateway에 연결하고 agents/sessions를 전환합니다.

    문서: [Nodes](/ko/nodes), [원격 액세스](/ko/gateway/remote), [Multi-Agent Routing](/ko/concepts/multi-agent), [Sub-agents](/ko/tools/subagents), [TUI](/ko/web/tui).

  </Accordion>

  <Accordion title="OpenClaw 브라우저를 headless로 실행할 수 있나요?">
    예. 구성 옵션입니다:

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

    기본값은 `false`(headful)입니다. Headless는 일부 사이트에서 봇 차단 검사를 더 자주 유발할 수 있습니다. [브라우저](/ko/tools/browser)를 참조하세요.

    Headless는 **동일한 Chromium 엔진**을 사용하며 대부분의 자동화(양식, 클릭, 스크래핑, 로그인)에서 작동합니다. 주요 차이점은 다음과 같습니다:

    - 보이는 브라우저 창이 없습니다(시각적 확인이 필요하면 스크린샷 사용).
    - 일부 사이트는 headless 모드의 자동화에 더 엄격합니다(CAPTCHA, 봇 차단).
      예를 들어 X/Twitter는 headless 세션을 자주 차단합니다.

  </Accordion>

  <Accordion title="브라우저 제어에 Brave를 사용하려면 어떻게 하나요?">
    `browser.executablePath`를 Brave 바이너리(또는 Chromium 기반 브라우저)로 설정하고 Gateway를 재시작하세요.
    전체 구성 예시는 [브라우저](/ko/tools/browser#use-brave-or-another-chromium-based-browser)를 참조하세요.
  </Accordion>
</AccordionGroup>

## 원격 Gateway 및 Nodes

<AccordionGroup>
  <Accordion title="Telegram, gateway, Nodes 사이에서 명령은 어떻게 전파되나요?">
    Telegram 메시지는 **gateway**가 처리합니다. gateway가 agent를 실행한 뒤,
    Node 도구가 필요할 때만 **Gateway WebSocket**을 통해 Nodes를 호출합니다:

    Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

    Nodes는 들어오는 provider 트래픽을 보지 못합니다. Node RPC 호출만 받습니다.

  </Accordion>

  <Accordion title="Gateway가 원격에 호스팅되어 있을 때 agent가 내 컴퓨터에 접근하려면 어떻게 하나요?">
    짧은 답: **컴퓨터를 Node로 페어링하세요**. Gateway는 다른 곳에서 실행되지만,
    Gateway WebSocket을 통해 로컬 머신의 `node.*` 도구(화면, 카메라, 시스템)를 호출할 수 있습니다.

    일반적인 설정:

    1. 항상 켜져 있는 호스트(VPS/홈 서버)에서 Gateway를 실행합니다.
    2. Gateway 호스트와 사용자 컴퓨터를 같은 tailnet에 둡니다.
    3. Gateway WS에 연결할 수 있는지 확인합니다(tailnet bind 또는 SSH 터널).
    4. macOS 앱을 로컬에서 열고 **Remote over SSH** 모드(또는 직접 tailnet)로 연결하여
       Node로 등록되게 합니다.
    5. Gateway에서 Node를 승인합니다:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    별도의 TCP 브리지는 필요하지 않습니다. Nodes는 Gateway WebSocket을 통해 연결됩니다.

    보안 알림: macOS Node를 페어링하면 해당 머신에서 `system.run`이 허용됩니다. 신뢰하는 장치만
    페어링하고 [보안](/ko/gateway/security)을 검토하세요.

    문서: [Nodes](/ko/nodes), [Gateway 프로토콜](/ko/gateway/protocol), [macOS 원격 모드](/ko/platforms/mac/remote), [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="Tailscale은 연결되어 있는데 응답이 없습니다. 이제 어떻게 하나요?">
    기본 사항을 확인하세요:

    - Gateway 실행 중: `openclaw gateway status`
    - Gateway 상태: `openclaw status`
    - 채널 상태: `openclaw channels status`

    그다음 인증과 라우팅을 확인하세요:

    - Tailscale Serve를 사용하는 경우 `gateway.auth.allowTailscale`이 올바르게 설정되어 있는지 확인하세요.
    - SSH 터널로 연결하는 경우 로컬 터널이 실행 중이며 올바른 포트를 가리키는지 확인하세요.
    - allowlist(DM 또는 그룹)에 사용자 계정이 포함되어 있는지 확인하세요.

    문서: [Tailscale](/ko/gateway/tailscale), [원격 액세스](/ko/gateway/remote), [채널](/ko/channels).

  </Accordion>

  <Accordion title="두 OpenClaw 인스턴스(로컬 + VPS)가 서로 대화할 수 있나요?">
    예. 기본 제공되는 "봇 간" 브리지는 없지만, 몇 가지
    안정적인 방식으로 연결할 수 있습니다:

    **가장 간단한 방법:** 두 봇이 모두 접근할 수 있는 일반 채팅 채널(Telegram/Slack/WhatsApp)을 사용하세요.
    Bot A가 Bot B에 메시지를 보내고, Bot B가 평소처럼 응답하게 하세요.

    **CLI 브리지(일반용):** 스크립트를 실행해 다른 Gateway를
    `openclaw agent --message ... --deliver`로 호출하고, 다른 봇이 수신하는 채팅을 대상으로 하세요.
    한 봇이 원격 VPS에 있다면 로컬 CLI가 SSH/Tailscale을 통해 해당 원격 Gateway를 가리키게 하세요
    ([원격 액세스](/ko/gateway/remote) 참조).

    예시 패턴(대상 Gateway에 접근할 수 있는 머신에서 실행):

    ```bash
    openclaw agent --message "로컬 봇에서 보냄" --deliver --channel telegram --reply-to <chat-id>
    ```

    팁: 두 봇이 무한 루프에 빠지지 않도록 가드레일을 추가하세요(멘션 전용, 채널
    allowlist, 또는 "봇 메시지에는 응답하지 않음" 규칙).

    문서: [원격 액세스](/ko/gateway/remote), [Agent CLI](/ko/cli/agent), [Agent send](/ko/tools/agent-send).

  </Accordion>

  <Accordion title="여러 agent를 위해 별도의 VPS가 필요한가요?">
    아니요. 하나의 Gateway가 여러 agent를 호스팅할 수 있으며, 각 agent는 자체 워크스페이스, 모델 기본값,
    라우팅을 가질 수 있습니다. 이것이 일반적인 설정이며 agent마다
    VPS 하나씩 실행하는 것보다 훨씬 저렴하고 간단합니다.

    별도의 VPS는 강한 격리(보안 경계)나
    공유하고 싶지 않은 매우 다른 구성이 필요할 때만 사용하세요. 그렇지 않다면 Gateway는 하나로 유지하고
    여러 agent 또는 sub-agent를 사용하세요.

  </Accordion>

  <Accordion title="VPS에서 SSH로 접근하는 대신 개인 노트북에 Node를 두는 데 이점이 있나요?">
    예. Nodes는 원격 Gateway에서 노트북에 접근하는 일급 방식이며,
    셸 접근 이상을 가능하게 합니다. Gateway는 macOS/Linux(Windows는 WSL2 경유)에서 실행되며
    가볍기 때문에(작은 VPS나 Raspberry Pi급 장치로 충분하며 4GB RAM이면 넉넉함), 흔한
    설정은 항상 켜져 있는 호스트 + 노트북을 Node로 사용하는 방식입니다.

    - **인바운드 SSH가 필요 없습니다.** Nodes는 Gateway WebSocket으로 아웃바운드 연결하고 장치 페어링을 사용합니다.
    - **더 안전한 실행 제어.** `system.run`은 해당 노트북의 Node allowlist/승인으로 제어됩니다.
    - **더 많은 장치 도구.** Nodes는 `system.run` 외에도 `canvas`, `camera`, `screen`을 제공합니다.
    - **로컬 브라우저 자동화.** Gateway는 VPS에 두되, 노트북의 node host를 통해 로컬에서 Chrome을 실행하거나 Chrome MCP를 통해 호스트의 로컬 Chrome에 연결할 수 있습니다.

    SSH는 임시 셸 접근에는 괜찮지만, 지속적인 agent 워크플로와
    장치 자동화에는 Nodes가 더 간단합니다.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/ko/cli/nodes), [브라우저](/ko/tools/browser).

  </Accordion>

  <Accordion title="Nodes는 gateway 서비스를 실행하나요?">
    아니요. 의도적으로 격리된 프로필을 실행하는 경우가 아니라면 호스트당 **gateway는 하나만** 실행해야 합니다([여러 gateway](/ko/gateway/multiple-gateways) 참조). Nodes는 gateway에 연결되는 주변 장치입니다
    (iOS/Android Nodes 또는 메뉴 막대 앱의 macOS "node mode"). 헤드리스 node
    host 및 CLI 제어는 [Node host CLI](/ko/cli/node)를 참조하세요.

    `gateway`, `discovery`, `canvasHost` 변경에는 전체 재시작이 필요합니다.

  </Accordion>

  <Accordion title="구성을 적용하는 API / RPC 방법이 있나요?">
    예.

    - `config.schema.lookup`: 기록 전에 한 구성 하위 트리의 얕은 스키마 노드, 일치한 UI 힌트, 즉시 하위 요약을 함께 확인
    - `config.get`: 현재 스냅샷 + 해시 가져오기
    - `config.patch`: 안전한 부분 업데이트(대부분의 RPC 편집에 권장); 가능하면 hot-reload하고 필요하면 재시작
    - `config.apply`: 전체 구성을 검증하고 교체; 가능하면 hot-reload하고 필요하면 재시작
    - owner 전용 `gateway` 런타임 도구는 여전히 `tools.exec.ask` / `tools.exec.security` 재작성을 거부합니다. 레거시 `tools.bash.*` 별칭도 동일한 보호된 exec 경로로 정규화됩니다

  </Accordion>

  <Accordion title="첫 설치를 위한 최소한의 합리적인 구성">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    이렇게 하면 워크스페이스를 설정하고 누가 봇을 트리거할 수 있는지 제한합니다.

  </Accordion>

  <Accordion title="VPS에 Tailscale을 설정하고 Mac에서 연결하려면 어떻게 하나요?">
    최소 단계:

    1. **VPS에 설치 + 로그인**

       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```

    2. **Mac에 설치 + 로그인**
       - Tailscale 앱을 사용해 동일한 tailnet에 로그인합니다.
    3. **MagicDNS 활성화(권장)**
       - Tailscale 관리자 콘솔에서 MagicDNS를 활성화하여 VPS에 안정적인 이름을 부여합니다.
    4. **tailnet 호스트 이름 사용**
       - SSH: `ssh user@your-vps.tailnet-xxxx.ts.net`
       - Gateway WS: `ws://your-vps.tailnet-xxxx.ts.net:18789`

    SSH 없이 Control UI를 사용하려면 VPS에서 Tailscale Serve를 사용하세요:

    ```bash
    openclaw gateway --tailscale serve
    ```

    이렇게 하면 gateway는 loopback에 바인딩된 상태를 유지하고 Tailscale을 통해 HTTPS를 노출합니다. [Tailscale](/ko/gateway/tailscale)을 참조하세요.

  </Accordion>

  <Accordion title="Mac Node를 원격 Gateway(Tailscale Serve)에 연결하려면 어떻게 하나요?">
    Serve는 **Gateway Control UI + WS**를 노출합니다. Nodes는 동일한 Gateway WS 엔드포인트를 통해 연결합니다.

    권장 설정:

    1. **VPS와 Mac이 동일한 tailnet에 있는지 확인합니다**.
    2. **macOS 앱을 Remote 모드로 사용합니다**(SSH 대상은 tailnet 호스트 이름이어도 됨).
       앱이 Gateway 포트를 터널링하고 Node로 연결합니다.
    3. gateway에서 **Node를 승인합니다**:

       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    문서: [Gateway 프로토콜](/ko/gateway/protocol), [Discovery](/ko/gateway/discovery), [macOS 원격 모드](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="두 번째 노트북에 설치해야 하나요, 아니면 Node만 추가하면 되나요?">
    두 번째 노트북에서 **로컬 도구**(화면/카메라/exec)만 필요하다면
    **Node**로 추가하세요. 이렇게 하면 Gateway를 하나만 유지할 수 있고 구성 중복을 피할 수 있습니다. 로컬 Node 도구는
    현재 macOS 전용이지만, 다른 OS로도 확장할 계획입니다.

    **강한 격리** 또는 완전히 분리된 두 봇이 필요한 경우에만 두 번째 Gateway를 설치하세요.

    문서: [Nodes](/ko/nodes), [Nodes CLI](/ko/cli/nodes), [여러 gateway](/ko/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## Env vars 및 .env 로딩

<AccordionGroup>
  <Accordion title="OpenClaw는 환경 변수를 어떻게 로드하나요?">
    OpenClaw는 부모 프로세스(셸, launchd/systemd, CI 등)의 env var를 읽고, 추가로 다음도 로드합니다:

    - 현재 작업 디렉터리의 `.env`
    - `~/.openclaw/.env`(즉 `$OPENCLAW_STATE_DIR/.env`)에 있는 전역 fallback `.env`

    두 `.env` 파일 모두 기존 env var를 덮어쓰지 않습니다.

    구성에서 인라인 env var를 정의할 수도 있습니다(프로세스 env에 없을 때만 적용됨):

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    전체 우선순위와 소스는 [/environment](/ko/help/environment)를 참조하세요.

  </Accordion>

  <Accordion title="서비스로 Gateway를 시작했더니 env var가 사라졌습니다. 이제 어떻게 하나요?">
    일반적인 해결 방법 두 가지:

    1. 누락된 키를 `~/.openclaw/.env`에 넣어 서비스가 셸 env를 상속하지 않아도 가져오게 합니다.
    2. 셸 가져오기 활성화(선택형 편의 기능):

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

    이렇게 하면 로그인 셸을 실행해 예상된 누락 키만 가져옵니다(절대 덮어쓰지 않음). 해당 env var:
    `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN을 설정했는데 models status에 "Shell env: off."라고 표시됩니다. 왜 그런가요?'>
    `openclaw models status`는 **shell env 가져오기**가 활성화되어 있는지를 보고합니다. "Shell env: off"는
    env var가 없다는 뜻이 **아니라**, OpenClaw가
    로그인 셸을 자동으로 로드하지 않는다는 뜻일 뿐입니다.

    Gateway가 서비스(launchd/systemd)로 실행되면 셸
    환경을 상속하지 않습니다. 다음 중 하나로 해결하세요:

    1. 토큰을 `~/.openclaw/.env`에 넣습니다:

       ```
       COPILOT_GITHUB_TOKEN=...
       ```

    2. 또는 셸 가져오기를 활성화합니다(`env.shellEnv.enabled: true`).
    3. 또는 구성의 `env` 블록에 추가합니다(없을 때만 적용됨).

    그런 다음 gateway를 재시작하고 다시 확인하세요:

    ```bash
    openclaw models status
    ```

    Copilot 토큰은 `COPILOT_GITHUB_TOKEN`에서 읽습니다(`GH_TOKEN` / `GITHUB_TOKEN`도 지원).
    [/concepts/model-providers](/ko/concepts/model-providers) 및 [/environment](/ko/help/environment)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 세션 및 여러 채팅

<AccordionGroup>
  <Accordion title="새 대화를 시작하려면 어떻게 하나요?">
    독립된 메시지로 `/new` 또는 `/reset`을 보내세요. [세션 관리](/ko/concepts/session)를 참조하세요.
  </Accordion>

  <Accordion title="/new를 한 번도 보내지 않으면 세션이 자동으로 재설정되나요?">
    세션은 `session.idleMinutes` 이후 만료되도록 할 수 있지만, 이는 **기본적으로 비활성화**되어 있습니다(기본값 **0**).
    유휴 만료를 활성화하려면 양수 값으로 설정하세요. 활성화되면 유휴 기간 이후의 **다음**
    메시지가 해당 채팅 키에 대해 새 세션 ID를 시작합니다.
    이는 대화 기록을 삭제하는 것이 아니라 새 세션을 시작하는 것입니다.

    ```json5
    {
      session: {
        idleMinutes: 240,
      },
    }
    ```

  </Accordion>

  <Accordion title="OpenClaw 인스턴스 팀(CEO 1명과 여러 agent)을 만들 방법이 있나요?">
    예. **multi-agent 라우팅**과 **sub-agents**를 통해 가능합니다. 하나의 조정자
    agent와, 각자 자체 워크스페이스와 모델을 가진 여러 작업 agent를 만들 수 있습니다.

    다만 이것은 **재미있는 실험**으로 보는 것이 가장 좋습니다. 토큰 사용량이 많고,
    분리된 세션을 가진 하나의 봇을 사용하는 것보다 효율이 떨어지는 경우가 많습니다. 우리가
    일반적으로 상정하는 모델은, 사용자가 대화하는 봇 하나에 병렬 작업을 위한 여러 세션이 있는 형태입니다. 그
    봇은 필요할 때 sub-agent도 생성할 수 있습니다.

    문서: [Multi-agent 라우팅](/ko/concepts/multi-agent), [Sub-agents](/ko/tools/subagents), [Agents CLI](/ko/cli/agents).

  </Accordion>

  <Accordion title="작업 중간에 컨텍스트가 왜 잘렸나요? 어떻게 방지하나요?">
    세션 컨텍스트는 모델 창 크기에 의해 제한됩니다. 긴 채팅, 큰 도구 출력, 또는 많은
    파일이 Compaction이나 잘림을 유발할 수 있습니다.

    도움이 되는 방법:

    - 봇에게 현재 상태를 요약해 파일에 기록하라고 요청합니다.
    - 긴 작업 전에 `/compact`를 사용하고, 주제를 바꿀 때는 `/new`를 사용합니다.
    - 중요한 컨텍스트는 워크스페이스에 보관하고 봇에게 다시 읽어오라고 요청합니다.
    - 긴 작업이나 병렬 작업에는 sub-agent를 사용해 메인 채팅을 더 작게 유지합니다.
    - 이런 일이 자주 발생하면 더 큰 컨텍스트 창을 가진 모델을 선택합니다.

  </Accordion>

  <Accordion title="설치는 유지하면서 OpenClaw를 완전히 초기화하려면 어떻게 하나요?">
    reset 명령을 사용하세요:

    ```bash
    openclaw reset
    ```

    비대화형 전체 초기화:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    그런 다음 설정을 다시 실행합니다:

    ```bash
    openclaw onboard --install-daemon
    ```

    참고:

    - 온보딩은 기존 구성을 감지하면 **Reset**도 제공합니다. [온보딩 (CLI)](/ko/start/wizard)를 참조하세요.
    - 프로필(`--profile` / `OPENCLAW_PROFILE`)을 사용했다면 각 상태 디렉터리를 초기화하세요(기본값은 `~/.openclaw-<profile>`).
    - 개발용 reset: `openclaw gateway --dev --reset`(개발 전용; 개발 구성 + credentials + sessions + workspace를 삭제).

  </Accordion>

  <Accordion title='계속 "context too large" 오류가 납니다. 어떻게 reset 또는 compact하나요?'>
    다음 중 하나를 사용하세요:

    - **Compact**(대화는 유지하면서 오래된 턴을 요약):

      ```
      /compact
      ```

      또는 요약을 안내하려면 `/compact <instructions>`를 사용하세요.

    - **Reset**(동일한 채팅 키에 대해 새 세션 ID 시작):

      ```
      /new
      /reset
      ```

    계속 발생한다면:

    - 오래된 도구 출력을 줄이도록 **세션 가지치기**(`agents.defaults.contextPruning`)를 활성화하거나 조정하세요.
    - 더 큰 컨텍스트 창을 가진 모델을 사용하세요.

    문서: [Compaction](/ko/concepts/compaction), [세션 가지치기](/ko/concepts/session-pruning), [세션 관리](/ko/concepts/session).

  </Accordion>

  <Accordion title='왜 "LLM request rejected: messages.content.tool_use.input field required"가 표시되나요?'>
    이는 provider 검증 오류입니다. 모델이 필요한
    `input` 없이 `tool_use` 블록을 출력했다는 뜻입니다. 보통 세션 기록이 오래되었거나 손상되었음을 의미하며(긴 스레드
    또는 도구/스키마 변경 후 자주 발생),

    해결 방법: `/new`로 새 세션을 시작하세요(독립된 메시지로).

  </Accordion>

  <Accordion title="왜 30분마다 Heartbeat 메시지가 오나요?">
    Heartbeat는 기본적으로 **30분**마다 실행됩니다(**OAuth 인증 사용 시 1시간**). 조정하거나 비활성화하려면 다음과 같이 하세요:

    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "2h", // 비활성화하려면 "0m"
          },
        },
      },
    }
    ```

    `HEARTBEAT.md`가 존재하지만 사실상 비어 있는 경우(빈 줄과 `# Heading` 같은 markdown
    헤더만 있는 경우), OpenClaw는 API 호출을 아끼기 위해 Heartbeat 실행을 건너뜁니다.
    파일이 없으면 Heartbeat는 계속 실행되며 모델이 무엇을 할지 결정합니다.

    agent별 override는 `agents.list[].heartbeat`를 사용합니다. 문서: [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title='WhatsApp 그룹에 "봇 계정"을 추가해야 하나요?'>
    아니요. OpenClaw는 **사용자 자신의 계정**에서 실행되므로, 사용자가 그룹에 속해 있으면 OpenClaw도 이를 볼 수 있습니다.
    기본적으로 그룹 응답은 발신자를 허용할 때까지 차단됩니다(`groupPolicy: "allowlist"`).

    그룹 응답을 **사용자만** 트리거할 수 있게 하려면:

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

  <Accordion title="WhatsApp 그룹의 JID는 어떻게 얻나요?">
    옵션 1(가장 빠름): 로그를 tail하면서 그룹에 테스트 메시지를 보냅니다:

    ```bash
    openclaw logs --follow --json
    ```

    `@g.us`로 끝나는 `chatId`(또는 `from`)를 찾으세요. 예:
    `1234567890-1234567890@g.us`.

    옵션 2(이미 구성되었거나 allowlist된 경우): 구성에서 그룹을 나열합니다:

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    문서: [WhatsApp](/ko/channels/whatsapp), [Directory](/ko/cli/directory), [로그](/ko/cli/logs).

  </Accordion>

  <Accordion title="왜 OpenClaw가 그룹에서 응답하지 않나요?">
    일반적인 원인 두 가지:

    - 멘션 게이팅이 켜져 있습니다(기본값). 봇을 @멘션해야 하거나 `mentionPatterns`와 일치해야 합니다.
    - `channels.whatsapp.groups`를 `"*"` 없이 구성했고 해당 그룹이 allowlist에 없습니다.

    [그룹](/ko/channels/groups) 및 [그룹 메시지](/ko/channels/group-messages)를 참조하세요.

  </Accordion>

  <Accordion title="그룹/스레드는 DM과 컨텍스트를 공유하나요?">
    직접 채팅은 기본적으로 메인 세션으로 축소됩니다. 그룹/채널은 자체 세션 키를 가지며, Telegram 토픽 / Discord 스레드도 별도의 세션입니다. [그룹](/ko/channels/groups) 및 [그룹 메시지](/ko/channels/group-messages)를 참조하세요.
  </Accordion>

  <Accordion title="워크스페이스와 agent는 몇 개까지 만들 수 있나요?">
    하드 제한은 없습니다. 수십 개(심지어 수백 개)도 괜찮지만, 다음 사항을 주의하세요:

    - **디스크 증가:** sessions + 대화 기록은 `~/.openclaw/agents/<agentId>/sessions/` 아래에 저장됩니다.
    - **토큰 비용:** agent가 많을수록 동시에 사용하는 모델도 많아집니다.
    - **운영 오버헤드:** agent별 auth profile, workspace, 채널 라우팅.

    팁:

    - agent당 **활성** 워크스페이스 하나를 유지하세요(`agents.defaults.workspace`).
    - 디스크가 커지면 오래된 세션을 정리하세요(JSONL 또는 store 항목 삭제).
    - `openclaw doctor`를 사용해 흩어진 워크스페이스와 프로필 불일치를 찾아보세요.

  </Accordion>

  <Accordion title="여러 봇이나 채팅을 동시에 실행할 수 있나요(Slack)? 어떻게 설정해야 하나요?">
    예. **Multi-Agent Routing**을 사용해 여러 개의 격리된 agent를 실행하고,
    채널/계정/피어별로 인바운드 메시지를 라우팅할 수 있습니다. Slack은 채널로 지원되며 특정 agent에 바인딩할 수 있습니다.

    브라우저 접근은 강력하지만 "사람이 할 수 있는 모든 것"을 뜻하지는 않습니다. 봇 차단, CAPTCHA, MFA는
    여전히 자동화를 막을 수 있습니다. 가장 안정적인 브라우저 제어를 위해서는 호스트에서 로컬 Chrome MCP를 사용하거나,
    실제로 브라우저를 실행하는 머신에서 CDP를 사용하세요.

    모범 사례 설정:

    - 항상 켜져 있는 Gateway 호스트(VPS/Mac mini).
    - 역할별 agent 하나씩(바인딩).
    - 해당 agent에 바인딩된 Slack 채널.
    - 필요 시 Chrome MCP 또는 Node를 통한 로컬 브라우저.

    문서: [Multi-Agent Routing](/ko/concepts/multi-agent), [Slack](/ko/channels/slack),
    [브라우저](/ko/tools/browser), [Nodes](/ko/nodes).

  </Accordion>
</AccordionGroup>

## 모델, 장애 조치, auth profile

모델 Q&A — 기본값, 선택, 별칭, 전환, 장애 조치, auth profile —
은 [모델 FAQ](/ko/help/faq-models)에 있습니다.

## Gateway: 포트, "이미 실행 중", 원격 모드

<AccordionGroup>
  <Accordion title="Gateway는 어떤 포트를 사용하나요?">
    `gateway.port`는 WebSocket + HTTP(Control UI, hooks 등)를 위한 단일 다중화 포트를 제어합니다.

    우선순위:

    ```
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 기본값 18789
    ```

  </Accordion>

  <Accordion title='왜 openclaw gateway status에는 "Runtime: running"이라고 나오는데 "Connectivity probe: failed"라고 표시되나요?'>
    "running"은 **supervisor**의 관점(launchd/systemd/schtasks)이고, connectivity probe는 CLI가 실제로 gateway WebSocket에 연결을 시도한 결과이기 때문입니다.

    `openclaw gateway status`를 사용하고 다음 줄을 신뢰하세요:

    - `Probe target:`(probe가 실제로 사용한 URL)
    - `Listening:`(포트에 실제로 바인딩된 내용)
    - `Last gateway error:`(프로세스는 살아 있지만 포트가 수신하지 않을 때의 일반적인 근본 원인)

  </Accordion>

  <Accordion title='왜 openclaw gateway status에 "Config (cli)"와 "Config (service)"가 다르게 표시되나요?'>
    편집 중인 구성 파일과 서비스가 실행 중인 구성 파일이 다릅니다(대개 `--profile` / `OPENCLAW_STATE_DIR` 불일치).

    해결 방법:

    ```bash
    openclaw gateway install --force
    ```

    서비스가 사용하길 원하는 동일한 `--profile` / 환경에서 이 명령을 실행하세요.

  </Accordion>

  <Accordion title='"another gateway instance is already listening"은 무슨 뜻인가요?'>
    OpenClaw는 시작 시 즉시 WebSocket 리스너를 바인딩하여 런타임 잠금을 강제합니다(기본값 `ws://127.0.0.1:18789`). 바인딩이 `EADDRINUSE`로 실패하면 다른 인스턴스가 이미 수신 중임을 나타내는 `GatewayLockError`를 발생시킵니다.

    해결 방법: 다른 인스턴스를 중지하거나, 포트를 비우거나, `openclaw gateway --port <port>`로 실행하세요.

  </Accordion>

  <Accordion title="원격 모드(클라이언트가 다른 곳의 Gateway에 연결)로 OpenClaw를 실행하려면 어떻게 하나요?">
    `gateway.mode: "remote"`를 설정하고 원격 WebSocket URL을 지정하세요. 필요하면 shared-secret 원격 자격 증명도 함께 설정할 수 있습니다:

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
    - macOS 앱은 구성 파일을 감시하며 이 값이 바뀌면 실시간으로 모드를 전환합니다.
    - `gateway.remote.token` / `.password`는 클라이언트 측 원격 자격 증명일 뿐이며, 그 자체로 로컬 gateway 인증을 활성화하지는 않습니다.

  </Accordion>

  <Accordion title='Control UI에 "unauthorized"가 표시되거나 계속 재연결됩니다. 이제 어떻게 하나요?'>
    gateway 인증 경로와 UI의 인증 방식이 일치하지 않습니다.

    사실(코드 기준):

    - Control UI는 현재 브라우저 탭 세션과 선택된 gateway URL에 대한 토큰을 `sessionStorage`에 보관하므로, 동일 탭에서 새로고침해도 장기 `localStorage` 토큰 저장을 복원하지 않고 계속 동작합니다.
    - `AUTH_TOKEN_MISMATCH`가 발생하면, 신뢰된 클라이언트는 gateway가 재시도 힌트(`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)를 반환할 때 캐시된 장치 토큰으로 제한된 재시도 1회를 시도할 수 있습니다.
    - 이 캐시된 토큰 재시도는 이제 장치 토큰과 함께 저장된 승인된 범위를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 캐시된 범위를 상속하지 않고 요청한 범위 집합을 유지합니다.
    - 해당 재시도 경로 밖에서는 연결 인증 우선순위가 명시적 shared token/password 먼저, 그다음 명시적 `deviceToken`, 그다음 저장된 장치 토큰, 그다음 bootstrap token 순입니다.
    - Bootstrap token 범위 검사는 role 접두사를 사용합니다. 기본 제공 bootstrap operator allowlist는 operator 요청만 충족하며, node 또는 다른 비-operator 역할은 여전히 자체 role 접두사 아래 범위가 필요합니다.

    해결 방법:

    - 가장 빠른 방법: `openclaw dashboard`(dashboard URL을 출력하고 복사하며 열기를 시도함; headless이면 SSH 힌트 표시).
    - 아직 토큰이 없다면: `openclaw doctor --generate-gateway-token`.
    - 원격이라면 먼저 터널링: `ssh -N -L 18789:127.0.0.1:18789 user@host` 후 `http://127.0.0.1:18789/` 열기.
    - Shared-secret 모드: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 설정한 뒤, Control UI 설정에 일치하는 secret을 붙여 넣으세요.
    - Tailscale Serve 모드: `gateway.auth.allowTailscale`이 활성화되어 있고, Tailscale identity 헤더를 우회하는 원시 loopback/tailnet URL이 아니라 Serve URL을 열고 있는지 확인하세요.
    - Trusted-proxy 모드: 동일 호스트 loopback 프록시나 원시 gateway URL이 아니라, 구성된 비루프백 identity-aware 프록시를 통해 접근하는지 확인하세요.
    - 한 번의 재시도 후에도 불일치가 계속되면 페어링된 장치 토큰을 교체/재승인하세요:
      - `openclaw devices list`
      - `openclaw devices rotate --device <id> --role operator`
    - 해당 rotate 호출이 거부되었다고 나오면 두 가지를 확인하세요:
      - 페어링된 장치 세션은 `operator.admin` 권한도 없는 한 **자기 자신의** 장치만 교체할 수 있습니다
      - 명시적 `--scope` 값은 호출자의 현재 operator 범위를 초과할 수 없습니다
    - 여전히 막혔나요? `openclaw status --all`을 실행하고 [문제 해결](/ko/gateway/troubleshooting)을 따르세요. 인증 세부 정보는 [Dashboard](/ko/web/dashboard)를 참조하세요.

  </Accordion>

  <Accordion title="gateway.bind를 tailnet으로 설정했는데 바인딩할 수 없고 아무것도 수신하지 않습니다">
    `tailnet` 바인드는 네트워크 인터페이스에서 Tailscale IP(100.64.0.0/10)를 선택합니다. 머신이 Tailscale에 연결되어 있지 않거나(또는 인터페이스가 내려가 있으면) 바인딩할 대상이 없습니다.

    해결 방법:

    - 해당 호스트에서 Tailscale을 시작하여 100.x 주소를 갖게 하거나,
    - `gateway.bind: "loopback"` / `"lan"`으로 전환하세요.

    참고: `tailnet`은 명시적입니다. `auto`는 loopback을 우선합니다. tailnet 전용 바인드를 원할 때는 `gateway.bind: "tailnet"`을 사용하세요.

  </Accordion>

  <Accordion title="같은 호스트에서 여러 Gateway를 실행할 수 있나요?">
    보통은 아닙니다. 하나의 Gateway가 여러 메시징 채널과 agent를 실행할 수 있습니다. 중복성(예: 구조용 봇)이나 강한 격리가 필요할 때만 여러 Gateway를 사용하세요.

    가능은 하지만 다음을 격리해야 합니다:

    - `OPENCLAW_CONFIG_PATH`(인스턴스별 구성)
    - `OPENCLAW_STATE_DIR`(인스턴스별 상태)
    - `agents.defaults.workspace`(워크스페이스 격리)
    - `gateway.port`(고유 포트)

    빠른 설정(권장):

    - 인스턴스별로 `openclaw --profile <name> ...`를 사용하세요(`~/.openclaw-<name>` 자동 생성).
    - 각 프로필 구성에서 고유한 `gateway.port`를 설정하세요(또는 수동 실행 시 `--port` 전달).
    - 프로필별 서비스를 설치하세요: `openclaw --profile <name> gateway install`.

    프로필은 서비스 이름에도 접미사를 붙입니다(`ai.openclaw.<profile>`; 레거시 `com.openclaw.*`, `openclaw-gateway-<profile>.service`, `OpenClaw Gateway (<profile>)`).
    전체 가이드: [여러 gateway](/ko/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / 코드 1008은 무슨 뜻인가요?'>
    Gateway는 **WebSocket 서버**이며, 첫 번째 메시지가 반드시
    `connect` 프레임이기를 기대합니다. 다른 것이 들어오면 연결을
    **코드 1008**(정책 위반)로 종료합니다.

    일반적인 원인:

    - 브라우저에서 **HTTP** URL(`http://...`)을 열었고 WS 클라이언트를 사용하지 않았습니다.
    - 잘못된 포트나 경로를 사용했습니다.
    - 프록시나 터널이 인증 헤더를 제거했거나 Gateway가 아닌 요청을 보냈습니다.

    빠른 해결 방법:

    1. WS URL을 사용하세요: `ws://<host>:18789`(HTTPS라면 `wss://...`).
    2. WS 포트를 일반 브라우저 탭에서 열지 마세요.
    3. 인증이 켜져 있으면 `connect` 프레임에 토큰/비밀번호를 포함하세요.

    CLI 또는 TUI를 사용하는 경우 URL은 다음과 같아야 합니다:

    ```
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    프로토콜 세부 정보: [Gateway 프로토콜](/ko/gateway/protocol).

  </Accordion>
</AccordionGroup>

## 로깅 및 디버깅

<AccordionGroup>
  <Accordion title="로그는 어디에 있나요?">
    파일 로그(구조화됨):

    ```
    /tmp/openclaw/openclaw-YYYY-MM-DD.log
    ```

    `logging.file`로 고정 경로를 설정할 수 있습니다. 파일 로그 레벨은 `logging.level`로 제어합니다. 콘솔 출력 수준은 `--verbose`와 `logging.consoleLevel`로 제어합니다.

    가장 빠른 로그 tail:

    ```bash
    openclaw logs --follow
    ```

    서비스/supervisor 로그(gateway가 launchd/systemd로 실행될 때):

    - macOS: `$OPENCLAW_STATE_DIR/logs/gateway.log` 및 `gateway.err.log`(기본값: `~/.openclaw/logs/...`; 프로필은 `~/.openclaw-<profile>/logs/...`)
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

    자세한 내용은 [문제 해결](/ko/gateway/troubleshooting)을 참조하세요.

  </Accordion>

  <Accordion title="Gateway 서비스를 시작/중지/재시작하려면 어떻게 하나요?">
    gateway helper를 사용하세요:

    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    gateway를 수동으로 실행하는 경우 `openclaw gateway --force`로 포트를 다시 점유할 수 있습니다. [Gateway](/ko/gateway)를 참조하세요.

  </Accordion>

  <Accordion title="Windows에서 터미널을 닫아버렸습니다. OpenClaw를 어떻게 다시 시작하나요?">
    Windows에는 **두 가지 설치 모드**가 있습니다:

    **1) WSL2(권장):** Gateway가 Linux 내부에서 실행됩니다.

    PowerShell을 열고 WSL에 들어간 다음 재시작하세요:

    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```

    서비스를 설치한 적이 없다면 포그라운드에서 시작하세요:

    ```bash
    openclaw gateway run
    ```

    **2) 네이티브 Windows(권장하지 않음):** Gateway가 Windows에서 직접 실행됩니다.

    PowerShell을 열고 다음을 실행하세요:

    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```

    수동 실행 중이라면(서비스 없음) 다음을 사용하세요:

    ```powershell
    openclaw gateway run
    ```

    문서: [Windows (WSL2)](/ko/platforms/windows), [Gateway 서비스 런북](/ko/gateway).

  </Accordion>

  <Accordion title="Gateway는 살아 있는데 응답이 오지 않습니다. 무엇을 확인해야 하나요?">
    먼저 빠른 상태 점검을 해보세요:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    일반적인 원인:

    - **gateway 호스트**에서 모델 인증이 로드되지 않았습니다(`models status` 확인).
    - 채널 페어링/allowlist가 응답을 차단하고 있습니다(채널 구성 + 로그 확인).
    - 올바른 토큰 없이 WebChat/Dashboard를 열었습니다.

    원격 환경이라면 터널/Tailscale 연결이 살아 있고
    Gateway WebSocket에 연결 가능한지 확인하세요.

    문서: [채널](/ko/channels), [문제 해결](/ko/gateway/troubleshooting), [원격 액세스](/ko/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 이제 어떻게 하나요?'>
    이는 보통 UI가 WebSocket 연결을 잃었다는 뜻입니다. 다음을 확인하세요:

    1. Gateway가 실행 중인가요? `openclaw gateway status`
    2. Gateway가 정상인가요? `openclaw status`
    3. UI에 올바른 토큰이 있나요? `openclaw dashboard`
    4. 원격이라면 터널/Tailscale 연결이 살아 있나요?

    그런 다음 로그를 tail하세요:

    ```bash
    openclaw logs --follow
    ```

    문서: [Dashboard](/ko/web/dashboard), [원격 액세스](/ko/gateway/remote), [문제 해결](/ko/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands가 실패합니다. 무엇을 확인해야 하나요?">
    먼저 로그와 채널 상태를 확인하세요:

    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    그런 다음 오류에 맞춰 확인하세요:

    - `BOT_COMMANDS_TOO_MUCH`: Telegram 메뉴에 항목이 너무 많습니다. OpenClaw는 이미 Telegram 제한에 맞게 줄이고 더 적은 명령으로 재시도하지만, 일부 메뉴 항목은 여전히 제거해야 합니다. Plugin/skill/사용자 지정 명령 수를 줄이거나, 메뉴가 필요하지 않다면 `channels.telegram.commands.native`를 비활성화하세요.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!`, 또는 유사한 네트워크 오류: VPS에서 실행 중이거나 프록시 뒤에 있다면 `api.telegram.org`에 대한 아웃바운드 HTTPS가 허용되고 DNS가 정상 작동하는지 확인하세요.

    Gateway가 원격이라면 Gateway 호스트의 로그를 보고 있는지 확인하세요.

    문서: [Telegram](/ko/channels/telegram), [채널 문제 해결](/ko/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI에 출력이 보이지 않습니다. 무엇을 확인해야 하나요?">
    먼저 Gateway에 연결할 수 있고 agent를 실행할 수 있는지 확인하세요:

    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI에서는 `/status`를 사용해 현재 상태를 확인하세요. 채팅
    채널에서 응답을 기대한다면 전달이 활성화되어 있는지(`/deliver on`) 확인하세요.

    문서: [TUI](/ko/web/tui), [슬래시 명령](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway를 완전히 중지한 다음 다시 시작하려면 어떻게 하나요?">
    서비스를 설치했다면:

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    이렇게 하면 **관리되는 서비스**(macOS의 launchd, Linux의 systemd)가 중지/시작됩니다.
    Gateway가 데몬으로 백그라운드에서 실행될 때 이 방법을 사용하세요.

    포그라운드에서 실행 중이라면 Ctrl-C로 중지한 다음:

    ```bash
    openclaw gateway run
    ```

    문서: [Gateway 서비스 런북](/ko/gateway).

  </Accordion>

  <Accordion title="ELI5: openclaw gateway restart와 openclaw gateway의 차이">
    - `openclaw gateway restart`: **백그라운드 서비스**(launchd/systemd)를 재시작합니다.
    - `openclaw gateway`: 이 터미널 세션에서 gateway를 **포그라운드로** 실행합니다.

    서비스를 설치했다면 gateway 명령을 사용하세요. `openclaw gateway`는
    일회성 포그라운드 실행을 원할 때 사용하세요.

  </Accordion>

  <Accordion title="문제가 발생했을 때 더 자세한 정보를 가장 빨리 얻는 방법">
    Gateway를 `--verbose`로 시작해 콘솔에 더 많은 세부 정보를 표시하세요. 그런 다음 로그 파일에서 채널 인증, 모델 라우팅, RPC 오류를 확인하세요.
  </Accordion>
</AccordionGroup>

## 미디어 및 첨부 파일

<AccordionGroup>
  <Accordion title="내 skill이 이미지/PDF를 생성했지만 아무것도 전송되지 않았습니다">
    agent의 아웃바운드 첨부 파일에는 `MEDIA:<path-or-url>` 줄이 포함되어야 합니다(해당 줄만 단독으로). [OpenClaw 어시스턴트 설정](/ko/start/openclaw) 및 [Agent send](/ko/tools/agent-send)를 참조하세요.

    CLI 전송:

    ```bash
    openclaw message send --target +15555550123 --message "여기 있습니다" --media /path/to/file.png
    ```

    다음도 확인하세요:

    - 대상 채널이 아웃바운드 미디어를 지원하며 allowlist 때문에 차단되지 않았는지.
    - 파일이 provider의 크기 제한 내에 있는지(이미지는 최대 2048px로 크기 조정됨).
    - `tools.fs.workspaceOnly=true`이면 로컬 경로 전송이 workspace, temp/media-store, 샌드박스 검증 파일로 제한됩니다.
    - `tools.fs.workspaceOnly=false`이면 agent가 이미 읽을 수 있는 호스트 로컬 파일을 `MEDIA:`로 전송할 수 있지만, 미디어와 안전한 문서 형식(이미지, 오디오, 비디오, PDF, Office 문서)에만 해당합니다. 일반 텍스트와 비밀 정보로 보이는 파일은 여전히 차단됩니다.

    [이미지](/ko/nodes/images)를 참조하세요.

  </Accordion>
</AccordionGroup>

## 보안 및 액세스 제어

<AccordionGroup>
  <Accordion title="OpenClaw를 인바운드 DM에 노출해도 안전한가요?">
    인바운드 DM은 신뢰할 수 없는 입력으로 취급하세요. 기본값은 위험을 줄이도록 설계되어 있습니다:

    - DM이 가능한 채널의 기본 동작은 **pairing**입니다:
      - 알 수 없는 발신자는 pairing 코드를 받으며, 봇은 해당 메시지를 처리하지 않습니다.
      - 다음으로 승인합니다: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
      - 대기 중인 요청은 **채널당 3개**로 제한됩니다. 코드가 도착하지 않았다면 `openclaw pairing list --channel <channel> [--account <id>]`를 확인하세요.
    - DM을 공개적으로 열려면 명시적인 opt-in이 필요합니다(`dmPolicy: "open"` 및 allowlist `"*"`).

    위험한 DM 정책을 확인하려면 `openclaw doctor`를 실행하세요.

  </Accordion>

  <Accordion title="프롬프트 인젝션은 공개 봇에만 해당하는 문제인가요?">
    아니요. 프롬프트 인젝션은 누가 DM을 보내는지가 아니라 **신뢰할 수 없는 콘텐츠**에 관한 문제입니다.
    어시스턴트가 외부 콘텐츠(웹 검색/가져오기, 브라우저 페이지, 이메일,
    문서, 첨부 파일, 붙여 넣은 로그)를 읽는다면 그 콘텐츠에는 모델을
    탈취하려는 지시가 포함될 수 있습니다. **발신자가 사용자 자신뿐이어도**
    이런 일은 발생할 수 있습니다.

    가장 큰 위험은 도구가 활성화된 경우입니다. 모델이 컨텍스트를
    유출하거나 사용자를 대신해 도구를 호출하도록 속을 수 있습니다. 위험 범위를 줄이려면 다음을 사용하세요:

    - 읽기 전용 또는 도구가 비활성화된 "reader" agent로 신뢰할 수 없는 콘텐츠를 요약
    - 도구가 활성화된 agent에서는 `web_search` / `web_fetch` / `browser`를 비활성화
    - 디코딩된 파일/문서 텍스트도 신뢰할 수 없는 것으로 취급: OpenResponses
      `input_file`과 미디어 첨부 파일 추출은 원시 파일 텍스트를 그대로 전달하는 대신,
      추출된 텍스트를 명시적인 외부 콘텐츠 경계 마커로 감쌉니다
    - 샌드박싱과 엄격한 도구 allowlist

    자세한 내용: [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="봇에 전용 이메일, GitHub 계정, 또는 전화번호가 있어야 하나요?">
    대부분의 설정에서는 그렇습니다. 봇을 별도 계정과 전화번호로 분리하면
    문제가 발생했을 때 영향 범위를 줄일 수 있습니다. 또한 이렇게 하면
    개인 계정에 영향을 주지 않고 자격 증명을 교체하거나 액세스를 취소하기가 더 쉬워집니다.

    작게 시작하세요. 실제로 필요한 도구와 계정에만 액세스를 주고,
    필요할 때 나중에 확장하세요.

    문서: [보안](/ko/gateway/security), [Pairing](/ko/channels/pairing).

  </Accordion>

  <Accordion title="내 문자 메시지에 대한 자율성을 부여해도 되나요? 안전한가요?">
    개인 메시지에 대한 완전한 자율성은 **권장하지 않습니다**. 가장 안전한 패턴은 다음과 같습니다:

    - DM은 **pairing 모드** 또는 엄격한 allowlist로 유지합니다.
    - 사용자를 대신해 메시지를 보내게 하려면 **별도 번호 또는 계정**을 사용합니다.
    - 초안을 작성하게 한 뒤 **전송 전에 승인**합니다.

    실험해 보고 싶다면 전용 계정에서 하고 격리 상태를 유지하세요. [보안](/ko/gateway/security)을 참조하세요.

  </Accordion>

  <Accordion title="개인용 어시스턴트 작업에 더 저렴한 모델을 사용할 수 있나요?">
    예. 단, agent가 채팅 전용이고 입력이 신뢰할 수 있는 경우에만 권장됩니다. 더 작은 등급의 모델은
    지시 탈취에 더 취약하므로, 도구가 활성화된 agent나
    신뢰할 수 없는 콘텐츠를 읽을 때는 피하세요. 꼭 더 작은 모델을 사용해야 한다면
    도구를 잠그고 샌드박스 안에서 실행하세요. [보안](/ko/gateway/security)을 참조하세요.
  </Accordion>

  <Accordion title='Telegram에서 /start를 실행했지만 pairing 코드를 받지 못했습니다'>
    pairing 코드는 알 수 없는 발신자가 봇에 메시지를 보내고
    `dmPolicy: "pairing"`이 활성화된 경우에만 전송됩니다. `/start`만으로는 코드가 생성되지 않습니다.

    대기 중인 요청 확인:

    ```bash
    openclaw pairing list telegram
    ```

    즉시 액세스하려면 발신자 ID를 allowlist에 추가하거나 해당 계정의 `dmPolicy: "open"`을 설정하세요.

  </Accordion>

  <Accordion title="WhatsApp: 내 연락처에 메시지를 보내나요? pairing은 어떻게 작동하나요?">
    아니요. 기본 WhatsApp DM 정책은 **pairing**입니다. 알 수 없는 발신자는 pairing 코드만 받고 해당 메시지는 **처리되지 않습니다**. OpenClaw는 수신한 채팅이나 사용자가 명시적으로 트리거한 전송에만 응답합니다.

    pairing 승인:

    ```bash
    openclaw pairing approve whatsapp <code>
    ```

    대기 중인 요청 목록:

    ```bash
    openclaw pairing list whatsapp
    ```

    Wizard 전화번호 프롬프트: 이는 사용자 자신의 DM을 허용하도록 **allowlist/owner**를 설정하는 데 사용됩니다. 자동 전송에는 사용되지 않습니다. 개인 WhatsApp 번호로 실행하는 경우 그 번호를 사용하고 `channels.whatsapp.selfChatMode`를 활성화하세요.

  </Accordion>
</AccordionGroup>

## 채팅 명령, 작업 중단, 그리고 "멈추지 않음"

<AccordionGroup>
  <Accordion title="내부 시스템 메시지가 채팅에 표시되지 않게 하려면 어떻게 하나요?">
    대부분의 내부 또는 도구 메시지는 해당 세션에서 **verbose**, **trace**, **reasoning**이 활성화된 경우에만
    표시됩니다.

    표시되는 채팅에서 다음으로 끄세요:

    ```
    /verbose off
    /trace off
    /reasoning off
    ```

    그래도 시끄럽다면 Control UI의 세션 설정을 확인하고 verbose를
    **inherit**로 설정하세요. 또한 구성에서 `verboseDefault`가
    `on`으로 설정된 봇 프로필을 사용 중이 아닌지도 확인하세요.

    문서: [Thinking 및 verbose](/ko/tools/thinking), [보안](/ko/gateway/security#reasoning-verbose-output-in-groups).

  </Accordion>

  <Accordion title="실행 중인 작업을 중지/취소하려면 어떻게 하나요?">
    다음 중 하나를 **독립된 메시지로** 보내세요(슬래시 없음):

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

    이것들은 중단 트리거이며(슬래시 명령 아님).

    백그라운드 프로세스(exec 도구에서 생성된 경우)의 경우 agent에게 다음을 실행하라고 요청할 수 있습니다:

    ```
    process action:kill sessionId:XXX
    ```

    슬래시 명령 개요는 [슬래시 명령](/ko/tools/slash-commands)을 참조하세요.

    대부분의 명령은 `/`로 시작하는 **독립된** 메시지로 보내야 하지만, 몇몇 단축 명령(`/status` 등)은 allowlist된 발신자에게는 인라인으로도 작동합니다.

  </Accordion>

  <Accordion title='Telegram에서 Discord 메시지를 보내려면 어떻게 하나요? ("Cross-context messaging denied")'>
    OpenClaw는 기본적으로 **교차 provider** 메시징을 차단합니다. 도구 호출이
    Telegram에 바인딩되어 있으면, 명시적으로 허용하지 않는 한 Discord로 전송되지 않습니다.

    agent에 대해 교차 provider 메시징을 활성화하세요:

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

    구성을 편집한 뒤 gateway를 재시작하세요.

  </Accordion>

  <Accordion title='왜 봇이 빠르게 연달아 보내는 메시지를 "무시"하는 것처럼 느껴지나요?'>
    대기열 모드는 새 메시지가 진행 중인 실행과 어떻게 상호작용하는지 제어합니다. `/queue`로 모드를 변경하세요:

    - `steer` - 새 메시지가 현재 작업의 방향을 바꿈
    - `followup` - 메시지를 한 번에 하나씩 실행
    - `collect` - 메시지를 모아 한 번만 응답(기본값)
    - `steer-backlog` - 지금 방향을 바꾸고, 그다음 백로그 처리
    - `interrupt` - 현재 실행을 중단하고 새로 시작

    followup 모드에는 `debounce:2s cap:25 drop:summarize` 같은 옵션을 추가할 수 있습니다.

  </Accordion>
</AccordionGroup>

## 기타

<AccordionGroup>
  <Accordion title='API 키를 사용할 때 Anthropic의 기본 모델은 무엇인가요?'>
    OpenClaw에서는 자격 증명과 모델 선택이 별개입니다. `ANTHROPIC_API_KEY`를 설정하거나(auth profile에 Anthropic API 키를 저장하는 것도 포함) 하면 인증은 활성화되지만, 실제 기본 모델은 `agents.defaults.model.primary`에 구성한 값입니다(예: `anthropic/claude-sonnet-4-6` 또는 `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"`가 표시된다면, 실행 중인 agent에 대해 Gateway가 예상된 `auth-profiles.json`에서 Anthropic 자격 증명을 찾지 못했다는 뜻입니다.
  </Accordion>
</AccordionGroup>

---

여전히 해결되지 않나요? [Discord](https://discord.com/invite/clawd)에서 문의하거나 [GitHub discussion](https://github.com/openclaw/openclaw/discussions)을 열어 주세요.

## 관련 문서

- [첫 실행 FAQ](/ko/help/faq-first-run) — 설치, 온보딩, 인증, 구독, 초기 실패
- [모델 FAQ](/ko/help/faq-models) — 모델 선택, 장애 조치, auth profile
- [문제 해결](/ko/help/troubleshooting) — 증상 중심 분류
