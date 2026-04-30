---
read_when:
    - 어떤 환경 변수가 어떤 순서로 로드되는지 알아야 합니다
    - Gateway에서 누락된 API 키를 디버깅하고 있습니다
    - 제공자 인증 또는 배포 환경을 문서화하고 있습니다
summary: OpenClaw가 환경 변수를 로드하는 위치와 우선순위
title: 환경 변수
x-i18n:
    generated_at: "2026-04-30T06:34:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: d19b9053207a088b3eb39d03e36fc2d415295feb80da51bd71339884466b101b
    source_path: help/environment.md
    workflow: 16
---

OpenClaw는 여러 소스에서 환경 변수를 가져옵니다. 규칙은 **기존 값을 절대 재정의하지 않음**입니다.

## 우선순위(높음 → 낮음)

1. **프로세스 환경**(Gateway 프로세스가 이미 부모 셸/데몬에서 받은 값).
2. **현재 작업 디렉터리의 `.env`**(dotenv 기본값, 재정의하지 않음).
3. **전역 `.env`**: `~/.openclaw/.env`(일명 `$OPENCLAW_STATE_DIR/.env`, 재정의하지 않음).
4. **`~/.openclaw/openclaw.json`의 설정 `env` 블록**(없는 경우에만 적용).
5. **선택적 로그인 셸 가져오기**(`env.shellEnv.enabled` 또는 `OPENCLAW_LOAD_SHELL_ENV=1`), 누락된 예상 키에만 적용.

기본 상태 디렉터리를 사용하는 Ubuntu 새 설치에서는 OpenClaw가 전역 `.env` 이후의 호환성 대체 항목으로 `~/.config/openclaw/gateway.env`도 처리합니다. 두 파일이 모두 있고 서로 다른 경우 OpenClaw는 `~/.openclaw/.env`를 유지하고 경고를 출력합니다.

설정 파일이 아예 없으면 4단계는 건너뜁니다. 셸 가져오기는 활성화된 경우 계속 실행됩니다.

## 설정 `env` 블록

인라인 환경 변수를 설정하는 두 가지 동등한 방법입니다(둘 다 재정의하지 않음).

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

## 셸 환경 가져오기

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

환경 변수 동등 항목:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## 런타임 주입 환경 변수

OpenClaw는 생성된 자식 프로세스에도 컨텍스트 마커를 주입합니다.

- `OPENCLAW_SHELL=exec`: `exec` 도구를 통해 실행되는 명령에 설정됩니다.
- `OPENCLAW_SHELL=acp`: ACP 런타임 백엔드 프로세스 생성에 설정됩니다(예: `acpx`).
- `OPENCLAW_SHELL=acp-client`: `openclaw acp client`가 ACP 브리지 프로세스를 생성할 때 설정됩니다.
- `OPENCLAW_SHELL=tui-local`: 로컬 TUI `!` 셸 명령에 설정됩니다.

이들은 런타임 마커입니다(필수 사용자 설정이 아님). 셸/프로필 로직에서
컨텍스트별 규칙을 적용하는 데 사용할 수 있습니다.

## UI 환경 변수

- `OPENCLAW_THEME=light`: 터미널 배경이 밝을 때 밝은 TUI 팔레트를 강제로 사용합니다.
- `OPENCLAW_THEME=dark`: 어두운 TUI 팔레트를 강제로 사용합니다.
- `COLORFGBG`: 터미널이 이를 내보내는 경우 OpenClaw는 배경색 힌트를 사용해 TUI 팔레트를 자동 선택합니다.

## 설정의 환경 변수 치환

`${VAR_NAME}` 구문을 사용하여 설정 문자열 값에서 환경 변수를 직접 참조할 수 있습니다.

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

