---
read_when:
    - OpenClaw에서 OpenAI 모델을 사용하려는 경우
    - API 키 대신 Codex 구독 인증을 사용하려는 경우
    - 더 엄격한 GPT-5 에이전트 실행 동작이 필요합니다
summary: OpenClaw에서 API 키 또는 Codex 구독을 통해 OpenAI 사용
title: OpenAI
x-i18n:
    generated_at: "2026-05-03T06:22:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: cdffcdf53d9b17a19450c2ce47103db116e54a71a8dd432d981f5ece81cc38b3
    source_path: providers/openai.md
    workflow: 16
---

OpenAI는 GPT 모델용 개발자 API를 제공하며, Codex도 OpenAI의 Codex 클라이언트를 통해 ChatGPT 플랜 코딩 에이전트로 사용할 수 있습니다. OpenClaw는 설정이 예측 가능하게 유지되도록 이러한 표면을 분리합니다.

OpenClaw는 세 가지 OpenAI 계열 경로를 지원합니다. Codex 동작을 원하는 대부분의 ChatGPT/Codex 구독자는 네이티브 Codex 앱 서버 런타임을 사용해야 합니다. 모델 접두사는 공급자/모델 이름을 선택하고, 별도의 런타임 설정은 내장 에이전트 루프를 실행할 주체를 선택합니다.

- **API 키** - 사용량 기반 과금이 적용되는 직접 OpenAI Platform 액세스(`openai/*` 모델)
- **네이티브 Codex 런타임이 포함된 Codex 구독** - ChatGPT/Codex 로그인 및 Codex 앱 서버 실행(`openai/*` 모델과 `agents.defaults.agentRuntime.id: "codex"`)
- **PI를 통한 Codex 구독** - 일반 OpenClaw PI 러너를 사용하는 ChatGPT/Codex 로그인(`openai-codex/*` 모델)

OpenAI는 OpenClaw 같은 외부 도구와 워크플로에서 구독 OAuth 사용을 명시적으로 지원합니다.

공급자, 모델, 런타임, 채널은 서로 다른 계층입니다. 이 레이블들이 서로 혼동된다면 설정을 변경하기 전에 [에이전트 런타임](/ko/concepts/agent-runtimes)을 읽으세요.

## 빠른 선택

| 목표                                                 | 사용                                             | 참고                                                                      |
| ---------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| 네이티브 Codex 런타임이 포함된 ChatGPT/Codex 구독    | `openai/gpt-5.5`와 `agentRuntime.id: "codex"`    | 대부분의 사용자에게 권장되는 Codex 설정입니다. `openai-codex` 인증으로 로그인하세요. |
| 직접 API 키 과금                                    | `openai/gpt-5.5`                                 | `OPENAI_API_KEY`를 설정하거나 OpenAI API 키 온보딩을 실행하세요.          |
| PI를 통한 ChatGPT/Codex 구독 인증                    | `openai-codex/gpt-5.5`                           | 일반 PI 러너를 의도적으로 사용하려는 경우에만 사용하세요.                |
| 이미지 생성 또는 편집                                | `openai/gpt-image-2`                             | `OPENAI_API_KEY` 또는 OpenAI Codex OAuth와 함께 작동합니다.               |
| 투명 배경 이미지                                     | `openai/gpt-image-1.5`                           | `outputFormat=png` 또는 `webp`와 `openai.background=transparent`를 사용하세요. |

## 이름 매핑

이름은 비슷하지만 서로 바꿔 사용할 수 없습니다.

| 보이는 이름                         | 계층              | 의미                                                                                              |
| ---------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `openai`                           | 공급자 접두사     | 직접 OpenAI Platform API 경로입니다.                                                              |
| `openai-codex`                     | 공급자 접두사     | 일반 OpenClaw PI 러너를 통한 OpenAI Codex OAuth/구독 경로입니다.                                  |
| `codex` plugin                     | Plugin            | 네이티브 Codex 앱 서버 런타임과 `/codex` 채팅 제어를 제공하는 번들 OpenClaw Plugin입니다.          |
| `agentRuntime.id: codex`           | 에이전트 런타임   | 내장 턴에 대해 네이티브 Codex 앱 서버 하네스를 강제합니다.                                        |
| `/codex ...`                       | 채팅 명령 세트    | 대화에서 Codex 앱 서버 스레드를 바인딩/제어합니다.                                                |
| `runtime: "acp", agentId: "codex"` | ACP 세션 경로     | ACP/acpx를 통해 Codex를 실행하는 명시적 폴백 경로입니다.                                          |

