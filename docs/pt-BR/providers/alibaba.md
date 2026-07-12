---
read_when:
    - Você quer usar a geração de vídeos do Alibaba Wan no OpenClaw
    - Você precisa configurar o Model Studio ou uma chave de API do DashScope para gerar vídeos
summary: Geração de vídeo do Alibaba Model Studio Wan no OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T00:15:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

O plugin `alibaba` incluído registra um provedor de geração de vídeo para modelos Wan no Alibaba Model Studio (o nome internacional do DashScope). Ele é habilitado por padrão; somente uma chave de API é necessária.

| Propriedade                  | Valor                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------- |
| ID do provedor               | `alibaba`                                                                       |
| Plugin                       | incluído, `enabledByDefault: true`                                               |
| Variáveis de ambiente de autenticação | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (a primeira correspondência prevalece) |
| Flag de integração inicial   | `--auth-choice alibaba-model-studio-api-key`                                    |
| Flag direta da CLI           | `--alibaba-model-studio-api-key <key>`                                          |
| Modelo padrão                | `alibaba/wan2.6-t2v`                                                            |
| URL base padrão              | `https://dashscope-intl.aliyuncs.com`                                           |

## Primeiros passos

<Steps>
  <Step title="Set an API key">
    Armazene a chave para o provedor `alibaba` por meio da integração inicial:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Ou forneça a chave diretamente:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Ou exporte uma das variáveis de ambiente aceitas antes de iniciar o Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Set a default video model">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verify the provider is configured">
    ```bash
    openclaw models list --provider alibaba
    ```

    A lista inclui todos os cinco modelos Wan incluídos. Se não for possível resolver `MODELSTUDIO_API_KEY`, `openclaw models status --json` relata a credencial ausente em `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  O plugin Alibaba e o [plugin Qwen](/pt-BR/providers/qwen) autenticam-se no DashScope e aceitam variáveis de ambiente sobrepostas. Use IDs de modelo `alibaba/...` para a interface dedicada de vídeo Wan; use IDs `qwen/...` para chat, embeddings ou compreensão de mídia do Qwen.
</Note>

## Modelos Wan integrados

| Referência do modelo         | Modo                           |
| ---------------------------- | ------------------------------ |
| `alibaba/wan2.6-t2v`         | Texto para vídeo (padrão)      |
| `alibaba/wan2.6-i2v`         | Imagem para vídeo              |
| `alibaba/wan2.6-r2v`         | Referência para vídeo          |
| `alibaba/wan2.6-r2v-flash`   | Referência para vídeo (rápido) |
| `alibaba/wan2.7-r2v`         | Referência para vídeo          |

## Recursos e limites

Todos os três modos compartilham o mesmo limite de quantidade e duração de vídeos por solicitação; somente o formato da entrada é diferente.

| Modo                  | Máx. de vídeos de saída | Máx. de imagens de entrada | Máx. de vídeos de entrada | Duração máxima | Controles compatíveis                                      |
| --------------------- | ----------------------- | -------------------------- | ------------------------- | -------------- | ---------------------------------------------------------- |
| Texto para vídeo      | 1                       | não aplicável              | não aplicável             | 10 s           | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Imagem para vídeo     | 1                       | 1                          | não aplicável             | 10 s           | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referência para vídeo | 1                       | não aplicável              | 4                         | 10 s           | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Uma solicitação que omite `durationSeconds` recebe o padrão aceito pelo DashScope de **5 segundos**. Defina `durationSeconds` explicitamente na [ferramenta de geração de vídeo](/pt-BR/tools/video-generation) para estender a duração até 10 s.

<Warning>
  As entradas de imagem e vídeo de referência devem ser URLs `http(s)` remotas; os modos de referência do DashScope rejeitam caminhos de arquivos locais. Primeiro, faça o upload para um armazenamento de objetos ou use o fluxo da [ferramenta de mídia](/pt-BR/tools/media-overview), que já produz uma URL pública.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Override the DashScope base URL">
    O provedor usa por padrão o endpoint internacional do DashScope. Para usar o endpoint da região da China:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    O provedor remove as barras finais antes de construir as URLs de tarefas AIGC.

  </Accordion>

  <Accordion title="Auth env priority">
    O OpenClaw resolve a chave de API do Alibaba a partir das variáveis de ambiente nesta ordem, usando o primeiro valor não vazio:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    As entradas configuradas em `auth.profiles` (definidas por meio de `openclaw models auth login`) têm precedência sobre a resolução por variáveis de ambiente. Consulte [Perfis de autenticação nas perguntas frequentes sobre modelos](/pt-BR/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) para saber mais sobre rotação de perfis, período de espera e mecanismos de substituição.

  </Accordion>

  <Accordion title="Relationship to the Qwen plugin">
    Ambos os plugins incluídos se comunicam com o DashScope e aceitam chaves de API sobrepostas. Use:

    - IDs `alibaba/wan*.*` para o provedor dedicado de vídeo Wan documentado nesta página.
    - IDs `qwen/*` para chat, embeddings e compreensão de mídia do Qwen (consulte [Qwen](/pt-BR/providers/qwen)).

    Definir `MODELSTUDIO_API_KEY` uma vez autentica ambos os plugins, pois a lista de variáveis de ambiente de autenticação se sobrepõe intencionalmente; não é necessário realizar a integração inicial de cada plugin separadamente.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Video generation" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Qwen" href="/pt-BR/providers/qwen" icon="microchip">
    Configuração de chat, embeddings e compreensão de mídia do Qwen com a mesma autenticação do DashScope.
  </Card>
  <Card title="Configuration reference" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões dos agentes e configuração de modelos.
  </Card>
  <Card title="Models FAQ" href="/pt-BR/help/faq-models" icon="circle-question">
    Perfis de autenticação, troca de modelos e resolução de erros de "nenhum perfil".
  </Card>
</CardGroup>
