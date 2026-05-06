---
read_when:
    - API 제공자에 장애가 발생했을 때 신뢰할 수 있는 대체 수단이 필요합니다
    - Codex CLI 또는 기타 로컬 AI CLI를 실행 중이며 이를 재사용하려는 경우
    - CLI 백엔드 도구 접근을 위한 MCP 루프백 브리지를 이해하려는 경우
summary: 'CLI 백엔드: 선택적 MCP 도구 브리지가 포함된 로컬 AI CLI 폴백'
title: CLI 백엔드
x-i18n:
    generated_at: "2026-05-06T06:24:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw는 API 공급자가 중단되었거나, 속도 제한이 걸렸거나, 일시적으로 오작동할 때 **텍스트 전용 대체 경로**로 **로컬 AI CLI**를 실행할 수 있습니다. 이는 의도적으로 보수적인 방식입니다:

- **OpenClaw 도구는 직접 주입되지 않지만**, `bundleMcp: true`인 백엔드는
  루프백 MCP 브리지를 통해 Gateway 도구를 받을 수 있습니다.
- 이를 지원하는 CLI를 위한 **JSONL 스트리밍**.
- **세션이 지원됩니다**(따라서 후속 턴이 일관성을 유지합니다).
- CLI가 이미지 경로를 허용하면 **이미지를 그대로 전달할 수 있습니다**.

이는 기본 경로가 아니라 **안전망**으로 설계되었습니다. 외부 API에 의존하지 않고
"항상 작동하는" 텍스트 응답이 필요할 때 사용하세요.

ACP 세션 제어, 백그라운드 작업, 스레드/대화 바인딩, 지속적인 외부 코딩 세션이 있는 전체 하네스 런타임이 필요하다면 대신
[ACP Agents](/ko/tools/acp-agents)를 사용하세요. CLI 백엔드는 ACP가 아닙니다.

## 초보자 친화적 빠른 시작

Codex CLI는 **별도 config 없이** 사용할 수 있습니다(번들 OpenAI Plugin이
기본 백엔드를 등록합니다):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway가 launchd/systemd 아래에서 실행되고 PATH가 최소화되어 있다면,
명령 경로만 추가하세요:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

이게 전부입니다. CLI 자체 외에는 키나 추가 인증 config가 필요하지 않습니다.

번들 CLI 백엔드를 Gateway 호스트의 **기본 메시지 공급자**로 사용하는 경우,
config가 모델 참조 또는 `agents.defaults.cliBackends` 아래에서 해당 백엔드를
명시적으로 참조하면 OpenClaw는 이제 소유 번들 Plugin을 자동으로 로드합니다.

## 대체 경로로 사용하기

기본 모델이 실패할 때만 실행되도록 CLI 백엔드를 대체 목록에 추가하세요:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

참고:

- `agents.defaults.models`(허용 목록)를 사용하는 경우 CLI 백엔드 모델도 거기에 포함해야 합니다.
- 기본 공급자가 실패하면(인증, 속도 제한, 시간 초과), OpenClaw는
  다음으로 CLI 백엔드를 시도합니다.

## 구성 개요

모든 CLI 백엔드는 다음 아래에 있습니다:

```
agents.defaults.cliBackends
```

각 항목은 **공급자 id**(예: `codex-cli`, `my-cli`)를 키로 사용합니다.
공급자 id는 모델 참조의 왼쪽이 됩니다:

```
<provider>/<model>
```

### 구성 예시

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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
          // 전용 prompt-file 플래그가 있는 CLI의 경우:
          // systemPromptFileArg: "--system-file",
          // Codex 스타일 CLI는 대신 프롬프트 파일을 가리킬 수 있습니다:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## 작동 방식

