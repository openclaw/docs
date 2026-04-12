---
read_when:
    - Você quer usar o Chutes com o OpenClaw
    - Você precisa do caminho de configuração com OAuth ou chave de API
    - Você quer o modelo padrão, os aliases ou o comportamento de descoberta
summary: Configuração do Chutes (OAuth ou chave de API, descoberta de modelos, aliases)
title: Chutes
x-i18n:
    generated_at: "2026-04-12T23:30:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07c52b1d1d2792412e6daabc92df5310434b3520116d9e0fd2ad26bfa5297e1c
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

O [Chutes](https://chutes.ai) expõe catálogos de modelos open source por meio de uma
API compatível com OpenAI. O OpenClaw oferece suporte tanto a OAuth no navegador quanto à
autenticação direta por chave de API para o provedor agrupado `chutes`.

| Propriedade | Valor                        |
| ----------- | ---------------------------- |
| Provedor    | `chutes`                     |
| API         | Compatível com OpenAI        |
| URL base    | `https://llm.chutes.ai/v1`   |
| Autenticação | OAuth ou chave de API (veja abaixo) |

## Primeiros passos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Execute o fluxo de onboarding com OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        O OpenClaw inicia o fluxo no navegador localmente, ou mostra um fluxo de URL + colar redirecionamento
        em hosts remotos/headless. Os tokens OAuth são renovados automaticamente por meio dos perfis de autenticação
        do OpenClaw.
      </Step>
      <Step title="Verifique o modelo padrão">
        Após o onboarding, o modelo padrão é definido como
        `chutes/zai-org/GLM-4.7-TEE` e o catálogo agrupado do Chutes é
        registrado.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Chave de API">
    <Steps>
      <Step title="Obtenha uma chave de API">
        Crie uma chave em
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Execute o fluxo de onboarding com chave de API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verifique o modelo padrão">
        Após o onboarding, o modelo padrão é definido como
        `chutes/zai-org/GLM-4.7-TEE` e o catálogo agrupado do Chutes é
        registrado.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Ambos os caminhos de autenticação registram o catálogo agrupado do Chutes e definem o modelo padrão como
`chutes/zai-org/GLM-4.7-TEE`. Variáveis de ambiente em tempo de execução: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Comportamento de descoberta

Quando a autenticação do Chutes está disponível, o OpenClaw consulta o catálogo do Chutes com essa
credencial e usa os modelos descobertos. Se a descoberta falhar, o OpenClaw recorre
a um catálogo estático agrupado para que o onboarding e a inicialização continuem funcionando.

## Aliases padrão

O OpenClaw registra três aliases de conveniência para o catálogo agrupado do Chutes:

| Alias           | Modelo de destino                                     |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catálogo inicial integrado

O catálogo de fallback agrupado inclui refs atuais do Chutes:

| Ref. do modelo                                        |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

## Exemplo de configuração

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Substituições de OAuth">
    Você pode personalizar o fluxo de OAuth com variáveis de ambiente opcionais:

    | Variável | Finalidade |
    | -------- | ---------- |
    | `CHUTES_CLIENT_ID` | ID de cliente OAuth personalizado |
    | `CHUTES_CLIENT_SECRET` | Segredo de cliente OAuth personalizado |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI de redirecionamento personalizada |
    | `CHUTES_OAUTH_SCOPES` | Escopos OAuth personalizados |

    Veja a [documentação de OAuth do Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    para requisitos de aplicativo de redirecionamento e ajuda.

  </Accordion>

  <Accordion title="Notas">
    - A descoberta por chave de API e por OAuth usam o mesmo id de provedor `chutes`.
    - Os modelos do Chutes são registrados como `chutes/<model-id>`.
    - Se a descoberta falhar na inicialização, o catálogo estático agrupado será usado automaticamente.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedor, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo ajustes de provedor.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Painel do Chutes e documentação da API.
  </Card>
  <Card title="Chaves de API do Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Crie e gerencie chaves de API do Chutes.
  </Card>
</CardGroup>
