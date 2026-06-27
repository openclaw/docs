---
read_when:
    - 로컬 AI CLI 백엔드 Plugin을 구축하고 있습니다
    - acme-cli/model 같은 모델 참조에 대한 백엔드를 등록하려는 경우
    - 서드파티 CLI를 OpenClaw의 텍스트 폴백 실행기에 매핑해야 합니다
sidebarTitle: CLI backend plugins
summary: 로컬 AI CLI 백엔드를 등록하는 Plugin 빌드하기
title: CLI 백엔드 Plugin 빌드하기
x-i18n:
    generated_at: "2026-06-27T17:43:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d91c2b712a821005303c6cbb0ccbd8f263c8c30c5dbd6ed05b842c47c63f0542
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI 백엔드 Plugin은 OpenClaw가 로컬 AI CLI를 텍스트 추론
백엔드로 호출할 수 있게 합니다. 백엔드는 모델 참조에서 Provider 접두사로 표시됩니다.

```text
acme-cli/acme-large
```

업스트림 통합이 이미 로컬 명령으로 노출되어 있거나, CLI가 로컬 로그인 상태를 소유하거나, API Provider를 사용할 수 없을 때 CLI가 유용한
대체 수단인 경우 CLI 백엔드를 사용하세요.

<Info>
  업스트림 서비스가 일반 HTTP 모델 API를 노출한다면 대신
  [Provider Plugin](/ko/plugins/sdk-provider-plugins)을 작성하세요. 업스트림
  런타임이 완전한 에이전트 세션, 도구 이벤트, Compaction 또는 백그라운드
  작업 상태를 소유한다면 [에이전트 하네스](/ko/plugins/sdk-agent-harness)를 사용하세요.
</Info>

## Plugin이 소유하는 것

CLI 백엔드 Plugin에는 세 가지 계약이 있습니다.

| 계약                 | 파일                   | 목적                                      |
| -------------------- | ---------------------- | ----------------------------------------- |
| 패키지 진입점        | `package.json`         | OpenClaw가 Plugin 런타임 모듈을 가리키게 함 |
| 매니페스트 소유권    | `openclaw.plugin.json` | 런타임 로드 전에 백엔드 ID를 선언함       |
| 런타임 등록          | `index.ts`             | 명령 기본값으로 `api.registerCliBackend(...)` 호출 |

매니페스트는 발견 메타데이터입니다. CLI를 실행하지 않으며
런타임 동작을 등록하지도 않습니다. 런타임 동작은 Plugin 진입점이
`api.registerCliBackend(...)`를 호출할 때 시작됩니다.

## 최소 백엔드 Plugin

<Steps>
  <Step title="패키지 메타데이터 만들기">
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

    게시된 패키지는 빌드된 JavaScript 런타임 파일을 포함해야 합니다. 소스
    진입점이 `./src/index.ts`라면 빌드된 JavaScript 피어를 가리키는
    `openclaw.runtimeExtensions`를 추가하세요. [진입점](/ko/plugins/sdk-entrypoints)을 참조하세요.

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

    `cliBackends`는 런타임 소유권 목록입니다. 구성이나 모델 선택에서
    `acme-cli/...`를 언급할 때 OpenClaw가 Plugin을 자동 로드할 수 있게 합니다.

    `setup.cliBackends`는 설명자 우선 설정 표면입니다. 모델 발견,
    온보딩 또는 상태가 Plugin 런타임을 로드하지 않고도 백엔드를 인식해야 할 때 추가하세요.
    이러한 정적 설명자만으로 설정에 충분한 경우에만 `requiresRuntime: false`를 사용하세요.

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

    백엔드 ID는 매니페스트 `cliBackends` 항목과 일치해야 합니다. 등록된
    `config`는 기본값일 뿐이며, `agents.defaults.cliBackends.acme-cli` 아래의 사용자 구성이 런타임에 그 위로 병합됩니다.

  </Step>
</Steps>

## 구성 형태

`CliBackendConfig`는 OpenClaw가 CLI를 실행하고 파싱하는 방법을 설명합니다.

