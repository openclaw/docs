---
read_when:
    - Você quer fazer uma chamada de voz de saída pelo OpenClaw
    - Você está configurando ou desenvolvendo o Plugin de chamada de voz
    - Você precisa de voz em tempo real ou transcrição por streaming em telefonia
sidebarTitle: Voice call
summary: Faça chamadas de voz de saída e aceite chamadas de voz de entrada via Twilio, Telnyx ou Plivo, com voz em tempo real e transcrição por streaming opcionais.
title: Plugin de chamada de voz
x-i18n:
    generated_at: "2026-05-01T05:58:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec854553cbba692ac9b3e929b107937332949c62aabe7192cdc9dcaa5537d74
    source_path: plugins/voice-call.md
    workflow: 16
---

Chamadas de voz para o OpenClaw por meio de um Plugin. Compatível com notificações de saída,
conversas de vários turnos, voz realtime full-duplex, transcrição em streaming
e chamadas de entrada com políticas de allowlist.

**Provedores atuais:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transferência XML + GetInput
speech), `mock` (desenvolvimento/sem rede).

<Note>
O Plugin Voice Call é executado **dentro do processo do Gateway**. Se você usa um
Gateway remoto, instale e configure o Plugin na máquina que executa
o Gateway e depois reinicie o Gateway para carregá-lo.
</Note>

## Início rápido

