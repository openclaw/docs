---
read_when:
    - Projetando ou refatorando a compreensão de mídia
    - Ajuste do pré-processamento de áudio/vídeo/imagem de entrada
sidebarTitle: Media understanding
summary: Compreensão de imagem/áudio/vídeo de entrada (opcional) com fallbacks de provedor + CLI
title: Compreensão de mídia
x-i18n:
    generated_at: "2026-06-28T05:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 40ce9b5c65857702015172cbba76ea4396267894888487b40c11b5997a992362
    source_path: nodes/media-understanding.md
    workflow: 16
---

OpenClaw pode **resumir mídia recebida** (imagem/áudio/vídeo) antes que o pipeline de resposta seja executado. Ele detecta automaticamente quando ferramentas locais ou chaves de provedor estão disponíveis, e pode ser desativado ou personalizado. Se a compreensão estiver desativada, os modelos ainda recebem os arquivos/URLs originais como de costume.

O comportamento de mídia específico de fornecedor é registrado por plugins de fornecedor, enquanto o núcleo do OpenClaw é responsável pela configuração compartilhada `tools.media`, pela ordem de fallback e pela integração com o pipeline de resposta.

## Objetivos

- Opcional: pré-processar mídia recebida em texto curto para roteamento mais rápido + melhor parsing de comandos.
- Preservar a entrega da mídia original ao modelo (sempre).
- Compatibilizar **APIs de provedor** e **fallbacks de CLI**.
- Permitir vários modelos com fallback ordenado (erro/tamanho/timeout).

## Comportamento de alto nível

