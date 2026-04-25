---
read_when:
    - Atualizando uma instalação existente do Matrix
    - Migrando histórico criptografado do Matrix e estado do dispositivo
summary: Como o OpenClaw atualiza o plugin anterior do Matrix no local, incluindo limites de recuperação de estado criptografado e etapas de recuperação manual.
title: Migração do Matrix
x-i18n:
    generated_at: "2026-04-25T13:48:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

Esta página cobre atualizações do plugin público anterior `matrix` para a implementação atual.

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

Quando você usa `openclaw update`, o gatilho exato depende de como o OpenClaw está instalado:

- instalações a partir do código-fonte executam `openclaw doctor --fix` durante o fluxo de atualização e depois reiniciam o Gateway por padrão
- instalações por gerenciador de pacotes atualizam o pacote, executam uma passada não interativa do doctor e depois dependem da reinicialização padrão do Gateway para que a inicialização conclua a migração do Matrix
- se você usar `openclaw update --no-restart`, a migração do Matrix dependente da inicialização será adiada até que você execute `openclaw doctor --fix` e reinicie o Gateway depois

A migração automática cobre:

- criar ou reutilizar um snapshot pré-migração em `~/Backups/openclaw-migrations/`
- reutilizar suas credenciais Matrix em cache
- manter a mesma seleção de conta e a mesma configuração `channels.matrix`
- mover o armazenamento de sincronização Matrix plano mais antigo para o local atual com escopo por conta
- mover o armazenamento criptográfico Matrix plano mais antigo para o local atual com escopo por conta quando a conta de destino puder ser resolvida com segurança
- extrair uma chave de descriptografia de backup de chave de sala do Matrix salva anteriormente do armazenamento criptográfico Rust antigo, quando essa chave existir localmente
- reutilizar a raiz de armazenamento de hash de token existente mais completa para a mesma conta Matrix, homeserver e usuário quando o token de acesso mudar mais tarde
- examinar raízes irmãs de armazenamento de hash de token em busca de metadados pendentes de restauração de estado criptografado quando o token de acesso do Matrix tiver mudado, mas a identidade da conta/dispositivo tiver permanecido a mesma
- restaurar chaves de sala com backup no novo armazenamento criptográfico na próxima inicialização do Matrix

Detalhes do snapshot:

- O OpenClaw grava um arquivo marcador em `~/.openclaw/matrix/migration-snapshot.json` após um snapshot bem-sucedido, para que passadas posteriores de inicialização e reparo possam reutilizar o mesmo arquivo.
- Esses snapshots automáticos de migração do Matrix fazem backup apenas de configuração + estado (`includeWorkspace: false`).
- Se o Matrix tiver apenas estado de migração com avisos, por exemplo porque `userId` ou `accessToken` ainda estiver ausente, o OpenClaw ainda não cria o snapshot porque nenhuma mutação do Matrix é acionável.
- Se a etapa de snapshot falhar, o OpenClaw pula a migração do Matrix nessa execução em vez de alterar o estado sem um ponto de recuperação.

Sobre atualizações com múltiplas contas:

- o armazenamento Matrix plano mais antigo (`~/.openclaw/matrix/bot-storage.json` e `~/.openclaw/matrix/crypto/`) veio de um layout de armazenamento único, então o OpenClaw só pode migrá-lo para um único destino de conta Matrix resolvido
- armazenamentos Matrix legados já com escopo por conta são detectados e preparados por conta Matrix configurada

## O que a migração não pode fazer automaticamente

O plugin público anterior do Matrix **não** criava automaticamente backups de chaves de sala do Matrix. Ele persistia o estado criptográfico local e solicitava verificação do dispositivo, mas não garantia que suas chaves de sala fossem salvas no homeserver.

Isso significa que algumas instalações criptografadas só podem ser migradas parcialmente.

O OpenClaw não pode recuperar automaticamente:

- chaves de sala somente locais que nunca foram salvas em backup
- estado criptografado quando a conta Matrix de destino ainda não pode ser resolvida porque `homeserver`, `userId` ou `accessToken` ainda não estão disponíveis
- migração automática de um armazenamento Matrix plano compartilhado quando várias contas Matrix estão configuradas, mas `channels.matrix.defaultAccount` não está definido
- instalações em caminho personalizado de plugin que estão fixadas em um caminho de repositório em vez do pacote Matrix padrão
- uma chave de recuperação ausente quando o armazenamento antigo tinha chaves salvas em backup, mas não manteve a chave de descriptografia localmente

Escopo atual dos avisos:

- instalações do plugin Matrix por caminho personalizado são sinalizadas tanto pela inicialização do Gateway quanto por `openclaw doctor`

Se sua instalação antiga tinha histórico criptografado somente local que nunca foi salvo em backup, algumas mensagens criptografadas mais antigas podem permanecer ilegíveis após a atualização.

## Fluxo de atualização recomendado

1. Atualize o OpenClaw e o plugin Matrix normalmente.
   Prefira `openclaw update` simples, sem `--no-restart`, para que a inicialização conclua a migração do Matrix imediatamente.
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

5. Se o OpenClaw informar que uma chave de recuperação é necessária, execute:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Se este dispositivo ainda não estiver verificado, execute:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   Se a chave de recuperação for aceita e o backup puder ser usado, mas `Cross-signing verified`
   ainda estiver como `no`, conclua a autoverificação a partir de outro cliente Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Aceite a solicitação em outro cliente Matrix, compare os emojis ou decimais
   e digite `yes` somente quando corresponderem. O comando só termina com sucesso
   depois que `Cross-signing verified` passar para `yes`.

7. Se você estiver abandonando intencionalmente um histórico antigo irrecuperável e quiser uma nova linha de base de backup para mensagens futuras, execute:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Se ainda não existir backup de chave no servidor, crie um para recuperações futuras:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Como a migração criptografada funciona

A migração criptografada é um processo de duas etapas:

1. A inicialização ou `openclaw doctor --fix` cria ou reutiliza o snapshot pré-migração se a migração criptografada for acionável.
2. A inicialização ou `openclaw doctor --fix` inspeciona o armazenamento criptográfico antigo do Matrix por meio da instalação ativa do plugin Matrix.
3. Se uma chave de descriptografia de backup for encontrada, o OpenClaw a grava no novo fluxo de chave de recuperação e marca a restauração de chaves de sala como pendente.
4. Na próxima inicialização do Matrix, o OpenClaw restaura automaticamente as chaves de sala salvas em backup no novo armazenamento criptográfico.

Se o armazenamento antigo relatar chaves de sala que nunca foram salvas em backup, o OpenClaw avisa em vez de fingir que a recuperação foi bem-sucedida.

## Mensagens comuns e o que significam

### Mensagens de atualização e detecção

`Matrix plugin upgraded in place.`

- Significado: o estado antigo do Matrix em disco foi detectado e migrado para o layout atual.
- O que fazer: nada, a menos que a mesma saída também inclua avisos.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significado: o OpenClaw criou um arquivo de recuperação antes de alterar o estado do Matrix.
- O que fazer: mantenha o caminho do arquivo impresso até confirmar que a migração foi concluída com sucesso.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significado: o OpenClaw encontrou um marcador de snapshot de migração Matrix existente e reutilizou esse arquivo em vez de criar um backup duplicado.
- O que fazer: mantenha o caminho do arquivo impresso até confirmar que a migração foi concluída com sucesso.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significado: existe um estado antigo do Matrix, mas o OpenClaw não consegue mapeá-lo para uma conta Matrix atual porque o Matrix não está configurado.
- O que fazer: configure `channels.matrix` e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: o OpenClaw encontrou estado antigo, mas ainda não consegue determinar a raiz exata atual da conta/dispositivo.
- O que fazer: inicie o Gateway uma vez com um login Matrix funcional ou execute novamente `openclaw doctor --fix` depois que as credenciais em cache existirem.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: o OpenClaw encontrou um armazenamento Matrix plano compartilhado, mas se recusa a adivinhar qual conta Matrix nomeada deve recebê-lo.
- O que fazer: defina `channels.matrix.defaultAccount` para a conta pretendida e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significado: o novo local com escopo por conta já tem um armazenamento de sincronização ou criptografia, então o OpenClaw não o sobrescreveu automaticamente.
- O que fazer: verifique se a conta atual é a correta antes de remover ou mover manualmente o destino conflitante.

