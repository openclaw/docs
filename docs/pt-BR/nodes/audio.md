---
read_when:
    - Alteração da transcrição de áudio ou do processamento de mídia
summary: Como notas de áudio/voz recebidas são baixadas, transcritas e inseridas nas respostas
title: Áudios e mensagens de voz
x-i18n:
    generated_at: "2026-07-12T15:22:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb382f4219620d906bfa76ebddc690b174a3b24f80f815be92e915b363d17792
    source_path: nodes/audio.md
    workflow: 16
---

## O que ele faz

Quando a compreensão de áudio está habilitada (ou é detectada automaticamente), o OpenClaw:

1. Localiza o primeiro anexo de áudio (caminho local ou URL) e o baixa, se necessário.
2. Aplica `maxBytes` antes de enviar o áudio para cada entrada de modelo.
3. Executa a primeira entrada de modelo elegível na ordem definida (provedor ou CLI); se uma entrada falhar ou for ignorada (tamanho/tempo limite), a próxima entrada será tentada.
4. Em caso de sucesso, substitui `Body` por um bloco `[Audio]` e define `{{Transcript}}`.

Quando a transcrição é bem-sucedida, `CommandBody`/`RawBody` também são definidos como a transcrição para que os comandos com barra continuem funcionando. Com `--verbose`, os logs mostram quando a transcrição é executada e quando ela substitui o corpo.

## Detecção automática (padrão)

Se você não tiver configurado modelos e `tools.media.audio.enabled` não for `false`, o OpenClaw fará a detecção automática na ordem abaixo e parará na primeira opção funcional:

1. **Modelo de resposta ativo**, quando seu provedor oferece suporte à compreensão de áudio.
2. **Autenticação de provedor configurada** — qualquer entrada `models.providers.*` com autenticação disponível para um provedor que ofereça suporte à transcrição de áudio. Isso é verificado antes das CLIs locais; portanto, uma chave de API configurada sempre terá precedência sobre um binário local no `PATH`.
   Prioridade dos provedores quando vários estão configurados: Groq, OpenAI, xAI, Deepgram, Google, SenseAudio, ElevenLabs, Mistral.
3. **CLIs locais** (somente se nenhuma autenticação de provedor for resolvida). O OpenClaw cria uma lista ordenada de alternativas:
   - `whisper-cli`, antes dos padrões de CPU somente quando uma invocação anterior de modelo no processo atual tiver detectado Metal ou CUDA
   - `sherpa-onnx-offline` em seu provedor de CPU padrão (requer `SHERPA_ONNX_MODEL_DIR` com `tokens.txt`, `encoder.onnx`, `decoder.onnx` e `joiner.onnx`)
   - `whisper-cli` quando Metal/CUDA estiver apenas disponível na compilação ou o backend selecionado não tiver sido detectado de outra forma
   - `parakeet-mlx` no Apple Silicon (compatível com MLX; o uso do dispositivo continua sem ser detectado)
   - `whisper` (CLI do Python; baixa os modelos automaticamente)

A procedência da instalação/vinculação é uma evidência de capacidade, não uma evidência de execução. Por si só, ela nunca coloca um candidato à frente do sherpa em CPU. O OpenClaw não carrega um modelo durante a configuração ou as verificações de status apenas para sondar um backend.
O whisper.cpp detectado automaticamente mantém habilitados seus logs normais de execução do modelo para que o OpenClaw possa registrar a linha upstream `using … backend`. Entradas de CLI explícitas mantêm seus sinalizadores de saída configurados.

A detecção automática da CLI do Gemini para compreensão de mídia foi substituída por uma alternativa em sandbox da CLI Antigravity (`agy`) para imagem/vídeo; o áudio não usa nenhuma alternativa de CLI além dos binários locais acima.

Para desabilitar a detecção automática, defina `tools.media.audio.enabled: false`. Para personalizá-la, defina `tools.media.audio.models`.

<Note>
A detecção de binários funciona em caráter de melhor esforço no macOS/Linux/Windows. Verifique se a CLI está no `PATH` (`~` é expandido) ou defina um modelo de CLI explícito com o caminho completo do comando.
</Note>

