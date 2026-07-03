---
read_when:
    - 채널의 연락처/그룹/자기 자신의 ID를 조회하려는 경우
    - 채널 디렉터리 어댑터를 개발하고 있습니다
summary: '`openclaw directory`에 대한 CLI 참조(자신, 피어, 그룹)'
title: 디렉터리
x-i18n:
    generated_at: "2026-07-03T15:21:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d17f545ce0bbe23a6c1ba74e4d1b44b103cc985b52affe4b25fbc6a6d1121045
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

이를 지원하는 채널의 디렉터리 조회(연락처/피어, 그룹, "me")입니다.

## 공통 플래그

- `--channel <name>`: 채널 ID/별칭(여러 채널이 구성된 경우 필수, 하나만 구성된 경우 자동)
- `--account <id>`: 계정 ID(기본값: 채널 기본값)
- `--json`: JSON 출력

## 참고

- `directory`는 다른 명령에 붙여넣을 수 있는 ID를 찾는 데 도움을 주기 위한 것입니다(특히 `openclaw message send --target ...`).
- 많은 채널에서 결과는 라이브 제공자 디렉터리가 아니라 구성 기반(허용 목록 / 구성된 그룹)입니다.
- 설치된 채널 Plugin은 여전히 디렉터리 지원을 생략할 수 있습니다. 이 경우 명령은 Plugin을 다시 설치하는 대신 지원되지 않는 디렉터리 작업을 보고합니다.
- 기본 출력은 탭으로 구분된 `id`(때로는 `name`)입니다. 스크립팅에는 `--json`을 사용하세요.

## `message send`에서 결과 사용하기

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 형식(채널별)

- WhatsApp: `+15551234567`(DM), `1234567890-1234567890@g.us`(그룹), `120363123456789@newsletter`(Channel/뉴스레터 발신 대상)
- Signal: 구성된 별칭은 E.164/UUID DM 대상 또는 `group:<id>` 그룹 대상으로 확인됩니다
- Telegram: `@username` 또는 숫자 채팅 ID, 그룹은 숫자 ID입니다
- Slack: `user:U…` 및 `channel:C…`
- Discord: `user:<id>` 및 `channel:<id>`
- Matrix(Plugin): `user:@user:server`, `room:!roomId:server` 또는 `#alias:server`
- Microsoft Teams(Plugin): `user:<id>` 및 `conversation:<id>`
- Zalo(Plugin): 사용자 ID(Bot API)
- Zalo Personal / `zalouser`(Plugin): `zca`의 스레드 ID(DM/그룹)(`me`, `friend list`, `group list`)

## 자기 자신("me")

```bash
openclaw directory self --channel zalouser
```

## 피어(연락처/사용자)

```bash
openclaw directory peers list --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory peers list --channel zalouser --limit 50
```

## 그룹

```bash
openclaw directory groups list --channel zalouser
openclaw directory groups list --channel zalouser --query "work"
openclaw directory groups members --channel zalouser --group-id <id>
```

## 관련 항목

- [CLI 참조](/ko/cli)
