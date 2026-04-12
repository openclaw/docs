---
read_when:
    - Você quer usar o Qwen com o OpenClaw
    - Você usava OAuth do Qwen anteriormente
summary: Usar o Qwen Cloud pelo provedor `qwen` empacotado do OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-12T23:32:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5247f851ef891645df6572d748ea15deeea47cd1d75858bc0d044a2930065106
    source_path: providers/qwen.md
    workflow: 15
---

# Qwen

<Warning>

**O OAuth do Qwen foi removido.** A integração OAuth do nível gratuito
(`qwen-portal`) que usava endpoints `portal.qwen.ai` não está mais disponível.
Veja a [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
contexto.

</Warning>

O OpenClaw agora trata o Qwen como um provedor empacotado de primeira classe com id canônico
`qwen`. O provedor empacotado tem como alvo os endpoints Qwen Cloud / Alibaba DashScope e
Coding Plan e mantém os ids legados `modelstudio` funcionando como um
alias de compatibilidade.

- Provedor: `qwen`
- Variável de env preferida: `QWEN_API_KEY`
- Também aceitas por compatibilidade: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo de API: compatível com OpenAI

<Tip>
Se você quiser `qwen3.6-plus`, prefira o endpoint **Standard (pay-as-you-go)**.
O suporte do Coding Plan pode demorar a acompanhar o catálogo público.
</Tip>

## Introdução

Escolha seu tipo de plano e siga as etapas de configuração.

<Tabs>
  <Tab title="Coding Plan (assinatura)">
    **Ideal para:** acesso baseado em assinatura por meio do Qwen Coding Plan.

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
    Os ids legados `modelstudio-*` de auth-choice e refs de modelo `modelstudio/...` ainda
    funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir os ids canônicos
    `qwen-*` de auth-choice e refs de modelo `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Ideal para:** acesso pay-as-you-go pelo endpoint Standard Model Studio, incluindo modelos como `qwen3.6-plus` que podem não estar disponíveis no Coding Plan.

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
    Os ids legados `modelstudio-*` de auth-choice e refs de modelo `modelstudio/...` ainda
    funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir os ids canônicos
    `qwen-*` de auth-choice e refs de modelo `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Tipos de plano e endpoints

| Plan                       | Region | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (assinatura)   | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (assinatura)   | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

O provedor seleciona automaticamente o endpoint com base no seu auth choice. As opções canônicas
usam a família `qwen-*`; `modelstudio-*` permanece apenas para compatibilidade.
Você pode substituir com um `baseUrl` personalizado na config.

<Tip>
**Gerenciar chaves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Docs:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

Atualmente, o OpenClaw inclui este catálogo Qwen empacotado. O catálogo configurado é
sensível ao endpoint: configs de Coding Plan omitem modelos que só se sabe funcionarem no
endpoint Standard.

| Model ref                   | Input       | Context   | Notes                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image | 1,000,000 | Modelo padrão                                      |
| `qwen/qwen3.6-plus`         | text, image | 1,000,000 | Prefira endpoints Standard quando precisar deste modelo |
| `qwen/qwen3-max-2026-01-23` | text        | 262,144   | Linha Qwen Max                                     |
| `qwen/qwen3-coder-next`     | text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | text        | 1,000,000 | reasoning habilitado                               |
| `qwen/glm-5`                | text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | text, image | 262,144   | Moonshot AI via Alibaba                            |

<Note>
A disponibilidade ainda pode variar por endpoint e plano de cobrança, mesmo quando um modelo está
presente no catálogo empacotado.
</Note>

## Complementos multimodais

A extensão `qwen` também expõe capacidades multimodais nos endpoints DashScope **Standard**
(não nos endpoints Coding Plan):

- **Entendimento de vídeo** via `qwen-vl-max-latest`
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
Veja [Video Generation](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
</Note>

## Avançado

<AccordionGroup>
  <Accordion title="Entendimento de imagem e vídeo">
    O plugin Qwen empacotado registra media understanding para imagens e vídeo
    nos endpoints DashScope **Standard** (não nos endpoints Coding Plan).

    | Property      | Value                 |
    | ------------- | --------------------- |
    | Modelo        | `qwen-vl-max-latest`  |
    | Entrada compatível | Imagens, vídeo    |

    O media understanding é resolvido automaticamente a partir da auth Qwen configurada — nenhuma
    config adicional é necessária. Certifique-se de estar usando um
    endpoint Standard (pay-as-you-go) para suporte a media understanding.

  </Accordion>

  <Accordion title="Disponibilidade do Qwen 3.6 Plus">
    `qwen3.6-plus` está disponível nos endpoints Standard (pay-as-you-go) do Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Se os endpoints do Coding Plan retornarem um erro de "unsupported model" para
    `qwen3.6-plus`, mude para Standard (pay-as-you-go) em vez do par
    endpoint/chave do Coding Plan.

  </Accordion>

  <Accordion title="Plano de capacidades">
    A extensão `qwen` está sendo posicionada como a casa do fornecedor para toda a superfície do Qwen
    Cloud, não apenas modelos de coding/texto.

    - **Modelos de texto/chat:** empacotados agora
    - **Chamada de ferramentas, saída estruturada, thinking:** herdados do transporte compatível com OpenAI
    - **Geração de imagem:** planejada na camada de plugin de provedor
    - **Entendimento de imagem/vídeo:** empacotado agora no endpoint Standard
    - **Fala/áudio:** planejados na camada de plugin de provedor
    - **Embeddings/reranking de memória:** planejados por meio da superfície do adaptador de embeddings
    - **Geração de vídeo:** empacotada agora por meio da capacidade compartilhada de geração de vídeo

  </Accordion>

  <Accordion title="Detalhes da geração de vídeo">
    Para geração de vídeo, o OpenClaw mapeia a região Qwen configurada para o host
    DashScope AIGC correspondente antes de enviar o job:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Isso significa que um `models.providers.qwen.baseUrl` normal apontando para qualquer um dos
    hosts Qwen Coding Plan ou Standard ainda mantém a geração de vídeo no endpoint regional correto
    de vídeo do DashScope.

    Limites atuais da geração de vídeo Qwen empacotada:

    - Até **1** vídeo de saída por requisição
    - Até **1** imagem de entrada
    - Até **4** vídeos de entrada
    - Até **10 segundos** de duração
    - Oferece suporte a `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
    - O modo de imagem/vídeo de referência atualmente exige **URLs remotas http(s)**. Caminhos de
      arquivo locais são rejeitados antecipadamente porque o endpoint de vídeo do DashScope não
      aceita buffers locais enviados para essas referências.

  </Accordion>

  <Accordion title="Compatibilidade de uso em streaming">
    Os endpoints nativos do Model Studio anunciam compatibilidade de uso em streaming no
    transporte compartilhado `openai-completions`. O OpenClaw agora baseia isso nas
    capacidades do endpoint, então ids personalizados de provedores compatíveis com DashScope que apontam para os
    mesmos hosts nativos herdam o mesmo comportamento de uso em streaming em vez de
    exigirem especificamente o id integrado de provedor `qwen`.

    A compatibilidade de uso em streaming nativo se aplica tanto aos hosts do Coding Plan quanto
    aos hosts compatíveis com DashScope Standard:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiões de endpoint multimodal">
    As superfícies multimodais (entendimento de vídeo e geração de vídeo Wan) usam os
    endpoints DashScope **Standard**, não os endpoints Coding Plan:

    - URL base Standard Global/Intl: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL base Standard China: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Configuração de ambiente e daemon">
    Se o Gateway for executado como daemon (launchd/systemd), certifique-se de que `QWEN_API_KEY` esteja
    disponível para esse processo (por exemplo, em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolhendo provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/pt-BR/providers/alibaba" icon="cloud">
    Provedor legado ModelStudio e observações de migração.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>
