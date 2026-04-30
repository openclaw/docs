---
read_when:
    - Atualizando uma instalação existente do Matrix
    - Migrando o histórico criptografado do Matrix e o estado do dispositivo
summary: Como o OpenClaw atualiza o Plugin Matrix anterior no mesmo local, incluindo os limites de recuperação de estado criptografado e as etapas de recuperação manual.
title: Migração do Matrix
x-i18n:
    generated_at: "2026-04-30T09:36:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: fff409eef1b7da7be4b63d8459a62b8365a04adf989f271a2f2c4aef46e90716
    source_path: channels/matrix-migration.md
    workflow: 16
---

Atualize do `matrix` plugin público anterior para a implementação atual.

Para a maioria dos usuários, a atualização é feita no local:

- o plugin continua sendo `@openclaw/matrix`
- o canal continua sendo `matrix`
- sua configuração continua em `channels.matrix`
- credenciais em cache continuam em `~/.openclaw/credentials/matrix/`
- o estado de runtime continua em `~/.openclaw/matrix/`

Você não precisa renomear chaves de configuração nem reinstalar o plugin com um novo nome.

## O que a migração faz automaticamente

Quando o Gateway inicia, e quando você executa [`openclaw doctor --fix`](/pt-BR/gateway/doctor), o OpenClaw tenta reparar automaticamente o estado antigo do Matrix.
Antes que qualquer etapa acionável de migração do Matrix altere o estado em disco, o OpenClaw cria ou reutiliza um snapshot de recuperação focado.

Quando você usa `openclaw update`, o acionador exato depende de como o OpenClaw está instalado:

- instalações a partir do código-fonte executam `openclaw doctor --fix` durante o fluxo de atualização e depois reiniciam o Gateway por padrão
- instalações por gerenciador de pacotes atualizam o pacote, executam uma passagem não interativa do doctor e então dependem do reinício padrão do Gateway para que a inicialização conclua a migração do Matrix
- se você usar `openclaw update --no-restart`, a migração do Matrix apoiada pela inicialização é adiada até que você execute `openclaw doctor --fix` mais tarde e reinicie o Gateway

A migração automática cobre:

- criação ou reutilização de um snapshot pré-migração em `~/Backups/openclaw-migrations/`
- reutilização das suas credenciais do Matrix em cache
- manutenção da mesma seleção de conta e configuração `channels.matrix`
- movimentação do armazenamento plano mais antigo de sincronização do Matrix para o local atual com escopo de conta
- movimentação do armazenamento plano mais antigo de criptografia do Matrix para o local atual com escopo de conta quando a conta de destino puder ser resolvida com segurança
- extração de uma chave de descriptografia de backup de chaves de sala do Matrix salva anteriormente a partir do armazenamento de criptografia rust antigo, quando essa chave existir localmente
- reutilização da raiz de armazenamento de hash de token existente mais completa para a mesma conta, homeserver e usuário do Matrix quando o token de acesso mudar posteriormente
- varredura de raízes irmãs de armazenamento de hash de token em busca de metadados pendentes de restauração de estado criptografado quando o token de acesso do Matrix mudou, mas a identidade da conta/dispositivo permaneceu a mesma
- restauração de chaves de sala com backup no novo armazenamento de criptografia na próxima inicialização do Matrix

Detalhes do snapshot:

- O OpenClaw grava um arquivo marcador em `~/.openclaw/matrix/migration-snapshot.json` após um snapshot bem-sucedido para que passagens posteriores de inicialização e reparo possam reutilizar o mesmo arquivo.
- Esses snapshots automáticos de migração do Matrix fazem backup apenas de configuração + estado (`includeWorkspace: false`).
- Se o Matrix tiver apenas estado de migração somente com aviso, por exemplo porque `userId` ou `accessToken` ainda está ausente, o OpenClaw ainda não cria o snapshot porque nenhuma mutação do Matrix é acionável.
- Se a etapa de snapshot falhar, o OpenClaw ignora a migração do Matrix nessa execução em vez de alterar estado sem um ponto de recuperação.

Sobre atualizações de várias contas:

- o armazenamento plano mais antigo do Matrix (`~/.openclaw/matrix/bot-storage.json` e `~/.openclaw/matrix/crypto/`) veio de um layout de armazenamento único, então o OpenClaw só pode migrá-lo para um destino resolvido de uma conta Matrix
- armazenamentos legados do Matrix já com escopo de conta são detectados e preparados por conta Matrix configurada

## O que a migração não consegue fazer automaticamente

O plugin Matrix público anterior **não** criava automaticamente backups de chaves de sala do Matrix. Ele persistia o estado local de criptografia e solicitava verificação do dispositivo, mas não garantia que suas chaves de sala fossem salvas em backup no homeserver.

Isso significa que algumas instalações criptografadas só podem ser migradas parcialmente.