1. 공급자 접두사(`codex-cli/...`)를 기준으로 **백엔드를 선택합니다**.
2. 동일한 OpenClaw 프롬프트 + 워크스페이스 컨텍스트를 사용해 **시스템 프롬프트를 구성합니다**.
3. 기록이 일관되게 유지되도록 세션 id(지원되는 경우)와 함께 **CLI를 실행합니다**.
   번들 `claude-cli` 백엔드는 OpenClaw 세션별로 Claude stdio 프로세스를 계속 실행해 두고
   stream-json stdin으로 후속 턴을 보냅니다.
4. **출력을 파싱합니다**(JSON 또는 일반 텍스트) 그리고 최종 텍스트를 반환합니다.
5. 백엔드별로 **세션 id를 유지**하여 후속 턴이 같은 CLI 세션을 재사용하게 합니다.

<Note>
번들 Anthropic `claude-cli` 백엔드가 다시 지원됩니다. Anthropic 직원이
OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려 주었으므로, Anthropic이
새 정책을 게시하지 않는 한 OpenClaw는 이 통합에서 `claude -p` 사용을 승인된 것으로 취급합니다.
</Note>

번들 OpenAI `codex-cli` 백엔드는 Codex의 `model_instructions_file` config override(`-c
model_instructions_file="..."`)를 통해 OpenClaw의 시스템 프롬프트를 전달합니다. Codex는 Claude 스타일
`--append-system-prompt` 플래그를 노출하지 않으므로, OpenClaw는 새 Codex CLI 세션마다 조립된 프롬프트를
임시 파일에 씁니다.

번들 Anthropic `claude-cli` 백엔드는 OpenClaw Skills 스냅샷을 두 가지 방식으로 받습니다:
추가된 시스템 프롬프트 안의 압축된 OpenClaw Skills 카탈로그와 `--plugin-dir`로 전달되는
임시 Claude Code Plugin입니다. 이 Plugin에는 해당 에이전트/세션에 적합한 Skills만 포함되므로,
Claude Code의 네이티브 Skill 확인자는 OpenClaw가 프롬프트에서 광고했을 동일한 필터링된 집합을 봅니다.
Skill env/API 키 override는 실행 시 자식 프로세스 환경에 OpenClaw가 계속 적용합니다.

Claude CLI에는 자체 비대화형 권한 모드도 있습니다. OpenClaw는 Claude 전용 config를 추가하는 대신 이를
기존 exec 정책에 매핑합니다. 유효하게 요청된 exec 정책이 YOLO(`tools.exec.security: "full"` 및
`tools.exec.ask: "off"`)이면 OpenClaw는 `--permission-mode bypassPermissions`를 추가합니다.
에이전트별 `agents.list[].tools.exec` 설정은 해당 에이전트에 대해 전역 `tools.exec`를 override합니다.
다른 Claude 모드를 강제하려면 `agents.defaults.cliBackends.claude-cli.args` 및 일치하는 `resumeArgs` 아래에
`--permission-mode default` 또는 `--permission-mode acceptEdits` 같은 명시적 원시 백엔드 args를 설정하세요.

번들 Anthropic `claude-cli` 백엔드는 OpenClaw `/think` 수준도 off가 아닌 수준에 대해
Claude Code의 네이티브 `--effort` 플래그에 매핑합니다. `minimal` 및
`low`는 `low`로, `adaptive` 및 `medium`은 `medium`으로 매핑되며, `high`,
`xhigh`, `max`는 직접 매핑됩니다. 다른 CLI 백엔드는 `/think`가 생성된 CLI에 영향을 주기 전에
소유 Plugin이 동등한 argv 매퍼를 선언해야 합니다.

OpenClaw가 번들 `claude-cli` 백엔드를 사용하려면 먼저 Claude Code 자체가
같은 호스트에 로그인되어 있어야 합니다:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`agents.defaults.cliBackends.claude-cli.command`는 `claude`
바이너리가 아직 `PATH`에 없을 때만 사용하세요.

## 세션

