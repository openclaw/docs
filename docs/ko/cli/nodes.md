---
read_when:
    - 페어링된 노드(카메라, 화면, 캔버스)를 관리하고 있습니다
    - 요청을 승인하거나 node 명령을 호출해야 합니다
summary: '`openclaw nodes`용 CLI 참조 (status, pairing, invoke, camera/canvas/screen)'
title: Node
x-i18n:
    generated_at: "2026-04-30T06:24:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3229db91d7e64b0d37bee29bd51895d90796f5fd33b67e3d900fd8bda2b6e7e9
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

`nodes list`는 보류 중/페어링된 테이블을 출력합니다. 페어링된 행에는 가장 최근 연결 경과 시간(마지막 연결)이 포함됩니다.
현재 연결된 노드만 표시하려면 `--connected`를 사용합니다. 지정한 기간 내에 연결된 노드로
필터링하려면 `--last-connected <duration>`을 사용합니다(예: `24h`, `7d`).
오래된 Gateway 소유 노드 페어링 레코드를 삭제하려면 `nodes remove --node <id|name|ip>`를 사용합니다.

승인 참고 사항:

- `openclaw nodes pending`에는 페어링 범위만 필요합니다.
- `gateway.nodes.pairing.autoApproveCidrs`는 명시적으로 신뢰된 최초 `role: node` 기기 페어링에 대해서만
  보류 단계를 건너뛸 수 있습니다. 기본적으로 꺼져 있으며
  업그레이드를 승인하지 않습니다.
- `openclaw nodes approve <requestId>`는 보류 중인 요청에서 추가 범위 요구 사항을
  상속합니다.
  - 명령 없는 요청: 페어링만
  - 실행이 아닌 노드 명령: 페어링 + 쓰기
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
`nodes` CLI는 이제 기능 중심입니다. 즉, 페어링, 카메라, 화면,
위치, 캔버스, 알림에 더해 `nodes invoke`를 통한 직접 RPC를 제공합니다.

## 관련 항목

- [CLI 참조](/ko/cli)
- [노드](/ko/nodes)
