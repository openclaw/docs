---
read_when:
    - 미디어 파이프라인 또는 첨부 파일 수정하기
summary: 전송, Gateway 및 에이전트 응답의 이미지 및 미디어 처리 규칙
title: 이미지 및 미디어 지원
x-i18n:
    generated_at: "2026-07-12T00:55:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 41d5bbd174b4fb35b616a9e90930485fd76dc8cfbad2e178f0823e6fb40c36f8
    source_path: nodes/images.md
    workflow: 16
---

WhatsApp 채널은 Baileys Web에서 실행됩니다. 이 페이지에서는 전송, Gateway, 에이전트 응답의 미디어 처리 규칙을 설명합니다.

## 목표

- `openclaw message send --media`를 통해 선택적 캡션과 함께 미디어를 전송합니다.
- 웹 받은편지함의 자동 응답에 텍스트와 함께 미디어를 포함할 수 있도록 합니다.
- 유형별 제한을 합리적이고 예측 가능하게 유지합니다.

## CLI 인터페이스

`openclaw message send --target <dest> --media <path-or-url> [--message <caption>]`

- `--media <path-or-url>` — 미디어(이미지/오디오/동영상/문서)를 첨부합니다. 로컬 경로나 URL을 사용할 수 있습니다. 선택 사항이며, 미디어만 전송할 때는 캡션을 비워 둘 수 있습니다.
- `--gif-playback` — 동영상 미디어를 GIF 재생으로 처리합니다(WhatsApp만 해당).
- `--force-document` — 채널 압축을 피하기 위해 미디어를 문서로 전송합니다(Telegram, WhatsApp). 이미지, GIF, 동영상에 적용됩니다.
- `--reply-to <id>`, `--thread-id <id>`, `--pin`, `--silent` — 텍스트 전용 전송과 공유하는 전달/스레드 옵션입니다.
- `--dry-run` — 해석된 페이로드를 출력하고 전송을 건너뜁니다.
- `--json` — 결과를 JSON으로 출력합니다: `{ action, channel, dryRun, handledBy, messageId?, payload }` (`payload`에는 미디어 참조를 비롯한 채널별 전송 결과가 포함됩니다).

## WhatsApp Web 채널 동작

- 입력: 로컬 파일 경로 **또는** HTTP(S) URL.
- 흐름: 버퍼로 불러와 미디어 종류를 감지한 다음, 종류별로 발신 페이로드를 구성합니다.
  - **이미지:** `channels.whatsapp.mediaMaxMb`(기본값 50MB) 이하가 되도록 최적화합니다. 불투명 이미지는 JPEG로 다시 압축합니다(기본 변 길이 단계는 2048px에서 시작하며, 크기 제한을 반복해서 초과하면 단계적으로 줄어듭니다). 투명도가 있는 이미지는 PNG로 유지합니다. 원본이 크기 및 변 길이 제한을 충족하는 적합한 JPEG/PNG/WebP인 경우 다시 압축하지 않고 원본 바이트를 그대로 보존합니다. 애니메이션 GIF는 다시 인코딩하지 않고 크기만 확인합니다.
  - **오디오/음성:** 이미 기본 음성 오디오(`.ogg`/`.opus` 또는 `audio/ogg`/`audio/opus`)가 아니라면, 발신 오디오를 전송 전에 `ffmpeg`를 통해 Opus/OGG(48kHz 모노, 64kbps, 최대 20분)로 트랜스코딩하고 음성 메모(`ptt: true`)로 전송합니다.
  - **동영상:** 최대 16MB까지 그대로 전달합니다.
  - **문서:** 그 밖의 모든 항목은 최대 100MB까지 지원하며, 가능한 경우 파일 이름을 유지합니다.
- WhatsApp GIF 방식 재생: `gifPlayback: true`(CLI: `--gif-playback`)로 MP4를 전송하여 모바일 클라이언트에서 인라인으로 반복 재생되도록 합니다.
- MIME 감지는 스니핑한 매직 바이트, 파일 확장자, 응답 헤더 순으로 우선합니다. 일반적인 스니핑 컨테이너(`application/octet-stream`, `zip`)는 더 구체적인 확장자 매핑(예: XLSX와 ZIP)을 재정의하지 않습니다.
- 캡션은 `--message` 또는 `reply.text`에서 가져오며, 빈 캡션도 허용됩니다.
- 로깅: 비상세 모드에서는 `↩️`/`✅`를 표시하고, 상세 모드에서는 크기와 소스 경로/URL도 포함합니다.

