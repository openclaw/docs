---
read_when:
    - OpenClaw에서 Cohere를 사용하려고 합니다
    - Cohere API 키 환경 변수 또는 CLI 인증 옵션이 필요합니다.
summary: Cohere 설정(인증 + 모델 선택)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T15:39:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com)는 Compatibility API를 통해 OpenAI 호환 추론을 제공합니다. OpenClaw는 외부화 전환 기간 동안 Cohere 제공자를 번들로 포함하며, 공식 외부 Plugin으로도 게시합니다.

| 속성            | 값                                                   |
| --------------- | ---------------------------------------------------- |
| 제공자 ID       | `cohere`                                             |
| Plugin          | 전환 기간 동안 번들로 포함; 공식 외부 패키지        |
| 인증 환경 변수  | `COHERE_API_KEY`                                     |
| 온보딩 플래그   | `--auth-choice cohere-api-key`                       |
| 직접 CLI 플래그 | `--cohere-api-key <key>`                             |
| API             | OpenAI 호환(`openai-completions`)                    |
| 기본 URL        | `https://api.cohere.ai/compatibility/v1`             |
| 기본 모델       | `cohere/command-a-plus-05-2026`                      |
| 컨텍스트 창     | 128,000 토큰                                         |

## 기본 제공 카탈로그

| 모델 참조                            | 입력         | 컨텍스트 | 최대 출력 | 참고                                              |
| ------------------------------------ | ------------ | -------- | --------- | ------------------------------------------------- |
| `cohere/command-a-plus-05-2026`      | 텍스트, 이미지 | 128,000  | 64,000    | 기본값; 플래그십 에이전트 및 추론 모델            |
| `cohere/command-a-03-2025`           | 텍스트       | 256,000  | 8,000     | 이전 Command A 모델                               |
| `cohere/command-a-reasoning-08-2025` | 텍스트       | 256,000  | 32,000    | 에이전트 추론 및 도구 사용                        |
| `cohere/command-a-vision-07-2025`    | 텍스트, 이미지 | 128,000  | 8,000     | 비전 및 문서 분석; 도구 사용 불가                 |
| `cohere/north-mini-code-1-0`         | 텍스트, 이미지 | 256,000  | 64,000    | 에이전트 코딩; 추론; 무료 한도                    |

추론 기능을 지원하는 Cohere 모델은 두 가지 Compatibility API 추론 모드를 지원합니다. OpenClaw는 **끄기**를 `none`에 매핑하고, 활성화된 모든 사고 수준을 `high`에 매핑합니다. Command A Vision은 도구 사용을 지원하지 않으므로 OpenClaw는 해당 모델에서 에이전트 도구를 비활성화된 상태로 유지합니다.

## 시작하기

1. Cohere는 현재 OpenClaw 패키지에 포함되어 제공됩니다. 누락된 경우 외부 패키지를 설치하고 Gateway를 다시 시작하십시오.

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Cohere API 키를 생성하십시오.
3. 온보딩을 실행하십시오.

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. 카탈로그를 사용할 수 있는지 확인하십시오.

```bash
openclaw models list --provider cohere
```

기본 모델이 아직 구성되지 않은 경우에만 온보딩에서 Cohere를 기본 모델로 설정합니다.

## 환경 변수만으로 설정

Gateway 프로세스에서 `COHERE_API_KEY`를 사용할 수 있도록 한 다음 Cohere 모델을 선택하십시오.

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Gateway가 데몬 또는 Docker에서 실행되는 경우 해당 서비스에 `COHERE_API_KEY`를 설정하십시오. 대화형 셸에서만 내보내면 이미 실행 중인 Gateway에서 사용할 수 없습니다.
</Note>

## 관련 항목

- [모델 제공자](/ko/concepts/model-providers)
- [모델 CLI](/ko/cli/models)
- [제공자 디렉터리](/ko/providers/index)