| 필드                                      | 용도                                                        |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | 바이너리 이름 또는 절대 명령 경로                           |
| `args`                                    | 새 실행의 기본 argv                                         |
| `resumeArgs`                              | 재개된 세션의 대체 argv; `{sessionId}` 지원                 |
| `output` / `resumeOutput`                 | 파서: `json`, `jsonl` 또는 `text`                           |
| `input`                                   | 프롬프트 전송: `arg` 또는 `stdin`                           |
| `modelArg`                                | 모델 ID 앞에 사용하는 플래그                                |
| `modelAliases`                            | OpenClaw 모델 ID를 CLI 네이티브 ID에 매핑                   |
| `sessionArg` / `sessionArgs`              | 세션 ID를 전달하는 방법                                     |
| `sessionMode`                             | `always`, `existing` 또는 `none`                            |
| `sessionIdFields`                         | OpenClaw가 CLI 출력에서 읽는 JSON 필드                      |
| `systemPromptArg` / `systemPromptFileArg` | 시스템 프롬프트 전송                                        |
| `systemPromptWhen`                        | `first`, `always` 또는 `never`                              |
| `imageArg` / `imageMode`                  | 이미지 경로 지원                                            |
| `serialize`                               | 같은 백엔드 실행 순서 유지                                  |
| `reliability.watchdog`                    | 출력 없음 타임아웃 조정                                     |

CLI와 일치하는 가장 작은 정적 구성을 선호하세요. 백엔드에 실제로 속하는
동작에만 Plugin 콜백을 추가하세요.

## 고급 백엔드 훅

`CliBackendPlugin`은 다음도 정의할 수 있습니다.

| 훅                                 | 용도                                                                  |
| ---------------------------------- | --------------------------------------------------------------------- |
| `normalizeConfig(config, context)` | 병합 후 레거시 사용자 구성 재작성                                     |
| `resolveExecutionArgs(ctx)`        | 사고 노력 또는 부가 질문 격리 같은 요청 범위 플래그 추가             |
| `prepareExecution(ctx)`            | 실행 전 임시 인증 또는 구성 브리지 생성                               |
| `transformSystemPrompt(ctx)`       | 최종 CLI 전용 시스템 프롬프트 변환 적용                               |
| `textTransforms`                   | 양방향 프롬프트/출력 대체                                             |
| `defaultAuthProfileId`             | 특정 OpenClaw 인증 프로필 선호                                        |
| `authEpochMode`                    | 인증 변경이 저장된 CLI 세션을 무효화하는 방법 결정                    |
| `nativeToolMode`                   | CLI에 항상 켜진 네이티브 도구가 있는지 선언                           |
| `sideQuestionToolMode`             | `/btw` 부가 질문에 대해 비활성화된 네이티브 도구 선언                 |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw의 loopback MCP 도구 브리지에 옵트인                          |
| `ownsNativeCompaction`             | 백엔드가 자체 Compaction을 소유함 - OpenClaw는 위임                   |

이 훅들은 Provider가 소유하게 유지하세요. 백엔드 훅으로 동작을 표현할 수 있을 때
코어에 CLI 전용 분기를 추가하지 마세요.

`ctx.executionMode`는 일반 턴에서는 `"agent"`이고 임시 `/btw` 호출에서는
`"side-question"`입니다. BTW에 대해 네이티브 도구, 세션 지속성 또는 재개 동작을 비활성화하는 것처럼
CLI에 다른 일회성 플래그가 필요할 때 사용하세요. 백엔드가 일반적으로
`nativeToolMode: "always-on"`을 갖지만 그 부가 질문 argv가 해당 도구를 안정적으로 비활성화한다면
`sideQuestionToolMode: "disabled"`도 설정하세요. 그렇지 않으면 BTW가 도구 없는 CLI 실행을 요구할 때 OpenClaw가 안전하게 실패합니다.

### `ownsNativeCompaction`: OpenClaw Compaction 옵트아웃

백엔드가 **자체** 트랜스크립트를 압축하는 에이전트를 실행한다면
`ownsNativeCompaction: true`를 설정하여 OpenClaw의 보호 요약기가 그 세션에 대해 실행되지 않게 하세요.
CLI Compaction 수명 주기는 no-op을 반환하고 턴은 계속 진행됩니다. `claude-cli`는 Claude Code가 하네스 엔드포인트 없이 내부적으로 압축하기 때문에 이를 선언합니다. Codex 같은 네이티브 하네스
세션은 대신 하네스 Compaction 엔드포인트로 계속 라우팅됩니다.

