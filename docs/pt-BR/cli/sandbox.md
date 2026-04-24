---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gerencie runtimes de sandbox e inspecione a política de sandbox efetiva
title: CLI de sandbox
x-i18n:
    generated_at: "2026-04-24T05:46:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f2b5835968faac0a8243fd6eadfcecb51b211fe7b346454e215312b1b6d5e65
    source_path: cli/sandbox.md
    workflow: 15
---

Gerencie runtimes de sandbox para execução isolada de agentes.

## Visão geral

O OpenClaw pode executar agentes em runtimes de sandbox isolados por segurança. Os comandos `sandbox` ajudam você a inspecionar e recriar esses runtimes após atualizações ou mudanças de configuração.

Hoje isso geralmente significa:

- contêineres de sandbox do Docker
- runtimes de sandbox SSH quando `agents.defaults.sandbox.backend = "ssh"`
- runtimes de sandbox OpenShell quando `agents.defaults.sandbox.backend = "openshell"`

Para `ssh` e OpenShell `remote`, recriar é mais importante do que com Docker:

- o workspace remoto é canônico após o seed inicial
- `openclaw sandbox recreate` exclui esse workspace remoto canônico para o escopo selecionado
- o próximo uso faz o seed novamente a partir do workspace local atual

## Comandos

### `openclaw sandbox explain`

Inspecione o modo/escopo/acesso ao workspace **efetivos** do sandbox, a política de ferramentas do sandbox e os controles elevados (com caminhos de chave de configuração para correção).

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
openclaw sandbox list --browser  # Listar apenas contêineres de browser
openclaw sandbox list --json     # Saída JSON
```

**A saída inclui:**

- Nome e status do runtime
- Backend (`docker`, `openshell`, etc.)
- Rótulo de configuração e se corresponde à configuração atual
- Idade (tempo desde a criação)
- Tempo ocioso (tempo desde o último uso)
- Sessão/agente associado

### `openclaw sandbox recreate`

Remova runtimes de sandbox para forçar a recriação com configuração atualizada.

```bash
openclaw sandbox recreate --all                # Recriar todos os contêineres
openclaw sandbox recreate --session main       # Sessão específica
openclaw sandbox recreate --agent mybot        # Agente específico
openclaw sandbox recreate --browser            # Apenas contêineres de browser
openclaw sandbox recreate --all --force        # Pular confirmação
```

**Opções:**

- `--all`: recriar todos os contêineres de sandbox
- `--session <key>`: recriar o contêiner de uma sessão específica
- `--agent <id>`: recriar contêineres de um agente específico
- `--browser`: recriar apenas contêineres de browser
- `--force`: pular o prompt de confirmação

**Importante:** os runtimes são recriados automaticamente na próxima vez em que o agente for usado.

## Casos de uso

### Após atualizar uma imagem Docker

```bash
# Baixar nova imagem
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# Atualizar a configuração para usar a nova imagem
# Edite a configuração: agents.defaults.sandbox.docker.image (ou agents.list[].sandbox.docker.image)

# Recriar contêineres
openclaw sandbox recreate --all
```

### Após alterar a configuração do sandbox

```bash
# Edite a configuração: agents.defaults.sandbox.* (ou agents.list[].sandbox.*)

# Recriar para aplicar a nova configuração
openclaw sandbox recreate --all
```

### Após alterar o alvo SSH ou material de autenticação SSH

```bash
# Edite a configuração:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

Para o backend principal `ssh`, recriar exclui a raiz do workspace remoto por escopo
no alvo SSH. A próxima execução faz o seed novamente a partir do workspace local.

### Após alterar origem, política ou modo do OpenShell

```bash
# Edite a configuração:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

Para o modo `remote` do OpenShell, recriar exclui o workspace remoto canônico
desse escopo. A próxima execução faz o seed novamente a partir do workspace local.

### Após alterar setupCommand

```bash
openclaw sandbox recreate --all
# ou apenas um agente:
openclaw sandbox recreate --agent family
```

### Apenas para um agente específico

```bash
# Atualizar apenas os contêineres de um agente
openclaw sandbox recreate --agent alfred
```

## Por que isso é necessário?

**Problema:** quando você atualiza a configuração do sandbox:

- runtimes existentes continuam executando com as configurações antigas
- runtimes só são removidos após 24h de inatividade
- agentes usados regularmente mantêm runtimes antigos vivos indefinidamente

**Solução:** use `openclaw sandbox recreate` para forçar a remoção de runtimes antigos. Eles serão recriados automaticamente com as configurações atuais quando forem necessários novamente.

Dica: prefira `openclaw sandbox recreate` em vez de limpeza manual específica de backend.
Ele usa o registro de runtime do Gateway e evita incompatibilidades quando chaves de escopo/sessão mudam.

## Configuração

As configurações de sandbox ficam em `~/.openclaw/openclaw.json` em `agents.defaults.sandbox` (sobrescritas por agente ficam em `agents.list[].sandbox`):

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
          // ... mais opções do Docker
        },
        "prune": {
          "idleHours": 24, // Remoção automática após 24h ocioso
          "maxAgeDays": 7, // Remoção automática após 7 dias
        },
      },
    },
  },
}
```

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Sandboxing](/pt-BR/gateway/sandboxing)
- [Agent workspace](/pt-BR/concepts/agent-workspace)
- [Doctor](/pt-BR/gateway/doctor) — verifica a configuração do sandbox
