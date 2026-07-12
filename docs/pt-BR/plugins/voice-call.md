---
read_when:
    - Você quer fazer uma chamada de voz de saída pelo OpenClaw
    - Você está configurando ou desenvolvendo o plugin de chamadas de voz
    - Você precisa de voz em tempo real ou transcrição por streaming em telefonia
sidebarTitle: Voice call
summary: Faça chamadas de voz e receba-as via Twilio, Telnyx ou Plivo, com voz em tempo real e transcrição por streaming opcionais
title: Plugin de chamadas de voz
x-i18n:
    generated_at: "2026-07-12T15:29:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Chamadas de voz para o OpenClaw por meio de um Plugin: notificações de saída, conversas
com várias interações, voz em tempo real full-duplex, transcrição por streaming e
chamadas recebidas com políticas de lista de permissões.

**Provedores:** `mock` (desenvolvimento, sem rede), `plivo` (Voice API + transferência XML +
fala GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
O Plugin Voice Call é executado **dentro do processo do Gateway**. Se você usa um
Gateway remoto, instale e configure o Plugin na máquina que executa o
Gateway e reinicie o Gateway para carregá-lo.
</Note>

## Início rápido

<Steps>
  <Step title="Instalar o Plugin">
    <Tabs>
      <Tab title="Pelo npm">
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

    Use o pacote sem uma versão especificada para acompanhar a tag da versão atual. Fixe uma
    versão exata somente quando precisar de uma instalação reproduzível. Depois,
    reinicie o Gateway para que o Plugin seja carregado.

  </Step>
  <Step title="Configurar o provedor e o Webhook">
    Defina a configuração em `plugins.entries.voice-call.config` (consulte
    [Configuração](#configuration) abaixo). No mínimo: `provider`, as credenciais
    do provedor, `fromNumber` e uma URL de Webhook acessível publicamente.
  </Step>
  <Step title="Verificar a configuração">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Verifica a habilitação do Plugin, as credenciais do provedor, a exposição do Webhook e
    se apenas um modo de áudio (`streaming` ou `realtime`) está ativo.

  </Step>
  <Step title="Teste de fumaça">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Por padrão, ambos são simulações. Adicione `--yes` para realizar uma chamada curta
    de notificação de saída:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx e Plivo, a configuração deve resultar em uma **URL de Webhook pública**.
Se `publicUrl`, a URL do túnel, a URL do Tailscale ou a alternativa de serviço
resultar em um endereço de loopback ou de rede privada, a configuração falhará em vez de
iniciar um provedor que não possa receber Webhooks da operadora.
</Warning>

## Configuração

Se `enabled: true`, mas o provedor selecionado não tiver credenciais, a inicialização
do Gateway registrará um aviso de configuração incompleta com as chaves ausentes e não
iniciará o runtime. Comandos, chamadas RPC e ferramentas do agente ainda retornarão a
configuração exata que estiver faltando quando forem usados.

<Note>
As credenciais de chamadas de voz aceitam SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` e `plugins.entries.voice-call.config.tts.providers.*.apiKey` são resolvidas pela interface padrão de SecretRef; consulte [Interface de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface).
</Note>

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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, como posso ajudar?",
              responseSystemPrompt: "Você é um especialista objetivo em cartões de beisebol.",
              tts: {
                providers: {
                  openai: { speakerVoice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
            // region: "ie1", // opcional: us1 | ie1 | au1; o padrão é us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Chave pública do Webhook da Telnyx no Mission Control Portal
            // (Base64; também pode ser definida por TELNYX_PUBLIC_KEY).
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

          // Segurança do Webhook (recomendada para túneis/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Exposição pública (escolha uma opção)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* consulte Transcrição por streaming */ },
          realtime: { enabled: false /* consulte Conversas de voz em tempo real */ },
        },
      },
    },
  },
}
```

### Referência de configuração

Chaves de nível superior em `plugins.entries.voice-call.config` não mostradas acima:

| Chave                           | Padrão       | Observações                                                                            |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Controle mestre para ativar/desativar.                                                  |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Consulte [Chamadas recebidas](#inbound-calls). |
| `allowFrom`                     | `[]`         | Lista de permissões E.164 para `inboundPolicy: "allowlist"`.                            |
| `maxDurationSeconds`            | `300`        | Limite rígido de duração por chamada, aplicado independentemente do estado de atendimento. |
| `staleCallReaperSeconds`        | `120`        | Consulte [Coletor de chamadas obsoletas](#stale-call-reaper). `0` o desativa.           |
| `silenceTimeoutMs`              | `800`        | Detecção de silêncio no fim da fala para o fluxo clássico (não em tempo real).          |
| `transcriptTimeoutMs`           | `180000`     | Tempo máximo de espera pela transcrição do chamador antes de desistir de uma interação. |
| `ringTimeoutMs`                 | `30000`      | Tempo limite de toque para chamadas de saída.                                           |
| `maxConcurrentCalls`            | `1`          | Chamadas de saída além desse limite são rejeitadas.                                     |
| `outbound.notifyHangupDelaySec` | `3`          | Segundos de espera após o TTS antes do desligamento automático no modo de notificação.  |
| `skipSignatureVerification`     | `false`      | Somente para testes locais; nunca habilite em produção.                                 |
| `store`                         | não definido | Substitui o caminho padrão do registro de chamadas `~/.openclaw/voice-calls`.            |
| `agentId`                       | `"main"`     | Agente usado para gerar respostas e armazenar sessões.                                  |
| `responseModel`                 | não definido | Substitui o modelo padrão das respostas clássicas (não em tempo real).                  |
| `responseSystemPrompt`          | gerado       | Prompt de sistema personalizado para respostas clássicas.                              |
| `responseTimeoutMs`             | `30000`      | Tempo limite para gerar respostas clássicas (ms).                                      |

Por padrão, a Twilio usa seu endpoint REST US1. Para processar chamadas em uma
região compatível fora dos EUA, defina `twilio.region` como `ie1` ou `au1` e use
credenciais dessa região. Consulte o
[guia da Twilio sobre a REST API em regiões fora dos EUA](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Observações sobre exposição e segurança dos provedores">
    - Twilio, Telnyx e Plivo exigem uma URL de Webhook **acessível publicamente**.
    - `mock` é um provedor local para desenvolvimento (sem chamadas de rede).
    - A Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), a menos que `skipSignatureVerification` seja true.
    - `skipSignatureVerification` destina-se apenas a testes locais.
    - No plano gratuito do ngrok, defina `publicUrl` como a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite Webhooks da Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` é loopback (agente local do ngrok). Somente para desenvolvimento local.
    - URLs do plano gratuito do ngrok podem mudar ou adicionar uma página intermediária; se `publicUrl` ficar divergente, as assinaturas da Twilio falharão. Em produção, prefira um domínio estável ou um funnel do Tailscale.

  </Accordion>
  <Accordion title="Limites de conexões de streaming">
    - `streaming.preStartTimeoutMs` (padrão `5000`) fecha sockets que nunca enviam um frame `start` válido.
    - `streaming.maxPendingConnections` (padrão `32`) limita o total de sockets não autenticados antes da inicialização.
    - `streaming.maxPendingConnectionsPerIp` (padrão `4`) limita os sockets não autenticados antes da inicialização por IP de origem.
    - `streaming.maxConnections` (padrão `128`) limita todos os sockets abertos de streaming de mídia (pendentes + ativos).

  </Accordion>
  <Accordion title="Migrações de configurações legadas">
    A análise da configuração normaliza automaticamente estas chaves legadas e registra um
    aviso que informa o caminho substituto; a camada de compatibilidade será removida em uma versão
    futura (`2026.6.0`), portanto execute `openclaw doctor --fix` para reescrever a configuração
    versionada no formato canônico:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` foi removido (o contexto em tempo real agora usa o prompt gerado do agente)

  </Accordion>
</AccordionGroup>

## Escopo da sessão

Por padrão, o Voice Call usa `sessionScope: "per-phone"` para que chamadas repetidas do
mesmo chamador mantenham a memória da conversa. Defina `sessionScope: "per-call"` quando
cada chamada da operadora precisar começar com um contexto novo, por exemplo, em fluxos de
recepção, reservas, IVR ou ponte do Google Meet, nos quais o mesmo número de telefone pode
representar reuniões diferentes.

O Voice Call armazena as chaves de sessão geradas no namespace configurado do agente
(`agent:<agentId>:voice:*`). Chaves de integração explícitas brutas são resolvidas no
mesmo namespace: uma chave canônica `agent:<configuredAgentId>:*` mantém esse
proprietário e respeita os aliases de `session.mainKey`/escopo global do núcleo; uma entrada
`agent:*` externa ou malformada recebe escopo como chave opaca sob o agente
configurado; `global` e `unknown` continuam sendo sentinelas globais.

## Conversas de voz em tempo real

`realtime` seleciona um provedor de voz em tempo real full-duplex para o áudio ao vivo da chamada.
Ele é separado de `streaming`, que apenas encaminha o áudio para provedores de
transcrição em tempo real.

<Warning>
`realtime.enabled` não pode ser combinado com `streaming.enabled`. Escolha um
modo de áudio por chamada.
</Warning>

Comportamento atual do runtime:

- `realtime.enabled` é compatível com Twilio e Telnyx.
- `realtime.provider` é opcional. Se não for definido, o Voice Call usará o primeiro provedor de voz em tempo real registrado.
- Provedores de voz em tempo real incluídos: Google Gemini Live (`google`) e OpenAI (`openai`), registrados por seus plugins de provedor.
- A configuração bruta de responsabilidade do provedor fica em `realtime.providers.<providerId>`.
- Por padrão, o Voice Call disponibiliza a ferramenta compartilhada em tempo real `openclaw_agent_consult`. O modelo em tempo real pode chamá-la quando quem liga solicitar raciocínio mais aprofundado, informações atuais ou ferramentas normais do OpenClaw.
- `realtime.consultPolicy` adiciona opcionalmente orientações sobre quando o modelo em tempo real deve chamar `openclaw_agent_consult`.
- `realtime.agentContext.enabled` vem desativado por padrão. Quando ativado, o Voice Call injeta uma identidade delimitada do agente e uma cápsula com arquivos selecionados do espaço de trabalho nas instruções do provedor em tempo real durante a configuração da sessão.
- `realtime.fastContext.enabled` vem desativado por padrão. Quando ativado, o Voice Call primeiro pesquisa o contexto indexado da memória/sessão para responder à pergunta da consulta e retorna esses trechos ao modelo em tempo real dentro de `realtime.fastContext.timeoutMs`, antes de recorrer ao agente de consulta completo, somente se `realtime.fastContext.fallbackToConsult` for verdadeiro.
- Se `realtime.provider` apontar para um provedor não registrado, ou se nenhum provedor de voz em tempo real estiver registrado, o Voice Call registrará um aviso e ignorará a mídia em tempo real, em vez de causar a falha de todo o plugin.
- `inboundPolicy` não pode ser `"disabled"` quando `realtime.enabled` for verdadeiro; `validateProviderConfig` rejeita essa combinação.
- As chaves de sessão da consulta reutilizam a sessão de chamada armazenada quando disponível e, depois, recorrem ao `sessionScope` configurado (`per-phone` por padrão ou `per-call` para chamadas isoladas).

### Política de ferramentas

`realtime.toolPolicy` controla a execução da consulta:

| Política         | Comportamento                                                                                                                                                                            |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Disponibiliza a ferramenta de consulta e limita o agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`.                                         |
| `owner`          | Disponibiliza a ferramenta de consulta e permite que o agente normal use a política normal de ferramentas do agente.                                                                    |
| `none`           | Não disponibiliza a ferramenta de consulta. As ferramentas personalizadas em `realtime.tools` ainda são repassadas ao provedor em tempo real.                                           |

`realtime.consultPolicy` controla apenas as instruções do modelo em tempo real:

| Política      | Orientação                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| `auto`        | Mantenha o prompt padrão e deixe o provedor decidir quando chamar a ferramenta de consulta.            |
| `substantive` | Responda diretamente a interações conversacionais simples e consulte antes de usar fatos, memória, ferramentas ou contexto. |
| `always`      | Consulte antes de cada resposta substantiva.                                                           |

### Contexto de voz do agente

Habilite `realtime.agentContext` quando a ponte de voz precisar soar como o
agente OpenClaw configurado, sem incorrer em uma ida e volta completa de consulta
ao agente em interações comuns. A cápsula de contexto é adicionada uma única vez
quando a sessão em tempo real é criada, portanto não acrescenta latência a cada
interação. As chamadas a `openclaw_agent_consult` ainda executam o agente OpenClaw
completo e devem ser usadas para trabalhos com ferramentas, informações atuais,
consultas à memória ou estado do espaço de trabalho.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Exemplos de provedores em tempo real

<Tabs>
  <Tab title="Google Gemini Live">
    Padrões: chave de API de `realtime.providers.google.apiKey`, `GEMINI_API_KEY`
    ou `GOOGLE_API_KEY`; modelo `gemini-3.1-flash-live-preview`;
    voz `Kore`. `sessionResumption` e `contextWindowCompression` são ativados por padrão
    para chamadas mais longas e reconectáveis. Use `silenceDurationMs`,
    `startSensitivity` e `endSensitivity` para ajustar uma alternância de turnos mais rápida em
    áudio de telefonia.

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
                instructions: "Fale brevemente. Chame openclaw_agent_consult antes de usar ferramentas mais avançadas.",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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

Consulte [provedor Google](/pt-BR/providers/google) e
[provedor OpenAI](/pt-BR/providers/openai) para ver as opções de voz em tempo real
específicas de cada provedor.

## Transcrição por streaming

`streaming` seleciona um provedor de transcrição em tempo real para o áudio de chamadas ao vivo.

Comportamento atual em tempo de execução:

- `streaming.provider` é opcional. Se não estiver definido, o Voice Call usará o primeiro provedor de transcrição em tempo real registrado.
- Provedores de transcrição em tempo real incluídos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrados por seus respectivos plugins de provedor.
- A configuração bruta de propriedade do provedor fica em `streaming.providers.<providerId>`.
- Depois que o Twilio envia uma mensagem `start` de fluxo aceita, o Voice Call registra o fluxo imediatamente, enfileira a mídia recebida por meio do provedor de transcrição enquanto ele se conecta e inicia a saudação inicial somente depois que a transcrição em tempo real está pronta.
- Se `streaming.provider` apontar para um provedor não registrado, ou se nenhum estiver registrado, o Voice Call registrará um aviso e ignorará o streaming de mídia, em vez de causar falha em todo o plugin.

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
                    apiKey: "sk-...", // opcional se OPENAI_API_KEY estiver definida
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
    Padrões: chave de API `streaming.providers.xai.apiKey` ou `XAI_API_KEY` (recorre
    a um perfil de autenticação OAuth da xAI se nenhuma delas estiver definida); endpoint
    `wss://api.x.ai/v1/stt`; codificação `mulaw`; taxa de amostragem `8000`;
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
                    apiKey: "${XAI_API_KEY}", // opcional se XAI_API_KEY estiver definida
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

O Voice Call usa a configuração principal `messages.tts` para streaming de fala em
chamadas. Você pode substituí-la na configuração do plugin usando o **mesmo formato** —
ela é mesclada recursivamente com `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**A síntese de fala da Microsoft é ignorada em chamadas de voz.** A síntese para telefonia exige
um provedor que implemente saída destinada à telefonia; o provedor de síntese de fala
da Microsoft não a implementa, portanto ele é ignorado em chamadas e outros provedores na
cadeia de fallback são testados em seu lugar.
</Warning>

Observações sobre o comportamento:

- As chaves legadas `tts.<provider>` na configuração do plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são corrigidas por `openclaw doctor --fix`; a configuração persistida deve usar `tts.providers.<provider>`.
- O TTS principal é usado quando o streaming de mídia do Twilio está ativado; caso contrário, as chamadas recorrem às vozes nativas do provedor.
- Se um fluxo de mídia do Twilio já estiver ativo, o Voice Call não recorrerá ao `<Say>` do TwiML. Se o TTS para telefonia não estiver disponível nesse estado, a solicitação de reprodução falhará, em vez de misturar dois caminhos de reprodução.
- Quando o TTS para telefonia recorre a um provedor secundário, o Voice Call registra um aviso com a cadeia de provedores (`from`, `to`, `attempts`) para depuração.
- Quando a interrupção de fala do Twilio ou o encerramento do fluxo limpa a fila de TTS pendente, as solicitações de reprodução enfileiradas são concluídas, em vez de deixar travados os chamadores que aguardam o término da reprodução.

### Exemplos de TTS

<Tabs>
  <Tab title="Somente TTS principal">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="Substituição do modelo OpenAI (mesclagem recursiva)">
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
                speakerVoice: "marin",
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

A política padrão de chamadas recebidas é `disabled`. Para ativar chamadas recebidas, defina:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Olá! Como posso ajudar?",
}
```

<Warning>
`inboundPolicy: "allowlist"` é uma verificação de baixa garantia do identificador de chamadas. O plugin
normaliza o valor `From` fornecido pelo provedor e o compara com `allowFrom`.
A verificação do Webhook autentica a entrega pelo provedor e a integridade da carga útil,
mas **não** comprova a titularidade do número de chamada PSTN/VoIP. Trate
`allowFrom` como filtragem do identificador de chamadas, não como uma identidade forte do chamador.
</Warning>

As respostas automáticas usam o sistema de agentes. Ajuste-as com `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Roteamento por número

Use `numbers` quando um único plugin Voice Call receber chamadas para vários números de
telefone e cada número precisar se comportar como uma linha diferente. Por exemplo,
um número pode usar um assistente pessoal informal, enquanto outro usa uma persona
empresarial, um agente de resposta diferente e uma voz de TTS diferente.

As rotas são selecionadas com base no número `To` discado fornecido pelo provedor. As chaves devem
ser números E.164. Quando uma chamada chega, o Voice Call resolve a rota
correspondente uma única vez, armazena a rota encontrada no registro da chamada e reutiliza essa
configuração efetiva para a saudação, o fluxo clássico de resposta automática, o fluxo de
consulta em tempo real e a reprodução de TTS. Se nenhuma rota corresponder, será usada a
configuração global do Voice Call. Chamadas de saída não usam `numbers`; informe explicitamente
o destino, a mensagem e a sessão de saída ao iniciar a chamada.

Atualmente, as substituições de rota são compatíveis com:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

O valor `tts` da rota é mesclado recursivamente sobre a configuração global `tts` do Voice Call, portanto
geralmente é possível substituir apenas a voz do provedor:

```json5
{
  inboundGreeting: "Olá, você ligou para a linha principal.",
  responseSystemPrompt: "Você é o assistente de voz padrão.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, como posso ajudar?",
      responseSystemPrompt: "Você é um especialista conciso em cartões de beisebol.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Contrato da saída falada

Para respostas automáticas, o Voice Call acrescenta ao prompt do sistema um contrato estrito de saída falada
que exige uma resposta JSON `{"spoken":"..."}`. O Voice Call
extrai o texto da fala de forma defensiva:

- Ignora cargas úteis marcadas como conteúdo de raciocínio/erro.
- Analisa JSON direto, JSON em bloco delimitado ou chaves `"spoken"` embutidas.
- Usa texto simples como alternativa e remove prováveis parágrafos introdutórios de planejamento/metadados.

Isso mantém a reprodução falada concentrada no texto direcionado ao chamador e evita o vazamento
de texto de planejamento para o áudio.

### Comportamento de início da conversa

Para chamadas `conversation` de saída, o processamento da primeira mensagem está vinculado ao estado de
reprodução ao vivo:

- A limpeza da fila por interrupção do usuário e a resposta automática são suprimidas somente enquanto a saudação inicial está sendo falada ativamente.
- Se a reprodução inicial falhar, a chamada retornará para `listening` e a mensagem inicial permanecerá na fila para uma nova tentativa.
- A reprodução inicial para streaming do Twilio começa na conexão do stream, sem atraso adicional.
- A interrupção do usuário cancela a reprodução ativa e limpa as entradas de TTS do Twilio que estão na fila, mas ainda não começaram a ser reproduzidas. As entradas removidas são resolvidas como ignoradas, permitindo que a lógica da resposta seguinte continue sem aguardar um áudio que nunca será reproduzido.
- As conversas de voz em tempo real usam o próprio turno inicial do stream em tempo real. O Voice Call **não** envia uma atualização TwiML `<Say>` legada para essa mensagem inicial, portanto as sessões de saída `<Connect><Stream>` permanecem conectadas.

### Período de tolerância para desconexão do stream do Twilio

Quando um stream de mídia do Twilio é desconectado, o Voice Call aguarda **2000 ms** antes de
encerrar automaticamente a chamada:

- Se o stream se reconectar durante esse intervalo, o encerramento automático será cancelado.
- Se nenhum stream for registrado novamente após o período de tolerância, a chamada será encerrada para evitar chamadas ativas travadas.

## Limpador de chamadas obsoletas

Use `staleCallReaperSeconds` (padrão **120**) para encerrar chamadas que nunca são
atendidas nem alcançam um estado de conversa ao vivo, como chamadas no modo de
notificação em que o provedor nunca entrega um Webhook terminal. Defina como `0` para
desativar.

O limpador é executado a cada 30 segundos e encerra somente chamadas que não tenham um
carimbo de data/hora `answeredAt` e que ainda não estejam em um estado terminal ou ao vivo
(`speaking`/`listening`), portanto conversas atendidas nunca são encerradas
por esse temporizador; `maxDurationSeconds` (padrão 300) é o limite separado que
encerra chamadas atendidas que duram tempo demais.

Para fluxos no estilo de notificação em que as operadoras podem demorar para entregar Webhooks de
toque/atendimento, aumente `staleCallReaperSeconds` acima do padrão para que chamadas
lentas, porém normais, não sejam encerradas antecipadamente; `120`-`300` segundos é um intervalo
razoável para produção.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Segurança do Webhook

Quando um proxy ou túnel fica na frente do Gateway, o plugin reconstrói
a URL pública para a verificação da assinatura. Estas opções controlam quais
cabeçalhos encaminhados são considerados confiáveis:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts permitidos dos cabeçalhos de encaminhamento.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Considera confiáveis os cabeçalhos encaminhados sem uma lista de permissões.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Considera confiáveis os cabeçalhos encaminhados somente quando o IP remoto da solicitação corresponde à lista.
</ParamField>

Proteções adicionais:

- A **proteção contra repetição** de Webhooks está habilitada para Twilio, Telnyx e Plivo. Solicitações válidas de Webhook repetidas são confirmadas, mas seus efeitos colaterais são ignorados.
- Os turnos de conversa do Twilio incluem um token por turno nos retornos de chamada `<Gather>`, portanto retornos de chamada de fala obsoletos/repetidos não podem satisfazer um turno de transcrição pendente mais recente.
- Solicitações de Webhook não autenticadas são rejeitadas antes da leitura do corpo quando os cabeçalhos de assinatura exigidos pelo provedor estão ausentes.
- O Webhook de voice-call usa o perfil compartilhado de leitura do corpo antes da autenticação (corpo máximo de 64 KB, tempo limite de leitura de 5 segundos), além de um limite por chave de solicitações em andamento (8 solicitações simultâneas por chave por padrão), antes da verificação da assinatura.

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
openclaw voicecall call --to "+15555550123" --message "Olá do OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias de call
openclaw voicecall continue --call-id <id> --message "Alguma dúvida?"
openclaw voicecall speak --call-id <id> --message "Um momento"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # resume a latência dos turnos com base nos logs
openclaw voicecall expose --mode funnel
```

Quando o Gateway já está em execução, os comandos operacionais `voicecall`
delegam ao runtime de voice-call pertencente ao Gateway para que a CLI não vincule um
segundo servidor de Webhook. Se nenhum Gateway estiver acessível, os comandos recorrem a
um runtime autônomo da CLI.

`latency` lê `calls.jsonl` do caminho de armazenamento padrão do voice-call. Use
`--file <path>` para indicar um log diferente e `--last <n>` para limitar
a análise aos últimos N registros (padrão 200). A saída inclui mínimo/máximo/média,
p50 e p95 para a latência dos turnos e os tempos de espera de escuta.

## Ferramenta do agente

Nome da ferramenta: `voice_call`.

| Ação            | Argumentos                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

O plugin voice-call inclui uma skill de agente correspondente.

## RPC do Gateway

| Método                      | Argumentos                                                       | Observações                                                                    |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Usa como alternativa a configuração `toNumber` quando `to` é omitido.          |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Igual a `initiate`, mas também aceita `dtmfSequence` antes da conexão.          |
| `voicecall.continue`        | `callId`, `message`                                              | Bloqueia até o turno ser resolvido; retorna a transcrição.                      |
| `voicecall.continue.start`  | `callId`, `message`                                              | Variante assíncrona: retorna imediatamente um `operationId`.                    |
| `voicecall.continue.result` | `operationId`                                                    | Consulta uma operação `voicecall.continue.start` pendente para obter o resultado. |
| `voicecall.speak`           | `callId`, `message`                                              | Fala sem aguardar; usa a ponte em tempo real quando `realtime.enabled`.         |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                                |
| `voicecall.end`             | `callId`                                                         |                                                                                |
| `voicecall.status`          | `callId?`                                                        | Omita `callId` para listar todas as chamadas ativas.                            |

`dtmfSequence` é válido somente com `mode: "conversation"`; chamadas no modo de notificação
devem usar `voicecall.dtmf` depois que a chamada existir, caso precisem enviar dígitos
após a conexão.

## Solução de problemas

### A configuração da exposição do Webhook falha

Execute a configuração no mesmo ambiente que executa o Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Para `twilio`, `telnyx` e `plivo`, `webhook-exposure` deve estar verde. Uma
`publicUrl` configurada ainda falha quando aponta para um espaço de rede local ou privado,
pois a operadora não consegue fazer chamadas de retorno para esses endereços.
Não use `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` nem outros intervalos de NAT
de nível de operadora como `publicUrl`.

Chamadas de saída no modo de notificação do Twilio enviam seu TwiML `<Say>` inicial diretamente
na solicitação de criação da chamada, portanto a primeira mensagem falada não depende de
o Twilio buscar o TwiML do Webhook. Um Webhook público ainda é obrigatório para retornos de chamada
de status, chamadas de conversa, DTMF antes da conexão, streams em tempo real e
controle da chamada após a conexão.

Use um caminho de exposição pública:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // ou
          tunnel: { provider: "ngrok" },
          // ou
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Após alterar a configuração, reinicie ou recarregue o Gateway e execute:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` é uma simulação, a menos que você informe `--yes`.

### As credenciais do provedor falham

Verifique o provedor selecionado e os campos de credenciais obrigatórios:

- Twilio: `twilio.accountSid`, `twilio.authToken` e `fromNumber`, ou
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` e
  `fromNumber`, ou `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` e
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` e `fromNumber`, ou
  `PLIVO_AUTH_ID` e `PLIVO_AUTH_TOKEN`.

As credenciais devem existir no host do Gateway. Editar um perfil de shell local
não afeta um Gateway já em execução até que ele seja reiniciado ou recarregue
seu ambiente.

### As chamadas são iniciadas, mas os webhooks do provedor não chegam

Confirme que o console do provedor aponta para a URL pública exata do webhook:

```text
https://voice.example.com/voice/webhook
```

Em seguida, inspecione o estado de execução:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Causas comuns:

- `publicUrl` aponta para um caminho diferente de `serve.path`.
- A URL do túnel mudou depois que o Gateway foi iniciado.
- Um proxy encaminha a solicitação, mas remove ou reescreve os cabeçalhos de host/protocolo.
- O firewall ou o DNS direciona o nome de host público para outro local que não seja o Gateway.
- O Gateway foi reiniciado sem o Plugin Voice Call habilitado.

Quando houver um proxy reverso ou túnel à frente do Gateway, defina
`webhookSecurity.allowedHosts` como o nome de host público ou use
`webhookSecurity.trustedProxyIPs` para um endereço de proxy conhecido. Use
`webhookSecurity.trustForwardingHeaders` somente quando o limite do proxy
estiver sob seu controle.

### A verificação de assinatura falha

As assinaturas do provedor são verificadas em relação à URL pública que o OpenClaw
reconstrói com base na solicitação recebida. Se as assinaturas falharem:

- Confirme que a URL do webhook do provedor corresponde exatamente a `publicUrl`, incluindo esquema, host e caminho.
- Para URLs do plano gratuito do ngrok, atualize `publicUrl` quando o nome de host do túnel mudar.
- Verifique se o proxy preserva os cabeçalhos originais de host e protocolo ou configure `webhookSecurity.allowedHosts`.
- Não habilite `skipSignatureVerification` fora de testes locais.

### As entradas do Google Meet via Twilio falham

O Google Meet usa este plugin para entradas por discagem via Twilio. Primeiro, verifique o Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Em seguida, verifique explicitamente o transporte do Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Se o Voice Call estiver funcionando, mas o participante nunca entrar no Meet, verifique o número
de discagem do Meet, o PIN e `--dtmf-sequence`. A chamada telefônica pode estar funcionando
enquanto a reunião rejeita ou ignora uma sequência DTMF incorreta.

O Google Meet inicia o trecho telefônico da Twilio por meio de `voicecall.start` com uma
sequência DTMF anterior à conexão. Sequências derivadas do PIN incluem o
`voiceCall.dtmfDelayMs` do plugin Google Meet (padrão: **12000 ms**) como dígitos
de espera iniciais da Twilio, pois as instruções de discagem do Meet podem chegar com atraso. Em seguida, o Voice Call
redireciona de volta para o processamento em tempo real antes que a saudação inicial seja solicitada.

Use `openclaw logs --follow` para acompanhar as fases em tempo real. Uma entrada bem-sucedida no Meet
via Twilio registra esta ordem:

- O Google Meet delega a entrada via Twilio ao Voice Call.
- O Voice Call armazena o TwiML de DTMF anterior à conexão.
- O TwiML inicial da Twilio é consumido e fornecido antes do processamento em tempo real.
- O Voice Call fornece o TwiML em tempo real para a chamada da Twilio.
- O Google Meet solicita a fala de introdução com `voicecall.speak` após o atraso posterior ao DTMF.

`openclaw voicecall tail` ainda mostra os registros de chamada persistidos; é útil para
o estado das chamadas e as transcrições, mas nem toda transição de webhook/tempo real
aparece nele.

### A chamada em tempo real não tem fala

Confirme que apenas um modo de áudio está habilitado: `realtime.enabled` e
`streaming.enabled` não podem ser ambos verdadeiros.

Para chamadas em tempo real da Twilio/Telnyx, verifique também:

- Um plugin de provedor em tempo real está carregado e registrado.
- `realtime.provider` não está definido ou indica um provedor registrado.
- A chave de API do provedor está disponível para o processo do Gateway.
- `openclaw logs --follow` mostra que o TwiML em tempo real foi fornecido, que a ponte em tempo real foi iniciada e que a saudação inicial foi enfileirada.

## Relacionado

- [Modo de conversa](/pt-BR/nodes/talk)
- [Conversão de texto em fala](/pt-BR/tools/tts)
- [Ativação por voz](/pt-BR/nodes/voicewake)
