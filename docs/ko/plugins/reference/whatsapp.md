---
read_when:
    - WhatsApp Plugin을 설치, 구성 또는 감사하는 중입니다
summary: OpenClaw 메시지를 보내고 받기 위한 WhatsApp 채널 인터페이스를 추가합니다.
title: WhatsApp Plugin
x-i18n:
    generated_at: "2026-05-05T06:08:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# WhatsApp Plugin

OpenClaw 메시지를 보내고 받기 위한 WhatsApp 채널 인터페이스를 추가합니다.

## 배포

- 패키지: `@openclaw/whatsapp`
- 설치 경로: npm; ClawHub

## 인터페이스

channels: whatsapp

## Windows 설치 참고 사항

Windows에서는 npm 설치 중 WhatsApp Plugin에 `PATH`의 Git이 필요합니다. Baileys/libsignal 의존성 중 하나를 git URL에서 가져오기 때문입니다. Git for Windows를 설치한 다음 셸을 다시 시작하고 설치를 다시 실행하세요.

```powershell
winget install --id Git.Git -e
```

Portable Git도 해당 `bin` 디렉터리가 `PATH`에 있으면 동작합니다.

## 관련 문서

- [whatsapp](/ko/channels/whatsapp)
