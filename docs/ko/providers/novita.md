---
read_when:
    - OpenClaw를 NovitaAI 모델과 함께 실행하려는 경우
    - Novita 제공자 ID, 키 또는 엔드포인트가 필요합니다
summary: OpenClaw에서 NovitaAI의 OpenAI 호환 API 사용
title: NovitaAI
x-i18n:
    generated_at: "2026-06-27T18:03:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 602df700662dbf2176acabcad7d23950e8240158f58d115f8e56bf1fb9f43bcb
    source_path: providers/novita.md
    workflow: 16
---

NovitaAI는 OpenAI 호환 모델 API를 제공하는 호스팅 AI 인프라 제공자입니다. OpenClaw에서는 번들 모델 제공자이므로 제공자 ID는
`novita`이고, 자격 증명은 일반 모델 인증 흐름을 거치며, 모델 참조는
`novita/deepseek/deepseek-v3-0324`와 같은 형식입니다.

자체 추론 서버를 실행하지 않고 오픈 웨이트 및 타사 모델 경로에 대한 호스팅 액세스가 필요할 때 Novita를 사용하세요. 번들 카탈로그는 DeepSeek, Moonshot,
MiniMax, GLM, 그리고 Novita가 노출하는 Qwen 경로를 포함하여 에이전트 턴에 실용적인 채팅 모델에 중점을 둡니다.

이 제공자는 Novita의 OpenAI 호환 엔드포인트를 사용합니다. OpenClaw는
제공자 등록, 인증, 별칭, 모델 참조 정규화, 기본 URL 선택을 처리하며, Novita는 실시간 모델 가용성, 계정 권한,
가격, 속도 제한을 제어합니다.

## 설정

[novita.ai/settings/key-management](https://novita.ai/settings/key-management)에서 API 키를 만든 다음 실행하세요.

```bash
openclaw onboard --auth-choice novita-api-key
```

또는 다음을 설정하세요.

```bash
export NOVITA_API_KEY="<your-novita-api-key>" # pragma: allowlist secret
```

## 기본값

- 제공자: `novita`
- 별칭: `novita-ai`, `novitaai`
- 기본 URL: `https://api.novita.ai/openai/v1`
- 환경 변수: `NOVITA_API_KEY`
- 기본 모델: `novita/deepseek/deepseek-v3-0324`

## Novita를 선택해야 하는 경우

- OpenAI 호환 API로 호스팅 오픈 웨이트 모델 액세스가 필요합니다.
- 단일 제공자 계정을 통해 DeepSeek, Kimi, MiniMax, GLM 또는 Qwen 계열 경로를 사용하고 싶습니다.
- OpenRouter, GMI, DeepInfra 또는 직접 벤더 API 외에 또 다른 호스팅 대체 경로가 필요합니다.
- vLLM, SGLang, LM Studio 또는 Ollama 인프라를 유지 관리하는 대신 제공자 측 모델 호스팅을 선호합니다.

벤더 네이티브 요청 매개변수나 지원 계약이 필요할 때는 직접 벤더 제공자를 선택하세요. 모델이 자체 하드웨어에서 실행되어야 하거나 자체 네트워크 경계 뒤에서 실행되어야 하는 경우에는 로컬 제공자를 선택하세요.

## 모델

번들 카탈로그는 다음을 포함하여 일반적으로 사용 가능한 NovitaAI 경로 ID를 시드합니다.

- `novita/moonshotai/kimi-k2.5`
- `novita/minimax/minimax-m2.7`
- `novita/zai-org/glm-5`
- `novita/deepseek/deepseek-v3-0324`
- `novita/deepseek/deepseek-r1-0528`
- `novita/qwen/qwen3-235b-a22b-fp8`

카탈로그는 OpenClaw 모델 선택의 시작점입니다. 계정, 지역 또는 Novita의 현재 카탈로그에 따라 경로가 추가, 제거 또는 제한될 수 있습니다. 장기 기본값을 설정하기 전에 CLI에서 제공자를 확인하세요.

```bash
openclaw models list --provider novita
```

## 문제 해결

- `401` 또는 `403`: Novita의 키 관리 페이지에서 키를 확인하고 저장된 프로필이 오래된 경우
  `openclaw onboard --auth-choice novita-api-key`를 다시 실행하세요.
- 알 수 없는 모델 오류: `openclaw models list --provider novita`가 반환하는 정확한 `novita/<route-id>`를 사용하세요.
- 느리거나 실패하는 경로: 다른 Novita 모델 경로를 시도하거나 제공자별 변동을 허용할 수 있는 워크로드에는 Novita를 대체 제공자로 설정하세요.

## 관련 항목

- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
