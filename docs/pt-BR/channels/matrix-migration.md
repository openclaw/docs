---
read_when:
    - Atualizando uma instalação existente do Matrix
    - Migrando histórico criptografado do Matrix e estado do dispositivo
summary: Como o OpenClaw atualiza o Plugin Matrix anterior no local, incluindo limites de recuperação de estado criptografado e etapas de recuperação manual.
title: Migração do Matrix
x-i18n:
    generated_at: "2026-06-27T17:11:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 796d27aa3f08388b78e005d5e93ee4a04bc9ae9bb1f214b83c3ba19165042755
    source_path: channels/matrix-migration.md
    workflow: 16
---

Atualize do Plugin público anterior `matrix` para a implementação atual.

Para a maioria dos usuários, a atualização é feita no local:

- o Plugin continua sendo `@openclaw/matrix`
- o canal continua sendo `matrix`
- sua configuração continua em `channels.matrix`
- as credenciais em cache continuam em `~/.openclaw/credentials/matrix/`
- o estado de runtime continua em `~/.openclaw/matrix/`

Você não precisa renomear chaves de configuração nem reinstalar o Plugin com um novo nome.
O pacote raiz `openclaw` não inclui mais o código de runtime do Matrix nem as
dependências do SDK do Matrix. Se `openclaw channels status` mostrar que o Matrix está configurado, mas o
Plugin estiver ausente depois de uma atualização, execute `openclaw doctor --fix` ou
`openclaw plugins install @openclaw/matrix`; não instale pacotes do SDK do Matrix
no pacote raiz do OpenClaw.

## O que a migração faz automaticamente

Quando o gateway inicia, e quando você executa [`openclaw doctor --fix`](/pt-BR/gateway/doctor), o OpenClaw tenta reparar automaticamente o estado antigo do Matrix.
Antes que qualquer etapa acionável de migração do Matrix modifique o estado em disco, o OpenClaw cria ou reutiliza um snapshot de recuperação focado.

Quando você usa `openclaw update`, o gatilho exato depende de como o OpenClaw está instalado:

- instalações a partir do código-fonte executam `openclaw doctor --fix` durante o fluxo de atualização e, depois, reiniciam o gateway por padrão
- instalações por gerenciador de pacotes atualizam o pacote, executam uma passagem não interativa do doctor e, depois, dependem da reinicialização padrão do gateway para que a inicialização possa concluir a migração do Matrix
- se você usa `openclaw update --no-restart`, a migração do Matrix apoiada pela inicialização é adiada até você executar `openclaw doctor --fix` posteriormente e reiniciar o gateway

A migração automática cobre:

- criar ou reutilizar um snapshot de pré-migração em `~/Backups/openclaw-migrations/`
- reutilizar suas credenciais do Matrix em cache
- manter a mesma seleção de conta e a configuração `channels.matrix`
- mover o armazenamento de sincronização plano mais antigo do Matrix para o local atual com escopo por conta
- mover o armazenamento de criptografia plano mais antigo do Matrix para o local atual com escopo por conta quando a conta de destino pode ser resolvida com segurança
- extrair uma chave de descriptografia de backup de chaves de sala do Matrix salva anteriormente do armazenamento antigo de criptografia rust, quando essa chave existe localmente
- reutilizar a raiz de armazenamento de hash de token existente mais completa para a mesma conta, homeserver e usuário do Matrix quando o token de acesso mudar posteriormente
- verificar raízes irmãs de armazenamento de hash de token em busca de metadados pendentes de restauração de estado criptografado quando o token de acesso do Matrix mudou, mas a identidade da conta/dispositivo permaneceu a mesma
- restaurar chaves de sala em backup no novo armazenamento de criptografia na próxima inicialização do Matrix

Detalhes do snapshot:

- O OpenClaw grava um arquivo marcador em `~/.openclaw/matrix/migration-snapshot.json` depois de um snapshot bem-sucedido para que passagens posteriores de inicialização e reparo possam reutilizar o mesmo arquivo.
- Esses snapshots automáticos de migração do Matrix fazem backup apenas de configuração + estado (`includeWorkspace: false`).
- Se o Matrix tiver apenas estado de migração somente de aviso, por exemplo porque `userId` ou `accessToken` ainda está ausente, o OpenClaw ainda não cria o snapshot porque nenhuma mutação do Matrix é acionável.
- Se a etapa de snapshot falhar, o OpenClaw ignora a migração do Matrix nessa execução em vez de modificar o estado sem um ponto de recuperação.

Sobre atualizações de múltiplas contas:

- o armazenamento plano mais antigo do Matrix (`~/.openclaw/matrix/bot-storage.json` e `~/.openclaw/matrix/crypto/`) veio de um layout de armazenamento único, então o OpenClaw só pode migrá-lo para um destino resolvido de uma conta do Matrix
- armazenamentos legados do Matrix que já têm escopo por conta são detectados e preparados por conta do Matrix configurada

## O que a migração não consegue fazer automaticamente

O Plugin público anterior do Matrix **não** criava backups de chaves de sala do Matrix automaticamente. Ele persistia o estado local de criptografia e solicitava verificação do dispositivo, mas não garantia que suas chaves de sala fossem copiadas para o homeserver.

Isso significa que algumas instalações criptografadas só podem ser migradas parcialmente.

O OpenClaw não consegue recuperar automaticamente:

- chaves de sala somente locais que nunca tiveram backup
- estado criptografado quando a conta de destino do Matrix ainda não pode ser resolvida porque `homeserver`, `userId` ou `accessToken` ainda não estão disponíveis
- migração automática de um armazenamento plano compartilhado do Matrix quando múltiplas contas do Matrix estão configuradas, mas `channels.matrix.defaultAccount` não está definido
- instalações por caminho de Plugin personalizado que estão fixadas em um caminho de repositório em vez do pacote padrão do Matrix
- uma chave de recuperação ausente quando o armazenamento antigo tinha chaves em backup, mas não mantinha a chave de descriptografia localmente

Escopo atual dos avisos:

- instalações por caminho de Plugin personalizado do Matrix são exibidas tanto pela inicialização do gateway quanto por `openclaw doctor`

Se sua instalação antiga tinha histórico criptografado somente local que nunca teve backup, algumas mensagens criptografadas mais antigas podem permanecer ilegíveis após a atualização.

## Fluxo de atualização recomendado

1. Atualize o OpenClaw e o Plugin do Matrix normalmente.
   Prefira `openclaw update` simples, sem `--no-restart`, para que a inicialização possa concluir imediatamente a migração do Matrix.
2. Execute:

   ```bash
   openclaw doctor --fix
   ```

   Se o Matrix tiver trabalho de migração acionável, o doctor criará ou reutilizará primeiro o snapshot de pré-migração e imprimirá o caminho do arquivo.

3. Inicie ou reinicie o gateway.
4. Verifique o estado atual de verificação e backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Coloque a chave de recuperação da conta do Matrix que você está reparando em uma variável de ambiente específica da conta. Para uma única conta padrão, `MATRIX_RECOVERY_KEY` é suficiente. Para múltiplas contas, use uma variável por conta, por exemplo `MATRIX_RECOVERY_KEY_ASSISTANT`, e adicione `--account assistant` ao comando.

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

   Se a chave de recuperação for aceita e o backup estiver utilizável, mas `Cross-signing verified`
   ainda for `no`, conclua a autoverificação em outro cliente Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Aceite a solicitação em outro cliente Matrix, compare os emojis ou decimais
   e digite `yes` somente quando eles corresponderem. O comando sai com sucesso somente
   depois que `Cross-signing verified` se torna `yes`.

8. Se você estiver abandonando intencionalmente o histórico antigo irrecuperável e quiser uma nova linha de base de backup para mensagens futuras, execute:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. Se ainda não existir backup de chaves no lado do servidor, crie um para recuperações futuras:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Como a migração criptografada funciona

A migração criptografada é um processo em duas etapas:

1. A inicialização ou `openclaw doctor --fix` cria ou reutiliza o snapshot de pré-migração se a migração criptografada for acionável.
2. A inicialização ou `openclaw doctor --fix` inspeciona o armazenamento antigo de criptografia do Matrix por meio da instalação ativa do Plugin do Matrix.
3. Se uma chave de descriptografia de backup for encontrada, o OpenClaw a grava no novo fluxo de chave de recuperação e marca a restauração de chaves de sala como pendente.
4. Na próxima inicialização do Matrix, o OpenClaw restaura automaticamente as chaves de sala em backup no novo armazenamento de criptografia.

Se o armazenamento antigo relatar chaves de sala que nunca tiveram backup, o OpenClaw avisa em vez de fingir que a recuperação foi bem-sucedida.

## Mensagens comuns e o que elas significam

### Mensagens de atualização e detecção

`Matrix plugin upgraded in place.`

