---
read_when:
    - Você quer inspecionar ou criar cartões do Workboard pelo terminal
    - Você quer iniciar execuções de workers do Workboard pela CLI
    - Você está depurando o comportamento da CLI ou dos comandos de barra do Workboard
summary: Referência da CLI para cartões de `openclaw workboard`, despacho e execuções de workers
title: CLI do Workboard
x-i18n:
    generated_at: "2026-07-12T15:04:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` é a interface de terminal do [Plugin Workboard](/pt-BR/plugins/workboard) incluído. Ela permite que um operador liste cartões, crie um cartão, inspecione um cartão e solicite ao Gateway em execução que encaminhe trabalhos prontos para execuções de workers subagentes.

Habilite o Plugin antes de usar o comando:

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

O comando lê e grava no mesmo banco de dados SQLite pertencente ao Plugin que é usado pelo painel e pelas ferramentas de agente do Workboard. Os IDs dos cartões são UUIDs; os comandos que aceitam o ID de um cartão também aceitam um prefixo de ID não ambíguo (a saída de texto compacta mostra os primeiros 8 caracteres).

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

| Opção                | Finalidade                                              |
| -------------------- | ------------------------------------------------------- |
| `--board <id>`       | Limitar os resultados a um namespace de quadro          |
| `--status <status>`  | Limitar os resultados a um status do Workboard          |
| `--include-archived` | Incluir cartões arquivados na saída de texto compacta    |
| `--json`             | Exibir a lista completa de cartões como JSON para máquina |

Por padrão, a saída de texto compacta oculta cartões arquivados para que a CLI corresponda a `/workboard list`. Passe `--include-archived` para exibi-los. A saída JSON sempre mantém a lista completa de cartões, incluindo os arquivados, para as automações existentes.

## `create`

```bash
openclaw workboard create "Corrigir Heartbeat obsoleto do worker" --priority high --labels bug,workboard
openclaw workboard create "Escrever a documentação do Workboard" --status ready --agent docs-agent --board docs --notes "Abordar CLI, comando de barra, encaminhamento e estado SQLite."
```

| Opção                   | Finalidade                                      |
| ----------------------- | ----------------------------------------------- |
| `--notes <text>`        | Notas iniciais do cartão                        |
| `--status <status>`     | Status inicial, padrão `todo`                   |
| `--priority <priority>` | Prioridade, padrão `normal`                     |
| `--agent <id>`          | Atribuir o cartão a um agente ou ID de proprietário |
| `--board <id>`          | Armazenar o cartão em um namespace de quadro    |
| `--labels <items>`      | Rótulos separados por vírgulas                  |
| `--json`                | Exibir o cartão criado como JSON para máquina   |

`create` grava diretamente no estado SQLite do Workboard. O cartão fica imediatamente visível na aba Workboard da Control UI e para as ferramentas do Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

A saída de texto exibe a linha compacta do cartão e as notas. A saída JSON retorna o registro completo do cartão, incluindo metadados de execução, tentativas, comentários, links, comprovação, artefatos, logs do worker, estado do protocolo, diagnósticos e metadados de automação.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Primeiro, `dispatch` chama o método RPC `workboard.cards.dispatch` do Gateway em execução, que usa o mesmo runtime de subagentes que a ação de encaminhamento do painel. Assim, os cartões prontos tornam-se execuções de workers rastreadas como tarefas, com chaves de sessão vinculadas. Os cartões com um agente atribuído usam chaves de sessão de subagente com escopo de agente; os cartões não atribuídos mantêm uma chave de subagente sem escopo, preservando o agente padrão configurado no Gateway.

O ciclo de encaminhamento:

1. Promove filhos cujas dependências estão prontas para `ready`.
2. Bloqueia reivindicações expiradas ou execuções de workers que excederam o tempo limite.
3. Registra metadados de encaminhamento nos cartões prontos.
4. Seleciona um pequeno lote de cartões prontos não reivindicados.
5. Reivindica cada cartão selecionado para o encaminhador ou agente atribuído.
6. Inicia uma execução de worker subagente com contexto limitado do cartão e o token de reivindicação do cartão.
7. Armazena no cartão o ID da execução do worker, a chave de sessão, o vínculo com a tarefa quando informado pelo registro de tarefas do Gateway, o status da execução e o log do worker.

