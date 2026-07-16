---
read_when:
    - Você quer inspecionar ou criar cartões do Workboard pelo terminal
    - Você quer despachar execuções de workers do Workboard pela CLI
    - Você está depurando o comportamento da CLI ou dos comandos de barra do Workboard
summary: Referência da CLI para cartões `openclaw workboard`, despacho e execuções de workers
title: CLI do quadro de trabalho
x-i18n:
    generated_at: "2026-07-16T12:22:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` é a interface de terminal do [Plugin Workboard](/pt-BR/plugins/workboard) incluído. Ele permite que um operador liste cartões, crie um cartão, inspecione um cartão e solicite que o Gateway em execução despache trabalhos prontos para execuções de workers de subagentes.

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
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

O comando lê e grava no mesmo banco de dados SQLite pertencente ao Plugin usado pelo painel e pelas ferramentas do agente Workboard. Os IDs dos cartões são UUIDs; os comandos que aceitam um ID de cartão também aceitam um prefixo de ID não ambíguo (a saída de texto compacta mostra os primeiros 8 caracteres).

Valores válidos de `status`: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Valores válidos de `priority`: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

A saída de texto é compacta:

```text
7f4a2c10  ready     high    default agent-a  Corrigir Heartbeat obsoleto do worker
```

As colunas são o prefixo do ID, o status, a prioridade, o ID do quadro, o ID opcional do agente e o título.

| Sinalizador                 | Finalidade                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Limitar os resultados a um namespace de quadro          |
| `--status <status>`  | Limitar os resultados a um status do Workboard         |
| `--include-archived` | Incluir cartões arquivados na saída de texto compacta |
| `--json`             | Imprimir a lista completa de cartões como JSON para máquinas      |

Por padrão, a saída de texto compacta oculta os cartões arquivados para que a CLI corresponda a `/workboard list`. Passe `--include-archived` para exibi-los. A saída JSON sempre mantém a lista completa de cartões, incluindo os cartões arquivados, para as automações existentes.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Sinalizador                    | Finalidade                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | Notas iniciais do cartão                      |
| `--status <status>`     | Status inicial, padrão `todo`          |
| `--priority <priority>` | Prioridade, padrão `normal`              |
| `--agent <id>`          | Atribuir o cartão a um agente ou ID de proprietário |
| `--board <id>`          | Armazenar o cartão em um namespace de quadro     |
| `--labels <items>`      | Rótulos separados por vírgulas                  |
| `--json`                | Imprimir o cartão criado como JSON para máquinas  |

`create` grava diretamente no estado SQLite do Workboard. O cartão fica imediatamente visível na aba Workboard da interface de controle e para as ferramentas do Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

A saída de texto imprime a linha compacta do cartão e as notas. A saída JSON retorna o registro completo do cartão, incluindo metadados de execução, tentativas, comentários, links, comprovação, artefatos, logs do worker, estado do protocolo, diagnósticos e metadados de automação.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` altera o status do cartão usando o mesmo fluxo de operador manual usado ao arrastar um cartão no painel. Ele aceita um ID completo de cartão ou um prefixo não ambíguo. As retenções ativas por dependência e agendamento continuam aplicáveis. Os operadores podem mover um cartão reivindicado sem o token de reivindicação do agente; os tokens de reivindicação permanecem restritos às mutações das ferramentas do agente e são ocultados da saída JSON.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` primeiro chama o método RPC `workboard.cards.dispatch` do Gateway em execução, que usa o mesmo runtime de subagentes da ação de despacho do painel, para que os cartões prontos se tornem execuções de workers rastreadas como tarefas com chaves de sessão vinculadas. `--max-starts` usa o método aditivo `workboard.cards.dispatchWithOptions` para que um Gateway mais antigo rejeite a opção antes de iniciar qualquer worker; reinicie o Gateway após a atualização antes de usar o sinalizador. Cartões com um agente atribuído usam chaves de sessão de subagente com escopo de agente; cartões não atribuídos mantêm uma chave de subagente sem escopo para preservar o agente padrão configurado do Gateway.

O loop de despacho:

1. Promove filhos cujas dependências estão prontas para `ready`.
2. Bloqueia reivindicações expiradas ou execuções de workers que excederam o tempo limite.
3. Registra metadados de despacho nos cartões prontos.
4. Seleciona um pequeno lote de cartões prontos não reivindicados.
5. Reivindica cada cartão selecionado para o despachante ou agente atribuído.
6. Inicia uma execução de worker de subagente com contexto limitado do cartão e o token de reivindicação do cartão.
7. Armazena no cartão o ID da execução do worker, a chave de sessão, o vínculo com a tarefa quando informado pelo registro de tarefas do Gateway, o status da execução e o log do worker.

