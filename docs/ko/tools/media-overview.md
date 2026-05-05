---
read_when:
    - OpenClaw의 미디어 기능 개요 찾기
    - 구성할 미디어 제공자 결정
    - 비동기 미디어 생성이 작동하는 방식 이해하기
sidebarTitle: Media overview
summary: 이미지, 동영상, 음악, 음성 및 미디어 이해 기능 한눈에 보기
title: 미디어 개요
x-i18n:
    generated_at: "2026-05-05T06:09:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: fd02d4418fe294fda5f1437dd3a07c4aeb4de3b46a1b70bfe36914bc27123cc4
    source_path: tools/media-overview.md
    workflow: 16
---

OpenClaw는 이미지, 동영상, 음악을 생성하고, 수신 미디어
(이미지, 오디오, 동영상)를 이해하며, 텍스트 음성 변환으로 답변을 소리 내어 말합니다. 모든
미디어 기능은 도구 기반입니다. 에이전트가 대화에 따라 사용 시점을 결정하며,
각 도구는 하나 이상의 기반 제공자가 구성된 경우에만 표시됩니다.

## 기능

<CardGroup cols={2}>
  <Card title="이미지 생성" href="/ko/tools/image-generation" icon="image">
    텍스트 프롬프트 또는 참조 이미지에서 `image_generate`를 통해
    이미지를 만들고 편집합니다. 동기식 - 답변과 함께 인라인으로 완료됩니다.
  </Card>
  <Card title="동영상 생성" href="/ko/tools/video-generation" icon="video">
    `video_generate`를 통해 텍스트-동영상, 이미지-동영상, 동영상-동영상을 수행합니다.
    비동기식 - 백그라운드에서 실행되고 준비되면 결과를 게시합니다.
  </Card>
  <Card title="음악 생성" href="/ko/tools/music-generation" icon="music">
    `music_generate`를 통해 음악 또는 오디오 트랙을 생성합니다. 공유
    제공자에서는 비동기식이며, ComfyUI 워크플로 경로는 동기식으로 실행됩니다.
  </Card>
  <Card title="텍스트 음성 변환" href="/ko/tools/tts" icon="microphone">
    `tts` 도구와 `messages.tts` 구성을 통해 발신 답변을
    음성 오디오로 변환합니다. 동기식입니다.
  </Card>
  <Card title="미디어 이해" href="/ko/nodes/media-understanding" icon="eye">
    비전 지원 모델 제공자와 전용 미디어 이해 Plugin을 사용하여
    수신 이미지, 오디오, 동영상을 요약합니다.
  </Card>
  <Card title="음성 텍스트 변환" href="/ko/nodes/audio" icon="ear-listen">
    일괄 STT 또는 Voice Call 스트리밍 STT 제공자를 통해
    수신 음성 메시지를 전사합니다.
  </Card>
</CardGroup>

## 제공자 기능 매트릭스

| 제공자    | 이미지 | 동영상 | 음악 | TTS | STT | 실시간 음성 | 미디어 이해 |
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
미디어 이해는 제공자 구성에 등록된 모든 비전 지원 또는 오디오 지원 모델을 사용합니다.
위 매트릭스는 전용 미디어 이해 지원이 있는 제공자를 나열합니다.
대부분의 멀티모달 LLM 제공자(Anthropic, Google, OpenAI 등)도
활성 답변 모델로 구성되면 수신 미디어를 이해할 수 있습니다.
</Note>

## 비동기식과 동기식

| 기능      | 모드         | 이유                                                                                                  |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| 이미지           | 동기식  | 제공자 응답이 몇 초 안에 반환되며, 답변과 함께 인라인으로 완료됩니다.                                   |
| 텍스트 음성 변환  | 동기식  | 제공자 응답이 몇 초 안에 반환되며, 답변 오디오에 첨부됩니다.                                   |
| 동영상           | 비동기식 | 제공자 처리는 30초에서 몇 분까지 걸리며, 느린 대기열은 구성된 제한 시간까지 실행될 수 있습니다. |
| 음악(공유)  | 비동기식 | 동영상과 동일한 제공자 처리 특성을 가집니다.                                                    |
| 음악(ComfyUI) | 동기식  | 로컬 워크플로가 구성된 ComfyUI 서버를 대상으로 인라인으로 실행됩니다.                                    |

비동기 도구의 경우, OpenClaw는 요청을 제공자에게 제출하고 즉시 작업
ID를 반환하며 작업 원장에서 작업을 추적합니다. 작업이 실행되는 동안 에이전트는
다른 메시지에 계속 응답합니다. 제공자가 완료하면 OpenClaw는 생성된
미디어 경로와 함께 에이전트를 깨워 사용자에게 알리게 하고, 소스 전달 정책에서
필요한 경우 메시지 도구를 통해 결과를 중계하게 합니다. 메시지 도구 전용 그룹/채널
경로의 경우, OpenClaw는 메시지 도구 전달 증거가 없으면 완료 시도가
실패한 것으로 간주하고 생성된 미디어 대체본을 원래 채널로 직접 전송합니다.

## 음성 텍스트 변환 및 Voice Call

Deepgram, DeepInfra, ElevenLabs, Mistral, OpenAI, SenseAudio, xAI는 구성된 경우
일괄 `tools.media.audio` 경로를 통해 수신 오디오를 모두 전사할 수 있습니다.
멘션 게이팅 또는 명령 구문 분석을 위해 음성 메모를 사전 검사하는 채널 Plugin은
수신 컨텍스트에 전사된 첨부 파일을 표시하므로, 공유 미디어 이해 패스가
동일한 오디오에 대해 두 번째 STT 호출을 수행하는 대신 해당 전사를 재사용합니다.

Deepgram, ElevenLabs, Mistral, OpenAI, xAI는 Voice Call 스트리밍 STT
제공자도 등록하므로, 완료된 녹음을 기다리지 않고 실시간 전화 오디오를
선택한 공급업체로 전달할 수 있습니다.

## 제공자 매핑(공급업체가 표면별로 나뉘는 방식)

<AccordionGroup>
  <Accordion title="Google">
    이미지, 동영상, 음악, 일괄 TTS, 백엔드 실시간 음성,
    미디어 이해 표면입니다.
  </Accordion>
  <Accordion title="OpenAI">
    이미지, 동영상, 일괄 TTS, 일괄 STT, Voice Call 스트리밍 STT, 백엔드
    실시간 음성, 메모리 임베딩 표면입니다.
  </Accordion>
  <Accordion title="DeepInfra">
    채팅/모델 라우팅, 이미지 생성/편집, 텍스트-동영상, 일괄 TTS,
    일괄 STT, 이미지 미디어 이해, 메모리 임베딩 표면입니다.
    DeepInfra 네이티브 재순위/분류/객체 감지 모델은 OpenClaw에 해당
    범주 전용 제공자 계약이 생길 때까지 등록되지 않습니다.
  </Accordion>
  <Accordion title="xAI">
    이미지, 동영상, 검색, 코드 실행, 일괄 TTS, 일괄 STT, Voice
    Call 스트리밍 STT입니다. xAI Realtime 음성은 업스트림 기능이지만,
    공유 실시간 음성 계약에서 이를 표현할 수 있을 때까지 OpenClaw에
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
