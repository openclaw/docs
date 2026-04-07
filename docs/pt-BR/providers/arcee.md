---
read_when:
    - Você quer usar Arcee AI com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Arcee AI (autenticação + seleção de modelo)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-07T05:30:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb04909a708fec08dd2c8c863501b178f098bc4818eaebad38aea264157969d8
    source_path: providers/arcee.md
    workflow: 15
---

# Arcee AI

[Arcee AI](https://arcee.ai) fornece acesso à família Trinity de modelos mixture-of-experts por meio de uma API compatível com OpenAI. Todos os modelos Trinity são licenciados sob Apache 2.0.

Os modelos do Arcee AI podem ser acessados diretamente pela plataforma Arcee ou por meio do [OpenRouter](/pt-BR/providers/openrouter).

- Provider: `arcee`
- Auth: `ARCEEAI_API_KEY` (direto) ou `OPENROUTER_API_KEY` (via OpenRouter)
- API: compatível com OpenAI
- URL base: `https://api.arcee.ai/api/v1` (direto) ou `https://openrouter.ai/api/v1` (OpenRouter)

## Início rápido

1. Obtenha uma chave de API em [Arcee AI](https://chat.arcee.ai/) ou [OpenRouter](https://openrouter.ai/keys).

2. Defina a chave de API (recomendado: armazene-a para o Gateway):

```bash
# Direto (plataforma Arcee)
openclaw onboard --auth-choice arceeai-api-key

# Via OpenRouter
openclaw onboard --auth-choice arceeai-openrouter
```

3. Defina um modelo padrão:

```json5
{
  agents: {
    defaults: {
      model: { primary: "arcee/trinity-large-thinking" },
    },
  },
}
```

## Exemplo não interativo

```bash
# Direto (plataforma Arcee)
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-api-key \
  --arceeai-api-key "$ARCEEAI_API_KEY"

# Via OpenRouter
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice arceeai-openrouter \
  --openrouter-api-key "$OPENROUTER_API_KEY"
```

## Observação sobre ambiente

Se o Gateway estiver em execução como daemon (launchd/systemd), certifique-se de que `ARCEEAI_API_KEY`
(ou `OPENROUTER_API_KEY`) esteja disponível para esse processo (por exemplo, em
`~/.openclaw/.env` ou via `env.shellEnv`).

## Catálogo integrado

Atualmente, o OpenClaw inclui este catálogo Arcee empacotado:

| Model ref                      | Name                   | Input | Context | Cost (in/out per 1M) | Notes                                     |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | Modelo padrão; raciocínio ativado         |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | Uso geral; 400B params, 13B ativos        |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | Rápido e econômico; function calling      |

As mesmas referências de modelo funcionam tanto para configurações diretas quanto via OpenRouter (por exemplo, `arcee/trinity-large-thinking`).

A predefinição de onboarding define `arcee/trinity-large-thinking` como o modelo padrão.

## Recursos compatíveis

- Streaming
- Uso de ferramentas / function calling
- Saída estruturada (modo JSON e schema JSON)
- Pensamento estendido (Trinity Large Thinking)
