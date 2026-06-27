---
read_when:
    - Alteração do comportamento de atualização, doctor, aceitação de pacotes ou instalação de plugin do OpenClaw
    - Preparando ou aprovando uma versão candidata a lançamento
    - Depuração de atualização de pacote, limpeza de dependências de Plugin ou regressões de instalação de Plugin
sidebarTitle: Update and plugin tests
summary: Como o OpenClaw valida caminhos de atualização, migrações de pacotes e o comportamento de instalação/atualização de plugins
title: 'Testing: atualizações e plugins'
x-i18n:
    generated_at: "2026-06-27T17:36:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta é a lista de verificação dedicada para validação de atualização e Plugins. O objetivo é
simples: provar que o pacote instalável consegue atualizar o estado real do usuário, reparar o estado
legado obsoleto por meio de `doctor` e ainda instalar, carregar, atualizar e desinstalar
Plugins das fontes compatíveis.

Para o mapa mais amplo do executor de testes, consulte [Testes](/pt-BR/help/testing). Para chaves de provedores
ao vivo e suítes que acessam a rede, consulte [Testes ao vivo](/pt-BR/help/testing-live).

## O que protegemos

Os testes de atualização e Plugins protegem estes contratos:

- Um tarball de pacote está completo, tem um `dist/postinstall-inventory.json` válido
  e não depende de arquivos do repositório desempacotados.
- Um usuário pode migrar de um pacote publicado mais antigo para o pacote candidato
  sem perder configuração, agentes, sessões, workspaces, allowlists de Plugins ou
  configuração de canais.
- `openclaw doctor --fix --non-interactive` é responsável por caminhos legados de limpeza e reparo.
  A inicialização não deve ganhar migrações de compatibilidade ocultas para estado
  obsoleto de Plugins.
- Instalações de Plugins funcionam a partir de diretórios locais, repositórios git, pacotes npm e o
  caminho de registro do ClawHub.
- Dependências npm de Plugins são instaladas em um projeto npm gerenciado por Plugin,
  verificadas antes da confiança e removidas por meio do npm durante a desinstalação para que
  dependências içadas não permaneçam.
- A atualização de Plugins é estável quando nada mudou: registros de instalação, fonte
  resolvida, layout de dependências instaladas e estado habilitado permanecem intactos.

## Prova local durante o desenvolvimento

Comece de forma estreita:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para alterações de instalação, desinstalação, dependências ou inventário de pacote de Plugins, também
execute os testes focados que cobrem o ponto editado:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes que qualquer faixa Docker de pacote consuma um tarball, prove o artefato do pacote:

```bash
pnpm release:check
```

`release:check` executa verificações de divergência de configuração/docs/API, grava o inventário
dist do pacote, executa `npm pack --dry-run`, rejeita arquivos empacotados proibidos, instala
o tarball em um prefixo temporário, executa o postinstall e faz smoke test dos entrypoints
dos canais agrupados.

## Faixas Docker

As faixas Docker são a prova em nível de produto. Elas instalam ou atualizam um pacote real
dentro de contêineres Linux e validam o comportamento por meio de comandos CLI,
inicialização do Gateway, probes HTTP, status RPC e estado do sistema de arquivos.

Use faixas focadas durante a iteração:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Faixas importantes:

- `test:docker:plugins` valida smoke de instalação de Plugins, instalações de pastas locais,
  comportamento de pular atualização de pastas locais, pastas locais com
  dependências pré-instaladas, instalações de pacotes `file:`, instalações git com execução de CLI, atualizações
  de refs móveis em git, instalações de registro npm com dependências transitivas içadas,
  no-ops de atualização npm, rejeição de metadados malformados de pacotes npm,
  instalações de fixture local do ClawHub e no-ops de atualização, comportamento de atualização do marketplace
  e habilitação/inspeção do pacote Claude. Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para
  manter o bloco ClawHub hermético/offline.
- `test:docker:plugin-lifecycle-matrix` instala o pacote candidato em um contêiner vazio,
  executa um Plugin npm por instalação, inspeção, desabilitação, habilitação,
  upgrade explícito, downgrade explícito e desinstalação após excluir o código do Plugin.
  Ele registra métricas de RSS e CPU para cada fase.
