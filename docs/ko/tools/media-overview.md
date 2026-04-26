---
read_when:
    - OpenClaw의 미디어 기능 개요를 찾고 있습니다
    - 구성할 미디어 제공자를 결정하려고 합니다
    - 비동기 미디어 생성 작동 방식을 이해하기
sidebarTitle: Media overview
summary: 이미지, 비디오, 음악, 음성 및 미디어 이해 기능 한눈에 보기
title: 미디어 개요
x-i18n:
    generated_at: "2026-04-26T11:40:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70be8062c01f57bf53ab08aad4f1561e3958adc94e478224821d722fd500e09f
    source_path: tools/media-overview.md
    workflow: 15
---

OpenClaw는 이미지, 비디오, 음악을 생성하고, 들어오는 미디어
(이미지, 오디오, 비디오)를 이해하며, 텍스트 음성 변환으로 응답을 음성으로 출력할 수 있습니다. 모든
미디어 기능은 도구 기반입니다. 에이전트가 대화에 따라 언제 사용할지 결정하며,
각 도구는 이를 지원하는 제공자가 하나 이상 구성된 경우에만 표시됩니다.

## 기능

<CardGroup cols={2}>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    `image_generate`를 통해 텍스트 프롬프트 또는 참조 이미지로부터
    이미지를 생성하고 편집합니다. 동기식 — 응답과 함께 인라인으로 완료됩니다.
  </Card>
  <Card title="비디오 생성" href="/ko/tools/video-generation" icon="video">
    `video_generate`를 통한 텍스트-비디오, 이미지-비디오, 비디오-비디오.
    비동기식 — 백그라운드에서 실행되고 준비되면 결과를 게시합니다.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    `music_generate`를 통해 음악 또는 오디오 트랙을 생성합니다. 공용
    제공자에서는 비동기식이며, ComfyUI 워크플로 경로는 동기식으로 실행됩니다.
  </Card>
  <Card title="텍스트 음성 변환" href="/ko/tools/tts" icon="microphone">
    `tts` 도구와 `messages.tts` 구성을 통해
    발신 응답을 음성 오디오로 변환합니다. 동기식입니다.
  </Card>
  <Card title="미디어 이해" href="/ko/nodes/media-understanding" icon="eye">
    비전 기능이 있는 모델
    제공자와 전용 미디어 이해 Plugin을 사용해 들어오는 이미지, 오디오, 비디오를 요약합니다.
  </Card>
  <Card title="음성 텍스트 변환" href="/ko/nodes/audio" icon="ear-listen">
    배치 STT 또는 Voice Call
    스트리밍 STT 제공자를 통해 들어오는 음성 메시지를 전사합니다.
  </Card>
</CardGroup>

## 제공자 기능 매트릭스

| 제공자        | 이미지 | 비디오 | 음악 | TTS | STT | 실시간 음성 | 미디어 이해 |
| ------------- | :----: | :----: | :--: | :-: | :-: | :---------: | :---------: |
| Alibaba       |        |   ✓    |      |     |     |             |             |
| BytePlus      |        |   ✓    |      |     |     |             |             |
| ComfyUI       |   ✓    |   ✓    |  ✓   |     |     |             |             |
| Deepgram      |        |        |      |     |  ✓  |      ✓      |             |
| ElevenLabs    |        |        |      |  ✓  |  ✓  |             |             |
| fal           |   ✓    |   ✓    |      |     |     |             |             |
| Google        |   ✓    |   ✓    |  ✓   |  ✓  |     |      ✓      |      ✓      |
| Gradium       |        |        |      |  ✓  |     |             |             |
| Local CLI     |        |        |      |  ✓  |     |             |             |
| Microsoft     |        |        |      |  ✓  |     |             |             |
| MiniMax       |   ✓    |   ✓    |  ✓   |  ✓  |     |             |             |
| Mistral       |        |        |      |     |  ✓  |             |             |
| OpenAI        |   ✓    |   ✓    |      |  ✓  |  ✓  |      ✓      |      ✓      |
| Qwen          |        |   ✓    |      |     |     |             |             |
| Runway        |        |   ✓    |      |     |     |             |             |
| SenseAudio    |        |        |      |     |  ✓  |             |             |
| Together      |        |   ✓    |      |     |     |             |             |
| Vydra         |   ✓    |   ✓    |      |  ✓  |     |             |             |
| xAI           |   ✓    |   ✓    |      |  ✓  |  ✓  |             |      ✓      |
| Xiaomi MiMo   |   ✓    |        |      |  ✓  |     |             |      ✓      |

