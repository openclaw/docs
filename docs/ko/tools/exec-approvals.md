---
read_when:
    - exec 승인 또는 허용 목록 구성
    - macOS 앱에서 exec 승인 사용자 경험 구현
    - 샌드박스 탈출 프롬프트와 그 영향 검토
sidebarTitle: Exec approvals
summary: '호스트 실행 승인: 정책 설정 옵션, 허용 목록, YOLO/엄격 워크플로'
title: 실행 승인
x-i18n:
    generated_at: "2026-05-11T20:37:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2966a6f4633046941a9ef3267bad10f3a153956361b9f088fb3e29fcd3fcb99d
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 승인은 샌드박스된 에이전트가 실제 호스트(`gateway` 또는 `node`)에서 명령을 실행하도록 허용하기 위한 **컴패니언 앱 / Node 호스트 안전장치**입니다. 안전 인터록으로, 정책 + 허용 목록 + (선택 사항) 사용자 승인이 모두 일치할 때만 명령이 허용됩니다. Exec 승인은 도구 정책과 권한 상승 게이트 위에 **추가로** 쌓입니다(`full`로 권한 상승이 설정되어 승인을 건너뛰는 경우는 제외).

<Note>
유효 정책은 `tools.exec.*`와 승인 기본값 중 **더 엄격한** 쪽입니다. 승인 필드가 생략되면 `tools.exec` 값이 사용됩니다. 호스트 실행은 해당 머신의 로컬 승인 상태도 사용합니다. `~/.openclaw/exec-approvals.json`의 호스트 로컬 `ask: "always"`는 세션 또는 구성 기본값이 `ask: "on-miss"`를 요청하더라도 계속 프롬프트를 표시합니다.
</Note>

## 유효 정책 검사

| 명령                                                             | 표시 내용                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 요청된 정책, 호스트 정책 소스, 유효 결과.                                              |
| `openclaw exec-policy show`                                      | 로컬 머신 병합 보기.                                                                   |
| `openclaw exec-policy set` / `preset`                            | 로컬 요청 정책을 로컬 호스트 승인 파일과 한 단계에서 동기화합니다.                     |

로컬 범위가 `host=node`를 요청하면, `exec-policy show`는 로컬 승인 파일이 신뢰 원본인 것처럼 가장하는 대신 런타임에 해당 범위를 Node 관리로 보고합니다.

컴패니언 앱 UI를 **사용할 수 없는** 경우, 일반적으로 프롬프트가 표시될 모든 요청은 **ask fallback**으로 해결됩니다(기본값: `deny`).

<Tip>
네이티브 채팅 승인 클라이언트는 대기 중인 승인 메시지에 채널별 편의 기능을 시드할 수 있습니다. 예를 들어 Matrix는 반응 바로가기(`✅` 한 번 허용, `❌` 거부, `♾️` 항상 허용)를 시드하면서도 메시지 안의 `/approve ...` 명령을 대체 수단으로 남겨 둡니다.
</Tip>

## 적용 위치

Exec 승인은 실행 호스트에서 로컬로 적용됩니다.

- **Gateway 호스트** → Gateway 머신의 `openclaw` 프로세스.
- **Node 호스트** → Node 러너(macOS 컴패니언 앱 또는 헤드리스 Node 호스트).

### 신뢰 모델

- Gateway 인증 호출자는 해당 Gateway의 신뢰할 수 있는 운영자입니다.
- 페어링된 Node는 그 신뢰할 수 있는 운영자 기능을 Node 호스트로 확장합니다.
- Exec 승인은 우발적 실행 위험을 줄이지만, **사용자별 인증 경계**나 파일 시스템 읽기 전용 정책은 아닙니다.
- 승인된 명령은 선택된 호스트 또는 샌드박스 파일 시스템 권한에 따라 파일을 변경할 수 있습니다.
- 승인된 Node 호스트 실행은 정식 실행 컨텍스트를 바인딩합니다. 정식 cwd, 정확한 argv, env 바인딩이 있을 때의 env 바인딩, 해당되는 경우 고정된 실행 파일 경로입니다.
- 셸 스크립트와 직접 인터프리터/런타임 파일 호출의 경우, OpenClaw는 하나의 구체적인 로컬 파일 피연산자도 바인딩하려고 시도합니다. 승인 후 실행 전까지 그 바인딩된 파일이 변경되면, 변경된 콘텐츠를 실행하는 대신 실행이 거부됩니다.
- 파일 바인딩은 의도적으로 최선 노력 방식이며, **모든 인터프리터/런타임 로더 경로의 완전한 의미론적 모델**이 아닙니다. 승인 모드가 바인딩할 구체적인 로컬 파일을 정확히 하나 식별할 수 없으면, 전체 적용 범위를 가장하는 대신 승인 기반 실행 발급을 거부합니다.

