---
read_when:
    - Alteração do comportamento de atualização, doctor, aceitação de pacote ou instalação de Plugin do OpenClaw
    - Preparando ou aprovando um candidato a lançamento
    - Depuração de atualização de pacote, limpeza de dependências de Plugin ou regressões de instalação de Plugin
sidebarTitle: Update and plugin tests
summary: Como o OpenClaw valida caminhos de atualização, migrações de pacotes e o comportamento de instalação/atualização de Plugin
title: 'Testes: atualizações e plugins'
x-i18n:
    generated_at: "2026-05-05T05:43:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta é a checklist dedicada para validação de atualização e plugins. O objetivo é
simples: comprovar que o pacote instalável consegue atualizar o estado real do
usuário, reparar estado legado obsoleto por meio de `doctor` e ainda instalar,
carregar, atualizar e desinstalar plugins das fontes compatíveis.

Para o mapa mais amplo do executor de testes, consulte [Testes](/pt-BR/help/testing). Para chaves de provedores ao vivo e suítes que tocam a rede, consulte [Testes ao vivo](/pt-BR/help/testing-live).

## O que protegemos

Os testes de atualização e plugins protegem estes contratos:

- Um tarball de pacote está completo, tem um `dist/postinstall-inventory.json`
  válido e não depende de arquivos do repositório desempacotado.
- Um usuário consegue migrar de um pacote publicado mais antigo para o pacote
  candidato sem perder configuração, agentes, sessões, workspaces, allowlists de
  plugins ou configuração de canal.
- `openclaw doctor --fix --non-interactive` é responsável por caminhos de
  limpeza e reparo legados. A inicialização não deve ganhar migrações de
  compatibilidade ocultas para estado obsoleto de plugin.
- Instalações de plugins funcionam a partir de diretórios locais, repositórios
  git, pacotes npm e o caminho de registro do ClawHub.
- Dependências npm de plugins são instaladas na raiz npm gerenciada, verificadas
  antes da confiança e removidas por meio do npm durante a desinstalação para
  que dependências içadas não permaneçam.
- A atualização de plugins é estável quando nada mudou: registros de instalação,
  fonte resolvida, layout de dependências instaladas e estado habilitado
  permanecem intactos.

## Comprovação local durante o desenvolvimento

Comece de forma restrita:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para mudanças em instalação, desinstalação, dependências ou inventário de pacote
de plugins, execute também os testes focados que cobrem a fronteira editada:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes de qualquer lane Docker de pacote consumir um tarball, comprove o artefato
do pacote:

```bash
pnpm release:check
```

`release:check` executa verificações de deriva de configuração/docs/API, grava o
inventário dist do pacote, executa `npm pack --dry-run`, rejeita arquivos
empacotados proibidos, instala o tarball em um prefixo temporário, executa
postinstall e faz smoke dos pontos de entrada de canais integrados.

## Lanes Docker

As lanes Docker são a comprovação em nível de produto. Elas instalam ou atualizam
um pacote real dentro de contêineres Linux e verificam o comportamento por meio
de comandos CLI, inicialização do Gateway, probes HTTP, status RPC e estado do
sistema de arquivos.

Use lanes focadas durante a iteração:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Lanes importantes:

- `test:docker:plugins` valida smoke de instalação de plugins, instalações de
  pastas locais, comportamento de pular atualização de pastas locais, pastas
  locais com dependências pré-instaladas, instalações de pacote `file:`,
  instalações git com execução pela CLI, atualizações de referência móvel git,
  instalações de registro npm com dependências transitivas içadas, no-ops de
  atualização npm, instalações de fixture local do ClawHub e no-ops de
  atualização, comportamento de atualização do marketplace e habilitação/inspeção
  do bundle Claude. Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para manter o bloco
  do ClawHub hermético/offline.
- `test:docker:plugin-lifecycle-matrix` instala o pacote candidato em um
  contêiner limpo, executa um plugin npm por instalação, inspeção,
  desabilitação, habilitação, upgrade explícito, downgrade explícito e
  desinstalação após excluir o código do plugin. Ele registra métricas de RSS e
  CPU para cada fase.
