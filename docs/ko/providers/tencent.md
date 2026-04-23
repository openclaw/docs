---
read_when:
    - OpenClaw에서 Tencent Hy model을 사용하려고 합니다
    - TokenHub API key 설정이 필요합니다
summary: Tencent Cloud TokenHub 설정
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T14:07:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Tencent Cloud는 OpenClaw에 **번들 provider Plugin**으로 포함되어 있습니다. TokenHub 엔드포인트(`tencent-tokenhub`)를 통해 Tencent Hy model에 접근할 수 있습니다.

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

## provider 및 엔드포인트

| Provider           | Endpoint                      | 사용 사례              |
| ------------------ | ----------------------------- | ---------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Tencent TokenHub를 통한 Hy |

## 사용 가능한 model

### tencent-tokenhub

- **hy3-preview** — Hy3 preview (256K 컨텍스트, 추론, 기본값)

## 참고

- TokenHub model ref는 `tencent-tokenhub/<modelId>`를 사용합니다.
- 이 Plugin에는 계층형 Hy3 가격 메타데이터가 내장되어 있으므로, 수동 가격 재정의 없이도 비용 추정이 채워집니다.
- 필요하면 `models.providers`에서 가격 및 컨텍스트 메타데이터를 재정의하세요.

## 환경 참고

Gateway가 daemon(launchd/systemd)으로 실행되는 경우 `TOKENHUB_API_KEY`가
해당 프로세스에서 사용 가능해야 합니다(예: `~/.openclaw/.env` 또는
`env.shellEnv`를 통해).

## 관련 문서

- [OpenClaw Configuration](/ko/gateway/configuration)
- [Model Providers](/ko/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
