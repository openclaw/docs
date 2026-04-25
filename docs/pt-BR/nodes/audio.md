---
read_when:
    - Alterando a transcrição de áudio ou o tratamento de mídia
summary: Como áudio de entrada/notas de voz são baixados, transcritos e injetados nas respostas
title: Áudio e notas de voz
x-i18n:
    generated_at: "2026-04-25T13:49:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: cc48787be480fbd19d26f18ac42a15108be89104e6aa56e60a94bd62b1b0cba0
    source_path: nodes/audio.md
    workflow: 15
---

# Áudio / Notas de voz (2026-01-17)

## O que funciona

- **Compreensão de mídia (áudio)**: se a compreensão de áudio estiver ativada (ou detectada automaticamente), o OpenClaw:
  1. Localiza o primeiro anexo de áudio (caminho local ou URL) e faz o download, se necessário.
  2. Aplica `maxBytes` antes de enviar para cada entrada de modelo.
  3. Executa a primeira entrada de modelo elegível em ordem (provider ou CLI).
  4. Se falhar ou for ignorada (tamanho/timeout), tenta a próxima entrada.
  5. Em caso de sucesso, substitui `Body` por um bloco `[Audio]` e define `{{Transcript}}`.
- **Análise de comandos**: quando a transcrição é bem-sucedida, `CommandBody`/`RawBody` são definidos como a transcrição para que comandos slash continuem funcionando.
- **Logging detalhado**: em `--verbose`, registramos em log quando a transcrição é executada e quando ela substitui o corpo.

## Detecção automática (padrão)

Se você **não configurar modelos** e `tools.media.audio.enabled` **não** estiver definido como `false`,
o OpenClaw detecta automaticamente nesta ordem e para na primeira opção funcional:

1. **Modelo de resposta ativo** quando o provider oferece suporte à compreensão de áudio.
2. **CLIs locais** (se instaladas)
   - `sherpa-onnx-offline` (exige `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (de `whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny incluído)
   - `whisper` (CLI Python; faz download automático dos modelos)
3. **Gemini CLI** (`gemini`) usando `read_many_files`
4. **Autenticação do provider**
   - Entradas configuradas de `models.providers.*` que oferecem suporte a áudio são tentadas primeiro
   - Ordem de fallback incluída: OpenAI → Groq → xAI → Deepgram → Google → SenseAudio → ElevenLabs → Mistral

Para desativar a detecção automática, defina `tools.media.audio.enabled: false`.
Para personalizar, defina `tools.media.audio.models`.
Observação: a detecção de binários é em melhor esforço em macOS/Linux/Windows; garanta que a CLI esteja em `PATH` (expandimos `~`) ou defina um modelo de CLI explícito com um caminho completo do comando.

## Exemplos de configuração

### Provider + fallback de CLI (OpenAI + Whisper CLI)

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

### Somente provider com controle por escopo

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

### Somente provider (Deepgram)

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

### Somente provider (Mistral Voxtral)

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

### Somente provider (SenseAudio)

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

### Enviar a transcrição no chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // o padrão é false
        echoFormat: '📝 "{transcript}"', // opcional, aceita {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Observações e limites

