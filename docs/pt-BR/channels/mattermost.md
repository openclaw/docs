---
read_when:
    - Configurando o Mattermost
    - Depurando o roteamento do Mattermost
summary: Configuração do bot do Mattermost e configuração do OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-22T04:19:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: dd3059c5e64f417edc02c3e850ddd066e38decda0cbdcea31e1c57136e6bcb1d
    source_path: channels/mattermost.md
    workflow: 15
---

# Mattermost

Status: plugin incluído (token de bot + eventos WebSocket). Canais, grupos e DMs são compatíveis.
Mattermost é uma plataforma de mensagens para equipes auto-hospedável; consulte o site oficial em
[mattermost.com](https://mattermost.com) para detalhes do produto e downloads.

## Plugin incluído

O Mattermost vem como um plugin incluído nas versões atuais do OpenClaw, então compilações
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma versão mais antiga ou em uma instalação personalizada que exclua o Mattermost,
instale-o manualmente:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/mattermost
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Certifique-se de que o plugin do Mattermost esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta de bot do Mattermost e copie o **token do bot**.
3. Copie a **URL base** do Mattermost (por exemplo, `https://chat.example.com`).
4. Configure o OpenClaw e inicie o Gateway.

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

## Comandos de barra nativos

Os comandos de barra nativos são opt-in. Quando habilitados, o OpenClaw registra comandos de barra `oc_*` via
a API do Mattermost e recebe callbacks POST no servidor HTTP do Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use quando o Mattermost não conseguir alcançar o Gateway diretamente (proxy reverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Observações:

- `native: "auto"` assume desabilitado por padrão para o Mattermost. Defina `native: true` para habilitar.
- Se `callbackUrl` for omitido, o OpenClaw deriva uma URL a partir do host/porta do Gateway + `callbackPath`.
- Para configurações com múltiplas contas, `commands` pode ser definido no nível superior ou em
  `channels.mattermost.accounts.<id>.commands` (os valores da conta substituem os campos do nível superior).
- Os callbacks de comando são validados com os tokens por comando retornados pelo
  Mattermost quando o OpenClaw registra os comandos `oc_*`.
- Os callbacks de barra falham com bloqueio por padrão quando o registro falhou, a inicialização foi parcial, ou
  o token de callback não corresponde a um dos comandos registrados.
- Requisito de alcance: o endpoint de callback precisa ser alcançável a partir do servidor Mattermost.
  - Não defina `callbackUrl` como `localhost` a menos que o Mattermost esteja em execução no mesmo host/espaço de nomes de rede que o OpenClaw.
  - Não defina `callbackUrl` como sua URL base do Mattermost a menos que essa URL faça proxy reverso de `/api/channels/mattermost/command` para o OpenClaw.
  - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; um GET deve retornar `405 Method Not Allowed` do OpenClaw, não `404`.
- Requisito de allowlist de saída do Mattermost:
  - Se seu callback apontar para endereços privados/tailnet/internos, defina
    `ServiceSettings.AllowedUntrustedInternalConnections` no Mattermost para incluir o host/domínio do callback.
  - Use entradas de host/domínio, não URLs completas.
    - Bom: `gateway.tailnet-name.ts.net`
    - Ruim: `https://gateway.tailnet-name.ts.net`

## Variáveis de ambiente (conta padrão)

Defina estas variáveis no host do Gateway se você preferir usar variáveis de ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

As variáveis de ambiente se aplicam apenas à conta **padrão** (`default`). Outras contas devem usar valores de configuração.

## Modos de chat

O Mattermost responde a DMs automaticamente. O comportamento em canais é controlado por `chatmode`:

- `oncall` (padrão): responde apenas quando for mencionado com @ em canais.
- `onmessage`: responde a toda mensagem de canal.
- `onchar`: responde quando uma mensagem começa com um prefixo de acionamento.

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

- `onchar` ainda responde a menções explícitas com @.
- `channels.mattermost.requireMention` é respeitado para configurações legadas, mas `chatmode` é o preferido.

## Threads e sessões

Use `channels.mattermost.replyToMode` para controlar se respostas em canais e grupos permanecem no
canal principal ou iniciam uma thread sob a publicação que disparou a ação.

- `off` (padrão): responde em uma thread apenas quando a publicação de entrada já estiver em uma.
- `first`: para publicações de nível superior em canais/grupos, inicia uma thread sob essa publicação e roteia a
  conversa para uma sessão com escopo de thread.
- `all`: o mesmo comportamento de `first` para o Mattermost hoje.
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

- Sessões com escopo de thread usam o id da publicação que disparou a ação como raiz da thread.
- `first` e `all` são atualmente equivalentes porque, assim que o Mattermost tem uma raiz de thread,
  blocos de continuação e mídia continuam nessa mesma thread.

## Controle de acesso (DMs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pareamento).
- Aprovar via:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs públicas: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]`.

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (controlado por menção).
- Adicione remetentes à allowlist com `channels.mattermost.groupAllowFrom` (IDs de usuário são recomendados).
- Substituições de menção por canal ficam em `channels.mattermost.groups.<channelId>.requireMention`
  ou `channels.mattermost.groups["*"].requireMention` para um padrão.
- A correspondência por `@username` é mutável e só é habilitada quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (controlado por menção).
- Observação de runtime: se `channels.mattermost` estiver completamente ausente, o runtime volta para `groupPolicy="allowlist"` para verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido).

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

Use estes formatos de destino com `openclaw message send` ou cron/Webhooks:

- `channel:<id>` para um canal
- `user:<id>` para uma DM
- `@username` para uma DM (resolvida via a API do Mattermost)

IDs opacos simples (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário vs ID de canal).

O OpenClaw os resolve com **prioridade para usuário**:

- Se o ID existir como usuário (`GET /api/v4/users/<id>` tiver sucesso), o OpenClaw envia uma **DM** resolvendo o canal direto via `/api/v4/channels/direct`.
- Caso contrário, o ID é tratado como um **ID de canal**.

Se você precisar de comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).

## Nova tentativa de canal DM

Quando o OpenClaw envia para um destino DM do Mattermost e precisa resolver primeiro o canal direto, ele
repete por padrão falhas transitórias na criação do canal direto.

Use `channels.mattermost.dmChannelRetry` para ajustar esse comportamento globalmente para o plugin do Mattermost,
ou `channels.mattermost.accounts.<id>.dmChannelRetry` para uma conta.

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

- Isso se aplica apenas à criação de canal DM (`/api/v4/channels/direct`), não a todas as chamadas da API do Mattermost.
- As novas tentativas se aplicam a falhas transitórias, como limites de taxa, respostas 5xx e erros de rede ou timeout.
- Erros de cliente 4xx, exceto `429`, são tratados como permanentes e não são repetidos.

## Streaming de prévia

O Mattermost faz streaming de raciocínio, atividade de ferramentas e texto parcial de resposta em uma única **publicação de prévia em rascunho** que é finalizada no mesmo lugar quando a resposta final é segura para envio. A prévia é atualizada no mesmo id de publicação em vez de poluir o canal com mensagens por bloco. Finais de mídia/erro cancelam edições de prévia pendentes e usam entrega normal em vez de descarregar uma publicação de prévia descartável.

Habilite com `channels.mattermost.streaming`:

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

Observações:

- `partial` é a escolha usual: uma publicação de prévia que é editada conforme a resposta cresce, depois finalizada com a resposta completa.
- `block` usa blocos de rascunho no estilo append dentro da publicação de prévia.
- `progress` mostra uma prévia de status durante a geração e só publica a resposta final na conclusão.
- `off` desabilita o streaming de prévia.
- Se o stream não puder ser finalizado no mesmo lugar (por exemplo, se a publicação for excluída no meio do stream), o OpenClaw recorre ao envio de uma nova publicação final para que a resposta nunca seja perdida.
- Consulte [Streaming](/pt-BR/concepts/streaming#preview-streaming-modes) para a matriz de mapeamento por canal.

## Reações (ferramenta de mensagem)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é o id da publicação do Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (os dois-pontos são opcionais).
- Defina `remove=true` (booleano) para remover uma reação.
- Eventos de adição/remoção de reação são encaminhados como eventos de sistema para a sessão do agente roteada.

Exemplos:

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuração:

- `channels.mattermost.actions.reactions`: habilita/desabilita ações de reação (padrão true).
- Substituição por conta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botões interativos (ferramenta de mensagem)

Envie mensagens com botões clicáveis. Quando um usuário clicar em um botão, o agente receberá a
seleção e poderá responder.

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

Use `message action=send` com um parâmetro `buttons`. Os botões são um array 2D (linhas de botões):

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Campos do botão:

- `text` (obrigatório): rótulo exibido.
- `callback_data` (obrigatório): valor enviado de volta ao clicar (usado como ID da ação).
- `style` (opcional): `"default"`, `"primary"` ou `"danger"`.

Quando um usuário clica em um botão:

1. Todos os botões são substituídos por uma linha de confirmação (por exemplo, "✓ **Yes** selected by @user").
2. O agente recebe a seleção como uma mensagem de entrada e responde.

Observações:

- Callbacks de botão usam verificação HMAC-SHA256 (automática, nenhuma configuração necessária).
- O Mattermost remove os dados de callback de suas respostas da API (recurso de segurança), então todos os botões
  são removidos ao clicar — a remoção parcial não é possível.
- IDs de ação que contêm hífens ou sublinhados são sanitizados automaticamente
  (limitação de roteamento do Mattermost).

Configuração:

- `channels.mattermost.capabilities`: array de strings de capacidade. Adicione `"inlineButtons"` para
  habilitar a descrição da ferramenta de botões no prompt de sistema do agente.
- `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para callbacks de botões
  (por exemplo, `https://gateway.example.com`). Use isso quando o Mattermost não conseguir
  alcançar o Gateway diretamente no host de bind.
- Em configurações com múltiplas contas, você também pode definir o mesmo campo em
  `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
- Se `interactions.callbackBaseUrl` for omitido, o OpenClaw deriva a URL de callback de
  `gateway.customBindHost` + `gateway.port`, depois recorre a `http://localhost:<port>`.
- Regra de alcance: a URL de callback do botão precisa ser alcançável a partir do servidor Mattermost.
  `localhost` só funciona quando Mattermost e OpenClaw executam no mesmo host/espaço de nomes de rede.
- Se o destino do callback for privado/tailnet/interno, adicione seu host/domínio a
  `ServiceSettings.AllowedUntrustedInternalConnections` no Mattermost.

### Integração direta com a API (scripts externos)

Scripts externos e Webhooks podem publicar botões diretamente pela API REST do Mattermost
em vez de passar pela ferramenta `message` do agente. Use `buildButtonAttachments()` da
extensão sempre que possível; se publicar JSON bruto, siga estas regras:

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

**Regras críticas:**

1. Attachments vão em `props.attachments`, não em `attachments` no nível superior (são ignorados silenciosamente).
2. Toda action precisa de `type: "button"` — sem isso, os cliques são engolidos silenciosamente.
3. Toda action precisa de um campo `id` — o Mattermost ignora actions sem IDs.
4. O `id` da action deve ser **somente alfanumérico** (`[a-zA-Z0-9]`). Hífens e sublinhados quebram
   o roteamento de action do Mattermost no lado do servidor (retorna 404). Remova-os antes de usar.
5. `context.action_id` precisa corresponder ao `id` do botão para que a mensagem de confirmação mostre o
   nome do botão (por exemplo, "Approve") em vez de um ID bruto.
6. `context.action_id` é obrigatório — o handler de interação retorna 400 sem ele.

**Geração de token HMAC:**

O Gateway verifica cliques em botões com HMAC-SHA256. Scripts externos devem gerar tokens
que correspondam à lógica de verificação do Gateway:

1. Derive o secret a partir do token do bot:
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. Monte o objeto de contexto com todos os campos **exceto** `_token`.
3. Serialize com **chaves ordenadas** e **sem espaços** (o Gateway usa `JSON.stringify`
   com chaves ordenadas, o que produz saída compacta).
4. Assine: `HMAC-SHA256(key=secret, data=serializedContext)`
5. Adicione o digest hexadecimal resultante como `_token` no contexto.

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

Armadilhas comuns de HMAC:

- `json.dumps` do Python adiciona espaços por padrão (`{"key": "val"}`). Use
  `separators=(",", ":")` para corresponder à saída compacta do JavaScript (`{"key":"val"}`).
- Sempre assine **todos** os campos do contexto (menos `_token`). O Gateway remove `_token` e então
  assina tudo o que resta. Assinar apenas um subconjunto causa falha silenciosa de verificação.
- Use `sort_keys=True` — o Gateway ordena as chaves antes de assinar, e o Mattermost pode
  reordenar os campos do contexto ao armazenar o payload.
- Derive o secret a partir do token do bot (determinístico), não de bytes aleatórios. O secret
  precisa ser o mesmo em todo o processo que cria os botões e no Gateway que faz a verificação.

## Adaptador de diretório

O plugin do Mattermost inclui um adaptador de diretório que resolve nomes de canais e usuários
via a API do Mattermost. Isso habilita destinos `#channel-name` e `@username` em
`openclaw message send` e em entregas de cron/Webhook.

Nenhuma configuração é necessária — o adaptador usa o token do bot da configuração da conta.

## Múltiplas contas

O Mattermost oferece suporte a múltiplas contas em `channels.mattermost.accounts`:

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

- Sem respostas em canais: verifique se o bot está no canal e mencione-o (oncall), use um prefixo de acionamento (onchar) ou defina `chatmode: "onmessage"`.
- Erros de autenticação: verifique o token do bot, a URL base e se a conta está habilitada.
- Problemas com múltiplas contas: variáveis de ambiente se aplicam apenas à conta `default`.
- Comandos de barra nativos retornam `Unauthorized: invalid command token.`: o OpenClaw
  não aceitou o token de callback. Causas típicas:
  - o registro do comando de barra falhou ou foi concluído apenas parcialmente na inicialização
  - o callback está atingindo o Gateway/conta errado
  - o Mattermost ainda tem comandos antigos apontando para um destino de callback anterior
  - o Gateway foi reiniciado sem reativar os comandos de barra
- Se os comandos de barra nativos pararem de funcionar, verifique os logs por
  `mattermost: failed to register slash commands` ou
  `mattermost: native slash commands enabled but no commands could be registered`.
- Se `callbackUrl` for omitido e os logs alertarem que o callback foi resolvido para
  `http://127.0.0.1:18789/...`, essa URL provavelmente só é alcançável quando o
  Mattermost executa no mesmo host/espaço de nomes de rede que o OpenClaw. Defina uma
  `commands.callbackUrl` explícita e externamente alcançável.
- Os botões aparecem como caixas brancas: o agente pode estar enviando dados de botão malformados. Verifique se cada botão tem os campos `text` e `callback_data`.
- Os botões são renderizados, mas os cliques não fazem nada: verifique se `AllowedUntrustedInternalConnections` na configuração do servidor Mattermost inclui `127.0.0.1 localhost`, e se `EnablePostActionIntegration` é `true` em ServiceSettings.
- Os botões retornam 404 ao clicar: o `id` do botão provavelmente contém hífens ou sublinhados. O roteador de actions do Mattermost quebra com IDs não alfanuméricos. Use apenas `[a-zA-Z0-9]`.
- Logs do Gateway mostram `invalid _token`: incompatibilidade de HMAC. Verifique se você assina todos os campos do contexto (não apenas um subconjunto), usa chaves ordenadas e JSON compacto (sem espaços). Consulte a seção de HMAC acima.
- Logs do Gateway mostram `missing _token in context`: o campo `_token` não está no contexto do botão. Certifique-se de incluí-lo ao montar o payload de integração.
- A confirmação mostra um ID bruto em vez do nome do botão: `context.action_id` não corresponde ao `id` do botão. Defina ambos com o mesmo valor sanitizado.
- O agente não sabe sobre botões: adicione `capabilities: ["inlineButtons"]` à configuração do canal Mattermost.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
