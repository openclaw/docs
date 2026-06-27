---
read_when:
    - Executando ou depurando o processo do gateway
summary: Runbook para o serviço Gateway, ciclo de vida e operações
title: Manual operacional do Gateway
x-i18n:
    generated_at: "2026-06-27T17:30:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b0bbbcad26df135e1475cbeb14f1299b48bae62be759b2e6c6f82164d175601b
    source_path: gateway/index.md
    workflow: 16
---

Use esta página para a inicialização do dia 1 e as operações do dia 2 do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Solução de problemas aprofundada" icon="siren" href="/pt-BR/gateway/troubleshooting">
    Diagnósticos orientados por sintomas, com sequências exatas de comandos e assinaturas de logs.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Guia de configuração orientado a tarefas + referência completa de configuração.
  </Card>
  <Card title="Gerenciamento de segredos" icon="key-round" href="/pt-BR/gateway/secrets">
    Contrato SecretRef, comportamento de snapshot em runtime e operações de migração/recarregamento.
  </Card>
  <Card title="Contrato do plano de segredos" icon="shield-check" href="/pt-BR/gateway/secrets-plan-contract">
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

Linha de base íntegra: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` que corresponda ao que você espera. Use `openclaw gateway status --require-rpc` quando precisar de prova de RPC em escopo de leitura, não apenas acessibilidade.

  </Step>

  <Step title="Valide a prontidão dos canais">

```bash
openclaw channels status --probe
```

Com um Gateway acessível, isso executa sondagens de canal por conta ao vivo e auditorias opcionais.
Se o Gateway estiver inacessível, a CLI recorre a resumos de canais apenas por configuração em vez
da saída de sondagem ao vivo.

  </Step>
</Steps>

<Note>
O recarregamento da configuração do Gateway observa o caminho do arquivo de configuração ativo (resolvido a partir dos padrões de perfil/estado, ou `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
Após o primeiro carregamento bem-sucedido, o processo em execução serve o snapshot de configuração ativo em memória; um recarregamento bem-sucedido troca esse snapshot atomicamente.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, plano de controle e conexões de canais.
- Porta única multiplexada para:
  - Controle/RPC por WebSocket
  - APIs HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Rotas HTTP de Plugin, como `/api/v1/admin/rpc` opcional
  - UI de controle e hooks
- Modo de bind padrão: `loopback`.
- A autenticação é exigida por padrão. Configurações com segredo compartilhado usam
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e configurações de proxy reverso
  não loopback podem usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatíveis com OpenAI

A superfície de compatibilidade de maior impacto do OpenClaw agora é:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por que esse conjunto importa:

- A maioria das integrações com Open WebUI, LobeChat e LibreChat sondam `/v1/models` primeiro.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos de agentes preferem cada vez mais `/v1/responses`.

Nota de planejamento:

- `/v1/models` é orientado a agentes: retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` é o alias estável que sempre mapeia para o agente padrão configurado.
- Use `x-openclaw-model` quando quiser uma substituição de provedor/modelo de backend; caso contrário, a configuração normal de modelo e embeddings do agente selecionado permanece no controle.

Tudo isso é executado na porta principal do Gateway e usa o mesmo limite de autenticação de operador confiável do restante da API HTTP do Gateway.

RPC HTTP administrativo (`POST /api/v1/admin/rpc`) é uma rota de Plugin separada, desativada por padrão, para ferramentas de host que não podem usar RPC por WebSocket. Consulte [RPC HTTP administrativo](/pt-BR/plugins/admin-http-rpc).

### Precedência de porta e bind

| Configuração | Ordem de resolução                                            |
| ------------ | ------------------------------------------------------------- |
| Porta do Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind | CLI/substituição → `gateway.bind` → `loopback`                    |

Serviços de Gateway instalados registram o `--port` resolvido nos metadados do supervisor. Depois de alterar `gateway.port`, execute `openclaw doctor --fix` ou `openclaw gateway install --force` para que launchd/systemd/schtasks inicie o processo na nova porta.

A inicialização do Gateway usa a mesma porta e o mesmo bind efetivos ao semear origens locais
da UI de controle para binds não loopback. Por exemplo, `--bind lan --port 3000`
semeia `http://localhost:3000` e `http://127.0.0.1:3000` antes da execução
da validação em runtime. Adicione explicitamente quaisquer origens de navegador remoto, como URLs de proxy HTTPS, a
`gateway.controlUi.allowedOrigins`.

### Modos de recarregamento a quente

