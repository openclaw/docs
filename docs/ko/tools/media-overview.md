---
read_when:
    - OpenClaw의 미디어 기능 개요 알아보기
    - 구성할 미디어 제공업체 결정하기
    - 비동기 미디어 생성의 작동 방식 이해하기
sidebarTitle: Media overview
summary: 이미지, 동영상, 음악, 음성 및 미디어 이해 기능 한눈에 보기
title: 미디어 개요
x-i18n:
    generated_at: "2026-07-12T15:49:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f7d7bf8bd2052cdba088d7a612bb89b0fc3a95b3635c7fcd2138eb731121b85f
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw은 이미지, 동영상 및 음악을 생성하고, 수신 미디어
(이미지, 오디오, 동영상)를 이해하며, 텍스트 음성 변환으로 응답을 소리 내어 말합니다. 모든
미디어 기능은 도구 기반입니다. 에이전트가 대화에 따라 사용 시점을 결정하며,
각 도구는 이를 지원하는 제공자가 하나 이상 구성된 경우에만 표시됩니다.

실시간 음성은 일회성 미디어 도구 경로 대신 Talk 세션 계약을 사용합니다.
Talk에는 제공자 네이티브 `realtime`, 로컬 또는 스트리밍
`stt-tts`, 관찰 전용 음성 캡처를 위한 `transcription`이라는 세 가지 모드가 있습니다. 이러한 모드는
전화 통신, 회의, 브라우저 실시간 통신 및 네이티브 푸시투토크 클라이언트와
제공자 카탈로그, 이벤트 봉투 및 취소 의미 체계를 공유합니다.

## 기능

<CardGroup cols={2}>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    `image_generate`를 통해 텍스트 프롬프트 또는 참조 이미지로 이미지를
    생성하고 편집합니다. 채팅 세션에서는 비동기로 작동하며, 백그라운드에서 실행된 후
    준비되면 결과를 게시합니다.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    `video_generate`를 통한 텍스트-동영상, 이미지-동영상 및 동영상-동영상 변환입니다.
    비동기로 작동하며, 백그라운드에서 실행된 후 준비되면 결과를 게시합니다.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    `music_generate`를 통해 음악 또는 오디오 트랙을 생성합니다. 채팅
    세션에서 공유 미디어 생성 작업 수명 주기를 따라 비동기로 작동합니다.
  </Card>
  <Card title="텍스트 음성 변환" href="/ko/tools/tts" icon="microphone">
    `tts` 도구와 `messages.tts` 구성을 통해 발신 응답을 음성 오디오로
    변환합니다. 동기식입니다.
  </Card>
  <Card title="미디어 이해" href="/ko/nodes/media-understanding" icon="eye">
    비전 기능을 지원하는 모델 제공자와 전용 미디어 이해 Plugin을 사용하여
    수신 이미지, 오디오 및 동영상을 요약합니다.
  </Card>
  <Card title="음성 텍스트 변환" href="/ko/nodes/audio" icon="ear-listen">
    배치 STT 또는 Voice Call 스트리밍 STT 제공자를 통해 수신 음성 메시지를
    전사합니다.
  </Card>
</CardGroup>

## 제공자 기능 매트릭스

