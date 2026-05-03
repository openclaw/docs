---
read_when:
    - Alterar o comportamento de atualização, doctor, aceitação de pacote ou instalação de Plugin do OpenClaw
    - Preparando ou aprovando uma versão candidata a lançamento
    - Depuração de regressões de atualização de pacote, limpeza de dependências de Plugin ou instalação de Plugin
sidebarTitle: Update and plugin tests
summary: Como o OpenClaw valida caminhos de atualização, migrações de pacotes e o comportamento de instalação/atualização de Plugin
title: 'Testes: atualizações e plugins'
x-i18n:
    generated_at: "2026-05-03T21:34:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta é a checklist dedicada para validação de atualização e Plugin. O objetivo é
simples: provar que o pacote instalável consegue atualizar o estado real do usuário, reparar estado
legado obsoleto por meio de `doctor` e ainda instalar, carregar, atualizar e desinstalar
Plugins das fontes compatíveis.

Para o mapa mais amplo do executor de testes, consulte [Testes](/pt-BR/help/testing). Para chaves de provedores
ao vivo e suítes que acessam a rede, consulte [Testes ao vivo](/pt-BR/help/testing-live).

## O que protegemos

Os testes de atualização e Plugin protegem estes contratos:

- Um tarball de pacote está completo, tem um `dist/postinstall-inventory.json` válido
  e não depende de arquivos de repositório não empacotados.
- Um usuário pode migrar de um pacote publicado mais antigo para o pacote candidato
  sem perder configuração, agentes, sessões, workspaces, allowlists de Plugin ou
  configuração de canal.
- `openclaw doctor --fix --non-interactive` é responsável pelos caminhos de limpeza e reparo
  legados. A inicialização não deve acumular migrações ocultas de compatibilidade para estado
  obsoleto de Plugin.
- Instalações de Plugin funcionam a partir de diretórios locais, repositórios git, pacotes npm e do
  caminho de registro do ClawHub.
- Dependências npm de Plugin são instaladas na raiz npm gerenciada, verificadas antes
  da confiança e removidas por meio do npm durante a desinstalação para que dependências içadas não
  permaneçam.
- A atualização de Plugin é estável quando nada mudou: registros de instalação, fonte
  resolvida, layout de dependências instaladas e estado habilitado permanecem intactos.

## Prova local durante o desenvolvimento

Comece de forma restrita:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para alterações de instalação, desinstalação, dependência ou inventário de pacote de Plugin, também
execute os testes focados que cobrem o ponto editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes que qualquer lane Docker de pacote consuma um tarball, prove o artefato do pacote:

```bash
pnpm release:check
```

`release:check` executa verificações de drift de configuração/docs/API, grava o inventário de distribuição
do pacote, executa `npm pack --dry-run`, rejeita arquivos empacotados proibidos, instala
o tarball em um prefixo temporário, executa postinstall e testa superficialmente os entrypoints de canais
incluídos.

## Lanes Docker

As lanes Docker são a prova em nível de produto. Elas instalam ou atualizam um pacote real
dentro de contêineres Linux e verificam o comportamento por meio de comandos CLI,
inicialização do Gateway, probes HTTP, status RPC e estado do sistema de arquivos.

Use lanes focadas durante a iteração:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lanes importantes:

- `test:docker:plugins` valida smoke de instalação de Plugin, instalações de pasta local,
  comportamento de ignorar atualização de pasta local, pastas locais com
  dependências pré-instaladas, instalações de pacote `file:`, instalações git com execução de CLI, atualizações de
  referência móvel git, instalações de registro npm com dependências transitivas
  içadas, no-ops de atualização npm, instalações de fixture local do ClawHub e no-ops de atualização,
  comportamento de atualização do marketplace e habilitação/inspeção do pacote Claude. Defina
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para manter o bloco do ClawHub hermético/offline.
- `test:docker:plugin-lifecycle-matrix` instala o pacote candidato em um contêiner
  vazio, executa um Plugin npm por instalação, inspeção, desabilitação, habilitação,
  upgrade explícito, downgrade explícito e desinstalação após excluir o código do Plugin.
  Ele registra métricas de RSS e CPU para cada fase.
- `test:docker:plugin-update` valida que um Plugin instalado sem alterações não
  reinstala nem perde metadados de instalação durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala o tarball candidato sobre uma fixture de usuário antigo
  suja, executa atualização de pacote mais doctor não interativo, depois inicia
  um Gateway de loopback e verifica a preservação de estado.
- `test:docker:published-upgrade-survivor` primeiro instala uma baseline publicada,
  configura-a por meio de uma receita `openclaw config set` embutida, atualiza-a para o
  tarball candidato, executa doctor, verifica a limpeza legada, inicia o Gateway e
  testa `/healthz`, `/readyz` e status RPC.
- `test:docker:update-migration` é a lane de atualização publicada com muita limpeza. Ela
  começa a partir de um estado de usuário configurado no estilo Discord/Telegram, executa o
  doctor da baseline para que dependências de Plugin configuradas tenham a chance de se materializar, semeia
  detritos legados de dependências de Plugin para um Plugin empacotado configurado, atualiza para
  o tarball candidato e exige que o doctor pós-atualização remova as raízes legadas
  de dependência.

