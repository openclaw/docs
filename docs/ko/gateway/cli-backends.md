---
read_when:
    - API 제공자가 실패할 때를 대비해 신뢰할 수 있는 폴백이 필요합니다
    - Codex CLI 또는 다른 로컬 AI CLI를 실행 중이며 이를 재사용하고 싶습니다
    - CLI 백엔드 도구 액세스를 위한 MCP 루프백 브리지를 이해하고 싶습니다
summary: 'CLI 백엔드: 선택적 MCP 도구 브리지를 포함한 로컬 AI CLI 폴백'
title: CLI 백엔드
x-i18n:
    generated_at: "2026-04-11T02:44:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d108dbea043c260a80d15497639298f71a6b4d800f68d7b39bc129f7667ca608
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI 백엔드(폴백 런타임)

OpenClaw는 API 제공자가 다운되었거나, 속도 제한에 걸렸거나, 일시적으로 오작동할 때 **텍스트 전용 폴백**으로 **로컬 AI CLI**를 실행할 수 있습니다.
이 동작은 의도적으로 보수적으로 설계되었습니다.

- **OpenClaw 도구는 직접 주입되지 않지만**, `bundleMcp: true`인 백엔드는 루프백 MCP 브리지를 통해 게이트웨이 도구를 받을 수 있습니다.
- 이를 지원하는 CLI를 위한 **JSONL 스트리밍**
- **세션 지원**(후속 턴의 일관성 유지)
- CLI가 이미지 경로를 받아들일 수 있다면 **이미지 전달 가능**

이 기능은 기본 경로라기보다 **안전망**으로 설계되었습니다. 외부 API에 의존하지 않으면서도 “항상 동작하는” 텍스트 응답이 필요할 때 사용하세요.

ACP 세션 제어, 백그라운드 작업, 스레드/대화 바인딩, 영속적인 외부 코딩 세션을 포함한 전체 하니스 런타임이 필요하다면
[ACP Agents](/ko/tools/acp-agents)를 사용하세요. CLI 백엔드는 ACP가 아닙니다.

## 초보자를 위한 빠른 시작

Codex CLI는 **설정 없이도** 사용할 수 있습니다(번들된 OpenAI 플러그인이 기본 백엔드를 등록합니다).

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

게이트웨이가 launchd/systemd 아래에서 실행되고 PATH가 최소화되어 있다면,
명령 경로만 추가하면 됩니다.

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

이게 전부입니다. CLI 자체 외에는 키도, 추가 인증 설정도 필요하지 않습니다.

번들된 CLI 백엔드를 게이트웨이 호스트에서 **기본 메시지 제공자**로 사용하는 경우, OpenClaw는 이제
구성에서 모델 ref 또는
`agents.defaults.cliBackends` 아래에서 해당 백엔드를 명시적으로 참조하면
해당 번들 플러그인을 자동으로 로드합니다.

## 폴백으로 사용하기

CLI 백엔드를 폴백 목록에 추가하면 기본 모델이 실패할 때만 실행됩니다.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

참고:

- `agents.defaults.models`(허용 목록)를 사용하는 경우, CLI 백엔드 모델도 여기에 포함해야 합니다.
- 기본 제공자가 실패하면(인증, 속도 제한, 타임아웃), OpenClaw는
  다음으로 CLI 백엔드를 시도합니다.

## 구성 개요

모든 CLI 백엔드는 다음 아래에 있습니다.

```
agents.defaults.cliBackends
```

각 항목은 **provider id**(예: `codex-cli`, `my-cli`)를 키로 사용합니다.
provider id는 모델 ref의 왼쪽 부분이 됩니다.

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

1. provider 접두사(`codex-cli/...`)를 기준으로 **백엔드를 선택**합니다.
2. 동일한 OpenClaw 프롬프트 + 작업공간 컨텍스트를 사용해 **시스템 프롬프트를 구성**합니다.
3. 기록의 일관성을 유지하기 위해 세션 id(지원되는 경우)와 함께 **CLI를 실행**합니다.
4. **출력을 파싱**(JSON 또는 일반 텍스트)하고 최종 텍스트를 반환합니다.
5. 백엔드별로 **세션 id를 저장**하여 후속 요청에서 동일한 CLI 세션을 재사용합니다.

<Note>
번들된 Anthropic `claude-cli` 백엔드가 다시 지원됩니다. Anthropic 직원이
OpenClaw 스타일 Claude CLI 사용이 다시 허용된다고 알려주었으므로, Anthropic이
새 정책을 발표하지 않는 한 OpenClaw는 이 통합에 대해
`claude -p` 사용을 허용된 것으로 간주합니다.
</Note>

