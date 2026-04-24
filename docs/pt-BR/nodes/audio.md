---
read_when:
    - Alterar a transcrição de áudio ou o tratamento de mídia
summary: Como áudios/notas de voz de entrada são baixados, transcritos e injetados nas respostas
title: Áudio e notas de voz
x-i18n:
    generated_at: "2026-04-24T05:59:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 464b569c97715e483c4bfc8074d2775965a0635149e0933c8e5b5d9c29d34269
    source_path: nodes/audio.md
    workflow: 15
---

# Áudio / notas de voz (2026-01-17)

## O que funciona

- **Entendimento de mídia (áudio)**: se o entendimento de áudio estiver ativado (ou detectado automaticamente), o OpenClaw:
  1. Localiza o primeiro anexo de áudio (caminho local ou URL) e o baixa, se necessário.
  2. Aplica `maxBytes` antes de enviar a cada entrada de modelo.
  3. Executa a primeira entrada de modelo elegível em ordem (provedor ou CLI).
  4. Se falhar ou for ignorada (tamanho/timeout), tenta a próxima entrada.
  5. Em caso de sucesso, substitui `Body` por um bloco `[Audio]` e define `{{Transcript}}`.
- **Análise de comando**: quando a transcrição é bem-sucedida, `CommandBody`/`RawBody` são definidos como a transcrição para que os comandos slash continuem funcionando.
- **Logging detalhado**: em `--verbose`, registramos quando a transcrição é executada e quando ela substitui o body.

## Detecção automática (padrão)

Se você **não configurar modelos** e `tools.media.audio.enabled` **não** estiver definido como `false`,
o OpenClaw detecta automaticamente nesta ordem e para na primeira opção funcional:

1. **Modelo de resposta ativo** quando o provedor oferece suporte a entendimento de áudio.
2. **CLIs locais** (se instaladas)
   - `sherpa-onnx-offline` (requer `SHERPA_ONNX_MODEL_DIR` com encoder/decoder/joiner/tokens)
   - `whisper-cli` (de `whisper-cpp`; usa `WHISPER_CPP_MODEL` ou o modelo tiny empacotado)
   - `whisper` (CLI Python; baixa modelos automaticamente)
3. **Gemini CLI** (`gemini`) usando `read_many_files`
4. **Autenticação do provedor**
   - Entradas configuradas em `models.providers.*` que oferecem suporte a áudio são tentadas primeiro
   - Ordem de fallback empacotada: OpenAI → Groq → Deepgram → Google → Mistral

Para desativar a detecção automática, defina `tools.media.audio.enabled: false`.
Para personalizar, defina `tools.media.audio.models`.
Observação: a detecção de binário é best-effort em macOS/Linux/Windows; garanta que a CLI esteja no `PATH` (expandimos `~`) ou defina um modelo de CLI explícito com um caminho completo de comando.

## Exemplos de configuração

### Fallback de provedor + CLI (OpenAI + Whisper CLI)

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

