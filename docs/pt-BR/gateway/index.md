---
read_when:
    - Executando ou depurando o processo do Gateway
summary: Runbook do serviço Gateway, ciclo de vida e operações
title: Guia operacional do Gateway
x-i18n:
    generated_at: "2026-04-30T09:49:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14f3d288c426848bc176291ff084a2b63b00e81739cd02f31fdf517d230d8111
    source_path: gateway/index.md
    workflow: 16
---

Use esta página para a inicialização do dia 1 e as operações do dia 2 do serviço Gateway.

<CardGroup cols={2}>
  <Card title="Deep troubleshooting" icon="siren" href="/pt-BR/gateway/troubleshooting">
    Diagnóstico orientado por sintomas, com sequências exatas de comandos e assinaturas de log.
  </Card>
  <Card title="Configuration" icon="sliders" href="/pt-BR/gateway/configuration">
    Guia de configuração orientado a tarefas + referência completa de configuração.
  </Card>
  <Card title="Secrets management" icon="key-round" href="/pt-BR/gateway/secrets">
    Contrato SecretRef, comportamento de snapshot em runtime e operações de migração/recarregamento.
  </Card>
  <Card title="Secrets plan contract" icon="shield-check" href="/pt-BR/gateway/secrets-plan-contract">
    Regras exatas de destino/caminho de `secrets apply` e comportamento de auth-profile somente por ref.
  </Card>
</CardGroup>

## Inicialização local em 5 minutos

<Steps>
  <Step title="Start the Gateway">

```bash
openclaw gateway --port 18789
# debug/trace mirrored to stdio
openclaw gateway --port 18789 --verbose
# force-kill listener on selected port, then start
openclaw gateway --force
```

  </Step>

  <Step title="Verify service health">

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
```

Linha de base saudável: `Runtime: running`, `Connectivity probe: ok` e `Capability: ...` que corresponde ao esperado. Use `openclaw gateway status --require-rpc` quando precisar de prova de RPC com escopo de leitura, não apenas alcançabilidade.

  </Step>

  <Step title="Validate channel readiness">

```bash
openclaw channels status --probe
```

Com um gateway alcançável, isso executa sondagens de canais por conta ao vivo e auditorias opcionais.
Se o gateway estiver inalcançável, a CLI recorre a resumos de canais somente por configuração em vez
da saída de sondagem ao vivo.

  </Step>
</Steps>

<Note>
O recarregamento de configuração do Gateway observa o caminho do arquivo de configuração ativo (resolvido a partir dos padrões de perfil/estado, ou `OPENCLAW_CONFIG_PATH` quando definido).
O modo padrão é `gateway.reload.mode="hybrid"`.
Após o primeiro carregamento bem-sucedido, o processo em execução serve o snapshot ativo de configuração em memória; um recarregamento bem-sucedido troca esse snapshot de forma atômica.
</Note>

## Modelo de runtime

- Um processo sempre ativo para roteamento, plano de controle e conexões de canais.
- Porta multiplexada única para:
  - Controle/RPC por WebSocket
  - APIs HTTP, compatíveis com OpenAI (`/v1/models`, `/v1/embeddings`, `/v1/chat/completions`, `/v1/responses`, `/tools/invoke`)
  - Control UI e hooks
- Modo de bind padrão: `loopback`.
- Autenticação é obrigatória por padrão. Configurações com segredo compartilhado usam
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

- A maioria das integrações Open WebUI, LobeChat e LibreChat sonda `/v1/models` primeiro.
- Muitos pipelines de RAG e memória esperam `/v1/embeddings`.
- Clientes nativos de agentes preferem cada vez mais `/v1/responses`.

Nota de planejamento:

- `/v1/models` é orientado a agentes: retorna `openclaw`, `openclaw/default` e `openclaw/<agentId>`.
- `openclaw/default` é o alias estável que sempre mapeia para o agente padrão configurado.
- Use `x-openclaw-model` quando quiser substituir o provedor/modelo de backend; caso contrário, o modelo normal e a configuração de embeddings do agente selecionado permanecem no controle.

Tudo isso roda na porta principal do Gateway e usa o mesmo limite de autenticação de operador confiável que o restante da API HTTP do Gateway.

### Precedência de porta e bind

| Configuração | Ordem de resolução                                            |
| ------------ | ------------------------------------------------------------- |
| Porta do Gateway | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Modo de bind | CLI/override → `gateway.bind` → `loopback`                    |

Serviços de gateway instalados registram o `--port` resolvido nos metadados do supervisor. Depois de alterar `gateway.port`, execute `openclaw doctor --fix` ou `openclaw gateway install --force` para que launchd/systemd/schtasks inicie o processo na nova porta.

A inicialização do Gateway usa a mesma porta efetiva e o mesmo bind quando semeia origens locais da
Control UI para binds não loopback. Por exemplo, `--bind lan --port 3000`
semeia `http://localhost:3000` e `http://127.0.0.1:3000` antes da execução da
validação de runtime. Adicione explicitamente quaisquer origens de navegador remotas, como URLs de proxy HTTPS, a
`gateway.controlUi.allowedOrigins`.

### Modos de recarregamento a quente

| `gateway.reload.mode` | Comportamento                              |
| --------------------- | ------------------------------------------ |
| `off`                 | Sem recarregamento de configuração         |
| `hot`                 | Aplica apenas alterações seguras a quente  |
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

`gateway status --deep` é para descoberta extra de serviços (LaunchDaemons/unidades systemd de sistema
/schtasks), não uma sondagem de integridade RPC mais profunda.

