---
read_when:
    - Você quer geração de mídia do Vydra no OpenClaw
    - Você precisa de orientação para configurar a chave de API da Vydra
summary: Use imagem, vídeo e fala do Vydra no OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T09:11:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

O Plugin Vydra incluído adiciona:

- Geração de imagens via `vydra/grok-imagine`
- Geração de vídeos via `vydra/veo3` e `vydra/kling`
- Síntese de fala via rota de TTS da Vydra baseada no ElevenLabs

OpenClaw usa a mesma `VYDRA_API_KEY` para as três capacidades.

| Propriedade                    | Valor                                                                     |
| ------------------------------ | ------------------------------------------------------------------------- |
| ID do provedor                 | `vydra`                                                                   |
| Plugin                         | incluído, `enabledByDefault: true`                                        |
| Variável de ambiente de auth   | `VYDRA_API_KEY`                                                           |
| Flag de onboarding             | `--auth-choice vydra-api-key`                                             |
| Flag direta da CLI             | `--vydra-api-key <key>`                                                   |
| Contratos                      | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL base                       | `https://www.vydra.ai/api/v1` (use o host `www`)                          |

<Warning>
  Use `https://www.vydra.ai/api/v1` como a URL base. O host raiz da Vydra (`https://vydra.ai/api/v1`) atualmente redireciona para `www`. Alguns clientes HTTP removem `Authorization` nesse redirecionamento entre hosts, o que transforma uma chave de API válida em uma falha de autenticação enganosa. O Plugin incluído usa a URL base com `www` diretamente para evitar isso.
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

    O suporte incluído atual é apenas de texto para imagem. As rotas de edição hospedadas da Vydra esperam URLs de imagem remotas, e o OpenClaw ainda não adiciona uma ponte de upload específica da Vydra no Plugin incluído.

    <Note>
    Consulte [Geração de imagens](/pt-BR/tools/image-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Geração de vídeos">
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
    - `vydra/kling` atualmente exige uma referência de URL de imagem remota. Uploads de arquivos locais são rejeitados de início.
    - A rota HTTP `kling` atual da Vydra tem sido inconsistente quanto a exigir `image_url` ou `video_url`; o provedor incluído mapeia a mesma URL de imagem remota para ambos os campos.
    - O Plugin incluído permanece conservador e não encaminha ajustes de estilo não documentados, como proporção, resolução, marca-d'água ou áudio gerado.

    <Note>
    Consulte [Geração de vídeos](/pt-BR/tools/video-generation) para parâmetros compartilhados da ferramenta, seleção de provedor e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Testes live de vídeo">
    Cobertura live específica do provedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    O arquivo live da Vydra incluído agora cobre:

    - texto para vídeo com `vydra/veo3`
    - imagem para vídeo com `vydra/kling` usando uma URL de imagem remota

    Substitua a fixture de imagem remota quando necessário:

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

    O Plugin incluído atualmente expõe uma voz padrão comprovadamente funcional e retorna arquivos de áudio MP3.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Diretório de provedores" href="/pt-BR/providers/index" icon="list">
    Navegue por todos os provedores disponíveis.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagem e seleção de provedor.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões de agentes e configuração de modelo.
  </Card>
</CardGroup>