- CLI가 세션을 지원하면, ID를 여러 플래그에 삽입해야 할 때 `sessionArg`(예: `--session-id`) 또는
  `sessionArgs`(플레이스홀더 `{sessionId}`)를 설정하세요.
- CLI가 서로 다른 플래그가 있는 **resume 하위 명령**을 사용하면,
  `resumeArgs`(재개 시 `args`를 대체)를 설정하고 선택적으로 `resumeOutput`
  (JSON이 아닌 재개용)을 설정하세요.
- `sessionMode`:
  - `always`: 항상 세션 id를 보냅니다(저장된 것이 없으면 새 UUID).
  - `existing`: 이전에 저장된 세션 id가 있을 때만 보냅니다.
  - `none`: 세션 id를 절대 보내지 않습니다.
- `claude-cli`는 기본적으로 `liveSession: "claude-stdio"`, `output: "jsonl"`,
  `input: "stdin"`을 사용하므로 후속 턴은 활성 상태인 동안 라이브 Claude 프로세스를 재사용합니다.
  transport 필드를 생략한 사용자 지정 config를 포함해 이제 warm stdio가 기본값입니다. Gateway가 재시작되거나
  유휴 프로세스가 종료되면 OpenClaw는 저장된 Claude 세션 id에서 재개합니다. 저장된 세션
  id는 재개 전에 기존의 읽을 수 있는 프로젝트 transcript와 대조해 확인되므로,
  유령 바인딩은 `--resume` 아래에서 조용히 새 Claude CLI 세션을 시작하는 대신
  `reason=transcript-missing`으로 지워집니다.
- Claude 라이브 세션은 제한된 JSONL 출력 가드를 유지합니다. 기본값은 턴당 최대
  8 MiB 및 20,000개의 원시 JSONL 줄을 허용합니다. 도구가 많은 Claude 턴은 백엔드별로
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  및 `maxTurnLines`를 사용해 이를 늘릴 수 있습니다. OpenClaw는 해당 설정을 64 MiB 및 100,000
  줄로 제한합니다.
- 저장된 CLI 세션은 공급자가 소유하는 연속성입니다. 암시적 일일 세션
  reset은 이를 끊지 않습니다. `/reset` 및 명시적 `session.reset` 정책은 여전히
  적용됩니다.

직렬화 참고:

- `serialize: true`는 같은 레인의 실행 순서를 유지합니다.
- 대부분의 CLI는 하나의 공급자 레인에서 직렬화됩니다.
- 선택된 인증 ID가 바뀌면 OpenClaw는 저장된 CLI 세션 재사용을 중단합니다.
  여기에는 변경된 인증 프로필 id, 정적 API 키, 정적 토큰, 또는 CLI가 노출하는 경우 OAuth
  계정 ID가 포함됩니다. OAuth 액세스 및 refresh token
  순환은 저장된 CLI 세션을 끊지 않습니다. CLI가 안정적인 OAuth 계정 id를 노출하지 않으면,
  OpenClaw는 해당 CLI가 재개 권한을 강제하도록 둡니다.

## claude-cli 세션의 대체 prelude

`claude-cli` 시도가
[`agents.defaults.model.fallbacks`](/ko/concepts/model-failover)에 있는 비-CLI 후보로 실패 전환되면,
OpenClaw는 `~/.claude/projects/`의 Claude Code 로컬
JSONL transcript에서 수집한 컨텍스트 prelude로 다음 시도를 시드합니다. 이 시드가 없으면
OpenClaw 자체 세션 transcript가 `claude-cli` 실행에 대해 비어 있기 때문에 대체
공급자는 cold start하게 됩니다.

- prelude는 최신 `/compact` 요약 또는 `compact_boundary`
  마커를 우선 사용한 뒤, 문자 예산까지 가장 최근의 boundary 이후 턴을 덧붙입니다.
  boundary 이전 턴은 요약이 이미 이를 나타내기 때문에 버립니다.
