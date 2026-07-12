---
read_when:
    - Gateway 에이전트가 Mac 데스크톱을 보고 제어하도록 허용하기
    - 컴퓨터 사용을 위한 활성화, 권한 또는 안전 조치
    - computer.act Node 명령 또는 해당 실행기 확장하기
summary: computer 도구와 computer.act Node 명령을 통해 페어링된 macOS Node에서 에이전트 기반 데스크톱 제어 수행
title: 컴퓨터 사용
x-i18n:
    generated_at: "2026-07-12T15:24:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

컴퓨터 사용 기능을 사용하면 Gateway 에이전트가 페어링된 **macOS** 데스크톱을 보고 제어할 수 있습니다. 기존 `screen.snapshot` Node 명령으로 스크린샷을 캡처하고, 하나의 위험한 Node 명령인 `computer.act`를 통해 포인터와 키보드를 조작합니다. 작업 집합은 핵심 Anthropic 컴퓨터 사용 작업을 따르며, 선택 사항인 `computer_20251124` 확대/축소 기능은 노출되지 않습니다. 비전 지원 모델은 기본 제공 `computer` 에이전트 도구를 통해 이를 제어합니다.

에이전트는 단일 통합 명령인 `computer.act`를 내보내며, Node가 이를 어떻게 수행하는지는 알 수 없습니다. macOS Node는 내장된 Peekaboo 서비스와 제한적인 CoreGraphics 기본 기능을 사용하여 프로세스 내에서 `computer.act`를 수행합니다(TCC 권한이 올바르게 설정되며 추가 프로세스는 없습니다). 향후 다른 플랫폼도 에이전트 대상 계약을 변경하지 않고 동일한 명령을 수행할 수 있습니다.

## 요구 사항

- 페어링된 **macOS** Node(Node 모드로 실행 중인 OpenClaw macOS 앱).
- macOS 앱 설정에서 **Allow Computer Control** 활성화(기본값: 꺼짐).
- OpenClaw에 macOS **Accessibility** 권한(포인터/키보드 입력용)과 **Screen Recording** 권한(`screen.snapshot`용) 부여.
- Gateway에서 `computer.act` 명령 활성화(위험한 명령이며 기본적으로 비활성화됨).
- 비전 지원 에이전트 모델.
- `computer`를 노출하는 도구 정책. 기본 `coding` 프로필은 이를 노출하지 않습니다. `tools.alsoAllow`에 `computer`를 추가하십시오. 샌드박스 에이전트는 `tools.sandbox.tools.alsoAllow`에도 추가해야 합니다.

## `computer` 에이전트 도구

기본 제공 `computer` 도구는 호출당 하나의 작업을 받습니다. 좌표는 가장 최근 스크린샷에서 음수가 아닌 정수 픽셀로 지정하며, Node가 이를 디스플레이 포인트로 매핑합니다. 좌표 작업은 스크린샷 결과의 `frameId`를 그대로 전달해야 하며, 명시적인 `screenIndex`는 해당 프레임과 일치해야 합니다. OpenClaw는 Node가 발급한 디스플레이 ID도 스크린샷에서 작업으로 전달하므로, 디스플레이가 다시 연결되거나 지오메트리가 변경되면 동일한 인덱스로 조용히 대상을 변경하는 대신 안전하게 실패합니다. 이러한 검사는 추측한 토큰과 전달된 다른 프레임 또는 디스플레이의 토큰을 거부합니다. 토큰이 최신 상태를 보장하지는 않습니다. 캡처 후에도 동일한 디스플레이에서 앱이 픽셀을 변경할 수 있으므로 장면이 변경되었을 가능성이 있으면 새 스크린샷을 캡처하십시오.

