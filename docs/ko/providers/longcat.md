---
read_when:
    - OpenClaw에서 LongCat-2.0을 사용하려고 합니다
    - LongCat API 키 또는 모델 한도가 필요합니다.
summary: LongCat-2.0용 LongCat API 설정
title: LongCat
x-i18n:
    generated_at: "2026-07-12T15:40:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai)은 코딩 및 에이전트형 워크로드용으로 구축된 추론 모델인 LongCat-2.0의 호스팅 API를 제공합니다. OpenClaw는 LongCat의 OpenAI 호환 엔드포인트를 위한 공식 `longcat` Plugin을 제공합니다.

| 속성        | 값                                 |
| ----------- | ---------------------------------- |
| 제공업체    | `longcat`                          |
| 인증        | `LONGCAT_API_KEY`                  |
| API         | OpenAI 호환 Chat Completions       |
| 기본 URL    | `https://api.longcat.chat/openai`  |
| 모델        | `longcat/LongCat-2.0`              |
| 컨텍스트    | 1,048,576 토큰                     |
| 최대 출력   | 131,072 토큰                       |
| 입력        | 텍스트                             |

## Plugin 설치

공식 패키지를 설치한 다음 Gateway를 다시 시작하십시오.

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## 시작하기

<Steps>
  <Step title="API 키 생성">
    [LongCat API 플랫폼](https://longcat.chat/platform/)에 로그인하고
    [API Keys](https://longcat.chat/platform/api_keys) 페이지에서 키를
    생성하십시오.
  </Step>
  <Step title="온보딩 실행">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="모델 확인">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

기본 모델이 아직 구성되지 않은 경우 온보딩은 호스팅 카탈로그를 추가하고 `longcat/LongCat-2.0`을 선택합니다.

### 비대화형 설정

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## 추론 동작

LongCat은 이진 사고 제어를 제공합니다. OpenClaw는 활성화된 사고 수준을
`thinking: { type: "enabled" }`에 매핑하고 `/think off`를
`thinking: { type: "disabled" }`에 매핑합니다. 현재 LongCat은
`reasoning_effort`를 문서화하지 않으므로 OpenClaw는 이를 전송하지 않습니다.

LongCat은 `reasoning_content`에 추론을 반환합니다. OpenClaw는 어시스턴트의
도구 호출 턴을 재생할 때 이 필드를 유지하므로 다중 턴 에이전트 세션에서
제공업체가 기대하는 메시지 형식이 유지됩니다.

## 가격

내장 카탈로그는 토큰 100만 개당 USD 기준 LongCat의 종량제 정가를 사용합니다.
캐시되지 않은 입력은 $0.75, 캐시된 입력은 $0.015, 출력은 $2.95입니다. LongCat은
일시적인 할인을 제공할 수 있으며, [가격 페이지](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)와
사용자의 결제 기록이 최종 기준입니다.

## 자체 호스팅 LongCat-2.0

`longcat` 제공업체는 LongCat의 호스팅 API를 대상으로 합니다. [Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0)의
오픈 가중치를 사용하려면 OpenAI 호환 런타임을 통해 모델을 제공하고, 대신 OpenClaw의
기존 [vLLM](/ko/providers/vllm) 또는 [SGLang](/ko/providers/sglang) 제공업체를 사용하십시오.

자체 호스팅 제공업체 카탈로그에서 런타임의 정확한 모델 식별자를 유지하십시오.
로컬 배포를 `longcat/LongCat-2.0`을 통해 라우팅하지 마십시오.

## 문제 해결

<AccordionGroup>
  <Accordion title="셸에서는 키가 작동하지만 Gateway에서는 작동하지 않음">
    데몬으로 관리되는 Gateway 프로세스는 대화형 셸의 모든 변수를 상속하지 않습니다.
    `LONGCAT_API_KEY`를 `~/.openclaw/.env`에 넣거나 온보딩을 통해 구성하거나
    승인된 비밀 참조를 사용하십시오.
  </Accordion>

  <Accordion title="요청이 402 또는 429로 실패함">
    `402`는 계정의 토큰 할당량이 부족함을 의미합니다. `429`는 API 키가
    요청 속도 제한에 도달했음을 의미합니다. [LongCat 사용량](https://longcat.chat/platform/usage)을
    확인하고 제공업체의 백오프 기간이 지난 후 속도 제한된 요청을 다시 시도하십시오.
  </Accordion>

  <Accordion title="모델이 표시되지 않음">
    `openclaw plugins list`를 실행하여 `longcat` Plugin이 활성화되어 있는지
    확인한 다음 `openclaw models list --provider longcat`을 실행하십시오.
  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 제공업체" href="/ko/concepts/model-providers" icon="layers">
    제공업체 구성, 모델 참조 및 장애 조치 동작입니다.
  </Card>
  <Card title="LongCat API 문서" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    호스팅 API 엔드포인트, 인증, 제한 및 예시입니다.
  </Card>
  <Card title="LongCat-2.0 모델 카드" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    아키텍처, 배포 지침 및 모델 세부 정보입니다.
  </Card>
  <Card title="비밀" href="/ko/gateway/secrets" icon="key">
    일반 텍스트를 구성에 포함하지 않고 제공업체 자격 증명을 저장합니다.
  </Card>
</CardGroup>