A seleção é conservadora: por padrão, um despacho inicia no máximo três workers, ignora cartões arquivados ou já reivindicados e inicia apenas um cartão por proprietário ou agente em uma única passagem. Cartões que já pertencem a trabalhos ativos em execução ou em revisão são deixados para um despacho posterior. Passe `--max-starts <count>` com um número inteiro positivo para alterar o limite por passagem; a regra de um cartão por proprietário continua aplicável, portanto o número efetivo de inicializações pode ser menor.

Se a inicialização do worker falhar após a reivindicação de um cartão, o Workboard bloqueia esse cartão, remove a reivindicação e registra a falha nos metadados de execução e de log do worker do cartão, mantendo as inicializações com falha visíveis em vez de devolver silenciosamente o cartão à fila.

Se nenhum destino explícito do Gateway for fornecido e o Gateway local estiver indisponível ou ainda não expuser o método de despacho do Workboard, a CLI recorre ao despacho somente de dados no estado local do Workboard. O despacho somente de dados ainda pode promover dependências, limpar reivindicações obsoletas e bloquear execuções que excederam o tempo limite, mas não inicia workers. Falhas de autenticação, permissão e validação, assim como falhas de um destino explícito `--url` ou `--token`, são informadas diretamente em vez de acionar o fallback.

A saída de texto informa as inicializações de workers:

```text
despacho concluído: iniciados=2 falhas=0
```

A saída de fallback é explícita:

```text
gateway indisponível; somente despacho de dados: promovidos=1 bloqueados=0
```

A saída JSON inclui o resultado do despacho. O despacho apoiado pelo Gateway pode incluir `started` e `startFailures`; o fallback somente de dados inclui `gatewayUnavailable: true`. Os tokens de reivindicação são ocultados da saída JSON dos cartões.

No painel, o mesmo resultado do despacho é exibido como um resumo curto para que um operador veja quantos cartões foram iniciados, promovidos, bloqueados, recuperados ou falharam sem abrir os detalhes dos cartões.

## Paridade com comandos de barra

Os canais compatíveis com comandos podem usar o comando de barra correspondente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Corrigir Heartbeat obsoleto do worker
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

O despacho por comando de barra também usa o runtime de subagentes do Gateway, portanto segue o mesmo comportamento de reivindicação, inicialização de workers e falha do painel e do fluxo da CLI pelo Gateway.

`/workboard list` e `/workboard show` são comandos de leitura para remetentes de comandos autorizados. `/workboard create`, `/workboard move` e `/workboard dispatch` alteram o estado do quadro e exigem status de proprietário nas interfaces de chat ou um cliente Gateway com `operator.write` ou `operator.admin`.

## Permissões

O fluxo de despacho da CLI normalmente solicita os escopos `operator.write` e `operator.read` do Gateway. Cartões vinculados a um workspace são executados diretamente em um workspace de agente configurado exato; uma solicitação de worktree é restringida a esse diretório, em vez de permitir que o host materialize código controlado pelo repositório. O worker selecionado deve ter acesso de gravação e não compartilhado ao sandbox do Docker nesse workspace exato, um hash de contêiner ativo correspondente às montagens e à política solicitadas e nenhuma capacidade de escape para o host. Passe `--admin` para solicitar explicitamente `operator.admin`, permitir outro checkout do host e usar a configuração normal de worktree gerenciada; a conexão falhará se esse escopo não for aprovado para o cliente. Um token do Gateway somente leitura pode inspecionar os dados do Workboard por meio de métodos de leitura, mas não pode criar cartões nem despachar workers. De resto, os limites do workspace não alteram a movimentação manual de cartões para chamadores com permissão de alteração do Workboard.

Os comandos locais `list`, `create`, `show` e `move` operam no diretório de estado local do OpenClaw usado pelo perfil atual. Use `--dev` ou `--profile <name>` no comando de nível superior `openclaw` quando precisar de uma raiz de estado diferente.

## Solução de problemas

### Nenhum cartão aparece

Confirme que o Plugin está ativado para o mesmo perfil e a mesma raiz de estado:

```bash
openclaw plugins inspect workboard --runtime --json
```

Se o painel exibir cartões, mas a CLI não, verifique se ambos os comandos usam a mesma configuração `--dev` ou `--profile`.

### O despacho informa que é somente de dados

Inicie ou reinicie o Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Em seguida, tente `openclaw workboard dispatch` novamente. O fallback somente de dados é útil para a limpeza do estado local, mas as execuções de workers precisam de um Gateway ativo.

### O despacho não inicia nada

Verifique se há pelo menos um cartão `ready` sem uma reivindicação ativa:

```bash
openclaw workboard list --status ready
```

Os cartões também podem ser ignorados quando o mesmo proprietário já tem trabalho em execução ou em revisão. Mova o trabalho concluído para `done`, libere reivindicações obsoletas pelas ferramentas do Workboard ou execute o despacho novamente após a conclusão do worker ativo.

## Relacionados

- [Plugin Workboard](/pt-BR/plugins/workboard)
- [Referência da CLI](/pt-BR/cli)
- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Interface de controle](/pt-BR/web/control-ui)