- `test:docker:plugin-update` valida que um plugin instalado sem mudanças não é
  reinstalado nem perde metadados de instalação durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala o tarball candidato sobre uma fixture de
  usuário antigo suja, executa atualização de pacote mais doctor não interativo,
  então inicia um Gateway em loopback e verifica a preservação de estado.
- `test:docker:published-upgrade-survivor` primeiro instala uma linha de base
  publicada, configura-a por meio de uma receita `openclaw config set` embutida,
  atualiza para o tarball candidato, executa doctor, verifica limpeza legada,
  inicia o Gateway e testa `/healthz`, `/readyz` e status RPC.
- `test:docker:update-restart-auth` instala o pacote candidato, inicia um Gateway
  gerenciado com autenticação por token, desdefine o env de autenticação de
  gateway do chamador para `openclaw update --yes --json` e exige que o comando
  de atualização candidato reinicie o Gateway antes dos probes normais.
- `test:docker:update-migration` é a lane de atualização publicada com foco em
  limpeza. Ela parte de um estado de usuário configurado no estilo
  Discord/Telegram, executa doctor de linha de base para que dependências de
  plugins configurados tenham chance de se materializar, semeia resíduos legados
  de dependências de plugin para um plugin empacotado configurado, atualiza para
  o tarball candidato e exige que o doctor pós-atualização remova as raízes de
  dependências legadas.

