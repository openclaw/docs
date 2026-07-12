---
read_when:
    - 미디어 파이프라인 또는 첨부 파일 수정하기
summary: 전송, Gateway 및 에이전트 응답의 이미지 및 미디어 처리 규칙
title: 이미지 및 미디어 지원
x-i18n:
    generated_at: "2026-07-12T15:28:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp 채널은 Baileys Web에서 실행됩니다. 이 페이지에서는 전송, Gateway 및 에이전트 응답의 미디어 처리 규칙을 설명합니다.

## 목표

- `openclaw message send --media`를 통해 선택적 캡션과 함께 미디어를 전송합니다.
- 웹 받은 편지함의 자동 응답에 텍스트와 함께 미디어를 포함할 수 있도록 합니다.
- 유형별 제한을 합리적이고 예측 가능하게 유지합니다.

## CLI 인터페이스

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — 미디어(이미지/오디오/동영상/문서)를 첨부합니다. 로컬 경로나 URL을 사용할 수 있습니다. 선택 사항이며, 미디어만 전송할 때는 캡션을 비워 둘 수 있습니다.
- `--gif-playback` — 동영상 미디어를 GIF 재생으로 처리합니다(WhatsApp만 해당).
- `--force-document` — 채널 압축을 방지하기 위해 미디어를 문서로 전송합니다(Telegram, WhatsApp). 이미지, GIF 및 동영상에 적용됩니다.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — 텍스트 전용 전송과 공유하는 전달/스레드 옵션입니다.
- `--dry-run` — 해석된 페이로드를 출력하고 전송을 건너뜁니다.
- `--json` — 결과를 JSON으로 출력합니다: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload`에는 미디어 참조를 포함한 채널별 전송 결과가 들어 있습니다).

## WhatsApp Web 채널 동작

- 입력: 로컬 파일 경로 **또는** HTTP(S) URL입니다.
- 흐름: 버퍼로 불러오고 미디어 종류를 감지한 다음, 종류별로 발신 페이로드를 구성합니다.
  - **이미지:** `channels.whatsapp.mediaMaxMb`(기본값 50MB) 미만에 맞도록 최적화합니다. 불투명 이미지는 JPEG로 다시 압축합니다(기본 변 길이 단계는 2048px에서 시작하며 크기 제한을 반복해서 초과하면 낮아집니다). 투명도가 있는 이미지는 PNG로 유지합니다. 소스가 이미 크기 및 변 길이 제한 내에서 허용 가능한 JPEG/PNG/WebP인 경우에는 다시 압축하지 않고 원본 바이트를 변경 없이 보존합니다. 애니메이션 GIF는 다시 인코딩하지 않고 크기만 확인합니다.
  - **오디오/음성:** 이미 기본 음성 오디오 형식(`.ogg`/`.opus` 또는 `audio/ogg`/`audio/opus`)이 아니라면, 발신 오디오는 음성 메시지(`ptt: true`)로 전송하기 전에 `ffmpeg`를 통해 Opus/OGG(48kHz 모노, 64kbps, 최대 20분)로 트랜스코딩됩니다.
  - **동영상:** 최대 16MB까지 그대로 전달합니다.
  - **문서:** 그 밖의 모든 항목은 최대 100MB까지 전송하며, 가능한 경우 파일 이름을 보존합니다.
- WhatsApp GIF 스타일 재생: 모바일 클라이언트에서 인라인으로 반복 재생되도록 `gifPlayback: true`(CLI: `--gif-playback`)가 설정된 MP4를 전송합니다.
- MIME 감지는 먼저 매직 바이트 스니핑 결과를 사용하고, 그다음 파일 확장자, 마지막으로 응답 헤더를 사용합니다. 일반적인 스니핑 컨테이너(`application/octet-stream`, `zip`)는 더 구체적인 확장자 매핑(예: XLSX와 ZIP)을 재정의하지 않습니다.
- 캡션은 `--message` 또는 `reply.text`에서 가져오며, 빈 캡션도 허용됩니다.
- 로깅: 상세 모드가 아니면 `↩️`/`✅`를 표시하며, 상세 모드에서는 크기와 소스 경로/URL도 포함합니다.

<Note>
위의 16MB 오디오/동영상 및 100MB 문서 수치는 명시적인 바이트 제한이 전달되지 않았을 때 사용하는 종류별 공유 미디어 기본값입니다. WhatsApp 전송은 `channels.whatsapp.mediaMaxMb`(기본값 50MB)에서 명시적인 제한을 설정하며, 이 제한은 해당 계정의 모든 종류에 동일하게 적용됩니다.
</Note>

## 자동 응답 파이프라인

- `getReplyFromConfig`는 다른 필드와 함께 `text?`, `mediaUrl?`, `mediaUrls?`가 포함된 응답 페이로드(또는 페이로드 배열)를 반환합니다.
- 미디어가 있는 경우 웹 발신자는 `openclaw message send`와 동일한 파이프라인을 사용하여 로컬 경로나 URL을 해석합니다.
- 여러 미디어 항목이 제공되면 순차적으로 전송합니다.

## 수신 미디어를 명령에 전달

- 수신 웹 메시지에 미디어가 포함된 경우 OpenClaw는 이를 임시 파일로 다운로드하고 다음 템플릿 변수를 제공합니다.
  - `{{MediaUrl}}` — 수신 미디어의 의사 URL입니다.
  - `{{MediaPath}}` — 명령을 실행하기 전에 기록되는 로컬 임시 경로입니다.
- 세션별 Docker 샌드박스가 활성화된 경우 수신 미디어를 샌드박스 작업 공간으로 복사하고, `MediaPath`/`MediaUrl`을 `media/inbound/<filename>`과 같은 샌드박스 상대 경로로 다시 작성합니다.
- 미디어 이해(`tools.media.*` 또는 공유 `tools.media.models`를 통해 구성)는 템플릿 처리 전에 실행되며 `[Image]`, `[Audio]`, `[Video]` 블록을 `Body`에 삽입할 수 있습니다.
  - 오디오는 `{{Transcript}}`를 설정하고 명령 구문 분석에 트랜스크립트를 사용하므로 슬래시 명령이 계속 작동합니다.
  - 동영상 및 이미지 설명은 명령 구문 분석을 위해 모든 캡션 텍스트를 보존합니다.
  - 활성 기본 모델이 이미 비전을 기본적으로 지원하는 경우 OpenClaw는 `[Image]` 요약 블록을 건너뛰고 원본 이미지를 모델에 대신 전달합니다.
- 기본적으로 처음 일치하는 이미지/오디오/동영상 첨부 파일만 처리합니다. 여러 첨부 파일을 처리하려면 `tools.media.<capability>.attachments`를 설정하십시오.

## 제한 및 오류

**발신 전송 제한(WhatsApp 웹 전송)**

- 이미지: 최적화 후 최대 `channels.whatsapp.mediaMaxMb`(기본값 50MB)입니다.
- 오디오/동영상: 16MB 제한입니다(공유 기본값이며, WhatsApp을 통해 전송할 때는 `mediaMaxMb`로 재정의됩니다).
- 문서: 100MB 제한입니다(공유 기본값이며, WhatsApp을 통해 전송할 때는 `mediaMaxMb`로 재정의됩니다).
- 너무 크거나 읽을 수 없는 미디어는 로그에 명확한 오류를 생성하며, 응답은 건너뜁니다.

**미디어 이해 제한(트랜스크립션/설명)**

- 이미지 기본값: 10MB(`tools.media.image.maxBytes`)입니다.
- 오디오 기본값: 20MB(`tools.media.audio.maxBytes`)입니다.
- 동영상 기본값: 50MB(`tools.media.video.maxBytes`)입니다.
- 너무 큰 미디어는 이해 처리를 건너뛰지만, 원본 본문을 사용한 응답은 계속 진행됩니다.

## 테스트 참고 사항

- 이미지/오디오/문서 사례의 전송 및 응답 흐름을 다룹니다.
- 이미지 최적화 후 크기 제한과 오디오의 음성 메시지 플래그를 검증합니다.
- 여러 미디어가 포함된 응답이 순차 전송으로 분기되는지 확인합니다.

## 관련 문서

- [카메라 캡처](/ko/nodes/camera)
- [미디어 이해](/ko/nodes/media-understanding)
- [오디오 및 음성 메시지](/ko/nodes/audio)
