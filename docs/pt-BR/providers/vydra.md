---
read_when:
    - Você quer geração de mídia com o Vydra no OpenClaw
    - Você precisa de orientações para configurar a chave de API da Vydra
summary: Use imagem, vídeo e fala da Vydra no OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-07-12T15:42:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

O Plugin Vydra incluído adiciona:

- Geração de imagens via `vydra/grok-imagine`
- Geração de vídeos via `vydra/veo3` (texto para vídeo) e `vydra/kling` (imagem para vídeo)
- Síntese de fala via rota de TTS da Vydra baseada no ElevenLabs

O OpenClaw usa a mesma `VYDRA_API_KEY` para os três recursos.

| Propriedade                  | Valor                                                                     |
| ---------------------------- | ------------------------------------------------------------------------- |
| ID do provedor               | `vydra`                                                                   |
| Plugin                       | incluído, `enabledByDefault: true`                                         |
| Variável de ambiente de autenticação | `VYDRA_API_KEY`                                                   |
| Flag de integração inicial   | `--auth-choice vydra-api-key`                                             |
| Flag direta da CLI           | `--vydra-api-key <key>`                                                   |
| Contratos                    | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL base                     | `https://www.vydra.ai/api/v1` (use o host `www`)                          |

<Warning>
Use `https://www.vydra.ai/api/v1` como URL base. Atualmente, o host raiz da Vydra (`https://vydra.ai/api/v1`) redireciona para `www`. Alguns clientes HTTP removem o cabeçalho `Authorization` nesse redirecionamento entre hosts, fazendo com que uma chave de API válida resulte em uma falha de autenticação enganosa. O Plugin incluído normaliza qualquer URL base `vydra.ai` configurada para `www.vydra.ai` a fim de evitar isso.
</Warning>

## Configuração

<Steps>
  <Step title="Execute a integração inicial interativa">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    Ou defina diretamente a variável de ambiente:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Escolha um recurso padrão">
    Escolha um ou mais dos recursos abaixo (imagem, vídeo ou fala) e aplique a configuração correspondente.
  </Step>
</Steps>

## Recursos

<AccordionGroup>
  <Accordion title="Geração de imagens">
    Modelo de imagem padrão e único incluído:

    - `vydra/grok-imagine`

    Defina-o como o provedor de imagens padrão:

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

    O suporte incluído oferece apenas conversão de texto em imagem, com no máximo uma imagem por solicitação. As rotas hospedadas de edição da Vydra esperam URLs de imagens remotas, e o Plugin incluído não adiciona uma ponte de upload específica da Vydra.

    <Note>
    Consulte [Geração de imagens](/pt-BR/tools/image-generation) para conhecer os parâmetros compartilhados da ferramenta, a seleção de provedores e o comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Geração de vídeos">
    Modelos de vídeo registrados:

    - `vydra/veo3` para texto em vídeo (rejeita entradas de referência de imagem)
    - `vydra/kling` para imagem em vídeo (requer exatamente uma URL de imagem remota)

    Defina a Vydra como o provedor de vídeos padrão:

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

    - `vydra/kling` rejeita de imediato uploads de arquivos locais; apenas uma referência de URL de imagem remota funciona.
    - A rota HTTP `kling` da Vydra tem apresentado inconsistências quanto à exigência de `image_url` ou `video_url`; o provedor incluído envia a mesma URL de imagem remota nos dois campos.
    - O Plugin incluído adota uma abordagem conservadora e não encaminha opções de estilo não documentadas, como proporção, resolução, marca-d'água ou áudio gerado.

    <Note>
    Consulte [Geração de vídeos](/pt-BR/tools/video-generation) para conhecer os parâmetros compartilhados da ferramenta, a seleção de provedores e o comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Testes ao vivo de vídeo">
    Cobertura de testes ao vivo específica do provedor:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    O arquivo de testes ao vivo da Vydra incluído abrange:

    - texto em vídeo com `vydra/veo3`
    - imagem em vídeo com `vydra/kling` usando uma URL de imagem remota

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
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    Padrões:

    - Modelo: `elevenlabs/tts`
    - ID da voz: `21m00Tcm4TlvDq8ikWAM` ("Rachel")

    O Plugin incluído disponibiliza essa única voz padrão comprovadamente funcional e retorna arquivos de áudio MP3.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Diretório de provedores" href="/pt-BR/providers/index" icon="list">
    Consulte todos os provedores disponíveis.
  </Card>
  <Card title="Geração de imagens" href="/pt-BR/tools/image-generation" icon="image">
    Parâmetros compartilhados da ferramenta de imagens e seleção de provedores.
  </Card>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeos e seleção de provedores.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões dos agentes e configuração de modelos.
  </Card>
</CardGroup>
