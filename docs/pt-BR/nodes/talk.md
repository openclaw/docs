---
read_when:
    - Implementando o modo Talk no macOS/iOS/Android
    - Alterando o comportamento de voz/TTS/interrupção
summary: 'Modo de fala: conversas de fala contínua com STT/TTS local e voz em tempo real'
title: Modo de conversa
x-i18n:
    generated_at: "2026-07-03T00:54:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 22e1539de48fea2b1d4f04c2a6935b011c55a9a6d700b6caadc4daf5b038b60d
    source_path: nodes/talk.md
    workflow: 16
---

O modo Talk tem dois formatos de runtime:

- O Talk nativo no macOS/iOS/Android usa reconhecimento de fala local, chat do Gateway e TTS `talk.speak`. Os nós anunciam a capacidade `talk` e declaram os comandos `talk.*` compatíveis.
- O Talk no iOS usa WebRTC gerenciado pelo cliente para configurações realtime da OpenAI que selecionam `webrtc` ou omitem o transporte. Configurações realtime explícitas de `gateway-relay`, `provider-websocket` e não OpenAI continuam no relay gerenciado pelo Gateway; configurações não realtime usam o loop de fala nativo.
- O Talk no navegador usa `talk.client.create` para sessões `webrtc` e `provider-websocket` gerenciadas pelo cliente, ou `talk.session.create` para sessões `gateway-relay` gerenciadas pelo Gateway. `managed-room` é reservado para handoff do Gateway e salas walkie-talkie.
- O Talk no Android pode optar por sessões de relay realtime gerenciadas pelo Gateway com `talk.realtime.mode: "realtime"` e `talk.realtime.transport: "gateway-relay"`. Caso contrário, permanece no reconhecimento de fala nativo, chat do Gateway e `talk.speak`.
- Clientes somente de transcrição usam `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, depois `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` quando precisam de legendas ou ditado sem uma resposta de voz do assistente.

O Talk nativo é um loop contínuo de conversa por voz:

1. Escutar a fala
2. Enviar a transcrição ao modelo pela sessão ativa
3. Aguardar a resposta
4. Reproduzi-la pelo provedor Talk configurado (`talk.speak`)

O Talk realtime gerenciado pelo cliente encaminha chamadas de ferramenta do provedor por `talk.client.toolCall`; esses clientes não chamam `chat.send` diretamente para consultas realtime.
Enquanto uma consulta realtime está ativa, clientes Talk podem usar `talk.client.steer` ou
`talk.session.steer` para classificar entrada falada como `status`, `steer`, `cancel` ou
`followup`. Direcionamento aceito é enfileirado na execução incorporada ativa; direcionamento
rejeitado retorna um motivo estruturado, como `no_active_run`, `not_streaming`
ou `compacting`.

O Talk somente de transcrição emite o mesmo envelope comum de eventos Talk que sessões realtime e STT/TTS, mas usa `mode: "transcription"` e `brain: "none"`. Ele serve para legendas, ditado e captura de fala somente para observação; notas de voz enviadas de uma só vez ainda usam o caminho de mídia/áudio.

## Comportamento (macOS)

- **Sobreposição sempre ativa** enquanto o modo Talk está habilitado.
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

- Apenas a primeira linha não vazia.
- Chaves desconhecidas são ignoradas.
- `once: true` aplica-se somente à resposta atual.
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
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

Padrões:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms no macOS e Android, 900 ms no iOS`)
- `provider`: seleciona o provedor Talk ativo. Use `elevenlabs`, `mlx` ou `system` para os caminhos de reprodução locais do macOS.
- `providers.<provider>.voiceId`: recorre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (ou à primeira voz ElevenLabs quando a chave de API está disponível).
- `providers.elevenlabs.modelId`: o padrão é `eleven_v3` quando não definido.
- `providers.mlx.modelId`: o padrão é `mlx-community/Soprano-80M-bf16` quando não definido.
- `providers.elevenlabs.apiKey`: recorre a `ELEVENLABS_API_KEY` (ou ao perfil shell do gateway, se disponível).
- `consultThinkingLevel`: substituição opcional do nível de raciocínio para a execução completa do agente OpenClaw por trás de chamadas realtime `openclaw_agent_consult`.
- `consultFastMode`: substituição opcional do modo rápido para chamadas realtime `openclaw_agent_consult`.
- `realtime.provider`: seleciona o provedor de voz realtime ativo. Use `openai` para WebRTC, `google` para WebSocket do provedor ou um provedor somente ponte pelo relay do Gateway.
- `realtime.providers.<provider>` armazena a configuração realtime gerenciada pelo provedor. O navegador recebe apenas credenciais de sessão efêmeras ou restritas, nunca uma chave de API padrão.
- `realtime.providers.openai.voice`: id de voz integrado do OpenAI Realtime. As vozes atuais de `gpt-realtime-2` são `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` e `cedar`; `marin` e `cedar` são recomendadas para melhor qualidade.
- `realtime.transport`: `webrtc` usa WebRTC da OpenAI gerenciado pelo cliente no iOS e no navegador. `provider-websocket` é gerenciado pelo navegador, mas permanece no relay do Gateway no iOS. `gateway-relay` mantém o áudio do provedor no Gateway; o Android usa realtime somente para esse transporte e, caso contrário, mantém seu loop STT/TTS nativo.
- `realtime.brain`: `agent-consult` roteia chamadas de ferramenta realtime pela política do Gateway; `direct-tools` é o comportamento legado de compatibilidade com ferramenta direta; `none` é para transcrição ou orquestração externa.
- `realtime.consultRouting`: `provider-direct` preserva a resposta direta do provedor quando ele ignora `openclaw_agent_consult`; `force-agent-consult` faz o relay do Gateway rotear transcrições finais do usuário pelo OpenClaw.
- `realtime.instructions`: acrescenta instruções de sistema voltadas ao provedor ao prompt realtime integrado do OpenClaw. Use para estilo e tom de voz; o OpenClaw mantém a orientação padrão de `openclaw_agent_consult`.
- `talk.catalog` expõe os modos, transportes, estratégias de brain, formatos de áudio realtime e flags de capacidade válidos de cada provedor para que clientes Talk próprios possam evitar combinações sem suporte.
- Provedores de transcrição por streaming são descobertos por `talk.catalog.transcription`. O relay atual do Gateway usa a configuração do provedor de streaming Voice Call até que a superfície dedicada de configuração de transcrição do Talk seja adicionada.
- `speechLocale`: id de localidade BCP 47 opcional para reconhecimento de fala Talk no dispositivo no iOS/macOS. Deixe indefinido para usar o padrão do dispositivo.
- `outputFormat`: o padrão é `pcm_44100` no macOS/iOS e `pcm_24000` no Android (defina `mp3_*` para forçar streaming MP3)

