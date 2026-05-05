---
read_when:
    - Alterar o comportamento de atualização, doctor, aceitação de pacote ou instalação de Plugin do OpenClaw
    - Preparar ou aprovar uma versão candidata a lançamento
    - Depuração de regressões em atualizações de pacote, limpeza de dependências de Plugin ou instalação de Plugin
sidebarTitle: Update and plugin tests
summary: Como o OpenClaw valida caminhos de atualização, migrações de pacotes e o comportamento de instalação/atualização de Plugin
title: 'Testes: atualizações e plugins'
x-i18n:
    generated_at: "2026-05-05T01:47:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta é a checklist dedicada para validação de atualização e Plugin. O objetivo é
simples: provar que o pacote instalável consegue atualizar o estado real do
usuário, reparar estado legado obsoleto por meio de `doctor` e ainda instalar,
carregar, atualizar e desinstalar Plugins a partir das fontes compatíveis.

Para o mapa mais amplo do executor de testes, consulte [Testes](/pt-BR/help/testing). Para chaves de provedores
ao vivo e suítes que tocam a rede, consulte [Testes ao vivo](/pt-BR/help/testing-live).

## O que protegemos

Os testes de atualização e Plugin protegem estes contratos:

- Um tarball de pacote está completo, tem um `dist/postinstall-inventory.json`
  válido e não depende de arquivos descompactados do repositório.
- Um usuário pode migrar de um pacote publicado mais antigo para o pacote candidato
  sem perder configuração, agentes, sessões, workspaces, allowlists de Plugin ou
  configuração de canal.
- `openclaw doctor --fix --non-interactive` é responsável pelos caminhos de limpeza e reparo
  legados. A inicialização não deve ganhar migrações de compatibilidade ocultas para estado
  obsoleto de Plugin.
- Instalações de Plugin funcionam a partir de diretórios locais, repositórios git, pacotes npm e o
  caminho de registro do ClawHub.
- Dependências npm de Plugin são instaladas na raiz npm gerenciada, verificadas antes
  da confiança e removidas pelo npm durante a desinstalação para que dependências içadas não
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
execute os testes focados que cobrem a interface editada:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes que qualquer pista Docker de pacote consuma um tarball, prove o artefato do pacote:

```bash
pnpm release:check
```

`release:check` executa verificações de divergência de configuração/docs/API, grava o inventário de dist
do pacote, executa `npm pack --dry-run`, rejeita arquivos empacotados proibidos, instala
o tarball em um prefixo temporário, executa postinstall e faz smoke de entrypoints de canais
incluídos.

## Pistas Docker

As pistas Docker são a prova em nível de produto. Elas instalam ou atualizam um pacote real
dentro de contêineres Linux e verificam o comportamento por meio de comandos da CLI,
inicialização do Gateway, sondas HTTP, status RPC e estado do sistema de arquivos.

Use pistas focadas durante a iteração:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Pistas importantes:

- `test:docker:plugins` valida smoke de instalação de Plugin, instalações de pasta local,
  comportamento de ignorar atualização de pasta local, pastas locais com dependências
  pré-instaladas, instalações de pacote `file:`, instalações git com execução via CLI, atualizações
  de referência móvel git, instalações de registro npm com dependências transitivas
  içadas, no-ops de atualização npm, instalações de fixture local do ClawHub e no-ops de
  atualização, comportamento de atualização do marketplace e habilitação/inspeção de pacote Claude. Defina
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para manter o bloco do ClawHub hermético/offline.
- `test:docker:plugin-lifecycle-matrix` instala o pacote candidato em um contêiner
  vazio, executa um Plugin npm por instalação, inspeção, desabilitação, habilitação,
  upgrade explícito, downgrade explícito e desinstalação após excluir o código do Plugin.
  Ele registra métricas de RSS e CPU para cada fase.
- `test:docker:plugin-update` valida que um Plugin instalado inalterado não
  é reinstalado nem perde metadados de instalação durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala o tarball candidato sobre uma fixture
  suja de usuário antigo, executa atualização de pacote mais doctor não interativo e então inicia
  um Gateway de loopback e verifica a preservação de estado.
- `test:docker:published-upgrade-survivor` primeiro instala uma baseline publicada,
  configura-a por meio de uma receita `openclaw config set` embutida, atualiza-a para o
  tarball candidato, executa doctor, verifica limpeza legada, inicia o Gateway e
  sonda `/healthz`, `/readyz` e status RPC.
- `test:docker:update-migration` é a pista de atualização publicada com forte foco em limpeza. Ela
  começa com um estado de usuário configurado no estilo Discord/Telegram, executa doctor
  da baseline para que dependências de Plugin configurado tenham chance de se materializar, semeia
  resíduos legados de dependências de Plugin para um Plugin empacotado configurado, atualiza para
  o tarball candidato e exige que o doctor pós-atualização remova as raízes legadas
  de dependências.