Variantes úteis de sobrevivente de upgrade publicado:

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` expande para todos os
cenários com formato de issues reportadas, incluindo a migração de instalação de
plugins configurados.

A migração completa de atualização é intencionalmente separada da CI de Release
Completa. Use o workflow manual `Update Migration` quando a pergunta de release
for "toda release estável publicada a partir de 2026.4.23 consegue atualizar para
este candidato e limpar resíduos de dependências de plugins?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Aceitação de Pacote

Aceitação de Pacote é o gate de pacote nativo do GitHub. Ele resolve um pacote
candidato em um tarball `package-under-test`, registra versão e SHA-256, então
executa lanes Docker E2E reutilizáveis contra esse tarball exato. A ref do
harness do workflow é separada da ref de origem do pacote, para que a lógica de
teste atual possa validar releases confiáveis mais antigas.

Fontes candidatas:

- `source=npm`: valide `openclaw@beta`, `openclaw@latest` ou uma versão publicada
  exata.
- `source=ref`: empacote uma branch, tag ou commit confiável com o harness atual
  selecionado.
- `source=url`: valide um tarball HTTPS com `package_sha256` obrigatório.
- `source=artifact`: reutilize um tarball enviado por outra execução do Actions.

A Validação de Release Completa usa `source=artifact` por padrão, criada a partir
do SHA de release resolvido. Para comprovação pós-publicação, passe
`package_acceptance_package_spec=openclaw@YYYY.M.D` para que a mesma matriz de
upgrade mire o pacote npm publicado.

As verificações de release chamam Aceitação de Pacote com o conjunto de
pacote/atualização/reinicialização/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Quando o soak de release está habilitado, elas também passam:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Isso mantém migração de pacote, troca de canal de atualização, limpeza de
dependências obsoletas de plugins, cobertura offline de plugins, comportamento
de atualização de plugins e QA de pacote do Telegram no mesmo artefato resolvido,
sem fazer o gate padrão de pacote de release percorrer toda release publicada.

`last-stable-4` resolve para as quatro releases estáveis mais recentes do
OpenClaw publicadas no npm. A aceitação de pacote de release fixa `2026.4.23`
como a primeira fronteira de compatibilidade de atualização de plugins,
`2026.5.2` como uma fronteira de churn da arquitetura de plugins e `2026.4.15`
como uma linha de base mais antiga de atualização publicada de 2026.4.1x; o
resolvedor deduplica pins que já estejam nas quatro mais recentes. Para cobertura
exaustiva de migração de atualização publicada, use `all-since-2026.4.23` no
workflow separado Update Migration em vez da CI de Release Completa.
`release-history` continua disponível para amostragem manual mais ampla quando
você também quiser a âncora legada anterior à data.

Quando várias linhas de base de sobrevivente de upgrade publicado são
selecionadas, o workflow Docker reutilizável divide cada linha de base em seu
próprio job de runner direcionado. Cada shard de linha de base ainda executa o
conjunto de cenários selecionado, mas logs e artefatos permanecem por linha de
base e o tempo total é limitado pelo shard mais lento em vez de um grande job
serial.

Execute um perfil de pacote manualmente ao validar um candidato antes da
release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Use `suite_profile=product` quando a pergunta de release incluir canais MCP,
limpeza de cron/subagente, pesquisa na web da OpenAI ou OpenWebUI. Use
`suite_profile=full` somente quando precisar de cobertura Docker completa do
caminho de release.

## Padrão de release

Para candidatos a release, a pilha de comprovação padrão é:

1. `pnpm check:changed` e `pnpm test:changed` para regressões em nível de código-fonte.
2. `pnpm release:check` para integridade do artefato de pacote.
3. Perfil `package` da Aceitação de Pacote ou as lanes de pacote personalizadas
   de verificação de release para contratos de instalação/atualização/reinicialização/plugin.
4. Verificações de release entre sistemas operacionais para instalador,
   onboarding e comportamento de plataforma específicos de OS.
5. Suítes ao vivo somente quando a superfície alterada tocar comportamento de
   provedor ou serviço hospedado.

Em máquinas de mantenedores, gates amplos e comprovação Docker/pacote de produto
devem rodar no Testbox, a menos que a comprovação local seja feita
explicitamente.

## Compatibilidade legada

A leniência de compatibilidade é restrita e com prazo definido:

- Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem tolerar lacunas
  de metadados de pacote já enviadas na Aceitação de Pacote.
- O pacote publicado `2026.4.26` pode avisar sobre arquivos de carimbo de
  metadados de build local já enviados.
- Pacotes posteriores devem satisfazer contratos modernos. As mesmas lacunas
  falham em vez de avisar ou pular.

Não adicione novas migrações de inicialização para esses formatos antigos.
Adicione ou estenda um reparo do doctor, então comprove-o com `upgrade-survivor`,
`published-upgrade-survivor` ou `update-restart-auth` quando o comando de
atualização for responsável pela reinicialização.

## Adicionando cobertura

Ao alterar comportamento de atualização ou plugins, adicione cobertura na camada
mais baixa que possa falhar pelo motivo certo:

- Lógica pura de caminho ou metadados: teste unitário ao lado da fonte.
- Comportamento de inventário de pacote ou arquivo empacotado:
  `package-dist-inventory` ou teste do verificador de tarball.
- Comportamento de instalação/atualização pela CLI: asserção ou fixture de lane Docker.
- Comportamento de migração de release publicada: cenário `published-upgrade-survivor`.
- Comportamento de reinicialização pertencente à atualização: `update-restart-auth`.
- Comportamento de fonte de registro/pacote: fixture `test:docker:plugins` ou
  servidor de fixture ClawHub.
- Comportamento de layout ou limpeza de dependências: verifique tanto a execução
  em runtime quanto a fronteira do sistema de arquivos. Dependências npm podem
  ser içadas sob a raiz npm gerenciada, então os testes devem comprovar que a
  raiz é verificada/limpa em vez de presumir uma árvore `node_modules` local ao
  pacote.

Mantenha novas fixtures Docker herméticas por padrão. Use registros de fixture
locais e pacotes falsos, a menos que o objetivo do teste seja comportamento de
registro ao vivo.

## Triagem de falhas

Comece pela identidade do artefato:

- Resumo de Aceitação de Pacote `resolve_package`: origem, versão, SHA-256 e
  nome do artefato.
- Artefatos do Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logs das faixas e comandos de nova execução.
- Resumo de sobrevivência de upgrade: `.artifacts/upgrade-survivor/summary.json`,
  incluindo versão de linha de base, versão candidata, cenário, tempos das fases e
  etapas da receita.

Prefira executar novamente a faixa exata que falhou com o mesmo artefato de pacote em vez de
executar novamente todo o guarda-chuva de lançamento.
