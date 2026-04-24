---
read_when:
    - Implementando o modo Talk no macOS/iOS/Android
    - Alterando o comportamento de voz/TTS/interrupção
summary: 'Modo Talk: conversas contínuas por voz com TTS do ElevenLabs'
title: Modo Talk
x-i18n:
    generated_at: "2026-04-24T05:59:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 49286cd39a104d4514eb1df75627a2f64182313b11792bb246f471178a702198
    source_path: nodes/talk.md
    workflow: 15
---

O modo Talk é um loop contínuo de conversa por voz:

1. Ouvir a fala
2. Enviar a transcrição ao modelo (sessão principal, `chat.send`)
3. Aguardar a resposta
4. Falar a resposta pelo provider de Talk configurado (`talk.speak`)

## Comportamento (macOS)

- **Overlay sempre ativo** enquanto o modo Talk estiver habilitado.
- Transições de fase **Ouvindo → Pensando → Falando**.
- Em uma **pausa curta** (janela de silêncio), a transcrição atual é enviada.
- Respostas são **gravadas no WebChat** (igual à digitação).
- **Interromper ao detectar fala** (padrão ativado): se o usuário começar a falar enquanto o assistente estiver falando, interrompemos a reprodução e registramos o timestamp da interrupção para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar sua resposta com **uma única linha JSON** para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Apenas a primeira linha não vazia.
- Chaves desconhecidas são ignoradas.
- `once: true` se aplica apenas à resposta atual.
- Sem `once`, a voz se torna o novo padrão para o modo Talk.
- A linha JSON é removida antes da reprodução TTS.

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
    voiceId: "elevenlabs_voice_id",
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Padrões:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms no macOS e Android, 900 ms no iOS`)
- `voiceId`: usa como fallback `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (ou a primeira voz do ElevenLabs quando a chave de API estiver disponível)
- `modelId`: usa `eleven_v3` por padrão quando não definido
- `apiKey`: usa como fallback `ELEVENLABS_API_KEY` (ou o perfil de shell do gateway, se disponível)
- `outputFormat`: usa por padrão `pcm_44100` em macOS/iOS e `pcm_24000` em Android (defina `mp3_*` para forçar streaming MP3)

## UI do macOS

- Alternância na barra de menu: **Talk**
- Aba de configuração: grupo **Talk Mode** (ID da voz + alternância de interrupção)
- Overlay:
  - **Listening**: nuvem pulsa com o nível do microfone
  - **Thinking**: animação de afundamento
  - **Speaking**: anéis radiantes
  - Clique na nuvem: interrompe a fala
  - Clique em X: sai do modo Talk

## Observações

- Requer permissões de Fala + Microfone.
- Usa `chat.send` com a chave de sessão `main`.
- O gateway resolve a reprodução do Talk por meio de `talk.speak` usando o provider de Talk ativo. O Android usa TTS local do sistema como fallback apenas quando esse RPC não está disponível.
- `stability` para `eleven_v3` é validado para `0.0`, `0.5` ou `1.0`; outros modelos aceitam `0..1`.
- `latency_tier` é validado para `0..4` quando definido.
- O Android oferece suporte a formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming de baixa latência com AudioTrack.

## Relacionado

- [Voice wake](/pt-BR/nodes/voicewake)
- [Áudio e mensagens de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
