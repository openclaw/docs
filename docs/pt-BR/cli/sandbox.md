---
read_when: You are managing sandbox runtimes or debugging sandbox/tool-policy behavior.
status: active
summary: Gerencie runtimes de sandbox e inspecione a política de sandbox efetiva
title: CLI do sandbox
x-i18n:
    generated_at: "2026-07-12T15:06:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d41d81971b673d814697a4bf800d6973180c58e4cc5e69748614501dca3a6b6d
    source_path: cli/sandbox.md
    workflow: 16
---

Gerencie runtimes de sandbox para execução isolada de agentes: contêineres Docker, destinos SSH ou backends OpenShell.

## Comandos

### `openclaw sandbox list`

Liste os runtimes de sandbox com status, backend, correspondência de configuração, idade, tempo de inatividade e sessão/agente associado.

```bash
openclaw sandbox list
openclaw sandbox list --browser  # somente contêineres de navegador
openclaw sandbox list --json
```

### `openclaw sandbox recreate`

Remova runtimes de sandbox para forçar sua recriação com a configuração atual. Os runtimes são recriados automaticamente na próxima vez que o agente for usado.

```bash
openclaw sandbox recreate --all
openclaw sandbox recreate --agent mybot        # inclui subsessões agent:mybot:*
openclaw sandbox recreate --session "agent:main:main"
openclaw sandbox recreate --browser --all      # somente contêineres de navegador
openclaw sandbox recreate --all --force        # ignora a confirmação
```

Opções:

- `--all`: recria todos os contêineres de sandbox
- `--session <key>`: recria o runtime com esta chave de escopo exata (conforme exibida por `sandbox list`); sem expansão de nome curto
- `--agent <id>`: recria os runtimes de um agente (corresponde a `agent:<id>` e `agent:<id>:*`)
- `--browser`: afeta somente contêineres de navegador
- `--force`: ignora a solicitação de confirmação

Passe exatamente uma das opções `--all`, `--session` ou `--agent`.

Para `ssh` e `remote` do OpenShell, a recriação é mais importante do que com o Docker: o workspace remoto se torna canônico após a carga inicial, `recreate` exclui esse workspace remoto canônico para o escopo selecionado e a próxima execução o recarrega a partir do workspace local atual.

### `openclaw sandbox explain`

Inspecione o modo/escopo efetivo da sandbox e o acesso ao workspace, a política de ferramentas da sandbox e os controles de ferramentas elevadas (com caminhos de chaves de configuração para correção).

O relatório mantém `workspaceRoot` como a raiz de sandbox configurada e mostra separadamente o workspace efetivo do host, o diretório de trabalho do runtime do backend e a tabela de montagens do Docker. Para `workspaceAccess: "rw"`, o workspace efetivo do host é o workspace do agente, em vez de um diretório abaixo de `workspaceRoot`.

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Ao contrário de `recreate --session`, este comando aceita nomes curtos de sessão (por exemplo, `main`) e os expande em relação ao agente resolvido.

## Por que a recriação é necessária

Atualizar a configuração da sandbox não afeta contêineres em execução: os runtimes existentes mantêm suas configurações antigas, e runtimes inativos só são removidos após `prune.idleHours` (padrão de 24h). Agentes usados regularmente podem manter runtimes desatualizados ativos indefinidamente. `openclaw sandbox recreate` remove o runtime antigo para que o próximo uso o reconstrua com a configuração atual.

<Tip>
Prefira `openclaw sandbox recreate` à limpeza manual específica do backend. Ele usa o registro de runtimes do Gateway e evita incompatibilidades quando o escopo ou as chaves de sessão mudam.
</Tip>

## Gatilhos comuns

| Alteração                                                                                                                                                      | Comando                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Atualização da imagem do Docker (`agents.defaults.sandbox.docker.image`)                                                                                        | `openclaw sandbox recreate --all`                                   |
| Configuração da sandbox (`agents.defaults.sandbox.*`)                                                                                                           | `openclaw sandbox recreate --all`                                   |
| Destino/autenticação SSH (`agents.defaults.sandbox.ssh.{target,workspaceRoot,identityFile,certificateFile,knownHostsFile,identityData,certificateData,knownHostsData}`) | `openclaw sandbox recreate --all`                                   |
| Origem/política/modo do OpenShell (`plugins.entries.openshell.config.{from,mode,policy}`)                                                                        | `openclaw sandbox recreate --all`                                   |
| `setupCommand`                                                                                                                                                  | `openclaw sandbox recreate --all` (ou `--agent <id>` para um agente) |

<Note>
Os runtimes são recriados automaticamente na próxima vez que o agente é usado.
</Note>

## Migração do registro

Os metadados dos runtimes de sandbox ficam no banco de dados de estado SQLite compartilhado. Instalações mais antigas podem ter arquivos de registro legados que as leituras regulares não reescrevem mais:

- `~/.openclaw/sandbox/containers.json`
- `~/.openclaw/sandbox/browsers.json`
- um fragmento JSON por contêiner/navegador em `~/.openclaw/sandbox/containers/` ou `~/.openclaw/sandbox/browsers/`

Execute `openclaw doctor --fix` para migrar entradas legadas válidas para o SQLite. Arquivos legados inválidos são colocados em quarentena para que um registro antigo corrompido não possa ocultar entradas de runtime atuais.

## Configuração

As configurações da sandbox ficam em `~/.openclaw/openclaw.json`, em `agents.defaults.sandbox` (substituições por agente ficam em `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // desativado, exceto principal, todos
        "backend": "docker", // docker, ssh, openshell (fornecido por Plugin)
        "scope": "agent", // sessão, agente, compartilhado
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... mais opções do Docker
        },
        "prune": {
          "idleHours": 24, // remoção automática após 24h de inatividade
          "maxAgeDays": 7, // remoção automática após 7 dias
        },
      },
    },
  },
}
```

## Relacionados

- [Referência da CLI](/pt-BR/cli)
- [Uso de sandbox](/pt-BR/gateway/sandboxing)
- [Workspace do agente](/pt-BR/concepts/agent-workspace)
- [Doctor](/pt-BR/gateway/doctor): verifica a configuração da sandbox.