Variantes úteis do survivor de upgrade publicado:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Os cenários disponíveis são `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` e
`versioned-runtime-deps`. Em execuções agregadas,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` expande para todos os cenários
com formato de issues reportadas, incluindo a migração de instalação de Plugin configurado.

A migração completa de atualização é intencionalmente separada da CI de Release Completa. Use o
workflow manual `Update Migration` quando a pergunta de release for "cada
release estável publicado desde 2026.4.23 em diante consegue atualizar para este candidato e
limpar detritos de dependências de Plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance é o gate de pacote nativo do GitHub. Ele resolve um pacote
candidato em um tarball `package-under-test`, registra versão e SHA-256, depois
executa lanes Docker E2E reutilizáveis contra esse tarball exato. A ref do harness de workflow
é separada da ref de origem do pacote, então a lógica de teste atual pode validar
releases confiáveis mais antigos.

Fontes candidatas:

- `source=npm`: validar `openclaw@beta`, `openclaw@latest` ou uma versão
  publicada exata.
- `source=ref`: empacotar um branch, tag ou commit confiável com o harness atual
  selecionado.
- `source=url`: validar um tarball HTTPS com `package_sha256` obrigatório.
- `source=artifact`: reutilizar um tarball enviado por outra execução do Actions.

Full Release Validation usa `source=artifact` por padrão, criado a partir do
SHA de release resolvido. Para prova pós-publicação, passe
`package_acceptance_package_spec=openclaw@YYYY.M.D` para que a mesma matriz de upgrade
tenha como alvo o pacote npm entregue.

As verificações de release chamam Package Acceptance com o conjunto de pacote/atualização/Plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Elas também passam:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Isso mantém migração de pacote, troca de canal de atualização, limpeza de dependências
obsoletas de Plugin, cobertura offline de Plugin, comportamento de atualização de Plugin e QA de pacote
do Telegram no mesmo artefato resolvido.

`all-since-2026.4.23` é a amostra de upgrade da CI de Release Completa: todo release estável publicado no npm de `2026.4.23` até `latest`. Para cobertura exaustiva de migração de atualização
publicada, use `all-since-2026.4.23` no workflow Update
Migration separado em vez da CI de Release Completa. `release-history` permanece
disponível para amostragem manual mais ampla quando você também quiser a âncora
legada anterior à data.

Execute um perfil de pacote manualmente ao validar um candidato antes do release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Use `suite_profile=product` quando a pergunta de release incluir canais MCP,
limpeza de cron/subagente, pesquisa web da OpenAI ou OpenWebUI. Use `suite_profile=full`
somente quando precisar de cobertura completa do caminho de release Docker.

## Padrão de release

Para candidatos a release, a pilha de prova padrão é:

1. `pnpm check:changed` e `pnpm test:changed` para regressões em nível de código-fonte.
2. `pnpm release:check` para integridade do artefato de pacote.
3. Perfil Package Acceptance `package` ou as lanes customizadas de pacote
   de release-check para contratos de instalação/atualização/Plugin.
4. Verificações de release entre sistemas operacionais para instalador, onboarding e comportamento
   de plataforma específicos de OS.
5. Suítes ao vivo somente quando a superfície alterada toca comportamento de provedor ou serviço
   hospedado.

Em máquinas de mantenedores, gates amplos e prova de produto Docker/pacote devem executar
no Testbox, a menos que a prova local esteja sendo feita explicitamente.

## Compatibilidade legada

A leniência de compatibilidade é restrita e temporária:

- Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem tolerar
  lacunas de metadados de pacote já entregues no Package Acceptance.
- O pacote `2026.4.26` publicado pode emitir avisos para arquivos de carimbo de metadados
  de build local já entregues.
- Pacotes posteriores devem satisfazer contratos modernos. As mesmas lacunas falham em vez de
  avisar ou pular.

Não adicione novas migrações de inicialização para esses formatos antigos. Adicione ou estenda um reparo
de doctor, depois prove-o com `upgrade-survivor` ou `published-upgrade-survivor`.

## Adicionando cobertura

Ao alterar comportamento de atualização ou Plugin, adicione cobertura na camada mais baixa que
possa falhar pelo motivo correto:

- Lógica pura de caminho ou metadados: teste unitário ao lado do código-fonte.
- Comportamento de inventário de pacote ou arquivo empacotado: teste `package-dist-inventory` ou do verificador
  de tarball.
- Comportamento de instalação/atualização da CLI: asserção ou fixture de lane Docker.
- Comportamento de migração de release publicado: cenário `published-upgrade-survivor`.
- Comportamento de registro/fonte de pacote: fixture `test:docker:plugins` ou servidor de fixture
  do ClawHub.
- Comportamento de layout ou limpeza de dependências: verifique tanto a execução em runtime quanto a
  fronteira do sistema de arquivos. Dependências npm podem ser içadas sob a raiz npm gerenciada,
  então os testes devem provar que a raiz é verificada/limpa em vez de assumir uma árvore
  `node_modules` local ao pacote.

Mantenha novas fixtures Docker herméticas por padrão. Use registros de fixture locais e
pacotes falsos, a menos que o ponto do teste seja o comportamento de registro ao vivo.

## Triagem de falhas

Comece pela identidade do artefato:

- Resumo `resolve_package` do Package Acceptance: fonte, versão, SHA-256 e
  nome do artefato.
- Artefatos Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logs de lane e comandos de nova execução.
- Resumo do upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  incluindo versão da baseline, versão candidata, cenário, tempos de fase e
  etapas da receita.

Prefira executar novamente a lane exata que falhou com o mesmo artefato de pacote em vez de
executar novamente todo o guarda-chuva de release.
