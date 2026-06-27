---
read_when:
    - Você quer inspecionar ou criar cartões do Workboard a partir do terminal
    - Você quer disparar execuções de workers do Workboard pela CLI
    - Você está depurando o comportamento da CLI do Workboard ou de comandos de barra
summary: Referência da CLI para cartões `openclaw workboard`, despacho e execuções de worker
title: CLI do quadro de trabalho
x-i18n:
    generated_at: "2026-06-27T17:22:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` é a superfície de terminal do
[Plugin Workboard](/pt-BR/plugins/workboard) incluído. Ele permite que um operador liste cartões, crie um
cartão, inspecione um cartão e peça ao Gateway em execução para despachar trabalho pronto para
execuções de trabalhadores de subagente.

Habilite o plugin antes de usar o comando:

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

O comando lê e grava no mesmo banco de dados SQLite pertencente ao plugin usado pelo
painel e pelas ferramentas de agente do Workboard. IDs de cartão podem ser passados pelo ID completo ou por um
prefixo inequívoco quando um comando aceita um ID de cartão.

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

As colunas são prefixo do ID, status, prioridade, ID do quadro, ID opcional do agente e título.

Opções:

| Opção                | Finalidade                                           |
| -------------------- | ---------------------------------------------------- |
| `--board <id>`       | Limitar resultados a um namespace de quadro          |
| `--status <status>`  | Limitar resultados a um status do Workboard          |
| `--include-archived` | Incluir cartões arquivados na saída de texto compacta |
| `--json`             | Imprimir a lista completa de cartões como JSON de máquina |

A saída de texto compacta oculta cartões arquivados por padrão para que a CLI corresponda ao
comando `/workboard list`. Passe `--include-archived` para mostrá-los. A saída JSON
mantém a lista completa de cartões, incluindo cartões arquivados, para automações existentes.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

Opções:

| Opção                   | Finalidade                                     |
| ----------------------- | ---------------------------------------------- |
| `--notes <text>`        | Observações iniciais do cartão                 |
| `--status <status>`     | Status inicial, padrão `todo`                  |
| `--priority <priority>` | Prioridade, padrão `normal`                    |
| `--agent <id>`          | Atribuir o cartão a um agente ou ID de dono    |
| `--board <id>`          | Armazenar o cartão em um namespace de quadro   |
| `--labels <items>`      | Rótulos separados por vírgula                  |
| `--json`                | Imprimir o cartão criado como JSON de máquina  |

`create` grava diretamente no estado SQLite do Workboard. O cartão fica imediatamente
visível na aba Workboard da Control UI e para as ferramentas do Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

