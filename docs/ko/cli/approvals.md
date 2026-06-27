---
read_when:
    - CLI에서 exec 승인을 편집하려고 합니다
    - Gateway 또는 Node 호스트에서 허용 목록을 관리해야 합니다
summary: '`openclaw approvals` 및 `openclaw exec-policy`의 CLI 참조'
title: 승인
x-i18n:
    generated_at: "2026-06-27T17:16:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e5521622ee48237d3cc9feaa54906d026dfb15da4c9b9b17655cd59b35cae19d
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**로컬 호스트**, **Gateway 호스트** 또는 **노드 호스트**의 exec 승인을 관리합니다.
기본적으로 명령은 디스크의 로컬 승인 파일을 대상으로 합니다. Gateway를 대상으로 하려면 `--gateway`를 사용하고, 특정 노드를 대상으로 하려면 `--node`를 사용하세요.

별칭: `openclaw exec-approvals`

관련 항목:

- Exec 승인: [Exec 승인](/ko/tools/exec-approvals)
- 노드: [노드](/ko/nodes)

## `openclaw exec-policy`

`openclaw exec-policy`는 요청된 `tools.exec.*` 구성과 로컬 호스트 승인 파일을
한 단계에서 맞춰 유지하기 위한 로컬 편의 명령입니다.

다음이 필요할 때 사용하세요.

- 로컬 요청 정책, 호스트 승인 파일, 유효 병합 결과 검사
- YOLO 또는 모두 거부 같은 로컬 프리셋 적용
- 로컬 `tools.exec.*`와 로컬 호스트 승인 파일 동기화

예시:

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

출력 모드:

- `--json` 없음: 사람이 읽을 수 있는 표 보기를 출력합니다.
- `--json`: 기계가 읽을 수 있는 구조화된 출력을 출력합니다.

현재 범위:

- `exec-policy`는 **로컬 전용**입니다.
- 로컬 구성 파일과 로컬 승인 파일을 함께 업데이트합니다.
- 정책을 Gateway 호스트나 노드 호스트로 푸시하지 **않습니다**.
- 이 명령에서는 `--host node`가 거부됩니다. 노드 exec 승인은 런타임에 노드에서 가져오며, 대신 노드 대상 승인 명령으로 관리해야 하기 때문입니다.
- `openclaw exec-policy show`는 로컬 승인 파일에서 유효 정책을 도출하는 대신 `host=node` 범위를 런타임에 노드 관리형으로 표시합니다.

원격 호스트 승인을 직접 편집해야 한다면 계속 `openclaw approvals set --gateway`
또는 `openclaw approvals set --node <id|name|ip>`를 사용하세요.

## 일반 명령

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

이제 `openclaw approvals get`은 로컬, Gateway, 노드 대상의 유효 exec 정책을 표시합니다.

- 요청된 `tools.exec` 정책
- 호스트 승인 파일 정책
- 우선순위 규칙 적용 후 유효 결과

우선순위는 의도된 동작입니다.

- 호스트 승인 파일은 강제 적용 가능한 진실의 원천입니다.
- 요청된 `tools.exec` 정책은 의도를 좁히거나 넓힐 수 있지만, 유효 결과는 여전히 호스트 규칙에서 도출됩니다.
- `--node`는 노드 호스트 승인 파일과 Gateway `tools.exec` 정책을 결합합니다. 런타임에는 둘 다 여전히 적용되기 때문입니다.
- Gateway 구성을 사용할 수 없으면 CLI는 노드 승인 스냅샷으로 폴백하고 최종 런타임 정책을 계산할 수 없었다고 알립니다.

## 파일에서 승인 대체

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set`은 엄격한 JSON뿐 아니라 JSON5도 허용합니다. `--file` 또는 `--stdin` 중 하나만 사용하고 둘 다 사용하지 마세요.

## "프롬프트 표시 안 함" / YOLO 예시

exec 승인에서 절대 멈추지 않아야 하는 호스트의 경우 호스트 승인 기본값을 `full` + `off`로 설정하세요.

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

노드 변형:

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

이는 **호스트 승인 파일**만 변경합니다. 요청된 OpenClaw 정책도 맞춰 유지하려면 다음도 설정하세요.

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

이 예시에서 `tools.exec.host=gateway`를 사용하는 이유:

- `host=auto`는 여전히 "사용 가능하면 샌드박스, 아니면 Gateway"를 의미합니다.
- YOLO는 승인에 관한 것이며 라우팅에 관한 것이 아닙니다.
- 샌드박스가 구성되어 있어도 호스트 exec를 원한다면 `gateway` 또는 `/exec host=gateway`로 호스트 선택을 명시하세요.

생략된 `askFallback`의 기본값은 `deny`입니다. UI가 없는 호스트를 업그레이드할 때 프롬프트를 표시하지 않는 동작을 유지해야 한다면 `askFallback: "full"`을
명시적으로 설정하세요.

로컬 바로가기:

```bash
openclaw exec-policy preset yolo
```

이 로컬 바로가기는 요청된 로컬 `tools.exec.*` 구성과 로컬 승인 기본값을
함께 업데이트합니다. 의도상 위의 수동 2단계 설정과 동일하지만, 로컬 머신에만 적용됩니다.

## 허용 목록 헬퍼

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 일반 옵션

`get`, `set`, `allowlist add|remove`는 모두 다음을 지원합니다.

- `--node <id|name|ip>`
- `--gateway`
- 공유 노드 RPC 옵션: `--url`, `--token`, `--timeout`, `--json`

대상 지정 참고 사항:

- 대상 플래그가 없으면 디스크의 로컬 승인 파일을 의미합니다.
- `--gateway`는 Gateway 호스트 승인 파일을 대상으로 합니다.
- `--node`는 id, 이름, IP 또는 id 접두사를 해석한 뒤 하나의 노드 호스트를 대상으로 합니다.

`allowlist add|remove`는 다음도 지원합니다.

- `--agent <id>`(기본값은 `*`)

## 참고

- `--node`는 `openclaw nodes`와 동일한 해석기를 사용합니다(id, 이름, ip 또는 id 접두사).
- `--agent`의 기본값은 `"*"`이며, 모든 에이전트에 적용됩니다.
- 노드 호스트는 `system.execApprovals.get/set`을 알려야 합니다(macOS 앱 또는 헤드리스 노드 호스트).
- 승인 파일은 OpenClaw 상태 디렉터리에 호스트별로 저장됩니다.
  (`$OPENCLAW_STATE_DIR/exec-approvals.json`, 또는
  변수가 설정되지 않은 경우 `~/.openclaw/exec-approvals.json`).

## 관련 항목

- [CLI 참조](/ko/cli)
- [Exec 승인](/ko/tools/exec-approvals)
