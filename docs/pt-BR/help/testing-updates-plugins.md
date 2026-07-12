---
read_when:
    - Alteração do comportamento de atualização, doctor, aceitação de pacotes ou instalação de plugins do OpenClaw
    - Preparação ou aprovação de uma versão candidata
    - Depuração de atualização de pacote, limpeza de dependências de plugins ou regressões na instalação de plugins
sidebarTitle: Update and plugin tests
summary: Como o OpenClaw valida caminhos de atualização, migrações de pacotes e o comportamento de instalação/atualização de plugins
title: 'Testes: atualizações e plugins'
x-i18n:
    generated_at: "2026-07-12T00:01:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Checklist de validação de atualização e plugins: comprove que o pacote instalável pode
atualizar o estado real do usuário, reparar estados legados obsoletos por meio do `doctor` e ainda
instalar, carregar, atualizar e desinstalar plugins de todas as fontes compatíveis.

Para o panorama mais amplo do executor de testes, consulte [Testes](/pt-BR/help/testing). Para chaves
de provedores reais e suítes que acessam a rede, consulte [Testes em ambiente real](/pt-BR/help/testing-live).

## O que protegemos

- Um tarball de pacote está completo, tem um `dist/postinstall-inventory.json`
  válido e não depende de arquivos descompactados do repositório.
- Um usuário pode migrar de um pacote publicado mais antigo para o pacote candidato
  sem perder configurações, agentes, sessões, espaços de trabalho, listas de permissões de plugins
  ou configurações de canais.
- `openclaw doctor --fix --non-interactive` é responsável pelos caminhos de limpeza e reparo
  legados. A inicialização não deve acumular migrações de compatibilidade ocultas para estados
  obsoletos de plugins.
- As instalações de plugins funcionam a partir de diretórios locais, repositórios git, pacotes npm e do
  caminho de registro do ClawHub.
- As dependências npm dos plugins são instaladas em um projeto npm gerenciado por plugin,
  são verificadas antes da concessão de confiança e são removidas por meio de `npm uninstall` durante
  a desinstalação do plugin, para que dependências içadas não permaneçam.
- A atualização de plugins não realiza nenhuma operação quando nada mudou: os registros de instalação, a fonte
  resolvida, o layout das dependências instaladas e o estado de ativação permanecem intactos.

## Comprovação local durante o desenvolvimento

Comece pelo escopo mais restrito:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para alterações na instalação, desinstalação ou dependências de plugins, ou no inventário de pacotes, também
execute os testes direcionados que abrangem a interface editada:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes que qualquer fluxo Docker de pacote consuma um tarball, valide o artefato do pacote:

```bash
pnpm release:check
```

`release:check` executa verificações de divergência de configuração/documentação/API (esquema de configuração, linha de base
da documentação de configuração, linha de base e exportações da API do SDK de plugins, versões/inventário de plugins),
grava o inventário de distribuição do pacote, executa `npm pack --dry-run`, rejeita arquivos empacotados
proibidos, instala o tarball em um prefixo temporário, executa o pós-instalação e
realiza testes rápidos nos pontos de entrada dos canais incluídos.

## Fluxos Docker

Os fluxos Docker são a comprovação no nível do produto. Eles instalam ou atualizam um
pacote real em contêineres Linux e verificam o comportamento por meio de comandos da CLI,
inicialização do Gateway, sondagens HTTP, status de RPC e estado do sistema de arquivos.

Use fluxos direcionados durante as iterações:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Fluxos importantes:

- `test:docker:plugins` abrange testes rápidos de instalação de plugins, instalações de pastas locais,
  comportamento de ignorar atualizações de pastas locais, pastas locais com
  dependências pré-instaladas, instalações de pacotes `file:`, instalações via git com execução da CLI, atualizações de
  referências móveis do git, instalações do registro npm com dependências transitivas
  içadas, atualizações npm sem operações, rejeição de metadados malformados de pacotes npm,
  instalações a partir de fixture local do ClawHub e atualizações sem operações, comportamento de atualização do marketplace
  e ativação/inspeção do pacote Claude. Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para
  manter o bloco do ClawHub hermético e sem acesso à rede.
- `test:docker:plugin-lifecycle-matrix` instala o pacote candidato em um contêiner
  vazio e conduz um plugin npm pelas etapas de instalação, inspeção, desativação, ativação,
  upgrade explícito, downgrade explícito e desinstalação após excluir o código do plugin.
  Ele registra métricas de RSS e CPU por fase.
- `test:docker:plugin-update` valida que um plugin instalado e inalterado não
  seja reinstalado nem perca metadados de instalação durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala o tarball candidato sobre uma fixture
  antiga e inconsistente de usuário, executa a atualização do pacote e o doctor não interativo e, em seguida, inicia
  um Gateway em local loopback e verifica a preservação do estado.