A saída de texto imprime a linha compacta do cartão e as observações. A saída JSON retorna o registro completo
do cartão, incluindo metadados de execução, tentativas, comentários, links, prova,
artefatos, logs do trabalhador, estado do protocolo, diagnósticos e metadados de automação.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` primeiro chama o método RPC do Gateway em execução
`workboard.cards.dispatch`. Esse caminho usa o mesmo runtime de subagente que a
ação de despacho do painel, então cartões prontos se tornam execuções de trabalhadores rastreadas por tarefa com
chaves de sessão vinculadas. Cartões com um agente atribuído usam chaves de sessão de subagente
com escopo de agente; cartões não atribuídos mantêm uma chave de subagente sem escopo para que o agente padrão
configurado do Gateway seja preservado.

O loop de despacho:

1. Promove filhos com dependências prontas para `ready`.
2. Bloqueia reivindicações expiradas ou execuções de trabalhadores com timeout.
3. Registra metadados de despacho em cartões prontos.
4. Seleciona um pequeno lote de cartões prontos não reivindicados.
5. Reivindica cada cartão selecionado para o despachante ou agente atribuído.
6. Inicia uma execução de trabalhador de subagente com contexto limitado do cartão e o token de
   reivindicação do cartão.
7. Armazena no cartão o ID da execução do trabalhador, a chave de sessão, o vínculo da tarefa quando o livro-razão de tarefas do Gateway
   o informa, o status de execução e o log do trabalhador.

A seleção é intencionalmente conservadora. Um despacho inicia no máximo três
trabalhadores por padrão, ignora cartões arquivados ou já reivindicados e inicia apenas um
cartão por dono ou agente em uma única passagem. Cartões já pertencentes a trabalho ativo em execução
ou em revisão ficam para um despacho posterior.

Se a inicialização do trabalhador falhar depois que um cartão for reivindicado, o Workboard bloqueia esse cartão,
limpa a reivindicação e registra a falha nos metadados de execução do cartão e do log do trabalhador. Isso mantém inicializações com falha visíveis em vez de retornar silenciosamente o
cartão à fila.

Se nenhum alvo explícito do Gateway for fornecido e o Gateway local estiver indisponível
ou ainda não expuser o método de despacho do Workboard, a CLI recorre ao despacho
somente de dados contra o estado local do Workboard. O despacho somente de dados ainda pode
promover dependências, limpar reivindicações obsoletas e bloquear execuções com timeout, mas ele não
inicia trabalhadores. Falhas de autenticação, permissão, validação e falhas para um
alvo explícito `--url` ou `--token` são relatadas diretamente.

A saída de texto relata inicializações de trabalhadores:

```text
dispatch complete: started=2 failures=0
```

A saída de fallback é explícita:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

A saída JSON inclui o resultado do despacho. O despacho apoiado pelo Gateway pode incluir
`started` e `startFailures`; o fallback somente de dados inclui
`gatewayUnavailable: true`. Tokens de reivindicação são redigidos da saída JSON do cartão.

No painel, o mesmo resultado de despacho é mostrado como um resumo curto para que um
operador possa ver quantos cartões foram iniciados, promovidos, bloqueados, recuperados ou
falharam sem abrir os detalhes do cartão.

## Paridade de Comandos de Barra

Canais compatíveis com comandos podem usar o comando de barra correspondente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

O despacho por comando de barra também usa o runtime de subagente do Gateway, então ele segue o
mesmo comportamento de reivindicação, inicialização de trabalhador e falha que o caminho do Gateway do painel e da CLI.

`/workboard list` e `/workboard show` são comandos de leitura para remetentes de comando autorizados. `/workboard create` e `/workboard dispatch` alteram o estado do quadro e
exigem status de dono em superfícies de chat ou um cliente Gateway com `operator.write`
ou `operator.admin`.

## Permissões

O caminho de despacho da CLI chama RPC do Gateway com escopos `operator.read` e
`operator.write`. Um token de Gateway somente leitura pode inspecionar dados do Workboard
por métodos de leitura, mas não pode criar cartões nem despachar trabalhadores.

Os comandos locais `list`, `create` e `show` operam no diretório de estado local do OpenClaw
usado pelo perfil atual. Use `--dev` ou `--profile <name>` no comando
`openclaw` de nível superior quando precisar de uma raiz de estado diferente.

## Solução de Problemas

### Nenhum Cartão Aparece

Confirme se o plugin está habilitado para o mesmo perfil e raiz de estado:

```bash
openclaw plugins inspect workboard --runtime --json
```

Se o painel mostrar cartões, mas a CLI não, verifique se ambos os comandos usam
a mesma configuração `--dev` ou `--profile`.

### Despacho Diz Somente Dados

Inicie ou reinicie o Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Em seguida, tente novamente `openclaw workboard dispatch`. O fallback somente de dados é útil para limpeza de
estado local, mas execuções de trabalhadores precisam de um Gateway ativo.

### Despacho Não Inicia Nada

Verifique se há pelo menos um cartão `ready` sem reivindicação ativa:

```bash
openclaw workboard list --status ready
```

Cartões também podem ser ignorados quando o mesmo dono já tem trabalho em execução ou em revisão.
Mova trabalhos concluídos para `done`, libere reivindicações obsoletas pelas ferramentas do Workboard
ou execute o despacho novamente depois que o trabalhador ativo terminar.

## Relacionados

- [Plugin Workboard](/pt-BR/plugins/workboard)
- [Referência da CLI](/pt-BR/cli)
- [Comandos de barra](/pt-BR/tools/slash-commands)
- [Control UI](/pt-BR/web/control-ui)
