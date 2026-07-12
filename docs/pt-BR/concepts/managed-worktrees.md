---
read_when:
    - Você quer uma branch e um checkout isolados para uma tarefa de agente
    - Você está configurando cartões do Workboard com espaços de trabalho de worktree
    - Você precisa restaurar ou limpar uma árvore de trabalho gerenciada pelo OpenClaw
summary: Execute tarefas de agente em checkouts isolados do git, com snapshots automáticos e limpeza
title: Worktrees gerenciadas
x-i18n:
    generated_at: "2026-07-12T15:05:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 12a33dc2d9f1ff30060ddead200196b09cfe9498462f58a7aa8a73fa2273f31f
    source_path: concepts/managed-worktrees.md
    workflow: 16
---

Worktrees gerenciadas fornecem a uma tarefa de agente seu próprio branch e checkout do git sem colocar diretórios temporários dentro do repositório de origem. O OpenClaw as cria em seu diretório de estado, registra-as no banco de dados de estado compartilhado e cria snapshots do conteúdo rastreado e do conteúdo não rastreado e não ignorado antes da remoção.

## Layout e nomes

Cada worktree fica em:

```text
<openclaw-state-dir>/worktrees/<repo-fingerprint>/<name>
```

A impressão digital do repositório corresponde aos primeiros 16 caracteres hexadecimais de um hash SHA-256 do diretório comum canônico do git e da URL de origem. Um nome fornecido deve corresponder a `[a-z0-9][a-z0-9-]{0,63}`. Sem um nome, o OpenClaw gera `wt-` seguido de oito caracteres hexadecimais aleatórios.

O OpenClaw cria o branch `openclaw/<name>` na referência base solicitada. Sem uma referência base, ele busca `origin`, usa o branch padrão remoto quando disponível e recorre ao `HEAD` local quando o repositório está offline ou não tem um remoto utilizável.

## Provisionar arquivos ignorados

Adicione `.worktreeinclude` à raiz do repositório de origem para copiar arquivos selecionados que sejam ignorados e não rastreados para uma nova worktree. O arquivo usa a sintaxe de padrões do gitignore, um padrão por linha, com comentários iniciados por `#`:

```gitignore
.env.local
fixtures/generated/**
```

Somente arquivos informados pelo git como simultaneamente ignorados e não rastreados são elegíveis. Os arquivos rastreados já estão presentes por meio do git e nunca são copiados por esta etapa. O OpenClaw não sobrescreve arquivos de destino nem segue diretórios que sejam links simbólicos e preserva os modos dos arquivos copiados.

## Executar a configuração do repositório

Se `.openclaw/worktree-setup.sh` existir no repositório de origem e for executável, o OpenClaw o executará com a nova worktree como diretório atual. O script recebe:

```text
OPENCLAW_SOURCE_TREE_PATH=<source checkout>
OPENCLAW_WORKTREE_PATH=<managed worktree>
```

Uma saída diferente de zero interrompe a criação e remove a nova worktree e o branch. Este é um contrato local do repositório; não há uma chave de configuração do OpenClaw para ele.

## Worktrees de sessão

Inicie um chat isolado a partir do espaço de trabalho git do agente ativo com uma sessão baseada em worktree: ative **Worktree** na página New session da Control UI (que também oferece um seletor de branch base e um nome opcional para a worktree) ou use o menu de ações de Chat no iOS ou a ação no menu adicional ao lado de New Chat no Android. A opção está disponível somente para um agente baseado em git quando o cliente tem essa capacidade; os clientes que não conseguem fazer a verificação prévia exibem o erro do gateway.

Os agentes de programação também podem chamar `spawn_task` quando descobrem um trabalho de acompanhamento confirmado fora da tarefa atual. A Control UI mostra um chip de sugestão sem iniciar nada, enquanto uma TUI baseada no Gateway mostra um prompt interativo com as mesmas ações. Selecionar **Start in worktree** cria uma nova worktree pertencente à sessão a partir do projeto sugerido e envia o prompt autocontido como seu primeiro turno; descartar a sugestão não altera o repositório. As sugestões e seus IDs são efêmeros e não persistem após uma reinicialização do Gateway.

O OpenClaw disponibiliza essas ferramentas somente para sessões de operador com uma interface do Gateway que permita ações. Sessões de canal e sessões de TUI locais/incorporadas não as recebem até que essas superfícies tenham um contrato portátil de ações de tarefa tipadas.

A árvore de trabalho gerenciada resultante pertence à sessão, e toda execução de agente nessa sessão usa o checkout dela. Quando o espaço de trabalho é um subdiretório do repositório, a árvore de trabalho é ancorada na raiz do repositório, e a sessão é executada a partir do subdiretório correspondente dentro dela. A criação da árvore de trabalho da sessão usa o escopo `operator.write` do método, mas a etapa `.openclaw/worktree-setup.sh` é executada apenas para chamadores com `operator.admin`, pois executa código do repositório; o provisionamento de `.worktreeinclude` ainda se aplica a todos os chamadores. Excluir a sessão remove a árvore de trabalho somente quando isso pode ser feito sem perdas. Árvores de trabalho com alterações ou branches com commits não enviados permanecem disponíveis; a limpeza executada a cada hora cria snapshots das árvores de trabalho de sessões após 7 dias de inatividade, considerando atividades recentes da sessão como atividades da árvore de trabalho. Árvores de trabalho removidas continuam podendo ser restauradas por meio dos respectivos snapshots, conforme descrito abaixo.

`sessions.create` pode incluir um `cwd` absoluto junto com `worktree: true` quando uma tarefa tem como destino um projeto diferente do espaço de trabalho configurado do agente. Esse caminho explícito no host exige `operator.admin`; a criação comum de uma árvore de trabalho por chat permanece no escopo `operator.write` e continua ancorada no espaço de trabalho configurado.

`sessions.create` também aceita `worktreeBaseRef` e `worktreeName` junto com `worktree: true` para escolher a referência base e o nome da árvore de trabalho (o branch se torna `openclaw/<name>`); ambos permanecem no escopo `operator.write`. A árvore de trabalho criada é retornada no resultado da criação e persistida na linha da sessão como `worktree: { id, branch, repoRoot }`, permitindo que as listas de sessões mostrem o checkout e o branch. Ao excluir uma sessão, um checkout com alterações que foi preservado é informado como `worktreePreserved`, em vez de ser deixado para trás silenciosamente.

## Snapshots, limpeza e restauração

Primeiro, a remoção cria um commit sintético contendo arquivos rastreados e arquivos não rastreados que não são ignorados, e o fixa em `refs/openclaw/snapshots/<id>`. Arquivos ignorados pelo Git são excluídos do banco de dados de objetos do repositório; os arquivos selecionados por `.worktreeinclude` são copiados novamente durante a restauração. Se a criação do snapshot falhar, a remoção será interrompida. Uma exclusão forçada explícita pode continuar sem um snapshot.

O OpenClaw aplica estas regras de limpeza:

- Ao final da execução, ele remove uma árvore de trabalho somente quando `git status --porcelain` está vazio e `git log HEAD --not --remotes --oneline` não encontra commits não enviados. Caso contrário, ele apenas libera o bloqueio de atividade.
- A limpeza executada a cada hora cria snapshots e remove árvores de trabalho desbloqueadas pertencentes ao Workboard e a sessões que estejam inativas há mais de 7 dias, mesmo quando tenham alterações. Árvores de trabalho manuais nunca são removidas automaticamente.
- Os registros de snapshots permanecem disponíveis para restauração por 30 dias. Depois disso, a limpeza exclui a referência do snapshot e a linha do registro.
- Um bloqueio de processo ativo do OpenClaw e qualquer bloqueio de árvore de trabalho do Git externo ou não reconhecido protegem uma árvore de trabalho contra a coleta de lixo.

A restauração recria `openclaw/<name>` no commit original anterior ao snapshot e, em seguida, reconstrói as diferenças do snapshot como modificações fora da área de preparação e arquivos não rastreados. Isso mantém o commit sintético do snapshot fora do histórico do branch. A referência do snapshot permanece registrada como proveniência.

## CLI

```bash
openclaw worktrees list [--json]
openclaw worktrees create <repo-root> [--name <name>] [--base-ref <ref>] [--json]
openclaw worktrees remove <id> [--force] [--json]
openclaw worktrees restore <id> [--json]
openclaw worktrees gc [--json]
```

A página **Worktrees** da interface de controle, em Configurações, oferece as mesmas ações, além da criação com um seletor de branch base, mostra o proprietário de cada worktree (manual, Workboard ou a sessão proprietária, com um link para o respectivo chat) e oferece uma nova tentativa forçada quando uma remoção informa falha no snapshot.

## Métodos do Gateway

| Método               | Finalidade                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `worktrees.list`     | Lista registros de worktrees ativos e restauráveis.                                        |
| `worktrees.branches` | Lista branches locais e remotos de um repositório para seletores de referência base.       |
| `worktrees.create`   | Cria ou reutiliza um worktree gerenciado nomeado.                                           |
| `worktrees.remove`   | Cria um snapshot e remove um worktree. Remoções forçadas informam `snapshotError`.          |
| `worktrees.restore`  | Restaura um worktree removido a partir de seu snapshot.                                     |
| `worktrees.gc`       | Executa imediatamente a limpeza por inatividade, de órfãos e por retenção.                  |

`worktrees.list` exige `operator.read`, e os métodos que fazem alterações exigem `operator.admin`. `worktrees.branches` exige `operator.write` para espaços de trabalho de agentes configurados, enquanto qualquer outro caminho do host exige `operator.admin` (de acordo com o requisito de cwd de `sessions.create`). Ele lê apenas referências existentes e nunca executa fetch, e branches disponíveis somente remotamente são retornados com a qualificação do remoto (`origin/feature-a`), para que cada nome retornado possa ser resolvido como uma referência base.

## Espaços de trabalho do Workboard

O [Plugin Workboard](/pt-BR/plugins/workboard) incluído pode materializar o espaço de trabalho de um cartão como um worktree gerenciado:

```json
{
  "kind": "worktree",
  "path": "/absolute/path/to/source-checkout",
  "branch": "main"
}
```

`path` identifica o checkout de origem do git. `branch` é opcional e se torna a referência base. Quando a execução despachada inicia o worker do cartão, o Workboard cria ou reutiliza `wb-<card-id>`, executa o subagente usando o checkout gerenciado como diretório de trabalho e grava o caminho e o branch resolvidos de volta no cartão. A materialização acionada pelo Gateway exige `operator.admin`. Ao final da execução, o Workboard remove o checkout somente quando for possível comprovar que a remoção não causará perdas; alterações não commitadas ou commits que não foram enviados permanecem disponíveis.

No momento, agentes incorporados em sandbox rejeitam um diretório de trabalho da tarefa que esteja fora do espaço de trabalho configurado para o agente. Use um agente de destino sem sandbox para cartões do Workboard com worktrees gerenciados até que o runtime de sandbox permita a montagem de um checkout adicional.
