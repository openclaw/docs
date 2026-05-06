---
read_when:
    - exec 승인 또는 허용 목록 구성
    - macOS 앱에서 exec 승인 사용자 경험 구현
    - 샌드박스 탈출 프롬프트와 그 영향 검토
sidebarTitle: Exec approvals
summary: '호스트 exec 승인: 정책 조정 옵션, 허용 목록, 그리고 YOLO/strict 워크플로'
title: 실행 승인
x-i18n:
    generated_at: "2026-05-06T06:42:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: c404fbc80624e31603cfc3f9ca6318534d53e0277af107600c726f97e11b223b
    source_path: tools/exec-approvals.md
    workflow: 16
---

Exec 승인은 샌드박스 처리된 에이전트가 실제 호스트(`gateway` 또는 `node`)에서 명령을 실행하도록 허용하기 위한 **동반 앱 / Node 호스트 가드레일**입니다. 안전 인터록으로, 정책 + 허용 목록 + (선택 사항) 사용자 승인이 모두 일치할 때만 명령이 허용됩니다. Exec 승인은 도구 정책 및 상승된 게이팅 **위에** 겹쳐 적용됩니다(`full`로 설정된 상승 모드는 승인을 건너뜁니다).

<Note>
유효 정책은 `tools.exec.*`와 승인 기본값 중 **더 엄격한** 정책입니다. 승인 필드가 생략되면 `tools.exec` 값이 사용됩니다. 호스트 exec는 해당 머신의 로컬 승인 상태도 사용합니다. `~/.openclaw/exec-approvals.json`의 호스트 로컬 `ask: "always"`는 세션 또는 구성 기본값이 `ask: "on-miss"`를 요청하더라도 계속 프롬프트를 표시합니다.
</Note>

## 유효 정책 검사

| 명령                                                          | 표시 내용                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `openclaw approvals get` / `--gateway` / `--node <id\|name\|ip>` | 요청된 정책, 호스트 정책 소스, 유효 결과입니다.                       |
| `openclaw exec-policy show`                                      | 로컬 머신 병합 보기입니다.                                                             |
| `openclaw exec-policy set` / `preset`                            | 로컬 요청 정책을 로컬 호스트 승인 파일과 한 단계로 동기화합니다. |

로컬 범위가 `host=node`를 요청하면 `exec-policy show`는 로컬 승인 파일이 진실의 소스인 것처럼 가장하지 않고, 런타임에 해당 범위를 Node 관리 범위로 보고합니다.

동반 앱 UI를 **사용할 수 없는** 경우, 일반적으로 프롬프트를 표시할 모든 요청은 **ask 대체 동작**(기본값: `deny`)으로 해결됩니다.

<Tip>
네이티브 채팅 승인 클라이언트는 보류 중인 승인 메시지에 채널별 편의 기능을 시드할 수 있습니다. 예를 들어 Matrix는 반응 바로 가기(`✅` 한 번 허용, `❌` 거부, `♾️` 항상 허용)를 시드하면서도 대체 수단으로 메시지에 `/approve ...` 명령을 남깁니다.
</Tip>

## 적용 위치

Exec 승인은 실행 호스트에서 로컬로 적용됩니다.

- **Gateway 호스트** → Gateway 머신의 `openclaw` 프로세스입니다.
- **Node 호스트** → Node 러너(macOS 동반 앱 또는 헤드리스 Node 호스트)입니다.

### 신뢰 모델

- Gateway 인증 호출자는 해당 Gateway의 신뢰된 운영자입니다.
- 페어링된 Node는 신뢰된 운영자 기능을 Node 호스트로 확장합니다.
- Exec 승인은 실수로 인한 실행 위험을 줄이지만, 사용자별 인증 경계는 **아닙니다**.
- 승인된 Node 호스트 실행은 표준 실행 컨텍스트를 바인딩합니다. 표준 cwd, 정확한 argv, 존재하는 경우 env 바인딩, 해당되는 경우 고정된 실행 파일 경로입니다.
- 셸 스크립트와 직접 인터프리터/런타임 파일 호출의 경우, OpenClaw는 구체적인 로컬 파일 피연산자 하나도 바인딩하려고 시도합니다. 승인 후 실행 전까지 해당 바인딩된 파일이 변경되면, 변경된 콘텐츠를 실행하는 대신 실행이 거부됩니다.
- 파일 바인딩은 의도적으로 최선 노력 방식이며, 모든 인터프리터/런타임 로더 경로에 대한 완전한 의미 모델은 **아닙니다**. 승인 모드가 바인딩할 구체적인 로컬 파일 하나를 정확히 식별할 수 없으면, 전체 범위를 가장하는 대신 승인 기반 실행 생성을 거부합니다.

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

