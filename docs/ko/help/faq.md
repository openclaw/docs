---
read_when:
    - 일반적인 설정, 설치, 온보딩 또는 런타임 지원 질문에 답변하기
    - 심층 디버깅 전에 사용자가 보고한 문제 분류하기
summary: OpenClaw 설정, 구성 및 사용에 관한 자주 묻는 질문
title: 자주 묻는 질문
x-i18n:
    generated_at: "2026-07-12T15:23:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80b94b9d403d04cde5c734927502393417d5f1bfd50c2505b6b4fdcfcdc9f524
    source_path: help/faq.md
    workflow: 16
---

실제 환경 설정(로컬 개발, VPS, 다중 에이전트, OAuth/API 키, 모델 장애 조치)을 위한 빠른 답변과 심층 문제 해결 방법을 제공합니다. 런타임 진단은 [문제 해결](/ko/gateway/troubleshooting)을 참조하십시오. 전체 구성 레퍼런스는 [구성](/ko/gateway/configuration)을 참조하십시오.

## 문제가 발생했을 때 먼저 확인할 60초 절차

<Steps>
  <Step title="빠른 상태 확인">
    ```bash
    openclaw status
    ```
    빠른 로컬 요약: OS 및 업데이트, Gateway/서비스 연결 가능 여부, 에이전트/세션, 제공자 구성 및 런타임 문제(Gateway에 연결할 수 있는 경우)를 보여 줍니다.
  </Step>
  <Step title="붙여넣을 수 있는 보고서(안전하게 공유 가능)">
    ```bash
    openclaw status --all
    ```
    로그 끝부분이 포함된 읽기 전용 진단입니다(토큰은 마스킹됨).
  </Step>
  <Step title="데몬 및 포트 상태">
    ```bash
    openclaw gateway status
    ```
    슈퍼바이저 런타임과 RPC 연결 가능 여부, 프로브 대상 URL, 서비스에서 사용했을 가능성이 높은 구성을 보여 줍니다.
  </Step>
  <Step title="심층 프로브">
    ```bash
    openclaw status --deep
    ```
    지원되는 경우 채널 프로브를 포함한 실시간 Gateway 상태 프로브입니다(연결 가능한 Gateway 필요). [상태](/ko/gateway/health)를 참조하십시오.
  </Step>
  <Step title="최신 로그 추적">
    ```bash
    openclaw logs --follow
    ```
    RPC가 중단된 경우 다음 명령으로 대체하십시오.
    ```bash
    tail -f "$(ls -t /tmp/openclaw/openclaw-*.log | head -1)"
    ```
    파일 로그는 서비스 로그와 별개입니다. [로깅](/ko/logging) 및 [문제 해결](/ko/gateway/troubleshooting)을 참조하십시오.
  </Step>
  <Step title="doctor 실행(복구)">
    ```bash
    openclaw doctor
    ```
    구성과 상태를 복구/마이그레이션한 다음 상태 검사를 실행합니다. [Doctor](/ko/gateway/doctor)를 참조하십시오.
  </Step>
  <Step title="Gateway 스냅샷(WS 전용)">
    ```bash
    openclaw health --json
    openclaw health --verbose   # shows the target URL + config path on errors
    ```
    실행 중인 Gateway에 전체 스냅샷을 요청합니다. [상태](/ko/gateway/health)를 참조하십시오.
  </Step>
</Steps>

## 빠른 시작 및 최초 실행 설정

설치, 온보딩, 인증 경로, 구독, 초기 오류에 관한 최초 실행 Q&A는 [최초 실행 FAQ](/ko/help/faq-first-run)에 있습니다.

## OpenClaw란 무엇인가요?

