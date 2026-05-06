---
read_when:
    - Você quer atualizar um checkout de código-fonte com segurança
    - Você está depurando a saída ou as opções de `openclaw update`
    - Você precisa entender o comportamento abreviado de `--update`
summary: Referência da CLI para `openclaw update` (atualização de origem relativamente segura + reinicialização automática do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-05-06T17:55:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 483e702dfe7f1d1b2f4bcd1037a93ba794fc6a24ff2060afcb3a825c3dc165c7
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Atualize o OpenClaw com segurança e alterne entre os canais stable/beta/dev.

Se você instalou via **npm/pnpm/bun** (instalação global, sem metadados do git),
as atualizações acontecem pelo fluxo do gerenciador de pacotes em [Atualizando](/pt-BR/install/updating).

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

- `--no-restart`: ignora a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações pelo gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado informa a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: sobrescreve o destino do pacote apenas para esta atualização. Para instalações de pacote, `main` mapeia para `github:openclaw/openclaw#main`.
- `--dry-run`: pré-visualiza as ações de atualização planejadas (fluxo de canal/tag/destino/reinicialização) sem gravar a configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.warnings` quando plugins gerenciados corrompidos ou não carregáveis precisam de
  reparo depois que a atualização do núcleo é concluída com sucesso, e `postUpdate.plugins.integrityDrifts`
  quando desvio de artefato de plugin npm é detectado durante a sincronização de plugins pós-atualização.
- `--timeout <seconds>`: tempo limite por etapa (o padrão é 1800s).
- `--yes`: ignora prompts de confirmação (por exemplo, confirmação de downgrade).

`openclaw update` não tem uma flag `--verbose`. Use `--dry-run` para pré-visualizar
as ações planejadas de canal/tag/instalação/reinicialização, `--json` para resultados
legíveis por máquina, e `openclaw update status --json` quando você precisa apenas de detalhes
de canal e disponibilidade. Se você estiver depurando logs do Gateway durante uma atualização,
a verbosidade do console e o nível de log em arquivo são separados: `--verbose` do Gateway afeta
a saída de terminal/WebSocket, enquanto logs em arquivo exigem `logging.level: "debug"` ou
`"trace"` na configuração. Veja [logs do Gateway](/pt-BR/gateway/logging).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), execuções mutantes de `openclaw update` são desabilitadas. Atualize a fonte Nix ou a entrada flake desta instalação em vez disso; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) priorizando o agente. `openclaw update status` e `openclaw update --dry-run` permanecem somente leitura.
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
após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout do git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: tempo limite para cada etapa de atualização (padrão `1800`)

## O que ele faz

Quando você alterna canais explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout do git (padrão: `~/openclaw`, sobrescreva com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala a partir do npm usando `latest`.
- `beta` → prefere a dist-tag npm `beta`, mas recorre a `latest` quando beta está
  ausente ou é mais antiga que a versão stable atual.

O atualizador automático do núcleo do Gateway (quando habilitado via configuração) inicia o caminho de atualização da CLI
fora do manipulador de requisições ativo do Gateway. Atualizações de gerenciador de pacotes
`update.run` do plano de controle forçam uma reinicialização de atualização sem adiamento e sem período de espera após a troca do pacote,
porque o processo antigo do Gateway ainda pode ter chunks em memória que apontam para
arquivos removidos pelo novo pacote.

Para instalações via gerenciador de pacotes, `openclaw update` resolve a versão do pacote de destino
antes de invocar o gerenciador de pacotes. Instalações globais npm usam uma instalação em staging:
o OpenClaw instala o novo pacote em um prefixo npm temporário, verifica o inventário
`dist` empacotado ali e então troca essa árvore de pacote limpa para o
prefixo global real. Se a verificação falhar, o doctor pós-atualização, a sincronização de plugins e
a reinicialização não são executados a partir da árvore suspeita. Mesmo quando a versão instalada
já corresponde ao destino, o comando atualiza a instalação global do pacote,
depois executa a sincronização de plugins, uma atualização de conclusão de comandos do núcleo e a reinicialização. Isso
mantém os sidecars empacotados e os registros de plugins pertencentes ao canal alinhados com a
build instalada do OpenClaw, deixando reconstruções completas de conclusão de comandos de plugins para
execuções explícitas de `openclaw completion --write-state`.

Quando um serviço Gateway gerenciado local está instalado e a reinicialização está habilitada,
atualizações por gerenciador de pacotes interrompem o serviço em execução antes de substituir a árvore do pacote,
depois atualizam os metadados do serviço a partir da instalação atualizada, reiniciam o
serviço e verificam se o Gateway reiniciado informa a versão esperada antes de
relatar sucesso. No macOS, a verificação pós-atualização também verifica se o LaunchAgent
está carregado/em execução para o perfil ativo e se a porta de loopback configurada está
saudável. Se o plist estiver instalado, mas o launchd não estiver supervisionando-o, o OpenClaw
reinicializa o LaunchAgent automaticamente e então executa novamente as verificações de
saúde/versão/prontidão do canal. Um bootstrap novo carrega o job RunAtLoad
diretamente, portanto a recuperação da atualização não executa imediatamente `kickstart -k` no Gateway
recém-gerado. Se o Gateway ainda não se tornar saudável, o comando sai
com código diferente de zero e imprime o caminho do log de reinicialização, além de instruções explícitas de reinicialização, reinstalação e
rollback de pacote. Com `--no-restart`,
a substituição do pacote ainda é executada, mas o serviço gerenciado não é interrompido nem
reiniciado, portanto o Gateway em execução pode manter código antigo até você reiniciá-lo
manualmente.

## Fluxo de checkout do git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente, depois faz build e executa doctor.
- `beta`: prefere a tag `-beta` mais recente, mas recorre à tag stable mais recente quando beta está ausente ou é mais antiga.
- `dev`: faz checkout de `main`, depois faz fetch e rebase.

### Etapas de atualização

<Steps>
  <Step title="Verificar worktree limpa">
    Exige que não haja alterações não commitadas.
  </Step>
  <Step title="Trocar canal">
    Alterna para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar upstream">
    Apenas dev.
  </Step>
  <Step title="Build de preflight (apenas dev)">
    Executa a build TypeScript em uma worktree temporária. Se a ponta falhar, retrocede até 10 commits para encontrar o commit mais novo que consiga fazer build. Defina `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para também executar lint durante este preflight; o lint roda em modo serial restrito porque hosts de atualização de usuários costumam ser menores que runners de CI.
  </Step>
  <Step title="Rebase">
    Faz rebase no commit selecionado (apenas dev).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repositório. Para checkouts pnpm, o atualizador inicializa `pnpm` sob demanda (primeiro via `corepack`, depois com fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
  </Step>
  <Step title="Compilar Control UI">
    Compila o gateway e a Control UI.
  </Step>
  <Step title="Executar doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins para o canal ativo. Dev usa plugins incluídos; stable e beta usam npm. Atualiza instalações de plugins rastreadas.
  </Step>
</Steps>

No canal de atualização beta, instalações rastreadas de plugins npm e ClawHub que seguem
a linha padrão/latest tentam primeiro uma versão `@beta` do plugin. Se o plugin não tiver
versão beta, o OpenClaw recorre à especificação padrão/latest registrada. Para plugins npm,
o OpenClaw também recorre quando o pacote beta existe, mas falha na validação de instalação.
Versões exatas e tags explícitas não são reescritas.

<Warning>
Se uma atualização de plugin npm fixada em versão exata resolver para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` aborta essa atualização de artefato de plugin em vez de instalá-lo. Reinstale ou atualize o plugin explicitamente apenas depois de verificar que você confia no novo artefato.
</Warning>

<Note>
Falhas de sincronização de plugins pós-atualização que são restritas a um plugin gerenciado são relatadas como avisos depois que a atualização do núcleo é concluída com sucesso. O resultado JSON mantém o `status: "ok"` de atualização de nível superior e relata `postUpdate.plugins.status: "warning"` com orientações de `openclaw doctor --fix` e `openclaw plugins inspect <id> --runtime --json`. Exceções inesperadas do atualizador ou da sincronização ainda fazem o resultado da atualização falhar. Corrija a instalação do plugin ou o erro de atualização e depois execute novamente `openclaw doctor --fix` ou `openclaw update`.

Quando o Gateway atualizado inicia, o carregamento de plugins é apenas de verificação: a inicialização não executa gerenciadores de pacotes nem altera árvores de dependências. Reinicializações `update.run` de gerenciador de pacotes ignoram o adiamento ocioso normal e o período de espera de reinicialização depois que a árvore do pacote foi trocada, para que o processo antigo não possa continuar carregando preguiçosamente chunks removidos.

Se o bootstrap do pnpm ainda falhar, o atualizador para cedo com um erro específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.
</Note>

## Atalho `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionado

- `openclaw doctor` (oferece executar update primeiro em checkouts do git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualizando](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
