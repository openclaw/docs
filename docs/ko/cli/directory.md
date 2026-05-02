---
read_when:
    - 채널의 연락처/그룹/자기 ID를 조회하려고 합니다
    - 채널 디렉터리 어댑터를 개발하고 있습니다
summary: '`openclaw directory`에 대한 CLI 참조(자신, 피어, 그룹)'
title: 디렉터리
x-i18n:
    generated_at: "2026-05-02T20:44:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 011f762d6f53605a37bd12b31c767594c0efa5681da4b2aabe7fb358751b1542
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

이를 지원하는 채널에 대한 디렉터리 조회(연락처/피어, 그룹, “나”).

## 공통 플래그

- `--channel <name>`: 채널 id/별칭(여러 채널이 구성된 경우 필수, 하나만 구성된 경우 자동)
- `--account <id>`: 계정 id(기본값: 채널 기본값)
- `--json`: JSON 출력

## 참고

- `directory`는 다른 명령어(특히 `openclaw message send --target ...`)에 붙여 넣을 수 있는 ID를 찾는 데 도움을 주기 위한 것입니다.
- 많은 채널에서 결과는 실시간 제공자 디렉터리가 아니라 설정 기반(허용 목록/구성된 그룹)입니다.
- 설치된 채널 Plugin은 디렉터리 지원을 생략할 수도 있습니다. 이 경우 명령어는 Plugin을 다시 설치하지 않고 지원되지 않는 디렉터리 작업을 보고합니다.
- 기본 출력은 탭으로 구분된 `id`(때로는 `name`)입니다. 스크립트 작성에는 `--json`을 사용하세요.

## `message send`에서 결과 사용하기

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## ID 형식(채널별)

- WhatsApp: `+15551234567`(DM), `1234567890-1234567890@g.us`(그룹), `120363123456789@newsletter`(Channel/Newsletter 발신 대상)
- Telegram: `@username` 또는 숫자 채팅 id. 그룹은 숫자 id입니다.
- Slack: `user:U…` 및 `channel:C…`
- Discord: `user:<id>` 및 `channel:<id>`
- Matrix(Plugin): `user:@user:server`, `room:!roomId:server` 또는 `#alias:server`
- Microsoft Teams(Plugin): `user:<id>` 및 `conversation:<id>`
- Zalo(Plugin): 사용자 id(Bot API)
- Zalo Personal / `zalouser`(Plugin): `zca`의 스레드 id(DM/그룹)(`me`, `friend list`, `group list`)

## 자신("me")

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
