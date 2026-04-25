---
read_when:
    - 페어링된 노드(camera, screen, canvas)를 관리하고 있습니다
    - 요청을 승인하거나 Node 명령을 호출해야 합니다
summary: '`openclaw nodes`에 대한 CLI 참조(status, pairing, invoke, camera/canvas/screen)'
title: 노드
x-i18n:
    generated_at: "2026-04-25T05:58:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68a5701ce0dcba399d93f6eed864b0b0ae34320501de0176aeaad1712d392834
    source_path: cli/nodes.md
    workflow: 15
---

# `openclaw nodes`

페어링된 Node(디바이스)를 관리하고 Node 기능을 호출합니다.

관련 항목:

- Node 개요: [Nodes](/ko/nodes)
- Camera: [Camera nodes](/ko/nodes/camera)
- 이미지: [Image nodes](/ko/nodes/images)

공통 옵션:

- `--url`, `--token`, `--timeout`, `--json`

## 공통 명령어

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list`는 보류 중/페어링됨 테이블을 출력합니다. 페어링된 행에는 가장 최근 연결 경과 시간(Last Connect)이 포함됩니다.
현재 연결된 Node만 보려면 `--connected`를 사용하세요. 특정 기간 내에 연결된 Node만
필터링하려면 `--last-connected <duration>`을 사용하세요(예: `24h`, `7d`).

승인 참고:

- `openclaw nodes pending`에는 페어링 범위만 필요합니다.
- `gateway.nodes.pairing.autoApproveCidrs`는
  명시적으로 신뢰된 최초 `role: node` 디바이스 페어링에 한해서만 보류 단계를 건너뛸 수 있습니다. 이 기능은 기본적으로
  꺼져 있으며 업그레이드는 승인하지 않습니다.
- `openclaw nodes approve <requestId>`는
  보류 중인 요청의 추가 범위 요구 사항을 상속합니다.
  - 명령어 없는 요청: 페어링만
  - exec가 아닌 Node 명령어: 페어링 + 쓰기
  - `system.run` / `system.run.prepare` / `system.which`: 페어링 + 관리자

## 호출

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

호출 플래그:

- `--params <json>`: JSON 객체 문자열(기본값 `{}`).
- `--invoke-timeout <ms>`: Node 호출 제한 시간(기본값 `15000`).
- `--idempotency-key <key>`: 선택적 멱등성 키.
- 여기서는 `system.run` 및 `system.run.prepare`가 차단됩니다. 셸 실행에는 `host=node`와 함께 `exec` 도구를 사용하세요.

Node에서 셸을 실행하려면 `openclaw nodes run` 대신 `host=node`와 함께 `exec` 도구를 사용하세요.
이제 `nodes` CLI는 기능 중심입니다. `nodes invoke`를 통한 직접 RPC와 더불어 페어링, camera,
screen, location, canvas, 알림을 지원합니다.

## 관련 항목

- [CLI reference](/ko/cli)
- [Nodes](/ko/nodes)
