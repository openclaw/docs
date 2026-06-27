---
read_when:
    - 같은 머신에서 둘 이상의 Gateway 실행하기
    - Gateway마다 격리된 구성/상태/포트가 필요합니다
summary: 하나의 호스트에서 여러 OpenClaw Gateway 실행하기(격리, 포트, 프로필)
title: 여러 Gateway
x-i18n:
    generated_at: "2026-06-27T17:29:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

대부분의 설정에서는 하나의 Gateway를 사용해야 합니다. 단일 Gateway가 여러 메시징 연결과 에이전트를 처리할 수 있기 때문입니다. 더 강한 격리나 중복성(예: 구조 봇)이 필요하다면 격리된 프로필/포트로 별도의 Gateway를 실행하세요.

## 가장 권장되는 설정

대부분의 사용자에게 가장 단순한 구조 봇 설정은 다음과 같습니다.

- 기본 프로필에서 메인 봇 유지
- `--profile rescue`에서 구조 봇 실행
- 구조 계정에 완전히 별도의 Telegram 봇 사용
- 구조 봇은 `19789` 같은 다른 기본 포트에 유지

이렇게 하면 구조 봇이 메인 봇과 격리되어 기본 봇이 중단되었을 때 디버그하거나
구성 변경을 적용할 수 있습니다. 파생된 브라우저/canvas/CDP 포트가 충돌하지 않도록
기본 포트 사이에는 최소 20개 포트를 비워 두세요.

## 구조 봇 빠른 시작

다른 방법을 선택해야 할 강한 이유가 없다면 이 경로를 기본값으로 사용하세요.

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

메인 봇이 이미 실행 중이라면 일반적으로 이것만으로 충분합니다.

`openclaw --profile rescue onboard` 중에는 다음을 수행하세요.

- 별도의 Telegram 봇 토큰 사용
- `rescue` 프로필 유지
- 메인 봇보다 최소 20 이상 높은 기본 포트 사용
- 이미 직접 관리하는 구조 워크스페이스가 없다면 기본 구조 워크스페이스 수락

온보딩이 이미 구조 서비스를 설치했다면 마지막
`gateway install`은 필요하지 않습니다.

## 작동 원리

구조 봇은 자체 항목을 가지므로 독립적으로 유지됩니다.

- 프로필/구성
- 상태 디렉터리
- 워크스페이스
- 기본 포트(및 파생 포트)
- Telegram 봇 토큰

대부분의 설정에서는 구조 프로필에 완전히 별도의 Telegram 봇을 사용하세요.

- 운영자 전용으로 유지하기 쉬움
- 별도의 봇 토큰과 ID
- 메인 봇의 채널/앱 설치와 독립적
- 메인 봇이 고장났을 때 간단한 DM 기반 복구 경로 제공

## `--profile rescue onboard`가 변경하는 내용

`openclaw --profile rescue onboard`는 일반 온보딩 흐름을 사용하지만
모든 내용을 별도의 프로필에 기록합니다.

실제로 이는 구조 봇이 자체 항목을 갖는다는 뜻입니다.

- 구성 파일
- 상태 디렉터리
- 워크스페이스(기본값 `~/.openclaw/workspace-rescue`)
- 관리형 서비스 이름

그 외 프롬프트는 일반 온보딩과 동일합니다.

## 일반 다중 Gateway 설정

위의 구조 봇 레이아웃이 가장 쉬운 기본값이지만, 동일한 격리 패턴은 하나의 호스트에서
임의의 두 개 또는 여러 Gateway에도 적용됩니다.

더 일반적인 설정에서는 각 추가 Gateway에 자체 이름 있는 프로필과
자체 기본 포트를 지정하세요.

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

두 Gateway 모두 이름 있는 프로필을 사용하려는 경우에도 가능합니다.

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

서비스도 동일한 패턴을 따릅니다.

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

대체 운영자 경로가 필요할 때는 구조 봇 빠른 시작을 사용하세요.
서로 다른 채널, 테넌트, 워크스페이스 또는 운영 역할을 위해 여러 장기 실행 Gateway가 필요할 때는
일반 프로필 패턴을 사용하세요.

## 격리 체크리스트

각 Gateway 인스턴스마다 다음 항목을 고유하게 유지하세요.

- `OPENCLAW_CONFIG_PATH` — 인스턴스별 구성 파일
- `OPENCLAW_STATE_DIR` — 인스턴스별 세션, 자격 증명, 캐시
- `agents.defaults.workspace` — 인스턴스별 워크스페이스 루트
- `gateway.port`(또는 `--port`) — 인스턴스별 고유 값
- 파생된 브라우저/canvas/CDP 포트

이 항목들이 공유되면 구성 경쟁 상태와 포트 충돌이 발생합니다.

## 포트 매핑(파생)

기본 포트 = `gateway.port`(또는 `OPENCLAW_GATEWAY_PORT` / `--port`).

- 브라우저 제어 서비스 포트 = 기본 + 2(루프백 전용)
- canvas 호스트는 Gateway HTTP 서버에서 제공됨(`gateway.port`와 동일한 포트)
- 브라우저 프로필 CDP 포트는 `browser.controlPort + 9 .. + 108` 범위에서 자동 할당됨

구성이나 env에서 이 중 하나라도 재정의하는 경우 인스턴스마다 고유하게 유지해야 합니다.

## 브라우저/CDP 참고 사항(흔한 함정)

- 여러 인스턴스에서 `browser.cdpUrl`을 같은 값으로 고정하지 **마세요**.
- 각 인스턴스에는 자체 브라우저 제어 포트와 CDP 범위가 필요합니다(해당 gateway 포트에서 파생).
- 명시적 CDP 포트가 필요하다면 인스턴스마다 `browser.profiles.<name>.cdpPort`를 설정하세요.
- 원격 Chrome: `browser.profiles.<name>.cdpUrl`을 사용하세요(프로필별, 인스턴스별).

## 수동 env 예시

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## 빠른 확인

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

해석:

- `gateway status --deep`는 이전 설치에서 남은 오래된 launchd/systemd/schtasks 서비스를 찾는 데 도움이 됩니다.
- `multiple reachable gateway identities detected` 같은 `gateway probe` 경고 텍스트는 의도적으로 둘 이상의 격리된 gateway를 실행할 때, 또는 OpenClaw가 도달 가능한 probe 대상이 동일한 gateway임을 증명할 수 없을 때만 예상됩니다. 동일한 gateway로 향하는 SSH 터널, 프록시 URL 또는 구성된 원격 URL은 전송 포트가 다르더라도 여러 전송 수단을 가진 하나의 gateway입니다.

## 관련 항목

- [Gateway 실행 지침서](/ko/gateway)
- [Gateway 잠금](/ko/gateway/gateway-lock)
- [구성](/ko/gateway/configuration)
