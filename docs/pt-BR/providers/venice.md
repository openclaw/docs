---
read_when:
    - Você quer inferência com foco em privacidade no OpenClaw
    - Você quer orientações de configuração da Venice AI
summary: Use os modelos com foco em privacidade da Venice AI no OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-30T10:06:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d87db1595ba6d34459143e7d173cca9549ad21928eaaf00605b7487ce6d33fce
    source_path: providers/venice.md
    workflow: 16
---

A Venice AI fornece **inferência de IA focada em privacidade** com suporte a modelos sem censura e acesso aos principais modelos proprietários por meio de seu proxy anonimizado. Toda inferência é privada por padrão — sem treinamento com seus dados, sem registro.

## Por que usar a Venice no OpenClaw

- **Inferência privada** para modelos de código aberto (sem registro).
- **Modelos sem censura** quando você precisar deles.
- **Acesso anonimizado** a modelos proprietários (Opus/GPT/Gemini) quando a qualidade for importante.
- Endpoints `/v1` compatíveis com OpenAI.

## Modos de privacidade

A Venice oferece dois níveis de privacidade — entender isso é essencial para escolher seu modelo:

| Modo           | Descrição                                                                                                                       | Modelos                                                        |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Privado**    | Totalmente privado. Prompts/respostas **nunca são armazenados nem registrados**. Efêmero.                                                       | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored, etc. |
| **Anonimizado** | Encaminhado pela Venice com metadados removidos. O provedor subjacente (OpenAI, Anthropic, Google, xAI) vê solicitações anonimizadas. | Claude, GPT, Gemini, Grok                                     |

<Warning>
Modelos anonimizados **não** são totalmente privados. A Venice remove metadados antes de encaminhar, mas o provedor subjacente (OpenAI, Anthropic, Google, xAI) ainda processa a solicitação. Escolha modelos **Privados** quando privacidade total for necessária.
</Warning>

## Recursos

