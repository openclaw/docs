---
read_when:
    - Alteração do comportamento de atualização, doctor, aceitação de pacote ou instalação de Plugin do OpenClaw
    - Preparando ou aprovando uma versão candidata a lançamento
    - Depuração de regressões de atualização de pacotes, limpeza de dependências de Plugin ou instalação de Plugin
sidebarTitle: Update and plugin tests
summary: Como o OpenClaw valida caminhos de atualização, migrações de pacote e comportamento de instalação/atualização de Plugin
title: 'Testes: atualizações e plugins'
x-i18n:
    generated_at: "2026-05-06T05:58:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Esta é a lista de verificação dedicada para validação de atualizações e plugins. O objetivo é simples: provar que o pacote instalável consegue atualizar o estado real do usuário, reparar estado legado obsoleto por meio de `doctor` e ainda instalar, carregar, atualizar e desinstalar plugins a partir das origens compatíveis.

Para o mapa mais amplo do executor de testes, consulte [Testes](/pt-BR/help/testing). Para chaves de provedores ao vivo e suítes que tocam a rede, consulte [Testes ao vivo](/pt-BR/help/testing-live).

## O que protegemos

Os testes de atualização e plugin protegem estes contratos:

- Um tarball de pacote está completo, tem um `dist/postinstall-inventory.json` válido e não depende de arquivos do repositório descompactados.
- Um usuário pode migrar de um pacote publicado mais antigo para o pacote candidato sem perder configuração, agentes, sessões, workspaces, listas de permissões de plugins ou configuração de canal.
- `openclaw doctor --fix --non-interactive` é responsável por caminhos de limpeza e reparo legados. A inicialização não deve ganhar migrações de compatibilidade ocultas para estado obsoleto de plugin.
- Instalações de plugins funcionam a partir de diretórios locais, repositórios git, pacotes npm e o caminho do registro ClawHub.
- Dependências npm de plugins são instaladas na raiz npm gerenciada, verificadas antes da confiança e removidas por meio do npm durante a desinstalação para que dependências içadas não permaneçam.
- A atualização de plugin é estável quando nada mudou: registros de instalação, origem resolvida, layout de dependências instaladas e estado habilitado permanecem intactos.

## Prova local durante o desenvolvimento

Comece de forma restrita:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Para alterações em instalação, desinstalação, dependências ou inventário de pacote de plugins, execute também os testes focados que cobrem a interface editada:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Antes que qualquer faixa Docker de pacote consuma um tarball, prove o artefato do pacote:

```bash
pnpm release:check
```

`release:check` executa verificações de desvio de configuração/docs/API, grava o inventário de distribuição do pacote, executa `npm pack --dry-run`, rejeita arquivos empacotados proibidos, instala o tarball em um prefixo temporário, executa postinstall e faz smoke test dos pontos de entrada dos canais empacotados.

## Faixas Docker

As faixas Docker são a prova em nível de produto. Elas instalam ou atualizam um pacote real dentro de contêineres Linux e validam o comportamento por meio de comandos da CLI, inicialização do Gateway, sondagens HTTP, status RPC e estado do sistema de arquivos.

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

