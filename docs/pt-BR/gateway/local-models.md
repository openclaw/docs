---
read_when:
    - Você quer servir modelos a partir da sua própria máquina com GPU
    - Você está configurando o LM Studio ou um proxy compatível com OpenAI
    - Você precisa da orientação mais segura para modelos locais
summary: Execute o OpenClaw em LLMs locais (LM Studio, vLLM, LiteLLM, endpoints OpenAI personalizados)
title: Modelos locais
x-i18n:
    generated_at: "2026-04-08T02:14:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: d619d72b0e06914ebacb7e9f38b746caf1b9ce8908c9c6638c3acdddbaa025e8
    source_path: gateway/local-models.md
    workflow: 15
---

# Modelos locais

Executar localmente é viável, mas o OpenClaw espera contexto grande + defesas fortes contra injeção de prompt. Placas pequenas truncam o contexto e enfraquecem a segurança. Mire alto: **≥2 Mac Studios no máximo ou rig de GPU equivalente (~US$30 mil+)**. Uma única GPU de **24 GB** funciona apenas para prompts mais leves, com maior latência. Use a **maior variante / variante completa do modelo que você conseguir executar**; checkpoints agressivamente quantizados ou “pequenos” aumentam o risco de injeção de prompt (consulte [Security](/pt-BR/gateway/security)).

Se você quiser a configuração local com menos atrito, comece com [Ollama](/pt-BR/providers/ollama) e `openclaw onboard`. Esta página é o guia opinativo para stacks locais mais avançadas e servidores locais personalizados compatíveis com OpenAI.

## Recomendado: LM Studio + modelo local grande (API Responses)

A melhor stack local atual. Carregue um modelo grande no LM Studio (por exemplo, uma build completa de Qwen, DeepSeek ou Llama), habilite o servidor local (padrão `http://127.0.0.1:1234`) e use a API Responses para manter o raciocínio separado do texto final.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Checklist de configuração**

- Instale o LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- No LM Studio, baixe a **maior build de modelo disponível** (evite variantes “small”/fortemente quantizadas), inicie o servidor e confirme que `http://127.0.0.1:1234/v1/models` a lista.
- Substitua `my-local-model` pelo ID real do modelo mostrado no LM Studio.
- Mantenha o modelo carregado; carregamento a frio adiciona latência de inicialização.
- Ajuste `contextWindow`/`maxTokens` se a sua build do LM Studio for diferente.
- Para o WhatsApp, use a API Responses para que apenas o texto final seja enviado.

Mantenha modelos hospedados configurados mesmo ao executar localmente; use `models.mode: "merge"` para que os fallbacks continuem disponíveis.

### Configuração híbrida: primário hospedado, fallback local

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Local primeiro com rede de segurança hospedada

Inverta a ordem do primário e dos fallbacks; mantenha o mesmo bloco `providers` e `models.mode: "merge"` para poder recorrer ao Sonnet ou ao Opus quando a máquina local estiver indisponível.

### Hospedagem regional / roteamento de dados

- Variantes hospedadas de MiniMax/Kimi/GLM também existem no OpenRouter com endpoints fixados por região (por exemplo, hospedados nos EUA). Escolha ali a variante regional para manter o tráfego na jurisdição desejada, ainda usando `models.mode: "merge"` para fallbacks de Anthropic/OpenAI.
- Local-only continua sendo o caminho mais forte em privacidade; o roteamento regional hospedado é o meio-termo quando você precisa de recursos do provider, mas quer controle sobre o fluxo de dados.

## Outros proxies locais compatíveis com OpenAI

vLLM, LiteLLM, OAI-proxy ou gateways personalizados funcionam se expuserem um endpoint `/v1` no estilo OpenAI. Substitua o bloco do provider acima pelo seu endpoint e ID de modelo:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Mantenha `models.mode: "merge"` para que os modelos hospedados continuem disponíveis como fallbacks.

Observação de comportamento para backends `/v1` locais/com proxy:

- O OpenClaw trata esses backends como rotas compatíveis com OpenAI no estilo proxy, não como endpoints OpenAI nativos
- a formatação de requisição exclusiva do OpenAI nativo não se aplica aqui: sem
  `service_tier`, sem `store` do Responses, sem formatação de payload de
  compatibilidade de raciocínio do OpenAI e sem dicas de cache de prompt
- cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados nessas URLs de proxy personalizadas

Observações de compatibilidade para backends compatíveis com OpenAI mais restritos:

- Alguns servidores aceitam apenas `messages[].content` em formato string no Chat Completions, e não
  arrays estruturados de partes de conteúdo. Defina
  `models.providers.<provider>.models[].compat.requiresStringContent: true` para
  esses endpoints.
- Alguns backends locais menores ou mais restritos são instáveis com o formato completo de prompt
  do runtime de agente do OpenClaw, especialmente quando esquemas de ferramentas são incluídos. Se o
  backend funciona para chamadas diretas pequenas em `/v1/chat/completions`, mas falha em turnos normais
  de agente do OpenClaw, tente primeiro
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Se o backend ainda falhar apenas em execuções maiores do OpenClaw, o problema restante
  normalmente está na capacidade do modelo/servidor upstream ou em um bug do backend, e não na camada
  de transporte do OpenClaw.

## Solução de problemas

- O gateway consegue alcançar o proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modelo descarregado no LM Studio? Recarregue; inicialização a frio é uma causa comum de “travamento”.
- Erros de contexto? Reduza `contextWindow` ou aumente o limite do seu servidor.
- O servidor compatível com OpenAI retorna `messages[].content ... expected a string`?
  Adicione `compat.requiresStringContent: true` nessa entrada de modelo.
- Chamadas diretas pequenas em `/v1/chat/completions` funcionam, mas `openclaw infer model run`
  falha no Gemma ou em outro modelo local? Primeiro desative esquemas de ferramentas com
  `compat.supportsTools: false` e teste novamente. Se o servidor ainda falhar apenas
  em prompts maiores do OpenClaw, trate isso como uma limitação do modelo/servidor upstream.
- Segurança: modelos locais ignoram filtros do provider; mantenha os agentes estreitos e a compactação ativada para limitar o raio de impacto de injeção de prompt.
