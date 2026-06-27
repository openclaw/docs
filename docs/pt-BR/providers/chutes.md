---
read_when:
    - Você quer usar o Chutes com o OpenClaw
    - Você precisa do caminho de configuração de OAuth ou de chave de API
    - Você quer o modelo padrão, aliases ou comportamento de descoberta
summary: Configuração do Chutes (OAuth ou chave de API, descoberta de modelos, aliases)
title: Calhas
x-i18n:
    generated_at: "2026-06-27T18:02:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) expõe catálogos de modelos de código aberto por meio de uma
API compatível com OpenAI. O OpenClaw oferece suporte tanto a OAuth pelo navegador quanto à
autenticação direta por chave de API para o provedor `chutes`.

| Propriedade | Valor                        |
| -------- | ---------------------------- |
| Provedor | `chutes`                     |
| API      | Compatível com OpenAI            |
| URL base | `https://llm.chutes.ai/v1`   |
| Autenticação     | OAuth ou chave de API (veja abaixo) |

## Instalar Plugin

Instale o Plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Primeiros passos

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Execute o fluxo de integração OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        O OpenClaw inicia o fluxo no navegador localmente ou mostra um fluxo com URL + colar redirecionamento
        em hosts remotos/sem interface gráfica. Tokens OAuth são atualizados automaticamente por meio dos perfis de autenticação
        do OpenClaw.
      </Step>
      <Step title="Verifique o modelo padrão">
        Após a integração, o modelo padrão é definido como
        `chutes/zai-org/GLM-4.7-TEE` e o catálogo estático da Chutes é
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
        `chutes/zai-org/GLM-4.7-TEE` e o catálogo estático da Chutes é
        registrado.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Ambos os caminhos de autenticação registram o catálogo estático da Chutes e definem o modelo padrão como
`chutes/zai-org/GLM-4.7-TEE`. Variáveis de ambiente de runtime: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Comportamento de descoberta

Quando a autenticação da Chutes está disponível, o OpenClaw consulta o catálogo da Chutes com essa
credencial e usa os modelos descobertos. Se a descoberta falhar, o OpenClaw volta
para um catálogo estático, para que a integração e a inicialização continuem funcionando.

## Aliases padrão

O OpenClaw registra três aliases de conveniência para o catálogo estático da Chutes:

| Alias           | Modelo de destino                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catálogo inicial integrado

O catálogo estático de fallback inclui refs atuais da Chutes:

| Ref do modelo                                             |
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

    Consulte a [documentação de OAuth da Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    para requisitos de aplicativo de redirecionamento e ajuda.

  </Accordion>

  <Accordion title="Observações">
    - A descoberta por chave de API e por OAuth usa o mesmo id de provedor `chutes`.
    - Modelos da Chutes são registrados como `chutes/<model-id>`.
    - Se a descoberta falhar na inicialização, o catálogo estático será usado automaticamente.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedor, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema de configuração completo, incluindo configurações de provedor.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Painel da Chutes e documentação da API.
  </Card>
  <Card title="Chaves de API da Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Crie e gerencie chaves de API da Chutes.
  </Card>
</CardGroup>
