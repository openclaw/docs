---
read_when:
    - 텍스트 음성 변환에는 Gradium을 사용하는 것이 좋습니다
    - Gradium API 키, 음성 또는 지시문 토큰 구성이 필요합니다
summary: OpenClaw에서 Gradium 텍스트 음성 변환 사용
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:02:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai)은 OpenClaw용 텍스트 음성 변환 제공자입니다. 이 Plugin은 일반 오디오 응답(WAV), 음성 메모 호환 Opus 출력, 전화 통신 표면용 8 kHz u-law 오디오를 렌더링할 수 있습니다.

| 속성          | 값                                   |
| ------------- | ------------------------------------ |
| 제공자 ID     | `gradium`                            |
| 인증          | `GRADIUM_API_KEY` 또는 config `apiKey` |
| 기본 URL      | `https://api.gradium.ai` (기본값)     |
| 기본 음성     | `Emma` (`YTpq7expH9539ERJ`)          |

## Plugin 설치

공식 Plugin을 설치한 다음 Gateway를 다시 시작합니다.

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## 설정

Gradium API 키를 만든 다음 환경 변수 또는 config 키를 사용해 OpenClaw에 노출합니다.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="Config key">
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

이 Plugin은 먼저 확인된 `apiKey`를 검사하고, 없으면 `GRADIUM_API_KEY` 환경 변수로 대체합니다.

## Config

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

| 키                                              | 유형   | 설명                                                                                          |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | 확인된 API 키입니다. `${ENV}`와 secret refs를 지원합니다.                                      |
| `messages.tts.providers.gradium.baseUrl`        | string | API origin을 재정의합니다. 뒤쪽 슬래시는 제거됩니다. 기본값은 `https://api.gradium.ai`입니다. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | directive 재정의가 없을 때 사용되는 기본 음성 ID입니다.                                       |

출력 오디오 형식은 대상 표면에 따라 런타임이 자동으로 선택하며 `openclaw.json`에서 설정할 수 없습니다. 아래 [출력](#output)을 참고하세요.

## 음성

| 이름      | 음성 ID            |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

기본 음성: Emma.

### 메시지별 음성 재정의

활성 음성 정책이 음성 재정의를 허용하는 경우 directive token을 사용해 인라인으로 음성을 전환할 수 있습니다. 제공자 네이티브 음성 ID에는 `speakerVoiceId`를 사용하세요.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

음성 정책이 음성 재정의를 비활성화하면 directive는 소비되지만 무시됩니다.

## 출력

런타임은 대상 표면에서 출력 형식을 선택합니다. 현재 제공자는 다른 형식을 합성하지 않습니다.

| 대상          | 형식        | 파일 확장자 | 샘플 레이트 | 음성 호환 플래그 |
| ------------- | ----------- | ----------- | ----------- | ---------------- |
| 표준 오디오   | `wav`       | `.wav`      | 제공자      | 아니요           |
| 음성 메모     | `opus`      | `.opus`     | 제공자      | 예               |
| 전화 통신     | `ulaw_8000` | n/a         | 8 kHz       | n/a              |

## 자동 선택 순서

구성된 TTS 제공자 중 Gradium의 자동 선택 순서는 `30`입니다. `messages.tts.provider`가 고정되지 않았을 때 OpenClaw가 활성 제공자를 선택하는 방식은 [텍스트 음성 변환](/ko/tools/tts)을 참고하세요.

## 관련 항목

- [텍스트 음성 변환](/ko/tools/tts)
- [미디어 개요](/ko/tools/media-overview)
