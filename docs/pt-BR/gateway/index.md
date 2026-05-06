---
read_when:
    - Executando ou depurando o processo do Gateway
summary: Guia operacional para o serviço Gateway, ciclo de vida e operações
title: Manual de operações do Gateway
x-i18n:
    generated_at: "2026-05-06T05:54:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 592eb379cc75402246676cbb23b1dca39b98f559c214c92983b5a3685cff7ab7
    source_path: gateway/index.md
    workflow: 16
---

Use esta página para a inicialização no dia 1 e as operações no dia 2 do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Solução de problemas aprofundada" icon="siren" href="/pt-BR/gateway/troubleshooting">
    Diagnósticos orientados por sintomas com sequências exatas de comandos e assinaturas de logs.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Guia de configuração orientado por tarefas + referência completa de configuração.
  </Card>
  <Card title="Gerenciamento de segredos" icon="key-round" href="/pt-BR/gateway/secrets">
    Contrato SecretRef, comportamento de snapshot em runtime e operações de migração/recarga.
  </Card>
  <Card title="Contrato de plano de segredos" icon="shield-check" href="/pt-BR/gateway/secrets-plan-contract">
    Regras exatas de destino/caminho de `secrets apply` e comportamento de perfil de autenticação somente por referência.
  </Card>
</CardGroup>

## Inicialização local em 5 minutos

<Steps>
  <Step title="Inicie o Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verifique a integridade do serviço">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Linha de base saudável: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` que corresponda ao que você espera. Use `openclaw gateway status --require-rpc` quando precisar de prova de RPC com escopo de leitura, não apenas alcançabilidade.

  </Step>

  <Step title="Valide a prontidão do canal">

```bash
openclaw channels status --probe
```

Com um gateway alcançável, isso executa sondagens de canal ao vivo por conta e auditorias opcionais.
Se o gateway estiver inalcançável, a CLI volta para resumos de canal somente por configuração em vez
da saída de sondagem ao vivo.

  </Step>
</Steps>

<Note>
A recarga de configuração do Gateway observa o caminho do arquivo de configuração ativo (resolvido a partir dos padrões de perfil/estado, ou `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
Após o primeiro carregamento bem-sucedido, o processo em execução atende a partir do snapshot de configuração ativo em memória; uma recarga bem-sucedida troca esse snapshot atomicamente.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, plano de controle e conexões de canal.
- Porta única multiplexada para:
  - Controle/RPC por WebSocket
  - APIs HTTP, compatíveis com OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI de controle e hooks
- Modo de bind padrão: `loopback`.
- Autenticação é exigida por padrão. Configurações com segredo compartilhado usam
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e configurações de proxy reverso
  fora de loopback podem usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatíveis com OpenAI

A superfície de compatibilidade de maior alavancagem do OpenClaw agora é:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por que este conjunto importa:

- A maioria das integrações Open WebUI, LobeChat e LibreChat consulta `/v1/models` primeiro.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos de agente preferem cada vez mais `/v1/responses`.

Nota de planejamento:

- `/v1/models` é agent-first: retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` é o alias estável que sempre mapeia para o agente padrão configurado.
- Use `x-openclaw-model` quando quiser uma substituição de provedor/modelo de backend; caso contrário, a configuração normal de modelo e embeddings do agente selecionado permanece no controle.

Todos eles rodam na porta principal do Gateway e usam o mesmo limite de autenticação de operador confiável que o restante da API HTTP do Gateway.

### Precedência de porta e bind

| Configuração | Ordem de resolução                                             |
| ------------ | ------------------------------------------------------------- |
| Porta do Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind | CLI/substituição → `gateway.bind` → `loopback`                    |

Serviços de gateway instalados registram o `--port` resolvido nos metadados do supervisor. Após alterar `gateway.port`, execute `openclaw doctor --fix` ou `openclaw gateway install --force` para que launchd/systemd/schtasks inicie o processo na nova porta.

A inicialização do Gateway usa a mesma porta e bind efetivos ao semear origens locais da
UI de controle para binds fora de loopback. Por exemplo, `--bind lan --port 3000`
semeia `http://localhost:3000` e `http://127.0.0.1:3000` antes que a validação
de runtime execute. Adicione explicitamente quaisquer origens de navegador remoto, como URLs de proxy HTTPS, a
`gateway.controlUi.allowedOrigins`.

### Modos de recarga a quente

| `gateway.reload.mode` | Comportamento                              |
| --------------------- | ------------------------------------------ |
| `off`                 | Sem recarga de configuração                |
| `hot`                 | Aplica apenas alterações seguras a quente  |
| `restart`             | Reinicia em alterações que exigem recarga  |
| `hybrid` (padrão)     | Aplica a quente quando seguro, reinicia quando necessário |

