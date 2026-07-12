---
read_when:
    - Você quer usar o Groq com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
    - Você está configurando a transcrição de áudio do Whisper no Groq
summary: Configuração do Groq (autenticação + seleção de modelo + transcrição com Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T15:31:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) oferece inferência ultrarrápida em modelos de pesos abertos (Llama, Gemma, Kimi, Qwen, GPT OSS e outros) usando hardware LPU personalizado. O plugin Groq registra tanto um provedor de chat compatível com OpenAI quanto um provedor de compreensão de mídia de áudio.

| Propriedade                    | Valor                                    |
| ------------------------------ | ---------------------------------------- |
| ID do provedor                 | `groq`                                   |
| Plugin                         | pacote externo oficial                   |
| Variável de ambiente de autenticação | `GROQ_API_KEY`                    |
| API                            | compatível com OpenAI (`openai-completions`) |
| URL base                       | `https://api.groq.com/openai/v1`         |
| Transcrição de áudio           | `whisper-large-v3-turbo` (padrão)        |
| Padrão de chat sugerido        | `groq/llama-3.3-70b-versatile`           |

## Instalar o plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## Primeiros passos

<Steps>
  <Step title="Obter uma chave de API">
    Crie uma chave de API em [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Definir a chave de API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="Definir um modelo padrão">
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
  <Step title="Verificar se o catálogo está acessível">
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

O OpenClaw inclui um catálogo da Groq baseado em manifesto, com entradas de raciocínio e sem raciocínio. Execute `openclaw models list --provider groq` para ver as linhas estáticas da versão instalada ou consulte [console.groq.com/docs/models](https://console.groq.com/docs/models) para obter a lista oficial da Groq.

| Referência do modelo                              | Nome                    | Raciocínio | Entrada      | Contexto |
| ------------------------------------------------ | ----------------------- | ---------- | ------------ | -------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | não        | texto        | 131,072  |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | não        | texto        | 131,072  |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | não        | texto + imagem | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | sim        | texto        | 131,072  |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | sim        | texto        | 131,072  |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | sim        | texto        | 131,072  |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | sim        | texto        | 131,072  |
| `groq/groq/compound`                             | Compound                | sim        | texto        | 131,072  |
| `groq/groq/compound-mini`                        | Compound Mini           | sim        | texto        | 131,072  |

<Tip>
  O catálogo evolui a cada versão do OpenClaw. `openclaw models list --provider groq` mostra as linhas conhecidas pela versão instalada; compare com [console.groq.com/docs/models](https://console.groq.com/docs/models) para verificar modelos recém-adicionados ou descontinuados.
</Tip>

## Modelos de raciocínio

Os modelos de raciocínio da Groq (`reasoning: true` na tabela acima) mapeiam os níveis compartilhados de `/think` do OpenClaw para valores de `reasoning_effort` iguais a `low`, `medium` ou `high`. `/think off` ou `/think none` omite `reasoning_effort` da solicitação, em vez de enviar um valor desativado.

Consulte [Modos de pensamento](/pt-BR/tools/thinking) para conhecer os níveis compartilhados de `/think` e como o OpenClaw os traduz para cada provedor.

## Transcrição de áudio

O plugin da Groq também registra um **provedor de compreensão de mídia de áudio**, permitindo que mensagens de voz sejam transcritas por meio da interface compartilhada `tools.media.audio`.

| Propriedade                   | Valor                                     |
| ----------------------------- | ----------------------------------------- |
| Caminho de configuração compartilhado | `tools.media.audio`               |
| URL base padrão               | `https://api.groq.com/openai/v1`          |
| Modelo padrão                 | `whisper-large-v3-turbo`                  |
| Prioridade automática         | 20                                        |
| Endpoint da API               | `/audio/transcriptions` compatível com OpenAI |

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
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), `GROQ_API_KEY` deverá estar visível para esse processo — não apenas para seu shell interativo.

    <Warning>
      Uma chave exportada somente em um shell interativo não ajudará um daemon launchd ou systemd, a menos que esse ambiente também seja importado nele. Defina a chave em `~/.openclaw/.env` ou por meio de `env.shellEnv` para torná-la acessível pelo processo do Gateway.
    </Warning>

  </Accordion>

  <Accordion title="IDs personalizados de modelos da Groq">
    O OpenClaw aceita qualquer ID de modelo da Groq em tempo de execução. Use o ID exato exibido pela Groq e adicione o prefixo `groq/`. O catálogo estático abrange os casos comuns; IDs não catalogados usam o modelo padrão compatível com OpenAI.

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
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Modos de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de esforço de raciocínio e interação com a política do provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema de configuração completo, incluindo configurações de provedor e áudio.
  </Card>
  <Card title="Console da Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Painel da Groq, documentação da API e preços.
  </Card>
</CardGroup>