### macOS 분리

- **Node 호스트 서비스**는 로컬 IPC를 통해 `system.run`을 **macOS 앱**으로 전달합니다.
- **macOS 앱**은 승인을 적용하고 UI 컨텍스트에서 명령을 실행합니다.

## 설정 및 저장소

승인은 실행 호스트의 로컬 JSON 파일에 저장됩니다.

```text
~/.openclaw/exec-approvals.json
```

예시 스키마:

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
          "commandText": "rg -n TODO",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 정책 조정 옵션

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 모든 호스트 실행 요청을 차단합니다.
  - `allowlist` - 허용 목록에 있는 명령만 허용합니다.
  - `full` - 모든 것을 허용합니다(권한 상승과 동일).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - 프롬프트를 표시하지 않습니다.
  - `on-miss` - 허용 목록이 일치하지 않을 때만 프롬프트를 표시합니다.
  - `always` - 모든 명령에서 프롬프트를 표시합니다. 유효 ask 모드가 `always`이면 `allow-always`의 지속 신뢰가 프롬프트를 **억제하지 않습니다**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  프롬프트가 필요하지만 연결 가능한 UI가 없을 때의 해결 방식입니다.

- `deny` - 차단합니다.
- `allowlist` - 허용 목록이 일치하는 경우에만 허용합니다.
- `full` - 허용합니다.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true`이면 OpenClaw는 인터프리터 바이너리 자체가 허용 목록에 있더라도 인라인 코드 평가 형식을 승인 전용으로 처리합니다. 하나의 안정적인 파일 피연산자에 깔끔하게 매핑되지 않는 인터프리터 로더를 위한 심층 방어입니다.
</ParamField>

엄격 모드가 포착하는 예:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

엄격 모드에서는 이러한 명령에 여전히 명시적 승인이 필요하며, `allow-always`가 자동으로 새 허용 목록 항목을 지속하지 않습니다.

### `tools.exec.commandHighlighting`

<ParamField path="commandHighlighting" type="boolean" default="false">
  Exec 승인 프롬프트의 표시 방식만 제어합니다. 활성화하면 OpenClaw가 파서에서 파생된 명령 범위를 첨부할 수 있어 Web 승인 프롬프트가 명령 토큰을 강조 표시할 수 있습니다. 명령 텍스트 강조 표시를 활성화하려면 `true`로 설정합니다.
</ParamField>

이 설정은 `security`, `ask`, 허용 목록 매칭, 엄격 인라인 평가 동작, 승인 전달, 명령 실행을 변경하지 **않습니다**. 전역으로는 `tools.exec.commandHighlighting` 아래에, 에이전트별로는 `agents.list[].tools.exec.commandHighlighting` 아래에 설정할 수 있습니다.

## YOLO 모드(승인 없음)

호스트 실행이 승인 프롬프트 없이 실행되게 하려면 **두** 정책 계층을 모두 열어야 합니다. OpenClaw 구성의 요청된 실행 정책(`tools.exec.*`)과 `~/.openclaw/exec-approvals.json`의 호스트 로컬 승인 정책입니다.

YOLO는 명시적으로 강화하지 않는 한 기본 호스트 동작입니다.

| 계층                  | YOLO 설정                  |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node`에서 `full` |
| `tools.exec.ask`      | `off`                      |
| 호스트 `askFallback`  | `full`                     |

<Warning>
**중요한 차이점:**

