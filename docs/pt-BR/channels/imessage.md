---
read_when:
    - Configurando o suporte ao iMessage
    - Depuração do envio/recebimento do iMessage
summary: Suporte nativo ao iMessage via imsg (JSON-RPC por stdio), com ações de API privada para respostas, tapbacks, efeitos, anexos e gerenciamento de grupos. Preferencial para novas configurações de iMessage do OpenClaw quando os requisitos do host forem atendidos.
title: iMessage
x-i18n:
    generated_at: "2026-05-12T00:56:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56b0c284a5105bf9c2863f46731fb61628e264ce35c316014f25f15907142430
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para implantações do OpenClaw iMessage, use `imsg` em um host macOS Messages autenticado. Se o seu Gateway roda em Linux ou Windows, aponte `channels.imessage.cliPath` para um wrapper SSH que executa `imsg` no Mac.

**A recuperação após indisponibilidade do Gateway é opcional.** Quando habilitada (`channels.imessage.catchup.enabled: true`), o gateway reproduz mensagens de entrada que chegaram ao `chat.db` enquanto ele estava offline (falha, reinicialização, suspensão do Mac) na próxima inicialização. Desabilitada por padrão — consulte [Recuperando após indisponibilidade do gateway](#catching-up-after-gateway-downtime). Fecha [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
O suporte ao BlueBubbles foi removido. Migre configurações `channels.bluebubbles` para `channels.imessage`; o OpenClaw oferece suporte ao iMessage somente por meio do `imsg`. Comece com [Remoção do BlueBubbles e o caminho imsg para iMessage](/pt-BR/announcements/bluebubbles-imessage) para o anúncio curto, ou [Vindo do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) para a tabela completa de migração.
</Warning>

Status: integração nativa com CLI externa. O Gateway inicia `imsg rpc` e se comunica por JSON-RPC em stdio (sem daemon/porta separado). Ações avançadas exigem `imsg launch` e uma sondagem bem-sucedida da API privada.

<CardGroup cols={3}>
  <Card title="Ações da API privada" icon="wand-sparkles" href="#private-api-actions">
    Respostas, tapbacks, efeitos, anexos e gerenciamento de grupos.
  </Card>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    DMs do iMessage usam o modo de pareamento por padrão.
  </Card>
  <Card title="Mac remoto" icon="terminal" href="#remote-mac-over-ssh">
    Use um wrapper SSH quando o Gateway não estiver rodando no Mac do Messages.
  </Card>
  <Card title="Referência de configuração" icon="settings" href="/pt-BR/gateway/config-channels#imessage">
    Referência completa dos campos do iMessage.
  </Card>
</CardGroup>

## Configuração rápida

<Tabs>
  <Tab title="Mac local (caminho rápido)">
    <Steps>
      <Step title="Instale e verifique o imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure o OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Inicie o gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Aprove o primeiro pareamento por DM (dmPolicy padrão)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Solicitações de pareamento expiram após 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto por SSH">
    O OpenClaw exige apenas um `cliPath` compatível com stdio, então você pode apontar `cliPath` para um script wrapper que faz SSH para um Mac remoto e executa `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuração recomendada quando anexos estão habilitados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` não estiver definido, o OpenClaw tentará detectá-lo automaticamente analisando o script wrapper SSH.
    `remoteHost` deve ser `host` ou `user@host` (sem espaços ou opções SSH).
    O OpenClaw usa verificação estrita de chave de host para SCP, portanto a chave do host de retransmissão já deve existir em `~/.ssh/known_hosts`.
    Caminhos de anexos são validados contra raízes permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos e permissões (macOS)

- O Messages deve estar autenticado no Mac que executa `imsg`.
- Acesso Completo ao Disco é obrigatório para o contexto do processo que executa OpenClaw/`imsg` (acesso ao banco de dados do Messages).
- Permissão de Automação é obrigatória para enviar mensagens pelo Messages.app.
- Para ações avançadas (reagir / editar / cancelar envio / resposta em thread / efeitos / operações de grupo), a Proteção de Integridade do Sistema deve ser desabilitada — consulte [Habilitando a API privada do imsg](#enabling-the-imsg-private-api) abaixo. Envio/recebimento básico de texto e mídia funciona sem isso.

<Tip>
Permissões são concedidas por contexto de processo. Se o gateway roda sem interface (LaunchAgent/SSH), execute um comando interativo uma vez nesse mesmo contexto para acionar os prompts:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Habilitando a API privada do imsg

`imsg` vem em dois modos operacionais:

- **Modo básico** (padrão, sem necessidade de alterações no SIP): texto e mídia de saída via `send`, monitoramento/histórico de entrada, lista de conversas. É isso que você obtém de imediato após um `brew install steipete/tap/imsg` novo, mais as permissões padrão do macOS acima.
- **Modo de API privada**: `imsg` injeta uma dylib auxiliar no `Messages.app` para chamar funções internas do `IMCore`. Isso desbloqueia `react`, `edit`, `unsend`, `reply` (em thread), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, além de indicadores de digitação e confirmações de leitura.

Para acessar a superfície de ações avançadas que esta página do canal documenta, você precisa do modo de API privada. O README do `imsg` é explícito sobre o requisito:

> Recursos avançados como `read`, `typing`, `launch`, envio avançado com bridge, mutação de mensagens e gerenciamento de conversas são opcionais. Eles exigem que o SIP seja desabilitado e que uma dylib auxiliar seja injetada no `Messages.app`. `imsg launch` se recusa a injetar quando o SIP está habilitado.

A técnica de injeção do auxiliar usa a própria dylib do `imsg` para acessar APIs privadas do Messages. Não há servidor de terceiros nem runtime BlueBubbles no caminho do OpenClaw iMessage.

<Warning>
**Desabilitar o SIP é uma troca de segurança real.** O SIP é uma das proteções centrais do macOS contra execução de código de sistema modificado; desativá-lo em todo o sistema abre superfície de ataque adicional e efeitos colaterais. Em especial, **desabilitar o SIP em Macs Apple Silicon também desabilita a capacidade de instalar e executar apps iOS no seu Mac**.

Trate isso como uma escolha operacional deliberada, não como padrão. Se o seu modelo de ameaça não tolera o SIP desativado, o iMessage incluído fica limitado ao modo básico — somente envio/recebimento de texto e mídia, sem reações / edição / cancelamento de envio / efeitos / operações de grupo.
</Warning>

### Configuração

1. **Instale (ou atualize) `imsg`** no Mac que executa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   A saída de `imsg status --json` relata `bridge_version`, `rpc_methods` e `selectors` por método, para que você veja o que a compilação atual oferece suporte antes de começar.

2. **Desabilite a Proteção de Integridade do Sistema.** Isso é específico da versão do macOS porque o requisito subjacente da Apple depende do sistema operacional e do hardware:
   - **macOS 10.13–10.15 (Sierra–Catalina):** desabilite a Validação de Biblioteca via Terminal, reinicie no Modo de Recuperação, execute `csrutil disable`, reinicie.
   - **macOS 11+ (Big Sur e posteriores), Intel:** Modo de Recuperação (ou Recuperação pela Internet), `csrutil disable`, reinicie.
   - **macOS 11+, Apple Silicon:** sequência de inicialização pelo botão liga/desliga para entrar na Recuperação; em versões recentes do macOS, mantenha pressionada a tecla **Shift Esquerdo** ao clicar em Continuar, depois `csrutil disable`. Configurações de máquina virtual seguem um fluxo separado — tire um snapshot da VM primeiro.
   - **macOS 26 / Tahoe:** políticas de validação de biblioteca e verificações de direito privado do `imagent` ficaram ainda mais rígidas; `imsg` pode precisar de uma compilação atualizada para acompanhar. Se a injeção de `imsg launch` ou `selectors` específicos começarem a retornar false após uma grande atualização do macOS, verifique as notas de versão do `imsg` antes de presumir que a etapa de SIP teve sucesso.

   Siga o fluxo de Modo de Recuperação da Apple para o seu Mac para desabilitar o SIP antes de executar `imsg launch`.

3. **Injete o auxiliar.** Com o SIP desabilitado e o Messages.app autenticado:

   ```bash
   imsg launch
   ```

   `imsg launch` se recusa a injetar quando o SIP ainda está habilitado, então isso também serve como confirmação de que a etapa 2 funcionou.

4. **Verifique a bridge pelo OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   A entrada do iMessage deve relatar `works`, e `imsg status --json | jq '.selectors'` deve mostrar `retractMessagePart: true` mais quaisquer seletores de edição / digitação / leitura que a sua compilação do macOS expõe. O controle por método do Plugin OpenClaw em `actions.ts` só anuncia ações cujo seletor subjacente é `true`, então a superfície de ações que você vê na lista de ferramentas do agente reflete o que a bridge realmente consegue fazer neste host.

Se `openclaw channels status --probe` relatar o canal como `works`, mas ações específicas lançarem "iMessage `<action>` requires the imsg private API bridge" no momento do despacho, execute `imsg launch` novamente — o auxiliar pode cair (reinicialização do Messages.app, atualização do SO etc.) e o status em cache `available: true` continuará anunciando ações até que a próxima sondagem seja atualizada.

### Quando você não pode desabilitar o SIP

Se SIP desabilitado não for aceitável para o seu modelo de ameaça:

- `imsg` volta ao modo básico — apenas texto + mídia + recebimento.
- O Plugin OpenClaw ainda anuncia envio de texto/mídia e monitoramento de entrada; ele apenas oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` e operações de grupo da superfície de ações (conforme o controle de capacidade por método).
- Você pode executar um Mac separado que não seja Apple Silicon (ou um Mac dedicado para bot) com SIP desativado para a carga de trabalho do iMessage, mantendo o SIP habilitado nos seus dispositivos principais. Consulte [Usuário macOS dedicado para bot (identidade iMessage separada)](#deployment-patterns) abaixo.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.imessage.dmPolicy` controla mensagens diretas:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo de allowlist: `channels.imessage.allowFrom`.

    Entradas de allowlist podem ser handles, grupos estáticos de acesso de remetente (`accessGroup:<name>`) ou destinos de conversa (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupo + menções">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrão quando configurado)
    - `open`
    - `disabled`

    Allowlist de remetentes de grupo: `channels.imessage.groupAllowFrom`.

    Entradas de `groupAllowFrom` também podem referenciar grupos estáticos de acesso de remetente (`accessGroup:<name>`).

    Fallback em runtime: se `groupAllowFrom` não estiver definido, as verificações de remetente de grupo do iMessage recorrem a `allowFrom` quando disponível.
    Observação de runtime: se `channels.imessage` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    <Warning>
    O roteamento de grupo tem **dois** gates de allowlist executando em sequência, e ambos devem passar:

    1. **Allowlist de remetente / destino de conversa** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` ou `chat_id`.
    2. **Registro de grupo** (`channels.imessage.groups`) — com `groupPolicy: "allowlist"`, este gate exige uma entrada curinga `groups: { "*": { ... } }` (define `allowAll = true`) ou uma entrada explícita por `chat_id` em `groups`.

    Se o gate 2 não tiver nada, todas as mensagens de grupo serão descartadas. O Plugin emite dois sinais de nível `warn` no nível de log padrão:

    - uma vez por conta na inicialização: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - uma vez por `chat_id` em runtime: `imessage: dropping group message from chat_id=<id> ...`

    DMs continuam funcionando porque usam um caminho de código diferente.

    Configuração mínima para manter grupos fluindo com `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Se essas linhas `warn` aparecerem no log do Gateway, a etapa 2 está descartando — adicione o bloco `groups`.
    </Warning>

    Mencione o controle por menção para grupos:

    - iMessage não tem metadados nativos de menção
    - a detecção de menções usa padrões regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, o controle por menção não pode ser aplicado

    Comandos de controle de remetentes autorizados podem contornar o controle por menção em grupos.

    `systemPrompt` por grupo:

    Cada entrada em `channels.imessage.groups.*` aceita uma string opcional `systemPrompt`. O valor é injetado no prompt de sistema do agente em cada turno que processa uma mensagem nesse grupo. A resolução espelha a resolução de prompt por grupo usada por `channels.whatsapp.groups`:

    1. **Prompt de sistema específico do grupo** (`groups["<chat_id>"].systemPrompt`): usado quando a entrada específica do grupo existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga é suprimido e nenhum prompt de sistema é aplicado a esse grupo.
    2. **Prompt de sistema curinga do grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está totalmente ausente do mapa ou quando ela existe, mas não define nenhuma chave `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompts por grupo se aplicam somente a mensagens de grupo — mensagens diretas neste canal não são afetadas.

  </Tab>

  <Tab title="Sessões e respostas determinísticas">
    - DMs usam roteamento direto; grupos usam roteamento de grupo.
    - Com o padrão `session.dmScope=main`, DMs do iMessage são consolidadas na sessão principal do agente.
    - Sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Respostas são roteadas de volta ao iMessage usando metadados do canal/alvo de origem.

    Comportamento de conversas semelhantes a grupos:

    Algumas conversas do iMessage com múltiplos participantes podem chegar com `is_group=false`.
    Se esse `chat_id` estiver configurado explicitamente em `channels.imessage.groups`, o OpenClaw o trata como tráfego de grupo (controle de grupo + isolamento de sessão de grupo).

  </Tab>
</Tabs>

## Vínculos de conversas ACP

Conversas legadas do iMessage também podem ser vinculadas a sessões ACP.

Fluxo rápido para operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat de grupo permitido.
- Mensagens futuras nessa mesma conversa do iMessage são roteadas para a sessão ACP gerada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove o vínculo.

Vínculos persistentes configurados são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` pode usar:

- identificador de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recomendado para vínculos de grupo estáveis)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Exemplo:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para o comportamento compartilhado de vínculos ACP.

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Usuário macOS dedicado para bot (identidade iMessage separada)">
    Use um Apple ID dedicado e um usuário macOS para que o tráfego do bot fique isolado do seu perfil pessoal do Messages.

    Fluxo típico:

    1. Crie/faça login em um usuário macOS dedicado.
    2. Faça login no Messages com o Apple ID do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenClaw possa executar `imsg` no contexto desse usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para esse perfil de usuário.

    A primeira execução pode exigir aprovações de GUI (Automação + Acesso Total ao Disco) nessa sessão de usuário do bot.

  </Accordion>

  <Accordion title="Mac remoto via Tailscale (exemplo)">
    Topologia comum:

    - Gateway é executado em Linux/VM
    - iMessage + `imsg` é executado em um Mac na sua tailnet
    - wrapper `cliPath` usa SSH para executar `imsg`
    - `remoteHost` habilita buscas de anexos via SCP

    Exemplo:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Use chaves SSH para que tanto SSH quanto SCP sejam não interativos.
    Garanta primeiro que a chave do host seja confiável (por exemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja preenchido.

  </Accordion>

  <Accordion title="Padrão de múltiplas contas">
    iMessage é compatível com configuração por conta em `channels.imessage.accounts`.

    Cada conta pode sobrescrever campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e listas de permissão de raízes de anexos.

  </Accordion>
</AccordionGroup>

## Mídia, fragmentação e alvos de entrega

<AccordionGroup>
  <Accordion title="Anexos e mídia">
    - a ingestão de anexos de entrada fica **desativada por padrão** — defina `channels.imessage.includeAttachments: true` para encaminhar fotos, memorandos de voz, vídeo e outros anexos ao agente. Com ela desativada, iMessages que contêm somente anexos são descartadas antes de chegar ao agente e podem não produzir nenhuma linha de log `Inbound message`.
    - caminhos remotos de anexos podem ser buscados via SCP quando `remoteHost` está definido
    - caminhos de anexos devem corresponder às raízes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - padrão de raiz padrão: `/Users/*/Library/Messages/Attachments`
    - SCP usa verificação estrita de chave de host (`StrictHostKeyChecking=yes`)
    - o tamanho de mídia de saída usa `channels.imessage.mediaMaxMb` (padrão 16 MB)

  </Accordion>

  <Accordion title="Fragmentação de saída">
    - limite de fragmento de texto: `channels.imessage.textChunkLimit` (padrão 4000)
    - modo de fragmentação: `channels.imessage.chunkMode`
      - `length` (padrão)
      - `newline` (divisão priorizando parágrafos)

  </Accordion>

  <Accordion title="Formatos de endereçamento">
    Alvos explícitos preferidos:

    - `chat_id:123` (recomendado para roteamento estável)
    - `chat_guid:...`
    - `chat_identifier:...`

    Alvos por identificador também são compatíveis:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Ações de API privada

Quando `imsg launch` está em execução e `openclaw channels status --probe` relata `privateApi.available: true`, a ferramenta de mensagens pode usar ações nativas do iMessage além dos envios normais de texto.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Ações disponíveis">
    - **react**: Adicione/remova tapbacks do iMessage (`messageId`, `emoji`, `remove`). Tapbacks compatíveis são mapeados para amor, curtir, não curtir, rir, enfatizar e pergunta.
    - **reply**: Envie uma resposta em thread para uma mensagem existente (`messageId`, `text` ou `message`, mais `chatGuid`, `chatId`, `chatIdentifier` ou `to`).
    - **sendWithEffect**: Envie texto com um efeito do iMessage (`text` ou `message`, `effect` ou `effectId`).
    - **edit**: Edite uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`, `text` ou `newText`).
    - **unsend**: Retraia uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`).
    - **upload-file**: Envie mídia/arquivos (`buffer` como base64 ou um `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias legado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gerencie chats de grupo quando o alvo atual é uma conversa de grupo.

  </Accordion>

  <Accordion title="IDs de mensagem">
    O contexto de entrada do iMessage inclui tanto valores curtos `MessageSid` quanto GUIDs completos de mensagem quando disponíveis. IDs curtos são limitados ao cache recente em memória de respostas e são verificados em relação ao chat atual antes do uso. Se um ID curto expirou ou pertence a outro chat, tente novamente com o `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Detecção de capacidade">
    O OpenClaw oculta ações de API privada somente quando o status em cache da sondagem informa que a ponte está indisponível. Se o status for desconhecido, as ações permanecem visíveis e a expedição sonda de forma preguiçosa para que a primeira ação possa ter sucesso após `imsg launch` sem uma atualização manual de status separada.

  </Accordion>

  <Accordion title="Confirmações de leitura e digitação">
    Quando a ponte de API privada está ativa, chats de entrada aceitos são marcados como lidos antes da expedição e um balão de digitação é mostrado ao remetente enquanto o agente gera a resposta. Desative a marcação de leitura com:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Builds mais antigos de `imsg` que antecedem a lista de capacidades por método desativarão digitação/leitura silenciosamente; o OpenClaw registra um aviso único por reinicialização para que a confirmação ausente seja atribuível.

  </Accordion>

  <Accordion title="Tapbacks de entrada">
    O OpenClaw assina tapbacks do iMessage e roteia reações aceitas como eventos de sistema em vez de texto normal de mensagem, de modo que um tapback do usuário não acione um loop comum de resposta.

    O modo de notificação é controlado por `channels.imessage.reactionNotifications`:

    - `"own"` (padrão): notifica somente quando usuários reagem a mensagens escritas pelo bot.
    - `"all"`: notifica para todos os tapbacks de entrada de remetentes autorizados.
    - `"off"`: ignora tapbacks de entrada.

    Sobrescritas por conta usam `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>
</AccordionGroup>

## Gravações de configuração

iMessage permite gravações de configuração iniciadas pelo canal por padrão (para `/config set|unset` quando `commands.config: true`).

Desative:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Coalescência de DMs com envio dividido (comando + URL em uma composição)

Quando um usuário digita um comando e uma URL juntos — por exemplo, `Dump https://example.com/article` — o aplicativo Messages da Apple divide o envio em **duas linhas separadas de `chat.db`**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de prévia de URL (`"https://..."`) com imagens de prévia OG como anexos.

As duas linhas chegam ao OpenClaw com ~0,8-2,0 s de diferença na maioria das configurações. Sem coalescência, o agente recebe apenas o comando no turno 1, responde (muitas vezes "me envie a URL") e só vê a URL no turno 2 — momento em que o contexto do comando já foi perdido. Isso é o pipeline de envio da Apple, não algo que o OpenClaw ou `imsg` introduz.

`channels.imessage.coalesceSameSenderDms` faz com que uma DM opte por mesclar linhas consecutivas do mesmo remetente em uma única rodada do agente. Conversas em grupo continuam sendo despachadas por mensagem para preservar a estrutura de rodadas com vários usuários.

<Tabs>
  <Tab title="Quando habilitar">
    Habilite quando:

    - Você distribui Skills que esperam `command + payload` em uma mensagem (dump, colar, salvar, enfileirar etc.).
    - Seus usuários colam URLs, imagens ou conteúdo longo junto com comandos.
    - Você pode aceitar a latência adicional da rodada de DM (veja abaixo).

    Deixe desabilitado quando:

    - Você precisa da latência mínima de comando para gatilhos de DM de uma única palavra.
    - Todos os seus fluxos são comandos únicos sem acompanhamentos de carga útil.

  </Tab>
  <Tab title="Habilitação">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Com a flag ativada e sem `messages.inbound.byChannel.imessage` explícito, a janela de debounce aumenta para **2500 ms** (o padrão legado é 0 ms — sem debounce). A janela maior é necessária porque a cadência de envio dividido da Apple, de 0,8 a 2,0 s, não cabe em um padrão mais estreito.

    Para ajustar a janela você mesmo:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is
            // slow or under memory pressure (observed gap can stretch past 2 s
            // then).
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **Latência adicional para mensagens de DM.** Com a flag ativada, toda DM (incluindo comandos de controle independentes e acompanhamentos de texto único) aguarda até a janela de debounce antes de ser despachada, caso uma linha de carga útil esteja chegando. Mensagens de conversa em grupo mantêm o despacho instantâneo.
    - **A saída mesclada é limitada.** O texto mesclado é limitado a 4000 caracteres com um marcador explícito `…[truncated]`; anexos são limitados a 20; entradas de origem são limitadas a 10 (a primeira e a mais recente são mantidas além disso). Todo GUID de origem é rastreado em `coalescedMessageGuids` para telemetria downstream.
    - **Apenas DM.** Conversas em grupo seguem para despacho por mensagem para que o bot permaneça responsivo quando várias pessoas estão digitando.
    - **Opt-in, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados. Configurações legadas do BlueBubbles que definem `channels.bluebubbles.coalesceSameSenderDms` devem migrar esse valor para `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Cenários e o que o agente vê

| Usuário escreve                                                     | `chat.db` produz      | Flag desativada (padrão)                | Flag ativada + janela de 2500 ms                                         |
| ------------------------------------------------------------------ | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (um envio)                              | 2 linhas com ~1 s de diferença | Duas rodadas do agente: "Dump" sozinho, depois URL | Uma rodada: texto mesclado `Dump https://example.com`                   |
| `Save this 📎image.jpg caption` (anexo + texto)                    | 2 linhas              | Duas rodadas (anexo descartado na mesclagem) | Uma rodada: texto + imagem preservados                                  |
| `/status` (comando independente)                                   | 1 linha               | Despacho instantâneo                    | **Aguarda até a janela e então despacha**                                |
| URL colada sozinha                                                  | 1 linha               | Despacho instantâneo                    | Despacho instantâneo (apenas uma entrada no bucket)                      |
| Texto + URL enviados como duas mensagens deliberadamente separadas, com minutos de diferença | 2 linhas fora da janela | Duas rodadas                            | Duas rodadas (a janela expira entre elas)                                |
| Fluxo rápido (>10 DMs pequenas dentro da janela)                    | N linhas              | N rodadas                               | Uma rodada, saída limitada (primeira + mais recente, limites de texto/anexo aplicados) |
| Duas pessoas digitando em uma conversa em grupo                     | N linhas de M remetentes | M+ rodadas (uma por bucket de remetente) | M+ rodadas — conversas em grupo não são mescladas                        |

## Recuperação após indisponibilidade do gateway

Quando o Gateway fica offline (falha, reinicialização, repouso do Mac, máquina desligada), `imsg watch` retoma a partir do estado atual de `chat.db` assim que o Gateway volta — tudo o que chegou durante a lacuna, por padrão, nunca é visto. A recuperação reproduz essas mensagens na próxima inicialização para que o agente não perca silenciosamente o tráfego de entrada.

A recuperação é **desabilitada por padrão**. Habilite por canal:

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // master switch (default: false)
      maxAgeMinutes: 120,        // skip rows older than now - 2h (default: 120, clamp 1..720)
      perRunLimit: 50,           // max rows replayed per startup (default: 50, clamp 1..500)
      firstRunLookbackMinutes: 30, // first run with no cursor: look back 30 min (default: 30)
      maxFailureRetries: 10,     // give up on a wedged guid after 10 dispatch failures (default: 10)
    },
  },
}
```

### Como ela é executada

Uma passagem por inicialização de `monitorIMessageProvider`, sequenciada como `imsg launch` pronto → `watch.subscribe` → `performIMessageCatchup` → loop de despacho ao vivo. A própria recuperação usa `chats.list` + `messages.history` por conversa contra o mesmo cliente JSON-RPC usado por `imsg watch`. Tudo o que chega durante a passagem de recuperação flui normalmente pelo despacho ao vivo; o cache de deduplicação de entrada existente absorve qualquer sobreposição com linhas reproduzidas.

Cada linha reproduzida passa pelo caminho de despacho ao vivo (`evaluateIMessageInbound` + `dispatchInboundMessage`), então allowlists, política de grupo, debouncer, cache de eco e confirmações de leitura se comportam de forma idêntica em mensagens reproduzidas e ao vivo.

### Semântica de cursor e tentativas

A recuperação mantém um cursor por conta em `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (o diretório de estado do OpenClaw usa `~/.openclaw` por padrão, substituível com `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- O cursor avança a cada despacho bem-sucedido e é mantido quando o despacho de uma linha lança erro — a próxima inicialização tenta novamente a mesma linha a partir do cursor mantido.
- Após `maxFailureRetries` lançamentos consecutivos contra o mesmo `guid`, a recuperação registra um `warn` e força o avanço do cursor para além da mensagem travada, para que inicializações subsequentes possam progredir.
- GUIDs já desistidos são ignorados ao serem vistos (sem tentativa de despacho) em execuções posteriores e contados em `skippedGivenUp` no resumo da execução.

### Sinais visíveis ao operador

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Uma linha `WARN ... capped to perRunLimit` significa que uma única inicialização não esgotou todo o backlog. Aumente `perRunLimit` (máx. 500) se suas lacunas excedem regularmente a passagem padrão de 50 linhas.

### Quando deixar desativada

- O Gateway roda continuamente com reinicialização automática por watchdog e as lacunas são sempre < alguns segundos — o padrão desativado é suficiente.
- O volume de DMs é baixo e mensagens perdidas não mudariam o comportamento do agente — a janela inicial de `firstRunLookbackMinutes` pode despachar contexto antigo inesperado na primeira habilitação.

Quando você ativa a recuperação, a primeira inicialização sem cursor só olha para trás `firstRunLookbackMinutes` (padrão de 30 min), não a janela completa de `maxAgeMinutes` — isso evita reproduzir um longo histórico de mensagens anteriores à habilitação.

## Solução de problemas

<AccordionGroup>
  <Accordion title="imsg não encontrado ou RPC sem suporte">
    Valide o binário e o suporte a RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Se a sondagem relatar RPC sem suporte, atualize `imsg`. Se ações de API privada não estiverem disponíveis, execute `imsg launch` na sessão do usuário macOS conectado e sonde novamente. Se o Gateway não estiver rodando no macOS, use a configuração de Mac remoto por SSH acima em vez do caminho local padrão de `imsg`.

  </Accordion>

  <Accordion title="Gateway não está rodando no macOS">
    O `cliPath: "imsg"` padrão deve rodar no Mac conectado ao Mensagens. No Linux ou Windows, defina `channels.imessage.cliPath` para um script wrapper que faça SSH para esse Mac e execute `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Então execute:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs são ignoradas">
    Verifique:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprovações de pareamento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Mensagens de grupo são ignoradas">
    Verifique:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento de allowlist de `channels.imessage.groups`
    - configuração de padrões de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Anexos remotos falham">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação por chave SSH/SCP a partir do host do Gateway
    - se a chave do host existe em `~/.ssh/known_hosts` no host do Gateway
    - legibilidade do caminho remoto no Mac que roda o Mensagens

  </Accordion>

  <Accordion title="Prompts de permissão do macOS foram perdidos">
    Execute novamente em um terminal GUI interativo no mesmo contexto de usuário/sessão e aprove os prompts:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirme que Acesso Total ao Disco + Automação estão concedidos para o contexto do processo que roda OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Ponteiros de referência de configuração

- [Referência de configuração - iMessage](/pt-BR/gateway/config-channels#imessage)
- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Pareamento](/pt-BR/channels/pairing)

## Relacionados

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Remoção do BlueBubbles e o caminho imsg do iMessage](/pt-BR/announcements/bluebubbles-imessage) — anúncio e resumo de migração
- [Vindo do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) — tabela de tradução de configuração e transição passo a passo
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de conversa em grupo e gate por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
