---
read_when:
    - Você quer usar o Qwen com o OpenClaw
    - Você usou anteriormente o OAuth da Qwen
summary: Use o Qwen Cloud por meio de seu Plugin do OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:06:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

O OpenClaw agora trata o Qwen como um plugin de provedor de primeira classe com o id canônico
`qwen`. O plugin de provedor tem como alvo os endpoints Qwen Cloud / Alibaba DashScope e
Coding Plan, mantém ids legados `modelstudio` funcionando como um alias de compatibilidade
e também expõe o fluxo de token do Qwen Portal como provedor `qwen-oauth`.

- Provedor: `qwen`
- Provedor do Portal: [`qwen-oauth`](/pt-BR/providers/qwen-oauth)
- Variável de ambiente preferida: `QWEN_API_KEY`
- Também aceitas para compatibilidade: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo da API: compatível com OpenAI

<Tip>
Se você quiser `qwen3.6-plus`, prefira o endpoint **Standard (pague conforme o uso)**.
O suporte ao Coding Plan pode ficar atrás do catálogo público.
</Tip>

## Instalar plugin

Instale o plugin oficial e reinicie o Gateway:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Primeiros passos

Escolha o tipo de plano e siga as etapas de configuração.

<Tabs>
  <Tab title="Coding Plan (assinatura)">
    **Melhor para:** acesso baseado em assinatura pelo Qwen Coding Plan.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API em [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Execute o onboarding">
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
    Os ids legados de auth-choice `modelstudio-*` e as refs de modelo `modelstudio/...` ainda
    funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir os ids de auth-choice
    canônicos `qwen-*` e as refs de modelo `qwen/...`. Se você definir uma entrada
    `models.providers.modelstudio` personalizada exata com outro valor de `api`, esse
    provedor personalizado passa a controlar as refs `modelstudio/...` em vez do alias de compatibilidade
    do Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pague conforme o uso)">
    **Melhor para:** acesso pago conforme o uso pelo endpoint Standard Model Studio, incluindo modelos como `qwen3.6-plus` que podem não estar disponíveis no Coding Plan.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API em [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Execute o onboarding">
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
    Os ids legados de auth-choice `modelstudio-*` e as refs de modelo `modelstudio/...` ainda
    funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir os ids de auth-choice
    canônicos `qwen-*` e as refs de modelo `qwen/...`. Se você definir uma entrada
    `models.providers.modelstudio` personalizada exata com outro valor de `api`, esse
    provedor personalizado passa a controlar as refs `modelstudio/...` em vez do alias de compatibilidade
    do Qwen.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Melhor para:** um token do Qwen Portal contra `https://portal.qwen.ai/v1`.

    Consulte [Qwen OAuth / Portal](/pt-BR/providers/qwen-oauth) para a página dedicada do provedor
    e notas de migração.

    <Steps>
      <Step title="Forneça seu token do portal">
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
    `qwen-oauth` usa o mesmo nome de variável de ambiente `QWEN_API_KEY` que o provedor
    DashScope, mas armazena a autenticação sob o id de provedor `qwen-oauth` quando configurado
    pelo onboarding do OpenClaw.
    </Note>

  </Tab>
</Tabs>

## Tipos de plano e endpoints

| Plano                      | Região | Escolha de autenticação    | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pague conforme o uso) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pague conforme o uso) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (assinatura)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (assinatura)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

O provedor seleciona automaticamente o endpoint com base na sua escolha de autenticação. As escolhas
canônicas usam a família `qwen-*`; `modelstudio-*` permanece apenas para compatibilidade.
Você pode substituir isso com um `baseUrl` personalizado na configuração.

<Tip>
**Gerenciar chaves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentação:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

Atualmente, o OpenClaw distribui este catálogo estático da Qwen. O catálogo configurado é
ciente do endpoint: configurações do Coding Plan omitem modelos que só são conhecidos por funcionar no
endpoint Standard.

| Ref. do modelo              | Entrada         | Contexto  | Observações                                        |
| --------------------------- | --------------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | texto, imagem   | 1,000,000 | Modelo padrão                                      |
| `qwen/qwen3.6-plus`         | texto, imagem   | 1,000,000 | Prefira endpoints Standard quando precisar deste modelo |
| `qwen/qwen3-max-2026-01-23` | texto           | 262,144   | Linha Qwen Max                                     |
| `qwen/qwen3-coder-next`     | texto           | 262,144   | Codificação                                        |
| `qwen/qwen3-coder-plus`     | texto           | 1,000,000 | Codificação                                        |
| `qwen/MiniMax-M2.5`         | texto           | 1,000,000 | Raciocínio habilitado                              |
| `qwen/glm-5`                | texto           | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | texto           | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | texto, imagem   | 262,144   | Moonshot AI via Alibaba                            |
| `qwen-oauth/qwen3.5-plus`   | texto, imagem   | 1,000,000 | Padrão do Qwen Portal                              |

<Note>
A disponibilidade ainda pode variar por endpoint e plano de cobrança, mesmo quando um modelo está
presente no catálogo estático.
</Note>

## Controles de raciocínio

