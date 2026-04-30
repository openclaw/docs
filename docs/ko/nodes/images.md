---
read_when:
    - 미디어 파이프라인 또는 첨부 파일 수정
summary: send, Gateway 및 에이전트 응답의 이미지 및 미디어 처리 규칙
title: 이미지 및 미디어 지원
x-i18n:
    generated_at: "2026-04-30T06:38:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1eb07bc638a755be5597e78c07041a52cfc0297b00d70c5adbfe5f3ad8c1a372
    source_path: nodes/images.md
    workflow: 16
---

# 이미지 및 미디어 지원 (2025-12-05)

WhatsApp 채널은 **Baileys Web**을 통해 실행됩니다. 이 문서는 전송, Gateway, 에이전트 응답에 대한 현재 미디어 처리 규칙을 정리합니다.

## 목표

- `openclaw message send --media`를 통해 선택적 캡션과 함께 미디어를 보냅니다.
- 웹 받은 편지함의 자동 응답이 텍스트와 함께 미디어를 포함할 수 있게 합니다.
- 유형별 제한을 합리적이고 예측 가능하게 유지합니다.

## CLI 표면

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media`는 선택 사항이며, 미디어만 보내는 경우 캡션은 비어 있을 수 있습니다.
  - `--dry-run`은 해석된 페이로드를 출력하고, `--json`은 `{ channel, to, messageId, mediaUrl, caption }`를 내보냅니다.

## WhatsApp Web 채널 동작

- 입력: 로컬 파일 경로 **또는** HTTP(S) URL.
- 흐름: Buffer로 로드하고, 미디어 종류를 감지한 뒤, 올바른 페이로드를 구성합니다.
  - **이미지:** `channels.whatsapp.mediaMaxMb`(기본값: 50 MB)를 목표로 JPEG로 크기 조정 및 재압축합니다(최대 변 2048px).
  - **오디오/음성/비디오:** 16 MB까지 그대로 전달하며, 오디오는 음성 메모(`ptt: true`)로 전송됩니다.
  - **문서:** 그 외 모든 항목은 최대 100 MB까지 허용되며, 가능한 경우 파일 이름을 보존합니다.
- WhatsApp GIF 스타일 재생: MP4를 `gifPlayback: true`(CLI: `--gif-playback`)로 보내 모바일 클라이언트에서 인라인으로 반복 재생되게 합니다.
- MIME 감지는 매직 바이트를 우선하고, 그다음 헤더, 그다음 파일 확장자를 사용합니다.
- 캡션은 `--message` 또는 `reply.text`에서 가져오며, 빈 캡션도 허용됩니다.
- 로깅: 비상세 모드는 `↩️`/`✅`를 표시하고, 상세 모드는 크기와 소스 경로/URL을 포함합니다.

## 자동 응답 파이프라인

- `getReplyFromConfig`는 `{ text?, mediaUrl?, mediaUrls? }`를 반환합니다.
- 미디어가 있으면 웹 발신자는 `openclaw message send`와 동일한 파이프라인을 사용해 로컬 경로 또는 URL을 해석합니다.
- 여러 미디어 항목이 제공되면 순차적으로 전송됩니다.

## 명령으로 들어오는 인바운드 미디어(Pi)

- 인바운드 웹 메시지에 미디어가 포함된 경우 OpenClaw는 임시 파일로 다운로드하고 템플릿 변수를 노출합니다.
  - 인바운드 미디어용 `{{MediaUrl}}` 의사 URL.
  - 명령 실행 전에 작성되는 `{{MediaPath}}` 로컬 임시 경로.
- 세션별 Docker 샌드박스가 활성화되어 있으면 인바운드 미디어가 샌드박스 작업 공간으로 복사되고 `MediaPath`/`MediaUrl`은 `media/inbound/<filename>` 같은 상대 경로로 다시 작성됩니다.
- 미디어 이해(`tools.media.*` 또는 공유 `tools.media.models`를 통해 구성된 경우)는 템플릿 처리 전에 실행되며 `[Image]`, `[Audio]`, `[Video]` 블록을 `Body`에 삽입할 수 있습니다.
  - 오디오는 `{{Transcript}}`를 설정하고, 슬래시 명령이 계속 작동하도록 명령 구문 분석에 전사문을 사용합니다.
  - 비디오 및 이미지 설명은 명령 구문 분석을 위해 모든 캡션 텍스트를 보존합니다.
  - 활성 기본 이미지 모델이 이미 비전을 네이티브로 지원하는 경우 OpenClaw는 `[Image]` 요약 블록을 건너뛰고 원본 이미지를 대신 모델에 전달합니다.
- 기본적으로 처음 일치하는 이미지/오디오/비디오 첨부 파일만 처리됩니다. 여러 첨부 파일을 처리하려면 `tools.media.<cap>.attachments`를 설정하세요.

## 제한 및 오류

**아웃바운드 전송 한도(WhatsApp 웹 전송)**

- 이미지: 재압축 후 최대 `channels.whatsapp.mediaMaxMb`(기본값: 50 MB).
- 오디오/음성/비디오: 16 MB 한도, 문서: 100 MB 한도.
- 너무 크거나 읽을 수 없는 미디어 → 로그에 명확한 오류가 기록되고 응답은 건너뜁니다.

**미디어 이해 한도(전사/설명)**

- 이미지 기본값: 10 MB(`tools.media.image.maxBytes`).
- 오디오 기본값: 20 MB(`tools.media.audio.maxBytes`).
- 비디오 기본값: 50 MB(`tools.media.video.maxBytes`).
- 너무 큰 미디어는 이해 단계를 건너뛰지만, 응답은 원래 본문으로 계속 진행됩니다.

## 테스트 참고 사항

- 이미지/오디오/문서 사례에 대해 전송 및 응답 흐름을 다룹니다.
- 이미지 재압축(크기 제한)과 오디오의 음성 메모 플래그를 검증합니다.
- 다중 미디어 응답이 순차 전송으로 펼쳐지는지 확인합니다.

## 관련 항목

- [카메라 캡처](/ko/nodes/camera)
- [미디어 이해](/ko/nodes/media-understanding)
- [오디오 및 음성 메모](/ko/nodes/audio)
