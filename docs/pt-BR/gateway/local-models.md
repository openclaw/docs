---
read_when:
    - Você quer servir modelos a partir da sua própria máquina com GPU
    - Você está configurando o LM Studio ou um proxy compatível com OpenAI
    - Você precisa da orientação mais segura sobre modelos locais
summary: Execute o OpenClaw em LLMs locais (LM Studio, vLLM, LiteLLM, endpoints OpenAI personalizados)
title: Modelos locais
x-i18n:
    generated_at: "2026-05-02T22:19:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

Modelos locais são viáveis. Eles também elevam o patamar de hardware, tamanho de contexto e defesa contra injeção de prompt — placas pequenas ou quantizadas agressivamente truncam o contexto e vazam segurança. Esta página é o guia opinativo para stacks locais de ponta e servidores locais personalizados compatíveis com OpenAI. Para onboarding com menos atrito, comece com [LM Studio](/pt-BR/providers/lmstudio) ou [Ollama](/pt-BR/providers/ollama) e `openclaw onboard`.

## Piso de hardware

Mire alto: **≥2 Mac Studios no máximo ou um rig de GPU equivalente (~US$30 mil+)** para um loop de agente confortável. Uma única GPU de **24 GB** funciona apenas para prompts mais leves com maior latência. Sempre execute a **maior variante / variante de tamanho completo que você conseguir hospedar**; checkpoints pequenos ou fortemente quantizados aumentam o risco de injeção de prompt (veja [Segurança](/pt-BR/gateway/security)).

## Escolha um backend

| Backend                                              | Use quando                                                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/pt-BR/providers/lmstudio)                     | Configuração local inicial, carregador GUI, Responses API nativa            |
| [Ollama](/pt-BR/providers/ollama)                          | Fluxo de trabalho CLI, biblioteca de modelos, serviço systemd sem intervenção |
| MLX / vLLM / SGLang                                  | Serviço auto-hospedado de alta vazão com um endpoint HTTP compatível com OpenAI |
| LiteLLM / OAI-proxy / proxy personalizado compatível com OpenAI | Você expõe outra API de modelo e precisa que o OpenClaw a trate como OpenAI |

Use Responses API (`api: "openai-responses"`) quando o backend oferecer suporte a ela (LM Studio oferece). Caso contrário, use Chat Completions (`api: "openai-completions"`).

