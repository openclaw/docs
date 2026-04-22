---
read_when:
    - Chcesz używać modeli Tencent Hy z OpenClaw
    - Potrzebujesz konfiguracji klucza API TokenHub
summary: Konfiguracja Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-22T09:52:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04da073973792c55dc0c2d287bfc51187bb2128bbbd5c4a483f850adeea50ab5
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

Dostawca Tencent Cloud zapewnia dostęp do modeli Tencent Hy przez punkt końcowy TokenHub
(`tencent-tokenhub`).

Dostawca używa API zgodnego z OpenAI.

## Szybki start

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Przykład nieinteraktywny

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Dostawcy i punkty końcowe

| Dostawca           | Punkt końcowy                 | Zastosowanie            |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy przez Tencent TokenHub |

## Dostępne modele

### tencent-tokenhub

- **hy3-preview** — Wersja zapoznawcza Hy3 (kontekst 256K, uzasadnianie, domyślny)

## Uwagi

- Odwołania do modeli TokenHub używają formatu `tencent-tokenhub/<modelId>`.
- W razie potrzeby nadpisz metadane cenowe i kontekstowe w `models.providers`.

## Uwaga dotycząca środowiska

Jeśli Gateway działa jako demon (launchd/systemd), upewnij się, że `TOKENHUB_API_KEY`
jest dostępny dla tego procesu (na przykład w `~/.openclaw/.env` albo przez
`env.shellEnv`).

## Powiązana dokumentacja

- [Konfiguracja OpenClaw](/pl/gateway/configuration)
- [Dostawcy modeli](/pl/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
