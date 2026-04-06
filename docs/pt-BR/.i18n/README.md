---
x-i18n:
    generated_at: "2026-04-06T03:05:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6e1cf417b0c04d001bc494fbe03ac2fcb66866f759e21646dbfd1a9c3a968bff
    source_path: .i18n/README.md
    workflow: 15
---

# Recursos de i18n da documentação do OpenClaw

Esta pasta armazena a configuração de tradução para o repositório fonte da documentação.

As páginas de localidade geradas e a memória de tradução ativa por localidade agora ficam no repositório de publicação (`openclaw/docs`, checkout local irmão `~/Projects/openclaw-docs`).

## Arquivos

- `glossary.<lang>.json` — mapeamentos de termos preferidos (usados nas orientações de prompt).
- `<lang>.tm.jsonl` — memória de tradução (cache) indexada por fluxo de trabalho + modelo + hash de texto. Neste repositório, os arquivos de MT por localidade são gerados sob demanda.

## Formato do glossário

`glossary.<lang>.json` é um array de entradas:

```json
{
  "source": "troubleshooting",
  "target": "故障排除",
  "ignore_case": true,
  "whole_word": false
}
```

Campos:

- `source`: frase em inglês (ou no idioma de origem) a ser priorizada.
- `target`: saída de tradução preferida.

## Observações

- As entradas do glossário são passadas ao modelo como **orientações de prompt** (sem reescritas determinísticas).
- `scripts/docs-i18n` continua responsável pela geração das traduções.
- O repositório fonte sincroniza a documentação em inglês com o repositório de publicação; a geração por localidade é executada lá, por localidade, em push, agendamento e despacho de release.