`Failed migrating Matrix legacy sync store (...)` ou `Failed migrating Matrix legacy crypto store (...)`

- Significado: o OpenClaw tentou mover o estado antigo do Matrix, mas a operação no sistema de arquivos falhou.
- O que fazer: inspecione permissões do sistema de arquivos e o estado do disco, depois execute novamente `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significado: o OpenClaw encontrou um armazenamento Matrix criptografado antigo, mas não há configuração Matrix atual para associá-lo.
- O que fazer: configure `channels.matrix` e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: o armazenamento criptografado existe, mas o OpenClaw não consegue decidir com segurança a qual conta/dispositivo atual ele pertence.
- O que fazer: inicie o Gateway uma vez com um login Matrix funcional ou execute novamente `openclaw doctor --fix` depois que as credenciais em cache estiverem disponíveis.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: o OpenClaw encontrou um armazenamento criptográfico legado compartilhado, mas se recusa a adivinhar qual conta Matrix nomeada deve recebê-lo.
- O que fazer: defina `channels.matrix.defaultAccount` para a conta pretendida e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significado: o OpenClaw detectou estado antigo do Matrix, mas a migração ainda está bloqueada por falta de identidade ou dados de credenciais.
- O que fazer: conclua o login ou a configuração do Matrix e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significado: o OpenClaw encontrou um estado Matrix criptografado antigo, mas não conseguiu carregar o entrypoint auxiliar do plugin Matrix que normalmente inspeciona esse armazenamento.
- O que fazer: reinstale ou repare o plugin Matrix (`openclaw plugins install @openclaw/matrix`, ou `openclaw plugins install ./path/to/local/matrix-plugin` para um checkout do repositório), depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significado: o OpenClaw encontrou um caminho de arquivo auxiliar que escapa da raiz do plugin ou falha nas verificações de limite do plugin, então se recusou a importá-lo.
- O que fazer: reinstale o plugin Matrix a partir de um caminho confiável e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significado: o OpenClaw se recusou a alterar o estado do Matrix porque não conseguiu criar primeiro o snapshot de recuperação.
- O que fazer: resolva o erro de backup e depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significado: o fallback do lado do cliente Matrix encontrou armazenamento plano antigo, mas a movimentação falhou. O OpenClaw agora aborta esse fallback em vez de iniciar silenciosamente com um armazenamento novo.
- O que fazer: inspecione permissões ou conflitos no sistema de arquivos, mantenha o estado antigo intacto e tente novamente após corrigir o erro.

`Matrix is installed from a custom path: ...`

- Significado: o Matrix está fixado em uma instalação por caminho, então atualizações da linha principal não o substituem automaticamente pelo pacote Matrix padrão do repositório.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix` quando quiser voltar ao plugin Matrix padrão.

### Mensagens de recuperação de estado criptografado

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significado: chaves de sala salvas em backup foram restauradas com sucesso no novo armazenamento criptográfico.
- O que fazer: geralmente nada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significado: algumas chaves de sala antigas existiam apenas no armazenamento local antigo e nunca foram enviadas ao backup do Matrix.
- O que fazer: espere que parte do histórico criptografado antigo permaneça indisponível, a menos que você consiga recuperar essas chaves manualmente de outro cliente Matrix verificado.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Significado: o backup existe, mas o OpenClaw não conseguiu recuperar automaticamente a chave de recuperação.
- O que fazer: execute `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significado: o OpenClaw encontrou o armazenamento criptografado antigo, mas não conseguiu inspecioná-lo com segurança suficiente para preparar a recuperação.
- O que fazer: execute novamente `openclaw doctor --fix`. Se isso se repetir, mantenha intacto o diretório de estado antigo e recupere usando outro cliente Matrix verificado mais `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significado: o OpenClaw detectou um conflito de chave de backup e se recusou a sobrescrever automaticamente o arquivo atual de recovery key.
- O que fazer: verifique qual recovery key está correta antes de tentar novamente qualquer comando de restauração.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significado: este é o limite rígido do formato de armazenamento antigo.
- O que fazer: chaves salvas em backup ainda podem ser restauradas, mas o histórico criptografado somente local pode permanecer indisponível.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significado: o novo plugin tentou restaurar, mas o Matrix retornou um erro.
- O que fazer: execute `openclaw matrix verify backup status` e depois tente novamente com `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`, se necessário.