번들된 OpenAI `codex-cli` 백엔드는 OpenClaw의 시스템 프롬프트를
Codex의 `model_instructions_file` 구성 오버라이드(`-c
model_instructions_file="..."`)를 통해 전달합니다. Codex는 Claude 스타일의
`--append-system-prompt` 플래그를 제공하지 않으므로, OpenClaw는 새 Codex CLI 세션마다
조합된 프롬프트를 임시 파일에 씁니다.

번들된 Anthropic `claude-cli` 백엔드는 OpenClaw Skills 스냅샷을
두 가지 방식으로 받습니다. 하나는 추가된 시스템 프롬프트 안의 간결한 OpenClaw Skills 카탈로그이고,
다른 하나는 `--plugin-dir`로 전달되는 임시 Claude Code 플러그인입니다.
이 플러그인에는 해당 에이전트/세션에 적합한 Skills만 포함되므로, Claude Code의 네이티브 스킬
해결기는 OpenClaw가 프롬프트에서 알렸을 것과 동일하게 필터링된 집합을 보게 됩니다.
Skill env/API 키 오버라이드는 여전히 실행 시 OpenClaw가 자식 프로세스 환경에 적용합니다.

## 세션

- CLI가 세션을 지원하는 경우, `sessionArg`(예: `--session-id`) 또는
  id를 여러 플래그에 삽입해야 할 때 `sessionArgs`(플레이스홀더 `{sessionId}`)를 설정하세요.
- CLI가 다른 플래그를 가진 **resume 하위 명령**을 사용하는 경우,
  `resumeArgs`(`args`를 대체)를 설정하고 필요하면 `resumeOutput`
  (JSON이 아닌 재개용 출력)도 설정하세요.
- `sessionMode`:
  - `always`: 항상 세션 id를 보냅니다(저장된 값이 없으면 새 UUID).
  - `existing`: 이전에 저장된 세션 id가 있을 때만 보냅니다.
  - `none`: 세션 id를 절대 보내지 않습니다.

직렬화 관련 참고:

- `serialize: true`는 동일 레인 실행의 순서를 유지합니다.
- 대부분의 CLI는 하나의 provider 레인에서 직렬화됩니다.
- OpenClaw는 백엔드 인증 상태가 변경되면 저장된 CLI 세션 재사용을 해제합니다. 여기에는 재로그인, 토큰 교체, 인증 프로필 자격 증명 변경이 포함됩니다.

## 이미지(패스스루)

CLI가 이미지 경로를 받아들일 수 있다면 `imageArg`를 설정하세요.

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw는 base64 이미지를 임시 파일로 씁니다. `imageArg`가 설정되어 있으면 해당
경로가 CLI 인수로 전달됩니다. `imageArg`가 없으면 OpenClaw는 파일 경로를 프롬프트에 추가합니다(경로 주입). 이는
일반 경로에서 로컬 파일을 자동으로 로드하는 CLI에는 충분합니다.

## 입력 / 출력

- `output: "json"`(기본값)은 JSON을 파싱해 텍스트와 세션 id를 추출하려고 시도합니다.
- Gemini CLI JSON 출력의 경우, `usage`가 없거나 비어 있으면 OpenClaw는
  `response`에서 응답 텍스트를, `stats`에서 사용량을 읽습니다.
- `output: "jsonl"`은 JSONL 스트림(예: Codex CLI `--json`)을 파싱하고, 존재할 경우 최종 에이전트 메시지와 세션
  식별자를 추출합니다.
- `output: "text"`는 stdout을 최종 응답으로 취급합니다.

입력 모드:

- `input: "arg"`(기본값)는 프롬프트를 마지막 CLI 인수로 전달합니다.
- `input: "stdin"`은 프롬프트를 stdin으로 보냅니다.
- 프롬프트가 매우 길고 `maxPromptArgChars`가 설정되어 있으면 stdin이 사용됩니다.

## 기본값(플러그인 소유)

번들된 OpenAI 플러그인은 `codex-cli`에 대한 기본값도 등록합니다.

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

번들된 Google 플러그인은 `google-gemini-cli`에 대한 기본값도 등록합니다.

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

사전 요구 사항: 로컬 Gemini CLI가 설치되어 있어야 하며
`PATH`에서 `gemini`로 사용할 수 있어야 합니다(`brew install gemini-cli` 또는
`npm install -g @google/gemini-cli`).

Gemini CLI JSON 참고:

