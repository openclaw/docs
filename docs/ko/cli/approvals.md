---
read_when:
    - CLI에서 실행 승인을 편집하려는 경우
    - Gateway 또는 Node 호스트에서 허용 목록을 관리해야 합니다
summary: '`openclaw approvals` 및 `openclaw exec-policy`의 CLI 참조 안내'
title: 승인
x-i18n:
    generated_at: "2026-07-12T00:36:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5b045a4dee3726a7df2368b704a00464dc9e575bf77747103e34ebdfe0aa2df
    source_path: cli/approvals.md
    workflow: 16
---

# `openclaw approvals`

**로컬 호스트**, **Gateway 호스트** 또는 **Node 호스트**의 실행 승인을 관리합니다. 대상 플래그가 없으면 명령은 디스크의 로컬 승인 파일을 읽고 씁니다. Gateway를 대상으로 하려면 `--gateway`를 사용하고, 특정 Node를 대상으로 하려면 `--node <id|name|ip>`를 사용합니다.

별칭: `openclaw exec-approvals`

관련 문서: [실행 승인](/ko/tools/exec-approvals), [Node](/ko/nodes)

## `openclaw exec-policy`

`openclaw exec-policy`는 요청된 `tools.exec.*` 구성과 로컬 호스트 승인 파일을 한 단계로 동기화하는 **로컬 전용** 편의 명령입니다.

```bash
openclaw exec-policy show
openclaw exec-policy show --json

openclaw exec-policy preset yolo
openclaw exec-policy preset cautious --json

openclaw exec-policy set --host gateway --security full --ask off --ask-fallback full
```

프리셋(`yolo`, `cautious`, `deny-all`)은 `host`, `security`, `ask`, `askFallback`을 함께 적용합니다. `set`은 전달한 플래그만 적용하며, 허용되는 각 값은 검증됩니다(`--host auto|sandbox|gateway|node`, `--security deny|allowlist|full`, `--ask off|on-miss|always`, `--ask-fallback deny|allowlist|full`).

범위:

- 로컬 구성 파일과 로컬 승인 파일을 함께 업데이트하며, 정책을 Gateway 또는 Node 호스트에 푸시하지 않습니다.
- `--host node`는 거부됩니다. Node 실행 승인은 런타임에 Node에서 가져오므로 로컬 `exec-policy`로 동기화할 수 없습니다. 대신 `openclaw approvals set --node <id|name|ip>`를 사용합니다.
- `exec-policy show`는 로컬 승인 파일에서 유효 정책을 도출하는 대신 `host=node` 범위를 런타임에 Node가 관리하는 것으로 표시합니다.

원격 호스트 승인의 경우 `openclaw approvals set --gateway` 또는 `openclaw approvals set --node <id|name|ip>`를 직접 사용합니다.

## 일반 명령

```bash
openclaw approvals get
openclaw approvals get --node <id|name|ip>
openclaw approvals get --gateway
```

`get`은 대상의 유효 실행 정책, 즉 요청된 `tools.exec` 정책, 호스트 승인 파일 정책 및 병합된 유효 결과를 표시합니다. Windows 컴패니언처럼 호스트 네이티브 정책을 사용하는 Node는 OpenClaw 승인 파일 정책 계산을 적용하는 대신 해당 정책을 직접 표시합니다.

파일 기반 Node에서 병합된 보기를 표시하려면 호스트에서 해석한 정책 스냅샷이 필요합니다. 이전 버전의 Node는 Gateway에서 요청한 정책이 호스트에도 적용된다고 가정하지 않고 유효 정책을 사용할 수 없음으로 표시합니다.

<Note>
세션별 `/exec` 재정의는 포함되지 않습니다. 현재 기본값을 확인하려면 관련 세션에서 `/exec`를 실행합니다.
</Note>

우선순위:

- 호스트 승인 파일이 강제 적용 가능한 단일 진실 공급원입니다.
- 요청된 `tools.exec` 정책으로 의도한 범위를 좁히거나 넓힐 수 있지만, 유효 결과는 호스트 규칙에서 도출됩니다.
- `--node`는 Node 호스트 승인 파일과 Gateway `tools.exec` 정책을 결합합니다(둘 다 런타임에 적용됨).
- Gateway 구성을 사용할 수 없으면 CLI는 Node 승인 스냅샷으로 대체하고 최종 런타임 정책을 계산할 수 없음을 알립니다.