- 도구 블록은 프롬프트 예산을 정직하게 유지하기 위해 압축된 `(tool call: name)` 및
  `(tool result: …)` 힌트로 병합됩니다. 요약이 넘치면
  `(truncated)`로 표시됩니다.
- 같은 공급자의 `claude-cli`에서 `claude-cli`로 가는 대체 경로는 Claude 자체
  `--resume`에 의존하고 prelude를 건너뜁니다.
- 시드는 기존 Claude 세션 파일 경로 검증을 재사용하므로
  임의의 경로를 읽을 수 없습니다.

## 이미지(그대로 전달)

CLI가 이미지 경로를 허용하면 `imageArg`를 설정하세요:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 base64 이미지를 임시 파일에 씁니다. `imageArg`가 설정되어 있으면 해당
경로가 CLI args로 전달됩니다. `imageArg`가 없으면 OpenClaw는 파일 경로를
프롬프트에 덧붙입니다(경로 주입). 이는 일반 경로에서 로컬 파일을 자동으로 로드하는 CLI에는 충분합니다.

## 입력 / 출력

- `output: "json"`(기본값)은 JSON을 파싱하고 텍스트 + 세션 id를 추출하려고 시도합니다.
- Gemini CLI JSON 출력의 경우, `usage`가 없거나 비어 있으면 OpenClaw는 `response`에서 응답 텍스트를,
  `stats`에서 사용량을 읽습니다.
- `output: "jsonl"`은 JSONL 스트림(예: Codex CLI `--json`)을 파싱하고 최종 에이전트 메시지와 세션
  식별자가 있으면 이를 추출합니다.
- `output: "text"`는 stdout을 최종 응답으로 취급합니다.

입력 모드:

- `input: "arg"`(기본값)는 프롬프트를 마지막 CLI arg로 전달합니다.
- `input: "stdin"`은 stdin을 통해 프롬프트를 보냅니다.
- 프롬프트가 매우 길고 `maxPromptArgChars`가 설정되어 있으면 stdin이 사용됩니다.

## 기본값(Plugin 소유)

번들 OpenAI Plugin은 `codex-cli`의 기본값도 등록합니다:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

번들 Google Plugin은 `google-gemini-cli`의 기본값도 등록합니다:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

전제 조건: 로컬 Gemini CLI가 설치되어 있어야 하며
`PATH`에서 `gemini`로 사용할 수 있어야 합니다(`brew install gemini-cli` 또는
`npm install -g @google/gemini-cli`).

Gemini CLI JSON 참고:

- 응답 텍스트는 JSON `response` 필드에서 읽습니다.
- `usage`가 없거나 비어 있으면 사용량은 `stats`로 폴백합니다.
- `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
- `stats.input`이 없으면 OpenClaw는 입력 토큰을
  `stats.input_tokens - stats.cached`에서 파생합니다.

필요한 경우에만 재정의하세요(일반적: 절대 `command` 경로).

## Plugin 소유 기본값

CLI 백엔드 기본값은 이제 Plugin 표면의 일부입니다.

- Plugin은 `api.registerCliBackend(...)`로 이를 등록합니다.
- 백엔드 `id`는 모델 참조의 제공자 접두사가 됩니다.
- `agents.defaults.cliBackends.<id>`의 사용자 설정은 여전히 Plugin 기본값을 재정의합니다.
- 백엔드별 설정 정리는 선택적
  `normalizeConfig` 훅을 통해 Plugin 소유로 유지됩니다.

작은 프롬프트/메시지 호환성 시임이 필요한 Plugin은 제공자나 CLI 백엔드를 교체하지 않고
양방향 텍스트 변환을 선언할 수 있습니다.

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input`은 CLI에 전달되는 시스템 프롬프트와 사용자 프롬프트를 다시 작성합니다. `output`은
OpenClaw가 자체 제어 마커와 채널 전달을 처리하기 전에 스트리밍된 어시스턴트 델타와 파싱된 최종 텍스트를
다시 작성합니다.

