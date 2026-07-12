---
read_when:
    - 어떤 환경 변수가 어떤 순서로 로드되는지 알아야 합니다
    - Gateway에서 누락된 API 키를 디버깅하고 있습니다
    - 제공자 인증 또는 배포 환경을 문서화하는 경우
summary: OpenClaw이 환경 변수를 로드하는 위치와 우선순위
title: 환경 변수
x-i18n:
    generated_at: "2026-07-12T00:51:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e0010465008969ea1ebf7bb79d01ee86b7be20f7b6d0d90da72d8b0a3b1ed273
    source_path: help/environment.md
    workflow: 16
---

OpenClaw은 여러 소스에서 환경 변수를 가져옵니다. 규칙은 **기존 값을 절대 덮어쓰지 않는 것**입니다.
워크스페이스 `.env` 파일은 신뢰도가 낮은 소스입니다. OpenClaw은 우선순위를 적용하기 전에 워크스페이스 `.env`의 제공자 자격 증명과 보호된 런타임 제어 항목을 무시합니다.

## 우선순위(높은 순에서 낮은 순)

1. **프로세스 환경**(Gateway 프로세스가 상위 셸/데몬으로부터 이미 받은 환경).
2. **현재 작업 디렉터리의 `.env`**(dotenv 기본값, 덮어쓰지 않음, 제공자 자격 증명과 보호된 런타임 제어 항목은 무시됨).
3. `~/.openclaw/.env`의 **전역 `.env`**(`$OPENCLAW_STATE_DIR/.env`라고도 함, 제공자 API 키에 권장, 덮어쓰지 않음).
4. `~/.openclaw/openclaw.json`의 **구성 `env` 블록**(값이 없을 때만 적용).
5. **선택적 로그인 셸 가져오기**(`env.shellEnv.enabled` 또는 `OPENCLAW_LOAD_SHELL_ENV=1`, 예상 키가 없을 때만 적용).

기본 상태 디렉터리를 사용하는 신규 Ubuntu 설치에서는 OpenClaw이 전역 `.env` 다음의 호환성 대체 경로로 `~/.config/openclaw/gateway.env`도 취급합니다. 두 파일이 모두 존재하고 값이 서로 다르면 OpenClaw은 `~/.openclaw/.env`의 값을 유지하고 경고를 출력합니다.

구성 파일 자체가 없으면 4단계는 건너뛰며, 셸 가져오기가 활성화되어 있으면 계속 실행됩니다.

## 제공자 자격 증명과 워크스페이스 `.env`

