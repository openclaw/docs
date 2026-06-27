---
read_when:
    - OpenClaw의 미디어 기능 개요 찾기
    - 구성할 미디어 제공자 결정하기
    - 비동기 미디어 생성 작동 방식 이해하기
sidebarTitle: Media overview
summary: 이미지, 동영상, 음악, 음성, 미디어 이해 기능 한눈에 보기
title: 미디어 개요
x-i18n:
    generated_at: "2026-06-27T18:15:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c04beb60abbd06d1503302be144e633b526ae55435f061fbb94f6fef85ca9d66
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw는 이미지를, 비디오와 음악을 생성하고, 인바운드 미디어(이미지, 오디오, 비디오)를 이해하며, 텍스트 음성 변환으로 답변을 소리 내어 말합니다. 모든 미디어 기능은 도구 기반입니다. 에이전트가 대화에 따라 언제 사용할지 결정하며, 각 도구는 이를 뒷받침하는 공급자가 하나 이상 구성된 경우에만 나타납니다.

실시간 음성은 일회성 미디어 도구 경로 대신 Talk 세션 계약을 사용합니다. Talk에는 세 가지 모드가 있습니다. 공급자 네이티브 `realtime`, 로컬 또는 스트리밍 `stt-tts`, 관찰 전용 음성 캡처용 `transcription`입니다. 이러한 모드는 전화 통화, 회의, 브라우저 실시간, 네이티브 푸시투토크 클라이언트와 공급자 카탈로그, 이벤트 봉투, 취소 의미 체계를 공유합니다.

## 기능

<CardGroup cols={2}>
  <Card title="Image generation" href="/ko/tools/image-generation" icon="image">
    텍스트 프롬프트나 참조 이미지에서 `image_generate`를 통해 이미지를 만들고 편집합니다. 채팅 세션에서는 비동기 방식으로 백그라운드에서 실행되고 준비되면 결과를 게시합니다.
  </Card>
  <Card title="Video generation" href="/ko/tools/video-generation" icon="video">
    `video_generate`를 통해 텍스트-비디오, 이미지-비디오, 비디오-비디오를 생성합니다. 비동기 방식으로 백그라운드에서 실행되고 준비되면 결과를 게시합니다.
  </Card>
  <Card title="Music generation" href="/ko/tools/music-generation" icon="music">
    `music_generate`를 통해 음악이나 오디오 트랙을 생성합니다. 채팅 세션에서는 공유 미디어 생성 작업 수명 주기에서 비동기로 실행됩니다.
  </Card>
  <Card title="Text-to-speech" href="/ko/tools/tts" icon="microphone">
    `tts` 도구와 `messages.tts` 구성을 통해 아웃바운드 답변을 음성 오디오로 변환합니다. 동기 방식입니다.
  </Card>
  <Card title="Media understanding" href="/ko/nodes/media-understanding" icon="eye">
    비전 지원 모델 공급자와 전용 미디어 이해 Plugin을 사용해 인바운드 이미지, 오디오, 비디오를 요약합니다.
  </Card>
  <Card title="Speech-to-text" href="/ko/nodes/audio" icon="ear-listen">
    배치 STT 또는 Voice Call 스트리밍 STT 공급자를 통해 인바운드 음성 메시지를 전사합니다.
  </Card>
</CardGroup>

## 공급자 기능 매트릭스

| 공급자          | 이미지 | 비디오 | 음악 | TTS | STT | 실시간 음성 | 미디어 이해 |
| ----------------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba           |       |   ✓   |       |     |     |                |                     |
| BytePlus          |       |   ✓   |       |     |     |                |                     |
| ComfyUI           |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram          |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs        |       |       |       |  ✓  |  ✓  |                |                     |
| fal               |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| Google            |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium           |       |       |       |  ✓  |     |                |                     |
| Local CLI         |       |       |       |  ✓  |     |                |                     |
| Microsoft         |       |       |       |  ✓  |     |                |                     |
| Microsoft Foundry |   ✓   |       |       |     |     |                |                     |
| MiniMax           |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral           |       |       |       |     |  ✓  |                |                     |
| OpenAI            |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter        |   ✓   |   ✓   |   ✓   |  ✓  |  ✓  |                |          ✓          |
| Qwen              |       |   ✓   |       |     |     |                |                     |
| Runway            |       |   ✓   |       |     |     |                |                     |
| SenseAudio        |       |       |       |     |  ✓  |                |                     |
| Together          |       |   ✓   |       |     |     |                |                     |
| Vydra             |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI               |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo       |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
미디어 이해는 공급자 구성에 등록된 모든 비전 지원 또는 오디오 지원 모델을 사용합니다. 위 매트릭스는 전용 미디어 이해 지원이 있는 공급자를 나열합니다. 대부분의 멀티모달 LLM 공급자(Anthropic, Google, OpenAI 등)도 활성 답변 모델로 구성되면 인바운드 미디어를 이해할 수 있습니다.
</Note>