Para modelos Qwen Cloud com raciocínio habilitado, o provedor mapeia os
níveis de raciocínio do OpenClaw para a flag de solicitação de nível superior `enable_thinking` do DashScope. O
raciocínio desabilitado envia `enable_thinking: false`; outros níveis de raciocínio enviam
`enable_thinking: true`.

## Complementos multimodais

O Plugin `qwen` também expõe recursos multimodais nos endpoints DashScope
**Standard** (não nos endpoints do Coding Plan):

- **Compreensão de vídeo** via `qwen-vl-max-latest`
- **Geração de vídeo Wan** via `wan2.6-t2v` (padrão), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Para usar Qwen como provedor de vídeo padrão:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Compreensão de imagem e vídeo">
    O Plugin Qwen registra compreensão de mídia para imagens e vídeo
    nos endpoints DashScope **Standard** (não nos endpoints do Coding Plan).

    | Propriedade      | Valor                 |
    | ------------- | --------------------- |
    | Modelo         | `qwen-vl-max-latest`  |
    | Entrada compatível | Imagens, vídeo       |

    A compreensão de mídia é resolvida automaticamente a partir da autenticação Qwen configurada — nenhuma
    configuração adicional é necessária. Certifique-se de estar usando um endpoint Standard (pré-pago)
    para suporte à compreensão de mídia.

  </Accordion>

  <Accordion title="Disponibilidade do Qwen 3.6 Plus">
    `qwen3.6-plus` está disponível nos endpoints Model Studio Standard (pré-pagos):

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Se os endpoints do Coding Plan retornarem um erro de "modelo incompatível" para
    `qwen3.6-plus`, mude para Standard (pré-pago) em vez do par de endpoint/chave do
    Coding Plan.

    O catálogo estático Qwen do OpenClaw não anuncia `qwen3.6-plus` em endpoints do Coding
    Plan, mas entradas `qwen/qwen3.6-plus` configuradas explicitamente em
    `models.providers.qwen.models` são respeitadas em baseUrls do Coding Plan, para que você
    possa optar por esse modelo se a Aliyun o habilitar na sua assinatura. A
    API upstream ainda decide se a chamada terá sucesso.

  </Accordion>

  <Accordion title="Plano de recursos">
    O Plugin `qwen` está sendo posicionado como o lar do fornecedor para toda a superfície do Qwen
    Cloud, não apenas modelos de codificação/texto.

    - **Modelos de texto/chat:** disponíveis por meio do Plugin
    - **Chamadas de ferramenta, saída estruturada, raciocínio:** herdados do transporte compatível com OpenAI
    - **Geração de imagem:** planejada na camada de Plugin de provedor
    - **Compreensão de imagem/vídeo:** disponível por meio do Plugin no endpoint Standard
    - **Fala/áudio:** planejado na camada de Plugin de provedor
    - **Embeddings/reclassificação de memória:** planejados por meio da superfície do adaptador de embeddings
    - **Geração de vídeo:** disponível por meio do Plugin através do recurso compartilhado de geração de vídeo

  </Accordion>

  <Accordion title="Detalhes da geração de vídeo">
    Para geração de vídeo, o OpenClaw mapeia a região Qwen configurada para o host
    DashScope AIGC correspondente antes de enviar o trabalho:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Isso significa que um `models.providers.qwen.baseUrl` normal apontando para os hosts
    Qwen do Coding Plan ou Standard ainda mantém a geração de vídeo no endpoint regional
    de vídeo DashScope correto.

    Limites atuais de geração de vídeo da Qwen:

    - Até **1** vídeo de saída por solicitação
    - Até **1** imagem de entrada
    - Até **4** vídeos de entrada
    - Até **10 segundos** de duração
    - Compatível com `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
    - O modo de imagem/vídeo de referência atualmente exige **URLs http(s) remotas**. Caminhos
      de arquivos locais são rejeitados antecipadamente porque o endpoint de vídeo DashScope não
      aceita buffers locais enviados para essas referências.

  </Accordion>

  <Accordion title="Compatibilidade de uso em streaming">
    Endpoints nativos do Model Studio anunciam compatibilidade de uso em streaming no
    transporte `openai-completions` compartilhado. Agora o OpenClaw determina isso com base nas
    capacidades do endpoint, portanto IDs de provedores personalizados compatíveis com DashScope que apontam para os
    mesmos hosts nativos herdam o mesmo comportamento de uso em streaming em vez de
    exigir especificamente o ID de provedor `qwen` integrado.

    A compatibilidade de uso com streaming nativo se aplica tanto aos hosts do Coding Plan quanto
    aos hosts Padrão compatíveis com DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiões de endpoints multimodais">
    Superfícies multimodais (compreensão de vídeo e geração de vídeo Wan) usam os
    endpoints DashScope **Padrão**, não os endpoints do Coding Plan:

    - URL base Padrão Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL base Padrão da China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configuração de ambiente e daemon">
    Se o Gateway for executado como um daemon (launchd/systemd), garanta que `QWEN_API_KEY` esteja
    disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/pt-BR/providers/alibaba" icon="cloud">
    Provedor ModelStudio legado e notas de migração.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e perguntas frequentes.
  </Card>
</CardGroup>