## UI do macOS

- Alternância na barra de menus: **Talk**
- Aba de configuração: grupo **Modo Talk** (id de voz + alternância de interrupção)
- Sobreposição:
  - **Escutando**: a nuvem pulsa com o nível do microfone
  - **Pensando**: animação de afundamento
  - **Falando**: anéis radiantes
  - Clicar na nuvem: parar de falar
  - Clicar no X: sair do modo Talk

## UI do Android

- Alternância na aba Voz: **Talk**
- **Mic** manual e **Talk** são modos de captura de runtime mutuamente exclusivos.
- Mic manual e Talk realtime preferem um microfone de headset Bluetooth Classic ou BLE conectado. Se ele desconectar, o app solicita outra entrada de headset ou deixa o Android usar o microfone padrão; parar a captura restaura a preferência de microfone padrão.
- O Mic manual para quando o app sai do primeiro plano ou o usuário sai da aba Voz.
- O modo Talk continua em execução até ser desativado ou o nó Android desconectar, e usa o tipo de serviço em primeiro plano de microfone do Android enquanto ativo.

## Observações

- Requer permissões de Fala + Microfone.
- O Talk nativo usa a sessão ativa do Gateway e só recorre à sondagem de histórico quando eventos de resposta não estão disponíveis.
- O Talk realtime gerenciado pelo cliente usa `talk.client.toolCall` para `openclaw_agent_consult` em vez de expor `chat.send` a sessões gerenciadas pelo provedor.
- O Talk somente de transcrição usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close`; os clientes assinam `talk.event` para atualizações parciais/finais de transcrição.
- O gateway resolve a reprodução Talk por `talk.speak` usando o provedor Talk ativo. O Android recorre ao TTS local do sistema somente quando esse RPC não está disponível.
- A reprodução MLX local no macOS usa o helper `openclaw-mlx-tts` incluído quando presente, ou um executável no `PATH`. Defina `OPENCLAW_MLX_TTS_BIN` para apontar para um binário de helper personalizado durante o desenvolvimento.
- `stability` para `eleven_v3` é validado para `0.0`, `0.5` ou `1.0`; outros modelos aceitam `0..1`.
- `latency_tier` é validado para `0..4` quando definido.
- O Android oferece suporte aos formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming AudioTrack de baixa latência.

## Relacionado

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
