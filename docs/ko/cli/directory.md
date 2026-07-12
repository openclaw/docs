---
read_when:
    - 채널의 연락처/그룹/자기 자신의 ID를 조회하려는 경우
    - 채널 디렉터리 어댑터를 개발하고 있습니다
summary: '`openclaw directory`의 CLI 참조(자신, 피어, 그룹)'
title: 디렉터리
x-i18n:
    generated_at: "2026-07-12T00:40:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e1a952525f79dcb6eedb87eb433be7cb378fa19de5f252521e287d2c52275c
    source_path: cli/directory.md
    workflow: 16
---

# `openclaw directory`

연락처/피어, 그룹, "나"(자기 자신) 조회를 지원하는 채널의 디렉터리 조회 기능입니다.

결과는 다른 명령, 특히 `openclaw message send --target ...`에 붙여 넣어 사용하도록 되어 있습니다.

## 공통 플래그

- `--channel <name>`: 채널 ID/별칭(여러 채널이 구성된 경우 필수이며, 하나만 구성된 경우 자동 선택됨)
- `--account <id>`: 계정 ID(기본값: 채널 기본값)
- `--json`: JSON 출력

기본(비 JSON) 출력은 탭으로 구분된 `id`와 경우에 따라 `name`입니다.

## 참고 사항

- 많은 채널에서 결과는 실시간 제공자 디렉터리가 아니라 구성(허용 목록/구성된 그룹)을 기반으로 합니다.
- 이미 설치된 채널 Plugin이 디렉터리를 지원하지 않을 수 있습니다. 이 경우 명령은 지원되지 않는 작업임을 보고하며, 지원 기능을 추가하기 위해 Plugin을 재설치하거나 업그레이드하지 않습니다.

## `message send`에서 결과 사용하기

```bash
openclaw directory peers list --channel slack --query "U0"
openclaw message send --channel slack --target user:U012ABCDEF --message "hello"
```

## 채널별 ID 형식

| 채널                                | 대상 ID 형식                                                                                                               |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| WhatsApp                            | `+15551234567`(DM), `1234567890-1234567890@g.us`(그룹), `120363123456789@newsletter`(채널/뉴스레터, 발신 전용)              |
| Signal                              | 구성된 별칭은 E.164/UUID DM 대상 또는 `group:<id>` 그룹 대상으로 해석됨                                                    |
| Telegram                            | `@username` 또는 숫자 채팅 ID. 그룹에는 숫자 ID 사용                                                                        |
| Slack                               | `user:U…` 및 `channel:C…`                                                                                                  |
| Discord                             | `user:<id>` 및 `channel:<id>`                                                                                              |
| Matrix(Plugin)                      | `user:@user:server`, `room:!roomId:server` 또는 `#alias:server`                                                             |
| Microsoft Teams(Plugin)             | `user:<id>` 및 `conversation:<id>`                                                                                         |
| Zalo(Plugin)                        | 사용자 ID(Bot API)                                                                                                         |
| Zalo Personal / `zalouser`(Plugin)  | `zca`의 스레드 ID(DM/그룹)(`me`, `friend list`, `group list`)                                                              |

## 자기 자신("나")

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

## 관련 문서

- [CLI 참조](/ko/cli)
