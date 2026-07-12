---
read_when:
    - Ollama를 통해 클라우드 또는 로컬 모델로 OpenClaw를 실행하려고 합니다
    - Ollama 설정 및 구성 안내가 필요합니다
    - 이미지 이해를 위해 Ollama 비전 모델을 사용하려는 경우
summary: Ollama로 OpenClaw 실행하기(클라우드 및 로컬 모델)
title: Ollama
x-i18n:
    generated_at: "2026-07-12T15:40:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: aaa2ab1cf22b318499ef2a040c9e356bfb1c24be811ae0749cce0090f5978c13
    source_path: providers/ollama.md
    workflow: 16
---

OpenClaw은 OpenAI 호환 `/v1` 엔드포인트가 아니라 Ollama의 네이티브 API(`/api/chat`)와 통신합니다. 다음 세 가지 모드를 지원합니다.

| 모드          | 사용하는 항목                                                                     |
| ------------- | -------------------------------------------------------------------------------- |
| 클라우드 + 로컬 | 접근 가능한 Ollama 호스트에서 로컬 모델과 (로그인한 경우) `:cloud` 모델을 제공합니다. |
| 클라우드 전용    | 로컬 데몬 없이 `https://ollama.com`을 직접 사용합니다.                                   |
| 로컬 전용       | 접근 가능한 Ollama 호스트에서 로컬 모델만 제공합니다.                                   |

전용 `ollama-cloud` 제공자 ID를 사용하는 클라우드 전용 설정은
[Ollama Cloud](/ko/providers/ollama-cloud)를 참조하십시오. 클라우드 라우팅을 로컬
`ollama` 제공자와 분리하려면 `ollama-cloud/<model>` 참조를 사용하십시오.

<Warning>
`/v1` OpenAI 호환 URL(`http://host:11434/v1`)을 사용하지 마십시오. 이 URL은 도구 호출을 중단시키며 모델이 원시 도구 호출 JSON을 일반 텍스트로 출력할 수 있습니다. 네이티브 URL인 `baseUrl: "http://host:11434"`(`/v1` 없음)을 사용하십시오.
</Warning>

표준 구성 키는 `baseUrl`입니다. OpenAI SDK 스타일 예제에서는 `baseURL`도
허용되지만 새 구성에는 `baseUrl`을 사용해야 합니다.

## 인증 규칙

<AccordionGroup>
  <Accordion title="로컬 및 LAN 호스트">
    루프백, 사설 네트워크, `.local`, 단순 호스트 이름을 사용하는 Ollama URL에는 실제 베어러 토큰이 필요하지 않습니다. OpenClaw은 이러한 URL에 `ollama-local` 마커를 사용합니다.
  </Accordion>
  <Accordion title="원격 및 Ollama Cloud 호스트">
    공개 원격 호스트와 `https://ollama.com`에는 실제 자격 증명인 `OLLAMA_API_KEY`, 인증 프로필 또는 제공자의 `apiKey`가 필요합니다. 호스팅 서비스를 직접 사용하려면 `ollama-cloud` 제공자를 권장합니다.
  </Accordion>
  <Accordion title="사용자 지정 제공자 ID">
    `api: "ollama"`를 사용하는 사용자 지정 제공자에도 동일한 규칙이 적용됩니다. 예를 들어 사설 LAN 호스트를 가리키는 `ollama-remote` 제공자는 `apiKey: "ollama-local"`을 사용할 수 있습니다. 하위 에이전트는 이를 누락된 자격 증명으로 처리하는 대신 Ollama 제공자 훅을 통해 해당 마커를 해석합니다. 임베딩에서 해당 Ollama 엔드포인트를 사용하도록 `agents.defaults.memorySearch.provider`가 사용자 지정 제공자 ID를 가리키게 할 수도 있습니다.
  </Accordion>
  <Accordion title="인증 프로필">
    `auth-profiles.json`은 제공자 ID의 자격 증명을 저장합니다. 엔드포인트 설정(`baseUrl`, `api`, 모델, 헤더, 시간 제한)은 `models.providers.<id>`에 넣으십시오. `{ "ollama-windows": { "apiKey": "ollama-local" } }`과 같은 이전의 평면 파일은 런타임 형식이 아닙니다. `openclaw doctor --fix`는 백업을 생성하고 이를 표준 `ollama-windows:default` API 키 프로필로 다시 작성합니다. 해당 레거시 파일의 `baseUrl` 값은 불필요한 정보이므로 제공자 구성으로 옮겨야 합니다.
  </Accordion>
  <Accordion title="메모리 임베딩 범위">
    Ollama 메모리 임베딩의 베어러 인증은 선언된 호스트로 범위가 제한됩니다.

    - 제공자 수준 키는 해당 제공자의 호스트에만 전송됩니다.
    - `agents.*.memorySearch.remote.apiKey`는 해당 원격 임베딩 호스트에만 전송됩니다.
    - 단독 `OLLAMA_API_KEY` 환경 변수 값은 Ollama Cloud 규칙으로 취급되며 기본적으로 로컬/자체 호스팅 호스트에는 전송되지 않습니다.

  </Accordion>
</AccordionGroup>

## 시작하기

