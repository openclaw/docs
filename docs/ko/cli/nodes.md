---
read_when:
    - 페어링된 Node(카메라, 화면, 캔버스)를 관리하고 있습니다
    - 요청을 승인하거나 Node 명령을 호출해야 합니다
summary: '`openclaw nodes`용 CLI 참조 (상태, 페어링, 호출, 카메라/캔버스/화면/위치/알림)'
title: Node들
x-i18n:
    generated_at: "2026-07-16T12:27:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5b57235006d803fe09f626a65157dfb1f620d3d3c6f337e33132bcffdf4f1e37
    source_path: cli/nodes.md
    workflow: 16
---

# `openclaw nodes`

페어링된 Node(기기)를 관리하고 Node 기능을 호출합니다.

관련 문서: [Node 개요](/ko/nodes) - [활성 컴퓨터 상태](/ko/nodes/presence) - [카메라 Node](/ko/nodes/camera) - [이미지 Node](/ko/nodes/images)

모든 하위 명령의 공통 옵션: `--url <url>`, `--token <token>`, `--timeout <ms>`(기본값 `10000`), `--json`.

## 상태

```bash
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
openclaw nodes list
openclaw nodes describe --node <idOrNameOrIp>
```

`status`와 `list`는 모두 `--connected`(연결된 Node만)와 `--last-connected <duration>`(예: `24h`, `7d`; 해당 기간 내에 연결된 Node만)을 허용합니다. `list`은 대기 중인 Node와 페어링된 Node를 별도의 표로 표시하며, 페어링된 행에는 가장 최근 연결 이후 경과 시간(Last Connect)이 포함됩니다. `status`는 Node별 기능, 버전, 마지막 입력 세부 정보가 포함된 하나의 통합 표를 표시합니다. 연결된 macOS Node는 손쉬운 사용 권한이 부여된 동안에만 마지막 입력을 보고하며, 가장 최신 행에는 `active`가 표시됩니다. [활성 컴퓨터 상태](/ko/nodes/presence)를 참조하십시오. `describe`은 한 Node의 기능, 권한, 활동 및 유효한/대기 중인 호출 명령을 출력합니다.

## 페어링

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
```

이 명령들은 Node의 WS `connect` 핸드셰이크를 제어하는 기기 페어링(`openclaw devices approve`)과는 별개인, Gateway 소유의 `node.pair.*` 저장소를 조작합니다. 두 방식의 관계는 [Node](/ko/nodes)를 참조하십시오.

- `remove`은 Node의 페어링된 역할 항목을 취소합니다. 기기 기반 Node의 경우 기기 페어링 저장소에서 `node` 역할을 취소하고 해당 Node 역할 세션의 연결을 해제합니다. 여러 역할이 있는 기기는 행을 유지하고 `node` 역할만 잃으며, Node 전용 기기 행은 삭제됩니다. 또한 일치하는 기존 Gateway 소유 Node 페어링 레코드를 모두 지웁니다.
- `pending`에는 `operator.pairing` 범위만 필요합니다.
- `gateway.nodes.pairing.autoApproveCidrs`는 명시적으로 신뢰하는 최초 `role: node` 기기 페어링의 대기 단계를 건너뛸 수 있습니다. 기본적으로 꺼져 있으며 역할 업그레이드는 승인하지 않습니다.
- `gateway.nodes.pairing.sshVerify`(기본적으로 켜짐)은 Gateway가 SSH를 통해 Node 호스트의 기기 키를 확인할 수 있을 때 최초 `role: node` 기기 페어링을 자동 승인합니다. 첫 번째 기능 표면도 같은 단계에서 승인됩니다. [Node 페어링](/ko/gateway/pairing#ssh-verified-device-auto-approval-default)을 참조하십시오.
- `approve` 범위 요구 사항은 대기 중인 요청에서 선언한 명령에 따라 달라집니다.
  - 명령이 없는 요청: `operator.pairing`
  - 일반 Node 명령: `operator.pairing` + `operator.write`
  - 관리자 민감 명령(`system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir`, `system.execApprovals.get/set`): `operator.pairing` + `operator.admin`
- `remove` 범위: `operator.pairing`는 운영자가 아닌 Node 행을 제거할 수 있습니다. 여러 역할이 있는 기기에서 기기 토큰 호출자가 자신의 Node 역할을 취소하려면 `operator.admin`도 필요합니다.

## 호출

```bash
openclaw nodes invoke --node <id> --command system.which --params '{"bins":["uname"]}'
```

플래그:

- `--command <command>`(필수): 예: `canvas.eval`.
- `--params <json>`: JSON 객체 문자열(기본값 `{}`).
- `--invoke-timeout <ms>`: Node 호출 제한 시간(기본값 `15000`).
- `--idempotency-key <key>`: 선택적 멱등성 키.

여기서는 `system.run` 및 `system.run.prepare`가 차단됩니다. 대신 셸 실행에는 `host=node`와 함께 `exec` 도구를 사용하십시오. `system.which`는 `invoke`를 통해 허용됩니다.

## 알림, 푸시, 위치, 화면

```bash
openclaw nodes notify --node <id> --title "Build" --body "Done" --priority timeSensitive
openclaw nodes push --node <id> --title "OpenClaw" --environment sandbox
openclaw nodes location get --node <id> --accuracy precise
openclaw nodes screen record --node <id> --duration 10s --fps 10 --out ./clip.mp4
```

- `notify`은 macOS, iOS, Android 및 직접 연결된 watchOS Node를 포함하여 `system.notify`을 선언하는 Node에 로컬 알림을 보냅니다. watchOS에 직접 전달하려면 OpenClaw가 활성 상태여야 합니다. `--title` 또는 `--body`이 필요합니다. 옵션: `--sound <name>`, `--priority <passive|active|timeSensitive>`, `--delivery <system|overlay|auto>`(기본값 `system`), `--invoke-timeout <ms>`(기본값 `15000`).
- `push`은 iOS Node에 APNs 테스트 푸시를 보냅니다. 옵션: `--title <text>`(기본값 `OpenClaw`), `--body <text>`, 감지된 APNs 환경을 재정의하는 `--environment <sandbox|production>`.
- `location get`는 Node의 현재 위치를 가져옵니다. 옵션: `--max-age <ms>`(캐시된 위치 정보를 재사용), `--accuracy <coarse|balanced|precise>`, `--location-timeout <ms>`(기본값 `10000`), `--invoke-timeout <ms>`(기본값 `20000`).
- `screen record`는 짧은 클립을 캡처하고 저장된 경로를 출력합니다(또는 `--json`을 사용하여 JSON을 작성합니다). 옵션: `--screen <index>`(기본값 `0`), `--duration <ms|10s>`(기본값 `10000`), `--fps <fps>`(기본값 `10`), `--no-audio`, `--out <path>`, `--invoke-timeout <ms>`(기본값 `120000`).

카메라 및 Canvas 명령에는 별도의 문서가 있습니다. [카메라 Node](/ko/nodes/camera), [Canvas](/ko/platforms/mac/canvas)를 참조하십시오. Canvas는 번들로 제공되는 실험적 Canvas Plugin으로 구현됩니다. 코어는 호환성 마운트 지점으로 `openclaw nodes canvas`을 유지합니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [Node](/ko/nodes)
