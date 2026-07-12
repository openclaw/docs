---
read_when:
    - OpenClaw에서 로컬 ComfyUI 워크플로를 사용하려고 합니다
    - 이미지, 동영상 또는 음악 워크플로에 Comfy Cloud를 사용하려는 경우
    - 번들로 제공되는 comfy Plugin의 구성 키가 필요합니다.
summary: OpenClaw에서 ComfyUI 워크플로를 사용한 이미지, 동영상 및 음악 생성 설정
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T15:38:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw에는 워크플로 기반 ComfyUI 실행을 위한 `comfy` Plugin이 번들로 제공됩니다. 이
Plugin은 전적으로 워크플로를 기반으로 작동합니다. OpenClaw는 일반적인 `size`,
`aspectRatio`, `resolution`, `durationSeconds` 또는 TTS 방식의 제어를
그래프에 매핑하지 않습니다.

| 속성        | 세부 정보                                                                        |
| ----------- | -------------------------------------------------------------------------------- |
| 제공자      | `comfy`                                                                          |
| 모델        | `comfy/workflow`                                                                 |
| 공유 도구   | `image_generate`, `video_generate`, `music_generate`                             |
| 인증        | 로컬 ComfyUI에는 필요 없음, Comfy Cloud에는 `COMFY_API_KEY` 또는 `COMFY_CLOUD_API_KEY` |
| API         | ComfyUI `/prompt` / `/history` / `/view`, Comfy Cloud `/api/*`                   |

## 지원 기능

- 워크플로 JSON을 사용한 이미지 생성 및 편집(편집에는 업로드된 참조 이미지 1개 사용)
- 워크플로 JSON을 사용한 텍스트-비디오 또는 이미지-비디오 생성(참조 이미지 1개)
- 공유 `music_generate` 도구를 통한 음악/오디오 생성(선택적으로 참조 이미지 1개 사용)
- 구성된 Node에서 출력 다운로드 또는 Node가 구성되지 않은 경우 일치하는 모든 출력 Node에서 다운로드

## 시작하기

자체 컴퓨터에서 ComfyUI를 실행할지 Comfy Cloud를 사용할지 선택하십시오.

