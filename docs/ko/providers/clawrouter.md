---
read_when:
    - 여러 모델 제공업체에 사용할 관리형 키 하나를 원합니다
    - OpenClaw에서 ClawRouter 모델 탐색 또는 할당량 보고가 필요합니다
summary: 자격 증명 범위가 지정된 모델을 ClawRouter를 통해 라우팅하고 관리형 할당량 표시
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T03:41:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter는 여러 업스트림 모델 공급자에 대해 OpenClaw에 정책 범위가 지정된 키 하나를 제공합니다. 번들된 Plugin은 해당 키에 허용된 모델만 검색하고, 각 모델을 선언된 프로토콜을 통해 라우팅하며, 키의 예산과 집계 사용량을 OpenClaw 사용량 화면에 보고합니다.

OpenClaw 호스트에 각 업스트림 공급자 Plugin을 설치하거나 인증하지 않아도 됩니다. 업스트림 자격 증명과 공급자별 전달은 ClawRouter에 유지됩니다. OpenClaw에는 번들된 `@openclaw/clawrouter` Plugin과 발급된 ClawRouter 자격 증명만 필요합니다.

| 속성          | 값                                       |
| ------------- | ---------------------------------------- |
| 공급자        | `clawrouter`                             |
| 패키지        | `@openclaw/clawrouter`                   |
| 인증          | `CLAWROUTER_API_KEY`                     |
| 기본 URL      | `https://clawrouter.openclaw.ai`         |
| 모델 카탈로그 | `/v1/catalog`를 통한 자격 증명 범위 지정 |
| 할당량        | `/v1/usage`를 통한 월간 예산 및 사용량   |

## 시작하기