Inspecione a seleção local sem transcrever áudio:

```bash
openclaw capability audio providers
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

O inventário de provedores informa separadamente a alternativa local vencedora e a seleção global de provedores, além dos campos de backend compatível, solicitado e detectado. Após a execução da transcrição, `/status` informa o backend solicitado ou detectado na linha de mídia. Entradas de CLI explícitas em `tools.media.audio.models` continuam ignorando a seleção automática; use seus sinalizadores específicos de backend, como `--provider=cuda` do sherpa ou `--no-gpu`/`--device` do whisper.cpp.

## Exemplos de configuração

### Provedor + alternativa de CLI (OpenAI + CLI do Whisper)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
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

### Somente provedor com restrição por escopo

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
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
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

### Reenviar a transcrição ao chat (adesão opcional)

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        echoTranscript: true, // o padrão é false
        echoFormat: '📝 "{transcript}"', // opcional, oferece suporte a {transcript}
        models: [{ provider: "openai", model: "gpt-4o-transcribe" }],
      },
    },
  },
}
```

## Observações e limites

- A autenticação do provedor segue a ordem padrão de autenticação de modelos (perfis de autenticação, variáveis de ambiente, `models.providers.*.apiKey`).
- Detalhes da configuração do Groq: [Groq](/pt-BR/providers/groq).
- O Deepgram usa `DEEPGRAM_API_KEY` quando `provider: "deepgram"` é utilizado. Detalhes da configuração: [Deepgram](/pt-BR/providers/deepgram).
- Detalhes da configuração do Mistral: [Mistral](/pt-BR/providers/mistral).
- O SenseAudio usa `SENSEAUDIO_API_KEY` quando `provider: "senseaudio"` é utilizado. Detalhes da configuração: [SenseAudio](/pt-BR/providers/senseaudio).
- Os provedores de áudio podem substituir `baseUrl`, `headers` e `providerOptions` por meio de `tools.media.audio`.
- O limite de tamanho padrão é 20MB (`tools.media.audio.maxBytes`). O áudio acima do limite é ignorado para esse modelo, e a próxima entrada é tentada.
- Arquivos de áudio com menos de 1024 bytes são ignorados antes da transcrição pelo provedor/CLI.
- Por padrão, `maxChars` para áudio fica **sem definição** (transcrição completa). Defina `tools.media.audio.maxChars` ou um `maxChars` por entrada para truncar a saída.
- O padrão de detecção automática do OpenAI é `gpt-4o-transcribe`; defina `model: "gpt-4o-mini-transcribe"` para uma opção mais barata/rápida.
- Use `tools.media.audio.attachments` para processar várias mensagens de voz (`mode: "all"` mais `maxAttachments`, padrão 1).
- A transcrição fica disponível para os modelos como `{{Transcript}}`.
- `tools.media.audio.echoTranscript` fica desabilitado por padrão; habilite-o para enviar uma confirmação da transcrição de volta ao chat de origem antes do processamento pelo agente.
- `tools.media.audio.echoFormat` personaliza o texto de retorno (espaço reservado: `{transcript}`; padrão `📝 "{transcript}"`).
- A saída padrão da CLI é limitada a 5MB; mantenha a saída da CLI concisa.
- Os `args` da CLI devem usar `{{MediaPath}}` para o caminho do arquivo de áudio local. Execute `openclaw doctor --fix` para migrar espaços reservados `{input}` obsoletos de configurações antigas de `audio.transcription.command` (chave descontinuada: `audio.transcription`, substituída por `tools.media.audio.models`).
- `tools.media.concurrency` limita as tarefas de mídia; não é um agendador de GPU.

### STT local residente

O STT local detectado automaticamente continua usando um processo por solicitação. Atualmente, o OpenClaw não gerencia um servidor whisper.cpp residente porque o pacote padrão `whisper-cpp` do Homebrew desabilita esse servidor, enquanto o exemplo upstream não possui uma fila limitada de admissão configurada. Um ciclo de vida residente pertencente a um plugin precisa de um worker empacotado e mantido com integridade/inicialização, residência do modelo, enfileiramento limitado, cancelamento/tempo limite, operação somente em loopback sem autenticação e nenhuma alternativa na nuvem antes que possa ser habilitado com segurança.

