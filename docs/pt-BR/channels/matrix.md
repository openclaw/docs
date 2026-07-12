---
read_when:
    - Configurando o Matrix no OpenClaw
    - Configurando a E2EE e a verificação do Matrix
summary: Status do suporte ao Matrix, configuração e exemplos de configuração
title: Matriz
x-i18n:
    generated_at: "2026-07-11T23:44:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42f1775d1f92198d1eafdd8f3e07fcb6921bdc4a5c095ce3e793c260e037e06f
    source_path: channels/matrix.md
    workflow: 16
---

Matrix é um Plugin de canal para download (`@openclaw/matrix`), criado com base no `matrix-js-sdk` oficial. Ele oferece suporte a mensagens diretas, salas, threads, mídia, reações, enquetes, localização e E2EE.

## Instalação

```bash
openclaw plugins install @openclaw/matrix
```

Especificações de Plugin sem prefixo tentam primeiro o ClawHub e, depois, recorrem ao npm. Force uma origem com `openclaw plugins install clawhub:@openclaw/matrix` ou `npm:@openclaw/matrix`. A partir de um checkout local: `openclaw plugins install ./path/to/local/matrix-plugin`.

`plugins install` registra e ativa o Plugin; nenhuma etapa separada de `enable` é necessária. O canal ainda não faz nada até ser configurado conforme descrito abaixo. Consulte [Plugins](/pt-BR/tools/plugin) para ver as regras gerais de instalação.

## Configuração