- `test:docker:plugins` valida smoke test de instalação de plugin, instalações de pasta local, comportamento de pular atualização de pasta local, pastas locais com dependências pré-instaladas, instalações de pacote `file:`, instalações git com execução da CLI, atualizações git com referência móvel, instalações de registro npm com dependências transitivas içadas, no-ops de atualização npm, instalações de fixture local ClawHub e no-ops de atualização, comportamento de atualização de marketplace e habilitação/inspeção do pacote Claude. Defina `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` para manter o bloco ClawHub hermético/offline.
- `test:docker:plugin-lifecycle-matrix` instala o pacote candidato em um contêiner limpo, executa um plugin npm por instalação, inspeção, desabilitação, habilitação, upgrade explícito, downgrade explícito e desinstalação depois de excluir o código do plugin. Ela registra métricas de RSS e CPU para cada fase.
- `test:docker:plugin-update` valida que um plugin instalado sem alterações não é reinstalado nem perde metadados de instalação durante `openclaw plugins update`.
- `test:docker:upgrade-survivor` instala o tarball candidato sobre uma fixture suja de usuário antigo, executa atualização de pacote mais doctor não interativo, depois inicia um Gateway de loopback e verifica a preservação de estado.
- `test:docker:published-upgrade-survivor` primeiro instala uma baseline publicada, configura-a por meio de uma receita `openclaw config set` embutida, atualiza-a para o tarball candidato, executa doctor, verifica limpeza legada, inicia o Gateway e sonda `/healthz`, `/readyz` e status RPC.
- `test:docker:update-restart-auth` instala o pacote candidato, inicia um Gateway gerenciado com autenticação por token, remove do ambiente do chamador a autenticação do gateway para `openclaw update --yes --json` e exige que o comando de atualização candidato reinicie o Gateway antes das sondagens normais.
- `test:docker:update-migration` é a faixa de atualização publicada com limpeza pesada. Ela começa de um estado de usuário configurado no estilo Discord/Telegram, executa doctor da baseline para que dependências de plugin configuradas tenham chance de se materializar, semeia resíduos de dependência de plugin legado para um plugin empacotado configurado, atualiza para o tarball candidato e exige que o doctor pós-atualização remova as raízes de dependência legadas.

Variantes úteis de sobrevivente de upgrade publicado:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Os cenários disponíveis são `base`, `feishu-channel`, `bootstrap-persona`, `plugin-deps-cleanup`, `configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path` e `versioned-runtime-deps`. Em execuções agregadas, `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` expande para todos os cenários com formato de problema relatado, incluindo a migração de instalação de plugin configurado.

A migração completa de atualização é intencionalmente separada do Full Release CI. Use o workflow manual `Update Migration` quando a pergunta de release for "todas as releases estáveis publicadas de 2026.4.23 em diante conseguem atualizar para este candidato e limpar resíduos de dependências de plugin?":

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Package Acceptance

Package Acceptance é o gate de pacote nativo do GitHub. Ele resolve um pacote candidato em um tarball `package-under-test`, registra versão e SHA-256, depois executa faixas Docker E2E reutilizáveis contra exatamente esse tarball. A ref do harness do workflow é separada da ref da origem do pacote, então a lógica de teste atual pode validar releases confiáveis mais antigas.

Origens candidatas:

- `source=npm`: valida `openclaw@beta`, `openclaw@latest` ou uma versão publicada exata.
- `source=ref`: empacota uma branch, tag ou commit confiável com o harness atual selecionado.
- `source=url`: valida um tarball HTTPS com `package_sha256` obrigatório.
- `source=artifact`: reutiliza um tarball enviado por outra execução do Actions.

Full Release Validation usa `source=artifact` por padrão, criado a partir do SHA de release resolvido. Para prova pós-publicação, passe `package_acceptance_package_spec=openclaw@YYYY.M.D` para que a mesma matriz de upgrade mire o pacote npm entregue.

As verificações de release chamam Package Acceptance com o conjunto de pacote/atualização/reinicialização/plugin:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Quando o soak de release está habilitado, elas também passam:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Isso mantém migração de pacote, alternância de canal de atualização, tolerância a plugin gerenciado corrompido, limpeza de dependências obsoletas de plugin, cobertura de plugin offline, comportamento de atualização de plugin e QA de pacote Telegram no mesmo artefato resolvido sem fazer o gate padrão de pacote de release percorrer todas as releases publicadas.

`last-stable-4` resolve para as quatro releases OpenClaw estáveis mais recentes publicadas no npm. A aceitação de pacote de release fixa `2026.4.23` como a primeira fronteira de compatibilidade de atualização de plugin, `2026.5.2` como uma fronteira de churn de arquitetura de plugin e `2026.4.15` como uma baseline mais antiga de atualização publicada de 2026.4.1x; o resolvedor remove duplicatas de pins que já estão entre as quatro mais recentes. Para cobertura exaustiva de migração de atualização publicada, use `all-since-2026.4.23` no workflow Update Migration separado em vez do Full Release CI. `release-history` continua disponível para amostragem manual mais ampla quando você também quiser a âncora legada anterior à data.

