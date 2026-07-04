---
read_when:
    - Procurando definições de canais públicos de lançamento
    - Executando validação de lançamento ou aceitação de pacote
    - Procurando nomenclatura e cadência de versões
summary: Faixas de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-07-04T17:55:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d00772c1a2ad62eb7138b1eda581786390835add0a96996114cac2fd77edb367
    source_path: reference/RELEASING.md
    workflow: 16
---

A OpenClaw atualmente expõe três canais de atualização voltados ao usuário:

- stable: o canal de lançamento promovido existente, que ainda é resolvido por
  npm `latest` até o marco separado de CLI/canal ser concluído
- beta: tags de pré-lançamento publicadas em npm `beta`
- dev: o head móvel de `main`

Separadamente, operadores de lançamento podem publicar o pacote principal do
mês concluído anterior em npm `extended-stable`, começando no patch `33`. A linha
final regular do mês atual continua em npm `latest`; essa divisão de publicação
do lado do operador não altera, por si só, a resolução de canais de atualização
da CLI.

## Nomenclatura de versões

- Versão mensal de lançamento extended-stable no npm: `YYYY.M.PATCH`, com `PATCH >= 33`
  - Tag Git: `vYYYY.M.PATCH`
- Versão final diária/regular de lançamento: `YYYY.M.PATCH`, com `PATCH < 33`
  - Tag Git: `vYYYY.M.PATCH`
- Versão regular de lançamento de correção fallback: `YYYY.M.PATCH-N`
  - Tag Git: `vYYYY.M.PATCH-N`
- Versão de pré-lançamento beta: `YYYY.M.PATCH-beta.N`
  - Tag Git: `vYYYY.M.PATCH-beta.N`
- Não preencha mês ou patch com zeros à esquerda
- A partir da atualização do processo de lançamento de junho de 2026, o terceiro
  componente é um número sequencial mensal do trem de lançamento, não um dia do
  calendário. Lançamentos stable e beta determinam o trem atual; tags somente
  alpha não consomem nem avançam o número de patch beta/stable. Tags e versões
  npm anteriores à atualização mantêm seus nomes existentes e continuam válidas;
  a automação de lançamento continua a compará-las por ano, mês, patch, canal e
  número de pré-lançamento ou correção.
- Builds alpha/nightly usam o próximo trem de patch ainda não lançado e incrementam
  apenas `alpha.N` para builds repetidos. Depois que esse patch tiver uma beta,
  novos builds alpha passam para o patch seguinte. Ignore tags legadas somente
  alpha com números de patch mais altos ao selecionar um trem beta ou stable.
- Versões npm são imutáveis. Se uma tag beta já tiver sido publicada, não a
  exclua, republique ou reutilize; corte o próximo número beta ou o próximo patch
  mensal. Como `2026.6.5-beta.1` já foi publicado durante a transição, os trens
  de lançamento de junho de 2026 devem usar patch `5` ou superior. Não publique
  novos trens stable ou beta de junho de 2026 como `2026.6.2`, `2026.6.3` ou
  `2026.6.4`.
- Após a final regular `2026.6.5`, o próximo novo trem beta é
  `2026.6.6-beta.1`, mesmo
  que tags automatizadas somente alpha com números de patch mais altos já existam.
- `latest` continua seguindo a linha npm regular/diária atual
- `beta` significa o alvo atual de instalação beta
- `extended-stable` significa o pacote npm com suporte do mês anterior, começando no patch
  `33`; o patch `34` e posteriores são lançamentos de manutenção nessa linha mensal
- O caminho mensal dedicado extended-stable publica apenas o pacote npm principal. Ele
  não publica plugins, artefatos macOS ou Windows, uma GitHub Release,
  dist-tags de repositório privado, imagens Docker, artefatos móveis ou downloads
  do site.

## Cadência de lançamento

- Lançamentos avançam primeiro para beta
- Stable vem somente depois que a beta mais recente é validada
- Mantenedores normalmente cortam lançamentos a partir de uma branch `release/YYYY.M.PATCH` criada
  a partir da `main` atual, para que validação e correções de lançamento não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, os mantenedores cortam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  exclusivos para mantenedores

## Publicação mensal extended-stable somente npm

Esta é uma exceção dedicada ao procedimento regular de lançamento abaixo. Para um
mês concluído `YYYY.M`, crie `extended-stable/YYYY.M.33`; publique `vYYYY.M.33` e
patches de manutenção posteriores a partir dessa mesma branch. A tag de lançamento, o tip da branch,
o checkout, a versão do pacote, o preflight npm e a execução Full Release Validation devem
todos identificar o mesmo commit. A `main` protegida já deve conter uma versão final
de um mês de calendário estritamente posterior abaixo do patch `33`; patches de manutenção permanecem
elegíveis depois que `main` avança mais de um mês.

Execute o preflight npm e Full Release Validation a partir da branch extended-stable exata,
depois salve os dois IDs de execução:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=true \
  -f npm_dist_tag=extended-stable

gh workflow run full-release-validation.yml \
  --ref extended-stable/YYYY.M.33 \
  -f ref=extended-stable/YYYY.M.33 \
  -f release_profile=stable
```

`release_profile=stable` é o perfil existente de profundidade de validação; ele é
separado da dist-tag npm `extended-stable` e é intencionalmente mantido sem alterações.

Depois que ambas as execuções forem bem-sucedidas e o ambiente de lançamento npm estiver pronto, promova o
tarball exato do preflight. O patch `P` deve ser `33` ou maior:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id>
```

Para um fork ou ensaio não produtivo que intencionalmente não consiga satisfazer a
política mensal `.33` ou de mês da `main` protegida, adicione
`-f bypass_extended_stable_guard=true` aos dispatches de preflight npm e publicação. O
padrão é `false`. O bypass é aceito somente com `npm_dist_tag=extended-stable` e
é registrado no resumo do workflow. Ele não ignora o ref de workflow canônico
`extended-stable/YYYY.M.33`, a igualdade entre tip da branch/tag/checkout, a sintaxe de tag final,
a igualdade de versão entre pacote/tag, a identidade da execução e do manifesto referenciados,
a proveniência do tarball, a aprovação de ambiente, a leitura de confirmação do registry ou a evidência
de reparo de seletor.

