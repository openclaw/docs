---
read_when:
    - NovitaAI 모델로 OpenClaw을 실행하려는 경우
    - Novita 공급자 ID, 키 또는 엔드포인트가 필요합니다.
summary: OpenClaw에서 NovitaAI의 OpenAI 호환 API 사용하기
title: NovitaAI
x-i18n:
    generated_at: "2026-07-12T01:07:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 83e0e43e68d85d73e790023858a49f971b683129dbbdf6092fbd8bba4d8da331
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI는 OpenAI 호환 API를 제공하는 호스팅 AI 인프라 공급자입니다.
별도의 Plugin 설치가 필요 없는 OpenClaw 번들 공급자로 제공되므로,
자격 증명은 일반 모델 인증 흐름을 거치며 모델 참조는
`novita/deepseek/deepseek-v3-0324`와 같은 형식입니다.

## 설정

[novita.ai/settings/key-management](https://novita.ai/settings/key-management)에서 API 키를 생성한 후 다음을 실행합니다.

```bash
openclaw onboard --auth-choice novita-api-key
```

또는 다음을 설정합니다.

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## 기본값

| 설정          | 값                                 |
| ------------- | ---------------------------------- |
| 공급자 ID     | `novita`                           |
| 별칭          | `novita-ai`, `novitaai`            |
| 기본 URL      | `https://api.novita.ai/openai/v1`  |
| 환경 변수     | `NOVITA_API_KEY`                   |
| 기본 모델     | `novita/deepseek/deepseek-v3-0324` |

## 번들 모델 카탈로그

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

이는 시작점일 뿐, 실시간 카탈로그가 아닙니다. 계정, 리전 또는
Novita의 현재 제공 항목에 따라 경로가 추가, 제거 또는 제한될 수 있습니다. 장기 기본값을
설정하기 전에 다음 명령으로 확인하세요.

```bash
openclaw models list --provider novita
```

## Novita를 선택해야 하는 경우

- OpenAI 호환 API를 통한 호스팅 오픈 웨이트 모델 사용이 필요한 경우.
- 단일 공급자 계정을 통해 DeepSeek, Kimi, MiniMax, GLM 또는 Qwen 계열
  경로를 사용하려는 경우.
- DeepInfra, GMI, OpenRouter 또는 공급업체 직접 API 외에 또 다른 호스팅
  대체 경로가 필요한 경우.
- LM Studio, Ollama, SGLang 또는 vLLM 인프라를 직접 유지 관리하는 대신
  공급자 측 모델 호스팅을 사용하려는 경우.

공급업체 고유의 요청 매개변수나 지원 계약이 필요하다면 공급업체 직접 공급자를
선택하세요. 모델이 자체 하드웨어 또는 네트워크 경계 내에서
실행되어야 한다면 로컬 공급자를 선택하세요.

## 문제 해결

- `401`/`403`: Novita의 키 관리 페이지에서 키를 확인하고, 저장된 프로필이
  오래된 경우 `openclaw onboard --auth-choice novita-api-key`를 다시
  실행하세요.
- 알 수 없는 모델 오류: `openclaw models list --provider novita`에서 반환된
  정확한 `novita/<route-id>`를 사용하세요.
- 느리거나 실패하는 경로: 다른 Novita 모델 경로를 사용해 보거나, 공급자별
  편차를 허용할 수 있는 워크로드에서는 Novita를 대체 공급자로
  설정하세요.

## 관련 문서

- [모델 공급자](/ko/concepts/model-providers)
- [공급자 디렉터리](/ko/providers/index)