- Significado: o estado antigo em disco do Matrix foi detectado e migrado para o layout atual.
- O que fazer: nada, a menos que a mesma saída também inclua avisos.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Significado: o OpenClaw criou um arquivo de recuperação antes de modificar o estado do Matrix.
- O que fazer: mantenha o caminho do arquivo impresso até confirmar que a migração foi bem-sucedida.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Significado: o OpenClaw encontrou um marcador de snapshot de migração do Matrix existente e reutilizou esse arquivo em vez de criar um backup duplicado.
- O que fazer: mantenha o caminho do arquivo impresso até confirmar que a migração foi bem-sucedida.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Significado: existe estado antigo do Matrix, mas o OpenClaw não consegue mapeá-lo para uma conta atual do Matrix porque o Matrix não está configurado.
- O que fazer: configure `channels.matrix` e, depois, execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: o OpenClaw encontrou estado antigo, mas ainda não consegue determinar a raiz exata da conta/dispositivo atual.
- O que fazer: inicie o gateway uma vez com um login funcional do Matrix ou execute novamente `openclaw doctor --fix` depois que existirem credenciais em cache.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: o OpenClaw encontrou um armazenamento plano compartilhado do Matrix, mas se recusa a adivinhar qual conta nomeada do Matrix deve recebê-lo.
- O que fazer: defina `channels.matrix.defaultAccount` para a conta pretendida e, depois, execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Significado: o novo local com escopo por conta já tem um armazenamento de sincronização ou criptografia, então o OpenClaw não o sobrescreveu automaticamente.
- O que fazer: verifique se a conta atual é a correta antes de remover ou mover manualmente o destino conflitante.

`Failed migrating Matrix legacy sync store (...)` ou `Failed migrating Matrix legacy crypto store (...)`

- Significado: o OpenClaw tentou mover o estado antigo do Matrix, mas a operação no sistema de arquivos falhou.
- O que fazer: inspecione permissões do sistema de arquivos e o estado do disco e, depois, execute novamente `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Significado: o OpenClaw encontrou um armazenamento criptografado antigo do Matrix, mas não há configuração atual do Matrix à qual anexá-lo.
- O que fazer: configure `channels.matrix` e, depois, execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Significado: o armazenamento criptografado existe, mas o OpenClaw não consegue decidir com segurança a qual conta/dispositivo atual ele pertence.
- O que fazer: inicie o gateway uma vez com um login funcional do Matrix ou execute novamente `openclaw doctor --fix` depois que as credenciais em cache estiverem disponíveis.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Significado: o OpenClaw encontrou um armazenamento criptográfico legado plano compartilhado, mas se recusa a adivinhar qual conta nomeada do Matrix deve recebê-lo.
- O que fazer: defina `channels.matrix.defaultAccount` para a conta pretendida e, depois, execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Significado: o OpenClaw detectou estado antigo do Matrix, mas a migração ainda está bloqueada por dados de identidade ou credenciais ausentes.
- O que fazer: conclua o login do Matrix ou a configuração e, depois, execute novamente `openclaw doctor --fix` ou reinicie o gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Significado: o OpenClaw encontrou um estado Matrix criptografado antigo, mas não conseguiu carregar o ponto de entrada auxiliar do plugin Matrix que normalmente inspeciona esse armazenamento.
- O que fazer: reinstale ou repare o plugin Matrix (`openclaw plugins install @openclaw/matrix`, ou `openclaw plugins install ./path/to/local/matrix-plugin` para um checkout do repositório), depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Significado: o OpenClaw encontrou um caminho de arquivo auxiliar que escapa da raiz do plugin ou falha nas verificações de limite do plugin, então recusou importá-lo.
- O que fazer: reinstale o plugin Matrix a partir de um caminho confiável, depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Significado: o OpenClaw recusou alterar o estado Matrix porque não conseguiu criar primeiro o snapshot de recuperação.
- O que fazer: resolva o erro de backup, depois execute novamente `openclaw doctor --fix` ou reinicie o Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Significado: o fallback do lado do cliente Matrix encontrou armazenamento plano antigo, mas a movimentação falhou. Agora o OpenClaw aborta esse fallback em vez de iniciar silenciosamente com um armazenamento novo.
- O que fazer: inspecione permissões do sistema de arquivos ou conflitos, mantenha o estado antigo intacto e tente novamente depois de corrigir o erro.

`Matrix is installed from a custom path: ...`

- Significado: o Matrix está fixado em uma instalação por caminho, então atualizações da linha principal não o substituem automaticamente pelo pacote Matrix padrão do repositório.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix` quando quiser voltar ao plugin Matrix padrão.

