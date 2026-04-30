---
read_when:
    - Você quer usar o Chutes com o OpenClaw
    - Você precisa do caminho de configuração do OAuth ou da chave de API
    - Você quer o modelo padrão, os apelidos ou o comportamento de descoberta
summary: Configuração do Chutes (OAuth ou chave de API, descoberta de modelos, apelidos)
title: Chutes
x-i18n:
    generated_at: "2026-04-30T10:04:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) expõe catálogos de modelos open-source por meio de uma
API compatível com OpenAI. O OpenClaw oferece suporte tanto a OAuth no navegador quanto à
autenticação direta por chave de API para o provedor `chutes` incluído.

| Propriedade | Valor                        |
| -------- | ---------------------------- |
| Provedor | `chutes`                     |
| API      | Compatível com OpenAI        |
| URL base | `https://llm.chutes.ai/v1`   |
| Autenticação | OAuth ou chave de API (veja abaixo) |

## Primeiros passos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Execute o fluxo de integração OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        O OpenClaw inicia o fluxo do navegador localmente ou mostra uma URL + fluxo
        de colagem de redirecionamento em hosts remotos/sem interface gráfica. Os tokens OAuth
        são atualizados automaticamente por meio dos perfis de autenticação do OpenClaw.
      </Step>
      <Step title="Verifique o modelo padrão">
        Após a integração, o modelo padrão é definido como
        `chutes/zai-org/GLM-4.7-TEE` e o catálogo Chutes incluído é
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
      <Step title="Execute o fluxo de integração por chave de API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verifique o modelo padrão">
        Após a integração, o modelo padrão é definido como
        `chutes/zai-org/GLM-4.7-TEE` e o catálogo Chutes incluído é
        registrado.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Ambos os caminhos de autenticação registram o catálogo Chutes incluído e definem o modelo padrão como
`chutes/zai-org/GLM-4.7-TEE`. Variáveis de ambiente em tempo de execução: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Comportamento de descoberta

Quando a autenticação Chutes está disponível, o OpenClaw consulta o catálogo Chutes com essa
credencial e usa os modelos descobertos. Se a descoberta falhar, o OpenClaw recorre
a um catálogo estático incluído para que a integração e a inicialização ainda funcionem.

## Aliases padrão

O OpenClaw registra três aliases de conveniência para o catálogo Chutes incluído:

| Alias           | Modelo de destino                                    |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catálogo inicial integrado

O catálogo de fallback incluído contém refs Chutes atuais:

| Ref do modelo                                         |
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
    Você pode personalizar o fluxo OAuth com variáveis de ambiente opcionais:

    | Variável | Finalidade |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID de cliente OAuth personalizado |
    | `CHUTES_CLIENT_SECRET` | Segredo de cliente OAuth personalizado |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI de redirecionamento personalizada |
    | `CHUTES_OAUTH_SCOPES` | Escopos OAuth personalizados |

    Consulte a [documentação de OAuth do Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    para requisitos e ajuda sobre apps de redirecionamento.

  </Accordion>

  <Accordion title="Observações">
    - A descoberta por chave de API e OAuth usa o mesmo ID de provedor `chutes`.
    - Os modelos Chutes são registrados como `chutes/<model-id>`.
    - Se a descoberta falhar na inicialização, o catálogo estático incluído será usado automaticamente.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedor, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema de configuração completo, incluindo configurações de provedor.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Painel do Chutes e documentação da API.
  </Card>
  <Card title="Chaves de API do Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Crie e gerencie chaves de API do Chutes.
  </Card>
</CardGroup>
