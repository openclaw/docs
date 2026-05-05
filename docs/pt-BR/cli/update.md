---
read_when:
    - Você quer atualizar um checkout de código-fonte com segurança
    - Você está depurando a saída ou as opções de `openclaw update`
    - Você precisa entender o comportamento abreviado de `--update`
summary: Referência da CLI para `openclaw update` (atualização de origem relativamente segura + reinício automático do Gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-05-05T01:45:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: b12b1837ae80a3688fb7805d78d5a354f07dccdaba175cfa429e18145e543a1f
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Atualize o OpenClaw com segurança e alterne entre os canais stable/beta/dev.

Se você instalou via **npm/pnpm/bun** (instalação global, sem metadados do git),
as atualizações acontecem pelo fluxo do gerenciador de pacotes em [Atualização](/pt-BR/install/updating).

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

- `--no-restart`: pule a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações por gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado informa a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: defina o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitua o pacote de destino somente para esta atualização. Para instalações por pacote, `main` mapeia para `github:openclaw/openclaw#main`.
- `--dry-run`: visualize as ações de atualização planejadas (fluxo de canal/tag/destino/reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprima JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.integrityDrifts` quando desvio de artefato de Plugin npm for
  detectado durante a sincronização de plugins pós-atualização.
- `--timeout <seconds>`: tempo limite por etapa (o padrão é 1800s).
- `--yes`: pule prompts de confirmação (por exemplo, confirmação de downgrade).

`openclaw update` não tem uma flag `--verbose`. Use `--dry-run` para visualizar
as ações planejadas de canal/tag/instalação/reinicialização, `--json` para
resultados legíveis por máquina, e `openclaw update status --json` quando você
só precisar de detalhes de canal e disponibilidade. Se você estiver depurando
logs do Gateway durante uma atualização, a verbosidade do console e o nível de
log em arquivo são separados: Gateway `--verbose` afeta a saída
terminal/WebSocket, enquanto logs em arquivo exigem `logging.level: "debug"` ou
`"trace"` na configuração. Consulte [logs do Gateway](/pt-BR/gateway/logging).

<Warning>
Downgrades exigem confirmação porque versões mais antigas podem quebrar a configuração.
</Warning>

## `update status`

Mostre o canal de atualização ativo + tag/branch/SHA do git (para checkouts de código-fonte), além da disponibilidade de atualização.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opções:

- `--json`: imprima JSON de status legível por máquina.
- `--timeout <seconds>`: tempo limite para verificações (o padrão é 3s).

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se deve reiniciar o Gateway
após atualizar (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: tempo limite para cada etapa de atualização (padrão `1800`)

## O que ele faz

Quando você alterna canais explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala do npm usando `latest`.
- `beta` → prefere a dist-tag npm `beta`, mas recorre a `latest` quando beta está
  ausente ou é mais antiga que a versão stable atual.

O atualizador automático do núcleo do Gateway (quando habilitado via configuração) inicia o caminho de atualização da CLI
fora do manipulador de requisições ativo do Gateway. Atualizações por gerenciador de pacotes
`update.run` do plano de controle forçam uma reinicialização de atualização sem adiamento e sem cooldown após a troca do pacote,
porque o processo antigo do Gateway ainda pode ter chunks em memória que apontam para
arquivos removidos pelo novo pacote.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a versão
do pacote de destino antes de invocar o gerenciador de pacotes. Instalações globais npm usam uma instalação em estágio:
o OpenClaw instala o novo pacote em um prefixo npm temporário, verifica
o inventário `dist` empacotado ali e então troca essa árvore de pacote limpa para o
prefixo global real. Se a verificação falhar, doctor pós-atualização, sincronização de plugins e
reinicialização não são executados a partir da árvore suspeita. Mesmo quando a versão instalada
já corresponde ao destino, o comando atualiza a instalação do pacote global,
depois executa sincronização de plugins, uma atualização de completions de comandos principais e a reinicialização. Isso
mantém sidecars empacotados e registros de Plugin pertencentes ao canal alinhados com a
build do OpenClaw instalada, deixando reconstruções completas de completions de comandos de Plugin para
execuções explícitas de `openclaw completion --write-state`.

Quando um serviço Gateway gerenciado local está instalado e a reinicialização está habilitada,
atualizações por gerenciador de pacotes param o serviço em execução antes de substituir a árvore
do pacote, então atualizam os metadados do serviço a partir da instalação atualizada, reiniciam o
serviço e verificam se o Gateway reiniciado informa a versão esperada antes de
informar sucesso. No macOS, a verificação pós-atualização também verifica se o LaunchAgent
está carregado/em execução para o perfil ativo e se a porta de loopback configurada está
saudável. Se o plist estiver instalado, mas o launchd não estiver supervisionando-o, o OpenClaw
reinicializa o LaunchAgent automaticamente e então executa novamente as verificações de
saúde/versão/prontidão de canal. Um bootstrap novo carrega o job RunAtLoad
diretamente, então a recuperação de atualização não executa imediatamente `kickstart -k` no Gateway
recém-criado. Se o Gateway ainda não ficar saudável, o comando sai
com código diferente de zero e imprime o caminho do log de reinicialização, além de instruções explícitas de reinicialização, reinstalação e
rollback do pacote. Com `--no-restart`,
a substituição do pacote ainda é executada, mas o serviço gerenciado não é parado nem
reiniciado, então o Gateway em execução pode manter o código antigo até que você o reinicie
manualmente.

## Fluxo de checkout git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente, depois faz build e executa doctor.
- `beta`: prefere a tag `-beta` mais recente, mas recorre à tag stable mais recente quando beta está ausente ou é mais antiga.
- `dev`: faz checkout de `main`, depois faz fetch e rebase.

### Etapas de atualização

<Steps>
  <Step title="Verificar worktree limpa">
    Exige nenhuma alteração não commitada.
  </Step>
  <Step title="Alternar canal">
    Alterna para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar upstream">
    Somente dev.
  </Step>
  <Step title="Build de preflight (somente dev)">
    Executa lint e build TypeScript em uma worktree temporária. Se a ponta falhar, retrocede até 10 commits para encontrar a build limpa mais recente.
  </Step>
  <Step title="Rebase">
    Faz rebase no commit selecionado (somente dev).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repositório. Para checkouts pnpm, o atualizador inicializa `pnpm` sob demanda (via `corepack` primeiro, depois um fallback temporário `npm install pnpm@10`) em vez de executar `npm run build` dentro de um workspace pnpm.
  </Step>
  <Step title="Build da Control UI">
    Faz build do gateway e da Control UI.
  </Step>
  <Step title="Executar doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins com o canal ativo. Dev usa plugins incluídos; stable e beta usam npm. Atualiza instalações de Plugin rastreadas.
  </Step>
</Steps>

No canal de atualização beta, instalações rastreadas de plugins npm e ClawHub que seguem
a linha padrão/latest tentam primeiro uma versão `@beta` do Plugin. Se o Plugin não tiver
versão beta, o OpenClaw recorre à spec padrão/latest registrada. Para
plugins npm, o OpenClaw também recorre quando o pacote beta existe, mas falha na
validação de instalação. Versões exatas e tags explícitas não são reescritas.

<Warning>
Se uma atualização de Plugin npm fixada exatamente resolver para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` aborta essa atualização de artefato de Plugin em vez de instalá-lo. Reinstale ou atualize o Plugin explicitamente somente após verificar que você confia no novo artefato.
</Warning>

<Note>
Falhas de sincronização de plugins pós-atualização fazem o resultado da atualização falhar e interrompem o trabalho de reinicialização subsequente. Corrija o erro de instalação ou atualização do Plugin e execute novamente `openclaw update`.

Quando o Gateway atualizado inicia, o carregamento de plugins é apenas de verificação: a inicialização não executa gerenciadores de pacotes nem altera árvores de dependências. Reinicializações `update.run` por gerenciador de pacotes ignoram o adiamento ocioso normal e o cooldown de reinicialização depois que a árvore de pacotes foi trocada, para que o processo antigo não possa continuar carregando lentamente chunks removidos.

Se o bootstrap do pnpm ainda falhar, o atualizador para cedo com um erro específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.
</Note>

## Abreviação `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionados

- `openclaw doctor` (oferece executar update primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
