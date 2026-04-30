---
read_when:
    - Você quer sandboxes gerenciados na nuvem em vez do Docker local
    - Você está configurando o Plugin OpenShell
    - Você precisa escolher entre o modo espelho e o modo de espaço de trabalho remoto
summary: Use o OpenShell como back-end de sandbox gerenciado para agentes do OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-04-30T09:50:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 694a0a145802f4b624af01b58cbb5886bab7426fb9a90f216480141082089144
    source_path: gateway/openshell.md
    workflow: 16
---

O OpenShell é um backend de sandbox gerenciado para OpenClaw. Em vez de executar contêineres Docker
localmente, o OpenClaw delega o ciclo de vida do sandbox à CLI `openshell`,
que provisiona ambientes remotos com execução de comandos baseada em SSH.

O Plugin OpenShell reutiliza o mesmo transporte SSH central e a ponte de sistema de arquivos
remoto que o [backend SSH](/pt-BR/gateway/sandboxing#ssh-backend) genérico. Ele adiciona
ciclo de vida específico do OpenShell (`sandbox create/get/delete`, `sandbox ssh-config`)
e um modo opcional de workspace `mirror`.

## Pré-requisitos

- A CLI `openshell` instalada e no `PATH` (ou defina um caminho personalizado via
  `plugins.entries.openshell.config.command`)
- Uma conta OpenShell com acesso a sandbox
- OpenClaw Gateway em execução no host

## Início rápido

1. Habilite o Plugin e defina o backend de sandbox:

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

2. Reinicie o Gateway. No próximo turno do agente, o OpenClaw cria um sandbox
   OpenShell e roteia a execução de ferramentas por ele.

3. Verifique:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modos de workspace

Esta é a decisão mais importante ao usar o OpenShell.

### `mirror`

Use `plugins.entries.openshell.config.mode: "mirror"` quando quiser que o **workspace
local permaneça canônico**.

Comportamento:

- Antes de `exec`, o OpenClaw sincroniza o workspace local para o sandbox OpenShell.
- Depois de `exec`, o OpenClaw sincroniza o workspace remoto de volta para o workspace local.
- As ferramentas de arquivo ainda operam pela ponte de sandbox, mas o workspace local
  permanece a fonte da verdade entre turnos.

Ideal para:

- Você edita arquivos localmente fora do OpenClaw e quer que essas alterações fiquem visíveis no
  sandbox automaticamente.
- Você quer que o sandbox OpenShell se comporte o máximo possível como o backend Docker.
- Você quer que o workspace do host reflita as gravações do sandbox após cada turno de exec.

Contrapartida: custo extra de sincronização antes e depois de cada exec.

### `remote`

Use `plugins.entries.openshell.config.mode: "remote"` quando quiser que o
**workspace OpenShell se torne canônico**.

Comportamento:

- Quando o sandbox é criado pela primeira vez, o OpenClaw inicializa o workspace remoto a partir
  do workspace local uma vez.
- Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam
  diretamente no workspace remoto OpenShell.
- O OpenClaw **não** sincroniza alterações remotas de volta para o workspace local.
- Leituras de mídia em tempo de prompt ainda funcionam porque as ferramentas de arquivo e mídia leem pela
  ponte de sandbox.

Ideal para:

- O sandbox deve existir principalmente no lado remoto.
- Você quer menor sobrecarga de sincronização por turno.
- Você não quer que edições locais do host sobrescrevam silenciosamente o estado do sandbox remoto.

<Warning>
Se você editar arquivos no host fora do OpenClaw após a inicialização inicial, o sandbox remoto **não** verá essas alterações. Use `openclaw sandbox recreate` para reinicializar.
</Warning>

### Escolhendo um modo

|                          | `mirror`                   | `remote`                  |
| ------------------------ | -------------------------- | ------------------------- |
| **Workspace canônico**   | Host local                 | OpenShell remoto          |
| **Direção da sincronização** | Bidirecional (cada exec)   | Inicialização única       |
| **Sobrecarga por turno** | Maior (upload + download)  | Menor (operações remotas diretas) |
| **Edições locais visíveis?** | Sim, no próximo exec        | Não, até recriar          |
| **Ideal para**           | Fluxos de desenvolvimento  | Agentes de longa duração, CI |

## Referência de configuração

Toda configuração do OpenShell fica em `plugins.entries.openshell.config`:

| Chave                     | Tipo                     | Padrão        | Descrição                                             |
| ------------------------- | ------------------------ | ------------- | ----------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`    | Modo de sincronização do workspace                    |
| `command`                 | `string`                 | `"openshell"` | Caminho ou nome da CLI `openshell`                    |
| `from`                    | `string`                 | `"openclaw"`  | Origem do sandbox para criação inicial                |
| `gateway`                 | `string`                 | —             | Nome do gateway OpenShell (`--gateway`)               |
| `gatewayEndpoint`         | `string`                 | —             | URL do endpoint do gateway OpenShell (`--gateway-endpoint`) |
| `policy`                  | `string`                 | —             | ID da política OpenShell para criação do sandbox      |
| `providers`               | `string[]`               | `[]`          | Nomes de provedores a anexar quando o sandbox for criado |
| `gpu`                     | `boolean`                | `false`       | Solicitar recursos de GPU                             |
| `autoProviders`           | `boolean`                | `true`        | Passar `--auto-providers` durante a criação do sandbox |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Workspace gravável principal dentro do sandbox        |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Caminho de montagem do workspace do agente (para acesso somente leitura) |
| `timeoutSeconds`          | `number`                 | `120`         | Timeout para operações da CLI `openshell`             |

As configurações no nível do sandbox (`mode`, `scope`, `workspaceAccess`) são configuradas em
`agents.defaults.sandbox`, como em qualquer backend. Veja
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

Sandboxes OpenShell são gerenciados pela CLI normal de sandbox:

```bash
# List all sandbox runtimes (Docker + OpenShell)
openclaw sandbox list

# Inspect effective policy
openclaw sandbox explain

# Recreate (deletes remote workspace, re-seeds on next use)
openclaw sandbox recreate --all
```

Para o modo `remote`, **recriar é especialmente importante**: ele exclui o workspace
remoto canônico desse escopo. O próximo uso inicializa um novo workspace remoto a partir
do workspace local.

Para o modo `mirror`, recriar principalmente redefine o ambiente de execução remoto, porque
o workspace local permanece canônico.

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

O OpenShell fixa o fd raiz do workspace e verifica novamente a identidade do sandbox antes de cada
leitura, então trocas de symlink ou um workspace remontado não conseguem redirecionar leituras para fora
do workspace remoto pretendido.

## Limitações atuais

- O navegador de sandbox não é compatível com o backend OpenShell.
- `sandbox.docker.binds` não se aplica ao OpenShell.
- Ajustes de runtime específicos do Docker em `sandbox.docker.*` se aplicam apenas ao backend Docker.

## Como funciona

1. O OpenClaw chama `openshell sandbox create` (com flags `--from`, `--gateway`,
   `--policy`, `--providers`, `--gpu` conforme configurado).
2. O OpenClaw chama `openshell sandbox ssh-config <name>` para obter detalhes de conexão SSH
   do sandbox.
3. O núcleo grava a configuração SSH em um arquivo temporário e abre uma sessão SSH usando a
   mesma ponte de sistema de arquivos remoto que o backend SSH genérico.
4. No modo `mirror`: sincroniza local para remoto antes de exec, executa, sincroniza de volta após exec.
5. No modo `remote`: inicializa uma vez na criação e então opera diretamente no workspace
   remoto.

## Relacionado

- [Sandboxing](/pt-BR/gateway/sandboxing) -- modos, escopos e comparação de backends
- [Sandbox vs Tool Policy vs Elevated](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) -- depuração de ferramentas bloqueadas
- [Multi-Agent Sandbox and Tools](/pt-BR/tools/multi-agent-sandbox-tools) -- substituições por agente
- [Sandbox CLI](/pt-BR/cli/sandbox) -- comandos `openclaw sandbox`
