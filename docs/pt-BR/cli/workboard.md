---
read_when:
    - Você quer inspecionar ou criar cartões do Workboard pelo terminal
    - Você quer iniciar execuções de trabalhadores do Workboard pela CLI
    - Você está depurando o comportamento da CLI do Workboard ou dos comandos de barra
summary: Referência da CLI para cartões, despacho e execuções de workers do `openclaw workboard`
title: CLI do quadro de trabalho
x-i18n:
    generated_at: "2026-07-11T23:51:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` é a interface de terminal do [Plugin Workboard](/pt-BR/plugins/workboard) incluído. Ele permite que um operador liste cartões, crie um cartão, inspecione um cartão e solicite ao Gateway em execução que encaminhe trabalhos prontos para execuções de trabalhadores de subagentes.

Ative o Plugin antes de usar o comando:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Uso

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

O comando lê e grava no mesmo banco de dados SQLite pertencente ao Plugin usado pelo painel e pelas ferramentas do agente Workboard. Os IDs dos cartões são UUIDs; os comandos que aceitam o ID de um cartão também aceitam um prefixo de ID não ambíguo (a saída de texto compacta mostra os primeiros 8 caracteres).

Valores válidos de `status`: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Valores válidos de `priority`: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

A saída de texto é compacta:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

As colunas são o prefixo do ID, o status, a prioridade, o ID do quadro, o ID opcional do agente e o título.

| Opção                | Finalidade                                                      |
| -------------------- | --------------------------------------------------------------- |
| `--board <id>`       | Limitar os resultados a um namespace de quadro                  |
| `--status <status>`  | Limitar os resultados a um status do Workboard                  |
| `--include-archived` | Incluir cartões arquivados na saída de texto compacta            |
| `--json`             | Exibir a lista completa de cartões como JSON legível por máquina |

Por padrão, a saída de texto compacta oculta cartões arquivados para que a CLI corresponda a `/workboard list`. Passe `--include-archived` para exibi-los. A saída JSON sempre mantém a lista completa de cartões, incluindo os arquivados, para as automações existentes.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Opção                   | Finalidade                                      |
| ----------------------- | ----------------------------------------------- |
| `--notes <text>`        | Notas iniciais do cartão                        |
| `--status <status>`     | Status inicial, padrão `todo`                   |
| `--priority <priority>` | Prioridade, padrão `normal`                     |
| `--agent <id>`          | Atribuir o cartão a um agente ou ID de proprietário |
| `--board <id>`          | Armazenar o cartão em um namespace de quadro    |
| `--labels <items>`      | Rótulos separados por vírgulas                  |
| `--json`                | Exibir o cartão criado como JSON legível por máquina |

`create` grava diretamente no estado SQLite do Workboard. O cartão fica imediatamente visível na aba Workboard da Interface de Controle e para as ferramentas do Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

A saída de texto exibe a linha compacta do cartão e as notas. A saída JSON retorna o registro completo do cartão, incluindo metadados de execução, tentativas, comentários, links, comprovações, artefatos, logs do trabalhador, estado do protocolo, diagnósticos e metadados de automação.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Primeiro, `dispatch` chama o método RPC `workboard.cards.dispatch` do Gateway em execução, que usa o mesmo runtime de subagentes da ação de encaminhamento do painel; assim, os cartões prontos se tornam execuções de trabalhadores rastreadas como tarefas, com chaves de sessão vinculadas. Os cartões com um agente atribuído usam chaves de sessão de subagente no escopo do agente; os cartões não atribuídos mantêm uma chave de subagente sem escopo para preservar o agente padrão configurado no Gateway.

O ciclo de encaminhamento:

1. Promove filhos cujas dependências estão prontas para `ready`.
2. Bloqueia reivindicações expiradas ou execuções de trabalhadores que excederam o tempo limite.
3. Registra metadados de encaminhamento nos cartões prontos.
4. Seleciona um pequeno lote de cartões prontos não reivindicados.
5. Reivindica cada cartão selecionado para o despachante ou agente atribuído.
6. Inicia uma execução de trabalhador de subagente com contexto limitado do cartão e o token de reivindicação do cartão.
7. Armazena no cartão o ID da execução do trabalhador, a chave de sessão, a vinculação da tarefa quando ela é informada pelo registro de tarefas do Gateway, o status de execução e o log do trabalhador.

