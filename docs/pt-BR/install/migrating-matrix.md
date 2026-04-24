---
read_when:
    - Atualizando uma instalação existente do Matrix
    - Migrando histórico criptografado do Matrix e estado do dispositivo
summary: Como o OpenClaw atualiza o Plugin Matrix anterior no local, incluindo limites de recuperação de estado criptografado e etapas de recuperação manual.
title: Migração do Matrix
x-i18n:
    generated_at: "2026-04-24T05:58:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e8210f5fbe476148736417eec29dfb5e27c132c6a0bb80753ce254129c14da4f
    source_path: install/migrating-matrix.md
    workflow: 15
---

Esta página cobre atualizações do Plugin público anterior `matrix` para a implementação atual.

Para a maioria dos usuários, a atualização ocorre no local:

- o Plugin continua sendo `@openclaw/matrix`
- o canal continua sendo `matrix`
- sua configuração continua em `channels.matrix`
- credenciais em cache continuam em `~/.openclaw/credentials/matrix/`
- o estado de runtime continua em `~/.openclaw/matrix/`

Você não precisa renomear chaves de configuração nem reinstalar o Plugin com outro nome.

## O que a migração faz automaticamente

Quando o gateway inicia, e quando você executa [`openclaw doctor --fix`](/pt-BR/gateway/doctor), o OpenClaw tenta reparar automaticamente o estado antigo do Matrix.
Antes que qualquer etapa acionável de migração do Matrix altere o estado em disco, o OpenClaw cria ou reutiliza um snapshot de recuperação focado.

Quando você usa `openclaw update`, o gatilho exato depende de como o OpenClaw está instalado:

- instalações a partir do código-fonte executam `openclaw doctor --fix` durante o fluxo de atualização e depois reiniciam o gateway por padrão
- instalações via gerenciador de pacotes atualizam o pacote, executam uma passagem não interativa do doctor e então dependem do reinício padrão do gateway para que a inicialização conclua a migração do Matrix
- se você usar `openclaw update --no-restart`, a migração do Matrix baseada na inicialização é adiada até que você execute depois `openclaw doctor --fix` e reinicie o gateway

A migração automática cobre:

- criar ou reutilizar um snapshot pré-migração em `~/Backups/openclaw-migrations/`
- reutilizar suas credenciais do Matrix em cache
- manter a mesma seleção de conta e a configuração `channels.matrix`
- mover o armazenamento flat de sync do Matrix mais antigo para o local atual com escopo de conta
- mover o armazenamento flat de criptografia do Matrix mais antigo para o local atual com escopo de conta quando a conta de destino puder ser resolvida com segurança
- extrair uma chave de descriptografia de backup de chave de sala do Matrix salva anteriormente do armazenamento de criptografia rust antigo, quando essa chave existir localmente
- reutilizar a raiz de armazenamento de hash de token existente mais completa para a mesma conta Matrix, homeserver e usuário quando o token de acesso mudar depois
- verificar raízes irmãs de armazenamento de hash de token em busca de metadados pendentes de restauração de estado criptografado quando o token de acesso do Matrix mudou, mas a identidade da conta/dispositivo permaneceu a mesma
- restaurar chaves de sala em backup no novo armazenamento de criptografia na próxima inicialização do Matrix

Detalhes do snapshot:

- O OpenClaw grava um arquivo marcador em `~/.openclaw/matrix/migration-snapshot.json` após um snapshot bem-sucedido para que passagens posteriores de inicialização e reparo possam reutilizar o mesmo arquivo.
- Esses snapshots automáticos de migração do Matrix fazem backup apenas de configuração + estado (`includeWorkspace: false`).
- Se o Matrix tiver apenas estado de migração com avisos, por exemplo porque `userId` ou `accessToken` ainda estão ausentes, o OpenClaw ainda não cria o snapshot porque nenhuma mutação do Matrix é acionável.
- Se a etapa de snapshot falhar, o OpenClaw ignora a migração do Matrix nessa execução em vez de alterar o estado sem um ponto de recuperação.

Sobre atualizações com várias contas:

- o armazenamento flat do Matrix mais antigo (`~/.openclaw/matrix/bot-storage.json` e `~/.openclaw/matrix/crypto/`) veio de um layout de armazenamento único, então o OpenClaw só pode migrá-lo para um destino de conta Matrix resolvido
- armazenamentos legados do Matrix já com escopo de conta são detectados e preparados por conta Matrix configurada

