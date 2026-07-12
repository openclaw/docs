---
read_when:
    - 로컬 AI CLI 백엔드 Plugin을 구축하고 있습니다
    - acme-cli/model과 같은 모델 참조용 백엔드를 등록하려는 경우
    - 서드파티 CLI를 OpenClaw의 텍스트 대체 실행기에 매핑해야 합니다
sidebarTitle: CLI backend plugins
summary: 로컬 AI CLI 백엔드를 등록하는 플러그인 빌드하기
title: CLI 백엔드 Plugin 구축하기
x-i18n:
    generated_at: "2026-07-12T00:55:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6448cdac02a03e5fdf0d802a54189998d97c08769b1b85c8d9963301fa2c5b79
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI 백엔드 Plugin을 사용하면 OpenClaw가 로컬 AI CLI를 텍스트 추론
백엔드로 호출할 수 있습니다. 백엔드는 모델 참조에서 제공자 접두사로 표시됩니다.

```text
acme-cli/acme-large
```

업스트림 통합이 이미 로컬 명령으로 제공되거나, CLI가 로컬 로그인 상태를
소유하거나, API 제공자를 사용할 수 없을 때 대체 수단이 필요한 경우 CLI 백엔드를
사용하세요.

<Info>
  업스트림 서비스가 일반적인 HTTP 모델 API를 제공한다면 대신
  [제공자 Plugin](/ko/plugins/sdk-provider-plugins)을 작성하세요. 업스트림
  런타임이 완전한 에이전트 세션, 도구 이벤트, Compaction 또는 백그라운드
  작업 상태를 소유한다면 [에이전트 하네스](/ko/plugins/sdk-agent-harness)를 사용하세요.
</Info>

## Plugin이 소유하는 항목

CLI 백엔드 Plugin에는 세 가지 계약이 있습니다.

| 계약                 | 파일                   | 목적                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 패키지 진입점        | `package.json`         | OpenClaw가 Plugin 런타임 모듈을 가리키도록 함             |
| 매니페스트 소유권    | `openclaw.plugin.json` | 런타임이 로드되기 전에 백엔드 ID를 선언                   |
| 런타임 등록          | `index.ts`             | 명령 기본값과 함께 `api.registerCliBackend(...)`를 호출   |

매니페스트는 검색 메타데이터이며 CLI를 실행하거나 런타임 동작을 등록하지
않습니다. 런타임 동작은 Plugin 진입점이 `api.registerCliBackend(...)`를
호출할 때 시작됩니다.

## 최소 백엔드 Plugin

