---
read_when:
    - exec 승인 또는 허용 목록 구성하기
    - macOS 앱에서 exec 승인 UX 구현하기
    - 샌드박스 탈출 프롬프트와 그 영향을 검토하기
summary: exec 승인, 허용 목록 및 샌드박스 탈출 프롬프트
title: exec 승인
x-i18n:
    generated_at: "2026-04-25T06:11:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 44bf7af57d322280f6d0089207041214b1233d0c9eca99656d51fc4aed88941b
    source_path: tools/exec-approvals.md
    workflow: 15
---

exec 승인은 샌드박스된 에이전트가 실제 호스트(`gateway` 또는 `node`)에서 명령을 실행하도록 허용하기 위한 **컴패니언 앱 / node 호스트 가드레일**입니다. 안전 인터록으로서, 명령은 정책 + 허용 목록 + (선택적) 사용자 승인이 모두 동의할 때만 허용됩니다. exec 승인은 도구 정책과 elevated 게이팅 **위에 추가로** 적용됩니다(단, elevated가 `full`이면 승인을 건너뜁니다).

<Note>
유효 정책은 `tools.exec.*`와 승인 기본값 중 **더 엄격한 쪽**입니다. 승인 필드가 생략되면 `tools.exec` 값이 사용됩니다. 호스트 exec는 해당 머신의 로컬 승인 상태도 사용합니다 — `~/.openclaw/exec-approvals.json`의 호스트 로컬 `ask: "always"`는 세션 또는 config 기본값이 `ask: "on-miss"`를 요청하더라도 계속 프롬프트를 표시합니다.
</Note>

## 유효 정책 검사

- `openclaw approvals get`, `... --gateway`, `... --node <id|name|ip>` — 요청된 정책, 호스트 정책 source, 유효 결과를 표시합니다.
- `openclaw exec-policy show` — 로컬 머신 병합 보기.
- `openclaw exec-policy set|preset` — 로컬 요청 정책을 로컬 호스트 승인 파일과 한 번에 동기화합니다.

로컬 범위가 `host=node`를 요청하면 `exec-policy show`는 해당 범위를
로컬 승인 파일이 source of truth인 것처럼 가장하는 대신 런타임에서 node 관리형으로 보고합니다.

컴패니언 앱 UI를 **사용할 수 없는 경우**, 일반적으로 프롬프트가 표시될 요청은 모두 **ask fallback**으로 해결됩니다(기본값: deny).

<Tip>
네이티브 채팅 승인 클라이언트는 대기 중인 승인 메시지에 channel별 편의 기능을 미리 넣을 수 있습니다. 예를 들어 Matrix는 `/approve ...`
명령을 폴백으로 남겨 두면서도 반응 바로가기(`✅`
한 번 허용, `❌` 거부, `♾️` 항상 허용)를 미리 넣습니다.
</Tip>

## 적용 위치

exec 승인은 실행 호스트에서 로컬로 강제됩니다:

- **gateway host** → Gateway 머신의 `openclaw` 프로세스
- **node host** → node runner(macOS 컴패니언 앱 또는 헤드리스 node host)

신뢰 모델 참고:

- Gateway 인증 호출자는 해당 Gateway의 신뢰된 운영자입니다.
- 페어링된 nodes는 그 신뢰된 운영자 capability를 node host까지 확장합니다.
- exec 승인은 우발적 실행 위험을 줄이지만 사용자별 인증 경계는 아닙니다.
- 승인된 node-host 실행은 정규 실행 컨텍스트를 바인딩합니다: 정규 cwd, 정확한 argv, 존재할 경우 env
  바인딩, 적용 가능한 경우 고정된 실행 파일 경로.
- 셸 스크립트와 직접 인터프리터/런타임 파일 호출의 경우 OpenClaw는
  하나의 구체적인 로컬 파일 피연산자도 바인딩하려고 시도합니다. 해당 바인딩된 파일이 승인 후 실행 전에 변경되면,
  변경된 내용을 실행하는 대신 실행이 거부됩니다.
- 이 파일 바인딩은 의도적으로 best-effort이며, 모든
  인터프리터/런타임 로더 경로에 대한 완전한 의미 모델이 아닙니다. 승인 모드가 정확히 하나의 구체적인 로컬
  파일을 바인딩할 수 없으면, 완전한 커버리지를 가장하는 대신 승인 기반 실행 발급을 거부합니다.

macOS 분리:

- **node host 서비스**는 `system.run`을 로컬 IPC를 통해 **macOS 앱**으로 전달합니다.
- **macOS 앱**은 승인을 강제하고 UI 컨텍스트에서 명령을 실행합니다.

