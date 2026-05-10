---
read_when:
    - 자격 증명, 기기 또는 에이전트 기본값을 대화식으로 조정하려는 경우
summary: '`openclaw configure`의 CLI 참조(대화형 구성 프롬프트)'
title: 구성
x-i18n:
    generated_at: "2026-05-10T19:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba5320fefb856c208405511619fc1a4314e3f5e3990f221e987a03d692189fb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

기존 설정의 특정 부분을 변경하기 위한 대화형 프롬프트입니다: 자격 증명, 기기, 에이전트 기본값, Gateway, 채널, 플러그인, Skills, 상태 점검.

전체 안내형 최초 실행 과정을 진행하려면 `openclaw onboard`를, 기본 구성/작업공간만 설정하려면 `openclaw setup`을, 채널 계정 설정만 필요하면 `openclaw channels add`를 사용하세요.

<Note>
**모델** 섹션에는 `agents.defaults.models` 허용 목록(`/model`과 모델 선택기에 표시되는 항목)을 위한 다중 선택이 포함되어 있습니다. 공급자 범위 설정 선택 항목은 구성에 이미 있는 관련 없는 공급자를 대체하지 않고, 선택한 모델을 기존 허용 목록에 병합합니다.

configure에서 공급자 인증을 다시 실행하면, 공급자의 인증 단계가 자체 권장 기본 모델을 포함한 구성 패치를 반환하더라도 기존 `agents.defaults.model.primary`가 유지됩니다. 즉 xAI, OpenRouter 또는 다른 공급자를 추가하거나 재인증하면 현재 기본 모델을 대체하지 않고 새 모델을 사용할 수 있게 됩니다. 기본 모델을 의도적으로 변경하려면 `openclaw models auth login --provider <id> --set-default` 또는 `openclaw models set <model>`을 사용하세요.
</Note>

configure가 공급자 인증 선택에서 시작되면, 기본 모델 및 허용 목록 선택기는 해당 공급자를 자동으로 우선합니다. Volcengine과 BytePlus처럼 쌍을 이루는 공급자의 경우 같은 우선순위가 해당 코딩 플랜 변형(`volcengine-plan/*`, `byteplus-plan/*`)에도 적용됩니다. 선호 공급자 필터 결과가 빈 목록이 되면 configure는 빈 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 되돌아갑니다.

<Tip>
하위 명령 없이 `openclaw config`를 실행하면 같은 마법사가 열립니다. 비대화형 편집에는 `openclaw config get|set|unset`을 사용하세요.
</Tip>

웹 검색의 경우 `openclaw configure --section web`으로 공급자를 선택하고
해당 자격 증명을 구성할 수 있습니다. 일부 공급자는 공급자별
후속 프롬프트도 표시합니다:

- **Grok**은 같은 `XAI_API_KEY`로 선택적 `x_search` 설정을 제공하고
  `x_search` 모델을 선택할 수 있게 합니다.
- **Kimi**는 Moonshot API 리전(`api.moonshot.ai`와
  `api.moonshot.cn` 중 하나)과 기본 Kimi 웹 검색 모델을 물어볼 수 있습니다.

관련 항목:

- Gateway 구성 참조: [구성](/ko/gateway/configuration)
- 구성 CLI: [구성](/ko/cli/config)

## 옵션

- `--section <section>`: 반복 가능한 섹션 필터

사용 가능한 섹션:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

참고:

- Gateway가 실행되는 위치를 선택하면 항상 `gateway.mode`가 업데이트됩니다. 필요한 작업이 그것뿐이라면 다른 섹션 없이 "계속"을 선택할 수 있습니다.
- 로컬 구성 쓰기 이후, configure는 선택한 설정 경로에 필요한 경우 선택된 다운로드 가능한 플러그인을 설치합니다. 원격 gateway 구성은 로컬 플러그인 패키지를 설치하지 않습니다.
- 채널 지향 서비스(Slack/Discord/Matrix/Microsoft Teams)는 설정 중 채널/방 허용 목록을 묻습니다. 이름 또는 ID를 입력할 수 있으며, 마법사는 가능한 경우 이름을 ID로 해석합니다.
- daemon 설치 단계를 실행할 때 토큰 인증에 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되는 경우, configure는 SecretRef를 검증하지만 해석된 일반 텍스트 토큰 값을 supervisor 서비스 환경 메타데이터에 저장하지 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 해석되지 않으면, configure는 실행 가능한 해결 안내와 함께 daemon 설치를 차단합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, configure는 모드가 명시적으로 설정될 때까지 daemon 설치를 차단합니다.

## 예시

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## 관련 항목

- [CLI 참조](/ko/cli)
- [구성](/ko/gateway/configuration)
