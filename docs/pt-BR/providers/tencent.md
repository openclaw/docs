---
read_when:
    - Você quer usar modelos Hy da Tencent com o OpenClaw
    - Você precisa da configuração da chave de API do TokenHub
summary: Configuração do Tencent Cloud TokenHub
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-04-23T14:06:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90fce0d5957b261439cacd2b4df2362ed69511cb047af6a76ccaf54004806041
    source_path: providers/tencent.md
    workflow: 15
---

# Tencent Cloud (TokenHub)

O Tencent Cloud é fornecido como um **Plugin de provider integrado** no OpenClaw. Ele oferece acesso a modelos Hy via o endpoint TokenHub (`tencent-tokenhub`).

O provider usa uma API compatível com OpenAI.

## Início rápido

```bash
openclaw onboard --auth-choice tokenhub-api-key
```

## Exemplo não interativo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Providers e endpoints

| Provider           | Endpoint                      | Caso de uso             |
| ------------------ | ----------------------------- | ----------------------- |
| `tencent-tokenhub` | `tokenhub.tencentmaas.com/v1` | Hy via Tencent TokenHub |

## Modelos disponíveis

### tencent-tokenhub

- **hy3-preview** — Prévia do Hy3 (contexto de 256K, raciocínio, padrão)

## Observações

- Refs de modelo do TokenHub usam `tencent-tokenhub/<modelId>`.
- O Plugin já inclui metadados integrados de preços em tiers do Hy3, então as estimativas de custo são preenchidas sem substituições manuais de preço.
- Substitua metadados de preço e contexto em `models.providers`, se necessário.

## Observação sobre ambiente

Se o Gateway for executado como daemon (launchd/systemd), garanta que `TOKENHUB_API_KEY`
esteja disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
`env.shellEnv`).

## Documentação relacionada

- [Configuração do OpenClaw](/pt-BR/gateway/configuration)
- [Providers de modelo](/pt-BR/concepts/model-providers)
- [Tencent TokenHub](https://cloud.tencent.com/document/product/1823/130050)