### Mensagens de recuperação manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significado: o OpenClaw sabe que você deveria ter uma backup key, mas ela não está ativa neste dispositivo.
- O que fazer: execute `openclaw matrix verify backup restore` ou passe `--recovery-key`, se necessário.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Significado: este dispositivo atualmente não tem a recovery key armazenada.
- O que fazer: primeiro verifique o dispositivo com sua recovery key e depois restaure o backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Significado: a chave armazenada não corresponde ao backup Matrix ativo.
- O que fazer: execute novamente `openclaw matrix verify device "<your-recovery-key>"` com a chave correta.

Se você aceitar perder o histórico criptografado antigo irrecuperável, em vez disso poderá redefinir a
linha de base do backup atual com `openclaw matrix verify backup reset --yes`. Quando o
segredo de backup armazenado estiver quebrado, essa redefinição também poderá recriar o armazenamento de segredo para que a
nova backup key possa ser carregada corretamente após a reinicialização.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Significado: o backup existe, mas este dispositivo ainda não confia com força suficiente na cadeia de cross-signing.
- O que fazer: execute novamente `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Significado: você tentou uma etapa de recuperação sem fornecer uma recovery key quando ela era obrigatória.
- O que fazer: execute novamente o comando com sua recovery key.

`Invalid Matrix recovery key: ...`

- Significado: a chave fornecida não pôde ser analisada ou não correspondia ao formato esperado.
- O que fazer: tente novamente com a recovery key exata do seu cliente Matrix ou do arquivo de recovery key.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significado: o OpenClaw conseguiu aplicar a recovery key, mas o Matrix ainda não
  estabeleceu confiança total de identidade de cross-signing para este dispositivo. Verifique a
  saída do comando para `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` e `Device verified by owner`.
- O que fazer: execute `openclaw matrix verify self`, aceite a solicitação em outro
  cliente Matrix, compare o SAS e digite `yes` somente quando corresponder. O
  comando aguarda confiança total na identidade Matrix antes de informar sucesso. Use
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  somente quando você realmente quiser substituir a identidade de cross-signing atual.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significado: o armazenamento de segredo não produziu uma sessão de backup ativa neste dispositivo.
- O que fazer: primeiro verifique o dispositivo e depois confira novamente com `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Significado: este dispositivo não pode restaurar do armazenamento de segredo até que a verificação do dispositivo seja concluída.
- O que fazer: primeiro execute `openclaw matrix verify device "<your-recovery-key>"`.

### Mensagens de instalação de plugin personalizado

`Matrix is installed from a custom path that no longer exists: ...`

- Significado: o registro de instalação do plugin aponta para um caminho local que não existe mais.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix` ou, se estiver executando a partir de um checkout do repositório, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Se o histórico criptografado ainda não voltar

Execute estas verificações em ordem:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Se o backup for restaurado com sucesso, mas algumas salas antigas ainda estiverem sem histórico, essas chaves ausentes provavelmente nunca foram salvas em backup pelo plugin anterior.

## Se você quiser recomeçar para mensagens futuras

Se você aceitar perder o histórico criptografado antigo irrecuperável e quiser apenas uma linha de base de backup limpa daqui para frente, execute estes comandos em ordem:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se o dispositivo ainda não estiver verificado depois disso, conclua a verificação no seu cliente Matrix comparando os emojis SAS ou os códigos decimais e confirmando que eles correspondem.

## Páginas relacionadas

- [Matrix](/pt-BR/channels/matrix)
- [Doctor](/pt-BR/gateway/doctor)
- [Migrating](/pt-BR/install/migrating)
- [Plugins](/pt-BR/tools/plugin)
