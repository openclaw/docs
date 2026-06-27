---
read_when:
    - Configurando o Mattermost
    - Depuração do roteamento do Mattermost
sidebarTitle: Mattermost
summary: Configuração do bot do Mattermost e configuração do OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:11:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin baixável (token do bot + eventos WebSocket). Canais, grupos e DMs são compatíveis. Mattermost é uma plataforma auto-hospedável de mensagens para equipes; consulte o site oficial em [mattermost.com](https://mattermost.com) para detalhes do produto e downloads.

## Instalação

Instale o Mattermost antes de configurar o canal:

<Tabs>
  <Tab title="Registro npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Checkout local">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

<Steps>
  <Step title="Garanta que o Plugin esteja disponível">
    Instale `@openclaw/mattermost` com o comando acima e reinicie o Gateway se ele já estiver em execução.
  </Step>
  <Step title="Crie um bot do Mattermost">
    Crie uma conta de bot no Mattermost e copie o **token do bot**.
  </Step>
  <Step title="Copie a URL base">
    Copie a **URL base** do Mattermost (por exemplo, `https://chat.example.com`).
  </Step>
  <Step title="Configure o OpenClaw e inicie o Gateway">
    Configuração mínima:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## Comandos de barra nativos

Comandos de barra nativos são opcionais. Quando ativados, o OpenClaw registra comandos de barra `oc_*` pela API do Mattermost e recebe POSTs de callback no servidor HTTP do Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Notas de comportamento">
    - `native: "auto"` usa desativado como padrão para Mattermost. Defina `native: true` para ativar.
    - Se `callbackUrl` for omitido, o OpenClaw deriva uma a partir do host/porta do Gateway + `callbackPath`.
    - Para configurações com várias contas, `commands` pode ser definido no nível superior ou em `channels.mattermost.accounts.<id>.commands` (valores da conta substituem campos do nível superior).
    - Callbacks de comando são validados com os tokens por comando retornados pelo Mattermost quando o OpenClaw registra comandos `oc_*`.
    - O OpenClaw atualiza o registro atual de comandos do Mattermost antes de aceitar cada callback, para que tokens obsoletos de comandos de barra excluídos ou regenerados deixem de ser aceitos sem reiniciar o Gateway.
    - A validação do callback falha de forma fechada se a API do Mattermost não conseguir confirmar que o comando ainda é atual; validações com falha são armazenadas brevemente em cache, consultas simultâneas são agrupadas, e novos inícios de consulta são limitados por taxa por comando para limitar a pressão de replay.
    - Callbacks de barra falham de forma fechada quando o registro falhou, a inicialização foi parcial ou o token de callback não corresponde ao token registrado do comando resolvido (um token válido para um comando não consegue alcançar a validação upstream de outro comando).

  </Accordion>
  <Accordion title="Requisito de alcançabilidade">
    O endpoint de callback deve ser alcançável a partir do servidor Mattermost.

    - Não defina `callbackUrl` como `localhost` a menos que o Mattermost seja executado no mesmo host/namespace de rede que o OpenClaw.
    - Não defina `callbackUrl` como sua URL base do Mattermost a menos que essa URL faça proxy reverso de `/api/channels/mattermost/command` para o OpenClaw.
    - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; um GET deve retornar `405 Method Not Allowed` do OpenClaw, não `404`.

  </Accordion>
  <Accordion title="Allowlist de saída do Mattermost">
    Se o callback tiver como destino endereços privados/tailnet/internos, defina `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost para incluir o host/domínio do callback.

    Use entradas de host/domínio, não URLs completas.

    - Correto: `gateway.tailnet-name.ts.net`
    - Incorreto: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente (conta padrão)

Defina estas no host do Gateway se preferir variáveis de ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Variáveis de ambiente se aplicam apenas à conta **padrão** (`default`). Outras contas devem usar valores de configuração.

`MATTERMOST_URL` não pode ser definido a partir de um `.env` de workspace; consulte [Arquivos `.env` de workspace](/pt-BR/gateway/security).
</Note>

## Modos de chat

O Mattermost responde automaticamente a DMs. O comportamento em canais é controlado por `chatmode`:

<Tabs>
  <Tab title="oncall (padrão)">
    Responde apenas quando @mencionado em canais.
  </Tab>
  <Tab title="onmessage">
    Responde a toda mensagem de canal.
  </Tab>
  <Tab title="onchar">
    Responde quando uma mensagem começa com um prefixo de gatilho.
  </Tab>
</Tabs>

Exemplo de configuração:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Notas:

- `onchar` ainda responde a @menções explícitas.
- `channels.mattermost.requireMention` é respeitado para configurações legadas, mas `chatmode` é preferido.
- Depois que o bot envia uma resposta visível em uma thread de canal, mensagens posteriores nessa mesma thread são respondidas sem uma nova @menção ou prefixo `onchar`, para que conversas de thread com vários turnos continuem fluindo. A participação é lembrada por 7 dias de inatividade da thread (atualizada a cada resposta) e persiste entre reinicializações do Gateway. Threads que o bot apenas observou não são afetadas; inicie uma nova mensagem de nível superior para exigir uma menção explícita novamente.

## Threads e sessões

Use `channels.mattermost.replyToMode` para controlar se respostas de canais e grupos permanecem no canal principal ou iniciam uma thread sob a postagem que acionou a resposta.

- `off` (padrão): responde em uma thread apenas quando a postagem de entrada já está em uma.
- `first`: para postagens de nível superior em canais/grupos, inicia uma thread sob essa postagem e roteia a conversa para uma sessão com escopo de thread.
- `all`: o mesmo comportamento que `first` para o Mattermost hoje.
- Mensagens diretas ignoram esta configuração e permanecem sem thread.

Exemplo de configuração:

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Notas:

- Sessões com escopo de thread usam o id da postagem que acionou a resposta como raiz da thread.
- `first` e `all` atualmente são equivalentes porque, depois que o Mattermost tem uma raiz de thread, partes subsequentes e mídia continuam nessa mesma thread.

## Controle de acesso (DMs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pareamento).
- Aprove via:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs públicas: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` aceita entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (controlado por menção).
- Coloque remetentes na allowlist com `channels.mattermost.groupAllowFrom` (IDs de usuário recomendados).
- `channels.mattermost.groupAllowFrom` aceita entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).
- Substituições de menção por canal ficam em `channels.mattermost.groups.<channelId>.requireMention` ou `channels.mattermost.groups["*"].requireMention` para um padrão.
- Correspondência de `@username` é mutável e só é ativada quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (controlado por menção).
- Nota de runtime: se `channels.mattermost` estiver completamente ausente, o runtime recorre a `groupPolicy="allowlist"` para verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

