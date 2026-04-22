---
read_when:
    - Projetando ou refatorando a compreensão de mídia
    - Ajustando o pré-processamento de áudio/vídeo/imagem de entrada
summary: Compreensão de imagem/áudio/vídeo de entrada (opcional) com fallback de provedor + CLI
title: Compreensão de mídia
x-i18n:
    generated_at: "2026-04-22T04:23:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d80c9bcd965b521c3c782a76b9dd31eb6e6c635d8a1cc6895b6ccfaf5f9492e
    source_path: nodes/media-understanding.md
    workflow: 15
---

# Compreensão de mídia - Entrada (2026-01-17)

O OpenClaw pode **resumir mídia de entrada** (imagem/áudio/vídeo) antes de o pipeline de resposta ser executado. Ele detecta automaticamente quando ferramentas locais ou chaves de provedor estão disponíveis e pode ser desabilitado ou personalizado. Se a compreensão estiver desativada, os modelos ainda receberão os arquivos/URLs originais normalmente.

O comportamento de mídia específico de fornecedor é registrado por plugins de fornecedor, enquanto o
core do OpenClaw é responsável pela configuração compartilhada de `tools.media`, ordem de fallback e integração
com o pipeline de resposta.

## Objetivos

- Opcional: pré-processar mídia de entrada em texto curto para roteamento mais rápido + melhor análise de comandos.
- Preservar a entrega da mídia original ao modelo (sempre).
- Oferecer suporte a **APIs de provedor** e **fallbacks de CLI**.
- Permitir múltiplos modelos com fallback ordenado (erro/tamanho/timeout).

## Comportamento de alto nível

1. Coletar anexos de entrada (`MediaPaths`, `MediaUrls`, `MediaTypes`).
2. Para cada capacidade habilitada (imagem/áudio/vídeo), selecionar anexos conforme a política (padrão: **primeiro**).
3. Escolher a primeira entrada de modelo elegível (tamanho + capacidade + autenticação).
4. Se um modelo falhar ou a mídia for grande demais, usar **fallback para a próxima entrada**.
5. Em caso de sucesso:
   - `Body` se torna um bloco `[Image]`, `[Audio]` ou `[Video]`.
   - O áudio define `{{Transcript}}`; a análise de comandos usa o texto da legenda quando presente,
     caso contrário, a transcrição.
   - As legendas são preservadas como `User text:` dentro do bloco.

Se a compreensão falhar ou estiver desabilitada, **o fluxo de resposta continua** com o body original + anexos.

## Visão geral da configuração

`tools.media` oferece suporte a **modelos compartilhados** mais substituições por capacidade:

- `tools.media.models`: lista de modelos compartilhada (use `capabilities` para controlar).
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - padrões (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - substituições de provedor (`baseUrl`, `headers`, `providerOptions`)
  - opções de áudio do Deepgram via `tools.media.audio.providerOptions.deepgram`
  - controles de eco da transcrição de áudio (`echoTranscript`, padrão `false`; `echoFormat`)
  - lista opcional de `models` **por capacidade** (preferida antes dos modelos compartilhados)
  - política de `attachments` (`mode`, `maxAttachments`, `prefer`)
  - `scope` (controle opcional por canal/chatType/chave de sessão)
- `tools.media.concurrency`: máximo de execuções simultâneas por capacidade (padrão **2**).

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

Cada entrada `models[]` pode ser de **provedor** ou **CLI**:

```json5
{
  type: "provider", // default if omitted
  provider: "openai",
  model: "gpt-5.4-mini",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // optional, used for multi‑modal entries
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

Modelos de CLI também podem usar:

- `{{MediaDir}}` (diretório que contém o arquivo de mídia)
- `{{OutputDir}}` (diretório temporário criado para esta execução)
- `{{OutputBase}}` (caminho base do arquivo temporário, sem extensão)

## Padrões e limites

Padrões recomendados:

- `maxChars`: **500** para imagem/vídeo (curto, adequado para comandos)
- `maxChars`: **não definido** para áudio (transcrição completa, a menos que você defina um limite)
- `maxBytes`:
  - imagem: **10MB**
  - áudio: **20MB**
  - vídeo: **50MB**

Regras:

- Se a mídia exceder `maxBytes`, esse modelo será ignorado e o **próximo modelo será tentado**.
- Arquivos de áudio menores que **1024 bytes** são tratados como vazios/corrompidos e ignorados antes da transcrição por provedor/CLI.
- Se o modelo retornar mais do que `maxChars`, a saída será truncada.
- `prompt` usa por padrão um simples “Describe the {media}.” mais a orientação de `maxChars` (somente imagem/vídeo).
- Se o modelo de imagem primário ativo já oferecer suporte nativo a visão, o OpenClaw
  ignora o bloco de resumo `[Image]` e passa a imagem original diretamente para o
  modelo.
- Solicitações explícitas `openclaw infer image describe --model <provider/model>`
  são diferentes: elas executam diretamente esse provedor/modelo com suporte a imagem, incluindo
  refs do Ollama como `ollama/qwen2.5vl:7b`.
- Se `<capability>.enabled: true`, mas nenhum modelo estiver configurado, o OpenClaw tenta o
  **modelo de resposta ativo** quando o provedor dele oferece suporte à capacidade.

### Detecção automática de compreensão de mídia (padrão)

Se `tools.media.<capability>.enabled` **não** estiver definido como `false` e você não tiver
configurado modelos, o OpenClaw detecta automaticamente nesta ordem e **para na primeira
opção funcional**:

1. **Modelo de resposta ativo** quando o provedor dele oferece suporte à capacidade.
2. Refs primárias/de fallback de **`agents.defaults.imageModel`** (somente imagem).
3. **CLIs locais** (somente áudio; se instaladas)
   - `sherpa-onnx-offline` (exige `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (`whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny incluído)
   - `whisper` (CLI Python; baixa modelos automaticamente)
4. **Gemini CLI** (`gemini`) usando `read_many_files`
5. **Autenticação do provedor**
   - Entradas configuradas em `models.providers.*` que oferecem suporte à capacidade são
     tentadas antes da ordem de fallback incluída.
   - Provedores de configuração somente de imagem com um modelo compatível com imagem se registram automaticamente para
     compreensão de mídia mesmo quando não são um plugin de fornecedor incluído.
   - A compreensão de imagem com Ollama está disponível quando selecionada explicitamente, por
     exemplo por meio de `agents.defaults.imageModel` ou
     `openclaw infer image describe --model ollama/<vision-model>`.
   - Ordem de fallback incluída:
     - Áudio: OpenAI → Groq → Deepgram → Google → Mistral
     - Imagem: OpenAI → Anthropic → Google → MiniMax → MiniMax Portal → Z.AI
     - Vídeo: Google → Qwen → Moonshot

Para desabilitar a detecção automática, defina:

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

Observação: a detecção de binários é feita por melhor esforço em macOS/Linux/Windows; certifique-se de que a CLI esteja no `PATH` (expandimos `~`) ou defina um modelo de CLI explícito com um caminho completo para o comando.

### Suporte a ambiente de proxy (modelos de provedor)

Quando a compreensão de mídia de **áudio** e **vídeo** baseada em provedor estiver habilitada, o OpenClaw
respeita variáveis de ambiente padrão de proxy de saída para chamadas HTTP ao provedor:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma variável de ambiente de proxy estiver definida, a compreensão de mídia usará saída direta.
Se o valor do proxy estiver malformado, o OpenClaw registrará um aviso e fará fallback para
busca direta.

## Capacidades (opcional)

Se você definir `capabilities`, a entrada será executada apenas para esses tipos de mídia. Para listas
compartilhadas, o OpenClaw pode inferir padrões:

- `openai`, `anthropic`, `minimax`: **image**
- `minimax-portal`: **image**
- `moonshot`: **image + video**
- `openrouter`: **image**
- `google` (API Gemini): **image + audio + video**
- `qwen`: **image + video**
- `mistral`: **audio**
- `zai`: **image**
- `groq`: **audio**
- `deepgram`: **audio**
- Qualquer catálogo `models.providers.<id>.models[]` com um modelo compatível com imagem:
  **image**

Para entradas de CLI, **defina `capabilities` explicitamente** para evitar correspondências inesperadas.
Se você omitir `capabilities`, a entrada estará elegível para a lista em que aparece.

## Matriz de suporte de provedor (integrações do OpenClaw)

| Capability | Integração de provedor                                                               | Observações                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Image      | OpenAI, OpenRouter, Anthropic, Google, MiniMax, Moonshot, Qwen, Z.AI, provedores de configuração | Plugins de fornecedor registram suporte a imagem; MiniMax e MiniMax OAuth usam `MiniMax-VL-01`; provedores de configuração compatíveis com imagem se registram automaticamente. |
| Audio      | OpenAI, Groq, Deepgram, Google, Mistral                                              | Transcrição por provedor (Whisper/Deepgram/Gemini/Voxtral).                                                                             |
| Video      | Google, Qwen, Moonshot                                                               | Compreensão de vídeo por provedor via plugins de fornecedor; a compreensão de vídeo do Qwen usa os endpoints Standard DashScope.       |

Observação sobre o MiniMax:

- A compreensão de imagem de `minimax` e `minimax-portal` vem do provedor de mídia
  `MiniMax-VL-01`, pertencente ao plugin.
- O catálogo de texto incluído do MiniMax ainda começa somente com texto; entradas explícitas em
  `models.providers.minimax` materializam refs de chat M2.7 compatíveis com imagem.

## Orientação para seleção de modelos

- Prefira o modelo mais forte e da geração mais recente disponível para cada capacidade de mídia quando qualidade e segurança forem importantes.
- Para agentes com ferramentas habilitadas que lidam com entradas não confiáveis, evite modelos de mídia mais antigos/mais fracos.
- Mantenha pelo menos um fallback por capacidade para disponibilidade (modelo de qualidade + modelo mais rápido/mais barato).
- Fallbacks de CLI (`whisper-cli`, `whisper`, `gemini`) são úteis quando APIs de provedor não estão disponíveis.
- Observação sobre `parakeet-mlx`: com `--output-dir`, o OpenClaw lê `<output-dir>/<media-basename>.txt` quando o formato de saída é `txt` (ou não especificado); formatos não `txt` usam stdout como fallback.

## Política de anexos

`attachments` por capacidade controla quais anexos são processados:

- `mode`: `first` (padrão) ou `all`
- `maxAttachments`: limita a quantidade processada (padrão **1**)
- `prefer`: `first`, `last`, `path`, `url`

Quando `mode: "all"`, as saídas são rotuladas como `[Image 1/2]`, `[Audio 2/2]` etc.

Comportamento da extração de anexos de arquivo:

- O texto extraído do arquivo é encapsulado como **conteúdo externo não confiável** antes de ser
  anexado ao prompt de mídia.
- O bloco injetado usa marcadores explícitos de limite, como
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`, e inclui uma
  linha de metadados `Source: External`.
- Este caminho de extração de anexos omite intencionalmente o longo banner
  `SECURITY NOTICE:` para evitar inflar o prompt de mídia; os marcadores de
  limite e os metadados ainda permanecem.
- Se um arquivo não tiver texto extraível, o OpenClaw injeta `[No extractable text]`.
- Se um PDF usar como fallback imagens renderizadas de páginas neste caminho, o prompt de mídia mantém
  o placeholder `[PDF content rendered to images; images not forwarded to model]`
  porque esta etapa de extração de anexos encaminha blocos de texto, não as imagens renderizadas do PDF.

## Exemplos de configuração

### 1) Lista de modelos compartilhada + substituições

```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.4-mini", capabilities: ["image"] },
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

### 2) Somente áudio + vídeo (imagem desativada)

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
          { provider: "openai", model: "gpt-5.4-mini" },
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
📎 Media: image ok (openai/gpt-5.4-mini) · audio skipped (maxBytes)
```

Isso mostra os resultados por capacidade e o provedor/modelo escolhido, quando aplicável.

## Observações

- A compreensão é feita por **melhor esforço**. Erros não bloqueiam respostas.
- Os anexos ainda são passados aos modelos mesmo quando a compreensão está desabilitada.
- Use `scope` para limitar onde a compreensão é executada (por exemplo, somente em DMs).

## Documentação relacionada

- [Configuração](/pt-BR/gateway/configuration)
- [Suporte a imagem e mídia](/pt-BR/nodes/images)
