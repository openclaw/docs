---
read_when:
    - Implementação do modo de conversa no macOS/iOS/Android
    - Alteração do comportamento de voz/TTS/interrupção
summary: 'Modo de conversa: conversas contínuas por voz com STT/TTS local e voz em tempo real'
title: Modo de conversa
x-i18n:
    generated_at: "2026-07-12T00:02:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

O modo de conversa abrange cinco formatos de execução:

- **Conversa nativa no macOS/iOS/Android**: reconhecimento de fala local, chat do Gateway e TTS por `talk.speak`. Os Nodes anunciam a capacidade `talk` e declaram quais comandos `talk.*` são compatíveis.
- **Conversa no iOS (em tempo real)**: WebRTC controlado pelo cliente para configurações em tempo real da OpenAI que selecionam o transporte `webrtc` ou omitem o transporte. Configurações em tempo real explícitas com `gateway-relay`, `provider-websocket` e de outros provedores que não a OpenAI permanecem no retransmissor controlado pelo Gateway; configurações que não são em tempo real usam o ciclo de fala nativo.
- **Conversa no navegador**: `talk.client.create` para sessões `webrtc`/`provider-websocket` controladas pelo cliente ou `talk.session.create` para sessões `gateway-relay` controladas pelo Gateway. `managed-room` é reservado para transferência ao Gateway e salas de comunicação por turnos.
- **Conversa no Android (em tempo real)**: habilite explicitamente com `talk.realtime.mode: "realtime"` e `talk.realtime.transport: "gateway-relay"`. Caso contrário, o Android permanece com reconhecimento de fala nativo, chat do Gateway e `talk.speak`.
- **Clientes somente de transcrição**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` e, em seguida, `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` para legendas/ditado sem resposta de voz do assistente. Mensagens de voz enviadas de forma avulsa continuam usando o caminho de áudio de [compreensão de mídia](/pt-BR/nodes/media-understanding).

A conversa nativa é um ciclo contínuo: ouvir a fala, enviar a transcrição ao modelo por meio da sessão ativa, aguardar a resposta e então reproduzi-la pelo provedor de conversa configurado (`talk.speak`).

A conversa em tempo real controlada pelo cliente encaminha as chamadas de ferramentas do provedor por meio de `talk.client.toolCall`, em vez de chamar `chat.send` diretamente. Enquanto uma consulta em tempo real está ativa, os clientes podem chamar `talk.client.steer` ou `talk.session.steer` para classificar a entrada falada como `status`, `steer`, `cancel` ou `followup`. O direcionamento aceito entra na fila da execução integrada ativa; o direcionamento rejeitado retorna um motivo como `no_active_run`, `not_streaming` ou `compacting`.

A conversa somente de transcrição emite o mesmo envelope de eventos de conversa que as sessões em tempo real e de STT/TTS, mas usa `mode: "transcription"` e `brain: "none"`. Todas as sessões de conversa transmitem eventos no canal `talk.event`; os clientes assinam esse canal para receber atualizações parciais/finais da transcrição (`transcript.delta`/`transcript.done`) e outras informações de telemetria da sessão.

## Comportamento (macOS)

- Sobreposição sempre visível enquanto o modo de conversa estiver habilitado.
- Transições entre as fases **Ouvindo &rarr; Pensando &rarr; Falando**.
- Após uma pausa curta (janela de silêncio), a transcrição atual é enviada.
- As respostas são gravadas no WebChat (da mesma forma que ao digitar).
- **Interromper ao detectar fala** (ativado por padrão): se o usuário falar enquanto o assistente estiver falando, a reprodução será interrompida e o horário da interrupção será registrado para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar uma resposta com uma única linha JSON para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Somente a primeira linha não vazia; a linha JSON é removida antes da reprodução por TTS.
- Chaves desconhecidas são ignoradas.
- `once: true` aplica-se somente à resposta atual; sem essa opção, a voz se torna o novo padrão do modo de conversa.

Chaves compatíveis: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (PPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "Fale de forma acolhedora e mantenha as respostas breves.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Chave                                    | Padrão                                     | Observações                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Provedor de TTS ativo da conversa. Use `elevenlabs`, `mlx` ou `system` para caminhos de reprodução locais do macOS.                                                                                                                                                                                                                      |
| `providers.<id>.voiceId`                 | -                                          | A ElevenLabs recorre a `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` ou à primeira voz disponível com uma chave de API.                                                                                                                                                                                                                         |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                                                                                         |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                                                                                         |
| `providers.elevenlabs.apiKey`            | -                                          | Recorre a `ELEVENLABS_API_KEY` (ou ao perfil de shell do Gateway, se disponível).                                                                                                                                                                                                                                                        |
| `speechLocale`                           | padrão do dispositivo                      | Identificador de localidade BCP 47 para o reconhecimento de fala da conversa no dispositivo no iOS/macOS.                                                                                                                                                                                                                               |
| `silenceTimeoutMs`                       | `700` ms no macOS/Android, `900` ms no iOS | Janela de pausa antes de a conversa enviar a transcrição.                                                                                                                                                                                                                                                                                |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                                                                                         |
| `outputFormat`                           | `pcm_44100` no macOS/iOS, `pcm_24000` no Android | Defina como `mp3_*` para forçar a transmissão em MP3.                                                                                                                                                                                                                                                                              |
| `consultThinkingLevel`                   | não definido                               | Substituição do nível de raciocínio para a execução do agente por trás das chamadas `openclaw_agent_consult` em tempo real.                                                                                                                                                                                                              |
| `consultFastMode`                        | não definido                               | Substituição do modo rápido para chamadas `openclaw_agent_consult` em tempo real.                                                                                                                                                                                                                                                        |
| `realtime.provider`                      | -                                          | `openai` para WebRTC, `google` para WebSocket do provedor ou um provedor exclusivo de ponte por meio do retransmissor do Gateway.                                                                                                                                                                                                        |
| `realtime.providers.<id>`                | -                                          | Configuração em tempo real controlada pelo provedor. Os navegadores recebem somente credenciais de sessão efêmeras/restritas, nunca uma chave de API padrão.                                                                                                                                                                              |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | Identificador de voz integrado do OpenAI Realtime (a chave antiga `voice` ainda funciona, mas está obsoleta). Vozes atuais do `gpt-realtime-2.1`: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; `marin` e `cedar` são recomendadas para obter a melhor qualidade. |
| `realtime.transport`                     | -                                          | `webrtc`: WebRTC da OpenAI controlado pelo cliente no iOS e no navegador. `provider-websocket`: controlado pelo navegador; permanece no retransmissor do Gateway no iOS. `gateway-relay`: mantém o áudio do provedor no Gateway; o Android usa tempo real somente com esse transporte.                                                       |
| `realtime.brain`                         | -                                          | `agent-consult` encaminha chamadas de ferramentas em tempo real pela política do Gateway; `direct-tools` é a compatibilidade legada com ferramentas diretas; `none` destina-se a transcrição/orquestração externa.                                                                                                                         |
| `realtime.consultRouting`                | -                                          | `provider-direct` preserva a resposta direta do provedor quando ele ignora `openclaw_agent_consult`; `force-agent-consult` encaminha as transcrições finalizadas do usuário pelo OpenClaw.                                                                                                                                                 |
| `realtime.instructions`                  | -                                          | Acrescenta instruções de sistema voltadas ao provedor ao prompt em tempo real integrado do OpenClaw (estilo/tom de voz); a orientação padrão de `openclaw_agent_consult` é mantida.                                                                                                                                                        |

`talk.catalog` expõe IDs canônicos de provedores e aliases do registro, os modos/transportes/estratégias de cérebro/formatos de áudio em tempo real/sinalizadores de capacidade válidos de cada provedor e o resultado de prontidão selecionado em tempo de execução. Os clientes Talk primários devem consultar esse catálogo em vez de manter aliases de provedores localmente; trate um Gateway mais antigo que omita a prontidão do grupo como não verificado, em vez de definitivamente não configurado. Os provedores de transcrição por streaming são descobertos por meio de `talk.catalog.transcription`; a retransmissão atual do Gateway usa a configuração do provedor de streaming de chamadas de voz até que uma superfície de configuração dedicada à transcrição do Talk seja disponibilizada.

## Interface do macOS

- Alternância na barra de menus: **Talk**
- Aba de configuração: grupo **Talk Mode** (ID de voz + alternância de interrupção)
- Sobreposição: a esfera renderiza a forma de onda universal do Talk (compartilhada com iOS, watchOS e Android). Durante a escuta, ela acompanha o nível do microfone em tempo real; durante a fala, acompanha o envelope real da reprodução de TTS; durante o processamento, pulsa suavemente. Clique na esfera para pausar/retomar, clique duas vezes para parar a fala e clique em X para sair do modo Talk.

## Interface do Android

- Alternância na aba de voz: **Talk**
- Os modos manuais de captura **Mic** e **Talk** são mutuamente exclusivos.
- O microfone manual e o Talk em tempo real priorizam o microfone de um headset Bluetooth Classic ou BLE conectado; se ele for desconectado, o aplicativo solicita outra entrada de headset ou recorre ao microfone padrão, restaurando a preferência padrão quando a captura termina.
- O microfone manual é interrompido quando o aplicativo sai do primeiro plano ou quando o usuário sai da aba de voz.
- O modo Talk continua em execução até ser desativado ou até o Node ser desconectado, usando o tipo de serviço em primeiro plano de microfone do Android enquanto estiver ativo.
- O Android é compatível com os formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming de baixa latência com `AudioTrack`.

## Observações

- Requer permissões de fala e microfone.
- O Talk nativo usa a sessão ativa do Gateway e só recorre à consulta periódica do histórico quando os eventos de resposta não estão disponíveis.
- O Gateway processa a reprodução do Talk por meio de `talk.speak`, usando o provedor ativo do Talk. O Android só recorre ao TTS local do sistema quando esse RPC não está disponível.
- A reprodução local com MLX no macOS usa o utilitário `openclaw-mlx-tts` incluído quando disponível ou um executável no `PATH`. Defina `OPENCLAW_MLX_TTS_BIN` para apontar para um binário de utilitário personalizado durante o desenvolvimento.
- Intervalos de valores das diretivas de voz (ElevenLabs): `stability`, `similarity` e `style` aceitam `0..1`; `speed` aceita `0.5..2`; `latency_tier` aceita `0..4`.

## Relacionado

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Áudio e mensagens de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
