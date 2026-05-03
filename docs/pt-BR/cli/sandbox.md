---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gerencie runtimes de sandbox e inspecione a política efetiva de sandbox
title: CLI de ambiente isolado
x-i18n:
    generated_at: "2026-05-03T21:29:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c50b97c35ba8cd79416de6a167a7cbc313d063b320db7deafd42f7a570e507ac
    source_path: cli/sandbox.md
    workflow: 16
---

Gerencie runtimes de sandbox para execução isolada de agentes.

## Visão geral

O OpenClaw pode executar agentes em runtimes de sandbox isolados por segurança. Os comandos `sandbox` ajudam você a inspecionar e recriar esses runtimes após atualizações ou alterações de configuração.

Hoje isso geralmente significa:

- Contêineres de sandbox do Docker
- Runtimes de sandbox por SSH quando `agents.defaults.sandbox.backend = "ssh"`
- Runtimes de sandbox do OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Para `ssh` e OpenShell `remote`, recriar é mais importante do que com Docker:

- o workspace remoto é canônico após a propagação inicial
- `openclaw sandbox recreate` exclui esse workspace remoto canônico para o escopo selecionado
- o próximo uso o propaga novamente a partir do workspace local atual

## Comandos

### `openclaw sandbox explain`

Inspecione o modo/escopo/acesso ao workspace de sandbox **efetivo**, a política de ferramentas de sandbox e os gates elevados (com caminhos de chaves de configuração para correção).

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

Liste todos os runtimes de sandbox com seu status e configuração.

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

- `--all`: Recria todos os contêineres de sandbox
- `--session <key>`: Recria o contêiner de uma sessão específica
- `--agent <id>`: Recria contêineres de um agente específico
- `--browser`: Recria somente contêineres de navegador
- `--force`: Ignora o prompt de confirmação

<Note>
Os runtimes são recriados automaticamente na próxima vez que o agente for usado.
</Note>

## Casos de uso

### Depois de atualizar uma imagem Docker

```bash
# Pull new image
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Update config to use new image
# Edit config: agents.defaults.sandbox.docker.image (or agents.list[].sandbox.docker.image)

# Recreate containers
openclaw sandbox recreate --all
```

### Depois de alterar a configuração de sandbox

```bash
# Edit config: agents.defaults.sandbox.* (or agents.list[].sandbox.*)

# Recreate to apply new config
openclaw sandbox recreate --all
```

### Depois de alterar o destino SSH ou o material de autenticação SSH

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
no destino SSH. A próxima execução a propaga novamente a partir do workspace local.

### Depois de alterar a origem, a política ou o modo do OpenShell

```bash
# Edit config:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Para o modo `remote` do OpenShell, recriar exclui o workspace remoto canônico
desse escopo. A próxima execução o propaga novamente a partir do workspace local.

### Depois de alterar setupCommand

```bash
openclaw sandbox recreate --all
# or just one agent:
openclaw sandbox recreate --agent family
```

### Somente para um agente específico

```bash
# Update only one agent's containers
openclaw sandbox recreate --agent alfred
```

## Por que isso é necessário

Quando você atualiza a configuração de sandbox:

- Runtimes existentes continuam em execução com as configurações antigas.
- Runtimes só são removidos após 24h de inatividade.
- Agentes usados regularmente mantêm runtimes antigos ativos indefinidamente.

Use `openclaw sandbox recreate` para forçar a remoção de runtimes antigos. Eles são recriados automaticamente com as configurações atuais quando forem necessários novamente.

<Tip>
Prefira `openclaw sandbox recreate` à limpeza manual específica de backend. Ele usa o registro de runtime do Gateway e evita incompatibilidades quando chaves de escopo ou sessão mudam.
</Tip>

## Migração de registro

O OpenClaw armazena metadados de runtime de sandbox como um fragmento JSON por entrada de contêiner/navegador no diretório de estado do sandbox. Instalações mais antigas ainda podem ter arquivos legados monolíticos:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`

Leituras regulares de runtime de sandbox não reescrevem esses arquivos. Execute `openclaw doctor --fix` para migrar entradas legadas válidas para os diretórios de registro fragmentado. Arquivos legados inválidos são colocados em quarentena para que um registro antigo problemático não oculte entradas de runtime atuais.

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

## Relacionado

- [Referência da CLI](/pt-BR/cli)
- [Sandboxing](/pt-BR/gateway/sandboxing)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Doctor](/pt-BR/gateway/doctor): verifica a configuração de sandbox.
