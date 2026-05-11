---
read_when:
    - Configuração do Matrix no OpenClaw
    - Configuração da E2EE e da verificação do Matrix
summary: Status de suporte do Matrix, configuração inicial e exemplos de configuração
title: Matriz
x-i18n:
    generated_at: "2026-05-11T20:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0187f7ffa068e5db07e39581f718e3e9aab23f778fffc5cca14e43664a6ee10a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix é um Plugin de canal baixável para OpenClaw.
Ele usa o `matrix-js-sdk` oficial e oferece suporte a mensagens diretas, salas, threads, mídia, reações, enquetes, localização e E2EE.

## Instalação

Instale o Matrix pelo ClawHub antes de configurar o canal:

```bash
openclaw plugins install @openclaw/matrix
```

Especificações de Plugin sem prefixo tentam primeiro o ClawHub e depois recorrem ao npm. Para forçar a origem do registro, use `openclaw plugins install clawhub:@openclaw/matrix` ou `openclaw plugins install npm:@openclaw/matrix`.

A partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra e habilita o Plugin, então nenhuma etapa separada `openclaw plugins enable matrix` é necessária. O Plugin ainda não faz nada até você configurar o canal abaixo. Consulte [Plugins](/pt-BR/tools/plugin) para o comportamento geral de Plugins e as regras de instalação.

## Configuração

