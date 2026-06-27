---
read_when:
    - Buscando definições de canais de lançamento público
    - Executando validação de release ou aceitação de pacote
    - Procurando nomenclatura de versões e cadência
summary: Faixas de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-06-27T18:08:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 16873b02f09bd0f67ea16644630defc1b17b6f236572715df598a2253dba3b2d
    source_path: reference/RELEASING.md
    workflow: 16
---

OpenClaw tem três linhas públicas de lançamento:

- stable: lançamentos marcados por tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de lançamento stable: `YYYY.M.PATCH`
  - Tag do Git: `vYYYY.M.PATCH`
- Versão de lançamento de correção stable: `YYYY.M.PATCH-N`
  - Tag do Git: `vYYYY.M.PATCH-N`
- Versão de pré-lançamento beta: `YYYY.M.PATCH-beta.N`
  - Tag do Git: `vYYYY.M.PATCH-beta.N`
- Não preencha mês ou patch com zero à esquerda
- A partir da atualização do processo de lançamento de junho de 2026, o terceiro componente é um
  número sequencial mensal do trem de lançamento, não um dia do calendário. Lançamentos stable e beta
  determinam o trem atual; tags apenas alpha não consomem nem
  avançam o número de patch beta/stable. Tags e versões npm anteriores à atualização mantêm
  seus nomes existentes e permanecem válidas; a automação de lançamento continua a
  compará-las por ano, mês, patch, canal e número de pré-lançamento ou correção.
- Builds alpha/nightly usam o próximo trem de patch ainda não lançado e incrementam apenas
  `alpha.N` para builds repetidos. Assim que esse patch tiver um beta, novos builds alpha
  passam para o patch seguinte. Ignore tags legadas apenas alpha com números de patch
  mais altos ao selecionar um trem beta ou stable.
- Versões npm são imutáveis. Se uma tag beta já tiver sido publicada, não
  a exclua, republique nem reutilize; corte o próximo número beta ou o próximo patch
  mensal. Como `2026.6.5-beta.1` já foi publicado durante a
  transição, os trens de lançamento de junho de 2026 devem usar patch `5` ou superior. Não
  publique novos trens stable ou beta de junho de 2026 como `2026.6.2`, `2026.6.3` ou
  `2026.6.4`.
- Depois de stable `2026.6.5`, o próximo novo trem beta é `2026.6.6-beta.1`, mesmo
  que tags automatizadas apenas alpha com números de patch mais altos já existam.
- `latest` significa o lançamento npm stable promovido atual
- `beta` significa o destino atual de instalação beta
- Lançamentos stable e de correção stable publicam no npm `beta` por padrão; operadores de lançamento podem mirar `latest` explicitamente, ou promover uma build beta validada depois
- Todo lançamento stable do OpenClaw envia o pacote npm, o app para macOS e os instaladores
  assinados do Windows Hub juntos; lançamentos beta normalmente validam e publicam
  primeiro o caminho npm/pacote, com build/assinatura/notarização/promoção de app nativo
  reservado para stable, a menos que seja solicitado explicitamente

## Cadência de lançamentos

- Lançamentos avançam primeiro por beta
- Stable vem somente depois que o beta mais recente é validado
- Mantenedores normalmente cortam lançamentos a partir de um branch `release/YYYY.M.PATCH` criado
  a partir do `main` atual, para que a validação de lançamento e as correções não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de uma correção, os mantenedores cortam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  restritos aos mantenedores

## Checklist do operador de lançamento

Este checklist é o formato público do fluxo de lançamento. Credenciais privadas,
assinatura, notarização, recuperação de dist-tag e detalhes de rollback emergencial ficam no
runbook de lançamento restrito aos mantenedores.

1. Comece a partir do `main` atual: puxe o mais recente, confirme que o commit alvo foi enviado
   e confirme que o CI atual de `main` está suficientemente verde para criar um branch a partir dele.
2. Gere a seção superior de `CHANGELOG.md` a partir dos PRs mesclados e de todos os commits
   diretos desde a última tag de lançamento alcançável. Mantenha as entradas voltadas ao usuário,
   remova duplicatas entre entradas sobrepostas de PR/commit direto, faça commit da reescrita, envie,
   e faça rebase/pull mais uma vez antes de criar o branch.
3. Revise registros de compatibilidade de lançamento em
   `src/plugins/compat/registry.ts` e
   `src/commands/doctor/shared/deprecation-compat.ts`. Remova compatibilidade
   expirada somente quando o caminho de upgrade continuar coberto, ou registre por que ela é
   mantida intencionalmente.
4. Crie `release/YYYY.M.PATCH` a partir do `main` atual; não faça trabalho normal de lançamento
   diretamente em `main`.
5. Atualize todos os locais de versão necessários para a tag pretendida e execute
   `pnpm release:prep`. Ele atualiza versões de Plugins, inventário de Plugins, schema de config,
   metadados de config de canal empacotado, baseline da documentação de config, exports do SDK de Plugin
   e baseline da API do SDK de Plugin na ordem correta. Faça commit de qualquer desvio gerado
   antes de criar a tag. Depois execute o preflight determinístico local:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag,
   um SHA completo de 40 caracteres do branch de lançamento é permitido apenas para validação
   de preflight. O preflight gera evidência de lançamento de dependências para o
   grafo exato de dependências em checkout e a armazena no artefato de preflight do npm.
   Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para o
   branch de lançamento, tag ou SHA completo do commit. Este é o único ponto de entrada manual
   para as quatro grandes caixas de teste de lançamento: Vitest, Docker, QA Lab e Package.
8. Se a validação falhar, corrija no branch de lançamento e reexecute o menor arquivo, linha,
   job de workflow, perfil de pacote, provedor ou allowlist de modelo com falha que
   comprove a correção. Reexecute o guarda-chuva completo somente quando a superfície alterada tornar
   obsoleta a evidência anterior.
