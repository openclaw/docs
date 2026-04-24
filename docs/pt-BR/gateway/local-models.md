---
read_when:
    - Você quer servir modelos da sua própria máquina com GPU
    - Você está configurando LM Studio ou um proxy compatível com OpenAI
    - Você precisa da orientação mais segura para modelos locais
summary: Execute o OpenClaw em LLMs locais (LM Studio, vLLM, LiteLLM, endpoints OpenAI personalizados)
title: Modelos locais
x-i18n:
    generated_at: "2026-04-24T05:52:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

O uso local é viável, mas o OpenClaw espera contexto grande + defesas fortes contra prompt injection. Placas pequenas truncam contexto e enfraquecem a segurança. Mire alto: **≥2 Mac Studios no máximo ou um rig de GPU equivalente (~US$ 30 mil+)**. Uma única GPU de **24 GB** funciona apenas para prompts mais leves e com latência maior. Use a **maior / variante completa do modelo que conseguir executar**; checkpoints agressivamente quantizados ou “small” aumentam o risco de prompt injection (consulte [Segurança](/pt-BR/gateway/security)).

Se você quiser a configuração local com menos atrito, comece com [LM Studio](/pt-BR/providers/lmstudio) ou [Ollama](/pt-BR/providers/ollama) e `openclaw onboard`. Esta página é o guia opinativo para stacks locais mais avançados e servidores locais personalizados compatíveis com OpenAI.

## Recomendado: LM Studio + modelo local grande (Responses API)

A melhor stack local atual. Carregue um modelo grande no LM Studio (por exemplo, uma build completa de Qwen, DeepSeek ou Llama), habilite o servidor local (padrão `http://127.0.0.1:1234`) e use Responses API para manter o raciocínio separado do texto final.

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
- No LM Studio, baixe a **maior build de modelo disponível** (evite variantes “small”/fortemente quantizadas), inicie o servidor e confirme que `http://127.0.0.1:1234/v1/models` o lista.
- Substitua `my-local-model` pelo ID real do modelo mostrado no LM Studio.
- Mantenha o modelo carregado; carregamento a frio adiciona latência de inicialização.
- Ajuste `contextWindow`/`maxTokens` se sua build do LM Studio for diferente.
- Para o WhatsApp, mantenha Responses API para que apenas o texto final seja enviado.

Mantenha modelos hospedados configurados mesmo ao executar localmente; use `models.mode: "merge"` para que os fallbacks continuem disponíveis.

### Configuração híbrida: principal hospedado, fallback local

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

Troque a ordem de principal e fallback; mantenha o mesmo bloco de providers e `models.mode: "merge"` para poder recorrer a Sonnet ou Opus quando a máquina local estiver indisponível.

### Hospedagem regional / roteamento de dados

- Variantes hospedadas de MiniMax/Kimi/GLM também existem no OpenRouter com endpoints fixados por região (por exemplo, hospedados nos EUA). Escolha ali a variante regional para manter o tráfego na jurisdição desejada enquanto ainda usa `models.mode: "merge"` para fallbacks de Anthropic/OpenAI.
- Somente local continua sendo o caminho mais forte de privacidade; roteamento regional hospedado é o meio-termo quando você precisa de recursos do provider, mas quer controle sobre o fluxo de dados.

## Outros proxies locais compatíveis com OpenAI

vLLM, LiteLLM, OAI-proxy ou gateways personalizados funcionam se expuserem um endpoint `/v1` no estilo OpenAI. Substitua o bloco de provider acima pelo seu endpoint e ID de modelo:

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

Mantenha `models.mode: "merge"` para que modelos hospedados permaneçam disponíveis como fallbacks.

Observação de comportamento para backends locais/proxied `/v1`:

- O OpenClaw trata esses backends como rotas proxy compatíveis com OpenAI, não como
  endpoints OpenAI nativos
- a modelagem de requisição exclusiva da OpenAI nativa não se aplica aqui: sem
  `service_tier`, sem `store` de Responses, sem modelagem de payload de compatibilidade
  de raciocínio da OpenAI e sem dicas de cache de prompt
- headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados nessas URLs personalizadas de proxy

Observações de compatibilidade para backends compatíveis com OpenAI mais rígidos:

- Alguns servidores aceitam apenas `messages[].content` como string em Chat Completions, não
  arrays estruturados de partes de conteúdo. Defina
  `models.providers.<provider>.models[].compat.requiresStringContent: true` para
  esses endpoints.
- Alguns backends locais menores ou mais rígidos são instáveis com o formato completo
  de prompt do runtime de agente do OpenClaw, especialmente quando schemas de ferramentas estão incluídos. Se o
  backend funciona para chamadas pequenas diretas de `/v1/chat/completions`, mas falha em turnos
  normais de agente do OpenClaw, primeiro tente
  `agents.defaults.experimental.localModelLean: true` para remover ferramentas
  padrão pesadas como `browser`, `cron` e `message`; este é um
  sinalizador experimental, não uma configuração estável de modo padrão. Consulte
  [Recursos experimentais](/pt-BR/concepts/experimental-features). Se isso ainda falhar, tente
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Se o backend ainda falhar apenas em execuções maiores do OpenClaw, o problema restante
  geralmente é capacidade insuficiente do modelo/servidor upstream ou um bug do backend, não da
  camada de transporte do OpenClaw.

## Solução de problemas

- O gateway consegue alcançar o proxy? `curl http://127.0.0.1:1234/v1/models`.
- O modelo do LM Studio foi descarregado? Recarregue; inicialização a frio é uma causa comum de “travamento”.
- O OpenClaw avisa quando a janela de contexto detectada está abaixo de **32k** e bloqueia abaixo de **16k**. Se você atingir essa verificação prévia, aumente o limite de contexto do servidor/modelo ou escolha um modelo maior.
- Erros de contexto? Reduza `contextWindow` ou aumente o limite do seu servidor.
- O servidor compatível com OpenAI retorna `messages[].content ... expected a string`?
  Adicione `compat.requiresStringContent: true` nessa entrada de modelo.
- Chamadas pequenas diretas de `/v1/chat/completions` funcionam, mas `openclaw infer model run`
  falha com Gemma ou outro modelo local? Desabilite primeiro os schemas de ferramentas com
  `compat.supportsTools: false` e depois teste novamente. Se o servidor ainda cair apenas
  em prompts maiores do OpenClaw, trate isso como uma limitação do servidor/modelo upstream.
- Segurança: modelos locais ignoram filtros do lado do provider; mantenha agentes restritos e Compaction ativado para limitar o raio de impacto de prompt injection.

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Failover de modelo](/pt-BR/concepts/model-failover)
