---
read_when:
    - Implementação do modo de conversa no macOS/iOS/Android
    - Alteração do comportamento de voz/TTS/interrupção
summary: 'Modo de conversa: conversas contínuas por voz com STT/TTS local e voz em tempo real'
title: Modo de conversa
x-i18n:
    generated_at: "2026-07-12T15:20:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4180dcbf7a62cd03e2d18f2c568ed2182c9cf2f80159154a7d261bcb9b3ebee0
    source_path: nodes/talk.md
    workflow: 16
---

O modo Talk abrange cinco formatos de runtime:

- **Talk nativo no macOS/iOS/Android**: reconhecimento de fala local, chat pelo Gateway e TTS via `talk.speak`. Os Nodes anunciam a capacidade `talk` e declaram quais comandos `talk.*` são compatíveis.
- **Talk no iOS (tempo real)**: WebRTC controlado pelo cliente para configurações de tempo real da OpenAI que selecionam o transporte `webrtc` ou omitem o transporte. Configurações explícitas de tempo real `gateway-relay`, `provider-websocket` e que não sejam da OpenAI permanecem no relay controlado pelo Gateway; configurações que não sejam de tempo real usam o loop de fala nativo.
- **Talk no navegador**: `talk.client.create` para sessões `webrtc`/`provider-websocket` controladas pelo cliente ou `talk.session.create` para sessões `gateway-relay` controladas pelo Gateway. `managed-room` é reservado para transferência ao Gateway e salas de walkie-talkie.
- **Talk no Android (tempo real)**: habilite com `talk.realtime.mode: "realtime"` e `talk.realtime.transport: "gateway-relay"`. Caso contrário, o Android permanece no reconhecimento de fala nativo, no chat pelo Gateway e em `talk.speak`.
- **Clientes somente de transcrição**: `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })` e, em seguida, `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` para legendas/ditado sem uma resposta de voz do assistente. Notas de voz enviadas individualmente ainda usam o caminho de áudio de [compreensão de mídia](/pt-BR/nodes/media-understanding).

O Talk nativo é um loop contínuo: aguarda a fala, envia a transcrição ao modelo por meio da sessão ativa, espera a resposta e então a reproduz pelo provedor Talk configurado (`talk.speak`).

O Talk em tempo real controlado pelo cliente encaminha as chamadas de ferramentas do provedor por meio de `talk.client.toolCall`, em vez de chamar `chat.send` diretamente. Enquanto uma consulta em tempo real está ativa, os clientes podem chamar `talk.client.steer` ou `talk.session.steer` para classificar a entrada falada como `status`, `steer`, `cancel` ou `followup`. O direcionamento aceito entra na fila da execução incorporada ativa; o direcionamento rejeitado retorna um motivo como `no_active_run`, `not_streaming` ou `compacting`.

O Talk somente de transcrição emite o mesmo envelope de eventos do Talk que as sessões de tempo real e STT/TTS, mas usa `mode: "transcription"` e `brain: "none"`. Todas as sessões do Talk transmitem eventos no canal `talk.event`; os clientes o assinam para receber atualizações parciais/finais da transcrição (`transcript.delta`/`transcript.done`) e outras telemetrias da sessão.

## Comportamento (macOS)

- Sobreposição sempre ativa enquanto o modo Talk estiver habilitado.
- Transições de fase **Ouvindo &rarr; Pensando &rarr; Falando**.
- Após uma pausa curta (janela de silêncio), a transcrição atual é enviada.
- As respostas são gravadas no WebChat (como se fossem digitadas).
- **Interromper ao detectar fala** (ativado por padrão): se o usuário falar enquanto o assistente estiver falando, a reprodução será interrompida e o instante da interrupção será registrado para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar uma resposta com uma única linha JSON para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Apenas a primeira linha não vazia; a linha JSON é removida antes da reprodução por TTS.
- Chaves desconhecidas são ignoradas.
- `once: true` aplica-se apenas à resposta atual; sem essa opção, a voz se torna o novo padrão do modo Talk.

Chaves compatíveis: `voice` / `voice_id` / `voiceId`, `model` / `model_id` / `modelId`, `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`, `seed`, `normalize`, `lang`, `output_format`, `latency_tier`, `once`.

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
      instructions: "Fale de forma calorosa e mantenha as respostas breves.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

