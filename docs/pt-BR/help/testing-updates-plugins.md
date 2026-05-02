---
read_when:
    - Alterar o comportamento de atualização, doctor, aceitação de pacote ou instalação de plugin do OpenClaw
    - Preparando ou aprovando um candidato a lançamento
    - Depuração de regressões de atualização de pacote, limpeza de dependências de Plugin ou instalação de Plugin
sidebarTitle: Update and plugin tests
summary: Como o OpenClaw valida caminhos de atualização, migrações de pacote e o comportamento de instalação/atualização de Plugin
title: 'Testes: atualizações e plugins'
x-i18n:
    generated_at: "2026-05-02T05:49:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta é a checklist dedicada para validação de atualização e plugins. O objetivo é
simples: provar que o pacote instalável consegue atualizar o estado real do usuário, reparar o estado
legado obsoleto por meio de `doctor` e ainda instalar, carregar, atualizar e desinstalar
plugins das origens compatíveis.

Para o mapa mais amplo do executor de testes, consulte [Testes](/pt-BR/help/testing). Para chaves de provedores
ao vivo e suítes que acessam a rede, consulte [Testes ao vivo](/pt-BR/help/testing-live).

## O que protegemos

Os testes de atualização e plugins protegem estes contratos:

- Um tarball de pacote está completo, tem um `dist/postinstall-inventory.json` válido
  e não depende de arquivos descompactados do repositório.
- Um usuário consegue migrar de um pacote publicado mais antigo para o pacote candidato
  sem perder configuração, agentes, sessões, workspaces, allowlists de plugins ou
  configuração de canais.
- `openclaw doctor --fix --non-interactive` é responsável pelos caminhos de limpeza e reparo
  legados. A inicialização não deve ganhar migrações de compatibilidade ocultas para estado
  obsoleto de plugins.
- Instalações de plugins funcionam a partir de diretórios locais, repositórios git, pacotes npm e do
  caminho do registro ClawHub.
- Dependências npm de plugins são instaladas na raiz npm gerenciada, escaneadas antes
  da confiança e removidas por meio do npm durante a desinstalação para que dependências içadas não
  permaneçam.
- A atualização de plugins é estável quando nada mudou: registros de instalação, origem
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

Antes que qualquer lane Docker de pacote consuma um tarball, prove o artefato do pacote:

```bash
pnpm release:check
```

`release:check` executa verificações de desvio de configuração/docs/API, grava o inventário de dist
do pacote, executa `npm pack --dry-run`, rejeita arquivos empacotados proibidos, instala
o tarball em um prefixo temporário, executa postinstall e faz smoke dos entrypoints
dos canais empacotados.

## Lanes Docker

As lanes Docker são a prova em nível de produto. Elas instalam ou atualizam um pacote real
dentro de contêineres Linux e verificam o comportamento por meio de comandos CLI,
inicialização do Gateway, probes HTTP, status RPC e estado do sistema de arquivos.

Use lanes focadas durante a iteração:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Lanes importantes:

- `test:docker:plugins` valida smoke de instalação de plugins, instalações de pastas locais,
  comportamento de ignorar atualização de pasta local, pastas locais com dependências
  pré-instaladas, instalações de pacotes `file:`, instalações git com execução pela CLI, atualizações
  de referência móvel git, instalações de registro npm com dependências transitivas içadas,
  no-ops de atualização npm, instalações de fixture local do ClawHub e no-ops de atualização,
  comportamento de atualização do marketplace e habilitação/inspeção do pacote Claude. Defina
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para manter o bloco ClawHub hermético/offline.
- `test:docker:plugin-update` valida que um plugin instalado sem alterações
  não é reinstalado nem perde metadados de instalação durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala o tarball candidato sobre uma fixture suja
  de usuário antigo, executa atualização de pacote mais doctor não interativo e então inicia
  um Gateway em loopback e verifica a preservação de estado.
- `test:docker:published-upgrade-survivor` primeiro instala uma baseline publicada,
  configura-a por meio de uma receita `openclaw config set` embutida, atualiza-a para o
  tarball candidato, executa doctor, verifica a limpeza legada, inicia o Gateway e
  consulta `/healthz`, `/readyz` e status RPC.
