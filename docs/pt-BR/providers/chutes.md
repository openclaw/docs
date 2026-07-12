---
read_when:
    - Você quer usar o Chutes com o OpenClaw
    - Você precisa do caminho de configuração do OAuth ou da chave de API
    - Você quer o modelo padrão, aliases ou o comportamento de descoberta
summary: Configuração do Chutes (OAuth ou chave de API, descoberta de modelos, aliases)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T15:30:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) disponibiliza catálogos de modelos de código aberto por meio de uma
API compatível com a OpenAI. O OpenClaw oferece suporte tanto a OAuth pelo navegador quanto à autenticação por chave de API.

| Propriedade               | Valor                                                   |
| ------------------------- | ------------------------------------------------------- |
| Provedor                  | `chutes`                                                |
| Plugin                    | pacote externo oficial (`@openclaw/chutes-provider`)    |
| API                       | compatível com a OpenAI                                 |
| URL base                  | `https://llm.chutes.ai/v1`                              |
| Autenticação              | OAuth ou chave de API (veja abaixo)                     |
| Variáveis de ambiente de runtime | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`           |

`CHUTES_OAUTH_TOKEN` fornece diretamente um token de acesso OAuth já obtido
(por exemplo, em CI), ignorando o fluxo interativo pelo navegador abaixo.

## Instalar o Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Primeiros passos

Ambos os caminhos definem o modelo padrão como `chutes/zai-org/GLM-4.7-TEE` e registram
o catálogo do Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Execute o fluxo de integração do OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        O OpenClaw inicia o fluxo pelo navegador localmente ou exibe um fluxo com URL +
        colagem do redirecionamento em hosts remotos/sem interface gráfica. Os tokens OAuth são atualizados automaticamente por meio dos
        perfis de autenticação do OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Chave de API">
    <Steps>
      <Step title="Obtenha uma chave de API">
        Crie uma chave em
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Execute o fluxo de integração da chave de API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Comportamento da descoberta

Quando a autenticação do Chutes está disponível, o OpenClaw consulta `GET /v1/models` com essa
credencial e usa os modelos descobertos, armazenados em cache por 5 minutos para cada
credencial. Em caso de chave expirada/não autorizada (HTTP 401), o OpenClaw tenta novamente uma vez
sem credenciais. Se a descoberta ainda não retornar nenhuma linha, falhar ou retornar qualquer
outro status que não seja 2xx, ele recorre ao catálogo estático incluído (tanto a descoberta por chave de API
quanto por OAuth usam esse mesmo caminho). Se a descoberta falhar na inicialização, o
catálogo estático será usado automaticamente.

## Aliases padrão

O OpenClaw registra três aliases convenientes para o catálogo do Chutes:

| Alias           | Modelo de destino                                      |
| --------------- | ------------------------------------------------------ |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                           |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                 |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`  |

## Catálogo inicial integrado

O catálogo de fallback incluído tem 47 modelos. Uma amostra representativa das referências atuais:

| Referência do modelo                                  |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Execute `openclaw models list --all --provider chutes` para ver a lista completa.

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
    Personalize o fluxo OAuth com variáveis de ambiente opcionais:

    | Variável | Finalidade |
    | -------- | ---------- |
    | `CHUTES_CLIENT_ID` | ID do cliente OAuth (solicitado se não estiver definido) |
    | `CHUTES_CLIENT_SECRET` | Segredo do cliente OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI de redirecionamento (padrão: `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Escopos separados por espaços (padrão: `openid profile chutes:invoke`) |

    Consulte a [documentação de OAuth do Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    para ver os requisitos do aplicativo de redirecionamento e obter ajuda.

  </Accordion>

  <Accordion title="Observações">
    - Os modelos do Chutes são registrados como `chutes/<model-id>`.
    - O Chutes não informa o uso de tokens durante o streaming (`supportsUsageInStreaming: false`); os totais de uso ainda são exibidos quando o stream é concluído.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Regras de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração, incluindo as configurações de provedores.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Painel e documentação da API do Chutes.
  </Card>
  <Card title="Chaves de API do Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Crie e gerencie chaves de API do Chutes.
  </Card>
</CardGroup>
