---
read_when:
    - Você quer geração de mídia da Vydra no OpenClaw
    - Você precisa de orientação para configurar a chave da API da Vydra
summary: Use imagem, vídeo e fala da Vydra no OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-12T23:33:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab623d14b656ce0b68d648a6393fcee3bb880077d6583e0d5c1012e91757f20e
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

O plugin Vydra integrado adiciona:

- Geração de imagem via `vydra/grok-imagine`
- Geração de vídeo via `vydra/veo3` e `vydra/kling`
- Síntese de fala pela rota de TTS da Vydra com tecnologia ElevenLabs

O OpenClaw usa a mesma `VYDRA_API_KEY` para as três capacidades.

<Warning>
Use `https://www.vydra.ai/api/v1` como URL base.

O host apex da Vydra (`https://vydra.ai/api/v1`) atualmente redireciona para `www`. Alguns clientes HTTP descartam `Authorization` nesse redirecionamento entre hosts, o que transforma uma chave de API válida em uma falha de autenticação enganosa. O plugin integrado usa diretamente a URL base com `www` para evitar isso.
</Warning>

## Configuração

<Steps>
  <Step title="Execute o onboarding interativo">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Ou defina a variável de ambiente diretamente:

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
  <Accordion title="Geração de imagem">
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

    O suporte integrado atual é apenas para texto para imagem. As rotas hospedadas de edição da Vydra esperam URLs remotas de imagem, e o OpenClaw ainda não adiciona uma bridge de upload específica da Vydra no plugin integrado.

    <Note>
    Veja [Geração de imagem](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Geração de vídeo">
    Modelos de vídeo registrados:

    - `vydra/veo3` para texto para vídeo
    - `vydra/kling` para imagem para vídeo

    Defina a Vydra como provedor de vídeo padrão:

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

    - `vydra/veo3` está integrado apenas como texto para vídeo.
    - `vydra/kling` atualmente exige uma URL remota de imagem como referência. Uploads de arquivos locais são rejeitados antecipadamente.
    - A rota HTTP atual `kling` da Vydra tem sido inconsistente sobre exigir `image_url` ou `video_url`; o provedor integrado mapeia a mesma URL remota de imagem para ambos os campos.
    - O plugin integrado permanece conservador e não encaminha controles de estilo não documentados, como proporção, resolução, marca-d'água ou áudio gerado.

    <Note>
    Veja [Geração de vídeo](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Testes live de vídeo">
    Cobertura live específica do provedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    O arquivo live integrado da Vydra agora cobre:

    - `vydra/veo3` texto para vídeo
    - `vydra/kling` imagem para vídeo usando uma URL remota de imagem

    Substitua o fixture de imagem remota quando necessário:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Síntese de fala">
    Defina a Vydra como provedor de fala:

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
    - ID da voz: `21m00Tcm4TlvDq8ikWAM`

    O plugin integrado atualmente expõe uma única voz padrão conhecida por funcionar e retorna arquivos de áudio MP3.

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
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference#agent-defaults" icon="gear">
    Padrões de agente e configuração de modelo.
  </Card>
</CardGroup>
