---
read_when:
    - Você quer usar o Groq com o OpenClaw
    - Você precisa da variável de ambiente da chave de API ou da opção de autenticação da CLI
summary: Configuração do Groq (autenticação + seleção de modelo)
title: Groq
x-i18n:
    generated_at: "2026-04-12T23:31:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 613289efc36fedd002e1ebf9366e0e7119ea1f9e14a1dae773b90ea57100baee
    source_path: providers/groq.md
    workflow: 15
---

# Groq

A [Groq](https://groq.com) fornece inferência ultrarrápida em modelos open source
(Llama, Gemma, Mistral e outros) usando hardware LPU personalizado. O OpenClaw se conecta
ao Groq por meio de sua API compatível com OpenAI.

| Propriedade | Valor             |
| ----------- | ----------------- |
| Provedor    | `groq`            |
| Autenticação | `GROQ_API_KEY`   |
| API         | Compatível com OpenAI |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma chave de API">
    Crie uma chave de API em [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Defina a chave de API">
    ```bash
    export GROQ_API_KEY="gsk_..."
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

## Modelos disponíveis

O catálogo de modelos do Groq muda com frequência. Execute `openclaw models list | grep groq`
para ver os modelos atualmente disponíveis, ou consulte
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| Modelo                      | Observações                         |
| --------------------------- | ----------------------------------- |
| **Llama 3.3 70B Versatile** | Uso geral, contexto amplo           |
| **Llama 3.1 8B Instant**    | Rápido, leve                        |
| **Gemma 2 9B**              | Compacto, eficiente                 |
| **Mixtral 8x7B**            | Arquitetura MoE, raciocínio forte   |

<Tip>
Use `openclaw models list --provider groq` para obter a lista mais atualizada dos
modelos disponíveis na sua conta.
</Tip>

## Transcrição de áudio

O Groq também fornece transcrição rápida de áudio com base em Whisper. Quando configurado como um
provedor de entendimento de mídia, o OpenClaw usa o modelo `whisper-large-v3-turbo` do Groq
para transcrever mensagens de voz por meio da superfície compartilhada `tools.media.audio`.

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
    | Caminho compartilhado de configuração | `tools.media.audio` |
    | URL base padrão   | `https://api.groq.com/openai/v1` |
    | Modelo padrão     | `whisper-large-v3-turbo` |
    | Endpoint da API   | Compatível com OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Observação sobre ambiente">
    Se o Gateway for executado como daemon (launchd/systemd), verifique se `GROQ_API_KEY` está
    disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).

    <Warning>
    Chaves definidas apenas no seu shell interativo não ficam visíveis para processos do
    Gateway gerenciados por daemon. Use `~/.openclaw/.env` ou a configuração `env.shellEnv` para
    disponibilidade persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo ajustes de provedor e áudio.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Painel do Groq, documentação da API e preços.
  </Card>
  <Card title="Lista de modelos do Groq" href="https://console.groq.com/docs/models" icon="list">
    Catálogo oficial de modelos do Groq.
  </Card>
</CardGroup>