O OpenClaw não consegue recuperar automaticamente:

- chaves de sala somente locais que nunca tiveram backup
- estado criptografado quando a conta Matrix de destino ainda não puder ser resolvida porque `homeserver`, `userId` ou `accessToken` ainda estão indisponíveis
- migração automática de um armazenamento plano compartilhado do Matrix quando várias contas Matrix estão configuradas, mas `channels.matrix.defaultAccount` não está definido
- instalações com caminho de plugin personalizado que estão fixadas em um caminho de repositório em vez do pacote padrão do Matrix
- uma chave de recuperação ausente quando o armazenamento antigo tinha chaves com backup, mas não manteve a chave de descriptografia localmente

Escopo atual de avisos:

- instalações com caminho de plugin Matrix personalizado são exibidas tanto pela inicialização do Gateway quanto pelo `openclaw doctor`

Se sua instalação antiga tinha histórico criptografado somente local que nunca teve backup, algumas mensagens criptografadas mais antigas podem permanecer ilegíveis após a atualização.

## Fluxo de atualização recomendado

1. Atualize o OpenClaw e o plugin Matrix normalmente.
   Prefira `openclaw update` simples, sem `--no-restart`, para que a inicialização possa concluir a migração do Matrix imediatamente.
2. Execute:

   ```bash
   openclaw doctor --fix
   ```

   Se o Matrix tiver trabalho de migração acionável, o doctor criará ou reutilizará primeiro o snapshot pré-migração e imprimirá o caminho do arquivo.

3. Inicie ou reinicie o Gateway.
4. Verifique o estado atual de verificação e backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Coloque a chave de recuperação da conta Matrix que você está reparando em uma variável de ambiente específica da conta. Para uma única conta padrão, `MATRIX_RECOVERY_KEY` é suficiente. Para várias contas, use uma variável por conta, por exemplo `MATRIX_RECOVERY_KEY_ASSISTANT`, e adicione `--account assistant` ao comando.

6. Se o OpenClaw informar que uma chave de recuperação é necessária, execute o comando para a conta correspondente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Se este dispositivo ainda não estiver verificado, execute o comando para a conta correspondente:

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Se a chave de recuperação for aceita e o backup puder ser usado, mas `Cross-signing verified`
   ainda for `no`, conclua a autoverificação a partir de outro cliente Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Aceite a solicitação em outro cliente Matrix, compare os emojis ou decimais,
   e digite `yes` apenas quando corresponderem. O comando só termina com sucesso
   depois que `Cross-signing verified` se tornar `yes`.

8. Se você está abandonando intencionalmente o histórico antigo irrecuperável e quer uma nova linha de base de backup para mensagens futuras, execute:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Se ainda não existir backup de chaves no servidor, crie um para recuperações futuras:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Como a migração criptografada funciona

A migração criptografada é um processo em duas etapas:

1. A inicialização ou `openclaw doctor --fix` cria ou reutiliza o snapshot pré-migração se a migração criptografada for acionável.
2. A inicialização ou `openclaw doctor --fix` inspeciona o armazenamento antigo de criptografia do Matrix por meio da instalação ativa do plugin Matrix.
3. Se uma chave de descriptografia de backup for encontrada, o OpenClaw a grava no novo fluxo de chave de recuperação e marca a restauração de chaves de sala como pendente.
4. Na próxima inicialização do Matrix, o OpenClaw restaura automaticamente as chaves de sala com backup no novo armazenamento de criptografia.

Se o armazenamento antigo relatar chaves de sala que nunca tiveram backup, o OpenClaw avisa em vez de fingir que a recuperação teve êxito.

## Mensagens comuns e o que elas significam

### Mensagens de atualização e detecção

`Matrix plugin upgraded in place.`

- Significado: o estado antigo do Matrix em disco foi detectado e migrado para o layout atual.
- O que fazer: nada, a menos que a mesma saída também inclua avisos.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significado: o OpenClaw criou um arquivo de recuperação antes de alterar o estado do Matrix.
- O que fazer: mantenha o caminho do arquivo impresso até confirmar que a migração foi concluída com sucesso.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significado: o OpenClaw encontrou um marcador de snapshot de migração do Matrix existente e reutilizou esse arquivo em vez de criar um backup duplicado.
- O que fazer: mantenha o caminho do arquivo impresso até confirmar que a migração foi concluída com sucesso.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significado: existe estado antigo do Matrix, mas o OpenClaw não consegue mapeá-lo para uma conta Matrix atual porque o Matrix não está configurado.
- O que fazer: configure `channels.matrix` e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: o OpenClaw encontrou estado antigo, mas ainda não consegue determinar a raiz exata da conta/dispositivo atual.
- O que fazer: inicie o Gateway uma vez com um login Matrix funcional, ou execute novamente `openclaw doctor --fix` depois que credenciais em cache existirem.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: o OpenClaw encontrou um armazenamento plano compartilhado do Matrix, mas se recusa a adivinhar qual conta Matrix nomeada deve recebê-lo.
- O que fazer: defina `channels.matrix.defaultAccount` para a conta pretendida e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significado: o novo local com escopo de conta já tem um armazenamento de sincronização ou criptografia, então o OpenClaw não o sobrescreveu automaticamente.
- O que fazer: verifique se a conta atual é a correta antes de remover ou mover manualmente o destino conflitante.

