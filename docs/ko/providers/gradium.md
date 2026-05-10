---
read_when:
    - 텍스트 음성 변환에는 Gradium이 적합합니다
    - Gradium API 키, 음성 또는 지시문 토큰 구성이 필요합니다
summary: OpenClaw에서 Gradium 텍스트 음성 변환 사용
title: Gradium
x-i18n:
    generated_at: "2026-05-10T19:49:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c79da6ec63532061a8112965a679f1113bbefcc91ee00def8153dd39b5b5e58
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai)은 OpenClaw에 번들로 제공되는 텍스트 음성 변환 제공자입니다. 이 Plugin은 일반 오디오 응답(WAV), 음성 메모 호환 Opus 출력, 전화 통신 표면용 8 kHz u-law 오디오를 렌더링할 수 있습니다.

| 속성          | 값                                   |
| ------------- | ------------------------------------ |
| 제공자 id     | `gradium`                            |
| 인증          | `GRADIUM_API_KEY` 또는 config `apiKey` |
| 기본 URL      | `https://api.gradium.ai` (기본값)    |
| 기본 음성     | `Emma` (`YTpq7expH9539ERJ`)          |

## 설정

Gradium API 키를 만든 다음, env var 또는 config 키를 사용해 OpenClaw에 노출하세요.

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

이 Plugin은 먼저 해석된 `apiKey`를 확인하고, 없으면 `GRADIUM_API_KEY` 환경 변수로 대체합니다.

## 구성

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| 키                                       | 유형   | 설명                                                                                         |
| ---------------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`  | string | 해석된 API 키입니다. `${ENV}` 및 secret refs를 지원합니다.                                   |
| `messages.tts.providers.gradium.baseUrl` | string | API origin을 재정의합니다. 끝의 슬래시는 제거됩니다. 기본값은 `https://api.gradium.ai`입니다. |
| `messages.tts.providers.gradium.voiceId` | string | directive 재정의가 없을 때 사용되는 기본 음성 id입니다.                                      |

출력 오디오 형식은 대상 표면을 기준으로 런타임이 자동으로 선택하며, `openclaw.json`에서 구성할 수 없습니다. 아래 [출력](#output)을 참조하세요.

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

활성 음성 정책이 음성 재정의를 허용하면 directive token을 사용해 인라인으로 음성을 전환할 수 있습니다. 다음은 모두 동일한 `voiceId` 재정의로 해석됩니다.

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

| 대상          | 형식        | 파일 확장자 | 샘플 속도 | 음성 호환 플래그 |
| ------------- | ----------- | ----------- | --------- | ---------------- |
| 표준 오디오   | `wav`       | `.wav`      | 제공자    | 아니요           |
| 음성 메모     | `opus`      | `.opus`     | 제공자    | 예               |
| 전화 통신     | `ulaw_8000` | n/a         | 8 kHz     | n/a              |

## 자동 선택 순서

구성된 TTS 제공자 중 Gradium의 자동 선택 순서는 `30`입니다. `messages.tts.provider`가 고정되어 있지 않을 때 OpenClaw가 활성 제공자를 선택하는 방식은 [텍스트 음성 변환](/ko/tools/tts)을 참조하세요.

## 관련 항목

- [텍스트 음성 변환](/ko/tools/tts)
- [미디어 개요](/ko/tools/media-overview)