### Suporte a ambiente de proxy

A transcrição de áudio baseada em provedor respeita as variáveis de ambiente padrão de proxy de saída, de acordo com a semântica do `EnvHttpProxyAgent` do undici:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `ALL_PROXY` / `all_proxy`

As variáveis em minúsculas têm precedência sobre as maiúsculas; as entradas de `NO_PROXY`/`no_proxy` (nomes de host, `*.suffix` ou `host:port`) ignoram o proxy. Se nenhuma variável de ambiente de proxy estiver definida, será usada uma saída direta. Se a configuração do proxy falhar (URL malformada), o OpenClaw registrará um aviso e voltará a usar uma solicitação direta.

## Detecção de menções em grupos

Nos canais compatíveis com a verificação preliminar de áudio, o OpenClaw transcreve o áudio **antes** de verificar menções quando `requireMention: true` está definido para um chat em grupo. Isso permite que uma mensagem de voz sem legenda passe pela verificação de menção quando sua transcrição contém um padrão de menção configurado. A documentação específica de cada canal descreve os transportes que exigem uma menção digitada.

**Como funciona:**

1. Se uma mensagem de voz não tiver corpo de texto e o grupo exigir menções, o OpenClaw realizará uma transcrição preliminar do primeiro anexo de áudio.
2. A transcrição será verificada em busca de padrões de menção (por exemplo, `@BotName`, acionadores de emoji).
3. Se uma menção for encontrada, a mensagem prosseguirá pelo pipeline completo de resposta.

**Comportamento alternativo:** se a transcrição preliminar falhar (tempo limite, erro de API etc.), a mensagem voltará à detecção de menções somente em texto, para que mensagens mistas (texto + áudio) nunca sejam descartadas.

**Desativação por grupo/tópico do Telegram:**

- Defina `channels.telegram.groups.<chatId>.disableAudioPreflight: true` para ignorar as verificações preliminares de menção na transcrição para esse grupo.
- Defina `channels.telegram.groups.<chatId>.topics.<threadId>.disableAudioPreflight` para substituir a configuração por tópico (`true` para ignorar, `false` para forçar a habilitação).
- O padrão é `false` (verificação preliminar habilitada quando as condições de exigência de menção correspondem).

**Exemplo:** um usuário envia uma mensagem de voz dizendo "Olá, @Claude, como está o tempo?" em um grupo do Telegram com `requireMention: true`. A mensagem de voz é transcrita, a menção é detectada e o agente responde.

## Armadilhas

- As regras de escopo usam a primeira correspondência; `chatType` é normalizado como `direct`, `group` ou `channel`.
- Verifique se sua CLI encerra com código 0 e imprime texto simples; a saída JSON precisa ser processada com `jq -r .text`.
- Os modos conhecidos de saída em arquivo são autoritativos: um arquivo de transcrição inferido vazio ou ausente não produz transcrição, em vez de recorrer à saída de progresso da CLI.
- Para `parakeet-mlx`, use `--output-format txt` (ou `all`) com `--output-dir` e o modelo de saída padrão `{filename}`. As variáveis de ambiente upstream `PARAKEET_OUTPUT_FORMAT` e `PARAKEET_OUTPUT_TEMPLATE` também são respeitadas. O OpenClaw lê `<output-dir>/<media-basename>.txt`; o formato padrão `srt`, outros formatos e modelos de saída personalizados continuam usando a saída padrão.
- Mantenha tempos limite razoáveis (`timeoutSeconds`, padrão 60s) para evitar o bloqueio da fila de respostas.
- A transcrição preliminar processa somente o **primeiro** anexo de áudio para a detecção de menções. Anexos de áudio adicionais são processados durante a fase principal de compreensão de mídia.

## Relacionados

- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
- [Modo de conversa](/pt-BR/nodes/talk)
- [Ativação por voz](/pt-BR/nodes/voicewake)
