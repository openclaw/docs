---
read_when:
    - API 제공업체에 장애가 발생할 때 신뢰할 수 있는 대체 수단이 필요합니다
    - 로컬 AI CLI를 실행 중이며 이를 재사용하려고 합니다
    - CLI 백엔드 도구 액세스를 위한 MCP 루프백 브리지를 이해하려고 합니다
summary: 'CLI 백엔드: 선택적 MCP 도구 브리지를 지원하는 로컬 AI CLI 폴백'
title: CLI 백엔드
x-i18n:
    generated_at: "2026-07-12T15:14:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

API 제공자가 중단되거나, 속도 제한에 걸리거나, 오작동할 때 OpenClaw는 로컬 AI CLI를 텍스트 전용 대체 경로로 실행할 수 있습니다. 의도적으로 보수적으로 설계되었습니다.

- OpenClaw 도구는 직접 주입되지 않지만, `bundleMcp: true`인 백엔드는 루프백 MCP 브리지를 통해 Gateway 도구를 받을 수 있습니다.
- 이를 지원하는 CLI에는 JSONL 스트리밍을 사용합니다.
- 세션을 지원하므로 후속 대화의 일관성이 유지됩니다.
- CLI가 이미지 경로를 허용하면 이미지가 그대로 전달됩니다.

기본 경로가 아니라 "항상 작동하는" 텍스트 응답을 위한 안전망으로 사용하십시오. ACP 세션 제어, 백그라운드 작업, 스레드/대화 바인딩, 영구 외부 코딩 세션을 갖춘 전체 하네스 런타임이 필요하면 대신 [ACP 에이전트](/ko/tools/acp-agents)를 사용하십시오. CLI 백엔드는 ACP가 아닙니다.

<Tip>
  새 백엔드 Plugin을 개발하고 있습니까? [CLI 백엔드 Plugin](/ko/plugins/cli-backend-plugins)을 참조하십시오. 이 페이지에서는 이미 등록된 백엔드를 구성하고 운영하는 방법을 설명합니다.
</Tip>

## 빠른 시작

번들 Anthropic Plugin은 기본 `claude-cli` 백엔드를 등록하므로 Claude Code가 설치되어 있고 로그인되어 있다면 별도 구성 없이 작동합니다.

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

명시적인 에이전트 목록이 구성되지 않은 경우 `main`이 기본 에이전트 ID입니다. 그렇지 않으면 자체 에이전트 ID로 바꾸십시오.

Gateway가 최소한의 `PATH`를 사용하는 launchd/systemd에서 실행된다면 바이너리를 명시적으로 지정하십시오.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Gateway 호스트에서 번들 CLI 백엔드를 기본 메시지 제공자로 사용하는 경우, 구성의 모델 참조 또는 `agents.defaults.cliBackends` 아래에서 해당 백엔드를 참조하면 OpenClaw가 이를 소유한 번들 Plugin을 자동으로 로드합니다.

## 대체 경로로 사용하기

기본 모델이 실패할 때만 실행되도록 CLI 백엔드를 대체 경로 목록에 추가하십시오.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

`agents.defaults.models`를 허용 목록으로 사용하는 경우 CLI 백엔드 모델도 포함하십시오. 기본 제공자가 실패하면(인증, 속도 제한, 시간 초과) OpenClaw가 다음으로 CLI 백엔드를 시도합니다.

## 구성

모든 CLI 백엔드는 제공자 ID(예: `claude-cli`, `my-cli`)를 키로 하여 `agents.defaults.cliBackends` 아래에 위치합니다. 제공자 ID는 모델 참조의 왼쪽 부분인 `<provider>/<model>`이 됩니다.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // 전용 프롬프트 파일 플래그:
          // systemPromptFileArg: "--system-file",
          // 대신 사용하는 Codex 방식의 구성 재정의 플래그:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // 이 백엔드가 Compaction 전에 유효하지 않게 된 세션을
          // 범위가 제한된 OpenClaw 원시 트랜스크립트 기록으로 다시 초기화할 수 있는 경우에만 활성화합니다.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 작동 방식

