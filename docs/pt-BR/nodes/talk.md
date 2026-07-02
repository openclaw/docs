---
read_when:
    - Implementando o modo Talk no macOS/iOS/Android
    - Alterando o comportamento de voz/TTS/interrupção
summary: 'Modo de conversa: conversas por fala contínua com STT/TTS local e voz em tempo real'
title: Modo de conversa
x-i18n:
    generated_at: "2026-07-02T22:25:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 696e9693cd6b4a18500221230db17c94ffd01fe6f9c7fcf271b74072bb035a82
    source_path: nodes/talk.md
    workflow: 16
---

O modo de fala tem dois formatos de runtime:

- A fala nativa do macOS/iOS/Android usa reconhecimento de fala local, chat do Gateway e TTS `talk.speak`. Os nós anunciam a capacidade `talk` e declaram os comandos `talk.*` compatíveis.
- A fala no iOS usa WebRTC de propriedade do cliente para configurações em tempo real da OpenAI que selecionam `webrtc` ou omitem o transporte. Configurações em tempo real explícitas com `gateway-relay`, `provider-websocket` e não OpenAI permanecem no relay de propriedade do Gateway; configurações que não são em tempo real usam o loop de fala nativo.
- A fala no navegador usa `talk.client.create` para sessões `webrtc` e `provider-websocket` de propriedade do cliente, ou `talk.session.create` para sessões `gateway-relay` de propriedade do Gateway. `managed-room` é reservado para handoff do Gateway e salas de walkie-talkie.
- A fala no Android pode optar por sessões de relay em tempo real de propriedade do Gateway com `talk.realtime.mode: "realtime"` e `talk.realtime.transport: "gateway-relay"`. Caso contrário, ela permanece no reconhecimento de fala nativo, chat do Gateway e `talk.speak`.
- Clientes somente de transcrição usam `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, depois `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` quando precisam de legendas ou ditado sem uma resposta de voz do assistente.

A fala nativa é um loop contínuo de conversa por voz:

1. Ouvir a fala
2. Enviar a transcrição ao modelo pela sessão ativa
3. Aguardar a resposta
4. Reproduzi-la pelo provedor de fala configurado (`talk.speak`)

A fala em tempo real de propriedade do cliente encaminha chamadas de ferramenta do provedor por `talk.client.toolCall`; esses clientes não chamam `chat.send` diretamente para consultas em tempo real.
Enquanto uma consulta em tempo real está ativa, clientes de fala podem usar `talk.client.steer` ou
`talk.session.steer` para classificar a entrada falada como `status`, `steer`, `cancel` ou
`followup`. Direcionamentos aceitos são enfileirados na execução incorporada ativa; direcionamentos
rejeitados retornam um motivo estruturado como `no_active_run`, `not_streaming`
ou `compacting`.

A fala somente de transcrição emite o mesmo envelope comum de eventos de fala que sessões em tempo real e STT/TTS, mas usa `mode: "transcription"` e `brain: "none"`. Ela serve para legendas, ditado e captura de fala apenas para observação; notas de voz enviadas uma vez ainda usam o caminho de mídia/áudio.

## Comportamento (macOS)

- **Sobreposição sempre ativa** enquanto o modo de fala está habilitado.
- Transições de fase **Ouvindo → Pensando → Falando**.
- Em uma **pausa curta** (janela de silêncio), a transcrição atual é enviada.
- As respostas são **escritas no WebChat** (igual a digitar).
- **Interromper ao falar** (ativado por padrão): se o usuário começar a falar enquanto o assistente está falando, interrompemos a reprodução e registramos o carimbo de data/hora da interrupção para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar sua resposta com uma **única linha JSON** para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Apenas a primeira linha não vazia.
- Chaves desconhecidas são ignoradas.
- `once: true` se aplica somente à resposta atual.
- Sem `once`, a voz se torna o novo padrão para o modo de fala.
- A linha JSON é removida antes da reprodução TTS.

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
- `silenceTimeoutMs`: quando não definido, a fala mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms no macOS e Android, 900 ms no iOS`)
- `provider`: seleciona o provedor de fala ativo. Use `elevenlabs`, `mlx` ou `system` para os caminhos de reprodução locais do macOS.
- `providers.<provider>.voiceId`: recorre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (ou à primeira voz da ElevenLabs quando a chave de API está disponível).
- `providers.elevenlabs.modelId`: o padrão é `eleven_v3` quando não definido.
- `providers.mlx.modelId`: o padrão é `mlx-community/Soprano-80M-bf16` quando não definido.
- `providers.elevenlabs.apiKey`: recorre a `ELEVENLABS_API_KEY` (ou ao perfil de shell do gateway, se disponível).
- `consultThinkingLevel`: substituição opcional do nível de raciocínio para a execução completa do agente OpenClaw por trás das chamadas `openclaw_agent_consult` em tempo real.
- `consultFastMode`: substituição opcional do modo rápido para chamadas `openclaw_agent_consult` em tempo real.
- `realtime.provider`: seleciona o provedor de voz em tempo real ativo. Use `openai` para WebRTC, `google` para WebSocket do provedor ou um provedor somente de ponte pelo relay do Gateway.
- `realtime.providers.<provider>` armazena a configuração em tempo real de propriedade do provedor. O navegador recebe apenas credenciais de sessão efêmeras ou restritas, nunca uma chave de API padrão.
- `realtime.providers.openai.voice`: ID de voz integrado do OpenAI Realtime. As vozes atuais de `gpt-realtime-2` são `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` e `cedar`; `marin` e `cedar` são recomendadas para a melhor qualidade.
- `realtime.transport`: `webrtc` usa OpenAI WebRTC de propriedade do cliente no iOS e no navegador. `provider-websocket` é de propriedade do navegador, mas permanece no relay do Gateway no iOS. `gateway-relay` mantém o áudio do provedor no Gateway; o Android usa tempo real somente para esse transporte e, caso contrário, mantém seu loop STT/TTS nativo.
- `realtime.brain`: `agent-consult` roteia chamadas de ferramenta em tempo real pela política do Gateway; `direct-tools` é o comportamento legado de compatibilidade com ferramenta direta; `none` é para transcrição ou orquestração externa.
- `realtime.consultRouting`: `provider-direct` preserva a resposta direta do provedor quando ele pula `openclaw_agent_consult`; `force-agent-consult` faz o relay do Gateway rotear transcrições de usuário finalizadas pelo OpenClaw.
- `realtime.instructions`: acrescenta instruções de sistema voltadas ao provedor ao prompt em tempo real integrado do OpenClaw. Use para estilo e tom da voz; o OpenClaw mantém a orientação padrão de `openclaw_agent_consult`.
- `talk.catalog` expõe os modos, transportes, estratégias de brain, formatos de áudio em tempo real e sinalizadores de capacidade válidos de cada provedor para que clientes de fala próprios possam evitar combinações sem suporte.
- Provedores de transcrição por streaming são descobertos por `talk.catalog.transcription`. O relay atual do Gateway usa a configuração de provedor de streaming de chamada de voz até que a superfície de configuração dedicada de transcrição de fala seja adicionada.
- `speechLocale`: ID de localidade BCP 47 opcional para reconhecimento de fala no dispositivo no iOS/macOS. Deixe indefinido para usar o padrão do dispositivo.
- `outputFormat`: o padrão é `pcm_44100` no macOS/iOS e `pcm_24000` no Android (defina `mp3_*` para forçar streaming MP3)

