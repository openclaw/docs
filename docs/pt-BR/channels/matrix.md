---
read_when:
    - Configurando o Matrix no OpenClaw
    - Configurando E2EE e verificação do Matrix
summary: Status de suporte ao Matrix, configuração inicial e exemplos de configuração
title: Matrix
x-i18n:
    generated_at: "2026-04-30T09:36:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 261b0eaae452cff7bb9ddf8dc67ddda45fb27b6468e95450b19207348d0b577a
    source_path: channels/matrix.md
    workflow: 16
---

Matrix é um Plugin de canal incluído no OpenClaw.
Ele usa o `matrix-js-sdk` oficial e oferece suporte a DMs, salas, threads, mídia, reações, enquetes, localização e E2EE.

## Plugin incluído

As versões empacotadas atuais do OpenClaw incluem o Plugin Matrix. Você não precisa instalar nada; configurar `channels.matrix.*` (consulte [Configuração](#setup)) é o que o ativa.

Para builds mais antigas ou instalações personalizadas que excluem o Matrix, instale um pacote npm atual quando um for publicado:

```bash
openclaw plugins install @openclaw/matrix
```

Se o npm informar que o pacote pertencente ao OpenClaw está obsoleto, use uma build empacotada atual do OpenClaw ou um checkout local até que um pacote npm mais recente seja publicado.

A partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` registra e habilita o Plugin, portanto nenhuma etapa separada `openclaw plugins enable matrix` é necessária. O Plugin ainda não faz nada até que você configure o canal abaixo. Consulte [Plugins](/pt-BR/tools/plugin) para o comportamento geral de Plugins e regras de instalação.

## Configuração

1. Crie uma conta Matrix no seu homeserver.
2. Configure `channels.matrix` com `homeserver` + `accessToken`, ou `homeserver` + `userId` + `password`.
3. Reinicie o Gateway.
4. Inicie uma DM com o bot, ou convide-o para uma sala (consulte [entrada automática](#auto-join) — novos convites só entram quando `autoJoin` permite).

### Configuração interativa

```bash
openclaw channels add
openclaw configure --section channels
```

O assistente solicita: URL do homeserver, método de autenticação (token de acesso ou senha), ID de usuário (somente autenticação por senha), nome opcional do dispositivo, se E2EE deve ser habilitada e se deseja configurar acesso a salas e entrada automática.

Se variáveis de ambiente `MATRIX_*` correspondentes já existirem e a conta selecionada não tiver autenticação salva, o assistente oferece um atalho por variável de ambiente. Para resolver nomes de salas antes de salvar uma lista de permissão, execute `openclaw channels resolve --channel matrix "Project Room"`. Quando E2EE está habilitada, o assistente grava a configuração e executa o mesmo bootstrap de [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` usa `off` como padrão. Com o padrão, o bot não aparecerá em novas salas ou DMs de novos convites até que você entre manualmente.

O OpenClaw não consegue saber no momento do convite se uma sala convidada é uma DM ou um grupo, então todos os convites — incluindo convites no estilo DM — passam primeiro por `autoJoin`. `dm.policy` só se aplica depois, após o bot ter entrado e a sala ter sido classificada.

<Warning>
Defina `autoJoin: "allowlist"` mais `autoJoinAllowlist` para restringir quais convites o bot aceita, ou `autoJoin: "always"` para aceitar todos os convites.

`autoJoinAllowlist` aceita apenas destinos estáveis: `!roomId:server`, `#alias:server` ou `*`. Nomes simples de salas são rejeitados; entradas de alias são resolvidas contra o homeserver, não contra o estado declarado pela sala convidada.
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

### Formatos de destino de listas de permissão

Listas de permissão de DMs e salas são melhor preenchidas com IDs estáveis:

- DMs (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): use `@user:server`. Nomes de exibição só são resolvidos quando o diretório do homeserver retorna exatamente uma correspondência.
- Salas (`groups`, `autoJoinAllowlist`): use `!room:server` ou `#alias:server`. Nomes são resolvidos da melhor forma possível contra salas em que o bot já entrou; entradas não resolvidas são ignoradas em tempo de execução.

### Normalização de ID de conta

O assistente converte um nome amigável em um ID de conta normalizado. Por exemplo, `Ops Bot` vira `ops-bot`. A pontuação é escapada em nomes de variáveis de ambiente com escopo para que duas contas não possam colidir: `-` → `_X2D_`, então `ops-prod` mapeia para `MATRIX_OPS_X2D_PROD_*`.

### Credenciais em cache

O Matrix armazena credenciais em cache em `~/.openclaw/credentials/matrix/`:

- conta padrão: `credentials.json`
- contas nomeadas: `credentials-<account>.json`

Quando credenciais em cache existem ali, o OpenClaw trata o Matrix como configurado mesmo que o token de acesso não esteja no arquivo de configuração — isso cobre configuração, `openclaw doctor` e sondagens de status do canal.

### Variáveis de ambiente

Usadas quando a chave de configuração equivalente não está definida. A conta padrão usa nomes sem prefixo; contas nomeadas usam o ID da conta inserido antes do sufixo.

| Conta padrão         | Conta nomeada (`<ID>` é o ID de conta normalizado) |
| -------------------- | -------------------------------------------------- |
| `MATRIX_HOMESERVER`  | `MATRIX_<ID>_HOMESERVER`                           |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                        |
| `MATRIX_USER_ID`     | `MATRIX_<ID>_USER_ID`                              |
| `MATRIX_PASSWORD`    | `MATRIX_<ID>_PASSWORD`                             |
| `MATRIX_DEVICE_ID`   | `MATRIX_<ID>_DEVICE_ID`                            |
| `MATRIX_DEVICE_NAME` | `MATRIX_<ID>_DEVICE_NAME`                          |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                        |

Para a conta `ops`, os nomes se tornam `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e assim por diante. As variáveis de ambiente de chave de recuperação são lidas por fluxos da CLI cientes de recuperação (`verify backup restore`, `verify device`, `verify bootstrap`) quando você encaminha a chave via `--recovery-key-stdin`.

`MATRIX_HOMESERVER` não pode ser definido a partir de um `.env` de workspace; consulte [Arquivos `.env` de workspace](/pt-BR/gateway/security).

## Exemplo de configuração

Uma base prática com pareamento de DM, lista de permissão de salas e E2EE:

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

## Prévias em streaming

O streaming de respostas do Matrix é opcional. `streaming` controla como o OpenClaw entrega a resposta em andamento do assistente; `blockStreaming` controla se cada bloco concluído é preservado como sua própria mensagem Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Para manter prévias de respostas ao vivo, mas ocultar linhas intermediárias de ferramenta/progresso, use o formato de objeto:

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

| `streaming`       | Comportamento                                                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (padrão)  | Aguarda a resposta completa e envia uma vez. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                               |
| `"partial"`       | Edita uma mensagem de texto normal no lugar conforme o modelo escreve o bloco atual. Clientes Matrix padrão podem notificar na primeira prévia, não na edição final. |
| `"quiet"`         | Igual a `"partial"`, mas a mensagem é um aviso sem notificação. Destinatários só recebem uma notificação quando uma regra de push por usuário corresponde à edição finalizada (veja abaixo). |

`blockStreaming` é independente de `streaming`:

| `streaming`             | `blockStreaming: true`                                                | `blockStreaming: false` (padrão)                    |
| ----------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| `"partial"` / `"quiet"` | Rascunho ao vivo para o bloco atual, blocos concluídos mantidos como mensagens | Rascunho ao vivo para o bloco atual, finalizado no lugar |
| `"off"`                 | Uma mensagem Matrix com notificação por bloco concluído               | Uma mensagem Matrix com notificação para a resposta completa |

Observações:

- Se uma prévia ultrapassar o limite de tamanho por evento do Matrix, o OpenClaw interrompe o streaming de prévia e volta para entrega apenas final.
- Respostas de mídia sempre enviam anexos normalmente. Se uma prévia obsoleta não puder mais ser reutilizada com segurança, o OpenClaw a redige antes de enviar a resposta final de mídia.
- Atualizações de prévia de progresso de ferramentas são habilitadas por padrão quando o streaming de prévia do Matrix está ativo. Defina `streaming.preview.toolProgress: false` para manter edições de prévia para texto de resposta, mas deixar o progresso de ferramentas no caminho normal de entrega.
- Edições de prévia custam chamadas extras à API do Matrix. Deixe `streaming: "off"` se quiser o perfil de limite de taxa mais conservador.

## Metadados de aprovação

Prompts de aprovação nativos do Matrix são eventos `m.room.message` normais com conteúdo de evento personalizado específico do OpenClaw em `com.openclaw.approval`. O Matrix permite chaves personalizadas de conteúdo de evento, então clientes padrão ainda renderizam o corpo de texto enquanto clientes cientes do OpenClaw podem ler o ID de aprovação estruturado, tipo, estado, decisões disponíveis e detalhes de exec/Plugin.

Quando um prompt de aprovação é longo demais para um evento Matrix, o OpenClaw divide o texto visível em partes e anexa `com.openclaw.approval` apenas à primeira parte. Reações para decisões de permitir/negar são vinculadas a esse primeiro evento, então prompts longos mantêm o mesmo destino de aprovação que prompts de evento único.

### Regras de push auto-hospedadas para prévias finalizadas silenciosas

`streaming: "quiet"` só notifica destinatários quando um bloco ou turno é finalizado — uma regra de push por usuário precisa corresponder ao marcador de prévia finalizada. Consulte [Regras de push do Matrix para prévias silenciosas](/pt-BR/channels/matrix-push-rules) para a receita completa (token do destinatário, verificação de pusher, instalação da regra, observações por homeserver).

## Salas bot-para-bot

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

- `allowBots: true` aceita mensagens de outras contas de bot Matrix configuradas em salas e DMs permitidas.
- `allowBots: "mentions"` aceita essas mensagens apenas quando elas mencionam visivelmente este bot em salas. DMs ainda são permitidas.
- `groups.<room>.allowBots` substitui a configuração no nível da conta para uma sala.
- O OpenClaw ainda ignora mensagens do mesmo ID de usuário Matrix para evitar ciclos de autorresposta.
- O Matrix não expõe uma flag nativa de bot aqui; o OpenClaw trata "criado por bot" como "enviado por outra conta Matrix configurada neste Gateway OpenClaw".

Use listas de permissão de salas rigorosas e requisitos de menção ao habilitar tráfego bot-para-bot em salas compartilhadas.

## Criptografia e verificação

Em salas criptografadas (E2EE), eventos de imagem de saída usam `thumbnail_file` para que as pré-visualizações de imagem sejam criptografadas junto com o anexo completo. Salas não criptografadas ainda usam `thumbnail_url` simples. Nenhuma configuração é necessária — o plugin detecta o estado de E2EE automaticamente.

Todos os comandos `openclaw matrix` aceitam `--verbose` (diagnósticos completos), `--json` (saída legível por máquina) e `--account <id>` (configurações com várias contas). A saída é concisa por padrão, com logs internos silenciosos do SDK. Os exemplos abaixo mostram a forma canônica; adicione as flags conforme necessário.

### Habilitar criptografia

```bash
openclaw matrix encryption setup
```

Inicializa o armazenamento secreto e a assinatura cruzada, cria um backup de chaves de sala se necessário e então imprime o status e os próximos passos. Flags úteis:

- `--recovery-key <key>` aplica uma chave de recuperação antes da inicialização (prefira a forma via stdin documentada abaixo)
- `--force-reset-cross-signing` descarta a identidade atual de assinatura cruzada e cria uma nova (use apenas intencionalmente)

Para uma nova conta, habilite E2EE no momento da criação:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` é um alias para `--enable-e2ee`.

Configuração manual equivalente:

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
- `Cross-signing verified`: o SDK relata verificação por assinatura cruzada
- `Signed by owner`: assinado pela sua própria chave de autoassinatura (apenas diagnóstico)

`Verified by owner` se torna `yes` apenas quando `Cross-signing verified` é `yes`. Confiança local ou uma assinatura do proprietário isoladamente não é suficiente.

`--allow-degraded-local-state` retorna diagnósticos de melhor esforço sem preparar primeiro a conta Matrix; útil para sondagens offline ou parcialmente configuradas.

### Verificar este dispositivo com uma chave de recuperação

A chave de recuperação é sensível — passe-a via stdin em vez de informá-la na linha de comando. Defina `MATRIX_RECOVERY_KEY` (ou `MATRIX_<ID>_RECOVERY_KEY` para uma conta nomeada):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

O comando relata três estados:

- `Recovery key accepted`: o Matrix aceitou a chave para armazenamento secreto ou confiança do dispositivo.
- `Backup usable`: o backup de chaves de sala pode ser carregado com o material de recuperação confiável.
- `Device verified by owner`: este dispositivo tem confiança total da identidade de assinatura cruzada do Matrix.

Ele sai com código diferente de zero quando a confiança total da identidade está incompleta, mesmo que a chave de recuperação tenha desbloqueado material de backup. Nesse caso, conclua a autoverificação a partir de outro cliente Matrix:

```bash
openclaw matrix verify self
```

`verify self` aguarda `Cross-signing verified: yes` antes de sair com sucesso. Use `--timeout-ms <ms>` para ajustar a espera.

A forma com chave literal `openclaw matrix verify device "<recovery-key>"` também é aceita, mas a chave acaba no histórico do seu shell.

### Inicializar ou reparar assinatura cruzada

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` é o comando de reparo e configuração para contas criptografadas. Em ordem, ele:

- inicializa o armazenamento secreto, reutilizando uma chave de recuperação existente quando possível
- inicializa a assinatura cruzada e envia chaves públicas ausentes
- marca e assina de forma cruzada o dispositivo atual
- cria um backup de chaves de sala no servidor se ainda não existir

Se o homeserver exigir UIA para enviar chaves de assinatura cruzada, o OpenClaw tenta primeiro sem autenticação, depois `m.login.dummy` e então `m.login.password` (requer `channels.matrix.password`).

Flags úteis:

- `--recovery-key-stdin` (combine com `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) ou `--recovery-key <key>`
- `--force-reset-cross-signing` para descartar a identidade atual de assinatura cruzada (somente intencional)

### Backup de chaves de sala

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` mostra se existe um backup no servidor e se este dispositivo consegue descriptografá-lo. `backup restore` importa chaves de sala em backup para o armazenamento criptográfico local; se a chave de recuperação já estiver em disco, você pode omitir `--recovery-key-stdin`.

Para substituir um backup corrompido por uma linha de base nova (aceita perder histórico antigo irrecuperável; também pode recriar o armazenamento secreto se o segredo do backup atual não puder ser carregado):

```bash
openclaw matrix verify backup reset --yes
```

Adicione `--rotate-recovery-key` apenas quando você quiser intencionalmente que a chave de recuperação anterior pare de desbloquear a nova linha de base de backup.

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

Para gerenciamento de ciclo de vida de nível mais baixo — normalmente ao acompanhar solicitações recebidas de outro cliente — estes comandos atuam em uma solicitação específica `<id>` (impressa por `verify list` e `verify request`):

| Comando                                    | Finalidade                                                          |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Aceitar uma solicitação recebida                                    |
| `openclaw matrix verify start <id>`        | Iniciar o fluxo SAS                                                 |
| `openclaw matrix verify sas <id>`          | Imprimir os emojis ou decimais SAS                                  |
| `openclaw matrix verify confirm-sas <id>`  | Confirmar que o SAS corresponde ao que o outro cliente mostra       |
| `openclaw matrix verify mismatch-sas <id>` | Rejeitar o SAS quando os emojis ou decimais não correspondem        |
| `openclaw matrix verify cancel <id>`       | Cancelar; aceita `--reason <text>` e `--code <matrix-code>` opcionais |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` aceitam `--user-id` e `--room-id` como dicas de acompanhamento de DM quando a verificação está vinculada a uma sala específica de mensagem direta.

### Observações sobre várias contas

Sem `--account <id>`, os comandos da CLI Matrix usam a conta padrão implícita. Se você tiver várias contas nomeadas e não tiver definido `channels.matrix.defaultAccount`, eles se recusarão a adivinhar e pedirão que você escolha. Quando E2EE estiver desabilitado ou indisponível para uma conta nomeada, os erros apontam para a chave de configuração dessa conta, por exemplo `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamento de inicialização">
    Com `encryption: true`, `startupVerification` assume `"if-unverified"` por padrão. Na inicialização, um dispositivo não verificado solicita autoverificação em outro cliente Matrix, ignorando duplicatas e aplicando um intervalo de espera (24 horas por padrão). Ajuste com `startupVerificationCooldownHours` ou desabilite com `startupVerification: "off"`.

    A inicialização também executa uma passagem conservadora de bootstrap criptográfico que reutiliza o armazenamento secreto atual e a identidade de assinatura cruzada. Se o estado de bootstrap estiver corrompido, o OpenClaw tenta um reparo protegido mesmo sem `channels.matrix.password`; se o homeserver exigir UIA com senha, a inicialização registra um aviso e permanece não fatal. Dispositivos já assinados pelo proprietário são preservados.

    Consulte [Migração do Matrix](/pt-BR/channels/matrix-migration) para o fluxo completo de atualização.

  </Accordion>

  <Accordion title="Avisos de verificação">
    O Matrix publica avisos de ciclo de vida da verificação na sala de verificação de DM estrita como mensagens `m.notice`: solicitação, pronto (com orientação "Verify by emoji"), início/conclusão e detalhes de SAS (emoji/decimal) quando disponíveis.

    Solicitações recebidas de outro cliente Matrix são rastreadas e aceitas automaticamente. Para autoverificação, o OpenClaw inicia o fluxo SAS automaticamente e confirma seu próprio lado assim que a verificação por emoji estiver disponível — você ainda precisa comparar e confirmar "They match" no seu cliente Matrix.

    Avisos do sistema de verificação não são encaminhados para o pipeline de chat do agente.

  </Accordion>

  <Accordion title="Dispositivo Matrix excluído ou inválido">
    Se `verify status` disser que o dispositivo atual não está mais listado no homeserver, crie um novo dispositivo Matrix do OpenClaw. Para login por senha:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para autenticação por token, crie um token de acesso novo no seu cliente Matrix ou na interface de administração e então atualize o OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Substitua `assistant` pelo ID da conta do comando que falhou, ou omita `--account` para a conta padrão.

  </Accordion>

  <Accordion title="Higiene de dispositivos">
    Dispositivos antigos gerenciados pelo OpenClaw podem se acumular. Liste e remova:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Armazenamento criptográfico">
    O E2EE do Matrix usa o caminho criptográfico Rust oficial do `matrix-js-sdk` com `fake-indexeddb` como shim de IndexedDB. O estado criptográfico persiste em `crypto-idb-snapshot.json` (permissões de arquivo restritivas).

    O estado de runtime criptografado fica em `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e inclui o armazenamento de sincronização, armazenamento criptográfico, chave de recuperação, snapshot de IDB, vínculos de threads e estado de verificação na inicialização. Quando o token muda, mas a identidade da conta permanece a mesma, o OpenClaw reutiliza a melhor raiz existente para que o estado anterior continue visível.

  </Accordion>
</AccordionGroup>

## Gerenciamento de perfil

Atualize o perfil próprio do Matrix para a conta selecionada:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Você pode passar as duas opções em uma única chamada. O Matrix aceita URLs de avatar `mxc://` diretamente; quando você passa `http://` ou `https://`, o OpenClaw primeiro envia o arquivo e armazena a URL `mxc://` resolvida em `channels.matrix.avatarUrl` (ou na substituição por conta).

## Threads

O Matrix oferece suporte a threads nativas do Matrix tanto para respostas automáticas quanto para envios por ferramentas de mensagem. Dois controles independentes definem o comportamento:

### Roteamento de sessão (`sessionScope`)

`dm.sessionScope` decide como salas de DM Matrix são mapeadas para sessões do OpenClaw:

- `"per-user"` (padrão): todas as salas de DM com o mesmo par roteado compartilham uma sessão.
- `"per-room"`: cada sala de DM Matrix recebe sua própria chave de sessão, mesmo quando o par é o mesmo.

Vínculos explícitos de conversa sempre têm precedência sobre `sessionScope`, então salas e threads vinculadas mantêm sua sessão de destino escolhida.

### Encadeamento de respostas (`threadReplies`)

`threadReplies` decide onde o bot publica sua resposta:

- `"off"`: as respostas ficam no nível superior. Mensagens recebidas em threads permanecem na sessão pai.
- `"inbound"`: responde dentro de uma thread apenas quando a mensagem recebida já estava nessa thread.
- `"always"`: responde dentro de uma thread enraizada na mensagem acionadora; essa conversa é roteada por uma sessão correspondente com escopo de thread a partir do primeiro acionamento.

`dm.threadReplies` substitui isso apenas para DMs — por exemplo, manter threads de sala isoladas enquanto mantém DMs planas.

### Herança de threads e comandos de barra

- Mensagens encadeadas de entrada incluem a mensagem raiz da thread como contexto extra para o agente.
- Envios pela ferramenta de mensagem herdam automaticamente a thread atual do Matrix ao direcionar para a mesma sala (ou o mesmo destino de usuário por DM), a menos que um `threadId` explícito seja fornecido.
- A reutilização de destino de usuário por DM só entra em ação quando os metadados da sessão atual comprovam o mesmo par de DM na mesma conta do Matrix; caso contrário, o OpenClaw recorre ao roteamento normal com escopo de usuário.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vinculado a thread funcionam em salas e DMs do Matrix.
- `/focus` de nível superior cria uma nova thread do Matrix e a vincula à sessão de destino quando `threadBindings.spawnSubagentSessions: true`.
- Executar `/focus` ou `/acp spawn --thread here` dentro de uma thread existente do Matrix vincula essa thread no local.

Quando o OpenClaw detecta uma sala de DM do Matrix colidindo com outra sala de DM na mesma sessão compartilhada, ele publica um `m.notice` único nessa sala apontando para a saída de emergência `/focus` e sugerindo uma alteração em `dm.sessionScope`. O aviso aparece somente quando vínculos de thread estão habilitados.

## Vínculos de conversas ACP

Salas, DMs e threads existentes do Matrix podem ser transformadas em áreas de trabalho ACP duráveis sem alterar a superfície de chat.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM, sala ou thread existente do Matrix que você quer continuar usando.
- Em uma DM ou sala de nível superior do Matrix, a DM/sala atual permanece como a superfície de chat, e mensagens futuras são roteadas para a sessão ACP gerada.
- Dentro de uma thread existente do Matrix, `--bind here` vincula essa thread atual no local.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove o vínculo.

Observações:

- `--bind here` não cria uma thread filha do Matrix.
- `threadBindings.spawnAcpSessions` só é obrigatório para `/acp spawn --thread auto|here`, quando o OpenClaw precisa criar ou vincular uma thread filha do Matrix.

### Configuração de vínculo de thread

O Matrix herda padrões globais de `session.threadBindings` e também aceita substituições por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Flags de geração vinculada a thread do Matrix são opt-in:

- Defina `threadBindings.spawnSubagentSessions: true` para permitir que `/focus` de nível superior crie e vincule novas threads do Matrix.
- Defina `threadBindings.spawnAcpSessions: true` para permitir que `/acp spawn --thread auto|here` vincule sessões ACP a threads do Matrix.

## Reações

O Matrix aceita reações de saída, notificações de reação de entrada e reações de confirmação.

A ferramenta de reação de saída é controlada por `channels.matrix.actions.reactions`:

- `react` adiciona uma reação a um evento do Matrix.
- `reactions` lista o resumo atual de reações para um evento do Matrix.
- `emoji=""` remove as próprias reações do bot nesse evento.
- `remove: true` remove apenas a reação do emoji especificado do bot.

**Ordem de resolução** (o primeiro valor definido vence):

| Configuração           | Ordem                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| `ackReaction`          | por conta → canal → `messages.ackReaction` → fallback para emoji de identidade do agente   |
| `ackReactionScope`     | por conta → canal → `messages.ackReactionScope` → padrão `"group-mentions"`                |
| `reactionNotifications` | por conta → canal → padrão `"own"`                                                        |

`reactionNotifications: "own"` encaminha eventos `m.reaction` adicionados quando eles miram mensagens do Matrix criadas pelo bot; `"off"` desabilita eventos do sistema de reações. Remoções de reação não são sintetizadas em eventos do sistema porque o Matrix as expõe como redações, não como remoções independentes de `m.reaction`.

## Contexto de histórico

- `channels.matrix.historyLimit` controla quantas mensagens recentes da sala são incluídas como `InboundHistory` quando uma mensagem de sala do Matrix aciona o agente. Recorre a `messages.groupChat.historyLimit`; se ambos não estiverem definidos, o padrão efetivo é `0`. Defina `0` para desabilitar.
- O histórico de sala do Matrix é apenas da sala. DMs continuam usando o histórico normal da sessão.
- O histórico de sala do Matrix é apenas pendente: o OpenClaw armazena em buffer mensagens da sala que ainda não acionaram uma resposta e então captura uma imagem dessa janela quando uma menção ou outro acionador chega.
- A mensagem acionadora atual não é incluída em `InboundHistory`; ela permanece no corpo principal de entrada para esse turno.
- Tentativas repetidas do mesmo evento do Matrix reutilizam a captura de histórico original em vez de avançar para mensagens mais novas da sala.

## Visibilidade de contexto

O Matrix aceita o controle compartilhado `contextVisibility` para contexto suplementar da sala, como texto de resposta buscado, raízes de thread e histórico pendente.

- `contextVisibility: "all"` é o padrão. O contexto suplementar é mantido como recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações de lista de permissões de sala/usuário ativas.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta explicitamente citada.

Essa configuração afeta a visibilidade do contexto suplementar, não se a própria mensagem de entrada pode acionar uma resposta.
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

Para silenciar DMs completamente enquanto mantém salas funcionando, defina `dm.enabled: false`:

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

Consulte [Grupos](/pt-BR/channels/groups) para comportamento de controle por menção e lista de permissões.

Exemplo de pareamento para DMs do Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se um usuário não aprovado do Matrix continuar enviando mensagens antes da aprovação, o OpenClaw reutiliza o mesmo código de pareamento pendente e pode enviar uma resposta de lembrete após um breve cooldown em vez de emitir um novo código.

Consulte [Pareamento](/pt-BR/channels/pairing) para o fluxo compartilhado de pareamento por DM e o layout de armazenamento.

## Reparo de sala direta

Se o estado de mensagem direta sair de sincronia, o OpenClaw pode acabar com mapeamentos `m.direct` obsoletos que apontam para salas individuais antigas em vez da DM ativa. Inspecione o mapeamento atual para um par:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repare:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Ambos os comandos aceitam `--account <id>` para configurações com várias contas. O fluxo de reparo:

- prefere uma DM estrita 1:1 que já esteja mapeada em `m.direct`
- recorre a qualquer DM estrita 1:1 atualmente ingressada com esse usuário
- cria uma nova sala direta e reescreve `m.direct` se nenhuma DM saudável existir

Ele não exclui salas antigas automaticamente. Ele escolhe a DM saudável e atualiza o mapeamento para que futuros envios do Matrix, avisos de verificação e outros fluxos de mensagem direta direcionem para a sala correta.

## Aprovações de exec

O Matrix pode atuar como um cliente de aprovação nativo. Configure em `channels.matrix.execApprovals` (ou `channels.matrix.accounts.<account>.execApprovals` para uma substituição por conta):

- `enabled`: entrega aprovações por prompts nativos do Matrix. Quando não definido ou `"auto"`, o Matrix habilita automaticamente assim que pelo menos um aprovador puder ser resolvido. Defina `false` para desabilitar explicitamente.
- `approvers`: IDs de usuário do Matrix (`@owner:example.org`) autorizados a aprovar solicitações de exec. Opcional — recorre a `channels.matrix.dm.allowFrom`.
- `target`: para onde os prompts vão. `"dm"` (padrão) envia para DMs de aprovadores; `"channel"` envia para a sala ou DM de origem do Matrix; `"both"` envia para ambos.
- `agentFilter` / `sessionFilter`: listas de permissões opcionais para quais agentes/sessões acionam entrega pelo Matrix.

A autorização difere um pouco entre tipos de aprovação:

- **Aprovações de exec** usam `execApprovals.approvers`, com fallback para `dm.allowFrom`.
- **Aprovações de Plugin** autorizam somente por meio de `dm.allowFrom`.

Ambos os tipos compartilham atalhos de reação e atualizações de mensagem do Matrix. Aprovadores veem atalhos de reação na mensagem principal de aprovação:

- `✅` permitir uma vez
- `❌` negar
- `♾️` permitir sempre (quando a política efetiva de exec permitir)

Comandos slash de fallback: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Somente aprovadores resolvidos podem aprovar ou negar. A entrega em canal para aprovações de exec inclui o texto do comando — habilite `channel` ou `both` apenas em salas confiáveis.

Relacionado: [Aprovações de exec](/pt-BR/tools/exec-approvals).

## Comandos slash

Comandos slash (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve`, etc.) funcionam diretamente em DMs. Em salas, o OpenClaw também reconhece comandos prefixados com a própria menção do bot no Matrix, então `@bot:server /new` aciona o caminho de comando sem uma regex de menção personalizada. Isso mantém o bot responsivo a publicações no estilo de sala `@mention /command` que o Element e clientes semelhantes emitem quando um usuário usa preenchimento por tab para o bot antes de digitar o comando.

As regras de autorização ainda se aplicam: remetentes de comandos devem atender às mesmas políticas de lista de permissões/proprietário de DM ou sala que mensagens simples.

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

- Valores de nível superior em `channels.matrix` atuam como padrões para contas nomeadas, a menos que uma conta os substitua.
- Defina o escopo de uma entrada de sala herdada para uma conta específica com `groups.<room>.account`. Entradas sem `account` são compartilhadas entre contas; `account: "default"` ainda funciona quando a conta padrão é configurada no nível superior.

**Seleção de conta padrão:**

- Defina `defaultAccount` para escolher a conta nomeada que roteamento implícito, sondagem e comandos da CLI preferem.
- Se você tiver várias contas e uma se chamar literalmente `default`, o OpenClaw a usa implicitamente mesmo quando `defaultAccount` não estiver definido.
- Se você tiver várias contas nomeadas e nenhuma padrão estiver selecionada, comandos da CLI se recusam a adivinhar — defina `defaultAccount` ou passe `--account <id>`.
- O bloco de nível superior `channels.matrix.*` só é tratado como a conta `default` implícita quando sua autenticação está completa (`homeserver` + `accessToken`, ou `homeserver` + `userId` + `password`). Contas nomeadas continuam detectáveis a partir de `homeserver` + `userId` assim que credenciais em cache cobrirem a autenticação.

**Promoção:**

- Quando o OpenClaw promove uma configuração de conta única para várias contas durante reparo ou configuração, ele preserva a conta nomeada existente se houver uma ou se `defaultAccount` já apontar para uma. Apenas chaves de autenticação/bootstrap do Matrix são movidas para a conta promovida; chaves compartilhadas de política de entrega permanecem no nível superior.

Consulte [Referência de configuração](/pt-BR/gateway/config-channels#multi-account-all-channels) para o padrão compartilhado de várias contas.

## Homeservers privados/LAN

Por padrão, o OpenClaw bloqueia homeservers privados/internos do Matrix para proteção contra SSRF, a menos que você
opte explicitamente por conta.

Se o seu homeserver roda em localhost, em um IP de LAN/Tailscale ou em um hostname interno, habilite
`network.dangerouslyAllowPrivateNetwork` para essa conta do Matrix:

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

Exemplo de configuração da CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Essa opção explícita permite apenas destinos privados/internos confiáveis. Homeservers públicos em texto claro, como
`http://matrix.example.org:8008`, continuam bloqueados. Prefira `https://` sempre que possível.

## Fazer proxy do tráfego do Matrix

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
O OpenClaw usa a mesma configuração de proxy para tráfego do Matrix em tempo de execução e sondagens de status da conta.

## Resolução de destino

O Matrix aceita estas formas de destino em qualquer lugar em que o OpenClaw peça uma sala ou um usuário de destino:

- Usuários: `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Apelidos: `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Use exatamente a mesma capitalização do ID de sala do Matrix
ao configurar destinos de entrega explícitos, tarefas Cron, vínculos ou listas de permissões.
O OpenClaw mantém chaves de sessão internas canônicas para armazenamento, portanto essas chaves em minúsculas
não são uma fonte confiável para IDs de entrega do Matrix.

A consulta de diretório ao vivo usa a conta do Matrix conectada:

- Consultas de usuários pesquisam o diretório de usuários do Matrix nesse homeserver.
- Consultas de sala aceitam IDs de sala e apelidos explícitos diretamente e depois recorrem à busca nos nomes das salas ingressadas dessa conta.
- A consulta de nomes de salas ingressadas é de melhor esforço. Se um nome de sala não puder ser resolvido para um ID ou apelido, ele será ignorado pela resolução de lista de permissões em tempo de execução.

## Referência de configuração

Campos no estilo lista de permissões (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) aceitam IDs de usuário completos do Matrix (mais seguro). Correspondências exatas de diretório são resolvidas na inicialização e sempre que a lista de permissões muda enquanto o monitor está em execução; entradas que não podem ser resolvidas são ignoradas em tempo de execução. Listas de permissões de sala preferem IDs de sala ou apelidos pelo mesmo motivo.

### Conta e conexão

- `enabled`: habilita ou desabilita o canal.
- `name`: rótulo de exibição opcional para a conta.
- `defaultAccount`: ID de conta preferido quando várias contas do Matrix estão configuradas.
- `accounts`: substituições nomeadas por conta. Valores de nível superior de `channels.matrix` são herdados como padrões.
- `homeserver`: URL do homeserver, por exemplo `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta conta se conecte a `localhost`, IPs de LAN/Tailscale ou nomes de host internos.
- `proxy`: URL opcional de proxy HTTP(S) para tráfego do Matrix. Substituição por conta compatível.
- `userId`: ID de usuário completo do Matrix (`@bot:example.org`).
- `accessToken`: token de acesso para autenticação baseada em token. Valores em texto claro e SecretRef são compatíveis entre provedores env/file/exec ([Gerenciamento de segredos](/pt-BR/gateway/secrets)).
- `password`: senha para login baseado em senha. Valores em texto claro e SecretRef são compatíveis.
- `deviceId`: ID de dispositivo explícito do Matrix.
- `deviceName`: nome de exibição do dispositivo usado no momento do login por senha.
- `avatarUrl`: URL de avatar próprio armazenada para sincronização de perfil e atualizações de `profile set`.
- `initialSyncLimit`: número máximo de eventos buscados durante a sincronização de inicialização.

### Criptografia

- `encryption`: habilita E2EE. Padrão: `false`.
- `startupVerification`: `"if-unverified"` (padrão quando E2EE está ativado) ou `"off"`. Solicita automaticamente a autoverificação na inicialização quando este dispositivo não foi verificado.
- `startupVerificationCooldownHours`: intervalo de espera antes da próxima solicitação automática na inicialização. Padrão: `24`.

### Acesso e política

- `groupPolicy`: `"open"`, `"allowlist"` ou `"disabled"`. Padrão: `"allowlist"`.
- `groupAllowFrom`: lista de permissões de IDs de usuário para tráfego de sala.
- `dm.enabled`: quando `false`, ignora todas as DMs. Padrão: `true`.
- `dm.policy`: `"pairing"` (padrão), `"allowlist"`, `"open"` ou `"disabled"`. Aplica-se depois que o bot entrou e classificou a sala como DM; não afeta o tratamento de convites.
- `dm.allowFrom`: lista de permissões de IDs de usuário para tráfego de DM.
- `dm.sessionScope`: `"per-user"` (padrão) ou `"per-room"`.
- `dm.threadReplies`: substituição somente para DM para encadeamento de respostas (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: aceita mensagens de outras contas de bot do Matrix configuradas (`true` ou `"mentions"`).
- `allowlistOnly`: quando `true`, força todas as políticas de DM ativas (exceto `"disabled"`) e políticas de grupo `"open"` para `"allowlist"`. Não altera políticas `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` ou `"off"`. Padrão: `"off"`. Aplica-se a todos os convites do Matrix, incluindo convites no estilo DM.
- `autoJoinAllowlist`: salas/apelidos permitidos quando `autoJoin` é `"allowlist"`. Entradas de apelido são resolvidas em relação ao homeserver, não em relação ao estado declarado pela sala que enviou o convite.
- `contextVisibility`: visibilidade de contexto suplementar (`"all"` por padrão, `"allowlist"`, `"allowlist_quote"`).

### Comportamento de resposta

- `replyToMode`: `"off"`, `"first"`, `"all"` ou `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` ou `"always"`.
- `threadBindings`: substituições por canal para roteamento e ciclo de vida de sessões vinculadas a thread.
- `streaming`: `"off"` (padrão), `"partial"`, `"quiet"` ou forma de objeto `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: quando `true`, blocos concluídos do assistente são mantidos como mensagens de progresso separadas.
- `markdown`: configuração opcional de renderização de Markdown para texto de saída.
- `responsePrefix`: string opcional prefixada às respostas de saída.
- `textChunkLimit`: tamanho de fragmento de saída em caracteres quando `chunkMode: "length"`. Padrão: `4000`.
- `chunkMode`: `"length"` (padrão, divide por contagem de caracteres) ou `"newline"` (divide em limites de linha).
- `historyLimit`: número de mensagens recentes da sala incluídas como `InboundHistory` quando uma mensagem de sala aciona o agente. Recorre a `messages.groupChat.historyLimit`; padrão efetivo `0` (desabilitado).
- `mediaMaxMb`: limite de tamanho de mídia em MB para envios de saída e processamento de entrada.

### Configurações de reação

- `ackReaction`: substituição de reação de confirmação para este canal/conta.
- `ackReactionScope`: substituição de escopo (`"group-mentions"` por padrão, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modo de notificação de reações de entrada (`"own"` por padrão, `"off"`).

### Ferramentas e substituições por sala

- `actions`: controle de ferramentas por ação (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa de políticas por sala. A identidade da sessão usa o ID de sala estável após a resolução. (`rooms` é um alias legado.)
  - `groups.<room>.account`: restringe uma entrada de sala herdada a uma conta específica.
  - `groups.<room>.allowBots`: substituição por sala da configuração em nível de canal (`true` ou `"mentions"`).
  - `groups.<room>.users`: lista de permissões de remetentes por sala.
  - `groups.<room>.tools`: substituições de permitir/negar ferramentas por sala.
  - `groups.<room>.autoReply`: substituição por sala do controle por menções. `true` desabilita requisitos de menção para essa sala; `false` força sua reativação.
  - `groups.<room>.skills`: filtro de Skills por sala.
  - `groups.<room>.systemPrompt`: trecho de prompt do sistema por sala.

### Configurações de aprovação de exec

- `execApprovals.enabled`: entrega aprovações de exec por meio de prompts nativos do Matrix.
- `execApprovals.approvers`: IDs de usuário do Matrix autorizados a aprovar. Recorre a `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (padrão), `"channel"` ou `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: listas de permissões opcionais de agente/sessão para entrega.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e fortalecimento
