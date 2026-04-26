---
read_when:
    - Configurando o Mattermost
    - Depurando o roteamento do Mattermost
sidebarTitle: Mattermost
summary: Configuração do bot do Mattermost e da configuração do OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Status: Plugin incluído no pacote (token de bot + eventos WebSocket). Canais, grupos e DMs são compatíveis. Mattermost é uma plataforma de mensagens para equipes auto-hospedável; veja detalhes do produto e downloads no site oficial em [mattermost.com](https://mattermost.com).

## Plugin incluído no pacote

<Note>
O Mattermost é fornecido como um Plugin incluído no pacote nas versões atuais do OpenClaw, então builds empacotadas normais não precisam de uma instalação separada.
</Note>

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclui o Mattermost, instale-o manualmente:

<Tabs>
  <Tab title="registro npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="checkout local">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

<Steps>
  <Step title="Garanta que o Plugin esteja disponível">
    As versões empacotadas atuais do OpenClaw já o incluem. Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
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

## Comandos slash nativos

Os comandos slash nativos são opcionais. Quando ativados, o OpenClaw registra comandos slash `oc_*` por meio da API do Mattermost e recebe callbacks POST no servidor HTTP do Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use quando o Mattermost não puder alcançar o Gateway diretamente (proxy reverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Observações de comportamento">
    - `native: "auto"` vem desativado por padrão para Mattermost. Defina `native: true` para ativar.
    - Se `callbackUrl` for omitido, o OpenClaw deriva um a partir do host/porta do Gateway + `callbackPath`.
    - Para configurações com várias contas, `commands` pode ser definido no nível superior ou em `channels.mattermost.accounts.<id>.commands` (os valores da conta substituem os campos de nível superior).
    - Os callbacks de comando são validados com os tokens por comando retornados pelo Mattermost quando o OpenClaw registra comandos `oc_*`.
    - Os callbacks de slash falham de forma fechada quando o registro falhou, a inicialização foi parcial ou o token de callback não corresponde a um dos comandos registrados.
  </Accordion>
  <Accordion title="Requisito de alcance">
    O endpoint de callback deve estar acessível a partir do servidor Mattermost.

    - Não defina `callbackUrl` como `localhost`, a menos que o Mattermost seja executado no mesmo host/espaço de nomes de rede que o OpenClaw.
    - Não defina `callbackUrl` como a URL base do seu Mattermost, a menos que essa URL encaminhe por proxy reverso `/api/channels/mattermost/command` para o OpenClaw.
    - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; um GET deve retornar `405 Method Not Allowed` do OpenClaw, não `404`.

  </Accordion>
  <Accordion title="Allowlist de saída do Mattermost">
    Se seu callback apontar para endereços privados/tailnet/internos, defina `Mattermost ServiceSettings.AllowedUntrustedInternalConnections` para incluir o host/domínio do callback.

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
As variáveis de ambiente se aplicam apenas à conta **padrão** (`default`). Outras contas devem usar valores na configuração.

`MATTERMOST_URL` não pode ser definido a partir de um `.env` de workspace; veja [arquivos `.env` de workspace](/pt-BR/gateway/security).
</Note>

## Modos de chat

O Mattermost responde automaticamente a DMs. O comportamento em canais é controlado por `chatmode`:

<Tabs>
  <Tab title="oncall (padrão)">
    Responde apenas quando for @mencionado em canais.
  </Tab>
  <Tab title="onmessage">
    Responde a todas as mensagens do canal.
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

Observações:

- `onchar` ainda responde a @menções explícitas.
- `channels.mattermost.requireMention` é respeitado em configurações legadas, mas `chatmode` é o preferido.

## Threads e sessões

Use `channels.mattermost.replyToMode` para controlar se as respostas em canais e grupos permanecem no canal principal ou iniciam uma thread sob a postagem que disparou a ação.

- `off` (padrão): só responde em uma thread quando a postagem recebida já estiver em uma.
- `first`: para postagens de canal/grupo de nível superior, inicia uma thread sob essa postagem e roteia a conversa para uma sessão com escopo de thread.
- `all`: mesmo comportamento de `first` para Mattermost hoje.
- Mensagens diretas ignoram essa configuração e permanecem sem thread.

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

- Sessões com escopo de thread usam o id da postagem que disparou a ação como raiz da thread.
- `first` e `all` são atualmente equivalentes porque, assim que o Mattermost tem uma raiz de thread, fragmentos de acompanhamento e mídia continuam nessa mesma thread.

## Controle de acesso (DMs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pareamento).
- Aprove com:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs públicas: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]`.

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (controlado por menção).
- Coloque remetentes na allowlist com `channels.mattermost.groupAllowFrom` (IDs de usuário são recomendados).
- Substituições de menção por canal ficam em `channels.mattermost.groups.<channelId>.requireMention` ou `channels.mattermost.groups["*"].requireMention` para um padrão.
- A correspondência `@username` é mutável e só é ativada quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (controlado por menção).
- Observação de runtime: se `channels.mattermost` estiver completamente ausente, o runtime usa `groupPolicy="allowlist"` para verificações de grupo (mesmo se `channels.defaults.groupPolicy` estiver definido).

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
- `@username` para uma DM (resolvido por meio da API do Mattermost)

<Warning>
IDs opacos puros (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário vs ID de canal).

O OpenClaw os resolve **priorizando usuário**:

- Se o ID existir como usuário (`GET /api/v4/users/<id>` for bem-sucedido), o OpenClaw envia uma **DM** resolvendo o canal direto via `/api/v4/channels/direct`.
- Caso contrário, o ID é tratado como um **ID de canal**.

Se você precisar de comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Repetição de tentativa de canal de DM

Quando o OpenClaw envia para um destino de DM do Mattermost e precisa primeiro resolver o canal direto, ele repete por padrão falhas transitórias na criação do canal direto.

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

- Isso se aplica apenas à criação de canal de DM (`/api/v4/channels/direct`), não a todas as chamadas de API do Mattermost.
- As repetições se aplicam a falhas transitórias, como limites de taxa, respostas 5xx e erros de rede ou timeout.
- Erros de cliente 4xx, exceto `429`, são tratados como permanentes e não são repetidos.

## Streaming de pré-visualização

O Mattermost transmite raciocínio, atividade de ferramentas e texto parcial de resposta em uma única **postagem de pré-visualização de rascunho** que é finalizada no mesmo lugar quando a resposta final pode ser enviada com segurança. A pré-visualização é atualizada no mesmo id de postagem em vez de poluir o canal com mensagens por fragmento. Finais de mídia/erro cancelam edições pendentes da pré-visualização e usam entrega normal em vez de publicar uma pré-visualização descartável.

Ative com `channels.mattermost.streaming`:

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
    - `partial` é a escolha usual: uma postagem de pré-visualização que é editada à medida que a resposta cresce e depois finalizada com a resposta completa.
    - `block` usa fragmentos de rascunho em estilo append dentro da postagem de pré-visualização.
    - `progress` mostra uma pré-visualização de status durante a geração e só publica a resposta final na conclusão.
    - `off` desativa o streaming de pré-visualização.
  </Accordion>
  <Accordion title="Observações sobre o comportamento do streaming">
    - Se o stream não puder ser finalizado no mesmo lugar (por exemplo, a postagem foi excluída no meio do stream), o OpenClaw recorre ao envio de uma nova postagem final para que a resposta nunca seja perdida.
    - Payloads somente de raciocínio são suprimidos em postagens de canal, incluindo texto que chega como um blockquote `> Reasoning:`. Defina `/reasoning on` para ver o pensamento em outras superfícies; a postagem final do Mattermost mantém apenas a resposta.
    - Veja [Streaming](/pt-BR/concepts/streaming#preview-streaming-modes) para a matriz de mapeamento de canal.
  </Accordion>
</AccordionGroup>

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é o id da postagem do Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (os dois-pontos são opcionais).
- Defina `remove=true` (booleano) para remover uma reação.
- Eventos de adição/remoção de reação são encaminhados como eventos do sistema para a sessão do agente roteada.

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

Ative botões adicionando `inlineButtons` às capacidades do canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Use `message action=send` com um parâmetro `buttons`. Os botões são um array 2D (linhas de botões):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campos do botão:

<ParamField path="text" type="string" required>
  Rótulo exibido.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Valor enviado de volta ao clicar (usado como o ID da ação).
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
    O agente recebe a seleção como uma mensagem recebida e responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas de implementação">
    - Os callbacks dos botões usam verificação HMAC-SHA256 (automática, sem necessidade de configuração).
    - O Mattermost remove os dados de callback de suas respostas da API (recurso de segurança), então todos os botões são removidos ao clicar — a remoção parcial não é possível.
    - IDs de ação que contêm hífens ou sublinhados são sanitizados automaticamente (limitação de roteamento do Mattermost).
  </Accordion>
  <Accordion title="Configuração e alcance">
    - `channels.mattermost.capabilities`: array de strings de capacidade. Adicione `"inlineButtons"` para ativar a descrição da ferramenta de botões no prompt do sistema do agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para callbacks de botões (por exemplo `https://gateway.example.com`). Use isso quando o Mattermost não puder alcançar o Gateway diretamente no host de bind.
    - Em configurações com várias contas, você também pode definir o mesmo campo em `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Se `interactions.callbackBaseUrl` for omitido, o OpenClaw deriva a URL de callback de `gateway.customBindHost` + `gateway.port`, e então usa `http://localhost:<port>` como fallback.
    - Regra de alcance: a URL de callback do botão deve estar acessível a partir do servidor Mattermost. `localhost` só funciona quando o Mattermost e o OpenClaw são executados no mesmo host/espaço de nomes de rede.
    - Se o destino do callback for privado/tailnet/interno, adicione seu host/domínio a `Mattermost ServiceSettings.AllowedUntrustedInternalConnections`.
  </Accordion>
</AccordionGroup>

### Integração direta com a API (scripts externos)

Scripts externos e Webhooks podem publicar botões diretamente pela API REST do Mattermost em vez de passar pela ferramenta `message` do agente. Use `buildButtonAttachments()` do Plugin sempre que possível; se publicar JSON bruto, siga estas regras:

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
            id: "mybutton01", // alphanumeric only — see below
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

1. Attachments ficam em `props.attachments`, não em `attachments` no nível superior (ignorado silenciosamente).
2. Toda ação precisa de `type: "button"` — sem isso, os cliques são descartados silenciosamente.
3. Toda ação precisa de um campo `id` — o Mattermost ignora ações sem IDs.
4. O `id` da ação deve ser **somente alfanumérico** (`[a-zA-Z0-9]`). Hífens e sublinhados quebram o roteamento de ações no lado do servidor do Mattermost (retorna 404). Remova-os antes de usar.
5. `context.action_id` deve corresponder ao `id` do botão para que a mensagem de confirmação mostre o nome do botão (por exemplo, "Approve") em vez de um ID bruto.
6. `context.action_id` é obrigatório — o manipulador de interação retorna 400 sem ele.
   </Warning>

**Geração de token HMAC**

O Gateway verifica cliques em botões com HMAC-SHA256. Scripts externos devem gerar tokens que correspondam à lógica de verificação do Gateway:

<Steps>
  <Step title="Derive o segredo a partir do token do bot">
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
    Adicione o resumo hexadecimal resultante como `_token` no contexto.
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
    - `json.dumps` do Python adiciona espaços por padrão (`{"key": "val"}`). Use `separators=(",", ":")` para corresponder à saída compacta do JavaScript (`{"key":"val"}`).
    - Sempre assine **todos** os campos do contexto (menos `_token`). O Gateway remove `_token` e então assina tudo o que resta. Assinar apenas um subconjunto causa falha silenciosa na verificação.
    - Use `sort_keys=True` — o Gateway ordena as chaves antes de assinar, e o Mattermost pode reordenar campos do contexto ao armazenar o payload.
    - Derive o segredo a partir do token do bot (determinístico), não de bytes aleatórios. O segredo deve ser o mesmo em todo o processo que cria botões e no Gateway que verifica.
  </Accordion>
</AccordionGroup>

## Adaptador de diretório

O Plugin do Mattermost inclui um adaptador de diretório que resolve nomes de canais e usuários por meio da API do Mattermost. Isso habilita destinos `#channel-name` e `@username` em `openclaw message send` e em entregas de Cron/Webhooks.

Nenhuma configuração é necessária — o adaptador usa o token do bot da configuração da conta.

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
  <Accordion title="Sem respostas em canais">
    Certifique-se de que o bot está no canal e mencione-o (oncall), use um prefixo de gatilho (onchar) ou defina `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Erros de autenticação ou várias contas">
    - Verifique o token do bot, a URL base e se a conta está ativada.
    - Problemas com várias contas: variáveis de ambiente se aplicam apenas à conta `default`.
  </Accordion>
  <Accordion title="Falha nos comandos slash nativos">
    - `Unauthorized: invalid command token.`: o OpenClaw não aceitou o token de callback. Causas típicas:
      - o registro do comando slash falhou ou foi concluído apenas parcialmente na inicialização
      - o callback está atingindo o Gateway/conta errado
      - o Mattermost ainda tem comandos antigos apontando para um destino de callback anterior
      - o Gateway reiniciou sem reativar os comandos slash
    - Se os comandos slash nativos pararem de funcionar, verifique os logs em busca de `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Se `callbackUrl` for omitido e os logs avisarem que o callback foi resolvido para `http://127.0.0.1:18789/...`, essa URL provavelmente só está acessível quando o Mattermost é executado no mesmo host/espaço de nomes de rede que o OpenClaw. Em vez disso, defina um `commands.callbackUrl` explícito e acessível externamente.
  </Accordion>
  <Accordion title="Problemas com botões">
    - Os botões aparecem como caixas brancas: o agente pode estar enviando dados de botão malformados. Verifique se cada botão tem os campos `text` e `callback_data`.
    - Os botões são renderizados, mas os cliques não fazem nada: verifique se `AllowedUntrustedInternalConnections` na configuração do servidor Mattermost inclui `127.0.0.1 localhost`, e se `EnablePostActionIntegration` é `true` em ServiceSettings.
    - Os botões retornam 404 ao clicar: o `id` do botão provavelmente contém hífens ou sublinhados. O roteador de ações do Mattermost quebra com IDs não alfanuméricos. Use apenas `[a-zA-Z0-9]`.
    - Logs do Gateway mostram `invalid _token`: incompatibilidade de HMAC. Verifique se você assina todos os campos do contexto (não apenas um subconjunto), usa chaves ordenadas e usa JSON compacto (sem espaços). Veja a seção HMAC acima.
    - Logs do Gateway mostram `missing _token in context`: o campo `_token` não está no contexto do botão. Garanta que ele seja incluído ao montar o payload de integração.
    - A confirmação mostra um ID bruto em vez do nome do botão: `context.action_id` não corresponde ao `id` do botão. Defina ambos com o mesmo valor sanitizado.
    - O agente não conhece botões: adicione `capabilities: ["inlineButtons"]` à configuração do canal Mattermost.
  </Accordion>
</AccordionGroup>

## Relacionado

- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