## 설정 및 저장소

승인은 실행 호스트의 로컬 JSON 파일에 저장됩니다:

`~/.openclaw/exec-approvals.json`

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
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## 무승인 "YOLO" 모드

호스트 exec를 승인 프롬프트 없이 실행하려면 **두** 정책 계층을 모두 열어야 합니다:

- OpenClaw config의 요청된 exec 정책 (`tools.exec.*`)
- `~/.openclaw/exec-approvals.json`의 호스트 로컬 승인 정책

이제 명시적으로 더 엄격하게 조이지 않는 한 이것이 기본 호스트 동작입니다:

- `tools.exec.security`: `gateway`/`node`에서 `full`
- `tools.exec.ask`: `off`
- 호스트 `askFallback`: `full`

중요한 차이:

- `tools.exec.host=auto`는 exec가 어디서 실행될지 선택합니다: 가능한 경우 샌드박스, 아니면 gateway.
- YOLO는 호스트 exec가 어떻게 승인될지를 선택합니다: `security=full` 및 `ask=off`.
- 자체 비대화형 권한 모드를 노출하는 CLI 기반 provider는 이 정책을 따를 수 있습니다.
  Claude CLI는 OpenClaw의 요청된 exec 정책이
  YOLO일 때 `--permission-mode bypassPermissions`를 추가합니다. 해당 백엔드 동작은
  `agents.defaults.cliBackends.claude-cli.args` / `resumeArgs` 아래의 명시적 Claude 인수로 재정의하세요. 예:
  `--permission-mode default`, `acceptEdits`, `bypassPermissions`.
- YOLO 모드에서 OpenClaw는 구성된 호스트 exec 정책 위에
  별도의 휴리스틱 명령 난독화 승인 게이트 또는 스크립트 사전 점검 거부 계층을 추가하지 않습니다.
- `auto`는 샌드박스된 세션에서 gateway 라우팅을 무료 재정의로 만들지 않습니다. 호출별 `host=node` 요청은 `auto`에서 허용되며, `host=gateway`는 샌드박스 런타임이 활성 상태가 아닐 때만 `auto`에서 허용됩니다. 안정적인 non-auto 기본값이 필요하면 `tools.exec.host`를 설정하거나 `/exec host=...`를 명시적으로 사용하세요.

더 보수적인 구성을 원하면 두 계층 중 하나를 다시 `allowlist` / `on-miss`
또는 `deny`로 조이세요.

지속적인 gateway-host "never prompt" 설정:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

그다음 호스트 승인 파일을 이에 맞게 설정합니다:

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

현재 머신에서 동일한 gateway-host 정책을 위한 로컬 바로가기:

```bash
openclaw exec-policy preset yolo
```

이 로컬 바로가기는 다음 둘 다 업데이트합니다:

- 로컬 `tools.exec.host/security/ask`
- 로컬 `~/.openclaw/exec-approvals.json` 기본값

이것은 의도적으로 로컬 전용입니다. gateway-host 또는 node-host 승인을
원격으로 변경해야 하면 계속 `openclaw approvals set --gateway` 또는
`openclaw approvals set --node <id|name|ip>`를 사용하세요.

node host의 경우 같은 승인 파일을 대신 해당 node에 적용합니다:

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

중요한 로컬 전용 제한:

- `openclaw exec-policy`는 node 승인을 동기화하지 않습니다
- `openclaw exec-policy set --host node`는 거부됩니다
- node exec 승인은 런타임에 node에서 가져오므로, node 대상 업데이트는 `openclaw approvals --node ...`를 사용해야 합니다

세션 전용 바로가기:

- `/exec security=full ask=off`는 현재 세션만 변경합니다.
- `/elevated full`은 해당 세션에 대해 exec 승인도 건너뛰는 break-glass 바로가기입니다.

호스트 승인 파일이 config보다 더 엄격하면, 더 엄격한 호스트 정책이 여전히 우선합니다.

## 정책 조절 항목

### 보안 (`exec.security`)

- **deny**: 모든 호스트 exec 요청을 차단합니다.
- **allowlist**: 허용 목록에 있는 명령만 허용합니다.
- **full**: 모든 것을 허용합니다(elevated와 동일).

### Ask (`exec.ask`)

- **off**: 절대 프롬프트를 표시하지 않습니다.
- **on-miss**: 허용 목록이 일치하지 않을 때만 프롬프트를 표시합니다.
- **always**: 모든 명령에 대해 프롬프트를 표시합니다.
- 유효 ask 모드가 `always`일 때는 `allow-always`의 영속 신뢰가 프롬프트를 억제하지 않습니다

