---
read_when:
    - Você quer fazer uma chamada de voz de saída a partir do OpenClaw
    - Você está configurando ou desenvolvendo o Plugin voice-call
summary: 'Plugin Voice Call: chamadas de saída + entrada via Twilio/Telnyx/Plivo (instalação do Plugin + configuração + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-24T06:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4cd57118133506c22604ab9592a823546a91795ab425de4b7a81edbbb8374e6d
    source_path: plugins/voice-call.md
    workflow: 15
---

# Voice Call (Plugin)

Chamadas de voz para o OpenClaw via Plugin. Compatível com chamadas de saída para notificações e
conversas de vários turnos com políticas de entrada.

Provedores atuais:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transferência XML + GetInput speech)
- `mock` (dev/sem rede)

Modelo mental rápido:

- Instalar o Plugin
- Reiniciar o Gateway
- Configurar em `plugins.entries.voice-call.config`
- Usar `openclaw voicecall ...` ou a ferramenta `voice_call`

## Onde ele é executado (local vs remoto)

O Plugin Voice Call é executado **dentro do processo do Gateway**.

Se você usa um Gateway remoto, instale/configure o Plugin na **máquina que executa o Gateway** e depois reinicie o Gateway para carregá-lo.

## Instalação

### Opção A: instalar pelo npm (recomendado)

```bash
openclaw plugins install @openclaw/voice-call
```

Reinicie o Gateway depois.

### Opção B: instalar de uma pasta local (dev, sem copiar)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicie o Gateway depois.

## Configuração

Defina a configuração em `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Telnyx Mission Control Portal
            // (Base64 string; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // optional; first registered realtime transcription provider when unset
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

Observações:

- Twilio/Telnyx exigem uma URL de Webhook **publicamente acessível**.
- Plivo exige uma URL de Webhook **publicamente acessível**.
- `mock` é um provedor local para desenvolvimento (sem chamadas de rede).
- Se configurações antigas ainda usarem `provider: "log"`, `twilio.from` ou chaves legadas `streaming.*` do OpenAI, execute `openclaw doctor --fix` para reescrevê-las.
- Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), a menos que `skipSignatureVerification` seja true.
- `skipSignatureVerification` é apenas para testes locais.
- Se você usar o plano gratuito do ngrok, defina `publicUrl` com a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks do Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` está em loopback (agente local do ngrok). Use apenas para desenvolvimento local.
- URLs do plano gratuito do ngrok podem mudar ou adicionar comportamento intermediário; se `publicUrl` divergir, as assinaturas do Twilio falharão. Para produção, prefira um domínio estável ou Tailscale funnel.
- Padrões de segurança de streaming:
  - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
- `streaming.maxPendingConnections` limita o total de sockets pré-início não autenticados.
- `streaming.maxPendingConnectionsPerIp` limita sockets pré-início não autenticados por IP de origem.
- `streaming.maxConnections` limita o total de sockets abertos de media stream (pendentes + ativos).
- O fallback de runtime ainda aceita essas chaves antigas de voice-call por enquanto, mas o caminho de reescrita é `openclaw doctor --fix` e o shim de compatibilidade é temporário.

## Transcrição por streaming

`streaming` seleciona um provedor de transcrição em tempo real para áudio de chamadas ao vivo.

Comportamento atual do runtime:

- `streaming.provider` é opcional. Se não for definido, o Voice Call usa o primeiro
  provedor de transcrição em tempo real registrado.
- Provedores integrados de transcrição em tempo real incluem Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI
  (`xai`), registrados por seus Plugins de provedor.
- A configuração bruta de cada provedor fica em `streaming.providers.<providerId>`.
- Se `streaming.provider` apontar para um provedor não registrado, ou se nenhum provedor de transcrição em tempo real estiver registrado, o Voice Call registra um aviso e
  ignora o streaming de mídia em vez de fazer o Plugin inteiro falhar.

Padrões da transcrição por streaming da OpenAI:

- Chave de API: `streaming.providers.openai.apiKey` ou `OPENAI_API_KEY`
- modelo: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Padrões da transcrição por streaming da xAI:

- Chave de API: `streaming.providers.xai.apiKey` ou `XAI_API_KEY`
- endpoint: `wss://api.x.ai/v1/stt`
- `encoding`: `mulaw`
- `sampleRate`: `8000`
- `endpointingMs`: `800`
- `interimResults`: `true`

Exemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

