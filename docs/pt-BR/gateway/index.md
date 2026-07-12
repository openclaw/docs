---
read_when:
    - Executando ou depurando o processo do gateway
summary: Runbook do serviço Gateway, ciclo de vida e operações
title: Runbook do Gateway
x-i18n:
    generated_at: "2026-07-12T15:12:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d8b50b6041905c321887ea0f579f8d4c3b74552b2b72c37ec655e43a53dfc130
    source_path: gateway/index.md
    workflow: 16
---

Use esta página para a inicialização do serviço Gateway no primeiro dia e para as operações a partir do segundo dia.

<CardGroup cols={2}>
  <Card title="Solução de problemas aprofundada" icon="siren" href="/pt-BR/gateway/troubleshooting">
    Diagnósticos orientados por sintomas, com sequências exatas de comandos e assinaturas de logs.
  </Card>
  <Card title="Configuração" icon="sliders" href="/pt-BR/gateway/configuration">
    Guia de configuração orientado a tarefas + referência completa de configuração.
  </Card>
  <Card title="Gerenciamento de segredos" icon="key-round" href="/pt-BR/gateway/secrets">
    Contrato de SecretRef, comportamento do snapshot em tempo de execução e operações de migração/recarregamento.
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
# depuração/rastreamento espelhados na E/S padrão
openclaw gateway --port 18789 --verbose
# encerra à força o processo que escuta na porta selecionada e inicia
openclaw gateway --force
```

  </Step>

  <Step title="Verifique a integridade do serviço">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Referência de integridade: `Runtime: running`, `Connectivity probe: ok` e uma linha `Capability` que corresponda ao esperado. Use `openclaw gateway status --require-rpc` para comprovar o RPC com escopo de leitura, não apenas a acessibilidade.

  </Step>

  <Step title="Valide a prontidão dos canais">

```bash
openclaw channels status --probe
```

Com um Gateway acessível, isso executa sondagens ativas por conta nos canais e auditorias opcionais. Se o Gateway estiver inacessível, a CLI recorre a resumos de canais baseados somente na configuração.

  </Step>
</Steps>

<Note>
O recarregamento da configuração do Gateway monitora o caminho do arquivo de configuração ativo (resolvido pelos padrões de perfil/estado ou por `OPENCLAW_CONFIG_PATH`, quando definido). O modo padrão é `gateway.reload.mode="hybrid"`. Após o primeiro carregamento bem-sucedido, o processo em execução utiliza o snapshot ativo da configuração na memória; um recarregamento bem-sucedido substitui esse snapshot de forma atômica.
</Note>

## Modelo de execução

- Um processo sempre ativo para roteamento, plano de controle e conexões de canais.
- Uma única porta multiplexada para:
  - Controle/RPC via WebSocket
  - APIs HTTP (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Rotas HTTP de Plugins, como a rota opcional `/api/v1/admin/rpc`
  - Interface de controle e hooks
- Modo de vinculação padrão: `loopback`. Dentro de um ambiente de contêiner detectado, o padrão efetivo é `auto` (resolvido como `0.0.0.0` para encaminhamento de portas), exceto quando o serve/funnel do Tailscale está ativo, o que sempre força `loopback`.
- A autenticação é obrigatória por padrão. Configurações com segredo compartilhado usam `gateway.auth.token` / `gateway.auth.password` (ou `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`), e configurações de proxy reverso fora de loopback podem usar `gateway.auth.mode: "trusted-proxy"`.

## Endpoints compatíveis com OpenAI

A superfície de compatibilidade de maior impacto do OpenClaw:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`
- `POST /v1/responses`

Por que esse conjunto é importante:

- A maioria das integrações com Open WebUI, LobeChat e LibreChat consulta primeiro `/v1/models`.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos para agentes preferem cada vez mais `/v1/responses`.

`/v1/models` prioriza agentes: retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>` para cada agente configurado. `openclaw/default` é o alias estável que sempre corresponde ao agente padrão configurado. Envie `x-openclaw-model` quando quiser substituir o provedor/modelo de backend; caso contrário, o modelo normal e a configuração de embeddings do agente selecionado permanecem no controle.

Todos esses endpoints são executados na porta principal do Gateway e usam o mesmo limite de autenticação de operador confiável que o restante da API HTTP do Gateway.

O RPC HTTP administrativo (`POST /api/v1/admin/rpc`) é uma rota de Plugin separada e desativada por padrão para ferramentas do host que não podem usar RPC via WebSocket. Consulte [RPC HTTP administrativo](/pt-BR/plugins/admin-http-rpc).

### Precedência de porta e vinculação

| Configuração       | Ordem de resolução                                                       |
| ------------------ | ------------------------------------------------------------------------ |
| Porta do Gateway   | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789`            |
| Modo de vinculação | CLI/substituição → `gateway.bind` → `loopback` (ou `auto` em contêineres) |

