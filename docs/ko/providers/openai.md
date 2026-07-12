---
read_when:
    - OpenClaw에서 OpenAI 모델을 사용하려고 합니다
    - API 키 대신 Codex 구독 인증을 사용하려고 합니다
    - 더 엄격한 GPT-5 에이전트 실행 동작이 필요합니다
summary: OpenClaw에서 API 키 또는 Codex 구독을 통해 OpenAI 사용하기
title: OpenAI
x-i18n:
    generated_at: "2026-07-12T15:37:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bc433abdf4fb8984430054acecdda3ba01b9795ad52cc89b19e10b09c6bcc8c3
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw는 직접 API 키 인증과 ChatGPT/Codex 구독 인증 모두에 하나의 제공자 ID인 `openai`를 사용합니다. `openai/*`는 표준 모델 경로입니다.
런타임 정책이 설정되지 않았거나 `auto`인 내장 에이전트 턴의 경우 OpenAI의 경로 정보에 따라 OpenClaw가 번들 Codex 앱 서버 런타임을 암시적으로 선택할 수 있는지가 결정됩니다. `openai/*` 접두사만으로는 런타임이 선택되지 않습니다.

- **에이전트 모델** - 명시적 `agentRuntime` 구성 또는 OpenAI의 암시적 경로 정책으로 선택된 런타임을 통해 `openai/*`를 사용합니다. ChatGPT/Codex 구독을 사용하려면 Codex 인증으로 로그인하고, 키 기반 청구를 원하면 API 키 인증 프로필을 구성하십시오.
- **에이전트 외 OpenAI API** - `OPENAI_API_KEY` 또는 `openai` API 키 인증 프로필을 통해 사용량에 따라 청구되는 OpenAI Platform 직접 액세스입니다.
- **레거시 구성** - 이전 Codex 모델 참조 및 프로필 ID는 `openclaw doctor --fix`에 의해 `openai/*`로 복구됩니다.

OpenAI는 OpenClaw와 같은 외부 도구 및 워크플로에서 구독 OAuth를 사용하는 것을 명시적으로 지원합니다.

## 사용량 및 비용 추적

OpenClaw는 구독 할당량과 Platform API 청구를 구분하여 관리합니다.

- ChatGPT/Codex OAuth에는 구독 요금제, 할당량 기간 및 크레딧 잔액이 표시됩니다.
- `OPENAI_ADMIN_KEY`를 사용하면 Control UI의 **사용량**에서 제공자가 보고한 30일간의 조직 비용과 완료 사용량을 확인할 수 있으며, 여기에는 일별 지출, 요청/토큰 합계, 상위 모델 및 비용 범주가 포함됩니다.
- `OPENAI_PROJECT_ID`를 사용하면 선택적으로 Admin API 기록 범위를 하나의 프로젝트로 제한할 수 있습니다.
- OpenClaw는 `OPENAI_API_KEY` 또는 `openai` 추론 프로필을 조직 API로 전송하지 않습니다. 이러한 자격 증명은 사용자 지정, Azure 또는 에이전트 로컬 엔드포인트에 속할 수 있습니다.

명시적 Admin 키가 OAuth보다 우선합니다. 제공자가 보고한 기록은 OpenClaw가 세션에서 산출한 예상 비용과 병합되지 않습니다. 이 기록에는 다른 클라이언트의 API 활동과 제공자 측 청구 조정이 포함될 수 있습니다.

