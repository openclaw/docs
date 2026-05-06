---
read_when:
    - 미디어 파이프라인 또는 첨부 파일 수정
summary: send, Gateway 및 에이전트 응답의 이미지 및 미디어 처리 규칙
title: 이미지 및 미디어 지원
x-i18n:
    generated_at: "2026-05-06T06:31:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: a38224fdf42f32fe206ad8cf3fcc3b06a078b1978d447adeb671fdb3ff4e4b32
    source_path: nodes/images.md
    workflow: 16
---

# 이미지 및 미디어 지원 (2025-12-05)

WhatsApp 채널은 **Baileys Web**을 통해 실행됩니다. 이 문서는 보내기, Gateway, 에이전트 응답에 대한 현재 미디어 처리 규칙을 정리합니다.

## 목표

- `openclaw message send --media`를 통해 선택적 캡션과 함께 미디어를 보냅니다.
- 웹 받은 편지함의 자동 응답에 텍스트와 함께 미디어가 포함되도록 허용합니다.
- 유형별 제한을 합리적이고 예측 가능하게 유지합니다.

## CLI 인터페이스

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media`는 선택 사항이며, 미디어만 보내는 경우 캡션은 비워 둘 수 있습니다.
  - `--dry-run`은 해석된 페이로드를 출력하고, `--json`은 `{ channel, to, messageId, mediaUrl, caption }`을 내보냅니다.

## WhatsApp Web 채널 동작

- 입력: 로컬 파일 경로 **또는** HTTP(S) URL.
- 흐름: Buffer로 로드하고, 미디어 종류를 감지한 뒤, 올바른 페이로드를 빌드합니다.
  - **이미지:** `channels.whatsapp.mediaMaxMb`(기본값: 50 MB)를 목표로 JPEG로 크기 조정 및 재압축(최대 변 2048px).
  - **오디오/음성/동영상:** 최대 16 MB까지 그대로 전달하며, 오디오는 음성 메모(`ptt: true`)로 전송됩니다.
  - **문서:** 그 밖의 모든 항목은 최대 100 MB까지 허용하며, 사용 가능한 경우 파일 이름을 보존합니다.
- WhatsApp GIF 스타일 재생: 모바일 클라이언트가 인라인으로 반복 재생하도록 `gifPlayback: true`가 포함된 MP4를 보냅니다(CLI: `--gif-playback`).
- MIME 감지는 매직 바이트, 헤더, 파일 확장자 순으로 우선합니다.
- 캡션은 `--message` 또는 `reply.text`에서 가져오며, 빈 캡션도 허용됩니다.
- 로깅: 비상세 모드는 `↩️`/`✅`를 표시하고, 상세 모드는 크기와 소스 경로/URL을 포함합니다.

## 자동 응답 파이프라인

- `getReplyFromConfig`는 `{ text?, mediaUrl?, mediaUrls? }`를 반환합니다.
- 미디어가 있는 경우, 웹 전송기는 `openclaw message send`와 동일한 파이프라인을 사용해 로컬 경로 또는 URL을 해석합니다.
- 여러 미디어 항목이 제공되면 순차적으로 전송됩니다.

## 명령으로 전달되는 인바운드 미디어(Pi)

- 인바운드 웹 메시지에 미디어가 포함된 경우, OpenClaw는 임시 파일로 다운로드하고 템플릿 변수를 노출합니다.
  - 인바운드 미디어용 의사 URL인 `{{MediaUrl}}`.
  - 명령을 실행하기 전에 작성되는 로컬 임시 경로인 `{{MediaPath}}`.
- 세션별 Docker 샌드박스가 활성화된 경우, 인바운드 미디어는 샌드박스 작업 공간으로 복사되고 `MediaPath`/`MediaUrl`은 `media/inbound/<filename>` 같은 상대 경로로 다시 작성됩니다.
- 미디어 이해(`tools.media.*` 또는 공유 `tools.media.models`를 통해 구성된 경우)는 템플릿 처리 전에 실행되며, `Body`에 `[Image]`, `[Audio]`, `[Video]` 블록을 삽입할 수 있습니다.
  - 오디오는 `{{Transcript}}`를 설정하고 명령 파싱에 전사를 사용하므로 슬래시 명령이 계속 작동합니다.
  - 동영상 및 이미지 설명은 명령 파싱을 위해 모든 캡션 텍스트를 보존합니다.
  - 활성 기본 이미지 모델이 이미 비전을 기본 지원하는 경우, OpenClaw는 `[Image]` 요약 블록을 건너뛰고 원본 이미지를 대신 모델에 전달합니다.
- 기본적으로 일치하는 첫 번째 이미지/오디오/동영상 첨부 파일만 처리됩니다. 여러 첨부 파일을 처리하려면 `tools.media.<cap>.attachments`를 설정하세요.

## 제한 및 오류

**아웃바운드 전송 한도(WhatsApp 웹 전송)**

- 이미지: 재압축 후 최대 `channels.whatsapp.mediaMaxMb`(기본값: 50 MB).
- 오디오/음성/동영상: 16 MB 한도, 문서: 100 MB 한도.
- 너무 크거나 읽을 수 없는 미디어 → 로그에 명확한 오류를 남기고 응답은 건너뜁니다.

**미디어 이해 한도(전사/설명)**

- 이미지 기본값: 10 MB(`tools.media.image.maxBytes`).
- 오디오 기본값: 20 MB(`tools.media.audio.maxBytes`).
- 동영상 기본값: 50 MB(`tools.media.video.maxBytes`).
- 너무 큰 미디어는 이해를 건너뛰지만, 응답은 원래 본문으로 계속 진행됩니다.

## 테스트 참고 사항

- 이미지/오디오/문서 사례에 대한 전송 및 응답 흐름을 다룹니다.
- 이미지의 재압축(크기 제한)과 오디오의 음성 메모 플래그를 검증합니다.
- 여러 미디어 응답이 순차 전송으로 확장되는지 확인합니다.

## 관련 항목

- [카메라 캡처](/ko/nodes/camera)
- [미디어 이해](/ko/nodes/media-understanding)
- [오디오 및 음성 메모](/ko/nodes/audio)
