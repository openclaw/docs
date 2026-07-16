---
read_when:
    - 공식 Codex app-server 하네스를 사용하려고 합니다
    - Codex 하네스 구성 예제가 필요합니다
    - Codex 전용 배포에서 OpenClaw로 대체되는 대신 실패하도록 설정하려는 경우
summary: 공식 Codex app-server 하네스를 통해 OpenClaw 임베디드 에이전트 턴을 실행합니다
title: Codex 하네스
x-i18n:
    generated_at: "2026-07-16T12:49:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f27d934036ca6952ec12bbda3d275d08701a38ac9c79df37fc6040f01b529cd
    source_path: plugins/codex-harness.md
    workflow: 16
---

공식 `codex` Plugin은 기본 제공 OpenClaw 하네스 대신 Codex
app-server를 통해 임베디드 OpenAI 에이전트 턴을 실행합니다. Codex는
저수준 에이전트 세션, 즉 네이티브 스레드 재개, 네이티브 도구 계속 실행,
네이티브 Compaction 및 app-server 실행을 담당합니다. OpenClaw는 계속해서 채팅
채널, 세션 파일, 모델 선택, OpenClaw 동적 도구, 승인,
미디어 전달 및 표시되는 트랜스크립트 미러를 담당합니다.

`openai/gpt-5.6-sol` 같은 표준 OpenAI 모델 참조를 사용하십시오. 레거시
Codex GPT 참조를 구성하지 말고, OpenAI 에이전트 인증 순서를 `auth.order.openai` 아래에 두십시오.
레거시 Codex 인증 프로필 ID와 레거시 Codex 인증 순서 항목은
`openclaw doctor --fix`에서 복구됩니다.

