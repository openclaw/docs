---
read_when:
    - API 제공업체에 장애가 발생할 때 신뢰할 수 있는 대체 수단이 필요합니다
    - 로컬 AI CLI를 실행 중이며 이를 재사용하려는 경우
    - CLI 백엔드 도구 액세스를 위한 MCP 루프백 브리지를 이해하려는 경우
summary: 'CLI 백엔드: 선택적 MCP 도구 브리지를 사용하는 로컬 AI CLI 폴백'
title: CLI 백엔드
x-i18n:
    generated_at: "2026-07-12T00:45:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw는 API 제공자가 중단되거나, 사용량 제한에 걸리거나, 오작동할 때 로컬 AI CLI를 텍스트 전용 폴백으로 실행할 수 있습니다. 이 기능은 의도적으로 보수적으로 설계되었습니다.

- OpenClaw 도구는 직접 주입되지 않지만, `bundleMcp: true`인 백엔드는 로컬 루프백 MCP 브리지를 통해 Gateway 도구를 받을 수 있습니다.
- 이를 지원하는 CLI에는 JSONL 스트리밍을 사용합니다.
- 세션을 지원하므로 후속 턴의 맥락이 일관되게 유지됩니다.
- CLI가 이미지 경로를 허용하면 이미지도 전달됩니다.

기본 경로가 아니라 "항상 작동하는" 텍스트 응답을 위한 안전망으로 사용하세요. ACP 세션 제어, 백그라운드 작업, 스레드/대화 바인딩, 영구 외부 코딩 세션을 갖춘 완전한 하네스 런타임이 필요하면 대신 [ACP 에이전트](/ko/tools/acp-agents)를 사용하세요. CLI 백엔드는 ACP가 아닙니다.

<Tip>
  새 백엔드 Plugin을 개발하고 있나요? [CLI 백엔드 Plugin](/ko/plugins/cli-backend-plugins)을 참조하세요. 이 페이지에서는 이미 등록된 백엔드를 구성하고 운영하는 방법을 설명합니다.
</Tip>

## 빠른 시작

번들 Anthropic Plugin은 기본 `claude-cli` 백엔드를 등록하므로, Claude Code가 설치되어 있고 로그인되어 있기만 하면 별도 구성 없이 작동합니다.

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

명시적인 에이전트 목록이 구성되지 않은 경우 `main`이 기본 에이전트 ID입니다. 그렇지 않으면 자신의 에이전트 ID로 바꾸세요.

Gateway가 최소한의 `PATH`만 있는 launchd/systemd에서 실행된다면 바이너리를 명시적으로 지정하세요.

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

Gateway 호스트에서 번들 CLI 백엔드를 기본 메시지 제공자로 사용하는 경우, 구성의 모델 참조나 `agents.defaults.cliBackends`에서 해당 백엔드를 참조하면 OpenClaw가 이를 소유한 번들 Plugin을 자동으로 로드합니다.

## 폴백으로 사용하기

CLI 백엔드를 폴백 목록에 추가하면 기본 모델이 실패할 때만 실행됩니다.

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

`agents.defaults.models`를 허용 목록으로 사용한다면 CLI 백엔드 모델도 포함하세요. 기본 제공자가 인증, 사용량 제한, 시간 초과 등의 이유로 실패하면 OpenClaw가 다음으로 CLI 백엔드를 시도합니다.

## 구성

