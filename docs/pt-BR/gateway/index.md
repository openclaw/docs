---
read_when:
    - Executando ou depurando o processo do Gateway
summary: Runbook para o serviço Gateway, ciclo de vida e operações
title: Manual de operações do Gateway
x-i18n:
    generated_at: "2026-05-10T19:34:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54f868e0b263e346876fb5c4f6a359e8a6f6802871f6931668ebe57140ca2711
    source_path: gateway/index.md
    workflow: 16
---

Use esta página para a inicialização do dia 1 e as operações do dia 2 do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Solução de problemas aprofundada" icon="siren" href="/pt-BR/gateway/troubleshooting">
    Diagnósticos orientados por sintoma com sequências exatas de comandos e assinaturas de logs.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Guia de configuração orientado por tarefa + referência completa de configuração.
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

Linha de base saudável: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` que corresponde ao que você espera. Use `openclaw gateway status --require-rpc` quando precisar de comprovação de RPC com escopo de leitura, não apenas alcançabilidade.

  </Step>

  <Step title="Valide a prontidão do canal">

```bash
openclaw channels status --probe
```

Com um Gateway alcançável, isso executa probes de canais por conta ao vivo e auditorias opcionais.
Se o Gateway estiver inalcançável, a CLI recorre a resumos de canais somente de configuração em vez
da saída de probe ao vivo.

  </Step>
</Steps>

<Note>
O recarregamento da configuração do Gateway observa o caminho do arquivo de configuração ativo (resolvido a partir dos padrões de perfil/estado, ou de `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
Após o primeiro carregamento bem-sucedido, o processo em execução serve o snapshot ativo da configuração em memória; um recarregamento bem-sucedido troca esse snapshot atomicamente.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, plano de controle e conexões de canais.
- Porta única multiplexada para:
  - Controle/RPC via WebSocket
  - APIs HTTP, compatíveis com OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - UI de controle e hooks