## 정책 노브

### `exec.security`

<ParamField path="security" type='"deny" | "allowlist" | "full"'>
  - `deny` - 모든 호스트 exec 요청을 차단합니다.
  - `allowlist` - 허용 목록에 있는 명령만 허용합니다.
  - `full` - 모든 것을 허용합니다(상승 모드와 동일).

</ParamField>

### `exec.ask`

<ParamField path="ask" type='"off" | "on-miss" | "always"'>
  - `off` - 프롬프트를 표시하지 않습니다.
  - `on-miss` - 허용 목록이 일치하지 않을 때만 프롬프트를 표시합니다.
  - `always` - 모든 명령에서 프롬프트를 표시합니다. 유효 ask 모드가 `always`이면 `allow-always` 영구 신뢰는 프롬프트를 **억제하지 않습니다**.

</ParamField>

### `askFallback`

<ParamField path="askFallback" type='"deny" | "allowlist" | "full"'>
  프롬프트가 필요하지만 접근 가능한 UI가 없을 때의 해결 방식입니다.

- `deny` - 차단합니다.
- `allowlist` - 허용 목록이 일치하는 경우에만 허용합니다.
- `full` - 허용합니다.

</ParamField>

### `tools.exec.strictInlineEval`

<ParamField path="strictInlineEval" type="boolean">
  `true`이면, 인터프리터 바이너리 자체가 허용 목록에 있더라도 OpenClaw는 인라인 코드 평가 형식을 승인 전용으로 처리합니다. 하나의 안정적인 파일 피연산자로 깔끔하게 매핑되지 않는 인터프리터 로더에 대한 심층 방어입니다.
</ParamField>

엄격 모드가 잡아내는 예시는 다음과 같습니다.

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

엄격 모드에서는 이러한 명령도 여전히 명시적 승인이 필요하며, `allow-always`는 새 허용 목록 항목을 자동으로 영구 저장하지 않습니다.

## YOLO 모드(승인 없음)

호스트 exec를 승인 프롬프트 없이 실행하려면 **두** 정책 계층을 모두 열어야 합니다. OpenClaw 구성의 요청된 exec 정책(`tools.exec.*`)과 `~/.openclaw/exec-approvals.json`의 호스트 로컬 승인 정책입니다.

YOLO는 명시적으로 강화하지 않는 한 기본 호스트 동작입니다.

| 계층                 | YOLO 설정               |
| --------------------- | -------------------------- |
| `tools.exec.security` | `gateway`/`node`에서 `full` |
| `tools.exec.ask`      | `off`                      |
| 호스트 `askFallback`    | `full`                     |

<Warning>
**중요한 차이점:**

- `tools.exec.host=auto`는 exec가 **어디서** 실행되는지 선택합니다. 사용 가능한 경우 샌드박스, 그렇지 않으면 Gateway입니다.
- YOLO는 호스트 exec가 **어떻게** 승인되는지 선택합니다. `security=full`과 `ask=off`입니다.
- YOLO 모드에서 OpenClaw는 구성된 호스트 exec 정책 위에 별도의 휴리스틱 명령 난독화 승인 게이트나 스크립트 사전 검사 거부 계층을 추가하지 **않습니다**.
- `auto`는 샌드박스 처리된 세션에서 Gateway 라우팅을 자유롭게 우회할 수 있게 만들지 않습니다. `auto`에서는 호출별 `host=node` 요청이 허용됩니다. `host=gateway`는 샌드박스 런타임이 활성화되어 있지 않을 때만 `auto`에서 허용됩니다. 안정적인 비자동 기본값을 원하면 `tools.exec.host`를 설정하거나 `/exec host=...`를 명시적으로 사용하세요.

