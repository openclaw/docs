---
read_when:
    - Você quer disponibilizar modelos a partir da sua própria máquina com GPU
    - Você está configurando o LM Studio ou um proxy compatível com a OpenAI
    - Você precisa de orientações sobre o modelo local mais seguro
summary: Execute o OpenClaw em LLMs locais (LM Studio, vLLM, LiteLLM, endpoints personalizados da OpenAI)
title: Modelos locais
x-i18n:
    generated_at: "2026-07-12T15:15:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 386d46af219a368e2ae5089a72cda4bc735c7d6a5f66aec3c314f71b63a860ec
    source_path: gateway/local-models.md
    workflow: 16
---

Modelos locais funcionam, mas aumentam as exigências de hardware, tamanho de contexto e defesa contra injeção de prompt: modelos pequenos ou quantizados de forma agressiva truncam o contexto e ignoram filtros de segurança do provedor. Esta página aborda stacks locais de alto desempenho e servidores personalizados compatíveis com OpenAI. Para o caminho mais simples, comece com [LM Studio](/pt-BR/providers/lmstudio) ou [Ollama](/pt-BR/providers/ollama) e `openclaw onboard`.

Para servidores locais que devem iniciar somente quando um modelo selecionado precisar deles, consulte [Serviços de modelos locais](/pt-BR/gateway/local-model-services).

## Requisitos mínimos de hardware

Busque usar **2 ou mais Mac Studios com configuração máxima ou um equipamento com GPUs equivalente (~$30k+)** para um loop de agente confortável. Uma única GPU de **24 GB** processa apenas prompts mais leves e com maior latência. Sempre execute a **maior variante, em tamanho completo, que você conseguir hospedar** — checkpoints pequenos ou fortemente quantizados aumentam o risco de injeção de prompt (consulte [Segurança](/pt-BR/gateway/security)).

## Escolha um backend

| Backend                                              | Use quando                                                                                      |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [ds4](/pt-BR/providers/ds4)                                | DeepSeek V4 Flash local no Metal do macOS, com chamadas de ferramentas compatíveis com OpenAI   |
| [LM Studio](/pt-BR/providers/lmstudio)                     | Primeira configuração local, carregador com GUI, API Responses nativa                          |
| LiteLLM / OAI-proxy / proxy personalizado compatível com OpenAI | Você disponibiliza outra API de modelo e precisa que o OpenClaw a trate como OpenAI |
| MLX / vLLM / SGLang                                  | Serviço auto-hospedado de alto rendimento com um endpoint HTTP compatível com OpenAI            |
| [Ollama](/pt-BR/providers/ollama)                          | Fluxo de trabalho pela CLI, biblioteca de modelos, serviço systemd autônomo                     |

