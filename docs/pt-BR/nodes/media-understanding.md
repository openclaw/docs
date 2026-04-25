---
read_when:
    - Projetando ou refatorando a compreensão de mídia
    - Ajustando o pré-processamento de áudio/vídeo/imagem recebidos
summary: Compreensão de imagens/áudio/vídeo recebidos (opcional) com fallbacks de provedor + CLI
title: Compreensão de mídia
x-i18n:
    generated_at: "2026-04-25T13:49:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 573883a2e0bf27fc04da1a5464e53ba41d006ecad5a04704c24467e77c8eda3d
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Compreensão de mídia - Entrada (2026-01-17)

O OpenClaw pode **resumir mídia recebida** (imagem/áudio/vídeo) antes de o pipeline de resposta ser executado. Ele detecta automaticamente quando ferramentas locais ou chaves de provedor estão disponíveis, e pode ser desativado ou personalizado. Se a compreensão estiver desativada, os modelos ainda recebem os arquivos/URLs originais normalmente.

O comportamento de mídia específico de fornecedor é registrado por Plugins de fornecedor, enquanto o
núcleo do OpenClaw controla a configuração compartilhada `tools.media`, a ordem de fallback e a
integração com o pipeline de resposta.

## Objetivos

- Opcional: pré-digerir mídia recebida em texto curto para roteamento mais rápido + melhor análise de comandos.
- Preservar sempre a entrega da mídia original ao modelo.
- Oferecer suporte a **APIs de provedor** e **fallbacks de CLI**.
- Permitir vários modelos com fallback ordenado (erro/tamanho/timeout).

## Comportamento em alto nível

