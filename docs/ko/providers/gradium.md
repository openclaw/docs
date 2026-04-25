---
read_when:
    - text-to-speech에 Gradium을 사용하려고 합니다
    - Gradium API 키 또는 음성 구성이 필요합니다
summary: OpenClaw에서 Gradium text-to-speech 사용하기
title: Gradium
x-i18n:
    generated_at: "2026-04-25T06:09:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed836c836ad4e5f5033fa982b28341ce0b37f6972a8eb1bb5a2b0b5619859bcb
    source_path: providers/gradium.md
    workflow: 15
---

Gradium은 OpenClaw에 번들된 text-to-speech provider입니다. 일반 오디오 응답, 음성 메모 호환 Opus 출력, 그리고 전화 표면용 8 kHz u-law 오디오를 생성할 수 있습니다.

## 설정

Gradium API 키를 만든 다음 OpenClaw에 노출하세요:

```bash
export GRADIUM_API_KEY="gsk_..."
```

키를 `messages.tts.providers.gradium.apiKey` 아래 config에 저장할 수도 있습니다.

## config

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

## 출력

- 오디오 파일 응답은 WAV를 사용합니다.
- 음성 메모 응답은 Opus를 사용하며 voice-compatible로 표시됩니다.
- 전화 합성은 8 kHz에서 `ulaw_8000`을 사용합니다.

## 관련

- [Text-to-Speech](/ko/tools/tts)
- [미디어 개요](/ko/tools/media-overview)
