---
read_when:
    - 로컬 Ollama 서버 없이 호스팅된 Ollama 모델을 사용하려는 경우
    - ollama-cloud 공급자 ID, 키 또는 엔드포인트가 필요합니다
summary: OpenClaw에서 Ollama Cloud를 직접 사용하기
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:03:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud는 Ollama의 호스팅 모델 API입니다. 로컬 Ollama 서버를 설치하거나 로컬
Ollama 앱을 클라우드 모드로 로그인하지 않고도 OpenClaw가 Ollama에서 호스팅되는
모델을 직접 호출할 수 있게 해줍니다. 제공자 ID `ollama-cloud`와
`ollama-cloud/kimi-k2.6` 같은 모델 참조를 사용하세요.

이 페이지는 직접적인 클라우드 전용 라우팅을 위한 것입니다. 이 제공자는 OpenAI 호환
`/v1` 경로가 아니라 Ollama의 네이티브 `/api/chat` 스타일을 사용합니다. OpenClaw는
클라우드 전용 자격 증명, 라이브 카탈로그 검색, 모델 선택이 로컬 `ollama` 호스트와
섞이지 않도록 이를 별도의 제공자 ID로 등록합니다.

클라우드 전용 라우팅을 원할 때 이 페이지를 사용하세요. 로컬 Ollama, 하이브리드
클라우드+로컬 라우팅, 임베딩, 사용자 지정 호스트 세부 정보는
[Ollama](/ko/providers/ollama)를 참조하세요.

## 설정

[ollama.com/settings/keys](https://ollama.com/settings/keys)에서 Ollama Cloud API 키를 만든 다음 실행하세요.

```bash
openclaw onboard --auth-choice ollama-cloud
```

또는 다음을 설정하세요.

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## 기본값

- 제공자: `ollama-cloud`
- 기본 URL: `https://ollama.com`
- 환경 변수: `OLLAMA_API_KEY`
- API 스타일: Ollama 네이티브 `/api/chat`
- 예시 모델: `ollama-cloud/kimi-k2.6`

## Ollama Cloud를 선택해야 하는 경우

- 로컬에서 `ollama serve`를 실행하지 않고 호스팅 Ollama 모델을 사용하려는 경우.
- OpenClaw가 로컬 Ollama에 사용하는 것과 같은 네이티브 Ollama 채팅 API 형태를
  원하지만, 대상이 `https://ollama.com`이기를 원하는 경우.
- 이미 Ollama의 호스팅 카탈로그에 있는 모델을 위한 간단한 클라우드 경로를 원하는 경우.
- 로컬 모델 풀, 로컬 GPU 제어, 또는 LAN 전용 추론이 필요하지 않은 경우.

로그인된 Ollama 호스트를 통한 로컬 전용 또는 클라우드+로컬 라우팅을 원할 때는
대신 [Ollama](/ko/providers/ollama)를 사용하세요. `/v1/chat/completions`
의미 체계 또는 제공자별 OpenAI 스타일 기능이 필요할 때는 대신 OpenAI 호환 제공자를
사용하세요.

## 모델

OpenClaw는 라이브 호스팅 카탈로그에서 Ollama Cloud 모델을 검색합니다. 일반적으로
사용 가능한 호스팅 ID는 다음과 같습니다.

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

현재 호스팅 카탈로그의 모델 ID를 사용하세요.

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

모델 ID는 클라우드 카탈로그 ID이며, 로컬 풀 이름이 아닙니다. 모델 이름이 로컬
Ollama 호스트에서는 작동하지만 호스팅 카탈로그에는 없다면, 대신 해당 로컬 호스트와
함께 `ollama` 제공자를 사용하세요.

## 라이브 테스트

Ollama Cloud API 키 스모크 테스트의 경우 Ollama 라이브 테스트가 호스팅 엔드포인트를
가리키도록 하고 현재 카탈로그에서 모델을 선택하세요.

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

클라우드 스모크는 텍스트, 네이티브 스트림, 웹 검색을 실행합니다. Ollama Cloud API
키가 `/api/embed`를 승인하지 않을 수 있으므로 `https://ollama.com`에 대해서는
기본적으로 임베딩을 건너뜁니다.

## 문제 해결

- `Set OLLAMA_API_KEY` 오류: 실제 클라우드 API 키를 제공하세요. 로컬
  `ollama-local` 표식은 로컬 또는 비공개 Ollama 호스트 전용입니다.
- 알 수 없는 모델 오류: `openclaw models list --provider ollama-cloud`를 실행하고
  호스팅 모델 ID를 정확히 복사하세요.
- 사용자 지정 Ollama 호스트의 도구 호출 또는 원시 JSON 문제: 실수로 OpenAI 호환
  `/v1` URL을 사용하고 있는지 확인하세요. Ollama 경로는 `/v1` 접미사가 없는
  네이티브 기본 URL을 사용해야 합니다.

## 관련 항목

- [Ollama](/ko/providers/ollama)
- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