제공자 API 키를 워크스페이스 `.env`에만 보관하지 마세요. OpenClaw은 알려진 모든 제공자 인증 환경 변수(예: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY`)를 포함하여 광범위한 제공자 자격 증명 및 엔드포인트 리디렉션 키를 워크스페이스 `.env` 파일에서 차단합니다. 또한 `_API_HOST`, `_BASE_URL`, `_HOMESERVER`로 끝나는 모든 키와 `OPENCLAW_*`, `CLAWHUB_*`, `ANTHROPIC_API_KEY_*`, `OPENAI_API_KEY_*` 네임스페이스 전체도 차단합니다.

대신 다음 신뢰할 수 있는 소스 중 하나를 제공자 자격 증명에 사용하세요.

- 셸, launchd/systemd 유닛, 컨테이너 시크릿, CI 시크릿 등의 Gateway 프로세스 환경.
- `~/.openclaw/.env` 또는 `$OPENCLAW_STATE_DIR/.env`의 전역 런타임 dotenv 파일.
- `~/.openclaw/openclaw.json`의 구성 `env` 블록.
- `env.shellEnv.enabled` 또는 `OPENCLAW_LOAD_SHELL_ENV=1`이 활성화된 경우 선택적 로그인 셸 가져오기.

이전에 제공자 키를 워크스페이스 `.env`에만 저장했다면 위의 신뢰할 수 있는 소스 중 하나로 옮기세요. 워크스페이스 `.env`는 자격 증명, 엔드포인트 리디렉션, 호스트 재정의 또는 `OPENCLAW_*` 런타임 제어 항목이 아닌 일반 프로젝트 변수를 계속 제공할 수 있습니다.

보안 근거는 [워크스페이스 `.env` 파일](/ko/gateway/security#workspace-env-files)을 참조하세요.

## 구성 `env` 블록

인라인 환경 변수를 설정하는 동등한 두 가지 방법은 다음과 같습니다(둘 다 기존 값을 덮어쓰지 않음).

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

구성 `env` 블록은 리터럴 문자열 값만 허용합니다. `file:...` 값을 확장하지 않습니다. 예를 들어 `XAI_API_KEY: "file:secrets/xai-api-key.txt"`는 해당 문자열 그대로 제공자에 전달됩니다.

파일 기반 제공자 키의 경우 이를 지원하는 자격 증명 필드에서 SecretRef를 사용하세요.

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

지원되는 필드는 [시크릿 관리](/ko/gateway/secrets)와 [SecretRef 자격 증명 표면](/ko/reference/secretref-credential-surface)을 참조하세요.

## 셸 환경 가져오기

`env.shellEnv`는 로그인 셸을 실행하고 예상 키 중 **누락된** 키만 가져옵니다.

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

동등한 환경 변수:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`(기본값 `15000`)

## Exec 셸 스냅샷

Windows가 아닌 Gateway 호스트에서 bash 및 zsh `exec` 명령은 기본적으로 시작 시점 스냅샷을 사용합니다.
이 경로를 비활성화하려면 Gateway 프로세스 환경에서 `OPENCLAW_EXEC_SHELL_SNAPSHOT=0`을 설정하세요.
`false`, `no`, `off` 값으로도 비활성화할 수 있습니다. 호출별 `exec.env` 값으로는
스냅샷을 전환하거나 스냅샷 캐시를 리디렉션할 수 없습니다.

## 런타임에서 주입되는 환경 변수

OpenClaw은 생성된 자식 프로세스에 컨텍스트 표식도 주입합니다.

- `OPENCLAW_SHELL=exec`: `exec` 도구를 통해 실행되는 명령에 설정됩니다.
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client`가 ACP 브리지 프로세스를 생성할 때 설정됩니다.
- `OPENCLAW_SHELL=tui-local`: 로컬 TUI `!` 셸 명령에 설정됩니다.
- `OPENCLAW_CLI=1`: CLI 진입점이 생성하는 자식 프로세스에 설정됩니다.

이는 런타임 표식이며 사용자가 반드시 구성할 필요는 없습니다. 셸/프로필 로직에서
컨텍스트별 규칙을 적용하는 데 사용할 수 있습니다.

## UI 환경 변수

- `OPENCLAW_THEME=light`: 터미널 배경이 밝을 때 밝은 TUI 팔레트를 강제로 사용합니다.
- `OPENCLAW_THEME=dark`: 어두운 TUI 팔레트를 강제로 사용합니다.
- `COLORFGBG`: 터미널에서 이 변수를 내보내면 OpenClaw은 배경색 힌트를 사용하여 TUI 팔레트를 자동 선택합니다.

## 구성의 환경 변수 치환

`${VAR_NAME}` 구문을 사용하여 구성 문자열 값에서 환경 변수를 직접 참조할 수 있습니다.

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

자세한 내용은 [구성: 환경 변수 치환](/ko/gateway/configuration-reference#env-var-substitution)을 참조하세요.

## 시크릿 참조와 `${ENV}` 문자열 비교

OpenClaw은 환경 변수 기반 패턴 두 가지를 지원합니다.

- 구성 값의 `${VAR}` 문자열 치환.
- 시크릿 참조를 지원하는 필드의 SecretRef 객체(`{ source: "env", provider: "default", id: "VAR" }`).

둘 다 활성화 시점에 프로세스 환경에서 값을 해석합니다. SecretRef에 대한 자세한 내용은 [시크릿 관리](/ko/gateway/secrets)에 설명되어 있습니다.
구성 `env` 블록 자체는 SecretRef나 `file:...`
축약 값을 해석하지 않습니다.

## 경로 관련 환경 변수

| 변수                     | 용도                                                                                                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`          | 내부 OpenClaw 경로 기본값(`~/.openclaw/`, 에이전트 디렉터리, 세션, 자격 증명, 설치 프로그램 온보딩, 기본 개발 체크아웃)에 사용되는 홈 디렉터리를 재정의합니다. OpenClaw을 전용 서비스 사용자로 실행할 때 유용합니다. |
| `OPENCLAW_STATE_DIR`     | 상태 디렉터리를 재정의합니다(기본값 `~/.openclaw`).                                                                                                                                                                                         |
| `OPENCLAW_CONFIG_PATH`   | 구성 파일 경로를 재정의합니다(기본값 `~/.openclaw/openclaw.json`).                                                                                                                                                                          |
| `OPENCLAW_INCLUDE_ROOTS` | `$include` 지시문이 구성 디렉터리 외부의 파일을 해석할 수 있는 디렉터리의 경로 목록입니다(기본값: 없음 - `$include`는 구성 디렉터리로 제한됨). 물결표가 확장됩니다.                                                                             |

## 로깅

| 변수                             | 용도                                                                                                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL`             | 파일과 콘솔 모두의 로그 수준을 재정의합니다(예: `debug`, `trace`). 구성의 `logging.level`과 `logging.consoleLevel`보다 우선합니다. 잘못된 값은 경고와 함께 무시됩니다. |
| `OPENCLAW_DEBUG_MODEL_TRANSPORT` | 전역 디버그 로그를 활성화하지 않고 `info` 수준에서 선별된 모델 요청/응답 타이밍 진단을 출력합니다.                                                                                                  |
| `OPENCLAW_DEBUG_MODEL_PAYLOAD`   | 모델 페이로드 진단: `summary`, `tools`, `full-redacted`. `full-redacted`는 크기가 제한되고 민감 정보가 삭제되지만 프롬프트/메시지 텍스트가 포함될 수 있습니다.                                        |
| `OPENCLAW_DEBUG_SSE`             | 스트리밍 진단: 최초/완료 타이밍을 위한 `events`, 민감 정보가 삭제된 최초 5개 SSE 이벤트를 포함하는 `peek`.                                                                                           |
| `OPENCLAW_DEBUG_CODE_MODE`       | 제공자 도구 숨김과 간결한 제어/직접 실행 강제를 포함한 코드 모드 모델 표면 진단입니다.                                                                                                              |

### `OPENCLAW_HOME`

설정된 경우 `OPENCLAW_HOME`은 내부 OpenClaw 경로 기본값에 사용되는 시스템 홈 디렉터리(`$HOME` / `os.homedir()`)를 대체합니다. 여기에는 기본 상태 디렉터리, 구성 경로, 에이전트 디렉터리, 자격 증명, 설치 프로그램 온보딩 워크스페이스, `openclaw update --channel dev`에서 사용하는 기본 개발 체크아웃이 포함됩니다.

**우선순위:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > Android의 Termux `PREFIX` 홈 대체 경로 > `os.homedir()`

**예시**(macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`은 물결표 경로(예: `~/svc`)로도 설정할 수 있으며, 사용 전에 동일한 OS 홈 대체 체인을 사용하여 확장됩니다.

`OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_GIT_DIR` 같은 명시적 경로 변수는 여전히 우선합니다. 셸 시작 파일 감지, 패키지 관리자 설정, 호스트 `~` 확장 같은 OS 계정 작업에서는 여전히 실제 시스템 홈을 사용할 수 있습니다.

## nvm 사용자: web_fetch TLS 실패

Node.js를 시스템 패키지 관리자가 아닌 **nvm**을 통해 설치한 경우, 기본 제공 `fetch()`는
nvm에 번들된 CA 저장소를 사용하며 최신 루트 CA(Let's Encrypt의 ISRG Root X1/X2,
DigiCert Global Root G2 등)가 없을 수 있습니다. 이로 인해 대부분의 HTTPS 사이트에서 `web_fetch`가 `"fetch failed"` 오류로 실패합니다.

Linux에서 OpenClaw은 nvm을 자동으로 감지하고 실제 시작 환경에 수정 사항을 적용합니다.

- `openclaw gateway install`은 systemd 서비스 환경에 `NODE_EXTRA_CA_CERTS`를 기록합니다.
- `openclaw` CLI 진입점은 Node가 시작되기 전에 `NODE_EXTRA_CA_CERTS`를 설정한 상태로 자체 프로세스를 다시 실행합니다.

**수동 수정(이전 버전 또는 직접 `node ...`를 실행하는 경우):**

OpenClaw을 시작하기 전에 변수를 내보내세요.

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

이 변수는 `~/.openclaw/.env`에만 기록하는 방식에 의존하지 마세요. Node는
프로세스 시작 시 `NODE_EXTRA_CA_CERTS`를 읽습니다.

## 레거시 환경 변수

OpenClaw은 `OPENCLAW_*` 환경 변수만 읽습니다. 이전 릴리스의 레거시
`CLAWDBOT_*` 및 `MOLTBOT_*` 접두사는 아무 알림 없이
무시됩니다.

Gateway 프로세스가 시작될 때 이러한 변수가 설정되어 있으면 OpenClaw은
감지된 접두사와 총개수를 나열하는 단일 Node 지원 중단 경고(`OPENCLAW_LEGACY_ENV_VARS`)를
출력합니다. 레거시 접두사를 `OPENCLAW_`로 바꾸어 각 변수의 이름을 변경하세요(예: `CLAWDBOT_GATEWAY_TOKEN`을
`OPENCLAW_GATEWAY_TOKEN`으로 변경). 이전 이름은 아무 효과가 없습니다.

## 관련 문서

- [Gateway 구성](/ko/gateway/configuration)
- [FAQ: 환경 변수와 .env 로드](/ko/help/faq#env-vars-and-env-loading)
- [모델 개요](/ko/concepts/models)
