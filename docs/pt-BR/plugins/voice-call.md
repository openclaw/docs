---
read_when:
    - Você quer fazer uma chamada de voz de saída a partir do OpenClaw
    - Você está configurando ou desenvolvendo o plugin voice-call
    - Você precisa de voz em tempo real ou transcrição por streaming em telefonia
sidebarTitle: Voice call
summary: Faça chamadas de voz de saída e aceite chamadas de voz de entrada via Twilio, Telnyx ou Plivo, com voz em tempo real opcional e transcrição por streaming
title: Plugin de chamada de voz
x-i18n:
    generated_at: "2026-04-26T11:36:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 77b5e4b338b0c39c71accea7065af70fab695c8f34488ba0fbf7023f2f36f377
    source_path: plugins/voice-call.md
    workflow: 15
---

Chamadas de voz para o OpenClaw via plugin. Compatível com notificações de saída,
conversas de vários turnos, voz em tempo real full-duplex, transcrição por
streaming e chamadas de entrada com políticas de allowlist.

**Provedores atuais:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transferência XML + GetInput
speech), `mock` (dev/sem rede).

<Note>
O plugin Voice Call é executado **dentro do processo do Gateway**. Se você usa um
Gateway remoto, instale e configure o plugin na máquina que executa
o Gateway e depois reinicie o Gateway para carregar o plugin.
</Note>

## Início rápido

