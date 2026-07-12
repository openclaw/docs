---
summary: /plugins/sdk-channel-outbound로 리디렉션합니다
title: 채널 메시지 API
x-i18n:
    generated_at: "2026-07-12T15:34:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 08c59ba7d1046518e0e3765db19c88ce20d555f7dabf6b054d28f4bc105d5acd
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

이 페이지는 [채널 아웃바운드 API](/ko/plugins/sdk-channel-outbound)로 이동했습니다.

`openclaw/plugin-sdk/channel-message`와
`openclaw/plugin-sdk/channel-message-runtime`은 이전 플러그인을 위한 사용 중단된 호환성
하위 경로로 유지됩니다. 둘 다 공유 채널 메시지 코어에 대한 얇은 별칭입니다. 새 채널 플러그인은
사용 중단된 하위 경로에 새 헬퍼를 추가하는 대신 메시지 수명 주기, 수신 확인,
내구성 있는 전송 및 실시간 미리 보기 헬퍼를 위해
`openclaw/plugin-sdk/channel-outbound`를 사용해야 합니다.

제거 계획: 외부 플러그인 마이그레이션 기간에는 이러한 별칭을 유지한 다음,
호출자가 `channel-outbound`로 이동한 후 다음 주요 SDK 정리에서 제거합니다.
