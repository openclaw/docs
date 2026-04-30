---
read_when:
    - Você quer servir modelos a partir da sua própria máquina com GPU
    - Você está configurando o LM Studio ou um proxy compatível com OpenAI
    - Você precisa das orientações mais seguras para modelos locais
summary: Execute o OpenClaw em LLMs locais (LM Studio, vLLM, LiteLLM, endpoints OpenAI personalizados)
title: Modelos locais
x-i18n:
    generated_at: "2026-04-30T09:49:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Rodar localmente é possível, mas o OpenClaw espera contexto grande + defesas fortes contra injeção de prompt. Placas pequenas truncam o contexto e comprometem a segurança. Mire alto: **≥2 Mac Studios no máximo ou rig de GPU equivalente (~US$ 30 mil+)**. Uma única GPU de **24 GB** funciona apenas para prompts mais leves com latência maior. Use a **maior variante de modelo / variante full-size que você conseguir executar**; checkpoints agressivamente quantizados ou “pequenos” aumentam o risco de injeção de prompt (veja [Segurança](/pt-BR/gateway/security)).

Se quiser a configuração local com menos atrito, comece com [LM Studio](/pt-BR/providers/lmstudio) ou [Ollama](/pt-BR/providers/ollama) e `openclaw onboard`. Esta página é o guia opinativo para stacks locais de ponta e servidores locais personalizados compatíveis com OpenAI.

