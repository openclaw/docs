---
read_when:
    - 브라우저 자동화를 위해 사이트에 로그인해야 합니다
    - X/Twitter에 업데이트를 게시하려는 경우
summary: 브라우저 자동화 및 X/Twitter 게시를 위한 수동 로그인
title: 브라우저 로그인
x-i18n:
    generated_at: "2026-05-06T06:40:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 235194fd3a49724247f98e6d7c848c4cc3317f749ff4a8918c2172b73baf21e3
    source_path: tools/browser-login.md
    workflow: 16
---

## 수동 로그인(권장)

사이트에서 로그인이 필요한 경우 **호스트** 브라우저 프로필(OpenClaw 브라우저)에서 **직접 로그인**하세요.

모델에 자격 증명을 **제공하지 마세요**. 자동 로그인은 봇 방지 기능을 트리거하는 경우가 많으며 계정이 잠길 수 있습니다.

기본 브라우저 문서로 돌아가기: [브라우저](/ko/tools/browser).

## 어떤 Chrome 프로필이 사용되나요?

OpenClaw는 **전용 Chrome 프로필**(`openclaw`라는 이름, 주황색 톤 UI)을 제어합니다. 이는 매일 사용하는 브라우저 프로필과 별개입니다.

에이전트 브라우저 도구 호출의 경우:

- 기본 선택: 에이전트는 격리된 `openclaw` 브라우저를 사용해야 합니다.
- 기존 로그인 세션이 중요하고 사용자가 컴퓨터 앞에서 연결 프롬프트를 클릭/승인할 수 있을 때만 `profile="user"`를 사용하세요.
- 사용자 브라우저 프로필이 여러 개 있는 경우 추측하지 말고 프로필을 명시적으로 지정하세요.

접근하는 쉬운 방법 두 가지:

1. **에이전트에게 브라우저를 열도록 요청**한 다음 직접 로그인하세요.
2. **CLI로 열기**:

```bash
openclaw browser start
openclaw browser open https://x.com
```

프로필이 여러 개인 경우 `--browser-profile <name>`을 전달하세요(기본값은 `openclaw`입니다).

## X/Twitter: 권장 흐름

- **읽기/검색/스레드:** **호스트** 브라우저를 사용하세요(수동 로그인).
- **업데이트 게시:** **호스트** 브라우저를 사용하세요(수동 로그인).

## 샌드박싱 + 호스트 브라우저 접근

샌드박스 처리된 브라우저 세션은 봇 탐지를 트리거할 **가능성이 더 높습니다**. X/Twitter(및 기타 엄격한 사이트)의 경우 **호스트** 브라우저를 선호하세요.

에이전트가 샌드박스 처리된 경우 브라우저 도구의 기본값은 샌드박스입니다. 호스트 제어를 허용하려면:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true,
        },
      },
    },
  },
}
```

그런 다음 호스트 브라우저를 대상으로 지정하세요:

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

또는 업데이트를 게시하는 에이전트의 샌드박싱을 비활성화하세요.

## 관련

- [브라우저](/ko/tools/browser)
- [브라우저 Linux 문제 해결](/ko/tools/browser-linux-troubleshooting)
- [브라우저 WSL2 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
