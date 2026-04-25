---
read_when:
    - Você quer fazer uma chamada de voz de saída a partir do OpenClaw
    - Você está configurando ou desenvolvendo o Plugin voice-call
summary: 'Plugin Voice Call: chamadas de saída + entrada via Twilio/Telnyx/Plivo (instalação do Plugin + configuração + CLI)'
title: Plugin Voice Call
x-i18n:
    generated_at: "2026-04-25T13:53:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb396c6e346590b742c4d0f0e4f9653982da78fc40b9650760ed10d6fcd5710c
    source_path: plugins/voice-call.md
    workflow: 15
---

Chamadas de voz para OpenClaw via um Plugin. Compatível com chamadas de saída e
conversas de várias interações com políticas de entrada.

Providers atuais:

- `twilio` (Programmable Voice + Media Streams)
- `telnyx` (Call Control v2)
- `plivo` (Voice API + transferência XML + fala GetInput)
- `mock` (desenvolvimento/sem rede)

Modelo mental rápido:

- Instale o Plugin
- Reinicie o Gateway
- Configure em `plugins.entries.voice-call.config`
- Use `openclaw voicecall ...` ou a ferramenta `voice_call`

## Onde ele é executado (local vs remoto)

O Plugin Voice Call é executado **dentro do processo do Gateway**.

Se você usar um Gateway remoto, instale/configure o Plugin na **máquina que executa o Gateway** e, depois, reinicie o Gateway para carregá-lo.

## Instalação

### Opção A: instalar a partir do npm (recomendado)

```bash
openclaw plugins install @openclaw/voice-call
```

Reinicie o Gateway em seguida.

### Opção B: instalar a partir de uma pasta local (desenvolvimento, sem cópia)

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

Reinicie o Gateway em seguida.

## Configuração

Defina a configuração em `plugins.entries.voice-call.config`:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // ou "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // ou TWILIO_FROM_NUMBER para Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Chave pública do Webhook Telnyx do portal Telnyx Mission Control
            // (string Base64; também pode ser definida via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor de Webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Segurança de Webhook (recomendado para túneis/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposição pública (escolha uma)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // opcional; primeiro provider de transcrição em tempo real registrado quando não definido
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // opcional se OPENAI_API_KEY estiver definido
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

          realtime: {
            enabled: false,
            provider: "google", // opcional; primeiro provider de voz em tempo real registrado quando não definido
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Verifique a configuração antes de testar com um provider real:

```bash
openclaw voicecall setup
```

A saída padrão é legível em logs de chat e sessões de terminal. Ela verifica
se o Plugin está ativado, se o provider e as credenciais estão presentes, se a exposição de Webhook
está configurada e se apenas um modo de áudio está ativo. Use
`openclaw voicecall setup --json` para scripts.

Para Twilio, Telnyx e Plivo, a configuração deve resolver para uma URL pública de Webhook. Se a
`publicUrl` configurada, a URL do túnel, a URL do Tailscale ou o fallback de serve resolverem para
loopback ou espaço de rede privada, a configuração falha em vez de iniciar um provider
que não consegue receber Webhooks reais da operadora.

Para um teste de fumaça sem surpresas, execute:

```bash
openclaw voicecall smoke
openclaw voicecall smoke --to "+15555550123"
```

O segundo comando ainda é um dry run. Adicione `--yes` para fazer uma chamada curta
de notificação de saída:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

Observações:

- Twilio/Telnyx exigem uma URL pública de Webhook **acessível publicamente**.
- Plivo exige uma URL pública de Webhook **acessível publicamente**.
- `mock` é um provider local de desenvolvimento (sem chamadas de rede).
- Se configurações antigas ainda usarem `provider: "log"`, `twilio.from` ou chaves legadas `streaming.*` da OpenAI, execute `openclaw doctor --fix` para reescrevê-las.
- Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), a menos que `skipSignatureVerification` seja true.
- `skipSignatureVerification` é apenas para testes locais.
- Se você usa a camada gratuita do ngrok, defina `publicUrl` para a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local do ngrok). Use apenas para desenvolvimento local.
- URLs da camada gratuita do ngrok podem mudar ou adicionar comportamento intermediário; se `publicUrl` mudar, as assinaturas do Twilio falharão. Para produção, prefira um domínio estável ou Tailscale funnel.
- `realtime.enabled` inicia conversas completas de voz para voz; não o ative junto com `streaming.enabled`.
- Padrões de segurança de streaming:
  - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
