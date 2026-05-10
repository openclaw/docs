---
read_when:
    - Configurando o Mattermost
    - Depuração do roteamento do Mattermost
sidebarTitle: Mattermost
summary: Configuração do bot do Mattermost e configuração do OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-05-10T19:22:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: b58feb699238107c5f61ca0edf204d08b1b7e4e55444f037e8f02ea4147b8fec
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin baixável (token de bot + eventos WebSocket). Há suporte a canais, grupos e DMs. Mattermost é uma plataforma de mensagens em equipe auto-hospedável; consulte o site oficial em [mattermost.com](https://mattermost.com) para detalhes do produto e downloads.

## Instalar

Instale o Mattermost antes de configurar o canal:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

<Steps>
  <Step title="Garantir que o Plugin esteja disponível">
    As versões empacotadas atuais do OpenClaw já o incluem. Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
  </Step>
  <Step title="Criar um bot do Mattermost">
    Crie uma conta de bot do Mattermost e copie o **token do bot**.
  </Step>
  <Step title="Copiar a URL base">
    Copie a **URL base** do Mattermost (por exemplo, `https://chat.example.com`).
  </Step>
  <Step title="Configurar o OpenClaw e iniciar o Gateway">
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

Comandos de barra nativos são opcionais. Quando habilitados, o OpenClaw registra comandos de barra `oc_*` pela API do Mattermost e recebe POSTs de callback no servidor HTTP do Gateway.

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
  <Accordion title="Observações de comportamento">
    - `native: "auto"` usa desabilitado por padrão para Mattermost. Defina `native: true` para habilitar.
    - Se `callbackUrl` for omitido, o OpenClaw deriva uma a partir do host/porta do Gateway + `callbackPath`.
    - Para configurações com várias contas, `commands` pode ser definido no nível superior ou em `channels.mattermost.accounts.<id>.commands` (valores da conta substituem campos do nível superior).
    - Callbacks de comando são validados com os tokens por comando retornados pelo Mattermost quando o OpenClaw registra comandos `oc_*`.
    - O OpenClaw atualiza o registro de comandos atual do Mattermost antes de aceitar cada callback, para que tokens obsoletos de comandos de barra excluídos ou regenerados deixem de ser aceitos sem reiniciar o Gateway.
    - A validação de callback falha de modo fechado se a API do Mattermost não puder confirmar que o comando ainda é atual; validações com falha são armazenadas brevemente em cache, consultas simultâneas são coalescidas, e inícios de novas consultas têm limite de taxa por comando para conter pressão de repetição.
    - Callbacks de barra falham de modo fechado quando o registro falhou, a inicialização foi parcial, ou o token de callback não corresponde ao token registrado do comando resolvido (um token válido para um comando não pode chegar à validação upstream de outro comando).

  </Accordion>
  <Accordion title="Requisito de alcançabilidade">
    O endpoint de callback deve ser alcançável a partir do servidor Mattermost.

    - Não defina `callbackUrl` como `localhost` a menos que o Mattermost rode no mesmo host/namespace de rede que o OpenClaw.
    - Não defina `callbackUrl` como sua URL base do Mattermost a menos que essa URL faça proxy reverso de `/api/channels/mattermost/command` para o OpenClaw.
    - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; um GET deve retornar `405 Method Not Allowed` do OpenClaw, não `404`.

  </Accordion>
  <Accordion title="Lista de permissões de egresso do Mattermost">
    Se o seu callback apontar para endereços privados/tailnet/internos, defina `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost para incluir o host/domínio do callback.

    Use entradas de host/domínio, não URLs completas.

    - Bom: `gateway.tailnet-name.ts.net`
    - Ruim: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente (conta padrão)

Defina estas no host do Gateway se preferir variáveis de ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Variáveis de ambiente se aplicam apenas à conta **padrão** (`default`). Outras contas devem usar valores de configuração.

`MATTERMOST_URL` não pode ser definido a partir de um `.env` do workspace; consulte [Arquivos `.env` do workspace](/pt-BR/gateway/security).
</Note>

## Modos de chat

Mattermost responde automaticamente a DMs. O comportamento de canal é controlado por `chatmode`:

<Tabs>
  <Tab title="oncall (padrão)">
    Responde somente quando @mencionado em canais.
  </Tab>
  <Tab title="onmessage">
    Responde a toda mensagem de canal.
  </Tab>
  <Tab title="onchar">
    Responde quando uma mensagem começa com um prefixo de acionamento.
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

Observações:

- `onchar` ainda responde a @menções explícitas.
- `channels.mattermost.requireMention` é respeitado para configurações legadas, mas `chatmode` é preferido.

## Threads e sessões

Use `channels.mattermost.replyToMode` para controlar se respostas em canais e grupos permanecem no canal principal ou iniciam uma thread sob a publicação acionadora.

- `off` (padrão): só responde em uma thread quando a publicação recebida já está em uma.
- `first`: para publicações de nível superior em canal/grupo, inicia uma thread sob essa publicação e roteia a conversa para uma sessão com escopo de thread.
- `all`: mesmo comportamento que `first` para Mattermost hoje.
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

Observações:

- Sessões com escopo de thread usam o ID da publicação acionadora como raiz da thread.
- `first` e `all` são atualmente equivalentes porque, depois que o Mattermost tem uma raiz de thread, blocos de acompanhamento e mídia continuam nessa mesma thread.

## Controle de acesso (DMs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pareamento).
- Aprove por:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs públicas: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` aceita entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (controlado por menção).
- Coloque remetentes na lista de permissões com `channels.mattermost.groupAllowFrom` (IDs de usuário recomendados).
- `channels.mattermost.groupAllowFrom` aceita entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).
- Substituições de menção por canal ficam em `channels.mattermost.groups.<channelId>.requireMention` ou `channels.mattermost.groups["*"].requireMention` para um padrão.
- Correspondência de `@username` é mutável e só é habilitada quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (controlado por menção).
- Observação de runtime: se `channels.mattermost` estiver completamente ausente, o runtime volta para `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

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

## Alvos para entrega de saída

Use estes formatos de alvo com `openclaw message send` ou cron/Webhooks:

- `channel:<id>` para um canal
- `user:<id>` para uma DM
- `@username` para uma DM (resolvido pela API do Mattermost)

<Warning>
IDs opacos sem prefixo (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário vs ID de canal).

O OpenClaw os resolve **usuário primeiro**:

- Se o ID existir como usuário (`GET /api/v4/users/<id>` for bem-sucedido), o OpenClaw envia uma **DM** resolvendo o canal direto via `/api/v4/channels/direct`.
- Caso contrário, o ID é tratado como um **ID de canal**.

Se você precisar de comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Nova tentativa de canal de DM

Quando o OpenClaw envia para um alvo de DM do Mattermost e precisa resolver o canal direto primeiro, ele tenta novamente por padrão falhas transitórias de criação de canal direto.

Use `channels.mattermost.dmChannelRetry` para ajustar esse comportamento globalmente para o Plugin do Mattermost, ou `channels.mattermost.accounts.<id>.dmChannelRetry` para uma conta.

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

Observações:

- Isso se aplica apenas à criação de canal de DM (`/api/v4/channels/direct`), não a toda chamada da API do Mattermost.
- Novas tentativas se aplicam a falhas transitórias, como limites de taxa, respostas 5xx e erros de rede ou timeout.
- Erros de cliente 4xx diferentes de `429` são tratados como permanentes e não são repetidos.

## Streaming de pré-visualização

O Mattermost transmite pensamento, atividade de ferramentas e texto parcial de resposta para uma única **publicação de pré-visualização de rascunho** que é finalizada no lugar quando a resposta final está segura para envio. A pré-visualização é atualizada no mesmo ID de publicação em vez de inundar o canal com mensagens por bloco. Finais com mídia/erro cancelam edições de pré-visualização pendentes e usam entrega normal em vez de descarregar uma publicação de pré-visualização descartável.

Habilite via `channels.mattermost.streaming`:

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
    - `partial` é a escolha usual: uma publicação de pré-visualização que é editada conforme a resposta cresce e depois finalizada com a resposta completa.
    - `block` usa blocos de rascunho em estilo de anexação dentro da publicação de pré-visualização.
    - `progress` mostra uma pré-visualização de status durante a geração e só publica a resposta final na conclusão.
    - `off` desabilita o streaming de pré-visualização.

  </Accordion>
  <Accordion title="Observações de comportamento de streaming">
    - Se o stream não puder ser finalizado no lugar (por exemplo, a publicação foi excluída no meio do stream), o OpenClaw volta para o envio de uma nova publicação final para que a resposta nunca seja perdida.
    - Payloads apenas de raciocínio são suprimidos de publicações de canal, incluindo texto que chega como uma citação em bloco `> Reasoning:`. Defina `/reasoning on` para ver o pensamento em outras superfícies; a publicação final do Mattermost mantém apenas a resposta.
    - Consulte [Streaming](/pt-BR/concepts/streaming#preview-streaming-modes) para a matriz de mapeamento de canais.

  </Accordion>
</AccordionGroup>

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é o ID da publicação do Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (dois-pontos são opcionais).
- Defina `remove=true` (booleano) para remover uma reação.
- Eventos de adicionar/remover reação são encaminhados como eventos de sistema para a sessão do agente roteada.

Exemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuração:

- `channels.mattermost.actions.reactions`: habilita/desabilita ações de reação (padrão true).
- Substituição por conta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botões interativos (ferramenta de mensagem)

Envie mensagens com botões clicáveis. Quando um usuário clica em um botão, o agente recebe a seleção e pode responder.

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
  Valor enviado de volta no clique (usado como ID da ação).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Estilo do botão.
</ParamField>

Quando um usuário clica em um botão:

<Steps>
  <Step title="Botões substituídos por confirmação">
    Todos os botões são substituídos por uma linha de confirmação (por exemplo, "✓ **Yes** selected by @user").
  </Step>
  <Step title="O agente recebe a seleção">
    O agente recebe a seleção como uma mensagem de entrada e responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas de implementação">
    - Os callbacks de botão usam verificação HMAC-SHA256 (automática, sem necessidade de configuração).
    - O Mattermost remove dados de callback das respostas da API dele (recurso de segurança), então todos os botões são removidos no clique - a remoção parcial não é possível.
    - IDs de ação que contêm hífens ou sublinhados são higienizados automaticamente (limitação de roteamento do Mattermost).

  </Accordion>
  <Accordion title="Configuração e acessibilidade">
    - `channels.mattermost.capabilities`: array de strings de capacidade. Adicione `"inlineButtons"` para habilitar a descrição da ferramenta de botões no prompt de sistema do agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para callbacks de botão (por exemplo `https://gateway.example.com`). Use isso quando o Mattermost não conseguir alcançar o Gateway diretamente no host de vinculação dele.
    - Em configurações com várias contas, você também pode definir o mesmo campo em `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Se `interactions.callbackBaseUrl` for omitido, o OpenClaw deriva a URL de callback de `gateway.customBindHost` + `gateway.port` e depois recorre a `http://localhost:<port>`.
    - Regra de acessibilidade: a URL de callback do botão precisa estar acessível a partir do servidor Mattermost. `localhost` só funciona quando Mattermost e OpenClaw são executados no mesmo host/namespace de rede.
    - Se o destino do seu callback for privado/tailnet/interno, adicione o host/domínio dele a `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost.

  </Accordion>
</AccordionGroup>

### Integração direta com a API (scripts externos)

Scripts externos e webhooks podem publicar botões diretamente pela API REST do Mattermost em vez de passar pela ferramenta `message` do agente. Use `buildButtonAttachments()` do Plugin quando possível; se publicar JSON bruto, siga estas regras:

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

1. Os anexos ficam em `props.attachments`, não em `attachments` no nível superior (ignorado silenciosamente).
2. Toda ação precisa de `type: "button"` - sem isso, os cliques são engolidos silenciosamente.
3. Toda ação precisa de um campo `id` - o Mattermost ignora ações sem IDs.
4. O `id` da ação deve ser **somente alfanumérico** (`[a-zA-Z0-9]`). Hífens e sublinhados quebram o roteamento de ações no lado do servidor do Mattermost (retorna 404). Remova-os antes de usar.
5. `context.action_id` deve corresponder ao `id` do botão para que a mensagem de confirmação mostre o nome do botão (por exemplo, "Approve") em vez de um ID bruto.
6. `context.action_id` é obrigatório - o manipulador de interação retorna 400 sem ele.

</Warning>

**Geração de token HMAC**

O Gateway verifica cliques de botão com HMAC-SHA256. Scripts externos devem gerar tokens que correspondam à lógica de verificação do Gateway:

<Steps>
  <Step title="Derive o segredo do token do bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Monte o objeto de contexto">
    Monte o objeto de contexto com todos os campos **exceto** `_token`.
  </Step>
  <Step title="Serialize com chaves ordenadas">
    Serialize com **chaves ordenadas** e **sem espaços** (o Gateway usa `JSON.stringify` com chaves ordenadas, o que produz saída compacta).
  </Step>
  <Step title="Assine o payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Adicione o token">
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
  <Accordion title="Armadilhas comuns de HMAC">
    - O `json.dumps` do Python adiciona espaços por padrão (`{"key": "val"}`). Use `separators=(",", ":")` para corresponder à saída compacta do JavaScript (`{"key":"val"}`).
    - Sempre assine **todos** os campos de contexto (menos `_token`). O Gateway remove `_token` e então assina tudo o que resta. Assinar um subconjunto causa falha silenciosa de verificação.
    - Use `sort_keys=True` - o Gateway ordena as chaves antes de assinar, e o Mattermost pode reordenar campos de contexto ao armazenar o payload.
    - Derive o segredo do token do bot (determinístico), não de bytes aleatórios. O segredo deve ser o mesmo entre o processo que cria os botões e o Gateway que verifica.

  </Accordion>
</AccordionGroup>

## Adaptador de diretório

O Plugin Mattermost inclui um adaptador de diretório que resolve nomes de canais e usuários por meio da API do Mattermost. Isso habilita destinos `#channel-name` e `@username` em `openclaw message send` e entregas de cron/webhook.

