---
read_when:
    - exec 승인 또는 허용 목록 구성하기
    - macOS 앱에서 exec 승인 UX 구현하기
    - 샌드박스 탈출 프롬프트와 그 영향 검토
sidebarTitle: Exec approvals
summary: '호스트 exec 승인: 정책 설정, 허용 목록 및 YOLO/엄격 워크플로 삽입'
title: 실행 승인
x-i18n:
    generated_at: "2026-07-12T15:48:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b44efdfe5a6c9f3cc978baef91d80d1f75d39627d3a16f5971800809a642a72c
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 승인은 샌드박스 처리된 에이전트가 실제 호스트(`gateway` 또는 `node`)에서 명령을 실행할 수 있도록 하는 **컴패니언 앱/노드 호스트 보호 장치**입니다. 정책 + 허용 목록 + (선택적) 사용자 승인이 모두 일치할 때만 명령이 실행됩니다. 승인은 도구 정책과 상승된 권한 게이팅 **위에 추가로** 적용됩니다(상승된 권한 `full`은 이를 건너뜁니다).

`deny`, `allowlist`, `ask`, `auto`, `full`, Codex Guardian 매핑 및 ACPX 하네스 권한을 모드 중심으로 개괄한 내용은 [권한 모드](/ko/tools/permission-modes)를 참조하십시오.

<Note>
유효 정책은 `tools.exec.*`와 승인 기본값 중 **더 엄격한** 쪽입니다. 승인은 구성에서 파생된 보안/질문 정책을 강화할 수만 있으며 완화할 수는 없습니다. 승인 필드가 생략되면 `tools.exec` 값이 사용됩니다. 호스트 Exec은 해당 머신의 로컬 승인 상태도 사용합니다. 실행 호스트 승인 파일에 호스트 로컬 `ask: "always"`가 있으면 세션 또는 구성 기본값이 `ask: "on-miss"`를 요청하더라도 계속 확인 메시지가 표시됩니다.
</Note>

## 적용 위치

Exec 승인은 실행 호스트에서 로컬로 적용됩니다.

- **Gateway 호스트** -> Gateway 머신의 `openclaw` 프로세스입니다.
- **Node 호스트** -> Node 실행기(macOS 컴패니언 앱 또는 헤드리스 Node 호스트)입니다.

### 신뢰 모델

- Gateway 인증을 거친 호출자는 해당 Gateway의 신뢰할 수 있는 운영자입니다.
- 페어링된 Node는 신뢰할 수 있는 운영자 기능을 Node 호스트까지 확장합니다.
- 승인은 우발적 실행 위험을 줄이지만, 사용자별 인증 경계 또는 파일 시스템 읽기 전용 정책은 **아닙니다**.
- 명령이 승인되면 선택한 호스트 또는 샌드박스 파일 시스템 권한에 따라 파일을 변경할 수 있습니다.
- 승인된 Node 호스트 실행은 정규 실행 컨텍스트인 cwd, 정확한 argv, 존재하는 경우 env 바인딩, 해당하는 경우 고정된 실행 파일 경로를 바인딩합니다.
- 셸 스크립트 및 직접적인 인터프리터/런타임 파일 호출의 경우 OpenClaw는 구체적인 로컬 파일 피연산자 하나도 바인딩하려고 시도합니다. 승인 후 실행 전에 해당 파일이 변경되면 변경된 콘텐츠를 실행하는 대신 실행을 거부합니다.
- 파일 바인딩은 최선형 방식이며, 모든 인터프리터/런타임 로더 경로를 완전히 모델링하지는 않습니다. 구체적인 로컬 파일을 정확히 하나 식별할 수 없으면 OpenClaw는 완전히 처리하는 것처럼 가장하지 않고 승인 기반 실행 생성을 거부합니다.

### macOS 분리 구조

- **Node 호스트 서비스**는 로컬 IPC를 통해 `system.run`을 **macOS 앱**으로 전달합니다.
- **macOS 앱**은 승인을 적용하고 UI 컨텍스트에서 명령을 실행합니다.