1. Crie uma conta Matrix no seu homeserver.
2. Configure `channels.matrix` com `homeserver` + `accessToken`, ou `homeserver` + `userId` + `password`.
3. Reinicie o Gateway.
4. Inicie uma mensagem direta com o bot ou convide-o para uma sala (consulte [entrada automática](#auto-join) - convites novos só entram quando `autoJoin` os permite).

### Configuração interativa

```bash
openclaw channels add
openclaw configure --section channels
```

O assistente solicita: URL do homeserver, método de autenticação (token de acesso ou senha), ID de usuário (apenas autenticação por senha), nome opcional do dispositivo, se E2EE deve ser habilitada e se o acesso a salas e a entrada automática devem ser configurados.

Se variáveis de ambiente `MATRIX_*` correspondentes já existirem e a conta selecionada não tiver autenticação salva, o assistente oferece um atalho por variável de ambiente. Para resolver nomes de salas antes de salvar uma allowlist, execute `openclaw channels resolve --channel matrix "Project Room"`. Quando E2EE está habilitada, o assistente grava a configuração e executa o mesmo bootstrap de [`openclaw matrix encryption setup`](#encryption-and-verification).

### Configuração mínima

Baseada em token:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Baseada em senha (o token é armazenado em cache após o primeiro login):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

### Entrada automática

`channels.matrix.autoJoin` usa `off` por padrão. Com o padrão, o bot não aparecerá em novas salas ou mensagens diretas de convites recentes até você entrar manualmente.

O OpenClaw não consegue saber, no momento do convite, se uma sala convidada é uma mensagem direta ou um grupo, então todos os convites - incluindo convites no estilo de mensagem direta - passam primeiro por `autoJoin`. `dm.policy` só se aplica depois, quando o bot já entrou e a sala foi classificada.

<Warning>
Defina `autoJoin: "allowlist"` junto com `autoJoinAllowlist` para restringir quais convites o bot aceita, ou `autoJoin: "always"` para aceitar todos os convites.

`autoJoinAllowlist` aceita apenas alvos estáveis: `!roomId:server`, `#alias:server` ou `*`. Nomes simples de sala são rejeitados; entradas de alias são resolvidas no homeserver, não no estado declarado pela sala convidada.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Para aceitar todos os convites, use `autoJoin: "always"`.

### Formatos de alvo da allowlist

É melhor preencher allowlists de mensagens diretas e salas com IDs estáveis:

- Mensagens diretas (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): use `@user:server`. Nomes de exibição são ignorados por padrão porque são mutáveis; defina `dangerouslyAllowNameMatching: true` somente quando você precisar explicitamente de compatibilidade com entradas por nome de exibição.
- Chaves de allowlist de sala (`groups`, legado `rooms`): use `!room:server` ou `#alias:server`. Nomes simples de sala são ignorados por padrão; defina `dangerouslyAllowNameMatching: true` somente quando você precisar explicitamente de compatibilidade com consulta de nome de sala já ingressada.
- Allowlists de convite (`autoJoinAllowlist`): use `!room:server`, `#alias:server` ou `*`. Nomes simples de sala são rejeitados.

### Normalização de ID de conta

O assistente converte um nome amigável em um ID de conta normalizado. Por exemplo, `Ops Bot` se torna `ops-bot`. Pontuação é escapada em nomes de variáveis de ambiente com escopo para que duas contas não possam colidir: `-` → `_X2D_`, então `ops-prod` mapeia para `MATRIX_OPS_X2D_PROD_*`.

### Credenciais em cache

O Matrix armazena credenciais em cache em `~/.openclaw/credentials/matrix/`:

- conta padrão: `credentials.json`
- contas nomeadas: `credentials-<account>.json`

Quando credenciais em cache existem ali, o OpenClaw trata o Matrix como configurado mesmo se o token de acesso não estiver no arquivo de configuração - isso cobre a configuração, `openclaw doctor` e sondagens de status do canal.

### Variáveis de ambiente

Usadas quando a chave de configuração equivalente não está definida. A conta padrão usa nomes sem prefixo; contas nomeadas usam o ID da conta inserido antes do sufixo.

| Conta padrão          | Conta nomeada (`<ID>` é o ID de conta normalizado) |
| --------------------- | -------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                           |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                         |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                              |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                             |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                            |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                          |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                         |

Para a conta `ops`, os nomes se tornam `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e assim por diante. As variáveis de ambiente de chave de recuperação são lidas por fluxos da CLI cientes de recuperação (`verify backup restore`, `verify device`, `verify bootstrap`) quando você passa a chave via pipe usando `--recovery-key-stdin`.

`MATRIX_HOMESERVER` não pode ser definido a partir de um `.env` de workspace; consulte [arquivos `.env` de workspace](/pt-BR/gateway/security).

## Exemplo de configuração

Uma base prática com pareamento de mensagens diretas, allowlist de sala e E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Prévias de streaming

O streaming de respostas do Matrix é opcional. `streaming` controla como o OpenClaw entrega a resposta do assistente em andamento; `blockStreaming` controla se cada bloco concluído é preservado como sua própria mensagem Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Para manter prévias de resposta ao vivo, mas ocultar linhas intermediárias de ferramenta/progresso, use a forma de objeto:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | Comportamento                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (padrão)  | Aguarda a resposta completa e envia uma vez. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                           |
| `"partial"`       | Edita uma mensagem de texto normal no local enquanto o modelo escreve o bloco atual. Clientes Matrix padrão podem notificar na primeira prévia, não na edição final.             |
| `"quiet"`         | Igual a `"partial"`, mas a mensagem é um aviso que não notifica. Destinatários só recebem uma notificação quando uma regra de push por usuário corresponde à edição finalizada (veja abaixo). |

`blockStreaming` é independente de `streaming`:

| `streaming`             | `blockStreaming: true`                                                   | `blockStreaming: false` (padrão)                  |
| ----------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| `"partial"` / `"quiet"` | Rascunho ao vivo do bloco atual, blocos concluídos mantidos como mensagens | Rascunho ao vivo do bloco atual, finalizado no local |
| `"off"`                 | Uma mensagem Matrix com notificação por bloco concluído                  | Uma mensagem Matrix com notificação para a resposta completa |

Observações:

- Se uma prévia ultrapassar o limite de tamanho por evento do Matrix, o OpenClaw interrompe o streaming de prévia e volta para entrega apenas final.
- Respostas de mídia sempre enviam anexos normalmente. Se uma prévia obsoleta não puder mais ser reutilizada com segurança, o OpenClaw a redige antes de enviar a resposta final de mídia.
- Atualizações de prévia de progresso de ferramenta são habilitadas por padrão quando o streaming de prévia do Matrix está ativo. Defina `streaming.preview.toolProgress: false` para manter edições de prévia para o texto da resposta, mas deixar o progresso de ferramenta no caminho normal de entrega.
- Edições de prévia custam chamadas extras à API Matrix. Deixe `streaming: "off"` se você quiser o perfil de limite de taxa mais conservador.

## Metadados de aprovação

Prompts de aprovação nativos do Matrix são eventos `m.room.message` normais com conteúdo de evento personalizado específico do OpenClaw em `com.openclaw.approval`. O Matrix permite chaves personalizadas de conteúdo de evento, então clientes padrão ainda renderizam o corpo de texto enquanto clientes cientes do OpenClaw podem ler o ID estruturado de aprovação, tipo, estado, decisões disponíveis e detalhes de execução/Plugin.

Quando um prompt de aprovação é longo demais para um evento Matrix, o OpenClaw divide o texto visível em partes e anexa `com.openclaw.approval` apenas à primeira parte. Reações para decisões de permitir/negar ficam vinculadas a esse primeiro evento, então prompts longos mantêm o mesmo alvo de aprovação que prompts de evento único.

### Regras de push auto-hospedadas para prévias finalizadas silenciosas

`streaming: "quiet"` só notifica destinatários quando um bloco ou turno é finalizado - uma regra de push por usuário precisa corresponder ao marcador de prévia finalizada. Consulte [regras de push do Matrix para prévias silenciosas](/pt-BR/channels/matrix-push-rules) para a receita completa (token do destinatário, verificação do pusher, instalação da regra, observações por homeserver).

## Salas de bot para bot

Por padrão, mensagens Matrix de outras contas Matrix configuradas do OpenClaw são ignoradas.

Use `allowBots` quando você quiser intencionalmente tráfego Matrix entre agentes:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` aceita mensagens de outras contas de bot Matrix configuradas em salas e mensagens diretas permitidas.
- `allowBots: "mentions"` aceita essas mensagens apenas quando elas mencionam visivelmente este bot em salas. Mensagens diretas continuam permitidas.
- `groups.<room>.allowBots` substitui a configuração no nível da conta para uma sala.
- O OpenClaw ainda ignora mensagens do mesmo ID de usuário Matrix para evitar loops de autorresposta.
- O Matrix não expõe uma sinalização nativa de bot aqui; o OpenClaw trata "criado por bot" como "enviado por outra conta Matrix configurada neste Gateway OpenClaw".

Use allowlists de sala rigorosas e requisitos de menção ao habilitar tráfego de bot para bot em salas compartilhadas.

## Criptografia e verificação

Em salas criptografadas (E2EE), eventos de imagem de saída usam `thumbnail_file` para que as prévias de imagem sejam criptografadas junto com o anexo completo. Salas não criptografadas ainda usam `thumbnail_url` simples. Nenhuma configuração é necessária - o Plugin detecta o estado de E2EE automaticamente.

Todos os comandos `openclaw matrix` aceitam `--verbose` (diagnósticos completos), `--json` (saída legível por máquina) e `--account <id>` (configurações com várias contas). A saída é concisa por padrão, com logs internos silenciosos do SDK. Os exemplos abaixo mostram a forma canônica; adicione as flags conforme necessário.

### Habilitar criptografia

```bash
openclaw matrix encryption setup
```

Inicializa o armazenamento de segredos e a assinatura cruzada, cria um backup de chaves de sala se necessário e então imprime o status e os próximos passos. Flags úteis:

- `--recovery-key <key>` aplica uma chave de recuperação antes da inicialização (prefira a forma via stdin documentada abaixo)
- `--force-reset-cross-signing` descarta a identidade atual de assinatura cruzada e cria uma nova (use somente de forma intencional)

Para uma nova conta, habilite E2EE no momento da criação:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` é um alias para `--enable-e2ee`.

Equivalente de configuração manual:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

### Status e sinais de confiança

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` relata três sinais de confiança independentes (`--verbose` mostra todos eles):

- `Locally trusted`: confiável apenas por este cliente
- `Cross-signing verified`: o SDK relata verificação via assinatura cruzada
- `Signed by owner`: assinado pela sua própria chave de autoassinatura (somente diagnóstico)

`Verified by owner` se torna `yes` somente quando `Cross-signing verified` é `yes`. Confiança local ou uma assinatura do proprietário sozinha não é suficiente.

`--allow-degraded-local-state` retorna diagnósticos de melhor esforço sem preparar primeiro a conta Matrix; útil para sondagens offline ou parcialmente configuradas.

### Verificar este dispositivo com uma chave de recuperação

A chave de recuperação é sensível - envie-a via stdin em vez de passá-la na linha de comando. Defina `MATRIX_RECOVERY_KEY` (ou `MATRIX_<ID>_RECOVERY_KEY` para uma conta nomeada):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

O comando relata três estados:

- `Recovery key accepted`: Matrix aceitou a chave para armazenamento de segredos ou confiança do dispositivo.
- `Backup usable`: o backup de chaves de sala pode ser carregado com o material de recuperação confiável.
- `Device verified by owner`: este dispositivo tem confiança completa na identidade de assinatura cruzada Matrix.

Ele sai com código diferente de zero quando a confiança completa da identidade está incompleta, mesmo se a chave de recuperação desbloqueou o material de backup. Nesse caso, conclua a autoverificação em outro cliente Matrix:

```bash
openclaw matrix verify self
```

`verify self` aguarda `Cross-signing verified: yes` antes de sair com sucesso. Use `--timeout-ms <ms>` para ajustar a espera.

A forma com chave literal `openclaw matrix verify device "<recovery-key>"` também é aceita, mas a chave acaba no histórico do seu shell.

### Inicializar ou reparar a assinatura cruzada

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` é o comando de reparo e configuração para contas criptografadas. Em ordem, ele:

- inicializa o armazenamento de segredos, reutilizando uma chave de recuperação existente quando possível
- inicializa a assinatura cruzada e envia chaves públicas ausentes
- marca e assina de forma cruzada o dispositivo atual
- cria um backup de chaves de sala no servidor se ainda não existir

Se o homeserver exigir UIA para enviar chaves de assinatura cruzada, o OpenClaw tenta primeiro sem autenticação, depois `m.login.dummy`, depois `m.login.password` (exige `channels.matrix.password`).

Flags úteis:

- `--recovery-key-stdin` (combine com `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) ou `--recovery-key <key>`
- `--force-reset-cross-signing` para descartar a identidade atual de assinatura cruzada (somente de forma intencional)

### Backup de chaves de sala

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` mostra se existe um backup no servidor e se este dispositivo pode descriptografá-lo. `backup restore` importa chaves de sala em backup para o armazenamento criptográfico local; se a chave de recuperação já estiver em disco, você pode omitir `--recovery-key-stdin`.

Para substituir um backup quebrado por uma linha de base nova (aceita perder histórico antigo irrecuperável; também pode recriar o armazenamento de segredos se o segredo do backup atual não puder ser carregado):

```bash
openclaw matrix verify backup reset --yes
```

Adicione `--rotate-recovery-key` somente quando você quiser intencionalmente que a chave de recuperação anterior pare de desbloquear a nova linha de base do backup.

### Listar, solicitar e responder a verificações

```bash
openclaw matrix verify list
```

Lista solicitações de verificação pendentes para a conta selecionada.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Envia uma solicitação de verificação a partir desta conta OpenClaw. `--own-user` solicita autoverificação (você aceita o prompt em outro cliente Matrix do mesmo usuário); `--user-id`/`--device-id`/`--room-id` apontam para outra pessoa. `--own-user` não pode ser combinado com as outras flags de destino.

Para tratamento de ciclo de vida de nível mais baixo - normalmente ao acompanhar solicitações de entrada de outro cliente - estes comandos atuam em uma solicitação específica `<id>` (impressa por `verify list` e `verify request`):

| Comando                                    | Finalidade                                                          |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Aceitar uma solicitação de entrada                                  |
| `openclaw matrix verify start <id>`        | Iniciar o fluxo SAS                                                 |
| `openclaw matrix verify sas <id>`          | Imprimir os emojis ou decimais SAS                                  |
| `openclaw matrix verify confirm-sas <id>`  | Confirmar que o SAS corresponde ao que o outro cliente mostra       |
| `openclaw matrix verify mismatch-sas <id>` | Rejeitar o SAS quando os emojis ou decimais não corresponderem      |
| `openclaw matrix verify cancel <id>`       | Cancelar; aceita `--reason <text>` e `--code <matrix-code>` opcionais |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` aceitam `--user-id` e `--room-id` como dicas de acompanhamento de DM quando a verificação está ancorada a uma sala de mensagem direta específica.

### Notas sobre várias contas

Sem `--account <id>`, os comandos da CLI Matrix usam a conta padrão implícita. Se você tiver várias contas nomeadas e não tiver definido `channels.matrix.defaultAccount`, eles se recusarão a adivinhar e pedirão que você escolha. Quando E2EE está desabilitada ou indisponível para uma conta nomeada, os erros apontam para a chave de configuração dessa conta, por exemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    Com `encryption: true`, `startupVerification` usa `"if-unverified"` por padrão. Na inicialização, um dispositivo não verificado solicita autoverificação em outro cliente Matrix, pulando duplicatas e aplicando um período de espera (24 horas por padrão). Ajuste com `startupVerificationCooldownHours` ou desabilite com `startupVerification: "off"`.

    A inicialização também executa uma passagem conservadora de bootstrap criptográfico que reutiliza o armazenamento de segredos atual e a identidade de assinatura cruzada. Se o estado de bootstrap estiver quebrado, o OpenClaw tenta um reparo protegido mesmo sem `channels.matrix.password`; se o homeserver exigir UIA com senha, a inicialização registra um aviso e permanece não fatal. Dispositivos já assinados pelo proprietário são preservados.

    Consulte [Migração Matrix](/pt-BR/channels/matrix-migration) para o fluxo completo de atualização.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix publica avisos de ciclo de vida de verificação na sala estrita de verificação por DM como mensagens `m.notice`: solicitação, pronto (com orientação "Verify by emoji"), início/conclusão e detalhes de SAS (emoji/decimal) quando disponíveis.

    Solicitações recebidas de outro cliente Matrix são rastreadas e aceitas automaticamente. Para autoverificação, o OpenClaw inicia o fluxo SAS automaticamente e confirma seu próprio lado assim que a verificação por emoji está disponível - você ainda precisa comparar e confirmar "They match" no seu cliente Matrix.

    Avisos do sistema de verificação não são encaminhados para o pipeline de chat do agente.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Se `verify status` disser que o dispositivo atual não está mais listado no homeserver, crie um novo dispositivo Matrix do OpenClaw. Para login com senha:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para autenticação por token, crie um token de acesso novo no seu cliente Matrix ou UI de administração e então atualize o OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Substitua `assistant` pelo ID da conta do comando com falha, ou omita `--account` para a conta padrão.

  </Accordion>

  <Accordion title="Device hygiene">
    Dispositivos antigos gerenciados pelo OpenClaw podem se acumular. Liste e remova:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    A E2EE Matrix usa o caminho criptográfico Rust oficial do `matrix-js-sdk` com `fake-indexeddb` como shim de IndexedDB. O estado criptográfico persiste em `crypto-idb-snapshot.json` (permissões de arquivo restritivas).

    O estado de runtime criptografado fica em `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e inclui o armazenamento de sincronização, o armazenamento criptográfico, a chave de recuperação, o snapshot de IDB, os vínculos de threads e o estado de verificação de inicialização. Quando o token muda, mas a identidade da conta permanece a mesma, o OpenClaw reutiliza a melhor raiz existente para que o estado anterior continue visível.

  </Accordion>
</AccordionGroup>

## Gerenciamento de perfil

Atualize o autoperfil Matrix da conta selecionada:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Você pode passar ambas as opções em uma única chamada. Matrix aceita URLs de avatar `mxc://` diretamente; quando você passa `http://` ou `https://`, o OpenClaw primeiro faz upload do arquivo e armazena a URL `mxc://` resolvida em `channels.matrix.avatarUrl` (ou na substituição por conta).

## Threads

Matrix oferece suporte a threads nativas Matrix tanto para respostas automáticas quanto para envios por ferramenta de mensagem. Dois controles independentes definem o comportamento:

### Roteamento de sessão (`sessionScope`)

`dm.sessionScope` decide como salas de DM Matrix são mapeadas para sessões OpenClaw:

- `"per-user"` (padrão): todas as salas de DM com o mesmo par roteado compartilham uma sessão.
- `"per-room"`: cada sala de DM Matrix recebe sua própria chave de sessão, mesmo quando o par é o mesmo.

Vínculos explícitos de conversa sempre prevalecem sobre `sessionScope`, então salas e threads vinculadas mantêm sua sessão de destino escolhida.

### Encadeamento de respostas (`threadReplies`)

`threadReplies` decide onde o bot publica sua resposta:

- `"off"`: as respostas são de nível superior. Mensagens encadeadas de entrada permanecem na sessão pai.
- `"inbound"`: responde dentro de uma thread somente quando a mensagem de entrada já estava naquela thread.
- `"always"`: responde dentro de uma thread enraizada na mensagem acionadora; essa conversa é roteada por uma sessão correspondente com escopo de thread a partir do primeiro acionamento.

`dm.threadReplies` substitui isso somente para DMs - por exemplo, mantenha threads de sala isoladas enquanto mantém DMs planas.

### Herança de threads e comandos de barra

- Mensagens encadeadas de entrada incluem a mensagem raiz do thread como contexto extra do agente.
- Envios pela ferramenta de mensagem herdam automaticamente o thread atual do Matrix ao direcionar para a mesma sala (ou para o mesmo destino de usuário em DM), a menos que um `threadId` explícito seja fornecido.
- A reutilização de destino de usuário em DM só entra em ação quando os metadados da sessão atual comprovam o mesmo par de DM na mesma conta Matrix; caso contrário, o OpenClaw volta ao roteamento normal com escopo de usuário.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vinculado a thread funcionam em salas Matrix e DMs.
- `/focus` de nível superior cria um novo thread Matrix e o vincula à sessão de destino quando `threadBindings.spawnSessions` está habilitado.
- Executar `/focus` ou `/acp spawn --thread here` dentro de um thread Matrix existente vincula esse thread no local.

Quando o OpenClaw detecta uma sala de DM do Matrix colidindo com outra sala de DM na mesma sessão compartilhada, ele publica um `m.notice` único nessa sala apontando para a saída de emergência `/focus` e sugerindo uma alteração em `dm.sessionScope`. O aviso só aparece quando vínculos de thread estão habilitados.

## Vínculos de conversa ACP

Salas Matrix, DMs e threads Matrix existentes podem ser transformados em workspaces ACP duráveis sem alterar a superfície de chat.

Fluxo rápido para operadores:

- Execute `/acp spawn codex --bind here` dentro da DM, sala ou thread existente do Matrix que você quer continuar usando.
- Em uma DM ou sala Matrix de nível superior, a DM/sala atual permanece como a superfície de chat e mensagens futuras são roteadas para a sessão ACP criada.
- Dentro de um thread Matrix existente, `--bind here` vincula esse thread atual no local.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove o vínculo.

Notas:

- `--bind here` não cria um thread filho do Matrix.
- `threadBindings.spawnSessions` controla `/acp spawn --thread auto|here`, em que o OpenClaw precisa criar ou vincular um thread filho do Matrix.

### Configuração de vínculo de thread

Matrix herda padrões globais de `session.threadBindings` e também aceita substituições por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Criações de sessão vinculadas a thread no Matrix são ativadas por padrão:

- Defina `threadBindings.spawnSessions: false` para impedir que `/focus` de nível superior e `/acp spawn --thread auto|here` criem/vinculem threads Matrix.
- Defina `threadBindings.defaultSpawnContext: "isolated"` quando criações de thread de subagente nativo não devem bifurcar a transcrição pai.

## Reações

Matrix oferece suporte a reações de saída, notificações de reação de entrada e reações de confirmação.

A ferramenta de reação de saída é controlada por `channels.matrix.actions.reactions`:

- `react` adiciona uma reação a um evento Matrix.
- `reactions` lista o resumo de reações atual de um evento Matrix.
- `emoji=""` remove as próprias reações do bot nesse evento.
- `remove: true` remove apenas a reação do emoji especificado do bot.

**Ordem de resolução** (o primeiro valor definido vence):

| Configuração           | Ordem                                                                            |
| ---------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`          | por conta → canal → `messages.ackReaction` → fallback do emoji de identidade do agente |
| `ackReactionScope`     | por conta → canal → `messages.ackReactionScope` → padrão `"group-mentions"`      |
| `reactionNotifications` | por conta → canal → padrão `"own"`                                               |

`reactionNotifications: "own"` encaminha eventos `m.reaction` adicionados quando eles miram mensagens Matrix criadas pelo bot; `"off"` desabilita eventos do sistema de reação. Remoções de reação não são sintetizadas em eventos do sistema porque o Matrix as expõe como redações, não como remoções `m.reaction` independentes.

## Contexto do histórico

- `channels.matrix.historyLimit` controla quantas mensagens recentes da sala são incluídas como `InboundHistory` quando uma mensagem de sala Matrix aciona o agente. Faz fallback para `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo é `0`. Defina `0` para desabilitar.
- O histórico de sala Matrix é apenas da sala. DMs continuam usando o histórico normal da sessão.
- O histórico de sala Matrix é somente pendente: o OpenClaw armazena em buffer mensagens da sala que ainda não acionaram uma resposta e então captura um snapshot dessa janela quando uma menção ou outro acionador chega.
- A mensagem acionadora atual não é incluída em `InboundHistory`; ela permanece no corpo principal de entrada desse turno.
- Novas tentativas do mesmo evento Matrix reutilizam o snapshot de histórico original em vez de avançar para mensagens de sala mais recentes.

## Visibilidade de contexto

Matrix oferece suporte ao controle compartilhado `contextVisibility` para contexto suplementar de sala, como texto de resposta buscado, raízes de thread e histórico pendente.

- `contextVisibility: "all"` é o padrão. O contexto suplementar é mantido conforme recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas de allowlist de sala/usuário.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta citada explícita.

Essa configuração afeta a visibilidade de contexto suplementar, não se a própria mensagem de entrada pode acionar uma resposta.
A autorização do acionador ainda vem de `groupPolicy`, `groups`, `groupAllowFrom` e das configurações de política de DM.

## Política de DM e sala

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Para silenciar DMs totalmente enquanto mantém salas funcionando, defina `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Consulte [Grupos](/pt-BR/channels/groups) para comportamento de bloqueio por menção e allowlist.

Exemplo de pareamento para DMs Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se um usuário Matrix não aprovado continuar enviando mensagens antes da aprovação, o OpenClaw reutiliza o mesmo código de pareamento pendente e pode enviar uma resposta de lembrete após um curto cooldown em vez de emitir um novo código.

Consulte [Pareamento](/pt-BR/channels/pairing) para o fluxo compartilhado de pareamento de DM e o layout de armazenamento.

## Reparo de sala direta

Se o estado de mensagem direta ficar fora de sincronia, o OpenClaw pode acabar com mapeamentos `m.direct` obsoletos que apontam para salas solo antigas em vez da DM ativa. Inspecione o mapeamento atual de um par:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repare-o:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Ambos os comandos aceitam `--account <id>` para configurações com várias contas. O fluxo de reparo:

- prefere uma DM 1:1 estrita que já esteja mapeada em `m.direct`
- faz fallback para qualquer DM 1:1 estrita atualmente ingressada com esse usuário
- cria uma sala direta nova e reescreve `m.direct` se nenhuma DM saudável existir

Ele não exclui salas antigas automaticamente. Ele escolhe a DM saudável e atualiza o mapeamento para que futuros envios Matrix, avisos de verificação e outros fluxos de mensagem direta direcionem para a sala correta.

## Aprovações de exec

Matrix pode atuar como um cliente de aprovação nativo. Configure em `channels.matrix.execApprovals` (ou `channels.matrix.accounts.<account>.execApprovals` para uma substituição por conta):

- `enabled`: entrega aprovações por meio de prompts nativos do Matrix. Quando não definido ou `"auto"`, Matrix habilita automaticamente quando pelo menos um aprovador puder ser resolvido. Defina `false` para desabilitar explicitamente.
- `approvers`: IDs de usuário Matrix (`@owner:example.org`) autorizados a aprovar solicitações de exec. Opcional - faz fallback para `channels.matrix.dm.allowFrom`.
- `target`: para onde os prompts vão. `"dm"` (padrão) envia para DMs dos aprovadores; `"channel"` envia para a sala Matrix ou DM de origem; `"both"` envia para ambos.
- `agentFilter` / `sessionFilter`: allowlists opcionais para quais agentes/sessões acionam entrega pelo Matrix.

A autorização difere um pouco entre tipos de aprovação:

- **Aprovações de exec** usam `execApprovals.approvers`, com fallback para `dm.allowFrom`.
- **Aprovações de Plugin** autorizam somente por meio de `dm.allowFrom`.

Ambos os tipos compartilham atalhos de reação e atualizações de mensagem do Matrix. Aprovadores veem atalhos de reação na mensagem de aprovação principal:

- `✅` permitir uma vez
- `❌` negar
- `♾️` permitir sempre (quando a política efetiva de exec permite)

Comandos slash de fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Somente aprovadores resolvidos podem aprovar ou negar. A entrega em canal para aprovações de exec inclui o texto do comando - habilite `channel` ou `both` somente em salas confiáveis.

Relacionado: [Aprovações de exec](/pt-BR/tools/exec-approvals).

## Comandos slash

Comandos slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` etc.) funcionam diretamente em DMs. Em salas, o OpenClaw também reconhece comandos prefixados com a própria menção Matrix do bot, então `@bot:server /new` aciona o caminho de comando sem uma regex de menção personalizada. Isso mantém o bot responsivo às publicações no estilo de sala `@mention /command` que Element e clientes semelhantes emitem quando um usuário completa o nome do bot com tab antes de digitar o comando.

As regras de autorização ainda se aplicam: remetentes de comandos devem satisfazer as mesmas políticas de allowlist/proprietário de DM ou sala que mensagens comuns.

## Várias contas

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

**Herança:**

- Valores de nível superior de `channels.matrix` atuam como padrões para contas nomeadas, a menos que uma conta os substitua.
- Restrinja uma entrada de sala herdada a uma conta específica com `groups.<room>.account`. Entradas sem `account` são compartilhadas entre contas; `account: "default"` ainda funciona quando a conta padrão está configurada no nível superior.

**Seleção da conta padrão:**

- Defina `defaultAccount` para escolher a conta nomeada que o roteamento implícito, sondagem e comandos da CLI preferem.
- Se você tiver várias contas e uma for literalmente chamada `default`, o OpenClaw a usa implicitamente mesmo quando `defaultAccount` não está definido.
- Se você tiver várias contas nomeadas e nenhuma padrão estiver selecionada, comandos da CLI se recusam a adivinhar - defina `defaultAccount` ou passe `--account <id>`.
- O bloco de nível superior `channels.matrix.*` só é tratado como a conta `default` implícita quando sua autenticação está completa (`homeserver` + `accessToken`, ou `homeserver` + `userId` + `password`). Contas nomeadas continuam descobríveis a partir de `homeserver` + `userId` quando credenciais em cache cobrem a autenticação.

**Promoção:**

- Quando o OpenClaw promove uma configuração de conta única para várias contas durante reparo ou configuração, ele preserva a conta nomeada existente se houver uma ou se `defaultAccount` já apontar para uma. Somente chaves de autenticação/bootstrap do Matrix são movidas para a conta promovida; chaves de política de entrega compartilhadas permanecem no nível superior.

Consulte [Referência de configuração](/pt-BR/gateway/config-channels#multi-account-all-channels) para o padrão compartilhado de várias contas.

## Homeservers privados/LAN

Por padrão, o OpenClaw bloqueia homeservers Matrix privados/internos para proteção contra SSRF, a menos que você
opte explicitamente por conta.

Se seu homeserver roda em localhost, um IP de LAN/Tailscale ou um hostname interno, habilite
`network.dangerouslyAllowPrivateNetwork` para essa conta Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Exemplo de configuração pela CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Essa adesão explícita permite apenas destinos privados/internos confiáveis. Servidores domésticos públicos em texto claro, como
`http://matrix.example.org:8008`, continuam bloqueados. Prefira `https://` sempre que possível.

## Proxy do tráfego do Matrix

Se sua implantação do Matrix precisar de um proxy HTTP(S) de saída explícito, defina `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Contas nomeadas podem substituir o padrão de nível superior com `channels.matrix.accounts.<id>.proxy`.
O OpenClaw usa a mesma configuração de proxy para o tráfego Matrix em runtime e para verificações de status da conta.

## Resolução de destino

O Matrix aceita estas formas de destino em qualquer lugar em que o OpenClaw solicite um destino de sala ou usuário:

- Usuários: `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Aliases: `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Use a capitalização exata do ID de sala do Matrix
ao configurar destinos explícitos de entrega, tarefas cron, associações ou listas de permissões.
O OpenClaw mantém as chaves de sessão internas canônicas para armazenamento, portanto essas chaves em minúsculas
não são uma fonte confiável para IDs de entrega do Matrix.

A consulta ao diretório em tempo real usa a conta Matrix conectada:

- Consultas de usuários pesquisam o diretório de usuários do Matrix nesse servidor doméstico.
- Consultas de salas aceitam IDs de sala e aliases explícitos diretamente. A consulta de nomes de salas ingressadas é de melhor esforço e só se aplica a listas de permissões de salas em runtime quando `dangerouslyAllowNameMatching: true` está definido.
- Se um nome de sala não puder ser resolvido para um ID ou alias, ele será ignorado pela resolução da lista de permissões em runtime.

## Referência de configuração

Campos de usuário no estilo lista de permissões (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) aceitam IDs completos de usuário do Matrix (mais seguro). Entradas de usuário que não são IDs são ignoradas por padrão. Se você definir `dangerouslyAllowNameMatching: true`, correspondências exatas de nomes de exibição no diretório do Matrix serão resolvidas na inicialização e sempre que a lista de permissões mudar enquanto o monitor estiver em execução; entradas que não puderem ser resolvidas serão ignoradas em runtime.

Chaves de lista de permissões de sala (`groups`, legado `rooms`) devem ser IDs de sala ou aliases. Chaves com nomes de sala simples são ignoradas por padrão; `dangerouslyAllowNameMatching: true` restaura a consulta de melhor esforço contra nomes de salas ingressadas.

### Conta e conexão

- `enabled`: habilita ou desabilita o canal.
- `name`: rótulo de exibição opcional para a conta.
- `defaultAccount`: ID de conta preferencial quando várias contas Matrix estão configuradas.
- `accounts`: substituições nomeadas por conta. Valores de nível superior de `channels.matrix` são herdados como padrões.
- `homeserver`: URL do servidor doméstico, por exemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta conta se conecte a `localhost`, IPs de LAN/Tailscale ou nomes de host internos.
- `proxy`: URL de proxy HTTP(S) opcional para tráfego Matrix. Há suporte a substituição por conta.
- `userId`: ID completo de usuário do Matrix (`@bot:example.org`).
- `accessToken`: token de acesso para autenticação baseada em token. Há suporte a valores em texto simples e SecretRef nos provedores env/file/exec ([Gerenciamento de segredos](/pt-BR/gateway/secrets)).
- `password`: senha para login baseado em senha. Há suporte a valores em texto simples e SecretRef.
- `deviceId`: ID explícito do dispositivo Matrix.
- `deviceName`: nome de exibição do dispositivo usado no momento do login por senha.
- `avatarUrl`: URL do avatar próprio armazenada para sincronização de perfil e atualizações de `profile set`.
- `initialSyncLimit`: número máximo de eventos buscados durante a sincronização de inicialização.

### Criptografia

- `encryption`: habilita E2EE. Padrão: `false`.
- `startupVerification`: `"if-unverified"` (padrão quando E2EE está ativada) ou `"off"`. Solicita automaticamente a autoverificação na inicialização quando este dispositivo não está verificado.
- `startupVerificationCooldownHours`: intervalo antes da próxima solicitação automática na inicialização. Padrão: `24`.

### Acesso e política

- `groupPolicy`: `"open"`, `"allowlist"` ou `"disabled"`. Padrão: `"allowlist"`.
- `groupAllowFrom`: lista de permissões de IDs de usuário para tráfego de sala.
- `dm.enabled`: quando `false`, ignora todas as DMs. Padrão: `true`.
- `dm.policy`: `"pairing"` (padrão), `"allowlist"`, `"open"` ou `"disabled"`. Aplica-se depois que o bot ingressou e classificou a sala como uma DM; não afeta o tratamento de convites.
- `dm.allowFrom`: lista de permissões de IDs de usuário para tráfego de DM.
- `dm.sessionScope`: `"per-user"` (padrão) ou `"per-room"`.
- `dm.threadReplies`: substituição somente para DM do encadeamento de respostas (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: aceita mensagens de outras contas de bot Matrix configuradas (`true` ou `"mentions"`).
- `allowlistOnly`: quando `true`, força todas as políticas de DM ativas (exceto `"disabled"`) e políticas de grupo `"open"` para `"allowlist"`. Não altera políticas `"disabled"`.
- `dangerouslyAllowNameMatching`: quando `true`, permite a consulta de nomes de exibição no diretório do Matrix para entradas de lista de permissões de usuários e a consulta de nomes de salas ingressadas para chaves de lista de permissões de salas. Prefira IDs completos `@user:server` e IDs de sala ou aliases.
- `autoJoin`: `"always"`, `"allowlist"` ou `"off"`. Padrão: `"off"`. Aplica-se a todo convite do Matrix, incluindo convites no estilo DM.
- `autoJoinAllowlist`: salas/aliases permitidos quando `autoJoin` é `"allowlist"`. Entradas de alias são resolvidas contra o servidor doméstico, não contra o estado declarado pela sala convidada.
- `contextVisibility`: visibilidade de contexto suplementar (`"all"` padrão, `"allowlist"`, `"allowlist_quote"`).

### Comportamento de resposta

- `replyToMode`: `"off"`, `"first"`, `"all"` ou `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` ou `"always"`.
- `threadBindings`: substituições por canal para roteamento e ciclo de vida de sessões vinculadas a threads.
- `streaming`: `"off"` (padrão), `"partial"`, `"quiet"` ou forma de objeto `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: quando `true`, blocos concluídos do assistente são mantidos como mensagens de progresso separadas.
- `markdown`: configuração opcional de renderização Markdown para texto de saída.
- `responsePrefix`: string opcional prefixada às respostas de saída.
- `textChunkLimit`: tamanho do bloco de saída em caracteres quando `chunkMode: "length"`. Padrão: `4000`.
- `chunkMode`: `"length"` (padrão, divide por contagem de caracteres) ou `"newline"` (divide nos limites de linha).
- `historyLimit`: número de mensagens recentes da sala incluídas como `InboundHistory` quando uma mensagem de sala aciona o agente. Recua para `messages.groupChat.historyLimit`; padrão efetivo `0` (desabilitado).
- `mediaMaxMb`: limite de tamanho de mídia em MB para envios de saída e processamento de entrada.

### Configurações de reação

- `ackReaction`: substituição da reação de confirmação para este canal/conta.
- `ackReactionScope`: substituição de escopo (`"group-mentions"` padrão, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modo de notificação de reações de entrada (`"own"` padrão, `"off"`).

### Ferramentas e substituições por sala

- `actions`: controle de ferramentas por ação (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa de políticas por sala. A identidade da sessão usa o ID de sala estável após a resolução. (`rooms` é um alias legado.)
  - `groups.<room>.account`: restringe uma entrada de sala herdada a uma conta específica.
  - `groups.<room>.allowBots`: substituição por sala da configuração em nível de canal (`true` ou `"mentions"`).
  - `groups.<room>.users`: lista de permissões de remetentes por sala.
  - `groups.<room>.tools`: substituições por sala para permitir/negar ferramentas.
  - `groups.<room>.autoReply`: substituição por sala do controle por menção. `true` desabilita os requisitos de menção para essa sala; `false` força-os novamente.
  - `groups.<room>.skills`: filtro de Skills por sala.
  - `groups.<room>.systemPrompt`: trecho de prompt do sistema por sala.

### Configurações de aprovação de exec

- `execApprovals.enabled`: entrega aprovações de exec por meio de prompts nativos do Matrix.
- `execApprovals.approvers`: IDs de usuário do Matrix autorizados a aprovar. Recua para `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (padrão), `"channel"` ou `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: listas de permissões opcionais de agente/sessão para entrega.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