1. Coletar anexos recebidos (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Para cada capacidade ativada (imagem/áudio/vídeo), selecionar anexos por política (padrão: **primeiro**).
3. Escolher a primeira entrada de modelo elegível (tamanho + capacidade + autenticação).
4. Se um modelo falhar ou a mídia for grande demais, fazer **fallback para a próxima entrada**.
5. Em caso de sucesso:
   - `Body` torna-se um bloco `[Image]`, `[Audio]` ou `[Video]`.
   - Áudio define `{{Transcript}}`; a análise de comandos usa o texto da legenda quando presente,
     caso contrário usa a transcrição.
   - Legendas são preservadas como `User text:` dentro do bloco.

Se a compreensão falhar ou estiver desativada, **o fluxo de resposta continua** com o body + anexos originais.

## Visão geral da configuração

`tools.media` oferece suporte a **modelos compartilhados** mais sobrescritas por capacidade:

- `tools.media.models`: lista de modelos compartilhada (use `capabilities` para controlar).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - padrões (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - sobrescritas de provedor (`baseUrl`, `headers`, `providerOptions`)
  - opções de áudio Deepgram via `tools.media.audio.providerOptions.deepgram`
  - controles de eco de transcrição de áudio (`echoTranscript`, padrão `false`; `echoFormat`)
  - lista opcional de `models` **por capacidade** (preferida antes dos modelos compartilhados)
  - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (controle opcional por channel/chatType/session key)
- `tools.media.concurrency`: máximo de execuções concorrentes por capacidade (padrão **2**).

```json5
{
  tools: {
    media: {
      models: [
        /* lista compartilhada */
      ],
      image: {
        /* sobrescritas opcionais */
      },
      audio: {
        /* sobrescritas opcionais */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* sobrescritas opcionais */
      },
    },
  },
}
```

### Entradas de modelo

Cada entrada de `models[]` pode ser de **provider** ou **CLI**:

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
- `{{OutputDir}}` (diretório temporário criado para esta execução)
- `{{OutputBase}}` (caminho base do arquivo temporário, sem extensão)

## Padrões e limites

Padrões recomendados:

- `maxChars`: **500** para imagem/vídeo (curto, amigável para comandos)
- `maxChars`: **não definido** para áudio (transcrição completa, a menos que você defina um limite)
- `maxBytes`:
  - imagem: **10MB**
  - áudio: **20MB**
  - vídeo: **50MB**

Regras:

- Se a mídia exceder `maxBytes`, esse modelo é ignorado e o **próximo modelo é tentado**.
- Arquivos de áudio menores que **1024 bytes** são tratados como vazios/corrompidos e ignorados antes da transcrição por provider/CLI.
- Se o modelo retornar mais que `maxChars`, a saída será truncada.
- `prompt` tem como padrão um simples “Describe the {media}.” mais a orientação de `maxChars` (apenas imagem/vídeo).
- Se o modelo de imagem primário ativo já oferecer suporte nativo a visão, o OpenClaw
  ignora o bloco de resumo `[Image]` e passa a imagem original diretamente ao
  modelo.
- Se um modelo primário do Gateway/WebChat for somente texto, anexos de imagem são
  preservados como refs descarregadas `media://inbound/*`, para que as ferramentas de imagem/PDF ou o
  modelo de imagem configurado ainda possam inspecioná-los, em vez de perder o anexo.
- Solicitações explícitas `openclaw infer image describe --model <provider/model>`
  são diferentes: elas executam diretamente esse provider/model com capacidade de imagem, incluindo
  refs Ollama como `ollama/qwen2.5vl:7b`.
- Se `<capability>.enabled: true`, mas nenhum modelo estiver configurado, o OpenClaw tentará o
  **modelo de resposta ativo** quando o provedor dele oferecer suporte à capacidade.

### Detecção automática de compreensão de mídia (padrão)

Se `tools.media.<capability>.enabled` **não** estiver definido como `false` e você não
tiver configurado modelos, o OpenClaw detecta automaticamente nesta ordem e **para na primeira
opção funcional**:

1. **Modelo de resposta ativo** quando seu provedor oferece suporte à capacidade.
2. Refs primárias/de fallback de **`agents.defaults.imageModel`** (apenas imagem).
3. **CLIs locais** (apenas áudio; se instaladas)
   - `sherpa-onnx-offline` (exige `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny incluído)
   - `whisper` (CLI Python; baixa modelos automaticamente)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticação de provider**
   - Entradas configuradas de `models.providers.*` que oferecem suporte à capacidade são
     tentadas antes da ordem de fallback incluída.
   - Providers configurados apenas para imagem com um modelo compatível com imagem se registram automaticamente para
     compreensão de mídia, mesmo quando não são um Plugin de fornecedor incluído.
   - A compreensão de imagem do Ollama está disponível quando selecionada explicitamente, por
     exemplo via `agents.defaults.imageModel` ou
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Ordem de fallback incluída:
     - Áudio: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral
     - Imagem: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Vídeo: Google → Qwen → Moonshot

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

Observação: a detecção de binário é best-effort em macOS/Linux/Windows; garanta que a CLI esteja no `PATH` (expandimos `~`) ou defina um modelo CLI explícito com um caminho completo de comando.

### Suporte a ambiente de proxy (modelos de provider)

Quando a compreensão de mídia baseada em provider para **áudio** e **vídeo** está ativada, o OpenClaw
respeita variáveis padrão de ambiente de proxy de saída para chamadas HTTP ao provider:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma variável de ambiente de proxy estiver definida, a compreensão de mídia usa saída direta.
Se o valor do proxy estiver malformado, o OpenClaw registra um aviso e faz fallback para busca
direta.

## Capacidades (opcional)

Se você definir `capabilities`, a entrada só será executada para esses tipos de mídia. Para listas
compartilhadas, o OpenClaw pode inferir padrões:

- `openai`, `anthropic`, `minimax`: **imagem**
- `minimax-portal`: **imagem**
- `moonshot`: **imagem + vídeo**
- `openrouter`: **imagem**
- `google` (Gemini API): **imagem + áudio + vídeo**
- `qwen`: **imagem + vídeo**
- `mistral`: **áudio**
- `zai`: **imagem**
- `groq`: **áudio**
- `xai`: **áudio**
- `deepgram`: **áudio**
- Qualquer catálogo `models.providers.<id>.models[]` com um modelo compatível com imagem:
  **imagem**

Para entradas de CLI, **defina `capabilities` explicitamente** para evitar correspondências inesperadas.
Se você omitir `capabilities`, a entrada é elegível para a lista em que aparece.

## Matriz de suporte de provider (integrações do OpenClaw)

| Capacidade | Integração de provider                                                                                                  | Observações                                                                                                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Imagem     | OpenAI, OpenAI Codex OAuth, servidor de app Codex, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, providers configurados | Plugins de fornecedor registram suporte a imagem; `openai-codex/*` usa a infraestrutura OAuth do provider; `codex/*` usa um turno limitado do servidor de app Codex; MiniMax e MiniMax OAuth usam `MiniMax-VL-01`; providers configurados compatíveis com imagem se registram automaticamente. |
| Áudio      | OpenAI, Groq, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral                                                    | Transcrição por provider (Whisper/Groq/xAI/Deepgram/Gemini/SenseAudio/Scribe/Voxtral).                                                                                                                                                  |
| Vídeo      | Google, Qwen, Moonshot                                                                                                  | Compreensão de vídeo por provider via Plugins de fornecedor; a compreensão de vídeo do Qwen usa endpoints Standard DashScope.                                                                                                          |

Observação sobre MiniMax:

- A compreensão de imagem de `minimax` e `minimax-portal` vem do provider de mídia
  `MiniMax-VL-01`, de propriedade do Plugin.
- O catálogo de texto MiniMax incluído ainda começa somente texto; entradas explícitas
  `models.providers.minimax` materializam refs de chat M2.7 compatíveis com imagem.

## Orientação de seleção de modelo

- Prefira o modelo mais forte e de geração mais recente disponível para cada capacidade de mídia quando qualidade e segurança forem importantes.
- Para agentes com ferramentas lidando com entradas não confiáveis, evite modelos de mídia mais antigos/mais fracos.
- Mantenha pelo menos um fallback por capacidade para disponibilidade (modelo de qualidade + modelo mais rápido/mais barato).
- Fallbacks de CLI (`whisper-cli`, `whisper`, `gemini`) são úteis quando APIs de provider não estão disponíveis.
- Observação sobre `parakeet-mlx`: com `--output-dir`, o OpenClaw lê `<output-dir>/<media-basename>.txt` quando o formato de saída é `txt` (ou não especificado); formatos diferentes de `txt` fazem fallback para stdout.

## Política de anexos

`attachments` por capacidade controla quais anexos são processados:

- `mode`: `first` (padrão) ou `all`
- `maxAttachments`: limita a quantidade processada (padrão **1**)
- `prefer`: `first`, `last`, `path`, `url`

Quando `mode: "all"`, as saídas são rotuladas como `[Image 1/2]`, `[Audio 2/2]` etc.

Comportamento de extração de anexo de arquivo:

- O texto extraído do arquivo é encapsulado como **conteúdo externo não confiável** antes de ser
  acrescentado ao prompt de mídia.
- O bloco injetado usa marcadores explícitos de limite como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` e inclui uma
  linha de metadados `Source: External`.
- Esse caminho de extração de anexo omite intencionalmente o longo banner
  `SECURITY NOTICE:` para evitar inflar o prompt de mídia; os marcadores de
  limite e os metadados ainda permanecem.
- Se um arquivo não tiver texto extraível, o OpenClaw injeta `[No extractable text]`.
- Se um PDF fizer fallback para imagens renderizadas de página nesse caminho, o prompt de mídia mantém
  o placeholder `[PDF content rendered to images; images not forwarded to model]`
  porque essa etapa de extração de anexo encaminha blocos de texto, não as imagens PDF renderizadas.

## Exemplos de configuração

### 1) Lista de modelos compartilhada + sobrescritas

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

### 2) Apenas áudio + vídeo (imagem desativada)

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

### 3) Compreensão opcional de imagem

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

### 4) Entrada única multimodal (capacidades explícitas)

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

## Saída de status

Quando a compreensão de mídia é executada, `/status` inclui uma linha curta de resumo:

```
📎 Media: image ok (openai/gpt-5.4) · audio skipped (maxBytes)
```

Isso mostra resultados por capacidade e o provider/model escolhido quando aplicável.

## Observações

- A compreensão é **best-effort**. Erros não bloqueiam respostas.
- Anexos ainda são passados aos modelos mesmo quando a compreensão está desativada.
- Use `scope` para limitar onde a compreensão é executada (por exemplo apenas DMs).

## Documentação relacionada

- [Configuration](/pt-BR/gateway/configuration)
- [Suporte a imagem e mídia](/pt-BR/nodes/images)