- 응답 텍스트는 JSON `response` 필드에서 읽습니다.
- 사용량은 `usage`가 없거나 비어 있으면 `stats`를 대체값으로 사용합니다.
- `stats.cached`는 OpenClaw `cacheRead`로 정규화됩니다.
- `stats.input`이 없으면 OpenClaw는
  `stats.input_tokens - stats.cached`에서 입력 토큰 수를 계산합니다.

필요한 경우에만 재정의하세요(일반적으로는 절대 `command` 경로).

## 플러그인 소유 기본값

CLI 백엔드 기본값은 이제 플러그인 표면의 일부입니다.

- 플러그인은 `api.registerCliBackend(...)`로 이를 등록합니다.
- 백엔드 `id`는 모델 ref에서 provider 접두사가 됩니다.
- `agents.defaults.cliBackends.<id>`의 사용자 구성은 여전히 플러그인 기본값을 재정의합니다.
- 백엔드별 구성 정리는 선택적
  `normalizeConfig` 훅을 통해 계속 플러그인 소유로 유지됩니다.

작은 프롬프트/메시지 호환성 shim이 필요한 플러그인은 provider나 CLI 백엔드를 교체하지 않고도
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

`input`은 CLI에 전달되는 시스템 프롬프트와 사용자 프롬프트를 다시 씁니다. `output`은
OpenClaw가 자체 제어 마커 및 채널 전달을 처리하기 전에
스트리밍된 어시스턴트 델타와 파싱된 최종 텍스트를 다시 씁니다.

Claude Code stream-json 호환 JSONL을 출력하는 CLI의 경우,
해당 백엔드 구성에 `jsonlDialect: "claude-stream-json"`을 설정하세요.

## 번들 MCP 오버레이

CLI 백엔드는 OpenClaw 도구 호출을 **직접** 받지 않지만, 백엔드는
`bundleMcp: true`로 생성된 MCP 구성 오버레이를 선택적으로 사용할 수 있습니다.

현재 번들 동작:

- `claude-cli`: 생성된 strict MCP 구성 파일
- `codex-cli`: `mcp_servers`용 인라인 구성 오버라이드
- `google-gemini-cli`: 생성된 Gemini 시스템 설정 파일

bundle MCP가 활성화되면 OpenClaw는 다음을 수행합니다.

- CLI 프로세스에 게이트웨이 도구를 노출하는 루프백 HTTP MCP 서버를 시작합니다.
- 세션별 토큰(`OPENCLAW_MCP_TOKEN`)으로 브리지를 인증합니다.
- 현재 세션, 계정, 채널 컨텍스트로 도구 액세스 범위를 제한합니다.
- 현재 작업공간에 대해 활성화된 bundle-MCP 서버를 로드합니다.
- 기존 백엔드 MCP 구성/설정 형태와 병합합니다.
- 소유 확장의 백엔드 소유 통합 모드를 사용해 실행 구성을 다시 씁니다.

활성화된 MCP 서버가 없더라도, 백엔드가 bundle MCP를 선택한 경우
백그라운드 실행이 격리된 상태를 유지하도록 OpenClaw는 여전히 strict 구성을 주입합니다.

## 제한 사항

- **직접적인 OpenClaw 도구 호출은 없습니다.** OpenClaw는 CLI 백엔드 프로토콜에
  도구 호출을 주입하지 않습니다. 백엔드는 `bundleMcp: true`를 선택한 경우에만
  게이트웨이 도구를 볼 수 있습니다.
- **스트리밍은 백엔드별입니다.** 일부 백엔드는 JSONL을 스트리밍하고, 다른 백엔드는
  종료될 때까지 버퍼링합니다.
- **구조화된 출력**은 CLI의 JSON 형식에 따라 달라집니다.
- **Codex CLI 세션**은 텍스트 출력으로 재개됩니다(JSONL 없음). 따라서 구조화 수준이
  초기 `--json` 실행보다 낮습니다. OpenClaw 세션 자체는 여전히 정상적으로 동작합니다.

## 문제 해결

- **CLI를 찾을 수 없음**: `command`를 전체 경로로 설정하세요.
- **잘못된 모델 이름**: `modelAliases`를 사용해 `provider/model` → CLI 모델로 매핑하세요.
- **세션 연속성 없음**: `sessionArg`가 설정되어 있고 `sessionMode`가
  `none`이 아닌지 확인하세요(Codex CLI는 현재 JSON 출력으로 재개할 수 없습니다).
- **이미지가 무시됨**: `imageArg`를 설정하고(CLI가 파일 경로를 지원하는지도 확인하세요).
