---
read_when:
    - Você quer usar o Qwen com o OpenClaw
    - Você tem uma assinatura do Alibaba Cloud Token Plan
    - Você usou o Qwen OAuth anteriormente
summary: Use o Qwen Cloud por meio de seu plugin do OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-07-12T15:41:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud é um Plugin de provedor externo oficial do OpenClaw com o id canônico `qwen`. Ele é destinado aos endpoints Standard e Coding Plan do Qwen Cloud / Alibaba DashScope, disponibiliza o Token Plan como `qwen-token-plan`, mantém `modelstudio` como alias de compatibilidade, gerencia de forma independente o id de provedor personalizado `bailian-token-plan` documentado pela Alibaba e disponibiliza o fluxo de token do Qwen Portal como [`qwen-oauth`](/pt-BR/providers/qwen-oauth).

| Propriedade                         | Valor                                      |
| ----------------------------------- | ------------------------------------------ |
| Provedor                            | `qwen`                                     |
| Provedor do Token Plan              | `qwen-token-plan`                          |
| Provedor do Portal                  | [`qwen-oauth`](/pt-BR/providers/qwen-oauth)      |
| Variável de ambiente preferencial   | `QWEN_API_KEY`                             |
| Variável de ambiente do Token Plan  | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Também aceitas (compatibilidade)    | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| Estilo da API                       | Compatível com OpenAI                      |

<Tip>
`qwen3.7-plus` e `qwen3.6-plus` funcionam com os endpoints Coding Plan e Standard.
Para `qwen3.7-max` ou `qwen3.6-flash`, use um endpoint **Standard (pagamento conforme o uso)**.
</Tip>

## Instalar o Plugin

O `qwen` é distribuído como um Plugin externo oficial, não incluído no núcleo. Instale-o e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Primeiros passos

Escolha o tipo de plano e siga as etapas de configuração.