- Modo de bind padrão: `loopback`.
- A autenticação é exigida por padrão. Configurações com segredo compartilhado usam
  `gateway.auth.token` / `gateway.auth.password` (ou
  `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e configurações de
  proxy reverso não loopback podem usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatíveis com OpenAI

A superfície de compatibilidade de maior impacto do OpenClaw agora é:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por que esse conjunto importa:

- A maioria das integrações com Open WebUI, LobeChat e LibreChat faz primeiro o probe de `/v1/models`.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos de agente preferem cada vez mais `/v1/responses`.

Nota de planejamento:

- `/v1/models` é agent-first: ele retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` é o alias estável que sempre aponta para o agente padrão configurado.
- Use `x-openclaw-model` quando quiser substituir o provedor/modelo de backend; caso contrário, o modelo normal e a configuração de embeddings do agente selecionado permanecem no controle.

Todos esses endpoints rodam na porta principal do Gateway e usam o mesmo limite de autenticação de operador confiável que o restante da API HTTP do Gateway.

### Precedência de porta e bind

| Configuração | Ordem de resolução                                           |
| ------------ | ------------------------------------------------------------- |
| Porta do Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind | CLI/sobrescrita → `gateway.bind` → `loopback`                    |

Serviços de Gateway instalados registram o `--port` resolvido nos metadados do supervisor. Depois de alterar `gateway.port`, execute `openclaw doctor --fix` ou `openclaw gateway install --force` para que launchd/systemd/schtasks inicie o processo na nova porta.

A inicialização do Gateway usa a mesma porta efetiva e o mesmo bind quando semeia origens locais da
UI de controle para binds não loopback. Por exemplo, `--bind lan --port 3000`
semeia `http://localhost:3000` e `http://127.0.0.1:3000` antes da execução da
validação de runtime. Adicione explicitamente quaisquer origens de navegador remoto, como URLs de proxy HTTPS, a
`gateway.controlUi.allowedOrigins`.

### Modos de recarregamento a quente

| `gateway.reload.mode` | Comportamento                              |
| --------------------- | ------------------------------------------ |
| `off`                 | Sem recarregamento de configuração         |
| `hot`                 | Aplica somente alterações seguras a quente |
| `restart`             | Reinicia em alterações que exigem recarregamento |
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

`gateway status --deep` é para descoberta extra de serviços (LaunchDaemons/unidades
systemd do sistema/schtasks), não para um probe de integridade RPC mais profundo.

## Vários gateways (mesmo host)

A maioria das instalações deve executar um Gateway por máquina. Um único Gateway pode hospedar vários
agentes e canais.

Você só precisa de vários gateways quando quiser intencionalmente isolamento ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode relatar `Other gateway-like services detected (best effort)`
  e imprimir dicas de limpeza quando instalações obsoletas de launchd/systemd/schtasks ainda existirem.
- `gateway probe` pode avisar sobre `multiple reachable gateways` quando mais de um destino
  responde.
- Se isso for intencional, isole portas, configuração/estado e raízes de workspace por Gateway.

Checklist por instância:

- `gateway.port` único
- `OPENCLAW_CONFIG_PATH` único
- `OPENCLAW_STATE_DIR` único
- `agents.defaults.workspace` único

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

Então conecte clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Túneis SSH não contornam a autenticação do Gateway. Para autenticação com segredo compartilhado, os clientes ainda
devem enviar `token`/`password` mesmo pelo túnel. Para modos que carregam identidade,
a requisição ainda precisa satisfazer esse caminho de autenticação.
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

Use `openclaw gateway restart` para reinicializações. Não encadeie `openclaw gateway stop` e `openclaw gateway start` como substituto de reinicialização.

No macOS, `gateway stop` usa `launchctl bootout` por padrão — isso remove o LaunchAgent da sessão de boot atual sem persistir uma desativação, então a recuperação automática por KeepAlive ainda funciona após falhas inesperadas e `gateway start` reativa tudo de forma limpa. Para suprimir persistentemente o respawn automático entre reinicializações, passe `--disable`: `openclaw gateway stop --disable`.

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
for negada, o OpenClaw recorre a um launcher por usuário na pasta de Inicialização
que aponta para `gateway.cmd` dentro do diretório de estado.

  </Tab>

  <Tab title="Linux (serviço do sistema)">

Use uma unidade do sistema para hosts multiusuário/sempre ativos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Use o mesmo corpo de serviço da unidade de usuário, mas instale-o em
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e ajuste
`ExecStart=` se o binário `openclaw` estiver em outro lugar.

Não permita também que `openclaw doctor --fix` instale um serviço de Gateway em nível de usuário para o mesmo perfil/porta. O doctor recusa essa instalação automática quando encontra um serviço de Gateway do OpenClaw em nível de sistema; use `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando a unidade do sistema for dona do ciclo de vida.

  </Tab>
</Tabs>

## Caminho rápido do perfil de desenvolvimento

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
- Requisições: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos de ciclo de vida de pareamento/aprovação e `shutdown`.

Execuções de agentes têm duas etapas:

1. Ack imediato aceito (`status:"accepted"`)
2. Resposta final de conclusão (`status:"ok"|"error"`), com eventos `agent` transmitidos entre elas.

Veja a documentação completa do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

## Verificações operacionais

### Liveness

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

| Assinatura                                                    | Problema provável                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                   | Bind não-loopback sem um caminho de autenticação do Gateway válido                   |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                                                                     |
| `Gateway start blocked: set gateway.mode=local`               | Configuração definida para modo remoto, ou o carimbo de modo local está ausente de uma configuração danificada |
| `unauthorized` during connect                                 | Incompatibilidade de autenticação entre o cliente e o Gateway                         |

Para escadas completas de diagnóstico, use [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo Gateway falham rapidamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- Primeiros frames inválidos/sem conexão são rejeitados e fechados.
- O encerramento gracioso emite o evento `shutdown` antes do fechamento do socket.

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
