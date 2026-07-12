---
read_when:
    - 휴대전화에서 에이전트가 실제로 로그인된 Chrome을 조작하도록 하려는 경우
    - 책상 앞에 아무도 없는데 Chrome의 "Allow remote debugging?" 메시지가 계속 표시됩니다
    - 확장 프로그램을 통한 브라우저 제어권 탈취의 보안 모델을 이해하려는 경우
summary: 'Chrome 확장 프로그램: 원격 디버깅 프롬프트 없이 OpenClaw가 로그인된 Chrome을 제어하도록 허용합니다'
title: Chrome 확장 프로그램
x-i18n:
    generated_at: "2026-07-12T15:48:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Chrome 확장 프로그램

OpenClaw Chrome 확장 프로그램을 사용하면 별도의 관리형 브라우저를 실행하지 않고도 에이전트가 **로그인된 Chrome 탭**을 제어할 수 있으며, Chrome의 작업을 차단하는 "Allow remote debugging?" 프롬프트도 **표시되지 않습니다**.

휴대전화(Telegram, WhatsApp 등)에서 OpenClaw를 제어할 때 이 기능이 중요합니다. [`user` 프로필](/ko/tools/browser#profiles-openclaw-user-chrome)은 Chrome의 원격 디버깅 포트를 통해 연결되므로, 자리를 비운 동안 아무도 클릭할 수 없는 데스크톱 동의 대화 상자가 표시됩니다. 대신 이 확장 프로그램은 `chrome.debugger` API를 사용하므로, 페이지 내에는 닫을 수 있는 Chrome의 "OpenClaw started debugging this browser" 배너만 표시됩니다.

Anthropic의 Claude in Chrome 및 OpenAI의 Codex Chrome 확장 프로그램에서도 이와 동일한 방식을 사용합니다.

## 작동 방식

다음 세 부분으로 구성됩니다.

- **브라우저 제어 서비스**(Gateway 또는 노드 호스트): `browser` 도구가 호출하는 API입니다.
- **확장 프로그램 릴레이**(루프백 WebSocket): 제어 서비스가 `127.0.0.1`에서 시작하는 소형 서버입니다. OpenClaw에 Chrome DevTools Protocol 엔드포인트를 제공하고 확장 프로그램과 통신합니다. 양측 모두 호스트 로컬 토큰으로 인증합니다(아래 참조).
- **OpenClaw Chrome 확장 프로그램**(MV3): `chrome.debugger`를 사용하여 탭에 연결하고, CDP 트래픽을 전달하며, **OpenClaw 탭 그룹**을 관리합니다.

OpenClaw는 **OpenClaw 탭 그룹**에 있는 탭만 확인하고 제어할 수 있습니다. 이 그룹이 동의 경계 역할을 합니다. 탭을 그룹 안으로 드래그하면 공유되고, 그룹 밖으로 드래그하거나 도구 모음 버튼을 클릭하면 액세스가 즉시 취소됩니다.

## 설치 및 페어링

1. 압축 해제된 확장 프로그램의 경로를 출력합니다.

   ```bash
   openclaw browser extension path
   ```

2. `chrome://extensions`를 열고 **Developer mode**를 활성화한 다음 **Load unpacked**를 클릭하고 출력된 디렉터리를 선택합니다.

3. 페어링 문자열을 출력합니다.

   ```bash
   openclaw browser extension pair
   ```

4. OpenClaw 도구 모음 아이콘을 클릭하고 팝업에 페어링 문자열을 붙여 넣습니다. 확장 프로그램이 릴레이에 연결되면 배지가 **ON**으로 바뀝니다.

페어링 토큰은 처음 사용할 때 생성되어 상태 디렉터리의 `credentials/` 아래에 저장되는 **호스트 로컬 비밀 값**입니다(모드 `0600`). 브라우저를 실행하는 각 머신(Gateway 호스트와 모든 브라우저 노드 호스트)은 자체 토큰을 보유하므로 머신 간에 자격 증명을 전송할 필요가 없습니다. 토큰을 교체하려면 `browser-extension-relay.secret` 파일을 삭제한 후 다시 페어링하십시오.

## 사용 방법

`browser` 도구 호출에서 기본 제공 `chrome` 프로필을 선택하거나 이를 기본값으로 설정합니다.

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- 탭 공유: 해당 탭에서 OpenClaw 도구 모음 버튼을 클릭하여 OpenClaw 탭 그룹에 추가하거나, 원하는 탭을 그룹 안으로 드래그합니다.
- 에이전트가 새 탭을 열 수도 있으며, 해당 탭은 자동으로 그룹에 추가됩니다.
- 취소: 버튼을 다시 클릭하거나, 탭을 그룹 밖으로 드래그하거나, Chrome의 디버깅 배너를 닫습니다. 에이전트는 해당 탭에 대한 액세스를 즉시 잃습니다.

## 원격 / 머신 간 연결

Chrome을 Gateway 호스트에서 실행할 필요는 없습니다. 다음 세 가지 토폴로지를 사용할 수 있습니다.

- **동일한 호스트**(한 머신에서 Gateway와 Chrome 실행): 해당 머신에서 `openclaw browser extension pair`를 실행하여 페어링합니다. 릴레이는 루프백으로만 연결할 수 있습니다.
- **원격 Gateway에 직접 연결**(노트북에서 Chrome 실행, VPS에서 Gateway 실행, 노트북에서는 **그 외 아무것도 실행하지 않음**): Gateway에서 `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`을 실행합니다. `wss://…/browser/extension#<secret>` 문자열이 출력되면 노트북에 확장 프로그램을 로드하고 페어링합니다. 확장 프로그램은 `wss://`를 통해 Gateway에 **직접 연결**됩니다. 노트북에 OpenClaw, Node 또는 CLI를 설치하거나 인바운드 포트를 열 필요가 없습니다. 이는 관리형 호스팅에 사용하는 경로입니다.
- **브라우저 노드 호스트를 통해 연결**(이미 OpenClaw 노드를 실행 중인 머신에서 Chrome 실행): 노드에서 `pair`를 실행하고 로컬로 페어링합니다. Gateway는 기존에 인증된 노드 링크를 통해 브라우저 작업을 노드로 프록시합니다.

페어링 비밀 값은 호스트별로 생성되며(직접 연결하는 경우 Gateway의 비밀 값), Gateway의 `/browser/extension` 경로에서 검증됩니다. 직접 연결 경로에서는 TLS(`wss://`)를 통해 Gateway를 제공하여 페어링 비밀 값과 CDP 트래픽을 암호화하십시오.
비밀 값은 페어링 문자열의 URL 프래그먼트에 유지되며 WebSocket 핸드셰이크 중에 하위 프로토콜 자격 증명으로 제시되므로, 일반적인 프록시 액세스 로그는 요청 URL에서 이를 수신하지 않습니다. 리버스 프록시가 표준 `Sec-WebSocket-Protocol` 헤더를 보존하는지 확인하십시오.

## 진단

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

확장 프로그램 팝업에 **Connected**가 표시될 때까지 `doctor`는 **Chrome 확장 프로그램 릴레이** 검사가 실패한 것으로 보고합니다.

## 보안 모델

- 릴레이는 루프백에만 바인딩됩니다. WebSocket 양측 모두 파생된 토큰으로 인증되며, 확장 프로그램 측의 출처는 `chrome-extension://`인지 검사됩니다.
- Gateway 직접 페어링은 요청 URL에서 릴레이 토큰을 허용하지 않습니다. 대신 번들 확장 프로그램이 WebSocket 하위 프로토콜 목록에 토큰을 포함합니다.
- 에이전트는 **OpenClaw 탭 그룹**의 탭만 확인하고 제어할 수 있습니다. 다른 탭은 비공개로 유지됩니다.
- 원격 디버깅 프롬프트를 승인하면 로그인된 브라우저 전체를 노출하는 `user`(Chrome MCP) 프로필과 달리, 확장 프로그램은 한눈에 제어할 수 있는 탭 그룹으로 공유 범위를 제한합니다.

전체 프로필 모델과 관리형 `openclaw` 및 Chrome MCP `user` 프로필에 관한 자세한 내용은 [브라우저](/ko/tools/browser)도 참조하십시오.