Os serviços de Gateway instalados registram o `--port` resolvido nos metadados do supervisor. Após alterar `gateway.port`, execute `openclaw doctor --fix` ou `openclaw gateway install --force` para que launchd/systemd/schtasks inicie o processo na nova porta.

A inicialização do Gateway usa a mesma porta e vinculação efetivas ao preencher as origens locais da interface de controle para vinculações fora de loopback. Por exemplo, `--bind lan --port 3000` adiciona `http://localhost:3000` e `http://127.0.0.1:3000` antes da validação em tempo de execução. Adicione explicitamente a `gateway.controlUi.allowedOrigins` quaisquer origens de navegadores remotos, como URLs de proxy HTTPS.

### Modos de recarregamento dinâmico

| `gateway.reload.mode` | Comportamento                                                   |
| --------------------- | --------------------------------------------------------------- |
| `off`                 | Sem recarregamento da configuração                              |
| `hot`                 | Aplica somente alterações seguras para recarregamento dinâmico  |
| `restart`             | Reinicia quando as alterações exigem reinicialização            |
| `hybrid` (padrão)     | Aplica dinamicamente quando seguro e reinicia quando necessário |

## Conjunto de comandos do operador

```bash
openclaw gateway status
openclaw gateway status --deep   # adiciona uma varredura de serviços no nível do sistema
openclaw gateway status --json
openclaw gateway install
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload
openclaw logs --follow
openclaw doctor
```

`gateway status --deep` serve para descoberta adicional de serviços (LaunchDaemons/unidades de sistema do systemd/schtasks), não para uma sondagem mais profunda da integridade do RPC.

## Vários Gateways (mesmo host)

A maioria das instalações deve executar um Gateway por máquina. Um único Gateway pode hospedar vários agentes e canais. Você só precisa de vários Gateways quando quiser deliberadamente isolamento ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode relatar `Other gateway-like services detected (best effort)` e exibir dicas de limpeza quando ainda houver instalações obsoletas de launchd/systemd/schtasks.
- `gateway probe` pode alertar sobre `multiple reachable gateway identities` quando Gateways distintos respondem ou quando o OpenClaw não consegue comprovar que os destinos acessíveis são o mesmo Gateway. Um túnel SSH, uma URL de proxy ou uma URL remota configurada para o mesmo Gateway representa um único Gateway com vários transportes, mesmo quando as portas de transporte são diferentes.
- Se isso for intencional, isole as portas, a configuração/estado e as raízes dos espaços de trabalho de cada Gateway.

Lista de verificação por instância:

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

Preferencial: Tailscale/VPN.
Alternativa: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

Em seguida, conecte os clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Os túneis SSH não ignoram a autenticação do Gateway. Para autenticação com segredo compartilhado, os clientes ainda
devem enviar `token`/`password`, mesmo pelo túnel. Para modos que carregam identidade,
a solicitação ainda precisa satisfazer esse fluxo de autenticação.
</Warning>

Consulte: [Gateway remoto](/pt-BR/gateway/remote), [Autenticação](/pt-BR/gateway/authentication), [Tailscale](/pt-BR/gateway/tailscale).

## Supervisão e ciclo de vida do serviço

Use execuções supervisionadas para obter confiabilidade semelhante à de produção.

<Tabs>
  <Tab title="macOS (launchd)">

```bash
openclaw gateway install
openclaw gateway status
openclaw gateway restart
openclaw gateway stop
```

Use `openclaw gateway restart` para reinicializações. Não encadeie `openclaw gateway stop` e `openclaw gateway start` como substituto para uma reinicialização.

No macOS, `gateway stop` usa `launchctl bootout` por padrão. Isso remove o LaunchAgent da sessão de inicialização atual sem desativá-lo permanentemente; assim, a recuperação automática do KeepAlive continua funcionando após falhas inesperadas, e `gateway start` o reativa corretamente. Para impedir permanentemente a recriação automática do processo após reinicializações, passe `--disable`: `openclaw gateway stop --disable`.

Os rótulos do LaunchAgent são `ai.openclaw.gateway` (padrão) ou `ai.openclaw.<profile>` (perfil nomeado). `openclaw doctor` audita e corrige divergências na configuração do serviço.

  </Tab>

  <Tab title="Linux (systemd do usuário)">

```bash
openclaw gateway install
systemctl --user enable --now openclaw-gateway[-<profile>].service
openclaw gateway status
```

Para manter a execução após o logout, habilite a permanência:

```bash
sudo loginctl enable-linger $(whoami)
```

Em um servidor sem interface gráfica e sem sessão de desktop, verifique também se `XDG_RUNTIME_DIR` está definido (`export XDG_RUNTIME_DIR=/run/user/$(id -u)`) antes de tentar novamente os comandos `systemctl --user`.