</Warning>

자체 비대화형 권한 모드를 노출하는 CLI 기반 제공자는 이 정책을 따를 수 있습니다. OpenClaw의 요청된 exec 정책이 YOLO이면 Claude CLI는 `--permission-mode bypassPermissions`를 추가합니다. 해당 백엔드 동작은 `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 아래에 명시적 Claude 인수를 지정해 재정의하세요. 예를 들어 `--permission-mode default`, `acceptEdits`, 또는 `bypassPermissions`입니다.

더 보수적인 설정을 원하면 어느 한 계층을 다시 `allowlist` / `on-miss` 또는 `deny`로 강화하세요.

### 영구 Gateway 호스트 "프롬프트 없음" 설정

<Steps>
  <Step title="요청된 구성 정책 설정">
    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```
  </Step>
  <Step title="호스트 승인 파일 일치">
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

### 로컬 바로 가기

```bash
openclaw exec-policy preset yolo
```

이 로컬 바로 가기는 다음 두 항목을 모두 업데이트합니다.

- 로컬 `tools.exec.host/security/ask`.
- 로컬 `~/.openclaw/exec-approvals.json` 기본값.

이는 의도적으로 로컬 전용입니다. Gateway 호스트 또는 Node 호스트 승인을 원격으로 변경하려면 `openclaw approvals set --gateway` 또는 `openclaw approvals set --node <id|name|ip>`를 사용하세요.

### Node 호스트

Node 호스트의 경우, 대신 해당 Node에 동일한 승인 파일을 적용합니다.

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
- Node exec 승인은 런타임에 Node에서 가져오므로, Node 대상 업데이트는 `openclaw approvals --node ...`를 사용해야 합니다.

</Note>

### 세션 전용 바로 가기

- `/exec security=full ask=off`는 현재 세션만 변경합니다.
- `/elevated full`은 해당 세션의 exec 승인도 건너뛰는 비상용 바로 가기입니다.

호스트 승인 파일이 구성보다 더 엄격한 상태로 남아 있으면, 더 엄격한 호스트 정책이 여전히 우선합니다.

## 허용 목록(에이전트별)

허용 목록은 **에이전트별**입니다. 여러 에이전트가 있는 경우 macOS 앱에서 편집할 에이전트를 전환하세요. 패턴은 glob 일치입니다.

패턴은 확인된 바이너리 경로 glob 또는 단순 명령 이름 glob일 수 있습니다. 단순 이름은 `PATH`를 통해 호출된 명령에만 일치하므로, 명령이 `rg`일 때 `rg`는 `/opt/homebrew/bin/rg`와 일치할 수 있지만 `./rg` 또는 `/tmp/rg`와는 일치하지 **않습니다**. 특정 바이너리 위치 하나를 신뢰하려면 경로 glob을 사용하세요.

레거시 `agents.default` 항목은 로드 시 `agents.main`으로 마이그레이션됩니다. `echo ok && pwd` 같은 셸 체인은 여전히 모든 최상위 세그먼트가 허용 목록 규칙을 충족해야 합니다.

예시:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

### argPattern으로 인수 제한

허용 목록 항목이 바이너리와 특정 인수 형태에 일치해야 하는 경우 `argPattern`을 추가하세요. OpenClaw는 실행 파일 토큰(`argv[0]`)을 제외하고 파싱된 명령 인수에 대해 정규식을 평가합니다. 직접 작성한 항목의 경우 인수는 단일 공백으로 결합되므로 정확한 일치가 필요하면 패턴을 앵커로 고정하세요.

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

이 항목은 `python3 safe.py`를 허용합니다. `python3 other.py`는 허용 목록 미스입니다. 동일한 바이너리에 대한 경로 전용 항목도 있으면, 일치하지 않는 인수는 여전히 해당 경로 전용 항목으로 대체될 수 있습니다. 목표가 바이너리를 선언된 인수로 제한하는 것이라면 경로 전용 항목을 생략하세요.