9. Para um candidato beta com tag, execute
   `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` a partir do branch
   `release/YYYY.M.PATCH` correspondente. Para stable, passe também o lançamento de origem
   do Windows obrigatório:
   `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`.
   O auxiliar executa as verificações locais de lançamento gerado, dispara ou verifica
   a validação completa de lançamento e a evidência de preflight do npm, executa prova de
   nova instalação/atualização do Parallels contra o tarball preparado exato mais a prova de pacote
   do Telegram, registra planos de npm de Plugins e ClawHub, e imprime o comando exato
   `OpenClaw Release Publish` somente depois que o pacote de evidências estiver verde.
   `OpenClaw Release Publish` despacha os pacotes de Plugins selecionados ou todos os publicáveis
   para o npm e o mesmo conjunto para o ClawHub em paralelo, e então promove o
   artefato de preflight npm preparado do OpenClaw com a dist-tag correspondente assim que
   a publicação npm dos Plugins for bem-sucedida.
   Depois que o filho de publicação npm do OpenClaw é bem-sucedido, ele cria ou atualiza a
   página correspondente de lançamento/pré-lançamento do GitHub a partir da seção completa correspondente de
   `CHANGELOG.md`. Lançamentos stable publicados no npm `latest` tornam-se o
   lançamento latest do GitHub; lançamentos de manutenção stable mantidos no npm `beta` são
   criados com GitHub `latest=false`. O workflow também envia a evidência de dependências
   do preflight, o manifesto de validação completa e a evidência de verificação de registro
   pós-publicação para o lançamento do GitHub para resposta a incidentes pós-lançamento.
   O workflow de publicação imprime IDs de execuções filhas imediatamente, aprova automaticamente
   gates de ambiente de lançamento que o token do workflow tem permissão para aprovar, resume
   jobs filhos com falha com finais de logs, conclui o lançamento do GitHub e a evidência de
   dependências assim que a publicação npm do OpenClaw é bem-sucedida, aguarda o ClawHub sempre que
   o npm do OpenClaw está sendo publicado, então executa `pnpm release:verify-beta` e
   envia evidência pós-publicação para o lançamento do GitHub, pacote npm, pacotes npm de Plugins
   selecionados, pacotes ClawHub selecionados, IDs de execução de workflows filhos e
   ID opcional da execução NPM Telegram. O caminho do ClawHub tenta novamente falhas transitórias de
   instalação de dependências da CLI, publica Plugins aprovados no preview mesmo quando uma
   célula de preview oscila, e termina com verificação de registro para toda versão esperada de
   Plugin, para que publicações parciais permaneçam visíveis e possam ser repetidas. Em seguida, execute a aceitação de pacote
   pós-publicação contra o pacote publicado
   `openclaw@YYYY.M.PATCH-beta.N` ou
   `openclaw@beta`. Se um pré-lançamento enviado ou publicado precisar de correção,
   corte o próximo número de pré-lançamento correspondente; não exclua nem reescreva o
   pré-lançamento antigo.
10. Para stable, continue somente depois que o beta validado ou candidato de lançamento tiver a
    evidência de validação obrigatória. A publicação npm stable também passa por
    `OpenClaw Release Publish`, reutilizando o artefato de preflight bem-sucedido via
    `preflight_run_id`; a prontidão do lançamento stable para macOS também exige o
    `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`.
    O workflow de publicação do macOS publica o appcast assinado no `main` público
    automaticamente depois que os assets de lançamento são verificados; se a proteção de branch bloquear o
    push direto, ele abre ou atualiza um PR do appcast. A prontidão do Windows Hub
    stable exige os assets assinados `OpenClawCompanion-Setup-x64.exe`,
    `OpenClawCompanion-Setup-arm64.exe` e
    `OpenClawCompanion-SHA256SUMS.txt` no lançamento do GitHub do OpenClaw.
    Passe a tag exata do lançamento assinado `openclaw/openclaw-windows-node` como
    `windows_node_tag` e seu mapa de digests de instaladores aprovado pelo candidato como
    `windows_node_installer_digests`; `OpenClaw Release Publish` mantém o
    rascunho do lançamento, despacha `Windows Node Release` e verifica os três
    assets antes da publicação.
