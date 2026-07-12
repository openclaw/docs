---
read_when:
    - ClawHub에서 제공하는 무료 프로모션 모델을 사용해 보고 싶습니다
    - 온보딩 대신 프로모션을 통해 제공자를 구성하고 있습니다
summary: '`openclaw promos`의 CLI 참조(프로모션 모델 혜택 목록 조회 및 신청)'
title: 프로모션
x-i18n:
    generated_at: "2026-07-12T15:07:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

ClawHub에 게시된 프로모션 모델 혜택을 찾아 신청합니다. 프로모션을
신청하면 제공자(필요한 경우 인증 및 Plugin)가 구성되고 프로모션의
모델이 등록됩니다. 온보딩을 다시 실행하지 않으며, 사용자가 명시하지
않는 한 기본 모델도 변경하지 않습니다.

관련 문서:

- 기본 모델 및 폴백: [모델](/ko/cli/models)
- 제공자 인증 설정: [시작하기](/ko/start/getting-started)

## 명령어

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

현재 진행 중인 프로모션을 해당 모델, 권장 기본값, 남은 시간 및 정확한
신청 명령어와 함께 나열합니다. `--json`은 원시 페이로드를 출력합니다.

## `openclaw promos claim <slug>`

진행 중인 프로모션을 신청합니다.

1. ClawHub에서 프로모션을 가져와 유효 기간 내에 있는지 확인합니다.
2. 설치된 OpenClaw 버전을 기준으로 프로모션의 제공자, 인증 방식 및 선언된 Plugin 패키지를
   검증합니다. 알 수 없는 ID나 패키지 불일치는 거부됩니다. 프로모션을 통해 CLI가
   이미 처리 방법을 알고 있지 않은 작업을 실행하게 할 수는 없습니다.
3. 기존 제공자 자격 증명이 있으면 재사용합니다. 그렇지 않으면 제공자의
   일반 인증 절차를 진행하며, 먼저 무료 키를 받을 수 있는 프로모션 가입 URL을
   출력합니다. `--api-key <key>`를 사용하면 프롬프트 없이 API 키 인증을
   완료하며, `openclaw onboard`의 비대화형 플래그와 동일하게 동작합니다. 키를
   명령줄에 노출하지 않으려면 제공자의 환경 변수(예: `OPENROUTER_API_KEY`)로
   내보내십시오. 기존 환경 변수 자격 증명은 자동으로 감지되므로 플래그가
   필요하지 않습니다.
4. 프로모션 모델을 별칭과 함께 등록합니다. 기존 별칭은
   절대 덮어쓰지 않습니다.
5. 프로모션의 권장 모델을 기본값으로 설정할지 묻습니다.
   `--set-default`를 사용하면 질문을 건너뛰며, 그렇지 않으면 기본값에 관한
   어떤 설정도 변경되지 않습니다.

프로모션 기간이 종료되면 제공자는 무료 모델 제공을 중단하지만,
구성과 자격 증명은 변경되지 않습니다. 언제든지
`openclaw models set <model>`로 다시 전환할 수 있습니다.

## `models list`에서 수동적 검색

`openclaw models list`는 ClawHub에 직접 요청하지 않아도 프로모션을
표시합니다.

- 아직 구성하지 않은 모델이 포함된 진행 중인 혜택은 표 아래의
  "프로모션을 통해 이용 가능" 그룹에 표시되며, 각 항목에 신청
  명령어가 포함됩니다.
- `promos claim`을 통해 등록한 모델에는 `promo` 태그가 붙으며,
  혜택 기간이 지나면 `promo ended`로 변경됩니다.
- 새로운 혜택이 처음 감지되면 일회성 알림에서
  `openclaw promos list`를 안내합니다. 이미 나열하거나 신청한 혜택은
  다시 알리지 않습니다.

이 기능은 로컬에 캐시된 ClawHub의 호스팅 프로모션 피드 사본을
읽습니다. 일반적으로 조건부 요청을 통해 하루에 한 번 새로 고치거나
캐시된 스냅샷이 만료되면 더 일찍 새로 고치며, 새로 고침 실패는 알림
없이 건너뜁니다. 오래된 캐시의 새로 고침은 최대 2.5초만 기다리며
목록 출력을 중단시키지 않습니다. `--json` 및 `--plain` 출력은 기계
처리에 적합한 상태로 유지되며, 프로모션 섹션이나 알림이 포함되지
않습니다. 신청 시에는 항상 실시간 ClawHub API를 통해 다시 검증하므로,
캐시된 사본에 계속 표시되더라도 조기에 철회된 혜택은 거부됩니다.