<Note>
위의 오디오/동영상 16MB와 문서 100MB 수치는 명시적인 바이트 상한이 전달되지 않았을 때 사용하는 종류별 공통 미디어 기본값입니다. WhatsApp 전송은 `channels.whatsapp.mediaMaxMb`(기본값 50MB)에서 명시적 상한을 설정하며, 해당 계정의 모든 종류에 동일하게 적용됩니다.
</Note>

## 자동 응답 파이프라인

- `getReplyFromConfig`는 다른 필드와 함께 `text?`, `mediaUrl?`, `mediaUrls?`가 포함된 응답 페이로드(또는 페이로드 배열)를 반환합니다.
- 미디어가 있으면 웹 전송기가 `openclaw message send`와 동일한 파이프라인을 사용하여 로컬 경로나 URL을 해석합니다.
- 여러 미디어 항목이 제공되면 순차적으로 전송합니다.

## 수신 미디어를 명령에 전달

- 수신 웹 메시지에 미디어가 포함된 경우 OpenClaw는 이를 임시 파일로 다운로드하고 다음 템플릿 변수를 제공합니다.
  - `{{MediaUrl}}` — 수신 미디어의 의사 URL입니다.
  - `{{MediaPath}}` — 명령 실행 전에 기록되는 로컬 임시 경로입니다.
- 세션별 Docker 샌드박스가 활성화되어 있으면 수신 미디어를 샌드박스 작업 공간에 복사하고 `MediaPath`/`MediaUrl`을 `media/inbound/<filename>`과 같은 샌드박스 상대 경로로 다시 작성합니다.
- 미디어 이해(`tools.media.*` 또는 공유 `tools.media.models`를 통해 구성)는 템플릿 처리 전에 실행되며 `Body`에 `[Image]`, `[Audio]`, `[Video]` 블록을 삽입할 수 있습니다.
  - 오디오는 `{{Transcript}}`를 설정하고 명령 구문 분석에 전사문을 사용하므로 슬래시 명령이 계속 작동합니다.
  - 동영상 및 이미지 설명은 명령 구문 분석을 위해 캡션 텍스트를 보존합니다.
  - 활성 기본 모델이 이미 비전을 기본 지원하는 경우 OpenClaw는 `[Image]` 요약 블록을 생략하고 대신 원본 이미지를 모델에 전달합니다.
- 기본적으로 처음 일치하는 이미지/오디오/동영상 첨부 파일만 처리합니다. 여러 첨부 파일을 처리하려면 `tools.media.<capability>.attachments`를 설정합니다.

## 제한 및 오류

**발신 전송 상한(WhatsApp 웹 전송)**

- 이미지: 최적화 후 최대 `channels.whatsapp.mediaMaxMb`(기본값 50MB).
- 오디오/동영상: 16MB 상한(공통 기본값이며 WhatsApp을 통해 전송할 때는 `mediaMaxMb`로 재정의됨).
- 문서: 100MB 상한(공통 기본값이며 WhatsApp을 통해 전송할 때는 `mediaMaxMb`로 재정의됨).
- 너무 크거나 읽을 수 없는 미디어는 로그에 명확한 오류를 생성하며 응답은 건너뜁니다.

**미디어 이해 상한(전사/설명)**

- 이미지 기본값: 10MB(`tools.media.image.maxBytes`).
- 오디오 기본값: 20MB(`tools.media.audio.maxBytes`).
- 동영상 기본값: 50MB(`tools.media.video.maxBytes`).
- 너무 큰 미디어는 이해 처리를 건너뛰지만 원본 본문이 포함된 응답은 계속 전달됩니다.

## 테스트 참고 사항

- 이미지/오디오/문서 사례의 전송 및 응답 흐름을 다룹니다.
- 이미지 최적화 후 크기 제한과 오디오의 음성 메모 플래그를 검증합니다.
- 다중 미디어 응답이 순차 전송으로 분산되는지 확인합니다.

## 관련 항목

- [카메라 캡처](/ko/nodes/camera)
- [미디어 이해](/ko/nodes/media-understanding)
- [오디오 및 음성 메모](/ko/nodes/audio)