Nenhuma configuração é necessária - o adaptador usa o token do bot da configuração da conta.

## Várias contas

O Mattermost é compatível com várias contas em `channels.mattermost.accounts`:

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
  <Accordion title="Sem respostas em canais">
    Garanta que o bot esteja no canal e mencione-o (oncall), use um prefixo de gatilho (onchar) ou defina `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Erros de autenticação ou várias contas">
    - Verifique o token do bot, a URL base e se a conta está habilitada.
    - Problemas com várias contas: variáveis de ambiente se aplicam somente à conta `default`.

  </Accordion>
  <Accordion title="Comandos de barra nativos falham">
    - `Unauthorized: invalid command token.`: o OpenClaw não aceitou o token de callback. Causas típicas:
      - o registro de comando de barra falhou ou foi concluído apenas parcialmente na inicialização
      - o callback está atingindo o Gateway/conta errado
      - o Mattermost ainda tem comandos antigos apontando para um destino de callback anterior
      - o Gateway reiniciou sem reativar comandos de barra
    - Se os comandos de barra nativos pararem de funcionar, verifique os logs para `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Se `callbackUrl` for omitido e os logs avisarem que o callback foi resolvido para `http://127.0.0.1:18789/...`, essa URL provavelmente só será acessível quando o Mattermost for executado no mesmo host/namespace de rede que o OpenClaw. Defina uma `commands.callbackUrl` explícita e acessível externamente em vez disso.

  </Accordion>
  <Accordion title="Problemas com botões">
    - Os botões aparecem como caixas brancas: o agente pode estar enviando dados de botão malformados. Verifique se cada botão tem os campos `text` e `callback_data`.
    - Os botões são renderizados, mas os cliques não fazem nada: verifique se `AllowedUntrustedInternalConnections` na configuração do servidor Mattermost inclui `127.0.0.1 localhost` e se `EnablePostActionIntegration` é `true` em ServiceSettings.
    - Os botões retornam 404 no clique: o `id` do botão provavelmente contém hífens ou sublinhados. O roteador de ações do Mattermost quebra em IDs não alfanuméricos. Use somente `[a-zA-Z0-9]`.
    - Logs do Gateway mostram `invalid _token`: incompatibilidade de HMAC. Verifique se você assina todos os campos de contexto (não um subconjunto), usa chaves ordenadas e usa JSON compacto (sem espaços). Consulte a seção HMAC acima.
    - Logs do Gateway mostram `missing _token in context`: o campo `_token` não está no contexto do botão. Garanta que ele esteja incluído ao montar o payload de integração.
    - A confirmação mostra ID bruto em vez do nome do botão: `context.action_id` não corresponde ao `id` do botão. Defina ambos para o mesmo valor higienizado.
    - O agente não sabe sobre botões: adicione `capabilities: ["inlineButtons"]` à configuração do canal Mattermost.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessão para mensagens
- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) - comportamento de chat em grupo e bloqueio por menção
- [Pareamento](/pt-BR/channels/pairing) - autenticação por DM e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção
