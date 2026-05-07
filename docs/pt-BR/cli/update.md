---
read_when:
    - Você quer atualizar uma cópia local do código-fonte com segurança
    - Você está depurando a saída ou as opções de `openclaw update`
    - Você precisa entender o comportamento da abreviação `--update`
summary: Referência da CLI para `openclaw update` (atualização de fonte relativamente segura + reinício automático do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-05-07T01:51:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 33c1474c6525257b79e947dfa4ce750cadd4e2e440775f5fa3058dcea1a17809
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Atualize o OpenClaw com segurança e alterne entre os canais stable/beta/dev.

Se você instalou via **npm/pnpm/bun** (instalação global, sem metadados do git), as atualizações acontecem pelo fluxo do gerenciador de pacotes em [Atualização](/pt-BR/install/updating).

## Uso

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --json
openclaw --update
```

## Opções

- `--no-restart`: ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações pelo gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado relata a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitui o pacote de destino apenas para esta atualização. Para instalações de pacote, `main` mapeia para `github:openclaw/openclaw#main`.
- `--dry-run`: pré-visualiza as ações de atualização planejadas (canal/tag/destino/fluxo de reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.warnings` quando plugins gerenciados corrompidos ou não carregáveis precisam
  de reparo depois que a atualização do núcleo é concluída com sucesso, e `postUpdate.plugins.integrityDrifts`
  quando desvio de artefato de Plugin npm é detectado durante a sincronização de plugins pós-atualização.
- `--timeout <seconds>`: tempo limite por etapa (o padrão é 1800s).
- `--yes`: ignora prompts de confirmação (por exemplo, confirmação de downgrade).

`openclaw update` não tem uma flag `--verbose`. Use `--dry-run` para pré-visualizar
as ações planejadas de canal/tag/instalação/reinicialização, `--json` para resultados
legíveis por máquina e `openclaw update status --json` quando você precisa apenas de detalhes
de canal e disponibilidade. Se você estiver depurando logs do Gateway durante uma atualização,
a verbosidade do console e o nível de log em arquivo são separados: `--verbose` do Gateway afeta
a saída do terminal/WebSocket, enquanto logs em arquivo exigem `logging.level: "debug"` ou
`"trace"` na configuração. Consulte [Logs do Gateway](/pt-BR/gateway/logging).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), execuções mutáveis de `openclaw update` são desativadas. Atualize a fonte Nix ou a entrada flake para esta instalação; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado ao agente. `openclaw update status` e `openclaw update --dry-run` permanecem somente leitura.
</Note>

<Warning>
Downgrades exigem confirmação porque versões mais antigas podem quebrar a configuração.
</Warning>

## `update status`

Mostra o canal de atualização ativo + tag/branch/SHA do git (para checkouts de código-fonte), além da disponibilidade de atualização.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opções:

- `--json`: imprime JSON de status legível por máquina.
- `--timeout <seconds>`: tempo limite para verificações (o padrão é 3s).

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se o Gateway deve ser reiniciado
após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: tempo limite para cada etapa de atualização (padrão `1800`)

## O que ele faz

Quando você alterna canais explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala a partir do npm usando `latest`.
- `beta` → prefere a dist-tag npm `beta`, mas recorre a `latest` quando beta está
  ausente ou é mais antiga que a versão estável atual.

O OpenClaw ainda não tem um canal LTS ou de suporte mensal. Estamos trabalhando
para chegar a linhas de suporte mensais, mas `--channel` atualmente aceita apenas
`stable`, `beta` e `dev`. Use `--tag <version-or-dist-tag>` para um destino avulso
quando você precisar de um artefato de pacote específico.

O atualizador automático do núcleo do Gateway (quando habilitado pela configuração) inicia o caminho de atualização da CLI
fora do manipulador de requisições ativo do Gateway. Atualizações `update.run` do plano de controle pelo gerenciador de pacotes
forçam uma reinicialização de atualização sem adiamento e sem período de espera após a troca do pacote,
porque o processo antigo do Gateway ainda pode ter partes em memória que apontam para
arquivos removidos pelo novo pacote.

Para instalações pelo gerenciador de pacotes, `openclaw update` resolve a versão do pacote
de destino antes de invocar o gerenciador de pacotes. Instalações globais npm usam uma instalação
em estágio: o OpenClaw instala o novo pacote em um prefixo npm temporário, verifica
o inventário `dist` empacotado ali e então troca essa árvore de pacote limpa para o
prefixo global real. Se a verificação falhar, o doctor pós-atualização, a sincronização de plugins e
o trabalho de reinicialização não são executados a partir da árvore suspeita. Mesmo quando a versão instalada
já corresponde ao destino, o comando atualiza a instalação global do pacote,
depois executa a sincronização de plugins, uma atualização de conclusão de comando do núcleo e o trabalho de reinicialização. Isso
mantém sidecars empacotados e registros de plugins pertencentes ao canal alinhados com a
build instalada do OpenClaw, deixando reconstruções completas de conclusão de comandos de plugins para
execuções explícitas de `openclaw completion --write-state`.

Quando um serviço local gerenciado do Gateway está instalado e a reinicialização está habilitada,
atualizações pelo gerenciador de pacotes param o serviço em execução antes de substituir a árvore
do pacote, depois atualizam os metadados do serviço a partir da instalação atualizada, reiniciam o
serviço e verificam se o Gateway reiniciado relata a versão esperada antes de
relatar sucesso. No macOS, a verificação pós-atualização também verifica se o LaunchAgent
está carregado/em execução para o perfil ativo e se a porta de loopback configurada está
íntegra. Se o plist estiver instalado, mas o launchd não o estiver supervisionando, o OpenClaw
reinicializa o LaunchAgent automaticamente e então executa novamente as
verificações de prontidão de integridade/versão/canal. Uma inicialização nova carrega o job RunAtLoad
diretamente, então a recuperação de atualização não executa imediatamente `kickstart -k` no Gateway
recém-criado. Se o Gateway ainda não ficar íntegro, o comando sai
com código diferente de zero e imprime o caminho do log de reinicialização mais instruções explícitas de reinicialização, reinstalação e
rollback de pacote. Com `--no-restart`,
a substituição do pacote ainda é executada, mas o serviço gerenciado não é parado nem
reiniciado, então o Gateway em execução pode manter o código antigo até que você o reinicie
manualmente.

## Fluxo de checkout git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente, depois compila e executa doctor.
- `beta`: prefere a tag `-beta` mais recente, mas recorre à tag estável mais recente quando beta está ausente ou é mais antiga.
- `dev`: faz checkout de `main`, depois busca e faz rebase.

### Etapas de atualização

<Steps>
  <Step title="Verify clean worktree">
    Exige que não haja alterações sem commit.
  </Step>
  <Step title="Switch channel">
    Alterna para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Fetch upstream">
    Apenas dev.
  </Step>
  <Step title="Preflight build (dev only)">
    Executa a build TypeScript em um worktree temporário. Se a ponta falhar, retrocede até 10 commits para encontrar o commit compilável mais novo. Defina `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para também executar lint durante esse preflight; o lint roda em modo serial restrito porque hosts de atualização de usuários geralmente são menores que runners de CI.
  </Step>
  <Step title="Rebase">
    Faz rebase para o commit selecionado (apenas dev).
  </Step>
  <Step title="Install dependencies">
    Usa o gerenciador de pacotes do repo. Para checkouts pnpm, o atualizador inicializa `pnpm` sob demanda (via `corepack` primeiro, depois um fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
  </Step>
  <Step title="Build Control UI">
    Compila o gateway e a Control UI.
  </Step>
  <Step title="Run doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sync plugins">
    Sincroniza plugins com o canal ativo. Dev usa plugins incluídos; stable e beta usam npm. Atualiza instalações de Plugin rastreadas.
  </Step>
</Steps>

No canal de atualização beta, instalações rastreadas de plugins npm e ClawHub que seguem
a linha padrão/latest tentam primeiro uma versão `@beta` do Plugin. Se o Plugin não tiver
versão beta, o OpenClaw recorre à especificação padrão/latest registrada. Para plugins npm,
o OpenClaw também recorre quando o pacote beta existe, mas falha na validação de instalação.
Versões exatas e tags explícitas não são reescritas.

<Warning>
Se uma atualização de Plugin npm fixada em versão exata resolver para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` aborta essa atualização de artefato de Plugin em vez de instalá-la. Reinstale ou atualize o Plugin explicitamente somente depois de verificar que você confia no novo artefato.
</Warning>

<Note>
Falhas de sincronização de plugins pós-atualização que são restritas a um Plugin gerenciado são relatadas como avisos depois que a atualização do núcleo é concluída com sucesso. O resultado JSON mantém o `status: "ok"` de atualização no nível superior e relata `postUpdate.plugins.status: "warning"` com orientação de `openclaw doctor --fix` e `openclaw plugins inspect <id> --runtime --json`. Exceções inesperadas do atualizador ou de sincronização ainda fazem o resultado da atualização falhar. Corrija a instalação do Plugin ou o erro de atualização e então execute novamente `openclaw doctor --fix` ou `openclaw update`.

Quando o Gateway atualizado inicia, o carregamento de plugins é apenas de verificação: a inicialização não executa gerenciadores de pacotes nem altera árvores de dependências. Reinicializações de `update.run` pelo gerenciador de pacotes ignoram o adiamento ocioso normal e o período de espera de reinicialização depois que a árvore do pacote foi trocada, para que o processo antigo não possa continuar carregando lentamente partes removidas.

Se a inicialização do pnpm ainda falhar, o atualizador para cedo com um erro específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.
</Note>

## Atalho `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicializador).

## Relacionados

- `openclaw doctor` (oferece executar update primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
