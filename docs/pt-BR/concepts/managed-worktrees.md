---
read_when:
    - Você quer uma branch e um checkout isolados para uma tarefa de agente
    - Você está configurando cartões do Workboard com espaços de trabalho worktree
    - Você precisa restaurar ou limpar uma árvore de trabalho gerenciada pelo OpenClaw
summary: Execute tarefas de agentes em checkouts isolados do Git, com snapshots automáticos e limpeza.
title: Worktrees gerenciadas
x-i18n:
    generated_at: "2026-07-11T23:54:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

As worktrees gerenciadas fornecem a uma tarefa de agente seu próprio branch e checkout do git sem criar diretórios temporários dentro do repositório de origem. O OpenClaw as cria em seu diretório de estado, registra-as no banco de dados de estado compartilhado e cria snapshots de seu conteúdo rastreado e não rastreado que não seja ignorado antes da remoção.

## Layout e nomes

Cada worktree fica em:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

A impressão digital do repositório corresponde aos primeiros 16 caracteres hexadecimais de um hash SHA-256 calculado sobre o diretório comum canônico do git e a URL de origem. Um nome fornecido deve corresponder a `[a-z0-9][a-z0-9-]{0,63}`. Sem um nome, o OpenClaw gera `wt-` seguido por oito caracteres hexadecimais aleatórios.

O OpenClaw cria o branch `openclaw/<name>` na referência-base solicitada. Sem uma referência-base, ele busca `origin`, usa o branch padrão remoto quando disponível e recorre ao `HEAD` local quando o repositório está offline ou não possui um remoto utilizável.

## Provisionar arquivos ignorados

Adicione `.worktreeinclude` à raiz do repositório de origem para copiar arquivos selecionados, ignorados e não rastreados, para uma nova worktree. O arquivo usa a sintaxe de padrões do gitignore, um padrão por linha, com comentários iniciados por `#`:

```gitignore
.env.local
fixtures/generated/**
```

Somente arquivos identificados pelo git como simultaneamente ignorados e não rastreados são elegíveis. Os arquivos rastreados já estão presentes por meio do git e nunca são copiados nesta etapa. O OpenClaw não sobrescreve arquivos de destino nem segue diretórios que sejam links simbólicos e preserva os modos dos arquivos copiados.

## Executar a configuração do repositório

Se `.openclaw/worktree-setup.sh` existir no repositório de origem e for executável, o OpenClaw o executará tendo a nova worktree como diretório atual. O script recebe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Uma saída diferente de zero cancela a criação e remove a nova worktree e o branch. Esse é um contrato local do repositório; não há uma chave de configuração do OpenClaw para ele.

## Worktrees de sessão

Inicie um chat isolado a partir do espaço de trabalho git do agente ativo com uma sessão baseada em worktree: habilite **Worktree** na página New session da Control UI (que também oferece um seletor de branch-base e um nome opcional para a worktree) ou use o menu Chat actions no iOS ou a ação de opções ao lado de New Chat no Android. A opção está disponível somente para um agente baseado em git quando o cliente possui essa capacidade; clientes que não conseguem realizar a verificação preliminar exibem o erro do Gateway.

Agentes de programação também podem chamar `spawn_task` quando identificarem trabalho de acompanhamento confirmado fora da tarefa atual. A Control UI mostra um chip de sugestão sem iniciar nada, enquanto uma TUI baseada no Gateway mostra um prompt interativo com as mesmas ações. Selecionar **Start in worktree** cria uma nova worktree pertencente à sessão a partir do projeto sugerido e envia o prompt autocontido como seu primeiro turno; descartar a sugestão mantém o repositório inalterado. As sugestões e seus IDs são efêmeros e não persistem após uma reinicialização do Gateway.

O OpenClaw disponibiliza essas ferramentas somente para sessões de operador com uma interface acionável do Gateway. Sessões de canal e sessões de TUI locais/incorporadas não as recebem até que essas superfícies tenham um contrato portátil e tipado de ações de tarefa.

A worktree gerenciada resultante pertence à sessão, e cada execução de agente nessa sessão usa seu checkout. Quando o espaço de trabalho é um subdiretório do repositório, a worktree é ancorada na raiz do repositório e a sessão é executada a partir do subdiretório correspondente dentro dela. A criação de worktrees de sessão usa o escopo `operator.write` do método, mas a etapa `.openclaw/worktree-setup.sh` é executada somente para chamadores `operator.admin`, pois executa código do repositório; o provisionamento por `.worktreeinclude` ainda se aplica a todos os chamadores. Excluir a sessão remove a worktree somente quando isso pode ser feito sem perdas. Worktrees com alterações ou branches com commits não enviados permanecem disponíveis; a limpeza a cada hora cria snapshots de worktrees de sessão após 7 dias de inatividade, considerando atividade recente da sessão como atividade da worktree. Worktrees removidas continuam restauráveis por meio de seus snapshots, conforme descrito abaixo.