<AccordionGroup>
  <Accordion title="OpenClaw를 한 문단으로 설명하면 무엇인가요?">
    OpenClaw는 사용자가 자신의 기기에서 실행하는 개인용 AI 어시스턴트입니다. 이미 사용 중인 메시징 환경(Discord, Google Chat, iMessage, Mattermost, Signal, Slack, Telegram, WebChat, WhatsApp 및 QQ Bot과 같은 번들 채널 Plugin)에서 응답하며, 지원되는 플랫폼에서는 음성 기능과 실시간 Canvas도 사용할 수 있습니다. **Gateway**는 항상 실행되는 제어 영역이며, 어시스턴트가 실제 제품입니다.
  </Accordion>

  <Accordion title="가치 제안">
    OpenClaw는 "단순한 Claude 래퍼"가 아닙니다. **사용자 소유 하드웨어**에서 강력한 어시스턴트를 실행하고 이미 사용 중인 채팅 앱에서 접근할 수 있게 해 주는 **로컬 우선 제어 영역**이며, 상태가 유지되는 세션, 메모리, 도구를 제공합니다. 따라서 워크플로를 호스팅형 SaaS에 넘기지 않아도 됩니다.

    - **사용자의 기기와 데이터**: 원하는 위치(Mac, Linux, VPS)에서 Gateway를 실행하고 워크스페이스와 세션 기록을 로컬에 보관합니다.
    - **웹 샌드박스가 아닌 실제 채널**: Discord/iMessage/Signal/Slack/Telegram/WhatsApp 등을 지원하며, 지원되는 플랫폼에서는 모바일 음성과 Canvas도 제공합니다.
    - **모델 독립적**: Anthropic, MiniMax, OpenAI, OpenRouter 등을 에이전트별 라우팅 및 장애 조치와 함께 사용할 수 있습니다.
    - **로컬 전용 옵션**: 로컬 모델을 실행하여 모든 데이터를 기기에 보관할 수 있습니다.
    - **다중 에이전트 라우팅**: 채널, 계정 또는 작업별로 에이전트를 분리하고 각각 자체 워크스페이스와 기본값을 사용하도록 설정할 수 있습니다.
    - **오픈 소스이며 자유롭게 수정 가능**: 공급업체 종속 없이 검사하고 확장하며 자체 호스팅할 수 있습니다.

    문서: [Gateway](/ko/gateway), [채널](/ko/channels), [다중 에이전트](/ko/concepts/multi-agent), [메모리](/ko/concepts/memory).

  </Accordion>

  <Accordion title="방금 설정을 마쳤습니다. 먼저 무엇을 해야 하나요?">
    처음 시작하기 좋은 프로젝트로는 웹사이트 구축(WordPress, Shopify 또는 정적 사이트), 모바일 앱 프로토타입 제작(개요, 화면, API 계획), 파일 및 폴더 정리, Gmail 연결 후 요약이나 후속 작업 자동화 등이 있습니다.

    대규모 작업도 처리할 수 있지만, 병렬 작업을 위한 하위 에이전트와 함께 여러 단계로 나누면 가장 효과적입니다.

  </Accordion>

  <Accordion title="OpenClaw의 대표적인 일상 활용 사례 다섯 가지는 무엇인가요?">
    - **개인 브리핑**: 받은편지함, 일정 및 관심 있는 뉴스의 요약을 제공합니다.
    - **조사 및 초안 작성**: 이메일이나 문서를 위한 빠른 조사, 요약 및 초안을 작성합니다.
    - **알림 및 후속 작업**: Cron 또는 Heartbeat 기반 알림과 체크리스트를 제공합니다.
    - **브라우저 자동화**: 양식 작성, 데이터 수집 및 반복적인 웹 작업을 수행합니다.
    - **기기 간 조정**: 휴대폰에서 작업을 보내고, 서버의 Gateway가 작업을 실행하도록 한 다음, 채팅으로 결과를 돌려받습니다.

  </Accordion>

  <Accordion title="OpenClaw가 SaaS의 잠재 고객 발굴, 아웃리치, 광고 및 블로그 작업을 지원할 수 있나요?">
    예. 사이트 검색, 후보 목록 작성, 잠재 고객 요약, 아웃리치 또는 광고 문안 초안 작성과 같은 **조사, 자격 평가 및 초안 작성**에 사용할 수 있습니다.

    **아웃리치 또는 광고 실행**에는 반드시 사람이 개입해야 합니다. 스팸을 피하고 현지 법률과 플랫폼 정책을 준수하며, 전송 전에 모든 내용을 검토하십시오. OpenClaw가 초안을 작성하고 사용자가 승인하도록 하십시오.

    문서: [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="웹 개발에서 Claude Code와 비교했을 때 어떤 장점이 있나요?">
    OpenClaw는 IDE를 대체하는 도구가 아니라 **개인용 어시스턴트**이자 조정 계층입니다. 저장소 내부에서 가장 빠르게 직접 코딩하려면 Claude Code 또는 Codex를 사용하십시오. 지속적인 메모리, 기기 간 접근 및 도구 오케스트레이션에는 OpenClaw를 사용하십시오.

    - 세션 간 지속되는 메모리와 워크스페이스.
    - 다중 플랫폼 접근(Telegram, WhatsApp, TUI, WebChat).
    - 도구 오케스트레이션(브라우저, 파일, 일정 예약, 훅).
    - 항상 실행되는 Gateway(VPS에서 실행하고 어디서나 상호작용).
    - 로컬 브라우저/화면/카메라/명령 실행을 위한 Node.

    쇼케이스: [https://openclaw.ai/showcase](https://openclaw.ai/showcase).

  </Accordion>
</AccordionGroup>

## Skills 및 자동화

<AccordionGroup>
  <Accordion title="저장소를 변경된 상태로 유지하지 않고 Skills를 사용자 지정하려면 어떻게 해야 하나요?">
    저장소의 복사본을 편집하는 대신 관리형 재정의를 사용하십시오. 변경 사항을 `~/.openclaw/skills/<name>/SKILL.md`에 넣거나 `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 폴더를 추가하십시오. 우선순위는 `<workspace>/skills` -> `<workspace>/.agents/skills` -> `~/.agents/skills` -> `~/.openclaw/skills` -> 번들 항목 -> `skills.load.extraDirs` 순이므로, git을 건드리지 않고도 관리형 재정의가 번들 Skills보다 우선합니다. 전역으로 설치하되 일부 에이전트에만 표시하려면 공유 복사본을 `~/.openclaw/skills`에 두고 `agents.defaults.skills` / `agents.list[].skills`로 표시 범위를 제어하십시오. 업스트림에 반영할 가치가 있는 편집만 저장소 복사본을 대상으로 PR을 제출해야 합니다.
  </Accordion>

  <Accordion title="사용자 지정 폴더에서 Skills를 로드할 수 있나요?">
    예. `~/.openclaw/openclaw.json`의 `skills.load.extraDirs`를 통해 디렉터리를 추가하십시오(위 순서에서 우선순위가 가장 낮음). `clawhub`는 기본적으로 `./skills`에 설치하며, OpenClaw는 다음 세션에서 이를 `<workspace>/skills`로 처리합니다. 특정 에이전트에만 표시하려면 `agents.defaults.skills` 또는 `agents.list[].skills`와 함께 사용하십시오.
  </Accordion>

  <Accordion title="작업별로 서로 다른 모델이나 설정을 사용하려면 어떻게 해야 하나요?">
    지원되는 패턴은 다음과 같습니다.

    - **Cron 작업**: 격리된 작업마다 `model` 재정의를 설정할 수 있습니다.
    - **에이전트**: 기본 모델, 사고 수준 및 스트림 매개변수가 서로 다른 별도 에이전트로 작업을 라우팅할 수 있습니다.
    - **요청 시 전환**: `/model`을 사용하여 언제든지 현재 세션 모델을 전환할 수 있습니다.

    예시 - 동일한 모델에 서로 다른 에이전트별 설정 적용:

    ```json5
    {
      agents: {
        list: [
          {
            id: "coder",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "high",
            params: { temperature: 0.1 },
          },
          {
            id: "chat",
            model: "xiaomi/mimo-v2.5-pro",
            thinkingDefault: "off",
            params: { temperature: 0.8 },
          },
        ],
      },
    }
    ```

    공유 모델별 기본값은 `agents.defaults.models["provider/model"].params`에 넣고, 에이전트별 재정의는 평면 구조의 `agents.list[].params`에 넣으십시오. 중첩된 `agents.list[].models["provider/model"].params` 아래에 동일한 모델을 중복으로 넣지 마십시오. 해당 경로는 에이전트별 모델 카탈로그 및 런타임 재정의용입니다.

    [Cron 작업](/ko/automation/cron-jobs), [다중 에이전트 라우팅](/ko/concepts/multi-agent), [구성](/ko/gateway/config-agents), [슬래시 명령](/ko/tools/slash-commands)을 참조하십시오.

  </Accordion>

  <Accordion title="과도한 작업을 수행하는 동안 봇이 멈춥니다. 이 작업을 어떻게 분산할 수 있나요?">
    장시간 또는 병렬 작업에는 **하위 에이전트**를 사용하십시오. 하위 에이전트는 자체 세션에서 실행되고 요약을 반환하므로 기본 채팅의 응답성을 유지합니다. 봇에게 "이 작업을 위한 하위 에이전트를 생성해 줘"라고 요청하거나 `/subagents`를 사용하십시오. Gateway가 현재 작업 중인지 확인하려면 `/status`를 사용하십시오.

    장시간 작업과 하위 에이전트 모두 토큰을 소비합니다. 비용이 중요하다면 `agents.defaults.subagents.model`을 통해 하위 에이전트에 더 저렴한 모델을 설정하십시오.

    문서: [하위 에이전트](/ko/tools/subagents), [백그라운드 작업](/ko/automation/tasks).

  </Accordion>

  <Accordion title="Discord에서 스레드에 바인딩된 하위 에이전트 세션은 어떻게 작동하나요?">
    Discord 스레드를 하위 에이전트 또는 세션 대상에 바인딩하면 해당 스레드의 후속 메시지가 바인딩된 세션에 계속 전달됩니다.

    - `thread: true`를 사용하여 `sessions_spawn`으로 생성하십시오(지속적인 후속 작업에는 선택적으로 `mode: "session"` 사용).
    - 또는 `/focus <target>`을 사용하여 수동으로 바인딩하십시오.
    - `/agents`로 바인딩 상태를 확인합니다.
    - `/session idle <duration|off>` 및 `/session max-age <duration|off>`로 자동 포커스 해제를 제어합니다.
    - `/unfocus`로 스레드 연결을 해제합니다.

    구성: `session.threadBindings.enabled`(전역 스위치), `session.threadBindings.idleHours`(기본값 `24`, `0`은 비활성화), `session.threadBindings.maxAgeHours`(기본값 `0` = 최대 제한 없음), 채널별 재정의 `channels.discord.threadBindings.{enabled,idleHours,maxAgeHours}`. `channels.discord.threadBindings.spawnSessions`는 생성 시 자동 바인딩 여부를 제어합니다(기본값 `true`).

    문서: [하위 에이전트](/ko/tools/subagents), [Discord](/ko/channels/discord), [구성 레퍼런스](/ko/gateway/configuration-reference), [슬래시 명령](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="하위 에이전트가 완료되었지만 완료 업데이트가 잘못된 위치로 전송되었거나 게시되지 않았습니다. 무엇을 확인해야 하나요?">
    확인된 요청자 경로를 점검하십시오.

    - 완료 모드의 하위 에이전트 전달은 바인딩된 스레드나 대화 경로가 있으면 이를 우선합니다.
    - 완료 작업의 출처에 채널 정보만 있는 경우에도 직접 전달이 성공할 수 있도록 OpenClaw는 요청자 세션에 저장된 경로(`lastChannel` / `lastTo` / `lastAccountId`)를 대신 사용합니다.
    - 바인딩된 경로도 없고 사용할 수 있는 저장 경로도 없으면 직접 전달이 실패할 수 있으며, 결과는 즉시 게시되지 않고 대기 중인 세션 전달로 전환됩니다.
    - 유효하지 않거나 오래된 대상도 대기열 전환 또는 최종 전달 실패를 유발할 수 있습니다.
    - 하위 에이전트의 마지막으로 표시된 어시스턴트 응답이 정확히 `NO_REPLY` / `no_reply` 또는 `ANNOUNCE_SKIP`이면 OpenClaw는 이전의 오래된 진행 상황을 게시하지 않고 의도적으로 알림을 생략합니다.

    디버그: `<lookup>`이 작업 ID, 실행 ID 또는 세션 키인 경우 `openclaw tasks show <lookup>`을 사용하십시오.

    문서: [하위 에이전트](/ko/tools/subagents), [백그라운드 작업](/ko/automation/tasks), [세션 도구](/ko/concepts/session-tool).

  </Accordion>

  <Accordion title="Cron 또는 알림이 실행되지 않습니다. 무엇을 확인해야 하나요?">
    Cron은 Gateway 프로세스 내부에서 실행되므로 Gateway가 계속 실행되고 있지 않으면 작동하지 않습니다.

    - Cron이 활성화되어 있는지(`cron.enabled`), `OPENCLAW_SKIP_CRON`이 설정되어 있지 않은지 확인하십시오.
    - Gateway가 절전이나 재시작 없이 연중무휴 실행되는지 확인하십시오.
    - 작업 시간대(`--tz`와 호스트 시간대)를 확인하십시오.

    디버그:
    ```bash
    openclaw cron run <jobId>
    openclaw cron runs --id <jobId> --limit 50
    ```

    문서: [Cron 작업](/ko/automation/cron-jobs), [자동화](/ko/automation).

  </Accordion>

  <Accordion title="Cron이 실행되었지만 채널로 아무것도 전송되지 않았습니다. 이유가 무엇인가요?">
    전달 모드를 확인하십시오.

    - `--no-deliver` / `delivery.mode: "none"`: 러너의 폴백 전송이 실행되지 않는 것이 정상입니다.
    - 알림 대상(`channel` / `to`)이 없거나 유효하지 않음: 러너가 외부 전달을 건너뛰었습니다.
    - 채널 인증 실패(`unauthorized`, `Forbidden`): 러너가 전달을 시도했지만 자격 증명으로 인해 차단되었습니다.
    - 무응답 격리 결과(`NO_REPLY` / `no_reply`만 해당)는 의도적으로 전달할 수 없는 것으로 처리되므로, 대기열의 폴백 전달도 억제됩니다.

    격리된 Cron 작업에서도 채팅 경로를 사용할 수 있으면 에이전트가 `message` 도구를 사용하여 직접 전송할 수 있습니다. `--announce`는 에이전트가 자체적으로 아직 전송하지 않은 최종 텍스트에 대한 러너의 폴백 전달만 제어합니다.

    디버그:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    openclaw tasks show <lookup>
    ```

    문서: [Cron 작업](/ko/automation/cron-jobs), [백그라운드 작업](/ko/automation/tasks).

  </Accordion>

  <Accordion title="격리된 Cron 실행이 모델을 전환하거나 한 번 재시도한 이유는 무엇인가요?">
    이는 중복 예약이 아니라 실시간 모델 전환 경로입니다. 격리된 Cron은 런타임 모델 인계 상태를 유지하며, 활성 실행에서 `LiveSessionModelSwitchError`가 발생하면 전환된 공급자/모델과 전환된 인증 프로필 재정의가 있다면 이를 유지한 후 재시도합니다.

    모델 선택 우선순위: 먼저 Gmail 훅 모델 재정의(`hooks.gmail.model`), 그다음 작업별 `model`, 저장된 Cron 세션 모델 재정의, 마지막으로 일반 에이전트/기본 모델 선택 순입니다.

    재시도 루프는 최초 시도와 2회의 전환 재시도로 제한되며, 이후 Cron은 무한 반복하는 대신 중단됩니다.

    디버그:
    ```bash
    openclaw cron runs --id <jobId> --limit 50
    ```

    문서: [Cron 작업](/ko/automation/cron-jobs), [Cron CLI](/ko/cli/cron).

  </Accordion>

  <Accordion title="Linux에서 Skills를 설치하려면 어떻게 하나요?">
    기본 `openclaw skills` 명령을 사용하거나 Skills를 워크스페이스에 추가하십시오. macOS Skills UI는 Linux에서 사용할 수 없습니다. [https://clawhub.ai](https://clawhub.ai)에서 Skills를 살펴볼 수 있습니다.

    ```bash
    openclaw skills search "calendar"
    openclaw skills search --limit 20
    openclaw skills install @owner/<skill-slug>
    openclaw skills install @owner/<skill-slug> --version <version>
    openclaw skills install @owner/<skill-slug> --force
    openclaw skills install @owner/<skill-slug> --global
    openclaw skills update --all
    openclaw skills update --all --global
    openclaw skills list --eligible
    openclaw skills check
    ```

    기본 `openclaw skills install`은 기본적으로 활성 워크스페이스의 `skills/` 디렉터리에 기록합니다. 모든 로컬 에이전트가 사용하는 공유 관리형 Skills 디렉터리에 설치하려면 `--global`을 추가하십시오. 별도의 `clawhub` CLI는 자체 Skills를 게시하거나 동기화할 때만 설치하십시오. 공유 Skills를 볼 수 있는 에이전트를 제한하려면 `agents.defaults.skills` 또는 `agents.list[].skills`를 사용하십시오.

  </Accordion>

  <Accordion title="OpenClaw가 일정에 따라 또는 백그라운드에서 지속적으로 작업을 실행할 수 있나요?">
    예, Gateway 스케줄러를 통해 실행할 수 있습니다.

    - 예약 또는 반복 작업(재시작 후에도 유지)에는 **Cron 작업**을 사용합니다.
    - 기본 세션의 주기적 검사에는 **Heartbeat**를 사용합니다.
    - 요약을 게시하거나 채팅으로 전달하는 자율 에이전트에는 **격리된 작업**을 사용합니다.

    문서: [Cron 작업](/ko/automation/cron-jobs), [자동화](/ko/automation), [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title="Linux에서 Apple macOS 전용 Skills를 실행할 수 있나요?">
    직접 실행할 수는 없습니다. macOS Skills는 `metadata.openclaw.os`와 필수 바이너리를 기준으로 제한되며, **Gateway 호스트**에서 적격할 때만 로드됩니다. Linux에서는 제한을 재정의하지 않는 한 `darwin` 전용 Skills(`apple-notes`, `apple-reminders`, `things-mac`)가 로드되지 않습니다.

    지원되는 세 가지 패턴은 다음과 같습니다.

    **옵션 A - Mac에서 Gateway 실행(가장 간단함)**. macOS 바이너리가 있는 곳에서 Gateway를 실행한 다음, Linux에서 [원격 모드](#gateway-ports-already-running-and-remote-mode) 또는 Tailscale을 통해 연결하십시오. Gateway 호스트가 macOS이므로 Skills가 정상적으로 로드됩니다.

    **옵션 B - macOS Node 사용(SSH 불필요)**. Linux에서 Gateway를 실행하고 macOS Node(메뉴 막대 앱)를 페어링한 후, Mac에서 **Node Run Commands**를 "Always Ask" 또는 "Always Allow"로 설정하십시오. OpenClaw는 Node에 필수 바이너리가 있으면 macOS 전용 Skills를 적격한 것으로 처리하며, 에이전트는 `nodes` 도구를 통해 이를 실행합니다. "Always Ask"를 사용하는 경우 프롬프트에서 "Always Allow"를 승인하면 해당 명령이 허용 목록에 추가됩니다.

    **옵션 C - SSH를 통해 macOS 바이너리 프록시(고급)**. Gateway는 Linux에 유지하되, 필수 CLI 바이너리가 Mac에서 실행되는 SSH 래퍼로 해석되도록 만든 다음, Skill이 적격 상태를 유지하도록 Linux를 허용하는 재정의를 적용하십시오.

    1. 바이너리용 SSH 래퍼를 생성합니다(예: Apple Notes용 `memo`).
       ```bash
       #!/usr/bin/env bash
       set -euo pipefail
       exec ssh -T user@mac-host /opt/homebrew/bin/memo "$@"
       ```
    2. Linux 호스트의 `PATH`에 래퍼를 추가합니다(예: `~/bin/memo`).
    3. Linux를 허용하도록 Skill 메타데이터(워크스페이스 또는 `~/.openclaw/skills`)를 재정의합니다.
       ```markdown
       ---
       name: apple-notes
       description: macOS에서 memo CLI를 통해 Apple Notes를 관리합니다.
       metadata: { "openclaw": { "os": ["darwin", "linux"], "requires": { "bins": ["memo"] } } }
       ---
       ```
    4. Skills 스냅샷이 새로 고쳐지도록 새 세션을 시작합니다.

  </Accordion>

  <Accordion title="Notion 또는 HeyGen 통합이 있나요?">
    현재 기본 제공되지는 않습니다. 선택지는 다음과 같습니다.

    - **사용자 지정 Skill / Plugin**: 신뢰할 수 있는 API 액세스에 가장 적합합니다(둘 다 API를 제공합니다).
    - **브라우저 자동화**: 코드 없이 작동하지만 더 느리고 취약합니다.

    에이전시 방식의 고객별 컨텍스트를 사용하려면 고객마다 Notion 페이지 하나(컨텍스트 + 기본 설정 + 진행 중인 작업)를 유지하고, 세션 시작 시 에이전트가 해당 페이지를 가져오도록 요청하십시오.

    네이티브 통합이 필요하면 기능 요청을 생성하거나 해당 API를 사용하는 Skill을 구축하십시오.

    ```bash
    openclaw skills install @owner/<skill-slug>
    openclaw skills update --all
    ```

    기본 설치는 활성 워크스페이스의 `skills/` 디렉터리에 저장됩니다. 모든 로컬 에이전트에 적용하려면 `--global`을 사용하고, 표시 범위를 제한하려면 `agents.defaults.skills` / `agents.list[].skills`를 구성하십시오. 일부 Skills에는 Homebrew로 설치한 바이너리가 필요하며, Linux에서는 Linuxbrew를 의미합니다.

    [Skills](/ko/tools/skills), [Skills 구성](/ko/tools/skills-config), [ClawHub](/tools/clawhub)을 참조하십시오.

  </Accordion>

  <Accordion title="기존에 로그인된 Chrome을 OpenClaw에서 사용하려면 어떻게 하나요?">
    Chrome DevTools MCP를 통해 연결되는 기본 제공 `user` 브라우저 프로필을 사용하십시오.

    ```bash
    openclaw browser --browser-profile user tabs
    openclaw browser --browser-profile user snapshot
    ```

    사용자 지정 이름을 사용하려면 명시적인 MCP 프로필을 생성하십시오.

    ```bash
    openclaw browser create-profile --name chrome-live --driver existing-session
    openclaw browser --browser-profile chrome-live tabs
    ```

    로컬 호스트 브라우저 또는 연결된 브라우저 Node를 사용할 수 있습니다. Gateway가 다른 곳에서 실행되는 경우 브라우저가 있는 시스템에서 Node 호스트를 실행하거나 원격 CDP를 사용하십시오.

    관리형 `openclaw` 프로필과 비교한 `existing-session` / `user` 프로필의 현재 제한 사항은 다음과 같습니다.

    - `click`, `type`, `hover`, `scrollIntoView`, `drag`, `select`에는 CSS 선택자가 아니라 스냅샷 참조가 필요합니다.
    - 업로드 훅에는 `ref` 또는 `inputRef`가 필요하고 한 번에 파일 하나만 업로드할 수 있으며 CSS `element`는 사용할 수 없습니다.
    - `responsebody`, PDF 내보내기, 다운로드 가로채기, 일괄 작업에는 여전히 관리형 브라우저 경로가 필요합니다.

    전체 비교는 [브라우저](/ko/tools/browser#existing-session-via-chrome-devtools-mcp)를 참조하십시오.

  </Accordion>
</AccordionGroup>

## 샌드박싱 및 메모리

<AccordionGroup>
  <Accordion title="전용 샌드박싱 문서가 있나요?">
    예: [샌드박싱](/ko/gateway/sandboxing)을 참조하십시오. Docker 전용 설정(Docker의 전체 Gateway 또는 샌드박스 이미지)은 [Docker](/ko/install/docker)를 참조하십시오.
  </Accordion>

  <Accordion title="Docker의 기능이 제한적으로 느껴집니다. 전체 기능을 활성화하려면 어떻게 하나요?">
    기본 이미지는 보안을 우선하며 `node` 사용자로 실행되므로 시스템 패키지, Homebrew, 번들 브라우저가 제외됩니다. 더 완전한 설정을 구성하려면 다음을 수행하십시오.

    - 캐시가 유지되도록 `OPENCLAW_HOME_VOLUME`을 사용하여 `/home/node`를 영구 저장합니다.
    - `OPENCLAW_IMAGE_APT_PACKAGES`를 사용하여 시스템 종속성을 이미지에 포함합니다.
    - 번들 CLI를 통해 Playwright 브라우저를 설치합니다: `node /app/node_modules/playwright-core/cli.js install chromium`.
    - `PLAYWRIGHT_BROWSERS_PATH`를 설정하고 해당 경로를 영구 저장합니다.

    문서: [Docker](/ko/install/docker), [브라우저](/ko/tools/browser).

  </Accordion>

  <Accordion title="하나의 에이전트에서 DM은 비공개로 유지하고 그룹은 공개/샌드박스화할 수 있나요?">
    예, 비공개 트래픽이 **DM**이고 공개 트래픽이 **그룹**인 경우 가능합니다. `agents.defaults.sandbox.mode: "non-main"`으로 설정하면 그룹/채널 세션(기본 세션이 아닌 키)은 구성된 샌드박스 백엔드에서 실행되고 기본 DM 세션은 호스트에서 계속 실행됩니다. 샌드박싱을 활성화하면 Docker가 기본 백엔드입니다. `tools.sandbox.tools`를 통해 샌드박스화된 세션에서 사용할 수 있는 도구를 제한하십시오.

    설정 안내: [그룹: 개인 DM + 공개 그룹](/ko/channels/groups#pattern-personal-dms-public-groups-single-agent). 주요 참조: [Gateway 구성](/ko/gateway/config-agents#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="호스트 폴더를 샌드박스에 바인딩하려면 어떻게 하나요?">
    `agents.defaults.sandbox.docker.binds`를 `["host:container:mode"]`로 설정하십시오(예: `"/home/user/src:/src:ro"`). 전역 바인드와 에이전트별 바인드는 병합되며, `scope: "shared"`인 경우 에이전트별 바인드는 무시됩니다. 민감한 항목에는 `:ro`를 사용하십시오. 바인드는 샌드박스 파일 시스템 경계를 우회합니다.

    OpenClaw는 정규화된 경로와 가장 깊은 기존 상위 항목을 통해 해석된 표준 경로 모두를 기준으로 바인드 소스를 검증하므로, 최종 경로 세그먼트가 아직 존재하지 않더라도 심볼릭 링크 상위 경로를 통한 이탈은 실패 시 차단됩니다.

    [샌드박싱](/ko/gateway/sandboxing#custom-bind-mounts) 및 [샌드박스와 도구 정책 및 권한 상승 비교](/ko/gateway/sandbox-vs-tool-policy-vs-elevated#bind-mounts-security-quick-check)를 참조하십시오.

  </Accordion>

  <Accordion title="메모리는 어떻게 작동하나요?">
    OpenClaw 메모리는 에이전트 워크스페이스의 Markdown 파일입니다. 일별 메모는 `memory/YYYY-MM-DD.md`에, 선별된 장기 메모는 `MEMORY.md`에 저장됩니다(기본/비공개 세션만 해당).

    OpenClaw는 Compaction이 대화를 요약하기 전에 자동 **Compaction 전 메모리 플러시**도 실행하여, 모델이 먼저 영구 메모를 작성하도록 알립니다. 워크스페이스가 쓰기 가능한 경우에만 실행되며 읽기 전용 샌드박스에서는 건너뜁니다. 비활성화하려면 `agents.defaults.compaction.memoryFlush.enabled: false`를 사용하십시오. [메모리](/ko/concepts/memory)를 참조하십시오.

  </Accordion>

  <Accordion title="메모리가 계속 내용을 잊습니다. 기억하게 하려면 어떻게 하나요?">
    봇에게 **사실을 메모리에 기록하도록** 요청하십시오. 장기 메모는 `MEMORY.md`에, 단기 컨텍스트는 `memory/YYYY-MM-DD.md`에 저장됩니다. 모델에 메모리를 저장하라고 상기시키면 일반적으로 문제가 해결됩니다. 계속 잊는다면 Gateway가 실행할 때마다 동일한 워크스페이스를 사용하는지 확인하십시오.

    문서: [메모리](/ko/concepts/memory), [에이전트 워크스페이스](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="메모리는 영구적으로 유지되나요? 제한은 무엇인가요?">
    메모리 파일은 디스크에 저장되며 삭제할 때까지 유지됩니다. 제한은 모델이 아니라 스토리지 용량입니다. **세션 컨텍스트**는 여전히 모델의 컨텍스트 창으로 제한되므로 긴 대화는 압축되거나 잘릴 수 있습니다. 이것이 메모리 검색이 존재하는 이유이며, 관련 부분만 컨텍스트로 다시 가져옵니다.

    문서: [메모리](/ko/concepts/memory), [컨텍스트](/ko/concepts/context).

  </Accordion>

  <Accordion title="의미 기반 메모리 검색에 OpenAI API 키가 필요한가요?">
    기본 공급자인 **OpenAI 임베딩**을 사용하는 경우에만 필요합니다. Codex OAuth는 채팅/완성을 지원하지만 임베딩 액세스 권한은 **부여하지 않으므로**, Codex(OAuth 또는 Codex CLI 로그인)로 로그인해도 의미 기반 메모리 검색이 활성화되지 않습니다. OpenAI 임베딩에는 여전히 실제 API 키(`OPENAI_API_KEY` 또는 `models.providers.openai.apiKey`)가 필요합니다.

    로컬에서만 유지하려면 `agents.defaults.memorySearch.provider: "local"`(GGUF/llama.cpp)을 설정하십시오. 그 밖에 지원되는 공급자는 Bedrock, DeepInfra, Gemini(`GEMINI_API_KEY` 또는 `memorySearch.remote.apiKey`), GitHub Copilot, LM Studio, Mistral, Ollama, OpenAI 호환 공급자, Voyage입니다. 설정 세부 정보는 [메모리](/ko/concepts/memory) 및 [메모리 검색](/ko/concepts/memory-search)을 참조하십시오.

  </Accordion>
</AccordionGroup>

## 디스크에서 항목이 저장되는 위치

<AccordionGroup>
  <Accordion title="OpenClaw에서 사용하는 모든 데이터가 로컬에 저장됩니까?">
    아닙니다. **OpenClaw 자체 상태는 로컬에 저장**되지만, **외부 서비스에서는 사용자가 전송한 내용을 계속 볼 수 있습니다**.

    - **기본적으로 로컬**: 세션, 메모리 파일, 구성, 워크스페이스는 Gateway 호스트(`~/.openclaw` 및 워크스페이스 디렉터리)에 있습니다.
    - **필요에 따라 원격**: 모델 공급자(Anthropic/OpenAI 등)로 전송된 메시지는 해당 API로 전달되며, 채팅 플랫폼(Slack/Telegram/WhatsApp 등)은 메시지 데이터를 자체 서버에 저장합니다.
    - **사용자가 범위를 제어할 수 있음**: 로컬 모델을 사용하면 프롬프트가 사용자 머신에 유지되지만, 채널 트래픽은 여전히 채널 서버를 통과합니다.

    관련 문서: [에이전트 워크스페이스](/ko/concepts/agent-workspace), [메모리](/ko/concepts/memory).

  </Accordion>

  <Accordion title="OpenClaw는 데이터를 어디에 저장합니까?">
    모든 항목은 `$OPENCLAW_STATE_DIR`(기본값: `~/.openclaw`) 아래에 있습니다.

    | 경로                                                               | 용도                                                            |
    | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
    | `$OPENCLAW_STATE_DIR/openclaw.json`                                 | 기본 구성(JSON5)                                                 |
    | `$OPENCLAW_STATE_DIR/credentials/oauth.json`                        | 레거시 OAuth 가져오기(처음 사용할 때 인증 프로필로 복사됨)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json`     | 인증 프로필(OAuth, API 키, 선택적 `keyRef`/`tokenRef`)        |
    | `$OPENCLAW_STATE_DIR/secrets.json`                                  | `file` SecretRef 공급자를 위한 선택적 파일 기반 비밀 정보 페이로드   |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth.json`              | 레거시 호환성 파일(정적 `api_key` 항목이 제거됨)        |
    | `$OPENCLAW_STATE_DIR/credentials/`                                  | 공급자 상태(예: `whatsapp/<accountId>/creds.json`)      |
    | `$OPENCLAW_STATE_DIR/agents/`                                       | 에이전트별 상태(agentDir + 레거시/보관된 세션 아티팩트)        |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/openclaw-agent.sqlite`  | 세션 행과 트랜스크립트를 포함한 에이전트별 SQLite 상태      |
    | `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/`                    | 레거시 세션 마이그레이션 소스 및 보관/지원 아티팩트      |

    레거시 단일 에이전트 경로 `~/.openclaw/agent/*`는 `openclaw doctor`가 마이그레이션합니다.

    **워크스페이스**(AGENTS.md, 메모리 파일, Skills 등)는 별도이며 `agents.defaults.workspace`(기본값: `~/.openclaw/workspace`)를 통해 구성합니다.

  </Accordion>

  <Accordion title="AGENTS.md / SOUL.md / USER.md / MEMORY.md는 어디에 있어야 합니까?">
    이러한 파일은 `~/.openclaw`가 아니라 **에이전트 워크스페이스**에 있습니다.

    - **워크스페이스(에이전트별)**: `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `USER.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`, 선택적 `HEARTBEAT.md`. 루트의 소문자 `memory.md`는 레거시 복구 입력으로만 사용됩니다. 두 파일이 모두 있으면 `openclaw doctor --fix`가 이를 `MEMORY.md`에 병합할 수 있습니다.
    - **상태 디렉터리(`~/.openclaw`)**: 구성, 채널/공급자 상태, 인증 프로필, 세션, 로그, 공유 Skills(`~/.openclaw/skills`).

    기본 워크스페이스는 `~/.openclaw/workspace`이며 다음과 같이 구성할 수 있습니다.

    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
    }
    ```

    재시작 후 봇이 내용을 "잊어버린다면" Gateway가 실행될 때마다 동일한 워크스페이스를 사용하는지 확인하십시오(원격 모드에서는 로컬 노트북이 아니라 **Gateway 호스트의** 워크스페이스를 사용합니다).

    팁: 동작이나 기본 설정을 영구적으로 유지하려면 채팅 기록에 의존하지 말고 봇에게 **AGENTS.md 또는 MEMORY.md에 기록하도록** 요청하십시오.

    [에이전트 워크스페이스](/ko/concepts/agent-workspace) 및 [메모리](/ko/concepts/memory)를 참조하십시오.

  </Accordion>

  <Accordion title="SOUL.md를 더 크게 만들 수 있습니까?">
    예. `SOUL.md`는 에이전트 컨텍스트에 주입되는 워크스페이스 부트스트랩 파일 중 하나입니다. 기본 파일별 주입 한도는 `20000`자이며, 전체 파일의 총 부트스트랩 예산은 `60000`자입니다.

    공유 기본값을 변경하십시오.

    ```json5
    {
      agents: {
        defaults: {
          bootstrapMaxChars: 50000,
          bootstrapTotalMaxChars: 300000,
        },
      },
    }
    ```

    또는 `agents.list[].bootstrapMaxChars` / `bootstrapTotalMaxChars` 아래에서 개별 에이전트의 값을 재정의하십시오.

    원본 크기와 주입된 크기를 비교하고 잘림이 발생했는지 확인하려면 `/context`를 사용하십시오. `SOUL.md`에는 말투, 관점, 성격에 관한 내용만 집중해서 작성하고, 운영 규칙은 `AGENTS.md`에, 지속적으로 유지할 사실은 메모리에 작성하십시오.

    [컨텍스트](/ko/concepts/context) 및 [에이전트 구성](/ko/gateway/config-agents)을 참조하십시오.

  </Accordion>

  <Accordion title="권장 백업 전략">
    **에이전트 워크스페이스**를 **비공개** git 저장소에 넣고 비공개 위치(예: GitHub 비공개 저장소)에 백업하십시오. 이렇게 하면 메모리와 AGENTS/SOUL/USER 파일을 함께 보관하고 나중에 어시스턴트의 "마음"을 복원할 수 있습니다.

    `~/.openclaw` 아래의 항목(자격 증명, 세션, 토큰, 암호화된 비밀 정보 페이로드)은 **커밋하지 마십시오**. 전체를 복원하려면 워크스페이스와 상태 디렉터리를 별도로 백업하십시오.

    문서: [에이전트 워크스페이스](/ko/concepts/agent-workspace).

  </Accordion>

  <Accordion title="OpenClaw를 완전히 제거하려면 어떻게 해야 합니까?">
    [제거](/ko/install/uninstall)를 참조하십시오.
  </Accordion>

  <Accordion title="에이전트가 워크스페이스 외부에서 작업할 수 있습니까?">
    예. 워크스페이스는 하드 샌드박스가 아니라 **기본 cwd**이자 메모리 기준점입니다. 상대 경로는 워크스페이스 내부에서 해석되며, 샌드박스가 활성화되지 않았다면 절대 경로로 호스트의 다른 위치에 접근할 수 있습니다. 격리하려면 [`agents.defaults.sandbox`](/ko/gateway/sandboxing) 또는 에이전트별 샌드박스 설정을 사용하십시오. 저장소를 기본 작업 디렉터리로 설정하려면 해당 에이전트의 `workspace`가 저장소 루트를 가리키도록 하십시오. OpenClaw 저장소 자체는 소스 코드일 뿐이므로, 에이전트가 그 안에서 작업하도록 의도한 경우가 아니라면 워크스페이스를 별도로 유지하십시오.

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

  <Accordion title="원격 모드: 세션 저장소는 어디에 있습니까?">
    세션 상태는 **Gateway 호스트**가 소유합니다. 원격 모드에서 사용자가 확인해야 하는 세션 저장소는 로컬 노트북이 아니라 원격 머신에 있습니다. [세션 관리](/ko/concepts/session)를 참조하십시오.
  </Accordion>
</AccordionGroup>

## 구성 기본 사항

<AccordionGroup>
  <Accordion title="구성 형식은 무엇이며 어디에 있습니까?">
    OpenClaw는 `$OPENCLAW_CONFIG_PATH`(기본값: `~/.openclaw/openclaw.json`)에서 선택적 **JSON5** 구성을 읽습니다. 파일이 없으면 `~/.openclaw/workspace`를 기본 워크스페이스로 사용하는 것을 포함한 비교적 안전한 기본값을 사용합니다.
  </Accordion>

  <Accordion title='gateway.bind: "lan"(또는 "tailnet")을 설정했더니 수신하지 않거나 UI에 unauthorized가 표시되는 이유는 무엇입니까?'>
    루프백이 아닌 바인딩에는 **유효한 Gateway 인증 경로가 필요합니다**. 공유 비밀 인증(토큰 또는 비밀번호)을 사용하거나, 올바르게 구성된 ID 인식 역방향 프록시 뒤에서 `gateway.auth.mode: "trusted-proxy"`를 사용해야 합니다.

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

    - `gateway.remote.token` / `.password`만으로는 로컬 Gateway 인증이 활성화되지 않습니다. `gateway.auth.*`가 설정되지 않은 경우에만 로컬 호출 경로가 `gateway.remote.*`를 대체 경로로 사용할 수 있습니다.
    - 비밀번호 인증의 경우 `gateway.auth.mode: "password"`와 함께 `gateway.auth.password`(또는 `OPENCLAW_GATEWAY_PASSWORD`)를 설정하십시오.
    - `gateway.auth.token` / `.password`가 SecretRef를 통해 명시적으로 구성되었지만 확인되지 않으면, 확인이 실패 시 차단됩니다(원격 대체 경로로 실패를 숨기지 않음).
    - 공유 비밀을 사용하는 Control UI 설정은 `connect.params.auth.token` 또는 `connect.params.auth.password`(앱/UI 설정에 저장됨)를 통해 인증합니다. Tailscale Serve 또는 `trusted-proxy`처럼 ID 정보가 포함된 모드는 대신 요청 헤더를 사용합니다. 공유 비밀을 URL에 넣지 마십시오.
    - `gateway.auth.mode: "trusted-proxy"`를 사용할 때 동일 호스트의 루프백 역방향 프록시를 사용하려면 명시적 `gateway.auth.trustedProxy.allowLoopback = true`와 `gateway.trustedProxies`의 루프백 항목이 필요합니다.

  </Accordion>

  <Accordion title="이제 localhost에서도 토큰이 필요한 이유는 무엇입니까?">
    OpenClaw는 루프백을 포함하여 기본적으로 Gateway 인증을 적용합니다. 명시적인 인증 경로가 구성되지 않으면 시작 시 토큰 모드로 결정되고 해당 시작에만 유효한 런타임 토큰이 생성되므로, 로컬 WS 클라이언트도 인증해야 합니다. 이를 통해 다른 로컬 프로세스가 Gateway를 호출하지 못하게 합니다.

    클라이언트가 재시작 후에도 유지되는 비밀 정보가 필요한 경우 `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` 또는 `OPENCLAW_GATEWAY_PASSWORD`를 명시적으로 구성하십시오. 비밀번호 모드나 ID 인식 역방향 프록시용 `trusted-proxy`를 선택할 수도 있습니다. 인증 없이 루프백을 열려면 `gateway.auth.mode: "none"`을 명시적으로 설정하십시오. `openclaw doctor --generate-gateway-token`은 언제든 토큰을 생성합니다.

  </Accordion>

  <Accordion title="구성을 변경한 후 다시 시작해야 합니까?">
    Gateway는 구성을 감시하고 핫 리로드를 지원합니다. `gateway.reload.mode: "hybrid"`(기본값)는 안전한 변경 사항을 즉시 적용하고 중요한 변경 사항이 있으면 다시 시작합니다. `hot`, `restart`, `off`도 지원됩니다. 대부분의 `tools.*`, `agents.*` 정책, `session.*`, `messages.*` 변경 사항은 리로드 작업 없이 즉시 적용되지만, `gateway.*` 바인딩/포트 변경 사항은 다시 시작해야 합니다.
  </Accordion>

  <Accordion title="재미있는 CLI 태그라인을 비활성화하려면 어떻게 해야 합니까?">
    `cli.banner.taglineMode`를 설정하십시오.

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
    - `default`: 항상 `All your chats, one OpenClaw.`을 사용합니다.
    - `random`: 재미있거나 계절에 맞는 태그라인을 순환해서 표시합니다(기본 동작).
    - 배너를 완전히 숨기려면 환경 변수 `OPENCLAW_HIDE_BANNER=1`을 설정하십시오.

  </Accordion>

  <Accordion title="웹 검색(및 웹 가져오기)을 활성화하려면 어떻게 해야 합니까?">
    `web_fetch`는 API 키 없이 작동합니다. `web_search`는 선택한 공급자에 따라 다릅니다.

    | 공급자 | 키 없이 사용 가능 | 환경 변수 |
    | --- | --- | --- |
    | Brave | 아니요 | `BRAVE_API_KEY` |
    | DuckDuckGo | 예(비공식 HTML 기반) | - |
    | Exa | 아니요 | `EXA_API_KEY` |
    | Firecrawl | 아니요 | `FIRECRAWL_API_KEY` |
    | Gemini | 아니요 | `GEMINI_API_KEY` |
    | Grok | 아니요(xAI OAuth 또는 키) | `XAI_API_KEY` |
    | Kimi | 아니요 | `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY` |
    | MiniMax Search | 아니요 | `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY` 또는 `MINIMAX_API_KEY` |
    | Ollama Web Search | 예(`ollama signin` 필요) | - |
    | Perplexity | 아니요 | `PERPLEXITY_API_KEY` 또는 `OPENROUTER_API_KEY` |
    | SearXNG | 예(자체 호스팅) | `SEARXNG_BASE_URL` |
    | Tavily | 아니요 | `TAVILY_API_KEY` |

    Grok은 모델 인증의 xAI OAuth를 재사용할 수도 있습니다(`openclaw onboard --auth-choice xai-oauth`).

    **권장**: `openclaw configure --section web`을 실행하고 공급자를 선택하십시오.

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
    ```
    ```json5
        web: {
          search: {
            enabled: true,
            provider: "brave",
            maxResults: 5,
          },
          fetch: {
    ```
    ```json5
            enabled: true,
    ```
    ```json5
            provider: "firecrawl", // 선택 사항이며, 자동 감지하려면 생략합니다.
    ```
    ```json5
          },
    ```
    ```json5
        },
      },
    }
    ```
    공급자별 웹 검색 구성은 `plugins.entries.<plugin>.config.webSearch.*`에 있습니다. 레거시 `tools.web.search.*` 공급자 경로도 호환성을 위해 계속 로드되지만 새 구성에서는 사용하지 않아야 합니다. Firecrawl 웹 가져오기 폴백 구성은 `plugins.entries.firecrawl.config.webFetch.*`에 있습니다.

    - 허용 목록: `web_search`/`web_fetch`/`x_search`를 추가하거나, 세 가지 모두를 사용하려면 `group:web`을 추가하십시오.
    - `web_fetch`는 기본적으로 활성화되어 있습니다.
    - `tools.web.fetch.provider`를 생략하면 OpenClaw는 사용 가능한 자격 증명에서 준비된 첫 번째 가져오기 폴백 제공자를 자동으로 감지하며, 공식 Firecrawl Plugin이 해당 폴백을 제공합니다.
    - 데몬은 `~/.openclaw/.env`(또는 서비스 환경)에서 환경 변수를 읽습니다.

    문서: [웹 도구](/ko/tools/web).

  </Accordion>

  <Accordion title="config.apply가 구성을 지웠습니다. 어떻게 복구하고 이를 방지할 수 있나요?">
    `config.apply`는 **전체 구성**을 대체하므로, 일부만 포함된 객체를 적용하면 나머지는 모두 제거됩니다.

    현재 OpenClaw는 대부분의 우발적인 덮어쓰기를 방지합니다.

    - OpenClaw가 수행하는 구성 쓰기는 쓰기 전에 변경 후의 전체 구성을 검증합니다.
    - 유효하지 않거나 파괴적인 OpenClaw 구성 쓰기는 거부되며 `openclaw.json.rejected.*`로 저장됩니다.
    - 직접 편집한 내용으로 인해 시작 또는 핫 리로드가 중단되면 Gateway는 안전하게 실패하거나 리로드를 건너뛰며, `openclaw.json`을 다시 작성하지 않습니다.
    - `openclaw doctor --fix`가 복구를 담당하며, 마지막으로 정상 작동한 구성을 복원하고 거부된 파일을 `openclaw.json.clobbered.*`로 저장할 수 있습니다.

    복구:

    - `openclaw logs --follow`에서 `Invalid config at`, `Config write rejected:`, 또는 `config reload skipped (invalid config)`를 확인하십시오.
    - 활성 구성 옆에서 가장 최근의 `openclaw.json.clobbered.*` 또는 `openclaw.json.rejected.*`를 검사하십시오.
    - `openclaw config validate` 및 `openclaw doctor --fix`를 실행하십시오.
    - 의도한 키만 `openclaw config set` 또는 `config.patch`를 사용하여 다시 복사하십시오.
    - 마지막으로 정상 작동한 구성이나 거부된 페이로드가 없는 경우: 백업에서 복원하거나 `openclaw doctor`를 다시 실행한 후 채널/모델을 재구성하십시오.
    - 예기치 않은 손실이 발생한 경우: 마지막으로 알려진 구성이나 백업을 첨부하여 버그를 신고하십시오. 로컬 코딩 에이전트는 로그나 기록에서 작동하는 구성을 복원할 수 있는 경우가 많습니다.

    방지 방법: 소규모 변경에는 `openclaw config set`, 대화형 편집에는 `openclaw configure`, 익숙하지 않은 경로를 검사하려면 `config.schema.lookup`(얕은 스키마 노드와 직계 하위 항목 요약을 반환), 부분 RPC 편집에는 `config.patch`를 사용하고, `config.apply`는 전체 구성 교체용으로만 사용하십시오. 에이전트용 `gateway` 런타임 도구는 레거시 `tools.bash.*` 별칭을 통해서도 `tools.exec.ask` / `tools.exec.security`를 다시 작성하지 않습니다.

    문서: [구성](/ko/cli/config), [구성하기](/ko/cli/configure), [Gateway 문제 해결](/ko/gateway/troubleshooting#gateway-rejected-invalid-config), [Doctor](/ko/gateway/doctor).

  </Accordion>

  <Accordion title="여러 기기에서 특화된 워커를 사용하는 중앙 Gateway를 어떻게 실행합니까?">
    일반적인 패턴은 **하나의 Gateway**(예: Raspberry Pi)와 **노드** 및 **에이전트**를 함께 사용하는 것입니다.

    - **Gateway(중앙)**: 채널(Signal/WhatsApp), 라우팅, 세션을 관리합니다.
    - **노드(기기)**: Mac/iOS/Android가 주변 장치로 연결되어 로컬 도구(`system.run`, `canvas`, `camera`)를 제공합니다.
    - **에이전트(워커)**: 특수 역할(예: 운영 데이터와 개인 데이터)을 위한 별도의 두뇌/워크스페이스입니다.
    - **하위 에이전트**: 병렬 처리를 위해 기본 에이전트에서 백그라운드 작업을 생성합니다.
    - **TUI**: Gateway에 연결하고 에이전트/세션을 전환합니다.

    문서: [노드](/ko/nodes), [원격 액세스](/ko/gateway/remote), [다중 에이전트 라우팅](/ko/concepts/multi-agent), [하위 에이전트](/ko/tools/subagents), [TUI](/ko/web/tui).

  </Accordion>

  <Accordion title="OpenClaw 브라우저를 헤드리스로 실행할 수 있나요?">
    예:

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

    기본값은 `false`(헤드풀)입니다. 헤드리스 모드는 일부 사이트에서 봇 방지 검사를 유발할 가능성이 더 높습니다(X/Twitter는 헤드리스 세션을 차단하는 경우가 많습니다). 동일한 Chromium 엔진을 사용하며 대부분의 자동화에서 작동합니다. 주된 차이점은 표시되는 브라우저 창이 없다는 것입니다(시각적 확인에는 스크린샷을 사용하십시오). [브라우저](/ko/tools/browser)를 참조하십시오.

  </Accordion>

  <Accordion title="브라우저 제어에 Brave를 사용하려면 어떻게 해야 하나요?">
    `browser.executablePath`를 Brave 바이너리(또는 Chromium 기반 브라우저)로 설정하고 Gateway를 다시 시작하십시오. [브라우저](/ko/tools/browser#use-brave-or-another-chromium-based-browser)를 참조하십시오.
  </Accordion>
</AccordionGroup>

## 원격 Gateway 및 Node

<AccordionGroup>
  <Accordion title="Telegram, Gateway, Node 간에 명령이 어떻게 전달되나요?">
    Telegram 메시지는 **Gateway**에서 처리됩니다. Gateway는 에이전트를 실행하며, Node 도구가 필요한 경우에만 **Gateway WebSocket**을 통해 Node를 호출합니다.

    Telegram -> Gateway -> 에이전트 -> `node.*` -> Node -> Gateway -> Telegram

    Node는 수신되는 제공자 트래픽을 볼 수 없으며, Node RPC 호출만 수신합니다.

  </Accordion>

  <Accordion title="Gateway가 원격으로 호스팅되는 경우 에이전트가 내 컴퓨터에 어떻게 접근할 수 있나요?">
    컴퓨터를 **Node**로 페어링하십시오. Gateway는 다른 곳에서 실행되지만 Gateway WebSocket을 통해 로컬 컴퓨터의 `node.*` 도구(화면, 카메라, 시스템)를 호출할 수 있습니다.

    1. 상시 실행 호스트(VPS/홈 서버)에서 Gateway를 실행합니다.
    2. Gateway 호스트와 컴퓨터를 동일한 tailnet에 연결합니다.
    3. Gateway WS에 연결할 수 있는지 확인합니다(tailnet 바인딩 또는 SSH 터널).
    4. 로컬에서 macOS 앱을 열고 **Remote over SSH** 모드(또는 직접 tailnet 연결)로 접속하여 Node로 등록되도록 합니다.
    5. Node를 승인합니다.
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    별도의 TCP 브리지는 필요하지 않습니다. Node는 Gateway WebSocket을 통해 연결됩니다.

    보안 알림: macOS Node를 페어링하면 해당 컴퓨터에서 `system.run`을 사용할 수 있습니다. 신뢰하는 장치만 페어링하고 [보안](/ko/gateway/security)을 검토하십시오.

    문서: [Node](/ko/nodes), [Gateway 프로토콜](/ko/gateway/protocol), [macOS 원격 모드](/ko/platforms/mac/remote), [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="Tailscale이 연결되어 있지만 응답이 없습니다. 어떻게 해야 하나요?">
    기본 사항을 확인하십시오.

    ```bash
    openclaw gateway status
    openclaw status
    openclaw channels status
    ```

    그런 다음 인증과 라우팅을 확인하십시오. Tailscale Serve를 사용하는 경우 `gateway.auth.allowTailscale`이 올바르게 설정되어 있는지 확인하고, SSH 터널을 통해 연결하는 경우 터널이 활성 상태이며 올바른 포트를 가리키는지 확인하십시오. 또한 DM/그룹 허용 목록에 사용자의 계정이 포함되어 있는지 확인하십시오.

    문서: [Tailscale](/ko/gateway/tailscale), [원격 액세스](/ko/gateway/remote), [채널](/ko/channels).

  </Accordion>

  <Accordion title="두 OpenClaw 인스턴스가 서로 통신할 수 있나요(로컬 + VPS)?">
    예. 다만 기본 제공되는 봇 간 브리지는 없습니다.

    **가장 간단한 방법**: 두 봇 모두 액세스할 수 있는 일반 채팅 채널(Slack/Telegram/WhatsApp)을 사용하십시오. 봇 A가 봇 B에게 메시지를 보내게 한 다음, 봇 B가 평소처럼 응답하도록 하십시오.

    **CLI 브리지(일반 방식)**: 다른 봇이 수신하는 채팅을 대상으로 `openclaw agent --message ... --deliver`를 사용하여 다른 Gateway를 호출하는 스크립트를 실행하십시오. 한 봇이 원격 VPS에 있는 경우 SSH/Tailscale을 통해 CLI가 해당 원격 Gateway를 가리키도록 하십시오([원격 액세스](/ko/gateway/remote) 참조).

    ```bash
    openclaw agent --message "로컬 봇이 보내는 인사입니다" --deliver --channel telegram --reply-to <chat-id>
    ```

    두 봇이 무한히 반복해서 응답하지 않도록 보호 장치를 추가하십시오(멘션에만 응답, 채널 허용 목록 또는 "봇 메시지에 응답하지 않음" 규칙).

    문서: [원격 액세스](/ko/gateway/remote), [에이전트 CLI](/ko/cli/agent), [에이전트 전송](/ko/tools/agent-send).

  </Accordion>

  <Accordion title="여러 에이전트에 별도의 VPS가 필요한가요?">
    아니요. 하나의 Gateway에서 각자 고유한 작업 공간, 기본 모델 및 라우팅을 사용하는 여러 에이전트를 호스팅할 수 있습니다. 이것이 일반적인 구성이고 에이전트마다 VPS를 하나씩 사용하는 것보다 훨씬 저렴하고 간단합니다. 강력한 격리(보안 경계)가 필요하거나 공유하지 않으려는 구성이 크게 다른 경우에만 별도의 VPS를 사용하십시오.
  </Accordion>

  <Accordion title="VPS에서 SSH를 사용하는 대신 개인 노트북에서 Node를 사용하면 어떤 이점이 있나요?">
    예. Node는 원격 Gateway에서 노트북에 접근하는 기본 수단이며 셸 액세스 이상의 기능을 제공합니다. Gateway는 macOS/Linux(Windows에서는 WSL2를 통해 지원)에서 실행되며 가볍기 때문에 소형 VPS 또는 Raspberry Pi급 장치로도 충분하고 4 GB RAM이면 넉넉합니다. 따라서 상시 가동 호스트와 노트북을 Node로 사용하는 구성이 일반적입니다.

    - **인바운드 SSH 불필요** - Node는 기기 페어링을 통해 Gateway WebSocket으로 아웃바운드 연결합니다.
    - **더 안전한 실행 제어** - `system.run`은 해당 노트북의 Node 허용 목록/승인을 통해 제어됩니다.
    - **더 다양한 기기 도구** - Node는 `system.run` 외에도 `canvas`, `camera`, `screen`을 제공합니다.
    - **로컬 브라우저 자동화** - Gateway는 VPS에 유지하면서 Node 호스트를 통해 Chrome을 로컬에서 실행하거나 Chrome MCP를 통해 로컬 Chrome에 연결할 수 있습니다.

    임시 셸 액세스에는 SSH로도 충분하지만, 지속적인 에이전트 워크플로와 기기 자동화에는 Node가 더 간단합니다.

    문서: [Node](/ko/nodes), [Node CLI](/ko/cli/nodes), [브라우저](/ko/tools/browser).

  </Accordion>

  <Accordion title="Node에서 Gateway 서비스를 실행하나요?">
    아니요. 의도적으로 격리된 프로필을 실행하는 경우가 아니라면 호스트당 **하나의 Gateway**만 실행해야 합니다([여러 Gateway](/ko/gateway/multiple-gateways) 참조). Node는 Gateway에 연결되는 주변 장치입니다(iOS/Android Node 또는 메뉴 막대 앱의 macOS "node mode"). 헤드리스 Node 호스트와 CLI 제어에 대해서는 [Node 호스트 CLI](/ko/cli/node)를 참조하십시오.

    `gateway`, `discovery` 및 호스팅되는 Plugin 표면을 변경한 후에는 전체 재시작이 필요합니다.

  </Accordion>

  <Accordion title="API/RPC를 통해 구성을 적용할 수 있나요?">
    예:

    - `config.schema.lookup`: 작성하기 전에 얕은 스키마 노드, 일치하는 UI 힌트 및 직계 하위 항목 요약과 함께 하나의 구성 하위 트리를 검사합니다.
    - `config.get`: 현재 스냅샷과 해시를 가져옵니다.
    - `config.patch`: 안전한 부분 업데이트입니다(대부분의 RPC 편집에 권장). 가능한 경우 핫 리로드하고, 필요한 경우 재시작합니다.
    - `config.apply`: 전체 구성을 검증하고 교체합니다. 가능한 경우 핫 리로드하고, 필요한 경우 재시작합니다.
    - 에이전트용 `gateway` 런타임 도구는 여전히 `tools.exec.ask` / `tools.exec.security` 재작성을 거부합니다. 레거시 `tools.bash.*` 별칭은 동일하게 보호되는 경로로 정규화됩니다.

  </Accordion>

  <Accordion title="첫 설치를 위한 최소한의 적절한 구성">
    ```json5
    {
      agents: { defaults: { workspace: "~/.openclaw/workspace" } },
      channels: { whatsapp: { allowFrom: ["+15555550123"] } },
    }
    ```

    작업 공간을 설정하고 봇을 트리거할 수 있는 사용자를 제한합니다.

  </Accordion>

  <Accordion title="VPS에 Tailscale을 설정하고 Mac에서 연결하려면 어떻게 해야 하나요?">
    1. **VPS에 설치하고 로그인합니다**:
       ```bash
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up
       ```
    2. 동일한 tailnet을 사용하여 Tailscale 앱으로 **Mac에 설치하고 로그인합니다**.
    3. VPS가 안정적인 이름을 갖도록 Tailscale 관리 콘솔에서 **MagicDNS를 활성화합니다**.
    4. **tailnet 호스트 이름을 사용합니다**: SSH `ssh user@your-vps.tailnet-xxxx.ts.net`, Gateway WS `ws://your-vps.tailnet-xxxx.ts.net:18789`.

    SSH 없이 Control UI를 사용하려면 VPS에서 Tailscale Serve를 사용하십시오.

    ```bash
    openclaw gateway --tailscale serve
    ```

    이렇게 하면 Gateway가 루프백에 바인딩된 상태로 유지되고 Tailscale을 통해 HTTPS로 노출됩니다. [Tailscale](/ko/gateway/tailscale)을 참조하십시오.

  </Accordion>

  <Accordion title="Mac 노드를 원격 Gateway에 연결하려면 어떻게 해야 하나요(Tailscale Serve)?">
    Serve는 **Gateway Control UI + WS**를 노출하며, 노드는 동일한 Gateway WS 엔드포인트를 통해 연결됩니다.

    1. VPS와 Mac이 동일한 tailnet에 있는지 확인하십시오.
    2. macOS 앱을 Remote 모드로 사용하십시오(SSH 대상에는 tailnet 호스트 이름을 사용할 수 있습니다). 앱이 Gateway 포트를 터널링하고 노드로 연결됩니다.
    3. 노드를 승인하십시오.
       ```bash
       openclaw devices list
       openclaw devices approve <requestId>
       ```

    문서: [Gateway 프로토콜](/ko/gateway/protocol), [검색](/ko/gateway/discovery), [macOS 원격 모드](/ko/platforms/mac/remote).

  </Accordion>

  <Accordion title="두 번째 노트북에 설치해야 하나요, 아니면 노드만 추가하면 되나요?">
    두 번째 노트북에서 **로컬 도구만**(화면/카메라/실행) 사용하려면 **노드**로 추가하십시오. Gateway 하나만 사용하므로 설정이 중복되지 않습니다. 현재 로컬 노드 도구는 macOS에서만 사용할 수 있습니다. **강력한 격리**가 필요하거나 완전히 분리된 봇 두 개를 운영할 때만 두 번째 Gateway를 설치하십시오.

    문서: [노드](/ko/nodes), [노드 CLI](/ko/cli/nodes), [여러 Gateway](/ko/gateway/multiple-gateways).

  </Accordion>
</AccordionGroup>

## 환경 변수 및 .env 로드

<AccordionGroup>
  <Accordion title="OpenClaw는 환경 변수를 어떻게 로드하나요?">
    OpenClaw는 상위 프로세스(셸, launchd/systemd, CI 등)에서 환경 변수를 읽고, 다음 항목도 추가로 로드합니다.

    - 현재 작업 디렉터리의 `.env`.
    - `~/.openclaw/.env`의 전역 대체 `.env` (`$OPENCLAW_STATE_DIR/.env`).

    어느 `.env` 파일도 기존 환경 변수를 재정의하지 않습니다. 공급자 자격 증명 키는 작업 공간 `.env`에서 예외입니다. `GEMINI_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY` 같은 키와 기타 번들 공급자 인증 환경 변수는 작업 공간 `.env`에서 무시되며, 프로세스 환경, `~/.openclaw/.env` 또는 설정의 `env`에 있어야 합니다.

    설정의 인라인 환경 변수는 프로세스 환경에 해당 변수가 없을 때만 적용됩니다.

    ```json5
    {
      env: {
        OPENROUTER_API_KEY: "sk-or-...",
        vars: { GROQ_API_KEY: "gsk-..." },
      },
    }
    ```

    전체 우선순위와 소스는 [/environment](/ko/help/environment)를 참조하십시오.

  </Accordion>

  <Accordion title="서비스를 통해 Gateway를 시작했더니 환경 변수가 사라졌습니다. 어떻게 해야 하나요?">
    두 가지 해결 방법이 있습니다.

    1. 서비스가 셸 환경을 상속하지 않아도 로드되도록 누락된 키를 `~/.openclaw/.env`에 넣으십시오.
    2. 셸 가져오기를 활성화하십시오(선택적 편의 기능).
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
       이렇게 하면 로그인 셸을 실행하고 누락된 예상 키만 가져옵니다(절대 재정의하지 않음). 동일한 환경 변수는 `OPENCLAW_LOAD_SHELL_ENV=1`, `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`입니다.

  </Accordion>

  <Accordion title='COPILOT_GITHUB_TOKEN을 설정했는데 모델 상태에 "Shell env: off."가 표시되는 이유는 무엇인가요?'>
    `openclaw models status`는 **셸 환경 가져오기**가 활성화되어 있는지를 보고합니다. "Shell env: off"는 환경 변수가 누락되었다는 의미가 **아닙니다**. OpenClaw가 로그인 셸을 자동으로 로드하지 않는다는 의미일 뿐입니다.

    Gateway가 서비스(launchd/systemd)로 실행되면 셸 환경을 상속하지 않습니다. 토큰을 `~/.openclaw/.env`에 넣거나, `env.shellEnv.enabled: true`를 활성화하거나, 설정의 `env`에 추가하십시오(누락된 경우에만 적용). 그런 다음 Gateway를 다시 시작하고 다음 명령으로 다시 확인하십시오.

    ```bash
    openclaw models status
    ```

    Copilot 토큰은 `OPENCLAW_GITHUB_TOKEN`, `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` 순서로 확인됩니다.

    [/concepts/model-providers](/ko/concepts/model-providers) 및 [/environment](/ko/help/environment)를 참조하십시오.

  </Accordion>
</AccordionGroup>

## 세션 및 여러 채팅

<AccordionGroup>
  <Accordion title="새 대화를 시작하려면 어떻게 해야 하나요?">
    `/new` 또는 `/reset`을 단독 메시지로 보내십시오. [세션 관리](/ko/concepts/session)를 참조하십시오.
  </Accordion>

  <Accordion title="/new를 보내지 않아도 세션이 자동으로 초기화되나요?">
    예. 기본 초기화 정책은 **매일**입니다. 현재 세션이 시작된 시점을 기준으로 Gateway 호스트에 설정된 현지 시각(`session.reset.atHour`, 기본값 `4`, 0-23)에 세션이 전환됩니다. 대신 `mode: "idle"` 및 `session.reset.idleMinutes`를 사용하면 유휴 시간 기반 초기화로 전환할 수 있습니다. 이 방식은 일정 기간 활동이 없으면 세션을 만료합니다(Heartbeat/Cron/exec 시스템 이벤트가 아니라 마지막 실제 상호 작용을 기준으로 함).

    ```json5
    {
      session: {
        reset: { mode: "daily", atHour: 4 },
        resetByType: {
          group: { mode: "idle", idleMinutes: 120 },
          thread: { mode: "daily", atHour: 6 },
        },
        resetByChannel: {
          discord: { mode: "idle", idleMinutes: 10080 },
        },
      },
    }
    ```

    `resetByType`은 `direct`(레거시 별칭 `dm`), `group`, `thread`를 지원합니다. 최상위 레거시 `session.idleMinutes`는 `session.reset`/`resetByType` 블록이 설정되지 않은 경우 유휴 모드 기본값의 호환성 별칭으로 계속 작동합니다. 공급자가 소유한 CLI 세션이 활성화된 세션에는 암시적 일일 기본 초기화가 적용되지 않습니다. 전체 수명 주기는 [세션 관리](/ko/concepts/session)를 참조하십시오.

  </Accordion>

  <Accordion title="OpenClaw 인스턴스 팀(CEO 하나와 여러 에이전트)을 구성할 수 있나요?">
    예. **다중 에이전트 라우팅**과 **하위 에이전트**를 통해 구성할 수 있습니다. 조정 에이전트 하나와, 각각 고유한 작업 공간 및 모델을 사용하는 여러 작업자 에이전트를 둡니다.

    이는 재미있는 실험 정도로 보는 것이 좋습니다. 토큰을 많이 사용하며, 대개 세션을 분리한 봇 하나보다 효율이 낮습니다. 일반적인 모델은 대화할 봇 하나를 두고, 병렬 작업에는 서로 다른 세션을 사용하며, 필요할 때 하위 에이전트를 생성하는 방식입니다.

    문서: [다중 에이전트 라우팅](/ko/concepts/multi-agent), [하위 에이전트](/ko/tools/subagents), [에이전트 CLI](/ko/cli/agents).

  </Accordion>

  <Accordion title="작업 도중 컨텍스트가 잘린 이유는 무엇인가요? 어떻게 방지하나요?">
    세션 컨텍스트는 모델 창의 제한을 받습니다. 긴 채팅, 큰 도구 출력 또는 많은 파일로 인해 Compaction이나 잘림이 발생할 수 있습니다.

    - 봇에게 현재 상태를 요약하여 파일에 기록하도록 요청하십시오.
    - 긴 작업 전에는 `/compact`를 사용하고, 주제를 전환할 때는 `/new`를 사용하십시오.
    - 중요한 컨텍스트는 작업 공간에 보관하고 봇에게 다시 읽도록 요청하십시오.
    - 긴 작업이나 병렬 작업에는 하위 에이전트를 사용하여 기본 채팅의 크기를 작게 유지하십시오.
    - 이런 일이 자주 발생하면 컨텍스트 창이 더 큰 모델을 선택하십시오.

  </Accordion>

  <Accordion title="OpenClaw는 설치된 상태로 유지하면서 완전히 초기화하려면 어떻게 해야 하나요?">
    ```bash
    openclaw reset
    ```

    비대화형 전체 초기화:

    ```bash
    openclaw reset --scope full --yes --non-interactive
    ```

    그런 다음 설정을 다시 실행하십시오.

    ```bash
    openclaw onboard --install-daemon
    ```

    기존 설정이 감지되면 온보딩에서 **초기화** 옵션도 제공합니다. [온보딩(CLI)](/ko/start/wizard)을 참조하십시오. 프로필(`--profile` / `OPENCLAW_PROFILE`)을 사용했다면 각 상태 디렉터리(기본값 `~/.openclaw-<profile>`)를 초기화하십시오. 개발 전용 초기화인 `openclaw gateway --dev --reset`은 개발 설정, 자격 증명, 세션 및 작업 공간을 삭제합니다.

  </Accordion>

  <Accordion title='"context too large" 오류가 발생합니다. 초기화하거나 압축하려면 어떻게 해야 하나요?'>
    - **압축**(대화는 유지하고 이전 대화 내용을 요약함): `/compact` 또는 `/compact <instructions>`를 사용하여 요약 방식을 지정하십시오.
    - **초기화**(동일한 채팅 키에 새 세션 ID 사용): `/new` 또는 `/reset`.

    문제가 계속 발생하면 **세션 정리**(`agents.defaults.contextPruning`)를 조정하여 오래된 도구 출력을 제거하거나 컨텍스트 창이 더 큰 모델을 사용하십시오.

    문서: [Compaction](/ko/concepts/compaction), [세션 정리](/ko/concepts/session-pruning), [세션 관리](/ko/concepts/session).

  </Accordion>

  <Accordion title='"LLM request rejected: messages.content.tool_use.input field required"가 표시되는 이유는 무엇인가요?'>
    공급자 검증 오류입니다. 모델이 필수 `input` 없이 `tool_use` 블록을 생성했습니다. 일반적으로 세션 기록이 오래되었거나 손상되었음을 의미합니다(주로 긴 스레드 또는 도구/스키마 변경 후 발생).

    해결 방법: `/new`를 단독 메시지로 보내 새 세션을 시작하십시오.

  </Accordion>

  <Accordion title="30분마다 Heartbeat 메시지가 표시되는 이유는 무엇인가요?">
    Heartbeat는 기본적으로 **30m**마다 실행됩니다. 확인된 인증 모드가 Anthropic OAuth/토큰 인증(Claude CLI 재사용 포함)이고 `heartbeat.every`가 설정되지 않은 경우에는 **1h**마다 실행됩니다. 다음과 같이 간격을 조정하거나 비활성화하십시오.

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

    `HEARTBEAT.md`가 존재하지만 실질적으로 비어 있으면(빈 줄, Markdown/HTML 주석, ATX 제목, 펜스 표시 또는 빈 목록 항목 틀만 포함) OpenClaw는 API 호출을 절약하기 위해 Heartbeat 실행을 건너뜁니다. 파일이 없으면 Heartbeat는 계속 실행되며 모델이 수행할 작업을 결정합니다.

    에이전트별 재정의에는 `agents.list[].heartbeat`를 사용합니다. 문서: [Heartbeat](/ko/gateway/heartbeat).

  </Accordion>

  <Accordion title='WhatsApp 그룹에 "봇 계정"을 추가해야 하나요?'>
    아니요. OpenClaw는 **사용자 자신의 계정**에서 실행됩니다. 사용자가 그룹에 속해 있으면 OpenClaw가 해당 그룹을 볼 수 있습니다. 기본적으로 발신자를 허용하기 전까지 그룹 답장이 차단됩니다(`groupPolicy: "allowlist"`).

    그룹 답장을 사용자 본인에게만 제한하려면 다음과 같이 설정하십시오.

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

  <Accordion title="WhatsApp 그룹의 JID는 어떻게 확인하나요?">
    가장 빠른 방법은 로그를 실시간으로 확인하면서 그룹에 테스트 메시지를 보내는 것입니다.

    ```bash
    openclaw logs --follow --json
    ```

    `1234567890-1234567890@g.us`처럼 `@g.us`로 끝나는 `chatId`(또는 `from`)를 찾으십시오.

    이미 설정했거나 허용 목록에 추가했다면 설정에서 그룹을 나열하십시오.

    ```bash
    openclaw directory groups list --channel whatsapp
    ```

    문서: [WhatsApp](/ko/channels/whatsapp), [디렉터리](/ko/cli/directory), [로그](/ko/cli/logs).

  </Accordion>

  <Accordion title="OpenClaw가 그룹에서 답장하지 않는 이유는 무엇인가요?">
    일반적인 원인은 두 가지입니다. 멘션 제한이 기본적으로 활성화되어 있어 봇을 @멘션하거나 `mentionPatterns`와 일치해야 하는 경우, 또는 `"*"` 없이 `channels.whatsapp.groups`를 설정했으며 해당 그룹이 허용 목록에 없는 경우입니다.

    [그룹](/ko/channels/groups) 및 [그룹 메시지](/ko/channels/group-messages)를 참조하십시오.

  </Accordion>

  <Accordion title="그룹/스레드가 DM과 컨텍스트를 공유하나요?">
    기본적으로 직접 채팅은 기본 세션으로 통합됩니다. 그룹/채널에는 자체 세션 키가 있으며, Telegram 주제와 Discord 스레드는 별도의 세션입니다. [그룹](/ko/channels/groups) 및 [그룹 메시지](/ko/channels/group-messages)를 참조하십시오.
  </Accordion>

  <Accordion title="작업 공간과 에이전트를 몇 개까지 만들 수 있나요?">
    명시적인 제한은 없습니다. 수십 개 또는 수백 개도 가능하지만 다음 사항을 주의하십시오.

    - **디스크 증가**: 활성 세션과 기록은 에이전트별 SQLite 데이터베이스에 저장됩니다. 레거시/보관 아티팩트는 `~/.openclaw/agents/<agentId>/sessions/` 아래에 계속 누적될 수 있습니다.
    - **토큰 비용**: 에이전트가 많을수록 동시 모델 사용량이 늘어납니다.
    - **운영 오버헤드**: 에이전트별 인증 프로필, 작업 공간 및 채널 라우팅이 필요합니다.

    에이전트마다 **활성** 작업 공간 하나(`agents.defaults.workspace`)를 유지하고, 디스크 사용량이 증가하면 `openclaw sessions cleanup`으로 오래된 세션을 정리하십시오(활성 SQLite 상태를 직접 편집하지 마십시오). `openclaw doctor`를 사용하여 방치된 작업 공간과 프로필 불일치를 찾으십시오.

  </Accordion>

  <Accordion title="여러 봇이나 채팅을 동시에 실행할 수 있나요(Slack)? 어떻게 설정해야 하나요?">
    예. **다중 에이전트 라우팅**을 사용하여 격리된 여러 에이전트를 실행하고 채널/계정/피어별로 수신 메시지를 라우팅할 수 있습니다. Slack은 채널로 지원되며 특정 에이전트에 바인딩할 수 있습니다.

    브라우저 액세스는 강력하지만 "사람이 할 수 있는 모든 작업"을 수행할 수 있는 것은 아닙니다. 봇 방지 기능, CAPTCHA 및 MFA가 자동화를 차단할 수 있습니다. 가장 안정적으로 제어하려면 호스트에서 로컬 Chrome MCP를 사용하거나 실제로 브라우저를 실행하는 머신에서 CDP를 사용하십시오.

    권장 설정: 상시 실행되는 Gateway 호스트(VPS/Mac mini), 역할별 에이전트 하나씩(바인딩), 해당 에이전트에 바인딩된 Slack 채널, 필요할 때 Chrome MCP 또는 Node를 통한 로컬 브라우저입니다.

    문서: [다중 에이전트 라우팅](/ko/concepts/multi-agent), [Slack](/ko/channels/slack), [브라우저](/ko/tools/browser), [Node](/ko/nodes).

  </Accordion>
</AccordionGroup>

## 모델, 장애 조치 및 인증 프로필

모델 Q&A(기본값, 선택, 별칭, 전환, 장애 조치, 인증 프로필)는 [모델 FAQ](/ko/help/faq-models)에 있습니다.

## Gateway: 포트, "이미 실행 중", 원격 모드

<AccordionGroup>
  <Accordion title="Gateway는 어떤 포트를 사용합니까?">
    `gateway.port`는 WebSocket + HTTP(Control UI, 훅 등)에 사용되는 단일 다중화 포트를 제어합니다. 우선순위는 다음과 같습니다.

    ```text
    --port > OPENCLAW_GATEWAY_PORT > gateway.port > 기본값 18789
    ```

  </Accordion>

  <Accordion title='왜 openclaw gateway status에 "Runtime: running"이 표시되지만 "Connectivity probe: failed"라고 나옵니까?'>
    "Running"은 **수퍼바이저의** 관점(launchd/systemd/schtasks)이고, 연결성 프로브는 CLI가 실제로 Gateway WebSocket에 연결하는 것입니다. `openclaw gateway status`의 다음 줄을 확인하십시오. `Probe target:`(프로브가 사용한 URL), `Listening:`(실제로 포트에 바인딩된 항목), `Last gateway error:`(프로세스는 살아 있지만 포트가 수신 대기하지 않을 때 흔한 근본 원인).
  </Accordion>

  <Accordion title='왜 openclaw gateway status에서 "Config (cli)"와 "Config (service)"가 다르게 표시됩니까?'>
    서비스는 다른 구성 파일을 사용하는데 사용자는 한 구성 파일을 편집하고 있습니다(대개 `--profile` / `OPENCLAW_STATE_DIR` 불일치).

    서비스에서 사용할 동일한 `--profile` / 환경으로 다음을 실행하여 수정하십시오.

    ```bash
    openclaw gateway install --force
    ```

  </Accordion>

  <Accordion title='"another gateway instance is already listening"은 무슨 뜻입니까?'>
    OpenClaw는 시작 즉시 WebSocket 리스너(기본값 `ws://127.0.0.1:18789`)를 바인딩하여 런타임 잠금을 적용합니다. `EADDRINUSE`로 바인딩에 실패하면 `GatewayLockError`("another gateway instance is already listening")를 발생시킵니다.

    수정 방법: 다른 인스턴스를 중지하거나 포트를 비우거나 `openclaw gateway --port <port>`로 실행하십시오.

  </Accordion>

  <Accordion title="OpenClaw를 원격 모드(클라이언트가 다른 위치의 Gateway에 연결)로 실행하려면 어떻게 해야 합니까?">
    `gateway.mode: "remote"`를 설정하고 원격 WebSocket URL을 지정하십시오. 선택적으로 공유 비밀 원격 자격 증명도 설정할 수 있습니다.

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

    - `openclaw gateway`는 `gateway.mode`가 `local`일 때만 시작됩니다(또는 재정의 플래그를 전달한 경우).
    - macOS 앱은 구성 파일을 감시하며 이 값이 변경되면 실시간으로 모드를 전환합니다.
    - `gateway.remote.token` / `.password`는 클라이언트 측 원격 자격 증명일 뿐이며, 자체적으로 로컬 Gateway 인증을 활성화하지 않습니다.

  </Accordion>

  <Accordion title='Control UI에 "unauthorized"가 표시되거나 계속 재연결됩니다. 어떻게 해야 합니까?'>
    Gateway 인증 경로와 UI의 인증 방식이 일치하지 않습니다.

    사실(코드 기준):

    - Control UI는 현재 브라우저 탭과 선택한 Gateway URL 범위의 `sessionStorage`에 토큰을 보관하므로, 수명이 긴 localStorage 토큰을 영구 저장하지 않아도 같은 탭에서 새로 고침한 후 계속 작동합니다.
    - `AUTH_TOKEN_MISMATCH` 발생 시 Gateway가 재시도 힌트(`canRetryWithDeviceToken=true`, `recommendedNextStep=retry_with_device_token`)를 반환하면 신뢰할 수 있는 클라이언트는 캐시된 기기 토큰으로 제한된 재시도를 한 번 시도할 수 있습니다.
    - 이 캐시 토큰 재시도는 기기 토큰과 함께 저장된 캐시된 승인 범위를 재사용합니다. 명시적 `deviceToken` / 명시적 `scopes` 호출자는 캐시된 범위를 상속하지 않고 요청한 범위 집합을 유지합니다.
    - 이 재시도 경로 외부에서 연결 인증 우선순위는 명시적 공유 토큰/비밀번호, 명시적 `deviceToken`, 저장된 기기 토큰, 부트스트랩 토큰 순입니다.
    - 내장 설정 코드 부트스트랩은 `scopes: []`인 Node 기기 토큰과 신뢰할 수 있는 모바일 온보딩을 위한 제한된 운영자 인계 토큰을 반환합니다. 운영자 인계는 설정 시점의 네이티브 구성을 읽을 수 있지만 페어링 변경 범위나 `operator.admin`을 부여하지 않습니다.

    수정 방법:

    - 가장 빠른 방법: `openclaw dashboard`(대시보드 URL을 출력하고 복사한 뒤 열기를 시도하며, 헤드리스 환경이면 SSH 힌트를 표시합니다).
    - 아직 토큰이 없는 경우: `openclaw doctor --generate-gateway-token`.
    - 원격인 경우: 먼저 `ssh -N -L 18789:127.0.0.1:18789 user@host`로 터널링한 다음 `http://127.0.0.1:18789/`를 여십시오.
    - 공유 비밀 모드: `gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` 또는 `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`를 설정한 다음 Control UI 설정에 일치하는 비밀을 붙여 넣으십시오.
    - Tailscale Serve 모드: `gateway.auth.allowTailscale`이 활성화되어 있는지 확인하고, Tailscale ID 헤더를 우회하는 원시 루프백/tailnet URL이 아니라 Serve URL을 열었는지 확인하십시오.
    - 신뢰할 수 있는 프록시 모드: 구성된 ID 인식 프록시를 통해 접속하고 있는지 확인하십시오. 동일 호스트의 루프백 프록시는 `gateway.auth.trustedProxy.allowLoopback = true`도 필요합니다.
    - 한 번의 재시도 후에도 불일치가 지속되는 경우: 페어링된 기기 토큰을 교체하고 다시 승인하십시오.
      ```bash
      openclaw devices list
      openclaw devices rotate --device <id> --role operator
      ```
    - 교체가 거부되는 경우: 페어링된 기기 세션은 `operator.admin`도 보유하지 않는 한 **자체** 기기만 교체할 수 있으며, 명시적 `--scope` 값은 호출자의 현재 운영자 범위를 초과할 수 없습니다.
    - 여전히 해결되지 않는 경우: `openclaw status --all`과 [문제 해결](/ko/gateway/troubleshooting)을 확인하십시오. 인증 세부 정보는 [대시보드](/ko/web/dashboard)를 참조하십시오.

  </Accordion>

  <Accordion title="gateway.bind를 tailnet으로 설정했지만 루프백에서만 수신 대기합니다">
    `tailnet` 바인딩은 네트워크 인터페이스에서 Tailscale IP(100.64.0.0/10)를 선택합니다. 시스템이 Tailscale에 연결되어 있지 않거나 인터페이스가 다운된 경우, Gateway는 다른 네트워크 인터페이스를 노출하는 대신 루프백으로 대체합니다.

    수정 방법: 해당 호스트에서 Tailscale을 시작하고 Gateway를 다시 시작하거나 `gateway.bind: "loopback"` / `"lan"`으로 명시적으로 전환하십시오.

    `tailnet`은 명시적 설정이며, `auto`는 루프백을 우선합니다. 필수 동일 호스트 `127.0.0.1` 리스너를 유지하면서 비루프백 노출을 Tailnet으로 제한하려면 `gateway.bind: "tailnet"`을 사용하십시오.

  </Accordion>

  <Accordion title="같은 호스트에서 여러 Gateway를 실행할 수 있습니까?">
    일반적으로는 안 됩니다. 하나의 Gateway에서 여러 메시징 채널과 에이전트를 실행할 수 있습니다. 중복성(예: 복구 봇)이나 강력한 격리가 필요한 경우에만 여러 Gateway를 사용하고, 각각 고유한 `OPENCLAW_CONFIG_PATH`, `OPENCLAW_STATE_DIR`, `agents.defaults.workspace`, `gateway.port`로 격리하십시오.

    권장 사항: 인스턴스마다 `openclaw --profile <name> ...`(`~/.openclaw-<name>` 자동 생성), 프로필 구성마다 고유한 `gateway.port`(또는 수동 실행 시 `--port`), 그리고 `openclaw --profile <name> gateway install`로 프로필별 서비스를 사용하십시오.

    프로필은 서비스 이름에도 접미사를 붙입니다. launchd `ai.openclaw.<profile>`, systemd `openclaw-gateway-<profile>.service`, Windows `OpenClaw Gateway (<profile>)`. 한정되지 않은 `openclaw-gateway` systemd 유닛은 기본 프로필에만 존재하며, 이름 변경 전의 레거시 systemd 유닛 이름 `clawdbot-gateway`는 자동으로 마이그레이션됩니다.

    전체 가이드: [여러 Gateway](/ko/gateway/multiple-gateways).

  </Accordion>

  <Accordion title='"invalid handshake" / 코드 1008은 무슨 뜻입니까?'>
    Gateway는 **WebSocket 서버**이며 첫 번째 메시지로 `connect` 프레임을 기대합니다. 다른 메시지가 오면 **코드 1008**(정책 위반)로 연결을 종료합니다.

    일반적인 원인: WS 클라이언트 대신 브라우저에서 **HTTP** URL을 열었거나, 잘못된 포트/경로를 사용했거나, 프록시/터널이 인증 헤더를 제거했거나 Gateway가 아닌 요청을 보냈습니다.

    수정 방법: WS URL(`ws://<host>:18789` 또는 HTTPS를 통한 `wss://...`)을 사용하고, 일반 브라우저 탭에서 WS 포트를 열지 말고, 인증이 활성화된 경우 `connect` 프레임에 토큰/비밀번호를 포함하십시오. CLI/TUI 예시:

    ```bash
    openclaw tui --url ws://<host>:18789 --token <token>
    ```

    프로토콜 세부 정보: [Gateway 프로토콜](/ko/gateway/protocol).

  </Accordion>
</AccordionGroup>

## 로깅 및 디버깅

<AccordionGroup>
  <Accordion title="로그는 어디에 있습니까?">
    파일 로그(구조화): `/tmp/openclaw/openclaw-YYYY-MM-DD.log`. `logging.file`로 고정 경로를, `logging.level`로 파일 로그 수준을, `--verbose` 및 `logging.consoleLevel`로 콘솔 상세도를 설정하십시오.

    가장 빠르게 추적하는 방법:

    ```bash
    openclaw logs --follow
    ```

    서비스/수퍼바이저 로그(Gateway가 launchd/systemd를 통해 실행되는 경우):

    - macOS launchd stdout: `~/Library/Logs/openclaw/gateway.log`(프로필은 `gateway-<profile>.log` 사용, stderr는 억제됨).
    - Linux: `journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`.
    - Windows: `schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`.

    자세한 내용은 [문제 해결](/ko/gateway/troubleshooting)을 참조하십시오.

  </Accordion>

  <Accordion title="Gateway 서비스를 시작/중지/다시 시작하려면 어떻게 해야 합니까?">
    ```bash
    openclaw gateway status
    openclaw gateway restart
    ```

    Gateway를 수동으로 실행하는 경우 `openclaw gateway --force`로 포트를 회수할 수 있습니다. [Gateway](/ko/gateway)를 참조하십시오.

  </Accordion>

  <Accordion title="Windows에서 터미널을 닫았습니다. OpenClaw를 어떻게 다시 시작합니까?">
    Windows 설치 모드는 세 가지입니다.

    **1) Windows Hub 로컬 설정**: 네이티브 앱이 앱 소유의 로컬 WSL Gateway를 관리합니다. 시작 메뉴나 트레이에서 **OpenClaw Companion**을 연 다음 **Gateway Setup** 또는 Connections 탭을 사용하십시오.

    **2) 수동 WSL2 Gateway**: Gateway는 Linux 내부에서 실행됩니다.
    ```powershell
    wsl
    openclaw gateway status
    openclaw gateway restart
    ```
    서비스를 설치하지 않았다면 포그라운드에서 시작하십시오: `openclaw gateway run`.

    **3) 네이티브 Windows CLI/Gateway**: Windows에서 직접 실행됩니다.
    ```powershell
    openclaw gateway status
    openclaw gateway restart
    ```
    수동으로 실행하는 경우(서비스 없음): `openclaw gateway run`.

    문서: [Windows](/ko/platforms/windows), [Gateway 서비스 런북](/ko/gateway).

  </Accordion>

  <Accordion title="Gateway는 실행 중이지만 응답이 도착하지 않습니다. 무엇을 확인해야 합니까?">
    빠른 상태 점검:

    ```bash
    openclaw status
    openclaw models status
    openclaw channels status
    openclaw logs --follow
    ```

    일반적인 원인: **Gateway 호스트**에 모델 인증이 로드되지 않음(`models status` 확인), 채널 페어링/허용 목록이 응답을 차단함(채널 구성 및 로그 확인), 또는 올바른 토큰 없이 WebChat/대시보드를 열었음. 원격인 경우 터널/Tailscale 연결이 활성 상태이고 Gateway WebSocket에 연결할 수 있는지 확인하십시오.

    문서: [채널](/ko/channels), [문제 해결](/ko/gateway/troubleshooting), [원격 액세스](/ko/gateway/remote).

  </Accordion>

  <Accordion title='"Disconnected from gateway: no reason" - 어떻게 해야 합니까?'>
    일반적으로 UI의 WebSocket 연결이 끊겼음을 의미합니다. 다음을 확인하십시오. Gateway가 실행 중입니까(`openclaw gateway status`)? 정상 상태입니까(`openclaw status`)? UI에 올바른 토큰이 있습니까(`openclaw dashboard`)? 원격인 경우 터널/Tailscale 링크가 활성 상태입니까?

    그런 다음 로그를 추적하십시오.

    ```bash
    openclaw logs --follow
    ```

    문서: [대시보드](/ko/web/dashboard), [원격 액세스](/ko/gateway/remote), [문제 해결](/ko/gateway/troubleshooting).

  </Accordion>

  <Accordion title="Telegram setMyCommands가 실패합니다. 무엇을 확인해야 합니까?">
    ```bash
    openclaw channels status
    openclaw channels logs --channel telegram
    ```

    그런 다음 오류와 대조하십시오.

    - `BOT_COMMANDS_TOO_MUCH`: Telegram 메뉴의 항목이 너무 많습니다. OpenClaw는 이미 Telegram 제한에 맞게 항목을 줄이고 더 적은 명령으로 재시도하지만, 일부 메뉴 항목은 여전히 누락될 수 있습니다. 플러그인/스킬/사용자 지정 명령을 줄이거나, 메뉴가 필요하지 않다면 `channels.telegram.commands.native`를 비활성화하십시오.
    - `TypeError: fetch failed`, `Network request for 'setMyCommands' failed!` 또는 이와 유사한 네트워크 오류: VPS 또는 프록시 뒤에서 실행하는 경우 아웃바운드 HTTPS가 허용되어 있고 `api.telegram.org`에 대한 DNS가 작동하는지 확인하십시오.

    Gateway가 원격에 있다면 Gateway 호스트에서 로그를 확인하십시오.

    문서: [Telegram](/ko/channels/telegram), [채널 문제 해결](/ko/channels/troubleshooting).

  </Accordion>

  <Accordion title="TUI에 출력이 표시되지 않습니다. 무엇을 확인해야 합니까?">
    ```bash
    openclaw status
    openclaw models status
    openclaw logs --follow
    ```

    TUI에서 `/status`를 사용하여 현재 상태를 확인하십시오. 채팅 채널에서 응답을 받을 것으로 예상한다면 전달이 활성화되어 있는지 확인하십시오(`/deliver on`).

    문서: [TUI](/ko/web/tui), [슬래시 명령](/ko/tools/slash-commands).

  </Accordion>

  <Accordion title="Gateway를 완전히 중지한 다음 다시 시작하려면 어떻게 해야 합니까?">
    서비스를 설치한 경우(macOS에서는 launchd, Linux에서는 systemd):

    ```bash
    openclaw gateway stop
    openclaw gateway start
    ```

    포그라운드에서는 Ctrl-C로 중지한 다음 `openclaw gateway run`을 실행하십시오.

    문서: [Gateway 서비스 런북](/ko/gateway).

  </Accordion>

  <Accordion title="쉬운 설명: openclaw gateway restart와 openclaw gateway의 차이">
    `openclaw gateway restart`는 **백그라운드 서비스**(launchd/systemd)를 다시 시작합니다. `openclaw gateway`는 이 터미널 세션에서 Gateway를 **포그라운드로** 실행합니다. 서비스를 설치했다면 Gateway 하위 명령을 사용하고, 일회성 실행에는 하위 명령 없는 포그라운드 실행을 사용하십시오.
  </Accordion>

  <Accordion title="문제가 발생했을 때 세부 정보를 가장 빠르게 확인하는 방법">
    더 자세한 콘솔 정보를 보려면 `--verbose`로 Gateway를 시작한 다음, 채널 인증, 모델 라우팅 및 RPC 오류를 로그 파일에서 확인하십시오.
  </Accordion>
</AccordionGroup>

## 미디어 및 첨부 파일

<AccordionGroup>
  <Accordion title="내 스킬이 이미지/PDF를 생성했지만 아무것도 전송되지 않았습니다">
    에이전트의 아웃바운드 첨부 파일은 `media`, `mediaUrl`, `path` 또는 `filePath`와 같은 구조화된 미디어 필드를 사용해야 합니다. [OpenClaw 어시스턴트 설정](/ko/start/openclaw) 및 [에이전트 전송](/ko/tools/agent-send)을 참조하십시오.

    ```bash
    openclaw message send --target +15555550123 --message "여기 있습니다" --media /path/to/file.png
    ```

    또한 다음을 확인하십시오. 대상 채널이 아웃바운드 미디어를 지원하며 허용 목록에 의해 차단되지 않았는지, 파일이 제공자의 크기 제한 이내인지(이미지는 최대 변 길이가 2048px이 되도록 크기가 조정됨), `tools.fs.workspaceOnly=true`가 로컬 경로 전송을 워크스페이스, 임시/미디어 저장소 및 샌드박스에서 검증된 파일로 제한하는지 확인하십시오. `tools.fs.workspaceOnly=false`(기본값)를 사용하면 구조화된 로컬 미디어 전송에서 에이전트가 이미 읽을 수 있는 호스트 로컬 파일을 미디어 및 안전한 문서 유형(이미지, 오디오, 동영상, PDF, Office 문서와 Markdown/MD, TXT, JSON, YAML/YML 같은 검증된 텍스트 문서)에 사용할 수 있습니다. 이는 비밀 스캐너가 아닙니다. 에이전트가 읽을 수 있는 `secret.txt` 또는 `config.json`은 확장자 및 콘텐츠 검증이 일치하면 첨부될 수 있습니다. 민감한 파일은 에이전트가 읽을 수 있는 경로 밖에 두거나, 더 엄격한 로컬 경로 전송을 위해 `tools.fs.workspaceOnly=true`를 유지하십시오.

    [이미지](/ko/nodes/images)를 참조하십시오.

  </Accordion>
</AccordionGroup>

## 보안 및 액세스 제어

<AccordionGroup>
  <Accordion title="OpenClaw를 인바운드 DM에 노출해도 안전합니까?">
    인바운드 DM을 신뢰할 수 없는 입력으로 취급하십시오. 기본값은 위험을 줄입니다.

    - DM을 지원하는 채널의 기본 동작은 **페어링**입니다. 알 수 없는 발신자는 페어링 코드를 받으며 메시지는 처리되지 않습니다. `openclaw pairing approve --channel <channel> [--account <id>] <code>`로 승인하십시오. 대기 중인 요청은 **채널당 3개**로 제한됩니다. 코드가 도착하지 않았다면 `openclaw pairing list --channel <channel> [--account <id>]`를 확인하십시오.
    - DM을 공개적으로 개방하려면 명시적으로 사용 설정해야 합니다(`dmPolicy: "open"` 및 허용 목록 `"*"`).

    위험한 DM 정책을 표시하려면 `openclaw doctor`를 실행하십시오.

  </Accordion>

  <Accordion title="프롬프트 인젝션은 공개 봇에서만 문제가 됩니까?">
    아닙니다. 프롬프트 인젝션은 누가 봇에 DM을 보낼 수 있는지만이 아니라 **신뢰할 수 없는 콘텐츠**와 관련된 문제입니다. 어시스턴트가 외부 콘텐츠(웹 검색/가져오기, 브라우저 페이지, 이메일, 문서, 첨부 파일, 붙여 넣은 로그)를 읽는 경우, 발신자가 본인뿐이더라도 해당 콘텐츠에는 모델을 탈취하려는 지침이 포함될 수 있습니다.

    가장 큰 위험은 도구가 활성화된 경우입니다. 모델이 속아서 컨텍스트를 유출하거나 사용자를 대신해 도구를 호출할 수 있습니다. 피해 범위를 줄이려면 다음과 같이 하십시오.

    - 읽기 전용 또는 도구가 비활성화된 "리더" 에이전트를 사용하여 신뢰할 수 없는 콘텐츠를 요약합니다.
    - 도구가 활성화된 에이전트에서는 `web_search` / `web_fetch` / `browser`를 비활성화합니다.
    - 디코딩된 파일/문서 텍스트도 신뢰할 수 없는 것으로 취급합니다. OpenResponses `input_file`과 미디어 첨부 파일 추출은 모두 원시 파일 텍스트를 전달하는 대신, 추출된 텍스트를 명시적인 외부 콘텐츠 경계 마커로 감쌉니다.
    - 샌드박스를 사용하고 엄격한 도구 허용 목록을 적용합니다.

    자세한 내용: [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="OpenClaw가 Rust/WASM 대신 TypeScript/Node를 사용하므로 덜 안전합니까?">
    언어와 런타임도 중요하지만 개인용 에이전트의 주요 위험 요소는 아닙니다. 실질적인 위험 요소는 Gateway 노출, 봇에 메시지를 보낼 수 있는 사용자, 프롬프트 인젝션, 도구 범위, 자격 증명 처리, 브라우저 액세스, exec 액세스 및 타사 스킬/플러그인에 대한 신뢰입니다.

    Rust와 WASM은 일부 코드 유형에 더 강력한 격리를 제공할 수 있지만, 프롬프트 인젝션, 잘못된 허용 목록, 공개 Gateway 노출, 지나치게 광범위한 도구 또는 민감한 계정에 이미 로그인된 브라우저 프로필을 해결하지는 못합니다. 다음을 주요 제어 수단으로 취급하십시오. Gateway를 비공개 또는 인증된 상태로 유지하고, DM/그룹에 페어링과 허용 목록을 사용하며, 신뢰할 수 없는 입력에 대해서는 위험한 도구를 거부하거나 샌드박스에서 실행하고, 신뢰할 수 있는 플러그인과 스킬만 설치하며, 구성 변경 후 `openclaw security audit --deep`을 실행하십시오.

    자세한 내용: [보안](/ko/gateway/security), [샌드박싱](/ko/gateway/sandboxing).

  </Accordion>

  <Accordion title="노출된 OpenClaw 인스턴스에 관한 보고를 보았습니다. 무엇을 확인해야 합니까?">
    ```bash
    openclaw security audit --deep
    openclaw gateway status
    ```

    더 안전한 기준은 다음과 같습니다. Gateway를 `loopback`에 바인딩하거나 인증된 비공개 액세스(tailnet, SSH 터널, 토큰/비밀번호 인증 또는 올바르게 구성된 신뢰할 수 있는 프록시)를 통해서만 노출합니다. DM은 `pairing` 또는 `allowlist` 모드로 설정합니다. 모든 구성원을 신뢰하는 경우가 아니라면 그룹을 허용 목록에 추가하고 멘션을 필수로 설정합니다. 신뢰할 수 없는 콘텐츠를 읽는 에이전트에서는 고위험 도구(`exec`, `browser`, `gateway`, `cron`)를 거부하거나 범위를 엄격히 제한합니다. 도구 실행의 피해 범위를 줄여야 하는 경우 샌드박싱을 활성화합니다.

    인증 없는 공개 바인딩, 도구가 활성화된 개방형 DM/그룹, 노출된 브라우저 제어를 가장 먼저 수정해야 합니다. 자세한 내용: [openclaw security audit](/ko/gateway/security#openclaw-security-audit).

  </Accordion>

  <Accordion title="ClawHub 스킬과 타사 플러그인을 설치해도 안전합니까?">
    타사 스킬과 플러그인은 신뢰하기로 선택한 코드로 취급하십시오. ClawHub 스킬 페이지는 설치 전에 검사 상태를 표시하지만, 검사가 완전한 보안 경계는 아닙니다. OpenClaw는 플러그인/스킬 설치 또는 업데이트 중에 기본 제공 로컬 위험 코드 차단을 실행하지 않습니다. 로컬 허용/차단 결정에는 운영자가 관리하는 `security.installPolicy`를 사용하십시오.

    더 안전한 패턴은 다음과 같습니다. 신뢰할 수 있는 작성자와 고정된 버전을 선호하고, 스킬/플러그인을 활성화하기 전에 내용을 읽으며, 플러그인/스킬 허용 목록을 좁게 유지하고, 최소한의 도구만 제공되는 샌드박스에서 신뢰할 수 없는 입력 워크플로를 실행하며, 타사 코드에 광범위한 파일 시스템, exec, 브라우저 또는 비밀 액세스 권한을 부여하지 마십시오.

    자세한 내용: [Skills](/ko/tools/skills), [플러그인](/ko/tools/plugin), [보안](/ko/gateway/security).

  </Accordion>

  <Accordion title="봇에 별도의 이메일, GitHub 계정 또는 전화번호를 제공해야 합니까?">
    대부분의 설정에서는 그렇습니다. 봇을 별도의 계정 및 전화번호로 격리하면 문제가 발생했을 때 피해 범위가 줄어들고, 개인 계정에 영향을 주지 않고 자격 증명을 교체하거나 액세스를 취소하기가 쉬워집니다.

    작게 시작하십시오. 실제로 필요한 도구와 계정에만 액세스 권한을 부여하고, 필요한 경우 나중에 확장하십시오.

    문서: [보안](/ko/gateway/security), [페어링](/ko/channels/pairing).

  </Accordion>

  <Accordion title="내 문자 메시지를 자율적으로 처리하도록 해도 되며, 안전합니까?">
    개인 메시지에 대한 완전한 자율성은 권장하지 **않습니다**. 가장 안전한 패턴은 DM을 **페어링 모드** 또는 엄격한 허용 목록으로 유지하고, 사용자를 대신해 메시지를 보내야 한다면 **별도의 번호 또는 계정**을 사용하며, 에이전트가 초안을 작성하되 사용자가 **전송 전에 승인**하는 것입니다.

    실험하려면 전용으로 격리된 계정에서 수행하십시오. [보안](/ko/gateway/security)을 참조하십시오.

  </Accordion>

  <Accordion title="개인 어시스턴트 작업에 더 저렴한 모델을 사용할 수 있습니까?">
    에이전트가 채팅 전용이고 입력을 신뢰할 수 있다면 **가능합니다**. 더 작은 등급의 모델은 지침 탈취에 더 취약하므로, 도구가 활성화된 에이전트나 신뢰할 수 없는 콘텐츠를 읽는 경우에는 사용하지 마십시오. 더 작은 모델을 반드시 사용해야 한다면 도구를 엄격히 제한하고 샌드박스 내부에서 실행하십시오. [보안](/ko/gateway/security)을 참조하십시오.
  </Accordion>

  <Accordion title="Telegram에서 /start를 실행했지만 페어링 코드를 받지 못했습니다">
    페어링 코드는 알 수 없는 발신자가 봇에 메시지를 보내고 `dmPolicy: "pairing"`이 활성화된 경우에만 전송됩니다. `/start`만으로는 코드가 생성되지 않습니다.

    대기 중인 요청을 확인하십시오.

    ```bash
    openclaw pairing list telegram
    ```

    즉시 액세스하려면 발신자 ID를 허용 목록에 추가하거나 해당 계정에 대해 `dmPolicy: "open"`을 설정하십시오.

  </Accordion>

  <Accordion title="WhatsApp: 내 연락처에 메시지를 보냅니까? 페어링은 어떻게 작동합니까?">
    아닙니다. WhatsApp의 기본 DM 정책은 **페어링**입니다. 알 수 없는 발신자는 페어링 코드만 받으며 메시지는 **처리되지 않습니다**. OpenClaw는 수신한 채팅에만 응답하거나 사용자가 명시적으로 실행한 전송에만 메시지를 보냅니다.

    ```bash
    openclaw pairing approve whatsapp <code>
    openclaw pairing list whatsapp
    ```

    마법사의 전화번호 프롬프트는 본인의 DM을 허용하도록 **허용 목록/소유자**를 설정합니다. 자동 전송에는 사용되지 않습니다. 개인 WhatsApp 번호에서는 해당 번호를 사용하고 `channels.whatsapp.selfChatMode`를 활성화하십시오.

  </Accordion>
</AccordionGroup>

## 채팅 명령, 작업 중단 및 "중지되지 않음"

<AccordionGroup>
  <Accordion title="채팅에 내부 시스템 메시지가 표시되지 않게 하려면 어떻게 해야 합니까?">
    대부분의 내부/도구 메시지는 해당 세션에서 **verbose**, **trace** 또는 **reasoning**이 활성화된 경우에만 표시됩니다.

    메시지가 표시되는 채팅에서 다음과 같이 수정하십시오.

    ```text
    /verbose off
    /trace off
    /reasoning off
    ```

    여전히 메시지가 많다면 Control UI에서 세션 설정을 확인하고 verbose를 **inherit**으로 설정하십시오. 구성에서 `verboseDefault: "on"`인 봇 프로필을 사용하고 있지 않은지도 확인하십시오.

    문서: [사고 및 상세 출력](/ko/tools/thinking), [보안](/ko/gateway/security/index#reasoning-and-verbose-output-in-groups).

  </Accordion>

  <Accordion title="실행 중인 작업을 중지/취소하려면 어떻게 해야 합니까?">
    중단을 실행하려면 다음 중 하나를 **독립된 메시지로**(슬래시 없이) 보내십시오. `stop`, `stop action`, `stop current action`, `stop run`, `stop current run`, `stop agent`, `stop the agent`, `stop openclaw`, `openclaw stop`, `stop don't do anything`, `stop do not do anything`, `stop doing anything`, `do not do that`, `please stop`, `stop please`, `abort`, `esc`, `exit`, `interrupt`, `halt`. 일반적인 비영어권 트리거(프랑스어, 독일어, 스페인어, 중국어, 일본어, 힌디어, 아랍어, 러시아어)도 작동합니다.

    exec 도구로 시작된 백그라운드 프로세스의 경우 에이전트에게 다음을 실행하도록 요청하십시오.

    ```text
    process action:kill sessionId:XXX
    ```

    대부분의 슬래시 명령은 `/`로 시작하는 **독립된** 메시지로 보내야 하지만, 일부 단축 명령(예: `/status`)은 허용 목록에 있는 발신자가 인라인으로 사용해도 작동합니다. [슬래시 명령](/ko/tools/slash-commands)을 참조하십시오.

  </Accordion>

  <Accordion title='Telegram에서 Discord 메시지를 어떻게 보내나요? ("컨텍스트 간 메시징이 거부됨")'>
    OpenClaw는 기본적으로 **프로바이더 간** 메시징을 차단합니다. 도구 호출이 Telegram에 바인딩되어 있으면 명시적으로 허용하지 않는 한 Discord로 전송되지 않습니다. 이 설정은 Gateway를 다시 시작하지 않아도 즉시 적용됩니다.

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

  </Accordion>

  <Accordion title='봇이 빠르게 연속으로 보낸 메시지를 "무시하는" 것처럼 느껴지는 이유는 무엇인가요?'>
    실행 중에 입력된 프롬프트는 기본적으로 활성 실행에 반영됩니다. `/queue`를 사용하여 활성 실행 동작을 선택하십시오.

    - `steer`(기본값) - 다음 모델 경계에서 활성 실행을 유도합니다.
    - `followup` - 메시지를 큐에 넣고 현재 실행이 끝난 후 하나씩 실행합니다.
    - `collect` - 호환되는 메시지를 큐에 넣고 현재 실행이 끝난 후 한 번만 응답합니다.
    - `interrupt` - 현재 실행을 중단하고 새로 시작합니다.

    큐 모드에 `debounce:0.5s cap:25 drop:summarize` 같은 옵션을 추가할 수 있습니다. [명령 큐](/ko/concepts/queue)와 [스티어링 큐](/ko/concepts/queue-steering)를 참조하십시오.

  </Accordion>
</AccordionGroup>

## 기타

<AccordionGroup>
  <Accordion title='API 키를 사용할 때 Anthropic의 기본 모델은 무엇인가요?'>
    자격 증명과 모델 선택은 별개입니다. `ANTHROPIC_API_KEY`를 설정하거나 인증 프로필에 Anthropic API 키를 저장하면 인증이 활성화되지만, 실제 기본 모델은 `agents.defaults.model.primary`에 구성한 모델입니다(예: `anthropic/claude-sonnet-4-6` 또는 `anthropic/claude-opus-4-6`). `No credentials found for profile "anthropic:default"`는 Gateway가 실행 중인 에이전트의 예상 `auth-profiles.json`에서 Anthropic 자격 증명을 찾지 못했다는 의미입니다.
  </Accordion>
</AccordionGroup>

---

그래도 해결되지 않나요? [Discord](https://discord.com/invite/clawd)에서 질문하거나 [GitHub 토론](https://github.com/openclaw/openclaw/discussions)을 시작하십시오.

## 관련 문서

- [최초 실행 FAQ](/ko/help/faq-first-run) - 설치, 온보딩, 인증, 구독, 초기 오류
- [모델 FAQ](/ko/help/faq-models) - 모델 선택, 장애 조치, 인증 프로필
- [문제 해결](/ko/help/troubleshooting) - 증상 우선 분류
