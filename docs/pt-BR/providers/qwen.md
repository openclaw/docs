---
read_when:
    - Você quer usar o Qwen com o OpenClaw
    - Você usou anteriormente o Qwen OAuth
summary: Use o Qwen Cloud por meio do provedor qwen incluído no OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-30T10:05:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**O OAuth do Qwen foi removido.** A integração OAuth de camada gratuita
(`qwen-portal`) que usava pontos de extremidade de `portal.qwen.ai` não está mais disponível.
Consulte a [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
contexto.

</Warning>

O OpenClaw agora trata o Qwen como um provedor incluído de primeira classe com o ID canônico
`qwen`. O provedor incluído direciona para os pontos de extremidade do Qwen Cloud / Alibaba DashScope e
Coding Plan e mantém IDs legados `modelstudio` funcionando como um alias de
compatibilidade.

- Provedor: `qwen`
- Variável de ambiente preferida: `QWEN_API_KEY`
- Também aceitas para compatibilidade: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatível com OpenAI

<Tip>
Se você quiser `qwen3.6-plus`, prefira o ponto de extremidade **Standard (pague conforme o uso)**.
O suporte do Coding Plan pode ficar atrás do catálogo público.
</Tip>

## Introdução

Escolha seu tipo de plano e siga as etapas de configuração.

<Tabs>
  <Tab title="Coding Plan (assinatura)">
    **Melhor para:** acesso baseado em assinatura pelo Qwen Coding Plan.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API em [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Execute a integração inicial">
        Para o ponto de extremidade **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Para o ponto de extremidade da **China**:

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
    IDs de `auth-choice` legados `modelstudio-*` e referências de modelo `modelstudio/...` ainda
    funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir os IDs de `auth-choice`
    canônicos `qwen-*` e referências de modelo `qwen/...`. Se você definir uma entrada
    personalizada exata `models.providers.modelstudio` com outro valor de `api`, esse
    provedor personalizado será dono das referências `modelstudio/...` em vez do alias de compatibilidade
    do Qwen.
    </Note>

  </Tab>

  <Tab title="Standard (pague conforme o uso)">
    **Melhor para:** acesso pago conforme o uso pelo ponto de extremidade Standard Model Studio, incluindo modelos como `qwen3.6-plus` que podem não estar disponíveis no Coding Plan.

    <Steps>
      <Step title="Obtenha sua chave de API">
        Crie ou copie uma chave de API em [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Execute a integração inicial">
        Para o ponto de extremidade **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Para o ponto de extremidade da **China**:

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
    IDs de `auth-choice` legados `modelstudio-*` e referências de modelo `modelstudio/...` ainda
    funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir os IDs de `auth-choice`
    canônicos `qwen-*` e referências de modelo `qwen/...`. Se você definir uma entrada
    personalizada exata `models.providers.modelstudio` com outro valor de `api`, esse
    provedor personalizado será dono das referências `modelstudio/...` em vez do alias de compatibilidade
    do Qwen.
    </Note>

  </Tab>
</Tabs>

## Tipos de plano e pontos de extremidade

| Plano                      | Região | Opção de autenticação      | Ponto de extremidade                            |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pague conforme o uso) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pague conforme o uso) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (assinatura)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (assinatura)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

O provedor seleciona automaticamente o ponto de extremidade com base na sua opção de autenticação. As opções
canônicas usam a família `qwen-*`; `modelstudio-*` permanece apenas para compatibilidade.
Você pode substituir isso com um `baseUrl` personalizado na configuração.

<Tip>
**Gerenciar chaves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Documentação:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

O OpenClaw atualmente inclui este catálogo Qwen integrado. O catálogo configurado é
ciente do ponto de extremidade: configurações do Coding Plan omitem modelos que são conhecidos por funcionar
apenas no ponto de extremidade Standard.

| Referência de modelo        | Entrada     | Contexto  | Observações                                        |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | texto, imagem | 1,000,000 | Modelo padrão                                      |
| `qwen/qwen3.6-plus`         | texto, imagem | 1,000,000 | Prefira pontos de extremidade Standard quando precisar deste modelo |
| `qwen/qwen3-max-2026-01-23` | texto        | 262,144   | Linha Qwen Max                                     |
| `qwen/qwen3-coder-next`     | texto        | 262,144   | Codificação                                        |
| `qwen/qwen3-coder-plus`     | texto        | 1,000,000 | Codificação                                        |
| `qwen/MiniMax-M2.5`         | texto        | 1,000,000 | Raciocínio habilitado                              |
| `qwen/glm-5`                | texto        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | texto        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | texto, imagem | 262,144   | Moonshot AI via Alibaba                            |

<Note>
A disponibilidade ainda pode variar por ponto de extremidade e plano de cobrança, mesmo quando um modelo está
presente no catálogo integrado.
</Note>

## Controles de raciocínio

Para modelos Qwen Cloud com raciocínio habilitado, o provedor incluído mapeia os
níveis de raciocínio do OpenClaw para o sinalizador de solicitação `enable_thinking` de nível superior do DashScope. O raciocínio
desativado envia `enable_thinking: false`; outros níveis de raciocínio enviam
`enable_thinking: true`.

## Complementos multimodais

O Plugin `qwen` também expõe capacidades multimodais nos pontos de extremidade DashScope **Standard**
(não nos pontos de extremidade do Coding Plan):

- **Compreensão de vídeo** via `qwen-vl-max-latest`
- **Geração de vídeo Wan** via `wan2.6-t2v` (padrão), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Para usar o Qwen como provedor de vídeo padrão:

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
Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros de ferramenta compartilhados, seleção de provedor e comportamento de failover.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Compreensão de imagem e vídeo">
    O Plugin Qwen incluído registra compreensão de mídia para imagens e vídeo
    nos pontos de extremidade DashScope **Standard** (não nos pontos de extremidade do Coding Plan).

    | Propriedade      | Valor                 |
    | ------------- | --------------------- |
    | Modelo         | `qwen-vl-max-latest`  |
    | Entrada compatível | Imagens, vídeo       |

    A compreensão de mídia é resolvida automaticamente a partir da autenticação Qwen configurada, sem
    necessidade de configuração adicional. Garanta que você esteja usando um ponto de extremidade Standard (pague conforme o uso)
    para suporte à compreensão de mídia.

  </Accordion>

  <Accordion title="Disponibilidade do Qwen 3.6 Plus">
    `qwen3.6-plus` está disponível nos pontos de extremidade Standard (pague conforme o uso) do Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Se os pontos de extremidade do Coding Plan retornarem um erro de "modelo não compatível" para
    `qwen3.6-plus`, mude para Standard (pague conforme o uso) em vez do par de ponto de extremidade/chave do
    Coding Plan.

    O catálogo Qwen incluído do OpenClaw não anuncia `qwen3.6-plus` em pontos de extremidade do Coding
    Plan, mas entradas `qwen/qwen3.6-plus` configuradas explicitamente em
    `models.providers.qwen.models` são respeitadas em baseUrls do Coding Plan para que você
    possa optar por esse modelo se a Aliyun o habilitar na sua assinatura. A
    API upstream ainda decide se a chamada terá sucesso.

  </Accordion>

  <Accordion title="Plano de capacidades">
    O Plugin `qwen` está sendo posicionado como o lar do fornecedor para toda a superfície do Qwen
    Cloud, não apenas modelos de codificação/texto.

    - **Modelos de texto/chat:** incluídos agora
    - **Chamada de ferramentas, saída estruturada, raciocínio:** herdados do transporte compatível com OpenAI
    - **Geração de imagem:** planejada na camada de Plugin de provedor
    - **Compreensão de imagem/vídeo:** incluída agora no ponto de extremidade Standard
    - **Fala/áudio:** planejado na camada de Plugin de provedor
    - **Embeddings/reclassificação de memória:** planejado pela superfície do adaptador de embeddings
    - **Geração de vídeo:** incluída agora pela capacidade compartilhada de geração de vídeo

  </Accordion>

  <Accordion title="Detalhes de geração de vídeo">
    Para geração de vídeo, o OpenClaw mapeia a região Qwen configurada para o host AIGC
    DashScope correspondente antes de enviar o trabalho:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Isso significa que um `models.providers.qwen.baseUrl` normal apontando para hosts Qwen
    do Coding Plan ou Standard ainda mantém a geração de vídeo no ponto de extremidade regional
    correto de vídeo do DashScope.

    Limites atuais de geração de vídeo Qwen incluídos:

    - Até **1** vídeo de saída por solicitação
    - Até **1** imagem de entrada
    - Até **4** vídeos de entrada
    - Até **10 segundos** de duração
    - Compatível com `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
    - O modo de imagem/vídeo de referência atualmente exige **URLs http(s) remotas**. Caminhos de
      arquivos locais são rejeitados antecipadamente porque o ponto de extremidade de vídeo do DashScope não
      aceita buffers locais enviados para essas referências.

  </Accordion>

  <Accordion title="Compatibilidade de uso em streaming">
    Pontos de extremidade nativos do Model Studio anunciam compatibilidade de uso em streaming no
    transporte compartilhado `openai-completions`. O OpenClaw agora se baseia nas capacidades
    do ponto de extremidade para isso, de modo que IDs de provedores personalizados compatíveis com DashScope que direcionam para os
    mesmos hosts nativos herdem o mesmo comportamento de uso em streaming, em vez de
    exigir especificamente o ID do provedor integrado `qwen`.

    A compatibilidade de uso em streaming nativo se aplica tanto aos hosts do Coding Plan quanto
    aos hosts compatíveis com DashScope Standard:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiões de pontos de extremidade multimodais">
    Superfícies multimodais (compreensão de vídeo e geração de vídeo Wan) usam os
    pontos de extremidade DashScope **Standard**, não os pontos de extremidade do Coding Plan:

    - URL base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL base Standard da China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configuração de ambiente e daemon">
    Se o Gateway for executado como um daemon (launchd/systemd), certifique-se de que `QWEN_API_KEY` esteja
    disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionados

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
    Solução de problemas gerais e perguntas frequentes.
  </Card>
</CardGroup>
