---
read_when:
    - Você quer geração de mídia do Vydra no OpenClaw
    - Você precisa de orientações para configurar a chave de API do Vydra
summary: Use imagem, vídeo e fala do Vydra no OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-24T06:09:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 15
---

O Plugin Vydra incluído adiciona:

- Geração de imagem via `vydra/grok-imagine`
- Geração de vídeo via `vydra/veo3` e `vydra/kling`
- Síntese de fala via a rota TTS do Vydra baseada em ElevenLabs

O OpenClaw usa a mesma `VYDRA_API_KEY` para os três recursos.

<Warning>
Use `https://www.vydra.ai/api/v1` como URL base.

O host apex do Vydra (`https://vydra.ai/api/v1`) atualmente redireciona para `www`. Alguns clientes HTTP descartam `Authorization` nesse redirecionamento entre hosts, o que transforma uma chave de API válida em uma falha de autenticação enganosa. O Plugin incluído usa diretamente a URL base com `www` para evitar isso.
</Warning>

## Configuração

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Ou defina a variável de ambiente diretamente:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    Escolha um ou mais dos recursos abaixo (imagem, vídeo ou fala) e aplique a configuração correspondente.
  </Step>
</Steps>

## Recursos

<AccordionGroup>
  <Accordion title="Geração de imagem">
    Modelo de imagem padrão:

    - `vydra/grok-imagine`

    Defina-o como provedor padrão de imagem:

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

    O suporte incluído atualmente é apenas para text-to-image. As rotas hospedadas de edição do Vydra esperam URLs remotas de imagem, e o OpenClaw ainda não adiciona uma bridge de upload específica do Vydra no Plugin incluído.

    <Note>
    Consulte [Image Generation](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de fallback.
    </Note>

  </Accordion>

  <Accordion title="Geração de vídeo">
    Modelos de vídeo registrados:

    - `vydra/veo3` para text-to-video
    - `vydra/kling` para image-to-video

    Defina o Vydra como provedor padrão de vídeo:

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

    - `vydra/veo3` é incluído apenas como text-to-video.
    - `vydra/kling` atualmente exige uma URL remota de imagem de referência. Uploads de arquivo local são rejeitados logo no início.
    - A rota HTTP atual do `kling` no Vydra tem sido inconsistente quanto a exigir `image_url` ou `video_url`; o provedor incluído mapeia a mesma URL remota de imagem para ambos os campos.
    - O Plugin incluído é conservador e não encaminha controles de estilo não documentados, como aspect ratio, resolution, watermark ou áudio gerado.

    <Note>
    Consulte [Video Generation](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de fallback.
    </Note>

  </Accordion>

  <Accordion title="Testes live de vídeo">
    Cobertura live específica do provedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    O arquivo live do Vydra incluído agora cobre:

    - `vydra/veo3` text-to-video
    - `vydra/kling` image-to-video usando uma URL remota de imagem

    Substitua o fixture remoto de imagem quando necessário:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Síntese de fala">
    Defina o Vydra como provedor de fala:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Padrões:

    - Modelo: `elevenlabs/tts`
    - ID de voz: `21m00Tcm4TlvDq8ikWAM`

    Atualmente, o Plugin incluído expõe uma voz padrão conhecida como confiável e retorna arquivos de áudio MP3.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Diretório de provedores" href="/pt-BR/providers/index" icon="list">
    Navegue por todos os provedores disponíveis.
  </Card>
  <Card title="Geração de imagem" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões de agente e configuração de modelo.
  </Card>
</CardGroup>
