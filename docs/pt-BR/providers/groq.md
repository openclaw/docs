---
read_when:
    - Você quer usar Groq com OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
    - Você está configurando a transcrição de áudio com Whisper no Groq
summary: Configuração do Groq (autenticação + seleção de modelo + transcrição com Whisper)
title: Groq
x-i18n:
    generated_at: "2026-05-06T09:10:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53ce6d702eb1e0abba0cf1efd3e86c766444f5e7cbf26c312b94a74fa410b700
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) fornece inferência ultrarrápida em modelos de pesos abertos (Llama, Gemma, Kimi, Qwen, GPT OSS e outros) usando hardware LPU personalizado. O OpenClaw inclui um Plugin Groq integrado que registra tanto um provedor de chat compatível com OpenAI quanto um provedor de compreensão de mídia de áudio.

| Propriedade             | Valor                                    |
| ----------------------- | ---------------------------------------- |
| ID do provedor          | `groq`                                   |
| Plugin                  | integrado, `enabledByDefault: true`      |
| Variável de env de auth | `GROQ_API_KEY`                           |
| Sinalizador de onboarding | `--auth-choice groq-api-key`           |
| API                     | compatível com OpenAI (`openai-completions`) |
| URL base                | `https://api.groq.com/openai/v1`         |
| Transcrição de áudio    | `whisper-large-v3-turbo` (padrão)        |
| Padrão sugerido para chat | `groq/llama-3.3-70b-versatile`         |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma chave de API">
    Crie uma chave de API em [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Defina a chave de API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash Somente env
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

  </Step>
  <Step title="Defina um modelo padrão">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifique se o catálogo está acessível">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### Exemplo de arquivo de configuração

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## Catálogo integrado

O OpenClaw inclui um catálogo Groq baseado em manifesto com entradas de raciocínio e sem raciocínio. Execute `openclaw models list --provider groq` para ver as linhas integradas da sua versão instalada, ou consulte [console.groq.com/docs/models](https://console.groq.com/docs/models) para a lista oficial da Groq.

| Ref do modelo                                       | Nome                          | Raciocínio | Entrada       | Contexto |
| --------------------------------------------------- | ----------------------------- | ---------- | ------------- | -------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | não        | texto         | 131,072  |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | não        | texto         | 131,072  |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | não        | texto + imagem | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | não        | texto + imagem | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | não        | texto         | 8,192    |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | não        | texto         | 8,192    |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | não        | texto         | 8,192    |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | não        | texto         | 32,768   |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | não        | texto         | 131,072  |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | não        | texto         | 262,144  |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | sim        | texto         | 131,072  |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | sim        | texto         | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | sim        | texto         | 131,072  |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | sim        | texto         | 131,072  |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | sim        | texto         | 131,072  |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | sim        | texto         | 131,072  |
| `groq/groq/compound`                                 | Compound                      | sim        | texto         | 131,072  |
| `groq/groq/compound-mini`                            | Compound Mini                 | sim        | texto         | 131,072  |

<Tip>
  O catálogo evolui a cada versão do OpenClaw. `openclaw models list --provider groq` mostra as linhas conhecidas pela sua versão instalada; compare com [console.groq.com/docs/models](https://console.groq.com/docs/models) para modelos recém-adicionados ou descontinuados.
</Tip>

## Modelos de raciocínio

O OpenClaw mapeia seus níveis `/think` compartilhados para os valores `reasoning_effort` específicos de modelo da Groq:

- Para `qwen/qwen3-32b`, o pensamento desativado envia `none` e o pensamento ativado envia `default`.
- Para modelos de raciocínio Groq GPT OSS (`openai/gpt-oss-*`), o OpenClaw envia `low`, `medium` ou `high` com base no nível `/think`. O pensamento desativado omite `reasoning_effort` porque esses modelos não oferecem suporte a um valor desativado.
- DeepSeek R1 Distill, Qwen QwQ e Compound usam a superfície de raciocínio nativa da Groq; `/think` controla a visibilidade, mas o modelo sempre raciocina.

Veja [Modos de pensamento](/pt-BR/tools/thinking) para os níveis `/think` compartilhados e como o OpenClaw os traduz por provedor.

## Transcrição de áudio

O Plugin integrado da Groq também registra um **provedor de compreensão de mídia de áudio** para que mensagens de voz possam ser transcritas pela superfície compartilhada `tools.media.audio`.

| Propriedade                  | Valor                                     |
| ---------------------------- | ----------------------------------------- |
| Caminho de configuração compartilhado | `tools.media.audio`              |
| URL base padrão              | `https://api.groq.com/openai/v1`          |
| Modelo padrão                | `whisper-large-v3-turbo`                  |
| Prioridade automática        | 20                                        |
| Endpoint da API              | `/audio/transcriptions` compatível com OpenAI |

Para tornar a Groq o backend de áudio padrão:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Disponibilidade de ambiente para o daemon">
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), `GROQ_API_KEY` deve estar visível para esse processo, não apenas para o seu shell interativo.

    <Warning>
      Uma chave presente apenas em `~/.profile` não ajudará um daemon launchd ou systemd, a menos que esse ambiente também seja importado para lá. Defina a chave em `~/.openclaw/.env` ou via `env.shellEnv` para torná-la legível pelo processo do Gateway.
    </Warning>

  </Accordion>

  <Accordion title="IDs personalizados de modelos Groq">
    O OpenClaw aceita qualquer ID de modelo Groq em runtime. Use o ID exato mostrado pela Groq e prefixe-o com `groq/`. O catálogo integrado cobre os casos comuns; IDs não catalogados usam o template compatível com OpenAI padrão.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Modos de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio e interação com a política do provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo configurações de provedor e áudio.
  </Card>
  <Card title="Console Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Painel da Groq, documentação da API e preços.
  </Card>
</CardGroup>
