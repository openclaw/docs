---
read_when:
    - 동일한 머신에서 둘 이상의 Gateway 실행하기
    - Gateway마다 격리된 구성/상태/포트가 필요합니다
summary: 하나의 호스트에서 여러 OpenClaw Gateway 실행하기(격리, 포트 및 프로필)
title: 여러 Gateway
x-i18n:
    generated_at: "2026-07-12T15:16:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

대부분의 설정에는 하나의 Gateway만 필요합니다. 단일 Gateway가 여러 메시징 연결과 에이전트를 처리합니다. 더 강력한 격리 또는 이중화가 필요한 경우(예: 복구 봇)에만 격리된 프로필/포트를 사용하는 별도의 Gateway를 실행하십시오.

## 복구 봇 빠른 시작

가장 간단한 복구 봇 설정은 다음과 같습니다.

- 기본 봇은 기본 프로필에서 유지합니다.
- 자체 Telegram 봇 토큰을 사용하여 `--profile rescue`에서 복구 봇을 실행합니다.
- 복구 봇에는 다른 기본 포트(예: `19789`)를 지정합니다.

이렇게 하면 기본 봇이 중단되더라도 복구 봇을 통해 디버깅하거나 구성 변경 사항을 적용할 수 있습니다. 파생된 브라우저/CDP 포트가 충돌하지 않도록 기본 포트 사이에 최소 20개의 포트 간격을 두십시오.

```bash
# 복구 봇(별도의 Telegram 봇, 별도의 프로필, 포트 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

기본 봇이 이미 실행 중이라면 일반적으로 이것만으로 충분합니다. 온보딩에서 복구 서비스를 이미 설치했다면 마지막 `gateway install`을 건너뛰십시오.

`openclaw --profile rescue onboard` 실행 중에는 다음과 같이 설정합니다.

- 복구 계정 전용의 별도 Telegram 봇 토큰을 사용합니다(운영자 전용으로 유지하기 쉽고, 기본 봇의 채널/앱 설치와 독립적이며, 간단한 DM 기반 복구 경로를 제공합니다).
- `rescue` 프로필 이름을 유지합니다.
- 기본 봇보다 최소 20 높은 기본 포트를 사용합니다.
- 이미 직접 관리하는 작업 공간이 없다면 기본 복구 작업 공간을 사용합니다.

### `--profile rescue onboard`에서 변경되는 사항

`--profile rescue onboard`는 일반 온보딩 흐름을 실행하지만 모든 항목을 별도의 프로필에 기록하므로, 복구 봇에는 다음 항목이 각각 별도로 제공됩니다.

- 프로필/구성 파일
- 상태 디렉터리
- 작업 공간(기본값: `~/.openclaw/workspace-rescue`)
- 관리형 서비스 이름
- 기본 포트(및 파생 포트)
- Telegram 봇 토큰

그 외의 프롬프트는 일반 온보딩과 동일합니다.

## 일반적인 다중 Gateway 설정

동일한 격리 패턴을 한 호스트의 모든 Gateway 쌍이나 그룹에 적용할 수 있습니다. 추가되는 각 Gateway에 고유한 명명된 프로필과 기본 포트를 지정하십시오.

```bash
# 기본 Gateway(기본 프로필)
openclaw setup
openclaw gateway --port 18789

# 추가 Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

양쪽 모두에서 명명된 프로필을 사용할 수도 있습니다.

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

서비스에도 동일한 패턴이 적용됩니다.

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

대체 운영자 경로에는 구조 봇 빠른 시작을 사용하고, 서로 다른 채널, 테넌트, 워크스페이스 또는 운영 역할에서 장기간 실행되는 여러 Gateway에는 일반 프로필 패턴을 사용하십시오.

## 격리 체크리스트

각 Gateway 인스턴스마다 다음 항목을 고유하게 유지하십시오.

| 설정                         | 용도                                  |
| ---------------------------- | ------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | 인스턴스별 구성 파일                  |
| `OPENCLAW_STATE_DIR`         | 인스턴스별 세션, 자격 증명, 캐시      |
| `agents.defaults.workspace`  | 인스턴스별 워크스페이스 루트          |
| `gateway.port` (또는 `--port`) | 인스턴스마다 고유한 값                |
| 파생 브라우저/CDP 포트       | 아래 참조                             |

이 중 하나라도 공유하면 구성 경합과 포트 충돌이 발생합니다.

## 포트 매핑(파생)

기본 포트 = `gateway.port`(또는 `OPENCLAW_GATEWAY_PORT` / `--port`).

- 브라우저 제어 서비스 포트 = 기본 포트 + 2(루프백 전용).
- Canvas 호스트는 Gateway HTTP 서버 자체에서 제공됩니다(`gateway.port`와 동일한 포트).
- 브라우저 프로필 CDP 포트는 `browser control port + 9`부터 `+ 108`까지 자동 할당됩니다.

구성이나 환경 변수에서 이 중 하나라도 재정의하는 경우 인스턴스마다 고유하게 유지해야 합니다.

## 브라우저/CDP 참고 사항(흔한 함정)

- 여러 인스턴스에서 `browser.cdpUrl`을 동일한 값으로 **고정하지 마십시오**.
- 각 인스턴스에는 자체 브라우저 제어 포트와 CDP 범위가 필요합니다(Gateway 포트에서 파생).
- CDP 포트를 명시적으로 지정하려면 인스턴스별로 `browser.profiles.<name>.cdpPort`를 설정하십시오.
- 원격 Chrome의 경우 `browser.profiles.<name>.cdpUrl`을 사용하십시오(프로필별, 인스턴스별).

## 수동 환경 변수 예시

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

- `gateway status --deep`는 이전 설치에서 남은 오래된 launchd/systemd/schtasks 서비스를 감지합니다.
- `multiple reachable gateway identities detected`와 같은 `gateway probe` 경고 문구는 의도적으로 격리된 Gateway를 둘 이상 실행하거나 OpenClaw가 연결 가능한 프로브 대상이 동일한 Gateway임을 입증할 수 없는 경우에만 예상되는 동작입니다. 동일한 Gateway로 연결되는 SSH 터널, 프록시 URL 또는 구성된 원격 URL은 전송 포트가 서로 다르더라도 여러 전송 방식을 사용하는 하나의 Gateway입니다.

## 관련 문서

- [Gateway 운영 지침서](/ko/gateway)
- [Gateway 잠금](/ko/gateway/gateway-lock)
- [구성](/ko/gateway/configuration)