모든 CLI 백엔드는 `agents.defaults.cliBackends` 아래에 있으며 제공자 ID(예: `claude-cli`, `my-cli`)를 키로 사용합니다. 제공자 ID는 모델 참조 `<provider>/<model>`의 왼쪽 부분이 됩니다.

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
          // 또는 Codex 방식의 구성 재정의 플래그:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // 이 백엔드가 Compaction 이전의 제한된 원시 OpenClaw 트랜스크립트
          // 기록으로 무효화된 세션을 다시 초기화할 수 있는 경우에만 사용하세요.
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
2. 동일한 OpenClaw 프롬프트와 작업 공간 컨텍스트를 사용하여 시스템 프롬프트를 구성합니다.
3. 기록의 일관성이 유지되도록 세션 ID를 지원하는 경우 세션 ID와 함께 CLI를 실행합니다. 번들 `claude-cli` 백엔드는 OpenClaw 세션마다 Claude 표준 입출력 프로세스를 계속 실행하고 stream-json 표준 입력을 통해 후속 턴을 전송합니다.
4. 출력(JSON 또는 일반 텍스트)을 파싱하고 최종 텍스트를 반환합니다.
5. 후속 요청이 동일한 CLI 세션을 재사용하도록 백엔드별 세션 ID를 영구 저장합니다.

### Claude CLI 세부 사항

번들 `claude-cli` 백엔드는 Claude Code의 기본 스킬 해석기를 우선 사용합니다. 현재 Skills 스냅샷에 구체화된 경로가 있는 선택된 스킬이 하나 이상 있으면 OpenClaw는 `--plugin-dir`을 통해 임시 Claude Code Plugin을 전달하고, 추가되는 시스템 프롬프트에서 중복 OpenClaw Skills 카탈로그를 생략합니다. 구체화된 Plugin 스킬이 없으면 OpenClaw는 폴백으로 프롬프트 카탈로그를 유지합니다. 스킬 환경 변수/API 키 재정의는 해당 실행의 자식 프로세스 환경에도 계속 적용됩니다.

Claude CLI에는 자체 비대화형 권한 모드가 있습니다. OpenClaw는 Claude 전용 구성을 추가하지 않고 이를 기존 실행 정책에 매핑합니다. OpenClaw가 관리하는 Claude 라이브 세션에서는 유효 실행 정책이 최종 기준입니다. YOLO(`tools.exec.security: "full"` 및 `tools.exec.ask: "off"`)는 `--permission-mode bypassPermissions`로 Claude를 실행하고, 제한적인 정책은 `--permission-mode default`로 실행합니다. 에이전트별 `agents.list[].tools.exec` 설정은 해당 에이전트의 전역 `tools.exec` 설정을 재정의합니다. 원시 백엔드 인수에 `--permission-mode`가 포함되어 있어도 라이브 Claude 실행에서는 해당 플래그를 유효 정책에 맞게 정규화합니다.

또한 백엔드는 OpenClaw `/think` 수준을 Claude Code의 기본 `--effort` 플래그에 매핑합니다. `minimal`/`low` -> `low`, `medium` -> `medium`이며, `high`/`xhigh`/`max`는 그대로 전달됩니다. `adaptive`는 구성된 `--effort` 플래그를 제거하고 대체값을 제공하지 않으므로 Claude Code가 자체 환경, 설정, 모델 기본값을 기준으로 유효한 노력 수준을 결정합니다. 다른 CLI 백엔드에서는 소유 Plugin이 동일한 argv 매퍼를 선언해야 `/think`가 생성되는 CLI에 영향을 줍니다.