<Warning>
**Usuários de WSL2 + Ollama + NVIDIA/CUDA:** O instalador oficial do Ollama para Linux habilita um serviço systemd com `Restart=always`. Em configurações de GPU no WSL2, a inicialização automática pode recarregar o último modelo durante o boot e fixar memória do host. Se sua VM WSL2 reinicia repetidamente depois de habilitar o Ollama, veja [loop de falha do WSL2](/pt-BR/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Recomendado: LM Studio + modelo local grande (Responses API)

Melhor stack local atual. Carregue um modelo grande no LM Studio (por exemplo, uma build full-size do Qwen, DeepSeek ou Llama), habilite o servidor local (padrão `http://127.0.0.1:1234`) e use a Responses API para manter o raciocínio separado do texto final.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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

**Checklist de configuração**

- Instale o LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- No LM Studio, baixe a **maior build de modelo disponível** (evite variantes “pequenas”/fortemente quantizadas), inicie o servidor e confirme que `http://127.0.0.1:1234/v1/models` a lista.
- Substitua `my-local-model` pelo ID real do modelo mostrado no LM Studio.
- Mantenha o modelo carregado; carregamento a frio adiciona latência de inicialização.
- Ajuste `contextWindow`/`maxTokens` se sua build do LM Studio for diferente.
- Para WhatsApp, mantenha a Responses API para que apenas o texto final seja enviado.

Mantenha modelos hospedados configurados mesmo ao rodar localmente; use `models.mode: "merge"` para que fallbacks continuem disponíveis.

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

Inverta a ordem do primário e dos fallbacks; mantenha o mesmo bloco de providers e `models.mode: "merge"` para poder fazer fallback para Sonnet ou Opus quando a máquina local estiver indisponível.

### Hospedagem regional / roteamento de dados

- Variantes hospedadas de MiniMax/Kimi/GLM também existem no OpenRouter com endpoints fixados por região (por exemplo, hospedados nos EUA). Escolha a variante regional lá para manter o tráfego na jurisdição escolhida enquanto ainda usa `models.mode: "merge"` para fallbacks da Anthropic/OpenAI.
- Somente local continua sendo o caminho mais forte para privacidade; roteamento regional hospedado é o meio-termo quando você precisa de recursos do provider, mas quer controle sobre o fluxo de dados.

## Outros proxies locais compatíveis com OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy ou gateways
personalizados funcionam se expuserem um endpoint `/v1/chat/completions`
no estilo OpenAI. Use o adaptador Chat Completions, a menos que o backend documente explicitamente
suporte a `/v1/responses`. Substitua o bloco de provider acima pelo seu
endpoint e ID de modelo:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
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

Se `api` for omitido em um provider personalizado com `baseUrl`, o OpenClaw usa
`openai-completions` por padrão. Endpoints de loopback como `127.0.0.1` são confiáveis
automaticamente; endpoints de LAN, tailnet e DNS privado ainda precisam de
`request.allowPrivateNetwork: true`.

O valor `models.providers.<id>.models[].id` é local ao provider. Não
inclua o prefixo do provider ali. Por exemplo, um servidor MLX iniciado com
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` deve usar este
ID de catálogo e referência de modelo:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Defina `input: ["text", "image"]` em modelos locais ou de visão por proxy para que anexos de imagem
sejam injetados nos turnos do agente. O onboarding interativo de provider personalizado
infere IDs comuns de modelos de visão e pergunta apenas sobre nomes desconhecidos.
O onboarding não interativo usa a mesma inferência; use `--custom-image-input`
para IDs de visão desconhecidos ou `--custom-text-input` quando um modelo que parece conhecido for
somente texto por trás do seu endpoint.

Mantenha `models.mode: "merge"` para que modelos hospedados continuem disponíveis como fallbacks.
Use `models.providers.<id>.timeoutSeconds` para servidores de modelos locais ou remotos lentos
antes de aumentar `agents.defaults.timeoutSeconds`. O timeout do provider
se aplica apenas a requisições HTTP de modelo, incluindo conexão, headers, streaming do corpo
e o abort total do guarded-fetch.

<Note>
Para providers personalizados compatíveis com OpenAI, persistir um marcador local não secreto como `apiKey: "ollama-local"` é aceito quando `baseUrl` resolve para loopback, uma LAN privada, `.local` ou um hostname simples. O OpenClaw o trata como uma credencial local válida em vez de relatar uma chave ausente. Use um valor real para qualquer provider que aceite um hostname público.
</Note>

Nota de comportamento para backends `/v1` locais/por proxy:

- O OpenClaw os trata como rotas compatíveis com OpenAI em estilo proxy, não como endpoints
  nativos da OpenAI
- a formatação de requisição exclusiva da OpenAI nativa não se aplica aqui: sem
  `service_tier`, sem Responses `store`, sem formatação de payload compatível com raciocínio da OpenAI
  e sem dicas de cache de prompt
- headers ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados nessas URLs de proxy personalizado

Notas de compatibilidade para backends compatíveis com OpenAI mais rigorosos:

- Alguns servidores aceitam apenas `messages[].content` como string em Chat Completions, não
  arrays estruturados de partes de conteúdo. Defina
  `models.providers.<provider>.models[].compat.requiresStringContent: true` para
  esses endpoints.
- Alguns modelos locais emitem solicitações de ferramenta entre colchetes independentes como texto, como
  `[tool_name]` seguido de JSON e `[END_TOOL_REQUEST]`. O OpenClaw promove
  isso para chamadas de ferramenta reais apenas quando o nome corresponde exatamente a uma ferramenta registrada
  para o turno; caso contrário, o bloco é tratado como texto não suportado e fica
  oculto das respostas visíveis ao usuário.
- Se um modelo emitir JSON, XML ou texto no estilo ReAct que parece uma chamada de ferramenta
  mas o provider não emitir uma invocação estruturada, o OpenClaw o deixa como
  texto e registra um aviso com o ID da execução, provider/modelo, padrão detectado e
  nome da ferramenta quando disponível. Trate isso como incompatibilidade de chamada de ferramenta
  do provider/modelo, não como uma execução de ferramenta concluída.
- Se ferramentas aparecerem como texto do assistente em vez de serem executadas, por exemplo JSON bruto,
  XML, sintaxe ReAct ou um array `tool_calls` vazio na resposta do provider,
  primeiro verifique se o servidor está usando um template/parser de chat compatível com chamadas de ferramenta. Para
  backends Chat Completions compatíveis com OpenAI cujo parser funciona apenas quando o uso de ferramenta
  é forçado, defina uma substituição de requisição por modelo em vez de depender de parsing
  de texto:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  Use isto apenas para modelos/sessões em que todo turno normal deve chamar uma ferramenta.
  Isso substitui o valor padrão de proxy do OpenClaw de `tool_choice: "auto"`.
  Substitua `local/my-local-model` pela referência exata de provider/modelo mostrada por
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Se um modelo personalizado compatível com OpenAI aceitar esforços de raciocínio da OpenAI além
  do perfil integrado, declare-os no bloco de compatibilidade do modelo. Adicionar `"xhigh"`
  aqui faz `/think xhigh`, seletores de sessão, validação do Gateway e validação de `llm-task`
  exporem o nível para essa referência de provider/modelo configurada:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- Alguns backends locais menores ou mais rigorosos são instáveis com o formato completo
  de prompt do agent-runtime do OpenClaw, especialmente quando schemas de ferramentas são incluídos. Primeiro
  verifique o caminho do provider com a sonda local enxuta:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Para verificar a rota do Gateway sem o formato completo de prompt do agente, use a
  sonda de modelo do Gateway:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  As sondas de modelo local e do Gateway enviam apenas o prompt fornecido. A
  sonda do Gateway ainda valida roteamento do Gateway, autenticação e seleção de provider,
  mas ignora intencionalmente transcrição de sessão anterior, contexto AGENTS/bootstrap,
  montagem do mecanismo de contexto, ferramentas e servidores MCP empacotados.

  Se isso for bem-sucedido, mas as rodadas normais do agente OpenClaw falharem, primeiro tente
  `agents.defaults.experimental.localModelLean: true` para remover ferramentas
  padrão pesadas como `browser`, `cron` e `message`; esta é uma flag experimental,
  não uma configuração estável de modo padrão. Consulte
  [Recursos Experimentais](/pt-BR/concepts/experimental-features). Se ainda assim falhar, tente
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Se o back-end ainda falhar apenas em execuções maiores do OpenClaw, o problema restante
  geralmente é capacidade do modelo/servidor upstream ou um bug do back-end, não a
  camada de transporte do OpenClaw.

## Solução de Problemas

- O Gateway consegue alcançar o proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modelo do LM Studio descarregado? Recarregue; a inicialização a frio é uma causa comum de “travamento”.
- O servidor local diz `terminated`, `ECONNRESET` ou fecha o stream no meio da rodada?
  O OpenClaw registra um `model.call.error.failureKind` de baixa cardinalidade, além do
  instantâneo de RSS/heap do processo OpenClaw nos diagnósticos. Para pressão de memória
  no LM Studio/Ollama, compare esse carimbo de data/hora com o log do servidor ou com o log de crash /
  jetsam do macOS para confirmar se o servidor do modelo foi encerrado.
- O OpenClaw deriva os limites de preflight da janela de contexto a partir da janela detectada do modelo, ou da janela sem limite do modelo quando `agents.defaults.contextTokens` reduz a janela efetiva. Ele alerta abaixo de 20% com um piso de **8k**. Bloqueios rígidos usam o limite de 10% com um piso de **4k**, limitado à janela de contexto efetiva para que metadados de modelo superdimensionados não rejeitem um limite de usuário que, de outra forma, seria válido. Se você encontrar esse preflight, aumente o limite de contexto do servidor/modelo ou escolha um modelo maior.
- Erros de contexto? Reduza `contextWindow` ou aumente o limite do seu servidor.
- Servidor compatível com OpenAI retorna `messages[].content ... expected a string`?
  Adicione `compat.requiresStringContent: true` nessa entrada de modelo.
- Chamadas diretas pequenas para `/v1/chat/completions` funcionam, mas `openclaw infer model run --local`
  falha no Gemma ou em outro modelo local? Verifique primeiro a URL do provedor, a referência do modelo, o marcador de autenticação
  e os logs do servidor; `model run` local não inclui ferramentas de agente.
  Se `model run` local for bem-sucedido, mas rodadas maiores do agente falharem, reduza a superfície de ferramentas do agente
  com `localModelLean` ou `compat.supportsTools: false`.
- Chamadas de ferramenta aparecem como texto JSON/XML/ReAct bruto, ou o provedor retorna um
  array `tool_calls` vazio? Não adicione um proxy que converta cegamente texto do assistente
  em execução de ferramentas. Corrija primeiro o template/parser de chat do servidor. Se o
  modelo só funcionar quando o uso de ferramentas for forçado, adicione a substituição por modelo
  `params.extra_body.tool_choice: "required"` acima e use essa entrada de modelo
  apenas em sessões em que uma chamada de ferramenta seja esperada a cada rodada.
- Segurança: modelos locais pulam filtros do lado do provedor; mantenha agentes restritos e a compaction ativada para limitar o raio de impacto de injeção de prompt.

## Relacionado

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Failover de modelo](/pt-BR/concepts/model-failover)