OpenAI의 [API 사용량 대시보드](https://help.openai.com/en/articles/10478918) 문서에서는 사용량 데이터에 필요한 조직 소유자 권한과 명시적 Usage Dashboard 권한 요구 사항을 설명합니다.

제공자, 모델, 런타임 및 채널은 서로 별개의 계층입니다. 이러한 레이블이 혼동된다면 구성을 변경하기 전에 [에이전트 런타임](/ko/concepts/agent-runtimes)을 읽으십시오.

## 빠른 선택

| 목표                                              | 사용                                                               | 참고                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| ChatGPT/Codex 구독, 네이티브 Codex 런타임         | `openai/gpt-5.6-sol`                                               | 신규 구독 설정입니다. Codex 인증으로 로그인하십시오.               |
| 에이전트 턴에 대한 직접 API 키 청구               | `openai/gpt-5.6` 및 순서가 지정된 API 키 인증 프로필               | 신규 API 키 설정입니다. 기본 직접 API ID는 Sol로 해석됩니다.        |
| 정확한 GPT-5.6 티어 선택                          | `openai/gpt-5.6-sol`, `-terra` 또는 `-luna`                        | 이 계정에서 사용할 수 있는 티어는 `models list`에서 확인하십시오.   |
| GPT-5.6 액세스 권한이 없는 계정                   | `openai/gpt-5.5`                                                   | 명시적 복구 선택입니다. OpenClaw는 자동으로 다운그레이드하지 않습니다. |
| 직접 API 키 청구, 명시적 OpenClaw 런타임          | `openai/gpt-5.6` 및 제공자/모델 `agentRuntime.id: "openclaw"`      | 일반 `openai` API 키 프로필을 선택하십시오.                         |
| 최신 ChatGPT Instant 모델 별칭                    | `openai/chat-latest`                                               | 직접 API 키 전용입니다. 안정적인 기본값이 아닌 변경 가능한 별칭입니다. |
| 이미지 생성 또는 편집                             | `openai/gpt-image-2`                                               | `OPENAI_API_KEY` 또는 Codex OAuth와 함께 작동합니다.                 |
| 투명 배경 이미지                                  | `openai/gpt-image-1.5`                                             | `outputFormat`을 `png` 또는 `webp`로 설정하고 `background=transparent`를 사용하십시오. |

## 이름 매핑

| 표시되는 이름                           | 계층              | 의미                                                                                     |
| --------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | 제공자 접두사     | 표준 OpenAI 모델 경로이며, 경로 정보에 따라 암시적 런타임이 결정됩니다.                  |
| `codex` Plugin                          | Plugin            | 네이티브 Codex 앱 서버 런타임과 `/codex` 채팅 제어 기능을 제공하는 번들 Plugin입니다.   |
| 제공자/모델 `agentRuntime.id: codex`    | 에이전트 런타임   | 일치하는 내장 턴에 네이티브 Codex 앱 서버 하네스를 강제로 사용합니다.                   |
| `/codex ...`                            | 채팅 명령 집합    | 대화에서 Codex 앱 서버 스레드를 연결하고 제어합니다.                                    |
| `runtime: "acp", agentId: "codex"`      | ACP 세션 경로     | ACP/acpx를 통해 Codex를 실행하는 명시적 대체 경로입니다.                                |

## 암시적 에이전트 런타임

제공자/모델 `agentRuntime` 정책이 설정되지 않았거나 `auto`인 경우 OpenAI가 소유한 제공자 경로 정책은 유효한 엔드포인트와 어댑터를 바탕으로 암시적 런타임을 선택합니다.

| 유효한 경로 정보                                                                                                                                                       | 암시적 런타임       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| `openai-responses`를 사용하는 정확한 공식 Platform HTTPS 엔드포인트 또는 `openai-chatgpt-responses`를 사용하는 정확한 공식 ChatGPT HTTPS 엔드포인트이며, 작성된 요청 재정의가 없음 | Codex가 선택될 수 있음 |
| 작성된 `openai-completions` 어댑터                                                                                                                                    | OpenClaw            |
| 사용자 지정 엔드포인트                                                                                                                                                 | OpenClaw            |
| HTTP를 사용하는 명시적인 정확한 공식 엔드포인트                                                                                                                        | 거부됨              |
| 작성된 제공자/모델 요청 재정의가 있는 경로                                                                                                                             | OpenClaw            |

명시적인 비기본 제공자/모델 `agentRuntime.id`가 계속 우선합니다.
예를 들어 `agentRuntime.id: "openclaw"`는 원래 Codex를 사용할 수 있는 경로를 OpenClaw에 유지하는 반면, `agentRuntime.id: "codex"`는 Codex를 요구하며 유효한 경로가 Codex 호환으로 선언되지 않은 경우 안전하게 실패합니다.
런타임 선택은 자격 증명 유형이나 청구 방식을 변경하지 않습니다. Platform API 키 인증과 ChatGPT/Codex 구독 인증은 계속 구분됩니다.

`openclaw doctor --fix`는 레거시 Codex 모델 참조, 레거시 Codex 인증 프로필 ID 및 레거시 Codex 인증 순서 항목을 표준 `openai` 경로로 마이그레이션합니다. 새 인증 순서 구성에는 `auth.order.openai`를 사용하십시오.

<Note>
새 OpenAI 설정은 기본 모델이 구성되지 않은 경우에만 GPT-5.6을 기본 모델로 적용합니다. OpenAI 인증을 추가하거나 새로 고쳐도 명시적으로 선택한 기존 모델은 유지되며, `models auth login --set-default` 또는 `models set`을 명시적으로 사용하지 않는 한 `openai/gpt-5.5`도 유지됩니다. 에이전트 모델에 API 키 인증을 사용하려는 경우에만 API 키 인증 프로필을 사용하십시오.
</Note>

## GPT-5.6 제한적 프리뷰

OpenClaw는 정확한 `openai/gpt-5.6-sol`, `openai/gpt-5.6-terra` 및 `openai/gpt-5.6-luna` 모델 ID를 인식합니다. 현재 카탈로그에서 세 모델 모두 `xhigh` 및 `max` 추론을 제공합니다. OpenAI는 Sol을 플래그십 티어, Terra를 균형 잡힌 티어, Luna를 빠르고 비용이 저렴한 티어로 설명합니다. [GPT-5.6 출시 발표](https://openai.com/index/previewing-gpt-5-6-sol/) 및 [액세스 가이드](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna)를 참조하십시오.

직접 OpenAI API 키 인증을 사용하는 경우 기본 `openai/gpt-5.6` ID는 Sol의 별칭이며 신규 설정의 기본값입니다. 네이티브 Codex 카탈로그는 해당 직접 API 별칭을 클라이언트 측에 적용하지 않습니다. 워크스페이스 액세스 권한에 따라 정확한 Sol, Terra 및 Luna ID를 표시할 수 있습니다. 따라서 새 ChatGPT/Codex OAuth 설정은 `openai/gpt-5.6-sol`을 사용합니다. 다음 명령으로 현재 계정을 확인하십시오.

```bash
openclaw models list --provider openai
```

API 조직과 Codex 워크스페이스의 액세스 권한은 서로 다를 수 있습니다. GPT-5.6을 사용할 수 없다면 GPT-5.5를 명시적으로 선택하십시오.

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw는 업스트림 액세스 오류를 표시하며 GPT-5.6 선택을 GPT-5.5로 자동 대체하지 않습니다.

<Note>
런타임 정책이 설정되지 않았거나 `auto`인 경우 조건에 맞는 정확한 공식 HTTPS 경로는 번들 Codex 앱 서버 Plugin을 선택할 수 있습니다. 작성된 Completions 경로, 사용자 지정 엔드포인트 및 요청 전송 재정의는 OpenClaw에 유지됩니다. 평문 공식 HTTP 엔드포인트는 거부됩니다. 명시적 제공자/모델 런타임 구성이 계속 우선합니다. 명시적 런타임 구성에서 설정되지 않은 오래된 레거시 Codex 모델 참조, `codex-cli/*` 참조 또는 이전 런타임 세션 고정을 복구하려면 `openclaw doctor --fix`를 실행하십시오.
</Note>

## OpenClaw 기능 지원 범위

| OpenAI 기능                   | OpenClaw 표면                                                                                 | 상태                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 채팅 / Responses              | `openai/<model>` 모델 제공자                                                                  | 지원                                                               |
| Codex 구독 모델               | OpenAI OAuth를 사용하는 `openai/<model>`                                                      | 지원                                                               |
| 레거시 Codex 모델 참조        | 이전 Codex 모델 참조, `codex-cli/<model>`                                                     | doctor가 `openai/<model>`로 복구                                   |
| Codex app-server 하네스       | 런타임 미설정/`auto`인 Codex 호환 HTTPS 경로 또는 명시적 `agentRuntime.id: codex`              | 지원                                                               |
| 서버 측 웹 검색               | 네이티브 OpenAI Responses 도구                                                                | 웹 검색이 활성화되고 다른 제공자가 고정되지 않은 경우 지원         |
| 이미지                        | `image_generate`                                                                              | 지원                                                               |
| 동영상                        | `video_generate`                                                                              | 지원                                                               |
| 텍스트 음성 변환              | `messages.tts.provider: "openai"` / `tts`                                                     | 지원                                                               |
| 일괄 음성 텍스트 변환         | `tools.media.audio` / 미디어 이해                                                              | 지원                                                               |
| 스트리밍 음성 텍스트 변환     | Voice Call `streaming.provider: "openai"`                                                     | 지원                                                               |
| 실시간 음성                   | Voice Call `realtime.provider: "openai"` / Control UI Talk `talk.realtime.provider: "openai"` | 지원(OpenAI Platform API 키)                                       |
| 임베딩                        | 메모리 임베딩 제공자                                                                          | 지원                                                               |

<Note>
OpenAI 실시간 음성은 공개 **OpenAI Platform Realtime
API**를 통해 처리되며 Platform API 키가 필요합니다. 반면 Codex OAuth 토큰은
ChatGPT Codex 백엔드를 인증하며, 공개 Realtime 엔드포인트용 Platform API
키와 서로 바꿔 사용할 수 없습니다.

API 키 인증에서 결제 정보가 없다고 보고되면 API 키 인증을 사용할 때 실시간
자격 증명을 지원하는 조직의 Platform 크레딧을
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)에서
충전하십시오. 실시간 음성은 `openclaw onboard --auth-choice openai-api-key`로
생성한 `openai` API 키 인증 프로필, Control UI Talk의
`talk.realtime.providers.openai.apiKey`를 통해 설정한 Platform API 키,
Voice Call의 `plugins.entries.voice-call.config.realtime.providers.openai.apiKey`
또는 `OPENAI_API_KEY` 환경 변수를 허용합니다.
</Note>

## 메모리 임베딩

OpenClaw는 `memory_search` 인덱싱 및 쿼리 임베딩에 OpenAI 또는 OpenAI 호환
임베딩 엔드포인트를 사용할 수 있습니다.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

비대칭 임베딩 레이블이 필요한 OpenAI 호환 엔드포인트의 경우
`memorySearch` 아래에 `queryInputType`과 `documentInputType`을 설정하십시오.
OpenClaw는 이를 제공자별 `input_type` 요청 필드로 전달합니다. 쿼리
임베딩에는 `queryInputType`을 사용하고, 인덱싱된 메모리 청크와 일괄
인덱싱에는 `documentInputType`을 사용합니다. 전체 예시는
[메모리 구성 참조](/ko/reference/memory-config#provider-specific-config)를
확인하십시오.

## 시작하기

<Tabs>
  <Tab title="API 키(OpenAI Platform)">
    **적합한 용도:** 직접 API 액세스 및 사용량 기반 결제.

    <Steps>
      <Step title="API 키 가져오기">
        [OpenAI Platform 대시보드](https://platform.openai.com/api-keys)에서 API 키를 생성하거나 복사하십시오.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        또는 키를 직접 전달하십시오.

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 경로 요약

    | 모델 참조        | 런타임 정책 또는 경로 정보                                      | 경로                      | 인증                               |
    | ---------------- | --------------------------------------------------------------- | ------------------------- | ---------------------------------- |
    | `openai/gpt-5.6` | 미설정/`auto`, 정확한 공식 HTTPS 네이티브 경로, 요청 재정의 없음 | Codex가 선택될 수 있음     | 순서가 지정된 API 키 인증 프로필   |
    | `openai/gpt-5.6` | 제공자/모델 `agentRuntime.id: "openclaw"`                       | OpenClaw 내장 런타임       | 선택된 `openai` API 키 프로필      |
    | `openai/gpt-5.5` | 명시적 제공자/모델 `agentRuntime.id`                            | 선택된 에이전트 런타임     | 선택된 OpenAI API 키 프로필        |
    | `openai/*`       | 명시적으로 작성된 Completions, 사용자 지정 또는 요청 재정의     | OpenClaw 내장 런타임       | 자격 증명 유형은 변경되지 않음     |
    | `openai/*`       | 평문 공식 HTTP 엔드포인트                                       | 거부됨                     | 자격 증명을 전송하지 않음          |

    <Note>
    런타임이 설정되지 않았거나 `auto`인 경우 적격한 정확한 공식 HTTPS 네이티브
    경로만 Codex app-server 하네스를 암시적으로 선택할 수 있습니다. 에이전트
    모델에서 API 키 인증을 사용하려면 `openai` API 키 인증 프로필을 생성하고
    `auth.order.openai`로 순서를 지정하십시오. `OPENAI_API_KEY`는 에이전트가
    아닌 OpenAI API 표면의 직접 폴백으로 유지됩니다. 이전 레거시 Codex
    인증 순서 항목을 마이그레이션하려면 `openclaw doctor --fix`를 실행하십시오.
    </Note>

    ### 구성 예시

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    직접 API의 단순 `gpt-5.6` ID는 Sol 티어로 해석됩니다. 이 API 조직에서
    GPT-5.6을 제공하지 않는 경우 기본 모델을 `openai/gpt-5.5`로 명시적으로
    설정하십시오.

    OpenAI API에서 ChatGPT의 현재 Instant 모델을 사용해 보려면 모델을
    `openai/chat-latest`로 설정하십시오.

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest`는 변동되는 별칭입니다. 새로운 OpenAI API 키 설정에서는
    대신 `openai/gpt-5.6`을 사용하며, 이 모델의 직접 API 단순 ID는 Sol로
    해석됩니다. `openai/gpt-5.5`를 포함한 기존의 명시적 기본 모델은 변경되지
    않습니다. `chat-latest` 별칭은 `medium` 텍스트 상세도만 허용합니다.
    OpenClaw는 이 모델에 요청된 다른 모든 상세도를 `medium`으로 강제합니다.

    <Warning>
    OpenClaw는 직접 OpenAI API 키 경로에서 `gpt-5.3-codex-spark`를
    제공하지 **않습니다**. 로그인한 계정에서 해당 모델을 제공하는 경우에만
    Codex 구독 카탈로그 항목을 통해 사용할 수 있습니다.
    </Warning>

  </Tab>

  <Tab title="Codex 구독">
    **적합한 용도:** 별도의 API 키 대신 ChatGPT/Codex 구독을 사용하여
    네이티브 Codex app-server를 실행합니다. Codex 클라우드에는 ChatGPT
    로그인이 필요합니다.

    <Steps>
      <Step title="Codex OAuth 실행">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        또는 OAuth를 직접 실행하십시오.

        ```bash
        openclaw models auth login --provider openai
        ```

        헤드리스 환경이나 콜백을 사용하기 어려운 설정에서는 `--device-code`를
        추가하여 localhost 브라우저 콜백 대신 ChatGPT 기기 코드 흐름으로
        로그인하십시오.

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="표준 OpenAI 모델 경로 사용">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        이 정확한 공식 HTTPS 네이티브 경로에는 런타임 구성이 필요하지 않습니다.
        Codex app-server 런타임이 자동으로 선택될 수 있으며, 해당 런타임이
        선택되면 OpenClaw가 번들 Codex Plugin을 설치하거나 복구합니다.
      </Step>
      <Step title="Codex 인증 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider openai
        ```

        Gateway가 실행된 후 채팅에서 `/codex status` 또는 `/codex models`를
        전송하여 네이티브 app-server 런타임을 확인하십시오.
      </Step>
    </Steps>

    ### 경로 요약

    | 모델 참조                | 런타임 정책 또는 경로 정보                                      | 경로                                                       | 인증                                                  |
    | ------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | 미설정/`auto`, 정확한 공식 HTTPS 네이티브 경로, 요청 재정의 없음 | Codex가 선택될 수 있음                                      | Codex 로그인 또는 순서가 지정된 `openai` 인증 프로필  |
    | `openai/gpt-5.6-terra`   | 미설정/`auto`, 정확한 공식 HTTPS 네이티브 경로, 요청 재정의 없음 | Codex가 선택될 수 있음                                      | 카탈로그에서 Terra를 제공할 때 Codex 로그인           |
    | `openai/gpt-5.6-luna`    | 미설정/`auto`, 정확한 공식 HTTPS 네이티브 경로, 요청 재정의 없음 | Codex가 선택될 수 있음                                      | 카탈로그에서 Luna를 제공할 때 Codex 로그인            |
    | `openai/gpt-5.6-sol`     | 제공자/모델 `agentRuntime.id: "openclaw"`                       | OpenClaw 내장 런타임, 내부 Codex 인증 전송                  | 선택된 `openai` OAuth 프로필                           |
    | `openai/gpt-5.5`         | 명시적 제공자/모델 `agentRuntime.id`                            | 선택된 에이전트 런타임                                      | 선택된 OpenAI 인증 프로필                              |
    | `openai/*`               | 명시적으로 작성된 Completions, 사용자 지정 또는 요청 재정의     | OpenClaw 내장 런타임                                        | 자격 증명 요구 사항은 경로별로 유지됨                  |
    | `openai/*`               | 평문 공식 HTTP 엔드포인트                                       | 거부됨                                                      | 자격 증명을 전송하지 않음                              |
    | 레거시 Codex GPT-5.5 참조 | doctor가 복구                                                   | `openai/gpt-5.5`로 다시 작성                                | 마이그레이션된 OpenAI OAuth 프로필                     |
    | `codex-cli/gpt-5.5`      | doctor가 복구                                                   | `openai/gpt-5.5`로 다시 작성                                | Codex app-server 인증                                  |

    <Warning>
    새로운 구독 기반 설정에서는 정확히 `openai/gpt-5.6-sol`을 사용합니다.
    네이티브 Codex 카탈로그에서 정확한 Terra 또는 Luna 참조를 제공할 수도 있습니다.
    계정에서 GPT-5.6을 제공하지 않으면 `openai/gpt-5.5`를 명시적으로 선택하십시오. 이전
    Codex GPT 참조는 네이티브 Codex 런타임 경로가 아니라 레거시 OpenClaw 경로입니다.
    기존의 명시적인 GPT-5.5 선택을 업그레이드하지 않고 마이그레이션하려면
    `openclaw doctor --fix`를 실행하십시오. `gpt-5.3-codex-spark`는 Codex 구독
    카탈로그에서 이를 제공한다고 명시된 계정으로 계속 제한되며, 이에 대한 직접 OpenAI
    API 키 및 Azure 참조는 계속 표시되지 않습니다.
    </Warning>

    <Note>
    새 구성에서는 OpenAI 에이전트 인증 순서를 `auth.order.openai` 아래에 배치해야 합니다.
    doctor는 이전 레거시 Codex 인증 순서 항목을 마이그레이션합니다.
    </Note>

    ### 구성 예시

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    API 키 백업을 사용하는 경우 선택한 모델을 `openai/*` 아래에 유지하고 인증 순서를
    `openai` 아래에 배치하십시오. OpenClaw는 Codex 하네스를 유지하면서 구독을 먼저
    시도한 다음 API 키를 시도합니다.

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    온보딩에서는 더 이상 `~/.codex`의 OAuth 자료를 가져오지 않습니다. 브라우저
    OAuth(기본값) 또는 위의 디바이스 코드 흐름으로 로그인하십시오. OpenClaw는 생성된
    자격 증명을 자체 에이전트 인증 저장소에서 관리합니다.
    </Note>

    ### Codex OAuth 라우팅 확인 및 복구

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    특정 에이전트의 경우 `--agent <id>`를 추가하십시오.

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    이전 구성에 레거시 Codex GPT 참조가 여전히 있거나 명시적인 런타임 구성 없이 오래된
    OpenAI 런타임 세션 고정이 남아 있으면 다음과 같이 복구하십시오.

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai`에 사용할 수 있는 프로필이 표시되지 않으면 다시
    로그인하십시오.

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    동일한 에이전트에서 여러 Codex OAuth 로그인을 사용하려면 `--profile-id`를 사용한
    다음 인증 순서 또는 `/model ...@<profileId>`를 통해 제어하십시오.

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    프로필 순서에 의존하기 전에 `openclaw doctor --fix`를 실행하여 이전 레거시 OpenAI
    Codex 접두사 프로필 ID와 순서 항목을 마이그레이션하십시오.

    ### 상태 표시기

    채팅의 `/status`에는 현재 세션에서 활성화된 모델 런타임이 표시됩니다. 적합한 암시적
    경로나 명시적인 공급자/모델 런타임 정책에서 번들 Codex 앱 서버 하네스를 선택하면
    `Runtime: OpenAI Codex`로 표시됩니다.

    ### Doctor 경고

    레거시 Codex 모델 참조 또는 오래된 OpenAI 런타임 고정이 구성이나 세션 상태에 남아
    있으면 OpenClaw가 명시적으로 구성된 경우를 제외하고 `openclaw doctor --fix`가
    Codex 런타임을 사용하는 `openai/*`로 다시 작성합니다.

    ### 컨텍스트 창 상한

    OpenClaw는 모델 메타데이터와 런타임 컨텍스트 상한을 별도의 값으로 취급합니다.
    Codex OAuth 카탈로그를 통한 `openai/gpt-5.5`의 경우:

    - 네이티브 `contextWindow`: `400000`
    - 기본 런타임 `contextTokens` 상한: `272000`

    실제 사용 시 더 작은 기본 상한이 지연 시간과 품질 측면에서 더 나은 특성을
    보입니다. `contextTokens`로 재정의하십시오.

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    네이티브 모델 메타데이터를 선언하려면 `contextWindow`를 사용하십시오. 런타임
    컨텍스트 예산을 제한하려면 `contextTokens`를 사용하십시오. 직접 OpenAI API 키
    경로는 `gpt-5.5`에 대해 더 큰 네이티브 `contextWindow`(`1000000`)를 보고합니다.
    업스트림 카탈로그가 다르므로 두 경로는 별도로 추적됩니다.
    </Note>

    ### 카탈로그 복구

    OpenClaw는 `gpt-5.5`가 존재할 때 업스트림 Codex 카탈로그 메타데이터를 사용합니다.
    계정이 인증된 상태에서 실시간 Codex 검색 결과에 `gpt-5.5` 행이 없으면 OpenClaw가
    해당 OAuth 모델 행을 합성하여 Cron, 하위 에이전트 및 구성된 기본 모델 실행이
    `Unknown model` 오류로 실패하지 않도록 합니다.

  </Tab>
</Tabs>

## 네이티브 Codex 앱 서버 인증

네이티브 Codex 앱 서버 하네스는 적합한 정확한 공식 HTTPS 경로에서 암시적으로 선택하거나
공급자/모델의 `agentRuntime.id: "codex"`에서 명시적으로 선택할 때 `openai/*` 모델
참조를 사용합니다. 인증은 여전히 계정 기반입니다. OpenClaw는 다음 순서로 인증을
선택합니다.

1. 에이전트에 대해 순서가 지정된 OpenAI 인증 프로필이며, 가급적
   `auth.order.openai` 아래에 배치합니다. 이전 레거시 Codex 인증 프로필 ID와 인증
   순서를 마이그레이션하려면 `openclaw doctor --fix`를 실행하십시오.
2. 로컬 Codex CLI ChatGPT 로그인과 같은 앱 서버의 기존 계정입니다. 격리된 기본
   에이전트 홈의 경우 OpenClaw는 로그인 RPC를 통해 해당 네이티브 CLI 계정을 앱
   서버에 연결합니다. CLI의 구성, Plugin 또는 스레드 저장소는 공유하지 않습니다.
3. 로컬 stdio 앱 서버 실행에만 적용되며 앱 서버가 계정이 없다고 보고하는 경우에만
   `CODEX_API_KEY`, 그다음 `OPENAI_API_KEY`를 사용합니다.

Gateway 프로세스에 직접 OpenAI 모델이나 임베딩을 위한 `OPENAI_API_KEY`도 있다는
이유만으로 로컬 ChatGPT/Codex 구독 로그인이 대체되지는 않습니다. 환경 변수 API 키
대체 경로는 로컬 stdio 무계정 경로에만 적용되며 WebSocket 앱 서버 연결을 통해서는
절대 전송되지 않습니다. 구독 방식의 Codex 프로필을 선택하면 OpenClaw는 생성된 stdio
앱 서버 자식 프로세스에 `CODEX_API_KEY`와 `OPENAI_API_KEY`를 전달하지 않고, 대신
선택한 자격 증명을 앱 서버 로그인 RPC를 통해 전송합니다.

Codex 사용량 제한으로 해당 구독 프로필이 차단되면 OpenClaw는 Codex가 알린 재설정
시간까지 프로필을 차단된 것으로 표시하며, 선택한 모델을 변경하거나 Codex 하네스에서
이탈하지 않고 인증 순서에 따라 다음 `openai:*` 프로필로 전환합니다. 재설정 시간이
지나면 구독 프로필을 다시 사용할 수 있습니다.

## 이미지 생성

번들 `openai` Plugin은 `image_generate` 도구를 통해 이미지 생성을 등록합니다. 동일한
`openai/gpt-image-2` 모델 참조를 통해 OpenAI API 키 및 Codex OAuth 이미지 생성을
모두 지원합니다.

| 기능                      | OpenAI API 키                       | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 모델 참조                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 인증                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 로그인            |
| 전송 방식                 | OpenAI Images API                  | Codex Responses 백엔드               |
| 요청당 최대 이미지 수     | 4                                  | 4                                    |
| 편집 모드                 | 활성화됨(참조 이미지 최대 5개)     | 활성화됨(참조 이미지 최대 5개)       |
| 크기 재정의               | 2K/4K 크기를 포함하여 지원됨       | 2K/4K 크기를 포함하여 지원됨         |
| 종횡비/해상도             | OpenAI Images API에 전달하지 않음  | 안전한 경우 지원되는 크기로 매핑됨   |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
공유 도구 매개변수, 공급자 선택 및 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을
참조하십시오.
</Note>

`gpt-image-2`는 OpenAI 텍스트-이미지 생성 및 이미지 편집의 기본값입니다.
`gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`도 명시적인 모델 재정의로 계속
사용할 수 있습니다. 투명 배경 PNG/WebP 출력을 사용하려면
`openai/gpt-image-1.5`를 사용하십시오. 현재 `gpt-image-2` API는
`background: "transparent"`를 거부합니다.

투명 배경 요청의 경우 `model: "openai/gpt-image-1.5"`,
`outputFormat: "png"` 또는 `"webp"`, `background: "transparent"`를 지정하여
`image_generate`를 호출하십시오. 이전 `openai.background` 공급자 옵션도 계속
허용됩니다. OpenClaw는 또한 기본 `openai/gpt-image-2` 투명 배경 요청을
`gpt-image-1.5`로 다시 작성하여 공개 OpenAI 및 OpenAI Codex OAuth 경로를
보호합니다. Azure 및 사용자 지정 OpenAI 호환 엔드포인트에서는 구성된 배포/모델 이름을
유지합니다.

헤드리스 CLI 실행에서도 동일한 설정을 사용할 수 있습니다.

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "투명한 배경의 단순한 빨간색 원형 스티커" \
  --json
```

입력 파일에서 시작하는 경우 `openclaw infer image edit`에도 동일한
`--output-format` 및 `--background` 플래그를 사용하십시오.
`--openai-background`는 OpenAI 전용 별칭으로 계속 사용할 수 있습니다. OpenAI
Images 품질과 비용을 제어하려면 `--quality low|medium|high|auto`를 사용하십시오.
`image generate` 또는 `image edit`에서 OpenAI의 검토 힌트를 전달하려면
`--openai-moderation low|auto`를 사용하십시오.

ChatGPT/Codex OAuth 설치에서는 동일한 `openai/gpt-image-2` 참조를 유지하십시오.
`openai` OAuth 프로필이 구성된 경우 OpenClaw는 저장된 OAuth 액세스 토큰을 확인하고
Codex Responses 백엔드를 통해 이미지 요청을 전송합니다. 먼저 `OPENAI_API_KEY`를
시도하거나 API 키로 자동 대체하지 않습니다. 직접 OpenAI Images API 경로를 사용하려면
API 키, 사용자 지정 기본 URL 또는 Azure 엔드포인트를 사용하여
`models.providers.openai`를 명시적으로 구성하십시오. 해당 사용자 지정 이미지
엔드포인트가 신뢰할 수 있는 LAN/비공개 주소에 있으면
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`도 설정하십시오. 이
명시적 동의가 없으면 OpenClaw는 비공개/내부 OpenAI 호환 이미지 엔드포인트를 계속
차단합니다.

생성:

```
/tool image_generate model=openai/gpt-image-2 prompt="macOS용 OpenClaw의 세련된 출시 포스터" size=3840x2160 count=1
```

투명 PNG 생성:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="투명한 배경의 단순한 빨간색 원형 스티커" outputFormat=png background=transparent
```

편집:

```
/tool image_generate model=openai/gpt-image-2 prompt="객체의 형태를 유지하고 재질을 반투명 유리로 변경" image=/path/to/reference.png size=1024x1536
```

## 동영상 생성

번들 `openai` Plugin은 `video_generate` 도구를 통해 동영상 생성을 등록합니다.

| 기능             | 값                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------- |
| 기본 모델        | `openai/sora-2`                                                                    |
| 모드             | 텍스트-동영상, 이미지-동영상, 단일 동영상 편집                                    |
| 참조 입력        | 이미지 1개 또는 동영상 1개                                                        |
| 크기 재정의      | 텍스트-동영상 및 이미지-동영상에서 지원됨                                         |
| 종횡비           | 원시 값으로 전달하지 않고 가장 가까운 지원 크기로 변환됨                          |
| 기타 재정의      | `resolution`, `audio`, `watermark`는 지원되지 않으며 도구 경고와 함께 삭제됨      |

OpenAI 이미지-동영상 요청은 이미지 `input_reference`와 함께 `POST /v1/videos`를
사용합니다. 단일 동영상 편집은 업로드된 동영상을 `video` 필드에 넣어
`POST /v1/videos/edits`를 사용합니다.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
공유 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [동영상 생성](/ko/tools/video-generation)을 참조하십시오.

OpenAI 제공자는 `supportsSize`를 선언하지만 `supportsAspectRatio` 또는
`supportsResolution`은 선언하지 않습니다. OpenClaw의 공유 정규화 계층은 요청된
`aspectRatio`를 요청이 제공자에 도달하기 전에 가장 근접한 OpenAI `size`로
변환하므로, 화면 비율 요청은 일반적으로 계속 작동합니다.
`resolution`에는 크기 대체 값이 없으므로 삭제되며, 호출자에게
`Ignored unsupported overrides for openai/<model>: resolution=<value>`로
표시됩니다.
</Note>

## GPT-5 프롬프트 기여

OpenClaw는 `openai` 제공자의 GPT-5 계열 모델에 공유 GPT-5 프롬프트 기여를
추가합니다(`openai/*`로 정규화되는 복구 전 레거시 Codex 참조 포함).
OpenRouter 또는 opencode 경로처럼 GPT-5 계열 모델 ID도 제공하는 다른
제공자에는 이 오버레이가 적용되지 않습니다. 모델 ID만이 아니라 제공자 ID
`openai`를 기준으로 제한되기 때문입니다. 이전 GPT-4.x 모델에는 절대
적용되지 않습니다.

네이티브 Codex 앱 서버 하네스는 개발자 지침을 통해 페르소나/도구 규율 동작
계약이나 친근한 상호 작용 스타일 오버레이를 받지 않습니다. 네이티브 Codex는
Codex가 소유하는 기본 동작, 모델 및 프로젝트 문서 동작을 유지하며, OpenClaw는
네이티브 스레드에서 Codex의 내장 성격을 비활성화하여 에이전트 작업 공간의
성격 파일이 계속 권위 있는 기준이 되도록 합니다. OpenClaw는 네이티브 Codex
스레드에 런타임 컨텍스트만 제공합니다. 여기에는 채널 전달, OpenClaw 동적 도구,
ACP 위임, 작업 공간 컨텍스트 및 OpenClaw Skills가 포함됩니다. 동일한 기여의
Heartbeat 안내 텍스트는 유일한 예외입니다. 네이티브 Codex Heartbeat 턴에는
이 텍스트가 적용되며, 공유 프롬프트 기여 훅을 통하지 않고 전용 협업 지침으로
주입됩니다.

GPT-5 기여는 일치하는 OpenClaw 조립 프롬프트에 페르소나 지속성, 실행 안전성,
도구 규율, 출력 형식, 완료 확인 및 검증을 위한 태그 지정 동작 계약을 추가합니다.
채널별 응답 및 무응답 메시지 동작은 공유 OpenClaw 시스템 프롬프트와 발신 전달
정책에 유지됩니다. 친근한 상호 작용 스타일 계층은 별도이며 구성할 수 있습니다.

| 값                     | 효과                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (기본값)  | 친근한 상호 작용 스타일 계층을 활성화합니다 |
| `"on"`                 | `"friendly"`의 별칭입니다                 |
| `"off"`                | 친근한 스타일 계층만 비활성화합니다       |

<Tabs>
  <Tab title="구성">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
런타임에서 값은 대소문자를 구분하지 않으므로 `"Off"`와 `"off"` 모두 친근한
스타일 계층을 비활성화합니다.
</Tip>

<Note>
공유 `agents.defaults.promptOverlays.gpt5.personality` 설정이 지정되지 않은
경우, 레거시 `plugins.entries.openai.config.personality`를 호환성 대체 값으로
계속 읽습니다.
</Note>

## 음성 및 발화

<AccordionGroup>
  <Accordion title="음성 합성(TTS)">
    번들 `openai` Plugin은 `messages.tts` 표면에 음성 합성을 등록합니다.

    | 설정          | 구성 경로                                               | 기본값                                   |
    | ------------- | ------------------------------------------------------- | ---------------------------------------- |
    | 모델          | `messages.tts.providers.openai.model`                   | `gpt-4o-mini-tts`                        |
    | 음성          | `messages.tts.providers.openai.speakerVoice`            | `coral`                                  |
    | 속도          | `messages.tts.providers.openai.speed`                   | (설정되지 않음)                          |
    | 지침          | `messages.tts.providers.openai.instructions`            | (설정되지 않음, `gpt-4o-mini-tts`만 해당) |
    | 형식          | `messages.tts.providers.openai.responseFormat`          | 음성 메모는 `opus`, 파일은 `mp3`         |
    | API 키        | `messages.tts.providers.openai.apiKey`                  | `OPENAI_API_KEY`로 대체                  |
    | 기본 URL      | `messages.tts.providers.openai.baseUrl`                 | `https://api.openai.com/v1`              |
    | 추가 본문     | `messages.tts.providers.openai.extraBody` / `extra_body` | (설정되지 않음)                         |

    사용 가능한 모델: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. 사용 가능한 음성:
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody`는 OpenClaw가 생성한 필드 뒤에 `/audio/speech` 요청 JSON으로
    병합되므로, `lang`과 같은 추가 키가 필요한 OpenAI 호환 엔드포인트에
    사용하십시오. 프로토타입 키는 무시됩니다.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    채팅 API 엔드포인트에 영향을 주지 않고 TTS 기본 URL을 재정의하려면
    `OPENAI_TTS_BASE_URL`을 설정하십시오. OpenAI TTS와 Realtime 음성은 모두
    OpenAI Platform API 키를 통해 구성됩니다. OAuth 전용 설치에서도 Codex 기반
    채팅 모델은 사용할 수 있지만 OpenAI 실시간 음성 응답은 사용할 수 없습니다.
    </Note>

  </Accordion>

  <Accordion title="음성-텍스트 변환">
    번들 `openai` Plugin은 OpenClaw의 미디어 이해 전사 표면을 통해 일괄
    음성-텍스트 변환을 등록합니다.

    - 기본 모델: `gpt-4o-transcribe`
    - 엔드포인트: OpenAI REST `/v1/audio/transcriptions`
    - 입력 경로: 멀티파트 오디오 파일 업로드
    - Discord 음성 채널 세그먼트와 채널 오디오 첨부 파일을 포함하여 수신 오디오
      전사가 `tools.media.audio`를 읽는 모든 곳에서 사용됩니다

    수신 오디오 전사에 OpenAI를 강제로 사용하려면 다음과 같이 설정합니다.

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    공유 오디오 미디어 구성 또는 호출별 전사 요청에서 언어 및 프롬프트 힌트가
    제공되면 OpenAI로 전달됩니다.

  </Accordion>

  <Accordion title="실시간 전사">
    번들 `openai` Plugin은 Voice Call Plugin에 실시간 전사를 등록합니다.

    | 설정            | 구성 경로                                                            | 기본값                    |
    | --------------- | -------------------------------------------------------------------- | ------------------------- |
    | 모델            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe`       |
    | 언어            | `...openai.language`                                                 | (설정되지 않음)           |
    | 프롬프트        | `...openai.prompt`                                                   | (설정되지 않음)           |
    | 무음 지속 시간  | `...openai.silenceDurationMs`                                        | `800`                     |
    | VAD 임계값      | `...openai.vadThreshold`                                             | `0.5`                     |
    | 인증            | `...openai.apiKey`, `OPENAI_API_KEY` 또는 `openai` API 키 프로필     | Platform API 키가 필요함  |

    <Note>
    G.711 μ-law(`g711_ulaw` / `audio/pcmu`) 오디오를 사용하는
    `wss://api.openai.com/v1/realtime` WebSocket 연결을 사용합니다. `openai`
    API 키 프로필의 경우 Gateway는 WebSocket을 열기 전에 임시 Realtime 전사
    클라이언트 비밀을 발급합니다. 이 스트리밍 제공자는 Voice Call의 실시간 전사
    경로용입니다. Discord 음성은 현재 짧은 세그먼트를 녹음하고 대신 일괄
    `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="실시간 음성">
    번들 `openai` Plugin은 Voice Call Plugin에 실시간 음성을 등록합니다.

    | 설정                                   | 구성 경로                                                               | 기본값                         |
    | -------------------------------------- | ----------------------------------------------------------------------- | ------------------------------ |
    | 모델                                   | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`             |
    | 음성                                   | `...openai.voice`                                                       | `alloy`                        |
    | 온도(Azure 배포 브리지)                | `...openai.temperature`                                                 | `0.8`                          |
    | VAD 임계값                             | `...openai.vadThreshold`                                                | `0.5`                          |
    | 무음 지속 시간                         | `...openai.silenceDurationMs`                                           | `500`                          |
    | 접두부 패딩                            | `...openai.prefixPaddingMs`                                             | `300`                          |
    | 추론 수준                              | `...openai.reasoningEffort`                                             | (설정되지 않음)                |
    | 인증                                   | `openai` API 키 프로필, `...openai.apiKey` 또는 `OPENAI_API_KEY`       | OpenAI Platform API 키가 필요함 |

    `gpt-realtime-2.1`에서 사용 가능한 내장 Realtime 음성: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI는 최상의 Realtime 품질을 위해 `marin`과 `cedar`를 권장합니다. 이는
    위의 텍스트-음성 변환 음성과는 별개의 집합입니다. `fable`, `nova` 또는
    `onyx`와 같은 TTS 전용 음성은 Realtime 세션에서 유효하지 않습니다.
    더 작고 저렴한 Realtime 2.1 변형을 선호하는 경우 모델을
    `gpt-realtime-2.1-mini`로 명시적으로 설정하십시오.

    <Note>
    **GPT-Live(출시 예정).** OpenAI의 전이중 `gpt-live-1` 및
    `gpt-live-1-mini` 모델은 2026년 7월 ChatGPT 음성 모드를 대체했으며,
    개발자 API는 얼리 액세스 조직에 순차적으로 제공되고 있습니다. OpenClaw는
    이 모델 계열을 인식하지만 아직 실행하지 않습니다. GPT-Live 세션은
    WebRTC 전용이고 자체적으로 턴 전환을 관리하며(VAD 없음), OpenClaw의 실시간
    전송 계층이 아직 구현하지 않은 핸드오프 이벤트 프로토콜을 통해 에이전트
    작업을 위임합니다. `gpt-live-*` 모델을 구성하면 에이전트 액세스 없이
    오디오에 자동 연결하는 대신 WebSocket 브리지와 Talk 브라우저 세션 모두에
    대한 안내와 함께 안전하게 실패합니다. 얼리 액세스 기간에는 API 액세스도
    OpenAI 조직별로 제한됩니다. GPT-Live 지원이 제공될 때까지
    `gpt-realtime-2.1`(기본값)을 유지하십시오.
    </Note>

    <Note>
    백엔드 OpenAI 실시간 브리지는 `session.temperature`를 허용하지 않는 GA
    Realtime WebSocket 세션 형식을 사용합니다. Azure OpenAI 배포는
    `azureEndpoint` 및 `azureDeployment`를 통해 계속 사용할 수 있으며
    `temperature`를 포함한 배포 호환 세션 형식을 유지합니다. 양방향 도구 호출과
    G.711 μ-law 오디오를 지원합니다.
    </Note>

    <Note>
    실시간 음성은 세션이 생성될 때 선택됩니다. OpenAI는 대부분의 세션 필드를
    나중에 변경할 수 있도록 허용하지만, 해당 세션에서 모델이 오디오를 출력한
    후에는 음성을 변경할 수 없습니다. OpenClaw는 현재 내장 Realtime 음성 ID를
    문자열로 노출합니다.
    </Note>

    <Note>
    Control UI Talk은 Gateway가 발급한 임시 클라이언트 비밀과
    OpenAI Realtime API를 상대로 한 브라우저의 직접 WebRTC SDP 교환을 통해
    OpenAI 브라우저 실시간 세션을 사용합니다. Gateway는 선택된 `openai`
    자격 증명으로 해당 클라이언트 비밀을 발급합니다. 구성된 키, API 키 프로필,
    `OPENAI_API_KEY`가 우선하며, `openai` OAuth 프로필 또는 외부
    Codex 로그인이 대체 수단입니다. Gateway 릴레이와 Voice Call 백엔드 실시간
    WebSocket 브리지는 네이티브 OpenAI 엔드포인트에 동일한 자격 증명 순서를 사용합니다.
    유지관리자는
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`로
    실시간 검증을 수행할 수 있습니다. OpenAI 구간은 비밀을 기록하지 않고
    백엔드 WebSocket 브리지와 브라우저 WebRTC SDP 교환을 모두 검증합니다.
    Google 자격 증명 없이 이 두 구간을 실행하려면 `--openai-only`를 전달하십시오.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 엔드포인트

번들 `openai` 제공자는 기본 URL을 재정의하여 이미지 생성을 Azure OpenAI
리소스로 지정할 수 있습니다. 이미지 생성 경로에서 OpenClaw는
`models.providers.openai.baseUrl`의 Azure 호스트 이름을 감지하고
Azure 요청 형식으로 자동 전환합니다.

<Note>
실시간 음성은 별도의 구성 경로
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)를
사용하며 `models.providers.openai.baseUrl`의 영향을 받지 않습니다. Azure
설정은 [음성 및 말하기](#voice-and-speech)의 **실시간 음성** 아코디언을
참조하십시오.
</Note>

다음과 같은 경우 Azure OpenAI를 사용하십시오.

- Azure OpenAI 구독, 할당량 또는 엔터프라이즈 계약이 이미 있는 경우
- Azure가 제공하는 지역별 데이터 상주 또는 규정 준수 제어가 필요한 경우
- 기존 Azure 테넌시 내부에서 트래픽을 유지하려는 경우

### 구성

번들 `openai` 제공자를 통해 Azure 이미지 생성을 사용하려면
`models.providers.openai.baseUrl`이 Azure 리소스를 가리키도록 하고
`apiKey`를 Azure OpenAI 키(OpenAI Platform 키가 아님)로 설정하십시오.

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw는 Azure 이미지 생성 경로에서 다음 Azure 호스트 접미사를
인식합니다.

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

인식된 Azure 호스트에 대한 이미지 생성 요청에서 OpenClaw는 다음과 같이
작동합니다.

- `Authorization: Bearer` 대신 `api-key` 헤더를 전송합니다.
- 배포 범위 경로(`/openai/deployments/{deployment}/...`)를 사용합니다.
- 각 요청에 `?api-version=...`을 추가합니다.
- Azure 이미지 생성 호출에 600s의 기본 요청 제한 시간을 사용합니다.
  호출별 `timeoutMs` 값은 여전히 이 기본값보다 우선합니다.

그 밖의 기본 URL(공개 OpenAI, OpenAI 호환 프록시)은 표준 OpenAI 이미지
요청 형식을 유지합니다.

<Note>
`openai` 제공자의 이미지 생성 경로에 대한 Azure 라우팅에는
OpenClaw 2026.4.22 이상이 필요합니다. 이전 버전은 사용자 지정
`openai.baseUrl`을 공개 OpenAI 엔드포인트처럼 취급하므로 Azure 이미지
배포에서 실패합니다.
</Note>

### API 버전

Azure 이미지 생성 경로에 특정 Azure 미리 보기 또는 GA 버전을 고정하려면
`AZURE_OPENAI_API_VERSION`을 설정하십시오.

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

변수가 설정되지 않은 경우 기본값은 `2024-12-01-preview`입니다.

### 모델 이름은 배포 이름입니다

Azure OpenAI는 모델을 배포에 연결합니다. 번들 `openai` 제공자를 통해
라우팅되는 Azure 이미지 생성 요청에서는 OpenClaw의 `model` 필드가 공개
OpenAI 모델 ID가 아니라 Azure 포털에서 구성한 **Azure 배포 이름**이어야
합니다.

`gpt-image-2`를 제공하는 `gpt-image-2-prod`라는 배포를 생성한 경우:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="깔끔한 포스터" size=1024x1024 count=1
```

동일한 배포 이름 규칙이 번들 `openai` 제공자를 통해 라우팅되는 모든 이미지
생성 호출에 적용됩니다.

### 지역별 가용성

Azure 이미지 생성은 현재 일부 지역(예: `eastus2`, `swedencentral`,
`polandcentral`, `westus3`, `uaenorth`)에서만 사용할 수 있습니다. 배포를
생성하기 전에 Microsoft의 최신 지역 목록을 확인하고 해당 지역에서 특정
모델이 제공되는지 확인하십시오.

### 매개변수 차이

Azure OpenAI와 공개 OpenAI가 항상 동일한 이미지 매개변수를 허용하는 것은
아닙니다. Azure는 공개 OpenAI에서 허용하는 옵션(예: `gpt-image-2`의 특정
`background` 값)을 거부하거나 특정 모델 버전에서만 노출할 수 있습니다.
이러한 차이는 OpenClaw가 아니라 Azure와 기반 모델에서 발생합니다. Azure
요청이 유효성 검사 오류로 실패하면 Azure 포털에서 특정 배포와 API 버전이
지원하는 매개변수 집합을 확인하십시오.

<Note>
Azure OpenAI는 네이티브 전송 및 호환 동작을 사용하지만 OpenClaw의 숨겨진
기여 표시 헤더는 받지 않습니다. [고급 구성](#advanced-configuration)의
**네이티브 경로와 OpenAI 호환 경로** 아코디언을 참조하십시오.

이미지 생성을 제외한 Azure의 채팅 또는 Responses 트래픽에는 온보딩 흐름이나
전용 Azure 제공자 구성을 사용하십시오. `openai.baseUrl`만으로는 Azure
API/인증 형식이 적용되지 않습니다. 별도의 `azure-openai-responses/*`
제공자가 있습니다. 아래의 서버 측 Compaction 아코디언을 참조하십시오.
</Note>

## 고급 구성

아래의 모델별 `params` 예시는 OpenClaw에 내장된 제공자 요청의 형식을
정합니다. 이를 구성하면 명시적으로 작성된 요청 동작이 되므로, 달리 적격한
`auto` 경로도 Codex를 암시적으로 선택하지 않고 OpenClaw에 유지됩니다.
네이티브 Codex 앱 서버 하네스는 자체 전송 및 요청 설정을 관리합니다.
유효 경로가 Codex 호환으로 선언되지 않은 경우 명시적인
`agentRuntime.id: "codex"`는 안전하게 실패합니다.

<AccordionGroup>
  <Accordion title="전송(WebSocket과 SSE)">
    OpenClaw는 `openai/*`에 WebSocket 우선, SSE 대체 방식(`"auto"`)을 사용합니다.

    `"auto"` 모드에서 OpenClaw는 다음과 같이 작동합니다.
    - SSE로 전환하기 전에 초기 WebSocket 실패를 한 번 재시도합니다.
    - 실패 후 WebSocket을 60초 동안 성능 저하 상태로 표시하고 대기 시간 동안
      SSE를 사용합니다.
    - 재시도 및 재연결을 위해 안정적인 세션 및 턴 식별 헤더를 첨부합니다.
    - 전송 방식 간 사용량 카운터(`input_tokens` / `prompt_tokens`)를 정규화합니다.

    | 값                   | 동작                                 |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (기본값)    | WebSocket 우선, SSE 대체             |
    | `"sse"`              | SSE만 강제                           |
    | `"websocket"`        | WebSocket만 강제                     |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    관련 OpenAI 문서:
    - [WebSocket을 사용하는 Realtime API](https://platform.openai.com/docs/guides/realtime-websocket)
    - [스트리밍 API 응답(SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="빠른 모드">
    OpenClaw는 `openai/*`에 공통 빠른 모드 전환 기능을 제공합니다.

    - **채팅/UI:** `/fast status|auto|on|off`
    - **구성:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    활성화하면 OpenClaw는 빠른 모드를 OpenAI 우선 처리
    (`service_tier = "priority"`)에 매핑합니다. 기존 `service_tier` 값은
    유지되며 빠른 모드는 `reasoning` 또는 `text.verbosity`를 다시 작성하지
    않습니다. `fastMode: "auto"`는 자동 제한 시점까지 새 모델 호출을 빠른
    모드로 시작한 후, 이후의 재시도, 대체, 도구 결과 또는 연속 호출을 빠른
    모드 없이 시작합니다. 제한 시점의 기본값은 60초입니다. 변경하려면 활성
    모델에서 `params.fastAutoOnSeconds`를 설정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    세션 재정의가 구성보다 우선합니다. Sessions UI에서 세션 재정의를
    지우면 세션이 구성된 기본값으로 돌아갑니다.
    </Note>

  </Accordion>

  <Accordion title="우선 처리(service_tier)">
    OpenAI API는 `service_tier`를 통해 우선 처리를 제공합니다. OpenClaw에서
    모델별로 설정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    지원되는 값: `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier`는 네이티브 OpenAI 엔드포인트(`api.openai.com`)와 네이티브
    Codex 엔드포인트(`chatgpt.com/backend-api`)에만 전달됩니다. 두 제공자
    중 하나를 프록시를 통해 라우팅하면 OpenClaw는 `service_tier`를 변경하지
    않습니다.
    </Warning>

  </Accordion>

  <Accordion title="서버 측 Compaction(Responses API)">
    직접 OpenAI Responses 모델(`api.openai.com`의 `openai/*`)에서 OpenAI
    Plugin의 OpenClaw 스트림 래퍼는 서버 측 Compaction을 자동으로
    활성화합니다.

    - `store: true`를 강제합니다(모델 호환 설정에서 `supportsStore: false`로 설정한 경우 제외).
    - `context_management: [{ type: "compaction", compact_threshold: ... }]`를 삽입합니다.
    - 기본 `compact_threshold`: `contextWindow`의 70%(사용할 수 없는 경우 `80000`)

    이는 내장 OpenClaw 런타임 경로와 임베디드 실행에 사용되는 OpenAI 제공자
    훅에 적용됩니다. 네이티브 Codex 앱 서버 하네스는 Codex를 통해 자체
    컨텍스트를 관리하므로 이 설정의 영향을 받지 않습니다.

    <Tabs>
      <Tab title="명시적으로 활성화">
        Azure OpenAI Responses 같은 호환 엔드포인트에 유용합니다.

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="사용자 지정 임계값">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="비활성화">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction`은 `context_management` 삽입만 제어합니다.
    직접 OpenAI Responses 모델은 호환 설정에서 `supportsStore: false`로
    설정하지 않는 한 계속 `store: true`를 강제합니다.
    </Note>

  </Accordion>

  <Accordion title="엄격한 에이전트형 GPT 모드">
    OpenClaw의 임베디드 런타임을 통해 실행되는 `openai` 제공자의 GPT-5 계열
    모델에는 이미 `strict-agentic`이라는 더 엄격한 실행 계약이 기본값으로
    적용됩니다. 구성에서 명시적으로 사용하지 않도록 설정하지 않는 한, 확인된
    제공자가 `openai`이고 모델 ID가 GPT-5 계열과 일치할 때마다 자동으로
    활성화됩니다.

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    지원되는 경로에서 `"strict-agentic"`을 명시적으로 설정해도 아무런 변화가
    없으며(이미 기본값임), 지원되지 않는 제공자/모델 조합에서는 작동하지 않습니다.

    `strict-agentic`이 활성화되면 OpenClaw는 다음과 같이 작동합니다.
    - 상당한 작업에 `update_plan`을 자동으로 활성화합니다.
    - 구조적으로 비어 있거나 추론만 포함된 턴을 사용자에게 표시되는 답변의
      연속 요청으로 재시도합니다.
    - 선택한 하네스가 제공하는 경우 명시적인 하네스 계획 이벤트를 사용합니다.

    OpenClaw은 턴이 계획, 진행 상황 업데이트 또는 최종 답변인지 판단하기 위해 어시스턴트의 설명문을 분류하지 않습니다.

    <Note>
    이 계약은 전적으로 OpenClaw에 내장된 에이전트 러너에 존재합니다. 자체적으로
    턴과 계획 동작을 관리하는 네이티브 Codex app-server 하네스에는
    적용되지 않습니다. 네이티브 Codex 실행에서는 실행 계약 설정보다
    하네스 선택이 더 중요합니다.
    </Note>

  </Accordion>

  <Accordion title="네이티브 경로와 OpenAI 호환 경로">
    OpenClaw은 직접 OpenAI, Codex 및 Azure OpenAI 엔드포인트를
    일반 OpenAI 호환 `/v1` 프록시와 다르게 처리합니다.

    **네이티브 경로** (`openai/*`, Azure OpenAI):
    - OpenAI `none` 추론 노력을 지원하는 모델에만
      `reasoning: { effort: "none" }`을 유지합니다.
    - `reasoning.effort: "none"`을 거부하는 모델 또는 프록시에서는
      비활성화된 추론을 생략합니다.
    - 도구 스키마의 기본값을 엄격 모드로 설정합니다.
    - 검증된 네이티브 호스트에만 숨겨진 출처 표시 헤더를 첨부합니다(Azure
      OpenAI는 네이티브 경로이지만 이러한 헤더를 받지 않습니다).
    - OpenAI 전용 요청 구성(`service_tier`, `store`,
      추론 호환성, 프롬프트 캐시 힌트)을 유지합니다.

    **프록시/호환 경로:**
    - 더 느슨한 호환성 동작을 사용합니다.
    - 네이티브가 아닌 `openai-completions` 페이로드에서 Completions `store`를 제거합니다.
    - OpenAI 호환 Completions 프록시를 위한 고급
      `params.extra_body`/`params.extraBody` 통과 JSON을 허용합니다.
    - vLLM과 같은 OpenAI 호환 Completions 프록시에
      `params.chat_template_kwargs`를 허용합니다.
    - 엄격한 도구 스키마 또는 네이티브 전용 헤더를 강제하지 않습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수 및 제공자 선택입니다.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    공유 동영상 도구 매개변수 및 제공자 선택입니다.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 자격 증명 재사용 규칙입니다.
  </Card>
</CardGroup>
