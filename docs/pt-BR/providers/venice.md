---
read_when:
    - Você quer inferência com foco em privacidade no OpenClaw
    - Você quer orientações para configurar o Venice AI
summary: Use os modelos da Venice AI com foco em privacidade no OpenClaw
title: Venice AI
x-i18n:
    generated_at: "2026-07-12T15:35:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f274922274def2f87fb0e074554f6457b97852dcb509578262a2e2e58425265e
    source_path: providers/venice.md
    workflow: 16
---

[Venice AI](https://venice.ai) fornece inferência com foco em privacidade: modelos abertos são executados
sem registro de dados, além de acesso por proxy anonimizado ao Claude, GPT, Gemini e Grok.
Todos os endpoints são compatíveis com a OpenAI (`/v1`).

## Modos de privacidade

| Modo           | Comportamento                                                         | Modelos                                                        |
| -------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Privado**    | Prompts/respostas nunca são armazenados nem registrados. Efêmero.     | Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored etc.   |
| **Anonimizado** | Encaminhado pela Venice com os metadados removidos antes do envio.   | Claude, GPT, Gemini, Grok                                      |

<Warning>
Os modelos anonimizados não são totalmente privados. A Venice remove os metadados antes de encaminhar a solicitação, mas o provedor subjacente (OpenAI, Anthropic, Google, xAI) ainda a processa. Use modelos Privados quando for necessária privacidade total.
</Warning>

## Primeiros passos

<Steps>
  <Step title="Instale o plugin">
    ```bash
    openclaw plugins install @openclaw/venice-provider
    ```
  </Step>
  <Step title="Obtenha sua chave de API">
    1. Cadastre-se em [venice.ai](https://venice.ai)
    2. Acesse **Settings > API Keys > Create new key**
    3. Copie sua chave de API (formato: `vapi_xxxxxxxxxxxx`)
  </Step>
  <Step title="Configure o OpenClaw">
    <Tabs>
      <Tab title="Interativo (recomendado)">
        ```bash
        openclaw onboard --auth-choice venice-api-key
        ```

        Solicita a chave de API (ou reutiliza uma `VENICE_API_KEY` existente), lista os modelos da Venice disponíveis e define seu modelo padrão.
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
    openclaw agent --model venice/kimi-k2-5 --message "Olá, você está funcionando?"
    ```
  </Step>
</Steps>

## Seleção de modelo

- **Padrão**: `venice/kimi-k2-5` (privado, raciocínio, visão).
- **Opção anonimizada mais potente**: `venice/claude-opus-4-6`.

```bash
openclaw models set venice/kimi-k2-5
openclaw models list --all --provider venice
```

Você também pode executar `openclaw configure` e escolher **Provedor de modelo/autenticação > Venice AI**.

<Tip>
| Caso de uso                 | Modelo                             | Motivo                                             |
| --------------------------- | ---------------------------------- | -------------------------------------------------- |
| Conversa geral (padrão)     | `kimi-k2-5`                        | Raciocínio privado avançado, além de visão         |
| Melhor qualidade geral      | `claude-opus-4-6`                  | Opção anonimizada mais potente da Venice           |
| Privacidade + programação   | `qwen3-coder-480b-a35b-instruct`   | Modelo privado de programação com contexto amplo   |
| Rápido + barato             | `qwen3-4b`                         | Modelo de raciocínio leve                           |
| Tarefas privadas complexas  | `deepseek-v3.2`                    | Raciocínio avançado; chamada de ferramentas desativada |
| Sem censura                 | `venice-uncensored`                | Sem restrições de conteúdo                         |
</Tip>

## Catálogo integrado (38 modelos)

<AccordionGroup>
  <Accordion title="Modelos privados (26) — totalmente privados, sem registro de dados">
    | ID do modelo                           | Nome                                  | Contexto | Observações                         |
    | -------------------------------------- | ------------------------------------- | -------- | ----------------------------------- |
    | `kimi-k2-5`                            | Kimi K2.5                             | 256k     | Padrão, raciocínio, visão           |
    | `kimi-k2-thinking`                     | Kimi K2 Thinking                      | 256k     | Raciocínio                          |
    | `llama-3.3-70b`                        | Llama 3.3 70B                         | 128k     | Uso geral                           |
    | `llama-3.2-3b`                         | Llama 3.2 3B                          | 128k     | Uso geral                           |
    | `hermes-3-llama-3.1-405b`              | Hermes 3 Llama 3.1 405B               | 128k     | Uso geral, ferramentas desativadas  |
    | `qwen3-235b-a22b-thinking-2507`        | Qwen3 235B Thinking                   | 128k     | Raciocínio                          |
    | `qwen3-235b-a22b-instruct-2507`        | Qwen3 235B Instruct                   | 128k     | Uso geral                           |
    | `qwen3-coder-480b-a35b-instruct`       | Qwen3 Coder 480B                      | 256k     | Programação                         |
    | `qwen3-coder-480b-a35b-instruct-turbo` | Qwen3 Coder 480B Turbo                | 256k     | Programação                         |
    | `qwen3-5-35b-a3b`                      | Qwen3.5 35B A3B                       | 256k     | Raciocínio, visão                   |
    | `qwen3-next-80b`                       | Qwen3 Next 80B                        | 256k     | Uso geral                           |
    | `qwen3-vl-235b-a22b`                   | Qwen3 VL 235B (Visão)                 | 256k     | Visão                               |
    | `qwen3-4b`                             | Venice Small (Qwen3 4B)               | 32k      | Rápido, raciocínio                  |
    | `deepseek-v3.2`                        | DeepSeek V3.2                         | 160k     | Raciocínio, ferramentas desativadas |
    | `venice-uncensored`                    | Venice Uncensored (Dolphin-Mistral)   | 32k      | Sem censura, ferramentas desativadas |
    | `mistral-31-24b`                       | Venice Medium (Mistral)               | 128k     | Visão                               |
    | `google-gemma-3-27b-it`                | Google Gemma 3 27B Instruct           | 198k     | Visão                               |
    | `openai-gpt-oss-120b`                  | OpenAI GPT OSS 120B                   | 128k     | Uso geral                           |
    | `nvidia-nemotron-3-nano-30b-a3b`       | NVIDIA Nemotron 3 Nano 30B            | 128k     | Uso geral                           |
    | `olafangensan-glm-4.7-flash-heretic`   | GLM 4.7 Flash Heretic                 | 128k     | Raciocínio                          |
    | `zai-org-glm-4.6`                      | GLM 4.6                               | 198k     | Uso geral                           |
    | `zai-org-glm-4.7`                      | GLM 4.7                               | 198k     | Raciocínio                          |
    | `zai-org-glm-4.7-flash`                | GLM 4.7 Flash                         | 128k     | Raciocínio                          |
    | `zai-org-glm-5`                        | GLM 5                                 | 198k     | Raciocínio                          |
    | `minimax-m21`                          | MiniMax M2.1                          | 198k     | Raciocínio                          |
    | `minimax-m25`                          | MiniMax M2.5                          | 198k     | Raciocínio                          |
  </Accordion>

  <Accordion title="Modelos anonimizados (12) — por meio do proxy da Venice">
    | ID do modelo                    | Nome                            | Contexto | Observações                     |
    | ------------------------------- | ------------------------------- | -------- | ------------------------------- |
    | `claude-opus-4-6`               | Claude Opus 4.6 (via Venice)    | 1M       | Raciocínio, visão               |
    | `claude-sonnet-4-6`             | Claude Sonnet 4.6 (via Venice)  | 1M       | Raciocínio, visão               |
    | `openai-gpt-54`                 | GPT-5.4 (via Venice)            | 1M       | Raciocínio, visão               |
    | `openai-gpt-53-codex`           | GPT-5.3 Codex (via Venice)      | 400k     | Raciocínio, visão, programação  |
    | `openai-gpt-52`                 | GPT-5.2 (via Venice)            | 256k     | Raciocínio                      |
    | `openai-gpt-52-codex`           | GPT-5.2 Codex (via Venice)      | 256k     | Raciocínio, visão, programação  |
    | `openai-gpt-4o-2024-11-20`      | GPT-4o (via Venice)             | 128k     | Visão                           |
    | `openai-gpt-4o-mini-2024-07-18` | GPT-4o Mini (via Venice)        | 128k     | Visão                           |
    | `gemini-3-1-pro-preview`        | Gemini 3.1 Pro (via Venice)     | 1M       | Raciocínio, visão               |
    | `gemini-3-pro-preview`          | Gemini 3 Pro (via Venice)       | 198k     | Raciocínio, visão               |
    | `gemini-3-flash-preview`        | Gemini 3 Flash (via Venice)     | 256k     | Raciocínio, visão               |
    | `grok-41-fast`                  | Grok 4.1 Fast (via Venice)      | 1M       | Raciocínio, visão               |
  </Accordion>
</AccordionGroup>

Os modelos da Venice baseados no Grok (`grok-41-fast` e semelhantes) recebem o mesmo patch de compatibilidade
de esquema de ferramentas que o provedor xAI nativo, pois compartilham o mesmo formato upstream
de chamada de ferramentas.

## Descoberta de modelos

O catálogo integrado acima é uma lista inicial respaldada por um manifesto. Durante a execução, o OpenClaw
o atualiza pela API `/models` da Venice e recorre à lista inicial se
a API estiver inacessível. O endpoint `/models` é público (não é necessária autenticação para
listar), mas a inferência exige uma chave de API válida.

## Comportamento de repetição do DeepSeek V4

Se a Venice disponibilizar modelos DeepSeek V4, como `deepseek-v4-pro` ou
`deepseek-v4-flash`, o OpenClaw preenche o campo obrigatório de repetição `reasoning_content`
nas mensagens do assistente quando a Venice o omite e remove `thinking`/
`reasoning`/`reasoning_effort` da carga útil da solicitação (a Venice rejeita
o controle `thinking` nativo do DeepSeek nesses modelos). Essa correção de repetição é
separada dos próprios controles de pensamento do provedor DeepSeek nativo.

## Suporte a streaming e ferramentas

| Recurso             | Suporte                                                |
| ------------------- | ------------------------------------------------------ |
| Streaming           | Todos os modelos                                       |
| Chamada de funções  | A maioria dos modelos; desativada por modelo quando indicado acima |
| Visão/Imagens       | Modelos marcados como "Visão" acima                    |
| Modo JSON           | Por meio de `response_format`                          |

## Preços

A Venice usa um sistema baseado em créditos. Os modelos anonimizados custam aproximadamente o mesmo que
os preços diretos da API, acrescidos de uma pequena taxa da Venice. Consulte
[venice.ai/pricing](https://venice.ai/pricing) para ver os preços atuais.

## Exemplos de uso

```bash
# Modelo privado padrão
openclaw agent --model venice/kimi-k2-5 --message "Verificação rápida de integridade"

# Claude Opus via Venice (anonimizado)
openclaw agent --model venice/claude-opus-4-6 --message "Resuma esta tarefa"

# Modelo sem censura
openclaw agent --model venice/venice-uncensored --message "Elabore opções"

# Modelo de visão com imagem
openclaw agent --model venice/qwen3-vl-235b-a22b --message "Analise a imagem anexada"

# Modelo de programação
openclaw agent --model venice/qwen3-coder-480b-a35b-instruct --message "Refatore esta função"
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="Chave de API não reconhecida">
    ```bash
    echo $VENICE_API_KEY
    openclaw models list | grep venice
    ```

    Confirme se a chave começa com `vapi_`.

  </Accordion>

  <Accordion title="Modelo indisponível">
    Execute `openclaw models list --all --provider venice` para ver os modelos
    disponíveis atualmente; o catálogo muda conforme a Venice adiciona ou descontinua modelos.
  </Accordion>

  <Accordion title="Problemas de conexão">
    A API da Venice está em `https://api.venice.ai/api/v1`. Confirme se sua rede permite conexões HTTPS com esse host.
  </Accordion>
</AccordionGroup>

<Note>
Mais ajuda: [Solução de problemas](/pt-BR/help/troubleshooting) e [Perguntas frequentes](/pt-BR/help/faq).
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

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Venice AI" href="https://venice.ai" icon="globe">
    Página inicial da Venice AI e criação de conta.
  </Card>
  <Card title="Documentação da API" href="https://docs.venice.ai" icon="book">
    Referência da API da Venice e documentação para desenvolvedores.
  </Card>
  <Card title="Preços" href="https://venice.ai/pricing" icon="credit-card">
    Tarifas atuais de créditos e planos da Venice.
  </Card>
</CardGroup>
