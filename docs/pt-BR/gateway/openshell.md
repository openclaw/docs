---
read_when:
    - Você quer sandboxes gerenciados na nuvem em vez de Docker local
    - Você está configurando o Plugin OpenShell
    - Você precisa escolher entre os modos de workspace mirror e remote
summary: Use OpenShell como backend de sandbox gerenciado para agentes OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-23T14:02:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2534127b293364659a14df3e36583a9b7120f5d55cdbd8b4b611efe44adc7ff8
    source_path: gateway/openshell.md
    workflow: 15
---

# OpenShell

OpenShell é um backend de sandbox gerenciado para o OpenClaw. Em vez de executar contêineres Docker
localmente, o OpenClaw delega o ciclo de vida da sandbox à CLI `openshell`,
que provisiona ambientes remotos com execução de comandos baseada em SSH.

O Plugin OpenShell reutiliza o mesmo transporte SSH central e a mesma ponte
de sistema de arquivos remoto do [backend SSH](/pt-BR/gateway/sandboxing#ssh-backend) genérico. Ele adiciona
ciclo de vida específico do OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
e um modo de workspace `mirror` opcional.

## Pré-requisitos

- A CLI `openshell` instalada e disponível em `PATH` (ou defina um caminho personalizado via
  `plugins.entries.openshell.config.command`)
- Uma conta OpenShell com acesso a sandbox
- O Gateway do OpenClaw em execução no host

## Início rápido

1. Ative o Plugin e defina o backend de sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. Reinicie o Gateway. No próximo turno do agente, o OpenClaw criará uma sandbox OpenShell
   e roteará a execução de ferramentas por ela.

3. Verifique:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modos de workspace

Esta é a decisão mais importante ao usar OpenShell.

### `mirror`

Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace
local continue sendo canônico**.

Comportamento:

- Antes de `exec`, o OpenClaw sincroniza o workspace local com a sandbox OpenShell.
- Depois de `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
- Ferramentas de arquivo ainda operam pela ponte da sandbox, mas o workspace local
  continua sendo a fonte da verdade entre turnos.

Melhor para:

- Você edita arquivos localmente fora do OpenClaw e quer que essas mudanças fiquem visíveis na
  sandbox automaticamente.
- Você quer que a sandbox OpenShell se comporte o máximo possível como o backend Docker.
- Você quer que o workspace do host reflita gravações da sandbox após cada turno de exec.

Compromisso: custo extra de sincronização antes e depois de cada exec.

### `remote`

Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o
**workspace OpenShell se torne canônico**.

Comportamento:

- Quando a sandbox é criada pela primeira vez, o OpenClaw inicializa o workspace remoto a partir
  do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam
  diretamente no workspace remoto do OpenShell.
- O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local.
- Leituras de mídia no momento do prompt ainda funcionam porque ferramentas de arquivo e mídia leem pela
  ponte da sandbox.

Melhor para:

- A sandbox deve existir principalmente no lado remoto.
- Você quer menor sobrecarga de sincronização por turno.
- Você não quer que edições locais no host sobrescrevam silenciosamente o estado remoto da sandbox.

Importante: se você editar arquivos no host fora do OpenClaw após a inicialização inicial,
a sandbox remota **não** verá essas alterações. Use
`openclaw sandbox recreate` para inicializar novamente.

### Escolhendo um modo

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Workspace canônico**   | Host local                 | OpenShell remoto          |
| **Direção da sincronização** | Bidirecional (cada exec) | Inicialização única       |
| **Sobrecarga por turno** | Maior (upload + download)  | Menor (operações remotas diretas) |
| **Edições locais visíveis?** | Sim, no próximo exec    | Não, até recriar         |
| **Melhor para**          | Fluxos de desenvolvimento  | Agentes de longa duração, CI |

## Referência de configuração

Toda a config do OpenShell fica em `plugins.entries.openshell.config`:

| Chave                     | Tipo                     | Padrão       | Descrição                                             |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`    | Modo de sincronização do workspace                    |
| `command`                 | `string`                 | `"openshell"` | Caminho ou nome da CLI `openshell`                    |
| `from`                    | `string`                 | `"openclaw"`  | Origem da sandbox para a primeira criação             |
| `gateway`                 | `string`                 | —             | Nome do gateway OpenShell (`--gateway`)               |
| `gatewayEndpoint`         | `string`                 | —             | URL do endpoint do gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID de política OpenShell para criação da sandbox      |
| `providers`               | `string[]`               | `[]`          | Nomes de providers a anexar quando a sandbox é criada |
| `gpu`                     | `boolean`                | `false`       | Solicita recursos de GPU                              |
| `autoProviders`           | `boolean`                | `true`        | Passa `--auto-providers` durante `sandbox create`     |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace gravável principal dentro da sandbox        |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Caminho de montagem do workspace do agente (para acesso somente leitura) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout para operações da CLI `openshell`             |

Configurações no nível da sandbox (`mode`, `scope`, `workspaceAccess`) são definidas em
`agents.defaults.sandbox` como em qualquer backend. Consulte
[Sandboxing](/pt-BR/gateway/sandboxing) para a matriz completa.

## Exemplos

### Configuração remota mínima

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### Modo mirror com GPU

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### OpenShell por agente com gateway personalizado

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## Gerenciamento do ciclo de vida

Sandboxes OpenShell são gerenciadas pela CLI normal de sandbox:

```bash
# Lista todos os runtimes de sandbox (Docker + OpenShell)
openclaw sandbox list

# Inspeciona a política efetiva
openclaw sandbox explain

# Recria (exclui o workspace remoto, reinicializa na próxima utilização)
openclaw sandbox recreate --all
```

Para o modo `remote`, **recreate é especialmente importante**: ele exclui o workspace remoto
canônico para esse escopo. O próximo uso inicializa um workspace remoto novo a partir
do workspace local.

Para o modo `mirror`, recreate principalmente redefine o ambiente de execução remoto porque
o workspace local continua sendo canônico.

### Quando recriar

Recrie após alterar qualquer um destes:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## Reforço de segurança

O OpenShell fixa o descritor de arquivo raiz do workspace e verifica novamente a identidade da sandbox antes de cada
leitura, para que trocas de symlink ou uma remontagem do workspace não possam redirecionar leituras para fora
do workspace remoto pretendido.

## Limitações atuais

- O navegador da sandbox não é compatível com o backend OpenShell.
- `sandbox.docker.binds` não se aplica ao OpenShell.
- Ajustes de runtime específicos do Docker em `sandbox.docker.*` se aplicam apenas ao
  backend Docker.

## Como funciona

1. O OpenClaw chama `openshell sandbox create` (com flags `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` conforme configurado).
2. O OpenClaw chama `openshell sandbox ssh-config <name>` para obter detalhes
   de conexão SSH da sandbox.
3. O core grava a config SSH em um arquivo temporário e abre uma sessão SSH usando a
   mesma ponte de sistema de arquivos remoto do backend SSH genérico.
4. No modo `mirror`: sincroniza local para remoto antes de exec, executa, sincroniza de volta após exec.
5. No modo `remote`: inicializa uma vez na criação, depois opera diretamente no workspace
   remoto.

## Veja também

- [Sandboxing](/pt-BR/gateway/sandboxing) -- modos, escopos e comparação de backends
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuração de ferramentas bloqueadas
- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) -- sobrescritas por agente
- [CLI de sandbox](/pt-BR/cli/sandbox) -- comandos `openclaw sandbox`