- **Foco em privacidade**: escolha entre os modos "privado" (totalmente privado) e "anonimizado" (via proxy)
- **Modelos sem censura**: acesso a modelos sem restrições de conteúdo
- **Acesso aos principais modelos**: use Claude, GPT, Gemini e Grok por meio do proxy anonimizado da Venice
- **API compatível com OpenAI**: endpoints `/v1` padrão para integração fácil
- **Transmissão em tempo real**: compatível com todos os modelos
- **Chamada de função**: compatível com modelos selecionados (verifique as capacidades do modelo)
- **Visão**: compatível com modelos com capacidade de visão
- **Sem limites rígidos de taxa**: limitação por uso justo pode ser aplicada em casos de uso extremo

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    1. Cadastre-se em [venice.ai](https://venice.ai)
    2. Acesse **Settings > API Keys > Create new key**
    3. Copie sua chave de API (formato: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure o OpenClaw">
    Escolha seu método de configuração preferido:

    <Tabs>
      <Tab title="Interativo (recomendado)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Isso vai:
        1. Solicitar sua chave de API (ou usar a `VENICE_API_KEY` existente)
        2. Mostrar todos os modelos Venice disponíveis
        3. Permitir que você escolha seu modelo padrão
        4. Configurar o provedor automaticamente
      </Tab>
      <Tab title="Variável de ambiente">
        ```bash
        export VENICE_API_KEY="vapi_xxxxxxxxxxxx"
        ```
      </Tab>
      <Tab title="Não interativo">
        ```bash
        openclaw onboard --non-interactive \
          --auth-choice venice-api-key \
          --venice-api-key "vapi_xxxxxxxxxxxx"
        ```
      </Tab>
    </Tabs>

  </Step>
  <Step title="Verifique a configuração">
    ```bash
    openclaw agent --model venice/kimi-k2-5 --message "Hello, are you working?"
    ```
  </Step>
</Steps>

## Seleção de modelo

Após a configuração, o OpenClaw mostra todos os modelos Venice disponíveis. Escolha com base nas suas necessidades:

- **Modelo padrão**: `venice/kimi-k2-5` para raciocínio privado forte mais visão.
- **Opção de alta capacidade**: `venice/claude-opus-4-6` para o caminho Venice anonimizado mais poderoso.
- **Privacidade**: escolha modelos "privados" para inferência totalmente privada.
- **Capacidade**: escolha modelos "anonimizados" para acessar Claude, GPT, Gemini por meio do proxy da Venice.

Altere seu modelo padrão a qualquer momento:

```bash
openclaw models set venice/kimi-k2-5
openclaw models set venice/claude-opus-4-6
```

Liste todos os modelos disponíveis:

```bash
openclaw models list | grep venice
```

Você também pode executar `openclaw configure`, selecionar **Model/auth** e escolher **Venice AI**.

<Tip>
Use a tabela abaixo para escolher o modelo certo para seu caso de uso.

| Caso de uso                   | Modelo recomendado                | Motivo                                          |
| -------------------------- | -------------------------------- | -------------------------------------------- |
| **Chat geral (padrão)** | `kimi-k2-5`                      | Raciocínio privado forte mais visão         |
| **Melhor qualidade geral**   | `claude-opus-4-6`                | Opção Venice anonimizada mais forte           |
| **Privacidade + programação**       | `qwen3-coder-480b-a35b-instruct` | Modelo de programação privado com contexto amplo      |
| **Visão privada**         | `kimi-k2-5`                      | Suporte a visão sem sair do modo privado  |
| **Rápido + barato**           | `qwen3-4b`                       | Modelo de raciocínio leve                  |
| **Tarefas privadas complexas**  | `deepseek-v3.2`                  | Raciocínio forte, mas sem suporte a ferramentas Venice |
| **Sem censura**             | `venice-uncensored`              | Sem restrições de conteúdo                      |

</Tip>

## Comportamento de repetição do DeepSeek V4

Se a Venice expuser modelos DeepSeek V4, como `venice/deepseek-v4-pro` ou
`venice/deepseek-v4-flash`, o OpenClaw preenche o espaço reservado obrigatório de repetição
`reasoning_content` do DeepSeek V4 em mensagens do assistente quando o proxy
o omite. A Venice rejeita o controle `thinking` nativo de nível superior do DeepSeek, então
o OpenClaw mantém essa correção de repetição específica do provedor separada dos controles
de pensamento do provedor DeepSeek nativo.

## Catálogo integrado (41 no total)

<AccordionGroup>
  <Accordion title="Modelos privados (26) — totalmente privados, sem registro">
    | ID do modelo                               | Nome                                | Contexto | Recursos                   |
    | -------------------------------------- | ----------------------------------- | ------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k    | Padrão, raciocínio, visão |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k    | Raciocínio                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k    | Geral                    |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k    | Geral                    |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B            | 128k    | Geral, ferramentas desativadas    |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                | 128k    | Raciocínio                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                | 128k    | Geral                    |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                   | 256k    | Programação                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo             | 256k    | Programação                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                    | 256k    | Raciocínio, visão          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                     | 256k    | Geral                    |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)             | 256k    | Visão                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)            | 32k     | Rápido, raciocínio            |
    | `deepseek-v3.2`                        | DeepSeek V3.2                      | 160k    | Raciocínio, ferramentas desativadas  |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k     | Sem censura, ferramentas desativadas |
    | `mistral-31-24b`                       | Venice Medium (Mistral)            | 128k    | Visão                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct        | 198k    | Visão                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B               | 128k    | Geral                    |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B         | 128k    | Geral                    |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic              | 128k    | Raciocínio                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                            | 198k    | Geral                    |
    | `zai-org-glm-4.7`                      | GLM 4.7                            | 198k    | Raciocínio                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                      | 128k    | Raciocínio                  |
    | `zai-org-glm-5`                        | GLM 5                              | 198k    | Raciocínio                  |
    | `minimax-m21`                          | MiniMax M2.1                       | 198k    | Raciocínio                  |
    | `minimax-m25`                          | MiniMax M2.5                       | 198k    | Raciocínio                  |
  </Accordion>

  <Accordion title="Modelos anonimizados (15) — via proxy da Venice">
    | ID do modelo                        | Nome                           | Contexto | Recursos                  |
    | ------------------------------- | ------------------------------ | ------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M      | Raciocínio, visão         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k    | Raciocínio, visão         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M      | Raciocínio, visão         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k    | Raciocínio, visão         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M      | Raciocínio, visão         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k    | Raciocínio, visão, programação |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k    | Raciocínio                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k    | Raciocínio, visão, programação |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k    | Visão                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k    | Visão                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M      | Raciocínio, visão         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k    | Raciocínio, visão         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k    | Raciocínio, visão         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M      | Raciocínio, visão         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k    | Raciocínio, programação         |
  </Accordion>