## O que a migração não consegue fazer automaticamente

O Plugin público anterior do Matrix **não** criava automaticamente backups de chaves de sala do Matrix. Ele persistia o estado local de criptografia e solicitava verificação do dispositivo, mas não garantia que suas chaves de sala fossem salvas no homeserver.

Isso significa que algumas instalações criptografadas só podem ser migradas parcialmente.

O OpenClaw não consegue recuperar automaticamente:

- chaves de sala apenas locais que nunca foram salvas em backup
- estado criptografado quando a conta Matrix de destino ainda não pode ser resolvida porque `homeserver`, `userId` ou `accessToken` ainda não estão disponíveis
- migração automática de um armazenamento flat compartilhado do Matrix quando várias contas Matrix estão configuradas, mas `channels.matrix.defaultAccount` não está definido
- instalações de caminho personalizado do Plugin fixadas em um caminho do repositório em vez do pacote Matrix padrão
- uma chave de recuperação ausente quando o armazenamento antigo tinha chaves com backup, mas não mantinha a chave de descriptografia localmente

Escopo atual dos avisos:

- instalações do Matrix com caminho personalizado do Plugin são exibidas tanto na inicialização do gateway quanto em `openclaw doctor`

Se sua instalação antiga tinha histórico criptografado apenas local que nunca foi salvo em backup, algumas mensagens criptografadas antigas podem continuar ilegíveis após a atualização.

## Fluxo de atualização recomendado

1. Atualize o OpenClaw e o Plugin Matrix normalmente.
   Prefira `openclaw update` simples sem `--no-restart`, para que a inicialização possa concluir imediatamente a migração do Matrix.
2. Execute:

   ```bash
   openclaw doctor --fix
   ```

   Se o Matrix tiver trabalho acionável de migração, o doctor criará ou reutilizará primeiro o snapshot pré-migração e imprimirá o caminho do arquivo.

3. Inicie ou reinicie o gateway.
4. Verifique o estado atual de verificação e backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Se o OpenClaw disser que uma chave de recuperação é necessária, execute:

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Se este dispositivo ainda não estiver verificado, execute:

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. Se você estiver abandonando intencionalmente um histórico antigo irrecuperável e quiser uma linha de base nova de backup para mensagens futuras, execute:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Se ainda não existir um backup de chave no lado do servidor, crie um para recuperações futuras:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Como a migração criptografada funciona

A migração criptografada é um processo em duas etapas:

1. A inicialização ou `openclaw doctor --fix` cria ou reutiliza o snapshot pré-migração se a migração criptografada for acionável.
2. A inicialização ou `openclaw doctor --fix` inspeciona o armazenamento antigo de criptografia do Matrix por meio da instalação ativa do Plugin Matrix.
3. Se uma chave de descriptografia de backup for encontrada, o OpenClaw a grava no novo fluxo de chave de recuperação e marca a restauração de chave de sala como pendente.
4. Na próxima inicialização do Matrix, o OpenClaw restaura automaticamente as chaves de sala salvas em backup no novo armazenamento de criptografia.

Se o armazenamento antigo informar chaves de sala que nunca foram salvas em backup, o OpenClaw emite um aviso em vez de fingir que a recuperação foi bem-sucedida.

## Mensagens comuns e o que significam

### Mensagens de atualização e detecção

`Matrix plugin upgraded in place.`