- `streaming.maxPendingConnections` limita o total de sockets pré-início não autenticados.
- `streaming.maxPendingConnectionsPerIp` limita sockets pré-início não autenticados por IP de origem.
- `streaming.maxConnections` limita o total de sockets abertos de fluxo de mídia (pendentes + ativos).
- O fallback em runtime ainda aceita essas chaves antigas de voice-call por enquanto, mas o caminho de reescrita é `openclaw doctor --fix` e o shim de compatibilidade é temporário.

## Conversas de voz em tempo real

`realtime` seleciona um provider de voz em tempo real full duplex para áudio de chamada ao vivo.
Ele é separado de `streaming`, que apenas encaminha áudio para providers de
transcrição em tempo real.

Comportamento atual em runtime:

- `realtime.enabled` é compatível com Twilio Media Streams.
- `realtime.enabled` não pode ser combinado com `streaming.enabled`.
- `realtime.provider` é opcional. Quando não definido, Voice Call usa o primeiro
  provider de voz em tempo real registrado.
- Providers de voz em tempo real incluídos incluem Google Gemini Live (`google`) e
  OpenAI (`openai`), registrados por seus Plugins de provider.
- A configuração bruta de propriedade do provider fica em `realtime.providers.<providerId>`.
- Voice Call expõe a ferramenta compartilhada de tempo real `openclaw_agent_consult` por
  padrão. O modelo em tempo real pode chamá-la quando o interlocutor pedir raciocínio mais profundo, informações atuais ou ferramentas normais do OpenClaw.
- `realtime.toolPolicy` controla a execução de consulta:
  - `safe-read-only`: expõe a ferramenta de consulta e limita o agente regular a
    `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e
    `memory_get`.
  - `owner`: expõe a ferramenta de consulta e deixa o agente regular usar a política normal de ferramentas do agente.
  - `none`: não expõe a ferramenta de consulta. Ferramentas personalizadas de `realtime.tools` ainda são repassadas ao provider de tempo real.
- Chaves de sessão de consulta reutilizam a sessão de voz existente quando disponível e,
  depois, fazem fallback para o número de telefone do chamador/destinatário, para que chamadas de consulta subsequentes mantenham o contexto durante a ligação.
- Se `realtime.provider` apontar para um provider não registrado, ou se nenhum provider
  de voz em tempo real estiver registrado, Voice Call registra um aviso e ignora
  a mídia em tempo real em vez de fazer o Plugin inteiro falhar.

Padrões de tempo real do Google Gemini Live:

- Chave de API: `realtime.providers.google.apiKey`, `GEMINI_API_KEY` ou
  `GOOGLE_GENERATIVE_AI_API_KEY`
- modelo: `gemini-2.5-flash-native-audio-preview-12-2025`
- voz: `Kore`

Exemplo:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          provider: "twilio",
          inboundPolicy: "allowlist",
          allowFrom: ["+15550005678"],
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                apiKey: "${GEMINI_API_KEY}",
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
              },
            },
          },
        },
      },
    },
  },
}
```