즉, 설정에 `openai-codex/*`와 `codex` plugin이 둘 다 의도적으로 포함될 수 있습니다. PI를 통한 Codex OAuth를 원하면서 네이티브 `/codex` 채팅 제어도 사용할 수 있게 하려는 경우 이는 유효합니다. `openclaw doctor`는 해당 조합에 대해 경고하여 의도된 것인지 확인할 수 있게 해 주며, 이를 다시 작성하지는 않습니다.

<Note>
GPT-5.5는 직접 OpenAI Platform API 키 액세스와 구독/OAuth 경로 모두에서 사용할 수 있습니다. ChatGPT/Codex 구독과 네이티브 Codex 실행을 함께 사용하려면 `agentRuntime.id: "codex"`와 함께 `openai/gpt-5.5`를 사용하세요. PI를 통한 Codex OAuth에는 `openai-codex/gpt-5.5`만 사용하고, 직접 `OPENAI_API_KEY` 트래픽에는 Codex 런타임 재정의 없이 `openai/gpt-5.5`를 사용하세요.
</Note>

<Note>
OpenAI plugin을 활성화하거나 `openai-codex/*` 모델을 선택해도 번들 Codex 앱 서버 plugin이 활성화되지는 않습니다. OpenClaw는 `agentRuntime.id: "codex"`로 네이티브 Codex 하네스를 명시적으로 선택하거나 레거시 `codex/*` 모델 참조를 사용할 때만 해당 plugin을 활성화합니다.
번들 `codex` plugin이 활성화되어 있지만 `openai-codex/*`가 여전히 PI를 통해 확인되는 경우, `openclaw doctor`는 경고하고 경로는 변경하지 않습니다.
</Note>

## OpenClaw 기능 범위

| OpenAI 기능              | OpenClaw 표면                                             | 상태                                                   |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 채팅 / Responses          | `openai/<model>` 모델 공급자                               | 예                                                     |
| Codex 구독 모델           | `openai-codex/<model>`와 `openai-codex` OAuth              | 예                                                     |
| Codex 앱 서버 하네스      | `openai/<model>`와 `agentRuntime.id: codex`                | 예                                                     |
| 서버 측 웹 검색           | 네이티브 OpenAI Responses 도구                             | 예, 웹 검색이 활성화되어 있고 공급자가 고정되지 않은 경우 |
| 이미지                    | `image_generate`                                           | 예                                                     |
| 동영상                    | `video_generate`                                           | 예                                                     |
| 텍스트 음성 변환          | `messages.tts.provider: "openai"` / `tts`                  | 예                                                     |
| 배치 음성 텍스트 변환     | `tools.media.audio` / 미디어 이해                          | 예                                                     |
| 스트리밍 음성 텍스트 변환 | 음성 통화 `streaming.provider: "openai"`                   | 예                                                     |
| 실시간 음성               | 음성 통화 `realtime.provider: "openai"` / Control UI Talk  | 예                                                     |
| 임베딩                    | 메모리 임베딩 공급자                                      | 예                                                     |

## 메모리 임베딩

OpenClaw는 `memory_search` 색인 및 쿼리 임베딩에 OpenAI 또는 OpenAI 호환 임베딩 엔드포인트를 사용할 수 있습니다.

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

