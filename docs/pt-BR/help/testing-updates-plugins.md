---
read_when:
    - Alterar o comportamento de atualização, doctor, aceitação de pacote ou instalação de Plugin do OpenClaw
    - Preparar ou aprovar uma versão candidata a lançamento
    - Depuração de regressões de atualização de pacote, de limpeza de dependências de Plugin ou de instalação de Plugin
sidebarTitle: Update and plugin tests
summary: Como o OpenClaw valida caminhos de atualização, migrações de pacote e o comportamento de instalação/atualização de Plugin
title: 'Testes: atualizações e plugins'
x-i18n:
    generated_at: "2026-05-02T20:49:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta é a checklist dedicada para validação de atualização e plugins. O objetivo é
simples: provar que o pacote instalável consegue atualizar o estado real do usuário, reparar o estado
legado obsoleto por meio de `doctor` e ainda instalar, carregar, atualizar e desinstalar
plugins das fontes compatíveis.

Para o mapa mais amplo do executor de testes, consulte [Testes](/pt-BR/help/testing). Para chaves de provedores ao vivo
e suítes que acessam a rede, consulte [Testes ao vivo](/pt-BR/help/testing-live).

## O que protegemos

Os testes de atualização e plugins protegem estes contratos:

- Um tarball de pacote está completo, tem um `dist/postinstall-inventory.json` válido
  e não depende de arquivos descompactados do repositório.
- Um usuário consegue migrar de um pacote publicado mais antigo para o pacote candidato
  sem perder configuração, agentes, sessões, workspaces, allowlists de plugins ou
  configuração de canais.
- `openclaw doctor --fix --non-interactive` é responsável pelos caminhos de limpeza e reparo
  legados. A inicialização não deve acumular migrações de compatibilidade ocultas para estado
  obsoleto de plugins.
- Instalações de plugins funcionam a partir de diretórios locais, repositórios git, pacotes npm e o
  caminho de registro do ClawHub.
- Dependências npm de plugins são instaladas na raiz npm gerenciada, verificadas antes
  da confiança e removidas por meio do npm durante a desinstalação para que dependências elevadas não
  permaneçam.
- A atualização de plugins é estável quando nada mudou: registros de instalação, fonte
  resolvida, layout de dependências instaladas e estado habilitado permanecem intactos.

## Prova local durante o desenvolvimento

Comece de forma restrita:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para alterações de instalação, desinstalação, dependência ou inventário de pacote de plugins, também
execute os testes focados que cobrem o ponto editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes que qualquer faixa Docker de pacote consuma um tarball, prove o artefato do pacote:

```bash
pnpm release:check
```

`release:check` executa verificações de divergência de configuração/documentação/API, grava o inventário de distribuição
do pacote, executa `npm pack --dry-run`, rejeita arquivos empacotados proibidos, instala
o tarball em um prefixo temporário, executa postinstall e testa superficialmente os pontos de entrada de canais
incluídos.

## Faixas Docker

As faixas Docker são a prova em nível de produto. Elas instalam ou atualizam um pacote real
dentro de contêineres Linux e verificam o comportamento por meio de comandos de CLI,
inicialização do Gateway, sondagens HTTP, status RPC e estado do sistema de arquivos.

Use faixas focadas durante a iteração:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Faixas importantes:

- `test:docker:plugins` valida smoke de instalação de plugins, instalações de pastas locais,
  comportamento de pular atualização de pastas locais, pastas locais com dependências
  pré-instaladas, instalações de pacotes `file:`, instalações git com execução de CLI, atualizações de refs móveis
  do git, instalações de registro npm com dependências transitivas elevadas,
  no-ops de atualização npm, instalações de fixture local do ClawHub e no-ops de atualização,
  comportamento de atualização do marketplace e habilitação/inspeção do pacote Claude. Defina
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para manter o bloco do ClawHub hermético/offline.
- `test:docker:plugin-update` valida que um plugin instalado sem alterações
  não é reinstalado nem perde metadados de instalação durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala o tarball candidato sobre um fixture sujo
  de usuário antigo, executa atualização de pacote mais doctor não interativo, então inicia
  um Gateway de loopback e verifica a preservação do estado.
- `test:docker:published-upgrade-survivor` primeiro instala uma linha de base publicada,
  configura-a por meio de uma receita `openclaw config set` embutida, atualiza para o
  tarball candidato, executa doctor, verifica limpeza legada, inicia o Gateway e
  sonda `/healthz`, `/readyz` e status RPC.
- `test:docker:update-migration` é a faixa de atualização publicada com foco pesado em limpeza. Ela
  começa a partir de um estado de usuário configurado no estilo Discord/Telegram, executa o doctor
  da linha de base para que dependências de plugins configurados tenham chance de se materializar, semeia
  detritos legados de dependências de plugin para um plugin empacotado configurado, atualiza para
  o tarball candidato e exige que o doctor pós-atualização remova as raízes de dependências
  legadas.