**다음이 모두 참일 때만 선언하세요**. 그렇지 않으면 지연된 예산 초과 세션이
예산 초과 상태로 남거나 오래될 수 있습니다(OpenClaw가 더 이상 이를 구조하지 않습니다).

- 백엔드는 윈도우에 가까워질 때 자체 트랜스크립트를 안정적으로 압축하거나 제한합니다.
- 압축된 상태가 턴 사이에 유지되도록 재개 가능한 세션을 지속합니다
  (예: `--resume` / `--session-id`).
- 네이티브 하네스 Compaction 세션이 아닙니다. 일치하는 `agentHarnessId` 세션은
  대신 하네스 엔드포인트로 라우팅됩니다.

## MCP 도구 브리지

CLI 백엔드는 기본적으로 OpenClaw 도구를 받지 않습니다. CLI가 MCP 구성을 소비할 수 있다면
명시적으로 옵트인하세요.

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

지원되는 브리지 모드는 다음과 같습니다.

| 모드                     | 용도                                             |
| ------------------------ | ------------------------------------------------ |
| `claude-config-file`     | MCP 구성 파일을 허용하는 CLI                     |
| `codex-config-overrides` | argv에서 구성 오버라이드를 허용하는 CLI          |
| `gemini-system-settings` | 시스템 설정 디렉터리에서 MCP 설정을 읽는 CLI     |

CLI가 실제로 브리지를 소비할 수 있을 때만 브리지를 활성화하세요. CLI에
비활성화할 수 없는 자체 내장 도구 계층이 있다면 호출자가 네이티브 도구 없음을 요구할 때 OpenClaw가 안전하게 실패할 수 있도록 `nativeToolMode:
"always-on"`을 설정하세요.

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
        primary: "openai/gpt-5.5",
        fallbacks: ["acme-cli/large"],
      },
    },
  },
}
```

사용자가 필요로 할 가능성이 높은 최소 재정의를 문서화하세요. 일반적으로 바이너리가
`PATH` 밖에 있을 때 `command`만 있으면 됩니다.

## 검증

번들 Plugin의 경우 빌더와 설정 등록을 중심으로 한 테스트를 추가한 다음, Plugin의 대상 테스트 레인을 실행합니다.

```bash
pnpm test extensions/acme-cli
```

로컬 또는 설치된 Plugin의 경우 검색과 실제 모델 실행 하나를 검증합니다.

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

백엔드가 이미지 또는 MCP를 지원하는 경우 실제 CLI로 해당 경로를 증명하는 라이브 스모크 테스트를 추가합니다. 프롬프트, 이미지, MCP 또는 세션 재개 동작에 대해 정적 검사에 의존하지 마세요.

## 체크리스트

<Check>`package.json`에 게시된 패키지용 `openclaw.extensions`와 빌드된 런타임 엔트리가 있음</Check>
<Check>`openclaw.plugin.json`이 `cliBackends`와 의도된 `activation.onStartup`을 선언함</Check>
<Check>설정/모델 검색이 백엔드를 콜드 상태에서 확인해야 하는 경우 `setup.cliBackends`가 있음</Check>
<Check>`api.registerCliBackend(...)`가 매니페스트와 동일한 백엔드 ID를 사용함</Check>
<Check>`agents.defaults.cliBackends.<id>` 아래의 사용자 재정의가 여전히 우선함</Check>
<Check>세션, 시스템 프롬프트, 이미지 및 출력 파서 설정이 실제 CLI 계약과 일치함</Check>
<Check>대상 테스트와 하나 이상의 라이브 CLI 스모크 테스트가 백엔드 경로를 증명함</Check>

## 관련 항목

- [CLI 백엔드](/ko/gateway/cli-backends) - 사용자 구성 및 런타임 동작
- [Plugin 빌드](/ko/plugins/building-plugins) - 패키지 및 매니페스트 기본 사항
- [Plugin SDK 개요](/ko/plugins/sdk-overview) - 등록 API 참조
- [Plugin 매니페스트](/ko/plugins/manifest) - `cliBackends` 및 설정 설명자
- [에이전트 하니스](/ko/plugins/sdk-agent-harness) - 전체 외부 에이전트 런타임
