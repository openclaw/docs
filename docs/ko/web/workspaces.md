---
read_when:
    - 워크스페이스 탭 및 위젯 구성 또는 재배치
    - 에이전트가 작업 공간을 구성하도록 허용하기
    - 사용자 지정 위젯 승인 및 샌드박스 모델 검토
summary: Control UI의 에이전트 구성 가능 워크스페이스
title: 작업 공간
x-i18n:
    generated_at: "2026-07-12T01:18:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 234baefc18be736599addeeb35f8404b617c1d8f07f058c4a02ec2615ca21aa0
    source_path: web/workspaces.md
    workflow: 16
---

[Control UI](/ko/web/control-ui)의 **워크스페이스** 탭은 사용자와 에이전트가 함께 구성하는 공간입니다. 탭, 위젯, 12열 그리드에서의 위치, 데이터 바인딩은 모두 하나의 문서에 저장됩니다. 해당 문서를 편집할 수 있는 모든 주체, 즉 사용자, `openclaw workspaces` CLI 또는 `workspace_*` 도구를 호출하는 에이전트가 워크스페이스를 구성할 수 있습니다.

모든 쓰기 작업은 검증된 동일한 경로를 거치므로 사용자의 레이아웃과 에이전트의 레이아웃이 서로 달라질 수 없습니다. 승인된 쓰기 작업마다 버전이 증가하고 `plugin.workspaces.changed`가 브로드캐스트되므로, 에이전트가 편집한 내용은 새로고침하지 않아도 이미 열려 있는 브라우저에 표시됩니다.

## 워크스페이스 활성화

번들로 제공되는 워크스페이스 Plugin은 기본적으로 비활성화되어 있습니다. Control UI에서 **Plugins**를 열고 **Workspaces**를 찾은 다음 **Enable**을 선택합니다. CLI에서도 활성화할 수 있습니다.

```sh
openclaw plugins enable workspaces
```

Plugin을 활성화하면 **워크스페이스** 탭이 추가되고 `openclaw workspaces` CLI와 `workspace_*` 에이전트 도구를 사용할 수 있습니다. 비활성화하면 워크스페이스 데이터베이스나 위젯 자산을 삭제하지 않고 해당 인터페이스만 제거됩니다.

## 기본 워크스페이스

처음 불러오면 비용 및 토큰 카드, 인스턴스 상태, 세션, Cron 상태, 활동 피드로 구성된 **개요** 워크스페이스가 표시됩니다. 이는 일반적인 워크스페이스 콘텐츠이므로 끌어서 이동하거나, 접거나, 숨기거나, 삭제할 수 있습니다.

## 기본 제공 위젯

신뢰할 수 있는 위젯 9개가 Plugin과 함께 제공되며 자체 UI로 렌더링됩니다.

`stat-card`, `markdown`, `table`, `iframe-embed`, `sessions`, `usage`, `cron`,
`instances`, `activity`.

위젯은 **바인딩**을 통해 데이터를 선언하며 자체적으로 데이터를 가져오지 않습니다.

| 바인딩   | 확인되는 값                                                                                               |
| -------- | --------------------------------------------------------------------------------------------------------- |
| `static` | 문서에 저장된 리터럴 값(최대 8KB).                                                                        |
| `file`   | `<stateDir>/workspaces/data/` 아래의 JSON, Markdown 또는 CSV 파일이며, 선택적으로 JSON 포인터를 사용해 범위를 좁힐 수 있습니다. |
| `rpc`    | 신뢰할 수 있는 Control UI가 확인하는 읽기 전용 Gateway 메서드의 고정 허용 목록 중 하나.                    |

`file` 바인딩은 자체 수치를 워크스페이스에 넣는 가장 간단한 방법입니다. 데이터 디렉터리에 JSON 파일을 작성하고 `stat-card`가 해당 파일을 가리키도록 설정하면 됩니다.

## 출처

탭과 위젯에는 쓰기 작업을 수행한 주체에 따라 설정되는 `createdBy` 표식(`user`, `system` 또는 `agent:<id>`)이 포함됩니다. 호출자가 이 값을 제공할 수 없으므로 에이전트가 자신의 작업을 사용자의 작업으로 표시할 수 없으며, 에이전트가 작성한 위젯의 "AI" 칩은 항상 실제 작성 주체를 정확히 나타냅니다.

## 사용자 지정 위젯

에이전트는 `workspace_widget_scaffold`를 사용해 실제 HTML 위젯을 작성할 수 있습니다. 사용자는 `openclaw workspaces widget-scaffold <name>`을 사용할 수 있습니다. 에이전트가 작성한 코드는 적대적인 것으로 취급됩니다.

- 스캐폴딩된 위젯은 **승인 대기** 상태로 레지스트리에 등록됩니다. 운영자가 승인할 때까지 iframe이 생성되지 않으며 자산 경로는 해당 파일에 대해 404를 반환합니다.
- 승인은 레이아웃 편집과 별개의 결정입니다. `workspaces.widget.approve`에는 실행 승인을 보호하는 것과 동일한 `operator.approvals` 범위가 필요합니다.
- 승인된 위젯은 `<iframe sandbox="allow-scripts">`에서 렌더링되며 `allow-same-origin`은 절대 사용하지 않습니다. 따라서 출처가 불투명하며 상위 문서의 DOM, 저장소 또는 쿠키에 접근할 수 없습니다.
- 자산은 `connect-src 'none'`으로 제공되어 `fetch`, XHR, WebSockets 같은 스크립트 네트워크 통신이 차단됩니다. 자격 증명을 보유하지 않으며 Gateway와 통신하지 않습니다.
- 데이터는 버전이 지정된 `postMessage` 브리지를 통해서만 전달됩니다. 사용자 지정 코드는 선언된 `static` 바인딩을 받을 수 있으며, 이 값은 이미 에이전트나 운영자가 작성한 워크스페이스 값입니다. RPC와 파일 바인딩은 신뢰할 수 있는 기본 제공 위젯에만 유지됩니다. 브라우저에서는 샌드박스된 하위 프레임이 자체 프레임을 탐색할 수 있으므로 권한이 있는 데이터는 에이전트가 작성한 HTML에 절대 게시되지 않습니다.

위젯에서 채팅으로 프롬프트를 보내려면 추가로 매니페스트 기능과 호출마다 정확한 텍스트를 인용하는 확인이 필요하며, 속도 제한도 적용됩니다.

## CLI

```sh
openclaw workspaces tabs list
openclaw workspaces tabs create --title Financials
openclaw workspaces widget-scaffold revenue-chart --title "Revenue Chart"
openclaw workspaces widget-approve revenue-chart
```

`widget-approve`에는 `operator.approvals` 범위와 페어링된 기기가 필요합니다. Control UI에서 승인할 때는 브라우저가 이미 해당 범위를 보유하고 있으므로 필요하지 않습니다.

## 저장소

워크스페이스 문서, 사용자 지정 위젯 레지스트리, 항목 20개의 실행 취소 링은 `<stateDir>/workspaces/workspaces.sqlite`에 저장됩니다. 에이전트가 작성한 위젯 자산은 `<stateDir>/workspaces/widgets/<name>/` 아래에, 파일 바인딩 데이터는 `<stateDir>/workspaces/data/` 아래에 디스크 파일로 유지됩니다. 에이전트가 일반 파일 도구를 사용해 이를 작성하고 위젯 경로가 해당 바이트를 제공하기 때문입니다.
