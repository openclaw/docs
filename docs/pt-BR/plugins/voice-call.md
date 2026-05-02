---
read_when:
    - Você quer fazer uma chamada de voz de saída a partir do OpenClaw
    - Você está configurando ou desenvolvendo o Plugin de chamada de voz
    - Você precisa de voz em tempo real ou transcrição em fluxo contínuo em telefonia
sidebarTitle: Voice call
summary: Faça chamadas de voz de saída e receba chamadas de voz de entrada via Twilio, Telnyx ou Plivo, com voz em tempo real opcional e transcrição em streaming.
title: Plugin de chamada de voz
x-i18n:
    generated_at: "2026-05-02T05:54:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: cde64fa054743d4ed3f146042bd65532af0e9eb5b792b088a856889b3d2cb3c9
    source_path: plugins/voice-call.md
    workflow: 16
---

Chamadas de voz para OpenClaw por meio de um plugin. Compatível com notificações de saída,
conversas em vários turnos, voz em tempo real full-duplex, transcrição
em streaming e chamadas recebidas com políticas de lista de permissões.

**Provedores atuais:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/sem rede).

<Note>
O plugin Voice Call é executado **dentro do processo do Gateway**. Se você usa um
Gateway remoto, instale e configure o plugin na máquina que executa
o Gateway e, em seguida, reinicie o Gateway para carregá-lo.
</Note>

## Início rápido