제공자/모델 런타임 정책이 설정되지 않았거나 `auto`인 경우, `openai/*` 접두사만으로는
이 하네스가 선택되지 않습니다. OpenAI는 작성된 요청 재정의가 없는
정확한 공식 HTTPS Platform Responses 또는 ChatGPT Responses 경로에 대해서만 Codex를
암시적으로 선택할 수 있습니다. 다음을 참조하십시오.
[OpenAI 암시적 에이전트 런타임](/ko/providers/openai#implicit-agent-runtime).
Platform과 ChatGPT 중 어느 경로인지 확인되기 전에 Codex가 인증을 담당하는 경우에도 OpenClaw는
모든 후보 경로가 Codex 호환성을 선언하도록 요구합니다. 네이티브
인증 소유권만으로는 이 경로 검사를 우회할 수 없습니다.

OpenClaw 샌드박스가 활성화되어 있지 않으면 OpenClaw는 Codex 네이티브 코드 모드를
활성화하여 Codex app-server 스레드를 시작합니다(code-mode-only는 기본적으로 비활성화 상태를 유지함). 따라서
네이티브 워크스페이스/코드 기능을 app-server `item/tool/call` 브리지를 통해 라우팅되는 OpenClaw
동적 도구와 함께 계속 사용할 수 있습니다. 활성화된
OpenClaw 샌드박스나 제한된 도구 정책은 실험적 샌드박스 exec-server 경로를 사용하도록 명시적으로 설정하지 않는 한
네이티브 코드 모드를 완전히 비활성화합니다.

기본 `tools.exec.host: "auto"`를 사용하고 활성화된 OpenClaw 샌드박스가 없으면
Codex는 페어링된 Node에서 명령을 실행하기 위한 `node_exec` 및 `node_process` 도구도 받습니다.
네이티브 셸은 Codex app-server 호스트와 워크스페이스에 유지되며
(기본 stdio 배포에서는 Gateway 로컬), `node_exec`는 이름 또는 ID로 Node를 선택하고
OpenClaw의 Node 승인 정책을 계속 적용합니다. 유한한
런타임 허용 목록이 네이티브 Code Mode를 비활성화하여 턴에 실행 환경이 남지 않으면,
OpenClaw는 대신 정책에 따라 필터링된 `exec` 및 `process`
도구를 직접적인 비샌드박스 실행에 사용할 수 있도록 유지합니다.

이 Codex 네이티브 기능은 일반 OpenClaw 실행을 위한 옵트인 QuickJS-WASI 런타임인
[OpenClaw 코드 모드](/ko/reference/code-mode)와 별개이며,
`exec` 입력 형식도 다릅니다. 더 광범위한 모델/제공자/런타임 구분은
[에이전트 런타임](/ko/concepts/agent-runtimes)부터 참조하십시오. `openai/gpt-5.6-sol`는 모델
참조이고, `codex`는 런타임이며, Telegram, Discord, Slack 또는 다른
채널은 통신 표면입니다.

## 요구 사항

- 공식 `@openclaw/codex` Plugin이 설치되어 있어야 합니다. 구성에서 허용 목록을 사용하는 경우
  `plugins.allow`에 `codex`를 포함하십시오.
- Codex app-server `0.143.0` 이상이 필요합니다. Plugin은 기본적으로 호환되는
  바이너리를 관리하므로 `PATH`의 `codex` 명령은 정상적인
  시작에 영향을 주지 않습니다.
- `openclaw models auth login --provider openai`을 통한 Codex 인증,
  에이전트의 Codex 홈에 이미 존재하는 app-server 계정 또는
  명시적인 Codex API 키 인증 프로필이 필요합니다.

인증 우선순위, 환경 격리, 사용자 지정 app-server 명령,
모델 검색 및 전체 구성 필드 목록은
[Codex 하네스 참조](/ko/plugins/codex-harness-reference)를 참조하십시오.

## 빠른 시작

공식 Plugin을 설치한 다음 Codex OAuth로 로그인하십시오.

```bash
openclaw plugins install @openclaw/codex
openclaw models auth login --provider openai
```

`codex` Plugin을 활성화하고 OpenAI 에이전트 모델을 선택하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

구성에서 `plugins.allow`를 사용하는 경우 `codex`도 추가하십시오.

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Plugin 구성을 변경한 후 Gateway를 다시 시작하십시오. 채팅에 이미
세션이 있는 경우 다음 턴이 현재 구성에서 하네스를 확인하도록 먼저 `/new` 또는 `/reset`을 실행하십시오.

## Codex Desktop 및 CLI와 스레드 공유

기본 `appServer.homeScope: "agent"`는 각 OpenClaw 에이전트를
운영자의 네이티브 Codex 상태에서 격리합니다. 소유자가 Codex Desktop 및 Codex CLI에 표시되는
동일한 네이티브 스레드를 검사하고 관리할 수 있게 하려면
사용자 Codex 홈을 사용하도록 설정하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            homeScope: "user",
          },
        },
      },
    },
  },
}
```

사용자 홈 모드는 로컬 관리형 stdio 프로세스 또는 공유 Unix 소켓
전송을 지원합니다. 설정된 경우 `$CODEX_HOME`을 사용하고, 그렇지 않으면 `~/.codex`을 사용하며,
해당 홈의 네이티브 Codex 인증, 구성, Plugin 및 스레드 저장소도 포함됩니다. OpenClaw는
이 app-server에 OpenClaw 인증 프로필을 삽입하지 않습니다.

소유자 턴에는 `codex_threads` 도구가 제공됩니다. 네이티브 스레드를 나열, 검색, 읽기, 포크, 이름 변경,
보관 및 복원할 수 있습니다. OpenClaw에서 계속하려면 스레드를 포크하십시오.
포크는 현재 OpenClaw 세션에 연결되며 다른 네이티브 Codex 클라이언트에도
계속 표시됩니다. 보관하려면 해당 스레드가 다른 곳에서 종료되었다는
명시적 확인이 필요합니다. 감독도 활성화된 경우
트랜스크립트 필드와 변경에는 일치하는 `supervision.allowRawTranscripts` 또는 `supervision.allowWriteControls` 옵트인이 필요합니다.

독립적으로 관리되는 여러 stdio App Server를 통해 동일한 스레드를 동시에
재개하거나 작성하지 마십시오. Codex는 하나의 App Server 내부에서는 활성 작성자를 조정하지만
서로 다른 프로세스 간에는 조정하지 않습니다. 일반적인
사용자 홈 stdio 세션에서는 포크가 안전한 공존 경로입니다.

`appServer.homeScope: "user"`만으로는 플릿 카탈로그를 제어하지 않습니다. Plugin이 활성화되어 있는 동안
네이티브 세션 검색이 활성화됩니다. Codex를
비활성화하지 않고 OpenClaw 사이드바에서 제거하려면 `sessionCatalog.enabled: false`을 설정하십시오.
카탈로그는 별도의 감독 연결을 사용합니다. 명시적인 `appServer` 연결 설정이 없으면
일반 하네스가 에이전트 범위로 유지되는 동안 해당 연결은 기본적으로 관리형
사용자 홈 stdio를 사용합니다. 명시적인 `appServer` 설정은 두 경로 모두에 적용됩니다. 일반 하네스도
네이티브 상태를 공유해야 하는 경우 위와 같이 `homeScope: "user"`를 명시적으로 설정하십시오.

## Codex 세션 감독

동일한 `codex` Plugin은 Gateway 컴퓨터와 옵트인한 페어링 Node에서
보관되지 않은 Codex 세션을 나열할 수 있습니다. 저장되었거나 유휴 상태인 Gateway 로컬 세션은
제한된 범위로 저장된 사용자 및 어시스턴트 기록을 미러링하는 모델 고정 Chat을
생성할 수 있습니다. 비공개 바인딩은 일반 Codex 세션이
에이전트 범위로 유지되는 동안 네이티브 스냅샷, 표준 브랜치 및 이후 턴에 감독 연결을 사용합니다.
첫 표준 시작에서는 Codex가 스냅샷 포크에 대해 반환하는 모델과 제공자를 정확히 사용합니다.
이후 재개에서는 Codex의 네이티브 구성이 선택을 담당하며,
외부 OpenClaw 모델과 폴백 체인은 이를 대체하지 않습니다.
저장된 행과 유휴 행은 다른 러너가 없다는 명시적 확인 후 보관할 수 있습니다.
활성 소스에서는 브랜치를 생성하거나 보관할 수 없지만, 기존의
감독 대상 Chat은 계속 열 수 있습니다. 페어링 Node 세션은 메타데이터 전용으로 유지됩니다.

설정, 브랜치 규칙, 페어링 Node 제한, 메타데이터 노출 및 문제 해결은
[Codex 세션 감독](/ko/plugins/codex-supervision)을 참조하십시오.

## 구성

| 요구 사항                                           | 설정                                                                                             | 위치                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| 하네스 활성화                                       | `plugins.entries.codex.enabled: true`                                                            | OpenClaw 구성                      |
| 네이티브 Codex 세션 검색 숨기기                     | `plugins.entries.codex.config.sessionCatalog.enabled: false`                                     | Codex Plugin 구성                  |
| 허용 목록이 적용된 Plugin 설치 유지                 | `plugins.allow`에 `codex` 포함                                                               | OpenClaw 구성                      |
| 적격한 OpenAI 턴이 Codex를 암시적으로 사용하도록 허용 | 정확한 공식 HTTPS Responses/ChatGPT 경로, 작성된 요청 재정의 없음, 런타임 미설정/`auto` | OpenAI 제공자/모델 구성            |
| ChatGPT/Codex OAuth로 로그인                        | `openclaw models auth login --provider openai`                                                   | CLI 인증 프로필                    |
| Codex 실행용 API 키 백업 추가                       | `auth.order.openai`에서 구독 인증 뒤에 나열된 `openai:*` API 키 프로필                 | CLI 인증 프로필 + OpenClaw 구성    |
| Codex를 사용할 수 없을 때 실패로 종료               | 제공자 또는 모델 `agentRuntime.id: "codex"`                                                     | OpenClaw 모델/제공자 구성          |
| 직접 OpenAI API 트래픽 사용                         | 일반 OpenAI 인증을 사용하는 제공자 또는 모델 `agentRuntime.id: "openclaw"`                          | OpenClaw 모델/제공자 구성          |
| app-server 동작 조정                                | `plugins.entries.codex.config.appServer.*`                                                       | Codex Plugin 구성                  |
| 네이티브 Codex Plugin 앱 활성화                     | `plugins.entries.codex.config.codexPlugins.*`                                                    | Codex Plugin 구성                  |
| Codex Computer Use 활성화                           | `plugins.entries.codex.config.computerUse.*`                                                     | Codex Plugin 구성                  |

구독 우선/API 키 백업 순서에는 `auth.order.openai`를 사용하십시오.
기존 레거시 Codex 인증 프로필 ID와 레거시 Codex 인증 순서는
doctor 전용 레거시 상태입니다. 새 레거시 Codex GPT 참조를 작성하지 마십시오.

```json5
{
  auth: {
    order: {
      openai: ["openai:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

Codex 호환 유효 경로에서는 위의 두 프로필이 모두
동일한 Codex 실행의 후보로 유지됩니다. 프로필 순서는 런타임이 아니라 자격 증명을 선택합니다.
인증 순서를 변경해도 사용자 지정, Completions, HTTP 또는
요청이 재정의된 경로가 Codex와 호환되지는 않습니다.

### Compaction

Codex 기반 에이전트에 `compaction.model` 또는 `compaction.provider`을 설정하지 마십시오.
Codex는 네이티브 app-server 스레드 상태를 통해 Compaction을 수행하므로
OpenClaw는 런타임에서 해당 로컬 요약기 재정의를 무시하며,
에이전트가 Codex를 사용하는 경우 `openclaw doctor --fix`이 이를 제거합니다.

Lossless는 Codex 턴 주변의 조립, 수집 및
유지 관리를 위한 컨텍스트 엔진으로 계속 지원되며,
`agents.defaults.compaction.provider`이 아니라
`plugins.slots.contextEngine: "lossless-claw"` 및
`plugins.entries.lossless-claw.config.summaryModel`을 통해 구성합니다.
Codex가 활성 런타임인 경우 `openclaw doctor --fix`은
이전 `compaction.provider: "lossless-claw"` 형식을 Lossless
컨텍스트 엔진 슬롯으로 마이그레이션하지만, Compaction은 여전히 네이티브 Codex가
담당합니다. 네이티브 app-server 하네스는 프롬프트 전 조립이 필요한
컨텍스트 엔진을 지원하지만, `codex-cli`을 포함한 일반 CLI 백엔드는
해당 호스트 기능을 제공하지 않습니다.

Codex 기반 에이전트에서 `/compact`는 바인딩된 스레드에 대해 네이티브 Codex app-server
Compaction을 시작합니다. OpenClaw는 완료를 기다리거나,
OpenClaw 시간 제한을 적용하거나, 공유 app-server를 다시 시작하거나,
컨텍스트 엔진 또는 공개 OpenAI 요약기로 폴백하지 않습니다. 네이티브 Codex 스레드
바인딩이 없거나 오래된 경우 이 명령은 Compaction 백엔드를 자동으로
전환하는 대신 실패로 종료됩니다.

이 페이지의 나머지 부분에서는 배포 형식, 실패 시 종료되는 라우팅, 가디언
승인 정책, 네이티브 Codex Plugin 및 Computer Use를 다룹니다. 전체 옵션
목록, 기본값, 열거형, 검색, 환경 격리, 시간 제한 및
app-server 전송 필드는
[Codex 하네스 참조](/ko/plugins/codex-harness-reference)를 참조하십시오.

## Codex 런타임 확인

Codex를 사용할 것으로 예상되는 채팅에서 `/status`을 사용하십시오. Codex 기반 OpenAI
에이전트 턴에는 다음이 표시됩니다.

```text
Runtime: OpenAI Codex
```

그런 다음 Codex app-server 상태를 확인하십시오.

```text
/codex status
/codex models
```

`/codex status`은 app-server 연결, 계정, 사용률 제한, MCP
서버 및 Skills를 보고합니다. `/codex models`은 하네스와 계정에 대한 실시간 Codex app-server 카탈로그를
나열합니다. `/status`이 예상과 다르다면
[문제 해결](#troubleshooting)을 참조하십시오.

## 라우팅 및 모델 선택

제공자 참조와 런타임 정책을 분리하여 유지하십시오.

- 표준 OpenAI 모델을 선택하려면 `openai/gpt-*`을 사용하십시오. 접두사만으로는
  Codex가 선택되지 않습니다.
- 런타임이 설정되지 않았거나 `auto`인 경우, 작성된 요청 재정의가 없는 정확한 공식 HTTPS Platform Responses
  또는 ChatGPT Responses 경로에서만 Codex를 암시적으로 선택할 수 있습니다.
- 구성에서 레거시 Codex GPT 참조를 사용하지 마십시오. `openclaw doctor --fix`을 실행하여
  레거시 참조와 오래된 세션 경로 고정을 복구하십시오.
- `agentRuntime.id: "codex"`은 호환되는 경로에서 Codex를 장애 시 폐쇄 요구 사항으로
  설정합니다. 호환되지 않는 유효 경로를 호환되도록 만들지는 않습니다.
- `agentRuntime.id: "openclaw"`은 의도적으로 사용하는 경우 제공자 또는 모델이 내장
  OpenClaw 런타임을 사용하도록 설정합니다.
- `/codex ...`은 채팅에서 네이티브 Codex app-server 대화를 제어합니다.
- ACP/acpx는 별도의 외부 하네스 경로입니다. 사용자가
  ACP/acpx 또는 외부 하네스 어댑터를 요청하는 경우에만 사용하십시오.

| 사용자 의도                                                | 사용                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 현재 채팅 연결                                    | `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`                    |
| 기존 Codex 스레드 재개                            | `/codex resume <thread-id>`                                                                           |
| Codex 스레드 나열 또는 필터링                               | `/codex threads [filter]`                                                                             |
| 네이티브 Codex Plugin 나열                                  | `/codex plugins list`                                                                                 |
| 구성된 네이티브 Codex Plugin 활성화 또는 비활성화         | `/codex plugins enable <name>`, `/codex plugins disable <name>`                                       |
| 저장된 Codex CLI 세션을 페어링된 Node 턴으로 재개    | `/codex sessions --host <node> [filter]`, 그런 다음 `/codex resume <session-id> --host <node> --bind here` |
| 여러 컴퓨터의 보관되지 않은 Codex 세션 보기          | Codex 감독을 활성화하고 **Codex 세션** 열기                                                  |
| 연결된 스레드의 모델, 고속 모드 또는 권한 변경 | `/codex model <model>`, `/codex fast [on\|off\|status]`, `/codex permissions [default\|yolo\|status]` |
| 활성 턴 중지 또는 조정                              | `/codex stop`, `/codex steer <text>`                                                                  |
| 현재 연결 해제                                 | `/codex detach` (별칭 `/codex unbind`)                                                               |
| Codex 피드백만 전송                                   | `/codex diagnostics [note]`                                                                           |
| ACP/acpx 작업 시작                                     | `/codex`이 아닌 ACP/acpx 세션 명령                                                               |

| 사용 사례                                        | 구성                                                                                                   | 확인                                  | 참고                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| 네이티브 Codex 런타임을 사용하는 적격 OpenAI 경로 | 작성된 요청 재정의가 없는 정확한 공식 HTTPS Responses/ChatGPT 경로와 활성화된 `codex` Plugin | `/status`에 `Runtime: OpenAI Codex` 표시 | 런타임이 설정되지 않았거나 `auto`일 때의 암시적 경로 |
| Codex를 사용할 수 없으면 장애 시 폐쇄             | 제공자 또는 모델 `agentRuntime.id: "codex"`                                                                | 내장 런타임으로 대체하는 대신 턴 실패 | Codex 전용 배포에 사용             |
| OpenClaw를 통한 직접 OpenAI API 키 트래픽  | 제공자 또는 모델 `agentRuntime.id: "openclaw"` 및 일반 OpenAI 인증                                      | `/status`에 OpenClaw 런타임 표시        | OpenClaw 사용이 의도된 경우에만 사용      |
| 레거시 구성                                   | 레거시 Codex GPT 참조                                                                                       | `openclaw doctor --fix`이 이를 다시 작성     | 이 방식으로 새 구성을 작성하지 마십시오           |
| ACP/acpx Codex 어댑터                          | ACP `sessions_spawn({ runtime: "acp" })`                                                                    | ACP 작업/세션 상태                 | 네이티브 Codex 하네스와 별개         |

`agents.defaults.imageModel`에도 동일한 접두사 구분이 적용됩니다. 일반 OpenAI 경로에는
`openai/gpt-*`을 사용하고, 이미지 이해가 제한된 Codex app-server 턴을 통해
실행되어야 하는 경우에만 `codex/gpt-*`을 사용하십시오. Doctor는 레거시
Codex GPT 참조를 `openai/gpt-*`으로 다시 작성합니다.

## 배포 패턴

### 기본 Codex 배포

유효한 공식 HTTPS 경로에서 Codex를 암시적으로 선택할 수 있는 OpenAI 모델에
빠른 시작 구성을 사용하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

### 혼합 제공자 배포

Claude를 기본 에이전트로 유지하고 이름이 지정된 Codex 에이전트를 추가하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.6-sol",
      },
    ],
  },
}
```

`main` 에이전트는 일반 제공자 경로를 사용합니다. `codex` 에이전트의
유효 OpenAI 경로가 계속 호환되면 Codex app-server를 사용합니다. 이를 장애 시 폐쇄
요구 사항으로 지정해야 한다면 명시적인 모델 범위 `agentRuntime.id: "codex"`을
추가하십시오.

### 장애 시 폐쇄 Codex 배포

적격한 정확한 공식 HTTPS OpenAI 경로는 번들 Plugin을 사용할 수 있을 때
Codex로 해석될 수 있습니다. 명시된 장애 시 폐쇄 규칙을 적용하려면 명시적인 런타임
정책을 추가하십시오.

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.6-sol",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex가 강제된 경우 유효 경로가 Codex 호환으로 선언되지 않았거나,
Plugin이 비활성화되었거나, app-server가 너무 오래되었거나,
app-server를 시작할 수 없으면 OpenClaw가 조기에 실패합니다.

## App-server 정책

기본적으로 Plugin은 OpenClaw가 관리하는 Codex 바이너리를 stdio 전송 방식으로
로컬에서 시작합니다. 의도적으로 다른 실행 파일을 실행할 때만
`appServer.command`을 설정하십시오. app-server가 이미 다른 곳에서 실행 중인
경우에만 WebSocket 전송을 사용하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

로컬 stdio app-server 세션은 기본적으로 신뢰할 수 있는 로컬 운영자
상태인 `approvalPolicy: "never"`, `approvalsReviewer: "user"` 및
`sandbox: "danger-full-access"`을 사용합니다. 로컬 Codex 요구 사항이 이 암시적
YOLO 상태를 허용하지 않으면 OpenClaw는 대신 허용된 보호자 권한을
선택합니다. 세션에 OpenClaw 샌드박스가 활성화된 경우 OpenClaw는
Codex 호스트 측 샌드박스에 의존하는 대신 해당 턴에서 Codex 네이티브 Code Mode,
사용자 MCP 서버 및 앱 기반 Plugin 실행을 비활성화합니다.
일반 exec/process 도구를 사용할 수 있는 경우 셸 액세스에는
`sandbox_exec` 및 `sandbox_process`과 같은 OpenClaw 샌드박스 기반 동적 도구가
대신 사용됩니다.

샌드박스 이탈이나 추가 권한보다 Codex 네이티브 자동 검토를 우선하려면
정규화된 OpenClaw exec 모드를 사용하십시오.

```json5
{
  tools: {
    exec: {
      mode: "auto",
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex app-server 세션에서 `tools.exec.mode: "auto"`은 Codex
Guardian 검토 승인에 매핑됩니다. 로컬 요구 사항에서 해당 값을 허용하는 경우
일반적으로 `approvalPolicy: "on-request"`, `approvalsReviewer: "auto_review"` 및
`sandbox: "workspace-write"`입니다. `tools.exec.mode: "auto"`에서
OpenClaw는 레거시 비안전 Codex `approvalPolicy: "never"` 또는
`sandbox: "danger-full-access"` 재정의를 유지하지 않습니다. 의도적으로 승인이 없는
Codex 상태를 사용하려면 `tools.exec.mode: "full"`을 사용하십시오. 레거시
`plugins.entries.codex.config.appServer.mode: "guardian"` 프리셋도 계속
작동하지만, 정규화된 OpenClaw 표면은 `tools.exec.mode: "auto"`입니다.

호스트 exec 승인 및 ACPX 권한과의 모드 수준 비교는
[권한 모드](/ko/tools/permission-modes)를 참조하십시오. 모든 app-server 필드,
인증 순서, 환경 격리 및 시간 제한 동작은
[Codex 하네스 참조](/ko/plugins/codex-harness-reference)를 참조하십시오.

## 명령 및 진단

`codex` Plugin은 OpenClaw 텍스트 명령을 지원하는 모든 채널에
`/codex`을 슬래시 명령으로 등록합니다.

네이티브 실행 및 제어에는 소유자 또는 `operator.admin`
Gateway 클라이언트가 필요합니다. 여기에는 스레드 연결 또는 재개, 턴 전송 또는 중지,
모델·고속 모드·권한 상태 변경, Compaction 또는 검토, 연결 해제가 포함됩니다.
그 외 권한이 있는 발신자는 상태, 도움말, 계정, 모델, 스레드, MCP 서버, Skill 및
연결 검사 명령을 읽기 전용으로 사용할 수 있습니다.

일반적인 형식은 다음과 같습니다.

- `/codex status`은 app-server 연결, 모델, 계정, 사용률
  제한, MCP 서버 및 Skills를 확인합니다.
- `/codex models`은 실시간 Codex app-server 모델을 나열합니다.
- `/codex threads [filter]`은 최근 Codex app-server 스레드를 나열합니다.
- `/codex resume <thread-id>`은 현재 OpenClaw 세션을
  기존 Codex 스레드에 연결합니다.
- `/codex bind [thread-id] [--cwd <path>] [--model <model>] [--provider <provider>]`은
  현재 채팅을 연결합니다.
- `/codex detach` 또는 `/codex unbind`은 현재 연결을 해제합니다.
- `/codex binding`은 현재 연결을 설명합니다.
- `/codex stop`은 활성 턴을 중지하고, `/codex steer <text>`은 이를 조정합니다.
- `/codex model <model>`, `/codex fast [on|off|status]` 및
  `/codex permissions [default|yolo|status]`은 대화별 상태를 변경합니다.
- `/codex compact`은 Codex app-server에 연결된 스레드를 Compaction하도록 요청합니다.
- `/codex review`은 연결된 스레드의 Codex 네이티브 검토를 시작합니다.
- `/codex diagnostics [note]`은 연결된 스레드에 대한 Codex 피드백을
  보내기 전에 확인을 요청합니다.
- `/codex account`은 계정 및 사용률 제한 상태를 표시합니다.
- `/codex mcp`은 Codex app-server MCP 서버 상태를 나열합니다.
- `/codex skills`은 Codex app-server Skills를 나열합니다.
- `/codex plugins list`, `/codex plugins enable <name>` 및
  `/codex plugins disable <name>`은 구성된 네이티브 Codex Plugin을 관리합니다.
- `/codex computer-use [status|install]`은 Codex Computer Use를 관리합니다.
- `/codex help`은 전체 명령 트리를 나열합니다.

대부분의 지원 보고서는 버그가 발생한 대화에서 `/diagnostics [note]`로 시작하십시오. 이 명령은 하나의 Gateway 진단 보고서를 생성하며, Codex 하네스 세션의 경우 관련 Codex 피드백 번들을 전송할 수 있도록 승인을 요청합니다. 개인정보 보호 모델과 그룹 채팅 동작은
[진단 내보내기](/ko/gateway/diagnostics)를 참조하십시오. 전체 Gateway 진단 번들 없이 현재 연결된 스레드의 Codex 피드백만 업로드하려는 경우에만 `/codex diagnostics [note]`를 사용하십시오.

### 로컬에서 Codex 스레드 검사

문제가 있는 Codex 실행을 검사하는 가장 빠른 방법은 네이티브 Codex 스레드를 직접 여는 것입니다.

```bash
codex resume <thread-id>
```

완료된 `/diagnostics` 응답, `/codex binding` 또는 `/codex threads [filter]`에서 스레드 ID를 가져오십시오.

업로드 방식과 런타임 수준의 진단 경계는
[Codex 하네스 런타임](/ko/plugins/codex-harness-runtime#codex-feedback-upload)을 참조하십시오.

### 인증 순서

기본 에이전트별 홈에서는 다음 순서로 인증을 선택합니다.

1. 에이전트에 대해 순서가 지정된 OpenAI 인증 프로필이며, 가급적
   `auth.order.openai` 아래에 있어야 합니다. 이전 레거시 Codex 인증 프로필 ID와 레거시 Codex 인증 순서를 마이그레이션하려면 `openclaw doctor --fix`을 실행하십시오.
2. 해당 에이전트의 Codex 홈에 있는 앱 서버의 기존 계정입니다.
3. 로컬 stdio 앱 서버 실행에만 해당하며, 앱 서버 계정이 없고 OpenAI 인증이 여전히 필요한 경우 `CODEX_API_KEY`, 그다음 `OPENAI_API_KEY`를 사용합니다.

OpenClaw가 ChatGPT 구독 방식의 Codex 인증 프로필을 감지하면 생성된 Codex 자식 프로세스에서 `CODEX_API_KEY` 및 `OPENAI_API_KEY`을 제거합니다. 이렇게 하면 Gateway 수준 API 키를 임베딩이나 직접 OpenAI 모델에 계속 사용할 수 있으면서도 네이티브 Codex 앱 서버 턴의 요금이 실수로 API를 통해 청구되는 일을 방지할 수 있습니다. 명시적 Codex API 키 프로필과 로컬 stdio 환경 키 폴백은 상속된 자식 프로세스 환경 대신 앱 서버 로그인을 사용합니다. WebSocket 앱 서버 연결에는 Gateway 환경 API 키 폴백이 제공되지 않습니다. 명시적 인증 프로필이나 원격 앱 서버 자체 계정을 사용하십시오.

구독 프로필이 Codex 사용량 한도에 도달하면 OpenClaw는 Codex가 재설정 시간을 보고한 경우 이를 기록하고 동일한 Codex 실행에 대해 순서상 다음 인증 프로필을 시도합니다. 재설정 시간이 지나면 선택된 `openai/gpt-*` 모델이나 Codex 런타임을 변경하지 않아도 구독 프로필을 다시 사용할 수 있습니다.

네이티브 Codex Plugin이 구성된 경우 OpenClaw는 Plugin 소유 앱을 Codex 스레드에 노출하기 전에 연결된 앱 서버를 통해 해당 Plugin을 설치하거나 새로 고칩니다. `app/list`은 앱 ID, 접근성 및 메타데이터의 기준 정보로 유지되지만, 스레드별 활성화 결정은 OpenClaw가 담당합니다. 정책상 목록에 있는 접근 가능한 앱이 허용되면 `app/list`에서 현재 해당 앱이 비활성화된 것으로 보고하더라도 OpenClaw는 `thread/start.config.apps[appId].enabled = true`을 전송합니다. 이 경로는 알 수 없는 ID에 대한 앱 설치를 임의로 생성하지 않습니다. OpenClaw는 `plugin/install`이 있는 마켓플레이스 Plugin만 활성화한 다음 인벤토리를 새로 고칩니다.

### 환경 격리

로컬 stdio 앱 서버 실행의 경우 OpenClaw는 `CODEX_HOME`을 에이전트별 디렉터리로 설정하므로 Codex 구성, 인증/계정 파일, Plugin 캐시/데이터 및 네이티브 스레드 상태는 기본적으로 운영자의 개인 `~/.codex`을 읽거나 쓰지 않습니다. OpenClaw는 일반 프로세스 `HOME`을 유지합니다. Codex 실행 하위 프로세스는 여전히 사용자 홈의 구성과 토큰을 찾을 수 있으며, Codex는 공유된 `$HOME/.agents/skills` 및 `$HOME/.agents/plugins/marketplace.json` 항목을 검색할 수 있습니다. `appServer.homeScope: "user"`을 사용하면 OpenClaw는 대신 네이티브 사용자 Codex 홈과 그 기존 계정을 사용하며 OpenClaw 인증 프로필을 삽입하지 않습니다.

배포에 추가적인 환경 격리가 필요한 경우 해당 변수를 `appServer.clearEnv`에 추가하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv`은 생성된 Codex 앱 서버 자식 프로세스에만 영향을 줍니다. OpenClaw는 로컬 실행 정규화 중 이 목록에서 `CODEX_HOME` 및 `HOME`을 제거합니다. `CODEX_HOME`은 선택한 에이전트 또는 사용자 범위를 계속 가리키며, `HOME`은 하위 프로세스가 일반적인 사용자 홈 상태를 사용할 수 있도록 계속 상속됩니다.

### 동적 도구 및 웹 검색

Codex 동적 도구의 기본값은 `searchable` 로딩입니다. OpenClaw는 일반적으로 Codex 네이티브 작업 공간 작업과 중복되는 동적 도구를 노출하지 않습니다.
`read`, `write`, `edit`, `apply_patch`, `exec`, `process`, `update_plan`, `tool_call`, `tool_describe`, `tool_search`, `tool_search_code`이 이에 해당합니다. 메시징, 미디어, cron, 브라우저, 노드, Gateway 및 `heartbeat_respond`과 같은 나머지 OpenClaw 통합 도구 대부분은 `openclaw` 네임스페이스 아래의 Codex 도구 검색을 통해 사용할 수 있으므로 초기 모델 컨텍스트가 더 작게 유지됩니다. 제한된 턴의 셸 폴백은 유한 허용 목록이 네이티브 Code Mode를 비활성화하는 경우 `exec` 및 `process`에 대한 예외입니다. 런타임 허용 목록과 `codexDynamicToolsExclude`은 계속 적용됩니다.

OpenClaw `computer` 도구를 포함하여 `catalogMode: "direct-only"`으로 표시된 도구는 대신 `openclaw_direct` 네임스페이스를 사용합니다. Codex는 해당 네임스페이스를 `DirectModelOnly`으로 취급하므로 이러한 도구는 중첩된 Code Mode `tools.*` 호출을 거치지 않고 일반 스레드와 Code Mode 전용 스레드에서 모델에 직접 표시됩니다.

검색이 활성화되어 있고 관리형 공급자가 선택되지 않은 경우 웹 검색은 기본적으로 Codex의 호스팅 `web_search` 도구를 사용합니다. 네이티브 호스팅 검색과 OpenClaw의 관리형 `web_search` 동적 도구는 상호 배타적이므로 관리형 검색이 네이티브 도메인 제한을 우회할 수 없습니다. 호스팅 검색을 사용할 수 없거나 명시적으로 비활성화했거나 선택한 관리형 공급자로 대체한 경우 OpenClaw는 관리형 도구를 사용합니다. 프로덕션 앱 서버 트래픽이 사용자 정의 `web` 네임스페이스를 거부하므로 OpenClaw는 Codex의 독립형 `web.run` 확장을 비활성화된 상태로 유지합니다. `tools.web.search.enabled: false`은 두 경로를 모두 비활성화하며, 도구가 비활성화된 LLM 전용 실행도 마찬가지입니다. Codex는 `"cached"`을 기본 설정으로 취급하고 제한 없는 앱 서버 턴에서 실시간 외부 접근으로 해석합니다. 네이티브 `allowedDomains`이 설정된 경우 허용 목록을 우회할 수 없도록 자동 관리형 폴백은 실패 시 닫힙니다. 지속되는 유효 검색 정책이 변경되면 다음 턴 전에 연결된 Codex 스레드를 교체합니다. 일시적인 턴별 제한은 임시 제한 스레드를 사용하고 이후 재개를 위해 기존 연결을 유지합니다.

`sessions_yield` 및 메시지 도구 전용 소스 응답은 턴 제어 계약이므로 직접 처리되는 상태로 유지됩니다. `sessions_spawn`은 검색 가능한 상태로 유지되므로 Codex의 네이티브 `spawn_agent`이 기본 Codex 하위 에이전트 표면으로 유지되며, 명시적인 OpenClaw 또는 ACP 위임도 `openclaw` 동적 도구 네임스페이스를 통해 계속 사용할 수 있습니다. Heartbeat 협업 지침은 도구가 아직 로드되지 않은 경우 Heartbeat 턴을 종료하기 전에 `heartbeat_respond`을 검색하도록 Codex에 지시합니다.

지연된 동적 도구를 검색할 수 없는 사용자 정의 Codex 앱 서버에 연결하거나 전체 도구 페이로드를 디버깅하는 경우에만 `codexDynamicToolsLoading: "direct"`을 설정하십시오.

### 구성 필드

지원되는 최상위 Codex Plugin 필드:

| 필드                       | 기본값         | 의미                                                                                     |
| -------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"` | OpenClaw 동적 도구를 초기 Codex 도구 컨텍스트에 직접 넣으려면 `"direct"`을 사용합니다. |
| `codexDynamicToolsExclude` | `[]`           | Codex 앱 서버 턴에서 생략할 추가 OpenClaw 동적 도구 이름입니다.                           |
| `codexPlugins`             | 비활성화       | 마이그레이션된 소스 설치형 선별 Plugin을 위한 네이티브 Codex Plugin/앱 지원입니다.        |
| `sessionCatalog`           | 활성화         | 이 Gateway 및 적격 페어링 노드의 네이티브 Codex 세션을 위한 사이드바 검색입니다.         |
| `supervision`              | 비활성화       | 에이전트 대상 네이티브 세션 기록 및 쓰기 제어 정책입니다.                                |

지원되는 `appServer` 필드:

| 필드                                         | 기본값                                                | 의미                                                                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                                   | `"stdio"`                                              | `"stdio"`은 Codex를 생성하고, 명시적 `"unix"`은 로컬 제어 소켓에 연결하며, `"websocket"`은 `url`에 연결합니다.                                                                                                                                                                                                                                                                                |
| `homeScope`                                   | `"agent"`                                              | `"agent"`은 일반 하네스 상태를 OpenClaw 에이전트별로 격리합니다. `"user"`은 네이티브 `$CODEX_HOME` 또는 `~/.codex`을 공유하고 네이티브 인증을 사용하며 소유자 전용 스레드 관리를 활성화하는 명시적 옵트인입니다. 사용자 범위는 로컬 stdio 또는 Unix 전송을 지원합니다. 별도의 감독 연결에서는 설정되지 않은 값이 stdio 또는 Unix의 경우 `"user"`로, WebSocket의 경우 `"agent"`으로 해석됩니다.     |
| `command`                                     | 관리형 Codex 바이너리                                   | stdio 전송용 실행 파일입니다. 관리형 바이너리를 사용하려면 설정하지 않은 상태로 두고, 명시적으로 재정의할 때만 설정하십시오.                                                                                                                                                                                                                                                                                    |
| `args`                                        | `["app-server", "--listen", "stdio://"]`               | stdio 전송용 인수입니다.                                                                                                                                                                                                                                                                                                                                                                  |
| `url`                                         | 설정되지 않음                                                  | WebSocket App Server URL 또는 `unix://` URL입니다. 명시적으로 빈 Unix 경로를 지정하면 표준 사용자 홈 제어 소켓이 선택됩니다.                                                                                                                                                                                                                                                                          |
| `authToken`                                   | 설정되지 않음                                                  | WebSocket 전송용 Bearer 토큰입니다. 리터럴 문자열이나 `${CODEX_APP_SERVER_TOKEN}` 같은 SecretInput을 허용합니다.                                                                                                                                                                                                                                                                              |
| `headers`                                     | `{}`                                                   | 추가 WebSocket 헤더입니다. 헤더 값에는 리터럴 문자열이나 `x-codex-client-session-token: "${CODEX_CLIENT_SESSION_TOKEN}"` 같은 SecretInput 값을 사용할 수 있습니다.                                                                                                                                                                                                                               |
| `clearEnv`                                    | `[]`                                                   | OpenClaw가 상속 환경을 구성한 후 생성된 stdio app-server 프로세스에서 제거할 추가 환경 변수 이름입니다. OpenClaw는 로컬 실행을 위해 선택된 `CODEX_HOME`과 상속된 `HOME`을 유지합니다.                                                                                                                                                                           |
| `codeModeOnly`                                | `false`                                                | Codex의 코드 모드 전용 도구 표면을 사용하도록 옵트인합니다. 일반 OpenClaw 동적 도구는 중첩된 `tools.*` 호출을 통해 계속 사용할 수 있으며, `openclaw_direct` 도구는 모델에 직접 표시된 상태로 유지됩니다.                                                                                                                                                                                                             |
| `remoteWorkspaceRoot`                         | 설정되지 않음                                                  | 원격 Codex app-server 작업 공간 루트입니다. 설정하면 OpenClaw는 해석된 OpenClaw 작업 공간에서 로컬 작업 공간 루트를 추론하고, 이 원격 루트 아래에 현재 cwd 접미사를 보존하며, 최종 app-server cwd만 Codex로 전송합니다. cwd가 해석된 OpenClaw 작업 공간 루트 외부에 있으면 OpenClaw는 Gateway 로컬 경로를 원격 app-server로 보내는 대신 실패 시 차단합니다. |
| `requestTimeoutMs`                            | `60000`                                                | app-server 제어 영역 호출의 시간 제한입니다.                                                                                                                                                                                                                                                                                                                                                     |
| `turnCompletionIdleTimeoutMs`                 | `60000`                                                | OpenClaw가 `turn/completed`을 기다리는 동안 Codex가 턴을 수락한 후 또는 턴 범위 app-server 요청 후의 무응답 대기 구간입니다.                                                                                                                                                                                                                                                                    |
| `postToolRawAssistantCompletionIdleTimeoutMs` | `300000`                                               | OpenClaw가 `turn/completed`을 기다리는 동안 도구 인계, 네이티브 도구 완료, 도구 실행 후 원시 어시스턴트 진행, 원시 추론 완료 또는 추론 진행 후 사용되는 완료 유휴 및 진행 가드입니다. 도구 실행 후 종합 과정이 최종 어시스턴트 릴리스 예산보다 합법적으로 더 오래 조용할 수 있는 신뢰할 수 있거나 무거운 워크로드에 사용하십시오.                                |
| `mode`                                        | 로컬 Codex 요구 사항이 YOLO를 허용하지 않는 경우를 제외하고 `"yolo"` | YOLO 또는 가디언 검토 실행을 위한 프리셋입니다. `danger-full-access`, `never` 승인 또는 `user` 검토자를 생략하는 로컬 stdio 요구 사항에서는 암시적 기본값이 가디언이 됩니다.                                                                                                                                                                                                           |
| `approvalPolicy`                              | `"never"` 또는 허용된 가디언 승인 정책       | 스레드 시작/재개/턴에 전송되는 네이티브 Codex 승인 정책입니다. 가디언 기본값은 허용되는 경우 `"on-request"`을 우선합니다.                                                                                                                                                                                                                                                                            |
| `sandbox`                                     | `"danger-full-access"` 또는 허용된 가디언 샌드박스  | 스레드 시작/재개에 전송되는 네이티브 Codex 샌드박스 모드입니다. 가디언 기본값은 허용되는 경우 `"workspace-write"`을 우선하며, 그렇지 않으면 `"read-only"`을 사용합니다. OpenClaw 샌드박스가 활성화된 경우 `danger-full-access` 턴은 OpenClaw 샌드박스의 송신 설정에서 파생된 네트워크 액세스와 함께 Codex `workspace-write`을 사용합니다.                                                                                     |
| `approvalsReviewer`                           | `"user"` 또는 허용된 가디언 검토자               | 허용되는 경우 Codex가 네이티브 승인 프롬프트를 검토하도록 하려면 `"auto_review"`을 사용하고, 그렇지 않으면 `guardian_subagent` 또는 `user`을 사용합니다. `guardian_subagent`은 레거시 별칭으로 유지됩니다.                                                                                                                                                                                                                              |
| `serviceTier`                                 | 설정되지 않음                                                  | 선택적 Codex app-server 서비스 계층입니다. `"priority"`은 고속 모드 라우팅을 활성화하고, `"flex"`은 flex 처리를 요청하며, `null`은 재정의를 지우고, 레거시 `"fast"`은 `"priority"`으로 허용됩니다.                                                                                                                                                                                                 |
| `networkProxy`                                | 비활성화됨                                               | app-server 명령에 Codex 권한 프로필 네트워킹을 사용하도록 옵트인합니다. OpenClaw는 선택한 `permissions.<profile>.network` 구성을 정의하고 `sandbox`을 전송하는 대신 `default_permissions`으로 이를 선택합니다.                                                                                                                                                                             |
| `experimental.sandboxExecServer`              | `false`                                                | 네이티브 Codex 실행이 활성 OpenClaw 샌드박스 내부에서 실행될 수 있도록 지원되는 Codex app-server에 OpenClaw 샌드박스 기반 Codex 환경을 등록하는 미리 보기 옵트인입니다.                                                                                                                                                                                                            |

`appServer.networkProxy`은 Codex 샌드박스 계약을 변경하므로 명시적으로 설정해야
합니다. 활성화하면 생성된 권한 프로필이 Codex 관리형 네트워킹을 시작할 수 있도록 OpenClaw는
Codex 스레드 구성에 `features.network_proxy.enabled`과
`default_permissions`도 설정합니다. 기본적으로 OpenClaw는
프로필 본문에서 충돌 방지형 `openclaw-network-<fingerprint>` 프로필
이름을 생성합니다. 안정적인 로컬 이름이 필요한 경우에만 `profileName`을
사용하십시오.

```json5
{
  plugins: {
    entries: {
      codex: {
        config: {
          appServer: {
            sandbox: "workspace-write",
            networkProxy: {
              enabled: true,
              domains: {
                "api.openai.com": "allow",
                "blocked.example.com": "deny",
              },
              unixSockets: {
                "/tmp/proxy.sock": "allow",
                "/tmp/blocked.sock": "none",
              },
              allowUpstreamProxy: true,
              proxyUrl: "http://127.0.0.1:3128",
            },
          },
        },
      },
    },
  },
}
```

일반적인 앱 서버 런타임이 `danger-full-access`인 경우,
`networkProxy`을 활성화하면 생성된 권한 프로필에 워크스페이스 방식의
파일 시스템 액세스를 사용합니다. Codex 관리형 네트워크 적용은 샌드박스화된
네트워킹이므로 전체 액세스 프로필은 아웃바운드 트래픽을 보호하지 못합니다.
도메인 항목에는 `allow` 또는 `deny`을 사용하며, Unix 소켓 항목에는 Codex의
`allow` 또는 `none` 값을 사용합니다.

### 동적 도구 호출 시간 제한

OpenClaw 소유의 동적 도구 호출은
`appServer.requestTimeoutMs`과 별도로 제한됩니다. Codex `item/tool/call` 요청에는 기본적으로 90초의
OpenClaw 감시 타이머가 적용됩니다. 호출별 `timeoutMs`
인수가 양수이면 해당 도구의 시간 예산을 늘리거나 줄이며, 상한은 600000ms입니다.
`image_generate` 도구는 도구 호출 자체에 시간 제한이 지정되지 않은 경우
`agents.defaults.imageGenerationModel.timeoutMs`을 사용하며, 그렇지 않은 경우 이미지 생성 기본값인 120초를
사용합니다. 미디어 이해 `image` 도구는
`tools.media.image.timeoutSeconds` 또는 미디어 기본값인 60초를 사용합니다. 이미지 이해의 경우
이 시간 제한은 요청 자체에 적용되며 앞선 준비 작업으로 인해 줄어들지 않습니다.
시간이 초과되면 OpenClaw는 지원되는 경우 도구 신호를 중단하고 실패한 동적 도구
응답을 Codex에 반환하여, 세션이 `processing` 상태로 남지 않고 턴을 계속할 수
있게 합니다. 이 감시 타이머는 외부 동적 `item/tool/call` 예산이며, 공급자별
요청 시간 제한은 해당 호출 내에서 실행되고 자체 시간 제한 의미 체계를 유지합니다.

Codex가 턴을 수락한 후와 OpenClaw가 턴 범위의 앱 서버 요청에 응답한 후,
하네스는 Codex가 현재 턴을 진행하고 최종적으로 `turn/completed`을 통해
네이티브 턴을 완료하기를 기대합니다. 앱 서버가 `appServer.turnCompletionIdleTimeoutMs` 동안
응답하지 않으면 OpenClaw는 최선의 노력으로 Codex 턴을 중단하고 진단용 시간 초과를
기록한 다음, 후속 채팅 메시지가 오래된 네이티브 턴 뒤에 대기하지 않도록
OpenClaw 세션 레인을 해제합니다. 동일한 턴의 비종료 알림 대부분은 Codex가 해당
턴이 아직 활성 상태임을 입증하므로 이 짧은 감시 타이머를 해제합니다.

도구 인계에는 더 긴 도구 실행 후 유휴 시간 예산을 사용합니다. OpenClaw가
`item/tool/call` 응답을 반환한 후, `commandExecution` 같은 네이티브 도구 항목이
완료된 후, 원시 `custom_tool_call_output` 완료 후, 그리고 도구 실행 후의 원시 어시스턴트 진행,
원시 추론 완료 또는 추론 진행 후에 적용됩니다. 가드는 구성된 경우
`appServer.postToolRawAssistantCompletionIdleTimeoutMs`을 사용하며, 그렇지 않으면 기본값으로 5분을 사용합니다. 동일한
예산은 Codex가 다음 현재 턴 이벤트를 내보내기 전의 조용한 종합 구간에 대한 진행
감시 타이머도 연장합니다. 사용률 제한 업데이트 같은 전역 앱 서버 알림은 턴 유휴
진행 시간을 초기화하지 않습니다. 추론 완료, commentary `agentMessage` 완료,
그리고 도구 실행 전의 원시 추론 또는 어시스턴트 진행 뒤에는 자동 최종 응답이 이어질
수 있으므로, 세션 레인을 즉시 해제하는 대신 진행 후 응답 가드를 사용합니다.

최종/비-commentary 완료 `agentMessage` 항목과 도구 실행 전의 원시 어시스턴트
완료만 어시스턴트 출력 해제를 활성화합니다. 그 뒤 Codex가 `turn/completed` 없이
응답하지 않으면 OpenClaw는 최선의 노력으로 네이티브 턴을 중단하고 세션 레인을
해제합니다. 다른 턴 감시가 이 해제 경쟁에서 이기더라도, 네이티브 요청, 항목 또는
동적 도구 완료가 더 이상 활성 상태가 아니고 어시스턴트 출력 해제가 여전히 가장
최근에 완료된 항목에 속하며 이후에 완료된 항목이 없으면 OpenClaw는 완료된 최종
어시스턴트 항목을 계속 수락합니다. 이를 통해 턴을 재생하지 않고도 완료된 도구 작업
후의 최종 답변을 보존할 수 있습니다. 부분 어시스턴트 델타, 오래된 이전 응답 및
비어 있는 이후 완료는 해당되지 않습니다.

어시스턴트, 도구, 활성 항목 또는 부작용의 증거가 없는 턴 완료 유휴 시간 초과를
포함한 재생 안전 stdio 앱 서버 실패는 새로운 앱 서버 시도에서 한 번 재시도됩니다.
안전하지 않은 시간 초과는 중단된 앱 서버 클라이언트를 폐기하고 OpenClaw 세션 레인을
해제하며, 자동으로 재생하는 대신 오래된 네이티브 스레드 바인딩도 제거합니다.
완료 감시 시간 초과에는 Codex 전용 시간 초과 문구가 표시됩니다. 재생 안전 사례에는
응답이 불완전할 수 있다고 표시하고, 안전하지 않은 사례에는 재시도하기 전에 현재
상태를 확인하라고 안내합니다. 공개 시간 초과 진단에는 마지막 앱 서버 알림 메서드,
원시 어시스턴트 응답 항목 ID/유형/역할, 활성 요청/항목 수, 활성화된 감시 상태 같은
구조적 필드가 포함됩니다. 마지막 알림이 원시 어시스턴트 응답 항목이면 제한된
어시스턴트 텍스트 미리보기도 포함됩니다. 원시 프롬프트나 도구 콘텐츠는 포함되지
않습니다.

### 로컬 테스트 환경 재정의

- `OPENCLAW_CODEX_APP_SERVER_BIN`은
  `appServer.command`이 설정되지 않은 경우 관리형 바이너리를 우회합니다.
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`은 제거되었습니다. 대신
`plugins.entries.codex.config.appServer.mode: "guardian"`을 사용하거나, 일회성 로컬 테스트에는
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian`을 사용하십시오. 반복 가능한 배포에는 구성을 사용하는 것이
좋습니다. Plugin 동작을 나머지 Codex 하네스 설정과 동일하게 검토되는 파일에
유지할 수 있기 때문입니다.

## 네이티브 Codex Plugin

네이티브 Codex Plugin 지원은 OpenClaw 하네스 턴과 동일한 Codex 스레드에서 Codex
앱 서버 자체의 앱 및 Plugin 기능을 사용합니다. OpenClaw는 Codex Plugin을 합성
`codex_plugin_*` OpenClaw 동적 도구로 변환하지 않습니다.

`codexPlugins`은 네이티브 Codex 하네스를 선택하는 세션에만 영향을 줍니다.
내장 하네스 실행, 일반 OpenAI 공급자 실행, ACP 대화 바인딩 또는 다른 하네스에는
영향을 주지 않습니다.

최소 마이그레이션 구성:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: true,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

OpenClaw가 Codex 하네스 세션을 설정하거나 오래된 Codex 스레드 바인딩을 교체할 때
스레드 앱 구성이 계산되며, 매 턴마다 다시 계산되지 않습니다.
`codexPlugins`을 변경한 후에는 `/new`, `/reset`을 사용하거나
Gateway를 다시 시작하여 이후의 Codex 하네스 세션이 업데이트된 앱 집합으로
시작되도록 하십시오.

마이그레이션 적격성, 앱 인벤토리, 파괴적 작업 정책, 정보 요청 및 네이티브 Plugin
진단에 대해서는
[네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)을 참조하십시오.

OpenAI 측 앱 및 Plugin 액세스는 로그인한 Codex 계정에 의해 제어되며, Business 및
Enterprise/Edu 워크스페이스에서는 워크스페이스 앱 제어의 영향도 받습니다.
OpenAI의 계정 및 워크스페이스 제어 개요는
[ChatGPT 요금제에서 Codex 사용하기](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)를
참조하십시오.

## 컴퓨터 사용

컴퓨터 사용에는 별도의 설정 가이드가 있습니다.
[Codex 컴퓨터 사용](/ko/plugins/codex-computer-use).

요약하면 OpenClaw는 데스크톱 제어 앱을 번들로 제공하거나 데스크톱 작업을 직접
실행하지 않습니다. Codex 앱 서버를 준비하고 `computer-use` MCP 서버를 사용할
수 있는지 확인한 다음, Codex 모드 턴 중 네이티브 MCP 도구 호출을 Codex가 담당하도록
합니다.

## 런타임 경계

Codex 하네스는 저수준 내장 에이전트 실행기만 변경합니다.

- OpenClaw 동적 도구가 지원됩니다. Codex가 OpenClaw에 해당 도구의 실행을
  요청하므로 OpenClaw는 실행 경로에 계속 포함됩니다.
- Codex 네이티브 셸, 패치, MCP 및 네이티브 앱 도구는 Codex가 소유합니다.
  OpenClaw는 지원되는 릴레이를 통해 일부 네이티브 이벤트를 관찰하거나 차단할 수
  있지만 네이티브 도구 인수를 다시 작성하지 않습니다.
- Codex가 네이티브 Compaction을 소유합니다. OpenClaw는 채널 기록, 검색,
  `/new`, `/reset`, 그리고 향후 모델 또는 하네스 전환을 위해
  트랜스크립트 미러를 유지하지만, Codex Compaction을 OpenClaw 또는 컨텍스트 엔진
  요약기로 대체하지 않습니다.
- 미디어 생성, 미디어 이해, TTS, 승인 및 메시징 도구 출력은 일치하는
  OpenClaw 공급자/모델 설정을 통해 계속 처리됩니다.
- `tool_result_persist`은 Codex 네이티브 도구 결과 레코드가 아니라 OpenClaw
  소유 트랜스크립트 도구 결과에 적용됩니다.

후크 계층, 지원되는 V1 표면, 네이티브 권한 처리, 대기열 조정, Codex 피드백 업로드
메커니즘 및 Compaction 세부 정보는
[Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)을 참조하십시오.

## 문제 해결

**Codex가 일반 `/model` 공급자로 표시되지 않음:** 새 구성에서는 정상입니다.
`openai/gpt-*` 모델을 선택하고 `plugins.entries.codex.enabled`을 활성화한 다음,
`plugins.allow`에서 `codex`이 제외되어 있는지 확인하십시오.

**OpenClaw가 Codex 대신 내장 하네스를 사용함:** 유효한 경로가 정확히 공식 HTTPS
Platform Responses 또는 ChatGPT Responses 경로인지, 작성된 요청 재정의가 없는지,
Codex Plugin이 설치되고 활성화되어 있는지 확인하십시오. `openai/gpt-*` 접두사만으로는
충분하지 않습니다. 테스트 중 엄격하게 검증하려면 공급자 또는 모델
`agentRuntime.id: "codex"`을 설정하십시오. Codex 강제 사용 시 경로나 하네스가 호환되지 않으면
대체 경로를 사용하는 대신 실패합니다.

**OpenAI Codex 런타임이 API 키 경로로 대체됨:** 모델, 런타임, 선택된 공급자 및 실패를
보여 주는 민감 정보가 제거된 Gateway 발췌문을 수집하십시오. 영향을 받는 공동
작업자에게 OpenClaw 호스트에서 다음 읽기 전용 명령을 실행하도록 요청하십시오.

```bash
(
  pattern='openai/gpt-5\.[45]|openai[-]codex|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|legacy OpenAI Codex prefix|resolveSelectedOpenAIRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

유용한 발췌문에는 일반적으로 `openai/gpt-5.6-sol` 또는 `openai/gpt-5.6-luna`,
`Runtime: OpenAI Codex`, `agentRuntime.id` 또는 `harnessRuntime`,
`candidateProvider: "openai"`, 그리고 `401`, `Incorrect API key` 또는
`No API key` 결과가 포함됩니다. 수정된 실행에서는 일반 OpenAI API 키 실패
대신 OpenAI OAuth 경로가 표시되어야 합니다.

**레거시 Codex 모델 참조 구성이 남아 있음:** `openclaw doctor --fix`을 실행하십시오.
Doctor는 레거시 모델 참조를 `openai/*`으로 다시 작성하고, 오래된 세션 및
전체 에이전트 런타임 고정을 제거하며, 기존 인증 프로필 재정의를 보존합니다.

**앱 서버가 거부됨:** Codex 앱 서버 `0.143.0` 이상을 사용하십시오.
`0.143.0-alpha.2` 또는 `0.143.0+custom` 같은 동일 버전의 시험판이나 빌드 접미사
버전은 OpenClaw가 안정적인 `0.143.0` 프로토콜 최저 버전을 검사하므로
거부됩니다.

**`/codex status`에 연결할 수 없음:** `codex` Plugin이
활성화되어 있는지, 허용 목록이 구성된 경우 `plugins.allow`에 해당 Plugin이
포함되어 있는지, 그리고 사용자 지정 `appServer.command`, `url`, `authToken` 또는
헤더가 유효한지 확인하십시오.

**모델 검색이 느림:** `plugins.entries.codex.config.discovery.timeoutMs` 값을 낮추거나
검색을 비활성화하십시오.
[Codex 하네스 참조](/ko/plugins/codex-harness-reference#model-discovery)를 참조하십시오.

**WebSocket 전송이 즉시 실패함:** `appServer.url`,
`authToken`, 헤더를 확인하고 원격 앱 서버가 동일한 Codex
앱 서버 프로토콜 버전을 사용하는지 확인하십시오.

**네이티브 셸 또는 패치 도구가 `Native hook relay
unavailable` 때문에 차단됨:** Codex 스레드가 OpenClaw에 더 이상 등록되어 있지 않은
네이티브 훅 릴레이 ID를 계속 사용하려고 합니다. 이는 네이티브 Codex 훅
전송 문제이며 ACP 백엔드, 공급자, GitHub 또는 셸 명령
실패가 아닙니다. 영향을 받은 채팅에서 `/new` 또는 `/reset`을 사용하여 새 세션을 시작한
다음, 무해한 명령을 다시 시도하십시오. 한 번은 작동하지만 다음 네이티브 도구
호출이 다시 실패한다면 `/new`은 임시 해결 방법으로만 사용하십시오. Codex 앱 서버 또는
OpenClaw Gateway를 재시작한 후 프롬프트를 새 세션에 복사하여
이전 스레드를 삭제하고 네이티브 훅 등록을
다시 생성하십시오.

**Codex 도구 호출이 수명이 짧은 훅 프로세스를 너무 많이 생성함:** `plugins.entries.codex.config.appServer.loopDetectionPreToolUseRelay: false`을
설정하고 Gateway를 재시작하십시오. 이렇게 하면 OpenClaw 루프 감지와 정책 없음 마커에
사용되는 Codex `PreToolUse` 하위 프로세스만 비활성화됩니다. 필수
`before_tool_call` 및 신뢰할 수 있는 도구 정책 릴레이는 계속 활성화됩니다.

**Codex가 아닌 모델이 기본 제공 하네스를 사용함:** 공급자 또는
모델 런타임 정책이 다른 하네스로 라우팅하지 않는 한 예상되는 동작입니다. 일반적인 비 OpenAI
공급자 참조는 `auto` 모드에서 정상적인 공급자 경로를 계속 사용합니다.

**Computer Use가 설치되어 있지만 도구가 실행되지 않음:**
새 세션에서 `/codex computer-use status`을 확인하십시오. 도구가
`Native hook relay unavailable`을 보고하면 위의 네이티브 훅 릴레이 복구 방법을 사용하십시오.
[Codex Computer Use](/ko/plugins/codex-computer-use#troubleshooting)를 참조하십시오.

## 관련 항목

- [Codex 하네스 참조](/ko/plugins/codex-harness-reference)
- [Codex 하네스 런타임](/ko/plugins/codex-harness-runtime)
- [Codex 감독](/ko/plugins/codex-supervision)
- [네이티브 Codex Plugin](/ko/plugins/codex-native-plugins)
- [Codex Computer Use](/ko/plugins/codex-computer-use)
- [에이전트 런타임](/ko/concepts/agent-runtimes)
- [모델 공급자](/ko/concepts/model-providers)
- [OpenAI 공급자](/ko/providers/openai)
- [OpenAI Codex 도움말](https://help.openai.com/en/collections/14937394-codex)
- [에이전트 하네스 Plugin](/ko/plugins/sdk-agent-harness)
- [Plugin 훅](/ko/plugins/hooks)
- [진단 내보내기](/ko/gateway/diagnostics)
- [상태](/ko/cli/status)
- [테스트](/ko/help/testing-live#live-codex-app-server-harness-smoke)