Variantes úteis de published-upgrade survivor:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Os cenários disponíveis são `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` e `versioned-runtime-deps`. Em execuções agregadas,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` expande para todos os cenários
com formato de problemas relatados, incluindo a migração de instalação de Plugin configurado.

A migração completa de atualização é intencionalmente separada da CI de Full Release. Use o
workflow manual `Update Migration` quando a pergunta de release for "toda
release estável publicada a partir de 2026.4.23 consegue atualizar para este candidato e
limpar resíduos de dependências de Plugin?":

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
candidato em um tarball `package-under-test`, registra versão e SHA-256 e então
executa pistas Docker E2E reutilizáveis contra esse tarball exato. O ref do harness
do workflow é separado do ref de origem do pacote, para que a lógica de teste atual possa validar
releases confiáveis mais antigas.

Fontes candidatas:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` ou uma versão publicada
  exata.
- `source=ref`: empacota uma branch, tag ou commit confiável com o harness atual
  selecionado.
- `source=url`: valida um tarball HTTPS com `package_sha256` obrigatório.
- `source=artifact`: reutiliza um tarball enviado por outra execução do Actions.

Full Release Validation usa `source=artifact` por padrão, criado a partir do
SHA de release resolvido. Para prova pós-publicação, passe
`package_acceptance_package_spec=openclaw@YYYY.M.D` para que a mesma matriz de upgrade
mire o pacote npm entregue.

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
Telegram no mesmo artefato resolvido.

`all-since-2026.4.23` é a amostra de upgrade da CI de Full Release: todas as releases estáveis publicadas no npm de `2026.4.23` até `latest`. Para cobertura exaustiva de migração de
atualização publicada, use `all-since-2026.4.23` no workflow separado Update
Migration em vez da CI de Full Release. `release-history` permanece
disponível para amostragem manual mais ampla quando você também quiser a âncora legada anterior à data.

Execute um perfil de pacote manualmente ao validar um candidato antes da release:

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
limpeza de cron/subagente, busca web da OpenAI ou OpenWebUI. Use `suite_profile=full`
somente quando precisar de cobertura completa de caminho de release Docker.

## Padrão de release

Para candidatas a release, a pilha de prova padrão é:

1. `pnpm check:changed` e `pnpm test:changed` para regressões em nível de código-fonte.
2. `pnpm release:check` para integridade do artefato de pacote.
3. Perfil `package` do Package Acceptance ou as pistas customizadas de pacote
   de release-check para contratos de instalação/atualização/Plugin.
4. Verificações de release entre sistemas operacionais para comportamento específico de instalador, onboarding e plataforma.
5. Suítes ao vivo somente quando a superfície alterada toca comportamento de provedor ou serviço hospedado.

Em máquinas de mantenedores, gates amplos e prova de produto Docker/pacote devem ser executados
no Testbox, salvo prova local explícita.

## Compatibilidade legada

A tolerância de compatibilidade é restrita e com prazo definido:

- Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem tolerar
  lacunas de metadados de pacote já entregues no Package Acceptance.
- O pacote publicado `2026.4.26` pode alertar sobre arquivos de carimbo de metadados
  de build local já entregues.
- Pacotes posteriores devem satisfazer contratos modernos. As mesmas lacunas falham em vez de
  gerar alerta ou serem ignoradas.

Não adicione novas migrações de inicialização para esses formatos antigos. Adicione ou estenda um reparo
de doctor e então prove com `upgrade-survivor` ou `published-upgrade-survivor`.

## Adicionando cobertura

Ao alterar comportamento de atualização ou Plugin, adicione cobertura na camada mais baixa que
possa falhar pelo motivo certo:

- Lógica pura de caminho ou metadados: teste unitário ao lado do código-fonte.
- Inventário de pacote ou comportamento de arquivos empacotados: `package-dist-inventory` ou teste
  de verificador de tarball.
- Comportamento de instalação/atualização da CLI: asserção ou fixture de pista Docker.
- Comportamento de migração de release publicada: cenário `published-upgrade-survivor`.
- Comportamento de fonte de registro/pacote: fixture `test:docker:plugins` ou servidor
  de fixture do ClawHub.
- Comportamento de layout ou limpeza de dependências: verifique tanto a execução em runtime quanto a
  fronteira do sistema de arquivos. Dependências npm podem ser içadas sob a raiz npm
  gerenciada, então os testes devem provar que a raiz é verificada/limpa em vez de assumir uma árvore
  `node_modules` local ao pacote.

Mantenha novas fixtures Docker herméticas por padrão. Use registros de fixtures locais e
pacotes falsos, a menos que o objetivo do teste seja comportamento de registro ao vivo.

## Triagem de falhas

Comece pela identidade do artefato:

- Resumo `resolve_package` do Package Acceptance: fonte, versão, SHA-256 e
  nome do artefato.
- Artefatos Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logs de pista e comandos de nova execução.
- Resumo de upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  incluindo versão baseline, versão candidata, cenário, tempos de fase e
  etapas da receita.

Prefira executar novamente a pista exata com falha com o mesmo artefato de pacote em vez de
executar novamente todo o guarda-chuva de release.