Exemplo:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Destinos para entrega de saída

Use estes formatos de destino com `openclaw message send` ou Cron/Webhooks:

- `channel:<id>` para um canal
- `user:<id>` para uma DM
- `@username` para uma DM (resolvido pela API do Mattermost)

<Warning>
IDs opacos simples (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário versus ID de canal).

O OpenClaw os resolve **usuário primeiro**:

- Se o ID existir como usuário (`GET /api/v4/users/<id>` for bem-sucedido), o OpenClaw envia uma **DM** resolvendo o canal direto via `/api/v4/channels/direct`.
- Caso contrário, o ID é tratado como um **ID de canal**.

Se você precisar de comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Repetição de canal de DM

Quando o OpenClaw envia para um destino de DM do Mattermost e precisa resolver o canal direto primeiro, ele repete por padrão falhas transitórias de criação do canal direto.

Use `channels.mattermost.dmChannelRetry` para ajustar esse comportamento globalmente para o Plugin Mattermost, ou `channels.mattermost.accounts.<id>.dmChannelRetry` para uma conta.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Notas:

- Isso se aplica apenas à criação de canal de DM (`/api/v4/channels/direct`), não a toda chamada da API do Mattermost.
- Repetições se aplicam a falhas transitórias, como limites de taxa, respostas 5xx e erros de rede ou timeout.
- Erros de cliente 4xx diferentes de `429` são tratados como permanentes e não são repetidos.

## Streaming de prévia

O Mattermost transmite raciocínio, atividade de ferramentas e texto parcial de resposta em uma única **postagem de prévia em rascunho**, que é finalizada no lugar quando a resposta final está segura para envio. A prévia é atualizada no mesmo id de postagem em vez de lotar o canal com mensagens por parte. Finais de mídia/erro cancelam edições pendentes da prévia e usam entrega normal em vez de publicar uma postagem de prévia descartável.

