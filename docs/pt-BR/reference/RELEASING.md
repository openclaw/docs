---
read_when:
    - Procurando definições públicas de canais de lançamento
    - Executando a validação de versão ou a aceitação de pacote
    - Em busca da nomenclatura e da cadência das versões
summary: Faixas de lançamento, lista de verificação do operador, ambientes de validação, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-07-16T12:53:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c88c7c61be963ed832b1716e811e09d5f270cb296bb08625e6fd53d5359e45b8
    source_path: reference/RELEASING.md
    workflow: 16
---

O OpenClaw atualmente oferece três canais de atualização voltados ao usuário:

- stable: o canal de versões promovidas existente, que ainda é resolvido por meio do npm `latest` até que o marco separado de CLI/canal seja concluído
- beta: tags de pré-lançamento publicadas no npm `beta`
- dev: a ponta móvel de `main`

Separadamente, os operadores de lançamento podem publicar o pacote principal do
último mês concluído no npm `extended-stable`, começando no patch `33`. A linha
final regular do mês atual continua no npm `latest`; essa divisão de publicação
no lado do operador não altera, por si só, a resolução dos canais de atualização da CLI.

As compilações alfa do Tideclaw são uma trilha interna de pré-lançamento separada (dist-tag do npm `alpha`), abordada em [Entradas do fluxo de trabalho do NPM](#npm-workflow-inputs) e [Caixas de teste de lançamento](#release-test-boxes).

## Nomenclatura de versões

- Versão mensal de lançamento estendido estável do npm: `YYYY.M.PATCH`, com `PATCH >= 33`, tag git `vYYYY.M.PATCH`
- Versão de lançamento final diária/regular: `YYYY.M.PATCH`, com `PATCH < 33`, tag git `vYYYY.M.PATCH`
- Versão regular de lançamento de correção de contingência: `YYYY.M.PATCH-N`, tag git `vYYYY.M.PATCH-N`
- Versão beta de pré-lançamento: `YYYY.M.PATCH-beta.N`, tag git `vYYYY.M.PATCH-beta.N`
- Versão alfa de pré-lançamento: `YYYY.M.PATCH-alpha.N`, tag git `vYYYY.M.PATCH-alpha.N`
- Nunca preencha o mês ou o patch com zeros à esquerda
- `PATCH` é um número sequencial do ciclo mensal de lançamentos, não um dia do calendário. Os lançamentos finais regulares e beta avançam o ciclo atual; tags exclusivamente alfa nunca consomem nem avançam o número de patch beta/regular, portanto ignore tags legadas exclusivamente alfa com números de patch maiores ao selecionar um ciclo beta ou regular.
- As compilações alfa/noturnas usam o próximo ciclo de patch ainda não lançado e incrementam somente `alpha.N` em compilações repetidas. Assim que esse patch tiver uma versão beta, as novas compilações alfa passam para o patch seguinte.
- As versões do npm são imutáveis: nunca exclua, publique novamente ou reutilize uma tag publicada. Crie o próximo número de pré-lançamento ou o próximo patch mensal.
- `latest` continua acompanhando a linha npm regular/diária atual; `beta` é o destino atual de instalação beta
- `extended-stable` significa o pacote npm compatível do mês anterior, começando no patch `33`; o patch `34` e os posteriores são lançamentos de manutenção nessa linha mensal
- Os lançamentos finais regulares e as correções regulares são publicados no npm `beta` por padrão; os operadores de lançamento podem direcionar explicitamente para `latest` ou promover posteriormente uma compilação beta aprovada
- O caminho mensal dedicado de estabilidade estendida publica o pacote principal do npm e todos os plugins oficiais publicáveis no npm exatamente na mesma versão. Ele não publica plugins no ClawHub nem publica artefatos do macOS ou Windows, uma versão no GitHub, dist-tags de repositórios privados, imagens Docker, artefatos móveis ou downloads do site.
- Cada lançamento final regular disponibiliza em conjunto o pacote npm, o aplicativo para macOS, o APK autônomo assinado para Android e os instaladores assinados do Hub para Windows. Os lançamentos beta normalmente validam e publicam primeiro o caminho de npm/pacote, enquanto a compilação, assinatura, notarização e promoção dos aplicativos nativos ficam reservadas para o lançamento final regular, salvo solicitação explícita.

## Cadência de lançamentos

- Os lançamentos avançam primeiro pela versão beta; a versão estável só vem depois que a versão beta mais recente é validada
- Os mantenedores normalmente criam lançamentos a partir de uma ramificação `release/YYYY.M.PATCH` criada com base na versão `main` atual, para que a validação e as correções do lançamento não bloqueiem novos desenvolvimentos em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de uma correção, os mantenedores criam a próxima tag `-beta.N` em vez de excluir ou recriar a antiga
- O procedimento detalhado de lançamento, as aprovações, as credenciais e as notas de recuperação são restritos aos mantenedores

## Publicação mensal estendida estável somente no npm

Esta é uma exceção dedicada ao procedimento regular de lançamento descrito abaixo. Para um
mês concluído `YYYY.M`, crie `extended-stable/YYYY.M.33`; publique
`vYYYY.M.33` e patches de manutenção posteriores a partir dessa mesma ramificação. A
tag de lançamento, a ponta da ramificação, o checkout, a versão do pacote, a pré-verificação do npm e a execução da
Validação Completa do Lançamento devem identificar o mesmo commit. A ramificação `main` protegida já deve
conter a versão final de um mês calendário estritamente posterior abaixo do patch
`33`; os patches de manutenção continuam qualificados depois que `main` avançar mais de um
mês.

Na ramificação exata de estabilidade estendida, atualize o pacote raiz para `YYYY.M.P`, execute
`pnpm release:prep` e verifique se todos os pacotes de extensão publicáveis têm a
mesma versão. Faça commit e envie todas as alterações geradas, crie e envie a
tag imutável `vYYYY.M.P` nesse commit e registre o SHA completo resultante.
Os fluxos de trabalho consomem essa árvore preparada; eles não atualizam nem sincronizam
as versões para você.

Execute a pré-verificação do npm e a Validação Completa do Lançamento exatamente a partir da
ponta dessa ramificação preparada; depois, salve os IDs de ambas as execuções e a tentativa bem-sucedida da execução da
Validação Completa do Lançamento:

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

`release_profile=stable` é o perfil existente de profundidade da validação; ele é
separado da dist-tag `extended-stable` do npm e permanece intencionalmente
inalterado.

Depois que ambas as execuções forem bem-sucedidas, publique todos os plugins oficiais publicáveis no npm a partir da
mesma ponta exata da ramificação. O patch `P` deve ser `33` ou maior. Passe o SHA completo do lançamento
como `ref`, aguarde a matriz completa e a releitura do registro; depois, salve o
ID da execução bem-sucedida do Lançamento de Plugins no NPM:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
gh workflow run plugin-npm-release.yml \
  --ref extended-stable/YYYY.M.33 \
  -f publish_scope=all-publishable \
  -f ref="$RELEASE_SHA" \
  -f npm_dist_tag=extended-stable
```

O fluxo de trabalho usa o inventário regular preparado de pacotes `all-publishable`,
incluindo pacotes cujo código-fonte não foi alterado. Ele verifica cada pacote exato
e cada tag de plugin `extended-stable` antes de concluir com êxito. Se uma execução parcial
falhar, execute novamente o mesmo comando: os pacotes já publicados serão reutilizados, as tags de
plugin ausentes ou desatualizadas serão reconciliadas no ambiente de lançamento do npm e a
releitura final ainda abrangerá o conjunto completo de pacotes.

Depois que o fluxo de trabalho de plugins for bem-sucedido e o ambiente de lançamento do npm estiver pronto,
publique o tarball exato da pré-verificação principal. A publicação principal verifica se a
execução de plugins referenciada tem o estado `completed/success` na mesma ramificação canônica e
no SHA exato do código-fonte:

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

Para uma bifurcação ou um ensaio fora de produção que intencionalmente não possa atender à
política mensal de `.33` ou de mês da ramificação `main` protegida, adicione
`-f bypass_extended_stable_guard=true` aos despachos de pré-verificação e de publicação
do npm. O padrão é `false`. A exceção só é aceita com
`npm_dist_tag=extended-stable` e é registrada no resumo do fluxo de trabalho. Ela
não ignora a referência canônica do fluxo de trabalho `extended-stable/YYYY.M.33`,
a igualdade entre ponta da ramificação/tag/checkout, a sintaxe da tag final, a igualdade entre
versão do pacote e da tag, a identidade da execução e do manifesto referenciados, a proveniência do tarball,
a aprovação do ambiente, a releitura do registro ou as evidências de reparo do seletor.

O fluxo de trabalho de publicação verifica as identidades das execuções referenciadas de pré-verificação, validação e plugins,
o resumo criptográfico do tarball preparado e os seletores do registro principal.
Confirme o resultado de forma independente depois que o fluxo de trabalho for bem-sucedido:

```bash
npm view openclaw@YYYY.M.P version --userconfig "$(mktemp)"
npm view openclaw@extended-stable version --userconfig "$(mktemp)"
```

Ambos os comandos devem retornar `YYYY.M.P`. Se a publicação for bem-sucedida, mas a
releitura do seletor falhar, não publique novamente a versão imutável do pacote. Use o
único comando de reparo `npm dist-tag add openclaw@YYYY.M.P extended-stable`
impresso no resumo de execução obrigatória do fluxo de trabalho com falha e repita ambas as
releituras independentes. A reversão para o seletor anterior é uma decisão separada do
operador, não o caminho de reparo da releitura.

A documentação pública de suporte inicialmente designa Slack, Discord e Codex como
superfícies de plugins abrangidas pela estabilidade estendida. Essa lista é uma declaração de suporte, não
uma lista de permissões do código de lançamento: todos os plugins oficiais publicáveis no npm seguem o
mesmo caminho de publicação com a versão exata.

A lista de verificação regular abaixo continua abrangendo beta, `latest`, Lançamento no GitHub,
plugins, macOS, Windows e publicações para outras plataformas. Não execute essas
etapas para este caminho de estabilidade estendida somente no npm.

## Lista de verificação do operador de lançamento regular

Esta lista de verificação representa publicamente o fluxo de lançamento. Credenciais privadas, assinatura, notarização, recuperação de dist-tags e detalhes de reversão de emergência permanecem no manual de lançamento restrito aos mantenedores.

1. Comece pela versão `main` atual: obtenha as alterações mais recentes, confirme que o commit de destino foi enviado e confirme que a CI de `main` está suficientemente verde para criar a ramificação.
2. Crie `release/YYYY.M.PATCH` a partir desse commit. Os backports são opcionais; aplique somente o conjunto selecionado pelo operador. Atualize todos os locais de versão necessários, execute `pnpm release:prep`, conclua as correções de lançamento e os encaminhamentos necessários e revise `src/plugins/compat/registry.ts` e `src/commands/doctor/shared/deprecation-compat.ts`.
3. Congele o commit pré-changelog com o produto completo como o **SHA do código**. Execute a pré-verificação determinística do código-fonte e depois use `node scripts/full-release-validation-at-sha.mjs --sha <code-sha> --target-ref release/YYYY.M.PATCH`. Isso fixa as ferramentas confiáveis do fluxo de trabalho enquanto a matriz completa de Vitest, Docker, QA, pacotes e desempenho tem como alvo o SHA exato do código.
4. Classifique as falhas antes de editar. Uma falha de produto/código cria um novo SHA do código e exige uma validação completa bem-sucedida desse SHA. Uma falha de fluxo de trabalho, infraestrutura de testes, credencial, aprovação ou infraestrutura é corrigida na superfície responsável e executada novamente com o mesmo SHA do código.
5. Somente depois que o SHA do código estiver verde, gere a seção superior de `CHANGELOG.md` a partir dos PRs mesclados e dos commits diretos desde a última tag de versão disponibilizada acessível. Mantenha as entradas voltadas ao usuário e sem duplicações. Quando uma tag disponibilizada divergente ou um encaminhamento posterior voltar a associar PRs já lançados, passe-a explicitamente como `--shipped-ref`.
6. Faça commit somente de `CHANGELOG.md`. Esse commit é o **SHA do lançamento**. O diff completo entre o SHA do código e o SHA do lançamento deve ser exatamente `CHANGELOG.md`; qualquer outro caminho alterado faz o lançamento retornar à etapa 2.
7. Execute a Validação Completa do Lançamento fixada por SHA para o SHA do lançamento, com a reutilização de evidências ativada. O processo pai leve deve registrar `changelog-only-release-v1`, apontar para o SHA do código verde e não despachar nenhuma etapa filha do produto. Isso reutiliza as evidências do produto; não reutiliza os bytes do pacote.
8. Execute `OpenClaw NPM Release` com `preflight_only=true` no SHA/tag do lançamento. Salve o `preflight_run_id` bem-sucedido. Isso compila e verifica os bytes exatos do pacote que incluem o changelog final.
9. Aplique uma tag ao SHA do lançamento e execute o auxiliar de candidato com o processo pai de validação bem-sucedido do SHA do lançamento e a pré-verificação do npm, em vez de despachar qualquer um deles novamente:

   ```bash
   pnpm release:candidate -- \
     --tag vYYYY.M.PATCH-beta.N \
     --full-release-run <release-sha-validation-run-id> \
     --npm-preflight-run <preflight-run-id> \
     --skip-dispatch
   ```

   Para a versão estável, passe também `--windows-node-tag vX.Y.Z`. O auxiliar verifica a proveniência das notas de lançamento, os bytes da pré-verificação do npm, a comprovação de instalação/atualização no Parallels, a comprovação do pacote do Telegram e os planos de publicação dos plugins; em seguida, exibe o comando de publicação.

   `OpenClaw Release Publish` despacha os pacotes de plugins selecionados ou todos os publicáveis para o npm e o mesmo conjunto para o ClawHub em paralelo; em seguida, promove o artefato preparado da pré-verificação do npm do OpenClaw com a dist-tag correspondente assim que a publicação dos plugins no npm é bem-sucedida. O checkout da versão permanece como a raiz do produto/dos dados, enquanto o planejamento e a verificação final são executados a partir do checkout exato e confiável da fonte do workflow, para que um commit de versão mais antigo não possa usar silenciosamente ferramentas de lançamento obsoletas. Antes que qualquer processo filho de publicação seja iniciado, ele renderiza e armazena em cache o corpo exato da versão do GitHub. Quando a seção `CHANGELOG.md` correspondente completa cabe no limite de 125.000 caracteres do GitHub e no teto de segurança correspondente de 125.000 bytes do renderizador, a página contém exatamente essa seção `## YYYY.M.PATCH`, incluindo seu cabeçalho. Quando a seção de origem não cabe, a página mantém exatamente as notas editoriais agrupadas e substitui o registro de contribuições grande demais por um link estável para o registro completo no `CHANGELOG.md` fixado à tag; registros parciais e itens de lista truncados nunca são publicados. O workflow escolhe esse corpo completo ou compacto antes de adicionar `### Release verification`; se a parte final da comprovação exceder o limite, ele mantém o corpo canônico e usa as evidências imutáveis anexadas. As versões estáveis publicadas no npm `latest` tornam-se a versão mais recente do GitHub, enquanto as versões estáveis de manutenção mantidas no npm `beta` são criadas com o `latest=false` do GitHub. O workflow também envia as evidências de dependências da pré-verificação, o manifesto da validação completa e as evidências da verificação do registro após a publicação para a versão do GitHub, para resposta a incidentes pós-lançamento. Ele exibe imediatamente os IDs das execuções filhas, aprova automaticamente as barreiras do ambiente de lançamento que o token do workflow tem permissão para aprovar, resume os jobs filhos com falha incluindo os finais dos logs, cria antecipadamente a página de rascunho da versão do GitHub e promove os ativos do Windows e do Android simultaneamente à publicação do OpenClaw no npm, conclui a página da versão e as evidências de dependências assim que essas etapas são bem-sucedidas, aguarda o ClawHub sempre que o OpenClaw estiver sendo publicado no npm e, em seguida, executa o verificador beta da main confiável e envia evidências pós-publicação da versão do GitHub, do pacote npm, dos pacotes de plugins selecionados no npm, dos pacotes selecionados no ClawHub, dos IDs das execuções filhas e do ID opcional da execução NPM do Telegram. O verificador de inicialização do ClawHub exige o caminho e o SHA exatos do workflow da main confiável, as tentativas de execução do produtor e da execução terminal, o SHA da versão, o conjunto de pacotes solicitado, a tupla imutável do artefato de pacote e o artefato de leitura de confirmação do registro terminal; uma execução legada bem-sucedida na referência da versão não é aceita.

   Em seguida, execute a aceitação pós-publicação do pacote para o pacote `openclaw@YYYY.M.PATCH-beta.N` ou `openclaw@beta` publicado. Se uma pré-versão enviada ou publicada precisar de correção, crie o próximo número de pré-versão correspondente; nunca exclua nem reescreva o anterior.

10. Em uma tentativa de publicação com falha, mantenha o SHA da versão inalterado, a menos que a falha comprove um defeito no produto ou no changelog. Retome os processos filhos e artefatos imutáveis bem-sucedidos; nunca recompile nem republique uma versão de pacote que já tenha sido bem-sucedida.
11. Para a versão estável, prossiga somente depois que a versão beta ou candidata a lançamento aprovada tiver as evidências de validação necessárias. A publicação estável no npm também passa por `OpenClaw Release Publish`, reutilizando o artefato de pré-verificação bem-sucedido por meio de `preflight_run_id`. A prontidão da versão estável para macOS também exige os `.zip`, `.dmg`, `.dSYM.zip` empacotados e o `appcast.xml` atualizado em `main`; o workflow de publicação do macOS publica automaticamente o appcast assinado no `main` público após a verificação dos ativos da versão ou abre/atualiza um PR do appcast se a proteção da branch bloquear o push direto. A prontidão estável do Windows Hub exige os ativos `OpenClawCompanion-Setup-x64.exe`, `OpenClawCompanion-Setup-arm64.exe` e `OpenClawCompanion-SHA256SUMS.txt` assinados na versão do GitHub do OpenClaw. Passe a tag exata da versão assinada `openclaw/openclaw-windows-node` como `windows_node_tag` e seu mapa de resumos dos instaladores aprovado para a candidata como `windows_node_installer_digests`; `OpenClaw Release Publish` mantém o rascunho da versão, despacha `Windows Node Release` e verifica os três ativos antes da publicação.
12. Após a publicação, execute o verificador pós-publicação do npm, o E2E opcional independente do Telegram para o npm publicado quando precisar de comprovação pós-publicação do canal, a promoção da dist-tag quando necessário, verifique a página gerada da versão do GitHub, execute as etapas de anúncio da versão e conclua o [encerramento da main estável](#stable-main-closeout) antes de considerar uma versão estável concluída.

## Encerramento da main estável

A publicação estável não está concluída até que `main` contenha o estado real da versão disponibilizada.

1. Comece a partir da versão mais recente de `main`. Audite `release/YYYY.M.PATCH` em relação a ela e faça o forward-port das correções reais ausentes em `main`. Não mescle indiscriminadamente adaptadores de compatibilidade, teste ou validação exclusivos da versão na versão mais recente de `main`.
2. Para o caminho normal, defina `main` como a versão estável disponibilizada. Um encerramento tardio pode usar `main` depois que ela avançar para uma versão estável posterior do CalVer do OpenClaw; não faça downgrade de um ciclo de lançamento já iniciado apenas para encerrar a versão anterior. O validador ainda exige a seção exata do changelog disponibilizado e a entrada do appcast, e registra a versão e o SHA reais de `main`. Execute `pnpm release:prep` após qualquer alteração na versão raiz e, em seguida, `pnpm deps:shrinkwrap:generate`.
3. Faça a seção `## YYYY.M.PATCH` de `CHANGELOG.md` em `main` corresponder exatamente à branch da versão etiquetada. Inclua a atualização estável de `appcast.xml` quando a versão para Mac tiver publicado uma.
4. Não adicione `YYYY.M.PATCH+1`, uma versão beta ou uma seção futura vazia do changelog a `main` até que o operador inicie explicitamente esse ciclo de lançamento.
5. Execute `pnpm release:generated:check`, `pnpm deps:shrinkwrap:check` e `OPENCLAW_TESTBOX=1 pnpm check:changed`. Faça o push e, em seguida, verifique se `origin/main` contém a versão e o changelog disponibilizados antes de considerar a versão estável concluída.
6. Mantenha as variáveis de repositório `RELEASE_ROLLBACK_DRILL_ID` e `RELEASE_ROLLBACK_DRILL_DATE` atualizadas após cada simulação privada de reversão.

`OpenClaw Stable Main Closeout` começa a partir do push de `main` que contém a versão, o changelog e o appcast disponibilizados após a publicação estável. Ele lê as evidências pós-publicação imutáveis para vincular a tag disponibilizada às respectivas execuções de Validação Completa da Versão e Publicação e, em seguida, verifica o estado estável da main, a versão, o período de observação estável obrigatório e as evidências de desempenho bloqueantes. Ele anexa um manifesto de encerramento imutável e sua soma de verificação à versão do GitHub. O gatilho automático de push ignora versões legadas anteriores às evidências pós-publicação imutáveis e nunca considera essa omissão um encerramento concluído.

Um encerramento completo exige ambos os ativos e uma soma de verificação correspondente. Um manifesto parcial reproduz o SHA registrado de `main` e a simulação de reversão para gerar bytes idênticos e, em seguida, anexa a soma de verificação ausente; um par inválido, ou uma soma de verificação sem manifesto, permanece bloqueante. Uma execução disparada por push sem as variáveis de repositório da simulação de reversão é ignorada sem concluir o encerramento; um registro de simulação ausente ou com mais de 90 dias ainda bloqueia o encerramento manual respaldado por evidências. Os comandos privados de recuperação permanecem no runbook exclusivo dos mantenedores. Use o despacho manual somente para reparar ou repetir um encerramento estável respaldado por evidências.

Se o processo pai da Publicação da Versão tiver falhado somente depois que as evidências imutáveis do npm/plugin foram anexadas, repare e publique primeiro todos os ativos estáveis das plataformas. Em seguida, um mantenedor poderá despachar manualmente o encerramento com `allow_failed_publish_recovery=true`; esse modo aceita somente um processo pai concluído com falha e exige adicionalmente os contratos exatos dos ativos do Android e Windows, os resumos SHA-256 do GitHub, a verificação das somas de verificação, a proveniência do Android e uma promoção do Windows despachada pelo processo pai e bem-sucedida, cujas verificações do Authenticode e resumos aprovados para a candidata correspondam aos instaladores publicados, além das verificações normais de macOS/appcast. O encerramento automático por push nunca habilita esse modo de recuperação.

Uma tag legada de correção alternativa poderá reutilizar as evidências do pacote-base somente quando a tag de correção resolver para o mesmo commit de origem que a tag estável base. Sua versão do Android reutiliza o APK verificado da tag base e adiciona a proveniência da tag de correção. Uma correção com origem diferente deve publicar e verificar suas próprias evidências de pacote e usar um `versionCode` do Android maior.

## Pré-verificação da versão

- Execute `pnpm check:test-types` antes da pré-verificação da versão para que o TypeScript de teste continue coberto fora da barreira local mais rápida de `pnpm check`.
- Execute `pnpm check:architecture` antes da pré-verificação da versão para que as verificações mais abrangentes de ciclos de importação e limites arquiteturais estejam aprovadas fora da barreira local mais rápida.
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos de versão esperados de `dist/*` e o pacote da Interface de Controle existam para a etapa de validação do pacote.
- Execute `pnpm release:prep` após a atualização da versão raiz e antes de criar a tag. Ele executa todos os geradores determinísticos de versão que normalmente apresentam divergências após uma alteração de versão/configuração/API: versões de plugins, shrinkwraps do npm, inventário de plugins, esquema de configuração base, metadados de configuração dos canais incluídos, referência dos documentos de configuração, exportações do SDK de plugins e referência da API do SDK de plugins. `pnpm release:check` executa novamente essas barreiras no modo de verificação (além de uma verificação do orçamento de superfície do SDK de plugins) e relata todas as falhas de divergência gerada em uma única passagem antes de executar as verificações de lançamento dos pacotes.
- Por padrão, a sincronização de versões dos plugins atualiza o pacote de runtime publicável `@openclaw/ai`, as versões dos pacotes de plugins oficiais e os limites mínimos existentes de `openclaw.compat.pluginApi` para a versão do OpenClaw. Trate esse campo como o limite mínimo da API do SDK/runtime de plugins, não apenas como uma cópia da versão do pacote: para versões exclusivas de plugins que permaneçam intencionalmente compatíveis com hosts OpenClaw mais antigos, mantenha o limite mínimo na API do host compatível mais antigo e documente essa escolha na comprovação da versão do plugin.
- Execute o workflow manual `Full Release Validation` antes da aprovação da versão para iniciar todas as caixas de teste de pré-lançamento a partir de um único ponto de entrada. Ele aceita uma branch, tag ou SHA completo do commit, despacha manualmente `CI` e despacha `OpenClaw Release Checks` para as etapas de teste rápido de instalação, aceitação de pacotes, verificações de pacotes entre sistemas operacionais, paridade do Laboratório de QA, Matrix e Telegram. Execuções estáveis e completas sempre incluem testes exaustivos ao vivo/E2E e um período de observação do caminho de lançamento no Docker; `run_release_soak=true` é mantido para um período de observação beta explícito. A Aceitação de Pacotes fornece o E2E canônico do Telegram para pacotes durante a validação da candidata, evitando um segundo processo simultâneo de consulta ao vivo.

  Forneça `release_package_spec` após publicar uma versão beta para reutilizar o pacote npm disponibilizado nas verificações da versão, na Aceitação de Pacotes e no E2E do Telegram para pacotes sem recompilar o tarball da versão. Forneça `npm_telegram_package_spec` somente quando o Telegram precisar usar um pacote publicado diferente do restante da validação da versão. Forneça `package_acceptance_package_spec` quando a Aceitação de Pacotes precisar usar um pacote publicado diferente da especificação do pacote da versão. Forneça `evidence_package_spec` quando o relatório de evidências da versão precisar comprovar que a validação corresponde a um pacote npm publicado sem obrigar a execução do E2E do Telegram.

  ```bash
  node scripts/full-release-validation-at-sha.mjs \
    --sha <code-sha> \
    --target-ref release/YYYY.M.PATCH
  ```

- Execute o fluxo de trabalho manual `Package Acceptance` quando quiser uma comprovação por canal paralelo para um pacote candidato enquanto o trabalho de lançamento continua. Use `source=npm` para `openclaw@beta`, `openclaw@latest` ou uma versão exata do lançamento; `source=ref` para empacotar um branch/tag/SHA confiável de `package_ref` com o harness `workflow_ref` atual; `source=url` para um tarball HTTPS público com um SHA-256 obrigatório e uma política rigorosa de URL pública; `source=trusted-url` para uma política de origem confiável nomeada que use `trusted_source_id` obrigatório e SHA-256; ou `source=artifact` para um tarball enviado por outra execução do GitHub Actions.

  O fluxo de trabalho resolve o candidato como `package-under-test`, reutiliza o agendador de lançamento E2E do Docker com esse tarball e pode executar o QA do Telegram com o mesmo tarball usando `telegram_mode=mock-openai` ou `telegram_mode=live-frontier`. Quando as rotas do Docker selecionadas incluem `published-upgrade-survivor`, o artefato do pacote é o candidato e `published_upgrade_survivor_baseline` seleciona a linha de base publicada. `update-restart-auth` usa o pacote candidato tanto como a CLI instalada quanto como o pacote em teste, para exercitar o caminho de reinicialização gerenciada do comando de atualização do candidato.

  Exemplo:

  ```bash
  gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product -f published_upgrade_survivor_baseline=openclaw@2026.4.26 -f telegram_mode=mock-openai
  ```

  Perfis comuns:
  - `smoke`: rotas de instalação/canal/agente, rede do Gateway e recarregamento da configuração
  - `package`: rotas nativas do artefato para pacote/atualização/reinicialização/plugin, sem OpenWebUI nem ClawHub ativo
  - `product`: perfil de pacote mais canais MCP, limpeza de cron/subagente, pesquisa na web da OpenAI e OpenWebUI
  - `full`: partes do caminho de lançamento do Docker com OpenWebUI
  - `custom`: seleção exata de `docker_lanes` para uma nova execução focada

- Execute diretamente o fluxo de trabalho manual `CI` quando precisar apenas de cobertura determinística da CI normal para o candidato a lançamento. Os acionamentos manuais da CI ignoram o escopo de alterações e forçam os shards do Linux Node, os shards de plugins incluídos, os shards de contrato de plugins e canais, a compatibilidade com Node 22, `check-*`, `check-additional-*`, as verificações rápidas de artefatos compilados, as verificações da documentação, as Skills em Python, Windows, macOS e as rotas de i18n da Control UI. Execuções manuais independentes da CI só executam o Android quando acionadas com `include_android=true`; `Full Release Validation` repassa essa entrada para sua CI filha.

  ```bash
  gh workflow run ci.yml --ref release/YYYY.M.PATCH -f include_android=true
  ```

- Execute `pnpm qa:otel:smoke` ao validar a telemetria do lançamento. Ele exercita o laboratório de QA por meio de um receptor OTLP/HTTP local e verifica a exportação de rastros, métricas e logs, além de atributos de rastros limitados e a redação de conteúdo/identificadores, sem exigir Opik, Langfuse ou outro coletor externo.
- Execute `pnpm qa:otel:collector-smoke` ao validar a compatibilidade do coletor. Ele encaminha a mesma exportação OTLP do laboratório de QA por meio de um contêiner Docker real do OpenTelemetry Collector antes das asserções do receptor local.
- Execute `pnpm qa:prometheus:smoke` ao validar a coleta protegida do Prometheus. Ele exercita o laboratório de QA, rejeita coletas não autenticadas e verifica se as famílias de métricas críticas para o lançamento permanecem livres de conteúdo de prompts, identificadores brutos, tokens de autenticação e caminhos locais.
- Execute `pnpm qa:observability:smoke` para executar consecutivamente as rotas de verificação rápida do OpenTelemetry e do Prometheus no checkout do código-fonte.
- Execute `pnpm release:check` antes de cada lançamento com tag.
- A verificação preliminar de `OpenClaw NPM Release` gera evidências de lançamento das dependências antes de empacotar o tarball npm. O gate de vulnerabilidades dos avisos do npm bloqueia o lançamento. Os relatórios de risco do manifesto transitivo, superfície de propriedade/instalação das dependências e alterações nas dependências servem apenas como evidências do lançamento. O relatório de alterações nas dependências compara o candidato a lançamento com a tag de lançamento alcançável anterior. A verificação preliminar envia as evidências das dependências como `openclaw-release-dependency-evidence-<tag>` e também as incorpora em `dependency-evidence/` dentro do artefato preparado da verificação preliminar do npm. O caminho de publicação real reutiliza esse artefato da verificação preliminar e, em seguida, anexa as mesmas evidências ao lançamento do GitHub como `openclaw-<version>-dependency-evidence.zip`.
- Execute `OpenClaw Release Publish` para a sequência de publicação que realiza alterações após a criação da tag. Acione publicações beta e estáveis regulares a partir de `main` confiável; a tag de lançamento ainda seleciona o commit de destino exato e pode apontar para `release/YYYY.M.PATCH`. As publicações alfa do Tideclaw permanecem no branch alfa correspondente. Informe o `preflight_run_id` npm bem-sucedido do OpenClaw, o `full_release_validation_run_id` bem-sucedido e o `full_release_validation_run_attempt` exato, e mantenha o escopo padrão de publicação de plugins `all-publishable`, a menos que esteja executando deliberadamente um reparo focado. O fluxo de trabalho serializa a publicação npm dos plugins, a publicação dos plugins no ClawHub e a publicação npm do OpenClaw para que o pacote principal não seja publicado antes de seus plugins externalizados; a promoção para Windows e Android é executada simultaneamente com a publicação npm principal na página de rascunho do lançamento. As novas execuções da publicação podem ser retomadas: uma versão principal já publicada no npm ignora o acionamento principal depois que o fluxo de trabalho comprova que o tarball do registro corresponde ao artefato da verificação preliminar da tag, e a promoção para Windows/Android é ignorada quando o lançamento já contém o contrato de artefatos verificado, portanto uma nova tentativa refaz apenas as etapas que falharam. Reparos focados somente em plugins exigem `plugin_publish_scope=selected` e uma lista de plugins não vazia. Execuções `all-publishable` somente de plugins exigem evidências completas e imutáveis da verificação preliminar e da Validação Completa do Lançamento; evidências parciais são rejeitadas.
- O `OpenClaw Release Publish` estável exige um `windows_node_tag` exato depois que o lançamento `openclaw/openclaw-windows-node` correspondente, que não seja uma versão preliminar, existir, além do mapa `windows_node_installer_digests` aprovado para o candidato. Antes de acionar qualquer fluxo de publicação filho, ele verifica se esse lançamento de origem está publicado, não é uma versão preliminar, contém os instaladores x64/ARM64 obrigatórios e ainda corresponde ao mapa aprovado. Em seguida, aciona `Windows Node Release` enquanto o lançamento do OpenClaw ainda é um rascunho, transportando sem alterações o mapa fixado de resumos criptográficos dos instaladores. O fluxo de trabalho filho baixa os instaladores assinados do Windows Hub dessa tag exata, compara-os com os resumos criptográficos fixados, verifica em um executor Windows se as assinaturas Authenticode usam o signatário esperado da OpenClaw Foundation, grava um manifesto SHA-256 e envia os instaladores e o manifesto para o lançamento canônico do OpenClaw no GitHub; depois, baixa novamente os artefatos promovidos e verifica a presença no manifesto e os hashes. O fluxo de trabalho pai verifica o contrato atual dos artefatos x64, ARM64 e de soma de verificação antes da publicação. A recuperação direta rejeita nomes inesperados de artefatos `OpenClawCompanion-*` antes de substituir os artefatos esperados do contrato pelos bytes fixados da origem.

  Acione manualmente `Windows Node Release` apenas para recuperação e sempre informe uma tag exata, nunca `latest`, além do mapa JSON explícito `expected_installer_digests` do lançamento de origem aprovado. Os links de download do site devem apontar para URLs exatas dos artefatos do lançamento atual estável do OpenClaw ou para `releases/latest/download/...` somente após verificar que o redirecionamento para a versão mais recente do GitHub aponta para esse mesmo lançamento; não crie um link apenas para a página de lançamento do repositório complementar.

- As verificações de release agora são executadas em um workflow manual separado: `OpenClaw Release Checks`. Ele também executa a faixa de paridade simulada do QA Lab, além do perfil de release do Matrix e da faixa de QA do Telegram, antes da aprovação do release. As faixas ao vivo usam o ambiente `qa-live-shared`; o Telegram também usa concessões de credenciais de CI do Convex. Execute o workflow manual `QA-Lab - All Lanes` com `matrix_profile=all` quando quiser todos os cenários mantidos do Matrix; o workflow distribui essa seleção entre os perfis de transporte, mídia e E2EE para manter a comprovação completa dentro dos tempos limite de cada job.
- A validação de runtime de instalação e atualização entre sistemas operacionais faz parte dos workflows públicos `OpenClaw Release Checks` e `Full Release Validation`, que chamam diretamente o workflow reutilizável `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`. Essa separação é intencional: mantém o caminho real de release no npm curto, determinístico e concentrado em artefatos, enquanto as verificações ao vivo mais lentas permanecem em sua própria faixa para não atrasar nem bloquear a publicação.
- As verificações de release que envolvem segredos devem ser disparadas por meio de `Full Release Validation` ou a partir da referência do workflow `main`/release, para que a lógica do workflow e os segredos permaneçam controlados.
- `OpenClaw Release Checks` aceita uma branch, tag ou SHA completo de commit, desde que o commit resolvido seja alcançável a partir de uma branch ou tag de release do OpenClaw.
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA completo de 40 caracteres do commit atual da branch do workflow sem exigir uma tag enviada. Esse caminho por SHA destina-se somente à validação e não pode ser promovido a uma publicação real. No modo SHA, o workflow sintetiza `v<package.json version>` somente para a verificação dos metadados do pacote; a publicação real ainda exige uma tag de release real.
- Ambos os workflows mantêm o caminho de publicação e promoção real nos runners hospedados pelo GitHub, enquanto o caminho de validação que não realiza mutações pode usar os runners Linux maiores do Blacksmith.
- Esse workflow executa `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache` usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`.
- O preflight do release no npm não aguarda mais a faixa separada de verificações de release.
- Antes de criar localmente a tag de um candidato a release, execute `RELEASE_TAG=vYYYY.M.PATCH-beta.N pnpm release:fast-pretag-check`. O auxiliar executa as proteções rápidas de release, as verificações de release de plugins no npm/ClawHub, o build, o build da interface e `release:openclaw:npm:check`, na ordem que detecta erros comuns que bloqueiam a aprovação antes do início do workflow de publicação do GitHub.
- Execute `RELEASE_TAG=vYYYY.M.PATCH node --import tsx scripts/openclaw-npm-release-check.ts` (ou a tag correspondente de pré-release/correção) antes da aprovação.
- Após a publicação no npm, execute `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.PATCH` (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro publicado em um novo prefixo temporário.
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.PATCH-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live` para verificar o onboarding do pacote instalado, a configuração do Telegram e o E2E real do Telegram em relação ao pacote npm publicado, usando o pool compartilhado de credenciais concedidas do Telegram. Em execuções isoladas locais, os mantenedores podem omitir as variáveis do Convex e fornecer diretamente as três credenciais de ambiente `OPENCLAW_QA_TELEGRAM_*`.
- Para executar a verificação rápida beta completa pós-publicação a partir da máquina de um mantenedor, use `pnpm release:beta-smoke -- --beta betaN`. O auxiliar executa a validação de atualização do npm e de destino novo no Parallels, dispara `NPM Telegram Beta E2E`, consulta a execução exata do workflow, baixa o artefato e exibe o relatório do Telegram.
- Os mantenedores podem executar a mesma verificação pós-publicação pelo GitHub Actions por meio do workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e não é executado a cada merge.
- A automação de release dos mantenedores usa preflight seguido de promoção:
  - A publicação real no npm deve passar por um `preflight_run_id` do npm bem-sucedido.
  - A orquestração e o preflight das publicações beta e estável regulares usam `main` confiável em relação à tag de destino exata. A publicação e o preflight alfa do Tideclaw usam a branch alfa correspondente.
  - Os releases estáveis no npm usam `beta` por padrão; a publicação estável no npm pode selecionar explicitamente `latest` por meio da entrada do workflow.
  - A mutação da dist-tag do npm baseada em token reside em `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml`, pois `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o repositório de origem mantém a publicação somente por OIDC.
  - O `macOS Release` público destina-se somente à validação; quando uma tag existe somente em uma branch de release, mas o workflow é disparado a partir de `main`, defina `public_release_branch=release/YYYY.M.PATCH`.
  - A publicação real no macOS deve passar por `preflight_run_id` e `validate_run_id` do macOS bem-sucedidos.
  - Os caminhos de publicação real promovem os artefatos preparados em vez de recriá-los.
- Para releases estáveis de correção, como `YYYY.M.PATCH-N`, o verificador pós-publicação também verifica o mesmo caminho de atualização com prefixo temporário de `YYYY.M.PATCH` para `YYYY.M.PATCH-N`, para que as correções de release não possam deixar silenciosamente instalações globais antigas usando o payload estável base.
- O preflight do release no npm falha de forma segura, a menos que o tarball inclua `dist/control-ui/index.html` e um payload `dist/control-ui/assets/` não vazio, para não distribuirmos novamente um painel do navegador vazio.
- A verificação pós-publicação também confere se os pontos de entrada dos plugins publicados e os metadados do pacote estão presentes no layout instalado do registro. Um release que distribua payloads ausentes do runtime de plugins falha no verificador pós-publicação e não pode ser promovido para `latest`.
- `pnpm test:install:smoke` também aplica o limite de `unpackedSize` do pacote npm ao tarball de atualização candidato, para que o E2E do instalador detecte um aumento acidental do pacote antes do caminho de publicação do release.
- Se o trabalho de release alterou o planejamento de CI, os manifestos de duração das extensões ou as matrizes de testes das extensões, gere novamente e revise as saídas da matriz `plugin-prerelease-extension-shard`, pertencentes ao planejador, a partir de `.github/workflows/plugin-prerelease.yml` antes da aprovação, para que as notas de release não descrevam um layout de CI desatualizado.
- A preparação do release estável para macOS também inclui as superfícies do atualizador: o release do GitHub deve terminar com os arquivos empacotados `.zip`, `.dmg` e `.dSYM.zip`; `appcast.xml` em `main` deve apontar para o novo zip estável após a publicação (o workflow de publicação do macOS faz o commit automaticamente ou abre um PR de appcast quando o push direto está bloqueado); o aplicativo empacotado deve manter um ID de bundle que não seja de depuração, uma URL não vazia do feed do Sparkle e um `CFBundleVersion` igual ou superior ao limite mínimo canônico de build do Sparkle para essa versão do release.

## Caixas de teste de release

`Full Release Validation` é a forma pela qual os operadores iniciam a matriz completa do produto por um único ponto de entrada. Use o auxiliar para que cada workflow filho seja executado a partir de uma branch temporária fixada em um SHA confiável de workflow `main`, enquanto o commit solicitado permanece como o candidato em teste:

```bash
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH
```

O auxiliar busca o `origin/main` atual, envia `release-ci/<workflow-sha>-...` nesse commit confiável do workflow, infere `beta` a partir das versões alfa/beta do pacote e `stable` nos demais casos, dispara `Full Release Validation` a partir da branch temporária com `ref=<target-sha>`, verifica se cada `headSha` de workflow filho corresponde ao SHA fixado do workflow pai e, em seguida, exclui a branch temporária. Forneça `-f reuse_evidence=false` para forçar uma nova execução, `-f release_profile=full` para a varredura consultiva ampla ou `--workflow-sha <trusted-main-sha>` para fixar um commit mais antigo que ainda seja alcançável a partir do `origin/main` atual. O próprio workflow nunca grava referências do repositório. Isso mantém as ferramentas de release exclusivas da main disponíveis sem adicionar commits de ferramentas ao candidato e evita comprovar acidentalmente uma execução filha `main` mais recente.

Depois que o SHA do código estiver verde, faça commit somente de `CHANGELOG.md` e execute o mesmo auxiliar com o SHA do release:

```bash
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH
```

O segundo pai reutiliza a evidência do produto somente quando o GitHub comprova que o SHA do release descende do SHA do código e que o conjunto completo de caminhos alterados é exatamente `CHANGELOG.md`. Ele registra `changelog-only-release-v1` e não dispara nenhum filho do produto. O preflight do npm e a aceitação de pacote/instalação ainda são executados no SHA do release porque os bytes do tarball foram alterados.

Para um novo SHA do código, o workflow resolve o destino, dispara manualmente `CI` e, em seguida, dispara `OpenClaw Release Checks`. `OpenClaw Release Checks` distribui a verificação rápida de instalação, as verificações de release entre sistemas operacionais, a cobertura ao vivo/E2E do caminho de release no Docker quando a execução prolongada está habilitada, a Aceitação de Pacote com o E2E canônico do pacote do Telegram, a paridade do QA Lab, o Matrix ao vivo e o Telegram ao vivo. Uma execução completa/todas só é aceitável quando o resumo de `Full Release Validation` mostra `normal_ci`, `plugin_prerelease` e `release_checks` como bem-sucedidos, a menos que uma nova execução focada tenha ignorado intencionalmente o filho separado `Plugin Prerelease`. Use o filho independente `npm-telegram` somente para uma nova execução focada do pacote publicado com `release_package_spec` ou `npm_telegram_package_spec`. O resumo final do verificador inclui tabelas dos jobs mais lentos de cada execução filha, para que o gerente de release possa ver o caminho crítico atual sem baixar logs.

O filho de desempenho do produto produz somente artefatos nesse caminho de release. O
workflow abrangente o dispara com `publish_reports=false`, e a validação é rejeitada
a menos que sua proteção de somente artefatos comprove que o publicador de relatórios do Clawgrit permaneceu
ignorado.

Consulte [Validação completa de release](/pt-BR/reference/full-release-validation) para ver a matriz completa de etapas, os nomes exatos dos jobs dos workflows, as diferenças entre os perfis estável e completo, os artefatos e os identificadores para novas execuções focadas.

Os workflows filhos são disparados a partir da referência confiável fixada por SHA que executa `Full Release Validation`. Cada execução filha deve usar o SHA exato do workflow pai. Não use disparos `--ref main -f ref=<sha>` brutos como comprovação do release; use `pnpm ci:full-release --sha <target-sha> --target-ref release/YYYY.M.PATCH`.

Use `release_profile` para selecionar a abrangência ao vivo/de provedores:

- `beta`: caminho crítico de release mais rápido ao vivo e no Docker para OpenAI/core
- `stable`: cobertura beta e estável de provedores/backends para aprovação do release
- `full`: cobertura estável mais ampla e consultiva de provedores/mídia

As validações estável e completa sempre executam a varredura exaustiva ao vivo/E2E, do caminho de release no Docker e de sobrevivência a atualizações publicadas com limites definidos antes da promoção. Use `run_release_soak=true` para solicitar a mesma varredura para uma versão beta. Essa varredura abrange os quatro pacotes estáveis mais recentes, além das linhas de base fixadas `2026.4.23` e `2026.5.2` e da cobertura mais antiga de `2026.4.15`, com as linhas de base duplicadas removidas e cada linha de base distribuída em seu próprio job de runner do Docker.

`OpenClaw Release Checks` usa a referência confiável do workflow para resolver uma vez a referência de destino como `release-package-under-test` e reutiliza esse artefato nas verificações entre sistemas operacionais, de Aceitação de Pacote e do caminho de release no Docker quando a execução prolongada é realizada. Isso mantém todas as caixas voltadas a pacotes usando os mesmos bytes e evita builds repetidos do pacote. Depois que uma versão beta já estiver no npm, defina `release_package_spec=openclaw@YYYY.M.PATCH-beta.N` para que as verificações de release baixem uma vez o pacote distribuído, extraiam seu SHA do código-fonte do build de `dist/build-info.json` e reutilizem esse artefato nas faixas entre sistemas operacionais, de Aceitação de Pacote, do caminho de release no Docker e do pacote do Telegram.

A verificação rápida de instalação do OpenAI entre sistemas operacionais usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` quando a variável do repositório/organização está definida; caso contrário, usa `openai/gpt-5.6-luna`, pois essa faixa comprova a instalação do pacote, o onboarding, a inicialização do Gateway e uma interação ao vivo com o agente, em vez de avaliar comparativamente o modelo mais capaz. A matriz mais ampla de provedores ao vivo continua sendo o local para a cobertura específica de modelos.

Use estas variantes de acordo com a etapa do release:

```bash
# Valide o Code SHA com o produto completo.
pnpm ci:full-release \
  --sha <code-sha> \
  --target-ref release/YYYY.M.PATCH

# Valide o Release SHA apenas com alterações no changelog reutilizando as evidências do produto do Code SHA.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH

# Após publicar uma versão beta, adicione o E2E do Telegram com o pacote publicado.
pnpm ci:full-release \
  --sha <release-sha> \
  --target-ref release/YYYY.M.PATCH \
  -f release_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f evidence_package_spec=openclaw@YYYY.M.PATCH-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Não use o fluxo abrangente completo como a primeira reexecução após uma correção focada. Se um ambiente falhar, use o fluxo de trabalho filho, job, lane do Docker, perfil de pacote, provedor de modelo ou lane de QA que falhou para a próxima comprovação. Execute novamente o fluxo abrangente completo somente quando a correção tiver alterado a orquestração compartilhada da versão ou tornado obsoletas as evidências anteriores de todos os ambientes. O verificador final do fluxo abrangente verifica novamente os IDs registrados das execuções dos fluxos de trabalho filhos; portanto, após a reexecução bem-sucedida de um fluxo de trabalho filho, reexecute somente o job pai `Verify full validation` que falhou.

`rerun_group=all` pode reutilizar uma execução abrangente anterior bem-sucedida quando o perfil da versão,
a configuração efetiva de soak e as entradas de validação coincidirem e o SHA de destino
for idêntico ou o novo destino for um descendente cujo conjunto completo de caminhos alterados
seja exatamente `CHANGELOG.md`. A reutilização do destino exato registra
`exact-target-full-validation-v1`; o Release SHA posterior à validação registra
`changelog-only-release-v1`. Este último reutiliza somente a validação do produto. A pré-verificação
do npm, os bytes do pacote, a procedência das notas da versão e a aceitação de instalação/atualização
ainda devem ser executados no Release SHA. Qualquer alteração de versão, origem, conteúdo gerado,
dependência, pacote ou destino pertencente ao fluxo de trabalho exige um novo Code SHA
e uma nova validação completa. Execuções abrangentes mais recentes para a mesma ref `release/*` e
o mesmo grupo de reexecução substituem automaticamente as que estiverem em andamento. Passe
`reuse_evidence=false` para forçar uma nova execução completa.

Para uma recuperação delimitada, passe `rerun_group` ao fluxo abrangente. `all` é a execução real da versão candidata, `ci` executa somente o fluxo filho de CI normal, `plugin-prerelease` executa somente o fluxo filho de plugins exclusivo da versão, `release-checks` executa todos os ambientes da versão, e os grupos mais restritos da versão são `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` e `npm-telegram`. Reexecuções focadas de `npm-telegram` exigem `release_package_spec` ou `npm_telegram_package_spec`; execuções completas/totais usam o E2E canônico do Telegram com pacote dentro da Aceitação de Pacote. Reexecuções focadas entre sistemas operacionais podem adicionar `cross_os_suite_filter=windows/packaged-upgrade` ou outro filtro de sistema operacional/suíte. Falhas nas verificações de versão do QA bloqueiam a validação normal da versão, incluindo a divergência obrigatória das ferramentas dinâmicas do OpenClaw no nível padrão. Execuções alfa do Tideclaw ainda podem tratar como consultivas as lanes de verificação de versão que não sejam relacionadas à segurança de pacotes. Com `release_profile=beta`, as suítes de provedores ativos `Run repo/live E2E validation` são consultivas (avisos, não bloqueios); os perfis estável e completo mantêm-nas como bloqueantes. Quando `live_suite_filter` solicita explicitamente uma lane ativa de QA sujeita a controle, como Discord, WhatsApp ou Slack, a variável correspondente do repositório `OPENCLAW_RELEASE_QA_*_LIVE_CI_ENABLED` deve estar habilitada; caso contrário, a captura de entrada falha em vez de ignorar silenciosamente a lane.

### Vitest

O ambiente do Vitest é o fluxo de trabalho filho manual `CI`. A CI manual ignora intencionalmente o escopo de alterações e força o grafo normal de testes para a versão candidata: shards do Linux Node, shards de plugins incluídos, shards de contratos de plugins e canais, compatibilidade com Node 22, `check-*`, `check-additional-*`, verificações rápidas de artefatos compilados, verificações da documentação, Skills em Python, Windows, macOS e internacionalização da interface de controle. O Android é incluído quando `Full Release Validation` executa o ambiente, pois o fluxo abrangente passa `include_android=true`; a CI manual independente exige `include_android=true` para cobrir o Android.

Use este ambiente para responder: "a árvore de código-fonte passou na suíte completa de testes normais?". Isso não equivale à validação do produto no caminho da versão. Evidências a manter:

- Resumo de `Full Release Validation` mostrando a URL da execução de `CI` disparada
- Execução de `CI` bem-sucedida no SHA de destino exato
- Nomes dos shards com falha ou lentidão nos jobs da CI durante a investigação de regressões
- Artefatos de temporização do Vitest, como `.artifacts/vitest-shard-timings.json`, quando uma execução exigir análise de desempenho

Execute a CI manual diretamente somente quando a versão precisar de uma CI normal determinística, mas não dos ambientes do Docker, QA Lab, execução ativa, sistemas operacionais distintos ou pacotes. Use o primeiro comando para uma CI direta sem Android. Adicione `include_android=true` quando a CI direta da versão candidata precisar cobrir o Android:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.PATCH -f include_android=true
```

### Docker

O ambiente do Docker reside em `OpenClaw Release Checks` por meio de `openclaw-live-and-e2e-checks-reusable.yml`, além do fluxo de trabalho `install-smoke` no modo de versão. Ele valida a versão candidata por meio de ambientes Docker empacotados, em vez de usar somente testes no nível do código-fonte.

A cobertura do Docker para a versão inclui:

- Verificação rápida da instalação completa com a verificação lenta da instalação global do Bun habilitada
- Preparação/reutilização da imagem de verificação rápida do Dockerfile raiz por SHA de destino, com os jobs de verificação rápida de QR, raiz/Gateway e instalador/Bun executados como shards separados de verificação de instalação
- Lanes E2E do repositório
- Partes do Docker no caminho da versão: `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, de `plugins-runtime-install-a` a `plugins-runtime-install-h` e `openwebui`
- Cobertura do OpenWebUI em um executor dedicado com disco grande quando solicitada
- Lanes divididas de instalação/desinstalação de plugins incluídos, de `bundled-plugin-install-uninstall-0` a `bundled-plugin-install-uninstall-23`
- Suítes de provedores ativos/E2E e cobertura de modelos ativos no Docker quando as verificações da versão incluem suítes ativas

Use os artefatos do Docker antes de reexecutar. O agendador do caminho da versão envia `.artifacts/docker-tests/` com logs das lanes, `summary.json`, `failures.json`, tempos das fases, o JSON do plano do agendador e comandos de reexecução. Para uma recuperação focada, use `docker_lanes=<lane[,lane]>` no fluxo de trabalho reutilizável ativo/E2E em vez de reexecutar todas as partes da versão. Os comandos de reexecução gerados incluem entradas anteriores de `package_artifact_run_id` e imagens Docker preparadas quando disponíveis, para que uma lane com falha possa reutilizar o mesmo tarball e as mesmas imagens do GHCR.

### QA Lab

O ambiente do QA Lab também faz parte de `OpenClaw Release Checks`. Ele é o controle da versão para comportamento agêntico e no nível dos canais, separado do Vitest e da mecânica de pacotes do Docker.

A cobertura do QA Lab para a versão inclui:

- Lane de paridade simulada que compara a lane candidata da OpenAI com a linha de base `anthropic/claude-opus-4-8` usando o pacote de paridade agêntica
- Perfil de versão do adaptador ativo do Matrix usando o ambiente `qa-live-shared`
- Lane ativa de QA do Telegram usando concessões de credenciais da CI do Convex
- `pnpm qa:otel:smoke`, `pnpm qa:otel:collector-smoke`, `pnpm qa:prometheus:smoke` ou `pnpm qa:observability:smoke` quando a telemetria da versão precisar de comprovação local explícita

Use este ambiente para responder: "a versão se comporta corretamente nos cenários de QA e nos fluxos ativos dos canais?". Mantenha as URLs dos artefatos das lanes de paridade, Matrix e Telegram ao aprovar a versão. A cobertura completa do Matrix continua disponível como uma execução manual fragmentada do QA Lab, em vez de ser a lane crítica padrão da versão.

### Pacote

O ambiente de Pacote é o controle do produto instalável. Ele é respaldado por `Package Acceptance` e pelo resolvedor `scripts/resolve-openclaw-package-candidate.mjs`. O resolvedor normaliza um candidato no tarball `package-under-test` consumido pelo E2E do Docker, valida o inventário do pacote, registra a versão e o SHA-256 do pacote e mantém a ref do ambiente do fluxo de trabalho separada da ref de origem do pacote.

Origens de candidatos compatíveis:

- `source=npm`: `openclaw@beta`, `openclaw@latest` ou uma versão de lançamento exata do OpenClaw
- `source=ref`: empacotar uma ramificação, tag ou SHA completo de commit confiável de `package_ref` com o ambiente `workflow_ref` selecionado
- `source=url`: baixar um `.tgz` HTTPS público com `package_sha256` obrigatório; credenciais na URL, portas HTTPS não padrão, nomes de host ou endereços resolvidos privados/internos/de uso especial e redirecionamentos inseguros são rejeitados
- `source=trusted-url`: baixar um `.tgz` HTTPS com `package_sha256` e `trusted_source_id` obrigatórios de uma política nomeada em `.github/package-trusted-sources.json`; use isso para espelhos empresariais pertencentes aos mantenedores ou repositórios privados de pacotes, em vez de adicionar a `source=url` um desvio de rede privada no nível da entrada
- `source=artifact`: reutilizar um `.tgz` enviado por outra execução do GitHub Actions

`OpenClaw Release Checks` executa a Aceitação de Pacote com `source=artifact`, o artefato preparado do pacote da versão, `suite_profile=custom`, `docker_lanes=doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape`, `telegram_mode=mock-openai`. A Aceitação de Pacote mantém a migração, atualização, upgrade de VPS gerenciado pela raiz, reinicialização após atualização com autenticação configurada, instalação ativa de Skills do ClawHub, limpeza de dependências obsoletas de plugins, fixtures de plugins offline, atualização de plugins, reforço contra escape da vinculação de comandos de plugins e QA do pacote do Telegram no mesmo tarball resolvido. As verificações bloqueantes da versão usam como linha de base o pacote publicado mais recente por padrão; o perfil beta com `run_release_soak=true`, `release_profile=stable` ou `release_profile=full` expande a varredura de sobrevivência a upgrades publicados para `last-stable-4`, além das linhas de base fixadas `2026.4.23`, `2026.5.2` e `2026.4.15`, com cenários `reported-issues`. Use a Aceitação de Pacote com `source=npm` para um candidato já lançado, `source=ref` para um tarball npm local respaldado por SHA antes da publicação, `source=trusted-url` para um espelho empresarial/privado pertencente aos mantenedores ou `source=artifact` para um tarball preparado enviado por outra execução do GitHub Actions.

Ela é a substituição nativa do GitHub para a maior parte da cobertura de pacote/atualização que antes exigia o Parallels. As verificações de versão entre sistemas operacionais ainda são importantes para integração inicial, instalador e comportamento específicos do sistema operacional, mas a validação do produto para pacotes/atualizações deve preferir a Aceitação de Pacote.

A lista de verificação canônica para validação de atualizações e plugins é [Teste de atualizações e plugins](/pt-BR/help/testing-updates-plugins). Use-a ao decidir qual lane local, do Docker, de Aceitação de Pacote ou de verificação da versão comprova uma instalação/atualização de Plugin, limpeza pelo doctor ou alteração de migração de pacote publicado. A migração exaustiva de atualização publicada a partir de cada pacote estável `2026.4.23+` é um fluxo de trabalho manual `Update Migration` separado, não faz parte da CI Completa da Versão.

A tolerância legada da aceitação de pacotes tem prazo limitado intencionalmente. Pacotes até `2026.4.25` podem usar o caminho de compatibilidade para lacunas de metadados já publicados no npm: entradas privadas do inventário de QA ausentes no tarball, `gateway install --wrapper` ausente, arquivos de patch ausentes na fixture do git derivada do tarball, `update.channel` persistido ausente, locais legados de registros de instalação de plugins, persistência ausente do registro de instalação do marketplace e migração de metadados de configuração durante `plugins update`. O pacote publicado `2026.4.26` pode emitir avisos sobre arquivos de carimbo de metadados da compilação local que já foram lançados. Pacotes posteriores devem atender aos contratos modernos de pacote; essas mesmas lacunas fazem a validação da versão falhar.

Use perfis mais amplos de Aceitação de Pacote quando a questão da versão envolver um pacote realmente instalável:

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

- `smoke`: fluxos rápidos de instalação de pacote/canal/agente, rede do Gateway e recarregamento de configuração
- `package`: contratos de instalação/atualização/reinicialização/pacote de plugin, além de comprovação de instalação de Skill do ClawHub em ambiente real; este é o padrão de verificação de versão
- `product`: `package` mais canais MCP, limpeza de cron/subagente, pesquisa na web da OpenAI e OpenWebUI
- `full`: segmentos do caminho de lançamento do Docker com OpenWebUI
- `custom`: lista exata de `docker_lanes` para reexecuções específicas

Para a comprovação do Telegram com pacote candidato, habilite `telegram_mode=mock-openai` ou `telegram_mode=live-frontier` em Package Acceptance. O fluxo de trabalho passa o tarball `package-under-test` resolvido para o fluxo do Telegram; o fluxo de trabalho independente do Telegram ainda aceita uma especificação npm publicada para verificações pós-publicação.

## Automação regular de publicação de versões

Para publicação beta, `latest`, de plugins, de GitHub Release e de plataformas,
`OpenClaw Release Publish` é o ponto de entrada mutável normal. O caminho mensal
`.33+` somente npm de estabilidade estendida não usa esse orquestrador. O
fluxo de trabalho regular orquestra os fluxos de trabalho de publicador confiável na ordem
exigida pela versão:

1. Faça checkout da tag da versão e resolva o SHA do commit correspondente.
2. Verifique se a tag pode ser alcançada a partir de `main` ou `release/*` (ou de uma branch alfa do Tideclaw para pré-lançamentos alfa).
3. Execute `pnpm plugins:sync:check`.
4. Dispare `Plugin NPM Release` com `publish_scope=all-publishable` e `ref=<release-sha>`.
5. Dispare `Plugin ClawHub Release` com o mesmo escopo e SHA.
6. Dispare `OpenClaw NPM Release` com a tag da versão, a dist-tag do npm e o `preflight_run_id` salvo após verificar o `full_release_validation_run_id` salvo e a tentativa exata da execução.
7. Para versões estáveis, crie ou atualize a versão do GitHub como rascunho, dispare `Windows Node Release` com o `windows_node_tag` explícito e o `windows_node_installer_digests` aprovado para o candidato e verifique os ativos canônicos de instaladores/somas de verificação do Windows. Dispare também `Android Release` para criar o APK assinado da tag exata, além da soma de verificação e da proveniência. Verifique os dois contratos de ativos nativos antes de publicar o rascunho.

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

Use os fluxos de trabalho de nível inferior `Plugin NPM Release` e `Plugin ClawHub Release` somente para trabalhos específicos de reparo ou republicação. `OpenClaw Release Publish` rejeita `plugin_publish_scope=selected` quando `publish_openclaw_npm=true`, para que o pacote principal não possa ser lançado sem todos os plugins oficiais publicáveis, incluindo `@openclaw/diffs-language-pack`. Para reparar um plugin selecionado, defina `publish_openclaw_npm=false` com `plugin_publish_scope=selected` e `plugins=@openclaw/name`, ou dispare diretamente o fluxo de trabalho filho.

A inicialização da primeira publicação no ClawHub é a exceção: dispare `Plugin ClawHub New`
a partir do `main` confiável e passe o SHA completo da versão de destino por meio de `ref`.
Nunca execute o próprio fluxo de trabalho de inicialização a partir da tag ou branch da versão:

```bash
gh workflow run plugin-clawhub-new.yml \
  --ref main \
  -f plugins=@openclaw/name \
  -f ref=<full-40-character-release-sha> \
  -f pretag_validation=true \
  -f dry_run=true
```

A validação anterior à criação da tag exige `dry_run=true`, rejeita entradas de tag de versão
e de execução pai e aceita apenas um destino exato alcançável a partir de `main` ou `release/*`.
Ela não carrega credenciais do ClawHub, publica bytes de pacotes nem altera a
configuração do publicador confiável. O fluxo de trabalho ainda resolve o plano do registro em ambiente real,
faz checkout e empacota o destino somente em um trabalho sem segredos, materializa o
conjunto de ferramentas bloqueado do ClawHub e valida o artefato imutável e o
slug/a identidade do pacote antes que a tag da versão exista. Aprove o ambiente
`clawhub-plugin-bootstrap` somente após a conclusão dos trabalhos de empacotamento
sem segredos; esse trabalho de validação protegido não tem credenciais nem comandos de mutação.

Uma simulação aprovada ou uma inicialização real após a criação da tag deve incluir a
tag exata da versão, além do ID, da tentativa e da
branch da execução pai `OpenClaw Release Publish`. A execução pai atesta o SHA do próprio fluxo de trabalho e um SHA confiável
`main` exato e separado para `Plugin ClawHub New`; a execução filha e cada aprovação de
ambiente protegido devem corresponder a esse SHA filho aprovado. A tag da versão é
verificada novamente antes de cada tentativa de publicação e mutação do publicador confiável.

O trabalho de empacotamento
envia um artefato imutável cujo nome, ID/digest do artefato do Actions,
execução/tentativa produtora, SHA de destino e SHA-256/tamanho do tarball de cada pacote são
transportados para os trabalhos de validação e protegidos. O trabalho protegido faz checkout somente das ferramentas
`main` confiáveis, valida a tupla do artefato por meio da API do GitHub, baixa
pelo ID exato do artefato, recalcula o hash de cada tarball e valida os caminhos TAR locais e
a identidade do pacote com as regras de canonicalização USTAR da CLI fixada. Cada
candidato passa então pela simulação de publicação da CLI fixada, que retorna antes da
consulta ao registro ou da autenticação. O pré-filtro do trabalho com credenciais limita os ClawPacks compactados
a 120 MiB, a carga total de arquivos a 50 MiB, os dados TAR expandidos a 64 MiB e
a contagem de entradas TAR a 10.000. O reparo do publicador confiável de pacotes existentes continua
apenas configurando, mas ainda empacota o destino e exige a tag solicitada,
além da igualdade exata dos bytes e metadados do registro, antes de alterar a configuração do publicador
confiável. A verificação pós-publicação baixa o artefato do ClawHub e
exige o mesmo SHA-256 e tamanho. Uma recuperação por reexecução de falhas pode reutilizar o artefato de pacote de uma
tentativa anterior somente quando o trabalho produtor exato tiver sido concluído
com êxito. A evidência final também vincula a versão bloqueada do ClawHub, o
SHA-256 do bloqueio e a integridade do npm. Uma divergência exige uma nova versão do pacote.

## Entradas do fluxo de trabalho do NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de versão obrigatória, como `v2026.4.2`, `v2026.4.2-1`, `v2026.4.2-beta.1` ou `v2026.4.2-alpha.1`; quando `preflight_only=true`, ela também pode ser o SHA completo de 40 caracteres do commit atual da branch do fluxo de trabalho para a verificação preliminar somente de validação
- `preflight_only`: `true` somente para validação/compilação/empacotamento, `false` para o caminho de publicação real
- `preflight_run_id`: ID de uma execução preliminar existente e bem-sucedida, obrigatório no caminho de publicação real para que o fluxo de trabalho reutilize o tarball preparado em vez de recriá-lo
- `full_release_validation_run_id`: ID de uma execução `Full Release Validation` bem-sucedida para esta tag/SHA, obrigatório para uma publicação real. As publicações beta podem prosseguir somente com a verificação preliminar, apresentando um aviso, mas a promoção estável/`latest` ainda a exige.
- `full_release_validation_run_attempt`: tentativa de execução positiva exata associada a `full_release_validation_run_id`; obrigatória sempre que o ID da execução for fornecido, para que as reexecuções não possam alterar a evidência de autorização durante a publicação.
- `release_publish_run_id`: ID de uma execução `OpenClaw Release Publish` aprovada; obrigatório quando esse fluxo de trabalho é disparado por esse pai (chamadas de publicação real executadas por bot)
- `plugin_npm_run_id`: ID de uma execução `Plugin NPM Release` bem-sucedida no HEAD exato; obrigatório para uma publicação real do núcleo `extended-stable`
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; aceita `alpha`, `beta`, `latest` ou `extended-stable` e usa `beta` por padrão. O patch final `33` e posteriores devem usar `extended-stable`; por padrão, `extended-stable` rejeita patches anteriores e sempre rejeita tags não finais.
- `bypass_extended_stable_guard`: booleano somente para testes, padrão `false`; com `npm_dist_tag=extended-stable`, ignora a elegibilidade mensal de estabilidade estendida, preservando as verificações de identidade da versão, artefato, aprovação e leitura posterior.

`Plugin NPM Release` aceita `npm_dist_tag=default` para o comportamento existente da versão
ou `npm_dist_tag=extended-stable` para o caminho mensal protegido. A
opção de estabilidade estendida exige `publish_scope=all-publishable`, uma entrada
`plugins` vazia, um patch final igual ou superior a `33` e a branch canônica
`extended-stable/YYYY.M.33` em sua ponta exata. Ela nunca move `latest`
nem `beta` dos plugins. Novas versões de pacotes recebem `extended-stable` atomicamente
por meio da publicação confiável com OIDC (`npm publish --tag extended-stable`); esse
fluxo de trabalho de origem não usa `npm dist-tag add` autenticado por token. As novas tentativas
ignoram versões exatas já presentes no npm e, em seguida, falham de forma segura, a menos que uma
leitura posterior completa confirme que todos os pacotes exatos e a tag `extended-stable` convergiram.

`OpenClaw Release Publish` aceita estas entradas controladas pelo operador:

- `tag`: tag de versão obrigatória; já deve existir
- `preflight_run_id`: ID de uma execução preliminar `OpenClaw NPM Release` bem-sucedida; obrigatório quando `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_id`: ID de uma execução `Full Release Validation` bem-sucedida; obrigatório quando `publish_openclaw_npm=true` ou `plugin_publish_scope=all-publishable`
- `full_release_validation_run_attempt`: tentativa positiva exata associada a `full_release_validation_run_id`; obrigatória sempre que o ID da execução for fornecido
- `windows_node_tag`: tag exata da versão `openclaw/openclaw-windows-node`, sem ser pré-lançamento; obrigatória para a publicação estável do OpenClaw
- `windows_node_installer_digests`: mapa JSON compacto, aprovado para o candidato, dos nomes atuais dos instaladores do Windows para seus digests `sha256:` fixados; obrigatório para a publicação estável do OpenClaw
- `npm_telegram_run_id`: ID opcional de uma execução `NPM Telegram Beta E2E` bem-sucedida a ser incluída na evidência final da versão
- `npm_dist_tag`: tag de destino do npm para o pacote OpenClaw, uma entre `alpha`, `beta` ou `latest`
- `plugin_publish_scope`: usa `all-publishable` por padrão; use `selected` somente para trabalhos específicos de reparo exclusivo de plugins com `publish_openclaw_npm=false`
- `plugins`: nomes de pacotes `@openclaw/*` separados por vírgulas quando `plugin_publish_scope=selected`
- `publish_openclaw_npm`: usa `true` por padrão; defina `false` somente ao usar o fluxo de trabalho como orquestrador de reparo exclusivo de plugins
- `release_profile`: perfil de cobertura da versão usado nos resumos de evidências da versão; usa `from-validation` por padrão, que o lê do manifesto de validação, ou substitua por `beta`, `stable` ou `full`
- `wait_for_clawhub`: usa `false` por padrão para que a disponibilidade no npm não seja bloqueada pelo processo auxiliar do ClawHub; defina `true` somente quando a conclusão do fluxo de trabalho precisar incluir a conclusão do ClawHub

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: branch, tag ou SHA completo do commit a ser validado. As verificações que envolvem segredos exigem que o commit resolvido esteja acessível a partir de uma branch ou tag de release do OpenClaw.
- `run_release_soak`: habilita verificações live/E2E exaustivas, o caminho de release do Docker e o teste prolongado de sobrevivência a upgrades desde todas as versões para verificações de release beta. É habilitado obrigatoriamente por `release_profile=stable` e `release_profile=full`.

Regras:

- Versões finais regulares e versões de correção abaixo do patch `33` podem ser publicadas em `beta` ou `latest`. Versões finais no patch `33` ou superior devem ser publicadas em `extended-stable`, e versões com sufixo de correção nesse limite são rejeitadas.
- Tags de pré-release beta podem ser publicadas somente em `beta`; tags de pré-release alfa podem ser publicadas somente em `alpha`
- Para `OpenClaw NPM Release`, a entrada de SHA completo do commit é permitida somente quando `preflight_only=true`
- `OpenClaw Release Checks` e `Full Release Validation` são sempre destinados somente à validação
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante a verificação preliminar; o workflow verifica esses metadados antes de prosseguir com a publicação

## Sequência regular de release beta/estável mais recente

Esta sequência legada destina-se ao release orquestrado regular, que também abrange plugins, o GitHub Release, o Windows e o trabalho em outras plataformas. Ela não é o caminho mensal de estabilidade estendida `.33+`, exclusivo do npm, documentado no início desta página.

Ao preparar um release estável orquestrado regular:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`. Antes que exista uma tag, é possível usar o SHA atual completo do commit da branch do workflow para uma simulação somente de validação do workflow de verificação preliminar.
2. Escolha `npm_dist_tag=beta` para o fluxo normal que começa pelo beta ou `latest` somente quando quiser intencionalmente uma publicação estável direta.
3. Execute `Full Release Validation` na branch de release, na tag de release ou no SHA completo do commit quando quiser, em um único workflow manual, a CI normal com cobertura live do cache de prompts, Docker, QA Lab, Matrix e Telegram. Se intencionalmente precisar apenas do grafo determinístico de testes normais, execute o workflow manual `CI` na referência de release.
4. Selecione a tag exata de release `openclaw/openclaw-windows-node`, que não seja de pré-release, cujos instaladores x64 e ARM64 assinados devem ser distribuídos. Salve-a como `windows_node_tag` e salve o mapa de resumos criptográficos validados como `windows_node_installer_digests`. O auxiliar de candidato a release registra ambos e os inclui no comando de publicação gerado.
5. Salve os valores bem-sucedidos de `preflight_run_id`, `full_release_validation_run_id` e o valor exato de `full_release_validation_run_attempt`.
6. Execute `OpenClaw Release Publish` a partir do `main` confiável, com o mesmo `tag`, o mesmo `npm_dist_tag`, o `windows_node_tag` selecionado, seu `windows_node_installer_digests` salvo, o `preflight_run_id` salvo, `full_release_validation_run_id` e `full_release_validation_run_attempt`. Ele publica plugins externalizados no npm e no ClawHub antes de promover o pacote npm do OpenClaw.
7. Se o release foi publicado em `beta`, use o workflow `openclaw/releases/.github/workflows/openclaw-npm-dist-tags.yml` para promover essa versão estável de `beta` para `latest`.
8. Se o release foi publicado intencionalmente diretamente em `latest` e `beta` deve acompanhar imediatamente a mesma compilação estável, use esse mesmo workflow de release para apontar ambas as dist-tags para a versão estável ou deixe que sua sincronização agendada com autorrecuperação mova `beta` posteriormente.

A alteração da dist-tag fica no repositório do registro de releases porque ainda exige `NPM_TOKEN`, enquanto o repositório de código-fonte mantém a publicação exclusivamente via OIDC. Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção que começa pelo beta documentados e visíveis para os operadores.

Se um mantenedor precisar recorrer à autenticação local no npm, execute todos os comandos da CLI do 1Password (`op`) somente dentro de uma sessão dedicada do tmux. Não chame `op` diretamente do shell principal do agente; mantê-lo dentro do tmux torna observáveis os prompts, alertas e o tratamento de OTP, além de evitar alertas repetidos no host.

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

Os mantenedores usam a documentação privada de release em [`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md) como runbook efetivo.

## Relacionado

- [Canais de release](/pt-BR/install/development-channels)