<Tabs>
  <Tab title="온보딩(권장)">
    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard
        ```

        **Ollama**를 선택한 다음 모드를 선택하십시오. **Cloud + Local**, **Cloud only** 또는 **Local only**.
      </Step>
      <Step title="모델 선택">
        `Cloud only`는 `OLLAMA_API_KEY`를 입력하라는 메시지를 표시하고 호스팅된 클라우드 기본값을 제안합니다. `Cloud + Local`과 `Local only`는 Ollama 기본 URL을 입력하라는 메시지를 표시하고, 사용 가능한 모델을 검색하며, 선택한 로컬 모델이 없으면 자동으로 가져옵니다. `gemma4:latest`와 같이 설치된 `:latest` 태그는 `gemma4`와 중복해서 표시되지 않고 한 번만 표시됩니다. `Cloud + Local`은 호스트가 클라우드 액세스를 위해 로그인되어 있는지도 확인합니다.
      </Step>
      <Step title="확인">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    비대화형 설정:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

    `--custom-base-url`과 `--custom-model-id`는 선택 사항입니다. 생략하면 로컬 기본 호스트와 권장 모델인 `gemma4`를 사용합니다.

  </Tab>

  <Tab title="수동 설정">
    <Steps>
      <Step title="Ollama 설치 및 시작">
        [ollama.com/download](https://ollama.com/download)에서 다운로드한 다음 모델을 가져오십시오.

        ```bash
        ollama pull gemma4
        ```

        하이브리드 클라우드 액세스를 사용하려면 동일한 호스트에서 `ollama signin`을 실행하십시오.
      </Step>
      <Step title="자격 증명 설정">
        ```bash
        export OLLAMA_API_KEY="ollama-local"    # 로컬/LAN 호스트에서는 어떤 값이든 사용 가능
        export OLLAMA_API_KEY="your-real-key"   # https://ollama.com 전용
        ```

        또는 구성에서 `openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"`를 실행하십시오.
      </Step>
      <Step title="모델 선택">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        또는 구성에서 다음과 같이 설정하십시오.

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 로컬 호스트를 통한 클라우드 모델

`Cloud + Local`은 로컬 모델과 `:cloud` 모델을 모두 접근 가능한 하나의
Ollama 호스트를 통해 라우팅합니다. 이는 Ollama의 하이브리드 흐름이며, 두 유형을
모두 사용하려는 경우 설정 중 선택해야 하는 모드입니다.

OpenClaw는 기본 URL을 묻고, 로컬 모델을 검색하며,
`ollama signin` 상태를 확인합니다. 로그인된 경우 호스팅 기본값
(`kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`)을 제안합니다.
로그인되지 않은 경우 `ollama signin`을 실행할 때까지 설정은 로컬 전용으로 유지됩니다.

로컬 데몬 없이 클라우드에만 액세스하려면 `openclaw onboard --auth-choice ollama-cloud`를 사용하고 [Ollama Cloud](/ko/providers/ollama-cloud)를 참조하십시오. 이 경로에는 `ollama signin`이나 실행 중인 서버가 필요하지 않습니다.

```bash
openclaw onboard --auth-choice ollama-cloud
openclaw models set ollama-cloud/kimi-k2.5:cloud
```

`openclaw onboard` 중 표시되는 클라우드 모델 목록은
`https://ollama.com/api/tags`에서 실시간으로 채워지며 최대 500개 항목으로 제한되므로, 선택기에는
현재 호스팅 카탈로그가 반영됩니다. 설정 시 `ollama.com`에 연결할 수 없거나
모델이 반환되지 않으면 OpenClaw는 하드코딩된 추천 목록으로 대체하여
온보딩을 계속 완료할 수 있도록 합니다.

## 모델 검색(암시적 공급자)

`OLLAMA_API_KEY`(또는 인증 프로필)가 설정되어 있고
`models.providers.ollama`나 `api: "ollama"`를 사용하는 다른 사용자 지정 공급자가
정의되어 있지 않으면 OpenClaw는 `http://127.0.0.1:11434`에서 모델을 검색합니다.

| 동작                 | 세부 정보                                                                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 카탈로그 조회        | `/api/tags`                                                                                                                                                                                                                                                                                   |
| 기능 감지            | 최선형 `/api/show` 요청으로 `contextWindow`, `num_ctx` Modelfile 매개변수 및 기능(비전/도구/사고)을 읽습니다.                                                                                                                                                                                  |
| 비전 모델            | `/api/show`의 `vision` 기능이 있으면 모델이 이미지 입력을 지원하는 것으로 표시됩니다(`input: ["text", "image"]`).                                                                                                                                                                             |
| 추론 감지            | 가능한 경우 `/api/show`의 `thinking` 기능을 사용하며, Ollama가 기능을 생략하면 이름 휴리스틱(`r1`, `reason`, `reasoning`, `think`)으로 대체합니다. 보고된 기능과 관계없이 `glm-5.2:cloud`와 `deepseek-v4-flash\|pro:cloud`은 항상 추론 모델로 처리됩니다. |
| 토큰 제한            | `maxTokens`의 기본값은 OpenClaw의 Ollama 최대 토큰 상한입니다.                                                                                                                                                                                                                                |
| 비용                 | 모든 비용은 `0`입니다.                                                                                                                                                                                                                                                                       |

```bash
ollama list
openclaw models list
```

