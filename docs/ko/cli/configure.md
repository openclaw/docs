---
read_when:
    - 자격 증명, 기기 또는 에이전트 기본값을 대화형으로 조정하려는 경우
summary: '`openclaw configure`의 CLI 참조(대화형 구성 프롬프트)'
title: 구성
x-i18n:
    generated_at: "2026-06-27T17:17:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

기존 설정의 특정 항목을 변경하기 위한 대화형 프롬프트입니다: 자격 증명, 기기, 에이전트 기본값, Gateway, 채널, Plugin, Skills, 상태 확인.

전체 안내형 최초 실행 과정을 진행하려면 `openclaw onboard`를 사용하고, 기본 config/workspace만 설정하려면 `openclaw setup`을 사용하며, 채널 계정 설정만 필요할 때는 `openclaw channels add`를 사용하세요.

<Note>
**모델** 섹션에는 `agents.defaults.models` 허용 목록(`/model` 및 모델 선택기에 표시되는 항목)을 위한 다중 선택 항목이 포함됩니다. 공급자 범위 설정 선택지는 config에 이미 있는 관련 없는 공급자를 대체하지 않고, 선택한 모델을 기존 허용 목록에 병합합니다.

configure에서 공급자 인증을 다시 실행하면 기존 `agents.defaults.model.primary`가 유지됩니다. 공급자의 인증 단계가 자체 권장 기본 모델이 포함된 config 패치를 반환하더라도 마찬가지입니다. 즉, xAI, OpenRouter 또는 다른 공급자를 추가하거나 재인증하면 현재 기본 모델을 대체하지 않고 새 모델을 사용할 수 있게 됩니다. 기본 모델을 의도적으로 변경하려면 `openclaw models auth login --provider <id> --set-default` 또는 `openclaw models set <model>`을 사용하세요.
</Note>

configure가 공급자 인증 선택에서 시작되면 기본 모델 및 허용 목록 선택기는 해당 공급자를 자동으로 우선합니다. Volcengine 및 BytePlus 같은 쌍을 이루는 공급자의 경우 동일한 선호 설정이 해당 코딩 플랜 변형(`volcengine-plan/*`, `byteplus-plan/*`)에도 일치합니다. 선호 공급자 필터가 빈 목록을 만들 경우, configure는 빈 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

<Tip>
하위 명령 없이 `openclaw config`를 실행하면 동일한 마법사가 열립니다. 비대화형 편집에는 `openclaw config get|set|unset`을 사용하세요.
</Tip>

웹 검색의 경우 `openclaw configure --section web`을 사용하면 공급자를 선택하고
해당 자격 증명을 구성할 수 있습니다. 일부 공급자는 공급자별
후속 프롬프트도 표시합니다:

- **Grok**은 동일한 xAI OAuth 프로필 또는 API 키로 선택적 `x_search` 설정을
  제공하고 `x_search` 모델을 선택할 수 있게 합니다.
- **Kimi**는 Moonshot API 리전(`api.moonshot.ai` vs
  `api.moonshot.cn`)과 기본 Kimi 웹 검색 모델을 요청할 수 있습니다.

관련 항목:

- Gateway 구성 참조: [구성](/ko/gateway/configuration)
- Config CLI: [Config](/ko/cli/config)

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

- 전체 마법사와 Gateway 관련 섹션은 Gateway가 실행되는 위치를 묻고 `gateway.mode`를 업데이트합니다. `gateway`, `daemon`, 또는 `health`를 포함하지 않는 섹션 필터는 요청한 설정으로 바로 이동합니다.
- 로컬 config 쓰기 후, configure는 선택한 설정 경로에 필요한 경우 선택된 다운로드 가능한 Plugin을 설치합니다. 원격 Gateway config는 로컬 Plugin 패키지를 설치하지 않습니다.
- 채널 지향 서비스(Slack/Discord/Matrix/Microsoft Teams)는 설정 중 채널/룸 허용 목록을 묻습니다. 이름 또는 ID를 입력할 수 있으며, 마법사는 가능한 경우 이름을 ID로 확인합니다.
- daemon 설치 단계를 실행하고, 토큰 인증에 토큰이 필요하며, `gateway.auth.token`이 SecretRef로 관리되는 경우, configure는 SecretRef를 검증하지만 확인된 평문 토큰 값을 supervisor 서비스 환경 메타데이터에 유지하지 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 확인되지 않은 경우, configure는 실행 가능한 해결 지침과 함께 daemon 설치를 차단합니다.
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