## 유효 정책 검사

| 명령                                                             | 표시되는 내용                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 요청된 정책, 호스트 정책 출처 및 유효 결과입니다.                                      |
| `openclaw exec-policy show`                                      | 로컬 머신의 병합된 보기입니다.                                                         |
| `openclaw exec-policy set` / `preset`                            | 로컬 요청 정책을 로컬 호스트 승인 파일과 한 단계로 동기화합니다.                      |

<Note>
세션별 `/exec` 재정의는 포함되지 않습니다. 관련 세션에서 `/exec`를 실행하여 현재 기본값을 검사하십시오. [세션 재정의](/ko/tools/exec#session-overrides-exec)를 참조하십시오.
</Note>

전체 CLI 참조(플래그, JSON 출력, 허용 목록 추가/제거): [승인 CLI](/ko/cli/approvals).

로컬 범위에서 `host=node`를 요청하면 `exec-policy show`는 로컬 승인 파일을 신뢰할 수 있는 출처로 취급하지 않고 해당 범위를 런타임에 Node가 관리하는 것으로 보고합니다.

컴패니언 앱 UI를 사용할 수 **없는** 경우 일반적으로 확인 메시지를 표시하는 모든 요청은 **질문 폴백**(기본값: `deny`)으로 처리됩니다.

<Tip>
네이티브 채팅 승인 클라이언트는 대기 중인 승인 메시지에 채널별 기능을 미리 제공할 수 있습니다. Matrix는 메시지에 폴백으로 `/approve ...`를 계속 포함하면서 반응 바로 가기(`✅` 한 번 허용, `♾️` 항상 허용, `❌` 거부)를 제공합니다.
</Tip>

## 설정 및 저장소

승인은 실행 호스트의 로컬 JSON 파일에 저장됩니다. `OPENCLAW_STATE_DIR`이 설정되어 있으면 파일은 해당 상태 디렉터리를 따르며, 그렇지 않으면 기본 OpenClaw 상태 디렉터리를 사용합니다.

```text
$OPENCLAW_STATE_DIR/exec-approvals.json
# 그렇지 않은 경우
~/.openclaw/exec-approvals.json
```

기본 승인 소켓도 동일한 루트를 따릅니다.
`$OPENCLAW_STATE_DIR/exec-approvals.sock` 또는 변수가 설정되지 않은 경우
`~/.openclaw/exec-approvals.sock`입니다.

2026.6.6 이전 릴리스에서는 파일을 항상 `~/.openclaw`에 보관했습니다. `OPENCLAW_STATE_DIR`이 다른 위치를 가리키는데 승인 파일이 여전히 기본 디렉터리에 있으면 `openclaw doctor --fix`를 한 번 직접 실행하여 상태 디렉터리로 가져오십시오(원본은 `.migrated` 접미사와 함께 보관됩니다). 대화형 doctor에서도 가져오기를 미리 보고 확인할 수 있습니다. 자동화된 업데이트 및 Gateway 감시 복구 실행에서는 상태 디렉터리 간 가져오기를 수행하지 않습니다. 임시 또는 스테이징 상태 디렉터리가 기본 설치의 승인을 가져가서는 안 됩니다. 동일한 경계가 레거시 `plugin-binding-approvals.json`을 공유 SQLite 상태로 가져올 때도 적용됩니다.

스키마 예시:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "source": "allow-always",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 정책 설정

### `tools.exec.mode`

`tools.exec.mode`는 호스트 Exec에 권장되는 정규화된 정책 표면입니다.

| 값          | 동작                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | 호스트 Exec을 차단합니다.                                                                                                                                                 |
| `allowlist` | 허용 목록에 있는 명령만 묻지 않고 실행합니다.                                                                                                                             |
| `ask`       | 허용 목록 정책을 사용하고 일치하지 않을 때 확인합니다.                                                                                                                    |
| `auto`      | 허용 목록 정책을 사용하고, 결정적인 일치는 직접 실행하며, 승인 누락은 사람의 승인 경로로 폴백하기 전에 OpenClaw의 네이티브 자동 검토자에게 보냅니다.                      |
| `full`      | 승인 확인 메시지 없이 호스트 Exec을 실행합니다.                                                                                                                           |

레거시 `tools.exec.security` / `tools.exec.ask`도 계속 지원되며 해당 범위에서 `mode`가 설정되지 않은 모든 위치에 계속 적용됩니다.

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 모든 호스트 Exec 요청을 차단합니다.
  - `allowlist` - 허용 목록에 있는 명령만 허용합니다.
  - `full` - 모든 항목을 허용합니다(상승된 권한과 동일).

Gateway/Node 호스트의 기본값은 `full`이며, `sandbox` 호스트의 기본값은 대신 `deny`입니다.
</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  호스트 Exec에 대해 구성된 질문 정책입니다. `tools.exec.ask` 및 호스트 승인 기본값에 따른 기준 승인 확인 메시지 동작을 제어합니다. 기본값은 `off`입니다. 호출별 `ask` 도구 매개변수([Exec 도구](/ko/tools/exec#parameters) 참조)는 해당 기준을 강화할 수만 있으며, 채널에서 시작된 모델 호출은 유효 호스트 질문 설정이 `off`일 때 이를 무시합니다.

- `off` - 확인 메시지를 표시하지 않습니다.
- `on-miss` - 허용 목록과 일치하지 않을 때만 확인 메시지를 표시합니다.
- `always` - 모든 명령에서 확인 메시지를 표시합니다. 유효 질문 모드가 `always`이면 `allow-always`의 지속적 신뢰가 확인 메시지를 **억제하지 않습니다**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  확인 메시지가 필요하지만 접근 가능한 UI가 없거나 확인 시간이 초과된 경우의 처리 방식입니다. 생략하면 기본값은 `deny`입니다.

- `deny` - 차단합니다.
- `allowlist` - 허용 목록과 일치하는 경우에만 허용합니다.
- `full` - 허용합니다.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true`이면 인터프리터 바이너리 자체가 허용 목록에 있더라도 인라인 코드 평가 형식을 승인 전용으로 취급합니다. 안정적인 단일 파일 피연산자에 명확하게 매핑되지 않는 인터프리터 로더를 위한 심층 방어입니다.
</ParamField>

엄격 모드에서 감지하는 예: `python -c`, `node -e`/`--eval`/`-p`, `ruby -e`, `perl -e`/`-E`, `php -r`, `lua -e`, `osascript -e`(`awk`, `sed`, `make`, `find -exec` 및 `xargs` 인라인 형식도 포함).

엄격 모드에서 이러한 명령에는 검토자 또는 명시적 승인이 필요합니다. `tools.exec.mode: "auto"`에서는 명령에 적용 가능한 계획이 있으면 검토자가 위험이 낮은 실행을 한 번 허용할 수 있으며, 그렇지 않으면 OpenClaw가 사람에게 승인을 요청합니다.
검토자 폴백에 도달한 `Codex app-server` 명령 승인은 승인 요청에 적용 가능한 확인된 실행 파일이 노출되지 않으므로 사람에게 승인을 요청합니다.
`allow-always`는 인라인 평가 명령의 새 허용 목록 항목을 영구 저장하지 않습니다.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  표시에만 사용됩니다. 활성화하면 OpenClaw가 파서에서 파생된 명령 범위를 첨부하여 웹 승인 확인 메시지에서 명령 토큰을 강조할 수 있습니다. `security`, `ask`, 허용 목록 일치, 엄격한 인라인 평가 동작, 승인 전달 또는 명령 실행은 변경하지 **않습니다**.
</ParamField>

전역으로 `tools.exec.commandHighlighting` 아래에 설정하거나 에이전트별로 `agents.list[].tools.exec.commandHighlighting` 아래에 설정하십시오.

## YOLO 모드(승인 없음)

승인 확인 메시지 없이 호스트 Exec을 실행하려면 OpenClaw 구성의 요청된 Exec 정책(`tools.exec.*`)과 실행 호스트 승인 파일의 호스트 로컬 승인 정책이라는 **두** 정책 계층을 모두 개방하십시오.

생략된 `askFallback`의 기본값은 `deny`입니다. UI가 없는 승인 확인 메시지가 허용으로 폴백해야 하는 경우 호스트 `askFallback`을 `full`로 명시적으로 설정하십시오.

| 계층                  | YOLO 설정                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node`에서 `full` |
| `tools.exec.ask`      | `off`                      |
| 호스트 `askFallback` | `full`                     |

<Warning>
**중요한 차이점:**

- `tools.exec.host=auto`는 Exec이 실행될 **위치**를 선택합니다. 샌드박스를 사용할 수 있으면 샌드박스에서, 그렇지 않으면 Gateway에서 실행됩니다.
- YOLO는 호스트 Exec이 승인되는 **방식**을 선택합니다. `security=full`과 `ask=off`를 함께 사용합니다.
- YOLO는 구성된 호스트 Exec 정책 위에 별도의 휴리스틱 명령 난독화 승인 게이트 또는 스크립트 사전 검사 거부 계층을 추가하지 **않습니다**.
- `auto`는 샌드박스 처리된 세션에서 Gateway 라우팅을 자유롭게 재정의할 수 있게 하지 않습니다. 호출별 `host=node` 요청은 `auto`에서 허용되며, `host=gateway`는 활성 샌드박스 런타임이 없을 때만 `auto`에서 허용됩니다. 안정적인 비자동 기본값을 사용하려면 `tools.exec.host`를 설정하거나 `/exec host=...`를 명시적으로 사용하십시오.

</Warning>

자체 비대화형 권한 모드를 제공하는 CLI 기반 공급자는 이 정책을 따를 수 있습니다. OpenClaw의 유효 exec 정책이 YOLO이면 Claude CLI는 `--permission-mode bypassPermissions`를 추가합니다. OpenClaw가 관리하는 Claude 라이브 세션에서는 OpenClaw의 유효 exec 정책이 Claude의 기본 권한 모드보다 우선합니다. YOLO는 라이브 실행을 `--permission-mode bypassPermissions`로 정규화하고, 제한적인 유효 exec 정책은 원시 Claude 백엔드 인수가 다른 모드를 지정하더라도 라이브 실행을 `--permission-mode default`로 정규화합니다.

더 보수적으로 설정하려면 OpenClaw exec 정책을 `allowlist` / `on-miss` 또는 `deny`로 다시 강화하십시오.

### 영구 Gateway 호스트 "프롬프트 없음" 설정

<Steps>
  <Step title="요청할 구성 정책 설정">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="호스트 승인 파일 일치시키기">
    ```bash
    openclaw approvals set --stdin <<'EOF'
    {
      version: 1,
      defaults: {
        security: "full",
        ask: "off",
        askFallback: "full"
      }
    }
    EOF
    ```
  </Step>
</Steps>

### 로컬 단축 명령

```bash
openclaw exec-policy preset yolo
```

로컬 `tools.exec.host/security/ask`와 로컬 승인 파일의 기본값(`askFallback: "full"` 포함)을 모두 업데이트합니다. 의도적으로 로컬에만 적용됩니다. Gateway 호스트 또는 Node 호스트 승인을 원격으로 변경하려면 `openclaw approvals set --gateway` 또는 `openclaw approvals set --node
<id|name|ip>`를 사용하십시오.

그 밖의 기본 제공 프리셋으로는 `cautious`(`host=gateway`, `security=allowlist`, `ask=on-miss`, `askFallback=deny`)와 `deny-all`(`host=gateway`, `security=deny`, `ask=off`, `askFallback=deny`)이 있습니다. 같은 방식으로 `openclaw exec-policy preset cautious`를 적용하십시오.

전체 프리셋 대신 개별 필드를 설정하려면 다음 플래그 중 필요한 일부를 사용하여 `openclaw exec-policy set --host <auto|sandbox|gateway|node> --security
<deny|allowlist|full> --ask <off|on-miss|always> --ask-fallback
<deny|allowlist|full>`을 실행하십시오.

### Node 호스트

대신 Node에 동일한 승인 파일을 적용하십시오.

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

<Note>
**로컬 전용 제한 사항:**

- `openclaw exec-policy`는 Node 승인을 동기화하지 않습니다.
- `openclaw exec-policy set --host node`는 거부됩니다.
- Node exec 승인은 런타임에 Node에서 가져오므로, Node 대상 업데이트에는 `openclaw approvals --node ...`를 사용해야 합니다.

</Note>

### 세션 전용 단축 명령

- `/exec security=full ask=off`는 현재 세션만 변경합니다.
- `/elevated full`은 요청된 정책과 호스트 승인 파일이 모두 `security: "full"` 및 `ask: "off"`로 확인되는 경우에만 exec 승인을 건너뛰는 비상용 단축 명령입니다. `ask:
"always"`와 같이 더 엄격한 호스트 파일은 여전히 프롬프트를 표시합니다.

호스트 승인 파일이 구성보다 더 엄격하게 유지되면 더 엄격한 호스트 정책이 계속 우선합니다.

## 허용 목록(에이전트별)

허용 목록은 **에이전트별**입니다. 에이전트가 여러 개라면 macOS 앱에서 편집할 에이전트를 전환하십시오. 패턴은 glob으로 일치합니다.

패턴에는 해석된 바이너리 경로 glob 또는 경로 없는 명령 이름 glob을 사용할 수 있습니다. 경로 없는 이름은 `PATH`를 통해 호출된 명령에만 일치하므로, 명령이 `rg`이면 `rg`가 `/opt/homebrew/bin/rg`와 일치할 수 있지만 `./rg` 또는 `/tmp/rg`와는 **일치하지 않습니다**. 특정 바이너리 위치 하나를 신뢰하려면 경로 glob을 사용하십시오.

레거시 `agents.default` 항목은 로드 시 `agents.main`으로 마이그레이션됩니다. `echo ok && pwd`와 같은 셸 체인도 모든 최상위 세그먼트가 허용 목록 규칙을 충족해야 합니다.

예:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern으로 인수 제한하기

허용 목록 항목이 바이너리와 특정 인수 형태에 일치해야 하는 경우 `argPattern`을 추가하십시오. OpenClaw는 모든 호스트에서 ECMAScript(JavaScript) 정규식 의미 체계를 사용하며, 실행 파일 토큰(`argv[0]`)을 제외한 파싱된 명령 인수에 대해 표현식을 평가합니다. 직접 작성한 항목에서는 인수가 단일 공백으로 결합되므로 정확히 일치시켜야 할 때는 패턴에 앵커를 지정하십시오.

```json
{
  "version": 1,
  "agents": {
    "main": {
      "allowlist": [
        {
          "pattern": "python3",
          "argPattern": "^safe\\.py$"
        }
      ]
    }
  }
}
```

이 항목은 `python3 safe.py`를 허용하며 `python3 other.py`는 허용 목록에 일치하지 않습니다. 동일한 바이너리에 경로 전용 항목도 있으면 일치하지 않는 인수가 해당 경로 전용 항목으로 대체 일치할 수 있습니다. 바이너리를 선언된 인수로만 제한하려는 경우 경로 전용 항목을 생략하십시오.

승인 흐름으로 저장된 항목은 정확한 argv 일치를 위해 내부 구분자 형식을 사용합니다. 인코딩된 값을 직접 편집하는 대신 UI 또는 승인 흐름을 사용하여 해당 항목을 다시 생성하는 것이 좋습니다. OpenClaw가 명령 세그먼트의 argv를 파싱할 수 없으면 `argPattern`이 있는 항목은 일치하지 않습니다.

각 허용 목록 항목은 다음을 지원합니다.

| 필드               | 의미                                                   |
| ------------------ | ------------------------------------------------------ |
| `pattern`          | 해석된 바이너리 경로 glob 또는 경로 없는 명령 이름 glob |
| `argPattern`       | 선택적 ECMAScript argv 정규식. 생략하면 경로 전용      |
| `id`               | 안정적인 불투명 ID. 없으면 UUID로 생성                 |
| `source`           | `allow-always`와 같은 항목 출처                        |
| `commandText`      | 레거시 일반 텍스트 입력. 로드 중 폐기                  |
| `lastUsedAt`       | 마지막 사용 타임스탬프                                 |
| `lastUsedCommand`  | 마지막으로 일치한 명령                                  |
| `lastResolvedPath` | 마지막으로 해석된 바이너리 경로                         |

## Skills CLI 자동 허용

**Skills CLI 자동 허용**(`autoAllowSkills`)이 활성화되면 알려진 Skills에서 참조하는 실행 파일이 Node(macOS Node 또는 헤드리스 Node 호스트)의 허용 목록에 포함된 것으로 처리됩니다. 이 기능은 Gateway RPC를 통해 `skills.bins`를 사용하여 Skill 바이너리 목록을 가져옵니다. 엄격한 수동 허용 목록을 사용하려면 이 기능을 비활성화하십시오.

<Warning>
- 이는 수동 경로 허용 목록 항목과 별개인 **암시적 편의 허용 목록**입니다.
- Gateway와 Node가 동일한 신뢰 경계에 있는 신뢰할 수 있는 운영자 환경을 위한 기능입니다.
- 엄격하고 명시적인 신뢰가 필요하면 `autoAllowSkills: false`를 유지하고 수동 경로 허용 목록 항목만 사용하십시오.

</Warning>

## 안전한 바이너리와 승인 전달

안전한 바이너리(stdin 전용 빠른 경로), 인터프리터 바인딩 세부 정보, 승인 프롬프트를 Slack/Discord/Telegram으로 전달하는 방법(또는 네이티브 승인 클라이언트로 실행하는 방법)은 [Exec 승인 - 고급](/ko/tools/exec-approvals-advanced)을 참조하십시오.

## Control UI에서 편집하기

**Control UI -> Nodes -> Exec approvals** 카드에서 기본값, 에이전트별 재정의, 허용 목록을 편집하십시오. 범위(Defaults 또는 에이전트)를 선택하고 정책을 조정한 다음 허용 목록 패턴을 추가하거나 제거하고 **Save**를 누르십시오. UI에는 패턴별 마지막 사용 메타데이터가 표시되므로 목록을 깔끔하게 유지할 수 있습니다.

대상 선택기는 **Gateway**(로컬 승인) 또는 **Node**를 선택합니다. Node는 `system.execApprovals.get/set`을 제공한다고 알림해야 합니다(macOS 앱 또는 헤드리스 Node 호스트). Node가 아직 exec 승인 기능을 제공한다고 알리지 않으면 해당 로컬 승인 파일을 직접 편집하십시오.

Windows 컴패니언을 포함한 일부 Node 호스트는 다른 승인 정책 형식을 소유합니다. Control UI는 이러한 호스트 네이티브 정책을 읽기 전용으로 표시합니다. 이를 편집하려면 컴패니언 앱 또는 네이티브 정책 형태와 함께 `openclaw approvals set --node <id|name|ip>`를 사용하십시오. [승인 CLI](/ko/cli/approvals)를 참조하십시오.

CLI: `openclaw approvals`는 Gateway 또는 Node 편집을 지원합니다. [승인 CLI](/ko/cli/approvals)를 참조하십시오.

## 승인 흐름

프롬프트가 필요하면 Gateway가 운영자 클라이언트에 `exec.approval.requested`를 브로드캐스트합니다. Control UI와 macOS 앱은 `exec.approval.resolve`를 통해 이를 처리한 다음 Gateway가 승인된 요청을 Node 호스트로 전달합니다.

`host=node`인 경우 승인 요청에는 정규 `systemRunPlan` 페이로드가 포함됩니다. Gateway는 승인된 `system.run` 요청을 전달할 때 해당 계획을 권위 있는 명령/cwd/세션 컨텍스트로 사용합니다.

- Node exec 경로는 처음부터 하나의 정규 계획을 준비합니다.
- 승인 레코드는 해당 계획과 바인딩 메타데이터를 저장합니다.
- 승인되면 최종 전달되는 `system.run` 호출은 이후 호출자의 편집을 신뢰하지 않고 저장된 계획을 재사용합니다.
- 승인 요청이 생성된 후 호출자가 `command`, `rawCommand`, `cwd`, `agentId` 또는 `sessionKey`를 변경하면 Gateway가 전달된 실행을 승인 불일치로 거부합니다.

## 시스템 이벤트 및 거부

Node가 완료를 보고하면 exec 수명 주기가 에이전트 세션에 `Exec finished` 시스템 메시지를 게시합니다. OpenClaw는 승인이 부여된 후 `tools.exec.approvalRunningNoticeMs`가 경과하면 진행 중 알림도 표시할 수 있습니다(기본값 `10000`, `0`은 비활성화). 거부된 exec 승인은 호스트 명령에 대해 최종적이며, 명령은 실행되지 않습니다.

- 시작 세션이 있는 메인 에이전트 비동기 승인의 경우 OpenClaw는 거부를 내부 후속 메시지로 해당 세션에 다시 게시하여 에이전트가 비동기 명령 대기를 중단하고 결과 누락 복구를 방지할 수 있도록 합니다.
- 세션이 없거나 세션을 재개할 수 없는 경우에도 OpenClaw는 운영자 또는 직접 채팅 경로에 간결한 거부 메시지를 보고할 수 있습니다.
- 하위 에이전트 및 Cron 세션에 대한 거부는 해당 세션에 다시 게시되지 않습니다.

Gateway 호스트 exec 승인도 동일한 완료 수명 주기 이벤트를 내보냅니다. 승인으로 제어되는 exec는 승인 ID를 재사용하여 대기 중인 요청과 완료/거부 메시지(`Exec finished (gateway
id=...)` / `Exec denied (gateway id=...)`)를 연관시킵니다.

## 영향

- **`full`**은 강력하므로 가능하면 허용 목록을 사용하십시오.
- **`ask`**는 빠른 승인을 허용하면서도 사용자가 상황을 계속 파악할 수 있게 합니다.
- 에이전트별 허용 목록은 한 에이전트의 승인이 다른 에이전트에 누출되는 것을 방지합니다.
- 승인은 **권한이 부여된 발신자**의 호스트 exec 요청에만 적용됩니다. 권한이 없는 발신자는 `/exec`를 실행할 수 없습니다.
- `/exec security=full`은 권한이 부여된 운영자를 위한 세션 수준의 편의 기능이며 의도적으로 승인을 건너뜁니다. 호스트 exec를 완전히 차단하려면 승인 보안을 `deny`로 설정하거나 도구 정책을 통해 `exec` 도구를 거부하십시오.

## 관련 문서

<CardGroup cols={2}>
  <Card title="Exec 승인 - 고급" href="/ko/tools/exec-approvals-advanced" icon="gear">
    안전한 바이너리, 인터프리터 바인딩, 채팅으로 승인 전달하기.
  </Card>
  <Card title="Exec 도구" href="/ko/tools/exec" icon="terminal">
    셸 명령 실행 도구입니다.
  </Card>
  <Card title="승격 모드" href="/ko/tools/elevated" icon="shield-exclamation">
    승인도 건너뛰는 비상 경로입니다.
  </Card>
  <Card title="샌드박싱" href="/ko/gateway/sandboxing" icon="box">
    샌드박스 모드와 작업 공간 접근입니다.
  </Card>
  <Card title="보안" href="/ko/gateway/security" icon="lock">
    보안 모델과 강화 방법입니다.
  </Card>
  <Card title="샌드박스와 도구 정책 및 승격 비교" href="/ko/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    각 제어 수단을 사용해야 하는 경우입니다.
  </Card>
  <Card title="Skills" href="/ko/tools/skills" icon="sparkles">
    Skill 기반 자동 허용 동작입니다.
  </Card>
</CardGroup>
