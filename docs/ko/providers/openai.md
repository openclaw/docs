---
read_when:
    - OpenClaw에서 OpenAI 모델을 사용하려고 합니다
    - API 키 대신 Codex 구독 인증을 사용하려는 경우
    - 더 엄격한 GPT-5 에이전트 실행 동작이 필요합니다
summary: OpenClaw에서 API 키 또는 Codex 구독을 통해 OpenAI 사용
title: OpenAI
x-i18n:
    generated_at: "2026-05-10T19:49:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5022874c9517e670b70ba90fb400f99f850746c341cb6e967c2abc96d8255548
    source_path: providers/openai.md
    workflow: 16
---

OpenAI는 GPT 모델용 개발자 API를 제공하며, Codex는 OpenAI의 Codex 클라이언트를 통해
ChatGPT 플랜 코딩 에이전트로도 사용할 수 있습니다. OpenClaw는 구성의 예측 가능성을
유지하기 위해 이러한 표면을 분리합니다.

OpenClaw는 정식 OpenAI 모델 경로로 `openai/*`를 사용합니다. OpenAI 모델의 임베디드
에이전트 턴은 기본적으로 네이티브 Codex 앱 서버 런타임을 통해 실행됩니다. 직접
OpenAI API 키 인증은 이미지, 임베딩, 음성, 실시간 같은 비 에이전트 OpenAI 표면에서
계속 사용할 수 있습니다.

- **에이전트 모델** - Codex 런타임을 통한 `openai/*` 모델입니다. ChatGPT/Codex
  구독 사용에는 `openai-codex` 인증으로 로그인하거나, 의도적으로 API 키 인증을
  사용하려는 경우 `openai-codex` API 키 프로필을 구성하세요.
- **비 에이전트 OpenAI API** - `OPENAI_API_KEY` 또는 OpenAI API 키 온보딩을 통해
  사용량 기반 과금이 적용되는 직접 OpenAI Platform 액세스입니다.
- **레거시 구성** - `openai-codex/*` 모델 참조는 `openclaw doctor --fix`에 의해
  `openai/*` 및 Codex 런타임으로 복구됩니다.

OpenAI는 OpenClaw 같은 외부 도구와 워크플로에서 구독 OAuth 사용을 명시적으로 지원합니다.

제공자, 모델, 런타임, 채널은 서로 다른 계층입니다. 이러한 레이블이 서로 섞이고 있다면
구성을 변경하기 전에 [에이전트 런타임](/ko/concepts/agent-runtimes)을 읽으세요.

## 빠른 선택

| 목표                                                 | 사용할 항목                                                | 참고                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| 네이티브 Codex 런타임으로 ChatGPT/Codex 구독 사용 | `openai/gpt-5.5`                                        | 기본 OpenAI 에이전트 설정입니다. `openai-codex` 인증으로 로그인하세요. |
| 에이전트 모델에 직접 API 키 과금 사용              | `openai/gpt-5.5` 및 `openai-codex` API 키 프로필 | 해당 프로필을 우선하려면 `auth.order.openai-codex`를 사용하세요.       |
| 명시적 PI를 통한 직접 API 키 과금                   | `openai/gpt-5.5` 및 제공자/모델 런타임 `pi`       | 일반 `openai` API 키 프로필을 선택하세요.                              |
| 최신 ChatGPT Instant API 별칭                       | `openai/chat-latest`                                    | 직접 API 키 전용입니다. 기본값이 아니라 실험용 이동 별칭입니다.        |
| 명시적 PI를 통한 ChatGPT/Codex 구독 인증            | `openai/gpt-5.5` 및 제공자/모델 런타임 `pi`       | 호환성 경로에는 `openai-codex` 인증 프로필을 선택하세요.               |
| 이미지 생성 또는 편집                               | `openai/gpt-image-2`                                    | `OPENAI_API_KEY` 또는 OpenAI Codex OAuth 어느 쪽으로도 작동합니다.     |
| 투명 배경 이미지                                    | `openai/gpt-image-1.5`                                  | `outputFormat=png` 또는 `webp` 및 `openai.background=transparent`를 사용하세요. |

## 이름 매핑

이름은 비슷하지만 서로 바꿔 사용할 수 없습니다.

| 표시되는 이름                            | 계층                | 의미                                                                                           |
| --------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                                | 제공자 접두사       | 정식 OpenAI 모델 경로입니다. 에이전트 턴은 Codex 런타임을 사용합니다.                            |
| `openai-codex`                          | 인증/프로필 접두사 | OpenAI Codex OAuth/구독 인증 프로필 제공자입니다.                                                 |
| `codex` Plugin                          | Plugin              | 네이티브 Codex 앱 서버 런타임과 `/codex` 채팅 제어를 제공하는 번들 OpenClaw Plugin입니다.          |
| 제공자/모델 `agentRuntime.id: codex` | 에이전트 런타임       | 일치하는 임베디드 턴에 대해 네이티브 Codex 앱 서버 하네스를 강제합니다.                           |
| `/codex ...`                            | 채팅 명령 세트      | 대화에서 Codex 앱 서버 스레드를 바인딩/제어합니다.                                                |
| `runtime: "acp", agentId: "codex"`      | ACP 세션 경로       | ACP/acpx를 통해 Codex를 실행하는 명시적 폴백 경로입니다.                                          |

