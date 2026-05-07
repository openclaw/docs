---
read_when:
    - 페어링된 노드(카메라, 화면, 캔버스)를 관리하고 있습니다
    - 요청을 승인하거나 Node 명령을 호출해야 합니다
summary: '`openclaw nodes`에 대한 CLI 참조(상태, 페어링, 호출, 카메라/캔버스/화면)'
title: Node
x-i18n:
    generated_at: "2026-05-07T13:14:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 681c199462d5f58c3e4346713263a78e7513335f087c713877e3050e21c8e15f
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

페어링된 노드(기기)를 관리하고 노드 기능을 호출합니다.

관련 항목:

- 노드 개요: [노드](/ko/nodes)
- 카메라: [카메라 노드](/ko/nodes/camera)
- 이미지: [이미지 노드](/ko/nodes/images)

공통 옵션:

- `--url`, `--token`, `--timeout`, `--json`

## 공통 명령

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list`는 대기 중/페어링됨 테이블을 출력합니다. 페어링된 행에는 가장 최근 연결 경과 시간(마지막 연결)이 포함됩니다.
`--connected`를 사용하면 현재 연결된 노드만 표시합니다. `--last-connected <duration>`을 사용하면
지정한 기간(예: `24h`, `7d`) 내에 연결된 노드로 필터링합니다.
오래된 Gateway 소유 노드 페어링 레코드를 삭제하려면 `nodes remove --node <id|name|ip>`를 사용합니다.

승인 참고:

- `openclaw nodes pending`에는 페어링 범위만 필요합니다.
- `gateway.nodes.pairing.autoApproveCidrs`는
  명시적으로 신뢰된 최초 `role: node` 기기 페어링에 대해서만 대기 단계를 건너뛸 수 있습니다. 기본적으로 꺼져 있으며
  업그레이드는 승인하지 않습니다.
- `openclaw nodes approve <requestId>`는
  대기 중인 요청에서 추가 범위 요구 사항을 상속합니다.
  - 명령 없는 요청: 페어링만
  - exec가 아닌 노드 명령: 페어링 + 쓰기
  - `system.run` / `system.run.prepare` / `system.which`: 페어링 + 관리자

## 호출

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

호출 플래그:

- `--params <json>`: JSON 객체 문자열(기본값 `{}`).
- `--invoke-timeout <ms>`: 노드 호출 제한 시간(기본값 `15000`).
- `--idempotency-key <key>`: 선택적 멱등성 키.
- `system.run` 및 `system.run.prepare`는 여기에서 차단됩니다. 셸 실행에는 `host=node`와 함께 `exec` 도구를 사용하세요.

노드에서 셸을 실행하려면 `openclaw nodes run` 대신 `host=node`와 함께 `exec` 도구를 사용하세요.
이제 `nodes` CLI는 기능 중심입니다. `nodes invoke`를 통한 직접 RPC와 페어링, 카메라,
화면, 위치, Canvas, 알림을 제공합니다. Canvas 명령은 번들로 제공되는 실험적 Canvas Plugin에서 구현됩니다. 코어는 호환성 훅을 유지하므로 해당 명령은 계속 `openclaw nodes canvas` 아래에 남아 있습니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [노드](/ko/nodes)