1. 제공자 접두사(`claude-cli/...`)로 백엔드를 선택합니다.
2. 동일한 OpenClaw 프롬프트와 작업 공간 컨텍스트를 사용하여 시스템 프롬프트를 생성합니다.
3. 기록의 일관성이 유지되도록 세션 ID를 사용하여 CLI를 실행합니다(지원되는 경우). 번들 `claude-cli` 백엔드는 OpenClaw 세션별로 Claude stdio 프로세스를 계속 실행하며 stream-json stdin을 통해 후속 대화를 전송합니다.
4. 출력(JSON 또는 일반 텍스트)을 파싱하고 최종 텍스트를 반환합니다.
5. 후속 대화에서 동일한 CLI 세션을 재사용하도록 백엔드별 세션 ID를 유지합니다.

### Claude CLI 세부 사항

번들 `claude-cli` 백엔드는 Claude Code의 네이티브 스킬 해석기를 우선 사용합니다. 현재 스킬 스냅샷에 구체화된 경로가 있는 선택된 스킬이 하나 이상 있으면 OpenClaw는 `--plugin-dir`을 통해 임시 Claude Code Plugin을 전달하고, 추가되는 시스템 프롬프트에서는 중복된 OpenClaw 스킬 카탈로그를 생략합니다. 구체화된 Plugin 스킬이 없으면 OpenClaw는 대체 경로로 프롬프트 카탈로그를 유지합니다. 스킬 환경 변수/API 키 재정의도 해당 실행의 하위 프로세스 환경에 계속 적용됩니다.

Claude CLI에는 자체 비대화형 권한 모드가 있습니다. OpenClaw는 Claude 전용 구성을 추가하는 대신 이를 기존 실행 정책에 매핑합니다. OpenClaw가 관리하는 Claude 라이브 세션에서는 유효한 실행 정책이 최종 기준입니다. YOLO(`tools.exec.security: "full"` 및 `tools.exec.ask: "off"`)는 `--permission-mode bypassPermissions`로 Claude를 실행하며, 제한적인 정책은 `--permission-mode default`로 실행합니다. 에이전트별 `agents.list[].tools.exec` 설정은 해당 에이전트에 대해 전역 `tools.exec`를 재정의합니다. 원시 백엔드 인수에 여전히 `--permission-mode`를 포함할 수 있지만, 라이브 Claude 실행 시에는 해당 플래그가 유효한 정책과 일치하도록 정규화됩니다.

백엔드는 OpenClaw `/think` 수준을 Claude Code의 네이티브 `--effort` 플래그에도 매핑합니다. `minimal`/`low` -> `low`, `medium` -> `medium`으로 매핑되며, `high`/`xhigh`/`max`는 그대로 전달됩니다. `adaptive`는 구성된 `--effort` 플래그를 제거하고 대체 플래그를 제공하지 않으므로, Claude Code가 자체 환경, 설정 및 모델 기본값을 바탕으로 유효한 노력 수준을 결정합니다. 다른 CLI 백엔드에서 `/think`가 생성된 CLI에 영향을 주려면 해당 백엔드를 소유한 Plugin이 동등한 argv 매퍼를 선언해야 합니다.