Use xAI em vez disso:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "xai",
            streamPath: "/voice/stream",
            providers: {
              xai: {
                apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
                endpointingMs: 800,
                language: "en",
              },
            },
          },
        },
      },
    },
  },
}
```

Chaves legadas ainda são migradas automaticamente por `openclaw doctor --fix`:

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## Reaper de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um Webhook terminal
(por exemplo, chamadas em modo notify que nunca se completam). O padrão é `0`
(desativado).

Faixas recomendadas:

- **Produção:** `120`–`300` segundos para fluxos no estilo notify.
- Mantenha esse valor **maior que `maxDurationSeconds`** para que chamadas normais possam
  terminar. Um bom ponto de partida é `maxDurationSeconds + 30–60` segundos.

Exemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Segurança de Webhook

Quando um proxy ou tunnel fica na frente do Gateway, o Plugin reconstrói a
URL pública para verificação de assinatura. Essas opções controlam em quais
cabeçalhos encaminhados confiar.

`webhookSecurity.allowedHosts` coloca hosts de cabeçalhos encaminhados em allowlist.

`webhookSecurity.trustForwardingHeaders` confia em cabeçalhos encaminhados sem uma allowlist.

`webhookSecurity.trustedProxyIPs` só confia em cabeçalhos encaminhados quando o IP
remoto da solicitação corresponde à lista.

A proteção contra replay de Webhook está ativada para Twilio e Plivo. Solicitações de Webhook válidas reproduzidas
são reconhecidas, mas ignoradas para efeitos colaterais.

Turnos de conversa do Twilio incluem um token por turno em callbacks `<Gather>`, então
callbacks de fala obsoletos/reproduzidos não podem satisfazer um turno de transcrição pendente mais novo.

Solicitações de Webhook não autenticadas são rejeitadas antes da leitura do corpo quando
os cabeçalhos de assinatura exigidos pelo provedor estão ausentes.

O Webhook de voice-call usa o perfil compartilhado de corpo de pré-autenticação (64 KB / 5 segundos)
mais um limite por IP de solicitações simultâneas antes da verificação de assinatura.

Exemplo com um host público estável:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## TTS para chamadas

O Voice Call usa a configuração central `messages.tts` para
fala por streaming em chamadas. Você pode sobrescrevê-la na configuração do Plugin com o
**mesmo formato** — ela é mesclada profundamente com `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

Observações:

- Chaves legadas `tts.<provider>` dentro da configuração do Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são migradas automaticamente para `tts.providers.<provider>` no carregamento. Prefira o formato `providers` na configuração versionada.
- **Microsoft speech é ignorado para chamadas de voz** (o áudio de telefonia precisa de PCM; o transporte atual da Microsoft não expõe saída PCM de telefonia).
- O TTS central é usado quando o streaming de mídia do Twilio está ativado; caso contrário, as chamadas recorrem a vozes nativas do provedor.
- Se um media stream do Twilio já estiver ativo, o Voice Call não recorre a `<Say>` do TwiML. Se TTS de telefonia não estiver disponível nesse estado, a solicitação de reprodução falha em vez de misturar dois caminhos de reprodução.
- Quando o TTS de telefonia recorre a um provedor secundário, o Voice Call registra um aviso com a cadeia de provedores (`from`, `to`, `attempts`) para depuração.

### Mais exemplos

Usar apenas o TTS central (sem sobrescrever):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

Sobrescrever para ElevenLabs apenas em chamadas (manter o padrão central em outros lugares):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

Sobrescrever apenas o modelo OpenAI para chamadas (exemplo de mesclagem profunda):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## Chamadas de entrada

A política de entrada usa `disabled` por padrão. Para ativar chamadas de entrada, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` é uma filtragem de ID de chamador de baixa garantia. O Plugin
normaliza o valor `From` fornecido pelo provedor e o compara com `allowFrom`.
A verificação do Webhook autentica a entrega do provedor e a integridade da carga, mas
não comprova a posse do número do chamador em PSTN/VoIP. Trate `allowFrom` como
filtragem de ID de chamador, não como identidade forte do chamador.

As respostas automáticas usam o sistema do agente. Ajuste com:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrato de saída falada

Para respostas automáticas, o Voice Call acrescenta um contrato estrito de saída falada ao prompt de sistema:

- `{"spoken":"..."}`

O Voice Call então extrai o texto de fala de forma defensiva:

- Ignora cargas marcadas como conteúdo de raciocínio/erro.
- Analisa JSON direto, JSON delimitado por cercas ou chaves `"spoken"` inline.
- Usa fallback para texto simples e remove parágrafos iniciais que provavelmente são planejamento/meta.

Isso mantém a reprodução falada focada no texto voltado ao chamador e evita o vazamento de texto de planejamento para o áudio.

### Comportamento de inicialização da conversa

Para chamadas de saída em modo `conversation`, o tratamento da primeira mensagem está vinculado ao estado de reprodução ao vivo:

- Limpeza de fila por barge-in e resposta automática são suprimidas apenas enquanto a saudação inicial está sendo falada ativamente.
- Se a reprodução inicial falhar, a chamada volta para `listening` e a mensagem inicial permanece na fila para nova tentativa.
- A reprodução inicial para streaming do Twilio começa na conexão do stream sem atraso extra.

### Período de tolerância para desconexão de stream no Twilio

Quando um media stream do Twilio é desconectado, o Voice Call aguarda `2000ms` antes de encerrar automaticamente a chamada:

- Se o stream se reconectar dentro dessa janela, o encerramento automático é cancelado.
- Se nenhum stream for registrado novamente após o período de tolerância, a chamada será encerrada para evitar chamadas ativas presas.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

`latency` lê `calls.jsonl` do caminho padrão de armazenamento do voice-call. Use
`--file <path>` para apontar para um log diferente e `--last <n>` para limitar a análise
aos últimos N registros (padrão 200). A saída inclui p50/p90/p99 para
latência de turno e tempos de espera em listening.

## Ferramenta do agente

Nome da ferramenta: `voice_call`

Ações:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Este repositório inclui uma documentação de skill correspondente em `skills/voice-call/SKILL.md`.

## RPC do Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Relacionado

- [Text-to-speech](/pt-BR/tools/tts)
- [Modo de conversa](/pt-BR/nodes/talk)
- [Ativação por voz](/pt-BR/nodes/voicewake)
