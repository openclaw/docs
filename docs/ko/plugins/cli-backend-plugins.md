---
read_when:
    - 로컬 AI CLI 백엔드 Plugin을 구축하고 있습니다
    - acme-cli/model과 같은 모델 참조를 위한 백엔드를 등록하려는 경우
    - 타사 CLI를 OpenClaw의 텍스트 폴백 실행기에 매핑해야 합니다.
sidebarTitle: CLI backend plugins
summary: 로컬 AI CLI 백엔드를 등록하는 Plugin 빌드하기
title: CLI 백엔드 Plugin 빌드하기
x-i18n:
    generated_at: "2026-05-07T13:22:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fcd604d35eb20d91350d5201236f22edfe7bb7e52eb19e89bceb8025dd3a29b
    source_path: plugins/cli-backend-plugins.md
    workflow: 16
---

CLI 백엔드 Plugin을 사용하면 OpenClaw가 로컬 AI CLI를 텍스트 추론
백엔드로 호출할 수 있습니다. 백엔드는 모델 참조에서 provider 접두사로 나타납니다.

```text
acme-cli/acme-large
```

업스트림 통합이 이미 로컬 명령으로 노출되어 있거나, CLI가 로컬 로그인 상태를
소유하거나, API provider를 사용할 수 없을 때 CLI가 유용한 대체 경로인 경우
CLI 백엔드를 사용하세요.

<Info>
  업스트림 서비스가 일반 HTTP 모델 API를 제공한다면 대신
  [provider Plugin](/ko/plugins/sdk-provider-plugins)을 작성하세요. 업스트림
  런타임이 완전한 agent 세션, 도구 이벤트, Compaction 또는 백그라운드
  작업 상태를 소유한다면 [agent 하네스](/ko/plugins/sdk-agent-harness)를 사용하세요.
</Info>

## Plugin이 소유하는 항목

CLI 백엔드 Plugin에는 세 가지 계약이 있습니다.

| 계약                 | 파일                   | 목적                                                      |
| -------------------- | ---------------------- | --------------------------------------------------------- |
| 패키지 진입점        | `package.json`         | OpenClaw가 Plugin 런타임 모듈을 찾도록 지정              |
| 매니페스트 소유권    | `openclaw.plugin.json` | 런타임 로드 전에 백엔드 id를 선언                         |
| 런타임 등록          | `index.ts`             | 명령 기본값으로 `api.registerCliBackend(...)`를 호출      |

매니페스트는 검색 메타데이터입니다. CLI를 실행하지 않으며 런타임 동작을
등록하지 않습니다. 런타임 동작은 Plugin 진입점이
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

  <Step title="백엔드 소유권 선언하기">
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

    `cliBackends`는 런타임 소유권 목록입니다. config 또는 모델 선택에서
    `acme-cli/...`가 언급될 때 OpenClaw가 Plugin을 자동 로드할 수 있게 합니다.

    `setup.cliBackends`는 descriptor-first 설정 표면입니다. 모델 검색,
    온보딩 또는 상태가 Plugin 런타임을 로드하지 않고 백엔드를 인식해야 할 때
    추가하세요. 해당 정적 descriptor만으로 설정에 충분한 경우에만
    `requiresRuntime: false`를 사용하세요.

  </Step>

  <Step title="백엔드 등록하기">
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

    백엔드 id는 매니페스트의 `cliBackends` 항목과 일치해야 합니다. 등록된
    `config`는 기본값일 뿐입니다. `agents.defaults.cliBackends.acme-cli` 아래의
    사용자 config는 런타임에 그 위로 병합됩니다.

  </Step>
</Steps>

## Config 형태

`CliBackendConfig`는 OpenClaw가 CLI를 실행하고 파싱하는 방법을 설명합니다.

| 필드                                      | 용도                                                        |
| ----------------------------------------- | ----------------------------------------------------------- |
| `command`                                 | 바이너리 이름 또는 절대 명령 경로                           |
| `args`                                    | fresh 실행을 위한 기본 argv                                 |
| `resumeArgs`                              | 재개된 세션을 위한 대체 argv; `{sessionId}` 지원            |
| `output` / `resumeOutput`                 | 파서: `json`, `jsonl` 또는 `text`                           |
| `input`                                   | 프롬프트 전송: `arg` 또는 `stdin`                           |
| `modelArg`                                | 모델 id 앞에 사용되는 플래그                                |
| `modelAliases`                            | OpenClaw 모델 id를 CLI 네이티브 id에 매핑                   |
| `sessionArg` / `sessionArgs`              | 세션 id를 전달하는 방법                                     |
| `sessionMode`                             | `always`, `existing` 또는 `none`                            |
| `sessionIdFields`                         | OpenClaw가 CLI 출력에서 읽는 JSON 필드                      |
| `systemPromptArg` / `systemPromptFileArg` | 시스템 프롬프트 전송 방식                                   |
| `systemPromptWhen`                        | `first`, `always` 또는 `never`                              |
| `imageArg` / `imageMode`                  | 이미지 경로 지원                                            |
| `serialize`                               | 같은 백엔드 실행 순서 유지                                  |
| `reliability.watchdog`                    | 출력 없음 타임아웃 조정                                     |

