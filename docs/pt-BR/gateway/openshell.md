---
read_when:
    - Você quer sandboxes gerenciados na nuvem em vez do Docker local
    - Você está configurando o plugin OpenShell
    - Você precisa escolher entre os modos de espaço de trabalho espelhado e remoto
summary: Use o OpenShell como um backend de sandbox gerenciado para agentes do OpenClaw
title: OpenShell
x-i18n:
    generated_at: "2026-07-11T23:58:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf5c33912bd0db759a01cf58ea26712a8ada68c0804bf16f69f1f7cdd496828c
    source_path: gateway/openshell.md
    workflow: 16
---

OpenShell é um backend de sandbox gerenciado: em vez de executar contêineres Docker
localmente, o OpenClaw delega o ciclo de vida da sandbox à CLI `openshell`, que
provisiona ambientes remotos e executa comandos por SSH.

O plugin reutiliza o mesmo transporte SSH e a mesma ponte de sistema de arquivos remoto
do [backend SSH](/pt-BR/gateway/sandboxing#ssh-backend) genérico e adiciona o ciclo de vida
do OpenShell (`sandbox create/get/delete/ssh-config`), além de um modo opcional de
sincronização do espaço de trabalho chamado `mirror`.

## Pré-requisitos

- Plugin do OpenShell instalado (`openclaw plugins install @openclaw/openshell-sandbox`)
- CLI `openshell` no `PATH` (ou um caminho personalizado por meio de
  `plugins.entries.openshell.config.command`)
- Uma conta do OpenShell com acesso a sandboxes
- Gateway do OpenClaw em execução no host

## Início rápido

```bash
openclaw plugins install @openclaw/openshell-sandbox
```

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

Reinicie o Gateway. No próximo turno do agente, o OpenClaw criará uma sandbox
do OpenShell e encaminhará a execução de ferramentas por ela. Verifique com:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Modos do espaço de trabalho

Esta é a decisão mais importante ao usar o OpenShell.

### mirror (padrão)

`plugins.entries.openshell.config.mode: "mirror"` mantém o **espaço de trabalho
local como canônico**:

- Antes de `exec`, o OpenClaw sincroniza o espaço de trabalho local com a sandbox.
- Depois de `exec`, o OpenClaw sincroniza o espaço de trabalho remoto de volta para o local.
- As ferramentas de arquivos passam pela ponte da sandbox, mas o local continua sendo
  a fonte da verdade entre os turnos.

É mais indicado para fluxos de trabalho de desenvolvimento: edições locais feitas fora
do OpenClaw aparecem na próxima execução, e a sandbox se comporta de forma semelhante
ao backend do Docker.

Desvantagem: custo de upload e download em cada turno de execução.

### remote

`mode: "remote"` torna o **espaço de trabalho do OpenShell canônico**:

- Na primeira criação da sandbox, o OpenClaw copia uma única vez o espaço de trabalho
  local para o remoto.
- Depois disso, `exec`, `read`, `write`, `edit` e `apply_patch` operam
  diretamente no espaço de trabalho remoto. O OpenClaw **não** sincroniza as alterações
  remotas de volta para o local.
- As leituras de mídia durante a preparação do prompt continuam funcionando (as ferramentas
  de arquivos e mídia leem pela ponte da sandbox).

É mais indicado para agentes de longa duração e CI: menor sobrecarga por turno, e edições
locais no host não podem sobrescrever silenciosamente o estado remoto.

<Warning>
As edições de arquivos feitas no host fora do OpenClaw após a cópia inicial não ficam visíveis para a sandbox remota. Execute `openclaw sandbox recreate` para copiar novamente.
</Warning>

### Escolha de um modo

|                              | `mirror`                         | `remote`                         |
| ---------------------------- | -------------------------------- | -------------------------------- |
| **Espaço de trabalho canônico** | Host local                     | OpenShell remoto                 |
| **Direção da sincronização** | Bidirecional (a cada execução)   | Cópia inicial única              |
| **Sobrecarga por turno**      | Maior (upload e download)        | Menor (operações remotas diretas) |
| **Edições locais visíveis?**  | Sim, na próxima execução         | Não, até recriar                 |
| **Mais indicado para**        | Fluxos de trabalho de desenvolvimento | Agentes de longa duração, CI |

## Referência de configuração

Toda a configuração do OpenShell fica em `plugins.entries.openshell.config`:

| Chave                     | Tipo                     | Padrão        | Descrição                                                                                     |
| ------------------------- | ------------------------ | ------------- | --------------------------------------------------------------------------------------------- |
| `mode`                    | `"mirror"` ou `"remote"` | `"mirror"`    | Modo de sincronização do espaço de trabalho                                                   |
| `command`                 | `string`                 | `"openshell"` | Caminho ou nome da CLI `openshell`                                                            |
| `from`                    | `string`                 | `"openclaw"`  | Origem da sandbox na primeira criação                                                         |
| `gateway`                 | `string`                 | não definido  | Nome do gateway do OpenShell (`--gateway` no nível superior)                                  |
| `gatewayEndpoint`         | `string`                 | não definido  | Endpoint do gateway do OpenShell (`--gateway-endpoint` no nível superior)                     |
| `policy`                  | `string`                 | não definido  | ID da política do OpenShell para criação da sandbox                                           |
| `providers`               | `string[]`               | `[]`          | Nomes dos provedores associados na criação da sandbox (sem duplicatas, uma opção `--provider` por entrada) |
| `gpu`                     | `boolean`                | `false`       | Solicita recursos de GPU (`--gpu`)                                                            |
| `autoProviders`           | `boolean`                | `true`        | Passa `--auto-providers` (ou `--no-auto-providers` quando falso) durante a criação            |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`  | Espaço de trabalho gravável principal dentro da sandbox                                       |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`    | Caminho de montagem do espaço de trabalho do agente (somente leitura quando o acesso ao espaço de trabalho não é `rw`) |
| `timeoutSeconds`          | `number`                 | `120`         | Tempo limite das operações da CLI `openshell`                                                 |

`remoteWorkspaceDir` e `remoteAgentWorkspaceDir` devem ser caminhos absolutos e
permanecer sob as raízes gerenciadas `/sandbox` ou `/agent`; outros caminhos absolutos são
rejeitados.

As configurações no nível da sandbox (`mode`, `scope`, `workspaceAccess`) ficam em
`agents.defaults.sandbox`, como em qualquer backend. Consulte
[Sandbox](/pt-BR/gateway/sandboxing) para ver a matriz completa.

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

```bash
# Lista todos os runtimes de sandbox (Docker + OpenShell)
openclaw sandbox list

# Inspeciona a política efetiva
openclaw sandbox explain

# Recria (exclui o espaço de trabalho remoto e copia novamente no próximo uso)
openclaw sandbox recreate --all
```

No modo `remote`, a recriação é especialmente importante: ela exclui o espaço de trabalho
remoto canônico daquele escopo, e o próximo uso copia um novo a partir do
local. No modo `mirror`, a recriação redefine principalmente o ambiente de execução
remoto, pois o local continua sendo canônico.

Recrie após alterar qualquer um destes itens:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

## Reforço da segurança

A ponte do sistema de arquivos no modo mirror fixa a raiz do espaço de trabalho local e verifica
novamente os caminhos canônicos (por meio de realpath) antes de cada leitura, gravação, criação de
diretório, remoção e renomeação, rejeitando links simbólicos no meio do caminho. Uma troca de link
simbólico ou uma remontagem do espaço de trabalho não pode redirecionar o acesso a arquivos para
fora da árvore espelhada.

## Limitações atuais

- O navegador da sandbox não é compatível com o backend do OpenShell.
- `sandbox.docker.binds` não se aplica ao OpenShell; a criação da sandbox falha
  se houver montagens configuradas.
- As opções de runtime específicas do Docker em `sandbox.docker.*` (exceto `env`)
  aplicam-se somente ao backend do Docker.

## Como funciona

1. O OpenClaw executa `sandbox get` para o nome da sandbox (com qualquer
   `--gateway`/`--gateway-endpoint` configurado); se isso falhar, cria uma com
   `sandbox create`, passando `--name`, `--from`, `--policy` quando definido, `--gpu`
   quando habilitado, `--auto-providers`/`--no-auto-providers` e uma opção
   `--provider` por provedor configurado.
2. O OpenClaw executa `sandbox ssh-config` para o nome da sandbox a fim de obter os
   detalhes da conexão SSH.
3. O núcleo grava a configuração SSH em um arquivo temporário e abre uma sessão SSH por
   meio da mesma ponte de sistema de arquivos remoto usada pelo backend SSH genérico.
4. No modo `mirror`: sincroniza do local para o remoto antes da execução, executa e sincroniza de volta depois.
5. No modo `remote`: copia uma vez na criação e depois opera diretamente no espaço de trabalho
   remoto.

## Relacionados

- [Sandbox](/pt-BR/gateway/sandboxing) - modos, escopos e comparação de backends
- [Sandbox vs. política de ferramentas vs. modo elevado](/pt-BR/gateway/sandbox-vs-tool-policy-vs-elevated) - depuração de ferramentas bloqueadas
- [Sandbox e ferramentas multiagente](/pt-BR/tools/multi-agent-sandbox-tools) - substituições por agente
- [CLI de sandbox](/pt-BR/cli/sandbox) - comandos `openclaw sandbox`
