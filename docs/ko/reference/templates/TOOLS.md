---
read_when:
    - workspace 수동 부트스트래핑하기
summary: TOOLS.md용 workspace 템플릿
title: TOOLS.md 템플릿
x-i18n:
    generated_at: "2026-04-24T06:35:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# TOOLS.md - 로컬 메모

Skills는 도구가 _어떻게_ 동작하는지를 정의합니다. 이 파일은 _당신만의_ 구체적인 내용, 즉 당신의 설정에만 고유한 정보를 위한 것입니다.

## 여기에 들어갈 내용

예를 들면 다음과 같습니다.

- 카메라 이름과 위치
- SSH 호스트와 별칭
- 선호하는 TTS 음성
- 스피커/방 이름
- 디바이스 별명
- 기타 환경별 정보

## 예시

```markdown
### Cameras

- living-room → 메인 공간, 180° 광각
- front-door → 출입구, 모션 트리거됨

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- 선호 음성: "Nova" (따뜻하고 약간 영국식)
- 기본 스피커: Kitchen HomePod
```

## 왜 분리하나요?

Skills는 공유됩니다. 하지만 당신의 설정은 당신만의 것입니다. 이를 분리해 두면 메모를 잃지 않고 Skills를 업데이트할 수 있고, 인프라를 노출하지 않고 Skills를 공유할 수 있습니다.

---

작업에 도움이 되는 것이면 무엇이든 추가하세요. 이것은 당신의 치트 시트입니다.

## 관련 항목

- [에이전트 workspace](/ko/concepts/agent-workspace)
