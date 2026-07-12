---
read_when:
    - 로컬 Ollama 서버 없이 호스팅된 Ollama 모델을 사용하려는 경우
    - ollama-cloud 공급자 ID, 키 또는 엔드포인트가 필요합니다.
summary: OpenClaw에서 Ollama Cloud 직접 사용하기
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T01:12:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud는 Ollama의 호스팅 모델 API입니다. `ollama-cloud` 제공자는 로컬 Ollama 서버나 클라우드 모드로 로그인된 로컬 Ollama 앱 없이 Ollama의 네이티브 `/api/chat` API를 통해 `https://ollama.com`을 직접 호출합니다. `ollama-cloud/kimi-k2.6`과 같은 모델 참조를 사용하세요.

OpenClaw는 클라우드 전용 자격 증명, 실시간 카탈로그 검색 및 모델 선택이 로컬 `ollama` 호스트와 혼합되지 않도록 `ollama-cloud`를 독립된 제공자 ID로 등록합니다. 로컬 Ollama, 클라우드와 로컬을 함께 사용하는 하이브리드 라우팅, 임베딩 및 사용자 지정 호스트 세부 정보는 [Ollama](/ko/providers/ollama)를 참조하세요.

## 설정

[ollama.com/settings/keys](https://ollama.com/settings/keys)에서 Ollama Cloud API 키를 만든 후 다음을 실행하세요.

```bash
openclaw onboard --auth-choice ollama-cloud
```

또는 다음을 설정하세요.

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

비대화형 온보딩에서는 키를 직접 지정할 수 있습니다.

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

온보딩은 기본 모델을 `ollama-cloud/kimi-k2.5:cloud`로 설정합니다.

## 기본값

- 제공자: `ollama-cloud`
- 기본 URL: `https://ollama.com`
- 환경 변수: `OLLAMA_API_KEY`
- API 형식: Ollama 네이티브 `/api/chat`
- 온보딩 기본 모델: `ollama-cloud/kimi-k2.5:cloud`

## Ollama Cloud를 선택해야 하는 경우

- 로컬에서 `ollama serve`를 실행하지 않고 호스팅된 Ollama 모델을 사용하려는 경우
- OpenClaw가 로컬 Ollama에 사용하는 것과 동일한 네이티브 Ollama 채팅 API 형식을 `https://ollama.com`에 연결하여 사용하려는 경우
- Ollama의 호스팅 카탈로그에 이미 있는 모델을 간단한 클라우드 경로로 사용하려는 경우
- 로컬 모델 가져오기, 로컬 GPU 제어 또는 LAN 전용 추론이 필요하지 않은 경우

로그인된 Ollama 호스트를 통해 로컬 전용 또는 클라우드와 로컬을 함께 사용하는 라우팅을 원한다면 대신 [Ollama](/ko/providers/ollama)를 사용하세요. `/v1/chat/completions` 의미 체계나 제공자별 OpenAI 형식 기능이 필요하다면 OpenAI 호환 제공자를 사용하세요.

## 모델

이 제공자에는 API 키가 필요하며, 키가 없으면 비활성 상태로 유지됩니다. 키가 있으면 OpenClaw가 호스팅 카탈로그에서 Ollama Cloud 모델을 실시간으로 검색합니다.

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

실시간 카탈로그의 호스팅 ID에는 `deepseek-v4-flash`, `glm-5`, `gpt-oss:20b`, `kimi-k2.6`, `minimax-m2.7`이 포함됩니다. 실시간 검색 결과가 없으면 OpenClaw는 번들 항목인 `kimi-k2.5:cloud`, `minimax-m2.7:cloud`, `glm-5.1:cloud`, `glm-5.2:cloud`를 대신 사용합니다.

모델 ID는 로컬 가져오기 이름이 아니라 클라우드 카탈로그 ID입니다. 로컬 Ollama 호스트에서는 작동하지만 호스팅 카탈로그에는 없는 모델 이름이라면 해당 로컬 호스트와 함께 `ollama` 제공자를 사용하세요.

## 실시간 테스트

Ollama Cloud API 키 스모크 테스트를 실행하려면 Ollama 실시간 테스트가 호스팅 엔드포인트를 가리키도록 설정하고 현재 카탈로그에서 모델을 선택하세요.

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

클라우드 스모크 테스트는 텍스트, 네이티브 스트림 및 웹 검색을 실행합니다. 웹 검색을 건너뛰려면 `OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0`을 설정하세요. Ollama Cloud API 키에 `/api/embed` 권한이 없을 수 있으므로 `https://ollama.com`에서는 기본적으로 임베딩을 건너뜁니다. 임베딩을 강제로 실행하려면 `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`을 설정하세요.

## 문제 해결

- `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY` 오류: 실제 클라우드 API 키를 제공하세요. 로컬 `ollama-local` 표식은 로컬 또는 비공개 Ollama 호스트에만 사용됩니다.
- 알 수 없는 모델 오류: `openclaw models list --provider ollama-cloud`를 실행하고 호스팅 모델 ID를 정확히 복사하세요.
- 사용자 지정 Ollama 호스트의 도구 호출 또는 원시 JSON 문제: OpenAI 호환 `/v1` URL을 실수로 사용하고 있는지 확인하세요. Ollama 경로는 `/v1` 접미사가 없는 네이티브 기본 URL을 사용해야 합니다.

## 관련 문서

- [Ollama](/ko/providers/ollama)
- [모델 제공자](/ko/concepts/model-providers)
- [모든 제공자](/ko/providers/index)
