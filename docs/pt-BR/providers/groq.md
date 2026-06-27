---
read_when:
    - Você quer usar o Groq com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
    - Você está configurando a transcrição de áudio Whisper no Groq
summary: Configuração do Groq (autenticação + seleção de modelo + transcrição Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:04:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

O [Groq](https://groq.com) fornece inferência ultrarrápida em modelos de peso aberto (Llama, Gemma, Kimi, Qwen, GPT OSS e outros) usando hardware LPU personalizado. O plugin Groq registra tanto um provedor de chat compatível com OpenAI quanto um provedor de compreensão de mídia de áudio.

| Propriedade                 | Valor                                    |
| --------------------------- | ---------------------------------------- |
| ID do provedor              | `groq`                                   |
| Plugin                      | pacote externo oficial                   |
| Variável de ambiente de auth | `GROQ_API_KEY`                           |
| API                         | compatível com OpenAI (`openai-completions`) |
| URL base                    | `https://api.groq.com/openai/v1`         |
| Transcrição de áudio        | `whisper-large-v3-turbo` (padrão)        |
| Padrão de chat sugerido     | `groq/llama-3.3-70b-versatile`           |

## Instalar plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Obtenha uma chave de API">
    Crie uma chave de API em [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Configure a chave de API">
    ```bash
export GROQ_API_KEY=gsk_...
```
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

O OpenClaw inclui um catálogo Groq baseado em manifesto com entradas de raciocínio e sem raciocínio. Execute `openclaw models list --provider groq` para ver as linhas estáticas da sua versão instalada, ou consulte [console.groq.com/docs/models](https://console.groq.com/docs/models) para a lista oficial da Groq.

| Referência do modelo                            | Nome                    | Raciocínio | Entrada        | Contexto |
| ------------------------------------------------ | ----------------------- | ---------- | -------------- | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | não        | texto          | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | não        | texto          | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | não        | texto + imagem | 131,072  |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | sim        | texto          | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | sim        | texto          | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | sim        | texto          | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | sim        | texto          | 131,072  |
| `groq/groq/compound`                             | Compound                | sim        | texto          | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | sim        | texto          | 131,072  |

<Tip>
  O catálogo evolui a cada versão do OpenClaw. `openclaw models list --provider groq` mostra as linhas conhecidas pela sua versão instalada; compare com [console.groq.com/docs/models](https://console.groq.com/docs/models) para modelos recém-adicionados ou descontinuados.
</Tip>

## Modelos de raciocínio

O OpenClaw mapeia seus níveis compartilhados de `/think` para os valores `reasoning_effort` específicos de modelo da Groq:

- Para `qwen/qwen3-32b`, raciocínio desativado envia `none` e raciocínio ativado envia `default`.
- Para modelos de raciocínio Groq GPT OSS (`openai/gpt-oss-*`), o OpenClaw envia `low`, `medium` ou `high` com base no nível de `/think`. Raciocínio desativado omite `reasoning_effort` porque esses modelos não dão suporte a um valor desativado.
- DeepSeek R1 Distill, Qwen QwQ e Compound usam a superfície de raciocínio nativa da Groq; `/think` controla a visibilidade, mas o modelo sempre raciocina.

Consulte [Modos de pensamento](/pt-BR/tools/thinking) para os níveis compartilhados de `/think` e como o OpenClaw os traduz por provedor.

## Transcrição de áudio

O plugin da Groq também registra um **provedor de compreensão de mídia de áudio** para que mensagens de voz possam ser transcritas pela superfície compartilhada `tools.media.audio`.

| Propriedade                  | Valor                                     |
| ---------------------------- | ----------------------------------------- |
| Caminho de config compartilhada | `tools.media.audio`                       |
| URL base padrão              | `https://api.groq.com/openai/v1`          |
| Modelo padrão                | `whisper-large-v3-turbo`                  |
| Prioridade automática        | 20                                        |
| Endpoint da API              | compatível com OpenAI `/audio/transcriptions` |

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
  <Accordion title="Disponibilidade do ambiente para o daemon">
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), `GROQ_API_KEY` precisa estar visível para esse processo, não apenas para seu shell interativo.

    <Warning>
      Uma chave exportada apenas em um shell interativo não ajudará um daemon launchd ou systemd, a menos que esse ambiente também seja importado lá. Configure a chave em `~/.openclaw/.env` ou via `env.shellEnv` para torná-la legível pelo processo do gateway.
    </Warning>

  </Accordion>

  <Accordion title="IDs de modelo Groq personalizados">
    O OpenClaw aceita qualquer ID de modelo Groq em tempo de execução. Use o ID exato mostrado pela Groq e prefixe-o com `groq/`. O catálogo estático cobre os casos comuns; IDs não catalogados passam para o modelo compatível com OpenAI padrão.

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
  <Card title="Provedores de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Modos de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio e interação com a política do provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema de configuração completo, incluindo configurações de provedor e áudio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Painel da Groq, documentação da API e preços.
  </Card>
</CardGroup>