<Tabs>
  <Tab title="Coding Plan (assinatura)">
    **Mais indicado para:** acesso por assinatura por meio do Qwen Coding Plan.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API em [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Execute a integração inicial">
        Para o endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Para o endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Defina um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Os ids legados de opção de autenticação `modelstudio-*` e as referências de modelo
    `modelstudio/...` ainda funcionam como aliases de compatibilidade, mas os novos
    fluxos de configuração devem preferir os ids canônicos de opção de autenticação
    `qwen-*` e as referências de modelo `qwen/...`. Se você definir uma entrada
    personalizada exata `models.providers.modelstudio` com outro valor de `api`,
    esse provedor personalizado gerenciará as referências `modelstudio/...` em vez
    do alias de compatibilidade do Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pagamento conforme o uso)">
    **Mais indicado para:** acesso com pagamento conforme o uso por meio do endpoint Standard do Model Studio, incluindo `qwen3.7-max` e `qwen3.6-flash`, que não estão disponíveis no Coding Plan.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API em [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Execute a integração inicial">
        Para o endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Para o endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Defina um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Os ids legados de opção de autenticação `modelstudio-*` e as referências de modelo
    `modelstudio/...` ainda funcionam como aliases de compatibilidade, mas os novos
    fluxos de configuração devem preferir os ids canônicos de opção de autenticação
    `qwen-*` e as referências de modelo `qwen/...`. Se você definir uma entrada
    personalizada exata `models.providers.modelstudio` com outro valor de `api`,
    esse provedor personalizado gerenciará as referências `modelstudio/...` em vez
    do alias de compatibilidade do Qwen.
    </Note>

  </Tab>

  <Tab title="Token Plan (Edição para Equipes)">
    **Mais indicado para:** acesso por assinatura de equipe baseado em créditos ao Qwen e a modelos de terceiros compatíveis por meio do Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Obtenha sua chave dedicada">
        Atribua uma licença do Token Plan e crie a chave dedicada `sk-sp-...`. As chaves do Token Plan, do Coding Plan e de pagamento conforme o uso não são intercambiáveis. Consulte a [visão geral global do Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) ou a [visão geral do Token Plan na China](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Execute a integração inicial">
        Para o endpoint **Global / Internacional** em Singapura:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Para o endpoint **China** em Pequim:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Verifique o provedor">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Responda com: token plan pronto"
        ```
      </Step>
    </Steps>

    <Note>
    O guia do OpenClaw da Alibaba usa `bailian-token-plan` para um provedor
    personalizado manual. O Plugin registra esse id como proprietário de
    compatibilidade, mas as novas configurações devem usar `qwen-token-plan`.
    Uma entrada personalizada exata `models.providers.bailian-token-plan` mantém
    o controle do transporte e do catálogo configurados; ela nunca é mesclada
    ao catálogo canônico da OpenAI.
    </Note>

    <Warning>
    Use o Token Plan somente para sessões interativas do OpenClaw. Não o selecione
    para trabalhos Cron, scripts sem supervisão ou backends de aplicações. A Alibaba
    informa que o uso não interativo pode suspender a assinatura ou revogar sua chave
    de API.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Mais indicado para:** um token do Qwen Portal usado com `https://portal.qwen.ai/v1`.

    Consulte [Qwen OAuth / Portal](/pt-BR/providers/qwen-oauth) para ver a página dedicada
    do provedor e as notas de migração.

    <Steps>
      <Step title="Forneça seu token do Portal">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Defina um modelo padrão">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifique se o modelo está disponível">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    O `qwen-oauth` usa o mesmo nome de variável de ambiente `QWEN_API_KEY` que o
    provedor Qwen Cloud, mas armazena a autenticação sob o id de provedor
    `qwen-oauth` quando configurado por meio da integração inicial do OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Tipos de plano e endpoints

| Plano                              | Região | Opção de autenticação      | Endpoint                                                         |
| ---------------------------------- | ------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (assinatura)           | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (assinatura)           | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                        | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                                              |
| Standard (pagamento conforme o uso)| China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (pagamento conforme o uso)| Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (Edição para Equipes)   | China  | `qwen-token-plan-cn`       | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (Edição para Equipes)   | Global | `qwen-token-plan`          | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

O provedor seleciona automaticamente o endpoint com base na sua opção de
autenticação. As opções canônicas usam a família `qwen-*`; `modelstudio-*`
permanece apenas para compatibilidade. Substitua com um `baseUrl` personalizado
na configuração.

<Tip>
**Gerenciar chaves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentação:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

O OpenClaw distribui este catálogo estático do Qwen. O catálogo considera o
endpoint: configurações do Coding Plan omitem modelos que funcionam apenas no
endpoint Standard.

| Referência do modelo        | Entrada       | Contexto  | Observações                    |
| --------------------------- | ------------- | --------- | ------------------------------ |
| `qwen/qwen3.5-plus`         | texto, imagem | 1,000,000 | Modelo padrão                  |
| `qwen/qwen3.6-flash`        | texto, imagem | 1,000,000 | Somente endpoints Standard     |
| `qwen/qwen3.6-plus`         | texto, imagem | 1,000,000 | Coding Plan + Standard         |
| `qwen/qwen3.7-max`          | texto         | 1,000,000 | Somente endpoints Standard     |
| `qwen/qwen3.7-plus`         | texto, imagem | 1,000,000 | Coding Plan + Standard         |
| `qwen/qwen3-max-2026-01-23` | texto         | 262,144   | Linha Qwen Max                 |
| `qwen/qwen3-coder-next`     | texto         | 262,144   | Programação                    |
| `qwen/qwen3-coder-plus`     | texto         | 1,000,000 | Programação                    |
| `qwen/MiniMax-M2.5`         | texto         | 1,000,000 | Raciocínio habilitado          |
| `qwen/glm-5`                | texto         | 202,752   | GLM                            |
| `qwen/glm-4.7`              | texto         | 202,752   | GLM                            |
| `qwen/kimi-k2.5`            | texto, imagem | 262,144   | Moonshot AI por meio da Alibaba|
| `qwen-oauth/qwen3.5-plus`   | texto, imagem | 1,000,000 | Padrão do Qwen Portal          |

<Note>
A disponibilidade ainda pode variar de acordo com o endpoint e o plano de
cobrança, mesmo quando um modelo está presente no catálogo estático.
</Note>

### Catálogo do Token Plan

O Token Plan usa uma lista de permissões separada com correspondência exata de
strings. Os modelos do plano destinados apenas à geração de imagens não estão
incluídos aqui porque usam APIs diferentes.

| Referência do modelo                | Entrada       | Contexto  |
| ----------------------------------- | ------------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | texto         | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | texto, imagem | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | texto, imagem | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | texto, imagem | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | texto         | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | texto         | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | texto         | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | texto, imagem | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | texto, imagem | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | texto, imagem | 262,144   |
| `qwen-token-plan/glm-5.2`           | texto         | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | texto         | 202,752   |
| `qwen-token-plan/glm-5`             | texto         | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | texto         | 196,608   |

## Controles de raciocínio

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` e `qwen3.6-plus` têm
raciocínio habilitado no catálogo integrado. Para modelos de raciocínio da família `qwen`,
o provedor mapeia os níveis de pensamento do OpenClaw para o sinalizador de solicitação
de nível superior `enable_thinking` do DashScope: o pensamento desabilitado envia `enable_thinking: false`;
qualquer outro nível envia `enable_thinking: true`. Modelos personalizados podem optar por uma
carga de pensamento alternativa no modelo de chat definindo
`compat.thinkingFormat: "qwen-chat-template"` na entrada do modelo.

Os modelos Token Plan também são marcados como compatíveis com raciocínio. `kimi-k2.7-code` e
`MiniMax-M2.5` funcionam somente com pensamento, portanto o OpenClaw mantém o pensamento habilitado mesmo quando
a sessão solicita `/think off`. O DeepSeek V4 mapeia de `minimal` até `high` para
o esforço `high` do serviço e mapeia `xhigh` ou `max` para `max`. O GLM 5.2 aceita
todo o intervalo de `minimal` até `max`; o GLM 5.1 e o GLM 5 aceitam até
`xhigh`, e os três usam `high` como padrão. Outros modelos híbridos seguem o
estado de ativação/desativação solicitado.

## Complementos multimodais

O plugin `qwen` disponibiliza recursos multimodais somente nos endpoints
**Standard** do DashScope, não nos endpoints do Coding Plan:

- **Compreensão de imagens e vídeos** por meio do `qwen-vl-max-latest`
- **Geração de vídeos Wan** por meio do `wan2.6-t2v` (padrão), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

A compreensão de mídia é resolvida automaticamente a partir da autenticação Qwen configurada; nenhuma
configuração adicional é necessária. Certifique-se de usar um endpoint Standard (pagamento conforme o uso) para
que a compreensão de mídia funcione.

Para tornar o Qwen o provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Limites da geração de vídeos: 1 vídeo de saída por solicitação, até 1 imagem de entrada
(imagem para vídeo), até 4 vídeos de entrada (vídeo para vídeo), duração máxima de 10 segundos.
Compatível com `size`, `aspectRatio`, `resolution`, `audio` e
`watermark`. As entradas de imagem/vídeo de referência exigem URLs http(s) remotas; caminhos de
arquivos locais são rejeitados antecipadamente porque o endpoint de vídeo do DashScope não
aceita buffers locais enviados para essas referências.

<Note>
Consulte [Geração de vídeos](/pt-BR/tools/video-generation) para ver os parâmetros compartilhados da ferramenta, a seleção do provedor e o comportamento de failover.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Disponibilidade do Qwen 3.6 e 3.7">
    `qwen3.7-plus` e `qwen3.6-plus` estão disponíveis nos endpoints Coding Plan e Standard. `qwen3.7-max` e `qwen3.6-flash` estão disponíveis somente no Standard. Os endpoints Standard (pagamento conforme o uso) são:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    O OpenClaw omite `qwen3.7-max` e `qwen3.6-flash` dos catálogos do Coding Plan.
    Se um endpoint do Coding Plan retornar um erro de "modelo não compatível" para qualquer um deles,
    mude para o endpoint Standard correspondente e sua chave.

  </Accordion>

  <Accordion title="Roteamento regional da geração de vídeos">
    O OpenClaw mapeia a região Qwen configurada para o host AIGC correspondente do DashScope
    antes de enviar um trabalho de vídeo:

    - Global/Internacional: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Um `models.providers.qwen.baseUrl` normal que aponte para hosts Qwen do Coding Plan
    ou Standard ainda roteia a geração de vídeos para o endpoint regional de vídeo
    correspondente do DashScope.

  </Accordion>

  <Accordion title="Compatibilidade do uso de streaming">
    Os endpoints nativos do Qwen anunciam compatibilidade com o uso de streaming no transporte
    compartilhado `openai-completions`, portanto os ids de provedores personalizados compatíveis com o DashScope
    que apontam para os mesmos hosts nativos herdam o mesmo comportamento sem exigir
    especificamente o id do provedor integrado `qwen`. Isso se aplica aos endpoints Coding Plan,
    Standard e Token Plan:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Plano de recursos">
    O plugin `qwen` está sendo posicionado como o local do fornecedor para toda a
    plataforma Qwen Cloud, não apenas para modelos de programação/texto.

    - **Modelos de texto/chat:** disponíveis por meio do plugin
    - **Chamadas de ferramentas, saída estruturada, pensamento:** herdados do transporte compatível com OpenAI
    - **Geração de imagens:** planejada na camada de plugin do provedor
    - **Compreensão de imagens/vídeos:** disponível por meio do plugin no endpoint Standard
    - **Fala/áudio:** planejada na camada de plugin do provedor
    - **Embeddings/reclassificação de memória:** planejados por meio da interface do adaptador de embeddings
    - **Geração de vídeos:** disponível por meio do plugin pelo recurso compartilhado de geração de vídeos

  </Accordion>

  <Accordion title="Configuração do ambiente e do daemon">
    Se o Gateway for executado como um daemon (launchd/systemd), certifique-se de que `QWEN_API_KEY`
    ou `QWEN_TOKEN_PLAN_API_KEY` esteja disponível para esse processo (por exemplo, em
    `~/.openclaw/.env` ou por meio de `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção do provedor.
  </Card>
  <Card title="Alibaba Model Studio" href="/pt-BR/providers/alibaba" icon="cloud">
    Provedor integrado de geração de vídeos Wan na mesma plataforma DashScope.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e perguntas frequentes.
  </Card>
</CardGroup>