### Ask fallback (`askFallback`)

프롬프트가 필요하지만 UI에 연결할 수 없으면 fallback이 결정합니다:

- **deny**: 차단합니다.
- **allowlist**: 허용 목록이 일치할 때만 허용합니다.
- **full**: 허용합니다.

### 인라인 인터프리터 eval 강화 (`tools.exec.strictInlineEval`)

`tools.exec.strictInlineEval=true`이면 OpenClaw는 인터프리터 바이너리 자체가 허용 목록에 있더라도 인라인 코드 eval 형식을 승인 전용으로 취급합니다.

예시:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

이는 하나의 안정적인 파일 피연산자에 깔끔하게 매핑되지 않는 인터프리터 로더에 대한 defense-in-depth입니다. strict 모드에서는:

- 이러한 명령은 여전히 명시적 승인이 필요합니다.
- `allow-always`는 이들에 대해 새 허용 목록 항목을 자동으로 영속화하지 않습니다.

## 허용 목록 (에이전트별)

허용 목록은 **에이전트별**입니다. 여러 에이전트가 있다면 macOS 앱에서
편집할 에이전트를 전환하세요. 패턴은 glob 일치입니다.
패턴은 확인된 바이너리 경로 glob 또는 순수 명령 이름 glob일 수 있습니다. 순수 이름은
PATH를 통해 호출된 명령에만 일치하므로, 명령이 `rg`일 때 `rg`는 `/opt/homebrew/bin/rg`와 일치할 수 있지만,
`./rg` 또는 `/tmp/rg`에는 일치하지 않습니다. 특정 바이너리 위치 하나만
신뢰하고 싶다면 경로 glob를 사용하세요.
레거시 `agents.default` 항목은 로드 시 `agents.main`으로 마이그레이션됩니다.
`echo ok && pwd` 같은 셸 체인은 여전히 모든 최상위 세그먼트가 허용 목록 규칙을 만족해야 합니다.

예시:

- `rg`
- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

각 허용 목록 항목은 다음을 추적합니다:

- UI ID에 사용하는 안정적인 UUID인 **id** (선택 사항)
- **last used** 타임스탬프
- **last used command**
- **last resolved path**

## Skill CLI 자동 허용

**Skill CLI 자동 허용**이 활성화되면, 알려진 Skills가 참조하는 실행 파일은
nodes(macOS node 또는 헤드리스 node host)에서 허용 목록으로 취급됩니다. 이것은
Gateway RPC를 통한 `skills.bins`를 사용해 skill bin 목록을 가져옵니다. 엄격한 수동 허용 목록을 원한다면 이 기능을 비활성화하세요.

중요한 신뢰 참고:

- 이것은 수동 경로 허용 목록 항목과 분리된 **암묵적 편의 허용 목록**입니다.
- Gateway와 node가 같은 신뢰 경계 안에 있는 신뢰된 운영자 환경을 위한 것입니다.
- 엄격한 명시적 신뢰가 필요하면 `autoAllowSkills: false`를 유지하고 수동 경로 허용 목록 항목만 사용하세요.

## 안전한 bin 및 승인 전달

안전한 bin(stdin 전용 fast-path), 인터프리터 바인딩 세부 사항, 그리고
승인 프롬프트를 Slack/Discord/Telegram으로 전달하는 방법(또는 이를 네이티브
승인 클라이언트로 실행하는 방법)은 [Exec approvals — advanced](/ko/tools/exec-approvals-advanced)를 참조하세요.

<!-- moved to /tools/exec-approvals-advanced -->

## Control UI 편집

기본값, 에이전트별
재정의, 허용 목록을 편집하려면 **Control UI → Nodes → Exec approvals** 카드를 사용하세요. 범위(기본값 또는 에이전트)를 선택하고, 정책을 조정하고,
허용 목록 패턴을 추가/제거한 다음 **Save**를 누르세요. UI는
목록을 깔끔하게 유지할 수 있도록 패턴별 **last used** 메타데이터를 표시합니다.

대상 선택기는 **Gateway**(로컬 승인) 또는 **Node**를 선택합니다. Nodes는
`system.execApprovals.get/set`를 광고해야 합니다(macOS 앱 또는 헤드리스 node host).
node가 아직 exec 승인을 광고하지 않는 경우, 해당 로컬
`~/.openclaw/exec-approvals.json`을 직접 편집하세요.