1. Crie uma conta do Matrix em seu servidor de origem.
2. Configure `channels.matrix` com `homeserver` + `accessToken` ou `homeserver` + `userId` + `password`.
3. Reinicie o Gateway.
4. Inicie uma mensagem direta com o robô ou convide-o para uma sala. Novos convites só são aceitos quando [`autoJoin`](#auto-join) permite.

### Configuração interativa

```bash
openclaw channels add
openclaw configure --section channels
```

O assistente solicita a URL do servidor de origem, o método de autenticação (token ou senha), a ID do usuário (somente para autenticação por senha), um nome opcional para o dispositivo, se a E2EE deve ser ativada e as opções de acesso/entrada automática em salas. Se já existirem variáveis de ambiente `MATRIX_*` correspondentes e a conta não tiver autenticação salva, o assistente oferece um atalho para usar as variáveis de ambiente. Resolva os nomes das salas antes de salvar uma lista de permissões com `openclaw channels resolve --channel matrix "Project Room"`. Ativar a E2EE no assistente executa a mesma inicialização que [`openclaw matrix encryption setup`](#encryption-and-verification).

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

O padrão de `channels.matrix.autoJoin` é `"off"`: o robô não aparecerá em novas salas nem em mensagens diretas provenientes de novos convites até que você entre manualmente. No momento do convite, o OpenClaw não consegue determinar se ele corresponde a uma mensagem direta ou a um grupo; portanto, todo convite passa primeiro por `autoJoin`. `dm.policy` só é aplicado depois, após o robô entrar e a sala ser classificada.

<Warning>
Defina `autoJoin: "allowlist"` junto com `autoJoinAllowlist` para restringir os convites aceitos ou `autoJoin: "always"` para aceitar todos os convites.

`autoJoinAllowlist` aceita somente `!roomId:server`, `#alias:server` ou `*`. Nomes simples de salas são rejeitados; os aliases são resolvidos no servidor de origem, e não com base no estado alegado pela sala que enviou o convite.
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

### Formatos de destino da lista de permissões

- Mensagens diretas (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): use `@user:server`. Nomes de exibição são ignorados por padrão, pois podem ser alterados; defina `dangerouslyAllowNameMatching: true` somente para compatibilidade explícita com nomes de exibição.
- Chaves da lista de permissões de salas (`groups`, alias legado `rooms`): use `!room:server` ou `#alias:server`. Nomes simples são ignorados, a menos que `dangerouslyAllowNameMatching: true`.
- Listas de permissões de convites (`autoJoinAllowlist`): use `!room:server`, `#alias:server` ou `*`. Nomes simples são sempre rejeitados.

### Normalização da ID da conta

O assistente converte um nome amigável em uma ID de conta normalizada (`Ops Bot` -> `ops-bot`). A pontuação é escapada em hexadecimal nos nomes de variáveis de ambiente com escopo para evitar colisões entre contas: `-` (0x2D) se torna `_X2D_`; portanto, `ops-prod` corresponde ao prefixo de ambiente `MATRIX_OPS_X2D_PROD_`.

### Credenciais em cache

O Matrix armazena credenciais em cache em `~/.openclaw/credentials/matrix/`: `credentials.json` para a conta padrão e `credentials-<account>.json` para contas nomeadas. Quando existem credenciais em cache, o OpenClaw considera o Matrix configurado mesmo sem um `accessToken` no arquivo de configuração — isso abrange a configuração, o `openclaw doctor` e as verificações de status do canal.

### Variáveis de ambiente

Variáveis de ambiente associadas a chaves de configuração, usadas quando a chave equivalente não está definida. A conta padrão usa nomes sem prefixo; contas nomeadas inserem o token da conta antes do sufixo (consulte [normalização](#account-id-normalization)).

| Conta padrão          | Conta nomeada (`<ID>` = token da conta) |
| --------------------- | --------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`              |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                   |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                  |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                 |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`               |

Para a conta `ops`, os nomes se tornam `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` e assim por diante. `MATRIX_HOMESERVER` e qualquer variante `*_HOMESERVER` com escopo não podem ser definidos por meio de um arquivo `.env` do espaço de trabalho; consulte [Arquivos `.env` do espaço de trabalho](/pt-BR/gateway/security).

<Note>
A chave de recuperação não é uma variável de ambiente associada à configuração: o OpenClaw nunca a lê diretamente do ambiente. O texto de orientação da CLI sugere encaminhá-la por uma variável do shell chamada `MATRIX_RECOVERY_KEY` para a conta padrão ou `MATRIX_RECOVERY_KEY_<ID>` para uma conta nomeada, usando a ID simples da conta em maiúsculas e sem escape hexadecimal — consulte [Verificar este dispositivo com uma chave de recuperação](#verify-this-device-with-a-recovery-key).
</Note>

## Exemplo de configuração

Uma base prática com pareamento de mensagens diretas, lista de permissões de salas e E2EE:

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

## Pré-visualizações de transmissão

A transmissão de respostas no Matrix é opcional. `streaming` controla como o OpenClaw entrega a resposta do assistente enquanto ela está sendo gerada; `blockStreaming` controla se cada bloco concluído é mantido como uma mensagem separada do Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Para manter as pré-visualizações da resposta em tempo real, mas ocultar linhas intermediárias de ferramentas/progresso, use a forma de objeto:

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

A forma completa de objeto aceita `{ mode, preview, progress }`:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto", // pick from configured or built-in labels (false to hide)
          labels: ["Thinking", "Writing", "Searching"], // candidates for label: "auto"
          maxLines: 8, // max rolling progress lines (default: 8)
          maxLineChars: 120, // max chars per line before truncation (default: 120)
          toolProgress: true, // show tool/progress activity (default: true)
        },
      },
    },
  },
}
```

- `progress.label`: rótulo personalizado, `"auto"` ou não definido para escolher um rótulo configurado ou integrado, ou `false` para ocultá-lo.
- `progress.labels`: opções usadas somente quando `label` é `"auto"` ou não está definido.
- `progress.maxLines`: número máximo de linhas contínuas de progresso mantidas no rascunho; linhas mais antigas que ultrapassem esse limite são removidas.
- `progress.maxLineChars`: número máximo de caracteres por linha compacta de progresso antes do truncamento.
- `progress.toolProgress`: quando `true` (padrão), a atividade de ferramentas/progresso em tempo real aparece no rascunho.

| `streaming`       | Comportamento                                                                                                                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (padrão)  | Aguarda a resposta completa e a envia uma única vez. `true` <-> `"partial"`, `false` <-> `"off"`.                                                                                                                      |
| `"partial"`       | Edita uma mensagem de texto normal no próprio local à medida que o modelo escreve o bloco atual. Clientes padrão podem notificar sobre a primeira pré-visualização, e não sobre a edição final.                       |
| `"quiet"`         | Igual a `"partial"`, mas a mensagem é um aviso que não gera notificação. Os destinatários são notificados quando uma regra de push por usuário corresponde à edição finalizada (consulte abaixo).                    |
| `"progress"`      | Envia linhas compactas individuais de progresso usando um rascunho de progresso.                                                                                                                                      |

`blockStreaming` (padrão `false`) é independente de `streaming`:

| `streaming`             | `blockStreaming: true`                                                        | `blockStreaming: false` (padrão)                                |
| ----------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `"partial"` / `"quiet"` | Rascunho em tempo real do bloco atual; blocos concluídos mantidos como mensagens | Rascunho em tempo real do bloco atual, finalizado no próprio local |
| `"off"`                 | Uma mensagem do Matrix com notificação por bloco concluído                    | Uma mensagem do Matrix com notificação para a resposta completa |

Observações:

- Se uma pré-visualização ultrapassar o limite de tamanho por evento do Matrix, o OpenClaw interrompe a transmissão da pré-visualização e passa a entregar somente a versão final.
- Respostas com mídia sempre enviam anexos normalmente; se uma pré-visualização obsoleta não puder ser reutilizada com segurança, o OpenClaw a remove antes de enviar a resposta final com mídia.
- As atualizações de pré-visualização do progresso das ferramentas ficam ativadas por padrão quando a transmissão de pré-visualizações está ativa. Defina `streaming.preview.toolProgress: false` para manter as edições de pré-visualização do texto da resposta, mas deixar o progresso das ferramentas no fluxo normal de entrega.
- As edições de pré-visualização geram chamadas adicionais à API do Matrix. Mantenha `streaming: "off"` para usar o perfil mais conservador de limitação de taxa.

## Mensagens de voz

As mensagens de voz recebidas pelo Matrix são transcritas antes da verificação de menção da sala. Assim, uma mensagem de voz que diga o nome do robô pode acionar o agente em uma sala com `requireMention: true`, e o agente recebe a transcrição em vez de somente um espaço reservado para o anexo de áudio.

O Matrix usa o provedor compartilhado de mídia de áudio em `tools.media.audio`, como o `gpt-4o-mini-transcribe` da OpenAI. Consulte a [Visão geral das ferramentas de mídia](/pt-BR/tools/media-overview) para obter informações sobre configuração e limites do provedor.

- Eventos `m.audio` e eventos `m.file` com um tipo MIME `audio/*` são elegíveis.
- Em salas criptografadas, o OpenClaw descriptografa o anexo pelo fluxo de mídia existente do Matrix antes da transcrição.
- A transcrição é marcada como gerada por máquina e não confiável no prompt do agente.
- O anexo é marcado como já transcrito para que as ferramentas de mídia posteriores não o transcrevam novamente.
- Defina `tools.media.audio.enabled: false` para desativar globalmente a transcrição de áudio.

## Metadados de aprovação

Os prompts nativos de aprovação do Matrix são eventos `m.room.message` normais com conteúdo específico do OpenClaw na chave `com.openclaw.approval`. Clientes padrão ainda renderizam o corpo do texto; clientes compatíveis com o OpenClaw podem ler a ID estruturada da aprovação, o tipo, o estado, as decisões e os detalhes de execução/Plugin.

Quando um prompt é longo demais para um único evento do Matrix, o OpenClaw divide o texto visível em partes e anexa `com.openclaw.approval` somente à primeira parte. As reações de permissão/negação são vinculadas a esse primeiro evento; portanto, prompts longos mantêm o mesmo destino de aprovação que prompts de evento único.

### Regras de push auto-hospedadas para prévias finalizadas silenciosas

`streaming: "quiet"` só notifica os destinatários quando um bloco ou turno é finalizado — uma regra de push por usuário deve corresponder ao marcador de prévia finalizada. Consulte [Regras de push do Matrix para prévias silenciosas](/pt-BR/channels/matrix-push-rules) para ver a configuração completa.

## Salas entre bots

Por padrão, as mensagens do Matrix provenientes de outras contas configuradas do OpenClaw no Matrix são ignoradas. Use `allowBots` para permitir intencionalmente o tráfego entre agentes:

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

- `allowBots: true` aceita mensagens de outras contas de bot configuradas do Matrix em salas permitidas e em mensagens diretas.
- `allowBots: "mentions"` aceita essas mensagens somente quando elas mencionam visivelmente este bot nas salas; mensagens diretas continuam permitidas independentemente disso.
- `groups.<room>.allowBots` substitui a configuração no nível da conta para uma sala.
- As mensagens aceitas de bots configurados usam a [proteção compartilhada contra loops de bots](/pt-BR/channels/bot-loop-protection). Configure `channels.defaults.botLoopProtection` e substitua por conta com `channels.matrix.botLoopProtection` ou por sala com `channels.matrix.groups.<room>.botLoopProtection`.
- O OpenClaw ainda ignora mensagens do mesmo ID de usuário do Matrix para evitar loops de autorresposta.
- O Matrix não tem um indicador nativo de bot; o OpenClaw considera como "escrita por bot" uma mensagem "enviada por outra conta configurada do Matrix neste Gateway do OpenClaw".

Use listas de permissões de salas estritas e requisitos de menção ao habilitar o tráfego entre bots em salas compartilhadas.

## Criptografia e verificação

Em salas criptografadas (E2EE), os eventos de imagem enviados usam `thumbnail_file`, para que as prévias das imagens sejam criptografadas junto com o anexo completo; salas não criptografadas usam `thumbnail_url` simples. Nenhuma configuração é necessária — o Plugin detecta automaticamente o estado de E2EE.

Todos os comandos `openclaw matrix` aceitam `--verbose` (diagnóstico completo), `--json` (saída legível por máquina) e `--account <id>` (configurações com várias contas). Por padrão, a saída é concisa.

### Habilitar a criptografia

```bash
openclaw matrix encryption setup
```

Inicializa o armazenamento de segredos e a assinatura cruzada, cria um backup das chaves das salas quando necessário e, em seguida, exibe o status e as próximas etapas. Opções úteis:

- `--recovery-key <key>` aplica uma chave de recuperação antes da inicialização (prefira a forma via entrada padrão abaixo)
- `--force-reset-cross-signing` descarta a identidade atual de assinatura cruzada e cria uma nova (somente para uso intencional)

Para uma nova conta, habilite a E2EE no momento da criação:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` é um alias de `--enable-e2ee`. Configuração manual equivalente:

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

`verify status` informa três sinais de confiança independentes (`--verbose` mostra todos eles):

- `Locally trusted`: confiável somente para este cliente
- `Cross-signing verified`: o SDK informa a verificação por assinatura cruzada
- `Signed by owner`: assinado por sua própria chave de autoassinatura (somente para diagnóstico)

`Verified by owner` é `yes` somente quando `Cross-signing verified` é `yes`; a confiança local ou apenas uma assinatura do proprietário não é suficiente.

`--allow-degraded-local-state` retorna diagnósticos de melhor esforço sem preparar primeiro a conta do Matrix; útil para verificações offline ou de configurações parciais.

### Verificar este dispositivo com uma chave de recuperação

Envie a chave de recuperação pela entrada padrão em vez de passá-la na linha de comando:

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

O comando informa três estados:

- `Recovery key accepted`: o Matrix aceitou a chave para o armazenamento de segredos ou a confiança do dispositivo.
- `Backup usable`: o backup das chaves das salas pode ser carregado com o material de recuperação confiável.
- `Device verified by owner`: este dispositivo tem confiança completa na identidade de assinatura cruzada do Matrix.

Ele encerra com código diferente de zero quando a confiança completa na identidade está incompleta, mesmo que a chave de recuperação tenha desbloqueado o material de backup. Nesse caso, conclua a autoverificação em outro cliente do Matrix:

```bash
openclaw matrix verify self
```

`verify self` aguarda `Cross-signing verified: yes` antes de encerrar com êxito. Use `--timeout-ms <ms>` para ajustar o tempo de espera.

A forma com chave literal `openclaw matrix verify device "<recovery-key>"` também funciona, mas a chave fica registrada no histórico do shell.

### Inicializar ou reparar a assinatura cruzada

```bash
openclaw matrix verify bootstrap
```

O comando de reparo/configuração para contas criptografadas. Na ordem, ele:

- inicializa o armazenamento de segredos, reutilizando uma chave de recuperação existente quando possível
- inicializa a assinatura cruzada e envia as chaves públicas ausentes
- marca e assina de forma cruzada o dispositivo atual
- cria um backup das chaves das salas no servidor, caso ainda não exista um

Se o servidor doméstico exigir UIA para enviar chaves de assinatura cruzada, o OpenClaw tenta primeiro sem autenticação, depois `m.login.dummy` e, por fim, `m.login.password` (requer `channels.matrix.password`).

Opções úteis:

- `--recovery-key-stdin` (combine com `printf '%s\n' "$MATRIX_RECOVERY_KEY" | ...`) ou `--recovery-key <key>`
- `--force-reset-cross-signing` para descartar a identidade atual de assinatura cruzada (somente de forma intencional; requer que a chave de recuperação ativa esteja armazenada ou seja fornecida com `--recovery-key-stdin`)

### Backup das chaves das salas

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` mostra se existe um backup no servidor e se este dispositivo consegue descriptografá-lo. `backup restore` importa as chaves das salas armazenadas no backup para o armazenamento criptográfico local; omita `--recovery-key-stdin` se a chave de recuperação já estiver no disco.

Para substituir um backup danificado por uma nova linha de base (aceitando a perda do histórico antigo irrecuperável; também pode recriar o armazenamento de segredos se não for possível carregar o segredo do backup atual):

```bash
openclaw matrix verify backup reset --yes
```

Adicione `--rotate-recovery-key` somente quando a chave de recuperação anterior deva intencionalmente deixar de desbloquear a nova linha de base do backup.

### Listar, solicitar e responder a verificações

```bash
openclaw matrix verify list
```

Lista as solicitações de verificação pendentes da conta selecionada.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Envia uma solicitação de verificação desta conta. `--own-user` solicita a autoverificação (aceite a solicitação em outro cliente do Matrix do mesmo usuário); `--user-id`/`--device-id`/`--room-id` têm como alvo outra pessoa. `--own-user` não pode ser combinado com as outras opções de direcionamento.

Para o gerenciamento de ciclo de vida em nível mais baixo — geralmente ao acompanhar solicitações recebidas por outro cliente — estes comandos atuam sobre uma solicitação específica `<id>` (exibida por `verify list` e `verify request`):

| Comando                                    | Finalidade                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Aceitar uma solicitação recebida                                           |
| `openclaw matrix verify start <id>`        | Iniciar o fluxo SAS                                                        |
| `openclaw matrix verify sas <id>`          | Exibir os emojis ou números decimais do SAS                                |
| `openclaw matrix verify confirm-sas <id>`  | Confirmar que o SAS corresponde ao que o outro cliente mostra              |
| `openclaw matrix verify mismatch-sas <id>` | Rejeitar o SAS quando os emojis ou números decimais não corresponderem      |
| `openclaw matrix verify cancel <id>`       | Cancelar; aceita `--reason <text>` e `--code <matrix-code>` opcionalmente   |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` e `cancel` aceitam `--user-id` e `--room-id` como indicações de acompanhamento por mensagem direta quando a verificação está vinculada a uma sala específica de mensagens diretas.

### Observações sobre várias contas

Sem `--account <id>`, os comandos da CLI do Matrix usam a conta padrão implícita. Quando existem várias contas nomeadas e não há `channels.matrix.defaultAccount`, os comandos se recusam a presumir uma conta e solicitam que você escolha. Quando a E2EE está desabilitada ou indisponível para uma conta nomeada, os erros indicam a chave de configuração dessa conta, por exemplo, `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Comportamento na inicialização">
    Com `encryption: true`, o valor padrão de `startupVerification` é `"if-unverified"`. Na inicialização, um dispositivo não verificado solicita a autoverificação em outro cliente do Matrix, ignorando duplicatas e aplicando um intervalo de espera (24 horas por padrão). Ajuste com `startupVerificationCooldownHours` ou desabilite com `startupVerification: "off"`.

    A inicialização também executa uma etapa conservadora de inicialização criptográfica, reutilizando o armazenamento de segredos e a identidade de assinatura cruzada atuais. Se o estado da inicialização estiver corrompido, o OpenClaw tentará um reparo protegido mesmo sem `channels.matrix.password`; se o servidor doméstico exigir UIA com senha, a inicialização registrará um aviso e continuará sem erro fatal. Dispositivos já assinados pelo proprietário são preservados.

    Consulte [Migração do Matrix](/pt-BR/channels/matrix-migration) para ver o fluxo completo de atualização.

  </Accordion>

  <Accordion title="Avisos de verificação">
    O Matrix publica avisos sobre o ciclo de vida da verificação na sala estrita de verificação por mensagem direta como mensagens `m.notice`: solicitação, prontidão (com orientação "Verify by emoji"), início/conclusão e detalhes do SAS (emojis/números decimais), quando disponíveis.

    As solicitações recebidas de outro cliente do Matrix são rastreadas e aceitas automaticamente. Para autoverificação, o OpenClaw inicia automaticamente o fluxo SAS e confirma o próprio lado assim que a verificação por emojis estiver disponível — você ainda precisa comparar e confirmar "They match" no seu cliente do Matrix.

    Os avisos do sistema de verificação não são encaminhados ao pipeline de chat do agente.

  </Accordion>

  <Accordion title="Dispositivo do Matrix excluído ou inválido">
    Se `verify status` informar que o dispositivo atual não está mais listado no servidor doméstico, crie um novo dispositivo do OpenClaw no Matrix. Para login com senha:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Para autenticação por token, crie um novo token de acesso no seu cliente do Matrix ou na interface administrativa e, em seguida, atualize o OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Substitua `assistant` pelo ID da conta indicado no comando que falhou ou omita `--account` para usar a conta padrão.

  </Accordion>

  <Accordion title="Higiene dos dispositivos">
    Dispositivos antigos gerenciados pelo OpenClaw podem se acumular. Liste-os e remova os obsoletos:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Armazenamento criptográfico">
    A E2EE do Matrix usa o caminho criptográfico Rust oficial do `matrix-js-sdk`, com `fake-indexeddb` como adaptação para IndexedDB. O estado criptográfico é persistido em `crypto-idb-snapshot.json` (com permissões de arquivo restritivas).

    O estado criptografado de execução fica em `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` e inclui o armazenamento de sincronização, o armazenamento criptográfico, a chave de recuperação, o snapshot do IDB, os vínculos de conversas e o estado de verificação na inicialização. Quando o token muda, mas a identidade da conta permanece a mesma, o OpenClaw reutiliza a melhor raiz existente para que o estado anterior continue visível.

    Uma única raiz mais antiga de hash de token pode ser um caminho normal de continuidade da rotação de tokens. Se o OpenClaw registrar `matrix: multiple populated token-hash storage roots detected`, inspecione o diretório da conta e arquive raízes irmãs obsoletas somente após confirmar que a raiz ativa selecionada está íntegra. Prefira mover raízes obsoletas para um diretório `_archive/` em vez de excluí-las imediatamente.

  </Accordion>
</AccordionGroup>

## Gerenciamento de perfil

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Passe ambas as opções em uma única chamada. O Matrix aceita URLs de avatar `mxc://` diretamente; passar `http://`/`https://` primeiro envia o arquivo e armazena a URL `mxc://` resolvida em `channels.matrix.avatarUrl` (ou na substituição específica da conta).

## Threads

O Matrix oferece suporte a threads nativas tanto para respostas automáticas quanto para envios pela ferramenta de mensagens. Dois controles independentes determinam o comportamento:

### Roteamento de sessão (`sessionScope`)

`dm.sessionScope` determina como as salas de mensagem direta do Matrix são mapeadas para sessões do OpenClaw:

- `"per-user"` (padrão): todas as salas de mensagem direta com o mesmo contato roteado compartilham uma sessão.
- `"per-room"`: cada sala de mensagem direta do Matrix recebe sua própria chave de sessão, mesmo para o mesmo contato.

Vínculos explícitos de conversa sempre prevalecem sobre `sessionScope`; salas e threads vinculadas mantêm a sessão de destino escolhida.

### Respostas em threads (`threadReplies`)

`threadReplies` determina onde o bot publica sua resposta:

- `"off"`: as respostas ficam no nível superior. Mensagens recebidas em threads permanecem na sessão principal.
- `"inbound"`: responde dentro de uma thread somente quando a mensagem recebida já estava nessa thread.
- `"always"`: responde dentro de uma thread cuja raiz é a mensagem que acionou a resposta; essa conversa é roteada por uma sessão correspondente com escopo de thread desde o primeiro acionamento.

`dm.threadReplies` substitui esse comportamento somente para mensagens diretas — por exemplo, para manter as threads das salas isoladas enquanto as mensagens diretas permanecem sem threads.

### Herança de threads e comandos de barra

- Mensagens recebidas em threads incluem a mensagem raiz da thread como contexto adicional para o agente.
- Envios pela ferramenta de mensagens herdam automaticamente a thread atual do Matrix quando têm como destino a mesma sala (ou o mesmo usuário de mensagem direta), a menos que um `threadId` explícito seja fornecido.
- A reutilização de destino de usuário em mensagens diretas somente ocorre quando os metadados da sessão atual comprovam que se trata do mesmo contato de mensagem direta na mesma conta do Matrix; caso contrário, o OpenClaw retorna ao roteamento normal com escopo de usuário.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` e `/acp spawn` vinculado a uma thread funcionam em salas e mensagens diretas do Matrix.
- `/focus` no nível superior cria uma nova thread do Matrix e a vincula à sessão de destino quando `threadBindings.spawnSessions` está habilitado.
- Executar `/focus` ou `/acp spawn --thread here` dentro de uma thread existente do Matrix vincula essa thread no próprio local.

Quando o OpenClaw detecta que uma sala de mensagem direta do Matrix está em conflito com outra sala de mensagem direta na mesma sessão compartilhada, ele publica uma única mensagem `m.notice` indicando a alternativa `/focus` e sugerindo uma alteração em `dm.sessionScope`. O aviso só aparece quando os vínculos de thread estão habilitados.

## Vínculos de conversa ACP

Salas, mensagens diretas e threads existentes do Matrix podem se tornar espaços de trabalho ACP persistentes sem alterar a interface de chat.

Fluxo rápido para o operador:

- Execute `/acp spawn codex --bind here` dentro da mensagem direta, sala ou thread existente do Matrix que deseja continuar usando.
- Em uma mensagem direta ou sala no nível superior, a mensagem direta/sala atual permanece como interface de chat, e as mensagens futuras são roteadas para a sessão ACP criada.
- Dentro de uma thread existente, `--bind here` vincula a thread atual no próprio local.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no próprio local.
- `/acp close` encerra a sessão ACP e remove o vínculo.

`--bind here` não cria uma thread filha do Matrix. `threadBindings.spawnSessions` controla `/acp spawn --thread auto|here`, quando o OpenClaw precisa criar ou vincular uma thread filha.

### Configuração de vínculo de threads

O Matrix herda os padrões globais de `session.threadBindings` e oferece suporte a substituições específicas por canal:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`: controla tanto a criação de threads de subagentes quanto de ACP.
- `threadBindings.spawnSubagentSessions` / `threadBindings.spawnAcpSessions`: substituições mais específicas para criações somente de subagentes ou somente de ACP.
- `threadBindings.defaultSpawnContext`

A criação de sessões vinculadas a threads do Matrix fica ativada por padrão. Defina `threadBindings.spawnSessions: false` para impedir que `/focus` no nível superior e `/acp spawn --thread auto|here` criem ou vinculem threads do Matrix. Defina `threadBindings.defaultSpawnContext: "isolated"` quando a criação nativa de threads de subagentes não deva bifurcar a transcrição principal.

## Reações

O Matrix oferece suporte a reações de saída, notificações de reações recebidas e reações de confirmação.

As ferramentas de reação de saída são controladas por `channels.matrix.actions.reactions`:

- `react` adiciona uma reação a um evento do Matrix.
- `reactions` lista o resumo atual das reações de um evento do Matrix.
- `emoji=""` remove as próprias reações do bot nesse evento.
- `remove: true` remove do bot somente a reação com o emoji especificado.

**Ordem de resolução** (o primeiro valor definido prevalece):

| Configuração            | Ordem                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------- |
| `ackReaction`           | por conta -> canal -> `messages.ackReaction` -> emoji alternativo da identidade do agente |
| `ackReactionScope`      | por conta -> canal -> `messages.ackReactionScope` -> padrão `"group-mentions"`          |
| `reactionNotifications` | por conta -> canal -> padrão `"own"`                                                     |

`reactionNotifications: "own"` encaminha eventos `m.reaction` adicionados quando eles têm como destino mensagens do Matrix criadas pelo bot; `"off"` desabilita eventos do sistema de reações. As remoções de reações não são sintetizadas como eventos do sistema — o Matrix as apresenta como redações, não como remoções independentes de `m.reaction`.

## Contexto do histórico

- `channels.matrix.historyLimit` controla quantas mensagens recentes da sala são incluídas como `InboundHistory` quando uma mensagem da sala aciona o agente. Usa `messages.groupChat.historyLimit` como alternativa; o padrão efetivo é `0` se ambos não estiverem definidos (desabilitado).
- O histórico de salas do Matrix é restrito à sala; mensagens diretas continuam usando o histórico normal da sessão.
- O histórico da sala contém somente mensagens pendentes: o OpenClaw armazena temporariamente mensagens da sala que ainda não acionaram uma resposta e captura esse intervalo quando uma menção ou outro acionador chega.
- A mensagem acionadora atual não é incluída em `InboundHistory`; ela permanece no corpo principal da entrada dessa interação.
- Novas tentativas do mesmo evento do Matrix reutilizam a captura original do histórico em vez de avançar para mensagens mais recentes da sala.

## Visibilidade do contexto

O Matrix oferece suporte ao controle compartilhado `contextVisibility` para contexto suplementar da sala, como texto de resposta obtido, raízes de threads e histórico pendente.

- `contextVisibility: "all"` é o padrão. O contexto suplementar é mantido conforme recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações ativas da lista de permissões da sala ou do usuário.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta explícita citada.

Isso afeta somente a visibilidade do contexto suplementar, não a possibilidade de a própria mensagem recebida acionar uma resposta. A autorização de acionamento ainda vem de `groupPolicy`, `groups`, `groupAllowFrom` e das configurações de política de mensagens diretas.

## Política de mensagens diretas e salas

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

Para silenciar totalmente as mensagens diretas e manter as salas funcionando, defina `dm.enabled: false`:

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

Consulte [Grupos](/pt-BR/channels/groups) para saber mais sobre o controle por menções e o comportamento da lista de permissões.

Exemplo de pareamento para mensagens diretas do Matrix:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Se um usuário não aprovado do Matrix continuar enviando mensagens antes da aprovação, o OpenClaw reutiliza o mesmo código de pareamento pendente e pode enviar uma resposta de lembrete após um breve período de espera, em vez de gerar um novo código.

Consulte [Pareamento](/pt-BR/channels/pairing) para conhecer o fluxo compartilhado de pareamento de mensagens diretas e a estrutura de armazenamento.

## Reparo de sala direta

Se o estado das mensagens diretas ficar dessincronizado, o OpenClaw pode acabar com mapeamentos `m.direct` obsoletos apontando para antigas salas individuais em vez da mensagem direta ativa. Inspecione o mapeamento atual de um contato:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Repare-o:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Ambos os comandos aceitam `--account <id>` para configurações com várias contas. O fluxo de reparo:

- prefere uma mensagem direta estritamente individual já mapeada em `m.direct`
- usa como alternativa qualquer mensagem direta estritamente individual com esse usuário da qual a conta participe atualmente
- cria uma nova sala direta e reescreve `m.direct` se não existir uma mensagem direta íntegra

Ele não exclui salas antigas automaticamente. Ele seleciona a mensagem direta íntegra e atualiza o mapeamento para que futuros envios do Matrix, avisos de verificação e outros fluxos de mensagens diretas sejam destinados à sala correta.

## Aprovações de execução

O Matrix pode atuar como cliente nativo de aprovação. Configure em `channels.matrix.execApprovals` (ou `channels.matrix.accounts.<account>.execApprovals` para uma substituição específica por conta):

- `enabled`: entrega aprovações por meio de solicitações nativas do Matrix. Não definido ou `"auto"` ativa automaticamente quando pelo menos um aprovador pode ser resolvido; defina `false` para desabilitar explicitamente.
- `approvers`: IDs de usuário do Matrix (`@owner:example.org`) autorizados a aprovar solicitações de execução. Usa `channels.matrix.dm.allowFrom` como alternativa.
- `target`: destino das solicitações. `"dm"` (padrão) envia para as mensagens diretas dos aprovadores; `"channel"` envia para a sala ou mensagem direta de origem; `"both"` envia para ambos.
- `agentFilter` / `sessionFilter`: listas de permissões opcionais que determinam quais agentes ou sessões acionam a entrega pelo Matrix.

A autorização difere ligeiramente entre os tipos de aprovação:

- **Aprovações de execução** usam `execApprovals.approvers`, com `dm.allowFrom` como alternativa.
- **Aprovações de Plugin** autorizam somente por meio de `dm.allowFrom`.

Ambos os tipos compartilham atalhos de reação e atualizações de mensagens no Matrix. Os aprovadores veem atalhos de reação na mensagem principal de aprovação:

- ✅ permitir uma vez
- ❌ negar
- ♾️ permitir sempre (quando a política efetiva de execução permitir)

Comandos de barra alternativos: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Somente aprovadores resolvidos podem aprovar ou negar. A entrega em canais para aprovações de execução inclui o texto do comando — habilite `channel` ou `both` somente em salas confiáveis.

Relacionado: [Aprovações de execução](/pt-BR/tools/exec-approvals).

## Comandos de barra

Os comandos de barra (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` etc.) funcionam diretamente em mensagens diretas. Em salas, o OpenClaw também reconhece comandos prefixados pela própria menção do bot no Matrix; assim, `@bot:server /new` aciona o fluxo do comando sem uma expressão regular de menção personalizada — isso mantém o bot responsivo às publicações no formato de sala `@mention /command` emitidas pelo Element e por clientes semelhantes quando um usuário usa o preenchimento com Tab para selecionar o bot antes de digitar o comando.

As regras de autorização continuam válidas: os remetentes dos comandos devem atender às mesmas políticas de proprietário ou de lista de permissões de mensagens diretas ou salas aplicadas às mensagens comuns.

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

- Os valores de nível superior em `channels.matrix` funcionam como padrões para as contas nomeadas, a menos que uma conta os substitua.
- Restrinja uma entrada de sala herdada a uma conta específica com `groups.<room>.account`. As entradas sem `account` são compartilhadas entre as contas; `account: "default"` continua funcionando quando a conta padrão é configurada no nível superior.

**Seleção da conta padrão:**

- Defina `defaultAccount` para escolher a conta nomeada que terá preferência no roteamento implícito, nas sondagens e nos comandos da CLI.
- Se você tiver várias contas e uma delas se chamar literalmente `default`, o OpenClaw a usará implicitamente mesmo quando `defaultAccount` não estiver definido.
- Com várias contas nomeadas e nenhuma conta padrão selecionada, os comandos da CLI se recusam a escolher uma por suposição — defina `defaultAccount` ou passe `--account <id>`.
- O bloco de nível superior `channels.matrix.*` só é tratado como a conta `default` implícita quando sua autenticação está completa (`homeserver` + `accessToken` ou `homeserver` + `userId` + `password`). As contas nomeadas continuam detectáveis por meio de `homeserver` + `userId` quando as credenciais armazenadas em cache abrangem a autenticação.

**Promoção:**

- Quando o OpenClaw promove uma configuração de conta única para várias contas durante o reparo ou a configuração, ele preserva a conta nomeada existente, caso haja uma, ou a conta já indicada por `defaultAccount`. Somente as chaves de autenticação/inicialização do Matrix são movidas para a conta promovida; as chaves compartilhadas da política de entrega permanecem no nível superior.

Consulte a [referência de configuração](/pt-BR/gateway/config-channels#multi-account-all-channels) para ver o padrão compartilhado de várias contas.

## Servidores domésticos privados/de LAN

Por padrão, o OpenClaw bloqueia servidores domésticos do Matrix privados/internos para proteção contra SSRF, a menos que você habilite essa opção por conta.

Se o seu servidor doméstico for executado no localhost, em um IP de LAN/Tailscale ou em um nome de host interno, habilite `network.dangerouslyAllowPrivateNetwork` para essa conta:

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

Essa habilitação permite somente destinos privados/internos confiáveis. Servidores domésticos públicos sem criptografia, como `http://matrix.example.org:8008`, continuam bloqueados. Prefira `https://` sempre que possível.

## Uso de proxy para o tráfego do Matrix

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

As contas nomeadas podem substituir o padrão de nível superior com `channels.matrix.accounts.<id>.proxy`. O OpenClaw usa a mesma configuração de proxy para o tráfego do Matrix em tempo de execução e para as sondagens de status das contas.

## Resolução de destinos

O Matrix aceita estes formatos de destino em qualquer lugar em que o OpenClaw solicite o destino de uma sala ou de um usuário:

- Usuários: `@user:server`, `user:@user:server` ou `matrix:user:@user:server`
- Salas: `!room:server`, `room:!room:server` ou `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` ou `matrix:channel:#alias:server`

Os IDs de sala do Matrix diferenciam maiúsculas de minúsculas. Use exatamente a mesma combinação de maiúsculas e minúsculas do ID de sala no Matrix ao configurar destinos explícitos de entrega, tarefas cron, associações ou listas de permissões. O OpenClaw mantém as chaves internas de sessão em formato canônico para armazenamento; portanto, essas chaves em minúsculas não são uma fonte confiável para IDs de entrega do Matrix.

A consulta de diretório em tempo real usa a conta do Matrix conectada:

- As consultas de usuários pesquisam o diretório de usuários do Matrix nesse homeserver.
- As consultas de salas aceitam diretamente IDs e aliases explícitos de salas. A consulta por nome de sala ingressada é realizada na medida do possível e se aplica somente às listas de permissões de salas em tempo de execução quando `dangerouslyAllowNameMatching: true` está definido.
- Se não for possível resolver o nome de uma sala para um ID ou alias, ele será ignorado pela resolução da lista de permissões em tempo de execução.

## Referência de configuração

Os campos de usuário no formato de lista de permissões (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) aceitam IDs completos de usuário do Matrix (opção mais segura). Por padrão, entradas que não sejam IDs são ignoradas. Se `dangerouslyAllowNameMatching: true` estiver definido, correspondências exatas com nomes de exibição no diretório do Matrix serão resolvidas na inicialização e sempre que a lista de permissões for alterada enquanto o monitor estiver em execução; entradas que não puderem ser resolvidas serão ignoradas em tempo de execução.

As chaves da lista de permissões de salas (`groups`, `rooms` legado) devem ser IDs ou aliases de salas. Por padrão, chaves que sejam apenas nomes de salas são ignoradas; `dangerouslyAllowNameMatching: true` restaura a consulta, na medida do possível, pelos nomes das salas ingressadas.

### Conta e conexão

- `enabled`: ativa ou desativa o canal.
- `name`: rótulo de exibição opcional para a conta.
- `defaultAccount`: ID da conta preferencial quando várias contas do Matrix estão configuradas.
- `accounts`: substituições nomeadas por conta. Os valores de nível superior de `channels.matrix` são herdados como padrões.
- `homeserver`: URL do homeserver, por exemplo, `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: permite que esta conta se conecte a `localhost`, IPs de LAN/Tailscale ou nomes de host internos.
- `proxy`: URL opcional de proxy HTTP(S) para o tráfego do Matrix. Há suporte à substituição por conta.
- `userId`: ID completo de usuário do Matrix (`@bot:example.org`).
- `accessToken`: token de acesso para autenticação baseada em token. Há suporte a valores de texto simples e SecretRef nos provedores de ambiente/arquivo/execução ([Gerenciamento de segredos](/pt-BR/gateway/secrets)).
- `password`: senha para login baseado em senha. Há suporte a valores de texto simples e SecretRef.
- `deviceId`: ID explícito do dispositivo Matrix.
- `deviceName`: nome de exibição do dispositivo usado no momento do login por senha.
- `avatarUrl`: URL armazenada do próprio avatar para sincronização do perfil e atualizações com `profile set`.
- `initialSyncLimit`: número máximo de eventos obtidos durante a sincronização de inicialização.

### Criptografia

- `encryption`: ativa E2EE. Padrão: `false`.
- `startupVerification`: `"if-unverified"` (padrão quando E2EE está ativada) ou `"off"`. Solicita automaticamente a autoverificação na inicialização quando este dispositivo não está verificado.
- `startupVerificationCooldownHours`: intervalo de espera antes da próxima solicitação automática na inicialização. Padrão: `24`.

### Acesso e política

- `groupPolicy`: `"open"`, `"allowlist"` ou `"disabled"`. Padrão: `"allowlist"`.
- `groupAllowFrom`: lista de permissões de IDs de usuários para tráfego de salas.
- `mentionPatterns`: padrões de expressão regular com escopo para menções em salas. Objeto com `{ mode: "allow"|"deny", allowIn: [roomId, ...], denyIn: [roomId, ...] }`. Controla se os `agents.list[].groupChat.mentionPatterns` configurados se aplicam a cada sala.
- `dm.enabled`: quando `false`, ignora todas as mensagens diretas. Padrão: `true`.
- `dm.policy`: `"pairing"` (padrão), `"allowlist"`, `"open"` ou `"disabled"`. Aplica-se depois que o bot ingressa e classifica a sala como uma mensagem direta; não afeta o processamento de convites.
- `dm.allowFrom`: lista de permissões de IDs de usuários para tráfego de mensagens diretas.
- `dm.sessionScope`: `"per-user"` (padrão) ou `"per-room"`.
- `dm.threadReplies`: substituição exclusiva para mensagens diretas referente ao encadeamento de respostas (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: aceita mensagens de outras contas de bot do Matrix configuradas (`true` ou `"mentions"`).
- `allowlistOnly`: quando `true`, força todas as políticas ativas de mensagens diretas (exceto `"disabled"`) e as políticas de grupo `"open"` a usar `"allowlist"`. Não altera políticas `"disabled"`.
- `dangerouslyAllowNameMatching`: quando `true`, permite a consulta por nome de exibição no diretório do Matrix para entradas da lista de permissões de usuários e a consulta por nome de sala ingressada para chaves da lista de permissões de salas. Prefira IDs completos no formato `@user:server` e IDs ou aliases de salas.
- `autoJoin`: `"always"`, `"allowlist"` ou `"off"`. Padrão: `"off"`. Aplica-se a todos os convites do Matrix, inclusive convites no estilo de mensagens diretas.
- `autoJoinAllowlist`: salas/aliases permitidos quando `autoJoin` é `"allowlist"`. As entradas de alias são resolvidas em relação ao homeserver, não em relação ao estado declarado pela sala que enviou o convite.
- `contextVisibility`: visibilidade de contexto complementar (`"all"` por padrão, `"allowlist"`, `"allowlist_quote"`).

### Comportamento das respostas

- `replyToMode`: `"off"` (padrão), `"first"`, `"all"` ou `"batched"`.
- `threadReplies`: `"off"` (o padrão de nível superior é resolvido como `"inbound"`, salvo se definido explicitamente), `"inbound"` ou `"always"`.
- `threadBindings`: substituições por canal para roteamento e ciclo de vida de sessões vinculadas a threads.
- `streaming`: `"off"` (padrão), `"partial"`, `"quiet"`, `"progress"` ou o formato de objeto `{ mode, preview: { toolProgress }, progress: { label, labels, maxLines, maxLineChars, toolProgress } }`. `true` <-> `"partial"`, `false` <-> `"off"`.
- `blockStreaming`: quando `true`, os blocos concluídos do assistente são mantidos como mensagens de progresso separadas. Padrão: `false`.
- `markdown`: configuração opcional de renderização Markdown para texto de saída.
- `responsePrefix`: string opcional adicionada ao início das respostas de saída.
- `textChunkLimit`: tamanho dos blocos de saída em caracteres quando `chunkMode: "length"`. Padrão: `4000`.
- `chunkMode`: `"length"` (padrão, divide pela quantidade de caracteres) ou `"newline"` (divide nos limites das linhas).
- `historyLimit`: número de mensagens recentes da sala incluídas como `InboundHistory` quando uma mensagem da sala aciona o agente. Usa `messages.groupChat.historyLimit` como fallback; padrão efetivo `0` (desativado).
- `mediaMaxMb`: limite de tamanho de mídia em MB para envios de saída e processamento de entrada. Padrão: `20`.

### Configurações de reações

- `ackReaction`: substituição da reação de confirmação para este canal/esta conta.
- `ackReactionScope`: substituição de escopo (`"group-mentions"` por padrão, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: modo de notificação de reações recebidas (`"own"` por padrão, `"off"`).

### Ferramentas e substituições por sala

- `actions`: controle de disponibilidade de ferramentas por ação (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: mapa de políticas por sala. A identidade da sessão usa o ID estável da sala após a resolução. (`rooms` é um alias legado.)
  - `groups.<room>.account`: restringe uma entrada de sala herdada a uma conta específica.
  - `groups.<room>.enabled`: alternância por sala. Quando `false`, a sala é ignorada como se não estivesse no mapa.
  - `groups.<room>.requireMention`: substituição por sala do requisito de menção no nível do canal.
  - `groups.<room>.allowBots`: substituição por sala da configuração no nível do canal (`true` ou `"mentions"`).
  - `groups.<room>.botLoopProtection`: substituição por sala do limite de proteção contra loops entre bots.
  - `groups.<room>.users`: lista de permissões de remetentes por sala.
  - `groups.<room>.tools`: substituições por sala de permissão/negação de ferramentas.
  - `groups.<room>.autoReply`: substituição por sala do controle por menção. `true` desativa os requisitos de menção para essa sala; `false` os força a serem ativados novamente.
  - `groups.<room>.skills`: filtro de Skills por sala.
  - `groups.<room>.systemPrompt`: trecho de prompt do sistema por sala.

### Configurações de aprovação de execução

- `execApprovals.enabled`: entrega aprovações de execução por meio de solicitações nativas do Matrix.
- `execApprovals.approvers`: IDs de usuários do Matrix autorizados a aprovar. Usa `dm.allowFrom` como fallback.
- `execApprovals.target`: `"dm"` (padrão), `"channel"` ou `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: listas de permissões opcionais de agentes/sessões para entrega.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de conversas em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