A seleção é conservadora: por padrão, um encaminhamento inicia no máximo três trabalhadores, ignora cartões arquivados ou já reivindicados e inicia apenas um cartão por proprietário ou agente em uma única passagem. Cartões que já pertencem a trabalhos ativos em execução ou revisão são deixados para um encaminhamento posterior.

Se o início do trabalhador falhar depois que um cartão for reivindicado, o Workboard bloqueia esse cartão, remove a reivindicação e registra a falha nos metadados de execução e de log do trabalhador do cartão, mantendo as falhas de inicialização visíveis em vez de retornar silenciosamente o cartão à fila.

Se nenhum destino explícito do Gateway for fornecido e o Gateway local estiver indisponível ou ainda não expuser o método de encaminhamento do Workboard, a CLI recorre ao encaminhamento somente de dados no estado local do Workboard. O encaminhamento somente de dados ainda pode promover dependências, limpar reivindicações obsoletas e bloquear execuções que excederam o tempo limite, mas não inicia trabalhadores. Falhas de autenticação, permissão e validação, além de falhas de um destino explícito `--url` ou `--token`, são informadas diretamente em vez de acionar o modo alternativo.

A saída de texto informa as inicializações de trabalhadores:

```text
dispatch complete: started=2 failures=0
```

A saída do modo alternativo é explícita:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

A saída JSON inclui o resultado do encaminhamento. O encaminhamento realizado pelo Gateway pode incluir `started` e `startFailures`; o modo alternativo somente de dados inclui `gatewayUnavailable: true`. Os tokens de reivindicação são ocultados da saída JSON dos cartões.

No painel, o mesmo resultado do encaminhamento é exibido como um resumo breve, para que o operador possa ver quantos cartões foram iniciados, promovidos, bloqueados, reivindicados novamente ou falharam sem abrir os detalhes dos cartões.

## Paridade com comandos de barra

Os canais compatíveis com comandos podem usar o comando de barra correspondente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

O encaminhamento por comando de barra também usa o runtime de subagentes do Gateway, portanto segue o mesmo comportamento de reivindicação, inicialização de trabalhadores e falhas do painel e do caminho da CLI pelo Gateway.

`/workboard list` e `/workboard show` são comandos de leitura para remetentes de comandos autorizados. `/workboard create` e `/workboard dispatch` alteram o estado do quadro e exigem status de proprietário em interfaces de chat ou um cliente do Gateway com `operator.write` ou `operator.admin`.

## Permissões

O caminho de encaminhamento da CLI chama o RPC do Gateway com os escopos `operator.read` e `operator.write`. Um token do Gateway somente leitura pode inspecionar os dados do Workboard por meio de métodos de leitura, mas não pode criar cartões nem encaminhar trabalhadores.

Os comandos locais `list`, `create` e `show` operam no diretório de estado local do OpenClaw usado pelo perfil atual. Use `--dev` ou `--profile <name>` no comando `openclaw` de nível superior quando precisar de uma raiz de estado diferente.

## Solução de problemas

### Nenhum cartão aparece

Confirme se o Plugin está ativado para o mesmo perfil e a mesma raiz de estado:

```bash
openclaw plugins inspect workboard --runtime --json
```

Se o painel mostrar cartões, mas a CLI não, verifique se ambos os comandos usam a mesma configuração de `--dev` ou `--profile`.

### O encaminhamento informa que é somente de dados

Inicie ou reinicie o Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Depois, tente `openclaw workboard dispatch` novamente. O modo alternativo somente de dados é útil para a limpeza do estado local, mas as execuções de trabalhadores precisam de um Gateway ativo.

### O encaminhamento não inicia nada

Verifique se há pelo menos um cartão `ready` sem uma reivindicação ativa:

```bash
openclaw workboard list --status ready
```

Os cartões também podem ser ignorados quando o mesmo proprietário já tem trabalhos em execução ou revisão. Mova os trabalhos concluídos para `done`, libere reivindicações obsoletas pelas ferramentas do Workboard ou execute o encaminhamento novamente depois que o trabalhador ativo terminar.

## Relacionados

- [Plugin Workboard](/pt-BR/plugins/workboard)
- [Referência da CLI](/pt-BR/cli)
- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Interface de Controle](/pt-BR/web/control-ui)