전체 자세한 내용은 [설정: 환경 변수 치환](/ko/gateway/configuration-reference#env-var-substitution)을 참고하세요.

## 비밀 참조와 `${ENV}` 문자열

OpenClaw는 두 가지 환경 기반 패턴을 지원합니다.

- 설정 값의 `${VAR}` 문자열 치환.
- 비밀 참조를 지원하는 필드용 SecretRef 객체(`{ source: "env", provider: "default", id: "VAR" }`).

둘 다 활성화 시점에 프로세스 환경에서 확인됩니다. SecretRef 세부 정보는 [비밀 관리](/ko/gateway/secrets)에 문서화되어 있습니다.

## 경로 관련 환경 변수

| 변수                   | 목적                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | 모든 내부 경로 확인에 사용되는 홈 디렉터리를 재정의합니다(`~/.openclaw/`, 에이전트 디렉터리, 세션, 자격 증명). OpenClaw를 전용 서비스 사용자로 실행할 때 유용합니다. |
| `OPENCLAW_STATE_DIR`   | 상태 디렉터리를 재정의합니다(기본값 `~/.openclaw`).                                                                                                                     |
| `OPENCLAW_CONFIG_PATH` | 설정 파일 경로를 재정의합니다(기본값 `~/.openclaw/openclaw.json`).                                                                                                      |

## 로깅

| 변수                 | 목적                                                                                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | 파일과 콘솔 모두의 로그 수준을 재정의합니다(예: `debug`, `trace`). 설정의 `logging.level` 및 `logging.consoleLevel`보다 우선합니다. 잘못된 값은 경고와 함께 무시됩니다. |

### `OPENCLAW_HOME`

설정되면 `OPENCLAW_HOME`은 모든 내부 경로 확인에서 시스템 홈 디렉터리(`$HOME` / `os.homedir()`)를 대체합니다. 이를 통해 헤드리스 서비스 계정의 전체 파일 시스템 격리가 가능합니다.

**우선순위:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**예시**(macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME`은 물결표 경로(예: `~/svc`)로도 설정할 수 있으며, 사용 전에 `$HOME`을 사용하여 확장됩니다.

## nvm 사용자: web_fetch TLS 실패

Node.js가 **nvm**을 통해 설치된 경우(시스템 패키지 관리자가 아님), 내장 `fetch()`는
nvm에 번들된 CA 저장소를 사용하며, 이 저장소에는 최신 루트 CA(Let's Encrypt의 ISRG Root X1/X2,
DigiCert Global Root G2 등)가 없을 수 있습니다. 이로 인해 대부분의 HTTPS 사이트에서 `web_fetch`가 `"fetch failed"`로 실패합니다.

Linux에서 OpenClaw는 nvm을 자동으로 감지하고 실제 시작 환경에 수정 사항을 적용합니다.

- `openclaw gateway install`은 systemd 서비스 환경에 `NODE_EXTRA_CA_CERTS`를 씁니다
- `openclaw` CLI 엔트리포인트는 Node 시작 전에 `NODE_EXTRA_CA_CERTS`가 설정된 상태로 자체를 다시 실행합니다

**수동 수정(이전 버전 또는 직접 `node ...` 실행용):**

OpenClaw를 시작하기 전에 변수를 내보내세요.

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

이 변수에 대해 `~/.openclaw/.env`에만 쓰는 것에 의존하지 마세요. Node는 프로세스 시작 시
`NODE_EXTRA_CA_CERTS`를 읽습니다.

## 레거시 환경 변수

OpenClaw는 `OPENCLAW_*` 환경 변수만 읽습니다. 이전 릴리스의 레거시
`CLAWDBOT_*` 및 `MOLTBOT_*` 접두사는 조용히
무시됩니다.

시작 시 Gateway 프로세스에 이러한 변수가 아직 설정되어 있으면 OpenClaw는
감지된 접두사와 총 개수를 나열하는 단일 Node 지원 중단 경고(`OPENCLAW_LEGACY_ENV_VARS`)를 내보냅니다. 각 값을 레거시 접두사를 `OPENCLAW_`로 바꾸어 이름을 변경하세요(예: `CLAWDBOT_GATEWAY_TOKEN` →
`OPENCLAW_GATEWAY_TOKEN`). 이전 이름은 아무 효과가 없습니다.

## 관련 항목

- [Gateway 설정](/ko/gateway/configuration)
- [FAQ: 환경 변수 및 .env 로딩](/ko/help/faq#env-vars-and-env-loading)
- [모델 개요](/ko/concepts/models)
