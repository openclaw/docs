---
read_when:
    - Executando ou depurando o processo do Gateway
summary: Runbook para o serviço Gateway, ciclo de vida e operações
title: Runbook do Gateway
x-i18n:
    generated_at: "2026-04-26T11:28:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 775c7288ce1fa666f65c0fc4ff1fc06b0cd14589fc932af1944ac7eeb126729c
    source_path: gateway/index.md
    workflow: 15
---

Use esta página para startup no primeiro dia e operações do segundo dia do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Solução de problemas detalhada" icon="siren" href="/pt-BR/gateway/troubleshooting">
    Diagnósticos orientados por sintomas com sequências exatas de comandos e assinaturas de log.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Guia de configuração orientado por tarefas + referência completa de configuração.
  </Card>
  <Card title="Gerenciamento de segredos" icon="key-round" href="/pt-BR/gateway/secrets">
    Contrato SecretRef, comportamento de snapshot em runtime e operações de migração/reload.
  </Card>
  <Card title="Contrato de plano de segredos" icon="shield-check" href="/pt-BR/gateway/secrets-plan-contract">
    Regras exatas de alvo/caminho de `secrets apply` e comportamento de perfis de autenticação somente por ref.
  </Card>
</CardGroup>

## Startup local em 5 minutos

<Steps>
  <Step title="Iniciar o Gateway">

```bash
openclaw gateway --port 18789
# debug/trace espelhado para stdio
openclaw gateway --port 18789 --verbose
# força o encerramento do listener na porta selecionada e depois inicia
openclaw gateway --force
```

  </Step>

  <Step title="Verificar a integridade do serviço">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Linha de base saudável: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` correspondendo ao que você espera. Use `openclaw gateway status --require-rpc` quando precisar de prova de RPC com escopo de leitura, não apenas de alcançabilidade.

  </Step>

  <Step title="Validar a prontidão do canal">

```bash
openclaw channels status --probe
```

Com um Gateway acessível, isso executa probes live por conta de canal e auditorias opcionais.
Se o Gateway estiver inacessível, a CLI faz fallback para resumos de canal somente de configuração em vez
da saída de probe live.

  </Step>
</Steps>

<Note>
O reload de configuração do Gateway observa o caminho do arquivo de configuração ativo (resolvido a partir dos padrões de perfil/estado, ou `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
Após o primeiro carregamento bem-sucedido, o processo em execução serve o snapshot ativo de configuração em memória; um reload bem-sucedido troca esse snapshot atomicamente.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, plano de controle e conexões de canal.
- Uma única porta multiplexada para:
  - controle/RPC por WebSocket
  - APIs HTTP, compatíveis com OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI de Controle e hooks
- Modo de bind padrão: `loopback`.
- Auth é exigida por padrão. Configurações com segredo compartilhado usam
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e configurações não loopback
  com reverse proxy podem usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatíveis com OpenAI

A superfície de compatibilidade de maior alavancagem do OpenClaw agora é:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por que esse conjunto importa:

- A maioria das integrações com Open WebUI, LobeChat e LibreChat testa `/v1/models` primeiro.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos de agentes preferem cada vez mais `/v1/responses`.

Observação de planejamento:

- `/v1/models` é agent-first: ele retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` é o alias estável que sempre aponta para o agente padrão configurado.
- Use `x-openclaw-model` quando quiser uma substituição de backend provedor/modelo; caso contrário, o modelo normal e a configuração de embeddings do agente selecionado continuam no controle.

Todos eles são executados na porta principal do Gateway e usam o mesmo limite de auth de operador confiável que o restante da API HTTP do Gateway.

### Precedência de porta e bind

| Configuração   | Ordem de resolução                                              |
| -------------- | --------------------------------------------------------------- |
| Porta do Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind   | CLI/override → `gateway.bind` → `loopback`                      |

O startup do Gateway usa a mesma porta e bind efetivos quando inicializa as
origens locais da UI de Controle para binds não loopback. Por exemplo, `--bind lan --port 3000`
inicializa `http://localhost:3000` e `http://127.0.0.1:3000` antes de a validação
de runtime ser executada. Adicione explicitamente quaisquer origens remotas de navegador, como URLs HTTPS de proxy, a
`gateway.controlUi.allowedOrigins`.

### Modos de hot reload

| `gateway.reload.mode` | Comportamento                              |
| --------------------- | ------------------------------------------ |
| `off`                 | Sem reload de configuração                 |
| `hot`                 | Aplica apenas mudanças seguras para hot reload |
| `restart`             | Reinicia em mudanças que exigem reload     |
| `hybrid` (padrão)     | Aplica hot quando seguro, reinicia quando necessário |

## Conjunto de comandos do operador

```bash
openclaw gateway status
openclaw gateway status --deep   # adiciona uma varredura de serviço em nível de sistema
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` é para descoberta extra de serviços (LaunchDaemons/unidades systemd do sistema
/schtasks), não um probe de integridade RPC mais profundo.

## Vários Gateways (mesmo host)

A maioria das instalações deve executar um Gateway por máquina. Um único Gateway pode hospedar vários
agentes e canais.

Você só precisa de vários Gateways quando quiser intencionalmente isolamento ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode reportar `Other gateway-like services detected (best effort)`
  e imprimir dicas de limpeza quando instalações antigas de launchd/systemd/schtasks ainda estiverem presentes.
- `gateway probe` pode avisar sobre `multiple reachable gateways` quando mais de um alvo
  responder.
- Se isso for intencional, isole portas, configuração/estado e raízes de workspace por Gateway.

Checklist por instância:

- `gateway.port` exclusivo
- `OPENCLAW_CONFIG_PATH` exclusivo
- `OPENCLAW_STATE_DIR` exclusivo
- `agents.defaults.workspace` exclusivo

