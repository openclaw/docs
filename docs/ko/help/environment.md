---
read_when:
    - 어떤 env vars가 어떤 순서로 로드되는지 알아야 합니다
    - Gateway에서 누락된 API 키를 디버깅하고 있습니다
    - 제공자 인증 또는 배포 환경을 문서화하고 있습니다
summary: OpenClaw가 환경 변수를 로드하는 위치와 우선순위
title: 환경 변수
x-i18n:
    generated_at: "2026-06-27T17:33:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7e36f93efe29f9cc0e9942659c323a635d21fcaa436427dcb21f5694e5d0458b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw는 여러 소스에서 환경 변수를 가져옵니다. 규칙은 **기존 값을 절대 덮어쓰지 않는 것**입니다.
작업공간 `.env` 파일은 신뢰도가 낮은 소스입니다. OpenClaw는 우선순위를 적용하기 전에 작업공간 `.env`의 제공자 자격 증명과 보호된 런타임 제어 값을 무시합니다.

## 우선순위(높음 → 낮음)

1. **프로세스 환경**(Gateway 프로세스가 부모 셸/데몬에서 이미 받은 값).
2. **현재 작업 디렉터리의 `.env`**(dotenv 기본값, 덮어쓰지 않음, 제공자 자격 증명과 보호된 런타임 제어 값은 무시됨).
3. **전역 `.env`** `~/.openclaw/.env`(즉 `$OPENCLAW_STATE_DIR/.env`, 제공자 API 키에 권장, 덮어쓰지 않음).
4. **Config `env` 블록** `~/.openclaw/openclaw.json` 안의 값(누락된 경우에만 적용).
5. **선택적 로그인 셸 가져오기**(`env.shellEnv.enabled` 또는 `OPENCLAW_LOAD_SHELL_ENV=1`), 누락된 예상 키에만 적용.

기본 상태 디렉터리를 사용하는 Ubuntu 새 설치에서는 OpenClaw가 전역 `.env` 다음의 호환성 fallback으로 `~/.config/openclaw/gateway.env`도 처리합니다. 두 파일이 모두 존재하고 서로 다르면 OpenClaw는 `~/.openclaw/.env`를 유지하고 경고를 출력합니다.

config 파일이 아예 없으면 4단계는 건너뜁니다. 셸 가져오기는 활성화된 경우 계속 실행됩니다.

## 제공자 자격 증명과 작업공간 `.env`

제공자 API 키를 작업공간 `.env`에만 보관하지 마세요. OpenClaw는 작업공간 `.env` 파일의 제공자 자격 증명 환경 변수를 무시합니다. 여기에는 `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY` 같은 일반적인 키가 포함됩니다.

제공자 자격 증명에는 다음 신뢰할 수 있는 소스 중 하나를 사용하세요.

- 셸, launchd/systemd 유닛, 컨테이너 secret 또는 CI secret 같은 Gateway 프로세스 환경.
- `~/.openclaw/.env` 또는 `$OPENCLAW_STATE_DIR/.env`의 전역 런타임 dotenv 파일.
- `~/.openclaw/openclaw.json`의 config `env` 블록.
- `env.shellEnv.enabled` 또는 `OPENCLAW_LOAD_SHELL_ENV=1`이 활성화된 경우 선택적 로그인 셸 가져오기.

이전에 제공자 키를 작업공간 `.env`에만 저장했다면 위의 신뢰할 수 있는 소스 중 하나로 옮기세요. 작업공간 `.env`는 자격 증명, 엔드포인트 리디렉션, 호스트 override 또는 `OPENCLAW_*` 런타임 제어 값이 아닌 일반 프로젝트 변수에는 계속 사용할 수 있습니다.

