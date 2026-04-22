---
read_when:
    - Configurando o suporte ao iMessage
    - Depurando o envio/recebimento do iMessage
summary: Suporte legado ao iMessage via imsg (JSON-RPC sobre stdio). Novas configurações devem usar BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-22T04:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9cc5a0bd4fbc7ff6f792e737bc4302a67f9ab6aa8231ff6f751fe6d732ca5d
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (legado: imsg)

<Warning>
Para novas implantações de iMessage, use <a href="/pt-BR/channels/bluebubbles">BlueBubbles</a>.

A integração `imsg` é legada e pode ser removida em uma versão futura.
</Warning>

Status: integração legada de CLI externa. O Gateway inicia `imsg rpc` e se comunica por JSON-RPC sobre stdio (sem daemon/porta separados).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recomendado)" icon="message-circle" href="/pt-BR/channels/bluebubbles">
    Caminho preferido de iMessage para novas configurações.
  </Card>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    As DMs do iMessage usam o modo de pareamento por padrão.
  </Card>
  <Card title="Referência de configuração" icon="settings" href="/pt-BR/gateway/configuration-reference#imessage">
    Referência completa dos campos de iMessage.
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

      <Step title="Aprove o primeiro pareamento de DM (dmPolicy padrão)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        As solicitações de pareamento expiram após 1 hora.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac remoto via SSH">
    O OpenClaw exige apenas um `cliPath` compatível com stdio, então você pode apontar `cliPath` para um script wrapper que usa SSH para um Mac remoto e executa `imsg`.

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
      remoteHost: "user@gateway-host", // usado para buscas de anexos via SCP
      includeAttachments: true,
      // Opcional: substitui as raízes de anexos permitidas.
      // Os padrões incluem /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` não estiver definido, o OpenClaw tentará detectá-lo automaticamente analisando o script wrapper SSH.
    `remoteHost` deve ser `host` ou `user@host` (sem espaços nem opções de SSH).
    O OpenClaw usa verificação estrita de chave de host para SCP, então a chave do host de retransmissão já deve existir em `~/.ssh/known_hosts`.
    Os caminhos de anexo são validados em relação às raízes permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos e permissões (macOS)

- O Messages deve estar conectado na Mac que executa `imsg`.
- É necessário Full Disk Access para o contexto de processo que executa OpenClaw/`imsg` (acesso ao banco de dados do Messages).
- É necessária permissão de Automation para enviar mensagens pelo Messages.app.

<Tip>
As permissões são concedidas por contexto de processo. Se o gateway estiver sendo executado sem interface (LaunchAgent/SSH), execute um comando interativo uma vez nesse mesmo contexto para disparar os prompts:

```bash
imsg chats --limit 1
# ou
imsg send <handle> "test"
```

</Tip>

## Controle de acesso e roteamento

<Tabs>
  <Tab title="Política de DM">
    `channels.imessage.dmPolicy` controla as mensagens diretas:

    - `pairing` (padrão)
    - `allowlist`
    - `open` (exige que `allowFrom` inclua `"*"`)
    - `disabled`

    Campo de allowlist: `channels.imessage.allowFrom`.

    As entradas da allowlist podem ser handles ou destinos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupos + menções">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrão quando configurado)
    - `open`
    - `disabled`

    Allowlist de remetentes de grupo: `channels.imessage.groupAllowFrom`.

    Fallback em runtime: se `groupAllowFrom` não estiver definido, as verificações de remetente em grupos do iMessage usam `allowFrom` como fallback, quando disponível.
    Observação de runtime: se `channels.imessage` estiver completamente ausente, o runtime usa `groupPolicy="allowlist"` como fallback e registra um aviso (mesmo se `channels.defaults.groupPolicy` estiver definido).

    Controle por menção para grupos:

    - o iMessage não tem metadados nativos de menção
    - a detecção de menção usa padrões regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, o controle por menção não pode ser imposto

    Comandos de controle de remetentes autorizados podem ignorar o controle por menção em grupos.

  </Tab>

  <Tab title="Sessões e respostas determinísticas">
    - DMs usam roteamento direto; grupos usam roteamento de grupo.
    - Com o padrão `session.dmScope=main`, as DMs do iMessage são consolidadas na sessão principal do agente.
    - As sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - As respostas são roteadas de volta para o iMessage usando metadados do canal/destino de origem.

    Comportamento de thread tipo grupo:

    Algumas threads de iMessage com múltiplos participantes podem chegar com `is_group=false`.
    Se esse `chat_id` estiver explicitamente configurado em `channels.imessage.groups`, o OpenClaw tratará isso como tráfego de grupo (controle de grupo + isolamento de sessão de grupo).

  </Tab>