<Note>
이 표에서는 전용 미디어 생성, TTS 및 STT Plugin을 다룹니다. 많은
채팅 모델 제공자(Anthropic, Google, OpenAI 등)도 응답 모델을 통해
수신 미디어를 이해합니다. 전체 제공자 목록은
[미디어 이해](/ko/nodes/media-understanding#provider-support-matrix)를 참조하십시오.
</Note>

| 제공자            | 이미지 | 동영상 | 음악 | TTS | STT | 실시간 음성 | 미디어 이해 |
| ----------------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba           |       |   ✓   |       |     |     |                |                     |
| Azure Speech      |       |       |       |  ✓  |     |                |                     |
| BytePlus          |       |   ✓   |       |     |     |                |                     |
| ComfyUI           |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Deepgram          |       |       |       |     |  ✓  |                |                     |
| DeepInfra         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| ElevenLabs        |       |       |       |  ✓  |  ✓  |                |                     |
| fal               |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Google            |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |       ✓        |          ✓          |
| Gradium           |       |       |       |  ✓  |     |                |                     |
| Inworld           |       |       |       |  ✓  |     |                |                     |
| LiteLLM           |   ✓   |       |       |     |     |                |                     |
| Local CLI         |       |       |       |  ✓  |     |                |                     |
| Microsoft         |       |       |       |  ✓  |     |                |                     |
| Microsoft Foundry |   ✓   |       |       |     |     |                |                     |
| MiniMax           |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral           |       |       |       |     |  ✓  |                |                     |
| OpenAI            |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter        |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                |          ✓          |
| PixVerse          |       |   ✓   |       |     |     |                |                     |
| Qwen              |       |   ✓   |       |     |     |                |          ✓          |
| Runway            |       |   ✓   |       |     |     |                |                     |
| SenseAudio        |       |       |       |     |  ✓  |                |                     |
| Together          |       |   ✓   |       |     |     |                |                     |
| Volcengine        |       |       |       |  ✓  |     |                |                     |
| Vydra             |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI               |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo       |       |       |       |  ✓  |     |                |                     |

<Note>
여기서 **실시간 음성**은 제공자 네이티브 양방향 실시간 통신(Talk
`realtime` 모드, 예: Gemini Live 또는 OpenAI Realtime API)을 의미하며, 현재는 Google과
OpenAI만 이를 등록합니다. Deepgram, ElevenLabs, Mistral, OpenAI 및 xAI는
Voice Call 스트리밍 STT(단방향 오디오-텍스트 변환)를 별도로 등록합니다. 아래의
[음성 텍스트 변환 및 Voice Call](#speech-to-text-and-voice-call)을 참조하십시오.
xAI 실시간 음성은 업스트림 기능이지만, 공유 실시간 음성 계약이 이를
표현할 수 있을 때까지 OpenClaw에 등록되지 않습니다.
</Note>

## 비동기와 동기

| 기능           | 모드       | 이유                                                                                                  |
| -------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| 이미지         | 비동기     | 제공자 처리가 채팅 턴보다 오래 지속될 수 있으며, 생성된 첨부 파일은 공유 완료 경로를 사용합니다.     |
| 텍스트 음성 변환 | 동기     | 제공자 응답이 수초 내에 반환되며, 응답 오디오에 첨부됩니다.                                           |
| 동영상         | 비동기     | 제공자 처리에 30 s에서 수분이 걸리며, 느린 대기열은 구성된 제한 시간까지 실행될 수 있습니다.          |
| 음악           | 비동기     | 동영상과 동일한 제공자 처리 특성을 가집니다.                                                          |

비동기 도구의 경우 OpenClaw은 제공자에게 요청을 제출하고, 작업
ID를 즉시 반환하며, 작업 원장에서 작업을 추적합니다. 작업이 실행되는 동안에도 에이전트는
다른 메시지에 계속 응답합니다. 제공자가 작업을 완료하면
OpenClaw은 생성된 미디어 경로와 함께 에이전트를 깨워, 세션의 일반적인 가시적 응답
모드를 통해 사용자에게 알릴 수 있게 합니다. 구성된 경우 자동 최종 응답
전달을 사용하고, 세션에 메시지 도구가 필요한 경우 `message(action="send")`를 사용합니다.
요청자 세션이 비활성 상태이거나 활성 깨우기가
실패하고, 생성된 미디어 중 일부가 여전히 완료 응답에 누락된 경우
OpenClaw은 누락된 미디어만 포함하는 멱등성 직접 폴백을 전송합니다. 완료 응답으로
이미 전달된 미디어는 다시 게시되지 않습니다.

## 음성 텍스트 변환 및 Voice Call

Deepgram, DeepInfra, ElevenLabs, Google, Groq, Mistral, OpenAI, OpenRouter,
SenseAudio 및 xAI는 구성된 경우 모두 배치
`tools.media.audio` 경로를 통해 수신 오디오를 전사할 수 있습니다. 멘션 게이팅 또는 명령 구문 분석을 위해
음성 메모를 사전 검사하는 채널 Plugin은 수신 컨텍스트에 전사된
첨부 파일을 표시하므로, 공유 미디어 이해 단계가 동일한
오디오에 대해 두 번째 STT 호출을 수행하는 대신 해당 전사를 재사용합니다.

Deepgram, ElevenLabs, Mistral, OpenAI 및 xAI는 Voice Call
스트리밍 STT 제공자도 등록하므로, 녹음 완료를 기다리지 않고 실시간 전화 오디오를 선택한
공급업체로 전달할 수 있습니다.

실시간 사용자 대화에는 [Talk 모드](/ko/nodes/talk)를 사용하는 것이 좋습니다. 배치 오디오
첨부 파일은 미디어 경로에 유지합니다. 브라우저 실시간 통신, 네이티브 푸시투토크,
전화 통신 및 회의 오디오는 Talk 이벤트와 Gateway가 반환하는 세션 범위
카탈로그를 사용해야 합니다.

## 제공자 매핑(공급업체가 기능 영역별로 분리되는 방식)

<AccordionGroup>
  <Accordion title="Google">
    이미지, 동영상, 음악, 배치 TTS, 배치 STT, 백엔드 실시간 음성 및
    미디어 이해 기능 영역입니다.
  </Accordion>
  <Accordion title="OpenAI">
    이미지, 동영상, 배치 TTS, 배치 STT, Voice Call 스트리밍 STT, 백엔드
    실시간 음성 및 메모리 임베딩 기능 영역입니다.
  </Accordion>
  <Accordion title="DeepInfra">
    채팅/모델 라우팅, 이미지 생성/편집, 텍스트-동영상 변환, 배치 TTS,
    배치 STT, 이미지 미디어 이해 및 메모리 임베딩 기능 영역입니다.
    DeepInfra는 재순위화, 분류, 객체 감지 및
    기타 네이티브 모델 유형도 제공합니다. OpenClaw에는 아직 이러한
    범주를 위한 제공자 계약이 없으므로 이 Plugin은 이를 등록하지 않습니다.
  </Accordion>
  <Accordion title="xAI">
    이미지, 동영상, 검색, 코드 실행, 배치 TTS, 배치 STT 및 Voice
    Call 스트리밍 STT입니다. xAI 실시간 음성은 업스트림 기능이지만,
    공유 실시간 음성 계약이 이를 표현할 수 있을 때까지
    OpenClaw에 등록되지 않습니다.
  </Accordion>
</AccordionGroup>

## 관련 문서

- [이미지 생성](/ko/tools/image-generation)
- [동영상 생성](/ko/tools/video-generation)
- [음악 생성](/ko/tools/music-generation)
- [텍스트 음성 변환](/ko/tools/tts)
- [미디어 이해](/ko/nodes/media-understanding)
- [오디오 Node](/ko/nodes/audio)
- [Talk 모드](/ko/nodes/talk)