비대칭 임베딩 레이블이 필요한 OpenAI 호환 엔드포인트의 경우 `memorySearch` 아래에 `queryInputType`과 `documentInputType`을 설정하세요. OpenClaw는 이를 공급자별 `input_type` 요청 필드로 전달합니다. 쿼리 임베딩은 `queryInputType`을 사용하고, 색인된 메모리 청크와 배치 색인은 `documentInputType`을 사용합니다. 전체 예시는 [메모리 설정 참조](/ko/reference/memory-config#provider-specific-config)를 확인하세요.

## 시작하기

선호하는 인증 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API 키(OpenAI Platform)">
    **적합한 경우:** 직접 API 액세스와 사용량 기반 과금.

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
      <Step title="모델을 사용할 수 있는지 확인">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 경로 요약

    | 모델 참조              | 런타임 설정                         | 경로                       | 인증             |
    | ---------------------- | ----------------------------------- | -------------------------- | ---------------- |
    | `openai/gpt-5.5`       | 생략 / `agentRuntime.id: "pi"`      | 직접 OpenAI Platform API   | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | 생략 / `agentRuntime.id: "pi"`      | 직접 OpenAI Platform API   | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`          | Codex 앱 서버 하네스       | Codex 앱 서버    |

    <Note>
    `openai/*`는 Codex 앱 서버 하네스를 명시적으로 강제하지 않는 한 직접 OpenAI API 키 경로입니다. 기본 PI 러너를 통한 Codex OAuth에는 `openai-codex/*`를 사용하고, 네이티브 Codex 앱 서버 실행에는 `agentRuntime.id: "codex"`와 함께 `openai/gpt-5.5`를 사용하세요.
    </Note>

    ### 설정 예시

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw는 `openai/gpt-5.3-codex-spark`를 노출하지 않습니다. 라이브 OpenAI API 요청은 해당 모델을 거부하며, 현재 Codex 카탈로그도 이를 노출하지 않습니다.
    </Warning>

  </Tab>

  <Tab title="Codex 구독">
    **적합한 경우:** 별도의 API 키 대신 ChatGPT/Codex 구독을 네이티브 Codex 앱 서버 실행과 함께 사용. Codex 클라우드에는 ChatGPT 로그인이 필요합니다.

    <Steps>
      <Step title="Codex OAuth 실행">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        또는 OAuth를 직접 실행하세요.

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        헤드리스 또는 콜백을 사용하기 어려운 설정의 경우, localhost 브라우저 콜백 대신 ChatGPT 디바이스 코드 흐름으로 로그인하려면 `--device-code`를 추가하세요.

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="네이티브 Codex 런타임 사용">
        ```bash
        openclaw config set plugins.entries.codex '{"enabled":true}' --strict-json --merge
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        openclaw config set agents.defaults.agentRuntime '{"id":"codex"}' --strict-json
        ```
      </Step>
      <Step title="Codex 인증을 사용할 수 있는지 확인">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway가 실행된 후 채팅에서 `/codex status` 또는 `/codex models`를 보내 네이티브 앱 서버 런타임을 확인하세요.
      </Step>
    </Steps>

    ### 경로 요약

    | 모델 참조 | 런타임 설정 | 경로 | 인증 |
    |-----------|----------------|-------|------|
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | 네이티브 Codex 앱 서버 하네스 | Codex 로그인 또는 선택한 `openai-codex` 프로필 |
    | `openai-codex/gpt-5.5` | 생략 / `runtime: "pi"` | PI를 통한 ChatGPT/Codex OAuth | Codex 로그인 |
    | `openai-codex/gpt-5.4-mini` | 생략 / `runtime: "pi"` | PI를 통한 ChatGPT/Codex OAuth | Codex 로그인 |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | plugin이 명시적으로 `openai-codex`를 요구하지 않는 한 여전히 PI | Codex 로그인 |

    <Note>
    인증/프로필 명령에는 계속 `openai-codex` provider id를 사용하세요. `openai-codex/*` 모델 접두사도 Codex OAuth의 명시적 PI 경로입니다. 이는 번들된 Codex 앱 서버 하네스를 선택하거나 자동 활성화하지 않습니다. 일반적인 구독 및 네이티브 런타임 설정에서는 `openai-codex`로 로그인하되 모델 참조는 `openai/gpt-5.5`로 유지하고 `agentRuntime.id: "codex"`를 설정하세요.
    </Note>

    ### 구성 예시

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
          agentRuntime: { id: "codex" },
        },
      },
    }
    ```

    대신 일반 PI 실행기에서 Codex OAuth를 유지하려면 `openai-codex/gpt-5.5`를 사용하고 Codex 런타임 재정의는 생략하세요.

    <Note>
    온보딩은 더 이상 `~/.codex`에서 OAuth 자료를 가져오지 않습니다. 브라우저 OAuth(기본값) 또는 위의 디바이스 코드 흐름으로 로그인하세요. OpenClaw는 결과 자격 증명을 자체 에이전트 인증 저장소에서 관리합니다.
    </Note>

    ### 상태 표시기

    Chat `/status`는 현재 세션에서 어떤 모델 런타임이 활성 상태인지 보여줍니다. 기본 PI 하네스는 `Runtime: OpenClaw Pi Default`로 표시됩니다. 번들된 Codex 앱 서버 하네스가 선택되면 `/status`는 `Runtime: OpenAI Codex`를 표시합니다. 기존 세션은 기록된 하네스 ID를 유지하므로, `agentRuntime`을 변경한 뒤 `/status`에 새 PI/Codex 선택이 반영되길 원한다면 `/new` 또는 `/reset`을 사용하세요.

    ### Doctor 경고

    `openai-codex/*` 경로가 선택된 상태에서 번들된 `codex` Plugin이 활성화되어 있으면 `openclaw doctor`는 모델이 여전히 PI를 통해 해석된다고 경고합니다. 해당 PI 구독 인증 경로를 의도한 경우에만 구성을 그대로 유지하세요. 네이티브 Codex 앱 서버 실행을 원하면 `openai/<model>` 및 `agentRuntime.id: "codex"`로 전환하세요.

    ### 컨텍스트 창 한도

    OpenClaw는 모델 메타데이터와 런타임 컨텍스트 한도를 별도의 값으로 취급합니다.

    Codex OAuth를 통한 `openai-codex/gpt-5.5`의 경우:

    - 네이티브 `contextWindow`: `1000000`
    - 기본 런타임 `contextTokens` 한도: `272000`

    더 작은 기본 한도는 실제 사용에서 지연 시간과 품질 특성이 더 좋습니다. `contextTokens`로 재정의하세요.

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

    OpenClaw는 `gpt-5.5`가 존재할 때 업스트림 Codex 카탈로그 메타데이터를 사용합니다. 계정이 인증된 상태에서 실시간 Codex 검색이 `openai-codex/gpt-5.5` 행을 생략하면, OpenClaw는 해당 OAuth 모델 행을 합성하여 Cron, 하위 에이전트, 구성된 기본 모델 실행이 `Unknown model`로 실패하지 않도록 합니다.

  </Tab>
</Tabs>

## 네이티브 Codex 앱 서버 인증

네이티브 Codex 앱 서버 하네스는 `openai/*` 모델 참조와 `agentRuntime.id: "codex"`를 사용하지만, 인증은 여전히 계정 기반입니다. OpenClaw는 다음 순서로 인증을 선택합니다.

1. 에이전트에 바인딩된 명시적 OpenClaw `openai-codex` 인증 프로필.
2. 로컬 Codex CLI ChatGPT 로그인 같은 앱 서버의 기존 계정.
3. 로컬 stdio 앱 서버 실행에 한해, 앱 서버가 계정이 없다고 보고하고 여전히 OpenAI 인증이 필요할 때 `CODEX_API_KEY`, 그다음 `OPENAI_API_KEY`.

이는 Gateway 프로세스에 직접 OpenAI 모델 또는 임베딩용 `OPENAI_API_KEY`가 있더라도 로컬 ChatGPT/Codex 구독 로그인이 교체되지 않는다는 뜻입니다. env API 키 폴백은 로컬 stdio 무계정 경로에만 해당하며 WebSocket 앱 서버 연결로 전송되지 않습니다. 구독 스타일 Codex 프로필이 선택되면 OpenClaw는 생성된 stdio 앱 서버 하위 프로세스에서 `CODEX_API_KEY`와 `OPENAI_API_KEY`도 제외하고, 선택한 자격 증명을 앱 서버 로그인 RPC를 통해 전송합니다.

## 이미지 생성

번들된 `openai` Plugin은 `image_generate` 도구를 통해 이미지 생성을 등록합니다.
동일한 `openai/gpt-image-2` 모델 참조를 통해 OpenAI API 키 이미지 생성과 Codex OAuth 이미지 생성을 모두 지원합니다.

| 기능                      | OpenAI API 키                    | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| 모델 참조                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 인증                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 로그인            |
| 전송                      | OpenAI Images API                  | Codex Responses 백엔드               |
| 요청당 최대 이미지 수     | 4                                  | 4                                    |
| 편집 모드                 | 활성화됨(참조 이미지 최대 5개)     | 활성화됨(참조 이미지 최대 5개)       |
| 크기 재정의               | 2K/4K 크기 포함 지원               | 2K/4K 크기 포함 지원                 |
| 종횡비 / 해상도           | OpenAI Images API로 전달되지 않음  | 안전할 때 지원되는 크기로 매핑됨     |

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
공유 도구 매개변수, provider 선택, 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.
</Note>

`gpt-image-2`는 OpenAI 텍스트-이미지 생성과 이미지 편집 모두의 기본값입니다. `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`도 명시적 모델 재정의로 계속 사용할 수 있습니다. 투명 배경 PNG/WebP 출력에는 `openai/gpt-image-1.5`를 사용하세요. 현재 `gpt-image-2` API는 `background: "transparent"`를 거부합니다.

투명 배경 요청의 경우 에이전트는 `model: "openai/gpt-image-1.5"`, `outputFormat: "png"` 또는 `"webp"`, `background: "transparent"`로 `image_generate`를 호출해야 합니다. 이전 `openai.background` provider 옵션도 계속 허용됩니다. OpenClaw는 기본 `openai/gpt-image-2` 투명 요청을 `gpt-image-1.5`로 다시 작성하여 공개 OpenAI 및 OpenAI Codex OAuth 경로도 보호합니다. Azure 및 사용자 지정 OpenAI 호환 엔드포인트는 구성된 배포/모델 이름을 유지합니다.

동일한 설정은 헤드리스 CLI 실행에도 노출됩니다.

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

입력 파일에서 시작할 때 `openclaw infer image edit`와 동일한 `--output-format` 및 `--background` 플래그를 사용하세요.
`--openai-background`는 OpenAI 전용 별칭으로 계속 사용할 수 있습니다.

Codex OAuth 설치의 경우 동일한 `openai/gpt-image-2` 참조를 유지하세요. `openai-codex` OAuth 프로필이 구성되어 있으면 OpenClaw는 저장된 OAuth 액세스 토큰을 해석하고 Codex Responses 백엔드를 통해 이미지 요청을 보냅니다. 해당 요청에 대해 먼저 `OPENAI_API_KEY`를 시도하거나 API 키로 조용히 폴백하지 않습니다. 대신 직접 OpenAI Images API 경로를 원하면 API 키, 사용자 지정 기본 URL 또는 Azure 엔드포인트로 `models.providers.openai`를 명시적으로 구성하세요.
해당 사용자 지정 이미지 엔드포인트가 신뢰할 수 있는 LAN/개인 주소에 있다면 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`도 설정하세요. OpenClaw는 이 옵트인이 없으면 개인/내부 OpenAI 호환 이미지 엔드포인트를 계속 차단합니다.

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

| 기능             | 값                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 기본 모델        | `openai/sora-2`                                                                   |
| 모드             | 텍스트-비디오, 이미지-비디오, 단일 비디오 편집                                    |
| 참조 입력        | 이미지 1개 또는 비디오 1개                                                       |
| 크기 재정의      | 지원됨                                                                            |
| 기타 재정의      | `aspectRatio`, `resolution`, `audio`, `watermark`는 도구 경고와 함께 무시됨       |

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
공유 도구 매개변수, provider 선택, 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.
</Note>

## GPT-5 프롬프트 기여

OpenClaw는 provider 전반의 GPT-5 계열 실행에 공유 GPT-5 프롬프트 기여를 추가합니다. 이는 모델 ID에 따라 적용되므로 `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` 및 기타 호환 GPT-5 참조가 동일한 오버레이를 받습니다. 이전 GPT-4.x 모델에는 적용되지 않습니다.

번들된 네이티브 Codex 하네스는 Codex 앱 서버 개발자 지침을 통해 동일한 GPT-5 동작과 Heartbeat 오버레이를 사용하므로, `agentRuntime.id: "codex"`를 통해 강제로 실행되는 `openai/gpt-5.x` 세션은 Codex가 하네스 프롬프트의 나머지를 소유하더라도 동일한 후속 실행 및 사전 Heartbeat 지침을 유지합니다.

GPT-5 기여는 페르소나 지속성, 실행 안전성, 도구 규율, 출력 형식, 완료 검사, 검증을 위한 태그가 붙은 동작 계약을 추가합니다. 채널별 응답 및 무음 메시지 동작은 공유 OpenClaw 시스템 프롬프트와 아웃바운드 전달 정책에 남아 있습니다. GPT-5 지침은 일치하는 모델에 항상 활성화됩니다. 친근한 상호작용 스타일 레이어는 별도이며 구성할 수 있습니다.

| 값                     | 효과                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (기본값)  | 친근한 상호작용 스타일 레이어 활성화      |
| `"on"`                 | `"friendly"`의 별칭                       |
| `"off"`                | 친근한 스타일 레이어만 비활성화           |

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
값은 런타임에서 대소문자를 구분하지 않으므로 `"Off"`와 `"off"` 모두 친근한 스타일 레이어를 비활성화합니다.
</Tip>

<Note>
공유 `agents.defaults.promptOverlays.gpt5.personality` 설정이 지정되지 않은 경우, 레거시 `plugins.entries.openai.config.personality`는 호환성 폴백으로 계속 읽힙니다.
</Note>

## 음성 및 스피치

<AccordionGroup>
  <Accordion title="스피치 합성(TTS)">
    번들된 `openai` Plugin은 `messages.tts` 표면에 대한 스피치 합성을 등록합니다.

    | 설정 | 구성 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 음성 | `messages.tts.providers.openai.voice` | `coral` |
    | 속도 | `messages.tts.providers.openai.speed` | (설정되지 않음) |
    | 지침 | `messages.tts.providers.openai.instructions` | (설정되지 않음, `gpt-4o-mini-tts` 전용) |
    | 형식 | `messages.tts.providers.openai.responseFormat` | 음성 노트에는 `opus`, 파일에는 `mp3` |
    | API 키 | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY`로 대체 |
    | 기본 URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |
    | 추가 본문 | `messages.tts.providers.openai.extraBody` / `extra_body` | (설정되지 않음) |

    사용 가능한 모델: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. 사용 가능한 음성: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody`는 OpenClaw가 생성한 필드 뒤에 `/audio/speech` 요청 JSON으로 병합되므로, `lang` 같은 추가 키가 필요한 OpenAI 호환 엔드포인트에 사용하세요. 프로토타입 키는 무시됩니다.

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
    채팅 API 엔드포인트에 영향을 주지 않고 TTS 기본 URL을 재정의하려면 `OPENAI_TTS_BASE_URL`을 설정하세요.
    </Note>

  </Accordion>

  <Accordion title="Speech-to-text">
    번들로 제공되는 `openai` Plugin은 OpenClaw의 미디어 이해 전사 표면을 통해
    배치 음성-텍스트 변환을 등록합니다.

    - 기본 모델: `gpt-4o-transcribe`
    - 엔드포인트: OpenAI REST `/v1/audio/transcriptions`
    - 입력 경로: 멀티파트 오디오 파일 업로드
    - `tools.media.audio`를 사용하는 인바운드 오디오 전사가 있는 OpenClaw의 모든 위치에서 지원됩니다.
      여기에는 Discord 음성 채널 세그먼트와 채널 오디오 첨부 파일이 포함됩니다.

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

    공유 오디오 미디어 구성 또는 호출별 전사 요청에서 언어와 프롬프트 힌트가 제공되면
    OpenAI로 전달됩니다.

  </Accordion>

  <Accordion title="Realtime transcription">
    번들로 제공되는 `openai` Plugin은 Voice Call Plugin을 위한 실시간 전사를 등록합니다.

    | 설정 | 구성 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 언어 | `...openai.language` | (설정되지 않음) |
    | 프롬프트 | `...openai.prompt` | (설정되지 않음) |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `800` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | API 키 | `...openai.apiKey` | `OPENAI_API_KEY`로 대체 |

    <Note>
    G.711 u-law(`g711_ulaw` / `audio/pcmu`) 오디오와 함께 `wss://api.openai.com/v1/realtime`에 대한 WebSocket 연결을 사용합니다. 이 스트리밍 제공자는 Voice Call의 실시간 전사 경로용입니다. Discord 음성은 현재 짧은 세그먼트를 녹음하고 대신 배치 `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="Realtime voice">
    번들로 제공되는 `openai` Plugin은 Voice Call Plugin을 위한 실시간 음성을 등록합니다.

    | 설정 | 구성 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 음성 | `...openai.voice` | `alloy` |
    | 온도 | `...openai.temperature` | `0.8` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `500` |
    | API 키 | `...openai.apiKey` | `OPENAI_API_KEY`로 대체 |

    <Note>
    백엔드 실시간 브리지에 대해 `azureEndpoint` 및 `azureDeployment` 구성 키를 통해 Azure OpenAI를 지원합니다. 양방향 도구 호출을 지원합니다. G.711 u-law 오디오 형식을 사용합니다.
    </Note>

    <Note>
    Control UI Talk는 Gateway가 발급한 임시 클라이언트 시크릿과
    OpenAI Realtime API에 대한 직접 브라우저 WebRTC SDP 교환을 사용해
    OpenAI 브라우저 실시간 세션을 사용합니다. Maintainer 라이브 검증은
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`로 사용할 수 있습니다.
    OpenAI 구간은 Node에서 클라이언트 시크릿을 발급하고, 가짜 마이크 미디어로
    브라우저 SDP 오퍼를 생성하고, 이를 OpenAI에 게시한 뒤, 시크릿을 로깅하지 않고
    SDP 응답을 적용합니다.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 엔드포인트

번들로 제공되는 `openai` 제공자는 기본 URL을 재정의하여 이미지
생성에 Azure OpenAI 리소스를 대상으로 삼을 수 있습니다. 이미지 생성 경로에서 OpenClaw는
`models.providers.openai.baseUrl`의 Azure 호스트 이름을 감지하고
Azure의 요청 형태로 자동 전환합니다.

<Note>
실시간 음성은 별도의 구성 경로
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)를 사용하며
`models.providers.openai.baseUrl`의 영향을 받지 않습니다. 해당 Azure
설정은 [음성 및 말하기](#voice-and-speech) 아래의 **Realtime
voice** Accordion을 참조하세요.
</Note>

다음과 같은 경우 Azure OpenAI를 사용하세요.

- 이미 Azure OpenAI 구독, 할당량 또는 엔터프라이즈 계약이 있는 경우
- Azure가 제공하는 지역 데이터 거주성 또는 규정 준수 제어가 필요한 경우
- 기존 Azure 테넌시 내부에 트래픽을 유지하려는 경우

### 구성

번들로 제공되는 `openai` 제공자를 통해 Azure 이미지 생성을 사용하려면
`models.providers.openai.baseUrl`이 Azure 리소스를 가리키도록 하고 `apiKey`를
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

OpenClaw는 Azure 이미지 생성
경로에 대해 다음 Azure 호스트 접미사를 인식합니다.

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

인식된 Azure 호스트의 이미지 생성 요청에 대해 OpenClaw는 다음을 수행합니다.

- `Authorization: Bearer` 대신 `api-key` 헤더를 보냅니다.
- 배포 범위 경로(`/openai/deployments/{deployment}/...`)를 사용합니다.
- 각 요청에 `?api-version=...`을 추가합니다.
- Azure 이미지 생성 호출에 600초 기본 요청 제한 시간을 사용합니다.
  호출별 `timeoutMs` 값은 여전히 이 기본값을 재정의합니다.

다른 기본 URL(공개 OpenAI, OpenAI 호환 프록시)은 표준
OpenAI 이미지 요청 형태를 유지합니다.

<Note>
`openai` 제공자의 이미지 생성 경로에 대한 Azure 라우팅에는
OpenClaw 2026.4.22 이상이 필요합니다. 이전 버전은 사용자 지정
`openai.baseUrl`을 공개 OpenAI 엔드포인트처럼 처리하며 Azure
이미지 배포에서는 실패합니다.
</Note>

### API 버전

Azure 이미지 생성 경로에 대해 특정 Azure 프리뷰 또는 GA 버전을 고정하려면
`AZURE_OPENAI_API_VERSION`을 설정하세요.

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

변수가 설정되지 않은 경우 기본값은 `2024-12-01-preview`입니다.

### 모델 이름은 배포 이름입니다

Azure OpenAI는 모델을 배포에 바인딩합니다. 번들로 제공되는 `openai` 제공자를 통해
라우팅되는 Azure 이미지 생성 요청의 경우 OpenClaw의 `model` 필드는
공개 OpenAI 모델 ID가 아니라 Azure 포털에서 구성한 **Azure 배포 이름**이어야 합니다.

`gpt-image-2`를 제공하는 `gpt-image-2-prod`라는 배포를 생성한 경우:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

동일한 배포 이름 규칙이 번들로 제공되는 `openai` 제공자를 통해 라우팅되는
이미지 생성 호출에도 적용됩니다.

### 지역 가용성

Azure 이미지 생성은 현재 일부 지역에서만 사용할 수 있습니다
(예: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). 배포를 생성하기 전에 Microsoft의 현재 지역 목록을 확인하고
특정 모델이 해당 지역에서 제공되는지 확인하세요.

### 매개변수 차이

Azure OpenAI와 공개 OpenAI가 항상 동일한 이미지 매개변수를 허용하는 것은 아닙니다.
Azure는 공개 OpenAI가 허용하는 옵션(예: `gpt-image-2`의 특정
`background` 값)을 거부하거나 특정 모델 버전에서만 노출할 수 있습니다.
이러한 차이는 OpenClaw가 아니라 Azure와 기본 모델에서 비롯됩니다.
Azure 요청이 검증 오류로 실패하면 Azure 포털에서 특정 배포와 API 버전이
지원하는 매개변수 집합을 확인하세요.

<Note>
Azure OpenAI는 네이티브 전송 및 호환 동작을 사용하지만
OpenClaw의 숨겨진 기여 표시 헤더는 받지 않습니다. [고급 구성](#advanced-configuration) 아래의
**Native vs OpenAI-compatible
routes** Accordion을 참조하세요.

Azure에서 채팅 또는 Responses 트래픽(이미지 생성을 넘어서는 경우)을 사용하려면
온보딩 흐름 또는 전용 Azure 제공자 구성을 사용하세요. `openai.baseUrl`만으로는
Azure API/인증 형태가 적용되지 않습니다. 별도의
`azure-openai-responses/*` 제공자가 있습니다. 아래의 서버 측 Compaction Accordion을 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="Transport (WebSocket vs SSE)">
    OpenClaw는 `openai/*`와 `openai-codex/*` 모두에 대해 SSE 대체(`"auto"`)가 있는 WebSocket 우선 방식을 사용합니다.

    `"auto"` 모드에서 OpenClaw는 다음을 수행합니다.
    - SSE로 대체하기 전에 초기 WebSocket 실패를 한 번 재시도합니다.
    - 실패 후 WebSocket을 약 60초 동안 성능 저하 상태로 표시하고 쿨다운 중에는 SSE를 사용합니다.
    - 재시도 및 재연결을 위해 안정적인 세션 및 턴 ID 헤더를 첨부합니다.
    - 전송 변형 전반에서 사용량 카운터(`input_tokens` / `prompt_tokens`)를 정규화합니다.

    | 값 | 동작 |
    |-------|----------|
    | `"auto"` (기본값) | WebSocket 우선, SSE 대체 |
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
            "openai-codex/gpt-5.5": {
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

  <Accordion title="WebSocket warm-up">
    OpenClaw는 첫 턴 지연 시간을 줄이기 위해 `openai/*`와 `openai-codex/*`에 대해 기본적으로 WebSocket 워밍업을 활성화합니다.

    ```json5
    // Disable warm-up
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Fast mode">
    OpenClaw는 `openai/*`와 `openai-codex/*`에 대한 공유 빠른 모드 토글을 노출합니다.

    - **채팅/UI:** `/fast status|on|off`
    - **구성:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    활성화되면 OpenClaw는 빠른 모드를 OpenAI 우선 처리(`service_tier = "priority"`)에 매핑합니다. 기존 `service_tier` 값은 보존되며, 빠른 모드는 `reasoning` 또는 `text.verbosity`를 다시 쓰지 않습니다.

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
    세션 재정의가 구성보다 우선합니다. Sessions UI에서 세션 재정의를 지우면 세션이 구성된 기본값으로 돌아갑니다.
    </Note>

  </Accordion>

  <Accordion title="Priority processing (service_tier)">
    OpenAI의 API는 `service_tier`를 통해 우선 처리를 노출합니다. OpenClaw에서 모델별로 설정하세요.

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
    `serviceTier`는 네이티브 OpenAI 엔드포인트(`api.openai.com`)와 네이티브 Codex 엔드포인트(`chatgpt.com/backend-api`)에만 전달됩니다. 두 제공자 중 하나를 프록시를 통해 라우팅하는 경우 OpenClaw는 `service_tier`를 그대로 둡니다.
    </Warning>

  </Accordion>

  <Accordion title="서버 측 Compaction (Responses API)">
    직접 OpenAI Responses 모델(`api.openai.com`의 `openai/*`)의 경우, OpenAI Plugin의 Pi 하네스 스트림 래퍼가 서버 측 Compaction을 자동으로 활성화합니다.

    - `store: true`를 강제합니다(모델 호환성이 `supportsStore: false`를 설정한 경우 제외).
    - `context_management: [{ type: "compaction", compact_threshold: ... }]`를 주입합니다.
    - 기본 `compact_threshold`: `contextWindow`의 70%(사용할 수 없는 경우 `80000`)

    이는 기본 제공 Pi 하네스 경로와 임베디드 실행에서 사용하는 OpenAI 제공자 훅에 적용됩니다. 네이티브 Codex 앱 서버 하네스는 Codex를 통해 자체 컨텍스트를 관리하며 `agents.defaults.agentRuntime.id`로 별도로 구성됩니다.

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
    `responsesServerCompaction`은 `context_management` 주입만 제어합니다. 직접 OpenAI Responses 모델은 호환성이 `supportsStore: false`를 설정하지 않는 한 여전히 `store: true`를 강제합니다.
    </Note>

  </Accordion>

  <Accordion title="엄격한 agentic GPT 모드">
    `openai/*`의 GPT-5 계열 실행에서 OpenClaw는 더 엄격한 임베디드 실행 계약을 사용할 수 있습니다.

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
    - 즉시 실행하도록 유도하여 해당 턴을 다시 시도합니다.
    - 상당한 작업에 대해 `update_plan`을 자동으로 활성화합니다.
    - 모델이 행동하지 않고 계속 계획만 세우는 경우 명시적인 차단 상태를 표시합니다.

    <Note>
    OpenAI 및 Codex GPT-5 계열 실행에만 적용됩니다. 다른 제공자와 이전 모델 계열은 기본 동작을 유지합니다.
    </Note>

  </Accordion>

  <Accordion title="네이티브 경로와 OpenAI 호환 경로">
    OpenClaw는 직접 OpenAI, Codex, Azure OpenAI 엔드포인트를 일반 OpenAI 호환 `/v1` 프록시와 다르게 처리합니다.

    **네이티브 경로**(`openai/*`, Azure OpenAI):
    - OpenAI `none` effort를 지원하는 모델에 대해서만 `reasoning: { effort: "none" }`을 유지합니다.
    - `reasoning.effort: "none"`을 거부하는 모델 또는 프록시에서는 비활성화된 reasoning을 생략합니다.
    - 도구 스키마는 기본적으로 strict 모드를 사용합니다.
    - 검증된 네이티브 호스트에만 숨겨진 attribution 헤더를 첨부합니다.
    - OpenAI 전용 요청 형성(`service_tier`, `store`, reasoning 호환성, prompt-cache 힌트)을 유지합니다.

    **프록시/호환 경로:**
    - 더 느슨한 호환 동작을 사용합니다.
    - 네이티브가 아닌 `openai-completions` 페이로드에서 Completions `store`를 제거합니다.
    - OpenAI 호환 Completions 프록시에 대해 고급 `params.extra_body`/`params.extraBody` 패스스루 JSON을 허용합니다.
    - vLLM 같은 OpenAI 호환 Completions 프록시에 대해 `params.chat_template_kwargs`를 허용합니다.
    - strict 도구 스키마나 네이티브 전용 헤더를 강제하지 않습니다.

    Azure OpenAI는 네이티브 전송 및 호환 동작을 사용하지만 숨겨진 attribution 헤더는 받지 않습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공유 이미지 도구 매개변수와 제공자 선택입니다.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공유 비디오 도구 매개변수와 제공자 선택입니다.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보와 자격 증명 재사용 규칙입니다.
  </Card>
</CardGroup>