### Mensagens de recuperação de estado criptografado

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Significado: as chaves de sala do backup foram restauradas com sucesso no novo armazenamento criptográfico.
- O que fazer: geralmente nada.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Significado: algumas chaves de sala antigas existiam apenas no armazenamento local antigo e nunca tinham sido enviadas ao backup do Matrix.
- O que fazer: espere que parte do histórico criptografado antigo permaneça indisponível, a menos que você consiga recuperar essas chaves manualmente a partir de outro cliente verificado.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- Significado: o backup existe, mas o OpenClaw não conseguiu recuperar automaticamente a chave de recuperação.
- O que fazer: execute `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Significado: o OpenClaw encontrou o armazenamento criptografado antigo, mas não conseguiu inspecioná-lo com segurança suficiente para preparar a recuperação.
- O que fazer: execute novamente `openclaw doctor --fix`. Se o problema se repetir, mantenha o diretório de estado antigo intacto e recupere usando outro cliente Matrix verificado mais `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Significado: o OpenClaw detectou um conflito de chave de backup e recusou sobrescrever automaticamente o arquivo de chave de recuperação atual.
- O que fazer: verifique qual chave de recuperação está correta antes de tentar novamente qualquer comando de restauração.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Significado: este é o limite rígido do formato de armazenamento antigo.
- O que fazer: as chaves em backup ainda podem ser restauradas, mas o histórico criptografado apenas local pode permanecer indisponível.

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

Se você aceitar perder o histórico criptografado antigo irrecuperável, pode em vez disso redefinir a
linha de base do backup atual com `openclaw matrix verify backup reset --yes`. Quando o
segredo de backup armazenado estiver corrompido, essa redefinição também pode recriar o armazenamento secreto para que a
nova chave de backup possa carregar corretamente depois da reinicialização.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- Significado: o backup existe, mas este dispositivo ainda não confia suficientemente na cadeia de assinatura cruzada.
- O que fazer: defina `MATRIX_RECOVERY_KEY` e execute `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Matrix recovery key is required`

- Significado: você tentou uma etapa de recuperação sem fornecer uma chave de recuperação quando ela era obrigatória.
- O que fazer: execute novamente o comando com `--recovery-key-stdin`, por exemplo `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significado: a chave fornecida não pôde ser analisada ou não correspondia ao formato esperado.
- O que fazer: tente novamente com a chave de recuperação exata do seu cliente Matrix ou do arquivo de chave de recuperação.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significado: o OpenClaw conseguiu aplicar a chave de recuperação, mas o Matrix ainda não
  estabeleceu confiança completa de identidade por assinatura cruzada para este dispositivo. Verifique a
  saída do comando para `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` e `Device verified by owner`.
- O que fazer: execute `openclaw matrix verify self`, aceite a solicitação em outro
  cliente Matrix, compare o SAS e digite `yes` somente quando corresponder. O
  comando aguarda confiança completa da identidade Matrix antes de relatar sucesso. Use
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`
  somente quando você quiser intencionalmente substituir a identidade de assinatura cruzada atual.

`Matrix key backup is not active on this device after loading from secret storage.`

- Significado: o armazenamento secreto não produziu uma sessão de backup ativa neste dispositivo.
- O que fazer: verifique primeiro o dispositivo, depois confira novamente com `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- Significado: este dispositivo não consegue restaurar a partir do armazenamento secreto até que a verificação do dispositivo seja concluída.
- O que fazer: execute primeiro `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

### Mensagens de instalação de plugin personalizado

`Matrix is installed from a custom path that no longer exists: ...`

- Significado: o registro de instalação do seu plugin aponta para um caminho local que não existe mais.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix`, ou, se você estiver executando a partir de um checkout do repositório, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Se o histórico criptografado ainda não voltar

Execute estas verificações em ordem:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Se o backup for restaurado com sucesso, mas algumas salas antigas ainda estiverem sem histórico, essas chaves ausentes provavelmente nunca foram salvas em backup pelo plugin anterior.

## Se você quiser começar do zero para mensagens futuras

Se você aceitar perder o histórico criptografado antigo irrecuperável e quiser apenas uma linha de base de backup limpa daqui para frente, execute estes comandos em ordem:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se o dispositivo ainda não estiver verificado depois disso, conclua a verificação a partir do seu cliente Matrix comparando os emojis SAS ou códigos decimais e confirmando que eles correspondem.

## Relacionado

- [Matrix](/pt-BR/channels/matrix): configuração e setup do canal.
- [Regras push do Matrix](/pt-BR/channels/matrix-push-rules): roteamento de notificações.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade e gatilho de migração automática.
- [Guia de migração](/pt-BR/install/migrating): todos os caminhos de migração (mudanças de máquina, importações entre sistemas).
- [Plugins](/pt-BR/tools/plugin): instalação e registro de plugins.
