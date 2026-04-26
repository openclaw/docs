---
read_when:
    - Implementando o modo Talk no macOS/iOS/Android
    - Alterando comportamento de voz/TTS/interrupção
summary: 'Modo Talk: conversas contínuas por voz com providers de TTS configurados'
title: Modo Talk
x-i18n:
    generated_at: "2026-04-26T11:33:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: afdddaa81c0a09076eaeeafd25295b0c02681f03b273ec4afe4ea2afa692dc2a
    source_path: nodes/talk.md
    workflow: 15
---

O modo Talk é um loop contínuo de conversa por voz:

1. Ouvir a fala
2. Enviar a transcrição ao modelo (sessão principal, `chat.send`)
3. Aguardar a resposta
4. Falá-la por meio do provider Talk configurado (`talk.speak`)

## Comportamento (macOS)

- **Overlay sempre ativa** enquanto o modo Talk estiver ativado.
- Transições de fase **Ouvindo → Pensando → Falando**.
- Em uma **pausa curta** (janela de silêncio), a transcrição atual é enviada.
- As respostas são **gravadas no WebChat** (como se fossem digitadas).
- **Interromper ao falar** (ativado por padrão): se o usuário começar a falar enquanto o assistente estiver falando, interrompemos a reprodução e registramos o timestamp da interrupção para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar sua resposta com uma **única linha JSON** para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Apenas a primeira linha não vazia.
- Chaves desconhecidas são ignoradas.
- `once: true` se aplica apenas à resposta atual.
- Sem `once`, a voz passa a ser o novo padrão do modo Talk.
- A linha JSON é removida antes da reprodução por TTS.

Chaves compatíveis:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (PPM), `stability`, `similarity`, `style`, `speakerBoost`
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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Padrões:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms` no macOS e Android, `900 ms` no iOS)
- `provider`: seleciona o provider Talk ativo. Use `elevenlabs`, `mlx` ou `system` para os caminhos locais de reprodução no macOS.
- `providers.<provider>.voiceId`: usa como fallback `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (ou a primeira voz ElevenLabs quando a chave de API estiver disponível).
- `providers.elevenlabs.modelId`: usa `eleven_v3` por padrão quando não definido.
- `providers.mlx.modelId`: usa `mlx-community/Soprano-80M-bf16` por padrão quando não definido.
- `providers.elevenlabs.apiKey`: usa `ELEVENLABS_API_KEY` como fallback (ou o perfil de shell do gateway, se disponível).
- `speechLocale`: id de localidade BCP 47 opcional para reconhecimento de fala local do Talk no iOS/macOS. Deixe sem definir para usar o padrão do dispositivo.
- `outputFormat`: usa `pcm_44100` por padrão no macOS/iOS e `pcm_24000` no Android (defina `mp3_*` para forçar streaming MP3)

## UI do macOS

- Alternância na barra de menu: **Talk**
- Aba Config: grupo **Talk Mode** (id de voz + alternância de interrupção)
- Overlay:
  - **Ouvindo**: pulsos da nuvem com nível do microfone
  - **Pensando**: animação de afundamento
  - **Falando**: anéis irradiando
  - Clique na nuvem: parar de falar
  - Clique no X: sair do modo Talk

## UI do Android

- Alternância na aba Voice: **Talk**
- **Mic** manual e **Talk** são modos de captura em runtime mutuamente exclusivos.
- O Mic manual para quando o app sai do primeiro plano ou o usuário sai da aba Voice.
- O modo Talk continua em execução até ser desativado ou até o node Android desconectar, e usa o tipo de foreground service de microfone do Android enquanto estiver ativo.

## Observações

- Requer permissões de Speech + Microphone.
- Usa `chat.send` com a chave de sessão `main`.
- O gateway resolve a reprodução do Talk por meio de `talk.speak` usando o provider Talk ativo. O Android recorre ao TTS local do sistema apenas quando esse RPC não está disponível.
- A reprodução local MLX no macOS usa o helper integrado `openclaw-mlx-tts` quando presente, ou um executável no `PATH`. Defina `OPENCLAW_MLX_TTS_BIN` para apontar para um binário helper personalizado durante o desenvolvimento.
- `stability` para `eleven_v3` é validado como `0.0`, `0.5` ou `1.0`; outros modelos aceitam `0..1`.
- `latency_tier` é validado como `0..4` quando definido.
- O Android oferece suporte aos formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming AudioTrack de baixa latência.

## Relacionado

- [Voice wake](/pt-BR/nodes/voicewake)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