즉, 구성에는 의도적으로 `openai/*` 모델 참조와 `openai-codex` 인증 프로필이
둘 다 포함될 수 있습니다. `openclaw doctor --fix`는 레거시 `openai-codex/*` 모델
참조를 정식 OpenAI 모델 경로로 다시 씁니다.

<Note>
GPT-5.5는 직접 OpenAI Platform API 키 액세스와 구독/OAuth 경로 모두에서 사용할 수
있습니다. ChatGPT/Codex 구독과 네이티브 Codex 실행을 함께 사용하려면
`openai/gpt-5.5`를 사용하세요. 이제 런타임 구성을 설정하지 않으면 OpenAI 에이전트
턴에 Codex 하네스가 선택됩니다. OpenAI 에이전트 모델에 직접 API 키 인증을 사용하려는
경우에만 OpenAI API 키 프로필을 사용하세요.
</Note>

<Note>
OpenAI 에이전트 모델 턴에는 번들 Codex 앱 서버 Plugin이 필요합니다. 명시적 PI 런타임
구성은 옵트인 호환성 경로로 계속 사용할 수 있습니다. `openai-codex` 인증 프로필로
PI가 명시적으로 선택되면 OpenClaw는 공개 모델 참조를 `openai/*`로 유지하고, 내부적으로
레거시 Codex 인증 전송을 통해 PI를 라우팅합니다. 오래된 `openai-codex/*` 모델 참조나
명시적 런타임 구성에서 오지 않은 이전 PI 세션 고정을 복구하려면 `openclaw doctor --fix`를
실행하세요.
</Note>

## OpenClaw 기능 범위

| OpenAI 기능              | OpenClaw 표면                                                                    | 상태                                                   |
| ------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses          | `openai/<model>` 모델 제공자                                                     | 예                                                     |
| Codex 구독 모델           | `openai/<model>` 및 `openai-codex` OAuth                                         | 예                                                     |
| 레거시 Codex 모델 참조    | `openai-codex/<model>`                                                           | doctor가 `openai/<model>`로 복구                       |
| Codex 앱 서버 하네스      | 런타임 생략 또는 제공자/모델 `agentRuntime.id: codex`가 있는 `openai/<model>` | 예                                                     |
| 서버 측 웹 검색           | 네이티브 OpenAI Responses 도구                                                   | 웹 검색이 활성화되고 고정된 제공자가 없을 때 예        |
| 이미지                    | `image_generate`                                                                 | 예                                                     |
| 동영상                    | `video_generate`                                                                 | 예                                                     |
| 텍스트 음성 변환          | `messages.tts.provider: "openai"` / `tts`                                        | 예                                                     |
| 배치 음성 텍스트 변환     | `tools.media.audio` / 미디어 이해                                                | 예                                                     |
| 스트리밍 음성 텍스트 변환 | 음성 통화 `streaming.provider: "openai"`                                         | 예                                                     |
| 실시간 음성               | 음성 통화 `realtime.provider: "openai"` / Control UI Talk                        | 예                                                     |
| 임베딩                    | 메모리 임베딩 제공자                                                             | 예                                                     |

## 메모리 임베딩

OpenClaw는 `memory_search` 인덱싱과 쿼리 임베딩에 OpenAI 또는 OpenAI 호환 임베딩
엔드포인트를 사용할 수 있습니다.

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

