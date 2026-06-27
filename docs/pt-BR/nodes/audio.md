---
read_when:
    - Alterando a transcrição de áudio ou o tratamento de mídia
summary: Como notas de áudio/voz recebidas são baixadas, transcritas e injetadas nas respostas
title: Áudio e notas de voz
x-i18n:
    generated_at: "2026-06-27T17:39:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 90e66cf76537b090afdcd3a7791b40107ae51d6be89c84fcb14c034e38df875e
    source_path: nodes/audio.md
    workflow: 16
---

## O que funciona

- **Compreensão de mídia (áudio)**: Se a compreensão de áudio estiver habilitada (ou for detectada automaticamente), o OpenClaw:
  1. Localiza o primeiro anexo de áudio (caminho local ou URL) e o baixa, se necessário.
  2. Impõe `maxBytes` antes de enviar para cada entrada de modelo.
  3. Executa a primeira entrada de modelo elegível em ordem (provedor ou CLI).
  4. Se ela falhar ou for ignorada (tamanho/tempo limite), tenta a próxima entrada.
  5. Em caso de sucesso, substitui `Body` por um bloco `[Audio]` e define `{{Transcript}}`.
- **Análise de comandos**: Quando a transcrição é bem-sucedida, `CommandBody`/`RawBody` são definidos como a transcrição, então comandos com barra continuam funcionando.
- **Registro detalhado**: Em `--verbose`, registramos quando a transcrição é executada e quando ela substitui o corpo.

## Detecção automática (padrão)

Se você **não configurar modelos** e `tools.media.audio.enabled` **não** estiver definido como `false`,
o OpenClaw detecta automaticamente nesta ordem e para na primeira opção funcional:

1. **Modelo de resposta ativo** quando seu provedor oferece suporte à compreensão de áudio.
2. **CLIs locais** (se instaladas)
   - `sherpa-onnx-offline` (requer `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (de `whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny incluído)
   - `whisper` (CLI Python; baixa modelos automaticamente)
3. **Autenticação de provedor**
   - Entradas `models.providers.*` configuradas que oferecem suporte a áudio são tentadas primeiro
   - Ordem de fallback de provedores: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Desde 2026-05-22, a detecção automática da Gemini CLI não é mais compatível com compreensão de mídia. O Google está migrando usuários da Gemini CLI para a Antigravity CLI; áudio deve usar transcrição local ou por provedor, enquanto o fallback de CLI para imagem/vídeo deve migrar para a Antigravity CLI (`agy`).

Para desabilitar a detecção automática, defina `tools.media.audio.enabled: false`.
Para personalizar, defina `tools.media.audio.models`.
Observação: a detecção de binários é de melhor esforço no macOS/Linux/Windows; garanta que a CLI esteja no `PATH` (expandimos `~`) ou defina um modelo de CLI explícito com um caminho de comando completo.

## Exemplos de configuração

### Provedor + fallback de CLI (OpenAI + Whisper CLI)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45,
          },
        ],
      },
    },
  },
}
```

### Somente provedor com controle por escopo

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [{ action: "deny", match: { chatType: "group" } }],
        },
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

### Somente provedor (Deepgram)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }],
      },
    },
  },
}
```

### Somente provedor (Mistral Voxtral)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