<Steps>
  <Step title="패키지 메타데이터 생성">
    ```json package.json
    {
      "name": "@acme/openclaw-acme-cli",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      },
      "dependencies": {
        "openclaw": "^2026.3.24"
      },
      "devDependencies": {
        "typescript": "^5.9.0"
      }
    }
    ```

    게시된 패키지에는 빌드된 JavaScript 런타임 파일이 포함되어야 합니다. 소스
    진입점이 `./src/index.ts`라면 빌드된 JavaScript 대응 파일을 가리키는
    `openclaw.runtimeExtensions`를 추가하세요. [진입점](/ko/plugins/sdk-entrypoints)을
    참조하세요.

  </Step>

  <Step title="백엔드 소유권 선언">
    ```json openclaw.plugin.json
    {
      "id": "acme-cli",
      "name": "Acme CLI",
      "description": "Run Acme's local AI CLI through OpenClaw",
      "cliBackends": ["acme-cli"],
      "setup": {
        "cliBackends": ["acme-cli"],
        "requiresRuntime": false
      },
      "activation": {
        "onStartup": false
      },
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```

    `cliBackends`는 런타임 소유권 목록입니다. 이를 통해 구성이나 모델 선택에서
    `acme-cli/...`가 언급될 때 OpenClaw가 Plugin을 자동으로 로드할 수 있습니다.

    `setup.cliBackends`는 설명자 우선 설정 표면입니다. Plugin 런타임을 로드하지
    않고도 모델 검색, 온보딩 또는 상태에서 백엔드를 인식해야 할 때 추가하세요.
    이러한 정적 설명자만으로 설정에 충분한 경우에만 `requiresRuntime: false`를
    사용하세요.

  </Step>

  <Step title="백엔드 등록">
    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      CLI_FRESH_WATCHDOG_DEFAULTS,
      CLI_RESUME_WATCHDOG_DEFAULTS,
      type CliBackendPlugin,
    } from "openclaw/plugin-sdk/cli-backend";

    function buildAcmeCliBackend(): CliBackendPlugin {
      return {
        id: "acme-cli",
        liveTest: {
          defaultModelRef: "acme-cli/acme-large",
          defaultImageProbe: false,
          defaultMcpProbe: false,
          docker: {
            npmPackage: "@acme/acme-cli",
            binaryName: "acme",
          },
        },
        config: {
          command: "acme",
          args: ["chat", "--json"],
          output: "json",
          input: "stdin",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptFileArg: "--system-file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          reliability: {
            watchdog: {
              fresh: { ...CLI_FRESH_WATCHDOG_DEFAULTS },
              resume: { ...CLI_RESUME_WATCHDOG_DEFAULTS },
            },
          },
          serialize: true,
        },
      };
    }

    export default definePluginEntry({
      id: "acme-cli",
      name: "Acme CLI",
      description: "Run Acme's local AI CLI through OpenClaw",
      register(api) {
        api.registerCliBackend(buildAcmeCliBackend());
      },
    });
    ```

    백엔드 ID는 매니페스트의 `cliBackends` 항목과 일치해야 합니다. 등록된
    `config`는 기본값일 뿐이며, 런타임에는
    `agents.defaults.cliBackends.acme-cli` 아래의 사용자 구성이 그 위에
    병합됩니다.

  </Step>
</Steps>

## 구성 형태

`CliBackendConfig`는 OpenClaw가 CLI를 실행하고 구문 분석하는 방법을 설명합니다.

| 필드                                                      | 용도                                                                                         |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `command`                                                 | 바이너리 이름 또는 절대 명령 경로                                                            |
| `args`                                                    | 새 실행을 위한 기본 argv                                                                     |
| `resumeArgs`                                              | 재개된 세션을 위한 대체 argv이며 `{sessionId}`를 지원                                         |
| `output` / `resumeOutput`                                 | 파서: `json`, `jsonl` 또는 `text`                                                            |
| `jsonlDialect`                                            | JSONL 이벤트 방언: `claude-stream-json` 또는 `gemini-stream-json`                            |
| `liveSession`                                             | 장기 실행 CLI 프로세스 모드(`claude-stdio`)                                                   |
| `input`                                                   | 프롬프트 전달 방식: `arg` 또는 `stdin`                                                       |
| `maxPromptArgChars`                                       | stdin으로 대체하기 전 `arg` 모드의 최대 프롬프트 길이                                        |
| `env` / `clearEnv`                                        | 주입할 추가 환경 변수 또는 실행 전에 제거할 환경 변수 이름                                   |
| `modelArg`                                                | 모델 ID 앞에 사용하는 플래그                                                                 |
| `modelAliases`                                            | OpenClaw 모델 ID를 CLI 네이티브 ID에 매핑                                                     |
| `sessionArg` / `sessionArgs`                              | 세션 ID를 전달하는 방법                                                                       |
| `sessionMode`                                             | `always`, `existing` 또는 `none`                                                             |
| `sessionIdFields`                                         | OpenClaw가 CLI 출력에서 읽는 JSON 필드                                                        |
| `systemPromptArg` / `systemPromptFileArg`                 | 시스템 프롬프트 전달 방식                                                                     |
| `systemPromptFileConfigArg` / `systemPromptFileConfigKey` | 시스템 프롬프트 파일을 위한 구성 재정의 전달 방식(예: `-c`)                                   |
| `systemPromptMode`                                        | `append` 또는 `replace`                                                                      |
| `systemPromptWhen`                                        | `first`, `always` 또는 `never`                                                               |
| `imageArg` / `imageMode`                                  | 이미지 경로 플래그 및 여러 이미지를 전달하는 방법(`repeat` 또는 `list`)                      |
| `imagePathScope`                                          | 전달 전에 스테이징된 이미지 파일이 위치하는 곳: `temp` 또는 `workspace`                      |
| `serialize`                                               | 동일 백엔드 실행의 순서를 유지                                                                |
| `reseedFromRawTranscriptWhenUncompacted`                  | 안전한 세션 재설정을 위해 Compaction 전 제한된 원시 트랜스크립트 재시드를 사용하도록 선택    |
| `reliability.outputLimits`                                | 하나의 실시간 CLI 턴에 보존되는 원시 JSONL의 최대 문자 수/줄 수(실시간 세션 백엔드)          |
| `reliability.watchdog`                                    | 새 실행과 재개 실행에 각각 적용되는 무출력 제한 시간 조정                                     |

CLI에 맞는 가장 작은 정적 구성을 선호하세요. 실제로 백엔드에 속하는 동작에만
Plugin 콜백을 추가하세요.

## 고급 백엔드 훅

`CliBackendPlugin`은 다음 항목도 정의할 수 있습니다.

| 훅                                 | 용도                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | 병합 후 레거시 사용자 구성을 다시 작성                                      |
| `resolveExecutionArgs(ctx)`        | 사고 노력 수준 또는 부가 질문 격리와 같은 요청 범위 플래그 추가             |
| `prepareExecution(ctx)`            | 실행 전에 임시 인증 또는 구성 브리지 생성                                   |
| `transformSystemPrompt(ctx)`       | 최종 CLI별 시스템 프롬프트 변환 적용                                         |
| `textTransforms`                   | 양방향 프롬프트/출력 치환                                                     |
| `defaultAuthProfileId`             | 특정 OpenClaw 인증 프로필을 우선 사용                                        |
| `authEpochMode`                    | 인증 변경이 저장된 CLI 세션을 무효화하는 방식 결정                           |
| `nativeToolMode`                   | 네이티브 도구가 없거나, 항상 켜져 있거나, 호스트에서 선택 가능한지 선언     |
| `sideQuestionToolMode`             | `/btw` 부가 질문에서 비활성화되는 네이티브 도구 선언                         |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw의 local loopback MCP 도구 브리지 사용 선택                          |
| `ownsNativeCompaction`             | 백엔드가 자체 Compaction을 소유하며 OpenClaw는 이를 위임                     |
| `runtimeArtifact`                  | 스크립트 실행기를 완전한 번들 패키지 트리로 제한                             |

이러한 훅은 제공자가 소유하도록 유지하세요. 백엔드 훅으로 동작을 표현할 수 있다면
코어에 CLI별 분기를 추가하지 마세요.

`runtimeArtifact`는 Plugin이 소유하며 사용자가 재정의할 수 없습니다. 실시간 추론
턴이 검증된 설정 권한을 발급하거나 재검증할 때만 참조되며, 일반적인 CLI 실행에는
필요하지 않습니다. 이 선언이 없는 백엔드는 검증된 CLI 설정 권한을 발급할 수
없습니다. `bundled-package-tree` 선언은 정확한 `package.json` 소유자를 지정하며
패키지 진입점이 명령이어야 합니다. OpenClaw는 중첩된 종속성을 포함하여 범위가
지정된 설치 패키지 트리 전체를 해시하고, 리디렉션하는 심볼릭 링크, 선언된 패키지
외부의 실행기, 필수 외부 종속성 선언, 지나치게 큰 트리 및 알 수 없는 스크립트가
있으면 안전하게 실패합니다. 해당 트리에 완전한 추론 구현이 포함된 경우에만 이를
선언하세요. 선택적 도구 통합만으로는 외부 구현 그래프가 안전해지지 않습니다.

동일한 백엔드가 자체 완결형 네이티브 실행 파일도 제공하는 경우 해당 파일의 정식
기본 이름을 `nativeExecutableNames`에 나열하세요. 사용자가 백엔드 명령을
재정의하더라도 다른 네이티브 명령은 검증되지 않은 상태로 유지됩니다.

`ctx.executionMode`는 일반 턴에서는 `"agent"`이고 일시적인 `/btw` 호출에서는 `"side-question"`입니다. BTW에서 네이티브 도구, 세션 지속성 또는 재개 동작을 비활성화하는 경우처럼 CLI에 다른 일회성 플래그가 필요할 때 사용합니다. 백엔드가 일반적으로 `nativeToolMode: "always-on"`을 사용하지만 사이드 질문 argv가 해당 도구를 확실히 비활성화한다면 `sideQuestionToolMode: "disabled"`도 설정하세요. 그렇지 않으면 BTW에 도구 없는 CLI 실행이 필요할 때 OpenClaw가 안전을 위해 실행을 거부합니다.

`resolveExecutionArgs`가 개별 실행에서 모든 백엔드 네이티브 도구를 비활성화할 수 있는 경우에만 `nativeToolMode: "selectable"`을 설정하세요. 이러한 제한된 실행에서는 `ctx.toolAvailability.native`가 빈 튜플이고 `ctx.toolAvailability.mcp`가 호스트에서 격리된 정확한 MCP 허용 목록입니다. 훅은 충돌하는 도구 플래그를 교체하고 두 값을 모두 강제하는 argv를 반환해야 합니다. OpenClaw는 최종 신규 또는 재개 argv로 훅을 한 번 호출하며, 백엔드가 제한을 강제할 수 없으면 안전을 위해 실행을 거부합니다. 이 컨텍스트의 MCP 이름은 호스트가 생성된 MCP 구성을 이미 해당 서버와 도구로 제한했기 때문에 자동 승인해도 안전합니다.

### `ownsNativeCompaction`: OpenClaw Compaction 사용 중지

백엔드가 **자체** 트랜스크립트를 Compaction하는 에이전트를 실행한다면 OpenClaw의 보호용 요약기가 해당 세션에 대해 절대 실행되지 않도록 `ownsNativeCompaction: true`를 설정하세요. CLI Compaction 수명 주기는 아무 작업도 하지 않고 반환되며 턴이 계속 진행됩니다. `claude-cli`는 Claude Code가 하네스 엔드포인트 없이 내부적으로 Compaction하므로 이를 선언합니다. 반면 Codex와 같은 네이티브 하네스 세션은 계속 해당 하네스의 Compaction 엔드포인트로 라우팅됩니다.

**다음 조건이 모두 충족될 때만 선언하세요.** 그렇지 않으면 지연된 예산 초과 세션이 계속 예산을 초과하거나 오래된 상태가 될 수 있습니다(OpenClaw가 더 이상 복구하지 않음).

- 백엔드가 창 한계에 가까워질 때 자체 트랜스크립트를 안정적으로 Compaction하거나 크기를 제한합니다.
- Compaction된 상태가 여러 턴에 걸쳐 유지되도록 재개 가능한 세션을 영속화합니다(예: `--resume` / `--session-id`).
- 네이티브 하네스 Compaction 세션이 아닙니다. `agentHarnessId`가 일치하는 세션은 대신 하네스 엔드포인트로 라우팅됩니다.

## MCP 도구 브리지

CLI 백엔드는 기본적으로 OpenClaw 도구를 받지 않습니다. CLI가 MCP 구성을 사용할 수 있다면 명시적으로 활성화하세요.

```typescript
return {
  id: "acme-cli",
  bundleMcp: true,
  bundleMcpMode: "codex-config-overrides",
  config: {
    command: "acme",
    args: ["chat", "--json"],
    output: "json",
  },
};
```

지원되는 브리지 모드:

| 모드                     | 용도                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | MCP 구성 파일을 허용하는 CLI                              |
| `codex-config-overrides` | argv에서 구성 재정의를 허용하는 CLI                        |
| `gemini-system-settings` | 시스템 설정 디렉터리에서 MCP 설정을 읽는 CLI |

CLI가 실제로 브리지를 사용할 수 있을 때만 활성화하세요. CLI에 비활성화할 수 없는 자체 내장 도구 계층이 있다면 호출자가 네이티브 도구 없음을 요구할 때 OpenClaw가 안전을 위해 실행을 거부할 수 있도록 `nativeToolMode: "always-on"`을 설정하세요. 실행별로 모든 네이티브 도구를 비활성화할 수 있다면 앞에서 설명한 `resolveExecutionArgs` 계약과 함께 `"selectable"`을 사용하세요.

## 사용자 구성

사용자는 모든 백엔드 기본값을 재정의할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "acme-cli": {
          command: "/opt/acme/bin/acme",
          args: ["chat", "--json", "--profile", "work"],
          modelAliases: {
            large: "acme-large-2026",
          },
        },
      },
      model: {
        primary: "openai/gpt-5.6-sol",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

사용자에게 필요할 가능성이 높은 최소한의 재정의 항목을 문서화하세요. 일반적으로 바이너리가 `PATH` 외부에 있을 때 필요한 `command`뿐입니다.

## 검증

번들 Plugin의 경우 빌더와 설정 등록에 대한 집중 테스트를 추가한 다음 Plugin의 대상 테스트 레인을 실행하세요.

```bash
pnpm test extensions/acme-cli
```

로컬 또는 설치된 Plugin의 경우 검색과 실제 모델 실행 한 번을 검증하세요.

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

백엔드가 이미지 또는 MCP를 지원한다면 실제 CLI로 해당 경로를 입증하는 라이브 스모크 테스트를 추가하세요. 프롬프트, 이미지, MCP 또는 세션 재개 동작을 정적 검사에만 의존하지 마세요.

## 체크리스트

<Check>게시되는 패키지의 `package.json`에 `openclaw.extensions`와 빌드된 런타임 엔트리가 있음</Check>
<Check>`openclaw.plugin.json`에 `cliBackends`와 의도된 `activation.onStartup`이 선언되어 있음</Check>
<Check>설정/모델 검색이 콜드 상태에서 백엔드를 확인해야 할 때 `setup.cliBackends`가 존재함</Check>
<Check>`api.registerCliBackend(...)`가 매니페스트와 동일한 백엔드 ID를 사용함</Check>
<Check>`agents.defaults.cliBackends.<id>` 아래의 사용자 재정의가 계속 우선함</Check>
<Check>세션, 시스템 프롬프트, 이미지 및 출력 파서 설정이 실제 CLI 계약과 일치함</Check>
<Check>대상 테스트와 하나 이상의 라이브 CLI 스모크 테스트가 백엔드 경로를 입증함</Check>

## 관련 문서

- [CLI 백엔드](/ko/gateway/cli-backends) - 사용자 구성 및 런타임 동작
- [Plugin 빌드](/ko/plugins/building-plugins) - 패키지 및 매니페스트 기본 사항
- [Plugin SDK 개요](/ko/plugins/sdk-overview) - 등록 API 참조
- [Plugin 매니페스트](/ko/plugins/manifest) - `cliBackends` 및 설정 설명자
- [에이전트 하네스](/ko/plugins/sdk-agent-harness) - 완전한 외부 에이전트 런타임
