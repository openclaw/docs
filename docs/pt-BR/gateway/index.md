---
read_when:
    - Executando ou depurando o processo do gateway
summary: Runbook do serviço Gateway, ciclo de vida e operações
title: Runbook do Gateway
x-i18n:
    generated_at: "2026-04-25T13:46:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1d82474bc6485cc14a0be74154e08ba54455031cdae37916de5bc615d3e01a4
    source_path: gateway/index.md
    workflow: 15
---

Use esta página para operações do dia 1 de inicialização e do dia 2 do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Solução de problemas detalhada" icon="siren" href="/pt-BR/gateway/troubleshooting">
    Diagnósticos orientados por sintomas com sequências exatas de comandos e assinaturas de logs.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Guia de configuração orientado a tarefas + referência completa de configuração.
  </Card>
  <Card title="Gerenciamento de segredos" icon="key-round" href="/pt-BR/gateway/secrets">
    Contrato do SecretRef, comportamento de snapshot em runtime e operações de migração/reload.
  </Card>
  <Card title="Contrato do plano de segredos" icon="shield-check" href="/pt-BR/gateway/secrets-plan-contract">
    Regras exatas de alvo/caminho de `secrets apply` e comportamento de perfil de autenticação somente por ref.
  </Card>
</CardGroup>

## Inicialização local em 5 minutos

<Steps>
  <Step title="Inicie o Gateway">

```bash
openclaw gateway --port 18789
# debug/trace espelhado em stdio
openclaw gateway --port 18789 --verbose
# mata à força o listener na porta selecionada e depois inicia
openclaw gateway --force
```

  </Step>

  <Step title="Verifique a integridade do serviço">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Linha de base saudável: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` correspondente ao que você espera. Use `openclaw gateway status --require-rpc` quando precisar de prova de RPC com escopo de leitura, e não apenas de acessibilidade.

  </Step>

  <Step title="Valide a prontidão do canal">

```bash
openclaw channels status --probe
```

Com um gateway acessível, isso executa sondagens ativas por conta de canal e auditorias opcionais.
Se o gateway estiver inacessível, a CLI recorre a resumos de canal somente da configuração em vez
de saída de sondagem ativa.

  </Step>
</Steps>

<Note>
O recarregamento de configuração do Gateway observa o caminho do arquivo de configuração ativo (resolvido a partir dos padrões de perfil/estado, ou `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
Após o primeiro carregamento bem-sucedido, o processo em execução serve o snapshot de configuração ativo em memória; um recarregamento bem-sucedido troca esse snapshot de forma atômica.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, plano de controle e conexões de canal.
- Uma única porta multiplexada para:
  - controle/RPC via WebSocket
  - APIs HTTP, compatíveis com OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI e hooks
- Modo padrão de bind: `loopback`.
- A autenticação é obrigatória por padrão. Configurações com segredo compartilhado usam
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e configurações de
  proxy reverso não loopback podem usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatíveis com OpenAI

A superfície de compatibilidade de maior alavancagem do OpenClaw agora é:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por que esse conjunto importa:

- A maioria das integrações com Open WebUI, LobeChat e LibreChat consulta `/v1/models` primeiro.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos de agentes estão cada vez mais preferindo `/v1/responses`.

Observação de planejamento:

