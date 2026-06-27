---
read_when:
    - Você quer atualizar um checkout de origem com segurança
    - Você está depurando a saída ou as opções de `openclaw update`
    - Você precisa entender o comportamento abreviado de `--update`
summary: Referência da CLI para `openclaw update` (atualização de origem relativamente segura + reinicialização automática do gateway)
title: Atualizar
x-i18n:
    generated_at: "2026-06-27T17:22:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3503e1cd15baa4d4f6c26734b37556831c612f1da0da5ccfe7bcde35b9be64b
    source_path: cli/update.md
    workflow: 16
---

# `openclaw update`

Atualize o OpenClaw com segurança e alterne entre os canais stable/beta/dev.

Se você instalou via **npm/pnpm/bun** (instalação global, sem metadados git),
as atualizações acontecem pelo fluxo do gerenciador de pacotes em [Atualização](/pt-BR/install/updating).

## Uso

```bash
openclaw update
openclaw update status
openclaw update repair
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --tag main
openclaw update --dry-run
openclaw update --no-restart
openclaw update --yes
openclaw update --acknowledge-clawhub-risk
openclaw update --json
openclaw --update
```

## Opções

- `--no-restart`: pula a reinicialização do serviço Gateway após uma atualização bem-sucedida. Atualizações pelo gerenciador de pacotes que reiniciam o Gateway verificam se o serviço reiniciado relata a versão atualizada esperada antes de o comando ser concluído com sucesso.
- `--channel <stable|beta|dev>`: define o canal de atualização (git + npm; persistido na configuração).
- `--tag <dist-tag|version|spec>`: substitui o destino do pacote apenas para esta atualização. Para instalações de pacotes, `main` mapeia para `github:openclaw/openclaw#main`; especificações de origem GitHub/git são empacotadas em um tarball temporário antes da instalação npm global em etapas.
- `--dry-run`: pré-visualiza as ações de atualização planejadas (fluxo de canal/tag/destino/reinicialização) sem gravar configuração, instalar, sincronizar plugins ou reiniciar.
- `--json`: imprime JSON `UpdateRunResult` legível por máquina, incluindo
  `postUpdate.plugins.warnings` quando plugins gerenciados corrompidos ou não carregáveis precisam de
  reparo depois que a atualização do core é concluída com sucesso, detalhes de fallback de plugins no canal beta
  quando um plugin não tem uma versão beta, e `postUpdate.plugins.integrityDrifts`
  quando divergência de artefato de plugin npm é detectada durante a sincronização de plugins pós-atualização.
- `--timeout <seconds>`: tempo limite por etapa (o padrão é 1800s).
- `--yes`: pula prompts de confirmação (por exemplo, confirmação de downgrade).
- `--acknowledge-clawhub-risk`: após revisar os avisos de confiança da comunidade do ClawHub,
  permite que a sincronização de plugins pós-atualização continue sem um prompt
  interativo. Sem isso, versões arriscadas de plugins da comunidade no ClawHub são ignoradas e
  deixadas inalteradas quando o OpenClaw não pode solicitar confirmação. Pacotes oficiais do ClawHub e
  fontes de plugins OpenClaw incluídos ignoram esse prompt de confiança de versão.

`openclaw update` não tem uma flag `--verbose`. Use `--dry-run` para pré-visualizar
as ações planejadas de canal/tag/instalação/reinicialização, `--json` para resultados
legíveis por máquina e `openclaw update status --json` quando você precisa apenas de detalhes
de canal e disponibilidade. Se você estiver depurando logs do Gateway em torno de uma atualização,
a verbosidade do console e o nível de log em arquivo são separados: `--verbose` do Gateway afeta
a saída de terminal/WebSocket, enquanto logs em arquivo exigem `logging.level: "debug"` ou
`"trace"` na configuração. Consulte [Logs do Gateway](/pt-BR/gateway/logging).

