---
read_when:
    - 워크스페이스 수동 부트스트래핑
summary: TOOLS.md용 워크스페이스 템플릿
title: TOOLS.md 템플릿
x-i18n:
    generated_at: "2026-07-12T15:45:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20eab78b3b117566a1d33a70873e70ff2d5099543aa44e2719dc8d0797099afe
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - 로컬 메모

Skills는 도구가 _어떻게_ 작동하는지 정의합니다. 이 파일은 카메라 이름과 위치, SSH 호스트와 별칭, 선호하는 TTS 음성, 스피커/방 이름, 기기 별명 등 사용자의 설정에만 해당하는 구체적인 정보를 기록하는 곳입니다.

## 예시

```markdown
### 카메라

- 거실 → 주요 공간, 180° 광각
- 현관문 → 입구, 동작 감지 방식

### SSH

- 홈 서버 → 192.168.1.100, 사용자: admin

### TTS

- 선호 음성: "Nova"(따뜻하고 약간 영국식)
- 기본 스피커: 주방 HomePod
```

## 왜 분리하나요?

Skills는 공유됩니다. 사용자의 설정은 사용자만의 것입니다. 둘을 분리하면 메모를 잃지 않고 Skills를 업데이트할 수 있으며, 인프라 정보를 노출하지 않고 Skills를 공유할 수 있습니다.

---

업무에 도움이 되는 정보를 자유롭게 추가하십시오. 이 파일은 사용자를 위한 참조 자료입니다.

## 관련 항목

- [에이전트 작업 공간](/ko/concepts/agent-workspace)