- `/v1/models` é agent-first: ele retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` é o alias estável que sempre aponta para o agente padrão configurado.
- Use `x-openclaw-model` quando quiser uma substituição de provedor/modelo de backend; caso contrário, o modelo normal e a configuração de embeddings do agente selecionado continuam no controle.

Todos esses endpoints são executados na porta principal do Gateway e usam o mesmo limite de autenticação de operador confiável que o restante da API HTTP do Gateway.

### Precedência de porta e bind

| Configuração  | Ordem de resolução                                            |
| ------------- | ------------------------------------------------------------- |
| Porta do Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind  | CLI/override → `gateway.bind` → `loopback`                    |

### Modos de hot reload

| `gateway.reload.mode` | Comportamento                                |
| --------------------- | -------------------------------------------- |
| `off`                 | Sem recarregamento de configuração           |
| `hot`                 | Aplica apenas alterações seguras para hot reload |
| `restart`             | Reinicia em alterações que exigem reload     |
| `hybrid` (padrão)     | Hot-apply quando seguro, reinicia quando necessário |

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
/schtasks), não para uma sondagem RPC de integridade mais profunda.

## Múltiplos gateways (mesmo host)

A maioria das instalações deve executar um gateway por máquina. Um único gateway pode hospedar vários
agentes e canais.

Você só precisa de vários gateways quando deseja intencionalmente isolamento ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode informar `Other gateway-like services detected (best effort)`
  e exibir dicas de limpeza quando instalações antigas de launchd/systemd/schtasks ainda estiverem presentes.
- `gateway probe` pode avisar sobre `multiple reachable gateways` quando mais de um alvo
  responde.
- Se isso for intencional, isole portas, configuração/estado e raízes de workspace por gateway.

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

## Endpoint de brain em tempo real do VoiceClaw

O OpenClaw expõe um endpoint WebSocket em tempo real compatível com VoiceClaw em
`/voiceclaw/realtime`. Use-o quando um cliente desktop do VoiceClaw precisar se comunicar
diretamente com um brain OpenClaw em tempo real em vez de passar por um processo de relay separado.

O endpoint usa Gemini Live para áudio em tempo real e chama o OpenClaw como o
brain ao expor ferramentas do OpenClaw diretamente ao Gemini Live. Chamadas de ferramenta retornam um
resultado imediato `working` para manter o turno de voz responsivo; em seguida, o OpenClaw
executa a ferramenta real de forma assíncrona e injeta o resultado de volta na
sessão ativa. Defina `GEMINI_API_KEY` no ambiente do processo do gateway. Se a
autenticação do gateway estiver habilitada, o cliente desktop enviará o token ou a senha do gateway
na sua primeira mensagem `session.config`.

O acesso ao brain em tempo real executa comandos de agente OpenClaw autorizados pelo proprietário. Mantenha
`gateway.auth.mode: "none"` limitado a instâncias de teste somente loopback. Conexões não locais com o brain em tempo real exigem autenticação do gateway.

Para um gateway de teste isolado, execute uma instância separada com sua própria porta, configuração
e estado:

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

Depois conecte clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Túneis SSH não ignoram a autenticação do gateway. Para autenticação com segredo compartilhado, os clientes ainda
devem enviar `token`/`password` mesmo pelo túnel. Para modos com identidade, a
solicitação ainda precisa satisfazer esse caminho de autenticação.
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

Os rótulos de LaunchAgent são `ai.openclaw.gateway` (padrão) ou `ai.openclaw.<profile>` (perfil nomeado). `openclaw doctor` audita e corrige desvios na configuração do serviço.

  </Tab>

  <Tab title="Linux (systemd do usuário)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistência após logout, habilite lingering:

```bash
sudo loginctl enable-linger <user>
```

Exemplo manual de unidade de usuário quando você precisar de um caminho de instalação personalizado:

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

A inicialização gerenciada nativa do Windows usa uma Tarefa Agendada chamada `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` para perfis nomeados). Se a criação da Tarefa Agendada
for negada, o OpenClaw recorre a um inicializador por usuário na pasta Startup
que aponta para `gateway.cmd` dentro do diretório de estado.

  </Tab>

  <Tab title="Linux (serviço do sistema)">

Use uma unidade de sistema para hosts multiusuário/sempre ativos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Use o mesmo corpo de serviço da unidade de usuário, mas instale-o em
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e ajuste
`ExecStart=` se seu binário `openclaw` estiver em outro local.

  </Tab>
</Tabs>

## Caminho rápido de perfil dev

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Os padrões incluem estado/configuração isolados e porta base do gateway `19001`.

## Referência rápida de protocolo (visão do operador)

- O primeiro frame do cliente deve ser `connect`.
- O Gateway retorna o snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limites/política).
- `hello-ok.features.methods` / `events` são uma lista conservadora de descoberta, não
  um dump gerado de todas as rotas auxiliares chamáveis.
- Solicitações: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos de ciclo de vida de pairing/aprovação e `shutdown`.

Execuções de agente têm duas etapas:

1. Ack imediato de aceitação (`status:"accepted"`)
2. Resposta final de conclusão (`status:"ok"|"error"`), com eventos `agent` em streaming no meio.

Consulte a documentação completa do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

## Verificações operacionais

### Liveness

- Abra WS e envie `connect`.
- Espere resposta `hello-ok` com snapshot.

### Readiness

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperação de lacunas

Eventos não são reproduzidos. Em lacunas de sequência, atualize o estado (`health`, `system-presence`) antes de continuar.

## Assinaturas comuns de falha

| Assinatura                                                     | Problema provável                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Bind não loopback sem um caminho válido de autenticação do gateway              |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                                                               |
| `Gateway start blocked: set gateway.mode=local`                | Configuração definida para modo remoto, ou carimbo de modo local ausente em uma configuração danificada |
| `unauthorized` durante `connect`                               | Incompatibilidade de autenticação entre cliente e gateway                       |

Para sequências completas de diagnóstico, use [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rapidamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- Frames iniciais inválidos/não `connect` são rejeitados e a conexão é fechada.
- O desligamento gracioso emite um evento `shutdown` antes do fechamento do socket.

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
