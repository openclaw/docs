---
read_when:
    - API 제공업체가 실패할 때 안정적인 대체 수단이 필요합니다
    - Codex CLI 또는 다른 로컬 AI CLI를 실행 중이며 이를 재사용하려는 경우
    - CLI 백엔드 도구 접근을 위한 MCP 루프백 브리지를 이해하려는 경우
summary: 'CLI 백엔드: 선택적 MCP 도구 브리지를 지원하는 로컬 AI CLI 폴백'
title: CLI 백엔드
x-i18n:
    generated_at: "2026-05-10T19:34:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw는 API providers가 중단되었거나, 속도 제한에 걸렸거나, 일시적으로 오동작할 때 **local AI CLI**를 **텍스트 전용 fallback**으로 실행할 수 있습니다. 이는 의도적으로 보수적인 방식입니다.

- **OpenClaw 도구는 직접 주입되지 않지만**, `bundleMcp: true`인 백엔드는 loopback MCP 브리지를 통해 gateway 도구를 받을 수 있습니다.
- 이를 지원하는 CLI를 위한 **JSONL streaming**.
- **Sessions are supported**됩니다(따라서 후속 턴이 일관성을 유지합니다).
- CLI가 이미지 경로를 허용하는 경우 **Images can be passed through**됩니다.

이는 기본 경로가 아니라 **안전망**으로 설계되었습니다. 외부 API에 의존하지 않고
"항상 작동하는" 텍스트 응답을 원할 때 사용하세요.

ACP session controls, background tasks,
thread/conversation binding, 영구 외부 coding sessions를 갖춘 전체 harness runtime을 원한다면
대신 [ACP Agents](/ko/tools/acp-agents)를 사용하세요. CLI 백엔드는 ACP가 아닙니다.

<Tip>
  새 backend Plugin을 빌드하나요? 
  [CLI backend plugins](/ko/plugins/cli-backend-plugins)를 사용하세요. 이 페이지는 이미 등록된 백엔드를
  구성하고 운영하는 사용자를 위한 것입니다.
</Tip>

## 초보자 친화적 빠른 시작

Codex CLI는 **어떤 config도 없이** 사용할 수 있습니다(번들 OpenAI Plugin이
기본 백엔드를 등록합니다).

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway가 launchd/systemd 아래에서 실행되고 PATH가 최소화되어 있다면, command 경로만 추가하세요.

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

이것으로 충분합니다. CLI 자체 외에는 키나 추가 auth config가 필요 없습니다.

번들 CLI 백엔드를 Gateway 호스트의 **기본 message provider**로 사용하는 경우,
이제 config가 model ref나 `agents.defaults.cliBackends` 아래에서 해당 백엔드를 명시적으로 참조하면
OpenClaw가 소유 번들 Plugin을 자동으로 로드합니다.

## fallback으로 사용하기

기본 모델이 실패할 때만 실행되도록 fallback 목록에 CLI 백엔드를 추가하세요.

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

- `agents.defaults.models`(allowlist)를 사용하는 경우, CLI 백엔드 모델도 거기에 포함해야 합니다.
- 기본 provider가 실패하면(auth, rate limits, timeouts), OpenClaw는
  다음으로 CLI 백엔드를 시도합니다.

## 구성 개요

모든 CLI 백엔드는 다음 아래에 있습니다.

```
agents.defaults.cliBackends
```

각 항목은 **provider id**(예: `codex-cli`, `my-cli`)를 키로 사용합니다.
provider id는 model ref의 왼쪽 부분이 됩니다.

```
<provider>/<model>
```

### 예시 구성

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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## 작동 방식

1. provider prefix(`codex-cli/...`)를 기준으로 **백엔드를 선택**합니다.
2. 동일한 OpenClaw prompt + workspace context를 사용해 **system prompt를 빌드**합니다.
3. 지원되는 경우 session id로 **CLI를 실행**하여 기록이 일관되게 유지되도록 합니다.
   번들 `claude-cli` 백엔드는 OpenClaw session마다 Claude stdio 프로세스를 살려 두고
   후속 턴을 stream-json stdin으로 보냅니다.
4. **출력을 파싱**(JSON 또는 일반 텍스트)하고 최종 텍스트를 반환합니다.
5. 백엔드별로 **session ids를 영속화**하여 후속 턴이 같은 CLI session을 재사용하도록 합니다.

<Note>
번들 Anthropic `claude-cli` 백엔드가 다시 지원됩니다. Anthropic 직원이
OpenClaw 방식의 Claude CLI 사용이 다시 허용된다고 알려주었으므로, Anthropic이
새 정책을 게시하지 않는 한 OpenClaw는 이 integration에 대해 `claude -p` 사용을
승인된 것으로 취급합니다.
</Note>

