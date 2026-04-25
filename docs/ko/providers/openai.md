---
read_when:
    - OpenClaw에서 OpenAI 모델을 사용하려고 합니다.
    - API 키 대신 Codex 구독 auth를 사용하려고 합니다.
    - 더 엄격한 GPT-5 agent 실행 동작이 필요합니다.
summary: OpenClaw에서 API 키 또는 Codex 구독으로 OpenAI 사용하기
title: OpenAI
x-i18n:
    generated_at: "2026-04-25T18:21:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f099227b8c8be3a4e919ea286fcede1e4e47be60c7593eb63b4cbbe85aa8389
    source_path: providers/openai.md
    workflow: 15
---

OpenAI는 GPT 모델용 개발자 API를 제공합니다. OpenClaw는 OpenAI 계열 경로를 세 가지 지원합니다. 모델 접두사가 경로를 선택합니다:

- **API key** — 사용량 기반 과금의 직접 OpenAI Platform 액세스(`openai/*` 모델)
- **PI를 통한 Codex 구독** — 구독 액세스를 사용하는 ChatGPT/Codex 로그인(`openai-codex/*` 모델)
- **Codex app-server harness** — 네이티브 Codex app-server 실행(`openai/*` 모델 + `agents.defaults.embeddedHarness.runtime: "codex"`)

OpenAI는 OpenClaw 같은 외부 도구 및 워크플로에서 구독 OAuth 사용을 명시적으로 지원합니다.

provider, 모델, runtime, 채널은 서로 별개의 계층입니다. 이 라벨들이
혼동된다면 config를 변경하기 전에 [Agent runtimes](/ko/concepts/agent-runtimes)를 읽으세요.

## 빠른 선택

| 목표                                          | 사용 방법                                                 | 참고                                                                         |
| --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 직접 API-key 과금                             | `openai/gpt-5.5`                                         | `OPENAI_API_KEY`를 설정하거나 OpenAI API-key 온보딩을 실행하세요.            |
| ChatGPT/Codex 구독 auth를 사용하는 GPT-5.5    | `openai-codex/gpt-5.5`                                   | Codex OAuth용 기본 PI 경로입니다. 구독 설정의 첫 선택으로 가장 적합합니다.   |
| 네이티브 Codex app-server 동작을 사용하는 GPT-5.5 | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | 해당 모델 ref에 대해 Codex app-server harness를 강제합니다.                  |
| 이미지 생성 또는 편집                         | `openai/gpt-image-2`                                     | `OPENAI_API_KEY` 또는 OpenAI Codex OAuth와 함께 작동합니다.                  |

<Note>
GPT-5.5는 직접 OpenAI Platform API-key 액세스와
구독/OAuth 경로 모두에서 사용할 수 있습니다. 직접 `OPENAI_API_KEY`
트래픽에는 `openai/gpt-5.5`를, PI를 통한 Codex OAuth에는
`openai-codex/gpt-5.5`를, 네이티브 Codex
app-server harness에는 `embeddedHarness.runtime: "codex"`와 함께 `openai/gpt-5.5`를 사용하세요.
</Note>

<Note>
OpenAI Plugin을 활성화하거나 `openai-codex/*` 모델을 선택해도
번들된 Codex app-server Plugin이 활성화되지는 않습니다. OpenClaw는
`embeddedHarness.runtime: "codex"`로 네이티브 Codex harness를 명시적으로 선택하거나
레거시 `codex/*` 모델 ref를 사용할 때만 해당 Plugin을 활성화합니다.
</Note>

## OpenClaw 기능 지원 범위

| OpenAI 기능              | OpenClaw 표면                                            | 상태                                                   |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------ |
| Chat / Responses         | `openai/<model>` 모델 provider                           | 예                                                     |
| Codex 구독 모델          | `openai-codex/<model>` + `openai-codex` OAuth            | 예                                                     |
| Codex app-server harness | `openai/<model>` + `embeddedHarness.runtime: codex`      | 예                                                     |
| 서버 측 웹 검색          | 네이티브 OpenAI Responses 도구                           | 예, 웹 검색이 활성화되어 있고 provider가 고정되지 않은 경우 |
| 이미지                   | `image_generate`                                         | 예                                                     |
| 비디오                   | `video_generate`                                         | 예                                                     |
| 텍스트 음성 변환         | `messages.tts.provider: "openai"` / `tts`                | 예                                                     |
| 배치 음성-텍스트 변환    | `tools.media.audio` / 미디어 이해                        | 예                                                     |
| 스트리밍 음성-텍스트 변환 | Voice Call `streaming.provider: "openai"`                | 예                                                     |
| 실시간 음성              | Voice Call `realtime.provider: "openai"` / Control UI Talk | 예                                                   |
| 임베딩                   | 메모리 임베딩 provider                                   | 예                                                     |

