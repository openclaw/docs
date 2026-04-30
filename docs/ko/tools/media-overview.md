---
read_when:
    - OpenClaw의 미디어 기능 개요 찾기
    - 구성할 미디어 제공자 결정하기
    - 비동기 미디어 생성의 작동 방식 이해하기
sidebarTitle: Media overview
summary: 이미지, 동영상, 음악, 음성 및 미디어 이해 기능 한눈에 보기
title: 미디어 개요
x-i18n:
    generated_at: "2026-04-30T06:54:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9f40e4fb86832438ae99dd2dc42da93c41937541314d95486c97c210dfef508
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw는 이미지, 동영상, 음악을 생성하고, 수신 미디어
(이미지, 오디오, 동영상)를 이해하며, 텍스트 음성 변환으로 답변을 소리 내어 말합니다. 모든
미디어 기능은 도구 기반입니다. 에이전트가 대화에 따라 언제 사용할지 결정하며,
각 도구는 이를 뒷받침하는 공급자가 하나 이상 구성되어 있을 때만 표시됩니다.

## 기능

<CardGroup cols={2}>
  <Card title="Image generation" href="/ko/tools/image-generation" icon="image">
    텍스트 프롬프트 또는 참조 이미지에서 `image_generate`를 통해 이미지를 만들고 편집합니다.
    동기식입니다. 답변 안에서 바로 완료됩니다.
  </Card>
  <Card title="Video generation" href="/ko/tools/video-generation" icon="video">
    `video_generate`를 통한 텍스트-동영상, 이미지-동영상, 동영상-동영상 생성입니다.
    비동기식입니다. 백그라운드에서 실행되고 준비되면 결과를 게시합니다.
  </Card>
  <Card title="Music generation" href="/ko/tools/music-generation" icon="music">
    `music_generate`를 통해 음악 또는 오디오 트랙을 생성합니다. 공유
    공급자에서는 비동기식이며, ComfyUI 워크플로 경로는 동기식으로 실행됩니다.
  </Card>
  <Card title="Text-to-speech" href="/ko/tools/tts" icon="microphone">
    `tts` 도구와 `messages.tts` 설정을 통해 발신 답변을 음성 오디오로 변환합니다.
    동기식입니다.
  </Card>
  <Card title="Media understanding" href="/ko/nodes/media-understanding" icon="eye">
    비전 지원 모델 공급자와 전용 미디어 이해 Plugin을 사용하여
    수신 이미지, 오디오, 동영상을 요약합니다.
  </Card>
  <Card title="Speech-to-text" href="/ko/nodes/audio" icon="ear-listen">
    배치 STT 또는 Voice Call 스트리밍 STT 공급자를 통해 수신 음성 메시지를
    전사합니다.
  </Card>
</CardGroup>

## 공급자 기능 매트릭스

| 공급자    | 이미지 | 동영상 | 음악 | TTS | STT | 실시간 음성 | 미디어 이해 |
| ----------- | :---: | :---: | :---: | :-: | :-: | :------------: | :-----------------: |
| Alibaba     |       |   ✓   |       |     |     |                |                     |
| BytePlus    |       |   ✓   |       |     |     |                |                     |
| ComfyUI     |   ✓   |   ✓   |   ✓   |     |     |                |                     |
| DeepInfra   |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Deepgram    |       |       |       |     |  ✓  |       ✓        |                     |
| ElevenLabs  |       |       |       |  ✓  |  ✓  |                |                     |
| fal         |   ✓   |   ✓   |       |     |     |                |                     |
| Google      |   ✓   |   ✓   |   ✓   |  ✓  |     |       ✓        |          ✓          |
| Gradium     |       |       |       |  ✓  |     |                |                     |
| Local CLI   |       |       |       |  ✓  |     |                |                     |
| Microsoft   |       |       |       |  ✓  |     |                |                     |
| MiniMax     |   ✓   |   ✓   |   ✓   |  ✓  |     |                |                     |
| Mistral     |       |       |       |     |  ✓  |                |                     |
| OpenAI      |   ✓   |   ✓   |       |  ✓  |  ✓  |       ✓        |          ✓          |
| OpenRouter  |   ✓   |   ✓   |       |  ✓  |     |                |          ✓          |
| Qwen        |       |   ✓   |       |     |     |                |                     |
| Runway      |       |   ✓   |       |     |     |                |                     |
| SenseAudio  |       |       |       |     |  ✓  |                |                     |
| Together    |       |   ✓   |       |     |     |                |                     |
| Vydra       |   ✓   |   ✓   |       |  ✓  |     |                |                     |
| xAI         |   ✓   |   ✓   |       |  ✓  |  ✓  |                |          ✓          |
| Xiaomi MiMo |   ✓   |       |       |  ✓  |     |                |          ✓          |