<Note>
미디어 이해는 제공자 구성에 등록된 비전 기능 또는 오디오 기능이 있는 모델을 사용합니다.
위 매트릭스는 전용
미디어 이해 지원이 있는 제공자를 보여줍니다. 대부분의 멀티모달 LLM 제공자(Anthropic, Google,
OpenAI 등)도 활성
응답 모델로 구성되면 들어오는 미디어를 이해할 수 있습니다.
</Note>

## 비동기식 vs 동기식

| 기능          | 모드       | 이유                                                               |
| ------------- | ---------- | ------------------------------------------------------------------ |
| 이미지        | 동기식     | 제공자 응답이 몇 초 내에 반환되며 응답과 함께 인라인으로 완료됩니다. |
| 텍스트 음성 변환 | 동기식   | 제공자 응답이 몇 초 내에 반환되며 응답 오디오에 첨부됩니다.          |
| 비디오        | 비동기식   | 제공자 처리는 30초에서 수분까지 걸립니다.                          |
| 음악 (공용)   | 비동기식   | 비디오와 동일한 제공자 처리 특성을 가집니다.                       |
| 음악 (ComfyUI) | 동기식    | 로컬 워크플로가 구성된 ComfyUI 서버에 대해 인라인으로 실행됩니다.   |

비동기식 도구의 경우 OpenClaw는 제공자에게 요청을 제출하고 즉시 작업
id를 반환하며 작업 원장에 작업을 추적합니다. 작업이 실행되는 동안 에이전트는
다른 메시지에 계속 응답합니다. 제공자 처리가 완료되면
OpenClaw는 에이전트를 다시 깨워 완성된 미디어를 원래
채널에 게시할 수 있게 합니다.

## 음성 텍스트 변환 및 Voice Call

Deepgram, ElevenLabs, Mistral, OpenAI, SenseAudio, xAI는 모두 구성 시
배치 `tools.media.audio` 경로를 통해 들어오는 오디오를 전사할 수 있습니다.
멘션 게이팅 또는 명령
파싱을 위해 음성 노트 사전 확인을 수행하는 채널 Plugin은
전사된 첨부를 들어오는 컨텍스트에 표시하므로 공용
미디어 이해 패스가 동일한 오디오에 대해 두 번째
STT 호출을 하지 않고 해당 전사를 재사용합니다.

Deepgram, ElevenLabs, Mistral, OpenAI, xAI는 또한 Voice Call
스트리밍 STT 제공자를 등록하므로 라이브 전화 오디오를
완성된 녹음을 기다리지 않고 선택한
벤더로 전달할 수 있습니다.

## 제공자 매핑(벤더가 표면별로 분리되는 방식)

<AccordionGroup>
  <Accordion title="Google">
    이미지, 비디오, 음악, 배치 TTS, 백엔드 실시간 음성, 그리고
    미디어 이해 표면.
  </Accordion>
  <Accordion title="OpenAI">
    이미지, 비디오, 배치 TTS, 배치 STT, Voice Call 스트리밍 STT, 백엔드
    실시간 음성, 그리고 메모리 임베딩 표면.
  </Accordion>
  <Accordion title="xAI">
    이미지, 비디오, 검색, 코드 실행, 배치 TTS, 배치 STT, 그리고 Voice
    Call 스트리밍 STT. xAI Realtime 음성은 업스트림 기능이지만,
    공용 실시간 음성 계약이 이를 표현할 수 있을 때까지 OpenClaw에 등록되지
    않습니다.
  </Accordion>
</AccordionGroup>

## 관련 항목

- [이미지 생성](/ko/tools/image-generation)
- [비디오 생성](/ko/tools/video-generation)
- [음악 생성](/ko/tools/music-generation)
- [텍스트 음성 변환](/ko/tools/tts)
- [미디어 이해](/ko/nodes/media-understanding)
- [오디오 노드](/ko/nodes/audio)
