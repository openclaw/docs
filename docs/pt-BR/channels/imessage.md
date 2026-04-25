---
read_when:
    - Configurando o suporte ao iMessage
    - Depurando o envio/recebimento do iMessage
summary: Suporte legado ao iMessage via imsg (JSON-RPC por stdio). Novas configurações devem usar BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-25T13:41:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b693b222ab60fe9fee8be47ec4b347ba126f11558888d336220e39425023dcd
    source_path: channels/imessage.md
    workflow: 15
---

<Warning>
Para novas implantações de iMessage, use <a href="/pt-BR/channels/bluebubbles">BlueBubbles</a>.

A integração `imsg` é legada e pode ser removida em uma versão futura.
</Warning>

Status: integração legada de CLI externa. O Gateway inicia `imsg rpc` e se comunica por JSON-RPC em stdio (sem daemon/porta separados).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recomendado)" icon="message-circle" href="/pt-BR/channels/bluebubbles">
    Caminho preferencial de iMessage para novas configurações.
  </Card>
  <Card title="Pareamento" icon="link" href="/pt-BR/channels/pairing">
    Mensagens diretas de iMessage usam o modo de pareamento por padrão.
  </Card>
  <Card title="Referência de configuração" icon="settings" href="/pt-BR/gateway/config-channels#imessage">
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

      <Step title="Inicie o Gateway">

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

  <Tab title="Mac remoto por SSH">
    O OpenClaw exige apenas um `cliPath` compatível com stdio, então você pode apontar `cliPath` para um script wrapper que faça SSH para um Mac remoto e execute `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuração recomendada quando anexos estão ativados:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // usado para buscas de anexos por SCP
      includeAttachments: true,
      // Opcional: substitui as raízes de anexos permitidas.
      // Os padrões incluem /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Se `remoteHost` não estiver definido, o OpenClaw tentará detectá-lo automaticamente analisando o script wrapper de SSH.
    `remoteHost` deve ser `host` ou `user@host` (sem espaços nem opções de SSH).
    O OpenClaw usa verificação estrita de chave de host para SCP, portanto a chave de host do relay já deve existir em `~/.ssh/known_hosts`.
    Os caminhos de anexos são validados em relação às raízes permitidas (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Requisitos e permissões (macOS)

- O app Mensagens deve estar autenticado no Mac que executa `imsg`.
- Full Disk Access é necessário para o contexto de processo que executa OpenClaw/`imsg` (acesso ao banco de dados do Mensagens).
- Permissão de Automação é necessária para enviar mensagens pelo Messages.app.

<Tip>
As permissões são concedidas por contexto de processo. Se o Gateway executar sem interface gráfica (LaunchAgent/SSH), execute um comando interativo uma vez nesse mesmo contexto para acionar os prompts:

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

    As entradas da allowlist podem ser handles ou alvos de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Política de grupos + menções">
    `channels.imessage.groupPolicy` controla o tratamento de grupos:

    - `allowlist` (padrão quando configurado)
    - `open`
    - `disabled`

    Allowlist de remetentes de grupo: `channels.imessage.groupAllowFrom`.

    Fallback em runtime: se `groupAllowFrom` não estiver definido, as verificações de remetente de grupos de iMessage usam `allowFrom` como fallback quando disponível.
    Observação de runtime: se `channels.imessage` estiver completamente ausente, o runtime usará `groupPolicy="allowlist"` como fallback e registrará um aviso (mesmo que `channels.defaults.groupPolicy` esteja definido).

    Restrição por menção para grupos:

    - iMessage não tem metadados nativos de menção
    - a detecção de menções usa padrões regex (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - sem padrões configurados, a restrição por menção não pode ser aplicada

    Comandos de controle de remetentes autorizados podem contornar a restrição por menção em grupos.

  </Tab>

  <Tab title="Sessões e respostas determinísticas">
    - DMs usam roteamento direto; grupos usam roteamento de grupo.
    - Com o padrão `session.dmScope=main`, as DMs de iMessage são consolidadas na sessão principal do agente.
    - As sessões de grupo são isoladas (`agent:<agentId>:imessage:group:<chat_id>`).
    - As respostas retornam para o iMessage usando os metadados de canal/alvo de origem.

    Comportamento semelhante a grupo em threads:

    Algumas threads de iMessage com vários participantes podem chegar com `is_group=false`.
    Se esse `chat_id` estiver configurado explicitamente em `channels.imessage.groups`, o OpenClaw tratará isso como tráfego de grupo (restrição de grupo + isolamento de sessão de grupo).

  </Tab>
</Tabs>

## Vinculações de conversa ACP

Chats legados de iMessage também podem ser vinculados a sessões ACP.

Fluxo rápido para operadores:

- Execute `/acp spawn codex --bind here` dentro da DM ou do grupo permitido.
- Mensagens futuras nessa mesma conversa de iMessage serão roteadas para a sessão ACP iniciada.
- `/new` e `/reset` redefinem a mesma sessão ACP vinculada no mesmo lugar.
- `/acp close` fecha a sessão ACP e remove a vinculação.

Vinculações persistentes configuradas são suportadas por entradas `bindings[]` de nível superior com `type: "acp"` e `match.channel: "imessage"`.

`match.peer.id` pode usar:

- handle de DM normalizado, como `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recomendado para vinculações estáveis de grupo)
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
  <Accordion title="Usuário macOS dedicado para bot (identidade de iMessage separada)">
    Use um Apple ID dedicado e um usuário macOS dedicado para que o tráfego do bot fique isolado do seu perfil pessoal do app Mensagens.

    Fluxo típico:

    1. Crie/faça login em um usuário macOS dedicado.
    2. Faça login no Mensagens com o Apple ID do bot nesse usuário.
    3. Instale `imsg` nesse usuário.
    4. Crie um wrapper SSH para que o OpenClaw possa executar `imsg` nesse contexto de usuário.
    5. Aponte `channels.imessage.accounts.<id>.cliPath` e `.dbPath` para esse perfil de usuário.

    A primeira execução pode exigir aprovações na interface gráfica (Automação + Full Disk Access) nessa sessão de usuário do bot.

  </Accordion>

  <Accordion title="Mac remoto por Tailscale (exemplo)">
    Topologia comum:

    - o Gateway é executado em Linux/VM
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
    Certifique-se de que a chave do host seja confiável primeiro (por exemplo, `ssh bot@mac-mini.tailnet-1234.ts.net`) para que `known_hosts` seja preenchido.

  </Accordion>

  <Accordion title="Padrão de múltiplas contas">
    iMessage oferece suporte a configuração por conta em `channels.imessage.accounts`.

    Cada conta pode substituir campos como `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, configurações de histórico e allowlists de raízes de anexos.

  </Accordion>
</AccordionGroup>

## Mídia, fragmentação e alvos de entrega

<AccordionGroup>
  <Accordion title="Anexos e mídia">
    - a ingestão de anexos de entrada é opcional: `channels.imessage.includeAttachments`
    - caminhos de anexos remotos podem ser buscados via SCP quando `remoteHost` está definido
    - os caminhos de anexos devem corresponder às raízes permitidas:
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (modo remoto com SCP)
      - padrão de raiz: `/Users/*/Library/Messages/Attachments`
    - SCP usa verificação estrita de chave de host (`StrictHostKeyChecking=yes`)
    - o tamanho de mídia de saída usa `channels.imessage.mediaMaxMb` (padrão de 16 MB)
  </Accordion>

  <Accordion title="Fragmentação de saída">
    - limite de fragmento de texto: `channels.imessage.textChunkLimit` (padrão 4000)
    - modo de fragmentação: `channels.imessage.chunkMode`
      - `length` (padrão)
      - `newline` (divisão priorizando parágrafos)
  </Accordion>

  <Accordion title="Formatos de endereçamento">
    Alvos explícitos preferenciais:

    - `chat_id:123` (recomendado para roteamento estável)
    - `chat_guid:...`
    - `chat_identifier:...`

    Alvos por handle também são suportados:

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

Desabilite:

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
  <Accordion title="imsg não encontrado ou RPC não suportado">
    Valide o binário e o suporte a RPC:

```bash
imsg rpc --help
openclaw channels status --probe
```

    Se a sondagem relatar que RPC não é suportado, atualize o `imsg`.

  </Accordion>

  <Accordion title="As DMs são ignoradas">
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
    - configuração do padrão de menção (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Anexos remotos falham">
    Verifique:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - autenticação por chave SSH/SCP a partir do host do Gateway
    - a chave do host existe em `~/.ssh/known_hosts` no host do Gateway
    - legibilidade do caminho remoto no Mac que executa o app Mensagens

  </Accordion>

  <Accordion title="Os prompts de permissão do macOS foram perdidos">
    Execute novamente em um terminal GUI interativo no mesmo contexto de usuário/sessão e aprove os prompts:

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirme que Full Disk Access + Automação estão concedidos para o contexto de processo que executa OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Ponteiros para a referência de configuração

- [Referência de configuração - iMessage](/pt-BR/gateway/config-channels#imessage)
- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Pareamento](/pt-BR/channels/pairing)
- [BlueBubbles](/pt-BR/channels/bluebubbles)

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e restrição por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e endurecimento