`Failed migrating Matrix legacy sync store (...)` ou `Failed migrating Matrix legacy crypto store (...)`

- Significado: o OpenClaw tentou mover o estado antigo do Matrix, mas a operação no sistema de arquivos falhou.
- O que fazer: inspecione as permissões do sistema de arquivos e o estado do disco, depois execute novamente `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significado: o OpenClaw encontrou um armazenamento antigo criptografado do Matrix, mas não há configuração atual do Matrix à qual anexá-lo.
- O que fazer: configure `channels.matrix` e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: o armazenamento criptografado existe, mas o OpenClaw não consegue decidir com segurança a qual conta/dispositivo atual ele pertence.
- O que fazer: inicie o Gateway uma vez com um login Matrix funcional, ou execute novamente `openclaw doctor --fix` depois que credenciais em cache estiverem disponíveis.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: o OpenClaw encontrou um armazenamento legado plano compartilhado de criptografia, mas se recusa a adivinhar qual conta Matrix nomeada deve recebê-lo.
- O que fazer: defina `channels.matrix.defaultAccount` para a conta pretendida e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significado: o OpenClaw detectou estado antigo do Matrix, mas a migração ainda está bloqueada por dados de identidade ou credenciais ausentes.
- O que fazer: conclua o login ou a configuração do Matrix e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significado: o OpenClaw encontrou um estado Matrix criptografado antigo, mas não conseguiu carregar o ponto de entrada auxiliar do plugin Matrix que normalmente inspeciona esse armazenamento.
- O que fazer: reinstale ou repare o plugin Matrix (`openclaw plugins install @openclaw/matrix`, ou `openclaw plugins install ./path/to/local/matrix-plugin` para um checkout do repositório), depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.
- Se o npm relatar o pacote Matrix pertencente ao OpenClaw como obsoleto, use o
  plugin incluído em uma build empacotada atual do OpenClaw ou o caminho do checkout local até
  que um pacote npm mais novo seja publicado.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significado: o OpenClaw encontrou um caminho de arquivo auxiliar que escapa da raiz do plugin ou falha nas verificações de limite do plugin, então recusou importá-lo.
- O que fazer: reinstale o plugin Matrix a partir de um caminho confiável, depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significado: o OpenClaw recusou modificar o estado Matrix porque não conseguiu criar primeiro o snapshot de recuperação.
- O que fazer: resolva o erro de backup, depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significado: o fallback do lado do cliente Matrix encontrou armazenamento plano antigo, mas a movimentação falhou. O OpenClaw agora aborta esse fallback em vez de iniciar silenciosamente com um armazenamento novo.
- O que fazer: inspecione permissões ou conflitos no sistema de arquivos, mantenha o estado antigo intacto e tente novamente depois de corrigir o erro.

`Matrix is installed from a custom path: ...`

- Significado: o Matrix está fixado a uma instalação por caminho, então atualizações da linha principal não o substituem automaticamente pelo pacote Matrix padrão do repositório.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix` quando quiser voltar ao plugin Matrix padrão.
- Se o npm relatar o pacote Matrix pertencente ao OpenClaw como obsoleto, use o plugin
  incluído em uma build empacotada atual do OpenClaw até que um pacote npm mais novo seja
  publicado.

### Mensagens de recuperação de estado criptografado

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significado: chaves de sala salvas em backup foram restauradas com sucesso no novo armazenamento criptográfico.
- O que fazer: geralmente nada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significado: algumas chaves de sala antigas existiam apenas no armazenamento local antigo e nunca tinham sido enviadas ao backup do Matrix.
- O que fazer: espere que parte do histórico criptografado antigo permaneça indisponível, a menos que você consiga recuperar essas chaves manualmente de outro cliente verificado.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Significado: existe backup, mas o OpenClaw não conseguiu recuperar automaticamente a chave de recuperação.
- O que fazer: execute `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significado: o OpenClaw encontrou o armazenamento criptografado antigo, mas não conseguiu inspecioná-lo com segurança suficiente para preparar a recuperação.
- O que fazer: execute novamente `openclaw doctor --fix`. Se o problema se repetir, mantenha intacto o diretório de estado antigo e recupere usando outro cliente Matrix verificado mais `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significado: o OpenClaw detectou um conflito de chave de backup e recusou sobrescrever automaticamente o arquivo recovery-key atual.
- O que fazer: verifique qual chave de recuperação está correta antes de tentar novamente qualquer comando de restauração.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significado: este é o limite rígido do formato de armazenamento antigo.
- O que fazer: as chaves em backup ainda podem ser restauradas, mas o histórico criptografado somente local pode permanecer indisponível.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significado: o novo plugin tentou restaurar, mas o Matrix retornou um erro.
- O que fazer: execute `openclaw matrix verify backup status`, depois tente novamente com `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` se necessário.