Claude Code stream-json 호환 JSONL을 내보내는 CLI의 경우 해당 백엔드 설정에
`jsonlDialect: "claude-stream-json"`을 설정하세요.

## 번들 MCP 오버레이

CLI 백엔드는 OpenClaw 도구 호출을 직접 받지 않지만, 백엔드는
`bundleMcp: true`로 생성된 MCP 설정 오버레이를 사용할 수 있습니다.

현재 번들 동작:

- `claude-cli`: 생성된 엄격한 MCP 설정 파일
- `codex-cli`: `mcp_servers`에 대한 인라인 설정 재정의; 생성된
  OpenClaw loopback 서버는 Codex의 서버별 도구 승인 모드로 표시되어
  MCP 호출이 로컬 승인 프롬프트에서 멈추지 않도록 합니다
- `google-gemini-cli`: 생성된 Gemini 시스템 설정 파일

번들 MCP가 활성화되면 OpenClaw는 다음을 수행합니다.

- CLI 프로세스에 Gateway 도구를 노출하는 loopback HTTP MCP 서버를 생성합니다
- 세션별 토큰(`OPENCLAW_MCP_TOKEN`)으로 브리지를 인증합니다
- 도구 접근 범위를 현재 세션, 계정, 채널 컨텍스트로 제한합니다
- 현재 작업 영역에 대해 활성화된 번들 MCP 서버를 로드합니다
- 기존 백엔드 MCP 설정/세팅 형태와 병합합니다
- 소유 extension의 백엔드 소유 통합 모드를 사용해 실행 설정을 다시 작성합니다

활성화된 MCP 서버가 없더라도, 백엔드가 번들 MCP를 선택하면 OpenClaw는
백그라운드 실행이 격리된 상태로 유지되도록 엄격한 설정을 계속 주입합니다.

세션 범위 번들 MCP 런타임은 세션 내 재사용을 위해 캐시된 뒤,
유휴 시간이 `mcp.sessionIdleTtlMs` 밀리초 지나면 정리됩니다(기본값 10분,
비활성화하려면 `0` 설정). 인증 프로브, 슬러그 생성, Active Memory 회상 요청 같은 일회성 임베디드 실행은 실행 종료 시 정리되어 stdio
자식 프로세스와 Streamable HTTP/SSE 스트림이 실행보다 오래 살아남지 않도록 합니다.

## 제한 사항

- **직접 OpenClaw 도구 호출 없음.** OpenClaw는 CLI 백엔드 프로토콜에
  도구 호출을 주입하지 않습니다. 백엔드는 `bundleMcp: true`를 선택한 경우에만
  Gateway 도구를 봅니다.
- **스트리밍은 백엔드별로 다릅니다.** 일부 백엔드는 JSONL을 스트리밍하고, 다른 백엔드는
  종료될 때까지 버퍼링합니다.
- **구조화된 출력**은 CLI의 JSON 형식에 따라 달라집니다.
- **Codex CLI 세션**은 텍스트 출력으로 재개됩니다(JSONL 아님). 이는 초기 `--json` 실행보다
  구조가 덜 명확합니다. OpenClaw 세션은 여전히
  정상적으로 작동합니다.

## 문제 해결

- **CLI를 찾을 수 없음**: `command`를 전체 경로로 설정하세요.
- **잘못된 모델 이름**: `provider/model`을 CLI 모델에 매핑하려면 `modelAliases`를 사용하세요.
- **세션 연속성 없음**: `sessionArg`가 설정되어 있고 `sessionMode`가
  `none`이 아닌지 확인하세요(Codex CLI는 현재 JSON 출력으로 재개할 수 없음).
- **이미지가 무시됨**: `imageArg`를 설정하세요(그리고 CLI가 파일 경로를 지원하는지 확인하세요).

## 관련 항목

- [Gateway 실행 지침서](/ko/gateway)
- [로컬 모델](/ko/gateway/local-models)