CLI와 일치하는 가장 작은 정적 config를 선호하세요. 실제로 백엔드에 속하는
동작에만 Plugin 콜백을 추가하세요.

## 고급 백엔드 훅

`CliBackendPlugin`은 다음도 정의할 수 있습니다.

| 훅                                 | 용도                                                   |
| ---------------------------------- | ------------------------------------------------------ |
| `normalizeConfig(config, context)` | 병합 후 레거시 사용자 config 다시 쓰기                 |
| `resolveExecutionArgs(ctx)`        | thinking effort 같은 요청 범위 플래그 추가             |
| `prepareExecution(ctx)`            | 실행 전 임시 인증 또는 config 브리지 만들기            |
| `transformSystemPrompt(ctx)`       | 최종 CLI별 시스템 프롬프트 변환 적용                   |
| `textTransforms`                   | 양방향 프롬프트/출력 치환                              |
| `defaultAuthProfileId`             | 특정 OpenClaw 인증 프로필 선호                         |
| `authEpochMode`                    | 인증 변경이 저장된 CLI 세션을 무효화하는 방식 결정     |
| `nativeToolMode`                   | CLI에 항상 켜진 네이티브 도구가 있는지 선언            |
| `bundleMcp` / `bundleMcpMode`      | OpenClaw의 loopback MCP 도구 브리지 사용                |

이 훅들은 provider 소유로 유지하세요. 백엔드 훅으로 동작을 표현할 수 있을 때
코어에 CLI별 분기를 추가하지 마세요.

## MCP 도구 브리지

CLI 백엔드는 기본적으로 OpenClaw 도구를 받지 않습니다. CLI가 MCP 구성을
사용할 수 있다면 명시적으로 옵트인하세요.

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

| 모드                     | 용도                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| `claude-config-file`     | MCP config 파일을 받는 CLI                                       |
| `codex-config-overrides` | argv에서 config override를 받는 CLI                              |
| `gemini-system-settings` | 시스템 설정 디렉터리에서 MCP 설정을 읽는 CLI                     |

CLI가 실제로 이를 사용할 수 있을 때만 브리지를 활성화하세요. CLI에 비활성화할
수 없는 자체 내장 도구 계층이 있다면, 호출자가 네이티브 도구 없음을 요구할 때
OpenClaw가 닫힌 상태로 실패할 수 있도록 `nativeToolMode: "always-on"`을 설정하세요.

## 사용자 구성

사용자는 모든 백엔드 기본값을 override할 수 있습니다.

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

사용자에게 필요할 가능성이 큰 최소 override를 문서화하세요. 보통 바이너리가
`PATH` 밖에 있을 때의 `command`만 해당합니다.

## 검증

번들된 Plugin의 경우 빌더와 설정 등록을 다루는 집중 테스트를 추가한 다음,
Plugin의 대상 테스트 레인을 실행하세요.

```bash
pnpm test extensions/acme-cli
```

로컬 또는 설치된 Plugin의 경우 검색과 실제 모델 실행 하나를 검증하세요.

```bash
openclaw plugins inspect acme-cli --runtime --json
openclaw agent --message "reply exactly: backend ok" --model acme-cli/acme-large
```

백엔드가 이미지 또는 MCP를 지원한다면 실제 CLI로 해당 경로를 증명하는 라이브
스모크를 추가하세요. 프롬프트, 이미지, MCP 또는 세션 재개 동작에 대해 정적
검사에 의존하지 마세요.

## 체크리스트

<Check>`package.json`에 `openclaw.extensions`와 게시된 패키지를 위한 빌드된 런타임 진입점이 있습니다</Check>
<Check>`openclaw.plugin.json`이 `cliBackends`와 의도적인 `activation.onStartup`을 선언합니다</Check>
<Check>설정/모델 검색이 콜드 상태에서 백엔드를 봐야 할 때 `setup.cliBackends`가 있습니다</Check>
<Check>`api.registerCliBackend(...)`가 매니페스트와 동일한 백엔드 id를 사용합니다</Check>
<Check>`agents.defaults.cliBackends.<id>` 아래의 사용자 override가 계속 우선합니다</Check>
<Check>세션, 시스템 프롬프트, 이미지, 출력 파서 설정이 실제 CLI 계약과 일치합니다</Check>
<Check>대상 테스트와 최소 하나의 라이브 CLI 스모크가 백엔드 경로를 증명합니다</Check>

## 관련 항목

- [CLI 백엔드](/ko/gateway/cli-backends) - 사용자 구성 및 런타임 동작
- [Plugin 빌드](/ko/plugins/building-plugins) - 패키지 및 매니페스트 기본 사항
- [Plugin SDK 개요](/ko/plugins/sdk-overview) - 등록 API 참조
- [Plugin 매니페스트](/ko/plugins/manifest) - `cliBackends` 및 설정 descriptor
- [Agent 하네스](/ko/plugins/sdk-agent-harness) - 전체 외부 agent 런타임