O workflow de publicação verifica as identidades das execuções referenciadas, o digest do
tarball preparado e ambos os seletores do registry npm. Confirme independentemente o
resultado depois que o workflow for bem-sucedido:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos os comandos devem retornar `YYYY.M.P`. Se a publicação for bem-sucedida, mas a leitura
de confirmação do seletor falhar, não republique a versão imutável do pacote. Use o único
comando de reparo `npm dist-tag add openclaw@YYYY.M.P extended-stable` impresso no
resumo always-run do workflow com falha, depois repita ambas as leituras independentes.
Rollback para o seletor anterior é uma decisão separada do operador, não
o caminho de reparo da leitura de confirmação.

A checklist regular abaixo continua responsável por beta, `latest`, GitHub Release,
plugins, macOS, Windows e outras publicações de plataforma. Não execute essas etapas
para este caminho extended-stable somente npm.

## Checklist regular do operador de lançamento

Esta checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback emergencial permanecem no
runbook de lançamento exclusivo para mantenedores.

1. Comece a partir da `main` atual: puxe a versão mais recente, confirme que o commit de destino foi enviado,
   e confirme que o CI atual da `main` está verde o suficiente para criar uma branch a partir dela.
2. Gere a seção superior do `CHANGELOG.md` a partir dos PRs mesclados e de todos os commits
   diretos desde a última tag de lançamento alcançável. Mantenha as entradas voltadas ao usuário,
   remova duplicatas entre entradas sobrepostas de PRs/commits diretos, faça commit da reescrita, envie-a,
   e faça rebase/pull mais uma vez antes de criar a branch.
3. Revise os registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade
   expirada somente quando o caminho de upgrade continuar coberto, ou registre por que ela está
   sendo mantida intencionalmente.
4. Crie `release/YYYY.M.PATCH` a partir da `main` atual; não faça o trabalho normal de lançamento
   diretamente na `main`.
5. Atualize todas as localizações de versão obrigatórias para a tag pretendida, depois execute
   `pnpm release:prep`. Ele atualiza versões de plugins, inventário de plugins, esquema de configuração,
   metadados de configuração de canais incluídos, baseline da documentação de configuração, exports do SDK
   de plugins e baseline da API do SDK de plugins na ordem correta. Faça commit de qualquer
   desvio gerado antes de criar a tag. Depois execute a pré-verificação determinística local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de uma tag existir,
   um SHA completo de 40 caracteres da branch de lançamento é permitido para pré-verificação
   somente de validação. A pré-verificação gera evidência de lançamento de dependências para o
   grafo exato de dependências em checkout e a armazena no artefato de pré-verificação npm.
   Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija na branch de lançamento e execute novamente o menor arquivo,
   trilha, tarefa de fluxo de trabalho, perfil de pacote, provedor ou lista de permissões de modelo com falha que
   comprove a correção. Execute novamente o agrupador completo somente quando a superfície alterada tornar
   a evidência anterior obsoleta.
9. Para um candidato beta com tag, execute
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` a partir da branch
   `release/YYYY.M.PATCH` correspondente. Para estável, passe também o lançamento de origem Windows
   obrigatório:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   O helper executa as verificações locais de lançamento gerado, dispara ou verifica
   a validação completa de lançamento e a evidência de pré-verificação npm, executa a
   prova fresh/update do Parallels contra o tarball preparado exato mais a prova de pacote do Telegram,
   registra os planos de npm de plugins e ClawHub, e imprime o comando exato
   `OpenClaw Release Publish` somente depois que o pacote de evidências estiver verde.
   `OpenClaw Release Publish` envia os pacotes de plugins selecionados ou todos os publicáveis
   para npm e o mesmo conjunto para ClawHub em paralelo, e então promove o
   artefato preparado de pré-verificação npm do OpenClaw com a dist-tag correspondente assim que
   a publicação npm dos plugins for bem-sucedida.
   Depois que o filho de publicação npm do OpenClaw for bem-sucedido, ele cria ou atualiza a
   página correspondente de lançamento/pré-lançamento do GitHub a partir da seção completa correspondente
   do `CHANGELOG.md`. Lançamentos estáveis publicados no npm `latest` tornam-se o
   lançamento mais recente do GitHub; lançamentos estáveis de manutenção mantidos no npm `beta` são
   criados com `latest=false` no GitHub. O fluxo de trabalho também faz upload da evidência de
   dependências da pré-verificação, do manifesto de validação completa e da evidência de verificação
   de registro pós-publicação para o lançamento do GitHub para resposta a incidentes pós-lançamento.
   O fluxo de trabalho de publicação imprime IDs de execuções filhas imediatamente, aprova automaticamente
   gates de ambiente de lançamento que o token do fluxo de trabalho tem permissão para aprovar, resume
   tarefas filhas com falha com finais de logs, conclui a evidência de lançamento e dependências
   do GitHub assim que a publicação npm do OpenClaw for bem-sucedida, aguarda o ClawHub sempre que
   o npm do OpenClaw estiver sendo publicado, então executa `pnpm release:verify-beta` e
   faz upload da evidência pós-publicação para o lançamento do GitHub, pacote npm, pacotes npm de plugins
   selecionados, pacotes ClawHub selecionados, IDs de execuções de fluxos de trabalho filhos e
   ID opcional da execução NPM Telegram. O caminho do ClawHub tenta novamente falhas transitórias
   de instalação de dependências da CLI, publica plugins que passam na prévia mesmo quando uma
   célula de prévia falha intermitentemente, e termina com verificação de registro para cada versão
   esperada de plugin para que publicações parciais permaneçam visíveis e possam ser tentadas novamente. Em seguida, execute a aceitação
   de pacote pós-publicação contra o pacote publicado
   `openclaw@YYYY.M.PATCH-beta.N` ou
   `openclaw@beta`. Se um pré-lançamento enviado ou publicado precisar de uma correção,
   corte o próximo número de pré-lançamento correspondente; não exclua nem reescreva o
   pré-lançamento antigo.
10. Para estável, continue somente depois que o beta ou candidato a lançamento examinado tiver a
    evidência de validação obrigatória. A publicação npm estável também passa pelo
    `OpenClaw Release Publish`, reutilizando o artefato de pré-verificação bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento estável para macOS também requer o
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado na `main`.
    O fluxo de trabalho de publicação macOS publica o appcast assinado na `main` pública
    automaticamente depois que os ativos de lançamento forem verificados; se a proteção de branch bloquear o
    push direto, ele abre ou atualiza um PR de appcast. A prontidão do Windows Hub
    estável requer os ativos assinados `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` e
    `OpenClawCompanion-SHA256SUMS.txt` no lançamento do GitHub do OpenClaw.
    Passe a tag exata de lançamento assinada `openclaw/openclaw-windows-node` como
    `windows_node_tag` e seu mapa de digests de instaladores aprovado pelo candidato como
    `windows_node_installer_digests`; `OpenClaw Release Publish` mantém o
    rascunho do lançamento, dispara `Windows Node Release` e verifica todos os três
    ativos antes da publicação.
11. Após a publicação, execute o verificador pós-publicação npm, o E2E Telegram independente
    opcional de npm publicado quando precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, verifique a página de lançamento do GitHub gerada,
    execute as etapas de anúncio de lançamento, depois conclua [Fechamento estável da main](#stable-main-closeout)
    antes de declarar um lançamento estável como finalizado.

## Fechamento estável da main

A publicação estável não está completa até que a `main` carregue o estado de lançamento
efetivamente enviado.

1. Comece da `main` mais recente e limpa. Audite `release/YYYY.M.PATCH` contra ela e
   faça forward-port das correções reais que estão ausentes da `main`. Não faça merge às cegas
   de adaptadores de compatibilidade, teste ou validação exclusivos de lançamento na `main` mais nova.
2. Defina a `main` para a versão estável enviada, não para um próximo ciclo especulativo. Execute
   `pnpm release:prep` após a alteração da versão raiz, depois
   `pnpm deps:shrinkwrap:generate`.
3. Faça a seção `## YYYY.M.PATCH` do `CHANGELOG.md` na `main` corresponder exatamente à
   branch de lançamento com tag. Inclua a atualização estável do `appcast.xml` quando o lançamento
   para Mac tiver publicado uma.