명시적인 `models` 배열로 `models.providers.ollama`를 설정하거나,
`api: "ollama"` 및 루프백이 아닌 `baseUrl`을 사용하는 사용자 지정 공급자를 설정하면
자동 검색이 비활성화됩니다. 이 경우 모델을 수동으로 정의해야 합니다
([구성](#configuration) 참조). 호스팅된 `https://ollama.com`을 가리키는
`models.providers.ollama` 항목도 검색을 건너뜁니다. Ollama Cloud 모델은
공급자가 관리하기 때문입니다. `http://127.0.0.2:11434`와 같은
루프백 사용자 지정 공급자는 여전히 로컬로 간주되며 자동 검색을 유지합니다.

직접 작성한 `models.json` 항목 없이도 `ollama/<pulled-model>:latest`와 같은
전체 참조를 사용할 수 있으며, OpenClaw가 이를 실시간으로 확인합니다. 로그인된
호스트에서 목록에 없는 `ollama/<model>:cloud` 참조를 선택하면 해당 모델을
`/api/show`로 정확히 검증하고 Ollama가 메타데이터를 확인한 경우에만
런타임 카탈로그에 추가합니다. 오타는 여전히 알 수 없는 모델로 처리되어 실패합니다.

### 스모크 테스트

전체 에이전트 도구 표면을 건너뛰는 간단한 텍스트 점검:

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "정확히 다음과 같이 응답하십시오: pong" \
    --json
```

간단한 비전 모델 점검을 수행하려면 이미지와 함께 `--file`을 추가하십시오(PNG/JPEG/WebP 지원,
이미지가 아닌 파일은 Ollama를 호출하기 전에 거부됩니다. 오디오에는
`openclaw infer audio transcribe`를 사용하십시오).

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "이 이미지를 한 문장으로 설명하십시오." \
    --file ./photo.jpg \
    --json
```

두 경로 모두 채팅 도구, 메모리 또는 세션 컨텍스트를 로드하지 않습니다. 이 경로는 성공하지만
일반 에이전트 응답이 실패한다면 문제는 엔드포인트가 아니라 모델의 도구/에이전트
처리 역량일 가능성이 높습니다.

`/model ollama/<model>`로 모델을 선택하는 것은 사용자의 명시적인 선택입니다.
구성된 `baseUrl`에 연결할 수 없으면 다음 응답은 구성된 다른 모델로 조용히
대체되지 않고 공급자 오류와 함께 실패합니다.

격리된 Cron 작업은 에이전트 턴을 시작하기 전에 하나의 로컬 안전 검사를 추가합니다.
선택한 모델이 로컬/사설 네트워크/`.local` Ollama 공급자로 확인되고
`/api/tags`에 연결할 수 없으면 OpenClaw는 오류 텍스트에 모델을 포함하여 해당 실행을
`skipped`로 기록합니다. 이 엔드포인트 검사는 호스트별로 5분간 캐시되므로,
중지된 데몬을 대상으로 반복되는 Cron 작업이 모두 실패 요청을 시작하지 않습니다.

실시간 검증:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0 \
  pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Ollama Cloud의 경우, 동일한 라이브 테스트가 호스팅된 엔드포인트를 가리키도록 합니다(기본적으로 임베딩을 건너뜁니다. 클라우드 키에 `/api/embed` 권한이 없을 수 있으므로 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`로 강제할 수 있습니다).

```bash
export OLLAMA_API_KEY='<your-ollama-cloud-api-key>'
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=glm-5.1:cloud \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

모델을 추가하려면 모델을 가져오십시오. 그러면 자동으로 검색됩니다.

```bash
ollama pull mistral
```

## Node 로컬 추론

에이전트는 페어링된 데스크톱 또는 서버 Node의 Ollama 모델에 짧은 작업을 위임할 수 있습니다. 프롬프트와 응답은 기존의 인증된 Gateway/Node 연결을 통해 전달되며, 요청은 Node 자체의 루프백 Ollama 엔드포인트(`http://127.0.0.1:11434`)에서 실행됩니다.

<Steps>
  <Step title="Node에서 Ollama 시작">
    ```bash
    ollama pull qwen3:0.6b
    ollama list
    ```
  </Step>
  <Step title="Node 호스트 연결">
    ```bash
    openclaw node run \
      --host <gateway-host> \
      --port 18789 \
      --display-name "Local inference"
    ```

    Gateway 호스트에서 장치와 해당 Node 명령을 승인한 후 확인하십시오.

    ```bash
    openclaw devices list
    openclaw devices approve <deviceRequestId>
    openclaw nodes pending
    openclaw nodes approve <nodeRequestId>
    openclaw nodes status --connected
    ```

    처음 연결하거나 Ollama 명령을 추가하는 업그레이드를 수행하면 Node 명령 승인이 필요할 수 있습니다. Node가 `ollama.models`와 `ollama.chat`을 알리지 않은 상태로 연결되면 `openclaw nodes pending`을 다시 확인하십시오.

  </Step>
  <Step title="에이전트에서 사용">
    번들 Ollama Plugin은 `node_inference` 도구를 제공합니다. 에이전트는 먼저 `action: "discover"`를 호출한 다음, 그 결과의 Node와 모델을 사용하여 `action: "run"`을 호출합니다(`run`은 기능을 갖춘 Node가 정확히 하나만 연결된 경우 Node를 생략할 수 있습니다). 예: "내 Node에서 Ollama 모델을 검색한 다음, 로드된 모델 중 가장 빠른 모델을 사용하여 이 텍스트를 요약하십시오."
  </Step>
</Steps>

검색은 `/api/tags`를 읽고 `/api/show` 기능을 확인하며, 가능한 경우 `/api/ps`를 사용하여 이미 로드된 모델을 우선 배치합니다. Ollama가 채팅 가능(`completion` 기능)하다고 보고한 로컬 모델만 반환하며, Ollama Cloud 행과 임베딩 전용 모델은 제외됩니다. 각 실행은 모델 사고를 비활성화하고, 도구 호출에서 다른 `maxTokens`를 요청하지 않는 한 출력의 기본값을 512토큰으로 설정합니다(하드 제한 8192). 일부 모델(예: GPT-OSS)은 사고 비활성화를 지원하지 않으므로 추론 토큰을 계속 출력할 수 있습니다.

에이전트에 노출하지 않고 Node에서 Ollama를 계속 실행하려면 다음을 실행하십시오.

```bash
openclaw config set plugins.entries.ollama.config.nodeInference.enabled false
```

Node를 다시 시작하십시오(`openclaw node restart`, 또는 포그라운드 세션의 경우 `openclaw node run`을 중지한 후 다시 실행). Node는 `ollama.models`와 `ollama.chat` 알림을 중지합니다. Ollama 자체와 Gateway의 Ollama 공급자는 영향을 받지 않습니다. 값을 다시 `true`로 설정하고 재시작하여 다시 활성화하십시오. 변경된 명령 표면은 재연결 후 `openclaw nodes pending` 승인이 다시 필요할 수 있습니다.

에이전트 턴 없이 Node 명령을 직접 확인하십시오.

```bash
openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.models \
  --params '{}' \
  --invoke-timeout 90000 \
  --timeout 100000

openclaw nodes invoke \
  --node "Local inference" \
  --command ollama.chat \
  --params '{"model":"qwen3:0.6b","prompt":"Reply with exactly: pong","maxTokens":32,"timeoutMs":120000}' \
  --invoke-timeout 130000 \
  --timeout 140000
```

`--invoke-timeout`은 Node가 명령을 실행할 수 있는 시간을 제한하며,
`--timeout`은 전체 Gateway 호출 시간을 제한하므로 더 큰 값이어야 합니다.

Node 로컬 추론은 항상 Node 자체의 루프백 엔드포인트를 사용하며, 구성된 원격/클라우드 `models.providers.ollama.baseUrl`을 재사용하지 않습니다. Node 명령은 macOS, Linux 및 Windows Node 호스트에서 기본적으로 사용할 수 있으며 일반적인 Node 페어링/명령 정책의 적용을 계속 받습니다.

## 비전 및 이미지 설명

번들 Ollama Plugin은 Ollama를 이미지 지원 미디어 이해 제공자로 등록하므로, OpenClaw는 명시적인 이미지 설명 요청과 구성된 이미지 모델 기본값을 로컬 또는 호스팅된 Ollama 비전 모델로 라우팅할 수 있습니다.

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

`--model`은 완전한 `<provider/model>` 참조여야 합니다. 이 값을 설정하면 `infer image
describe`는 네이티브 비전을 이미 지원하는 모델에 대해 설명을 건너뛰는 대신 해당 모델을
먼저 시도합니다. 호출이 실패하면 OpenClaw는
`agents.defaults.imageModel.fallbacks`를 통해 계속 진행할 수 있습니다. 파일/URL 준비 오류는
폴백을 시도하기 전에 실패합니다. OpenClaw의 이미지 이해 흐름과 구성된
`imageModel`을 사용하려면 `infer image describe`를 사용하고, 사용자 지정 프롬프트를 사용하는
원시 멀티모달 프로브에는 `infer model run
--file`을 사용하십시오.

Ollama를 수신 미디어의 기본 이미지 이해 제공자로 설정하려면 다음과 같이 구성하십시오.

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

완전한 `ollama/<model>` 참조를 권장합니다. `qwen2.5vl:7b`와 같은 접두사 없는
`imageModel` 참조는 해당 모델이 `models.providers.ollama.models` 아래에
`input: ["text", "image"]`로 나열되어 있고, 구성된 다른 이미지 제공자가 동일한
접두사 없는 ID를 노출하지 않는 경우에만 `ollama/qwen2.5vl:7b`로 정규화됩니다.
그렇지 않으면 제공자 접두사를 명시적으로 사용하십시오.

느린 로컬 비전 모델에는 클라우드 모델보다 긴 이미지 이해 제한 시간이 필요할 수 있으며,
Ollama가 모델에 명시된 전체 비전 컨텍스트를 할당하려고 하면 리소스가 제한된 하드웨어에서
충돌할 수 있습니다. 기능 제한 시간을 설정하고 `num_ctx`를 제한하십시오.

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

이 제한 시간은 수신 이미지 이해와 명시적 `image` 도구에 적용됩니다.
`models.providers.ollama.timeoutSeconds`는 일반 모델 호출의 기반 Ollama HTTP 요청
보호 제한 시간을 계속 제어합니다.

실시간 검증:

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

`models.providers.ollama.models`를 수동으로 정의하는 경우, 비전 모델을
명시적으로 표시하십시오.

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw는 이미지 처리 기능이 있다고 표시되지 않은 모델에 대한 이미지 설명 요청을
거부합니다. 암시적 검색을 사용하는 경우 이 정보는 `/api/show`의 비전
기능에서 가져옵니다.

## 구성

<Tabs>
  <Tab title="기본(암시적 검색)">
    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    `OLLAMA_API_KEY`가 설정되어 있으면 공급자 항목에서 `apiKey`를 생략할 수 있습니다. OpenClaw가 가용성 검사를 위해 이를 입력합니다.
    </Tip>

  </Tab>

  <Tab title="명시적 설정(수동 모델)">
    호스팅된 클라우드 설정, 기본값이 아닌 호스트/포트, 강제 지정된
    컨텍스트 창 또는 완전한 수동 모델 목록에는 명시적 구성을 사용하십시오.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="사용자 지정 기본 URL">
    명시적 구성은 자동 검색을 비활성화하므로 모델을 나열해야 합니다.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // /v1 없음 - 네이티브 Ollama API URL
            api: "ollama", // 명시적 설정: 네이티브 도구 호출 동작 보장
            timeoutSeconds: 300, // 선택 사항: 콜드 로컬 모델을 위한 더 긴 연결/스트림 시간 예산
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 선택 사항: 턴 사이에 모델을 로드된 상태로 유지
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    `/v1`을 추가하지 마십시오. 해당 경로는 도구 호출이 안정적이지 않은 OpenAI 호환 모드를 선택합니다.
    </Warning>

  </Tab>
</Tabs>

## 일반적인 구성 예시

모델 ID를 `ollama list` 또는
`openclaw models list --provider ollama`에 표시되는 정확한 이름으로 바꾸십시오.

<AccordionGroup>
  <Accordion title="자동 검색을 사용하는 로컬 모델">
    Gateway와 동일한 머신에서 실행되며 자동으로 검색되는 Ollama:

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    수동 모델이 필요하지 않다면 `models.providers.ollama` 블록을 추가하지 마십시오.

  </Accordion>

  <Accordion title="수동 모델을 사용하는 LAN Ollama 호스트">
    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow`는 OpenClaw의 컨텍스트 예산이며, `params.num_ctx`는
    Ollama로 전송됩니다. 하드웨어에서 모델이 명시한 전체 컨텍스트를 실행할 수 없는 경우
    두 값을 일치시키십시오.

  </Accordion>

  <Accordion title="Ollama Cloud만 사용">
    로컬 데몬 없이 호스팅된 모델을 직접 사용합니다.

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                contextWindow: 128000,
                maxTokens: 8192,
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

    이 구성 대신 전용 `ollama-cloud` 공급자 ID를 사용하려면
    [Ollama Cloud](/ko/providers/ollama-cloud)를 참조하십시오.

  </Accordion>

  <Accordion title="로그인된 데몬을 통한 클라우드 및 로컬 사용">
    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="여러 Ollama 호스트">
    둘 이상의 Ollama 서버를 실행할 때는 사용자 지정 제공자 ID를 사용합니다. 각 제공자는
    자체 호스트, 모델, 인증, 타임아웃을 가집니다.

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    OpenClaw는 Ollama를 호출하기 전에 활성 제공자 접두사를 제거하며, 없으면 기본
    `ollama/` 접두사를 사용합니다. 따라서 `ollama-large/qwen3.5:27b`는
    Ollama에 `qwen3.5:27b`로 전달됩니다.

  </Accordion>

  <Accordion title="경량 로컬 모델 프로필">
    일부 로컬 모델은 간단한 프롬프트는 처리하지만 전체 에이전트 도구
    표면에서는 어려움을 겪습니다. 전역 런타임 설정을 변경하기 전에 도구와
    컨텍스트를 제한하십시오.

    ```json5
    {
      agents: {
        list: [
          {
            id: "local",
            experimental: {
              localModelLean: true,
            },
            model: { primary: "ollama/gemma4" },
          },
        ],
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    모델이나 서버가 도구 스키마에서 안정적으로 실패할 때만
    `compat.supportsTools: false`를 사용하십시오. 이 설정은 안정성을 위해 에이전트
    기능을 희생합니다. 명시적으로 필요하지 않은 한 `localModelLean`은 직접 에이전트
    표면에서 무거운 브라우저, Cron, 메시지, 미디어 생성, 음성, PDF 도구를 제거하고,
    더 큰 카탈로그는 도구 검색 뒤에 배치합니다. 이 설정은 Ollama의 런타임 컨텍스트나
    사고 모드를 변경하지 않습니다. 반복 실행되거나 숨겨진 추론에 예산을 소모하는
    소형 Qwen 계열 사고 모델에는 `params.num_ctx` 및 `params.thinking: false`와 함께
    사용하십시오.

  </Accordion>
</AccordionGroup>

### 모델 선택

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

사용자 지정 제공자 ID도 같은 방식으로 작동합니다. `ollama-spark/qwen3:32b`처럼
활성 제공자 접두사를 사용하는 참조의 경우 OpenClaw는 Ollama를 호출하기 전에 해당
접두사를 제거하여 `qwen3:32b`를 전송합니다.

느린 로컬 모델의 경우 전체 에이전트 런타임 타임아웃을 늘리기 전에 제공자 범위
조정을 우선 사용하십시오.

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds`는 연결 설정, 헤더, 본문 스트리밍, 보호된 가져오기의 전체 중단을
포함한 모델 HTTP 요청을 다룹니다. `params.keep_alive`는 네이티브 `/api/chat`
요청에서 최상위 `keep_alive`로 전달됩니다. 첫 번째 턴의 로드 시간이 병목인 경우
모델별로 설정하십시오.

### 빠른 확인

```bash
# 이 머신에서 접근 가능한 Ollama 데몬
curl http://127.0.0.1:11434/api/tags

# OpenClaw 카탈로그 및 선택된 모델
openclaw models list --provider ollama
openclaw models status

# 직접 모델 스모크 테스트
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "정확히 다음과 같이 응답하십시오: ok"
```

원격 호스트에서는 `127.0.0.1`을 `baseUrl` 호스트로 바꾸십시오. `curl`은 작동하지만
OpenClaw는 작동하지 않는다면 Gateway가 다른 머신, 컨테이너 또는 서비스 계정에서
실행되는지 확인하십시오.

## Ollama 웹 검색

OpenClaw는 **Ollama 웹 검색**을 `web_search` 제공자로 번들로 제공합니다.

| 속성        | 세부 정보                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 호스트      | 설정된 경우 `models.providers.ollama.baseUrl`, 그렇지 않으면 `http://127.0.0.1:11434`; `https://ollama.com`은 호스팅 API를 직접 사용합니다                 |
| 인증        | 로그인된 로컬 호스트에서는 키가 필요하지 않습니다. 직접 `https://ollama.com` 검색이나 인증으로 보호된 호스트에는 `OLLAMA_API_KEY` 또는 구성된 제공자 인증을 사용합니다 |
| 요구 사항   | 로컬/자체 호스팅 호스트는 실행 중이어야 하며 `ollama signin`으로 로그인해야 합니다. 직접 호스팅 검색에는 `baseUrl: "https://ollama.com"`과 실제 API 키가 필요합니다 |

`openclaw onboard` 또는 `openclaw configure --section web` 중에 선택하거나 다음과 같이 설정하십시오.

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Ollama Cloud를 통한 직접 호스팅 검색의 경우:

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

자체 호스팅 호스트의 경우 OpenClaw는 먼저 로컬 `/api/experimental/web_search`
프록시를 시도한 다음 같은 호스트의 호스팅 `/api/web_search` 경로로 대체합니다.
로그인된 로컬 데몬은 일반적으로 로컬 프록시를 통해 응답합니다. 직접
`https://ollama.com` 호출은 항상 호스팅 `/api/web_search` 엔드포인트를 사용합니다.

<Note>
전체 설정 및 동작은 [Ollama 웹 검색](/ko/tools/ollama-search)을 참조하십시오.
</Note>

## 고급 구성

<AccordionGroup>
  <Accordion title="레거시 OpenAI 호환 모드">
    <Warning>
    **이 모드에서는 도구 호출을 신뢰할 수 없습니다.** 프록시가 OpenAI 형식을 필요로 하고 네이티브 도구 호출에 의존하지 않을 때만 사용하십시오.
    </Warning>

    `/v1/chat/completions` 뒤의 프록시에는 `api: "openai-completions"`를
    명시적으로 설정하십시오.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // 기본값: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    이 모드는 스트리밍과 도구 호출을 동시에 지원하지 않을 수 있습니다. 모델에
    `params: { streaming: false }`를 설정해야 할 수 있습니다.

    이 모드에서는 Ollama가 조용히 4096토큰 컨텍스트로 대체하지 않도록 OpenClaw가
    기본적으로 `options.num_ctx`를 주입합니다. 프록시가 알 수 없는 `options`
    필드를 거부하는 경우 비활성화하십시오.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="컨텍스트 창">
    자동 검색된 모델의 경우 OpenClaw는 사용자 지정 Modelfile의 더 큰
    `PARAMETER num_ctx` 값을 포함하여 `/api/show`가 보고하는 컨텍스트 창을
    사용합니다. 그렇지 않으면 OpenClaw의 기본 Ollama 컨텍스트 창으로 대체합니다.

    제공자 수준의 `contextWindow`, `contextTokens`, `maxTokens`는 해당 제공자 아래
    모든 모델의 기본값을 설정하며 모델별로 재정의할 수 있습니다. `contextWindow`는
    OpenClaw 자체의 프롬프트/Compaction 예산입니다. `params.num_ctx`를 명시적으로
    설정하지 않는 한 네이티브 `/api/chat` 요청에서는 `options.num_ctx`를 설정하지
    않으므로 Ollama가 자체 모델, `OLLAMA_CONTEXT_LENGTH` 또는 VRAM 기반 기본값을
    적용합니다. 유효하지 않거나 0, 음수 또는 유한하지 않은 `params.num_ctx` 값은
    무시됩니다. 이전 구성이 네이티브 요청 컨텍스트를 강제하기 위해
    `contextWindow`/`maxTokens`만 사용했다면 `openclaw doctor --fix`를 실행하여 해당
    값을 `params.num_ctx`로 복사하십시오. OpenAI 호환 어댑터는 구성된
    `params.num_ctx` 또는 `contextWindow`에서 기본적으로 `options.num_ctx`를 계속
    주입합니다. 업스트림이 `options`를 거부하는 경우
    `injectNumCtxForOpenAICompat: false`로 비활성화하십시오.

    네이티브 모델 항목은 `params` 아래에서 일반적인 Ollama 런타임 옵션도 허용하며,
    네이티브 `/api/chat`의 `options`로 전달됩니다. 해당 옵션은 `num_keep`, `seed`,
    `num_predict`, `top_k`, `top_p`, `min_p`, `typical_p`, `repeat_last_n`,
    `temperature`, `repeat_penalty`, `presence_penalty`, `frequency_penalty`,
    `stop`, `num_batch`, `num_gpu`, `main_gpu`, `use_mmap`, `num_thread`입니다.
    일부 키(`format`, `keep_alive`, `truncate`, `shift`)는 중첩된 `options` 대신
    최상위 요청 필드로 전달됩니다. OpenClaw는 이러한 Ollama 요청 키만 전달하므로
    `streaming` 같은 런타임 전용 매개변수는 Ollama로 전송되지 않습니다.
    `params.think` 또는 `params.thinking`을 사용하여 최상위 `think`를 설정하십시오.
    `false`는 Qwen 계열 사고 모델의 API 수준 사고를 비활성화합니다.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    모델별 `agents.defaults.models["ollama/<model>"].params.num_ctx`도 작동합니다.
    둘 다 설정된 경우 명시적인 제공자 모델 항목이 우선합니다.

  </Accordion>

  <Accordion title="사고 제어">
    OpenClaw는 Ollama가 예상하는 방식대로 사고 설정을 전달합니다.
    `options.think`가 아니라 최상위 `think`입니다. `/api/show`가 `thinking`
    기능을 보고하는 자동 검색 모델은 `/think low`, `/think medium`,
    `/think high`, `/think max`를 제공하며, 비사고 모델은 `/think off`만 제공합니다.

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    또는 모델 기본값을 설정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    모델별 `params.think`/`params.thinking`으로 특정 모델의 API
    thinking을 비활성화하거나 강제할 수 있습니다. 활성 실행에 암시적 기본값
    `off`만 있는 경우 OpenClaw는 이 명시적 구성을 유지하지만, `/think medium`과
    같은 off가 아닌 런타임 명령은 여전히 이를 재정의합니다. 명시적으로
    `reasoning: false`로 표시된 모델에는 truthy thinking 요청을 절대 보내지
    않으며, `think: false` 요청은 항상 전송합니다.

  </Accordion>

  <Accordion title="추론 모델">
    이름이 `deepseek-r1`, `reasoning`, `reason` 또는 `think`인 모델은
    기본적으로 추론 기능이 있는 것으로 취급되므로 추가 구성이 필요하지 않습니다.

    ```bash
    ollama pull deepseek-r1:32b
    ```

  </Accordion>

  <Accordion title="모델 비용">
    Ollama는 로컬에서 무료로 실행되므로 자동 검색된 모델과 수동으로 정의한
    모델 모두의 모든 모델 비용은 `0`입니다.
  </Accordion>

  <Accordion title="메모리 임베딩">
    번들 Ollama Plugin은 [메모리 검색](/ko/concepts/memory)을 위한 메모리 임베딩
    제공자를 등록합니다. 구성된 Ollama 기본 URL과 API 키를 사용하고,
    `/api/embed`를 호출하며, 가능하면 여러 메모리 청크를 하나의 `input`
    요청으로 일괄 처리합니다.

    `proxy.enabled=true`인 경우 구성된 `baseUrl`에서 파생된 정확한 호스트 로컬
    루프백 원본에 대한 임베딩 요청은 관리형 정방향 프록시 대신 OpenClaw의
    보호된 직접 경로를 사용합니다. 구성된 호스트 이름 자체가 `localhost` 또는
    루프백 IP 리터럴이어야 합니다. 단순히 루프백으로 확인되는 DNS 이름은 여전히
    관리형 프록시 경로를 사용합니다. LAN, tailnet, 사설 네트워크 및 공개 Ollama
    호스트는 항상 관리형 프록시 경로를 유지하며, 다른 호스트/포트로의 리디렉션은
    신뢰를 상속하지 않습니다. `proxy.loopbackMode: "proxy"`는 루프백 트래픽도
    프록시를 통해 라우팅하고, `proxy.loopbackMode: "block"`은 연결하기 전에
    이를 거부합니다. [관리형 프록시](/ko/security/network-proxy#gateway-loopback-mode)를
    참조하십시오.

    | 속성 | 값 |
    | --- | --- |
    | 기본 모델 | `nomic-embed-text` |
    | 자동 가져오기 | 로컬에 없으면 예 |
    | 기본 인라인 동시성 | 1(다른 제공자의 기본값은 더 높습니다. 호스트가 감당할 수 있다면 `nonBatchConcurrency`로 높이십시오.) |

    쿼리 시 임베딩은 검색 접두사가 필요하거나 권장되는 모델인
    `nomic-embed-text`, `qwen3-embedding`, `mxbai-embed-large`에 검색 접두사를
    사용합니다. 문서 배치는 원시 상태를 유지하므로 기존 인덱스에는 형식 마이그레이션이
    필요하지 않습니다.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Ollama의 기본값입니다. 재인덱싱이 너무 느리면 더 큰 호스트에서 높이십시오.
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    원격 임베딩 호스트에서는 인증 범위를 해당 호스트로 한정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="스트리밍 구성">
    Ollama는 기본적으로 스트리밍과 도구 호출을 함께 지원하는 **네이티브 API**
    (`/api/chat`)를 사용하므로 특별한 구성이 필요하지 않습니다.

    네이티브 요청의 경우 사고 제어가 직접 전달됩니다. 명시적
    `params.think`/`params.thinking`이 구성되지 않은 한 `/think off`
    및 `openclaw agent --thinking off`은 최상위 `think: false`을 전송하며, `/think
    low|medium|high`은 일치하는 노력 수준 문자열을 전송합니다. `/think max`은
    Ollama의 최고 노력 수준인 `think: "high"`에 매핑됩니다.

    <Tip>
    대신 OpenAI 호환 엔드포인트를 사용하려면 위의 "레거시 OpenAI 호환 모드"를 참조하십시오. 해당 모드에서는 스트리밍과 도구 호출이 함께 작동하지 않을 수 있습니다.
    </Tip>

  </Accordion>
</AccordionGroup>

## 문제 해결

  <AccordionGroup>
  <Accordion title="WSL2 충돌 루프(반복 재부팅)">
    NVIDIA/CUDA를 사용하는 WSL2에서 공식 Ollama Linux 설치 프로그램은
    `Restart=always`가 설정된 `ollama.service` systemd 유닛을 생성합니다. 이 서비스가
    자동으로 시작되어 WSL2 부팅 중 GPU 기반 모델을 로드하면 Ollama가 로드하는 동안
    호스트 메모리를 고정할 수 있습니다. Hyper-V 메모리 회수 기능이 해당 페이지를
    항상 회수할 수 있는 것은 아니므로 Windows가 WSL2 VM을 종료하고, systemd가
    Ollama를 재시작하여 이 루프가 반복될 수 있습니다.

    증거: WSL2가 반복해서 재부팅되거나 종료됨, WSL2 시작 직후 `app.slice` 또는
    `ollama.service`에서 높은 CPU 사용량 발생, Linux OOM 킬러가 아닌 systemd에서
    SIGTERM 발생.

    OpenClaw는 WSL2, `Restart=always`가 설정된 활성화 상태의 `ollama.service`,
    그리고 표시되는 CUDA 마커를 감지하면 시작 경고를 기록합니다.

    완화 방법:

    ```bash
    sudo systemctl disable ollama
    ```

    Windows 측에서 `%USERPROFILE%\.wslconfig`에 다음을 추가한 후
    `wsl --shutdown`을 실행하십시오:

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    또는 keep-alive 시간을 줄이거나 필요한 경우에만 Ollama를 수동으로 시작하십시오:

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)을 참조하십시오.

  </Accordion>

  <Accordion title="Ollama가 감지되지 않음">
    Ollama가 실행 중이고, `OLLAMA_API_KEY`(또는 인증 프로필)가 설정되어 있으며,
    `models.providers.ollama`가 명시적으로 정의되어 있지 **않은지** 확인하십시오:

    ```bash
    ollama serve
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="사용 가능한 모델 없음">
    모델을 로컬로 가져오거나
    `models.providers.ollama`에 명시적으로 정의하십시오.

    ```bash
    ollama list  # 설치된 항목 확인
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 또는 다른 모델
    ```

  </Accordion>

  <Accordion title="연결 거부됨">
    ```bash
    # Ollama가 실행 중인지 확인
    ps aux | grep ollama

    # 또는 Ollama 다시 시작
    ollama serve
    ```

  </Accordion>

  <Accordion title="원격 호스트는 curl에서 작동하지만 OpenClaw에서는 작동하지 않음">
    Gateway를 실행하는 동일한 머신과 런타임에서 확인하십시오.

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    일반적인 원인:

    - `baseUrl`이 `localhost`를 가리키지만 Gateway는 Docker 또는 다른 호스트에서 실행됩니다.
    - URL에 `/v1`이 사용되어 네이티브 Ollama 대신 OpenAI 호환 동작이 선택됩니다.
    - 원격 호스트의 방화벽 또는 LAN 바인딩을 변경해야 합니다.
    - 모델이 노트북의 데몬에는 있지만 원격 데몬에는 없습니다.

  </Accordion>

  <Accordion title="모델이 도구 JSON을 텍스트로 출력함">
    일반적으로 공급자가 OpenAI 호환 모드이거나 모델이 도구 스키마를
    처리할 수 없는 경우입니다. 네이티브 모드를 사용하십시오.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    소형 로컬 모델이 여전히 도구 스키마를 처리하지 못하면 해당 모델 항목에
    `compat.supportsTools: false`를 설정하고 다시 테스트하십시오.

  </Accordion>

  <Accordion title="Kimi 또는 GLM이 깨진 기호를 반환함">
    길고 언어적 의미가 없는 기호의 연속으로 구성된 호스팅 Kimi/GLM 응답은
    성공적인 응답이 아니라 실패한 공급자 호출로 처리됩니다. 따라서 손상된
    텍스트를 세션에 저장하는 대신 일반적인 재시도, 폴백 또는 오류 처리가
    수행됩니다.

    문제가 다시 발생하면 모델 이름, 현재 세션 파일, 실행 시
    `Cloud + Local` 또는 `Cloud only` 중 무엇을 사용했는지 기록한 다음,
    새 세션과 폴백 모델을 사용해 보십시오.

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "정확히 다음과 같이 응답하십시오: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="콜드 로컬 모델의 시간 초과">
    대형 로컬 모델은 최초 로드에 오랜 시간이 걸릴 수 있습니다. 시간 초과를
    Ollama 공급자에만 적용하고, 선택적으로 턴 사이에도 모델이 로드된 상태를
    유지하십시오.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    호스트 자체의 연결 수락이 느린 경우 `timeoutSeconds`는 이 공급자의
    제한된 연결 시간 초과도 연장합니다.

  </Accordion>

  <Accordion title="대규모 컨텍스트 모델이 너무 느리거나 메모리가 부족함">
    많은 모델이 하드웨어에서 무리 없이 실행할 수 있는 크기보다 큰 컨텍스트를
    지원한다고 표시합니다. 네이티브 Ollama는 `params.num_ctx`가 설정되지
    않은 경우 자체 런타임 기본값을 사용합니다. 예측 가능한 첫 토큰 지연 시간을
    위해 OpenClaw의 예산과 Ollama의 요청 컨텍스트를 모두 제한하십시오.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw가 프롬프트를 너무 많이 전송하면 `contextWindow`를 낮추십시오.
    Ollama의 런타임 컨텍스트가 머신에 비해 너무 크면 `params.num_ctx`를
    낮추십시오. 생성 시간이 너무 길면 `maxTokens`를 낮추십시오.

  </Accordion>
</AccordionGroup>

<Note>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [자주 묻는 질문](/ko/help/faq).
</Note>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Ollama Cloud" href="/ko/providers/ollama-cloud" icon="cloud">
    전용 `ollama-cloud` 공급자를 사용하는 클라우드 전용 설정입니다.
  </Card>
  <Card title="모델 공급자" href="/ko/concepts/model-providers" icon="layers">
    모든 공급자, 모델 참조 및 장애 조치 동작의 개요입니다.
  </Card>
  <Card title="모델 선택" href="/ko/concepts/models" icon="brain">
    모델을 선택하고 구성하는 방법입니다.
  </Card>
  <Card title="Ollama 웹 검색" href="/ko/tools/ollama-search" icon="magnifying-glass">
    Ollama 기반 웹 검색의 전체 설정 및 동작 세부 정보입니다.
  </Card>
  <Card title="구성" href="/ko/gateway/configuration" icon="gear">
    전체 구성 참조입니다.
  </Card>
</CardGroup>