비대칭 임베딩 레이블이 필요한 OpenAI 호환 엔드포인트의 경우 `memorySearch` 아래에
`queryInputType` 및 `documentInputType`을 설정하세요. OpenClaw는 이를 제공자별
`input_type` 요청 필드로 전달합니다. 쿼리 임베딩은 `queryInputType`을 사용하고,
인덱싱된 메모리 청크와 배치 인덱싱은 `documentInputType`을 사용합니다. 전체 예시는
[메모리 구성 참조](/ko/reference/memory-config#provider-specific-config)를 확인하세요.

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API 키(OpenAI Platform)">
    **가장 적합한 경우:** 직접 API 액세스 및 사용량 기반 과금.

    <Steps>
      <Step title="API 키 가져오기">
        [OpenAI Platform 대시보드](https://platform.openai.com/api-keys)에서 API 키를 만들거나 복사하세요.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        또는 키를 직접 전달하세요.

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

    | 모델 참조              | 런타임 구성                 | 경로                       | 인증             |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`      | 생략 / 제공자/모델 `agentRuntime.id: "codex"` | Codex 앱 서버 하네스 | `openai-codex` 프로필 |
    | `openai/gpt-5.4-mini` | 생략 / 제공자/모델 `agentRuntime.id: "codex"` | Codex 앱 서버 하네스 | `openai-codex` 프로필 |
    | `openai/gpt-5.5`      | 제공자/모델 `agentRuntime.id: "pi"`              | PI 임베디드 런타임      | `openai` 프로필 또는 선택한 `openai-codex` 프로필 |

    <Note>
    `openai/*` 에이전트 모델은 Codex 앱 서버 하네스를 사용합니다. 에이전트 모델에
    API 키 인증을 사용하려면 `openai-codex` API 키 프로필을 만들고
    `auth.order.openai-codex`로 순서를 지정하세요. `OPENAI_API_KEY`는 비 에이전트
    OpenAI API 표면의 직접 폴백으로 계속 사용됩니다.
    </Note>

    ### 구성 예시

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    OpenAI API에서 ChatGPT의 현재 Instant 모델을 사용해 보려면 모델을
    `openai/chat-latest`로 설정하세요.

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest`는 이동 별칭입니다. OpenAI는 이를 ChatGPT에서 사용되는 최신 Instant
    모델로 문서화하고 프로덕션 API 사용에는 `gpt-5.5`를 권장하므로, 해당 별칭 동작을
    명시적으로 원하는 경우가 아니라면 안정적인 기본값으로 `openai/gpt-5.5`를 유지하세요.
    이 별칭은 현재 `medium` 텍스트 자세도만 허용하므로, OpenClaw는 이 모델에 대해
    호환되지 않는 OpenAI 텍스트 자세도 오버라이드를 정규화합니다.

    <Warning>
    OpenClaw는 `openai/gpt-5.3-codex-spark`를 노출하지 않습니다. 실제 OpenAI API 요청은 해당 모델을 거부하며, 현재 Codex 카탈로그에도 이 모델은 노출되어 있지 않습니다.
    </Warning>

  </Tab>

  <Tab title="Codex 구독">
    **가장 적합한 경우:** 별도 API 키 대신 ChatGPT/Codex 구독을 네이티브 Codex 앱 서버 실행과 함께 사용. Codex 클라우드에는 ChatGPT 로그인이 필요합니다.

    <Steps>
      <Step title="Codex OAuth 실행">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        또는 OAuth를 직접 실행하세요.

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        헤드리스 또는 콜백에 불리한 설정에서는 localhost 브라우저 콜백 대신 ChatGPT 디바이스 코드 흐름으로 로그인하려면 `--device-code`를 추가하세요:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="정식 OpenAI 모델 경로 사용">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        기본 경로에는 런타임 설정이 필요하지 않습니다. OpenAI 에이전트 턴은
        네이티브 Codex 앱 서버 런타임을 자동으로 선택하며, 이 경로가 선택되면
        OpenClaw가 번들된 Codex Plugin을 설치하거나 복구합니다.
      </Step>
      <Step title="Codex 인증을 사용할 수 있는지 확인">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway가 실행된 후 채팅에서 `/codex status` 또는 `/codex models`를
        보내 네이티브 앱 서버 런타임을 확인하세요.
      </Step>
    </Steps>

    ### 경로 요약

    | 모델 ref | 런타임 설정 | 경로 | 인증 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | 생략 / 제공자/모델 `agentRuntime.id: "codex"` | 네이티브 Codex 앱 서버 하네스 | Codex 로그인 또는 선택된 `openai-codex` 프로필 |
    | `openai/gpt-5.5` | 제공자/모델 `agentRuntime.id: "pi"` | 내부 Codex 인증 전송을 사용하는 Pi 내장 런타임 | 선택된 `openai-codex` 프로필 |
    | `openai-codex/gpt-5.5` | doctor로 복구됨 | `openai/gpt-5.5`로 다시 작성된 레거시 경로 | 기존 `openai-codex` 프로필 |

    <Warning>
    더 오래된 `openai-codex/gpt-5.1*`, `openai-codex/gpt-5.2*` 또는
    `openai-codex/gpt-5.3*` 모델 ref를 설정하지 마세요. ChatGPT/Codex OAuth 계정은 이제
    해당 모델을 거부합니다. `openai/gpt-5.5`를 사용하세요. 이제 OpenAI 에이전트 턴은 기본적으로 Codex
    런타임을 선택합니다.
    </Warning>

    <Note>
    인증/프로필 명령에는 계속 `openai-codex` 제공자 id를 사용하세요.
    `openai-codex/*` 모델 접두사는 doctor가 복구하는 레거시 설정입니다. 일반적인
    구독 및 네이티브 런타임 설정의 경우 `openai-codex`로 로그인하되
    모델 ref는 `openai/gpt-5.5`로 유지하세요.
    </Note>

    ### 설정 예시

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    <Note>
    온보딩은 더 이상 `~/.codex`에서 OAuth 자료를 가져오지 않습니다. 브라우저 OAuth(기본값) 또는 위의 디바이스 코드 흐름으로 로그인하세요. OpenClaw는 생성된 자격 증명을 자체 에이전트 인증 저장소에서 관리합니다.
    </Note>

    ### Codex OAuth 라우팅 확인 및 복구

    다음 명령을 사용하여 기본 에이전트가 어떤 모델, 런타임, 인증 경로를
    사용하는지 확인하세요.

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    특정 에이전트의 경우 `--agent <id>`를 추가하세요.

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    이전 설정에 아직 `openai-codex/gpt-*`가 있거나 명시적 런타임 설정 없이 오래된 OpenAI Pi
    세션 고정이 남아 있으면 복구하세요.

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    `models auth list --provider openai-codex`가 사용 가능한 프로필을 표시하지 않으면
    다시 로그인하세요.

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex`는 인증/프로필 제공자 id로 유지됩니다. `openai/*`는
    Codex를 통한 OpenAI 에이전트 턴의 모델 경로입니다.

    ### 상태 표시기

    채팅 `/status`는 현재 세션에서 활성화된 모델 런타임을 표시합니다.
    번들된 Codex 앱 서버 하네스는 OpenAI 에이전트 모델 턴에서 `Runtime: OpenAI Codex`로
    표시됩니다. 설정이 명시적으로 Pi를 고정하지 않는 한 오래된 Pi 세션 고정은 Codex로 복구됩니다.

    ### Doctor 경고

    `openai-codex/*` 경로나 오래된 OpenAI Pi 고정이 설정 또는
    세션 상태에 남아 있으면, Pi가 명시적으로 설정된 경우를 제외하고 `openclaw doctor --fix`가
    Codex 런타임을 사용하는 `openai/*`로 다시 작성합니다.

    ### 컨텍스트 창 상한

    OpenClaw는 모델 메타데이터와 런타임 컨텍스트 상한을 별도의 값으로 취급합니다.

    Codex OAuth 카탈로그를 통한 `openai/gpt-5.5`의 경우:

    - 네이티브 `contextWindow`: `1000000`
    - 기본 런타임 `contextTokens` 상한: `272000`

    더 작은 기본 상한은 실제로 더 나은 지연 시간 및 품질 특성을 가집니다. `contextTokens`로 재정의하세요.

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    네이티브 모델 메타데이터를 선언하려면 `contextWindow`를 사용하세요. 런타임 컨텍스트 예산을 제한하려면 `contextTokens`를 사용하세요.
    </Note>

    ### 카탈로그 복구

    OpenClaw는 `gpt-5.5`가 있을 때 업스트림 Codex 카탈로그 메타데이터를
    사용합니다. 계정이 인증된 상태인데 실시간 Codex 검색에서 `gpt-5.5` 행이
    누락되면, OpenClaw는 해당 OAuth 모델 행을 합성하여
    Cron, 하위 에이전트 및 설정된 기본 모델 실행이
    `Unknown model`로 실패하지 않도록 합니다.

  </Tab>
</Tabs>

## 네이티브 Codex 앱 서버 인증

네이티브 Codex 앱 서버 하네스는 `openai/*` 모델 ref와 생략된
런타임 설정 또는 제공자/모델 `agentRuntime.id: "codex"`를 사용하지만, 인증은 여전히
계정 기반입니다. OpenClaw는
다음 순서로 인증을 선택합니다.

1. 에이전트에 바인딩된 명시적 OpenClaw `openai-codex` 인증 프로필.
2. 로컬 Codex CLI ChatGPT 로그인과 같은 앱 서버의 기존 계정.
3. 로컬 stdio 앱 서버 실행에서만, 앱 서버가 계정이 없다고 보고하고 여전히
   OpenAI 인증이 필요한 경우 `CODEX_API_KEY`, 그다음
   `OPENAI_API_KEY`.

즉, Gateway 프로세스에 직접 OpenAI 모델 또는 임베딩용 `OPENAI_API_KEY`가
있다는 이유만으로 로컬 ChatGPT/Codex 구독 로그인이 대체되지는 않습니다.
환경 변수 API 키 폴백은 로컬 stdio 무계정 경로에만 해당하며,
WebSocket 앱 서버 연결로 전송되지 않습니다. 구독 방식 Codex 프로필이 선택되면
OpenClaw는 생성된 stdio 앱 서버 자식 프로세스에서 `CODEX_API_KEY`와 `OPENAI_API_KEY`도
제외하고, 선택된 자격 증명을 앱 서버 로그인 RPC를 통해 전송합니다.

## 이미지 생성

번들된 `openai` Plugin은 `image_generate` 도구를 통해 이미지 생성을 등록합니다.
동일한 `openai/gpt-image-2` 모델 ref를 통해 OpenAI API 키 이미지 생성과 Codex OAuth 이미지
생성을 모두 지원합니다.

| 기능                | OpenAI API 키                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 모델 ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 인증                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 로그인           |
| 전송                 | OpenAI Images API                  | Codex Responses 백엔드              |
| 요청당 최대 이미지 수    | 4                                  | 4                                    |
| 편집 모드                 | 활성화됨(참조 이미지 최대 5개) | 활성화됨(참조 이미지 최대 5개)   |
| 크기 재정의            | 2K/4K 크기를 포함하여 지원됨   | 2K/4K 크기를 포함하여 지원됨     |
| 종횡비 / 해상도 | OpenAI Images API로 전달되지 않음 | 안전한 경우 지원되는 크기로 매핑됨 |

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
공유 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.
</Note>

`gpt-image-2`는 OpenAI 텍스트-이미지 생성과 이미지
편집 모두의 기본값입니다. `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`는 명시적
모델 재정의로 계속 사용할 수 있습니다. 투명 배경
PNG/WebP 출력에는 `openai/gpt-image-1.5`를 사용하세요. 현재 `gpt-image-2` API는
`background: "transparent"`를 거부합니다.

투명 배경 요청의 경우, 에이전트는
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` 또는 `"webp"`, 그리고
`background: "transparent"`로 `image_generate`를 호출해야 합니다. 이전 `openai.background` 제공자 옵션도
계속 허용됩니다. OpenClaw는 또한 기본 `openai/gpt-image-2` 투명
요청을 `gpt-image-1.5`로 다시 작성하여 공용 OpenAI 및
OpenAI Codex OAuth 경로를 보호합니다. Azure 및 사용자 지정 OpenAI 호환 엔드포인트는
설정된 배포/모델 이름을 유지합니다.

동일한 설정은 헤드리스 CLI 실행에도 노출됩니다.

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

입력 파일에서 시작할 때는 `openclaw infer image edit`와 함께
동일한 `--output-format` 및 `--background` 플래그를 사용하세요.
`--openai-background`는 OpenAI 전용 별칭으로 계속 사용할 수 있습니다.

Codex OAuth 설치의 경우 동일한 `openai/gpt-image-2` ref를 유지하세요. `openai-codex`
OAuth 프로필이 설정되면, OpenClaw는 저장된 OAuth
액세스 토큰을 해석하고 Codex Responses 백엔드를 통해 이미지 요청을 보냅니다. 해당
요청에 대해 먼저 `OPENAI_API_KEY`를 시도하거나 API 키로 조용히 폴백하지 않습니다.
대신 직접 OpenAI Images API 경로를 원할 때는 API 키,
사용자 지정 기본 URL 또는 Azure 엔드포인트로 `models.providers.openai`를 명시적으로 설정하세요.
해당 사용자 지정 이미지 엔드포인트가 신뢰할 수 있는 LAN/개인 주소에 있으면
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`도 설정하세요. OpenClaw는 이 옵트인이
없으면 개인/내부 OpenAI 호환 이미지 엔드포인트를 계속 차단합니다.

생성:

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

투명 PNG 생성:

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

편집:

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 비디오 생성

번들된 `openai` Plugin은 `video_generate` 도구를 통해 비디오 생성을 등록합니다.

| 기능       | 값                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| 기본 모델    | `openai/sora-2`                                                                   |
| 모드            | 텍스트-비디오, 이미지-비디오, 단일 비디오 편집                                  |
| 참조 입력 | 이미지 1개 또는 비디오 1개                                                                |
| 크기 재정의   | 지원됨                                                                         |
| 기타 재정의  | `aspectRatio`, `resolution`, `audio`, `watermark`는 도구 경고와 함께 무시됨 |

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
공유 도구 매개변수, 제공자 선택 및 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.
</Note>

## GPT-5 프롬프트 기여분

OpenClaw는 제공자 전반의 GPT-5 계열 실행에 공유 GPT-5 프롬프트 기여분을 추가합니다. 모델 id를 기준으로 적용되므로 `openai/gpt-5.5`, `openai-codex/gpt-5.5`와 같은 복구 전 레거시 ref, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` 및 기타 호환 GPT-5 ref는 동일한 오버레이를 받습니다. 이전 GPT-4.x 모델에는 적용되지 않습니다.

번들된 네이티브 Codex 하네스는 Codex 앱 서버 개발자 지침을 통해 동일한 GPT-5 동작과 Heartbeat 오버레이를 사용하므로, Codex를 통해 라우팅되는 `openai/gpt-5.x` 세션은 Codex가 나머지 하네스 프롬프트를 담당하더라도 동일한 후속 실행 및 사전 Heartbeat 지침을 유지합니다.

GPT-5 기여는 페르소나 지속성, 실행 안전성, 도구 규율, 출력 형태, 완료 확인, 검증에 대한 태그가 지정된 동작 계약을 추가합니다. 채널별 응답 및 무음 메시지 동작은 공유 OpenClaw 시스템 프롬프트와 아웃바운드 전달 정책에 남아 있습니다. GPT-5 지침은 일치하는 모델에 대해 항상 활성화됩니다. 친근한 상호작용 스타일 계층은 별도이며 구성할 수 있습니다.

| 값                     | 효과                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (기본값)  | 친근한 상호작용 스타일 계층 활성화       |
| `"on"`                 | `"friendly"`의 별칭                      |
| `"off"`                | 친근한 스타일 계층만 비활성화            |

<Tabs>
  <Tab title="Config">
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
값은 런타임에 대소문자를 구분하지 않으므로 `"Off"`와 `"off"` 모두 친근한 스타일 계층을 비활성화합니다.
</Tip>

<Note>
레거시 `plugins.entries.openai.config.personality`는 공유 `agents.defaults.promptOverlays.gpt5.personality` 설정이 지정되지 않은 경우 호환성 폴백으로 계속 읽힙니다.
</Note>

## 음성 및 말하기

<AccordionGroup>
  <Accordion title="Speech synthesis (TTS)">
    번들된 `openai` Plugin은 `messages.tts` 표면에 음성 합성을 등록합니다.

    | 설정 | 구성 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 음성 | `messages.tts.providers.openai.voice` | `coral` |
    | 속도 | `messages.tts.providers.openai.speed` | (설정되지 않음) |
    | 지침 | `messages.tts.providers.openai.instructions` | (설정되지 않음, `gpt-4o-mini-tts`만 해당) |
    | 형식 | `messages.tts.providers.openai.responseFormat` | 음성 메모는 `opus`, 파일은 `mp3` |
    | API 키 | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY`로 폴백 |
    | 기본 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 추가 본문 | `messages.tts.providers.openai.extraBody` / `extra_body` | (설정되지 않음) |

    사용 가능한 모델: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. 사용 가능한 음성: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody`는 OpenClaw가 생성한 필드 뒤에 `/audio/speech` 요청 JSON에 병합되므로, `lang` 같은 추가 키가 필요한 OpenAI 호환 엔드포인트에 사용하세요. 프로토타입 키는 무시됩니다.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    채팅 API 엔드포인트에 영향을 주지 않고 TTS 기본 URL을 재정의하려면 `OPENAI_TTS_BASE_URL`을 설정하세요. OpenAI TTS는 여전히 API 키를 통해 구성됩니다. OAuth 전용 실시간 음성 응답에는 에이전트 모드 STT -> TTS 음성 대신 Realtime 음성 경로를 사용하세요.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    번들된 `openai` Plugin은 OpenClaw의 미디어 이해 전사 표면을 통해
    배치 음성-텍스트 변환을 등록합니다.

    - 기본 모델: `gpt-4o-transcribe`
    - 엔드포인트: OpenAI REST `/v1/audio/transcriptions`
    - 입력 경로: 멀티파트 오디오 파일 업로드
    - Discord 음성 채널 세그먼트 및 채널 오디오 첨부 파일을 포함하여
      인바운드 오디오 전사가 `tools.media.audio`를 사용하는 OpenClaw의 모든 위치에서 지원됩니다

    인바운드 오디오 전사에 OpenAI를 강제로 사용하려면:

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

    언어 및 프롬프트 힌트는 공유 오디오 미디어 구성 또는 호출별 전사 요청에서 제공될 때 OpenAI로 전달됩니다.

  </Accordion>

  <Accordion title="Realtime transcription">
    번들된 `openai` Plugin은 Voice Call Plugin에 실시간 전사를 등록합니다.

    | 설정 | 구성 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 언어 | `...openai.language` | (설정되지 않음) |
    | 프롬프트 | `...openai.prompt` | (설정되지 않음) |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `800` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | 인증 | `...openai.apiKey`, `OPENAI_API_KEY`, 또는 `openai-codex` OAuth | API 키는 직접 연결하며, OAuth는 Realtime 전사 클라이언트 시크릿을 발급합니다 |

    <Note>
    G.711 u-law(`g711_ulaw` / `audio/pcmu`) 오디오와 함께 `wss://api.openai.com/v1/realtime`에 대한 WebSocket 연결을 사용합니다. `openai-codex` OAuth만 구성된 경우 Gateway는 WebSocket을 열기 전에 임시 Realtime 전사 클라이언트 시크릿을 발급합니다. 이 스트리밍 제공자는 Voice Call의 실시간 전사 경로용입니다. Discord 음성은 현재 짧은 세그먼트를 녹음하고 대신 배치 `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    번들된 `openai` Plugin은 Voice Call Plugin에 실시간 음성을 등록합니다.

    | 설정 | 구성 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-2` |
    | 음성 | `...openai.voice` | `alloy` |
    | 온도(Azure 배포 브리지) | `...openai.temperature` | `0.8` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `500` |
    | 접두사 패딩 | `...openai.prefixPaddingMs` | `300` |
    | 추론 노력 | `...openai.reasoningEffort` | (설정되지 않음) |
    | 인증 | `...openai.apiKey`, `OPENAI_API_KEY`, 또는 `openai-codex` OAuth | Browser Talk 및 비 Azure 백엔드 브리지는 Codex OAuth를 사용할 수 있습니다 |

    `gpt-realtime-2`에 사용할 수 있는 기본 제공 Realtime 음성: `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI는 최상의 Realtime 품질을 위해 `marin`과 `cedar`를 권장합니다. 이는
    위의 Text-to-speech 음성과 별도의 집합입니다. `fable`, `nova`, `onyx` 같은 TTS
    음성이 Realtime 세션에 유효하다고 가정하지 마세요.

    <Note>
    백엔드 OpenAI Realtime 브리지는 `session.temperature`를 허용하지 않는 GA Realtime WebSocket 세션 형태를 사용합니다. Azure OpenAI 배포는 `azureEndpoint`와 `azureDeployment`를 통해 계속 사용할 수 있으며 배포 호환 세션 형태를 유지합니다. 양방향 도구 호출과 G.711 u-law 오디오를 지원합니다.
    </Note>

    <Note>
    Realtime 음성은 세션이 생성될 때 선택됩니다. OpenAI는 대부분의
    세션 필드가 나중에 변경되는 것을 허용하지만, 해당 세션에서 모델이 오디오를 내보낸 후에는
    음성을 변경할 수 없습니다. OpenClaw는 현재 기본 제공 Realtime 음성 ID를 문자열로 노출합니다.
    </Note>

    <Note>
    Control UI Talk는 Gateway가 발급한 임시 클라이언트 시크릿과
    OpenAI Realtime API에 대한 직접 브라우저 WebRTC SDP 교환을 사용하는 OpenAI 브라우저 Realtime 세션을 사용합니다.
    직접 OpenAI API 키가 구성되지 않은 경우 Gateway는 선택된 `openai-codex` OAuth
    프로필로 해당 클라이언트 시크릿을 발급할 수 있습니다. Gateway 릴레이와 Voice Call 백엔드 Realtime WebSocket 브리지는
    네이티브 OpenAI 엔드포인트에 동일한 OAuth 폴백을 사용합니다. Maintainer 실시간
    검증은
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`로 사용할 수 있습니다.
    OpenAI 구간은 비밀을 기록하지 않고 백엔드 WebSocket 브리지와 브라우저
    WebRTC SDP 교환을 모두 검증합니다.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 엔드포인트

번들된 `openai` 제공자는 기본 URL을 재정의하여 이미지 생성에
Azure OpenAI 리소스를 대상으로 지정할 수 있습니다. 이미지 생성 경로에서 OpenClaw는
`models.providers.openai.baseUrl`의 Azure 호스트 이름을 감지하고 자동으로
Azure의 요청 형태로 전환합니다.

<Note>
Realtime 음성은 별도의 구성 경로
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)를 사용하며
`models.providers.openai.baseUrl`의 영향을 받지 않습니다. Azure
설정은 [음성 및 말하기](#voice-and-speech) 아래의 **Realtime
voice** 아코디언을 참조하세요.
</Note>

다음과 같은 경우 Azure OpenAI를 사용하세요.

- 이미 Azure OpenAI 구독, 할당량 또는 엔터프라이즈 계약이 있는 경우
- Azure가 제공하는 지역 데이터 레지던시 또는 규정 준수 제어가 필요한 경우
- 기존 Azure 테넌시 내부에 트래픽을 유지하려는 경우

### 구성

번들된 `openai` 제공자를 통한 Azure 이미지 생성을 위해
`models.providers.openai.baseUrl`을 Azure 리소스로 지정하고 `apiKey`를
Azure OpenAI 키(OpenAI Platform 키가 아님)로 설정하세요.

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

OpenClaw는 Azure 이미지 생성 경로에 대해 다음 Azure 호스트 접미사를 인식합니다.

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

인식된 Azure 호스트의 이미지 생성 요청에 대해 OpenClaw는 다음을 수행합니다.

- `Authorization: Bearer` 대신 `api-key` 헤더를 보냅니다
- 배포 범위 경로(`/openai/deployments/{deployment}/...`)를 사용합니다
- 각 요청에 `?api-version=...`을 추가합니다
- Azure 이미지 생성 호출에 600초 기본 요청 제한 시간을 사용합니다.
  호출별 `timeoutMs` 값은 여전히 이 기본값을 재정의합니다.

다른 기본 URL(공개 OpenAI, OpenAI 호환 프록시)은 표준
OpenAI 이미지 요청 형태를 유지합니다.

<Note>
`openai` 제공자의 이미지 생성 경로에 대한 Azure 라우팅에는
OpenClaw 2026.4.22 이상이 필요합니다. 이전 버전은 사용자 지정
`openai.baseUrl`을 공개 OpenAI 엔드포인트처럼 처리하며 Azure
이미지 배포에 대해 실패합니다.
</Note>

### API 버전

Azure 이미지 생성 경로에 대해 특정 Azure 미리 보기 또는 GA 버전을 고정하려면
`AZURE_OPENAI_API_VERSION`을 설정하세요.

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

변수가 설정되지 않은 경우 기본값은 `2024-12-01-preview`입니다.

### 모델 이름은 배포 이름입니다

Azure OpenAI는 모델을 배포에 바인딩합니다. 번들된 `openai` 제공자를 통해 라우팅되는
Azure 이미지 생성 요청의 경우 OpenClaw의 `model` 필드는
공개 OpenAI 모델 ID가 아니라 Azure 포털에서 구성한 **Azure 배포 이름**이어야 합니다.

`gpt-image-2`를 제공하는 `gpt-image-2-prod`라는 배포를 생성한 경우:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

동일한 배포 이름 규칙이 번들된 `openai` 제공자를 통해 라우팅되는
이미지 생성 호출에도 적용됩니다.

### 지역별 사용 가능 여부

Azure 이미지 생성은 현재 일부 지역에서만 사용할 수 있습니다
(예: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). 배포를 생성하기 전에 Microsoft의 현재 지역 목록을 확인하고,
특정 모델이 해당 지역에서 제공되는지 확인하세요.

### 매개변수 차이

Azure OpenAI와 공개 OpenAI가 항상 동일한 이미지 매개변수를 허용하는 것은 아닙니다.
Azure는 공개 OpenAI가 허용하는 옵션(예: `gpt-image-2`의 특정
`background` 값)을 거부하거나 특정 모델 버전에서만 노출할 수 있습니다.
이러한 차이는 OpenClaw가 아니라 Azure와 기본 모델에서 비롯됩니다.
Azure 요청이 검증 오류로 실패하면 Azure 포털에서 특정 배포 및 API 버전이
지원하는 매개변수 집합을 확인하세요.

<Note>
Azure OpenAI는 네이티브 전송과 호환 동작을 사용하지만
OpenClaw의 숨겨진 attribution 헤더는 받지 않습니다. [고급 구성](#advanced-configuration)의 **네이티브 vs OpenAI 호환
경로** 아코디언을 참고하세요.

Azure에서 이미지 생성 외의 채팅 또는 Responses 트래픽에는
온보딩 플로우나 전용 Azure provider 구성을 사용하세요. `openai.baseUrl`만으로는
Azure API/auth 형태가 적용되지 않습니다. 별도의
`azure-openai-responses/*` provider가 있습니다. 아래의
서버 측 Compaction 아코디언을 참고하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="전송(WebSocket vs SSE)">
    OpenClaw는 `openai/*`에 대해 WebSocket 우선 및 SSE 폴백(`"auto"`)을 사용합니다.

    `"auto"` 모드에서 OpenClaw는 다음을 수행합니다.
    - SSE로 폴백하기 전에 초기 WebSocket 실패를 한 번 재시도합니다.
    - 실패 후 WebSocket을 약 60초 동안 성능 저하 상태로 표시하고 쿨다운 동안 SSE를 사용합니다.
    - 재시도와 재연결을 위해 안정적인 세션 및 턴 식별 헤더를 첨부합니다.
    - 전송 변형 간 사용량 카운터(`input_tokens` / `prompt_tokens`)를 정규화합니다.

    | 값 | 동작 |
    |-------|----------|
    | `"auto"`(기본값) | WebSocket 우선, SSE 폴백 |
    | `"sse"` | SSE만 강제 |
    | `"websocket"` | WebSocket만 강제 |

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
    OpenClaw는 `openai/*`에 대해 공유 빠른 모드 토글을 제공합니다.

    - **채팅/UI:** `/fast status|on|off`
    - **구성:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    활성화하면 OpenClaw는 빠른 모드를 OpenAI 우선순위 처리(`service_tier = "priority"`)에 매핑합니다. 기존 `service_tier` 값은 유지되며, 빠른 모드는 `reasoning` 또는 `text.verbosity`를 다시 쓰지 않습니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    세션 오버라이드는 구성보다 우선합니다. Sessions UI에서 세션 오버라이드를 지우면 세션이 구성된 기본값으로 돌아갑니다.
    </Note>

  </Accordion>

  <Accordion title="우선순위 처리(service_tier)">
    OpenAI의 API는 `service_tier`를 통해 우선순위 처리를 제공합니다. OpenClaw에서 모델별로 설정하세요.

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
    `serviceTier`는 네이티브 OpenAI 엔드포인트(`api.openai.com`)와 네이티브 Codex 엔드포인트(`chatgpt.com/backend-api`)에만 전달됩니다. 두 provider 중 하나를 프록시를 통해 라우팅하면 OpenClaw는 `service_tier`를 그대로 둡니다.
    </Warning>

  </Accordion>

  <Accordion title="서버 측 Compaction(Responses API)">
    직접 OpenAI Responses 모델(`api.openai.com`의 `openai/*`)의 경우, OpenAI Plugin의 Pi 하네스 스트림 래퍼가 서버 측 Compaction을 자동으로 활성화합니다.

    - `store: true`를 강제합니다(모델 호환성이 `supportsStore: false`로 설정하지 않는 한).
    - `context_management: [{ type: "compaction", compact_threshold: ... }]`를 주입합니다.
    - 기본 `compact_threshold`: `contextWindow`의 70%(사용할 수 없으면 `80000`)

    이는 기본 제공 Pi 하네스 경로와 임베디드 실행에서 사용되는 OpenAI provider 훅에 적용됩니다. 네이티브 Codex 앱 서버 하네스는 Codex를 통해 자체 컨텍스트를 관리하며 OpenAI의 기본 agent 경로 또는 provider/model 런타임 정책으로 구성됩니다.

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
    `responsesServerCompaction`은 `context_management` 주입만 제어합니다. 직접 OpenAI Responses 모델은 호환성이 `supportsStore: false`로 설정하지 않는 한 여전히 `store: true`를 강제합니다.
    </Note>

  </Accordion>

  <Accordion title="Strict-agentic GPT 모드">
    `openai/*`에서 GPT-5 제품군 실행의 경우, OpenClaw는 더 엄격한 임베디드 실행 계약을 사용할 수 있습니다.

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic`을 사용하면 OpenClaw는 다음을 수행합니다.
    - 도구 작업을 사용할 수 있을 때 계획만 있는 턴을 더 이상 성공적인 진행으로 처리하지 않습니다.
    - 즉시 실행하라는 지시와 함께 턴을 재시도합니다.
    - 실질적인 작업에 대해 `update_plan`을 자동으로 활성화합니다.
    - 모델이 계속 계획만 하고 실행하지 않으면 명시적인 차단 상태를 표시합니다.

    <Note>
    OpenAI 및 Codex GPT-5 제품군 실행에만 범위가 지정됩니다. 다른 provider와 이전 모델 제품군은 기본 동작을 유지합니다.
    </Note>

  </Accordion>

  <Accordion title="네이티브 vs OpenAI 호환 경로">
    OpenClaw는 직접 OpenAI, Codex, Azure OpenAI 엔드포인트를 일반 OpenAI 호환 `/v1` 프록시와 다르게 처리합니다.

    **네이티브 경로**(`openai/*`, Azure OpenAI):
    - OpenAI `none` effort를 지원하는 모델에 대해서만 `reasoning: { effort: "none" }`을 유지합니다.
    - `reasoning.effort: "none"`을 거부하는 모델 또는 프록시에 대해서는 비활성화된 reasoning을 생략합니다.
    - 도구 스키마의 기본값을 strict 모드로 설정합니다.
    - 검증된 네이티브 호스트에만 숨겨진 attribution 헤더를 첨부합니다.
    - OpenAI 전용 요청 shaping(`service_tier`, `store`, reasoning-compat, prompt-cache 힌트)을 유지합니다.

    **프록시/호환 경로:**
    - 더 느슨한 호환 동작을 사용합니다.
    - 네이티브가 아닌 `openai-completions` 페이로드에서 Completions `store`를 제거합니다.
    - OpenAI 호환 Completions 프록시를 위한 고급 `params.extra_body`/`params.extraBody` 통과 JSON을 허용합니다.
    - vLLM 같은 OpenAI 호환 Completions 프록시를 위해 `params.chat_template_kwargs`를 허용합니다.
    - strict 도구 스키마 또는 네이티브 전용 헤더를 강제하지 않습니다.

    Azure OpenAI는 네이티브 전송과 호환 동작을 사용하지만 숨겨진 attribution 헤더는 받지 않습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    Provider, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수와 provider 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수와 provider 선택.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보와 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