OpenClaw에서 `claude-cli`를 사용하려면 먼저 동일한 호스트에서 Claude Code 자체에 로그인해야 합니다.

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 설치에서는 호스트에만 설치하고 로그인해서는 안 되며, 영구 저장되는 컨테이너 홈 내부에도 Claude Code를 설치하고 로그인해야 합니다. [Docker의 Claude CLI 백엔드](/ko/install/docker#claude-cli-backend-in-docker)를 참조하십시오.

`claude` 바이너리가 아직 `PATH`에 없을 때만 `agents.defaults.cliBackends.claude-cli.command`를 설정하십시오.

## 세션

- CLI가 세션을 지원하는 경우 `sessionArg`(예: `--session-id`)를 설정하거나, ID를 여러 플래그에 전달해야 하는 경우 `sessionArgs`(플레이스홀더 `{sessionId}`)를 설정합니다.
- CLI가 서로 다른 플래그를 사용하는 resume 하위 명령을 사용하는 경우 `resumeArgs`(재개 시 `args`를 대체)를 설정하고, JSON이 아닌 재개에는 선택적으로 `resumeOutput`을 설정합니다.
- `sessionMode`:
  - `always`: 항상 세션 ID를 전송합니다(저장된 ID가 없으면 새 UUID).
  - `existing`: 이전에 저장된 세션 ID가 있는 경우에만 전송합니다.
  - `none`: 세션 ID를 절대 전송하지 않습니다.
- `claude-cli`의 기본값은 `liveSession: "claude-stdio"`, `output: "jsonl"`, `input: "stdin"`이므로 전송 필드를 생략한 사용자 지정 구성에서도 활성 상태인 동안 후속 턴이 실행 중인 Claude 프로세스를 재사용합니다. Gateway가 다시 시작되거나 유휴 프로세스가 종료되면 OpenClaw는 저장된 Claude 세션 ID에서 재개합니다. 저장된 세션 ID는 재개 전에 읽을 수 있는 프로젝트 트랜스크립트와 대조하여 검증됩니다. 트랜스크립트가 없으면 `--resume`으로 새 세션을 자동으로 시작하는 대신 바인딩을 해제합니다(`reason=transcript-missing`으로 기록됨).
- Claude 라이브 세션은 제한된 JSONL 출력 보호 장치를 유지합니다. 기본적으로 턴당 8 MiB 및 원시 JSONL 20,000줄입니다. 백엔드별로 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 및 `maxTurnLines`를 사용하여 한도를 늘릴 수 있으며, OpenClaw는 해당 설정을 64 MiB 및 100,000줄로 제한합니다.
- 저장된 CLI 세션의 연속성은 제공자가 소유합니다. 암시적인 일일 세션 재설정은 이를 끊지 않지만, `/reset` 및 명시적인 `session.reset` 정책은 여전히 세션을 끊습니다.
- 새로운 CLI 세션은 일반적으로 OpenClaw의 Compaction 요약과 Compaction 이후의 끝부분에서만 다시 시드합니다. Compaction 전에 무효화된 짧은 세션을 복구하려면 백엔드에서 `reseedFromRawTranscriptWhenUncompacted: true`를 사용하여 선택적으로 활성화할 수 있습니다. 원시 트랜스크립트 다시 시드는 제한된 범위에서 유지되며, CLI 트랜스크립트 누락, 고립된 도구 사용 끝부분, 메시지 정책/시스템 프롬프트/cwd/MCP 변경 또는 세션 만료 재시도와 같은 안전한 무효화로 한정됩니다. 인증 프로필 또는 자격 증명 에포크 변경 시에는 원시 트랜스크립트 기록을 절대 다시 시드하지 않습니다.

직렬화: `serialize: true`는 동일 레인 실행의 순서를 유지합니다(대부분의 CLI는 하나의 제공자 레인에서 직렬화합니다). 또한 선택한 인증 ID가 변경되면 OpenClaw는 저장된 CLI 세션의 재사용을 중단합니다. 여기에는 인증 프로필 ID, 정적 API 키, 정적 토큰 또는 CLI가 노출하는 경우 OAuth 계정 ID의 변경이 포함됩니다. OAuth 액세스/갱신 토큰의 순환만으로는 세션을 끊지 않습니다. CLI에 안정적인 OAuth 계정 ID가 없는 경우 OpenClaw는 해당 CLI가 자체 재개 권한을 적용하도록 합니다.

## claude-cli 세션의 폴백 프렐류드

`claude-cli` 시도가 [`agents.defaults.model.fallbacks`](/ko/concepts/model-failover)의 비 CLI 후보로 장애 조치되면, OpenClaw는 Claude Code의 로컬 JSONL 트랜스크립트(`~/.claude/projects/` 아래에 있으며 작업 공간별로 키가 지정됨)에서 수집한 컨텍스트 프리루드로 다음 시도를 초기화합니다. 이 초기 데이터가 없으면 `claude-cli` 실행에 대한 OpenClaw 자체 세션 트랜스크립트가 비어 있으므로 대체 제공자가 아무런 컨텍스트 없이 시작합니다.

- 프렐류드는 최신 `/compact` 요약 또는 `compact_boundary` 마커를 우선 사용한 다음, 문자 예산 한도까지 경계 이후의 가장 최근 턴을 추가합니다. 경계 이전 턴은 요약에 이미 반영되어 있으므로 제외됩니다.
- 프롬프트 예산을 정확히 유지하기 위해 도구 블록은 간결한 `(tool call: name)` 및 `(tool result: …)` 힌트로 병합됩니다. 크기가 지나치게 큰 요약은 잘린 후 `(truncated)` 레이블이 지정됩니다.
- 동일 제공자 내에서 `claude-cli`에서 `claude-cli`(으)로 전환하는 폴백은 Claude 자체의 `--resume`에 의존하며 프렐류드를 건너뜁니다.
- 시드는 기존 Claude 세션 파일 경로 검증을 재사용하므로 임의의 경로를 읽을 수 없습니다.

## 이미지

CLI가 이미지 경로를 허용하는 경우 `imageArg`를 설정하십시오.

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 base64 이미지를 임시 파일에 기록합니다. `imageArg`가 설정되어 있으면 해당 경로가 CLI 인수로 전달됩니다. 설정되어 있지 않으면 OpenClaw가 파일 경로를 프롬프트에 추가합니다(경로 삽입). 이 방식은 일반 경로에서 로컬 파일을 자동으로 로드하는 CLI에서 작동합니다.

## 입력 및 출력

- `output: "text"`(기본값)는 stdout을 최종 응답으로 처리합니다.
- `output: "json"`은 JSON 파싱을 시도하고 텍스트와 세션 ID를 추출합니다.
- `output: "jsonl"`은 JSONL 스트림을 파싱하고 최종 에이전트 메시지와 세션 식별자가 있으면 이를 추출합니다.
- Gemini CLI JSON 출력의 경우 `usage`가 없거나 비어 있으면 OpenClaw는 `response`에서 응답 텍스트를 읽고 `stats`에서 사용량을 읽습니다. 번들 Gemini CLI의 기본값은 `stream-json`을 사용하며, 이전 `--output-format json` 재정의는 계속 JSON 파서를 사용합니다.

입력 모드:

- `input: "arg"`(기본값)는 프롬프트를 마지막 CLI 인수로 전달합니다.
- `input: "stdin"`은 stdin을 통해 프롬프트를 전송합니다.
- 프롬프트가 매우 길고 `maxPromptArgChars`가 설정되어 있으면 대신 stdin을 사용합니다.

## Plugin 소유 기본값

CLI 백엔드 기본값은 Plugin 표면의 일부입니다.

- Plugin은 `api.registerCliBackend(...)`를 사용하여 이를 등록합니다.
- 백엔드 `id`는 모델 참조에서 제공자 접두사가 됩니다.
- `agents.defaults.cliBackends.<id>`의 사용자 구성은 계속 Plugin 기본값보다 우선합니다.
- 백엔드별 구성 정리는 선택적 `normalizeConfig` 훅을 통해 Plugin 소유로 유지됩니다.

Anthropic은 `claude-cli`를 소유하고 Google은 `google-gemini-cli`를 소유합니다. OpenAI Codex 에이전트 실행은 `openai/*`를 통해 Codex 앱 서버 하네스를 사용합니다. OpenClaw는 더 이상 번들 `codex-cli` 백엔드를 등록하지 않습니다.

번들 Anthropic Plugin은 `claude-cli`에 대해 다음을 등록합니다.

| 키                    | 값                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

번들 Google Plugin은 `google-gemini-cli`에 등록됩니다.

| 키                        | 값                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 동일하며, `--resume {sessionId}`가 추가됩니다.                                         |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

전제 조건: 로컬 Gemini CLI가 설치되어 있어야 하며 `gemini`이라는 이름으로 `PATH`에 있어야 합니다(`brew install gemini-cli` 또는 `npm install -g @google/gemini-cli`).

Gemini CLI 출력 참고 사항:

- 기본 `stream-json` 파서는 어시스턴트 `message` 이벤트, 도구 이벤트, 최종 `result` 사용량 및 치명적인 Gemini 오류 이벤트를 읽습니다.
- Gemini 인수를 `--output-format json`으로 재정의하면 OpenClaw는 해당 백엔드를 다시 `output: "json"`으로 정규화하고 JSON `response` 필드에서 응답 텍스트를 읽습니다.
- `usage`가 없거나 비어 있으면 사용량은 `stats`로 대체됩니다. `stats.cached`는 OpenClaw의 `cacheRead`로 정규화되며, `stats.input`이 없으면 입력 토큰은 `stats.input_tokens - stats.cached`에서 파생됩니다.

필요한 경우에만 기본값을 재정의하십시오(가장 일반적으로 절대 `command` 경로).

## 텍스트 변환 오버레이

작은 프롬프트/메시지 호환성 shim이 필요한 Plugin은 제공자나 CLI 백엔드를 교체하지 않고 양방향 텍스트 변환을 선언할 수 있습니다.

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input`은 CLI에 전달되는 시스템 프롬프트와 사용자 프롬프트를 다시 작성합니다. `output`은 OpenClaw가 자체 제어 마커와 채널 전달을 처리하기 전에 스트리밍된 어시스턴트 텍스트와 파싱된 최종 텍스트를 다시 작성합니다. 제공자 기반 모델 호출의 경우 스트림 복구 후 도구 실행 전에 구조화된 도구 호출 인수 내부의 문자열 값도 복원합니다. 원시 제공자 JSON 조각은 변경되지 않으며, 소비자는 구조화된 부분, 종료 또는 결과 페이로드를 사용해야 합니다.

제공자별 JSONL 이벤트를 출력하는 CLI의 경우 해당 백엔드 구성에서 `jsonlDialect`를 설정하십시오. Claude Code 호환 스트림에는 `claude-stream-json`, Gemini CLI `stream-json` 이벤트에는 `gemini-stream-json`을 사용합니다.

## 네이티브 Compaction 소유권

일부 CLI 백엔드는 자체 트랜스크립트를 Compaction하는 에이전트를 실행하므로 OpenClaw가 해당 백엔드에 보호용 요약기를 실행해서는 안 됩니다. 그렇게 하면 백엔드 자체 Compaction과 충돌하여 턴이 심각한 오류로 실패할 수 있습니다.

`claude-cli`에는 하네스 엔드포인트가 없으므로(Claude Code가 내부적으로 Compaction함) `ownsNativeCompaction: true`를 선언하며, OpenClaw의 Compaction 경로는 세션 항목을 변경하지 않고 반환합니다. 반면 Codex 같은 네이티브 하네스 세션은 계속 해당 하네스의 Compaction 엔드포인트로 라우팅됩니다.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Compaction을 실제로 소유하는 백엔드에만 `ownsNativeCompaction`을 선언하십시오. 자체 트랜스크립트를 컨텍스트 창 근처에서 안정적으로 제한하고 재개 가능한 세션(예: `--resume` / `--session-id`)을 영속화해야 합니다. 그렇지 않으면 지연된 세션이 예산을 초과한 상태로 남을 수 있습니다.

## 번들 MCP 오버레이

CLI 백엔드는 OpenClaw 도구 호출을 직접 받지 않지만, 백엔드는 `bundleMcp: true`를 사용하여 생성된 MCP 구성 오버레이를 선택할 수 있습니다. 현재 번들 동작은 다음과 같습니다.

- `claude-cli`: 생성된 엄격한 MCP 구성 파일.
- `google-gemini-cli`: 생성된 Gemini 시스템 설정 파일.

번들 MCP가 활성화되면 OpenClaw는 다음을 수행합니다.

- Gateway 도구를 CLI 프로세스에 노출하는 루프백 HTTP MCP 서버를 생성하며, 현재 실행 시도에만 활성화되는 실행별 컨텍스트 권한 부여(`OPENCLAW_MCP_TOKEN`)로 인증합니다.
- 자식 프로세스 헤더를 신뢰하는 대신 Gateway가 선택한 세션, 계정 및 채널 컨텍스트에 도구 접근을 바인딩합니다.
- 현재 워크스페이스에서 활성화된 번들 MCP 서버를 로드하고 기존 백엔드 MCP 구성/설정 형태와 병합합니다.
- 소유 Plugin의 백엔드 소유 통합 모드를 사용하여 실행 구성을 다시 작성합니다.

활성화된 MCP 서버가 없더라도 백엔드가 번들 MCP를 선택하면 OpenClaw는 엄격한 구성을 계속 주입하므로 백그라운드 실행이 격리된 상태로 유지됩니다.

세션 범위의 번들 MCP 런타임은 세션 내 재사용을 위해 캐시된 후, `mcp.sessionIdleTtlMs`밀리초 동안 유휴 상태가 지속되면 정리됩니다(기본값 10분, 비활성화하려면 `0`으로 설정). 인증 프로브, 슬러그 생성, Active Memory 회상과 같은 일회성 임베디드 실행은 실행 종료 시 정리를 요청하므로 stdio 자식 프로세스와 Streamable HTTP/SSE 스트림이 실행보다 오래 유지되지 않습니다.

## 재시드 기록 상한

새 CLI 세션이 이전 OpenClaw 트랜스크립트에서 시드될 때(예: `session_expired` 재시도 후), 재시드 프롬프트가 지나치게 커지지 않도록 렌더링된 `<conversation_history>` 블록에 상한이 적용됩니다. 기본값은 12,288자(약 3,000토큰)입니다.

대신 Claude CLI 백엔드는 확인된 Claude 컨텍스트 창에 따라 이 상한을 조정합니다. 더 큰 컨텍스트 창에는 고정된 최대 한도까지 더 큰 이전 기록 조각이 제공되며, 다른 CLI 백엔드는 보수적인 기본값을 유지합니다. 이 상한은 재시드 프롬프트의 이전 기록 블록에만 적용됩니다. 라이브 세션 출력 제한은 `reliability.outputLimits`에서 별도로 조정됩니다([세션](#sessions) 참조).

## 제한 사항

- 직접적인 OpenClaw 도구 호출 없음: OpenClaw는 CLI 백엔드 프로토콜에 도구 호출을 주입하지 않습니다. 백엔드는 `bundleMcp: true`를 선택한 경우에만 Gateway 도구를 볼 수 있습니다.
- 스트리밍은 백엔드별로 다릅니다. 일부 백엔드는 JSONL을 스트리밍하고, 다른 백엔드는 종료될 때까지 버퍼링합니다.
- 구조화된 출력은 CLI 자체 JSON 형식에 따라 달라집니다.

## 문제 해결

| 증상                  | 해결 방법                                                                 |
| --------------------- | ------------------------------------------------------------------------- |
| CLI를 찾을 수 없음    | `command`를 전체 경로로 설정하십시오.                                     |
| 잘못된 모델 이름      | `modelAliases`를 사용하여 `provider/model`을 CLI의 모델 ID에 매핑하십시오. |
| 세션 연속성 없음      | `sessionArg`가 설정되어 있고 `sessionMode`가 `none`이 아닌지 확인하십시오. |
| 이미지가 무시됨       | `imageArg`를 설정하고 CLI가 파일 경로를 지원하는지 확인하십시오.           |

## 관련 문서

- [Gateway 실행 안내서](/ko/gateway)
- [로컬 모델](/ko/gateway/local-models)
