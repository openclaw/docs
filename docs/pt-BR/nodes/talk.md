---
read_when:
    - Implementando o modo Talk no macOS/iOS/Android
    - Alterando o comportamento de voz/TTS/interrupção
summary: 'Modo de conversa: conversas de fala contínua por STT/TTS local e voz em tempo real'
title: Modo de conversa
x-i18n:
    generated_at: "2026-06-27T17:40:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 47ae6c1abc763688ab5bbea1c23c9f4f27fe2f4b13cfade61917f5a1a912f057
    source_path: nodes/talk.md
    workflow: 16
---

O modo Talk tem dois formatos de runtime:

- O Talk nativo do macOS/iOS/Android usa reconhecimento de fala local, chat do Gateway e TTS `talk.speak`. Os nós anunciam a capacidade `talk` e declaram os comandos `talk.*` compatíveis.
- O Talk no navegador usa `talk.client.create` para sessões `webrtc` e `provider-websocket` de propriedade do cliente, ou `talk.session.create` para sessões `gateway-relay` de propriedade do Gateway. `managed-room` é reservado para transferência do Gateway e salas de walkie-talkie.
- O Talk no Android pode optar por sessões de relay em tempo real de propriedade do Gateway com `talk.realtime.mode: "realtime"` e `talk.realtime.transport: "gateway-relay"`. Caso contrário, permanece no reconhecimento de fala nativo, chat do Gateway e `talk.speak`.
- Clientes somente de transcrição usam `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`, depois `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close` quando precisam de legendas ou ditado sem uma resposta de voz do assistente.

O Talk nativo é um loop contínuo de conversa por voz:

1. Escutar fala
2. Enviar a transcrição para o modelo por meio da sessão ativa
3. Aguardar a resposta
4. Falar por meio do provedor de Talk configurado (`talk.speak`)

O Talk em tempo real no navegador encaminha chamadas de ferramentas do provedor por meio de `talk.client.toolCall`; clientes de navegador não chamam `chat.send` diretamente para consultas em tempo real.
Enquanto uma consulta em tempo real está ativa, clientes Talk podem usar `talk.client.steer` ou
`talk.session.steer` para classificar a entrada falada como `status`, `steer`, `cancel` ou
`followup`. Direcionamento aceito é enfileirado na execução incorporada ativa; direcionamento
rejeitado retorna um motivo estruturado, como `no_active_run`, `not_streaming`
ou `compacting`.

O Talk somente de transcrição emite o mesmo envelope comum de eventos Talk que sessões em tempo real e STT/TTS, mas usa `mode: "transcription"` e `brain: "none"`. Ele é para legendas, ditado e captura de fala apenas para observação; notas de voz enviadas uma única vez ainda usam o caminho de mídia/áudio.

## Comportamento (macOS)

- **Sobreposição sempre ativa** enquanto o modo Talk está habilitado.
- Transições de fase **Escutando → Pensando → Falando**.
- Em uma **pausa curta** (janela de silêncio), a transcrição atual é enviada.
- As respostas são **escritas no WebChat** (igual a digitar).
- **Interromper ao detectar fala** (ativado por padrão): se o usuário começar a falar enquanto o assistente está falando, interrompemos a reprodução e registramos o timestamp da interrupção para o próximo prompt.

## Diretivas de voz nas respostas

O assistente pode prefixar sua resposta com uma **única linha JSON** para controlar a voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Regras:

- Apenas a primeira linha não vazia.
- Chaves desconhecidas são ignoradas.
- `once: true` se aplica apenas à resposta atual.
- Sem `once`, a voz se torna o novo padrão do modo Talk.
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
- `provider`: seleciona o provedor de Talk ativo. Use `elevenlabs`, `mlx` ou `system` para os caminhos de reprodução locais do macOS.
- `providers.<provider>.voiceId`: recua para `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (ou a primeira voz ElevenLabs quando a chave de API está disponível).
- `providers.elevenlabs.modelId`: usa `eleven_v3` por padrão quando não definido.
- `providers.mlx.modelId`: usa `mlx-community/Soprano-80M-bf16` por padrão quando não definido.
- `providers.elevenlabs.apiKey`: recua para `ELEVENLABS_API_KEY` (ou perfil de shell do Gateway, se disponível).
- `consultThinkingLevel`: substituição opcional do nível de raciocínio para a execução completa do agente OpenClaw por trás de chamadas `openclaw_agent_consult` em tempo real.
- `consultFastMode`: substituição opcional do modo rápido para chamadas `openclaw_agent_consult` em tempo real.
- `realtime.provider`: seleciona o provedor de voz em tempo real ativo do navegador/servidor. Use `openai` para WebRTC, `google` para WebSocket do provedor ou um provedor somente ponte por meio do relay do Gateway.
- `realtime.providers.<provider>` armazena a configuração em tempo real de propriedade do provedor. O navegador recebe apenas credenciais de sessão efêmeras ou restritas, nunca uma chave de API padrão.
- `realtime.providers.openai.voice`: id de voz integrado do OpenAI Realtime. As vozes atuais de `gpt-realtime-2` são `alloy`, `ash`, `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin` e `cedar`; `marin` e `cedar` são recomendadas para a melhor qualidade.
- `realtime.transport`: `webrtc` e `provider-websocket` são transportes em tempo real para navegador. O Android usa relay em tempo real apenas quando isto é `gateway-relay`; caso contrário, o Talk no Android usa seu loop nativo de STT/TTS.
- `realtime.brain`: `agent-consult` roteia chamadas de ferramentas em tempo real pela política do Gateway; `direct-tools` é o comportamento legado de compatibilidade com ferramentas diretas; `none` é para transcrição ou orquestração externa.
- `realtime.consultRouting`: `provider-direct` preserva a resposta direta do provedor quando ele ignora `openclaw_agent_consult`; `force-agent-consult` faz o relay do Gateway rotear transcrições finalizadas do usuário pelo OpenClaw.
- `realtime.instructions`: anexa instruções de sistema voltadas ao provedor ao prompt em tempo real integrado do OpenClaw. Use para estilo e tom de voz; o OpenClaw mantém a orientação padrão de `openclaw_agent_consult`.
- `talk.catalog` expõe os modos, transportes, estratégias de brain, formatos de áudio em tempo real e flags de capacidade válidos de cada provedor, para que clientes Talk primários possam evitar combinações incompatíveis.
- Provedores de transcrição por streaming são descobertos por meio de `talk.catalog.transcription`. O relay atual do Gateway usa a configuração do provedor de streaming de Voice Call até que a superfície dedicada de configuração de transcrição do Talk seja adicionada.
- `speechLocale`: id de localidade BCP 47 opcional para reconhecimento de fala do Talk no dispositivo em iOS/macOS. Deixe não definido para usar o padrão do dispositivo.
- `outputFormat`: usa `pcm_44100` por padrão no macOS/iOS e `pcm_24000` no Android (defina `mp3_*` para forçar streaming MP3)

## IU do macOS

- Alternância na barra de menus: **Talk**
- Aba de configuração: grupo **Modo Talk** (id de voz + alternância de interrupção)
- Sobreposição:
  - **Escutando**: nuvem pulsa com o nível do microfone
  - **Pensando**: animação de afundamento
  - **Falando**: anéis irradiando
  - Clicar na nuvem: parar de falar
  - Clicar no X: sair do modo Talk

## IU do Android

- Alternância da aba Voz: **Talk**
- **Mic** manual e **Talk** são modos mutuamente exclusivos de captura em runtime.
- Mic manual para quando o app sai do primeiro plano ou o usuário sai da aba Voz.
- O Modo Talk continua em execução até ser desativado ou até o nó Android desconectar, e usa o tipo de serviço em primeiro plano de microfone do Android enquanto está ativo.

## Observações

- Requer permissões de Fala + Microfone.
- O Talk nativo usa a sessão ativa do Gateway e só recua para polling de histórico quando eventos de resposta estão indisponíveis.
- O Talk em tempo real no navegador usa `talk.client.toolCall` para `openclaw_agent_consult` em vez de expor `chat.send` a sessões de navegador de propriedade do provedor.
- O Talk somente de transcrição usa `talk.session.create`, `talk.session.appendAudio`, `talk.session.cancelTurn` e `talk.session.close`; clientes assinam `talk.event` para atualizações parciais/finais da transcrição.
- O Gateway resolve a reprodução do Talk por meio de `talk.speak` usando o provedor de Talk ativo. O Android recua para TTS local do sistema apenas quando esse RPC está indisponível.
- A reprodução MLX local do macOS usa o auxiliar `openclaw-mlx-tts` incluído quando presente, ou um executável no `PATH`. Defina `OPENCLAW_MLX_TTS_BIN` para apontar para um binário auxiliar personalizado durante o desenvolvimento.
- `stability` para `eleven_v3` é validado como `0.0`, `0.5` ou `1.0`; outros modelos aceitam `0..1`.
- `latency_tier` é validado como `0..4` quando definido.
- O Android é compatível com os formatos de saída `pcm_16000`, `pcm_22050`, `pcm_24000` e `pcm_44100` para streaming AudioTrack de baixa latência.

## Relacionado

- [Ativação por voz](/pt-BR/nodes/voicewake)
- [Áudio e notas de voz](/pt-BR/nodes/audio)
- [Compreensão de mídia](/pt-BR/nodes/media-understanding)
