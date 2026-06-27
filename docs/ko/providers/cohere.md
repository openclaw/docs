---
read_when:
    - OpenClaw에서 Cohere를 사용하려고 합니다
    - Cohere API 키 환경 변수 또는 CLI 인증 선택이 필요합니다
summary: Cohere 설정(인증 + 모델 선택)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:01:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com)는 Compatibility API를 통해 OpenAI 호환 추론을 제공합니다. OpenClaw는 외부화 전환 기간 동안 Cohere 제공자를 함께 제공하며, Command A 모델 카탈로그가 포함된 공식 외부 Plugin으로도 게시합니다.

| 속성            | 값                                                   |
| --------------- | ---------------------------------------------------- |
| 제공자 ID       | `cohere`                                             |
| Plugin          | 전환 기간 동안 번들로 제공; 공식 외부 패키지        |
| 인증 환경 변수  | `COHERE_API_KEY`                                     |
| 온보딩 플래그   | `--auth-choice cohere-api-key`                       |
| 직접 CLI 플래그 | `--cohere-api-key <key>`                             |
| API             | OpenAI 호환 (`openai-completions`)                   |
| 기본 URL        | `https://api.cohere.ai/compatibility/v1`             |
| 기본 모델       | `cohere/command-a-03-2025`                           |

## 시작하기

1. Cohere는 현재 OpenClaw 패키지에 포함되어 있습니다. 사용할 수 없는 경우 외부 패키지를 설치하고 Gateway를 다시 시작하세요.

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Cohere API 키를 만듭니다.
3. 온보딩을 실행합니다.

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. 카탈로그를 사용할 수 있는지 확인합니다.

```bash
openclaw models list --provider cohere
```

기본 모델은 기본 모델이 아직 구성되어 있지 않은 경우에만 설정됩니다.

## 환경 변수만 사용하는 설정

`COHERE_API_KEY`를 Gateway 프로세스에서 사용할 수 있게 한 다음 Cohere 모델을 선택하세요.

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Gateway가 데몬이나 Docker에서 실행되는 경우 해당 서비스에 `COHERE_API_KEY`를 구성하세요. 대화형 셸에서만 내보내면 이미 실행 중인 Gateway에서 사용할 수 없습니다.
</Note>

## 관련 항목

- [모델 제공자](/ko/concepts/model-providers)
- [모델 CLI](/ko/cli/models)
- [제공자 디렉터리](/ko/providers)