## Conjunto de comandos do operador

```bash
openclaw gateway status
openclaw gateway status --deep   # adds a system-level service scan
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` é para descoberta extra de serviços (LaunchDaemons/unidades systemd de sistema/schtasks), não uma sondagem RPC de integridade mais profunda.

## Vários gateways (mesmo host)

A maioria das instalações deve executar um gateway por máquina. Um único gateway pode hospedar vários
agentes e canais.

Você só precisa de vários gateways quando quiser isolamento intencionalmente ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode informar `Other gateway-like services detected (best effort)`
  e imprimir dicas de limpeza quando instalações obsoletas de launchd/systemd/schtasks ainda existirem.
- `gateway probe` pode avisar sobre `multiple reachable gateways` quando mais de um destino
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
Alternativa: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Então conecte clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Túneis SSH não contornam a autenticação do gateway. Para autenticação com segredo compartilhado, os clientes ainda
precisam enviar `token`/`password` mesmo pelo túnel. Para modos com identidade,
a solicitação ainda precisa satisfazer esse caminho de autenticação.
</Warning>

Veja: [Gateway remoto](/pt-BR/gateway/remote), [Autenticação](/pt-BR/gateway/authentication), [Tailscale](/pt-BR/gateway/tailscale).

## Supervisão e ciclo de vida do serviço

Use execuções supervisionadas para confiabilidade semelhante à produção.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Use `openclaw gateway restart` para reinicializações. Não encadeie `openclaw gateway stop` e `openclaw gateway start`; no macOS, `gateway stop` desabilita intencionalmente o LaunchAgent antes de pará-lo.

Os rótulos do LaunchAgent são `ai.openclaw.gateway` (padrão) ou `ai.openclaw.<profile>` (perfil nomeado). `openclaw doctor` audita e repara desvios de configuração do serviço.

  </Tab>

  <Tab title="Linux (systemd user)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistência após logout, habilite lingering:

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
for negada, o OpenClaw volta para um inicializador por usuário na pasta de Inicialização
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
`ExecStart=` se o binário `openclaw` estiver em outro lugar.

Não permita também que `openclaw doctor --fix` instale um serviço de gateway em nível de usuário para o mesmo perfil/porta. O Doctor recusa essa instalação automática quando encontra um serviço de gateway OpenClaw em nível de sistema; use `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando a unidade de sistema for dona do ciclo de vida.

  </Tab>
</Tabs>

## Caminho rápido do perfil de desenvolvimento

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Os padrões incluem estado/configuração isolados e porta base do gateway `19001`.

## Referência rápida do protocolo (visão do operador)

- O primeiro frame do cliente deve ser `connect`.
- O Gateway retorna o snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limites/política).
- `hello-ok.features.methods` / `events` são uma lista conservadora de descoberta, não
  um dump gerado de cada rota auxiliar chamável.
- Solicitações: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos de ciclo de vida de pareamento/aprovação e `shutdown`.

Execuções de agente têm duas etapas:

1. Confirmação aceita imediata (`status:"accepted"`)
2. Resposta final de conclusão (`status:"ok"|"error"`), com eventos `agent` transmitidos entre elas.

Veja a documentação completa do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

## Verificações operacionais

### Atividade

- Abra WS e envie `connect`.
- Espere uma resposta `hello-ok` com snapshot.

### Prontidão

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperação de lacunas

Eventos não são reproduzidos. Em lacunas de sequência, atualize o estado (`health`, `system-presence`) antes de continuar.

## Assinaturas comuns de falha

| Assinatura                                                    | Problema provável                                                            |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                   | Bind fora de loopback sem um caminho válido de autenticação do gateway       |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                                                            |
| `Gateway start blocked: set gateway.mode=local`               | Configuração definida para modo remoto, ou carimbo de modo local ausente em uma configuração danificada |
| `unauthorized` durante connect                                | Incompatibilidade de autenticação entre cliente e gateway                    |

Para sequências completas de diagnóstico, use [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rapidamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- Primeiros frames inválidos/que não são de conexão são rejeitados e fechados.
- O encerramento ordenado emite o evento `shutdown` antes do fechamento do socket.

---

Relacionado:

- [Solução de problemas](/pt-BR/gateway/troubleshooting)
- [Processo em segundo plano](/pt-BR/gateway/background-process)
- [Configuração](/pt-BR/gateway/configuration)
- [Integridade](/pt-BR/gateway/health)
- [Diagnóstico](/pt-BR/gateway/doctor)
- [Autenticação](/pt-BR/gateway/authentication)

## Relacionados

- [Configuração](/pt-BR/gateway/configuration)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
