---
read_when:
    - Procurando definições públicas dos canais de lançamento
    - Executando a validação de versão ou a aceitação de pacote
    - Em busca da nomenclatura e da cadência das versões
summary: Canais de lançamento, checklist do operador, caixas de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-07-12T00:21:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a96560ee908c09d26782ffa75dbc695f4ab83c5a80dfb7abe5befd8ca686
    source_path: reference/RELEASING.md
    workflow: 16
---

Atualmente, o OpenClaw disponibiliza três canais de atualização voltados ao usuário:

- stable: o canal existente de versões promovidas, que ainda é resolvido por meio do `latest` do npm até a implementação do marco separado de CLI/canal
- beta: tags de pré-lançamento publicadas no `beta` do npm
- dev: a ponta móvel de `main`

Separadamente, os operadores de lançamento podem publicar o pacote principal
do último mês concluído no `extended-stable` do npm, começando pelo patch `33`.
A linha final regular do mês atual continua no `latest` do npm; essa divisão
de publicação do lado do operador não altera, por si só, a resolução do canal
de atualização da CLI.

As compilações alfa do Tideclaw constituem uma trilha interna separada de pré-lançamento (dist-tag `alpha` do npm), abordada em [Entradas do fluxo de trabalho do NPM](#npm-workflow-inputs) e [Ambientes de teste de lançamento](#release-test-boxes).

## Nomenclatura de versões

- Versão mensal de lançamento extended-stable do npm: `YYYY.M.PATCH`, com `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Versão de lançamento final diária/regular: `YYYY.M.PATCH`, com `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Versão de lançamento regular de correção alternativa: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Versão de pré-lançamento beta: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Versão de pré-lançamento alfa: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Nunca preencha o mês ou o patch com zeros à esquerda
- `PATCH` é um número sequencial do ciclo mensal de lançamentos, não um dia do calendário. Lançamentos finais regulares e beta avançam o ciclo atual; tags exclusivamente alfa nunca consomem nem avançam o número de patch beta/regular, portanto ignore tags legadas exclusivamente alfa com números de patch maiores ao selecionar um ciclo beta ou regular.
- Compilações alfa/noturnas usam o próximo ciclo de patch ainda não lançado e incrementam somente `alpha.N` em compilações repetidas. Quando esse patch tiver uma versão beta, as novas compilações alfa passam para o patch seguinte.
- As versões do npm são imutáveis: nunca exclua, republique nem reutilize uma tag publicada. Crie o próximo número de pré-lançamento ou o próximo patch mensal.
- `latest` continua acompanhando a linha npm regular/diária atual; `beta` é o alvo atual de instalação beta
- `extended-stable` significa o pacote npm com suporte referente ao mês anterior, começando pelo patch `33`; o patch `34` e os posteriores são lançamentos de manutenção nessa linha mensal
- Lançamentos finais regulares e lançamentos regulares de correção são publicados no `beta` do npm por padrão; os operadores de lançamento podem definir explicitamente o `latest` como alvo ou promover posteriormente uma compilação beta validada
- O caminho mensal dedicado de extended-stable publica o pacote principal do npm e todos os plugins oficiais publicáveis no npm com exatamente a mesma versão. Ele não publica plugins no ClawHub nem publica artefatos do macOS ou Windows, uma versão no GitHub, dist-tags de repositórios privados, imagens Docker, artefatos móveis ou downloads do site.
- Cada lançamento final regular disponibiliza em conjunto o pacote npm, o aplicativo para macOS, o APK Android autônomo assinado e os instaladores assinados do Windows Hub. Normalmente, os lançamentos beta validam e publicam primeiro o caminho do npm/pacote, reservando a compilação, assinatura, notarização e promoção dos aplicativos nativos para o lançamento final regular, salvo solicitação explícita.

## Cadência de lançamentos

- Os lançamentos avançam primeiro pela versão beta; a versão estável vem somente após a validação da versão beta mais recente
- Normalmente, os mantenedores criam lançamentos a partir de uma ramificação `release/YYYY.M.PATCH` criada com base no `main` atual, para que a validação e as correções do lançamento não bloqueiem novos desenvolvimentos no `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de uma correção, os mantenedores criam a próxima tag `-beta.N`, em vez de excluir ou recriar a anterior
- O procedimento detalhado de lançamento, as aprovações, as credenciais e as notas de recuperação são exclusivos dos mantenedores

## Publicação mensal extended-stable somente no npm

Esta é uma exceção dedicada ao procedimento regular de lançamento descrito
abaixo. Para um mês concluído `YYYY.M`, crie `extended-stable/YYYY.M.33`;
publique `vYYYY.M.33` e os patches de manutenção posteriores a partir dessa
mesma ramificação. A tag de lançamento, a ponta da ramificação, o checkout, a
versão do pacote, a pré-verificação do npm e a execução da Validação Completa
do Lançamento devem identificar o mesmo commit. O `main` protegido já deve
conter uma versão final de um mês estritamente posterior, com patch abaixo de
`33`; os patches de manutenção continuam qualificados depois que o `main`
avançar mais de um mês.

Na ramificação extended-stable exata, atualize o pacote raiz para `YYYY.M.P`,
execute `pnpm release:prep` e verifique se cada pacote de extensão publicável
tem a mesma versão. Faça commit e envie todas as alterações geradas, crie e
envie a tag imutável `vYYYY.M.P` nesse commit e registre o SHA completo
resultante. Os fluxos de trabalho consomem essa árvore preparada; eles não
atualizam nem sincronizam versões para você.

Execute a pré-verificação do npm e a Validação Completa do Lançamento a partir
da ponta exata dessa ramificação preparada e, em seguida, salve os dois IDs de
execução e a tentativa bem-sucedida da execução da Validação Completa do
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

Depois que ambas as execuções forem concluídas com êxito, publique todos os
plugins oficiais publicáveis no npm a partir da ponta exata da mesma
ramificação. O patch `P` deve ser `33` ou maior. Passe o SHA completo do
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
`all-publishable`, incluindo pacotes cujo código-fonte não foi alterado. Antes
de ser concluído com êxito, ele verifica cada pacote exato e cada tag
`extended-stable` de Plugin. Se uma execução parcial falhar, execute novamente
o mesmo comando: os pacotes já publicados serão reutilizados, as tags de
Plugin ausentes ou obsoletas serão reconciliadas no ambiente de lançamento do
npm e a releitura final ainda abrangerá o conjunto completo de pacotes.

Depois que o fluxo de trabalho de plugins for concluído com êxito e o ambiente
de lançamento do npm estiver pronto, publique o tarball principal exato da
pré-verificação. A publicação principal verifica se a execução de plugins
referenciada está como `completed/success` na mesma ramificação canônica e no
SHA exato do código-fonte:

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
satisfazer a política mensal de `.33` ou de mês do `main` protegido, adicione
`-f bypass_extended_stable_guard=true` aos acionamentos de pré-verificação e
publicação do npm. O padrão é `false`. A exceção é aceita somente com
`npm_dist_tag=extended-stable` e é registrada no resumo do fluxo de trabalho.
Ela não ignora a referência canônica de fluxo de trabalho
`extended-stable/YYYY.M.33`, a igualdade entre ponta da
ramificação/tag/checkout, a sintaxe da tag final, a igualdade entre as versões
do pacote e da tag, a identidade da execução e do manifesto referenciados, a
proveniência do tarball, a aprovação do ambiente, a releitura do registro nem
a evidência de reparo do seletor.

O fluxo de trabalho de publicação verifica as identidades das execuções
referenciadas de pré-verificação, validação e plugins, o resumo criptográfico
do tarball preparado e os seletores do registro principal. Confirme o
resultado de forma independente após a conclusão bem-sucedida do fluxo de
trabalho:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos os comandos devem retornar `YYYY.M.P`. Se a publicação for concluída com
êxito, mas a releitura do seletor falhar, não republique a versão imutável do
pacote. Use o único comando de reparo
`npm dist-tag add openclaw@YYYY.M.P extended-stable` exibido no resumo de
execução obrigatória do fluxo de trabalho com falha e repita as duas
releituras independentes. A reversão para o seletor anterior é uma decisão
separada do operador, não o caminho de reparo da releitura.

Inicialmente, a documentação pública de suporte designa Slack, Discord e Codex
como superfícies de Plugin abrangidas pelo extended-stable. Essa lista é uma
declaração de suporte, não uma lista de permissões do código de lançamento:
todos os plugins oficiais publicáveis no npm seguem o mesmo caminho de
publicação com versão exata.

A lista de verificação regular abaixo continua responsável por beta, `latest`,
versões do GitHub, plugins, macOS, Windows e publicações em outras plataformas.
Não execute essas etapas para este caminho extended-stable exclusivo do npm.

## Lista de verificação do operador para lançamentos regulares

Esta lista de verificação representa publicamente o formato do fluxo de lançamento. Credenciais privadas, assinatura, notarização, recuperação de dist-tags e detalhes de reversão de emergência permanecem no manual de lançamento exclusivo dos mantenedores.

1. Comece pela versão atual de `main`: obtenha as alterações mais recentes, confirme que o commit de destino foi enviado e que a CI de `main` está suficientemente verde para criar a ramificação.
2. Gere a seção superior de `CHANGELOG.md` com base nos PRs mesclados e em todos os commits diretos desde a última tag de versão alcançável. Mantenha as entradas voltadas para o usuário, elimine duplicações entre entradas sobrepostas de PRs e commits diretos, faça commit, envie e execute rebase/obtenha as alterações mais uma vez antes de criar a ramificação. Quando uma tag publicada divergente ou um forward-port posterior reassociar PRs já lançados, forneça essa tag explicitamente como `--shipped-ref`; o verificador usa linhas explícitas de PR dos registros completos de contribuição nas seções numeradas do snapshot da tag, ignora `Unreleased` e registra o inventário e a contagem exatos dos PRs excluídos.
3. Revise os registros de compatibilidade da versão em `src/plugins/compat/registry.ts` e `src/commands/doctor/shared/deprecation-compat.ts`. Remova a compatibilidade expirada somente quando o caminho de atualização continuar coberto ou registre por que ela é mantida intencionalmente.
4. Crie `release/YYYY.M.PATCH` a partir da versão atual de `main`. Não realize o trabalho normal de lançamento diretamente em `main`.
5. Atualize cada local obrigatório de versão para a tag e execute `pnpm release:prep`. O comando atualiza, em ordem, as versões dos plugins, os shrinkwraps do npm, o inventário de plugins, o esquema de configuração base, os metadados de configuração dos canais incluídos, a linha de base da documentação de configuração, as exportações do SDK de plugins e a linha de base da API do SDK de plugins. Faça commit de qualquer desvio gerado antes de criar a tag e, em seguida, execute a verificação prévia determinística local: `pnpm check:test-types`, `pnpm check:architecture`, `pnpm build && pnpm ui:build` e `pnpm release:check`.
6. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes que exista uma tag, um SHA completo de 40 caracteres da ramificação de lançamento é permitido apenas para a verificação prévia. A verificação prévia gera evidências de lançamento das dependências para o grafo de dependências exato obtido e as armazena no artefato de verificação prévia do npm. Salve o `preflight_run_id` bem-sucedido.
7. Inicie todos os testes de pré-lançamento com `Full Release Validation` para a ramificação, tag ou SHA completo do commit de lançamento. Esse é o único ponto de entrada manual para as quatro grandes caixas de testes de lançamento: Vitest, Docker, Laboratório de QA e Pacote. Salve o `full_release_validation_run_id` e o `full_release_validation_run_attempt` exato; ambos são entradas obrigatórias para `OpenClaw NPM Release` e `OpenClaw Release Publish`.
8. Se a validação falhar, corrija na ramificação de lançamento e execute novamente o menor arquivo, faixa, trabalho do fluxo de trabalho, perfil de pacote, provedor ou lista de permissão de modelos com falha que comprove a correção. Execute novamente o conjunto completo somente quando a superfície alterada tornar obsoletas as evidências anteriores.
9. Para um candidato beta com tag, execute `pnpm release:candidate -- --tag vYYYY.M.PATCH-beta.N` a partir da ramificação `release/YYYY.M.PATCH` correspondente. Para uma versão estável, forneça também a versão de origem obrigatória do Windows: `pnpm release:candidate -- --tag vYYYY.M.PATCH --windows-node-tag vX.Y.Z`. O auxiliar usa a `main` confiável como origem do fluxo de trabalho, enquanto cada fluxo de trabalho tem como destino a tag exata. Ele registra a identidade imutável do candidato e das ferramentas, bem como os IDs das execuções disparadas, em `.artifacts/release-candidate/<tag>/release-candidate-state.json`; executar novamente o mesmo comando retoma essas execuções exatas, enquanto qualquer divergência no candidato, nas ferramentas, no perfil ou nas opções causa uma falha fechada. Antes de disparar a matriz completa de validação, o auxiliar renderiza deterministicamente o corpo exato da versão do GitHub correspondente à tag e rejeita um título de versão ausente, um corpo acima do limite que não possa usar o formato compacto canônico ou uma proveniência de base/destino do registro de contribuições que não seja alcançável a partir da tag. Ele também valida quaisquer metadados explícitos de exclusão da linha de base publicada em relação aos registros cumulativos referenciados da tag. Em seguida, executa as verificações locais da versão gerada, dispara ou verifica a validação completa da versão e as evidências de verificação prévia do npm, executa a comprovação de instalação limpa/atualização do Parallels usando o tarball preparado exato, além da comprovação do pacote do Telegram, registra os planos de plugins para npm e ClawHub e imprime o comando exato `OpenClaw Release Publish` somente depois que o conjunto de evidências estiver verde.

   `OpenClaw Release Publish` envia em paralelo os pacotes de plugins selecionados ou todos os publicáveis ao npm e o mesmo conjunto ao ClawHub e, em seguida, promove o artefato preparado de verificação prévia do npm do OpenClaw com a dist-tag correspondente assim que a publicação dos plugins no npm for bem-sucedida. O checkout da versão continua sendo a raiz do produto e dos dados, enquanto o planejamento e a verificação final são executados a partir do checkout exato e confiável da origem do fluxo de trabalho, para que um commit de versão mais antigo não possa usar silenciosamente ferramentas de lançamento obsoletas. Antes de iniciar qualquer processo filho de publicação, ele renderiza e armazena em cache o corpo exato da versão do GitHub. Quando a seção completa correspondente de `CHANGELOG.md` cabe no limite de 125.000 caracteres do GitHub e no teto de segurança correspondente de 125.000 bytes do renderizador, a página contém exatamente essa seção `## YYYY.M.PATCH`, incluindo o título. Quando a seção de origem não cabe, a página mantém exatamente as notas editoriais agrupadas e substitui o registro de contribuições grande demais por um link estável para o registro completo no `CHANGELOG.md` fixado pela tag; registros parciais e itens truncados nunca são publicados. O fluxo de trabalho escolhe esse corpo completo ou compacto antes de adicionar `### Verificação da versão`; se a parte final da comprovação exceder o limite, ele mantém o corpo canônico e utiliza a evidência imutável anexada. Versões estáveis publicadas na `latest` do npm tornam-se a versão mais recente do GitHub, enquanto versões estáveis de manutenção mantidas na `beta` do npm são criadas com `latest=false` no GitHub. O fluxo de trabalho também envia as evidências de dependências da verificação prévia, o manifesto da validação completa e as evidências de verificação do registro após a publicação para a versão do GitHub, para resposta a incidentes posteriores ao lançamento. Ele imprime imediatamente os IDs das execuções filhas, aprova automaticamente as proteções do ambiente de lançamento que o token do fluxo de trabalho tem permissão para aprovar, resume os trabalhos filhos com falha incluindo o final dos logs, cria antecipadamente o rascunho da página da versão do GitHub e promove os artefatos do Windows e Android simultaneamente à publicação do OpenClaw no npm, conclui a página da versão e as evidências de dependências após o sucesso dessas etapas, aguarda o ClawHub sempre que o OpenClaw estiver sendo publicado no npm e, em seguida, executa o verificador beta da `main` confiável e envia evidências pós-publicação para a versão do GitHub, o pacote npm, os pacotes de plugins selecionados no npm, os pacotes selecionados no ClawHub, os IDs das execuções filhas e o ID opcional da execução NPM do Telegram. O verificador de inicialização do ClawHub exige o caminho e o SHA exatos do fluxo de trabalho da `main` confiável, as tentativas de execução do produtor e da etapa terminal, o SHA da versão, o conjunto de pacotes solicitado, a tupla imutável do artefato do pacote e o artefato terminal de leitura do registro; uma execução legada bem-sucedida da referência da versão não é aceita.

   Em seguida, execute a aceitação do pacote pós-publicação para o pacote publicado `openclaw@YYYY.M.PATCH-beta.N` ou `openclaw@beta`. Se uma pré-versão enviada ou publicada precisar de correção, crie o próximo número de pré-versão correspondente; nunca exclua nem reescreva o anterior.

10. Para uma versão estável, prossiga somente depois que a versão beta ou o candidato a lançamento aprovado tiver as evidências de validação obrigatórias. A publicação estável no npm também passa por `OpenClaw Release Publish`, reutilizando o artefato bem-sucedido da verificação prévia por meio de `preflight_run_id`. A prontidão da versão estável para macOS também exige os arquivos `.zip`, `.dmg` e `.dSYM.zip` empacotados, além do `appcast.xml` atualizado em `main`; o fluxo de trabalho de publicação para macOS publica automaticamente o appcast assinado na `main` pública após verificar os artefatos da versão ou abre/atualiza um PR do appcast se a proteção da ramificação bloquear o envio direto. A prontidão estável do Hub do Windows exige os artefatos assinados `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` e `OpenClawCompanion-SHA256SUMS.txt` na versão do OpenClaw no GitHub. Forneça a tag exata da versão assinada de `openclaw/openclaw-windows-node` como `windows_node_tag` e o mapa de resumos dos instaladores aprovado pelo candidato como `windows_node_installer_digests`; `OpenClaw Release Publish` mantém o rascunho da versão, dispara `Windows Node Release` e verifica os três artefatos antes da publicação.
11. Após a publicação, execute o verificador pós-publicação do npm, o E2E opcional e independente do Telegram com o npm publicado quando precisar de comprovação do canal após a publicação, a promoção da dist-tag quando necessário, verifique a página gerada da versão do GitHub, execute as etapas de anúncio da versão e, em seguida, conclua [Encerramento estável da main](#stable-main-closeout) antes de considerar concluída uma versão estável.

## Encerramento estável da main

A publicação estável não está concluída até que `main` contenha o estado da versão efetivamente publicada.

1. Comece pela versão mais recente e limpa de `main`. Audite `release/YYYY.M.PATCH` em relação a ela e faça forward-port das correções reais ausentes em `main`. Não mescle indiscriminadamente em uma `main` mais recente adaptadores de compatibilidade, testes ou validação exclusivos da versão.
2. Defina `main` com a versão estável publicada, não com um próximo ciclo especulativo. Execute `pnpm release:prep` após alterar a versão raiz e, em seguida, `pnpm deps:shrinkwrap:generate`.
3. Faça com que a seção `## YYYY.M.PATCH` de `CHANGELOG.md` em `main` corresponda exatamente à ramificação da versão com tag. Inclua a atualização estável de `appcast.xml` quando a versão para Mac tiver publicado uma.
4. Não adicione `YYYY.M.PATCH+1`, uma versão beta ou uma seção vazia de changelog futuro a `main` até que o operador inicie explicitamente esse ciclo de lançamento.
5. Execute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` e `OPENCLAW_TESTBOX=1 pnpm check:changed`. Envie as alterações e, em seguida, verifique se `origin/main` contém a versão e o changelog publicados antes de considerar concluída a versão estável.
6. Mantenha atualizadas as variáveis de repositório `RELEASE_ROLLBACK_DRILL_ID` e `RELEASE_ROLLBACK_DRILL_DATE` após cada simulação privada de reversão.

`OpenClaw Stable Main Closeout` começa no envio para `main` que contém a versão publicada, o changelog e o appcast após a publicação estável. Ele lê as evidências imutáveis pós-publicação para vincular a tag publicada às execuções da validação completa da versão e da publicação e, em seguida, verifica o estado estável da main, a versão, o período obrigatório de observação da versão estável e as evidências obrigatórias de desempenho. Ele anexa à versão do GitHub um manifesto imutável de encerramento e sua soma de verificação. O disparo automático por envio ignora versões legadas anteriores às evidências pós-publicação imutáveis e nunca considera essa omissão um encerramento concluído.

Um encerramento completo exige ambos os artefatos e uma soma de verificação correspondente. Um manifesto parcial repete o SHA de `main` e a simulação de reversão registrados para regenerar bytes idênticos e, em seguida, anexa a soma de verificação ausente; um par inválido, ou uma soma de verificação sem manifesto, continua bloqueando o processo. Uma execução disparada por envio sem as variáveis de repositório da simulação de reversão é ignorada sem concluir o encerramento; um registro de simulação ausente ou com mais de 90 dias continua bloqueando o encerramento manual baseado em evidências. Os comandos privados de recuperação permanecem no manual exclusivo dos mantenedores. Use o disparo manual somente para reparar ou repetir um encerramento estável baseado em evidências.

Uma tag legada de correção alternativa pode reutilizar as evidências do pacote base somente quando a tag de correção resolver para o mesmo commit de origem da tag estável base. Sua versão para Android reutiliza o APK verificado da tag base e adiciona a proveniência da tag de correção. Uma correção com origem diferente deve publicar e verificar suas próprias evidências de pacote e usar um `versionCode` do Android mais alto.

## Verificação prévia da versão

- Execute `pnpm check:test-types` antes da verificação preliminar da versão para que o TypeScript dos testes continue coberto fora da verificação local mais rápida `pnpm check`.
- Execute `pnpm check:architecture` antes da verificação preliminar da versão para que as verificações mais abrangentes de ciclos de importação e limites arquiteturais sejam aprovadas fora da verificação local mais rápida.
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de versão esperados em `dist/*` e o pacote da interface de controle existam para a etapa de validação do pacote.
- Execute `pnpm release:prep` após incrementar a versão raiz e antes de criar a tag. Ele executa todos os geradores determinísticos de versão que costumam ficar dessincronizados após uma alteração de versão/configuração/API: versões de plugins, shrinkwraps do npm, inventário de plugins, esquema de configuração base, metadados de configuração dos canais incluídos, linha de base da documentação de configuração, exportações do SDK de plugins e linha de base da API do SDK de plugins. `pnpm release:check` executa novamente essas verificações no modo de conferência (além de uma verificação do limite da superfície do SDK de plugins) e relata todas as falhas de dessincronização gerada em uma única passagem antes de executar as verificações de lançamento dos pacotes.
- Por padrão, a sincronização de versões dos plugins atualiza o pacote de runtime publicável `@openclaw/ai`, as versões dos pacotes de plugins oficiais e os limites mínimos existentes de `openclaw.compat.pluginApi` para a versão do OpenClaw. Trate esse campo como o limite mínimo da API do SDK/runtime de plugins, não apenas como uma cópia da versão do pacote: para lançamentos exclusivos de plugins que permaneçam intencionalmente compatíveis com hosts OpenClaw mais antigos, mantenha o limite mínimo na API do host mais antigo compatível e documente essa escolha nas evidências do lançamento do plugin.
- Execute o fluxo de trabalho manual `Full Release Validation` antes da aprovação da versão para iniciar todas as plataformas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita um branch, uma tag ou um SHA completo de commit, aciona manualmente `CI` e aciona `OpenClaw Release Checks` para testes rápidos de instalação, aceitação de pacotes, verificações de pacotes entre sistemas operacionais, paridade do Laboratório de QA, Matrix e etapas do Telegram. Execuções estáveis e completas sempre incluem testes completos em ambiente real/E2E e testes prolongados do caminho de lançamento no Docker; `run_release_soak=true` é mantido para um teste prolongado explícito de versão beta. A Aceitação de Pacotes fornece o E2E canônico de Telegram do pacote durante a validação do candidato, evitando um segundo processo concorrente de consulta em ambiente real.

  Forneça `release_package_spec` após publicar uma versão beta para reutilizar o pacote npm lançado nas verificações de versão, na Aceitação de Pacotes e no E2E de Telegram do pacote sem recompilar o tarball da versão. Forneça `npm_telegram_package_spec` somente quando o Telegram precisar usar um pacote publicado diferente do restante da validação da versão. Forneça `package_acceptance_package_spec` quando a Aceitação de Pacotes precisar usar um pacote publicado diferente da especificação do pacote da versão. Forneça `evidence_package_spec` quando o relatório de evidências da versão precisar comprovar que a validação corresponde a um pacote npm publicado sem forçar o E2E de Telegram.

  ```bash
  gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.PATCH
  ```

- Execute o fluxo de trabalho manual `Package Acceptance` quando quiser obter evidências por um canal paralelo para um pacote candidato enquanto o trabalho de lançamento continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata; `source=ref` para empacotar um branch/tag/SHA confiável em `package_ref` com a estrutura atual de `workflow_ref`; `source=url` para um tarball HTTPS público com SHA-256 obrigatório e uma política estrita de URL pública; `source=trusted-url` para uma política de origem confiável nomeada usando `trusted_source_id` e SHA-256 obrigatórios; ou `source=artifact` para um tarball enviado por outra execução do GitHub Actions.

  O fluxo de trabalho resolve o candidato como `package-under-test`, reutiliza o agendador de lançamento E2E do Docker com esse tarball e pode executar a QA do Telegram com o mesmo tarball usando `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as etapas do Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada. `update-restart-auth` usa o pacote candidato tanto como a CLI instalada quanto como o pacote em teste, para exercitar o caminho de reinicialização gerenciada do comando de atualização candidato.

  Exemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfis comuns:
  - `smoke`: etapas de instalação/canal/agente, rede do Gateway e recarregamento de configuração
  - `package`: etapas nativas de artefato para pacote/atualização/reinicialização/plugin sem OpenWebUI nem ClawHub em ambiente real
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagentes, pesquisa na Web da OpenAI e OpenWebUI
  - `full`: blocos do caminho de lançamento no Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma nova execução focada

- Execute diretamente o fluxo de trabalho manual `CI` quando precisar apenas da cobertura determinística da CI normal para o candidato a lançamento. Acionamentos manuais da CI ignoram o escopo por alterações e forçam os fragmentos do Node no Linux, fragmentos de plugins incluídos, fragmentos de contratos de plugins e canais, compatibilidade com Node 22, `check-*`, `check-additional-*`, testes rápidos de artefatos compilados, verificações da documentação, Skills em Python, Windows, macOS e etapas de internacionalização da interface de controle. Execuções manuais independentes da CI executam o Android somente quando acionadas com `include_android=true`; `Full Release Validation` passa essa entrada para sua execução filha da CI.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Execute `pnpm qa:otel:smoke` ao validar a telemetria da versão. Ele exercita o laboratório de QA por meio de um receptor OTLP/HTTP local e verifica a exportação de rastreamentos, métricas e logs, além de atributos limitados de rastreamento e da remoção de conteúdo/identificadores, sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm qa:otel:collector-smoke` ao validar a compatibilidade com o coletor. Ele encaminha a mesma exportação OTLP do laboratório de QA por meio de um contêiner Docker real do OpenTelemetry Collector antes das verificações do receptor local.
- Execute `pnpm qa:prometheus:smoke` ao validar a coleta protegida do Prometheus. Ele exercita o laboratório de QA, rejeita coletas não autenticadas e verifica se as famílias de métricas críticas para a versão permanecem livres de conteúdo de prompts, identificadores brutos, tokens de autenticação e caminhos locais.
- Execute `pnpm qa:observability:smoke` para executar consecutivamente as etapas de testes rápidos do OpenTelemetry e do Prometheus a partir do checkout do código-fonte.
- Execute `pnpm release:check` antes de cada versão com tag.
- A verificação preliminar de `OpenClaw NPM Release` gera evidências sobre as dependências da versão antes de empacotar o tarball do npm. A verificação de vulnerabilidades dos avisos de segurança do npm bloqueia o lançamento. Os relatórios de risco do manifesto transitivo, superfície de propriedade/instalação de dependências e alterações de dependências servem apenas como evidências da versão. O relatório de alterações de dependências compara o candidato a lançamento com a tag de versão alcançável anterior. A verificação preliminar envia as evidências de dependências como `openclaw-release-dependency-evidence-<tag>` e também as incorpora em `dependency-evidence/` dentro do artefato preparado da verificação preliminar do npm. O caminho real de publicação reutiliza esse artefato de verificação preliminar e anexa as mesmas evidências à versão do GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Execute `OpenClaw Release Publish` para a sequência de publicação que realiza alterações após a existência da tag. Acione publicações beta e estáveis regulares a partir do `main` confiável; a tag da versão ainda seleciona o commit de destino exato e pode apontar para `release/YYYY.M.PATCH`. As publicações alfa do Tideclaw permanecem no branch alfa correspondente. Passe o `preflight_run_id` bem-sucedido do npm do OpenClaw, o `full_release_validation_run_id` bem-sucedido e o `full_release_validation_run_attempt` exato, e mantenha o escopo padrão de publicação de plugins `all-publishable`, a menos que esteja executando deliberadamente um reparo focado. O fluxo de trabalho serializa a publicação de plugins no npm, a publicação de plugins no ClawHub e a publicação do OpenClaw no npm para que o pacote principal não seja publicado antes de seus plugins externalizados; a promoção para Windows e Android é executada simultaneamente à publicação principal no npm usando a página de rascunho da versão. Novas execuções de publicação podem ser retomadas: uma versão principal já publicada no npm ignora o acionamento principal depois que o fluxo de trabalho comprova que o tarball do registro corresponde ao artefato de verificação preliminar da tag, e a promoção para Windows/Android é ignorada quando a versão já contém o contrato de artefatos verificado; assim, uma nova tentativa refaz apenas as etapas que falharam. Reparos focados exclusivamente em plugins exigem `plugin_publish_scope=selected` e uma lista de plugins não vazia. Execuções `all-publishable` exclusivas de plugins exigem evidências imutáveis e completas da verificação preliminar e da Validação Completa da Versão; evidências parciais são rejeitadas.
- A execução estável de `OpenClaw Release Publish` exige um `windows_node_tag` exato após a existência da versão correspondente não preliminar de `openclaw/openclaw-windows-node`, além do mapa `windows_node_installer_digests` aprovado para o candidato. Antes de acionar qualquer fluxo filho de publicação, ela verifica se essa versão de origem está publicada, não é preliminar, contém os instaladores x64/ARM64 obrigatórios e ainda corresponde ao mapa aprovado. Em seguida, aciona `Windows Node Release` enquanto a versão do OpenClaw ainda é um rascunho, mantendo inalterado o mapa fixado de resumos dos instaladores. O fluxo de trabalho filho baixa os instaladores assinados do Windows Hub dessa tag exata, compara-os com os resumos fixados, verifica em um executor Windows se as assinaturas Authenticode usam o signatário esperado da OpenClaw Foundation, grava um manifesto SHA-256 e envia os instaladores e o manifesto para a versão canônica do OpenClaw no GitHub; depois, baixa novamente os artefatos promovidos e verifica a associação ao manifesto e os hashes. O fluxo pai verifica o contrato atual dos artefatos x64, ARM64 e de soma de verificação antes da publicação. A recuperação direta rejeita nomes de artefatos `OpenClawCompanion-*` inesperados antes de substituir os artefatos esperados do contrato pelos bytes fixados da origem.

  Acione manualmente `Windows Node Release` somente para recuperação e sempre passe uma tag exata, nunca `latest`, além do mapa JSON explícito `expected_installer_digests` da versão de origem aprovada. Os links de download do site devem apontar para URLs exatas dos artefatos da versão estável atual do OpenClaw ou para `releases/latest/download/...` somente após verificar que o redirecionamento de versão mais recente do GitHub aponta para essa mesma versão; não crie links apenas para a página de versão do repositório complementar.

- As verificações de release agora são executadas em um fluxo de trabalho manual separado: `OpenClaw Release Checks`. Ele também executa a pista de paridade simulada do QA Lab, além do perfil rápido do Matrix ao vivo e da pista de QA do Telegram antes da aprovação da release. As pistas ao vivo usam o ambiente `qa-live-shared`; o Telegram também usa concessões de credenciais de CI do Convex. Execute o fluxo de trabalho manual `QA-Lab - All Lanes` com `matrix_profile=all` e `matrix_shards=true` quando quiser executar em paralelo o inventário completo de transporte, mídia e E2EE do Matrix.
- A validação de runtime de instalação e atualização entre sistemas operacionais faz parte dos fluxos públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o fluxo de trabalho reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Essa separação é intencional: mantém o caminho real de release no npm curto, determinístico e concentrado em artefatos, enquanto as verificações ao vivo mais lentas permanecem em sua própria pista para não atrasar nem bloquear a publicação.
- As verificações de release que usam segredos devem ser disparadas por meio de `Full Release Validation` ou a partir da referência do fluxo de trabalho de `main`/release, para que a lógica do fluxo de trabalho e os segredos permaneçam controlados.
- `OpenClaw Release Checks` aceita uma branch, uma tag ou o SHA completo de um commit, desde que o commit resolvido esteja acessível a partir de uma branch ou tag de release do OpenClaw.
- A pré-verificação somente de validação de `OpenClaw NPM Release` também aceita o SHA completo de 40 caracteres do commit atual da branch do fluxo de trabalho, sem exigir uma tag enviada. Esse caminho por SHA serve apenas para validação e não pode ser promovido a uma publicação real. No modo SHA, o fluxo de trabalho sintetiza `v<package.json version>` somente para a verificação dos metadados do pacote; a publicação real ainda exige uma tag de release real.
- Ambos os fluxos de trabalho mantêm o caminho real de publicação e promoção nos executores hospedados pelo GitHub, enquanto o caminho de validação sem mutações pode usar os executores Linux maiores do Blacksmith.
- Esse fluxo de trabalho executa `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando os segredos de fluxo de trabalho `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`.
- A pré-verificação de release no npm não aguarda mais a pista separada de verificações de release.
- Antes de criar localmente a tag de uma candidata a release, execute `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. O auxiliar executa as verificações rápidas de proteção da release, as verificações de release de plugins no npm/ClawHub, o build, o build da UI e `release:openclaw:npm:check`, na ordem que detecta erros comuns que bloqueariam a aprovação antes do início do fluxo de publicação do GitHub.
- Execute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (ou a tag correspondente de pré-release/correção) antes da aprovação.
- Após a publicação no npm, execute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (ou a versão beta/de correção correspondente) para verificar o caminho de instalação publicado no registro usando um prefixo temporário novo.
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar a integração inicial do pacote instalado, a configuração do Telegram e o E2E real do Telegram com o pacote npm publicado, usando o pool compartilhado de credenciais concedidas do Telegram. Em execuções locais pontuais, mantenedores podem omitir as variáveis do Convex e fornecer diretamente as três credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Para executar a verificação completa pós-publicação da beta a partir da máquina de um mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O auxiliar executa a validação de atualização do npm e de destino novo no Parallels, dispara `NPM Telegram Beta E2E`, consulta a execução exata do fluxo de trabalho, baixa o artefato e imprime o relatório do Telegram.
- Os mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions por meio do fluxo de trabalho manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e não é executado a cada merge.
- A automação de release dos mantenedores usa pré-verificação seguida de promoção:
  - A publicação real no npm deve ter um `preflight_run_id` de npm bem-sucedido.
  - A orquestração e a pré-verificação de publicações beta regulares e estáveis usam a `main` confiável com a tag de destino exata. A publicação e a pré-verificação alfa do Tideclaw usam a branch alfa correspondente.
  - As releases estáveis no npm usam `beta` por padrão; a publicação estável no npm pode definir explicitamente `latest` como destino por meio da entrada do fluxo de trabalho.
  - A mutação de dist-tags do npm baseada em token fica em `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, pois `npm dist-tag add` ainda exige `NPM_TOKEN`, enquanto o repositório de origem mantém a publicação somente por OIDC.
  - O fluxo público `macOS Release` serve apenas para validação; quando uma tag existe somente em uma branch de release, mas o fluxo de trabalho é disparado a partir de `main`, defina `public_release_branch=release/YYYY.M.PATCH`.
  - A publicação real para macOS deve ter `preflight_run_id` e `validate_run_id` de macOS bem-sucedidos.
  - Os caminhos de publicação real promovem os artefatos preparados em vez de recriá-los novamente.
- Para releases estáveis de correção, como `YYYY.M.PATCH-N`, o verificador pós-publicação também verifica o mesmo caminho de atualização com prefixo temporário, de `YYYY.M.PATCH` para `YYYY.M.PATCH-N`, para que correções de release não possam deixar silenciosamente instalações globais mais antigas com a carga útil da versão estável base.
- A pré-verificação de release no npm falha de forma fechada, a menos que o tarball inclua `dist/control-ui/index.html` e uma carga útil não vazia em `dist/control-ui/assets/`, para que não voltemos a distribuir um painel do navegador vazio.
- A verificação pós-publicação também confirma que os pontos de entrada dos plugins publicados e os metadados do pacote estão presentes no layout instalado a partir do registro. Uma release sem as cargas úteis de runtime dos plugins falha no verificador pós-publicação e não pode ser promovida a `latest`.
- `pnpm test:install:smoke` também impõe o limite de `unpackedSize` do pacote npm ao tarball candidato à atualização, para que o E2E do instalador detecte aumentos acidentais no tamanho do pacote antes do caminho de publicação da release.
- Se o trabalho da release alterou o planejamento da CI, os manifestos de duração das extensões ou as matrizes de testes das extensões, regenere e revise antes da aprovação as saídas da matriz `plugin-prerelease-extension-shard`, controladas pelo planejador em `.github/workflows/plugin-prerelease.yml`, para que as notas de release não descrevam um layout de CI desatualizado.
- A prontidão da release estável para macOS também inclui as superfícies do atualizador: a release do GitHub deve terminar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`; o `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação (o fluxo de publicação do macOS faz o commit automaticamente ou abre um PR do appcast quando o envio direto está bloqueado); o aplicativo empacotado deve manter um identificador de pacote que não seja de depuração, uma URL de feed do Sparkle não vazia e um `CFBundleVersion` igual ou superior ao valor mínimo canônico de build do Sparkle para essa versão da release.

## Ambientes de teste de release

`Full Release Validation` é o modo pelo qual os operadores iniciam todos os testes de pré-release a partir de um único ponto de entrada. Para comprovar um commit fixado em uma branch que muda rapidamente, use o auxiliar para que cada fluxo de trabalho filho seja executado a partir de uma branch temporária fixada em um único SHA confiável do fluxo de trabalho de `main`, enquanto o commit solicitado permanece como candidato em teste:

```bash
pnpm ci:full-release --sha <full-sha>
```

O auxiliar busca a versão atual de `origin/main`, envia `release-ci/<workflow-sha>-...` no commit confiável do fluxo de trabalho, dispara `Full Release Validation` a partir da branch temporária com `ref=<target-sha>`, reutiliza evidências estritas do destino exato quando disponíveis, verifica se o `headSha` de cada fluxo de trabalho filho corresponde ao SHA fixado do fluxo de trabalho pai e, então, exclui a branch temporária. Passe `-f reuse_evidence=false` para forçar uma nova execução ou `--workflow-sha <trusted-main-sha>` para fixar um commit mais antigo que ainda esteja acessível a partir da versão atual de `origin/main`. O próprio fluxo de trabalho nunca grava referências no repositório. Isso mantém as ferramentas de release exclusivas da `main` disponíveis sem adicionar commits de ferramentas ao candidato e evita comprovar acidentalmente uma execução filha de uma `main` mais recente.

Para validar uma branch ou tag de release, execute a partir da referência confiável do fluxo de trabalho de `main` e forneça a branch ou tag de release como `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.PATCH \
  -f provider=openai \
  -f mode=both \
  -f release_profile=stable \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N
```

O fluxo de trabalho resolve a referência de destino, dispara manualmente `CI` com `target_ref=<release-ref>` e, em seguida, dispara `OpenClaw Release Checks`. `OpenClaw Release Checks` distribui as verificações de instalação, as verificações de release entre sistemas operacionais, a cobertura ao vivo/E2E do caminho de release em Docker quando o teste prolongado está ativado, a Aceitação do Pacote com o E2E canônico do pacote do Telegram, a paridade do QA Lab, o Matrix ao vivo e o Telegram ao vivo. Uma execução completa/total só é aceitável quando o resumo de `Full Release Validation` mostra `normal_ci`, `plugin_prerelease` e `release_checks` como bem-sucedidos, salvo quando uma nova execução direcionada omitiu intencionalmente o filho separado `Plugin Prerelease`. Use o filho independente `npm-telegram` somente para uma nova execução direcionada do pacote publicado com `release_package_spec` ou `npm_telegram_package_spec`. O resumo final do verificador inclui tabelas dos trabalhos mais lentos de cada execução filha, permitindo que o responsável pela release veja o caminho crítico atual sem baixar logs.

O filho de desempenho do produto produz somente artefatos neste caminho de release. O
fluxo abrangente o dispara com `publish_reports=false`, e a validação é rejeitada
a menos que sua proteção de somente artefatos comprove que o publicador de relatórios do Clawgrit permaneceu
ignorado.

Consulte [Validação completa da release](/pt-BR/reference/full-release-validation) para ver a matriz completa de etapas, os nomes exatos dos trabalhos do fluxo de trabalho, as diferenças entre os perfis estável e completo, os artefatos e os controles de novas execuções direcionadas.

Os fluxos de trabalho filhos são disparados a partir da referência confiável que executa `Full Release Validation`, normalmente `--ref main`, mesmo quando a `ref` de destino aponta para uma branch ou tag de release mais antiga. Toda execução filha deve usar o SHA exato do fluxo de trabalho pai; se `main` avançar antes que o disparo de um filho seja resolvido, o fluxo abrangente falhará de forma fechada. Não há uma entrada separada de referência do fluxo de trabalho para Full Release Validation; escolha o mecanismo confiável selecionando a referência de execução do fluxo de trabalho. Não use `--ref main -f ref=<sha>` para comprovar um commit exato em uma `main` em movimento; SHAs brutos de commits não podem ser referências de disparo de fluxos de trabalho, portanto use `pnpm ci:full-release --sha <target-sha>` para criar uma branch temporária na `origin/main` confiável, mantendo o SHA de destino como entrada do candidato.

Use `release_profile` para selecionar a abrangência ao vivo/de provedores:

- `minimum`: o caminho ao vivo e em Docker mais rápido e crítico para a release de OpenAI/núcleo
- `stable`: o mínimo mais a cobertura estável de provedores/backends para aprovação da release
- `full`: o estável mais uma ampla cobertura consultiva de provedores/mídia

As validações estável e completa sempre executam a varredura exaustiva ao vivo/E2E, do caminho de release em Docker e de sobrevivência limitada a atualizações publicadas antes da promoção. Use `run_release_soak=true` para solicitar a mesma varredura para uma beta. Essa varredura abrange os quatro pacotes estáveis mais recentes, mais as referências fixadas `2026.4.23` e `2026.5.2`, além da cobertura mais antiga de `2026.4.15`, removendo referências duplicadas e distribuindo cada referência em seu próprio trabalho de executor Docker.

`OpenClaw Release Checks` usa a referência confiável do fluxo de trabalho para resolver uma vez a referência de destino como `release-package-under-test` e reutiliza esse artefato nas verificações entre sistemas operacionais, na Aceitação do Pacote e nas verificações em Docker do caminho de release quando o teste prolongado é executado. Isso mantém todos os ambientes voltados a pacotes usando exatamente os mesmos bytes e evita builds repetidos do pacote. Depois que uma beta já estiver no npm, defina `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que as verificações de release baixem o pacote distribuído uma vez, extraiam o SHA da origem do build em `dist/build-info.json` e reutilizem esse artefato nas pistas entre sistemas operacionais, de Aceitação do Pacote, de Docker do caminho de release e do pacote do Telegram.

A verificação de instalação do OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a variável do repositório/organização está definida; caso contrário, usa `openai/gpt-5.6-luna`, pois essa pista comprova a instalação do pacote, a integração inicial, a inicialização do Gateway e uma interação ao vivo com o agente, em vez de avaliar o desempenho do modelo mais avançado. A matriz mais ampla de provedores ao vivo continua sendo o local para cobertura específica de modelos.

Use estas variantes conforme a etapa da release:

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

Não use o fluxo completo como a primeira reexecução após uma correção direcionada. Se um bloco falhar, use o fluxo de trabalho filho, o job, a faixa do Docker, o perfil de pacote, o provedor de modelo ou a faixa de QA que falhou para a próxima comprovação. Execute o fluxo completo novamente somente quando a correção alterar a orquestração compartilhada da versão ou tornar obsoletas as evidências anteriores de todos os blocos. O verificador final do fluxo completo verifica novamente os IDs registrados das execuções dos fluxos de trabalho filhos; portanto, depois que um fluxo de trabalho filho for reexecutado com sucesso, reexecute somente o job pai `Verify full validation` que falhou.

`rerun_group=all` pode reutilizar uma execução anterior bem-sucedida do fluxo completo somente quando ela tiver validado exatamente o mesmo SHA de destino, perfil de versão, configuração efetiva de soak e entradas de validação. Essa é uma recuperação limitada para reexecutar o mesmo candidato, não para reutilizar evidências entre SHAs. Para um candidato alterado, incluindo um commit que altere apenas o changelog ou a versão, reexecute todas as verificações de pacote, artefato, instalação, Docker ou provedor afetadas pelos caminhos ou hashes de artefatos alterados. Execuções mais recentes do fluxo completo para a mesma ref `release/*` e o mesmo grupo de reexecução substituem automaticamente as que estiverem em andamento. Passe `reuse_evidence=false` para forçar uma nova execução completa.

Para uma recuperação limitada, passe `rerun_group` ao fluxo completo. `all` é a execução real do candidato a versão, `ci` executa somente o filho de CI normal, `plugin-prerelease` executa somente o filho de Plugin exclusivo da versão, `release-checks` executa todos os blocos da versão, e os grupos de versão mais restritos são `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`. Reexecuções direcionadas de `npm-telegram` exigem `release_package_spec` ou `npm_telegram_package_spec`; execuções completas ou `all` usam o E2E canônico de pacote do Telegram dentro de Package Acceptance. Reexecuções direcionadas entre sistemas operacionais podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou outro filtro de sistema operacional/suíte. Falhas nas verificações de versão de QA bloqueiam a validação normal da versão, incluindo divergências obrigatórias das ferramentas dinâmicas do OpenClaw na camada padrão. Execuções alfa do Tideclaw ainda podem tratar como informativas as faixas de verificação de versão que não estejam relacionadas à segurança do pacote. Com `release_profile=beta`, as suítes de provedor ativo `Run repo/live E2E validation` são informativas (avisos, não bloqueios); os perfis estável e completo continuam tratando-as como bloqueantes. Quando `live_suite_filter` solicita explicitamente uma faixa ativa de QA controlada, como Discord, WhatsApp ou Slack, a variável correspondente do repositório `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` deve estar habilitada; caso contrário, a captura das entradas falha em vez de ignorar silenciosamente a faixa.

### Vitest

O bloco do Vitest é o fluxo de trabalho filho manual `CI`. A CI manual ignora intencionalmente o escopo baseado em alterações e força o grafo normal de testes para o candidato a versão: fragmentos do Linux Node, fragmentos de plugins incluídos, fragmentos de contratos de plugins e canais, compatibilidade com Node 22, `check-*`, `check-additional-*`, verificações rápidas de artefatos compilados, verificações da documentação, Skills em Python, Windows, macOS e internacionalização da Control UI. O Android é incluído quando `Full Release Validation` executa o bloco, pois o fluxo completo passa `include_android=true`; a CI manual independente exige `include_android=true` para cobrir o Android.

Use esse bloco para responder: “a árvore de código-fonte passou por toda a suíte normal de testes?”. Isso não é o mesmo que a validação do produto pelo caminho de versão. Evidências a manter:

- resumo de `Full Release Validation` mostrando a URL da execução de `CI` iniciada
- execução de `CI` bem-sucedida no SHA de destino exato
- nomes dos fragmentos com falha ou lentos nos jobs de CI ao investigar regressões
- artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando uma execução precisar de análise de desempenho

Execute a CI manual diretamente somente quando a versão precisar de uma CI normal determinística, mas não dos blocos do Docker, QA Lab, ambiente ativo, múltiplos sistemas operacionais ou pacotes. Use o primeiro comando para CI direta sem Android. Adicione `include_android=true` quando a CI direta do candidato a versão precisar cobrir o Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

O bloco do Docker fica em `OpenClaw Release Checks` por meio de `openclaw-live-and-e2e-checks-reusable.yml`, além do fluxo de trabalho `install-smoke` no modo de versão. Ele valida o candidato a versão por meio de ambientes Docker empacotados, em vez de usar apenas testes no nível do código-fonte.

A cobertura do Docker para versões inclui:

- verificação rápida completa de instalação com a verificação lenta de instalação global do Bun habilitada
- preparação/reutilização da imagem de verificação rápida do Dockerfile raiz pelo SHA de destino, com jobs de QR, raiz/Gateway e instalador/Bun executados como fragmentos separados de `install-smoke`
- faixas E2E do repositório
- blocos do Docker do caminho de versão: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h` e `openwebui`
- cobertura do OpenWebUI em um executor dedicado com disco grande quando solicitada
- faixas divididas de instalação/desinstalação dos plugins incluídos, de `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- suítes de provedores ativos/E2E e cobertura de modelos ativos no Docker quando as verificações de versão incluem suítes ativas

Use os artefatos do Docker antes de reexecutar. O agendador do caminho de versão envia `.artifacts/docker-tests/` com logs das faixas, `summary.json`, `failures.json`, tempos das fases, JSON do plano do agendador e comandos de reexecução. Para recuperação direcionada, use `docker_lanes=<lane[,lane]>` no fluxo de trabalho reutilizável ativo/E2E, em vez de reexecutar todos os blocos da versão. Os comandos de reexecução gerados incluem o `package_artifact_run_id` anterior e as entradas das imagens Docker preparadas quando disponíveis, permitindo que uma faixa com falha reutilize o mesmo tarball e as mesmas imagens do GHCR.

### QA Lab

O bloco do QA Lab também faz parte de `OpenClaw Release Checks`. Ele é a verificação de versão para comportamento agêntico e no nível dos canais, separada do Vitest e dos mecanismos de empacotamento do Docker.

A cobertura do QA Lab para versões inclui:

- faixa de paridade simulada que compara a faixa candidata da OpenAI com a referência `anthropic/claude-opus-4-8` usando o pacote de paridade agêntica
- perfil rápido de QA ativa do Matrix usando o ambiente `qa-live-shared`
- faixa ativa de QA do Telegram usando concessões de credenciais de CI do Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` ou `pnpm qa:observability:smoke` quando a telemetria da versão precisar de comprovação local explícita

Use esse bloco para responder: “a versão se comporta corretamente nos cenários de QA e nos fluxos ativos dos canais?”. Mantenha as URLs dos artefatos das faixas de paridade, Matrix e Telegram ao aprovar a versão. A cobertura completa do Matrix continua disponível como uma execução manual fragmentada do QA Lab, em vez de ser a faixa crítica padrão da versão.

### Pacote

O bloco de pacote é a verificação do produto instalável. Ele é sustentado por `Package Acceptance` e pelo resolvedor `scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um candidato no tarball `package-under-test` consumido pelo E2E do Docker, valida o inventário do pacote, registra a versão e o SHA-256 do pacote e mantém a ref do ambiente do fluxo de trabalho separada da ref de origem do pacote.

Origens de candidatos compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão exata do OpenClaw
- `source=ref`: empacota uma branch, tag ou SHA completo de commit confiável em `package_ref` com o ambiente `workflow_ref` selecionado
- `source=url`: baixa um `.tgz` HTTPS público com `package_sha256` obrigatório; credenciais na URL, portas HTTPS não padrão, nomes de host ou endereços resolvidos privados/internos/de uso especial e redirecionamentos inseguros são rejeitados
- `source=trusted-url`: baixa um `.tgz` HTTPS com `package_sha256` e `trusted_source_id` obrigatórios a partir de uma política nomeada em `.github/package-trusted-sources.json`; use essa opção para espelhos empresariais mantidos pelos responsáveis ou repositórios privados de pacotes, em vez de adicionar a `source=url` uma forma de ignorar a rede privada no nível das entradas
- `source=artifact`: reutiliza um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa Package Acceptance com `source=artifact`, o artefato preparado do pacote da versão, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. Package Acceptance mantém migração, atualização, atualização de VPS gerenciado pelo usuário root, reinicialização após atualização com autenticação configurada, instalação ativa de Skills do ClawHub, limpeza de dependências obsoletas de plugins, acessórios de teste de plugins offline, atualização de plugins, proteção contra escape na vinculação de comandos de plugins e QA de pacote do Telegram no mesmo tarball resolvido. As verificações bloqueantes da versão usam como referência padrão o pacote publicado mais recente; o perfil beta com `run_release_soak=true`, `release_profile=stable` ou `release_profile=full` expande a varredura de sobrevivência à atualização publicada para `last-stable-4`, além das referências fixadas `2026.4.23`, `2026.5.2` e `2026.4.15`, com cenários `reported-issues`. Use Package Acceptance com `source=npm` para um candidato já publicado, `source=ref` para um tarball npm local respaldado por SHA antes da publicação, `source=trusted-url` para um espelho empresarial/privado mantido pelos responsáveis ou `source=artifact` para um tarball preparado enviado por outra execução do GitHub Actions.

Ele é o substituto nativo do GitHub para a maior parte da cobertura de pacote/atualização que antes exigia Parallels. As verificações de versão entre sistemas operacionais ainda são importantes para integração inicial, instaladores e comportamentos específicos das plataformas, mas a validação de produto para pacotes/atualizações deve dar preferência a Package Acceptance.

A lista de verificação canônica para validar atualizações e plugins é [Testando atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao decidir qual faixa local, do Docker, de Package Acceptance ou de verificação de versão comprova uma instalação/atualização de Plugin, uma limpeza pelo doctor ou uma alteração de migração de pacote publicado. A migração exaustiva de atualizações publicadas de cada pacote estável `2026.4.23+` é um fluxo de trabalho manual separado, `Update Migration`, e não faz parte da CI completa da versão.

A tolerância legada de Package Acceptance tem, intencionalmente, prazo limitado. Pacotes até `2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicadas no npm: entradas privadas do inventário de QA ausentes no tarball, ausência de `gateway install --wrapper`, arquivos de patch ausentes no acessório de teste do Git derivado do tarball, ausência de persistência de `update.channel`, locais legados de registros de instalação de plugins, ausência de persistência dos registros de instalação do marketplace e migração dos metadados de configuração durante `plugins update`. O pacote publicado `2026.4.26` pode emitir avisos para arquivos locais de carimbo dos metadados de compilação que já foram publicados. Pacotes posteriores devem atender aos contratos modernos de pacotes; essas mesmas lacunas fazem a validação da versão falhar.

Use perfis mais abrangentes de Package Acceptance quando a questão da versão envolver um pacote instalável real:

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

- `smoke`: etapas rápidas de instalação do pacote/canal/agente, rede do Gateway e recarregamento da configuração
- `package`: contratos de instalação/atualização/reinicialização/pacote de Plugin, além de comprovação de instalação real de skill do ClawHub; este é o padrão da verificação de versão
- `product`: `package` mais canais MCP, limpeza de Cron/subagentes, pesquisa na web da OpenAI e OpenWebUI
- `full`: blocos do caminho de lançamento no Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções específicas

Para comprovação do Telegram com pacote candidato, habilite `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` na Aceitação de Pacotes. O fluxo de trabalho passa o tarball `package-under-test` resolvido para a etapa do Telegram; o fluxo de trabalho independente do Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação de publicação de versão regular

Para publicação beta, `latest`, de plugins, de GitHub Release e de plataformas,
`OpenClaw Release Publish` é o ponto de entrada mutável normal. O caminho
mensal de estabilidade estendida somente no npm `.33+` não usa este orquestrador. O
fluxo de trabalho regular orquestra os fluxos de trabalho de publicador confiável na ordem
exigida pela versão:

1. Faz checkout da tag da versão e resolve o SHA do commit correspondente.
2. Verifica se a tag é alcançável a partir de `main` ou `release/*` (ou de uma ramificação alfa do Tideclaw para pré-lançamentos alfa).
3. Executa `pnpm plugins:sync:check`.
4. Dispara `Plugin NPM Release` com `publish_scope=all-publishable` e `ref=<release-sha>`.
5. Dispara `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Dispara `OpenClaw NPM Release` com a tag da versão, a dist-tag do npm e o `preflight_run_id` salvo após verificar o `full_release_validation_run_id` salvo e a tentativa exata da execução.
7. Para versões estáveis, cria ou atualiza a versão do GitHub como rascunho, dispara `Windows Node Release` com o `windows_node_tag` explícito e os `windows_node_installer_digests` aprovados para o candidato e verifica os ativos canônicos de instalador/soma de verificação do Windows. Também dispara `Android Release` para compilar o APK assinado da tag exata, além da soma de verificação e da proveniência. Verifica ambos os contratos de ativos nativos antes de publicar o rascunho.

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

Use os fluxos de trabalho de nível inferior `Plugin NPM Release` e `Plugin ClawHub Release` somente para trabalhos específicos de reparo ou republicação. `OpenClaw Release Publish` rejeita `plugin_publish_scope=selected` quando `publish_openclaw_npm=true`, para que o pacote principal não seja lançado sem todos os plugins oficiais publicáveis, incluindo `@openclaw/diffs-language-pack`. Para reparar um Plugin selecionado, defina `publish_openclaw_npm=false` com `plugin_publish_scope=selected` e `plugins=@openclaw/name`, ou dispare diretamente o fluxo de trabalho filho.

A inicialização do ClawHub na primeira publicação é a exceção: dispare `Plugin ClawHub New`
a partir da `main` confiável e passe o SHA completo da versão de destino por meio de `ref`.
Nunca execute o próprio fluxo de trabalho de inicialização a partir da tag ou ramificação da versão:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

A validação anterior à tag exige `dry_run=true`, rejeita entradas de tag de versão e de execução
pai e aceita somente um destino exato alcançável a partir de `main` ou `release/*`.
Ela não carrega credenciais do ClawHub, publica bytes de pacotes nem altera a
configuração do publicador confiável. O fluxo de trabalho ainda resolve o plano real do registro,
faz checkout e empacota o destino apenas em uma tarefa sem segredos, materializa a
cadeia de ferramentas bloqueada do ClawHub e valida o artefato imutável e o
slug/identidade do pacote antes que a tag da versão exista. Aprove o ambiente
`clawhub-plugin-bootstrap` somente após a conclusão das tarefas de empacotamento sem segredos;
essa tarefa de validação protegida não tem credenciais nem comandos de mutação.

Uma simulação aprovada ou uma inicialização real após a criação da tag deve incluir a tag
exata da versão, além do ID, da tentativa e da ramificação da execução pai de `OpenClaw Release Publish`.
A execução pai atesta o SHA do próprio fluxo de trabalho e um SHA exato e separado da
`main` confiável para `Plugin ClawHub New`; a execução filha e cada aprovação de
ambiente protegido devem corresponder a esse SHA filho aprovado. A tag da versão é
verificada novamente antes de cada tentativa de publicação e mutação do publicador confiável.

A tarefa de empacotamento
envia um artefato imutável cujo nome, ID/digest do artefato do Actions,
execução/tentativa produtora, SHA de destino e SHA-256/tamanho do tarball de cada pacote são
propagados para as tarefas de validação e protegidas. A tarefa protegida faz checkout apenas
das ferramentas da `main` confiável, valida a tupla do artefato por meio da API do GitHub, baixa
pelo ID exato do artefato, calcula novamente o hash de cada tarball e valida os caminhos TAR locais e
a identidade do pacote com as regras de canonicalização USTAR da CLI fixada. Cada
candidato passa então pela simulação de publicação da CLI fixada, que retorna antes da
consulta ao registro ou da autenticação. O pré-filtro da tarefa de credenciais limita ClawPacks compactados
a 120 MiB, a carga total de arquivos a 50 MiB, os dados TAR expandidos a 64 MiB e
a contagem de entradas TAR a 10.000. O reparo do publicador confiável de pacotes existentes permanece
somente de configuração, mas ainda empacota o destino e exige a tag solicitada,
além da igualdade exata dos bytes e metadados do registro, antes de alterar a configuração do
publicador confiável. A verificação pós-publicação baixa o artefato do ClawHub e
exige o mesmo SHA-256 e tamanho. Uma recuperação por reexecução das tarefas com falha pode reutilizar o artefato
de pacote de uma tentativa anterior somente quando a tarefa produtora exata tiver sido concluída
com êxito. A evidência final também vincula a versão bloqueada do ClawHub, o SHA-256
do arquivo de bloqueio e a integridade do npm. Uma divergência exige uma nova versão do pacote.

## Entradas do fluxo de trabalho do NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de versão obrigatória, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` ou `v2026.4.2-alpha.1`; quando `preflight_only=true`, ela também pode ser o SHA completo atual de 40 caracteres do commit da ramificação do fluxo de trabalho para uma verificação preliminar somente de validação
- `preflight_only`: `true` somente para validação/compilação/pacote; `false` para o caminho real de publicação
- `preflight_run_id`: ID de uma execução preliminar existente e bem-sucedida, obrigatório no caminho real de publicação para que o fluxo de trabalho reutilize o tarball preparado em vez de recompilá-lo
- `full_release_validation_run_id`: ID de uma execução bem-sucedida de `Full Release Validation` para esta tag/SHA, obrigatório para publicação real. Publicações beta podem prosseguir somente com a verificação preliminar, com um aviso, mas a promoção estável/`latest` ainda o exige.
- `full_release_validation_run_attempt`: tentativa positiva exata da execução associada a `full_release_validation_run_id`; obrigatória sempre que o ID da execução for fornecido, para que reexecuções não possam alterar a evidência de autorização durante a publicação.
- `release_publish_run_id`: ID da execução aprovada de `OpenClaw Release Publish`; obrigatório quando este fluxo de trabalho é disparado por essa execução pai (chamadas de publicação real feitas por bot)
- `plugin_npm_run_id`: ID de uma execução bem-sucedida de `Plugin NPM Release` no estado exato do HEAD; obrigatório para uma publicação real do pacote principal em `extended-stable`
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; aceita `alpha`, `beta`, `latest` ou `extended-stable` e usa `beta` por padrão. O patch final `33` e posteriores devem usar `extended-stable`; por padrão, `extended-stable` rejeita patches anteriores e sempre rejeita tags que não sejam finais.
- `bypass_extended_stable_guard`: booleano somente para testes, padrão `false`; com `npm_dist_tag=extended-stable`, ignora a qualificação mensal de estabilidade estendida, preservando as verificações de identidade da versão, artefato, aprovação e releitura.

`Plugin NPM Release` aceita `npm_dist_tag=default` para o comportamento existente da versão
ou `npm_dist_tag=extended-stable` para o caminho mensal protegido. A
opção de estabilidade estendida exige `publish_scope=all-publishable`, uma entrada
`plugins` vazia, um patch final igual ou superior a `33` e a ramificação canônica
`extended-stable/YYYY.M.33` exatamente em sua ponta. Ela nunca move as tags
`latest` ou `beta` dos plugins. Novas versões de pacotes recebem `extended-stable` atomicamente
por meio de publicação confiável via OIDC (`npm publish --tag extended-stable`); este
fluxo de trabalho de origem não usa `npm dist-tag add` autenticado por token. As novas tentativas
ignoram versões exatas já presentes no npm e então falham de forma fechada, a menos que uma
releitura completa confirme que todos os pacotes exatos e a tag `extended-stable` convergiram.

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de versão obrigatória; já deve existir
- `preflight_run_id`: ID de uma execução preliminar bem-sucedida de `OpenClaw NPM Release`; obrigatório quando `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: ID de uma execução bem-sucedida de `Full Release Validation`; obrigatório quando `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: tentativa positiva exata associada a `full_release_validation_run_id`; obrigatória sempre que o ID da execução for fornecido
- `windows_node_tag`: tag exata de versão não preliminar de `openclaw/openclaw-windows-node`; obrigatória para publicação estável do OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto, aprovado para o candidato, dos nomes atuais dos instaladores do Windows para seus digests `sha256:` fixados; obrigatório para publicação estável do OpenClaw
- `npm_telegram_run_id`: ID opcional de uma execução bem-sucedida de `NPM Telegram Beta E2E` a ser incluído na evidência final da versão
- `npm_dist_tag`: tag de destino do npm para o pacote OpenClaw, uma entre `alpha`, `beta` ou `latest`
- `plugin_publish_scope`: usa `all-publishable` por padrão; use `selected` somente para trabalhos específicos de reparo exclusivo de plugins com `publish_openclaw_npm=false`
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgulas quando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: usa `true` por padrão; defina como `false` somente ao usar o fluxo de trabalho como orquestrador de reparo exclusivo de plugins
- `release_profile`: perfil de cobertura da versão usado para resumos de evidências da versão; usa `from-validation` por padrão, que o lê do manifesto de validação, ou substitua por `beta`, `stable` ou `full`
- `wait_for_clawhub`: usa `false` por padrão para que a disponibilidade no npm não seja bloqueada pelo processo auxiliar do ClawHub; defina como `true` somente quando a conclusão do fluxo de trabalho tiver de incluir a conclusão do ClawHub

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: ramificação, tag ou SHA completo do commit a validar. As verificações que contêm segredos exigem que o commit resolvido seja alcançável a partir de uma ramificação ou tag de versão do OpenClaw.
- `run_release_soak`: habilita testes de duração exaustivos ao vivo/E2E, do caminho de lançamento no Docker e de sobrevivência a todas as atualizações desde versões anteriores para verificações de versões beta. É ativado obrigatoriamente por `release_profile=stable` e `release_profile=full`.

Regras:

- Versões finais regulares e versões de correção abaixo do patch `33` podem ser publicadas em `beta` ou `latest`. Versões finais no patch `33` ou acima devem ser publicadas em `extended-stable`, e versões com sufixo de correção nesse limite são rejeitadas.
- Tags de pré-lançamento beta podem ser publicadas somente em `beta`; tags de pré-lançamento alfa podem ser publicadas somente em `alpha`
- Para `OpenClaw NPM Release`, a entrada do SHA completo do commit é permitida somente quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre somente para validação
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante a pré-verificação; o workflow verifica esses metadados antes de continuar a publicação

## Sequência regular de lançamento estável beta/latest

Esta sequência legada destina-se ao lançamento regular orquestrado que também abrange plugins, GitHub Release, Windows e o trabalho em outras plataformas. Ela não é o caminho mensal de estabilidade estendida `.33+`, exclusivo para npm, documentado no início desta página.

Ao preparar um lançamento estável regular orquestrado:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes que exista uma tag, você pode usar o SHA do commit atual e completo da ramificação do workflow para uma simulação da pré-verificação destinada somente à validação.
2. Escolha `npm_dist_tag=beta` para o fluxo normal que começa pelo beta ou `latest` somente quando quiser intencionalmente uma publicação estável direta.
3. Execute `Full Release Validation` na ramificação de lançamento, na tag de lançamento ou no SHA completo do commit quando quiser a CI normal, além de cobertura do cache de prompts em produção, Docker, QA Lab, Matrix e Telegram em um único workflow manual. Se você intencionalmente precisar apenas do grafo determinístico de testes normais, execute o workflow manual `CI` na referência do lançamento.
4. Selecione a tag exata de lançamento, que não seja de pré-lançamento, de `openclaw/openclaw-windows-node` cujos instaladores assinados para x64 e ARM64 deverão ser distribuídos. Salve-a como `windows_node_tag` e salve o mapa de resumos validado desses instaladores como `windows_node_installer_digests`. O auxiliar de candidato a lançamento registra ambos e os inclui no comando de publicação gerado.
5. Salve o `preflight_run_id`, o `full_release_validation_run_id` e o `full_release_validation_run_attempt` exato da execução bem-sucedida.
6. Execute `OpenClaw Release Publish` a partir de uma `main` confiável, com a mesma `tag`, o mesmo `npm_dist_tag`, o `windows_node_tag` selecionado, o `windows_node_installer_digests` salvo, o `preflight_run_id`, o `full_release_validation_run_id` e o `full_release_validation_run_attempt` salvos. Ele publica os plugins externalizados no npm e no ClawHub antes de promover o pacote npm do OpenClaw.
7. Se o lançamento tiver sido publicado em `beta`, use o workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promover essa versão estável de `beta` para `latest`.
8. Se o lançamento tiver sido publicado intencionalmente diretamente em `latest` e `beta` precisar adotar imediatamente a mesma compilação estável, use esse mesmo workflow de lançamento para apontar ambas as dist-tags para a versão estável ou deixe que a sincronização agendada de autorrecuperação mova `beta` posteriormente.

A alteração das dist-tags fica no repositório do registro de lançamentos porque ainda exige `NPM_TOKEN`, enquanto o repositório de código-fonte mantém a publicação exclusivamente por OIDC. Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção começando pelo beta documentados e visíveis aos operadores.

Se um mantenedor precisar recorrer à autenticação local do npm, execute quaisquer comandos da CLI do 1Password (`op`) somente em uma sessão tmux dedicada. Não chame `op` diretamente pelo shell principal do agente; mantê-lo dentro do tmux torna observável o tratamento de prompts, alertas e OTPs e evita alertas repetidos no host.

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
