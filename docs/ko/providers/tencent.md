---
read_when:
    - OpenClaw에서 Tencent Hy 모델을 사용하려고 합니다.
    - TokenHub API 키 설정이 필요합니다.
summary: Tencent Cloud TokenHub 설정
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-22T06:01:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud provider는 TokenHub 엔드포인트(`tencent-tokenhub`)를 통해 Tencent Hy 모델에 접근할 수 있게 해줍니다.

이 provider는 OpenAI 호환 API를 사용합니다.

## 빠른 시작

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## 비대화형 예시

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Provider 및 엔드포인트

| Provider           | 엔드포인트                    | 사용 사례                |
| ------------------ | ----------------------------- | ------------------------ |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Tencent TokenHub를 통한 Hy |

## 사용 가능한 모델

### tencent-tokenhub

- **hy3-preview** — Hy3 프리뷰(256K 컨텍스트, 추론, 기본값)

## 참고

- TokenHub 모델 ref는 `tencent-tokenhub/<modelId>`를 사용합니다.
- 필요한 경우 `models.providers`에서 가격 및 컨텍스트 메타데이터를 재정의하세요.

## 환경 참고

Gateway가 데몬(launchd/systemd)으로 실행되는 경우, `TOKENHUB_API_KEY`가 해당 프로세스에서 사용 가능하도록 해야 합니다(예: `~/.openclaw/.env` 또는 `env.shellEnv`를 통해).

## 관련 문서

- [OpenClaw Configuration](/ko/gateway/configuration)
- [Model Providers](/ko/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
