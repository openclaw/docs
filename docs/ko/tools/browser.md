---
read_when:
    - 에이전트 제어 브라우저 자동화 추가하기
    - OpenClaw이 사용자의 Chrome 작동을 방해하는 이유 디버깅하기
    - macOS 앱에서 브라우저 설정 및 수명 주기 구현하기
summary: 통합 브라우저 제어 서비스 + 작업 명령어
title: 브라우저(OpenClaw 관리)
x-i18n:
    generated_at: "2026-07-12T15:48:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cf43bd54994d29d48cfc1e16889ec34af83e885c1dd1b63c287f0df116c7f0bf
    source_path: tools/browser.md
    workflow: 16
---

OpenClaw는 에이전트가 제어하는 **전용 Chrome/Brave/Edge/Chromium 프로필**을 실행할 수 있습니다. 이 프로필은 Gateway 내부의 소규모 로컬 제어 서비스(루프백 전용)를 통해 실행되며 개인 브라우저와 격리됩니다.

- **에이전트 전용의 별도 브라우저**라고 생각하면 됩니다. `openclaw` 프로필은 개인 브라우저 프로필에 절대 접근하지 않습니다.
- 에이전트는 이 격리된 환경에서 탭을 열고, 페이지를 읽고, 클릭하고, 입력합니다.
- 내장 `user` 프로필은 대신 Chrome DevTools MCP를 통해 실제 로그인된 Chrome 세션에 연결됩니다.

## 제공되는 기능

- **openclaw**라는 별도의 브라우저 프로필(기본적으로 주황색 강조 표시).
- 결정론적 탭 제어(목록 조회/열기/포커스/닫기).
- 에이전트 작업(클릭/입력/드래그/선택), 스냅샷, 스크린샷, PDF.
- Playwright 기반 프로필은 직접 첨부 파일 탐색으로 다운로드한 파일을 관리형 다운로드 디렉터리에 저장하고, 최종 URL 정책 검증 후 `{ url, suggestedFilename, path }` 메타데이터를 반환합니다.
- Playwright 기반 에이전트 작업이 하나 이상의 다운로드를 즉시 시작하면 동일한 관리형 메타데이터가 포함된 `downloads` 배열을 반환합니다.
- 브라우저 Plugin이 활성화된 경우 에이전트에 스냅샷, 안정적인 탭, 오래된 참조 및 수동 차단 요소 복구 루프를 안내하는 번들 `browser-automation` Skills.
- 선택적 다중 프로필 지원(`openclaw`, `work`, `remote`, ...).

이 브라우저는 **일상적으로 사용하는 브라우저가 아닙니다**. 에이전트 자동화와 검증을 위한 안전하고 격리된 환경입니다.

