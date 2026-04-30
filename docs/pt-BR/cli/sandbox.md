---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gerenciar ambientes de execução em área restrita e inspecionar a política efetiva de área restrita
title: CLI do ambiente isolado
x-i18n:
    generated_at: "2026-04-30T09:42:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 65520040611ccf0cfc28b28f0caf2ed1c7d3b32de06eec7884131042bba4a01e
    source_path: cli/sandbox.md
    workflow: 16
---

Gerencie runtimes de sandbox para execução isolada de agentes.

## Visão geral

O OpenClaw pode executar agentes em runtimes de sandbox isolados por segurança. Os comandos `sandbox` ajudam você a inspecionar e recriar esses runtimes após atualizações ou mudanças de configuração.

Hoje, isso geralmente significa:

- Contêineres de sandbox Docker
- Runtimes de sandbox SSH quando `agents.defaults.sandbox.backend = "ssh"`
- Runtimes de sandbox OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Para `ssh` e OpenShell `remote`, recriar importa mais do que com Docker:

- o workspace remoto é canônico após a semeadura inicial
- `openclaw sandbox recreate` exclui esse workspace remoto canônico para o escopo selecionado
- o próximo uso o semeia novamente a partir do workspace local atual

## Comandos

### `openclaw sandbox explain`

Inspecione o modo/escopo/acesso ao workspace de sandbox **efetivo**, a política de ferramentas do sandbox e os gates elevados (com caminhos de chaves de configuração para correção).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Liste todos os runtimes de sandbox com seus status e configuração.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # List only browser containers
openclaw sandbox list --json     # JSON output
```

**A saída inclui:**

- Nome e status do runtime
- Backend (`docker`, `openshell`, etc.)
- Rótulo de configuração e se ele corresponde à configuração atual
- Idade (tempo desde a criação)
- Tempo ocioso (tempo desde o último uso)
- Sessão/agente associado

### `openclaw sandbox recreate`

Remova runtimes de sandbox para forçar a recriação com a configuração atualizada.

```bash
openclaw sandbox recreate --all                # Recreate all containers
openclaw sandbox recreate --session main       # Specific session
openclaw sandbox recreate --agent mybot        # Specific agent
openclaw sandbox recreate --browser            # Only browser containers
openclaw sandbox recreate --all --force        # Skip confirmation
```

**Opções:**

- `--all`: Recriar todos os contêineres de sandbox
- `--session <key>`: Recriar o contêiner para uma sessão específica
- `--agent <id>`: Recriar contêineres para um agente específico
- `--browser`: Recriar apenas contêineres de navegador
- `--force`: Ignorar a solicitação de confirmação

<Note>
Os runtimes são recriados automaticamente quando o agente é usado novamente.
</Note>

## Casos de uso

### Após atualizar uma imagem Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Após alterar a configuração do sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Após alterar o alvo SSH ou material de autenticação SSH

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Para o backend `ssh` principal, recriar exclui a raiz do workspace remoto por escopo
no alvo SSH. A próxima execução o semeia novamente a partir do workspace local.

### Após alterar a origem, política ou modo do OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Para o modo OpenShell `remote`, recriar exclui o workspace remoto canônico
para esse escopo. A próxima execução o semeia novamente a partir do workspace local.

### Após alterar setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Apenas para um agente específico

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Por que isso é necessário

Quando você atualiza a configuração do sandbox:

- Runtimes existentes continuam em execução com configurações antigas.
- Runtimes só são removidos após 24h de inatividade.
- Agentes usados regularmente mantêm runtimes antigos ativos indefinidamente.

Use `openclaw sandbox recreate` para forçar a remoção de runtimes antigos. Eles são recriados automaticamente com as configurações atuais quando necessários novamente.

<Tip>
Prefira `openclaw sandbox recreate` em vez da limpeza manual específica do backend. Ele usa o registro de runtimes do Gateway e evita incompatibilidades quando chaves de escopo ou sessão mudam.
</Tip>

## Configuração

As configurações de sandbox ficam em `~/.openclaw/openclaw.json` sob `agents.defaults.sandbox` (substituições por agente ficam em `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... more Docker options
        },
        "prune": {
          "idleHours": 24, // Auto-prune after 24h idle
          "maxAgeDays": 7, // Auto-prune after 7 days
        },
      },
    },
  },
}
```

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Sandboxing](/pt-BR/gateway/sandboxing)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Doctor](/pt-BR/gateway/doctor): verifica a configuração do sandbox.