A seleção é conservadora: por padrão, um encaminhamento inicia no máximo três workers, ignora cartões arquivados ou já reivindicados e inicia apenas um cartão por proprietário ou agente em uma única passagem. Cartões que já pertencem a trabalhos ativos em execução ou revisão são deixados para um encaminhamento posterior.

Se o início do worker falhar após a reivindicação de um cartão, o Workboard bloqueia esse cartão, remove a reivindicação e registra a falha nos metadados de execução e de log do worker do cartão, mantendo visíveis as inicializações que falharam em vez de retornar silenciosamente o cartão à fila.

Se nenhum destino explícito do Gateway for fornecido e o Gateway local estiver indisponível ou ainda não expuser o método de encaminhamento do Workboard, a CLI recorre ao encaminhamento somente de dados no estado local do Workboard. O encaminhamento somente de dados ainda pode promover dependências, limpar reivindicações obsoletas e bloquear execuções que excederam o tempo limite, mas não inicia workers. Falhas de autenticação, permissão e validação, além de falhas para um destino explícito de `--url` ou `--token`, são informadas diretamente em vez de acionar o fallback.

A saída de texto informa as inicializações de workers:

```text
encaminhamento concluído: iniciados=2 falhas=0
```

A saída de fallback é explícita:

```text
Gateway indisponível; somente encaminhamento de dados: promovidos=1 bloqueados=0
```

A saída JSON inclui o resultado do encaminhamento. O encaminhamento respaldado pelo Gateway pode incluir `started` e `startFailures`; o fallback somente de dados inclui `gatewayUnavailable: true`. Os tokens de reivindicação são ocultados da saída JSON dos cartões.

No painel, o mesmo resultado do encaminhamento é exibido como um breve resumo para que o operador veja quantos cartões foram iniciados, promovidos, bloqueados, recuperados ou falharam sem abrir os detalhes dos cartões.

## Paridade com comandos de barra

Canais compatíveis com comandos podem usar o comando de barra correspondente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Corrigir Heartbeat obsoleto do worker
/workboard dispatch
```

O encaminhamento por comando de barra também usa o runtime de subagentes do Gateway e, portanto, segue o mesmo comportamento de reivindicação, início de workers e falhas que o caminho do Gateway usado pelo painel e pela CLI.

`/workboard list` e `/workboard show` são comandos de leitura para remetentes de comandos autorizados. `/workboard create` e `/workboard dispatch` alteram o estado do quadro e exigem status de proprietário nas interfaces de chat ou um cliente do Gateway com `operator.write` ou `operator.admin`.

## Permissões

O caminho de encaminhamento da CLI chama o RPC do Gateway com os escopos `operator.read` e `operator.write`. Um token somente leitura do Gateway pode inspecionar dados do Workboard por meio de métodos de leitura, mas não pode criar cartões nem encaminhar workers.

Os comandos locais `list`, `create` e `show` operam no diretório de estado local do OpenClaw usado pelo perfil atual. Use `--dev` ou `--profile <name>` no comando `openclaw` de nível superior quando precisar de uma raiz de estado diferente.

## Solução de problemas

### Nenhum cartão aparece

Confirme se o Plugin está habilitado para o mesmo perfil e raiz de estado:

```bash
openclaw plugins inspect workboard --runtime --json
```

Se o painel mostrar cartões, mas a CLI não, verifique se ambos os comandos usam a mesma configuração de `--dev` ou `--profile`.

### O encaminhamento informa somente dados

Inicie ou reinicie o Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Depois, tente novamente `openclaw workboard dispatch`. O fallback somente de dados é útil para a limpeza do estado local, mas as execuções de workers precisam de um Gateway ativo.

### O encaminhamento não inicia nada

Verifique se há pelo menos um cartão `ready` sem uma reivindicação ativa:

```bash
openclaw workboard list --status ready
```

Os cartões também podem ser ignorados quando o mesmo proprietário já tem trabalhos em execução ou revisão. Mova os trabalhos concluídos para `done`, libere reivindicações obsoletas usando as ferramentas do Workboard ou execute o encaminhamento novamente depois que o worker ativo terminar.

## Relacionado

- [Plugin Workboard](/pt-BR/plugins/workboard)
- [Referência da CLI](/pt-BR/cli)
- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Control UI](/pt-BR/web/control-ui)
