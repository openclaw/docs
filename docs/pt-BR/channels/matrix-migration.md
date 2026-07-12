---
read_when:
    - Atualização de uma instalação existente do Matrix
    - Migrando o histórico criptografado do Matrix e o estado do dispositivo
summary: Como o OpenClaw atualiza o Plugin anterior do Matrix no local, incluindo os limites de recuperação do estado criptografado e as etapas de recuperação manual.
title: Migração do Matrix
x-i18n:
    generated_at: "2026-07-12T14:54:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Faça upgrade do Plugin público `matrix` anterior para a implementação atual.

Para a maioria dos usuários, o upgrade já está implementado:

- o Plugin continua sendo `@openclaw/matrix`
- o canal continua sendo `matrix`
- sua configuração continua em `channels.matrix`
- as credenciais em cache continuam em `~/.openclaw/credentials/matrix/`
- o estado de runtime continua em `~/.openclaw/matrix/`

Você não precisa renomear chaves de configuração nem reinstalar o Plugin com um novo nome.
O pacote raiz `openclaw` não inclui mais o código de runtime do Matrix nem as
dependências do SDK do Matrix. Se `openclaw channels status` mostrar que o Matrix está configurado, mas o
Plugin não está instalado, execute `openclaw doctor --fix` ou
`openclaw plugins install @openclaw/matrix`; não instale pacotes do SDK do Matrix
no pacote raiz do OpenClaw.

## O que a migração faz automaticamente

A migração do Matrix é executada quando você executa [`openclaw doctor --fix`](/pt-BR/gateway/doctor) e, como alternativa, quando o cliente Matrix é iniciado e ainda encontra um estado auxiliar baseado em arquivos ao lado de seu armazenamento SQLite.

A migração automática abrange:

- reutilizar suas credenciais do Matrix em cache
- manter a mesma seleção de conta e configuração de `channels.matrix`
- importar o estado auxiliar baseado em arquivos (cache de sincronização `bot-storage.json`, `recovery-key.json`, `legacy-crypto-migration.json`, snapshots do IndexedDB) para o estado SQLite do Matrix; os arquivos migrados são arquivados com um sufixo `.migrated`
- reutilizar a raiz de armazenamento de hash de token existente mais completa para a mesma conta, homeserver, usuário e dispositivo do Matrix quando o token de acesso for alterado posteriormente

## Upgrade de versões do OpenClaw anteriores a 2026.4

As versões até a série 2026.6 também migravam o layout plano original de armazenamento único
do Matrix (`~/.openclaw/matrix/bot-storage.json` mais
`~/.openclaw/matrix/crypto/`) e preparavam a recuperação do estado criptografado do
armazenamento criptográfico antigo em Rust. As versões atuais não incluem mais essa migração.

Se você estiver fazendo upgrade de uma instalação que ainda usa o layout plano, primeiro
faça upgrade para uma versão 2026.6, execute `openclaw doctor --fix` e inicie o Gateway
uma vez para que o armazenamento plano e quaisquer chaves de sala recuperáveis sejam migrados. Depois, atualize
para a versão mais recente.

O Plugin público anterior do Matrix **não** criava automaticamente backups de chaves de sala do Matrix. Se a instalação antiga tinha um histórico criptografado somente local que nunca foi incluído em backup, algumas mensagens criptografadas mais antigas podem continuar ilegíveis após o upgrade, independentemente do caminho de migração.

## Fluxo de upgrade recomendado

1. Atualize o OpenClaw e o Plugin do Matrix normalmente.
2. Execute:

   ```bash
   openclaw doctor --fix
   ```

3. Inicie ou reinicie o Gateway.
4. Verifique o estado atual de verificação e backup:

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Coloque a chave de recuperação da conta do Matrix que você está reparando em uma variável de ambiente específica da conta. Para uma única conta padrão, `MATRIX_RECOVERY_KEY` é suficiente. Para várias contas, use uma variável por conta, por exemplo, `MATRIX_RECOVERY_KEY_ASSISTANT`, e adicione `--account assistant` ao comando.

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
   ainda for `no`, conclua a autoverificação em outro cliente Matrix:

   ```bash
   openclaw matrix verify self
   ```

   Aceite a solicitação em outro cliente Matrix, compare os emojis ou números decimais
   e digite `yes` somente se forem iguais. O comando aguarda a confiança total na
   identidade do Matrix antes de informar êxito.

8. Se você estiver abandonando intencionalmente o histórico antigo irrecuperável e quiser uma nova linha de base de backup para mensagens futuras, execute:

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Adicione `--rotate-recovery-key` somente quando a chave de recuperação antiga não deva mais desbloquear o novo backup.

9. Se ainda não existir um backup de chaves no servidor, crie um para recuperações futuras:

   ```bash
   openclaw matrix verify bootstrap
   ```

## Mensagens comuns e seus significados

`Failed migrating legacy Matrix client storage: ...`

- Significado: a alternativa do lado do cliente Matrix encontrou um estado auxiliar baseado em arquivos, mas houve falha ao importá-lo para o SQLite. O OpenClaw desfaz as movimentações concluídas e interrompe essa alternativa, em vez de iniciar silenciosamente com um novo armazenamento.
- O que fazer: verifique as permissões ou os conflitos do sistema de arquivos, mantenha o estado antigo intacto e tente novamente após corrigir o erro.