## 비동기와 동기

| 기능     | 모드         | 이유                                                                                                  |
| -------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 이미지          | 비동기 | 공급자 처리가 채팅 턴보다 오래 지속될 수 있으며, 생성된 첨부 파일은 공유 완료 경로를 사용합니다.   |
| 텍스트 음성 변환 | 동기  | 공급자 응답이 몇 초 안에 반환되며, 답변 오디오에 첨부됩니다.                                   |
| 비디오          | 비동기 | 공급자 처리는 30초에서 몇 분까지 걸립니다. 느린 대기열은 구성된 제한 시간까지 실행될 수 있습니다. |
| 음악          | 비동기 | 비디오와 동일한 공급자 처리 특성을 가집니다.                                                    |

비동기 도구의 경우 OpenClaw는 요청을 공급자에게 제출하고, 즉시 작업 ID를 반환하며, 작업 원장에서 작업을 추적합니다. 작업이 실행되는 동안 에이전트는 다른 메시지에 계속 응답합니다. 공급자가 완료하면 OpenClaw는 생성된 미디어 경로와 함께 에이전트를 깨워 세션의 일반적인 표시 답변 모드를 통해 사용자에게 알릴 수 있게 합니다. 구성된 경우 자동 최종 답변 전달을 사용하거나, 세션에 메시지 도구가 필요한 경우 `message(action="send")`를 사용합니다. 요청자 세션이 비활성 상태이거나 활성 깨우기가 실패하고, 완료 답변에서 일부 생성 미디어가 여전히 누락된 경우 OpenClaw는 누락된 미디어만 포함하는 멱등 직접 폴백을 보냅니다. 완료 답변으로 이미 전달된 미디어는 다시 게시되지 않습니다.

## 음성 텍스트 변환과 Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, OpenRouter, SenseAudio, xAI는 모두 구성된 경우 배치 `tools.media.audio` 경로를 통해 인바운드 오디오를 전사할 수 있습니다. 멘션 게이팅이나 명령 구문 분석을 위해 음성 메모를 사전 검사하는 채널 Plugin은 인바운드 컨텍스트에 전사된 첨부 파일을 표시하므로, 공유 미디어 이해 패스는 동일한 오디오에 대해 두 번째 STT 호출을 하지 않고 해당 전사문을 재사용합니다.

Deepgram, ElevenLabs, Mistral, OpenAI, xAI는 Voice Call 스트리밍 STT 공급자도 등록하므로, 실시간 전화 오디오를 완료된 녹음을 기다리지 않고 선택한 공급업체로 전달할 수 있습니다.

실시간 사용자 대화에는 [Talk 모드](/ko/nodes/talk)를 권장합니다. 배치 오디오 첨부 파일은 미디어 경로에 남습니다. 브라우저 실시간, 네이티브 푸시투토크, 전화 통화, 회의 오디오는 Gateway가 반환하는 Talk 이벤트와 세션 범위 카탈로그를 사용해야 합니다.

## 공급자 매핑(공급업체가 표면별로 나뉘는 방식)

<AccordionGroup>
  <Accordion title="Google">
    이미지, 비디오, 음악, 배치 TTS, 백엔드 실시간 음성, 미디어 이해 표면입니다.
  </Accordion>
  <Accordion title="OpenAI">
    이미지, 비디오, 배치 TTS, 배치 STT, Voice Call 스트리밍 STT, 백엔드 실시간 음성, 메모리 임베딩 표면입니다.
  </Accordion>
  <Accordion title="DeepInfra">
    채팅/모델 라우팅, 이미지 생성/편집, 텍스트-비디오, 배치 TTS, 배치 STT, 이미지 미디어 이해, 메모리 임베딩 표면입니다. DeepInfra 네이티브 재랭크/분류/객체 감지 모델은 OpenClaw가 해당 범주에 대한 전용 공급자 계약을 갖출 때까지 등록되지 않습니다.
  </Accordion>
  <Accordion title="xAI">
    이미지, 비디오, 검색, 코드 실행, 배치 TTS, 배치 STT, Voice Call 스트리밍 STT입니다. xAI Realtime 음성은 업스트림 기능이지만, 공유 실시간 음성 계약이 이를 표현할 수 있을 때까지 OpenClaw에 등록되지 않습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [이미지 생성](/ko/tools/image-generation)
- [비디오 생성](/ko/tools/video-generation)
- [음악 생성](/ko/tools/music-generation)
- [텍스트 음성 변환](/ko/tools/tts)
- [미디어 이해](/ko/nodes/media-understanding)
- [오디오 노드](/ko/nodes/audio)
- [Talk 모드](/ko/nodes/talk)
