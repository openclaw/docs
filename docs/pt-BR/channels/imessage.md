---
read_when:
    - Configurando o suporte ao iMessage
    - Depuração de envio/recebimento do iMessage
summary: Compatibilidade nativa com iMessage via imsg (JSON-RPC sobre stdio), com ações de API privada para respostas, reações, efeitos, anexos e gerenciamento de grupos. Preferido para novas configurações de iMessage no OpenClaw quando os requisitos do host se aplicam.
title: iMessage
x-i18n:
    generated_at: "2026-05-10T19:21:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 249d5faf9718e354caecaeb8ee22f66f9e24b50c6b091997d1c2286c44c1581d
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para implantações do OpenClaw iMessage, use `imsg` em um host macOS Messages conectado. Se o seu Gateway roda em Linux ou Windows, aponte `channels.imessage.cliPath` para um wrapper SSH que executa `imsg` no Mac.

**A recuperação após indisponibilidade do Gateway é opcional.** Quando habilitada (`channels.imessage.catchup.enabled: true`), o Gateway reproduz mensagens recebidas que chegaram em `chat.db` enquanto ele estava offline (crash, reinicialização, suspensão do Mac) na próxima inicialização. Desabilitada por padrão — veja [Recuperando mensagens após indisponibilidade do Gateway](#catching-up-after-gateway-downtime). Fecha [openclaw#78649](https://github.com/openclaw/openclaw/issues/78649).
</Note>

<Warning>
O suporte ao BlueBubbles foi removido. Migre configurações de `channels.bluebubbles` para `channels.imessage`; o OpenClaw oferece suporte ao iMessage somente por meio de `imsg`.
</Warning>

Status: integração nativa com CLI externa. O Gateway inicia `imsg rpc` e se comunica por JSON-RPC em stdio (sem daemon/porta separado). Ações avançadas exigem `imsg launch` e uma sondagem bem-sucedida da API privada.

<CardGroup cols={3}>
  <Card title="Ações da API privada" icon="wand-sparkles" href="#private-api-actions">
    Respostas, tapbacks, efeitos, anexos e gerenciamento de grupos.
  </Card>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    DMs do iMessage usam modo de pareamento por padrão.
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

      <Step title="Inicie o Gateway">

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

  <Tab title="Mac remoto via SSH">
    O OpenClaw exige apenas um `cliPath` compatível com stdio, então você pode apontar `cliPath` para um script wrapper que usa SSH para acessar um Mac remoto e executar `imsg`.

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

    Se `remoteHost` não estiver definido, o OpenClaw tenta detectá-lo automaticamente analisando o script wrapper SSH.
    `remoteHost` deve ser `host` ou `user@host` (sem espaços ou opções SSH).
    O OpenClaw usa verificação estrita de chave de host para SCP, então a chave do host de retransmissão já deve existir em `~/.ssh/known_hosts`.
    Caminhos de anexos são validados contra raízes permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos e permissões (macOS)

- O Messages deve estar conectado no Mac que executa `imsg`.
- Acesso Total ao Disco é necessário para o contexto do processo que executa OpenClaw/`imsg` (acesso ao banco de dados do Messages).
- Permissão de Automação é necessária para enviar mensagens pelo Messages.app.
- Para ações avançadas (reagir / editar / cancelar envio / resposta encadeada / efeitos / operações de grupo), a Proteção de Integridade do Sistema deve estar desabilitada — veja [Habilitando a API privada do imsg](#enabling-the-imsg-private-api) abaixo. Envio/recebimento básico de texto e mídia funciona sem isso.

<Tip>
Permissões são concedidas por contexto de processo. Se o Gateway roda sem interface (LaunchAgent/SSH), execute uma vez um comando interativo nesse mesmo contexto para acionar os prompts:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Habilitando a API privada do imsg

`imsg` é distribuído com dois modos operacionais:

- **Modo básico** (padrão, sem necessidade de mudanças no SIP): texto e mídia de saída via `send`, monitoramento/histórico de entrada, lista de conversas. Isso é o que você obtém imediatamente após um `brew install steipete/tap/imsg` novo, mais as permissões padrão do macOS acima.
- **Modo de API privada**: `imsg` injeta uma dylib auxiliar em `Messages.app` para chamar funções internas de `IMCore`. Isso desbloqueia `react`, `edit`, `unsend`, `reply` (encadeada), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, além de indicadores de digitação e confirmações de leitura.

Para acessar a superfície de ações avançadas documentada nesta página do canal, você precisa do modo de API privada. O README do `imsg` é explícito sobre o requisito:

> Recursos avançados como `read`, `typing`, `launch`, envio enriquecido baseado em bridge, mutação de mensagens e gerenciamento de conversas são opcionais. Eles exigem que o SIP esteja desabilitado e que uma dylib auxiliar seja injetada em `Messages.app`. `imsg launch` se recusa a injetar quando o SIP está habilitado.

A técnica de injeção do auxiliar usa a própria dylib do `imsg` para acessar APIs privadas do Messages. Não há servidor de terceiros nem runtime do BlueBubbles no caminho do OpenClaw iMessage.

<Warning>
**Desabilitar o SIP é uma troca de segurança real.** O SIP é uma das principais proteções do macOS contra a execução de código de sistema modificado; desativá-lo em todo o sistema abre superfície de ataque adicional e efeitos colaterais. Em especial, **desabilitar o SIP em Macs Apple Silicon também desabilita a capacidade de instalar e executar apps iOS no seu Mac**.

Trate isso como uma escolha operacional deliberada, não como padrão. Se o seu modelo de ameaça não pode tolerar SIP desativado, o iMessage integrado fica limitado ao modo básico — apenas envio/recebimento de texto e mídia, sem reações / edição / cancelamento de envio / efeitos / operações de grupo.
</Warning>

### Configuração

1. **Instale (ou atualize) `imsg`** no Mac que executa Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   A saída de `imsg status --json` relata `bridge_version`, `rpc_methods` e `selectors` por método para que você possa ver o que a build atual oferece antes de começar.

2. **Desabilite a Proteção de Integridade do Sistema.** Isso é específico da versão do macOS porque o requisito subjacente da Apple depende do SO e do hardware:
   - **macOS 10.13–10.15 (Sierra–Catalina):** desabilite a Validação de Biblioteca via Terminal, reinicie no Modo de Recuperação, execute `csrutil disable`, reinicie.
   - **macOS 11+ (Big Sur e posterior), Intel:** Modo de Recuperação (ou Recuperação pela Internet), `csrutil disable`, reinicie.
   - **macOS 11+, Apple Silicon:** sequência de inicialização pelo botão liga/desliga para entrar na Recuperação; em versões recentes do macOS, segure a tecla **Shift Esquerdo** ao clicar em Continuar, depois `csrutil disable`. Configurações de máquina virtual seguem um fluxo separado — faça um snapshot da VM primeiro.
   - **macOS 26 / Tahoe:** políticas de validação de biblioteca e verificações de direitos privados do `imagent` ficaram ainda mais rígidas; `imsg` pode precisar de uma build atualizada para acompanhar. Se a injeção de `imsg launch` ou `selectors` específicos começarem a retornar falso após uma atualização major do macOS, verifique as notas de versão do `imsg` antes de presumir que a etapa do SIP funcionou.

   Siga o fluxo de Modo de Recuperação da Apple para o seu Mac para desabilitar o SIP antes de executar `imsg launch`.

3. **Injete o auxiliar.** Com o SIP desabilitado e o Messages.app conectado:

   ```bash
   imsg launch
   ```

   `imsg launch` se recusa a injetar quando o SIP ainda está habilitado, então isso também serve como confirmação de que a etapa 2 teve efeito.

4. **Verifique a bridge pelo OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   A entrada do iMessage deve relatar `works`, e `imsg status --json | jq '.selectors'` deve mostrar `retractMessagePart: true` mais quaisquer seletores de edição / digitação / leitura que sua build do macOS expõe. O gate por método do Plugin do OpenClaw em `actions.ts` só anuncia ações cujo seletor subjacente é `true`, então a superfície de ações que você vê na lista de ferramentas do agente reflete o que a bridge realmente pode fazer neste host.

Se `openclaw channels status --probe` relatar o canal como `works`, mas ações específicas lançarem "iMessage `<action>` requires the imsg private API bridge" no momento do despacho, execute `imsg launch` novamente — o auxiliar pode sair (reinício do Messages.app, atualização do SO etc.) e o status `available: true` em cache continuará anunciando ações até que a próxima sondagem atualize.

### Quando você não pode desabilitar o SIP

Se SIP desabilitado não for aceitável para o seu modelo de ameaça:

- `imsg` volta para o modo básico — apenas texto + mídia + recebimento.
- O Plugin do OpenClaw ainda anuncia envio de texto/mídia e monitoramento de entrada; ele apenas oculta `react`, `edit`, `unsend`, `reply`, `sendWithEffect` e operações de grupo da superfície de ações (conforme o gate de capacidade por método).
- Você pode executar um Mac separado que não seja Apple Silicon (ou um Mac dedicado para bot) com SIP desativado para a carga de trabalho do iMessage, mantendo o SIP habilitado nos seus dispositivos principais. Veja [Usuário macOS dedicado para bot (identidade iMessage separada)](#deployment-patterns) abaixo.

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.imessage.dmPolicy` controla mensagens diretas:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo de allowlist: `channels.imessage.allowFrom`.

    Entradas da allowlist podem ser handles, grupos estáticos de acesso de remetente (`accessGroup:<name>`) ou destinos de conversa (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupo + menções">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrão quando configurado)
    - `open`
    - `disabled`

    Allowlist de remetentes de grupo: `channels.imessage.groupAllowFrom`.

    Entradas de `groupAllowFrom` também podem referenciar grupos estáticos de acesso de remetente (`accessGroup:<name>`).

    Fallback em runtime: se `groupAllowFrom` não estiver definido, verificações de remetente de grupo do iMessage recorrem a `allowFrom` quando disponível.
    Observação de runtime: se `channels.imessage` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` e registra um aviso (mesmo se `channels.defaults.groupPolicy` estiver definido).

    <Warning>
    O roteamento de grupos tem **dois** gates de allowlist executados em sequência, e ambos devem passar:

    1. **Allowlist de remetente / destino de conversa** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` ou `chat_id`.
    2. **Registro de grupos** (`channels.imessage.groups`) — com `groupPolicy: "allowlist"`, este gate exige uma entrada curinga `groups: { "*": { ... } }` (define `allowAll = true`) ou uma entrada explícita por `chat_id` em `groups`.

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

    Se essas linhas `warn` aparecerem no log do Gateway, o gate 2 está descartando — adicione o bloco `groups`.
    </Warning>

    Gate de menção para grupos:

    - iMessage não tem metadados nativos de menção
    - a detecção de menção usa padrões regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, o controle por menção não pode ser aplicado

    Comandos de controle de remetentes autorizados podem ignorar o controle por menção em grupos.

    `systemPrompt` por grupo:

    Cada entrada em `channels.imessage.groups.*` aceita uma string opcional `systemPrompt`. O valor é injetado no prompt de sistema do agente em cada turno que trata uma mensagem nesse grupo. A resolução espelha a resolução de prompt por grupo usada por `channels.whatsapp.groups`:

    1. **Prompt de sistema específico do grupo** (`groups["<chat_id>"].systemPrompt`): usado quando a entrada específica do grupo existe no mapa **e** sua chave `systemPrompt` está definida. Se `systemPrompt` for uma string vazia (`""`), o curinga é suprimido e nenhum prompt de sistema é aplicado a esse grupo.
    2. **Prompt de sistema curinga do grupo** (`groups["*"].systemPrompt`): usado quando a entrada específica do grupo está totalmente ausente do mapa, ou quando ela existe mas não define nenhuma chave `systemPrompt`.

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

    Prompts por grupo se aplicam apenas a mensagens de grupo — mensagens diretas neste canal não são afetadas.

  </Tab>

  <Tab title="Sessões e respostas determinísticas">
    - DMs usam roteamento direto; grupos usam roteamento de grupo.
    - Com o padrão `session.dmScope=main`, DMs do iMessage são agrupadas na sessão principal do agente.
    - Sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - As respostas são roteadas de volta para o iMessage usando metadados do canal/target de origem.

    Comportamento de conversas semelhantes a grupos:

    Algumas conversas do iMessage com múltiplos participantes podem chegar com `is_group=false`.
    Se esse `chat_id` estiver explicitamente configurado em `channels.imessage.groups`, o OpenClaw o trata como tráfego de grupo (controle de grupo + isolamento de sessão de grupo).

  </Tab>
</Tabs>

## Vinculações de conversas ACP

Chats iMessage legados também podem ser vinculados a sessões ACP.

Fluxo rápido para operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat de grupo permitido.
- Mensagens futuras nessa mesma conversa do iMessage são roteadas para a sessão ACP criada.
- `/new` e `/reset` reiniciam a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove a vinculação.

Vinculações persistentes configuradas são aceitas por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` pode usar:

- handle de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recomendado para vinculações de grupo estáveis)
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

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para o comportamento compartilhado de vinculação ACP.

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Usuário macOS dedicado para bot (identidade iMessage separada)">
    Use um Apple ID e um usuário macOS dedicados para que o tráfego do bot fique isolado do seu perfil pessoal do Mensagens.

    Fluxo típico:

    1. Crie/faça login em um usuário macOS dedicado.
    2. Faça login no Mensagens com o Apple ID do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenClaw possa executar `imsg` no contexto desse usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para esse perfil de usuário.

    A primeira execução pode exigir aprovações pela GUI (Automação + Acesso Total ao Disco) nessa sessão do usuário do bot.

  </Accordion>

  <Accordion title="Mac remoto via Tailscale (exemplo)">
    Topologia comum:

    - o Gateway roda no Linux/VM
    - iMessage + `imsg` roda em um Mac na sua tailnet
    - o wrapper `cliPath` usa SSH para executar `imsg`
    - `remoteHost` habilita buscas de anexos por SCP

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

    Use chaves SSH para que SSH e SCP sejam não interativos.
    Garanta primeiro que a chave do host seja confiável (por exemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja preenchido.

  </Accordion>

  <Accordion title="Padrão multi-conta">
    O iMessage oferece suporte a configuração por conta em `channels.imessage.accounts`.

    Cada conta pode sobrescrever campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e listas de permissões de raízes de anexos.

  </Accordion>
</AccordionGroup>

## Mídia, fragmentação e targets de entrega

<AccordionGroup>
  <Accordion title="Anexos e mídia">
    - a ingestão de anexos de entrada fica **desativada por padrão** — defina `channels.imessage.includeAttachments: true` para encaminhar fotos, memorandos de voz, vídeo e outros anexos ao agente. Com isso desativado, iMessages contendo apenas anexos são descartadas antes de chegar ao agente e podem não produzir nenhuma linha de log `Inbound message`.
    - caminhos de anexos remotos podem ser buscados via SCP quando `remoteHost` está definido
    - caminhos de anexos devem corresponder a raízes permitidas:
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
    Targets explícitos preferidos:

    - `chat_id:123` (recomendado para roteamento estável)
    - `chat_guid:...`
    - `chat_identifier:...`

    Targets de handle também são compatíveis:

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
    - **react**: Adicionar/remover tapbacks do iMessage (`messageId`, `emoji`, `remove`). Tapbacks compatíveis mapeiam para love, like, dislike, laugh, emphasize e question.
    - **reply**: Enviar uma resposta em thread para uma mensagem existente (`messageId`, `text` ou `message`, mais `chatGuid`, `chatId`, `chatIdentifier` ou `to`).
    - **sendWithEffect**: Enviar texto com um efeito do iMessage (`text` ou `message`, `effect` ou `effectId`).
    - **edit**: Editar uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`, `text` ou `newText`).
    - **unsend**: Retrair uma mensagem enviada em versões compatíveis do macOS/API privada (`messageId`).
    - **upload-file**: Enviar mídia/arquivos (`buffer` como base64 ou um `media`/`path`/`filePath` hidratado, `filename`, `asVoice` opcional). Alias legado: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Gerenciar chats de grupo quando o target atual é uma conversa de grupo.

  </Accordion>

  <Accordion title="IDs de mensagem">
    O contexto de entrada do iMessage inclui valores curtos `MessageSid` e GUIDs completos de mensagem quando disponíveis. IDs curtos têm escopo no cache recente de respostas em memória e são verificados contra o chat atual antes do uso. Se um ID curto tiver expirado ou pertencer a outro chat, tente novamente com o `MessageSidFull` completo.

  </Accordion>

  <Accordion title="Detecção de capacidade">
    O OpenClaw oculta ações de API privada apenas quando o status em cache da sondagem diz que a ponte está indisponível. Se o status for desconhecido, as ações permanecem visíveis e o despacho faz sondagens sob demanda para que a primeira ação possa ter sucesso após `imsg launch` sem uma atualização manual de status separada.

  </Accordion>

  <Accordion title="Confirmações de leitura e digitação">
    Quando a ponte de API privada está ativa, chats de entrada aceitos são marcados como lidos antes do despacho e um balão de digitação é mostrado ao remetente enquanto o agente gera. Desative a marcação de leitura com:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Builds mais antigos do `imsg`, anteriores à lista de capacidades por método, desativarão silenciosamente digitação/leitura; o OpenClaw registra um aviso único por reinicialização para que a confirmação ausente seja atribuível.

  </Accordion>
</AccordionGroup>

## Escritas de configuração

O iMessage permite escritas de configuração iniciadas pelo canal por padrão (para `/config set|unset` quando `commands.config: true`).

Desativar:

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

## Coalescência de DMs enviadas em partes (comando + URL em uma composição)

Quando um usuário digita um comando e uma URL juntos — por exemplo, `Dump https://example.com/article` — o app Mensagens da Apple divide o envio em **duas linhas separadas de `chat.db`**:

1. Uma mensagem de texto (`"Dump"`).
2. Um balão de prévia de URL (`"https://..."`) com imagens de prévia OG como anexos.

As duas linhas chegam ao OpenClaw com ~0,8-2,0 s de diferença na maioria das configurações. Sem coalescência, o agente recebe apenas o comando no turno 1, responde (frequentemente "envie a URL") e só vê a URL no turno 2 — momento em que o contexto do comando já foi perdido. Esse é o pipeline de envio da Apple, não algo introduzido pelo OpenClaw ou por `imsg`.

`channels.imessage.coalesceSameSenderDms` opta por mesclar linhas consecutivas do mesmo remetente em uma DM em um único turno do agente. Chats de grupo continuam a despachar por mensagem para preservar a estrutura de turnos multiusuário.

<Tabs>
  <Tab title="Quando habilitar">
    Habilite quando:

    - Você distribui Skills que esperam `command + payload` em uma mensagem (dump, paste, save, queue etc.).
    - Seus usuários colam URLs, imagens ou conteúdo longo junto com comandos.
    - Você pode aceitar a latência adicional de turno em DM (veja abaixo).

    Deixe desativado quando:

    - Você precisa de latência mínima de comando para gatilhos de DM de uma única palavra.
    - Todos os seus fluxos são comandos únicos sem acompanhamentos de payload.

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

    Com a flag ativada e sem `messages.inbound.byChannel.imessage` explícito, a janela de debounce aumenta para **2500 ms** (o padrão legado é 0 ms — sem debounce). A janela maior é necessária porque a cadência de envio dividido da Apple, de 0,8 a 2,0 s, não cabe em um padrão mais curto.

    Para ajustar a janela manualmente:

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
    - **Latência adicionada para mensagens DM.** Com a flag ativada, cada DM (incluindo comandos de controle independentes e respostas de texto único) aguarda até a janela de debounce antes do envio, caso uma linha de payload esteja chegando. Mensagens de chat em grupo mantêm envio instantâneo.
    - **A saída mesclada é limitada.** O texto mesclado é limitado a 4000 caracteres com um marcador explícito `…[truncated]`; anexos são limitados a 20; entradas de origem são limitadas a 10 (a primeira e as mais recentes são preservadas além disso). Cada GUID de origem é rastreado em `coalescedMessageGuids` para telemetria downstream.
    - **Apenas DM.** Chats em grupo passam para envio por mensagem, para que o bot continue responsivo quando várias pessoas estiverem digitando.
    - **Opt-in, por canal.** Outros canais (Telegram, WhatsApp, Slack, …) não são afetados. Configurações legadas do BlueBubbles que definem `channels.bluebubbles.coalesceSameSenderDms` devem migrar esse valor para `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Cenários e o que o agente vê

| O usuário compõe                                                   | `chat.db` produz      | Flag desativada (padrão)                       | Flag ativada + janela de 2500 ms                                        |
| ------------------------------------------------------------------ | --------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (um envio)                              | 2 linhas com ~1 s entre elas | Dois turnos do agente: "Dump" sozinho, depois a URL | Um turno: texto mesclado `Dump https://example.com`                     |
| `Save this 📎image.jpg caption` (anexo + texto)                    | 2 linhas              | Dois turnos (anexo descartado na mesclagem)    | Um turno: texto + imagem preservados                                    |
| `/status` (comando independente)                                   | 1 linha               | Envio instantâneo                              | **Aguarda até a janela e então envia**                                  |
| URL colada sozinha                                                 | 1 linha               | Envio instantâneo                              | Envio instantâneo (apenas uma entrada no bucket)                        |
| Texto + URL enviados como duas mensagens separadas deliberadas, com minutos de diferença | 2 linhas fora da janela | Dois turnos                                    | Dois turnos (a janela expira entre eles)                                |
| Enxurrada rápida (>10 DMs pequenas dentro da janela)               | N linhas              | N turnos                                       | Um turno, saída limitada (primeira + mais recentes, limites de texto/anexo aplicados) |
| Duas pessoas digitando em um chat em grupo                         | N linhas de M remetentes | M+ turnos (um por bucket de remetente)         | M+ turnos — chats em grupo não são coalescidos                          |

## Recuperação após indisponibilidade do gateway

Quando o gateway está offline (crash, reinicialização, repouso do Mac, máquina desligada), `imsg watch` retoma a partir do estado atual de `chat.db` quando o gateway volta — qualquer coisa que tenha chegado durante a lacuna, por padrão, nunca é vista. A recuperação reproduz essas mensagens na próxima inicialização para que o agente não perca silenciosamente o tráfego de entrada.

A recuperação é **desativada por padrão**. Ative-a por canal:

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

### Como é executada

Uma passagem por inicialização de `monitorIMessageProvider`, sequenciada como `imsg launch` pronto → `watch.subscribe` → `performIMessageCatchup` → loop de envio ao vivo. A recuperação em si usa `chats.list` + `messages.history` por chat contra o mesmo cliente JSON-RPC usado por `imsg watch`. Qualquer coisa que chegue durante a passagem de recuperação flui normalmente pelo envio ao vivo; o cache de deduplicação de entrada existente absorve qualquer sobreposição com linhas reproduzidas.

Cada linha reproduzida passa pelo caminho de envio ao vivo (`evaluateIMessageInbound` + `dispatchInboundMessage`), então allowlists, política de grupo, debouncer, cache de eco e confirmações de leitura se comportam de forma idêntica em mensagens reproduzidas e ao vivo.

### Semântica de cursor e nova tentativa

A recuperação mantém um cursor por conta em `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` (o diretório de estado do OpenClaw usa `~/.openclaw` por padrão, substituível com `OPENCLAW_STATE_DIR`):

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- O cursor avança a cada envio bem-sucedido e é mantido quando o envio de uma linha lança erro — a próxima inicialização tenta novamente a mesma linha a partir do cursor mantido.
- Após `maxFailureRetries` erros consecutivos contra o mesmo `guid`, a recuperação registra um `warn` e força o avanço do cursor para além da mensagem travada, para que inicializações subsequentes possam progredir.
- Guids já abandonados são ignorados assim que vistos (sem tentativa de envio) em execuções posteriores e contabilizados em `skippedGivenUp` no resumo da execução.

### Sinais visíveis ao operador

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

Uma linha `WARN ... capped to perRunLimit` significa que uma única inicialização não drenou todo o backlog. Aumente `perRunLimit` (máx. 500) se suas lacunas excedem regularmente a passagem padrão de 50 linhas.

### Quando deixar desativado

- O Gateway roda continuamente com reinicialização automática por watchdog e as lacunas são sempre < alguns segundos — o padrão desativado é suficiente.
- O volume de DMs é baixo e mensagens perdidas não mudariam o comportamento do agente — a janela inicial de `firstRunLookbackMinutes` pode enviar contexto antigo inesperado na primeira ativação.

Quando você ativa a recuperação, a primeira inicialização sem cursor só olha para trás `firstRunLookbackMinutes` (padrão de 30 min), não a janela completa de `maxAgeMinutes` — isso evita reproduzir um longo histórico de mensagens anteriores à ativação.

## Solução de problemas

<AccordionGroup>
  <Accordion title="imsg not found or RPC unsupported">
    Valide o binário e o suporte a RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Se a sondagem informar que RPC não é suportado, atualize `imsg`. Se ações de API privada estiverem indisponíveis, execute `imsg launch` na sessão do usuário macOS conectado e sonde novamente. Se o Gateway não estiver rodando no macOS, use a configuração de Mac remoto via SSH acima em vez do caminho local padrão de `imsg`.

  </Accordion>

  <Accordion title="Gateway is not running on macOS">
    O `cliPath: "imsg"` padrão deve rodar no Mac conectado ao Mensagens. No Linux ou Windows, defina `channels.imessage.cliPath` como um script wrapper que faz SSH para esse Mac e executa `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Então execute:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DMs are ignored">
    Verifique:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - aprovações de pareamento (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Group messages are ignored">
    Verifique:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - comportamento de allowlist de `channels.imessage.groups`
    - configuração de padrão de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Remote attachments fail">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação por chave SSH/SCP a partir do host do gateway
    - existência da chave do host em `~/.ssh/known_hosts` no host do gateway
    - legibilidade do caminho remoto no Mac que roda o Mensagens

  </Accordion>

  <Accordion title="macOS permission prompts were missed">
    Execute novamente em um terminal GUI interativo no mesmo contexto de usuário/sessão e aprove os prompts:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Confirme que Acesso Total ao Disco + Automação estão concedidos para o contexto do processo que executa OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Ponteiros de referência de configuração

- [Referência de configuração - iMessage](/pt-BR/gateway/config-channels#imessage)
- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Pareamento](/pt-BR/channels/pairing)

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Migrando do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles) — tabela de tradução de configuração e migração passo a passo
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e fortalecimento