<Steps>
  <Step title="Instale o plugin">
    <Tabs>
      <Tab title="Do npm">
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

    Se o npm informar que o pacote de propriedade da OpenClaw está obsoleto, essa versão do pacote
    vem de uma linha de pacotes externos mais antiga; use uma build empacotada atual do OpenClaw
    ou o caminho da pasta local até que um pacote npm mais novo seja publicado.

    Reinicie o Gateway depois disso para que o plugin seja carregado.

  </Step>
  <Step title="Configure o provedor e o Webhook">
    Defina a configuração em `plugins.entries.voice-call.config` (veja
    [Configuração](#configuration) abaixo para o formato completo). No mínimo:
    `provider`, credenciais do provedor, `fromNumber` e uma URL de Webhook
    publicamente acessível.
  </Step>
  <Step title="Verifique a configuração">
    ```bash
    openclaw voicecall setup
    ```

    A saída padrão é legível em logs de chat e terminais. Ela verifica
    a ativação do plugin, as credenciais do provedor, a exposição do Webhook e se
    apenas um modo de áudio (`streaming` ou `realtime`) está ativo. Use
    `--json` para scripts.

  </Step>
  <Step title="Teste smoke">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Ambos são simulações por padrão. Adicione `--yes` para realmente fazer uma chamada curta
    de notificação de saída:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx e Plivo, a configuração deve resolver para uma **URL pública de Webhook**.
Se `publicUrl`, a URL do túnel, a URL do Tailscale ou o fallback de serviço
resolver para loopback ou espaço de rede privada, a configuração falhará em vez de
iniciar um provedor que não pode receber Webhooks da operadora.
</Warning>

## Configuração

Se `enabled: true`, mas o provedor selecionado estiver sem credenciais,
a inicialização do Gateway registra um aviso de configuração incompleta com as chaves ausentes e
ignora a inicialização do runtime. Comandos, chamadas RPC e ferramentas de agente ainda
retornam a configuração exata ausente do provedor quando usados.

<Note>
As credenciais de chamada de voz aceitam SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` e `plugins.entries.voice-call.config.tts.providers.*.apiKey` são resolvidos pela superfície SecretRef padrão; veja [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
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
    - Twilio, Telnyx e Plivo exigem uma URL de Webhook **publicamente acessível**.
    - `mock` é um provedor de dev local (sem chamadas de rede).
    - Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), a menos que `skipSignatureVerification` seja true.
    - `skipSignatureVerification` é apenas para testes locais.
    - No nível gratuito do ngrok, defina `publicUrl` como a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks do Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local do ngrok). Apenas dev local.
    - URLs do nível gratuito do Ngrok podem mudar ou adicionar comportamento intersticial; se `publicUrl` divergir, as assinaturas do Twilio falham. Produção: prefira um domínio estável ou um funil do Tailscale.

  </Accordion>
  <Accordion title="Limites de conexão de streaming">
    - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
    - `streaming.maxPendingConnections` limita o total de sockets pré-start não autenticados.
    - `streaming.maxPendingConnectionsPerIp` limita sockets pré-start não autenticados por IP de origem.
    - `streaming.maxConnections` limita o total de sockets de stream de mídia abertos (pendentes + ativos).

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

## Conversas de voz em tempo real

`realtime` seleciona um provedor de voz em tempo real full-duplex para áudio de chamada
ao vivo. Ele é separado de `streaming`, que apenas encaminha áudio para
provedores de transcrição em tempo real.

<Warning>
`realtime.enabled` não pode ser combinado com `streaming.enabled`. Escolha um
modo de áudio por chamada.
</Warning>

Comportamento atual do runtime:

- `realtime.enabled` é compatível com Twilio Media Streams.
- `realtime.provider` é opcional. Se não definido, o Voice Call usa o primeiro provedor de voz em tempo real registrado.
- Provedores de voz em tempo real incluídos: Google Gemini Live (`google`) e OpenAI (`openai`), registrados por seus plugins de provedor.
- A configuração bruta de propriedade do provedor fica em `realtime.providers.<providerId>`.
- Voice Call expõe a ferramenta em tempo real compartilhada `openclaw_agent_consult` por padrão. O modelo em tempo real pode chamá-la quando o chamador pedir raciocínio mais profundo, informações atuais ou ferramentas normais do OpenClaw.
- `realtime.fastContext.enabled` vem desativado por padrão. Quando ativado, Voice Call primeiro pesquisa contexto indexado de memória/sessão para a pergunta de consulta e retorna esses trechos ao modelo em tempo real dentro de `realtime.fastContext.timeoutMs` antes de recorrer ao agente de consulta completo apenas se `realtime.fastContext.fallbackToConsult` for true.
- Se `realtime.provider` apontar para um provedor não registrado, ou se nenhum provedor de voz em tempo real estiver registrado, Voice Call registra um aviso e ignora mídia em tempo real em vez de falhar o plugin inteiro.
- As chaves da sessão de consulta reutilizam a sessão de voz existente quando disponível e depois recorrem ao número de telefone do chamador/destinatário para que chamadas de consulta de acompanhamento mantenham o contexto durante a chamada.

### Política de ferramentas

`realtime.toolPolicy` controla a execução da consulta:

| Política         | Comportamento                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expõe a ferramenta de consulta e limita o agente regular a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`. |
| `owner`          | Expõe a ferramenta de consulta e permite que o agente regular use a política normal de ferramentas do agente.                            |
| `none`           | Não expõe a ferramenta de consulta. `realtime.tools` personalizadas ainda são repassadas ao provedor em tempo real.                      |

### Exemplos de provedor em tempo real

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

Veja [Provedor Google](/pt-BR/providers/google) e
[Provedor OpenAI](/pt-BR/providers/openai) para opções de voz em tempo real
específicas do provedor.

## Transcrição em streaming

`streaming` seleciona um provedor de transcrição em tempo real para áudio de chamada ao vivo.

Comportamento atual do runtime:

- `streaming.provider` é opcional. Se não definido, Voice Call usa o primeiro provedor registrado de transcrição em tempo real.
- Provedores de transcrição em tempo real incluídos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrados por seus plugins de provedor.
- A configuração bruta de propriedade do provedor fica em `streaming.providers.<providerId>`.
- Depois que o Twilio envia uma mensagem `start` de stream aceita, Voice Call registra o stream imediatamente, enfileira mídia de entrada pelo provedor de transcrição enquanto o provedor se conecta e inicia a saudação inicial somente depois que a transcrição em tempo real estiver pronta.
- Se `streaming.provider` apontar para um provedor não registrado, ou se nenhum estiver registrado, Voice Call registra um aviso e ignora o streaming de mídia em vez de fazer o plugin inteiro falhar.

### Exemplos de provedor de streaming

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

Voice Call usa a configuração central `messages.tts` para fala em streaming
nas chamadas. Você pode substituí-la na configuração do plugin com o
**mesmo formato** — ela faz merge profundo com `messages.tts`.

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
**Microsoft speech é ignorado para chamadas de voz.** Áudio de telefonia precisa de PCM;
o transporte atual da Microsoft não expõe saída PCM de telefonia.
</Warning>

Observações de comportamento:

- Chaves legadas `tts.<provider>` dentro da configuração do plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são reparadas por `openclaw doctor --fix`; a configuração com commit deve usar `tts.providers.<provider>`.
- O TTS central é usado quando o streaming de mídia do Twilio está habilitado; caso contrário, as chamadas retornam para vozes nativas do provedor.
- Se um stream de mídia do Twilio já estiver ativo, Voice Call não faz fallback para TwiML `<Say>`. Se o TTS de telefonia não estiver disponível nesse estado, a solicitação de reprodução falha em vez de misturar dois caminhos de reprodução.
- Quando o TTS de telefonia faz fallback para um provedor secundário, Voice Call registra um aviso com a cadeia de provedores (`from`, `to`, `attempts`) para depuração.
- Quando barge-in do Twilio ou desmontagem de stream limpa a fila pendente de TTS, as solicitações de reprodução enfileiradas são resolvidas em vez de deixar chamadores aguardando a conclusão da reprodução.

### Exemplos de TTS

<Tabs>
  <Tab title="Core TTS only">
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
  <Tab title="Override to ElevenLabs (calls only)">
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
  <Tab title="OpenAI model override (deep-merge)">
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

A política de entrada tem como padrão `disabled`. Para habilitar chamadas de entrada, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` é uma triagem de ID do chamador de baixa garantia. O
plugin normaliza o valor `From` fornecido pelo provedor e o compara com
`allowFrom`. A verificação de Webhook autentica a entrega pelo provedor e
a integridade do payload, mas **não** comprova a titularidade do número do
chamador PSTN/VoIP. Trate `allowFrom` como filtragem por ID do chamador, não como
identidade forte do chamador.
</Warning>

Respostas automáticas usam o sistema de agentes. Ajuste com `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Contrato de saída falada

Para respostas automáticas, Voice Call acrescenta um contrato estrito de saída falada ao
prompt do sistema:

```text
{"spoken":"..."}
```

Voice Call extrai texto de fala defensivamente:

- Ignora payloads marcados como conteúdo de raciocínio/erro.
- Analisa JSON direto, JSON em bloco cercado ou chaves `"spoken"` inline.
- Faz fallback para texto simples e remove prováveis parágrafos iniciais de planejamento/metadados.

Isso mantém a reprodução falada focada no texto voltado ao chamador e evita
vazar texto de planejamento para o áudio.

### Comportamento de início da conversa

Para chamadas `conversation` de saída, o tratamento da primeira mensagem é vinculado ao estado de
reprodução ao vivo:

- A limpeza da fila por barge-in e a resposta automática são suprimidas somente enquanto a saudação inicial está sendo falada ativamente.
- Se a reprodução inicial falhar, a chamada retorna para `listening` e a mensagem inicial permanece enfileirada para nova tentativa.
- A reprodução inicial para streaming do Twilio começa na conexão do stream, sem atraso extra.
- Barge-in aborta a reprodução ativa e limpa entradas de TTS do Twilio enfileiradas, mas ainda não reproduzidas. Entradas limpas são resolvidas como ignoradas, para que a lógica de resposta subsequente possa continuar sem esperar por áudio que nunca será reproduzido.
- Conversas de voz em tempo real usam o próprio turno de abertura do stream em tempo real. Voice Call **não** publica uma atualização TwiML `<Say>` legada para essa mensagem inicial, então sessões `<Connect><Stream>` de saída permanecem anexadas.

### Período de tolerância de desconexão do stream Twilio

Quando um stream de mídia do Twilio desconecta, Voice Call aguarda **2000 ms** antes de
encerrar a chamada automaticamente:

- Se o stream reconectar durante essa janela, o encerramento automático é cancelado.
- Se nenhum stream for registrado novamente após o período de tolerância, a chamada é encerrada para evitar chamadas ativas presas.

## Limpador de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um
webhook terminal (por exemplo, chamadas em modo de notificação que nunca são concluídas). O padrão
é `0` (desabilitado).

Faixas recomendadas:

- **Produção:** `120`–`300` segundos para fluxos no estilo notificação.
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

- A **proteção contra repetição** de Webhook está habilitada para Twilio e Plivo. Solicitações válidas de webhook repetidas são reconhecidas, mas ignoradas para efeitos colaterais.
- Turnos de conversa do Twilio incluem um token por turno em callbacks `<Gather>`, para que callbacks de fala obsoletos/repetidos não possam satisfazer um turno de transcrição pendente mais recente.
- Solicitações de webhook não autenticadas são rejeitadas antes da leitura do corpo quando os cabeçalhos de assinatura exigidos pelo provedor estão ausentes.
- O webhook voice-call usa o perfil de corpo pré-autenticação compartilhado (64 KB / 5 segundos), além de um limite de solicitações em andamento por IP antes da verificação de assinatura.

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
para o runtime voice-call de propriedade do Gateway, para que a CLI não vincule um segundo
servidor de webhook. Se nenhum Gateway estiver acessível, os comandos fazem fallback para um
runtime de CLI autônomo.

`latency` lê `calls.jsonl` do caminho padrão de armazenamento de voice-call.
Use `--file <path>` para apontar para um log diferente e `--last <n>` para limitar
a análise aos últimos N registros (padrão 200). A saída inclui p50/p90/p99
para latência de turno e tempos de espera de escuta.

## Ferramenta de agente

Nome da ferramenta: `voice_call`.

| Ação            | Args                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Este repo inclui uma documentação de skill correspondente em `skills/voice-call/SKILL.md`.

## RPC do Gateway

| Método              | Args                                       |
| ------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` é válido somente com `mode: "conversation"`. Chamadas em modo de notificação
devem usar `voicecall.dtmf` depois que a chamada existir, se precisarem de
dígitos pós-conexão.

## Solução de problemas

### Falha na exposição de webhook do setup

Execute a configuração no mesmo ambiente que executa o Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Para `twilio`, `telnyx` e `plivo`, `webhook-exposure` deve estar verde. Um
`publicUrl` configurado ainda falha quando aponta para espaço de rede local ou
privada, porque a operadora não consegue chamar de volta esses endereços. Não use
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` ou `fd00::/8` como `publicUrl`.

Chamadas de saída do Twilio em modo de notificação enviam o TwiML inicial
`<Say>` diretamente na solicitação de criação da chamada, então a primeira
mensagem falada não depende de o Twilio buscar o TwiML do Webhook. Um Webhook
público ainda é necessário para callbacks de status, chamadas de conversa, DTMF
pré-conexão, streams em tempo real e controle de chamada pós-conexão.

Use um caminho de exposição pública:

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

As credenciais devem existir no host do Gateway. Editar um perfil de shell local
não afeta um Gateway já em execução até que ele reinicie ou recarregue seu
ambiente.

### Chamadas iniciam, mas os Webhooks do provedor não chegam

Confirme que o console do provedor aponta para a URL pública exata do Webhook:

```text
https://voice.example.com/voice/webhook
```

Em seguida, inspecione o estado de runtime:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causas comuns:

- `publicUrl` aponta para um caminho diferente de `serve.path`.
- A URL do túnel mudou depois que o Gateway iniciou.
- Um proxy encaminha a solicitação, mas remove ou reescreve cabeçalhos de host/proto.
- Firewall ou DNS encaminha o hostname público para algum lugar que não é o Gateway.
- O Gateway foi reiniciado sem o Plugin Voice Call habilitado.

Quando um proxy reverso ou túnel está na frente do Gateway, defina
`webhookSecurity.allowedHosts` como o hostname público, ou use
`webhookSecurity.trustedProxyIPs` para um endereço de proxy conhecido. Use
`webhookSecurity.trustForwardingHeaders` somente quando o limite do proxy estiver
sob seu controle.

### Verificação de assinatura falha

As assinaturas do provedor são verificadas contra a URL pública que o OpenClaw
reconstrói a partir da solicitação recebida. Se as assinaturas falharem:

- Confirme que a URL do Webhook do provedor corresponde exatamente a `publicUrl`, incluindo
  esquema, host e caminho.
- Para URLs do nível gratuito do ngrok, atualize `publicUrl` quando o hostname do túnel mudar.
- Garanta que o proxy preserve os cabeçalhos originais de host e proto, ou configure
  `webhookSecurity.allowedHosts`.
- Não habilite `skipSignatureVerification` fora de testes locais.

### Entradas do Google Meet via Twilio falham

O Google Meet usa este Plugin para entradas por discagem do Twilio. Primeiro verifique o Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Em seguida, verifique explicitamente o transporte do Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Se o Voice Call estiver verde, mas o participante do Meet nunca entrar, verifique o número de
discagem do Meet, o PIN e `--dtmf-sequence`. A chamada telefônica pode estar íntegra enquanto
a reunião rejeita ou ignora uma sequência DTMF incorreta.

O Google Meet passa a sequência DTMF do Meet e o texto de introdução para `voicecall.start`.
Para chamadas Twilio, o Voice Call serve primeiro o TwiML DTMF, redireciona de volta para o
Webhook e então abre o stream de mídia em tempo real para que a introdução salva seja gerada
depois que o participante por telefone tiver entrado na reunião.

Use `openclaw logs --follow` para o rastreamento da fase ao vivo. Uma entrada saudável do Twilio
no Meet registra esta ordem:

- O Google Meet delega a entrada via Twilio para o Voice Call.
- O Voice Call armazena o TwiML DTMF pré-conexão.
- O TwiML inicial do Twilio é consumido e servido antes do tratamento em tempo real.
- O Voice Call serve o TwiML em tempo real para a chamada Twilio.
- A ponte em tempo real inicia com a saudação inicial enfileirada.

`openclaw voicecall tail` ainda mostra registros de chamadas persistidos; ele é útil para
estado de chamadas e transcrições, mas nem toda transição de Webhook/tempo real aparece
ali.

### Chamada em tempo real não tem fala

Confirme que apenas um modo de áudio está habilitado. `realtime.enabled` e
`streaming.enabled` não podem ambos ser true.

Para chamadas Twilio em tempo real, verifique também:

- Um Plugin de provedor em tempo real está carregado e registrado.
- `realtime.provider` não está definido ou nomeia um provedor registrado.
- A chave de API do provedor está disponível para o processo do Gateway.
- `openclaw logs --follow` mostra TwiML em tempo real servido, a ponte em tempo real
  iniciada e a saudação inicial enfileirada.

## Relacionados

- [Modo de conversa](/pt-BR/nodes/talk)
- [Texto para fala](/pt-BR/tools/tts)
- [Ativação por voz](/pt-BR/nodes/voicewake)
