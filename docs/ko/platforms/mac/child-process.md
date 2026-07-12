---
read_when:
    - Mac 앱과 Gateway 수명 주기 통합하기
summary: macOS에서의 Gateway 수명 주기(launchd)
title: macOS에서의 Gateway 수명 주기
x-i18n:
    generated_at: "2026-07-12T00:54:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS 앱은 기본적으로 **launchd**를 통해 Gateway를 관리하며 Gateway를 자식 프로세스로 생성하지 않습니다. 먼저 구성된 포트에서 이미 실행 중인 Gateway에 연결을 시도합니다. 연결할 수 있는 Gateway가 없으면 외부 `openclaw` CLI를 통해 launchd 서비스를 활성화합니다(내장 런타임 없음). 이를 통해 로그인 시 안정적으로 자동 시작되고 충돌 시 재시작됩니다.

자식 프로세스 모드(앱이 Gateway를 직접 생성)는 현재 **사용되지 않습니다**. UI와 더 긴밀하게 결합해야 한다면 터미널에서 Gateway를 수동으로 실행하세요.

## 기본 동작(launchd)

- 앱은 `ai.openclaw.gateway` 레이블의 사용자별 LaunchAgent를 설치합니다(`--profile`/`OPENCLAW_PROFILE`을 사용하는 경우 `ai.openclaw.<profile>`).
- 로컬 모드가 활성화되면 앱은 LaunchAgent가 로드되었는지 확인하고 필요한 경우 Gateway를 시작합니다.
- 로그는 launchd Gateway 로그 경로에 기록됩니다(Debug Settings에서 확인 가능).

일반적인 명령:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

명명된 프로필을 실행할 때는 레이블을 `ai.openclaw.<profile>`로 바꾸세요.

## 서명되지 않은 개발 빌드

`scripts/restart-mac.sh --no-sign`은 서명 키 없이 빠르게 로컬 빌드를 수행하기 위한 옵션입니다. launchd가 서명되지 않은 릴레이 바이너리를 가리키지 않도록 `~/.openclaw/disable-launchagent`를 기록합니다.

서명된 상태로 `scripts/restart-mac.sh`를 실행하면 마커가 있는 경우 이 재정의를 제거합니다. 수동으로 초기화하려면 다음을 실행하세요.

```bash
rm ~/.openclaw/disable-launchagent
```

## 연결 전용 모드

macOS 앱이 launchd를 설치하거나 관리하지 않도록 하려면 `--attach-only`(또는 `--no-launchd`)로 실행하세요. 그러면 `~/.openclaw/disable-launchagent`가 설정되어 앱은 이미 실행 중인 Gateway에만 연결합니다. Debug Settings에서도 동일한 동작을 전환할 수 있습니다.

## 원격 모드

원격 모드는 로컬 Gateway를 시작하지 않습니다. 앱은 원격 호스트에 대한 SSH 터널을 사용하고 해당 터널을 통해 연결합니다.

## launchd를 선호하는 이유

- 로그인 시 자동 시작.
- 기본 제공되는 재시작/KeepAlive 의미 체계.
- 예측 가능한 로그 및 감독.

실제 자식 프로세스 모드가 다시 필요해진다면 별도의 명시적인 개발 전용 모드로 문서화해야 합니다.

## 관련 문서

- [macOS 앱](/ko/platforms/macos)
- [Gateway 운영 지침서](/ko/gateway)