Ative via `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Modos de streaming">
    - `partial` é a escolha usual: uma postagem de prévia que é editada conforme a resposta cresce e, então, finalizada com a resposta completa.
    - `block` usa partes de rascunho em estilo de acréscimo dentro da postagem de prévia.
    - `progress` mostra uma prévia de status durante a geração e publica apenas a resposta final ao concluir.
    - `off` desativa o streaming de prévia.

  </Accordion>
  <Accordion title="Notas de comportamento de streaming">
    - Se o stream não puder ser finalizado no lugar (por exemplo, a postagem foi excluída no meio do stream), o OpenClaw recorre ao envio de uma nova postagem final para que a resposta nunca seja perdida.
    - Payloads apenas de raciocínio são suprimidos das postagens no canal, incluindo texto que chega como uma citação em bloco `> Thinking`. Defina `/reasoning on` para ver o raciocínio em outras superfícies; a postagem final do Mattermost mantém apenas a resposta.
    - Consulte [Streaming](/pt-BR/concepts/streaming#preview-streaming-modes) para a matriz de mapeamento de canais.

  </Accordion>
</AccordionGroup>

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é o id da postagem do Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (dois-pontos são opcionais).
- Defina `remove=true` (booleano) para remover uma reação.
- Eventos de adicionar/remover reação são encaminhados como eventos de sistema para a sessão do agente roteada.

Exemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuração:

- `channels.mattermost.actions.reactions`: ativa/desativa ações de reação (padrão true).
- Substituição por conta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botões interativos (ferramenta de mensagem)

Envie mensagens com botões clicáveis. Quando um usuário clica em um botão, o agente recebe a seleção e pode responder.

Respostas normais de agente também podem incluir payloads semânticos de `presentation`. O OpenClaw renderiza botões de valor como botões interativos do Mattermost, mantém botões de URL visíveis no texto da mensagem e rebaixa menus de seleção para texto legível.

Habilite botões adicionando `inlineButtons` às capacidades do canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Use `message action=send` com um parâmetro `buttons`. Botões são uma matriz 2D (linhas de botões):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campos de botão:

<ParamField path="text" type="string" required>
  Rótulo de exibição.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Valor enviado de volta no clique (usado como o ID da ação).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Estilo do botão.
</ParamField>

Quando um usuário clica em um botão:

<Steps>
  <Step title="Buttons replaced with confirmation">
    Todos os botões são substituídos por uma linha de confirmação (por exemplo, "✓ **Sim** selecionado por @user").
  </Step>
  <Step title="Agent receives the selection">
    O agente recebe a seleção como uma mensagem de entrada e responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - Callbacks de botão usam verificação HMAC-SHA256 (automática, nenhuma configuração necessária).
    - O Mattermost remove dados de callback das respostas da API dele (recurso de segurança), portanto todos os botões são removidos no clique - remoção parcial não é possível.
    - IDs de ação contendo hifens ou sublinhados são sanitizados automaticamente (limitação de roteamento do Mattermost).

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities`: matriz de strings de capacidade. Adicione `"inlineButtons"` para habilitar a descrição da ferramenta de botões no prompt do sistema do agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para callbacks de botão (por exemplo, `https://gateway.example.com`). Use isto quando o Mattermost não conseguir alcançar o Gateway diretamente no host de bind dele.
    - Em configurações com várias contas, você também pode definir o mesmo campo em `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Se `interactions.callbackBaseUrl` for omitido, o OpenClaw deriva a URL de callback de `gateway.customBindHost` + `gateway.port` e depois faz fallback para `http://localhost:<port>`.
    - Regra de acessibilidade: a URL de callback do botão deve ser acessível a partir do servidor Mattermost. `localhost` só funciona quando Mattermost e OpenClaw rodam no mesmo host/namespace de rede.
    - Se seu destino de callback for privado/tailnet/interno, adicione o host/domínio dele a `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost.

  </Accordion>
</AccordionGroup>

### Integração direta com API (scripts externos)

Scripts externos e Webhooks podem publicar botões diretamente pela API REST do Mattermost em vez de passar pela ferramenta `message` do agente. Use `buildButtonAttachments()` do Plugin quando possível; se publicar JSON bruto, siga estas regras:

**Estrutura do payload:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Regras críticas**

1. Anexos ficam em `props.attachments`, não em `attachments` no nível superior (ignorado silenciosamente).
2. Toda ação precisa de `type: "button"` - sem isso, cliques são engolidos silenciosamente.
3. Toda ação precisa de um campo `id` - o Mattermost ignora ações sem IDs.
4. O `id` da ação deve ser **somente alfanumérico** (`[a-zA-Z0-9]`). Hifens e sublinhados quebram o roteamento de ações do lado do servidor do Mattermost (retorna 404). Remova-os antes de usar.
5. `context.action_id` deve corresponder ao `id` do botão para que a mensagem de confirmação mostre o nome do botão (por exemplo, "Aprovar") em vez de um ID bruto.
6. `context.action_id` é obrigatório - o manipulador de interação retorna 400 sem ele.

</Warning>

**Geração de token HMAC**

O Gateway verifica cliques de botão com HMAC-SHA256. Scripts externos devem gerar tokens que correspondam à lógica de verificação do Gateway:

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    Construa o objeto de contexto com todos os campos **exceto** `_token`.
  </Step>
  <Step title="Serialize with sorted keys">
    Serialize com **chaves ordenadas** e **sem espaços** (o Gateway usa `JSON.stringify` com chaves ordenadas, o que produz saída compacta).
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    Adicione o digest hexadecimal resultante como `_token` no contexto.
  </Step>
</Steps>

Exemplo em Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Common HMAC pitfalls">
    - `json.dumps` do Python adiciona espaços por padrão (`{"key": "val"}`). Use `separators=(",", ":")` para corresponder à saída compacta do JavaScript (`{"key":"val"}`).
    - Sempre assine **todos** os campos de contexto (menos `_token`). O Gateway remove `_token` e então assina tudo o que resta. Assinar um subconjunto causa falha silenciosa de verificação.
    - Use `sort_keys=True` - o Gateway ordena chaves antes de assinar, e o Mattermost pode reordenar campos de contexto ao armazenar o payload.
    - Derive o segredo a partir do token do bot (determinístico), não de bytes aleatórios. O segredo deve ser o mesmo no processo que cria botões e no Gateway que verifica.

  </Accordion>
</AccordionGroup>

## Adaptador de diretório

O Plugin do Mattermost inclui um adaptador de diretório que resolve nomes de canais e usuários por meio da API do Mattermost. Isso habilita destinos `#channel-name` e `@username` em `openclaw message send` e entregas por Cron/Webhook.

