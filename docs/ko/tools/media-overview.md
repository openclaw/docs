---
read_when:
    - 미디어 capability 개요를 찾고 있습니다.
    - 어떤 미디어 provider를 구성할지 결정하기
    - 비동기 미디어 생성이 어떻게 동작하는지 이해하기
summary: 미디어 생성, 이해, 음성 capability를 위한 통합 랜딩 페이지
title: 미디어 개요
x-i18n:
    generated_at: "2026-04-25T06:12:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3d8b84dbb849348cbf00731104863c1732f42f19959c1deec8185bd41e9034e4
    source_path: tools/media-overview.md
    workflow: 15
---

# 미디어 생성 및 이해

OpenClaw는 이미지, 비디오, 음악을 생성하고, 인바운드 미디어(이미지, 오디오, 비디오)를 이해하며, text-to-speech로 응답을 음성으로 읽어줍니다. 모든 미디어 capability는 도구 기반입니다. 에이전트는 대화에 따라 언제 사용할지 결정하며, 각 도구는 이를 지원하는 provider가 하나 이상 구성된 경우에만 나타납니다.

## capability 한눈에 보기

| Capability           | 도구             | Providers                                                                                   | 수행 기능                                               |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 이미지 생성          | `image_generate` | ComfyUI, fal, Google, MiniMax, OpenAI, Vydra, xAI                                           | 텍스트 프롬프트 또는 참조로 이미지 생성 또는 편집       |
| 비디오 생성          | `video_generate` | Alibaba, BytePlus, ComfyUI, fal, Google, MiniMax, OpenAI, Qwen, Runway, Together, Vydra, xAI | 텍스트, 이미지 또는 기존 비디오로 비디오 생성           |
| 음악 생성            | `music_generate` | ComfyUI, Google, MiniMax                                                                    | 텍스트 프롬프트로 음악 또는 오디오 트랙 생성            |
| text-to-speech (TTS) | `tts`            | ElevenLabs, Google, Gradium, Microsoft, MiniMax, OpenAI, Vydra, xAI                         | 아웃바운드 응답을 음성 오디오로 변환                    |
| 미디어 이해          | (자동)           | 비전/오디오 지원 모델 provider 및 CLI fallback                                              | 인바운드 이미지, 오디오, 비디오 요약                    |

## provider capability 매트릭스

이 표는 플랫폼 전반에서 어떤 provider가 어떤 미디어 capability를 지원하는지 보여줍니다.

| Provider   | 이미지 | 비디오 | 음악 | TTS | STT / 전사 | Realtime Voice | 미디어 이해 |
| ---------- | ----- | ----- | ----- | --- | ------------------- | -------------- | ------------------- |
| Alibaba    |       | 예    |       |     |                     |                |                     |
| BytePlus   |       | 예    |       |     |                     |                |                     |
| ComfyUI    | 예    | 예    | 예    |     |                     |                |                     |
| Deepgram   |       |       |       |     | 예                  |                |                     |
| ElevenLabs |       |       |       | 예  | 예                  |                |                     |
| fal        | 예    | 예    |       |     |                     |                |                     |
| Google     | 예    | 예    | 예    | 예  |                     | 예             | 예                  |
| Gradium    |       |       |       | 예  |                     |                |                     |
| Microsoft  |       |       |       | 예  |                     |                |                     |
| MiniMax    | 예    | 예    | 예    | 예  |                     |                |                     |
| Mistral    |       |       |       |     | 예                  |                |                     |
| OpenAI     | 예    | 예    |       | 예  | 예                  | 예             | 예                  |
| Qwen       |       | 예    |       |     |                     |                |                     |
| Runway     |       | 예    |       |     |                     |                |                     |
| Together   |       | 예    |       |     |                     |                |                     |
| Vydra      | 예    | 예    |       | 예  |                     |                |                     |
| xAI        | 예    | 예    |       | 예  | 예                  |                | 예                  |

<Note>
미디어 이해는 provider config에 등록된 비전 가능 또는 오디오 가능 모델을 사용합니다. 위 표는 전용 미디어 이해 지원이 있는 provider를 강조한 것입니다. 멀티모달 모델을 가진 대부분의 LLM provider(Anthropic, Google, OpenAI 등)도 활성 응답 모델로 구성되어 있으면 인바운드 미디어를 이해할 수 있습니다.
</Note>

## 비동기 생성 방식

비디오와 음악 생성은 provider 처리에 보통 30초에서 수분이 걸리기 때문에 백그라운드 작업으로 실행됩니다. 에이전트가 `video_generate` 또는 `music_generate`를 호출하면, OpenClaw는 provider에 요청을 제출하고 즉시 task ID를 반환한 뒤 작업 원장에 작업을 추적합니다. 작업이 실행되는 동안에도 에이전트는 다른 메시지에 계속 응답합니다. provider가 완료되면 OpenClaw는 에이전트를 깨워 원래 채널에 완성된 미디어를 게시할 수 있게 합니다. 이미지 생성과 TTS는 동기식이며 응답과 함께 인라인으로 완료됩니다.

Deepgram, ElevenLabs, Mistral, OpenAI, xAI는 모두 구성되어 있으면
배치 `tools.media.audio` 경로를 통해 인바운드
오디오를 전사할 수 있습니다. Deepgram,
ElevenLabs, Mistral, OpenAI, xAI는 Voice Call 스트리밍 STT
provider도 등록하므로, 완료된 녹음을 기다리지 않고
실시간 전화 오디오를 선택된 vendor로 전달할 수 있습니다.

Google은 OpenClaw의 이미지, 비디오, 음악, 배치 TTS, 백엔드 realtime
voice, 미디어 이해 표면에 매핑됩니다. OpenAI는 OpenClaw의 이미지,
비디오, 배치 TTS, 배치 STT, Voice Call 스트리밍 STT, 백엔드 realtime voice,
메모리 임베딩 표면에 매핑됩니다. xAI는 현재 OpenClaw의 이미지, 비디오,
검색, 코드 실행, 배치 TTS, 배치 STT, Voice Call 스트리밍 STT
표면에 매핑됩니다. xAI Realtime voice는 업스트림 capability이지만,
공용 realtime voice 계약이 이를 표현할 수 있게 되기 전까지는 OpenClaw에
등록되지 않습니다.

## 빠른 링크

- [Image Generation](/ko/tools/image-generation) -- 이미지 생성 및 편집
- [Video Generation](/ko/tools/video-generation) -- 텍스트-투-비디오, 이미지-투-비디오, 비디오-투-비디오
- [Music Generation](/ko/tools/music-generation) -- 음악 및 오디오 트랙 생성
- [Text-to-Speech](/ko/tools/tts) -- 응답을 음성 오디오로 변환
- [Media Understanding](/ko/nodes/media-understanding) -- 인바운드 이미지, 오디오, 비디오 이해

## 관련

- [Image generation](/ko/tools/image-generation)
- [Video generation](/ko/tools/video-generation)
- [Music generation](/ko/tools/music-generation)
- [Text-to-speech](/ko/tools/tts)
