---
read_when:
    - Você quer inferência focada em privacidade no OpenClaw
    - Você quer orientação de configuração da Venice AI
summary: Use modelos focados em privacidade da Venice AI no OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-04-12T23:33:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6f8005edb1d7781316ce8b5432bf4f9375c16113594a2a588912dce82234a9e5
    source_path: providers/venice.md
    workflow: 15
---

# Venice AI

A Venice AI fornece **inferência de IA focada em privacidade**, com suporte a modelos sem censura e acesso aos principais modelos proprietários por meio do proxy anonimizado deles. Toda inferência é privada por padrão — sem treinamento com seus dados, sem logs.

## Por que usar Venice no OpenClaw

- **Inferência privada** para modelos open-source (sem logs).
- **Modelos sem censura** quando você precisa deles.
- **Acesso anonimizado** a modelos proprietários (Opus/GPT/Gemini) quando a qualidade importa.
- Endpoints `/v1` compatíveis com OpenAI.

## Modos de privacidade

A Venice oferece dois níveis de privacidade — entender isso é essencial para escolher seu modelo:

| Modo           | Descrição                                                                                                                              | Modelos                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Private**    | Totalmente privado. Prompts/respostas **nunca são armazenados nem registrados em log**. Efêmero.                                      | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored etc. |
| **Anonymized** | Encaminhado pela Venice com metadados removidos. O provedor subjacente (OpenAI, Anthropic, Google, xAI) vê solicitações anonimizadas. | Claude, GPT, Gemini, Grok                                    |

<Warning>
Modelos anonymized **não** são totalmente privados. A Venice remove metadados antes de encaminhar, mas o provedor subjacente (OpenAI, Anthropic, Google, xAI) ainda processa a solicitação. Escolha modelos **Private** quando privacidade total for necessária.
</Warning>

## Recursos

- **Foco em privacidade**: escolha entre os modos "private" (totalmente privado) e "anonymized" (via proxy)
- **Modelos sem censura**: acesso a modelos sem restrições de conteúdo
- **Acesso aos principais modelos**: use Claude, GPT, Gemini e Grok por meio do proxy anonimizado da Venice
- **API compatível com OpenAI**: endpoints `/v1` padrão para integração fácil
- **Streaming**: compatível em todos os modelos
- **Function calling**: compatível em modelos selecionados (verifique as capacidades do modelo)
- **Vision**: compatível em modelos com capacidade de vision
- **Sem limites rígidos de taxa**: limitação de uso justo pode se aplicar a uso extremo

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    1. Cadastre-se em [venice.ai](https://venice.ai)
    2. Vá para **Settings > API Keys > Create new key**
    3. Copie sua chave de API (formato: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure o OpenClaw">
    Escolha seu método de configuração preferido:

    <Tabs>
      <Tab title="Interativo (recomendado)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Isso irá:
        1. Solicitar sua chave de API (ou usar `VENICE_API_KEY` existente)
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

- **Modelo padrão**: `venice/kimi-k2-5` para reasoning privado forte com vision.
- **Opção de alta capacidade**: `venice/claude-opus-4-6` para o caminho Venice anonymized mais forte.
- **Privacidade**: escolha modelos "private" para inferência totalmente privada.
- **Capacidade**: escolha modelos "anonymized" para acessar Claude, GPT, Gemini via proxy da Venice.

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

| Caso de uso                | Modelo recomendado              | Motivo                                          |
| -------------------------- | ------------------------------- | ----------------------------------------------- |
| **Chat geral (padrão)**    | `kimi-k2-5`                     | Reasoning privado forte com vision              |
| **Melhor qualidade geral** | `claude-opus-4-6`               | Opção Venice anonymized mais forte              |
| **Privacidade + código**   | `qwen3-coder-480b-a35b-instruct`| Modelo privado para código com contexto amplo   |
| **Vision privada**         | `kimi-k2-5`                     | Suporte a vision sem sair do modo private       |
| **Rápido + barato**        | `qwen3-4b`                      | Modelo leve de reasoning                        |
| **Tarefas privadas complexas** | `deepseek-v3.2`              | Reasoning forte, mas sem suporte a ferramentas Venice |
| **Sem censura**            | `venice-uncensored`             | Sem restrições de conteúdo                      |

</Tip>

## Modelos disponíveis (41 no total)

<AccordionGroup>
  <Accordion title="Modelos private (26) — totalmente privados, sem logs">
    | ID do modelo                           | Nome                                | Contexto | Recursos                   |
    | -------------------------------------- | ----------------------------------- | -------- | -------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                           | 256k     | Padrão, reasoning, vision  |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                    | 256k     | Reasoning                  |
    | `llama-3.3-70b`                        | Llama 3.3 70B                       | 128k     | Geral                      |
    | `llama-3.2-3b`                         | Llama 3.2 3B                        | 128k     | Geral                      |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B             | 128k     | Geral, ferramentas desabilitadas |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                 | 128k     | Reasoning                  |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                 | 128k     | Geral                      |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                    | 256k     | Código                     |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo              | 256k     | Código                     |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                     | 256k     | Reasoning, vision          |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                      | 256k     | Geral                      |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Vision)              | 256k     | Vision                     |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)             | 32k      | Rápido, reasoning          |
    | `deepseek-v3.2`                        | DeepSeek V3.2                       | 160k     | Reasoning, ferramentas desabilitadas |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral) | 32k      | Sem censura, ferramentas desabilitadas |
    | `mistral-31-24b`                       | Venice Medium (Mistral)             | 128k     | Vision                     |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct         | 198k     | Vision                     |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                 | 128k     | Geral                      |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B          | 128k     | Geral                      |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic               | 128k     | Reasoning                  |
    | `zai-org-glm-4.6`                      | GLM 4.6                             | 198k     | Geral                      |
    | `zai-org-glm-4.7`                      | GLM 4.7                             | 198k     | Reasoning                  |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                       | 128k     | Reasoning                  |
    | `zai-org-glm-5`                        | GLM 5                               | 198k     | Reasoning                  |
    | `minimax-m21`                          | MiniMax M2.1                        | 198k     | Reasoning                  |
    | `minimax-m25`                          | MiniMax M2.5                        | 198k     | Reasoning                  |
  </Accordion>

  <Accordion title="Modelos anonymized (15) — via proxy Venice">
    | ID do modelo                    | Nome                           | Contexto | Recursos                  |
    | ------------------------------- | ------------------------------ | -------- | ------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)   | 1M       | Reasoning, vision         |
    | `claude-opus-4-5`               | Claude Opus 4.5 (via Venice)   | 198k     | Reasoning, vision         |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice) | 1M       | Reasoning, vision         |
    | `claude-sonnet-4-5`             | Claude Sonnet 4.5 (via Venice) | 198k     | Reasoning, vision         |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)           | 1M       | Reasoning, vision         |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)     | 400k     | Reasoning, vision, código |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)           | 256k     | Reasoning                 |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)     | 256k     | Reasoning, vision, código |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)            | 128k     | Vision                    |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)       | 128k     | Vision                    |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)    | 1M       | Reasoning, vision         |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)      | 198k     | Reasoning, vision         |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)    | 256k     | Reasoning, vision         |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)     | 1M       | Reasoning, vision         |
    | `grok-code-fast-1`              | Grok Code Fast 1 (via Venice)  | 256k     | Reasoning, código         |
  </Accordion>