Variantes úteis de sobrevivente de atualização publicada:

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
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` expande para todos os cenários em formato de
issues relatadas, incluindo a migração de instalação de plugin configurado.

A migração completa de atualização é intencionalmente separada da CI de lançamento completo. Use o
workflow manual `Update Migration` quando a pergunta de lançamento for "todas as versões estáveis
publicadas desde 2026.4.23 em diante conseguem atualizar para este candidato e
limpar detritos de dependências de plugins?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Aceitação de pacote

Aceitação de pacote é o gate de pacote nativo do GitHub. Ela resolve um pacote candidato
em um tarball `package-under-test`, registra versão e SHA-256, então
executa faixas Docker E2E reutilizáveis contra esse tarball exato. A referência do harness de workflow
é separada da referência de origem do pacote, de modo que a lógica de teste atual consiga validar
versões confiáveis mais antigas.

Fontes candidatas:

- `source=npm`: valide `openclaw@beta`, `openclaw@latest` ou uma versão publicada
  exata.
- `source=ref`: empacote uma branch, tag ou commit confiável com o harness atual
  selecionado.
- `source=url`: valide um tarball HTTPS com `package_sha256` obrigatório.
- `source=artifact`: reutilize um tarball enviado por outra execução do Actions.

Validação de lançamento completo usa `source=artifact` por padrão, criado a partir do
SHA de lançamento resolvido. Para prova pós-publicação, passe
`package_acceptance_package_spec=openclaw@YYYY.M.D` para que a mesma matriz de atualização
aponte para o pacote npm enviado.

As verificações de lançamento chamam Aceitação de pacote com o conjunto de pacote/atualização/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Elas também passam:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Isso mantém migração de pacote, alternância de canal de atualização, limpeza de dependências
obsoletas de plugins, cobertura offline de plugins, comportamento de atualização de plugins e QA de pacote
do Telegram no mesmo artefato resolvido.

`all-since-2026.4.23` é a amostra de atualização da CI de lançamento completo: toda versão estável publicada no npm de `2026.4.23` até `latest`. Para cobertura exaustiva de migração de atualização
publicada, use `all-since-2026.4.23` no workflow separado Update
Migration em vez da CI de lançamento completo. `release-history` permanece
disponível para amostragem manual mais ampla quando você também quiser a âncora legada
anterior à data.

Execute um perfil de pacote manualmente ao validar um candidato antes do lançamento:

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

Use `suite_profile=product` quando a pergunta de lançamento incluir canais MCP,
limpeza de cron/subagente, pesquisa na web OpenAI ou OpenWebUI. Use `suite_profile=full`
somente quando precisar de cobertura completa do caminho de lançamento Docker.

## Padrão de lançamento

Para candidatos a lançamento, a pilha de prova padrão é:

1. `pnpm check:changed` e `pnpm test:changed` para regressões em nível de código-fonte.
2. `pnpm release:check` para integridade do artefato do pacote.
3. Perfil `package` de Aceitação de pacote ou as faixas personalizadas de pacote
   de release-check para contratos de instalação/atualização/plugin.
4. Verificações de lançamento entre sistemas operacionais para comportamento específico de instalador,
   onboarding e plataforma.
5. Suítes ao vivo somente quando a superfície alterada tocar comportamento de provedor ou serviço
   hospedado.

Em máquinas de mantenedores, gates amplos e prova de produto Docker/pacote devem ser executados
no Testbox, a menos que se esteja fazendo prova local explicitamente.

## Compatibilidade legada

A leniência de compatibilidade é restrita e com prazo limitado:

- Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem tolerar
  lacunas de metadados de pacote já enviadas na Aceitação de pacote.
- O pacote `2026.4.26` publicado pode alertar sobre arquivos de carimbo de metadados
  de build local já enviados.
- Pacotes posteriores devem satisfazer os contratos modernos. As mesmas lacunas falham em vez de
  alertar ou pular.

Não adicione novas migrações de inicialização para esses formatos antigos. Adicione ou estenda um reparo
de doctor, então prove-o com `upgrade-survivor` ou `published-upgrade-survivor`.

## Adicionando cobertura

Ao alterar comportamento de atualização ou plugin, adicione cobertura na camada mais baixa que
possa falhar pelo motivo correto:

- Lógica pura de caminho ou metadados: teste unitário ao lado do código-fonte.
- Inventário de pacote ou comportamento de arquivo empacotado: teste `package-dist-inventory` ou de verificador
  de tarball.
- Comportamento de instalação/atualização da CLI: asserção ou fixture de faixa Docker.
- Comportamento de migração de versão publicada: cenário `published-upgrade-survivor`.
- Comportamento de registro/fonte de pacote: fixture `test:docker:plugins` ou servidor de fixture
  do ClawHub.
- Comportamento de layout ou limpeza de dependências: valide tanto a execução em runtime quanto o
  limite do sistema de arquivos. Dependências npm podem ser elevadas sob a raiz npm
  gerenciada, então os testes devem provar que a raiz é verificada/limpa em vez de assumir uma
  árvore `node_modules` local ao pacote.

Mantenha novos fixtures Docker herméticos por padrão. Use registros de fixture locais e
pacotes falsos, a menos que o objetivo do teste seja comportamento de registro ao vivo.

## Triagem de falhas

Comece pela identidade do artefato:

- Resumo `resolve_package` da Aceitação de pacote: fonte, versão, SHA-256 e
  nome do artefato.
- Artefatos Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logs de faixas e comandos de reexecução.
- Resumo de sobrevivente de atualização: `.artifacts/upgrade-survivor/summary.json`,
  incluindo versão da linha de base, versão candidata, cenário, tempos de fase e
  etapas da receita.

Prefira reexecutar a faixa exata que falhou com o mesmo artefato de pacote em vez de
reexecutar todo o guarda-chuva de lançamento.