<Note>
No modo Nix (`OPENCLAW_NIX_MODE=1`), execuções mutáveis de `openclaw update` são desativadas. Atualize a fonte Nix ou a entrada flake desta instalação; para nix-openclaw, use o [Início rápido](https://github.com/openclaw/nix-openclaw#quick-start) com agente em primeiro lugar. `openclaw update status` e `openclaw update --dry-run` permanecem somente leitura.
</Note>

<Warning>
Downgrades exigem confirmação porque versões mais antigas podem quebrar a configuração.
</Warning>

## `update status`

Mostra o canal de atualização ativo + tag/branch/SHA do git (para checkouts de origem), além da disponibilidade de atualização.

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

Opções:

- `--json`: imprime JSON de status legível por máquina.
- `--timeout <seconds>`: tempo limite para verificações (o padrão é 3s).

## `update repair`

Executa novamente a finalização da atualização depois que o pacote core já foi alterado, mas o trabalho
de reparo posterior não terminou corretamente. Este é o caminho de recuperação compatível quando
`openclaw update` instalou o novo pacote core, mas a sincronização de plugins pós-core,
metadados de plugins npm gerenciados, atualização do registro ou reparo do doctor ainda precisa
convergir.

```bash
openclaw update repair
openclaw update repair --channel beta
openclaw update repair --acknowledge-clawhub-risk
openclaw update repair --json
```

Opções:

- `--channel <stable|beta|dev>`: persiste o canal de atualização antes do reparo e
  executa a convergência de plugins contra esse canal.
- `--json`: imprime JSON de finalização legível por máquina.
- `--timeout <seconds>`: tempo limite para etapas de reparo (padrão `1800`).
- `--yes`: pula prompts de confirmação.
- `--acknowledge-clawhub-risk`: após revisar os avisos de confiança da comunidade do ClawHub,
  permite que a convergência de plugins durante o reparo continue sem um
  prompt interativo. Pacotes oficiais do ClawHub e fontes de plugins OpenClaw
  incluídos ignoram esse prompt de confiança de versão.
- `--no-restart`: aceito por paridade com o comando de atualização; o reparo nunca reinicia o
  Gateway.

`openclaw update repair` executa `openclaw doctor --fix`, recarrega a configuração
e os registros de instalação reparados, sincroniza plugins rastreados para o canal de atualização ativo,
atualiza instalações de plugins npm gerenciados, repara payloads de plugins configurados ausentes,
atualiza o registro de plugins e grava os metadados convergidos de registro de instalação.
Ele não instala um novo pacote core e não reinicia o Gateway.

## `update wizard`

Fluxo interativo para escolher um canal de atualização e confirmar se o Gateway deve ser reiniciado
após a atualização (o padrão é reiniciar). Se você selecionar `dev` sem um checkout git, ele
oferece criar um.

Opções:

- `--timeout <seconds>`: tempo limite para cada etapa de atualização (padrão `1800`)

## O que ele faz

Quando você alterna canais explicitamente (`--channel ...`), o OpenClaw também mantém o
método de instalação alinhado:

- `dev` → garante um checkout git (padrão: `~/openclaw`, ou `$OPENCLAW_HOME/openclaw` quando
  `OPENCLAW_HOME` estiver definido; substitua com `OPENCLAW_GIT_DIR`),
  atualiza-o e instala a CLI global a partir desse checkout.
- `stable` → instala a partir do npm usando `latest`.
- `beta` → prefere a dist-tag npm `beta`, mas faz fallback para `latest` quando beta está
  ausente ou é mais antigo que a versão estável atual.

O atualizador automático do core do Gateway (quando habilitado via configuração) inicia o caminho de atualização da CLI
fora do manipulador de solicitações ativo do Gateway. Atualizações pelo gerenciador de pacotes do plano de controle `update.run`
e atualizações supervisionadas de checkout git também usam uma
transferência para serviço gerenciado em vez de substituir a árvore de pacotes ou recompilar
`dist/` dentro do processo ativo do Gateway. O Gateway inicia um helper destacado,
sai, e o helper executa o caminho normal da CLI `openclaw update --yes --json`
fora da árvore de processos do Gateway. Se essa transferência estiver indisponível,
`update.run` retorna uma resposta estruturada com o comando shell seguro para executar
manualmente.

Para instalações por gerenciador de pacotes, `openclaw update` resolve a versão do pacote
de destino antes de invocar o gerenciador de pacotes. Instalações globais npm usam uma instalação
em etapas: o OpenClaw instala o novo pacote em um prefixo npm temporário, verifica
o inventário `dist` empacotado ali e então troca essa árvore de pacote limpa para o
prefixo global real. Se a verificação falhar, doctor pós-atualização, sincronização de plugins e
trabalho de reinicialização não são executados a partir da árvore suspeita. Mesmo quando a versão instalada
já corresponde ao destino, o comando atualiza a instalação do pacote global,
depois executa sincronização de plugins, uma atualização de conclusão de comandos core e trabalho de reinicialização. Isso
mantém sidecars empacotados e registros de plugins pertencentes ao canal alinhados com a
build instalada do OpenClaw, deixando reconstruções completas de conclusão de comandos de plugins para
execuções explícitas de `openclaw completion --write-state`.

Quando um serviço Gateway gerenciado local está instalado e a reinicialização está habilitada,
atualizações por gerenciador de pacotes e checkout git param o serviço em execução antes de
substituir a árvore de pacotes ou alterar a saída de checkout/build. O atualizador
então atualiza os metadados do serviço a partir da instalação atualizada, reinicia o
serviço e verifica o Gateway reiniciado antes de relatar
`Gateway: restarted and verified.`. Atualizações por gerenciador de pacotes também verificam
se o Gateway reiniciado relata a versão do pacote esperada; atualizações por checkout git
verificam a saúde do gateway e a prontidão do serviço após a reconstrução. No macOS, a
verificação pós-atualização também confirma que o LaunchAgent está carregado/em execução para o perfil
ativo e que a porta de loopback configurada está saudável. Se o plist estiver instalado
mas o launchd não o estiver supervisionando, o OpenClaw reinicializa o LaunchAgent
automaticamente e então executa novamente as verificações de prontidão de saúde/versão/canal. Um bootstrap novo
carrega o job RunAtLoad diretamente, então a recuperação de atualização não executa
imediatamente `kickstart -k` no Gateway recém-iniciado. Se o Gateway ainda
não ficar saudável, o comando sai com código diferente de zero e imprime o caminho do log de reinicialização,
além de instruções explícitas de reinicialização, reinstalação e rollback de pacote. Se a reinicialização
não puder ser executada, o comando imprime `Gateway: restart skipped (...)` ou
`Gateway: restart failed: ...` com uma dica manual de `openclaw gateway restart`.
Com `--no-restart`, a substituição do pacote ou reconstrução git ainda é executada, mas o
serviço gerenciado não é parado nem reiniciado, então o Gateway em execução pode manter código antigo
até você reiniciá-lo manualmente.

### Formato da resposta do plano de controle

Quando `update.run` é invocado pelo plano de controle do Gateway em uma
instalação por gerenciador de pacotes ou checkout git supervisionado, o manipulador relata o
início da transferência separadamente da atualização da CLI que continua depois que o
Gateway sai:

- `ok: true`, `result.status: "skipped"`,
  `result.reason: "managed-service-handoff-started"` e
  `handoff.status: "started"` significam que o Gateway criou a transferência para serviço gerenciado
  e agendou sua própria reinicialização para que o helper destacado possa executar
  `openclaw update --yes --json` fora do processo ativo do serviço.
- `ok: false`, `result.reason: "managed-service-handoff-unavailable"` e
  `handoff.status: "unavailable"` significam que o OpenClaw não conseguiu encontrar um limite de
  serviço supervisor e uma identidade de serviço durável para uma transferência segura. Por
  exemplo, a transferência systemd exige a identidade da unidade OpenClaw
  (`OPENCLAW_SYSTEMD_UNIT`), não apenas marcadores ambientais de processo systemd. A
  resposta inclui `handoff.command`, o comando shell para executar fora do
  Gateway.
- `ok: false`, `result.reason: "managed-service-handoff-failed"` significa que o
  Gateway tentou criar a transferência, mas não conseguiu iniciar o helper destacado.

O payload `sentinel` ainda é gravado antes que o Gateway saia, e a transferência da CLI
atualiza o mesmo sentinel de reinicialização depois que as verificações de saúde da reinicialização do serviço gerenciado
são concluídas. Durante a transferência, o sentinel pode carregar
`stats.reason: "restart-health-pending"` sem continuação de sucesso; o
Gateway reiniciado continua consultando-o e só dispara a continuação depois que a CLI
verificou a saúde do serviço e regravou o sentinel com o resultado final `ok`.
`openclaw status` e `openclaw status --all` mostram uma linha `Update restart`
enquanto esse sentinel está pendente ou falhou, e `update.status` atualiza e
retorna o sentinel mais recente.

## Fluxo de checkout git

### Seleção de canal

- `stable`: faz checkout da tag não beta mais recente, depois compila e executa doctor.
- `beta`: prefere a tag `-beta` mais recente, mas faz fallback para a tag estável mais recente quando beta está ausente ou mais antigo.
- `dev`: faz checkout de `main`, depois executa fetch e rebase.

### Etapas de atualização

<Steps>
  <Step title="Verificar árvore de trabalho limpa">
    Requer que não haja alterações não commitadas.
  </Step>
  <Step title="Trocar canal">
    Troca para o canal selecionado (tag ou branch).
  </Step>
  <Step title="Buscar upstream">
    Somente dev.
  </Step>
  <Step title="Build de pré-verificação (somente dev)">
    Executa o build TypeScript em uma árvore de trabalho temporária. Se a ponta falhar, retrocede até 10 commits para encontrar o commit mais recente que consiga fazer build. Defina `OPENCLAW_UPDATE_PREFLIGHT_LINT=1` para também executar lint durante essa pré-verificação; o lint roda em modo serial restrito porque os hosts de atualização de usuário costumam ser menores que os runners de CI.
  </Step>
  <Step title="Rebase">
    Faz rebase sobre o commit selecionado (somente dev).
  </Step>
  <Step title="Instalar dependências">
    Usa o gerenciador de pacotes do repositório. Para checkouts pnpm, o atualizador inicializa `pnpm` sob demanda (primeiro via `corepack`, depois com um fallback temporário `npm install pnpm@11`) em vez de executar `npm run build` dentro de um workspace pnpm.
  </Step>
  <Step title="Fazer build da UI de Controle">
    Faz build do Gateway e da UI de Controle.
  </Step>
  <Step title="Executar doctor">
    `openclaw doctor` é executado como a verificação final de atualização segura.
  </Step>
  <Step title="Sincronizar plugins">
    Sincroniza plugins com o canal ativo. Dev usa plugins empacotados; stable e beta usam npm. Atualiza instalações de plugin rastreadas.
  </Step>
</Steps>

No canal de atualização beta, instalações rastreadas de plugins npm e ClawHub que seguem
a linha padrão/latest tentam primeiro uma versão `@beta` do plugin. Se o plugin não tiver
versão beta, o OpenClaw volta para a especificação padrão/latest registrada e relata
isso como um aviso. Para plugins npm, o OpenClaw também faz fallback quando o pacote
beta existe, mas falha na validação de instalação. Esses avisos de fallback de plugin
não fazem a atualização do core falhar. Versões exatas e tags explícitas não são
reescritas.

<Warning>
Se uma atualização de plugin npm fixada exatamente resolver para um artefato cuja integridade difere do registro de instalação armazenado, `openclaw update` aborta essa atualização de artefato do plugin em vez de instalá-lo. Reinstale ou atualize o plugin explicitamente somente depois de verificar que você confia no novo artefato.
</Warning>

<Note>
Falhas de sincronização de plugin pós-atualização que estão restritas a um plugin gerenciado e que o caminho de sincronização consegue contornar (por exemplo, um registro npm inacessível para um plugin não essencial) são relatadas como avisos depois que a atualização do core é concluída com sucesso. O resultado JSON mantém o `status: "ok"` da atualização no nível superior e relata `postUpdate.plugins.status: "warning"` com orientação para `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json`. Exceções inesperadas do atualizador ou da sincronização ainda fazem o resultado da atualização falhar. Corrija a instalação do plugin ou o erro de atualização e execute novamente `openclaw update repair`.

Após a etapa de sincronização por plugin, `openclaw update` executa uma passagem obrigatória de **convergência pós-core** antes que o Gateway seja reiniciado: ela repara payloads ausentes de plugins configurados, valida em disco cada registro de instalação rastreado _ativo_ e verifica estaticamente se seu `package.json` pode ser analisado (e se qualquer `main` declarado explicitamente existe). Falhas dessa passagem — e um snapshot inválido da configuração do OpenClaw — retornam `postUpdate.plugins.status: "error"` e alteram o `status` da atualização no nível superior para `"error"`, então `openclaw update` sai com código diferente de zero e o Gateway _não_ é reiniciado com um conjunto de plugins não verificado. O erro inclui linhas estruturadas em `postUpdate.plugins.warnings[].guidance` apontando para `openclaw update repair` e `openclaw plugins inspect <id> --runtime --json` para acompanhamento. Entradas de plugins desabilitados e registros que não são alvos oficiais de sincronização vinculados a uma fonte confiável são ignorados aqui, espelhando a política `skipDisabledPlugins` usada pela verificação de payload ausente, portanto um registro obsoleto de plugin desabilitado não pode bloquear uma atualização que, de outra forma, seria válida.

Quando o Gateway atualizado inicia, o carregamento de plugins é apenas de verificação: a inicialização não
executa gerenciadores de pacotes nem altera árvores de dependências. Reinicializações de
`update.run` do gerenciador de pacotes são entregues ao caminho de serviço gerenciado pela CLI, então a troca de pacote acontece
fora do processo antigo do Gateway e as verificações de integridade do serviço decidem se a
atualização pode ser relatada como concluída.

Se a inicialização do pnpm ainda falhar, o atualizador para cedo com um erro específico do gerenciador de pacotes em vez de tentar `npm run build` dentro do checkout.
</Note>

## Atalho `--update`

`openclaw --update` é reescrito para `openclaw update` (útil para shells e scripts de inicialização).

## Relacionados

- `openclaw doctor` (oferece executar a atualização primeiro em checkouts git)
- [Canais de desenvolvimento](/pt-BR/install/development-channels)
- [Atualização](/pt-BR/install/updating)
- [Referência da CLI](/pt-BR/cli)
