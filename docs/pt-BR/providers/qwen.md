---
read_when:
    - Você quer usar o Qwen com o OpenClaw
    - Você usou anteriormente OAuth do Qwen
summary: Use o Qwen Cloud via o provedor qwen incluído do OpenClaw
title: Qwen
x-i18n:
    generated_at: "2026-04-24T06:09:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3601722ed12e7e0441ec01e6a9e6b205a39a7ecfb599e16dad3bbfbdbf34ee83
    source_path: providers/qwen.md
    workflow: 15
---

<Warning>

**O OAuth do Qwen foi removido.** A integração OAuth de nível gratuito
(`qwen-portal`) que usava endpoints `portal.qwen.ai` não está mais disponível.
Consulte [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) para
entender o contexto.

</Warning>

O OpenClaw agora trata o Qwen como um provedor incluído de primeira classe com ID
canônico `qwen`. O provedor incluído mira os endpoints Qwen Cloud / Alibaba DashScope e
Coding Plan e mantém IDs legados `modelstudio` funcionando como alias de
compatibilidade.

- Provedor: `qwen`
- Variável de ambiente preferida: `QWEN_API_KEY`
- Também aceitas por compatibilidade: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- Estilo da API: compatível com OpenAI

<Tip>
Se você quiser `qwen3.6-plus`, prefira o endpoint **Standard (pay-as-you-go)**.
O suporte do Coding Plan pode demorar a acompanhar o catálogo público.
</Tip>

## Primeiros passos