- `test:docker:plugin-update` valida que um Plugin instalado inalterado
  não reinstala nem perde metadados de instalação durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala o tarball candidato sobre uma fixture suja
  de usuário antigo, executa atualização de pacote mais doctor não interativo, depois inicia
  um Gateway local loopback e verifica a preservação do estado.
- `test:docker:published-upgrade-survivor` primeiro instala uma linha de base publicada,
  configura-a por meio de uma receita `openclaw config set` embutida, atualiza-a para o
  tarball candidato, executa doctor, verifica a limpeza legada, inicia o Gateway e
  sonda `/healthz`, `/readyz` e status RPC.
- `test:docker:update-restart-auth` instala o pacote candidato, inicia um Gateway
  gerenciado com autenticação por token, remove as envs de autenticação de gateway do chamador para
  `openclaw update --yes --json` e exige que o comando de atualização candidato
  reinicie o Gateway antes dos probes normais.
- `test:docker:update-migration` é a faixa de atualização publicada com foco intenso em limpeza. Ela
  começa a partir de um estado de usuário configurado no estilo Discord/Telegram, executa o doctor
  de linha de base para que dependências de Plugins configurados tenham chance de se materializar, semeia
  resíduos legados de dependências de Plugins para um Plugin empacotado configurado, atualiza para
  o tarball candidato e exige que o doctor pós-atualização remova as raízes legadas
  de dependências.

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
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` e `versioned-runtime-deps`. Em execuções agregadas,
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` expande para todos os cenários
com formato de problemas relatados, incluindo a migração de instalação de Plugin configurado.

A migração completa de atualização é intencionalmente separada do CI de lançamento completo. Use o
workflow manual `Update Migration` quando a pergunta de lançamento for "toda
versão estável publicada a partir de 2026.4.23 consegue atualizar para este candidato e
limpar resíduos de dependências de Plugins?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Aceitação de Pacote

A Aceitação de Pacote é o gate de pacote nativo do GitHub. Ela resolve um pacote
candidato em um tarball `package-under-test`, registra versão e SHA-256, depois
executa faixas Docker E2E reutilizáveis contra esse tarball exato. A ref do harness
do workflow é separada da ref de origem do pacote, para que a lógica de teste atual possa validar
lançamentos confiáveis mais antigos.

Fontes candidatas:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` ou uma versão
  publicada exata.
- `source=ref`: empacota uma branch, tag ou commit confiável com o harness atual
  selecionado.
- `source=url`: valida um tarball HTTPS público com `package_sha256` obrigatório.
  Este caminho rejeita credenciais de URL, portas HTTPS não padrão, hostnames ou resultados
  DNS/IP privados/internos, espaço de IP de uso especial e redirecionamentos inseguros.
- `source=trusted-url`: valida um tarball HTTPS com `package_sha256` e
  `trusted_source_id` obrigatórios contra a política mantida pelos mantenedores
  em `.github/package-trusted-sources.json`. Use isto para mirrors empresariais/privados
  em vez de enfraquecer `source=url` com uma opção de entrada para permitir privado.
  A autenticação bearer, quando configurada por política, usa o segredo fixo
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: reutiliza um tarball enviado por outra execução de Actions.

A validação completa de lançamento usa `source=artifact` por padrão, criada a partir do
SHA de lançamento resolvido. Para prova pós-publicação, passe
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` para que a mesma matriz de upgrade
aponte para o pacote npm enviado.

As verificações de lançamento chamam a Aceitação de Pacote com o conjunto package/update/restart/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Quando o soak de lançamento está habilitado, elas também passam:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Isso mantém migração de pacote, troca de canal de atualização, tolerância a Plugin gerenciado
corrompido, limpeza de dependências obsoletas de Plugins, cobertura offline de Plugins,
comportamento de atualização de Plugins e QA de pacote do Telegram no mesmo artefato resolvido sem
fazer o gate padrão de pacote de lançamento percorrer todas as versões publicadas.

`last-stable-4` resolve para as quatro versões estáveis mais recentes do OpenClaw
publicadas no npm. A aceitação de pacote de lançamento fixa `2026.4.23` como o primeiro limite
de compatibilidade de atualização de Plugins, `2026.5.2` como um limite de rotatividade da arquitetura
de Plugins e `2026.4.15` como uma linha de base mais antiga de atualização publicada de 2026.4.1x; o resolvedor
deduplica pins que já estão nas quatro mais recentes. Para cobertura exaustiva de migração
de atualização publicada, use `all-since-2026.4.23` no workflow Update Migration
separado, em vez do CI de lançamento completo. `release-history` permanece
disponível para amostragem manual mais ampla quando você também quiser a âncora legada
anterior à data.