## 시작하기

원하는 auth 방법을 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="API key (OpenAI Platform)">
    **가장 적합한 경우:** 직접 API 액세스 및 사용량 기반 과금.

    <Steps>
      <Step title="API key 가져오기">
        [OpenAI Platform dashboard](https://platform.openai.com/api-keys)에서 API key를 생성하거나 복사하세요.
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        또는 key를 직접 전달하세요:

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

    | Model ref | 경로 | Auth |
    |-----------|-------|------|
    | `openai/gpt-5.5` | 직접 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini` | 직접 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    `openai/*`는 Codex app-server harness를 명시적으로 강제하지 않는 한
    직접 OpenAI API-key 경로입니다. 기본 PI runner를 통한 Codex OAuth에는
    `openai-codex/*`를 사용하거나, 네이티브 Codex app-server 실행에는
    `embeddedHarness.runtime: "codex"`와 함께 `openai/gpt-5.5`를 사용하세요.
    </Note>

    ### config 예시

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw는 `openai/gpt-5.3-codex-spark`를 **노출하지 않습니다**. 실제 OpenAI API 요청은 해당 모델을 거부하며, 현재 Codex 카탈로그도 이를 노출하지 않습니다.
    </Warning>

  </Tab>

  <Tab title="Codex 구독">
    **가장 적합한 경우:** 별도의 API key 대신 ChatGPT/Codex 구독 사용. Codex cloud에는 ChatGPT 로그인이 필요합니다.

    <Steps>
      <Step title="Codex OAuth 실행">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        또는 OAuth를 직접 실행하세요:

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        헤드리스 환경 또는 콜백에 불리한 설정에서는 localhost 브라우저 콜백 대신 ChatGPT device-code 흐름으로 로그인하려면 `--device-code`를 추가하세요:

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="모델을 사용할 수 있는지 확인">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 경로 요약

    | Model ref | 경로 | Auth |
    |-----------|-------|------|
    | `openai-codex/gpt-5.5` | PI를 통한 ChatGPT/Codex OAuth | Codex 로그인 |
    | `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Codex app-server harness | Codex app-server auth |

    <Note>
    auth/profile 명령에는 계속 `openai-codex` provider id를 사용하세요.
    `openai-codex/*` 모델 접두사는 Codex OAuth용 명시적 PI 경로이기도 합니다.
    이는 번들된 Codex app-server harness를 선택하거나 자동 활성화하지 않습니다.
    </Note>

    ### config 예시

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    온보딩은 더 이상 `~/.codex`에서 OAuth 자료를 가져오지 않습니다. 브라우저 OAuth(기본값) 또는 위의 device-code 흐름으로 로그인하세요. OpenClaw는 생성된 자격 증명을 자체 agent auth 저장소에서 관리합니다.
    </Note>

    ### 상태 표시기

    채팅 `/status`는 현재 세션에서 어떤 모델 runtime이 활성 상태인지 보여줍니다.
    기본 PI harness는 `Runtime: OpenClaw Pi Default`로 표시됩니다. 번들된
    Codex app-server harness가 선택되면 `/status`는
    `Runtime: OpenAI Codex`를 표시합니다. 기존 세션은 기록된 harness id를 유지하므로,
    `/status`에 새 PI/Codex 선택이 반영되게 하려면 `embeddedHarness` 변경 후 `/new` 또는 `/reset`을 사용하세요.

    ### 컨텍스트 창 상한

    OpenClaw는 모델 metadata와 runtime 컨텍스트 상한을 별개의 값으로 취급합니다.

    Codex OAuth를 통한 `openai-codex/gpt-5.5`의 경우:

    - 네이티브 `contextWindow`: `1000000`
    - 기본 runtime `contextTokens` 상한: `272000`

    더 작은 기본 상한은 실제 사용에서 더 나은 지연 시간과 품질 특성을 보입니다. `contextTokens`로 이를 재정의하세요:

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
    네이티브 모델 metadata를 선언하려면 `contextWindow`를 사용하세요. runtime 컨텍스트 예산을 제한하려면 `contextTokens`를 사용하세요.
    </Note>

    ### 카탈로그 복구

    OpenClaw는 `gpt-5.5`가 존재할 때
    업스트림 Codex 카탈로그 metadata를 사용합니다. 실제 Codex 검색에서
    계정이 인증된 상태인데도 `openai-codex/gpt-5.5` 행이 빠지면
    OpenClaw는 해당 OAuth 모델 행을 합성하여
    Cron, 하위 agent, 구성된 기본 모델 실행이
    `Unknown model`로 실패하지 않도록 합니다.

  </Tab>
</Tabs>

## 이미지 생성

번들된 `openai` Plugin은 `image_generate` 도구를 통해 이미지 생성을 등록합니다.
이는 OpenAI API-key 이미지 생성과 Codex OAuth 이미지
생성을 동일한 `openai/gpt-image-2` 모델 ref를 통해 모두 지원합니다.

| 기능                      | OpenAI API key                     | Codex OAuth                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Model ref                 | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Auth                      | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 로그인            |
| 전송 방식                 | OpenAI Images API                  | Codex Responses backend              |
| 요청당 최대 이미지 수     | 4                                  | 4                                    |
| 편집 모드                 | 활성화됨(최대 5개의 참조 이미지)   | 활성화됨(최대 5개의 참조 이미지)     |
| 크기 재정의               | 2K/4K 크기 포함 지원               | 2K/4K 크기 포함 지원                 |
| 종횡비 / 해상도           | OpenAI Images API로 전달되지 않음  | 안전한 경우 지원되는 크기로 매핑됨   |

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
공통 도구 매개변수, provider 선택, 장애 조치 동작은 [이미지 생성](/ko/tools/image-generation)을 참조하세요.
</Note>

`gpt-image-2`는 OpenAI 텍스트-이미지 생성과 이미지
편집 모두의 기본값입니다. `gpt-image-1`도 명시적 모델 재정의로는 계속 사용할 수 있지만, 새로운
OpenAI 이미지 워크플로에는 `openai/gpt-image-2`를 사용해야 합니다.

Codex OAuth 설치의 경우에도 동일한 `openai/gpt-image-2` ref를 유지하세요. `openai-codex` OAuth profile이 구성되어 있으면 OpenClaw는 저장된 해당 OAuth 액세스 토큰을 확인하고 이미지 요청을 Codex Responses backend로 전송합니다. 이 요청에 대해 먼저 `OPENAI_API_KEY`를 시도하거나 API key로 조용히 fallback하지 않습니다. 직접 OpenAI Images API 경로를 사용하려면 API key, 사용자 지정 base URL, 또는 Azure endpoint로 `models.providers.openai`를 명시적으로 구성하세요.
해당 사용자 지정 이미지 endpoint가 신뢰된 LAN/사설 주소에 있다면 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`도 설정하세요. 이 opt-in이 없으면 OpenClaw는 사설/내부 OpenAI 호환 이미지 endpoint를 계속 차단합니다.

생성:

```
/tool image_generate model=openai/gpt-image-2 prompt="macOS용 OpenClaw의 세련된 출시 포스터" size=3840x2160 count=1
```

편집:

```
/tool image_generate model=openai/gpt-image-2 prompt="객체의 형태는 유지하고 재질을 반투명 유리로 변경" image=/path/to/reference.png size=1024x1536
```

## 비디오 생성

번들된 `openai` Plugin은 `video_generate` 도구를 통해 비디오 생성을 등록합니다.

| 기능             | 값                                                                                |
| ---------------- | --------------------------------------------------------------------------------- |
| 기본 모델        | `openai/sora-2`                                                                   |
| 모드             | 텍스트-비디오, 이미지-비디오, 단일 비디오 편집                                    |
| 참조 입력        | 이미지 1개 또는 비디오 1개                                                         |
| 크기 재정의      | 지원됨                                                                            |
| 기타 재정의      | `aspectRatio`, `resolution`, `audio`, `watermark`는 도구 경고와 함께 무시됨      |

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
공통 도구 매개변수, provider 선택, 장애 조치 동작은 [비디오 생성](/ko/tools/video-generation)을 참조하세요.
</Note>

## GPT-5 프롬프트 기여

OpenClaw는 provider 전반의 GPT-5 계열 실행에 대해 공유 GPT-5 프롬프트 기여를 추가합니다. 이는 모델 id 기준으로 적용되므로 `openai-codex/gpt-5.5`, `openai/gpt-5.5`, `openrouter/openai/gpt-5.5`, `opencode/gpt-5.5` 및 기타 호환되는 GPT-5 ref는 동일한 오버레이를 받습니다. 이전 GPT-4.x 모델에는 적용되지 않습니다.

번들된 네이티브 Codex harness는 Codex app-server developer instruction을 통해 동일한 GPT-5 동작과 Heartbeat 오버레이를 사용하므로, `embeddedHarness.runtime: "codex"`로 강제된 `openai/gpt-5.x` 세션도 나머지 harness 프롬프트를 Codex가 소유하더라도 동일한 후속 실행 및 선제적 Heartbeat 지침을 유지합니다.

GPT-5 기여는 페르소나 유지, 실행 안전성, 도구 절제, 출력 형태, 완료 검사, 검증을 위한 태그된 동작 계약을 추가합니다. 채널별 응답 및 무음 메시지 동작은 공유 OpenClaw 시스템 프롬프트와 outbound 전달 정책에 남아 있습니다. GPT-5 지침은 일치하는 모델에 항상 활성화됩니다. 친화적 상호작용 스타일 계층은 별개이며 구성 가능합니다.

| 값                     | 효과                                      |
| ---------------------- | ----------------------------------------- |
| `"friendly"` (기본값)  | 친화적 상호작용 스타일 계층 활성화        |
| `"on"`                 | `"friendly"`의 별칭                       |
| `"off"`                | 친화적 스타일 계층만 비활성화             |

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
런타임에서 값은 대소문자를 구분하지 않으므로 `"Off"`와 `"off"`는 모두 친화적 스타일 계층을 비활성화합니다.
</Tip>

<Note>
공유 `agents.defaults.promptOverlays.gpt5.personality` 설정이 없는 경우, 레거시 `plugins.entries.openai.config.personality`도 호환성 fallback으로 계속 읽습니다.
</Note>

## 음성 및 speech

<AccordionGroup>
  <Accordion title="음성 합성 (TTS)">
    번들된 `openai` Plugin은 `messages.tts` 표면에 대해 음성 합성을 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 음성 | `messages.tts.providers.openai.voice` | `coral` |
    | 속도 | `messages.tts.providers.openai.speed` | (설정 안 됨) |
    | 지침 | `messages.tts.providers.openai.instructions` | (설정 안 됨, `gpt-4o-mini-tts` 전용) |
    | 형식 | `messages.tts.providers.openai.responseFormat` | 음성 노트는 `opus`, 파일은 `mp3` |
    | API key | `messages.tts.providers.openai.apiKey` | `OPENAI_API_KEY`로 fallback |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    사용 가능한 모델: `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. 사용 가능한 음성: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`, `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

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
    채팅 API endpoint에 영향을 주지 않고 TTS base URL을 재정의하려면 `OPENAI_TTS_BASE_URL`을 설정하세요.
    </Note>

  </Accordion>

  <Accordion title="음성-텍스트 변환">
    번들된 `openai` Plugin은
    OpenClaw의 미디어 이해 전사 표면을 통해 배치 음성-텍스트 변환을 등록합니다.

    - 기본 모델: `gpt-4o-transcribe`
    - Endpoint: OpenAI REST `/v1/audio/transcriptions`
    - 입력 경로: multipart 오디오 파일 업로드
    - OpenClaw에서 inbound 오디오 전사가
      `tools.media.audio`를 사용하는 모든 위치에서 지원되며, 여기에는 Discord 음성 채널 세그먼트와 채널
      오디오 첨부 파일이 포함됩니다

    inbound 오디오 전사에 OpenAI를 강제하려면:

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

    언어 및 프롬프트 힌트는
    공유 오디오 미디어 config 또는 호출별 전사 요청에서 제공될 경우 OpenAI로 전달됩니다.

  </Accordion>

  <Accordion title="실시간 전사">
    번들된 `openai` Plugin은 Voice Call Plugin에 대해 실시간 전사를 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 언어 | `...openai.language` | (설정 안 됨) |
    | 프롬프트 | `...openai.prompt` | (설정 안 됨) |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `800` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY`로 fallback |

    <Note>
    `wss://api.openai.com/v1/realtime`에 대한 WebSocket 연결과 G.711 u-law (`g711_ulaw` / `audio/pcmu`) 오디오를 사용합니다. 이 스트리밍 provider는 Voice Call의 실시간 전사 경로용입니다. Discord 음성은 현재 짧은 세그먼트를 녹음하고 대신 배치 `tools.media.audio` 전사 경로를 사용합니다.
    </Note>

  </Accordion>

  <Accordion title="실시간 음성">
    번들된 `openai` Plugin은 Voice Call Plugin에 대해 실시간 음성을 등록합니다.

    | 설정 | Config 경로 | 기본값 |
    |---------|------------|---------|
    | 모델 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
    | 음성 | `...openai.voice` | `alloy` |
    | Temperature | `...openai.temperature` | `0.8` |
    | VAD 임계값 | `...openai.vadThreshold` | `0.5` |
    | 무음 지속 시간 | `...openai.silenceDurationMs` | `500` |
    | API key | `...openai.apiKey` | `OPENAI_API_KEY`로 fallback |

    <Note>
    `azureEndpoint` 및 `azureDeployment` config 키를 통해 Azure OpenAI를 지원합니다. 양방향 도구 호출을 지원합니다. G.711 u-law 오디오 형식을 사용합니다.
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI endpoint

번들된 `openai` provider는 base URL을 재정의하여 이미지
생성용 Azure OpenAI 리소스를 대상으로 지정할 수 있습니다. 이미지 생성 경로에서 OpenClaw는
`models.providers.openai.baseUrl`의 Azure 호스트명을 감지하고
자동으로 Azure 요청 형식으로 전환합니다.

<Note>
실시간 음성은 별도의 구성 경로
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
를 사용하며 `models.providers.openai.baseUrl`의 영향을 받지 않습니다. Azure
설정은 [음성 및 speech](#voice-and-speech)의 **실시간
음성** 아코디언을 참조하세요.
</Note>

다음과 같은 경우 Azure OpenAI를 사용하세요:

- 이미 Azure OpenAI 구독, quota, 또는 엔터프라이즈 계약이 있는 경우
- Azure가 제공하는 지역별 데이터 상주 또는 규정 준수 제어가 필요한 경우
- 기존 Azure tenancy 내부에 트래픽을 유지하려는 경우

### 구성

번들된 `openai` provider를 통한 Azure 이미지 생성을 위해
`models.providers.openai.baseUrl`을 Azure 리소스로 지정하고 `apiKey`를
Azure OpenAI key(OpenAI Platform key가 아님)로 설정하세요:

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
경로에 대해 다음 Azure 호스트 접미사를 인식합니다:

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

인식된 Azure 호스트에 대한 이미지 생성 요청에서 OpenClaw는:

- `Authorization: Bearer` 대신 `api-key` 헤더를 보냅니다
- deployment 범위 경로(`/openai/deployments/{deployment}/...`)를 사용합니다
- 각 요청에 `?api-version=...`를 추가합니다

다른 base URL(공개 OpenAI, OpenAI 호환 프록시)은 표준
OpenAI 이미지 요청 형식을 유지합니다.

<Note>
`openai` provider의 이미지 생성 경로에 대한 Azure 라우팅에는
OpenClaw 2026.4.22 이상이 필요합니다. 이전 버전은 사용자 지정
`openai.baseUrl`을 모두 공개 OpenAI endpoint처럼 처리하므로 Azure
이미지 deployment에 대해 실패합니다.
</Note>

### API 버전

Azure 이미지 생성 경로에 대해 특정 Azure preview 또는 GA 버전을
고정하려면 `AZURE_OPENAI_API_VERSION`을 설정하세요:

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

이 변수가 설정되지 않으면 기본값은 `2024-12-01-preview`입니다.

### 모델 이름은 deployment 이름입니다

Azure OpenAI는 모델을 deployment에 바인딩합니다. 번들된 `openai` provider를 통해 라우팅되는 Azure 이미지 생성 요청에서 OpenClaw의 `model` 필드는 공개 OpenAI 모델 id가 아니라 Azure portal에서 구성한 **Azure deployment 이름**이어야 합니다.

`gpt-image-2`를 제공하는 `gpt-image-2-prod`라는 deployment를 만들었다면:

```
/tool image_generate model=openai/gpt-image-2-prod prompt="깔끔한 포스터" size=1024x1024 count=1
```

번들된 `openai` provider를 통해 라우팅되는 이미지 생성 호출에도 동일한 deployment 이름 규칙이 적용됩니다.

### 지역 가용성

Azure 이미지 생성은 현재 일부 지역에서만 사용할 수 있습니다
(예: `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). deployment를 만들기 전에 Microsoft의 최신
지역 목록을 확인하고, 특정 모델이 해당 지역에서 제공되는지도 확인하세요.

### 매개변수 차이점

Azure OpenAI와 공개 OpenAI는 항상 동일한 이미지 매개변수를 허용하지는 않습니다.
Azure는 공개 OpenAI가 허용하는 옵션(예: 특정
`gpt-image-2`의 `background` 값)을 거부하거나 특정 모델
버전에서만 이를 노출할 수 있습니다. 이러한 차이는 OpenClaw가 아니라 Azure와 기반 모델에서 비롯됩니다. Azure 요청이 검증 오류로 실패하면
Azure portal에서 사용 중인 특정 deployment와 API 버전이 지원하는
매개변수 집합을 확인하세요.

<Note>
Azure OpenAI는 네이티브 전송 및 호환 동작을 사용하지만
OpenClaw의 숨겨진 attribution 헤더는 받지 않습니다. [고급 구성](#advanced-configuration)의 **네이티브 vs OpenAI 호환
경로** 아코디언을 참조하세요.

Azure에서 채팅 또는 Responses 트래픽을 사용하려면(이미지 생성 외),
온보딩 흐름 또는 전용 Azure provider config를 사용하세요. `openai.baseUrl`만으로는
Azure API/auth 형식을 선택하지 않습니다. 별도의
`azure-openai-responses/*` provider가 있으며, 아래의
서버 측 Compaction 아코디언을 참조하세요.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="전송 (WebSocket vs SSE)">
    OpenClaw는 `openai/*`와 `openai-codex/*` 모두에 대해 WebSocket 우선, SSE fallback(`"auto"`)을 사용합니다.

    `"auto"` 모드에서 OpenClaw는:
    - 초기 WebSocket 실패를 한 번 재시도한 후 SSE로 fallback합니다
    - 실패 후 약 60초 동안 WebSocket을 성능 저하 상태로 표시하고 cooldown 동안 SSE를 사용합니다
    - 재시도 및 재연결을 위해 안정적인 세션 및 turn identity 헤더를 첨부합니다
    - 전송 방식 변형 전반에서 사용량 카운터(`input_tokens` / `prompt_tokens`)를 정규화합니다

    | 값 | 동작 |
    |-------|----------|
    | `"auto"` (기본값) | WebSocket 우선, SSE fallback |
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
    - [스트리밍 API 응답 (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket 워밍업">
    OpenClaw는 첫 turn 지연 시간을 줄이기 위해 `openai/*`와 `openai-codex/*`에 대해 기본적으로 WebSocket 워밍업을 활성화합니다.

    ```json5
    // 워밍업 비활성화
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
    OpenClaw는 `openai/*`와 `openai-codex/*`에 대해 공유 fast-mode 토글을 제공합니다:

    - **Chat/UI:** `/fast status|on|off`
    - **Config:** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    활성화되면 OpenClaw는 fast mode를 OpenAI 우선 처리(`service_tier = "priority"`)에 매핑합니다. 기존 `service_tier` 값은 유지되며, fast mode는 `reasoning` 또는 `text.verbosity`를 다시 쓰지 않습니다.

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
    세션 재정의가 config보다 우선합니다. Sessions UI에서 세션 재정의를 지우면 세션은 구성된 기본값으로 돌아갑니다.
    </Note>

  </Accordion>

  <Accordion title="우선 처리 (service_tier)">
    OpenAI API는 `service_tier`를 통해 우선 처리를 제공합니다. OpenClaw에서는 모델별로 설정하세요:

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
    `serviceTier`는 네이티브 OpenAI endpoint(`api.openai.com`)와 네이티브 Codex endpoint(`chatgpt.com/backend-api`)에만 전달됩니다. 두 provider 중 하나라도 프록시를 통해 라우팅하면 OpenClaw는 `service_tier`를 변경하지 않습니다.
    </Warning>

  </Accordion>

  <Accordion title="서버 측 Compaction (Responses API)">
    직접 OpenAI Responses 모델(`api.openai.com`의 `openai/*`)의 경우, OpenAI Plugin의 Pi-harness 스트림 wrapper는 서버 측 Compaction을 자동으로 활성화합니다:

    - `store: true` 강제(model compat가 `supportsStore: false`로 설정한 경우 제외)
    - `context_management: [{ type: "compaction", compact_threshold: ... }]` 주입
    - 기본 `compact_threshold`: `contextWindow`의 70%(또는 사용 불가능한 경우 `80000`)

    이는 내장 Pi harness 경로와 임베디드 실행에 사용되는 OpenAI provider hook에 적용됩니다. 네이티브 Codex app-server harness는 Codex를 통해 자체 컨텍스트를 관리하며 `agents.defaults.embeddedHarness.runtime`으로 별도 구성됩니다.

    <Tabs>
      <Tab title="명시적으로 활성화">
        Azure OpenAI Responses 같은 호환 endpoint에 유용합니다:

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
    `responsesServerCompaction`은 `context_management` 주입만 제어합니다. 직접 OpenAI Responses 모델은 compat가 `supportsStore: false`로 설정하지 않는 한 계속 `store: true`를 강제합니다.
    </Note>

  </Accordion>

  <Accordion title="엄격한 agentic GPT 모드">
    `openai/*`의 GPT-5 계열 실행에 대해 OpenClaw는 더 엄격한 임베디드 실행 계약을 사용할 수 있습니다:

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    `strict-agentic`에서 OpenClaw는:
    - 도구 작업을 사용할 수 있을 때 계획만 있는 turn을 더 이상 성공적인 진행으로 간주하지 않습니다
    - 즉시 실행하도록 유도하며 turn을 재시도합니다
    - 상당한 작업에 대해 `update_plan`을 자동 활성화합니다
    - 모델이 실행하지 않고 계속 계획만 세우면 명시적인 차단 상태를 표시합니다

    <Note>
    OpenAI 및 Codex GPT-5 계열 실행에만 범위가 지정됩니다. 다른 provider와 이전 모델 계열은 기본 동작을 유지합니다.
    </Note>

  </Accordion>

  <Accordion title="네이티브 vs OpenAI 호환 경로">
    OpenClaw는 직접 OpenAI, Codex, Azure OpenAI endpoint를 일반 OpenAI 호환 `/v1` 프록시와 다르게 처리합니다:

    **네이티브 경로** (`openai/*`, Azure OpenAI):
    - OpenAI `none` effort를 지원하는 모델에 대해서만 `reasoning: { effort: "none" }` 유지
    - `reasoning.effort: "none"`를 거부하는 모델 또는 프록시에 대해서는 비활성화된 reasoning 생략
    - 도구 schema를 기본적으로 strict mode로 설정
    - 검증된 네이티브 호스트에만 숨겨진 attribution 헤더 첨부
    - OpenAI 전용 요청 형식(`service_tier`, `store`, reasoning-compat, prompt-cache 힌트) 유지

    **프록시/호환 경로:**
    - 더 느슨한 호환 동작 사용
    - 비네이티브 `openai-completions` payload에서 Completions `store` 제거
    - OpenAI 호환 Completions 프록시를 위해 고급 `params.extra_body`/`params.extraBody` pass-through JSON 허용
    - strict 도구 schema나 네이티브 전용 헤더를 강제하지 않음

    Azure OpenAI는 네이티브 전송 및 호환 동작을 사용하지만 숨겨진 attribution 헤더는 받지 않습니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, model ref, 장애 조치 동작 선택하기.
  </Card>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    공통 이미지 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    공통 비디오 도구 매개변수 및 provider 선택.
  </Card>
  <Card title="OAuth 및 auth" href="/ko/gateway/authentication" icon="key">
    auth 세부 정보 및 자격 증명 재사용 규칙.
  </Card>
</CardGroup>