<Steps>
  <Step title="범위가 지정된 자격 증명 받기">
    사용해야 하는 공급자, 모델, 월간 예산이 정책에 포함된 자격 증명을 ClawRouter 관리자에게 요청하세요. 자격 증명은 발급 시 한 번만 표시됩니다.
  </Step>
  <Step title="OpenClaw 구성하기">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    Plugin은 OpenClaw에 번들되어 있습니다. 구성에서 `plugins.allow`를 설정하는 경우 활성화하기 전에 해당 목록에 `clawrouter`를 추가하세요. 사용자 지정 배포의 경우 `models.providers.clawrouter.baseUrl`을 ClawRouter 원본으로 설정하세요. 기본값은 `https://clawrouter.openclaw.ai`입니다.

  </Step>
  <Step title="허용된 모델 나열하기">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    반환된 모델 참조를 표시된 그대로 사용하세요. 이 참조는 `clawrouter/openai/...`, `clawrouter/anthropic/...`, `clawrouter/google/...`와 같은 업스트림 네임스페이스를 유지합니다. 구성에서 `agents.defaults.models`가 허용 목록인 경우 선택한 각 ClawRouter 참조를 여기에 추가하세요.

  </Step>
  <Step title="모델 선택하기">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`를 사용하여 한 번의 실행에 대해 반환된 모델을 선택할 수도 있습니다.

  </Step>
</Steps>

## 모델 검색

`GET /v1/catalog`가 진실 공급원입니다. OpenClaw는 ClawRouter 모델의 두 번째 고정 목록을 제공하지 않습니다. ClawRouter에 구성된 모델은 다음 조건을 충족할 때 표시됩니다.

- 자격 증명의 정책이 해당 공급자를 허용합니다.
- 공급자 연결이 활성화되어 있고 준비되었습니다.
- 카탈로그 모델이 지원되는 LLM 기능을 알립니다.
- 카탈로그가 Plugin에서 지원하는 전송 계약을 노출합니다.

따라서 지원되는 ClawRouter 공급자에 다른 모델을 추가하는 데 OpenClaw 릴리스나 다른 공급자 Plugin이 필요하지 않습니다. 다음 카탈로그 새로 고침에서 이를 검색합니다. 새 와이어 프로토콜이 필요한 모델은 OpenClaw가 이를 표시하기 전에 ClawRouter Plugin에서 지원되어야 합니다.

## 프로토콜 및 공급자 Plugin

모든 업스트림 회사의 인증 Plugin을 설치할 필요는 없습니다. ClawRouter가 업스트림 자격 증명을 소유하며, 해당 카탈로그가 OpenClaw에 사용할 전송 방식을 알려줍니다. Plugin은 다음을 지원합니다.

| 카탈로그 경로                 | OpenClaw 전송          |
| ------------------------------ | ---------------------- |
| OpenAI 호환 채팅               | `openai-completions`   |
| OpenAI 호환 Responses          | `openai-responses`     |
| 네이티브 Anthropic Messages    | `anthropic-messages`   |
| 네이티브 Google Gemini 스트리밍 | `google-generative-ai` |

Plugin은 또한 해당 계열에 맞는 재생 및 도구 스키마 정책을 적용합니다. 다른 요청/스트림 형식을 사용하는 카탈로그 행은 의도적으로 OpenClaw 텍스트 모델로 표시되지 않습니다. 호환되지 않는 페이로드를 보내는 대신 해당 공급자를 ClawRouter에서 지원되는 계약 중 하나로 정규화하세요.

## 할당량 및 사용량

ClawRouter의 `/v1/usage` 응답은 일반 OpenClaw 공급자 사용량 화면에 제공됩니다. `/status` 및 관련 대시보드 상태는 키에 제한이 있을 때 월간 예산 기간과 요청, 토큰, 지출 합계를 표시합니다. 미터링되지 않는 키는 백분율 기간 없이도 집계 사용량을 계속 표시합니다.

할당량 조회는 모델 검색과 동일한 범위 지정 키를 사용합니다. 할당량 조회 실패는 모델 실행을 차단하지 않습니다.

라이브 스냅샷을 확인하려면 다음을 사용하세요.

```bash
openclaw status --usage
openclaw models status
```

동일한 공급자 스냅샷은 채팅의 `/status`와 OpenClaw의 사용량 UI에서도 사용할 수 있습니다. 예산은 정책 전체에 적용되므로 동일한 ClawRouter 정책을 사용하는 다른 클라이언트의 요청이 남은 백분율을 변경할 수 있습니다.

## 문제 해결

| 증상                                     | 확인 사항                                                                                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| ClawRouter 모델이 없음                   | Plugin이 활성화되어 있고 `plugins.allow`에서 허용되는지 확인한 다음, 자격 증명이 활성 상태이며 준비된 공급자를 하나 이상 허용하는지 확인하세요. |
| 구성된 ClawRouter 모델이 누락됨          | 해당 `/v1/catalog` 기능과 경로 형식을 검사하세요. 지원되지 않는 전송 계약은 의도적으로 필터링됩니다.                                             |
| `Unknown model: clawrouter/...`          | 해당 구성 맵이 허용 목록으로 사용되는 경우 정확한 카탈로그 참조를 `agents.defaults.models`에 추가하세요.                                        |
| 카탈로그 또는 사용량에서 `401` 또는 `403` | ClawRouter 자격 증명을 다시 발급하거나 범위를 다시 지정하세요. OpenClaw는 업스트림 공급자 키로 대체하지 않습니다.                               |
| 검색 후 모델 호출 실패                   | ClawRouter에서 공급자 연결과 업스트림 상태를 확인한 다음, 준비 상태가 복구된 후 다시 시도하세요.                                                |
| 사용량에 합계는 있지만 백분율이 없음     | 정책이 미터링되지 않습니다. 백분율 기간을 노출하려면 ClawRouter에 월간 예산을 추가하세요.                                                       |

## 보안 동작

- 카탈로그 검색은 구성된 프록시 키로 범위가 지정되며 키별로 캐시됩니다.
- 프록시 키는 요청 디스패치 시에만 연결되며 모델 메타데이터에 저장되지 않습니다.
- 네이티브 Anthropic 및 Gemini 모델 ID는 디스패치 시에만 업스트림 ID로 다시 작성됩니다.
- 지원되지 않거나 허용되지 않은 카탈로그 행은 닫힌 상태로 실패하며 선택할 수 없습니다.

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 공급자" href="/ko/concepts/model-providers" icon="layers">
    공급자 구성 및 모델 선택.
  </Card>
  <Card title="사용량 추적" href="/ko/concepts/usage-tracking" icon="chart-line">
    OpenClaw 사용량 및 상태 화면.
  </Card>
</CardGroup>