macOS에서는 Chrome 계열 시스템 프로필의 쿠키를 별도의 관리형 프로필로 명시적으로 복사할 수 있습니다. 관리형 브라우저는 계속 자체 사용자 데이터 디렉터리를 사용하며, 선택한 쿠키만 복사되고 로컬 스토리지와 IndexedDB는 복사되지 않습니다. 가져오기 명령과 제한 사항은 [프로필](#profiles-multi-browser) 또는 [`openclaw browser` CLI 참조](/ko/cli/browser)를 확인하십시오.

## 빠른 시작

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw doctor --deep
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

"브라우저가 비활성화됨"은 Plugin 또는 `browser.enabled`가 꺼져 있음을 의미합니다. [구성](#configuration)과 [Plugin 제어](#plugin-control)를 확인하십시오.

`openclaw browser` 자체가 없거나 에이전트가 브라우저 도구를 사용할 수 없다고 응답하는 경우 [브라우저 명령 또는 도구 누락](#missing-browser-command-or-tool)으로 이동하십시오.

## Plugin 제어

기본 `browser` 도구는 번들 Plugin입니다. 동일한 `browser` 도구 이름을 등록하는 다른 Plugin으로 대체하려면 비활성화하십시오.

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

기본 기능을 사용하려면 `plugins.entries.browser.enabled`와 `browser.enabled=true`가 **모두** 필요합니다. Plugin만 비활성화하면 `openclaw browser` CLI, `browser.request` gateway 메서드, 에이전트 도구 및 제어 서비스가 하나의 단위로 제거됩니다. 대체 Plugin에서 사용할 수 있도록 `browser.*` 구성은 그대로 유지됩니다.

브라우저 구성 변경 사항을 적용하여 Plugin이 서비스를 다시 등록하려면 Gateway를 재시작해야 합니다.

## 에이전트 지침

도구 프로필 참고: `tools.profile: "coding"`에는 `web_search`와 `web_fetch`가 포함되지만 전체 `browser` 도구는 포함되지 않습니다. 에이전트 또는 생성된 하위 에이전트가 브라우저 자동화를 사용하도록 하려면 프로필 단계에서 browser를 추가하십시오.

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

단일 에이전트에는 `agents.list[].tools.alsoAllow: ["browser"]`를 사용하십시오. 하위 에이전트 정책은 프로필 필터링 후에 적용되므로 `tools.subagents.tools.allow: ["browser"]`만으로는 충분하지 않습니다.

브라우저 Plugin은 두 단계의 에이전트 지침을 제공합니다.

- `browser` 도구 설명에는 항상 적용되는 간결한 계약이 포함됩니다. 올바른 프로필을 선택하고, 동일한 탭에서 참조를 유지하고, 탭 대상으로 `tabId`/레이블을 사용하며, 여러 단계의 작업에는 브라우저 Skills를 로드하십시오.
- 번들 `browser-automation` Skills에는 더 자세한 작업 루프가 포함됩니다. 먼저 상태/탭을 확인하고, 작업 탭에 레이블을 지정하고, 작업 전에 스냅샷을 생성하고, UI 변경 후 다시 스냅샷을 생성하고, 오래된 참조를 한 번 복구하며, 로그인/2FA/captcha 또는 카메라/마이크 차단 요소가 있으면 추측하지 말고 수동 작업이 필요하다고 보고하십시오.

Plugin이 활성화되면 Plugin에 번들된 Skills가 에이전트의 사용 가능한 Skills 목록에 표시됩니다. 전체 Skills 지침은 필요할 때 로드되므로 일반적인 작업에는 전체 토큰 비용이 발생하지 않습니다.

## 브라우저 명령 또는 도구 누락

업그레이드 후 `openclaw browser`가 인식되지 않거나, `browser.request`가 없거나, 에이전트가 브라우저 도구를 사용할 수 없다고 보고하는 경우 일반적인 원인은 `browser`가 누락된 `plugins.allow` 목록이 있고 루트 `browser` 구성 블록은 없는 것입니다. 다음과 같이 추가하십시오.

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

명시적인 루트 `browser` 블록(`browser.enabled=true` 또는 `browser.profiles.<name>` 등 `browser` 아래의 아무 키)은 제한적인 `plugins.allow`가 적용되는 경우에도 번들 브라우저 Plugin을 활성화하며, 이는 번들 채널 구성 동작과 일치합니다. `plugins.entries.browser.enabled=true`와 `tools.alsoAllow: ["browser"]`만으로는 허용 목록 구성원 자격을 대체할 수 없습니다. `plugins.allow`를 완전히 제거해도 기본값이 복원됩니다.

## 프로필: `openclaw`, `user`, `chrome`

- `openclaw`: 관리되고 격리된 브라우저(확장 프로그램 불필요).
- `user`: **실제로 로그인된 Chrome** 세션을 위한 내장 Chrome DevTools MCP 연결 프로필입니다. OpenClaw가 처음 연결할 때 Chrome에 연결을 차단하는 "Allow remote debugging?" 프롬프트가 표시되므로 누군가 컴퓨터 앞에 있어야 합니다.
- `chrome`: **실제로 로그인된 Chrome** 세션을 위한 내장 [Chrome 확장 프로그램](/tools/chrome-extension) 프로필입니다. 원격 디버깅 포트 대신 OpenClaw 브라우저 확장 프로그램을 통해 탭을 제어하므로 "Allow remote debugging?" 프롬프트가 표시되지 않으며, 책상에 아무도 없어도 휴대전화에서 작동합니다.

에이전트 브라우저 도구 호출의 경우:

- 기본값: 격리된 `openclaw` 브라우저를 사용합니다.
- 기존 로그인 세션이 중요하고 사용자가 **컴퓨터에서 떨어져 있는** 경우(Telegram, WhatsApp 등) `profile="chrome"`(확장 프로그램)을 우선 사용하십시오.
- 기존 로그인 세션이 중요하고 사용자가 연결 프롬프트를 승인할 수 있도록 **컴퓨터 앞에 있는** 경우 `profile="user"`(Chrome MCP)를 우선 사용하십시오.
- 특정 브라우저 모드를 사용하려면 `profile`로 명시적으로 재정의하십시오.

관리형 모드를 기본값으로 사용하려면 `browser.defaultProfile: "openclaw"`을 설정하십시오.

## 구성

브라우저 설정은 `~/.openclaw/openclaw.json`에 있습니다.

```json5
{
  browser: {
    enabled: true, // 기본값: true
    evaluateEnabled: true, // 기본값: true. false로 설정하면 act:evaluate(임의 JS)가 비활성화됩니다
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // 신뢰할 수 있는 사설 네트워크 접근에만 옵트인하십시오
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // 레거시 단일 프로필 재정의
    remoteCdpTimeoutMs: 1500, // 원격 CDP HTTP 제한 시간(ms)
    remoteCdpHandshakeTimeoutMs: 3000, // 원격 CDP WebSocket 핸드셰이크 제한 시간(ms)
    localLaunchTimeoutMs: 15000, // 로컬 관리형 Chrome 검색 제한 시간(ms)
    localCdpReadyTimeoutMs: 8000, // 로컬 관리형 실행 후 CDP 준비 제한 시간(ms)
    actionTimeoutMs: 60000, // 기본 브라우저 작업 제한 시간(ms)
    tabCleanup: {
      enabled: true, // 기본값: true
      idleMinutes: 120, // 유휴 정리를 비활성화하려면 0으로 설정합니다
      maxTabsPerSession: 8, // 세션별 제한을 비활성화하려면 0으로 설정합니다
      sweepMinutes: 5,
    },
    // snapshotDefaults: { mode: "efficient" }, // 호출자가 생략할 때 사용하는 기본 스냅샷 모드
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: {
        cdpPort: 18801,
        color: "#0066CC",
        headless: true,
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

호출자가 명시적인 `snapshotFormat` 또는 `mode`를 전달하지 않으면 `browser.snapshotDefaults.mode: "efficient"`가 기본 `snapshot` 추출 모드를 변경합니다. 호출별 스냅샷 옵션은 [브라우저 제어 API](/ko/tools/browser-control)를 참조하십시오.

### 스크린샷 비전(텍스트 전용 모델 지원)

기본 모델이 텍스트 전용인 경우(비전/멀티모달 미지원) 브라우저 스크린샷은 모델이 읽을 수 없는 이미지 블록을 반환합니다. 브라우저 스크린샷은 기존 이미지 이해 구성을 재사용하므로 미디어 이해용으로 구성된 이미지 모델이 브라우저 전용 모델 설정 없이도 스크린샷을 텍스트로 설명할 수 있습니다.

```json5
{
  tools: {
    media: {
      image: {
        models: [
          { provider: "bytedance", model: "doubao-seed-2.0-pro" },
          // 대체 후보를 추가합니다. 처음 성공한 모델이 사용됩니다
          { provider: "openai", model: "gpt-4o" },
        ],
      },
      // 이미지 지원으로 태그된 경우 공유 미디어 모델도 작동합니다.
      // models: [{ provider: "openai", model: "gpt-4o", capabilities: ["image"] }],
    },
  },
  agents: {
    defaults: {
      // 기존 이미지 모델 기본값도 적용됩니다.
      // imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

**작동 방식:**

1. 에이전트가 `browser screenshot`을 호출하면 평소와 같이 이미지가 디스크에 캡처됩니다.
2. 브라우저 도구는 구성된 미디어 이미지 모델, 공유 미디어 모델, 이미지 모델 기본값 또는 인증 기반 이미지 제공자를 사용하여 스크린샷을 설명할 수 있는지 기존 이미지 이해 런타임에 요청합니다.
3. 비전 모델이 텍스트 설명을 반환하면 `wrapExternalContent`(프롬프트 인젝션 방지)로 래핑한 후 이미지 블록 대신 텍스트 블록으로 에이전트에 반환합니다.
4. 이미지 이해를 사용할 수 없거나, 건너뛰거나, 실패하면 브라우저는 원래 이미지 블록을 반환하는 방식으로 대체합니다.

스크린샷 이미지 블록은 비공개 도구 결과입니다. 에이전트는 이를 검사할 수 있지만 OpenClaw는 채널 응답에 자동으로 첨부하지 않습니다. 스크린샷을 공유하려면 에이전트에게 메시지 도구를 사용하여 명시적으로 전송하도록 요청하십시오.

모델 대체, 제한 시간, 바이트 제한, 프로필 및 제공자 요청 설정에는 기존 `tools.media.image` / `tools.media.models` 필드를 사용하십시오.

활성 기본 모델이 이미 비전을 지원하고 명시적인 이미지 이해 모델이 구성되지 않은 경우, OpenClaw는 기본 모델이 스크린샷을 직접 읽을 수 있도록 일반 이미지 결과를 유지합니다.

<AccordionGroup>

<Accordion title="포트 및 접근 가능성">

- 제어 서비스는 `gateway.port`에서 파생된 포트의 루프백에 바인딩됩니다(기본값 `18791` = Gateway + 2). `OPENCLAW_GATEWAY_PORT`가 `gateway.port`보다 우선하며, 어느 쪽을 변경해도 동일한 포트 계열의 파생 포트가 함께 이동합니다.
- 로컬 `openclaw` 프로필은 제어 포트보다 9포트 높은 지점에서 시작하는 범위(기본값 `18800`-`18899`)에서 `cdpPort`/`cdpUrl`을 자동 할당합니다. 이러한 값은
  원격 CDP 프로필이나 기존 세션 엔드포인트 연결에만 설정하십시오. `cdpUrl`이 설정되지 않으면
  관리되는 로컬 CDP 포트가 기본값으로 사용됩니다.
- `remoteCdpTimeoutMs`는 원격 및 `attachOnly` CDP HTTP 도달 가능성
  검사와 탭 열기 HTTP 요청에 적용되며, `remoteCdpHandshakeTimeoutMs`는
  해당 CDP WebSocket 핸드셰이크에 적용됩니다. 지속적인 원격 Playwright 탭 열거에는
  두 값 중 더 큰 값이 작업 기한으로 사용됩니다.
- `localLaunchTimeoutMs`는 로컬에서 실행된 관리형 Chrome
  프로세스가 CDP HTTP 엔드포인트를 노출할 때까지 허용되는 시간입니다. `localCdpReadyTimeoutMs`는
  프로세스가 발견된 후 CDP WebSocket이 준비될 때까지 추가로 허용되는
  시간입니다. Chromium 시작이 느린 Raspberry Pi, 저사양 VPS 또는
  구형 하드웨어에서는 이 값을 늘리십시오. 값은 `120000`ms 이하의 양의 정수여야 하며,
  잘못된 구성 값은 거부됩니다.
- 관리형 Chrome 실행 또는 준비 상태 확인이 반복적으로 실패하면 프로필별로
  회로 차단기가 작동합니다. 여러 번 연속 실패하면 OpenClaw는 브라우저 도구를 호출할
  때마다 Chromium을 생성하는 대신 잠시 동안 새 실행 시도를 중단합니다. 시작
  문제를 해결하거나, 브라우저가 필요하지 않으면 비활성화하거나, 복구 후
  Gateway를 다시 시작하십시오.
- `actionTimeoutMs`는 호출자가 `timeoutMs`를 전달하지 않을 때 브라우저 `act` 요청에 적용되는 기본 제한 시간입니다. 클라이언트 전송 계층은 작은 여유 시간 창을 추가하여 긴 대기가 HTTP 경계에서 시간 초과되지 않고 완료될 수 있도록 합니다.
- `tabCleanup`은 기본 에이전트 브라우저 세션에서 연 탭을 최선의 노력으로 정리합니다. 하위 에이전트, Cron 및 ACP 수명 주기 정리는 세션 종료 시 명시적으로 추적된 탭을 계속 닫습니다. 기본 세션에서는 활성 탭을 재사용할 수 있도록 유지한 후, 유휴 상태이거나 한도를 초과한 추적 탭을 백그라운드에서 닫습니다.

</Accordion>

<Accordion title="SSRF 정책">

- 브라우저 탐색 및 탭 열기 요청은 사전 검사를 거칩니다. 작업 실행 중과 제한된 작업 후 유예 시간 동안, 보호되는 Playwright 상호 작용(클릭, 좌표 클릭, 호버, 드래그, 스크롤, 선택, 키 누르기, 입력, 양식 채우기 및 평가)은 HTTP 요청 바이트가 전송되기 전에 정책상 거부된 최상위 및 하위 프레임 문서 로드를 가로챈 다음, 최종 `http(s)` URL을 최선의 노력으로 다시 검사합니다.
- OpenClaw는 새 관리형 Chrome을 실행할 때마다 최선의 노력으로 네트워크 예측을 비활성화하여, 거부된 로드에 대해 관찰된 Chromium의 추측성 사전 연결을 억제합니다. 이는 심층 방어이며 정책 경계가 아닙니다. 제어 서비스가 다시 시작된 뒤에도 재사용되는 브라우저와 다른 브라우저 백엔드에는 이 강화 조치가 적용되지 않을 수 있습니다. Playwright 라우팅은 여전히 네트워크 방화벽이 아니며 리디렉션 단계, 팝업의 첫 요청, Service Worker 트래픽, 제한된 보호 시간 이후 실행되는 페이지 코드 또는 모든 백그라운드/하위 리소스 경로를 가로채지 않습니다. 완전한 송신 격리를 위해서는 소유자 측 격리 또는 정책을 강제하는 프록시가 필요합니다.
- 엄격한 SSRF 모드에서는 원격 CDP 엔드포인트 검색과 `/json/version` 프로브(`cdpUrl`)도 검사합니다.
- Gateway/공급자의 `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` 및 `NO_PROXY` 환경 변수는 OpenClaw 관리형 브라우저에 자동으로 프록시를 적용하지 않습니다. 공급자 프록시 설정이 브라우저 SSRF 검사를 약화하지 않도록 관리형 Chrome은 기본적으로 직접 연결 방식으로 실행됩니다.
- OpenClaw 관리형 로컬 CDP 준비 상태 프로브와 DevTools WebSocket 연결은 정확히 실행된 루프백 엔드포인트에 대해 관리형 네트워크 프록시를 우회하므로, 운영자 프록시가 루프백 송신을 차단하더라도 `openclaw browser start`가 계속 작동합니다.
- 관리형 브라우저 자체에 프록시를 적용하려면 `--proxy-server=...` 또는 `--proxy-pac-url=...` 같은 명시적 Chrome 프록시 플래그를 `browser.extraArgs`를 통해 전달하십시오. 비공개 네트워크 브라우저 액세스를 의도적으로 활성화하지 않은 경우 엄격한 SSRF 모드는 명시적 브라우저 프록시 라우팅을 차단합니다.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`는 기본적으로 꺼져 있습니다. 비공개 네트워크 브라우저 액세스를 의도적으로 신뢰하는 경우에만 활성화하십시오.
- `browser.ssrfPolicy.allowPrivateNetwork`는 레거시 별칭으로 계속 지원됩니다.

</Accordion>

<Accordion title="프로필 동작">

- `attachOnly: true`는 로컬 브라우저를 절대 실행하지 않고, 이미 실행 중인 브라우저가 있을 때만 연결한다는 의미입니다.
- `headless`는 전역 또는 로컬 관리형 프로필별로 설정할 수 있습니다. 프로필별 값은 `browser.headless`보다 우선하므로, 로컬에서 실행된 프로필 하나는 헤드리스 상태로 유지하면서 다른 프로필은 표시되도록 할 수 있습니다.
- `POST /start?headless=true`와 `openclaw browser start --headless`는
  `browser.headless` 또는 프로필 구성을 다시 작성하지 않고 로컬 관리형 프로필의
  일회성 헤드리스 실행을 요청합니다. OpenClaw가 해당 브라우저 프로세스를 실행하지 않으므로
  기존 세션, 연결 전용 및 원격 CDP 프로필은 이 재정의를
  거부합니다.
- `DISPLAY` 또는 `WAYLAND_DISPLAY`가 없는 Linux 호스트에서는 환경이나 프로필/전역
  구성에서 헤드 표시 모드를 명시적으로 선택하지 않은 경우 로컬 관리형 프로필이
  자동으로 헤드리스 모드를 기본값으로 사용합니다. 모호하지 않은 브라우저 수준 형식인
  `openclaw browser --json status`를 사용하십시오. 후행 형식인 `openclaw browser status --json`도
  `status` 자체에 `--json`이 정의되어 있지 않으므로 작동합니다. 이 명령은
  `headlessSource`를 `env`, `profile`, `config`,
  `request`, `linux-display-fallback` 또는 `default`로 보고합니다.
- `OPENCLAW_BROWSER_HEADLESS=1`은 현재 프로세스의 로컬 관리형 실행을
  강제로 헤드리스 모드로 설정합니다. `OPENCLAW_BROWSER_HEADLESS=0`은 일반 실행을 강제로
  헤드 표시 모드로 설정하며 디스플레이 서버가 없는 Linux 호스트에서는 조치 가능한 오류를 반환합니다.
  명시적인 `start --headless` 요청은 해당 일회성 실행에 한해 여전히 우선합니다.
- 브라우저 제어 경로와 프로그래밍 방식 클라이언트는 디스플레이 없음 오류의
  사람이 읽을 수 있는 `error`를 유지하고 안정적인 사유인
  `no_display_for_headed_profile`을 노출합니다. 해당 `details`에는 `profile`,
  `requestedHeadless`, `headlessSource` 및 `displayPresent`만 포함되므로, API 클라이언트는
  메시지 텍스트를 일치시키지 않고도 올바른 해결 방법을 선택할 수 있습니다.
- 실행 중인 로컬 관리형 프로필의 경우 상태 및 doctor는 Chrome의
  브라우저 수준 CDP 엔드포인트에 렌더러, 백엔드, 장치/드라이버, 기능
  상태, 드라이버 우회책 및 가속 비디오 기능을 질의합니다. 결과는
  해당 브라우저 프로세스에 대해 캐시되며
  `openclaw browser --json status`를 통해 전체가 노출됩니다. 수동적인 상태 호출은 Chrome을 실행하지 않습니다.
  기존 세션, 확장 프로그램, 원격 CDP 및 샌드박스 브라우저는 별도로 유지되며
  이 관리형 호스트 경로를 통해 검사되지 않습니다.
- 헤드리스 관리형 Chrome은 여전히 보수적인 `--disable-gpu` 기본값을 사용합니다.
  진단은 가속을 활성화하거나, 전역 가속 설정을 추가하거나,
  샌드박스 브라우저에 장치 액세스 권한을 부여하지 않습니다.
- `executablePath`는 전역 또는 로컬 관리형 프로필별로 설정할 수 있습니다. 프로필별 값은 `browser.executablePath`보다 우선하므로 서로 다른 관리형 프로필에서 서로 다른 Chromium 기반 브라우저를 실행할 수 있습니다. 두 형식 모두 OS 홈 디렉터리에 `~`를 사용할 수 있습니다.
- `color`(최상위 및 프로필별)는 브라우저 UI에 색조를 적용하여 어떤 프로필이 활성 상태인지 확인할 수 있게 합니다.
- 기본 프로필은 `openclaw`(관리형 독립 실행형)입니다. 로그인된 사용자 브라우저를 사용하도록 선택하려면 `defaultProfile: "user"`를 사용하십시오.
- 자동 감지 순서: Chromium 기반인 경우 시스템 기본 브라우저, 그렇지 않으면 Chrome, Brave, Edge, Chromium, Chrome Canary 순입니다.
- `driver: "existing-session"`은 원시 CDP 대신 Chrome DevTools MCP를 사용합니다. Chrome MCP 자동 연결을 통해 연결하거나, 실행 중인 브라우저의 DevTools 엔드포인트가 이미 있는 경우 `cdpUrl`을 통해 연결할 수 있습니다.
- `driver: "extension"`은 [OpenClaw Chrome 확장 프로그램](/tools/chrome-extension)을 통해 로그인된 Chrome을 제어합니다. 릴레이가 자체 루프백 엔드포인트를 소유하므로 이러한 프로필에서는 `cdpUrl`을 사용할 수 없습니다. 컴퓨터 앞에 아무도 없어도 작동하는 유일한 로그인 브라우저 모드입니다.
- 기존 세션 프로필이 기본값이 아닌 Chromium 사용자 프로필(Brave, Edge 등)에 연결해야 하는 경우 `browser.profiles.<name>.userDataDir`을 설정하십시오. 이 경로에서도 OS 홈 디렉터리에 `~`를 사용할 수 있습니다.

</Accordion>

</AccordionGroup>

## Brave 또는 다른 Chromium 기반 브라우저 사용

**시스템 기본** 브라우저가 Chromium 기반(Chrome/Brave/Edge 등)이면
OpenClaw가 자동으로 사용합니다. 자동 감지를 재정의하려면 `browser.executablePath`를
설정하십시오. 최상위 및 프로필별 `executablePath` 값에는 OS 홈 디렉터리를 나타내는
`~`를 사용할 수 있습니다.

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
openclaw config set browser.profiles.work.executablePath "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

또는 플랫폼별로 구성에서 설정하십시오.

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

프로필별 `executablePath`는 OpenClaw가 실행하는 로컬 관리형 프로필에만
영향을 줍니다. `existing-session` 프로필은 대신 이미 실행 중인 브라우저에
연결하며, 원격 CDP 프로필은 `cdpUrl` 뒤의 브라우저를 사용합니다.

## 로컬 제어와 원격 제어

- **로컬 제어(기본값):** Gateway가 루프백 제어 서비스를 시작하고 로컬 브라우저를 실행할 수 있습니다.
- **원격 제어(Node 호스트):** 브라우저가 있는 머신에서 Node 호스트를 실행하면 Gateway가 브라우저 작업을 해당 호스트로 프록시합니다.
- **원격 CDP:** 원격 Chromium 기반 브라우저에 연결하려면 `browser.profiles.<name>.cdpUrl`(또는 `browser.cdpUrl`)을
  설정하십시오. 이 경우 OpenClaw는 로컬 브라우저를 실행하지 않습니다.
- 루프백에서 외부 관리되는 CDP 서비스(예: Docker에서
  `127.0.0.1`로 게시된 Browserless)의 경우 `attachOnly: true`도 설정하십시오. `attachOnly`가 없는 루프백 CDP는
  로컬 OpenClaw 관리형 브라우저 프로필로 처리됩니다.
- `headless`는 OpenClaw가 실행하는 로컬 관리형 프로필에만 영향을 줍니다. 기존 세션 또는 원격 CDP 브라우저를 다시 시작하거나 변경하지 않습니다.
- `executablePath`에도 동일한 로컬 관리형 프로필 규칙이 적용됩니다. 실행 중인
  로컬 관리형 프로필에서 이를 변경하면 해당 프로필이 다시 시작/조정 대상으로 표시되어
  다음 실행 시 새 바이너리가 사용됩니다.

중지 동작은 프로필 모드에 따라 다릅니다.

- 로컬 관리형 프로필: `openclaw browser stop`은
  OpenClaw가 실행한 브라우저 프로세스를 중지합니다.
- 연결 전용 및 원격 CDP 프로필: OpenClaw가 브라우저 프로세스를 실행하지 않았더라도
  `openclaw browser stop`은 활성 제어 세션을 닫고 Playwright/CDP 에뮬레이션 재정의(뷰포트,
  색상 구성표, 로캘, 시간대, 오프라인 모드 및 유사한 상태)를
  해제합니다.

원격 CDP URL에는 인증 정보를 포함할 수 있습니다.

- 쿼리 토큰(예: `https://provider.example?token=<token>`)
- HTTP Basic 인증(예: `https://user:pass@provider.example`)

OpenClaw는 `/json/*` 엔드포인트를 호출하고 CDP WebSocket에 연결할 때
인증 정보를 유지합니다. 토큰을 구성 파일에 커밋하는 대신 환경 변수나
비밀 관리자를 사용하는 것이 좋습니다.

## Node 브라우저 프록시(구성 없는 기본값)

브라우저가 있는 머신에서 **Node 호스트**를 실행하면 OpenClaw는
추가 브라우저 구성 없이 브라우저 도구 호출을 해당 Node로 자동 라우팅할 수 있습니다.
이는 원격 Gateway의 기본 경로입니다.

참고:

- Node 호스트는 **프록시 명령**을 통해 로컬 브라우저 제어 서버를 노출합니다.
- 프로필은 Node 자체의 `browser.profiles` 구성에서 가져옵니다(로컬과 동일).
- 프록시 명령은 `allowProfiles` 설정과 관계없이 영구적인 프로필 변경(`create-profile`, `delete-profile`, `reset-profile`)을 허용하지 않습니다. 이러한 변경은 Node에서 직접 수행하십시오.
- `nodeHost.browserProxy.allowProfiles`는 선택 사항입니다. 기존/기본 동작을 사용하려면 비워 두십시오. 구성된 모든 프로필에 프록시를 통해 계속 접근할 수 있습니다.
- `nodeHost.browserProxy.allowProfiles`를 설정하면 OpenClaw는 이를 프록시가 대상으로 지정할 수 있는 프로필 이름을 제한하는 최소 권한 경계로 취급합니다.
- 원하지 않으면 비활성화하십시오.
  - Node에서: `nodeHost.browserProxy.enabled=false`
  - Gateway에서: `gateway.nodes.browser.mode="off"`(연결된 브라우저 Node 하나를 선택하려면 `"auto"`, 명시적인 Node 매개변수를 요구하려면 `"manual"`도 사용할 수 있음)

## Browserless(호스팅 원격 CDP)

[Browserless](https://browserless.io)는 HTTPS와 WebSocket을 통해
CDP 연결 URL을 제공하는 호스팅 Chromium 서비스입니다. OpenClaw는 두 형식을 모두 사용할 수 있지만,
원격 브라우저 프로필에서는 Browserless 연결 문서의 직접 WebSocket URL을
사용하는 것이 가장 간단합니다.

예:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

참고:

- `<BROWSERLESS_API_KEY>`를 실제 Browserless 토큰으로 바꾸십시오.
- Browserless 계정과 일치하는 리전 엔드포인트를 선택하십시오(해당 문서 참조).
- Browserless에서 HTTPS 기본 URL을 제공하는 경우 직접 CDP 연결을 위해
  `wss://`로 변환하거나, HTTPS URL을 그대로 두고 OpenClaw가
  `/json/version`을 검색하도록 할 수 있습니다.

### 동일한 호스트의 Browserless Docker

Browserless가 Docker에 자체 호스팅되고 OpenClaw가 호스트에서 실행되는 경우,
Browserless를 외부에서 관리되는 CDP 서비스로 취급하십시오.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    profiles: {
      browserless: {
        cdpUrl: "ws://127.0.0.1:3000",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

`browser.profiles.browserless.cdpUrl`의 주소는
OpenClaw 프로세스에서 접근할 수 있어야 합니다. Browserless도 접근 가능한 일치 엔드포인트를 알려야 합니다.
Browserless의 `EXTERNAL`을 `ws://127.0.0.1:3000`,
`ws://browserless:3000` 또는 안정적인 비공개 Docker 네트워크 주소와 같이
OpenClaw에서 접근 가능한 동일한 WebSocket 기본 주소로 설정하십시오. `/json/version`이 OpenClaw에서
접근할 수 없는 주소를 가리키는 `webSocketDebuggerUrl`을 반환하면 CDP HTTP는 정상으로
보이더라도 WebSocket 연결은 여전히 실패합니다.

루프백 Browserless 프로필에서 `attachOnly`를 설정하지 않은 채로 두지 마십시오.
`attachOnly`가 없으면 OpenClaw는 루프백 포트를 로컬 관리형 브라우저
프로필로 취급하며, 해당 포트가 사용 중이지만 OpenClaw가 소유하지 않는다고 보고할 수 있습니다.

## 직접 WebSocket CDP 제공자

일부 호스팅 브라우저 서비스는 표준 HTTP 기반 CDP 검색(`/json/version`) 대신
**직접 WebSocket** 엔드포인트를 제공합니다. OpenClaw는 세 가지
CDP URL 형태를 허용하며 올바른 연결 전략을 자동으로 선택합니다.

- **HTTP(S) 검색** - `http://host[:port]` 또는 `https://host[:port]`.
  OpenClaw는 WebSocket 디버거 URL을 검색하기 위해 `/json/version`을 호출한 후
  연결합니다. WebSocket 폴백은 없습니다.
- **직접 WebSocket 엔드포인트** - `ws://host[:port]/devtools/<kind>/<id>` 또는
  `/devtools/browser|page|worker|shared_worker|service_worker/<id>` 경로가 있는
  `wss://...`입니다. OpenClaw는 WebSocket 핸드셰이크를 통해 직접 연결하며
  `/json/version`을 완전히 건너뜁니다.
- **단순 WebSocket 루트** - `/devtools/...` 경로가 없는 `ws://host[:port]` 또는
  `wss://host[:port]`(예: [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com))입니다. OpenClaw는 먼저 HTTP
  `/json/version` 검색을 시도합니다(스킴을 `http`/`https`로 정규화).
  검색 결과가 `webSocketDebuggerUrl`을 반환하면 이를 사용하고, 그렇지 않으면 OpenClaw는
  단순 루트에서 직접 WebSocket 핸드셰이크로 폴백합니다. 알려진
  WebSocket 엔드포인트가 CDP 핸드셰이크를 거부하지만 구성된 단순 루트가
  허용하는 경우에도 OpenClaw는 해당 루트로 폴백합니다. 따라서 로컬 Chrome을 가리키는 단순 `ws://`도
  연결할 수 있습니다. Chrome은 `/json/version`에서 얻은 대상별 특정 경로에서만 WebSocket
  업그레이드를 허용하지만, 호스팅 제공자는 검색
  엔드포인트가 Playwright CDP에 적합하지 않은 수명이 짧은 URL을 알려 주는 경우에도
  루트 WebSocket 엔드포인트를 사용할 수 있습니다.

`openclaw browser doctor`는 런타임 연결과 동일한 검색 우선, WebSocket 폴백
로직을 사용하므로 연결에 성공하는 단순 루트 URL을 진단에서
접근 불가로 보고하지 않습니다.

### Browserbase

[Browserbase](https://www.browserbase.com)는 기본 제공되는 CAPTCHA 해결, 스텔스 모드,
주거용 프록시와 함께 헤드리스 브라우저를 실행하는 클라우드 플랫폼입니다.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

참고:

- [가입](https://www.browserbase.com/sign-up)한 후
  [Overview dashboard](https://www.browserbase.com/overview)에서 **API Key**를 복사하십시오.
- `<BROWSERBASE_API_KEY>`를 실제 Browserbase API 키로 바꾸십시오.
- Browserbase는 WebSocket 연결 시 브라우저 세션을 자동으로 생성하므로
  수동 세션 생성 단계가 필요하지 않습니다.
- 현재 무료 티어 제한과 유료 플랜은 [요금](https://www.browserbase.com/pricing)을 참조하십시오.
- 전체 API 참조, SDK 가이드 및 통합 예시는
  [Browserbase 문서](https://docs.browserbase.com)를 참조하십시오.

### Notte

[Notte](https://www.notte.cc)는 기본 제공되는 스텔스 기능, 주거용 프록시 및
CDP 네이티브 WebSocket Gateway와 함께 헤드리스
브라우저를 실행하는 클라우드 플랫폼입니다.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "notte",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      notte: {
        cdpUrl: "wss://us-prod.notte.cc/sessions/connect?token=<NOTTE_API_KEY>",
        color: "#7C3AED",
      },
    },
  },
}
```

참고:

- [가입](https://console.notte.cc)한 후 콘솔 설정 페이지에서
  **API Key**를 복사하십시오.
- `<NOTTE_API_KEY>`를 실제 Notte API 키로 바꾸십시오.
- Notte는 WebSocket 연결 시 브라우저 세션을 자동으로 생성하므로 수동
  세션 생성 단계가 필요하지 않습니다. WebSocket 연결이 끊어지면 세션이
  삭제됩니다.
- 현재 무료 티어 제한과 유료 플랜은 [요금](https://www.notte.cc/#pricing)을 참조하십시오.
- 전체 API 참조, SDK 가이드 및 통합 예시는
  [Notte 문서](https://docs.notte.cc)를 참조하십시오.

## 보안

핵심 개념:

- 브라우저 제어는 루프백 전용이며, 접근은 Gateway의 인증 또는 Node 페어링을 통해 이루어집니다.
- 독립 실행형 루프백 브라우저 HTTP API는 **공유 비밀 인증만** 사용합니다.
  Gateway 토큰 전달자 인증, `x-openclaw-password` 또는 구성된 Gateway 비밀번호를 사용하는
  HTTP Basic 인증입니다.
- Tailscale Serve ID 헤더와 `gateway.auth.mode: "trusted-proxy"`는
  이 독립 실행형 루프백 브라우저 API를 **인증하지 않습니다**.
- 브라우저 제어가 활성화되어 있고 공유 비밀 인증이 구성되지 않은 경우 OpenClaw는
  시작 시 브라우저 제어 자격 증명을 자동으로 생성하고 유지합니다.
  `gateway.auth.mode`가 `none`이면 토큰을, `trusted-proxy`이면
  비밀번호를 생성합니다(프로세스 외부의 루프백 클라이언트가 확인할 수 있도록
  `gateway.auth.password`를 통해 유지됨). 해당 모드에 명시적인
  문자열 자격 증명이 이미 구성되어 있거나 `gateway.auth.mode`가 `password`이면
  자동 생성을 건너뜁니다.
- 생성된 비밀 대신 직접 제어하는 안정적인 비밀을 사용하려면
  `gateway.auth.token`, `gateway.auth.password`, `OPENCLAW_GATEWAY_TOKEN` 또는
  `OPENCLAW_GATEWAY_PASSWORD`를 명시적으로 구성하십시오.

원격 CDP 팁:

- 가능한 경우 암호화된 엔드포인트(HTTPS 또는 WSS)와 수명이 짧은 토큰을 사용하십시오.
- 수명이 긴 토큰을 구성 파일에 직접 포함하지 마십시오.
- Gateway와 모든 Node 호스트를 비공개 네트워크(Tailscale)에 유지하고 공개 노출을 피하십시오.
- 원격 CDP URL/토큰을 비밀로 취급하고 환경 변수 또는 비밀 관리자를 사용하십시오.

## 프로필(다중 브라우저)

OpenClaw는 이름이 지정된 여러 프로필(라우팅 구성)을 지원합니다. 프로필은 다음과 같을 수 있습니다.

- **OpenClaw 관리형**: 자체 사용자 데이터 디렉터리와 CDP 포트가 있는 전용 Chromium 기반 브라우저 인스턴스
- **원격**: 명시적인 CDP URL(다른 위치에서 실행되는 Chromium 기반 브라우저)
- **기존 세션**: Chrome DevTools MCP 자동 연결을 통한 기존 Chrome 프로필

기본값:

- `openclaw` 프로필이 없으면 자동으로 생성됩니다.
- `user` 프로필은 Chrome MCP 기존 세션 연결용으로 기본 제공됩니다.
- `user` 이외의 기존 세션 프로필은 명시적으로 설정해야 하며, `--driver existing-session`을 사용하여 생성합니다.
- 로컬 CDP 포트는 기본적으로 **18800-18899** 범위에서 할당됩니다.
- 프로필을 삭제하면 로컬 데이터 디렉터리가 휴지통으로 이동합니다.

모든 제어 엔드포인트는 `?profile=<name>`을 허용하며, CLI는 `--browser-profile`을 사용합니다.

## Chrome DevTools MCP를 통한 기존 세션

OpenClaw는 공식 Chrome DevTools MCP 서버를 통해 실행 중인 Chromium 기반
브라우저 프로필에 연결할 수도 있습니다. 이 방식은 해당 브라우저 프로필에 이미 열려 있는
탭과 로그인 상태를 재사용합니다.

공식 배경 정보 및 설정 참조:

- [Chrome for Developers: 브라우저 세션에서 Chrome DevTools MCP 사용](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

기본 제공 프로필: `user`. 다른 이름, 색상 또는 브라우저 데이터 디렉터리를
원하는 경우 사용자 지정 기존 세션 프로필을 생성하십시오.

기본적으로 기본 제공 `user` 프로필은 기본 로컬 Google Chrome 프로필을 대상으로 하는
Chrome MCP 자동 연결을 사용합니다. Brave, Edge, Chromium 또는 기본값이 아닌 Chrome 프로필에는
`userDataDir`을 사용하십시오. `~`는 OS 홈 디렉터리로 확장됩니다.

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

그런 다음 일치하는 브라우저에서 다음을 수행하십시오.

1. 원격 디버깅용 브라우저 검사 페이지를 엽니다.
2. 원격 디버깅을 활성화합니다.
3. 브라우저를 계속 실행하고 OpenClaw가 연결할 때 연결 프롬프트를 승인합니다.

일반적인 검사 페이지:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

실시간 연결 스모크 테스트:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

성공 시 나타나는 결과:

- `status`에 `driver: existing-session`이 표시됩니다.
- `status`에 `transport: chrome-mcp`가 표시됩니다.
- `status`에 `running: true`가 표시됩니다.
- `tabs`에 이미 열려 있는 브라우저 탭이 나열됩니다.
- `snapshot`이 선택한 실시간 탭의 참조를 반환합니다.

연결이 작동하지 않을 때 확인할 사항:

- 대상 Chromium 기반 브라우저의 버전이 `144+`인지 확인합니다.
- 해당 브라우저의 검사 페이지에서 원격 디버깅이 활성화되어 있는지 확인합니다.
- 브라우저에 연결 동의 프롬프트가 표시되었고 이를 수락했는지 확인합니다.
- Chrome이 명시적인 `--remote-debugging-port`와 함께 시작된 경우 Chrome MCP 자동 연결에
  의존하지 말고 `browser.profiles.<name>.cdpUrl`을 해당 DevTools 엔드포인트로 설정합니다.
- `openclaw doctor`는 이전 확장 프로그램 기반 브라우저 구성을 마이그레이션하고
  기본 자동 연결 프로필을 위해 Chrome이 로컬에 설치되어 있는지 확인하지만,
  브라우저 측 원격 디버깅을 대신 활성화할 수는 없습니다.

에이전트 사용:

- 사용자의 로그인된 브라우저 상태가 필요할 때는 `profile="user"`를 사용하십시오.
- 사용자 지정 기존 세션 프로필을 사용하는 경우 해당 프로필 이름을 명시적으로 전달하십시오.
- 사용자가 컴퓨터 앞에서 연결 프롬프트를 승인할 수 있을 때만 이 모드를 선택하십시오.
- Gateway 또는 Node 호스트는 `npx chrome-devtools-mcp@latest --autoConnect`를 실행할 수 있습니다.

참고:

- 이 경로는 로그인된 브라우저 세션 내에서 작업할 수 있으므로 격리된 `openclaw` 프로필보다 위험이 큽니다.
- OpenClaw는 이 드라이버용 브라우저를 실행하지 않고 연결만 합니다.
- OpenClaw는 여기서 공식 Chrome DevTools MCP `--autoConnect` 흐름을 사용합니다. `userDataDir`이 설정된 경우 해당 사용자 데이터 디렉터리를 대상으로 하도록 그대로 전달됩니다.
- 기존 세션은 선택한 호스트 또는 연결된 브라우저 Node를 통해 연결할 수 있습니다. Chrome이 다른 곳에 있고 연결된 브라우저 Node가 없다면 원격 CDP 또는 Node 호스트를 대신 사용하십시오.
- Chrome MCP 대상과 스냅샷 참조는 하나의 MCP 하위 프로세스로 범위가 제한됩니다. 해당 프로세스가 다시 시작된 후에는 `browser tabs`를 다시 실행하고, 대상별 작업 전에 새로운 대상을 명시적으로 선택하며, 참조를 사용하기 전에 새 스냅샷을 생성하십시오. 각 참조는 해당 대상과 최신 스냅샷에만 유효합니다. URL이 일치하더라도 이전 별칭은 대체 탭으로 이전되지 않습니다.
- Chrome DevTools MCP는 현재 프로세스 로컬 숫자 페이지 ID로 페이지 도구를 라우팅합니다. 프로세스 범위 핸들은 하위 프로세스 교체 간 재사용을 방지하지만, 인접한 도구 호출 사이에 프로세스 내 브라우저 컨텍스트가 교체되면 작업 대상이 여전히 변경될 수 있습니다. 완전히 원자적인 라우팅을 위해서는 안정적인 대상 ID를 지원하는 업스트림 페이지 도구가 필요합니다.

### 사용자 지정 Chrome MCP 실행

기본 `npx chrome-devtools-mcp@latest` 흐름이 적합하지 않은 경우(오프라인 호스트, 고정 버전, 벤더링된 바이너리) 프로필별로 실행되는 Chrome DevTools MCP 서버를 재정의하십시오.

| 필드         | 기능                                                                                                                       |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `mcpCommand` | `npx` 대신 실행할 실행 파일입니다. 그대로 해석되며 절대 경로도 적용됩니다.                                                 |
| `mcpArgs`    | `mcpCommand`에 그대로 전달되는 인수 배열입니다. 기본 `chrome-devtools-mcp@latest --autoConnect` 인수를 대체합니다.          |

기존 세션 프로필에 `cdpUrl`이 설정되면 OpenClaw는 `--autoConnect`를 건너뛰고 엔드포인트를 Chrome MCP에 자동으로 전달합니다.

- `http(s)://...` → `--browserUrl <url>`(DevTools HTTP 검색 엔드포인트).
- `ws(s)://...` → `--wsEndpoint <url>`(직접 CDP WebSocket).

엔드포인트 플래그와 `userDataDir`은 함께 사용할 수 없습니다. `cdpUrl`이 설정되면 Chrome MCP 실행 시 `userDataDir`이 무시됩니다. Chrome MCP가 프로필 디렉터리를 여는 대신 엔드포인트 뒤에서 실행 중인 브라우저에 연결하기 때문입니다.

<Accordion title="기존 세션 기능 제한 사항">

관리형 `openclaw` 프로필과 비교하면 기존 세션 드라이버에는 더 많은 제약이 있습니다.

- **스크린샷** - 페이지 캡처와 `--ref` 요소 캡처는 작동하지만 CSS `--element` 선택자는 작동하지 않습니다. 페이지 또는 참조 기반 요소 스크린샷에는 Playwright가 필요하지 않습니다. (`--full-page`는 기존 세션뿐만 아니라 어떤 프로필에서도 `--ref` 또는 `--element`와 함께 사용할 수 없습니다.)
- **작업** - `click`, `type`, `hover`, `scrollIntoView`, `drag`, `select`에는 스냅샷 참조가 필요합니다(CSS 선택자는 사용할 수 없음). `click-coords`는 표시 중인 뷰포트 좌표를 클릭하며 스냅샷 참조가 필요하지 않습니다. `click`은 왼쪽 버튼만 지원합니다(버튼 재정의 또는 보조 키 없음). `type`은 `slowly=true`를 지원하지 않으므로 `fill` 또는 `press`를 사용하십시오. `press`는 `delayMs`를 지원하지 않습니다. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill`은 호출별 `timeoutMs` 재정의를 지원하지 않지만 `evaluate`는 지원합니다. `select`는 단일 값만 허용합니다. `batch`는 지원되지 않으므로 작업을 개별적으로 전송하십시오.
- **대기 / 업로드 / 대화 상자** - `wait --url`은 정확한 패턴, 부분 문자열 패턴, glob 패턴을 지원합니다(관리형과 동일). `wait --load networkidle`은 기존 세션 프로필에서 지원되지 않습니다(관리형 및 원시/원격 CDP 프로필에서는 작동함). 업로드 훅에는 `ref` 또는 `inputRef`가 필요하며 한 번에 파일 하나만 처리할 수 있고 CSS `element`는 사용할 수 없습니다. 대화 상자 훅은 타임아웃 재정의 또는 `dialogId`를 지원하지 않습니다.
- **대화 상자 표시 여부** - 관리형 브라우저 작업 응답은 작업이 모달 대화 상자를 열 때 `blockedByDialog`와 `browserState.dialogs.pending`을 포함하며, 스냅샷에도 대기 중인 대화 상자 상태가 포함됩니다. 대화 상자가 대기 중일 때 `browser dialog --accept/--dismiss --dialog-id <id>`로 응답하십시오. OpenClaw 외부에서 처리된 대화 상자는 `browserState.dialogs.recent` 아래에 표시됩니다.
- **관리형 전용 기능** - PDF 내보내기, 다운로드 가로채기, `responsebody`에는 여전히 관리형 브라우저 경로가 필요합니다.

</Accordion>

## 격리 보장

- **전용 사용자 데이터 디렉터리**: 개인 브라우저 프로필을 절대 건드리지 않습니다.
- **전용 포트**: 개발 워크플로와의 충돌을 방지하기 위해 `9222`를 사용하지 않습니다.
- **결정론적 탭 제어**: `tabs`는 `suggestedTargetId`를 먼저 반환한 다음 `t1`과 같은 안정적인 `tabId` 핸들, 선택적 레이블, 원시 `targetId`를 반환합니다. 에이전트는 `suggestedTargetId`를 재사용해야 하며 원시 ID는 디버깅 및 호환성을 위해 계속 사용할 수 있습니다.

## 브라우저 선택

로컬에서 실행할 때 OpenClaw는 다음 중 사용 가능한 첫 번째 브라우저를 선택합니다.

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

`browser.executablePath`로 재정의할 수 있습니다.

플랫폼:

- macOS: `/Applications`와 `~/Applications`를 확인합니다.
- Linux: `/usr/bin`, `/snap/bin`, `/opt/google`, `/opt/brave.com`, `/usr/lib/chromium`, `/usr/lib/chromium-browser` 아래의 일반적인 Chrome/Brave/Edge/Chromium 위치와 `PLAYWRIGHT_BROWSERS_PATH` 또는 `~/.cache/ms-playwright` 아래의 Playwright 관리형 Chromium을 확인합니다.
- Windows: 일반적인 설치 위치를 확인합니다.

## 제어 API(선택 사항)

스크립팅과 디버깅을 위해 Gateway는 작은 **루프백 전용 HTTP 제어 API**와 이에 대응하는 `openclaw browser` CLI(스냅샷, 참조, 향상된 대기 기능, JSON 출력, 디버그 워크플로)를 제공합니다. 전체 참조는 [브라우저 제어 API](/ko/tools/browser-control)를 참조하십시오.

## 문제 해결

Linux 관련 문제(특히 snap Chromium)는 [브라우저 문제 해결](/ko/tools/browser-linux-troubleshooting)을 참조하십시오.

WSL2 Gateway와 Windows Chrome을 분리 호스트로 구성한 경우 [WSL2 + Windows + 원격 Chrome CDP 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)을 참조하십시오.

### CDP 시작 실패와 탐색 SSRF 차단 비교

이들은 서로 다른 실패 유형이며 각각 다른 코드 경로를 가리킵니다.

- **CDP 시작 또는 준비 상태 실패**는 OpenClaw가 브라우저 제어 플레인이 정상인지 확인할 수 없음을 의미합니다.
- **탐색 SSRF 차단**은 브라우저 제어 플레인은 정상이지만 페이지 탐색 대상이 정책에 의해 거부됨을 의미합니다.

일반적인 예:

- CDP 시작 또는 준비 상태 실패:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
  - 루프백 외부 CDP 서비스가 `attachOnly: true` 없이 구성된 경우 `Port <port> is in use for profile "<name>" but not by openclaw`
- 탐색 SSRF 차단:
  - `start`와 `tabs`는 계속 작동하지만 `open`, `navigate`, 스냅샷 또는 탭 열기 흐름이 브라우저/네트워크 정책 오류로 실패함

다음 최소 명령 순서를 사용하여 두 유형을 구분하십시오.

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

결과 해석 방법:

- `start`가 `not reachable after start`와 함께 실패하면 먼저 CDP 준비 상태 문제를 해결하십시오.
- `start`는 성공하지만 `tabs`가 실패하면 제어 플레인이 여전히 비정상입니다. 이를 페이지 탐색 문제가 아닌 CDP 연결 가능성 문제로 취급하십시오.
- `start`와 `tabs`는 성공하지만 `open` 또는 `navigate`가 실패하면 브라우저 제어 플레인은 실행 중이며 탐색 정책 또는 대상 페이지에 문제가 있습니다.
- `start`, `tabs`, `open`이 모두 성공하면 기본 관리형 브라우저 제어 경로가 정상입니다.

중요한 동작 세부 정보:

- `browser.ssrfPolicy`를 구성하지 않아도 브라우저 구성은 기본적으로 실패 시 차단하는 SSRF 정책 객체를 사용합니다.
- 로컬 루프백 `openclaw` 관리형 프로필의 경우 CDP 상태 확인은 OpenClaw 자체 로컬 제어 플레인에 대한 브라우저 SSRF 연결 가능성 적용을 의도적으로 건너뜁니다.
- 탐색 보호는 별개입니다. `start` 또는 `tabs`가 성공해도 이후의 `open` 또는 `navigate` 대상이 허용된다는 의미는 아닙니다.

보안 지침:

- 기본적으로 브라우저 SSRF 정책을 완화하지 **마십시오**.
- 광범위한 사설 네트워크 액세스보다 `hostnameAllowlist` 또는 `allowedHostnames`와 같은 제한적인 호스트 예외를 우선 사용하십시오.
- `dangerouslyAllowPrivateNetwork: true`는 사설 네트워크 브라우저 액세스가 필요하고 검토된, 의도적으로 신뢰하는 환경에서만 사용하십시오.

## 에이전트 도구 및 제어 방식

에이전트는 브라우저 자동화를 위해 **하나의 도구**를 사용합니다.

- `browser` - doctor/status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

매핑 방식:

- `browser snapshot`은 안정적인 UI 트리(AI 또는 ARIA)를 반환합니다.
- `browser act`는 스냅샷 `ref` ID를 사용하여 클릭/입력/드래그/선택합니다.
- `browser screenshot`은 픽셀을 캡처합니다(전체 페이지, 요소 또는 레이블이 지정된 참조).
- `browser doctor`는 Gateway, Plugin, 프로필, 브라우저, 탭의 준비 상태를 확인합니다.
- `browser`는 다음을 허용합니다.
  - 이름이 지정된 브라우저 프로필(openclaw, chrome 또는 원격 CDP)을 선택하는 `profile`.
  - 브라우저가 위치한 곳을 선택하는 `target`(`sandbox` | `host` | `node`).
  - 샌드박스 세션에서 `target: "host"`를 사용하려면 `agents.defaults.sandbox.browser.allowHostControl=true`가 필요합니다.
  - `target`이 생략된 경우 샌드박스 세션은 기본적으로 `sandbox`, 샌드박스가 아닌 세션은 기본적으로 `host`를 사용합니다.
  - 브라우저 기능이 있는 Node가 연결되어 있으면 `target="host"` 또는 `target="node"`로 고정하지 않는 한 도구가 해당 Node로 자동 라우팅할 수 있습니다.

이 방식은 에이전트의 결정론적 동작을 유지하고 취약한 선택자를 피합니다.

## 관련 문서

- [도구 개요](/ko/tools) - 사용 가능한 모든 에이전트 도구
- [샌드박싱](/ko/gateway/sandboxing) - 샌드박스 환경의 브라우저 제어
- [보안](/ko/gateway/security) - 브라우저 제어 위험 및 강화