## Vários gateways (mesmo host)

A maioria das instalações deve executar um gateway por máquina. Um único gateway pode hospedar vários
agentes e canais.

Você só precisa de vários gateways quando intencionalmente quiser isolamento ou um bot de resgate.

Verificações úteis:

```bash
openclaw gateway status --deep
openclaw gateway probe
```

O que esperar:

- `gateway status --deep` pode relatar `Other gateway-like services detected (best effort)`
  e imprimir dicas de limpeza quando instalações antigas de launchd/systemd/schtasks ainda existirem.
- `gateway probe` pode alertar sobre `multiple reachable gateways` quando mais de um destino
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

## Endpoint de cérebro em tempo real do VoiceClaw

O OpenClaw expõe um endpoint WebSocket em tempo real compatível com VoiceClaw em
`/voiceclaw/realtime`. Use-o quando um cliente desktop VoiceClaw deve falar
diretamente com um cérebro OpenClaw em tempo real, em vez de passar por um processo
de relay separado.

O endpoint usa Gemini Live para áudio em tempo real e chama o OpenClaw como o
cérebro ao expor ferramentas do OpenClaw diretamente ao Gemini Live. Chamadas de ferramenta retornam um
resultado `working` imediato para manter a rodada de voz responsiva; em seguida, o OpenClaw
executa a ferramenta real de forma assíncrona e injeta o resultado de volta na
sessão ao vivo. Defina `GEMINI_API_KEY` no ambiente do processo do gateway. Se
a autenticação do gateway estiver habilitada, o cliente desktop envia o token ou a senha do gateway
na primeira mensagem `session.config`.

O acesso ao cérebro em tempo real executa comandos de agente OpenClaw autorizados pelo proprietário. Mantenha
`gateway.auth.mode: "none"` limitado a instâncias de teste somente loopback. Conexões não locais
ao cérebro em tempo real exigem autenticação do gateway.

Para um gateway de teste isolado, execute uma instância separada com sua própria porta, configuração
e estado:

```bash
OPENCLAW_CONFIG_PATH=/path/to/openclaw-realtime/openclaw.json \
OPENCLAW_STATE_DIR=/path/to/openclaw-realtime/state \
OPENCLAW_SKIP_CHANNELS=1 \
GEMINI_API_KEY=... \
openclaw gateway --port 19789
```

Em seguida, configure o VoiceClaw para usar:

```text
ws://127.0.0.1:19789/voiceclaw/realtime
```

## Acesso remoto

Preferencial: Tailscale/VPN.
Alternativa: túnel SSH.

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Depois conecte clientes localmente a `ws://127.0.0.1:18789`.

<Warning>
Túneis SSH não ignoram a autenticação do gateway. Para autenticação por segredo compartilhado, os clientes ainda
devem enviar `token`/`password` mesmo pelo túnel. Para modos com identidade,
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

  <Tab title="Windows (native)">

```powershell
openclaw gateway install
openclaw gateway status --json
openclaw gateway restart
openclaw gateway stop
```

A inicialização gerenciada nativa do Windows usa uma Tarefa Agendada chamada `OpenClaw Gateway`
(ou `OpenClaw Gateway (<profile>)` para perfis nomeados). Se a criação da Tarefa Agendada
for negada, o OpenClaw recorre a um iniciador na pasta Startup por usuário
que aponta para `gateway.cmd` dentro do diretório de estado.

  </Tab>

  <Tab title="Linux (system service)">

Use uma unidade de sistema para hosts multiusuário/sempre ativos.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

Use o mesmo corpo de serviço da unidade de usuário, mas instale-o em
`/etc/systemd/system/openclaw-gateway[-<profile>].service` e ajuste
`ExecStart=` se o binário `openclaw` estiver em outro lugar.

Não permita também que `openclaw doctor --fix` instale um serviço de gateway em nível de usuário para o mesmo perfil/porta. O Doctor recusa essa instalação automática quando encontra um serviço de gateway OpenClaw em nível de sistema; use `OPENCLAW_SERVICE_REPAIR_POLICY=external` quando a unidade de sistema for responsável pelo ciclo de vida.

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
  um dump gerado de toda rota auxiliar chamável.
- Solicitações: `req(method, params)` → `res(ok/payload|error)`.
- Eventos comuns incluem `connect.challenge`, `agent`, `chat`,
  `session.message`, `session.tool`, `sessions.changed`, `presence`, `tick`,
  `health`, `heartbeat`, eventos de ciclo de vida de pareamento/aprovação e `shutdown`.

Execuções de agente têm duas etapas:

1. Ack imediato de aceitação (`status:"accepted"`)
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

| Assinatura                                                     | Problema provável                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `refusing to bind gateway ... without auth`                    | Vinculação sem loopback sem um caminho de autenticação do Gateway válido         |
| `another gateway instance is already listening` / `EADDRINUSE` | Conflito de porta                                                                |
| `Gateway start blocked: set gateway.mode=local`                | Configuração definida para modo remoto, ou o carimbo de modo local está ausente de uma configuração danificada |
| `unauthorized` durante a conexão                               | Incompatibilidade de autenticação entre o cliente e o Gateway                    |

Para escadas completas de diagnóstico, use [Solução de problemas do Gateway](/pt-BR/gateway/troubleshooting).

## Garantias de segurança

- Clientes do protocolo do Gateway falham rapidamente quando o Gateway está indisponível (sem fallback implícito para canal direto).
- Primeiros quadros inválidos/não conectados são rejeitados e fechados.
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
