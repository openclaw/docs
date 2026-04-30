---
read_when:
    - Você quer fazer uma chamada de voz de saída pelo OpenClaw
    - Você está configurando ou desenvolvendo o plugin de chamada de voz
    - Você precisa de voz em tempo real ou transcrição por streaming em telefonia
sidebarTitle: Voice call
summary: Realize chamadas de voz de saída e aceite chamadas de voz de entrada via Twilio, Telnyx ou Plivo, com voz em tempo real opcional e transcrição por fluxo contínuo
title: Plugin de chamada de voz
x-i18n:
    generated_at: "2026-04-30T10:02:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Chamadas de voz para OpenClaw por meio de um plugin. Compatível com notificações de saída,
conversas em vários turnos, voz realtime full-duplex, transcrição
por streaming e chamadas de entrada com políticas de lista de permissões.

**Provedores atuais:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + transferência XML + GetInput
speech), `mock` (desenvolvimento/sem rede).

<Note>
O plugin Voice Call é executado **dentro do processo do Gateway**. Se você usa um
Gateway remoto, instale e configure o plugin na máquina que executa
o Gateway e reinicie o Gateway para carregá-lo.
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
      <Tab title="De uma pasta local (desenvolvimento)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Se o npm informar que o pacote mantido pela OpenClaw está obsoleto, essa versão do pacote
    vem de uma linha de pacotes externa mais antiga; use uma build empacotada atual do OpenClaw
    ou o caminho da pasta local até que um pacote npm mais novo seja publicado.

    Depois, reinicie o Gateway para que o plugin seja carregado.

  </Step>
  <Step title="Configure o provedor e o webhook">
    Defina a configuração em `plugins.entries.voice-call.config` (veja
    [Configuração](#configuration) abaixo para o formato completo). No mínimo:
    `provider`, credenciais do provedor, `fromNumber` e uma URL de webhook
    acessível publicamente.
  </Step>
  <Step title="Verifique a configuração">
    ```bash
    openclaw voicecall setup
    ```

    A saída padrão é legível em logs de chat e terminais. Ela verifica
    a ativação do plugin, as credenciais do provedor, a exposição do webhook e se
    apenas um modo de áudio (`streaming` ou `realtime`) está ativo. Use
    `--json` para scripts.

  </Step>
  <Step title="Teste de fumaça">
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
Para Twilio, Telnyx e Plivo, a configuração precisa resolver para uma **URL de webhook pública**.
Se `publicUrl`, a URL do túnel, a URL do Tailscale ou o fallback de serviço
resolver para loopback ou espaço de rede privada, a configuração falhará em vez de
iniciar um provedor que não pode receber webhooks da operadora.
</Warning>

## Configuração

Se `enabled: true`, mas o provedor selecionado não tiver credenciais,
a inicialização do Gateway registra um aviso de configuração incompleta com as chaves ausentes e
pula a inicialização do runtime. Comandos, chamadas RPC e ferramentas de agente ainda
retornam a configuração exata ausente do provedor quando usados.

<Note>
As credenciais de voice-call aceitam SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` e `plugins.entries.voice-call.config.tts.providers.*.apiKey` são resolvidas pela superfície padrão de SecretRef; veja [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
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
  <Accordion title="Observações sobre exposição e segurança do provedor">
    - Twilio, Telnyx e Plivo exigem uma URL de webhook **publicamente acessível**.
    - `mock` é um provedor local de desenvolvimento (sem chamadas de rede).
    - Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), a menos que `skipSignatureVerification` seja true.
    - `skipSignatureVerification` é apenas para testes locais.
    - No plano gratuito do ngrok, defina `publicUrl` como a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks da Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local do ngrok). Apenas desenvolvimento local.
    - URLs do plano gratuito do ngrok podem mudar ou adicionar comportamento intersticial; se `publicUrl` se desviar, as assinaturas da Twilio falharão. Produção: prefira um domínio estável ou um funnel do Tailscale.

  </Accordion>
  <Accordion title="Limites de conexão de streaming">
    - `streaming.preStartTimeoutMs` fecha sockets que nunca enviam um frame `start` válido.
    - `streaming.maxPendingConnections` limita o total de sockets pré-início não autenticados.
    - `streaming.maxPendingConnectionsPerIp` limita sockets pré-início não autenticados por IP de origem.
    - `streaming.maxConnections` limita o total de sockets abertos de fluxo de mídia (pendentes + ativos).

  </Accordion>
  <Accordion title="Migrações de configuração legada">
    Configurações mais antigas que usam `provider: "log"`, `twilio.from` ou chaves legadas
    `streaming.*` do OpenAI são reescritas por `openclaw doctor --fix`.
    O fallback de runtime ainda aceita as chaves antigas de voice-call por enquanto, mas
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

`realtime` seleciona um provedor de voz realtime full-duplex para áudio de chamadas
ao vivo. Ele é separado de `streaming`, que apenas encaminha áudio para
provedores de transcrição realtime.

<Warning>
`realtime.enabled` não pode ser combinado com `streaming.enabled`. Escolha um
modo de áudio por chamada.
</Warning>

Comportamento atual do runtime:

- `realtime.enabled` é compatível com Twilio Media Streams.
- `realtime.provider` é opcional. Se não for definido, o Voice Call usa o primeiro provedor de voz realtime registrado.
- Provedores de voz realtime incluídos: Google Gemini Live (`google`) e OpenAI (`openai`), registrados por seus plugins de provedor.
- A configuração bruta pertencente ao provedor fica em `realtime.providers.<providerId>`.
- O Voice Call expõe a ferramenta realtime compartilhada `openclaw_agent_consult` por padrão. O modelo realtime pode chamá-la quando o chamador pede raciocínio mais profundo, informações atuais ou ferramentas normais do OpenClaw.
- Se `realtime.provider` apontar para um provedor não registrado, ou se nenhum provedor de voz realtime estiver registrado, o Voice Call registra um aviso e pula a mídia realtime em vez de falhar o plugin inteiro.
- As chaves de sessão de consulta reutilizam a sessão de voz existente quando disponível e, depois, recorrem ao número de telefone do chamador/destinatário para que chamadas de consulta subsequentes mantenham o contexto durante a chamada.

### Política de ferramentas

`realtime.toolPolicy` controla a execução da consulta:

| Política         | Comportamento                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Expõe a ferramenta de consulta e limita o agente comum a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`. |
| `owner`          | Expõe a ferramenta de consulta e permite que o agente comum use a política normal de ferramentas do agente.                              |
| `none`           | Não expõe a ferramenta de consulta. `realtime.tools` personalizadas ainda são repassadas ao provedor realtime.                           |

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

## Transcrição por streaming

`streaming` seleciona um provedor de transcrição realtime para áudio de chamadas ao vivo.

Comportamento atual do runtime:

- `streaming.provider` é opcional. Se não for definido, o Voice Call usa o primeiro provedor de transcrição realtime registrado.
- Provedores de transcrição realtime incluídos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrados por seus plugins de provedor.
- A configuração bruta pertencente ao provedor fica em `streaming.providers.<providerId>`.
- Se `streaming.provider` apontar para um provedor não registrado, ou se nenhum estiver registrado, o Voice Call registra um aviso e pula o streaming de mídia em vez de falhar o plugin inteiro.

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

Voice Call usa a configuração principal `messages.tts` para fala
por streaming em chamadas. Você pode substituí-la na configuração do Plugin com o
**mesmo formato** — ela faz uma mesclagem profunda com `messages.tts`.

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
**A fala da Microsoft é ignorada para chamadas de voz.** Áudio de telefonia precisa de PCM;
o transporte atual da Microsoft não expõe saída PCM para telefonia.
</Warning>

Notas de comportamento:

- Chaves legadas `tts.<provider>` dentro da configuração do Plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são corrigidas por `openclaw doctor --fix`; a configuração confirmada deve usar `tts.providers.<provider>`.
- O TTS principal é usado quando o streaming de mídia do Twilio está ativado; caso contrário, as chamadas recorrem às vozes nativas do provedor.
- Se um stream de mídia do Twilio já estiver ativo, Voice Call não recorre a TwiML `<Say>`. Se o TTS de telefonia estiver indisponível nesse estado, a solicitação de reprodução falha em vez de misturar dois caminhos de reprodução.
- Quando o TTS de telefonia recorre a um provedor secundário, Voice Call registra um aviso com a cadeia de provedores (`from`, `to`, `attempts`) para depuração.
- Quando a interrupção por fala ou o encerramento do stream do Twilio limpa a fila pendente de TTS, as solicitações de reprodução enfileiradas são resolvidas em vez de deixar chamadores aguardando a conclusão da reprodução.

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

A política de entrada usa `disabled` por padrão. Para ativar chamadas de entrada, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` é uma verificação de ID de chamador de baixa garantia. O
Plugin normaliza o valor `From` fornecido pelo provedor e o compara com
`allowFrom`. A verificação de Webhook autentica a entrega do provedor e
a integridade da carga, mas **não** comprova a propriedade do número de chamador
PSTN/VoIP. Trate `allowFrom` como filtragem de ID de chamador, não como identidade
forte do chamador.
</Warning>

Respostas automáticas usam o sistema de agentes. Ajuste com `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Contrato de saída falada

Para respostas automáticas, Voice Call acrescenta um contrato estrito de saída falada ao
prompt do sistema:

```text
{"spoken":"..."}
```

Voice Call extrai o texto de fala defensivamente:

- Ignora cargas marcadas como conteúdo de raciocínio/erro.
- Analisa JSON direto, JSON cercado por blocos ou chaves `"spoken"` embutidas.
- Recorre a texto simples e remove prováveis parágrafos iniciais de planejamento/metadados.

Isso mantém a reprodução falada focada no texto voltado ao chamador e evita
vazamento de texto de planejamento para o áudio.

### Comportamento de início de conversa

Para chamadas `conversation` de saída, o tratamento da primeira mensagem é vinculado ao estado de
reprodução ao vivo:

- A limpeza da fila por interrupção de fala e a resposta automática são suprimidas apenas enquanto a saudação inicial está sendo falada ativamente.
- Se a reprodução inicial falhar, a chamada retorna para `listening` e a mensagem inicial permanece enfileirada para nova tentativa.
- A reprodução inicial para streaming do Twilio começa na conexão do stream, sem atraso extra.
- A interrupção por fala aborta a reprodução ativa e limpa entradas de TTS do Twilio enfileiradas, mas ainda não em reprodução. As entradas limpas são resolvidas como ignoradas, para que a lógica de resposta seguinte possa continuar sem aguardar áudio que nunca será reproduzido.
- Conversas de voz em tempo real usam o próprio turno de abertura do stream em tempo real. Voice Call **não** publica uma atualização TwiML `<Say>` legada para essa mensagem inicial, então sessões `<Connect><Stream>` de saída permanecem anexadas.

### Período de tolerância para desconexão de stream do Twilio

Quando um stream de mídia do Twilio se desconecta, Voice Call aguarda **2000 ms** antes de
encerrar automaticamente a chamada:

- Se o stream se reconectar durante essa janela, o encerramento automático é cancelado.
- Se nenhum stream se registrar novamente após o período de tolerância, a chamada é encerrada para evitar chamadas ativas presas.

## Removedor de chamadas obsoletas

Use `staleCallReaperSeconds` para encerrar chamadas que nunca recebem um
Webhook terminal (por exemplo, chamadas em modo de notificação que nunca são concluídas). O padrão
é `0` (desativado).

Intervalos recomendados:

- **Produção:** `120`–`300` segundos para fluxos no estilo notificação.
- Mantenha este valor **maior que `maxDurationSeconds`** para que chamadas normais possam terminar. Um bom ponto de partida é `maxDurationSeconds + 30–60` segundos.

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

Quando um proxy ou túnel fica na frente do Gateway, o Plugin
reconstrói a URL pública para verificação de assinatura. Estas opções
controlam quais cabeçalhos encaminhados são confiáveis:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts da lista de permissões a partir de cabeçalhos de encaminhamento.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confia em cabeçalhos encaminhados sem uma lista de permissões.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confia em cabeçalhos encaminhados apenas quando o IP remoto da solicitação corresponde à lista.
</ParamField>

Proteções adicionais:

- A **proteção contra repetição** de Webhook é ativada para Twilio e Plivo. Solicitações válidas de Webhook repetidas são confirmadas, mas ignoradas quanto a efeitos colaterais.
- Turnos de conversa do Twilio incluem um token por turno em callbacks `<Gather>`, então callbacks de fala obsoletos/repetidos não conseguem satisfazer um turno de transcrição pendente mais recente.
- Solicitações de Webhook não autenticadas são rejeitadas antes da leitura do corpo quando os cabeçalhos de assinatura exigidos pelo provedor estão ausentes.
- O Webhook de voice-call usa o perfil compartilhado de corpo pré-autenticação (64 KB / 5 segundos) mais um limite em andamento por IP antes da verificação de assinatura.

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

`latency` lê `calls.jsonl` do caminho padrão de armazenamento do voice-call.
Use `--file <path>` para apontar para um log diferente e `--last <n>` para limitar
a análise aos últimos N registros (padrão 200). A saída inclui p50/p90/p99
para latência de turno e tempos de espera de escuta.

## Ferramenta de agente

Nome da ferramenta: `voice_call`.

| Ação            | Args                      |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Este repo inclui um documento de Skills correspondente em `skills/voice-call/SKILL.md`.

## RPC do Gateway

| Método              | Args                      |
| ------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Relacionado

- [Modo de conversa](/pt-BR/nodes/talk)
- [Texto para fala](/pt-BR/tools/tts)
- [Ativação por voz](/pt-BR/nodes/voicewake)
