---
read_when:
    - Implementando o modo de conversa no macOS/iOS/Android
    - Alterando o comportamento de voz/TTS/interrupção
summary: 'Modo de fala: conversas por fala contínua com STT/TTS local e voz em tempo real'
title: Modo de conversa
x-i18n:
    generated_at: "2026-05-06T06:02:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04304a1dd6c3feefa89c0c8c66f8026a7d28b573776fcf14237c3481fbc772a
    source_path: nodes/talk.md
    workflow: 16
---

O modo de fala tem duas formas de runtime:

- A fala nativa do macOS/iOS/Android usa reconhecimento de fala local, chat do Gateway e TTS `talk.speak`. Os Nodes anunciam a capability `talk` e declaram os comandos `talk.*` compatíveis.
- A fala no navegador usa `talk.client.create` para sessões `webrtc` e `provider-websocket` pertencentes ao cliente, ou `talk.session.create` para sessões `gateway-relay` pertencentes ao Gateway. `managed-room` é reservado para handoff do Gateway e salas walkie-talkie.
- Clientes somente de transcrição usam `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, depois `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` quando precisam de legendas ou ditado sem uma resposta de voz do assistente.

A fala nativa é um loop contínuo de conversa por voz:

1. Escutar fala
2. Enviar a transcrição ao modelo pela sessão ativa
3. Aguardar a resposta
4. Reproduzi-la via o provedor de fala configurado (`talk.speak`)

A fala em tempo real no navegador encaminha chamadas de ferramenta do provedor por `talk.client.toolCall`; clientes de navegador não chamam `chat.send` diretamente para consultas em tempo real.

A fala somente de transcrição emite o mesmo envelope comum de evento de fala que sessões em tempo real e STT/TTS, mas usa `mode: "transcription"` e `brain: "none"`. Ela é para legendas, ditado e captura de fala somente para observação; notas de voz enviadas uma única vez ainda usam o caminho de mídia/áudio.

## Comportamento (macOS)

- **Sobreposição sempre ativa** enquanto o modo de fala está ativado.
- Transições de fase **Escutando → Pensando → Falando**.
- Em uma **pausa curta** (janela de silêncio), a transcrição atual é enviada.
- As respostas são **escritas no WebChat** (igual a digitar).
- **Interromper ao falar** (ativado por padrão): se o usuário começar a falar enquanto o assistente estiver falando, interrompemos a reprodução e registramos o timestamp da interrupção para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar a resposta com uma **única linha JSON** para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Somente a primeira linha não vazia.
- Chaves desconhecidas são ignoradas.
- `once: true` se aplica apenas à resposta atual.
- Sem `once`, a voz se torna o novo padrão para o modo de fala.
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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Padrões:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: quando não definido, a fala mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms on macOS and Android, 900 ms on iOS`)
- `provider`: seleciona o provedor de fala ativo. Use `elevenlabs`, `mlx` ou `system` para os caminhos de reprodução locais do macOS.
- `providers.<provider>.voiceId`: recorre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (ou à primeira voz do ElevenLabs quando uma chave de API está disponível).
- `providers.elevenlabs.modelId`: assume `eleven_v3` por padrão quando não definido.
- `providers.mlx.modelId`: assume `mlx-community/Soprano-80M-bf16` por padrão quando não definido.
- `providers.elevenlabs.apiKey`: recorre a `ELEVENLABS_API_KEY` (ou ao perfil de shell do gateway, se disponível).
- `realtime.provider`: seleciona o provedor de voz em tempo real ativo do navegador/servidor. Use `openai` para WebRTC, `google` para WebSocket do provedor ou um provedor apenas de ponte por relay do Gateway.
- `realtime.providers.<provider>` armazena a configuração em tempo real pertencente ao provedor. O navegador recebe apenas credenciais de sessão efêmeras ou restritas, nunca uma chave de API padrão.
- `realtime.brain`: `agent-consult` roteia chamadas de ferramenta em tempo real pela política do Gateway; `direct-tools` é um comportamento de compatibilidade somente do proprietário; `none` é para transcrição ou orquestração externa.
- `talk.catalog` expõe os modos válidos, transportes, estratégias de brain, formatos de áudio em tempo real e flags de capability de cada provedor para que clientes de fala first-party possam evitar combinações incompatíveis.
- Provedores de transcrição por streaming são descobertos por `talk.catalog.transcription`. O relay atual do Gateway usa a configuração do provedor de streaming de chamada de voz até que a superfície dedicada de configuração de transcrição de fala seja adicionada.
- `speechLocale`: id de localidade BCP 47 opcional para reconhecimento de fala no dispositivo em iOS/macOS. Deixe indefinido para usar o padrão do dispositivo.
- `outputFormat`: assume `pcm_44100` por padrão em macOS/iOS e `pcm_24000` no Android (defina `mp3_*` para forçar streaming MP3)

## UI do macOS

- Alternância na barra de menus: **Fala**
- Aba de configuração: grupo **Modo de fala** (id de voz + alternância de interrupção)
- Sobreposição:
  - **Escutando**: a nuvem pulsa com o nível do microfone
  - **Pensando**: animação afundando
  - **Falando**: anéis irradiando
  - Clicar na nuvem: parar de falar
  - Clicar em X: sair do modo de fala

## UI do Android

- Alternância da aba de voz: **Fala**
- **Mic** e **Fala** manuais são modos de captura de runtime mutuamente exclusivos.
- O Mic manual para quando o app sai do primeiro plano ou o usuário sai da aba Voz.
- O modo de fala continua em execução até ser desativado ou até o Node Android se desconectar, e usa o tipo de serviço em primeiro plano de microfone do Android enquanto ativo.

## Observações

- Requer permissões de fala + microfone.
- A fala nativa usa a sessão ativa do Gateway e só recorre à sondagem de histórico quando eventos de resposta não estão disponíveis.
- A fala em tempo real no navegador usa `talk.client.toolCall` para `openclaw_agent_consult` em vez de expor `chat.send` a sessões de navegador pertencentes ao provedor.
- A fala somente de transcrição usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close`; clientes assinam `talk.event` para atualizações parciais/finais de transcrição.
- O gateway resolve a reprodução de fala por `talk.speak` usando o provedor de fala ativo. O Android recorre ao TTS do sistema local somente quando esse RPC não está disponível.
- A reprodução MLX local do macOS usa o helper `openclaw-mlx-tts` incluído quando presente, ou um executável no `PATH`. Defina `OPENCLAW_MLX_TTS_BIN` para apontar para um binário de helper customizado durante o desenvolvimento.
- `stability` para `eleven_v3` é validado como `0.0`, `0.5` ou `1.0`; outros modelos aceitam `0..1`.
- `latency_tier` é validado como `0..4` quando definido.
- O Android oferece suporte aos formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming AudioTrack de baixa latência.

## Relacionado

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