</Tabs>

## Vínculos de conversa ACP

Chats legados de iMessage também podem ser vinculados a sessões ACP.

Fluxo rápido para operador:

- Execute `/acp spawn codex --bind here` dentro da DM ou do chat de grupo permitido.
- Mensagens futuras nessa mesma conversa de iMessage serão roteadas para a sessão ACP iniciada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no local.
- `/acp close` fecha a sessão ACP e remove o vínculo.

Vínculos persistentes configurados são compatíveis por meio de entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` pode usar:

- handle de DM normalizado, como `+15555550123` ou `user@example.com`
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
  <Accordion title="Usuário macOS dedicado para bot (identidade de iMessage separada)">
    Use um Apple ID e um usuário macOS dedicados para que o tráfego do bot fique isolado do seu perfil pessoal do Messages.

    Fluxo típico:

    1. Crie/faça login em um usuário macOS dedicado.
    2. Faça login no Messages com o Apple ID do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenClaw possa executar `imsg` no contexto desse usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para o perfil desse usuário.

    A primeira execução pode exigir aprovações na GUI (Automation + Full Disk Access) nessa sessão de usuário do bot.

  </Accordion>

  <Accordion title="Mac remoto sobre Tailscale (exemplo)">
    Topologia comum:

    - o gateway é executado em Linux/VM
    - iMessage + `imsg` é executado em um Mac na sua tailnet
    - o wrapper `cliPath` usa SSH para executar `imsg`
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
    Certifique-se primeiro de que a chave do host é confiável (por exemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja preenchido.

  </Accordion>

  <Accordion title="Padrão com várias contas">
    O iMessage oferece suporte a configuração por conta em `channels.imessage.accounts`.

    Cada conta pode substituir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e allowlists de raízes de anexos.

  </Accordion>
</AccordionGroup>

## Mídia, fragmentação e destinos de entrega

<AccordionGroup>
  <Accordion title="Anexos e mídia">
    - a ingestão de anexos recebidos é opcional: `channels.imessage.includeAttachments`
    - caminhos de anexos remotos podem ser buscados via SCP quando `remoteHost` estiver definido
    - os caminhos de anexo devem corresponder às raízes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo SCP remoto)
      - padrão de raiz padrão: `/Users/*/Library/Messages/Attachments`
    - o SCP usa verificação estrita de chave de host (`StrictHostKeyChecking=yes`)
    - o tamanho de mídia de saída usa `channels.imessage.mediaMaxMb` (padrão 16 MB)
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

    Destinos por handle também são compatíveis:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Escritas de configuração

O iMessage permite escritas de configuração iniciadas pelo canal por padrão (para `/config set|unset` quando `commands.config: true`).

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

## Solução de problemas

<AccordionGroup>
  <Accordion title="imsg não encontrado ou RPC sem suporte">
    Valide o binário e o suporte a RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Se a sondagem informar que RPC não é compatível, atualize o `imsg`.

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
    - comportamento da allowlist de `channels.imessage.groups`
    - configuração dos padrões de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Anexos remotos falham">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação por chave SSH/SCP a partir do host do gateway
    - a chave do host existe em `~/.ssh/known_hosts` no host do gateway
    - legibilidade do caminho remoto no Mac que executa o Messages

  </Accordion>

  <Accordion title="Prompts de permissão do macOS foram perdidos">
    Execute novamente em um terminal GUI interativo no mesmo contexto de usuário/sessão e aprove os prompts:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirme que Full Disk Access + Automation foram concedidos para o contexto de processo que executa OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Ponteiros para a referência de configuração

- [Referência de configuração - iMessage](/pt-BR/gateway/configuration-reference#imessage)
- [Configuração do gateway](/pt-BR/gateway/configuration)
- [Pareamento](/pt-BR/channels/pairing)
- [BlueBubbles](/pt-BR/channels/bluebubbles)

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
