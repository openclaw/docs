---
read_when:
    - Você quer usar a geração de vídeos do Alibaba Wan no OpenClaw
    - Você precisa configurar uma chave de API do Model Studio ou do DashScope para gerar vídeos
summary: Geração de vídeo do Alibaba Model Studio Wan no OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-07-12T15:37:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

O plugin `alibaba` incluído registra um provedor de geração de vídeo para os modelos Wan no Alibaba Model Studio (o nome internacional do DashScope). Ele é habilitado por padrão; apenas uma chave de API é necessária.

| Propriedade             | Valor                                                                           |
| ----------------------- | ------------------------------------------------------------------------------- |
| ID do provedor          | `alibaba`                                                                       |
| Plugin                  | incluído, `enabledByDefault: true`                                               |
| Variáveis de ambiente de autenticação | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (a primeira correspondência prevalece) |
| Flag de integração      | `--auth-choice alibaba-model-studio-api-key`                                    |
| Flag direta da CLI      | `--alibaba-model-studio-api-key <key>`                                          |
| Modelo padrão           | `alibaba/wan2.6-t2v`                                                            |
| URL base padrão         | `https://dashscope-intl.aliyuncs.com`                                           |

## Primeiros passos

<Steps>
  <Step title="Defina uma chave de API">
    Armazene a chave para o provedor `alibaba` por meio da integração:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Ou passe a chave diretamente:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Ou exporte uma das variáveis de ambiente aceitas antes de iniciar o Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # ou DASHSCOPE_API_KEY=...
    # ou QWEN_API_KEY=...
    ```

  </Step>
  <Step title="Defina um modelo de vídeo padrão">
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
  <Step title="Verifique se o provedor está configurado">
    ```bash
    openclaw models list --provider alibaba
    ```

    A lista inclui todos os cinco modelos Wan incluídos. Se `MODELSTUDIO_API_KEY` não puder ser resolvida, `openclaw models status --json` relatará a credencial ausente em `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  O plugin Alibaba e o [plugin Qwen](/pt-BR/providers/qwen) se autenticam no DashScope e aceitam variáveis de ambiente sobrepostas. Use IDs de modelo `alibaba/...` para a interface dedicada de vídeo Wan; use IDs `qwen/...` para chat, embeddings ou compreensão de mídia do Qwen.
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

Todos os três modos compartilham o mesmo limite de quantidade de vídeos e de duração por solicitação; apenas o formato da entrada é diferente.

| Modo                  | Máx. de vídeos de saída | Máx. de imagens de entrada | Máx. de vídeos de entrada | Duração máx. | Controles compatíveis                                      |
| --------------------- | ----------------------- | -------------------------- | ------------------------- | ------------ | ---------------------------------------------------------- |
| Texto para vídeo      | 1                       | n/d                        | n/d                       | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark`  |
| Imagem para vídeo     | 1                       | 1                          | n/d                       | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark`  |
| Referência para vídeo | 1                       | n/d                        | 4                         | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark`  |

Uma solicitação que omite `durationSeconds` recebe o padrão aceito pelo DashScope de **5 segundos**. Defina `durationSeconds` explicitamente na [ferramenta de geração de vídeo](/pt-BR/tools/video-generation) para estender a duração até 10 s.

<Warning>
  As entradas de imagem e vídeo de referência devem ser URLs `http(s)` remotas; os modos de referência do DashScope rejeitam caminhos de arquivos locais. Primeiro, faça upload para um armazenamento de objetos ou use o fluxo da [ferramenta de mídia](/pt-BR/tools/media-overview), que já produz uma URL pública.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Substitua a URL base do DashScope">
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

  <Accordion title="Prioridade das variáveis de ambiente de autenticação">
    O OpenClaw resolve a chave de API do Alibaba usando as variáveis de ambiente nesta ordem e seleciona o primeiro valor não vazio:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    As entradas configuradas em `auth.profiles` (definidas por meio de `openclaw models auth login`) substituem a resolução por variáveis de ambiente. Consulte [Perfis de autenticação nas perguntas frequentes sobre modelos](/pt-BR/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) para saber mais sobre rotação de perfis, período de espera e mecanismos de substituição.

  </Accordion>

  <Accordion title="Relação com o plugin Qwen">
    Ambos os plugins incluídos se comunicam com o DashScope e aceitam chaves de API sobrepostas. Use:

    - IDs `alibaba/wan*.*` para o provedor dedicado de vídeo Wan documentado nesta página.
    - IDs `qwen/*` para chat, embeddings e compreensão de mídia do Qwen (consulte [Qwen](/pt-BR/providers/qwen)).

    Definir `MODELSTUDIO_API_KEY` uma vez autentica ambos os plugins, pois a lista de variáveis de ambiente de autenticação se sobrepõe intencionalmente; não é necessário integrar cada plugin separadamente.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Qwen" href="/pt-BR/providers/qwen" icon="microchip">
    Configuração de chat, embeddings e compreensão de mídia do Qwen com a mesma autenticação do DashScope.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões de agentes e configuração de modelos.
  </Card>
  <Card title="Perguntas frequentes sobre modelos" href="/pt-BR/help/faq-models" icon="circle-question">
    Perfis de autenticação, alternância de modelos e resolução de erros de "nenhum perfil".
  </Card>
</CardGroup>