승인 흐름에서 저장된 항목은 정확한 argv 일치를 위해 내부 구분자 형식을 사용할 수 있습니다. 인코딩된 값을 직접 편집하는 대신 UI 또는 승인 흐름을 사용해 해당 항목을 다시 생성하는 편을 권장합니다. OpenClaw가 명령 세그먼트의 argv를 파싱할 수 없으면 `argPattern`이 있는 항목은 일치하지 않습니다.

각 허용 목록 항목은 다음을 지원합니다.

| 필드              | 의미                                                       |
| ------------------ | ------------------------------------------------------------- |
| `pattern`          | 해석된 바이너리 경로 글롭 또는 명령어 이름만 있는 글롭           |
| `argPattern`       | 선택적 argv 정규식. 생략된 항목은 경로 전용            |
| `id`               | UI 식별에 사용되는 안정적인 UUID                              |
| `source`           | `allow-always` 같은 항목 소스                          |
| `commandText`      | 승인 흐름이 항목을 만들 때 캡처된 명령 텍스트 |
| `lastUsedAt`       | 마지막 사용 타임스탬프                                           |
| `lastUsedCommand`  | 마지막으로 일치한 명령                                     |
| `lastResolvedPath` | 마지막으로 해석된 바이너리 경로                                     |

## Skill CLI 자동 허용

**Skill CLI 자동 허용**이 활성화되면, 알려진 Skills에서 참조하는 실행 파일이
노드(macOS 노드 또는 헤드리스 노드 호스트)에서 허용 목록에 포함된 것으로 처리됩니다.
이는 Gateway RPC를 통해 `skills.bins`를 사용해 Skill bin 목록을 가져옵니다.
엄격한 수동 허용 목록을 원하면 이를 비활성화하세요.

<Warning>
- 이는 수동 경로 허용 목록 항목과 별개인 **암시적 편의 허용 목록**입니다.
- Gateway와 노드가 동일한 신뢰 경계 안에 있는 신뢰할 수 있는 운영자 환경을 위한 것입니다.
- 엄격한 명시적 신뢰가 필요하면 `autoAllowSkills: false`를 유지하고 수동 경로 허용 목록 항목만 사용하세요.

</Warning>

## 안전한 bin 및 승인 전달

안전한 bin(stdin 전용 빠른 경로), 인터프리터 바인딩 세부 정보,
그리고 승인 프롬프트를 Slack/Discord/Telegram으로 전달하는 방법(또는
네이티브 승인 클라이언트로 실행하는 방법)은
[Exec 승인 - 고급](/ko/tools/exec-approvals-advanced)을 참고하세요.

## 제어 UI 편집

기본값, 에이전트별 재정의, 허용 목록을 편집하려면 **제어 UI → 노드 → Exec 승인** 카드를 사용하세요.
범위(기본값 또는 에이전트)를 선택하고, 정책을 조정하고, 허용 목록 패턴을 추가/제거한 다음 **저장**하세요. UI는
패턴별 마지막 사용 메타데이터를 표시하므로 목록을 깔끔하게 유지할 수 있습니다.

대상 선택기는 **Gateway**(로컬 승인) 또는 **노드**를 선택합니다.
노드는 `system.execApprovals.get/set`(macOS 앱 또는 헤드리스 노드 호스트)을 광고해야 합니다.
노드가 아직 exec 승인을 광고하지 않으면 로컬 `~/.openclaw/exec-approvals.json`을 직접 편집하세요.

CLI: `openclaw approvals`는 Gateway 또는 노드 편집을 지원합니다. 자세한 내용은
[승인 CLI](/ko/cli/approvals)를 참고하세요.

## 승인 흐름

프롬프트가 필요하면 Gateway가 운영자 클라이언트에
`exec.approval.requested`를 브로드캐스트합니다. 제어 UI와 macOS
앱은 `exec.approval.resolve`를 통해 이를 해결한 다음, Gateway가
승인된 요청을 노드 호스트로 전달합니다.