- Significado: o estado antigo do Matrix em disco foi detectado e migrado para o layout atual.
- O que fazer: nada, a menos que a mesma saída também inclua avisos.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significado: o OpenClaw criou um arquivo de recuperação antes de alterar o estado do Matrix.
- O que fazer: mantenha o caminho do arquivo impresso até confirmar que a migração foi bem-sucedida.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significado: o OpenClaw encontrou um marcador existente de snapshot de migração do Matrix e reutilizou esse arquivo em vez de criar um backup duplicado.
- O que fazer: mantenha o caminho do arquivo impresso até confirmar que a migração foi bem-sucedida.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significado: existe estado antigo do Matrix, mas o OpenClaw não consegue mapeá-lo para uma conta Matrix atual porque o Matrix não está configurado.
- O que fazer: configure `channels.matrix` e depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: o OpenClaw encontrou estado antigo, mas ainda não consegue determinar a raiz exata atual de conta/dispositivo.
- O que fazer: inicie o gateway uma vez com um login Matrix funcional ou execute novamente `openclaw doctor --fix` depois que existirem credenciais em cache.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: o OpenClaw encontrou um armazenamento flat compartilhado do Matrix, mas se recusa a adivinhar qual conta Matrix nomeada deve recebê-lo.
- O que fazer: defina `channels.matrix.defaultAccount` para a conta pretendida e depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significado: o local novo com escopo de conta já tem um armazenamento de sync ou criptografia, então o OpenClaw não o sobrescreveu automaticamente.
- O que fazer: verifique se a conta atual é a correta antes de remover ou mover manualmente o alvo conflitante.

`Failed migrating Matrix legacy sync store (...)` ou `Failed migrating Matrix legacy crypto store (...)`

- Significado: o OpenClaw tentou mover o estado antigo do Matrix, mas a operação de sistema de arquivos falhou.
- O que fazer: inspecione permissões do sistema de arquivos e o estado do disco, depois execute novamente `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significado: o OpenClaw encontrou um armazenamento criptografado antigo do Matrix, mas não há configuração atual de Matrix para associá-lo.
- O que fazer: configure `channels.matrix` e depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: o armazenamento criptografado existe, mas o OpenClaw não consegue decidir com segurança a qual conta/dispositivo atual ele pertence.
- O que fazer: inicie o gateway uma vez com um login Matrix funcional ou execute novamente `openclaw doctor --fix` depois que credenciais em cache estiverem disponíveis.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: o OpenClaw encontrou um armazenamento legado flat compartilhado de criptografia, mas se recusa a adivinhar qual conta Matrix nomeada deve recebê-lo.
- O que fazer: defina `channels.matrix.defaultAccount` para a conta pretendida e depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significado: o OpenClaw detectou estado antigo do Matrix, mas a migração ainda está bloqueada pela ausência de dados de identidade ou credenciais.
- O que fazer: conclua o login ou a configuração do Matrix e depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significado: o OpenClaw encontrou estado criptografado antigo do Matrix, mas não conseguiu carregar o entrypoint helper do Plugin Matrix que normalmente inspeciona esse armazenamento.
- O que fazer: reinstale ou repare o Plugin Matrix (`openclaw plugins install @openclaw/matrix`, ou `openclaw plugins install ./path/to/local/matrix-plugin` para um checkout do repositório), depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significado: o OpenClaw encontrou um caminho de arquivo helper que escapa da raiz do Plugin ou falha nas verificações de limite do Plugin, então se recusou a importá-lo.
- O que fazer: reinstale o Plugin Matrix a partir de um caminho confiável e depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significado: o OpenClaw se recusou a alterar o estado do Matrix porque não conseguiu criar primeiro o snapshot de recuperação.
- O que fazer: resolva o erro de backup e depois execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significado: o fallback do lado do cliente do Matrix encontrou armazenamento flat antigo, mas a movimentação falhou. O OpenClaw agora aborta esse fallback em vez de iniciar silenciosamente com um armazenamento novo.
- O que fazer: inspecione permissões ou conflitos do sistema de arquivos, mantenha o estado antigo intacto e tente novamente após corrigir o erro.

`Matrix is installed from a custom path: ...`

- Significado: o Matrix está fixado em uma instalação por caminho, então atualizações da linha principal não o substituem automaticamente pelo pacote Matrix padrão do repositório.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix` quando quiser voltar ao Plugin Matrix padrão.

