---
read_when:
    - Procurando definições de canais de lançamento públicos
    - Executando a validação da versão ou a aceitação do pacote
    - Em busca da nomenclatura e da cadência das versões
summary: Canais de lançamento, checklist do operador, ambientes de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-07-12T15:34:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

O OpenClaw atualmente disponibiliza três canais de atualização voltados ao usuário:

- stable: o canal de versão promovida existente, que ainda é resolvido pelo `latest` do npm até que o marco separado de CLI/canal seja implementado
- beta: tags de pré-lançamento publicadas no `beta` do npm
- dev: a ponta móvel de `main`

Separadamente, os operadores de lançamento podem publicar no `extended-stable`
do npm o pacote principal do último mês concluído, começando no patch `33`. A
linha final regular do mês atual continua no `latest` do npm; essa separação de
publicação do lado do operador não altera, por si só, a resolução dos canais de
atualização da CLI.

As compilações alfa do Tideclaw são uma trilha interna separada de pré-lançamento (dist-tag `alpha` do npm), abordada em [Entradas do fluxo de trabalho do NPM](#npm-workflow-inputs) e [Caixas de teste de lançamento](#release-test-boxes).

## Nomenclatura de versões

- Versão mensal de lançamento extended-stable do npm: `YYYY.M.PATCH`, com `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Versão final diária/regular: `YYYY.M.PATCH`, com `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Versão regular de correção de contingência: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Versão beta de pré-lançamento: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Versão alfa de pré-lançamento: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Nunca preencha o mês ou o patch com zeros à esquerda
- `PATCH` é um número sequencial do ciclo mensal de lançamentos, não um dia do calendário. Versões finais regulares e beta avançam o ciclo atual; tags exclusivas de alfa nunca consomem nem avançam o número de patch beta/regular, portanto ignore tags legadas exclusivas de alfa com números de patch maiores ao selecionar um ciclo beta ou regular.
- Compilações alfa/noturnas usam o próximo ciclo de patch ainda não lançado e incrementam apenas `alpha.N` em compilações repetidas. Assim que esse patch tiver uma versão beta, as novas compilações alfa passam para o patch seguinte.
- As versões do npm são imutáveis: nunca exclua, republique nem reutilize uma tag publicada. Crie o próximo número de pré-lançamento ou o próximo patch mensal.
- `latest` continua acompanhando a linha npm regular/diária atual; `beta` é o destino atual de instalação beta
- `extended-stable` significa o pacote npm compatível do mês anterior, começando no patch `33`; o patch `34` e posteriores são versões de manutenção dessa linha mensal
- Versões finais regulares e correções regulares são publicadas no `beta` do npm por padrão; os operadores de lançamento podem definir `latest` explicitamente ou promover posteriormente uma compilação beta validada
- O caminho mensal dedicado de extended-stable publica o pacote principal do npm e todos os plugins oficiais publicáveis no npm com exatamente a mesma versão. Ele não publica plugins no ClawHub nem publica artefatos do macOS ou Windows, uma versão no GitHub, dist-tags de repositórios privados, imagens Docker, artefatos móveis ou downloads do site.
- Cada versão final regular disponibiliza em conjunto o pacote npm, o aplicativo para macOS, o APK autônomo assinado para Android e os instaladores assinados do Hub para Windows. As versões beta normalmente validam e publicam primeiro o caminho npm/pacote, enquanto a compilação/assinatura/notarização/promoção de aplicativos nativos fica reservada para a versão final regular, salvo solicitação explícita.

## Cadência de lançamentos

- Os lançamentos avançam primeiro para beta; stable vem somente após a validação da versão beta mais recente
- Os mantenedores normalmente criam lançamentos a partir de uma ramificação `release/YYYY.M.PATCH` criada com base na `main` atual, para que a validação e as correções de lançamento não bloqueiem novos desenvolvimentos em `main`
- Se uma tag beta já tiver sido enviada ou publicada e precisar de uma correção, os mantenedores criam a próxima tag `-beta.N` em vez de excluir ou recriar a antiga
- O procedimento detalhado de lançamento, as aprovações, as credenciais e as observações de recuperação são exclusivos dos mantenedores

## Publicação mensal extended-stable somente no npm

Esta é uma exceção dedicada ao procedimento regular de lançamento abaixo. Para
um mês concluído `YYYY.M`, crie `extended-stable/YYYY.M.33`; publique
`vYYYY.M.33` e os patches de manutenção posteriores a partir dessa mesma
ramificação. A tag de lançamento, a ponta da ramificação, o checkout, a versão
do pacote, a pré-verificação do npm e a execução da Validação Completa de
Lançamento devem identificar o mesmo commit. A `main` protegida já deve conter
uma versão final de um mês de calendário estritamente posterior com patch
inferior a `33`; os patches de manutenção permanecem elegíveis depois que a
`main` avança mais de um mês.

Na ramificação extended-stable exata, atualize o pacote raiz para `YYYY.M.P`,
execute `pnpm release:prep` e verifique se cada pacote de extensão publicável
tem a mesma versão. Faça commit e push de todas as alterações geradas, crie e
envie a tag imutável `vYYYY.M.P` nesse commit e registre o SHA completo
resultante. Os fluxos de trabalho consomem essa árvore preparada; eles não
atualizam nem sincronizam as versões para você.

Execute a pré-verificação do npm e a Validação Completa de Lançamento a partir
da ponta exata dessa ramificação preparada e, em seguida, salve os IDs das duas
execuções e a tentativa bem-sucedida da execução da Validação Completa de
Lançamento:

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

`release_profile=stable` é o perfil existente de profundidade de validação;
ele é separado da dist-tag `extended-stable` do npm e permanece
intencionalmente inalterado.

Depois que ambas as execuções forem concluídas com sucesso, publique todos os
plugins oficiais publicáveis no npm a partir da ponta exata da mesma
ramificação. O patch `P` deve ser `33` ou superior. Passe o SHA completo do
lançamento como `ref`, aguarde a matriz completa e a releitura do registro e,
em seguida, salve o ID da execução bem-sucedida do Lançamento de Plugins no
NPM:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

O fluxo de trabalho usa o inventário regular preparado de pacotes
`all-publishable`, incluindo pacotes cujo código-fonte não foi alterado. Ele
verifica cada pacote exato e cada tag `extended-stable` de plugin antes de ser
concluído com sucesso. Se uma execução parcial falhar, execute novamente o
mesmo comando: os pacotes já publicados serão reutilizados, as tags de plugins
ausentes ou desatualizadas serão reconciliadas no ambiente de lançamento do
npm, e a releitura final ainda abrangerá o conjunto completo de pacotes.

Depois que o fluxo de trabalho de plugins for concluído com sucesso e o
ambiente de lançamento do npm estiver pronto, publique o tarball exato da
pré-verificação principal. A publicação principal verifica se a execução de
plugins referenciada está em `completed/success` na mesma ramificação canônica
e no SHA exato do código-fonte:

```bash
gh workflow run openclaw-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f tag=vYYYY.M.P \
  -f preflight_only=false \
  -f npm_dist_tag=extended-stable \
  -f preflight_run_id=<npm-preflight-run-id> \
  -f full_release_validation_run_id=<full-validation-run-id> \
  -f full_release_validation_run_attempt=<full-validation-run-attempt> \
  -f plugin_npm_run_id=<plugin-npm-run-id>
```

Para um fork ou ensaio fora de produção que intencionalmente não possa
satisfazer a política mensal de `.33` ou de mês da `main` protegida, adicione
`-f bypass_extended_stable_guard=true` aos disparos de pré-verificação e
publicação do npm. O padrão é `false`. A exceção só é aceita com
`npm_dist_tag=extended-stable` e é registrada no resumo do fluxo de trabalho.
Ela não ignora a referência canônica do fluxo de trabalho
`extended-stable/YYYY.M.33`, a igualdade entre a ponta da ramificação, a tag e o
checkout, a sintaxe da tag final, a igualdade entre as versões do pacote e da
tag, a identidade da execução e do manifesto referenciados, a procedência do
tarball, a aprovação do ambiente, a releitura do registro nem as evidências de
reparo do seletor.

O fluxo de trabalho de publicação verifica as identidades das execuções de
pré-verificação, validação e plugins referenciadas, o resumo criptográfico do
tarball preparado e os seletores do registro principal. Confirme o resultado
de forma independente depois que o fluxo de trabalho for concluído com
sucesso:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos os comandos devem retornar `YYYY.M.P`. Se a publicação for concluída com
sucesso, mas a releitura do seletor falhar, não republique a versão imutável do
pacote. Use o único comando de reparo
`npm dist-tag add openclaw@YYYY.M.P extended-stable` exibido no resumo de
execução garantida do fluxo de trabalho com falha e, em seguida, repita as duas
releituras independentes. A reversão para o seletor anterior é uma decisão
separada do operador, não o caminho de reparo da releitura.

A documentação pública de suporte inicialmente designa Slack, Discord e Codex
como superfícies de plugins cobertas pelo extended-stable. Essa lista é uma
declaração de suporte, não uma lista de permissões no código de lançamento:
todos os plugins oficiais publicáveis no npm seguem o mesmo caminho de
publicação com a versão exata.

A lista de verificação regular abaixo continua sendo responsável por beta,
`latest`, versão no GitHub, plugins, macOS, Windows e publicações em outras
plataformas. Não execute essas etapas neste caminho extended-stable somente no
npm.

## Lista de verificação do operador para lançamentos regulares

Esta lista de verificação apresenta publicamente o formato do fluxo de lançamento. Credenciais privadas, assinatura, notarização, recuperação de dist-tags e detalhes de reversão de emergência permanecem no guia de execução de lançamento exclusivo dos mantenedores.

1. Comece pela `main` atual: obtenha as alterações mais recentes, confirme que o commit de destino foi enviado e confirme que a CI da `main` está suficientemente verde para criar a branch a partir dela.
2. Gere a seção superior do `CHANGELOG.md` com base nos PRs mesclados e em todos os commits diretos desde a última tag de release alcançável. Mantenha as entradas voltadas ao usuário, elimine entradas sobrepostas entre PRs e commits diretos, faça commit, envie e execute rebase/pull mais uma vez antes de criar a branch. Quando uma tag divergente já publicada ou um forward-port posterior reassociar PRs já lançados, passe essa tag explicitamente como `--shipped-ref`; o verificador usa linhas explícitas de PR provenientes de registros completos de contribuição nas seções numeradas do snapshot da tag, ignora `Unreleased` e registra o inventário e a contagem exatos dos PRs excluídos.
3. Revise os registros de compatibilidade de release em `src/plugins/compat/registry.ts` e `src/commands/doctor/shared/deprecation-compat.ts`. Remova a compatibilidade expirada somente quando o caminho de atualização continuar coberto ou registre por que ela é mantida intencionalmente.
4. Crie `release/YYYY.M.PATCH` a partir da `main` atual. Não faça o trabalho normal de release diretamente na `main`.
5. Atualize todos os locais de versão obrigatórios para a tag e execute `pnpm release:prep`. Ele atualiza, em ordem, as versões dos plugins, os shrinkwraps do npm, o inventário de plugins, o esquema de configuração base, os metadados de configuração dos canais incluídos, a linha de base da documentação de configuração, as exportações do SDK de plugins e a linha de base da API do SDK de plugins. Faça commit de qualquer divergência gerada antes de criar a tag e, em seguida, execute a verificação preliminar local determinística: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes que exista uma tag, um SHA completo de 40 caracteres da branch de release é permitido para uma verificação preliminar somente de validação. A verificação preliminar gera evidências de release das dependências para o grafo exato de dependências do checkout e as armazena no artefato de verificação preliminar do npm. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-release com `Full Release Validation` para a branch de release, a tag ou o SHA completo do commit. Esse é o único ponto de entrada manual para os quatro grandes grupos de testes de release: Vitest, Docker, QA Lab e Package. Salve o `full_release_validation_run_id` e o `full_release_validation_run_attempt` exato; ambos são entradas obrigatórias para `OpenClaw NPM Release` e `OpenClaw Release Publish`.
8. Se a validação falhar, corrija na branch de release e execute novamente o menor arquivo, lane, job de workflow, perfil de pacote, provedor ou lista de permissões de modelos que comprove a correção. Execute novamente todo o conjunto abrangente somente quando a superfície alterada tornar obsoletas as evidências anteriores.
9. Para um candidato beta com tag, execute `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` na branch `release/YYYY.M.PATCH` correspondente. Para uma versão estável, passe também a release de origem obrigatória do Windows: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. O auxiliar usa a `main` confiável como origem do workflow, enquanto cada workflow tem como destino a tag exata. Ele registra a identidade imutável do candidato e das ferramentas, além dos IDs das execuções disparadas, em `.artifacts/release-candidate/<tag>/release-candidate-state.json`; executar novamente o mesmo comando retoma exatamente essas execuções, enquanto qualquer divergência no candidato, nas ferramentas, no perfil ou nas opções resulta em falha fechada. Antes de disparar toda a matriz de validação, o auxiliar renderiza deterministicamente o corpo exato da release no GitHub para a tag e rejeita a ausência do cabeçalho da versão, um corpo acima do limite que não possa usar a forma compacta canônica ou uma proveniência de base/destino dos registros de contribuição que não seja alcançável a partir da tag. Ele também valida quaisquer metadados explícitos de exclusão da linha de base já publicada em relação aos registros cumulativos das tags referenciadas. Em seguida, executa as verificações locais da release gerada, dispara ou verifica as evidências da validação completa da release e da verificação preliminar do npm, executa a comprovação de instalação nova/atualização no Parallels usando o tarball preparado exato, além da comprovação do pacote do Telegram, registra os planos de npm e ClawHub dos plugins e imprime o comando exato `OpenClaw Release Publish` somente depois que o conjunto de evidências estiver verde.

   `OpenClaw Release Publish` distribui em paralelo os pacotes de plugins selecionados ou todos os publicáveis para o npm e o mesmo conjunto para o ClawHub e, em seguida, promove o artefato de pré-verificação do npm do OpenClaw preparado com a dist-tag correspondente assim que a publicação dos plugins no npm é bem-sucedida. O checkout da versão permanece como a raiz do produto/dos dados, enquanto o planejamento e a verificação final são executados a partir do checkout exato e confiável da fonte do workflow, para que um commit de versão mais antigo não possa usar silenciosamente ferramentas de lançamento obsoletas. Antes que qualquer processo filho de publicação seja iniciado, ele renderiza e armazena em cache o corpo exato da versão no GitHub. Quando a seção `CHANGELOG.md` correspondente e completa cabe no limite de 125.000 caracteres do GitHub e no teto de segurança correspondente de 125.000 bytes do renderizador, a página contém exatamente essa seção `## YYYY.M.PATCH`, incluindo seu título. Quando a seção de origem não cabe, a página mantém exatamente as notas editoriais agrupadas e substitui o registro de contribuições grande demais por um link estável para o registro completo no `CHANGELOG.md` fixado à tag; registros parciais e itens de lista truncados nunca são publicados. O workflow escolhe esse corpo completo ou compacto antes de adicionar `### Release verification`; se a parte final da comprovação ultrapassar o limite, ele mantém o corpo canônico e utiliza as evidências imutáveis anexadas. Versões estáveis publicadas no npm `latest` tornam-se a versão mais recente no GitHub, enquanto versões estáveis de manutenção mantidas no npm `beta` são criadas com o GitHub `latest=false`. O workflow também envia as evidências de dependências da pré-verificação, o manifesto da validação completa e as evidências de verificação do registro após a publicação para a versão no GitHub, para resposta a incidentes pós-lançamento. Ele exibe imediatamente os IDs das execuções filhas, aprova automaticamente as barreiras do ambiente de lançamento que o token do workflow tem permissão para aprovar, resume os trabalhos filhos com falha com os finais dos logs, cria antecipadamente a página de rascunho da versão no GitHub e promove os artefatos do Windows e do Android simultaneamente à publicação do OpenClaw no npm, conclui a página da versão e as evidências de dependências assim que essas etapas são bem-sucedidas, aguarda o ClawHub sempre que o OpenClaw está sendo publicado no npm e, em seguida, executa o verificador beta da main confiável e envia evidências pós-publicação referentes à versão no GitHub, ao pacote npm, aos pacotes de plugins selecionados no npm, aos pacotes selecionados no ClawHub, aos IDs das execuções dos workflows filhos e ao ID opcional da execução do NPM Telegram. O verificador de bootstrap do ClawHub exige o caminho e o SHA exatos do workflow da main confiável, as tentativas de execução produtora e terminal, o SHA da versão, o conjunto de pacotes solicitado, a tupla imutável do artefato de pacote e o artefato de leitura final do registro; uma execução bem-sucedida do ref de versão legado não é aceita.

   Em seguida, execute a aceitação do pacote pós-publicação no pacote publicado `openclaw@YYYY.M.PATCH-beta.N` ou `openclaw@beta`. Se uma pré-versão enviada ou publicada precisar de uma correção, crie o próximo número de pré-versão correspondente; nunca exclua nem reescreva a anterior.

10. Para a versão estável, prossiga somente depois que a versão beta ou candidata a lançamento aprovada tiver as evidências de validação exigidas. A publicação da versão estável no npm também passa por `OpenClaw Release Publish`, reutilizando o artefato de pré-verificação bem-sucedido por meio de `preflight_run_id`. A prontidão da versão estável para macOS também exige os arquivos `.zip`, `.dmg` e `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`; o fluxo de trabalho de publicação do macOS publica automaticamente o appcast assinado na `main` pública depois que os ativos da versão são verificados ou abre/atualiza um PR do appcast se a proteção do branch bloquear o push direto. A prontidão da versão estável do Windows Hub exige os ativos assinados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` e `OpenClawCompanion-SHA256SUMS.txt` na versão do OpenClaw no GitHub. Passe a tag exata da versão assinada de `openclaw/openclaw-windows-node` como `windows_node_tag` e seu mapa de resumos dos instaladores aprovado para a versão candidata como `windows_node_installer_digests`; `OpenClaw Release Publish` mantém o rascunho da versão, aciona `Windows Node Release` e verifica os três ativos antes da publicação.
11. Após a publicação, execute o verificador pós-publicação do npm, o E2E opcional e independente do Telegram com o npm publicado quando precisar de comprovação pós-publicação do canal, a promoção da dist-tag quando necessário, verifique a página gerada da versão no GitHub, execute as etapas de anúncio da versão e conclua [o encerramento da versão estável na main](#stable-main-closeout) antes de considerar uma versão estável concluída.

## Encerramento da versão estável na main

A publicação estável não está concluída até que `main` contenha o estado real da versão publicada.

1. Comece a partir da versão mais recente de `main`, atualizada. Audite `release/YYYY.M.PATCH` em relação a ela e faça o forward-port das correções reais ausentes em `main`. Não integre indiscriminadamente a uma `main` mais recente adaptadores de compatibilidade, teste ou validação exclusivos da versão.
2. Defina `main` com a versão estável publicada, não com uma próxima linha de lançamento especulativa. Execute `pnpm release:prep` após alterar a versão raiz e, em seguida, `pnpm deps:shrinkwrap:generate`.
3. Faça com que a seção `## YYYY.M.PATCH` de `CHANGELOG.md` em `main` corresponda exatamente à branch da versão marcada com a tag. Inclua a atualização estável de `appcast.xml` quando a versão para Mac tiver publicado uma.
4. Não adicione `YYYY.M.PATCH+1`, uma versão beta nem uma seção vazia de changelog futuro a `main` até que o operador inicie explicitamente essa linha de lançamento.
5. Execute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` e `OPENCLAW_TESTBOX=1 pnpm check:changed`. Faça o push e, em seguida, verifique se `origin/main` contém a versão publicada e o changelog antes de considerar concluída a versão estável.
6. Mantenha as variáveis de repositório `RELEASE_ROLLBACK_DRILL_ID` e `RELEASE_ROLLBACK_DRILL_DATE` atualizadas após cada simulação privada de rollback.

`OpenClaw Stable Main Closeout` começa a partir do push para `main` que contém a versão publicada, o changelog e o appcast após a publicação estável. Ele lê evidências pós-publicação imutáveis para vincular a tag publicada às respectivas execuções de Full Release Validation e Publish e, em seguida, verifica o estado estável da main, a versão, o período obrigatório de observação da versão estável e as evidências de desempenho bloqueantes. Ele anexa um manifesto imutável de encerramento e sua soma de verificação à versão no GitHub. O gatilho automático por push ignora versões legadas anteriores às evidências pós-publicação imutáveis e nunca considera esse descarte como um encerramento concluído.

Um encerramento completo requer ambos os artefatos e uma soma de verificação correspondente. Um manifesto parcial reproduz o SHA de `main` e a simulação de rollback registrados para gerar novamente bytes idênticos e, em seguida, anexa a soma de verificação ausente; um par inválido ou uma soma de verificação sem manifesto permanece bloqueante. Uma execução acionada por push sem as variáveis de repositório da simulação de rollback é ignorada sem concluir o encerramento; o registro ausente ou com mais de 90 dias da simulação ainda bloqueia o encerramento manual respaldado por evidências. Os comandos privados de recuperação permanecem no runbook exclusivo para mantenedores. Use o acionamento manual somente para reparar ou reproduzir um encerramento estável respaldado por evidências.

Uma tag legada de correção de fallback pode reutilizar as evidências do pacote base somente quando a tag de correção resolve para o mesmo commit de origem que a tag estável base. A versão para Android reutiliza o APK verificado da tag base e adiciona a procedência da tag de correção. Uma correção com código-fonte diferente deve publicar e verificar suas próprias evidências de pacote e usar um `versionCode` do Android maior.

## Verificação preliminar da versão

- Execute `pnpm check:test-types` antes da verificação preliminar da versão para que o TypeScript dos testes continue coberto fora da verificação local mais rápida de `pnpm check`.
- Execute `pnpm check:architecture` antes da verificação preliminar da versão para que as verificações mais abrangentes de ciclos de importação e limites arquiteturais estejam aprovadas fora da verificação local mais rápida.
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de versão esperados em `dist/*` e o pacote da interface de controle existam para a etapa de validação do pacote.
- Execute `pnpm release:prep` após atualizar a versão raiz e antes de criar a tag. Ele executa todos os geradores determinísticos de versão que normalmente ficam dessincronizados após uma alteração de versão/configuração/API: versões de plugins, shrinkwraps do npm, inventário de plugins, esquema de configuração base, metadados de configuração dos canais incluídos, linha de base da documentação de configuração, exportações do SDK de plugins e linha de base da API do SDK de plugins. `pnpm release:check` executa novamente essas verificações no modo de conferência (além de uma verificação do orçamento de superfície do SDK de plugins) e relata, em uma única execução, todas as falhas de dessincronização gerada antes de executar as verificações de versão dos pacotes.
- Por padrão, a sincronização de versões de plugins atualiza o pacote de runtime publicável `@openclaw/ai`, as versões dos pacotes de plugins oficiais e os pisos existentes de `openclaw.compat.pluginApi` para a versão de lançamento do OpenClaw. Trate esse campo como o piso da API do SDK/runtime de plugins, não apenas como uma cópia da versão do pacote: para lançamentos somente de plugins que permaneçam intencionalmente compatíveis com hosts OpenClaw mais antigos, mantenha o piso na API de host mais antiga com suporte e documente essa escolha na comprovação do lançamento do plugin.
- Execute o fluxo de trabalho manual `Full Release Validation` antes da aprovação da versão para iniciar todas as caixas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita um branch, uma tag ou um SHA completo de commit, aciona manualmente `CI` e aciona `OpenClaw Release Checks` para smoke de instalação, aceitação de pacote, verificações de pacote entre sistemas operacionais, paridade do QA Lab, Matrix e pistas do Telegram. Execuções estáveis e completas sempre incluem testes exaustivos ao vivo/E2E e soak do caminho de lançamento no Docker; `run_release_soak=true` é mantido para um soak beta explícito. A aceitação de pacote fornece o E2E canônico do Telegram para o pacote durante a validação do candidato, evitando um segundo processo simultâneo de consulta ao vivo.

  Forneça `release_package_spec` após publicar uma versão beta para reutilizar o pacote npm lançado entre as verificações de versão, a aceitação de pacote e o E2E de pacote do Telegram sem reconstruir o tarball da versão. Forneça `npm_telegram_package_spec` somente quando o Telegram precisar usar um pacote publicado diferente do restante da validação da versão. Forneça `package_acceptance_package_spec` quando a aceitação de pacote precisar usar um pacote publicado diferente da especificação de pacote da versão. Forneça `evidence_package_spec` quando o relatório de evidências da versão precisar comprovar que a validação corresponde a um pacote npm publicado sem forçar o E2E do Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Execute o fluxo de trabalho manual `Package Acceptance` quando quiser uma comprovação por canal paralelo de um candidato de pacote enquanto o trabalho de lançamento continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata de lançamento; `source=ref` para empacotar um branch/tag/SHA confiável de `package_ref` com o conjunto de testes atual de `workflow_ref`; `source=url` para um tarball HTTPS público com SHA-256 obrigatório e uma política rigorosa de URL pública; `source=trusted-url` para uma política de fonte confiável nomeada usando `trusted_source_id` e SHA-256 obrigatórios; ou `source=artifact` para um tarball enviado por outra execução do GitHub Actions.

  O fluxo de trabalho resolve o candidato para `package-under-test`, reutiliza o agendador E2E de lançamento do Docker com esse tarball e pode executar o QA do Telegram com o mesmo tarball usando `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as pistas selecionadas do Docker incluem `published-upgrade-survivor`, o artefato do pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada. `update-restart-auth` usa o pacote candidato tanto como a CLI instalada quanto como o pacote em teste, para exercitar o caminho de reinicialização gerenciada do comando de atualização candidato.

  Exemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfis comuns:
  - `smoke`: pistas de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: pistas nativas de artefato para pacote/atualização/reinicialização/plugin sem OpenWebUI nem ClawHub ao vivo
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagentes, pesquisa na Web da OpenAI e OpenWebUI
  - `full`: blocos do caminho de lançamento do Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma nova execução direcionada

- Execute diretamente o fluxo de trabalho manual `CI` quando precisar apenas da cobertura determinística normal de CI para o candidato à versão. Os acionamentos manuais de CI ignoram o escopo por alterações e forçam os shards do Linux Node, shards de plugins incluídos, shards de contratos de plugins e canais, compatibilidade com Node 22, `check-*`, `check-additional-*`, verificações de smoke dos artefatos compilados, verificações da documentação, Skills em Python, Windows, macOS e pistas de i18n da interface de controle. Execuções manuais independentes de CI executam o Android somente quando acionadas com `include_android=true`; `Full Release Validation` passa essa entrada para seu fluxo filho de CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Execute `pnpm qa:otel:smoke` ao validar a telemetria da versão. Ele exercita o QA Lab por meio de um receptor OTLP/HTTP local e verifica a exportação de traces, métricas e logs, além de atributos de trace limitados e a redação de conteúdo/identificadores, sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm qa:otel:collector-smoke` ao validar a compatibilidade do coletor. Ele encaminha a mesma exportação OTLP do QA Lab por um contêiner Docker real do OpenTelemetry Collector antes das asserções do receptor local.
- Execute `pnpm qa:prometheus:smoke` ao validar o scraping protegido do Prometheus. Ele exercita o QA Lab, rejeita scrapes não autenticados e verifica que as famílias de métricas críticas para a versão permaneçam livres de conteúdo de prompts, identificadores brutos, tokens de autenticação e caminhos locais.
- Execute `pnpm qa:observability:smoke` para executar em sequência as pistas de smoke do OpenTelemetry e do Prometheus no checkout do código-fonte.
- Execute `pnpm release:check` antes de cada versão com tag.
- A verificação preliminar de `OpenClaw NPM Release` gera evidências de lançamento das dependências antes de empacotar o tarball npm. A verificação de vulnerabilidades de avisos do npm bloqueia o lançamento. Os relatórios de risco do manifesto transitivo, superfície de propriedade/instalação das dependências e alterações de dependências servem apenas como evidências de lançamento. O relatório de alterações de dependências compara o candidato à versão com a tag de lançamento alcançável anterior. A verificação preliminar envia as evidências de dependências como `openclaw-release-dependency-evidence-<tag>` e também as incorpora em `dependency-evidence/` dentro do artefato npm preparado pela verificação preliminar. O caminho real de publicação reutiliza esse artefato da verificação preliminar e, em seguida, anexa as mesmas evidências à versão do GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Execute `OpenClaw Release Publish` para a sequência de publicação com alterações após a existência da tag. Acione publicações beta e estáveis regulares a partir do `main` confiável; a tag de lançamento ainda seleciona o commit de destino exato e pode apontar para `release/YYYY.M.PATCH`. As publicações alfa do Tideclaw permanecem em seu branch alfa correspondente. Passe o `preflight_run_id` bem-sucedido do npm do OpenClaw, o `full_release_validation_run_id` bem-sucedido e o `full_release_validation_run_attempt` exato, e mantenha o escopo padrão de publicação de plugins como `all-publishable`, a menos que esteja executando deliberadamente um reparo direcionado. O fluxo de trabalho serializa a publicação npm dos plugins, a publicação dos plugins no ClawHub e a publicação npm do OpenClaw para que o pacote principal não seja publicado antes de seus plugins externalizados; a promoção para Windows e Android é executada simultaneamente à publicação npm principal usando a página de versão em rascunho. Novas execuções de publicação podem ser retomadas: uma versão principal já publicada no npm ignora o acionamento principal depois que o fluxo de trabalho comprova que o tarball do registro corresponde ao artefato da verificação preliminar da tag, e a promoção para Windows/Android é ignorada quando a versão já contém o contrato de artefatos verificado, portanto uma nova tentativa refaz apenas as etapas que falharam. Reparos direcionados somente de plugins exigem `plugin_publish_scope=selected` e uma lista de plugins não vazia. Execuções somente de plugins com `all-publishable` exigem evidências imutáveis completas da verificação preliminar e da validação completa da versão; evidências parciais são rejeitadas.
- Uma execução estável de `OpenClaw Release Publish` exige um `windows_node_tag` exato após existir a versão correspondente, sem pré-lançamento, de `openclaw/openclaw-windows-node`, além do mapa `windows_node_installer_digests` aprovado para o candidato. Antes de acionar qualquer fluxo filho de publicação, ele verifica se essa versão de origem está publicada, não é de pré-lançamento, contém os instaladores x64/ARM64 necessários e ainda corresponde ao mapa aprovado. Em seguida, aciona `Windows Node Release` enquanto a versão do OpenClaw ainda está como rascunho, transportando sem alterações o mapa fixado de resumos dos instaladores. O fluxo filho baixa os instaladores assinados do Windows Hub dessa tag exata, confere-os com os resumos fixados, verifica em um executor Windows que suas assinaturas Authenticode usam o signatário esperado da OpenClaw Foundation, grava um manifesto SHA-256 e envia os instaladores e o manifesto para a versão canônica do OpenClaw no GitHub; depois, baixa novamente os artefatos promovidos e verifica a presença no manifesto e os hashes. O fluxo pai verifica o contrato atual dos artefatos x64, ARM64 e de somas de verificação antes da publicação. A recuperação direta rejeita nomes inesperados de artefatos `OpenClawCompanion-*` antes de substituir os artefatos esperados do contrato pelos bytes fixados da origem.

  Acione manualmente `Windows Node Release` somente para recuperação e sempre passe uma tag exata, nunca `latest`, além do mapa JSON explícito `expected_installer_digests` da versão de origem aprovada. Os links de download do site devem apontar para URLs exatas dos artefatos da versão estável atual do OpenClaw ou para `releases/latest/download/...` somente após verificar que o redirecionamento de versão mais recente do GitHub aponta para essa mesma versão; não crie links apenas para a página de versão do repositório complementar.

- As verificações de lançamento agora são executadas em um fluxo de trabalho manual separado: `OpenClaw Release Checks`. Ele também executa a faixa de paridade simulada do QA Lab, além do perfil rápido do Matrix ao vivo e da faixa de QA do Telegram antes da aprovação do lançamento. As faixas ao vivo usam o ambiente `qa-live-shared`; o Telegram também usa concessões de credenciais de CI do Convex. Execute o fluxo de trabalho manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser o inventário completo de transporte, mídia e E2EE do Matrix em paralelo.
- A validação de runtime de instalação e atualização entre sistemas operacionais faz parte dos fluxos públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o fluxo de trabalho reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Essa separação é intencional: mantém o caminho real de lançamento no npm curto, determinístico e voltado a artefatos, enquanto verificações ao vivo mais lentas permanecem em sua própria faixa para não atrasarem nem bloquearem a publicação.
- As verificações de lançamento que utilizam segredos devem ser acionadas por meio de `Full Release Validation` ou a partir da referência de fluxo de trabalho de `main`/lançamento, para que a lógica do fluxo e os segredos permaneçam controlados.
- `OpenClaw Release Checks` aceita um branch, uma tag ou um SHA completo de commit, desde que o commit resolvido seja acessível a partir de um branch ou uma tag de lançamento do OpenClaw.
- A verificação preliminar somente de validação de `OpenClaw NPM Release` também aceita o SHA completo de 40 caracteres do commit atual do branch do fluxo de trabalho sem exigir uma tag enviada. Esse caminho por SHA serve somente para validação e não pode ser promovido a uma publicação real. No modo SHA, o fluxo de trabalho sintetiza `v<package.json version>` somente para a verificação de metadados do pacote; a publicação real ainda exige uma tag de lançamento real.
- Ambos os fluxos de trabalho mantêm o caminho real de publicação e promoção em executores hospedados pelo GitHub, enquanto o caminho de validação sem mutações pode usar os executores Linux maiores da Blacksmith.
- Esse fluxo de trabalho executa `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando os segredos de fluxo de trabalho `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`.
- A verificação preliminar do lançamento no npm não aguarda mais a faixa separada de verificações de lançamento.
- Antes de criar localmente a tag de uma versão candidata, execute `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. O auxiliar executa as proteções rápidas de lançamento, as verificações de lançamento de plugins no npm/ClawHub, a compilação, a compilação da interface e `release:openclaw:npm:check`, na ordem que detecta erros comuns capazes de bloquear a aprovação antes do início do fluxo de publicação do GitHub.
- Execute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (ou a tag correspondente de pré-lançamento/correção) antes da aprovação.
- Após a publicação no npm, execute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (ou a versão beta/de correção correspondente) para verificar o caminho de instalação pelo registro publicado em um novo prefixo temporário.
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar a integração inicial do pacote instalado, a configuração do Telegram e o E2E real do Telegram com o pacote npm publicado, usando o pool compartilhado de credenciais concedidas do Telegram. Execuções locais pontuais por mantenedores podem omitir as variáveis do Convex e fornecer diretamente as três credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Para executar a verificação completa de integridade pós-publicação da versão beta a partir da máquina de um mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O auxiliar executa a validação de atualização do npm e de destino novo no Parallels, aciona `NPM Telegram Beta E2E`, consulta periodicamente a execução exata do fluxo de trabalho, baixa o artefato e exibe o relatório do Telegram.
- Os mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions por meio do fluxo de trabalho manual `NPM Telegram Beta E2E`. Ele é intencionalmente somente manual e não é executado a cada mesclagem.
- A automação de lançamento dos mantenedores usa verificação preliminar seguida de promoção:
  - A publicação real no npm deve ter um `preflight_run_id` bem-sucedido do npm.
  - A orquestração e a verificação preliminar de publicações beta regulares e estáveis usam a `main` confiável com a tag de destino exata. A publicação e a verificação preliminar alfa do Tideclaw usam o branch alfa correspondente.
  - Os lançamentos estáveis no npm usam `beta` por padrão; a publicação estável no npm pode usar explicitamente `latest` como destino por meio da entrada do fluxo de trabalho.
  - A mutação de dist-tags do npm baseada em token reside em `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, pois `npm dist-tag add` ainda exige `NPM_TOKEN`, enquanto o repositório de origem mantém a publicação somente por OIDC.
  - O `macOS Release` público serve somente para validação; quando uma tag existe somente em um branch de lançamento, mas o fluxo de trabalho é acionado a partir de `main`, defina `public_release_branch=release/YYYY.M.PATCH`.
  - A publicação real no macOS deve ter `preflight_run_id` e `validate_run_id` bem-sucedidos do macOS.
  - Os caminhos de publicação real promovem os artefatos preparados em vez de compilá-los novamente.
- Para lançamentos estáveis de correção como `YYYY.M.PATCH-N`, o verificador pós-publicação também confere o mesmo caminho de atualização com prefixo temporário de `YYYY.M.PATCH` para `YYYY.M.PATCH-N`, para que correções de lançamento não deixem silenciosamente instalações globais mais antigas usando a carga estável básica.
- A verificação preliminar do lançamento no npm falha de forma segura, a menos que o tarball inclua `dist/control-ui/index.html` e uma carga não vazia em `dist/control-ui/assets/`, para que não distribuamos novamente um painel vazio no navegador.
- A verificação pós-publicação também confere se os pontos de entrada dos plugins publicados e os metadados do pacote estão presentes no layout instalado pelo registro. Um lançamento sem as cargas de runtime dos plugins faz o verificador pós-publicação falhar e não pode ser promovido a `latest`.
- `pnpm test:install:smoke` também impõe o limite de `unpackedSize` do pacote npm ao tarball candidato de atualização, para que o E2E do instalador detecte aumentos acidentais no tamanho do pacote antes do caminho de publicação do lançamento.
- Se o trabalho de lançamento alterou o planejamento de CI, os manifestos de duração das extensões ou as matrizes de testes de extensões, gere novamente e revise as saídas da matriz `plugin-prerelease-extension-shard`, pertencentes ao planejador, em `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de lançamento não descrevam um layout de CI desatualizado.
- A prontidão do lançamento estável para macOS também inclui as superfícies do atualizador: o lançamento no GitHub deve terminar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`; `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação (o fluxo de publicação do macOS faz o commit automaticamente ou abre um PR do appcast quando o envio direto está bloqueado); o aplicativo empacotado deve manter um identificador de pacote que não seja de depuração, uma URL não vazia do feed do Sparkle e um `CFBundleVersion` igual ou superior ao limite mínimo canônico de compilação do Sparkle para essa versão de lançamento.

## Caixas de teste de lançamento

`Full Release Validation` é a forma usada pelos operadores para iniciar todos os testes de pré-lançamento a partir de um único ponto de entrada. Para comprovar um commit fixado em um branch que muda rapidamente, use o auxiliar para que cada fluxo de trabalho filho seja executado a partir de um branch temporário fixado em um SHA confiável do fluxo de trabalho da `main`, enquanto o commit solicitado continua sendo o candidato em teste:

```bash
pnpm ci:full-release --sha <full-sha>
```

O auxiliar busca a `origin/main` atual, envia `release-ci/<workflow-sha>-...` nesse commit confiável do fluxo de trabalho, aciona `Full Release Validation` a partir do branch temporário com `ref=<target-sha>`, reutiliza evidências estritas do destino exato quando disponíveis, verifica se o `headSha` de cada fluxo de trabalho filho corresponde ao SHA fixado do fluxo de trabalho pai e, em seguida, exclui o branch temporário. Passe `-f reuse_evidence=false` para forçar uma nova execução ou `--workflow-sha <trusted-main-sha>` para fixar um commit mais antigo que ainda esteja acessível a partir da `origin/main` atual. O próprio fluxo de trabalho nunca grava referências do repositório. Isso mantém disponíveis as ferramentas de lançamento exclusivas da main sem adicionar commits de ferramentas ao candidato e evita comprovar acidentalmente uma execução filha de uma `main` mais recente.

Para validar um branch ou uma tag de lançamento, execute a partir da referência confiável do fluxo de trabalho da `main` e forneça o branch ou a tag de lançamento como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

O fluxo de trabalho resolve a referência de destino, aciona manualmente `CI` com `target_ref=<release-ref>` e, em seguida, aciona `OpenClaw Release Checks`. `OpenClaw Release Checks` distribui a verificação de instalação, as verificações de lançamento entre sistemas operacionais, a cobertura ao vivo/E2E em Docker do caminho de lançamento quando o teste prolongado está ativado, a Aceitação de Pacote com o E2E canônico do pacote do Telegram, a paridade do QA Lab, o Matrix ao vivo e o Telegram ao vivo. Uma execução completa/de todas as faixas só é aceitável quando o resumo de `Full Release Validation` mostra `normal_ci`, `plugin_prerelease` e `release_checks` como bem-sucedidos, salvo quando uma nova execução focada omite intencionalmente o filho separado `Plugin Prerelease`. Use o filho independente `npm-telegram` somente para uma nova execução focada no pacote publicado, com `release_package_spec` ou `npm_telegram_package_spec`. O resumo do verificador final inclui tabelas dos trabalhos mais lentos de cada execução filha, para que o responsável pelo lançamento possa ver o caminho crítico atual sem baixar os logs.

O filho de desempenho do produto gera somente artefatos neste caminho de lançamento. O
fluxo abrangente o aciona com `publish_reports=false`, e a validação é rejeitada
a menos que sua proteção exclusiva para artefatos comprove que o publicador de
relatórios do Clawgrit permaneceu ignorado.

Consulte [Validação completa de lançamento](/pt-BR/reference/full-release-validation) para ver a matriz completa de etapas, os nomes exatos dos trabalhos do fluxo, as diferenças entre os perfis estável e completo, os artefatos e os mecanismos de nova execução focada.

Os fluxos de trabalho filhos são acionados a partir da referência confiável que executa `Full Release Validation`, normalmente `--ref main`, mesmo quando a `ref` de destino aponta para um branch ou uma tag de lançamento mais antigo. Toda execução filha deve usar o SHA exato do fluxo de trabalho pai; se a `main` avançar antes que o acionamento de um filho seja resolvido, o fluxo abrangente falhará de forma segura. Não há uma entrada separada de referência do fluxo de trabalho de Full Release Validation; escolha a estrutura confiável escolhendo a referência de execução do fluxo. Não use `--ref main -f ref=<sha>` para comprovar um commit exato em uma `main` em movimento; SHAs brutos de commit não podem ser referências de acionamento de fluxos de trabalho, portanto, use `pnpm ci:full-release --sha <target-sha>` para criar um branch temporário na `origin/main` confiável, mantendo o SHA de destino como entrada do candidato.

Use `release_profile` para selecionar a abrangência de ambientes ao vivo/provedores:

- `minimum`: caminho ao vivo e Docker mais rápido e crítico para lançamento do OpenAI/núcleo
- `stable`: perfil mínimo mais cobertura estável de provedores/backends para aprovação do lançamento
- `full`: perfil estável mais ampla cobertura consultiva de provedores/mídia

As validações estável e completa sempre executam a verificação exaustiva ao vivo/E2E, o caminho de lançamento em Docker e a varredura limitada de sobrevivência a atualizações publicadas antes da promoção. Use `run_release_soak=true` para solicitar a mesma varredura para uma versão beta. Essa varredura abrange os quatro pacotes estáveis mais recentes, mais as linhas de base fixadas `2026.4.23` e `2026.5.2`, além da cobertura mais antiga de `2026.4.15`, com linhas de base duplicadas removidas e cada linha de base dividida em seu próprio trabalho de executor Docker.

`OpenClaw Release Checks` usa a referência confiável do fluxo de trabalho para resolver uma vez a referência de destino como `release-package-under-test` e reutiliza esse artefato nas verificações entre sistemas operacionais, na Aceitação de Pacote e nas verificações em Docker do caminho de lançamento quando o teste prolongado é executado. Isso mantém todas as caixas voltadas a pacotes usando os mesmos bytes e evita compilações repetidas do pacote. Depois que uma versão beta já estiver no npm, defina `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que as verificações de lançamento baixem uma única vez o pacote distribuído, extraiam o SHA da origem de compilação de `dist/build-info.json` e reutilizem esse artefato nas faixas entre sistemas operacionais, de Aceitação de Pacote, de Docker do caminho de lançamento e do pacote do Telegram.

A verificação de instalação do OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a variável do repositório/organização está definida; caso contrário, usa `openai/gpt-5.6-luna`, pois essa faixa comprova a instalação do pacote, a integração inicial, a inicialização do Gateway e uma interação ao vivo do agente, em vez de avaliar comparativamente o modelo mais capaz. A matriz mais ampla de provedores ao vivo continua sendo o local para a cobertura específica de modelos.

Use estas variantes de acordo com a etapa do lançamento:

```bash
# Valide um branch de candidato a lançamento ainda não publicado.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable

# Valide um commit enviado específico.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f provider=openai \
  -f mode=both

# Após publicar uma versão beta, adicione o E2E do Telegram com o pacote publicado.
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

Não use o fluxo abrangente completo como a primeira nova execução após uma correção focada. Se uma caixa falhar, use o fluxo de trabalho filho, job, faixa do Docker, perfil de pacote, provedor de modelo ou faixa de QA que falhou para a próxima comprovação. Execute o fluxo abrangente completo novamente somente quando a correção tiver alterado a orquestração compartilhada do lançamento ou tornado obsoletas as evidências anteriores de todas as caixas. O verificador final do fluxo abrangente verifica novamente os IDs registrados das execuções dos fluxos de trabalho filhos; portanto, após uma nova execução bem-sucedida de um fluxo de trabalho filho, execute novamente apenas o job pai `Verify full validation` que falhou.

`rerun_group=all` pode reutilizar uma execução abrangente anterior bem-sucedida somente quando ela tiver validado
exatamente o mesmo SHA de destino, perfil de lançamento, configuração efetiva de soak e
entradas de validação. Esta é uma recuperação limitada para executar novamente o mesmo candidato,
não uma reutilização de evidências entre SHAs. Para um candidato alterado, incluindo um commit apenas
de changelog ou versão, execute novamente cada verificação de pacote, artefato, instalação, Docker ou provedor
afetada pelos caminhos alterados ou hashes de artefatos. Execuções abrangentes mais recentes para
a mesma ref `release/*`
e grupo de nova execução substituem automaticamente as que estiverem em andamento. Passe
`reuse_evidence=false` para forçar uma nova execução completa.

Para recuperação limitada, passe `rerun_group` ao fluxo abrangente. `all` é a execução real do candidato a lançamento, `ci` executa apenas o filho de CI normal, `plugin-prerelease` executa apenas o filho de Plugin exclusivo do lançamento, `release-checks` executa todas as caixas de lançamento, e os grupos de lançamento mais específicos são `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`. Novas execuções focadas de `npm-telegram` exigem `release_package_spec` ou `npm_telegram_package_spec`; execuções completas/all usam o E2E canônico do Telegram com pacote dentro de Package Acceptance. Novas execuções focadas entre sistemas operacionais podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou outro filtro de sistema operacional/suíte. Falhas nas verificações de lançamento de QA bloqueiam a validação normal do lançamento, incluindo desvios obrigatórios das ferramentas dinâmicas do OpenClaw no nível padrão. Execuções alfa do Tideclaw ainda podem tratar como consultivas as faixas de verificação de lançamento não relacionadas à segurança do pacote. Com `release_profile=beta`, as suítes de provedor ao vivo de `Run repo/live E2E validation` são consultivas (avisos, não bloqueios); os perfis stable e full continuam tratando-as como bloqueadoras. Quando `live_suite_filter` solicita explicitamente uma faixa de QA ao vivo controlada, como Discord, WhatsApp ou Slack, a variável correspondente do repositório `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` deve estar habilitada; caso contrário, a captura das entradas falha em vez de ignorar silenciosamente a faixa.

### Vitest

A caixa do Vitest é o fluxo de trabalho filho manual `CI`. A CI manual ignora intencionalmente o escopo de alterações e força o grafo normal de testes para o candidato a lançamento: shards do Linux Node, shards de plugins integrados, shards de contratos de Plugin e canal, compatibilidade com Node 22, `check-*`, `check-additional-*`, verificações rápidas de artefatos compilados, verificações da documentação, Skills em Python, Windows, macOS e i18n da Control UI. O Android é incluído quando `Full Release Validation` executa a caixa, pois o fluxo abrangente passa `include_android=true`; a CI manual independente exige `include_android=true` para cobrir o Android.

Use esta caixa para responder "a árvore de código-fonte passou por toda a suíte normal de testes?". Ela não é equivalente à validação do produto no caminho de lançamento. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução de `CI` disparada
- execução de `CI` bem-sucedida no SHA de destino exato
- nomes dos shards com falha ou lentos dos jobs de CI ao investigar regressões
- artefatos de tempos do Vitest, como `.artifacts/vitest-shard-timings.json`, quando uma execução precisar de análise de desempenho

Execute a CI manual diretamente somente quando o lançamento precisar de uma CI normal determinística, mas não das caixas de Docker, QA Lab, ao vivo, entre sistemas operacionais ou de pacote. Use o primeiro comando para CI direta sem Android. Adicione `include_android=true` quando a CI direta do candidato a lançamento precisar cobrir o Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

A caixa do Docker fica em `OpenClaw Release Checks` por meio de `openclaw-live-and-e2e-checks-reusable.yml`, além do fluxo de trabalho `install-smoke` no modo de lançamento. Ela valida o candidato a lançamento por meio de ambientes Docker empacotados, em vez de apenas testes no nível do código-fonte.

A cobertura de Docker do lançamento inclui:

- verificação rápida completa de instalação com a verificação lenta de instalação global do Bun habilitada
- preparação/reutilização da imagem de verificação rápida do Dockerfile raiz por SHA de destino, com os jobs de verificação rápida de QR, raiz/Gateway e instalador/Bun executados como shards separados de install-smoke
- faixas de E2E do repositório
- partes do Docker no caminho de lançamento: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h` e `openwebui`
- cobertura do OpenWebUI em um executor dedicado com disco grande quando solicitada
- faixas divididas de instalação/desinstalação de plugins integrados, de `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- suítes de provedores ao vivo/E2E e cobertura de modelos ao vivo no Docker quando as verificações de lançamento incluem suítes ao vivo

Use os artefatos do Docker antes de executar novamente. O agendador do caminho de lançamento envia `.artifacts/docker-tests/` com logs das faixas, `summary.json`, `failures.json`, tempos das fases, JSON do plano do agendador e comandos de nova execução. Para recuperação focada, use `docker_lanes=<lane[,lane]>` no fluxo de trabalho reutilizável ao vivo/E2E, em vez de executar novamente todas as partes do lançamento. Os comandos de nova execução gerados incluem o `package_artifact_run_id` anterior e entradas das imagens Docker preparadas quando disponíveis, para que uma faixa com falha possa reutilizar o mesmo tarball e as mesmas imagens do GHCR.

### QA Lab

A caixa do QA Lab também faz parte de `OpenClaw Release Checks`. Ela é a verificação de lançamento do comportamento agêntico e no nível dos canais, separada do Vitest e da mecânica de pacotes do Docker.

A cobertura do QA Lab do lançamento inclui:

- faixa de paridade simulada que compara a faixa candidata do OpenAI com a linha de base `anthropic/claude-opus-4-8` usando o pacote de paridade agêntica
- perfil rápido de QA ao vivo do Matrix usando o ambiente `qa-live-shared`
- faixa de QA ao vivo do Telegram usando concessões de credenciais de CI do Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` ou `pnpm qa:observability:smoke` quando a telemetria do lançamento precisar de comprovação local explícita

Use esta caixa para responder "o lançamento se comporta corretamente nos cenários de QA e fluxos de canais ao vivo?". Mantenha as URLs dos artefatos das faixas de paridade, Matrix e Telegram ao aprovar o lançamento. A cobertura completa do Matrix continua disponível como uma execução manual com shards do QA-Lab, em vez de ser a faixa padrão crítica para o lançamento.

### Pacote

A caixa de Pacote é a verificação do produto instalável. Ela é sustentada por `Package Acceptance` e pelo resolvedor `scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um candidato no tarball `package-under-test` consumido pelo E2E do Docker, valida o inventário do pacote, registra a versão e o SHA-256 do pacote e mantém a ref do harness do fluxo de trabalho separada da ref do código-fonte do pacote.

Origens de candidatos compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão de lançamento exata do OpenClaw
- `source=ref`: empacota um branch, tag ou SHA completo de commit confiável de `package_ref` com o harness de `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS público com `package_sha256` obrigatório; credenciais na URL, portas HTTPS não padrão, nomes de host ou endereços resolvidos privados/internos/de uso especial e redirecionamentos inseguros são rejeitados
- `source=trusted-url`: baixa um `.tgz` HTTPS com `package_sha256` e `trusted_source_id` obrigatórios de uma política nomeada em `.github/package-trusted-sources.json`; use isso para espelhos empresariais mantidos pelos responsáveis ou repositórios de pacotes privados, em vez de adicionar a `source=url` um desvio de rede privada no nível das entradas
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o artefato preparado do pacote de lançamento, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mantém a migração, atualização, upgrade de VPS gerenciado pelo root, reinicialização após atualização com autenticação configurada, instalação ao vivo de Skills do ClawHub, limpeza de dependências obsoletas de plugins, fixtures de plugins offline, atualização de plugins, proteção contra escape na vinculação de comandos de Plugin e QA do pacote do Telegram no mesmo tarball resolvido. As verificações bloqueadoras do lançamento usam como linha de base padrão o pacote publicado mais recente; o perfil beta com `run_release_soak=true`, `release_profile=stable` ou `release_profile=full` expande a varredura de sobrevivência a upgrades publicados para `last-stable-4`, além das linhas de base fixadas `2026.4.23`, `2026.5.2` e `2026.4.15`, com cenários `reported-issues`. Use Package Acceptance com `source=npm` para um candidato já lançado, `source=ref` para um tarball npm local respaldado por SHA antes da publicação, `source=trusted-url` para um espelho empresarial/privado mantido pelos responsáveis ou `source=artifact` para um tarball preparado e enviado por outra execução do GitHub Actions.

Ela é a substituição nativa do GitHub para a maior parte da cobertura de pacote/atualização que antes exigia Parallels. As verificações de lançamento entre sistemas operacionais ainda são importantes para integração inicial, instalador e comportamento específico da plataforma, mas a validação de produto de pacote/atualização deve preferir Package Acceptance.

A lista de verificação canônica para validação de atualizações e plugins é [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao decidir qual faixa local, do Docker, de Package Acceptance ou de verificação de lançamento comprova uma alteração de instalação/atualização de Plugin, limpeza pelo doctor ou migração de pacote publicado. A migração exaustiva de atualizações publicadas de todos os pacotes estáveis `2026.4.23+` é um fluxo de trabalho manual `Update Migration` separado, não parte da CI completa do lançamento.

A tolerância legada da aceitação de pacotes é intencionalmente limitada no tempo. Pacotes até `2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas no npm: entradas privadas do inventário de QA ausentes no tarball, ausência de `gateway install --wrapper`, arquivos de patch ausentes na fixture de git derivada do tarball, ausência de `update.channel` persistido, locais legados de registros de instalação de plugins, ausência de persistência de registros de instalação do marketplace e migração de metadados de configuração durante `plugins update`. O pacote publicado `2026.4.26` pode emitir avisos sobre arquivos locais de carimbo de metadados da compilação que já foram lançados. Pacotes posteriores devem satisfazer os contratos modernos de pacote; essas mesmas lacunas causam falha na validação do lançamento.

Use perfis mais abrangentes de Package Acceptance quando a questão do lançamento for sobre um pacote realmente instalável:

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

- `smoke`: pistas rápidas de instalação de pacote/canal/agente, rede do Gateway e recarregamento de configuração
- `package`: contratos de instalação/atualização/reinicialização/pacote de Plugin, além de prova ao vivo da instalação de Skill do ClawHub; este é o padrão da verificação de release
- `product`: `package` mais canais MCP, limpeza de Cron/subagente, pesquisa na web da OpenAI e OpenWebUI
- `full`: partes do caminho de release no Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para novas execuções direcionadas

Para a prova do Telegram com pacote candidato, habilite `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` na Aceitação de Pacote. O workflow passa o tarball `package-under-test` resolvido para a pista do Telegram; o workflow independente do Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação regular de publicação de release

Para publicação beta, `latest`, de Plugin, de Release do GitHub e de plataforma,
`OpenClaw Release Publish` é o ponto de entrada mutável normal. O caminho
estável estendido mensal `.33+`, somente para npm, não usa esse orquestrador. O
workflow regular orquestra os workflows de publicador confiável na ordem exigida
pelo release:

1. Faça checkout da tag do release e resolva seu SHA de commit.
2. Verifique se a tag é alcançável a partir de `main` ou `release/*` (ou de uma branch alfa do Tideclaw para pré-releases alfa).
3. Execute `pnpm plugins:sync:check`.
4. Dispare `Plugin NPM Release` com `publish_scope=all-publishable` e `ref=<release-sha>`.
5. Dispare `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Dispare `OpenClaw NPM Release` com a tag do release, a dist-tag do npm e o `preflight_run_id` salvo após verificar o `full_release_validation_run_id` salvo e a tentativa exata da execução.
7. Para releases estáveis, crie ou atualize o release do GitHub como rascunho, dispare `Windows Node Release` com o `windows_node_tag` explícito e os `windows_node_installer_digests` aprovados para o candidato e verifique os ativos canônicos do instalador/checksum do Windows. Dispare também `Android Release` para compilar o APK assinado da tag exata, junto com checksum e proveniência. Verifique ambos os contratos de ativos nativos antes de publicar o rascunho.

Exemplo de publicação beta:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

Publicação estável na dist-tag beta padrão:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=beta
```

A promoção estável diretamente para `latest` é explícita:

```bash
gh workflow run openclaw-release-publish.yml \
  --ref main \
  -f tag=vYYYY.M.PATCH \
  -f windows_node_tag=vX.Y.Z \
  -f windows_node_installer_digests='{"OpenClawCompanion-Setup-x64.exe":"sha256:<approved-x64-sha256>","OpenClawCompanion-Setup-arm64.exe":"sha256:<approved-arm64-sha256>"}' \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f full_release_validation_run_attempt=<successful-full-release-validation-run-attempt> \
  -f npm_dist_tag=latest
```

Use os workflows de nível inferior `Plugin NPM Release` e `Plugin ClawHub Release` somente para trabalhos direcionados de reparo ou republicação. `OpenClaw Release Publish` rejeita `plugin_publish_scope=selected` quando `publish_openclaw_npm=true`, para que o pacote principal não seja lançado sem todos os plugins oficiais publicáveis, incluindo `@openclaw/diffs-language-pack`. Para reparar um Plugin selecionado, defina `publish_openclaw_npm=false` com `plugin_publish_scope=selected` e `plugins=@openclaw/name`, ou dispare o workflow filho diretamente.

O bootstrap do ClawHub para a primeira publicação é a exceção: dispare `Plugin ClawHub New`
a partir da `main` confiável e passe o SHA completo do release de destino por meio de `ref`.
Nunca execute o próprio workflow de bootstrap a partir da tag ou branch do release:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

A validação pré-tag exige `dry_run=true`, rejeita entradas de tag de release e de execução
pai e aceita somente um destino exato alcançável a partir de `main` ou `release/*`.
Ela não carrega credenciais do ClawHub, não publica bytes de pacote nem altera a
configuração do publicador confiável. O workflow ainda resolve o plano ativo do registro,
faz checkout e empacota o destino somente em um job sem segredos, materializa o
conjunto de ferramentas bloqueado do ClawHub e valida o artefato imutável e o
slug/identidade do pacote antes que a tag do release exista. Aprove o ambiente
`clawhub-plugin-bootstrap` somente após a conclusão dos jobs de empacotamento sem
segredos; esse job de validação protegido não possui credenciais nem comandos de mutação.

Uma simulação aprovada ou um bootstrap real após a criação da tag deve incluir a tag
exata do release, além do id, da tentativa e da branch da execução pai de
`OpenClaw Release Publish`. O pai atesta o SHA do próprio workflow e um SHA exato
confiável e separado da `main` para `Plugin ClawHub New`; a execução filha e cada
aprovação de ambiente protegido devem corresponder a esse SHA filho aprovado. A tag
do release é verificada novamente antes de cada tentativa de publicação e mutação
do publicador confiável.

O job de empacotamento
envia um artefato imutável cujo nome, ID/digest do artefato do Actions,
execução/tentativa produtora, SHA de destino e SHA-256/tamanho do tarball de cada pacote são
transportados para os jobs de validação e protegidos. O job protegido faz checkout apenas
das ferramentas confiáveis da `main`, valida a tupla do artefato por meio da API do GitHub, baixa
pelo ID exato do artefato, recalcula o hash de cada tarball e valida os caminhos TAR locais e a
identidade do pacote com as regras de canonicalização USTAR da CLI fixada. Cada
candidato passa então pela simulação de publicação da CLI fixada, que retorna antes
da consulta ao registro ou da autenticação. O pré-filtro do job com credenciais limita os ClawPacks
compactados a 120 MiB, a carga total de arquivos a 50 MiB, os dados TAR expandidos a 64 MiB e
a contagem de entradas TAR a 10.000. O reparo do publicador confiável de um pacote existente permanece
limitado à configuração, mas ainda empacota o destino e exige a tag solicitada,
além da igualdade exata dos bytes e metadados do registro, antes de alterar a configuração
do publicador confiável. A verificação pós-publicação baixa o artefato do ClawHub e
exige o mesmo SHA-256 e tamanho. Uma recuperação por nova execução somente dos jobs com falha pode reutilizar
o artefato de pacote de uma tentativa anterior apenas quando o job produtor exato tiver sido concluído
com sucesso. A evidência final também vincula a versão bloqueada do ClawHub, o SHA-256
do arquivo de lock e a integridade npm. Uma divergência exige uma nova versão do pacote.

## Entradas do workflow do NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` ou `v2026.4.2-alpha.1`; quando `preflight_only=true`, também pode ser o SHA completo de 40 caracteres do commit atual da branch do workflow para uma pré-verificação somente de validação
- `preflight_only`: `true` somente para validação/compilação/pacote, `false` para o caminho real de publicação
- `preflight_run_id`: id de uma execução de pré-verificação bem-sucedida existente, obrigatório no caminho real de publicação para que o workflow reutilize o tarball preparado em vez de recompilá-lo
- `full_release_validation_run_id`: id de uma execução bem-sucedida de `Full Release Validation` para esta tag/SHA, obrigatório para a publicação real. Publicações beta podem prosseguir somente com a pré-verificação, com um aviso, mas a promoção estável/para `latest` ainda o exige.
- `full_release_validation_run_attempt`: tentativa positiva exata da execução associada a `full_release_validation_run_id`; obrigatória sempre que o id da execução for fornecido, para que novas execuções não possam alterar a evidência de autorização durante a publicação.
- `release_publish_run_id`: id de execução aprovado de `OpenClaw Release Publish`; obrigatório quando este workflow é disparado por esse pai (chamadas de publicação real pelo ator bot)
- `plugin_npm_run_id`: id de execução bem-sucedida e com head exato de `Plugin NPM Release`; obrigatório para uma publicação real do núcleo em `extended-stable`
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; aceita `alpha`, `beta`, `latest` ou `extended-stable` e o padrão é `beta`. O patch final `33` e posteriores devem usar `extended-stable`; por padrão, `extended-stable` rejeita patches anteriores e sempre rejeita tags não finais.
- `bypass_extended_stable_guard`: booleano somente para testes, padrão `false`; com `npm_dist_tag=extended-stable`, ignora a elegibilidade mensal do estável estendido, preservando as verificações de identidade do release, artefato, aprovação e leitura de confirmação.

`Plugin NPM Release` aceita `npm_dist_tag=default` para o comportamento de release
existente ou `npm_dist_tag=extended-stable` para o caminho mensal protegido. A
opção de estável estendido exige `publish_scope=all-publishable`, uma entrada
`plugins` vazia, um patch final igual ou superior a `33` e a branch canônica
`extended-stable/YYYY.M.33` em sua ponta exata. Ela nunca move `latest` ou
`beta` dos plugins. Novas versões de pacote recebem `extended-stable` atomicamente
por meio da publicação confiável com OIDC (`npm publish --tag extended-stable`); este
workflow de origem não usa `npm dist-tag add` autenticado por token. As novas tentativas
ignoram versões exatas já presentes no npm e então encerram de forma segura, a menos que uma
leitura de confirmação completa confirme que cada pacote exato e a tag `extended-stable` convergiram.

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória; já deve existir
- `preflight_run_id`: id de uma execução de pré-verificação bem-sucedida de `OpenClaw NPM Release`; obrigatório quando `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: id de uma execução bem-sucedida de `Full Release Validation`; obrigatório quando `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: tentativa positiva exata associada a `full_release_validation_run_id`; obrigatória sempre que o id da execução for fornecido
- `windows_node_tag`: tag de release exata e não pré-release de `openclaw/openclaw-windows-node`; obrigatória para a publicação estável do OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto, aprovado para o candidato, dos nomes atuais dos instaladores do Windows para seus digests `sha256:` fixados; obrigatório para a publicação estável do OpenClaw
- `npm_telegram_run_id`: id opcional de uma execução bem-sucedida de `NPM Telegram Beta E2E` a ser incluído na evidência final do release
- `npm_dist_tag`: tag de destino do npm para o pacote OpenClaw, uma entre `alpha`, `beta` ou `latest`
- `plugin_publish_scope`: o padrão é `all-publishable`; use `selected` somente para trabalho direcionado de reparo exclusivo de Plugin com `publish_openclaw_npm=false`
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgulas quando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: o padrão é `true`; defina como `false` somente ao usar o workflow como um orquestrador de reparo exclusivo de Plugin
- `release_profile`: perfil de cobertura do release usado nos resumos de evidências do release; o padrão é `from-validation`, que o lê no manifesto de validação, ou substitua por `beta`, `stable` ou `full`
- `wait_for_clawhub`: o padrão é `false`, para que a disponibilidade no npm não seja bloqueada pelo processo auxiliar do ClawHub; defina como `true` somente quando a conclusão do workflow precisar incluir a conclusão do ClawHub

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA completo de commit a validar. As verificações que contêm segredos exigem que o commit resolvido seja alcançável a partir de uma branch ou tag de release do OpenClaw.
- `run_release_soak`: habilita testes prolongados e exaustivos ao vivo/E2E, do caminho de release no Docker e de sobrevivência a upgrades desde todas as versões para verificações de release beta. É habilitado obrigatoriamente por `release_profile=stable` e `release_profile=full`.

Regras:

- Versões finais regulares e versões de correção abaixo do patch `33` podem ser publicadas em `beta` ou `latest`. Versões finais no patch `33` ou superior devem ser publicadas em `extended-stable`, e versões com sufixo de correção nesse limite são rejeitadas.
- Tags de pré-lançamento beta podem ser publicadas somente em `beta`; tags de pré-lançamento alfa podem ser publicadas somente em `alpha`
- Para `OpenClaw NPM Release`, a entrada do SHA completo do commit é permitida somente quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre apenas para validação
- O caminho real de publicação deve usar o mesmo `npm_dist_tag` usado durante a pré-verificação; o workflow verifica esses metadados antes de a publicação continuar

## Sequência regular de lançamento estável beta/latest

Esta sequência legada é destinada ao lançamento orquestrado regular, que também abrange plugins, GitHub Release, Windows e trabalhos de outras plataformas. Ela não é o caminho mensal `.33+`, exclusivo do npm e de estabilidade estendida, documentado no início desta página.

Ao preparar um lançamento estável orquestrado regular:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes de existir uma tag, você pode usar o SHA completo do commit atual da branch do workflow para uma simulação, somente para validação, do workflow de pré-verificação.
2. Escolha `npm_dist_tag=beta` para o fluxo normal que começa pelo beta, ou `latest` somente quando você quiser intencionalmente uma publicação estável direta.
3. Execute `Full Release Validation` na branch de lançamento, na tag de lançamento ou no SHA completo do commit quando quiser a CI normal junto com cobertura de cache de prompts ao vivo, Docker, QA Lab, Matrix e Telegram em um único workflow manual. Se você precisar intencionalmente apenas do grafo determinístico de testes normais, execute o workflow manual `CI` na referência de lançamento.
4. Selecione a tag exata de lançamento, sem pré-lançamento, de `openclaw/openclaw-windows-node` cujos instaladores assinados para x64 e ARM64 devem ser distribuídos. Salve-a como `windows_node_tag` e salve o mapa de resumos validados desses instaladores como `windows_node_installer_digests`. O auxiliar de candidato a lançamento registra ambos e os inclui no comando de publicação gerado.
5. Salve o `preflight_run_id`, o `full_release_validation_run_id` e o `full_release_validation_run_attempt` exato da execução bem-sucedida.
6. Execute `OpenClaw Release Publish` a partir da `main` confiável com a mesma `tag`, o mesmo `npm_dist_tag`, o `windows_node_tag` selecionado, os `windows_node_installer_digests` salvos, o `preflight_run_id`, o `full_release_validation_run_id` e o `full_release_validation_run_attempt` salvos. Ele publica os plugins externalizados no npm e no ClawHub antes de promover o pacote npm do OpenClaw.
7. Se o lançamento foi publicado em `beta`, use o workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promover essa versão estável de `beta` para `latest`.
8. Se o lançamento foi publicado intencionalmente diretamente em `latest` e `beta` deve acompanhar imediatamente a mesma compilação estável, use esse mesmo workflow de lançamento para apontar ambas as dist-tags para a versão estável ou deixe que a sincronização de autorrecuperação agendada mova `beta` posteriormente.

A alteração das dist-tags fica no repositório do livro-razão de lançamentos porque ainda requer `NPM_TOKEN`, enquanto o repositório de origem mantém a publicação somente por OIDC. Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção que começa pelo beta documentados e visíveis aos operadores.

Se um mantenedor precisar recorrer à autenticação local do npm, execute quaisquer comandos da CLI do 1Password (`op`) somente dentro de uma sessão tmux dedicada. Não chame `op` diretamente no shell principal do agente; mantê-lo dentro do tmux torna observáveis os prompts, alertas e o tratamento de OTP, além de evitar alertas repetidos do host.

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

Os mantenedores usam a documentação privada de lançamento em [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) como o runbook efetivo.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