- `test:docker:published-upgrade-survivor` primeiro instala uma linha de base publicada,
  configura-a por meio de uma receita integrada de `openclaw config set`, atualiza-a para o
  tarball candidato, executa o doctor, verifica a limpeza legada, inicia o Gateway e
  sonda `/healthz`, `/readyz` e o status de RPC.
- `test:docker:update-restart-auth` instala o pacote candidato, inicia um
  Gateway gerenciado com autenticação por token, remove do ambiente a autenticação do Gateway do chamador para
  `openclaw update --yes --json` e exige que o comando de atualização candidato
  reinicie o Gateway antes das sondagens normais.
- `test:docker:update-migration` é o fluxo de atualização publicada com foco intensivo em limpeza. Ele
  parte de um estado de usuário configurado no estilo Discord/Telegram, executa o
  doctor da linha de base para permitir que as dependências de plugins configuradas sejam materializadas, cria
  resíduos legados de dependências de plugin para um plugin empacotado configurado, atualiza para
  o tarball candidato e exige que o doctor pós-atualização remova as raízes de
  dependências legadas.

Variantes úteis de sobrevivência à atualização publicada:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Cenários disponíveis: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`
e `versioned-runtime-deps`. Em execuções agregadas, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(alias `far-reaching`) expande para todos os cenários, incluindo a
migração de instalação de plugins configurados.

A migração completa de atualização é intencionalmente separada da CI de versão completa. Use o
fluxo manual `Update Migration` quando a questão da versão for "todas as
versões estáveis publicadas a partir de 2026.4.23 conseguem atualizar para este candidato e
limpar resíduos de dependências de plugins?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Aceitação de pacotes

A Aceitação de Pacotes é a barreira de pacote nativa do GitHub. Ela resolve um pacote
candidato em um tarball `package-under-test`, registra a versão e o SHA-256 e, em seguida,
executa fluxos Docker E2E reutilizáveis com esse tarball exato. A referência do mecanismo do
fluxo é separada da referência de origem do pacote, permitindo que a lógica de testes atual valide
versões confiáveis mais antigas.

Fontes de candidatos:

- `source=npm`: valide `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` ou uma versão publicada exata.
- `source=ref`: empacote uma ramificação, tag ou commit confiável com o mecanismo atual
  selecionado.
- `source=url`: valide um tarball HTTPS público com `package_sha256` obrigatório.
  Esse caminho rejeita credenciais em URLs, portas HTTPS não padrão, nomes de host ou
  resultados de DNS/IP privados/internos, espaços de IP de uso especial e redirecionamentos inseguros.
- `source=trusted-url`: valide um tarball HTTPS com `package_sha256`
  e `trusted_source_id` obrigatórios em relação à política pertencente aos mantenedores
  em `.github/package-trusted-sources.json`. Use isso para espelhos empresariais/privados
  em vez de enfraquecer `source=url` com uma opção de entrada que permita acesso privado.
  Quando configurada pela política, a autenticação Bearer usa o segredo fixo
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: reutilize um tarball enviado por outra execução do Actions.

A Validação Completa de Versão usa `source=artifact` por padrão, criado a partir do
SHA resolvido da versão. Para comprovação pós-publicação, passe
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH` para que a mesma matriz de atualização
tenha como alvo o pacote npm disponibilizado.

As verificações de versão chamam a Aceitação de Pacotes com o conjunto de pacote/atualização/reinicialização/plugins:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Quando o período de estabilização da versão está ativado (obrigatoriamente para `release_profile=stable` e
`full`), elas também passam:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Isso mantém a migração de pacotes, a troca de canal de atualização, a tolerância a plugins gerenciados
corrompidos, a limpeza de dependências obsoletas de plugins, a cobertura de plugins sem acesso à rede, o
comportamento de atualização de plugins e o controle de qualidade do pacote do Telegram no mesmo artefato resolvido, sem
fazer com que a barreira padrão de pacote da versão percorra todas as versões publicadas.

`last-stable-4` é resolvido para as quatro versões estáveis mais recentes do OpenClaw
publicadas no npm. A aceitação de pacote da versão fixa `2026.4.23` como o primeiro limite de
compatibilidade de atualização de plugins, `2026.5.2` como um limite de mudanças intensas na arquitetura de plugins e
`2026.4.15` como uma linha de base mais antiga de atualização publicada da série 2026.4.1x; o resolvedor
remove duplicatas de versões fixadas que já estejam entre as quatro mais recentes. Para uma cobertura exaustiva da
migração de atualizações publicadas, use `all-since-2026.4.23` no fluxo separado de Migração de
Atualização, em vez da CI de Versão Completa. `release-history` continua
disponível para uma amostragem manual mais ampla quando você também quiser a âncora legada
anterior à data.

