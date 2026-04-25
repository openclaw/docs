---
read_when:
    - Implementando o modo de conversa no macOS/iOS/Android
    - Alterando o comportamento de voz/TTS/interrupção
summary: 'Modo de conversa: conversas contínuas por voz com provedores de TTS configurados'
title: modo de conversa
x-i18n:
    generated_at: "2026-04-25T13:49:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

O modo de conversa é um loop contínuo de conversa por voz:

1. Ouvir a fala
2. Enviar a transcrição para o modelo (sessão principal, `chat.send`)
3. Aguardar a resposta
4. Falá-la por meio do provedor Talk configurado (`talk.speak`)

## Comportamento (macOS)

- **Overlay sempre ativo** enquanto o modo de conversa estiver ativado.
- Transições de fase **Ouvindo → Pensando → Falando**.
- Em uma **pausa curta** (janela de silêncio), a transcrição atual é enviada.
- As respostas são **gravadas no WebChat** (igual a digitar).
- **Interromper ao detectar fala** (ativado por padrão): se o usuário começar a falar enquanto o assistente estiver falando, interrompemos a reprodução e registramos o timestamp da interrupção para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar sua resposta com **uma única linha JSON** para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Apenas a primeira linha não vazia.
- Chaves desconhecidas são ignoradas.
- `once: true` aplica-se apenas à resposta atual.
- Sem `once`, a voz se torna o novo padrão do modo de conversa.
- A linha JSON é removida antes da reprodução por TTS.

Chaves compatíveis:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Configuração (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Padrões:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: quando não definido, o modo de conversa mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms` no macOS e Android, `900 ms` no iOS)
- `provider`: seleciona o provedor Talk ativo. Use `elevenlabs`, `mlx` ou `system` para os caminhos de reprodução local no macOS.
- `providers.<provider>.voiceId`: usa como fallback `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (ou a primeira voz do ElevenLabs quando a chave de API está disponível).
- `providers.elevenlabs.modelId`: usa `eleven_v3` como padrão quando não definido.
- `providers.mlx.modelId`: usa `mlx-community/Soprano-80M-bf16` como padrão quando não definido.
- `providers.elevenlabs.apiKey`: usa como fallback `ELEVENLABS_API_KEY` (ou o perfil de shell do gateway, se disponível).
- `outputFormat`: usa `pcm_44100` por padrão no macOS/iOS e `pcm_24000` no Android (defina `mp3_*` para forçar streaming em MP3)

## UI do macOS

- Alternância na barra de menus: **Talk**
- Aba de configuração: grupo **Talk Mode** (ID da voz + toggle de interrupção)
- Overlay:
  - **Listening**: nuvem pulsa com o nível do microfone
  - **Thinking**: animação de afundamento
  - **Speaking**: anéis irradiando
  - Clique na nuvem: parar de falar
  - Clique no X: sair do modo de conversa

## Observações

- Requer permissões de Fala + Microfone.
- Usa `chat.send` na chave de sessão `main`.
- O gateway resolve a reprodução do modo de conversa por `talk.speak` usando o provedor Talk ativo. O Android recorre ao TTS local do sistema apenas quando esse RPC não está disponível.
- A reprodução local por MLX no macOS usa o helper empacotado `openclaw-mlx-tts` quando presente, ou um executável em `PATH`. Defina `OPENCLAW_MLX_TTS_BIN` para apontar para um binário helper personalizado durante o desenvolvimento.
- `stability` para `eleven_v3` é validado para `0.0`, `0.5` ou `1.0`; outros modelos aceitam `0..1`.
- `latency_tier` é validado para `0..4` quando definido.
- O Android oferece suporte a formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming de baixa latência com AudioTrack.

## Relacionado

- [Voice wake](/pt-BR/nodes/voicewake)
- [Audio and voice notes](/pt-BR/nodes/audio)
- [Media understanding](/pt-BR/nodes/media-understanding)