- `test:docker:update-migration` é a lane de atualização publicada com foco intenso em limpeza. Ela
  começa a partir de um estado de usuário configurado no estilo Discord/Telegram, executa o doctor
  da baseline para que dependências de plugins configurados tenham chance de se materializar, semeia
  resíduos legados de dependências de plugin para um plugin empacotado configurado, atualiza para
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
`plugin-deps-cleanup`, `tilde-log-path` e `versioned-runtime-deps`. Em execuções agregadas,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` expande para todos os cenários
no formato de problemas reportados.

A migração completa de atualização é intencionalmente separada do Full Release CI. Use o
workflow manual `Update Migration` quando a pergunta de release for "toda
versão estável publicada a partir de 2026.4.23 consegue atualizar para este candidato e
limpar resíduos de dependências de plugins?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance é o gate de pacote nativo do GitHub. Ele resolve um pacote candidato
em um tarball `package-under-test`, registra versão e SHA-256 e então
executa lanes Docker E2E reutilizáveis contra esse tarball exato. O ref do harness
do workflow é separado do ref da origem do pacote, então a lógica de teste atual pode validar
releases confiáveis mais antigos.

Origens candidatas:

- `source=npm`: validar `openclaw@beta`, `openclaw@latest` ou uma versão
  publicada exata.
- `source=ref`: empacotar uma branch, tag ou commit confiável com o harness atual
  selecionado.
- `source=url`: validar um tarball HTTPS com `package_sha256` obrigatório.
- `source=artifact`: reutilizar um tarball enviado por outra execução do Actions.

As verificações de release chamam Package Acceptance com o conjunto de pacote/atualização/plugin:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Elas também passam:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Isso mantém migração de pacote, alternância de canal de atualização, limpeza de dependências
obsoletas de plugins, cobertura offline de plugins, comportamento de atualização de plugins e QA de pacote
do Telegram no mesmo artefato resolvido.

`release-history` é uma amostra limitada de verificação de release: as seis versões estáveis mais recentes,
`2026.4.23` e uma âncora mais antiga anterior à data. Para cobertura exaustiva de migração
de atualização publicada, use `all-since-2026.4.23` no workflow Update Migration
separado em vez do Full Release CI.

Execute manualmente um perfil de pacote ao validar um candidato antes do release:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Use `suite_profile=product` quando a pergunta de release incluir canais MCP,
limpeza de cron/subagent, pesquisa web da OpenAI ou OpenWebUI. Use `suite_profile=full`
somente quando precisar de cobertura completa do caminho de release Docker.

## Padrão de release

Para candidatos a release, a pilha padrão de prova é:

1. `pnpm check:changed` e `pnpm test:changed` para regressões em nível de código-fonte.
2. `pnpm release:check` para integridade do artefato de pacote.
3. Perfil `package` do Package Acceptance ou as lanes de pacote personalizadas de verificação de release
   para contratos de instalação/atualização/plugin.
4. Verificações de release Cross-OS para instalador, onboarding e comportamento de plataforma
   específicos de SO.
5. Suítes ao vivo somente quando a superfície alterada toca comportamento de provedor ou serviço
   hospedado.

Em máquinas de mantenedores, gates amplos e prova de produto Docker/pacote devem executar
no Testbox, salvo prova local explícita.

## Compatibilidade legada

A leniência de compatibilidade é estreita e limitada no tempo:

- Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem tolerar
  lacunas de metadados de pacote já entregues no Package Acceptance.
- O pacote publicado `2026.4.26` pode alertar para arquivos de carimbo de metadados de build local
  já entregues.
- Pacotes posteriores devem satisfazer contratos modernos. As mesmas lacunas falham em vez de
  alertar ou serem ignoradas.

Não adicione novas migrações de inicialização para esses formatos antigos. Adicione ou estenda um reparo
de doctor e então prove-o com `upgrade-survivor` ou `published-upgrade-survivor`.

## Adicionando cobertura

Ao alterar comportamento de atualização ou plugin, adicione cobertura na camada mais baixa que
possa falhar pelo motivo correto:

- Lógica pura de caminho ou metadados: teste unitário ao lado do código-fonte.
- Inventário de pacote ou comportamento de arquivos empacotados: `package-dist-inventory` ou teste
  de verificador de tarball.
- Comportamento de instalação/atualização pela CLI: asserção ou fixture de lane Docker.
- Comportamento de migração de release publicado: cenário `published-upgrade-survivor`.
- Comportamento de origem de registro/pacote: fixture `test:docker:plugins` ou servidor
  de fixture ClawHub.
- Comportamento de layout ou limpeza de dependências: verifique tanto a execução em runtime quanto o
  limite do sistema de arquivos. Dependências npm podem ser içadas sob a raiz npm gerenciada,
  então os testes devem provar que a raiz é escaneada/limpa em vez de assumir uma árvore
  `node_modules` local ao pacote.

Mantenha novas fixtures Docker herméticas por padrão. Use registros locais de fixture e
pacotes falsos, salvo quando o ponto do teste for comportamento de registro ao vivo.

## Triagem de falhas

Comece pela identidade do artefato:

- Resumo `resolve_package` do Package Acceptance: origem, versão, SHA-256 e
  nome do artefato.
- Artefatos Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logs de lane e comandos de reexecução.
- Resumo de upgrade survivor: `.artifacts/upgrade-survivor/summary.json`,
  incluindo versão baseline, versão candidata, cenário, tempos de fase e
  etapas da receita.

Prefira reexecutar a lane exata que falhou com o mesmo artefato de pacote em vez de
reexecutar todo o guarda-chuva de release.