### Somente provedor (SenseAudio)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
      },
    },
  },
}
```

### Ecoar transcrição no chat (opcional)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // default is false
        echoFormat: '📝 "{transcript}"', // optional, supports {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Observações e limites

- A autenticação de provedor segue a ordem padrão de autenticação de modelo (perfis de autenticação, variáveis de ambiente, `models.providers.*.apiKey`).
- Detalhes de configuração do Groq: [Groq](/pt-BR/providers/groq).
- Deepgram usa `DEEPGRAM_API_KEY` quando `provider: "deepgram"` é usado.
- Detalhes de configuração do Deepgram: [Deepgram (transcrição de áudio)](/pt-BR/providers/deepgram).
- Detalhes de configuração do Mistral: [Mistral](/pt-BR/providers/mistral).
- SenseAudio usa `SENSEAUDIO_API_KEY` quando `provider: "senseaudio"` é usado.
- Detalhes de configuração do SenseAudio: [SenseAudio](/pt-BR/providers/senseaudio).
- Provedores de áudio podem substituir `baseUrl`, `headers` e `providerOptions` por meio de `tools.media.audio`.
- O limite de tamanho padrão é 20 MB (`tools.media.audio.maxBytes`). Áudio acima do tamanho limite é ignorado para esse modelo e a próxima entrada é tentada.
- Arquivos de áudio tiny/vazios abaixo de 1024 bytes são ignorados antes da transcrição por provedor/CLI.
- O `maxChars` padrão para áudio **não é definido** (transcrição completa). Defina `tools.media.audio.maxChars` ou `maxChars` por entrada para limitar a saída.
- O padrão automático da OpenAI é `gpt-4o-mini-transcribe`; defina `model: "gpt-4o-transcribe"` para maior precisão.
- Use `tools.media.audio.attachments` para processar várias notas de voz (`mode: "all"` + `maxAttachments`).
- A transcrição fica disponível para templates como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` fica desativado por padrão; habilite-o para enviar uma confirmação de transcrição de volta ao chat de origem antes do processamento pelo agente.
- `tools.media.audio.echoFormat` personaliza o texto de eco (placeholder: `{transcript}`).
- O stdout da CLI é limitado (5 MB); mantenha a saída da CLI concisa.
- `args` da CLI deve usar `{{MediaPath}}` para o caminho do arquivo de áudio local. Execute `openclaw doctor --fix` para migrar placeholders `{input}` obsoletos de configurações `audio.transcription.command` antigas.

### Suporte a ambiente de proxy

A transcrição de áudio baseada em provedor respeita variáveis de ambiente padrão de proxy de saída:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `ALL_PROXY`
- `https_proxy`
- `http_proxy`
- `all_proxy`

Se nenhuma variável de ambiente de proxy estiver definida, a saída direta é usada. Se a configuração de proxy estiver malformada, o OpenClaw registra um aviso e faz fallback para busca direta.

## Detecção de menções em grupos

Quando `requireMention: true` é definido para um chat em grupo, o OpenClaw agora transcreve áudio **antes** de verificar menções. Isso permite que notas de voz sejam processadas mesmo quando contêm menções.

**Como funciona:**

1. Se uma mensagem de voz não tiver corpo de texto e o grupo exigir menções, o OpenClaw realiza uma transcrição de "preflight".
2. A transcrição é verificada em busca de padrões de menção (por exemplo, `@BotName`, gatilhos por emoji).
3. Se uma menção for encontrada, a mensagem segue pelo pipeline completo de resposta.
4. A transcrição é usada para detecção de menções, para que notas de voz possam passar pelo gate de menção.

**Comportamento de fallback:**

- Se a transcrição falhar durante o preflight (tempo limite, erro de API etc.), a mensagem será processada com base na detecção de menções apenas por texto.
- Isso garante que mensagens mistas (texto + áudio) nunca sejam descartadas incorretamente.

**Opt-out por grupo/tópico do Telegram:**

- Defina `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para ignorar verificações de menção por transcrição de preflight nesse grupo.
- Defina `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para substituir por tópico (`true` para ignorar, `false` para forçar a habilitação).
- O padrão é `false` (preflight habilitado quando as condições com gate de menção correspondem).

**Exemplo:** Um usuário envia uma nota de voz dizendo "Hey @Claude, what's the weather?" em um grupo do Telegram com `requireMention: true`. A nota de voz é transcrita, a menção é detectada e o agente responde.

## Pegadinhas

- Regras de escopo usam a primeira correspondência. `chatType` é normalizado para `direct`, `group` ou `room`.
- Garanta que sua CLI saia com 0 e imprima texto simples; JSON precisa ser ajustado via `jq -r .text`.
- Para `parakeet-mlx`, se você passar `--output-dir`, o OpenClaw lê `<output-dir>/<media-basename>.txt` quando `--output-format` é `txt` (ou omitido); formatos de saída que não sejam `txt` fazem fallback para análise de stdout.
- Mantenha tempos limite razoáveis (`timeoutSeconds`, padrão de 60 s) para evitar bloquear a fila de respostas.
- A transcrição de preflight processa apenas o **primeiro** anexo de áudio para detecção de menção. Áudio adicional é processado durante a fase principal de compreensão de mídia.

## Relacionados

- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Modo de conversa](/pt-BR/nodes/talk)
- [Ativação por voz](/pt-BR/nodes/voicewake)
