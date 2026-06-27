---
summary: /plugins/sdk-channel-outbound로 리디렉션
title: 채널 메시지 API
x-i18n:
    generated_at: "2026-06-27T17:55:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16a8218a33b379f82c43c8b7e6ee5423cc7338f72f8489d55aa4c7abb2c53721
    source_path: plugins/sdk-channel-message.md
    workflow: 16
---

이 페이지는 [채널 아웃바운드 API](/ko/plugins/sdk-channel-outbound)로 이동했습니다.

`openclaw/plugin-sdk/channel-message` 및
`openclaw/plugin-sdk/channel-message-runtime`은 이전 Plugin을 위한 더 이상 권장되지 않는 호환성
하위 경로로 남아 있습니다. 새 채널 Plugin은 메시지 수명 주기, 수신 확인, 내구성 있는
전송, 실시간 미리보기 헬퍼에
`openclaw/plugin-sdk/channel-outbound`를 사용해야 합니다. 더 이상 권장되지 않는 하위 경로는
공유 채널 메시지 코어와 집중된 인바운드/아웃바운드 SDK 표면 위에 놓인 얇은 별칭입니다.
그곳에 새 헬퍼를 추가하지 마세요.

제거 계획: 외부 Plugin 마이그레이션 기간 동안 이러한 별칭을 유지한 다음,
호출자가 `channel-outbound`로 이동한 뒤 다음 주요 SDK 정리에서 제거합니다.