Quando várias linhas de base de sobrevivência à atualização publicada são selecionadas, o fluxo
Docker reutilizável divide cada linha de base em sua própria tarefa direcionada do executor. Cada
fragmento de linha de base ainda executa o conjunto de cenários selecionado, mas os logs e artefatos permanecem
separados por linha de base, e o tempo total fica limitado pelo fragmento mais lento, em vez de uma única
tarefa serial extensa.

Execute manualmente um perfil de pacote ao validar um candidato antes da versão:

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

Para um canário extended-stable publicado, defina
`package_spec=openclaw@extended-stable`. A Aceitação de Pacotes resolve esse
seletor em um tarball exato antes da execução dos fluxos Docker.

Use `suite_profile=product` quando a questão da versão incluir canais MCP,
limpeza de cron/subagentes, pesquisa na web da OpenAI ou OpenWebUI. Use `suite_profile=full`
somente quando precisar de cobertura completa do caminho de versão no Docker.

## Padrão de versão

Para candidatos a versão, a pilha padrão de comprovação é:

1. `pnpm check:changed` e `pnpm test:changed` para regressões no nível do código-fonte.
2. `pnpm release:check` para a integridade do artefato do pacote.
3. O perfil `package` da Aceitação de Pacotes ou os fluxos personalizados de pacote das verificações de versão
   para contratos de instalação/atualização/reinicialização/plugins.
4. Verificações de versão entre sistemas operacionais para comportamentos de instalador, integração inicial e plataforma
   específicos do sistema operacional.
5. Suítes em ambiente real somente quando a superfície alterada afetar o comportamento do provedor ou do serviço
   hospedado.

Nas máquinas dos mantenedores, barreiras amplas e a comprovação de produto no Docker/pacote devem ser executadas
no Testbox, a menos que uma comprovação local esteja sendo feita explicitamente.

## Compatibilidade legada

A tolerância de compatibilidade é restrita e tem prazo limitado:

- Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem tolerar
  lacunas de metadados de pacote já disponibilizadas na Aceitação de Pacotes.
- O pacote publicado `2026.4.26` pode emitir avisos sobre arquivos de carimbo de metadados de
  compilação local já disponibilizados.
- Pacotes posteriores devem atender aos contratos modernos. As mesmas lacunas causam falha, em vez de
  aviso ou omissão.

Não adicione novas migrações de inicialização para esses formatos antigos. Adicione ou estenda um reparo do doctor
e, em seguida, comprove-o com `upgrade-survivor`, `published-upgrade-survivor` ou
`update-restart-auth` quando o comando de atualização for responsável pela reinicialização.

## Adição de cobertura

Ao alterar o comportamento de atualização ou de plugins, adicione cobertura na camada mais baixa que
possa falhar pelo motivo correto:

- Lógica pura de caminho ou metadados: teste unitário ao lado do código-fonte.
- Inventário do pacote ou comportamento dos arquivos empacotados: teste `package-dist-inventory` ou do verificador de tarball.
- Comportamento de instalação/atualização da CLI: asserção ou fixture da lane do Docker.
- Comportamento de migração de versão publicada: cenário `published-upgrade-survivor`.
- Comportamento de reinicialização controlado pela atualização: `update-restart-auth`.
- Comportamento da fonte de registro/pacote: fixture `test:docker:plugins` ou servidor de fixture do ClawHub.
- Comportamento do layout ou da limpeza de dependências: valide tanto a execução em tempo de execução quanto o limite do sistema de arquivos. As dependências npm podem ser içadas dentro do projeto npm gerenciado do plugin; portanto, os testes devem comprovar que esse projeto é verificado/limpo, em vez de presumir apenas a árvore `node_modules` local do pacote do plugin.

Mantenha as novas fixtures do Docker herméticas por padrão. Use registros de fixtures locais e pacotes falsos, a menos que o objetivo do teste seja o comportamento do registro em tempo real.

## Triagem de falhas

Comece pela identidade do artefato:

- Resumo `resolve_package` da Aceitação de Pacotes: origem, versão, SHA-256 e nome do artefato.
- Artefatos do Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs da lane e comandos de nova execução.
- Resumo de sobrevivência à atualização: `.artifacts/upgrade-survivor/summary.json`, incluindo versão de referência, versão candidata, cenário, tempos das fases e cobertura da receita de configuração.

Prefira executar novamente a lane exata que falhou com o mesmo artefato de pacote, em vez de executar novamente todo o conjunto de testes da versão.
