---
read_when:
    - 자격 증명, 디바이스 또는 에이전트 기본값을 대화형으로 조정하려고 합니다.
summary: '`openclaw configure`용 CLI 참조(대화형 구성 프롬프트)'
title: 구성하기
x-i18n:
    generated_at: "2026-04-23T14:00:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7fedaf1bc5e5c793ed354ff01294808f9b4a266219f8e07799a2545fe5652cf2
    source_path: cli/configure.md
    workflow: 15
---

# `openclaw configure`

자격 증명, 디바이스, 에이전트 기본값을 설정하기 위한 대화형 프롬프트입니다.

참고: 이제 **Model** 섹션에는
`agents.defaults.models` 허용 목록(`/model`과 모델 선택기에 표시되는 항목)에 대한 다중 선택이 포함됩니다.
provider 범위 설정 선택은 선택한 모델을 기존 허용 목록에 병합하며,
구성에 이미 있는 관련 없는 다른 provider 항목을 대체하지 않습니다.

configure가 provider 인증 선택에서 시작되면, 기본 모델과
허용 목록 선택기는 자동으로 해당 provider를 우선합니다. Volcengine/BytePlus와
같이 짝을 이루는 provider의 경우, 동일한 우선순위는 해당 coding-plan
변형(`volcengine-plan/*`, `byteplus-plan/*`)에도 적용됩니다. preferred-provider
필터 결과가 빈 목록이 되면, configure는 빈 선택기를 표시하는 대신
필터링되지 않은 전체 카탈로그로 대체합니다.

팁: 하위 명령 없이 `openclaw config`를 실행하면 같은 마법사가 열립니다.
비대화형 편집에는 `openclaw config get|set|unset`을 사용하세요.

웹 검색의 경우 `openclaw configure --section web`을 사용하면 provider를 선택하고
해당 자격 증명을 구성할 수 있습니다. 일부 provider는 provider별
후속 프롬프트도 표시합니다:

- **Grok**은 동일한 `XAI_API_KEY`로 선택적 `x_search` 설정을 제안할 수 있으며
  `x_search` 모델을 선택할 수 있게 합니다.
- **Kimi**는 Moonshot API 리전(`api.moonshot.ai` vs
  `api.moonshot.cn`)과 기본 Kimi 웹 검색 모델을 물을 수 있습니다.

관련 항목:

- Gateway 구성 참조: [Configuration](/ko/gateway/configuration)
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

- Gateway 실행 위치를 선택하면 항상 `gateway.mode`가 업데이트됩니다. 그것만 필요하다면 다른 섹션 없이 "Continue"만 선택할 수 있습니다.
- 채널 중심 서비스(Slack/Discord/Matrix/Microsoft Teams)는 설정 중 채널/룸 허용 목록을 묻습니다. 이름이나 ID를 입력할 수 있으며, 가능하면 마법사가 이름을 ID로 확인합니다.
- daemon 설치 단계를 실행하는 경우, 토큰 인증에는 토큰이 필요하고 `gateway.auth.token`이 SecretRef로 관리되면, configure는 SecretRef를 검증하지만 해석된 평문 토큰 값을 supervisor 서비스 환경 메타데이터에 저장하지는 않습니다.
- 토큰 인증에 토큰이 필요하고 구성된 토큰 SecretRef가 해석되지 않으면, configure는 실행 가능한 해결 안내와 함께 daemon 설치를 차단합니다.
- `gateway.auth.token`과 `gateway.auth.password`가 모두 구성되어 있고 `gateway.auth.mode`가 설정되지 않은 경우, configure는 모드가 명시적으로 설정될 때까지 daemon 설치를 차단합니다.

## 예시

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```
