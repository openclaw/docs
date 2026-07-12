---
read_when:
    - 브라우저 자동화를 위해 사이트에 로그인해야 합니다
    - X/Twitter에 업데이트를 게시하려고 합니다
summary: 브라우저 자동화 및 X/Twitter 게시를 위한 수동 로그인
title: 브라우저 로그인
x-i18n:
    generated_at: "2026-07-12T15:47:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bccd363cf7c9611f4687d50a92f7fb3e2fd1c1d67bb27a80c892f7ac58ae1f8f
    source_path: tools/browser-login.md
    workflow: 16
---

## 수동 로그인(권장)

사이트에서 로그인을 요구하면 호스트 브라우저의 `openclaw` 프로필에서 직접 로그인하십시오. 모델에 자격 증명을 제공하지 마십시오. 자동 로그인은 봇 방지 기능을 작동시키는 경우가 많으며 계정이 잠길 수 있습니다.

X/Twitter 및 기타 봇에 민감한 사이트에서 읽기(검색/스레드)와 게시를 모두 수행할 때는 호스트 브라우저(수동 로그인)를 사용하십시오. 샌드박스 브라우저 세션은 봇 탐지를 작동시킬 가능성이 더 큽니다.

기본 브라우저 문서로 돌아가기: [브라우저](/ko/tools/browser).

## 어떤 Chrome 프로필이 사용됩니까?

OpenClaw는 일상적으로 사용하는 브라우저 프로필과 분리된 `openclaw`라는 전용 Chrome 프로필(주황색 계열 UI)을 제어합니다.

에이전트의 브라우저 도구 호출 시:

- 기본 선택: 에이전트는 격리된 `openclaw` 브라우저를 사용합니다.
- 기존 로그인 세션이 중요하고 연결 프롬프트를 클릭하거나 승인하기 위해 컴퓨터 앞에 있는 경우에만 `profile="user"`를 사용하십시오.
- 사용자 브라우저 프로필이 여러 개라면 추측하지 말고 프로필을 명시적으로 지정하십시오.

`openclaw` 프로필에 접근하는 방법은 두 가지입니다.

1. 에이전트에게 브라우저를 열도록 요청한 다음 직접 로그인합니다.
2. CLI를 통해 엽니다.

```bash
openclaw browser start
openclaw browser open https://x.com
```

기본값이 아닌 프로필의 경우 하위 명령 앞에 `--browser-profile <name>`을 지정하십시오(기본값은 `openclaw`입니다).

```bash
openclaw browser --browser-profile <name> open https://x.com
```

## 샌드박싱: 호스트 브라우저 접근 허용

에이전트가 샌드박스에서 실행되는 경우 해당 `browser` 도구 호출의 기본 대상은 호스트가 아닌 샌드박스 브라우저입니다. 에이전트가 대신 호스트 브라우저를 대상으로 지정할 수 있게 하려면 다음과 같이 설정하십시오.

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

CLI 호출은 항상 샌드박스가 아닌 호스트 브라우저를 대상으로 하므로 이 설정과 관계없이 직접 호스트 브라우저를 열 수 있습니다.

```bash
openclaw browser --browser-profile openclaw open https://x.com
```

`sandbox.browser.allowHostControl: true`를 설정하면 에이전트의 `browser` 도구 호출도 호스트를 대상으로 할 수 있습니다. 또는 업데이트를 게시하는 에이전트의 샌드박싱을 비활성화하십시오.

## 관련 문서

- [브라우저](/ko/tools/browser)
- [브라우저 Linux 문제 해결](/ko/tools/browser-linux-troubleshooting)
- [브라우저 WSL2 문제 해결](/ko/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