| `gateway.reload.mode` | Comportamento                              |
| --------------------- | ------------------------------------------ |
| `off`                 | Sem recarregamento de configuração         |
| `hot`                 | Aplica apenas mudanças seguras a quente    |
| `restart`             | Reinicia em mudanças que exigem recarregamento |
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

`gateway status --deep` é para descoberta extra de serviços (LaunchDaemons/unidades de sistema
systemd/schtasks), não uma sondagem de integridade RPC mais profunda.

## Vários gateways (mesmo host)

A maioria das instalações deve executar um Gateway por máquina. Um único Gateway pode hospedar vários
agentes e canais.

Você só precisa de vários gateways quando deseja intencionalmente isolamento ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode relatar `Other gateway-like services detected (best effort)`
  e imprimir dicas de limpeza quando instalações antigas de launchd/systemd/schtasks ainda estiverem presentes.
- `gateway probe` pode avisar sobre `multiple reachable gateway identities` quando gateways distintos
  respondem, ou quando o OpenClaw não consegue provar que os destinos acessíveis são o mesmo Gateway.
  Um túnel SSH, uma URL de proxy ou uma URL remota configurada para o mesmo Gateway é um
  Gateway com vários transportes, mesmo quando as portas de transporte são diferentes.
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

## Acesso remoto

Preferido: Tailscale/VPN.
Alternativa: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Depois conecte clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Túneis SSH não ignoram a autenticação do Gateway. Para autenticação com segredo compartilhado, os clientes ainda
devem enviar `token`/`password` mesmo pelo túnel. Para modos com identidade,
a solicitação ainda precisa satisfazer esse caminho de autenticação.
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

Use `openclaw gateway restart` para reinicializações. Não encadeie `openclaw gateway stop` e `openclaw gateway start` como substituto de reinicialização.

No macOS, `gateway stop` usa `launchctl bootout` por padrão — isso remove o LaunchAgent da sessão de inicialização atual sem persistir uma desativação, portanto a recuperação automática KeepAlive ainda funciona após falhas inesperadas e `gateway start` reativa tudo de forma limpa. Para suprimir persistentemente o respawn automático entre reinicializações, passe `--disable`: `openclaw gateway stop --disable`.

Os rótulos do LaunchAgent são `ai.openclaw.gateway` (padrão) ou `ai.openclaw.<profile>` (perfil nomeado). `openclaw doctor` audita e repara desvios de configuração do serviço.

  </Tab>

  <Tab title="Linux (usuário systemd)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para persistência após logout, habilite lingering:

```bash
sudo loginctl enable-linger <user>
```

Exemplo de unidade de usuário manual quando você precisa de um caminho de instalação personalizado:

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
OOMPolicy=continue
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

A inicialização gerenciada nativa no Windows usa uma Tarefa Agendada chamada `OpenClaw Gateway`
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
`ExecStart=` se o binário `openclaw` estiver em outro lugar.

Não permita também que `openclaw doctor --fix` instale um serviço de Gateway em nível de usuário para o mesmo perfil/porta. O Doctor recusa essa instalação automática quando encontra um serviço de Gateway OpenClaw em nível de sistema; use `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando a unidade de sistema for dona do ciclo de vida.

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
- O Gateway retorna o snapshot `hello-ok` (`presence`, `health`, `stateVersion`, `uptimeMs`, limites/política).
- `hello-ok.features.methods` / `events` são uma lista conservadora de descoberta, não
  um despejo gerado de todas as rotas auxiliares chamáveis.
- Solicitações: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, `sessions.changed`,
  `presence`, `tick`, `health`, `heartbeat`, eventos de ciclo de vida de pareamento/aprovação,
  e `shutdown`.

Execuções de agentes têm duas etapas:

1. Confirmação aceita imediata (`status:"accepted"`)
2. Resposta final de conclusão (`status:"ok"|"error"`), com eventos `agent` transmitidos entre elas.

Consulte a documentação completa do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

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

Eventos não são reproduzidos. Em lacunas de sequência, atualize o estado (`health`, `system-presence`) antes de continuar.

## Assinaturas comuns de falha

| Assinatura                                                     | Problema provável                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                    | Vinculação fora de loopback sem um caminho válido de autenticação do Gateway   |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                                                              |
| `Gateway start blocked: set gateway.mode=local`                | Configuração definida para modo remoto, ou carimbo de modo local ausente em uma configuração danificada |
| `unauthorized` during connect                                  | Incompatibilidade de autenticação entre cliente e Gateway                      |

Para escadas completas de diagnóstico, use [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rapidamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- Primeiros frames inválidos/sem conexão são rejeitados e fechados.
- O encerramento gracioso emite o evento `shutdown` antes de fechar o socket.

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