Quando várias linhas de base de survivor de upgrade publicado são selecionadas, o workflow Docker
reutilizável fragmenta cada linha de base em seu próprio job de runner direcionado. Cada
fragmento de linha de base ainda executa o conjunto de cenários selecionado, mas logs e artefatos ficam
por linha de base e o tempo total é limitado pelo fragmento mais lento, em vez de um grande
job serial.

Execute um perfil de pacote manualmente ao validar um candidato antes do lançamento:

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

Use `suite_profile=product` quando a pergunta de lançamento incluir canais MCP,
limpeza de cron/subagentes, busca web da OpenAI ou OpenWebUI. Use `suite_profile=full`
somente quando precisar de cobertura Docker completa do caminho de lançamento.

## Padrão de lançamento

Para candidatos a lançamento, a pilha de prova padrão é:

1. `pnpm check:changed` e `pnpm test:changed` para regressões no nível do código-fonte.
2. `pnpm release:check` para integridade do artefato de pacote.
3. Perfil `package` da Aceitação de Pacote ou as faixas de pacote customizadas de release-check
   para contratos de instalação/atualização/reinicialização/Plugins.
4. Verificações de lançamento entre sistemas operacionais para comportamento específico de instalador, onboarding e plataforma
   por SO.
5. Suítes ao vivo somente quando a superfície alterada toca comportamento de provedor ou serviço hospedado.

Em máquinas de mantenedores, gates amplos e prova de produto Docker/pacote devem executar
no Testbox, a menos que a prova local esteja sendo feita explicitamente.

## Compatibilidade legada

A tolerância de compatibilidade é estreita e limitada no tempo:

- Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem tolerar
  lacunas de metadados de pacote já enviadas na Aceitação de Pacote.
- O pacote `2026.4.26` publicado pode avisar sobre arquivos de carimbo de metadados
  de build local já enviados.
- Pacotes posteriores devem satisfazer os contratos modernos. As mesmas lacunas falham em vez de
  avisar ou pular.

Não adicione novas migrações de inicialização para esses formatos antigos. Adicione ou estenda um reparo
de doctor, depois prove-o com `upgrade-survivor`, `published-upgrade-survivor` ou
`update-restart-auth` quando o comando de atualização for responsável pela reinicialização.

## Adicionando cobertura

Ao alterar comportamento de atualização ou Plugins, adicione cobertura na camada mais baixa que
possa falhar pelo motivo correto:

- Lógica pura de caminho ou metadados: teste unitário junto ao código-fonte.
- Inventário de pacote ou comportamento de arquivos empacotados: teste
  `package-dist-inventory` ou verificador de tarball.
- Comportamento de instalação/atualização da CLI: asserção da lane do Docker ou fixture.
- Comportamento de migração de versão publicada: cenário `published-upgrade-survivor`.
- Comportamento de reinicialização controlado por atualização: `update-restart-auth`.
- Comportamento de fonte de registro/pacote: fixture `test:docker:plugins` ou servidor
  de fixture do ClawHub.
- Comportamento de layout ou limpeza de dependências: valide tanto a execução em runtime
  quanto o limite do sistema de arquivos. Dependências npm podem ser içadas dentro do
  projeto npm gerenciado do Plugin, então os testes devem provar que esse projeto é verificado/limpo
  em vez de pressupor apenas a árvore `node_modules` local ao pacote do Plugin.

Mantenha novos fixtures do Docker herméticos por padrão. Use registros de fixture locais e
pacotes falsos, a menos que o objetivo do teste seja comportamento de registro ao vivo.

## Triagem de falhas

Comece pela identidade do artefato:

- Resumo `resolve_package` da Aceitação de Pacote: fonte, versão, SHA-256 e
  nome do artefato.
- Artefatos do Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logs da lane e comandos de reexecução.
- Resumo do sobrevivente de upgrade: `.artifacts/upgrade-survivor/summary.json`,
  incluindo versão de baseline, versão candidata, cenário, tempos das fases e
  etapas da receita.

Prefira reexecutar a lane exata que falhou com o mesmo artefato de pacote em vez de
reexecutar todo o guarda-chuva de release.
