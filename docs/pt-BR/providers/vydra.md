---
read_when:
    - Você quer geração de mídia do Vydra no OpenClaw
    - Você precisa de orientação para configurar a chave de API da Vydra
summary: Use imagem, vídeo e fala da Vydra no OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:07:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

O Plugin Vydra incluído adiciona:

- Geração de imagens via `vydra/grok-imagine`
- Geração de vídeo via `vydra/veo3` e `vydra/kling`
- Síntese de fala via rota TTS da Vydra com suporte da ElevenLabs

OpenClaw usa a mesma `VYDRA_API_KEY` para as três capacidades.

| Propriedade     | Valor                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| ID do provedor  | `vydra`                                                                   |
| Plugin          | incluído, `enabledByDefault: true`                                        |
| Var. env. auth  | `VYDRA_API_KEY`                                                           |
| Flag de onboarding | `--auth-choice vydra-api-key`                                          |
| Flag direta da CLI | `--vydra-api-key <key>`                                                |
| Contratos       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL base        | `https://www.vydra.ai/api/v1` (use o host `www`)                          |

<Warning>
  Use `https://www.vydra.ai/api/v1` como URL base. O host apex da Vydra (`https://vydra.ai/api/v1`) atualmente redireciona para `www`. Alguns clientes HTTP removem `Authorization` nesse redirecionamento entre hosts, o que transforma uma chave de API válida em uma falha de autenticação enganosa. O Plugin incluído usa a URL base com `www` diretamente para evitar isso.
</Warning>

## Configuração

<Steps>
  <Step title="Execute o onboarding interativo">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Ou defina a var. env. diretamente:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Escolha uma capacidade padrão">
    Escolha uma ou mais das capacidades abaixo (imagem, vídeo ou fala) e aplique a configuração correspondente.
  </Step>
</Steps>

## Capacidades

<AccordionGroup>
  <Accordion title="Geração de imagens">
    Modelo de imagem padrão:

    - `vydra/grok-imagine`

    Defina-o como o provedor de imagem padrão:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    O suporte incluído atual é apenas texto para imagem. As rotas de edição hospedadas da Vydra esperam URLs de imagem remotas, e o OpenClaw ainda não adiciona uma ponte de upload específica da Vydra no Plugin incluído.

    <Note>
    Consulte [Geração de imagens](/pt-BR/tools/image-generation) para parâmetros de ferramenta compartilhados, seleção de provedor e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Geração de vídeo">
    Modelos de vídeo registrados:

    - `vydra/veo3` para texto para vídeo
    - `vydra/kling` para imagem para vídeo

    Defina a Vydra como o provedor de vídeo padrão:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    Observações:

    - `vydra/veo3` é incluído apenas como texto para vídeo.
    - `vydra/kling` atualmente exige uma referência de URL de imagem remota. Uploads de arquivos locais são rejeitados de antemão.
    - A rota HTTP `kling` atual da Vydra tem sido inconsistente quanto a exigir `image_url` ou `video_url`; o provedor incluído mapeia a mesma URL de imagem remota para ambos os campos.
    - O Plugin incluído permanece conservador e não encaminha controles de estilo não documentados, como proporção, resolução, marca d'água ou áudio gerado.

    <Note>
    Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros de ferramenta compartilhados, seleção de provedor e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Testes live de vídeo">
    Cobertura live específica do provedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    O arquivo live incluído da Vydra agora cobre:

    - `vydra/veo3` texto para vídeo
    - `vydra/kling` imagem para vídeo usando uma URL de imagem remota

    Substitua o fixture de imagem remota quando necessário:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Síntese de fala">
    Defina a Vydra como o provedor de fala:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Padrões:

    - Modelo: `elevenlabs/tts`
    - ID de voz: `21m00Tcm4TlvDq8ikWAM`

    O Plugin incluído atualmente expõe uma voz padrão conhecida e funcional e retorna arquivos de áudio MP3.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Diretório de provedores" href="/pt-BR/providers/index" icon="list">
    Navegue por todos os provedores disponíveis.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões de agente e configuração de modelo.
  </Card>
</CardGroup>
