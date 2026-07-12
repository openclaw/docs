---
read_when:
    - 자격 증명, 기기 또는 에이전트 기본값을 대화형으로 조정하려는 경우
summary: '`openclaw configure`의 CLI 참조(대화형 구성 프롬프트)'
title: 구성하기
x-i18n:
    generated_at: "2026-07-12T00:40:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

기존 설정에서 자격 증명, 기기, 에이전트 기본값, Gateway, 채널, Plugin, Skills 및 상태 검사를 선택적으로 변경하기 위한 대화형 프롬프트입니다.

전체 안내형 최초 실행 과정에는 `openclaw onboard` 또는 `openclaw setup`을 사용하고, 기준 구성/작업 공간만 설정하려면 `openclaw setup --baseline`을 사용하며, 채널 계정 설정만 필요한 경우에는 `openclaw channels add`를 사용하세요.

<Tip>
하위 명령 없이 `openclaw config`를 실행하면 동일한 마법사가 열립니다. 비대화형 편집에는 `openclaw config get|set|unset`을 사용하세요.
</Tip>

## 옵션

`--section <section>`: 반복해서 지정할 수 있는 섹션 필터입니다. 사용 가능한 섹션은 다음과 같습니다.

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

`gateway`, `daemon` 또는 `health`를 선택하거나 `--section` 없이 전체 마법사를 실행하면 Gateway가 실행되는 위치를 묻고 `gateway.mode`를 업데이트합니다. 세 섹션을 모두 건너뛰는 섹션 필터를 사용하면 Gateway 모드 프롬프트 없이 요청한 설정으로 바로 이동합니다. 원격 Gateway 모드를 선택하면 원격 구성을 작성하고 즉시 종료하며, Plugin 설치와 같은 로컬 전용 단계는 실행하지 않습니다.

<Note>
`openclaw configure`에는 대화형 터미널이 필요합니다(stdin과 stdout이 모두 TTY여야 함). 대화형 터미널이 없으면 부분적으로 실행하지 않고, 이에 해당하는 비대화형 `openclaw config get|set|patch|validate` 명령을 출력한 뒤 오류와 함께 종료합니다.
</Note>

## 모델 섹션

<Note>
**모델**에는 `agents.defaults.models` 허용 목록(`/model`과 모델 선택기에 표시되는 항목)을 설정하는 다중 선택이 포함됩니다. 공급자 범위 설정 옵션은 선택한 모델을 기존 허용 목록에 병합하며, 구성에 이미 있는 관련 없는 공급자를 대체하지 않습니다.

configure에서 공급자 인증을 다시 실행하면 공급자의 인증 단계가 자체 권장 기본 모델이 포함된 구성 패치를 반환하더라도 기존 `agents.defaults.model.primary`가 유지됩니다. 공급자를 추가하거나 다시 인증하면 현재 기본 모델을 변경하지 않고 해당 공급자의 모델을 사용할 수 있게 됩니다. 기본 모델을 의도적으로 변경하려면 `openclaw models auth login --provider <id> --set-default` 또는 `openclaw models set <model>`을 사용하세요.
</Note>

configure가 공급자 인증 옵션에서 시작되면 기본 모델 및 허용 목록 선택기는 해당 공급자를 자동으로 우선합니다. Volcengine과 BytePlus처럼 쌍을 이루는 공급자의 경우 동일한 우선 설정이 코딩 플랜 변형(`volcengine-plan/*`, `byteplus-plan/*`)에도 적용됩니다. 선호 공급자 필터로 인해 목록이 비게 되는 경우, configure는 빈 선택기를 표시하는 대신 필터링되지 않은 카탈로그로 대체합니다.

## 웹 섹션

`openclaw configure --section web`은 웹 검색 공급자를 선택하고 해당 자격 증명을 구성합니다. 일부 공급자는 공급자별 후속 옵션을 표시합니다.

- **Grok**은 동일한 xAI OAuth 프로필 또는 API 키를 사용한 선택적 `x_search` 설정을 제공하고 `x_search` 모델을 선택할 수 있게 합니다.
- **Kimi**는 Moonshot API 리전(`api.moonshot.ai` 또는 `api.moonshot.cn`)과 기본 Kimi 웹 검색 모델을 묻습니다.

## 기타 참고 사항

- 로컬 구성을 작성한 후, 선택한 설정 경로에 필요한 경우 configure가 선택된 다운로드 가능 Plugin을 설치합니다. 원격 Gateway 구성은 로컬 Plugin 패키지를 설치하지 않습니다.
- 채널 중심 서비스(Slack/Discord/Matrix/Microsoft Teams)는 설정 중에 채널/룸 허용 목록을 묻습니다. 이름이나 ID를 입력할 수 있으며, 가능한 경우 마법사가 이름을 ID로 변환합니다.
- 데몬 설치 단계를 실행하는 경우 토큰 인증에는 토큰이 필요합니다. `gateway.auth.token`이 SecretRef로 관리되는 경우 configure는 SecretRef의 유효성을 검사하지만 해석된 평문 토큰 값을 감독자 서비스 환경 메타데이터에 저장하지 않습니다. SecretRef를 해석할 수 없으면 configure는 실행 가능한 해결 지침과 함께 데몬 설치를 차단합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, configure는 모드를 명시적으로 설정할 때까지 데몬 설치를 차단합니다.

## 관련 문서

- [CLI 참조](/ko/cli)
- [구성](/ko/gateway/configuration)
- 구성 CLI: [구성](/ko/cli/config)