<Tabs>
  <Tab title="로컬">
    **적합한 용도:** 자체 컴퓨터 또는 LAN에서 ComfyUI 인스턴스를 실행하는 경우.

    <Steps>
      <Step title="ComfyUI를 로컬에서 시작">
        로컬 ComfyUI 인스턴스가 실행 중인지 확인하십시오(기본값은 `http://127.0.0.1:8188`).
      </Step>
      <Step title="워크플로 JSON 준비">
        ComfyUI 워크플로 JSON 파일을 내보내거나 생성하십시오. 프롬프트 입력 Node와 OpenClaw가 출력을 읽을 Node의 Node ID를 기록해 두십시오.
      </Step>
      <Step title="제공자 구성">
        `mode: "local"`을 설정하고 워크플로 파일을 지정하십시오. 최소 이미지 예시는 다음과 같습니다.

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="기본 모델 설정">
        구성한 기능에 대해 OpenClaw가 `comfy/workflow` 모델을 사용하도록 지정하십시오.

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="확인">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **적합한 용도:** 로컬 GPU 리소스를 관리하지 않고 Comfy Cloud에서 워크플로를 실행하는 경우.

    <Steps>
      <Step title="API 키 발급">
        [comfy.org](https://comfy.org)에서 가입하고 계정 대시보드에서 API 키를 생성하십시오.
      </Step>
      <Step title="API 키 설정">
        다음 방법 중 하나로 키를 제공하십시오.

        ```bash
        # 온보딩 플래그
        openclaw onboard --comfy-api-key "your-key"

        # 환경 변수(데몬에 권장)
        export COMFY_API_KEY="your-key"

        # 대체 환경 변수
        export COMFY_CLOUD_API_KEY="your-key"

        # 또는 구성에 인라인으로 지정
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="워크플로 JSON 준비">
        ComfyUI 워크플로 JSON 파일을 내보내거나 생성하십시오. 프롬프트 입력 Node와 출력 Node의 Node ID를 기록해 두십시오.
      </Step>
      <Step title="제공자 구성">
        `mode: "cloud"`를 설정하고 워크플로 파일을 지정하십시오.

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        클라우드 모드에서 `baseUrl`의 기본값은 `https://cloud.comfy.org`입니다. 사용자 지정 클라우드 엔드포인트를 사용할 때만 `baseUrl`을 설정하십시오.
        </Tip>
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="확인">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 구성

Comfy는 공유 최상위 연결 설정과 기능별 워크플로 섹션(`image`, `video`, `music`)을 지원합니다.

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### 공유 키

| 키                    | 유형                     | 설명                                                                                  |
| --------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` 또는 `"cloud"` | 연결 모드입니다. 기본값은 `"local"`입니다.                                            |
| `baseUrl`             | 문자열                   | 로컬에서는 `http://127.0.0.1:8188`, 클라우드에서는 `https://cloud.comfy.org`가 기본값입니다. |
| `apiKey`              | 문자열                   | 선택적 인라인 키이며 `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` 환경 변수의 대안입니다. |
| `allowPrivateNetwork` | 불리언                   | 클라우드 모드에서 비공개/LAN `baseUrl` 또는 로컬 비공개 DNS FQDN을 허용합니다.       |

<Note>
`local` 모드에서는 루프백/비공개 IP 리터럴과 `http://comfyui:8188` 같은 단일 레이블 서비스 이름이 `allowPrivateNetwork` 없이 작동합니다. `https://comfy.local.example.com`처럼 공개 주소로 보이는 비공개 DNS FQDN에는 `allowPrivateNetwork: true`가 필요합니다. 비공개 출처에 대한 신뢰는 구성된 스킴, 호스트 이름 및 포트로 제한됩니다. 로컬 리디렉션은 구성된 호스트 이름을 벗어날 수 없으며, 공개 CDN으로 향하는 클라우드 리디렉션에는 기본 SSRF 정책이 적용됩니다.
</Note>

### 기능별 키

다음 키는 `image`, `video` 또는 `music` 섹션 내부에 적용됩니다.

| 키                           | 필수                               | 기본값    | 설명                                                                       |
| ---------------------------- | ---------------------------------- | --------- | -------------------------------------------------------------------------- |
| `workflow` 또는 `workflowPath` | 예                               | --        | 인라인 워크플로 JSON 또는 ComfyUI 워크플로 JSON 파일의 경로입니다.        |
| `promptNodeId`               | 예                                 | --        | 텍스트 프롬프트를 받는 Node ID입니다.                                     |
| `promptInputName`            | 아니요                             | `"text"`  | 프롬프트 Node의 입력 이름입니다.                                          |
| `outputNodeId`               | 아니요                             | --        | 출력을 읽을 Node ID입니다. 생략하면 일치하는 모든 출력 Node가 사용됩니다. |
| `pollIntervalMs`             | 아니요                             | `1500`    | 작업 완료 여부를 확인하는 폴링 간격(밀리초)입니다.                        |
| `timeoutMs`                  | 아니요                             | `300000`  | 워크플로 실행 제한 시간(밀리초)입니다.                                    |

`image` 및 `video` 섹션은 참조 이미지 입력 Node도 지원합니다.

| 키                    | 필수                          | 기본값    | 설명                                      |
| --------------------- | ----------------------------- | --------- | ----------------------------------------- |
| `inputImageNodeId`    | 예(참조 이미지를 전달할 때)   | --        | 업로드된 참조 이미지를 받는 Node ID입니다. |
| `inputImageInputName` | 아니요                        | `"image"` | 이미지 Node의 입력 이름입니다.           |

`apiKey`에는 리터럴 문자열 또는 [시크릿 참조](/ko/gateway/configuration-reference#secrets) 객체를 사용할 수 있습니다.

## 워크플로 세부 정보

<AccordionGroup>
  <Accordion title="이미지 워크플로">
    기본 이미지 모델을 `comfy/workflow`로 설정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **참조 이미지 편집 예시:**

    업로드된 참조 이미지를 사용한 이미지 편집을 활성화하려면 이미지 구성에 `inputImageNodeId`를 추가하십시오.

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="비디오 워크플로">
    기본 비디오 모델을 `comfy/workflow`로 설정하십시오.

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy 비디오 워크플로는 구성된 그래프를 통해 텍스트-비디오 및 이미지-비디오 생성을 지원합니다.

    <Note>
    OpenClaw는 입력 비디오를 Comfy 워크플로에 전달하지 않습니다. 입력으로는 텍스트 프롬프트와 단일 참조 이미지만 지원됩니다.
    </Note>

  </Accordion>

  <Accordion title="음악 워크플로">
    번들 Plugin은 워크플로에 정의된 오디오 또는 음악 출력을 위한 음악 생성 제공자를 등록하며, 공유 `music_generate` 도구를 통해 제공됩니다. 선택적으로 참조 이미지를 받을 수 있습니다(최대 1개).

    ```text
    /tool music_generate prompt="부드러운 테이프 질감이 있는 따뜻한 앰비언트 신시사이저 루프"
    ```

    `music` 구성 섹션을 사용하여 오디오 워크플로 JSON과 출력 Node를 지정하십시오.

  </Accordion>

  <Accordion title="이전 버전과의 호환성">
    중첩된 `image` 섹션이 없는 기존 최상위 이미지 구성도 계속 작동합니다.

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw는 이 레거시 형식을 이미지 워크플로 구성으로 처리합니다. 즉시 마이그레이션할 필요는 없지만 새 설정에는 중첩된 `image` / `video` / `music` 섹션을 사용하는 것이 좋습니다. 이미지 생성만 사용하는 경우 레거시 플랫 구성과 새 중첩 `image` 섹션은 기능적으로 동일합니다.

  </Accordion>

  <Accordion title="라이브 테스트">
    번들 Plugin에는 선택적으로 활성화할 수 있는 라이브 테스트 범위가 제공됩니다.

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    라이브 테스트는 일치하는 Comfy 워크플로 섹션이 구성되어 있지 않으면 개별 이미지, 동영상 또는 음악 사례를 건너뜁니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    이미지 생성 도구의 구성 및 사용법입니다.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    동영상 생성 도구의 구성 및 사용법입니다.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    음악 및 오디오 생성 도구 설정입니다.
  </Card>
  <Card title="제공자 디렉터리" href="/ko/providers/index" icon="layers">
    모든 제공자와 모델 참조의 개요입니다.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/config-agents#agent-defaults" icon="gear">
    에이전트 기본값을 포함한 전체 구성 참조입니다.
  </Card>
</CardGroup>