<Warning>
**Usuários de WSL2 + Ollama + NVIDIA/CUDA:** O instalador oficial do Ollama para Linux habilita um serviço systemd com `Restart=always`. Em configurações de GPU no WSL2, a inicialização automática pode recarregar o último modelo durante o boot e prender memória do host. Se sua VM WSL2 reiniciar repetidamente depois de habilitar o Ollama, veja [loop de falhas do WSL2](/pt-BR/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Recomendado: LM Studio + modelo local grande (Responses API)

Melhor stack local atual. Carregue um modelo grande no LM Studio (por exemplo, uma build de tamanho completo do Qwen, DeepSeek ou Llama), habilite o servidor local (padrão `http://127.0.0.1:1234`) e use Responses API para manter o raciocínio separado do texto final.

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
- No LM Studio, baixe a **maior build de modelo disponível** (evite variantes “small”/fortemente quantizadas), inicie o servidor e confirme que `http://127.0.0.1:1234/v1/models` a lista.
- Substitua `my-local-model` pelo ID de modelo real exibido no LM Studio.
- Mantenha o modelo carregado; carregamento a frio adiciona latência de inicialização.
- Ajuste `contextWindow`/`maxTokens` se sua build do LM Studio for diferente.
- Para WhatsApp, mantenha Responses API para que apenas o texto final seja enviado.

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

Troque a ordem de primário e fallback; mantenha o mesmo bloco de providers e `models.mode: "merge"` para poder recorrer ao Sonnet ou Opus quando a máquina local estiver fora do ar.

### Hospedagem regional / roteamento de dados

- Variantes hospedadas do MiniMax/Kimi/GLM também existem no OpenRouter com endpoints fixados por região (por exemplo, hospedadas nos EUA). Escolha a variante regional ali para manter o tráfego na jurisdição escolhida enquanto ainda usa `models.mode: "merge"` para fallbacks Anthropic/OpenAI.
- Somente local continua sendo o caminho de privacidade mais forte; roteamento regional hospedado é o meio-termo quando você precisa de recursos do provider, mas quer controle sobre o fluxo de dados.

## Outros proxies locais compatíveis com OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy ou gateways
personalizados funcionam se expuserem um endpoint `/v1/chat/completions`
no estilo OpenAI. Use o adaptador Chat Completions, a menos que o backend
documente explicitamente suporte a `/v1/responses`. Substitua o bloco de provider
acima pelo seu endpoint e ID de modelo:

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

Defina `input: ["text", "image"]` em modelos locais ou de visão via proxy para que anexos
de imagem sejam injetados nos turnos do agente. O onboarding interativo de provider
personalizado infere IDs comuns de modelos de visão e pergunta apenas por nomes
desconhecidos. O onboarding não interativo usa a mesma inferência; use `--custom-image-input`
para IDs de visão desconhecidos ou `--custom-text-input` quando um modelo que parece
conhecido for somente texto por trás do seu endpoint.

Mantenha `models.mode: "merge"` para que modelos hospedados continuem disponíveis como fallbacks.
Use `models.providers.<id>.timeoutSeconds` para servidores de modelos locais ou remotos
lentos antes de aumentar `agents.defaults.timeoutSeconds`. O timeout do provider
se aplica apenas a requisições HTTP de modelo, incluindo conexão, cabeçalhos, streaming do corpo
e o abort total do fetch protegido.

<Note>
Para providers personalizados compatíveis com OpenAI, persistir um marcador local não secreto como `apiKey: "ollama-local"` é aceito quando `baseUrl` resolve para loopback, uma LAN privada, `.local` ou um hostname simples. O OpenClaw o trata como uma credencial local válida em vez de relatar uma chave ausente. Use um valor real para qualquer provider que aceite um hostname público.
</Note>

Nota de comportamento para backends locais/via proxy `/v1`:

- O OpenClaw trata estes como rotas compatíveis com OpenAI em estilo proxy, não como endpoints
  nativos da OpenAI
- a formatação de requisição exclusiva da OpenAI nativa não se aplica aqui: sem
  `service_tier`, sem `store` de Responses, sem formatação de payload de compatibilidade de raciocínio
  da OpenAI e sem dicas de cache de prompt
- cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`)
  não são injetados nesses URLs de proxy personalizados

Notas de compatibilidade para backends compatíveis com OpenAI mais estritos:

- Alguns servidores aceitam apenas `messages[].content` em string no Chat Completions, não
  arrays estruturados de partes de conteúdo. Defina
  `models.providers.<provider>.models[].compat.requiresStringContent: true` para
  esses endpoints.
- Alguns modelos locais emitem solicitações de ferramenta independentes entre colchetes como texto, como
  `[tool_name]` seguido por JSON e `[END_TOOL_REQUEST]`. O OpenClaw promove
  isso para chamadas reais de ferramenta apenas quando o nome corresponde exatamente a uma ferramenta registrada
  para o turno; caso contrário, o bloco é tratado como texto sem suporte e fica
  oculto das respostas visíveis ao usuário.
- Se um modelo emitir JSON, XML ou texto em estilo ReAct que pareça uma chamada de ferramenta,
  mas o provider não emitir uma invocação estruturada, o OpenClaw o deixa como
  texto e registra um aviso com o ID da execução, provider/modelo, padrão detectado e
  nome da ferramenta quando disponível. Trate isso como incompatibilidade de chamada de ferramenta do
  provider/modelo, não como uma execução de ferramenta concluída.
- Se ferramentas aparecerem como texto do assistente em vez de serem executadas, por exemplo JSON bruto,
  XML, sintaxe ReAct ou um array `tool_calls` vazio na resposta do provider,
  primeiro verifique se o servidor está usando um template/parser de chat compatível com chamadas de ferramenta. Para
  backends Chat Completions compatíveis com OpenAI cujo parser funciona apenas quando o uso de ferramentas
  é forçado, defina uma substituição de requisição por modelo em vez de depender de parsing de texto:

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
  Isso substitui o valor proxy padrão do OpenClaw de `tool_choice: "auto"`.
  Substitua `local/my-local-model` pela referência exata de provider/modelo exibida por
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Se um modelo personalizado compatível com OpenAI aceitar esforços de raciocínio da OpenAI além
  do perfil integrado, declare-os no bloco de compatibilidade do modelo. Adicionar `"xhigh"`
  aqui faz com que `/think xhigh`, seletores de sessão, validação do Gateway e validação de `llm-task`
  exponham o nível para essa referência de provider/modelo configurada:

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

## Backends menores ou mais estritos

Se o modelo carregar sem problemas, mas turnos completos de agente se comportarem mal, trabalhe de cima para baixo — confirme primeiro o transporte e depois restrinja a superfície.

1. **Confirme que o próprio modelo local responde.** Sem ferramentas, sem contexto de agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Confirme o roteamento do Gateway.** Envia apenas o prompt fornecido — ignora transcrição, inicialização do AGENTS, montagem do context-engine, ferramentas e servidores MCP incluídos, mas ainda exercita o roteamento do Gateway, autenticação e seleção de provedor:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Experimente o modo enxuto.** Se ambas as sondagens passarem, mas turnos reais de agente falharem com chamadas de ferramenta malformadas ou prompts grandes demais, habilite `agents.defaults.experimental.localModelLean: true`. Ele remove as três ferramentas padrão mais pesadas (`browser`, `cron`, `message`), para que o formato do prompt fique menor e menos frágil. Consulte [Recursos experimentais → modo enxuto para modelo local](/pt-BR/concepts/experimental-features#local-model-lean-mode) para ver a explicação completa, quando usá-lo e como confirmar que ele está ativado.

4. **Desabilite totalmente as ferramentas como último recurso.** Se o modo enxuto não for suficiente, defina `models.providers.<provider>.models[].compat.supportsTools: false` para essa entrada de modelo. O agente então operará sem chamadas de ferramenta nesse modelo.

5. **Depois disso, o gargalo está upstream.** Se o backend ainda falhar apenas em execuções maiores do OpenClaw depois do modo enxuto e de `supportsTools: false`, o problema restante geralmente é capacidade do modelo ou servidor upstream — janela de contexto, memória de GPU, despejo de kv-cache ou bug no backend. Nesse ponto, não é a camada de transporte do OpenClaw.

## Solução de problemas

- O Gateway consegue alcançar o proxy? `curl http://127.0.0.1:1234/v1/models`.
- Modelo do LM Studio descarregado? Recarregue; inicialização fria é uma causa comum de “travamento”.
- O servidor local informa `terminated`, `ECONNRESET` ou fecha o stream no meio do turno?
  O OpenClaw registra um `model.call.error.failureKind` de baixa cardinalidade mais o snapshot de RSS/heap do processo do OpenClaw nos diagnósticos. Para pressão de memória no LM Studio/Ollama, compare esse timestamp com o log do servidor ou o log de crash / jetsam do macOS para confirmar se o servidor de modelo foi encerrado.
- O OpenClaw deriva limites de pré-verificação da janela de contexto a partir da janela detectada do modelo, ou da janela sem limite do modelo quando `agents.defaults.contextTokens` reduz a janela efetiva. Ele avisa abaixo de 20% com piso de **8k**. Bloqueios rígidos usam o limite de 10% com piso de **4k**, limitado à janela de contexto efetiva para que metadados de modelo grandes demais não rejeitem um limite de usuário que seria válido. Se você encontrar essa pré-verificação, aumente o limite de contexto do servidor/modelo ou escolha um modelo maior.
- Erros de contexto? Reduza `contextWindow` ou aumente o limite do seu servidor.
- Servidor compatível com OpenAI retorna `messages[].content ... expected a string`?
  Adicione `compat.requiresStringContent: true` nessa entrada de modelo.
- Chamadas diretas pequenas para `/v1/chat/completions` funcionam, mas `openclaw infer model run --local`
  falha no Gemma ou em outro modelo local? Verifique primeiro a URL do provedor, a referência do modelo, o marcador de autenticação e os logs do servidor; `model run` local não inclui ferramentas de agente.
  Se `model run` local funcionar, mas turnos maiores de agente falharem, reduza a superfície de ferramentas do agente com `localModelLean` ou `compat.supportsTools: false`.
- Chamadas de ferramenta aparecem como texto JSON/XML/ReAct bruto, ou o provedor retorna um array `tool_calls` vazio? Não adicione um proxy que converte cegamente texto de assistente em execução de ferramenta. Corrija primeiro o template/parser de chat do servidor. Se o modelo só funcionar quando o uso de ferramenta for forçado, adicione a substituição por modelo `params.extra_body.tool_choice: "required"` acima e use essa entrada de modelo apenas para sessões em que uma chamada de ferramenta é esperada em cada turno.
- Segurança: modelos locais ignoram filtros do lado do provedor; mantenha os agentes restritos e a compaction ativada para limitar o raio de impacto de injeção de prompt.

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Failover de modelo](/pt-BR/concepts/model-failover)