Escolha seu tipo de plano e siga as etapas de configuração.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Melhor para:** acesso baseado em assinatura por meio do Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Crie ou copie uma chave de API em [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Para o endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Para o endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    IDs legados de `auth-choice` `modelstudio-*` e refs de modelo `modelstudio/...` ainda
    funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir
    os IDs canônicos de `auth-choice` `qwen-*` e refs de modelo `qwen/...`.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Melhor para:** acesso pay-as-you-go pelo endpoint Standard Model Studio, incluindo modelos como `qwen3.6-plus` que talvez não estejam disponíveis no Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Crie ou copie uma chave de API em [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Para o endpoint **Global**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Para o endpoint **China**:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    IDs legados de `auth-choice` `modelstudio-*` e refs de modelo `modelstudio/...` ainda
    funcionam como aliases de compatibilidade, mas novos fluxos de configuração devem preferir
    os IDs canônicos de `auth-choice` `qwen-*` e refs de modelo `qwen/...`.
    </Note>

  </Tab>
</Tabs>

## Tipos de plano e endpoints

| Plano                      | Região | Auth choice                | Endpoint                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (subscription) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (subscription) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

O provedor seleciona automaticamente o endpoint com base no seu auth choice. Escolhas
canônicas usam a família `qwen-*`; `modelstudio-*` permanece apenas para compatibilidade.
Você pode substituir isso com um `baseUrl` personalizado na configuração.

<Tip>
**Gerenciar chaves:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Docs:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Catálogo integrado

Atualmente, o OpenClaw inclui este catálogo Qwen. O catálogo configurado é
sensível ao endpoint: configurações do Coding Plan omitem modelos que só são conhecidos por funcionar
no endpoint Standard.

| Ref do modelo               | Entrada       | Contexto  | Observações                                         |
| --------------------------- | ------------- | --------- | --------------------------------------------------- |
| `qwen/qwen3.5-plus`         | texto, imagem | 1,000,000 | Modelo padrão                                       |
| `qwen/qwen3.6-plus`         | texto, imagem | 1,000,000 | Prefira endpoints Standard quando precisar desse modelo |
| `qwen/qwen3-max-2026-01-23` | texto         | 262,144   | Linha Qwen Max                                      |
| `qwen/qwen3-coder-next`     | texto         | 262,144   | Coding                                              |
| `qwen/qwen3-coder-plus`     | texto         | 1,000,000 | Coding                                              |
| `qwen/MiniMax-M2.5`         | texto         | 1,000,000 | Reasoning ativado                                   |
| `qwen/glm-5`                | texto         | 202,752   | GLM                                                 |
| `qwen/glm-4.7`              | texto         | 202,752   | GLM                                                 |
| `qwen/kimi-k2.5`            | texto, imagem | 262,144   | Moonshot AI via Alibaba                             |

<Note>
A disponibilidade ainda pode variar por endpoint e plano de cobrança, mesmo quando um modelo está
presente no catálogo incluído.
</Note>

## Complementos multimodais

O Plugin `qwen` também expõe recursos multimodais nos endpoints DashScope **Standard**
(não nos endpoints do Coding Plan):

- **Entendimento de vídeo** via `qwen-vl-max-latest`
- **Geração de vídeo Wan** via `wan2.6-t2v` (padrão), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Para usar o Qwen como provedor padrão de vídeo:

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
Consulte [Video Generation](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de fallback.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Entendimento de imagem e vídeo">
    O Plugin Qwen incluído registra entendimento de mídia para imagem e vídeo
    nos endpoints DashScope **Standard** (não nos endpoints do Coding Plan).

    | Propriedade    | Valor                 |
    | -------------- | --------------------- |
    | Modelo         | `qwen-vl-max-latest`  |
    | Entrada compatível | Imagens, vídeo    |

    O entendimento de mídia é resolvido automaticamente a partir da autenticação Qwen configurada — nenhuma
    configuração adicional é necessária. Verifique se você está usando um endpoint
    Standard (pay-as-you-go) para ter suporte a entendimento de mídia.

  </Accordion>

  <Accordion title="Disponibilidade do Qwen 3.6 Plus">
    `qwen3.6-plus` está disponível nos endpoints Standard (pay-as-you-go) do Model Studio:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Se os endpoints do Coding Plan retornarem erro de "unsupported model" para
    `qwen3.6-plus`, troque para o endpoint Standard (pay-as-you-go) em vez do
    par endpoint/chave do Coding Plan.

  </Accordion>

  <Accordion title="Plano de capacidade">
    O Plugin `qwen` está sendo posicionado como a casa do fornecedor para toda a superfície
    do Qwen Cloud, não apenas para modelos de coding/texto.

    - **Modelos de texto/chat:** incluídos agora
    - **Chamada de ferramentas, saída estruturada, thinking:** herdados do transporte compatível com OpenAI
    - **Geração de imagem:** planejada na camada do Plugin de provedor
    - **Entendimento de imagem/vídeo:** incluído agora no endpoint Standard
    - **Fala/áudio:** planejados na camada do Plugin de provedor
    - **Embeddings/reranking de Memory:** planejados por meio da superfície do adaptador de embeddings
    - **Geração de vídeo:** incluída agora pela capacidade compartilhada de geração de vídeo

  </Accordion>

  <Accordion title="Detalhes da geração de vídeo">
    Para geração de vídeo, o OpenClaw mapeia a região Qwen configurada para o host
    AIGC DashScope correspondente antes de enviar o trabalho:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Isso significa que um `models.providers.qwen.baseUrl` normal apontando para qualquer um dos
    hosts Qwen Standard ou Coding Plan ainda mantém a geração de vídeo no endpoint
    regional correto de vídeo do DashScope.

    Limites atuais da geração de vídeo Qwen incluída:

    - Até **1** vídeo de saída por solicitação
    - Até **1** imagem de entrada
    - Até **4** vídeos de entrada
    - Até **10 segundos** de duração
    - Compatível com `size`, `aspectRatio`, `resolution`, `audio` e `watermark`
    - O modo atual de imagem/vídeo de referência exige **URLs remotas http(s)**. Caminhos
      de arquivo locais são rejeitados logo no início porque o endpoint de vídeo do DashScope não
      aceita buffers locais enviados para essas referências.

  </Accordion>

  <Accordion title="Compatibilidade de uso em streaming">
    Endpoints nativos do Model Studio anunciam compatibilidade de uso em streaming no
    transporte compartilhado `openai-completions`. O OpenClaw agora determina isso pelas
    capacidades do endpoint, então IDs personalizados de provedor compatível com DashScope que miram os
    mesmos hosts nativos herdam o mesmo comportamento de uso em streaming em vez de
    exigir especificamente o ID de provedor integrado `qwen`.

    A compatibilidade de uso nativo em streaming se aplica tanto aos hosts do Coding Plan quanto
    aos hosts Standard compatíveis com DashScope:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regiões de endpoint multimodal">
    Superfícies multimodais (entendimento de vídeo e geração de vídeo Wan) usam os
    endpoints DashScope **Standard**, não os endpoints do Coding Plan:

    - URL base Global/Intl Standard: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - URL base China Standard: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Ambiente e configuração de daemon">
    Se o Gateway for executado como daemon (launchd/systemd), verifique se `QWEN_API_KEY` está
    disponível para esse processo (por exemplo em `~/.openclaw/.env` ou via
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de fallback.
  </Card>
  <Card title="Video generation" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/pt-BR/providers/alibaba" icon="cloud">
    Provedor legado ModelStudio e observações sobre migração.
  </Card>
  <Card title="Troubleshooting" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>
