---
read_when:
    - Você quer usar o Groq com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Groq (autenticação + seleção de modelo)
title: Groq
x-i18n:
    generated_at: "2026-05-02T05:54:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) fornece inferência ultrarrápida em modelos de código aberto
(Llama, Gemma, Mistral e outros) usando hardware LPU personalizado. O OpenClaw se conecta
ao Groq por meio de sua API compatível com OpenAI.

| Propriedade | Valor             |
| -------- | ----------------- |
| Provedor | `groq`            |
| Autenticação     | `GROQ_API_KEY`    |
| API      | Compatível com OpenAI |

## Primeiros passos

<Steps>
  <Step title="Obter uma chave de API">
    Crie uma chave de API em [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Definir a chave de API">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

O OpenClaw inclui um catálogo do Groq baseado em manifesto para listagem rápida
de modelos filtrada por provedor. Execute `openclaw models list --all --provider groq` para ver as linhas
incluídas, ou consulte
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modelo                       | Observações                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | Uso geral, contexto amplo     |
| **Llama 3.1 8B Instant**    | Rápido, leve                  |
| **Gemma 2 9B**              | Compacto, eficiente                 |
| **Mixtral 8x7B**            | Arquitetura MoE, raciocínio forte |

<Tip>
Use `openclaw models list --all --provider groq` para as linhas do Groq baseadas
em manifesto conhecidas por esta versão do OpenClaw.
</Tip>

## Modelos de raciocínio

O OpenClaw mapeia seus níveis compartilhados de `/think` para os valores
`reasoning_effort` específicos de cada modelo do Groq. Para `qwen/qwen3-32b`, o pensamento
desativado envia `none` e o pensamento ativado envia `default`. Para modelos de raciocínio
GPT-OSS do Groq, o OpenClaw envia `low`, `medium` ou `high`; com o pensamento desativado, ele omite
`reasoning_effort` porque esses modelos não oferecem suporte a um valor desativado.

## Transcrição de áudio

O Groq também fornece transcrição de áudio rápida baseada no Whisper. Quando configurado como
um provedor de compreensão de mídia, o OpenClaw usa o modelo `whisper-large-v3-turbo`
do Groq para transcrever mensagens de voz por meio da superfície compartilhada
`tools.media.audio`.

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
  <Accordion title="Detalhes da transcrição de áudio">
    | Propriedade | Valor |
    |----------|-------|
    | Caminho de configuração compartilhado | `tools.media.audio` |
    | URL base padrão   | `https://api.groq.com/openai/v1` |
    | Modelo padrão      | `whisper-large-v3-turbo` |
    | Endpoint da API       | `/audio/transcriptions` compatível com OpenAI |
  </Accordion>

  <Accordion title="Observação sobre o ambiente">
    Se o Gateway for executado como um daemon (launchd/systemd), garanta que `GROQ_API_KEY` esteja
    disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para processos
    de gateway gerenciados por daemon. Use a configuração `~/.openclaw/.env` ou `env.shellEnv` para
    disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo configurações de provedor e áudio.
  </Card>
  <Card title="Console do Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Painel do Groq, documentação da API e preços.
  </Card>
  <Card title="Lista de modelos do Groq" href="https://console.groq.com/docs/models" icon="list">
    Catálogo oficial de modelos do Groq.
  </Card>
</CardGroup>