Nenhuma configuração é necessária - o adaptador usa o token do bot da configuração da conta.

## Várias contas

O Mattermost oferece suporte a várias contas em `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Solução de problemas

<AccordionGroup>
  <Accordion title="No replies in channels">
    Garanta que o bot esteja no canal e mencione-o (oncall), use um prefixo de acionamento (onchar) ou defina `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - Verifique o token do bot, a URL base e se a conta está habilitada.
    - Problemas com várias contas: vars de ambiente só se aplicam à conta `default`.

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.`: o OpenClaw não aceitou o token de callback. Causas típicas:
      - o registro do comando de barra falhou ou foi concluído apenas parcialmente na inicialização
      - o callback está chegando ao Gateway/conta errado
      - o Mattermost ainda tem comandos antigos apontando para um destino de callback anterior
      - o Gateway reiniciou sem reativar os comandos de barra
    - Se comandos de barra nativos pararem de funcionar, verifique os logs em busca de `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Se `callbackUrl` for omitido e os logs avisarem que o callback foi resolvido para `http://127.0.0.1:18789/...`, essa URL provavelmente só é acessível quando o Mattermost roda no mesmo host/namespace de rede que o OpenClaw. Defina um `commands.callbackUrl` explicitamente acessível externamente em vez disso.

  </Accordion>
  <Accordion title="Buttons issues">
    - Botões aparecem como caixas brancas: o agente pode estar enviando dados de botão malformados. Verifique se cada botão tem os campos `text` e `callback_data`.
    - Botões são renderizados, mas cliques não fazem nada: verifique se `AllowedUntrustedInternalConnections` na configuração do servidor Mattermost inclui `127.0.0.1 localhost`, e se `EnablePostActionIntegration` é `true` em ServiceSettings.
    - Botões retornam 404 no clique: o `id` do botão provavelmente contém hifens ou sublinhados. O roteador de ações do Mattermost quebra com IDs não alfanuméricos. Use apenas `[a-zA-Z0-9]`.
    - Logs do Gateway mostram `invalid _token`: incompatibilidade de HMAC. Verifique se você assina todos os campos de contexto (não um subconjunto), usa chaves ordenadas e usa JSON compacto (sem espaços). Veja a seção de HMAC acima.
    - Logs do Gateway mostram `missing _token in context`: o campo `_token` não está no contexto do botão. Garanta que ele seja incluído ao construir o payload de integração.
    - A confirmação mostra ID bruto em vez do nome do botão: `context.action_id` não corresponde ao `id` do botão. Defina ambos com o mesmo valor sanitizado.
    - O agente não sabe sobre botões: adicione `capabilities: ["inlineButtons"]` à configuração de canal do Mattermost.

  </Accordion>
</AccordionGroup>

## Relacionados

- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessão para mensagens
- [Visão geral de canais](/pt-BR/channels) - todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) - comportamento de chat em grupo e bloqueio por menção
- [Pareamento](/pt-BR/channels/pairing) - autenticação por DM e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