`Matrix is installed from a custom path: ...`

- Significado: o Matrix está fixado a uma instalação por caminho, portanto, as atualizações da linha principal não o substituem automaticamente pelo pacote padrão do Matrix.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix` quando quiser retornar ao Plugin padrão do Matrix.

`Matrix is installed from a custom path that no longer exists: ...`

- Significado: o registro de instalação do Plugin aponta para um caminho local que não existe mais.
- O que fazer: reinstale com `openclaw plugins install @openclaw/matrix` ou, se estiver executando a partir de um checkout do repositório, `openclaw plugins install ./path/to/local/matrix-plugin`. `openclaw doctor --fix` também pode remover as referências obsoletas ao Plugin do Matrix para você.

### Mensagens de recuperação manual

`openclaw matrix verify status` e `openclaw matrix verify backup status` exibem uma linha `Backup issue:` seguida de orientações em `Next steps:` quando o backup das chaves de sala não está íntegro neste dispositivo:

| Problema de backup                                                     | Significado                                         | Correção                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | não há nada para restaurar                         | `openclaw matrix verify bootstrap` para criar um backup de chaves de sala                                                                 |
| `backup decryption key is not loaded on this device`                  | a chave existe, mas não está ativa aqui            | `openclaw matrix verify backup restore`; se ainda não for possível carregar a chave, passe a chave de recuperação via `--recovery-key-stdin` |
| `backup decryption key could not be loaded from secret storage (...)` | houve falha ao carregar o armazenamento de segredos ou ele não é compatível | passe a chave de recuperação: `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin`          |
| `backup key mismatch (...)`                                           | a chave armazenada não corresponde ao backup ativo no servidor | execute novamente `verify backup restore --recovery-key-stdin` com a chave do backup ativo no servidor ou `verify backup reset --yes` para criar uma nova linha de base |
| `backup signature chain is not trusted by this device`                | o dispositivo ainda não confia na cadeia de assinatura cruzada | execute `verify device --recovery-key-stdin` e depois `verify self` em outro cliente verificado se a confiança ainda estiver incompleta     |
| `backup exists but is not active on this device`                      | há um backup no servidor, mas a sessão local está inativa | primeiro verifique o dispositivo e depois verifique novamente com `openclaw matrix verify backup status`                                  |
| `backup trust state could not be fully determined`                    | o diagnóstico foi inconclusivo                     | `openclaw matrix verify status --verbose`                                                                                                 |

Outros erros de recuperação:

`Matrix recovery key is required`

- Significado: você tentou realizar uma etapa de recuperação sem fornecer uma chave de recuperação quando ela era necessária.
- O que fazer: execute novamente o comando com `--recovery-key-stdin`, por exemplo, `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Significado: não foi possível interpretar a chave fornecida ou ela não correspondia ao formato esperado.
- O que fazer: tente novamente com a chave de recuperação exata do seu cliente Matrix ou da exportação da chave de recuperação.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Significado: a chave de recuperação desbloqueou material de backup utilizável, mas o Matrix não estabeleceu confiança total na identidade de assinatura cruzada para este dispositivo. Verifique na saída do comando os campos `Recovery key accepted`, `Backup usable`, `Cross-signing verified` e `Device verified by owner`.
- O que fazer: execute `openclaw matrix verify self`, aceite a solicitação em outro cliente Matrix, compare o SAS e digite `yes` somente se ele corresponder. Use `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` somente quando quiser intencionalmente substituir a identidade atual de assinatura cruzada.

Se você aceitar perder o histórico criptografado antigo irrecuperável, poderá redefinir
a linha de base atual do backup com `openclaw matrix verify backup reset --yes`. Quando o
segredo armazenado do backup estiver corrompido, essa redefinição também reparará o armazenamento de segredos para que a
nova chave de backup seja carregada corretamente após a reinicialização.

## Se o histórico criptografado ainda não reaparecer

Execute estas verificações na ordem indicada:

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Se o backup for restaurado com êxito, mas o histórico ainda estiver ausente em algumas salas antigas, provavelmente essas chaves ausentes nunca foram incluídas em backup pelo Plugin anterior.

## Se você quiser começar do zero para mensagens futuras

Se você aceitar perder o histórico criptografado antigo irrecuperável e quiser apenas uma linha de base de backup limpa daqui em diante, execute estes comandos na ordem indicada:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Se o dispositivo ainda não estiver verificado depois disso, conclua a verificação em seu cliente Matrix comparando os emojis ou códigos decimais do SAS e confirmando que são iguais.

## Relacionado

- [Matrix](/pt-BR/channels/matrix): configuração do canal.
- [Regras de push do Matrix](/pt-BR/channels/matrix-push-rules): roteamento de notificações.
- [Doctor](/pt-BR/gateway/doctor): verificação de integridade e acionamento da migração automática.
- [Guia de migração](/pt-BR/install/migrating): todos os caminhos de migração (mudanças de máquina, importações entre sistemas).
- [Plugins](/pt-BR/tools/plugin): instalação e registro de Plugins.