- `tools.exec.host=auto`는 실행이 **어디에서** 실행되는지 선택합니다. 사용 가능한 경우 샌드박스, 그렇지 않으면 Gateway입니다.
- YOLO는 호스트 실행이 **어떻게** 승인되는지 선택합니다. `security=full`과 `ask=off`입니다.
- YOLO 모드에서 OpenClaw는 구성된 호스트 실행 정책 위에 별도의 휴리스틱 명령 난독화 승인 게이트나 스크립트 사전 실행 거부 계층을 추가하지 **않습니다**.
- `auto`는 샌드박스된 세션에서 Gateway 라우팅을 자유롭게 재정의하도록 만들지 않습니다. 호출별 `host=node` 요청은 `auto`에서 허용됩니다. `host=gateway`는 활성 샌드박스 런타임이 없을 때만 `auto`에서 허용됩니다. 안정적인 비자동 기본값을 원하면 `tools.exec.host`를 설정하거나 `/exec host=...`를 명시적으로 사용하세요.

</Warning>

자체 비대화형 권한 모드를 노출하는 CLI 기반 공급자는 이 정책을 따를 수 있습니다. Claude CLI는 OpenClaw의 요청된 실행 정책이 YOLO일 때 `--permission-mode bypassPermissions`를 추가합니다. `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 아래의 명시적 Claude 인수로 해당 백엔드 동작을 재정의하세요. 예: `--permission-mode default`, `acceptEdits`, `bypassPermissions`.

더 보수적인 설정을 원하면 어느 한 계층을 다시 `allowlist` / `on-miss` 또는 `deny`로 강화하세요.

### 지속적인 Gateway 호스트 "프롬프트 없음" 설정

<Steps>
  <Step title="요청된 구성 정책 설정">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="호스트 승인 파일 맞추기">
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

### 로컬 바로가기

```bash
openclaw exec-policy preset yolo
```

이 로컬 바로가기는 둘 다 업데이트합니다.

- 로컬 `tools.exec.host/security/ask`.
- 로컬 `~/.openclaw/exec-approvals.json` 기본값.

이는 의도적으로 로컬 전용입니다. Gateway 호스트 또는 Node 호스트 승인을 원격으로 변경하려면 `openclaw approvals set --gateway` 또는 `openclaw approvals set --node <id|name|ip>`를 사용하세요.

### Node 호스트

Node 호스트의 경우, 대신 해당 Node에 같은 승인 파일을 적용합니다.

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
- Node 실행 승인은 런타임에 Node에서 가져오므로, Node 대상 업데이트는 `openclaw approvals --node ...`를 사용해야 합니다.

</Note>

### 세션 전용 바로가기

- `/exec security=full ask=off`는 현재 세션만 변경합니다.
- `/elevated full`은 해당 세션의 Exec 승인도 건너뛰는 비상용 바로가기입니다.

호스트 승인 파일이 구성보다 더 엄격하게 유지되면, 더 엄격한 호스트 정책이 여전히 우선합니다.

## 허용 목록(에이전트별)

허용 목록은 **에이전트별**입니다. 여러 에이전트가 있으면 macOS 앱에서 편집할 에이전트를 전환하세요. 패턴은 glob 매칭입니다.

패턴은 해석된 바이너리 경로 glob이거나 단순 명령 이름 glob일 수 있습니다. 단순 이름은 `PATH`를 통해 호출된 명령에만 일치하므로 명령이 `rg`일 때 `rg`는 `/opt/homebrew/bin/rg`와 일치할 수 있지만, `./rg` 또는 `/tmp/rg`와는 일치하지 **않습니다**. 특정 바이너리 위치 하나를 신뢰하려면 경로 glob을 사용하세요.

레거시 `agents.default` 항목은 로드 시 `agents.main`으로 마이그레이션됩니다. `echo ok && pwd` 같은 셸 체인은 여전히 모든 최상위 세그먼트가 허용 목록 규칙을 충족해야 합니다.

예:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern으로 인수 제한

허용 목록 항목이 바이너리와 특정 인수 형태를 일치시켜야 할 때 `argPattern`을 추가하세요. OpenClaw는 실행 파일 토큰(`argv[0]`)을 제외하고 파싱된 명령 인수에 대해 정규식을 평가합니다. 직접 작성한 항목에서는 인수가 단일 공백으로 결합되므로, 정확한 일치가 필요하면 패턴을 앵커링하세요.

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

해당 항목은 `python3 safe.py`를 허용합니다. `python3 other.py`는 허용 목록 미스입니다. 같은 바이너리에 대한 경로 전용 항목도 있으면, 일치하지 않는 인수는 여전히 그 경로 전용 항목으로 폴백할 수 있습니다. 목표가 바이너리를 선언된 인수로 제한하는 것이라면 경로 전용 항목을 생략하세요.

승인 흐름에서 저장된 항목은 정확한 argv 일치를 위해 내부 구분자 형식을
사용할 수 있습니다. 인코딩된 값을 직접 편집하는 대신 UI 또는 승인 흐름으로
해당 항목을 다시 생성하는 방식을 선호하세요. OpenClaw가 명령 세그먼트의
argv를 구문 분석할 수 없으면 `argPattern`이 있는 항목은 일치하지 않습니다.

각 허용 목록 항목은 다음을 지원합니다.

| 필드               | 의미                                                          |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 확인된 바이너리 경로 glob 또는 단순 명령 이름 glob            |
| `argPattern`       | 선택적 argv 정규식; 생략된 항목은 경로 전용입니다             |
| `id`               | UI 식별에 사용되는 안정적인 UUID                              |
| `source`           | `allow-always` 같은 항목 출처                                 |
| `commandText`      | 승인 흐름이 항목을 생성할 때 캡처된 명령 텍스트               |
| `lastUsedAt`       | 마지막 사용 타임스탬프                                       |
| `lastUsedCommand`  | 마지막으로 일치한 명령                                       |
| `lastResolvedPath` | 마지막으로 확인된 바이너리 경로                              |

## Skills CLI 자동 허용

**Skills CLI 자동 허용**이 활성화되면 알려진 Skills에서 참조하는 실행 파일이
Node(macOS Node 또는 헤드리스 Node 호스트)에서 허용 목록에 있는 것으로
처리됩니다. 이는 Gateway RPC를 통해 `skills.bins`를 사용하여 Skill bin 목록을
가져옵니다. 엄격한 수동 허용 목록을 원하면 이 옵션을 비활성화하세요.

<Warning>
- 이는 수동 경로 허용 목록 항목과 별개의 **암시적 편의 허용 목록**입니다.
- Gateway와 Node가 동일한 신뢰 경계 안에 있는 신뢰할 수 있는 운영자 환경을 위한 것입니다.
- 엄격한 명시적 신뢰가 필요하면 `autoAllowSkills: false`를 유지하고 수동 경로 허용 목록 항목만 사용하세요.

</Warning>

## 안전한 bin 및 승인 전달

안전한 bin(stdin 전용 빠른 경로), 인터프리터 바인딩 세부 정보, 그리고 승인 프롬프트를
Slack/Discord/Telegram으로 전달하거나 네이티브 승인 클라이언트로 실행하는 방법은
[Exec 승인 - 고급](/ko/tools/exec-approvals-advanced)을 참조하세요.

## Control UI 편집

기본값, 에이전트별 재정의, 허용 목록을 편집하려면 **Control UI → Nodes → Exec approvals**
카드를 사용하세요. 범위(Defaults 또는 에이전트)를 선택하고, 정책을 조정하고,
허용 목록 패턴을 추가/제거한 다음 **Save**를 누르세요. UI는 패턴별 마지막 사용
메타데이터를 표시하므로 목록을 깔끔하게 유지할 수 있습니다.

대상 선택기는 **Gateway**(로컬 승인) 또는 **Node**를 선택합니다.
Node는 `system.execApprovals.get/set`(macOS 앱 또는 헤드리스 Node 호스트)을
광고해야 합니다. Node가 아직 exec 승인을 광고하지 않는 경우 로컬
`~/.openclaw/exec-approvals.json`을 직접 편집하세요.

CLI: `openclaw approvals`는 Gateway 또는 Node 편집을 지원합니다. 자세한 내용은
[승인 CLI](/ko/cli/approvals)를 참조하세요.

## 승인 흐름

프롬프트가 필요하면 Gateway는 `exec.approval.requested`를 운영자 클라이언트에
브로드캐스트합니다. Control UI와 macOS 앱은 `exec.approval.resolve`를 통해 이를
해결하고, 그러면 Gateway가 승인된 요청을 Node 호스트로 전달합니다.

`host=node`의 경우 승인 요청에는 표준 `systemRunPlan` 페이로드가 포함됩니다.
Gateway는 승인된 `system.run` 요청을 전달할 때 해당 계획을 권한 있는
command/cwd/session 컨텍스트로 사용합니다.

이는 비동기 승인 지연 시간에 중요합니다.

- Node exec 경로는 표준 계획 하나를 미리 준비합니다.
- 승인 레코드는 해당 계획과 그 바인딩 메타데이터를 저장합니다.
- 승인되면 최종 전달된 `system.run` 호출은 이후 호출자 편집을 신뢰하는 대신 저장된 계획을 재사용합니다.
- 승인 요청이 생성된 뒤 호출자가 `command`, `rawCommand`, `cwd`, `agentId`, 또는 `sessionKey`를 변경하면 Gateway는 전달된 실행을 승인 불일치로 거부합니다.

## 시스템 이벤트

Exec 수명 주기는 시스템 메시지로 표시됩니다.

- `Exec running`(명령이 실행 알림 임계값을 초과하는 경우에만).
- `Exec finished`.
- `Exec denied`.

이 메시지는 Node가 이벤트를 보고한 뒤 에이전트 세션에 게시됩니다.
Gateway 호스트 exec 승인은 명령이 완료될 때(그리고 선택적으로 임계값보다 오래 실행될 때)
동일한 수명 주기 이벤트를 내보냅니다. 승인 게이트가 있는 exec는 쉽게 상호 연관할 수 있도록
이 메시지에서 승인 id를 `runId`로 재사용합니다.

## 거부된 승인 동작

비동기 exec 승인이 거부되면 OpenClaw는 에이전트가 세션에서 동일한 명령을 이전에 실행한
출력을 재사용하지 못하게 합니다. 거부 사유는 사용할 수 있는 명령 출력이 없다는 명시적
안내와 함께 전달되며, 이를 통해 에이전트가 새 출력이 있다고 주장하거나 이전에 성공한
실행의 오래된 결과로 거부된 명령을 반복하는 일을 막습니다.

## 영향

- **`full`**은 강력합니다. 가능한 경우 허용 목록을 선호하세요.
- **`ask`**는 빠른 승인을 허용하면서도 사용자가 계속 관여하도록 합니다.
- 에이전트별 허용 목록은 한 에이전트의 승인이 다른 에이전트로 새는 것을 방지합니다.
- 승인은 **권한 있는 발신자**의 호스트 exec 요청에만 적용됩니다. 권한 없는 발신자는 `/exec`를 실행할 수 없습니다.
- `/exec security=full`은 권한 있는 운영자를 위한 세션 수준 편의 기능이며 설계상 승인을 건너뜁니다. 호스트 exec를 강제로 차단하려면 승인 보안을 `deny`로 설정하거나 도구 정책을 통해 `exec` 도구를 거부하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Exec approvals - advanced" href="/ko/tools/exec-approvals-advanced" icon="gear">
    안전한 bin, 인터프리터 바인딩, 채팅으로의 승인 전달.
  </Card>
  <Card title="Exec tool" href="/ko/tools/exec" icon="terminal">
    셸 명령 실행 도구.
  </Card>
  <Card title="Elevated mode" href="/ko/tools/elevated" icon="shield-exclamation">
    승인도 건너뛰는 비상 경로.
  </Card>
  <Card title="Sandboxing" href="/ko/gateway/sandboxing" icon="box">
    Sandbox 모드와 워크스페이스 접근.
  </Card>
  <Card title="Security" href="/ko/gateway/security" icon="lock">
    보안 모델과 강화.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/ko/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    각 제어를 언제 사용해야 하는지.
  </Card>
  <Card title="Skills" href="/ko/tools/skills" icon="sparkles">
    Skill 기반 자동 허용 동작.
  </Card>
</CardGroup>
