---
read_when:
    - Configurando o suporte ao iMessage
    - Depuração do envio/recebimento do iMessage
summary: Suporte nativo ao iMessage via imsg (JSON-RPC sobre stdio). Preferencial para novas configurações de iMessage no OpenClaw quando os requisitos do host forem atendidos.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Para novas implantações do OpenClaw iMessage, comece aqui quando você puder executar `imsg` em um host macOS Messages conectado. O BlueBubbles continua disponível como fallback legado para configurações existentes que dependem do servidor HTTP, webhooks ou ações mais avançadas de API privada dele.
</Note>

Status: integração nativa com CLI externa. O Gateway inicia `imsg rpc` e se comunica por JSON-RPC em stdio (sem daemon/porta separados).

<CardGroup cols={3}>
  <Card title="BlueBubbles (fallback legado)" icon="message-circle" href="/pt-BR/channels/bluebubbles">
    Continue usando para roteamento existente baseado no BlueBubbles; evite em novas configurações quando o imsg atender.
  </Card>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    DMs do iMessage usam o modo de pareamento por padrão.
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
    O OpenClaw requer apenas um `cliPath` compatível com stdio, então você pode apontar `cliPath` para um script wrapper que usa SSH para acessar um Mac remoto e executar `imsg`.

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

- O Messages deve estar conectado no Mac que executa `imsg`.
- Acesso Total ao Disco é necessário para o contexto de processo que executa OpenClaw/`imsg` (acesso ao banco de dados do Messages).
- Permissão de Automação é necessária para enviar mensagens pelo Messages.app.

<Tip>
Permissões são concedidas por contexto de processo. Se o gateway for executado sem interface (LaunchAgent/SSH), execute um comando interativo uma vez nesse mesmo contexto para acionar os prompts:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.imessage.dmPolicy` controla mensagens diretas:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (requer que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo de lista de permissões: `channels.imessage.allowFrom`.

    Entradas da lista de permissões podem ser identificadores ou destinos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupo + menções">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrão quando configurado)
    - `open`
    - `disabled`

    Lista de permissões de remetentes de grupo: `channels.imessage.groupAllowFrom`.

    Fallback em runtime: se `groupAllowFrom` não estiver definido, as verificações de remetente de grupo do iMessage usam `allowFrom` como fallback quando disponível.
    Observação de runtime: se `channels.imessage` estiver completamente ausente, o runtime usa `groupPolicy="allowlist"` como fallback e registra um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Controle de menções para grupos:

    - iMessage não tem metadados nativos de menção
    - a detecção de menções usa padrões regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, o controle por menção não pode ser aplicado

    Comandos de controle de remetentes autorizados podem ignorar o controle por menção em grupos.

  </Tab>

  <Tab title="Sessões e respostas determinísticas">
    - DMs usam roteamento direto; grupos usam roteamento de grupo.
    - Com `session.dmScope=main` padrão, DMs do iMessage são agrupadas na sessão principal do agente.
    - Sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - Respostas são roteadas de volta ao iMessage usando metadados do canal/destino de origem.

    Comportamento de conversas semelhantes a grupos:

    Algumas conversas do iMessage com vários participantes podem chegar com `is_group=false`.
    Se esse `chat_id` estiver configurado explicitamente em `channels.imessage.groups`, o OpenClaw o tratará como tráfego de grupo (controle de grupo + isolamento de sessão de grupo).

  </Tab>
</Tabs>

## Vínculos de conversa ACP

Chats legados do iMessage também podem ser vinculados a sessões ACP.

Fluxo rápido do operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat de grupo permitido.
- Mensagens futuras nessa mesma conversa do iMessage serão roteadas para a sessão ACP iniciada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no lugar.
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

Consulte [Agentes ACP](/pt-BR/tools/acp-agents) para o comportamento compartilhado de vínculo ACP.

## Padrões de implantação

<AccordionGroup>
  <Accordion title="Usuário macOS dedicado para bot (identidade iMessage separada)">
    Use um Apple ID e um usuário macOS dedicados para que o tráfego do bot fique isolado do seu perfil pessoal do Messages.

    Fluxo típico:

    1. Crie/acesse um usuário macOS dedicado.
    2. Entre no Messages com o Apple ID do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenClaw possa executar `imsg` nesse contexto de usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para esse perfil de usuário.

    A primeira execução pode exigir aprovações pela GUI (Automação + Acesso Total ao Disco) nessa sessão de usuário do bot.

  </Accordion>

  <Accordion title="Mac remoto por Tailscale (exemplo)">
    Topologia comum:

    - o gateway é executado em Linux/VM
    - iMessage + `imsg` é executado em um Mac na sua tailnet
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

    Use chaves SSH para que tanto SSH quanto SCP sejam não interativos.
    Garanta que a chave do host seja confiável primeiro (por exemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja preenchido.

  </Accordion>

  <Accordion title="Padrão multi-conta">
    iMessage permite configuração por conta em `channels.imessage.accounts`.

    Cada conta pode sobrescrever campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e listas de permissões de raízes de anexos.

  </Accordion>
</AccordionGroup>

## Mídia, fragmentação e destinos de entrega

<AccordionGroup>
  <Accordion title="Anexos e mídia">
    - a ingestão de anexos recebidos é opcional: `channels.imessage.includeAttachments`
    - caminhos de anexos remotos podem ser buscados por SCP quando `remoteHost` está definido
    - caminhos de anexos devem corresponder às raízes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - padrão de raiz padrão: `/Users/*/Library/Messages/Attachments`
    - SCP usa verificação estrita de chave de host (`StrictHostKeyChecking=yes`)
    - o tamanho de mídia enviada usa `channels.imessage.mediaMaxMb` (padrão 16 MB)

  </Accordion>

  <Accordion title="Fragmentação de saída">
    - limite de fragmento de texto: `channels.imessage.textChunkLimit` (padrão 4000)
    - modo de fragmentação: `channels.imessage.chunkMode`
      - `length` (padrão)
      - `newline` (divisão priorizando parágrafos)

  </Accordion>

  <Accordion title="Formatos de endereçamento">
    Destinos explícitos preferidos:

    - `chat_id:123` (recomendado para roteamento estável)
    - `chat_guid:...`
    - `chat_identifier:...`

    Destinos por identificador também são compatíveis:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Gravações de configuração

iMessage permite gravações de configuração iniciadas pelo canal por padrão (para `/config set|unset` quando `commands.config: true`).

Desabilitar:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="imsg não encontrado ou RPC sem suporte">
    Valide o binário e o suporte a RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Se a sondagem informar que RPC não tem suporte, atualize `imsg`.

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
    - comportamento da lista de permissões de `channels.imessage.groups`
    - configuração de padrão de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Anexos remotos falham">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação por chave SSH/SCP a partir do host do gateway
    - a chave do host existe em `~/.ssh/known_hosts` no host do gateway
    - legibilidade do caminho remoto no Mac que executa Messages

  </Accordion>

  <Accordion title="Prompts de permissão do macOS foram perdidos">
    Execute novamente em um terminal GUI interativo no mesmo contexto de usuário/sessão e aprove os prompts:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirme que Acesso Total ao Disco + Automação foram concedidos para o contexto de processo que executa OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Ponteiros de referência de configuração

- [Referência de configuração - iMessage](/pt-BR/gateway/config-channels#imessage)
- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Pareamento](/pt-BR/channels/pairing)
- [BlueBubbles](/pt-BR/channels/bluebubbles)

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento do chat em grupo e restrição por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e endurecimento