- 읽기: `screenshot`.
- 포인터: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag`(`startCoordinate` 사용), `left_mouse_down`, `left_mouse_up`.
- 스크롤: `scrollDirection`(`up|down|left|right`)과 `scrollAmount`(휠 틱)를 사용하는 `scroll`.
- 키보드: `type`(텍스트), `key`(`cmd+shift+t` 또는 `Return`과 같은 키 조합), `hold_key`(`duration`초 동안 누르고 있을 `text` 키 조합).
- 속도 조절: `wait`(`duration`초).

클릭 및 스크롤 작업에서는 보조 키를 `text` 필드로 전달합니다(`shift`, `ctrl`, `alt`, `cmd`). 입력 작업 후 도구는 모델이 결과를 확인할 수 있도록 새 스크린샷을 반환합니다. 컴퓨터 사용이 가능한 Node가 둘 이상 연결되어 있으면 `node`를 명시적으로 전달하십시오.

스크린샷은 **모델 전용**으로 유지되며 채팅 채널에 자동으로 전달되지 않습니다. 화면의 모든 콘텐츠를 신뢰할 수 없는 입력으로 취급하십시오. 도구는 사용자의 요청과 충돌하는 화면상의 지침을 따르지 않도록 모델에 경고합니다.

## `computer.act` Node 명령

`computer.act`는 도구가 입력을 라우팅하는 단일 Node 명령입니다(`command: "computer.act"`를 사용하는 `node.invoke`). 이 명령은 다음과 같습니다.

- **기본적으로 위험함**: 기본 제공 위험 Node 명령에 등록되어 있으며 명시적으로 활성화하기 전까지 런타임 허용 목록에서 제외됩니다. macOS Node는 페어링 시 이 명령을 선언하여 명령 표면을 한 번만 승인하도록 할 수 있습니다.
- 현재 **macOS 전용**: **Allow Computer Control**이 활성화된 macOS Node만 이 명령을 알립니다.

읽기 작업은 `screen.snapshot`을 재사용하며 별도의 두 번째 캡처 경로는 없습니다. 공유 캡처 명령에 대한 자세한 내용은 [카메라 및 화면 Node](/ko/nodes/camera)를 참조하십시오.

## 활성화 및 허용

1. macOS 앱에서 **Settings → Allow Computer Control**을 활성화하십시오. 그런 다음 **Settings → Permissions**를 열고 macOS System Settings에서 **Accessibility**와 **Screen Recording** 권한을 부여하십시오.
2. Gateway에서 페어링 업데이트를 승인하십시오(새 명령을 추가하면 다시 페어링해야 함).
3. 비전 지원 에이전트에 도구를 노출하십시오. 기본 `coding` 프로필의 경우:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // 샌드박스 에이전트에는 이 두 번째 게이트도 필요합니다.
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. 제한된 시간 동안 `computer.act`를 활성화하십시오. `phone-control` Plugin은 `computer` 그룹을 제공합니다.

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   활성화하려면 `operator.admin` 권한(또는 소유자)이 필요하며 자동으로 만료됩니다. 기존 `/phone arm all` 그룹은 의도적으로 데스크톱 제어를 제외하므로 명시적인 `computer` 그룹을 사용하십시오. 활성화는 Gateway가 호출할 수 있는 명령만 전환합니다. macOS 앱은 여전히 **Allow Computer Control** 설정과 OS 권한을 적용합니다.

영구적으로 승인하려면 `computer.act`를 `gateway.nodes.allowCommands`에 추가하고 `gateway.nodes.denyCommands`에서 **제거하십시오**. 거부 목록이 우선합니다. 영구 승인은 자동으로 만료되지 않습니다. `/phone arm` 전에 이미 존재하던 항목은 `/phone disarm` 후에도 유지됩니다. 임시 허용이 활성화된 동안 영구 허용으로 전환하지 마십시오.

승인은 활성화와 사용으로 의도적으로 분리되어 있습니다. `computer.act`를 활성화하거나
영구적으로 구성하려면 관리자 권한이 필요합니다.
활성화된 후에는 `operator.write` 권한이 있는 인증된 운영자가 허용이 만료되거나 비활성화될 때까지
`node.invoke`를 통해 `computer.act`를 호출할 수 있습니다.
작업별 관리자 검사는 없습니다. `computer.act`를 선언하는 Node를 승인하는 것은
나중에 활성화할 수 있도록 명령 표면을 기록할 뿐이며, 그 자체로
호출을 활성화하지는 않습니다.

## 안전

- 승인 전에는 모든 계층(도구 정책, Gateway 명령 정책, macOS 설정, Accessibility, Screen Recording)이 동의해야 합니다. 활성화된 후에는 만료되거나 `/phone disarm`을 실행할 때까지 작업별 확인 없이 동작이 실행됩니다.
- 텍스트 입력은 그래핌 단위로 하나씩 게시됩니다. 취소, 연결 끊김, 일시 중지, 비활성화 또는 엔드포인트 교체가 발생하면 오래된 나머지 입력이 계속되지 않고 다음 그래핌 전에 중지됩니다.
- 스크린샷은 모델 전용이며 채팅에 자동으로 전송되지 않습니다(이슈 [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- 화면 콘텐츠는 프롬프트 인젝션을 포함할 수 있으므로 신뢰할 수 없는 것으로 취급하십시오.

## 다른 데스크톱 제어 경로와의 관계

이는 에이전트가 제어하는 경로입니다. PeekabooBridge 호스트, Codex Computer Use 및 직접 `cua-driver` MCP와의 관계는 [Peekaboo 브리지](/ko/platforms/mac/peekaboo)를 참조하십시오.