번들 OpenAI `codex-cli` 백엔드는 Codex의 `model_instructions_file` config override(`-c
model_instructions_file="..."`)를 통해 OpenClaw의 system prompt를 전달합니다. Codex는 Claude 방식의
`--append-system-prompt` flag를 노출하지 않으므로, OpenClaw는 새 Codex CLI session마다 조립된 prompt를
임시 파일에 씁니다.

번들 Anthropic `claude-cli` 백엔드는 두 가지 방식으로 OpenClaw skills snapshot을 받습니다.
추가된 system prompt의 compact OpenClaw skills catalog와 `--plugin-dir`로 전달되는
임시 Claude Code Plugin입니다. 이 Plugin에는 해당 agent/session에 적합한 Skills만 포함되므로,
Claude Code의 native skill resolver는 OpenClaw가 prompt에서 광고했을 것과 같은 필터링된 집합을 봅니다.
Skill env/API key overrides는 여전히 OpenClaw가 실행을 위해 child process environment에 적용합니다.

Claude CLI에는 자체 noninteractive permission mode도 있습니다. OpenClaw는 Claude 전용 config를 추가하는 대신
이를 기존 exec policy에 매핑합니다. 유효하게 요청된 exec policy가 YOLO(`tools.exec.security: "full"` 및
`tools.exec.ask: "off"`)이면 OpenClaw는 `--permission-mode bypassPermissions`를 추가합니다.
agent별 `agents.list[].tools.exec` 설정은 해당 agent에 대해 전역 `tools.exec`를 재정의합니다.
다른 Claude mode를 강제하려면 `agents.defaults.cliBackends.claude-cli.args` 및 일치하는 `resumeArgs` 아래에
`--permission-mode default` 또는 `--permission-mode acceptEdits` 같은 명시적 raw backend args를 설정하세요.

번들 Anthropic `claude-cli` 백엔드는 또한 OpenClaw `/think` levels를 non-off levels에 대해
Claude Code의 native `--effort` flag에 매핑합니다. `minimal` 및
`low`는 `low`에, `adaptive` 및 `medium`은 `medium`에 매핑되며, `high`,
`xhigh`, `max`는 직접 매핑됩니다. 다른 CLI 백엔드는 `/think`가 spawned CLI에 영향을 주기 전에
소유 Plugin이 동등한 argv mapper를 선언해야 합니다.

OpenClaw가 번들 `claude-cli` 백엔드를 사용하려면, Claude Code 자체가
동일한 호스트에서 이미 로그인되어 있어야 합니다.

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`claude` binary가 이미 `PATH`에 없을 때만 `agents.defaults.cliBackends.claude-cli.command`를 사용하세요.

## Sessions

- CLI가 sessions를 지원하면 ID를 여러 flags에 삽입해야 할 때 `sessionArg`(예: `--session-id`) 또는
  `sessionArgs`(placeholder `{sessionId}`)를 설정하세요.
- CLI가 다른 flags를 가진 **resume subcommand**를 사용하는 경우,
  `resumeArgs`(resuming 시 `args` 대체)와 선택적으로 `resumeOutput`
  (non-JSON resumes용)을 설정하세요.
- `sessionMode`:
  - `always`: 항상 session id를 보냅니다(저장된 것이 없으면 새 UUID).
  - `existing`: 이전에 저장된 session id가 있을 때만 보냅니다.
  - `none`: session id를 절대 보내지 않습니다.
- `claude-cli`는 기본적으로 `liveSession: "claude-stdio"`, `output: "jsonl"`,
  `input: "stdin"`을 사용하므로 후속 턴은 활성 상태인 동안 live Claude process를 재사용합니다.
  Warm stdio는 이제 transport fields를 생략한 custom configs를 포함해 기본값입니다.
  Gateway가 재시작되거나 idle process가 종료되면, OpenClaw는 저장된 Claude session id에서 resume합니다.
  저장된 session ids는 resume 전에 기존 readable project transcript와 대조해 검증되므로,
  phantom bindings는 `--resume` 아래에서 조용히 새 Claude CLI session을 시작하는 대신
  `reason=transcript-missing`으로 지워집니다.
- Claude live sessions는 제한된 JSONL output guards를 유지합니다. 기본값은 턴당
  최대 8 MiB 및 20,000 raw JSONL lines를 허용합니다. Tool-heavy Claude turns는 백엔드별로
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  및 `maxTurnLines`로 이를 늘릴 수 있습니다. OpenClaw는 해당 설정을 64 MiB 및 100,000
  lines로 제한합니다.
- 저장된 CLI sessions는 provider-owned continuity입니다. 암시적 daily session reset은
  이를 끊지 않습니다. `/reset` 및 명시적 `session.reset` policies는 여전히 끊습니다.