<Steps>
  <Step title="Instale o Plugin">
    <Tabs>
      <Tab title="Do npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="De uma pasta local (desenvolvimento)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Se o npm informar que o pacote pertencente ao OpenClaw está obsoleto, essa versão do pacote
    vem de uma linha de pacotes externos mais antiga; use uma build empacotada atual do OpenClaw
    ou o caminho da pasta local até que um pacote npm mais novo seja publicado.

    Reinicie o Gateway depois para que o Plugin seja carregado.

  </Step>
  <Step title="Configure o provedor e o Webhook">
    Defina a configuração em `plugins.entries.voice-call.config` (veja
    [Configuração](#configuration) abaixo para o formato completo). No mínimo:
    `provider`, credenciais do provedor, `fromNumber` e uma URL de Webhook acessível
    publicamente.
  </Step>
  <Step title="Verifique a configuração">
    ```bash
    openclaw voicecall setup
    ```

    A saída padrão é legível em logs de chat e terminais. Ela verifica
    a ativação do Plugin, as credenciais do provedor, a exposição do Webhook e se
    apenas um modo de áudio (`streaming` ou `realtime`) está ativo. Use
    `--json` para scripts.

  </Step>
  <Step title="Teste de fumaça">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambos são execuções de simulação por padrão. Adicione `--yes` para realmente fazer uma chamada curta
    de notificação de saída:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx e Plivo, a configuração precisa resolver para uma **URL pública de Webhook**.
Se `publicUrl`, a URL do túnel, a URL do Tailscale ou o fallback de serviço
resolver para loopback ou espaço de rede privada, a configuração falha em vez de
iniciar um provedor que não pode receber webhooks da operadora.
</Warning>

## Configuração

Se `enabled: true`, mas o provedor selecionado não tiver credenciais,
a inicialização do Gateway registra um aviso de configuração incompleta com as chaves ausentes e
ignora a inicialização do runtime. Comandos, chamadas RPC e ferramentas do agente ainda
retornam a configuração exata ausente do provedor quando usados.

<Note>
As credenciais de chamada de voz aceitam SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` e `plugins.entries.voice-call.config.tts.providers.*.apiKey` são resolvidos pela superfície padrão de SecretRef; veja [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Note>

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
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Notas de exposição e segurança do provedor">
    - Twilio, Telnyx e Plivo exigem uma URL de Webhook **acessível publicamente**.
    - `mock` é um provedor de desenvolvimento local (sem chamadas de rede).
    - Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), a menos que `skipSignatureVerification` seja true.
    - `skipSignatureVerification` é apenas para testes locais.
    - No nível gratuito do ngrok, defina `publicUrl` como a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks da Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local do ngrok). Apenas desenvolvimento local.
    - URLs do nível gratuito do ngrok podem mudar ou adicionar comportamento intersticial; se `publicUrl` divergir, as assinaturas da Twilio falharão. Produção: prefira um domínio estável ou um funil do Tailscale.

  </Accordion>
  <Accordion title="Limites de conexão de streaming">
    - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
    - `streaming.maxPendingConnections` limita o total de sockets pré-início não autenticados.
    - `streaming.maxPendingConnectionsPerIp` limita os sockets pré-início não autenticados por IP de origem.
    - `streaming.maxConnections` limita o total de sockets de streaming de mídia abertos (pendentes + ativos).

  </Accordion>
  <Accordion title="Migrações de configuração legada">
    Configurações mais antigas que usam `provider: "log"`, `twilio.from` ou chaves OpenAI
    `streaming.*` legadas são reescritas por `openclaw doctor --fix`.
    O fallback de runtime ainda aceita as chaves antigas de chamada de voz por enquanto, mas
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

## Conversas de voz realtime

`realtime` seleciona um provedor de voz realtime full-duplex para áudio de chamada
ao vivo. Ele é separado de `streaming`, que apenas encaminha áudio para
provedores de transcrição realtime.

<Warning>
`realtime.enabled` não pode ser combinado com `streaming.enabled`. Escolha um
modo de áudio por chamada.
</Warning>

Comportamento atual do runtime:

- `realtime.enabled` é compatível com Twilio Media Streams.
- `realtime.provider` é opcional. Se não for definido, Voice Call usa o primeiro provedor de voz realtime registrado.
- Provedores de voz realtime incluídos: Google Gemini Live (`google`) e OpenAI (`openai`), registrados por seus Plugins de provedor.
- A configuração bruta pertencente ao provedor fica em `realtime.providers.<providerId>`.
- Voice Call expõe a ferramenta realtime compartilhada `openclaw_agent_consult` por padrão. O modelo realtime pode chamá-la quando o autor da chamada pedir raciocínio mais aprofundado, informações atuais ou ferramentas normais do OpenClaw.
- Se `realtime.provider` apontar para um provedor não registrado, ou se nenhum provedor de voz realtime estiver registrado, Voice Call registra um aviso e ignora a mídia realtime em vez de falhar todo o Plugin.
- As chaves de sessão de consulta reutilizam a sessão de voz existente quando disponível e, em seguida, fazem fallback para o número de telefone de quem chama/quem recebe, para que chamadas de consulta subsequentes mantenham o contexto durante a chamada.

### Política de ferramentas

`realtime.toolPolicy` controla a execução de consulta:

| Política         | Comportamento                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expõe a ferramenta de consulta e limita o agente regular a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`. |
| `owner`          | Expõe a ferramenta de consulta e permite que o agente regular use a política normal de ferramentas do agente.                            |
| `none`           | Não expõe a ferramenta de consulta. `realtime.tools` personalizadas ainda são repassadas para o provedor realtime.                       |

### Exemplos de provedores realtime

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

Veja [provedor Google](/pt-BR/providers/google) e
[provedor OpenAI](/pt-BR/providers/openai) para opções de voz realtime
específicas do provedor.

## Transcrição em streaming

`streaming` seleciona um provedor de transcrição realtime para áudio de chamada ao vivo.

Comportamento atual do runtime:

- `streaming.provider` é opcional. Se não for definido, Voice Call usa o primeiro provedor de transcrição realtime registrado.
- Provedores de transcrição realtime incluídos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrados por seus Plugins de provedor.
- A configuração bruta pertencente ao provedor fica em `streaming.providers.<providerId>`.
- Depois que a Twilio envia uma mensagem `start` de stream aceita, Voice Call registra o stream imediatamente, enfileira a mídia de entrada pelo provedor de transcrição enquanto o provedor se conecta e inicia a saudação inicial somente depois que a transcrição realtime estiver pronta.
- Se `streaming.provider` apontar para um provedor não registrado, ou se nenhum estiver registrado, Voice Call registra um aviso e ignora o streaming de mídia em vez de falhar todo o Plugin.

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

  </Tab>
</Tabs>

## TTS para chamadas

Voice Call usa a configuração principal `messages.tts` para transmissão
de fala em chamadas. Você pode substituí-la na configuração do Plugin com o
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

<Warning>
**A fala da Microsoft é ignorada para chamadas de voz.** O áudio de telefonia precisa de PCM;
o transporte atual da Microsoft não expõe saída PCM de telefonia.
</Warning>

Notas de comportamento:

- Chaves legadas `tts.<provider>` dentro da configuração do Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são reparadas por `openclaw doctor --fix`; a configuração com commit deve usar `tts.providers.<provider>`.
- O TTS principal é usado quando o streaming de mídia do Twilio está habilitado; caso contrário, as chamadas recorrem às vozes nativas do provedor.
- Se um stream de mídia do Twilio já estiver ativo, Voice Call não recorre ao TwiML `<Say>`. Se o TTS de telefonia estiver indisponível nesse estado, a solicitação de reprodução falha em vez de misturar dois caminhos de reprodução.
- Quando o TTS de telefonia recorre a um provedor secundário, Voice Call registra um aviso com a cadeia de provedores (`from`, `to`, `attempts`) para depuração.
- Quando a interrupção por fala do Twilio ou a desmontagem do stream limpa a fila de TTS pendente, as solicitações de reprodução enfileiradas são concluídas em vez de deixar chamadores aguardando a conclusão da reprodução indefinidamente.

### Exemplos de TTS

<Tabs>
  <Tab title="Somente TTS principal">
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
  <Tab title="Substituir por ElevenLabs (somente chamadas)">
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
  <Tab title="Substituição do modelo OpenAI (mesclagem profunda)">
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

## Chamadas recebidas

A política de recebimento usa `disabled` como padrão. Para habilitar chamadas recebidas, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` é uma triagem de ID de chamador de baixa garantia. O
Plugin normaliza o valor `From` fornecido pelo provedor e o compara com
`allowFrom`. A verificação de Webhook autentica a entrega do provedor e
a integridade do payload, mas **não** comprova a propriedade do número do chamador
PSTN/VoIP. Trate `allowFrom` como filtragem de ID de chamador, não como uma identidade
forte do chamador.
</Warning>

Respostas automáticas usam o sistema de agentes. Ajuste com `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Contrato de saída falada

Para respostas automáticas, Voice Call acrescenta um contrato rigoroso de saída falada ao
prompt do sistema:

```text
{"spoken":"..."}
```

Voice Call extrai texto de fala de forma defensiva:

- Ignora payloads marcados como conteúdo de raciocínio/erro.
- Analisa JSON direto, JSON cercado por cercas ou chaves `"spoken"` inline.
- Recorre a texto simples e remove prováveis parágrafos iniciais de planejamento/metadados.

Isso mantém a reprodução falada focada no texto voltado ao chamador e evita
vazar texto de planejamento para o áudio.

### Comportamento de início de conversa

Para chamadas `conversation` de saída, o tratamento da primeira mensagem é vinculado ao estado
de reprodução ao vivo:

- A limpeza da fila por interrupção de fala e a resposta automática são suprimidas apenas enquanto a saudação inicial está sendo falada ativamente.
- Se a reprodução inicial falhar, a chamada retorna para `listening` e a mensagem inicial permanece enfileirada para nova tentativa.
- A reprodução inicial para streaming do Twilio começa na conexão do stream, sem atraso extra.
- A interrupção por fala aborta a reprodução ativa e limpa entradas de TTS do Twilio enfileiradas, mas ainda não reproduzidas. As entradas limpas são resolvidas como ignoradas, para que a lógica de resposta subsequente possa continuar sem aguardar um áudio que nunca será reproduzido.
- Conversas de voz em tempo real usam o turno inicial do próprio stream em tempo real. Voice Call **não** publica uma atualização TwiML legada `<Say>` para essa mensagem inicial, então sessões de saída `<Connect><Stream>` permanecem anexadas.

### Período de carência para desconexão de stream do Twilio

Quando um stream de mídia do Twilio se desconecta, Voice Call espera **2000 ms** antes de
encerrar a chamada automaticamente:

- Se o stream se reconectar durante essa janela, o encerramento automático é cancelado.
- Se nenhum stream for registrado novamente após o período de carência, a chamada é encerrada para evitar chamadas ativas presas.

## Coletor de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um
Webhook terminal (por exemplo, chamadas em modo de notificação que nunca são concluídas). O padrão
é `0` (desabilitado).

Intervalos recomendados:

- **Produção:** `120`–`300` segundos para fluxos do tipo notificação.
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

## Segurança de Webhook

Quando um proxy ou túnel fica na frente do Gateway, o plugin
reconstrói a URL pública para verificação de assinatura. Estas opções
controlam quais cabeçalhos encaminhados são confiáveis:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts permitidos a partir de cabeçalhos de encaminhamento.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confia em cabeçalhos encaminhados sem uma lista de permissões.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confia em cabeçalhos encaminhados somente quando o IP remoto da solicitação corresponde à lista.
</ParamField>

Proteções adicionais:

- A **proteção contra repetição** de Webhook é habilitada para Twilio e Plivo. Solicitações de Webhook válidas repetidas são reconhecidas, mas ignoradas para efeitos colaterais.
- Turnos de conversa do Twilio incluem um token por turno em callbacks de `<Gather>`, para que callbacks de fala obsoletos/repetidos não possam satisfazer um turno de transcrição pendente mais recente.
- Solicitações de Webhook não autenticadas são rejeitadas antes da leitura do corpo quando os cabeçalhos de assinatura exigidos pelo provedor estão ausentes.
- O Webhook de voice-call usa o perfil de corpo compartilhado de pré-autenticação (64 KB / 5 segundos), além de um limite por IP de solicitações em andamento antes da verificação de assinatura.

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
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

Quando o Gateway já está em execução, comandos operacionais `voicecall` delegam
ao runtime de voice-call pertencente ao Gateway, para que a CLI não vincule um segundo
servidor de Webhook. Se nenhum Gateway estiver acessível, os comandos recorrem a um
runtime de CLI autônomo.

`latency` lê `calls.jsonl` do caminho padrão de armazenamento de voice-call.
Use `--file <path>` para apontar para um log diferente e `--last <n>` para limitar
a análise aos últimos N registros (padrão 200). A saída inclui p50/p90/p99
para latência de turno e tempos de espera por escuta.

## Ferramenta de agente

Nome da ferramenta: `voice_call`.

| Ação            | Argumentos                |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Este repositório inclui um documento de Skills correspondente em `skills/voice-call/SKILL.md`.

## RPC do Gateway

| Método              | Argumentos                |
| ------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Solução de problemas

### A configuração falha na exposição do Webhook

Execute a configuração no mesmo ambiente que executa o Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Para `twilio`, `telnyx` e `plivo`, `webhook-exposure` deve estar verde. Uma
`publicUrl` configurada ainda falha quando aponta para espaço de rede local ou privada,
porque a operadora não consegue fazer callback para esses endereços. Não use
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` como `publicUrl`.

Use um caminho de exposição público:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Depois de alterar a configuração, reinicie ou recarregue o Gateway e execute:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` é uma simulação, a menos que você passe `--yes`.

### Credenciais do provedor falham

Verifique o provedor selecionado e os campos de credenciais obrigatórios:

- Twilio: `twilio.accountSid`, `twilio.authToken` e `fromNumber`, ou
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` e
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` e `fromNumber`.

As credenciais devem existir no host do Gateway. Editar um perfil de shell local não
afeta um Gateway já em execução até que ele seja reiniciado ou recarregue seu
ambiente.

### As chamadas iniciam, mas os Webhooks do provedor não chegam

Confirme se o console do provedor aponta para a URL pública de Webhook exata:

```text
https://voice.example.com/voice/webhook
```

Depois inspecione o estado em tempo de execução:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
```

Causas comuns:

- `publicUrl` aponta para um caminho diferente de `serve.path`.
- A URL do túnel mudou depois que o Gateway iniciou.
- Um proxy encaminha a solicitação, mas remove ou reescreve os cabeçalhos de host/proto.
- Firewall ou DNS roteia o hostname público para algum lugar diferente do Gateway.
- O Gateway foi reiniciado sem o Plugin Voice Call habilitado.

Quando um proxy reverso ou túnel estiver na frente do Gateway, defina
`webhookSecurity.allowedHosts` como o hostname público, ou use
`webhookSecurity.trustedProxyIPs` para um endereço de proxy conhecido. Use
`webhookSecurity.trustForwardingHeaders` somente quando o limite do proxy estiver sob
seu controle.

### A verificação de assinatura falha

As assinaturas do provedor são verificadas em relação à URL pública que o OpenClaw reconstrói
a partir da solicitação recebida. Se as assinaturas falharem:

- Confirme se a URL de Webhook do provedor corresponde exatamente a `publicUrl`, incluindo
  esquema, host e caminho.
- Para URLs do nível gratuito do ngrok, atualize `publicUrl` quando o hostname do túnel mudar.
- Garanta que o proxy preserve os cabeçalhos de host e proto originais, ou configure
  `webhookSecurity.allowedHosts`.
- Não habilite `skipSignatureVerification` fora de testes locais.

### As entradas do Twilio no Google Meet falham

O Google Meet usa este Plugin para entradas por discagem do Twilio. Primeiro verifique o Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Depois verifique explicitamente o transporte do Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Se o Voice Call estiver verde, mas o participante do Meet nunca entrar, verifique o número
de discagem do Meet, o PIN e `--dtmf-sequence`. A chamada telefônica pode estar íntegra enquanto
a reunião rejeita ou ignora uma sequência DTMF incorreta.

### A chamada em tempo real não tem fala

Confirme que apenas um modo de áudio está habilitado. `realtime.enabled` e
`streaming.enabled` não podem ser ambos true.

Para chamadas Twilio em tempo real, verifique também:

- Um Plugin provedor em tempo real está carregado e registrado.
- `realtime.provider` está indefinido ou nomeia um provedor registrado.
- A chave de API do provedor está disponível para o processo do Gateway.
- `openclaw voicecall tail` mostra o stream de mídia aceito e a prontidão do
  provedor em tempo real antes da saudação inicial.

## Relacionados

- [Modo de conversa](/pt-BR/nodes/talk)
- [Texto para fala](/pt-BR/tools/tts)
- [Ativação por voz](/pt-BR/nodes/voicewake)