### Ecoar transcrição para o chat (opt-in)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // o padrão é false
        echoFormat: '📝 "{transcript}"', // opcional, oferece suporte a {transcript}
        models: [{ provider: "openai", model: "gpt-4o-mini-transcribe" }],
      },
    },
  },
}
```

## Observações e limites

- A autenticação do provedor segue a ordem padrão de autenticação de modelo (perfis de autenticação, variáveis de ambiente, `models.providers.*.apiKey`).
- Detalhes de configuração do Groq: [Groq](/pt-BR/providers/groq).
- O Deepgram usa `DEEPGRAM_API_KEY` quando `provider: "deepgram"` é usado.
- Detalhes de configuração do Deepgram: [Deepgram (transcrição de áudio)](/pt-BR/providers/deepgram).
- Detalhes de configuração do Mistral: [Mistral](/pt-BR/providers/mistral).
- Provedores de áudio podem sobrescrever `baseUrl`, `headers` e `providerOptions` via `tools.media.audio`.
- O limite padrão de tamanho é 20MB (`tools.media.audio.maxBytes`). Áudios acima do tamanho são ignorados para aquele modelo e a próxima entrada é tentada.
- Arquivos de áudio minúsculos/vazios abaixo de 1024 bytes são ignorados antes da transcrição por provedor/CLI.
- O `maxChars` padrão para áudio é **não definido** (transcrição completa). Defina `tools.media.audio.maxChars` ou `maxChars` por entrada para aparar a saída.
- O padrão automático da OpenAI é `gpt-4o-mini-transcribe`; defina `model: "gpt-4o-transcribe"` para maior precisão.
- Use `tools.media.audio.attachments` para processar várias notas de voz (`mode: "all"` + `maxAttachments`).
- A transcrição fica disponível para templates como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` vem desativado por padrão; ative para enviar a confirmação da transcrição de volta ao chat de origem antes do processamento do agente.
- `tools.media.audio.echoFormat` personaliza o texto do eco (placeholder: `{transcript}`).
- A stdout da CLI é limitada (5MB); mantenha a saída da CLI concisa.

### Suporte a ambiente de proxy

A transcrição de áudio baseada em provedor respeita variáveis de ambiente padrão de proxy de saída:

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

Se nenhuma variável de ambiente de proxy estiver definida, é usado egress direto. Se a configuração do proxy estiver malformada, o OpenClaw registra um aviso e recua para fetch direto.

## Detecção de menção em grupos

Quando `requireMention: true` está definido para um chat em grupo, o OpenClaw agora transcreve o áudio **antes** de verificar menções. Isso permite processar notas de voz mesmo quando elas contêm menções.

**Como funciona:**

1. Se uma mensagem de voz não tiver body de texto e o grupo exigir menções, o OpenClaw executa uma transcrição de “preflight”.
2. A transcrição é verificada em busca de padrões de menção (por exemplo `@BotName`, gatilhos por emoji).
3. Se uma menção for encontrada, a mensagem segue pelo pipeline completo de resposta.
4. A transcrição é usada para detecção de menção para que notas de voz possam passar pelo bloqueio por menção.

**Comportamento de fallback:**

- Se a transcrição falhar durante o preflight (timeout, erro de API etc.), a mensagem será processada com base apenas na detecção de menção por texto.
- Isso garante que mensagens mistas (texto + áudio) nunca sejam descartadas incorretamente.

**Opt-out por grupo/tópico do Telegram:**

- Defina `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para ignorar verificações de menção por transcrição de preflight para esse grupo.
- Defina `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para sobrescrever por tópico (`true` para ignorar, `false` para forçar ativação).
- O padrão é `false` (preflight ativado quando as condições com bloqueio por menção correspondem).

**Exemplo:** um usuário envia uma nota de voz dizendo “Hey @Claude, what's the weather?” em um grupo do Telegram com `requireMention: true`. A nota de voz é transcrita, a menção é detectada e o agente responde.

## Armadilhas

- Regras de escopo usam a primeira correspondência vencedora. `chatType` é normalizado para `direct`, `group` ou `room`.
- Garanta que sua CLI saia com código 0 e imprima texto simples; JSON precisa ser ajustado com `jq -r .text`.
- Para `parakeet-mlx`, se você passar `--output-dir`, o OpenClaw lê `<output-dir>/<media-basename>.txt` quando `--output-format` for `txt` (ou omitido); formatos de saída diferentes de `txt` recorrem à análise de stdout.
- Mantenha timeouts razoáveis (`timeoutSeconds`, padrão 60s) para evitar bloquear a fila de respostas.
- A transcrição de preflight processa apenas o **primeiro** anexo de áudio para detecção de menção. Áudios adicionais são processados durante a fase principal de entendimento de mídia.

## Relacionado

- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
- [Modo talk](/pt-BR/nodes/talk)
- [Voice wake](/pt-BR/nodes/voicewake)
