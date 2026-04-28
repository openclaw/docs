---
read_when:
    - Projetando ou refatorando entendimento de mídia
    - Ajustando o pré-processamento de áudio/vídeo/imagem de entrada
sidebarTitle: Media understanding
summary: Entendimento de imagem/áudio/vídeo de entrada (opcional) com fallbacks de provedor + CLI
title: Entendimento de mídia
x-i18n:
    generated_at: "2026-04-26T11:32:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 25ee170a7af523fd2ce4f5f7764638f510b135f94a7796325daf1c3e04147f90
    source_path: nodes/media-understanding.md
    workflow: 15
---

O OpenClaw pode **resumir mídia de entrada** (imagem/áudio/vídeo) antes de o pipeline de resposta ser executado. Ele detecta automaticamente quando ferramentas locais ou chaves de provedor estão disponíveis e pode ser desativado ou personalizado. Se o entendimento estiver desativado, os modelos ainda recebem os arquivos/URLs originais normalmente.

O comportamento de mídia específico de fornecedor é registrado por Plugins de fornecedor, enquanto o core do OpenClaw controla a configuração compartilhada `tools.media`, a ordem de fallback e a integração com o pipeline de resposta.

## Objetivos

- Opcional: pré-digerir mídia de entrada em texto curto para roteamento mais rápido + melhor análise de comandos.
- Preservar sempre a entrega da mídia original ao modelo.
- Oferecer suporte a **APIs de provedor** e **fallbacks de CLI**.
- Permitir múltiplos modelos com fallback ordenado (erro/tamanho/timeout).

## Comportamento de alto nível

<Steps>
  <Step title="Coletar anexos">
    Coletar anexos de entrada (`MediaPaths`, `MediaUrls`, `MediaTypes`).
  </Step>
  <Step title="Selecionar por capability">
    Para cada capability ativada (imagem/áudio/vídeo), selecionar anexos conforme a política (padrão: **first**).
  </Step>
  <Step title="Escolher modelo">
    Escolher a primeira entrada de modelo elegível (tamanho + capability + auth).
  </Step>
  <Step title="Fallback em caso de falha">
    Se um modelo falhar ou a mídia for grande demais, fazer **fallback para a próxima entrada**.
  </Step>
  <Step title="Aplicar bloco de sucesso">
    Em caso de sucesso:

    - `Body` se torna um bloco `[Image]`, `[Audio]` ou `[Video]`.
    - Áudio define `{{Transcript}}`; a análise de comando usa o texto da legenda quando presente, caso contrário a transcrição.
    - Legendas são preservadas como `User text:` dentro do bloco.

  </Step>
</Steps>

Se o entendimento falhar ou estiver desativado, **o fluxo de resposta continua** com o corpo original + anexos.

## Visão geral da configuração

`tools.media` oferece suporte a **modelos compartilhados** mais substituições por capability:

<AccordionGroup>
  <Accordion title="Chaves de nível superior">
    - `tools.media.models`: lista de modelos compartilhada (use `capabilities` para gating).
    - `tools.media.image` / `tools.media.audio` / `tools.media.video`:
      - padrões (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
      - substituições de provedor (`baseUrl`, `headers`, `providerOptions`)
      - opções de áudio do Deepgram via `tools.media.audio.providerOptions.deepgram`
      - controles de eco de transcrição de áudio (`echoTranscript`, padrão `false`; `echoFormat`)
      - lista opcional de `models` **por capability** (preferida antes dos modelos compartilhados)
      - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
      - `scope` (gating opcional por channel/chatType/chave de sessão)
    - `tools.media.concurrency`: máximo de execuções simultâneas de capability (padrão **2**).

  </Accordion>
</AccordionGroup>

```json5
{
  tools: {
    media: {
      models: [
        /* lista compartilhada */
      ],
      image: {
        /* substituições opcionais */
      },
      audio: {
        /* substituições opcionais */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* substituições opcionais */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada `models[]` pode ser de **provedor** ou **CLI**:

<Tabs>
  <Tab title="Entrada de provedor">
    ```json5
    {
      type: "provider", // padrão se omitido
      provider: "openai",
      model: "gpt-5.5",
      prompt: "Describe the image in <= 500 chars.",
      maxChars: 500,
      maxBytes: 10485760,
      timeoutSeconds: 60,
      capabilities: ["image"], // opcional, usado para entradas multimodais
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
    - `{{OutputDir}}` (diretório de trabalho criado para esta execução)
    - `{{OutputBase}}` (caminho base do arquivo temporário, sem extensão)

  </Tab>
</Tabs>

## Padrões e limites

Padrões recomendados:

- `maxChars`: **500** para imagem/vídeo (curto, amigável para comandos)
- `maxChars`: **não definido** para áudio (transcrição completa, a menos que você defina um limite)
- `maxBytes`:
  - imagem: **10MB**
  - áudio: **20MB**
  - vídeo: **50MB**

<AccordionGroup>
  <Accordion title="Regras">
    - Se a mídia exceder `maxBytes`, esse modelo será ignorado e o **próximo modelo será tentado**.
    - Arquivos de áudio menores que **1024 bytes** são tratados como vazios/corrompidos e ignorados antes da transcrição por provedor/CLI; o contexto de resposta de entrada recebe uma transcrição placeholder determinística para que o agente saiba que a nota era pequena demais.
    - Se o modelo retornar mais do que `maxChars`, a saída será truncada.
    - `prompt` usa por padrão um simples "Describe the {media}." mais a orientação de `maxChars` (somente imagem/vídeo).
    - Se o modelo principal de imagem ativo já oferecer suporte nativo a visão, o OpenClaw ignora o bloco de resumo `[Image]` e passa a imagem original para o modelo.
    - Se um modelo principal de Gateway/WebChat for somente texto, anexos de imagem serão preservados como refs descarregadas `media://inbound/*` para que as ferramentas de imagem/PDF ou o modelo de imagem configurado ainda possam inspecioná-los em vez de perder o anexo.
    - Requisições explícitas `openclaw infer image describe --model <provider/model>` são diferentes: elas executam diretamente esse provedor/modelo compatível com imagem, incluindo refs do Ollama como `ollama/qwen2.5vl:7b`.
    - Se `<capability>.enabled: true`, mas nenhum modelo estiver configurado, o OpenClaw tenta o **modelo de resposta ativo** quando o provedor dele oferece suporte à capability.

  </Accordion>
</AccordionGroup>

### Detecção automática de entendimento de mídia (padrão)

Se `tools.media.<capability>.enabled` **não** estiver definido como `false` e você não tiver configurado modelos, o OpenClaw detecta automaticamente nesta ordem e **para na primeira opção funcional**:

<Steps>
  <Step title="Modelo de resposta ativo">
    Modelo de resposta ativo quando o provedor dele oferece suporte à capability.
  </Step>
  <Step title="agents.defaults.imageModel">
    Refs principal/fallback de `agents.defaults.imageModel` (somente imagem).
  </Step>
  <Step title="CLIs locais (somente áudio)">
    CLIs locais (se instaladas):

    - `sherpa-onnx-offline` (exige `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
    - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny incluído)
    - `whisper` (CLI Python; baixa modelos automaticamente)

  </Step>
  <Step title="Gemini CLI">
    `gemini` usando `read_many_files`.
  </Step>
  <Step title="Auth do provedor">
    - Entradas configuradas `models.providers.*` que oferecem suporte à capability são tentadas antes da ordem de fallback incluída.
    - Provedores de configuração somente imagem com um modelo compatível com imagem são registrados automaticamente para entendimento de mídia mesmo quando não são um Plugin de fornecedor incluído.
    - O entendimento de imagem com Ollama está disponível quando selecionado explicitamente, por exemplo por meio de `agents.defaults.imageModel` ou `openclaw infer image describe --model ollama/<vision-model>`.

    Ordem de fallback incluída:

    - Áudio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
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
A detecção de binário é best-effort em macOS/Linux/Windows; certifique-se de que a CLI esteja no `PATH` (expandimos `~`) ou defina um modelo CLI explícito com um caminho completo para o comando.
</Note>

### Suporte a ambiente de proxy (modelos de provedor)

Quando o entendimento de mídia por provedor de **áudio** e **vídeo** está ativado, o OpenClaw respeita variáveis de ambiente padrão de proxy de saída para chamadas HTTP do provedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma variável de env de proxy estiver definida, o entendimento de mídia usa saída direta. Se o valor do proxy estiver malformado, o OpenClaw registra um aviso e faz fallback para busca direta.

## Capabilities (opcional)

Se você definir `capabilities`, a entrada só será executada para esses tipos de mídia. Para listas compartilhadas, o OpenClaw pode inferir padrões:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (API Gemini): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `xai`: **audio**
- `deepgram`: **audio**
- Qualquer catálogo `models.providers.<id>.models[]` com um modelo compatível com imagem: **image**

Para entradas de CLI, **defina `capabilities` explicitamente** para evitar correspondências inesperadas. Se você omitir `capabilities`, a entrada será elegível para a lista em que aparecer.

## Matriz de suporte de provedor (integrações OpenClaw)

| Capability | Integração de provedor                                                                                                       | Observações                                                                                                                                                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagem     | OpenAI, OpenAI Codex OAuth, servidor de app Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provedores de configuração | Plugins de fornecedor registram suporte a imagem; `openai-codex/*` usa a infraestrutura de provedor OAuth; `codex/*` usa um turno limitado do servidor de app Codex; MiniMax e MiniMax OAuth usam `MiniMax-VL-01`; provedores de configuração compatíveis com imagem são registrados automaticamente. |
| Áudio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                         | Transcrição por provedor (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                  |
| Vídeo      | Google, Qwen, Moonshot                                                                                                       | Entendimento de vídeo por provedor via Plugins de fornecedor; entendimento de vídeo do Qwen usa endpoints Standard DashScope.                                                                                                           |

<Note>
**Observação sobre MiniMax**

- O entendimento de imagem de `minimax` e `minimax-portal` vem do provedor de mídia `MiniMax-VL-01` controlado pelo Plugin.
- O catálogo de texto incluído do MiniMax ainda começa como somente texto; entradas explícitas `models.providers.minimax` materializam refs de chat M2.7 compatíveis com imagem.

</Note>

## Orientação de seleção de modelo

- Prefira o modelo de geração mais forte e mais recente disponível para cada capability de mídia quando qualidade e segurança importarem.
- Para agentes com ferramentas que manipulam entradas não confiáveis, evite modelos de mídia mais antigos/mais fracos.
- Mantenha pelo menos um fallback por capability para disponibilidade (modelo de qualidade + modelo mais rápido/mais barato).
- Fallbacks de CLI (`whisper-cli`, `whisper`, `gemini`) são úteis quando APIs de provedores estão indisponíveis.
- Observação sobre `parakeet-mlx`: com `--output-dir`, o OpenClaw lê `<output-dir>/<media-basename>.txt` quando o formato de saída é `txt` (ou não especificado); formatos não `txt` fazem fallback para stdout.

## Política de anexos

`attachments` por capability controla quais anexos são processados:

<ParamField path="mode" type='"first" | "all"' default="first">
  Se deve processar o primeiro anexo selecionado ou todos eles.
</ParamField>
<ParamField path="maxAttachments" type="number" default="1">
  Limita a quantidade processada.
</ParamField>
<ParamField path="prefer" type='"first" | "last" | "path" | "url"'>
  Preferência de seleção entre anexos candidatos.
</ParamField>

Quando `mode: "all"`, as saídas são rotuladas como `[Image 1/2]`, `[Audio 2/2]` etc.

<AccordionGroup>
  <Accordion title="Comportamento de extração de anexo de arquivo">
    - O texto extraído do arquivo é encapsulado como **conteúdo externo não confiável** antes de ser acrescentado ao prompt de mídia.
    - O bloco injetado usa marcadores explícitos de limite como `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e inclui uma linha de metadados `Source: External`.
    - Esse caminho de extração de anexo intencionalmente omite o banner longo `SECURITY NOTICE:` para evitar inflar o prompt de mídia; os marcadores de limite e os metadados ainda permanecem.
    - Se um arquivo não tiver texto extraível, o OpenClaw injeta `[No extractable text]`.
    - Se um PDF fizer fallback para imagens renderizadas de página nesse caminho, o prompt de mídia mantém o placeholder `[PDF content rendered to images; images not forwarded to model]` porque essa etapa de extração de anexo encaminha blocos de texto, não as imagens renderizadas do PDF.

  </Accordion>
</AccordionGroup>

## Exemplos de configuração

<Tabs>
  <Tab title="Modelos compartilhados + substituições">
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
  <Tab title="Somente áudio + vídeo">
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
  <Tab title="Somente imagem">
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
  <Tab title="Entrada única multimodal">
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

Quando o entendimento de mídia é executado, `/status` inclui uma linha curta de resumo:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Isso mostra resultados por capability e o provedor/modelo escolhido quando aplicável.

## Observações

- O entendimento é **best-effort**. Erros não bloqueiam respostas.
- Anexos ainda são passados aos modelos mesmo quando o entendimento está desativado.
- Use `scope` para limitar onde o entendimento é executado (por exemplo, somente DMs).

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Suporte a imagem e mídia](/pt-BR/nodes/images)