- A autenticação do provider segue a ordem padrão de autenticação de modelo (perfis de autenticação, variáveis de ambiente, `models.providers.*.apiKey`).
- Detalhes de configuração do Groq: [Groq](/pt-BR/providers/groq).
- O Deepgram usa `DEEPGRAM_API_KEY` quando `provider: "deepgram"` é usado.
- Detalhes de configuração do Deepgram: [Deepgram (transcrição de áudio)](/pt-BR/providers/deepgram).
- Detalhes de configuração do Mistral: [Mistral](/pt-BR/providers/mistral).
- O SenseAudio usa `SENSEAUDIO_API_KEY` quando `provider: "senseaudio"` é usado.
- Detalhes de configuração do SenseAudio: [SenseAudio](/pt-BR/providers/senseaudio).
- Providers de áudio podem substituir `baseUrl`, `headers` e `providerOptions` via `tools.media.audio`.
- O limite de tamanho padrão é 20MB (`tools.media.audio.maxBytes`). Áudio acima do limite é ignorado para esse modelo e a próxima entrada é tentada.
- Arquivos de áudio minúsculos/vazios com menos de 1024 bytes são ignorados antes da transcrição por provider/CLI.
- O `maxChars` padrão para áudio é **não definido** (transcrição completa). Defina `tools.media.audio.maxChars` ou `maxChars` por entrada para limitar a saída.
- O padrão automático da OpenAI é `gpt-4o-mini-transcribe`; defina `model: "gpt-4o-transcribe"` para maior precisão.
- Use `tools.media.audio.attachments` para processar várias notas de voz (`mode: "all"` + `maxAttachments`).
- A transcrição fica disponível para templates como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` fica desativado por padrão; ative-o para enviar a confirmação da transcrição de volta ao chat de origem antes do processamento do agente.
- `tools.media.audio.echoFormat` personaliza o texto do eco (placeholder: `{transcript}`).
- A stdout da CLI é limitada (5MB); mantenha a saída da CLI concisa.

### Compatibilidade com ambiente de proxy

A transcrição de áudio baseada em provider respeita as variáveis de ambiente padrão de proxy de saída:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma variável de ambiente de proxy estiver definida, a saída direta será usada. Se a configuração do proxy estiver malformada, o OpenClaw registrará um aviso e fará fallback para busca direta.

## Detecção de menção em grupos

Quando `requireMention: true` está definido para um chat em grupo, o OpenClaw agora transcreve o áudio **antes** de verificar menções. Isso permite que notas de voz sejam processadas mesmo quando contêm menções.

**Como funciona:**

1. Se uma mensagem de voz não tiver corpo de texto e o grupo exigir menções, o OpenClaw executa uma transcrição "preflight".
2. A transcrição é verificada em busca de padrões de menção (por exemplo, `@BotName`, gatilhos por emoji).
3. Se uma menção for encontrada, a mensagem segue pelo pipeline completo de resposta.
4. A transcrição é usada para detecção de menção para que notas de voz possam passar pelo portão de menção.

**Comportamento de fallback:**

- Se a transcrição falhar durante o preflight (timeout, erro de API etc.), a mensagem será processada com base apenas na detecção de menção por texto.
- Isso garante que mensagens mistas (texto + áudio) nunca sejam descartadas incorretamente.

**Opt-out por grupo/tópico do Telegram:**

- Defina `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para ignorar verificações de menção por transcrição preflight nesse grupo.
- Defina `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para substituir por tópico (`true` para ignorar, `false` para forçar ativação).
- O padrão é `false` (preflight ativado quando as condições com restrição por menção correspondem).

**Exemplo:** um usuário envia uma nota de voz dizendo "Hey @Claude, what's the weather?" em um grupo do Telegram com `requireMention: true`. A nota de voz é transcrita, a menção é detectada e o agente responde.

## Pegadinhas

- Regras de escopo usam a primeira correspondência como vencedora. `chatType` é normalizado para `direct`, `group` ou `room`.
- Garanta que sua CLI saia com código 0 e imprima texto simples; JSON precisa ser ajustado com `jq -r .text`.
- Para `parakeet-mlx`, se você passar `--output-dir`, o OpenClaw lê `<output-dir>/<media-basename>.txt` quando `--output-format` é `txt` (ou omitido); formatos de saída que não sejam `txt` fazem fallback para análise de stdout.
- Mantenha timeouts razoáveis (`timeoutSeconds`, padrão 60s) para evitar bloquear a fila de resposta.
- A transcrição preflight processa apenas o **primeiro** anexo de áudio para detecção de menção. Áudios adicionais são processados durante a fase principal de compreensão de mídia.

## Relacionado

- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Modo Talk](/pt-BR/nodes/talk)
- [Voice wake](/pt-BR/nodes/voicewake)