Use OpenAI em vez disso:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          realtime: {
            enabled: true,
            provider: "openai",
            providers: {
              openai: {
                apiKey: "${OPENAI_API_KEY}",
              },
            },
          },
        },
      },
    },
  },
}
```

Consulte [Provider Google](/pt-BR/providers/google) e [Provider OpenAI](/pt-BR/providers/openai)
para opções específicas de voz em tempo real por provider.

## Transcrição por streaming

`streaming` seleciona um provider de transcrição em tempo real para áudio de chamada ao vivo.

Comportamento atual em runtime:

- `streaming.provider` é opcional. Quando não definido, Voice Call usa o primeiro
  provider de transcrição em tempo real registrado.
- Providers de transcrição em tempo real incluídos incluem Deepgram (`deepgram`),
  ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI
  (`xai`), registrados por seus Plugins de provider.
- A configuração bruta de propriedade do provider fica em `streaming.providers.<providerId>`.
- Se `streaming.provider` apontar para um provider não registrado, ou se nenhum provider
  de transcrição em tempo real estiver registrado, Voice Call registra um aviso e
  ignora o streaming de mídia em vez de fazer o Plugin inteiro falhar.

Padrões de transcrição por streaming da OpenAI:

- Chave de API: `streaming.providers.openai.apiKey` ou `OPENAI_API_KEY`
- modelo: `gpt-4o-transcribe`
- `silenceDurationMs`: `800`
- `vadThreshold`: `0.5`

Padrões de transcrição por streaming da xAI:

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
                apiKey: "sk-...", // opcional se OPENAI_API_KEY estiver definido
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
                apiKey: "${XAI_API_KEY}", // opcional se XAI_API_KEY estiver definido
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
(por exemplo, chamadas em modo notify que nunca são concluídas). O padrão é `0`
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

Quando um proxy ou túnel fica à frente do Gateway, o Plugin reconstrói a
URL pública para verificação de assinatura. Essas opções controlam em quais
cabeçalhos encaminhados confiar.

`webhookSecurity.allowedHosts` cria uma allowlist de hosts a partir de cabeçalhos de encaminhamento.

`webhookSecurity.trustForwardingHeaders` confia em cabeçalhos encaminhados sem allowlist.

`webhookSecurity.trustedProxyIPs` só confia em cabeçalhos encaminhados quando o IP remoto da
request corresponde à lista.

A proteção contra replay de Webhook está ativada para Twilio e Plivo. Requests válidas de Webhook reproduzidas
são reconhecidas, mas ignoradas quanto a efeitos colaterais.

As interações de conversa do Twilio incluem um token por interação em callbacks `<Gather>`, para que
callbacks de fala obsoletos/reproduzidos não possam satisfazer uma interação de transcrição pendente mais recente.

Requests de Webhook não autenticadas são rejeitadas antes da leitura do corpo quando os
cabeçalhos de assinatura exigidos pelo provider estão ausentes.

O Webhook de voice-call usa o perfil compartilhado de corpo pré-autenticação (64 KB / 5 segundos)
mais um limite por IP de requests em voo antes da verificação de assinatura.

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

Voice Call usa a configuração central `messages.tts` para
streaming de fala em chamadas. Você pode substituí-la na configuração do Plugin com o
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

- Chaves legadas `tts.<provider>` dentro da configuração do Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são corrigidas por `openclaw doctor --fix`; a configuração confirmada deve usar `tts.providers.<provider>`.
- **A fala da Microsoft é ignorada para chamadas de voz** (o áudio de telefonia precisa de PCM; o transporte atual da Microsoft não expõe saída PCM de telefonia).
- O TTS central é usado quando o streaming de mídia do Twilio está ativado; caso contrário, as chamadas fazem fallback para vozes nativas do provider.
- Se um fluxo de mídia do Twilio já estiver ativo, Voice Call não faz fallback para `<Say>` do TwiML. Se o TTS de telefonia não estiver disponível nesse estado, a solicitação de reprodução falha em vez de misturar dois caminhos de reprodução.
- Quando o TTS de telefonia faz fallback para um provider secundário, Voice Call registra um aviso com a cadeia de providers (`from`, `to`, `attempts`) para depuração.
- Quando barge-in do Twilio ou encerramento de fluxo limpa a fila pendente de TTS, requests de reprodução enfileiradas são resolvidas em vez de deixar bloqueados chamadores que aguardam a conclusão da reprodução.

### Mais exemplos

Use apenas o TTS central (sem substituição):

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

Substitua para ElevenLabs apenas em chamadas (mantendo o padrão central em outros lugares):

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

Substitua apenas o modelo OpenAI para chamadas (exemplo de mesclagem profunda):

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

`inboundPolicy: "allowlist"` é uma triagem de ID de chamador de baixa garantia. O Plugin
normaliza o valor `From` fornecido pelo provider e o compara com `allowFrom`.
A verificação de Webhook autentica a entrega do provider e a integridade do payload, mas
não comprova propriedade do número do chamador PSTN/VoIP. Trate `allowFrom` como
filtragem de ID de chamador, não como identidade forte do chamador.

Respostas automáticas usam o sistema de agente. Ajuste com:

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### Contrato de saída falada

Para respostas automáticas, Voice Call acrescenta um contrato estrito de saída falada ao prompt de sistema:

- `{"spoken":"..."}`

Voice Call então extrai o texto de fala de forma defensiva:

- Ignora payloads marcados como conteúdo de reasoning/erro.
- Analisa JSON direto, JSON entre cercas ou chaves inline `"spoken"`.
- Faz fallback para texto simples e remove prováveis parágrafos iniciais de planejamento/meta.

Isso mantém a reprodução falada focada no texto voltado ao chamador e evita vazar texto de planejamento para o áudio.

### Comportamento de inicialização da conversa

Para chamadas `conversation` de saída, o tratamento da primeira mensagem é vinculado ao estado real da reprodução:

- Limpeza de fila por barge-in e resposta automática são suprimidas apenas enquanto a saudação inicial estiver sendo reproduzida ativamente.
- Se a reprodução inicial falhar, a chamada volta para `listening` e a mensagem inicial permanece enfileirada para nova tentativa.
- A reprodução inicial para streaming do Twilio começa na conexão do stream sem atraso extra.
- O barge-in interrompe a reprodução ativa e limpa entradas de TTS do Twilio enfileiradas, mas ainda não em reprodução. Entradas limpas são resolvidas como ignoradas, para que a lógica de resposta subsequente possa continuar sem esperar por áudio que nunca será reproduzido.
- Conversas de voz em tempo real usam a própria interação de abertura do fluxo em tempo real. Voice Call não publica uma atualização legada de TwiML `<Say>` para essa mensagem inicial, de modo que sessões de saída `<Connect><Stream>` permaneçam conectadas.

### Período de tolerância para desconexão de stream do Twilio

Quando um fluxo de mídia do Twilio é desconectado, Voice Call espera `2000ms` antes de encerrar automaticamente a chamada:

- Se o fluxo se reconectar durante essa janela, o encerramento automático será cancelado.
- Se nenhum fluxo for registrado novamente após o período de tolerância, a chamada será encerrada para evitar chamadas ativas travadas.

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias para call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # resume a latência de interação a partir dos logs
openclaw voicecall expose --mode funnel
```

`latency` lê `calls.jsonl` do caminho padrão de armazenamento do voice-call. Use
`--file <path>` para apontar para um log diferente e `--last <n>` para limitar a análise
aos últimos N registros (padrão 200). A saída inclui p50/p90/p99 para
latência de interação e tempos de espera em escuta.

## Ferramenta do agente

Nome da ferramenta: `voice_call`

Ações:

- `initiate_call` (message, to?, mode?)
- `continue_call` (callId, message)
- `speak_to_user` (callId, message)
- `send_dtmf` (callId, digits)
- `end_call` (callId)
- `get_status` (callId)

Este repo inclui um documento de Skill correspondente em `skills/voice-call/SKILL.md`.

## RPC do Gateway

- `voicecall.initiate` (`to?`, `message`, `mode?`)
- `voicecall.continue` (`callId`, `message`)
- `voicecall.speak` (`callId`, `message`)
- `voicecall.dtmf` (`callId`, `digits`)
- `voicecall.end` (`callId`)
- `voicecall.status` (`callId`)

## Relacionado

- [Text-to-speech](/pt-BR/tools/tts)
- [Modo Talk](/pt-BR/nodes/talk)
- [Voice wake](/pt-BR/nodes/voicewake)