4. Não adicione `YYYY.M.PATCH+1`, uma versão beta ou uma seção vazia de changelog futura
   à `main` até que o operador inicie explicitamente esse ciclo de lançamento.
5. Execute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` e
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envie, depois verifique se `origin/main`
   contém a versão enviada e o changelog antes de declarar o lançamento estável
   concluído.
6. Mantenha as variáveis de repositório `RELEASE_ROLLBACK_DRILL_ID` e
   `RELEASE_ROLLBACK_DRILL_DATE` atuais após cada simulado privado de reversão.
   `OpenClaw Stable Main Closeout` começa a partir do push da `main` que carrega a
   versão enviada, o changelog e o appcast após a publicação estável. Ele lê
   evidências imutáveis pós-publicação para vincular a tag enviada às execuções de Full Release
   Validation e Publish, depois verifica o estado estável da main, o lançamento,
   o período obrigatório de observação estável e a evidência bloqueante de desempenho. Ele anexa um
   manifesto de fechamento imutável e checksum ao lançamento do GitHub. O gatilho automático
   de push ignora lançamentos legados anteriores a evidências imutáveis pós-publicação;
   ele nunca trata esse salto como um fechamento concluído. Um fechamento completo
   requer ambos os ativos e um checksum correspondente. Um manifesto parcial
   reproduz seu SHA da `main` registrado e o simulado de reversão para regenerar bytes
   idênticos, depois anexa o checksum ausente; um par inválido, ou um checksum
   sem manifesto, permanece bloqueante. Uma execução acionada por push sem variáveis de repositório
   de simulado de reversão pula sem concluir o fechamento; um registro de simulado ausente ou
   com mais de 90 dias ainda bloqueia o fechamento manual respaldado por evidências.
   Comandos privados de recuperação permanecem no runbook exclusivo dos mantenedores.
   Use o disparo manual somente para reparar ou reproduzir um fechamento estável respaldado por evidências.
   Uma tag de correção de fallback legado pode reutilizar evidência do pacote base somente quando
   a tag de correção resolve para o mesmo commit de origem que a tag estável base.
   Uma correção com origem diferente deve publicar e verificar sua própria evidência de pacote.

## Pré-verificação de lançamento

- Execute `pnpm check:test-types` antes da pré-verificação de release para que o TypeScript de testes continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes da pré-verificação de release para que as verificações mais amplas de
  ciclos de importação e limites de arquitetura fiquem verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release esperados
  em `dist/*` e o bundle da UI de Controle existam para a etapa de validação
  do pacote
- Execute `pnpm release:prep` depois do bump de versão raiz e antes de criar a tag. Ele
  executa todos os geradores de release determinísticos que normalmente divergem após uma
  alteração de versão/configuração/API: versões de plugins, inventário de plugins, schema de configuração
  base, metadados de configuração de canais empacotados, baseline de docs de configuração, exports do SDK de plugins
  e baseline da API do SDK de plugins. `pnpm release:check` reexecuta esses
  guardas em modo de verificação e relata toda falha de divergência gerada que encontrar em uma
  única passagem antes de executar as verificações de release de pacote.
- A sincronização de versões de plugins atualiza as versões dos pacotes de plugins oficiais e os pisos
  `openclaw.compat.pluginApi` existentes para a versão de release do OpenClaw por
  padrão. Trate esse campo como o piso da API do SDK/runtime de plugins, não apenas uma cópia
  da versão do pacote: para releases somente de plugins que intencionalmente continuam
  compatíveis com hosts OpenClaw mais antigos, mantenha o piso na API de host mais antiga
  suportada e documente essa escolha na prova de release do plugin.
- Execute o workflow manual `Full Release Validation` antes da aprovação de release para
  iniciar todos os test boxes de pré-release a partir de um único ponto de entrada. Ele aceita uma branch,
  tag ou SHA completo de commit, dispara `CI` manual e dispara
  `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote
  entre sistemas operacionais, paridade do QA Lab, Matrix e lanes do Telegram. Execuções estáveis e completas
  sempre incluem live/E2E exaustivo e soak do caminho de release do Docker;
  `run_release_soak=true` é mantido para um soak beta explícito. Package
  Acceptance fornece o E2E canônico de Telegram de pacote durante a validação
  de candidato, evitando um segundo poller live concorrente.
  Forneça `release_package_spec` após publicar um beta para reutilizar o pacote npm
  lançado nas verificações de release, Package Acceptance e E2E de Telegram de pacote
  sem reconstruir o tarball de release. Forneça
  `npm_telegram_package_spec` somente quando o Telegram deve usar um pacote
  publicado diferente do restante da validação de release. Forneça
  `package_acceptance_package_spec` quando Package Acceptance deve usar um
  pacote publicado diferente da spec de pacote de release. Forneça
  `evidence_package_spec` quando o relatório de evidências de release deve provar que a
  validação corresponde a um pacote npm publicado sem forçar E2E de Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Execute o workflow manual `Package Acceptance` quando quiser prova por canal lateral
  para um candidato de pacote enquanto o trabalho de release continua. Use `source=npm` para
  `openclaw@beta`, `openclaw@latest` ou uma versão de release exata; `source=ref`
  para empacotar uma branch/tag/SHA `package_ref` confiável com o harness
  `workflow_ref` atual; `source=url` para um tarball HTTPS público com um
  SHA-256 obrigatório e política estrita de URL pública; `source=trusted-url` para uma
  política de fonte confiável nomeada usando `trusted_source_id` obrigatório e SHA-256; ou
  `source=artifact` para um tarball enviado por outra execução do GitHub Actions. O
  workflow resolve o candidato para
  `package-under-test`, reutiliza o agendador de release Docker E2E contra esse
  tarball e pode executar QA do Telegram contra o mesmo tarball com
  `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as
  lanes Docker selecionadas incluem `published-upgrade-survivor`, o artefato de pacote
  é o candidato e `published_upgrade_survivor_baseline` seleciona
  a baseline publicada. `update-restart-auth` usa o pacote candidato como
  a CLI instalada e o package-under-test, para exercitar o caminho de reinício
  gerenciado do comando de atualização do candidato.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: lanes de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: lanes nativas de artefato para pacote/atualização/reinício/plugin sem OpenWebUI nem ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    busca web da OpenAI e OpenWebUI
  - `full`: partes do caminho de release Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma reexecução focada
- Execute o workflow manual `CI` diretamente quando precisar apenas de cobertura normal
  determinística de CI para o candidato de release. Disparos manuais de CI ignoram o escopo
  de alterações e forçam os shards Linux Node, shards de plugins empacotados, shards de contratos
  de plugins e canais, compatibilidade com Node 22, `check-*`, `check-additional-*`,
  verificações smoke de artefatos construídos, verificações de docs, Skills em Python, Windows, macOS e
  lanes de i18n da UI de Controle. Execuções manuais independentes de CI rodam Android somente quando disparadas
  com `include_android=true`; `Full Release Validation` passa essa entrada para
  seu filho de CI.
  Exemplo com Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de release. Ele exercita o
  QA-lab por meio de um receptor OTLP/HTTP local e verifica exportação de traces, métricas e logs,
  além de atributos de trace limitados e redação de conteúdo/identificadores sem
  exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm qa:otel:collector-smoke` ao validar compatibilidade com coletor.
  Ele roteia a mesma exportação OTLP do QA-lab por um contêiner Docker real do OpenTelemetry Collector
  antes das asserções do receptor local.
- Execute `pnpm qa:prometheus:smoke` ao validar scraping protegido do Prometheus.
  Ele exercita o QA-lab, rejeita scrapes não autenticados e verifica que
  famílias de métricas críticas de release permaneçam livres de conteúdo de prompt, identificadores brutos,
  tokens de autenticação e caminhos locais.
- Execute `pnpm qa:observability:smoke` quando quiser as lanes smoke de
  OpenTelemetry e Prometheus em checkout de código-fonte uma após a outra.
- Execute `pnpm release:check` antes de toda release com tag
- A pré-verificação `OpenClaw NPM Release` gera evidência de release de dependências antes
  de empacotar o tarball npm. O gate de vulnerabilidades de advisory npm é
  bloqueante para release. O risco de manifesto transitivo, a superfície de propriedade/instalação
  de dependências e os relatórios de alteração de dependências são apenas evidências de release. O
  relatório de alteração de dependências compara o candidato de release com a tag de release
  alcançável anterior.
- A pré-verificação envia evidência de dependências como
  `openclaw-release-dependency-evidence-<tag>` e também a incorpora em
  `dependency-evidence/` dentro do artefato de pré-verificação npm preparado. O caminho real
  de publicação reutiliza esse artefato de pré-verificação e então anexa a mesma evidência
  à release do GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Execute `OpenClaw Release Publish` para a sequência mutante de publicação depois que a
  tag existir. Dispare-o a partir de `release/YYYY.M.PATCH` (ou `main` ao publicar uma
  tag alcançável por main), passe a tag de release, o `preflight_run_id` npm bem-sucedido
  do OpenClaw e o `full_release_validation_run_id` bem-sucedido, e mantenha
  o escopo padrão de publicação de plugins `all-publishable`, a menos que esteja executando deliberadamente
  um reparo focado. O workflow serializa publicação npm de plugins, publicação de plugins
  no ClawHub e publicação npm do OpenClaw para que o pacote core não seja publicado
  antes de seus plugins externalizados.
- `OpenClaw Release Publish` estável exige um `windows_node_tag` exato depois
  que a release não pré-release correspondente `openclaw/openclaw-windows-node` existir.
  Ela também exige o mapa `windows_node_installer_digests` aprovado pelo candidato.
  Antes de disparar qualquer filho de publicação, ela verifica que a release de origem está
  publicada, não é pré-release, contém os instaladores x64/ARM64 necessários e
  ainda corresponde a esse mapa aprovado. Então ela dispara `Windows Node Release`
  enquanto a release do OpenClaw ainda é um rascunho, carregando o mapa fixado de digests
  de instaladores sem alterações. O workflow filho
  baixa os instaladores assinados do Windows Hub a partir daquela tag exata,
  compara-os com os digests fixados, verifica se suas assinaturas Authenticode
  usam o signatário esperado da OpenClaw Foundation em um runner Windows,
  grava um manifesto SHA-256 e envia os instaladores mais o manifesto para a
  release canônica do GitHub do OpenClaw, então baixa novamente os ativos promovidos e
  verifica a associação ao manifesto e os hashes. O pai verifica o contrato atual
  dos ativos x64, ARM64 e de checksum antes da publicação. A recuperação direta
  rejeita nomes de ativos `OpenClawCompanion-*` inesperados antes de substituir os
  ativos de contrato esperados pelos bytes de origem fixados. Dispare manualmente
  `Windows Node Release` somente para recuperação e sempre passe uma tag exata, nunca
  `latest`, mais o mapa JSON explícito `expected_installer_digests` da
  release de origem aprovada. Links de download do site devem apontar para URLs exatas
  de ativos de release do OpenClaw para a release estável atual, ou
  `releases/latest/download/...` somente após verificar que o redirecionamento latest do GitHub
  aponta para essa mesma release; não vincule apenas à página de release do repo companion.
- As verificações de release agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a lane de paridade mock do QA Lab, além do perfil
  live rápido do Matrix e da lane de QA do Telegram antes da aprovação de release. As lanes live
  usam o ambiente `qa-live-shared`; Telegram também usa leases de credenciais CI
  do Convex. Execute o workflow manual `QA-Lab - All Lanes` com
  `matrix_profile=all` e `matrix_shards=true` quando quiser inventário completo de transporte
  Matrix, mídia e E2EE em paralelo.
- A validação de runtime de instalação e upgrade entre sistemas operacionais faz parte dos workflows públicos
  `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o
  workflow reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa separação é intencional: mantenha o caminho real de release npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua
  própria lane para que não atrasem nem bloqueiem a publicação
- Verificações de release que carregam segredos devem ser disparadas por meio de `Full Release
Validation` ou a partir da ref de workflow `main`/release para que a lógica do workflow e
  os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit desde que
  o commit resolvido seja alcançável a partir de uma branch ou tag de release do OpenClaw
- A pré-verificação somente de validação `OpenClaw NPM Release` também aceita o SHA completo
  atual de 40 caracteres do commit da branch do workflow sem exigir uma tag publicada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` somente para a
  verificação de metadados do pacote; publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners
  hospedados pelo GitHub, enquanto o caminho de validação não mutante pode usar os runners
  Linux maiores da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A pré-verificação de release npm não espera mais pela lane separada de verificações de release
- Antes de criar uma tag de candidato de release localmente, execute
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. O helper
  executa os guardrails rápidos de release, verificações de release npm/ClawHub de plugins, build,
  build da UI e `release:openclaw:npm:check` na ordem que captura erros comuns
  bloqueantes de aprovação antes que o workflow de publicação do GitHub comece.
- Execute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro
  publicado em um prefixo temporário novo
- Depois de uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar o onboarding do pacote instalado, a configuração do Telegram e o E2E real do Telegram
  em relação ao pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram.
  Execuções pontuais locais de mantenedores podem omitir as variáveis do Convex e passar diretamente as três
  credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Para executar o smoke beta completo pós-publicação a partir da máquina de um mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O auxiliar executa validação de atualização npm/fresh-target no Parallels, dispara `NPM Telegram Beta E2E`, consulta a execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions via o
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda em todo merge.
- A automação de release para mantenedores agora usa preflight-depois-promote:
  - a publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.PATCH` da execução de preflight bem-sucedida
  - releases npm estáveis usam `beta` como padrão
  - a publicação npm estável pode apontar explicitamente para `latest` via entrada do workflow
  - a mutação de npm dist-tag baseada em token agora fica em
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque
    `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o repositório de origem mantém
    publicação somente com OIDC
  - o `macOS Release` público é somente validação; quando uma tag existe apenas em uma
    branch de release, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.PATCH`
  - a publicação macOS real deve passar por `preflight_run_id` e
    `validate_run_id` macOS bem-sucedidos
  - os caminhos de publicação real promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para releases estáveis de correção como `YYYY.M.PATCH-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade com prefixo temporário de `YYYY.M.PATCH` para `YYYY.M.PATCH-N`,
  para que correções de release não possam silenciosamente deixar instalações globais mais antigas no
  payload estável base
- O preflight de release npm falha fechado a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio em `dist/control-ui/assets/`,
  para não enviarmos um dashboard de navegador vazio novamente
- A verificação pós-publicação também confere se os entrypoints de Plugin publicados e
  os metadados do pacote estão presentes no layout de registro instalado. Uma release que
  envia payloads ausentes de runtime de Plugin falha no verificador pós-publicação e
  não pode ser promovida para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do npm pack no
  tarball de atualização candidato, então o e2e do instalador captura crescimento acidental do pacote
  antes do caminho de publicação da release
- Se o trabalho de release tocou no planejamento de CI, manifestos de temporização de plugins ou
  matrizes de teste de plugins, regenere e revise as saídas da matriz
  `plugin-prerelease-extension-shard` de propriedade do planner em
  `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de release não
  descrevam um layout de CI obsoleto
- A prontidão de release estável para macOS também inclui as superfícies do atualizador:
  - a release do GitHub deve acabar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip estável depois da publicação; o
    workflow de publicação macOS faz commit dele automaticamente, ou abre um PR de appcast
    quando o push direto está bloqueado
  - o app empacotado deve manter um bundle id sem debug, uma URL de feed Sparkle não vazia
    e um `CFBundleVersion` igual ou acima do piso canônico de build Sparkle
    para essa versão da release

## Caixas de teste de lançamento

`Full Release Validation` é como os operadores iniciam todos os testes de pré-lançamento a partir de
um único ponto de entrada. Para uma prova de commit fixado em uma branch que muda rapidamente, use o
helper para que cada workflow filho execute a partir de uma branch temporária fixada no SHA de destino:

```bash
pnpm ci:full-release --sha <full-sha>
```

O helper envia `release-ci/<sha>-...`, despacha `Full Release Validation`
a partir dessa branch com `ref=<sha>`, verifica se cada `headSha` de workflow filho
corresponde ao destino e, em seguida, exclui a branch temporária. Isso evita provar por acidente uma
execução filha de `main` mais recente.

Para validação de branch ou tag de lançamento, execute a partir do ref de workflow `main`
confiável e passe a branch ou tag de lançamento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

O workflow resolve o ref de destino, despacha `CI` manual com
`target_ref=<release-ref>` e, em seguida, despacha `OpenClaw Release Checks`.
`OpenClaw Release Checks` distribui smoke de instalação, verificações de lançamento entre SOs,
cobertura live/E2E Docker do caminho de lançamento quando soak está habilitado, Package Acceptance
com o E2E canônico do pacote Telegram, paridade do QA Lab, Matrix live e
Telegram live. Uma execução completa/all só é aceitável quando o resumo de `Full Release Validation`
mostra `normal_ci`, `plugin_prerelease` e `release_checks` como
bem-sucedidos, a menos que uma reexecução focada tenha pulado intencionalmente o filho separado `Plugin
Prerelease`. Use o filho independente `npm-telegram` apenas para uma reexecução focada de
pacote publicado com `release_package_spec` ou
`npm_telegram_package_spec`. O resumo final do
verificador inclui tabelas dos jobs mais lentos para cada execução filha, para que o gerente de lançamento
possa ver o caminho crítico atual sem baixar logs.
Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation) para a
matriz completa de estágios, nomes exatos dos jobs de workflow, diferenças entre perfis stable e full,
artefatos e identificadores de reexecução focada.
Workflows filhos são despachados a partir do ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando o `ref` de destino aponta para uma
branch ou tag de lançamento mais antiga. Não há uma entrada separada de ref de workflow para Full Release Validation; escolha o harness confiável escolhendo o ref da execução de workflow.
Não use `--ref main -f ref=<sha>` para prova exata de commit em `main` móvel;
SHAs de commit brutos não podem ser refs de despacho de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar a branch temporária fixada.

Use `release_profile` para selecionar a abrangência live/provedor:

- `minimum`: caminho live e Docker OpenAI/core crítico para lançamento mais rápido
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de lançamento
- `full`: stable mais cobertura consultiva ampla de provedor/mídia

Validações stable e full sempre executam a varredura exaustiva live/E2E, do caminho de lançamento Docker
e de sobrevivência de upgrade publicado limitada antes da promoção.
Use `run_release_soak=true` para solicitar essa mesma varredura para um beta. Essa varredura cobre
os quatro pacotes stable mais recentes mais as linhas de base fixadas `2026.4.23` e `2026.5.2`
mais a cobertura mais antiga `2026.4.15`, com linhas de base duplicadas removidas e
cada linha de base fragmentada em seu próprio job de executor Docker.

`OpenClaw Release Checks` usa o ref de workflow confiável para resolver o ref de destino
uma vez como `release-package-under-test` e reutiliza esse artefato em verificações entre SOs,
Package Acceptance e Docker de caminho de lançamento quando soak executa. Isso mantém
todas as caixas voltadas para pacote nos mesmos bytes e evita builds repetidos de pacote.
Depois que um beta já estiver no npm, defina `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
para que as verificações de lançamento baixem o pacote lançado uma vez, extraiam o SHA de origem do build
de `dist/build-info.json` e reutilizem esse artefato para lanes entre SOs,
Package Acceptance, Docker de caminho de lançamento e Telegram de pacote.
O smoke de instalação OpenAI entre SOs usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável de repo/org está definida, caso contrário `openai/gpt-5.4`, porque essa lane está
provando instalação do pacote, onboarding, inicialização do gateway e uma rodada live de agente,
em vez de benchmarkar o modelo padrão mais lento. A matriz mais ampla de provedores live
continua sendo o lugar para cobertura específica de modelo.

Use estas variantes dependendo do estágio de lançamento:

```bash
# Validate an unpublished release candidate branch.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Validate an exact pushed commit.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# After publishing a beta, add published-package Telegram E2E.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=full \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Não use o guarda-chuva completo como a primeira reexecução depois de uma correção focada. Se uma caixa
falhar, use o workflow filho, job, lane Docker, perfil de pacote, provedor de modelo
ou lane QA que falhou para a próxima prova. Execute o guarda-chuva completo novamente apenas quando
a correção tiver alterado a orquestração compartilhada de lançamento ou tornado obsoleta a evidência anterior de todas as caixas.
O verificador final do guarda-chuva revalida os ids registrados das execuções de workflow filhas,
então, depois que um workflow filho for reexecutado com sucesso, reexecute apenas o job pai
`Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` ao guarda-chuva. `all` é a execução real
de candidato a lançamento, `ci` executa apenas o filho de CI normal, `plugin-prerelease`
executa apenas o filho de Plugin exclusivo de lançamento, `release-checks` executa todas as caixas de lançamento,
e os grupos de lançamento mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `release_package_spec` ou
`npm_telegram_package_spec`; execuções full/all usam o E2E canônico de Telegram de pacote
dentro de Package Acceptance. Reexecuções focadas
entre SOs podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou
outro filtro de SO/suite. Falhas em QA release-check bloqueiam a validação normal de lançamento,
incluindo o drift obrigatório de ferramenta dinâmica OpenClaw no nível padrão.
Execuções alpha do Tideclaw ainda podem tratar lanes de release-check que não sejam de segurança de pacote como
consultivas. Quando `live_suite_filter` solicita explicitamente uma lane live QA bloqueada, como
Discord, WhatsApp ou Slack, a variável de repo correspondente
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` deve estar habilitada; caso contrário
a captura de entrada falha em vez de pular silenciosamente a lane.

### Vitest

A caixa Vitest é o workflow filho manual `CI`. O CI manual intencionalmente
ignora o escopo de alterações e força o grafo de testes normal para o candidato a lançamento:
shards Linux Node, shards de plugins agrupados, shards de contrato de Plugin e canal,
compatibilidade Node 22, `check-*`, `check-additional-*`,
smokes de artefatos buildados, verificações de docs, Skills Python, Windows, macOS
e i18n da Control UI. Android é incluído quando `Full Release Validation` executa a
caixa porque o guarda-chuva passa `include_android=true`; CI manual independente
exige `include_android=true` para cobertura Android.

Use esta caixa para responder "a árvore de código-fonte passou na suíte de testes normal completa?"
Ela não é o mesmo que validação de produto pelo caminho de lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` despachada
- execução `CI` verde no SHA de destino exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de tempo do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute CI manual diretamente apenas quando o lançamento precisar de CI normal determinístico, mas
não das caixas Docker, QA Lab, live, entre SOs ou pacote. Use o primeiro comando
para CI direto sem Android. Adicione `include_android=true` quando o CI direto
de candidato a lançamento precisar cobrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

A caixa Docker fica em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow
`install-smoke` em modo de lançamento. Ela valida o candidato a lançamento por meio de ambientes Docker
empacotados, em vez de apenas testes no nível de código-fonte.

A cobertura Docker de lançamento inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun habilitado
- preparação/reutilização da imagem smoke do Dockerfile raiz pelo SHA de destino, com jobs de smoke QR,
  root/gateway e installer/Bun executando como shards install-smoke separados
- lanes E2E de repositório
- chunks Docker de caminho de lançamento: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de Plugin agrupado
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes de provedor live/E2E e cobertura de modelo live Docker quando as verificações de lançamento
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de lançamento envia
`.artifacts/docker-tests/` com logs de lane, `summary.json`, `failures.json`,
tempos de fases, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no workflow reutilizável live/E2E em vez de
reexecutar todos os chunks de lançamento. Comandos de reexecução gerados incluem o
`package_artifact_run_id` anterior e entradas de imagem Docker preparada quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de lançamento de
comportamento agentic e no nível de canal, separado da mecânica de pacote de Vitest e Docker.

A cobertura QA Lab de lançamento inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a linha de base Opus 4.6
  usando o pacote de paridade agentic
- perfil QA Matrix live rápido usando o ambiente `qa-live-shared`
- lane QA live Telegram usando leases de credenciais Convex CI
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` ou
  `pnpm qa:observability:smoke` quando a telemetria de lançamento precisa de prova local
  explícita

Use esta caixa para responder "o lançamento se comporta corretamente em cenários QA e
fluxos de canais live?" Mantenha as URLs de artefatos para lanes de paridade, Matrix e Telegram
ao aprovar o lançamento. A cobertura Matrix completa continua disponível como uma
execução manual fragmentada do QA-Lab, em vez da lane crítica de lançamento padrão.

### Pacote

A caixa Pacote é o gate de produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e o SHA-256, e mantém o
ref do harness de workflow separado do ref de origem do pacote.

Fontes de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão de lançamento
  exata do OpenClaw
- `source=ref`: empacota uma branch, tag ou SHA de commit completo de `package_ref`
  confiável com o harness `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS público com `package_sha256` obrigatório;
  credenciais de URL, portas HTTPS não padrão, nomes de host ou endereços
  resolvidos privados/internos/de uso especial e redirecionamentos inseguros são rejeitados
- `source=trusted-url`: baixa um `.tgz` HTTPS com
  `package_sha256` e `trusted_source_id` obrigatórios de uma política nomeada em
  `.github/package-trusted-sources.json`; use isto para espelhos empresariais
  ou repositórios de pacotes privados pertencentes a mantenedores, em vez de adicionar um
  bypass de rede privada no nível de entrada a `source=url`
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Aceitação de Pacote com `source=artifact`, o
artefato de pacote de lançamento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. A Aceitação de Pacote mantém QA de migração, atualização,
reinicialização de atualização com autenticação configurada, instalação de skill ativa do ClawHub, limpeza de dependência obsoleta de Plugin, fixtures de Plugin offline, atualização de Plugin e pacote Telegram contra o mesmo tarball resolvido. As verificações de lançamento bloqueantes usam a linha de base padrão do pacote publicado mais recente; o perfil beta com `run_release_soak=true`, `release_profile=stable` ou
`release_profile=full` expande para todas as linhas de base estáveis publicadas no npm de
`2026.4.23` até `latest`, além de fixtures de problemas relatados. Use
Aceitação de Pacote com `source=npm` para um candidato já lançado,
`source=ref` para um tarball npm local respaldado por SHA antes da publicação,
`source=trusted-url` para um espelho empresarial/privado pertencente a mantenedor, ou
`source=artifact` para um tarball preparado enviado por outra execução do GitHub Actions.
Ela é a substituição nativa do GitHub para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. Verificações de lançamento entre sistemas operacionais ainda importam para onboarding,
instalador e comportamento de plataforma específicos de SO, mas a validação de produto de pacote/atualização deve
preferir a Aceitação de Pacote.

A checklist canônica para validação de atualização e Plugin é
[Testando atualizações e Plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual lane local, Docker, Aceitação de Pacote ou verificação de lançamento comprova uma
instalação/atualização de Plugin, limpeza do doctor ou alteração de migração de pacote publicado.
A migração exaustiva de atualização publicada de todos os pacotes estáveis `2026.4.23+` é
um workflow manual separado `Update Migration`, não parte do Full Release CI.

A leniência legada de package-acceptance é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas de inventário de QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes no fixture git derivado do tarball,
ausência de `update.channel` persistido, locais legados de registro de instalação de Plugin,
ausência de persistência de registro de instalação do marketplace e migração de metadados de configuração durante `plugins update`. O pacote publicado `2026.4.26` pode avisar
sobre arquivos de carimbo de metadados de build local que já foram lançados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas falham na
validação de lançamento.

Use perfis mais amplos de Aceitação de Pacote quando a pergunta de lançamento for sobre um
pacote realmente instalável:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f published_upgrade_survivor_baseline=openclaw@2026.4.26
```

Perfis comuns de pacote:

- `smoke`: lanes rápidas de instalação/canal/agente de pacote, rede de Gateway e
  recarregamento de configuração
- `package`: contratos de pacote de instalação/atualização/reinicialização/Plugin, além de prova de
  instalação ativa de skill do ClawHub; este é o padrão de verificação de lançamento
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa web da OpenAI e OpenWebUI
- `full`: partes do caminho de lançamento Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova de pacote candidato do Telegram, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` na Aceitação de Pacote. O workflow passa o
tarball `package-under-test` resolvido para a lane do Telegram; o workflow
Telegram independente ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação regular de publicação de lançamento

Para beta, `latest`, Plugin, GitHub Release e publicação de plataforma,
`OpenClaw Release Publish` é o ponto de entrada mutável normal. O caminho mensal
`.33+` npm-only extended-stable não usa este orquestrador. O workflow regular
orquestra os workflows de trusted-publisher na ordem de que o lançamento precisa:

1. Fazer checkout da tag de lançamento e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Disparar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Disparar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Disparar `OpenClaw NPM Release` com a tag de lançamento, a dist-tag npm e
   o `preflight_run_id` salvo após verificar o
   `full_release_validation_run_id` salvo.
7. Para lançamentos estáveis, criar ou atualizar o GitHub release como rascunho, disparar
   `Windows Node Release` com o `windows_node_tag` explícito e
   `windows_node_installer_digests` aprovados pelo candidato, e verificar os ativos canônicos
   de instalador/checksum antes de publicar o rascunho.

Exemplo de publicação beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Publicação estável para a dist-tag beta padrão:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

A promoção estável diretamente para `latest` é explícita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=latest
```

Use os workflows de nível mais baixo `Plugin NPM Release` e `Plugin ClawHub Release`
somente para trabalho focado de reparo ou republicação. `OpenClaw Release Publish` rejeita
`plugin_publish_scope=selected` quando `publish_openclaw_npm=true`, para que o pacote
principal não seja lançado sem todos os Plugins oficiais publicáveis, incluindo
`@openclaw/diffs-language-pack`. Para um reparo de Plugin selecionado, defina
`publish_openclaw_npm=false` com `plugin_publish_scope=selected` e
`plugins=@openclaw/name`, ou dispare o workflow filho diretamente.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, ela também pode ser o SHA de commit
  completo de 40 caracteres da branch de workflow atual para preflight somente de validação
- `preflight_only`: `true` apenas para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `full_release_validation_run_id`: obrigatório para publicação mensal extended-stable real e regular
  não beta, para que o workflow autentique a execução de validação exata
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; aceita `alpha`, `beta`,
  `latest` ou `extended-stable` e o padrão é `beta`. O patch final `33` e posteriores devem
  usar `extended-stable`; por padrão, `extended-stable` rejeita patches anteriores, e sempre
  rejeita tags não finais.
- `bypass_extended_stable_guard`: booleano somente para testes, padrão `false`; com
  `npm_dist_tag=extended-stable`, ignora a elegibilidade mensal de extended-stable enquanto preserva
  identidade de lançamento, artefato, aprovação e verificações de readback.

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória; já deve existir
- `preflight_run_id`: id de execução de preflight bem-sucedida de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id de execução bem-sucedida de `Full Release Validation`;
  obrigatório quando `publish_openclaw_npm=true`
- `windows_node_tag`: tag de lançamento exata, sem prerelease, de `openclaw/openclaw-windows-node`;
  obrigatória para publicação estável do OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprovado pelo candidato dos
  nomes atuais de instaladores Windows para seus digests `sha256:` fixados; obrigatório
  para publicação estável do OpenClaw
- `npm_dist_tag`: tag npm de destino para o pacote OpenClaw
- `plugin_publish_scope`: padrão `all-publishable`; use `selected` somente
  para trabalho focado de reparo apenas de Plugin com `publish_openclaw_npm=false`
- `plugins`: nomes de pacote `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: padrão `true`; defina `false` somente ao usar o
  workflow como um orquestrador de reparo apenas de Plugin
- `wait_for_clawhub`: padrão `false`, para que a disponibilidade no npm não seja bloqueada pelo
  sidecar do ClawHub; defina `true` somente quando a conclusão do workflow precisar incluir
  a conclusão do ClawHub

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA de commit completo a validar. Verificações que contêm segredos
  exigem que o commit resolvido seja alcançável a partir de uma branch do OpenClaw ou
  tag de lançamento.
- `run_release_soak`: opta por soak exaustivo live/E2E, caminho de lançamento Docker e
  upgrade-survivor all-since para verificações de lançamento beta. Ele é forçado por
  `release_profile=stable` e `release_profile=full`.

Regras:

- Versões finais regulares e de correção abaixo do patch `33` podem publicar em
  `beta` ou `latest`. Versões finais no patch `33` ou acima devem publicar em
  `extended-stable`, e versões com sufixo de correção nesse limite são rejeitadas.
- Tags beta prerelease podem publicar somente em `beta`
- Para `OpenClaw NPM Release`, entrada de SHA de commit completo é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes que a publicação continue

## Sequência regular de lançamento beta/latest estável

Esta sequência legada é para o lançamento regular orquestrado que também controla
Plugins, GitHub Release, Windows e outros trabalhos de plataforma. Ela não é o
caminho mensal `.33+` npm-only extended-stable documentado no topo desta página.

Ao cortar um lançamento estável regular orquestrado:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA do commit atual completo da branch do workflow
     para uma execução seca apenas de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo beta-first normal, ou `latest` apenas
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` na branch de release, tag de release ou SHA de commit
   completo quando quiser CI normal mais cobertura de cache de prompt ao vivo, Docker, QA Lab,
   Matrix e Telegram a partir de um único workflow manual
4. Se você intencionalmente precisa apenas do grafo de testes normal determinístico, execute o
   workflow manual `CI` na ref de release em vez disso
5. Selecione a tag de release exata não prerelease de `openclaw/openclaw-windows-node`
   cujos instaladores assinados x64 e ARM64 devem ser enviados. Salve-a como
   `windows_node_tag` e salve o mapa de digests validado deles como
   `windows_node_installer_digests`. O auxiliar de release candidate registra ambos
   e os inclui no comando de publicação gerado.
6. Salve o `preflight_run_id` e o `full_release_validation_run_id` bem-sucedidos
7. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`,
   o `windows_node_tag` selecionado, seu `windows_node_installer_digests` salvo,
   o `preflight_run_id` salvo e o `full_release_validation_run_id` salvo;
   ele publica plugins externalizados no npm e no ClawHub antes de promover o
   pacote npm do OpenClaw
8. Se a release chegou em `beta`, use o
   workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
9. Se a release foi publicada intencionalmente diretamente em `latest` e `beta`
   deve seguir a mesma build estável imediatamente, use esse mesmo workflow de release
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   agendada de autocorreção mover `beta` posteriormente

A mutação de dist-tag vive no repositório de registro de releases porque ela ainda exige
`NPM_TOKEN`, enquanto o repositório de origem mantém publicação apenas por OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta-first
documentados e visíveis para o operador.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos da
CLI do 1Password (`op`) apenas dentro de uma sessão tmux dedicada. Não chame `op`
diretamente do shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e manuseio de OTP observáveis e evita alertas repetidos no host.

## Referências públicas

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Mantenedores usam a documentação privada de release em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.

## Relacionado

- [Canais de release](/pt-BR/install/development-channels)
