---
read_when:
    - Você quer fazer uma chamada de voz de saída pelo OpenClaw
    - Você está configurando ou desenvolvendo o plugin de chamadas de voz
    - Você precisa de voz em tempo real ou transcrição por streaming em telefonia
sidebarTitle: Voice call
summary: Faça chamadas de voz e aceite chamadas recebidas via Twilio, Telnyx ou Plivo, com voz em tempo real e transcrição contínua opcionais
title: Plugin de chamadas de voz
x-i18n:
    generated_at: "2026-07-12T00:16:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Chamadas de voz para o OpenClaw por meio de um plugin: notificações de saída, conversas
com vários turnos, voz em tempo real full-duplex, transcrição por streaming e
chamadas recebidas com políticas de lista de permissões.

**Provedores:** `mock` (desenvolvimento, sem rede), `plivo` (API de voz + transferência por XML +
reconhecimento de fala GetInput), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
O plugin Voice Call é executado **dentro do processo do Gateway**. Se você usa um
Gateway remoto, instale e configure o plugin na máquina que executa o
Gateway e reinicie o Gateway para carregá-lo.
</Note>

## Início rápido

<Steps>
  <Step title="Instalar o plugin">
    <Tabs>
      <Tab title="Pelo npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Por uma pasta local (desenvolvimento)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Use o pacote sem versão para acompanhar a tag da versão atual. Fixe uma versão
    exata somente quando precisar de uma instalação reproduzível. Depois,
    reinicie o Gateway para que o plugin seja carregado.

  </Step>
  <Step title="Configurar o provedor e o webhook">
    Defina a configuração em `plugins.entries.voice-call.config` (consulte
    [Configuração](#configuration) abaixo). No mínimo: `provider`, as credenciais
    do provedor, `fromNumber` e uma URL de webhook acessível publicamente.
  </Step>
  <Step title="Verificar a configuração">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Verifica se o plugin está habilitado, as credenciais do provedor, a exposição
    do webhook e se apenas um modo de áudio (`streaming` ou `realtime`) está ativo.

  </Step>
  <Step title="Executar um teste de fumaça">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Por padrão, ambos são simulações. Adicione `--yes` para realizar uma breve
    chamada de notificação de saída:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Para Twilio, Telnyx e Plivo, a configuração deve resultar em uma **URL pública de webhook**.
Se `publicUrl`, a URL do túnel, a URL do Tailscale ou a alternativa de `serve`
resultar em um endereço de local loopback ou de rede privada, a configuração falhará em vez de
iniciar um provedor que não pode receber webhooks da operadora.
</Warning>

## Configuração

Se `enabled: true`, mas faltarem credenciais para o provedor selecionado, a
inicialização do Gateway registrará um aviso de configuração incompleta com as chaves ausentes
e não iniciará o runtime. Comandos, chamadas RPC e ferramentas do agente ainda retornarão
a configuração exata ausente quando forem usados.

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
              responseSystemPrompt: "Você é um especialista conciso em cartões de beisebol.",
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
            // Chave pública do webhook do Telnyx obtida no Mission Control Portal
            // (Base64; também pode ser definida por TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Servidor de webhook
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Segurança do webhook (recomendada para túneis/proxies)
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
| `enabled`                       | `false`      | Chave mestre para ativar/desativar.                                                     |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Consulte [Chamadas recebidas](#inbound-calls). |
| `allowFrom`                     | `[]`         | Lista de permissões E.164 para `inboundPolicy: "allowlist"`.                            |
| `maxDurationSeconds`            | `300`        | Limite rígido de duração por chamada, aplicado independentemente do estado de atendimento. |
| `staleCallReaperSeconds`        | `120`        | Consulte [Eliminador de chamadas obsoletas](#stale-call-reaper). `0` o desativa.        |
| `silenceTimeoutMs`              | `800`        | Detecção de silêncio no fim da fala para o fluxo clássico (não em tempo real).          |
| `transcriptTimeoutMs`           | `180000`     | Espera máxima por uma transcrição do chamador antes de desistir de um turno.            |
| `ringTimeoutMs`                 | `30000`      | Tempo limite de toque para chamadas de saída.                                           |
| `maxConcurrentCalls`            | `1`          | Chamadas de saída além desse limite são rejeitadas.                                     |
| `outbound.notifyHangupDelaySec` | `3`          | Segundos de espera após o TTS antes do desligamento automático no modo de notificação.  |
| `skipSignatureVerification`     | `false`      | Somente para testes locais; nunca habilite em produção.                                 |
| `store`                         | não definido | Substitui o caminho padrão do registro de chamadas `~/.openclaw/voice-calls`.           |
| `agentId`                       | `"main"`     | Agente usado para gerar respostas e armazenar sessões.                                  |
| `responseModel`                 | não definido | Substitui o modelo padrão das respostas clássicas (não em tempo real).                  |
| `responseSystemPrompt`          | gerado       | Prompt de sistema personalizado para respostas clássicas.                              |
| `responseTimeoutMs`             | `30000`      | Tempo limite para gerar respostas clássicas (ms).                                      |

Por padrão, o Twilio usa seu endpoint REST US1. Para processar chamadas em uma
região compatível fora dos EUA, defina `twilio.region` como `ie1` ou `au1` e use credenciais
dessa região. Consulte o
[guia da API REST do Twilio para regiões fora dos EUA](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Observações sobre exposição e segurança do provedor">
    - Twilio, Telnyx e Plivo exigem uma URL de webhook **acessível publicamente**.
    - `mock` é um provedor para desenvolvimento local (sem chamadas de rede).
    - O Telnyx exige `telnyx.publicKey` (ou `TELNYX_PUBLIC_KEY`), a menos que `skipSignatureVerification` seja verdadeiro.
    - `skipSignatureVerification` destina-se somente a testes locais.
    - No plano gratuito do ngrok, defina `publicUrl` com a URL exata do ngrok; a verificação de assinatura é sempre aplicada.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` permite webhooks do Twilio com assinaturas inválidas **somente** quando `tunnel.provider="ngrok"` e `serve.bind` é local loopback (agente local do ngrok). Somente para desenvolvimento local.
    - As URLs do plano gratuito do ngrok podem mudar ou adicionar uma página intermediária; se `publicUrl` mudar, as assinaturas do Twilio falharão. Em produção, prefira um domínio estável ou um funnel do Tailscale.

  </Accordion>
  <Accordion title="Limites de conexões de streaming">
    - `streaming.preStartTimeoutMs` (padrão `5000`) fecha sockets que nunca enviam um quadro `start` válido.
    - `streaming.maxPendingConnections` (padrão `32`) limita o total de sockets não autenticados antes da inicialização.
    - `streaming.maxPendingConnectionsPerIp` (padrão `4`) limita os sockets não autenticados antes da inicialização por IP de origem.
    - `streaming.maxConnections` (padrão `128`) limita todos os sockets abertos de fluxo de mídia (pendentes + ativos).

  </Accordion>
  <Accordion title="Migrações de configuração legada">
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
cada chamada da operadora precisar começar com um contexto novo, por exemplo em fluxos de recepção,
agendamento, IVR ou ponte do Google Meet, nos quais o mesmo número de telefone pode
representar reuniões diferentes.

O Voice Call armazena as chaves de sessão geradas no namespace do agente configurado
(`agent:<agentId>:voice:*`). Chaves explícitas brutas de integração são resolvidas no
mesmo namespace: uma chave canônica `agent:<configuredAgentId>:*` mantém esse
proprietário e respeita os aliases `session.mainKey`/de escopo global do núcleo; entradas
`agent:*` estrangeiras ou malformadas são delimitadas como uma chave opaca sob o agente
configurado; `global` e `unknown` permanecem sentinelas globais.

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
- Provedores de voz em tempo real incluídos: Google Gemini Live (`google`) e OpenAI (`openai`), registrados pelos respectivos plugins de provedor.
- A configuração bruta pertencente ao provedor fica em `realtime.providers.<providerId>`.
- Por padrão, o Voice Call disponibiliza a ferramenta compartilhada de tempo real `openclaw_agent_consult`. O modelo em tempo real pode chamá-la quando quem liga solicitar raciocínio mais aprofundado, informações atuais ou ferramentas normais do OpenClaw.
- `realtime.consultPolicy` adiciona, opcionalmente, orientações sobre quando o modelo em tempo real deve chamar `openclaw_agent_consult`.
- `realtime.agentContext.enabled` fica desativado por padrão. Quando ativado, o Voice Call injeta uma identidade limitada do agente e uma cápsula com arquivos selecionados do workspace nas instruções do provedor em tempo real durante a configuração da sessão.
- `realtime.fastContext.enabled` fica desativado por padrão. Quando ativado, o Voice Call primeiro pesquisa o contexto indexado da memória/sessão para responder à pergunta da consulta e retorna esses trechos ao modelo em tempo real dentro do prazo de `realtime.fastContext.timeoutMs`; ele só recorre ao agente de consulta completo se `realtime.fastContext.fallbackToConsult` for `true`.
- Se `realtime.provider` apontar para um provedor não registrado, ou se nenhum provedor de voz em tempo real estiver registrado, o Voice Call registrará um aviso e ignorará a mídia em tempo real, em vez de causar a falha de todo o plugin.
- `inboundPolicy` não pode ser `"disabled"` quando `realtime.enabled` for `true`; `validateProviderConfig` rejeita essa combinação.
- As chaves da sessão de consulta reutilizam a sessão de chamada armazenada quando disponível e, caso contrário, usam o `sessionScope` configurado (`per-phone` por padrão ou `per-call` para chamadas isoladas).

### Política de ferramentas

`realtime.toolPolicy` controla a execução da consulta:

| Política         | Comportamento                                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Disponibiliza a ferramenta de consulta e limita o agente normal a `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` e `memory_get`.                                       |
| `owner`          | Disponibiliza a ferramenta de consulta e permite que o agente normal use a política normal de ferramentas do agente.                                                                   |
| `none`           | Não disponibiliza a ferramenta de consulta. As ferramentas personalizadas de `realtime.tools` ainda são repassadas ao provedor em tempo real.                                          |

`realtime.consultPolicy` controla somente as instruções do modelo em tempo real:

| Política      | Orientação                                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------- |
| `auto`        | Mantém o prompt padrão e permite que o provedor decida quando chamar a ferramenta de consulta.                        |
| `substantive` | Responde diretamente a interações conversacionais simples e consulta antes de fornecer fatos, memória, ferramentas ou contexto. |
| `always`      | Consulta antes de cada resposta substancial.                                                                          |

### Contexto de voz do agente

Ative `realtime.agentContext` quando a ponte de voz precisar soar como o agente
OpenClaw configurado sem incorrer em uma viagem completa de ida e volta para
consultar o agente em interações comuns. A cápsula de contexto é adicionada uma
única vez quando a sessão em tempo real é criada, portanto não acrescenta
latência a cada interação. As chamadas a `openclaw_agent_consult` ainda executam
o agente OpenClaw completo e devem ser usadas para trabalhos com ferramentas,
informações atuais, consultas à memória ou estado do workspace.

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
    voz `Kore`. `sessionResumption` e `contextWindowCompression` ficam ativados
    por padrão para chamadas mais longas e que podem ser reconectadas. Use
    `silenceDurationMs`, `startSensitivity` e `endSensitivity` para ajustar
    alternâncias de fala mais rápidas no áudio de telefonia.

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

Consulte [Provedor Google](/pt-BR/providers/google) e
[Provedor OpenAI](/pt-BR/providers/openai) para ver opções de voz em tempo real
específicas de cada provedor.

## Transcrição por streaming

`streaming` seleciona um provedor de transcrição em tempo real para o áudio ao vivo das chamadas.

Comportamento atual em tempo de execução:

- `streaming.provider` é opcional. Se não for definido, o Voice Call usará o primeiro provedor de transcrição em tempo real registrado.
- Provedores de transcrição em tempo real incluídos: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) e xAI (`xai`), registrados pelos respectivos plugins de provedor.
- A configuração bruta pertencente ao provedor fica em `streaming.providers.<providerId>`.
- Depois que o Twilio envia uma mensagem `start` de stream aceita, o Voice Call registra o stream imediatamente, enfileira a mídia recebida por meio do provedor de transcrição enquanto ele se conecta e inicia a saudação inicial somente quando a transcrição em tempo real está pronta.
- Se `streaming.provider` apontar para um provedor não registrado, ou se nenhum estiver registrado, o Voice Call registrará um aviso e ignorará o streaming de mídia, em vez de causar a falha de todo o plugin.

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
    Padrões: chave de API `streaming.providers.xai.apiKey` ou `XAI_API_KEY`
    (usa como alternativa um perfil de autenticação OAuth da xAI se nenhuma
    delas estiver definida); endpoint `wss://api.x.ai/v1/stt`; codificação
    `mulaw`; taxa de amostragem `8000`; `endpointingMs: 800`;
    `interimResults: true`.

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

O Voice Call usa a configuração principal `messages.tts` para streaming de fala
nas chamadas. Você pode substituí-la na configuração do plugin usando o
**mesmo formato** — ela é mesclada profundamente com `messages.tts`.

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
**A fala da Microsoft é ignorada nas chamadas de voz.** A síntese para telefonia
exige um provedor que implemente saída destinada à telefonia; o provedor de fala
da Microsoft não implementa isso, portanto ele é ignorado nas chamadas e outros
provedores da cadeia de fallback são tentados em seu lugar.
</Warning>

Observações sobre o comportamento:

- As chaves legadas `tts.<provider>` na configuração do plugin (`openai`, `elevenlabs`, `microsoft`, `edge`) são corrigidas por `openclaw doctor --fix`; a configuração persistida deve usar `tts.providers.<provider>`.
- O TTS principal é usado quando o streaming de mídia do Twilio está ativado; caso contrário, as chamadas usam como alternativa as vozes nativas do provedor.
- Se um stream de mídia do Twilio já estiver ativo, o Voice Call não usará o `<Say>` do TwiML como alternativa. Se o TTS de telefonia não estiver disponível nesse estado, a solicitação de reprodução falhará, em vez de combinar dois caminhos de reprodução.
- Quando o TTS de telefonia usa um provedor secundário como alternativa, o Voice Call registra um aviso com a cadeia de provedores (`from`, `to`, `attempts`) para depuração.
- Quando uma interrupção de fala no Twilio ou o encerramento do stream limpa a fila de TTS pendente, as solicitações de reprodução enfileiradas são concluídas, em vez de deixar em espera quem aguarda a conclusão da reprodução.

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
  <Tab title="Substituir pelo ElevenLabs (somente chamadas)">
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

Por padrão, a política de chamadas recebidas é `disabled`. Para ativar chamadas recebidas, defina:

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
A verificação do Webhook autentica a entrega do provedor e a integridade da carga útil,
mas **não** comprova a titularidade do número de chamada PSTN/VoIP. Trate
`allowFrom` como filtragem do identificador de chamadas, não como identidade forte de quem liga.
</Warning>

As respostas automáticas usam o sistema de agentes. Ajuste-as com `responseModel`,
`responseSystemPrompt` e `responseTimeoutMs`.

### Roteamento por número

Use `numbers` quando um plugin de chamadas de voz receber chamadas para vários números
de telefone e cada número precisar se comportar como uma linha diferente. Por exemplo,
um número pode usar um assistente pessoal informal, enquanto outro usa uma persona
empresarial, um agente de resposta diferente e uma voz TTS diferente.

As rotas são selecionadas com base no número `To` discado fornecido pelo provedor. As chaves devem
ser números E.164. Quando uma chamada chega, o recurso de chamadas de voz resolve uma única vez a
rota correspondente, armazena a rota encontrada no registro da chamada e reutiliza essa
configuração efetiva para a saudação, o fluxo clássico de resposta automática, o fluxo de
consulta em tempo real e a reprodução de TTS. Se nenhuma rota corresponder, será usada a
configuração global de chamadas de voz. Chamadas de saída não usam `numbers`; informe
explicitamente o destino, a mensagem e a sessão de saída ao iniciar a chamada.

As substituições de rota atualmente permitem:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

O valor de rota `tts` é mesclado profundamente sobre a configuração global `tts` de chamadas de voz, portanto
geralmente é possível substituir apenas a voz do provedor:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
        },
      },
    },
  },
}
```

### Contrato de saída falada

Para respostas automáticas, o recurso de chamadas de voz acrescenta ao prompt do sistema um contrato
rigoroso de saída falada que exige uma resposta JSON `{"spoken":"..."}`. O recurso de chamadas de voz
extrai o texto da fala de forma defensiva:

- Ignora cargas úteis marcadas como conteúdo de raciocínio/erro.
- Analisa JSON direto, JSON em bloco delimitado ou chaves `"spoken"` embutidas.
- Recua para texto simples e remove parágrafos iniciais que provavelmente contenham planejamento ou metainformações.

Isso mantém a reprodução falada concentrada no texto destinado a quem liga e evita o
vazamento de texto de planejamento para o áudio.

### Comportamento ao iniciar a conversa

Para chamadas `conversation` de saída, o tratamento da primeira mensagem é vinculado ao estado de
reprodução em tempo real:

- A limpeza da fila por interrupção da fala e a resposta automática são suprimidas apenas enquanto a saudação inicial está sendo falada.
- Se a reprodução inicial falhar, a chamada retornará a `listening` e a mensagem inicial permanecerá na fila para uma nova tentativa.
- A reprodução inicial para streaming do Twilio começa quando o fluxo é conectado, sem atraso adicional.
- A interrupção da fala cancela a reprodução ativa e limpa as entradas TTS do Twilio que estão na fila, mas ainda não começaram a ser reproduzidas. As entradas limpas são resolvidas como ignoradas, permitindo que a lógica da resposta subsequente continue sem aguardar um áudio que nunca será reproduzido.
- Conversas de voz em tempo real usam o próprio turno inicial do fluxo em tempo real. O recurso de chamadas de voz **não** publica uma atualização TwiML `<Say>` legada para essa mensagem inicial, portanto as sessões `<Connect><Stream>` de saída permanecem conectadas.

### Período de tolerância para desconexão do fluxo do Twilio

Quando um fluxo de mídia do Twilio é desconectado, o recurso de chamadas de voz aguarda **2000 ms** antes de
encerrar automaticamente a chamada:

- Se o fluxo se reconectar durante esse período, o encerramento automático será cancelado.
- Se nenhum fluxo for registrado novamente após o período de tolerância, a chamada será encerrada para evitar chamadas ativas travadas.

## Coletor de chamadas obsoletas

Use `staleCallReaperSeconds` (padrão: **120**) para encerrar chamadas que nunca são
atendidas nem chegam a um estado de conversa ativa, por exemplo, chamadas no modo
de notificação para as quais o provedor nunca entrega um Webhook terminal. Defina como `0` para
desativar.

O coletor é executado a cada 30 segundos e encerra apenas chamadas que não têm
um carimbo de data e hora `answeredAt` e que ainda não estão em um estado terminal ou ativo
(`speaking`/`listening`), portanto conversas atendidas nunca são coletadas
por esse temporizador; `maxDurationSeconds` (padrão: 300) é o limite separado que
encerra chamadas atendidas que duram demais.

Para fluxos no estilo de notificação em que as operadoras podem demorar para entregar Webhooks
de toque/atendimento, aumente `staleCallReaperSeconds` além do padrão para que chamadas
lentas, porém normais, não sejam coletadas antecipadamente; `120` a `300` segundos é um intervalo
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

Quando um proxy ou túnel fica à frente do Gateway, o plugin reconstrói
a URL pública para verificação da assinatura. Estas opções controlam quais
cabeçalhos encaminhados são confiáveis:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts permitidos nos cabeçalhos de encaminhamento.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Confia em cabeçalhos encaminhados sem uma lista de permissões.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Confia em cabeçalhos encaminhados apenas quando o IP remoto da solicitação corresponde à lista.
</ParamField>

Proteções adicionais:

- A **proteção contra repetição** de Webhooks está habilitada para Twilio, Telnyx e Plivo. Solicitações válidas de Webhook repetidas são confirmadas, mas seus efeitos colaterais são ignorados.
- Os turnos de conversa do Twilio incluem um token por turno nos retornos de chamada de `<Gather>`, portanto retornos de chamada de fala obsoletos ou repetidos não podem satisfazer um turno de transcrição pendente mais recente.
- Solicitações de Webhook não autenticadas são rejeitadas antes da leitura do corpo quando os cabeçalhos de assinatura exigidos pelo provedor estão ausentes.
- O Webhook de chamadas de voz usa o perfil compartilhado de leitura do corpo antes da autenticação (corpo máximo de 64 KB, tempo limite de leitura de 5 segundos), além de um limite por chave para solicitações em andamento (8 solicitações simultâneas por chave por padrão) antes da verificação da assinatura.

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

Quando o Gateway já está em execução, os comandos operacionais `voicecall`
delegam ao runtime de chamadas de voz pertencente ao Gateway, para que a CLI não associe um
segundo servidor de Webhook. Se nenhum Gateway estiver acessível, os comandos recorrerão a
um runtime independente da CLI.

`latency` lê `calls.jsonl` no caminho de armazenamento padrão de chamadas de voz. Use
`--file <path>` para indicar outro registro e `--last <n>` para limitar
a análise aos últimos N registros (padrão: 200). A saída inclui mínimo/máximo/média,
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

O plugin de chamadas de voz inclui uma Skill de agente correspondente.

## RPC do Gateway

| Método                      | Argumentos                                                       | Observações                                                                 |
| --------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?` | Recua para a configuração `toNumber` quando `to` é omitido.                  |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`        | Igual a `initiate`, mas também aceita `dtmfSequence` antes da conexão.       |
| `voicecall.continue`        | `callId`, `message`                                              | Bloqueia até a conclusão do turno; retorna a transcrição.                    |
| `voicecall.continue.start`  | `callId`, `message`                                              | Variante assíncrona: retorna imediatamente um `operationId`.                 |
| `voicecall.continue.result` | `operationId`                                                    | Consulta o resultado de uma operação `voicecall.continue.start` pendente.   |
| `voicecall.speak`           | `callId`, `message`                                              | Fala sem aguardar; usa a ponte em tempo real quando `realtime.enabled`.      |
| `voicecall.dtmf`            | `callId`, `digits`                                               |                                                                             |
| `voicecall.end`             | `callId`                                                         |                                                                             |
| `voicecall.status`          | `callId?`                                                        | Omita `callId` para listar todas as chamadas ativas.                         |

`dtmfSequence` só é válido com `mode: "conversation"`; chamadas no modo de notificação
devem usar `voicecall.dtmf` depois que a chamada existir, caso precisem de dígitos
após a conexão.

## Solução de problemas

### Falha na configuração da exposição do Webhook

Execute a configuração no mesmo ambiente que executa o Gateway:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Para `twilio`, `telnyx` e `plivo`, `webhook-exposure` deve estar verde. Uma
`publicUrl` configurada ainda falhará se apontar para um espaço de rede local ou
privado, pois a operadora não consegue retornar chamadas para esses endereços.
Não use `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` ou outros intervalos de NAT
de nível de operadora como `publicUrl`.

Chamadas de saída no modo de notificação do Twilio enviam o TwiML `<Say>` inicial diretamente
na solicitação de criação da chamada, portanto a primeira mensagem falada não depende de
o Twilio buscar o TwiML do Webhook. Um Webhook público ainda é necessário para retornos de
chamada de status, chamadas de conversa, DTMF antes da conexão, fluxos em tempo real e
controle de chamadas após a conexão.

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

`voicecall smoke` é uma simulação, a menos que você informe `--yes`.

### Falha nas credenciais do provedor

Verifique o provedor selecionado e os campos de credenciais obrigatórios:

- Twilio: `twilio.accountSid`, `twilio.authToken` e `fromNumber`, ou
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` e
  `fromNumber`, ou `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` e
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` e `fromNumber`, ou
  `PLIVO_AUTH_ID` e `PLIVO_AUTH_TOKEN`.

As credenciais devem existir no host do Gateway. Editar um perfil do shell local
não afeta um Gateway que já esteja em execução até que ele seja reiniciado ou
recarregue seu ambiente.

### As chamadas são iniciadas, mas os Webhooks do provedor não chegam

Confirme se o console do provedor aponta para a URL pública exata do Webhook:

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
- A URL do túnel mudou após o início do Gateway.
- Um proxy encaminha a solicitação, mas remove ou reescreve os cabeçalhos de host/protocolo.
- O firewall ou DNS direciona o nome do host público para outro lugar, em vez do Gateway.
- O Gateway foi reiniciado sem o Plugin de Chamadas de Voz habilitado.

Quando houver um proxy reverso ou túnel diante do Gateway, defina
`webhookSecurity.allowedHosts` como o nome do host público ou use
`webhookSecurity.trustedProxyIPs` para um endereço de proxy conhecido. Use
`webhookSecurity.trustForwardingHeaders` somente quando o limite do proxy
estiver sob seu controle.

### A verificação da assinatura falha

As assinaturas do provedor são verificadas em relação à URL pública que o OpenClaw
reconstrói a partir da solicitação recebida. Se as assinaturas falharem:

- Confirme se a URL do Webhook do provedor corresponde exatamente a `publicUrl`, incluindo esquema, host e caminho.
- Para URLs do plano gratuito do ngrok, atualize `publicUrl` quando o nome do host do túnel mudar.
- Garanta que o proxy preserve os cabeçalhos originais de host e protocolo ou configure `webhookSecurity.allowedHosts`.
- Não habilite `skipSignatureVerification` fora de testes locais.

### As entradas do Google Meet pelo Twilio falham

O Google Meet usa este Plugin para entradas por discagem pelo Twilio. Primeiro, verifique
as Chamadas de Voz:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Em seguida, verifique explicitamente o transporte do Google Meet:

```bash
openclaw googlemeet setup --transport twilio
```

Se as Chamadas de Voz estiverem funcionando, mas o participante nunca entrar na reunião, verifique
o número de discagem do Meet, o PIN e `--dtmf-sequence`. A chamada telefônica pode estar funcionando
enquanto a reunião rejeita ou ignora uma sequência DTMF incorreta.

O Google Meet inicia o segmento telefônico do Twilio por meio de `voicecall.start` com uma
sequência DTMF anterior à conexão. As sequências derivadas do PIN incluem o
`voiceCall.dtmfDelayMs` do Plugin do Google Meet (padrão: **12000 ms**) como dígitos
de espera iniciais do Twilio, pois os avisos da discagem do Meet podem chegar com atraso.
As Chamadas de Voz então redirecionam de volta para o processamento em tempo real antes que
a saudação introdutória seja solicitada.

Use `openclaw logs --follow` para acompanhar as fases em tempo real. Uma entrada bem-sucedida
em uma reunião do Meet pelo Twilio registra esta ordem:

- O Google Meet delega a entrada pelo Twilio às Chamadas de Voz.
- As Chamadas de Voz armazenam o TwiML de DTMF anterior à conexão.
- O TwiML inicial do Twilio é consumido e fornecido antes do processamento em tempo real.
- As Chamadas de Voz fornecem o TwiML em tempo real para a chamada do Twilio.
- O Google Meet solicita a fala introdutória com `voicecall.speak` após o atraso posterior ao DTMF.

`openclaw voicecall tail` ainda mostra os registros persistidos das chamadas; isso é útil para
o estado e as transcrições das chamadas, mas nem toda transição de Webhook ou em tempo real
aparece ali.

### A chamada em tempo real não tem fala

Confirme se apenas um modo de áudio está habilitado: `realtime.enabled` e
`streaming.enabled` não podem ser ambos verdadeiros.

Para chamadas em tempo real do Twilio/Telnyx, verifique também:

- Um Plugin de provedor em tempo real está carregado e registrado.
- `realtime.provider` não está definido ou nomeia um provedor registrado.
- A chave da API do provedor está disponível para o processo do Gateway.
- `openclaw logs --follow` mostra o TwiML em tempo real fornecido, a ponte em tempo real iniciada e a saudação inicial adicionada à fila.

## Relacionado

- [Modo de conversa](/pt-BR/nodes/talk)
- [Conversão de texto em fala](/pt-BR/tools/tts)
- [Ativação por voz](/pt-BR/nodes/voicewake)