### Mensagens de recuperação manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significado: o OpenClaw sabe que você deveria ter uma chave de backup, mas ela não está ativa neste dispositivo.
- O que fazer: execute `openclaw matrix verify backup restore`, ou defina `MATRIX_RECOVERY_KEY` e execute `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` se necessário.

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- Significado: este dispositivo atualmente não tem a chave de recuperação armazenada.
- O que fazer: defina `MATRIX_RECOVERY_KEY`, execute `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`, depois restaure o backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- Significado: a chave armazenada não corresponde ao backup Matrix ativo.
- O que fazer: defina `MATRIX_RECOVERY_KEY` como a chave correta e execute `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

Se você aceitar perder histórico criptografado antigo irrecuperável, pode em vez disso redefinir a
linha de base de backup atual com `openclaw matrix verify backup reset --yes`. Quando o
segredo de backup armazenado estiver quebrado, essa redefinição também pode recriar o armazenamento secreto para que a
nova chave de backup seja carregada corretamente após a reinicialização.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Significado: o backup existe, mas este dispositivo ainda não confia na cadeia de assinatura cruzada de forma suficientemente forte.
- O que fazer: defina `MATRIX_RECOVERY_KEY` e execute `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Significado: você tentou uma etapa de recuperação sem fornecer uma chave de recuperação quando uma era necessária.
- O que fazer: execute novamente o comando com `--recovery-key-stdin`, por exemplo `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significado: a chave fornecida não pôde ser analisada ou não correspondia ao formato esperado.
- O que fazer: tente novamente com a chave de recuperação exata do seu cliente Matrix ou do arquivo recovery-key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significado: o OpenClaw conseguiu aplicar a chave de recuperação, mas o Matrix ainda não
  estabeleceu confiança completa de identidade por assinatura cruzada para este dispositivo. Verifique a
  saída do comando para `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` e `Device verified by owner`.
- O que fazer: execute `openclaw matrix verify self`, aceite a solicitação em outro
  cliente Matrix, compare o SAS e digite `yes` somente quando corresponder. O
  comando aguarda a confiança completa de identidade Matrix antes de informar sucesso. Use
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  somente quando você intencionalmente quiser substituir a identidade de assinatura cruzada atual.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significado: o armazenamento secreto não produziu uma sessão de backup ativa neste dispositivo.
- O que fazer: verifique o dispositivo primeiro, depois confira novamente com `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Significado: este dispositivo não consegue restaurar a partir do armazenamento secreto até que a verificação do dispositivo seja concluída.
- O que fazer: execute primeiro `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Mensagens de instalação de plugin personalizado

`Matrix is installed from a custom path that no longer exists: ...`

- Significado: o registro de instalação do seu plugin aponta para um caminho local que não existe mais.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix`, ou se estiver executando a partir de um checkout do repositório, `openclaw plugins install ./path/to/local/matrix-plugin`.
- Se o npm relatar o pacote Matrix pertencente ao OpenClaw como obsoleto, use o
  plugin incluído em uma build empacotada atual do OpenClaw ou o caminho do checkout local até
  que um pacote npm mais novo seja publicado.

## Se o histórico criptografado ainda não voltar

Execute estas verificações em ordem:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Se o backup for restaurado com sucesso, mas algumas salas antigas ainda estiverem sem histórico, essas chaves ausentes provavelmente nunca foram salvas em backup pelo plugin anterior.

## Se você quiser começar do zero para mensagens futuras

Se você aceitar perder histórico criptografado antigo irrecuperável e quiser apenas uma linha de base de backup limpa daqui para frente, execute estes comandos em ordem:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se o dispositivo ainda estiver não verificado depois disso, conclua a verificação a partir do seu cliente Matrix comparando os emojis SAS ou códigos decimais e confirmando que eles correspondem.

## Relacionado

- [Matrix](/pt-BR/channels/matrix): configuração e config do canal.
- [Regras push do Matrix](/pt-BR/channels/matrix-push-rules): roteamento de notificações.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade e gatilho de migração automática.
- [Guia de migração](/pt-BR/install/migrating): todos os caminhos de migração (movimentações de máquina, importações entre sistemas).
- [Plugins](/pt-BR/tools/plugin): instalação e registro de plugins.