<Steps>
  <Step title="Coletar anexos">
    Coletar anexos recebidos (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Selecionar por capacidade">
    Para cada capacidade habilitada (imagem/áudio/vídeo), selecionar anexos conforme a política (padrão: **primeiro**).
  </Step>
  <Step title="Escolher modelo">
    Escolher a primeira entrada de modelo qualificada (tamanho + capacidade + autenticação).
  </Step>
  <Step title="Fallback em caso de falha">
    Se um modelo falhar ou a mídia for grande demais, **fazer fallback para a próxima entrada**.
  </Step>
  <Step title="Aplicar bloco de sucesso">
    Em caso de sucesso:

    - `Body` se torna um bloco `[Image]`, `[Audio]` ou `[Video]`.
    - Áudio define `{{Transcript}}`; o parsing de comandos usa o texto da legenda quando presente, caso contrário a transcrição.
    - Legendas são preservadas como `User text:` dentro do bloco.

  </Step>
</Steps>

Se a compreensão falhar ou estiver desativada, **o fluxo de resposta continua** com o corpo + anexos originais.

## Visão geral da configuração

`tools.media` oferece suporte a **modelos compartilhados** mais substituições por capacidade:

<AccordionGroup>
  <Accordion title="Chaves de nível superior">
    - `tools.media.models`: lista de modelos compartilhados (use `capabilities` para restringir).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - padrões (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - substituições de provedor (`baseUrl`, `headers`, `providerOptions`)
      - opções de áudio da Deepgram via `tools.media.audio.providerOptions.deepgram`
      - controles de eco da transcrição de áudio (`echoTranscript`, padrão `false`; `echoFormat`)
      - **lista de `models` por capacidade** opcional (preferida antes dos modelos compartilhados)
      - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (controle opcional por chave de canal/chatType/sessão)
    - `tools.media.concurrency`: máximo de execuções de capacidade simultâneas (padrão **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* shared list */
      ],
      image: {
        /* optional overrides */
      },
      audio: {
        /* optional overrides */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* optional overrides */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada de `models[]` pode ser **provedor** ou **CLI**:

<Tabs>
  <Tab title="Entrada de provedor">
    ```json5
    {
      type: "provider", // default if omitted
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // optional, used for multi-modal entries
      profile: "vision-profile",
      preferredProfile: "vision-fallback",
    }
    ```
  </Tab>
  <Tab title="Entrada de CLI">
    ```json5
    {
      type: "cli",
      command: "gemini",
      args: [
        "-m",
        "gemini-3-flash",
        "--allowed-tools",
        "read_file",
        "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
      ],
      maxChars: 500,
      maxBytes: 52428800,
      timeoutSeconds: 120,
      capabilities: ["video", "image"],
    }
    ```

    Templates de CLI também podem usar:

    - `{{MediaDir}}` (diretório que contém o arquivo de mídia)
    - `{{OutputDir}}` (diretório scratch criado para esta execução)
    - `{{OutputBase}}` (caminho base do arquivo scratch, sem extensão)

  </Tab>
</Tabs>

### Credenciais de provedor (`apiKey`)

A compreensão de mídia por provedor usa a mesma resolução de autenticação de provedor que chamadas de modelo normais: perfis de autenticação, variáveis de ambiente e depois `models.providers.<providerId>.apiKey`.

Entradas `tools.media.*.models[]` não aceitam um campo `apiKey` inline. O valor de `provider` em uma entrada de modelo de mídia, como `openai` ou `moonshot`, deve ter credenciais disponíveis por uma das fontes padrão de autenticação de provedor.

Exemplo mínimo:

```json5
{
  models: {
    providers: {
      openai: { apiKey: "<OPENAI_API_KEY>" },
      moonshot: { apiKey: "<MOONSHOT_API_KEY>" },
    },
  },
}
```

Para a referência completa de autenticação de provedor, incluindo perfis, variáveis de ambiente e URLs base personalizadas, consulte [Ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Padrões e limites

Padrões recomendados:

- `maxChars`: **500** para imagem/vídeo (curto, adequado a comandos)
- `maxChars`: **não definido** para áudio (transcrição completa, a menos que você defina um limite)
- `maxBytes`:
  - imagem: **10MB**
  - áudio: **20MB**
  - vídeo: **50MB**

<AccordionGroup>
  <Accordion title="Regras">
    - Se a mídia exceder `maxBytes`, esse modelo será ignorado e o **próximo modelo será tentado**.
    - Arquivos de áudio menores que **1024 bytes** são tratados como vazios/corrompidos e ignorados antes da transcrição por provedor/CLI; o contexto de resposta recebida recebe uma transcrição placeholder determinística para que o agente saiba que a nota era pequena demais.
    - Se o modelo retornar mais do que `maxChars`, a saída será aparada.
    - `prompt` usa por padrão um "Describe the {media}." simples mais a orientação de `maxChars` (somente imagem/vídeo).
    - Se o modelo de imagem primário ativo já for compatível nativamente com visão, o OpenClaw ignora o bloco de resumo `[Image]` e passa a imagem original para o modelo.
    - Se um modelo primário de Gateway/WebChat for somente texto, anexos de imagem são preservados como refs `media://inbound/*` descarregadas para que as ferramentas de imagem/PDF ou o modelo de imagem configurado ainda possam inspecioná-los em vez de perder o anexo.
    - Solicitações explícitas `openclaw infer image describe --model <provider/model>` são diferentes: elas executam diretamente esse provedor/modelo compatível com imagem, incluindo refs Ollama como `ollama/qwen2.5vl:7b`.
    - Se `<capability>.enabled: true` mas nenhum modelo estiver configurado, o OpenClaw tenta o **modelo de resposta ativo** quando seu provedor oferece suporte à capacidade.

  </Accordion>
</AccordionGroup>

### Detectar automaticamente compreensão de mídia (padrão)

Se `tools.media.<capability>.enabled` **não** estiver definido como `false` e você não tiver configurado modelos, o OpenClaw detecta automaticamente nesta ordem e **para na primeira opção funcional**:

<Steps>
  <Step title="Modelo de resposta ativo">
    Modelo de resposta ativo quando seu provedor oferece suporte à capacidade.
  </Step>
  <Step title="agents.defaults.imageModel">
    Refs primária/fallback de `agents.defaults.imageModel` (somente imagem).
    Prefira refs `provider/model`. Refs sem qualificação são qualificadas a partir de entradas de modelo de provedor configuradas compatíveis com imagem somente quando a correspondência é única.
  </Step>
  <Step title="CLIs locais (somente áudio)">
    CLIs locais (se instaladas):

    - `sherpa-onnx-offline` (requer `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny incluído)
    - `whisper` (CLI Python; baixa modelos automaticamente)

  </Step>
  <Step title="CLI Gemini">
    `gemini` usando `read_many_files`.
  </Step>
  <Step title="Autenticação de provedor">
    - Entradas `models.providers.*` configuradas que oferecem suporte à capacidade são tentadas antes da ordem de fallback incluída.
    - Provedores de configuração somente de imagem com um modelo compatível com imagem são registrados automaticamente para compreensão de mídia mesmo quando não são um plugin de fornecedor incluído.
    - A compreensão de imagem do Ollama fica disponível quando selecionada explicitamente, por exemplo por `agents.defaults.imageModel` ou `openclaw infer image describe --model ollama/<vision-model>`.

    Ordem de fallback incluída:

    - Áudio: OpenAI → Groq → xAI → Deepgram → OpenRouter → Google → SenseAudio → ElevenLabs → Mistral
    - Imagem: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
    - Vídeo: Google → Qwen → Moonshot

  </Step>
</Steps>

Para desativar a detecção automática, defina:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

<Note>
A detecção de binários é best-effort no macOS/Linux/Windows; certifique-se de que a CLI esteja em `PATH` (expandimos `~`) ou defina um modelo de CLI explícito com um caminho de comando completo.
</Note>

### Suporte a ambiente de proxy (modelos de provedor)

Quando a compreensão de mídia de **áudio** e **vídeo** baseada em provedor está habilitada, o OpenClaw respeita variáveis de ambiente padrão de proxy de saída para chamadas HTTP de provedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Se nenhuma variável de ambiente de proxy estiver definida, a compreensão de mídia usa saída direta. Se o valor do proxy estiver malformado, o OpenClaw registra um aviso e faz fallback para busca direta.

## Capacidades (opcional)

Se você definir `capabilities`, a entrada será executada somente para esses tipos de mídia. Para listas compartilhadas, o OpenClaw pode inferir padrões:

- `openai`, `anthropic`, `minimax`: **imagem**
- `minimax-portal`: **imagem**
- `moonshot`: **imagem + vídeo**
- `openrouter`: **imagem + áudio**
- `google` (API Gemini): **imagem + áudio + vídeo**
- `qwen`: **imagem + vídeo**
- `mistral`: **áudio**
- `zai`: **imagem**
- `groq`: **áudio**
- `xai`: **áudio**
- `deepgram`: **áudio**
- Qualquer catálogo `models.providers.<id>.models[]` com um modelo compatível com imagem: **imagem**

Para entradas de CLI, **defina `capabilities` explicitamente** para evitar correspondências inesperadas. Se você omitir `capabilities`, a entrada será qualificada para a lista em que aparece.

## Matriz de suporte de provedores (integrações do OpenClaw)

| Capacidade | Integração de provedor                                                                                                       | Observações                                                                                                                                                                                                                                 |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagem     | OpenAI, OpenAI Codex OAuth, Codex app-server, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provedores de configuração | Plugins de fornecedor registram suporte a imagem; `openai/*` pode usar chave de API ou roteamento OAuth do Codex; `codex/*` usa um turno limitado do Codex app-server; MiniMax e MiniMax OAuth usam `MiniMax-VL-01`; provedores de configuração compatíveis com imagem são registrados automaticamente. |
| Áudio      | OpenAI, Groq, xAI, Deepgram, OpenRouter, Google, SenseAudio, ElevenLabs, Mistral                                             | Transcrição de provedor (Whisper/Groq/xAI/Deepgram/OpenRouter STT/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                        |
| Vídeo      | Google, Qwen, Moonshot                                                                                                       | Compreensão de vídeo por provedor via plugins de fornecedor; a compreensão de vídeo do Qwen usa os endpoints Standard DashScope.                                                                                                            |

<Note>
**Observação sobre MiniMax**

- A compreensão de imagens de `minimax`, `minimax-cn`, `minimax-portal` e `minimax-portal-cn` vem do provedor de mídia `MiniMax-VL-01` pertencente ao Plugin.
- O roteamento automático de imagens continua usando `MiniMax-VL-01` mesmo que metadados legados de chat do MiniMax M2.x declarem entrada de imagem.

</Note>

## Orientação para seleção de modelos

- Prefira o modelo de geração mais recente e mais forte disponível para cada capacidade de mídia quando qualidade e segurança forem importantes.
- Para agentes com ferramentas habilitadas que lidam com entradas não confiáveis, evite modelos de mídia mais antigos/fracos.
- Mantenha pelo menos um fallback por capacidade para disponibilidade (modelo de qualidade + modelo mais rápido/mais barato).
- Fallbacks da CLI (`whisper-cli`, `whisper`, `gemini`) são úteis quando APIs de provedores estão indisponíveis.
- Observação sobre `parakeet-mlx`: com `--output-dir`, o OpenClaw lê `<output-dir>/<media-basename>.txt` quando o formato de saída é `txt` (ou não especificado); formatos diferentes de `txt` fazem fallback para stdout.

## Política de anexos

`attachments` por capacidade controla quais anexos são processados:

<ParamField path="mode" type='"first" | "all"' default="first">
  Se deve processar o primeiro anexo selecionado ou todos eles.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita o número processado.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferência de seleção entre anexos candidatos.
</ParamField>

Quando `mode: "all"`, as saídas são rotuladas como `[Image 1/2]`, `[Audio 2/2]` etc.

<AccordionGroup>
  <Accordion title="File-attachment extraction behavior">
    - O texto extraído do arquivo é encapsulado como **conteúdo externo não confiável** antes de ser anexado ao prompt de mídia.
    - O bloco injetado usa marcadores de limite explícitos como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e inclui uma linha de metadados `Source: External`.
    - Este caminho de extração de anexos omite intencionalmente o banner longo `SECURITY NOTICE:` para evitar aumentar demais o prompt de mídia; os marcadores de limite e metadados ainda permanecem.
    - Se um arquivo não tiver texto extraível, o OpenClaw injeta `[No extractable text]`.
    - Se um PDF fizer fallback para imagens de páginas renderizadas neste caminho, o OpenClaw encaminha essas imagens de página para modelos de resposta com capacidade de visão e mantém o placeholder `[PDF content rendered to images]` no bloco do arquivo.

  </Accordion>
</AccordionGroup>

## Exemplos de configuração

<Tabs>
  <Tab title="Shared models + overrides">
    ```json5
    {
      tools: {
        media: {
          models: [
            { provider: "openai", model: "gpt-5.5", capabilities: ["image"] },
            {
              provider: "google",
              model: "gemini-3-flash-preview",
              capabilities: ["image", "audio", "video"],
            },
            {
              type: "cli",
              command: "gemini",
              args: [
                "-m",
                "gemini-3-flash",
                "--allowed-tools",
                "read_file",
                "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
              ],
              capabilities: ["image", "video"],
            },
          ],
          audio: {
            attachments: { mode: "all", maxAttachments: 2 },
          },
          video: {
            maxChars: 500,
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Audio + video only">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [
              { provider: "openai", model: "gpt-4o-mini-transcribe" },
              {
                type: "cli",
                command: "whisper",
                args: ["--model", "base", "{{MediaPath}}"],
              },
            ],
          },
          video: {
            enabled: true,
            maxChars: 500,
            models: [
              { provider: "google", model: "gemini-3-flash-preview" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Image-only">
    ```json5
    {
      tools: {
        media: {
          image: {
            enabled: true,
            maxBytes: 10485760,
            maxChars: 500,
            models: [
              { provider: "openai", model: "gpt-5.5" },
              { provider: "anthropic", model: "claude-opus-4-6" },
              {
                type: "cli",
                command: "gemini",
                args: [
                  "-m",
                  "gemini-3-flash",
                  "--allowed-tools",
                  "read_file",
                  "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
                ],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Multi-modal single entry">
    ```json5
    {
      tools: {
        media: {
          image: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          audio: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
          video: {
            models: [
              {
                provider: "google",
                model: "gemini-3.1-pro-preview",
                capabilities: ["image", "video", "audio"],
              },
            ],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Saída de status

Quando a compreensão de mídia é executada, `/status` inclui uma linha curta de resumo:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Isso mostra os resultados por capacidade e o provedor/modelo escolhido quando aplicável.

## Observações

- A compreensão é **de melhor esforço**. Erros não bloqueiam respostas.
- Anexos ainda são passados para modelos mesmo quando a compreensão está desabilitada.
- Use `scope` para limitar onde a compreensão é executada (por exemplo, somente DMs).

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Suporte a imagens e mídia](/pt-BR/nodes/images)