Quando várias baselines de sobrevivente de upgrade publicado são selecionadas, o workflow Docker reutilizável divide cada baseline em seu próprio job de executor direcionado. Cada shard de baseline ainda executa o conjunto de cenários selecionado, mas logs e artefatos ficam por baseline e o tempo de execução fica limitado ao shard mais lento em vez de um grande job serial.

Execute manualmente um perfil de pacote ao validar um candidato antes da release:

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

Use `suite_profile=product` quando a pergunta de release incluir canais MCP, limpeza de cron/subagente, pesquisa web OpenAI ou OpenWebUI. Use `suite_profile=full` somente quando precisar de cobertura Docker completa do caminho de release.

## Padrão de release

Para candidatos de release, a pilha de prova padrão é:

1. `pnpm check:changed` e `pnpm test:changed` para regressões em nível de código-fonte.
2. `pnpm release:check` para integridade do artefato de pacote.
3. Perfil `package` do Package Acceptance ou as faixas de pacote personalizadas de release-check para contratos de instalação/atualização/reinicialização/plugin.
4. Verificações de release entre sistemas operacionais para instalador, onboarding e comportamento de plataforma específicos de SO.
5. Suítes ao vivo somente quando a superfície alterada toca comportamento de provedor ou serviço hospedado.

Em máquinas de mantenedores, gates amplos e prova Docker/pacote de produto devem rodar no Testbox, salvo quando se estiver fazendo prova local explicitamente.

## Compatibilidade legada

A tolerância de compatibilidade é estreita e com prazo definido:

- Pacotes até `2026.4.25`, incluindo `2026.4.25-beta.*`, podem tolerar lacunas de metadados de pacote já entregues no Package Acceptance.
- O pacote `2026.4.26` publicado pode avisar sobre arquivos de carimbo de metadados de build local já entregues.
- Pacotes posteriores devem satisfazer os contratos modernos. As mesmas lacunas falham em vez de avisar ou pular.

Não adicione novas migrações de inicialização para esses formatos antigos. Adicione ou estenda um reparo de doctor, depois prove-o com `upgrade-survivor`, `published-upgrade-survivor` ou `update-restart-auth` quando o comando de atualização for responsável pela reinicialização.

## Adicionando cobertura

Ao alterar comportamento de atualização ou plugin, adicione cobertura na camada mais baixa que possa falhar pelo motivo correto:

- Lógica pura de caminho ou metadados: teste unitário ao lado da origem.
- Comportamento de inventário de pacote ou arquivo empacotado: teste `package-dist-inventory` ou verificador de tarball.
- Comportamento de instalação/atualização da CLI: asserção ou fixture de faixa Docker.
- Comportamento de migração de release publicada: cenário `published-upgrade-survivor`.
- Comportamento de reinicialização pertencente à atualização: `update-restart-auth`.
- Comportamento de registro/origem de pacote: fixture `test:docker:plugins` ou servidor de fixture ClawHub.
- Comportamento de layout ou limpeza de dependências: valide tanto a execução em runtime quanto a fronteira do sistema de arquivos. Dependências npm podem ser içadas sob a raiz npm gerenciada, então os testes devem provar que a raiz é verificada/limpa em vez de assumir uma árvore `node_modules` local ao pacote.

Mantenha novas fixtures Docker herméticas por padrão. Use registros de fixture locais e pacotes falsos, a menos que o objetivo do teste seja comportamento de registro ao vivo.

## Triagem de falhas

Comece pela identidade do artefato:

- Resumo de Aceitação de Pacote `resolve_package`: origem, versão, SHA-256 e
  nome do artefato.
- Artefatos do Docker: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, logs da lane e comandos de nova execução.
- Resumo do sobrevivente de upgrade: `.artifacts/upgrade-survivor/summary.json`,
  incluindo versão de baseline, versão candidata, cenário, tempos das fases e
  etapas da receita.

Prefira executar novamente a lane exata que falhou com o mesmo artefato de pacote em vez de
executar novamente todo o guarda-chuva de lançamento.