</AccordionGroup>

## Descoberta de modelos

O OpenClaw descobre automaticamente modelos da API da Venice quando `VENICE_API_KEY` está definida. Se a API estiver inacessível, ele recorre a um catálogo estático.

O endpoint `/models` é público (não precisa de auth para listar), mas a inferência exige uma chave de API válida.

## Suporte a streaming e ferramentas

| Recurso              | Suporte                                              |
| -------------------- | ---------------------------------------------------- |
| **Streaming**        | Todos os modelos                                     |
| **Function calling** | A maioria dos modelos (verifique `supportsFunctionCalling` na API) |
| **Vision/Images**    | Modelos marcados com o recurso "Vision"              |
| **Modo JSON**        | Compatível via `response_format`                     |

## Preços

A Venice usa um sistema baseado em créditos. Consulte [venice.ai/pricing](https://venice.ai/pricing) para as tarifas atuais:

- **Modelos private**: custo geralmente mais baixo
- **Modelos anonymized**: semelhante ao preço direto da API + pequena taxa da Venice

### Venice (anonymized) vs API direta

| Aspecto      | Venice (Anonymized)           | API direta          |
| ------------ | ----------------------------- | ------------------- |
| **Privacidade** | Metadados removidos, anonimizado | Sua conta vinculada |
| **Latência** | +10-50ms (proxy)              | Direta              |
| **Recursos** | A maioria dos recursos é compatível | Recursos completos  |
| **Cobrança** | Créditos Venice               | Cobrança do provedor |

## Exemplos de uso

```bash
# Usar o modelo private padrão
openclaw agent --model venice/kimi-k2-5 --message "Quick health check"

# Usar Claude Opus via Venice (anonymized)
openclaw agent --model venice/claude-opus-4-6 --message "Summarize this task"

# Usar modelo sem censura
openclaw agent --model venice/venice-uncensored --message "Draft options"

# Usar modelo com vision com imagem
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Review attached image"

# Usar modelo de código
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refactor this function"
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Chave de API não reconhecida">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Verifique se a chave começa com `vapi_`.

  </Accordion>

  <Accordion title="Modelo não disponível">
    O catálogo de modelos da Venice é atualizado dinamicamente. Execute `openclaw models list` para ver os modelos disponíveis no momento. Alguns modelos podem estar temporariamente offline.
  </Accordion>

  <Accordion title="Problemas de conexão">
    A API da Venice fica em `https://api.venice.ai/api/v1`. Verifique se sua rede permite conexões HTTPS.
  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [FAQ](/pt-BR/help/faq).
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Exemplo de arquivo de configuração">
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

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Página inicial da Venice AI e cadastro de conta.
  </Card>
  <Card title="Documentação da API" href="https://docs.venice.ai" icon="book">
    Referência da API da Venice e documentação para desenvolvedores.
  </Card>
  <Card title="Preços" href="https://venice.ai/pricing" icon="credit-card">
    Tarifas e planos atuais de créditos da Venice.
  </Card>
</CardGroup>