Exemplo:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

Configuração detalhada: [/gateway/multiple-gateways](/pt-BR/gateway/multiple-gateways).

## Endpoint de cérebro em tempo real do VoiceClaw

O OpenClaw expõe um endpoint WebSocket em tempo real compatível com VoiceClaw em
`/voiceclaw/realtime`. Use-o quando um cliente desktop VoiceClaw precisar se comunicar
diretamente com um cérebro OpenClaw em tempo real em vez de passar por um processo de relay
separado.

O endpoint usa Gemini Live para áudio em tempo real e chama o OpenClaw como
cérebro ao expor ferramentas do OpenClaw diretamente ao Gemini Live. Chamadas de ferramenta retornam um
resultado imediato `working` para manter o turno de voz responsivo, depois o OpenClaw
executa a ferramenta real de forma assíncrona e injeta o resultado de volta na
sessão live. Defina `GEMINI_API_KEY` no ambiente do processo do Gateway. Se
a auth do Gateway estiver ativada, o cliente desktop enviará o token ou a senha do Gateway
na primeira mensagem `session.config`.

O acesso ao cérebro em tempo real executa comandos de agente OpenClaw autorizados ao owner. Mantenha
`gateway.auth.mode: "none"` limitado a instâncias de teste somente loopback. Conexões
não locais ao cérebro em tempo real exigem auth do Gateway.

Para um Gateway de teste isolado, execute uma instância separada com porta, configuração
e estado próprios:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Depois configure o VoiceClaw para usar:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Acesso remoto

Preferido: Tailscale/VPN.
Fallback: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Depois conecte os clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Túneis SSH não ignoram a auth do Gateway. Para auth com segredo compartilhado, os clientes ainda
devem enviar `token`/`password` mesmo pelo túnel. Para modos com identidade,
a requisição ainda precisa satisfazer esse caminho de auth.
</Warning>

Consulte: [Gateway remoto](/pt-BR/gateway/remote), [Autenticação](/pt-BR/gateway/authentication), [Tailscale](/pt-BR/gateway/tailscale).

## Supervisão e ciclo de vida do serviço

Use execuções supervisionadas para confiabilidade semelhante à de produção.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Use `openclaw gateway restart` para reinicializações. Não encadeie `openclaw gateway stop` e `openclaw gateway start`; no macOS, `gateway stop` desativa intencionalmente o LaunchAgent antes de pará-lo.

Rótulos de LaunchAgent são `ai.openclaw.gateway` (padrão) ou `ai.openclaw.<profile>` (perfil nomeado). `openclaw doctor` audita e repara desvios de configuração do serviço.

  </Tab>

  <Tab title="Linux (systemd de usuário)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistência após logout, ative lingering:

```bash
sudo loginctl enable-linger <user>
```

Exemplo manual de unidade de usuário quando você precisa de um caminho de instalação personalizado:

```ini
[Unit]
Description=OpenClaw Gateway
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

  </Tab>

  <Tab title="Windows (nativo)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

O startup gerenciado nativo do Windows usa uma Scheduled Task chamada `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` para perfis nomeados). Se a criação da Scheduled Task
for negada, o OpenClaw faz fallback para um iniciador por usuário na pasta Startup
apontando para `gateway.cmd` dentro do diretório de estado.

  </Tab>

  <Tab title="Linux (serviço do sistema)">

Use uma unidade do sistema para hosts multiusuário/sempre ativos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Use o mesmo corpo de serviço da unidade de usuário, mas instale-o em
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e ajuste
`ExecStart=` se o seu binário `openclaw` estiver em outro local.

  </Tab>
</Tabs>

## Caminho rápido do perfil dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Os padrões incluem estado/configuração isolados e porta base do Gateway `19001`.

## Referência rápida do protocolo (visão do operador)

- O primeiro frame do cliente deve ser `connect`.
- O Gateway retorna o snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limits/policy).
- `hello-ok.features.methods` / `events` são uma lista conservadora de descoberta, não
  um dump gerado de toda rota auxiliar chamável.
- Requisições: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos de ciclo de vida de pareamento/aprovação e `shutdown`.

Execuções de agente têm duas etapas:

1. Ack imediato de aceitação (`status:"accepted"`)
2. Resposta final de conclusão (`status:"ok"|"error"`), com eventos `agent` em streaming no meio.

Consulte a documentação completa do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

## Verificações operacionais

### Liveness

- Abra WS e envie `connect`.
- Espere uma resposta `hello-ok` com snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperação de lacunas

Eventos não são reproduzidos. Em lacunas de sequência, atualize o estado (`health`, `system-presence`) antes de continuar.

## Assinaturas comuns de falha

| Assinatura                                                     | Problema provável                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind não loopback sem um caminho válido de auth do Gateway                       |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                                                                |
| `Gateway start blocked: set gateway.mode=local`                | Configuração definida para modo remoto, ou o carimbo de modo local está ausente em uma configuração danificada |
| `unauthorized` during connect                                  | Incompatibilidade de auth entre cliente e Gateway                                |

Para sequências completas de diagnóstico, use [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rapidamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- Primeiros frames inválidos/não `connect` são rejeitados e a conexão é encerrada.
- O desligamento gracioso emite o evento `shutdown` antes do fechamento do socket.

---

Relacionado:

- [Solução de problemas](/pt-BR/gateway/troubleshooting)
- [Processo em segundo plano](/pt-BR/gateway/background-process)
- [Configuração](/pt-BR/gateway/configuration)
- [Integridade](/pt-BR/gateway/health)
- [Doctor](/pt-BR/gateway/doctor)
- [Autenticação](/pt-BR/gateway/authentication)

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