### Mensagens de recuperação de estado criptografado

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significado: chaves de sala em backup foram restauradas com sucesso no novo armazenamento de criptografia.
- O que fazer: normalmente nada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significado: algumas chaves de sala antigas existiam apenas no armazenamento local antigo e nunca tinham sido enviadas ao backup do Matrix.
- O que fazer: espere que algum histórico criptografado antigo continue indisponível, a menos que você consiga recuperar essas chaves manualmente de outro cliente Matrix verificado.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Significado: o backup existe, mas o OpenClaw não conseguiu recuperar automaticamente a chave de recuperação.
- O que fazer: execute `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significado: o OpenClaw encontrou o armazenamento criptografado antigo, mas não conseguiu inspecioná-lo com segurança suficiente para preparar a recuperação.
- O que fazer: execute novamente `openclaw doctor --fix`. Se isso se repetir, mantenha intacto o diretório de estado antigo e recupere usando outro cliente Matrix verificado mais `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significado: o OpenClaw detectou um conflito de chave de backup e se recusou a sobrescrever automaticamente o arquivo atual de chave de recuperação.
- O que fazer: verifique qual chave de recuperação está correta antes de tentar novamente qualquer comando de restauração.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significado: esse é o limite rígido do formato antigo de armazenamento.
- O que fazer: chaves em backup ainda podem ser restauradas, mas o histórico criptografado apenas local pode continuar indisponível.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Significado: o novo Plugin tentou restaurar, mas o Matrix retornou um erro.
- O que fazer: execute `openclaw matrix verify backup status` e depois tente novamente com `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` se necessário.

### Mensagens de recuperação manual

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Significado: o OpenClaw sabe que você deveria ter uma chave de backup, mas ela não está ativa neste dispositivo.
- O que fazer: execute `openclaw matrix verify backup restore` ou passe `--recovery-key` se necessário.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Significado: este dispositivo atualmente não tem a chave de recuperação armazenada.
- O que fazer: verifique o dispositivo com sua chave de recuperação primeiro, depois restaure o backup.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Significado: a chave armazenada não corresponde ao backup Matrix ativo.
- O que fazer: execute novamente `openclaw matrix verify device "<your-recovery-key>"` com a chave correta.

Se você aceitar perder o histórico criptografado antigo irrecuperável, pode em vez disso redefinir a
linha de base atual do backup com `openclaw matrix verify backup reset --yes`. Quando o
segredo de backup armazenado está corrompido, essa redefinição também pode recriar o armazenamento secreto para que a
nova chave de backup seja carregada corretamente após a reinicialização.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Significado: o backup existe, mas este dispositivo ainda não confia suficientemente na cadeia de cross-signing.
- O que fazer: execute novamente `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Significado: você tentou uma etapa de recuperação sem fornecer uma chave de recuperação quando ela era necessária.
- O que fazer: execute novamente o comando com sua chave de recuperação.

`Invalid Matrix recovery key: ...`

- Significado: a chave fornecida não pôde ser analisada ou não correspondia ao formato esperado.
- O que fazer: tente novamente com a chave de recuperação exata do seu cliente Matrix ou do arquivo de chave de recuperação.

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- Significado: a chave foi aplicada, mas o dispositivo ainda não conseguiu concluir a verificação.
- O que fazer: confirme que você usou a chave correta e que o cross-signing está disponível na conta, depois tente novamente.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significado: o armazenamento secreto não produziu uma sessão de backup ativa neste dispositivo.
- O que fazer: verifique o dispositivo primeiro e depois confira novamente com `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Significado: este dispositivo não pode restaurar a partir do armazenamento secreto até que a verificação do dispositivo seja concluída.
- O que fazer: execute primeiro `openclaw matrix verify device "<your-recovery-key>"`.

### Mensagens de instalação de Plugin personalizado

`Matrix is installed from a custom path that no longer exists: ...`

- Significado: seu registro de instalação do Plugin aponta para um caminho local que não existe mais.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix` ou, se estiver executando a partir de um checkout do repositório, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Se o histórico criptografado ainda não voltar

Execute estas verificações nesta ordem:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Se o backup for restaurado com sucesso, mas alguns ambientes antigos ainda estiverem sem histórico, essas chaves ausentes provavelmente nunca foram salvas em backup pelo Plugin anterior.

## Se você quiser começar do zero para mensagens futuras

Se você aceitar perder histórico criptografado antigo irrecuperável e só quiser uma linha de base limpa de backup daqui para frente, execute estes comandos nesta ordem:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se o dispositivo ainda não estiver verificado depois disso, conclua a verificação a partir do seu cliente Matrix comparando os emojis SAS ou códigos decimais e confirmando que eles correspondem.

## Páginas relacionadas

- [Matrix](/pt-BR/channels/matrix)
- [Doctor](/pt-BR/gateway/doctor)
- [Migrating](/pt-BR/install/migrating)
- [Plugins](/pt-BR/tools/plugin)
