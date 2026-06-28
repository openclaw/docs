---
read_when:
    - Você quer usar a geração de vídeos do Alibaba Wan no OpenClaw
    - Você precisa ter uma chave de API do Model Studio ou do DashScope configurada para geração de vídeo
summary: Geração de vídeo do Alibaba Model Studio Wan no OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T09:09:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw inclui um plugin `alibaba` integrado que registra um provedor de geração de vídeo para modelos Wan no Alibaba Model Studio (o nome internacional do DashScope). O plugin é habilitado por padrão; você só precisa definir uma chave de API.

| Propriedade      | Valor                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| ID do provedor   | `alibaba`                                                                       |
| Plugin           | integrado, `enabledByDefault: true`                                             |
| Vars env de auth | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (a primeira correspondência vence) |
| Flag de onboarding | `--auth-choice alibaba-model-studio-api-key`                                  |
| Flag direta da CLI | `--alibaba-model-studio-api-key <key>`                                        |
| Modelo padrão    | `alibaba/wan2.6-t2v`                                                            |
| URL base padrão  | `https://dashscope-intl.aliyuncs.com`                                           |

## Primeiros passos

<Steps>
  <Step title="Defina uma chave de API">
    Use o onboarding para armazenar a chave no provedor `alibaba`:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    Ou passe a chave diretamente durante a instalação/onboarding:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    Ou exporte qualquer uma das vars env aceitas antes de iniciar o Gateway:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
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

    A lista deve incluir todos os cinco modelos Wan integrados. Se `MODELSTUDIO_API_KEY` não for resolvida, `openclaw models status --json` relata a credencial ausente em `auth.unusableProfiles`.

  </Step>
</Steps>

<Note>
  O plugin Alibaba e o [plugin Qwen](/pt-BR/providers/qwen) autenticam ambos no DashScope e aceitam vars env sobrepostas. Use IDs de modelo `alibaba/...` para acionar a superfície dedicada de vídeo Wan; use IDs `qwen/...` quando quiser a superfície de chat, embedding ou entendimento de mídia do Qwen.
</Note>

## Modelos Wan integrados

| Ref. do modelo             | Modo                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Texto para vídeo (padrão) |
| `alibaba/wan2.6-i2v`       | Imagem para vídeo         |
| `alibaba/wan2.6-r2v`       | Referência para vídeo     |
| `alibaba/wan2.6-r2v-flash` | Referência para vídeo (rápido) |
| `alibaba/wan2.7-r2v`       | Referência para vídeo     |

## Capacidades e limites

O provedor integrado espelha os limites da API de vídeo Wan do DashScope. Todos os três modos compartilham a mesma contagem de vídeos por solicitação e o mesmo limite de duração; apenas o formato da entrada difere.

| Modo               | Máx. vídeos de saída | Máx. imagens de entrada | Máx. vídeos de entrada | Duração máx. | Controles compatíveis                                      |
| ------------------ | -------------------- | ----------------------- | ---------------------- | ------------ | --------------------------------------------------------- |
| Texto para vídeo   | 1                    | n/a                     | n/a                    | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Imagem para vídeo  | 1                    | 1                       | n/a                    | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Referência para vídeo | 1                 | n/a                     | 4                      | 10 s         | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

Quando uma solicitação omite `durationSeconds`, o provedor envia o padrão aceito pelo DashScope de **5 segundos**. Defina `durationSeconds` explicitamente na [ferramenta de geração de vídeo](/pt-BR/tools/video-generation) para estender até 10 s.

<Warning>
  Entradas de imagem e vídeo de referência devem ser URLs `http(s)` remotas. Caminhos de arquivos locais não são aceitos pelos modos de referência do DashScope; faça upload para um armazenamento de objetos primeiro ou use o fluxo da [ferramenta de mídia](/pt-BR/tools/media-overview), que já produz uma URL pública.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Substituir a URL base do DashScope">
    O provedor usa por padrão o endpoint internacional do DashScope. Para apontar para o endpoint da região da China, defina:

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

    O provedor remove barras finais antes de construir URLs de tarefa AIGC.

  </Accordion>

  <Accordion title="Prioridade das vars env de auth">
    O OpenClaw resolve a chave de API da Alibaba a partir de variáveis de ambiente nesta ordem, usando o primeiro valor não vazio:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Entradas configuradas em `auth.profiles` (definidas via `openclaw models auth login`) substituem a resolução por vars env. Consulte [Perfis de auth no FAQ de modelos](/pt-BR/help/faq-models#what-is-an-auth-profile) para rotação de perfis, cooldown e mecânica de substituição.

  </Accordion>

  <Accordion title="Relação com o plugin Qwen">
    Ambos os plugins integrados se comunicam com o DashScope e aceitam chaves de API sobrepostas. Use:

    - IDs `alibaba/wan*.*` para acionar o provedor dedicado de vídeo Wan documentado nesta página.
    - IDs `qwen/*` para chat, embedding e entendimento de mídia do Qwen (consulte [Qwen](/pt-BR/providers/qwen)).

    Definir `MODELSTUDIO_API_KEY` uma vez autentica ambos os plugins porque a lista de vars env de auth se sobrepõe intencionalmente; você não precisa fazer onboarding de cada plugin separadamente.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Qwen" href="/pt-BR/providers/qwen" icon="microchip">
    Configuração de chat, embedding e entendimento de mídia do Qwen na mesma auth do DashScope.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões do agente e configuração de modelos.
  </Card>
  <Card title="FAQ de modelos" href="/pt-BR/help/faq-models" icon="circle-question">
    Perfis de auth, troca de modelos e resolução de erros "no profile".
  </Card>
</CardGroup>
