---
read_when:
    - 텍스트 음성 변환에 Gradium을 사용하려는 경우
    - Gradium API 키, 음성 또는 지시문 토큰 구성이 필요합니다
summary: OpenClaw에서 Gradium 텍스트 음성 변환 사용하기
title: Gradium
x-i18n:
    generated_at: "2026-07-12T15:39:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 80120b1951115b6c81247c6bc6bc3c8834ef454c30d32f1d854cd3cca0870750
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai)은 OpenClaw용 텍스트 음성 변환 제공업체입니다. 표준 오디오 응답(WAV), 음성 메모와 호환되는 Opus 출력, 전화 통신 인터페이스용 8 kHz u-law 오디오를 렌더링합니다.

| 속성          | 값                                   |
| ------------- | ------------------------------------ |
| 제공업체 ID   | `gradium`                            |
| 인증          | `GRADIUM_API_KEY` 또는 구성 `apiKey` |
| 기본 URL      | `https://api.gradium.ai` (기본값)    |
| 기본 음성     | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin 설치

Gradium은 공식 외부 Plugin입니다. 설치한 후 Gateway를 다시 시작하십시오.

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## 설정

Gradium API 키를 생성한 후 환경 변수 또는 구성 키로 제공하십시오. 구성 값이 환경 변수보다 우선합니다.

<Tabs>
  <Tab title="환경 변수">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="구성 키">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## 구성

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| 키                                              | 유형   | 설명                                                                                                   |
| ----------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| `messages.tts.providers.gradium.apiKey`         | string | 해석된 API 키입니다. `${ENV}` 및 보안 비밀 참조를 지원합니다.                                         |
| `messages.tts.providers.gradium.baseUrl`        | string | `api.gradium.ai`의 HTTPS Gradium API URL입니다. 후행 슬래시는 제거됩니다. 기본값은 `https://api.gradium.ai`입니다. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | 지시어 재정의가 없을 때 사용하는 기본 음성 ID입니다.                                                   |

출력 형식은 대상 인터페이스에 따라 자동으로 선택되며([출력](#output) 참조), `openclaw.json`에서 구성할 수 없습니다.

## 음성

| 이름               | 음성 ID            |
| ------------------ | ------------------ |
| Arthur             | `3jUdJyOi9pgbxBTK` |
| Christina          | `2H4HY2CBNyJHBCrP` |
| Emma **(기본값)**  | `YTpq7expH9539ERJ` |
| John               | `KWJiFWu2O9nMPYcR` |
| Kent               | `LFZvm12tW_z0xfGo` |
| Sydney             | `jtEKaLYNn6iif5PR` |
| Tiffany            | `Eu9iL_CYe8N-Gkx_` |

### 메시지별 음성 재정의

활성 음성 정책에서 음성 재정의를 허용하는 경우 지시어 토큰을 사용하여 인라인으로 음성을 전환할 수 있습니다(다음 토큰은 모두 동일하며 제공업체 네이티브 음성 ID를 받습니다).

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

음성 정책에서 음성 재정의를 비활성화하면 지시어가 소비되지만 무시됩니다.

## 출력

출력 형식은 대상 인터페이스에 따라 선택되며, 제공업체는 다른 형식을 합성하지 않습니다.

| 대상        | 형식        | 파일 확장자 | 샘플링 레이트 | 음성 호환 플래그 |
| ----------- | ----------- | ----------- | --------------- | ---------------- |
| 표준 오디오 | `wav`       | `.wav`      | 제공업체        | 아니요           |
| 음성 메모   | `opus`      | `.opus`     | 제공업체        | 예               |
| 전화 통신   | `ulaw_8000` | 해당 없음   | 8 kHz           | 해당 없음        |

## 자동 선택 순서

구성된 TTS 제공업체 중 Gradium의 자동 선택 순서는 `30`입니다. `messages.tts.provider`가 고정되지 않았을 때 OpenClaw가 활성 제공업체를 선택하는 방법은 [텍스트 음성 변환](/ko/tools/tts)을 참조하십시오.

## 관련 문서

- [텍스트 음성 변환](/ko/tools/tts)
- [미디어 개요](/ko/tools/media-overview)