11. Após a publicação, execute o verificador npm pós-publicação, o E2E opcional de Telegram
    standalone com npm publicado quando você precisar de prova de canal pós-publicação,
    promoção de dist-tag quando necessário, verifique a página de lançamento gerada do GitHub,
    execute as etapas de anúncio de lançamento e então conclua [Fechamento do main
    stable](#stable-main-closeout) antes de considerar um lançamento stable finalizado.

## Fechamento do main stable

A publicação stable não está completa até que `main` contenha o estado real do
lançamento enviado.

1. Comece a partir da `main` mais recente limpa. Audite `release/YYYY.M.PATCH` em relação a ela e
   encaminhe para a frente as correções reais que estão ausentes da `main`. Não mescle às cegas
   adaptadores de compatibilidade, teste ou validação exclusivos de release na `main` mais nova.
2. Defina a `main` para a versão estável enviada, não para uma linha futura especulativa. Execute
   `pnpm release:prep` após a alteração da versão raiz e depois
   `pnpm deps:shrinkwrap:generate`.
3. Faça a seção `## YYYY.M.PATCH` do `CHANGELOG.md` na `main` corresponder exatamente à
   branch de release marcada. Inclua a atualização estável de `appcast.xml` quando o release para mac
   tiver publicado uma.
4. Não adicione `YYYY.M.PATCH+1`, uma versão beta ou uma seção vazia de changelog futuro
   à `main` até que o operador inicie explicitamente essa linha de release.
5. Execute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` e
   `OPENCLAW_TESTBOX=1 pnpm check:changed`. Faça push e então verifique se `origin/main`
   contém a versão enviada e o changelog antes de chamar o release estável de
   concluído.
6. Mantenha as variáveis de repositório `RELEASE_ROLLBACK_DRILL_ID` e
   `RELEASE_ROLLBACK_DRILL_DATE` atualizadas após cada simulado privado de rollback.
   `Encerramento da Main Estável do OpenClaw` começa a partir do push para a `main` que carrega a
   versão enviada, o changelog e o appcast após a publicação estável. Ele lê
   evidências imutáveis pós-publicação para vincular a tag enviada às suas execuções de Validação Completa de Release
   e Publicação, depois verifica o estado estável da main, o release,
   o período obrigatório de observação estável e as evidências bloqueantes de desempenho. Ele anexa um
   manifesto imutável de encerramento e checksum ao release do GitHub. O gatilho automático
   por push ignora releases legados anteriores às evidências imutáveis pós-publicação;
   ele nunca trata essa ignorada como um encerramento concluído. Um encerramento completo
   exige ambos os ativos e um checksum correspondente. Um manifesto parcial
   reexecuta seu SHA registrado da `main` e o simulado de rollback para regenerar bytes
   idênticos, depois anexa o checksum ausente; um par inválido, ou um checksum
   sem manifesto, permanece bloqueante. Uma execução acionada por push sem variáveis de repositório
   do simulado de rollback é ignorada sem concluir o encerramento; um registro de simulado ausente ou
   com mais de 90 dias ainda bloqueia o encerramento manual respaldado por evidências.
   Comandos privados de recuperação permanecem no runbook exclusivo dos mantenedores.
   Use o despacho manual apenas para reparar ou reexecutar um encerramento estável respaldado por evidências.
   Uma tag legada de correção de fallback pode reutilizar evidências do pacote base somente quando
   a tag de correção resolve para o mesmo commit de origem que a tag estável base.
   Uma correção com origem diferente deve publicar e verificar suas próprias evidências de pacote.

## Pré-verificação de release

- Execute `pnpm check:test-types` antes da pré-verificação de release para que o TypeScript de teste permaneça coberto fora da porta local mais rápida `pnpm check`
- Execute `pnpm check:architecture` antes da pré-verificação de release para que as verificações mais amplas de ciclos de importação e limites de arquitetura estejam verdes fora da porta local mais rápida
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de release esperados em `dist/*` e o pacote da Control UI existam para a etapa de validação do pacote
- Execute `pnpm release:prep` após o incremento da versão raiz e antes de criar a tag. Ele executa todos os geradores determinísticos de release que costumam divergir após uma mudança de versão/configuração/API: versões de plugins, inventário de plugins, esquema de configuração base, metadados de configuração de canais incluídos, linha de base da documentação de configuração, exportações do Plugin SDK e linha de base da API do Plugin SDK. `pnpm release:check` executa novamente essas proteções em modo de verificação e relata todas as falhas de divergência gerada que encontrar em uma única passagem antes de executar as verificações de release de pacote.
- A sincronização de versões de plugins atualiza as versões de pacotes de plugins oficiais e os pisos `openclaw.compat.pluginApi` existentes para a versão de release do OpenClaw por padrão. Trate esse campo como o piso da API do Plugin SDK/runtime, não apenas como uma cópia da versão do pacote: para releases somente de plugin que intencionalmente permanecem compatíveis com hosts OpenClaw mais antigos, mantenha o piso na API de host mais antiga com suporte e documente essa escolha na prova de release do plugin.
- Execute o workflow manual `Full Release Validation` antes da aprovação de release para iniciar todas as caixas de teste pré-release a partir de um único ponto de entrada. Ele aceita uma branch, tag ou SHA completo de commit, dispara `CI` manual e dispara `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e linhas do Telegram. Execuções estáveis e completas sempre incluem live/E2E exaustivo e soak do caminho de release em Docker; `run_release_soak=true` é mantido para um soak beta explícito. A Package Acceptance fornece o E2E canônico de Telegram de pacote durante a validação do candidato, evitando um segundo poller live concorrente.
  Forneça `release_package_spec` após publicar um beta para reutilizar o pacote npm entregue nas verificações de release, Package Acceptance e E2E de Telegram de pacote sem reconstruir o tarball de release. Forneça `npm_telegram_package_spec` somente quando o Telegram deve usar um pacote publicado diferente do restante da validação de release. Forneça `package_acceptance_package_spec` quando Package Acceptance deve usar um pacote publicado diferente da especificação de pacote de release. Forneça `evidence_package_spec` quando o relatório de evidências de release deve provar que a validação corresponde a um pacote npm publicado sem forçar o E2E de Telegram.
  Exemplo:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH`
- Execute o workflow manual `Package Acceptance` quando quiser prova por canal lateral para um candidato de pacote enquanto o trabalho de release continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata de release; `source=ref` para empacotar uma branch/tag/SHA confiável de `package_ref` com o harness `workflow_ref` atual; `source=url` para um tarball HTTPS público com SHA-256 obrigatório e política estrita de URL pública; `source=trusted-url` para uma política de fonte confiável nomeada usando `trusted_source_id` obrigatório e SHA-256; ou `source=artifact` para um tarball enviado por outra execução do GitHub Actions. O workflow resolve o candidato para `package-under-test`, reutiliza o agendador de release de Docker E2E contra esse tarball e pode executar QA do Telegram contra o mesmo tarball com `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as linhas Docker selecionadas incluem `published-upgrade-survivor`, o artefato de pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada. `update-restart-auth` usa o pacote candidato como a CLI instalada e como package-under-test para exercitar o caminho de reinicialização gerenciada do comando de atualização do candidato.
  Exemplo: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai`
  Perfis comuns:
  - `smoke`: linhas de instalação/canal/agente, rede de Gateway e recarregamento de configuração
  - `package`: linhas nativas de artefato para pacote/atualização/reinicialização/plugin sem OpenWebUI nem ClawHub live
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente,
    pesquisa web da OpenAI e OpenWebUI
  - `full`: blocos do caminho de release em Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma nova execução focada
- Execute o workflow manual `CI` diretamente quando precisar apenas de cobertura determinística normal de CI para o candidato de release. Disparos manuais de CI ignoram o escopo de mudanças e forçam os shards Linux Node, shards de plugins incluídos, shards de contratos de plugin e canal, compatibilidade com Node 22, `check-*`, `check-additional-*`, verificações smoke de artefatos construídos, verificações de documentação, Skills Python, Windows, macOS e linhas de i18n da Control UI. Execuções manuais autônomas de CI executam Android somente quando disparadas com `include_android=true`; `Full Release Validation` passa essa entrada para seu filho de CI.
  Exemplo com Android: `gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true`
- Execute `pnpm qa:otel:smoke` ao validar telemetria de release. Ele exercita o QA-lab por meio de um receptor OTLP/HTTP local e verifica a exportação de traces, métricas e logs, além de atributos de trace limitados e redação de conteúdo/identificadores sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm qa:otel:collector-smoke` ao validar compatibilidade com coletor. Ele roteia a mesma exportação OTLP do QA-lab por um contêiner Docker real do OpenTelemetry Collector antes das asserções do receptor local.
- Execute `pnpm qa:prometheus:smoke` ao validar scraping protegido do Prometheus. Ele exercita o QA-lab, rejeita scrapes não autenticados e verifica que famílias de métricas críticas de release permaneçam livres de conteúdo de prompts, identificadores brutos, tokens de autenticação e caminhos locais.
- Execute `pnpm qa:observability:smoke` quando quiser executar em sequência as linhas smoke de OpenTelemetry e Prometheus do checkout de origem.
- Execute `pnpm release:check` antes de todo release com tag
- A pré-verificação de `OpenClaw NPM Release` gera evidências de release de dependências antes de empacotar o tarball npm. A porta de vulnerabilidades de avisos npm bloqueia o release. O risco do manifesto transitivo, a superfície de propriedade/instalação de dependências e os relatórios de mudanças de dependências são apenas evidências de release. O relatório de mudanças de dependências compara o candidato de release com a tag de release alcançável anterior.
- A pré-verificação envia evidências de dependências como `openclaw-release-dependency-evidence-<tag>` e também as incorpora em `dependency-evidence/` dentro do artefato de pré-verificação npm preparado. O caminho real de publicação reutiliza esse artefato de pré-verificação e então anexa as mesmas evidências ao release do GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Execute `OpenClaw Release Publish` para a sequência mutante de publicação depois que a tag existir. Dispare-o a partir de `release/YYYY.M.PATCH` (ou `main` ao publicar uma tag alcançável a partir de main), passe a tag de release, o `preflight_run_id` npm do OpenClaw bem-sucedido e o `full_release_validation_run_id` bem-sucedido, e mantenha o escopo padrão de publicação de plugins `all-publishable`, a menos que você esteja executando deliberadamente um reparo focado. O workflow serializa a publicação npm de plugins, a publicação de plugins no ClawHub e a publicação npm do OpenClaw para que o pacote core não seja publicado antes de seus plugins externalizados.
- Um `OpenClaw Release Publish` estável exige um `windows_node_tag` exato depois que o release não pré-release correspondente de `openclaw/openclaw-windows-node` existir. Ele também exige o mapa `windows_node_installer_digests` aprovado para o candidato. Antes de disparar qualquer filho de publicação, ele verifica que o release de origem está publicado, não é pré-release, contém os instaladores x64/ARM64 obrigatórios e ainda corresponde a esse mapa aprovado. Em seguida, dispara `Windows Node Release` enquanto o release do OpenClaw ainda é um rascunho, carregando o mapa fixado de hashes de instaladores sem alterações. O workflow filho baixa os instaladores assinados do Windows Hub dessa tag exata, compara-os com os hashes fixados, verifica em um runner Windows se suas assinaturas Authenticode usam o signatário esperado da OpenClaw Foundation, grava um manifesto SHA-256 e envia os instaladores mais o manifesto para o release canônico do GitHub do OpenClaw; depois baixa novamente os assets promovidos e verifica a associação ao manifesto e os hashes. O pai verifica o contrato atual de assets x64, ARM64 e checksum antes da publicação. A recuperação direta rejeita nomes inesperados de assets `OpenClawCompanion-*` antes de substituir os assets esperados do contrato pelos bytes de origem fixados. Dispare manualmente `Windows Node Release` somente para recuperação e sempre passe uma tag exata, nunca `latest`, além do mapa JSON explícito `expected_installer_digests` do release de origem aprovado. Links de download do site devem apontar para URLs exatas de assets de release do OpenClaw para o release estável atual, ou para `releases/latest/download/...` somente após verificar que o redirecionamento de latest do GitHub aponta para esse mesmo release; não crie links apenas para a página de release do repositório companion.
- As verificações de release agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa a linha de paridade mock do QA Lab mais o perfil live rápido do Matrix e a linha de QA do Telegram antes da aprovação de release. As linhas live usam o ambiente `qa-live-shared`; o Telegram também usa leases de credenciais de CI do Convex. Execute o workflow manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser o inventário completo de transporte, mídia e E2EE do Matrix em paralelo.
- A validação de runtime de instalação e upgrade entre sistemas operacionais faz parte dos workflows públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o workflow reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa separação é intencional: manter o caminho real de release npm curto, determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua própria linha para não atrasarem nem bloquearem a publicação
- Verificações de release que carregam segredos devem ser disparadas por meio de `Full Release Validation` ou a partir da referência de workflow `main`/release para que a lógica do workflow e os segredos permaneçam controlados
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que o commit resolvido seja alcançável a partir de uma branch ou tag de release do OpenClaw
- A pré-verificação somente de validação de `OpenClaw NPM Release` também aceita o SHA completo de 40 caracteres do commit atual da branch de workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` somente para a verificação de metadados do pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação não mutante pode usar os runners Linux maiores da Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A pré-verificação de release npm não aguarda mais a linha separada de verificações de release
- Antes de criar localmente a tag de um candidato de release, execute
  `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. O helper executa as proteções rápidas de release, verificações de release npm/ClawHub de plugins, build, build da UI e `release:openclaw:npm:check` na ordem que captura erros comuns que bloqueiam aprovação antes do início do workflow de publicação do GitHub.
- Execute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação
  do registro publicado em um prefixo temporário novo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar o onboarding do pacote instalado, a configuração do Telegram e o E2E real do Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais locadas do Telegram.
  Execuções locais pontuais de mantenedores podem omitir as variáveis Convex e passar as três
  credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*` diretamente.
- Para executar o smoke beta completo pós-publicação a partir da máquina de um mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O auxiliar executa validação de atualização npm/fresh-target do Parallels, dispara `NPM Telegram Beta E2E`, consulta a execução exata do workflow, baixa o artefato e imprime o relatório do Telegram.
- Mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions via o
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda em todo merge.
- A automação de release dos mantenedores agora usa preflight-then-promote:
  - a publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.PATCH` da execução de preflight bem-sucedida
  - releases npm estáveis usam `beta` por padrão
  - a publicação npm estável pode direcionar para `latest` explicitamente via entrada do workflow
  - a mutação de dist-tag npm baseada em token agora fica em
    `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` porque
    `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o repositório de origem mantém
    publicação apenas com OIDC
  - `macOS Release` público é apenas validação; quando uma tag existe apenas em uma
    branch de release, mas o workflow é disparado a partir de `main`, defina
    `public_release_branch=release/YYYY.M.PATCH`
  - a publicação macOS real deve passar por `preflight_run_id` e
    `validate_run_id` macOS bem-sucedidos
  - os caminhos de publicação reais promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para releases estáveis de correção como `YYYY.M.PATCH-N`, o verificador pós-publicação
  também verifica o mesmo caminho de atualização com prefixo temporário de `YYYY.M.PATCH` para `YYYY.M.PATCH-N`
  para que correções de release não possam deixar silenciosamente instalações globais antigas no
  payload estável base
- O preflight de release npm falha fechado a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio de `dist/control-ui/assets/`
  para que não publiquemos novamente um dashboard de navegador vazio
- A verificação pós-publicação também verifica se os pontos de entrada de Plugin publicados e
  os metadados do pacote estão presentes no layout instalado do registro. Uma release que
  publica payloads de runtime de Plugin ausentes falha no verificador pós-publicação e
  não pode ser promovida para `latest`.
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do npm pack no
  tarball de atualização candidato, para que o e2e do instalador capture inchaço acidental do pacote
  antes do caminho de publicação da release
- Se o trabalho de release tocou no planejamento de CI, manifestos de tempo de extensões ou
  matrizes de teste de extensões, regenere e revise as saídas de matriz
  `plugin-prerelease-extension-shard` de propriedade do planejador em
  `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de release não
  descrevam um layout de CI obsoleto
- A prontidão de release estável para macOS também inclui as superfícies do atualizador:
  - a release do GitHub deve acabar com os `.zip`, `.dmg` e `.dSYM.zip` empacotados
  - `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação; o
    workflow de publicação macOS faz o commit dele automaticamente ou abre um PR de appcast
    quando o push direto é bloqueado
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle
    não vazia e um `CFBundleVersion` igual ou acima do piso canônico de build do Sparkle
    para essa versão de release

## Caixas de teste de release

`Full Release Validation` é como operadores iniciam todos os testes pré-release a partir de
um único ponto de entrada. Para uma prova de commit fixado em uma branch que muda rápido, use o
auxiliar para que cada workflow filho execute a partir de uma branch temporária fixada no SHA
de destino:

```bash
pnpm ci:full-release --sha <full-sha>
```

O auxiliar envia `release-ci/<sha>-...`, despacha `Full Release Validation`
a partir dessa branch com `ref=<sha>`, verifica se cada `headSha` de workflow filho
corresponde ao destino e então exclui a branch temporária. Isso evita provar por
acidente uma execução filha de um `main` mais recente.

Para validação de branch ou tag de release, execute a partir da ref confiável do workflow
`main` e passe a branch ou tag de release como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

O workflow resolve a ref de destino, despacha o `CI` manual com
`target_ref=<release-ref>` e então despacha `OpenClaw Release Checks`.
`OpenClaw Release Checks` distribui smoke de instalação, verificações de release
cross-OS, cobertura live/E2E do caminho de release em Docker quando o soak está ativado,
Package Acceptance com o E2E canônico do pacote Telegram, paridade do QA Lab, Matrix live e
Telegram live. Uma execução full/all só é aceitável quando o resumo de `Full Release Validation`
mostra `normal_ci`, `plugin_prerelease` e `release_checks` como
bem-sucedidos, a menos que uma reexecução focada tenha pulado intencionalmente o filho separado
`Plugin Prerelease`. Use o filho independente `npm-telegram` somente para uma reexecução focada
de pacote publicado com `release_package_spec` ou
`npm_telegram_package_spec`. O resumo final do verificador inclui tabelas dos jobs mais lentos
para cada execução filha, para que o gerente de release veja o caminho crítico atual sem baixar logs.
Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para a
matriz completa de estágios, nomes exatos dos jobs do workflow, diferenças entre os perfis stable e full,
artefatos e identificadores de reexecução focada.
Workflows filhos são despachados a partir da ref confiável que executa `Full Release
Validation`, normalmente `--ref main`, mesmo quando a `ref` de destino aponta para uma
branch ou tag de release mais antiga. Não há uma entrada separada de ref do workflow
Full Release Validation; escolha o harness confiável escolhendo a ref de execução do workflow.
Não use `--ref main -f ref=<sha>` para prova exata de commit no `main` móvel;
SHAs brutos de commit não podem ser refs de despacho de workflow, então use
`pnpm ci:full-release --sha <sha>` para criar a branch temporária fixada.

Use `release_profile` para selecionar a abrangência live/provedor:

- `minimum`: caminho OpenAI/core live e Docker crítico de release mais rápido
- `stable`: minimum mais cobertura estável de provedor/backend para aprovação de release
- `full`: stable mais cobertura ampla consultiva de provedor/mídia

As validações stable e full sempre executam a varredura exaustiva live/E2E, do caminho
de release em Docker e de sobrevivência a upgrade publicado limitada antes da promoção.
Use `run_release_soak=true` para solicitar essa mesma varredura para um beta. Essa varredura cobre
os quatro pacotes stable mais recentes, mais as bases fixadas `2026.4.23` e `2026.5.2`,
além da cobertura mais antiga `2026.4.15`, com bases duplicadas removidas e
cada base fragmentada em seu próprio job de executor Docker.

`OpenClaw Release Checks` usa a ref confiável do workflow para resolver a ref de destino
uma vez como `release-package-under-test` e reutiliza esse artefato em verificações cross-OS,
Package Acceptance e Docker de caminho de release quando o soak é executado. Isso mantém
todas as caixas voltadas a pacote nos mesmos bytes e evita builds repetidos de pacote.
Depois que um beta já estiver no npm, defina `release_package_spec=openclaw@YYYY.M.PATCH-beta.N`
para que as verificações de release baixem o pacote enviado uma vez, extraiam o SHA da origem
do build de `dist/build-info.json` e reutilizem esse artefato para lanes cross-OS,
Package Acceptance, Docker de caminho de release e Telegram de pacote.
O smoke de instalação cross-OS OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a
variável do repo/organização está definida; caso contrário, usa `openai/gpt-5.4`, porque esta lane está
provando instalação do pacote, onboarding, inicialização do Gateway e uma rodada live de agente,
não fazendo benchmark do modelo padrão mais lento. A matriz live mais ampla de provedores
continua sendo o lugar para cobertura específica de modelo.

Use estas variantes dependendo do estágio do release:

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

Não use o guarda-chuva completo como primeira reexecução após uma correção focada. Se uma caixa
falhar, use o workflow filho, job, lane Docker, perfil de pacote, provedor de modelo
ou lane de QA que falhou para a próxima prova. Execute o guarda-chuva completo novamente somente quando
a correção alterar a orquestração compartilhada de release ou tornar obsoleta a evidência all-box anterior.
O verificador final do guarda-chuva verifica novamente os ids registrados das execuções de workflow filho,
então, depois que um workflow filho for reexecutado com sucesso, reexecute somente o job pai
`Verify full validation` que falhou.

Para recuperação limitada, passe `rerun_group` para o guarda-chuva. `all` é a execução real
de candidato a release, `ci` executa apenas o filho de CI normal, `plugin-prerelease`
executa apenas o filho de Plugin exclusivo de release, `release-checks` executa todas as caixas
de release, e os grupos de release mais estreitos são `install-smoke`, `cross-os`,
`live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`.
Reexecuções focadas de `npm-telegram` exigem `release_package_spec` ou
`npm_telegram_package_spec`; execuções full/all usam o E2E canônico do pacote Telegram
dentro de Package Acceptance. Reexecuções focadas
cross-OS podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou
outro filtro de OS/suite. Falhas de release-check de QA bloqueiam a validação normal de release,
incluindo o drift obrigatório de ferramentas dinâmicas OpenClaw no tier padrão.
Execuções alpha do Tideclaw ainda podem tratar lanes de release-check que não sejam de segurança de pacote como
consultivas. Quando `live_suite_filter` solicita explicitamente uma lane QA live com gate, como
Discord, WhatsApp ou Slack, a variável de repo
`OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` correspondente deve estar ativada; caso contrário,
a captura de entrada falha em vez de pular a lane silenciosamente.

### Vitest

A caixa Vitest é o workflow filho `CI` manual. O CI manual intencionalmente
ignora o escopo de alterações e força o grafo normal de testes para o candidato a release:
shards Linux Node, shards de bundled-plugin, shards de contrato de Plugin e canal,
compatibilidade com Node 22, `check-*`, `check-additional-*`,
smokes de artefato buildado, verificações de docs, Skills Python, Windows, macOS
e i18n da Control UI. Android é incluído quando `Full Release Validation` executa a
caixa porque o guarda-chuva passa `include_android=true`; CI manual independente
exige `include_android=true` para cobertura Android.

Use esta caixa para responder "a árvore de origem passou pela suíte normal completa de testes?"
Ela não é igual à validação de produto no caminho de release. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução `CI` despachada
- execução `CI` verde no SHA de destino exato
- nomes de shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de tempo do Vitest, como `.artifacts/vitest-shard-timings.json`, quando
  uma execução precisa de análise de desempenho

Execute CI manual diretamente somente quando o release precisar de CI normal determinístico, mas
não das caixas Docker, QA Lab, live, cross-OS ou pacote. Use o primeiro comando
para CI direto sem Android. Adicione `include_android=true` quando o CI direto de
candidato a release precisar cobrir Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

A caixa Docker vive em `OpenClaw Release Checks` por meio de
`openclaw-live-and-e2e-checks-reusable.yml`, além do workflow `install-smoke`
em modo release. Ela valida o candidato a release por meio de ambientes Docker
empacotados, em vez de apenas testes em nível de origem.

A cobertura Docker de release inclui:

- smoke completo de instalação com o smoke lento de instalação global Bun ativado
- preparação/reutilização da imagem smoke do Dockerfile raiz por SHA de destino, com QR,
  raiz/Gateway e jobs de smoke instalador/Bun executando como shards install-smoke separados
- lanes E2E do repositório
- chunks Docker de caminho de release: `core`, `package-update-openai`,
  `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`,
  `plugins-runtime-services`,
  `plugins-runtime-install-a`, `plugins-runtime-install-b`,
  `plugins-runtime-install-c`, `plugins-runtime-install-d`,
  `plugins-runtime-install-e`, `plugins-runtime-install-f`,
  `plugins-runtime-install-g` e `plugins-runtime-install-h`
- cobertura OpenWebUI dentro do chunk `plugins-runtime-services` quando solicitada
- lanes divididas de instalação/desinstalação de Plugin empacotado
  `bundled-plugin-install-uninstall-0` até
  `bundled-plugin-install-uninstall-23`
- suítes de provedores live/E2E e cobertura de modelo live em Docker quando as verificações de release
  incluem suítes live

Use artefatos Docker antes de reexecutar. O agendador de caminho de release faz upload de
`.artifacts/docker-tests/` com logs de lanes, `summary.json`, `failures.json`,
tempos de fases, JSON do plano do agendador e comandos de reexecução. Para recuperação focada,
use `docker_lanes=<lane[,lane]>` no workflow reutilizável live/E2E em vez de
reexecutar todos os chunks de release. Comandos de reexecução gerados incluem
`package_artifact_run_id` anterior e entradas de imagem Docker preparada quando disponíveis, para que uma
lane com falha possa reutilizar o mesmo tarball e imagens GHCR.

### QA Lab

A caixa QA Lab também faz parte de `OpenClaw Release Checks`. Ela é o gate de release
de comportamento agentic e em nível de canal, separado da mecânica de pacote do Vitest e Docker.

A cobertura QA Lab de release inclui:

- lane de paridade mock comparando a lane candidata OpenAI com a base Opus 4.6
  usando o pacote de paridade agentic
- perfil rápido de QA Matrix live usando o ambiente `qa-live-shared`
- lane QA Telegram live usando leases de credenciais CI do Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`,
  `pnpm qa:prometheus:smoke` ou
  `pnpm qa:observability:smoke` quando a telemetria de release precisa de prova local explícita

Use esta caixa para responder "o release se comporta corretamente em cenários de QA e
fluxos de canais live?" Mantenha as URLs de artefato das lanes de paridade, Matrix e Telegram
ao aprovar o release. A cobertura Matrix completa continua disponível como uma
execução QA-Lab manual em shards, não como a lane padrão crítica de release.

### Pacote

A caixa Package é o gate do produto instalável. Ela é apoiada por
`Package Acceptance` e pelo resolvedor
`scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um
candidato no tarball `package-under-test` consumido pelo Docker E2E, valida
o inventário do pacote, registra a versão do pacote e SHA-256 e mantém a
ref do harness do workflow separada da ref de origem do pacote.

Origens de candidato compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento do OpenClaw
- `source=ref`: empacote uma branch, tag ou SHA completo de commit `package_ref` confiável
  com o harness `workflow_ref` selecionado
- `source=url`: baixe um `.tgz` HTTPS público com `package_sha256` obrigatório;
  credenciais de URL, portas HTTPS não padrão, nomes de host ou endereços resolvidos privados/internos/de uso especial
  e redirecionamentos inseguros são rejeitados
- `source=trusted-url`: baixe um `.tgz` HTTPS com
  `package_sha256` e `trusted_source_id` obrigatórios de uma política nomeada em
  `.github/package-trusted-sources.json`; use isto para espelhos empresariais
  ou repositórios de pacotes privados mantidos por mantenedores, em vez de adicionar um
  bypass de rede privada no nível da entrada a `source=url`
- `source=artifact`: reutilize um `.tgz` carregado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa a Aceitação de Pacote com `source=artifact`, o
artefato de pacote de lançamento preparado, `suite_profile=custom`,
`docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update`,
`telegram_mode=mock-openai`. A Aceitação de Pacote mantém migração, atualização,
reinicialização de atualização com autenticação configurada, instalação de skill ativa do ClawHub, limpeza de dependências obsoletas de plugins, fixtures de plugin offline, atualização de plugin e QA do pacote Telegram contra o mesmo tarball resolvido. As verificações de lançamento bloqueantes usam a linha de base padrão do pacote publicado mais recente; o perfil beta com `run_release_soak=true`, `release_profile=stable` ou
`release_profile=full` expande para todas as linhas de base estáveis publicadas no npm de
`2026.4.23` até `latest`, além de fixtures de problemas reportados. Use a
Aceitação de Pacote com `source=npm` para um candidato já lançado,
`source=ref` para um tarball npm local apoiado por SHA antes da publicação,
`source=trusted-url` para um espelho empresarial/privado mantido por mantenedores ou
`source=artifact` para um tarball preparado carregado por outra execução do GitHub Actions.
Ela é a substituição nativa do GitHub
para a maior parte da cobertura de pacote/atualização que antes exigia
Parallels. Verificações de lançamento entre sistemas operacionais ainda são importantes para integração inicial específica de SO,
instalador e comportamento de plataforma, mas a validação de produto de pacote/atualização deve
preferir a Aceitação de Pacote.

A checklist canônica para validação de atualização e plugin é
[Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao
decidir qual faixa local, Docker, Aceitação de Pacote ou verificação de lançamento comprova uma
instalação/atualização de plugin, limpeza do doctor ou alteração de migração de pacote publicado.
A migração exaustiva de atualização publicada de cada pacote estável `2026.4.23+` é
um workflow manual separado `Update Migration`, não parte do CI Completo de Lançamento.

A leniência legada da aceitação de pacote é intencionalmente limitada no tempo. Pacotes até
`2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas
no npm: entradas privadas de inventário de QA ausentes do tarball, ausência de
`gateway install --wrapper`, arquivos de patch ausentes na fixture git derivada do tarball,
ausência de `update.channel` persistido, locais legados de registros de instalação de plugin,
ausência de persistência de registros de instalação do marketplace e migração de metadados de configuração
durante `plugins update`. O pacote publicado `2026.4.26` pode avisar
sobre arquivos locais de carimbo de metadados de build que já foram lançados. Pacotes posteriores
devem satisfazer os contratos modernos de pacote; essas mesmas lacunas falham na validação
de lançamento.

Use perfis mais amplos da Aceitação de Pacote quando a questão de lançamento for sobre um
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

- `smoke`: faixas rápidas de instalação/canal/agente de pacote, rede do Gateway e recarregamento de configuração
- `package`: contratos de pacote de instalação/atualização/reinicialização/plugin, além de prova ativa de instalação de skill do ClawHub; este é o padrão de verificação de lançamento
- `product`: `package` mais canais MCP, limpeza de cron/subagente, busca na Web da OpenAI e OpenWebUI
- `full`: blocos de caminho de lançamento Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções focadas

Para prova do Telegram de candidato a pacote, habilite `telegram_mode=mock-openai` ou
`telegram_mode=live-frontier` na Aceitação de Pacote. O workflow passa o
tarball resolvido `package-under-test` para a faixa do Telegram; o workflow independente
do Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de lançamento

`OpenClaw Release Publish` é o ponto de entrada mutável normal de publicação. Ele
orquestra os workflows de publicador confiável na ordem de que o lançamento precisa:

1. Fazer checkout da tag de lançamento e resolver seu SHA de commit.
2. Verificar se a tag é alcançável a partir de `main` ou `release/*`.
3. Executar `pnpm plugins:sync:check`.
4. Disparar `Plugin NPM Release` com `publish_scope=all-publishable` e
   `ref=<release-sha>`.
5. Disparar `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Disparar `OpenClaw NPM Release` com a tag de lançamento, a dist-tag do npm e
   o `preflight_run_id` salvo após verificar o
   `full_release_validation_run_id` salvo.
7. Para lançamentos estáveis, criar ou atualizar o lançamento do GitHub como rascunho, disparar
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

Promoção estável diretamente para `latest` é explícita:

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
central não possa ser lançado sem todos os plugins oficiais publicáveis, incluindo
`@openclaw/diffs-language-pack`. Para um reparo de plugin selecionado, defina
`publish_openclaw_npm=false` com `plugin_publish_scope=selected` e
`plugins=@openclaw/name`, ou dispare o workflow filho diretamente.

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA de commit
  completo de 40 caracteres da branch de workflow atual para preflight somente de validação
- `preflight_only`: `true` somente para validação/build/pacote, `false` para o
  caminho real de publicação
- `preflight_run_id`: obrigatório no caminho real de publicação para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória; já deve existir
- `preflight_run_id`: id de execução de preflight bem-sucedido de `OpenClaw NPM Release`;
  obrigatório quando `publish_openclaw_npm=true`
- `full_release_validation_run_id`: id de execução bem-sucedida de `Full Release Validation`;
  obrigatório quando `publish_openclaw_npm=true`
- `windows_node_tag`: tag de lançamento exata e não pré-lançamento de `openclaw/openclaw-windows-node`;
  obrigatória para publicação estável do OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto aprovado pelo candidato dos
  nomes atuais de instaladores do Windows para seus digests `sha256:` fixados; obrigatório
  para publicação estável do OpenClaw
- `npm_dist_tag`: tag de destino do npm para o pacote OpenClaw
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente
  para trabalho focado de reparo apenas de plugin com `publish_openclaw_npm=false`
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgula quando
  `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina `false` somente ao usar o
  workflow como orquestrador de reparo apenas de plugin
- `wait_for_clawhub`: o padrão é `false`, para que a disponibilidade no npm não seja bloqueada pelo
  sidecar do ClawHub; defina `true` somente quando a conclusão do workflow precisar incluir
  a conclusão do ClawHub

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA completo de commit a validar. Verificações com secrets
  exigem que o commit resolvido seja alcançável a partir de uma branch do OpenClaw ou
  tag de lançamento.
- `run_release_soak`: opte por soak exaustivo ativo/E2E, caminho de lançamento Docker e
  soak de upgrade-survivor desde todos os lançamentos para verificações de lançamento beta. Ele é forçado por
  `release_profile=stable` e `release_profile=full`.

Regras:

- Tags estáveis e de correção podem publicar para `beta` ou `latest`
- Tags de pré-lançamento beta podem publicar somente para `beta`
- Para `OpenClaw NPM Release`, entrada de SHA completo de commit é permitida somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre
  somente validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de a publicação continuar

## Sequência de lançamento npm estável

Ao preparar um lançamento npm estável:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA do commit atual completo da branch
     do workflow para uma execução de simulação somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta primeiro, ou `latest` somente
   quando você quiser intencionalmente uma publicação estável direta
3. Execute `Full Release Validation` na branch de release, tag de release ou SHA completo
   do commit quando quiser CI normal mais cobertura de cache de prompts ao vivo, Docker, QA Lab,
   Matrix e Telegram em um único workflow manual
4. Se você intencionalmente precisar apenas do grafo determinístico normal de testes, execute o
   workflow manual `CI` na ref de release em vez disso
5. Selecione a tag de release exata não pré-release de `openclaw/openclaw-windows-node`
   cujos instaladores assinados x64 e ARM64 devem ser enviados. Salve-a como
   `windows_node_tag` e salve o mapa de digests validados deles como
   `windows_node_installer_digests`. O auxiliar de candidato a release registra ambos
   e os inclui no comando de publicação gerado.
6. Salve o `preflight_run_id` e o `full_release_validation_run_id` bem-sucedidos
7. Execute `OpenClaw Release Publish` com a mesma `tag`, o mesmo `npm_dist_tag`,
   o `windows_node_tag` selecionado, seu `windows_node_installer_digests` salvo,
   o `preflight_run_id` salvo e o `full_release_validation_run_id` salvo;
   ele publica plugins externalizados no npm e no ClawHub antes de promover o
   pacote npm do OpenClaw
8. Se a release entrou em `beta`, use o workflow
   `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão estável de `beta` para `latest`
9. Se a release foi publicada intencionalmente diretamente em `latest` e `beta`
   deve acompanhar imediatamente a mesma build estável, use esse mesmo workflow de release
   para apontar ambas as dist-tags para a versão estável, ou deixe a sincronização
   programada de autorrecuperação mover `beta` depois

A mutação de dist-tag fica no repositório de ledger de releases porque ainda exige
`NPM_TOKEN`, enquanto o repositório de origem mantém publicação somente com OIDC.

Isso mantém o caminho de publicação direta e o caminho de promoção beta primeiro
documentados e visíveis para operadores.

Se um mantenedor precisar recorrer à autenticação npm local, execute quaisquer comandos
da CLI (`op`) do 1Password somente dentro de uma sessão tmux dedicada. Não chame `op`
diretamente pelo shell principal do agente; mantê-lo dentro do tmux torna prompts,
alertas e o tratamento de OTP observáveis e evita alertas repetidos do host.

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