`host=node`의 경우 승인 요청에는 정식 `systemRunPlan`
페이로드가 포함됩니다. Gateway는 승인된 `system.run`
요청을 전달할 때 해당 계획을 권위 있는
명령/cwd/session 컨텍스트로 사용합니다.

이는 비동기 승인 지연 시간에 중요합니다.

- 노드 exec 경로는 정식 계획 하나를 먼저 준비합니다.
- 승인 레코드는 해당 계획과 그 바인딩 메타데이터를 저장합니다.
- 승인되면 최종 전달되는 `system.run` 호출은 이후 호출자 편집을 신뢰하는 대신 저장된 계획을 재사용합니다.
- 승인 요청이 생성된 후 호출자가 `command`, `rawCommand`, `cwd`, `agentId`, `sessionKey`를 변경하면 Gateway는 전달된 실행을 승인 불일치로 거부합니다.

## 시스템 이벤트

Exec 수명 주기는 시스템 메시지로 표시됩니다.

- `Exec running`(명령이 실행 알림 임계값을 초과하는 경우에만).
- `Exec finished`.
- `Exec denied`.

이 메시지는 노드가 이벤트를 보고한 후 에이전트 세션에 게시됩니다.
Gateway 호스트 exec 승인은 명령이 완료될 때(그리고 선택적으로 임계값보다 오래 실행될 때)
동일한 수명 주기 이벤트를 내보냅니다.
승인 게이트가 적용된 exec는 쉽게 연관 지을 수 있도록 이 메시지에서 승인 id를 `runId`로 재사용합니다.

## 거부된 승인 동작

비동기 exec 승인이 거부되면 OpenClaw는 에이전트가 세션에서 동일한 명령을 이전에 실행해 얻은 출력을
재사용하지 못하게 합니다.
거부 사유는 사용 가능한 명령 출력이 없다는 명시적 지침과 함께 전달되며,
이를 통해 에이전트가 새 출력이 있다고 주장하거나 이전에 성공한 실행의 오래된 결과로
거부된 명령을 반복하는 것을 막습니다.

## 영향

- **`full`**은 강력합니다. 가능하면 허용 목록을 선호하세요.
- **`ask`**는 빠른 승인을 계속 허용하면서도 사용자를 흐름 안에 둡니다.
- 에이전트별 허용 목록은 한 에이전트의 승인이 다른 에이전트로 새는 것을 방지합니다.
- 승인은 **승인된 발신자**의 호스트 exec 요청에만 적용됩니다. 승인되지 않은 발신자는 `/exec`를 실행할 수 없습니다.
- `/exec security=full`은 승인된 운영자를 위한 세션 수준 편의 기능이며, 설계상 승인을 건너뜁니다. 호스트 exec를 강제로 차단하려면 승인 보안을 `deny`로 설정하거나 도구 정책을 통해 `exec` 도구를 거부하세요.

## 관련 항목

<CardGroup cols={2}>
  <Card title="Exec 승인 - 고급" href="/ko/tools/exec-approvals-advanced" icon="gear">
    안전한 bin, 인터프리터 바인딩, 채팅으로의 승인 전달입니다.
  </Card>
  <Card title="Exec 도구" href="/ko/tools/exec" icon="terminal">
    셸 명령 실행 도구입니다.
  </Card>
  <Card title="상승 모드" href="/ko/tools/elevated" icon="shield-exclamation">
    승인도 건너뛰는 비상 경로입니다.
  </Card>
  <Card title="샌드박싱" href="/ko/gateway/sandboxing" icon="box">
    샌드박스 모드와 워크스페이스 액세스입니다.
  </Card>
  <Card title="보안" href="/ko/gateway/security" icon="lock">
    보안 모델과 강화입니다.
  </Card>
  <Card title="샌드박스 vs 도구 정책 vs 상승" href="/ko/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    각 제어를 언제 사용할지입니다.
  </Card>
  <Card title="Skills" href="/ko/tools/skills" icon="sparkles">
    Skill 기반 자동 허용 동작입니다.
  </Card>
</CardGroup>