OpenClaw가 `claude-cli`를 사용하려면 먼저 동일한 호스트에서 Claude Code 자체에 로그인해야 합니다.

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker 설치에서는 호스트뿐 아니라 영구 컨테이너 홈 내부에도 Claude Code를 설치하고 로그인해야 합니다. [Docker의 Claude CLI 백엔드](/ko/install/docker#claude-cli-backend-in-docker)를 참조하세요.

`claude` 바이너리가 이미 `PATH`에 없는 경우에만 `agents.defaults.cliBackends.claude-cli.command`를 설정하세요.

## 세션

- CLI가 세션을 지원하는 경우 `sessionArg`(예: `--session-id`)를 설정하거나, ID를 여러 플래그에 넣어야 한다면 `sessionArgs`(자리표시자 `{sessionId}`)를 설정하세요.
- CLI가 다른 플래그를 사용하는 재개 하위 명령을 제공한다면 `resumeArgs`(재개 시 `args`를 대체)를 설정하고, JSON이 아닌 재개 출력에는 선택적으로 `resumeOutput`을 설정하세요.
- `sessionMode`:
  - `always`: 항상 세션 ID를 전송합니다. 저장된 ID가 없으면 새 UUID를 사용합니다.
  - `existing`: 이전에 저장된 세션 ID가 있을 때만 전송합니다.
  - `none`: 세션 ID를 전송하지 않습니다.
- `claude-cli`의 기본값은 `liveSession: "claude-stdio"`, `output: "jsonl"`, `input: "stdin"`이므로 전송 필드를 생략한 사용자 지정 구성에서도 활성 상태인 동안 후속 턴이 라이브 Claude 프로세스를 재사용합니다. Gateway가 다시 시작되거나 유휴 프로세스가 종료되면 OpenClaw는 저장된 Claude 세션 ID에서 재개합니다. 재개 전에 저장된 세션 ID에 해당하는 읽기 가능한 프로젝트 트랜스크립트가 있는지 확인합니다. 트랜스크립트가 없으면 `--resume`에서 새 세션을 자동으로 시작하는 대신 바인딩을 해제하고 `reason=transcript-missing`으로 기록합니다.
- Claude 라이브 세션은 제한된 JSONL 출력 보호 한도를 유지합니다. 기본값은 턴당 8 MiB 및 원시 JSONL 20,000줄입니다. 백엔드별 `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` 및 `maxTurnLines`로 늘릴 수 있으며, OpenClaw는 해당 설정을 64 MiB와 100,000줄로 제한합니다.
- 저장된 CLI 세션은 제공자가 소유하는 연속성입니다. 암시적인 일일 세션 재설정으로는 중단되지 않지만 `/reset` 및 명시적인 `session.reset` 정책으로는 중단됩니다.
- 새 CLI 세션은 일반적으로 OpenClaw의 Compaction 요약과 Compaction 이후 꼬리 부분만으로 다시 초기화됩니다. Compaction 전에 무효화된 짧은 세션을 복구하려면 백엔드에서 `reseedFromRawTranscriptWhenUncompacted: true`를 활성화할 수 있습니다. 원시 트랜스크립트 재초기화는 제한된 범위를 유지하며 CLI 트랜스크립트 누락, 고립된 도구 사용 꼬리, 메시지 정책/시스템 프롬프트/현재 작업 디렉터리/MCP 변경, 세션 만료 재시도와 같은 안전한 무효화에만 적용됩니다. 인증 프로필 또는 자격 증명 에포크 변경 시에는 원시 트랜스크립트 기록으로 다시 초기화하지 않습니다.

직렬화: `serialize: true`는 동일 레인의 실행 순서를 유지합니다. 대부분의 CLI는 하나의 제공자 레인에서 직렬화됩니다. 또한 선택된 인증 ID가 변경되면 OpenClaw는 저장된 CLI 세션을 재사용하지 않습니다. 여기에는 인증 프로필 ID, 정적 API 키, 정적 토큰 또는 CLI가 공개하는 경우 OAuth 계정 ID 변경이 포함됩니다. OAuth 액세스/새로 고침 토큰의 순환만으로는 세션을 중단하지 않습니다. CLI에 안정적인 OAuth 계정 ID가 없으면 OpenClaw는 해당 CLI가 자체 재개 권한을 적용하도록 합니다.

## claude-cli 세션의 폴백 프리루드

`claude-cli` 시도가 [`agents.defaults.model.fallbacks`](/ko/concepts/model-failover)의 비 CLI 후보로 전환되면 OpenClaw는 Claude Code의 로컬 JSONL 트랜스크립트(`~/.claude/projects/` 아래에서 작업 공간별로 키 지정)에서 수집한 컨텍스트 프리루드로 다음 시도를 초기화합니다. 이 초기 정보가 없으면 `claude-cli` 실행 시 OpenClaw 자체 세션 트랜스크립트가 비어 있으므로 폴백 제공자는 컨텍스트 없이 시작합니다.

- 프리루드는 최신 `/compact` 요약 또는 `compact_boundary` 마커를 우선 사용한 다음, 문자 예산 범위 내에서 경계 이후의 가장 최근 턴을 추가합니다. 경계 이전 턴은 요약에 이미 반영되어 있으므로 삭제됩니다.
- 프롬프트 예산을 정확히 유지하기 위해 도구 블록은 간결한 `(도구 호출: 이름)` 및 `(도구 결과: …)` 힌트로 병합됩니다. 너무 큰 요약은 잘리고 `(잘림)`으로 표시됩니다.
- 동일 제공자 내 `claude-cli`에서 `claude-cli`로의 폴백은 Claude 자체의 `--resume`을 사용하며 프리루드를 건너뜁니다.
- 초기 정보는 기존 Claude 세션 파일 경로 검증을 재사용하므로 임의의 경로를 읽을 수 없습니다.

## 이미지

CLI가 이미지 경로를 허용한다면 `imageArg`를 설정하세요.

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 base64 이미지를 임시 파일에 씁니다. `imageArg`가 설정되어 있으면 해당 경로를 CLI 인수로 전달하고, 설정되어 있지 않으면 프롬프트에 파일 경로를 추가합니다(경로 주입). 이는 일반 경로에서 로컬 파일을 자동으로 로드하는 CLI에서 작동합니다.

## 입력 및 출력

- `output: "text"`(기본값)는 표준 출력을 최종 응답으로 처리합니다.
- `output: "json"`은 JSON 파싱을 시도하고 텍스트와 세션 ID를 추출합니다.
- `output: "jsonl"`은 JSONL 스트림을 파싱하고 최종 에이전트 메시지와 세션 식별자가 있으면 이를 추출합니다.
- Gemini CLI JSON 출력에서는 `usage`가 없거나 비어 있을 때 OpenClaw가 `response`에서 응답 텍스트를 읽고 `stats`에서 사용량을 읽습니다. 번들 Gemini CLI 기본값은 `stream-json`을 사용하며, 기존 `--output-format json` 재정의는 계속 JSON 파서를 사용합니다.

입력 모드:

- `input: "arg"`(기본값)는 프롬프트를 마지막 CLI 인수로 전달합니다.
- `input: "stdin"`은 표준 입력을 통해 프롬프트를 전송합니다.
- 프롬프트가 매우 길고 `maxPromptArgChars`가 설정되어 있으면 표준 입력을 대신 사용합니다.

## Plugin 소유 기본값

CLI 백엔드 기본값은 Plugin 표면의 일부입니다.

- Plugin은 `api.registerCliBackend(...)`로 기본값을 등록합니다.
- 백엔드 `id`는 모델 참조의 제공자 접두사가 됩니다.
- `agents.defaults.cliBackends.<id>`의 사용자 구성은 계속 Plugin 기본값을 재정의합니다.
- 백엔드별 구성 정리는 선택적 `normalizeConfig` 훅을 통해 Plugin이 계속 소유합니다.

Anthropic은 `claude-cli`를 소유하고 Google은 `google-gemini-cli`를 소유합니다. OpenAI Codex 에이전트 실행은 `openai/*`를 통해 Codex 앱 서버 하네스를 사용합니다. OpenClaw는 더 이상 번들 `codex-cli` 백엔드를 등록하지 않습니다.

번들 Anthropic Plugin은 `claude-cli`에 다음을 등록합니다.

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

번들 Google Plugin은 `google-gemini-cli`용으로 다음을 등록합니다.

| 키                        | 값                                                                                     |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | 동일하되 `--resume {sessionId}` 포함                                                   |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

사전 요구 사항: 로컬 Gemini CLI가 설치되어 있어야 하며 `gemini`라는 이름으로 `PATH`에 등록되어 있어야 합니다(`brew install gemini-cli` 또는 `npm install -g @google/gemini-cli`).

Gemini CLI 출력 참고 사항:

- 기본 `stream-json` 파서는 어시스턴트 `message` 이벤트, 도구 이벤트, 최종 `result` 사용량 및 치명적인 Gemini 오류 이벤트를 읽습니다.
- Gemini 인수를 `--output-format json`으로 재정의하면 OpenClaw는 해당 백엔드를 다시 `output: "json"`으로 정규화하고 JSON `response` 필드에서 응답 텍스트를 읽습니다.
- `usage`가 없거나 비어 있으면 사용량은 `stats`로 대체됩니다. `stats.cached`는 OpenClaw의 `cacheRead`로 정규화되며, `stats.input`이 없으면 입력 토큰 수는 `stats.input_tokens - stats.cached`에서 산출됩니다.

필요한 경우에만 기본값을 재정의하세요. 가장 일반적인 경우는 절대 `command` 경로입니다.

## 텍스트 변환 오버레이

작은 프롬프트/메시지 호환성 보정이 필요한 Plugin은 공급자나 CLI 백엔드를 교체하지 않고 양방향 텍스트 변환을 선언할 수 있습니다.

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input`은 CLI에 전달되는 시스템 프롬프트와 사용자 프롬프트를 다시 작성합니다. `output`은 OpenClaw가 자체 제어 마커와 채널 전달을 처리하기 전에 스트리밍된 어시스턴트 텍스트와 파싱된 최종 텍스트를 다시 작성합니다. 공급자 기반 모델 호출의 경우 스트림 복구 후 도구 실행 전에 구조화된 도구 호출 인수 안의 문자열 값도 복원합니다. 원시 공급자 JSON 조각은 변경되지 않습니다. 소비자는 구조화된 부분, 종료 또는 결과 페이로드를 사용해야 합니다.

공급자별 JSONL 이벤트를 출력하는 CLI의 경우 해당 백엔드 구성에 `jsonlDialect`를 설정하세요. Claude Code 호환 스트림에는 `claude-stream-json`, Gemini CLI `stream-json` 이벤트에는 `gemini-stream-json`을 사용합니다.

## 네이티브 Compaction 소유권

일부 CLI 백엔드는 자체 대화 기록을 Compaction하는 에이전트를 실행하므로 OpenClaw가 해당 백엔드에 안전장치 요약기를 실행해서는 안 됩니다. 그렇게 하면 백엔드 자체 Compaction과 충돌하여 해당 턴이 완전히 실패할 수 있습니다.

`claude-cli`에는 하네스 엔드포인트가 없으므로(Claude Code가 내부적으로 Compaction 수행) `ownsNativeCompaction: true`를 선언하며, OpenClaw의 Compaction 경로는 세션 항목을 변경하지 않고 반환합니다. Codex와 같은 네이티브 하네스 세션은 대신 해당 하네스 Compaction 엔드포인트로 계속 라우팅됩니다.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

실제로 Compaction을 소유하는 백엔드에만 `ownsNativeCompaction`을 선언하세요. 해당 백엔드는 컨텍스트 창 근처에서 자체 대화 기록의 크기를 안정적으로 제한하고 재개 가능한 세션(예: `--resume` / `--session-id`)을 영속화해야 합니다. 그렇지 않으면 지연된 세션이 계속 한도를 초과한 상태로 남을 수 있습니다.

## 번들 MCP 오버레이

CLI 백엔드는 OpenClaw 도구 호출을 직접 수신하지 않지만, 백엔드는 `bundleMcp: true`를 사용하여 생성된 MCP 구성 오버레이를 선택적으로 활성화할 수 있습니다. 현재 번들 동작은 다음과 같습니다.

- `claude-cli`: 생성된 엄격한 MCP 구성 파일.
- `google-gemini-cli`: 생성된 Gemini 시스템 설정 파일.

번들 MCP가 활성화되면 OpenClaw는 다음을 수행합니다.

- Gateway 도구를 CLI 프로세스에 노출하는 local loopback HTTP MCP 서버를 생성하며, 현재 실행 시도에만 활성화되는 실행별 컨텍스트 권한 부여(`OPENCLAW_MCP_TOKEN`)로 인증합니다.
- 자식 프로세스 헤더를 신뢰하는 대신 도구 접근 권한을 Gateway가 선택한 세션, 계정 및 채널 컨텍스트에 바인딩합니다.
- 현재 워크스페이스에서 활성화된 번들 MCP 서버를 로드하고 기존 백엔드 MCP 구성/설정 형태와 병합합니다.
- 소유 Plugin의 백엔드 소유 통합 모드를 사용하여 실행 구성을 다시 작성합니다.

활성화된 MCP 서버가 없더라도 백엔드가 번들 MCP를 선택하면 OpenClaw는 엄격한 구성을 삽입하여 백그라운드 실행을 격리된 상태로 유지합니다.

세션 범위의 번들 MCP 런타임은 세션 내에서 재사용할 수 있도록 캐시된 후 `mcp.sessionIdleTtlMs`밀리초 동안 유휴 상태가 지속되면 정리됩니다(기본값 10분, 비활성화하려면 `0`으로 설정). 인증 검사, 슬러그 생성, Active Memory 회상과 같은 일회성 임베디드 실행은 실행 종료 시 정리를 요청하므로 stdio 자식 프로세스와 Streamable HTTP/SSE 스트림이 실행보다 오래 유지되지 않습니다.

## 재시드 기록 제한

새 CLI 세션이 이전 OpenClaw 대화 기록에서 시드되는 경우(예: `session_expired` 재시도 후), 재시드 프롬프트가 지나치게 커지지 않도록 렌더링된 `<conversation_history>` 블록의 크기가 제한됩니다. 기본값은 12,288자(약 3,000토큰)입니다.

Claude CLI 백엔드는 대신 확인된 Claude 컨텍스트 창에 따라 이 제한을 조정합니다. 컨텍스트 창이 클수록 고정된 상한까지 더 많은 이전 기록을 포함하며, 다른 CLI 백엔드는 보수적인 기본값을 유지합니다. 이 제한은 재시드 프롬프트의 이전 기록 블록에만 적용됩니다. 라이브 세션 출력 제한은 `reliability.outputLimits`에서 별도로 조정됩니다([세션](#sessions) 참조).

## 제한 사항

- OpenClaw 도구 직접 호출 없음: OpenClaw는 CLI 백엔드 프로토콜에 도구 호출을 삽입하지 않습니다. 백엔드는 `bundleMcp: true`를 선택한 경우에만 Gateway 도구를 볼 수 있습니다.
- 스트리밍은 백엔드별로 다릅니다. 일부 백엔드는 JSONL을 스트리밍하고, 다른 백엔드는 종료될 때까지 버퍼링합니다.
- 구조화된 출력은 CLI 자체 JSON 형식에 따라 달라집니다.

## 문제 해결

| 증상                 | 해결 방법                                                                 |
| -------------------- | ------------------------------------------------------------------------- |
| CLI를 찾을 수 없음   | `command`를 전체 경로로 설정합니다.                                       |
| 잘못된 모델 이름     | `modelAliases`를 사용하여 `provider/model`을 CLI의 모델 ID에 매핑합니다. |
| 세션 연속성 없음     | `sessionArg`가 설정되어 있고 `sessionMode`가 `none`이 아닌지 확인합니다.  |
| 이미지가 무시됨      | `imageArg`를 설정하고 CLI가 파일 경로를 지원하는지 확인합니다.            |

## 관련 문서

- [Gateway 운영 가이드](/ko/gateway)
- [로컬 모델](/ko/gateway/local-models)