보안 근거는 [작업공간 `.env` 파일](/ko/gateway/security#workspace-env-files)을 참고하세요.

## Config `env` 블록

인라인 env var를 설정하는 두 가지 동등한 방법입니다(둘 다 덮어쓰지 않음).

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

config `env` 블록은 리터럴 문자열 값만 허용합니다. `file:...` 값을 확장하지 않습니다. 예를 들어 `XAI_API_KEY: "file:secrets/xai-api-key.txt"`는 정확히 그 문자열 그대로 제공자에 전달됩니다.

파일 기반 제공자 키에는 이를 지원하는 자격 증명 필드에서 SecretRef를 사용하세요.

```json5
{
  secrets: {
    providers: {
      xai_key_file: {
        source: "file",
        path: "~/.openclaw/secrets/xai-api-key.txt",
        mode: "singleValue",
      },
    },
  },
  models: {
    providers: {
      xai: {
        apiKey: { source: "file", provider: "xai_key_file", id: "value" },
      },
    },
  },
}
```

지원되는 필드는 [Secrets Management](/ko/gateway/secrets)와 [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참고하세요.

## 셸 env 가져오기

`env.shellEnv`는 로그인 셸을 실행하고 **누락된** 예상 키만 가져옵니다.

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

동등한 env var:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Exec 셸 스냅샷

Windows가 아닌 Gateway 호스트에서는 bash와 zsh `exec` 명령이 기본적으로 시작 시점 스냅샷을 사용합니다.
이 경로를 비활성화하려면 Gateway 프로세스 환경에 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`을 설정하세요.
`false`, `no`, `off` 값도 이를 비활성화합니다. 호출별 `exec.env` 값으로는 스냅샷을 토글하거나 스냅샷 캐시를 리디렉션할 수 없습니다.

## 런타임 주입 env var

OpenClaw는 생성된 자식 프로세스에도 컨텍스트 마커를 주입합니다.

- `OPENCLAW_SHELL=exec`: `exec` 도구를 통해 실행되는 명령에 설정됩니다.
- `OPENCLAW_SHELL=acp`: ACP 런타임 백엔드 프로세스 생성에 설정됩니다(예: `acpx`).
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client`가 ACP 브리지 프로세스를 생성할 때 설정됩니다.
- `OPENCLAW_SHELL=tui-local`: 로컬 TUI `!` 셸 명령에 설정됩니다.
- `OPENCLAW_CLI=1`: CLI 진입점이 생성한 자식 프로세스에 설정됩니다.

이 값들은 런타임 마커입니다(필수 사용자 config가 아님). 셸/프로필 로직에서 컨텍스트별 규칙을 적용하는 데 사용할 수 있습니다.

## UI env var

- `OPENCLAW_THEME=light`: 터미널 배경이 밝을 때 밝은 TUI 팔레트를 강제로 사용합니다.
- `OPENCLAW_THEME=dark`: 어두운 TUI 팔레트를 강제로 사용합니다.
- `COLORFGBG`: 터미널이 이를 내보내는 경우 OpenClaw는 배경색 힌트를 사용해 TUI 팔레트를 자동 선택합니다.

## config의 env var 치환

`${VAR_NAME}` 구문을 사용해 config 문자열 값에서 env var를 직접 참조할 수 있습니다.

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

전체 내용은 [Configuration: env var 치환](/ko/gateway/configuration-reference#env-var-substitution)을 참고하세요.

## Secret ref와 `${ENV}` 문자열

OpenClaw는 env 기반 패턴 두 가지를 지원합니다.

- config 값의 `${VAR}` 문자열 치환.
- secret 참조를 지원하는 필드용 SecretRef 객체(`{ source: "env", provider: "default", id: "VAR" }`).

둘 다 활성화 시점의 프로세스 env에서 해석됩니다. SecretRef 세부 사항은 [Secrets Management](/ko/gateway/secrets)에 문서화되어 있습니다.
config `env` 블록 자체는 SecretRef 또는 `file:...` 축약 값을 해석하지 않습니다.

## 경로 관련 env var

| 변수                     | 목적                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 내부 OpenClaw 경로 기본값(`~/.openclaw/`, 에이전트 디렉터리, 세션, 자격 증명, 설치 프로그램 온보딩, 기본 개발 체크아웃)에 사용되는 홈 디렉터리를 override합니다. OpenClaw를 전용 서비스 사용자로 실행할 때 유용합니다. |
| `OPENCLAW_STATE_DIR`     | 상태 디렉터리를 override합니다(기본값 `~/.openclaw`).                                                                                                                                                                                          |
| `OPENCLAW_CONFIG_PATH`   | config 파일 경로를 override합니다(기본값 `~/.openclaw/openclaw.json`).                                                                                                                                                                         |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` 지시문이 config 디렉터리 밖의 파일을 해석할 수 있는 디렉터리의 경로 목록입니다(기본값: 없음 — `$include`는 config 디렉터리로 제한됨). 틸드 확장됨.                                                        |

## 로깅

| 변수                             | 목적                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 파일과 콘솔 모두의 로그 수준을 override합니다(예: `debug`, `trace`). config의 `logging.level` 및 `logging.consoleLevel`보다 우선합니다. 잘못된 값은 경고와 함께 무시됩니다. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 전역 debug 로그를 활성화하지 않고도 `info` 수준에서 대상 모델 요청/응답 타이밍 진단을 내보냅니다.                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 모델 payload 진단: `summary`, `tools` 또는 `full-redacted`. `full-redacted`는 크기가 제한되고 redaction되지만 prompt/message 텍스트를 포함할 수 있습니다.                    |
| `OPENCLAW_DEBUG_SSE`             | 스트리밍 진단: first/done 타이밍에는 `events`, 처음 다섯 개의 redaction된 SSE 이벤트를 포함하려면 `peek`.                                                                       |
| `OPENCLAW_DEBUG_CODE_MODE`       | 제공자 도구 숨김과 exec/wait 전용 강제를 포함한 code-mode 모델 표면 진단.                                                                                                           |

### `OPENCLAW_HOME`

설정되면 `OPENCLAW_HOME`은 내부 OpenClaw 경로 기본값에 대해 시스템 홈 디렉터리(`$HOME` / `os.homedir()`)를 대체합니다. 여기에는 기본 상태 디렉터리, config 경로, 에이전트 디렉터리, 자격 증명, 설치 프로그램 온보딩 작업공간, `openclaw update --channel dev`가 사용하는 기본 개발 체크아웃이 포함됩니다.

**우선순위:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android의 Termux `PREFIX` 홈 fallback > `os.homedir()`

**예시**(macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`은 틸드 경로(예: `~/svc`)로도 설정할 수 있으며, 사용 전에 동일한 OS 홈 fallback 체인을 사용해 확장됩니다.

`OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_GIT_DIR` 같은 명시적 경로 변수는 계속 우선합니다. 셸 시작 파일 감지, 패키지 관리자 설정, 호스트 `~` 확장 같은 OS 계정 작업은 여전히 실제 시스템 홈을 사용할 수 있습니다.

## nvm 사용자: web_fetch TLS 실패

Node.js가 시스템 패키지 관리자가 아니라 **nvm**으로 설치된 경우, 내장 `fetch()`는 nvm에 번들된 CA 저장소를 사용합니다. 이 저장소에는 최신 루트 CA(Let's Encrypt용 ISRG Root X1/X2, DigiCert Global Root G2 등)가 없을 수 있습니다. 이로 인해 대부분의 HTTPS 사이트에서 `web_fetch`가 `"fetch failed"`로 실패합니다.

Linux에서 OpenClaw는 nvm을 자동 감지하고 실제 시작 환경에 수정 사항을 적용합니다.

- `openclaw gateway install`은 systemd 서비스 환경에 `NODE_EXTRA_CA_CERTS`를 씁니다.
- `openclaw` CLI 진입점은 Node 시작 전에 `NODE_EXTRA_CA_CERTS`가 설정된 상태로 자기 자신을 다시 exec합니다.

**수동 수정(이전 버전 또는 직접 `node ...` 실행용):**

OpenClaw를 시작하기 전에 변수를 export하세요.

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

이 변수에 대해 `~/.openclaw/.env`에만 쓰는 방식에 의존하지 마세요. Node는 프로세스 시작 시 `NODE_EXTRA_CA_CERTS`를 읽습니다.

## 레거시 환경 변수

OpenClaw는 `OPENCLAW_*` 환경 변수만 읽습니다. 이전 릴리스의 레거시 `CLAWDBOT_*` 및 `MOLTBOT_*` 접두사는 조용히 무시됩니다.

Gateway 프로세스 시작 시 이 중 하나라도 설정되어 있으면 OpenClaw는 감지된 접두사와 총 개수를 나열하는 단일 Node 사용 중단 경고(`OPENCLAW_LEGACY_ENV_VARS`)를 내보냅니다. 레거시 접두사를 `OPENCLAW_`로 바꿔 각 값을 이름 변경하세요(예: `CLAWDBOT_GATEWAY_TOKEN` → `OPENCLAW_GATEWAY_TOKEN`). 이전 이름은 아무 효과가 없습니다.

## 관련 항목

- [Gateway 구성](/ko/gateway/configuration)
- [FAQ: env var와 .env 로딩](/ko/help/faq#env-vars-and-env-loading)
- [모델 개요](/ko/concepts/models)
