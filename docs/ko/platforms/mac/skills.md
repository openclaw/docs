---
read_when:
    - macOS Skills 설정 UI 업데이트하기
    - Skills 게이팅 또는 설치 동작 변경하기
summary: macOS Skills 설정 UI 및 Gateway 기반 상태
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T15:27:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS 앱은 Gateway를 통해 OpenClaw Skills를 표시하며, 로컬에서 Skills를 파싱하지 않습니다.

## 데이터 소스

- `skills.status`(Gateway)는 번들 Skills의 허용 목록 차단을 포함하여 모든 Skills와 적격 여부 및 누락된 요구 사항을 반환합니다.
- 요구 사항은 각 `SKILL.md`의 `metadata.openclaw.requires`에서 가져옵니다.

## 설치 작업

- `metadata.openclaw.install`은 설치 옵션(brew/node/go/uv/download)을 정의합니다.
- 앱은 Gateway 호스트에서 설치 프로그램을 실행하기 위해 `skills.install`을 호출합니다.
- 운영자가 소유한 `security.installPolicy`(`enabled`, `targets`, `exec`)는 설치 프로그램 메타데이터가 실행되기 전에 Gateway 기반 Skill 설치를 차단할 수 있습니다. 기본 제공되는 위험 코드 검사(Plugin 설치에 사용됨)는 Skill 설치 흐름에 연결되어 있지 않습니다.
- 모든 설치 옵션이 `download`이면 Gateway는 모든 다운로드 선택지를 표시합니다.
- 그렇지 않으면 Gateway는 현재 설치 환경설정(`skills.install.preferBrew`, `skills.install.nodeManager`)과 호스트 바이너리를 사용하여 선호 설치 프로그램 하나를 선택합니다. `preferBrew`가 활성화되어 있고 `brew`가 있으면 Homebrew를 먼저 선택하고, 그다음 `uv`, 구성된 Node 관리자, 사용할 수 있는 경우 다시 Homebrew(`preferBrew`가 없어도 해당), `go`, `download` 순으로 선택합니다.
- Node 설치 레이블에는 `yarn`을 포함하여 구성된 Node 관리자가 반영됩니다.

## 환경 변수/API 키

- 앱은 `~/.openclaw/openclaw.json`의 `skills.entries.<skillKey>` 아래에 키를 저장합니다.
- `skills.update`는 `enabled`, `apiKey`, `env`를 패치합니다.

## 원격 모드

- 설치 및 구성 업데이트는 로컬 Mac이 아니라 Gateway 호스트에서 수행됩니다.

## 관련 문서

- [Skills](/ko/tools/skills)
- [macOS 앱](/ko/platforms/macos)