Exemplo de unidade de usuário manual quando você precisa de um caminho de instalação personalizado:

```ini
[Unit]
Description=Gateway do OpenClaw
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
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

A inicialização gerenciada nativa do Windows usa uma Tarefa Agendada chamada `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` para perfis nomeados). Se a criação da Tarefa Agendada
for negada, o OpenClaw recorrerá a um iniciador na pasta Inicializar do usuário
que aponta para `gateway.cmd` dentro do diretório de estado.

  </Tab>

  <Tab title="Linux (serviço do sistema)">

Use uma unidade de sistema para hosts multiusuário/sempre ativos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Use o mesmo conteúdo de serviço da unidade de usuário, mas instale-o em
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e ajuste
`ExecStart=` se o binário `openclaw` estiver em outro local.

Não permita também que `openclaw doctor --fix` instale um serviço de Gateway no nível do usuário para o mesmo perfil/porta. O Doctor recusa essa instalação automática quando encontra um serviço de Gateway do OpenClaw no nível do sistema; use `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando a unidade do sistema controlar o ciclo de vida.

  </Tab>
</Tabs>

Erros de configuração inválida encerram com o código `78`. As unidades systemd do Linux usam `RestartPreventExitStatus=78` para interromper as novas tentativas de inicialização até que a configuração seja corrigida. O launchd e o Agendador de Tarefas do Windows não têm uma regra equivalente de interrupção por código de saída; portanto, o Gateway também persiste o histórico de inicializações rápidas sem encerramento limpo e impede o início automático das contas de canais/provedores após falhas repetidas de inicialização. Nesse modo de segurança, o plano de controle ainda é iniciado para inspeção e reparo, os recarregamentos dinâmicos da configuração e `secrets.reload` recusam reinicializações automáticas de canais, e uma solicitação explícita do operador para `channels.start` pode substituir o bloqueio.

## Caminho rápido do perfil de desenvolvimento

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
openclaw --dev status
```

Os padrões incluem estado/configuração isolados e a porta base do Gateway `19001`.

## Referência rápida do protocolo (visão do operador)

- O primeiro frame do cliente deve ser `connect`.
- O Gateway retorna um frame `hello-ok` com um `snapshot` (`presence`, `health`, `stateVersion`, `uptimeMs`), além dos limites de `policy` (`maxPayload`, `maxBufferedBytes`, `tickIntervalMs`).
- `hello-ok.features.methods` / `events` são uma lista conservadora de descoberta, não
  um despejo gerado de todas as rotas auxiliares invocáveis.
- Solicitações: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.operation`, `session.tool`, o evento opcional
  `session.approval`, `sessions.changed`, `presence`, `tick`, `health`,
  `heartbeat`, eventos do ciclo de vida de pareamento/aprovação e `shutdown`.

As execuções do agente têm duas etapas:

1. Confirmação imediata de aceitação (`status:"accepted"`)
2. Resposta final de conclusão (`status:"ok"|"error"`), com eventos `agent` transmitidos entre as duas etapas.

Consulte a documentação completa do protocolo: [Protocolo do Gateway](/pt-BR/gateway/protocol).

## Verificações operacionais

### Atividade

- Abra o WS e envie `connect`.
- Aguarde uma resposta `hello-ok` com o snapshot.

### Prontidão

```bash
openclaw gateway status
openclaw channels status --probe
openclaw health
```

### Recuperação de lacunas

Os eventos não são reproduzidos. Quando houver lacunas na sequência, atualize o estado (`health`, `system-presence`) antes de continuar.

## Assinaturas comuns de falha

| Assinatura                                                      | Problema provável                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `refusing to bind gateway ... without auth`                     | Vinculação fora de loopback sem um caminho válido de autenticação do Gateway         |
| `another gateway instance is already listening` / `EADDRINUSE`  | Conflito de porta                                                                    |
| `Gateway start blocked: set gateway.mode=local`                 | Configuração definida para o modo remoto, ou `gateway.mode` está ausente de uma configuração danificada |
| `unauthorized` durante a conexão                                | Incompatibilidade de autenticação entre o cliente e o Gateway                        |

Para obter sequências completas de diagnóstico, consulte [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting).

## Garantias de segurança

- Os clientes do protocolo do Gateway falham imediatamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- Primeiros frames inválidos ou que não sejam de conexão são rejeitados, e a conexão é encerrada.
- O desligamento normal emite o evento `shutdown` antes de fechar o socket.

## Relacionados

- [Configuração](/pt-BR/gateway/configuration)
- [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting)
- [Processo em segundo plano](/pt-BR/gateway/background-process)
- [Integridade](/pt-BR/gateway/health)
- [Doctor](/pt-BR/gateway/doctor)
- [Autenticação](/pt-BR/gateway/authentication)
- [Acesso remoto](/pt-BR/gateway/remote)
- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