- Fresh CLI sessions는 일반적으로 OpenClaw의 compaction summary와 post-compaction tail에서만 reseed합니다.
  Compaction 전에 invalidated된 짧은 sessions를 복구하려면, 백엔드가
  `reseedFromRawTranscriptWhenUncompacted: true`로 opt in할 수 있습니다. OpenClaw는 raw
  transcript reseed를 여전히 bounded로 유지하고, missing CLI transcripts, system-prompt/MCP changes,
  session-expired retry 같은 safe invalidations로 제한합니다. auth profile 또는 credential-epoch changes는
  raw transcript history를 절대 reseed하지 않습니다.

직렬화 참고:

- `serialize: true`는 같은 lane의 실행 순서를 유지합니다.
- 대부분의 CLI는 하나의 provider lane에서 serialize합니다.
- OpenClaw는 선택된 auth identity가 변경되면 저장된 CLI session reuse를 중단합니다.
  여기에는 CLI가 노출하는 경우 변경된 auth profile id, static API key, static token, OAuth
  account identity가 포함됩니다. OAuth access 및 refresh token rotation은 저장된 CLI session을 끊지 않습니다.
  CLI가 stable OAuth account id를 노출하지 않으면, OpenClaw는 해당 CLI가 resume permissions를 강제하도록 둡니다.

## claude-cli sessions의 fallback prelude

`claude-cli` 시도가 [`agents.defaults.model.fallbacks`](/ko/concepts/model-failover)의 non-CLI 후보로 fail over되면,
OpenClaw는 `~/.claude/projects/`의 Claude Code local JSONL transcript에서 수집한 context prelude로
다음 시도를 seed합니다. 이 seed가 없으면 `claude-cli` 실행에 대해 OpenClaw 자체 session transcript가 비어 있으므로
fallback provider는 cold start하게 됩니다.

- prelude는 최신 `/compact` summary 또는 `compact_boundary` marker를 우선 사용한 다음,
  char budget까지 가장 최근 post-boundary turns를 추가합니다. summary가 이미 이를 대표하므로
  pre-boundary turns는 삭제됩니다.
- Tool blocks는 prompt budget을 정직하게 유지하기 위해 compact `(tool call: name)` 및
  `(tool result: …)` hints로 병합됩니다. summary가 넘치면 `(truncated)`로 표시됩니다.
- 같은 provider의 `claude-cli`에서 `claude-cli`로 fallback하는 경우 Claude 자체
  `--resume`에 의존하고 prelude를 건너뜁니다.
- seed는 기존 Claude session-file path validation을 재사용하므로,
  임의 경로를 읽을 수 없습니다.

## Images (pass-through)

CLI가 이미지 경로를 허용하면 `imageArg`를 설정하세요.

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 base64 images를 temp files에 씁니다. `imageArg`가 설정되어 있으면 해당
paths가 CLI args로 전달됩니다. `imageArg`가 없으면 OpenClaw는 파일 경로를
prompt에 추가합니다(path injection). 이는 plain paths에서 local files를 자동 로드하는 CLI에는 충분합니다.

## Inputs / outputs

- `output: "json"`(기본값)은 JSON을 파싱하고 text + session id를 추출하려고 시도합니다.
- Gemini CLI JSON output의 경우, OpenClaw는 `usage`가 없거나 비어 있으면 `response`에서 reply text를,
  `stats`에서 usage를 읽습니다.
- `output: "jsonl"`은 JSONL streams(예: Codex CLI `--json`)를 파싱하고, 존재하는 경우 최종 agent message와 session
  identifiers를 추출합니다.
- `output: "text"`는 stdout을 최종 응답으로 취급합니다.

Input modes:

- `input: "arg"`(기본값)는 prompt를 마지막 CLI arg로 전달합니다.
- `input: "stdin"`은 prompt를 stdin으로 보냅니다.
- prompt가 매우 길고 `maxPromptArgChars`가 설정되어 있으면 stdin이 사용됩니다.

## Defaults (plugin-owned)

번들 OpenAI Plugin은 `codex-cli`의 기본값도 등록합니다:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

번들 Google Plugin은 `google-gemini-cli`에 대한 기본값도 등록합니다.

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

전제 조건: 로컬 Gemini CLI가 설치되어 있어야 하며 `PATH`에서
`gemini`로 사용할 수 있어야 합니다(`brew install gemini-cli` 또는
`npm install -g @google/gemini-cli`).

Gemini CLI JSON 참고 사항:

- 응답 텍스트는 JSON `response` 필드에서 읽습니다.
- `usage`가 없거나 비어 있으면 사용량은 `stats`로 대체됩니다.
- `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
- `stats.input`이 없으면 OpenClaw는 입력 토큰을
  `stats.input_tokens - stats.cached`에서 파생합니다.

필요한 경우에만 재정의하세요(일반적인 경우: 절대 `command` 경로).

## Plugin 소유 기본값

CLI 백엔드 기본값은 이제 Plugin 표면의 일부입니다.

- Plugin은 `api.registerCliBackend(...)`로 이를 등록합니다.
- 백엔드 `id`는 모델 참조에서 제공자 접두사가 됩니다.
- `agents.defaults.cliBackends.<id>`의 사용자 설정은 여전히 Plugin 기본값을 재정의합니다.
- 백엔드별 설정 정리는 선택적 `normalizeConfig` 훅을 통해 Plugin 소유로 유지됩니다.

작은 프롬프트/메시지 호환성 shim이 필요한 Plugin은 제공자나 CLI 백엔드를
교체하지 않고 양방향 텍스트 변환을 선언할 수 있습니다.

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

`input`은 CLI에 전달되는 시스템 프롬프트와 사용자 프롬프트를 다시 씁니다. `output`은
OpenClaw가 자체 제어 마커와 채널 전달을 처리하기 전에 스트리밍된 어시스턴트 델타와
파싱된 최종 텍스트를 다시 씁니다.

Claude Code stream-json 호환 JSONL을 내보내는 CLI의 경우 해당 백엔드 설정에
`jsonlDialect: "claude-stream-json"`을 설정하세요.

## 번들 MCP 오버레이

CLI 백엔드는 OpenClaw 도구 호출을 직접 받지 않지만, 백엔드는
`bundleMcp: true`로 생성된 MCP 설정 오버레이를 선택할 수 있습니다.

현재 번들 동작:

- `claude-cli`: 생성된 엄격한 MCP 설정 파일
- `codex-cli`: `mcp_servers`에 대한 인라인 설정 재정의; 생성된
  OpenClaw loopback 서버는 Codex의 서버별 도구 승인 모드로 표시되어
  MCP 호출이 로컬 승인 프롬프트에서 중단되지 않도록 합니다
- `google-gemini-cli`: 생성된 Gemini 시스템 설정 파일

번들 MCP가 활성화되면 OpenClaw는 다음을 수행합니다.

- Gateway 도구를 CLI 프로세스에 노출하는 loopback HTTP MCP 서버 생성
- 세션별 토큰(`OPENCLAW_MCP_TOKEN`)으로 브리지 인증
- 도구 접근 범위를 현재 세션, 계정, 채널 컨텍스트로 제한
- 현재 작업공간에 대해 활성화된 bundle-MCP 서버 로드
- 기존 백엔드 MCP 설정/설정 형태와 병합
- 소유 extension의 백엔드 소유 통합 모드를 사용하여 실행 설정 재작성

활성화된 MCP 서버가 없더라도, 백엔드가 번들 MCP를 선택하면 OpenClaw는
백그라운드 실행이 격리된 상태를 유지하도록 엄격한 설정을 계속 주입합니다.

세션 범위 번들 MCP 런타임은 세션 내 재사용을 위해 캐시된 다음,
유휴 시간이 `mcp.sessionIdleTtlMs`밀리초에 도달하면 회수됩니다(기본값 10분,
비활성화하려면 `0`으로 설정). 인증 프로브, 슬러그 생성, active-memory recall 요청과 같은
일회성 임베디드 실행은 실행 종료 시 정리되어 stdio 자식 프로세스와 Streamable HTTP/SSE
스트림이 실행보다 오래 지속되지 않도록 합니다.

## 제한 사항

- **직접 OpenClaw 도구 호출 없음.** OpenClaw는 도구 호출을
  CLI 백엔드 프로토콜에 주입하지 않습니다. 백엔드는
  `bundleMcp: true`를 선택한 경우에만 Gateway 도구를 볼 수 있습니다.
- **스트리밍은 백엔드별로 다릅니다.** 일부 백엔드는 JSONL을 스트리밍하고, 다른 백엔드는
  종료될 때까지 버퍼링합니다.
- **구조화된 출력**은 CLI의 JSON 형식에 따라 달라집니다.
- **Codex CLI 세션**은 텍스트 출력(JSONL 아님)을 통해 재개되며, 이는 초기 `--json` 실행보다
  구조화가 덜 되어 있습니다. OpenClaw 세션은 여전히 정상적으로 작동합니다.

## 문제 해결

- **CLI를 찾을 수 없음**: `command`를 전체 경로로 설정하세요.
- **잘못된 모델 이름**: `modelAliases`를 사용하여 `provider/model` → CLI 모델로 매핑하세요.
- **세션 연속성 없음**: `sessionArg`가 설정되어 있고 `sessionMode`가
  `none`이 아닌지 확인하세요(Codex CLI는 현재 JSON 출력으로 재개할 수 없습니다).
- **이미지가 무시됨**: `imageArg`를 설정하세요(그리고 CLI가 파일 경로를 지원하는지 확인하세요).

## 관련 항목

- [Gateway 런북](/ko/gateway)
- [로컬 모델](/ko/gateway/local-models)
