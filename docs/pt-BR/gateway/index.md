---
read_when:
    - Executar ou depurar o processo do gateway
summary: Runbook do serviço Gateway, ciclo de vida e operações
title: Runbook do Gateway
x-i18n:
    generated_at: "2026-04-24T05:52:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6192a38447424b7e9437a7420f37d08fc38d27b736ce8c30347e6d52e3430600
    source_path: gateway/index.md
    workflow: 15
---

Use esta página para a inicialização no dia 1 e operações no dia 2 do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Solução de problemas aprofundada" icon="siren" href="/pt-BR/gateway/troubleshooting">
    Diagnósticos orientados por sintoma com sequências exatas de comandos e assinaturas de log.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Guia de configuração orientado por tarefa + referência completa de configuração.
  </Card>
  <Card title="Gerenciamento de segredos" icon="key-round" href="/pt-BR/gateway/secrets">
    Contrato de SecretRef, comportamento de snapshot de runtime e operações de migração/reload.
  </Card>
  <Card title="Contrato do plano de segredos" icon="shield-check" href="/pt-BR/gateway/secrets-plan-contract">
    Regras exatas de alvo/caminho de `secrets apply` e comportamento de perfil de autenticação somente com refs.
  </Card>
</CardGroup>

## Inicialização local em 5 minutos

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

Linha de base saudável: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` correspondendo ao que você espera. Use `openclaw gateway status --require-rpc` quando precisar de comprovação de RPC com escopo de leitura, não apenas de alcançabilidade.

  </Step>

  <Step title="Validar a prontidão do canal">

```bash
openclaw channels status --probe
```

Com um gateway alcançável, isso executa probes de canal ao vivo por conta e auditorias opcionais.
Se o gateway estiver inalcançável, a CLI recua para resumos de canal baseados apenas em configuração,
em vez de saída de probe ao vivo.

  </Step>
</Steps>

<Note>
O reload de configuração do Gateway monitora o caminho do arquivo de configuração ativo (resolvido a partir dos padrões de perfil/estado, ou `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
Após o primeiro carregamento bem-sucedido, o processo em execução serve o snapshot ativo de configuração em memória; um reload bem-sucedido troca esse snapshot atomicamente.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, plano de controle e conexões de canal.
- Uma única porta multiplexada para:
  - controle/RPC por WebSocket
  - APIs HTTP, compatíveis com OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI e hooks
- Modo de bind padrão: `loopback`.
- A autenticação é obrigatória por padrão. Configurações com segredo compartilhado usam
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e configurações de proxy reverso
  fora de loopback podem usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatíveis com OpenAI

A superfície de compatibilidade de maior impacto do OpenClaw agora é:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por que esse conjunto importa:

- A maioria das integrações com Open WebUI, LobeChat e LibreChat faz probe em `/v1/models` primeiro.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos de agente estão cada vez mais preferindo `/v1/responses`.

Observação de planejamento:

- `/v1/models` é agent-first: ele retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` é o alias estável que sempre aponta para o agente padrão configurado.
- Use `x-openclaw-model` quando quiser uma sobrescrita de provedor/modelo de backend; caso contrário, a configuração normal de modelo e embedding do agente selecionado continua no controle.

Todos eles são executados na porta principal do Gateway e usam o mesmo limite de autenticação de operador confiável que o restante da API HTTP do Gateway.

### Precedência de porta e bind

| Configuração | Ordem de resolução                                             |
| ------------ | -------------------------------------------------------------- |
| Porta do Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind | CLI/sobrescrita → `gateway.bind` → `loopback`                  |

### Modos de hot reload

| `gateway.reload.mode` | Comportamento                              |
| --------------------- | ------------------------------------------ |
| `off`                 | Sem reload de configuração                 |
| `hot`                 | Aplica apenas alterações seguras para hot  |
| `restart`             | Reinicia em alterações que exigem reload   |
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

`gateway status --deep` é para descoberta extra de serviços (LaunchDaemons/unidades systemd do sistema/schtasks), não para um probe de saúde RPC mais profundo.

## Múltiplos gateways (mesmo host)

A maioria das instalações deve executar um gateway por máquina. Um único gateway pode hospedar múltiplos
agentes e canais.

Você só precisa de múltiplos gateways quando deseja intencionalmente isolamento ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode relatar `Other gateway-like services detected (best effort)`
  e imprimir dicas de limpeza quando instalações launchd/systemd/schtasks obsoletas ainda estiverem presentes.
- `gateway probe` pode avisar sobre `multiple reachable gateways` quando mais de um alvo
  responder.
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

## Acesso remoto

Preferido: Tailscale/VPN.
Fallback: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Depois conecte os clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Túneis SSH não ignoram a autenticação do gateway. Para autenticação com segredo compartilhado, os clientes ainda
devem enviar `token`/`password` mesmo pelo túnel. Para modos com identidade,
a requisição ainda precisa satisfazer esse caminho de autenticação.
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

Os rótulos de LaunchAgent são `ai.openclaw.gateway` (padrão) ou `ai.openclaw.<profile>` (perfil nomeado). `openclaw doctor` audita e repara deriva de configuração do serviço.

  </Tab>

  <Tab title="Linux (systemd do usuário)">

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

A inicialização gerenciada nativa do Windows usa uma Tarefa Agendada chamada `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` para perfis nomeados). Se a criação da Tarefa Agendada
for negada, o OpenClaw recua para um iniciador por usuário na pasta Inicializar
que aponta para `gateway.cmd` dentro do diretório de estado.

  </Tab>

  <Tab title="Linux (serviço de sistema)">

Use uma unidade de sistema para hosts multiusuário/sempre ativos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Use o mesmo corpo de serviço da unidade de usuário, mas instale-o em
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e ajuste
`ExecStart=` se o binário `openclaw` estiver em outro local.

  </Tab>
</Tabs>

## Caminho rápido do perfil dev

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
- Requisições: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos do ciclo de vida de pareamento/aprovação e `shutdown`.

Execuções de agente têm duas etapas:

1. Ack imediato de aceitação (`status:"accepted"`)
2. Resposta final de conclusão (`status:"ok"|"error"`), com eventos `agent` transmitidos no meio.

Consulte a documentação completa do protocolo: [Gateway Protocol](/pt-BR/gateway/protocol).

## Verificações operacionais

### Vitalidade

- Abra WS e envie `connect`.
- Espere resposta `hello-ok` com snapshot.

### Prontidão

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperação de lacunas

Eventos não são reproduzidos novamente. Em lacunas de sequência, atualize o estado (`health`, `system-presence`) antes de continuar.

## Assinaturas comuns de falha

| Assinatura                                                   | Problema provável                                                                |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                  | Bind fora de loopback sem um caminho válido de autenticação do gateway           |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                                                                |
| `Gateway start blocked: set gateway.mode=local`              | Configuração definida para modo remoto, ou carimbo de modo local ausente em uma configuração danificada |
| `unauthorized` durante `connect`                             | Incompatibilidade de autenticação entre cliente e gateway                        |

Para sequências completas de diagnóstico, use [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rapidamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- Primeiros frames inválidos/não `connect` são rejeitados e a conexão é fechada.
- O desligamento gracioso emite evento `shutdown` antes do fechamento do socket.

---

Relacionado:

- [Solução de problemas](/pt-BR/gateway/troubleshooting)
- [Processo em segundo plano](/pt-BR/gateway/background-process)
- [Configuração](/pt-BR/gateway/configuration)
- [Saúde](/pt-BR/gateway/health)
- [Doctor](/pt-BR/gateway/doctor)
- [Autenticação](/pt-BR/gateway/authentication)

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