</AccordionGroup>

## Descoberta de modelos

O OpenClaw descobre automaticamente modelos pela API da Venice quando `VENICE_API_KEY` está definida. Se a API estiver inacessível, ele recorre a um catálogo estático.

O endpoint `/models` é público (nenhuma autenticação necessária para listar), mas a inferência exige uma chave de API válida.

## Transmissão em tempo real e suporte a ferramentas

| Recurso              | Suporte                                              |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Todos os modelos                                     |
| **Chamada de função** | A maioria dos modelos (verifique `supportsFunctionCalling` na API) |
| **Visão/Imagens**    | Modelos marcados com o recurso "Visão"               |
| **Modo JSON**        | Suportado via `response_format`                      |

## Preços

A Venice usa um sistema baseado em créditos. Consulte [venice.ai/pricing](https://venice.ai/pricing) para ver as tarifas atuais:

- **Modelos privados**: Geralmente têm custo mais baixo
- **Modelos anonimizados**: Semelhante ao preço da API direta + pequena taxa da Venice

### Venice (anonimizada) vs API direta

| Aspecto       | Venice (Anonimizada)           | API direta          |
| ------------ | ----------------------------- | ------------------- |
| **Privacidade**  | Metadados removidos, anonimizados | Sua conta vinculada |
| **Latência**  | +10-50 ms (proxy)              | Direta              |
| **Recursos** | A maioria dos recursos é suportada | Recursos completos  |
| **Cobrança**  | Créditos da Venice             | Cobrança do provedor |

## Exemplos de uso

```bash
# Use the default private model
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Use Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Use uncensored model
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Use vision model with image
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Use coding model
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="API key not recognized">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Verifique se a chave começa com `vapi_`.

  </Accordion>

  <Accordion title="Model not available">
    O catálogo de modelos da Venice é atualizado dinamicamente. Execute `openclaw models list` para ver os modelos disponíveis no momento. Alguns modelos podem ficar temporariamente offline.
  </Accordion>

  <Accordion title="Connection issues">
    A API da Venice fica em `https://api.venice.ai/api/v1`. Verifique se sua rede permite conexões HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Config file example">
    ```json5
    {
      env: { VENICE_API_KEY: "vapi_..." },
      agents: { defaults: { model: { primary: "venice/kimi-k2-5" } } },
      models: {
        mode: "merge",
        providers: {
          venice: {
            baseUrl: "https://api.venice.ai/api/v1",
            apiKey: "${VENICE_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2-5",
                name: "Kimi K2.5",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Página inicial da Venice AI e cadastro de conta.
  </Card>
  <Card title="API documentation" href="https://docs.venice.ai" icon="book">
    Referência da API da Venice e documentação para desenvolvedores.
  </Card>
  <Card title="Pricing" href="https://venice.ai/pricing" icon="credit-card">
    Tarifas e planos atuais de créditos da Venice.
  </Card>
</CardGroup>