## 파일의 승인으로 교체

```bash
openclaw approvals set --file ./exec-approvals.json
openclaw approvals set --stdin <<'EOF'
{ version: 1, defaults: { security: "full", ask: "off", askFallback: "full" } }
EOF
openclaw approvals set --node <id|name|ip> --file ./exec-approvals.json
openclaw approvals set --gateway --file ./exec-approvals.json
```

`set`은 엄격한 JSON뿐 아니라 JSON5도 허용합니다. `--file` 또는 `--stdin` 중 하나만 사용해야 하며, 둘을 함께 사용할 수 없습니다.

호스트 네이티브 Windows Node는 자체 정책 형식을 사용합니다.

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  defaultAction: "deny",
  rules: [{ pattern: "hostname", action: "allow" }]
}
EOF
```

CLI는 먼저 Node의 현재 해시를 읽고 업데이트와 함께 전송하므로, 동시에 이루어진 로컬 편집 내용을 덮어쓰는 대신 업데이트를 거부합니다. 이 작업은 Node의 전체 규칙 목록을 교체하므로 `rules`가 필수이며, `defaultAction`은 선택 사항입니다. 네이티브 정책이 비활성화되었다고 보고하는 Node는 원격으로 구성할 수 없습니다. 먼저 해당 호스트에서 정책을 활성화하거나 구성해야 합니다. 호스트 네이티브 정책은 `allowlist add|remove` 도우미를 지원하지 않습니다.

## "확인하지 않음" / YOLO 예시

실행 승인 때문에 절대 중단되어서는 안 되는 호스트의 승인 기본값을 `full` + `off`로 설정합니다.

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

OpenClaw 승인 파일을 노출하는 Node의 경우 동일한 본문을 `openclaw approvals set --node <id|name|ip> --stdin`과 함께 사용합니다. 호스트 네이티브 Node에는 위에 표시된 소유자별 형식이 필요합니다.

이는 **호스트 승인 파일**만 변경합니다. 요청된 OpenClaw 정책도 일치시키려면 다음 항목도 설정합니다.

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
```

여기서는 `tools.exec.host=gateway`를 명시적으로 사용합니다. `host=auto`는 여전히 "사용 가능한 경우 샌드박스, 그렇지 않으면 Gateway"를 의미하기 때문입니다. YOLO는 라우팅이 아니라 승인에 관한 것입니다. 샌드박스가 구성되어 있더라도 호스트 실행을 원하면 `gateway`(또는 `/exec host=gateway`)를 사용합니다.

생략된 `askFallback`의 기본값은 `deny`입니다. UI가 없으며 확인 없이 계속 실행되어야 하는 호스트를 업그레이드할 때는 `askFallback: "full"`을 명시적으로 설정합니다.

로컬 머신에서만 같은 의도를 적용하는 로컬 단축 명령은 다음과 같습니다.

```bash
openclaw exec-policy preset yolo
```

## 허용 목록 도우미

```bash
openclaw approvals allowlist add "~/Projects/**/bin/rg"
openclaw approvals allowlist add --agent main --node <id|name|ip> "/usr/bin/uptime"
openclaw approvals allowlist add --agent "*" "/usr/bin/uname"

openclaw approvals allowlist remove "~/Projects/**/bin/rg"
```

## 공통 옵션

`get`, `set`, `allowlist add|remove`는 모두 다음을 지원합니다.

- `--node <id|name|ip>`(ID, 이름, IP 또는 ID 접두사를 해석하며 `openclaw nodes`와 동일한 해석기를 사용)
- `--gateway`
- 공유 Node RPC 옵션: `--url`, `--token`, `--timeout`, `--json`

대상 플래그가 없으면 디스크의 로컬 승인 파일을 대상으로 합니다.

`allowlist add|remove`는 `--agent <id>`도 지원합니다(기본값은 `"*"`이며 모든 에이전트에 적용됨).

## 참고

- Node 호스트는 `system.execApprovals.get/set`을 지원한다고 알려야 합니다(macOS 앱, 헤드리스 Node 호스트 또는 Windows 컴패니언).
- 승인 파일은 각 호스트의 OpenClaw 상태 디렉터리에 저장됩니다. 경로는 `$OPENCLAW_STATE_DIR/exec-approvals.json`이며, 변수가 설정되지 않은 경우 `~/.openclaw/exec-approvals.json`입니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [실행 승인](/ko/tools/exec-approvals)
