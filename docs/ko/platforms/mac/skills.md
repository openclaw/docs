---
read_when:
    - macOS Skills 설정 UI 업데이트
    - Skills 게이팅 또는 설치 동작 변경하기
summary: macOS Skills 설정 UI 및 Gateway 기반 상태
title: Skills(macOS)
x-i18n:
    generated_at: "2026-06-27T17:41:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

macOS 앱은 Gateway를 통해 OpenClaw Skills를 표시하며, 로컬에서 Skills를 파싱하지 않습니다.

## 데이터 소스

- `skills.status`(Gateway)는 모든 Skills와 함께 적격성 및 누락된 요구 사항을 반환합니다
  (번들 Skills에 대한 허용 목록 차단 포함).
- 요구 사항은 각 `SKILL.md`의 `metadata.openclaw.requires`에서 파생됩니다.

## 설치 작업

- `metadata.openclaw.install`은 설치 옵션(brew/node/go/uv)을 정의합니다.
- 앱은 `skills.install`을 호출하여 Gateway 호스트에서 설치 프로그램을 실행합니다.
- 운영자가 소유한 `security.installPolicy`는 설치 프로그램 메타데이터가 실행되기 전에 Gateway 기반 Skills
  설치를 차단할 수 있습니다. 설치 시점의 기본 제공 위험 코드
  차단은 Skills 설치 흐름의 일부가 아닙니다.
- 모든 설치 옵션이 `download`인 경우, Gateway는 모든 다운로드
  선택지를 표시합니다.
- 그렇지 않으면 Gateway는 현재 설치 환경설정과 호스트 바이너리를 사용하여
  하나의 선호 설치 프로그램을 선택합니다. `skills.install.preferBrew`가 활성화되어 있고 `brew`가 있으면 Homebrew를 먼저 사용하고, 그다음 `uv`, 그다음
  `skills.install.nodeManager`에 구성된 node 관리자, 그다음 나중의
  `go` 또는 `download` 같은 대체 옵션을 사용합니다.
- Node 설치 레이블은 `yarn`을 포함하여 구성된 node 관리자를 반영합니다.

## Env/API 키

- 앱은 키를 `~/.openclaw/openclaw.json`의 `skills.entries.<skillKey>` 아래에 저장합니다.
- `skills.update`는 `enabled`, `apiKey`, `env`를 패치합니다.

## 원격 모드

- 설치 및 구성 업데이트는 Gateway 호스트에서 발생합니다(로컬 Mac이 아님).

## 관련 항목

- [Skills](/ko/tools/skills)
- [macOS 앱](/ko/platforms/macos)