CLI: `openclaw approvals`는 gateway 또는 node 편집을 지원합니다([Approvals CLI](/ko/cli/approvals) 참조).

## 승인 흐름

프롬프트가 필요하면 gateway는 `exec.approval.requested`를 운영자 클라이언트에 브로드캐스트합니다.
Control UI와 macOS 앱은 이를 `exec.approval.resolve`로 해결한 다음, gateway가
승인된 요청을 node host로 전달합니다.

`host=node`의 경우 승인 요청에는 정규 `systemRunPlan` 페이로드가 포함됩니다. gateway는
승인된 `system.run`
요청을 전달할 때 해당 plan을 권한 있는 명령/cwd/세션 컨텍스트로 사용합니다.

이것은 비동기 승인 지연 시간에 중요합니다:

- node exec 경로는 먼저 하나의 정규 plan을 준비합니다
- 승인 레코드는 해당 plan과 그 바인딩 메타데이터를 저장합니다
- 승인되면 최종 전달되는 `system.run` 호출은
  이후 호출자 편집을 신뢰하는 대신 저장된 plan을 재사용합니다
- 호출자가 승인 요청이 생성된 후 `command`, `rawCommand`, `cwd`, `agentId`,
  `sessionKey`를 변경하면 gateway는
  전달된 실행을 승인 불일치로 거부합니다

## 시스템 이벤트

exec 수명 주기는 시스템 메시지로 노출됩니다:

- `Exec running` (명령이 실행 중 알림 임계값을 초과한 경우에만)
- `Exec finished`
- `Exec denied`

이 메시지들은 node가 이벤트를 보고한 뒤 에이전트 세션에 게시됩니다.
Gateway-host exec 승인도 명령이 끝날 때(그리고 선택적으로 임계값보다 오래 실행 중일 때) 동일한 수명 주기 이벤트를 발생시킵니다.
승인 게이트가 있는 exec는 쉬운 상관관계를 위해 이 메시지에서 승인 id를 `runId`로 재사용합니다.

## 승인 거부 동작

비동기 exec 승인이 거부되면 OpenClaw는 에이전트가
세션에서 같은 명령의 더 이른 실행 출력물을 재사용하지 못하게 합니다. 거부 이유는
사용 가능한 명령 출력이 없다는 명시적 안내와 함께 전달되며, 이는
에이전트가 새 출력이 있는 것처럼 주장하거나 이전 성공 실행의 오래된 결과로
거부된 명령을 반복하는 것을 막습니다.

## 영향

- **full**은 강력하므로 가능하면 허용 목록을 우선하세요.
- **ask**는 빠른 승인을 허용하면서도 사용자가 흐름에 계속 참여하도록 합니다.
- 에이전트별 허용 목록은 한 에이전트의 승인이 다른 에이전트로 새는 것을 막습니다.
- 승인은 **권한 있는 발신자**의 호스트 exec 요청에만 적용됩니다. 권한 없는 발신자는 `/exec`를 발행할 수 없습니다.
- `/exec security=full`은 권한 있는 운영자를 위한 세션 수준 편의 기능이며 설계상 승인을 건너뜁니다. 호스트 exec를 강제로 차단하려면 승인 보안을 `deny`로 설정하거나 도구 정책을 통해 `exec` 도구를 거부하세요.

## 관련

<CardGroup cols={2}>
  <Card title="Exec approvals — advanced" href="/ko/tools/exec-approvals-advanced" icon="gear">
    안전한 bin, 인터프리터 바인딩, 채팅으로의 승인 전달.
  </Card>
  <Card title="Exec 도구" href="/ko/tools/exec" icon="terminal">
    셸 명령 실행 도구.
  </Card>
  <Card title="상승 모드" href="/ko/tools/elevated" icon="shield-exclamation">
    승인도 건너뛰는 break-glass 경로.
  </Card>
  <Card title="샌드박싱" href="/ko/gateway/sandboxing" icon="box">
    샌드박스 모드와 작업 공간 접근.
  </Card>
  <Card title="보안" href="/ko/gateway/security" icon="lock">
    보안 모델과 강화 방법.
  </Card>
  <Card title="샌드박스 vs 도구 정책 vs elevated" href="/ko/gateway/sandbox-vs-tool-policy-vs-elevated" icon="sliders">
    각각의 제어를 언제 사용해야 하는지.
  </Card>
  <Card title="Skills" href="/ko/tools/skills" icon="sparkles">
    Skill 기반 자동 허용 동작.
  </Card>
</CardGroup>