## Interface do macOS

- Alternância na barra de menus: **Fala**
- Aba de configuração: grupo **Modo de Fala** (ID de voz + alternância de interrupção)
- Sobreposição:
  - **Ouvindo**: a nuvem pulsa com o nível do microfone
  - **Pensando**: animação de afundamento
  - **Falando**: anéis irradiando
  - Clicar na nuvem: parar de falar
  - Clicar no X: sair do modo de fala

## Interface do Android

- Alternância na aba Voz: **Fala**
- **Microfone** manual e **Fala** manual são modos de captura de runtime mutuamente exclusivos.
- O microfone manual para quando o app sai do primeiro plano ou quando o usuário sai da aba Voz.
- O modo de fala continua em execução até ser desativado ou até o nó Android desconectar, e usa o tipo de serviço em primeiro plano de microfone do Android enquanto ativo.

## Observações

- Requer permissões de Fala + Microfone.
- A fala nativa usa a sessão ativa do Gateway e só recorre à sondagem de histórico quando eventos de resposta não estão disponíveis.
- A fala em tempo real de propriedade do cliente usa `talk.client.toolCall` para `openclaw_agent_consult` em vez de expor `chat.send` a sessões de propriedade do provedor.
- A fala somente de transcrição usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close`; clientes assinam `talk.event` para atualizações parciais/finais de transcrição.
- O gateway resolve a reprodução de fala por `talk.speak` usando o provedor de fala ativo. O Android recorre ao TTS local do sistema somente quando esse RPC não está disponível.
- A reprodução MLX local do macOS usa o helper `openclaw-mlx-tts` incluído quando presente, ou um executável em `PATH`. Defina `OPENCLAW_MLX_TTS_BIN` para apontar para um binário de helper personalizado durante o desenvolvimento.
- `stability` para `eleven_v3` é validado como `0.0`, `0.5` ou `1.0`; outros modelos aceitam `0..1`.
- `latency_tier` é validado como `0..4` quando definido.
- O Android oferece suporte aos formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming AudioTrack de baixa latência.

## Relacionado

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Entendimento de mídia](/pt-BR/nodes/media-understanding)
