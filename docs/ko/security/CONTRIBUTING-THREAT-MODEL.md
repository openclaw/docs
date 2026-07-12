---
read_when:
    - 보안 취약점이나 위협 시나리오를 제보하려는 경우
    - 위협 모델 검토 또는 업데이트
summary: OpenClaw 위협 모델에 기여하는 방법
title: 위협 모델에 기여하기
x-i18n:
    generated_at: "2026-07-12T15:45:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e2e5cd95e8a2bf5ee4bd167afedfadf9aa876e4260e2d0bfb5f414cd4255410
    source_path: security/CONTRIBUTING-THREAT-MODEL.md
    workflow: 16
---

[위협 모델](/ko/security/THREAT-MODEL-ATLAS)은 지속적으로 갱신되는 문서입니다. 보안 또는 MITRE ATLAS 관련 배경지식이 없어도 누구나 기여할 수 있습니다.

<Note>
이 문서는 실제 취약점을 신고하는 곳이 아니라 위협 모델에 내용을 추가하는 데 사용됩니다. 악용 가능한 취약점을 발견했다면 대신 [Trust 페이지](https://trust.openclaw.ai)의 책임 있는 공개 지침을 따르십시오.
</Note>

## 기여 방법

**위협을 추가합니다.** 공격 시나리오를 직접 설명하여 [openclaw/trust](https://github.com/openclaw/trust/issues)에 이슈를 등록하십시오. 다음 정보는 유용하지만 필수는 아닙니다.

- 공격 시나리오와 이를 악용할 수 있는 방법
- 영향을 받는 구성 요소(CLI, Gateway, 채널, ClawHub, MCP 서버 등)
- 예상 심각도(낮음 / 보통 / 높음 / 치명적)
- 관련 연구, CVE 또는 실제 사례 링크

관리자는 검토 중에 ATLAS 매핑, 위협 ID, 위험 수준을 지정합니다.

**완화책을 제안합니다.** 해당 위협을 참조하는 이슈 또는 PR을 등록하십시오. 구체적이고 실행 가능하게 작성하십시오. "속도 제한을 구현합니다"보다는 "Gateway에서 발신자별로 분당 10개의 메시지로 속도를 제한합니다"가 더 유용합니다.

**공격 체인을 제안합니다.** 공격 체인은 여러 위협이 결합되어 현실적인 시나리오를 이루는 방식을 보여줍니다. 단계와 공격자가 이를 연결하는 방법을 설명하십시오. 형식적인 템플릿보다는 짧은 서술이 더 효과적입니다.

**기존 콘텐츠를 수정하거나 개선합니다.** 오타, 설명 보완, 오래된 정보, 더 나은 예시 등을 개선하는 PR을 환영하며, 별도의 이슈는 필요하지 않습니다.

## 프레임워크 참고 자료

위협은 프롬프트 인젝션, 도구 오용, 에이전트 악용과 같은 AI/ML 관련 위협을 위한 프레임워크인 [MITRE ATLAS](https://atlas.mitre.org/)(Adversarial Threat Landscape for AI Systems)에 매핑됩니다. 기여하기 위해 ATLAS를 알 필요는 없습니다. 관리자가 검토 중에 제출 내용을 매핑합니다.

**위협 ID.** 각 위협에는 `T-EXEC-003`과 같은 ID가 부여되며, 관리자가 검토 중에 지정합니다.

| 코드    | 범주                                   |
| ------- | ------------------------------------------ |
| RECON   | 정찰 - 정보 수집     |
| ACCESS  | 초기 접근 - 진입 권한 획득             |
| EXEC    | 실행 - 악의적인 작업 실행      |
| PERSIST | 지속성 - 접근 권한 유지           |
| EVADE   | 방어 회피 - 탐지 회피       |
| DISC    | 탐색 - 환경에 관한 정보 파악 |
| EXFIL   | 유출 - 데이터 탈취               |
| IMPACT  | 영향 - 피해 또는 중단              |

**위험 수준.** 수준을 확신할 수 없다면 영향만 설명하십시오. 관리자가 이를 평가합니다.

| 수준        | 의미                                                           |
| ------------ | ----------------------------------------------------------------- |
| **치명적** | 시스템 전체 침해 또는 높은 가능성 + 치명적인 영향      |
| **높음**     | 상당한 피해 가능성이 높거나 보통 가능성 + 치명적인 영향 |
| **보통**   | 중간 수준의 위험 또는 낮은 가능성 + 높은 영향                    |
| **낮음**      | 가능성이 낮고 영향이 제한적                                       |

## 검토 절차

1. **분류** - 새로운 제출 내용은 48시간 이내에 검토합니다.
2. **평가** - 관리자가 실현 가능성을 확인하고, ATLAS 매핑과 위협 ID를 지정하며, 위험 수준을 검증합니다.
3. **문서화** - 형식과 완전성을 확인합니다.
4. **병합** - 위협 모델과 시각화에 추가합니다.

## 리소스

- [ATLAS 웹사이트](https://atlas.mitre.org/)
- [ATLAS 기법](https://atlas.mitre.org/techniques/)
- [ATLAS 사례 연구](https://atlas.mitre.org/studies/)

## 문의

- **보안 취약점:** 신고 지침은 [Trust 페이지](https://trust.openclaw.ai)를 참조하거나 `security@openclaw.ai`로 문의하십시오.
- **위협 모델 관련 질문:** [openclaw/trust](https://github.com/openclaw/trust/issues)에 이슈를 등록하십시오.
- **일반 대화:** Discord `#security` 채널

## 기여자 표창

위협 모델 기여자는 위협 모델 감사의 글과 릴리스 노트에 이름이 기재되며, 중요한 기여를 한 경우 OpenClaw 보안 명예의 전당에 등재됩니다.

## 관련 문서

- [위협 모델](/ko/security/THREAT-MODEL-ATLAS)
- [인시던트 대응](/ko/security/incident-response)
- [정형 검증](/ko/security/formal-verification)