<Steps>
  <Step title="Instale o plugin">
    <Tabs>
      <Tab title="Do npm (recomendado)">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="De uma pasta local (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Reinicie o Gateway depois para que o plugin seja carregado.

  </Step>
  <Step title="Configure o provedor e o Webhook">
    Defina a configuração em `plugins.entries.voice-call.config` (consulte
    [Configuração](#configuration) abaixo para o formato completo). No mínimo:
    `provider`, credenciais do provedor, `fromNumber` e uma URL de
    Webhook acessível publicamente.
  </Step>
  <Step title="Verifique a configuração">
    ```bash
    openclaw voicecall setup
    ```

    A saída padrão é legível em logs de chat e terminais. Ela verifica
    ativação do plugin, credenciais do provedor, exposição do Webhook e que
    apenas um modo de áudio (`streaming` ou `realtime`) está ativo. Use
    `--json` para scripts.

  </Step>
  <Step title="Teste smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambos são dry runs por padrão. Adicione `--yes` para realmente fazer uma
    chamada curta de notificação de saída:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx e Plivo, a configuração deve resolver para uma **URL pública de Webhook**.
Se `publicUrl`, a URL do túnel, a URL do Tailscale ou o fallback de serve
resolverem para loopback ou espaço de rede privada, a configuração falha em vez de
iniciar um provedor que não consegue receber Webhooks da operadora.
</Warning>

## Configuração

Se `enabled: true`, mas o provedor selecionado estiver sem credenciais,
a inicialização do Gateway registra um aviso de configuração incompleta com as chaves ausentes e
ignora a inicialização do runtime. Comandos, chamadas RPC e ferramentas do agente ainda
retornam a configuração exata ausente do provedor quando usados.

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
            // Chave pública de Webhook do Telnyx no Mission Control Portal
            // (Base64; também pode ser definida via TELNYX_PUBLIC_KEY).
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

          // Segurança do Webhook (recomendado para túneis/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposição pública (escolha uma)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* consulte Transcrição por streaming */ },
          realtime: { enabled: false /* consulte Voz em tempo real */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Observações sobre exposição e segurança do provedor">
    - Twilio, Telnyx e Plivo exigem uma URL de Webhook **acessível publicamente**.
    - `mock` é um provedor local para dev (sem chamadas de rede).
    - Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`) a menos que `skipSignatureVerification` seja true.
    - `skipSignatureVerification` é apenas para testes locais.
    - No plano gratuito do ngrok, defina `publicUrl` como a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks do Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local do ngrok). Apenas dev local.
    - URLs do plano gratuito do ngrok podem mudar ou adicionar comportamento de intersticial; se `publicUrl` variar, as assinaturas do Twilio falham. Em produção: prefira um domínio estável ou um Tailscale funnel.
  </Accordion>
  <Accordion title="Limites de conexão de streaming">
    - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
    - `streaming.maxPendingConnections` limita o total de sockets pré-início não autenticados.
    - `streaming.maxPendingConnectionsPerIp` limita sockets pré-início não autenticados por IP de origem.
    - `streaming.maxConnections` limita o total de sockets de fluxo de mídia abertos (pendentes + ativos).
  </Accordion>
  <Accordion title="Migrações de configuração legadas">
    Configurações antigas usando `provider: "log"`, `twilio.from` ou chaves legadas
    `streaming.*` do OpenAI são reescritas por `openclaw doctor --fix`.
    O fallback de runtime ainda aceita as antigas chaves de voice-call por enquanto, mas
    o caminho de reescrita é `openclaw doctor --fix` e o shim de compatibilidade é
    temporário.

    Chaves de streaming migradas automaticamente:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Conversas de voz em tempo real

`realtime` seleciona um provedor de voz em tempo real full-duplex para áudio
de chamada ao vivo. Ele é separado de `streaming`, que apenas encaminha áudio para
provedores de transcrição em tempo real.

<Warning>
`realtime.enabled` não pode ser combinado com `streaming.enabled`. Escolha um
modo de áudio por chamada.
</Warning>

Comportamento atual do runtime:

- `realtime.enabled` é compatível com Twilio Media Streams.
- `realtime.provider` é opcional. Se não estiver definido, Voice Call usa o primeiro provedor de voz em tempo real registrado.
- Provedores de voz em tempo real empacotados: Google Gemini Live (`google`) e OpenAI (`openai`), registrados por seus plugins de provedor.
- A configuração bruta pertencente ao provedor fica em `realtime.providers.<providerId>`.
- Voice Call expõe por padrão a ferramenta compartilhada em tempo real `openclaw_agent_consult`. O modelo em tempo real pode chamá-la quando o interlocutor pedir raciocínio mais profundo, informações atuais ou ferramentas normais do OpenClaw.
- Se `realtime.provider` apontar para um provedor não registrado, ou se nenhum provedor de voz em tempo real estiver registrado, Voice Call registra um aviso e ignora a mídia em tempo real em vez de falhar o plugin inteiro.
- Chaves de sessão de consulta reutilizam a sessão de voz existente quando disponível e, em seguida, usam fallback para o número de telefone do chamador/destinatário, de modo que chamadas de consulta de acompanhamento mantenham o contexto durante a chamada.

### Política de ferramenta

`realtime.toolPolicy` controla a execução de consulta:

| Política         | Comportamento                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expõe a ferramenta de consulta e limita o agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`. |
| `owner`          | Expõe a ferramenta de consulta e permite que o agente normal use a política normal de ferramentas do agente.                               |
| `none`           | Não expõe a ferramenta de consulta. Ferramentas personalizadas `realtime.tools` ainda são repassadas ao provedor em tempo real.            |

### Exemplos de provedores em tempo real

<Tabs>
  <Tab title="Google Gemini Live">
    Padrões: chave de API de `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` ou `GOOGLE_GENERATIVE_AI_API_KEY`; modelo
    `gemini-2.5-flash-native-audio-preview-12-2025`; voz `Kore`.

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

  </Tab>
  <Tab title="OpenAI">
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
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Consulte [Provedor Google](/pt-BR/providers/google) e
[Provedor OpenAI](/pt-BR/providers/openai) para opções de voz em tempo real
específicas do provedor.

## Transcrição por streaming

`streaming` seleciona um provedor de transcrição em tempo real para áudio de chamada ao vivo.

Comportamento atual do runtime:

- `streaming.provider` é opcional. Se não estiver definido, Voice Call usa o primeiro provedor de transcrição em tempo real registrado.
- Provedores de transcrição em tempo real empacotados: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrados por seus plugins de provedor.
- A configuração bruta pertencente ao provedor fica em `streaming.providers.<providerId>`.
- Se `streaming.provider` apontar para um provedor não registrado, ou se nenhum estiver registrado, Voice Call registra um aviso e ignora o streaming de mídia em vez de falhar o plugin inteiro.

### Exemplos de provedores de streaming

<Tabs>
  <Tab title="OpenAI">
    Padrões: chave de API `streaming.providers.openai.apiKey` ou
    `OPENAI_API_KEY`; modelo `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

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

  </Tab>
  <Tab title="xAI">
    Padrões: chave de API `streaming.providers.xai.apiKey` ou `XAI_API_KEY`;
    endpoint `wss://api.x.ai/v1/stt`; codificação `mulaw`; taxa de amostragem `8000`;
    `endpointingMs: 800`; `interimResults: true`.

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

  </Tab>
</Tabs>

## TTS para chamadas

Voice Call usa a configuração central `messages.tts` para fala por
streaming em chamadas. Você pode substituí-la na configuração do plugin com o
**mesmo formato** — ela é mesclada em profundidade com `messages.tts`.

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

<Warning>
**Microsoft speech é ignorado para chamadas de voz.** O áudio de telefonia precisa de PCM;
o transporte atual da Microsoft não expõe saída PCM para telefonia.
</Warning>

Observações sobre o comportamento:

- Chaves legadas `tts.<provider>` dentro da configuração do plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são reparadas por `openclaw doctor --fix`; a configuração confirmada deve usar `tts.providers.<provider>`.
- O TTS central é usado quando o streaming de mídia do Twilio está ativado; caso contrário, as chamadas usam fallback para vozes nativas do provedor.
- Se um fluxo de mídia do Twilio já estiver ativo, Voice Call não usa fallback para TwiML `<Say>`. Se o TTS de telefonia não estiver disponível nesse estado, a solicitação de reprodução falha em vez de misturar dois caminhos de reprodução.
- Quando o TTS de telefonia usa fallback para um provedor secundário, Voice Call registra um aviso com a cadeia de provedores (`from`, `to`, `attempts`) para depuração.
- Quando interrupção do Twilio ou encerramento de stream limpa a fila pendente de TTS, solicitações de reprodução enfileiradas são concluídas em vez de deixar chamadores aguardando indefinidamente pela conclusão da reprodução.

### Exemplos de TTS

<Tabs>
  <Tab title="Somente TTS central">
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
  </Tab>
  <Tab title="Substituir para ElevenLabs (somente chamadas)">
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
  </Tab>
  <Tab title="Substituição de modelo OpenAI (deep-merge)">
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
  </Tab>
</Tabs>

## Chamadas de entrada

A política de entrada usa `disabled` por padrão. Para ativar chamadas de entrada, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` é uma triagem de ID de chamada com baixa garantia. O
plugin normaliza o valor `From` fornecido pelo provedor e o compara com
`allowFrom`. A verificação do Webhook autentica a entrega do provedor e a integridade
da carga, mas **não** prova a propriedade do número do chamador em PSTN/VoIP. Trate
`allowFrom` como filtragem de ID de chamada, não como identidade forte
do chamador.
</Warning>

Respostas automáticas usam o sistema de agente. Ajuste com `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Contrato de saída falada

Para respostas automáticas, Voice Call anexa um contrato estrito de saída falada ao
prompt de sistema:

```text
{"spoken":"..."}
```

Voice Call extrai o texto falado de forma defensiva:

- Ignora cargas marcadas como conteúdo de raciocínio/erro.
- Analisa JSON direto, JSON em bloco com cercas ou chaves `"spoken"` inline.
- Usa fallback para texto simples e remove parágrafos iniciais que provavelmente sejam de planejamento/metadados.

Isso mantém a reprodução falada focada no texto voltado ao chamador e evita
vazar texto de planejamento para o áudio.

### Comportamento de início de conversa

Para chamadas de saída `conversation`, o tratamento da primeira mensagem está vinculado ao estado
de reprodução ao vivo:

- Limpeza de fila por interrupção e resposta automática são suprimidas somente enquanto a saudação inicial estiver sendo falada ativamente.
- Se a reprodução inicial falhar, a chamada volta para `listening` e a mensagem inicial permanece enfileirada para nova tentativa.
- A reprodução inicial para streaming do Twilio começa na conexão do stream sem atraso extra.
- A interrupção aborta a reprodução ativa e limpa entradas de TTS do Twilio enfileiradas, mas ainda não em reprodução. Entradas limpas são resolvidas como ignoradas, para que a lógica de resposta seguinte possa continuar sem esperar por áudio que nunca será reproduzido.
- Conversas de voz em tempo real usam o próprio turno de abertura do stream em tempo real. Voice Call **não** publica uma atualização TwiML `<Say>` legada para essa mensagem inicial, para que sessões de saída `<Connect><Stream>` permaneçam conectadas.

### Período de tolerância para desconexão de stream do Twilio

Quando um fluxo de mídia do Twilio é desconectado, Voice Call espera **2000 ms** antes de
encerrar automaticamente a chamada:

- Se o stream se reconectar durante essa janela, o encerramento automático é cancelado.
- Se nenhum stream for registrado novamente após o período de tolerância, a chamada é encerrada para evitar chamadas ativas presas.

## Reaper de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um Webhook
terminal (por exemplo, chamadas no modo notify que nunca se concluem). O padrão
é `0` (desativado).

Faixas recomendadas:

- **Produção:** `120`–`300` segundos para fluxos no estilo notify.
- Mantenha esse valor **maior que `maxDurationSeconds`** para que chamadas normais possam terminar. Um bom ponto de partida é `maxDurationSeconds + 30–60` segundos.

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

## Segurança do Webhook

Quando um proxy ou túnel fica na frente do Gateway, o plugin
reconstrói a URL pública para verificação de assinatura. Essas opções
controlam em quais cabeçalhos encaminhados confiar:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts em allowlist de cabeçalhos de encaminhamento.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confiar em cabeçalhos encaminhados sem uma allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confiar em cabeçalhos encaminhados somente quando o IP remoto da solicitação corresponder à lista.
</ParamField>

Proteções adicionais:

- A **proteção contra replay** de Webhook está ativada para Twilio e Plivo. Solicitações de Webhook válidas reproduzidas são reconhecidas, mas ignoradas quanto a efeitos colaterais.
- Turnos de conversa do Twilio incluem um token por turno em callbacks `<Gather>`, para que callbacks de fala obsoletos/reproduzidos não possam satisfazer um turno de transcrição pendente mais novo.
- Solicitações de Webhook não autenticadas são rejeitadas antes da leitura do corpo quando os cabeçalhos de assinatura obrigatórios do provedor estão ausentes.
- O Webhook de voice-call usa o perfil compartilhado de corpo pré-autenticação (64 KB / 5 segundos) mais um limite por IP de solicitações em andamento antes da verificação de assinatura.

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
openclaw voicecall latency                      # resume a latência por turno a partir dos logs
openclaw voicecall expose --mode funnel
```

`latency` lê `calls.jsonl` do caminho padrão de armazenamento de voice-call.
Use `--file <path>` para apontar para um log diferente e `--last <n>` para limitar
a análise aos últimos N registros (padrão 200). A saída inclui p50/p90/p99
para latência por turno e tempos de espera de escuta.

## Ferramenta do agente

Nome da ferramenta: `voice_call`.

| Ação            | Args                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Este repositório inclui um documento de Skill correspondente em `skills/voice-call/SKILL.md`.

## Gateway RPC

| Método               | Args                      |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Relacionados

- [Modo de conversa](/pt-BR/nodes/talk)
- [Text-to-speech](/pt-BR/tools/tts)
- [Ativação por voz](/pt-BR/nodes/voicewake)