| Chave                                    | Padrão                                     | Observações                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                               | -                                          | Provedor de TTS ativo do Talk. Use `elevenlabs`, `mlx` ou `system` para caminhos de reprodução local no macOS.                                                                                                                                                                                                                                |
| `providers.<id>.voiceId`                 | -                                          | A ElevenLabs usa como alternativas `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` ou a primeira voz disponível com uma chave de API.                                                                                                                                                                                                                 |
| `providers.elevenlabs.modelId`           | `eleven_v3`                                |                                                                                                                                                                                                                                                                                                                                              |
| `providers.mlx.modelId`                  | `mlx-community/Soprano-80M-bf16`           |                                                                                                                                                                                                                                                                                                                                              |
| `providers.elevenlabs.apiKey`            | -                                          | Usa como alternativa `ELEVENLABS_API_KEY` (ou o perfil de shell do Gateway, se disponível).                                                                                                                                                                                                                                                  |
| `speechLocale`                           | padrão do dispositivo                      | ID de localidade BCP 47 para reconhecimento de fala do Talk no dispositivo no iOS/macOS.                                                                                                                                                                                                                                                     |
| `silenceTimeoutMs`                       | `700` ms no macOS/Android, `900` ms no iOS | Janela de pausa antes de o Talk enviar a transcrição.                                                                                                                                                                                                                                                                                        |
| `interruptOnSpeech`                      | `true`                                     |                                                                                                                                                                                                                                                                                                                                              |
| `outputFormat`                           | `pcm_44100` no macOS/iOS, `pcm_24000` no Android | Defina como `mp3_*` para forçar streaming de MP3.                                                                                                                                                                                                                                                                                       |
| `consultThinkingLevel`                   | não definido                               | Substituição do nível de raciocínio para a execução do agente por trás das chamadas `openclaw_agent_consult` em tempo real.                                                                                                                                                                                                                  |
| `consultFastMode`                        | não definido                               | Substituição do modo rápido para chamadas `openclaw_agent_consult` em tempo real.                                                                                                                                                                                                                                                            |
| `realtime.provider`                      | -                                          | `openai` para WebRTC, `google` para WebSocket do provedor ou um provedor exclusivo de ponte por meio do relay do Gateway.                                                                                                                                                                                                                    |
| `realtime.providers.<id>`                | -                                          | Configuração de tempo real controlada pelo provedor. Os navegadores recebem apenas credenciais de sessão efêmeras/restritas, nunca uma chave de API padrão.                                                                                                                                                                                   |
| `realtime.providers.openai.speakerVoice` | `alloy`                                    | ID de voz integrado do OpenAI Realtime (a chave antiga `voice` ainda funciona, mas está obsoleta). Vozes atuais do `gpt-realtime-2.1`: `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `marin`, `sage`, `shimmer`, `verse`; `marin` e `cedar` são recomendadas para obter a melhor qualidade. |
| `realtime.transport`                     | -                                          | `webrtc`: WebRTC da OpenAI controlado pelo cliente no iOS e no navegador. `provider-websocket`: controlado pelo navegador; permanece no relay do Gateway no iOS. `gateway-relay`: mantém o áudio do provedor no Gateway; o Android usa tempo real somente com esse transporte.                                                                    |
| `realtime.brain`                         | -                                          | `agent-consult` encaminha chamadas de ferramentas em tempo real pela política do Gateway; `direct-tools` é compatibilidade legada com ferramentas diretas; `none` destina-se a transcrição/orquestração externa.                                                                                                                               |
| `realtime.consultRouting`                | -                                          | `provider-direct` preserva a resposta direta do provedor quando ele ignora `openclaw_agent_consult`; `force-agent-consult` encaminha as transcrições finalizadas do usuário pelo OpenClaw.                                                                                                                                                    |
| `realtime.instructions`                  | -                                          | Acrescenta instruções de sistema voltadas ao provedor ao prompt de tempo real integrado do OpenClaw (estilo/tom de voz); as orientações padrão de `openclaw_agent_consult` são mantidas.                                                                                                                                                        |

`talk.catalog` expõe IDs canônicos de provedores e aliases do registro, os modos/transportes/estratégias de cérebro/formatos de áudio em tempo real/indicadores de capacidade válidos de cada provedor e o resultado de prontidão selecionado em tempo de execução. Os clientes Talk oficiais devem consultar esse catálogo em vez de manter aliases de provedores localmente; considere um Gateway mais antigo que omita a prontidão do grupo como não verificado, em vez de definitivamente não configurado. Os provedores de transcrição por streaming são descobertos por meio de `talk.catalog.transcription`; o relay atual do Gateway usa a configuração do provedor de streaming de Voice Call até que uma superfície de configuração dedicada à transcrição do Talk seja disponibilizada.

## Interface do macOS

- Alternância na barra de menus: **Talk**
- Aba de configuração: grupo **Modo Talk** (ID de voz + alternância de interrupção)
- Sobreposição: a esfera renderiza a forma de onda universal do Talk (compartilhada com iOS, watchOS e Android). Ao escutar, ela acompanha o nível do microfone em tempo real; ao falar, acompanha o envelope real da reprodução de TTS; ao pensar, pulsa suavemente. Clique na esfera para pausar/retomar, clique duas vezes para parar de falar e clique no X para sair do modo Talk.

## Interface do Android

- Alternância na aba de voz: **Talk**
- **Microfone** e **Talk** manuais são modos de captura mutuamente exclusivos.
- O Microfone manual e o Talk em tempo real priorizam o microfone de um headset Bluetooth Classic ou BLE conectado; se ele for desconectado, o aplicativo solicita outra entrada de headset ou usa o microfone padrão como alternativa, restaurando a preferência padrão quando a captura termina.
- O Microfone manual para quando o aplicativo sai do primeiro plano ou o usuário sai da aba de voz.
- O modo Talk continua em execução até ser desativado ou o Node se desconectar, usando o tipo de serviço em primeiro plano de microfone do Android enquanto estiver ativo.
- O Android é compatível com os formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming de baixa latência com `AudioTrack`.

## Observações

- Requer permissões de fala + microfone.
- O Talk nativo usa a sessão ativa do Gateway e só recorre à consulta periódica do histórico quando os eventos de resposta não estão disponíveis.
- O Gateway processa a reprodução do Talk por meio de `talk.speak`, usando o provedor ativo do Talk. O Android só recorre ao TTS local do sistema quando esse RPC não está disponível.
- A reprodução local com MLX no macOS usa o auxiliar `openclaw-mlx-tts` incluído, quando presente, ou um executável em `PATH`. Defina `OPENCLAW_MLX_TTS_BIN` para apontar para um binário auxiliar personalizado durante o desenvolvimento.
- Intervalos de valores das diretivas de voz (ElevenLabs): `stability`, `similarity` e `style` aceitam `0..1`; `speed` aceita `0.5..2`; `latency_tier` aceita `0..4`.

## Relacionado

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