Use `api: "openai-responses"` quando o backend oferecer suporte (o LM Studio oferece). Caso contrário, use `api: "openai-completions"`. Se `api` for omitido em um provedor personalizado com um `baseUrl`, o OpenClaw usará `openai-completions` como padrão.

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA:** o instalador oficial do Ollama para Linux habilita um serviço systemd com `Restart=always`. Em configurações de GPU no WSL2, a inicialização automática pode recarregar o último modelo durante a inicialização e reter a memória do host, causando reinicializações repetidas da máquina virtual. Consulte [Loop de falhas no WSL2](/pt-BR/providers/ollama#troubleshooting).
</Warning>

## LM Studio + modelo local grande (API Responses)

Esta é a melhor stack local disponível atualmente. Carregue um modelo grande no LM Studio (uma compilação em tamanho completo do Qwen, DeepSeek ou Llama), habilite o servidor local (padrão: `http://127.0.0.1:1234`) e use a API Responses para manter o raciocínio separado do texto final.

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

Lista de verificação da configuração:

- Instale o LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- Baixe a **maior compilação de modelo disponível** (evite variantes "small"/fortemente quantizadas), inicie o servidor e confirme que `http://127.0.0.1:1234/v1/models` lista o modelo.
- Substitua `my-local-model` pelo ID real do modelo exibido no LM Studio.
- Mantenha o modelo carregado; o carregamento a frio aumenta a latência de inicialização.
- Ajuste `contextWindow`/`maxTokens` se a sua compilação do LM Studio for diferente.
- Para WhatsApp, mantenha a API Responses para que somente o texto final seja enviado.
- Mantenha `models.mode: "merge"` para que os modelos hospedados continuem disponíveis como alternativas.

### Configuração híbrida: hospedado como principal, local como alternativa

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

Para priorizar o modelo local com uma proteção hospedada, troque a ordem de `primary`/`fallbacks` e mantenha o mesmo bloco `providers` e `models.mode: "merge"`.

### Hospedagem regional / roteamento de dados

Variantes hospedadas do MiniMax/Kimi/GLM também estão disponíveis no OpenRouter com endpoints vinculados a regiões específicas (por exemplo, hospedados nos EUA). Escolha a variante regional para manter o tráfego na jurisdição selecionada, preservando `models.mode: "merge"` para alternativas da Anthropic/OpenAI. A execução totalmente local ainda é o caminho com maior privacidade; o roteamento regional hospedado é a opção intermediária quando você precisa dos recursos do provedor, mas quer controlar o fluxo de dados.

## Outros proxies locais compatíveis com OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy ou qualquer Gateway personalizado funciona se expuser um endpoint `/v1/chat/completions` no estilo OpenAI. Use `openai-completions`, a menos que o backend documente explicitamente o suporte a `/v1/responses`.

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

As entradas de provedores personalizados/locais confiam na origem exata configurada em `baseUrl` para solicitações de modelo protegidas, incluindo hosts de loopback, LAN, tailnet e DNS privado. Origens de metadados/link-local são sempre bloqueadas, independentemente da configuração. Solicitações para outras origens privadas ainda precisam de `models.providers.<id>.request.allowPrivateNetwork: true`; defina o sinalizador de confiança como `false` para desativar a confiança na origem exata.

`models.providers.<id>.models[].id` é local ao provedor — não inclua o prefixo do provedor. Para um servidor MLX iniciado com `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Defina `input: ["text", "image"]` em modelos de visão locais ou acessados por proxy para que os anexos de imagem sejam injetados nos turnos do agente. A integração interativa de provedores personalizados infere IDs comuns de modelos de visão e só pergunta sobre nomes desconhecidos; a integração não interativa usa a mesma inferência, com `--custom-image-input` / `--custom-text-input` para substituí-la.

Use `models.providers.<id>.timeoutSeconds` para servidores de modelos locais/remotos lentos antes de aumentar `agents.defaults.timeoutSeconds`. O tempo limite do provedor abrange conexão, cabeçalhos, streaming do corpo e a interrupção total da busca protegida somente para solicitações HTTP do modelo — se o tempo limite do agente/da execução for menor, aumente-o também, pois o tempo limite do provedor não pode prolongar toda a execução.

<Note>
Para provedores personalizados compatíveis com OpenAI, um marcador local não secreto, como `apiKey: "ollama-local"`, é aceito quando `baseUrl` é resolvido para loopback, uma LAN privada, `.local` ou um nome de host simples — o OpenClaw o trata como uma credencial local válida, em vez de informar a ausência de uma chave. Use um valor real para qualquer provedor que aceite um nome de host público.
</Note>

Observações de comportamento para backends `/v1` locais/acessados por proxy:

- O OpenClaw trata essas rotas como proxies compatíveis com OpenAI, não como endpoints nativos da OpenAI.
- A formatação de solicitações exclusiva da OpenAI nativa não se aplica: sem `service_tier`, sem `store` da API Responses, sem formatação de payload para compatibilidade de raciocínio da OpenAI, sem dicas de cache de prompt.
- Cabeçalhos ocultos de atribuição do OpenClaw (`originator`, `version`, `User-Agent`) não são injetados em URLs de proxy personalizadas.

Substituições de compatibilidade para backends compatíveis com OpenAI mais rigorosos:

- **Conteúdo somente em string**: alguns servidores aceitam apenas `messages[].content` como string, não arrays estruturados de partes de conteúdo. Defina `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- **Chaves de mensagem estritas**: se o servidor rejeitar entradas de mensagem com mais campos além de `role`/`content`, defina `compat.strictMessageKeys: true`.
- **Texto de ferramenta entre colchetes**: alguns modelos locais emitem solicitações de ferramenta independentes entre colchetes como texto, por exemplo, `[tool_name]` seguido de JSON e `[END_TOOL_REQUEST]`. O OpenClaw as converte em chamadas de ferramenta reais somente quando o nome corresponde exatamente a uma ferramenta registrada para o turno; caso contrário, o conteúdo permanece como texto oculto e não compatível.
- **Texto não estruturado semelhante a uma chamada de ferramenta**: se um modelo emitir texto no estilo JSON/XML/ReAct que pareça uma chamada de ferramenta, mas não seja uma invocação estruturada, o OpenClaw o mantém como texto e registra um aviso com o ID da execução, o provedor/modelo, o padrão detectado e o nome da ferramenta, quando disponível. Isso indica incompatibilidade do provedor/modelo, não uma execução de ferramenta concluída.
- **Forçar o uso de ferramentas**: se as ferramentas aparecerem como texto do assistente (JSON/XML/ReAct bruto ou um array `tool_calls` vazio), primeiro confirme se o modelo de chat/analisador do servidor oferece suporte a chamadas de ferramentas. Se o analisador funcionar somente quando o uso de ferramentas for forçado, substitua o valor padrão do proxy, `tool_choice: "auto"`, para cada modelo:

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

  Use isso somente quando todos os turnos normais precisarem chamar uma ferramenta. Substitua `local/my-local-model` pela referência exata de `openclaw models list` ou defina-a pela CLI:

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- **Níveis adicionais de esforço de raciocínio**: se um modelo personalizado compatível com OpenAI aceitar níveis de esforço de raciocínio da OpenAI além do perfil integrado, declare-os no bloco de compatibilidade do modelo. Adicionar `"xhigh"` o disponibiliza para a referência desse modelo em `/think xhigh`, seletores de sessão, validação do Gateway e validação de `llm-task`:

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

## Backends menores ou mais rigorosos

Se o modelo carregar corretamente, mas os turnos completos do agente apresentarem comportamento inadequado, investigue de cima para baixo: primeiro confirme o transporte e depois restrinja a superfície.

1. **Confirme que o modelo local responde** — sem ferramentas, sem contexto do agente:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Responda exatamente: pong" --json
   ```

2. **Confirme o roteamento do Gateway** - envia apenas o prompt, ignorando a transcrição, a inicialização de AGENTS, a montagem do mecanismo de contexto, as ferramentas e os servidores MCP incluídos, mas ainda testa o roteamento do Gateway, a autenticação e a seleção do provedor:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Responda exatamente: pong" --json
   ```

3. **Experimente o modo enxuto** se ambas as sondagens forem bem-sucedidas, mas as interações reais do agente falharem com chamadas de ferramenta malformadas ou prompts grandes demais: defina `agents.defaults.experimental.localModelLean: true`. Ele remove ferramentas pesadas de navegador, cron, mensagens, geração de mídia, voz e PDF, a menos que sejam explicitamente necessárias, e coloca catálogos de ferramentas maiores, por padrão, atrás de controles estruturados de Pesquisa de Ferramentas, mantendo `exec` diretamente visível. Consulte [Recursos experimentais -> Modo enxuto para modelos locais](/pt-BR/concepts/experimental-features#local-model-lean-mode) para obter detalhes e saber como confirmar que ele está ativado.

4. **Desative completamente as ferramentas como último recurso** definindo `models.providers.<provider>.models[].compat.supportsTools: false` para esse modelo - o agente então será executado sem chamadas de ferramenta.

5. **Além disso, o gargalo está no upstream.** Se o backend ainda falhar apenas em execuções maiores do OpenClaw após o modo enxuto e `supportsTools: false`, o problema restante geralmente está no próprio modelo ou servidor - janela de contexto, memória da GPU, remoção do kv-cache ou um bug no backend - e não na camada de transporte do OpenClaw.

## Solução de problemas

- **O Gateway não consegue acessar o proxy?** `curl http://127.0.0.1:1234/v1/models`.
- **O modelo do LM Studio foi descarregado?** Recarregue-o; a inicialização a frio é uma causa comum de "travamento".
- **O servidor local informa `terminated`, `ECONNRESET` ou fecha o fluxo no meio da interação?** O OpenClaw registra um `model.call.error.failureKind` de baixa cardinalidade, além do instantâneo de RSS/heap do processo do OpenClaw, nos diagnósticos. Para pressão de memória no LM Studio/Ollama, compare esse carimbo de data/hora com o log do servidor ou com um log de falha/jetsam do macOS para confirmar se o servidor do modelo foi encerrado.
- **Erros de contexto?** O OpenClaw deriva os limites da verificação preliminar da janela de contexto a partir da janela detectada do modelo (ou da janela limitada quando `agents.defaults.contextTokens` a reduz), emitindo um aviso abaixo de 20% com um piso de **8k** e bloqueando abaixo de 10% com um piso de **4k** (limitado à janela de contexto efetiva para que metadados superdimensionados do modelo não rejeitem um limite válido definido pelo usuário). Reduza `contextWindow` ou aumente o limite de contexto do servidor/modelo.
- **`messages[].content ... expected a string`?** Adicione `compat.requiresStringContent: true` à entrada desse modelo.
- **`validation.keys` ou "message entries only allow `role` and `content`"?** Adicione `compat.strictMessageKeys: true` à entrada desse modelo.
- **Chamadas diretas para `/v1/chat/completions` funcionam, mas `openclaw infer model run --local` falha no Gemma ou em outro modelo local?** Verifique primeiro a URL do provedor, a referência do modelo, o marcador de autenticação e os logs do servidor - `model run` ignora completamente as ferramentas do agente. Se `model run` for bem-sucedido, mas interações maiores do agente falharem, reduza a superfície de ferramentas com `localModelLean` ou `compat.supportsTools: false`.
- **As chamadas de ferramenta aparecem como texto JSON/XML/ReAct bruto ou o provedor retorna um array `tool_calls` vazio?** Não adicione um proxy que converta indiscriminadamente texto do assistente em execução de ferramentas - primeiro corrija o template/parser de chat do servidor. Se o modelo funcionar apenas quando o uso de ferramentas for obrigatório, adicione a substituição `params.extra_body.tool_choice: "required"` acima e use essa entrada de modelo apenas em sessões nas quais uma chamada de ferramenta seja esperada em cada interação.
- **Segurança**: modelos locais ignoram os filtros do provedor. Mantenha os agentes com escopo restrito e a Compaction ativada para limitar o raio de impacto de injeções de prompt.

## Relacionados

- [Referência de configuração](/pt-BR/gateway/configuration-reference)
- [Failover de modelo](/pt-BR/concepts/model-failover)