<Note>
미디어 이해는 공급자 설정에 등록된 비전 지원 또는 오디오 지원 모델을 사용합니다.
위 매트릭스는 전용 미디어 이해 지원이 있는 공급자를 나열합니다. 대부분의
멀티모달 LLM 공급자(Anthropic, Google, OpenAI 등)도 활성 답변 모델로
구성되면 수신 미디어를 이해할 수 있습니다.
</Note>

## 비동기식과 동기식

| 기능      | 모드         | 이유                                                                |
| --------------- | ------------ | ------------------------------------------------------------------ |
| 이미지           | 동기식  | 공급자 응답이 몇 초 안에 반환되며, 답변 안에서 바로 완료됩니다. |
| 텍스트 음성 변환  | 동기식  | 공급자 응답이 몇 초 안에 반환되며, 답변 오디오에 첨부됩니다. |
| 동영상           | 비동기식 | 공급자 처리에 30초에서 몇 분까지 걸립니다.                 |
| 음악(공유)  | 비동기식 | 동영상과 동일한 공급자 처리 특성을 가집니다.                  |
| 음악(ComfyUI) | 동기식  | 로컬 워크플로가 구성된 ComfyUI 서버를 대상으로 인라인 실행됩니다.  |

비동기 도구의 경우 OpenClaw는 요청을 공급자에 제출하고, 작업
id를 즉시 반환하며, 작업 원장에서 작업을 추적합니다. 에이전트는 작업이 실행되는 동안
다른 메시지에 계속 응답합니다. 공급자가 완료하면 OpenClaw는 에이전트를 깨워
완성된 미디어를 원래 채널에 다시 게시할 수 있게 합니다.

## 음성 텍스트 변환과 Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio, xAI는 모두 구성되면
배치 `tools.media.audio` 경로를 통해 수신 오디오를 전사할 수 있습니다.
멘션 게이팅 또는 명령 파싱을 위해 음성 메모를 사전 확인하는 채널 Plugin은
전사된 첨부 파일을 수신 컨텍스트에 표시하므로, 공유 미디어 이해 단계는 동일한
오디오에 대해 두 번째 STT 호출을 만드는 대신 해당 전사를 재사용합니다.

Deepgram, ElevenLabs, Mistral, OpenAI, xAI는 Voice Call 스트리밍 STT 공급자도
등록하므로, 완료된 녹음을 기다리지 않고 실시간 전화 오디오를 선택한
공급업체로 전달할 수 있습니다.

## 공급자 매핑(공급업체가 표면별로 나뉘는 방식)

<AccordionGroup>
  <Accordion title="Google">
    이미지, 동영상, 음악, 배치 TTS, 백엔드 실시간 음성, 미디어 이해 표면입니다.
  </Accordion>
  <Accordion title="OpenAI">
    이미지, 동영상, 배치 TTS, 배치 STT, Voice Call 스트리밍 STT, 백엔드
    실시간 음성, 메모리 임베딩 표면입니다.
  </Accordion>
  <Accordion title="DeepInfra">
    채팅/모델 라우팅, 이미지 생성/편집, 텍스트-동영상, 배치 TTS,
    배치 STT, 이미지 미디어 이해, 메모리 임베딩 표면입니다.
    DeepInfra 네이티브 재랭킹/분류/객체 감지 모델은 OpenClaw에 해당
    범주를 위한 전용 공급자 계약이 생길 때까지 등록되지 않습니다.
  </Accordion>
  <Accordion title="xAI">
    이미지, 동영상, 검색, 코드 실행, 배치 TTS, 배치 STT, Voice
    Call 스트리밍 STT입니다. xAI Realtime 음성은 업스트림 기능이지만
    공유 실시간 음성 계약이 이를 표현할 수 있을 때까지 OpenClaw에
    등록되지 않습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [이미지 생성](/ko/tools/image-generation)
- [동영상 생성](/ko/tools/video-generation)
- [음악 생성](/ko/tools/music-generation)
- [텍스트 음성 변환](/ko/tools/tts)
- [미디어 이해](/ko/nodes/media-understanding)
- [오디오 노드](/ko/nodes/audio)