`sessions.create` pode incluir um `cwd` absoluto junto com `worktree: true` quando uma tarefa tem como alvo um projeto diferente do espaço de trabalho configurado do agente. Esse caminho explícito no host exige `operator.admin`; a criação comum de chats com worktree continua exigindo `operator.write` e permanece ancorada no espaço de trabalho configurado.

`sessions.create` também aceita `worktreeBaseRef` e `worktreeName` junto com `worktree: true` para escolher a referência-base e o nome da worktree (o branch se torna `openclaw/<name>`); ambos permanecem no escopo `operator.write`. A worktree criada é retornada no resultado da criação e persistida na linha da sessão como `worktree: { id, branch, repoRoot }`, para que as listas de sessões possam mostrar o checkout e o branch. A exclusão de uma sessão informa um checkout preservado com alterações como `worktreePreserved`, em vez de deixá-lo para trás silenciosamente.

## Snapshots, limpeza e restauração

Primeiro, a remoção cria um commit sintético contendo arquivos rastreados e arquivos não rastreados que não sejam ignorados e o fixa em `refs/openclaw/snapshots/<id>`. Arquivos ignorados pelo git são excluídos do banco de dados de objetos do repositório; os arquivos selecionados por `.worktreeinclude` são copiados novamente durante a restauração. Se a criação do snapshot falhar, a remoção é interrompida. Uma exclusão forçada explícita pode continuar sem um snapshot.

O OpenClaw aplica estas regras de limpeza:

- Ao final da execução, ele remove uma worktree somente quando `git status --porcelain` está vazio e `git log HEAD --not --remotes --oneline` não encontra commits não enviados. Caso contrário, ele apenas libera o bloqueio de atividade.
- A limpeza a cada hora cria snapshots e remove worktrees desbloqueadas pertencentes ao Workboard e a sessões que estejam inativas há mais de 7 dias, mesmo quando tenham alterações. Worktrees manuais nunca são removidas automaticamente.
- Os registros de snapshot permanecem restauráveis por 30 dias. Depois disso, a limpeza exclui a referência do snapshot e a linha do registro.
- Um bloqueio de processo ativo do OpenClaw e qualquer bloqueio de worktree do git externo ou não reconhecido protegem uma worktree da coleta de lixo.

A restauração recria `openclaw/<name>` no commit original anterior ao snapshot e, em seguida, reconstrói as diferenças do snapshot como modificações não preparadas e arquivos não rastreados. Isso mantém o commit sintético do snapshot fora do histórico do branch. A referência do snapshot permanece registrada como proveniência.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

A página **Worktrees** da Control UI em Settings oferece as mesmas ações, além da criação com um seletor de branch-base, mostra o proprietário de cada worktree (manual, Workboard ou a sessão proprietária com um link para seu chat) e oferece uma nova tentativa forçada quando uma remoção informa falha no snapshot.

## Métodos do Gateway

| Método               | Finalidade                                                                        |
| -------------------- | --------------------------------------------------------------------------------- |
| `worktrees.list`     | Lista registros de worktrees ativas e restauráveis.                               |
| `worktrees.branches` | Lista branches locais e remotos de um repositório para seletores de referência-base. |
| `worktrees.create`   | Cria ou reutiliza uma worktree gerenciada com nome.                               |
| `worktrees.remove`   | Cria um snapshot e remove uma worktree. Remoções forçadas informam `snapshotError`. |
| `worktrees.restore`  | Restaura uma worktree removida a partir de seu snapshot.                          |
| `worktrees.gc`       | Executa imediatamente a limpeza por inatividade, itens órfãos e retenção.         |

`worktrees.list` exige `operator.read`, e os métodos que realizam alterações exigem `operator.admin`. `worktrees.branches` exige `operator.write` para espaços de trabalho configurados de agentes, enquanto qualquer outro caminho do host exige `operator.admin` (correspondendo ao requisito de `cwd` de `sessions.create`). Ele lê somente referências existentes e nunca realiza busca, e branches que existem apenas no remoto são retornados com a qualificação remota (`origin/feature-a`), para que cada nome retornado seja resolvido como uma referência-base.

## Espaços de trabalho do Workboard

O [Plugin Workboard](/pt-BR/plugins/workboard) incluído pode materializar o espaço de trabalho de um cartão como uma worktree gerenciada:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica o checkout git de origem. `branch` é opcional e se torna a referência-base. Quando o despacho inicia o worker do cartão, o Workboard cria ou reutiliza `wb-<card-id>`, executa o subagente com o checkout gerenciado como seu diretório de trabalho e grava novamente no cartão o caminho e o branch resolvidos. A materialização acionada pelo Gateway exige `operator.admin`. Ao final da execução, o Workboard remove o checkout somente quando for possível comprovar que não haverá perdas; trabalho com alterações ou commits não enviados permanece disponível.

Atualmente, agentes incorporados em sandbox rejeitam um diretório de trabalho da tarefa que esteja fora do espaço de trabalho configurado do agente. Use um agente de destino sem sandbox para cartões do Workboard com worktrees gerenciadas até que o runtime da sandbox ofereça suporte a uma montagem adicional do checkout.
